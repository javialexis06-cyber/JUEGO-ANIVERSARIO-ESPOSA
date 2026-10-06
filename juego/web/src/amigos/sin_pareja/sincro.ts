// Versión para amigos: reemplaza a `src/casa/sincro.ts` (la casa en línea de la pareja) al compilar con
// `vite build --mode amigos`. Los amigos no tienen casa: todo lo suyo se guarda en el aparato.
export class SincroLocal {
  constructor() {
    throw new Error('Esta versión no tiene casa');
  }
}

export async function conexionPareja(): Promise<null> {
  return null;
}
