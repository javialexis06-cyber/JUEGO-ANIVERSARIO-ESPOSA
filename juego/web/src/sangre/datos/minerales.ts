// Los seis minerales del Pozo (lo de Deep Rock Galactic: Survivor, con nombres del mito de Astra, docs/mitologia.md):
// salen en vetas sueltas de una casilla, no se gastan en la partida y se llevan a casa al extraerse. Cada bioma es
// rico en dos o tres; los demás aparecen poquito. Cada mejora del Pozo cuesta ceniza y su mineral.
import { MINERALES_ORDEN, type IdBioma, type IdMineral } from '../tipos';

export interface DefMineral {
  id: IdMineral;
  nombre: string;
  /** De dónde viene en el mito (se ve en el Pozo). */
  origen: string;
  color: string;
  brillo: string;
  ricos: IdBioma[];
  glifo: string;
}

export const MINERALES: Record<IdMineral, DefMineral> = {
  plata: { id: 'plata', nombre: 'Plata del velo', origen: 'La luz plateada del velo de Lara: endurece el cuerpo.', color: '#c9d3e8', brillo: '#a8c8ff', ricos: ['cementerio', 'catacumbas'], glifo: 'luna' },
  chispa: { id: 'chispa', nombre: 'Chispa de Aura', origen: 'El fuego de Aura que quedó en la roca: aviva el golpe.', color: '#e0782a', brillo: '#ffa02a', ricos: ['abadia', 'castillo'], glifo: 'chispas' },
  gema: { id: 'gema', nombre: 'Gema de dragón', origen: 'Las gemas oscuras de los dragones de la mina: atraen riqueza.', color: '#6a2a9a', brillo: '#c25aff', ricos: ['minas', 'castillo'], glifo: 'cristal' },
  escarcha: { id: 'escarcha', nombre: 'Escarcha del alba', origen: 'La escarcha de los unicornios: purifica y templa.', color: '#bfefff', brillo: '#8af0ff', ricos: ['catacumbas', 'abadia'], glifo: 'copo' },
  polvo: { id: 'polvo', nombre: 'Polvo de estrellas', origen: 'Lo que sueltan los grifos al patrullar el escudo: da alas.', color: '#f2d9b0', brillo: '#ffe6b8', ricos: ['cementerio', 'castillo'], glifo: 'sol' },
  esmeralda: { id: 'esmeralda', nombre: 'Esmeralda de Celia', origen: 'La luna pequeña de Celia, hecha piedra: trae suerte.', color: '#1e8a4e', brillo: '#3aff8a', ricos: ['minas', 'catacumbas'], glifo: 'espiga' },
};

export { MINERALES_ORDEN };

/** Índice de un mineral (el de las vetas y los recogibles). */
export const indiceMineral = (id: IdMineral) => MINERALES_ORDEN.indexOf(id);

/** Mineral que pide cada nivel de una mejora del Pozo (sube como en Deep Rock). */
const ESCALERA = [2, 4, 7, 10, 14, 18, 23, 28, 34, 40];
export const precioMineral = (nivel: number) => ESCALERA[Math.min(ESCALERA.length - 1, nivel)];

/** Cuántas vetas de cada mineral salen en un mapa de este bioma. */
export function vetasDe(bioma: IdBioma, mineral: IdMineral, azar: () => number) {
  return MINERALES[mineral].ricos.includes(bioma) ? 6 + Math.floor(azar() * 3) : azar() < 0.65 ? 1 : 0;
}
