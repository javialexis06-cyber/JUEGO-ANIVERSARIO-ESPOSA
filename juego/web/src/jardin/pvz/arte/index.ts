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

/**
 * Todo el arte por id: plantas, zombis, objetos y personajes de la historia. Empieza con los dibujos SVG; los
 * personajes renderizados en Blender (arte/blender.ts) los reemplazan al cargar el juego.
 */
export const DEF_ARTE: Record<string, DefPersonaje> = {
  ...DEF_ARTE_DIA,
  ...DEF_PERSONAJES,
};

/** Reemplaza (o agrega) el arte de un id. Hay que hacerlo antes de dibujarlo por primera vez. */
export function registrarArte(def: DefPersonaje): void {
  DEF_ARTE[def.id] = def;
}

/** Arte de un id, o undefined si todavía no tiene (la vista dibuja entonces el marcador). */
export function arteDe(id: string): DefPersonaje | undefined {
  return DEF_ARTE[id];
}
