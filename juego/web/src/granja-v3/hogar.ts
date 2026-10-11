/** Puerta hacia la casa real del proyecto; el progreso de cada juego conserva su propio guardado. */
export const CLAVE_RETORNO_HOGAR = 'nuestra-granja-retorno-hogar';
const VIGENCIA = 7 * 24 * 60 * 60 * 1000;

export interface RetornoHogar {
  jornada?: number;
  edificioId?: string;
  version: 1;
  x: number;
  z: number;
  personaje: 'el' | 'ella';
  /** Ruta del mismo origen. No contiene datos de la partida. */
  ruta: string;
  fecha: number;
}

function urlLocal(ruta: string): URL {
  const url = new URL(ruta, location.href);
  const actual = new URL(location.href);
  if (url.origin !== actual.origin || url.protocol !== actual.protocol || url.host !== actual.host ||
      !['http:', 'https:', 'capacitor:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('La casa y la granja deben estar dentro del mismo proyecto.');
  }
  return url;
}

export function guardarRetornoHogar(x: number, z: number, personaje: 'el' | 'ella', ruta = location.href, jornada?:number, edificioId?:string): RetornoHogar {
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 100_000 || Math.abs(z) > 100_000) {
    throw new Error('No se pudo conservar la posición de regreso a la granja.');
  }
  const url = urlLocal(ruta);
  url.searchParams.delete('desdeHogar');
  const retorno: RetornoHogar = { version: 1, x, z, personaje, ruta: `${url.pathname}${url.search}${url.hash}`, fecha: Date.now() };
  if(jornada!==undefined&&Number.isInteger(jornada)&&jornada>=0&&jornada<=1_000_000)retorno.jornada=jornada;
  if(edificioId&&/^[a-z0-9_]{1,99}$/.test(edificioId))retorno.edificioId=edificioId;
  // Si no puede guardarse, se conserva al jugador en la granja en lugar de perder el punto de retorno.
  sessionStorage.setItem(CLAVE_RETORNO_HOGAR, JSON.stringify(retorno));
  return retorno;
}

export function leerRetornoHogar(consumir = false): RetornoHogar | null {
  try {
    const dato: unknown = JSON.parse(sessionStorage.getItem(CLAVE_RETORNO_HOGAR) ?? 'null');
    if (!dato || typeof dato !== 'object') return null;
    const r = dato as Partial<RetornoHogar>;
    if (r.version !== 1 || !Number.isFinite(r.x) || !Number.isFinite(r.z) || Math.abs(r.x!) > 100_000 || Math.abs(r.z!) > 100_000 ||
        (r.personaje !== 'el' && r.personaje !== 'ella') || typeof r.ruta !== 'string' || typeof r.fecha !== 'number' || !Number.isFinite(r.fecha) ||
        Date.now() - r.fecha > VIGENCIA || r.fecha > Date.now() + 60_000) return null;
    if(r.jornada!==undefined&&(!Number.isInteger(r.jornada)||r.jornada<0||r.jornada>1_000_000)||r.edificioId!==undefined&&(typeof r.edificioId!=='string'||!/^[a-z0-9_]{1,99}$/.test(r.edificioId)))return null;
    urlLocal(r.ruta);
    if (consumir) sessionStorage.removeItem(CLAVE_RETORNO_HOGAR);
    return r as RetornoHogar;
  } catch {
    return null;
  }
}

/** El callback debe lanzar si el guardado falla. Solo entonces es seguro abandonar esta página. */
export async function abrirHogar(opciones: {
  x: number;
  z: number;
  personaje: 'el' | 'ella';
  guardar: () => void | Promise<void>;
  jornada?: number;
  edificioId?: string;
  url?: string;
}): Promise<void> {
  const url = urlLocal(opciones.url ?? './index.html');
  url.searchParams.set('desdeGranja', '1');
  await opciones.guardar();
  guardarRetornoHogar(opciones.x, opciones.z, opciones.personaje,location.href,opciones.jornada,opciones.edificioId);
  // No forzar ?rol ni ?local: la casa decide cómo recuperar su sesión local o de pareja existente.
  location.assign(url.href);
}

export function volverALaGranja(): boolean {
  const r = leerRetornoHogar();
  if (!r) return false;
  const url = urlLocal(r.ruta);
  url.searchParams.set('desdeHogar', '1');
  location.assign(url.href);
  return true;
}
