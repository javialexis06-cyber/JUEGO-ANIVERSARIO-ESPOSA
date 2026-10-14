// El vuelo y su premio se confirman juntos. Un corte conserva la misma copia para reintentar sin repetir compras.
import type { Casa, Rol } from '../modelo';
import { copiaProgreso, monedasVuelo, TOPE_MONEDAS_DIA, type ProgresoCohete } from './datos';
import type { PremioCasa } from './resultado';

export interface VueloGuardado { numero: number; segundos: number; dia: string }
export type GuardarCohete = (p: ProgresoCohete, vuelo?: VueloGuardado) =>
  Promise<PremioCasa | boolean | void> | PremioCasa | boolean | void;

/** Se ejecuta dentro de la escritura de la casa, también cuando se repite por un conflicto de versiones. */
export function aplicarGuardadoCohete(c: Casa, rol: Rol, p: ProgresoCohete, vuelo?: VueloGuardado, pagadasAntes = 0): PremioCasa {
  const anterior = c.cohete?.[rol];
  const diario = vuelo ? `${vuelo.dia}|${rol}|retrete` : '';
  const recibo = vuelo ? `${diario}-vuelo:${vuelo.numero}` : '';
  const ya = vuelo ? Math.max(c.diario[diario] ?? 0, pagadasAntes) : 0;
  const pagado = vuelo ? c.diario[recibo] : 0;
  const nuevo = !!vuelo && (anterior?.vuelos ?? 0) < vuelo.numero;
  const monedas = pagado ? pagado - 1 : nuevo ? Math.max(0, Math.min(monedasVuelo(vuelo.segundos), TOPE_MONEDAS_DIA - ya)) : 0;
  // Un resultado antiguo reenviado no puede borrar un vuelo más reciente.
  if (!anterior || anterior.vuelos <= p.vuelos) c.cohete = { ...(c.cohete ?? {}), [rol]: copiaProgreso(p) };
  if (nuevo && !pagado) {
    c.diario[diario] = ya + monedas;
    c.diario[recibo] = monedas + 1; // También reconoce vuelos que no dieron monedas.
    c.monedas += monedas;
  }
  return { monedas, tope: !!vuelo && monedasVuelo(vuelo.segundos) > 0 && Math.max(ya, c.diario[diario] ?? 0) >= TOPE_MONEDAS_DIA };
}

/** La limpieza del diario al cambiar de día no reabre el cupo de un vuelo que seguía pendiente. */
export class PremiosCohete {
  private pagadas = new Map<string, number>();
  aplicar(c: Casa, rol: Rol, p: ProgresoCohete, vuelo?: VueloGuardado) {
    const clave = vuelo ? `${vuelo.dia}|${rol}|retrete` : '';
    const ya = vuelo ? Math.max(this.pagadas.get(clave) ?? 0, c.diario[clave] ?? 0) : 0;
    if (vuelo) this.pagadas.set(clave, ya); // Solo pagos previos leídos; nunca el pago aún sin confirmar.
    return aplicarGuardadoCohete(c, rol, p, vuelo, ya);
  }
}

export class GuardadoCohete {
  private copia: { p: ProgresoCohete; vuelo?: VueloGuardado } | null = null;
  private enCurso: Promise<boolean> | null = null;
  premio: PremioCasa | null = null;
  constructor(readonly progreso: ProgresoCohete, private escribir?: GuardarCohete) {}
  get pendiente() { return !!this.copia; }

  registrar(vuelo?: VueloGuardado) {
    if (this.pendiente) throw new Error('Hay un guardado del retrete pendiente.');
    this.copia = { p: copiaProgreso(this.progreso), vuelo: vuelo ? { ...vuelo } : undefined };
    this.premio = null;
  }

  confirmar(): Promise<boolean> {
    if (this.enCurso) return this.enCurso;
    if (!this.copia) return Promise.resolve(true);
    const copia = this.copia;
    const intento = async () => {
      try {
        const r = await this.escribir?.(copiaProgreso(copia.p), copia.vuelo ? { ...copia.vuelo } : undefined);
        if (r === false) return false;
        this.premio = r && typeof r === 'object' ? r : null;
        this.copia = null;
        return true;
      } catch { return false; }
    };
    this.enCurso = intento().finally(() => { this.enCurso = null; });
    return this.enCurso;
  }
}
