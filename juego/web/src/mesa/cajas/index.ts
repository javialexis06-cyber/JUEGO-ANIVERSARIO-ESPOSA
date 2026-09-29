// Puntos y Cajas: una línea por turno; el que cierra la caja se la lleva y vuelve a jugar.
import type { JuegoMesa } from '../tipos';
import { ia } from './ia';
import { type EstadoCajas, type MovCajas, reglas } from './reglas';
import { crearVista } from './vista';

export const JUEGO: JuegoMesa<EstadoCajas, MovCajas> = {
  id: 'cajas',
  nombre: 'Puntos y Cajas',
  resumen: 'Una línea por turno. El que cierra la caja se la lleva y vuelve a jugar.',
  reglas,
  ia,
  crearVista,
  ayuda: `<p>Por turnos, cada uno une dos puntos vecinos con una línea: toca entre los dos puntos y la línea queda
    elegida, resaltada con tu color. Trázala con <b>✓ Trazar</b> (o tocándola otra vez); si no era esa, toca otra o
    suéltala con ✕.</p>
  <ul>
    <li>El que pone la <b>cuarta línea</b> de una caja se la lleva, sin importar quién puso las otras tres, y
      <b>vuelve a jugar</b>. Las de Él llevan estrella y las de Ella, corazón.</li>
    <li>Una línea que cierra dos cajas se lleva las dos (y es una sola jugada de más).</li>
    <li>Se acaba cuando no quedan líneas: gana el que tenga más cajas.</li>
  </ul>
  <p><b>Truco:</b> no pongas la tercera línea de una caja si puedes evitarlo. Y al final, a veces conviene dejarle
    dos cajitas al otro para que sea él quien tenga que abrir la cadena grande.</p>`,
};
