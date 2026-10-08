// Los mimos con variedad: cada caricia, abrazo o beso sale distinto (no se repite hasta que salgan todos los de ese
// tipo), cada uno con su pose, su reacción y lo que se dicen, con las palabras de ellos dos: «muak», «betitos»,
// «mimilona», «cotita», «mi niño», «hi baby», «ay deos», «ti amu»… Quien lo da escoge cuál (de su bolsa) y lo manda
// con el evento, así los dos celulares ven el mismo.
import type { Cara } from '../personaje';
import type { Rol } from './modelo';

export type TipoCarino = 'caricia' | 'abrazo' | 'beso';

/** Un paso del mimo: la pose (o dos que se alternan), la cara y lo que dice al empezar (null: se calla). */
export interface PasoMimo {
  /** «ABRAZO» es el brazo que corresponde a cada uno (Él abraza con el derecho, Ella con el izquierdo). */
  pose: string;
  pose2?: string;
  ritmo?: number;
  dur: number;
  cara?: Cara;
  dice?: string | null;
  salto?: number;
  giro?: number;
  temblor?: number;
}

export interface VarianteMimo {
  id: string;
  /** Para el aviso de quien lo recibe: «Javier te dio …». */
  nombre: string;
  /** Solo lo da uno de los dos (si no, cualquiera). */
  de?: Rol;
  /** Lo que hace quien lo da y quien lo recibe (el último paso de cada uno dura hasta que termina el mimo). */
  da: PasoMimo[];
  recibe: PasoMimo[];
  efecto?: 'corazones' | 'brillos' | 'nota';
}

/** Cuánto dura la pose de un mimo con su diálogo (la caminada hasta el otro va aparte). */
export const DUR_MIMO = 5.4;

// Atajos: quien da habla primero (2.3 s) y se calla; quien recibe espera en su pose y contesta justo después (así los
// dos globitos, que quedan muy cerca, no se pisan).
const da = (pose: string, dice: string, despues: Omit<PasoMimo, 'dur'> = { pose: 'feliz', cara: 'feliz' }, cara: Cara = 'feliz'): PasoMimo[] => [
  { pose, dur: 2.3, cara, dice },
  { ...despues, dur: 99, dice: despues.dice ?? null },
];
const recibe = (pose: string, dice: string, reaccion: Omit<PasoMimo, 'dur'>, cara: Cara = 'feliz'): PasoMimo[] => [
  { pose, dur: 2.4, cara },
  { ...reaccion, dur: 99, dice },
];
const RISITA = { pose: 'risita_a', pose2: 'risita_b', ritmo: 5, cara: 'carcajada' as Cara };
const PRESUME = { pose: 'presumir_a', pose2: 'presumir_b', ritmo: 1.2, cara: 'presumido' as Cara };
const APLAUSO = { pose: 'aplauso_a', pose2: 'aplauso_b', ritmo: 4, cara: 'feliz' as Cara };
const TIMIDO = { pose: 'encogerse', cara: 'feliz' as Cara };
const BRINCO = { pose: 'salto', cara: 'carcajada' as Cara, salto: 0.35 };
const VOLADO = { pose: 'beso_volado_a', pose2: 'beso_volado_b', ritmo: 2.4, cara: 'beso' as Cara };

const BESOS: VarianteMimo[] = [
  { id: 'muak', nombre: 'un muak tronado', da: da('beso', '¡Muak! 💋', RISITA, 'beso'), recibe: recibe('beso', 'Muak muak 😚', { pose: 'feliz', cara: 'beso' }, 'beso') },
  { id: 'amanecio', nombre: 'un besito de buenos días', da: da('beso', '¿Cómo amaneció el amor de mi vida? ❤️', { pose: 'feliz', cara: 'feliz' }, 'beso'), recibe: recibe('beso', 'Mejor ahora 🥰', TIMIDO, 'beso') },
  { id: 'rafaga', nombre: 'una ráfaga de betitos', da: [{ pose: 'beso', pose2: 'hablar_a', ritmo: 6, dur: 2.3, cara: 'beso', dice: 'Betito, betito, betito… 😚' }, { ...RISITA, dur: 99, dice: null }], recibe: recibe('beso', '¡Me vas a gastar! 😂', RISITA, 'beso') },
  { id: 'volado', nombre: 'un beso volado', da: da('beso_volado_a', 'Ahí te va un betito ✈️💋', VOLADO, 'beso'), recibe: recibe('feliz', '¡Atrapado! 🤲', APLAUSO, 'sorprendido') },
  { id: 'frente', nombre: 'un beso en la frente', da: da('beso', 'Para que nada te preocupe hoy 🤍', { pose: 'acariciar', cara: 'feliz' }, 'beso'), recibe: recibe('recibir_caricia', 'Ay… 🥺', TIMIDO) },
  { id: 'esquimal', nombre: 'un beso de esquimal', da: da('beso', 'Narices con narices 🐧', RISITA, 'feliz'), recibe: recibe('beso', '¡Cosquillas! 😆', RISITA, 'carcajada') },
  { id: 'robado', nombre: 'un beso robado', da: da('beso', 'Robado y sin devolución 😏', PRESUME, 'beso'), recibe: recibe('boca_abierta', '¡Ladrón! …devuélvemelo 😳', { pose: 'feliz', cara: 'beso' }, 'sorprendido') },
  { id: 'tiamu', nombre: 'un «ti amu»', da: da('beso', 'Ti amu ❤️', { pose: 'feliz', cara: 'feliz' }, 'beso'), recibe: recibe('beso', 'Ti amu más 🤍', { pose: 'feliz', cara: 'guino' }, 'beso') },
  { id: 'semana', nombre: 'un beso de promesa', da: da('beso', 'Te prometo un beso para cada día de la semana 📅', { pose: 'feliz', cara: 'feliz' }, 'beso'), recibe: recibe('beso', '¿Y los domingos? ¡Doble! 😚', RISITA, 'beso') },
  // Los de Él
  { id: 'esposha', de: 'el', nombre: 'un beso de «esposha»', da: da('beso', 'Esposha míaaa 😚', RISITA, 'beso'), recibe: recibe('beso', 'Ay deos, este hombre 🙈', TIMIDO, 'beso') },
  { id: 'amodoro', de: 'el', nombre: 'un «te amodoro»', da: da('beso', 'Te amodoro ❤️', PRESUME, 'beso'), recibe: recibe('pensando', '¡Y yo te amodoro el doble! 😚', { pose: 'feliz', cara: 'feliz' }, 'normal') },
  { id: 'dico', de: 'el', nombre: 'un beso «dico»', da: da('beso', 'Mmm… dico 😋', PRESUME, 'beso'), recibe: recibe('beso', '¿Dico? ¡Divino, dirás! 😤', { pose: 'puchero', cara: 'puchero' }, 'beso') },
  { id: 'motivo', de: 'el', nombre: 'un beso de los serios', da: da('beso', 'Eres mi motivo de todos los días ❤️', { pose: 'acariciar', cara: 'feliz' }, 'beso'), recibe: recibe('beso', 'Y tú el mío, esposo 🥺', TIMIDO, 'beso') },
  // Los de Ella
  { id: 'nino', de: 'ella', nombre: 'un beso de «mi niño»', da: da('beso', 'Muak, mi niño hermoso 🤍', { pose: 'feliz', cara: 'feliz' }, 'beso'), recibe: recibe('beso', '«Hermoso», dijo 😎', PRESUME, 'beso') },
  { id: 'hibaby', de: 'ella', nombre: 'un «hi baby»', da: da('beso', 'Hi baby 😘', { pose: 'saludo', cara: 'guino' }, 'beso'), recibe: recibe('feliz', 'Hi, esposa mía :3', { pose: 'saludo_b', cara: 'feliz' }, 'feliz') },
  { id: 'mibb', de: 'ella', nombre: 'un beso de «mi bb»', da: [{ pose: 'beso', pose2: 'hablar_b', ritmo: 5, dur: 2.3, cara: 'beso', dice: 'Mi bb, mi bb, mi bb 🥺' }, { ...RISITA, dur: 99, dice: null }], recibe: recibe('beso', 'Tu bb, tu bb 😚', RISITA, 'beso') },
  { id: 'orgullosa', de: 'ella', nombre: 'un beso de orgullo', da: da('beso', 'Qué orgullosa me siento de ti 🤍', APLAUSO, 'beso'), recibe: recibe('beso', 'Todo es más fácil contigo ❤️', TIMIDO, 'beso') },
];

const ABRAZOS: VarianteMimo[] = [
  { id: 'oso', nombre: 'un abrazo de oso', da: da('ABRAZO', '¡Abrazo de oso! 🐻', { pose: 'ABRAZO', cara: 'carcajada' }), recibe: recibe('ABRAZO', 'No respiro… pero no me sueltes 😵‍💫', { pose: 'ABRAZO', cara: 'feliz', temblor: 0.02 }, 'sorprendido') },
  { id: 'casa', nombre: 'un abrazo de casita', da: da('ABRAZO', 'Aquí es mi casa 🏡', { pose: 'ABRAZO', cara: 'feliz' }), recibe: recibe('ABRAZO', 'Pues no te me mudas nunca 🤍', { pose: 'ABRAZO', cara: 'feliz' }) },
  { id: 'llegaste', nombre: 'un abrazo de reencuentro', da: da('ABRAZO', '¡Llegaste! Valió la pena cada kilómetro 🧳', { pose: 'ABRAZO', cara: 'carcajada' }), recibe: recibe('ABRAZO', 'Y no me suelto en una semana 😅', { pose: 'ABRAZO', cara: 'feliz' }) },
  { id: 'apretadito', nombre: 'un abrazo apretadito', da: da('ABRAZO', 'Apretadito, apretadito 🤗', { pose: 'ABRAZO', cara: 'feliz', temblor: 0.015 }), recibe: recibe('ABRAZO', 'Cinco minuticos más 🥺', { pose: 'ABRAZO', cara: 'feliz' }) },
  { id: 'seguro', nombre: 'un abrazo de lugar seguro', da: da('ABRAZO', 'Aquí no te pasa nada 🤍', { pose: 'ABRAZO', cara: 'feliz' }), recibe: recibe('ABRAZO', 'Mi lugar seguro 🥹', { pose: 'ABRAZO', cara: 'feliz' }) },
  { id: 'brinco', nombre: 'un abrazo con brinquito', da: da('ABRAZO', '¡Te extrañé un montón! 💞', BRINCO), recibe: recibe('ABRAZO', '¡Yeiii! 🎉', BRINCO) },
  { id: 'llamada', nombre: 'un abrazo de los que no caben en una llamada', da: da('ABRAZO', 'Esto no se puede por el celular 📱', { pose: 'ABRAZO', cara: 'feliz' }), recibe: recibe('ABRAZO', 'Ni con la mejor señal del mundo 🥺', { pose: 'ABRAZO', cara: 'feliz' }) },
  { id: 'rompecabezas', nombre: 'un abrazo de rompecabezas', da: da('ABRAZO', 'Lo que a ti te falta lo tengo yo 🧩', { pose: 'ABRAZO', cara: 'feliz' }), recibe: recibe('ABRAZO', '…y al revés. Encajamos perfecto ✨', { pose: 'ABRAZO', cara: 'guino' }) },
  { id: 'silencioso', nombre: 'un abrazo calladito', da: da('ABRAZO', 'Shhh… abrazo calladito 🤫', { pose: 'ABRAZO', cara: 'dormido' }), recibe: recibe('ABRAZO', '…zzz 😴', { pose: 'ABRAZO', cara: 'dormido' }) },
  // Los de Él
  { id: 'invitada', de: 'el', nombre: 'un abrazo de invitación', da: da('ABRAZO', 'Donde yo voy, tú estás invitada 😋', { pose: 'ABRAZO', cara: 'guino' }), recibe: recibe('ABRAZO', '¡Me apunto a todo! 🙋‍♀️', APLAUSO) },
  { id: 'pulga', de: 'el', nombre: 'un abrazo de rescate', da: da('ABRAZO', '¿Qué aventura hiciste hoy, pulga aventurera? 🐜', { pose: 'ABRAZO', cara: 'sorprendido' }), recibe: recibe('ABRAZO', 'Mejor ni te cuento 🙈', TIMIDO) },
  { id: 'orgulloso', de: 'el', nombre: 'un abrazo de orgullo', da: da('ABRAZO', 'Estoy orgulloso de ti, nunca lo olvides ❤️', { pose: 'ABRAZO', cara: 'feliz' }), recibe: recibe('ABRAZO', 'Y yo de ti, mi niño 🤍', { pose: 'ABRAZO', cara: 'feliz' }) },
  { id: 'cobija', de: 'el', nombre: 'un abrazo de cobija', da: da('ABRAZO', 'Ven, que te caliento 🧣', { pose: 'ABRAZO', cara: 'presumido' }), recibe: recibe('ABRAZO', '¡Qué rico calorcito! 🥰', { pose: 'ABRAZO', cara: 'feliz' }) },
  // Los de Ella
  { id: 'lanudo', de: 'ella', nombre: 'un abrazo de perro lanudo', da: da('ABRAZO', '¡Mi perro lanudo! 🐶', { pose: 'ABRAZO', cara: 'carcajada' }), recibe: recibe('ABRAZO', 'Guau 🐶… digo, te amo', RISITA) },
  { id: 'panda', de: 'ella', nombre: 'un abrazo de panda', da: da('ABRAZO', 'Mi panda abrazable 🐼', { pose: 'ABRAZO', cara: 'feliz' }), recibe: recibe('ABRAZO', 'Abrazable y gordito 🐼', PRESUME) },
  { id: 'nodejes', de: 'ella', nombre: 'un abrazo de los largos', da: da('ABRAZO', 'Quiero una vida entera a tu lado 🤍', { pose: 'ABRAZO', cara: 'feliz' }), recibe: recibe('ABRAZO', 'Y yo nunca te dejo ir ❤️', { pose: 'ABRAZO', cara: 'feliz' }) },
  { id: 'pilar', de: 'ella', nombre: 'un abrazo de equipo', da: da('ABRAZO', 'Contigo la vida se hace liviana ✨', { pose: 'ABRAZO', cara: 'feliz' }), recibe: recibe('ABRAZO', 'Para eso estoy, esposa 💪', { pose: 'musculo', cara: 'presumido' }) },
];

const CARICIAS: VarianteMimo[] = [
  { id: 'cachete', nombre: 'un pellizquito de cachete', da: da('acariciar', 'Ese cachete es mío 😌', PRESUME), recibe: recibe('recibir_caricia', 'Auch… otra vez 🥺', { pose: 'puchero', cara: 'puchero' }) },
  { id: 'pelo', nombre: 'una caricia en el pelo', da: da('acariciar', 'Pelito suavecito ✨', { pose: 'acariciar', cara: 'feliz' }), recibe: recibe('recibir_caricia', 'Me voy a quedar dormido|dormida así 😴', { pose: 'bostezo', cara: 'bostezo' }) },
  { id: 'espalda', nombre: 'una rascadita de espalda', da: da('acariciar', 'Rascadita de espalda 💆', { pose: 'acariciar', cara: 'concentrado' }), recibe: recibe('recibir_caricia', 'Más arribita… ahí, ahí 😌', { pose: 'recibir_caricia', cara: 'feliz' }) },
  { id: 'descansaste', nombre: 'una caricia de «¿descansaste?»', da: da('acariciar', '¿Descansaste, mi vida? 😴', { pose: 'feliz', cara: 'feliz' }), recibe: recibe('recibir_caricia', 'Contigo, sí 🥰', TIMIDO) },
  { id: 'meama', nombre: 'una caricia con pregunta', da: da('acariciar', '¿Me amas? 🥺', { pose: 'suplicar', cara: 'triste' }), recibe: recibe('recibir_caricia', 'Shi 🥰', { pose: 'feliz', cara: 'feliz' }) },
  { id: 'heladito', nombre: 'un heladito imaginario', da: da('acariciar', 'Te traje un heladito 🍦', { pose: 'feliz', cara: 'guino' }), recibe: recibe('feliz', '¡Yeiii! 😋', BRINCO) },
  { id: 'cuidar', nombre: 'una caricia de «yo te cuido»', da: da('acariciar', 'Hoy te cuido yo 🩹', { pose: 'acariciar', cara: 'feliz' }), recibe: recibe('recibir_caricia', 'Gracias por cuidarme 🤍', TIMIDO) },
  { id: 'nariz', nombre: 'un toquecito en la nariz', da: da('acariciar', '¡Pip! 👆', RISITA), recibe: recibe('boca_abierta', '¡Oye! 😆', RISITA, 'sorprendido') },
  // Los de Él
  { id: 'cotita', de: 'el', nombre: 'una caricia a la cotita', da: da('acariciar', 'La cotita más hermota de este mundo 🥰', { pose: 'acariciar', cara: 'feliz' }), recibe: recibe('recibir_caricia', 'Ay deos 🙈', TIMIDO) },
  { id: 'mimilona', de: 'el', nombre: 'mimos de mimilona', da: da('acariciar', 'Ay, mi mimilona :3', { pose: 'acariciar', cara: 'feliz' }), recibe: recibe('recibir_caricia', 'Más mimos o me pongo brava 😤', { pose: 'jarras', cara: 'puchero' }) },
  { id: 'manos', de: 'el', nombre: 'una caricia de manos', da: da('acariciar', 'Tus manos chiquitas en las mías 🤲', { pose: 'acariciar', cara: 'feliz' }), recibe: recibe('recibir_caricia', '¿Chiquitas? ¡Son normales! 😤', { pose: 'puchero', cara: 'puchero' }) },
  { id: 'pantalla', de: 'el', nombre: 'una caricia de fondo de pantalla', da: da('acariciar', 'Ya eres mi fondo de pantalla 📱', PRESUME), recibe: recibe('recibir_caricia', '¡Pero en la foto bonita! 😳', { pose: 'boca_abierta', cara: 'sorprendido' }) },
  // Los de Ella
  { id: 'nino', de: 'ella', nombre: 'una caricia de «mi niño»', da: da('acariciar', 'Mi niño bonito 🤍', { pose: 'acariciar', cara: 'feliz' }), recibe: recibe('recibir_caricia', 'Así sí :3', { pose: 'feliz', cara: 'feliz' }) },
  { id: 'cosita', de: 'ella', nombre: 'una caricia de cosita preciosa', da: da('acariciar', 'Cosita preciosa ✨', { pose: 'acariciar', cara: 'feliz' }), recibe: recibe('recibir_caricia', 'Tu cosita 😚', TIMIDO) },
  { id: 'sonrisa', de: 'ella', nombre: 'una caricia de sonrisa', da: da('acariciar', '¿Y esa sonrisita? 🤭', { pose: 'jarras', cara: 'guino' }), recibe: recibe('recibir_caricia', 'Es que estás aquí 😊', TIMIDO) },
  { id: 'pensando', de: 'ella', nombre: 'una caricia de «estaba pensando en ti»', da: da('acariciar', 'Estaba pensando en ti 🤍', { pose: 'feliz', cara: 'feliz' }), recibe: recibe('recibir_caricia', 'Yo siempre pienso en ti 🥺', TIMIDO) },
];

export const VARIANTES: Record<TipoCarino, VarianteMimo[]> = { beso: BESOS, abrazo: ABRAZOS, caricia: CARICIAS };

/** Los que puede dar este rol. */
const posibles = (tipo: TipoCarino, de: Rol) => VARIANTES[tipo].filter((v) => !v.de || v.de === de);

const CLAVE = 'nuestro-hogar-mimos';

/** Escoge el siguiente mimo de la bolsa (sin repetir hasta que salgan todos; nunca el mismo dos veces seguidas). */
export function escogerMimo(tipo: TipoCarino, de: Rol): VarianteMimo {
  const lista = posibles(tipo, de);
  let bolsas: Record<string, { quedan: string[]; ultimo?: string }> = {};
  try {
    bolsas = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') ?? {};
  } catch {
    /* sin almacenamiento: al azar */
  }
  const k = `${de}-${tipo}`;
  const b = bolsas[k] ?? { quedan: [] };
  let quedan = b.quedan.filter((id) => lista.some((v) => v.id === id));
  if (!quedan.length) {
    quedan = lista.map((v) => v.id).filter((id) => id !== b.ultimo);
    if (!quedan.length) quedan = lista.map((v) => v.id);
  }
  const id = quedan[Math.floor(Math.random() * quedan.length)];
  bolsas[k] = { quedan: quedan.filter((x) => x !== id), ultimo: id };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(bolsas));
  } catch {
    /* sin almacenamiento */
  }
  return lista.find((v) => v.id === id) ?? lista[0];
}

/** El mimo que mandó el otro (por su id); null si no se conoce (de una versión vieja: el mimo de siempre). */
export function mimoDe(tipo: TipoCarino, id: unknown): VarianteMimo | null {
  return VARIANTES[tipo]?.find((v) => v.id === id) ?? null;
}

/** Lo que dice al saludar con la mano: los saludos de todos los días en su chat. */
export const SALUDOS: Record<Rol, string[]> = {
  el: ['¿Cómo amaneció el amor de mi vida? ❤️', 'Dime esposa :3', '¡Hola, mimilona! 👋', '¿Descansaste, esposa?', 'Esposa mía, ¿qué haces? :v', '¿Cómo vas, mi vida?', 'Holi, cotita 👋', 'Yei, ya llegué :D'],
  ella: ['Hi baby 👋', 'Holi, mi bb 🤍', 'Hola, mi niño hermoso', '¿Cómo vas, amor?', 'Mor, ¿qué haces?', '¡Hi, esposo! 🥰', 'Okis, ya volví', 'Hola, perro lanudo 🐶'],
};
let ultimoSaludo = -1;

/** Un saludo al azar (nunca el mismo dos veces seguidas); el número va con el evento para que el otro vea el mismo. */
export function escogerSaludo(rol: Rol): number {
  const n = SALUDOS[rol].length;
  let i = Math.floor(Math.random() * n);
  if (i === ultimoSaludo) i = (i + 1) % n;
  ultimoSaludo = i;
  return i;
}
