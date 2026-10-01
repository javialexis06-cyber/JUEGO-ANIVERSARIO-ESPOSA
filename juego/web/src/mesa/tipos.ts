// Contrato común de los juegos de mesa (Dados, Mancala, Puntos y Cajas, Parchís).
// Cada juego da sus reglas (puras, sin azar escondido), su IA y su vista; la mesa se encarga de los turnos,
// del modo (contra la IA, los dos en el mismo celular o en línea), de los muñequitos y de sus reacciones.
import type { Rol } from '../casa/modelo';

export type { Rol };
export type Modo = 'ia' | 'local' | 'linea';
export type NivelIA = 'facil' | 'normal' | 'dificil';

/** Resultado de la partida. `ganador` null = empate. */
export interface Final {
  ganador: Rol | null;
  puntos: Record<Rol, number>;
}

/**
 * Reglas puras: `aplicar` no puede usar azar (los dados ya vienen tirados dentro del movimiento), así los
 * dos celulares llegan al mismo estado con solo mandarse los movimientos.
 * El estado debe ser JSON simple (se manda por la red y se guarda).
 */
export interface Reglas<E, M> {
  inicial(empieza: Rol): E;
  turno(e: E): Rol;
  /** Movimientos legales del que tiene el turno (la IA elige de aquí). */
  movimientos(e: E): M[];
  aplicar(e: E, m: M): E;
  puntos(e: E): Record<Rol, number>;
  /** null mientras se juega. */
  fin(e: E): Final | null;
}

/** Qué tan buena fue una jugada para quien la hizo (mueve las reacciones de los dos). */
export type Calidad = 'genial' | 'buena' | 'normal' | 'mala' | 'nula';

/**
 * Lo que pasa en el tablero, en palabras de la mesa. La vista los avisa con `ctx.suceso(...)` en el momento
 * justo de la animación y la mesa decide cómo reacciona cada muñequito (el que jugó y el otro).
 * `texto` es opcional: una etiqueta corta que se muestra sobre el tablero («¡DADO PARTY!», «+7»).
 */
export type Suceso =
  /** Resultado de una jugada (anotar en la tarjeta, cerrar cajas, sembrar...). */
  | { tipo: 'jugada'; quien: Rol; calidad: Calidad; texto?: string }
  /** Le quitó algo al otro (captura en Mancala, le robó una caja que el otro preparó...). */
  | { tipo: 'captura'; quien: Rol; cuanto: number; texto?: string }
  /** Vuelve a jugar (última semilla en su almacén, cerró una caja...). */
  | { tipo: 'turno_extra'; quien: Rol; texto?: string }
  /** Va a tirar los dados (sopla, agita). */
  | { tipo: 'lanzar'; quien: Rol }
  /** Espera un resultado con los dedos cruzados (último tiro, jugada arriesgada). */
  | { tipo: 'suerte'; quien: Rol }
  /** Estuvo cerca y no se dio (le faltó un dado, dejó la caja al otro...). */
  | { tipo: 'casi'; quien: Rol; texto?: string }
  /** Le dejó servida una jugada al otro (tercera línea de una caja, dejar casilla vacía expuesta...). */
  | { tipo: 'regalo'; quien: Rol; texto?: string };

/** Lo que la mesa le da a la vista de un juego. */
export interface CtxVista<M> {
  /** Contenedor del tablero (ya limpio, ocupa todo el espacio bajo el escenario). */
  raiz: HTMLElement;
  /** El personaje de este celular: su lado del tablero va abajo. */
  yo: Rol;
  modo: Modo;
  nombres: Record<Rol, string>;
  /** El humano de este celular eligió un movimiento (solo cuenta si la vista estaba habilitada). */
  jugar(m: M): void;
  /** Avisa un suceso para las reacciones de los muñequitos. */
  suceso(s: Suceso): void;
  /** Azar para armar movimientos (tirar los dados). */
  azar(): number;
  /** Efectos de sonido de la casa (`sonido.efecto('moneda')`, ...). */
  sonido(nombre: string): void;
}

/** La vista de un juego: pinta, anima y deja jugar al humano cuando le toca. */
export interface Vista<E, M> {
  /** Pinta el estado de una vez (al empezar o al reanudar). */
  pintar(e: E): void;
  /**
   * Anima un movimiento desde `antes` hasta `despues` (sea de este celular, de la IA o del otro celular)
   * y avisa los sucesos en el momento justo. Termina cuando el tablero quedó quieto.
   */
  animar(antes: E, m: M, despues: E): Promise<void>;
  /**
   * Habilita la interacción para `quien` (el humano que tiene el turno en este celular) o la apaga (null).
   * En modo local los dos juegan en el mismo celular: `quien` dice de quién es el turno.
   */
  permitir(quien: Rol | null): void;
  destruir(): void;
}

export interface JuegoMesa<E = unknown, M = unknown> {
  id: 'dados' | 'mancala' | 'cajas' | 'parchis' | 'parchis2' | 'show';
  nombre: string;
  /** Una línea para el menú. */
  resumen: string;
  reglas: Reglas<E, M>;
  /**
   * Elige el movimiento del que tiene el turno. Si el movimiento lleva azar (tirar los dados), la IA lo tira
   * con `azar`, igual que la vista del humano con `ctx.azar()`: el resultado viaja dentro del movimiento.
   */
  ia(e: E, nivel: NivelIA, azar: () => number): M;
  crearVista(ctx: CtxVista<M>): Vista<E, M>;
  /** Cómo se juega (HTML corto) para el botón «?». */
  ayuda: string;
}
