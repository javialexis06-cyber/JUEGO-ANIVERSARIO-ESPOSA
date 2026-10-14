// El Torneo del Despertar Dorado: los tipos que comparten la simulación, la vista, la máquina (IA) y la red.
// La simulación corre a 60 pasos por segundo (`PASOS`) en metros: x a lo largo del escenario, y hacia arriba.
import type { AspectoJugador } from '../salas/tipos';

export const PASOS = 60;
export const DT = 1 / PASOS;

/** Lo que aprieta cada luchador en un paso (joystick, teclado, la máquina o lo que llega por la red). */
export interface Entrada {
  /** -1 izquierda, 0 nada, 1 derecha. */
  h: number;
  /** -1 abajo (agacharse), 0 nada, 1 arriba (saltar). */
  v: number;
  /** Golpe rápido. */
  a: boolean;
  /** Golpe fuerte. */
  b: boolean;
  /** Especial. */
  e: boolean;
  /** Agarre. */
  g: boolean;
  /** Súper (solo con la barra llena). */
  s: boolean;
}
export const NADA: Entrada = { h: 0, v: 0, a: false, b: false, e: false, g: false, s: false };

/** La entrada en 9 bits (para la red). */
export function empacar(e: Entrada): number {
  return (e.h < 0 ? 1 : 0) | (e.h > 0 ? 2 : 0) | (e.v > 0 ? 4 : 0) | (e.v < 0 ? 8 : 0) | (e.a ? 16 : 0) | (e.b ? 32 : 0) | (e.e ? 64 : 0) | (e.g ? 128 : 0) | (e.s ? 256 : 0);
}
export function desempacar(n: number): Entrada {
  return { h: n & 1 ? -1 : n & 2 ? 1 : 0, v: n & 4 ? 1 : n & 8 ? -1 : 0, a: !!(n & 16), b: !!(n & 32), e: !!(n & 64), g: !!(n & 128), s: !!(n & 256) };
}

export type IdGolpe =
  | 'rapido1' | 'rapido2' | 'rapido3' | 'rapidoAbajo' | 'fuerte' | 'fuerteAbajo' | 'fuerteArriba' | 'aereo' | 'aereoFuerte' | 'agarre'
  | 'especial' | 'super';

/** A qué altura pega: lo alto y lo medio se tapan de pie; lo bajo, agachado; lo aéreo (desde arriba), solo de pie. */
export type Nivel = 'alto' | 'medio' | 'bajo' | 'aereo';

/** Cómo se ve (chispas, color del destello y del proyectil). */
export type Efecto = 'normal' | 'fuego' | 'luz' | 'hielo' | 'sombra' | 'corazon' | 'lirio' | 'estrella' | 'porcelana' | 'tierra';

export type TipoEspecial = 'proyectil' | 'embestida' | 'voladora' | 'contra' | 'cuerda' | 'niebla' | 'trampa' | 'fuego';
export type TipoSuper = 'rafaga' | 'rayo' | 'lluvia' | 'ola';

/** Un golpe (cuadros a 60 por segundo; distancias en metros, en la dirección en que mira quien pega). */
export interface Golpe {
  id: string;
  /** Nombre para mostrar (los especiales y las súper). */
  nombre?: string;
  /** Pose mientras se arma y mientras pega (ver poses.ts). */
  pose: string;
  poseCarga?: string;
  arranque: number;
  activo: number;
  recup: number;
  dano: number;
  nivel: Nivel;
  /** Caja que pega: [x desde, x hasta, y desde, y hasta]. */
  caja: [number, number, number, number];
  /** Cuadros de aturdimiento al que recibe (de pie) y al que tapa. */
  aturde: number;
  bloqueo: number;
  /** Velocidad con que empuja (m/s) y con que levanta (si levanta, sale volando). */
  empuje: number;
  lanza?: number;
  /** Lo tumba. */
  derriba?: boolean;
  /** Se mueve hacia adelante mientras se arma y pega (m/s). */
  avance?: number;
  /** A qué golpes puede saltar si pegó o lo taparon (combos). */
  cancela?: IdGolpe[];
  /** Pega varias veces mientras está activo (cada cuántos cuadros). */
  cada?: number;
  /** Parte del daño que entra aunque lo tapen. */
  chip?: number;
  /** Cuadros del arranque en que no le pegan. */
  invul?: number;
  /** Golpes que aguanta sin aturdirse (pesados y embestidas). */
  armadura?: number;
  /** Parte del daño que recupera como vida. */
  roba?: number;
  efecto?: Efecto;
  /** Fuerza del sonido y de la sacudida. */
  peso?: 'leve' | 'medio' | 'fuerte';
  /** Tipo de especial o de súper (si no, es un golpe normal). */
  especial?: TipoEspecial;
  superTipo?: TipoSuper;
  /** Datos del proyectil o del efecto grande (velocidad, alcance, duración…). */
  proy?: { vel?: number; vy?: number; vida?: number; golpes?: number; radio?: number; alto?: number; alcance?: number };
  /** Lo deja mareado un rato (cuadros). */
  marea?: number;
  /** Agarre (no se puede tapar). */
  agarre?: boolean;
}

/** Un luchador (lo que lo hace distinto: cuerpo, ropa, números y golpes). */
export interface DefLuchador {
  id: string;
  nombre: string;
  /** Apodo de torneo («La Santa del Alba»). */
  titulo: string;
  /** Una línea: cómo pelea. */
  estilo: string;
  /** Color de su lado de la interfaz. */
  color: string;
  cuerpo: 'el' | 'ella';
  /** Cómo se ve (ropa del clóset genérico); `null` = el muñeco tal cual (Javier y Laura); 'jugador' = el del perfil. */
  aspecto: AspectoJugador | null | 'jugador';
  /** Detalle que lo distingue en 3D (halo, máscara brillante…). */
  brillo?: string;
  escala?: number;
  vida: number;
  /** m/s caminando hacia adelante. */
  velocidad: number;
  /** Velocidad del salto (m/s hacia arriba). */
  salto: number;
  /** Qué tan lejos sale volando (1 = normal; más = más liviano). */
  peso: number;
  /** Cuánto aguanta antes de marearse. */
  aguante: number;
  dobleSalto?: boolean;
  /** Pasiva: parte del daño de todos sus golpes que recupera como vida. */
  roba?: number;
  golpes: Record<IdGolpe, Golpe>;
  /** Poses de entrada, victoria y derrota (animaciones del muñeco). */
  poses: { entrada: string; victoria: string[]; derrota: string };
  /** Quién habla (la carpeta de sus voces): las del juego son comunes; las de la pareja, aparte. */
  voz?: string;
  frases: FrasesLuchador;
}

/** Lo que dice (cada frase con su id estable: el audio se busca por id). */
export interface Frase {
  id: string;
  t: string;
  /** Cómo se dice (con las emociones en inglés entre corchetes, que ElevenLabs actúa y no lee). */
  d?: string;
}
export interface FrasesLuchador {
  entrada: Frase[];
  especial: Frase[];
  super: Frase[];
  victoria: Frase[];
  derrota: Frase[];
  /** Cuando gana el presentador lo nombra. */
  gana?: Frase;
  /** Frases contra alguien en especial (id del rival → frase de entrada). */
  contra?: Record<string, Frase>;
}

/** Escenarios. */
export type IdEscenario = 'plaza' | 'brasaviva' | 'nieveclara';
export interface DefEscenario {
  id: IdEscenario;
  nombre: string;
  lema: string;
  modelo: string;
  musica: string;
  /** Mitad del ancho donde se pelea (paredes). */
  borde: number;
}

export type Modo = 'arcade' | 'versus' | 'linea' | 'practica';
