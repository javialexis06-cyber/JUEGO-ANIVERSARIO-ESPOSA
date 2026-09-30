// Trofeos de los minijuegos: cada juego da bronce, plata y oro según lo mejor de los dos (estrellas del súper,
// puertas abiertas, partidas de mesa ganadas, segundos en el retrete espacial, gérmenes de una lavada y el rango de
// chef). La copa del amor tiene el metal del trofeo más bajito: para que sea de oro hay que brillar en todo.
// Cada uno se gana además un título en cada juego (el de la pareja es el de lo mejor de los dos).
import { RECETAS, nombreRango, rangoDe } from './cocina/tipos';
import type { Casa, Logros, Rol } from './modelo';

export type IdTrofeo = 'super' | 'puertas' | 'mesa' | 'retrete' | 'lavado' | 'cocina';
export type Nivel = 0 | 1 | 2 | 3;

export interface Trofeo {
  id: IdTrofeo;
  nombre: string;
  unidad: string;
  metas: [number, number, number];
  /** El título según el metal (sin ganar, bronce, plata, oro). */
  titulos: [string, string, string, string];
  /** Color de la placa de su pedestal. */
  color: string;
}

export const TROFEOS: Trofeo[] = [
  { id: 'super', nombre: 'Súper Manía', unidad: 'estrellas', metas: [5, 25, 60], color: '#E4574B', titulos: ['En práctica', 'Estrella de la caja', 'Gerente del barrio', 'Leyenda del súper'] },
  { id: 'puertas', nombre: 'Cien Puertas', unidad: 'puertas abiertas', metas: [10, 50, 100], color: '#8E6FD1', titulos: ['Curiosidad pura', 'Alma exploradora', 'Mente cerrajera', 'Leyenda de las 100 puertas'] },
  { id: 'mesa', nombre: 'Juegos de mesa', unidad: 'partidas ganadas', metas: [1, 10, 30], color: '#4FB477', titulos: ['Aprendiz de la mesa', 'Rival de cuidado', 'Mente estratega', 'Leyenda de la mesa'] },
  { id: 'retrete', nombre: 'Retrete espacial', unidad: 'segundos en el espacio', metas: [15, 45, 90], color: '#4A90D9', titulos: ['Astronauta en pañales', 'Piloto del retrete', 'Comandante espacial', 'Leyenda galáctica'] },
  { id: 'lavado', nombre: 'Lavarse la cara', unidad: 'gérmenes en una lavada', metas: [80, 300, 700], color: '#35B6C4', titulos: ['Carita sucia', 'Carita limpia', 'Terror de los gérmenes', 'Piel de porcelana'] },
  // Los títulos de la cocina son los rangos de chef (van de Aprendiz a Leyenda de la cocina)
  { id: 'cocina', nombre: 'Cocina de chef', unidad: 'rango de chef', metas: [3, 6, 9], color: '#F29B38', titulos: ['Aprendiz', 'Cocinero de casa', 'Chef de la cuadra', 'Chef reconocido'] },
];
export const METAL = ['Sin ganar', 'Bronce', 'Plata', 'Oro'] as const;
/** Los títulos de la pareja según la copa del amor. */
export const TITULOS_AMOR = ['Pareja en práctica', 'Pareja que brilla', 'Pareja de campeones', 'Pareja legendaria'] as const;
/** Monedas que da cada metal la primera vez que se gana. */
export const PREMIO_TROFEO = [0, 5, 10, 20];

/** Lo de cada uno en un juego. */
export function valorDe(c: Casa, id: IdTrofeo, r: Rol): number {
  if (id === 'retrete') return Math.floor(c.retrete?.[r] ?? 0);
  if (id === 'lavado') return Math.floor(c.lavado?.[r] ?? 0);
  if (id === 'cocina') {
    // El rango del restaurante donde mejor le va (0 si todavía no ha cocinado)
    const p = c.cocina?.[r];
    return p ? Math.max(0, ...RECETAS.map((k) => (p[k] ? rangoDe(p[k]!.xp) : 0))) : 0;
  }
  return c.logros?.[r]?.[id] ?? 0;
}

/** Lo mejor de los dos (el trofeo es de la pareja). */
export const valor = (c: Casa, id: IdTrofeo) => Math.max(valorDe(c, id, 'el'), valorDe(c, id, 'ella'));

const trofeo = (id: IdTrofeo) => TROFEOS.find((t) => t.id === id)!;
const nivelDeValor = (id: IdTrofeo, v: number) => trofeo(id).metas.filter((m) => v >= m).length as Nivel;

export const nivel = (c: Casa, id: IdTrofeo): Nivel => nivelDeValor(id, valor(c, id));

/** El metal de lo de cada uno (para su vitrina). */
export const nivelDe = (c: Casa, id: IdTrofeo, r: Rol): Nivel => nivelDeValor(id, valorDe(c, id, r));

/** El título que da un puntaje en un juego. */
function tituloDeValor(id: IdTrofeo, v: number) {
  if (v <= 0) return 'Sin estrenar';
  if (id === 'cocina') return nombreRango(v);
  return trofeo(id).titulos[nivelDeValor(id, v)];
}
/** El título de cada uno en un juego. */
export const tituloDe = (c: Casa, id: IdTrofeo, r: Rol) => tituloDeValor(id, valorDe(c, id, r));
/** El título de la pareja en un juego (el de lo mejor de los dos). */
export const titulo = (c: Casa, id: IdTrofeo) => tituloDeValor(id, valor(c, id));

/** Cómo se dice un puntaje (el rango de chef se dice con su número). */
export const cuenta = (id: IdTrofeo, v: number) => (id === 'cocina' ? `rango ${v}` : `${v} ${trofeo(id).unidad}`);

export const niveles = (c: Casa) => Object.fromEntries(TROFEOS.map((t) => [t.id, nivel(c, t.id)])) as Record<IdTrofeo, Nivel>;

export const nivelAmor = (c: Casa): Nivel => Math.min(...TROFEOS.map((t) => nivel(c, t.id))) as Nivel;

/** Lo que muestra la sala de trofeos: el metal de cada pedestal, la copa del amor, las placas con los títulos y lo
 *  de cada uno (para el cuadro de honor y la vitrina). */
export interface SalaTrofeos {
  niveles: Record<IdTrofeo | 'amor', Nivel>;
  tituloAmor: string;
  juegos: {
    id: IdTrofeo;
    nombre: string;
    color: string;
    titulo: string;
    de: Record<Rol, { valor: number; nivel: Nivel; titulo: string; cuenta: string }>;
  }[];
}

export function salaTrofeos(c: Casa): SalaTrofeos {
  const amor = nivelAmor(c);
  const de = (id: IdTrofeo, r: Rol) => {
    const v = valorDe(c, id, r);
    return { valor: v, nivel: nivelDe(c, id, r), titulo: tituloDe(c, id, r), cuenta: cuenta(id, v) };
  };
  return {
    niveles: { ...niveles(c), amor },
    tituloAmor: TITULOS_AMOR[amor],
    juegos: TROFEOS.map((t) => ({ id: t.id, nombre: t.nombre, color: t.color, titulo: titulo(c, t.id), de: { el: de(t.id, 'el'), ella: de(t.id, 'ella') } })),
  };
}

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
