// Trofeos de los minijuegos: cada juego da bronce, plata y oro según lo mejor de los dos (estrellas del súper,
// puertas abiertas, partidas de mesa ganadas y segundos en el retrete espacial). La copa del amor tiene el metal
// del trofeo más bajito: para que sea de oro hay que brillar en todo.
import type { Casa, Logros, Rol } from './modelo';

export type IdTrofeo = 'super' | 'puertas' | 'mesa' | 'retrete';
export type Nivel = 0 | 1 | 2 | 3;

export const TROFEOS: { id: IdTrofeo; nombre: string; unidad: string; metas: [number, number, number] }[] = [
  { id: 'super', nombre: 'Súper Manía', unidad: 'estrellas', metas: [5, 25, 60] },
  { id: 'puertas', nombre: 'Cien Puertas', unidad: 'puertas abiertas', metas: [10, 50, 100] },
  { id: 'mesa', nombre: 'Juegos de mesa', unidad: 'partidas ganadas', metas: [1, 10, 30] },
  { id: 'retrete', nombre: 'Retrete espacial', unidad: 'segundos en el espacio', metas: [15, 45, 90] },
];
export const METAL = ['Sin ganar', 'Bronce', 'Plata', 'Oro'] as const;
/** Monedas que da cada metal la primera vez que se gana. */
export const PREMIO_TROFEO = [0, 5, 10, 20];

/** Lo de cada uno en un juego. */
export function valorDe(c: Casa, id: IdTrofeo, r: Rol): number {
  if (id === 'retrete') return Math.floor(c.retrete?.[r] ?? 0);
  return c.logros?.[r]?.[id] ?? 0;
}

/** Lo mejor de los dos (el trofeo es de la pareja). */
export const valor = (c: Casa, id: IdTrofeo) => Math.max(valorDe(c, id, 'el'), valorDe(c, id, 'ella'));

export function nivel(c: Casa, id: IdTrofeo): Nivel {
  const v = valor(c, id);
  const metas = TROFEOS.find((t) => t.id === id)!.metas;
  return (metas.filter((m) => v >= m).length as Nivel);
}

export const niveles = (c: Casa) => Object.fromEntries(TROFEOS.map((t) => [t.id, nivel(c, t.id)])) as Record<IdTrofeo, Nivel>;

export const nivelAmor = (c: Casa): Nivel => Math.min(...TROFEOS.map((t) => nivel(c, t.id))) as Nivel;

const leer = (k: string): any => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

export const CLAVE_VICTORIAS = 'nuestro-hogar-victorias';

/** Lo que se ha logrado en este celular: el súper y Cien Puertas guardan su progreso aquí; la mesa cuenta las victorias. */
export function logrosLocales(): Logros {
  const sup = leer('supermania-jugable1');
  let estrellas = 0;
  if (sup && typeof sup === 'object') {
    for (const v of Object.values(sup.estrellas ?? {})) if (Array.isArray(v)) estrellas += v.filter((x) => x === true).length;
    for (const v of Object.values(sup.lunas ?? {})) if (v === true) estrellas++;
  }
  const puertas = Math.max(0, Math.min(100, Math.floor(Number(leer('cien-puertas')?.hasta) || 0)));
  const mesa = Math.max(0, Math.floor(Number(leer(CLAVE_VICTORIAS)) || 0));
  return { super: estrellas, puertas, mesa };
}
