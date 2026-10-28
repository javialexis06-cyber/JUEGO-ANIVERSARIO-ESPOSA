/** Reglas del versus de dos personas sobre Gardendless: un jugador siembra con las reglas nativas y el otro suelta
 * zombis pagando cerebros. Valores provisionales, pendientes de la aprobación de Javier (docs/en-obra/pvz-versus-nativo.md):
 * cerebros, costes, recargas y duración se ajustan aquí sin tocar el motor. */
import catalogo from '../../../public/jardin/motores/pvz2/catalogo-historia.json';

export interface ZombiVersus { id: string; nombre: string; propio: string; coste: number; recarga: number; agua?: boolean }
export const ZOMBIS_VERSUS: readonly ZombiVersus[] = [
    { id: 'tutorial', nombre: 'Zombi', propio: 'zombi', coste: 50, recarga: 5 },
    { id: 'tutorial_armor1', nombre: 'Caracono', propio: 'caracono', coste: 75, recarga: 7.5 },
    { id: 'modern_newspaper', nombre: 'Zombi con periódico', propio: 'zombi-periodico', coste: 100, recarga: 10 },
    { id: 'swashbuckler', nombre: 'Pirata espadachín', propio: 'saltador', coste: 100, recarga: 15 },
    { id: 'tutorial_armor2', nombre: 'Caracubo', propio: 'caracubo', coste: 125, recarga: 15 },
    { id: 'tutorial_armor4', nombre: 'Cabezaladrillo', propio: 'zombi-portero', coste: 150, recarga: 20 },
    { id: 'modern_allstar', nombre: 'Zombi futbolista', propio: 'zombi-futbolista', coste: 175, recarga: 25 },
    { id: 'eighties_breakdancer', nombre: 'Breakdancer', propio: 'zombi-bailon', coste: 200, recarga: 25 },
    { id: 'duckytube', nombre: 'Zombi flotador', propio: 'zombi-flotador', coste: 50, recarga: 5, agua: true },
    { id: 'duckytube_armor1', nombre: 'Caracono flotador', propio: 'caracono-flotador', coste: 75, recarga: 7.5, agua: true },
    { id: 'duckytube_armor2', nombre: 'Caracubo flotador', propio: 'caracubo-flotador', coste: 125, recarga: 15, agua: true },
];
export const VERSUS = { duracion: 300, cerebrosIniciales: 150, ingreso: 25, cadaSegundos: 4, maxCerebros: 9990 } as const;

/** Del tipo nativo de una planta o zombi al identificador del arte propio (para dibujar la vista remota). */
export const PROPIO_PLANTA: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(catalogo.tipos).map(([propio, nativo]) => [nativo, propio]));
export const PROPIO_ZOMBI: Readonly<Record<string, string>> = { ...Object.fromEntries(Object.entries(catalogo.zombis).reverse().map(([propio, nativo]) => [nativo, propio])), tutorial: 'zombi' };

export interface EstadoReglasVersus { t: number; cerebros: number; recargas: Record<string, number>; acumulado: number }

/** La cuenta de cerebros y recargas la lleva quien tiene el motor (en una sala, el anfitrión). */
export class ReglasVersus {
    estado: EstadoReglasVersus = { t: 0, cerebros: VERSUS.cerebrosIniciales, recargas: {}, acumulado: 0 };
    constructor(readonly agua: readonly number[], readonly filas: number) {}
    get restante() { return Math.max(0, VERSUS.duracion - this.estado.t); }
    avanzar(dt: number) {
        const e = this.estado;
        if (!(dt > 0)) return;
        e.t += dt;
        e.acumulado += dt;
        while (e.acumulado >= VERSUS.cadaSegundos) { e.acumulado -= VERSUS.cadaSegundos; e.cerebros = Math.min(VERSUS.maxCerebros, e.cerebros + VERSUS.ingreso); }
        for (const k of Object.keys(e.recargas)) { e.recargas[k] = Math.max(0, e.recargas[k] - dt); if (!e.recargas[k]) delete e.recargas[k]; }
    }
    /** Motivo por el que no se puede soltar ese zombi en esa fila, o null si se puede. */
    impedimento(id: string, fila: number): string | null {
        const z = ZOMBIS_VERSUS.find(z => z.id === id);
        if (!z) return 'Ese zombi no juega en el versus.';
        if (!Number.isInteger(fila) || fila < 0 || fila >= this.filas) return 'Ese carril no existe.';
        if (!!z.agua !== this.agua.includes(fila)) return z.agua ? 'Los flotadores van por el agua.' : 'En el agua solo entran zombis con flotador.';
        if (this.estado.recargas[id]) return 'Todavía se está recargando.';
        if (this.estado.cerebros < z.coste) return 'Faltan cerebros.';
        if (this.restante <= 0) return 'Se acabó el tiempo.';
        return null;
    }
    gastar(id: string) {
        const z = ZOMBIS_VERSUS.find(z => z.id === id)!;
        this.estado.cerebros -= z.coste;
        this.estado.recargas[id] = z.recarga;
    }
    /** Zombis que tienen sentido en este escenario (los flotadores solo si hay agua). */
    disponibles() { return ZOMBIS_VERSUS.filter(z => !z.agua || this.agua.length > 0); }
}
