// Versión para amigos: reemplaza a `src/casa/cocina/pareja.ts` (lo que dicen Él y Ella en la cocina) al compilar con
// `vite build --mode amigos`. Con amigos la pareja nunca llega a comer; esto queda con frases para todos por si acaso.
import type { Rol } from '../../casa/modelo';
import type { RecetaId } from '../../casa/cocina/tipos';

const SALUDO = ['¡Hola, chef!', 'Vengo con hambre', '¿Qué hay de bueno?'];
const POR_RECETA = { wafles: SALUDO, fresas: SALUDO, frappes: SALUDO } as Record<RecetaId, string[]>;
export const SALUDOS_PAREJA: Record<Rol, Record<RecetaId, string[]>> = { el: POR_RECETA, ella: POR_RECETA };
export type Tono = 'encantado' | 'feliz' | 'normal' | 'bravo';
const TONOS: Record<Tono, string[]> = { encantado: ['¡Delicioso!'], feliz: ['¡Qué rico!'], normal: ['Bien, gracias'], bravo: ['Hmm…'] };
export const REACCIONES_PAREJA: Record<Rol, Record<Tono, string[]>> = { el: TONOS, ella: TONOS };
export const FAVORITO: Partial<Record<Rol, Partial<Record<RecetaId, string>>>> = {};
