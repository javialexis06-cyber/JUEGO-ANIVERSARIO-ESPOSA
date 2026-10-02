// Mesa en línea: los dos celulares se hablan por un canal de Supabase Realtime (broadcast + presencia).
// Solo viajan movimientos numerados; cada celular aplica las mismas reglas y llega al mismo estado.
// Si se pierde un mensaje, el que espera lo vuelve a pedir y el otro reenvía su historial desde ahí.
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { otro, type Rol } from '../casa/modelo';
import { conexionPareja, eventoPareja, type SesionLinea } from '../casa/sincro';
import { alPausar, alReanudar } from '../segundo_plano';
import type { JuegoMesa } from './tipos';

export interface Invitacion {
  id: string;
  juego: JuegoMesa['id'];
  empieza: Rol;
  de: Rol;
}

type Mensaje =
  | { t: 'inv'; inv: Invitacion }
  | { t: 'resp'; id: string; si: boolean }
  | { t: 'cancelar'; id: string }
  | { t: 'mov'; id: string; n: number; m: unknown }
  | { t: 'pedir'; id: string; desde: number }
  | { t: 'salir'; id: string }
  /** Escena premium que lanzó uno de los dos (se ve en los dos celulares); k evita verla dos veces. */
  | { t: 'escena'; id: string; escena: string; de: Rol; k: number }
  /** Se fue a segundo plano (otra app, pantalla bloqueada) o volvió: al otro le sale «se cortó la conexión». */
  | { t: 'fuera'; si: boolean; de: Rol };

interface Avisos {
  alCambiar(): void;
  alInvitacion(inv: Invitacion): void;
  alMovimiento(id: string, n: number, m: unknown): void;
  alSalir(id: string): void;
  alEscena(id: string, escena: string, de: Rol): void;
  /** El otro celular se fue a segundo plano (true) o volvió (false). */
  alFuera(si: boolean): void;
  /** Este celular volvió de segundo plano (para volver a pedir lo que se perdió). */
  alVolver(): void;
}

/** Cuánto se espera a que el otro acepte (le llega también como aviso en la casa). */
const ESPERA_INVITACION = 3 * 60_000;

export class Canal {
  listo = false;
  otroPresente = false;
  error = '';
  private sb: SupabaseClient | null = null;
  private sesion: SesionLinea | null = null;
  private canal: RealtimeChannel | null = null;
  /** Movimientos de cada partida por número (propios y recibidos). */
  private historial = new Map<string, unknown[]>();
  private respuestas = new Map<string, (si: boolean) => void>();
  /** Invitaciones que llegaron (por la casa o por el canal) y siguen abiertas. */
  private pendientes = new Map<string, Invitacion>();
  private escenasVistas = new Set<string>();

  constructor(private yo: Rol, private avisos: Avisos) {}

  async conectar() {
    try {
      const c = await conexionPareja();
      if (!c) {
        this.error = 'Este celular no está en una casa en línea.';
        this.avisos.alCambiar();
        return;
      }
      if (c.sesion.rol !== this.yo) this.yo = c.sesion.rol;
      this.sb = c.sb;
      this.sesion = c.sesion;
      // En segundo plano el otro lo ve desconectado de una; al volver, en línea otra vez
      alPausar(() => {
        this.mandar({ t: 'fuera', si: true, de: this.yo });
        void Promise.resolve(this.canal?.untrack?.()).catch(() => undefined);
      });
      alReanudar(() => {
        this.mandar({ t: 'fuera', si: false, de: this.yo });
        void Promise.resolve(this.canal?.track({ rol: this.yo, t: Date.now() })).catch(() => undefined);
        this.avisos.alVolver();
      });
      this.canal = c.sb
        .channel(`mesa-${c.sesion.parejaId}`, { config: { broadcast: { self: false }, presence: { key: this.yo } } })
        .on('broadcast', { event: 'mesa' }, ({ payload }) => this.llega(payload as Mensaje))
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
            // Invitación que llegó a la casa: se acepta al entrar por su enlace (?unirse=...)
            for (const inv of this.pendientes.values()) this.avisos.alInvitacion(inv);
          } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
            this.listo = false;
            this.avisos.alCambiar();
          }
        });
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      this.avisos.alCambiar();
    }
  }

  private mandar(m: Mensaje) {
    void this.canal?.send({ type: 'broadcast', event: 'mesa', payload: m });
  }

  private llega(m: Mensaje) {
    if (m.t === 'inv') {
      if (m.inv.de === this.yo) return;
      this.pendientes.set(m.inv.id, m.inv);
      this.avisos.alInvitacion(m.inv);
    } else if (m.t === 'resp') {
      this.respuestas.get(m.id)?.(m.si);
    } else if (m.t === 'cancelar') {
      this.pendientes.delete(m.id);
    } else if (m.t === 'mov') {
      const h = this.historial.get(m.id) ?? [];
      h[m.n] = m.m;
      this.historial.set(m.id, h);
      this.avisos.alMovimiento(m.id, m.n, m.m);
    } else if (m.t === 'pedir') {
      const h = this.historial.get(m.id);
      if (!h) return;
      for (let n = m.desde; n < h.length; n++) if (h[n] !== undefined) this.mandar({ t: 'mov', id: m.id, n, m: h[n] });
    } else if (m.t === 'salir') {
      this.avisos.alSalir(m.id);
    } else if (m.t === 'fuera') {
      if (m.de !== this.yo) this.avisos.alFuera(m.si);
    } else if (m.t === 'escena') {
      const clave = `${m.de}-${m.k}`;
      if (m.de === this.yo || this.escenasVistas.has(clave)) return;
      this.escenasVistas.add(clave);
      this.avisos.alEscena(m.id, m.escena, m.de);
    }
  }

  /** Invita al otro; responde true si acepta. Si no está en la mesa, le llega el aviso en la casa. */
  invitar(inv: Invitacion): Promise<boolean> {
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
      // Se repite por si el otro entra a la mesa mientras tanto
      const repetir = window.setInterval(() => this.mandar({ t: 'inv', inv }), 5000);
      const limite = window.setTimeout(() => terminar(false), ESPERA_INVITACION);
      if (!this.otroPresente && this.sb && this.sesion) {
        void eventoPareja(this.sb, this.sesion, 'juego', { ...inv }).catch(() => undefined);
      }
    });
  }

  cancelar(id: string) {
    this.respuestas.get(id)?.(false);
    this.mandar({ t: 'cancelar', id });
  }

  responder(inv: Invitacion, si: boolean) {
    this.pendientes.delete(inv.id);
    this.mandar({ t: 'resp', id: inv.id, si });
  }

  /** Invitación recibida por la casa (enlace ?unirse=...): se muestra cuando el canal esté listo. */
  recordar(inv: Invitacion) {
    this.pendientes.set(inv.id, inv);
    if (this.listo) this.avisos.alInvitacion(inv);
  }

  movimiento(id: string, n: number, m: unknown) {
    const h = this.historial.get(id) ?? [];
    h[n] = m;
    this.historial.set(id, h);
    this.mandar({ t: 'mov', id, n, m });
  }

  /** Pide de nuevo los movimientos desde `desde` (por si se perdió alguno). */
  pedir(id: string, desde: number) {
    this.mandar({ t: 'pedir', id, desde });
  }

  /** Avisa que se lanzó una escena (dos veces, por si se pierde el mensaje; el otro la ve una sola). */
  escena(id: string, escena: string) {
    const m: Mensaje = { t: 'escena', id, escena, de: this.yo, k: Date.now() };
    this.mandar(m);
    window.setTimeout(() => this.mandar(m), 700);
  }

  salir(id: string) {
    this.mandar({ t: 'salir', id });
    this.historial.delete(id);
  }
}
