import { AREAS_CAMPANA, TOTAL_AREAS, AREA_FINAL } from './campana-datos';
import { ESCENARIOS_HISTORIA_PVZ } from './historia-datos';
import type { EstadoMapaConquista } from './mapa';
import { REFUERZO_MAXIMO, nativoDe, vidaNativa, esSemillaConocida, FUSIONES_NATIVAS, type SemillaNativa, type PuntoDescansoNativo } from '../motores/nivel-historia';
import { arbolPvZ, canonicoPvZ } from '../pvz/motor/validacion';
export type ZonaNativa = number;
export interface AtaqueNativo {
    id: number;
    zona: ZonaNativa;
    semilla: number;
    inicio: number;
    punto: PuntoDescansoNativo | null;
    equipo: SemillaNativa[];
    /** 0: la composición original (conquistas y primeros asedios); sube con cada asedio y con el tiempo. */
    refuerzo: number;
}
export interface PartidaHistoriaNativa {
    version: 6;
    reglas: 1;
    /** Fusiones aprendidas en el laboratorio de Forjaria (tramo final). */
    fusiones: string[];
    revision: number;
    pasos: number;
    proximo: number;
    semilla: number;
    inicioCasa: boolean;
    perdida: boolean;
    proximoAtaque: number;
    conocidas: ZonaNativa[];
    desbloqueadas: SemillaNativa[];
    zonas: {
        id: ZonaNativa;
        capturada: boolean;
        equipo: SemillaNativa[];
        punto: PuntoDescansoNativo | null;
        descanso: number;
        /** Asedios que ya resistió desde que es nuestra. */
        asedios: number;
        /** Desde cuándo es nuestra (segundos de partida). */
        desde: number;
    }[];
    ataques: AtaqueNativo[];
}
const iniciales: SemillaNativa[] = ['lanzaguisantes', 'girasol', 'nuez', 'petacereza'];
const semillasZona = (id: number) => AREAS_CAMPANA[id].desbloquea.filter(esSemillaConocida) as SemillaNativa[];
/** Cada fortaleza de Forjaria (laboratorio) enseña una cuarta parte de las fusiones. */
const fusionesDe = (zonasCapturadas: readonly number[]) => { const forja = AREAS_CAMPANA.filter(a => a.pais === 7 && a.tipo === 'fortaleza').map(a => a.id), n = forja.filter(id => zonasCapturadas.includes(id)).length; return FUSIONES_NATIVAS.slice(0, Math.ceil(FUSIONES_NATIVAS.length * n / 4)).map(f => f.id); };
const zonaValida = (id: unknown): id is number => Number.isInteger(id) && Number(id) >= 0 && Number(id) < TOTAL_AREAS;
const filasZona = (id: number) => AREAS_CAMPANA[id].filas;
const entero = (x: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): x is number => Number.isSafeInteger(x) && (x as number) >= min && (x as number) <= max;
const exigir = (ok: unknown) => { if (!ok)
    throw Error('Esa historia no se pudo abrir. El archivo original se conserva.'); };
export function validarPuntoNativo(p: PuntoDescansoNativo, filas: number, equipo: readonly SemillaNativa[], fusiones: readonly string[] = []) {
    exigir(p?.version === 1 && Number.isFinite(p.soles) && p.soles >= 0 && p.soles <= 9900 && Array.isArray(p.plantas) && p.plantas.length <= filas*9*3 && Array.isArray(p.cortacespedes) && p.cortacespedes.length === Math.max(5,filas) && p.cortacespedes.every(x => typeof x === 'boolean') && p.recargas && typeof p.recargas === 'object');
    const tipos: string[] = [...equipo.map(nativoDe), ...fusiones], celdas = new Set<string>(), capa = (t: string) => FUSIONES_NATIVAS.find(f => f.id === t && f.props)?.base ?? t;
    for (const f of p.plantas) {
        const k = f.fila + ':' + f.col + ':' + (capa(f.tipo)==='lilypad'?'base':capa(f.tipo)==='pumpkin'?'coraza':'planta');
        exigir(tipos.includes(f.tipo) && entero(f.fila, 0, filas - 1) && entero(f.col, 0, 8) && Number.isFinite(f.vida) && f.vida > 0 && f.vida <= vidaNativa(f.tipo) && !celdas.has(k));
        celdas.add(k);
        if(f.armadura!==undefined) exigir(Number.isFinite(f.armadura)&&f.armadura>=0&&f.armadura<=8000);
        if (f.temporales)
            for (const [k, v] of Object.entries(f.temporales))
                exigir(['busy','grown','activated','growthCountdown_','growthCountdown','growthStage','sunValue','lifeCD','resting','cds'].includes(k) && (typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=3600||k==='cds'&&Array.isArray(v)&&v.length<=10&&v.every(x=>Number.isFinite(x)&&x>=0&&x<=3600)));
    }
    if(p.lapidas!==undefined){
        exigir(Array.isArray(p.lapidas)&&p.lapidas.length<=filas*9);const vistas=new Set<string>();
        for(const q of p.lapidas){const k=q.fila+':'+q.col;exigir(entero(q.fila,0,filas-1)&&entero(q.col,3,8)&&Number.isFinite(q.vida)&&q.vida>0&&q.vida<=32000&&!vistas.has(k));vistas.add(k);}
    }
    if(p.crateres!==undefined){
        exigir(Array.isArray(p.crateres)&&p.crateres.length<=filas*9);const vistas=new Set<string>();
        for(const q of p.crateres){const k=q.fila+':'+q.col;exigir(entero(q.fila,0,filas-1)&&entero(q.col,0,8)&&Number.isFinite(q.segundos)&&q.segundos>0&&q.segundos<=3600&&!vistas.has(k));vistas.add(k);}
    }
    for (const [k, v] of Object.entries(p.recargas))
        exigir(tipos.includes(k) && Number.isFinite(v) && v >= 0 && v <= 3600);
    for(let i=filas;i<p.cortacespedes.length;i++) exigir(p.cortacespedes[i]===false);
}
/** Campaña del mapa existente. Los puntos de descanso no son instantáneas de combates activos. */
export class HistoriaNativa {
    pausada = false;
    constructor(readonly estado: PartidaHistoriaNativa = {
        version: 6, reglas: 1, fusiones: [], revision: 0, pasos: 0, proximo: 2, semilla: 23, inicioCasa: true,
        perdida: false, proximoAtaque: 35, conocidas: [8], desbloqueadas: [...iniciales],
        zonas: [8,9,...AREAS_CAMPANA.map(z=>z.id).filter(id=>id!==8&&id!==9)]
            .map(id=>({id,capturada:id===8,equipo:id===8?[...iniciales]:[],punto:null,descanso:0,asedios:0,desde:0})),
        ataques: [{id:1,zona:8,semilla:23,inicio:0,punto:null,equipo:[...iniciales],refuerzo:0}]
    }) {}
    get t() { return this.estado.pasos / 60; }
    get fin() { return !this.estado.perdida && this.estado.zonas.every(z=>z.capturada) && !this.estado.ataques.length; }
    get presion() { const n=this.estado.zonas.filter(z=>z.capturada).length; return n>=8?4:n>=5?3:n>=3?2:1; }
    zona(id: ZonaNativa) { const z=this.estado.zonas.find(z=>z.id===id); if(!z) throw Error('Zona desconocida.'); return z; }
    vecinos(id: ZonaNativa) {
        return zonaValida(id) ? [...AREAS_CAMPANA[id].vecinos] : [];
    }
    abastecidas() {
        const vistas=new Set<number>();
        if(!this.zona(8).capturada) return vistas;
        const cola=[8];vistas.add(8);
        for(let i=0;i<cola.length;i++) for(const id of this.vecinos(cola[i]))
            if(!vistas.has(id)&&this.zona(id).capturada){vistas.add(id);cola.push(id);}
        return vistas;
    }
    puedeLlegar(id: ZonaNativa) {
        if(!zonaValida(id)||this.estado.perdida||this.estado.inicioCasa&&id!==8) return false;
        const suministro=this.abastecidas();
        return (suministro.has(id)||this.vecinos(id).some(v=>suministro.has(v)))
            && this.fortalezaAbierta(id);
    }
    /** Las fortalezas se abren al recuperar el resto de su ciudad; la del Dr. Zomboid, al recuperar todo lo demás. */
    fortalezaAbierta(id: ZonaNativa) {
        const a = AREAS_CAMPANA[id];
        if (a.tipo !== 'fortaleza') return true;
        const otras = id === AREA_FINAL ? AREAS_CAMPANA.filter(q => q.id !== id) : AREAS_CAMPANA.filter(q => q.ciudad === a.ciudad && q.id !== id);
        return otras.every(q => this.zona(q.id).capturada);
    }
    /** Zonas nuestras que tocan territorio zombi: las únicas que se pueden asediar. Una zona rodeada solo por zonas
     *  nuestras queda despejada para siempre (mientras sus vecinas sigan siendo nuestras). */
    fronteras() { return this.estado.zonas.filter(z=>z.capturada&&this.vecinos(z.id).some(id=>!this.zona(id).capturada)).map(z=>z.id); }
    segura(id: ZonaNativa) { const z=this.zona(id); return z.capturada&&!this.vecinos(id).some(v=>!this.zona(v).capturada); }
    /** Lo fuerte que llegaría el próximo asedio a esta zona: un punto por cada asedio resistido y otro por cada tres
     *  minutos siendo frontera, con tope. Capturar a sus vecinas la despeja y deja de importar. */
    refuerzo(id: ZonaNativa) { const z=this.zona(id); return z.capturada?Math.min(REFUERZO_MAXIMO,z.asedios+Math.floor(Math.max(0,this.t-z.desde)/180)):0; }
    mapa(): EstadoMapaConquista {
        return {config:{modo:'historia'},zonas:AREAS_CAMPANA.map(z=>({id:z.id,nombre:z.nombre,col:z.ciudad,fila:z.pais,pais:z.pais,ciudad:z.ciudad,base:z.id===8?'plantas':z.id===AREA_FINAL?'zombis':null,dueno:this.zona(z.id).capturada?'plantas':'zombis'}))};
    }
    explorar(id: ZonaNativa=9) {
        const s=this.estado;
        if(this.pausada||s.inicioCasa||s.perdida||this.fin||!this.puedeLlegar(id)||s.conocidas.includes(id)) return false;
        s.conocidas.push(id);
        s.desbloqueadas.push(...semillasZona(id).filter(t=>!s.desbloqueadas.includes(t)));
        s.revision++;return true;
    }
    propietaria(tipo: SemillaNativa) { return this.estado.zonas.find(z => z.equipo.includes(tipo))?.id ?? null; }
    preparar(id: ZonaNativa, semillas: SemillaNativa[], revision = this.estado.revision) {
        const s = this.estado;
        if (this.pausada || s.perdida || this.fin || !this.puedeLlegar(id) || !s.conocidas.includes(id) || revision !== s.revision || !Array.isArray(semillas) || !semillas.length || semillas.length>8 || new Set(semillas).size !== semillas.length || semillas.some(t => !s.desbloqueadas.includes(t)))
            return false;
        const afectadas = new Set([id, ...semillas.map(t => this.propietaria(t)).filter((x): x is ZonaNativa => x !== null)]);
        if ([...afectadas].some(z=>this.zona(z).capturada&&!this.abastecidas().has(z)) || s.ataques.some(a => afectadas.has(a.zona)))
            return false;
        for (const z of s.zonas) {
            z.equipo = z.id === id ? [...semillas] : z.equipo.filter(t => !semillas.includes(t));
            if (z.punto) {
                const conservar: string[] = [...z.equipo.map(nativoDe), ...s.fusiones];
                z.punto.plantas = z.punto.plantas.filter(p => conservar.includes(p.tipo));
                z.punto.recargas = Object.fromEntries(Object.entries(z.punto.recargas).filter(([k]) => conservar.includes(k)));
            }
        }
        s.revision++;
        return true;
    }
    puedeExpedicion(id: ZonaNativa) {
        if(!zonaValida(id)) return false;
        const s=this.estado,z=this.zona(id);
        return !this.pausada&&!s.inicioCasa&&!s.perdida&&!this.fin&&s.conocidas.includes(id)
            && !z.capturada&&z.equipo.length>0&&z.descanso<=this.t&&this.puedeLlegar(id)
            && !s.ataques.some(a=>a.zona===id)&&s.ataques.length<6
            && s.ataques.filter(a=>!this.zona(a.zona).capturada).length<3;
    }
    expedicion(id: ZonaNativa=9) { return this.puedeExpedicion(id)?this.abrir(id):null; }
    private abrir(zona: ZonaNativa) { const s = this.estado, z = this.zona(zona), a: AtaqueNativo = { id: s.proximo++, zona, semilla: ((s.semilla + s.proximo * 1664525) >>> 0) || 1, inicio: this.t, equipo: [...z.equipo], punto: structuredClone(z.punto), refuerzo: z.capturada&&!(s.inicioCasa&&zona===8)?this.refuerzo(zona):0 }; s.ataques.push(a); s.revision++; return a; }
    paso() {
        const s = this.estado;
        if (this.pausada || s.perdida || this.fin)
            return null;
        s.pasos++;
        if (!s.inicioCasa && this.t >= s.proximoAtaque) {
            s.proximoAtaque = this.t + Math.max(22,42-this.presion*4);
            if(s.ataques.length<6&&s.ataques.filter(a=>this.zona(a.zona).capturada).length<this.presion) {
                const candidatas=this.fronteras().filter(id=>!this.segura(id)&&this.zona(id).descanso<=this.t&&!s.ataques.some(a=>a.zona===id))
                    .sort((a,b)=>Number(a===8)-Number(b===8)||a-b);
                if(candidatas.length) {
                    // Selección reproducible sin modificar las estadísticas de combate.
                    const indice=((s.semilla+s.proximo*1664525)>>>0)%Math.min(3,candidatas.length);
                    return this.abrir(candidatas[indice]);
                }
            }
        }
        return null;
    }
    resultado(id: number, resultado: 'victoria' | 'derrota', punto: PuntoDescansoNativo | null) {
        const s = this.estado, a = s.ataques.find(x => x.id === id);
        if (!a || s.perdida)
            return false;
        if (resultado === 'victoria') {
            exigir(punto);
            validarPuntoNativo(punto!, filasZona(a.zona), a.equipo, s.fusiones);
        }
        const z = this.zona(a.zona);
        s.ataques = s.ataques.filter(x => x.id !== id);
        z.descanso = this.t + 18;
        if (resultado === 'victoria') {
            // Resistir un asedio la deja más vigilada (el próximo viene más fuerte); conquistarla empieza de cero
            if (z.capturada && !(s.inicioCasa && a.zona === 8)) z.asedios = Math.min(REFUERZO_MAXIMO, z.asedios + 1);
            else { z.asedios = 0; z.desde = this.t; }
            z.capturada = true;
            z.punto = structuredClone(punto);
            s.fusiones = fusionesDe(s.zonas.filter(q => q.capturada).map(q => q.id));
            if (s.inicioCasa && a.zona === 8) {
                s.inicioCasa = false;
                s.proximoAtaque = this.t + 35;
            }
        }
        else {
            z.capturada = false;
            z.asedios = 0;
            z.punto = null;
            if (a.zona === 8)
                s.perdida = true;
        }
        s.revision++;
        return true;
    }
    exportar() { return structuredClone(this.estado); }
    static restaurar(dato: unknown) {
        arbolPvZ(dato);
        const s = structuredClone(dato) as PartidaHistoriaNativa;
        // Compatibilidad con el sector V3 publicado. No se curan plantas ni se conceden semillas.
        // Su validación restringida ocurre antes de añadir los territorios vacíos.
        if ((s as any)?.version===3) {
            exigir(s.reglas===1&&Array.isArray(s.zonas)&&s.zonas.length===2&&s.zonas[0].id===8&&s.zonas[1].id===9
                &&Array.isArray(s.conocidas)&&s.conocidas[0]===8&&s.conocidas.length<=2&&new Set(s.conocidas).size===s.conocidas.length&&s.conocidas.every(id=>id===8||id===9));
            const esperadas=s.conocidas.includes(9)?[...iniciales,'repetidora','patatapum']:iniciales;
            exigir(JSON.stringify(s.desbloqueadas)===JSON.stringify(esperadas));
            (s as any).version=4;
            s.zonas.push(...ESCENARIOS_HISTORIA_PVZ.filter(z=>z.id!==8&&z.id!==9).map(z=>({id:z.id,capturada:false,equipo:[],punto:null,descanso:0} as any)));
        }
        // V4 → V5: asedios resistidos y refuerzo de cada ataque (las partidas viejas empiezan sin refuerzo)
        if ((s as any)?.version===4) {
            exigir(Array.isArray(s.zonas)&&Array.isArray(s.ataques));
            (s as any).version=5;
            for (const z of s.zonas) { z.asedios=0; z.desde=0; }
            for (const a of s.ataques) a.refuerzo=0;
        }
        // V5 → V6: la campaña pasa de 12 a 240 áreas. Las 228 nuevas empiezan en manos zombis; nada más cambia.
        if ((s as any)?.version===5) {
            exigir(Array.isArray(s.zonas)&&s.zonas.length===12);
            (s as any).version=6;
            s.fusiones=[];
            s.zonas.push(...AREAS_CAMPANA.filter(a=>a.id>=12).map(a=>({id:a.id,capturada:false,equipo:[],punto:null,descanso:0,asedios:0,desde:0})));
        }
        exigir(s?.version===6&&s.reglas===1&&entero(s.revision)&&entero(s.pasos)&&entero(s.proximo,2)&&entero(s.semilla,1,4294967295)
            &&typeof s.inicioCasa==='boolean'&&typeof s.perdida==='boolean'&&Number.isFinite(s.proximoAtaque)&&s.proximoAtaque>=0
            &&Array.isArray(s.conocidas)&&s.conocidas[0]===8&&s.conocidas.length<=TOTAL_AREAS&&new Set(s.conocidas).size===s.conocidas.length&&s.conocidas.every(zonaValida));
        const esperadas=[...new Set(s.conocidas.flatMap(semillasZona))];
        exigir(Array.isArray(s.desbloqueadas)&&canonicoPvZ(s.desbloqueadas)===canonicoPvZ(esperadas)
            &&Array.isArray(s.zonas)&&s.zonas.length===TOTAL_AREAS&&s.zonas[0].id===8&&s.zonas[1].id===9
            &&new Set(s.zonas.map(z=>z.id)).size===TOTAL_AREAS&&s.zonas.every(z=>zonaValida(z.id))
            &&Array.isArray(s.ataques)&&s.ataques.length<=6);
        const tipos = new Set<string>(), ids = new Set<number>(), zonas = new Set<number>();
        for (const z of s.zonas) {
            exigir(entero(z.asedios, 0, REFUERZO_MAXIMO) && Number.isFinite(z.desde) && z.desde >= 0 && typeof z.capturada === 'boolean' && Array.isArray(z.equipo) && z.equipo.length<=8 && z.equipo.every(t => s.desbloqueadas.includes(t) && !tipos.has(t) && (tipos.add(t), true)) && Number.isFinite(z.descanso) && z.descanso >= 0);
            if (z.punto)
                validarPuntoNativo(z.punto, filasZona(z.id), z.equipo, s.fusiones);
            if (!s.conocidas.includes(z.id)) exigir(!z.capturada && !z.equipo.length && z.punto === null);
            if(z.capturada) exigir(s.conocidas.includes(z.id));
            if (z.capturada && (z.id !== 8 || !s.inicioCasa)) exigir(z.punto !== null);
        }
        for (const a of s.ataques) {
            exigir(entero(a.refuerzo, 0, REFUERZO_MAXIMO) && entero(a.id, 1, s.proximo - 1) && !ids.has(a.id) && !zonas.has(a.zona) && s.conocidas.includes(a.zona) && entero(a.semilla, 1, 4294967295) && Number.isFinite(a.inicio) && a.inicio >= 0 && a.inicio <= s.pasos / 60 && JSON.stringify(a.equipo) === JSON.stringify(s.zonas.find(z => z.id === a.zona)?.equipo));
            ids.add(a.id);
            zonas.add(a.zona);
            if (a.punto)
                validarPuntoNativo(a.punto, filasZona(a.zona), a.equipo, s.fusiones);
            exigir(canonicoPvZ(a.punto) === canonicoPvZ(s.zonas.find(z => z.id === a.zona)!.punto));
        }
        exigir(s.ataques.filter(a=>!s.zonas.find(z=>z.id===a.zona)!.capturada).length<=3);
        exigir(Array.isArray(s.fusiones)&&canonicoPvZ(s.fusiones)===canonicoPvZ(fusionesDe(s.zonas.filter(z=>z.capturada).map(z=>z.id))));
        exigir(s.perdida === !s.zonas[0].capturada && (!s.inicioCasa || s.conocidas.length === 1 && s.zonas.slice(1).every(z=>!z.capturada&&!z.equipo.length)) && (!s.inicioCasa || s.perdida || s.ataques.some(a => a.zona === 8)));
        return new HistoriaNativa(s);
    }
}
