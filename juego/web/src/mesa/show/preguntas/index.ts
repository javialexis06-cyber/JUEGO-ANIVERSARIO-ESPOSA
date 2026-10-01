// El banco completo de preguntas del show (más de 500, escritas a mano) y cómo se buscan.
import { CONOCE } from './conoce';
import { HISTORIA } from './historia';
import { PREFIERE } from './prefiere';
import { QUIEN } from './quien';
import { TERMO } from './termo';
import type { Pregunta, TipoPregunta } from './tipos';
import { ZAPATO } from './zapato';

export * from './tipos';

export const BANCO: Record<TipoPregunta, Pregunta[]> = {
  quien: QUIEN,
  prefiere: PREFIERE,
  conoce: CONOCE,
  termo: TERMO,
  historia: HISTORIA,
  zapato: ZAPATO,
};

export const TODAS: Pregunta[] = Object.values(BANCO).flat();

const POR_ID = new Map<string, Pregunta>();
for (const p of TODAS) {
  // Dos preguntas con el mismo texto tendrían el mismo id: la segunda se nota en las pruebas (__show.banco())
  if (!POR_ID.has(p.id)) POR_ID.set(p.id, p);
}

export const pregunta = (id: string): Pregunta | undefined => POR_ID.get(id);

/** Resumen para las pruebas: cuántas hay de cada tipo y si algún id se repite. */
export function revisarBanco() {
  const cuenta = Object.fromEntries(Object.entries(BANCO).map(([k, v]) => [k, v.length]));
  return { total: TODAS.length, unicas: POR_ID.size, cuenta };
}
