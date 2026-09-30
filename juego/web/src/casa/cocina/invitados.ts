// Los invitados que llegan a comer a la cocina de chef: familia, vecinos y amigos (los mismos muñequitos del súper)
// y, de vez en cuando, la pareja. Cada uno tiene su paciencia, qué tan buena propina deja y sus frases.
import type { Rol } from '../modelo';

export type Animo = 'feliz' | 'espera' | 'bravo' | 'encantado';

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
  /** Ruta de sus recortes: `${ruta}_${animo}.webp`. */
  ruta: string;
}

const I = (id: string, nombre: string, desde: number, paciencia: number, propina: number, saludos: string[], especial?: Invitado['especial']): Invitado =>
  ({ id, nombre, desde, paciencia, propina, saludos, especial, ruta: `./cocina/${id}` });

export const INVITADOS: Invitado[] = [
  I('abuelita', 'Abuela Rosa', 1, 1.35, 1.2, ['¡Mijo|Mija, qué olorcito tan rico!', 'Vengo con un hambre de viaje…', 'A ver qué me tiene hoy, mi chef']),
  I('mama', 'Tía Marta', 1, 1.1, 1, ['¡Uy, qué belleza de cocina!', 'Me dijeron que aquí se come delicioso', 'Hola, hola… ¿qué hay de bueno?']),
  I('adolescente', 'Primo Santi', 1, 0.85, 0.8, ['Quiubo, parce… tengo un hambre…', 'Rápido que tengo partido', '¿Aquí regalan comida? Jajaja']),
  I('deportista', 'Vale la del gym', 1, 0.95, 1, ['¡Hoy es día libre, hoy sí como!', 'Después del gym me lo merezco', 'Hola, ¿qué me recomiendas?']),
  I('nina', 'Sobrinita Luci', 2, 0.8, 0.8, ['¡Tío|Tía, tío|tía! ¡Tengo hambre!', 'Yo quiero algo con mucho dulce', '¿Me haces algo rico?']),
  I('cajera', 'Doña Rubi, la vecina', 3, 1.2, 1.1, ['Vecino|Vecina, ¡qué rico huele desde mi casa!', 'Pasaba por aquí y me antojé', 'Buenas, buenas…']),
  I('reponedor', 'Pacho, el del colegio', 4, 1, 1, ['¡Mi llave! Vine a probar su sazón', 'Ey, ¿se acuerda del colegio?', 'Bueno, a ver si es verdad que cocina']),
  I('ladron', 'El vecino misterioso', 5, 1, 1.3, ['…', 'Shhh… nadie me vio entrar', 'Vengo en secreto: ¿qué hay?']),
  I('guardia', 'Don Jairo, el portero', 6, 1.15, 1.1, ['Buenas, don|doña chef, ¿cómo va la cosa?', 'Me dejé antojar por el olor', 'Un descansito del turno…']),
  I('aseo', 'Nelly, la del trabajo', 7, 1, 1, ['¡Amiga|Amigo! Vine como te prometí', 'Qué lindo tu restaurante', 'Tengo media hora de almuerzo…']),
  I('ejecutivo', 'Don Hernán', 8, 0.7, 1.5, ['Tengo una reunión en diez minutos', 'Rapidito, por favor', 'Lo de siempre… pero bien hecho']),
  I('famoso', 'El crítico famoso', 9, 0.9, 3, ['Vengo a ver si es cierto lo que dicen…', 'Mi paladar es muy exigente', 'Sorpréndame'], 'critico'),
];

/** La pareja como invitada (sus recortes son los de los recuerdos). */
export function invitadoPareja(rol: Rol, nombre: string): Invitado {
  return {
    id: `pareja_${rol}`, nombre, desde: 1, paciencia: 1.6, propina: 2, especial: 'pareja', ruta: `./recuerdos/${rol}`,
    saludos: ['¡Vine a ver a mi chef favorito|favorita! 💖', 'Mmm… me dijeron que aquí cocina alguien muy lindo|linda', '¿Me atiendes con amor?'],
  };
}
/** Qué pose de los recuerdos va con cada ánimo de la pareja. */
export const POSE_PAREJA: Record<Animo, string> = { feliz: 'feliz', espera: 'piensa', bravo: 'puchero', encantado: 'celebra' };

export const FRASES: Record<'encantado' | 'feliz' | 'normal' | 'bravo' | 'apurado', string[]> = {
  encantado: ['¡Uy, qué delicia!', '¡Esto sí es de chef!', '¡Me quedó sonando!', '¡Diez de diez!', '¡Está buenísimo, parce!', '¡Qué cosa tan rica!', '¡Vuelvo mañana!'],
  feliz: ['¡Muy rico, gracias!', 'Rico, rico', 'Me gustó mucho', '¡Qué bueno!', 'Muy bien hecho'],
  normal: ['Está bien…', 'Normalito', 'Le faltó un poquito', 'Mmm… pasable'],
  bravo: ['¿Y esto qué es?', 'Uy no…', 'Esto no fue lo que pedí', 'Mmm… no', '¿En serio?'],
  apurado: ['¿Ya casi?', 'Tengo hambre…', '¿Se demora mucho?', 'Mmm…'],
};
export const FRASES_PAREJA: Record<'encantado' | 'feliz' | 'normal' | 'bravo', string[]> = {
  encantado: ['¡Hecho con amor se nota! 💖', '¡Mi chef favorito|favorita!', '¡Te amo y amo esto!', '¡Me casaría otra vez contigo por esto!'],
  feliz: ['¡Qué rico, mi amor!', 'Gracias, amor 💕', '¡Me encantó!'],
  normal: ['Te quedó… bien, amor 😅', 'Con amor todo sabe rico', 'Lo importante es la intención'],
  bravo: ['Amor… ¿qué pasó aquí? 😂', 'Te perdono porque te amo', 'Mejor pedimos domicilio… mentiras 😘'],
};

/** Los invitados de un día: más a medida que suben los días, y los nuevos aparecen con el rango. */
export function invitadosDelDia(dia: number, rango: number, pareja: Invitado, azar: () => number): Invitado[] {
  const n = Math.min(10, 2 + Math.ceil(dia * 0.55));
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
  if (dia % 3 === 0 || dia === 2) lista.splice(Math.max(1, lista.length - 1), 0, pareja);
  return lista;
}
