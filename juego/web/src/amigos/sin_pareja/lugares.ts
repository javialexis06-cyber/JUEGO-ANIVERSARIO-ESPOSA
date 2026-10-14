// Versión para amigos: reemplaza a `src/granja-v3/cine-lineas-lugares.ts` al compilar con `vite build --mode amigos`.
// Las presentaciones de cada lugar cuentan la mitología de Astra (la de Él y Ella): en Sangre y Ceniza de los amigos
// las postales de los biomas no salen.
import type { LineaCine } from '../../granja-v3/cine-granja';

export const LLEGADAS: Record<string, LineaCine[]> = {};
export const POSTALES: Record<string, LineaCine> = {};
export const LINEAS_LUGARES: LineaCine[] = [];
