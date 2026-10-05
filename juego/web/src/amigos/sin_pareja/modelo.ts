// Versión para amigos: reemplaza a `src/casa/modelo.ts` (los datos de la casa de la pareja) al compilar con
// `vite build --mode amigos`. Solo trae lo poquito que usan los juegos de los amigos (los nombres de los jugadores
// y las ranuras de la ropa); la casa no existe en esta versión.
export type Rol = 'el' | 'ella';
export const NOMBRE_ROL: Record<Rol, string> = { el: 'Javier', ella: 'Laura' };
export const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');
export type Ranura = 'pelo' | 'cabeza' | 'cara' | 'arriba' | 'abajo' | 'pies' | 'espalda' | 'cola';
export const RANURAS: Ranura[] = ['pelo', 'cabeza', 'cara', 'arriba', 'abajo', 'pies', 'espalda', 'cola'];
export type Ropa = Partial<Record<Ranura, string>>;

/** (Sin casa: quien lo llame recibe un error y sigue con lo del aparato.) */
export function normalizarCasa(): never {
  throw new Error('Esta versión no tiene casa');
}
