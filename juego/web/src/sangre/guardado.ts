// Dónde queda el progreso: siempre en el aparato (para abrir rápido y jugar sin internet) y, para Javier y Laura,
// también en la casa compartida (`casa.sangre[rol]`), así lo tienen en cualquier celular. Las dos copias se juntan
// sin perder nada (fusionarProgreso). Los amigos solo en su aparato. Las monedas de la casa que se ganan van al
// «sobre» (`nuestro-hogar-sueldo`), como en los otros minijuegos: la casa las recoge al volver.
import { fusionarProgreso, normalizarProgresoSangre, type ProgresoSangre } from './progreso';
import type { Yo } from './identidad';

const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
const CLAVE_MODO = 'nuestro-hogar-modo';
const CLAVE_LOCAL = 'nuestro-hogar-local';

type Rol = 'el' | 'ella';

function modoCasa(rol: Rol): 'local' | 'linea' | null {
  try {
    const m = JSON.parse(localStorage.getItem(CLAVE_MODO) ?? 'null') as { modo?: string; rol?: string } | null;
    if (!m || m.rol !== rol) return null;
    if (m.modo === 'local') return localStorage.getItem(CLAVE_LOCAL) ? 'local' : null;
    if (m.modo === 'linea') return 'linea';
  } catch {
    /* sin almacenamiento */
  }
  return null;
}

/** Lee y cambia el progreso de este rol en la casa (null si la casa no se alcanza). */
async function enCasa(rol: Rol, cambio?: (p: ProgresoSangre | null) => ProgresoSangre | null): Promise<ProgresoSangre | null> {
  const modo = modoCasa(rol);
  if (!modo) return null;
  try {
    const sincro = await import('../casa/sincro');
    if (modo === 'local') {
      const s = new sincro.SincroLocal(rol);
      try {
        let r: ProgresoSangre | null = s.casa.sangre?.[rol] ?? null;
        if (cambio) {
          await s.cambiarCasa((c) => {
            const nuevo = cambio(c.sangre?.[rol] ?? null);
            if (!nuevo) return;
            c.sangre = { ...(c.sangre ?? {}), [rol]: nuevo };
            r = nuevo;
          });
        }
        return r;
      } finally {
        s.cerrar();
      }
    }
    const { normalizarCasa } = await import('../casa/modelo');
    const con = await sincro.conexionPareja();
    if (!con) return null;
    const { sb, sesion } = con;
    for (let intento = 0; intento < 5; intento++) {
      const { data: p, error } = await sb.from('parejas').select('casa, version').eq('id', sesion.parejaId).single();
      if (error || !p) return null;
      const c = normalizarCasa(p.casa);
      const actual = c.sangre?.[rol] ?? null;
      const nuevo = cambio?.(actual) ?? null;
      if (!nuevo) return actual;
      c.sangre = { ...(c.sangre ?? {}), [rol]: nuevo };
      const { data, error: e2 } = await sb.rpc('guardar_casa', { p: sesion.parejaId, nueva: c, version_leida: Number(p.version) || 0 });
      if (e2) return null;
      if (Number(data) >= 0) return nuevo;
      // Choque con otro guardado: se vuelve a leer
    }
  } catch {
    /* sin conexión o sin casa */
  }
  return null;
}

export class Guardado {
  p: ProgresoSangre;
  private clave: string;
  private pendiente = 0;
  private subiendo = false;
  /** Pruebas: nunca toca la casa. */
  soloAparato = false;

  constructor(public yo: Yo) {
    this.clave = `sangre-progreso-${yo.tipo === 'amigo' ? yo.id : yo.tipo}`;
    let guardado: unknown = null;
    try {
      guardado = JSON.parse(localStorage.getItem(this.clave) ?? 'null');
    } catch {
      /* nada */
    }
    this.p = normalizarProgresoSangre(guardado);
  }

  private get rol(): Rol | null {
    return this.yo.tipo === 'amigo' || this.soloAparato ? null : this.yo.tipo;
  }

  /** Trae lo de la casa y lo junta con lo del aparato. */
  async traer() {
    const rol = this.rol;
    if (!rol) return;
    const c = await enCasa(rol);
    if (c) {
      this.p = fusionarProgreso(this.p, normalizarProgresoSangre(c));
      this.local();
    }
  }

  private local() {
    try {
      localStorage.setItem(this.clave, JSON.stringify(this.p));
    } catch {
      /* sin almacenamiento */
    }
  }

  /** Guarda ya en el aparato y, un momento después, en la casa. */
  guardar() {
    this.p.t = Date.now();
    this.local();
    const rol = this.rol;
    if (!rol) return;
    clearTimeout(this.pendiente);
    this.pendiente = window.setTimeout(() => void this.subir(rol), 600);
  }

  private async subir(rol: Rol) {
    if (this.subiendo) {
      this.pendiente = window.setTimeout(() => void this.subir(rol), 800);
      return;
    }
    this.subiendo = true;
    try {
      const mio = this.p;
      await enCasa(rol, (c) => (c ? fusionarProgreso(mio, normalizarProgresoSangre(c)) : mio));
    } finally {
      this.subiendo = false;
    }
  }

  /** Monedas de la casa (solo Javier y Laura): van al sobre. */
  pagarCasa(monedas: number) {
    if (this.yo.tipo === 'amigo' || monedas <= 0) return;
    try {
      localStorage.setItem(CLAVE_SUELDO, String((Number(localStorage.getItem(CLAVE_SUELDO)) || 0) + monedas));
    } catch {
      /* sin almacenamiento */
    }
  }
}

/** Preferencias del aparato (calidad, zoom, última sala). */
export function preferencia<T>(k: string, def: T): T {
  try {
    const v = localStorage.getItem(`sangre-${k}`);
    return v === null ? def : (JSON.parse(v) as T);
  } catch {
    return def;
  }
}
export function ponerPreferencia(k: string, v: unknown) {
  try {
    localStorage.setItem(`sangre-${k}`, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
}
