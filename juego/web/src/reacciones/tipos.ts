// Piezas de una reacción: pasos con pose, cara, movimiento del cuerpo, efectos y sonido.
// Las coreografías son datos: el mismo catálogo sirve para la mesa de juegos y para cualquier minijuego.

/** Movimiento procedimental que se suma encima de la pose durante un paso. */
export type Mov =
  /** Salto completo en el paso: se agacha, se estira al despegar, cae y se aplasta. */
  | { tipo: 'salto'; alto: number }
  /** Rebotes seguidos (risa, baile, emoción). */
  | { tipo: 'rebote'; alto: number; frec: number }
  /** Temblor (rabia, sollozo, fuerza). */
  | { tipo: 'temblor'; amp: number; frec?: number }
  /** Vaivén de lado a lado (baile, tristeza). */
  | { tipo: 'balanceo'; grados: number; frec: number }
  /** Vueltas completas sobre sí mismo. */
  | { tipo: 'giro'; vueltas: number }
  /** Cabeza: «si» (asiente), «no» (niega), «ladeo» (inclina de lado a lado). */
  | { tipo: 'cabeza'; eje: 'si' | 'no' | 'ladeo'; grados: number; frec: number }
  /** Cualquier hueso oscilando (ondear la bandera, zapatear). */
  | { tipo: 'hueso'; hueso: string; eje: 'x' | 'y' | 'z'; grados: number; frec: number; fase?: number }
  /** Se aplasta (negativo) o se estira (positivo) de forma sostenida. */
  | { tipo: 'estirar'; cuanto: number }
  /** Infla el pecho (crece un poquito). */
  | { tipo: 'inflarse'; cuanto: number }
  /** Voltea el cuerpo: hacia el otro, hacia la cámara, lejos del otro o al tablero. */
  | { tipo: 'mirar'; a: 'otro' | 'camara' | 'lejos' | 'tablero' }
  /** Camina hacia el otro (1 = hasta quedar frente a frente) y vuelve al terminar la coreografía. */
  | { tipo: 'acercarse'; cuanto: number }
  /** Sale corriendo lejos del otro (1 = fuera del escenario) y vuelve cuando el paso ya no lo pide. */
  | { tipo: 'huir'; cuanto: number }
  /** Se cae de espaldas (y se queda tirado lo que dure el paso). */
  | { tipo: 'caer' }
  /** Se hunde (tristeza, derrota). */
  | { tipo: 'hundirse'; cuanto: number };

/** Efecto 2D sobre el escenario, anclado al personaje. */
export type Fx =
  | { tipo: 'confeti'; n?: number; pantalla?: boolean }
  | { tipo: 'corazones'; n?: number }
  | { tipo: 'estrellas'; n?: number }
  | { tipo: 'brillo' }
  | { tipo: 'gotita' }
  | { tipo: 'vena'; dur?: number }
  | { tipo: 'humo'; dur?: number }
  | { tipo: 'lagrimas'; dur: number; risa?: boolean }
  | { tipo: 'nube'; dur: number }
  | { tipo: 'zzz'; dur?: number }
  | { tipo: 'signo'; c: '?' | '!' | '!?' | '…' | '♪' }
  | { tipo: 'rayos' }
  | { tipo: 'polvo' }
  | { tipo: 'notas'; dur: number }
  | { tipo: 'beso' }
  | { tipo: 'chispa' }
  | { tipo: 'foco' }
  | { tipo: 'aura'; dur: number }
  | { tipo: 'risa'; texto?: string }
  | { tipo: 'reloj' }
  | { tipo: 'soplido' }
  | { tipo: 'resoplido' }
  | { tipo: 'mareo'; dur: number }
  | { tipo: 'sonrojo'; dur: number };

/** Utilería que se cuelga de un hueso mientras dura (hasta que otro paso la cambie o termine la coreografía). */
export type Prop = 'trofeo' | 'corona' | 'bandera' | 'panuelo' | 'dados';

export interface Paso {
  /** Segundos. */
  dur: number;
  pose?: string;
  /** Si hay pose2, va y viene entre las dos (`ritmo` veces por segundo, suave). */
  pose2?: string;
  ritmo?: number;
  cara?: string;
  /** Rapidez de la transición a la pose (1/s). 14 = normal; 30 = golpe seco. */
  suave?: number;
  mov?: Mov[];
  fx?: Fx[];
  sonido?: string;
  /** Sonido en cada ida y vuelta del vaivén (aplausos, zapateo, pisotones). */
  sonidoRitmo?: string;
  /** Dice algo en un globito (el texto lo elige el director según la situación). */
  habla?: boolean;
  prop?: Prop | null;
}

export interface Coreografia {
  nombre: string;
  pasos: Paso[];
  /** Mayor = más importante (no la interrumpe una de menos). */
  prioridad?: number;
  /** Se repite hasta que otra la reemplace (pensar, esperar). */
  bucle?: boolean;
}
