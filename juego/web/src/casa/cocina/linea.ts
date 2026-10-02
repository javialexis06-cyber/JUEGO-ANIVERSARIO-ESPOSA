// Cocinar en pareja, cada uno en su celular. El que invita (anfitrión) lleva la verdad del día: los invitados, los
// tiquetes, el reloj, las calificaciones y las propinas. Lo que se cocina (cada plato de un tiquete y cada máquina:
// waffleras, rejilla, batidoras, licuadoras) es un «objeto» con versión que cualquiera de los dos puede cambiar:
// el que lo cambia sube la versión y lo manda; gana la versión más alta y, si empatan, la del anfitrión. El invitado
// le pide al anfitrión lo que solo él decide (tomar un pedido, entregar, pausar…) y lo repite hasta ver la respuesta.
// Cada segundo el anfitrión manda la foto completa (así lo que se pierda en la red se arregla solo) y los dos se
// mandan un latido: si el otro deja de oírse, se pausa con aviso.
// Viaja por Supabase Realtime (broadcast + presencia, el mismo canal de la pareja) o, con la casa local y en las
// pruebas, por un BroadcastChannel entre pestañas.
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Rol } from '../modelo';

export interface Presencia {
  /** Estación que está mirando (0 = pedidos). */
  est: number;
  /** Tiquete que tiene escogido (0 = ninguno). */
  act: number;
  /** Dedo (en fracciones de la pantalla) y si está tocando. */
  x: number;
  y: number;
  dedo: boolean;
  herr: string | null;
}

export interface Obj {
  k: string;
  v: number;
  por: Rol;
  d: unknown;
}
export interface Accion {
  aid: string;
  a: string;
  d?: unknown;
}
/** Lo que el anfitrión le pasa al invitado para montar el mismo restaurante. */
export interface ConfigCompartida {
  receta: string;
  dia: number;
  rango: number;
  mejoras: Record<string, number>;
  nombreAnfitrion: string;
}

export type Msg =
  | { t: 'hola'; id: string; de: Rol; anf: boolean }
  | { t: 'unirse'; id: string; de: Rol }
  | { t: 'config'; id: string; c: ConfigCompartida }
  | { t: 'paq'; id: string; de: Rol; objs?: Obj[]; foto?: boolean; vers?: Record<string, number>; yo?: Presencia; acc?: Accion[]; ack?: string[] }
  | { t: 'salir'; id: string; de: Rol };

// ---------------------------------------------------------------------------------------------- Transportes
export interface Transporte {
  conectar(): Promise<boolean>;
  mandar(m: Msg): void;
  alLlegar: (m: Msg) => void;
  cerrar(): void;
  error: string;
}

/** Supabase Realtime: el canal «cocina-<pareja>» (broadcast, sin eco). */
export class TransporteSupabase implements Transporte {
  alLlegar: (m: Msg) => void = () => {};
  error = '';
  private canal: RealtimeChannel | null = null;
  constructor(private yo: Rol) {}
  async conectar() {
    try {
      const { conexionPareja } = await import('../sincro');
      const c = await conexionPareja();
      if (!c) {
        this.error = 'Este celular no está en la casa en línea.';
        return false;
      }
      this.yo = c.sesion.rol;
      return await new Promise<boolean>((listo) => {
        this.canal = c.sb
          .channel(`cocina-${c.sesion.parejaId}`, { config: { broadcast: { self: false }, presence: { key: this.yo } } })
          .on('broadcast', { event: 'cocina' }, ({ payload }) => this.alLlegar(payload as Msg))
          .subscribe((s) => {
            if (s === 'SUBSCRIBED') {
              void this.canal!.track({ rol: this.yo, t: Date.now() });
              listo(true);
            } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') listo(false);
          });
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      return false;
    }
  }
  mandar(m: Msg) {
    void this.canal?.send({ type: 'broadcast', event: 'cocina', payload: m });
  }
  cerrar() {
    void this.canal?.unsubscribe();
    this.canal = null;
  }
}

/** Entre pestañas del mismo navegador (la casa local y las pruebas). */
export class TransporteLocal implements Transporte {
  alLlegar: (m: Msg) => void = () => {};
  error = '';
  private bc: BroadcastChannel | null = null;
  constructor(private yo: Rol) {}
  async conectar() {
    try {
      this.bc = new BroadcastChannel('nuestro-hogar-cocina');
      this.bc.onmessage = (e) => {
        const m = e.data as Msg;
        if (m && m.t && 'de' in m && m.de === this.yo) return;
        this.alLlegar(m);
      };
      return true;
    } catch {
      this.error = 'Este navegador no deja hablar entre pestañas.';
      return false;
    }
  }
  mandar(m: Msg) {
    this.bc?.postMessage(m);
  }
  cerrar() {
    this.bc?.close();
    this.bc = null;
  }
}

// ---------------------------------------------------------------------------------------------- Sincronización
export interface Ganchos {
  /** El valor actual de un objeto (se manda tal cual; debe ser JSON). */
  leer(k: string): unknown;
  /** Llegó un objeto más nuevo: reemplazarlo. */
  escribir(k: string, d: unknown): void;
  /** Todos los objetos que existen ahora (para la foto completa). */
  claves(): string[];
  /** (Anfitrión) el invitado pidió algo. */
  accion(a: string, d: unknown, aid: string): void;
  /** (Invitado) llegó la configuración del restaurante del anfitrión. */
  config(c: ConfigCompartida): void;
  /** (Anfitrión) el invitado entró a la cocina. */
  llego(): void;
  /** El otro se fue de la cocina. */
  salio(): void;
  /** Se cortó o volvió la conexión. */
  conexion(bien: boolean): void;
}

const ahora = () => performance.now();
let contador = 0;
const nuevoId = () => `${Date.now().toString(36)}${(contador++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export class Sincro {
  /** Ya se oyó al otro (y sigue oyéndose). */
  conectado = false;
  /** El otro ya entró a esta cocina (después del saludo). */
  juntos = false;
  otro: Presencia | null = null;
  private vers = new Map<string, { v: number; por: Rol }>();
  private sucios = new Set<string>();
  private acciones: (Accion & { t0: number; ultimo: number })[] = [];
  private procesadas: string[] = [];
  private acksNuevos: string[] = [];
  private yoPresencia: Presencia | null = null;
  private yoCambio = false;
  private ultimoDelOtro = 0;
  private ultimoEnvio = 0;
  private ultimaFoto = 0;
  private ultimoHola = 0;
  private reloj = 0;
  private cerrado = false;
  /** Para las pruebas: cuántos mensajes y bytes van. */
  stats = { enviados: 0, recibidos: 0, bytes: 0 };

  constructor(public yo: Rol, public anfitrion: boolean, public id: string, private tr: Transporte, private g: Ganchos, private config: () => ConfigCompartida) {
    tr.alLlegar = (m) => this.recibir(m);
  }

  get otroRol(): Rol {
    return this.yo === 'el' ? 'ella' : 'el';
  }

  async conectar() {
    const ok = await this.tr.conectar();
    if (ok) this.saludar();
    return ok;
  }
  get error() {
    return this.tr.error;
  }

  private mandar(m: Msg) {
    if (this.cerrado) return;
    this.stats.enviados++;
    try {
      this.stats.bytes += JSON.stringify(m).length;
    } catch {
      /* nada */
    }
    this.tr.mandar(m);
  }

  private saludar() {
    this.ultimoHola = ahora();
    if (this.anfitrion) this.mandar({ t: 'hola', id: this.id, de: this.yo, anf: true });
    else this.mandar({ t: 'unirse', id: this.id, de: this.yo });
  }

  /** Lo cambié yo: sube la versión y queda para mandar. */
  cambio(k: string) {
    const v = this.vers.get(k);
    this.vers.set(k, { v: (v?.v ?? 0) + 1, por: this.yo });
    this.sucios.add(k);
  }
  /** Un objeto nuevo que nace en este celular (versión 0, sin mandar todavía). */
  nace(k: string) {
    if (!this.vers.has(k)) this.vers.set(k, { v: 0, por: this.yo });
  }
  olvidar(k: string) {
    this.vers.delete(k);
    this.sucios.delete(k);
  }
  version(k: string) {
    return this.vers.get(k)?.v ?? 0;
  }

  /** Al volver de segundo plano: no se cuenta como corte el rato afuera, se saluda y el anfitrión manda la foto ya. */
  despertar() {
    if (this.cerrado) return;
    this.ultimoDelOtro = ahora();
    this.ultimaFoto = 0;
    this.saludar();
    this.enviar(true);
  }

  /** (Invitado) pedirle algo al anfitrión. */
  pedir(a: string, d?: unknown) {
    const aid = nuevoId();
    this.acciones.push({ aid, a, d, t0: ahora(), ultimo: 0 });
    this.enviar(true);
    return aid;
  }

  /** (Anfitrión) ya se hizo lo que pidió el invitado. */
  hecha(aid: string) {
    this.acksNuevos.push(aid);
  }

  presencia(p: Presencia) {
    const a = this.yoPresencia;
    if (!a || a.est !== p.est || a.act !== p.act || a.dedo !== p.dedo || a.herr !== p.herr || Math.abs(a.x - p.x) > 0.01 || Math.abs(a.y - p.y) > 0.01) {
      this.yoPresencia = { ...p };
      this.yoCambio = true;
    }
  }

  paso(dt: number) {
    if (this.cerrado) return;
    this.reloj += dt;
    const t = ahora();
    // Saludo hasta que el otro aparezca (y de vez en cuando después, por si se reconectó)
    if (!this.juntos && t - this.ultimoHola > 1000) this.saludar();
    // ¿Se cortó?
    const oido = t - this.ultimoDelOtro < 4500;
    if (this.juntos && oido !== this.conectado) {
      this.conectado = oido;
      this.g.conexion(oido);
    }
    // Foto completa del anfitrión cada segundo
    if (this.anfitrion && this.juntos && t - this.ultimaFoto > 1000) {
      this.ultimaFoto = t;
      this.foto();
      return;
    }
    // El invitado repite lo que pidió y no ha visto hecho
    if (!this.anfitrion) {
      this.acciones = this.acciones.filter((a) => t - a.t0 < 12000);
    }
    const hayAcc = !this.anfitrion && this.acciones.some((a) => t - a.ultimo > 900);
    const toca = t - this.ultimoEnvio > 110;
    if (toca && (this.sucios.size || this.yoCambio || hayAcc || this.acksNuevos.length)) this.enviar();
    else if (t - this.ultimoEnvio > 1000) this.enviar(); // latido
  }

  /** Manda lo pendiente (objetos cambiados, presencia, acciones) en un solo paquete. */
  enviar(urgente = false) {
    const t = ahora();
    if (!urgente && t - this.ultimoEnvio < 60) return;
    this.ultimoEnvio = t;
    const objs: Obj[] = [];
    for (const k of this.sucios) {
      const v = this.vers.get(k);
      const d = this.g.leer(k);
      if (v && d !== undefined) objs.push({ k, v: v.v, por: v.por, d });
    }
    this.sucios.clear();
    const m: Msg = { t: 'paq', id: this.id, de: this.yo };
    if (objs.length) m.objs = objs;
    if (this.yoPresencia && (this.yoCambio || objs.length === 0)) m.yo = this.yoPresencia;
    this.yoCambio = false;
    if (!this.anfitrion) {
      const acc = this.acciones.filter((a) => t - a.ultimo > 900 || a.ultimo === 0);
      if (acc.length) {
        m.acc = acc.map(({ aid, a, d }) => ({ aid, a, d }));
        for (const a of acc) a.ultimo = t;
      }
    } else if (this.acksNuevos.length) {
      m.ack = this.acksNuevos.splice(0);
    }
    this.mandar(m);
  }

  /** (Anfitrión) todo el estado, con las versiones (también sirve de confirmación). */
  foto() {
    const objs: Obj[] = [];
    const vers: Record<string, number> = {};
    for (const k of this.g.claves()) {
      const d = this.g.leer(k);
      if (d === undefined) continue;
      if (!this.vers.has(k)) this.vers.set(k, { v: 0, por: this.yo });
      const v = this.vers.get(k)!;
      objs.push({ k, v: v.v, por: v.por, d });
      vers[k] = v.v;
    }
    this.sucios.clear();
    this.ultimoEnvio = ahora();
    const m: Msg = { t: 'paq', id: this.id, de: this.yo, objs, foto: true, vers, ack: this.procesadas.slice(-40) };
    if (this.yoPresencia) m.yo = this.yoPresencia;
    this.yoCambio = false;
    this.acksNuevos.length = 0;
    this.mandar(m);
  }

  private recibir(m: Msg) {
    if (this.cerrado || !m || m.id !== this.id) return;
    if ('de' in m && m.de === this.yo) return;
    this.stats.recibidos++;
    this.ultimoDelOtro = ahora();
    if (m.t === 'hola') {
      // (Invitado) el anfitrión está: pido entrar
      if (!this.anfitrion && !this.juntos) this.mandar({ t: 'unirse', id: this.id, de: this.yo });
      return;
    }
    if (m.t === 'unirse') {
      if (!this.anfitrion) return;
      // Siempre se le contesta (si se reconectó, vuelve a recibir la configuración y la foto)
      this.mandar({ t: 'config', id: this.id, c: this.config() });
      if (!this.juntos) {
        this.juntos = true;
        this.conectado = true;
        this.g.llego();
      }
      this.ultimaFoto = 0;
      return;
    }
    if (m.t === 'config') {
      if (this.anfitrion) return;
      const primera = !this.juntos;
      this.juntos = true;
      this.conectado = true;
      if (primera) this.g.config(m.c);
      return;
    }
    if (m.t === 'salir') {
      this.g.salio();
      return;
    }
    if (m.t !== 'paq') return;
    if (!this.juntos) {
      // Un paquete de una sesión que ya estaba andando (se reconectó): el anfitrión le reenvía todo
      if (this.anfitrion) {
        this.juntos = true;
        this.conectado = true;
        this.mandar({ t: 'config', id: this.id, c: this.config() });
        this.g.llego();
      } else return;
    }
    if (m.yo) this.otro = m.yo;
    for (const o of m.objs ?? []) {
      const loc = this.vers.get(o.k);
      const acepta = !loc || (this.anfitrion ? o.v > loc.v : o.v >= loc.v);
      if (!acepta) continue;
      this.vers.set(o.k, { v: o.v, por: o.por });
      this.sucios.delete(o.k);
      this.g.escribir(o.k, o.d);
    }
    // (Invitado) lo mío que el anfitrión todavía no tiene: se vuelve a mandar
    if (!this.anfitrion && m.vers) {
      for (const [k, v] of this.vers) if (v.por === this.yo && (m.vers[k] ?? -1) < v.v && k in m.vers) this.sucios.add(k);
    }
    if (m.ack) {
      const hechas = new Set(m.ack);
      this.acciones = this.acciones.filter((a) => !hechas.has(a.aid));
    }
    if (this.anfitrion && m.acc) {
      for (const a of m.acc) {
        if (this.procesadas.includes(a.aid)) {
          this.acksNuevos.push(a.aid);
          continue;
        }
        this.procesadas.push(a.aid);
        if (this.procesadas.length > 200) this.procesadas.splice(0, 100);
        this.g.accion(a.a, a.d, a.aid);
        this.acksNuevos.push(a.aid);
      }
    }
  }

  /** Se va de la cocina (le avisa al otro un par de veces por si se pierde). */
  salir() {
    if (this.cerrado) return;
    const m: Msg = { t: 'salir', id: this.id, de: this.yo };
    this.mandar(m);
    setTimeout(() => this.tr.mandar(m), 250);
    setTimeout(() => {
      this.cerrado = true;
      this.tr.cerrar();
    }, 600);
  }
}
