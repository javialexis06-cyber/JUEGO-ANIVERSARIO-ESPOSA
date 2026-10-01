// Los sonidos de los acertijos con eco: en pareja, lo que suena en el celular que aplica las reglas (el anfitrión)
// también suena en el otro (el timbre trabado, las lámparas, el dragón roncando…). Los acertijos y los sonidos
// propios de Cien Puertas usan este módulo en vez de ../sonido; la interfaz y el narrador siguen con el original
// (cada celular hace sus propios clics).
import * as base from '../sonido';

let eco: ((f: string, a: unknown[]) => void) | null = null;

/** En pareja (anfitrión): cada sonido de un acertijo se manda también al otro celular. */
export function ponerEco(fn: ((f: string, a: unknown[]) => void) | null) {
  eco = fn;
}

const SONIDOS = { nota: base.nota, rumor: base.rumor, toque: base.toque, caja: base.caja, campana: base.campana, corazon: base.corazon, mordisco: base.mordisco, regalo: base.regalo, bostezo: base.bostezo, repuesto: base.repuesto, vacia: base.vacia, atrapado: base.atrapado, aviso: base.aviso, beso: base.beso } as const;
type Nombre = keyof typeof SONIDOS;

function envolver<K extends Nombre>(nombre: K): (typeof SONIDOS)[K] {
  const f = SONIDOS[nombre] as unknown as (...a: unknown[]) => unknown;
  return ((...a: unknown[]) => {
    eco?.(nombre, a);
    return f(...a);
  }) as unknown as (typeof SONIDOS)[K];
}

export const nota = envolver('nota');
export const rumor = envolver('rumor');
export const toque = envolver('toque');
export const caja = envolver('caja');
export const campana = envolver('campana');
export const corazon = envolver('corazon');
export const mordisco = envolver('mordisco');
export const regalo = envolver('regalo');
export const bostezo = envolver('bostezo');
export const repuesto = envolver('repuesto');
export const vacia = envolver('vacia');
export const atrapado = envolver('atrapado');
export const aviso = envolver('aviso');
export const beso = envolver('beso');

/** Suena aquí lo que sonó en el otro celular. */
export function sonar(nombre: string, a: unknown[]) {
  const f = SONIDOS[nombre as Nombre] as unknown as ((...x: unknown[]) => unknown) | undefined;
  if (typeof f === 'function') f(...(Array.isArray(a) ? a : []));
}

