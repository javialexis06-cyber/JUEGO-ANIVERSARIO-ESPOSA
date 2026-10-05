// Campo de flujo: una sola búsqueda en anchura desde todos los jugadores a la vez le dice a cada celda abierta qué
// tan lejos está del jugador más cercano. Cada enemigo solo mira el gradiente de su celda: así cientos encuentran el
// camino por las cuevas sin buscar ruta cada uno. Se recalcula unas cuatro veces por segundo y cuando se excava.
import { esSolida } from '../tipos';
import type { Mapa } from './mapa';

export const LEJOS = 65535;

export class CampoFlujo {
  dist: Uint16Array;
  private cola: Int32Array;
  private w = 0;
  private h = 0;
  /** Celdas a la distancia buena para que aparezcan enemigos (fuera de la pantalla pero con camino). */
  anillo: number[] = [];

  constructor(private m: Mapa) {
    this.w = m.w;
    this.h = m.h;
    this.dist = new Uint16Array(m.w * m.h).fill(LEJOS);
    this.cola = new Int32Array(m.w * m.h);
  }

  /** Recalcula desde estas fuentes (x, y en m). El anillo de aparición va entre `rMin` y `rMax` celdas. */
  calcular(fuentes: { x: number; y: number }[], rMin = 14, rMax = 24) {
    const { w, h, m } = this;
    const d = this.dist;
    d.fill(LEJOS);
    let a = 0, b = 0;
    for (const f of fuentes) {
      const cx = Math.floor(f.x), cy = Math.floor(f.y);
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const i = cy * w + cx;
      if (d[i] === 0) continue;
      d[i] = 0;
      this.cola[b++] = i;
    }
    this.anillo.length = 0;
    const c = m.c;
    while (a < b) {
      const i = this.cola[a++];
      const di = d[i];
      if (di >= rMin && di <= rMax) this.anillo.push(i);
      const cx = i % w, cy = (i / w) | 0;
      const nd = di + 1;
      // Cuatro vecinos (las diagonales salen solas del gradiente)
      if (cx + 1 < w) {
        const j = i + 1;
        if (d[j] === LEJOS && !esSolida(c[j])) { d[j] = nd; this.cola[b++] = j; }
      }
      if (cx > 0) {
        const j = i - 1;
        if (d[j] === LEJOS && !esSolida(c[j])) { d[j] = nd; this.cola[b++] = j; }
      }
      if (cy + 1 < h) {
        const j = i + w;
        if (d[j] === LEJOS && !esSolida(c[j])) { d[j] = nd; this.cola[b++] = j; }
      }
      if (cy > 0) {
        const j = i - w;
        if (d[j] === LEJOS && !esSolida(c[j])) { d[j] = nd; this.cola[b++] = j; }
      }
    }
  }

  distEn(x: number, y: number) {
    const cx = Math.floor(x), cy = Math.floor(y);
    if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) return LEJOS;
    return this.dist[cy * this.w + cx];
  }

  private dc(cx: number, cy: number, siNo: number) {
    if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) return siNo;
    const v = this.dist[cy * this.w + cx];
    return v === LEJOS ? siNo : v;
  }

  /** Dirección (normalizada) para bajar por el campo desde (x, y). Devuelve false si no hay camino. */
  direccion(x: number, y: number, fuera: { x: number; y: number }): boolean {
    const cx = Math.floor(x), cy = Math.floor(y);
    const d0 = this.dc(cx, cy, LEJOS);
    if (d0 === LEJOS) return false;
    // Gradiente suave: se mezcla con la posición dentro de la celda para que no caminen en escalera
    const pared = d0 + 1.5;
    const izq = this.dc(cx - 1, cy, pared), der = this.dc(cx + 1, cy, pared);
    const arr = this.dc(cx, cy - 1, pared), aba = this.dc(cx, cy + 1, pared);
    let gx = izq - der, gy = arr - aba;
    // Las diagonales ayudan a doblar esquinas
    const di1 = this.dc(cx - 1, cy - 1, pared), di2 = this.dc(cx + 1, cy - 1, pared), di3 = this.dc(cx - 1, cy + 1, pared), di4 = this.dc(cx + 1, cy + 1, pared);
    gx += ((di1 - di2) + (di3 - di4)) * 0.35;
    gy += ((di1 - di3) + (di2 - di4)) * 0.35;
    // Se empuja hacia el centro de la celda cuando va pegado a una pared (para no rozar las esquinas)
    const fx = x - cx - 0.5, fy = y - cy - 0.5;
    if (esSolida(this.m.get(cx + 1, cy)) && fx > 0.15) gx -= fx * 1.2;
    if (esSolida(this.m.get(cx - 1, cy)) && fx < -0.15) gx -= fx * 1.2;
    if (esSolida(this.m.get(cx, cy + 1)) && fy > 0.15) gy -= fy * 1.2;
    if (esSolida(this.m.get(cx, cy - 1)) && fy < -0.15) gy -= fy * 1.2;
    const l = Math.hypot(gx, gy);
    if (l < 1e-4) {
      // Sin pendiente (empate): hacia el vecino más bajo
      let bx = 0, by = 0, bd = d0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const v = this.dc(cx + dx, cy + dy, LEJOS);
          if (v < bd) {
            bd = v;
            bx = dx;
            by = dy;
          }
        }
      if (!bx && !by) return false;
      const lb = Math.hypot(bx, by);
      fuera.x = bx / lb;
      fuera.y = by / lb;
      return true;
    }
    fuera.x = gx / l;
    fuera.y = gy / l;
    return true;
  }
}
