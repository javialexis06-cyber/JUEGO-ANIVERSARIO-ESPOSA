// El progreso de los minijuegos que se guarda en el aparato (el súper, Cien Puertas, las victorias de la mesa y las
// escenas compradas) también vive en la casa compartida (`casa.progreso[rol]`): así el mismo Javier o la misma Laura
// lo tiene en cualquier aparato donde entre con su cuenta. Los minijuegos siguen leyendo y escribiendo su copia del
// aparato (abren rápido y sirven sin internet); la casa las junta con la nube al abrir y al volver de un minijuego.
// Si dos aparatos avanzaron por separado, se juntan sin perder nada: estrellas, lunas, puertas, victorias, escenas.
// (La cocina, Lavarse la cara, el retrete espacial y Sangre y Ceniza ya guardan directo en la casa.)
import type { Rol } from './modelo';

export interface CopiaNube {
  /** Lo guardado, tal cual lo deja el minijuego en el aparato. */
  v: string;
  t: number;
}
type Juntar = (a: string, b: string) => string;

const json = (s: string): any => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};
const esObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
/** Por cada llave, el número más alto de los dos. */
function maximos(a: unknown, b: unknown): Record<string, number> {
  const r: Record<string, number> = {};
  for (const o of [a, b]) if (esObj(o)) for (const [k, v] of Object.entries(o)) if (typeof v === 'number' && Number.isFinite(v)) r[k] = Math.max(r[k] ?? 0, v);
  return r;
}
/** Por cada llave, «sí» si en alguno de los dos dice que sí. */
function banderas(a: unknown, b: unknown): Record<string, boolean> {
  const r: Record<string, boolean> = {};
  for (const o of [a, b]) if (esObj(o)) for (const [k, v] of Object.entries(o)) if (v === true) r[k] = true;
  return r;
}

const maximo: Juntar = (a, b) => String(Math.max(Number(a) || 0, Number(b) || 0));
const union: Juntar = (a, b) => {
  const lista = (s: string) => (Array.isArray(json(s)) ? (json(s) as unknown[]).filter((x): x is string => typeof x === 'string') : []);
  return JSON.stringify([...new Set([...lista(a), ...lista(b)])]);
};

/** Súper Manía: estrellas, lunas y corazones de los dos lados; mejoras y sitios al nivel más alto; la plata y las
 *  ayudas del aparato que va más adelante. */
const juntarSuper: Juntar = (a, b) => {
  const x = json(a), y = json(b);
  if (!esObj(x)) return b;
  if (!esObj(y)) return a;
  const puntos = (p: Record<string, any>) =>
    Object.values(esObj(p.estrellas) ? p.estrellas : {}).reduce((s: number, e) => s + (Array.isArray(e) ? e.filter((v) => v === true).length : 0), 0) +
    5 * Object.values(esObj(p.lunas) ? p.lunas : {}).filter((v) => v === true).length;
  const base = puntos(x) >= puntos(y) ? x : y;
  const estrellas: Record<string, boolean[]> = {};
  for (const p of [x, y]) {
    if (!esObj(p.estrellas)) continue;
    for (const [k, v] of Object.entries(p.estrellas)) {
      if (!Array.isArray(v)) continue;
      const ya = estrellas[k] ?? [false, false, false];
      estrellas[k] = [0, 1, 2].map((i) => ya[i] || v[i] === true);
    }
  }
  return JSON.stringify({
    ...base,
    estrellas,
    lunas: banderas(x.lunas, y.lunas),
    corazones: banderas(x.corazones, y.corazones),
    mejoras: maximos(x.mejoras, y.mejoras),
    sitios: maximos(x.sitios, y.sitios),
    gastadas: Math.max(num(x.gastadas), num(y.gastadas)),
  });
};

/** Cien Puertas: la puerta más lejana, las mejores estrellas de cada puerta y lo ya visto. */
const juntarPuertas: Juntar = (a, b) => {
  const x = json(a), y = json(b);
  if (!esObj(x)) return b;
  if (!esObj(y)) return a;
  const base = num(x.hasta) >= num(y.hasta) ? x : y;
  const recuerdos = [...new Set([...(Array.isArray(x.recuerdos) ? x.recuerdos : []), ...(Array.isArray(y.recuerdos) ? y.recuerdos : [])])].filter(
    (v) => typeof v === 'number',
  );
  return JSON.stringify({
    ...base,
    hasta: Math.max(num(x.hasta), num(y.hasta)),
    estrellas: maximos(x.estrellas, y.estrellas),
    vioInicio: x.vioInicio === true || y.vioInicio === true,
    ...(recuerdos.length ? { recuerdos } : {}),
  });
};

/** Lo que se guarda en la nube y cómo se juntan dos copias. */
export const CLAVES_NUBE: Record<string, Juntar> = {
  'supermania-jugable1': juntarSuper,
  'cien-puertas': juntarPuertas,
  'nuestro-hogar-victorias': maximo,
  'nuestro-hogar-escenas': union,
};
/** Lo más grande que se guarda de un minijuego (la casa entera no puede pasar de 1 MB). */
export const MAX_COPIA = 200_000;

const META = 'nuestro-hogar-nube';
interface Meta {
  /** De quién es lo que hay en este aparato. */
  rol?: Rol;
  /** Lo último que este aparato y la nube tuvieron igual, por minijuego (para saber quién cambió desde entonces). */
  vistos?: Record<string, string>;
}
const local = {
  leer(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  escribir(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* sin espacio: se queda con lo que tenía */
    }
  },
  quitar(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* nada */
    }
  },
};

/**
 * Junta lo del aparato con lo de la nube para `rol`. Deja en el aparato lo juntado y devuelve lo que hay que subir a
 * la casa (null si nada) y `listo`, que se llama cuando ya se subió (si la subida falla, la próxima vez se intenta de
 * nuevo sin perder lo del aparato).
 */
export function juntarProgreso(nube: Record<string, CopiaNube> | undefined, rol: Rol): { subir: Record<string, CopiaNube> | null; listo: () => void } {
  let meta: Meta = {};
  try {
    meta = JSON.parse(local.leer(META) ?? '{}') ?? {};
  } catch {
    /* empieza de cero */
  }
  // Si en este aparato jugaba el otro (cerró sesión y entró la pareja), lo de antes no es de este personaje
  const otroDueno = !!meta.rol && meta.rol !== rol;
  const vistos: Record<string, string> = otroDueno ? {} : { ...(meta.vistos ?? {}) };
  const subir: Record<string, CopiaNube> = {};
  for (const [clave, juntar] of Object.entries(CLAVES_NUBE)) {
    const aqui = otroDueno ? null : local.leer(clave);
    const alla = typeof nube?.[clave]?.v === 'string' ? nube[clave].v : null;
    let final: string | null;
    if (alla === null) final = aqui;
    else if (aqui === null || aqui === alla) final = alla;
    else {
      const cambioAqui = aqui !== vistos[clave];
      const cambioAlla = alla !== vistos[clave];
      if (cambioAqui && !cambioAlla) final = aqui;
      else if (!cambioAqui && cambioAlla) final = alla;
      else {
        // Los dos avanzaron (o es la primera vez que este aparato se junta con la nube)
        try {
          final = juntar(aqui, alla);
        } catch {
          final = alla;
        }
      }
    }
    if (final === null) {
      if (otroDueno) local.quitar(clave);
      continue;
    }
    if (final.length > MAX_COPIA) continue;
    if (final !== local.leer(clave)) local.escribir(clave, final);
    if (final !== alla) subir[clave] = { v: final, t: Date.now() };
    vistos[clave] = final;
  }
  return {
    subir: Object.keys(subir).length ? subir : null,
    listo: () => local.escribir(META, JSON.stringify({ rol, vistos } satisfies Meta)),
  };
}

/** El progreso de la nube tal como lo acepta la casa (solo minijuegos conocidos y de tamaño razonable). */
export function normalizarProgresoNube(o: unknown): Record<string, CopiaNube> {
  const r: Record<string, CopiaNube> = {};
  if (!esObj(o)) return r;
  for (const [k, c] of Object.entries(o)) {
    if (!(k in CLAVES_NUBE) || !esObj(c) || typeof c.v !== 'string' || c.v.length > MAX_COPIA) continue;
    r[k] = { v: c.v, t: Number.isFinite(c.t) ? Math.max(0, Math.floor(c.t)) : 0 };
  }
  return r;
}
