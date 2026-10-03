// Azar con semilla (mulberry32): así una partida del bot se puede repetir igualita en las pruebas.
export class Azar {
  private s: number;
  constructor(semilla = Date.now() >>> 0) {
    this.s = semilla >>> 0 || 1;
  }
  /** Entre 0 y 1. */
  n(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  entre(a: number, b: number) {
    return a + this.n() * (b - a);
  }
  entero(a: number, b: number) {
    return Math.floor(this.entre(a, b + 1));
  }
  uno<T>(l: readonly T[]): T {
    return l[Math.floor(this.n() * l.length)];
  }
  /** Uno al azar según el peso de cada uno. */
  pesado<T>(l: readonly T[], peso: (x: T) => number): T | undefined {
    let total = 0;
    for (const x of l) total += Math.max(0, peso(x));
    if (total <= 0) return undefined;
    let r = this.n() * total;
    for (const x of l) {
      r -= Math.max(0, peso(x));
      if (r <= 0) return x;
    }
    return l[l.length - 1];
  }
}

/** Número pseudoaleatorio fijo para una celda del mapa (las velitas y la decoración salen siempre en el mismo sitio). */
export function hash2(x: number, y: number, s = 0): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
