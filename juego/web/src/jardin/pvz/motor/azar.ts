// Generador con semilla del motor (mulberry32). El motor nunca usa Math.random: con la misma semilla y las mismas
// órdenes, la partida es idéntica. El estado es un número para que el motor se pueda serializar con JSON.

export class Azar {
  estado: number;

  constructor(semilla = 1) {
    this.estado = (semilla >>> 0) || 0x9e3779b9;
  }

  /** Número en [0, 1). */
  siguiente(): number {
    let t = (this.estado = (this.estado + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Real en [a, b). */
  rango(a: number, b: number): number {
    return a + (b - a) * this.siguiente();
  }

  /** Entero en [0, n). */
  entero(n: number): number {
    return Math.floor(this.siguiente() * n);
  }

  /** Elemento al azar (undefined si la lista está vacía). */
  elegir<T>(lista: readonly T[]): T | undefined {
    return lista.length ? lista[this.entero(lista.length)] : undefined;
  }

  /** Índice al azar proporcional a los pesos (−1 si todos son 0). */
  ponderado(pesos: readonly number[]): number {
    let total = 0;
    for (const p of pesos) total += Math.max(0, p);
    if (total <= 0) return -1;
    let r = this.siguiente() * total;
    for (let i = 0; i < pesos.length; i++) {
      r -= Math.max(0, pesos[i]);
      if (r < 0) return i;
    }
    return pesos.length - 1;
  }
}
