// Parchís para dos: Él (azul) contra Ella (rosado) en esquinas opuestas, cuatro fichas y un dado; o con dos
// colores cada uno (Él azul y amarillo, Ella rosado y verde), ocho fichas y dos dados que caen al centro.
import type { JuegoMesa } from '../tipos';
import { ia } from './ia';
import { reglas, reglas2, type EstadoParchis, type MovParchis } from './reglas';
import { crearVista, crearVista2 } from './vista';

export const JUEGO: JuegoMesa<EstadoParchis, MovParchis> = {
  id: 'parchis',
  nombre: 'Parchís',
  resumen: 'Saca con cinco, come fichas y llega primero a la meta.',
  reglas,
  ia,
  crearVista,
  ayuda: `<ul>
    <li>Cada uno tiene 4 fichas en su casa. <b>Se sale con un 5</b>, y si puedes sacar, es obligatorio.</li>
    <li>Toca el dado (o «Tirar»): el número que salió es el de <b>arriba</b>. Luego toca la ficha que quieres mover: las que se pueden mover saltan y se marca a dónde llegarían.</li>
    <li><b>Seis:</b> vuelves a tirar. Si ya no tienes fichas en casa, el 6 cuenta 7. Con <b>tres seises seguidos</b>, la última ficha que moviste vuelve a casa (salvo si ya va por su pasillo).</li>
    <li><b>Comer:</b> si caes donde está una ficha del otro, se va para su casa y tú cuentas 20 con la ficha que quieras. En los seguros (casillas con circulito) no se come, salvo cuando sales de casa y el otro está parado en tu salida.</li>
    <li><b>Barrera:</b> dos fichas del mismo color en una casilla no dejan pasar a nadie. Con un 6 tienes que abrir la tuya si puedes.</li>
    <li>A la meta se entra con la cuenta exacta y te da 10 para otra ficha. Si ninguna puede usar el premio, se pierde.</li>
    <li>Gana quien meta primero sus 4 fichas. El marcador es cuánto camino llevan (100 = las cuatro en la meta).</li>
  </ul>`,
};

export const JUEGO2: JuegoMesa<EstadoParchis, MovParchis> = {
  id: 'parchis2',
  nombre: 'Parchís a 2 colores',
  resumen: 'Dos colores cada uno y dos dados al centro.',
  reglas: reglas2,
  ia,
  crearVista: crearVista2,
  ayuda: `<ul>
    <li>Cada uno juega <b>dos colores</b> (Él azul y amarillo, Ella rosado y verde): 8 fichas. Gana quien meta primero las 8.</li>
    <li>Se tiran <b>dos dados</b> que caen al centro: el número que vale es el de <b>arriba</b>. Cada dado mueve una ficha (la misma o distintas, de cualquiera de tus colores).</li>
    <li>Toca un dado para elegir con cuál mueves y luego la ficha: las que se pueden mover saltan y se marca a dónde llegarían.</li>
    <li><b>Se sale con un 5</b> (y si puedes sacar con ese dado, es obligatorio) o si los dos dados <b>suman 5</b> (se gastan los dos).</li>
    <li><b>Par:</b> vuelves a tirar. Con <b>tres pares seguidos</b>, la última ficha que moviste vuelve a casa.</li>
    <li><b>Comer:</b> caes donde está una ficha del otro (de cualquiera de sus colores) y se va para su casa; cuentas 20 con la que quieras. En los seguros no se come, salvo al salir de casa.</li>
    <li><b>Barrera:</b> dos fichas tuyas en una casilla (aunque sean de tus dos colores) no dejan pasar a nadie.</li>
    <li>A la meta se entra con la cuenta exacta y te da 10. Si ninguna puede usar un dado o un premio, se pierde.</li>
  </ul>`,
};
