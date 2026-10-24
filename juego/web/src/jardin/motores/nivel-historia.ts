import { escenarioHistoriaPvZ } from '../conquista/historia-datos';
import { DirectorOleadasPvZ } from '../pvz/motor/oleadas';
import { AzarPvZ } from '../pvz/motor/azar';
import { ZOMBIS_PVZ } from '../pvz/datos/zombis';
export const TIPOS_NATIVOS = { lanzaguisantes: 'peashooter', girasol: 'sunflower', nuez: 'wallnut', petacereza: 'cherry_bomb', repetidora: 'repeater', patatapum: 'potatomine' } as const;
export type SemillaNativa = keyof typeof TIPOS_NATIVOS;
export interface PuntoDescansoNativo {
    version: 1;
    soles: number;
    plantas: {
        tipo: string;
        fila: number;
        col: number;
        vida: number;
        temporales?: Record<string, number | boolean>;
    }[];
    cortacespedes: boolean[];
    recargas: Record<string, number>;
}
export interface ConfigDefensaNativa {
    zona: 8 | 9;
    filas: 4 | 5;
    semillas: string[];
    oleadas: {
        tipo: string;
        fila: number;
    }[][];
    punto: PuntoDescansoNativo | null;
    reposo: boolean;
}
/** Composición/carriles del sector existente; habilidades y estadísticas son del motor nativo aprobado. */
export function nivelHistoriaNativa(zona: 8 | 9, equipo: readonly SemillaNativa[], semilla: number, punto: PuntoDescansoNativo | null = null, reposo = false): ConfigDefensaNativa {
    const nivel = escenarioHistoriaPvZ(zona).nivel, director = new DirectorOleadasPvZ(nivel, new AzarPvZ(semilla), ZOMBIS_PVZ), oleadas: ConfigDefensaNativa['oleadas'] = [];
    const ids: Record<string, string> = { zombi: 'tutorial', 'zombi-bandera': 'tutorial_flag', caracono: 'tutorial_armor1' };
    for (let i = 0; i < director.total; i++) {
        let salida = director.paso((i + 1) * 1000, { vida: 100, inicial: 100, pendientes: 0, plantas: 45 });
        if (salida?.aviso)
            salida = director.paso((i + 1) * 1000, { vida: 100, inicial: 100, pendientes: 0, plantas: 45 });
        if (!salida || salida.aviso)
            throw Error('No se pudo adaptar la composición de la zona.');
        oleadas.push(salida.apariciones.map(z => { if (!ids[z.tipo])
            throw Error('Zombi fuera del primer sector.'); return { tipo: ids[z.tipo], fila: z.fila }; }));
    }
    return { zona, filas: zona === 8 ? 5 : 4, semillas: equipo.map(t => TIPOS_NATIVOS[t]), oleadas, punto: structuredClone(punto), reposo };
}
