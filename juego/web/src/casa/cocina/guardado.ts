// Las escrituras de un restaurante van en orden. Un día pendiente se aplica una sola vez a los puntos del chef;
// si falla la escritura, se conserva para reintentar antes de comprar, seguir o salir.
import type { Casa, Rol } from '../modelo';
import { rangoDe, RESTAURANTES, type OpcionesCocina, type ProgresoCocina, type RecetaId, type ResultadoDia } from './tipos';

/** El mismo resultado puede reenviarse tras un corte: monedas y platos se pagan una sola vez. */
export function aplicarGuardadoCocina(c: Casa, rol: Rol, receta: RecetaId, p: ProgresoCocina, dia?: ResultadoDia) {
  const anterior = c.cocina?.[rol]?.[receta];
  const clave = dia ? `cocina-pago:${rol}:${receta}:${dia.dia}` : '';
  const pagado = !!c.diario[clave] || (dia && (anterior?.dia ?? 1) > dia.dia);
  c.cocina = { ...(c.cocina ?? {}), [rol]: { ...(c.cocina?.[rol] ?? {}), [receta]: structuredClone(p) } };
  if (!dia || pagado || (!dia.monedas && !dia.platos)) return;
  c.diario[clave] = 1;
  c.monedas += dia.monedas;
  const plato = RESTAURANTES.find((r) => r.id === receta)!.plato;
  if (dia.platos) c.inventario[plato] = (c.inventario[plato] ?? 0) + dia.platos;
}

export class GuardadoCocina {
  private registrados = new Map<number, { rangoAntes: number; mio: ResultadoDia }>();
  private pendientes = new Map<number, ResultadoDia>();
  private cola: Promise<unknown> = Promise.resolve();
  private enCurso: Promise<boolean> | null = null;
  private compraPendiente: { id: string; nivel: number; precio: number; copia: ProgresoCocina } | null = null;
  fallo = false;

  constructor(readonly progreso: ProgresoCocina, private guardar: OpcionesCocina['guardar']) {}

  get pendiente() { return this.pendientes.size > 0 || this.compraPendiente !== null; }
  get guardando() { return this.enCurso !== null; }

  registrar(n: number, r: ResultadoDia, anfitrion: boolean, premioCasa: boolean) {
    const anterior = this.registrados.get(n);
    if (anterior) return { ...anterior, nuevo: false };
    const p = this.progreso;
    const rangoAntes = rangoDe(p.xp);
    p.xp += r.xp;
    p.propinas += r.propinas;
    p.servidos += r.servidos;
    p.perfectos += r.perfectos;
    p.mejor = Math.max(p.mejor, r.promedio);
    if (anfitrion) p.dia = r.dia + 1;
    const mio = { ...r, ...(!anfitrion || !premioCasa ? { monedas: 0, platos: 0 } : {}) };
    const registro = { rangoAntes, mio };
    this.registrados.set(n, registro);
    this.pendientes.set(n, mio);
    return { ...registro, nuevo: true };
  }

  private enOrden<T>(fn: () => Promise<T>): Promise<T> {
    const tarea = this.cola.then(fn);
    this.cola = tarea.catch(() => undefined);
    return tarea;
  }

  private async volcar() {
    await this.confirmarCompra();
    for (const [n, r] of this.pendientes) {
      await this.guardar(structuredClone(this.progreso), structuredClone(r));
      this.pendientes.delete(n);
    }
    this.fallo = false;
  }

  private async confirmarCompra() {
    const c = this.compraPendiente;
    if (!c) return;
    // Si el servidor escribió pero se perdió la confirmación, reenviar esta misma copia no cobra otra vez.
    await this.guardar(structuredClone(c.copia));
    this.progreso.propinas -= c.precio;
    this.progreso.mejoras[c.id] = c.nivel + 1;
    this.compraPendiente = null;
  }

  guardarPendientes(): Promise<boolean> {
    if (this.enCurso) return this.enCurso;
    const tarea = this.enOrden(() => this.volcar()).then(() => true, () => {
      this.fallo = true;
      return false;
    });
    this.enCurso = tarea;
    void tarea.then(() => { if (this.enCurso === tarea) this.enCurso = null; });
    return tarea;
  }

  /** La mejora y su coste se hacen efectivos únicamente cuando se confirma el guardado. */
  comprar(id: string, nivel: number, precio: number): Promise<boolean> {
    return this.enOrden(async () => {
      const reintento = this.compraPendiente?.id === id && this.compraPendiente.nivel === nivel;
      await this.volcar();
      if (reintento) return true;
      const p = this.progreso;
      if ((p.mejoras[id] ?? 0) !== nivel || p.propinas < precio) return false;
      const copia = structuredClone(p);
      copia.propinas -= precio;
      copia.mejoras[id] = nivel + 1;
      this.compraPendiente = { id, nivel, precio, copia };
      // Aplicar solo el coste y la mejora: conservar los puntos de otros días recibidos durante la escritura.
      await this.confirmarCompra();
      this.fallo = false;
      return true;
    }).catch(() => { this.fallo = true; return false; });
  }

  async esperar(): Promise<boolean> {
    await this.cola;
    return this.guardarPendientes();
  }
}
