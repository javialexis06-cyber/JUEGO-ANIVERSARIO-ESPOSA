// Guion de «Plantas contra Zombis: La Semilla Madre»: prólogo, los 88 niveles de la aventura, intermedios, final,
// créditos y textos del almanaque. Historia propia (docs/en-obra/jardin-plan-2026-10-17.md), sin lore de otros juegos
// de la casa y sin ninguna palabra de scripts/palabras-pareja.mjs.
//
// Arco: el apocalipsis llega al barrio y Dave el Loco, exbotánico del Banco Nacional de Semillas, enseña a
// defender la casa (mundo 1). En el cementerio aparece el carné del Dr. Zomboss, su viejo colega alérgico al
// polen (2). Rosa cuenta que los zombis evitan el norte (3) y, en la niebla, el Zombi Cartero entrega una carta
// atrasada del Banco con el primer pedazo del mapa de la Semilla Madre (4). Zomboss cae en los tejados, confiesa
// que va a destruirla y huye en dirigible (5). La Chiva cruza el río, las vías y el desierto (6-8), donde llega
// el último pedazo del mapa; en el páramo (9) Zomboss revela que solo los venía siguiendo y se adelanta al
// Invernadero. Allí hay que proteger la Semilla Madre hasta que florece (10) y su polen cura a todos.
//
// Personajes y voces: hablar.ts. Plantas, objetos y zombis que cada nivel supone: estrenos.ts.
import { GUION_ACTO1 } from './acto1';
import { GUION_ACTO2 } from './acto2';
import { GUION_ACTO3 } from './acto3';
import type { EscenaNivel } from './tipos';

export type { Animo, EscenaNivel, Estreno, Hablante, Linea } from './tipos';
export { PROLOGO, INTERMEDIO_ACTO2 } from './acto1';
export { INTERMEDIO_ACTO3 } from './acto2';
export { FINAL, CREDITOS } from './acto3';
export { PLANTAS_TEXTO } from './almanaque';
export { ESTRENOS } from './estrenos';

/** Escenas de cada nivel: claves '1-1'..'5-10', '6-1'..'9-8' y '10-1'..'10-6'. */
export const GUION: Record<string, EscenaNivel> = { ...GUION_ACTO1, ...GUION_ACTO2, ...GUION_ACTO3 };

/** Las 88 claves de la aventura, en orden de juego. */
export const NIVELES_AVENTURA: readonly string[] = [
  ...[1, 2, 3, 4, 5].flatMap((m) => Array.from({ length: 10 }, (_, i) => `${m}-${i + 1}`)),
  ...[6, 7, 8, 9].flatMap((m) => Array.from({ length: 8 }, (_, i) => `${m}-${i + 1}`)),
  ...Array.from({ length: 6 }, (_, i) => `10-${i + 1}`),
];

/** Escena de un nivel (vacía si no tiene). */
export function escenaDe(id: string): EscenaNivel {
  return GUION[id] ?? {};
}

/** Intermedio que se cuenta después de ganar un nivel: tras 5-10, tras 9-8 y el final tras 10-6. */
export function intermedioTras(id: string): 'acto2' | 'acto3' | 'final' | null {
  if (id === '5-10') return 'acto2';
  if (id === '9-8') return 'acto3';
  if (id === '10-6') return 'final';
  return null;
}
