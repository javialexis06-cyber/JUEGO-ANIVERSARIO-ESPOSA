// Lo que dice el presentador (el perrito de la casa, con corbatín y micrófono) y lo que contestan Él y Ella en sus
// globitos. Cortico, con humor y con sus apodos. Marcas: {perro} su nombre, {n}/{otro} y {x|y} como en las preguntas
// (aquí {x|y} depende de `quien`: x si es Él, y si es Ella).
import { otroRol } from './motor';
import { NOMBRE, type Rol, type TipoPregunta } from './preguntas';

const azar = <T,>(l: T[]): T => l[Math.floor(Math.random() * l.length)];

export function decir(t: string, o: { perro?: string; quien?: Rol } = {}): string {
  const q = o.quien ?? 'el';
  return t
    .replace(/\{perro\}/g, o.perro ?? 'el perrito')
    .replace(/\{n\}/g, NOMBRE[q])
    .replace(/\{otro\}/g, NOMBRE[otroRol(q)])
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, a: string, b: string) => (q === 'el' ? a : b));
}

export const HOLA = [
  '¡Buenas noches, Colombia! ¡Bienvenidos a El Show de Nosotros!',
  '¡Guau, qué público tan bonito! ¡Bienvenidos a El Show de Nosotros!',
  '¡Aplausos, aplausos! Empieza el programa más romántico de la televisión.',
  '¡Desde el estudio más tierno del país… esto es El Show de Nosotros!',
];
export const PRESENTO_EL = [
  'Desde Bucaramanga, la ciudad bonita: ¡el panda, el perro lanudo, el liefje… ÉL!',
  'En el atril azul: ¡el rey de las matemáticas y del frappé de café… ÉL!',
  'Con ustedes, el que convence a cualquiera (persistente, no insistente): ¡ÉL!',
];
export const PRESENTO_ELLA = [
  'Y desde Sopetrán, tierra caliente: ¡la pulga aventurera, la protagonista… ELLA!',
  'En el atril rosado: ¡la directora de Yanbal, la reina de los wafles… ELLA!',
  'La mejor guerrera de Dios y dueña de este corazón de perro: ¡ELLA!',
];
export const REGLAS = [
  'Las reglas: contesten en su celular, en secreto… ¡y nada de mirarse la pantalla!',
  'Fácil: cada uno contesta a escondidas y aquí revelamos. Prohibido hacer trampa con los ojitos.',
  'Recuerden: el que no conoce a su pareja… ¡le toca lavar los platos!',
];
export const HOLA_SOLO = [
  '¡Hoy juegas solit{o|a}! Pero {otro} dejó sus respuestas en este sobre sellado…',
  '¡Show especial! {otro} no está, pero sus respuestas sí. ¿Qué tanto l{a|o} conoces?',
];
export const HOLA_LOCAL = [
  '¡Los dos en el mismo celular! Se lo van pasando… y el que no contesta, ¡ojos cerrados!',
];

export const RONDA: Record<TipoPregunta, string[]> = {
  quien: ['Primera ronda: ¿quién es más probable? Señalen sin piedad.', 'Arrancamos suave: ¿quién es más probable…? Ojo con lo que señalan.'],
  prefiere: ['Segunda ronda: ¿qué prefieres? Lo tuyo y lo que crees que escogió tu pareja.', '¡¿Qué prefieres?! Aquí se ve quién conoce los gustos del otro.'],
  conoce: ['Tercera ronda: ¿cuánto me conoces? Uno contesta sobre sí y el otro adivina. ¡Uy!', '¿Cuánto me conoces? La ronda que ha acabado matrimonios… mentiras, ninguno.'],
  termo: ['¡El termómetro! Del 1 al 10. Entre más cerquita, más puntos.', 'Cuarta ronda: el termómetro. Aquí se mide el amor en grados.'],
  historia: ['Nuestra historia: ¿quién se acuerda mejor de lo que han vivido?', '¡Ronda de recuerdos! Desde Transformice hasta hoy. ¿Quién tiene mejor memoria?'],
  zapato: ['¡FINAL RELÁMPAGO! Diez preguntas, treinta segundos, ¡puntos dobles!', '¡Llegó la final relámpago! Como el juego del zapato de las bodas… pero sin quitarse los zapatos.'],
};

export const ANTES_DE_REVELAR = [
  'Redoble de tambores…',
  'Veamos qué dijeron…',
  'El momento de la verdad…',
  '¿Coincidirán? ¡Uy, qué nervios!',
  'Que suenen los tambores…',
  'Ojo con lo que vamos a ver…',
];

export const BIEN = [
  '¡GUAU! ¡Así se hace!',
  '¡Eso es conocerse!',
  '¡Conexión total! Se me paró la cola de la emoción.',
  '¡Puntos para el amor!',
  '¡Ni la telepatía es tan precisa!',
  '¡Almas gemelas, señoras y señores!',
];
export const MAL = [
  '¡Uy, no! Esa dolió…',
  '¡Auch! Esa va para la próxima videollamada.',
  'Mmm… alguien tiene que poner más atención.',
  '¡Nooo! ¡El público no lo puede creer!',
  'Eso se arregla con un frappé. O con wafles.',
  'Bueno, bueno… el amor no es matemática. (Bueno, a veces sí.)',
];
export const CASI = ['¡Casi, casi!', '¡Por un pelito de perro!', 'Ahí vamos… ¡caliente, caliente!', 'Medio punto para el corazón.'];
export const NADA = ['¡Se les fue el tiempo! El reloj no perdona.', '¡Tiempo! Ni el perrito alcanzó a ladrar.'];
export const PENDIENTE = [
  'Esta queda en el sobre sellado: cuando {otro} juegue, ¡se revela!',
  'Guardadita en el sobre. {otro} la verá cuando juegue.',
];
export const ESPERANDO_OTRO = ['{otro} está pensando…', 'Esperando a {otro}…', '{otro} todavía no contesta. ¡Suspenso!'];
export const NOTA = ['Ahora {n} califica: ¿le atinó o no?', '{n}, con la mano en el corazón: ¿le atinó?'];

export const POR_TIPO_BIEN: Partial<Record<TipoPregunta, string[]>> = {
  quien: ['¡Coinciden! Los dos señalaron a la misma persona… y esa persona lo sabe.', '¡Los dos de acuerdo! Nadie puede negarlo.'],
  zapato: ['¡Zapato arriba!'],
  termo: ['¡En el puntico exacto! Termómetro de amor calibrado.'],
  historia: ['¡Memoria de elefante! O de perro, que es mejor.'],
};
export const POR_TIPO_MAL: Partial<Record<TipoPregunta, string[]>> = {
  quien: ['¡Se señalaron entre ellos! Esto va a terminar en cosquillas.', '¡No coinciden! Que el público decida…'],
  termo: ['¡Frío, frío! Ese termómetro necesita pilas.'],
  historia: ['¿Cómo así? ¡Si eso lo vivieron juntos!'],
};

export const FINAL_GANA = [
  '¡Y el ganador de esta noche es… {n}!',
  '¡Tenemos campe{ón|ona}! ¡{n} conoce mejor a {otro}!',
  '¡Aplausos para {n}, que se lleva el show!',
];
export const FINAL_EMPATE = ['¡EMPATE! Como debe ser en una pareja: mitad y mitad.', '¡Empate! El amor no se divide… se comparte.'];
export const DESPEDIDA = [
  'Esto fue El Show de Nosotros. ¡Los esperamos en el próximo episodio!',
  '¡Hasta la próxima! Y recuerden: el amor se riega todos los días… como las maticas.',
  'Gracias por venir. ¡Guau, guau y buenas noches!',
];

export const RELAMPAGO_YA = ['¡Ya! ¡Rápido, rápido!', '¡Treinta segundos! ¡Corre, que se acaba!'];

/** Lo que dicen Él o Ella en su globo según cómo les fue (lo dice el que reacciona). */
export const DICE: Record<'bien' | 'mal' | 'casi' | 'meAtinaron' | 'noMeConoce' | 'gano' | 'pierde', Record<Rol, string[]>> = {
  bien: {
    el: ['¡Te conozco, pulga!', 'Matemática pura, mi amor', '¡Sabía! ¡Lo sabía!', 'Punto para el panda'],
    ella: ['¡Obvio, liefje!', 'Te leo la mente, panda', '¡Te lo dije!', 'Psicología, mi amor'],
  },
  mal: {
    el: ['¿Cómo así?', 'Eso no contaba…', 'Me confundí de pregunta', 'Revancha en la próxima'],
    ella: ['¡¿Qué?!', 'Eso fue trampa', 'Ay no, panda…', '¿Y tú quién eres?'],
  },
  casi: {
    el: ['¡Casi!', 'Por un pelito', 'Estaba calentando'],
    ella: ['¡Uy, casi!', 'Por poquito', 'Ya casi te descifro'],
  },
  meAtinaron: {
    el: ['¡Me conoces!', 'Esa es mi pulga', 'Me derrites'],
    ella: ['¡Me conoces, panda!', 'Ese es mi liefje', '¡Ay, qué lindo!'],
  },
  noMeConoce: {
    el: ['¿Ni eso sabes de mí?', 'Videollamada de 24 horas urgente', 'Me ofendí… un poquito'],
    ella: ['¿En serio no sabías?', 'Hablamos en la casa', 'Me ofendí, liefje'],
  },
  gano: {
    el: ['¡Campeón del amor!', 'Te conozco de memoria', '¡Y sin calculadora!'],
    ella: ['¡La protagonista gana!', 'Te conozco más, panda', '¡Reina del show!'],
  },
  pierde: {
    el: ['Te dejé ganar', 'La próxima es mía', 'Exijo revancha'],
    ella: ['Hubo trampa, perrito', 'Revancha ya mismo', 'Te dejé ganar, liefje'],
  },
};

export const frase = (l: string[], o: { perro?: string; quien?: Rol } = {}) => decir(azar(l), o);
export { azar as una };
