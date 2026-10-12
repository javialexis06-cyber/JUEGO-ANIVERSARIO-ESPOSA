// La Feria de las cremas (Westwoods en el original): una feria de cremas para la cara encerrada en vallas. Al principio
// solo se puede andar por la plaza de la entrada; el resto se abre ganando la ruleta del Ruletero (Giocare en el
// original), que cobra cada tirada con las gotas doradas recogidas en la partida. Cada tirada da un premio, trae una
// tanda de mugrosos o abre la siguiente parte de la feria (hacia la izquierda), hasta tener las tres abiertas.
import type { IdObjeto } from './tipos';

/** El alto de la feria (es una franja ancha, como un pasillo muy grande). */
export const LIMITES_FERIA = { yMin: -720, yMax: 720 };
/** La valla del lado derecho (fija) y hasta dónde llega por la izquierda según cuántas partes estén abiertas. */
export const X_MAX_FERIA = 1100;
export const VALLAS_FERIA = [-1100, -3300] as const;
export const X_MIN_FERIA = -5500;
export const xMinFeria = (abiertas: number) => (abiertas >= 2 ? X_MIN_FERIA : abiertas === 1 ? VALLAS_FERIA[1] : VALLAS_FERIA[0]);
/** Los nombres de las tres partes, para los avisos. */
export const PARTES_FERIA = ['La plaza de la entrada', 'La calle de los puestos', 'La carpa de las cremas'] as const;

/** Dónde se para el Ruletero (en la plaza, junto a la primera valla, para que se vea pronto) y qué tan cerca abre. */
export const RULETERO: [number, number] = [-760, 160];
export const RADIO_RULETERO = 50;

/** Las tiradas: una, cinco o diez seguidas (las de varias salen un poquito más baratas, como en el original). */
export const TIRADAS = [
  { veces: 1, precio: 75 },
  { veces: 5, precio: 360 },
  { veces: 10, precio: 700 },
] as const;

export type IdPremioRuleta = 'abrir' | 'bolsa' | 'frasco' | 'arepa' | 'aspiradora' | 'ola' | 'hielo' | 'trebolito' | 'aji' | 'cofre' | 'patito' | 'bichos' | 'nada';

export interface DefPremio {
  id: IdPremioRuleta;
  nombre: string;
  /** Peso en la ruleta (el de abrir crece con cada tirada sin ganar). */
  peso: number;
  /** Lo que se suelta a los pies del jugador. */
  objeto?: IdObjeto;
  /** El ícono del atlas de objetos. */
  icono: string;
  /** Color de su casilla en la ruleta. */
  color: string;
}

/** Las casillas de la ruleta, en el orden en que se dibujan (la de abrir va arriba). */
export const PREMIOS_RULETA: DefPremio[] = [
  { id: 'abrir', nombre: '¡Se abre la feria!', peso: 0, icono: 'llaveFeria', color: '#F7C948' },
  { id: 'bolsa', nombre: 'Bolsa de gotas doradas', peso: 14, objeto: 'bolsa', icono: 'bolsa', color: '#FFE7A3' },
  { id: 'arepa', nombre: 'Arepita calientica', peso: 11, objeto: 'arepa', icono: 'arepa', color: '#F6C9A8' },
  { id: 'bichos', nombre: '¡Mugrosos sueltos!', peso: 12, icono: 'pompitaCrema', color: '#C9B6EA' },
  { id: 'aspiradora', nombre: 'La aspiradora', peso: 8, objeto: 'aspiradora', icono: 'aspiradora', color: '#BFE3F2' },
  { id: 'frasco', nombre: 'Frasco de gotas doradas', peso: 6, objeto: 'frasco', icono: 'frasco', color: '#FFD86B' },
  { id: 'nada', nombre: '¡Uy, casi!', peso: 13, icono: 'nadaFeria', color: '#F3E8DA' },
  { id: 'ola', nombre: 'Una ola de espuma', peso: 6, objeto: 'ola', icono: 'ola', color: '#9FD8F0' },
  { id: 'hielo', nombre: 'Cubito de hielo', peso: 5, objeto: 'hielo', icono: 'hielo', color: '#D7F1FF' },
  { id: 'cofre', nombre: '¡Un cofre!', peso: 5, objeto: 'cofre', icono: 'cofre', color: '#E8B26A' },
  { id: 'trebolito', nombre: 'Trebolito de la suerte', peso: 5, objeto: 'trebolito', icono: 'trebolito', color: '#A8DDA0' },
  { id: 'aji', nombre: 'Ají picante', peso: 4, objeto: 'aji', icono: 'aji', color: '#F59A8B' },
  { id: 'patito', nombre: '¡Patito dorado!', peso: 1.5, objeto: 'patito', icono: 'patito', color: '#FFEB8A' },
];
export const PREMIO = Object.fromEntries(PREMIOS_RULETA.map((p) => [p.id, p])) as Record<IdPremioRuleta, DefPremio>;

/** Probabilidad de abrir la siguiente parte: crece con cada tirada sin ganarla (para que no sea pura mala suerte). */
export function pesoAbrir(sinGanar: number) {
  return 12 + sinGanar * 7;
}

/** Saca un premio de la ruleta con un número al azar entre 0 y 1. */
export function girarRuleta(azar: number, puedeAbrir: boolean, sinGanar: number): IdPremioRuleta {
  const pesos = PREMIOS_RULETA.map((p) => (p.id === 'abrir' ? (puedeAbrir ? pesoAbrir(sinGanar) : 0) : p.peso));
  let r = azar * pesos.reduce((a, b) => a + b, 0);
  for (let k = 0; k < PREMIOS_RULETA.length; k++) {
    r -= pesos[k];
    if (r < 0) return PREMIOS_RULETA[k].id;
  }
  return 'nada';
}
