// Las monedas para los antojos del narrador (las pistas se compran con dulces). Se gastan primero las del sobre
// (lo ganado en los minijuegos que todavía no llega a la casa) y el resto de la casa compartida: en este celular
// si la casa es local, o en el servidor si es en línea. Si la casa no se alcanza (sin internet), solo alcanza el sobre.
// Todo pasa por saldo() y gastarMonedas(n): si algún día la casa trae su propio ayudante, se cambia solo aquí.

const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
const CLAVE_MODO = 'nuestro-hogar-modo';
const CLAVE_LOCAL = 'nuestro-hogar-local';

type Rol = 'el' | 'ella';

function leerNumero(k: string) {
  try {
    return Number(localStorage.getItem(k)) || 0;
  } catch {
    return 0;
  }
}

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

/** Lee (y si `cambio` devuelve un número, guarda) las monedas de la casa. null si la casa no se alcanza. */
async function casa(cambio?: (monedas: number) => number | null): Promise<number | null> {
  const m = modo();
  if (!m) return null;
  try {
    const sincro = await import('../casa/sincro');
    if (m.modo === 'local') {
      const s = new sincro.SincroLocal(m.rol);
      try {
        let resultado: number | null = s.casa.monedas;
        if (cambio) {
          await s.cambiarCasa((c) => {
            const nuevo = cambio(c.monedas);
            resultado = c.monedas;
            if (nuevo === null) return;
            c.monedas = nuevo;
            resultado = nuevo;
          });
        }
        return resultado;
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
      const nuevo = cambio?.(c.monedas) ?? null;
      if (nuevo === null) return c.monedas;
      c.monedas = nuevo;
      const { data, error: e2 } = await sb.rpc('guardar_casa', { p: sesion.parejaId, nueva: c, version_leida: Number(p.version) || 0 });
      if (e2) return null;
      if (Number(data) >= 0) return nuevo;
      // Choque: el otro cambió la casa al mismo tiempo; se vuelve a leer
    }
  } catch {
    /* sin conexión o sin casa */
  }
  return null;
}

export interface Saldo {
  total: number;
  /** Lo del sobre (aún no llega a la casa). */
  sobre: number;
  /** Lo de la casa (null si no se alcanzó). */
  casa: number | null;
}

export async function saldo(): Promise<Saldo> {
  const sobre = Math.max(0, Math.floor(leerNumero(CLAVE_SUELDO)));
  const c = await casa();
  return { total: sobre + (c ?? 0), sobre, casa: c };
}

/** Gasta `n` monedas (primero del sobre y el resto de la casa). false si no alcanzan o no se pudo cobrar. */
export async function gastarMonedas(n: number): Promise<boolean> {
  const sobre = Math.max(0, Math.floor(leerNumero(CLAVE_SUELDO)));
  const delSobre = Math.min(sobre, n);
  const resto = n - delSobre;
  if (resto > 0) {
    let alcanzo = false;
    const r = await casa((m) => {
      alcanzo = m >= resto;
      return alcanzo ? m - resto : null;
    });
    if (r === null || !alcanzo) return false;
  }
  if (delSobre > 0) {
    try {
      const queda = leerNumero(CLAVE_SUELDO) - delSobre;
      if (queda > 0) localStorage.setItem(CLAVE_SUELDO, String(queda));
      else localStorage.removeItem(CLAVE_SUELDO);
    } catch {
      return false;
    }
  }
  return true;
}
