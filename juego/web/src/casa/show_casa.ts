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
  /** Respuestas de esta fecha; las del libro pueden venir de un episodio anterior. */
  respuestas?: Partial<Record<RolShow, { a?: string; g?: string }>>;
  /** Quién ya cobró su monedita al verla revelada. */
  pagado?: Partial<Record<RolShow, 1>>;
}

export interface ShowCasa {
  r: Record<RolShow, Record<string, string>>;
  g: Record<RolShow, Record<string, string>>;
  c: Record<RolShow, Record<string, string>>;
  ep: EpisodioShow[];
  /** Último cierre cobrado por emisor; permite repetir una escritura sin volver a pagar. */
  cobros?: Record<string, number>;
  /** Victorias del Show posteriores al cierre transaccional, separadas del contador antiguo de mesa. */
  victorias?: Record<RolShow, number>;
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
  if (esObjeto(v.respuestas)) {
    d.respuestas = {};
    for (const rol of ROLES) {
      const r = v.respuestas[rol];
      if (!esObjeto(r)) continue;
      const respuesta: { a?: string; g?: string } = {};
      for (const campo of ['a', 'g'] as const) {
        if (typeof r[campo] === 'string' && r[campo]) respuesta[campo] = r[campo].slice(0, MAX_TEXTO);
      }
      d.respuestas[rol] = respuesta;
    }
  }
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
  if (esObjeto(v.cobros)) s.cobros = Object.fromEntries(Object.entries(v.cobros).filter(([k, n]) => /^[a-f0-9-]{36}$/.test(k) && Number.isSafeInteger(n) && n > 0));
  if (esObjeto(v.victorias)) s.victorias = { el: Math.max(0, Math.floor(num(v.victorias.el, 0))), ella: Math.max(0, Math.floor(num(v.victorias.ella, 0))) };
  const d = dia(v.dia);
  if (d) {
    d.respuestas ??= {
      el: { a: s.r.el[d.q], g: s.g.el[d.q] },
      ella: { a: s.r.ella[d.q], g: s.g.ella[d.q] },
    };
    s.dia = d;
  }
  return s;
}

// ---------------------------------------------------------------------------------------------------------------
// La pregunta del día, vista desde la casa (sin cargar el banco de preguntas: solo mira quién contestó)

export const fechaHoy = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Las partidas anteriores conservan la pregunta en curso; las nuevas separan sus respuestas por fecha. */
export function respuestaDelDia(s: ShowCasa, d: DiaShow, rol: RolShow) {
  return d.respuestas ? d.respuestas[rol] ?? {} : { a: s.r[rol][d.q], g: s.g[rol][d.q] };
}
const NOMBRE_SHOW: Record<RolShow, string> = { el: 'Él', ella: 'Ella' };
const otroShow = (r: RolShow): RolShow => (r === 'el' ? 'ella' : 'el');

export interface EstadoDiaLigero {
  hoy: boolean;
  mia: boolean;
  suya: boolean;
  revelada: boolean;
  pagado: boolean;
}

export function estadoDiaLigero(s: ShowCasa | undefined | null, yo: RolShow): EstadoDiaLigero {
  const d = s?.dia;
  if (!s || !d) return { hoy: false, mia: false, suya: false, revelada: false, pagado: false };
  const o = otroShow(yo);
  const propia = respuestaDelDia(s, d, yo), ajena = respuestaDelDia(s, d, o);
  const mia = propia.a !== undefined && propia.g !== undefined;
  const suya = ajena.a !== undefined && ajena.g !== undefined;
  return { hoy: d.f === fechaHoy(), mia, suya, revelada: mia && suya, pagado: !!d.pagado?.[yo] };
}

/** Qué avisar al abrir la casa (null si nada). */
export function avisoDia(s: ShowCasa | undefined | null, yo: RolShow): string | null {
  const e = estadoDiaLigero(s, yo);
  if (!e.hoy) return '💌 Hay una pregunta del día nueva en la nevera.';
  if (!e.mia && e.suya) return `💌 ${NOMBRE_SHOW[otroShow(yo)]} ya contestó la pregunta del día. ¡Te toca!`;
  if (!e.mia) return '💌 La pregunta del día te espera en la nevera.';
  if (e.revelada && !e.pagado) return '💌 ¡Se reveló la pregunta del día! Ve a la nevera a verla.';
  return null;
}

/** La tarjetica de la nevera (abre la pregunta del día). */
export function tarjetaDia(s: ShowCasa | undefined | null, yo: RolShow): string {
  const e = estadoDiaLigero(s, yo);
  const estado = !e.hoy ? 'Nueva' : e.revelada ? (e.pagado ? 'Revelada' : '¡Revelada!') : e.mia ? `Esperando a ${NOMBRE_SHOW[otroShow(yo)]}` : e.suya ? `${NOMBRE_SHOW[otroShow(yo)]} ya contestó` : 'Sin contestar';
  const nueva = !e.hoy || !e.mia || (e.revelada && !e.pagado);
  return `<button class="dia-tarjeta${nueva ? ' nueva' : ''}" data-pregunta-dia><span class="dia-tarjeta-icono">💌</span><span><b>Pregunta del día</b><small>${estado}</small></span></button>`;
}
