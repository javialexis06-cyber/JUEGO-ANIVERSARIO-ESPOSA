// Motor de arte por piezas de Plantas contra Zombis (como el «reanim» de PvZ). Solo navegador: lo usan la vista, la
// interfaz y la galería (herramientas/pvz-galeria.html); el motor del juego NUNCA importa nada de arte/.
//
// MODELO
// - Cada personaje (DefPersonaje) es un conjunto de piezas SVG dibujadas en su MARCO LOCAL (unidades = px de mundo de
//   PvZ 1, y hacia abajo) con el punto de apoyo (pies o base de la maceta) en `ancla`. Plantas miran a la derecha y
//   zombis a la izquierda; `espejo` los voltea.
// - Al cargar, cada pieza y cada variante (`estados` de la pieza) se rasteriza UNA vez a un lienzo fuera de pantalla
//   con la resolución pedida (escala de pantalla × devicePixelRatio), se recorta a su contenido y queda en caché.
// - Cada cuadro se dibuja con drawImage y transformaciones jerárquicas: la pieza hija hereda giro, escala y traslación
//   de su `padre` alrededor de los pivotes. `anim(ctx)` devuelve la pose del cuadro (procedural: tiempo y estado).
// - Tintes por entidad (congelado, hipnotizado, golpe, ceniza) cacheados por pieza; las piezas `sinTinte` (sombras)
//   no se tiñen.
//
// API
//   await cargarPersonajes(defs, escala)          rasteriza todo a `escala` = px de dispositivo por unidad de mundo
//                                                 (p. ej. alto_lienzo_px / 600). Se puede llamar con varias escalas.
//   asegurarCarga(def, escala)                    lo mismo para un personaje (promesa que nunca rechaza)
//   dibujarPersonaje(ctx, def, op)                dibuja en (op.x, op.y) = ancla en UNIDADES DE MUNDO (ver abajo)
//   retrato(def, tam, estado?, op?)               lienzo con el retrato (sobres de semilla con encuadre 'arriba',
//                                                 almanaque con 'completo'); se repinta solo si faltaba el arte
//   piezaSuelta(def, 'brazo' | 'cabeza' | 'casco' | idPieza, op?)
//                                                 lienzo de la parte desprendida (con sus hijas) en su pose actual,
//                                                 con su caja relativa al ancla, para que la vista la haga caer
//   puntoMundo(def, 'boca' | 'cabeza' | …, x, y, escala?, espejo?)
//                                                 punto con nombre en el mundo (de dónde sale el guisante, dónde va
//                                                 la mantequilla)
//   variantesPorDano(def, grupo, restante01)      variantes del casco, la nuez o la bandera según la vida que queda
//   varianteDe(def, grupo, valor)                 variantes de un grupo con un valor concreto
//   aplicarPerdidas(def, ['brazo', 'cabeza'])     { ocultar, variantes } para dibujar al zombi sin esas partes
//   personajeCargado(def), dibujarMarcador(…), liberarArte()   (liberar al salir del juego)
//
// COORDENADAS DE DIBUJO: `dibujarPersonaje` recibe x, y en UNIDADES DE MUNDO. Antes de llamarla, la vista deja en
// el contexto la transformación mundo → píxeles del lienzo, por ejemplo
//   const s = (lienzo.height / ALTO_MUNDO);          // px de dispositivo por unidad (ya incluye devicePixelRatio)
//   ctx.setTransform(s, 0, 0, s, -camaraX * s, 0);
//   dibujarPersonaje(ctx, DEF_ARTE.zombi, { x: z.x, y: centroFila(z.fila) + PIE_ZOMBI, t, estado: 'camina',
//     semilla: z.id, vel: lento ? 0.5 : 1, tinte, ...aplicarPerdidas(DEF_ARTE.zombi, perdidas) });
// La caché que se usa es la de resolución más parecida a |s| × escala; si se dibuja mucho más grande se pide otra en
// segundo plano. Si no hay ninguna cargada se pinta un marcador (círculo con el nombre) y se pide la carga. Nunca lanza
// errores por falta de arte. Los estados de una sola vez (ataca, muere, salta, explota…) reciben `fase` 0..1: la vista
// la calcula con `def.duraciones[estado]`; `def.avances[estado]` dice cuánto avanza en x al terminar (salto).
//
// ROTACIONES en grados (positivo = sentido horario en pantalla). En el marco local, y crece hacia abajo.

export type Tinte = 'congelado' | 'hipnotizado' | 'golpe' | 'ceniza' | null;

export interface DefPieza {
  id: string;
  /** Fragmento SVG en el marco local del personaje (unidades = px de mundo). */
  svg: string;
  /** Punto de giro en el marco local. */
  pivote: [number, number];
  /** Pieza de la que cuelga: hereda su giro, escala y traslación. */
  padre?: string;
  /** Orden de dibujo (absoluto en todo el personaje): menor = más atrás. */
  z: number;
  /** Variantes del svg, p. ej. { abollado: '...', muy_abollado: '...' }. */
  estados?: Record<string, string>;
  /** No se tiñe (sombras en el suelo). */
  sinTinte?: boolean;
  /** Pieza renderizada en Blender (manda sobre `svg`): rectángulo en su hoja y esquina en el marco local. */
  img?: ImagenPieza;
  /** Variantes renderizadas en Blender (mismas claves que `estados`). */
  imgEstados?: Record<string, ImagenPieza>;
}

/** Recorte de una hoja de piezas hecha en Blender (personajes/blender/pvz_sprites.py y pvz_atlas.py). */
export interface ImagenPieza {
  /** URL de la hoja webp. */
  hoja: string;
  /** x, y, ancho, alto en px de la hoja. */
  rect: [number, number, number, number];
  /** Esquina superior izquierda del recorte en el marco local (px de mundo). */
  pos: [number, number];
  /** px de la hoja por px de mundo. */
  escala: number;
}

export interface CtxAnim {
  /** Segundos: reloj para los ciclos (balanceo, caminar). */
  t: number;
  /** Estado de animación: 'quieto', 'ataca', 'camina', 'come', 'muere'… */
  estado: string;
  /** Avance 0..1 de los estados de una sola vez (ataca, muere, salta, explota…). */
  fase: number;
  /** Número propio de cada entidad para desfasar animaciones. */
  semilla: number;
  /** Multiplicador de la velocidad del ciclo (zombi lento = 0.5). */
  vel?: number;
}

export interface PosePieza {
  rot?: number;
  x?: number;
  y?: number;
  sx?: number;
  sy?: number;
  alfa?: number;
  oculto?: boolean;
  variante?: string;
}

/**
 * Pose de un cuadro: id de pieza → transformación relativa a su posición de reposo. Las piezas que no aparecen (o
 * que valen `undefined`) quedan en reposo. La clave especial `_raiz` mueve el personaje entero alrededor del ancla.
 */
export type Pose = Record<string, PosePieza | undefined>;

export interface GrupoVariantes {
  /** Piezas que cambian juntas. */
  piezas: string[];
  /** Valores de la más sana a la más dañada; el primero puede ser la forma base. */
  valores: string[];
}

export interface Perdida {
  /** Piezas que desaparecen del cuerpo (con sus hijas). */
  ocultar: string[];
  /** Variantes que quedan en el cuerpo (p. ej. el brazo con el hueso a la vista). */
  variantes?: Record<string, string>;
}

export interface DefPersonaje {
  id: string;
  nombre?: string;
  /** Tamaño del marco local. */
  ancho: number;
  alto: number;
  /** Punto de apoyo (pies o base de la planta) en el marco local. */
  ancla: [number, number];
  piezas: DefPieza[];
  /** <defs> SVG comunes (degradados) que se agregan a cada pieza al rasterizar. */
  defs?: string;
  anim(ctx: CtxAnim): Pose;
  /** Estados que entiende `anim` (para la galería y las pruebas). */
  estados?: string[];
  /** Duración sugerida (s) de los estados de una sola vez: la vista calcula `fase = tiempo / duración`. */
  duraciones?: Record<string, number>;
  /** Grupos de variantes por daño: casco, cuerpo de la nuez, bandera… */
  variantes?: Record<string, GrupoVariantes>;
  /** Partes que se pueden desprender: 'brazo', 'cabeza', 'casco'… */
  perdidas?: Record<string, Perdida>;
  /** Avance horizontal (marco local) que recorre un estado de una sola vez al llegar a fase 1 (p. ej. el salto). */
  avances?: Record<string, number>;
  /** Puntos con nombre en el marco local: 'boca' (de donde sale el proyectil), 'cabeza' (para la mantequilla)… */
  puntos?: Record<string, [number, number]>;
}

export interface OpcionesDibujo {
  /** Posición del ancla en unidades de mundo (ver la nota de coordenadas arriba). */
  x: number;
  y: number;
  t?: number;
  estado?: string;
  fase?: number;
  semilla?: number;
  vel?: number;
  /** Multiplicador de tamaño (1 = tamaño de juego). */
  escala?: number;
  /** Refleja en horizontal alrededor del ancla (zombi hipnotizado, planta que mira a la izquierda). */
  espejo?: boolean;
  alfa?: number;
  tinte?: Tinte;
  /** Piezas desprendidas o escondidas (con sus hijas). */
  ocultar?: readonly string[];
  /** Variantes forzadas por pieza (mandan sobre la pose). */
  variantes?: Record<string, string>;
  /** Giro extra de todo el personaje alrededor del ancla, en grados. */
  rot?: number;
}

interface Raster {
  lienzo: HTMLCanvasElement;
  /** Esquina y tamaño en el marco local. */
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Cache {
  escala: number;
  rasters: Map<string, Raster | null>;
  tintes: Map<string, Raster>;
}

interface Orden {
  /** Piezas con los padres antes que los hijos. */
  jerarquia: DefPieza[];
  /** Índice del padre de cada pieza de `jerarquia` (-1 = raíz). */
  padre: number[];
  /** Índices de `jerarquia` ordenados por z para dibujar. */
  porZ: number[];
  indice: Map<string, number>;
  /** Matrices de trabajo reutilizadas (6 números por pieza). */
  m: Float64Array;
  visible: Uint8Array;
  alfa: Float64Array;
  variante: (string | undefined)[];
}

const PAD = 8;
// Por definición (no por id): el dibujo SVG y el de Blender del mismo personaje tienen pivotes y marcos distintos y
// no deben mezclar sus piezas.
const caches = new Map<DefPersonaje, Cache[]>();
const pendientes = new Map<DefPersonaje, Map<number, Promise<Cache | null>>>();
const ordenes = new WeakMap<DefPersonaje, Orden>();
let medidor: SVGSVGElement | null = null;

// ---------------------------------------------------------------------------------------------------------------
// Carga y rasterizado

/** Rasteriza (una vez por personaje y escala) todas las piezas y variantes. `escala` = px de dispositivo por unidad. */
export async function cargarPersonajes(defs: DefPersonaje[] | Record<string, DefPersonaje>, escala: number): Promise<void> {
  const lista = Array.isArray(defs) ? defs : Object.values(defs);
  await Promise.all(lista.map((d) => asegurarCarga(d, escala)));
}

/** Carga un personaje a una escala (o reutiliza la caché). Nunca rechaza: si algo falla, devuelve null. */
export function asegurarCarga(def: DefPersonaje, escala: number): Promise<Cache | null> {
  const esc = redondearEscala(escala);
  const ya = (caches.get(def) ?? []).find((c) => c.escala === esc);
  if (ya) return Promise.resolve(ya);
  let porEscala = pendientes.get(def);
  if (!porEscala) pendientes.set(def, (porEscala = new Map()));
  let p = porEscala.get(esc);
  if (!p) {
    p = rasterizar(def, esc)
      .then((c) => {
        const lista = caches.get(def) ?? [];
        lista.push(c);
        lista.sort((a, b) => a.escala - b.escala);
        caches.set(def, lista);
        return c;
      })
      .catch((e) => {
        console.warn('[pvz-arte] no se pudo rasterizar', def.id, e);
        return null;
      })
      .finally(() => porEscala!.delete(esc));
    porEscala.set(esc, p);
  }
  return p;
}

/** ¿Hay alguna caché lista para este personaje? */
export function personajeCargado(def: DefPersonaje): boolean {
  return (caches.get(def)?.length ?? 0) > 0;
}

/** Suelta todas las cachés (al salir del juego). Vacía los lienzos para liberar memoria de una vez. */
export function liberarArte(): void {
  for (const lista of caches.values())
    for (const c of lista) {
      for (const r of c.rasters.values()) if (r) r.lienzo.width = r.lienzo.height = 0;
      for (const r of c.tintes.values()) r.lienzo.width = r.lienzo.height = 0;
    }
  caches.clear();
  pendientes.clear();
  recortesHoja.clear();
  hojas.clear();
  if (medidor) medidor.remove();
  medidor = null;
}

function redondearEscala(e: number): number {
  // Pocas cachés: se agrupan escalas casi iguales (pasos de 1/8).
  return Math.max(0.25, Math.round(e * 8) / 8);
}

const hojas = new Map<string, Promise<HTMLImageElement>>();
const recortesHoja = new Map<string, Promise<Raster | null>>();

function cargarHoja(url: string): Promise<HTMLImageElement> {
  let p = hojas.get(url);
  if (!p) {
    p = new Promise((ok, mal) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => ok(img);
      img.onerror = () => mal(new Error('No se pudo cargar ' + url));
      img.src = url;
    });
    hojas.set(url, p);
  }
  return p;
}

/** Recorte de una hoja de Blender: el lienzo tiene la resolución del render y sirve para todas las escalas. */
function rasterImagen(img: ImagenPieza): Promise<Raster | null> {
  const clave = img.hoja + '#' + img.rect.join(',');
  let p = recortesHoja.get(clave);
  if (!p) {
    p = cargarHoja(img.hoja).then((h) => {
      const [x, y, w, hh] = img.rect;
      const L = lienzo(w, hh);
      L.getContext('2d')!.drawImage(h, x, y, w, hh, 0, 0, w, hh);
      return { lienzo: L, x: img.pos[0], y: img.pos[1], w: w / img.escala, h: hh / img.escala };
    });
    recortesHoja.set(clave, p);
  }
  return p;
}

async function rasterizar(def: DefPersonaje, escala: number): Promise<Cache> {
  const mapa = new Map<string, Raster | null>();
  // Piezas de Blender: recortes de su hoja (no dependen de la escala).
  const deBlender: Promise<void>[] = [];
  for (const p of def.piezas) {
    if (!p.img) continue;
    deBlender.push(rasterImagen(p.img).then((r) => void mapa.set(p.id, r)));
    for (const [v, im] of Object.entries(p.imgEstados ?? {})) deBlender.push(rasterImagen(im).then((r) => void mapa.set(p.id + '|' + v, r)));
  }
  await Promise.all(deBlender);
  const trabajos: { clave: string; svg: string }[] = [];
  for (const p of def.piezas) {
    if (p.img) continue;
    trabajos.push({ clave: p.id, svg: p.svg });
    for (const [v, s] of Object.entries(p.estados ?? {})) trabajos.push({ clave: p.id + '|' + v, svg: s });
  }
  if (!trabajos.length) return { escala, rasters: mapa, tintes: new Map() };
  const cajas = medir(trabajos.map((t) => t.svg), def.defs ?? '');
  const rasters = await Promise.all(
    trabajos.map((t, i) =>
      rasterUno(t.svg, cajas[i], def.defs ?? '', escala).catch((e) => {
        console.warn('[pvz-arte] pieza con error', def.id, t.clave, e);
        return null;
      }),
    ),
  );
  trabajos.forEach((t, i) => mapa.set(t.clave, rasters[i]));
  return { escala, rasters: mapa, tintes: new Map() };
}

/** Mide la caja de cada fragmento con getBBox en un SVG escondido. */
function medir(fragmentos: string[], defs: string): (DOMRect | null)[] {
  if (!medidor) {
    medidor = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    medidor.setAttribute('width', '10');
    medidor.setAttribute('height', '10');
    medidor.style.cssText = 'position:absolute;left:-10000px;top:-10000px;visibility:hidden;pointer-events:none';
    document.body.appendChild(medidor);
  }
  medidor.innerHTML = defs + fragmentos.map((f) => `<g>${f}</g>`).join('');
  const grupos = Array.from(medidor.children).filter((n) => n.tagName.toLowerCase() === 'g') as SVGGElement[];
  const cajas = grupos.map((g) => {
    try {
      const b = g.getBBox();
      return b.width > 0 || b.height > 0 ? b : null;
    } catch {
      return null;
    }
  });
  medidor.innerHTML = '';
  return cajas;
}

function cargarImagen(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  return new Promise((ok, mal) => {
    img.onload = () => {
      URL.revokeObjectURL(url);
      ok(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      mal(new Error('SVG inválido'));
    };
    img.src = url;
  });
}

function lienzo(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

async function rasterUno(svg: string, caja: DOMRect | null, defs: string, escala: number): Promise<Raster | null> {
  if (!caja) return null;
  const bx = caja.x - PAD;
  const by = caja.y - PAD;
  const W = Math.max(1, Math.ceil((caja.width + 2 * PAD) * escala));
  const H = Math.max(1, Math.ceil((caja.height + 2 * PAD) * escala));
  const bw = W / escala;
  const bh = H / escala;
  const doc =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" ` +
    `viewBox="${bx} ${by} ${bw} ${bh}" preserveAspectRatio="none">${defs}${svg}</svg>`;
  const img = await cargarImagen(doc);
  const base = lienzo(W, H);
  const g = base.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, W, H);
  // Recorte automático al contenido (escaneo de alfa).
  const datos = g.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    const fila = y * W * 4;
    for (let x = 0; x < W; x++) {
      if (datos[fila + x * 4 + 3] > 2) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - 1);
  y0 = Math.max(0, y0 - 1);
  x1 = Math.min(W - 1, x1 + 1);
  y1 = Math.min(H - 1, y1 + 1);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const final = lienzo(w, h);
  final.getContext('2d')!.drawImage(base, x0, y0, w, h, 0, 0, w, h);
  base.width = base.height = 0;
  return { lienzo: final, x: bx + x0 / escala, y: by + y0 / escala, w: w / escala, h: h / escala };
}

// ---------------------------------------------------------------------------------------------------------------
// Orden y poses

function orden(def: DefPersonaje): Orden {
  let o = ordenes.get(def);
  if (o) return o;
  const porId = new Map(def.piezas.map((p) => [p.id, p] as const));
  const jerarquia: DefPieza[] = [];
  const puesto = new Set<string>();
  const poner = (p: DefPieza, pila: Set<string>) => {
    if (puesto.has(p.id)) return;
    if (p.padre && porId.has(p.padre) && !pila.has(p.id)) {
      pila.add(p.id);
      poner(porId.get(p.padre)!, pila);
    }
    puesto.add(p.id);
    jerarquia.push(p);
  };
  for (const p of def.piezas) poner(p, new Set());
  const indice = new Map(jerarquia.map((p, i) => [p.id, i] as const));
  const padre = jerarquia.map((p) => (p.padre !== undefined ? indice.get(p.padre) ?? -1 : -1));
  const porZ = jerarquia.map((_, i) => i).sort((a, b) => jerarquia[a].z - jerarquia[b].z || a - b);
  const n = jerarquia.length;
  o = { jerarquia, padre, porZ, indice, m: new Float64Array(n * 6), visible: new Uint8Array(n), alfa: new Float64Array(n), variante: new Array(n) };
  ordenes.set(def, o);
  return o;
}

const RAD = Math.PI / 180;

/** Matriz local de una pieza: T(pivote + desplazamiento) · R · S · T(−pivote). */
function local(px: number, py: number, q: PosePieza | undefined, out: number[]): void {
  const rot = (q?.rot ?? 0) * RAD;
  const sx = q?.sx ?? 1;
  const sy = q?.sy ?? 1;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const a = c * sx, b = s * sx, cc = -s * sy, d = c * sy;
  out[0] = a;
  out[1] = b;
  out[2] = cc;
  out[3] = d;
  out[4] = -(a * px + cc * py) + px + (q?.x ?? 0);
  out[5] = -(b * px + d * py) + py + (q?.y ?? 0);
}

function mult(m1: ArrayLike<number>, o1: number, m2: ArrayLike<number>, o2: number, out: Float64Array | number[], oo: number): void {
  const a1 = m1[o1], b1 = m1[o1 + 1], c1 = m1[o1 + 2], d1 = m1[o1 + 3], e1 = m1[o1 + 4], f1 = m1[o1 + 5];
  const a2 = m2[o2], b2 = m2[o2 + 1], c2 = m2[o2 + 2], d2 = m2[o2 + 3], e2 = m2[o2 + 4], f2 = m2[o2 + 5];
  out[oo] = a1 * a2 + c1 * b2;
  out[oo + 1] = b1 * a2 + d1 * b2;
  out[oo + 2] = a1 * c2 + c1 * d2;
  out[oo + 3] = b1 * c2 + d1 * d2;
  out[oo + 4] = a1 * e2 + c1 * f2 + e1;
  out[oo + 5] = b1 * e2 + d1 * f2 + f1;
}

const tmpL = [1, 0, 0, 1, 0, 0];

/**
 * Calcula las matrices (marco local → marco base), visibilidad, alfa y variante de cada pieza. `base` es la matriz
 * que lleva el marco local al destino (incluye ancla, escala, espejo y giro de toda la figura).
 */
function posar(def: DefPersonaje, o: Orden, pose: Pose, base: number[], ocultar: readonly string[] | undefined, forzadas: Record<string, string> | undefined): void {
  const raiz = pose._raiz;
  const b = [...base];
  if (raiz) {
    local(def.ancla[0], def.ancla[1], raiz, tmpL);
    mult(base, 0, tmpL, 0, b, 0);
  }
  const alfaRaiz = raiz?.alfa ?? 1;
  for (let i = 0; i < o.jerarquia.length; i++) {
    const p = o.jerarquia[i];
    const q = pose[p.id];
    local(p.pivote[0], p.pivote[1], q, tmpL);
    const pi = o.padre[i];
    if (pi >= 0) {
      mult(o.m, pi * 6, tmpL, 0, o.m, i * 6);
      o.visible[i] = o.visible[pi] && !q?.oculto && !(ocultar && ocultar.includes(p.id)) ? 1 : 0;
      o.alfa[i] = o.alfa[pi] * (q?.alfa ?? 1);
    } else {
      mult(b, 0, tmpL, 0, o.m, i * 6);
      o.visible[i] = !q?.oculto && !(ocultar && ocultar.includes(p.id)) ? 1 : 0;
      o.alfa[i] = alfaRaiz * (q?.alfa ?? 1);
    }
    o.variante[i] = forzadas?.[p.id] ?? q?.variante;
  }
}

function rasterDe(c: Cache, p: DefPieza, variante: string | undefined): Raster | null {
  if (variante && p.estados?.[variante] !== undefined) return c.rasters.get(p.id + '|' + variante) ?? null;
  return c.rasters.get(p.id) ?? null;
}

function elegirCache(def: DefPersonaje, necesaria: number): Cache | null {
  const lista = caches.get(def);
  if (!lista || !lista.length) return null;
  let elegida = lista[lista.length - 1];
  for (const c of lista)
    if (c.escala >= necesaria * 0.9) {
      elegida = c;
      break;
    }
  // Si se está dibujando mucho más grande que la caché más fina, se pide una mejor en segundo plano.
  if (necesaria > elegida.escala * 1.6) void asegurarCarga(def, necesaria);
  return elegida;
}

// ---------------------------------------------------------------------------------------------------------------
// Tintes

function tintado(c: Cache, clave: string, r: Raster, tinte: Exclude<Tinte, null>): Raster {
  const k = clave + '#' + tinte;
  const ya = c.tintes.get(k);
  if (ya) return ya;
  const L = lienzo(r.lienzo.width, r.lienzo.height);
  const g = L.getContext('2d')!;
  g.drawImage(r.lienzo, 0, 0);
  if (tinte === 'golpe') {
    // Aclarar sin lavar el color: con varios tiradores el zombi pasa mucho tiempo con este tinte y debe leerse bien.
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(255,255,255,0.28)';
    g.fillRect(0, 0, L.width, L.height);
  } else if (tinte === 'ceniza') {
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#1e1813';
    g.fillRect(0, 0, L.width, L.height);
    // Un poco de brillo arriba para que no sea un hueco plano.
    const gr = g.createLinearGradient(0, 0, 0, L.height);
    gr.addColorStop(0, 'rgba(90,80,70,0.35)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, L.width, L.height);
  } else {
    // Multiplicar por el color y devolver el alfa original; luego un velo claro del mismo tono.
    const [mult, velo] = tinte === 'congelado' ? ['#7fb8ff', 'rgba(170,215,255,0.28)'] : ['#d79cff', 'rgba(235,150,255,0.22)'];
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = mult;
    g.fillRect(0, 0, L.width, L.height);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(r.lienzo, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = velo;
    g.fillRect(0, 0, L.width, L.height);
  }
  const t: Raster = { lienzo: L, x: r.x, y: r.y, w: r.w, h: r.h };
  c.tintes.set(k, t);
  return t;
}

// ---------------------------------------------------------------------------------------------------------------
// Dibujo

const ctxAnim: CtxAnim = { t: 0, estado: 'quieto', fase: 0, semilla: 0 };

function poseDe(def: DefPersonaje, op: { t?: number; estado?: string; fase?: number; semilla?: number; vel?: number }): Pose {
  ctxAnim.t = op.t ?? 0;
  ctxAnim.estado = op.estado ?? def.estados?.[0] ?? 'quieto';
  ctxAnim.fase = Math.min(1, Math.max(0, op.fase ?? 0));
  ctxAnim.semilla = op.semilla ?? 0;
  ctxAnim.vel = op.vel;
  try {
    return def.anim(ctxAnim) ?? {};
  } catch (e) {
    console.warn('[pvz-arte] animación con error', def.id, e);
    return {};
  }
}

/** Matriz base: T(x, y) · S(espejo·escala, escala) · R(rot) · T(−ancla). */
function matrizBase(def: DefPersonaje, x: number, y: number, escala: number, espejo: boolean, rot: number): number[] {
  const r = rot * RAD;
  const c = Math.cos(r), s = Math.sin(r);
  const ex = (espejo ? -1 : 1) * escala, ey = escala;
  const a = ex * c, b = ey * s, cc = -ex * s, d = ey * c;
  const [ax, ay] = def.ancla;
  return [a, b, cc, d, x - (a * ax + cc * ay), y - (b * ax + d * ay)];
}

/** Dibuja un personaje (ver la nota de coordenadas al principio del archivo). */
export function dibujarPersonaje(ctx: CanvasRenderingContext2D, def: DefPersonaje, op: OpcionesDibujo): void {
  const escala = op.escala ?? 1;
  const tr = ctx.getTransform();
  const necesaria = Math.hypot(tr.a, tr.b) * escala;
  const cache = elegirCache(def, necesaria);
  if (!cache) {
    void asegurarCarga(def, necesaria || 1);
    dibujarMarcador(ctx, def, op.x, op.y, escala);
    return;
  }
  const o = orden(def);
  const pose = poseDe(def, op);
  const base = matrizBase(def, op.x, op.y, escala, !!op.espejo, op.rot ?? 0);
  const total = [tr.a, tr.b, tr.c, tr.d, tr.e, tr.f];
  const m = [0, 0, 0, 0, 0, 0];
  mult(total, 0, base, 0, m, 0);
  posar(def, o, pose, m, op.ocultar, op.variantes);
  const alfa0 = ctx.globalAlpha;
  const alfaOp = op.alfa ?? 1;
  const tinte = op.tinte ?? null;
  try {
    // Al desvanecerse entero (muere, ceniza) se compone aparte y luego se baja el alfa: si no, las piezas que se
    // tapan (brazo sobre el cuerpo) se transparentan unas sobre otras.
    if (alfaOp < 0.995 && alfaOp > 0.003) {
      const caja = cajaPose(def, o, cache, () => true);
      if (caja) {
        const x0 = Math.floor(caja.x0) - 2;
        const y0 = Math.floor(caja.y0) - 2;
        const w = Math.ceil(caja.x1) - x0 + 4;
        const h = Math.ceil(caja.y1) - y0 + 4;
        if (w > 0 && h > 0 && w * h <= 4_000_000) {
          lienzoAlfa ??= document.createElement('canvas');
          if (lienzoAlfa.width < w) lienzoAlfa.width = w;
          if (lienzoAlfa.height < h) lienzoAlfa.height = h;
          const g = lienzoAlfa.getContext('2d')!;
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.clearRect(0, 0, w, h);
          pintarPiezas(g, o, cache, tinte, 1, -x0, -y0);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = alfa0 * alfaOp;
          ctx.drawImage(lienzoAlfa, 0, 0, w, h, x0, y0, w, h);
          return;
        }
      }
    }
    ctx.globalAlpha = alfa0;
    pintarPiezas(ctx, o, cache, tinte, alfaOp, 0, 0);
  } finally {
    ctx.setTransform(tr);
    ctx.globalAlpha = alfa0;
  }
}

let lienzoAlfa: HTMLCanvasElement | null = null;

/** Dibuja las piezas ya posadas (matrices en `o.m`, en px del destino) corridas dx, dy. */
function pintarPiezas(ctx: CanvasRenderingContext2D, o: Orden, cache: Cache, tinte: Tinte | null, alfaMul: number, dx: number, dy: number): void {
  const alfa0 = ctx.globalAlpha;
  for (const i of o.porZ) {
    if (!o.visible[i]) continue;
    const a = o.alfa[i] * alfaMul;
    if (a <= 0.003) continue;
    const p = o.jerarquia[i];
    let r = rasterDe(cache, p, o.variante[i]);
    if (!r) continue;
    if (tinte && !p.sinTinte) {
      const v = o.variante[i];
      const clave = v && p.estados?.[v] !== undefined ? p.id + '|' + v : p.id;
      r = tintado(cache, clave, r, tinte);
    }
    const k = i * 6;
    ctx.setTransform(o.m[k], o.m[k + 1], o.m[k + 2], o.m[k + 3], o.m[k + 4] + dx, o.m[k + 5] + dy);
    ctx.globalAlpha = alfa0 * a;
    ctx.drawImage(r.lienzo, r.x, r.y, r.w, r.h);
  }
  ctx.globalAlpha = alfa0;
}

/** Marcador simple cuando falta el arte: nunca rompe el juego. */
export function dibujarMarcador(ctx: CanvasRenderingContext2D, def: { id: string; alto?: number; nombre?: string }, x: number, y: number, escala = 1): void {
  const r = Math.max(10, ((def.alto ?? 60) * 0.32) * escala);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y - r - 4 * escala, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.strokeStyle = '#1d1408';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1d1408';
  ctx.font = `bold ${Math.round(r * 0.42)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((def.nombre ?? def.id).slice(0, 10), x, y - r - 4 * escala);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Límites, retratos y piezas sueltas

interface Caja {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Caja (en el destino de `base`) de las piezas visibles que cumplen `filtro`. */
function cajaPose(def: DefPersonaje, o: Orden, cache: Cache, filtro: (i: number) => boolean): Caja | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < o.jerarquia.length; i++) {
    if (!o.visible[i] || !filtro(i) || o.alfa[i] <= 0.003) continue;
    const r = rasterDe(cache, o.jerarquia[i], o.variante[i]);
    if (!r) continue;
    const k = i * 6;
    for (const [px, py] of [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]]) {
      const X = o.m[k] * px + o.m[k + 2] * py + o.m[k + 4];
      const Y = o.m[k + 1] * px + o.m[k + 3] * py + o.m[k + 5];
      if (X < x0) x0 = X;
      if (X > x1) x1 = X;
      if (Y < y0) y0 = Y;
      if (Y > y1) y1 = Y;
    }
  }
  return x1 > x0 ? { x0, y0, x1, y1 } : null;
}

export interface OpcionesRetrato {
  t?: number;
  fase?: number;
  variantes?: Record<string, string>;
  /** Dejar la sombra del suelo (por defecto no). */
  conSombra?: boolean;
  /** Margen en px del lienzo. */
  margen?: number;
  /** Ancho/alto distintos (por defecto cuadrado `tam`). */
  alto?: number;
  /** 'completo' (por defecto) o 'arriba': recorta la parte de arriba como en los sobres de semillas de PvZ. */
  encuadre?: 'completo' | 'arriba';
}

/**
 * Retrato de un personaje en un lienzo `tam` × `tam` (px del lienzo; multiplicar por devicePixelRatio si hace falta).
 * Si el arte no está cargado todavía, devuelve el lienzo con un marcador y lo vuelve a pintar al terminar la carga.
 */
export function retrato(def: DefPersonaje, tam: number, estado = 'quieto', op: OpcionesRetrato = {}): HTMLCanvasElement {
  const L = lienzo(tam, op.alto ?? tam);
  const pintar = () => pintarRetrato(L, def, estado, op);
  if (!pintar()) {
    const g = L.getContext('2d')!;
    dibujarMarcador(g, def, L.width / 2, L.height * 0.85, (L.height / (def.alto || 80)) * 0.9);
    const necesaria = (Math.max(L.width, L.height) / Math.max(def.alto, def.ancho)) * 1.6;
    void asegurarCarga(def, necesaria).then(() => {
      g.clearRect(0, 0, L.width, L.height);
      pintar();
    });
  }
  return L;
}

function pintarRetrato(L: HTMLCanvasElement, def: DefPersonaje, estado: string, op: OpcionesRetrato): boolean {
  const lista = caches.get(def);
  if (!lista?.length) return false;
  const cache = lista[lista.length - 1];
  const o = orden(def);
  // t = 1,0 por defecto: a los 0 s varios personajes están parpadeando (la Nuez del sobre salía con sueño).
  const pose = poseDe(def, { t: op.t ?? 1, estado, fase: op.fase ?? 0, semilla: 0 });
  posar(def, o, pose, [1, 0, 0, 1, 0, 0], undefined, op.variantes);
  const filtro = (i: number) => !!op.conSombra || !o.jerarquia[i].sinTinte;
  const caja = cajaPose(def, o, cache, filtro);
  if (!caja) return false;
  const margen = op.margen ?? Math.round(L.width * 0.06);
  const w = caja.x1 - caja.x0;
  const h = caja.y1 - caja.y0;
  let s: number;
  let ox: number;
  let oy: number;
  if (op.encuadre === 'arriba') {
    s = (L.width - 2 * margen) / w;
    ox = margen - caja.x0 * s;
    oy = margen - caja.y0 * s;
  } else {
    s = Math.min((L.width - 2 * margen) / w, (L.height - 2 * margen) / h);
    ox = (L.width - w * s) / 2 - caja.x0 * s;
    oy = (L.height - h * s) / 2 - caja.y0 * s;
  }
  // Se elige la caché adecuada al tamaño final y se vuelve a posar con la matriz del retrato.
  const fina = elegirCache(def, s) ?? cache;
  posar(def, o, pose, [s, 0, 0, s, ox, oy], undefined, op.variantes);
  const g = L.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  for (const i of o.porZ) {
    if (!o.visible[i] || !filtro(i)) continue;
    const r = rasterDe(fina, o.jerarquia[i], o.variante[i]);
    if (!r) continue;
    const k = i * 6;
    g.setTransform(o.m[k], o.m[k + 1], o.m[k + 2], o.m[k + 3], o.m[k + 4], o.m[k + 5]);
    g.globalAlpha = o.alfa[i];
    g.drawImage(r.lienzo, r.x, r.y, r.w, r.h);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  return true;
}

export interface Suelta {
  lienzo: HTMLCanvasElement;
  /** Esquina superior izquierda relativa al ancla, en unidades de mundo (sin espejo). */
  x: number;
  y: number;
  /** Tamaño en unidades de mundo. */
  ancho: number;
  alto: number;
}

/**
 * Pinta, en su pose actual, una pieza (o una pérdida de `def.perdidas`, como 'brazo' o 'cabeza', o una lista de
 * piezas) con todas sus hijas en un lienzo propio, para que la vista la haga caer como partícula. Devuelve null si el
 * arte no está cargado.
 */
export function piezaSuelta(
  def: DefPersonaje,
  cual: string | string[],
  op: { t?: number; estado?: string; fase?: number; semilla?: number; variantes?: Record<string, string>; tinte?: Tinte } = {},
): Suelta | null {
  const lista = caches.get(def);
  if (!lista?.length) return null;
  const cache = lista[lista.length - 1];
  const raices = Array.isArray(cual) ? cual : def.perdidas?.[cual]?.ocultar ?? [cual];
  const o = orden(def);
  const incluida = new Uint8Array(o.jerarquia.length);
  for (let i = 0; i < o.jerarquia.length; i++) {
    const pi = o.padre[i];
    incluida[i] = raices.includes(o.jerarquia[i].id) || (pi >= 0 && incluida[pi]) ? 1 : 0;
  }
  const pose = poseDe(def, op);
  const [ax, ay] = def.ancla;
  posar(def, o, pose, [1, 0, 0, 1, -ax, -ay], undefined, op.variantes);
  const caja = cajaPose(def, o, cache, (i) => !!incluida[i]);
  if (!caja) return null;
  const s = cache.escala;
  const L = lienzo((caja.x1 - caja.x0) * s, (caja.y1 - caja.y0) * s);
  posar(def, o, pose, [s, 0, 0, s, -(ax + caja.x0) * s, -(ay + caja.y0) * s], undefined, op.variantes);
  const g = L.getContext('2d')!;
  for (const i of o.porZ) {
    if (!incluida[i] || !o.visible[i]) continue;
    const p = o.jerarquia[i];
    let r = rasterDe(cache, p, o.variante[i]);
    if (!r) continue;
    if (op.tinte && !p.sinTinte) {
      const v = o.variante[i];
      r = tintado(cache, v && p.estados?.[v] !== undefined ? p.id + '|' + v : p.id, r, op.tinte);
    }
    const k = i * 6;
    g.setTransform(o.m[k], o.m[k + 1], o.m[k + 2], o.m[k + 3], o.m[k + 4], o.m[k + 5]);
    g.globalAlpha = o.alfa[i];
    g.drawImage(r.lienzo, r.x, r.y, r.w, r.h);
  }
  return { lienzo: L, x: caja.x0, y: caja.y0, ancho: caja.x1 - caja.x0, alto: caja.y1 - caja.y0 };
}

/**
 * Posición en el mundo de un punto con nombre (p. ej. la boca del Lanzaguisantes) para un personaje dibujado en
 * (x, y) con `escala` y `espejo`. Es la pose de reposo: suficiente para hacer salir proyectiles.
 */
export function puntoMundo(def: DefPersonaje, nombre: string, x: number, y: number, escala = 1, espejo = false): { x: number; y: number } {
  const p = def.puntos?.[nombre] ?? [def.ancla[0], def.ancla[1] - def.alto * 0.5];
  return { x: x + (espejo ? -1 : 1) * (p[0] - def.ancla[0]) * escala, y: y + (p[1] - def.ancla[1]) * escala };
}

// ---------------------------------------------------------------------------------------------------------------
// Variantes por daño

/**
 * Variantes de un grupo según lo que queda (1 = intacto, 0 = a punto de caer). Con 3 valores cambia en 2/3 y 1/3,
 * como el cono, el cubo y la nuez de PvZ.
 */
export function variantesPorDano(def: DefPersonaje, grupo: string, restante: number): Record<string, string> {
  const g = def.variantes?.[grupo];
  if (!g || !g.valores.length) return {};
  const n = g.valores.length;
  const i = Math.min(n - 1, Math.max(0, Math.floor((1 - Math.min(1, Math.max(0, restante))) * n)));
  return varianteDe(def, grupo, g.valores[i]);
}

/** Variantes de un grupo con un valor concreto. */
export function varianteDe(def: DefPersonaje, grupo: string, valor: string): Record<string, string> {
  const g = def.variantes?.[grupo];
  const r: Record<string, string> = {};
  if (g) for (const p of g.piezas) r[p] = valor;
  return r;
}

/** Junta lo que hay que ocultar y las variantes de varias pérdidas (p. ej. ['brazo', 'cabeza']). */
export function aplicarPerdidas(def: DefPersonaje, perdidas: readonly string[]): { ocultar: string[]; variantes: Record<string, string> } {
  const ocultar: string[] = [];
  const variantes: Record<string, string> = {};
  for (const n of perdidas) {
    const p = def.perdidas?.[n];
    if (!p) continue;
    ocultar.push(...p.ocultar);
    Object.assign(variantes, p.variantes ?? {});
  }
  return { ocultar, variantes };
}
