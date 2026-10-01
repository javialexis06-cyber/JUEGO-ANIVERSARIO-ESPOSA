// Cien Puertas en pareja: el canal entre los dos celulares (Supabase Realtime, broadcast + presencia, el mismo de la
// casa). Quien invita es el anfitrión: aplica las reglas de cada acertijo y le manda al otro una foto del cuarto
// varias veces por segundo; el invitado manda sus dedos y sus sensores. Todo viaja en paquetes (uno cada 125 ms si hay
// algo que decir y un latido cada segundo): los movimientos van numerados y se repiten en cada paquete hasta que el
// otro confirma que le llegaron (así un mensaje perdido no daña nada), y lo que solo importa en su última versión
// (la foto, el candado abierto, las texturas pintadas) se manda hasta que el otro diga qué versión tiene.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { otro, type Rol } from '../casa/modelo';
import type { DedoRed } from './entrada';

export interface InvPuertas {
  id: string;
  puerta: number;
  de: Rol;
}

/** Lo que se ve de un candado, un teclado o una nota que se resuelve en el otro celular. */
export interface FotoPanel {
  abierto: 'ruedas' | 'teclado' | 'nota' | null;
  clase: string;
  html: string;
}

/** Lo que viaja en orden y sin perderse. */
export type Mov =
  /** (anfitrión) Empieza la puerta n: con qué semilla y dónde quedó cada cosa del desorden. */
  | { t: 'puerta'; n: number; desorden: unknown }
  /** (anfitrión) La puerta n se abrió. */
  | { t: 'res'; n: number }
  /** (invitado) Un dedo sobre el cuarto. */
  | { t: 'dedo'; d: DedoRed }
  /** (invitado) Un sensor: sacudir, voltear, apagar la pantalla, soplar. */
  | { t: 'sensor'; k: 'sacudida' | 'volteo' | 'pantalla' | 'soplido'; v: number }
  /** (invitado) Tocó un botón del candado que abrió (o lo cerró). */
  | { t: 'pulsar'; i: number }
  | { t: 'cerrarPanel' }
  /** (anfitrión) Mirar de cerca algo (lo pidió un dedo del invitado) y volver. */
  | { t: 'enfocar'; p: number[]; d: number }
  | { t: 'volver' }
  /** (anfitrión) Avisos, caras del narrador y sonidos del acertijo. */
  | { t: 'aviso'; texto: string; ms?: number }
  | { t: 'cara'; k: 'bien' | 'mal' }
  | { t: 'sonido'; f: string; a: unknown[] }
  /** (los dos) Se compró una pista: el narrador se la dice a los dos. */
  | { t: 'pista'; nivel: number }
  /** (los dos) Una seña rápida («¡mira aquí!», «¡ya sé!», «¿me ayudas?»), con el punto donde tenía el dedo. */
  | { t: 'sena'; k: string; p: number[] | null }
  /** (los dos) Una notica escrita (para dictarle al otro lo que uno ve: «4 1 7», «BESO»…). */
  | { t: 'notica'; texto: string }
  /** (los dos) Salió de Cien Puertas. */
  | { t: 'salir' };

/** Paquete: todo lo que se manda en un envío. */
export interface Paquete {
  t: 'p';
  id: string;
  de: Rol;
  /** Hasta qué número le llegó todo seguido de lo del otro. */
  ack: number;
  movs: [number, Mov][];
  /** Foto del cuarto (anfitrión → invitado). */
  foto?: unknown;
  /** El candado que se está resolviendo en el otro celular (con versión) y qué versión ya se vio. */
  panel?: { v: number; f: FotoPanel | null };
  panelVisto?: number;
  /** Texturas pintadas (una por paquete) y qué versiones ya se tienen. */
  tex?: { i: number; v: number; url: string };
  texVista?: Record<number, number>;
  /** Dónde tiene el dedo (para la manito del otro): punto del mundo y si está apoyado. */
  dedo?: [number, number, number, number] | null;
  /** Inclinación del celular (si la está usando). */
  inc?: [number, number, number] | null;
  /** Se fue a segundo plano (cerró los ojos, contestó una llamada…). */
  fuera?: boolean;
}

type Mensaje =
  | { t: 'inv'; inv: InvPuertas }
  | { t: 'resp'; id: string; si: boolean }
  | { t: 'cancelar'; id: string }
  | Paquete;

export interface AvisosRed {
  alCambiar(): void;
  alInvitacion(inv: InvPuertas): void;
}

/** Cuánto se espera a que el otro acepte (le llega también como aviso en la casa). */
const ESPERA_INVITACION = 3 * 60_000;

export class CanalPuertas {
  listo = false;
  otroPresente = false;
  error = '';
  private canal: RealtimeChannel | null = null;
  private avisarCasa: ((datos: Record<string, unknown>) => Promise<void>) | null = null;
  private respuestas = new Map<string, (si: boolean) => void>();
  private pendientes = new Map<string, InvPuertas>();
  /** El enlace de la partida en curso. */
  enlace: Enlace | null = null;

  constructor(public yo: Rol, private avisos: AvisosRed) {}

  async conectar() {
    try {
      const { conexionPareja, eventoPareja } = await import('../casa/sincro');
      const c = await conexionPareja();
      if (!c) {
        this.error = 'Para jugar en pareja, este celular tiene que estar en la casa en línea (Nuestro Hogar → Ajustes).';
        this.avisos.alCambiar();
        return false;
      }
      this.yo = c.sesion.rol;
      this.avisarCasa = (datos) => eventoPareja(c.sb, c.sesion, 'juego', datos);
      await new Promise<void>((listo) => {
        this.canal = c.sb
          .channel(`puertas-${c.sesion.parejaId}`, { config: { broadcast: { self: false }, presence: { key: this.yo } } })
          .on('broadcast', { event: 'puertas' }, ({ payload }) => this.llega(payload as Mensaje))
          .on('presence', { event: 'sync' }, () => {
            const estado = this.canal!.presenceState();
            const antes = this.otroPresente;
            this.otroPresente = !!estado[otro(this.yo)]?.length;
            if (antes !== this.otroPresente) this.avisos.alCambiar();
          })
          .subscribe((s) => {
            if (s === 'SUBSCRIBED') {
              this.listo = true;
              void this.canal!.track({ rol: this.yo, t: Date.now() });
              this.avisos.alCambiar();
              for (const inv of this.pendientes.values()) this.avisos.alInvitacion(inv);
              listo();
            } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
              this.listo = false;
              this.avisos.alCambiar();
              listo();
            }
          });
      });
      return this.listo;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      this.avisos.alCambiar();
      return false;
    }
  }

  mandar(m: Mensaje) {
    void this.canal?.send({ type: 'broadcast', event: 'puertas', payload: m });
  }

  private llega(m: Mensaje) {
    if (m.t === 'inv') {
      if (m.inv.de === this.yo) return;
      this.pendientes.set(m.inv.id, m.inv);
      this.avisos.alInvitacion(m.inv);
    } else if (m.t === 'resp') this.respuestas.get(m.id)?.(m.si);
    else if (m.t === 'cancelar') this.pendientes.delete(m.id);
    else if (m.t === 'p' && m.de !== this.yo && this.enlace && m.id === this.enlace.id) this.enlace.recibir(m);
  }

  /** Invita al otro a resolver una puerta juntos; true si acepta. Si no tiene abierta Cien Puertas, le llega a la casa. */
  invitar(inv: InvPuertas): Promise<boolean> {
    return new Promise((r) => {
      let hecho = false;
      const terminar = (si: boolean) => {
        if (hecho) return;
        hecho = true;
        clearInterval(repetir);
        clearTimeout(limite);
        this.respuestas.delete(inv.id);
        r(si);
      };
      this.respuestas.set(inv.id, terminar);
      this.mandar({ t: 'inv', inv });
      const repetir = window.setInterval(() => this.mandar({ t: 'inv', inv }), 4000);
      const limite = window.setTimeout(() => terminar(false), ESPERA_INVITACION);
      if (!this.otroPresente) void this.avisarCasa?.({ juego: 'puertas', id: inv.id, puerta: inv.puerta }).catch(() => undefined);
    });
  }

  cancelar(id: string) {
    this.respuestas.get(id)?.(false);
    this.mandar({ t: 'cancelar', id });
  }

  responder(inv: InvPuertas, si: boolean) {
    this.pendientes.delete(inv.id);
    this.mandar({ t: 'resp', id: inv.id, si });
  }

  /** Invitación que llegó por la casa (enlace ?unirse=...): se muestra cuando el canal esté listo. */
  recordar(inv: InvPuertas) {
    this.pendientes.set(inv.id, inv);
    if (this.listo) this.avisos.alInvitacion(inv);
  }

  cerrar() {
    this.enlace?.cerrar();
    this.enlace = null;
    void this.canal?.unsubscribe();
    this.canal = null;
    this.listo = false;
  }
}

// ---------------------------------------------------------------------------
// El enlace de una partida: paquetes con movimientos numerados, confirmaciones y latidos
// ---------------------------------------------------------------------------
export type MovNuevo = Mov;

export interface AvisosEnlace {
  alMov(m: Mov): void;
  alFoto(f: unknown): void;
  alPanel(f: FotoPanel | null): void;
  alTextura(i: number, url: string): void;
  alDedo(p: [number, number, number, number] | null): void;
  alInclinacion(i: [number, number, number] | null): void;
  /** Cambió si el otro está (conectado y a la vista). */
  alEstado(): void;
}

/** Cada cuánto sale un paquete (si hay algo que decir) y cada cuánto un latido (si no). */
const CADA = 125;
const LATIDO = 1000;
/** Sin noticias del otro por este rato: se cortó. */
const CORTE = 4500;

export class Enlace {
  private salida: [number, Mov][] = [];
  private siguiente = 1;
  private esperado = 1;
  private guardados = new Map<number, Mov>();
  private timer = 0;
  private ultimoEnvio = 0;
  private ultimoDelOtro = performance.now();
  /** Lo último de lo que solo importa la versión más nueva. */
  private panel: { v: number; f: FotoPanel | null } | null = null;
  private panelVisto = 0;
  private panelRecibido = 0;
  private texturas = new Map<number, { v: number; url: string }>();
  private texVista: Record<number, number> = {};
  private texTengo: Record<number, number> = {};
  private texTurno = 0;
  private foto: unknown = null;
  private dedo: [number, number, number, number] | null | undefined;
  private inc: [number, number, number] | null | undefined;
  private fuera = false;
  /** Llegaron movimientos: hay que confirmarlos pronto (si no, el otro los repite). */
  private confirmar = false;
  /** El otro está a la vista (no se fue a segundo plano) y conectado. */
  otroFuera = false;
  conectado = true;
  /** Pruebas: cuántos paquetes salieron. */
  enviados = 0;

  constructor(public id: string, private yo: Rol, private envio: (p: Paquete) => void, private avisos: AvisosEnlace) {
    this.timer = window.setInterval(() => this.tick(), CADA);
  }

  /** Algo que tiene que llegar, en orden. */
  mandar(m: MovNuevo) {
    this.salida.push([this.siguiente++, m]);
  }

  /** La foto más nueva del cuarto (sale en el próximo paquete). */
  ponerFoto(f: unknown) {
    this.foto = f;
  }

  ponerPanel(f: FotoPanel | null) {
    this.panel = { v: (this.panel?.v ?? 0) + 1, f };
  }

  ponerTextura(i: number, url: string) {
    const v = (this.texturas.get(i)?.v ?? 0) + 1;
    this.texturas.set(i, { v, url });
  }

  ponerDedo(d: [number, number, number, number] | null) {
    this.dedo = d;
  }

  ponerInclinacion(i: [number, number, number] | null) {
    this.inc = i;
  }

  /** Se fue a segundo plano o volvió (se avisa de una vez). */
  ponerFuera(si: boolean) {
    this.fuera = si;
    this.tick(true);
  }

  private tick(ya = false) {
    const ahora = performance.now();
    // ¿Se cortó?
    const conectado = ahora - this.ultimoDelOtro < CORTE;
    if (conectado !== this.conectado) {
      this.conectado = conectado;
      this.avisos.alEstado();
    }
    const tex = [...this.texturas.entries()].filter(([i, t]) => (this.texVista[i] ?? 0) < t.v);
    const algo = this.confirmar || this.salida.length || this.foto !== null || (this.panel && this.panel.v > this.panelVisto) || tex.length || this.dedo !== undefined || this.inc !== undefined;
    if (!ya && !algo && ahora - this.ultimoEnvio < LATIDO) return;
    const p: Paquete = { t: 'p', id: this.id, de: this.yo, ack: this.esperado - 1, movs: this.salida.slice(0, 30) };
    if (this.foto !== null) {
      p.foto = this.foto;
      this.foto = null;
    }
    if (this.panel && this.panel.v > this.panelVisto) p.panel = this.panel;
    if (this.panelRecibido) p.panelVisto = this.panelRecibido;
    if (tex.length) {
      const [i, t] = tex[this.texTurno++ % tex.length];
      p.tex = { i, v: t.v, url: t.url };
    }
    if (Object.keys(this.texTengo).length) p.texVista = this.texTengo;
    if (this.dedo !== undefined) {
      p.dedo = this.dedo;
      this.dedo = undefined;
    }
    if (this.inc !== undefined) {
      p.inc = this.inc;
      this.inc = undefined;
    }
    if (this.fuera) p.fuera = true;
    this.ultimoEnvio = ahora;
    this.confirmar = false;
    this.enviados++;
    this.envio(p);
  }

  recibir(p: Paquete) {
    this.ultimoDelOtro = performance.now();
    if (!this.conectado) {
      this.conectado = true;
      this.avisos.alEstado();
    }
    if (!!p.fuera !== this.otroFuera) {
      this.otroFuera = !!p.fuera;
      this.avisos.alEstado();
    }
    // Lo que el otro ya recibió no se repite más
    if (p.ack) this.salida = this.salida.filter(([n]) => n > p.ack);
    if (p.panelVisto && p.panelVisto > this.panelVisto) this.panelVisto = p.panelVisto;
    if (p.texVista) for (const [i, v] of Object.entries(p.texVista)) this.texVista[Number(i)] = Math.max(this.texVista[Number(i)] ?? 0, v);
    if (p.movs?.length) this.confirmar = true;
    for (const [n, m] of p.movs ?? []) if (n >= this.esperado && !this.guardados.has(n)) this.guardados.set(n, m);
    while (this.guardados.has(this.esperado)) {
      const m = this.guardados.get(this.esperado)!;
      this.guardados.delete(this.esperado);
      this.esperado++;
      this.avisos.alMov(m);
    }
    if (p.panel && p.panel.v > this.panelRecibido) {
      this.panelRecibido = p.panel.v;
      this.avisos.alPanel(p.panel.f);
    }
    if (p.tex && (this.texTengo[p.tex.i] ?? 0) < p.tex.v) {
      this.texTengo[p.tex.i] = p.tex.v;
      this.avisos.alTextura(p.tex.i, p.tex.url);
    }
    if (p.dedo !== undefined) this.avisos.alDedo(p.dedo);
    if (p.inc !== undefined) this.avisos.alInclinacion(p.inc);
    if (p.foto !== undefined) this.avisos.alFoto(p.foto);
  }

  /** Lo que falta por confirmar (pruebas). */
  get pendientes() {
    return this.salida.length;
  }

  cerrar() {
    clearInterval(this.timer);
  }
}
