// Las preguntas de «El Show de Nosotros»: tipos, categorías y cómo se arma cada texto.
// Las preguntas se escriben en tercera persona con marcas que el show cambia según de quién se habla:
//   {n} → Él / Ella · {otro} → el otro · {apodo} → el apodo de quien se habla · {x|y} → x si es Él, y si es Ella.
// El id de cada pregunta sale de su texto (así no importa el orden de los archivos); si se corrige el texto de
// una pregunta que ya se jugó, sus respuestas viejas del libro quedan sin pregunta (no se pierde nada más).
export type Rol = 'el' | 'ella';

export type Categoria = 'divertidas' | 'romanticas' | 'futuro' | 'comida' | 'colombianas' | 'recuerdos' | 'picantes';

export const CATEGORIAS: Record<Categoria, { nombre: string; color: string; icono: string }> = {
  divertidas: { nombre: 'Divertidas', color: '#F6CF5A', icono: '😂' },
  romanticas: { nombre: 'Románticas', color: '#E86A8A', icono: '💘' },
  futuro: { nombre: 'Futuro y familia', color: '#8FD3B6', icono: '🍼' },
  comida: { nombre: 'Comida', color: '#F29B38', icono: '🧇' },
  colombianas: { nombre: 'Muy colombianas', color: '#5B8FD6', icono: '🇨🇴' },
  recuerdos: { nombre: 'De los recuerdos', color: '#B48CE0', icono: '📸' },
  picantes: { nombre: 'Algo picantes', color: '#E4574B', icono: '🌶️' },
};

export type TipoPregunta = 'quien' | 'prefiere' | 'conoce' | 'termo' | 'historia' | 'zapato';

interface Comun {
  id: string;
  cat: Categoria;
  t: string;
}
/** ¿Quién es más probable…? Los dos señalan a Él o a Ella en secreto. */
export interface PQuien extends Comun {
  tipo: 'quien';
}
/** Final relámpago (el juego del zapato de las bodas): ¿quién…? cortica y rápida. */
export interface PZapato extends Comun {
  tipo: 'zapato';
}
/** ¿Qué prefieres? Cada uno contesta por sí mismo y adivina lo que escogió el otro. */
export interface PPrefiere extends Comun {
  tipo: 'prefiere';
  o: [string, string];
}
/** ¿Cuánto me conoces? Uno contesta sobre sí mismo y el otro adivina; sin opciones = abierta (la califica el dueño). */
export interface PConoce extends Comun {
  tipo: 'conoce';
  o: string[] | null;
  /** Solo tiene sentido sobre uno de los dos (Yanbal es de Ella; el frappé, de Él). */
  de?: Rol;
}
/** El termómetro: del 1 al 10. Uno dice la verdad sobre sí mismo y el otro adivina con el deslizador. */
export interface PTermo extends Comun {
  tipo: 'termo';
  bajo: string;
  alto: string;
  de?: Rol;
}
/** Nuestra historia: preguntas de los recuerdos reales, con su respuesta correcta y un datico al revelarla. */
export interface PHistoria extends Comun {
  tipo: 'historia';
  o: string[];
  ok: number;
  dato: string;
}

export type Pregunta = PQuien | PZapato | PPrefiere | PConoce | PTermo | PHistoria;

/** Id corto y estable a partir del texto (FNV-1a de 32 bits en base 36, con la letra del tipo adelante). */
export function idDe(tipo: TipoPregunta, texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const letra = { quien: 'q', zapato: 'z', prefiere: 'p', conoce: 'c', termo: 't', historia: 'h' }[tipo];
  return letra + (h >>> 0).toString(36);
}

export const NOMBRE: Record<Rol, string> = { el: 'Él', ella: 'Ella' };
const APODO: Record<Rol, string> = { el: 'el panda', ella: 'la pulga aventurera' };

/** Arma el texto de una pregunta hablando de `sujeto` (si no hay sujeto, las marcas quedan para Él). */
export function armar(t: string, sujeto: Rol = 'el'): string {
  const otro: Rol = sujeto === 'el' ? 'ella' : 'el';
  return t
    .replace(/\{n\}/g, NOMBRE[sujeto])
    .replace(/\{otro\}/g, NOMBRE[otro])
    .replace(/\{apodo\}/g, APODO[sujeto])
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, a: string, b: string) => (sujeto === 'el' ? a : b));
}
