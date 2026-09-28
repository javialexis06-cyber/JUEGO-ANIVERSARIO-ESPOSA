// Dados Party: cinco dados, tres tiros y trece casillas (reglas en docs/juegos-mesa.md).
import type { JuegoMesa } from '../tipos';
import { iaDados } from './ia';
import { type EstadoDados, type MovDados, reglas } from './reglas';
import { crearVista } from './vista';

export const JUEGO: JuegoMesa<EstadoDados, MovDados> = {
  id: 'dados',
  nombre: 'Dados Party',
  resumen: 'Cinco dados, tres tiros y trece casillas. ¿Quién saca el Dados Party?',
  reglas,
  ia: iaDados,
  crearVista,
  ayuda: `<p>Cinco dados, hasta <b>tres tiros</b> por turno y <b>13 casillas</b> para cada uno. Gana quien sume más.</p>
<ul>
  <li>Toca <b>Tirar</b>. Toca los dados que quieras <b>guardar</b> (quedan con borde amarillo) y vuelve a tirar los demás.</li>
  <li>Cuando quieras (a más tardar después del tercer tiro), toca una casilla libre para ver cuánto vale y confírmala con <b>Jugar</b> (o tocándola otra vez). Se vale anotar un 0.</li>
  <li><b>Arriba</b> (1 a 6): la suma de los dados de ese número. Si arriba pasas de 62: <b>+35</b>.</li>
  <li><b>3X</b> Trío y <b>4X</b> Póker: la suma de los cinco dados. <b>FH</b> Full (3 + 2): 25. <b>SM</b> escalera de 4: 30. <b>LG</b> escalera de 5: 40. <b>5X</b> cinco iguales: 50. <b>CH</b> Chance: la suma.</li>
  <li>¿Otro 5 iguales con los 50 ya anotados? <b>+100</b>. Si la casilla de 5 iguales ya está usada, ese 5 iguales es <b>comodín</b> y se anota ya: en la casilla de su número si está libre; si no, en una de abajo (Full y escaleras valen completo); y si tampoco, en una de arriba con 0.</li>
</ul>`,
};
