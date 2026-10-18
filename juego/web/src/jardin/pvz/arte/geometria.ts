// Geometría compartida del patio de Plantas contra Zombis. La vista, el arte y el motor usan estas constantes para
// que todo coincida (docs/en-obra/pvz-arquitectura.md, «Coordenadas y tiempo»).
//
// Unidades de mundo = píxeles de PvZ 1. El mundo mide 600 de alto; arriba quedan ~80 para el banco de semillas.
// - x: el MOTOR y el MUNDO comparten la x: x = 0 es el borde izquierdo del césped y la columna c va de 80c a 80c + 80.
//   La casa queda en x < 0 y la calle en x > 760.
// - y: el motor mide la y desde el borde de arriba del césped (fila f con centro en 100f + 50). En el mundo se le
//   suma ORIGEN_CESPED_Y: y_mundo = ORIGEN_CESPED_Y + y_motor.

/** Alto del mundo visible (como la pantalla de 800 × 600 de PvZ 1). */
export const ALTO_MUNDO = 600;
/** Ancho de una columna del césped. */
export const ANCHO_COL = 80;
/** Alto de una fila en los patios de 5 filas (día, noche, tejado). */
export const ALTO_FILA = 100;
/** Alto de una fila en los patios de 6 filas (piscina y niebla). */
export const ALTO_FILA_6 = 85;
export const COLUMNAS = 9;
export const FILAS = 5;
/** Borde izquierdo del césped en el mundo (igual al del motor). */
export const ORIGEN_CESPED_X = 0;
/** Borde superior del césped en el mundo: lo de arriba es para el banco de semillas, como en PvZ 1. */
export const ORIGEN_CESPED_Y = 80;
export const ANCHO_CESPED = ANCHO_COL * COLUMNAS;
/** Primer x pintado del escenario (casa extendida, para pantallas anchas de celular, relación ~2.16). */
export const X_MIN = -260;
/** Último x pintado del escenario (calle; la cámara se desliza hasta aquí al elegir semillas). */
export const X_MAX = 1200;
/** x donde descansan los cortacéspedes. */
export const X_CORTACESPED = -40;
/** Desde x < 800 los zombis ya se pueden atacar (borde derecho de la pantalla en PvZ 1). */
export const X_ENTRADA_ZOMBIS = 800;

/** Bajada sugerida desde el centro de la fila hasta la base de la planta (su ancla). */
export const PIE_PLANTA = 32;
/** Bajada sugerida desde el centro de la fila hasta los pies del zombi (su ancla). */
export const PIE_ZOMBI = 40;

/** y del centro de la fila f en coordenadas del motor (sin el origen del césped). */
export function centroFilaMotor(f: number, filas = FILAS): number {
  return filas === 6 ? ALTO_FILA_6 * f + ALTO_FILA_6 / 2 : ALTO_FILA * f + ALTO_FILA / 2;
}

/** y del centro de la fila f en el mundo. */
export function centroFila(f: number, filas = FILAS): number {
  return ORIGEN_CESPED_Y + centroFilaMotor(f, filas);
}

/** x del centro de la columna c (mundo y motor). */
export function centroCol(c: number): number {
  return ORIGEN_CESPED_X + ANCHO_COL * c + ANCHO_COL / 2;
}

/** Pasa una y del motor al mundo. */
export function yMundo(yMotor: number): number {
  return ORIGEN_CESPED_Y + yMotor;
}

/** Casilla (columna, fila) bajo un punto del mundo, o null si cae fuera del césped. */
export function casillaEn(x: number, y: number, filas = FILAS): { c: number; f: number } | null {
  const alto = filas === 6 ? ALTO_FILA_6 : ALTO_FILA;
  const c = Math.floor((x - ORIGEN_CESPED_X) / ANCHO_COL);
  const f = Math.floor((y - ORIGEN_CESPED_Y) / alto);
  if (c < 0 || c >= COLUMNAS || f < 0 || f >= filas) return null;
  return { c, f };
}
