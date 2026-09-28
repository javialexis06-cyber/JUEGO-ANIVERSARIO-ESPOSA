// Parchís para dos: Él (azul) contra Ella (rosado) en esquinas opuestas, cuatro fichas y un dado.
import type { JuegoMesa } from '../tipos';
import { ia } from './ia';
import { reglas, type EstadoParchis, type MovParchis } from './reglas';
import { crearVista } from './vista';

export const JUEGO: JuegoMesa<EstadoParchis, MovParchis> = {
  id: 'parchis',
  nombre: 'Parchís',
  resumen: 'Saca con cinco, come fichas y llega primero a la meta.',
  reglas,
  ia,
  crearVista,
  ayuda: `<ul>
    <li>Cada uno tiene 4 fichas en su casa. <b>Se sale con un 5</b>, y si puedes sacar, es obligatorio.</li>
    <li>Toca el dado (o «Tirar») y luego la ficha que quieres mover: las que se pueden mover saltan y se marca a dónde llegarían.</li>
    <li><b>Seis:</b> vuelves a tirar. Si ya no tienes fichas en casa, el 6 cuenta 7. Con <b>tres seises seguidos</b>, la última ficha que moviste vuelve a casa (salvo si ya va por su pasillo).</li>
    <li><b>Comer:</b> si caes donde está una ficha del otro, se va para su casa y tú cuentas 20 con la ficha que quieras. En los seguros (casillas con circulito) no se come, salvo cuando sales de casa y el otro está parado en tu salida.</li>
    <li><b>Barrera:</b> dos fichas del mismo color en una casilla no dejan pasar a nadie. Con un 6 tienes que abrir la tuya si puedes.</li>
    <li>A la meta se entra con la cuenta exacta y te da 10 para otra ficha. Si ninguna puede usar el premio, se pierde.</li>
    <li>Gana quien meta primero sus 4 fichas. El marcador es cuánto camino llevan (100 = las cuatro en la meta).</li>
  </ul>`,
};
