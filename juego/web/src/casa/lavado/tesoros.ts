// Los tesoros del baño (las reliquias del original): cada uno está tirado en un sitio fijo de un escenario, sale con
// una flecha verde que lo señala y, al recogerlo, abre algo para siempre (casi siempre un modo de juego). Como en el
// original, los de los modos difíciles solo aparecen después de ganar ese escenario.
import type { IdEscenario, IdModo, IdTesoro } from './tipos';

export interface DefTesoro {
  id: IdTesoro;
  nombre: string;
  /** La reliquia del original que copia. */
  original: string;
  /** Lo que abre (para el aviso al encontrarlo y la colección). */
  abre: string;
  /** Dónde está tirado (null: se consigue de otra forma, como el monedero que vende el vendedor ambulante). */
  escenario: IdEscenario | null;
  x: number;
  y: number;
  /** El escenario que hay que haber ganado para que aparezca. */
  gano?: IdEscenario;
  /** El modo que abre. */
  modo?: IdModo;
  /** Para la colección mientras no se tiene. */
  pista: string;
}

export const TESOROS: DefTesoro[] = [
  {
    id: 'cuento', nombre: 'El Cuento al azar', original: 'Brave Story', abre: 'Modo Nivel al azar: las mejoras se escogen solas y la lavada no se detiene',
    escenario: 'cara', x: -2400, y: -1600, modo: 'azar', pista: 'Está tirado en La Cara, muy arriba a la izquierda',
  },
  {
    id: 'mapa', nombre: 'El Mapa del baño', original: 'Milky Way Map', abre: 'El mapa en la pausa y flechas hacia los anillos y aretes escondidos',
    escenario: 'lavamanos', x: -2100, y: -100, pista: 'Está tirado en El Lavamanos, bien a la izquierda',
  },
  {
    id: 'ruleta', nombre: 'La Ruleta de la abuela', original: 'Trisection', abre: 'Modo Ruleta de sorpresas: cada minuto la ruleta escoge algo que pasa',
    escenario: 'banera', x: 1800, y: -1700, modo: 'ruleta', pista: 'Está tirada en La Bañera, muy arriba a la derecha',
  },
  {
    id: 'recetas', nombre: 'El Libro de recetas', original: 'Great Gospel', abre: 'Modo Sin límite: con todo al máximo, cada nivel le sube algo a un arma, sin tope',
    escenario: 'cara', x: 2300, y: 1500, gano: 'cara', modo: 'sinLimite', pista: 'Aparece en La Cara (muy abajo a la derecha) después de ganarla',
  },
  {
    id: 'calentador', nombre: 'El Calentador', original: 'Seventh Trumpet', abre: 'Modo Agua caliente sin fin: no llega la Ducha Helada y cada 30 minutos todo vuelve a empezar más duro',
    escenario: 'lavamanos', x: 4200, y: 80, gano: 'lavamanos', modo: 'infinito', pista: 'Aparece en El Lavamanos (lejísimos a la derecha) después de ganarlo',
  },
  {
    id: 'espejoReves', nombre: 'El Espejo al revés', original: "Gracia's Mirror", abre: 'Modo Del otro lado del espejo: mugre mucho más dura, el triple de gotas doradas y más suerte',
    escenario: 'banera', x: -2200, y: 1000, gano: 'banera', modo: 'inverso', pista: 'Aparece en La Bañera (muy abajo a la izquierda) después de ganarla',
  },
  {
    id: 'monedero', nombre: 'El Monedero', original: 'Glass Vizard', abre: 'El vendedor ambulante sale en todos los escenarios',
    escenario: null, x: 0, y: 0, pista: 'Se lo compras al vendedor ambulante',
  },
];

export const TESORO = Object.fromEntries(TESOROS.map((t) => [t.id, t])) as Record<IdTesoro, DefTesoro>;
export const ID_TESOROS = TESOROS.map((t) => t.id);

export interface DefModo {
  id: IdModo;
  nombre: string;
  emoji: string;
  desc: string;
}

/** Los modos (además de Apurado), en el orden en que se muestran. */
export const MODOS: DefModo[] = [
  { id: 'hiper', nombre: 'Hiper', emoji: '⚡', desc: 'Todo va más rápido: +50 % de gotas doradas y +10 % de suerte' },
  { id: 'inverso', nombre: 'Del otro lado del espejo', emoji: '🪞', desc: 'Mugre con el triple de vida (y crece cada minuto), el triple de gotas doradas y +25 % de suerte' },
  { id: 'infinito', nombre: 'Agua caliente sin fin', emoji: '♨️', desc: 'No llega la Ducha Helada: cada 30 minutos las oleadas vuelven a empezar más duras' },
  { id: 'sinLimite', nombre: 'Sin límite', emoji: '📖', desc: 'Con todo al máximo, cada nivel le sube algo a un arma, sin tope' },
  { id: 'ruleta', nombre: 'Ruleta de sorpresas', emoji: '🎡', desc: 'Cada minuto la ruleta escoge algo: arepas, cofres, hielo, hordas…' },
  { id: 'azar', nombre: 'Nivel al azar', emoji: '🎲', desc: 'Las mejoras se escogen solas, sin pausar' },
];
export const MODO = Object.fromEntries(MODOS.map((m) => [m.id, m])) as Record<IdModo, DefModo>;
export const ID_MODOS = MODOS.map((m) => m.id);

/** El tesoro que abre cada modo (el Hiper no: se abre venciendo al jefe del minuto 25 de cada escenario). */
export const TESORO_DE_MODO: Partial<Record<IdModo, IdTesoro>> = Object.fromEntries(
  TESOROS.filter((t) => t.modo).map((t) => [t.modo, t.id]),
) as Partial<Record<IdModo, IdTesoro>>;

/** Lo que sube cada «Sin límite» (por toma) y su tope. */
export const LIMITE: Record<'dano' | 'area' | 'enfr' | 'cant' | 'dur' | 'perfora', { nombre: string; paso: number; max: number; peso: number }> = {
  dano: { nombre: 'Daño', paso: 0.06, max: 99, peso: 10 },
  area: { nombre: 'Área', paso: 0.04, max: 1.5, peso: 6 },
  enfr: { nombre: 'Recarga', paso: 0.02, max: 0.4, peso: 4 },
  cant: { nombre: 'Cantidad', paso: 1, max: 6, peso: 1.2 },
  dur: { nombre: 'Duración', paso: 0.05, max: 1.5, peso: 4 },
  perfora: { nombre: 'Atraviesa', paso: 1, max: 10, peso: 3 },
};
export type StatLimite = keyof typeof LIMITE;
