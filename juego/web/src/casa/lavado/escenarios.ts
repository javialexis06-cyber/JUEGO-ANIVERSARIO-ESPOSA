// Los escenarios y sus oleadas minuto a minuto, como en el original: cada minuto dice cuántos mugrosos tiene que
// haber como mínimo en pantalla (si hay menos, llegan de golpe), cada cuánto aparece una tanda (uno de cada tipo
// de la lista) y qué tipos salen. Encima, eventos a minutos fijos: enjambres que cruzan, anillos que se cierran,
// muros, élites que sueltan cofre y jefes. A los 30:00 llega la Ducha Helada.
import type { IdEnemigo, IdEscenario } from './tipos';

export interface Oleada {
  /** Mínimo en pantalla. */
  min: number;
  /** Segundos entre tandas. */
  cada: number;
  tipos: IdEnemigo[];
}

export type TipoEvento = 'jefe' | 'elite' | 'enjambre' | 'anillo' | 'muro' | 'carta' | 'flotar';

export interface EventoOleada {
  /** Segundo de la partida. */
  t: number;
  tipo: TipoEvento;
  enemigo: IdEnemigo;
  cant?: number;
  aviso?: string;
}

export interface DefEscenario {
  id: IdEscenario;
  nombre: string;
  original: string;
  desc: string;
  /** Pasillo (como la biblioteca): el mapa tiene techo y piso. */
  limites: { yMin: number; yMax: number } | null;
  oleadas: Oleada[];
  eventos: EventoOleada[];
  /** Cómo se gana. */
  desbloqueo: string;
}

const o = (min: number, cada: number, ...tipos: IdEnemigo[]): Oleada => ({ min, cada, tipos });
const m = (mm: number, ss = 0) => mm * 60 + ss;

export const ESCENARIOS: Record<IdEscenario, DefEscenario> = {
  cara: {
    id: 'cara',
    nombre: 'La Cara',
    original: 'Bosque Loco',
    desc: 'Tu propia carita, con poros, pequitas y cachetes. Los gérmenes llegan de todos lados.',
    limites: null,
    desbloqueo: 'Desde el principio',
    oleadas: [
      o(14, 1.0, 'germen'),
      o(28, 1.0, 'germen', 'puntoNegro'),
      o(40, 0.9, 'puntoNegro', 'germen'),
      o(50, 0.8, 'puntoNegro', 'acaro'),
      o(60, 0.8, 'acaro', 'granito'),
      o(70, 0.7, 'granito', 'germen', 'acaro'),
      o(80, 0.65, 'granito', 'acaro'),
      o(90, 0.6, 'bacteria', 'puntoNegro'),
      o(100, 0.55, 'bacteria', 'acaro'),
      o(105, 0.5, 'bacteria', 'pelusa'),
      o(110, 0.5, 'pelusa', 'granito'),
      o(120, 0.45, 'pelusa', 'bacteria'),
      o(130, 0.42, 'virus', 'pelusa'),
      o(140, 0.4, 'virus', 'bacteria'),
      o(150, 0.36, 'virus', 'germen', 'pelusa'),
      o(160, 0.34, 'barrito', 'virus'),
      o(170, 0.32, 'barrito', 'pelusa'),
      o(180, 0.3, 'barrito', 'virus'),
      o(190, 0.28, 'lagana', 'barrito'),
      o(200, 0.26, 'lagana', 'virus'),
      o(210, 0.25, 'lagana', 'barrito'),
      o(220, 0.24, 'mugre', 'lagana'),
      o(230, 0.22, 'mugre', 'barrito'),
      o(240, 0.2, 'moco', 'lagana'),
      o(250, 0.2, 'moco', 'mugre'),
      o(260, 0.18, 'moco', 'mugre', 'barrito'),
      o(270, 0.16, 'mugre', 'moco'),
      o(280, 0.15, 'mugre', 'moco', 'lagana'),
      o(290, 0.12, 'mugre', 'moco'),
      o(300, 0.1, 'mugre', 'moco', 'virus'),
    ],
    eventos: [
      { t: m(1, 30), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 16, aviso: '¡Una manada de grasa por la zona T!' },
      { t: m(2, 30), tipo: 'elite', enemigo: 'granito' },
      { t: m(3, 40), tipo: 'enjambre', enemigo: 'germen', cant: 22 },
      { t: m(5), tipo: 'flotar', enemigo: 'caspa', cant: 14, aviso: '¡Está nevando caspa!' },
      { t: m(5, 20), tipo: 'elite', enemigo: 'acaro' },
      { t: m(6, 10), tipo: 'anillo', enemigo: 'puntoNegro', cant: 34, aviso: '¡Te rodearon los puntos negros!' },
      { t: m(7, 40), tipo: 'elite', enemigo: 'bacteria' },
      { t: m(9), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 30 },
      { t: m(10), tipo: 'jefe', enemigo: 'espinillon', aviso: '¡Llegó el Espinillón!' },
      { t: m(11), tipo: 'carta', enemigo: 'reinaCaspa', aviso: 'La Reina Caspa trae una carta de amor…' },
      { t: m(12, 30), tipo: 'flotar', enemigo: 'caspa', cant: 20 },
      { t: m(12, 40), tipo: 'elite', enemigo: 'pelusa' },
      { t: m(13, 20), tipo: 'anillo', enemigo: 'bacteria', cant: 36 },
      { t: m(14, 20), tipo: 'elite', enemigo: 'virus' },
      { t: m(15), tipo: 'jefe', enemigo: 'granMoco', aviso: '¡El Gran Moco!' },
      { t: m(16, 30), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 40 },
      { t: m(17, 10), tipo: 'elite', enemigo: 'barrito' },
      { t: m(18), tipo: 'muro', enemigo: 'lagana', cant: 30, aviso: '¡Un muro de lagañas!' },
      { t: m(19), tipo: 'anillo', enemigo: 'virus', cant: 40 },
      { t: m(20), tipo: 'jefe', enemigo: 'senorLagana', aviso: '¡Don Lagaña se despertó!' },
      { t: m(21), tipo: 'carta', enemigo: 'reinaCaspa', aviso: 'Otra carta de amor perdida…' },
      { t: m(22, 30), tipo: 'elite', enemigo: 'mugre' },
      { t: m(23, 20), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 50 },
      { t: m(24), tipo: 'anillo', enemigo: 'lagana', cant: 44 },
      { t: m(25), tipo: 'jefe', enemigo: 'barroNegro', aviso: '¡El Barro Negro hace temblar la cara!' },
      { t: m(26, 30), tipo: 'elite', enemigo: 'moco' },
      { t: m(27, 20), tipo: 'flotar', enemigo: 'caspa', cant: 30 },
      { t: m(28), tipo: 'muro', enemigo: 'moco', cant: 36 },
      { t: m(29), tipo: 'elite', enemigo: 'mugre' },
    ],
  },
  lavamanos: {
    id: 'lavamanos',
    nombre: 'El Lavamanos',
    original: 'Biblioteca incrustada',
    desc: 'Un pasillo de porcelana larguísimo, con la llave, el jabón y el vaso de los cepillos. Arriba y abajo no hay salida.',
    limites: { yMin: -195, yMax: 195 },
    desbloqueo: 'Aguanta 15 minutos en La Cara',
    oleadas: [
      o(14, 1.0, 'sarro'),
      o(28, 1.0, 'sarro', 'pastaSeca'),
      o(40, 0.9, 'pastaSeca', 'sarro'),
      o(50, 0.8, 'pastaSeca', 'acaro'),
      o(60, 0.8, 'acaro', 'cucaracha'),
      o(70, 0.7, 'cucaracha', 'sarro', 'acaro'),
      o(80, 0.65, 'cucaracha', 'acaro'),
      o(90, 0.6, 'hongo', 'pastaSeca'),
      o(100, 0.55, 'hongo', 'acaro'),
      o(105, 0.5, 'hongo', 'cucaracha'),
      o(110, 0.5, 'cucaracha'),
      o(120, 0.45, 'cucaracha', 'hongo'),
      o(130, 0.42, 'pelo', 'cucaracha'),
      o(140, 0.4, 'pelo', 'hongo'),
      o(150, 0.36, 'pelo', 'sarro', 'cucaracha'),
      o(160, 0.34, 'barrito', 'pelo'),
      o(170, 0.32, 'barrito', 'cucaracha'),
      o(180, 0.3, 'barrito', 'pelo'),
      o(190, 0.28, 'moho', 'barrito'),
      o(200, 0.26, 'moho', 'pelo'),
      o(210, 0.25, 'moho', 'barrito'),
      o(220, 0.24, 'jabonSucio', 'moho'),
      o(230, 0.22, 'jabonSucio', 'barrito'),
      o(240, 0.2, 'moco', 'moho'),
      o(250, 0.2, 'moco', 'jabonSucio'),
      o(260, 0.18, 'moco', 'jabonSucio', 'barrito'),
      o(270, 0.16, 'jabonSucio', 'moco'),
      o(280, 0.15, 'jabonSucio', 'moco', 'moho'),
      o(290, 0.12, 'jabonSucio', 'moco'),
      o(300, 0.1, 'jabonSucio', 'moco', 'pelo'),
    ],
    eventos: [
      { t: m(1, 20), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 18 },
      { t: m(2, 30), tipo: 'elite', enemigo: 'sarro' },
      { t: m(4), tipo: 'muro', enemigo: 'sarro', cant: 24, aviso: '¡Una pared de sarro!' },
      { t: m(5, 30), tipo: 'elite', enemigo: 'cucaracha' },
      { t: m(6, 30), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 26 },
      { t: m(8), tipo: 'elite', enemigo: 'hongo' },
      { t: m(9), tipo: 'muro', enemigo: 'pastaSeca', cant: 30 },
      { t: m(10), tipo: 'jefe', enemigo: 'senorSarro', aviso: '¡El Señor Sarro salió de la muela!' },
      { t: m(11), tipo: 'carta', enemigo: 'reinaCaspa', aviso: 'Una carta de amor en el lavamanos…' },
      { t: m(12, 30), tipo: 'elite', enemigo: 'pelo' },
      { t: m(13, 30), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 36 },
      { t: m(15), tipo: 'jefe', enemigo: 'donaCucaracha', aviso: '¡Doña Cucaracha y su familia!' },
      { t: m(16), tipo: 'muro', enemigo: 'hongo', cant: 34 },
      { t: m(17, 30), tipo: 'elite', enemigo: 'moho' },
      { t: m(19), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 44 },
      { t: m(20), tipo: 'jefe', enemigo: 'motaPelo', aviso: '¡La Mota de Pelo!' },
      { t: m(21), tipo: 'carta', enemigo: 'reinaCaspa', aviso: 'Otra carta de amor perdida…' },
      { t: m(22, 30), tipo: 'elite', enemigo: 'jabonSucio' },
      { t: m(23, 30), tipo: 'muro', enemigo: 'moho', cant: 40 },
      { t: m(25), tipo: 'jefe', enemigo: 'barroNegro', aviso: '¡El Barro Negro llegó al lavamanos!' },
      { t: m(26, 30), tipo: 'enjambre', enemigo: 'gotaGrasa', cant: 56 },
      { t: m(27, 30), tipo: 'elite', enemigo: 'mugre' },
      { t: m(28, 30), tipo: 'muro', enemigo: 'jabonSucio', cant: 40 },
    ],
  },
  banera: {
    id: 'banera',
    nombre: 'La Bañera',
    original: 'Planta lechera',
    desc: 'Agua tibia, espuma y paticos de hule. Por el agua llegan bichos brincones y burbujas sucias.',
    limites: null,
    desbloqueo: 'Aguanta 15 minutos en El Lavamanos',
    oleadas: [
      o(14, 1.0, 'pulga'),
      o(28, 1.0, 'pulga', 'piojo'),
      o(40, 0.9, 'piojo', 'pulga'),
      o(50, 0.8, 'piojo', 'acaro'),
      o(60, 0.8, 'acaro', 'burbujaSucia'),
      o(70, 0.7, 'burbujaSucia', 'pulga', 'acaro'),
      o(80, 0.65, 'burbujaSucia', 'acaro'),
      o(90, 0.6, 'bacteria', 'piojo'),
      o(100, 0.55, 'bacteria', 'acaro'),
      o(105, 0.5, 'bacteria', 'burbujaSucia'),
      o(110, 0.5, 'burbujaSucia'),
      o(120, 0.45, 'burbujaSucia', 'bacteria'),
      o(130, 0.42, 'espinilla', 'burbujaSucia'),
      o(140, 0.4, 'espinilla', 'bacteria'),
      o(150, 0.36, 'espinilla', 'pulga', 'burbujaSucia'),
      o(160, 0.34, 'babosa', 'espinilla'),
      o(170, 0.32, 'babosa', 'burbujaSucia'),
      o(180, 0.3, 'babosa', 'espinilla'),
      o(190, 0.28, 'babosa'),
      o(200, 0.26, 'babosa', 'espinilla'),
      o(210, 0.25, 'babosa'),
      o(220, 0.24, 'mugre', 'babosa'),
      o(230, 0.22, 'mugre', 'babosa'),
      o(240, 0.2, 'moco', 'babosa'),
      o(250, 0.2, 'moco', 'mugre'),
      o(260, 0.18, 'moco', 'mugre', 'babosa'),
      o(270, 0.16, 'mugre', 'moco'),
      o(280, 0.15, 'mugre', 'moco', 'babosa'),
      o(290, 0.12, 'mugre', 'moco'),
      o(300, 0.1, 'mugre', 'moco', 'espinilla'),
    ],
    eventos: [
      { t: m(1, 10), tipo: 'enjambre', enemigo: 'mosquito', cant: 18, aviso: '¡Zzzz! ¡Un escuadrón de zancudos!' },
      { t: m(2, 30), tipo: 'elite', enemigo: 'piojo' },
      { t: m(3, 30), tipo: 'flotar', enemigo: 'burbujaSucia', cant: 10 },
      { t: m(4, 30), tipo: 'enjambre', enemigo: 'mosquito', cant: 26 },
      { t: m(5, 30), tipo: 'anillo', enemigo: 'pulga', cant: 36, aviso: '¡Te rodearon las pulgas!' },
      { t: m(7), tipo: 'elite', enemigo: 'burbujaSucia' },
      { t: m(8, 30), tipo: 'enjambre', enemigo: 'mosquito', cant: 34 },
      { t: m(10), tipo: 'jefe', enemigo: 'tapon', aviso: '¡El Tapón se soltó!' },
      { t: m(11), tipo: 'carta', enemigo: 'reinaCaspa', aviso: 'Una carta de amor flotando en la bañera…' },
      { t: m(12), tipo: 'anillo', enemigo: 'piojo', cant: 40 },
      { t: m(13), tipo: 'elite', enemigo: 'espinilla' },
      { t: m(14), tipo: 'enjambre', enemigo: 'mosquito', cant: 44 },
      { t: m(15), tipo: 'jefe', enemigo: 'esponjaPodrida', aviso: '¡La Esponja Podrida!' },
      { t: m(16, 30), tipo: 'flotar', enemigo: 'burbujaSucia', cant: 18 },
      { t: m(17, 30), tipo: 'elite', enemigo: 'babosa' },
      { t: m(18, 30), tipo: 'anillo', enemigo: 'espinilla', cant: 40 },
      { t: m(20), tipo: 'jefe', enemigo: 'peloDesague', aviso: '¡El Pelo del Desagüe salió del sifón!' },
      { t: m(21), tipo: 'carta', enemigo: 'reinaCaspa', aviso: 'Otra carta de amor perdida…' },
      { t: m(22), tipo: 'enjambre', enemigo: 'mosquito', cant: 56 },
      { t: m(23), tipo: 'elite', enemigo: 'moco' },
      { t: m(24, 30), tipo: 'anillo', enemigo: 'babosa', cant: 40 },
      { t: m(25), tipo: 'jefe', enemigo: 'motaPelo', aviso: '¡La Mota de Pelo nadando!' },
      { t: m(26, 30), tipo: 'enjambre', enemigo: 'mosquito', cant: 64 },
      { t: m(27, 30), tipo: 'elite', enemigo: 'jabonSucio' },
      { t: m(28, 30), tipo: 'muro', enemigo: 'mugre', cant: 40 },
    ],
  },
};

export const ID_ESCENARIOS: IdEscenario[] = ['cara', 'lavamanos', 'banera'];
/** La partida completa (después llega la Ducha Helada). */
export const DURACION = 30 * 60;
