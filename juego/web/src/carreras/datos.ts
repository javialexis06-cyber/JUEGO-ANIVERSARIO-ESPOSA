// La Carrera de las Tres Lunas: los datos del juego (criaturas, carros, corredores vecinos, objetos, pistas, puntos).
// Lo de la pareja (Javier y Laura como corredores y sus frases) va aparte en `pareja.ts`, que en la versión para amigos
// se cambia por `src/amigos/sin_pareja/carreras.ts` (vacío).
import type { AspectoJugador } from '../salas/tipos';

export type IdCriatura = 'unicornio' | 'grifo' | 'dragon' | 'cria' | 'zorro' | 'carnero';
export type IdCarro = 'carreta' | 'calesa' | 'cesta' | 'calabaza';
export type IdPista = 'valle' | 'brasa' | 'nieve' | 'cielo';
export type IdObjeto = 'chispa' | 'tres' | 'semilla' | 'velo' | 'ceniza' | 'pluma' | 'lluvia' | 'lucero' | 'brasa';

export interface Stats {
  /** Velocidad máxima (1 = normal). */
  vmax: number;
  acel: number;
  giro: number;
  /** Peso al chocar (empuja más). */
  peso: number;
}

export interface Criatura {
  id: IdCriatura;
  nombre: string;
  rasgo: string;
  stats: Stats;
  /** Archivo del modelo (relativo a modelos/) o pieza de carreras_cosas.glb. */
  modelo: { glb: string; animada: boolean } | { pieza: string };
  /** Escala para que quepa en el yugo (≈ 1,6 m de alto). */
  escala: number;
  /** Ritmo del galope (vueltas de la animación por metro). */
  paso: number;
}

export const CRIATURAS: Record<IdCriatura, Criatura> = {
  unicornio: { id: 'unicornio', nombre: 'Unicornio', rasgo: 'Equilibrado', stats: { vmax: 1, acel: 1, giro: 1, peso: 1 },
    modelo: { glb: 'granja-v3/unicornio_lod.glb', animada: true }, escala: 0.78, paso: 0.33 },
  grifo: { id: 'grifo', nombre: 'Grifo', rasgo: 'Mejor manejo', stats: { vmax: 0.975, acel: 1.05, giro: 1.13, peso: 0.9 },
    modelo: { glb: 'granja-v3/grifo_lod.glb', animada: true }, escala: 0.74, paso: 0.33 },
  dragon: { id: 'dragon', nombre: 'Dragón', rasgo: 'Más veloz, pesado', stats: { vmax: 1.045, acel: 0.9, giro: 0.92, peso: 1.3 },
    modelo: { glb: 'granja-v3/dragon_lod.glb', animada: true }, escala: 0.7, paso: 0.3 },
  cria: { id: 'cria', nombre: 'Cría de unicornio', rasgo: 'Arranca rapidísimo', stats: { vmax: 0.965, acel: 1.2, giro: 1.08, peso: 0.75 },
    modelo: { pieza: 'm_criatura_cria' }, escala: 1.45, paso: 0.5 },
  zorro: { id: 'zorro', nombre: 'Zorro de Brasaviva', rasgo: 'Ágil', stats: { vmax: 1.015, acel: 1.07, giro: 1.0, peso: 0.9 },
    modelo: { pieza: 'm_criatura_zorro' }, escala: 1.2, paso: 0.45 },
  carnero: { id: 'carnero', nombre: 'Carnero de Nieveclara', rasgo: 'Empuja fuerte', stats: { vmax: 1.0, acel: 0.95, giro: 0.95, peso: 1.45 },
    modelo: { pieza: 'm_criatura_carnero' }, escala: 1.2, paso: 0.45 },
};
export const LISTA_CRIATURAS = Object.values(CRIATURAS);

export const CARROS: Record<IdCarro, { id: IdCarro; nombre: string }> = {
  carreta: { id: 'carreta', nombre: 'Carreta' },
  calesa: { id: 'calesa', nombre: 'Calesa' },
  cesta: { id: 'cesta', nombre: 'Cesta de mimbre' },
  calabaza: { id: 'calabaza', nombre: 'Calabaza' },
};
export const LISTA_CARROS = Object.values(CARROS);

/** Colores de los carros que puede escoger quien juega. */
export const COLORES = ['#e4566b', '#4fb3ff', '#ffb43a', '#6fd39a', '#b79be8', '#f28c45', '#3b6fb6', '#ff7aa8', '#8fd6b9', '#e8402a'];

export interface Corredor {
  id: string;
  nombre: string;
  /** Quién lo dice (la voz): vecino, el, ella o amigo. */
  voz: string;
  aspecto: AspectoJugador;
  criatura: IdCriatura;
  carro: IdCarro;
  color: string;
  /** De dónde es (se ve en la presentación). */
  de?: string;
}

/** Los vecinos de Astra que corren (manejados por la máquina cuando faltan jugadores). Voces de la biblioteca: las
 *  mismas de la granja (voces-guion/astra-reparto.json). */
export const VECINOS: Corredor[] = [
  { id: 'felix', nombre: 'Félix', voz: 'bruma_felix', de: 'Brumaverde', criatura: 'unicornio', carro: 'carreta', color: '#4fb3ff',
    aspecto: { cuerpo: 'el', piel: '#f2c9a8', pelo: '#6b3f22', detalles: { peinado: 'pelo_lado', cabeza: 'gorra#4fb3ff#ffffff', ropa: '#4fb3ff', ropa2: '#2a3550' } } },
  { id: 'ada', nombre: 'Ada', voz: 'bruma_ada', de: 'Brumaverde', criatura: 'grifo', carro: 'calesa', color: '#ff7aa8',
    aspecto: { cuerpo: 'ella', piel: '#ffe0c8', pelo: '#2b1d16', detalles: { peinado: 'pelo_cola', cara: 'gafas_sol', ropa: '#ff7aa8', ropa2: '#ffffff' } } },
  { id: 'dante', nombre: 'Dante', voz: 'brasa_dante', de: 'Brasaviva', criatura: 'dragon', carro: 'carreta', color: '#e8402a',
    aspecto: { cuerpo: 'el', piel: '#a86f4c', pelo: '#17120f', detalles: { peinado: 'pelo_copete', cara: 'gafas_redondas', ropa: '#e8402a', ropa2: '#2b2230' } } },
  { id: 'sol', nombre: 'Sol', voz: 'brasa_sol', de: 'Brasaviva', criatura: 'zorro', carro: 'calabaza', color: '#ffb43a',
    aspecto: { cuerpo: 'ella', piel: '#d9a57e', pelo: '#c2354a', detalles: { peinado: 'pelo_colitas', cabeza: 'flor_pelo', ropa: '#ffb43a', ropa2: '#7a3e2a' } } },
  { id: 'otto', nombre: 'Otto', voz: 'nieve_otto', de: 'Nieveclara', criatura: 'carnero', carro: 'cesta', color: '#6fd39a',
    aspecto: { cuerpo: 'el', piel: '#ffe0c8', pelo: '#e8d8b0', detalles: { peinado: 'pelo_rizos', cabeza: 'gorro_lana#6fd39a', ropa: '#6fd39a', ropa2: '#3b4a5a' } } },
  { id: 'luz', nombre: 'Luz', voz: 'nieve_luz', de: 'Nieveclara', criatura: 'cria', carro: 'cesta', color: '#b79be8',
    aspecto: { cuerpo: 'ella', piel: '#f2c9a8', pelo: '#f2d27a', detalles: { peinado: 'pelo_trenzas', cabeza: 'orejas_conejo', ropa: '#b79be8', ropa2: '#ffffff' } } },
  { id: 'teo', nombre: 'Teo', voz: 'lirios_teo', de: 'Puerto de los Lirios', criatura: 'grifo', carro: 'calabaza', color: '#3b6fb6',
    aspecto: { cuerpo: 'el', piel: '#d9a57e', pelo: '#3b2418', detalles: { peinado: 'pelo_rapado', cabeza: 'sombrero_pescador', ropa: '#3b6fb6', ropa2: '#e8d8b0' } } },
  { id: 'petra', nombre: 'Petra', voz: 'piedra_petra', de: 'Piedralumbre', criatura: 'dragon', carro: 'calesa', color: '#8fd6b9',
    aspecto: { cuerpo: 'ella', piel: '#a86f4c', pelo: '#17120f', detalles: { peinado: 'pelo_afro', cabeza: 'casco_minero', ropa: '#8fd6b9', ropa2: '#4a3c3b' } } },
];

export interface InfoObjeto {
  id: IdObjeto;
  nombre: string;
  /** Qué hace (la ayuda). */
  ayuda: string;
}
export const OBJETOS: Record<IdObjeto, InfoObjeto> = {
  chispa: { id: 'chispa', nombre: 'Chispa de Aura', ayuda: 'Un turbo de fuego dorado.' },
  tres: { id: 'tres', nombre: 'Tres chispas', ayuda: 'Tres turbos seguidos.' },
  semilla: { id: 'semilla', nombre: 'Semilla de Celia', ayuda: 'Brota una enredadera en la pista (atrás o lanzada adelante).' },
  velo: { id: 'velo', nombre: 'Velo de Lara', ayuda: 'Te vuelve invisible: nada te toca y el pasto no te frena.' },
  ceniza: { id: 'ceniza', nombre: "Ceniza de Nath'Gora", ayuda: 'Deja un charco resbaloso detrás.' },
  pluma: { id: 'pluma', nombre: 'Pluma de grifo', ayuda: 'Un salto enorme por encima de todo.' },
  lluvia: { id: 'lluvia', nombre: 'Lluvia de Celia', ayuda: 'Una nube moja y frena a todos los que van adelante.' },
  lucero: { id: 'lucero', nombre: 'Lucero de Aurelia', ayuda: 'Una lunita que persigue al de adelante.' },
  brasa: { id: 'brasa', nombre: 'Brasa de dragón', ayuda: 'Bola de fuego que va derecho y rebota en las barandas.' },
};

/** Qué tan probable es cada objeto según el puesto (0 = primero … 1 = último): los de atrás reciben mejores. */
const TABLA: [number, Partial<Record<IdObjeto, number>>][] = [
  [0, { semilla: 34, ceniza: 30, brasa: 22, pluma: 9, velo: 5 }],
  [0.3, { semilla: 16, ceniza: 14, brasa: 24, lucero: 16, chispa: 16, pluma: 9, velo: 5 }],
  [0.6, { chispa: 24, lucero: 24, brasa: 13, pluma: 10, velo: 10, tres: 12, ceniza: 4, lluvia: 3 }],
  [0.85, { tres: 30, chispa: 18, lucero: 20, velo: 10, lluvia: 12, pluma: 10 }],
  [1, { tres: 34, lluvia: 24, lucero: 16, velo: 14, chispa: 12 }],
];
export function pesosObjeto(fraccion: number): Partial<Record<IdObjeto, number>> {
  let mejor = TABLA[0];
  for (const t of TABLA) if (Math.abs(t[0] - fraccion) < Math.abs(mejor[0] - fraccion)) mejor = t;
  return mejor[1];
}

export interface InfoPista {
  id: IdPista;
  nombre: string;
  region: string;
  /** Una línea para el menú. */
  lema: string;
  musica: string[];
  cielo: [string, string];
  niebla: [string, number, number];
  sol: string;
  /** Color de la tarjeta del menú. */
  tarjeta: string;
}
export const PISTAS: Record<IdPista, InfoPista> = {
  valle: { id: 'valle', nombre: 'Camino del Pueblo del Sol', region: 'Valle de Celia', lema: 'Trigales, girasoles y el puente del río.',
    musica: ['super-dia', 'lavado-partida', 'cohete-tramo1'], cielo: ['#7fc4f0', '#e8f4ff'], niebla: ['#cfe6f5', 120, 420], sol: '#fff2d6', tarjeta: '#7db857' },
  brasa: { id: 'brasa', nombre: 'Hornos de Brasaviva', region: 'Brasaviva', lema: 'Lava a la orilla: no te caigas.',
    musica: ['lavado-intensa', 'cohete-tramo3', 'lavado-partida3'], cielo: ['#4a1f22', '#f28c45'], niebla: ['#6a3328', 90, 380], sol: '#ffb070', tarjeta: '#e8603c' },
  nieve: { id: 'nieve', nombre: 'Pista de Nieveclara', region: 'Nieveclara', lema: 'Pinos, muñecos de nieve y el lago que resbala.',
    musica: ['lavado-partida2', 'cohete-tramo2', 'lavado-partida4'], cielo: ['#9fc3ea', '#f4f8ff'], niebla: ['#dfe9f6', 100, 380], sol: '#ffffff', tarjeta: '#8ec5f0' },
  cielo: { id: 'cielo', nombre: 'Anillos de las Tres Lunas', region: 'El cielo de Astra', lema: 'Una cinta entre las lunas. Sin baranda.',
    musica: ['cohete-tramo5', 'cohete-tramo6', 'lavado-intensa2'], cielo: ['#0b0f2e', '#3b2e6e'], niebla: ['#2a2558', 160, 620], sol: '#fff2d6', tarjeta: '#7a5bb8' },
};
export const ORDEN_PISTAS: IdPista[] = ['valle', 'brasa', 'nieve', 'cielo'];

/** Puntos del Gran Premio por puesto (8 corredores). */
export const PUNTOS = [15, 12, 10, 8, 6, 4, 2, 1];
export const VUELTAS = 3;

export type Dificultad = 'paseo' | 'carrera' | 'leyenda';
export const DIFICULTADES: Record<Dificultad, { nombre: string; ia: number; detalle: string }> = {
  paseo: { nombre: 'Paseo', ia: 0.86, detalle: 'Para aprender' },
  carrera: { nombre: 'Carrera', ia: 0.94, detalle: 'Retadora' },
  leyenda: { nombre: 'Leyenda', ia: 1.0, detalle: 'Para expertos' },
};
