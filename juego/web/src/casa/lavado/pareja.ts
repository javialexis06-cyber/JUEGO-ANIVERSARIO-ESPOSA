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
  cartas: {
    oroBrillante: {
      nombre: 'La villa de Transformice',
      frase: '«Estás como necesitada, así que ten.»',
    },
    certero: {
      nombre: 'Matemáticas y filosofía',
      frase: '«La filosofía no sé. El filósofo, tal vez.»',
    },
    silbato: {
      nombre: 'Te busqué por todos lados',
      frase: 'Ella lo buscó por todo el juego… ¿y él de verdad la buscaba?',
    },
    comienzo: {
      nombre: 'El 25 de octubre',
      frase: '¿Treinta días o cuarenta? Ahí empezó todo.',
    },
    maraton: {
      nombre: 'Videollamadas de 24 horas',
      frase: '¿Casi completaron las 24 horas o las completaron?',
    },
    dobleTurno: {
      nombre: 'Compañeros de estudio',
      frase: 'Las tareas de artística contra «casi todas» las de ella.',
      efecto: 'Cada arma tiene 25 % de probabilidad de dispararse dos veces seguidas, como haciendo la tarea en pareja.',
    },
    curitaMagica: {
      nombre: 'Psicología',
      frase: '¿Insistente o persistente? Él la convenció.',
    },
    relojQuieto: {
      nombre: 'La primera vez que nos vimos',
      frase: '«Eras perfecta.» —«¿Era?»',
    },
    ruedaFortuna: {
      nombre: 'La meta de diciembre',
      frase: 'Directora de Yanbal, justo antes de Cartagena.',
    },
    solPlaya: {
      nombre: 'Cartagena',
      frase: 'Ella en una banca del aeropuerto, él en un hotel cinco estrellas. La moto acuática y el castillo.',
      efecto: 'Las velitas explotan al romperse y uno de cada diez mugrosos revienta como el sol de Cartagena.',
    },
    lucesFeria: {
      nombre: 'Las luces de diciembre',
      frase: '¿Las luces de Medellín o los ojos de ella?',
    },
    viajeLargo: {
      nombre: 'De Sopetrán a Bucaramanga',
      frase: '¿Ocho horas o nueve? Somos el complemento.',
    },
    fiestaDisfraces: {
      nombre: 'Halloween elegante',
      frase: '«Me derrite.» —«Dímelo otra vez.»',
    },
    coronaHierro: {
      nombre: 'Un cumpleaños de reina',
      frase: 'El restaurante de súper lujo… ¿y quién pagó?',
    },
    estrellas: {
      nombre: 'El planetario',
      frase: 'Parque Explora. ¿Quién miraba a quién?',
    },
    conLoJusto: {
      nombre: 'Mi hogar eres tú',
      frase: '«Tú eres mi pilar.»',
    },
    diamante: {
      nombre: 'La propuesta',
      frase: '¿Aretes, una cadena… o el anillo? «¡Lloré lo justo!»',
    },
    reboteSinFin: {
      nombre: 'Para siempre',
      frase: '¿Katherine o Lexy Katherine? Los labios, la sonrisa y el final de Disney.',
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
    sobrevivir5: { premio: 'Disfraces: Perro lanudo y La mejor guerrera de Dios · Carta «El 25 de octubre»' },
    eliminar1000: { premio: 'Disfraces: Dentista del barrio y Bata y turbante · Carta «Matemáticas y filosofía»' },
    nivel20: { premio: 'Disfraces: Súper Jabón y Directora Yanbal · Carta «Compañeros de estudio»' },
    evolucionar: { premio: 'Disfraces: Leñador del champú y Princesa del spa · Carta «Las luces de diciembre»' },
    cofres5: { premio: 'Disfraces: Bombero de la ducha y Sirena de la bañera · Carta «La villa de Transformice»' },
    velitas50: { premio: 'Disfraces: Barbero de vueltiao y Estilista del secador · Carta «Cartagena»' },
    sobrevivir10: { premio: 'Arma: Patico morado · Carta «Te busqué por todos lados»' },
    cara15: { premio: 'Escenario: El Lavamanos · Carta «De Sopetrán a Bucaramanga»' },
    lavamanos15: { premio: 'Escenario: La Bañera · Carta «Halloween elegante»' },
    ganarCara: { premio: 'Disfraces: Astronauta del retrete y Ranita de la bañera · Modo Apurado · Carta «Para siempre»' },
    ganarLavamanos: { premio: 'Carta «La propuesta»' },
    ganarBanera: { premio: 'Carta «Mi hogar eres tú»' },
    espinillon: { premio: 'Carta «La primera vez que nos vimos»' },
    nivel40: { premio: 'Pasiva: Espejo roto · Carta «La meta de diciembre»' },
    eliminar10000: { premio: 'Arma: Colonia · Carta «El planetario»' },
    evoluciones3: { premio: 'Arma: Toallita desmaquillante · Carta «Un cumpleaños de reina»' },
    arepas20: { premio: 'Pasiva: Curita de corazón · Carta «Psicología»' },
    veinticuatro: { premio: 'Carta «Videollamadas de 24 horas»', nombre: 'Videollamada eterna' },
  },
  enemigos: {
    pulga: 'Chiquita y brincona. (No confundir con la pulga aventurera.)',
    reinaCaspa: 'Llega nevando. Guarda una carta de amor perdida.',
  },
  avisos: [
    [/cartas mágicas/g, 'cartas de amor'],
    [/carta mágica/g, 'carta de amor'],
    ['✨ ¡Todos para acá!', '💞 ¡Te busqué por todos lados!'],
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
