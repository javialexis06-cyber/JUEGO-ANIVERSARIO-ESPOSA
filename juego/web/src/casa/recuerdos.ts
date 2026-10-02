// Recuerdos flotantes (en el baño y durmiendo abrazados): la ventanita con los dibujos, las frases y la historia de
// los dos se descarga la primera vez que hace falta (es mucho dibujo y texto que no se necesita para abrir la casa).
// Por fuera es la misma ventanita de siempre (recuerdos_panel.ts).
import type { ModoRecuerdos, PanelRecuerdos as Panel } from './recuerdos_panel';

export type { ModoRecuerdos };

export class PanelRecuerdos {
  private real: Panel | null = null;
  private cargando: Promise<Panel> | null = null;
  /** Lo que se pidió mientras se descargaba (si ya no aplica, `reiniciar` lo cancela). */
  private pedido: ModoRecuerdos | null = null;

  get visible() {
    return this.real ? this.real.visible : this.pedido !== null;
  }

  mostrar(modo: ModoRecuerdos) {
    if (this.real) return this.real.mostrar(modo);
    this.pedido = modo;
    this.cargando ??= import('./recuerdos_panel').then(({ PanelRecuerdos: P }) => (this.real = new P()));
    void this.cargando.then((r) => {
      if (this.pedido) r.mostrar(this.pedido);
      this.pedido = null;
    }).catch(() => (this.cargando = null));
  }

  reiniciar() {
    this.pedido = null;
    this.real?.reiniciar();
  }
}
