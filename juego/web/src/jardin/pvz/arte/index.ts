// Índice del arte de Plantas contra Zombis. Solo navegador: lo importan la vista, la interfaz y la galería, nunca el
// motor. Cada área agrega aquí su registro con un import explícito (sin import.meta.glob: las pruebas usan esbuild).
// Un id sin arte se dibuja con el marcador de piezas.ts (círculo con el nombre) y nunca rompe el juego.

import type { DefPersonaje } from './piezas';
import { DEF_ARTE_DIA, OBJETOS_DIA, PLANTAS_DIA, ZOMBIS_DIA } from './dia';
import { DEF_PERSONAJES } from './personajes';

export * from './piezas';
export { PIE_PLANTA, PIE_ZOMBI } from './geometria';
export { dibujarFondoDia, lienzoFondoDia, liberarFondoDia, COLOR_BORDE_DIA } from './fondos/dia';
export type { LienzoFondo, OpcionesFondo } from './fondos/dia';
export { DEF_ARTE_DIA, OBJETOS_DIA, PLANTAS_DIA, ZOMBIS_DIA, DEF_PERSONAJES };

/** Todo el arte por id: plantas, zombis, objetos y personajes de la historia. */
export const DEF_ARTE: Readonly<Record<string, DefPersonaje>> = {
  ...DEF_ARTE_DIA,
  ...DEF_PERSONAJES,
};

/** Arte de un id, o undefined si todavía no tiene (la vista dibuja entonces el marcador). */
export function arteDe(id: string): DefPersonaje | undefined {
  return DEF_ARTE[id];
}
