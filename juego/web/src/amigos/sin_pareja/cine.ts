// Versión para amigos: reemplaza a `src/escenas/cine.ts` (el cine de las escenas premium de la pareja) al compilar con
// `vite build --mode amigos`. La mesa nunca lanza una escena en modo amigo; esto solo deja que compile.
import type { Escena } from '../../escenas/tipos';

export class Cine {
  static async reproducir(_e: Escena, _quien: string, _rapido = 1): Promise<void> {}
  simular(_seg: number) {}
}

export const cineActual: { c: Cine | null } = { c: null };
