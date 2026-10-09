// La historia del mapa de la Noche para la versión de amigos: el mismo mito de Astra, contado sin nombrar a nadie (los
// que bajan son sobrevivientes de Valdemora). Reemplaza a src/sangre/historia_pareja.ts (SUSTITUTOS en vite.config.ts).
import type { IdEscena } from '../../sangre/datos/noche';

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

export const NOMBRES_HABLANTES: Record<Hablante, string> = {
  el: 'Sobreviviente', ella: 'Sobreviviente', santa: 'La Santa de Lara', conde: 'El Conde Sangrevil', nathgora: 'Nath’Gora', vaelthor: 'Vael’Thor', narrador: '',
};

export const CON_PAREJA = false;

const n = (texto: string): LineaEscena => ({ quien: 'narrador', texto });
const santa = (texto: string): LineaEscena => ({ quien: 'santa', texto });
const yo = (texto: string): LineaEscena => ({ quien: 'el', texto });

export const ESCENAS: Record<IdEscena, EscenaHistoria> = {
  prologo: {
    titulo: 'La Noche Eterna', subtitulo: 'Prólogo',
    lineas: [
      n('Más allá del Santuario de Celia, donde el mundo toca el mar de estrellas de Astra, está Valdemora: el reino de la frontera.'),
      n('Una noche, la Constelación de los Amantes parpadeó. Y sobre Valdemora cayó una noche que no se acaba.'),
      santa('Sobrevivientes: soy la Santa de Lara. Las almas de Valdemora ya no llegan a la mano de mi señora.'),
      santa('Algo abrió una grieta en el escudo. Por ahí entra la ceniza.'),
      yo('¿Y qué podemos hacer nosotros?'),
      santa('Bajar. Recuperar lo que mantiene abierta la grieta. Y salir vivos por la campana.'),
      n('Y así, los últimos sobrevivientes de Valdemora se pusieron sus trajes y bajaron a la Noche.'),
    ],
  },
  afueras: {
    titulo: 'La grieta', subtitulo: 'I · Las Afueras',
    lineas: [
      n('En el fondo del pantano, la tierra estaba rajada como un plato viejo. De la raja subía una ceniza fría que no quemaba.'),
      santa('Esta es la grieta. No la abrió nadie de afuera: la abrieron desde adentro.'),
      santa('El Conde Sangrevil le tenía terror a la mano de mi señora: no quería morir nunca.'),
      santa('Nath’Gora no puede romper el escudo desde afuera. Le ofreció al Conde la vida eterna a cambio de una grieta. El Conde bebió ceniza de estrella muerta… y fue el primer vampiro.'),
      yo('Entonces hay que cerrar esa grieta.'),
      santa('Las Reliquias de Sangre la mantienen abierta: astillas de una estrella apagada. Cada una que saquen de Valdemora la cierra un poquito.'),
      n('Esa noche, las almas rescatadas llegaron por fin a la mano de Lara.'),
    ],
  },
  subsuelo: {
    titulo: 'Por qué el escudo', subtitulo: 'II · El Subsuelo',
    lineas: [
      n('En lo más hondo de la mina, donde dormían los dragones de Celia, las paredes estaban talladas: dos señoras y una niña chiquita entre ellas.'),
      santa('Aura y Lara, con Celia recién nacida. Y aquí, esa estrella negra que se traga un planeta: es Nath’Gora apagando el plano de otro panteón.'),
      santa('Mis señoras lo vieron hacerlo. Por eso, cuando nació Celia, la luz más cálida que ha tenido Astra, la escondieron detrás de un escudo.'),
      santa('Ese es el primer misterio: el escudo no se hizo por si acaso. Se hizo porque ya sabían quién venía.'),
      { quien: 'vaelthor', texto: 'Qué historia tan tierna. Lástima que los laberintos que construí no tengan salida.' },
      santa('Vael’Thor, el Ceramista de Sombras. Le hizo al Conde estas catacumbas para atrapar a las almas camino a Senda.'),
      yo('Pues vamos a encontrarle la salida.'),
    ],
  },
  santuario: {
    titulo: 'Los otros panteones', subtitulo: 'III · El Santuario',
    lineas: [
      n('Bajo el altar quemado de la abadía había un cofre. Adentro estaba el manuscrito de las Santas.'),
      santa('«Los otros panteones dejaron apagar la estrella que Nath’Gora cuidaba. Por descuido. Por soberbia.»'),
      santa('Él se vengó apagando sus planos uno por uno, y Vael’Thor encerró la esencia de esos dioses en geometrías oscuras.'),
      yo('Las Reliquias de Sangre… ¿son pedazos de esas cárceles?'),
      santa('Por eso pesan tanto. Cada reliquia que sacan de aquí libera un poquito de un dios dormido. Por eso los otros panteones no se meten: están encerrados.'),
    ],
  },
  corte: {
    titulo: 'El Lazo Primordial', subtitulo: 'IV · La Corte del Conde',
    lineas: [
      n('El Conde Sangrevil cayó de rodillas frente a la grieta. Del otro lado del escudo, algo hecho de frío miraba.'),
      { quien: 'nathgora', texto: 'Pequeños. Ustedes no son lo que busco. Busco el lazo que no me deja entrar.' },
      santa('El Lazo Primordial: el primer amor que nació en el Santuario. Dos almas que se escogieron y que juntan la pasión de Aura y la paz de Lara.'),
      santa('De ese lazo brilla la Constelación de los Amantes. Mientras brille, el escudo no se rompe.'),
      n('Lara bajó su velo sobre el Conde y se lo llevó a Nox, donde las sombras ya no le hacen daño a nadie. La grieta se cerró con un sonido de campana.'),
      santa('Nath’Gora sigue allá afuera. Volverá a buscar al Lazo. Y Valdemora va a necesitar sobrevivientes otra vez.'),
    ],
  },
};
