/** Campaña territorial completa: 12 países × 4 ciudades × 5 áreas = 240 áreas sobre Gardendless.
 *
 * Las doce zonas existentes (ids 0–11) conservan nombre, carriles, desbloqueos, vecindad y guardados dentro de
 * Verdalia. Las otras 228 se generan aquí de forma determinista: cada país usa un mundo nativo (escenario,
 * zombis y plantas de ese mundo). Las fortalezas de país se abren al recuperar el resto del país; la de Umbra,
 * al recuperar las otras 239 áreas, y su caída lleva a la huida del Dr. Zomboid. */
import catalogo from '../../../public/jardin/motores/pvz2/catalogo-nativo.json';
import { ESCENARIOS_HISTORIA_PVZ } from './historia-datos';

export type TipoArea = 'residencial' | 'via' | 'especial' | 'suministros' | 'fortaleza';
export interface PaisCampana { id: number; nombre: string; mundo: string; escenarios: string[]; x: number; y: number }
export interface CiudadCampana { id: number; pais: number; nombre: string; x: number; y: number }
export interface AreaCampana {
    id: number; nombre: string; pais: number; ciudad: number; ranura: number; tipo: TipoArea;
    filas: number; agua: number[]; noche: boolean; escenario: string | null; vecinos: number[];
    desbloquea: string[]; dificultad: number; heredada: boolean;
}
export const TOTAL_AREAS = 240, AREA_CASA = 8, AREA_FINAL = 239;

/** Orden de recorrido. Umbra es el último país: su castillo morado es la fortaleza del Dr. Zomboid. */
export const PAISES_CAMPANA: readonly PaisCampana[] = [
    { id: 0, nombre: 'Verdalia', mundo: 'modern', escenarios: ['FrontLawnStage', 'ModernStage', 'ModernNightStage'], x: 18, y: 42 },
    { id: 1, nombre: 'Arenaria', mundo: 'egypt', escenarios: ['EgyptStage', 'EgyptNightStage'], x: 27, y: 84 },
    { id: 2, nombre: 'Marisma', mundo: 'pirate', escenarios: ['PirateStage'], x: 70, y: 58 },
    { id: 3, nombre: 'Solaria', mundo: 'cowboy', escenarios: ['WestStage', 'FarmStage'], x: 10, y: 70 },
    { id: 4, nombre: 'Coralia', mundo: 'beach', escenarios: ['BeachStage'], x: 60, y: 86 },
    { id: 5, nombre: 'Borealia', mundo: 'ice', escenarios: ['IceageStage', 'IceageVeteranStage'], x: 8, y: 14 },
    { id: 6, nombre: 'Altarruta', mundo: 'lostcity', escenarios: ['LostCityStage', 'LostCityNightStage', 'KongfuStage', 'MonkStage', 'AbbotStage'], x: 84, y: 38 },
    { id: 7, nombre: 'Forjaria', mundo: 'future', escenarios: ['FutureStage', 'FutureNightStage'], x: 54, y: 20 },
    { id: 8, nombre: 'Neón', mundo: 'eighties', escenarios: ['EightiesStage'], x: 46, y: 62 },
    { id: 9, nombre: 'Sauria', mundo: 'dino', escenarios: ['DinoStage'], x: 90, y: 76 },
    { id: 10, nombre: 'Nubaria', mundo: 'sky', escenarios: ['SkyStage'], x: 33, y: 10 },
    { id: 11, nombre: 'Umbra', mundo: 'dark', escenarios: ['DarkStage', 'ArenaStage'], x: 74, y: 10 },
];
const NOMBRES_CIUDAD: readonly (readonly string[])[] = [
    ['Los Naranjos', 'Villa Alba', 'Ciudad Solar', 'El Anillo Verde'], ['Oasis Dorado', 'Duna Alta', 'Valle de Obeliscos', 'Puerta del Sol'],
    ['Puerto Bruma', 'Bahía Farol', 'Isla Junco', 'Muelle del Ancla'], ['Polvorosa', 'Rancho Cobre', 'Cañón Rojo', 'Estación del Trigo'],
    ['Playa Espuma', 'Arrecife Azul', 'Isla Concha', 'Faro del Coral'], ['Cueva Escarcha', 'Glaciar Lento', 'Pico Nevado', 'Lago Helado'],
    ['Templo Jade', 'Selva Alta', 'Monasterio del Viento', 'Ruinas del Cóndor'], ['Domo Cristal', 'Barrio Engranaje', 'Torre Prisma', 'Laboratorio Norte'],
    ['Avenida Neón', 'Arcade Central', 'Pista Disco', 'Bulevar Casete'], ['Valle Helecho', 'Volcán Ámbar', 'Pantano Raptor', 'Nido de Fósiles'],
    ['Isla Nube', 'Puerto Aéreo', 'Atalaya del Viento', 'Hangar Celeste'], ['Aldea Gris', 'Bosque Oscuro', 'Puente Levadizo', 'Castillo del Dr. Zomboid'],
];
/** Posiciones de las cuatro ciudades en mapa-pais.webp. */
export const POSICIONES_CIUDAD = [{ x: 20, y: 32 }, { x: 72, y: 28 }, { x: 56, y: 73 }, { x: 18, y: 76 }];
const TIPOS: readonly TipoArea[] = ['residencial', 'via', 'especial', 'suministros', 'fortaleza'];
const NOMBRE_TIPO: Record<TipoArea, readonly string[]> = {
    residencial: ['Barrio', 'Casas', 'Callejón', 'Plaza'], via: ['Camino', 'Avenida', 'Paso', 'Sendero'],
    especial: ['Jardines', 'Mercado', 'Explanada', 'Patio'], suministros: ['Almacén', 'Depósito', 'Granero', 'Bodega'], fortaleza: ['Fortín', 'Bastión', 'Muralla', 'Ciudadela'],
};
/** Las doce zonas heredadas dentro de las ciudades de Verdalia (ranura 4 de la última ciudad: la fortaleza zombi). */
const HEREDADAS: readonly (readonly number[])[] = [[8, 9, 0, 4], [1, 2, 5, 7], [6, 10, 11], []];
/** La fortaleza zombi heredada (id 3) es la fortaleza de Verdalia: última ranura de su última ciudad. */
const FORTALEZA_HEREDADA = 3;
const nuevasPorPais = new Map<number, number[]>();
/** Plantas de cada mundo → país que las desbloquea. Las de origen general se reparten entre los países 1–11. */
const PAIS_DE_MUNDO: Record<string, number> = {
    frontyard: 0, modern: 0, egypt: 1, pirate: 2, cowboy: 3, beach: 4, water: 4, ice: 5, lostcity: 6, kongfu: 6,
    future: 7, eighties: 8, dino: 9, sky: 10, dark: 11,
};
/** Plantas de PvZ 1 fuera de las 32 heredadas: se desbloquean en las áreas nuevas de Verdalia. */
const PVZ1_VERDALIA = ['floawerPot', 'cabbagepult', 'kernelpult', 'garlic', 'umbrellaleaf', 'marigold', 'melonpult', 'wintermelon', 'twinsunflower', 'gatling',
    'spikerock', 'gloomshroom', 'imitater', 'glaciershroom', 'cattail', 'cobcannon'];
const HEREDADAS_NATIVAS = new Set(['peashooter', 'sunflower', 'wallnut', 'cherry_bomb', 'repeater', 'potatomine', 'snowpea', 'chomper', 'hypnoshroom', 'icebloom', 'cactus',
    'blover', 'plantern', 'puffshroom', 'sunshroom', 'fumeshroom', 'gravebuster', 'lilypad', 'seashroom', 'tanglekelp', 'threepeater', 'squash', 'tallnut', 'splitpea',
    'starfruit', 'pumpkin', 'torchwood', 'spikeweed', 'jalapeno', 'magnetshroom', 'scaredyshroom', 'doomshroom']);

function construir(): AreaCampana[] {
    const areas: AreaCampana[] = [];
    const heredada = new Map(ESCENARIOS_HISTORIA_PVZ.map(e => [e.id, e]));
    let siguiente = 12;
    for (const pais of PAISES_CAMPANA) {
        for (let c = 0; c < 4; c++) {
            const ciudad = pais.id * 4 + c, previas = pais.id === 0 ? [...HEREDADAS[c]] : [];
            for (let r = 0; r < 5; r++) {
                const tipo: TipoArea = TIPOS[r];
                let id: number;
                if (pais.id === 0 && r < previas.length) id = previas[r];
                else if (pais.id === 0 && c === 3 && r === 4) id = FORTALEZA_HEREDADA;
                else id = pais.id === 11 && c === 3 && r === 4 ? AREA_FINAL : siguiente++;
                const h = heredada.get(id), dificultad = pais.id * 4 + c + r / 5;
                const filas = h ? h.nivel.tablero!.filas : { residencial: 5, via: 3 + (c % 2), especial: 6, suministros: 6 + (r % 2), fortaleza: 5 }[tipo];
                const agua = h ? [...(h.nivel.filasAgua ?? [])] : pais.id === 4 && tipo !== 'via' ? [Math.floor(filas / 2), Math.floor(filas / 2) + 1].filter(f => f < filas - 1) : pais.id === 0 && tipo === 'especial' ? [2, 3] : [];
                const escenario = h ? null : pais.escenarios[(c + r) % pais.escenarios.length];
                const noche = h ? !!h.nivel.sinSolCielo : !!(catalogo.escenarios as Record<string, { noche: boolean }>)[escenario!]?.noche;
                const nombre = h ? h.nombre : id === AREA_FINAL ? 'Castillo del Dr. Zomboid' : `${NOMBRE_TIPO[tipo][(pais.id + c) % 4]} ${NOMBRES_CIUDAD[pais.id][c].split(' ').slice(-1)[0]}`;
                areas.push({ id, nombre, pais: pais.id, ciudad, ranura: r, tipo, filas, agua, noche, escenario, vecinos: [], desbloquea: h ? [...h.desbloquea] : [], dificultad, heredada: !!h });
                if (!h) { if (!nuevasPorPais.has(pais.id)) nuevasPorPais.set(pais.id, []); nuevasPorPais.get(pais.id)!.push(id); }
            }
        }
    }
    // El id final queda reservado para la última área de Umbra; las demás nuevas ocupan 12…238.
    areas.sort((a, b) => a.id - b.id);
    if (areas.length !== TOTAL_AREAS || areas.some((a, i) => a.id !== i)) throw Error('Campaña incompleta.');
    // Vecindad: las heredadas conservan su cuadrícula; dentro de cada ciudad las áreas se encadenan; las ciudades
    // de un país se unen por su primera área y cada país se une al siguiente por su fortaleza (y un atajo).
    const unir = (a: number, b: number) => { if (a === b) return; const A = areas[a], B = areas[b]; if (!A.vecinos.includes(b)) A.vecinos.push(b); if (!B.vecinos.includes(a)) B.vecinos.push(a); };
    for (const e of ESCENARIOS_HISTORIA_PVZ) for (const q of ESCENARIOS_HISTORIA_PVZ) if (Math.abs(q.col - e.col) + Math.abs(q.fila - e.fila) === 1) unir(e.id, q.id);
    const enCiudad = (ciudad: number) => areas.filter(a => a.ciudad === ciudad).sort((a, b) => a.ranura - b.ranura).map(a => a.id);
    for (let ciudad = 0; ciudad < 48; ciudad++) { const ids = enCiudad(ciudad); for (let i = 1; i < ids.length; i++) if (!(areas[ids[i]].heredada && areas[ids[i - 1]].heredada)) unir(ids[i - 1], ids[i]); }
    for (const pais of PAISES_CAMPANA) {
        const primeras = [0, 1, 2, 3].map(c => enCiudad(pais.id * 4 + c));
        for (let c = 1; c < 4; c++) unir(primeras[c - 1][primeras[c - 1].length > 2 ? 2 : 0], primeras[c][0]);
        if (pais.id < 11) {
            const otro = [0, 1, 2, 3].map(c => enCiudad((pais.id + 1) * 4 + c));
            unir(primeras[3][primeras[3].length - 1], otro[0][0]);
            unir(primeras[1][primeras[1].length - 1], otro[2][1]);
        }
    }
    // Desbloqueos: las plantas de cada mundo en su país; las generales repartidas. Las heredadas no se repiten.
    const porPais = new Map<number, string[]>();
    const generales: string[] = [];
    for (const p of catalogo.plantas as { id: string; mundo: string }[]) {
        if (HEREDADAS_NATIVAS.has(p.id) || PVZ1_VERDALIA.includes(p.id)) continue;
        const pais = PAIS_DE_MUNDO[p.mundo];
        if (pais === undefined || pais === 0) generales.push(p.id);
        else { if (!porPais.has(pais)) porPais.set(pais, []); porPais.get(pais)!.push(p.id); }
    }
    generales.forEach((id, i) => { const pais = 1 + (i % 11); if (!porPais.has(pais)) porPais.set(pais, []); porPais.get(pais)!.push(id); });
    for (const [pais, plantas] of porPais) {
        const destino = (nuevasPorPais.get(pais) ?? []).filter(id => areas[id].tipo !== 'fortaleza');
        plantas.forEach((p, i) => areas[destino[i % destino.length]].desbloquea.push(p));
    }
    // Verdalia nueva (8 áreas) completa PvZ 1: sus plantas de tejado y mejoradas, y las dos derivadas.
    const verdalia = (nuevasPorPais.get(0) ?? []).filter(id => areas[id].tipo !== 'fortaleza');
    PVZ1_VERDALIA.forEach((p, i) => areas[verdalia[i % verdalia.length]].desbloquea.push(p));
    return areas;
}
export const AREAS_CAMPANA: readonly AreaCampana[] = construir();
export const CIUDADES_CAMPANA: readonly CiudadCampana[] = PAISES_CAMPANA.flatMap(p => POSICIONES_CIUDAD.map((pos, c) => ({ id: p.id * 4 + c, pais: p.id, nombre: NOMBRES_CIUDAD[p.id][c], ...pos })));
export const areaCampana = (id: number) => AREAS_CAMPANA[id];
/** Fortaleza de cada país: se abre al recuperar el resto de su país. La final, al recuperar todo lo demás. */
export const esFortaleza = (id: number) => AREAS_CAMPANA[id]?.tipo === 'fortaleza';
