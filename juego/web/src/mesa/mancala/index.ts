// Mancala: siembra semillas en sentido antihorario, roba las del otro y llena tu almacén.
import type { JuegoMesa } from '../tipos';
import { ia } from './ia';
import { type EstadoMancala, type Jugada, reglas } from './reglas';
import { crearVista } from './vista';

export const JUEGO: JuegoMesa<EstadoMancala, Jugada> = {
  id: 'mancala',
  nombre: 'Mancala',
  resumen: 'Siembra semillas, roba las del otro y llena tu granero.',
  reglas,
  ia,
  crearVista,
  ayuda: `<p>Cada uno tiene 6 hoyos (tu lado es el de tu color) y un almacén grande. Empiezan 4 semillas en cada hoyo.</p>
<ul>
  <li>Toca un hoyo tuyo: sacas todas sus semillas y las siembras una por una en sentido antihorario.</li>
  <li>Al pasar por tu almacén dejas una; el almacén del otro se salta.</li>
  <li>¿La última cae en tu almacén? <b>¡Juegas otra vez!</b></li>
  <li>¿La última cae en un hoyo vacío de tu lado? Te llevas esa semilla y todas las del hoyo de enfrente.</li>
  <li>Cuando los hoyos de alguien quedan vacíos se acaba: el otro guarda lo que le quedó. Gana el almacén más lleno.</li>
</ul>
<p>Truco: deja el dedo sobre un hoyo para ver dónde cae la última semilla.</p>`,
};
