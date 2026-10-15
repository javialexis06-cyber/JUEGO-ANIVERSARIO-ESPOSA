// El recorrido de una pista (sale de personajes/blender/carreras_pistas.py con la misma curva del modelo 3D): una
// muestra por metro con el centro, el ancho, la orilla y qué hay ahí (hielo, caída, lava, puente). Aquí se averigua
// dónde va cada carro sobre la pista: su metro, qué tan corrido está del centro y la altura del piso.
import type { IdPista } from './datos';

export const HIELO = 1, CAIDA = 2, LAVA = 4, PUENTE = 8;

export interface DatosPista {
  id: IdPista;
  largo: number;
  n: number;
  /** [x, y, z, medio ancho, orilla, banderas] en coordenadas de three.js. */
  m: [number, number, number, number, number, number][];
  cajas: number[];
  turbos: [number, number][];
  rampas: [number, number, number][];
  anillos?: number[];
  /** Arenas: piso circular libre; los obstáculos se exportan junto con su modelo de Blender. */
  arena?: { radio: number; obstaculos: { x: number; z: number; r: number; h: number }[] };
}

export interface Lugar {
  /** Metro sobre la pista (con decimales, 0 … n). */
  s: number;
  /** Qué tan corrido del centro (+ hacia la normal). */
  lat: number;
  /** Altura del piso del camino ahí. */
  y: number;
  i: number;
}

export class Pista {
  n: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  hw: Float32Array;
  hombro: Float32Array;
  flags: Uint8Array;
  /** Tangente (x, z) y normal (x, z) de cada muestra. */
  tx: Float32Array;
  tz: Float32Array;
  nx: Float32Array;
  nz: Float32Array;
  /** Curvatura con signo (radianes por metro) promediada. */
  curva: Float32Array;

  constructor(public d: DatosPista) {
    const n = (this.n = d.m.length);
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.z = new Float32Array(n);
    this.hw = new Float32Array(n);
    this.hombro = new Float32Array(n);
    this.flags = new Uint8Array(n);
    this.tx = new Float32Array(n);
    this.tz = new Float32Array(n);
    this.nx = new Float32Array(n);
    this.nz = new Float32Array(n);
    this.curva = new Float32Array(n);
    d.m.forEach((m, i) => {
      this.x[i] = m[0];
      this.y[i] = m[1];
      this.z[i] = m[2];
      this.hw[i] = m[3];
      this.hombro[i] = m[4];
      this.flags[i] = m[5];
    });
    for (let i = 0; i < n; i++) {
      const a = (i - 1 + n) % n, b = (i + 1) % n;
      let tx = this.x[b] - this.x[a], tz = this.z[b] - this.z[a];
      const l = Math.hypot(tx, tz) || 1;
      tx /= l;
      tz /= l;
      this.tx[i] = tx;
      this.tz[i] = tz;
      // (la misma normal que usa Blender para las orillas: los laterales del JSON van en este sentido)
      this.nx[i] = tz;
      this.nz[i] = -tx;
    }
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(this.tx[(i + 4) % n], this.tz[(i + 4) % n]);
      const b = Math.atan2(this.tx[(i - 4 + n) % n], this.tz[(i - 4 + n) % n]);
      this.curva[i] = angulo(a - b) / 8;
    }
  }

  idx(i: number) {
    const n = this.n;
    return ((Math.floor(i) % n) + n) % n;
  }

  /** Dónde está (x, z) sobre la pista, buscando cerca de la muestra `cerca` (o en toda la pista si es null). */
  lugar(x: number, z: number, cerca: number | null, out: Lugar = { s: 0, lat: 0, y: 0, i: 0 }): Lugar {
    let mejor = -1, md = Infinity;
    if (cerca === null) {
      for (let i = 0; i < this.n; i += 2) {
        const d = (this.x[i] - x) ** 2 + (this.z[i] - z) ** 2;
        if (d < md) (md = d), (mejor = i);
      }
      cerca = mejor;
      md = Infinity;
    }
    const c = Math.floor(cerca);
    for (let k = -14; k <= 14; k++) {
      const i = this.idx(c + k);
      const d = (this.x[i] - x) ** 2 + (this.z[i] - z) ** 2;
      if (d < md) (md = d), (mejor = i);
    }
    // Proyección sobre el tramo de la muestra más cercana (con la anterior o la siguiente)
    const i = mejor;
    const dx = x - this.x[i], dz = z - this.z[i];
    const u = dx * this.tx[i] + dz * this.tz[i];
    const lat = dx * this.nx[i] + dz * this.nz[i];
    const j = u >= 0 ? this.idx(i + 1) : this.idx(i - 1);
    const f = Math.min(1, Math.abs(u));
    out.s = (i + u + this.n) % this.n;
    out.lat = lat;
    out.y = this.y[i] + (this.y[j] - this.y[i]) * f;
    out.i = i;
    return out;
  }

  /** Punto del mundo para (metro, lateral). */
  punto(s: number, lat: number, out = { x: 0, y: 0, z: 0 }) {
    const i = this.idx(s), j = this.idx(s + 1);
    const f = s - Math.floor(s);
    const cx = this.x[i] + (this.x[j] - this.x[i]) * f;
    const cz = this.z[i] + (this.z[j] - this.z[i]) * f;
    out.x = cx + this.nx[i] * lat;
    out.z = cz + this.nz[i] * lat;
    out.y = this.y[i] + (this.y[j] - this.y[i]) * f;
    return out;
  }

  /** Rumbo (ángulo de three.js: adelante = (sin h, cos h)) en un metro. */
  rumbo(s: number) {
    const i = this.idx(s);
    return Math.atan2(this.tx[i], this.tz[i]);
  }

  /** Diferencia de metros hacia adelante (de a a b), en (−n/2, n/2]. */
  delta(a: number, b: number) {
    let d = b - a;
    const n = this.n;
    d = ((d % n) + n) % n;
    return d > n / 2 ? d - n : d;
  }
}

export function angulo(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export async function cargarPista(id: IdPista): Promise<Pista> {
  const r = await fetch(`./modelos/carreras/carreras_${id}.json`);
  if (!r.ok) throw new Error(`No se pudo leer la pista ${id}`);
  return new Pista((await r.json()) as DatosPista);
}
