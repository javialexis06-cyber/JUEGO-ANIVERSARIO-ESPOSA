// La casona de «¿Quién fue?» en casillas: 24 × 16 (horizontal, como el celular). Nueve cuartos alrededor del sótano
// (donde está el sobre con la solución, no se entra), pasillos de baldosa entre ellos, puertas y los dos pasadizos
// secretos de las esquinas (Cocina ↔ Estudio, Patio ↔ Sala de TV), como en el Clue clásico.
import type { Rol } from '../../casa/modelo';

export const ANCHO = 24;
export const ALTO = 16;

export type IdCuarto = 'cocina' | 'salon' | 'patio' | 'juegos' | 'biblioteca' | 'estudio' | 'comedor' | 'salatv' | 'recibidor';

export interface Cuarto {
  id: IdCuarto;
  nombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Cada puerta: la casilla de pasillo que queda pegada (por ahí se entra y se sale). */
  puertas: [number, number][];
  /** El cuarto al que lleva el pasadizo secreto (solo las esquinas). */
  pasadizo?: IdCuarto;
}

export const CUARTOS: Cuarto[] = [
  { id: 'cocina', nombre: 'Cocina', x: 0, y: 0, w: 6, h: 4, puertas: [[4, 4], [6, 2]], pasadizo: 'estudio' },
  { id: 'salon', nombre: 'Salón de fiestas', x: 8, y: 0, w: 8, h: 4, puertas: [[7, 2], [9, 4], [14, 4], [16, 2]] },
  { id: 'patio', nombre: 'Patio de las matas', x: 18, y: 0, w: 6, h: 3, puertas: [[17, 1], [20, 3]], pasadizo: 'salatv' },
  { id: 'juegos', nombre: 'Cuarto de juegos', x: 18, y: 4, w: 6, h: 3, puertas: [[17, 5], [21, 7]] },
  { id: 'biblioteca', nombre: 'Biblioteca', x: 18, y: 8, w: 6, h: 3, puertas: [[17, 9], [20, 11]] },
  { id: 'estudio', nombre: 'Estudio', x: 18, y: 12, w: 6, h: 4, puertas: [[17, 13]], pasadizo: 'cocina' },
  { id: 'comedor', nombre: 'Comedor', x: 0, y: 6, w: 6, h: 4, puertas: [[2, 5], [6, 7], [3, 10]] },
  { id: 'salatv', nombre: 'Sala de TV', x: 0, y: 12, w: 6, h: 4, puertas: [[3, 11], [6, 13]], pasadizo: 'patio' },
  { id: 'recibidor', nombre: 'Recibidor', x: 8, y: 12, w: 8, h: 4, puertas: [[10, 11], [13, 11], [7, 14], [16, 14]] },
];
export const CUARTO = Object.fromEntries(CUARTOS.map((c) => [c.id, c])) as Record<IdCuarto, Cuarto>;
/** Los cuartos de las esquinas (los del pasadizo; ahí van las cartas boca abajo de la variante para dos). */
export const ESQUINAS: IdCuarto[] = ['cocina', 'patio', 'salatv', 'estudio'];

/** El sótano del centro: la escalera y el sobre (no se pisa). */
export const SOTANO = { x: 9, y: 6, w: 6, h: 4 };

/** Dónde arranca cada detective (la entrada de la casona, abajo). */
export const INICIO: Record<Rol, [number, number]> = { el: [7, 15], ella: [16, 15] };

const dentro = (r: { x: number; y: number; w: number; h: number }, x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

/** ¿Es una casilla de pasillo (se puede pisar)? */
export function pasillo(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= ANCHO || y >= ALTO) return false;
  if (dentro(SOTANO, x, y)) return false;
  return !CUARTOS.some((c) => dentro(c, x, y));
}

/** El cuarto que ocupa la casilla (o null). */
export function cuartoEn(x: number, y: number): Cuarto | null {
  return CUARTOS.find((c) => dentro(c, x, y)) ?? null;
}

/** Dónde está alguien: en un cuarto o en una casilla del pasillo. */
export type Lugar = { c: IdCuarto } | { x: number; y: number };
export const enCuarto = (l: Lugar): l is { c: IdCuarto } => 'c' in l;
export const mismoLugar = (a: Lugar, b: Lugar) => (enCuarto(a) ? enCuarto(b) && a.c === b.c : !enCuarto(b) && a.x === b.x && a.y === b.y);

/** Revisión del tablero: cada puerta da a un pasillo y queda pegada a su cuarto. */
export function revisarTablero(): string[] {
  const malos: string[] = [];
  for (const c of CUARTOS)
    for (const [x, y] of c.puertas) {
      if (!pasillo(x, y)) malos.push(`${c.id}: la puerta ${x},${y} no da a un pasillo`);
      const pegada = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cuartoEn(x + dx, y + dy)?.id === c.id);
      if (!pegada) malos.push(`${c.id}: la puerta ${x},${y} no toca el cuarto`);
    }
  for (const [x, y] of Object.values(INICIO)) if (!pasillo(x, y)) malos.push(`inicio ${x},${y} no es pasillo`);
  return malos;
}

const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/**
 * Hasta dónde se llega con `pasos` (Clue: adelante o de lado, nunca en diagonal; sin pasar por la casilla del otro
 * detective; entrar a un cuarto gasta un paso y termina el movimiento; desde un cuarto se sale por cualquier puerta).
 * Se puede parar en cualquier casilla a la que alcance (hasta `pasos`). No se vuelve al cuarto de donde salió.
 * Devuelve las casillas con su distancia y los cuartos a los que se puede entrar, con el camino de cada uno.
 */
export function alcance(desde: Lugar, pasos: number, ocupada: (x: number, y: number) => boolean) {
  const clave = (x: number, y: number) => y * ANCHO + x;
  const dist = new Map<number, number>();
  const previo = new Map<number, number>();
  const cola: [number, number][] = [];
  const salida = enCuarto(desde) ? desde.c : null;
  if (enCuarto(desde)) {
    for (const [x, y] of CUARTO[desde.c].puertas) {
      if (ocupada(x, y)) continue;
      dist.set(clave(x, y), 1);
      previo.set(clave(x, y), -1);
      cola.push([x, y]);
    }
  } else {
    dist.set(clave(desde.x, desde.y), 0);
    previo.set(clave(desde.x, desde.y), -1);
    cola.push([desde.x, desde.y]);
  }
  for (let k = 0; k < cola.length; k++) {
    const [x, y] = cola[k];
    const d = dist.get(clave(x, y))!;
    if (d >= pasos) continue;
    for (const [dx, dy] of VECINOS) {
      const nx = x + dx, ny = y + dy;
      if (!pasillo(nx, ny) || ocupada(nx, ny) || dist.has(clave(nx, ny))) continue;
      dist.set(clave(nx, ny), d + 1);
      previo.set(clave(nx, ny), clave(x, y));
      cola.push([nx, ny]);
    }
  }
  const camino = (x: number, y: number): [number, number][] => {
    const c: [number, number][] = [];
    for (let k = clave(x, y); k !== -1 && k !== undefined; k = previo.get(k)!) c.unshift([k % ANCHO, Math.floor(k / ANCHO)]);
    return c;
  };
  const casillas: { x: number; y: number; d: number }[] = [];
  for (const [k, d] of dist) if (d > 0) casillas.push({ x: k % ANCHO, y: Math.floor(k / ANCHO), d });
  const cuartos: { c: IdCuarto; d: number; camino: [number, number][] }[] = [];
  for (const c of CUARTOS) {
    if (c.id === salida) continue;
    let mejor: { d: number; camino: [number, number][] } | null = null;
    for (const [x, y] of c.puertas) {
      const d = dist.get(clave(x, y));
      if (d === undefined || d + 1 > pasos) continue;
      if (!mejor || d + 1 < mejor.d) mejor = { d: d + 1, camino: camino(x, y) };
    }
    if (mejor) cuartos.push({ c: c.id, ...mejor });
  }
  return { casillas, cuartos, camino };
}

/** Distancia (en pasos, sin dado) de un lugar a la puerta más cercana de un cuarto: para la IA. */
export function distanciaA(desde: Lugar, meta: IdCuarto, ocupada: (x: number, y: number) => boolean): number {
  if (enCuarto(desde) && desde.c === meta) return 0;
  if (enCuarto(desde) && CUARTO[desde.c].pasadizo === meta) return 1;
  const a = alcance(desde, 99, ocupada);
  return a.cuartos.find((c) => c.c === meta)?.d ?? 99;
}
