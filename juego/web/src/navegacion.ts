// Cuadrícula de caminos de la tienda (coordenadas de Blender: x a la derecha, y hacia el fondo) y búsqueda A*.
export type P = { x: number; y: number };

export class Navegacion {
  readonly nx: number;
  readonly ny: number;
  private libre: Uint8Array;
  private x0: number;
  private y0: number;

  /** `celda`: tamaño de cada casilla (la casa usa casillas más finas que la tienda). */
  constructor(W: number, D: number, margen = 0.35, readonly celda = 0.25) {
    this.x0 = -W / 2 + margen;
    this.y0 = -D / 2 + margen;
    this.nx = Math.floor((W - 2 * margen) / this.celda);
    this.ny = Math.floor((D - 2 * margen) / this.celda);
    this.libre = new Uint8Array(this.nx * this.ny).fill(1);
  }

  private idx(i: number, j: number) {
    return j * this.nx + i;
  }
  aCelda(p: P): [number, number] {
    return [Math.floor((p.x - this.x0) / this.celda), Math.floor((p.y - this.y0) / this.celda)];
  }
  aPunto(i: number, j: number): P {
    return { x: this.x0 + (i + 0.5) * this.celda, y: this.y0 + (j + 0.5) * this.celda };
  }
  dentro(i: number, j: number) {
    return i >= 0 && j >= 0 && i < this.nx && j < this.ny;
  }
  esLibre(i: number, j: number) {
    return this.dentro(i, j) && this.libre[this.idx(i, j)] === 1;
  }

  /** Bloquea un rectángulo (en coordenadas de mundo) con un margen extra. */
  bloquear(x0: number, y0: number, x1: number, y1: number, margen = 0.12) {
    const [i0, j0] = this.aCelda({ x: Math.min(x0, x1) - margen, y: Math.min(y0, y1) - margen });
    const [i1, j1] = this.aCelda({ x: Math.max(x0, x1) + margen, y: Math.max(y0, y1) + margen });
    for (let j = Math.max(0, j0); j <= Math.min(this.ny - 1, j1); j++)
      for (let i = Math.max(0, i0); i <= Math.min(this.nx - 1, i1); i++) this.libre[this.idx(i, j)] = 0;
  }

  /** Celda libre más cercana a un punto (para destinos que caen dentro de un mueble). */
  cercana(p: P): [number, number] {
    let [ci, cj] = this.aCelda(p);
    ci = Math.max(0, Math.min(this.nx - 1, ci));
    cj = Math.max(0, Math.min(this.ny - 1, cj));
    if (this.esLibre(ci, cj)) return [ci, cj];
    for (let r = 1; r < 40; r++)
      for (let dj = -r; dj <= r; dj++)
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          if (this.esLibre(ci + di, cj + dj)) return [ci + di, cj + dj];
        }
    return [ci, cj];
  }

  private lineaLibre(a: P, b: P): boolean {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const pasos = Math.ceil(d / (this.celda * 0.5));
    for (let k = 0; k <= pasos; k++) {
      const t = k / Math.max(pasos, 1);
      const [i, j] = this.aCelda({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      if (!this.esLibre(i, j)) return false;
    }
    return true;
  }

  /** Camino de a hasta b (lista de puntos), suavizado; termina exactamente en b si b es alcanzable. */
  ruta(a: P, b: P): P[] {
    const [si, sj] = this.cercana(a);
    const [gi, gj] = this.cercana(b);
    const n = this.nx * this.ny;
    const g = new Float32Array(n).fill(Infinity);
    const f = new Float32Array(n).fill(Infinity);
    const de = new Int32Array(n).fill(-1);
    const cerrado = new Uint8Array(n);
    // Montículo de abiertos (el de menor f arriba): en el local grande hay el triple de casillas y mucha más gente
    const abiertos = new Monticulo(f);
    const h = (i: number, j: number) => Math.hypot(i - gi, j - gj);
    const s = this.idx(si, sj);
    g[s] = 0;
    f[s] = h(si, sj);
    abiertos.poner(s);
    const meta = this.idx(gi, gj);
    while (abiertos.largo) {
      const c = abiertos.sacar();
      if (cerrado[c]) continue;
      if (c === meta) break;
      cerrado[c] = 1;
      const ci = c % this.nx, cj = Math.floor(c / this.nx);
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = ci + di, nj = cj + dj;
          if (!this.esLibre(ni, nj)) continue;
          if (di && dj && (!this.esLibre(ci + di, cj) || !this.esLibre(ci, cj + dj))) continue;
          const nn = this.idx(ni, nj);
          if (cerrado[nn]) continue;
          const ng = g[c] + (di && dj ? 1.414 : 1);
          if (ng < g[nn]) {
            g[nn] = ng;
            f[nn] = ng + h(ni, nj);
            de[nn] = c;
            abiertos.poner(nn);
          }
        }
    }
    if (de[meta] === -1 && meta !== s) return [b];
    const celdas: P[] = [];
    for (let c = meta; c !== -1; c = de[c]) celdas.unshift(this.aPunto(c % this.nx, Math.floor(c / this.nx)));
    celdas.push(b);
    // Suavizado: saltar puntos mientras haya línea libre
    const out: P[] = [];
    let actual = a;
    let k = 0;
    while (k < celdas.length) {
      let lejos = k;
      for (let m = celdas.length - 1; m > k; m--)
        if (this.lineaLibre(actual, celdas[m])) {
          lejos = m;
          break;
        }
      out.push(celdas[lejos]);
      actual = celdas[lejos];
      k = lejos + 1;
    }
    return out;
  }
}

/** Montículo binario de casillas por su f al momento de entrar (una casilla puede quedar repetida: la vieja se salta
 *  al sacarla, porque ya está cerrada). */
class Monticulo {
  private c: number[] = [];
  private k: number[] = [];
  constructor(private f: Float32Array) {}
  get largo() {
    return this.c.length;
  }
  private cambiar(i: number, j: number) {
    const { c, k } = this;
    [c[i], c[j]] = [c[j], c[i]];
    [k[i], k[j]] = [k[j], k[i]];
  }
  poner(x: number) {
    const { c, k } = this;
    c.push(x);
    k.push(this.f[x]);
    let i = c.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] <= k[i]) break;
      this.cambiar(p, i);
      i = p;
    }
  }
  sacar(): number {
    const { c, k } = this;
    const top = c[0];
    const uc = c.pop()!, uk = k.pop()!;
    if (c.length) {
      c[0] = uc;
      k[0] = uk;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < c.length && k[l] < k[m]) m = l;
        if (r < c.length && k[r] < k[m]) m = r;
        if (m === i) break;
        this.cambiar(m, i);
        i = m;
      }
    }
    return top;
  }
}
