/** Reintenta progreso y sueldo por separado: una escritura rechazada no repite la que ya se confirmó. */
export class GuardadoPuertas {
  private copia: string | null = null;
  private sueldo = 0;
  constructor(private disco: Pick<Storage, 'getItem' | 'setItem'> = {
    getItem: k => localStorage.getItem(k),
    setItem: (k, v) => localStorage.setItem(k, v),
  }) {}
  get pendiente() { return this.copia !== null || this.sueldo > 0; }
  guardar(progreso: object, sueldo = 0) {
    this.copia = JSON.stringify(progreso);
    this.sueldo += Math.max(0, Math.floor(sueldo));
    return this.confirmar();
  }
  confirmar() {
    try {
      if (this.copia !== null) {
        this.disco.setItem('cien-puertas', this.copia);
        this.copia = null;
      }
      if (this.sueldo > 0) {
        const anterior = Number(this.disco.getItem('nuestro-hogar-sueldo')) || 0;
        this.disco.setItem('nuestro-hogar-sueldo', String(Math.max(0, anterior) + this.sueldo));
        this.sueldo = 0;
      }
      return true;
    } catch { return false; }
  }
}
