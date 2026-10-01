// Rejilla espacial para los choques: cada mugroso cae en una celda (de una tabla con hash, así el mapa puede ser
// infinito) y para saber quién está cerca de algo solo se miran las celdas de alrededor. Sin crear objetos.
export class Rejilla {
  readonly celda: number;
  private readonly mascara: number;
  private readonly cabeza: Int32Array;
  private readonly sig: Int32Array;
  /** En qué consulta se visitó cada cubeta (dos celdas pueden caer en la misma: no se repite). */
  private readonly visita: Int32Array;
  private consulta = 0;
  /** Resultado de la última consulta (índices). */
  readonly fuera: Int32Array;

  constructor(maximo: number, celda = 64, cubetas = 4096) {
    this.celda = celda;
    this.mascara = cubetas - 1;
    this.cabeza = new Int32Array(cubetas).fill(-1);
    this.visita = new Int32Array(cubetas);
    this.sig = new Int32Array(maximo).fill(-1);
    this.fuera = new Int32Array(maximo);
  }

  limpiar() {
    this.cabeza.fill(-1);
  }

  private cubeta(cx: number, cy: number) {
    return (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & this.mascara;
  }

  insertar(i: number, x: number, y: number) {
    const k = this.cubeta(Math.floor(x / this.celda), Math.floor(y / this.celda));
    this.sig[i] = this.cabeza[k];
    this.cabeza[k] = i;
  }

  /** Los índices en el rectángulo (pueden venir algunos de afuera por la tabla: hay que medir igual). */
  rect(x0: number, y0: number, x1: number, y1: number): number {
    const c = this.celda;
    const cx0 = Math.floor(x0 / c), cx1 = Math.floor(x1 / c), cy0 = Math.floor(y0 / c), cy1 = Math.floor(y1 / c);
    let n = 0;
    const max = this.fuera.length;
    const q = ++this.consulta;
    if ((cx1 - cx0 + 1) * (cy1 - cy0 + 1) > this.mascara) {
      for (let k = 0; k <= this.mascara && n < max; k++) for (let i = this.cabeza[k]; i !== -1 && n < max; i = this.sig[i]) this.fuera[n++] = i;
      return n;
    }
    for (let cy = cy0; cy <= cy1; cy++)
      for (let cx = cx0; cx <= cx1; cx++) {
        const k = this.cubeta(cx, cy);
        if (this.visita[k] === q) continue;
        this.visita[k] = q;
        for (let i = this.cabeza[k]; i !== -1 && n < max; i = this.sig[i]) this.fuera[n++] = i;
      }
    return n;
  }

  circulo(x: number, y: number, r: number): number {
    return this.rect(x - r, y - r, x + r, y + r);
  }
}
