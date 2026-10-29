/** Retratos del catálogo nativo de Gardendless (hojas generadas por scripts/catalogo-nativo/retratos.py).
 * Las fusiones usan el retrato de su planta base. */
import indice from '../../../public/jardin/pvz/retratos-nativos.json';
import { urlArtePvZ } from '../pvz/arte/catalogo';
import { DERIVADAS_NATIVAS, FUSIONES_NATIVAS, nativoDe } from './nivel-historia';

type Clase = 'plantas' | 'zombis';
const hojas = new Map<Clase, HTMLImageElement>(), cache = new Map<string, string>();
let carga: Promise<void> | null = null;

export function cargarRetratosNativos() {
    carga ??= Promise.all((['plantas', 'zombis'] as const).map(async clase => {
        const img = new Image();
        img.decoding = 'async';
        img.src = urlArtePvZ(`retratos-nativos-${clase}.webp`);
        await img.decode();
        hojas.set(clase, img);
    })).then(() => undefined);
    return carga;
}

function recortar(clase: Clase, id: string) {
    const clave = clase + ':' + id, previo = cache.get(clave);
    if (previo !== undefined) return previo;
    const datos = indice[clase], i = (datos.ids as Record<string, number>)[id], img = hojas.get(clase);
    if (i === undefined || !img) return '';
    const [w, h] = datos.celda, c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d')!.drawImage(img, (i % indice.columnas) * w, Math.floor(i / indice.columnas) * h, w, h, 0, 0, w, h);
    const url = c.toDataURL('image/png');
    cache.set(clave, url);
    return url;
}

/** Retrato de una planta (heredada, nativa o fusión). Vacío si su hoja todavía no cargó. */
export function retratoPlantaNativa(tipo: string) {
    const base = FUSIONES_NATIVAS.find(f => f.id === tipo)?.base ?? DERIVADAS_NATIVAS.find(d => d.id === tipo)?.base;
    return recortar('plantas', base ?? nativoDe(tipo));
}
export const retratoZombiNativo = (id: string) => recortar('zombis', id);
export const tieneRetratoNativo = (clase: Clase, id: string) => Object.hasOwn(indice[clase].ids, id);
