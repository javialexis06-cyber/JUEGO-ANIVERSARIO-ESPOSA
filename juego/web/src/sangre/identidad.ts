// Quién juega en este aparato: Javier o Laura (vienen de la casa y se les muestra su nombre, nunca «Él»/«Ella») o
// un amigo con su perfil de la sala de juegos de amigos. Lee las mismas claves que las salas (`src/salas/`), así el
// mismo aparato es la misma persona en todos lados.
import { NOMBRE_ROL } from '../casa/modelo';
import { aspectoDe, perfilAmigo } from '../salas/perfil';

export type TipoYo = 'el' | 'ella' | 'amigo';

export interface Yo {
  id: string;
  nombre: string;
  tipo: TipoYo;
  cuerpo: 'el' | 'ella';
  piel?: string;
  pelo?: string;
  /** Lo del creador de personajes (solo los amigos). */
  detalles?: Record<string, string>;
}

const CLAVE_AMIGO = 'nuestro-hogar-amigo';
const CLAVE_APARATO = 'salas-aparato';

function leer<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function idAparato(): string {
  let id = leer<string>(CLAVE_APARATO);
  if (typeof id !== 'string' || id.length < 6) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => (b % 36).toString(36)).join('');
    try {
      localStorage.setItem(CLAVE_APARATO, JSON.stringify(id));
    } catch {
      /* sin almacenamiento */
    }
  }
  return id;
}

const color = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : undefined);
export const limpiarNombre = (s: string) => s.replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);

/** El rol de la casa en este aparato (o el de la dirección, para las pruebas). */
export function rolDeLaCasa(params = new URLSearchParams(location.search)): 'el' | 'ella' | null {
  const r = params.get('rol');
  if (r === 'el' || r === 'ella') return r;
  for (const k of ['nuestro-hogar-sesion', 'nuestro-hogar-modo']) {
    const v = leer<{ rol?: string }>(k);
    if (v?.rol === 'el' || v?.rol === 'ella') return v.rol;
  }
  return null;
}

export function quienSoy(params = new URLSearchParams(location.search)): Yo {
  const pr = params.get('rol');
  const amigo = leer<{ id?: string; nombre?: string; cuerpo?: string; piel?: string; pelo?: string; activo?: boolean }>(CLAVE_AMIGO);
  // ?amigo=Nombre en las pruebas
  const amigoPrueba = params.get('amigo');
  if (amigoPrueba !== null) {
    return { id: `amigo-${params.get('id') ?? idAparato()}`, nombre: limpiarNombre(amigoPrueba) || 'Amigo', tipo: 'amigo', cuerpo: params.get('cuerpo') === 'ella' ? 'ella' : 'el' };
  }
  if (pr !== 'el' && pr !== 'ella' && amigo && amigo.activo !== false && typeof amigo.nombre === 'string') {
    return {
      id: typeof amigo.id === 'string' ? amigo.id : `amigo-${idAparato()}`, nombre: limpiarNombre(amigo.nombre) || 'Amigo', tipo: 'amigo',
      cuerpo: amigo.cuerpo === 'ella' ? 'ella' : 'el', piel: color(amigo.piel), pelo: color(amigo.pelo),
      detalles: (() => {
        const pa = perfilAmigo();
        return pa ? aspectoDe(pa).detalles : undefined;
      })(),
    };
  }
  const rol = rolDeLaCasa(params);
  if (rol) return { id: `${rol}-${params.get('id') ?? idAparato()}`, nombre: NOMBRE_ROL[rol], tipo: rol, cuerpo: rol };
  // Nadie configurado: un viajero (se guarda en el aparato como un amigo sin nombre)
  return { id: `amigo-${idAparato()}`, nombre: 'Viajero', tipo: 'amigo', cuerpo: 'el' };
}
