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
  /** Puerta que lo devuelve al abrirse (la 5 y la 10 de cada capítulo). */
  puerta: number;
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
    despedida: ['¡Salimos de la casa! Y mira… se nos devolvió otro recuerdo.'],
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
    llegada: ['El bosque de noche. No te asustes: las luciérnagas nos acompañan.', 'Yo te agarro la mano.'],
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
    llegada: ['Un castillo como de cuento, con reina y todo.', 'Dicen que por aquí vive un dragón… ojalá esté de buen genio.'],
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

/** Lo que dice el narrador cuando aparece un recuerdo a mitad de capítulo. */
export const HALLAZGO = [
  '¡Espera! Algo brilla detrás de esta puerta… ¡es un recuerdo nuestro!',
  '¡Mira lo que había escondido aquí! Un recuerdo.',
  'El Olvido dejó caer algo… ¡otro recuerdo!',
  'Shhh… ¿oyes? Es un recuerdo que quiere volver.',
];

/** Los veinte recuerdos, en orden: vuelven en las puertas 5, 10, 15… (hablan los dos; a veces discuten cómo pasó). */
export const RECUERDOS: Recuerdo[] = [
  {
    puerta: 5,
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
    puerta: 10,
    titulo: 'Matemáticas y filosofía',
    fecha: 'Esa misma noche',
    icono: 'charla',
    dialogo: [
      ['ella', 'Esa noche me hablaste de matemáticas y de filosofía.'],
      ['ella', 'Y yo te dije que nada de eso me gustaba.'],
      ['el', 'Pero yo seguí hablando.'],
      ['ella', 'Y lo fuiste volviendo cosas que sí me gustaban. Terminó encantándome la conversación.'],
      ['el', '¿Ves? La filosofía sí sirve para algo.'],
      ['ella', 'La filosofía no sé. El filósofo, tal vez.'],
      ['el', 'Eso también es filosofía.'],
    ],
  },
  {
    puerta: 15,
    titulo: 'Te busqué por todos lados',
    fecha: 'Al día siguiente',
    icono: 'lupa',
    dialogo: [
      ['ella', 'Me fui a dormir pensando en ti… y ahí me acordé: ¡no nos habíamos agregado de amigos!'],
      ['ella', 'Me dio una tristeza… pensé que no te iba a volver a encontrar.'],
      ['ella', 'Así que te busqué por todo el juego, con la esperanza de que estuvieras en línea.'],
      ['el', 'Y cuando me encontraste, te dije que yo también te estaba buscando.'],
      ['ella', '¿De verdad me estabas buscando o lo dijiste por quedar bien?'],
      ['el', '…Te di mi número de teléfono, ¿no?'],
      ['ella', 'Buen punto. Punto para las matemáticas.'],
      ['ella', 'Desde ahí nos contábamos todo, todos los días.'],
    ],
  },
  {
    puerta: 20,
    titulo: 'El 25 de octubre',
    fecha: '25 de octubre',
    icono: 'calendario',
    dialogo: [
      ['ella', 'No sé en qué momento me di cuenta de que era feliz solo con contarte mis cosas. Fue una conexión inmediata.'],
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
    puerta: 25,
    titulo: 'Videollamadas de 24 horas',
    fecha: 'La pandemia',
    icono: 'videollamada',
    dialogo: [
      ['ella', 'Al principio las videollamadas eran a veces sí, a veces no. Teníamos colegio y mil cosas.'],
      ['el', 'Y llegó la pandemia.'],
      ['ella', '¡Clases virtuales! Podíamos estar en llamada todo el día.'],
      ['el', 'Casi completamos las 24 horas en llamada.'],
      ['ella', '¿Casi? Las completamos. Dormíamos, estudiábamos, comíamos… todo juntos.'],
      ['el', 'Lo mejor era despertarse y que siguieras ahí, en la pantalla.'],
      ['ella', 'Lo único bueno de la pandemia: tenerte todo el día.'],
    ],
  },
  {
    puerta: 30,
    titulo: 'Compañeros de estudio',
    fecha: '2021, los dos en once',
    icono: 'lapiz',
    dialogo: [
      ['ella', 'Siempre nos ayudábamos con las tareas. Yo te hacía las de artística.'],
      ['el', 'Y yo casi todas las tuyas.'],
      ['ella', '¿Casi todas?'],
      ['el', '…Todas. Pero con mucho amor.'],
      ['ella', 'Contigo me sentía muy acompañada.'],
      ['el', 'Después volvimos al colegio: los dos en once, graduándonos el mismo año.'],
      ['ella', 'Y estudiamos juntos para el ICFES. Teníamos nuestras sesiones.'],
      ['el', 'Bueno, «estudiábamos»… yo explicaba y tú aprendías.'],
      ['ella', '¡Oye! Yo también ponía de mi parte.'],
      ['el', 'Ponías lo más importante: las ganas de estar conmigo.'],
      ['ella', 'Eso sí.'],
    ],
  },
  {
    puerta: 35,
    titulo: 'Psicología',
    fecha: 'Un cumpleaños con examen',
    icono: 'birrete',
    dialogo: [
      ['ella', 'Cuando nos graduamos, yo no quería seguir estudiando.'],
      ['ella', 'Quería un año sabático, tranquila. Y la verdad… no me sentía capaz. Creía que no iba a poder.'],
      ['el', 'Y yo no paré hasta convencerte.'],
      ['ella', 'Eres muy insistente.'],
      ['el', 'Persistente, que es distinto.'],
      ['ella', 'Y justo abrieron Psicología, en la universidad que yo quería, donde yo quería.'],
      ['ella', 'Hice el examen el día de mi cumpleaños… ¡y pasé!'],
      ['el', 'El mejor regalo de cumpleaños. Yo siempre supe que ibas a poder.'],
    ],
  },
  {
    puerta: 40,
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
    puerta: 45,
    titulo: 'La meta de diciembre',
    fecha: 'Un diciembre',
    icono: 'trofeo',
    dialogo: [
      ['ella', 'Yo quería trabajar, tener mi propia plata. Intenté de todo… y algunas cosas eran estafas.'],
      ['el', 'Esta vez te estafaron a ti.'],
      ['ella', '¡Ja! El karma de Transformice.'],
      ['ella', 'Hasta que decidí ser directora de Yanbal. Casi un año intentándolo.'],
      ['ella', 'Y la meta se cumplía en diciembre… justo antes de nuestro viaje a Cartagena.'],
      ['ella', 'Tenía un miedo: si no la cumplía, iba a estar triste en Cartagena y te iba a dañar el paseo.'],
      ['el', 'Tú nunca me dañas nada.'],
      ['ella', '¡Y la cumplí! A los dos días ya íbamos para Cartagena.'],
      ['el', 'Mi directora.'],
    ],
  },
  {
    puerta: 50,
    titulo: 'Cartagena',
    fecha: 'Nuestro primer viaje de playa',
    icono: 'ola',
    dialogo: [
      ['ella', '¡Cartagena! Nuestro primer viaje de playa. Solo los dos.'],
      ['el', 'Bueno… primero hubo un problemita con el vuelo.'],
      ['ella', '¿Problemita? No pudiste viajar el día que habíamos acordado.'],
      ['el', 'Y la aerolínea me dio un hotel cinco estrellas, de compensación.'],
      ['ella', 'Y yo dormí toda la noche en una banca de piedra del aeropuerto.'],
      ['ella', '¡¿Y todavía lo dices así de tranquilo?!'],
      ['el', 'Te pensé toda la noche… desde la cama grandota.'],
      ['ella', 'Muy chistoso.'],
      ['el', 'Después alquilamos una moto acuática y salimos volando por el mar.'],
      ['ella', 'Y conocí el castillo, y tantas cosas que nunca había visto.'],
      ['el', 'Parecías una niña chiquita, mirándolo todo.'],
      ['ella', 'Es que allá me sentí yo, contigo. Muy feliz.'],
      ['el', 'La próxima vez yo duermo en el aeropuerto y tú en el hotel. Prometido.'],
      ['ella', 'Lo dejo por escrito aquí, para que no se te olvide.'],
    ],
  },
  {
    puerta: 55,
    titulo: 'Me enamoré de la vida',
    fecha: 'Después de los días grises',
    icono: 'flor',
    dialogo: [
      ['ella', 'Hubo un tiempo en que yo estaba muy triste. Sin ganas de nada.'],
      ['el', 'Me acuerdo.'],
      ['ella', 'Y tú me motivabas en todo. Todos los días.'],
      ['ella', 'No sé en qué momento empecé a sentirme feliz… a amar la vida, a imaginarme un futuro y desearlo.'],
      ['el', 'Yo sí sé: cuando empezaste a verte como yo te veo.'],
      ['ella', 'Me enamoré de ti… y después me enamoré de la vida.'],
    ],
  },
  {
    puerta: 60,
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
    puerta: 65,
    titulo: 'De Sopetrán a Bucaramanga',
    fecha: 'Ocho horas de distancia',
    icono: 'bus',
    dialogo: [
      ['ella', 'Yo en Sopetrán, tú en Bucaramanga. Ocho horas de distancia.'],
      ['el', 'Nueve.'],
      ['ella', 'Ocho… si el bus no para.'],
      ['el', 'El bus siempre para.'],
      ['ella', 'Distintos departamentos, distintas costumbres… y aquí estamos.'],
      ['el', 'Tú eres todo lo contrario a mí.'],
      ['ella', 'Y tú a mí. Por eso encajamos: lo que no tiene uno, lo tiene el otro.'],
      ['el', 'Somos el complemento.'],
    ],
  },
  {
    puerta: 70,
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
    puerta: 75,
    titulo: 'Un cumpleaños de reina',
    fecha: 'Su cumpleaños',
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
    puerta: 80,
    titulo: 'Un cuento de hadas',
    fecha: 'Lo que le pedí a Dios',
    icono: 'castillo',
    dialogo: [
      ['ella', 'Yo siempre digo que tú eres mis oraciones respondidas. Todo lo que le pedí a Dios.'],
      ['el', '¿Todo, todo? ¿Hasta lo de las tareas?'],
      ['ella', 'Hasta lo de las tareas.'],
      ['el', 'Somos la persona que el otro soñó.'],
      ['ella', 'Esta historia es un cuento de hadas.'],
      ['el', 'Con castillo y todo.'],
      ['ella', 'Y solo le pido una cosa: un final de Disney.'],
      ['el', 'Eso déjamelo a mí.'],
    ],
  },
  {
    puerta: 85,
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
    puerta: 90,
    titulo: 'Mi hogar eres tú',
    fecha: 'Los días difíciles',
    icono: 'casa',
    dialogo: [
      ['ella', 'Después vino la ansiedad. Me faltaba el aire y creía que mis pulmones estaban enfermos.'],
      ['ella', 'Y luego se fue mi abuela.'],
      ['el', 'Y ahí estuve contigo, en todo.'],
      ['ella', 'Cuando viajé a Bucaramanga a verte, solo pensaba una cosa: «cuando lo vea, todo va a ser más fácil».'],
      ['el', '¿Y fue así?'],
      ['ella', 'Siempre es así. Tú eres mi pilar: cuando siento que no puedo más, me sostengo en ti y la vida se vuelve más liviana.'],
      ['ella', 'Tú eres mi hogar.'],
      ['el', 'Y tú el mío. Por eso siempre volvemos a casa.'],
    ],
  },
  {
    puerta: 95,
    titulo: 'La propuesta',
    fecha: 'Una noche en casa',
    icono: 'anillo',
    dialogo: [
      ['ella', 'Yo llevaba tiempo pensando: ¿cuándo me va a pedir matrimonio?'],
      ['el', 'Y yo, calladito, comprando el anillo.'],
      ['ella', 'Estábamos comiendo picada. Yo en pijama.'],
      ['el', 'Y después de la picada te dije que cerraras los ojos.'],
      ['ella', 'Me pusiste una cajita en las manos y me preguntaste qué creía que era.'],
      ['ella', 'Yo pensaba: ¿unos aretes? ¿Una cadena? Pero una vocecita me decía: es el anillo, es el anillo…'],
      ['el', 'Y era el anillo.'],
      ['ella', 'Tú arrodillado en la cama, yo sentada… y me puse a llorar.'],
      ['el', 'Lloraste muchísimo.'],
      ['ella', '¡Lloré lo justo!'],
      ['el', 'Te dije lo mucho que te amo, que quiero pasar el resto de mi vida contigo, hacer una familia, un hogar.'],
      ['ella', '¡Y yo toda desarreglada!'],
      ['el', 'Estabas perfecta.'],
      ['ella', 'Fue tan nuestro… Jamás me lo habría esperado.'],
    ],
  },
  {
    puerta: 100,
    titulo: 'Para siempre',
    fecha: 'Lo que viene',
    icono: 'familia',
    dialogo: [
      ['el', 'Tenemos un sueño: ser papás.'],
      ['ella', 'Queremos una niña… y si es niño, lo vamos a amar igualito.'],
      ['ella', 'Y ya tiene nombre: Katherine.'],
      ['el', 'Lexy Katherine.'],
      ['ella', 'Katherine.'],
      ['el', 'Lexy, de Alexis, mi segundo nombre…'],
      ['ella', '…y con L, como manda la tradición de mi familia. Bueno, está bien: Lexy Katherine.'],
      ['ella', 'Tú vas a ser el mejor papá y el mejor esposo.'],
      ['el', 'Y tú la mejor mamá del mundo.'],
      ['el', 'Lo que más amo de ti son tus labios y tu sonrisa. Cada vez que sonríes, me vuelvo a enamorar.'],
      ['ella', 'Y lo que más me gusta a mí es estar abrazados en camita, sin hacer nada.'],
      ['el', 'Plan perfecto para el resto de la vida.'],
      ['ella', 'Nuestro cuento de hadas…'],
      ['el', '…con final de Disney: felices para siempre.'],
    ],
  },
];

/** Lo que dice el narrador al empezar cada puerta (a veces esconde una pista). */
export const PUERTAS: Record<number, string[]> = {
  1: ['Primera puerta, mi amor. El Olvido le echó seguro y se llevó la llave… o eso cree él.'],
  2: ['Antes, cuando llegabas, yo ya sabía que eras tú desde el primer golpecito.'],
  3: ['Esta sala la pintamos juntos, ¿te acuerdas? Quedó más colorida que nosotros.'],
  4: ['Aquí nos quedábamos dormidos viendo películas. Tú con toda la cobija, yo sin nada.'],
  5: ['La puerta de la casa. El Olvido le echó seguro por dentro… qué descarado.'],
  6: ['Este juguete me lo regalaste para que dejara de morderme las uñas. No funcionó, pero lo amo.'],
  7: ['Nuestra foto favorita… el Olvido la hizo pedazos. Qué rabia me da.'],
  8: ['La sala de las noches largas: películas, cobijas y hablar hasta las tantas.'],
  9: ['El reloj de la sala. Nos regañaba cada vez que se nos hacía tarde hablando.'],
  10: ['La puerta de la calle, por fin. El último seguro de la casa.'],
  11: ['El jardín de la abuela. Aquí sembramos una semillita el día que nos hicimos novios… bueno, más o menos.'],
  12: ['¡Mira, una mariposa! Tú me dijiste una vez que traían buena suerte.'],
  13: ['¡Topos! Llevan toda la mañana dañando el pasto… y robándose cosas.'],
  14: ['Este árbol da las manzanas más dulces del barrio. Ni el Olvido se atrevió a tumbarlo.'],
  15: ['Un diente de león. De chiquit{a|o} pedía deseos con ellos… y mira, uno se me cumplió.'],
  16: ['Ese caracol vive en esta matera desde siempre. Nunca tiene afán, como tú los domingos.'],
  17: ['El caminito de piedras. Lo hicimos una tarde entera y quedó torcido… pero es nuestro.'],
  18: ['El reloj de sol de la abuela. Dice que solo marca las horas felices.'],
  19: ['Nadie ha barrido este jardín desde el otoño pasado. Qué pereza.'],
  20: ['El invernadero, donde las maticas pasan el frío. Adentro hace un calorcito rico.'],
  21: ['La cafetería de la primera cita. Tú pediste lo de siempre… y yo lo mismo que tú, para no quedar mal.'],
  22: ['Aquí nos tomamos el primer café juntos. Del café no me acuerdo; de ti, de todo.'],
  23: ['La balanza de las tortas. La dueña dice que aquí todo se vende al peso… hasta los abrazos.'],
  24: ['La rocola del rincón. Aquí sonó la canción que después fue nuestra.'],
  25: ['Llegó la cuenta. Esta vez invitas tú, que la vez pasada me tocó a mí.'],
  26: ['La ventana donde nos sentábamos. Afuera llovía y adentro era otro mundo.'],
  27: ['Galletas de la fortuna. La mía siempre dice cosas raras; la tuya, siempre cosas bonitas.'],
  28: ['El mesero de aquí es un tramposo. Una vez me cobró dos veces el mismo tinto.'],
  29: ['El letrero de la entrada lo pintaron los dueños. Llevan cuarenta años juntos… así quiero que estemos.'],
  30: ['Ya cerraron… qué mala suerte. Con lo que me gusta quedarme aquí contigo.'],
  31: ['Cuántas veces buscamos el bus que iba a donde estaba el otro.', 'Yo contaba los días; tú contabas las horas.'],
  32: ['La maleta de todos nuestros viajes. Siempre la empacabas tú, porque yo metía de todo.'],
  33: ['El tablero de las salidas se volvió loco con el Olvido. Antes anunciaba nuestros viajes.'],
  34: ['El torniquete de la terminal. Siempre se trababa justo cuando íbamos tarde.'],
  35: ['El mapa de carreteras. Nos lo aprendimos de memoria de tanto ir y venir.'],
  36: ['Los relojes de las ciudades. Cuando estábamos lejos, yo miraba el de la tuya.'],
  37: ['La sala de espera. Aquí esperé tantas veces tu bus que me aprendí todos los horarios.'],
  38: ['La máquina de dulces de la terminal. Me comía uno cada vez que te despedía.'],
  39: ['La banda de las maletas. Una vez casi me llevo la de un señor… igualita a la nuestra.'],
  40: ['El túnel antes de llegar. El viaje más largo siempre era el último pedacito.'],
  41: ['¡El mar! La primera vez que lo vimos juntos no dijimos nada durante un buen rato.'],
  42: ['Un castillo de arena gigante. El nuestro nunca pasó de ser un montoncito.'],
  43: ['Una botella con un mensaje. ¿Será de alguien que también está buscando a su persona?'],
  44: ['Ese cangrejo me pellizcó el dedo en Cartagena. Todavía le tengo rabia.'],
  45: ['La marea sube y baja todo el día. Me gustaba mirarla contigo sin decir nada.'],
  46: ['Un velerito de papel. Lo hicimos con la servilleta del almuerzo.'],
  47: ['La palmera de los cocos. Tú querías agua de coco y yo quería sombra.'],
  48: ['El faro de Cartagena. Dicen que les avisa a los barcos por dónde volver a casa.'],
  49: ['Estrellas de mar. Yo nunca había visto una de verdad hasta ese viaje.'],
  50: ['El atardecer más lindo del mundo… bueno, el segundo, después de ti.'],
  51: ['El bosque de noche. Agárrame la mano, que no se ve nada.'],
  52: ['Las luciérnagas de este bosque se conocen de memoria. Son como un coro.'],
  53: ['Un búho. Dicen que son los más sabios del bosque… y los más chismosos.'],
  54: ['Las luciérnagas de este claro son las más tímidas del bosque.'],
  55: ['Los hongos de este bosque cantan. Una vez nos dieron serenata.'],
  56: ['El arroyo. La primera vez que lo cruzamos me caí, y tú te reíste media hora.'],
  57: ['Una telaraña gigante. Tranquil{a|o}: la araña se fue de vacaciones.'],
  58: ['La luna se ve distinta desde aquí. Cada noche le pedía que te cuidara.'],
  59: ['El árbol más viejo del bosque. Dicen que solo se despierta con los que saben esperar.'],
  60: ['¡Se despertó! Y es más conversador que tu tía en diciembre.'],
  61: ['¡Tiro al blanco! Aquí me ganaste un peluche… después de gastarte toda la plata.'],
  62: ['La rueda de colores de la feria. Nunca ganamos nada, pero nos reímos harto.'],
  63: ['¿Algodón de azúcar? El tuyo siempre terminaba en mi pelo.'],
  64: ['La máquina de peluches. Esa garra es más floja que yo un lunes.'],
  65: ['El martillo de fuerza. Aquí quisiste lucirte… y casi te sacas un ojo.'],
  66: ['La carpa de la adivina. Me dijo que me iba a casar con alguien muy guap{o|a}.'],
  67: ['¡Globos! Tú siempre querías el más grande, aunque no cupiera en el bus.'],
  68: ['El carrusel. Nos montamos aunque éramos los más grandes de la fila.'],
  69: ['La casa de los espejos. Aquí te vi gordit{o|a}, flaquit{o|a} y chiquit{o|a}… y siempre lind{o|a}.'],
  70: ['La gran carpa. Aquí vimos el show de magia y adivinaste todos los trucos.'],
  71: ['Un castillo de verdad. Siempre quisiste vivir en uno… con wifi, eso sí.'],
  72: ['Shhh… un dragón dormido. Ronca igualitico a ti después del almuerzo.'],
  73: ['El comedor del castillo. Aquí cenaríamos todas las noches… a la luz de las velas, claro.'],
  74: ['La sala del tesoro. Esa gema es bonita… pero no tanto como tú.'],
  75: ['La armería del castillo. Aquí nadie sale sin estar bien vestido.'],
  76: ['El tablero de ajedrez gigante. Tú me enseñaste a jugar y luego no me dejabas ganar.'],
  77: ['El salón de los escudos. Cada familia del reino tenía el suyo.'],
  78: ['El laboratorio de la bruja buena. Huele a canela… y a algo raro.'],
  79: ['La biblioteca del castillo. Aquí guardan los secretos más importantes del reino.'],
  80: ['La torre más alta. Allá arriba hay alguien con el pelo larguísimo… me recuerda a alguien.'],
  81: ['Entre las estrellas. Como el techo del planetario, pero de verdad.'],
  82: ['¡Gravedad cero! Por fin floto como me siento cuando me miras.'],
  83: ['El sistema solar de juguete de la nave. El Olvido lo desordenó todo.'],
  84: ['La radio de la nave. Por aquí te dedicaba canciones… aunque nadie más las oyera.'],
  85: ['La nave está tratando de decirnos algo. Qué romántica esta nave.'],
  86: ['Todo quedó pegado al techo. Hasta yo me estoy mareando.'],
  87: ['¡Asteroides! Agárrate, que yo manejo… mentiras, maneja tú.'],
  88: ['La sala de máquinas. Aquí todo zumba y huele a nuevo.'],
  89: ['El cohete de emergencia. Solo tiene combustible para un viaje: el de vuelta a casa.'],
  90: ['Un eclipse. El sol y la luna solo se encuentran de vez en cuando… nosotros, todos los días.'],
  91: ['Volvimos a casa. Todas nuestras fotos se cayeron de la pared… qué desorden.'],
  92: ['El cofre de la abuela. Dice que solo se abre con cosas que nadie más sabe de nosotros.'],
  93: ['Te dejé una carta… pero me dio pena y la escribí en clave.'],
  94: ['La matica de la ventana. La regamos entre los dos… cuando nos acordamos.'],
  95: ['El piano de la casa. Aprendimos a tocar una sola canción… y la tocamos mil veces.'],
  96: ['¡La torta del aniversario! Tú haces la mezcla y yo me como lo que queda en la olla.'],
  97: ['La caja musical que me regalaste. Todavía suena bonito.'],
  98: ['Una estrella fugaz en la ventana. Yo ya sé qué voy a pedir.'],
  99: ['Ya casi, mi amor. Esta puerta es un poquito de todo lo que vivimos.'],
  100: ['La última puerta, mi amor. Llegamos hasta aquí juntos… y así la vamos a abrir.'],
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
    'Tú me explicabas para el ICFES. Esto, al lado de eso, es nada.',
  ],
  el: [
    'Sonríe un poquito, que cuando sonríes todo sale mejor.',
    'Tú no te rindes nunca. Así me conquistaste.',
    'Tranquila, mi amor. Yo te espero el tiempo que sea.',
    'Pasaste a Psicología el día de tu cumpleaños. Esto es facilito para ti.',
    'Sostente en mí, como siempre. Aquí estoy.',
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
    'Tú eres mis oraciones respondidas.',
    'Tú eres mi hogar.',
    'Contigo la vida se hace más liviana.',
  ],
  el: [
    'Cada vez que sonríes me vuelvo a enamorar.',
    'Lo que más amo de ti son tus labios y tu sonrisa.',
    'Eres la mujer más hermosa del mundo.',
    'Eres el amor de mi vida.',
    'Gracias por esforzarte tanto por mí.',
    'Siempre supe que ibas a poder. Siempre.',
    'Ya quiero verte de esposa… y de mamá.',
  ],
};

/** Lo último que dice el narrador en la puerta 100. */
export const FINAL_DE: Record<Quien, string[]> = {
  ella: [
    '¡Cien puertas, mi amor! Todos nuestros recuerdos volvieron a casa.',
    'El Olvido no tuvo nada que hacer contra nosotros.',
    'Te quise estafar en una villa de Transformice… y terminé dándote mi corazón para siempre.',
    'Eres mis oraciones respondidas, mi pilar, mi hogar.',
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
export const recuerdoDe = (puerta: number) => RECUERDOS.find((r) => r.puerta === puerta);

/** Frase para una puerta (siempre la misma para la misma puerta, sin repetir seguidas). */
export const elegir = <T,>(lista: T[], n: number) => lista[((n * 7) % lista.length + lista.length) % lista.length];
