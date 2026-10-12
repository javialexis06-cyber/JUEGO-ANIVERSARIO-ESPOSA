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
    leyendoCarta: string; iconoPareja: string; tituloAventuras: string;
  };
  /** Las aventuras de «la protagonista» contadas por capítulos (las reglas de cada capítulo, en `aventuras.ts`). */
  aventuras: Record<string, { titulo: string; desc: string; capitulos: Record<string, { titulo: string; antes: string; despues: string }> }>;
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
    // Las cartas de la noche (fase 4): cartas de amor sin historia, inventadas (se cambian si Javier cuenta más)
    nocheArepa: {
      nombre: 'Desayuno en la cama',
      frase: 'Si pudiera, todos los días te llevaría el desayuno a la cama, con arepita y todo.',
    },
    nocheBolero: {
      nombre: 'La misma luna',
      frase: 'Cada vez que veo la luna me acuerdo de que la estamos mirando los dos.',
    },
    nocheBorde: {
      nombre: 'Hasta el fin del mundo',
      frase: 'Si me toca caminar hasta el borde del mundo para llegar a ti, voy al doble.',
    },
    nocheFuturo: {
      nombre: 'Lo que viene',
      frase: 'Lo mejor no ya pasó: lo mejor está llegando, y llega contigo.',
    },
    nocheCristal: {
      nombre: 'Lágrimas de risa',
      frase: 'Las únicas lágrimas que te deseo son las de reírte tanto conmigo.',
    },
    nocheAzabache: {
      nombre: 'Escudo de besos',
      frase: 'Si algo te golpea, que salga volando con un montón de besos encima.',
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
    iconoPareja: '💞', tituloAventuras: 'Las aventuras de la protagonista',
  },
  // Las tres aventuras que contó Javier para volverlas capítulos: el carro andando, el bus a Barranquilla y los vuelos
  // cancelados a Cartagena. Lo que él contó es lo de verdad; lo demás (los capítulos de en medio, los chistes) está
  // INVENTADO alrededor y se cambia cuando él cuente más. Del bus no va el detalle de cómo terminó (el repositorio es
  // público): solo que desde ese día ella no se vuelve a subir a uno, y eso se cuenta con ternura, sin chistes.
  // Cartagena ya es un recuerdo de Cien Puertas: aquí la aventura termina cuando por fin despega el avión.
  aventuras: {
    a1: {
      titulo: '¡Pare, que me bajo!',
      desc: 'La vez que la pulga aventurera se bajó de un carro… con el carro andando.',
      capitulos: {
        a1c1: {
          titulo: 'Arrancó el carro',
          antes: 'Todo iba normal hasta que el carro arrancó y la pulga aventurera tenía que bajarse ya. El piso empezó a correr solito.',
          despues: 'Primera lección de la aventura: cuando el carro arranca, el mundo entero se mueve. Y los mugrosos también.',
        },
        a1c2: {
          titulo: 'Con el reloj encima',
          antes: 'El carro coge velocidad y no hay tiempo de pensar: todo va al doble. Y por la carretera viene bajando un pato inflable gigante (no pregunten).',
          despues: 'Pato desinflado. Ahora sí: hay que decidirse.',
        },
        a1c3: {
          titulo: '¡El salto!',
          antes: 'Las personas normales esperan a que el carro pare para bajarse. Ella no es una persona normal: es la protagonista.',
          despues: '¡Saltó! Por un segundo todo quedó en cámara lenta, como en las películas de acción.',
        },
        a1c4: {
          titulo: 'Aterrizaje de guerrera',
          antes: 'Abajo la espera todo el barro de la carretera, y el Barro Negro no perdona a nadie que caiga en su terreno.',
          despues: 'Y se paró como si nada, sacudiéndose el polvo. Por eso es la mejor guerrera de Dios: le pasa de todo y siempre se vuelve a parar. (Él todavía no se recupera del susto.)',
        },
      },
    },
    a2: {
      titulo: 'El bus a Barranquilla',
      desc: 'Un viaje en bus hasta la costa. El último viaje en bus de su vida.',
      capitulos: {
        a2c1: {
          titulo: 'La terminal',
          antes: 'Maleta lista, tiquete en la mano y la terminal llena de filas. La protagonista se va para Barranquilla en bus.',
          despues: 'Tiquete validado, puesto de ventana y bolsita de mecato. ¡Arrancamos!',
        },
        a2c2: {
          titulo: 'Calor de carretera',
          antes: 'Rumbo a la costa el calor sube y sube: hasta el espejo del bus se empaña. Lo caliente pega más duro.',
          despues: 'Ventana abierta, pelo al viento y un vallenato a todo volumen. Ya falta menos… creo.',
        },
        a2c3: {
          titulo: 'Huecos y más huecos',
          antes: 'La carretera tiene más huecos que un queso: cada minuto el bus brinca y pasa algo distinto.',
          despues: 'Ni un hueco más. Por la ventana ya se ve la costa.',
        },
        a2c4: {
          titulo: 'La guerrera llega',
          antes: 'El último tramo fue el más difícil de todo el viaje. Lo que pasó ahí se queda entre los dos; lo que importa es que ella aguanta.',
          despues: 'Llegó, porque ella siempre llega. Ese viaje terminó tan mal que desde ese día no se vuelve a subir a un bus, y está bien: nadie se lo va a pedir. Cuando viaje, él va a ir al lado.',
        },
      },
    },
    a3: {
      titulo: 'Vuelos cancelados',
      desc: 'Iban para Cartagena. El avión tenía otros planes.',
      capitulos: {
        a3c1: {
          titulo: 'CANCELADO',
          antes: 'Como en bus ya no, esta vez tocaba avión. Maletas, pasabordo, todo listo… y en la pantalla, en letras rojas: CANCELADO.',
          despues: 'Nadie sabe cuándo sale el próximo vuelo. Toca hacer fila.',
        },
        a3c2: {
          titulo: 'La fila de los reclamos',
          antes: 'Una fila larguísima para reclamar, y siempre hay uno que se cuela: Don Frasco, con un champú de más de cien mililitros.',
          despues: 'Por fin la atendieron. Respuesta oficial: «mañana, a primera hora». Mientras tanto, a esperar.',
        },
        a3c3: {
          titulo: 'Puerta 3… no, puerta 12',
          antes: 'Cambiaron la puerta de embarque tres veces. El aeropuerto se volvió un laberinto de cortinas y pasillos.',
          despues: 'Puerta encontrada. ¿Y ahora dónde se duerme aquí?',
        },
        a3c4: {
          titulo: 'La noche en la silla',
          antes: 'A él le tocó dormir en un hotel; a ella, en una silla de metal del aeropuerto. Con sueño todo se ve empañado, y el reloj no avanza.',
          despues: 'Amaneció. Él durmió en cama con almohada; ella, abrazada a la maleta. Todavía se lo recuerda cada vez que puede (y tiene toda la razón).',
        },
        a3c5: {
          titulo: '¡Abordando!',
          antes: 'Por fin llaman a abordar… pero antes, el control de seguridad: todos los jefes de la fila quieren pasar primero, y la Reina de las Cremas no suelta sus frascos.',
          despues: '¡Despegaron! Lo que pasó en Cartagena es otra historia, y está detrás de otra puerta.',
        },
      },
    },
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
