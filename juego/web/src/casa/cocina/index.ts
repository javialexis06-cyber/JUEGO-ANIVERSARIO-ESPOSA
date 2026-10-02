// La cocina de chef: abre el restaurante que se escogió (se carga aparte, solo cuando se va a cocinar).
import '@fontsource/courier-prime/latin-700.css';
import './cocina.css';
import { abrirCocina, cocina, type Receta } from './motor';
import type { OpcionesCocina, RecetaId } from './tipos';
import { FRAPPES } from './frappes';
import { FRESAS } from './fresas';
import { WAFLES } from './wafles';

const RECETA: Partial<Record<RecetaId, Receta>> = { wafles: WAFLES, fresas: FRESAS, frappes: FRAPPES };

export function jugarCocina(o: OpcionesCocina): Promise<void> {
  return abrirCocina(RECETA[o.receta] ?? WAFLES, o);
}
/** `cocina.actual` (la que está abierta) y `cocina.alTerminarDia` (ganchos para escenas al final de cada día). */
export { cocina };
