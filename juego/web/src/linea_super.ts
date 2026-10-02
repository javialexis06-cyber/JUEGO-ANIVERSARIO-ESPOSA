// Súper Manía en línea: Él en Bucaramanga y Ella en Medellín, cada uno en su celular. El que invita (anfitrión)
// simula el día entero y le manda al otro una foto de la tienda 10 veces por segundo; el invitado manda su joystick
// y sus toques. Viaja por un canal de Supabase Realtime (el mismo de la casa) o, en las pruebas, por un
// BroadcastChannel entre dos pestañas (?linea=local&rol=el|ella).
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Rol } from './jugador';
import type { Resultado } from './juego';
import type { Foto, Orden } from './espejo';

/** Lo que hace falta para montar la misma tienda en el otro celular. */
export interface ConfigDia {
  nivel: number;
  legendario: boolean;
  sitios: Record<number, number>;
  mejoras: Record<string, number>;
}

export type Mensaje =
  | { t: 'hola'; de: Rol }
  | { t: 'inv'; id: string; nivel: number; legendario: boolean; de: Rol }
  | { t: 'resp'; id: string; si: boolean }
  | { t: 'cancelar'; id: string }
  | { t: 'inicio'; id: string; config: ConfigDia }
  | { t: 'listo'; id: string }
  | { t: 'foto'; id: string; f: Foto }
  | { t: 'mando'; id: string; x: number; y: number }
  | { t: 'orden'; id: string; o: Orden }
  /** Cómo le fue al toque del invitado («cancelada», «otro»…), para el aviso en su celular. */
  | { t: 'res'; id: string; r: string }
  /** «Sigo aquí» (cada segundo, para saber si se cortó la conexión). */
  | { t: 'latido'; id: string }
  | { t: 'ayuda'; id: string; ayuda: string }
  | { t: 'corazon'; id: string }
  | { t: 'pausa'; id: string; si: boolean }
  /** Se fue a segundo plano (otra app, pantalla bloqueada) o volvió: al otro le sale «se cortó la conexión». */
  | { t: 'fuera'; id: string; si: boolean }
  | { t: 'fin'; id: string; r: Resultado }
  | { t: 'salir'; id: string };

const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');

export class CanalSuper {
  listo = false;
  otroPresente = false;
  error = '';
  alMensaje: (m: Mensaje) => void = () => {};
  alCambiar: () => void = () => {};
  private canal: RealtimeChannel | null = null;
  private local: BroadcastChannel | null = null;
  private vistoOtro = 0;
  private latido = 0;
  private avisarCasa: ((datos: Record<string, unknown>) => Promise<void>) | null = null;

  constructor(public yo: Rol) {}

  /** Se conecta al canal de la pareja. false si este celular no está en una casa en línea. */
  async conectar(): Promise<boolean> {
    const params = new URLSearchParams(location.search);
    if (params.get('linea') === 'local') return this.conectarLocal();
    try {
      const { conexionPareja, eventoPareja } = await import('./casa/sincro');
      const c = await conexionPareja();
      if (!c) {
        this.error = 'Para jugar en línea, este celular tiene que estar en la casa en línea (Nuestro Hogar → Conectar).';
        return false;
      }
      this.yo = c.sesion.rol;
      this.avisarCasa = (datos) => eventoPareja(c.sb, c.sesion, 'juego', datos);
      await new Promise<void>((listo) => {
        this.canal = c.sb
          .channel(`super-${c.sesion.parejaId}`, { config: { broadcast: { self: false }, presence: { key: this.yo } } })
          .on('broadcast', { event: 'super' }, ({ payload }) => this.alMensaje(payload as Mensaje))
          .on('presence', { event: 'sync' }, () => {
            const estado = this.canal!.presenceState();
            const antes = this.otroPresente;
            this.otroPresente = !!estado[otro(this.yo)]?.length;
            if (antes !== this.otroPresente) this.alCambiar();
          })
          .subscribe((s) => {
            if (s === 'SUBSCRIBED') {
              this.listo = true;
              void this.canal!.track({ rol: this.yo, t: Date.now() });
              this.alCambiar();
              listo();
            } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
              this.listo = false;
              this.alCambiar();
              listo();
            }
          });
      });
      return this.listo;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      return false;
    }
  }

  /** Pruebas: dos pestañas del mismo navegador (con un «hola» cada segundo para saber si el otro está). */
  private conectarLocal() {
    this.yo = new URLSearchParams(location.search).get('rol') === 'ella' ? 'ella' : 'el';
    this.local = new BroadcastChannel('supermania-linea');
    this.local.onmessage = (e) => {
      const m = e.data as Mensaje & { para?: Rol };
      if (m.para && m.para !== this.yo) return;
      if (m.t === 'hola') {
        if (m.de === this.yo) return;
        const antes = this.otroPresente;
        this.vistoOtro = Date.now();
        this.otroPresente = true;
        if (!antes) this.alCambiar();
        return;
      }
      this.alMensaje(m);
    };
    const hola = () => {
      this.local?.postMessage({ t: 'hola', de: this.yo });
      if (this.otroPresente && Date.now() - this.vistoOtro > 3500) {
        this.otroPresente = false;
        this.alCambiar();
      }
    };
    hola();
    this.latido = window.setInterval(hola, 1000);
    this.listo = true;
    return true;
  }

  mandar(m: Mensaje) {
    if (this.local) this.local.postMessage({ ...m, para: otro(this.yo) });
    else void this.canal?.send({ type: 'broadcast', event: 'super', payload: m });
  }

  /** Si el otro no tiene abierto el súper, le llega el aviso en la casa (con el enlace para unirse). */
  async avisarPorCasa(inv: { id: string; nivel: number; legendario: boolean }) {
    await this.avisarCasa?.({ juego: 'super', ...inv }).catch(() => undefined);
  }

  cerrar() {
    clearInterval(this.latido);
    this.local?.close();
    this.local = null;
    void this.canal?.unsubscribe();
    this.canal = null;
    this.listo = false;
  }
}
