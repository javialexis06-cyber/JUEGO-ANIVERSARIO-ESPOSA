// Modo amigo y modo neutro de Súper Manía y los juegos de mesa (los juegos que también juegan los amigos).
//
// - **Modo amigo**: este aparato es de un amigo o una amiga (perfil activo en `salas/perfil.ts`). Nunca hay casa:
//   al salir se vuelve a su sala de juegos (`amigos.html`), el progreso se guarda solo en el aparato y no se le
//   pagan monedas ni victorias a la casa de la pareja.
// - **Modo neutro**: lo que se ve cuando juega un amigo o cuando hay amigos en la sala: nada personal ni romántico
//   de Javier y Laura (ni apodos, ni «mi amor», ni besos, ni recuerdos, ni lugares de ellos). Javier y Laura sí se
//   ven con su nombre: son jugadores como cualquiera.
//
// Las páginas de la pareja (super.html y mesa.html) tienen una guardia en el <head> que manda a un amigo a su sala
// de juegos; con `?amigo` en la dirección lo dejan entrar (así entra desde «amigos.html»).
import type * as THREE from 'three';
import { aspectoDe, esModoAmigo, perfilAmigo } from './salas/perfil';
import { teñirModelo } from './salas/tinte';
import type { AspectoJugador } from './salas/tipos';

/** ¿Este aparato es de un amigo? (la casa no existe para él). */
export const modoAmigo = (): boolean => esModoAmigo();

let neutro = modoAmigo();
const oyentes = new Set<(si: boolean) => void>();

/** Prende o apaga el modo neutro (un amigo lo tiene siempre prendido). */
export function ponerNeutro(si: boolean) {
  const v = si || modoAmigo();
  if (v === neutro) return;
  neutro = v;
  for (const f of [...oyentes]) {
    try {
      f(v);
    } catch (e) {
      console.error(e);
    }
  }
}

/** ¿Hay que esconder todo lo personal de la pareja ahora mismo? */
export const esNeutro = (): boolean => neutro;

/** Avisa cuando cambia el modo neutro (entró o salió un amigo de la sala). Devuelve cómo dejar de escuchar. */
export function alNeutro(fn: (si: boolean) => void): () => void {
  oyentes.add(fn);
  return () => void oyentes.delete(fn);
}

/** A dónde se vuelve al salir del juego: la sala de juegos de amigos o la casa. */
export const paginaDeSalida = (): string => (modoAmigo() ? './amigos.html' : './index.html');

/** El amigo de este aparato (nombre y cómo se ve), o null si es Javier o Laura. */
export function amigoDeAqui(): { id: string; nombre: string; aspecto: AspectoJugador } | null {
  const p = perfilAmigo();
  return p?.activo ? { id: p.id, nombre: p.nombre, aspecto: aspectoDe(p) } : null;
}

/** ¿El aspecto trae colores propios (un amigo) o es el muñeco de fábrica (Javier o Laura)? */
export const tieneColores = (a?: AspectoJugador | null): boolean => !!a && !!(a.piel || a.pelo || a.detalles?.ropa);

/**
 * Le pone al muñeco los colores del amigo (copias de los materiales: los del modelo los comparten todos). Devuelve
 * los materiales nuevos para soltarlos al final. Javier y Laura (sin colores propios) quedan como están.
 */
export function vestirAmigo(modelo: THREE.Object3D | null | undefined, a?: AspectoJugador | null): THREE.Material[] {
  if (!modelo || !tieneColores(a)) return [];
  return teñirModelo(modelo, a!);
}

/** Texto seguro para meter en HTML (nombres de los jugadores). */
export const escHtml = (t: string): string => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
