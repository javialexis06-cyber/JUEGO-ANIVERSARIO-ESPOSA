// Tipos del guion de «Plantas contra Zombis: La Semilla Madre». Solo datos: la interfaz (ui/dialogo.ts y
// ui/pantallas.ts) decide cómo se muestran. Se reexportan desde guion.ts, que es la puerta de entrada.

/** Quién habla en un globo. La Chiva es un vehículo y no habla: el narrador cuenta lo que hace. */
export type Hablante = 'dave' | 'rosa' | 'zomboss' | 'cartero' | 'narrador';

/** Cara o pose del personaje mientras dice la línea (sin ánimo: 'normal'). */
export type Animo = 'normal' | 'loco' | 'feliz' | 'serio' | 'asustado' | 'enojado' | 'triste';

/** Un globo de diálogo. Máximo ~110 caracteres para que quepa en un celular horizontal. */
export interface Linea {
  quien: Hablante;
  texto: string;
  animo?: Animo;
}

/**
 * Lo que se cuenta alrededor de un nivel de la aventura.
 *
 * Orden sugerido para mostrarlo:
 * - al entrar: `radio` (solo en x-1, el boletín de Rosa que abre el mundo) → `antes` → selección de semillas;
 * - al ganar: pantalla del premio (planta u objeto) → `despues` → `nota` (la carta que acaba de llegar).
 *
 * `despues` presenta la planta nueva con una línea de Dave y, en los niveles con carta, cuenta cómo llega el
 * Zombi Cartero; la reacción al contenido de la carta va en el `antes` del nivel siguiente.
 */
export interface EscenaNivel {
  antes?: Linea[];
  despues?: Linea[];
  /** Carta que se muestra en pantalla completa (las de los zombis, con faltas de ortografía a propósito). */
  nota?: { firma: string; texto: string };
  /** Boletín de Rosa por Radio Superviviente al empezar el mundo (solo en x-1). Lo dice Rosa. */
  radio?: string[];
  /** Consejo corto para la pantalla de carga del nivel. */
  consejo?: string;
}

/** Lo que el guion da por hecho en cada nivel (ver estrenos.ts). */
export interface Estreno {
  /** id de la planta que se gana al superar el nivel (las de PLANTAS_TEXTO). */
  planta?: string;
  /** Objeto o premio que no es planta. */
  objeto?: 'pala-y-abono' | 'almanaque' | 'llaves-tienda' | 'mapa-1' | 'mapa-2';
  /** Nombres de los zombis que aparecen por primera vez (se anuncian en `antes`). */
  zombis?: string[];
  /** Tipo de nivel que el texto supone. */
  tipo?: 'minijuego' | 'cinta' | 'jefe' | 'proteger';
  /** Minijuego o mecánica que el texto describe. */
  detalle?: string;
}
