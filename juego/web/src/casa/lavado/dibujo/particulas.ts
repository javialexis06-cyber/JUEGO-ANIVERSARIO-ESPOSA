// Partículas (piscina fija, en arreglos planos): gotas, espuma, burbujas que revientan, brillos, corazones, chispas,
// humo y llamitas. Tres capas: normal, aditiva (las que brillan) y en el piso (salpicaduras, anillos, sombras).
import { LoteSprites, type Cuadro } from './sprites';
import type { AtlasFx, IdFx } from './texturas';

export const CAPA_NORMAL = 0, CAPA_LUZ = 1, CAPA_PISO = 2;

export class Particulas {
  private readonly max: number;
  private n = 0;
  private sig = 0;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly vz: Float32Array;
  readonly g: Float32Array;
  readonly vida: Float32Array;
  readonly total: Float32Array;
  readonly t0: Float32Array;
  readonly t1: Float32Array;
  readonly giro: Float32Array;
  readonly vgiro: Float32Array;
  readonly rgb: Float32Array;
  readonly a0: Float32Array;
  readonly capa: Uint8Array;
  readonly cuadro: Uint8Array;
  readonly frena: Float32Array;
  readonly aspecto: Float32Array;
  private cuadros: Cuadro[] = [];
  private ids = new Map<IdFx, number>();
  /** Calidad: cuántas se dejan crear (baja sola si el celular va lento). */
  cupo = 1;

  constructor(max: number, atlas: AtlasFx, private normal: LoteSprites, private luz: LoteSprites, private piso: LoteSprites) {
    this.max = max;
    const f = () => new Float32Array(max);
    this.x = f(); this.y = f(); this.z = f(); this.vx = f(); this.vy = f(); this.vz = f(); this.g = f(); this.vida = f(); this.total = f();
    this.t0 = f(); this.t1 = f(); this.giro = f(); this.vgiro = f(); this.a0 = f(); this.frena = f(); this.aspecto = f();
    this.rgb = new Float32Array(max * 3);
    this.capa = new Uint8Array(max);
    this.cuadro = new Uint8Array(max);
    for (const [id, c] of Object.entries(atlas.c) as [IdFx, Cuadro][]) {
      this.ids.set(id, this.cuadros.length);
      this.cuadros.push(c);
    }
  }

  get cuantas() {
    return this.n;
  }

  /** Crea una (si hay cupo). Devuelve el índice o -1. */
  crear(fx: IdFx, capa: number, x: number, y: number, z: number, vx: number, vy: number, vz: number, vida: number, t0: number, t1: number,
    r = 1, g = 1, b = 1, a = 1, gravedad = 0, giro = 0, vgiro = 0, frena = 0, aspecto = 1): number {
    if (this.cupo < 1 && Math.random() > this.cupo) return -1;
    if (this.n >= this.max) {
      // Llena: se recicla la más vieja (se busca en círculo)
      this.sig = (this.sig + 1) % this.max;
    } else {
      this.sig = this.n++;
    }
    const i = this.sig;
    this.x[i] = x; this.y[i] = y; this.z[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.g[i] = gravedad;
    this.vida[i] = vida; this.total[i] = vida;
    this.t0[i] = t0; this.t1[i] = t1;
    this.giro[i] = giro; this.vgiro[i] = vgiro;
    this.rgb[i * 3] = r; this.rgb[i * 3 + 1] = g; this.rgb[i * 3 + 2] = b;
    this.a0[i] = a;
    this.capa[i] = capa;
    this.cuadro[i] = this.ids.get(fx) ?? 0;
    this.frena[i] = frena;
    this.aspecto[i] = aspecto;
    return i;
  }

  actualizar(dt: number) {
    let k = 0;
    while (k < this.n) {
      this.vida[k] -= dt;
      if (this.vida[k] <= 0) {
        // Se cambia por la última (sin huecos)
        const u = --this.n;
        if (k !== u) this.mover(u, k);
        continue;
      }
      const fr = this.frena[k] ? Math.exp(-this.frena[k] * dt) : 1;
      this.vx[k] *= fr;
      this.vy[k] *= fr;
      this.vz[k] = this.vz[k] * fr - this.g[k] * dt;
      this.x[k] += this.vx[k] * dt;
      this.y[k] += this.vy[k] * dt;
      this.z[k] += this.vz[k] * dt;
      if (this.z[k] < 0 && this.g[k] > 0) {
        this.z[k] = 0;
        this.vz[k] *= -0.35;
        this.vx[k] *= 0.6;
        this.vy[k] *= 0.6;
      }
      this.giro[k] += this.vgiro[k] * dt;
      k++;
    }
    if (this.sig >= this.n) this.sig = Math.max(0, this.n - 1);
  }

  private mover(de: number, a: number) {
    this.x[a] = this.x[de]; this.y[a] = this.y[de]; this.z[a] = this.z[de];
    this.vx[a] = this.vx[de]; this.vy[a] = this.vy[de]; this.vz[a] = this.vz[de];
    this.g[a] = this.g[de]; this.vida[a] = this.vida[de]; this.total[a] = this.total[de];
    this.t0[a] = this.t0[de]; this.t1[a] = this.t1[de]; this.giro[a] = this.giro[de]; this.vgiro[a] = this.vgiro[de];
    this.rgb[a * 3] = this.rgb[de * 3]; this.rgb[a * 3 + 1] = this.rgb[de * 3 + 1]; this.rgb[a * 3 + 2] = this.rgb[de * 3 + 2];
    this.a0[a] = this.a0[de]; this.capa[a] = this.capa[de]; this.cuadro[a] = this.cuadro[de]; this.frena[a] = this.frena[de];
    this.aspecto[a] = this.aspecto[de];
  }

  /** Las pasa a los lotes (que ya fueron empezados por el dibujo). */
  dibujar() {
    for (let k = 0; k < this.n; k++) {
      const v = this.vida[k] / this.total[k];
      const u = 1 - v;
      const tam = this.t0[k] + (this.t1[k] - this.t0[k]) * u;
      // Aparece rápido y se desvanece al final
      const a = this.a0[k] * Math.min(1, u * 8) * Math.min(1, v * 2.5);
      const c = this.cuadros[this.cuadro[k]];
      const lote = this.capa[k] === CAPA_LUZ ? this.luz : this.capa[k] === CAPA_PISO ? this.piso : this.normal;
      lote.poner(this.x[k], this.y[k], this.z[k], tam * this.aspecto[k], tam, 0.5, 0.5, c.u0, c.v0, c.u1, c.v1, this.rgb[k * 3], this.rgb[k * 3 + 1],
        this.rgb[k * 3 + 2], a, 0, 0, 1, this.giro[k]);
    }
  }
}
