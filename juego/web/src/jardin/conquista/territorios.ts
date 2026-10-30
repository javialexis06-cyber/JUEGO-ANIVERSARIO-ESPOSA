/** Territorios que cubren todo el mapa (pedido de Javier, 30 de octubre de 2026).
 *
 * Cada marcador (país, ciudad o área) reclama la parte del dibujo más cercana a él; las fronteras se ondulan con
 * ruido para que parezcan trazadas a mano y no cuadros. Se pinta en un lienzo de baja resolución que el navegador
 * escala con suavizado: el borde queda como un trazo de acuarela. El mar del mundo y de los países se tiñe menos. */
export type EstadoTerritorio = 'plantas' | 'atacada' | 'recuperable' | 'zombis' | 'bloqueada' | 'mixta';
export interface Territorio { id: number; x: number; y: number; estado: EstadoTerritorio; progreso?: number }

const ANCHO = 384, ALTO = 216;
/** Ruido de valor suave (determinista), para ondular fronteras y texturizar el color. */
function ruido(x: number, y: number, s: number) {
    const h = (i: number, j: number) => { let n = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967295 * 2 - 1; };
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
}
const fbm = (x: number, y: number, s: number) => ruido(x, y, s) * .6 + ruido(x * 2.1, y * 2.1, s + 7) * .28 + ruido(x * 4.3, y * 4.3, s + 13) * .12;

const etiquetasCache = new Map<string, Int16Array>();
/** A qué marcador pertenece cada punto del lienzo (índice en la lista). Se calcula una vez por mapa. */
function etiquetas(clave: string, puntos: readonly { x: number; y: number }[], semilla: number) {
    const hecha = etiquetasCache.get(clave);
    if (hecha) return hecha;
    const e = new Int16Array(ANCHO * ALTO);
    for (let j = 0; j < ALTO; j++) for (let i = 0; i < ANCHO; i++) {
        const px = i / ANCHO * 100, py = j / ALTO * 100;
        // Ondulación de la frontera (en unidades del mapa 16:9).
        const wx = px + 7 * fbm(px / 9, py / 9, semilla), wy = py + 7 * fbm(px / 9 + 40, py / 9 + 40, semilla + 3);
        let mejor = 0, d0 = Infinity;
        for (let k = 0; k < puntos.length; k++) { const dx = (wx - puntos[k].x) * 16, dy = (wy - puntos[k].y) * 9, d = dx * dx + dy * dy; if (d < d0) { d0 = d; mejor = k; } }
        e[j * ANCHO + i] = mejor;
    }
    etiquetasCache.set(clave, e);
    return e;
}
/** Distancia (en píxeles del lienzo, hasta 8) de cada punto a la frontera más cercana. */
const distanciaCache = new Map<string, Uint8Array>();
function distancias(clave: string, e: Int16Array) {
    const hecha = distanciaCache.get(clave);
    if (hecha) return hecha;
    const d = new Uint8Array(ANCHO * ALTO).fill(255), cola: number[] = [];
    for (let j = 0; j < ALTO; j++) for (let i = 0; i < ANCHO; i++) {
        const p = j * ANCHO + i, v = e[p];
        if ((i > 0 && e[p - 1] !== v) || (i < ANCHO - 1 && e[p + 1] !== v) || (j > 0 && e[p - ANCHO] !== v) || (j < ALTO - 1 && e[p + ANCHO] !== v)) { d[p] = 0; cola.push(p); }
    }
    for (let k = 0; k < cola.length; k++) {
        const p = cola[k], i = p % ANCHO, j = (p - i) / ANCHO, n = d[p] + 1;
        if (n > 8) continue;
        for (const q of [i > 0 ? p - 1 : -1, i < ANCHO - 1 ? p + 1 : -1, j > 0 ? p - ANCHO : -1, j < ALTO - 1 ? p + ANCHO : -1]) if (q >= 0 && d[q] > n) { d[q] = n; cola.push(q); }
    }
    distanciaCache.set(clave, d);
    return d;
}
/** Agua del dibujo (mar azul): ahí el color del dueño se nota menos para no tapar islas y costas. */
const aguaCache = new Map<string, Promise<Uint8Array | null>>();
function agua(url: string) {
    if (!aguaCache.has(url)) aguaCache.set(url, new Promise(ok => {
        const img = new Image();
        img.onload = () => {
            try {
                const c = document.createElement('canvas'); c.width = ANCHO; c.height = ALTO;
                const g = c.getContext('2d', { willReadFrequently: true })!; g.drawImage(img, 0, 0, ANCHO, ALTO);
                const px = g.getImageData(0, 0, ANCHO, ALTO).data, m = new Uint8Array(ANCHO * ALTO);
                for (let p = 0; p < m.length; p++) { const r = px[p * 4], gg = px[p * 4 + 1], b = px[p * 4 + 2]; m[p] = b > 90 && b > r * 1.25 && b > gg * 1.02 ? 1 : 0; }
                ok(m);
            } catch { ok(null); }
        };
        img.onerror = () => ok(null);
        img.src = url;
    }));
    return aguaCache.get(url)!;
}
const COLORES: Record<EstadoTerritorio, { relleno: [number, number, number]; borde: [number, number, number]; alfa: number; trama: 'rayas' | 'puntos' }> = {
    plantas: { relleno: [86, 214, 74], borde: [214, 255, 160], alfa: .3, trama: 'puntos' },
    atacada: { relleno: [86, 214, 74], borde: [255, 96, 64], alfa: .3, trama: 'puntos' },
    recuperable: { relleno: [150, 72, 212], borde: [255, 214, 92], alfa: .4, trama: 'rayas' },
    zombis: { relleno: [140, 60, 200], borde: [214, 170, 255], alfa: .48, trama: 'rayas' },
    bloqueada: { relleno: [118, 46, 176], borde: [190, 150, 235], alfa: .55, trama: 'rayas' },
    mixta: { relleno: [140, 60, 200], borde: [244, 222, 168], alfa: .42, trama: 'rayas' },
};
export class CapaTerritorios {
    readonly lienzo = document.createElement('canvas');
    private zonas: Territorio[] = [];
    private clave = '';
    constructor() {
        this.lienzo.width = ANCHO; this.lienzo.height = ALTO;
        this.lienzo.className = 'hn-territorios';
        this.lienzo.setAttribute('aria-hidden', 'true');
    }
    /** Pinta los territorios. `clave` identifica el mapa (escala y lugar) para reutilizar la partición. */
    async pintar(clave: string, fondo: string, zonas: Territorio[], semilla: number) {
        this.zonas = zonas; this.clave = clave;
        const e = etiquetas(clave, zonas, semilla), d = distancias(clave, e), mar = fondo.includes('ciudad') ? null : await agua(fondo);
        if (this.clave !== clave) return;
        const g = this.lienzo.getContext('2d')!, img = g.createImageData(ANCHO, ALTO), px = img.data;
        for (let j = 0; j < ALTO; j++) for (let i = 0; i < ANCHO; i++) {
            const p = j * ANCHO + i, z = zonas[e[p]], c = COLORES[z.estado];
            let rgb = c.relleno, alfa = c.alfa;
            // Mixta: franjas diagonales verdes en la proporción recuperada.
            if (z.estado === 'mixta' && ((i + j) % 14) / 14 < (z.progreso ?? 0)) rgb = COLORES.plantas.relleno;
            // Textura de pincel y un halo más intenso cerca de la frontera.
            const cerca = d[p] <= 8 ? (8 - d[p]) / 8 : 0;
            alfa = alfa * (0.8 + 0.35 * fbm(i / 11, j / 11, 91)) + cerca * cerca * 0.3;
            // Trama de pincel: rayado diagonal en lo zombi, punteado de hojas en lo nuestro.
            if (c.trama === 'rayas' && rgb !== COLORES.plantas.relleno && (i - j + 512) % 9 < 2) alfa += 0.14;
            else if (c.trama === 'puntos' && (i * 7 + j * 13) % 29 === 0) alfa += 0.25;
            if (mar?.[p]) alfa *= 0.4;
            let [r, gg, b] = rgb;
            if (d[p] <= 1) { [r, gg, b] = c.borde; alfa = 0.95; }
            else if (d[p] === 2) { [r, gg, b] = c.borde; alfa = 0.45; }
            px[p * 4] = r; px[p * 4 + 1] = gg; px[p * 4 + 2] = b; px[p * 4 + 3] = Math.round(Math.min(1, alfa) * 255);
        }
        g.putImageData(img, 0, 0);
    }
    /** Qué territorio hay bajo un punto del lienzo en pantalla (para tocar la región y no solo su marcador). */
    territorioEn(ev: { clientX: number; clientY: number }) {
        const r = this.lienzo.getBoundingClientRect();
        const i = Math.floor((ev.clientX - r.left) / r.width * ANCHO), j = Math.floor((ev.clientY - r.top) / r.height * ALTO);
        if (i < 0 || j < 0 || i >= ANCHO || j >= ALTO) return null;
        const e = etiquetasCache.get(this.clave);
        return e ? this.zonas[e[j * ANCHO + i]] ?? null : null;
    }
}
