// Acto 2 · La ruta de la Semilla Madre (mundos 6 a 9, con mecánicas al estilo PvZ 2).
// Niveles 6-1 a 9-8 e intermedio hacia el Invernadero. Qué planta o zombi supone cada nivel: estrenos.ts.
import { cartero, dave, narrador, rosa, zomboss } from './hablar';
import type { EscenaNivel, Linea } from './tipos';

const MUNDO_6: Record<string, EscenaNivel> = {
  '6-1': {
    radio: [
      'Radio Superviviente en ruta. Hay zombis piratas en el río grande. Se tomaron el ferry y no cobran pasaje.',
      'Bueno, sí cobran: cobran en cerebros. No se suban.',
      'Consejo: en el ferry las raíces solo agarran en los tablones. Lo demás es agua y es de los zombis.',
    ],
    antes: [
      dave('¡El río! Para cruzar con la Chiva necesitamos el ferry. Y el ferry tiene… ¿piratas zombis? ¿Con bandera?', 'feliz'),
      dave('¡Zombi pirata! Y ese que se balancea en la liana es el Zombi espadachín: cae en medio del jardín.', 'asustado'),
    ],
    despues: [
      dave('Los piratas no tienen barco propio. Por eso quieren el nuestro. Y nuestros cerebros. Pero más el barco.'),
    ],
    consejo: 'En el ferry solo se siembra sobre los tablones.',
  },
  '6-2': {
    antes: [
      dave('¡Zombi gaviotero! Llega volando colgado de una gaviota y aterriza atrás. La gaviota no es zombi, solo grosera.', 'asustado'),
    ],
    despues: [
      dave('¡Boca de dragón! Echa fuego a su fila y a las dos de al lado. ¡Un dragón de jardín! Mi sueño de niño.', 'loco'),
    ],
    consejo: 'La Boca de dragón quema tres filas de cerca. Ponla detrás de una Nuez.',
  },
  '6-3': {
    antes: [
      dave('¡Zombi tonelero! Rueda un barril que aplasta plantas. Y adentro vienen Zombiditos piratas.', 'asustado'),
    ],
    despues: [
      dave('¡La Chiva subió al primer tablón sin hundirse! Bueno, se hundió un poquito. Una llanta. La de atrás.', 'feliz'),
    ],
    consejo: 'Rompe el barril del tonelero lejos de tus plantas: suelta Zombiditos.',
  },
  '6-4': {
    antes: [dave('Hoy vienen piratas con cono y con balde: Pirata caracono y Pirata caracubo. El balde les queda grande.')],
    despues: [
      dave('¡Frijuelle! Un frijol con resorte. Cuando un zombi se le acerca, ¡BOING!, lo manda al agua o para atrás.', 'loco'),
    ],
    consejo: 'El Frijuelle bota zombis al agua. Ponlo justo en el borde de los tablones.',
  },
  '6-5': {
    antes: [
      dave('¡Un Cañón zombidito! Dispara Zombiditos por encima de las plantas. ¡Rómpelo rápido!', 'asustado'),
    ],
    despues: [
      dave('Vi el dirigible de Zomboss encima del río. Va despacito, como si nos estuviera esperando.', 'serio'),
    ],
    consejo: 'Acaba con el Cañón zombidito antes de que dispare muchas veces.',
  },
  '6-6': {
    antes: [
      dave('¡El Zombi capitán pirata! Su Loro zombi vuela y se roba plantas. ¡Un loro ladrón que ni habla!', 'asustado'),
    ],
    despues: [
      dave('¡Cococañón! Tócalo y dispara una bala de coco que revienta todo alrededor. ¡Coco loco!', 'feliz'),
    ],
    consejo: 'El Cococañón se dispara tocándolo. Espera a que los zombis se amontonen.',
  },
  '6-7': {
    antes: [
      dave('¡Zombistein pirata! Igual de grande, pero con parche en el ojo. Dice «arrr». Yo también digo «arrr».', 'asustado'),
    ],
    despues: [
      narrador('El Zombi Cartero llegó remando en un barril. Entregó la carta, hizo una venia y se fue remando en círculos.'),
      dave('¡Nos siguió hasta el río! Ese cartero no se rinde. ¡Le voy a guardar una arepa!', 'feliz'),
    ],
    nota: {
      firma: 'Los zonbis piratas',
      texto:
        'Aoi becino: zomos piratas. El ferri aora es nuestro y el río tanbién. Si kieres pazar, paga kon tu ' +
        'selebro. Akeptamos selebro en efektivo. Plantas no, ke nos marean.',
    },
    consejo: 'Contra el Zombistein: golpéalo desde lejos y guarda algo explosivo para cuando se acerque.',
  },
  '6-8': {
    antes: [
      narrador('Del agua salió un robot con patas de tablón y cara de zombi pirata. Arriba, en la cabina, alguien estornudó.'),
      zomboss('¡Dave! ¡Qué sorpresa! Bueno, no tanta. Te presento a la Zombot Tablonera. ¡Achís!', 'loco'),
      dave('¡Zomboss! ¡Devuélvenos el ferry! ¡La Chiva no sabe nadar!', 'enojado'),
      zomboss('¡Ni tú ni tu bus de colores van a llegar al norte! ¡Tablonera, al ataque!', 'enojado'),
    ],
    despues: [
      narrador('La Tablonera se desarmó tablón por tablón y quedó flotando como una balsa.'),
      zomboss('¡Mi Tablonera! ¡Achís! Hasta los nenúfares me dan alergia. ¡Esto no se ha acabado!', 'asustado'),
      dave('¡Tenemos ferry! ¡Chiva, a bordo! ¡Primera clase para todos!', 'feliz'),
      narrador('La Chiva pitó feliz. El ferry se hundió un poquito, pero cruzó.'),
    ],
    consejo: 'La Tablonera tiende tablones con zombis encima: atiende a los que bajan.',
  },
};

const MUNDO_7: Record<string, EscenaNivel> = {
  '7-1': {
    radio: [
      'Radio Superviviente. Al otro lado del río está la vieja estación del tren. Ya no pasa el tren: pasan zombis.',
      'Los zombis vaqueros se tomaron las vías. Usan sombrero y botas y no saben arrear ni una gallina.',
      'Consejo: las vagonetas de los rieles llevan plantas de una fila a otra. Úsenlas.',
    ],
    antes: [
      dave('¡La estación! Si seguimos las vías llegamos al desierto. La Chiva sabe andar por rieles. Creo.', 'feliz'),
      dave('¡Zombi vaquero! Botas, sombrero y caminado de recién bajado del caballo. Unos con cono, otros con bandera.', 'asustado'),
    ],
    despues: [
      dave('¿Viste las vagonetas? Siembra encima y luego las mueves por el riel. ¡Plantas con ruedas!', 'loco'),
    ],
    consejo: 'Siembra sobre una vagoneta y arrástrala por el riel para cambiar la planta de fila.',
  },
  '7-2': {
    antes: [
      dave('¡Zombi buscador de oro! Se lanza con dinamita por encima de todo y cae detrás de tus plantas.', 'asustado'),
    ],
    despues: [
      dave('¡Frijol! Pica TANTO que, cuando un zombi se lo come, suelta un gas que atonta a los de atrás.', 'loco'),
      dave('No me mires así. Así funciona.'),
    ],
    consejo: 'El buscador de oro cae atrás: una Bipetidora o una Nuez en la primera columna.',
  },
  '7-3': {
    antes: [
      dave('¡Zombi pianista! Empuja un piano y toca tan feo que los zombis se cambian de fila bailando.', 'asustado'),
      dave('¡Y el piano aplasta plantas! ¡Eso no es música, es una mudanza!', 'enojado'),
    ],
    despues: [
      dave('Encontré una arepera vieja en la estación. Esta noche hay arepas para todos. La Chiva no: ella toma gasolina.', 'feliz'),
    ],
    consejo: 'El piano aplasta lo que hay en su fila. Páralo lejos de tus plantas.',
  },
  '7-4': {
    antes: [
      dave('¡Zombi poncho! El poncho para guisantes y a veces lleva una reja. Y viene con un Vaquero caracubo.', 'asustado'),
    ],
    despues: [
      dave('¡Vaina! Siembra otra encima y le sale otra cabeza. ¡Hasta cinco! Cinco cabezas, cinco guisantes.', 'loco'),
    ],
    consejo: 'La Vaina suma una cabeza por cada Vaina que siembres encima, hasta cinco.',
  },
  '7-5': {
    antes: [
      dave('¡Zombi gallinero! Si le pegas, suelta un montón de Gallinas zombi rapidísimas. ¡Cocorocó!', 'asustado'),
    ],
    despues: [
      dave('Ese dirigible otra vez. Zomboss sigue las vías igual que nosotros. ¿Será que no sabe el camino?', 'serio'),
    ],
    consejo: 'Las Gallinas zombi son rápidas pero débiles: usa plantas que peguen a varias.',
  },
  '7-6': {
    antes: [
      dave('¡Toro zombi! Embiste y lanza al Zombi jinete de toro bien adentro del jardín. ¡Rodeo al revés!', 'asustado'),
    ],
    despues: [
      dave('¡Junco eléctrico! Tira rayos que saltan de un zombi a otro. ¡Zas, zas, zas! Y no gasta luz.', 'feliz'),
    ],
    consejo: 'El Junco eléctrico encadena rayos: perfecto contra las Gallinas zombi.',
  },
  '7-7': {
    antes: [
      dave('¡Zombistein del salvaje oeste! Grande, con sombrero y un Zombidito en la espalda. ¡Yija no!', 'asustado'),
    ],
    despues: [
      narrador('El Cartero llegó en una vagoneta sin frenos. Lanzó la carta al pasar y siguió derecho por los rieles.'),
      cartero('¡Mmmrrrgh!'),
      dave('¡Qué puntería! ¡Así se reparte el correo!', 'feliz'),
    ],
    nota: {
      firma: 'Los zonbis bakeros',
      texto:
        'Ola forastero: este pueblo es mui chiko pa los dos. Mejor dicho, pa tu selebro y nosotros. Te ' +
        'esperamos al mediodía en la estasión. Trae el selebro. Las plantas no, ke pikan.',
    },
    consejo: 'Mueve las vagonetas para reforzar la fila que más se llene de zombis.',
  },
  '7-8': {
    antes: [
      narrador('Por los rieles llegó una diligencia de metal tirada por caballos robot de ojos rojos.'),
      zomboss('¡Yija, Dave! ¡Achís! La Zombot Diligencia te va a sacar de las vías. ¡Este pueblo es mío!', 'loco'),
      dave('¡Esto ni siquiera es un pueblo! ¡Es una estación vieja con tres gallinas!', 'enojado'),
      zomboss('¡Cuatro gallinas! ¡Y todas son zombis! ¡Diligencia, a la carga!', 'enojado'),
    ],
    despues: [
      narrador('La Diligencia se descarriló y quedó echando humo, con las ruedas para arriba.'),
      zomboss('¡Mi Diligencia! ¡Achís! ¡Ese junco me despeinó!', 'asustado'),
      zomboss('Da igual. El desierto se los va a tragar. ¡Allá no crece ni una flor! ¡Por fin un sitio sin achís!', 'loco'),
      dave('¡Al desierto, Chiva! Y no te recalientes, que allá se recalienta todo.', 'feliz'),
    ],
    consejo: 'La Diligencia suelta zombis por los rieles: defiende bien las vagonetas.',
  },
};

const MUNDO_8: Record<string, EscenaNivel> = {
  '8-1': {
    radio: [
      'Radio Superviviente. En el desierto rojo hace tanto calor que los zombis andan envueltos en vendas.',
      'Como momias. Ah, no: SON momias. Perdón, el calor me afecta.',
      'Ojo con las tormentas de arena: llegan de repente y empujan a los zombis más adentro del jardín.',
    ],
    antes: [
      dave('¡Zombi momia! Y ese del sol en las manos es el Zombi ra: se roba tu sol. ¡Recógelo antes que él!', 'asustado'),
      dave('Las tumbas de arena no dejan sembrar y tapan los disparos. ¡Rómpelas o que se las coma un Comepiedras!'),
    ],
    despues: [
      dave('La Chiva aguantó el calor. Le puse una toalla mojada en el motor. Y otra en mi olla.', 'feliz'),
    ],
    consejo: 'Las tumbas tapan los guisantes. Un Comepiedras o una lanzadora te abren camino.',
  },
  '8-2': {
    antes: [dave('Hoy hay momias con cono y con balde: Momia caracono, Momia caracubo. Las momias también se cuidan.')],
    despues: [
      dave('¡Bumerán! Lanza bumeranes que pegan a tres zombis… ¡a la ida y a la vuelta! Doble golpe.', 'loco'),
    ],
    consejo: 'El Bumerán pega a los tres primeros zombis de su fila, de ida y de vuelta.',
  },
  '8-3': {
    antes: [
      dave('¡Zombis camello! Vienen en fila, cada uno cargando un pedazo de camello de cartón. ¡Qué disfraz tan malo!', 'asustado'),
    ],
    despues: [
      dave('¡Encontré un oasis! Bueno, era un espejismo. Bueno, era la Chiva reflejada en una lata.', 'loco'),
    ],
    consejo: 'Los Zombis camello se tapan entre sí. Rompe primero al de adelante.',
  },
  '8-4': {
    antes: [
      dave('¡Zombi explorador! Lleva una antorcha y quema de una la planta que encuentra. ¡Apágale el fuego!', 'asustado'),
    ],
    despues: [
      dave('¡Lechuga iceberg! Gratis. Cuando un zombi la pisa, ¡lo congela! Y le apaga la antorcha. Fresquita.', 'feliz'),
    ],
    consejo: 'La Lechuga iceberg apaga la antorcha del Zombi explorador.',
  },
  '8-5': {
    antes: [
      dave('¡Zombi levantatumbas! Tira huesos y donde caen salen tumbas nuevas. ¡Deja de redecorar el desierto!', 'asustado'),
    ],
    despues: [
      narrador('Entre la arena roja apareció una figura con gorra y bolso. El Cartero había cruzado el desierto a pie.'),
      cartero('Mmmrrgh… mmh. Mmh.'),
      dave('¡Otra carta del Banco! ¡El otro pedazo del mapa! ¡Cartero, eres el mejor del mundo! ¡Y el más muerto!', 'feliz'),
    ],
    nota: {
      firma: 'Banco Nacional de Semillas',
      texto:
        'Estimado Dave: este es el último pedazo del mapa. El Invernadero de la Semilla Madre está en la cumbre ' +
        'del páramo helado, donde el frío espanta a los curiosos. Llévele calor a la semilla y no deje que la ' +
        'muerdan. Ya casi florece.',
    },
    consejo: 'Las tumbas del levantatumbas salen de pronto: ten Comepiedras a la mano.',
  },
  '8-6': {
    antes: [
      dave('¡Con los dos pedazos se ve todo! Después del desierto, el páramo. ¡Y en la cumbre, el Invernadero!', 'loco'),
      dave('Pero primero: ¡Zombi faraón! Viene adentro de un sarcófago que aguanta muchísimo.', 'asustado'),
    ],
    despues: [
      dave('¡Bonk Choi! Da puñetazos rapidísimos al que tenga cerca, adelante o atrás. ¡Chiquito pero bravo!', 'feliz'),
    ],
    consejo: 'El Bonk Choi pega de cerca: ponlo detrás de una Nuez para que pegue sin que lo muerdan.',
  },
  '8-7': {
    antes: [
      dave('¡Zombistein momificado! Y lleva un Zombidito momia para tirarlo. ¡Envuelto como tamal!', 'asustado'),
    ],
    despues: [
      narrador('El Cartero ahora viajaba en la escalera de atrás de la Chiva. Sacó otra carta del bolso y la entregó.'),
      dave('Este cartero ya es parte del viaje. Le hice una banquita. No muerde. Casi nunca.', 'feliz'),
    ],
    nota: {
      firma: 'Las momias',
      texto:
        'Ola becino: aki en el dezierto ase muxo kalor. Nos enbolbimos en bendas pa no kemarnos. Tu selebro ' +
        'debe estar frezkito. Préztanoslo. Te lo debolbemos (mentira).',
    },
    consejo: 'Cuando el Zombistein lance su Zombidito, ten algo listo en la primera columna.',
  },
  '8-8': {
    antes: [
      narrador('Una pirámide se abrió en dos y de adentro salió una esfinge robot con cara de zombi.'),
      zomboss('¡Bienvenidos a mi Zombot Esfinge! Acertijo, Dave: ¿qué tiene hojas y no es un libro? ¡Achís!', 'loco'),
      dave('¡Una planta! ¡Una lechuga! ¡Un cuaderno! ¡Gané!', 'loco'),
      zomboss('¡No era una pregunta de verdad! ¡Esfinge, aplástalos!', 'enojado'),
    ],
    despues: [
      narrador('La Esfinge se derrumbó en un montón de arena roja y tornillos.'),
      zomboss('¡Achís! ¡Hasta en el desierto hay flores! ¿Quién siembra flores en un desierto?', 'asustado'),
      dave('¡Nosotros!', 'feliz'),
      zomboss('¡Disfruten el páramo! ¡Allá las plantas se congelan como paletas!', 'loco'),
    ],
    consejo: 'La Esfinge levanta tumbas y llama momias: lleva lanzadoras que pasen por encima.',
  },
};

const MUNDO_9: Record<string, EscenaNivel> = {
  '9-1': {
    radio: [
      'Radio Superviviente. Hoy la señal llega con escarcha. Reportan zombis cavernarios en el páramo. Muy peludos.',
      'Sopla un viento tan helado que congela plantas. Si una queda en un bloque de hielo, caliéntenla.',
      'Abríguense, lleven ruana. Y si ven a un señor con una olla en la cabeza, salúdenlo de mi parte.',
    ],
    antes: [
      dave('¡El páramo! ¡Qué frío! Ahí vienen Zombis cavernarios con garrote, con cono y con balde. ¡Peludos y bravos!', 'asustado'),
      dave('Ojo con el viento helado: congela las plantas de una fila. Si quedan en un bloque, hay que calentarlas.', 'serio'),
    ],
    despues: [
      dave('¡Papa caliente! Gratis. Ponla en una planta congelada y la descongela. ¡Una papita con calefacción!', 'feliz'),
    ],
    consejo: 'La Papa caliente descongela una planta atrapada en hielo. Es gratis.',
  },
  '9-2': {
    antes: [dave('¡Zombi cazador! Tira bolas de nieve que congelan plantas. ¡Y ni siquiera es diciembre!', 'asustado')],
    despues: [
      dave('¡Mira esas plantas peludas en la ladera! ¡Frailejones, los abuelitos del páramo! Nunca se congelan.', 'loco'),
      dave('Y calientan a sus vecinas. Sembré un Frailejón en una matera: ¡ahora es tuyo! Abrázalo, no pica.', 'feliz'),
    ],
    consejo: 'El Frailejón no se congela y calienta a las plantas que tiene alrededor.',
  },
  '9-3': {
    antes: [
      dave('¡Zombi carabloque! Lleva un bloque de hielo en la cabeza. ¡Y Zombiditos yeti, chiquitos y veloces!', 'asustado'),
    ],
    despues: [
      dave('Desde aquí se ve la cumbre. Allá arriba brilla algo de vidrio. ¡El Invernadero!', 'serio'),
      dave('Y adentro, la Semilla Madre. ¡Chiva, falta poquito!', 'feliz'),
    ],
    consejo: 'Un Frailejón en el centro protege del viento helado a las ocho plantas que lo rodean.',
  },
  '9-4': {
    antes: [
      dave('¡Zombi jinete de dodo! El dodo aletea y salta las plantas bajitas. ¡Un pájaro que no vuela, volando!', 'asustado'),
    ],
    despues: [
      dave('¡Lanzachiles! Tira chiles ardientes y calienta a las plantas de al lado. ¡Picante y calefacción!', 'loco'),
    ],
    consejo: 'El Lanzachiles pasa por encima de escudos y calienta a sus vecinas.',
  },
  '9-5': {
    antes: [
      dave('¡Zombistein perezoso! Lento, enorme, con un carámbano de garrote y Zombiditos yeti. ¡No lo despiertes!', 'asustado'),
    ],
    despues: [
      dave('El dirigible de Zomboss da vueltas sobre la montaña. Siempre llega donde llegamos. ¿Nos sigue?', 'serio'),
    ],
    consejo: 'Al Zombistein perezoso hay que gastarlo desde lejos. Las Nueces le hacen perder tiempo.',
  },
  '9-6': {
    antes: [
      dave('¡Troglobocado! Empuja bloques de hielo con Zombiditos adentro. ¡Y aplasta lo que haya debajo!', 'asustado'),
    ],
    despues: [
      dave('¡Guardacelga! Cuando un zombi la muerde, lo empuja para atrás con sus hojas. ¡La portera del páramo!', 'feliz'),
    ],
    consejo: 'La Guardacelga empuja a los zombis hacia atrás hasta que se queda sin hojas.',
  },
  '9-7': {
    antes: [
      dave('¡Zombi comadrejera! Carga un tronco lleno de Comadrejas de hielo. ¡Si lo rompes, salen corriendo!', 'asustado'),
    ],
    despues: [
      narrador('El Cartero se bajó de su banquita, tiritando. Sacó una carta con más dibujos que letras.'),
      dave('Los cavernarios casi no saben escribir. Dibujaron un cerebro, un garrote y una carita feliz.'),
    ],
    nota: {
      firma: 'Los kabernarios',
      texto:
        'UGA. Nosotros tener frío. Tú tener selebro kalientito. UGA UGA. Nosotros ir a tu jardín. Traer garrote. ' +
        'No traer flores (flores dar achís a jefe). UGA.',
    },
    consejo: 'Rompe el tronco de la comadrejera lejos de tus plantas: las comadrejas corren mucho.',
  },
  '9-8': {
    antes: [
      narrador('La montaña rugió. De la nieve salió un mamut robot con colmillos de hielo y Zomboss en la cabina.'),
      zomboss('¡Gracias por el viaje, Dave! ¡Achís! Yo no sabía dónde quedaba el Invernadero. ¡Solo seguí a tu Chiva!', 'loco'),
      dave('¿¡Nos venías siguiendo!? ¿Y entonces para qué nos atacabas con tus robots?', 'asustado'),
      zomboss('¡Porque soy el villano! ¡Es mi trabajo! Ahora la Zombot Colmillos los va a congelar.', 'enojado'),
    ],
    despues: [
      narrador('La Colmillos se desmoronó en una avalancha de nieve y tornillos.'),
      zomboss('¡Achís! ¡Achís! ¡Esos frailejones peludos me dan más alergia que todo!', 'asustado'),
      zomboss('¡Igual llego primero! ¡Adiós, Dave! ¡La Semilla Madre ya es historia!', 'loco'),
      dave('¡Se fue en el dirigible hacia la cumbre! ¡Chiva, arranca!', 'asustado'),
      narrador('La Chiva tosió, pitó bajito y se quedó quieta. Tenía el motor congelado.'),
    ],
    consejo: 'La Colmillos sopla viento helado: reparte Frailejones y ten Papas calientes listas.',
  },
};

export const GUION_ACTO2: Record<string, EscenaNivel> = {
  ...MUNDO_6,
  ...MUNDO_7,
  ...MUNDO_8,
  ...MUNDO_9,
};

/** Después de 9-8: la subida a pie y el Invernadero tomado por Zomboss. */
export const INTERMEDIO_ACTO3: Linea[] = [
  dave('Lo siento, Chiva. Descansa. Volvemos por ti.', 'triste'),
  narrador('La Chiva pitó despacito, como diciendo «vayan». Y fueron.'),
  narrador('Subieron a pie, con las semillas a la espalda y el Cartero detrás, cargando la pala.'),
  narrador('En la cumbre, el Invernadero brillaba como una joya. Y estaba lleno de zombis.'),
  rosa('Radio Superviviente, urgente: todos los zombis del país marchan hacia la cumbre del páramo.', 'asustado'),
  rosa('No sé quién está allá arriba, pero aguanten. Toda la emisora está con ustedes. Bueno, solo estoy yo.', 'serio'),
  zomboss('¡Bienvenidos a MI Invernadero! ¡Achís! La Semilla Madre está en su matera, justo en el centro.', 'loco'),
  zomboss('Mis zombis se la van a comer antes de que florezca. ¡Y no habrá más flores! ¡Nunca más!', 'enojado'),
  dave('Vecino: la Semilla Madre va a florecer, pero necesita tiempo. Nosotros se lo vamos a dar.', 'serio'),
  dave('¡Que nadie la muerda! ¡Ni una mordida! ¡A SEMBRAR!', 'loco'),
];
