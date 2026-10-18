// Acto 3 · El Invernadero (mundo 10): proteger la Semilla Madre (10-1 a 10-5) y la Zombot Definitiva (10-6).
// Después, el final y los créditos.
import { cartero, dave, narrador, rosa, zomboss } from './hablar';
import type { EscenaNivel, Linea } from './tipos';

export const GUION_ACTO3: Record<string, EscenaNivel> = {
  '10-1': {
    radio: [
      'Radio Superviviente, transmisión especial desde la cumbre. Bueno, desde mi antena. Imagínense la cumbre.',
      'Dicen que la Semilla Madre necesita sol y calma para florecer. Calma no hay. El sol, por favor, recójanlo.',
      'Si se comen la semilla, se acaba todo. Sin presión.',
    ],
    antes: [
      narrador('En una matera, en el centro del Invernadero, una semilla del tamaño de un puño latía despacio.'),
      dave('Esa es la Semilla Madre. Si un zombi la muerde, perdemos. ¡Cuídala como a la última arepa!', 'serio'),
    ],
    despues: [
      narrador('La cáscara de la Semilla Madre se rajó un poquito. De adentro salió un brote verde.'),
      dave('¡Brotó! ¡Está viva! Hola, Semilla Madre. Soy Dave. Dave el Loco. Tú dime como quieras.', 'feliz'),
    ],
    consejo: 'La Semilla Madre no se mueve. Rodéala de Nueces y Calabazas.',
  },
  '10-2': {
    antes: [
      zomboss('¡Piratas! ¡Vaqueros! ¡Vayan por la semilla! ¡Achís! Ese brote ya me da piquiña.', 'enojado'),
      dave('¡Pues ráscate, Zomboss! ¡Aquí no pasa nadie!', 'enojado'),
    ],
    despues: [
      narrador('El brote se estiró hasta volverse un tallo con dos hojas. Olía a lluvia.'),
      dave('¡Tiene hojas! ¡Dos! Le voy a poner nombre a cada una. Esta es Hoja. Y esta, Hoja Dos.', 'loco'),
    ],
    consejo: 'Mezcla plantas de todos los mundos: los zombis también vienen de todos lados.',
  },
  '10-3': {
    antes: [
      zomboss('¡Momias, cavernarios, gallinas! ¡Todos a la matera! ¡Rápido, que se me tapa la nariz!', 'loco'),
      dave('¡Son muchísimos! Vecino, el abono: ¡para esto lo guardamos!', 'asustado'),
    ],
    despues: [
      narrador('El tallo subió hasta el techo de vidrio. Por primera vez en semanas, salió el sol sobre el páramo.'),
      dave('¿Viste? ¡Hasta el sol vino a mirar!', 'feliz'),
    ],
    consejo: 'Guarda el abono para cuando la Semilla Madre esté en peligro.',
  },
  '10-4': {
    antes: [
      narrador('El Zombi Cartero se quedó junto a la matera. No la mordió. Solo la miraba, muy quieto.'),
      zomboss('¡Cartero! ¡Muerde esa planta! ¡Es una orden!', 'enojado'),
      cartero('…Mmmh.'),
      narrador('El Cartero estornudó. Una sola vez, bajito. Y no se movió de ahí.'),
    ],
    despues: [
      narrador('En la punta del tallo apareció un capullo enorme, cerrado y dorado.'),
      dave('Ya casi. Un empujón más y florece. Zomboss lo sabe: va a traer todo lo que tiene.', 'serio'),
    ],
    consejo: 'Si un zombi llega a la Semilla Madre, despeja su fila con un Jalapeño o una Petacereza.',
  },
  '10-5': {
    antes: [
      zomboss('¡Última oportunidad, zombis! ¡Todos juntos! ¡Achís! ¡Achís! ¡ACHÍS!', 'loco'),
      dave('¡Vecino, que nadie toque ese capullo! ¡Todo lo que tenemos, a la cancha!', 'enojado'),
    ],
    despues: [
      narrador('El capullo empezó a abrirse. Un polvito dorado flotó en el aire.'),
      zomboss('¡No, no, no! ¡Si florece, se acaba mi mundo sin flores!', 'asustado'),
      zomboss('Muy bien, Dave. Me toca a mí. ¡Saquen la Zombot Definitiva!', 'enojado'),
    ],
    consejo: 'La última oleada trae de todo: reparte explosivos en varias filas.',
  },
  '10-6': {
    antes: [
      narrador('El piso del Invernadero tembló. Por la puerta entró un robot hecho de todos los robots.'),
      zomboss('¡La Zombot Definitiva! Tablones, ruedas, arena y hielo: ¡todos mis Zombots en uno! ¡Achís!', 'loco'),
      dave('¡Es enorme! ¡Y tiene una olla en la cabeza! ¡Me copió la olla!', 'asustado'),
      zomboss('¡Es un casco de comandante! ¡Zombot, destruye ese capullo!', 'enojado'),
      dave('Vecino, esto es todo. Si aguantamos, florece. ¡Por la Semilla Madre, por el barrio y por las arepas!', 'serio'),
    ],
    despues: [
      narrador('La Zombot Definitiva se tambaleó, echó chispas y cayó de espaldas. Zomboss salió volando de la cabina.'),
      zomboss('¡No puede ser! ¡Achís!… Un momento. ¿Qué es ese olor?', 'asustado'),
    ],
    consejo: 'La Zombot Definitiva usa los ataques de todos los jefes. Ten una respuesta para cada uno.',
  },
};

/** Después de 10-6: la Semilla Madre florece. Luego van los créditos. */
export const FINAL: Linea[] = [
  narrador('El capullo se abrió del todo. La Semilla Madre floreció.'),
  narrador('Su polen dorado salió por el techo de vidrio, bajó por el páramo y voló con el viento sobre todo el país.'),
  rosa('¡Radio Superviviente! Me reportan una nube dorada sobre la ciudad. Huele a… ¿flores? ¿Pan recién hecho?', 'asustado'),
  narrador('Y entonces, en todo el mundo, los zombis estornudaron al tiempo: ¡ACHÍS!'),
  rosa('¡Atención! Los zombis dejaron de pedir cerebros. Ahora piden… ¿arepas? ¡Están pidiendo arepas!', 'feliz'),
  dave('¡AREPAS! ¡Sabía que este día iba a llegar! ¡Traje doscientas en la mochila!', 'loco'),
  narrador('Dave repartió arepas a todos los zombis del Invernadero. Con queso. Algunos pidieron con huevo.'),
  zomboss('Respiré… y no estornudé. Dave, ¡no estornudé! El polen de la Semilla Madre me curó la alergia.', 'feliz'),
  zomboss('Todo este tiempo creí que odiaba las flores. Creo que solo odiaba estornudar.', 'triste'),
  dave('Toma, viejo colega: un Girasol, como los de tus cumpleaños. Pero este lo siembras tú.', 'feliz'),
  narrador('El Dr. Zomboss se arrodilló y sembró su primera flor. Le temblaban las manos. No estornudó.'),
  narrador('Entonces el Zombi Cartero, el primero en dejar de gemir, se acercó, se quitó la gorra y abrió la boca.'),
  cartero('…Gra… Gracias.', 'feliz'),
  narrador('Era su primera palabra en años. Nadie dijo nada. Allá abajo, la Chiva pitó, y todos aplaudieron.'),
  rosa('Aquí Rosa, de Radio Superviviente. Hoy no hay malas noticias. Hoy, por fin, hay jardín.', 'feliz'),
  dave('¡Vecino, ganamos! ¡Ahora sí: AREPAS PARA TODO EL MUNDO! ¡Y música! ¡A BAILAR!', 'loco'),
];

/** Pantallas de créditos, en orden. De fondo, los zombis bailan en el jardín. */
export const CREDITOS: { titulo: string; lineas: string[] }[] = [
  {
    titulo: 'Plantas contra Zombis: La Semilla Madre',
    lineas: ['Una aventura de jardín, apocalipsis y arepas.', 'Hecha para este juego.'],
  },
  { titulo: 'Creada por', lineas: ['Javier y Claude'] },
  {
    titulo: 'Inspirada en',
    lineas: [
      'Plants vs. Zombies y Plants vs. Zombies 2, de PopCap Games y Electronic Arts.',
      'Los dibujos, la música, los sonidos y los textos de esta aventura se hicieron aquí, en código.',
    ],
  },
  {
    titulo: 'Reparto',
    lineas: [
      'Tú, el jardinero de la última casa de la calle',
      'Dave el Loco, vecino, botánico y dueño de una olla',
      'Dr. Zomboss, villano en recuperación',
      'Rosa, la voz de Radio Superviviente',
      'El Zombi Cartero, empleado del año (todos los años)',
      'La Chiva, sin diálogos pero con mucho pito',
    ],
  },
  {
    titulo: 'Los zombis agradecen',
    lineas: [
      'Al Zombi caracono, por prestar el cono.',
      'Al Zombi caracubo, que todavía busca su balde.',
      'Al Zombi lector, que nunca terminó el periódico.',
      'A los Zombis extra, que bailaron gratis.',
      'A las Gallinas zombi, por el cocorocó.',
      'Al Zombistein, por no aplastar estos créditos.',
      'Y a las arepas. Sobre todo a las arepas.',
    ],
  },
  {
    titulo: 'Dave agradece',
    lineas: [
      'A su olla, por cuidarle el cerebro (lo poco que queda).',
      'A la Chiva, por no dejarlo botado. Casi nunca.',
      'A la cinta transportadora, al tostador y a la licuadora.',
      'Y a ti, vecino, por sembrar.',
    ],
  },
  {
    titulo: 'El Dr. Zomboss agradece',
    lineas: ['A su pañuelo, compañero de toda la vida.', 'A la Semilla Madre. A regañadientes. Pero de corazón.'],
  },
  {
    titulo: 'Aviso importante',
    lineas: [
      'Ninguna planta salió herida para siempre: las que se comieron ya volvieron a crecer.',
      'Ningún cerebro fue comido durante esta aventura. Bueno, casi ninguno.',
    ],
  },
  {
    titulo: 'Fin',
    lineas: ['Gracias por jugar.', 'Los zombis siguen bailando en el jardín. Puedes quedarte a mirar.'],
  },
];
