// El show lee y guarda en la casa compartida (el libro, los episodios, la pregunta del día) desde la página de la mesa:
// si la casa es de este celular, con SincroLocal; si es en línea, con la misma sesión de la casa (conexionPareja y
// guardar_casa con la versión leída, reintentando si el otro guardó al mismo tiempo). Sin casa (pruebas sueltas de la
// mesa), se guarda aparte en este celular para que el libro igual funcione.
import { normalizarShow, type ShowCasa, showVacio } from '../../casa/show_casa';
import type { Rol } from './preguntas';
import { SUPABASE_URL } from '../../casa/servidor';
import { aplicarCierreShow, cierreValido, type CierreShow } from './cierre';

const CLAVE_MODO = 'nuestro-hogar-modo';
const CLAVE_LOCAL = 'nuestro-hogar-local';
const CLAVE_SUELTO = 'show-libro-suelto';
const PREFIJO_PENDIENTE = 'show-ronda-pendiente:';
export const PREFIJO_CIERRE = 'show-cierre-pendiente:';
const emisorCierres = crypto.randomUUID();
let numeroCierre = 0;
let cierresEnCurso: Promise<Map<string, ResultadoCasa>> | null = null;
const cierresCreados = new Map<string, CierreShow>();
type RespuestasShow = Pick<ShowCasa, 'r' | 'g' | 'c'>;
type ResultadoCasa = DatosCasa & { guardado: boolean };

function aplicarRespuestas(s: ShowCasa, cambios: RespuestasShow) {
  for (const campo of ['r', 'g', 'c'] as const) for (const rol of ['el', 'ella'] as const) {
    Object.assign(s[campo][rol], cambios[campo][rol]);
  }
}

let reenvio: Promise<Map<string, ResultadoCasa>> | null = null;

function destinoActual(): string {
  const m = modo();
  if (m?.modo !== 'linea') return m?.modo ?? 'suelto';
  try {
    const sesion = JSON.parse(localStorage.getItem('nuestro-hogar-sesion') ?? 'null');
    const config = JSON.parse(localStorage.getItem('nuestro-hogar-supabase') ?? 'null');
    return JSON.stringify(['linea', config?.url ?? SUPABASE_URL, sesion?.parejaId ?? null]);
  } catch { return 'linea-sin-sesion'; }
}

export function crearCierreShow(d: Omit<CierreShow, 'emisor' | 'n' | 'destino'>): CierreShow {
  const clave = PREFIJO_CIERRE + d.id + ':' + d.rol;
  const anterior = cierresCreados.get(clave);
  if (anterior?.destino === destinoActual()) return anterior;
  try {
    const guardado = JSON.parse(localStorage.getItem(clave) ?? 'null');
    if (cierreValido(guardado) && guardado.destino === destinoActual()) { cierresCreados.set(clave, guardado); return guardado; }
  } catch { /* Se crea un recibo nuevo si todavía no había uno válido. */ }
  const c = { ...d, emisor: emisorCierres, n: ++numeroCierre, destino: destinoActual() };
  cierresCreados.set(clave, c);
  return c;
}

async function reenviarCierres() {
  if (cierresEnCurso) return cierresEnCurso;
  cierresEnCurso = (async () => {
    const resultados = new Map<string, ResultadoCasa>();
    const pendientes: { clave: string; json: string; cierre: CierreShow }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (!clave?.startsWith(PREFIJO_CIERRE)) continue;
        const json = localStorage.getItem(clave);
        if (!json) continue;
        try {
          const cierre = JSON.parse(json), destino = destinoActual();
          if (cierreValido(cierre) && (cierre.destino === destino || cierre.destino === 'suelto' && destino !== 'suelto')) pendientes.push({ clave, json, cierre });
        } catch { /* Una entrada dañada no bloquea los demás cierres. */ }
      }
    } catch { return resultados; }
    pendientes.sort((a, b) => a.cierre.emisor.localeCompare(b.cierre.emisor) || a.cierre.n - b.cierre.n);
    for (const p of pendientes) {
      let pagado = false;
      const d = await casaShowDirecta((s, casa) => { pagado = aplicarCierreShow(s, casa, p.cierre, p.cierre.destino !== destinoActual()); });
      if (!d.guardado) break;
      resultados.set(p.clave, d);
      if (pagado) try { if (localStorage.getItem(p.clave) === p.json) localStorage.removeItem(p.clave); } catch { /* El recibo de la casa evita repetir el premio. */ }
    }
    return resultados;
  })().finally(() => { cierresEnCurso = null; });
  return cierresEnCurso;
}

export async function guardarCierreShow(c: CierreShow): Promise<boolean> {
  if (!cierreValido(c) || c.destino !== destinoActual() && c.destino !== 'suelto') return false;
  const clave = PREFIJO_CIERRE + c.id + ':' + c.rol;
  try { localStorage.setItem(clave, JSON.stringify(c)); } catch { return false; }
  const guardados = await reenviarCierres();
  return guardados.has(clave);
}

/** Solo respuestas idempotentes: nunca se repiten monedas ni premios al recuperar una ronda. */
async function reenviarPendientes() {
  if (reenvio) return reenvio;
  reenvio = (async () => {
    const resultados = new Map<string, ResultadoCasa>();
    const pendientes: { clave: string; json: string; t: number; cambios: RespuestasShow }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (!clave?.startsWith(PREFIJO_PENDIENTE)) continue;
        const json = localStorage.getItem(clave);
        if (!json) continue;
        try {
          const v = JSON.parse(json), cambios = normalizarShow(v.cambios);
          if (cambios && v.destino === destinoActual()) pendientes.push({ clave, json, t: Number(v.t) || 0, cambios });
        } catch { /* Una entrada dañada no bloquea las demás. */ }
      }
    } catch { return resultados; }
    pendientes.sort((a, b) => a.t - b.t);
    for (const p of pendientes) {
      const d = await casaShowDirecta(s => aplicarRespuestas(s, p.cambios));
      if (!d.guardado) break;
      resultados.set(p.clave, d);
      try {
        if (localStorage.getItem(p.clave) === p.json) localStorage.removeItem(p.clave);
      } catch { /* La siguiente visita puede repetir esta escritura idempotente. */ }
    }
    return resultados;
  })().finally(() => { reenvio = null; });
  return reenvio;
}

/** El diario local conserva la ronda hasta que el libro confirma el guardado, incluso al cerrar la página. */
export async function guardarRespuestasShow(id: string, cambios: RespuestasShow) {
  const clave = PREFIJO_PENDIENTE + id;
  const json = JSON.stringify({ t: Date.now(), destino: destinoActual(), cambios });
  try { localStorage.setItem(clave, json); } catch { /* Aún puede guardarse directamente en la casa. */ }
  const recuperados = await reenviarPendientes();
  const confirmado = recuperados.get(clave);
  try { if (confirmado && localStorage.getItem(clave) === null) return confirmado; } catch { /* Guardado directo. */ }
  const d = await casaShowDirecta(s => aplicarRespuestas(s, cambios));
  if (d.guardado) {
    try { if (localStorage.getItem(clave) === json) localStorage.removeItem(clave); } catch { /* Reenvío idempotente. */ }
  }
  return d;
}

export interface DatosCasa {
  show: ShowCasa;
  perro: { nombre: string; pelaje: string; hembra: boolean } | null;
  /** De dónde salió: la casa local, la casa en línea o el libro suelto de este celular. */
  fuente: 'local' | 'linea' | 'suelto';
}

type Casa = Record<string, any> & { show?: ShowCasa; monedas?: number };

/** La conexión con la casa en línea se abre una vez por visita a la mesa (no en cada guardado). */
let conexion: Promise<Awaited<ReturnType<typeof import('../../casa/sincro').conexionPareja>>> | null = null;
let conexionDestino = '';

function modo(): { modo: 'local' | 'linea'; rol: Rol } | null {
  try {
    const m = JSON.parse(localStorage.getItem(CLAVE_MODO) ?? 'null') as { modo?: string; rol?: string } | null;
    if (!m || (m.rol !== 'el' && m.rol !== 'ella')) return null;
    if (m.modo === 'local') return localStorage.getItem(CLAVE_LOCAL) ? { modo: 'local', rol: m.rol } : null;
    if (m.modo === 'linea') return { modo: 'linea', rol: m.rol };
  } catch {
    /* sin almacenamiento */
  }
  return null;
}

function perroDe(c: Casa): DatosCasa['perro'] {
  const p = c.perro;
  if (!p || typeof p.nombre !== 'string' || !p.nombre.trim()) return null;
  return { nombre: p.nombre.trim().slice(0, 24), pelaje: typeof p.pelaje === 'string' ? p.pelaje : 'caramelo', hembra: !!p.hembra };
}

function suelto(): ShowCasa {
  try {
    return normalizarShow(JSON.parse(localStorage.getItem(CLAVE_SUELTO) ?? 'null')) ?? showVacio();
  } catch {
    return showVacio();
  }
}

/**
 * Lee la casa y, si se da `cambio`, lo aplica al show y lo guarda. Devuelve los datos ya guardados (o los leídos si
 * no se pudo guardar; `guardado` dice si quedó). Nunca lanza: sin conexión responde con lo que haya.
 */
export async function casaShow(cambio?: (s: ShowCasa, c: Casa) => void): Promise<DatosCasa & { guardado: boolean }> {
  await reenviarPendientes();
  await reenviarCierres();
  return casaShowDirecta(cambio);
}

async function casaShowDirecta(cambio?: (s: ShowCasa, c: Casa) => void): Promise<DatosCasa & { guardado: boolean }> {
  const m = modo();
  const aplicar = (c: Casa) => {
    const s = normalizarShow(c.show) ?? showVacio();
    cambio?.(s, c);
    c.show = s;
    return s;
  };
  try {
    if (m?.modo === 'local') {
      const sincro = await import('../../casa/sincro');
      const s = new sincro.SincroLocal(m.rol);
      try {
        if (cambio) await s.cambiarCasa((c) => void aplicar(c as unknown as Casa));
        const c = s.casa as unknown as Casa;
        return { show: normalizarShow(c.show) ?? showVacio(), perro: perroDe(c), fuente: 'local', guardado: !!cambio };
      } finally {
        s.cerrar();
      }
    }
    if (m?.modo === 'linea') {
      const sincro = await import('../../casa/sincro');
      const { normalizarCasa } = await import('../../casa/modelo');
      const destino = destinoActual();
      if (conexionDestino !== destino) {
        conexion = null;
        conexionDestino = destino;
      }
      conexion ??= sincro.conexionPareja().catch((e) => {
        conexion = null;
        throw e;
      });
      const con = await conexion;
      if (con) {
        const { sb, sesion } = con;
        for (let intento = 0; intento < 6; intento++) {
          const { data: p, error } = await sb.from('parejas').select('casa, version').eq('id', sesion.parejaId).single();
          if (error || !p) break;
          const c = normalizarCasa(p.casa) as unknown as Casa;
          if (!cambio) return { show: normalizarShow(c.show) ?? showVacio(), perro: perroDe(c), fuente: 'linea', guardado: false };
          aplicar(c);
          const { data, error: e2 } = await sb.rpc('guardar_casa', { p: sesion.parejaId, nueva: c, version_leida: Number(p.version) || 0 });
          if (e2) break;
          if (Number(data) >= 0) return { show: c.show!, perro: perroDe(c), fuente: 'linea', guardado: true };
          // Choque: el otro guardó al mismo tiempo; se vuelve a leer y se aplica otra vez
        }
        return { show: showVacio(), perro: null, fuente: 'linea', guardado: false };
      }
    }
  } catch {
    /* La casa configurada conserva su identidad aunque falle la conexión. */
  }
  if (m) return { show: showVacio(), perro: null, fuente: m.modo, guardado: false };
  const s = suelto();
  if (cambio) {
    const c: Casa = { show: s };
    aplicar(c);
    try {
      localStorage.setItem(CLAVE_SUELTO, JSON.stringify(c.show));
    } catch {
      return { show: suelto(), perro: null, fuente: 'suelto', guardado: false };
    }
    return { show: c.show!, perro: null, fuente: 'suelto', guardado: true };
  }
  return { show: s, perro: null, fuente: 'suelto', guardado: false };
}

/** Las monedas del show van al sobre del sueldo (llegan a la casa al abrirla, como en la mesa y el súper). */
export function pagar(monedas: number) {
  if (monedas <= 0) return;
  try {
    localStorage.setItem('nuestro-hogar-sueldo', String((Number(localStorage.getItem('nuestro-hogar-sueldo')) || 0) + monedas));
  } catch {
    /* sin almacenamiento */
  }
}

/** Cuenta para el trofeo de los juegos de mesa (lo sube la casa al abrirla). */
export function contarVictoria() {
  try {
    localStorage.setItem('nuestro-hogar-victorias', String((Number(localStorage.getItem('nuestro-hogar-victorias')) || 0) + 1));
  } catch {
    /* sin almacenamiento */
  }
}

/** Preguntas que ya salieron en shows de este celular (para no repetir aunque no se hayan contestado). */
const CLAVE_VISTAS = 'show-vistas';
export function vistas(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_VISTAS) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(-800) : [];
  } catch {
    return [];
  }
}
export function marcarVistas(ids: string[]) {
  try {
    localStorage.setItem(CLAVE_VISTAS, JSON.stringify([...new Set([...vistas(), ...ids])].slice(-800)));
  } catch {
    /* sin almacenamiento */
  }
}
