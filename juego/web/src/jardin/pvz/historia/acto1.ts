// Acto 1 · El barrio (mundos 1 a 5, en el orden de la aventura de PvZ 1).
// Prólogo, niveles 1-1 a 5-10 e intermedio hacia el acto 2. Qué planta, objeto o zombi supone cada nivel: estrenos.ts.
import { cartero, dave, narrador, rosa, zomboss } from './hablar';
import type { EscenaNivel, Linea } from './tipos';

export const PROLOGO: Linea[] = [
  narrador('Un martes cualquiera, en la última casa de la calle.'),
  rosa('¡Atención, atención! Aquí Rosa, de Radio Superviviente, con un boletín de última hora.', 'serio'),
  rosa('Los muertos se levantaron en todo el país. Repito: se levantaron. No es simulacro. Tampoco es lunes.', 'asustado'),
  rosa('Caminan despacio, gimen y quieren una sola cosa: cerebros. Cierren puertas, ventanas y la boca.', 'serio'),
  narrador('Del otro lado de la cerca sonó un golpe metálico. Alguien se había tropezado con una olla. Con su propia olla.'),
  dave('¡VECINO! ¡Vienen por tus sesos! ¡Siembra esto, rápido!', 'loco'),
  dave('Soy Dave. Dave el Loco. No sé por qué me dicen así. ¡AREPA CON QUESO!', 'loco'),
  dave('Antes de todo esto era botánico del Banco Nacional de Semillas. ¡Por eso tengo semillas de TODO!', 'feliz'),
  dave('Mira: un Lanzaguisantes. Le tira guisantes a los zombis. A nadie le gustan los guisantes. ¡A NADIE!'),
  dave('Siémbralo, recoge el sol que cae del cielo y no dejes pasar a ninguno. Yo me encargo del almuerzo.', 'serio'),
  narrador('Así empezó la defensa de la última casa de la calle. El almuerzo nunca llegó.'),
];

const MUNDO_1: Record<string, EscenaNivel> = {
  '1-1': {
    radio: [
      'Radio Superviviente, día uno del apocalipsis. Clima: soleado, con zombis dispersos en la tarde.',
      'Consejo del día: el sol sirve para sembrar. Si ven un sol cayendo del cielo, ¡atrápenlo!',
      'Y a quien se le perdió un zombi en el barrio: tranquilo, ya va solito para su casa.',
    ],
    antes: [
      dave('Toca el sobre del Lanzaguisantes y después toca el pasto. ¡Así se siembra!'),
      dave('Cada Lanzaguisantes cuesta 100 de sol. Carísimo, pero vale cada guisante.'),
      dave('¡Ahí viene uno! Es un Zombi común: lento, gris y con hambre. ¡Que no llegue a la casa!', 'asustado'),
    ],
    despues: [
      dave('¡Lo lograste! Toma un Girasol: da sol extra. Siémbralo atrás y te va a sonreír todo el día.', 'feliz'),
    ],
    consejo: 'Siembra los Lanzaguisantes en la fila por donde viene el zombi.',
  },
  '1-2': {
    antes: [
      dave('¿Ves ese con bandera? Es el Zombi abanderado. Cuando aparece, detrás viene una oleada enorme.', 'asustado'),
      dave('Siembra Girasoles primero. Más sol, más plantas. ¡Matemáticas de jardín!'),
    ],
    despues: [
      dave('¡Una Petacereza! Explota y se lleva a todos los zombis de alrededor. ¡PUM! ¡Me encanta el PUM!', 'loco'),
    ],
    consejo: 'Siembra Girasoles al principio: más sol temprano es más defensa después.',
  },
  '1-3': {
    antes: [
      dave('Ese del cono naranja es el Zombi caracono. El cono le aguanta varios guisantes. ¡Respeta el cono!', 'serio'),
    ],
    despues: [
      dave('¡Una Nuez! Dura como pan de ayer. Ponla adelante y los zombis se quedan mordiéndola un buen rato.', 'feliz'),
    ],
    consejo: 'El Zombi caracono aguanta el doble: pon dos tiradores en su fila.',
  },
  '1-4': {
    antes: [
      dave('Hoy no te traigo planta nueva. Te traigo algo MEJOR. Bueno, igual de bueno. Bueno, es una pala.'),
    ],
    despues: [
      dave('¡La pala! Sirve para sacar plantas y cambiarlas de sitio. ¡No la uses para cavar túneles como yo!', 'loco'),
      dave('Y un costal de abono. Dáselo a una planta y hace su ataque especial. ¡Úsalo cuando la cosa se ponga fea!'),
    ],
    consejo: 'Las Nueces aguantan mordiscos: ponlas delante de tus Lanzaguisantes.',
  },
  '1-5': {
    antes: [
      dave('¡Hoy jugamos bolos! Pero primero estrena la pala: arranca esos Lanzaguisantes que dejé en el patio.', 'loco'),
      dave('Después las nueces llegan por la cinta: arrástralas y suéltalas. Si una le pega a un zombi, rebota a otra fila.'),
      dave('¿Y las rojas? Esas explotan. ¡No me preguntes por qué tengo nueces que explotan!', 'feliz'),
    ],
    despues: [
      dave('¡Chuza! Ganaste una Patatapum. Se entierra, se arma y cuando un zombi la pisa… ¡PATATAPUM!', 'feliz'),
    ],
    consejo: 'Apunta las nueces a los zombis del medio: los rebotes alcanzan más filas.',
  },
  '1-6': {
    antes: [
      dave('¡Cuidado con el Zombi saltador de pértiga! Salta por encima de la primera planta que encuentra.', 'asustado'),
      dave('Truco: ponle algo barato adelante para que salte ahí. ¡Sin pértiga es un zombi más!'),
    ],
    despues: [
      dave('¡Hielaguisantes! Tira guisantes helados que ponen lentos a los zombis. Como yo los lunes.', 'feliz'),
    ],
    consejo: 'El saltador de pértiga salta una sola vez. Dale algo barato para saltar.',
  },
  '1-7': {
    antes: [dave('Hoy los zombis vienen con más hambre que yo. Y yo tengo MUCHA hambre.')],
    despues: [
      dave('¡Una Planta carnívora! Se traga un zombi entero de un bocado. Luego mastica despacio. ¡Modales!', 'loco'),
    ],
    consejo: 'Contra grupos grandes: el Hielaguisantes los frena y una Nuez los detiene.',
  },
  '1-8': {
    antes: [
      dave('¡Ese tiene un BALDE en la cabeza! Es el Zombi caracubo y aguanta muchísimo.', 'asustado'),
      dave('¡Qué buena idea, el balde! Me voy a poner uno. Ah, no, espera: ya tengo mi olla. ¡Protegidísimo!', 'loco'),
    ],
    despues: [
      dave('¡La Repetidora! Dispara dos guisantes por vez. El doble de guisantes, el doble de diversión.', 'feliz'),
    ],
    consejo: 'Contra el Zombi caracubo: una Planta carnívora, Hielaguisantes o una Patatapum bien puesta.',
  },
  '1-9': {
    antes: [dave('Hoy vienen de todos los tipos. ¡Usa todo lo que te he dado! Menos mi olla. La olla es mía.')],
    despues: [
      narrador('Un zombi con gorra y bolso de cartas metió un sobre por la cerca y se fue arrastrando los pies.'),
      cartero('Mmmrrgh… ¡rrrin, rrrin!'),
      dave('¿Ese era un cartero? ¿Un ZOMBI cartero? ¡Ahora el correo funciona mejor que antes!', 'asustado'),
    ],
    nota: {
      firma: 'Los zonbis',
      texto:
        'Kerido becino: kisieramos benir a tu kasa a almorsar. No traigas nada, nosotros ponemos el ambre y tú ' +
        'pones los sesos. Kon kariño, tus nuebos amigos. PD: kita esas plantas, son mui grozeras.',
    },
    consejo: 'Las oleadas enormes traen de todo. Guarda una Petacereza para la bandera.',
  },
  '1-10': {
    antes: [
      dave('¿Leíste? ¡Los zombis escriben! Mal, pero escriben. Hoy no eliges semillas: llegan por la cinta.', 'loco'),
      dave('La cinta la armé con una bicicleta y un tostador. Siembra rápido o se quema el tostador.'),
    ],
    despues: [
      dave('Se está haciendo de noche… y de noche salen cosas del cementerio del barrio.', 'serio'),
      dave('Toma una Seta desesporada. Las setas duermen de día y trabajan de noche. Como los búhos.'),
      dave('Tengo más semillas. ESPECIALES. Guardadas en un lugar secreto. ¡No pienses en mi nevera!', 'loco'),
    ],
    consejo: 'En la cinta las semillas no cuestan sol: siembra apenas lleguen.',
  },
};

const MUNDO_2: Record<string, EscenaNivel> = {
  '2-1': {
    radio: [
      'Radio Superviviente, transmitiendo en la oscuridad. Esta noche no hay luna. Hay zombis.',
      'Reportan movimiento en el cementerio del barrio. Los difuntos dicen que se aburrieron de estar acostados.',
      'Ojo: de noche no cae sol del cielo. Es la hora de los hongos.',
    ],
    antes: [
      dave('De noche no cae sol. Siembra Setas desesporadas: son gratis y disparan de cerca.'),
      dave('¡Y ese es el Zombi lector! Si le rompes el periódico, se pone furioso y corre. ¡Odia perder las noticias!', 'asustado'),
    ],
    despues: [
      dave('¡Una Seta solar! Empieza chiquita y da poquito sol. Después crece y da más. Una alcancía con sombrero.', 'feliz'),
    ],
    consejo: 'De noche las setas son tu mejor amiga. Las Setas desesporadas son gratis.',
  },
  '2-2': {
    antes: [dave('Esas lápidas salen del suelo y estorban. Y los zombis salen de ahí. ¡Qué falta de respeto!')],
    despues: [
      dave('¡Humoseta! Echa un vapor que atraviesa periódicos, puertas y lo que sea. ¡Hasta mi almuerzo!', 'loco'),
    ],
    consejo: 'El vapor de la Humoseta pega a todos los zombis que tenga cerca en su fila.',
  },
  '2-3': {
    antes: [
      dave('¡Ese zombi se trajo una puerta! Es el Zombi portero. Los guisantes rebotan en ella. ¡Qué grosero!', 'asustado'),
      dave('Usa Humosetas: el vapor pasa la puerta. ¡A ese no le abras!'),
    ],
    despues: [
      dave('¡Un Comepiedras! Siémbralo encima de una lápida y se la come. Crac, crac, ¡ñam! Le encanta el granito.', 'feliz'),
    ],
    consejo: 'La puerta del Zombi portero frena guisantes, pero no el vapor de la Humoseta.',
  },
  '2-4': {
    antes: [dave('Esta noche están raros. Algunos zombis llevan un carné colgado del cuello. ¿Quién les dio trabajo?', 'serio')],
    despues: [
      dave('Te regalo mi Almanaque. Ahí apunté todas las plantas y todos los zombis. Con dibujitos. Feos, pero míos.', 'feliz'),
    ],
    consejo: 'El Almanaque dice qué hace cada planta y cuánto aguanta cada zombi.',
  },
  '2-5': {
    antes: [
      dave('¡Hoy los zombis salen de las tumbas como topos! Dale con el mazo a cada cabeza que asome.', 'loco'),
      dave('¡PUM, PUM, PUM! Yo practiqué con mi olla. Ya no suena igual.'),
    ],
    despues: [
      dave('¡Hipnoseta! Si un zombi se la come, se pasa a nuestro lado y camina al revés. ¡Es como hacer amigos!', 'feliz'),
    ],
    consejo: 'La Hipnoseta rinde más si se la come un zombi grande.',
  },
  '2-6': {
    antes: [
      dave('¡Zombi deportista! Casco, hombreras y mucha prisa. Corre rapidísimo y aguanta como diez zombis.', 'asustado'),
      dave('Si guardaste una Petacereza, este es buen momento.'),
    ],
    despues: [
      dave('¡Seta miedica! Dispara lejos, pero si un zombi se le acerca, se esconde. Yo hago lo mismo. La entiendo.'),
    ],
    consejo: 'Pon las Setas miedicas atrás, lejos de los zombis, y que otras plantas las cuiden.',
  },
  '2-7': {
    antes: [dave('Hoy encontré algo raro en el cementerio. Te cuento después. ¡Primero sobrevive!')],
    despues: [
      dave('¡Seta congelada! Congela a todos los zombis de la pantalla por un ratico. ¡Brrr!', 'feliz'),
      dave('Y mira lo que se le cayó a un zombi: un carné del Banco Nacional de Semillas. Como el mío.', 'serio'),
      dave('Dice: «Dr. Zomboss. Laboratorio de Abonos. Alergias: polen, flores, todo». ¡Yo conozco a este tipo!', 'asustado'),
    ],
    consejo: 'La Seta congelada para a todos un momento. Úsala justo antes de una oleada enorme.',
  },
  '2-8': {
    antes: [
      dave('Zomboss trabajaba conmigo en el Banco. Estornudaba cada vez que yo entraba. Yo pensé que era cariño.', 'triste'),
      dave('¡Ojo! El Zombi bailón llega bailando y llama a sus Zombis extra, que salen del suelo. ¡Bailan horrible!', 'asustado'),
    ],
    despues: [
      dave('¡Petaseta! La más explosiva de todas. Deja un hueco donde no se puede sembrar por un buen rato.', 'loco'),
    ],
    consejo: 'Al Zombi bailón hay que tumbarlo rápido o seguirá llamando a sus bailarines.',
  },
  '2-9': {
    antes: [
      dave('Si Zomboss está detrás de esto, ¡le voy a pedir que me devuelva todos los girasoles que le regalé!', 'enojado'),
    ],
    despues: [
      narrador('Otra vez el Zombi Cartero. Tocó el timbre, esperó un buen rato y pasó la carta por debajo de la puerta.'),
      cartero('Mmmh. Mmmrrgh.'),
      dave('¡Otra carta! Huele a pañuelo usado. Léela tú, que no encuentro las gafas. Nunca he tenido gafas.', 'loco'),
    ],
    nota: {
      firma: 'Los zonbis (y el jefe)',
      texto:
        'Ola becino: el doktor Zonbos te manda zaludos. Dise ke ustedes trabajaban juntos. Nosotros no te ' +
        'konosemos, pero ya keremos komerte el selebro. PD: el jefe dise ke dejes de mandarle jirasoles.',
    },
    consejo: 'El Zombi bailón y sus extras llegan en grupo: la Humoseta les pega a varios.',
  },
  '2-10': {
    antes: [
      dave('¿Viste? ¡Zomboss les dicta las cartas! ¡Mi viejo colega es el jefe de los zombis!', 'enojado'),
      dave('Última noche en el cementerio. La cinta ya no tiene tostador: le puse una licuadora. No preguntes.', 'loco'),
    ],
    despues: [
      dave('¡Amaneció! Toma un Nenúfar: flota y encima puedes sembrar otras plantas. ¡Mañana vamos a la piscina!', 'feliz'),
      dave('No le digas a nadie, pero el agua de la piscina del conjunto está verde. Muy verde. Y se mueve.', 'serio'),
    ],
    consejo: 'Mezcla setas que disparan con setas que explotan: la cinta no espera.',
  },
};

const MUNDO_3: Record<string, EscenaNivel> = {
  '3-1': {
    radio: [
      'Radio Superviviente. Hace calor y los zombis descubrieron la natación. Nadie les enseñó, eso sí.',
      'Un oyente dice que los zombis evitan las montañas del norte: se acercan, se rascan la nariz y se devuelven.',
      '¿Qué habrá allá arriba? Si alguien sabe, que llame. No tenemos teléfono, pero que llame.',
    ],
    antes: [
      dave('¡La piscina del conjunto! Seis carriles. Por los dos del medio vienen zombis nadando.'),
      dave('¡Zombi playero! Flota en un patico inflable. Siembra un Nenúfar en el agua y encima un tirador.', 'asustado'),
    ],
    despues: [
      dave('¡Apisonaflor! Cuando un zombi se le acerca, salta y lo APLASTA. Lo hace con mucho gusto. Demasiado.', 'loco'),
    ],
    consejo: 'En el agua solo se siembra encima de un Nenúfar o con plantas acuáticas.',
  },
  '3-2': {
    antes: [dave('Seis carriles. Seis. Con cinco ya me enredaba. Mi olla tiene un carril y me basta.')],
    despues: [
      dave('¡Tripitidora! Dispara en su fila y en las dos de al lado. Tres cabezas piensan más que una.', 'feliz'),
    ],
    consejo: 'La Tripitidora cubre tres filas: en el borde del agua alcanza pasto y piscina.',
  },
  '3-3': {
    antes: [
      dave('¡Zombi buzo! Nada por debajo del agua y los guisantes le pasan por encima. ¡Tramposo!', 'asustado'),
    ],
    despues: [
      dave('¡Zampalga! Se esconde en el agua y jala para abajo al primer zombi que pase. ¡Glu, glu!', 'feliz'),
    ],
    consejo: 'La Zampalga va en el agua y se lleva a un zombi, por grande que sea.',
  },
  '3-4': {
    antes: [dave('Perdí las llaves de mi furgoneta. Si las encuentras, devuélvemelas. Las necesito para… cosas.')],
    despues: [
      dave('¡Mis llaves! Ya puedo abrir la furgoneta. ¡Ahí está LA TIENDA DE DAVE! ¡Cachivaches a precio de loco!', 'feliz'),
      dave('Vendo plantas mejoradas, más ranuras y un rastrillo. Se paga con las monedas que sueltan los zombis.'),
    ],
    consejo: 'Recoge las monedas que sueltan los zombis: en la tienda de Dave valen oro.',
  },
  '3-5': {
    antes: [
      dave('Hoy los zombis vienen chiquiticos. Chiquiticos y rapidísimos. ¡Y bravos!', 'loco'),
      dave('Creo que fue mi culpa: lavé su ropa con agua caliente.'),
    ],
    despues: [
      dave('¡Jalapeño! Explota y quema toda una fila. Picante de verdad, no como el de la tienda.', 'enojado'),
    ],
    consejo: 'Los zombis chiquitos son rápidos pero frágiles: llena el jardín de tiradores.',
  },
  '3-6': {
    antes: [
      dave('¡El Zombictor! Una máquina que deja hielo en la piscina… digo, en el pasto. Y aplasta plantas.', 'asustado'),
      dave('Detrás vienen los del Zombi de bobsleigh. Solo pueden andar por el hielo que deja el Zombictor.'),
    ],
    despues: [
      dave('¡Pinchohierba! Pincha las patas de los zombis que la pisan y revienta llantas. Le encantan las llantas.', 'feliz'),
    ],
    consejo: 'La Pinchohierba revienta al Zombictor. Ponla delante de su fila.',
  },
  '3-7': {
    antes: [dave('Hace frío para estar en la piscina. Alguien debería prender una fogata. Yo no, que se me quema la olla.')],
    despues: [
      dave('¡Plantorcha! Un tronquito en llamas. Los guisantes que pasan por ella salen ardiendo y pegan el doble.', 'loco'),
    ],
    consejo: 'Pon la Plantorcha delante de los Lanzaguisantes, nunca delante de los Hielaguisantes.',
  },
  '3-8': {
    antes: [
      dave('¡Zombi con delfín! Salta por encima de la primera planta del agua. El delfín no es zombi. ¿O sí?', 'asustado'),
    ],
    despues: [
      dave('¡Nuez cáscara-rabias! Más alta, más dura y más brava. Ni los saltadores le pasan por encima.', 'feliz'),
    ],
    consejo: 'La Nuez cáscara-rabias detiene los saltos de pértiga y de delfín.',
  },
  '3-9': {
    antes: [dave('El agua está tranquila. Demasiado tranquila. ¿Por qué salen burbujas?', 'serio')],
    despues: [
      narrador('El Zombi Cartero llegó flotando en un patico. Dejó la carta mojada en el borde y se fue nadando como perrito.'),
      dave('¡Qué cartero tan cumplido! Aunque mojó la carta. Sóplala un poquito antes de leer.', 'feliz'),
    ],
    nota: {
      firma: 'Los zonbis nadadores',
      texto:
        'Ola becino: keremos usar tu pisina. No sabemos nadar pero tenemos flotadores de patiko. Ke no se te ' +
        'olbide el bloqueador. Despues de nadar da muxa ambre. Ya sabes de ké. Zaludos mojados.',
    },
    consejo: 'Los carriles de agua necesitan su propia defensa: siembra tiradores encima de Nenúfares.',
  },
  '3-10': {
    antes: [
      dave('¡Cinta transportadora acuática! No, mentira, es la misma cinta. Pero mojada.', 'loco'),
    ],
    despues: [
      dave('Se viene la niebla. En las madrugadas el lago se pone tan blanco que uno no se ve ni los pies.', 'serio'),
      dave('Toma una Marseta: un hongo que vive en el agua y dispara esporas. ¡Gratis, como las del cementerio!', 'feliz'),
    ],
    consejo: 'Siembra Nenúfares temprano: así tendrás sitio para lo que traiga la cinta.',
  },
};

const MUNDO_4: Record<string, EscenaNivel> = {
  '4-1': {
    radio: [
      'Radio Superviviente, madrugada. Llegó la niebla y no se ve nada. Ni siquiera yo me veo, y estoy aquí.',
      'Una oyente nos cuenta una leyenda: hay una semilla que cura a los zombis. La llaman la Semilla Madre.',
      'Dicen que la escondieron en un invernadero muy al norte. Yo no sé si creer… pero me gusta creer.',
    ],
    antes: [
      dave('La niebla tapa la mitad del jardín. Los zombis aparecen de la nada. ¡Escucha los gemidos!', 'serio'),
      dave('¡Y ese es el Zombi con cajita! Le da vueltas a la manivela y… ¡BUM! Odio esa canción.', 'asustado'),
    ],
    despues: [
      dave('¡Planterna! Ilumina la niebla a su alrededor. Ya verás qué se acerca. No te va a gustar, pero lo verás.', 'feliz'),
    ],
    consejo: 'La Planterna despeja la niebla a su alrededor. Ponla en el centro del jardín.',
  },
  '4-2': {
    antes: [
      dave('¿Oíste a Rosa? ¿Una semilla que cura zombis? Eso me suena de algún lado… ¡No me acuerdo de dónde!', 'serio'),
      dave('Y no mires al cielo, que me da la impresión de que por ahí viene algo con globos.', 'asustado'),
    ],
    despues: [
      dave('¡Cactus! Dispara espinas y se estira para pinchar lo que vuela. ¡Pobres globos!', 'loco'),
    ],
    consejo: 'El Cactus revienta globos. Tenlo listo antes de que lleguen.',
  },
  '4-3': {
    antes: [dave('¡Zombi con globo! Vuela por encima de todo y las plantas normales no lo alcanzan.', 'asustado')],
    despues: [
      dave('¡Trebolador! Sopla tan fuerte que se lleva a los zombis voladores… y la niebla, un ratico.', 'feliz'),
    ],
    consejo: 'Un soplido del Trebolador se lleva a todos los zombis con globo de una vez.',
  },
  '4-4': {
    antes: [dave('Anoche no dormí pensando en esa semilla. Bueno, tampoco duermo mucho. Por la olla.')],
    despues: [
      narrador('Entre la niebla apareció el Zombi Cartero. Traía un sobre amarillento, con sellos de hace años.'),
      cartero('Mmmrrgh… mmh.'),
      dave('¡Es del Banco Nacional de Semillas! ¡Para mí! ¡Con cinco años de atraso! ¡Y trae un pedazo de mapa!', 'asustado'),
    ],
    nota: {
      firma: 'Banco Nacional de Semillas',
      texto:
        'Estimado Dave: escondimos la Semilla Madre en un invernadero del norte. Su polen cura lo que sea, incluso ' +
        'lo que todavía no se ha inventado. Alguien de este Banco, que estornuda mucho, la quiere destruir. ' +
        'Repartimos el mapa en pedazos, por correo. Cuide el suyo. Florecerá pronto.',
    },
    consejo: 'Las Planternas también descubren a los zombis antes de que lleguen a tus plantas.',
  },
  '4-5': {
    antes: [
      dave('¡La Semilla Madre existe! ¡Y tengo un pedazo del mapa! Bueno, un pedazo de un pedazo. ¡Pero es mío!', 'loco'),
      dave('Ahora, rompemacetas: dale con el mazo a las materas. Unas tienen plantas y otras… zombis. ¡Sorpresa!'),
    ],
    despues: [
      dave('¡Bipetidora! Dispara para adelante y para atrás. Ideal para los que se cuelan por la espalda.', 'feliz'),
    ],
    consejo: 'Rompe primero las materas del fondo: así tendrás espacio si sale un zombi.',
  },
  '4-6': {
    antes: [
      dave('«Alguien que estornuda mucho». Esa carta habla de Zomboss. ¡Él quiere destruir la Semilla Madre!', 'serio'),
      dave('¡Y cuidado con el Zombi excavador! Cava por debajo y sale detrás de tus plantas. ¡Por la espalda!', 'asustado'),
    ],
    despues: [
      dave('¡Frustrella! Dispara estrellas en cinco direcciones. A todas partes menos al frente. Así es ella.', 'loco'),
    ],
    consejo: 'Contra el excavador: una Bipetidora o una Patatapum en la primera columna.',
  },
  '4-7': {
    antes: [dave('Hoy es noche de calabazas. No sé por qué. Lo decidí yo. ¡Yo decido cosas!')],
    despues: [
      dave('¡Calabaza! Se pone encima de otra planta como armadura. Un abrigo naranja, muy a la moda.', 'feliz'),
    ],
    consejo: 'La Calabaza protege a la planta de adentro. Úsala con tus plantas más caras.',
  },
  '4-8': {
    antes: [
      dave('¡Zombi saltarín! Brinca en un palo saltarín por encima de todo. ¡Boing, boing! Me da envidia.', 'asustado'),
    ],
    despues: [
      dave('¡Magnetoseta! Le quita lo de metal a los zombis: baldes, cascos, cajitas y saltarines. ¡Todo para ella!', 'loco'),
    ],
    consejo: 'La Magnetoseta quita baldes, cascos y el palo del Zombi saltarín.',
  },
  '4-9': {
    antes: [dave('Leí la carta del Banco mil veces. Ya me la sé de memoria. Bueno, me sé la primera palabra.')],
    despues: [
      narrador('El Cartero salió de la niebla, dejó la carta en una matera y se volvió a perder en lo blanco.'),
      dave('Ese cartero me cae bien. Si no quisiera comerse mi cerebro, lo invitaba a almorzar.'),
    ],
    nota: {
      firma: 'Los zonbis de la niebla',
      texto:
        'Becino: kon esta niebla no bemos nada. Si oyes jemidos, somos nosotros. Si no oyes nada, tanbién somos ' +
        'nosotros. Prende una luz pa ke no nos tropesemos kon tus plantas. Grasias.',
    },
    consejo: 'Varias Planternas juntas dejan ver casi todo el lago.',
  },
  '4-10': {
    antes: [
      dave('¡Última noche de niebla! La cinta va a traer plantas raras. Yo tampoco sé cuáles. ¡Emoción!', 'loco'),
    ],
    despues: [
      dave('¡Coltapulta! Lanza coles por encima de todo. Perfecta para el tejado, donde nada dispara derecho.', 'feliz'),
      dave('Los zombis se están subiendo a los techos del barrio. Mañana nos toca ir para arriba.', 'serio'),
    ],
    consejo: 'Las lanzadoras pasan por encima de escudos: úsalas contra porteros y lectores.',
  },
};

const MUNDO_5: Record<string, EscenaNivel> = {
  '5-1': {
    radio: [
      'Radio Superviviente desde la azotea. Los zombis aprendieron a trepar. Qué orgullo. Qué susto.',
      'Rumor de la semana: vieron un robot gigante con cara de zombi cerca del barrio. Si lo ven, corran.',
      'Y si no lo ven, corran también. Por si acaso.',
    ],
    antes: [
      dave('En el tejado no hay tierra: siembra en materas. Y en la pendiente los tiradores derechos fallan.', 'serio'),
      dave('¡Y el Zombi colgao! Baja del cielo con un caucho, agarra una planta y se la lleva. ¡Ladrón con estilo!', 'asustado'),
    ],
    despues: [
      dave('¡Maceta! Una matera para sembrar donde quieras del tejado. Y si quieres, en la piscina. ¡Es todoterreno!', 'feliz'),
    ],
    consejo: 'En el tejado, las lanzadoras son las reinas: pasan por encima de la pendiente.',
  },
  '5-2': {
    antes: [dave('Desde aquí se ve todo el barrio. ¡Hasta mi casa! Es esa de allá. La que tiene la cerca rota.')],
    despues: [
      dave('¡Lanzamaíz! Tira granos de maíz y, de vez en cuando, mantequilla que deja quieto al zombi.', 'loco'),
    ],
    consejo: 'La mantequilla del Lanzamaíz deja quieto a un zombi unos segundos.',
  },
  '5-3': {
    antes: [
      dave('¡Zombi escalador! Le pone una escalera a tu Nuez y se le pasa por encima. Y la deja para los demás.', 'asustado'),
    ],
    despues: [
      dave('¡Grano de café! Despierta a las setas de día. Así trabajan doble turno. Y no les pago extra.', 'feliz'),
    ],
    consejo: 'Con un Grano de café, una seta trabaja de día. Siémbralo encima de la seta dormida.',
  },
  '5-4': {
    antes: [
      dave('Estoy arreglando algo en el garaje. Algo grande. Con ruedas. Y colores. ¡No preguntes!', 'serio'),
    ],
    despues: [
      dave('¡Ya casi está! Le puse luces, bancas de madera y un pito que suena a vaca. ¡Y tiene nombre!', 'loco'),
    ],
    consejo: 'Calcula el sol: cada seta de día necesita su Grano de café.',
  },
  '5-5': {
    antes: [
      dave('¡Hoy llueven Zombis colgaos! Bajan, agarran plantas y se las llevan. ¡Pura lluvia de ladrones!', 'asustado'),
      dave('Las semillas llegan por la cinta. ¡Siembra rápido, que ya vienen bajando!'),
    ],
    despues: [
      dave('¡Ajo! Cuando un zombi lo muerde, le da tanto asco que se cambia de fila. ¡Ni yo lo aguanto!', 'feliz'),
    ],
    consejo: 'El Ajo manda a los zombis a otra fila. Úsalo para llevarlos hacia tus mejores defensas.',
  },
  '5-6': {
    antes: [
      dave('¡Zombipulta! Un carro que tira balones de baloncesto desde lejos. ¡Y ni siquiera juega bien!', 'asustado'),
    ],
    despues: [
      dave('¡Paraplanta! Una hoja que tapa a sus vecinas de lo que cae del cielo: balones, colgaos y palomas.', 'feliz'),
    ],
    consejo: 'La Paraplanta cuida a sus vecinas de balones y de Zombis colgaos.',
  },
  '5-7': {
    antes: [dave('Hoy no viene nada nuevo. Bueno, sí: viene más de todo.')],
    despues: [
      dave('¡Margarita! No dispara ni explota. Solo da monedas. Es la planta favorita de mi bolsillo.', 'feliz'),
    ],
    consejo: 'La Margarita no defiende: siémbrala cuando el jardín ya esté seguro.',
  },
  '5-8': {
    antes: [
      dave('¡ZOMBISTEIN! El zombi más grande que he visto. Aplasta plantas con un poste. ¡Con un POSTE!', 'asustado'),
      dave('Y cuando se cansa, tira al Zombidito que lleva en la espalda bien adentro del jardín. ¡Qué papá!', 'asustado'),
    ],
    despues: [
      dave('¡Melonpulta! Tira melones enteros que pegan durísimo y salpican a los de al lado. ¡A comer fruta!', 'loco'),
    ],
    consejo: 'Contra el Zombistein: Melonpultas, Petacerezas, Jalapeños… y paciencia.',
  },
  '5-9': {
    antes: [dave('Detrás de la chimenea grande se mueve algo. Algo que hace bip, bip. Y estornuda.', 'serio')],
    despues: [
      narrador('El Cartero subió por la escalera de un Zombi escalador y dejó un sobre elegante, con estampillas de calavera.'),
      dave('Sobre fino, letra perfecta, una mancha de estornudo… ¡Esto lo escribió Zomboss en persona!', 'enojado'),
    ],
    nota: {
      firma: 'Dr. Zomboss',
      texto:
        'Querido Dave: ¿te acuerdas de mí? Yo sí me acuerdo de tus girasoles. ¡Achís! Mañana iré en persona con ' +
        'mi Zombot. Aplastaré tu casa, tus plantas y a tu vecino. Después, a lo importante. Prepárate. ' +
        '(Perdón por la mancha.)',
    },
    consejo: 'Los Zombis colgaos y los escaladores llegan juntos: Paraplantas y Coltapultas.',
  },
  '5-10': {
    antes: [
      narrador('El tejado tembló. Detrás de la casa se levantó un robot zombi más alto que el edificio del frente.'),
      zomboss('¡Dave! ¡Cuánto tiempo! ¡Achís! Te presento a mi Zombot. Lo armé con lo que sobró del Banco.', 'loco'),
      dave('¡Zomboss! ¿Tú despertaste a los zombis? ¡Eso no se hace! ¡Ni siquiera llenaste el formulario!', 'asustado'),
      zomboss('Inventé el gas que los despertó. Un mundo sin flores y lleno de cerebros. ¡Sin polen! ¡Sin achís!', 'enojado'),
      dave('¡Vecino, las plantas llegan por la cinta! ¡Pégale con todo cuando baje la cabeza!', 'enojado'),
    ],
    despues: [
      narrador('El Zombot chisporroteó, se sentó y soltó un humo con olor a lata quemada.'),
      zomboss('¡No! ¡Mi Zombot! ¡Achís! ¿Por qué hay tantas flores en este tejado? ¡ACHÍS!', 'asustado'),
      zomboss('No importa. Voy al norte. Destruiré la Semilla Madre antes de que florezca.', 'enojado'),
      zomboss('Una flor que cura zombis es la peor flor de todas. ¡Hasta nunca, Dave! ¡ACHÍÍÍS!', 'loco'),
      narrador('Zomboss saltó a un dirigible y se perdió entre las nubes, estornudando hacia el norte.'),
    ],
    consejo: 'Guarda las plantas fuertes de la cinta para cuando el Zombot baje la cabeza.',
  },
};

export const GUION_ACTO1: Record<string, EscenaNivel> = {
  ...MUNDO_1,
  ...MUNDO_2,
  ...MUNDO_3,
  ...MUNDO_4,
  ...MUNDO_5,
};

/** Después de 5-10: sale la Chiva y empieza el viaje. */
export const INTERMEDIO_ACTO2: Linea[] = [
  narrador('Esa noche, en el garaje de Dave, algo pitó. Sonó como una vaca con gripa.'),
  dave('¡Te presento a la CHIVA! Mi bus de colores. Bancas de madera, escalera atrás y techo para los bultos.', 'loco'),
  narrador('La Chiva pitó otra vez. Fue lo más parecido a un saludo.'),
  rosa('Radio Superviviente, edición especial. Vieron un dirigible estornudando hacia el norte. Sí, estornudando.', 'serio'),
  rosa('Quien vaya para allá pasa por el río, las vías del tren, el desierto rojo y el páramo helado. ¡Abríguense!'),
  dave('Mi pedazo de mapa llega hasta el desierto. Después… nada. Está roto. Tocará improvisar.', 'serio'),
  dave('¡Y improvisar es lo mío! Sube las semillas, las materas, la pala y las arepas. ¡Muchas arepas!', 'feliz'),
  dave('Zomboss quiere destruir la Semilla Madre. Pues nosotros la vamos a cuidar. ¡Nos vamos de viaje!', 'loco'),
  narrador('Y así, la Chiva salió del barrio cargada de semillas, una pala, un loco y su vecino.'),
];
