import { HistoriaNativa, type PartidaHistoriaNativa } from './historia-nativa-motor';
import type { AlmacenConquista } from './guardado';
/** Clave independiente y comparación antes de escribir: nunca importa ni reemplaza V2. */
export class GuardadoHistoriaNativa {
    error = '';
    private original: string | null = null;
    private habilitado = false;
    constructor(private almacen: AlmacenConquista, readonly clave: string) { }
    leer() { try {
        this.original = this.almacen.getItem(this.clave);
        const m = this.original === null ? null : HistoriaNativa.restaurar(JSON.parse(this.original));
        this.habilitado = true;
        this.error = '';
        return m;
    }
    catch {
        this.habilitado = false;
        this.error = 'No se pudo abrir esta historia. El archivo original se conserva.';
        return null;
    } }
    guardar(m: PartidaHistoriaNativa) { try {
        if (!this.habilitado || this.almacen.getItem(this.clave) !== this.original)
            throw Error();
        HistoriaNativa.restaurar(m);
        const raw = JSON.stringify(m);
        this.almacen.setItem(this.clave, raw);
        this.original = raw;
        this.error = '';
        return true;
    }
    catch {
        this.error = 'No se pudo guardar. Conserva la ventana abierta y exporta la historia antes de salir.';
        return false;
    } }
}
