// Posiciones para DIBUJAR a los compañeros. El motor conserva las posiciones recibidas para el combate;
// el personaje propio conserva su respuesta inmediata al joystick.
import type { Jugador, Motor } from './motor';

interface Posicion { x: number; y: number; vx: number; vy: number }
interface Muestra extends Posicion { t: number }

export class MovimientoRemoto {
  private muestras: Muestra[] = [];
  private desfase = 0;
  private llegada = 0;
  private cursor = -Infinity;
  private conReloj = false;
  private visible: Posicion | null = null;
  private ultimaVista = 0;
  private correccionX = 0;
  private correccionY = 0;
  /** Dos mensajes de movimiento caben en la reserva, incluso cuando llegan juntos o desordenados. */
  private readonly reserva = 0.16;
  /** Si faltan mensajes, frena en 120 ms; nunca sigue caminando durante un corte. */
  private readonly prediccion = 0.12;

  recibir(p: Posicion, ahora: number, tiempo?: number) {
    if (![p.x, p.y, p.vx, p.vy, ahora].every(Number.isFinite)) return;
    const conReloj = Number.isFinite(tiempo);
    const t = conReloj ? tiempo! : ahora;
    if (this.conReloj !== conReloj) this.muestras = [];
    this.conReloj = conReloj;
    const anterior = this.muestras.at(-1);
    if (anterior && t <= anterior.t) return;
    const alcance = anterior ? Math.max(Math.hypot(p.vx, p.vy), Math.hypot(anterior.vx, anterior.vy)) * (t - anterior.t) : 0;
    if (!anterior || ahora - this.llegada > 0.75 || Math.hypot(p.x - anterior.x, p.y - anterior.y) > 180 + alcance * 1.5) {
      this.muestras = [];
      this.desfase = ahora - t;
      this.cursor = t;
      this.visible = null;
      this.correccionX = this.correccionY = 0;
    }
    this.llegada = ahora;
    this.muestras.push({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, t });
    if (this.muestras.length > 16) this.muestras.shift();
    if (this.visible) {
      // Al volver de una pérdida breve, la nueva trayectoria reemplaza la predicción sin saltar de sitio.
      const nueva = this.posicion();
      this.correccionX = this.visible.x - nueva.x;
      this.correccionY = this.visible.y - nueva.y;
    }
  }

  ver(ahora: number): Posicion {
    this.cursor = Math.max(this.cursor, ahora - this.desfase - this.reserva);
    while (this.muestras.length > 2 && this.muestras[1].t <= this.cursor) this.muestras.shift();
    const p = this.posicion();
    const dt = Math.max(0, ahora - this.ultimaVista), k = 1 - Math.exp(-dt * 18);
    let dx = this.correccionX * k, dy = this.correccionY * k;
    // Recuperar una ráfaga perdida tampoco debe producir un cuadro a varias veces la velocidad de marcha.
    const distancia = Math.hypot(dx, dy), limite = Math.max(90, Math.hypot(p.vx, p.vy) * 0.75) * dt;
    if (distancia > limite) { dx *= limite / distancia; dy *= limite / distancia; }
    this.correccionX -= dx;
    this.correccionY -= dy;
    p.x += this.correccionX;
    p.y += this.correccionY;
    this.ultimaVista = ahora;
    this.visible = p;
    return p;
  }

  private posicion(): Posicion {
    if (this.cursor <= this.muestras[0].t) {
      const p = this.muestras[0];
      return { x: p.x, y: p.y, vx: p.vx, vy: p.vy };
    }
    for (let i = 1; i < this.muestras.length; i++) {
      const a = this.muestras[i - 1], b = this.muestras[i];
      if (this.cursor >= b.t) continue;
      const k = Math.max(0, Math.min(1, (this.cursor - a.t) / (b.t - a.t)));
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k,
        vx: a.vx + (b.vx - a.vx) * k, vy: a.vy + (b.vy - a.vy) * k };
    }
    const p = this.muestras.at(-1)!;
    const u = Math.max(0, Math.min(this.prediccion, this.cursor - p.t));
    const avance = u - u * u / (2 * this.prediccion), freno = 1 - u / this.prediccion;
    return { x: p.x + p.vx * avance, y: p.y + p.vy * avance, vx: p.vx * freno, vy: p.vy * freno };
  }
}

/** Una vista por compañero: posición, sombra, barra, nombre y armas usan el mismo recorrido. */
export class VistaJugadoresRemotos {
  private porJugador = new Map<number, { movimiento: MovimientoRemoto; vista: Jugador; caido: boolean; fuera: boolean; x: number; y: number }>();

  recibir(j: Jugador, ahora: number, tiempo?: number) {
    let r = this.porJugador.get(j.i);
    if (!r || r.caido !== j.caido || r.fuera !== j.fuera) {
      r = { movimiento: new MovimientoRemoto(), vista: Object.create(j) as Jugador, caido: j.caido, fuera: j.fuera, x: j.x, y: j.y };
      this.porJugador.set(j.i, r);
    }
    r.movimiento.recibir(j, ahora, tiempo);
    r.x = j.x;
    r.y = j.y;
  }

  ver(m: Motor, yo: number, ahora: number, pausa: boolean): readonly Jugador[] {
    return m.jug.map(j => {
      const r = this.porJugador.get(j.i);
      if (j.i === yo || !r) return j;
      if (r.caido !== j.caido || r.fuera !== j.fuera || Math.hypot(j.x - r.x, j.y - r.y) > 180) {
        this.porJugador.delete(j.i);
        return j;
      }
      if (pausa || j.caido || j.fuera) return j;
      const p = r.movimiento.ver(ahora);
      if (m.esc.limites) p.y = Math.max(m.esc.limites.yMin + 18, Math.min(m.esc.limites.yMax - 18, p.y));
      if (m.esc.limitesX) p.x = Math.max(m.esc.limitesX.xMin + 18, Math.min(m.esc.limitesX.xMax - 18, p.x));
      Object.assign(r.vista, p);
      return r.vista;
    });
  }
}
