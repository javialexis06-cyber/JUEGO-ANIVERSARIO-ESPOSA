// Lo que queda para siempre entre expediciones: la ceniza (moneda del Pozo de las Almas), las mejoras permanentes,
// el equipo ofrecido al Pozo, la maestría de cada clase, las clases, biomas, peligros y armas desbloqueadas, los
// logros y las cifras. Liviano y sin dependencias pesadas: lo importa también la casa para normalizarlo.
// Javier y Laura lo guardan en la casa compartida (casa.sangre[rol]); los amigos, en su aparato.
import type { IdBioma, IdClase, IdMutador, PerfilJugador, RanuraEquipo, Stats } from './tipos';

export const CLASES_INICIALES: IdClase[] = ['monarca', 'campesino', 'prisionero'];
export const BIOMAS_INICIALES: IdBioma[] = ['cementerio', 'catacumbas'];
export const COMUNES_INICIALES = ['daga', 'hacha_arrojadiza', 'bomba'];
const CLASES_TODAS: IdClase[] = ['monarca', 'campesino', 'prisionero', 'caballero', 'cazador', 'herrero', 'alquimista', 'sepulturero', 'inquisidor', 'verdugo', 'bruja', 'juglar'];
const BIOMAS_TODOS: IdBioma[] = ['cementerio', 'catacumbas', 'minas', 'abadia', 'castillo'];
const COMUNES_TODAS = ['daga', 'arco_largo', 'hacha_arrojadiza', 'bomba', 'sierra', 'ira_cielo'];
const MUTADORES_TODOS: IdMutador[] = ['sangrienta', 'sin_antorchas', 'elites_dobles', 'plaga', 'roca_dura', 'codicia', 'eclipse', 'fragiles', 'enjambres', 'velocidad'];
const RANURAS: RanuraEquipo[] = ['casco', 'armadura', 'guantes', 'botas', 'amuleto', 'anillo'];

export interface CifrasSangre {
  expediciones: number;
  victorias: number;
  etapas: number;
  muertes: number;
  elites: number;
  jefes: number;
  excavadas: number;
  oro: number;
  almas: number;
  frascos: number;
  altares: number;
  prisioneros: number;
  bendiciones: number;
  ejecuciones: number;
  levantados: number;
  caidas: number;
  nivelMax: number;
  segundos: number;
  enGrupo: number;
}
const CIFRAS: (keyof CifrasSangre)[] = ['expediciones', 'victorias', 'etapas', 'muertes', 'elites', 'jefes', 'excavadas', 'oro', 'almas', 'frascos', 'altares', 'prisioneros', 'bendiciones', 'ejecuciones', 'levantados', 'caidas', 'nivelMax', 'segundos', 'enGrupo'];

export interface UltimaEleccion {
  clase: IdClase;
  spec: number;
  bioma: IdBioma;
  peligro: number;
  mutadores: IdMutador[];
  equipo: Partial<Record<RanuraEquipo, string>>;
}

export interface ProgresoSangre {
  v: 1;
  ceniza: number;
  cenizaTotal: number;
  pozo: Record<string, number>;
  ofrendas: string[];
  maestria: Partial<Record<IdClase, number>>;
  clases: IdClase[];
  biomas: IdBioma[];
  /** Peligro más alto ganado en cada bioma. */
  ganado: Partial<Record<IdBioma, number>>;
  comunes: string[];
  logros: string[];
  cifras: CifrasSangre;
  ultima: UltimaEleccion | null;
  tutorial: boolean;
  /** Para fusionar copias de dos aparatos (la más reciente gana en lo que no se suma). */
  t: number;
}

export function progresoNuevo(): ProgresoSangre {
  return {
    v: 1, ceniza: 0, cenizaTotal: 0, pozo: {}, ofrendas: [], maestria: {}, clases: [...CLASES_INICIALES], biomas: [...BIOMAS_INICIALES], ganado: {},
    comunes: [...COMUNES_INICIALES], logros: [], cifras: Object.fromEntries(CIFRAS.map((k) => [k, 0])) as unknown as CifrasSangre, ultima: null, tutorial: false, t: 0,
  };
}

const esObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, d = 0, max = 1e9) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : d);
const lista = <T extends string>(v: unknown, validos: readonly T[]): T[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is T => validos.includes(x as T)))] : []);
const ids = (v: unknown, max = 200): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && /^[a-z0-9_]{1,40}$/.test(x)))].slice(0, max) : []);

/** El progreso siempre con la forma esperada (viene de la casa, de otro aparato o de una versión vieja). */
export function normalizarProgresoSangre(x: unknown): ProgresoSangre {
  const b = progresoNuevo();
  if (!esObj(x)) return b;
  const p: ProgresoSangre = {
    v: 1,
    ceniza: Math.floor(num(x.ceniza)),
    cenizaTotal: Math.floor(num(x.cenizaTotal)),
    pozo: {},
    ofrendas: ids(x.ofrendas, 60),
    maestria: {},
    clases: [...new Set([...CLASES_INICIALES, ...lista(x.clases, CLASES_TODAS)])],
    biomas: [...new Set([...BIOMAS_INICIALES, ...lista(x.biomas, BIOMAS_TODOS)])],
    ganado: {},
    comunes: [...new Set([...COMUNES_INICIALES, ...lista(x.comunes, COMUNES_TODAS)])],
    logros: ids(x.logros, 120),
    cifras: { ...b.cifras },
    ultima: null,
    tutorial: !!x.tutorial,
    t: num(x.t),
  };
  if (esObj(x.pozo)) for (const [k, v] of Object.entries(x.pozo)) if (/^[a-z_]{1,30}$/.test(k)) p.pozo[k] = Math.floor(num(v, 0, 20));
  if (esObj(x.maestria)) for (const c of CLASES_TODAS) if (x.maestria[c] !== undefined) p.maestria[c] = Math.floor(num(x.maestria[c]));
  if (esObj(x.ganado)) for (const bi of BIOMAS_TODOS) if (x.ganado[bi] !== undefined) p.ganado[bi] = Math.floor(num(x.ganado[bi], 0, 5));
  if (esObj(x.cifras)) for (const k of CIFRAS) p.cifras[k] = Math.floor(num(x.cifras[k]));
  const u = x.ultima;
  if (esObj(u) && CLASES_TODAS.includes(u.clase as IdClase) && BIOMAS_TODOS.includes(u.bioma as IdBioma)) {
    const eq: Partial<Record<RanuraEquipo, string>> = {};
    if (esObj(u.equipo)) for (const r of RANURAS) if (typeof u.equipo[r] === 'string' && /^[a-z0-9_]{1,40}$/.test(u.equipo[r] as string)) eq[r] = u.equipo[r] as string;
    p.ultima = {
      clase: u.clase as IdClase, spec: Math.floor(num(u.spec, 0, 2)), bioma: u.bioma as IdBioma, peligro: Math.max(1, Math.floor(num(u.peligro, 1, 5))),
      mutadores: lista(u.mutadores, MUTADORES_TODOS), equipo: eq,
    };
  }
  return p;
}

/** Junta dos copias (dos aparatos de la misma persona): lo que se acumula, el máximo; lo que se desbloquea, la unión. */
export function fusionarProgreso(a: ProgresoSangre, b: ProgresoSangre): ProgresoSangre {
  const r = normalizarProgresoSangre(a.t >= b.t ? a : b);
  const otro = a.t >= b.t ? b : a;
  r.cenizaTotal = Math.max(a.cenizaTotal, b.cenizaTotal);
  r.ceniza = a.t >= b.t ? a.ceniza : b.ceniza;
  for (const k of new Set([...Object.keys(a.pozo), ...Object.keys(b.pozo)])) r.pozo[k] = Math.max(a.pozo[k] ?? 0, b.pozo[k] ?? 0);
  r.ofrendas = [...new Set([...a.ofrendas, ...b.ofrendas])];
  for (const c of CLASES_TODAS) {
    const v = Math.max(a.maestria[c] ?? 0, b.maestria[c] ?? 0);
    if (v) r.maestria[c] = v;
  }
  r.clases = [...new Set([...a.clases, ...b.clases])];
  r.biomas = [...new Set([...a.biomas, ...b.biomas])];
  r.comunes = [...new Set([...a.comunes, ...b.comunes])];
  r.logros = [...new Set([...a.logros, ...b.logros])];
  for (const bi of BIOMAS_TODOS) {
    const v = Math.max(a.ganado[bi] ?? 0, b.ganado[bi] ?? 0);
    if (v) r.ganado[bi] = v;
  }
  for (const k of CIFRAS) r.cifras[k] = Math.max(a.cifras[k], b.cifras[k]);
  r.tutorial = a.tutorial || b.tutorial;
  void otro;
  return r;
}

// ------------------------------------------------------------------------------------------------- Maestría
/** Experiencia de maestría para pasar del nivel n al n+1. */
export const xpMaestria = (n: number) => 300 + 220 * n;
export const MAESTRIA_MAX = 15;

export function nivelMaestria(xp: number): { nivel: number; resto: number; siguiente: number } {
  let n = 0, r = xp;
  while (n < MAESTRIA_MAX && r >= xpMaestria(n)) {
    r -= xpMaestria(n);
    n++;
  }
  return { nivel: n, resto: r, siguiente: n >= MAESTRIA_MAX ? 0 : xpMaestria(n) };
}

/** Qué da cada nivel de maestría de una clase. */
export function recompensaMaestria(n: number): string {
  switch (n) {
    case 1:
      return 'Segunda especialización';
    case 2:
      return 'Tercera arma del arsenal';
    case 3:
      return 'Tercera especialización';
    case 4:
      return 'Cuarta arma del arsenal';
    case 5:
      return 'Título: Veterano · +3 % de daño';
    case 10:
      return 'Título: Leyenda · +3 % de daño';
    case 15:
      return 'Título: Inmortal · +3 % de daño';
    default:
      return n % 2 ? '+8 de vida' : '+3 % de daño';
  }
}

export function specsDisponibles(nivel: number) {
  return nivel >= 3 ? 3 : nivel >= 1 ? 2 : 1;
}
export function armasDisponibles(nivel: number) {
  return nivel >= 4 ? 4 : nivel >= 2 ? 3 : 2;
}
export function tituloMaestria(nivel: number) {
  return nivel >= 15 ? 'Inmortal' : nivel >= 10 ? 'Leyenda' : nivel >= 5 ? 'Veterano' : nivel >= 1 ? 'Iniciado' : 'Novato';
}

/** Estadísticas que da la maestría de una clase. */
export function statsMaestria(nivel: number): Partial<Stats> {
  let dano = 0, vida = 0;
  for (let k = 5; k <= nivel; k++) {
    if (k === 5 || k === 10 || k === 15) dano += 0.03;
    else if (k > 5) {
      if (k % 2) vida += 8;
      else dano += 0.03;
    }
  }
  return { dano, vida };
}

/** El perfil con que un jugador entra a la expedición (permanentes del Pozo + maestría de la clase). */
export function perfilDe(p: ProgresoSangre, datos: { id: string; nombre: string; puesto: number; clase: IdClase; spec: number; equipo: Partial<Record<RanuraEquipo, string>>; cuerpo: 'el' | 'ella'; tipo: 'el' | 'ella' | 'amigo'; piel?: string; pelo?: string; detalles?: Record<string, string> }, arsenal: [string, string, string, string], pozoStats: (nivel: Record<string, number>) => { meta: Partial<Stats>; tiradas: number; vetos: number }): PerfilJugador {
  const nv = nivelMaestria(p.maestria[datos.clase] ?? 0).nivel;
  const { meta, tiradas, vetos } = pozoStats(p.pozo);
  const sm = statsMaestria(nv);
  const total: Partial<Stats> = { ...meta };
  for (const [k, v] of Object.entries(sm)) total[k as keyof Stats] = (total[k as keyof Stats] ?? 0) + (v as number);
  // Solo el equipo que de verdad está en el Pozo
  const equipo: Partial<Record<RanuraEquipo, string>> = {};
  for (const [r, id] of Object.entries(datos.equipo)) if (id && p.ofrendas.includes(id)) equipo[r as RanuraEquipo] = id;
  return {
    id: datos.id, nombre: datos.nombre, puesto: datos.puesto, clase: datos.clase, spec: Math.min(datos.spec, specsDisponibles(nv) - 1), meta: total, equipo,
    arsenal: arsenal.slice(0, armasDisponibles(nv)), comunes: [...p.comunes], tiradas: 1 + tiradas, vetos: vetos, cuerpo: datos.cuerpo, tipo: datos.tipo,
    piel: datos.piel, pelo: datos.pelo, ...(datos.detalles ? { detalles: datos.detalles } : {}),
  };
}

/** Peligro máximo que puede escoger (uno más que el más alto que haya ganado, mínimo 2). */
export function peligroPermitido(p: ProgresoSangre) {
  const max = Math.max(0, ...Object.values(p.ganado).map((v) => v ?? 0));
  return Math.min(5, Math.max(2, max + 1));
}
