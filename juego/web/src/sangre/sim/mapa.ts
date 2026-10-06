// El mapa de una etapa: una rejilla de celdas de 1 m (roca blanda, dura, vetas, borde, agua, lava…) generada al azar
// según el bioma: cuevas orgánicas (autómata celular), ruinas de salones y pasillos, o campo abierto con montículos.
// Las paredes se excavan caminando contra ellas; cada cambio queda anotado para el dibujo y para la red.
import { Azar, hash2 } from '../../casa/lavado/azar';
import { C, VIDA_CELDA, esExcavable, esSolida, tapaLuz } from '../tipos';
import type { DefBioma } from '../datos/mundo';

export interface Antorcha {
  /** Celda de la pared donde cuelga. */
  cx: number;
  cy: number;
  /** Hacia dónde mira (la celda abierta de al lado). */
  dx: number;
  dy: number;
  /** Vela de piso en vez de antorcha de pared. */
  vela?: boolean;
}

export interface Deco {
  tipo: string;
  x: number;
  y: number;
  rot: number;
  esc: number;
}

export class Mapa {
  readonly w: number;
  readonly h: number;
  readonly c: Uint8Array;
  readonly hp: Float32Array;
  /** Variante visual de cada celda (0-255). */
  readonly v: Uint8Array;
  antorchas: Antorcha[] = [];
  deco: Deco[] = [];
  inicio = { x: 0, y: 0 };
  /** Rieles de la carreta (centros de celda en orden). */
  rieles: { x: number; y: number }[] = [];
  /** Celdas cambiadas desde la última vez que alguien las leyó (dibujo, luz, red). */
  cambios: number[] = [];
  version = 0;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.c = new Uint8Array(w * h);
    this.hp = new Float32Array(w * h);
    this.v = new Uint8Array(w * h);
  }

  idx(cx: number, cy: number) {
    return cy * this.w + cx;
  }
  dentro(cx: number, cy: number) {
    return cx >= 0 && cy >= 0 && cx < this.w && cy < this.h;
  }
  get(cx: number, cy: number): number {
    return this.dentro(cx, cy) ? this.c[cy * this.w + cx] : C.BORDE;
  }
  /** ¿La posición (m) cae en una celda que no se pisa? */
  solidaEn(x: number, y: number): boolean {
    return esSolida(this.get(Math.floor(x), Math.floor(y)));
  }
  libre(cx: number, cy: number) {
    return !esSolida(this.get(cx, cy));
  }

  poner(cx: number, cy: number, tipo: number) {
    if (!this.dentro(cx, cy)) return;
    const i = cy * this.w + cx;
    if (this.c[i] === tipo) return;
    this.c[i] = tipo;
    this.hp[i] = VIDA_CELDA[tipo] ?? 0;
    this.cambios.push(i);
    this.version++;
  }

  /** Le quita vida a una pared. Devuelve el tipo que tenía si se rompió (o -1). */
  excavar(cx: number, cy: number, cuanto: number): number {
    if (!this.dentro(cx, cy)) return -1;
    const i = cy * this.w + cx;
    const t = this.c[i];
    if (!esExcavable(t)) return -1;
    this.hp[i] -= cuanto;
    if (this.hp[i] > 0) return -1;
    this.c[i] = C.VACIO;
    this.hp[i] = 0;
    this.cambios.push(i);
    this.version++;
    return t;
  }

  /** ¿Hay línea de vista entre dos puntos (las paredes la tapan)? */
  vista(x0: number, y0: number, x1: number, y1: number): boolean {
    const dx = x1 - x0, dy = y1 - y0;
    const n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2);
    for (let k = 1; k < n; k++) {
      const t = k / n;
      if (tapaLuz(this.get(Math.floor(x0 + dx * t), Math.floor(y0 + dy * t)))) return false;
    }
    return true;
  }

  /** Celda abierta más cercana a (x, y) (para soltar cosas o salir de una pared). */
  abiertaCerca(x: number, y: number, max = 8): { x: number; y: number } | null {
    const cx0 = Math.floor(x), cy0 = Math.floor(y);
    for (let r = 0; r <= max; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const cx = cx0 + dx, cy = cy0 + dy;
          if (this.get(cx, cy) === C.VACIO) return { x: cx + 0.5, y: cy + 0.5 };
        }
    return null;
  }

  /** ¿La pared toca una celda abierta (es una cara que se ve)? */
  expuesta(cx: number, cy: number) {
    return !esSolida(this.get(cx + 1, cy)) || !esSolida(this.get(cx - 1, cy)) || !esSolida(this.get(cx, cy + 1)) || !esSolida(this.get(cx, cy - 1));
  }

  /** ¿Una celda abierta tiene alguna pared al lado? */
  cercaPared(cx: number, cy: number) {
    return esSolida(this.get(cx + 1, cy)) || esSolida(this.get(cx - 1, cy)) || esSolida(this.get(cx, cy + 1)) || esSolida(this.get(cx, cy - 1));
  }

  /** Distancias por celdas abiertas desde un punto (BFS 4 vecinos). 65535 = no se llega. */
  distancias(x: number, y: number, pasaExcavable = false): Uint16Array {
    const d = new Uint16Array(this.w * this.h).fill(65535);
    const cola = new Int32Array(this.w * this.h);
    let a = 0, b = 0;
    const i0 = this.idx(Math.floor(x), Math.floor(y));
    d[i0] = 0;
    cola[b++] = i0;
    while (a < b) {
      const i = cola[a++];
      const cx = i % this.w, cy = (i / this.w) | 0;
      const nd = d[i] + 1;
      for (let k = 0; k < 4; k++) {
        const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (!this.dentro(nx, ny)) continue;
        const j = ny * this.w + nx;
        if (d[j] !== 65535) continue;
        const t = this.c[j];
        if (esSolida(t) && !(pasaExcavable && esExcavable(t) && t !== C.LAVA)) continue;
        d[j] = nd;
        cola[b++] = j;
      }
    }
    return d;
  }
}

// ------------------------------------------------------------------------------------------------- Ruido
function ruido(x: number, y: number, s: number) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, s), b = hash2(x0 + 1, y0, s), c = hash2(x0, y0 + 1, s), d = hash2(x0 + 1, y0 + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, s: number, oct = 3) {
  let t = 0, amp = 0.5, f = 1, n = 0;
  for (let o = 0; o < oct; o++) {
    t += ruido(x * f, y * f, s + o * 17) * amp;
    n += amp;
    amp *= 0.5;
    f *= 2;
  }
  return t / n;
}

// ------------------------------------------------------------------------------------------------- Generación
export interface OpcionesMapa {
  bioma: DefBioma;
  semilla: number;
  jugadores: number;
  rocaDura: boolean;
  sinAntorchas: boolean;
  /** Vetas de hierro que pide el objetivo. */
  vetasHierro: number;
  carreta: boolean;
  /** Mapa pequeño y fijo para la prueba guiada. */
  tutorial?: boolean;
}

export function generarMapa(o: OpcionesMapa): Mapa {
  if (o.tutorial) return mapaTutorial(o);
  const az = new Azar(o.semilla);
  // (mapas grandes, como Deep Rock: más cuevas que recorrer y más vetas que encontrar)
  const lado = 68 + 6 * Math.max(0, o.jugadores - 1);
  const m = new Mapa(lado, lado);
  const s = o.semilla % 9973;
  // 1. Todo es roca: dura donde el ruido lo dice (y en el borde, imposible)
  for (let cy = 0; cy < lado; cy++)
    for (let cx = 0; cx < lado; cx++) {
      const i = m.idx(cx, cy);
      const borde = cx < 2 || cy < 2 || cx >= lado - 2 || cy >= lado - 2;
      const n = fbm(cx / 9, cy / 9, s + 3);
      m.c[i] = borde ? C.BORDE : n > (o.rocaDura ? 0.38 : 0.6) ? C.DURA : C.BLANDA;
      m.v[i] = Math.floor(hash2(cx, cy, s) * 256);
    }
  // 2. Tallar según el estilo
  if (o.bioma.estilo === 'ruinas') tallarRuinas(m, az);
  else tallarCuevas(m, az, o.bioma.estilo === 'abierto' ? 0.56 : 0.47, s);
  // 3. Cámara de inicio en el centro
  const c0 = Math.floor(lado / 2);
  m.inicio = { x: c0 + 0.5, y: c0 + 0.5 };
  circulo(m, c0, c0, 4.3, C.VACIO);
  // 4. Que lo grande quede conectado; los bolsillos chicos se quedan cerrados (se llega excavando)
  conectar(m, az);
  // 5. Líquidos
  if (o.bioma.liquido) charcos(m, az, o.bioma.liquido === 'lava' ? C.LAVA : C.AGUA);
  // 6. La carreta: rieles desde cerca del inicio hasta lejos, con escombros que tapan
  if (o.carreta) rieles(m, az);
  // 7. Vetas
  const n = abiertas(m);
  // (más vetas: la minería es la que paga la Forja y el yunque)
  vetas(m, az, C.HIERRO, o.vetasHierro + 6, 3, 5, 8);
  vetas(m, az, C.SANGRE, 4 + Math.floor(n / 600), 2, 4, 7);
  vetas(m, az, C.ORO, 6 + Math.floor(n / 450), 2, 5, 6);
  // Vida de cada celda según su tipo
  for (let i = 0; i < m.c.length; i++) m.hp[i] = VIDA_CELDA[m.c[i]] ?? 0;
  // 8. Antorchas y decoración
  if (!o.sinAntorchas) antorchas(m, az, o.bioma.antorchas);
  decorar(m, az, o.bioma);
  m.cambios.length = 0;
  m.version = 1;
  return m;
}

function circulo(m: Mapa, cx: number, cy: number, r: number, t: number) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
      if (x < 2 || y < 2 || x >= m.w - 2 || y >= m.h - 2) continue;
      m.c[m.idx(x, y)] = t;
    }
}

function abiertas(m: Mapa) {
  let n = 0;
  for (let i = 0; i < m.c.length; i++) if (m.c[i] === C.VACIO) n++;
  return n;
}

/** Cuevas: relleno al azar y suavizado de autómata celular (4-5 vecinos). */
function tallarCuevas(m: Mapa, az: Azar, abierto: number, s: number) {
  const { w, h } = m;
  const abiertaA = new Uint8Array(w * h);
  for (let y = 2; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      // Un poco de ruido grande para que haya zonas más abiertas y otras más cerradas
      const sesgo = (fbm(x / 14, y / 14, s + 99) - 0.5) * 0.35;
      abiertaA[y * w + x] = az.n() < abierto + sesgo ? 1 : 0;
    }
  let b = new Uint8Array(w * h);
  for (let it = 0; it < 5; it++) {
    for (let y = 2; y < h - 2; y++)
      for (let x = 2; x < w - 2; x++) {
        let vecinas = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) vecinas += abiertaA[(y + dy) * w + x + dx] ? 0 : 1;
        const i = y * w + x;
        b[i] = vecinas >= 5 ? 0 : vecinas <= 3 ? 1 : abiertaA[i];
      }
    const t = abiertaA.slice();
    abiertaA.set(b);
    b = t;
  }
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) if (abiertaA[y * w + x]) m.c[m.idx(x, y)] = C.VACIO;
}

/** Ruinas: salones rectangulares unidos por pasillos (árbol mínimo), con escombros y bordes carcomidos. */
function tallarRuinas(m: Mapa, az: Azar) {
  const salones: { x: number; y: number; w: number; h: number }[] = [];
  for (let k = 0; k < 160 && salones.length < 16; k++) {
    const w = az.entero(5, 11), h = az.entero(5, 10);
    const x = az.entero(3, m.w - w - 4), y = az.entero(3, m.h - h - 4);
    if (salones.some((s) => x < s.x + s.w + 2 && x + w + 2 > s.x && y < s.y + s.h + 2 && y + h + 2 > s.y)) continue;
    salones.push({ x, y, w, h });
  }
  // Un salón grande en el centro (la cámara de inicio)
  const cx = Math.floor(m.w / 2), cy = Math.floor(m.h / 2);
  salones.push({ x: cx - 5, y: cy - 4, w: 10, h: 8 });
  for (const s of salones) {
    for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) m.c[m.idx(x, y)] = C.VACIO;
    // Columnas o escombros dentro de los salones grandes
    if (s.w >= 8 && s.h >= 7 && az.n() < 0.6) {
      for (const [px, py] of [[s.x + 2, s.y + 2], [s.x + s.w - 3, s.y + 2], [s.x + 2, s.y + s.h - 3], [s.x + s.w - 3, s.y + s.h - 3]]) m.c[m.idx(px, py)] = C.DURA;
    }
  }
  // Pasillos: cada salón con el más cercano ya unido (árbol), y unos pocos extra para hacer ciclos
  const centro = (s: (typeof salones)[number]) => ({ x: Math.floor(s.x + s.w / 2), y: Math.floor(s.y + s.h / 2) });
  const unidos = [salones.length - 1];
  const pend = salones.map((_, i) => i).filter((i) => i !== salones.length - 1);
  const pasillo = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ancho = az.n() < 0.5 ? 2 : 3;
    let x = a.x, y = a.y;
    const horizontalPrimero = az.n() < 0.5;
    const paso = (tx: number, ty: number) => {
      while (x !== tx || y !== ty) {
        for (let d = 0; d < ancho; d++) {
          const px = horizontalPrimero ? x : x + d, py = horizontalPrimero ? y + d : y;
          if (px > 1 && py > 1 && px < m.w - 2 && py < m.h - 2) m.c[m.idx(px, py)] = C.VACIO;
          const qx = !horizontalPrimero ? x : x + d, qy = !horizontalPrimero ? y + d : y;
          if (qx > 1 && qy > 1 && qx < m.w - 2 && qy < m.h - 2) m.c[m.idx(qx, qy)] = C.VACIO;
        }
        if (x !== tx) x += Math.sign(tx - x);
        else y += Math.sign(ty - y);
      }
    };
    if (horizontalPrimero) {
      paso(b.x, y);
      paso(b.x, b.y);
    } else {
      paso(x, b.y);
      paso(b.x, b.y);
    }
  };
  while (pend.length) {
    let mejor = 0, mejorD = Infinity, de = 0;
    for (let k = 0; k < pend.length; k++)
      for (const u of unidos) {
        const a = centro(salones[pend[k]]), b = centro(salones[u]);
        const d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        if (d < mejorD) {
          mejorD = d;
          mejor = k;
          de = u;
        }
      }
    const i = pend.splice(mejor, 1)[0];
    pasillo(centro(salones[i]), centro(salones[de]));
    unidos.push(i);
  }
  for (let k = 0; k < 3; k++) pasillo(centro(az.uno(salones)), centro(az.uno(salones)));
  // Muros de los salones: piedra dura; los bordes de los pasillos, carcomidos
  for (let y = 2; y < m.h - 2; y++)
    for (let x = 2; x < m.w - 2; x++) {
      const i = m.idx(x, y);
      if (m.c[i] === C.VACIO) continue;
      if (m.expuesta(x, y)) m.c[i] = az.n() < 0.72 ? C.DURA : C.BLANDA;
    }
  // Escombros sueltos en los pasillos (paredes blandas que se rompen de un golpe)
  for (let k = 0; k < 40; k++) {
    const x = az.entero(3, m.w - 4), y = az.entero(3, m.h - 4);
    if (m.c[m.idx(x, y)] === C.VACIO && Math.hypot(x - cx, y - cy) > 7) m.c[m.idx(x, y)] = C.BLANDA;
  }
}

/** Regiones abiertas: la del inicio se une con todas las grandes por túneles; las chiquitas se rellenan o quedan de bolsillo. */
function conectar(m: Mapa, az: Azar) {
  const reg = new Int32Array(m.w * m.h).fill(-1);
  const tam: number[] = [];
  const celdasDe: number[][] = [];
  for (let i = 0; i < m.c.length; i++) {
    if (m.c[i] !== C.VACIO || reg[i] >= 0) continue;
    const r = tam.length;
    const cola = [i];
    reg[i] = r;
    const lista: number[] = [];
    while (cola.length) {
      const k = cola.pop()!;
      lista.push(k);
      const x = k % m.w, y = (k / m.w) | 0;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (!m.dentro(nx, ny)) continue;
        const j = m.idx(nx, ny);
        if (m.c[j] === C.VACIO && reg[j] < 0) {
          reg[j] = r;
          cola.push(j);
        }
      }
    }
    tam.push(lista.length);
    celdasDe.push(lista);
  }
  const principal = reg[m.idx(Math.floor(m.inicio.x), Math.floor(m.inicio.y))];
  for (let r = 0; r < tam.length; r++) {
    if (r === principal) continue;
    if (tam[r] < 7) {
      for (const k of celdasDe[r]) m.c[k] = C.BLANDA;
      continue;
    }
    // Los bolsillos medianos se quedan cerrados la mitad de las veces (se llega excavando: ahí hay botín)
    if (tam[r] < 40 && az.n() < 0.5) continue;
    // Túnel serpenteante hasta la celda más cercana de la región principal
    const a = celdasDe[r][Math.floor(az.n() * celdasDe[r].length)];
    let mejor = -1, md = Infinity;
    const ax = a % m.w, ay = (a / m.w) | 0;
    for (const k of celdasDe[principal]) {
      const d = Math.abs((k % m.w) - ax) + Math.abs(((k / m.w) | 0) - ay);
      if (d < md) {
        md = d;
        mejor = k;
      }
    }
    if (mejor < 0) continue;
    let x = ax, y = ay;
    const tx = mejor % m.w, ty = (mejor / m.w) | 0;
    while (x !== tx || y !== ty) {
      if (az.n() < 0.5 ? x !== tx : y === ty) x += Math.sign(tx - x);
      else y += Math.sign(ty - y);
      for (const [px, py] of [[x, y], [x + 1, y], [x, y + 1]])
        if (px > 1 && py > 1 && px < m.w - 2 && py < m.h - 2 && m.c[m.idx(px, py)] !== C.BORDE) m.c[m.idx(px, py)] = C.VACIO;
    }
  }
}

/** Charcos de agua negra (frenan) o lava (no se pisa); la lava no debe partir el mapa. */
function charcos(m: Mapa, az: Azar, tipo: number) {
  const n = tipo === C.LAVA ? 5 : 7;
  let hechos = 0;
  for (let k = 0; k < n * 6 && hechos < n; k++) {
    const x = az.entero(4, m.w - 5), y = az.entero(4, m.h - 5);
    if (Math.hypot(x - m.inicio.x, y - m.inicio.y) < 9 || m.c[m.idx(x, y)] !== C.VACIO) continue;
    const r = az.entre(1.4, tipo === C.LAVA ? 2.4 : 3.2);
    const cambiadas: number[] = [];
    for (let yy = Math.floor(y - r); yy <= y + r; yy++)
      for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        if (!m.dentro(xx, yy) || (xx - x) ** 2 + (yy - y) ** 2 > r * r) continue;
        const i = m.idx(xx, yy);
        if (m.c[i] !== C.VACIO) continue;
        if (fbm(xx / 2.5, yy / 2.5, k + 400) < 0.35) continue;
        m.c[i] = tipo;
        cambiadas.push(i);
      }
    // La lava no puede dejar partes del mapa sin camino: si parte, se deshace
    if (tipo === C.LAVA && cambiadas.length) {
      const d = m.distancias(m.inicio.x, m.inicio.y);
      let antes = 0;
      for (let i = 0; i < m.c.length; i++) if (m.c[i] === C.VACIO && d[i] === 65535) antes++;
      if (antes > 0) {
        for (const i of cambiadas) m.c[i] = C.VACIO;
        // Puede que ya hubiera bolsillos cerrados: solo se cuenta si esta lava los creó
        const d2 = m.distancias(m.inicio.x, m.inicio.y);
        let despues = 0;
        for (let i = 0; i < m.c.length; i++) if (m.c[i] === C.VACIO && d2[i] === 65535) despues++;
        if (despues < antes) continue;
        for (const i of cambiadas) m.c[i] = tipo;
      }
    }
    if (cambiadas.length) hechos++;
  }
}

/** Vetas: racimos de 3 a 6 celdas dentro de la roca, tocando un espacio abierto (o a uno o dos golpes de pico). */
function vetas(m: Mapa, az: Azar, tipo: number, cuantas: number, min: number, max: number, sep: number) {
  const puestas: { x: number; y: number }[] = [];
  for (let k = 0; k < cuantas * 60 && puestas.length < cuantas; k++) {
    const x = az.entero(3, m.w - 4), y = az.entero(3, m.h - 4);
    const t = m.c[m.idx(x, y)];
    if (t !== C.BLANDA && t !== C.DURA) continue;
    if (!m.expuesta(x, y) && az.n() < 0.7) continue;
    if (Math.hypot(x - m.inicio.x, y - m.inicio.y) < 7) continue;
    if (puestas.some((p) => Math.hypot(p.x - x, p.y - y) < sep)) continue;
    const tam = az.entero(min, max);
    let cx = x, cy = y;
    for (let n = 0; n < tam * 3 && n < 20; n++) {
      const tt = m.c[m.idx(cx, cy)];
      if (tt === C.BLANDA || tt === C.DURA) m.c[m.idx(cx, cy)] = tipo;
      const d = az.entero(0, 3);
      const nx = cx + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = cy + (d === 2 ? 1 : d === 3 ? -1 : 0);
      const nt = m.get(nx, ny);
      if (nt === C.BLANDA || nt === C.DURA || nt === tipo) {
        cx = nx;
        cy = ny;
      }
    }
    puestas.push({ x, y });
  }
}

/** Rieles: un camino de A (cerca del inicio) a B (lejos), tallado por la roca, con escombros que la tapan. */
function rieles(m: Mapa, az: Azar) {
  const d = m.distancias(m.inicio.x, m.inicio.y, true);
  // Destino: la celda alcanzable (excavando) más lejana dentro de un margen
  let mejor = -1, md = 0;
  for (let i = 0; i < m.c.length; i++) {
    const x = i % m.w, y = (i / m.w) | 0;
    if (x < 5 || y < 5 || x >= m.w - 5 || y >= m.h - 5 || d[i] === 65535) continue;
    const dd = d[i] + az.n() * 6;
    if (dd > md) {
      md = dd;
      mejor = i;
    }
  }
  if (mejor < 0) return;
  // Camino: del destino hacia atrás bajando por las distancias (con algo de ruido para que no sea recto)
  let x = mejor % m.w, y = (mejor / m.w) | 0;
  const camino: { x: number; y: number }[] = [{ x, y }];
  const inicioX = Math.floor(m.inicio.x) + 3, inicioY = Math.floor(m.inicio.y);
  for (let k = 0; k < 400; k++) {
    let bx = x, by = y, bd = d[m.idx(x, y)];
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (!m.dentro(nx, ny)) continue;
      const nd = d[m.idx(nx, ny)];
      if (nd < bd) {
        bd = nd;
        bx = nx;
        by = ny;
      }
    }
    if (bx === x && by === y) break;
    x = bx;
    y = by;
    camino.push({ x, y });
    if (Math.abs(x - inicioX) + Math.abs(y - inicioY) < 2) break;
  }
  camino.reverse();
  // Tallar el camino (2 de ancho) y poner escombros cada tanto
  let desdeEscombro = 0;
  for (let k = 0; k < camino.length; k++) {
    const p = camino[k];
    for (const [px, py] of [[p.x, p.y], [p.x + 1, p.y], [p.x, p.y + 1]]) {
      if (px < 2 || py < 2 || px >= m.w - 2 || py >= m.h - 2) continue;
      const i = m.idx(px, py);
      if (m.c[i] !== C.BORDE) m.c[i] = C.VACIO;
    }
    desdeEscombro++;
    if (k > 8 && k < camino.length - 4 && desdeEscombro > 9 && az.n() < 0.25) {
      desdeEscombro = 0;
      m.c[m.idx(p.x, p.y)] = C.ESCOMBRO;
    }
  }
  m.rieles = camino.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5 }));
}

function antorchas(m: Mapa, az: Azar, densidad: number) {
  const n = Math.round((abiertas(m) / 100) * densidad);
  const puestas: Antorcha[] = [];
  for (let k = 0; k < n * 30 && puestas.length < n; k++) {
    const x = az.entero(2, m.w - 3), y = az.entero(2, m.h - 3);
    const t = m.c[m.idx(x, y)];
    if (t !== C.DURA && t !== C.BLANDA && t !== C.BORDE) continue;
    const dirs = [[0, 1], [1, 0], [-1, 0], [0, -1]].filter(([dx, dy]) => m.get(x + dx, y + dy) === C.VACIO);
    if (!dirs.length) continue;
    if (puestas.some((p) => Math.hypot(p.cx - x, p.cy - y) < 5.5)) continue;
    // Las que miran hacia la cámara (abajo) se ven mejor: se prefieren
    const [dx, dy] = dirs.find(([, dy]) => dy === 1) ?? az.uno(dirs);
    puestas.push({ cx: x, cy: y, dx, dy });
  }
  // Velas sueltas en el piso (sobre todo en las catacumbas y la abadía)
  for (let k = 0; k < n; k++) {
    const x = az.entero(3, m.w - 4), y = az.entero(3, m.h - 4);
    if (m.c[m.idx(x, y)] !== C.VACIO || (!m.cercaPared(x, y) && az.n() < 0.8)) continue;
    puestas.push({ cx: x, cy: y, dx: 0, dy: 0, vela: true });
  }
  m.antorchas = puestas;
}

/**
 * La decoración de cada bioma (los nombres de `bioma_<id>.glb` sin «deco_»): [id, lugar, peso, ancho, fondo].
 * `pared`: de espaldas a un muro; `borde`: alto, pegado a las paredes; `libre`: bajo, en cualquier parte (cerca de
 * las paredes casi siempre); `suelo`: plano, se camina encima.
 */
type Lugar = 'pared' | 'borde' | 'libre' | 'suelo';
const DECO_BIOMA: Record<string, [string, Lugar, number, number, number][]> = {
  cementerio: [
    ['lapida_redonda', 'libre', 3, 1, 1], ['lapida_gotica', 'libre', 3, 1, 1], ['lapida_recta', 'libre', 3, 1, 1], ['lapida_cruz', 'borde', 2, 1, 1], ['lapida_rota', 'libre', 2, 1, 1],
    ['lapidas_grupo', 'libre', 1.5, 2, 1], ['tumba_losa', 'suelo', 1.5, 1, 2], ['cruz_torcida', 'borde', 1.5, 1, 1], ['mausoleo', 'pared', 0.5, 2, 2], ['angel', 'pared', 0.8, 1, 1],
    ['arbol_seco', 'borde', 1, 1, 1], ['reja', 'pared', 0.8, 2, 1], ['ataud', 'libre', 0.8, 1, 2], ['fosa', 'libre', 0.8, 1, 2], ['huesos', 'suelo', 2, 1, 1], ['calaveras', 'libre', 1.5, 1, 1],
    ['florero', 'libre', 1, 1, 1], ['banca', 'libre', 0.6, 2, 1], ['hongos', 'suelo', 1.5, 1, 1], ['raices', 'suelo', 1.5, 1, 1], ['charco', 'suelo', 1, 1, 1],
    ['__luz_farol', 'borde', 0.7, 1, 1], ['__luz_tumba_velas', 'libre', 1, 1, 1],
  ],
  catacumbas: [
    ['nicho_calaveras', 'pared', 3, 1, 1], ['osario', 'borde', 2, 1, 1], ['columna', 'borde', 1.2, 1, 1], ['columna_rota', 'libre', 1, 1, 1], ['sarcofago', 'libre', 1, 1, 2],
    ['sarcofago_abierto', 'libre', 0.8, 1, 2], ['cadenas', 'pared', 2, 1, 1], ['grilletes', 'suelo', 1.5, 1, 1], ['jaula', 'borde', 0.6, 1, 1], ['urnas', 'libre', 1.5, 1, 1],
    ['agua_negra', 'libre', 0.6, 2, 2], ['reja_cripta', 'pared', 0.8, 2, 1], ['estatua_monje', 'pared', 0.8, 1, 1], ['escombros', 'libre', 1.5, 1, 1], ['huesos', 'suelo', 2.5, 1, 1],
    ['calaveras', 'libre', 2, 1, 1], ['__luz_candelabro', 'borde', 0.8, 1, 1], ['__luz_altar_huesos', 'pared', 0.5, 1, 1],
  ],
  minas: [
    ['vagoneta', 'libre', 0.8, 1, 1], ['vagoneta_volcada', 'libre', 0.6, 1, 2], ['puntal', 'pared', 2.5, 2, 1], ['cristal_grande', 'borde', 1, 1, 1], ['cristal_chico', 'libre', 2, 1, 1],
    ['lava_grieta', 'suelo', 1, 1, 1], ['lava_charco', 'libre', 0.6, 1, 1], ['pico', 'libre', 1, 1, 1], ['barriles', 'libre', 1.5, 1, 1], ['cajas_dinamita', 'libre', 1, 1, 1],
    ['carretilla', 'libre', 0.8, 1, 1], ['polea', 'borde', 0.6, 1, 1], ['escalera', 'pared', 0.8, 1, 1], ['esqueleto_minero', 'suelo', 1, 1, 1], ['sacos', 'libre', 1.2, 1, 1],
    ['mesa_minero', 'pared', 0.5, 2, 1], ['__luz_lampara', 'borde', 0.8, 1, 1], ['__luz_brasero', 'libre', 0.5, 1, 1],
  ],
  abadia: [
    ['banca_quemada', 'libre', 2, 2, 1], ['banca_rota', 'libre', 2, 2, 1], ['vitral_roto', 'pared', 1.2, 1, 1], ['columna_rota', 'libre', 1, 1, 1], ['altar', 'pared', 0.5, 2, 1],
    ['pulpito', 'pared', 0.5, 1, 1], ['campana_caida', 'libre', 0.4, 1, 1], ['estatua_santo', 'pared', 0.8, 1, 1], ['vigas_ardiendo', 'libre', 0.8, 2, 1], ['atril', 'libre', 0.8, 1, 1],
    ['cruz_procesional', 'borde', 0.8, 1, 1], ['escombros', 'libre', 2, 1, 1], ['cenizas', 'suelo', 2, 1, 1], ['organo', 'pared', 0.3, 2, 1], ['confesionario', 'pared', 0.4, 2, 1],
    ['pila_bautismal', 'libre', 0.4, 1, 1], ['vidrios', 'suelo', 1.5, 1, 1], ['__luz_candelabro', 'borde', 0.8, 1, 1], ['__luz_brasero', 'libre', 0.5, 1, 1], ['__luz_hoguera', 'libre', 0.3, 1, 1],
  ],
  castillo: [
    ['tapiz', 'pared', 2, 1, 1], ['armadura', 'pared', 1.5, 1, 1], ['retrato', 'pared', 1.5, 1, 1], ['mesa_banquete', 'libre', 0.5, 2, 1], ['trono', 'pared', 0.3, 1, 1],
    ['ataud_conde', 'libre', 0.4, 1, 2], ['alfombra', 'suelo', 1.5, 1, 2], ['estandarte', 'borde', 1.2, 1, 1], ['reloj', 'pared', 0.4, 1, 1], ['espejo_roto', 'pared', 0.8, 1, 1],
    ['jarron', 'libre', 1.5, 1, 1], ['gargola', 'borde', 0.8, 1, 1], ['fuente_sangre', 'libre', 0.3, 2, 2], ['columna_marmol', 'borde', 1, 1, 1], ['sillas_rotas', 'libre', 1.5, 1, 1],
    ['__luz_candelabro', 'borde', 1, 1, 1], ['__luz_chimenea', 'pared', 0.3, 2, 1],
  ],
};

const DIRS4: [number, number][] = [[0, -1], [-1, 0], [1, 0], [0, 1]];

function decorar(m: Mapa, az: Azar, b: DefBioma) {
  const lista = DECO_BIOMA[b.id] ?? [];
  if (!lista.length) return;
  const n = Math.round(abiertas(m) / 16);
  const ocupada = new Uint8Array(m.c.length);
  for (const a of m.antorchas) ocupada[m.idx(a.cx + a.dx, a.cy + a.dy)] = 1;
  const libreDeco = (x: number, y: number) => m.c[m.idx(x, y)] === C.VACIO && !ocupada[m.idx(x, y)] && Math.hypot(x + 0.5 - m.inicio.x, y + 0.5 - m.inicio.y) > 3.2;
  for (let k = 0; k < n * 6 && m.deco.length < n; k++) {
    const x = az.entero(2, m.w - 4), y = az.entero(2, m.h - 4);
    if (!libreDeco(x, y)) continue;
    const t = az.pesado(lista, (d) => d[2]);
    if (!t) continue;
    const [id, lugar, , hx, hy] = t;
    // Pared de al lado (preferida la de arriba: lo que va contra ella se ve de frente)
    const muro = DIRS4.find(([dx, dy]) => esSolida(m.get(x + dx, y + dy)));
    if ((lugar === 'pared' || lugar === 'borde') && !muro) continue;
    if (lugar === 'libre' && !muro && az.n() < 0.6) continue;
    let rot: number;
    let ancho = hx, fondo = hy;
    if (lugar === 'pared' || (lugar === 'borde' && muro)) {
      // De espaldas al muro: el frente (−Z del modelo) hacia lo abierto
      const [dx, dy] = muro!;
      rot = Math.atan2(-dx, -dy) + Math.PI;
      if (dx !== 0) [ancho, fondo] = [fondo, ancho];
    } else {
      const q = az.entero(0, 3);
      rot = (q * Math.PI) / 2 + (hx === hy ? az.entre(-0.3, 0.3) : 0);
      if (q % 2) [ancho, fondo] = [fondo, ancho];
    }
    // Las celdas que ocupa (las piezas de 2 m van centradas en el borde entre dos celdas)
    const celdas: [number, number][] = [];
    for (let j = 0; j < fondo; j++) for (let i = 0; i < ancho; i++) celdas.push([x + i, y + j]);
    if (!celdas.every(([cx, cy]) => libreDeco(cx, cy))) continue;
    if (lugar === 'pared' && muro && !celdas.every(([cx, cy]) => esSolida(m.get(cx + muro[0], cy + muro[1])))) continue;
    for (const [cx, cy] of celdas) ocupada[m.idx(cx, cy)] = 1;
    const cx = x + ancho / 2, cy = y + fondo / 2;
    m.deco.push({
      tipo: id, x: cx, y: cy, rot,
      esc: lugar === 'suelo' || lugar === 'libre' ? az.entre(0.9, 1.1) : 1,
    });
  }
}

/** La prueba guiada: un mapa chico y siempre igual (pasillo, cámara, pared blanda con una veta detrás, campana). */
function mapaTutorial(o: OpcionesMapa): Mapa {
  const m = new Mapa(44, 30);
  for (let i = 0; i < m.c.length; i++) {
    const x = i % m.w, y = (i / m.w) | 0;
    m.c[i] = x < 2 || y < 2 || x >= m.w - 2 || y >= m.h - 2 ? C.BORDE : fbm(x / 7, y / 7, 5) > 0.62 ? C.DURA : C.BLANDA;
    m.v[i] = Math.floor(hash2(x, y, 7) * 256);
  }
  // Cámara de inicio, pasillo hacia la derecha y cámara grande
  circulo(m, 8, 15, 4.5, C.VACIO);
  for (let x = 8; x < 22; x++) for (let y = 14; y < 17; y++) m.c[m.idx(x, y)] = C.VACIO;
  circulo(m, 25, 15, 6.5, C.VACIO);
  // Una pared blanda gruesa que separa la cámara de la veta (se aprende a excavar)
  for (let x = 32; x < 35; x++) for (let y = 11; y < 20; y++) m.c[m.idx(x, y)] = C.BLANDA;
  circulo(m, 37.5, 15, 3, C.VACIO);
  for (const [x, y] of [[39, 13], [40, 13], [40, 14], [39, 17], [40, 16], [40, 17]]) m.c[m.idx(x, y)] = C.HIERRO;
  for (let i = 0; i < m.c.length; i++) m.hp[i] = VIDA_CELDA[m.c[i]] ?? 0;
  m.inicio = { x: 8.5, y: 15.5 };
  m.antorchas = [
    { cx: 8, cy: 10, dx: 0, dy: 1 }, { cx: 15, cy: 13, dx: 0, dy: 1 }, { cx: 25, cy: 8, dx: 0, dy: 1 }, { cx: 20, cy: 18, dx: 0, dy: -1 },
    { cx: 30, cy: 12, dx: 0, dy: 1 }, { cx: 37, cy: 12, dx: 0, dy: 1 },
  ].filter((a) => esSolida(m.get(a.cx, a.cy)));
  const az = new Azar(o.semilla);
  decorar(m, az, o.bioma);
  m.cambios.length = 0;
  m.version = 1;
  return m;
}
