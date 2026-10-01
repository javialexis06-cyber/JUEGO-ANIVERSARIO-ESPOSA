// Los recortes renderizados de la cocina (comida, loza, máquinas y fondos): salen de Blender
// (personajes/blender/cocina_sprites.py y cocina_fondos.py) y vienen empacados en hojas webp con su hojas.json.
// Cada recorte trae su ancla (dónde cae el origen del modelo) y su medida de referencia en metros: se dibuja diciendo
// cuántas unidades del juego mide esa referencia (el radio del wafle, el alto del vaso…).
import type { G } from './dibujo';

export interface Recorte {
  /** Hoja y rectángulo en la hoja. */
  h: number;
  x: number;
  y: number;
  w: number;
  a: number;
  /** Ancla (px dentro del recorte). */
  ax: number;
  ay: number;
  /** Píxeles por metro y medida de referencia (m). */
  ppm: number;
  ref: number;
  elev?: number;
  puntos?: Record<string, [number, number]>;
  [k: string]: unknown;
}
export interface Fondo {
  w: number;
  h: number;
  /** Lo que el fondo trae marcado (alto del mesón, del piso…), en fracciones del alto. */
  [k: string]: unknown;
}

interface Datos {
  hojas: { archivo: string; w: number; h: number }[];
  recortes: Record<string, Recorte>;
  fondos: Record<string, Fondo>;
}

let datos: Datos | null = null;
let hojas: (HTMLImageElement | ImageBitmap)[] = [];
const fondos = new Map<string, HTMLImageElement>();
let cargando: Promise<void> | null = null;
const BASE = './cocina/';

function imagen(ruta: string) {
  return new Promise<HTMLImageElement>((ok) => {
    const i = new Image();
    i.decoding = 'async';
    i.onload = () => ok(i);
    i.onerror = () => ok(i);
    i.src = ruta;
  });
}

/** Carga las hojas (una sola vez; las siguientes veces resuelve de una). */
export function cargarRecortes(): Promise<void> {
  cargando ??= (async () => {
    try {
      const r = await fetch(`${BASE}hojas.json`);
      datos = (await r.json()) as Datos;
      hojas = await Promise.all(datos.hojas.map((h) => imagen(BASE + h.archivo)));
    } catch {
      datos = { hojas: [], recortes: {}, fondos: {} };
    }
  })();
  return cargando;
}

/** Suelta las imágenes grandes (al salir de la cocina, para no dejar memoria ocupada en el celular). */
export function soltarFondos() {
  fondos.clear();
}

export const hay = (id: string) => !!datos?.recortes[id] && !!hojas[datos.recortes[id].h];
export const recorte = (id: string): Recorte | null => datos?.recortes[id] ?? null;
export const listo = () => !!datos && hojas.length > 0;

/** Escala (unidades del juego por px del recorte) para que la referencia mida `tam`. */
export function escala(id: string, tam: number) {
  const r = datos?.recortes[id];
  return r ? tam / (r.ref * r.ppm) : 0;
}

/** Un punto marcado del recorte, en coordenadas del juego (dibujado en x, y con tamaño tam). */
export function punto(id: string, nombre: string, x: number, y: number, tam: number): { x: number; y: number } {
  const r = datos?.recortes[id];
  const p = r?.puntos?.[nombre];
  if (!r || !p) return { x, y };
  const k = tam / (r.ref * r.ppm);
  return { x: x + (p[0] - r.ax) * k, y: y + (p[1] - r.ay) * k };
}

/** Medida en unidades del juego de algo que mide `m` metros en el modelo de `id` (dibujado con tamaño tam). */
export function metros(id: string, m: number, tam: number) {
  const r = datos?.recortes[id];
  return r ? (m / r.ref) * tam : 0;
}

export interface OpcionesSpr {
  rot?: number;
  alfa?: number;
  /** Estira en x o y (voltear una wafflera, aplastar un rebote). */
  ex?: number;
  ey?: number;
  /** Voltea horizontalmente. */
  espejo?: boolean;
}

/** Dibuja el recorte con su ancla en (x, y) y la referencia midiendo `tam` unidades del juego. */
export function spr(g: G, id: string, x: number, y: number, tam: number, o?: OpcionesSpr): boolean {
  const r = datos?.recortes[id];
  const hoja = r ? hojas[r.h] : null;
  if (!r || !hoja) return false;
  const k = tam / (r.ref * r.ppm);
  if (!o || (!o.rot && o.ex === undefined && o.ey === undefined && !o.espejo)) {
    if (o?.alfa !== undefined) g.globalAlpha *= o.alfa;
    g.drawImage(hoja, r.x, r.y, r.w, r.a, x - r.ax * k, y - r.ay * k, r.w * k, r.a * k);
    if (o?.alfa !== undefined) g.globalAlpha /= o.alfa || 1;
    return true;
  }
  g.save();
  if (o.alfa !== undefined) g.globalAlpha *= o.alfa;
  g.translate(x, y);
  if (o.rot) g.rotate(o.rot);
  g.scale((o.ex ?? 1) * (o.espejo ? -1 : 1), o.ey ?? 1);
  g.drawImage(hoja, r.x, r.y, r.w, r.a, -r.ax * k, -r.ay * k, r.w * k, r.a * k);
  g.restore();
  return true;
}

/** Caja que ocupa el recorte dibujado (para tocarlo). */
export function caja(id: string, x: number, y: number, tam: number) {
  const r = datos?.recortes[id];
  if (!r) return { x: x - tam, y: y - tam, w: tam * 2, h: tam * 2 };
  const k = tam / (r.ref * r.ppm);
  return { x: x - r.ax * k, y: y - r.ay * k, w: r.w * k, h: r.a * k };
}

/** Un fondo grande (webp suelto). Devuelve null mientras carga (se pinta el de respaldo). */
export function fondo(id: string): { img: HTMLImageElement; info: Fondo } | null {
  const info = datos?.fondos[id];
  if (!info) return null;
  let i = fondos.get(id);
  if (!i) {
    i = new Image();
    i.decoding = 'async';
    i.src = `${BASE}${id}.webp`;
    fondos.set(id, i);
  }
  return i.complete && i.naturalWidth ? { img: i, info } : null;
}
/** true si todavía falta algo por cargar de estos fondos (o las hojas mismas): se vuelve a pintar luego. */
export function pendiente(ids: string[]) {
  if (!datos) return true;
  return ids.some((id) => !!datos!.fondos[id] && !fondo(id));
}

/** Precarga un fondo y avisa cuando esté. */
export function precargarFondo(id: string): Promise<void> {
  const f = fondo(id);
  if (f) return Promise.resolve();
  const i = fondos.get(id);
  if (!i) return Promise.resolve();
  return new Promise((ok) => {
    i.addEventListener('load', () => ok(), { once: true });
    i.addEventListener('error', () => ok(), { once: true });
  });
}
