/** Economía de la campaña (30 de octubre de 2026, balance a criterio de Claude por pedido de Javier).
 *
 * Las plantas ya no se desbloquean al explorar: se compran en la tienda con monedas. Cada captura paga una vez
 * según el tipo de área y su país; resistir un asedio paga una cantidad menor. Cada planta pertenece al país donde
 * antes se desbloqueaba y se vende desde que ese país está a nuestro alcance. Cada área admite un cupo de semillas
 * que crece con la campaña, para que comprar mucho no rompa la dificultad. */
import { AREAS_CAMPANA, PAISES_CAMPANA, AREA_CASA, type TipoArea } from './campana-datos';
import { PLANTAS_NATIVAS, DERIVADAS_NATIVAS, nativoDe, esSemillaConocida } from '../motores/nivel-historia';

/** Las cuatro semillas con las que empieza toda historia (gratis). */
export const INICIALES: readonly string[] = ['lanzaguisantes', 'girasol', 'nuez', 'petacereza'];

/** País de origen de cada planta: el del área que antes la desbloqueaba. */
const ORIGEN = new Map<string, number>();
for (const a of AREAS_CAMPANA) for (const t of a.desbloquea) if (!ORIGEN.has(t) && esSemillaConocida(t)) ORIGEN.set(t, a.pais);
/** Todo lo que se puede comprar, en el orden de la campaña (país y área). */
export const PLANTAS_TIENDA: readonly string[] = [...ORIGEN.keys()].filter(t => !INICIALES.includes(t));
export const paisDePlanta = (t: string) => ORIGEN.get(t) ?? 0;
export const enTienda = (t: string) => ORIGEN.has(t) && !INICIALES.includes(t);

const plantaPorId = new Map(PLANTAS_NATIVAS.map(p => [p.id, p]));
const derivadaPorId = new Map(DERIVADAS_NATIVAS.map(d => [d.id, d]));
/** Coste en soles dentro del combate (el precio de la tienda parte de él). */
export function costeSol(t: string) {
    const n = nativoDe(t), p = plantaPorId.get(n);
    if (p) return p.coste;
    return Number(derivadaPorId.get(n)?.props.SunCost ?? 100);
}
/** Recarga larga (mentas y potenciadores): se cobran como una planta cara aunque cuesten 0 soles. */
const recargaLarga = (t: string) => (plantaPorId.get(nativoDe(t))?.recarga ?? 0) >= 60;
const redondear = (x: number, paso: number) => Math.max(paso, Math.round(x / paso) * paso);

/** Precio en monedas: crece con su coste en soles y con lo avanzado de su país. */
export function precio(t: string) {
    const sol = recargaLarga(t) ? 200 : costeSol(t);
    return redondear(Math.max(75, 40 + sol * 0.8) * (1 + 0.15 * paisDePlanta(t)), 25);
}

const BASE_RECOMPENSA: Record<TipoArea, number> = { residencial: 50, via: 40, especial: 60, suministros: 75, fortaleza: 120 };
/** Monedas por recuperar un área por primera vez. */
export function recompensa(id: number) {
    const a = AREAS_CAMPANA[id];
    if (id === AREA_CASA) return 300;
    return redondear(BASE_RECOMPENSA[a.tipo] * (1 + 0.15 * a.pais), 5);
}
/** Monedas por resistir un asedio en una zona propia. */
export function premioDefensa(id: number) { return redondear(5 * (1 + 0.1 * AREAS_CAMPANA[id].pais), 5); }

/** Semillas que admite la formación de un área. */
export function cupo(id: number) {
    const a = AREAS_CAMPANA[id];
    if (id === AREA_CASA) return 5;
    // Una más en tableros grandes (6 o 7 carriles): con cuatro semillas no alcanzaba a cubrirlos (prueba de balance).
    return Math.min(8, 4 + Math.floor(a.dificultad / 8) + (a.tipo === 'fortaleza' ? 1 : 0) + (a.agua.length ? 1 : 0) + (a.filas >= 6 ? 1 : 0));
}
export const nombrePais = (p: number) => PAISES_CAMPANA[p]?.nombre ?? '';
