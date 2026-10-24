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
}
/** Composición/carriles del sector existente; habilidades y estadísticas son del motor nativo aprobado. */
export function nivelHistoriaNativa(zona: number, equipo: readonly SemillaNativa[], semilla: number, punto: PuntoDescansoNativo | null = null, reposo = false): ConfigDefensaNativa {
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
    return { zona, nombre: escenarioHistoriaPvZ(zona).nombre, filas: nivel.tablero!.filas, agua: [...(nivel.filasAgua??[])], noche: !!nivel.sinSolCielo, solInicial: zona===8||zona===9?150:nivel.solInicial, lapidas:punto?(punto.lapidas??[]):lapidas, semillas: equipo.map(t => TIPOS_NATIVOS[t]), oleadas, punto: structuredClone(punto), reposo };
}
