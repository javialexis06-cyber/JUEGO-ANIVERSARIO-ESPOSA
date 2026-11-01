/** Versus por territorios (pedido de Javier, 1 de noviembre de 2026): dos personas se disputan un mapa con zonas
 * neutrales y juegan varias batallas a la vez sobre Gardendless, con las áreas y mundos de la historia.
 * Javier dejó el balance del versus a criterio de Claude (29 de octubre); las cifras se explican en
 * docs/en-obra/pvz-versus-nativo.md.
 *
 * Cada batalla es un duelo del versus en el tablero de su zona: las plantas la ganan si resisten su reloj sin que un
 * zombi entre a la casa; los zombis, si uno entra. Quien gana se queda la zona (las plantas conservan su defensa
 * para la próxima batalla de esa zona). Gana la partida quien toma la base rival o, al acabar el tiempo, quien tenga
 * más zonas. Este módulo no toca el motor: lo usa quien corre los tableros y el invitado solo lo refleja. */
import { AREAS_CAMPANA, AREA_CASA } from '../conquista/campana-datos';
import { ZOMBIS_VERSUS } from './versus-reglas';

export type Lado = 'plantas' | 'zombis';
export interface ZonaVT { id: number; area: number; x: number; y: number; vecinos: number[]; base: Lado | null }
/** Lo que elige quien crea la partida; con esto los dos dispositivos arman el mismo mapa. */
export interface EleccionVT { version: 1; modo: 'territorios'; sesion: string; semilla: number; duracion: number; semillas: string[]; zonas: ZonaVT[] }
export interface BatallaVT {
    id: number; zona: number; iniciador: Lado;
    /** Segundos jugados y reloj que deben resistir las plantas. */
    t: number; duracion: number;
    /** El tablero ya está abierto (mientras carga, el reloj no corre y no se sueltan zombis). */
    lista: boolean;
    /** Quién ganó, mientras el coordinador guarda la defensa y cierra la batalla. */
    fin: Lado | null;
    /** Guarnición de una zona zombi: suelta un zombi cada `guarnicion` segundos (0, sin guarnición). */
    guarnicion: number; proxima: number; soltados: number;
}
export interface EstadoVT {
    t: number; duenos: (Lado | null)[]; batallas: BatallaVT[]; espera: number[];
    cerebros: number; recargas: Record<string, number>; acumulado: number;
    ganador: Lado | 'empate' | null; motivo: '' | 'casa' | 'guarida' | 'tiempo'; contador: number;
}
export type EventoVT = { tipo: 'reloj'; zona: number } | { tipo: 'guarnicion'; zona: number; zombi: string; fila: number } | { tipo: 'fin' };

export const VT = {
    neutrales: [3, 5, 7, 9] as readonly number[],
    duraciones: [600, 900, 1200] as readonly number[],
    /** Reloj de cada batalla: La casa resiste menos tiempo (ventaja de local) y la guarida, más. */
    batalla: 120, batallaCasa: 100, batallaGuarida: 150,
    /** Tras una batalla la zona descansa antes de que la ataquen otra vez. */
    espera: 25,
    maxPorLado: 3, maxTotal: 6,
    cerebrosIniciales: 200, cadaSegundos: 4, ingresoBase: 15, ingresoPorBatalla: 15, ingresoPorZona: 10, maxCerebros: 2000,
    solesBase: 150, solesPorZona: 50, solesMax: 400,
    guarnicion: 10, guarnicionGuarida: 6, primeraGuarnicion: 12,
} as const;

/** Fortalezas de Umbra (sin la del Dr. Zomboid) que sirven de guarida zombi. */
export const GUARIDAS: readonly number[] = [224, 229, 234];
const COLUMNAS: Readonly<Record<number, readonly number[]>> = { 3: [1, 1, 1], 5: [2, 1, 2], 7: [2, 3, 2], 9: [3, 3, 3] };
/** Puntos en tierra firme de mapa-pais.webp (porcentaje del dibujo 16:9). */
const XS = [33, 51, 68];
const YS: Readonly<Record<number, readonly number[]>> = { 1: [47], 2: [30, 66], 3: [24, 47, 69] };
const BASE_PLANTAS = { x: 16, y: 40 }, BASE_ZOMBIS = { x: 85, y: 37 };

/** Azar determinista (mulberry32): el mismo número da el mismo mapa en los dos dispositivos. */
export function azarVT(semilla: number) {
    let s = semilla >>> 0 || 1;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Hay zonas con agua solo si las plantas llevan nenúfar: sin él no se puede defender un carril de agua. */
export const llevaNenufar = (semillas: readonly string[]) => semillas.some(t => t === 'nenufar' || t === 'lilypad');

/** Una zona por país (mundo distinto), de 4 a 6 carriles, sin fortalezas ni áreas heredadas. */
export function areasNeutrales(n: number, semilla: number, conAgua: boolean): number[] {
    const r = azarVT(semilla), paises = Array.from({ length: 12 }, (_, i) => i);
    for (let i = paises.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [paises[i], paises[j]] = [paises[j], paises[i]]; }
    const sirve = (a: (typeof AREAS_CAMPANA)[number]) => a.tipo !== 'fortaleza' && !a.heredada && a.filas >= 4 && a.filas <= 6 && (conAgua || !a.agua.length);
    const elegidas: number[] = [];
    // Dos vueltas: primero un mundo distinto por zona; si faltaran, se repite mundo con otra área.
    for (let vuelta = 0; vuelta < 2 && elegidas.length < n; vuelta++)
        for (const p of paises) {
            if (elegidas.length >= n) break;
            const opciones = AREAS_CAMPANA.filter(a => a.pais === p && sirve(a) && !elegidas.includes(a.id));
            if (opciones.length && (vuelta || !elegidas.some(id => AREAS_CAMPANA[id].pais === p))) elegidas.push(opciones[Math.floor(r() * opciones.length)].id);
        }
    return elegidas;
}

export function crearEleccionVT(o: { sesion: string; semilla: number; neutrales: number; duracion: number; semillas: string[] }): EleccionVT {
    const columnas = COLUMNAS[o.neutrales] ?? COLUMNAS[5], r = azarVT(o.semilla ^ 0x9e3779b9);
    const areas = areasNeutrales(columnas.reduce((a, b) => a + b, 0), o.semilla, llevaNenufar(o.semillas));
    const zonas: ZonaVT[] = [{ id: 0, area: AREA_CASA, ...BASE_PLANTAS, vecinos: [], base: 'plantas' }];
    const porColumna: number[][] = [];
    let k = 0;
    columnas.forEach((n, c) => {
        porColumna.push([]);
        for (let j = 0; j < n; j++) {
            const id = zonas.length;
            zonas.push({ id, area: areas[k++], x: Math.round((XS[c] + (r() - .5) * 4) * 10) / 10, y: Math.round((YS[n][j] + (r() - .5) * 4) * 10) / 10, vecinos: [], base: null });
            porColumna[c].push(id);
        }
    });
    const guarida: ZonaVT = { id: zonas.length, area: GUARIDAS[Math.floor(r() * GUARIDAS.length)], ...BASE_ZOMBIS, vecinos: [], base: 'zombis' };
    zonas.push(guarida);
    const unir = (a: number, b: number) => { if (a !== b && !zonas[a].vecinos.includes(b)) { zonas[a].vecinos.push(b); zonas[b].vecinos.push(a); } };
    for (const id of porColumna[0]) unir(0, id);
    for (const id of porColumna[porColumna.length - 1]) unir(guarida.id, id);
    for (let c = 0; c < porColumna.length; c++) {
        const col = porColumna[c];
        for (let j = 0; j + 1 < col.length; j++) unir(col[j], col[j + 1]);
        const sig = porColumna[c + 1];
        if (sig) col.forEach((a, j) => sig.forEach((b, i) => { if (Math.abs((j + .5) / col.length - (i + .5) / sig.length) <= .34) unir(a, b); }));
    }
    for (const z of zonas) z.vecinos.sort((a, b) => a - b);
    return { version: 1, modo: 'territorios', sesion: o.sesion, semilla: o.semilla, duracion: o.duracion, semillas: [...o.semillas], zonas };
}

/** Lo que llega por la sala se revisa entero antes de usarlo. */
export function eleccionVTSegura(v: unknown, semillaValida: (t: string) => boolean): v is EleccionVT {
    const e = v as EleccionVT;
    if (!e || e.version !== 1 || e.modo !== 'territorios' || typeof e.sesion !== 'string' || e.sesion.length < 8 || e.sesion.length > 80 || !Number.isSafeInteger(e.semilla)) return false;
    if (!VT.duraciones.includes(e.duracion) || !Array.isArray(e.semillas) || e.semillas.length < 1 || e.semillas.length > 8 || new Set(e.semillas).size !== e.semillas.length || !e.semillas.every(t => typeof t === 'string' && semillaValida(t))) return false;
    if (!Array.isArray(e.zonas) || e.zonas.length < 5 || e.zonas.length > 11) return false;
    return e.zonas.every((z, i) => z && z.id === i && Number.isInteger(z.area) && !!AREAS_CAMPANA[z.area] && Number.isFinite(z.x) && Number.isFinite(z.y) && z.x >= 0 && z.x <= 100 && z.y >= 0 && z.y <= 100
        && (z.base === null || z.base === 'plantas' || z.base === 'zombis') && Array.isArray(z.vecinos) && z.vecinos.every(n => Number.isInteger(n) && n >= 0 && n < e.zonas.length && n !== i && e.zonas[n]?.vecinos?.includes(i)))
        && e.zonas.filter(z => z.base === 'plantas').length === 1 && e.zonas.filter(z => z.base === 'zombis').length === 1;
}

export class ReglasTerritorios {
    estado: EstadoVT;
    readonly maxTotal: number;
    private r: () => number;
    constructor(readonly eleccion: EleccionVT, opciones: { maxTotal?: number } = {}) {
        this.maxTotal = Math.max(1, Math.min(VT.maxTotal, opciones.maxTotal ?? VT.maxTotal));
        this.estado = { t: 0, duenos: eleccion.zonas.map(z => z.base), batallas: [], espera: eleccion.zonas.map(() => 0), cerebros: VT.cerebrosIniciales, recargas: {}, acumulado: 0, ganador: null, motivo: '', contador: 0 };
        this.r = azarVT(eleccion.semilla ^ 0x51ed270b);
    }
    get restante() { return Math.max(0, this.eleccion.duracion - this.estado.t); }
    zona(id: number) { return this.eleccion.zonas[id]; }
    area(id: number) { return AREAS_CAMPANA[this.eleccion.zonas[id].area]; }
    batalla(id: number) { return this.estado.batallas.find(b => b.zona === id); }
    zonasDe(lado: Lado | null) { return this.estado.duenos.filter(d => d === lado).length; }
    /** Cerebros cada `cadaSegundos`: base, más por cada batalla abierta y por cada zona zombi que no es la guarida. */
    ingreso() {
        const e = this.estado;
        return VT.ingresoBase + VT.ingresoPorBatalla * e.batallas.filter(b => b.lista && !b.fin).length + VT.ingresoPorZona * this.eleccion.zonas.filter(z => !z.base && e.duenos[z.id] === 'zombis').length;
    }
    /** Soles con que empiezan las plantas en un tablero nuevo: más cuantas más zonas suyas. */
    solesIniciales() {
        const n = this.eleccion.zonas.filter(z => !z.base && this.estado.duenos[z.id] === 'plantas').length;
        return Math.min(VT.solesMax, VT.solesBase + VT.solesPorZona * n);
    }
    duracionDe(id: number) { const b = this.zona(id).base; return b === 'plantas' ? VT.batallaCasa : b === 'zombis' ? VT.batallaGuarida : VT.batalla; }
    /** Por qué ese bando no puede abrir una batalla en esa zona, o null si puede. */
    impedimentoAtaque(lado: Lado, id: number): string | null {
        const e = this.estado, z = this.eleccion.zonas[id];
        if (e.ganador) return 'La partida terminó.';
        if (!z) return 'Esa zona no existe.';
        if (e.duenos[id] === lado) return lado === 'plantas' ? 'Esa zona ya es de las plantas.' : 'Esa zona ya es de los zombis.';
        if (this.batalla(id)) return 'Ya hay una batalla en esa zona.';
        if (e.espera[id] > 0) return `La zona se está recuperando: ${Math.ceil(e.espera[id])} s.`;
        if (!z.vecinos.some(v => e.duenos[v] === lado)) return 'Solo se ataca una zona vecina de las tuyas.';
        if (e.batallas.filter(b => b.iniciador === lado).length >= VT.maxPorLado) return `Ya tienes ${VT.maxPorLado} ataques abiertos.`;
        if (e.batallas.length >= this.maxTotal) return 'Hay demasiadas batallas a la vez.';
        return null;
    }
    atacar(lado: Lado, id: number): BatallaVT {
        const motivo = this.impedimentoAtaque(lado, id);
        if (motivo) throw new Error(motivo);
        const e = this.estado, z = this.zona(id), deZombis = e.duenos[id] === 'zombis';
        const b: BatallaVT = { id: ++e.contador, zona: id, iniciador: lado, t: 0, duracion: this.duracionDe(id), lista: false, fin: null,
            guarnicion: deZombis ? (z.base === 'zombis' ? VT.guarnicionGuarida : VT.guarnicion) : 0, proxima: VT.primeraGuarnicion, soltados: 0 };
        e.batallas.push(b);
        return b;
    }
    marcarLista(id: number) { const b = this.batalla(id); if (b) b.lista = true; }
    /** El tablero no se pudo abrir: la batalla se anula sin cambiar de dueño. */
    cancelar(id: number) { this.estado.batallas = this.estado.batallas.filter(b => b.zona !== id); }
    /** Anota quién ganó una batalla mientras se cierra; false si ya estaba decidida. */
    marcarFin(id: number, ganador: Lado) { const b = this.batalla(id); if (!b || b.fin) return false; b.fin = ganador; return true; }
    avanzar(dt: number): EventoVT[] {
        const e = this.estado, ev: EventoVT[] = [];
        if (!(dt > 0) || e.ganador) return ev;
        dt = Math.min(dt, 1);
        e.t += dt; e.acumulado += dt;
        while (e.acumulado >= VT.cadaSegundos) { e.acumulado -= VT.cadaSegundos; e.cerebros = Math.min(VT.maxCerebros, e.cerebros + this.ingreso()); }
        for (const k of Object.keys(e.recargas)) { e.recargas[k] = Math.max(0, e.recargas[k] - dt); if (!e.recargas[k]) delete e.recargas[k]; }
        for (let i = 0; i < e.espera.length; i++) e.espera[i] = Math.max(0, e.espera[i] - dt);
        for (const b of e.batallas) {
            if (!b.lista || b.fin) continue;
            b.t = Math.min(b.duracion, b.t + dt);
            if (b.t >= b.duracion) { b.fin = 'plantas'; ev.push({ tipo: 'reloj', zona: b.zona }); continue; }
            if (b.guarnicion) { b.proxima -= dt; if (b.proxima <= 0) { b.proxima += b.guarnicion; ev.push(this.guarnicion(b)); } }
        }
        if (e.t >= this.eleccion.duracion && !e.ganador) {
            const p = this.zonasDe('plantas'), z = this.zonasDe('zombis');
            e.ganador = p > z ? 'plantas' : z > p ? 'zombis' : 'empate'; e.motivo = 'tiempo';
            ev.push({ tipo: 'fin' });
        }
        return ev;
    }
    private guarnicion(b: BatallaVT): EventoVT {
        const a = this.area(b.zona), fila = Math.floor(this.r() * a.filas), fuerte = this.zona(b.zona).base === 'zombis';
        const lista = a.agua.includes(fila)
            ? (fuerte ? ['duckytube', 'duckytube_armor1', 'duckytube_armor2'] : ['duckytube', 'duckytube', 'duckytube_armor1'])
            : (fuerte ? ['tutorial', 'tutorial_armor1', 'tutorial_armor2', 'modern_newspaper'] : ['tutorial', 'tutorial', 'tutorial_armor1']);
        b.soltados++;
        return { tipo: 'guarnicion', zona: b.zona, zombi: lista[Math.floor(this.r() * lista.length)], fila };
    }
    /** La batalla termina y `ganador` se queda la zona. Devuelve true si con eso termina la partida. */
    resolver(id: number, ganador: Lado): boolean {
        const e = this.estado;
        if (!this.batalla(id) || e.ganador) return !!e.ganador;
        e.batallas = e.batallas.filter(b => b.zona !== id);
        e.duenos[id] = ganador; e.espera[id] = VT.espera;
        const base = this.zona(id).base;
        if (base && base !== ganador) { e.ganador = ganador; e.motivo = base === 'plantas' ? 'casa' : 'guarida'; }
        return !!e.ganador;
    }
    /** Por qué no se puede soltar ese zombi en ese carril de esa zona, o null si se puede. */
    impedimentoZombi(tipo: string, id: number, fila: number): string | null {
        const z = ZOMBIS_VERSUS.find(x => x.id === tipo), e = this.estado;
        if (!z) return 'Ese zombi no juega en el versus.';
        if (e.ganador) return 'La partida terminó.';
        const b = this.batalla(id);
        if (!b) return 'En esa zona no hay batalla.';
        if (!b.lista) return 'Esa batalla todavía se está preparando.';
        if (b.fin) return 'Esa batalla ya terminó.';
        const a = this.area(id);
        if (!Number.isInteger(fila) || fila < 0 || fila >= a.filas) return 'Ese carril no existe.';
        if (!!z.agua !== a.agua.includes(fila)) return z.agua ? 'Los flotadores van por el agua.' : 'En el agua solo entran zombis con flotador.';
        if (e.recargas[tipo]) return 'Todavía se está recargando.';
        if (e.cerebros < z.coste) return 'Faltan cerebros.';
        return null;
    }
    gastar(tipo: string) { const z = ZOMBIS_VERSUS.find(x => x.id === tipo)!; this.estado.cerebros -= z.coste; this.estado.recargas[tipo] = z.recarga; }
    /** Si el motor no pudo soltarlo, se devuelve lo pagado. */
    devolver(tipo: string) { const z = ZOMBIS_VERSUS.find(x => x.id === tipo); if (!z) return; this.estado.cerebros = Math.min(VT.maxCerebros, this.estado.cerebros + z.coste); delete this.estado.recargas[tipo]; }
    /** Zombis del mazo: los flotadores solo si en el mapa hay agua. */
    disponibles() { const agua = this.eleccion.zonas.some(z => AREAS_CAMPANA[z.area].agua.length > 0); return ZOMBIS_VERSUS.filter(z => !z.agua || agua); }
}
