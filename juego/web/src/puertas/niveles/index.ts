// Todas las puertas, por número.
import type { Nivel } from '../nivel';
import { CAP1 } from './cap01';
import { CAP2 } from './cap02';
import { CAP3 } from './cap03';
import { CAP4 } from './cap04';

const capitulos: Nivel[][] = [CAP1, CAP2, CAP3, CAP4];

export const NIVELES: Record<number, Nivel> = {};
capitulos.forEach((lista, c) => lista.forEach((nivel, i) => (NIVELES[c * 10 + i + 1] = nivel)));
