// Lo de «El Show de Nosotros» que vive en la casa compartida: las respuestas de cada uno (el libro de nosotros),
// los episodios jugados y la pregunta del día. Todo va comprimido en textos cortos para que la casa no crezca de más:
//   r[rol][id]  lo que contestó cada uno sobre sí mismo (o su voto en «¿quién?», o su respuesta en «nuestra historia»)
//   g[rol][id]  lo que cada uno adivinó del otro en esa pregunta
//   c[rol][id]  la calificación que recibió su adivinanza abierta ('2' exacto, '1' casi, '0' ni cerca)
// Valores: 'e' (Él) · 'a' (Ella) · '0'..'9' (opción) · '1'..'10' (termómetro) · texto libre (abiertas) · '-' (sin respuesta).
// Este archivo no importa nada de la casa en tiempo de ejecución: modelo.ts lo usa para normalizar.
export type RolShow = 'el' | 'ella';
const ROLES: RolShow[] = ['el', 'ella'];

export interface EpisodioShow {
  /** El id de la partida (el mismo en los dos celulares: se guarda una sola vez). */
  id: string;
  t: number;
  m: 'linea' | 'local' | 'solo';
  /** En solo: quién jugó. */
  de?: RolShow;
  p: Record<RolShow, number>;
  /** Conexión de la pareja en ese show, 0 a 100. */
  c: number;
  /** Las preguntas en orden; las de «¿cuánto me conoces?» y el termómetro llevan de quién se habló (`id:e` / `id:a`). */
  q: string[];
}

export interface DiaShow {
  /** AAAA-MM-DD */
  f: string;
  q: string;
  /** Quién ya cobró su monedita al verla revelada. */
  pagado?: Partial<Record<RolShow, 1>>;
}

export interface ShowCasa {
  r: Record<RolShow, Record<string, string>>;
  g: Record<RolShow, Record<string, string>>;
  c: Record<RolShow, Record<string, string>>;
  ep: EpisodioShow[];
  /** La pregunta de hoy (la escoge el primero que abre la casa ese día). */
  dia?: DiaShow;
  /** Las preguntas del día anteriores (para el libro). */
  dias: DiaShow[];
}

export const MAX_EPISODIOS = 60;
export const MAX_DIAS = 120;
const MAX_RESPUESTAS = 2400;
const MAX_TEXTO = 90;
const ID = /^[a-z][a-z0-9]{1,10}$/;

export function showVacio(): ShowCasa {
  return { r: { el: {}, ella: {} }, g: { el: {}, ella: {} }, c: { el: {}, ella: {} }, ep: [], dias: [] };
}

const esObjeto = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const fecha = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function mapa(v: unknown): Record<string, string> {
  const r: Record<string, string> = {};
  if (!esObjeto(v)) return r;
  let n = 0;
  for (const [k, x] of Object.entries(v)) {
    if (n >= MAX_RESPUESTAS) break;
    if (!ID.test(k) || typeof x !== 'string' || !x) continue;
    r[k] = x.slice(0, MAX_TEXTO);
    n++;
  }
  return r;
}

const porRol = (v: unknown) => Object.fromEntries(ROLES.map((r) => [r, mapa(esObjeto(v) ? v[r] : null)])) as Record<RolShow, Record<string, string>>;

function dia(v: unknown): DiaShow | null {
  if (!esObjeto(v) || !fecha(v.f) || typeof v.q !== 'string' || !ID.test(v.q)) return null;
  const d: DiaShow = { f: v.f, q: v.q };
  if (esObjeto(v.pagado)) {
    const p: Partial<Record<RolShow, 1>> = {};
    for (const r of ROLES) if (v.pagado[r]) p[r] = 1;
    if (Object.keys(p).length) d.pagado = p;
  }
  return d;
}

function episodio(v: unknown): EpisodioShow | null {
  if (!esObjeto(v) || typeof v.id !== 'string' || !v.id || !Array.isArray(v.q)) return null;
  const m = v.m === 'linea' || v.m === 'local' || v.m === 'solo' ? v.m : 'solo';
  const e: EpisodioShow = {
    id: v.id.slice(0, 40),
    t: num(v.t, 0),
    m,
    p: { el: Math.max(0, Math.min(99999, Math.round(num(v.p?.el, 0)))), ella: Math.max(0, Math.min(99999, Math.round(num(v.p?.ella, 0)))) },
    c: Math.max(0, Math.min(100, Math.round(num(v.c, 0)))),
    q: (v.q as unknown[]).filter((x): x is string => typeof x === 'string' && /^[a-z][a-z0-9]{1,10}(:[ea])?$/.test(x)).slice(0, 40),
  };
  if (v.de === 'el' || v.de === 'ella') e.de = v.de;
  return e;
}

/** El show siempre con la forma esperada (null si no hay nada que guardar). */
export function normalizarShow(v: unknown): ShowCasa | null {
  if (!esObjeto(v)) return null;
  const s: ShowCasa = {
    r: porRol(v.r),
    g: porRol(v.g),
    c: porRol(v.c),
    ep: Array.isArray(v.ep) ? v.ep.map(episodio).filter((e): e is EpisodioShow => !!e).slice(-MAX_EPISODIOS) : [],
    dias: Array.isArray(v.dias) ? v.dias.map(dia).filter((d): d is DiaShow => !!d).slice(-MAX_DIAS) : [],
  };
  const d = dia(v.dia);
  if (d) s.dia = d;
  return s;
}
