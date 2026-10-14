// Los ocho casos de «Desaparecidos de Astra», en el orden en que se desbloquean (el primero es el tutorial).
import type { Caso } from '../tipos';
import { CASO_PACTO } from './c1-pacto';
import { CASO_FARO } from './c2-faro';
import { CASO_COTA } from './c3-cota';
import { CASO_ECO } from './c4-eco';
import { CASO_NOCTURNA } from './c5-nocturna';
import { CASO_AMBARINA } from './c6-ambarina';
import { CASO_IRIDALIA } from './c7-iridalia';
import { CASO_ESTACION } from './c8-estacion';

export const CASOS: Caso[] = [CASO_PACTO, CASO_FARO, CASO_COTA, CASO_ECO, CASO_NOCTURNA, CASO_AMBARINA, CASO_IRIDALIA, CASO_ESTACION];
