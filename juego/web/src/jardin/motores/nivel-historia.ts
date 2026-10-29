import { escenarioHistoriaPvZ } from '../conquista/historia-datos';
import { DirectorOleadasPvZ } from '../pvz/motor/oleadas';
import { AzarPvZ } from '../pvz/motor/azar';
import { ZOMBIS_PVZ } from '../pvz/datos/zombis';
import catalogo from '../../../public/jardin/motores/pvz2/catalogo-historia.json';
import nativo from '../../../public/jardin/motores/pvz2/catalogo-nativo.json';
import { AREAS_CAMPANA, PAISES_CAMPANA, type AreaCampana } from '../conquista/campana-datos';
export const TIPOS_NATIVOS = catalogo.tipos;
export const VIDAS_NATIVAS: Readonly<Record<string,number>> = catalogo.vidas;
export const nombreSemillaNativa = (id: string, nombre: string) => id === 'seta-congelada' ? 'Flor de hielo' : nombre;
export type SemillaNativa = keyof typeof TIPOS_NATIVOS;
export interface PuntoDescansoNativo {
    version: 1;
    soles: number;
    plantas: {
        tipo: string;
        fila: number;
        col: number;
        vida: number;
        temporales?: Record<string, number | boolean | number[]>;
        armadura?: number;
    }[];
    cortacespedes: boolean[];
    recargas: Record<string, number>;
    lapidas?: {fila:number;col:number;vida:number}[];
    crateres?: {fila:number;col:number;segundos:number}[];
}
export interface ConfigDefensaNativa {
    zona: number;
    nombre: string;
    filas: number;
    agua: number[];
    noche: boolean;
    solInicial: number;
    lapidas: {fila:number;col:number;vida?:number}[];
    semillas: string[];
    oleadas: {
        tipo: string;
        fila: number;
    }[][];
    punto: PuntoDescansoNativo | null;
    reposo: boolean;
    /** Versus de dos personas: sin oleadas ni victoria automática; los zombis los suelta el otro jugador. */
    versus?: boolean;
    /** Escenario nativo (mundo del país). Sin él se usa el jardín de día o de noche. */
    escenario?: string;
    /** Fusiones disponibles: plantar B sobre A forma la fusión (recetas nativas de evolución). */
    fusiones?: string[];
}
/** Hasta dónde sube el refuerzo de una zona que vuelve a ser asediada (pedido de Javier, 26 de octubre de 2026). */
export const REFUERZO_MAXIMO = 6;
/**
 * Refuerzo de un asedio: con 0 es la composición original. Cada punto agrega ~12 % más zombis por oleada (máximo ~70 %) y mejora a
 * algunos con cono o cubo (los de agua con su flotador), siempre dentro del límite del motor (40 por oleada).
 */
function reforzar(oleadas: ConfigDefensaNativa['oleadas'], refuerzo: number, azar: AzarPvZ) {
    if (refuerzo <= 0) return oleadas;
    const sube: Record<string, string> = { tutorial: 'tutorial_armor1', tutorial_armor1: 'tutorial_armor2', duckytube: 'duckytube_armor1', duckytube_armor1: 'duckytube_armor2' };
    return oleadas.map((ola, i) => {
        if (!ola.length) return ola;
        const extra = Math.min(40 - ola.length, Math.round(ola.length * 0.12 * refuerzo + (i >= oleadas.length / 2 ? refuerzo / 3 : 0)));
        const nueva = ola.map((z) => (sube[z.tipo] && azar.siguiente() < 0.055 * refuerzo ? { ...z, tipo: sube[z.tipo] } : { ...z }));
        for (let k = 0; k < extra; k++) {
            const base = ola[azar.entero(ola.length)];
            nueva.push({ tipo: base.tipo === 'tutorial_flag' ? 'tutorial' : base.tipo, fila: base.fila });
        }
        return nueva.slice(0, 40);
    });
}
/** Composición/carriles del sector existente; habilidades y estadísticas son del motor nativo aprobado. */
export function nivelHistoriaNativa(zona: number, equipo: readonly SemillaNativa[], semilla: number, punto: PuntoDescansoNativo | null = null, reposo = false, refuerzo = 0): ConfigDefensaNativa {
    const nivel=escenarioHistoriaPvZ(zona).nivel,azar=new AzarPvZ(semilla),lapidas:ConfigDefensaNativa['lapidas']=[];
    for(const [col,cantidad] of Object.entries(nivel.distribucionLapidas??{})) {
        const filas=[...nivel.filas];
        for(let i=0;i<cantidad;i++){const [fila]=filas.splice(azar.entero(filas.length),1);lapidas.push({fila,col:Number(col)});}
    }
    const director=new DirectorOleadasPvZ(nivel,azar,ZOMBIS_PVZ),oleadas:ConfigDefensaNativa['oleadas']=[];
    const ids: Record<string, string> = catalogo.zombis;
    for (let i = 0; i < director.total; i++) {
        let salida = director.paso((i + 1) * 1000, { vida: 100, inicial: 100, pendientes: 0, plantas: 45 });
        if (salida?.aviso)
            salida = director.paso((i + 1) * 1000, { vida: 100, inicial: 100, pendientes: 0, plantas: 45 });
        if (!salida || salida.aviso)
            throw Error('No se pudo adaptar la composición de la zona.');
        oleadas.push(salida.apariciones.map(z => { if (!ids[z.tipo])
            throw Error('No existe adaptación nativa para '+z.tipo); return { tipo: ids[z.tipo], fila: z.fila }; }));
    }
    const r = Math.max(0, Math.min(REFUERZO_MAXIMO, Math.floor(refuerzo)));
    return { zona, nombre: escenarioHistoriaPvZ(zona).nombre, filas: nivel.tablero!.filas, agua: [...(nivel.filasAgua??[])], noche: !!nivel.sinSolCielo, solInicial: zona===8||zona===9?150:nivel.solInicial, lapidas:punto?(punto.lapidas??[]):lapidas, semillas: equipo.map(t => TIPOS_NATIVOS[t]), oleadas: reforzar(oleadas, r, new AzarPvZ((semilla ^ 0x5bd1e995) >>> 0 || 1)), punto: structuredClone(punto), reposo };
}

// ------------------------------------------------------------------ Campaña de 240 áreas (catálogo nativo)
type PlantaNativaCatalogo = { id: string; nombre: string; mundo: string; coste: number; recarga: number; vida: number; familia: string; res: string };
type ZombiNativoCatalogo = { id: string; nombre: string; mundo: string; res: string; jefe: boolean };
type FusionNativa = { id: string; nombre: string; fusion: string; padres: [string, string]; base: string; props: Record<string, unknown> | null };
export const PLANTAS_NATIVAS = nativo.plantas as PlantaNativaCatalogo[];
export const ZOMBIS_NATIVOS = nativo.zombis as ZombiNativoCatalogo[];
export const FUSIONES_NATIVAS = nativo.fusiones as FusionNativa[];
/** Plantas de PvZ 1 que Gardendless no trae, como tipos derivados de su planta nativa más parecida. */
export const DERIVADAS_NATIVAS = nativo.derivadas as { id: string; nombre: string; en: string; base: string; props: Record<string, unknown> }[];
const derivadaPorId = new Map(DERIVADAS_NATIVAS.map(d => [d.id, d]));
const plantaPorId = new Map(PLANTAS_NATIVAS.map(p => [p.id, p]));
const fusionPorId = new Map(FUSIONES_NATIVAS.map(f => [f.id, f]));
/** Tipo nativo de una semilla: las 32 heredadas usan su identificador propio; las demás ya son nativas. */
export const nativoDe = (t: string) => (TIPOS_NATIVOS as Record<string, string>)[t] ?? t;
export const esSemillaConocida = (t: string) => Object.hasOwn(TIPOS_NATIVOS, t) || plantaPorId.has(t) || derivadaPorId.has(t);
/** Vida máxima con la que una planta (o fusión) puede guardarse en un punto de descanso. */
export function vidaNativa(tipo: string): number {
    const f = fusionPorId.get(tipo);
    if (f) return Math.max(Number(f.props?.Toughness ?? 0), vidaNativa(f.base), Number(f.props?.ArmorToughness ?? 0));
    const d = derivadaPorId.get(tipo);
    if (d) return Math.max(Number(d.props.Toughness ?? 0), vidaNativa(d.base));
    return Math.max(VIDAS_NATIVAS[tipo] ?? 0, plantaPorId.get(tipo)?.vida ?? 0);
}
export function nombrePlantaCatalogo(t: string, propio?: string) {
    return propio ?? fusionPorId.get(t)?.nombre ?? derivadaPorId.get(t)?.nombre ?? plantaPorId.get(t)?.nombre ?? t;
}
const SOLO_INVOCADOS = new Set(['chicken', 'pirate_captain_parrot', 'iceage_weasel', 'eighties_skunk', 'bobsled', 'lostcity_bug', 'dark_imp_dragon', 'sky_dronemaker', 'treasureyeti', 'vase_gargantuar', 'supernova_gargantuar', 'camel_onehump', 'cannon']);
const ROLES = ['basic', 'armor1', 'armor2', 'armor3', 'armor4', 'imp', 'gargantuar'] as const;
/** Oleadas nativas de un área nueva: zombis del mundo del país por papel y los especiales del mundo, que llegan de
 *  a poco según la ciudad y la ranura. Las fortalezas cierran con gargantúas; el castillo final, con el rey. */
export function oleadasCampana(area: AreaCampana, azar: AzarPvZ) {
    const escenario = (nativo.escenarios as Record<string, Record<string, unknown>>)[area.escenario!] ?? {};
    const lista = (k: string) => ((escenario[k] as string[] | undefined) ?? []).filter(z => ZOMBIS_NATIVOS.some(n => n.id === z));
    const roles = Object.fromEntries(ROLES.map(r => [r, lista(r)])) as Record<typeof ROLES[number], string[]>;
    const deRol = new Set(ROLES.flatMap(r => roles[r]));
    const mundos = PAISES_CAMPANA[area.pais].mundo === 'lostcity' ? ['lostcity', 'kongfu'] : [PAISES_CAMPANA[area.pais].mundo];
    const especiales = ZOMBIS_NATIVOS.filter(z => mundos.includes(z.mundo) && !z.jefe && !deRol.has(z.id) && !SOLO_INVOCADOS.has(z.id) && !/_flag/.test(z.id)).map(z => z.id);
    const local = area.ciudad % 4, nivelArea = local * 5 + area.ranura, d = area.dificultad;
    const disponibles = especiales.slice(0, Math.min(especiales.length, 1 + Math.floor(nivelArea / 2)));
    const total = Math.min(10, 5 + Math.floor(d / 8)), oleadas: { tipo: string; fila: number }[][] = [];
    const tierra = Array.from({ length: area.filas }, (_, i) => i).filter(f => !area.agua.includes(f));
    const acuaticos = ['duckytube', 'duckytube_armor1', 'duckytube_armor2', ...(area.pais === 4 ? ['beach_snorkel'] : [])];
    const elegir = <T,>(opciones: readonly T[]) => opciones[azar.entero(opciones.length)];
    for (let i = 0; i < total; i++) {
        const ola: { tipo: string; fila: number }[] = [], cantidad = Math.min(40, Math.round(3 + d * 0.35 + i * (1.2 + d * 0.05) + (i === total - 1 ? 4 + d * 0.2 : 0)));
        for (let k = 0; k < cantidad; k++) {
            const tirada = azar.siguiente(), progreso = (i + 1) / total;
            let pool: string[];
            if (tirada < 0.42 - progreso * 0.15) pool = roles.basic;
            else if (tirada < 0.62) pool = roles.armor1;
            else if (tirada < 0.74 && d >= 1) pool = roles.armor2;
            else if (tirada < 0.8 && d >= 6) pool = [...roles.armor3, ...roles.armor4];
            else if (tirada < 0.86 && d >= 4) pool = roles.imp;
            else if (tirada < 0.89 && (d >= 10 || area.tipo === 'fortaleza' && i === total - 1)) pool = roles.gargantuar;
            else pool = disponibles.length ? disponibles : roles.armor1;
            if (!pool.length) pool = roles.basic.length ? roles.basic : ['tutorial'];
            const agua = area.agua.length && azar.siguiente() < area.agua.length / area.filas;
            ola.push(agua ? { tipo: elegir(acuaticos), fila: elegir(area.agua) } : { tipo: elegir(pool), fila: elegir(tierra) });
        }
        if (area.tipo === 'fortaleza' && i === total - 1 && roles.gargantuar.length)
            for (let g = 0; g < 1 + Math.floor(d / 16); g++) ola.push({ tipo: elegir(roles.gargantuar), fila: elegir(tierra) });
        if (area.id === 239 && i === total - 1) ola.push({ tipo: 'dark_king_veteran', fila: elegir(tierra) }, { tipo: 'dark_wizard_veteran', fila: elegir(tierra) });
        oleadas.push(ola.slice(0, 40));
    }
    return oleadas;
}
/** Nivel de un área de la campaña. Las doce heredadas siguen con su composición original. */
export function nivelCampana(id: number, equipo: readonly string[], semilla: number, punto: PuntoDescansoNativo | null = null, reposo = false, refuerzo = 0, fusiones: readonly string[] = []): ConfigDefensaNativa {
    const area = AREAS_CAMPANA[id];
    if (area.heredada) {
        const base = nivelHistoriaNativa(id, equipo.filter(t => Object.hasOwn(TIPOS_NATIVOS, t)) as SemillaNativa[], semilla, punto, reposo, refuerzo);
        return { ...base, semillas: equipo.map(nativoDe), fusiones: [...fusiones] };
    }
    const azar = new AzarPvZ(semilla), lapidas: ConfigDefensaNativa['lapidas'] = [];
    if (area.noche && !punto) {
        const libres = Array.from({ length: area.filas }, (_, i) => i).filter(f => !area.agua.includes(f));
        for (let i = 0; i < Math.min(libres.length, 2 + Math.floor(area.dificultad / 16)); i++) { const [fila] = libres.splice(azar.entero(libres.length), 1); lapidas.push({ fila, col: 5 + azar.entero(4) }); }
    }
    const r = Math.max(0, Math.min(REFUERZO_MAXIMO, Math.floor(refuerzo)));
    return { zona: id, nombre: area.nombre, filas: area.filas, agua: [...area.agua], noche: area.noche, solInicial: area.noche ? 50 : 150,
        lapidas: punto ? (punto.lapidas ?? []) : lapidas, semillas: equipo.map(nativoDe), escenario: area.escenario!,
        oleadas: reforzar(oleadasCampana(area, azar), r, new AzarPvZ((semilla ^ 0x5bd1e995) >>> 0 || 1)), punto: structuredClone(punto), reposo, fusiones: [...fusiones] };
}
