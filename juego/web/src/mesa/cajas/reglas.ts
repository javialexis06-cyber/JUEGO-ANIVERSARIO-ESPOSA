// Puntos y Cajas: reglas puras. Tablero de filas×columnas cajas ((filas+1)×(columnas+1) puntos).
// Cada línea une dos puntos vecinos; primero van las horizontales (filas+1 filas de `columnas`) y luego las
// verticales (`filas` filas de columnas+1). Quien pone la cuarta línea de una caja se la lleva y vuelve a jugar.
import { otro, type Rol } from '../../casa/modelo';
import type { Final, Reglas } from '../tipos';

export interface EstadoCajas {
  filas: number;
  columnas: number;
  /** Quién trazó cada línea (null = libre). */
  lineas: (Rol | null)[];
  /** Dueño de cada caja (null = abierta), por filas. */
  cajas: (Rol | null)[];
  turno: Rol;
  /** La última línea trazada (-1 al empezar), para resaltarla al retomar. */
  ultima: number;
}

/** Trazar la línea número `l`. */
export interface MovCajas {
  l: number;
}

/** 5×5 cajas (6×6 puntos): cabe bien en el celular y no hay empates. */
export const TAMANO = 5;

export interface Geometria {
  filas: number;
  columnas: number;
  /** Número de líneas y de cajas. */
  nl: number;
  nc: number;
  /** Cuántas líneas horizontales hay (las verticales van después). */
  nh: number;
  /** Las cajas que toca cada línea (1 en el borde, 2 adentro). */
  cajasDe: number[][];
  /** Las 4 líneas de cada caja: arriba, abajo, izquierda, derecha. */
  lineasDe: number[][];
  /** Los dos puntos de cada línea: [fila, columna, fila, columna]. */
  puntos: [number, number, number, number][];
}

const geometrias = new Map<string, Geometria>();

/** Tablas del tablero (se arman una vez por tamaño). */
export function geometria(filas: number, columnas: number): Geometria {
  const clave = `${filas}x${columnas}`;
  const hecha = geometrias.get(clave);
  if (hecha) return hecha;
  const nh = (filas + 1) * columnas;
  const nl = nh + filas * (columnas + 1);
  const nc = filas * columnas;
  const cajasDe: number[][] = [];
  const puntos: Geometria['puntos'] = [];
  for (let r = 0; r <= filas; r++)
    for (let c = 0; c < columnas; c++) {
      const cs: number[] = [];
      if (r > 0) cs.push((r - 1) * columnas + c);
      if (r < filas) cs.push(r * columnas + c);
      cajasDe.push(cs);
      puntos.push([r, c, r, c + 1]);
    }
  for (let r = 0; r < filas; r++)
    for (let c = 0; c <= columnas; c++) {
      const cs: number[] = [];
      if (c > 0) cs.push(r * columnas + c - 1);
      if (c < columnas) cs.push(r * columnas + c);
      cajasDe.push(cs);
      puntos.push([r, c, r + 1, c]);
    }
  const lineasDe: number[][] = [];
  for (let r = 0; r < filas; r++)
    for (let c = 0; c < columnas; c++) {
      const izq = nh + r * (columnas + 1) + c;
      lineasDe.push([r * columnas + c, (r + 1) * columnas + c, izq, izq + 1]);
    }
  const g: Geometria = { filas, columnas, nl, nc, nh, cajasDe, lineasDe, puntos };
  geometrias.set(clave, g);
  return g;
}

export const geo = (e: EstadoCajas) => geometria(e.filas, e.columnas);

/** Cuántos lados trazados tiene la caja `b`. */
export function lados(e: EstadoCajas, b: number, g = geo(e)): number {
  let n = 0;
  for (const l of g.lineasDe[b]) if (e.lineas[l]) n++;
  return n;
}

/** Cajas abiertas con tres lados: las que se cierran con una sola línea. */
export function listas(e: EstadoCajas): number[] {
  const g = geo(e);
  const r: number[] = [];
  for (let b = 0; b < g.nc; b++) if (!e.cajas[b] && lados(e, b, g) === 3) r.push(b);
  return r;
}

/** ¿La línea libre `l` no le deja a nadie una caja con tres lados? */
export function esSegura(e: EstadoCajas, l: number, g = geo(e)): boolean {
  return !e.lineas[l] && g.cajasDe[l].every((b) => lados(e, b, g) < 2);
}

export const haySegura = (e: EstadoCajas) => e.lineas.some((_, l) => esSegura(e, l));

/**
 * Cuántas cajas se lleva el que juega después de trazar `l` si se come todo lo que le queda servido
 * (cuánto regala la línea; 0 si es segura o si cierra algo el mismo que la traza).
 */
export function regalo(e: EstadoCajas, l: number): number {
  let x = reglas.aplicar(e, { l });
  if (x.turno === e.turno) return 0;
  let n = 0;
  for (;;) {
    const lista = listas(x);
    if (!lista.length) return n;
    const g = geo(x);
    const libre = g.lineasDe[lista[0]].find((k) => !x.lineas[k])!;
    const antes = x.cajas.filter(Boolean).length;
    x = reglas.aplicar(x, { l: libre });
    n += x.cajas.filter(Boolean).length - antes;
  }
}

export const reglas: Reglas<EstadoCajas, MovCajas> = {
  inicial(empieza) {
    const g = geometria(TAMANO, TAMANO);
    return { filas: g.filas, columnas: g.columnas, lineas: Array(g.nl).fill(null), cajas: Array(g.nc).fill(null), turno: empieza, ultima: -1 };
  },
  turno: (e) => e.turno,
  movimientos(e) {
    const r: MovCajas[] = [];
    e.lineas.forEach((x, l) => x || r.push({ l }));
    return r;
  },
  aplicar(e, m) {
    const g = geo(e);
    const l = m?.l;
    if (!Number.isInteger(l) || l < 0 || l >= g.nl || e.lineas[l]) throw new Error(`Puntos y Cajas: línea inválida ${l}`);
    const lineas = e.lineas.slice();
    lineas[l] = e.turno;
    const cajas = e.cajas.slice();
    let cerro = false;
    for (const b of g.cajasDe[l])
      if (g.lineasDe[b].every((k) => lineas[k])) {
        cajas[b] = e.turno;
        cerro = true;
      }
    return { ...e, lineas, cajas, turno: cerro ? e.turno : otro(e.turno), ultima: l };
  },
  puntos(e) {
    const p: Record<Rol, number> = { el: 0, ella: 0 };
    for (const d of e.cajas) if (d) p[d]++;
    return p;
  },
  fin(e): Final | null {
    if (e.lineas.some((x) => !x)) return null;
    const puntos = reglas.puntos(e);
    return { ganador: puntos.el > puntos.ella ? 'el' : puntos.ella > puntos.el ? 'ella' : null, puntos };
  },
};
