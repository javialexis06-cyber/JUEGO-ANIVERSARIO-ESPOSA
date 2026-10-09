// La historia del mapa de la Noche, versión de la pareja: Javier y Laura son el Lazo Primordial (el primer amor
// nacido en el Santuario) y bajan desde el Hogar a la frontera de Valdemora. El mito es el de Astra
// (docs/mitologia.md, misterios con la opción A). Las escenas son inventadas (situaciones del mito, ningún recuerdo
// real): usan sus nombres, sus apodos y palabras de su chat, como pide docs/la-pareja.md («Quién cuenta qué»).
// En la versión para amigos este archivo se cambia por src/amigos/sin_pareja/sangre_historia.ts (el mismo mito sin
// nombrar a nadie).
import { NOMBRE_PAREJA } from '../nombres';
import type { IdEscena } from './datos/noche';

export type Hablante = 'el' | 'ella' | 'santa' | 'conde' | 'nathgora' | 'vaelthor' | 'narrador';
export interface LineaEscena {
  quien: Hablante;
  texto: string;
}
export interface EscenaHistoria {
  titulo: string;
  subtitulo: string;
  lineas: LineaEscena[];
}

/** Cómo se llama cada uno en las escenas. */
export const NOMBRES_HABLANTES: Record<Hablante, string> = {
  el: NOMBRE_PAREJA.el, ella: NOMBRE_PAREJA.ella, santa: 'La Santa de Lara', conde: 'El Conde Sangrevil', nathgora: 'Nath’Gora',
  vaelthor: 'Vael’Thor', narrador: '',
};

/** ¿Las escenas muestran a la pareja? (en la versión de amigos, no) */
export const CON_PAREJA = true;

const n = (texto: string): LineaEscena => ({ quien: 'narrador', texto });
const el = (texto: string): LineaEscena => ({ quien: 'el', texto });
const ella = (texto: string): LineaEscena => ({ quien: 'ella', texto });
const santa = (texto: string): LineaEscena => ({ quien: 'santa', texto });

export const ESCENAS: Record<IdEscena, EscenaHistoria> = {
  prologo: {
    titulo: 'La Noche Eterna', subtitulo: 'Prólogo',
    lineas: [
      n('Más allá del Hogar, donde el Santuario de Celia toca el mar de estrellas de Astra, está Valdemora: el reino de la frontera.'),
      n('Una noche, la Constelación de los Amantes parpadeó. Y sobre Valdemora cayó una noche que no se acaba.'),
      ella('Panda… ¿esa no es la constelación que brilla encima de nuestra casa? ¿La de las dos manos?'),
      el('La misma, esposa. Y acaba de parpadear. Eso nunca había pasado.'),
      santa('Viajeros del Hogar: soy la Santa de Lara. Las almas de Valdemora ya no llegan a la mano de mi señora.'),
      santa('Algo abrió una grieta en el escudo. Por ahí entra la ceniza.'),
      ella('¿Y por qué nos llama a nosotros? Nosotros vivimos tranquilitos en el Hogar.'),
      santa('Porque Nath’Gora, el Señor de la Ceniza, no viene por Valdemora. Viene por lo que brilla en ustedes dos.'),
      el('Pues que venga. Pero primero tiene que pasar por encima de mí.'),
      ella('De nosotros, liefje. Por encima de nosotros dos.'),
      n(`Y así, ${NOMBRE_PAREJA.el} y ${NOMBRE_PAREJA.ella} se pusieron los trajes de Valdemora y bajaron a la Noche.`),
    ],
  },
  afueras: {
    titulo: 'La grieta', subtitulo: 'I · Las Afueras',
    lineas: [
      n('En el fondo del pantano, la tierra estaba rajada como un plato viejo. De la raja subía una ceniza fría que no quemaba.'),
      santa('Esta es la grieta. No la abrió nadie de afuera: la abrieron desde adentro.'),
      el('¿Desde adentro? ¿Alguien de Valdemora le abrió la puerta a la ceniza?'),
      santa('El Conde Sangrevil. Le tenía terror a la mano de mi señora: no quería morir nunca.'),
      ella('Ay deos… todo el mundo quiere vivir para siempre, hasta que le toca la eternidad de verdad.'),
      santa('Nath’Gora no puede romper el escudo desde afuera. Le ofreció al Conde la vida eterna a cambio de una grieta. El Conde bebió ceniza de estrella muerta… y fue el primer vampiro.'),
      el('Entonces hay que cerrar esa grieta.'),
      santa('Las Reliquias de Sangre la mantienen abierta: astillas de una estrella apagada. Cada una que saquen de Valdemora la cierra un poquito.'),
      el('Tranquila, pulga aventurera, que yo voy adelante.'),
      ella('Tú vas adelante, mi niño… pero yo llevo el mapa. Por la izquierda.'),
      n('Esa noche, las almas que rescataron llegaron por fin a la mano de Lara.'),
    ],
  },
  subsuelo: {
    titulo: 'Por qué el escudo', subtitulo: 'II · El Subsuelo',
    lineas: [
      n('En lo más hondo de la mina, donde dormían los dragones de Celia, las paredes estaban talladas.'),
      ella('Mira, mor: son dibujos. Dos señoras y una niña chiquitica entre ellas.'),
      santa('Aura y Lara, con Celia recién nacida. Y aquí… ¿ven esta estrella negra?'),
      el('Parece que se estuviera tragando un planeta entero.'),
      santa('Es Nath’Gora apagando el plano de otro panteón. Mis señoras lo vieron hacerlo. Por eso, cuando nació Celia, la luz más cálida que ha tenido Astra…'),
      ella('…la escondieron detrás de un escudo. Como quien tapa una velita con la mano para que no se la lleve el viento.'),
      santa('Ese es el primer misterio: el escudo no se hizo por si acaso. Se hizo porque ya sabían quién venía.'),
      { quien: 'vaelthor', texto: 'Qué historia tan tierna. Lástima que los laberintos que construí no tengan salida.' },
      el('¿Y ese quién es?'),
      santa('Vael’Thor, el Ceramista de Sombras. Le hizo al Conde estas catacumbas para atrapar a las almas camino a Senda.'),
      ella('Pues sus laberintos tienen una falla: nosotros no nos perdemos si vamos de la mano.'),
    ],
  },
  santuario: {
    titulo: 'Los otros panteones', subtitulo: 'III · El Santuario',
    lineas: [
      n('Bajo el altar quemado de la abadía había un cofre. Adentro estaba el manuscrito de las Santas.'),
      santa('Esto lo escribieron mis hermanas hace siglos. Nunca pensé volver a verlo.'),
      ella('«Los otros panteones dejaron apagar la estrella que Nath’Gora cuidaba. Por descuido. Por soberbia.»'),
      el('O sea que Nath’Gora no nació malo… se quedó sin su estrella.'),
      santa('Y se vengó apagando sus planos uno por uno. Vael’Thor encerró la esencia de esos dioses en geometrías oscuras.'),
      ella('Las Reliquias de Sangre… ¿son pedazos de esas cárceles?'),
      santa('Por eso pesan tanto. Cada reliquia que sacan de aquí libera un poquito de un dios dormido.'),
      el('Y por eso los otros panteones «no se meten». No es que no quieran: están encerrados.'),
      ella('Qué tristeza. Una estrella apagada por un descuido, y un universo entero pagándolo.'),
      el('Por eso yo te cuido tanto, esposa. A las estrellas no se les descuida.'),
      ella('Ay, mi niño. Tú y tus frases… shi, cuídame.'),
    ],
  },
  corte: {
    titulo: 'El Lazo Primordial', subtitulo: 'IV · La Corte del Conde',
    lineas: [
      n('El Conde Sangrevil cayó de rodillas frente a la grieta. Del otro lado del escudo, algo hecho de frío los miraba.'),
      { quien: 'nathgora', texto: 'Dos almas pequeñas. Dos almas que se escogieron. Ustedes son lo que no me deja entrar.' },
      el('¿Nosotros?'),
      santa('El Lazo Primordial: el primer amor que nació en el Santuario. Dos almas que se escogieron y que juntan a mis dos señoras, la pasión de Aura y la paz de Lara.'),
      santa('De ese lazo brilla la Constelación de los Amantes. Mientras brille, el escudo no se rompe.'),
      ella('Por eso parpadeó la constelación… nos estaba buscando a nosotros.'),
      { quien: 'nathgora', texto: 'He apagado estrellas más grandes que ustedes.' },
      el('Pues inténtalo. Pero primero vas a tener que soltarnos. Y eso no va a pasar.'),
      n('Lara bajó su velo sobre el Conde y se lo llevó a Nox, donde las sombras ya no le hacen daño a nadie. La grieta se cerró con un sonido de campana.'),
      santa('Nath’Gora sigue allá afuera. Volverá a buscar al Lazo… pero ya saben dónde encontrarlo: en el Hogar.'),
      ella('Vámonos a la casa, panda. Que la granja no se riega sola.'),
      el('Vámonos, esposa. De la mano, como siempre.'),
    ],
  },
};
