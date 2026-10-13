/** Retiene unos pocos escenarios recientes. La precarga nunca expulsa el que se está mostrando. */
export class CacheEntornos<T> {
  private entradas = new Map<string, T>();
  private activa = '';
  private creadas = 0;
  private aciertos = 0;
  constructor(private liberar: (valor: T) => void, private limite = 3) {}

  tiene(clave: string) { return this.entradas.has(clave); }
  obtener(clave: string, crear: () => T, activar = false): T {
    let valor = this.entradas.get(clave);
    if (valor) { this.aciertos++; this.entradas.delete(clave); }
    else { valor = crear(); this.creadas++; }
    this.entradas.set(clave, valor);
    if (activar) this.activa = clave;
    while (this.entradas.size > this.limite) {
      const vieja = [...this.entradas.keys()].find(k => k !== this.activa)!;
      const retirada = this.entradas.get(vieja)!;
      this.entradas.delete(vieja); this.liberar(retirada);
    }
    return valor;
  }
  get stats() { return { residentes: this.entradas.size, limite: this.limite, creadas: this.creadas, aciertos: this.aciertos }; }
  dispose() { for (const valor of this.entradas.values()) this.liberar(valor); this.entradas.clear(); this.activa = ''; }
}
