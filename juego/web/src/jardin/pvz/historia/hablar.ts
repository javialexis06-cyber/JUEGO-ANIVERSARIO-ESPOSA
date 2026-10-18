// Atajos para escribir el guion sin repetir { quien, texto, animo } en cada globo.
import type { Animo, Hablante, Linea } from './tipos';

const voz =
  (quien: Hablante) =>
  (texto: string, animo?: Animo): Linea =>
    animo ? { quien, texto, animo } : { quien, texto };

/** Dave el Loco: grita, dice disparates y sabe de plantas más que nadie. */
export const dave = voz('dave');
/** Rosa, de Radio Superviviente. */
export const rosa = voz('rosa');
/** El Dr. Zomboss, entre estornudos. */
export const zomboss = voz('zomboss');
/** El Zombi Cartero: solo gruñe… hasta el final. */
export const cartero = voz('cartero');
/** La voz que cuenta lo que pasa (y lo que hace la Chiva). */
export const narrador = voz('narrador');
