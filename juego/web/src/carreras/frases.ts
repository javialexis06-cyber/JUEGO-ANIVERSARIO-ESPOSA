// Lo que se dice en la carrera: el presentador y los vecinos (frases de juego, nada de la pareja; lo de Javier y Laura
// está en `pareja.ts`). Cada línea tiene un id fijo (el audio se busca por id en public/audio/carreras/lista.json) y
// `d`: cómo se dice (con la actuación en inglés entre corchetes, como en el resto de voces del juego). Si una línea
// no tiene audio, sale solo escrita.
export type Momento = 'inicio' | 'adelanta' | 'golpe' | 'objeto' | 'gana';

export interface Linea {
  id: string;
  /** Quién la dice: 'presentador' o el id de voz del corredor. */
  quien: string;
  texto: string;
  d: string;
}

const l = (quien: string, id: string, texto: string, d: string): Linea => ({ id: `${quien}.${id}`, quien, texto, d });

export const PRESENTADOR: Linea[] = [
  l('presentador', 'bienvenida', '¡Bienvenidos a la Carrera de las Tres Lunas!', '[excited, booming announcer] ¡Bienvenidos a la Carrera de las Tres Lunas!'),
  l('presentador', 'valle', '¡Hoy corremos por el valle de Celia, hasta el Pueblo del Sol!', '[cheerful announcer] ¡Hoy corremos por el valle de Celia, hasta el Pueblo del Sol!'),
  l('presentador', 'brasa', '¡Brasaviva! Cuidado con la lava, que no perdona.', '[dramatic announcer] ¡Brasaviva! Cuidado con la lava, que no perdona.'),
  l('presentador', 'nieve', '¡Nieveclara! Abríguense, que el lago resbala.', '[playful announcer] ¡Nieveclara! Abríguense, que el lago resbala.'),
  l('presentador', 'cielo', '¡Al cielo de Astra! Entre las lunas y sin baranda.', '[awed announcer] ¡Al cielo de Astra! Entre las lunas y sin baranda.'),
  l('presentador', 'marcas', '¡En sus marcas!', '[announcer, building tension] ¡En sus marcas!'),
  l('presentador', 'ya', '¡A correr!', '[shouting with joy] ¡A correr!'),
  l('presentador', 'ultima', '¡Última vuelta!', '[excited] ¡Última vuelta!'),
  l('presentador', 'ganador', '¡Tenemos ganador!', '[cheering] ¡Tenemos ganador!'),
  l('presentador', 'remontada', '¡Qué remontada, señoras y señores!', '[amazed announcer] ¡Qué remontada, señoras y señores!'),
  l('presentador', 'caida', '¡Uy! Ese se fue de paseo.', '[laughing announcer] ¡Uy! Ese se fue de paseo.'),
  l('presentador', 'podio', '¡Un aplauso para el podio!', '[warm, proud announcer] ¡Un aplauso para el podio!'),
  l('presentador', 'campeon', '¡Tenemos campeón del Gran Premio!', '[triumphant announcer] ¡Tenemos campeón del Gran Premio!'),
  l('presentador', 'record', '¡Nuevo récord de la pista!', '[excited announcer] ¡Nuevo récord de la pista!'),
];

/** Cinco frases por vecino (inicio, adelanta, golpe, objeto, gana). */
export const FRASES_VECINOS: Linea[] = [
  l('bruma_felix', 'inicio', '¡Hoy sí les gano a todos!', '[confident, cheerful] ¡Hoy sí les gano a todos!'),
  l('bruma_felix', 'adelanta', '¡Permiso, permiso!', '[playful] ¡Permiso, permiso!'),
  l('bruma_felix', 'golpe', '¡Ay, mi sombrerito!', '[surprised, whiny] ¡Ay, mi sombrerito!'),
  l('bruma_felix', 'objeto', '¡Ahí te va, con cariño!', '[mischievous] ¡Ahí te va, con cariño!'),
  l('bruma_felix', 'gana', '¡Lo sabía! ¡Brumaverde campeón!', '[triumphant] ¡Lo sabía! ¡Brumaverde campeón!'),
  l('bruma_ada', 'inicio', 'Ajústense el cinturón.', '[cool, confident] Ajústense el cinturón.'),
  l('bruma_ada', 'adelanta', 'Nos vemos en la meta.', '[smug] Nos vemos en la meta.'),
  l('bruma_ada', 'golpe', '¡Oye! ¡Eso no se vale!', '[annoyed] ¡Oye! ¡Eso no se vale!'),
  l('bruma_ada', 'objeto', 'Toma, para que aprendas.', '[sassy] Toma, para que aprendas.'),
  l('bruma_ada', 'gana', 'Fácil. Muy fácil.', '[smug laugh] Fácil. Muy fácil.'),
  l('brasa_dante', 'inicio', '¡A calentar motores!', '[energetic] ¡A calentar motores!'),
  l('brasa_dante', 'adelanta', '¡Más caliente que un horno!', '[laughing] ¡Más caliente que un horno!'),
  l('brasa_dante', 'golpe', '¡Me chamuscaron!', '[groaning] ¡Me chamuscaron!'),
  l('brasa_dante', 'objeto', '¡Fuego va!', '[shouting] ¡Fuego va!'),
  l('brasa_dante', 'gana', '¡Brasaviva no se apaga!', '[proud shout] ¡Brasaviva no se apaga!'),
  l('brasa_sol', 'inicio', '¡Qué emoción, qué emoción!', '[giggling, excited] ¡Qué emoción, qué emoción!'),
  l('brasa_sol', 'adelanta', '¡Chao, chao!', '[cute, teasing] ¡Chao, chao!'),
  l('brasa_sol', 'golpe', '¡Ay, no, mi cola!', '[squeaky] ¡Ay, no, mi cola!'),
  l('brasa_sol', 'objeto', '¡Sorpresita!', '[mischievous giggle] ¡Sorpresita!'),
  l('brasa_sol', 'gana', '¡Gané! ¡Gané! ¡Gané!', '[jumping with joy] ¡Gané! ¡Gané! ¡Gané!'),
  l('nieve_otto', 'inicio', '¡Vamos, carnero, con toda!', '[enthusiastic] ¡Vamos, carnero, con toda!'),
  l('nieve_otto', 'adelanta', '¡Abran paso, que voy con lana!', '[booming laugh] ¡Abran paso, que voy con lana!'),
  l('nieve_otto', 'golpe', '¡Eso me dolió hasta en la bufanda!', '[groaning] ¡Eso me dolió hasta en la bufanda!'),
  l('nieve_otto', 'objeto', '¡Ahí les dejo un regalito!', '[laughing] ¡Ahí les dejo un regalito!'),
  l('nieve_otto', 'gana', '¡Nieveclara, esta es por ustedes!', '[proud, warm] ¡Nieveclara, esta es por ustedes!'),
  l('nieve_luz', 'inicio', 'Tranquila, cría. Tú puedes.', '[soft, encouraging] Tranquila, cría. Tú puedes.'),
  l('nieve_luz', 'adelanta', '¡Perdón, voy pasando!', '[polite, cheerful] ¡Perdón, voy pasando!'),
  l('nieve_luz', 'golpe', '¡Uy! ¡Qué frío!', '[startled] ¡Uy! ¡Qué frío!'),
  l('nieve_luz', 'objeto', 'Lo siento… pero no tanto.', '[playful whisper] Lo siento… pero no tanto.'),
  l('nieve_luz', 'gana', '¡No lo puedo creer!', '[happy, surprised] ¡No lo puedo creer!'),
  l('lirios_teo', 'inicio', 'Viento a favor, muchachos.', '[relaxed, confident] Viento a favor, muchachos.'),
  l('lirios_teo', 'adelanta', '¡Como pez en el agua!', '[cheerful] ¡Como pez en el agua!'),
  l('lirios_teo', 'golpe', '¡Hombre al agua!', '[dramatic] ¡Hombre al agua!'),
  l('lirios_teo', 'objeto', '¡Va el anzuelo!', '[playful] ¡Va el anzuelo!'),
  l('lirios_teo', 'gana', '¡Para el puerto de los Lirios!', '[triumphant] ¡Para el puerto de los Lirios!'),
  l('piedra_petra', 'inicio', 'A picar piedra… digo, pista.', '[deadpan, amused] A picar piedra… digo, pista.'),
  l('piedra_petra', 'adelanta', '¡Más dura que una roca!', '[confident] ¡Más dura que una roca!'),
  l('piedra_petra', 'golpe', '¡Derrumbe!', '[shouting] ¡Derrumbe!'),
  l('piedra_petra', 'objeto', '¡Cuidado abajo!', '[warning shout] ¡Cuidado abajo!'),
  l('piedra_petra', 'gana', 'Esto vale más que una veta de oro.', '[satisfied] Esto vale más que una veta de oro.'),
];
