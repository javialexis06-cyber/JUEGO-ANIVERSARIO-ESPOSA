// Versión para amigos: reemplaza a `src/casa/cohete/pareja.ts` (lo de la pareja en el retrete espacial) al compilar
// con `vite build --mode amigos`. Un amigo siempre vuela en modo neutro; esto queda con frases para todos por si acaso.
import type { Rol } from '../../casa/modelo';
import type { IdPoder } from '../../casa/cohete/datos';

const FRASES_TODOS = ['¡Houston, tenemos un problema… estomacal!', '¿Esto cuenta como viaje espacial? Quiero el certificado.', 'Ningún videojuego me preparó para esto.'];
export const FRASES: Record<Rol, string[]> = { el: FRASES_TODOS, ella: FRASES_TODOS };
const TRAMO = ['¡Chao, barrio!', 'Desde aquí la Tierra se ve chiquitica.', '¿La Luna es de queso?', '¿Habrá baños en Marte?', '¡Cuántas piedras!', '¡Qué colores!', '¡Todo rosado!'];
export const FRASES_TRAMO: Record<Rol, string[]> = { el: TRAMO, ella: TRAMO };
const poder = (t: string) => ({ el: t, ella: t });
export const FRASE_PODER: Record<IdPoder, Record<Rol, string>> = {
  escudo: poder('¡Burbujita protectora!'), iman: poder('¡Vengan, rollitos!'), turbo: poder('¡Esos frijoles no perdonan!'), lenta: poder('Todo va despacito…'),
  doble: poder('¡Todo me sale doble!'), laser: poder('¡Desatascador láser, a la orden!'), mini: poder('¡Un retretico ayudante!'), hormiga: poder('¡Modo chiquitico!'),
  ambientador: poder('¡Aroma a lavanda, por fin!'), paca: poder('¡Papel para todo el año!'),
};
export const OTRA_VEZ: Record<Rol, string[]> = { el: ['¡Una más y ya!'], ella: ['¡Una más y ya!'] };
export const PASO_PAREJA: Record<Rol, string> = { el: '¡Récord!', ella: '¡Récord!' };
export const PALABRAS_FIGURAS: [string, string, string] = ['WOW', 'GOL', 'TOP'];
export const GALAXIA_PAREJA = 'La galaxia de chicle';
