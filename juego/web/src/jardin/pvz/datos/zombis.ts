// Índice de zombis: junta las definiciones de todas las áreas (datos/areas.ts).
import type { DefZombi, IdZombi } from '../tipos';
import { AREAS_DATOS } from './areas';

export const ZOMBIS: Record<string, DefZombi> = Object.create(null);
for (const area of AREAS_DATOS) for (const z of area.zombis) ZOMBIS[z.id] = z;

/** Definición de un zombi (undefined si el id no existe). */
export function defZombi(id: IdZombi): DefZombi | undefined {
  return Object.hasOwn(ZOMBIS, id) ? ZOMBIS[id] : undefined;
}
