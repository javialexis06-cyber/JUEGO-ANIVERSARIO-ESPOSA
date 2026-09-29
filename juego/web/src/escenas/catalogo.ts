// Catálogo de escenas premium. Coordenadas como en casa.json: x a lo ancho (−2,7 … 2,7), y a lo hondo
// (y alto = contra la pared del fondo, y bajo = cerca de la cámara). rot en grados: 0 = de frente a la
// cámara, 90 = mirando a la derecha de la pantalla, −90 = a la izquierda, 180 = de espaldas.
import { BANO } from './bano';
import { COCINA } from './cocina';
import { CUARTO } from './cuarto';
import { GRANDE } from './grande';
import { SALA } from './sala';
import type { Escena } from './tipos';

export const ESCENAS: Escena[] = [...SALA, ...CUARTO, ...COCINA, ...BANO, ...GRANDE];

export const escenaDe = (id: string) => ESCENAS.find((e) => e.id === id);
