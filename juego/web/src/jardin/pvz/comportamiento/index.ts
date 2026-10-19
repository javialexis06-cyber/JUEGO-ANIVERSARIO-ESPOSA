// Registro explícito de comportamientos (sin import.meta.glob: las pruebas usan esbuild). Cada área llena su
// propio archivo; este índice ya los importa todos y no hace falta tocarlo.
import type { ComportamientoPlanta, ComportamientoZombi, RegistroComportamientos } from '../tipos';
import { DIA } from './dia';
import { NOCHE } from './noche';
import { PISCINA } from './piscina';
import { NIEBLA } from './niebla';
import { TEJADO } from './tejado';
import { TIENDA } from './tienda';
import { RIO } from './rio';
import { VIAS } from './vias';
import { DESIERTO } from './desierto';
import { PARAMO } from './paramo';
import { INVERNADERO } from './invernadero';

const AREAS: readonly RegistroComportamientos[] = [DIA, NOCHE, PISCINA, NIEBLA, TEJADO, TIENDA, RIO, VIAS, DESIERTO, PARAMO, INVERNADERO];

export const COMPORTAMIENTO_PLANTAS: Record<string, ComportamientoPlanta> = Object.create(null);
export const COMPORTAMIENTO_ZOMBIS: Record<string, ComportamientoZombi> = Object.create(null);
for (const area of AREAS) {
  Object.assign(COMPORTAMIENTO_PLANTAS, area.plantas);
  Object.assign(COMPORTAMIENTO_ZOMBIS, area.zombis);
}
