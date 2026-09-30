// Lo que se hace con las manos en las tres cocinas: poner toppings en una superficie (chorrear salsa, espolvorear,
// poner piezas donde van), llenar hasta la rayita y los medidores de cocción/batido/licuado. Y cómo se califica.
import {
  arandano, banano, barquillo, boton, cereza, chantilly, chispita, conAlfa, elipse, fresa, fresaCorte, G, galleta, granito, helado, iconoTopping,
  kiwi, lineal, mantequilla, masmelo, menta, Rect, rr, texto, trazoSalsa,
} from './dibujo';

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
  granos: (Punto & { i: number })[];
  piezas: (Punto & { rot: number; t: number })[];
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
    if (d.tipo === 'pieza') {
      const q = limitar(p, 1);
      this.capa.piezas.push({ ...q, rot: (Math.random() - 0.5) * 0.8, t });
      this.capa = null;
      return 'pieza';
    }
    if (d.tipo === 'salsa') this.capa.trazos.push([limitar(p, 1.08)]);
    else this.espolvorear(p, 4);
    this.ultimo = p;
    return d.tipo;
  }

  mover(p: Punto) {
    const c = this.capa;
    if (!c || !this.ultimo) return;
    const d = Math.hypot(p.u - this.ultimo.u, p.v - this.ultimo.v);
    if (c.tipo === 'salsa') {
      if (d < 0.03) return;
      const tr = c.trazos[c.trazos.length - 1];
      if (tr.length < 400) tr.push(limitar(p, 1.08));
    } else if (c.tipo === 'polvo') {
      this.acumulado += d;
      const n = Math.floor(this.acumulado / 0.05);
      if (n > 0) {
        this.acumulado -= n * 0.05;
        this.espolvorear(p, Math.min(6, n * 2));
      }
    }
    this.ultimo = p;
  }

  subir() {
    this.capa = null;
    this.ultimo = null;
  }

  private espolvorear(p: Punto, n: number) {
    const c = this.capa!;
    for (let k = 0; k < n && c.granos.length < 320; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.2;
      const q = { u: p.u + Math.cos(a) * r, v: p.v + Math.sin(a) * r };
      if (Math.hypot(q.u, q.v) <= 1) c.granos.push({ ...q, i: c.granos.length });
    }
  }
}
const limitar = (p: Punto, max: number) => {
  const d = Math.hypot(p.u, p.v);
  return d <= max ? { ...p } : { u: (p.u / d) * max, v: (p.v / d) * max };
};

/** Dibuja una pieza suelta (en la superficie o en la mano). */
export function dibujarPieza(g: G, d: ToppingDef, x: number, y: number, s: number, rot = 0) {
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

/** Todos los toppings puestos, en el orden en que se pusieron. `ahora` anima las piezas que acaban de caer. */
export function dibujarSuperficie(g: G, s: Superficie, o: Ovalo, defs: Record<string, ToppingDef>, ahora = 1e9, recortar = true) {
  for (const c of s.capas) {
    const d = defs[c.id];
    if (!d) continue;
    if (c.tipo === 'salsa') {
      g.save();
      if (recortar) {
        elipse(g, o.x, o.y, o.rx * 1.06, o.ry * 1.06);
        g.clip();
      }
      for (const tr of c.trazos) trazoSalsa(g, tr.map((p) => deUV(o, p)), d.color ?? '#b5651d', o.rx * 0.085);
      g.restore();
    } else if (c.tipo === 'polvo') {
      const tam = o.rx * 0.028;
      const tipo = d.id === 'galleta_triturada' ? 'galleta' : d.id;
      for (const p of c.granos) {
        const q = deUV(o, p);
        if (d.id === 'chispitas') chispita(g, q.x, q.y, tam * 1.1, p.i);
        else granito(g, q.x, q.y, tam, tipo, p.i);
      }
    } else {
      const piezas = [...c.piezas].sort((a, b) => a.v - b.v);
      for (const p of piezas) {
        const q = deUV(o, p);
        const edad = ahora - p.t;
        const cae = edad < 0.25 ? (1 - edad / 0.25) * o.ry * 0.6 : 0;
        const rebote = edad < 0.4 ? 1 + Math.sin(Math.min(1, edad / 0.4) * Math.PI) * 0.15 : 1;
        dibujarPieza(g, d, q.x, q.y - cae, o.rx * (d.tam ?? 0.15) * rebote, p.rot);
      }
    }
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
      // Cada lugar del patrón con la pieza más cercana que quede libre
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
/** Medidor vertical con zonas de colores y una flecha en el valor. */
export function medidor(g: G, x: number, y: number, w: number, h: number, valor: number, zonas: Zona[], resaltar?: number) {
  g.save();
  g.fillStyle = '#3b2a22';
  rr(g, x - 4, y - 4, w + 8, h + 8, 12);
  g.fill();
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
  // Relleno hasta el valor
  g.fillStyle = lineal(g, x, 0, x + w, 0, [[0, 'rgba(255,255,255,0.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.12)']]);
  g.fillRect(x, y, w, h);
  g.restore();
  for (const z of zonas)
    if (z.etiqueta) texto(g, z.etiqueta, x + w + 10, y + h * (1 - (z.desde + z.hasta) / 2), { tam: 17, alinear: 'left', color: '#fff', borde: '#3b2a22' });
  const yv = y + h * (1 - Math.max(0, Math.min(1, valor)));
  g.fillStyle = resaltar ? `rgba(255,255,255,${0.5 + 0.5 * Math.sin(resaltar * 12)})` : '#ffffff';
  g.strokeStyle = '#3b2a22';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x - 14, yv - 9);
  g.lineTo(x + 2, yv);
  g.lineTo(x - 14, yv + 9);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#3b2a22';
  g.fillRect(x, yv - 2, w, 4);
  g.restore();
}

/** Rayita de «hasta aquí» en un vaso o tazón. */
export function rayita(g: G, x0: number, x1: number, y: number, etiqueta?: string) {
  g.save();
  g.setLineDash([10, 7]);
  g.strokeStyle = conAlfa('#e8434f', 0.9);
  g.lineWidth = 3.5;
  g.beginPath();
  g.moveTo(x0, y);
  g.lineTo(x1, y);
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
export function botonesToppings(defs: ToppingDef[], rango: number, x0: number, y0: number, cols = 3, lado = 88): BotonTopping[] {
  return defs.filter((t) => t.desde <= rango).map((t, i) => ({ id: t.id, x: x0 + (i % cols) * (lado + 8), y: y0 + Math.floor(i / cols) * (lado + 8), w: lado, h: lado }));
}
export function dibujarBotonesToppings(g: G, bs: BotonTopping[], defs: Record<string, ToppingDef>, elegido: string | null) {
  for (const b of bs) {
    const d = defs[b.id];
    const act = elegido === b.id;
    boton(g, b, { color: act ? '#ffe2a8' : '#ffffff', activo: act, radio: 14 });
    iconoTopping(g, b.id, b.x + b.w / 2, b.y + b.h / 2 - 8, 30, { color: d.color, sabor: d.sabor });
    texto(g, d.nombre.split(' ')[0], b.x + b.w / 2, b.y + b.h - 13, { tam: 14, color: '#4a2a10', max: b.w - 6 });
  }
}
/** Una fila del tiquete con un topping (y, si son piezas, dónde van). */
export function filaTopping(g: G, t: ToppingPedido, d: ToppingDef, x: number, w: number, y: number) {
  iconoTopping(g, t.id, x + 34, y + 18, 22, { color: d.color, sabor: d.sabor });
  texto(g, d.nombre, x + 62, y + 18, { tam: 18, color: '#3b2a22', alinear: 'left', max: 110 });
  if (d.tipo === 'pieza' && (t.n ?? 1) > 1) {
    const cx = x + w - 44, cy = y + 18;
    g.fillStyle = '#f1e6d6';
    elipse(g, cx, cy, 30, 20);
    g.fill();
    g.fillStyle = COLOR_PIEZA[d.id] ?? '#e5243b';
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 1;
    for (const q of patron(t.n!)) {
      elipse(g, cx + q.u * 25, cy + q.v * 16, 5, 4);
      g.fill();
      g.stroke();
    }
  } else texto(g, d.tipo === 'salsa' ? '〰' : d.tipo === 'polvo' ? '∴' : '•', x + w - 44, y + 18, { tam: 22, color: '#8a6a58' });
}
const COLOR_PIEZA: Record<string, string> = {
  chantilly: '#fffaf2', banano: '#f2dc8c', arandano: '#3a4aa8', kiwi: '#8cbf3a', masmelo: '#ffc4d6', cereza: '#c4102a', barquillo: '#e0a860',
  galleta: '#2d1c16', menta: '#4fae4a', fresa_entera: '#e5243b', helado: '#fff1c9',
};
/** Guía de emplatado (mejora): aros punteados donde va cada pieza. */
export function dibujarGuia(g: G, pedidos: ToppingPedido[], defs: Record<string, ToppingDef>, s: Ovalo) {
  g.save();
  g.setLineDash([5, 5]);
  g.strokeStyle = 'rgba(255,255,255,0.85)';
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
export function botonEntregar(g: G, r: Rect) {
  boton(g, r, { color: '#5cc26a' });
  texto(g, '✓ Entregar', r.x + r.w / 2, r.y + r.h / 2 + 2, { tam: 28, color: '#fff', borde: '#2f7a3a' });
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
