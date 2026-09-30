// Ir al baño: cada visita arma su propia rutina con un banco grande de frases (así nunca dice lo mismo), y de vez en
// cuando (10 %) pasa algo gracioso: se tapa el inodoro, entra un ratón o cucarachas, se acaba el papel, se va la
// luz… Todo sale de una semilla (el momento en que se sentó), así los dos celulares ven exactamente lo mismo.
import type { Cara } from '../personaje';
import type { Rol } from './modelo';

/** Generador con semilla (mulberry32): mismos números en los dos celulares. */
export function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------------------------- Frases
/** Al sentarse. */
const LLEGA = [
  'Bueno… aquí vamos.',
  'Mi lugar favorito para pensar.',
  'Oficina abierta. 🚽',
  'Por fin, un momento de paz.',
  'Nadie me moleste, estoy en reunión.',
  'Modo concentración: activado.',
  '¿Y si me quedo a vivir aquí?',
  'El trono me esperaba.',
  'Sesión número mil de hoy…',
  'Esto va a ser rápido. (No va a ser rápido)',
  'Silencio, que aquí se trabaja.',
  'A lo que vinimos.',
  'Mmm…',
  'Hora de la meditación.',
  'Bienvenido a mi despacho.',
  'Ahhh, qué frío el asiento.',
  'Espero que haya papel…',
  'Mi momento sagrado del día.',
  'Tranquilidad total.',
  'Uno, dos, tres… ¡acción!',
];
/** El esfuerzo. */
const PUJA = [
  'Vamos… tú puedes…',
  '¡Ugh!',
  'Fuerza, fuerza…',
  'Respira… 1, 2, 3…',
  'Esto es trabajo de equipo, estómago.',
  'Coopera, por favor.',
  'Un poquito más…',
  'Esto es más difícil que el súper en hora pico.',
  '¡Hmmmmf!',
  'Ay, Diosito, dame fuerzas.',
  'No es fácil ser yo.',
  'Venga, que no tengo todo el día.',
  'Esto merece un trofeo.',
  'Casi, casi…',
  '¿Por qué me haces esto, estómago?',
  'Concéntrate… concéntrate…',
  'Estoy dando lo mejor de mí.',
  'Esfuerzo nivel olímpico.',
  '¡Último esfuerzo!',
  'Tengo fe.',
  'Esto es un parto…',
  'Hoy no es mi día.',
  'Paciencia, mucha paciencia.',
  'Pujando con amor.',
  'Operación en curso…',
];
/** Pensamientos profundos del inodoro. */
const PIENSA = [
  '¿Los peces tienen sed?',
  'Si el tomate es fruta… ¿el kétchup es mermelada?',
  '¿Por qué se le dice «edificio» si ya está edificado?',
  '¿Quién fue el primero en ordeñar una vaca? ¿Y por qué?',
  'Si me lavo la cara con jabón… ¿el jabón se lava solo?',
  '¿Las jirafas tienen tortícolis?',
  'Si el agua moja… ¿el agua está mojada?',
  '¿Qué pensarán las hormigas de nosotros?',
  '¿Y si la luna es un queso de verdad?',
  'Nadie sabe cómo es el color que ve el otro…',
  '¿Por qué «separado» se escribe todo junto?',
  'Los pingüinos tienen rodillas. Pensé en eso.',
  '¿Los perros saben que son perros?',
  'Si ronco y no me oigo… ¿ronco?',
  '¿A dónde van las medias perdidas?',
  'Mañana sí hago ejercicio. Seguro.',
  '¿Y si mi vida fuera una telenovela?',
  'Ese mensaje de hace 5 años… qué oso.',
  '¿Apagué la estufa? … Sí. Creo.',
  '¿Por qué el pan tostado siempre cae del lado de la mantequilla?',
  'Tengo que comprar papel. Anotado mentalmente. Olvidado.',
  '¿Y si le escribo una canción al inodoro?',
  'La vida es como un rollo de papel: entre más cerca del final, más rápido se acaba.',
  '¿Por qué los aviones no tienen paracaídas para todos?',
  'Si fuera superhéroe|superheroína, mi poder sería dormir.',
  'Los dinosaurios nunca vieron un inodoro. Pobrecitos.',
  '¿Existirá un inodoro de oro? Lo quiero.',
  'Debería llamar a mi mamá.',
  'Hoy fui productivo|productiva. Bueno, más o menos.',
  '¿Los gatos piensan en nosotros como gatos grandes?',
  'Si digo «nunca», ¿ya lo dije?',
  '¿El número 0 es par? … Sí. Creo.',
  'Mis plantas me juzgan, lo sé.',
  'Si el sol es una estrella, ¿soy astronauta de día?',
  '¿Qué hace un pez cuando tiene frío? Se pone una bufanda de alga.',
  'En este momento hay alguien en la luna. No, no hay nadie. Qué triste.',
  'Si las abejas hacen miel, ¿las avispas qué hacen? Problemas.',
  '¿Por qué los botones del control remoto siempre son demasiados?',
  'Tres cosas buenas de hoy: comí, dormí y aquí estoy.',
  '¿Y si le pongo nombre al inodoro? Se llamará Gustavo.',
];
/** Mientras tanto se entretiene. */
const OCIO = [
  'Déjame ver el celular… 1 %… NOOO.',
  'Voy a leer la etiqueta del champú. Otra vez.',
  'Ya me sé de memoria los ingredientes del jabón.',
  'Tres memes y me paro. Bueno, cinco.',
  '¿Cuántas baldosas hay? 1, 2, 3…',
  'Tarareando… 🎵',
  'Me acordé de un chiste y me estoy riendo solo|sola.',
  'Voy a planear las vacaciones de los dos.',
  'Mirando videos de perritos. Mucho.',
  '¿Y si reorganizo el baño? … Nah.',
  'Contando del 100 para atrás…',
  'Practicando mi discurso de los Óscar.',
  'Jugando a encontrarle caras a las baldosas.',
  'Esa mancha parece un conejo.',
  'Leyendo las noticias. Todo mal, como siempre.',
  'Mandando stickers al grupo de la familia.',
  'Viendo fotos de los dos. Qué bonitos somos.',
  'Esta pared necesita otro color.',
  'Le estoy contando mis problemas al patito de hule.',
  '¡Ya pasé de nivel en el celular!',
];
/** Algo raro pasó. */
const SORPRESA = [
  '¡¿Qué fue eso?!',
  '¡Uy!',
  'Eso… no sonó normal.',
  '¡¿Quién dijo eso?!',
  'Mejor no pregunto.',
  '¡Ay, mi madre!',
  'Eso fue… inesperado.',
  '¡Wow!',
  'Nadie escuchó eso. Nadie.',
  '¡Diosito!',
  '¿Eso fui yo?',
  'Ok… ok… todo bien.',
  '¡Cuidado abajo!',
  'Houston, tenemos un problema.',
  '¡Uf, casi!',
];
/** Quejas. */
const QUEJA = [
  '¿Y el papel?',
  'Se me durmió una pierna…',
  'Este asiento está helado.',
  '¿Por qué nadie me avisó que se acabó el jabón?',
  'Otra vez sin señal aquí.',
  'Se me están entumiendo las patas.',
  'Qué calor hace aquí…',
  'La próxima vez traigo cojín.',
  'Alguien dejó la tapa arriba. 😒',
  'Me olvidé el celular afuera. Error de novato.',
  'Aquí no llega el wifi. Vivo en la edad media.',
  'Me pica la nariz y tengo las manos ocupadas.',
  'Este rollo de papel está puesto al revés.',
  'El ambientador huele a «bosque químico».',
  '¿Por qué hay una araña mirándome?',
];
/** Al terminar. */
const VICTORIA = [
  '¡Victoria! 😌',
  'Misión cumplida.',
  'Me siento dos kilos más liviano|liviana.',
  'Ahhh… paz interior.',
  'Eso fue una obra de arte.',
  'Salgo como nuevo|nueva.',
  'Otro día, otra victoria.',
  'Que alguien me dé una medalla.',
  'Eso estuvo… épico.',
  'Mi estómago y yo volvemos a ser amigos.',
  'Sin tráfico, qué belleza.',
  'Y ahora, a lavarse las manos. 🧼',
  'Descarga completada. ✅',
  'Ligero|Ligera como una pluma.',
  'Una experiencia religiosa.',
  'Gracias, Gustavo. (El inodoro)',
  'Listo. Nadie entre en 10 minutos.',
  '¡Libre!',
  'Qué alivio tan grande.',
  'Cinco estrellas, volvería.',
];
/** Solo de Él o solo de Ella. */
const SUYO: Record<Rol, string[]> = {
  el: [
    'Si me muero aquí, díganle a Ella que la amo.',
    'Nota mental: ese picante no era buena idea.',
    'Aquí sentado soy el rey del mundo.',
    'Estoy pensando en qué le regalo a Ella…',
    '¿Estará Ella pensando en mí? Seguro que sí.',
    'Dicen que los hombres pensamos en nada. Mentira: pienso en comida.',
    'Mi récord son 45 minutos. Hoy lo rompo.',
    'Soy un guerrero. Un guerrero del inodoro.',
    'Cuando salga le doy un beso a Ella.',
    'Dame fuerza, Bucaramanga.',
  ],
  ella: [
    'Ojalá Él no haya visto que me traje el celular.',
    'Nota mental: la leche y yo terminamos.',
    '¿Me veo bonita desde aquí? Obvio sí.',
    '¿Qué le hago de comer a Él hoy?',
    'Si Él me extraña, que espere. Estoy ocupada.',
    'Me merezco un spa después de esto.',
    'Pensando en la ropa que me voy a poner mañana.',
    'Ni se les ocurra tocar la puerta.',
    'Cuando salga le pido a Él un abrazo.',
    'Dame fuerza, Medellín.',
  ],
};

/** Cuántas frases distintas hay en total (para la documentación y las pruebas). */
export const TOTAL_FRASES = [LLEGA, PUJA, PIENSA, OCIO, SORPRESA, QUEJA, VICTORIA, SUYO.el, SUYO.ella].reduce((n, l) => n + l.length, 0);

export interface PasoBano {
  pose: string;
  pose2?: string;
  ritmo?: number;
  dur: number;
  cara: Cara;
  frase: string | null;
  temblor?: number;
  efecto?: 'nota' | 'zzz';
}

const tomar = <T,>(r: () => number, l: T[]) => l[Math.floor(r() * l.length)];

/** Las frases traen las dos formas («liviano|liviana»): se deja la de Él o la de Ella. */
export const conGenero = (rol: Rol, t: string) => t.replace(/(\p{L}+)\|(\p{L}+)/gu, (_, el: string, ella: string) => (rol === 'el' ? el : ella));

/** La rutina en el inodoro: 7 u 8 momentos (llega, puja, piensa, se entretiene, algo raro, se queja, gana). */
export function rutinaInodoro(rol: Rol, semilla: number): PasoBano[] {
  const r = azar(semilla);
  const pensar = () => (r() < 0.25 ? tomar(r, SUYO[rol]) : tomar(r, PIENSA));
  const pasos: PasoBano[] = [
    { pose: 'sentado', dur: 1.6, cara: 'concentrado', frase: tomar(r, LLEGA) },
    { pose: 'comer_sentado_a', dur: 1.4, cara: 'enojado', frase: tomar(r, PUJA) },
    { pose: 'sentado', dur: 1.5, cara: 'aburrido', frase: pensar() },
    { pose: 'comer_sentado_b', dur: 1.4, cara: 'nervioso', frase: tomar(r, PUJA) },
    { pose: 'sentado', dur: 1.3, cara: tomar(r, ['sorprendido', 'nervioso'] as Cara[]), frase: tomar(r, SORPRESA) },
    { pose: 'comer_sentado_a', dur: 1.5, cara: tomar(r, ['aburrido', 'feliz', 'guino'] as Cara[]), frase: tomar(r, OCIO) },
    { pose: 'sentado', dur: 1.4, cara: tomar(r, ['puchero', 'llorando', 'bostezo'] as Cara[]), frase: tomar(r, QUEJA) },
    { pose: 'sentado', dur: 1.2, cara: 'concentrado', frase: pensar() },
    { pose: 'sentado_feliz', dur: 99, cara: tomar(r, ['carcajada', 'feliz', 'presumido'] as Cara[]), frase: tomar(r, VICTORIA) },
  ];
  // No siempre en el mismo orden: el «piensa» y el «ocio» se intercambian a veces, y a veces sobra una queja
  if (r() < 0.5) [pasos[2], pasos[5]] = [{ ...pasos[5], pose: pasos[2].pose }, { ...pasos[2], pose: pasos[5].pose }];
  if (r() < 0.3) pasos.splice(6, 1);
  return pasos.map((q) => ({ ...q, frase: q.frase && conGenero(rol, q.frase) }));
}

// ---------------------------------------------------------------------------------------------- Eventos graciosos
export type IdEventoBano =
  | 'tapado' | 'raton' | 'cucarachas' | 'papel' | 'luz' | 'arana' | 'mosca' | 'concierto' | 'dormido' | 'llamada'
  | 'chorro' | 'piernas' | 'eco' | 'lagartija' | 'puerta' | 'patito' | 'wifi' | 'ambientador' | 'fantasma' | 'perrito';

export interface EventoBano {
  id: IdEventoBano;
  /** Lo que ve la pareja en su celular (con «forma|forma» de Él y de Ella). */
  aviso: (quien: string) => string;
  /** En qué paso pasa (aparece el bicho, se va la luz, suena el celular…). Por defecto el segundo. */
  en?: number;
  /** En qué paso sale corriendo a la bañera (bicho en el piso o agua saliendo). */
  huye?: number;
  /** En qué paso llama a la pareja para que venga a ayudar. */
  llama?: number;
  /** Bicho que aparece en 3D. */
  bicho?: 'raton' | 'cucaracha' | 'arana' | 'mosca' | 'lagartija';
  /** Cuántos bichos. */
  cuantos?: number;
  /** Lo que pasa (pasos con frases), después de unos segundos normales en el inodoro. */
  pasos: (rol: Rol) => PasoBano[];
  /** Lo que dice la pareja cuando llega a ayudar (a quien estaba en el baño). */
  rescate?: string[];
}

const P = (pose: string, dur: number, cara: Cara, frase: string | null, extra: Partial<PasoBano> = {}): PasoBano => ({ pose, dur, cara, frase, ...extra });

export const EVENTOS_BANO: EventoBano[] = [
  {
    id: 'tapado',
    aviso: (q) => `¡${q} tapó el inodoro! 🪠 Te está llamando`,
    huye: 2,
    llama: 3,
    pasos: () => [
      P('sentado_feliz', 1.6, 'feliz', '¡Victoria! Y ahora, a bajar…'),
      P('sentado', 1.4, 'sorprendido', '…¿por qué el agua está subiendo?'),
      P('boca_abierta', 1.4, 'sorprendido', '¡NO, NO, NO, NO!', { temblor: 0.03 }),
      P('boca_abierta', 2.2, 'llorando', '¡AMOOOR! ¡SE TAPÓ! ¡TRAE EL DESTAPADOR!', { temblor: 0.04 }),
      P('brazos_cruzados', 99, 'puchero', 'Yo no fui. Fue el inodoro.'),
    ],
    rescate: ['¡Aquí está el destapador! 🪠', 'Tranquila, esto lo arreglo yo.', 'Plop, plop… ¡listo!'],
  },
  {
    id: 'raton',
    aviso: (q) => `¡Entró un ratón al baño! 🐭 ${q} se subió a la bañera y te está llamando`,
    huye: 2,
    llama: 3,
    bicho: 'raton',
    cuantos: 1,
    pasos: () => [
      P('sentado', 1.5, 'concentrado', 'Mmm…'),
      P('sentado', 1.0, 'sorprendido', '¿Qué es ese ruidito?'),
      P('boca_abierta', 1.4, 'sorprendido', '¡¡UN RATÓN!!', { temblor: 0.05 }),
      P('boca_abierta', 2.4, 'llorando', '¡¡AMOOOR!! ¡VEN YA! ¡HAY UN RATÓN!', { temblor: 0.05 }),
      P('llorar_a', 99, 'llorando', 'De aquí no me bajo hasta que se vaya.', { pose2: 'llorar_b', ritmo: 2, temblor: 0.03 }),
    ],
    rescate: ['¡Fuera, ratón! 🧹', 'Ya se fue, tranquila.', 'Era chiquitico… pero bueno, ya se fue.'],
  },
  {
    id: 'cucarachas',
    aviso: (q) => `¡Cucarachas en el baño! 🪳 ${q} está en la bañera gritando tu nombre`,
    huye: 2,
    llama: 4,
    bicho: 'cucaracha',
    cuantos: 4,
    pasos: () => [
      P('sentado', 1.5, 'aburrido', 'Qué tranquilidad…'),
      P('sentado', 1.0, 'nervioso', '¿Eso se movió?'),
      P('boca_abierta', 1.3, 'sorprendido', '¡¡CUCARACHAS!!', { temblor: 0.06 }),
      P('boca_abierta', 1.6, 'llorando', '¡UNA VUELA! ¡UNA VUELAAA!', { temblor: 0.06 }),
      P('llorar_a', 99, 'llorando', '¡AMOOOR! ¡SÁLVAME!', { pose2: 'llorar_b', ritmo: 2.4, temblor: 0.04 }),
    ],
    rescate: ['¡Chancla voladora! 🩴', 'Pum, pum, pum… ¡listo!', 'Ninguna cucaracha se mete con mi amor.'],
  },
  {
    id: 'papel',
    aviso: (q) => `A ${q} se le acabó el papel 🧻 y te está llamando…`,
    llama: 3,
    pasos: () => [
      P('sentado_feliz', 1.6, 'feliz', '¡Victoria! Ahora el papel…'),
      P('sentado', 1.4, 'sorprendido', '…'),
      P('sentado', 1.4, 'nervioso', 'No. No puede ser.'),
      P('sentado', 2.0, 'puchero', '¿Amor? ¿Mi amor? ¿Me traes papel? 🥺'),
      P('sentado', 99, 'puchero', 'Aquí espero… con dignidad.'),
    ],
    rescate: ['Servicio de papel a domicilio 🧻', 'Aquí tienes, mi amor.', 'Te lo cambio por un beso.'],
  },
  {
    id: 'luz',
    aviso: (q) => `Se fue la luz en el baño y ${q} quedó a oscuras 🔦`,
    llama: 3,
    pasos: () => [
      P('sentado', 1.5, 'concentrado', 'Mmm…'),
      P('sentado', 1.2, 'sorprendido', '¡¿Quién apagó la luz?!'),
      P('boca_abierta', 1.8, 'nervioso', '¿Hola? ¿Hay alguien ahí?', { temblor: 0.02 }),
      P('boca_abierta', 99, 'llorando', '¡Amor! ¡Trae una linterna! No veo nada…', { temblor: 0.03 }),
    ],
    rescate: ['¡Linterna al rescate! 🔦', 'Ya volvió la luz, miedoso|miedosa.'],
  },
  {
    id: 'arana',
    aviso: (q) => `Una araña bajó del techo frente a ${q} 🕷️`,
    bicho: 'arana',
    cuantos: 1,
    pasos: () => [
      P('sentado', 1.5, 'concentrado', 'Aquí, tranquilo|tranquila…'),
      P('sentado', 1.4, 'sorprendido', '…'),
      P('sentado', 1.8, 'nervioso', 'Hola, señora araña. No me mire así.', { temblor: 0.02 }),
      P('sentado', 1.6, 'nervioso', 'Yo no la molesto, usted no me molesta. ¿Trato?'),
      P('sentado_feliz', 99, 'feliz', 'Se fue. Somos amigas ahora.'),
    ],
  },
  {
    id: 'mosca',
    en: 0,
    aviso: (q) => `Una mosca está molestando a ${q} en el baño 🪰`,
    bicho: 'mosca',
    cuantos: 1,
    pasos: () => [
      P('sentado', 1.3, 'concentrado', 'Bzzzz… ¿qué es eso?'),
      P('lanzar', 0.7, 'enojado', '¡Fuera!'),
      P('sentado', 1.0, 'enojado', 'Bzzzz…'),
      P('lanzar', 0.7, 'enojado', '¡FUERA TE DIGO!'),
      P('sentado', 1.4, 'puchero', 'Me está ganando una mosca.'),
      P('sentado_feliz', 99, 'presumido', 'Ganó el más fuerte. Yo. 😎'),
    ],
  },
  {
    id: 'concierto',
    en: 1,
    aviso: (q) => `¡${q} está dando un concierto en el baño! 🎤`,
    pasos: (rol) => [
      P('sentado', 1.4, 'feliz', 'Esta acústica está buenísima…'),
      P('baile_a', 1.6, 'feliz', '🎵 ¡Y si te vas, que sea conmigo…! 🎵', { efecto: 'nota' }),
      P('presumir_a', 1.6, 'carcajada', '🎵 ¡Tú eres mi persona favoritaaa! 🎵', { efecto: 'nota' }),
      P('baile_a', 1.6, 'feliz', rol === 'el' ? '🎵 ¡Uooo uoooo! 🎵' : '🎵 ¡La la laaaa! 🎵', { efecto: 'nota' }),
      P('sentado_feliz', 99, 'presumido', 'Gracias, gracias. Aquí toda la semana.'),
    ],
  },
  {
    id: 'dormido',
    en: 1,
    aviso: (q) => `${q} se quedó dormido|dormida en el inodoro 😴`,
    pasos: () => [
      P('sentado', 1.5, 'bostezo', 'Qué sueño…'),
      P('sentado', 2.4, 'dormido', 'Zzz…', { efecto: 'zzz' }),
      P('sentado', 2.0, 'dormido', 'Zzz… cinco minutitos más…', { efecto: 'zzz' }),
      P('boca_abierta', 1.2, 'sorprendido', '¡NO ESTABA DORMIDO|DORMIDA!', { temblor: 0.04 }),
      P('sentado', 99, 'nervioso', 'Nadie vio eso.'),
    ],
  },
  {
    id: 'llamada',
    aviso: (q) => `A ${q} lo|la llamó su mamá justo en el baño 📱`,
    pasos: () => [
      P('sentado', 1.3, 'concentrado', 'Mmm…'),
      P('sentado', 1.2, 'sorprendido', '📱 ¿Aló? ¿Mami?'),
      P('sentado', 1.8, 'nervioso', 'No, no, no estoy haciendo nada…'),
      P('sentado', 1.8, 'nervioso', '¿Ese eco? Es que… estoy en una cueva.'),
      P('sentado', 1.6, 'feliz', 'Sí, mami, yo como bien. Chao, besos.'),
      P('sentado_feliz', 99, 'carcajada', 'Casi me descubre.'),
    ],
  },
  {
    id: 'chorro',
    aviso: (q) => `¡El inodoro le echó un chorro de agua a ${q}! 💦`,
    pasos: () => [
      P('sentado_feliz', 1.5, 'feliz', 'Listo. A bajar la cadena…'),
      P('boca_abierta', 1.2, 'sorprendido', '¡AAAH! ¡AGUA FRÍA!', { temblor: 0.06 }),
      P('boca_abierta', 1.4, 'llorando', '¡Me mojé todo|toda!', { temblor: 0.03 }),
      P('brazos_cruzados', 99, 'enojado', 'Esto es personal, inodoro.'),
    ],
  },
  {
    id: 'piernas',
    aviso: (q) => `A ${q} se le durmieron las piernas en el inodoro 🦵`,
    pasos: () => [
      P('sentado', 1.8, 'aburrido', 'Llevo aquí como una hora…'),
      P('sentado', 1.4, 'nervioso', '¿Y mis piernas? No las siento.'),
      P('reposo', 1.6, 'llorando', '¡Hormiguitas! ¡Hormiguitas!', { temblor: 0.05 }),
      P('reposo', 99, 'puchero', 'Camino como pingüino ahora.', { temblor: 0.02 }),
    ],
  },
  {
    id: 'eco',
    en: 1,
    aviso: (q) => `${q} descubrió el eco del baño 🗣️`,
    pasos: () => [
      P('sentado', 1.3, 'concentrado', '¿Hola?'),
      P('sentado', 1.2, 'sorprendido', '…hola… hola…'),
      P('sentado', 1.4, 'feliz', '¡ECO!'),
      P('sentado', 1.3, 'carcajada', '…eco… eco… eco…'),
      P('sentado', 1.4, 'guino', '¡Soy muy lindo|linda!'),
      P('sentado_feliz', 99, 'carcajada', '…lindo|linda… lindo|linda… 😌'),
    ],
  },
  {
    id: 'lagartija',
    aviso: (q) => `Hay una lagartija en la pared del baño y ${q} ya le puso nombre 🦎`,
    bicho: 'lagartija',
    cuantos: 1,
    pasos: () => [
      P('sentado', 1.3, 'concentrado', 'Mmm…'),
      P('sentado', 1.3, 'sorprendido', '¿Y tú desde cuándo vives aquí?'),
      P('sentado', 1.6, 'feliz', 'Te vas a llamar Pancracio.'),
      P('sentado', 1.4, 'guino', 'Pancracio, no le digas a nadie lo que viste.'),
      P('sentado_feliz', 99, 'feliz', 'Chao, Pancracio. 👋'),
    ],
  },
  {
    id: 'puerta',
    aviso: (q) => `¡${q} se quedó encerrado|encerrada en el baño! 🚪 Te está llamando`,
    llama: 3,
    pasos: () => [
      P('sentado_feliz', 1.5, 'feliz', '¡Victoria! A salir…'),
      P('reposo', 1.4, 'nervioso', '¿Por qué no abre la puerta?'),
      P('boca_abierta', 1.4, 'sorprendido', '¡Se trabó!', { temblor: 0.03 }),
      P('boca_abierta', 99, 'llorando', '¡AMOOOR! ¡ME QUEDÉ ENCERRADO|ENCERRADA! ¡AYUDAAA!', { temblor: 0.04 }),
    ],
    rescate: ['¡Empujé y abrió! 💪', 'Había que halar, no empujar…', 'Libre otra vez.'],
  },
  {
    id: 'patito',
    en: 3,
    aviso: (q) => `El patito de hule está mirando fijamente a ${q} 🦆`,
    pasos: () => [
      P('sentado', 1.4, 'concentrado', 'Mmm…'),
      P('sentado', 1.4, 'nervioso', '¿Por qué ese patito me mira?'),
      P('sentado', 1.6, 'enojado', '¿Qué me miras, pato?'),
      P('sentado', 1.2, 'sorprendido', '*cuac*'),
      P('sentado_feliz', 99, 'nervioso', 'Ok, tú ganas, pato.'),
    ],
  },
  {
    id: 'wifi',
    en: 2,
    aviso: (q) => `A ${q} no le llega el wifi en el baño 📶`,
    pasos: () => [
      P('sentado', 1.3, 'feliz', 'A ver videos mientras tanto…'),
      P('sentado', 1.4, 'sorprendido', 'Cargando… cargando…'),
      P('lanzar', 1.6, 'nervioso', '¡Una rayita! ¡Aquí arriba hay señal!'),
      P('sentado', 1.4, 'llorando', 'Se fue. Se fue la rayita.'),
      P('sentado', 99, 'puchero', 'Vivo en la edad media.'),
    ],
  },
  {
    id: 'ambientador',
    aviso: (q) => `${q} se pasó con el ambientador 🌸 (tos, tos)`,
    pasos: () => [
      P('sentado_feliz', 1.4, 'feliz', 'Un poquito de ambientador…'),
      P('lanzar', 1.3, 'guino', 'Psss… psss… psssssss…'),
      P('boca_abierta', 1.5, 'llorando', '¡*Cof, cof*! ¡Me pasé!', { temblor: 0.04 }),
      P('sentado', 99, 'puchero', 'Huele a «bosque químico» nivel 1000.'),
    ],
  },
  {
    id: 'fantasma',
    aviso: (q) => `${q} escuchó un ruido raro en el baño 👻`,
    llama: 3,
    pasos: () => [
      P('sentado', 1.4, 'concentrado', 'Mmm…'),
      P('sentado', 1.2, 'sorprendido', '¿Escucharon eso?'),
      P('sentado', 1.6, 'nervioso', 'Las tuberías no hacen «uuuuh»… ¿cierto?', { temblor: 0.02 }),
      P('boca_abierta', 99, 'llorando', '¿Amor? ¿Eres tú? Dime que eres tú…', { temblor: 0.04 }),
    ],
    rescate: ['¡Uuuuh! Era yo 😂', 'Era la tubería, bobo|boba.', 'Ningún fantasma se mete contigo.'],
  },
  {
    id: 'perrito',
    aviso: (q) => `El perrito está rascando la puerta del baño de ${q} 🐶`,
    pasos: () => [
      P('sentado', 1.4, 'concentrado', 'Mmm…'),
      P('sentado', 1.2, 'sorprendido', '*rasca, rasca, rasca*'),
      P('sentado', 1.6, 'feliz', '¡No se puede entrar, peludito!'),
      P('sentado', 1.4, 'puchero', '*llora bajito al otro lado*'),
      P('sentado_feliz', 99, 'feliz', 'Ya voy, ya voy… qué intensidad.'),
    ],
  },
];

/** Los pasos del evento ya con el género de quien está en el baño. */
export const pasosEvento = (ev: EventoBano, rol: Rol) => ev.pasos(rol).map((q) => ({ ...q, frase: q.frase && conGenero(rol, q.frase) }));

/** ¿Pasa algo gracioso en esta visita al baño? (10 %). Misma respuesta en los dos celulares. */
export function eventoDe(semilla: number): EventoBano | null {
  const r = azar(semilla ^ 0x5bd1e995);
  if (r() >= 0.1) return null;
  return EVENTOS_BANO[Math.floor(r() * EVENTOS_BANO.length)];
}
