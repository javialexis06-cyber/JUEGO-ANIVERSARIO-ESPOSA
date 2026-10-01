// El show en línea: cada celular manda sus mensajes numerados por el canal de la mesa (el mismo de las invitaciones),
// en su propia fila `<partida>~<rol>`. Llegan en orden aunque la red los desordene; si se pierde alguno, cada tanto se
// vuelven a pedir los que faltan y el otro los reenvía desde su historial (el mismo truco de los juegos de mesa).
import type { Canal } from '../canal';
import type { Plan, Resp } from './motor';
import { otroRol } from './motor';
import type { Rol } from './preguntas';

export type MsgShow =
  /** El guion del episodio (lo manda Él, que hace de anfitrión). */
  | { k: 'plan'; plan: Plan }
  /** Respuesta a la pregunta número `i` del episodio. */
  | { k: 'r'; i: number; v: Resp }
  /** Calificación del dueño de una abierta. */
  | { k: 'nota'; i: number; v: string }
  /** Se fue a segundo plano (o volvió). */
  | { k: 'pausa'; si: boolean }
  /** Ya vio la revelación de la pregunta `i` (para no adelantarse mucho al otro). */
  | { k: 'visto'; i: number }
  /** Se salió del show. */
  | { k: 'chao' };

export class RedShow {
  private n = 0;
  private esperado = 0;
  private buffer = new Map<number, MsgShow>();
  private reloj = 0;
  /** Cuándo llegó lo último del otro (para saber si sigue ahí). */
  ultimoDelOtro = performance.now();

  constructor(
    private canal: Canal,
    private id: string,
    private yo: Rol,
    private alMensaje: (m: MsgShow) => void,
  ) {
    // Si se perdió algo, se vuelve a pedir desde el primero que falta (el otro reenvía lo que tenga desde ahí)
    this.reloj = window.setInterval(() => this.canal.pedir(this.suyo, this.esperado), 2200);
  }

  get mio() {
    return `${this.id}~${this.yo}`;
  }
  get suyo() {
    return `${this.id}~${otroRol(this.yo)}`;
  }
  get presente() {
    return this.canal.otroPresente;
  }
  get conectado() {
    return this.canal.listo;
  }

  enviar(m: MsgShow) {
    this.canal.movimiento(this.mio, this.n++, m);
  }

  /** Lo que llega por el canal: true si era de este show. */
  llega(id: string, n: number, m: unknown): boolean {
    if (id !== this.suyo) return id === this.mio;
    this.ultimoDelOtro = performance.now();
    if (n < this.esperado) return true;
    this.buffer.set(n, m as MsgShow);
    while (this.buffer.has(this.esperado)) {
      const x = this.buffer.get(this.esperado)!;
      this.buffer.delete(this.esperado);
      this.esperado++;
      try {
        this.alMensaje(x);
      } catch (e) {
        console.error(e);
      }
    }
    return true;
  }

  /** Pide ya lo que falte (al volver de segundo plano). */
  pedirYa() {
    this.canal.pedir(this.suyo, this.esperado);
  }

  cerrar(avisar: boolean) {
    clearInterval(this.reloj);
    if (avisar) {
      this.enviar({ k: 'chao' });
      this.canal.salir(this.id);
    }
  }
}
