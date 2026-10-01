// Lo que se hace con las manos en las tres cocinas: poner toppings en una superficie (chorrear salsa, espolvorear,
// poner piezas donde van), llenar hasta la rayita y los medidores de cocción/batido/licuado. Y cómo se califica.
// Las piezas son recortes renderizados (sprites.ts); las salsas se dibujan con volumen (canto oscuro, cuerpo,
// brillo especular y gotas que se escurren por el borde) y los polvos caen antes de quedarse quietos.
import {
  aclarar, arandano, banano, barquillo, boton, cereza, chantilly, chispita, conAlfa, elipse, fresa, fresaCorte, G, galleta, granito, helado,
  iconoTopping, kiwi, lineal, mantequilla, masmelo, menta, oscurecer, Rect, rr, texto,
} from './dibujo';
import { hay, spr } from './sprites';

export type TipoTopping = 'salsa' | 'pieza' | 'polvo';
export interface ToppingDef {
  id: string;
  nombre: string;
  tipo: TipoTopping;
  /** Color de la salsa (o del sabor del helado). */
  color?: string;
  sabor?: string;
  /** Rango del restaurante desde el que se puede pedir. */
  desde: number;
  /** Tamaño de la pieza respecto al radio de la superficie. */
  tam?: number;
}
export interface ToppingPedido {
  id: string;
  /** Cuántas piezas (solo las piezas). */
  n?: number;
}

export interface Punto {
  u: number;
  v: number;
}
export interface Capa {
  id: string;
  tipo: TipoTopping;
  trazos: Punto[][];
  granos: (Punto & { i: number; t?: number })[];
  piezas: (Punto & { rot: number; t: number })[];
  /** Gotas de salsa que se escurren por el borde (u, v del borde, cuándo empezó y cuánto baja). */
  gotas?: (Punto & { t: number; l: number })[];
}
export interface Superficie {
  capas: Capa[];
}
export const superficieNueva = (): Superficie => ({ capas: [] });

/** Dónde está la superficie en la pantalla (un óvalo). */
export interface Ovalo {
  x: number;
  y: number;
  rx: number;
  ry: number;
}
export const aUV = (o: Ovalo, x: number, y: number): Punto => ({ u: (x - o.x) / o.rx, v: (y - o.y) / o.ry });
export const deUV = (o: Ovalo, p: Punto) => ({ x: o.x + p.u * o.rx, y: o.y + p.v * o.ry });

/** Dónde van las piezas según cuántas son (lo mismo que se dibuja en el tiquete). */
export function patron(n: number): Punto[] {
  const anillo = (k: number, r: number, a0 = -Math.PI / 2) => Array.from({ length: k }, (_, i) => ({ u: Math.cos(a0 + (i / k) * Math.PI * 2) * r, v: Math.sin(a0 + (i / k) * Math.PI * 2) * r }));
  switch (n) {
    case 1:
      return [{ u: 0, v: 0 }];
    case 2:
      return [{ u: -0.45, v: 0 }, { u: 0.45, v: 0 }];
    case 3:
      return anillo(3, 0.5);
    case 4:
      return anillo(4, 0.55, -Math.PI / 4);
    case 5:
      return [...anillo(4, 0.6, -Math.PI / 4), { u: 0, v: 0 }];
    case 6:
      return anillo(6, 0.58);
    case 7:
      return [...anillo(6, 0.6), { u: 0, v: 0 }];
    default:
      return anillo(Math.max(1, n), 0.62);
  }
}

// ---------------------------------------------------------------------------------------------- Aplicar toppings
export class Aplicador {
  private capa: Capa | null = null;
  private ultimo: Punto | null = null;
  private acumulado = 0;
  /** Para dibujar la herramienta en la mano (salsa o salero) mientras se arrastra. */
  enUso: { id: string; tipo: TipoTopping } | null = null;
  constructor(private defs: Record<string, ToppingDef>) {}

  /** Toca la superficie con el topping escogido. Devuelve qué pasó (para el sonido). */
  bajar(s: Superficie, id: string, p: Punto, t: number): 'pieza' | 'salsa' | 'polvo' | null {
    const d = this.defs[id];
    if (!d || Math.hypot(p.u, p.v) > 1.12) return null;
    const ult = s.capas[s.capas.length - 1];
    this.capa = ult && ult.id === id ? ult : null;
    if (!this.capa) {
      this.capa = { id, tipo: d.tipo, trazos: [], granos: [], piezas: [] };
      s.capas.push(this.capa);
    }
    this.reloj = t;
    if (d.tipo === 'pieza') {
      const q = limitar(p, 1);
      this.capa.piezas.push({ ...q, rot: Math.round((Math.random() - 0.5) * 80) / 100, t });
      this.capa = null;
      return 'pieza';
    }
    this.enUso = { id, tipo: d.tipo };
    if (d.tipo === 'salsa') this.capa.trazos.push([red(limitar(p, 1.08))]);
    else this.espolvorear(p, 4);
    this.ultimo = p;
    return d.tipo;
  }
  private reloj = 0;

  /** Arrastra: más salsa o más polvo. Devuelve true si cambió algo. */
  mover(p: Punto, t = this.reloj): boolean {
    const c = this.capa;
    this.reloj = t;
    if (!c || !this.ultimo) return false;
    const d = Math.hypot(p.u - this.ultimo.u, p.v - this.ultimo.v);
    if (c.tipo === 'salsa') {
      if (d < 0.03) return false;
      const tr = c.trazos[c.trazos.length - 1];
      if (tr.length < 400) tr.push(red(limitar(p, 1.08)));
      // Por el borde de adelante la salsa se escurre
      const r = Math.hypot(p.u, p.v);
      if (r > 0.86 && p.v > 0.15 && Math.random() < 0.35) {
        c.gotas ??= [];
        if (c.gotas.length < 24 && !c.gotas.some((g) => Math.abs(g.u - p.u) < 0.12)) {
          const q = limitar(p, 0.98);
          c.gotas.push({ u: Math.round(q.u * 1000) / 1000, v: Math.round(q.v * 1000) / 1000, t, l: Math.round((0.18 + Math.random() * 0.22) * 100) / 100 });
        }
      }
    } else if (c.tipo === 'polvo') {
      this.acumulado += d;
      const n = Math.floor(this.acumulado / 0.05);
      if (n > 0) {
        this.acumulado -= n * 0.05;
        this.espolvorear(p, Math.min(6, n * 2));
      }
    }
    this.ultimo = p;
    return true;
  }

  subir() {
    this.capa = null;
    this.ultimo = null;
    this.enUso = null;
  }

  private espolvorear(p: Punto, n: number) {
    const c = this.capa!;
    for (let k = 0; k < n && c.granos.length < 320; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.2;
      const q = { u: p.u + Math.cos(a) * r, v: p.v + Math.sin(a) * r };
      if (Math.hypot(q.u, q.v) <= 1) c.granos.push({ ...red(q), i: c.granos.length, t: this.reloj + Math.random() * 0.12 });
    }
  }
}
const red = (p: Punto): Punto => ({ u: Math.round(p.u * 1000) / 1000, v: Math.round(p.v * 1000) / 1000 });
const limitar = (p: Punto, max: number) => {
  const d = Math.hypot(p.u, p.v);
  return d <= max ? { ...p } : { u: (p.u / d) * max, v: (p.v / d) * max };
};

/** El recorte de cada pieza (los toppings renderizados). */
export function recortePieza(d: ToppingDef, rot = 0): string {
  switch (d.id) {
    case 'fresa':
      return 'top_fresa_mitad';
    case 'helado':
      return d.sabor === 'fresa' ? 'top_helado_fresa' : 'top_helado_vainilla';
    case 'masmelo':
      return rot > 0 ? 'top_masmelo_rosado' : 'top_masmelo_blanco';
    default:
      return `top_${d.id}`;
  }
}

/** Dibujo de respaldo (mientras cargan los recortes). */
function piezaDibujada(g: G, d: ToppingDef, x: number, y: number, s: number, rot = 0) {
  switch (d.id) {
    case 'fresa':
      return fresaCorte(g, x, y, s, rot, 'mitad');
    case 'fresa_entera':
      return fresa(g, x, y, s * 0.9, rot * 0.4);
    case 'banano':
      return banano(g, x, y, s * 0.85);
    case 'arandano':
      return arandano(g, x, y, s * 0.5);
    case 'kiwi':
      return kiwi(g, x, y, s * 0.85);
    case 'masmelo':
      return masmelo(g, x, y, s * 0.55, rot > 0 ? '#ffd3e2' : '#fffaf2');
    case 'cereza':
      return cereza(g, x, y, s * 0.55);
    case 'chantilly':
      return chantilly(g, x, y, s * 0.8);
    case 'helado':
      return helado(g, x, y, s * 0.95, d.sabor);
    case 'mantequilla':
      return mantequilla(g, x, y, s * 0.75);
    case 'barquillo':
      return barquillo(g, x, y - s * 0.6, s * 0.6, rot - 0.3);
    case 'galleta':
      return galleta(g, x, y, s * 0.7);
    case 'menta':
      return menta(g, x, y, s * 0.8, rot);
    default:
      g.fillStyle = d.color ?? '#fff';
      elipse(g, x, y, s * 0.5, s * 0.4);
      g.fill();
  }
}

/** Dibuja una pieza suelta (en la superficie o en la mano). */
export function dibujarPieza(g: G, d: ToppingDef, x: number, y: number, s: number, rot = 0) {
  const id = recortePieza(d, rot);
  // Las frutas cortadas se pueden girar un poquito (las otras se ven mejor derechas: la luz viene de arriba)
  const giro = d.id === 'fresa' || d.id === 'barquillo' || d.id === 'menta' || d.id === 'kiwi' || d.id === 'banano' ? rot * 0.8 : 0;
  if (spr(g, id, x, y, s, giro ? { rot: giro } : undefined)) return;
  piezaDibujada(g, d, x, y, s, rot);
}

/** Salsa con volumen: canto oscuro, cuerpo y brillo especular (por una lista de puntos ya en pantalla). */
function trazoSalsa(g: G, pts: { x: number; y: number }[], color: string, grosor: number) {
  if (pts.length < 2) {
    if (pts.length === 1) {
      g.fillStyle = color;
      elipse(g, pts[0].x, pts[0].y, grosor * 0.7, grosor * 0.5);
      g.fill();
    }
    return;
  }
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const linea = (w: number, c: string, dx = 0, dy = 0) => {
    g.strokeStyle = c;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(pts[0].x + dx, pts[0].y + dy);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      g.quadraticCurveTo(pts[i].x + dx, pts[i].y + dy, mx + dx, my + dy);
    }
    g.lineTo(pts[pts.length - 1].x + dx, pts[pts.length - 1].y + dy);
    g.stroke();
  };
  linea(grosor * 1.08, 'rgba(40,20,10,0.22)', 0, grosor * 0.28); // sombrita sobre la comida
  linea(grosor, oscurecer(color, 0.28), 0, grosor * 0.1);
  linea(grosor * 0.82, color);
  linea(grosor * 0.45, aclarar(color, 0.16), -grosor * 0.06, -grosor * 0.1);
  linea(grosor * 0.16, 'rgba(255,255,255,0.7)', -grosor * 0.14, -grosor * 0.22);
}

/** Una gota que se escurre del borde (crece con el tiempo y termina en una bolita). */
function gotaSalsa(g: G, x: number, y: number, largo: number, ancho: number, color: string) {
  g.fillStyle = oscurecer(color, 0.2);
  g.beginPath();
  g.moveTo(x - ancho * 0.5, y);
  g.quadraticCurveTo(x - ancho * 0.35, y + largo * 0.6, x - ancho * 0.28, y + largo);
  g.arc(x, y + largo, ancho * 0.42, Math.PI, 0, true);
  g.quadraticCurveTo(x + ancho * 0.35, y + largo * 0.6, x + ancho * 0.5, y);
  g.closePath();
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x - ancho * 0.36, y);
  g.quadraticCurveTo(x - ancho * 0.26, y + largo * 0.6, x - ancho * 0.2, y + largo);
  g.arc(x, y + largo, ancho * 0.32, Math.PI, 0, true);
  g.quadraticCurveTo(x + ancho * 0.26, y + largo * 0.6, x + ancho * 0.36, y);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)';
  elipse(g, x - ancho * 0.12, y + largo - ancho * 0.08, ancho * 0.1, ancho * 0.14);
  g.fill();
}

const COLOR_GRANO: Record<string, string> = { queso: '#f6dd8a', azucar: '#ffffff', canela: '#94501f', galleta: '#2d1c16', coco: '#fffdf6' };

/** Todos los toppings puestos, en el orden en que se pusieron. `ahora` anima lo que acaba de caer. */
export function dibujarSuperficie(g: G, s: Superficie, o: Ovalo, defs: Record<string, ToppingDef>, ahora = 1e9, recortar = true) {
  for (const c of s.capas) {
    const d = defs[c.id];
    if (!d) continue;
    if (c.tipo === 'salsa') {
      const col = d.color ?? '#b5651d';
      // Las gotas por el borde (debajo de la salsa de arriba)
      for (const q of c.gotas ?? []) {
        const k = Math.min(1, Math.max(0, (ahora - q.t) / 1.6));
        if (k <= 0) continue;
        const p = deUV(o, q);
        gotaSalsa(g, p.x, p.y - 2, q.l * o.ry * 1.4 * (1 - Math.pow(1 - k, 2)), o.rx * 0.075, col);
      }
      g.save();
      if (recortar) {
        elipse(g, o.x, o.y, o.rx * 1.06, o.ry * 1.06);
        g.clip();
      }
      for (const tr of c.trazos) {
        const pts = tr.map((p) => deUV(o, p));
        trazoSalsa(g, pts, col, o.rx * 0.085);
      }
      g.restore();
    } else if (c.tipo === 'polvo') {
      const tam = o.rx * 0.028;
      const tipo = d.id === 'galleta_triturada' ? 'galleta' : d.id;
      for (const p of c.granos) {
        const q = deUV(o, p);
        // Recién echado: viene cayendo
        const edad = p.t === undefined ? 9 : ahora - p.t;
        if (edad < 0) continue;
        const cae = edad < 0.28 ? Math.pow(1 - edad / 0.28, 2) * o.ry * 1.6 : 0;
        if (d.id === 'chispitas') chispita(g, q.x, q.y - cae, tam * 1.15, p.i);
        else granito(g, q.x, q.y - cae, tam * (d.id === 'azucar' ? 0.9 : 1), tipo, p.i);
      }
    } else {
      const piezas = [...c.piezas].sort((a, b) => a.v - b.v);
      for (const p of piezas) {
        const q = deUV(o, p);
        const edad = ahora - p.t;
        const cae = edad < 0.22 ? (1 - edad / 0.22) * o.ry * 0.9 : 0;
        const rebote = edad >= 0.22 && edad < 0.5 ? 1 + Math.sin(((edad - 0.22) / 0.28) * Math.PI) * 0.14 : 1;
        dibujarPieza(g, d, q.x, q.y - cae, o.rx * (d.tam ?? 0.15) * 1.15 * rebote, p.rot);
      }
    }
  }
}

/** Lo que se tiene en la mano mientras se arrastra (el tetero chorreando o el salero sacudiéndose). */
export function dibujarEnMano(g: G, def: ToppingDef, x: number, y: number, t: number) {
  if (def.tipo === 'salsa') {
    const id = recorteBandeja(def);
    // El tetero inclinado, chorreando hacia el dedo
    const hx = x + 46, hy = y - 120;
    g.strokeStyle = def.color ?? '#b5651d';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(hx - 30, hy + 50);
    g.quadraticCurveTo(x + 6, y - 40, x, y - 4);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = 2;
    g.stroke();
    if (!spr(g, id, hx, hy + 40, 54, { rot: -2.5 })) {
      g.fillStyle = def.color ?? '#b5651d';
      rr(g, hx - 14, hy - 30, 28, 70, 10);
      g.fill();
    }
  } else if (def.tipo === 'polvo') {
    const id = recorteBandeja(def);
    const sacude = Math.sin(t * 30) * 6;
    spr(g, id, x + 10 + sacude, y - 70, 44, { rot: -2.6 });
  }
}

// ---------------------------------------------------------------------------------------------- Calificar
/** Qué fracción del óvalo quedó cubierta (cuadrícula de 14×14 sobre el disco). */
function cobertura(puntos: Punto[], radio: number) {
  const N = 14;
  let total = 0, llenas = 0;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const u = -1 + (i + 0.5) * (2 / N), v = -1 + (j + 0.5) * (2 / N);
      if (u * u + v * v > 0.9) continue;
      total++;
      if (puntos.some((p) => (p.u - u) ** 2 + (p.v - v) ** 2 < radio * radio)) llenas++;
    }
  return total ? llenas / total : 0;
}
/** Los puntos de un chorrito (rellenando entre punto y punto). */
function densos(tr: Punto[]) {
  const r: Punto[] = [];
  for (let i = 0; i < tr.length; i++) {
    r.push(tr[i]);
    if (i + 1 < tr.length) {
      const a = tr[i], b = tr[i + 1];
      const n = Math.ceil(Math.hypot(b.u - a.u, b.v - a.v) / 0.06);
      for (let k = 1; k < n; k++) r.push({ u: a.u + ((b.u - a.u) * k) / n, v: a.v + ((b.v - a.v) * k) / n });
    }
  }
  return r;
}

export interface Detalle {
  id: string;
  valor: number;
  nota: string;
}

/** Cómo quedaron los toppings contra lo pedido (0-100) y un detalle de cada uno. */
export function calificarToppings(s: Superficie, pedidos: ToppingPedido[], defs: Record<string, ToppingDef>): { valor: number; detalle: Detalle[] } {
  const detalle: Detalle[] = [];
  for (const t of pedidos) {
    const d = defs[t.id];
    const capas = s.capas.filter((c) => c.id === t.id);
    if (!d) continue;
    if (!capas.length) {
      detalle.push({ id: t.id, valor: 0, nota: `Faltó ${d.nombre.toLowerCase()}` });
      continue;
    }
    if (d.tipo === 'pieza') {
      const puestas = capas.flatMap((c) => c.piezas);
      const n = t.n ?? 1;
      const cuenta = Math.max(0, 1 - Math.abs(puestas.length - n) * 0.3);
      const libres = [...puestas];
      let suma = 0;
      for (const q of patron(n)) {
        if (!libres.length) {
          suma += 1;
          continue;
        }
        let mejor = 0;
        libres.forEach((p, i) => {
          if (Math.hypot(p.u - q.u, p.v - q.v) < Math.hypot(libres[mejor].u - q.u, libres[mejor].v - q.v)) mejor = i;
        });
        suma += Math.hypot(libres[mejor].u - q.u, libres[mejor].v - q.v);
        libres.splice(mejor, 1);
      }
      const dist = suma / n;
      const lugar = Math.max(0, Math.min(1, 1 - (dist - 0.14) / 0.5));
      const v = Math.round(100 * (0.55 * cuenta + 0.45 * lugar));
      detalle.push({
        id: t.id, valor: v,
        nota: puestas.length !== n ? `${d.nombre}: eran ${n} y hay ${puestas.length}` : lugar < 0.75 ? `${d.nombre} mal repartidos` : `${d.nombre} perfectos`,
      });
    } else {
      const pts = d.tipo === 'salsa' ? capas.flatMap((c) => c.trazos.flatMap(densos)) : capas.flatMap((c) => c.granos);
      const cob = cobertura(pts, d.tipo === 'salsa' ? 0.13 : 0.1);
      const meta = d.tipo === 'salsa' ? 0.5 : 0.55;
      const v = cob < 0.04 ? 0 : Math.round(100 * Math.max(0, Math.min(1, 1 - Math.max(0, Math.abs(cob - meta) - 0.17) / 0.35)));
      detalle.push({ id: t.id, valor: v, nota: cob < meta - 0.17 ? `Poquito ${d.nombre.toLowerCase()}` : cob > meta + 0.17 ? `Demasiado ${d.nombre.toLowerCase()}` : `${d.nombre} en su punto` });
    }
  }
  const pedidosIds = new Set(pedidos.map((t) => t.id));
  const sobran = [...new Set(s.capas.map((c) => c.id))].filter((id) => !pedidosIds.has(id));
  const castigo = Math.min(45, sobran.length * 15);
  for (const id of sobran) detalle.push({ id, valor: 0, nota: `No pidió ${defs[id]?.nombre.toLowerCase() ?? id}` });
  const base = pedidos.length ? detalle.filter((x) => pedidosIds.has(x.id)).reduce((a, x) => a + x.valor, 0) / pedidos.length : 100;
  return { valor: Math.max(0, Math.round(base - castigo)), detalle };
}

/** Qué tan cerca quedó un nivel de la rayita (0-100): exacto o casi, 100; a 0.28 o más, 0. */
export const puntajeNivel = (nivel: number, meta: number, tol = 0.035) => Math.max(0, Math.round(100 - Math.max(0, Math.abs(nivel - meta) - tol) * 400));
/** Qué tan cerca quedó un medidor del centro de su zona. */
export const puntajeZona = (v: number, meta: number, tol = 0.04) => Math.max(0, Math.round(100 - Math.max(0, Math.abs(v - meta) - tol) * 330));
/** Cuántos pidió contra cuántos puso (cada uno de más o de menos resta 34). */
export const puntajeCuenta = (puestos: number, pedidos: number) => Math.max(0, 100 - Math.abs(puestos - pedidos) * 34);

// ---------------------------------------------------------------------------------------------- Medidores
export interface Zona {
  desde: number;
  hasta: number;
  color: string;
  etiqueta?: string;
}
/** Medidor vertical (termómetro de vidrio) con zonas de colores y una flecha en el valor. */
export function medidor(g: G, x: number, y: number, w: number, h: number, valor: number, zonas: Zona[], resaltar?: number) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.3)';
  g.shadowBlur = 8;
  g.shadowOffsetY = 3;
  g.fillStyle = lineal(g, x - 6, 0, x + w + 6, 0, [[0, '#5a4034'], [0.5, '#8a6a58'], [1, '#4a3228']]);
  rr(g, x - 6, y - 6, w + 12, h + 12, 13);
  g.fill();
  g.restore();
  g.fillStyle = '#f7efe6';
  rr(g, x, y, w, h, 9);
  g.fill();
  g.save();
  rr(g, x, y, w, h, 9);
  g.clip();
  for (const z of zonas) {
    const y0 = y + h * (1 - z.hasta), y1 = y + h * (1 - z.desde);
    g.fillStyle = z.color;
    g.fillRect(x, y0, w, y1 - y0);
  }
  // Relleno hasta el valor (líquido de color que sube)
  const yv = y + h * (1 - Math.max(0, Math.min(1, valor)));
  g.fillStyle = 'rgba(232,67,79,0.22)';
  g.fillRect(x, yv, w, y + h - yv);
  g.fillStyle = lineal(g, x, 0, x + w, 0, [[0, 'rgba(255,255,255,0.5)'], [0.35, 'rgba(255,255,255,0.05)'], [1, 'rgba(0,0,0,0.14)']]);
  g.fillRect(x, y, w, h);
  g.restore();
  for (const z of zonas)
    if (z.etiqueta) texto(g, z.etiqueta, x + w + 12, y + h * (1 - (z.desde + z.hasta) / 2), { tam: 17, alinear: 'left', color: '#fff', borde: '#3b2a22' });
  g.fillStyle = resaltar ? `rgba(255,255,255,${0.5 + 0.5 * Math.sin(resaltar * 12)})` : '#ffffff';
  g.strokeStyle = '#3b2a22';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x - 16, yv - 10);
  g.lineTo(x + 2, yv);
  g.lineTo(x - 16, yv + 10);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#3b2a22';
  g.fillRect(x, yv - 2, w, 4);
}

/** Rayita de «hasta aquí» en un vaso o tazón. */
export function rayita(g: G, x0: number, x1: number, y: number, etiqueta?: string) {
  g.save();
  g.setLineDash([10, 7]);
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(x0, y);
  g.lineTo(x1, y);
  g.stroke();
  g.strokeStyle = conAlfa('#e8434f', 0.95);
  g.lineWidth = 3.5;
  g.stroke();
  g.restore();
  if (etiqueta) texto(g, etiqueta, x1 + 8, y, { tam: 16, alinear: 'left', color: '#e8434f', borde: '#fff' });
}

// ---------------------------------------------------------------------------------------------- Piezas de interfaz comunes
export interface BotonTopping {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
/** La bandeja de toppings (columnas de botones a la izquierda). */
export function botonesToppings(defs: ToppingDef[], rango: number, x0: number, y0: number, cols = 3, lado = 92, alto = 0): BotonTopping[] {
  const lista = defs.filter((t) => t.desde <= rango);
  // Si no caben, se achican
  const filas = Math.ceil(lista.length / cols);
  const h = alto ? Math.min(lado, (alto - (filas - 1) * 6) / filas) : lado;
  return lista.map((t, i) => ({ id: t.id, x: x0 + (i % cols) * (lado + 6), y: y0 + Math.floor(i / cols) * (h + 6), w: lado, h }));
}
/** El recorte de la bandeja para cada topping (coquita con las piezas, tetero, salero…). */
export function recorteBandeja(d: ToppingDef) {
  if (d.tipo === 'salsa') {
    const id = d.id === 'leche_condensada' ? 'salsa_leche_condensada' : `salsa_${d.id}`;
    return hay(id) ? id : 'salsa_caramelo';
  }
  if (d.tipo === 'polvo') return `polvo_${d.id}`;
  return `bin_${d.id}`;
}

/** La bandeja de madera con sus coquitas, teteros y saleros. */
export function dibujarBotonesToppings(g: G, bs: BotonTopping[], defs: Record<string, ToppingDef>, elegido: string | null) {
  if (bs.length) {
    const x0 = Math.min(...bs.map((b) => b.x)) - 8, y0 = Math.min(...bs.map((b) => b.y)) - 8;
    const x1 = Math.max(...bs.map((b) => b.x + b.w)) + 8, y1 = Math.max(...bs.map((b) => b.y + b.h)) + 8;
    g.save();
    g.shadowColor = 'rgba(40,20,10,0.35)';
    g.shadowBlur = 12;
    g.shadowOffsetY = 4;
    g.fillStyle = lineal(g, x0, 0, x1, 0, [[0, '#a8743f'], [0.5, '#c8915a'], [1, '#9c6a38']]);
    rr(g, x0, y0, x1 - x0, y1 - y0, 16);
    g.fill();
    g.restore();
    g.strokeStyle = 'rgba(90,50,20,0.35)';
    g.lineWidth = 1.5;
    for (let y = y0 + 10; y < y1 - 6; y += 12) {
      g.beginPath();
      g.moveTo(x0 + 6, y);
      g.bezierCurveTo(x0 + (x1 - x0) * 0.3, y + 3, x0 + (x1 - x0) * 0.7, y - 3, x1 - 6, y);
      g.stroke();
    }
  }
  for (const b of bs) {
    const d = defs[b.id];
    const act = elegido === b.id;
    g.save();
    if (act) {
      g.shadowColor = 'rgba(255,190,60,0.95)';
      g.shadowBlur = 14;
    }
    g.fillStyle = act ? 'rgba(255,236,190,0.95)' : 'rgba(255,248,238,0.82)';
    rr(g, b.x, b.y, b.w, b.h, 14);
    g.fill();
    g.restore();
    if (act) {
      g.strokeStyle = '#ffb627';
      g.lineWidth = 4;
      rr(g, b.x - 1, b.y - 1, b.w + 2, b.h + 2, 15);
      g.stroke();
    }
    const id = recorteBandeja(d);
    const cy = b.y + b.h * 0.47 + (act ? -3 : 0);
    const tam = d.tipo === 'salsa' ? b.h * 0.3 : d.tipo === 'polvo' ? b.h * 0.33 : b.h * 0.34;
    if (!spr(g, id, b.x + b.w / 2, cy + (d.tipo === 'pieza' ? b.h * 0.08 : b.h * 0.24), tam)) iconoTopping(g, b.id, b.x + b.w / 2, cy - 4, 30, { color: d.color, sabor: d.sabor });
    texto(g, d.nombre.split(' ')[0], b.x + b.w / 2, b.y + b.h - 10, { tam: 14, color: '#4a2a10', max: b.w - 6, borde: 'rgba(255,248,238,0.9)' });
  }
}
/** Una fila del tiquete con un topping (y, si son piezas, dónde van). */
export function filaTopping(g: G, t: ToppingPedido, d: ToppingDef, x: number, w: number, y: number) {
  const id = d.tipo === 'pieza' ? recortePieza(d) : recorteBandeja(d);
  if (!spr(g, id, x + 30, y + (d.tipo === 'pieza' ? 22 : 30), d.tipo === 'pieza' ? 15 : 16)) iconoTopping(g, t.id, x + 30, y + 18, 20, { color: d.color, sabor: d.sabor });
  texto(g, d.nombre, x + 56, y + 18, { tam: 17, color: '#3b2a22', alinear: 'left', max: 112, peso: 700 });
  if (d.tipo === 'pieza' && (t.n ?? 1) > 1) {
    const cx = x + w - 42, cy = y + 18;
    g.fillStyle = '#f1e6d6';
    elipse(g, cx, cy, 30, 19);
    g.fill();
    g.strokeStyle = 'rgba(160,120,90,0.5)';
    g.lineWidth = 1.2;
    g.stroke();
    g.fillStyle = COLOR_PIEZA[d.id] ?? '#e5243b';
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 1;
    for (const q of patron(t.n!)) {
      elipse(g, cx + q.u * 24, cy + q.v * 15, 5, 4);
      g.fill();
      g.stroke();
    }
    texto(g, `×${t.n}`, x + w - 8, y + 34, { tam: 13, color: '#8a6a58', alinear: 'right', peso: 800 });
  } else {
    // Salsa: un zigzag; polvo: puntitos (cómo se pone)
    const cx = x + w - 42, cy = y + 18;
    g.strokeStyle = d.tipo === 'salsa' ? (d.color ?? '#8a6a58') : '#8a6a58';
    g.lineWidth = d.tipo === 'salsa' ? 4 : 1;
    g.lineCap = 'round';
    if (d.tipo === 'salsa') {
      g.beginPath();
      for (let i = 0; i <= 6; i++) g.lineTo(cx - 24 + i * 8, cy + (i % 2 ? -7 : 7));
      g.stroke();
    } else {
      g.fillStyle = d.id === 'chispitas' ? '#ff5d8f' : (COLOR_GRANO[d.id === 'galleta_triturada' ? 'galleta' : d.id] ?? '#8a6a58');
      for (let i = 0; i < 9; i++) {
        elipse(g, cx - 18 + (i % 3) * 18 + (Math.floor(i / 3) % 2) * 6, cy - 9 + Math.floor(i / 3) * 9, 2.6, 2.6);
        g.fill();
      }
    }
  }
}
const COLOR_PIEZA: Record<string, string> = {
  chantilly: '#fffaf2', banano: '#f2dc8c', arandano: '#3a4aa8', kiwi: '#8cbf3a', masmelo: '#ffc4d6', cereza: '#c4102a', barquillo: '#e0a860',
  galleta: '#2d1c16', menta: '#4fae4a', fresa_entera: '#e5243b', helado: '#fff1c9', mantequilla: '#fbe38a', fresa: '#e5243b',
};
/** Guía de emplatado (mejora): aros punteados donde va cada pieza. */
export function dibujarGuia(g: G, pedidos: ToppingPedido[], defs: Record<string, ToppingDef>, s: Ovalo) {
  g.save();
  g.setLineDash([5, 5]);
  g.strokeStyle = 'rgba(255,255,255,0.9)';
  g.lineWidth = 2.5;
  for (const t of pedidos) {
    if (defs[t.id]?.tipo !== 'pieza') continue;
    for (const q of patron(t.n ?? 1)) {
      elipse(g, s.x + q.u * s.rx, s.y + q.v * s.ry, 14, 9);
      g.stroke();
    }
  }
  g.restore();
}
export function botonEntregar(g: G, r: Rect, ocupado = false) {
  boton(g, r, { color: ocupado ? '#9ac9a0' : '#5cc26a' });
  texto(g, ocupado ? '🛎️ …' : '🛎️ Entregar', r.x + r.w / 2, r.y + r.h / 2 + 2, { tam: 27, color: '#fff', borde: '#2f7a3a' });
}
export function botonBotar(g: G, r: Rect) {
  boton(g, r, { color: '#f0e4d8' });
  texto(g, '🗑 Botar', r.x + r.w / 2, r.y + r.h / 2 + 2, { tam: 22, color: '#7a4a3a' });
}
/** Línea punteada que separa partes del tiquete. */
export function separador(g: G, x0: number, x1: number, y: number) {
  g.save();
  g.strokeStyle = 'rgba(160,120,90,0.5)';
  g.setLineDash([6, 5]);
  g.beginPath();
  g.moveTo(x0, y);
  g.lineTo(x1, y);
  g.stroke();
  g.restore();
}
/** Texto de tiquete (letra de impresora). */
export function letra(g: G, t: string, x: number, y: number, o: { tam?: number; color?: string; alinear?: CanvasTextAlign; max?: number; negrita?: boolean } = {}) {
  g.font = `${o.negrita === false ? 400 : 700} ${o.tam ?? 17}px "Courier Prime", "Courier New", monospace`;
  g.textAlign = o.alinear ?? 'left';
  g.textBaseline = 'middle';
  g.fillStyle = o.color ?? '#3b2a22';
  g.fillText(t, x, y, o.max);
}
