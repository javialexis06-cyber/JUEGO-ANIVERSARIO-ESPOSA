// El show lee y guarda en la casa compartida (el libro, los episodios, la pregunta del día) desde la página de la mesa:
// si la casa es de este celular, con SincroLocal; si es en línea, con la misma sesión de la casa (conexionPareja y
// guardar_casa con la versión leída, reintentando si el otro guardó al mismo tiempo). Sin casa (pruebas sueltas de la
// mesa), se guarda aparte en este celular para que el libro igual funcione.
import { normalizarShow, type ShowCasa, showVacio } from '../../casa/show_casa';
import type { Rol } from './preguntas';

const CLAVE_MODO = 'nuestro-hogar-modo';
const CLAVE_LOCAL = 'nuestro-hogar-local';
const CLAVE_SUELTO = 'show-libro-suelto';

export interface DatosCasa {
  show: ShowCasa;
  perro: { nombre: string; pelaje: string; hembra: boolean } | null;
  /** De dónde salió: la casa local, la casa en línea o el libro suelto de este celular. */
  fuente: 'local' | 'linea' | 'suelto';
}

type Casa = Record<string, any> & { show?: ShowCasa };

/** La conexión con la casa en línea se abre una vez por visita a la mesa (no en cada guardado). */
let conexion: Promise<Awaited<ReturnType<typeof import('../../casa/sincro').conexionPareja>>> | null = null;

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
    /* sin conexión o sin casa: se sigue con el libro suelto */
  }
  const s = suelto();
  if (cambio) {
    const c: Casa = { show: s };
    aplicar(c);
    try {
      localStorage.setItem(CLAVE_SUELTO, JSON.stringify(c.show));
    } catch {
      /* sin espacio */
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
