// Versión para amigos: reemplaza a `src/reacciones/pareja.ts` (lo que dicen Él y Ella en sus globitos) al compilar
// con `vite build --mode amigos`. Sin esto, los muñequitos hablan con las frases neutras de reacciones/frases.ts.
import type { Rol } from '../../casa/modelo';
import type { Situacion } from '../../reacciones/frases';

export const FRASES_PAREJA: Record<Situacion, Record<Rol, string[]>> | null = null;
