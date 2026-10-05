// Los invitados que llegan a comer a la cocina de chef: familia, vecinos y amigos (los mismos muñequitos del súper)
// y, de vez en cuando, la pareja. Cada uno tiene su paciencia, qué tan buena propina deja y sus frases.
import type { Rol } from '../modelo';
import type { RecetaId } from './tipos';

export type Animo = 'feliz' | 'espera' | 'bravo' | 'encantado';

/** Las poses de los recortes de cada invitado (scripts/generar-sprites-cocina.mjs). */
export type Pose =
  | 'camina_a' | 'camina_b' | 'feliz' | 'espera' | 'impaciente' | 'bravo' | 'come_a' | 'come_b' | 'encantado' | 'contento' | 'regular';
export const POSES: Pose[] = ['camina_a', 'camina_b', 'feliz', 'espera', 'impaciente', 'bravo', 'come_a', 'come_b', 'encantado', 'contento', 'regular'];

export interface Invitado {
  id: string;
  nombre: string;
  /** Rango del restaurante desde el que empieza a venir. */
  desde: number;
  paciencia: number;
  propina: number;
  /** Lo que dice al llegar al mostrador. */
  saludos: string[];
  /** La pareja (llega con corazones) o el crítico (exigente, pero deja buena propina). */
  especial?: 'pareja' | 'critico';
  /** Ruta de sus recortes: `${ruta}_${pose}.webp`. */
  ruta: string;
}

const I = (id: string, nombre: string, desde: number, paciencia: number, propina: number, saludos: string[], especial?: Invitado['especial']): Invitado =>
  ({ id, nombre, desde, paciencia, propina, saludos, especial, ruta: `./cocina/gente/${id}` });

export const INVITADOS: Invitado[] = [
  I('abuelita', 'Abuela Rosa', 1, 1.35, 1.2, ['¡Mijo|Mija, qué olorcito tan rico!', 'Vengo con un hambre de viaje…', 'A ver qué me tiene hoy, mi chef', 'Ay, ¡qué cocina tan bonita, mijo|mija!']),
  I('mama', 'Tía Marta', 1, 1.1, 1, ['¡Uy, qué belleza de cocina!', 'Me dijeron que aquí se come delicioso', 'Hola, hola… ¿qué hay de bueno?', '¡Ese olor se siente desde la esquina!']),
  I('adolescente', 'Primo Santi', 1, 0.85, 0.8, ['Quiubo, parce… tengo un hambre…', 'Rápido que tengo partido', '¿Aquí regalan comida? Jajaja', 'Parce, lo más grande que tenga']),
  I('deportista', 'Vale la del gym', 1, 0.95, 1, ['¡Hoy es día libre, hoy sí como!', 'Después del gym me lo merezco', 'Hola, ¿qué me recomiendas?', 'Shhh… no le cuentes a mi entrenador']),
  I('nina', 'Sobrinita Luci', 2, 0.8, 0.8, ['¡Tío|Tía, tío|tía! ¡Tengo hambre!', 'Yo quiero algo con mucho dulce', '¿Me haces algo rico?', '¡Con chispitas de colores, porfa!']),
  I('cajera', 'Doña Rubi, la vecina', 3, 1.2, 1.1, ['Vecino|Vecina, ¡qué rico huele desde mi casa!', 'Pasaba por aquí y me antojé', 'Buenas, buenas…', 'Le traje un chismecito… pero primero el antojo']),
  I('reponedor', 'Pacho, el del colegio', 4, 1, 1, ['¡Mi llave! Vine a probar su sazón', 'Ey, ¿se acuerda del colegio?', 'Bueno, a ver si es verdad que cocina', '¡Quién lo|la ve, todo un|una chef!']),
  I('ladron', 'El vecino misterioso', 5, 1, 1.3, ['…', 'Shhh… nadie me vio entrar', 'Vengo en secreto: ¿qué hay?', 'No le diga a nadie que estuve aquí']),
  I('guardia', 'Don Jairo, el portero', 6, 1.15, 1.1, ['Buenas, don|doña chef, ¿cómo va la cosa?', 'Me dejé antojar por el olor', 'Un descansito del turno…', 'Todo en orden en el edificio… menos mi estómago']),
  I('aseo', 'Nelly, la del trabajo', 7, 1, 1, ['¡Amigo|Amiga! Vine como te prometí', 'Qué lindo tu restaurante', 'Tengo media hora de almuerzo…', '¡Le conté a toda la oficina!']),
  I('ejecutivo', 'Don Hernán', 8, 0.7, 1.5, ['Tengo una reunión en diez minutos', 'Rapidito, por favor', 'Lo de siempre… pero bien hecho', 'El tiempo es plata, chef']),
  I('famoso', 'El crítico famoso', 9, 0.9, 3, ['Vengo a ver si es cierto lo que dicen…', 'Mi paladar es muy exigente', 'Sorpréndame', 'Tengo tres estrellas para dar… o ninguna'], 'critico'),
];

// ------------------------------------------------------------------------------------------------ La pareja
// Cómo se dicen (docs/la-pareja.md): Él le dice a Ella «esposa» o «pulga aventurera»; Ella a Él «panda», «perro lanudo»
// o «liefje». A Ella le encantan los wafles; a Él el frappé de café (ella siempre lo recibe con uno después del
// trabajo); y para Amor y Amistad él le mandó unas fresas con crema gigantes con un wafle de sorpresa.

/** Lo que dice la pareja según quién llega a comer (rol del invitado) y a qué restaurante. */
const SALUDOS_PAREJA: Record<Rol, Record<RecetaId, string[]>> = {
  ella: {
    wafles: ['¡Panda! Me prometiste wafles cada vez que yo quisiera… y hoy quiero 🧇💖', 'Liefje, vine por mis wafles favoritos', 'Huele a wafle… ¿fuiste tú, perro lanudo?'],
    fresas: ['¡Panda! ¿Me haces unas fresas con crema gigantes? 🍓', 'Liefje… ¿me atiendes con amor?', 'Vengo a ver a mi chef favorito, perro lanudo'],
    frappes: ['Hoy me toca a mí que me reciban con frappé, ¿no, panda? 😏', 'Liefje, un frappecito para tu esposa', '¿Aquí atiende el perro lanudo más lindo?'],
  },
  el: {
    wafles: ['¡Esposa! Vine a probar los wafles más famosos de la casa 🧇', 'Pulga aventurera, ¿hoy cocinas tú? ¡Qué lujo!', '¿Me atiende la chef más linda de Sopetrán?'],
    fresas: ['¿Me haces unas fresas con crema gigantes… con un wafle de sorpresa? 😏🍓', 'Pulga aventurera, vine por mis fresas con crema', 'Esposa, ¿me atiendes con amor?'],
    frappes: ['¡Esposa! ¿Me recibes con un frappé de café como siempre? ☕💖', 'Pulga, después del trabajo solo pienso en tu frappé', 'Un frappé de café para tu panda, por favor'],
  },
};
type Tono = 'encantado' | 'feliz' | 'normal' | 'bravo';
const REACCIONES_PAREJA: Record<Rol, Record<Tono, string[]>> = {
  ella: {
    encantado: ['¡Panda, esto está divino! 💖', '¡Liefje, me casaría otra vez contigo por esto!', '¡Mi chef favorito! Te amo 💕', '¡Hecho con amor se nota, perro lanudo!'],
    feliz: ['¡Qué rico, mi amor!', 'Gracias, panda 💕', 'Me encantó, liefje'],
    normal: ['Te quedó… bien, perro lanudo 😅', 'Con amor todo sabe rico', 'Lo importante es la intención, panda'],
    bravo: ['Panda… ¿qué pasó aquí? 😂', 'Te perdono porque te amo, perro lanudo', 'Mejor pedimos domicilio… mentiras 😘'],
  },
  el: {
    encantado: ['¡Esposa, esto está buenísimo! 💖', '¡Mi pulga aventurera es toda una chef!', '¡Me casaría otra vez contigo por esto!', '¡Hecho con amor se nota!'],
    feliz: ['¡Qué rico, mi amor!', 'Gracias, esposa 💕', 'Me encantó, pulga'],
    normal: ['Te quedó… bien, esposa 😅', 'Con amor todo sabe rico', 'Lo importante es la intención, pulguita'],
    bravo: ['Pulga… ¿qué pasó aquí? 😂', 'Te perdono porque te amo', 'Mejor pedimos domicilio… mentiras 😘'],
  },
};
/** Frases especiales cuando la pareja queda encantada con su plato favorito. */
const FAVORITO: Partial<Record<Rol, Partial<Record<RecetaId, string>>>> = {
  ella: { wafles: '¡Cumpliste tu promesa: wafles cuando yo quiera! 🧇💖' },
  el: { frappes: '¡Igualito al que me esperas después del trabajo! ☕💖', fresas: '¡Ahora sí sé de quién eran esas fresas con crema! 😂🍓' },
};

/** La pareja como invitada (rol = quién llega a comer). */
export function invitadoPareja(rol: Rol, nombre: string, receta: RecetaId = 'wafles'): Invitado {
  return {
    id: `pareja_${rol}`, nombre, desde: 1, paciencia: 1.6, propina: 2, especial: 'pareja', ruta: `./cocina/gente/pareja_${rol}`,
    saludos: SALUDOS_PAREJA[rol][receta],
  };
}

export function frasePareja(rol: Rol, receta: RecetaId, tono: Tono, azar = Math.random) {
  const fav = FAVORITO[rol]?.[receta];
  if (tono === 'encantado' && fav && azar() < 0.5) return fav;
  const l = REACCIONES_PAREJA[rol][tono];
  return l[Math.floor(azar() * l.length)];
}

export const FRASES: Record<'encantado' | 'feliz' | 'normal' | 'bravo' | 'apurado', string[]> = {
  encantado: ['¡Uy, qué delicia!', '¡Esto sí es de chef!', '¡Me quedó sonando!', '¡Diez de diez!', '¡Está buenísimo, parce!', '¡Qué cosa tan rica!', '¡Vuelvo mañana!', '¡Ave María, qué belleza!'],
  feliz: ['¡Muy rico, gracias!', 'Rico, rico', 'Me gustó mucho', '¡Qué bueno!', 'Muy bien hecho', '¡Bien sabroso!'],
  normal: ['Está bien…', 'Normalito', 'Le faltó un poquito', 'Mmm… pasable', 'Ahí va, ahí va'],
  bravo: ['¿Y esto qué es?', 'Uy no…', 'Esto no fue lo que pedí', 'Mmm… no', '¿En serio?', '¡Ni mi perro se come esto!'],
  apurado: ['¿Ya casi?', 'Tengo hambre…', '¿Se demora mucho?', 'Mmm…', 'Uy, ¿y mi pedido?', 'Se me va a hacer tarde…'],
};

/**
 * Los invitados de un día: más a medida que suben los días, y los nuevos aparecen con el rango. `extra`: cocinando de
 * a tres o cuatro vienen más. La pareja (si viene: solo Javier y Laura sin amigos) llega cada tres días.
 */
export function invitadosDelDia(dia: number, rango: number, pareja: Invitado | null, azar: () => number, extra = 0): Invitado[] {
  const n = Math.min(10 + extra, 2 + Math.ceil(dia * 0.55) + extra);
  const posibles = INVITADOS.filter((i) => i.desde <= rango && !i.especial);
  // Sin repetir hasta que ya hayan venido todos (y nunca el mismo dos veces seguidas)
  const lista: Invitado[] = [];
  let bolsa: Invitado[] = [];
  for (let k = 0; k < n; k++) {
    if (!bolsa.length) bolsa = posibles.filter((i) => i !== lista[lista.length - 1]);
    const x = bolsa.splice(Math.floor(azar() * bolsa.length), 1)[0];
    lista.push(x);
  }
  // El crítico llega cada cinco días (cuando ya se lo ganó) y la pareja cada tres, de últimos
  const critico = INVITADOS.find((i) => i.especial === 'critico')!;
  if (rango >= critico.desde && dia % 5 === 0) lista[lista.length - 1] = critico;
  if (pareja && (dia % 3 === 0 || dia === 2)) lista.splice(Math.max(1, lista.length - 1), 0, pareja);
  return lista;
}

/** El invitado por su id (también la pareja). */
export function invitadoPorId(id: string, pareja: Invitado | null): Invitado {
  return pareja && id === pareja.id ? pareja : INVITADOS.find((i) => i.id === id) ?? INVITADOS[0];
}
