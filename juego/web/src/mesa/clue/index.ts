// ¿Quién fue? · El misterio de la casona: el Clue clásico en su variante oficial para dos (diseño en
// docs/en-obra/clue.md). Seis sospechosos, seis armas y nueve cuartos; el sobre en el sótano.
import type { JuegoMesa } from '../tipos';
import { ia } from './ia';
import { reglas, type EstadoClue, type MovClue } from './reglas';
import { crearVista } from './vista';

export const JUEGO: JuegoMesa<EstadoClue, MovClue> = {
  id: 'clue',
  nombre: '¿Quién fue?',
  resumen: 'Alguien le dio un chancletazo a Don Cuervo. ¿Quién, con qué y dónde?',
  reglas,
  ia,
  crearVista,
  ayuda: `<ul>
    <li>Don Cuervo amaneció en el sótano con un chichón. En el <b>sobre</b> están las tres cartas de lo que pasó: <b>quién</b> (6 sospechosos), <b>con qué</b> (6 armas) y <b>dónde</b> (9 cuartos).</li>
    <li>De las otras cartas, cada uno recibe 7 y quedan <b>4 boca abajo</b> en los cuartos de las esquinas: el primero que entra a cada esquina la mira en secreto.</li>
    <li>En tu turno: <b>tira los dos dados</b> y camina hasta esa cantidad de casillas (sin diagonales, sin pasar por encima del otro). A los cuartos se entra por las puertas (los tapetes rojos) y entrar termina el camino. Desde una esquina puedes tomar el <b>pasadizo secreto</b> a la esquina de enfrente.</li>
    <li>Al entrar a un cuarto, <b>sospecha</b>: escoge un sospechoso y un arma (vuelan a ese cuarto). El otro, si tiene alguna de las tres cartas, te muestra una en secreto. Si no tiene ninguna… ¡pista caliente!</li>
    <li>No puedes volver a sospechar en el mismo cuarto sin salir de él primero.</li>
    <li>El <b>cuaderno</b> tacha solo lo que ya sabes; las demás las marcas tú (✗, ✓, ?).</li>
    <li><b>Acusar</b> se puede una sola vez, en tu turno: si aciertas las tres, ganas el caso; si te equivocas, lo gana el otro.</li>
  </ul>`,
};
