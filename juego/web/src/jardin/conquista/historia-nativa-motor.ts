import { ESCENARIOS_HISTORIA_PVZ } from './historia-datos';
import type { EstadoMapaConquista } from './mapa';
import { TIPOS_NATIVOS, type SemillaNativa, type PuntoDescansoNativo } from '../motores/nivel-historia';
import { arbolPvZ, canonicoPvZ } from '../pvz/motor/validacion';
export type ZonaNativa = 8 | 9;
export interface AtaqueNativo {
    id: number;
    zona: ZonaNativa;
    semilla: number;
    inicio: number;
    punto: PuntoDescansoNativo | null;
    equipo: SemillaNativa[];
}
export interface PartidaHistoriaNativa {
    version: 3;
    reglas: 1;
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
    }[];
    ataques: AtaqueNativo[];
}
const iniciales: SemillaNativa[] = ['lanzaguisantes', 'girasol', 'nuez', 'petacereza'];
const nuevas: SemillaNativa[] = ['repetidora', 'patatapum'];
const entero = (x: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): x is number => Number.isSafeInteger(x) && (x as number) >= min && (x as number) <= max;
const exigir = (ok: unknown) => { if (!ok)
    throw Error('Historia nativa incompatible. El archivo original se conserva.'); };
export function validarPuntoNativo(p: PuntoDescansoNativo, filas: number, equipo: readonly SemillaNativa[]) {
    exigir(p?.version === 1 && Number.isFinite(p.soles) && p.soles >= 0 && p.soles <= 9900 && Array.isArray(p.plantas) && p.plantas.length <= 45 && Array.isArray(p.cortacespedes) && p.cortacespedes.length === 5 && p.cortacespedes.every(x => typeof x === 'boolean') && p.recargas && typeof p.recargas === 'object');
    const tipos = equipo.map(t => TIPOS_NATIVOS[t]), celdas = new Set<string>();
    for (const f of p.plantas) {
        const k = f.fila + ':' + f.col;
        exigir(tipos.includes(f.tipo as any) && entero(f.fila, 0, filas - 1) && entero(f.col, 0, 8) && Number.isFinite(f.vida) && f.vida > 0 && f.vida <= (f.tipo === 'wallnut' ? 4000 : 300) && !celdas.has(k));
        celdas.add(k);
        if (f.temporales)
            for (const [k, v] of Object.entries(f.temporales))
                exigir(['busy', 'grown', 'activated', 'growthCountdown_'].includes(k) && (typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 3600));
    }
    for (const [k, v] of Object.entries(p.recargas))
        exigir(tipos.includes(k as any) && Number.isFinite(v) && v >= 0 && v <= 3600);
    if (filas === 4) exigir(p.cortacespedes[4] === false);
}
/** Primer sector conectado. No convierte puntos de descanso en instantáneas de un ataque activo. */
export class HistoriaNativa {
    pausada = false;
    constructor(readonly estado: PartidaHistoriaNativa = { version: 3, reglas: 1, revision: 0, pasos: 0, proximo: 2, semilla: 23, inicioCasa: true, perdida: false, proximoAtaque: 35, conocidas: [8], desbloqueadas: [...iniciales], zonas: [{ id: 8, capturada: true, equipo: [...iniciales], punto: null, descanso: 0 }, { id: 9, capturada: false, equipo: [], punto: null, descanso: 0 }], ataques: [{ id: 1, zona: 8, semilla: 23, inicio: 0, punto: null, equipo: [...iniciales] }] }) { }
    get t() { return this.estado.pasos / 60; }
    get fin() { return !this.estado.perdida && this.zona(9).capturada && !this.estado.ataques.length; }
    zona(id: ZonaNativa) { return this.estado.zonas.find(z => z.id === id)!; }
    mapa(): EstadoMapaConquista { return { config: { modo: 'historia' }, zonas: ESCENARIOS_HISTORIA_PVZ.map(z => ({ id: z.id, nombre: z.nombre, col: z.col, fila: z.fila, base: z.base, dueno: (z.id === 8 || z.id === 9) && this.zona(z.id).capturada ? 'plantas' : 'zombis' })) }; }
    explorar() { if (this.pausada || this.estado.inicioCasa || this.estado.perdida || this.estado.conocidas.includes(9))
        return false; this.estado.conocidas.push(9); this.estado.desbloqueadas.push(...nuevas); this.estado.revision++; return true; }
    propietaria(tipo: SemillaNativa) { return this.estado.zonas.find(z => z.equipo.includes(tipo))?.id ?? null; }
    preparar(id: ZonaNativa, semillas: SemillaNativa[], revision = this.estado.revision) {
        const s = this.estado;
        if (this.pausada || s.perdida || !s.conocidas.includes(id) || revision !== s.revision || !Array.isArray(semillas) || !semillas.length || new Set(semillas).size !== semillas.length || semillas.some(t => !s.desbloqueadas.includes(t)))
            return false;
        const afectadas = new Set([id, ...semillas.map(t => this.propietaria(t)).filter((x): x is ZonaNativa => x !== null)]);
        if (s.ataques.some(a => afectadas.has(a.zona)))
            return false;
        for (const z of s.zonas) {
            z.equipo = z.id === id ? [...semillas] : z.equipo.filter(t => !semillas.includes(t));
            if (z.punto) {
                const conservar = z.equipo.map(t => TIPOS_NATIVOS[t]);
                z.punto.plantas = z.punto.plantas.filter(p => conservar.includes(p.tipo as any));
                z.punto.recargas = Object.fromEntries(Object.entries(z.punto.recargas).filter(([k]) => conservar.includes(k as any)));
            }
        }
        s.revision++;
        return true;
    }
    expedicion() { const s = this.estado, z = this.zona(9); if (this.pausada || s.inicioCasa || s.perdida || !s.conocidas.includes(9) || z.capturada || !z.equipo.length || z.descanso > this.t || s.ataques.some(a => a.zona === 9))
        return null; return this.abrir(9); }
    private abrir(zona: ZonaNativa) { const s = this.estado, z = this.zona(zona), a: AtaqueNativo = { id: s.proximo++, zona, semilla: ((s.semilla + s.proximo * 1664525) >>> 0) || 1, inicio: this.t, equipo: [...z.equipo], punto: structuredClone(z.punto) }; s.ataques.push(a); s.revision++; return a; }
    paso() {
        const s = this.estado;
        if (this.pausada || s.perdida || this.fin)
            return null;
        s.pasos++;
        if (!s.inicioCasa && !this.zona(9).capturada && this.t >= s.proximoAtaque) {
            s.proximoAtaque = this.t + 38;
            if (!s.ataques.some(a => a.zona === 8))
                return this.abrir(8);
        }
        return null;
    }
    resultado(id: number, resultado: 'victoria' | 'derrota', punto: PuntoDescansoNativo | null) {
        const s = this.estado, a = s.ataques.find(x => x.id === id);
        if (!a || s.perdida)
            return false;
        if (resultado === 'victoria') {
            exigir(punto);
            validarPuntoNativo(punto!, a.zona === 8 ? 5 : 4, a.equipo);
        }
        const z = this.zona(a.zona);
        s.ataques = s.ataques.filter(x => x.id !== id);
        z.descanso = this.t + 18;
        if (resultado === 'victoria') {
            z.capturada = true;
            z.punto = structuredClone(punto);
            if (s.inicioCasa && a.zona === 8) {
                s.inicioCasa = false;
                s.proximoAtaque = this.t + 35;
            }
        }
        else {
            z.capturada = false;
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
        exigir(s?.version === 3 && s.reglas === 1 && entero(s.revision) && entero(s.pasos) && entero(s.proximo, 2) && entero(s.semilla, 1, 4294967295) && typeof s.inicioCasa === 'boolean' && typeof s.perdida === 'boolean' && Number.isFinite(s.proximoAtaque) && s.proximoAtaque >= 0 && Array.isArray(s.conocidas) && s.conocidas[0] === 8 && s.conocidas.length <= 2 && new Set(s.conocidas).size === s.conocidas.length && s.conocidas.every(x => x === 8 || x === 9));
        const esperadas = s.conocidas.includes(9) ? [...iniciales, ...nuevas] : iniciales;
        exigir(Array.isArray(s.desbloqueadas) && JSON.stringify(s.desbloqueadas) === JSON.stringify(esperadas) && Array.isArray(s.zonas) && s.zonas.length === 2 && s.zonas[0].id === 8 && s.zonas[1].id === 9 && Array.isArray(s.ataques) && s.ataques.length <= 2);
        const tipos = new Set<string>(), ids = new Set<number>(), zonas = new Set<number>();
        for (const z of s.zonas) {
            exigir(typeof z.capturada === 'boolean' && Array.isArray(z.equipo) && z.equipo.every(t => s.desbloqueadas.includes(t) && !tipos.has(t) && (tipos.add(t), true)) && Number.isFinite(z.descanso) && z.descanso >= 0);
            if (z.punto)
                validarPuntoNativo(z.punto, z.id === 8 ? 5 : 4, z.equipo);
            if (!s.conocidas.includes(z.id)) exigir(!z.capturada && !z.equipo.length && z.punto === null);
            if (z.capturada && (z.id === 9 || !s.inicioCasa)) exigir(z.punto !== null);
        }
        for (const a of s.ataques) {
            exigir(entero(a.id, 1, s.proximo - 1) && !ids.has(a.id) && !zonas.has(a.zona) && s.conocidas.includes(a.zona) && entero(a.semilla, 1, 4294967295) && Number.isFinite(a.inicio) && a.inicio >= 0 && a.inicio <= s.pasos / 60 && JSON.stringify(a.equipo) === JSON.stringify(s.zonas.find(z => z.id === a.zona)?.equipo));
            ids.add(a.id);
            zonas.add(a.zona);
            if (a.punto)
                validarPuntoNativo(a.punto, a.zona === 8 ? 5 : 4, a.equipo);
            exigir(canonicoPvZ(a.punto) === canonicoPvZ(s.zonas.find(z => z.id === a.zona)!.punto));
        }
        exigir(s.perdida === !s.zonas[0].capturada && (!s.inicioCasa || s.conocidas.length === 1 && !s.zonas[1].capturada) && (!s.inicioCasa || s.perdida || s.ataques.some(a => a.zona === 8)));
        return new HistoriaNativa(s);
    }
}
