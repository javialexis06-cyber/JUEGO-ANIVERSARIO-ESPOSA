// Textos del almanaque de plantas, con palabras propias (no son los del juego original).
// `descripcion`: qué hace, en una línea. `almanaque`: la ficha graciosa. Las cifras viven en datos/<area>.ts.
// Ids: nombre en minúsculas, sin tildes ni espacios. Las 49 de PvZ 1, las 12 de PvZ 2 del acto 2 y el Frailejón.

export const PLANTAS_TEXTO: Record<string, { descripcion: string; almanaque: string }> = {
  // --- Día
  lanzaguisantes: {
    descripcion: 'Dispara guisantes, uno a la vez, a los zombis de su fila.',
    almanaque: 'Practica todas las mañanas contra una lata. La lata ya se rindió. Su secreto: pensar poco y disparar mucho.',
  },
  girasol: {
    descripcion: 'Produce sol cada cierto tiempo.',
    almanaque: 'Sonríe aunque llueva, aunque haya zombis y aunque nadie le devuelva el saludo. Así trabaja ella.',
  },
  petacereza: {
    descripcion: 'Explota al instante y acaba con los zombis de alrededor (3×3).',
    almanaque: 'Son dos hermanas que nunca se ponen de acuerdo en nada. Salvo en una cosa: explotar juntas.',
  },
  nuez: {
    descripcion: 'Barrera muy resistente que frena a los zombis mientras la muerden.',
    almanaque: 'Le dicen que es dura de cabeza. Ella lo toma como un elogio y se queda quieta, mirando feo.',
  },
  patatapum: {
    descripcion: 'Mina barata: tarda en armarse y explota con el primer zombi que la pisa.',
    almanaque: 'Pasa el día enterrada, esperando. Dice que no es pereza, que es estrategia. Nadie le discute.',
  },
  hielaguisantes: {
    descripcion: 'Dispara guisantes helados que hacen más lentos a los zombis.',
    almanaque: 'Nació en una nevera y nunca se le quitó el frío. Pide tinto todas las mañanas, aunque no se lo pueda tomar.',
  },
  carnivora: {
    descripcion: 'Se traga un zombi entero de un bocado y luego tarda en masticar.',
    almanaque: 'Su médico le dijo que masticara despacio. Se lo tomó muy en serio. Demasiado en serio.',
  },
  repetidora: {
    descripcion: 'Dispara dos guisantes por vez.',
    almanaque: 'Todo lo dice dos veces. Todo lo dice dos veces. Los zombis ya se cansaron. Ya se cansaron.',
  },
  // --- Noche
  desesporada: {
    descripcion: 'Seta gratis que dispara esporas de corto alcance. Duerme de día.',
    almanaque: 'Es chiquita y lo sabe. Por eso grita más duro que todas las demás.',
  },
  setasolar: {
    descripcion: 'Da poco sol al principio y más cuando crece. Duerme de día.',
    almanaque: 'Ahorra sol como quien ahorra monedas en una alcancía. Sueña con comprarse un sombrero más grande.',
  },
  humoseta: {
    descripcion: 'Echa vapor que atraviesa escudos y daña a todos los zombis cercanos de su fila. Duerme de día.',
    almanaque: 'No es que tenga mal genio. Es que así respira.',
  },
  comepiedras: {
    descripcion: 'Se come la lápida o la tumba de la casilla donde se siembra.',
    almanaque: 'Prefiere el granito, pero si toca, se come el mármol. No es exigente. Solo tiene mucha hambre.',
  },
  hipnoseta: {
    descripcion: 'El zombi que se la come cambia de bando y ataca a los suyos. Duerme de día.',
    almanaque: 'Tiene unos ojos que dan vueltas. Mirarla un rato marea, y los zombis mareados cambian de opinión.',
  },
  miedica: {
    descripcion: 'Dispara de lejos, pero se esconde si un zombi se acerca. Duerme de día.',
    almanaque: 'Le tiene miedo a los zombis, a la oscuridad y a los aplausos. Pero cuando dispara, no falla.',
  },
  setacongelada: {
    descripcion: 'Congela por un rato a todos los zombis de la pantalla. Duerme de día.',
    almanaque: 'Cuando se pone nerviosa, se congela. Y de paso congela a todos los demás.',
  },
  petaseta: {
    descripcion: 'Explosión enorme que deja un cráter donde no se puede sembrar un rato. Duerme de día.',
    almanaque: 'Nadie la invita a las fiestas. Bueno, la invitan una vez. Después reconstruyen el salón.',
  },
  // --- Piscina
  nenufar: {
    descripcion: 'Flota en el agua y deja sembrar otras plantas encima.',
    almanaque: 'No hace nada, y lo hace muy bien. Sin ella, nadie más podría estar en la piscina.',
  },
  apisonaflor: {
    descripcion: 'Salta y aplasta al primer zombi que se le acerca.',
    almanaque: 'Tiene mal genio desde que brotó. Nadie sabe por qué. Ella tampoco, pero no piensa preguntar.',
  },
  tripitidora: {
    descripcion: 'Dispara a su fila y a las dos de al lado.',
    almanaque: 'Sus tres cabezas lo votan todo. Siempre gana la misma idea: disparar.',
  },
  zampalga: {
    descripcion: 'Planta acuática que hunde al primer zombi que pasa cerca.',
    almanaque: 'Saluda bajito desde el agua. Si le devuelves el saludo, ya fue.',
  },
  jalapeno: {
    descripcion: 'Explota en llamas y quema a todos los zombis de su fila.',
    almanaque: 'Lleva años guardando rabia. Hoy, por fin, es el día.',
  },
  pinchohierba: {
    descripcion: 'Pincha a los zombis que pasan por encima y revienta vehículos.',
    almanaque: 'Es la planta que más pisan en todo el jardín. Por eso pincha.',
  },
  plantorcha: {
    descripcion: 'Los guisantes que la atraviesan se encienden y hacen el doble de daño.',
    almanaque: 'Le encanta contar historias de miedo alrededor de sí misma. Solo se sabe una.',
  },
  nuezalta: {
    descripcion: 'Barrera alta y durísima. Nadie salta por encima de ella.',
    almanaque: 'Se estira para que la vean. Los zombis la ven. Y no pasan.',
  },
  // --- Niebla
  marseta: {
    descripcion: 'Seta acuática gratis que dispara esporas de corto alcance. Duerme de día.',
    almanaque: 'Vive en el agua y no sabe nadar. Tampoco le hace falta.',
  },
  planterna: {
    descripcion: 'Despeja la niebla a su alrededor.',
    almanaque: 'Le tenía miedo a la oscuridad, así que decidió no dejarla existir.',
  },
  cactus: {
    descripcion: 'Dispara espinas y se estira para reventar globos.',
    almanaque: 'Le dicen que es puntudo. Ella dice que es sincera.',
  },
  trebolador: {
    descripcion: 'Sopla la niebla por un rato y se lleva a todos los zombis voladores.',
    almanaque: 'Es un trébol de cuatro hojas, pero la suerte se la hace él mismo, a punta de soplidos.',
  },
  bipetidora: {
    descripcion: 'Dispara hacia adelante y hacia atrás.',
    almanaque: 'Nunca sabe para dónde mirar, así que mira para los dos lados. Por si acaso.',
  },
  frustrella: {
    descripcion: 'Dispara estrellas en cinco direcciones.',
    almanaque: 'Apunta a todas partes menos al frente. Dice que así la vida es más interesante.',
  },
  calabaza: {
    descripcion: 'Armadura que se pone encima de otra planta y la protege.',
    almanaque: 'Abraza a sus amigas tan fuerte que ni los zombis las pueden separar.',
  },
  magnetoseta: {
    descripcion: 'Les quita a los zombis sus objetos de metal. Duerme de día.',
    almanaque: 'Colecciona baldes, cascos y escaleras. Tiene el cuarto hecho un desorden.',
  },
  coltapulta: {
    descripcion: 'Lanza coles por encima de obstáculos y escudos.',
    almanaque: 'Sueña con preparar la ensalada perfecta. Por ahora, solo tira coles.',
  },
  // --- Tejado
  maceta: {
    descripcion: 'Matera para sembrar en el tejado (o en el agua).',
    almanaque: 'No dispara, no explota, no habla. Pero sin ella el tejado sería un desierto de tejas.',
  },
  lanzamaiz: {
    descripcion: 'Lanza granos de maíz y a veces mantequilla que deja quieto al zombi.',
    almanaque: 'Su receta secreta es la mantequilla. No es secreta: la tira a la cara.',
  },
  cafe: {
    descripcion: 'Despierta a una seta dormida.',
    almanaque: 'Se toma su propio tinto. Por eso nunca duerme.',
  },
  ajo: {
    descripcion: 'El zombi que lo muerde se cambia de fila.',
    almanaque: 'Huele tan fuerte que hasta los zombis tienen un límite.',
  },
  paraplanta: {
    descripcion: 'Protege a sus vecinas de lo que cae del cielo.',
    almanaque: 'Siempre anda preparada para el aguacero. Hasta en verano. Sobre todo en verano.',
  },
  margarita: {
    descripcion: 'Produce monedas.',
    almanaque: 'No pelea. Ella cree en el ahorro.',
  },
  melonpulta: {
    descripcion: 'Lanza melones pesados que también golpean a los zombis cercanos.',
    almanaque: 'Le encanta compartir. Por eso sus melones salpican a todo el mundo.',
  },
  // --- Tienda de Dave
  guisantralladora: {
    descripcion: 'Mejora de la Repetidora: dispara cuatro guisantes por vez.',
    almanaque: 'Llegó tarde a la clase de calma y nunca la recuperó.',
  },
  birasol: {
    descripcion: 'Mejora del Girasol: da el doble de sol.',
    almanaque: 'Dos caras y una sola idea: más sol para todos.',
  },
  gasoseta: {
    descripcion: 'Mejora de la Humoseta: echa vapor en todas las casillas de alrededor. Duerme de día.',
    almanaque: 'Ya no le cabe el humo en una sola dirección.',
  },
  rabodegato: {
    descripcion: 'Mejora acuática: dispara espinas a cualquier zombi del patio, incluso a los voladores.',
    almanaque: 'Planta de agua con alma de gato: no le hace caso a nadie y le pega a todo.',
  },
  melonhelada: {
    descripcion: 'Mejora de la Melonpulta: melones helados que hacen lentos a todos los cercanos.',
    almanaque: 'Es la Melonpulta, pero después de pasar un fin de semana en el páramo.',
  },
  magnetodorada: {
    descripcion: 'Mejora de la Magnetoseta: atrae las monedas del jardín.',
    almanaque: 'No sirve para pelear, pero tu billetera la adora.',
  },
  pinchorroca: {
    descripcion: 'Mejora de la Pinchohierba: más dura y pincha más fuerte.',
    almanaque: 'Antes era hierba. Ahora es roca. Fue al gimnasio.',
  },
  mazorcanon: {
    descripcion: 'Mejora de dos Lanzamaíz: dispara una mazorca gigante donde la apuntes.',
    almanaque: 'Dos Lanzamaíz se unieron por una causa común: explotar cosas lejos.',
  },
  imitadora: {
    descripcion: 'Se convierte en una copia de otra planta.',
    almanaque: 'Nadie sabe cómo es ella de verdad. Ni ella.',
  },
  // --- Río (acto 2)
  bocadedragon: {
    descripcion: 'Echa fuego de cerca a su fila y a las dos de al lado.',
    almanaque: 'Le prometieron que sería un dragón. Salió flor. Igual echa fuego, y eso es lo que importa.',
  },
  frijuelle: {
    descripcion: 'Cuando un zombi se le acerca, lo bota hacia atrás o al agua.',
    almanaque: 'Tiene un resorte en el corazón. Literal.',
  },
  cococanon: {
    descripcion: 'Se toca para disparar una bala de coco que explota en área.',
    almanaque: 'Paciente como una palmera, explosiva como un coco que se cae.',
  },
  // --- Vías (acto 2)
  frijol: {
    descripcion: 'Si un zombi se lo come, suelta un gas que atonta a los zombis de atrás.',
    almanaque: 'Sí, es justo lo que estás pensando. Mejor no preguntes.',
  },
  vaina: {
    descripcion: 'Siembra otra Vaina encima para sumarle una cabeza, hasta cinco.',
    almanaque: 'Empezó sola y ahora es una familia. Discuten todas las noches por la comida.',
  },
  juncoelectrico: {
    descripcion: 'Lanza rayos que saltan de un zombi a otro.',
    almanaque: 'Es delgadito, pero tiene más energía que un poste de luz.',
  },
  // --- Desierto (acto 2)
  bumeran: {
    descripcion: 'Lanza bumeranes que golpean hasta tres zombis, a la ida y a la vuelta.',
    almanaque: 'Todo lo que tira vuelve. Hasta los chismes.',
  },
  lechugaiceberg: {
    descripcion: 'Gratis: congela al zombi que la pisa y le apaga la antorcha.',
    almanaque: 'Es la más fresca del jardín. Y lo sabe.',
  },
  bonkchoi: {
    descripcion: 'Da puñetazos rápidos a los zombis que tenga cerca, adelante o atrás.',
    almanaque: 'Entrena todos los días. Su sueño es pelear contra un Zombistein. No le den ideas.',
  },
  // --- Páramo (acto 2)
  papacaliente: {
    descripcion: 'Gratis: descongela la planta o la casilla donde se pone.',
    almanaque: 'Siempre está calientica. En el páramo, todos quieren sentarse a su lado.',
  },
  frailejon: {
    descripcion: 'Nunca se congela y protege del frío a las plantas que tiene alrededor.',
    almanaque: 'La abuela del páramo: peluda, paciente y tibia. Cuida el agua y a quien se le arrime.',
  },
  lanzachiles: {
    descripcion: 'Lanza chiles que estallan en área y calientan a las plantas vecinas.',
    almanaque: 'Si el frío la llama, ella le contesta con picante.',
  },
  guardacelga: {
    descripcion: 'Barrera que empuja hacia atrás a los zombis que la muerden.',
    almanaque: 'No deja pasar a nadie sin permiso. Y no da permisos.',
  },
};
