// Versión para amigos: reemplaza a `src/casa/sincro.ts` (la casa en línea de la pareja) al compilar con
// `vite build --mode amigos`. Los amigos no tienen casa: todo lo suyo se guarda en el aparato.
import type { Rol } from '../../casa/modelo';

export interface SesionLinea {
  parejaId: string;
  codigo: string;
  rol: Rol;
}

export class SincroLocal {
  constructor() {
    throw new Error('Esta versión no tiene casa');
  }
}

export async function conexionPareja(): Promise<null> {
  return null;
}

export async function eventoPareja(..._x: unknown[]): Promise<void> {
  throw new Error('Esta versión no tiene casa');
}

export const leer = <T,>(k: string): T | null => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};

export const escribir = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sin espacio o sin permiso: no pasa nada */
  }
};
