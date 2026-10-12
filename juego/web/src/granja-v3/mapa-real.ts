// El mapa de verdad: fotos desde arriba del mundo, sacadas por cuadros a medida que uno lo recorre (solo existe cargado
// lo que está cerca), guardadas en el celular para la próxima vez; y las marcas que uno pone en el mapa grande.
import type { VistaGranja } from './vista';

/** Metros por cuadro de foto y píxeles por metro (8 px/m alcanza para el minimapa y el mapa grande). */
export const LADO_FOTO = 16, PPM_FOTO = 8;
const PX = LADO_FOTO * PPM_FOTO;
/** Cada cuánto se puede sacar una foto, y cuándo una ya está vieja (las matas crecen, los árboles caen). */
const ENTRE_FOTOS = 600, VIEJA = 45000, GUARDAR_TRAS = 12000;

export interface HojaMapa { clave: string; x0: number; z0: number; cols: number; filas: number; lienzo: HTMLCanvasElement; tomadas: Float64Array; version: number }

const BD = 'granja-mapas', ALMACEN = 'hojas';
let bd: Promise<IDBDatabase | null> | null = null;
function abrir() {
  bd ??= new Promise((res) => {
    try {
      const r = indexedDB.open(BD, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ALMACEN);
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch { res(null); }
  });
  return bd;
}
async function leer(k: string): Promise<{ imagen: Blob; tomadas: number[]; x0: number; z0: number } | undefined> {
  const db = await abrir();
  if (!db) return undefined;
  return new Promise((res) => {
    try { const r = db.transaction(ALMACEN).objectStore(ALMACEN).get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); } catch { res(undefined); }
  });
}
async function escribir(k: string, v: unknown) {
  const db = await abrir();
  if (!db) return;
  try { db.transaction(ALMACEN, 'readwrite').objectStore(ALMACEN).put(v, k); } catch { /* sin espacio: el mapa sigue en memoria */ }
}

export class FotosMapa {
  private hojas = new Map<string, HojaMapa>();
  private ultima = 0;
  private pendientesGuardar = new Map<string, number>();
  private tile = document.createElement('canvas');
  constructor(private vista: VistaGranja, private partida: () => string) {
    this.tile.width = this.tile.height = PX;
    addEventListener('visibilitychange', () => { if (document.hidden) this.guardarTodo(); });
  }
  /** La hoja de una zona (`clave`) con sus límites [x0, x1, z0, z1]; si es nueva, trae la guardada del celular. */
  hoja(clave: string, [x0, x1, z0, z1]: [number, number, number, number]): HojaMapa {
    const k = this.partida() + ':' + clave;
    let h = this.hojas.get(k);
    if (h) return h;
    const cols = Math.ceil((x1 - x0) / LADO_FOTO), filas = Math.ceil((z1 - z0) / LADO_FOTO), lienzo = document.createElement('canvas');
    lienzo.width = cols * PX; lienzo.height = filas * PX;
    h = { clave: k, x0, z0, cols, filas, lienzo, tomadas: new Float64Array(cols * filas), version: 0 };
    this.hojas.set(k, h);
    // Solo tres zonas en memoria (cada hoja pesa unos megas)
    if (this.hojas.size > 3) { const [vieja] = this.hojas.keys(); this.guardar(vieja); this.hojas.delete(vieja); }
    const nueva = h;
    void leer(k).then(async (g) => {
      if (!g || g.x0 !== x0 || g.z0 !== z0 || g.tomadas.length !== cols * filas) return;
      const bmp = await createImageBitmap(g.imagen);
      const ctx = nueva.lienzo.getContext('2d')!;
      // Detrás de lo que ya se haya fotografiado mientras cargaba
      ctx.globalCompositeOperation = 'destination-over'; ctx.drawImage(bmp, 0, 0); ctx.globalCompositeOperation = 'source-over';
      bmp.close();
      g.tomadas.forEach((t, i) => { if (t && !nueva.tomadas[i]) nueva.tomadas[i] = 1; });
      nueva.version++;
    }).catch(() => { /* foto vieja dañada: se vuelve a sacar */ });
    return h;
  }
  /** Saca (como mucho) una foto de un cuadro cercano que falte o esté viejo. */
  tic(clave: string, limites: [number, number, number, number], ahora = performance.now()) {
    if (ahora - this.ultima < ENTRE_FOTOS) return;
    const f = this.vista.zonaFotografiable();
    if (!f || f.clave !== clave) return;
    const h = this.hoja(clave, limites);
    let mejor = -1, puntaje = Infinity;
    const alcance = f.radio - LADO_FOTO * 0.75;
    for (let j = 0; j < h.filas; j++) for (let i = 0; i < h.cols; i++) {
      const cx = h.x0 + (i + 0.5) * LADO_FOTO, cz = h.z0 + (j + 0.5) * LADO_FOTO, d = Math.hypot(cx - f.x, cz - f.z);
      if (d > alcance) continue;
      const t = h.tomadas[j * h.cols + i], edad = ahora - t;
      // Primero lo que nunca se ha visto (lo más cerca); después lo más viejo
      const p = t === 0 ? d : edad > VIEJA ? 1e6 - edad / 1000 : Infinity;
      if (p < puntaje) { puntaje = p; mejor = j * h.cols + i; }
    }
    if (mejor < 0) return;
    this.ultima = ahora;
    const i = mejor % h.cols, j = Math.floor(mejor / h.cols);
    const px = this.vista.fotoCenital(h.x0 + (i + 0.5) * LADO_FOTO, h.z0 + (j + 0.5) * LADO_FOTO, LADO_FOTO, PX);
    const t = this.tile.getContext('2d')!, img = t.createImageData(PX, PX), fila = PX * 4;
    // WebGL entrega las filas de abajo hacia arriba
    for (let y = 0; y < PX; y++) img.data.set(px.subarray((PX - 1 - y) * fila, (PX - y) * fila), y * fila);
    t.putImageData(img, 0, 0);
    const ctx = h.lienzo.getContext('2d')!;
    ctx.clearRect(i * PX, j * PX, PX, PX);
    ctx.drawImage(this.tile, i * PX, j * PX);
    h.tomadas[mejor] = ahora;
    h.version++;
    this.pendientesGuardar.set(h.clave, ahora);
    for (const [k, desde] of this.pendientesGuardar) if (ahora - desde > GUARDAR_TRAS) this.guardar(k);
  }
  /** Cuántos cuadros de la zona ya tienen foto (para las pruebas). */
  cobertura(clave: string) {
    const h = this.hojas.get(this.partida() + ':' + clave);
    return h ? { tomadas: h.tomadas.filter(Boolean).length, total: h.tomadas.length } : { tomadas: 0, total: 0 };
  }
  private guardar(k: string) {
    this.pendientesGuardar.delete(k);
    const h = this.hojas.get(k);
    if (!h) return;
    const tomadas = Array.from(h.tomadas, (t) => (t ? 1 : 0)), { x0, z0 } = h;
    h.lienzo.toBlob((imagen) => { if (imagen) void escribir(k, { imagen, tomadas, x0, z0 }); }, 'image/webp', 0.86);
  }
  guardarTodo() { for (const k of [...this.pendientesGuardar.keys()]) this.guardar(k); }
}

// ── Marcas del mapa grande ─────────────────────────────────────────────────────────────────────
export interface Marca { id: number; zona: string; x: number; z: number }
const CLAVE_MARCAS = 'granja-mapa-marcas';
export class MarcasMapa {
  lista: Marca[] = [];
  activa: number | null = null;
  private partida = '';
  constructor(private deQuien: () => string) { this.cargar(); }
  private cargar() {
    this.partida = this.deQuien();
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_MARCAS) ?? 'null');
      if (g?.partida === this.partida && Array.isArray(g.lista)) {
        this.lista = g.lista.filter((m: Marca) => typeof m?.x === 'number' && typeof m?.z === 'number' && typeof m?.zona === 'string').slice(0, 24);
        this.activa = this.lista.some((m) => m.id === g.activa) ? g.activa : null;
        return;
      }
    } catch { /* nada */ }
    this.lista = []; this.activa = null;
  }
  /** Si cambió la partida (otra granja importada), las marcas de la otra no sirven. */
  revisar() { if (this.deQuien() !== this.partida) this.cargar(); }
  private guardar() { try { localStorage.setItem(CLAVE_MARCAS, JSON.stringify({ partida: this.partida, lista: this.lista, activa: this.activa })); } catch { /* nada */ } }
  /** Toca el mapa: sobre una marca, la sigue (y si ya la seguía, la quita); en otro lado, pone una nueva y te guía. */
  tocar(zona: string, x: number, z: number, radio: number) {
    const cerca = this.lista.filter((m) => m.zona === zona).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
    if (cerca && Math.hypot(cerca.x - x, cerca.z - z) <= radio) {
      if (this.activa === cerca.id) { this.quitar(cerca.id); return 'quitada' as const; }
      this.guiar(cerca.id); return 'guiando' as const;
    }
    const id = Math.max(0, ...this.lista.map((m) => m.id)) + 1;
    this.lista.push({ id, zona, x, z });
    // Hasta 8 marcas por lugar: la más vieja se va
    const deZona = this.lista.filter((m) => m.zona === zona);
    if (deZona.length > 8) this.lista = this.lista.filter((m) => m !== deZona[0]);
    this.activa = id;
    this.guardar();
    return 'puesta' as const;
  }
  quitar(id: number) {
    this.lista = this.lista.filter((m) => m.id !== id);
    if (this.activa === id) this.activa = null;
    this.guardar();
  }
  guiar(id: number) { if (this.lista.some((m) => m.id === id)) { this.activa = id; this.guardar(); } }
  get guia() { return this.lista.find((m) => m.id === this.activa) ?? null; }
}
