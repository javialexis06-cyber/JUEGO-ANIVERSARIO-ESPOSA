// La historia de Cien Puertas. El narrador es el otro personaje (si juega Él, narra Ella y al revés).
// Se puede cambiar todo el texto aquí (por ejemplo, poner recuerdos propios).
// {a|o}: la primera forma se usa cuando narra Ella y la segunda cuando narra Él ("orgullos{a|o}").

export interface Capitulo {
  n: number;
  titulo: string;
  /** Lo que cuenta el narrador al llegar al capítulo. */
  llegada: string[];
  /** Lo que dice al terminar su última puerta. */
  despedida: string[];
}

export const INICIO = [
  'Mi amor… anoche un nubarrón travieso, el Olvido, se metió por la ventana.',
  'Se llevó nuestros recuerdos y los escondió detrás de cien puertas, en los lugares donde nacieron.',
  'Yo voy contigo a cada una. Tú abres, yo te acompaño. ¿Vamos?',
];

export const CAPITULOS: Capitulo[] = [
  {
    n: 1,
    titulo: 'Nuestra casa',
    llegada: ['Empecemos por casa. Todas las puertas amanecieron con seguro.'],
    despedida: ['¡Salimos de la casa! Ya me acuerdo de nuestras noches de películas.', 'Afuera huele a flores… vamos al jardín.'],
  },
  {
    n: 2,
    titulo: 'El jardín',
    llegada: ['El jardín donde sembramos nuestra primera matica.', 'El Olvido dejó todo lleno de puertas y rejas. Qué descaro.'],
    despedida: ['Volvió el recuerdo de la tarde en que nos quemamos con el sol y nos dio risa.', 'Huele a café… ¿sientes?'],
  },
  {
    n: 3,
    titulo: 'La cafetería',
    llegada: ['La cafetería de nuestra primera cita. Todavía me acuerdo de los nervios.', 'Pídeme algo rico mientras abres.'],
    despedida: ['Ya me acuerdo: esa tarde no queríamos que cerraran el café.', 'Ahora toca viajar. La terminal nos espera.'],
  },
  {
    n: 4,
    titulo: 'La terminal',
    llegada: ['La terminal de buses: aquí aprendimos a extrañarnos.', 'Pero también a volver. Siempre volvemos.'],
    despedida: ['Qué bonito es llegar a donde está uno.', 'Siguiente parada: la playa.'],
  },
  {
    n: 5,
    titulo: 'La playa',
    llegada: ['El mar. Arena en los zapatos y el sol en la cara.', 'El Olvido escondió las puertas entre las conchas.'],
    despedida: ['El recuerdo del atardecer más lindo del mundo ya es nuestro otra vez.', 'Se está haciendo de noche… vamos al bosque.'],
  },
  {
    n: 6,
    titulo: 'El bosque de las luciérnagas',
    llegada: ['El bosque de noche. No te asustes: las luciérnagas nos ayudan.', 'Yo te agarro la mano.'],
    despedida: ['Qué noche tan bonita. Recuperamos el recuerdo de las estrellas fugaces.', '¡Escucho música! Hay una feria cerca.'],
  },
  {
    n: 7,
    titulo: 'La feria',
    llegada: ['¡La feria! Algodón de azúcar, luces y la rueda de la fortuna.', 'El Olvido se escondió entre los juegos. Qué tramposo.'],
    despedida: ['Me ganaste el peluche más grande de la feria. Ya me acuerdo.', 'Por allá se ve un castillo…'],
  },
  {
    n: 8,
    titulo: 'El castillo de los cuentos',
    llegada: ['Un castillo como de cuento. Siempre dijiste que yo era de cuento.', 'Hay un dragón dormido. Pasito.'],
    despedida: ['Fin del cuento… no, mentiras: el nuestro no se acaba.', 'Mira hacia arriba: nos vamos a las estrellas.'],
  },
  {
    n: 9,
    titulo: 'Entre las estrellas',
    llegada: ['Entre las estrellas. Desde aquí se ve lo lejos que hemos llegado.', 'Ya casi. Solo quedan unas puertitas.'],
    despedida: ['El Olvido se asustó y soltó los últimos recuerdos.', 'Volvamos a casa, mi amor. A nuestro hogar para siempre.'],
  },
  {
    n: 10,
    titulo: 'Nuestro hogar para siempre',
    llegada: ['Volvimos a casa… pero ahora brilla con todo lo que recuperamos.', 'Las últimas diez puertas. Las más nuestras.'],
    despedida: [],
  },
];

/** Lo que dice el narrador al empezar cada puerta (a veces esconde una pista). */
export const PUERTAS: Record<number, string[]> = {
  1: ['La llave de repuesto la dejábamos donde nadie mira… justo bajo nuestros pies.'],
  2: ['¿Te acuerdas cómo tocábamos para saber que éramos nosotros?', 'Tres golpecitos… y uno largo.'],
  3: ['El cuadro que pintamos juntos siempre supo más que nosotros.'],
  4: ['En este sofá se nos perdía todo. Todo.'],
  5: ['El timbre se volvió a trabar. A veces hay que insistir… mucho.'],
  6: ['El laberinto de canica que colgamos para jugar en las noches. Nunca lo terminamos.'],
  7: ['El Olvido rompió nuestra foto favorita. Tal vez se pueda arreglar.'],
  8: ['Algunas cosas solo brillan en la oscuridad. Como tú.'],
  9: ['El reloj se quedó sin manecillas. ¿Qué hora es para nosotros?', 'La de ahora mismo.'],
  10: ['La llave de la puerta de la calle quedó colgando de la lámpara. Uy, qué alto.'],
  11: ['La primera matica que sembramos… se está secando. Pobrecita.'],
  12: ['Esa mariposa siempre se posaba en flores de su mismo color.'],
  13: ['¡Topos! Se llevaron cosas del jardín. Uno tiene algo brillante en la boca.'],
  14: ['El árbol de manzanas está cargadito… pero no se ve ni una.'],
  15: ['Un diente de león. Pide un deseo… y sopla.'],
  16: ['Ese caracol se llevó la llave. Es muy tímido: si lo tocas, se esconde.'],
  17: ['Hicimos un mapa del camino de piedras para no pisar las flores.'],
  18: ['El reloj de sol marca la hora de las cosas bonitas: la del corazón.'],
  19: ['Barrimos este jardín mil veces. Siempre aparecía algo debajo de las hojas.'],
  20: ['El invernadero está empañado. Adentro guardábamos nuestras plantas favoritas, cada una con su número.'],
  21: ['Nuestro pedido de siempre está dibujado en la pizarrita. Prepáralo en orden.'],
  22: ['El café de esa tarde tenía un corazón en la espuma. ¿Me haces uno?'],
  23: ['La balanza de las tortas nunca quedaba pareja. Hay que equilibrarla.'],
  24: ['Nuestra canción sonaba en esa rocola. Escúchala bien.'],
  25: ['Llegó la cuenta. Esta vez invitas tú… si sabes cuánto es.'],
  26: ['Una vez escribí algo en el vidrio empañado. Se borró… ¿o no?'],
  27: ['Las galletas de la fortuna siempre acertaban: hoy dicen lo que más me gusta darte.'],
  28: ['El mesero escondió la llave debajo de una taza. No le quites el ojo.'],
  29: ['El letrero de la entrada gira. Solo abre cuando muestra lo que sentimos.'],
  30: ['Ya cerraron… o eso dice el letrero. Tal vez hay que verlo desde otro lado.'],
  31: ['Siempre buscábamos en el tablero el bus que iba a donde estaba el otro.', 'Hoy vamos a donde el mapa tiene un corazón.'],
  32: ['La maleta de los viajes tiene candado. La clave siempre salía de las calcomanías.'],
  33: ['El tablero de letras se enloqueció. Hay que pararlo en lo que siempre nos decimos.'],
  34: ['El torniquete es delicado: ni muy lento ni muy rápido.'],
  35: ['Planeamos una ruta que pasaba por todas las carreteras una sola vez.'],
  36: ['Tres relojes siguen una regla. El cuarto se desordenó.'],
  37: ['Cada vez que pasa un bus tiembla todo. Hay que quedarse quieto para que las cosas se acomoden.'],
  38: ['La máquina de dulces… mis favoritos siempre fueron los de la fila B, columna 4.'],
  39: ['Nuestra maleta es la roja con un corazón. No te vayas a equivocar.'],
  40: ['El túnel es largo y oscuro. Cierra los ojos un momento… y al abrirlos, ya llegamos.'],
  41: ['Recogíamos conchas de la más chiquita a la más grande. Siempre en ese orden.'],
  42: ['Hicimos un castillo de arena enorme. Algo quedó enterrado adentro.'],
  43: ['Una botella con un mensaje viene flotando. Ojo con las rocas.'],
  44: ['Ese cangrejo se robó la llave. Dicen que tiene muchísimas cosquillas.'],
  45: ['Cuando la marea baja, se ven unos dibujos en la arena. Duran poquito.'],
  46: ['Tu velerito de papel quedó en el charco. Sóplalo hasta el muelle.'],
  47: ['Los cocos de esa palmera guardan sorpresas.'],
  48: ['El faro parpadea un mensaje. En la cabaña está la tabla para leerlo.'],
  49: ['Las estrellas de mar brillan todas juntas… o ninguna.'],
  50: ['El atardecer más lindo del mundo. Ayúdale al sol a bajar.'],
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
  'Me gusta la carita que pones cuando piensas.',
  'Ya casi, lo presiento.',
  'Pase lo que pase, eres mi persona favorita.',
];

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
  'Contigo todo es más fácil.',
  'Estoy orgullos{a|o} de ti.',
  'Qué suerte la mía de ir contigo.',
  'Si tuviera que abrir cien puertas más, las abro contigo.',
  'Me encanta cómo resuelves las cosas.',
  'Nuestro amor es la llave de todo.',
  'Contigo el camino es lo más bonito.',
  'Gracias por no rendirte nunca.',
];

export const FINAL = [
  '¡Cien puertas, mi amor! Todos nuestros recuerdos volvieron a casa.',
  'El Olvido no tuvo nada que hacer contra nosotros.',
  'Gracias por cada puerta, por cada día y por elegirme siempre.',
  'Feliz aniversario. Te amo.',
];

/** Cambia {a|o} según quién narra. */
export function voz(texto: string, narra: 'el' | 'ella') {
  return texto.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, a: string, o: string) => (narra === 'ella' ? a : o));
}

export const capituloDe = (n: number) => CAPITULOS[Math.min(9, Math.floor((n - 1) / 10))];

/** Frase del día para una puerta (siempre la misma para la misma puerta, sin repetir seguidas). */
export const elegir = <T,>(lista: T[], n: number) => lista[((n * 7) % lista.length + lista.length) % lista.length];
