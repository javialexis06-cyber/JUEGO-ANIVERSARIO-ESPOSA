// Todas las áreas de datos, en el orden de la aventura. Cada área llena su propio archivo; este índice no se toca.
import type { DatosArea } from '../tipos';
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

export const AREAS_DATOS: readonly DatosArea[] = [DIA, NOCHE, PISCINA, NIEBLA, TEJADO, TIENDA, RIO, VIAS, DESIERTO, PARAMO, INVERNADERO];
