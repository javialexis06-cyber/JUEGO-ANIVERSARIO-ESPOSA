// Índice de plantas: junta las definiciones de todas las áreas (datos/areas.ts).
import type { DefPlanta, IdPlanta } from '../tipos';
import { AREAS_DATOS } from './areas';

export const PLANTAS: Record<string, DefPlanta> = Object.create(null);
for (const area of AREAS_DATOS) for (const p of area.plantas) PLANTAS[p.id] = p;

/** Definición de una planta (undefined si el id no existe). */
export function defPlanta(id: IdPlanta): DefPlanta | undefined {
  return Object.hasOwn(PLANTAS, id) ? PLANTAS[id] : undefined;
}

/** Plantas del almanaque en orden (sin las de minijuegos). */
export function plantasAlmanaque(): DefPlanta[] {
  return Object.values(PLANTAS).filter((p) => !p.soloMinijuego);
}
