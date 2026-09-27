// Todas las puertas, por número.
import type { Nivel } from '../nivel';
import { CAP1 } from './cap01';

const capitulos: Nivel[][] = [CAP1];

export const NIVELES: Record<number, Nivel> = {};
capitulos.forEach((lista, c) => lista.forEach((nivel, i) => (NIVELES[c * 10 + i + 1] = nivel)));
