// Números comunes del motor de PvZ 1. Fuentes: investigación del 17 y 18 de octubre (wiki EN/ES y memoria del código
// del juego, marcada como «memoria» cuando no se pudo confirmar). Los de cada planta o zombi viven en datos/<area>.ts.

/** Paso fijo del motor (s). La vista interpola; la velocidad ×2 llama a paso() dos veces. */
export const DT = 1 / 60;

// --- Cuadrícula (px de PvZ 1) -----------------------------------------------------------------------------------
export const COLUMNAS = 9;
export const ANCHO_COL = 80;
/** Alto de fila con 5 filas (día, noche, tejado) y con 6 (piscina, niebla). */
export const ALTO_FILA_5 = 100;
export const ALTO_FILA_6 = 85;

// --- Zombis -----------------------------------------------------------------------------------------------------
/** Aparecen en x = 760 + azar(0..40) (contrato de arquitectura). */
export const X_APARICION = 760;
export const AZAR_APARICION = 40;
/** Las plantas los pueden atacar desde x < 800. */
export const X_ATACABLE = 800;
/** Media anchura de la caja de golpe de un zombi (x − 25 … x + 25). */
export const MEDIO_ZOMBI = 25;
/** La boca muerde lo que esté entre x − 40 y x − 20: se detiene con los pies a 70 px del centro de la planta. */
export const BOCA_LEJOS = 40;
export const BOCA_CERCA = 20;
/** Media anchura de una planta para los choques. */
export const MEDIO_PLANTA = 30;
/** Mordida de PvZ 1: 100 de daño por segundo (50 si está lento). */
export const MORDIDA = 100;
/** Ritmo de los «ñam» para el sonido (el daño es continuo). */
export const RITMO_MORDIDA = 0.5;
/** Variación de la velocidad de cada zombi (±8 %; en PvZ cada uno camina un poco distinto). */
export const VARIACION_VELOCIDAD = 0.08;
/** Sin cabeza el cuerpo se drena solo (memoria: 1 de vida por centésima = 100/s) hasta desplomarse. */
export const DRENAJE_SIN_CABEZA = 100;
/** Duración de las animaciones de muerte (coinciden con el arte). */
export const DURACION_MUERTE = { normal: 1.3, ceniza: 1.6, comido: 0, cortacesped: 1, aplastado: 0.6, fuera: 0 } as const;
/** Lento: mitad de velocidad y de mordida. */
export const FACTOR_LENTO = 0.5;

// --- Cortacésped y casa -----------------------------------------------------------------------------------------
export const X_CORTACESPED = -40;
/** Un zombi que llega a esta x arranca el cortacésped de su fila. */
export const X_ARRANCA_CORTACESPED = 10;
export const VEL_CORTACESPED = 400;
/** Sin cortacésped, el zombi que pasa de aquí entra a la casa. */
export const X_CASA = -60;
/** Fuera de la pantalla por la derecha (proyectiles, cortacéspedes, hipnotizados). */
export const X_FUERA = 850;

// --- Proyectiles ------------------------------------------------------------------------------------------------
/** Guisante: 3,33 px por centésima (memoria). */
export const VEL_GUISANTE = 333;
/** Altura del guisante sobre el suelo, solo para la vista. */
export const ALTURA_GUISANTE = 48;
/** Nuez de la bolera (memoria aproximada): avance y desvío diagonal en px/s. */
export const VEL_BOLOS = 160;
export const VEL_BOLOS_DIAGONAL = 160;
/**
 * Daño de cada golpe de la nuez de la bolera. Deducido de los golpes de la wiki con estas reglas de armadura
 * (casco con desborde, escudo sin desborde): Zombi 1, caracono 2, caracubo 3, lector 2, pértiga 1.
 */
export const DANO_BOLOS = 450;

// --- Sol --------------------------------------------------------------------------------------------------------
export const SOL_MAX = 9990;
/** Sol del cielo: 25; el primero a los 4,25–7 s y luego min(9,5; 4,25 + 0,1 × caídos) + azar(0..2,75) s. */
export const SOL_CIELO = 25;
export const VEL_SOL_CIELO = 60;
/** Segundos que un sol queda quieto antes de desaparecer (contrato: ~8 s). */
export const VIDA_SOL = 8;
export const VIDA_MONEDA = 10;
export const VIDA_ABONO_SUELTO = 12;

// --- Monedas (memoria: una tirada por zombi muerto; desde 2-1 o al repetir) -------------------------------------
export const PROB_PLATA = 2500 / 30000;
export const PROB_ORO = 250 / 30000;
export const PROB_DIAMANTE = 15 / 30000;
export const VALOR_MONEDA = { plata: 10, oro: 50, diamante: 1000, bolsa: 250 } as const;
/** Cada cortacésped sin usar al final da $50 (cuando ya hay dinero). */
export const PREMIO_CORTACESPED = 50;

// --- Abono (PvZ 2) ----------------------------------------------------------------------------------------------
export const ABONO_MAX = 3;
/** Brillo mínimo al usar el abono (s); los efectos largos lo alargan. */
export const ABONO_BRILLO = 1;

// --- Banco de semillas y cinta ----------------------------------------------------------------------------------
export const RANURAS_INICIALES = 6;
/** Recarga con la que empieza un sobre (memoria del código: rápidas listas, 30 s → 20 s, 50 s → 35 s). */
export function recargaInicial(recarga: number): number {
  if (recarga <= 7.5) return 0;
  if (recarga >= 50) return 35;
  if (recarga >= 30) return 20;
  return recarga;
}
/** Cinta: caben unos 10 sobres; avanzan a 0,8 ranuras por segundo. */
export const CINTA_MAX = 10;
export const VEL_CINTA = 0.8;
/** Espera entre sobres según cuántos hay ya (memoria del código). */
export function esperaCinta(enCinta: number): number {
  if (enCinta > 8) return 10;
  if (enCinta > 6) return 5;
  if (enCinta > 4) return 4.25;
  return 4;
}

// --- Oleadas (memoria del código, verificada con las tablas de la wiki) -----------------------------------------
export const PRIMERA_OLEADA = 18;
/** Siguiente oleada a los 25 + azar(0..6) s. */
export const ESPERA_OLEADA = 25;
export const AZAR_OLEADA = 6;
/** Antes de una oleada enorme la espera natural es de 45 s. */
export const ESPERA_ANTES_DE_BANDERA = 45;
/** Si la vida de la oleada baja del 50–65 % y pasaron 4 s, la cuenta salta a 2 s. */
export const UMBRAL_MIN = 0.5;
export const UMBRAL_MAX = 0.65;
export const ESPERA_MINIMA_UMBRAL = 4;
export const CUENTA_ACELERADA = 2;
/** Aviso «¡Se acerca una oleada enorme de zombis!» antes de cada bandera. */
export const AVISO_BANDERA = 7.5;
export const MAX_ZOMBIS_OLEADA = 50;
