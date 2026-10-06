// Cocinar juntos, de 2 a 4, cada uno en su celular, sobre las salas (src/salas/, docs/salas.md): Javier y Laura,
// o con amigos. El anfitrión (quien abrió la sala) lleva la verdad del día: los invitados, los tiquetes, el reloj,
// las calificaciones y las propinas. Lo que se cocina (cada plato de un tiquete y cada máquina: waffleras, rejilla,
// batidoras, licuadoras) es un «objeto» con versión que cualquiera puede cambiar: el que lo cambia sube la versión
// y lo manda a todos; gana la versión más alta y, si empatan, la del anfitrión. Los demás le piden al anfitrión lo
// que solo él decide (tomar un pedido, entregar, pausar…) con mensajes fiables de la sala (llegan una vez y en orden).
// Cada segundo el anfitrión manda la foto completa (así lo que se pierda en la red se arregla solo); los cortes, el
// segundo plano y quién se fue los avisa la sala.
import type { JugadorSala, Sala } from '../../salas/tipos';

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
  /** Id del jugador que hizo esta versión. */
  por: string;
  d: unknown;
}

/** Un paquete (rápido, sin garantía): lo que cambié y dónde estoy; la foto del anfitrión trae todo con versiones. */
interface Paq {
  objs?: Obj[];
  foto?: boolean;
  vers?: Record<string, number>;
  yo?: Presencia;
}

/** Los tipos de mensaje de la cocina en la sala. */
export const MSJ_COCINA = { paquete: 'cocina:p', accion: 'cocina:a', sala: 'cocina:sala' } as const;

export interface Ganchos {
  /** El valor actual de un objeto (se manda tal cual; debe ser JSON). */
  leer(k: string): unknown;
  /** Llegó un objeto más nuevo: reemplazarlo. */
  escribir(k: string, d: unknown): void;
  /** Todos los objetos que existen ahora (para la foto completa). */
  claves(): string[];
  /** (Anfitrión) alguien pidió algo. */
  accion(a: string, d: unknown, de: string): void;
  /** Alguien se fue de la sala (y de la cocina). */
  salio(j: JugadorSala): void;
  /** Cambió quién está sin conexión (lista vacía: todos están). */
  conexion(cortados: JugadorSala[]): void;
  /** (Los demás) el anfitrión los mandó de vuelta a la sala de espera. */
  aLaSala(): void;
}

const ahora = () => performance.now();

export class Sincro {
  /** Lo último que se sabe de dónde está cada uno de los demás (por id). */
  otros = new Map<string, Presencia>();
  readonly yo: string;
  readonly idAnfitrion: string;
  private vers = new Map<string, { v: number; por: string }>();
  private sucios = new Set<string>();
  private yoPresencia: Presencia | null = null;
  private yoCambio = false;
  private ultimoEnvio = 0;
  private ultimaFoto = 0;
  private cerrado = false;
  private quitar: (() => void)[] = [];
  private cortados = new Set<string>();
  private presentes: Set<string>;
  /** Para las pruebas: cuántos mensajes y bytes van. */
  stats = { enviados: 0, recibidos: 0, bytes: 0 };

  constructor(public readonly sala: Sala, public readonly anfitrion: boolean, private g: Ganchos) {
    this.yo = sala.yo.id;
    this.idAnfitrion = sala.jugadores.find((j) => j.puesto === 0)?.id ?? (anfitrion ? this.yo : '');
    this.presentes = new Set(sala.jugadores.map((j) => j.id));
    this.quitar.push(
      sala.al(MSJ_COCINA.paquete, (d, de) => this.recibir(d as Paq, de.id)),
      sala.al(MSJ_COCINA.accion, (d, de) => {
        if (!this.anfitrion || this.cerrado) return;
        const a = d as { a?: unknown; d?: unknown } | null;
        if (a && typeof a.a === 'string') this.g.accion(a.a, a.d, de.id);
      }),
      sala.al(MSJ_COCINA.sala, (_d, de) => {
        if (!this.cerrado && de.id === this.idAnfitrion) this.g.aLaSala();
      }),
      sala.alCorte((cortado, quien) => {
        if (quien.id === this.yo) return;
        if (cortado) this.cortados.add(quien.id);
        else this.cortados.delete(quien.id);
        // Al volver, la foto completa sale ya (lo que se perdió mientras tanto se arregla solo)
        if (!cortado) this.ultimaFoto = 0;
        this.g.conexion(this.listaCortados());
      }),
      sala.alCambiar((js) => {
        const ahoraIds = new Set(js.map((j) => j.id));
        for (const id of [...this.presentes]) {
          if (ahoraIds.has(id)) continue;
          this.presentes.delete(id);
          this.otros.delete(id);
          this.cortados.delete(id);
          const j = this.ultimaLista.find((x) => x.id === id);
          if (j) this.g.salio(j);
        }
        for (const id of ahoraIds) this.presentes.add(id);
        this.ultimaLista = js.map((j) => ({ ...j }));
      }),
    );
    this.ultimaLista = sala.jugadores.map((j) => ({ ...j }));
  }
  private ultimaLista: JugadorSala[];

  /** Los que siguen en la cocina conmigo (sin mí). */
  get companeros(): JugadorSala[] {
    return this.sala.jugadores.filter((j) => j.id !== this.yo);
  }
  /** ¿Están todos conectados? */
  get conectado() {
    return this.cortados.size === 0;
  }
  listaCortados(): JugadorSala[] {
    return this.sala.jugadores.filter((j) => this.cortados.has(j.id));
  }
  /** No esperar más a alguien que se cortó (el anfitrión sigue sin él; si vuelve, entra de una). */
  olvidarCorte(id: string) {
    this.cortados.delete(id);
  }

  private mandar(tipo: string, d: unknown, rapido: boolean, a?: string) {
    if (this.cerrado) return;
    this.stats.enviados++;
    try {
      this.stats.bytes += JSON.stringify(d).length;
    } catch {
      /* nada */
    }
    this.sala.mandar(tipo, d, { rapido, a });
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

  /** Al volver de segundo plano: el anfitrión manda la foto ya. */
  despertar() {
    if (this.cerrado) return;
    this.ultimaFoto = 0;
    this.enviar(true);
  }

  /** (Los demás) pedirle algo al anfitrión (fiable: llega una vez y en orden). */
  pedir(a: string, d?: unknown) {
    if (this.anfitrion) return;
    this.mandar(MSJ_COCINA.accion, { a, d }, false, this.idAnfitrion);
  }

  /** (Anfitrión) todos de vuelta a la sala de espera. */
  volverTodosALaSala() {
    if (this.anfitrion) this.mandar(MSJ_COCINA.sala, {}, false);
  }

  presencia(p: Presencia) {
    const a = this.yoPresencia;
    if (!a || a.est !== p.est || a.act !== p.act || a.dedo !== p.dedo || a.herr !== p.herr || Math.abs(a.x - p.x) > 0.01 || Math.abs(a.y - p.y) > 0.01) {
      this.yoPresencia = { ...p };
      this.yoCambio = true;
    }
  }

  paso(_dt: number) {
    if (this.cerrado) return;
    const t = ahora();
    // Foto completa del anfitrión cada segundo
    if (this.anfitrion && t - this.ultimaFoto > 1000) {
      this.ultimaFoto = t;
      this.foto();
      return;
    }
    const toca = t - this.ultimoEnvio > 110;
    if (toca && (this.sucios.size || this.yoCambio)) this.enviar();
  }

  /** Manda lo pendiente (objetos cambiados y dónde estoy) en un solo paquete. */
  enviar(urgente = false) {
    const t = ahora();
    if (!urgente && t - this.ultimoEnvio < 60) return;
    if (!this.sucios.size && !this.yoCambio && !urgente) return;
    this.ultimoEnvio = t;
    const objs: Obj[] = [];
    for (const k of this.sucios) {
      const v = this.vers.get(k);
      const d = this.g.leer(k);
      if (v && d !== undefined) objs.push({ k, v: v.v, por: v.por, d });
    }
    this.sucios.clear();
    const m: Paq = {};
    if (objs.length) m.objs = objs;
    if (this.yoPresencia) m.yo = this.yoPresencia;
    this.yoCambio = false;
    this.mandar(MSJ_COCINA.paquete, m, true);
  }

  /** (Anfitrión) todo el estado, con las versiones. */
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
    const m: Paq = { objs, foto: true, vers };
    if (this.yoPresencia) m.yo = this.yoPresencia;
    this.yoCambio = false;
    this.mandar(MSJ_COCINA.paquete, m, true);
  }

  private recibir(m: Paq, de: string) {
    if (this.cerrado || !m || typeof m !== 'object' || de === this.yo) return;
    this.stats.recibidos++;
    if (m.yo) this.otros.set(de, m.yo);
    const delAnfitrion = de === this.idAnfitrion;
    for (const o of m.objs ?? []) {
      if (!o || typeof o.k !== 'string' || typeof o.v !== 'number') continue;
      const loc = this.vers.get(o.k);
      // El anfitrión solo acepta lo más nuevo; los demás, lo más nuevo o el empate que dice el anfitrión
      const acepta = !loc || o.v > loc.v || (!this.anfitrion && delAnfitrion && o.v === loc.v);
      if (!acepta) continue;
      this.vers.set(o.k, { v: o.v, por: typeof o.por === 'string' ? o.por : de });
      this.sucios.delete(o.k);
      this.g.escribir(o.k, o.d);
    }
    // (Los demás) lo mío que el anfitrión todavía no tiene: se vuelve a mandar
    if (!this.anfitrion && delAnfitrion && m.vers) {
      for (const [k, v] of this.vers) if (v.por === this.yo && k in m.vers && (m.vers[k] ?? -1) < v.v) this.sucios.add(k);
    }
  }

  /** Deja de escuchar la sala (la sala misma la cierra quien la abrió). */
  cerrar() {
    if (this.cerrado) return;
    this.cerrado = true;
    for (const q of this.quitar.splice(0)) q();
  }
}
