// Lo que hace falta saber de un golpe (sin dependencias: lo crean las armas, los aliados y las mecánicas al cargar).
/** Se reutiliza: nada de crear objetos por golpe. */
export class Golpe {
  j = -1;
  ranura = -1;
  etq = 0;
  critico = 0;
  empuje = 0;
  dx = 0;
  dy = 0;
  quema = 0;
  veneno = 0;
  sangrado = 0;
  lento = 0;
  aturde = 0;
  maldicion = 0;
  flags = 0;
  /** Viene de un aliado (no roba vida, no cuenta para el arma). */
  aliado = false;
  /** Viene de la habilidad activa. */
  habilidad = false;
  /** Sustancias del alquimista (1 ácido/veneno, 2 fuego, 4 hielo, 8 sagrado). */
  sustancia = 0;
  /** Umbral de ejecución extra (tajo del verdugo). */
  ejecutaExtra = 0;
  /** No muestra número. */
  callado = false;
  reset() {
    this.j = -1;
    this.ranura = -1;
    this.etq = 0;
    this.critico = 0;
    this.empuje = 0;
    this.dx = this.dy = 0;
    this.quema = this.veneno = this.sangrado = this.lento = this.aturde = this.maldicion = 0;
    this.flags = 0;
    this.aliado = false;
    this.habilidad = false;
    this.sustancia = 0;
    this.ejecutaExtra = 0;
    this.callado = false;
    return this;
  }
}

