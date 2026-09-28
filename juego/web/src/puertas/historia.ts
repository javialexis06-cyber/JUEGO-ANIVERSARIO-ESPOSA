// La historia de Cien Puertas. El narrador es el otro personaje (si juega Él, narra Ella y al revés).
// Los recuerdos son de verdad: cómo se conocieron en Transformice, los viajes, las luces, la propuesta…
// En los recuerdos hablan los dos (a veces no se ponen de acuerdo en cómo pasó).
// {a|o}: la primera forma se usa cuando habla Ella y la segunda cuando habla Él ("orgullos{a|o}").

export type Quien = 'el' | 'ella';
/** Una línea de conversación: quién la dice y qué dice. */
export type Dicho = [Quien, string];

export interface Capitulo {
  n: number;
  titulo: string;
  /** Lo que cuenta el narrador al llegar al capítulo. */
  llegada: string[];
  /** Lo que dice al terminar su última puerta (antes del recuerdo). */
  despedida: string[];
}

export interface Recuerdo {
  /** Capítulo en el que se recupera (al abrir su última puerta). */
  capitulo: number;
  titulo: string;
  fecha: string;
  icono: string;
  dialogo: Dicho[];
}

export const INICIO = [
  'Mi amor… anoche un nubarrón travieso, el Olvido, se metió por la ventana.',
  'Se llevó nuestros recuerdos: desde la villa de Transformice hasta hoy.',
  'Los escondió detrás de cien puertas. Yo voy contigo a cada una: tú abres, yo te acompaño. ¿Vamos?',
];

export const CAPITULOS: Capitulo[] = [
  {
    n: 1,
    titulo: 'Nuestra casa',
    llegada: ['Empecemos por casa. Todas las puertas amanecieron con seguro.'],
    despedida: ['¡Salimos de la casa! Y mira… se nos devolvió el primer recuerdo.'],
  },
  {
    n: 2,
    titulo: 'El jardín',
    llegada: ['Un jardín lleno de rejas. El Olvido no tiene vergüenza.'],
    despedida: ['Otro recuerdo de vuelta. Este me pone sonrisa de bob{a|o}.'],
  },
  {
    n: 3,
    titulo: 'La cafetería',
    llegada: ['Una cafetería como para contarnos el día, como hacíamos todas las noches.'],
    despedida: ['Ya van a cerrar. Pero antes… mira lo que recuperamos.'],
  },
  {
    n: 4,
    titulo: 'La terminal',
    llegada: ['La terminal: aquí aprendimos a extrañarnos.', 'Pero también a viajar para vernos. Siempre volvemos.'],
    despedida: ['Qué bonito es llegar a donde está uno.'],
  },
  {
    n: 5,
    titulo: 'La playa',
    llegada: ['¡El mar! Arena, sol y… tormentas. Ya verás.', 'El Olvido escondió las puertas entre las conchas.'],
    despedida: ['Se hizo de noche. Antes de ir al bosque… otro recuerdo.'],
  },
  {
    n: 6,
    titulo: 'El bosque de las luciérnagas',
    llegada: ['El bosque de noche. No te asustes: las luciérnagas nos ayudan.', 'Yo te agarro la mano.'],
    despedida: ['Tantas lucecitas me hicieron acordar de algo…'],
  },
  {
    n: 7,
    titulo: 'La feria',
    llegada: ['¡La feria! Disfraces, luces y la rueda de la fortuna.', 'El Olvido se escondió entre los juegos. Qué tramposo.'],
    despedida: ['Hablando de disfraces…'],
  },
  {
    n: 8,
    titulo: 'El castillo de los cuentos',
    llegada: ['Un castillo como de cuento, con reina y todo.', 'Hay un dragón dormido. Pasito.'],
    despedida: ['Fin del cuento… no, mentiras: el nuestro no se acaba. Pero mira este recuerdo.'],
  },
  {
    n: 9,
    titulo: 'Entre las estrellas',
    llegada: ['Entre las estrellas… esto me recuerda un techo lleno de estrellas en Medellín.', 'Ya casi. Solo quedan unas puertitas.'],
    despedida: ['El Olvido se asustó y soltó los últimos recuerdos.', 'Volvamos a casa, mi amor. A nuestro hogar para siempre.'],
  },
  {
    n: 10,
    titulo: 'Nuestro hogar para siempre',
    llegada: ['Volvimos a casa… pero ahora brilla con todo lo que recuperamos.', 'Las últimas diez puertas. Las más nuestras.'],
    despedida: [],
  },
];

/** Los recuerdos que devuelve cada capítulo (hablan los dos; a veces discuten cómo pasó). */
export const RECUERDOS: Recuerdo[] = [
  {
    capitulo: 1,
    titulo: 'La villa de Transformice',
    fecha: '15 de septiembre',
    icono: 'raton',
    dialogo: [
      ['ella', '¿Te acuerdas de cómo empezó todo? En la villa de Transformice, esa que parece un barcito.'],
      ['el', 'Sí. Tú me querías estafar.'],
      ['ella', '¡Yo no te quería estafar! Bueno… un poquito. Mi vida estaba muy monótona y pensé: es solo un juego.'],
      ['el', 'Y yo, que ya casi no jugaba, te di todo lo que tenía. Sin pensarlo.'],
      ['ella', 'Me dijiste: «estás como necesitada, así que ten». ¡Qué humillación!'],
      ['el', 'Fue un acto de caridad.'],
      ['ella', 'Fuiste el primero y el único que se dio cuenta de la estafa. Pensé: este hombre es muy inteligente.'],
      ['el', 'Al final la estafada fuiste tú.'],
      ['ella', 'Sí… yo quería robarte las cositas del juego y tú me robaste el corazón.'],
    ],
  },
  {
    capitulo: 2,
    titulo: 'Matemáticas, filosofía y buscarnos',
    fecha: 'Esa misma noche',
    icono: 'charla',
    dialogo: [
      ['ella', 'Esa noche me hablaste de matemáticas y de filosofía.'],
      ['ella', 'Y yo te dije que nada de eso me gustaba.'],
      ['el', 'Pero yo seguí hablando.'],
      ['ella', 'Y lo fuiste volviendo cosas que sí me gustaban. Terminó encantándome la conversación.'],
      ['ella', 'Me fui a dormir pensando en ti… y me acordé de que no nos habíamos agregado de amigos. Me dio mucha tristeza.'],
      ['ella', 'Así que te busqué por todo el juego, con la esperanza de que estuvieras en línea.'],
      ['el', 'Y cuando me encontraste, te dije que yo también te estaba buscando.'],
      ['ella', '¿De verdad me estabas buscando o lo dijiste por quedar bien?'],
      ['el', '…Te di mi número de teléfono, ¿no?'],
      ['ella', 'Buen punto. Punto para las matemáticas.'],
    ],
  },
  {
    capitulo: 3,
    titulo: 'El 25 de octubre',
    fecha: '25 de octubre',
    icono: 'calendario',
    dialogo: [
      ['ella', 'Empezamos a contarnos el día, todos los días.'],
      ['ella', 'Y no sé en qué momento me di cuenta de que era feliz solo con contarte mis cosas.'],
      ['el', 'Yo al principio era un poco indiferente…'],
      ['ella', '¿Un poco? ¡Eras un témpano de hielo!'],
      ['el', 'Pero tú estuviste ahí, te esforzaste tanto… que poquito a poco me fui enamorando.'],
      ['el', 'Y el 25 de octubre, treinta días después, ya éramos novios.'],
      ['ella', '¿Treinta? Nos conocimos el 15 de septiembre, mi amor. Fueron cuarenta.'],
      ['el', 'Treinta, cuarenta… un mes, pues.'],
      ['ella', 'El de las matemáticas contando mal los días.'],
      ['el', 'Es que contigo el tiempo vuela.'],
    ],
  },
  {
    capitulo: 4,
    titulo: 'La primera vez que nos vimos',
    fecha: 'El primer encuentro',
    icono: 'ojos',
    dialogo: [
      ['el', 'La primera vez que te vi fue como ver a la mujer más hermosa del mundo.'],
      ['el', 'Tu cabello negro, tus labios, tu sonrisa… eras perfecta.'],
      ['ella', '¿Era? ¿Y ahora qué?'],
      ['el', 'Eres. Presente. Siempre presente.'],
      ['ella', 'Ah, bueno. Salvaste la conversación.'],
      ['el', 'Y ese viaje valió cada kilómetro.'],
    ],
  },
  {
    capitulo: 5,
    titulo: 'Cartagena',
    fecha: 'Nuestro viaje al mar',
    icono: 'ola',
    dialogo: [
      ['ella', '¡Cartagena! ¿Te acuerdas de la moto acuática?'],
      ['el', 'Alquilamos una moto acuática y salimos volando por el mar.'],
      ['ella', 'Y después vinieron las tormentas.'],
      ['ella', 'A mí me tocó dormir en el aeropuerto.'],
      ['el', 'Y a mí en un hotel cinco estrellas.'],
      ['ella', '¡¿Y todavía lo dices así de tranquilo?!'],
      ['el', 'Te pensé toda la noche… desde la cama grandota.'],
      ['ella', 'Muy chistoso.'],
      ['el', 'La próxima vez yo duermo en el aeropuerto y tú en el hotel. Prometido.'],
      ['ella', 'Lo dejo por escrito aquí, para que no se te olvide.'],
    ],
  },
  {
    capitulo: 6,
    titulo: 'Las luces de diciembre',
    fecha: 'Diciembre en Medellín',
    icono: 'luces',
    dialogo: [
      ['el', 'En diciembre fuimos a ver los alumbrados de Medellín.'],
      ['ella', '¡Los que hicieron con Disney! Todo brillaba.'],
      ['el', 'Yo solo veía cómo te brillaban los ojos.'],
      ['ella', 'Ay… ¿y las luces?'],
      ['el', 'Bonitas también. Pero no tanto.'],
    ],
  },
  {
    capitulo: 7,
    titulo: 'Halloween elegante',
    fecha: 'Todos los 31 de octubre',
    icono: 'antifaz',
    dialogo: [
      ['ella', 'En todos los Halloween nos vestimos elegantes.'],
      ['el', 'Y compramos vestidos… y tú te ves lindísima.'],
      ['el', 'Me encanta verte en ese vestido. Me derrite.'],
      ['ella', 'Dímelo otra vez, que no te escuché bien.'],
      ['el', 'Me. De. Rri. Te.'],
      ['ella', 'Así sí.'],
    ],
  },
  {
    capitulo: 8,
    titulo: 'Un cumpleaños de reina',
    fecha: 'Tu cumpleaños',
    icono: 'copa',
    dialogo: [
      ['el', 'Por tu cumpleaños te llevé a un restaurante de súper lujo.'],
      ['ella', 'Me sentí como una reina.'],
      ['el', 'Eras la reina del lugar.'],
      ['ella', 'Y tú el rey… que pagó la cuenta.'],
      ['el', 'Con todo el gusto del mundo.'],
    ],
  },
  {
    capitulo: 9,
    titulo: 'El planetario',
    fecha: 'Mi primera vez en Medellín',
    icono: 'estrellas',
    dialogo: [
      ['el', 'La primera vez que fui a Medellín fuimos al Parque Explora.'],
      ['ella', 'Y al planetario. Miles de estrellas en el techo.'],
      ['el', '¿Viste alguna estrella o solo me mirabas a mí?'],
      ['ella', '¡Oye! Eso lo tenía que preguntar yo.'],
      ['el', 'Yo sí te miraba a ti. Eras la más bonita del planetario.'],
      ['ella', 'Ahí sí te salió bien.'],
    ],
  },
  {
    capitulo: 10,
    titulo: 'Para siempre',
    fecha: 'En nuestra casa',
    icono: 'anillo',
    dialogo: [
      ['el', 'Te pedí matrimonio aquí, en la casa. Solos tú y yo.'],
      ['ella', '¡Y yo toda desarreglada!'],
      ['el', 'Estabas perfecta.'],
      ['el', 'Te dije lo mucho que te amo, que quiero pasar el resto de mi vida contigo…'],
      ['el', '…y que ojalá seas la mamá de nuestros hijos.'],
      ['ella', 'Y ya tenemos nombre: Lexy Katherine.'],
      ['el', 'Lexy, de Alexis, mi segundo nombre…'],
      ['ella', '…y con L, como manda la tradición de mi familia.'],
      ['el', 'Lo que más amo de ti son tus labios y tu sonrisa. Cada vez que sonríes, me vuelvo a enamorar.'],
      ['ella', 'Y lo que más me gusta a mí es estar abrazados en camita, sin hacer nada.'],
      ['el', 'Plan perfecto para el resto de la vida.'],
    ],
  },
];

/** Lo que dice el narrador al empezar cada puerta (a veces esconde una pista). */
export const PUERTAS: Record<number, string[]> = {
  1: ['La llave de repuesto siempre queda donde nadie mira… justo bajo los pies.'],
  2: ['Inventemos una contraseña para saber que somos nosotros:', 'tres golpecitos… y uno largo.'],
  3: ['Ese cuadro de colores sabe más de lo que parece.'],
  4: ['En este sofá se pierde todo. Todo.'],
  5: ['El timbre se volvió a trabar. A veces hay que insistir… mucho.'],
  6: ['Alguien colgó un laberinto de canica en la pared. Nadie lo ha terminado nunca.'],
  7: ['El Olvido rompió nuestra foto favorita. Tal vez se pueda arreglar.'],
  8: ['Algunas cosas solo brillan en la oscuridad. Como tú.'],
  9: ['El reloj se quedó sin manecillas. ¿Qué hora es para nosotros?', 'La de ahora mismo.'],
  10: ['La llave de la puerta de la calle quedó colgando de la lámpara. Uy, qué alto.'],
  11: ['Esta matica se está secando. Pobrecita.'],
  12: ['Esa mariposa siempre se posa en flores de su mismo color.'],
  13: ['¡Topos! Se llevaron cosas del jardín. Uno tiene algo brillante en la boca.'],
  14: ['El árbol de manzanas está cargadito… pero no se ve ni una.'],
  15: ['Un diente de león. Pide un deseo… y sopla.'],
  16: ['Ese caracol se llevó la llave. Es muy tímido: si lo tocas, se esconde.'],
  17: ['Alguien dibujó un mapa del camino de piedras para no pisar las flores.'],
  18: ['El reloj de sol marca la hora de las cosas bonitas: la del corazón.'],
  19: ['Debajo de tanta hoja seca siempre aparece algo.'],
  20: ['El invernadero está empañado. Adentro hay plantas, cada una con su número.'],
  21: ['El pedido de la casa está dibujado en la pizarrita. Prepáralo en orden.'],
  22: ['¿Me haces un corazón en la espuma del café?'],
  23: ['La balanza de las tortas nunca queda pareja. Hay que equilibrarla.'],
  24: ['Esa rocola toca una canción muy bonita. Escúchala bien.'],
  25: ['Llegó la cuenta. Esta vez invitas tú… si sabes cuánto es.'],
  26: ['Alguien escribió algo en el vidrio empañado. Se borró… ¿o no?'],
  27: ['Las galletas de la fortuna hoy dicen lo que más me gusta darte.'],
  28: ['El mesero escondió la llave debajo de una taza. No le quites el ojo.'],
  29: ['El letrero de la entrada gira. Solo abre cuando muestra lo que sentimos.'],
  30: ['Ya cerraron… o eso dice el letrero. Tal vez hay que verlo desde otro lado.'],
  31: ['Cuántas veces buscamos el bus que iba a donde estaba el otro.', 'Hoy vamos a donde el mapa tiene un corazón.'],
  32: ['La maleta de los viajes tiene candado. La clave sale de las calcomanías.'],
  33: ['El tablero de letras se enloqueció. Hay que pararlo en lo que siempre nos decimos.'],
  34: ['El torniquete es delicado: ni muy lento ni muy rápido.'],
  35: ['Hay que planear una ruta que pase por todas las carreteras una sola vez.'],
  36: ['Tres relojes siguen una regla. El cuarto se desordenó.'],
  37: ['Cada vez que pasa un bus tiembla todo. Hay que quedarse quieto para que las cosas se acomoden.'],
  38: ['La máquina de dulces… mis favoritos siempre fueron los de la fila B, columna 4.'],
  39: ['Nuestra maleta es la roja con un corazón. No te vayas a equivocar.'],
  40: ['El túnel es largo y oscuro. Cierra los ojos un momento… y al abrirlos, ya llegamos.'],
  41: ['Las conchas se recogen de la más chiquita a la más grande. Siempre en ese orden.'],
  42: ['Alguien hizo un castillo de arena enorme. Algo quedó enterrado adentro.'],
  43: ['Una botella con un mensaje viene flotando. Ojo con las rocas.'],
  44: ['Ese cangrejo se robó la llave. Dicen que tiene muchísimas cosquillas.'],
  45: ['Cuando la marea baja, se ven unos dibujos en la arena. Duran poquito.'],
  46: ['Un velerito de papel quedó en el charco. Sóplalo hasta el muelle.'],
  47: ['Los cocos de esa palmera guardan sorpresas.'],
  48: ['El faro parpadea un mensaje. En la cabaña está la tabla para leerlo.'],
  49: ['Las estrellas de mar brillan todas juntas… o ninguna.'],
  50: ['El atardecer más lindo del mundo. Ayúdale al sol a bajar.'],
  51: ['Qué oscuro está… menos mal traje una linterna.'],
  52: ['Las luciérnagas se prenden en un orden. Si las sigues, te abren el camino.'],
  53: ['Ese búho se sabe la clave. Cuenta muy bien lo que dice.'],
  54: ['Las luciérnagas son tímidas: solo se juntan en la oscuridad total, cuando nadie las mira.'],
  55: ['Los hongos de este bosque cantan. La piedra tiene pintada su canción.'],
  56: ['Para cruzar el arroyo hay que mantener la pelota en equilibrio sobre la tabla.'],
  57: ['La telaraña amaneció llena de rocío. Algo tiene tejido.'],
  58: ['La luna crece y decrece. La tabla de piedra quiere sus fases en orden.'],
  59: ['El árbol está dormido. Solo abre a quien cierra los ojos con él… un buen rato.'],
  60: ['El árbol se despertó y quiere jugar a las adivinanzas.'],
};

/** Ánimo (nunca pistas): tras varios intentos o un buen rato quieto. */
export const ANIMO = [
  'Tú puedes, yo te espero aquí.',
  'Respira, mi amor. Vas muy bien.',
  'No hay afán. Me encanta verte pensar.',
  'Sé que lo vas a lograr.',
  'Aquí estoy contigo.',
  'Una idea a la vez, corazón.',
  'Confío en ti más que en nadie.',
  'Ya casi, lo presiento.',
  'Pase lo que pase, eres mi persona favorita.',
];

/** Ánimos propios de cada uno (según quién narra). */
export const ANIMO_DE: Record<Quien, string[]> = {
  ella: [
    'Tú, que te diste cuenta de mi estafa al instante… esto es facilito.',
    'Piénsalo como cuando me explicabas matemáticas, pero con cosas que me gusten.',
    'Me gusta la carita que pones cuando piensas.',
  ],
  el: [
    'Sonríe un poquito, que cuando sonríes todo sale mejor.',
    'Tú no te rindes nunca. Así me conquistaste.',
    'Tranquila, mi amor. Yo te espero el tiempo que sea.',
  ],
};

/** Al abrir una puerta. */
export const FELICITAR = [
  '¡Lo lograste!',
  '¡Eso, mi amor!',
  '¡Sabía que podías!',
  '¡Otra puerta abierta!',
  '¡Qué cerebro tan lindo tienes!',
  '¡Increíble!',
  '¡Así se hace!',
  '¡Mira nada más!',
];

/** Algo bonito después de felicitar. */
export const BONITO = [
  'Contigo hasta las puertas más difíciles se abren.',
  'Cada recuerdo que vuelve me hace quererte más.',
  'Me haces sentir en casa en cualquier parte.',
  'Eres mi lugar favorito.',
  'Estoy orgullos{a|o} de ti.',
  'Qué suerte la mía de ir contigo.',
  'Si tuviera que abrir cien puertas más, las abro contigo.',
  'Nuestro amor es la llave de todo.',
  'Gracias por no rendirte nunca.',
];

/** Cosas bonitas propias de cada uno (según quién narra). */
export const BONITO_DE: Record<Quien, string[]> = {
  ella: [
    'Me robaste el corazón… y eso que la estafadora era yo.',
    'Eres el hombre más inteligente que conozco.',
    'Contigo hasta la filosofía me gusta.',
    'Soy feliz solo con contarte mis cosas.',
    'Qué bueno que tú también me estabas buscando.',
  ],
  el: [
    'Cada vez que sonríes me vuelvo a enamorar.',
    'Lo que más amo de ti son tus labios y tu sonrisa.',
    'Eres la mujer más hermosa del mundo.',
    'Eres el amor de mi vida.',
    'Gracias por esforzarte tanto por mí.',
  ],
};

/** Lo último que dice el narrador en la puerta 100. */
export const FINAL_DE: Record<Quien, string[]> = {
  ella: [
    '¡Cien puertas, mi amor! Todos nuestros recuerdos volvieron a casa.',
    'El Olvido no tuvo nada que hacer contra nosotros.',
    'Te quise estafar en una villa de Transformice… y terminé dándote mi corazón para siempre.',
    'Feliz aniversario. Te amo.',
  ],
  el: [
    '¡Cien puertas, mi amor! Todos nuestros recuerdos volvieron a casa.',
    'El Olvido no tuvo nada que hacer contra nosotros.',
    'Gracias por buscarme, por esforzarte y por elegirme. Eres el amor de mi vida.',
    'Feliz aniversario. Te amo.',
  ],
};

/** Cambia {a|o} según quién habla. */
export function voz(texto: string, quien: Quien) {
  return texto.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, a: string, o: string) => (quien === 'ella' ? a : o));
}

export const capituloDe = (n: number) => CAPITULOS[Math.min(9, Math.floor((n - 1) / 10))];
export const recuerdoDe = (capitulo: number) => RECUERDOS.find((r) => r.capitulo === capitulo);

/** Frase para una puerta (siempre la misma para la misma puerta, sin repetir seguidas). */
export const elegir = <T,>(lista: T[], n: number) => lista[((n * 7) % lista.length + lista.length) % lista.length];
