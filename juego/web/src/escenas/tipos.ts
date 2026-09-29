// Escenas premium: pequeñas películas de los dos que se compran con monedas y se lanzan en los juegos.
// Una escena es un guion con tiempos: qué hace cada uno, a dónde camina, qué carga, qué dice y dónde está
// la cámara. Se actúan en un cuarto de la casa (pantalla completa) o en el escenario grande con el
// tablero encogido en una esquina.
import type { Rol } from '../casa/modelo';
import type { Fx, Paso, Prop } from '../reacciones/tipos';

/** A = quien lanza la escena (o el que la protagoniza), B = el otro. */
export type Actor = 'A' | 'B';
export type Lugar = 'grande' | 'sala' | 'cocina' | 'bano' | 'cuarto';

/** Punto del cuarto: x a lo ancho, y a lo hondo (como en casa.json: y grande = contra la pared del fondo). */
export type Punto = [x: number, y: number];

/** Encuadres: todo el cuarto, los dos, uno solo (medio cuerpo) o su cara de cerca. */
export type Plano = 'general' | 'dos' | 'A' | 'B' | 'caraA' | 'caraB';

/** Lo que hace un actor en una toma. Un texto suelto es una coreografía del catálogo de reacciones. */
export type Hace =
  | string
  | {
      coreo?: string;
      pasos?: Paso[];
      /** Camina (o corre, con vel alta) hasta ese punto. */
      ir?: Punto;
      vel?: number;
      /** Grados (0 = de frente a la cámara, 90 = a su izquierda de pantalla… ) o hacia el otro / la cámara. */
      rot?: number | 'otro' | 'camara';
      prop?: Prop | null;
      /** Aparece de una vez en ese punto (cambio de lugar entre tomas). */
      en?: Punto;
      /** Altura del cuerpo: sentado en el sofá o en la cama (0 = en el piso). */
      alto?: number;
      /** Acostado boca arriba (en la cama) o de nuevo derecho. */
      acostado?: boolean;
    };

/** Cosas sueltas del cuarto (el tablero en la mesa, un pastel, almohadas en la cama). */
export interface Objeto {
  id: string;
  prop?: Prop;
  /** Dónde queda: punto y altura del piso. */
  en?: [x: number, y: number, alto: number];
  /** Sale volando hasta ese punto (lanzado), girando. */
  volar?: [x: number, y: number, alto: number];
  quitar?: boolean;
}

export type Particulas = 'fichas' | 'plumas' | 'crema' | 'petalos' | 'corazones' | 'agua' | 'estrellas' | 'palomitas' | 'burbujas';

export interface Toma {
  t: number;
  A?: Hace;
  B?: Hace;
  camara?: Plano;
  /** Globito de lo que dice. */
  dice?: [Actor, string];
  /** Texto de narrador abajo (como subtítulo de película). */
  sub?: string;
  fx?: [Actor, Fx][];
  sonido?: string;
  objeto?: Objeto;
  particulas?: [Particulas, Actor | Punto];
  /** Destello de cámara de fotos o sacudón de la cámara. */
  flash?: boolean;
  temblor?: number;
}

export interface Escena {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  lugar: Lugar;
  dur: number;
  /** Quién tiene que ser A (si la escena es de él o de ella); si no, A es quien la lanza. */
  de?: Rol;
  inicio: { A: [x: number, y: number, rot: number]; B: [x: number, y: number, rot: number] };
  /** Utilería en las manos al empezar. */
  props?: Partial<Record<Actor, Prop>>;
  guion: Toma[];
}
