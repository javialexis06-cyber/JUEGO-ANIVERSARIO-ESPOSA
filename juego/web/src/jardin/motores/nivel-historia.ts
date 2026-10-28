import { escenarioHistoriaPvZ } from '../conquista/historia-datos';
import { DirectorOleadasPvZ } from '../pvz/motor/oleadas';
import { AzarPvZ } from '../pvz/motor/azar';
import { ZOMBIS_PVZ } from '../pvz/datos/zombis';
import catalogo from '../../../public/jardin/motores/pvz2/catalogo-historia.json';
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
