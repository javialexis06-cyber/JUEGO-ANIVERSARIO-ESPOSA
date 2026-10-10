// LO PERSONAL de «Lavarse la cara»: los nombres y las frases de los recuerdos en las cartas de amor, los apodos de
// los disfraces, los chistes de la pareja y los gritos cariñosos. Los datos del juego (cartas.ts, disfraces.ts,
// progreso.ts…) traen la versión para todos, y `textos.ts` pone esto encima cuando juegan Javier y Laura sin amigos.
// La versión para amigos (`vite build --mode amigos`) cambia este archivo por `src/amigos/sin_pareja/lavado.ts`
// (vacío): así ni un texto de aquí queda adentro de esa APK. Lo personal nuevo del lavado va AQUÍ, nunca en los datos.
import type { DefDisfraz } from './disfraces';
import type { DefLogro } from './progreso';
import type { IdCarta } from './tipos';

export interface TextosPareja {
  cartas: Record<IdCarta, { nombre: string; frase: string; efecto?: string }>;
  disfraces: Record<string, Partial<Pick<DefDisfraz, 'nombre' | 'desc' | 'especial' | 'grito' | 'alCrecer'>>>;
  logros: Record<string, Partial<Pick<DefLogro, 'nombre' | 'premio'>>>;
  enemigos: Record<string, string>;
  /** Lo que dicen los avisos del juego: [lo de todos, lo de la pareja]. */
  avisos: [string | RegExp, string][];
  frases: {
    levantaAMi: string; levanta: string; revive: string; tituloCartas: string; sinCarta: string; iconoCarta: string; cartaPerdida: string;
    leyendoCarta: string; iconoPareja: string;
  };
  /** Nombres de antes (partidas guardadas antes del cambio de nombres de las cartas y los disfraces). */
  cartasViejas: Record<string, IdCarta>;
  disfracesViejos: Record<string, string>;
}

export const PAREJA: TextosPareja | null = {
  // Las cartas de amor: tres cuentan aventuras de «la protagonista» (con humor, como le gustan a ella) y las demás son
  // cartas de amor de verdad, cada una con lo que hace su poder. Los recuerdos grandes son de Cien Puertas y no se
  // repiten aquí (ver «Quién cuenta qué» en docs/la-pareja.md).
  cartas: {
    oroBrillante: {
      nombre: 'El iPhone más barato del mundo',
      frase: 'Le salió carísimo… pero esta alcancía sí es de oro de verdad.',
    },
    certero: {
      nombre: 'Tiro al corazón',
      frase: 'Apuntaste una sola vez y no fallaste.',
    },
    silbato: {
      nombre: 'Ven para acá',
      frase: 'Con un silbidito tuyo dejo todo lo que esté haciendo y voy corriendo.',
    },
    comienzo: {
      nombre: 'Buenos comienzos',
      frase: 'Los días que empiezan contigo arrancan con ventaja.',
    },
    maraton: {
      nombre: 'Para largo',
      frase: 'Lo nuestro no es una carrera de cien metros: es una maratón, y la quiero correr toda contigo.',
    },
    dobleTurno: {
      nombre: 'Dos de todo',
      frase: 'Dos cepillos, dos toallas, dos tazas… y un solo corazón para los dos.',
      efecto: 'Cada arma tiene 25 % de probabilidad de dispararse dos veces seguidas, como cuando los dos hacen lo mismo al tiempo.',
    },
    curitaMagica: {
      nombre: 'Curita de besos',
      frase: 'No hay raspón que aguante un beso encima.',
    },
    relojQuieto: {
      nombre: 'Un ratico más',
      frase: 'Si pudiera parar el reloj, lo pararía en un abrazo tuyo.',
    },
    ruedaFortuna: {
      nombre: 'La suerte',
      frase: 'De todas las vueltas que dio la vida, la mejor fue la que me dejó contigo.',
    },
    solPlaya: {
      nombre: 'Olas de diez metros',
      frase: 'Ella se metió al mar el día de las olas gigantes. El mar fue el que se asustó.',
      efecto: 'Las velitas explotan al romperse y uno de cada diez mugrosos revienta como una ola gigante.',
    },
    lucesFeria: {
      nombre: 'Lucecitas',
      frase: 'Donde tú llegas se prenden las luces, como en una feria de pueblo.',
    },
    viajeLargo: {
      nombre: 'Del carro andando',
      frase: 'Hay quien espera a que el carro pare para bajarse. La pulga aventurera no.',
    },
    fiestaDisfraces: {
      nombre: 'Con cualquier disfraz',
      frase: 'Te reconocería con cualquier disfraz: por la risa.',
    },
    coronaHierro: {
      nombre: 'Corona de guerrera',
      frase: 'Para la que nunca se rinde: el mugroso que se mete con ella sale lavado.',
    },
    estrellas: {
      nombre: 'Mi estrella del norte',
      frase: 'Si un día me pierdo, sigo tu brillo y llego a casa.',
    },
    conLoJusto: {
      nombre: 'Con poquito',
      frase: 'Con poquito somos felices: un sofá, una cobija y tú.',
    },
    diamante: {
      nombre: 'Lo que no se rompe',
      frase: 'Hay cosas que no se rompen ni a golpes. Lo que siento por ti es una de ellas.',
    },
    reboteSinFin: {
      nombre: 'Ida y vuelta',
      frase: 'Todo el cariño que me das me rebota en el pecho y te vuelve multiplicado.',
    },
    // (cartas de amor sin historia, inventadas: se cambian si Javier cuenta más)
    sinGotitas: {
      nombre: 'Sin llevar la cuenta',
      frase: 'Contigo no llevo la cuenta de nada: ni de los días, ni de los besos, ni de las gotitas.',
    },
    despierto: {
      nombre: 'Más fuerte que antes',
      frase: 'Cada vez que me caigo, tú me ayudas a pararme más fuerte que antes.',
    },
    nocheLoca: {
      nombre: 'Mi desorden favorito',
      frase: 'Contigo el tiempo va rápido y despacio a la vez, y así me encanta.',
    },
    terquedad: {
      nombre: 'Tercos los dos',
      frase: 'Testarudos como nadie: por eso nada nos tumba.',
    },
  },
  disfraces: {
    // (el panda es como le dice ella)
    el_panda: {
      nombre: 'Panda en pijama', desc: 'Así le dice ella. Enterizo de panda, pantuflas de garra y la toalla mojada al hombro, listo para el toallazo.',
      grito: '🐼 ¡Toallazo de panda! Cada 10 niveles pega más duro', alCrecer: '🐼 ¡El panda se puso bravo! +10 % de daño',
    },
    el_perro: {
      nombre: 'Perro lanudo', desc: 'Tan lanudo que la espuma se le enreda en el pelo. Recoge todo de lejos (pero es un poquito más frágil).',
      grito: '🐶 Perro lanudo: todo se le pega al pelo (imán +25 %)', alCrecer: '🐶 El pelo lanudo jala más: imán +10 %',
    },
    el_astronauta: { desc: 'El mismo que salió volando del baño después del picante. Ahora con casco y un bombillo con corriente.' },
    el_barbero: { desc: 'Sombrero vueltiao, chaleco y bigote. Depila cejas con hilo como un profesional… (peinar a su esposa ya es otra historia).' },
    ella_pulga: {
      nombre: 'Pulga aventurera', desc: 'Así le dice él. Enterizo de pulga, patitas de más y una varita que hace burbujas. Aprende rapidísimo.',
      grito: '🐜 Pulga aventurera: aprende rapidísimo (+10 % de experiencia)', alCrecer: '🐜 ¡Pulga pila! +5 % de experiencia',
    },
    ella_guerrera: {
      nombre: 'La mejor guerrera de Dios', desc: 'Le ha pasado de todo y siempre se vuelve a parar. Capa, corona y un escudo de corazón.',
      grito: '👑 La mejor guerrera de Dios: si cae, se vuelve a parar',
    },
    ella_diva: {
      nombre: 'Directora Yanbal', desc: 'Vestido negro, gafas de sol y el perfume de la marca. Llegó a directora y no la para nadie.',
      grito: '💄 Directora Yanbal: cada nivel, más poder', alCrecer: '💄 ¡Ascenso! +10 % de daño',
    },
    ella_turbante: { desc: 'Recién bañada, con el turbante de toalla y las pantuflas de conejo. Se va a demorar horas arreglándose.' },
  },
  logros: {
    sobrevivir5: { premio: 'Disfraces: Perro lanudo y La mejor guerrera de Dios · Carta «Buenos comienzos»' },
    eliminar1000: { premio: 'Disfraces: Dentista del barrio y Bata y turbante · Carta «Tiro al corazón»' },
    nivel20: { premio: 'Disfraces: Súper Jabón y Directora Yanbal · Carta «Dos de todo»' },
    evolucionar: { premio: 'Disfraces: Leñador del champú y Princesa del spa · Carta «Lucecitas»' },
    cofres5: { premio: 'Disfraces: Bombero de la ducha y Sirena de la bañera · Carta «El iPhone más barato del mundo»' },
    velitas50: { premio: 'Disfraces: Barbero de vueltiao y Estilista del secador · Carta «Olas de diez metros»' },
    sobrevivir10: { premio: 'Arma: Patico morado · Carta «Ven para acá»' },
    cara15: { premio: 'Escenario: El Lavamanos · Carta «Del carro andando»' },
    lavamanos15: { premio: 'Escenario: La Bañera · Carta «Con cualquier disfraz»' },
    ganarCara: { premio: 'Disfraces: Astronauta del retrete y Ranita de la bañera · Modo Apurado · Carta «Ida y vuelta»' },
    ganarLavamanos: { premio: 'Carta «Lo que no se rompe»' },
    ganarBanera: { premio: 'Carta «Con poquito»' },
    espinillon: { premio: 'Carta «Un ratico más»' },
    nivel40: { premio: 'Pasiva: Espejo roto · Carta «La suerte»' },
    eliminar10000: { premio: 'Arma: Colonia · Carta «Mi estrella del norte»' },
    evoluciones3: { premio: 'Arma: Toallita desmaquillante · Carta «Corona de guerrera»' },
    arepas20: { premio: 'Pasiva: Curita de corazón · Carta «Curita de besos»' },
    veinticuatro: { premio: 'Carta «Para largo»', nombre: 'Maratón de cariño' },
    eliminar100000: { premio: 'Carta «Sin llevar la cuenta»' },
    jefes25: { premio: 'Carta «Más fuerte que antes»' },
    apurado20: { premio: 'Carta «Mi desorden favorito»' },
    evoluciones20: { premio: 'Carta «Tercos los dos»' },
  },
  enemigos: {
    pulga: 'Chiquita y brincona. (No confundir con la pulga aventurera.)',
    reinaCaspa: 'Llega nevando. Guarda una carta de amor perdida.',
  },
  avisos: [
    [/cartas mágicas/g, 'cartas de amor'],
    [/carta mágica/g, 'carta de amor'],
    ['✨ ¡Todos para acá!', '💞 ¡Ven para acá, mi amor!'],
    [/🃏/g, '💌'],
  ],
  frases: {
    levantaAMi: '¡Me levantaste! 💖', levanta: '¡Levántate, mi amor! 💖', revive: '¡A seguir! Te volviste a parar 💖', tituloCartas: 'Cartas de amor',
    sinCarta: 'Sin carta de amor', iconoCarta: '💌', cartaPerdida: '💌 Una carta de amor perdida', leyendoCarta: 'leyendo una carta de amor',
    iconoPareja: '💞',
  },
  cartasViejas: {
    transformice: 'oroBrillante',
    matematicas: 'certero',
    buscarte: 'silbato',
    octubre: 'comienzo',
    videollamadas: 'maraton',
    estudio: 'dobleTurno',
    psicologia: 'curitaMagica',
    primeraVez: 'relojQuieto',
    metaDiciembre: 'ruedaFortuna',
    cartagena: 'solPlaya',
    lucesMedellin: 'lucesFeria',
    sopetran: 'viajeLargo',
    halloween: 'fiestaDisfraces',
    reina: 'coronaHierro',
    planetario: 'estrellas',
    hogar: 'conLoJusto',
    propuesta: 'diamante',
    paraSiempre: 'reboteSinFin',
  },
  disfracesViejos: { ella_yanbal: 'ella_diva' },
};
