// La frapería (estilo Papa's Freezeria): en «Preparar» se escoge el vaso, se echan los bombazos de la base (café,
// chocolate, moca, fresa…), las cucharadas de hielo y la leche hasta la rayita; en «Licuar» se licúa hasta que quede
// grueso, normal o cremoso (sin que se agüe) y se sirve; en «Decorar» va la crema chantilly a la altura que pide,
// las salsas, los toppings, la cereza y el pitillo.
import { aclarar, boton, chantilly, conAlfa, dentro, elipse, G, lineal, mezclar, oscurecer, radial, Rect, rr, sombra, texto } from './dibujo';
import {
  Aplicador, aUV, botonBotar, botonEntregar, botonesToppings, calificarToppings, dibujarBotonesToppings, dibujarGuia, dibujarSuperficie,
  filaTopping, medidor, Ovalo, puntajeCuenta, puntajeNivel, puntajeZona, rayita, separador, Superficie, superficieNueva, ToppingDef,
  ToppingPedido,
} from './herramientas';
import { BARRA, Categoria, Estacion, Motor, Receta, RIEL, sonidos, Ticket } from './motor';
import type { Desbloqueo, Mejora } from './tipos';

// ---------------------------------------------------------------------------------------------- Ingredientes
type Tam = 'P' | 'M' | 'G';
const VASOS: Record<Tam, { nombre: string; onzas: number; esc: number; bombas: number; desde: number }> = {
  P: { nombre: 'Pequeño', onzas: 12, esc: 0.86, bombas: 2, desde: 1 },
  M: { nombre: 'Mediano', onzas: 16, esc: 1, bombas: 3, desde: 1 },
  G: { nombre: 'Grande', onzas: 20, esc: 1.14, bombas: 4, desde: 3 },
};
const BASES = [
  { id: 'cafe', nombre: 'Café', color: '#6b4228', desde: 1 },
  { id: 'chocolate', nombre: 'Chocolate', color: '#4a2616', desde: 1 },
  { id: 'moca', nombre: 'Moca', color: '#5d3522', desde: 2 },
  { id: 'fresa', nombre: 'Fresa', color: '#e8607f', desde: 3 },
  { id: 'caramelo', nombre: 'Caramelo', color: '#c07a2c', desde: 4 },
  { id: 'galleta', nombre: 'Galleta', color: '#8f8279', desde: 6 },
  { id: 'maracuya', nombre: 'Maracuyá', color: '#efb82a', desde: 8 },
  { id: 'matcha', nombre: 'Matcha', color: '#86b551', desde: 10 },
];
const BASE = Object.fromEntries(BASES.map((b) => [b.id, b]));
const LICUADO = { grueso: 0.36, normal: 0.6, cremoso: 0.82 } as const;
type Licuado = keyof typeof LICUADO;
const AGUADO = 0.95;
const CREMA = { sin: 0, normal: 0.5, alta: 0.85 } as const;
type Crema = keyof typeof CREMA;
const LECHE = 0.85;
const PITILLOS = [
  { id: 'rojo', color: '#e8434f', desde: 1 },
  { id: 'azul', color: '#3a86d9', desde: 5 },
  { id: 'rosado', color: '#ff8fb8', desde: 5 },
];

const TOPS: ToppingDef[] = [
  { id: 'cereza', nombre: 'Cereza', tipo: 'pieza', desde: 1, tam: 0.26 },
  { id: 'caramelo', nombre: 'Salsa de caramelo', tipo: 'salsa', color: '#c9822e', desde: 1 },
  { id: 'chocolate', nombre: 'Salsa de chocolate', tipo: 'salsa', color: '#4f2a1a', desde: 2 },
  { id: 'chispitas', nombre: 'Chispitas', tipo: 'polvo', desde: 2 },
  { id: 'galleta_triturada', nombre: 'Galleta triturada', tipo: 'polvo', desde: 3 },
  { id: 'canela', nombre: 'Canela', tipo: 'polvo', desde: 4 },
  { id: 'arequipe', nombre: 'Arequipe', tipo: 'salsa', color: '#b8712c', desde: 5 },
  { id: 'barquillo', nombre: 'Barquillo', tipo: 'pieza', desde: 6, tam: 0.3 },
  { id: 'masmelo', nombre: 'Masmelos', tipo: 'pieza', desde: 7, tam: 0.2 },
  { id: 'coco', nombre: 'Coco rallado', tipo: 'polvo', desde: 9 },
];
const TOP = Object.fromEntries(TOPS.map((t) => [t.id, t]));
const CUANTAS: Record<string, [number, number]> = { cereza: [1, 1], barquillo: [1, 2], masmelo: [3, 5] };

// ---------------------------------------------------------------------------------------------- Pedido y obra
export interface PedidoFrappe {
  vaso: Tam;
  base: string;
  hielo: number;
  licuado: Licuado;
  crema: Crema;
  toppings: ToppingPedido[];
  pitillo: string;
}
interface Vaso {
  tam: Tam;
  bombas: Record<string, number>;
  hielo: number;
  leche: number;
}
interface ObraFrappe {
  vaso: Vaso | null;
  /** Licuadora donde está (mientras se licúa). */
  licuadora: number;
  /** Qué tan licuado quedó (null si no se ha servido). */
  licuado: number | null;
  crema: number;
  pitillo: string | null;
  sup: Superficie;
}

function pedido(rango: number, _dia: number, azar: () => number): PedidoFrappe {
  const tomar = <T,>(l: T[]) => l[Math.floor(azar() * l.length)];
  const disponibles = TOPS.filter((t) => t.desde <= rango);
  const k = Math.max(1, Math.min(4, disponibles.length, 1 + Math.floor(rango / 4) + (azar() < 0.5 ? 1 : 0)));
  const elegidos: ToppingDef[] = [];
  while (elegidos.length < k) {
    const t = tomar(disponibles);
    if (!elegidos.includes(t)) elegidos.push(t);
  }
  // Salsas y polvos primero; la cereza y las piezas de últimas (encima de todo)
  elegidos.sort((a, b) => (a.tipo === 'pieza' ? 1 : 0) - (b.tipo === 'pieza' ? 1 : 0));
  const licuados: Licuado[] = ['normal', ...(rango >= 2 ? (['cremoso'] as Licuado[]) : []), ...(rango >= 4 ? (['grueso'] as Licuado[]) : [])];
  const cremas: Crema[] = ['normal', 'normal', 'sin', ...(rango >= 3 ? (['alta'] as Crema[]) : [])];
  return {
    vaso: tomar((Object.keys(VASOS) as Tam[]).filter((t) => VASOS[t].desde <= rango)),
    base: tomar(BASES.filter((b) => b.desde <= rango)).id,
    hielo: rango >= 2 ? 1 + Math.floor(azar() * 3) : 2,
    licuado: tomar(licuados),
    crema: tomar(cremas),
    toppings: elegidos.map((t) => {
      if (t.tipo !== 'pieza') return { id: t.id };
      const [a, b] = CUANTAS[t.id] ?? [1, 1];
      return { id: t.id, n: a + Math.floor(azar() * (b - a + 1)) };
    }),
    pitillo: tomar(PITILLOS.filter((p) => p.desde <= rango)).id,
  };
}

// ---------------------------------------------------------------------------------------------- Dibujos
const colorBase = (v: Vaso) => {
  const ids = Object.keys(v.bombas).filter((k) => v.bombas[k] > 0);
  if (!ids.length) return '#f4efe8';
  let c = BASE[ids[0]].color;
  for (const id of ids.slice(1)) c = mezclar(c, BASE[id].color, 0.5);
  return c;
};
/** El color del frappé licuado: la base con la leche. */
const colorFrappe = (v: Vaso) => mezclar(colorBase(v), '#f6ede2', 0.45);

/** Vaso alto de frappé (vacío, preparado o ya licuado, con su crema, toppings y pitillo). */
function dibujarVaso(g: G, o: ObraFrappe, x: number, yBase: number, esc: number, ahora: number, extra: { raya?: boolean; guia?: ToppingPedido[] } = {}) {
  const v = o.vaso;
  const tm = VASOS[v?.tam ?? 'M'];
  const k = esc * tm.esc;
  const h = 250 * k, wA = 132 * k, wB = 96 * k;
  const arriba = yBase - h;
  const forma = () => {
    g.beginPath();
    g.moveTo(x - wA / 2, arriba);
    g.lineTo(x + wA / 2, arriba);
    g.lineTo(x + wB / 2, yBase);
    g.lineTo(x - wB / 2, yBase);
    g.closePath();
  };
  sombra(g, x, yBase + 4, wA * 0.62, 12, 0.28);
  // Pitillo (atrás del vaso, sale por arriba)
  if (o.pitillo) {
    const p = PITILLOS.find((q) => q.id === o.pitillo)!;
    g.save();
    g.translate(x + wA * 0.12, arriba + h * 0.2);
    g.rotate(0.22);
    g.fillStyle = p.color;
    rr(g, -7 * k, -h * 0.75, 14 * k, h * 0.9, 6 * k);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 6; i++) {
      g.save();
      g.translate(0, -h * 0.7 + i * h * 0.14);
      g.rotate(-0.5);
      g.fillRect(-7 * k, 0, 14 * k, 5 * k);
      g.restore();
    }
    g.restore();
  }
  g.save();
  forma();
  g.clip();
  g.fillStyle = 'rgba(235,245,255,0.3)';
  g.fillRect(x - wA, arriba, wA * 2, h);
  if (v && o.licuado === null) {
    // Sin licuar: la base abajo, el hielo y la leche
    const bombas = Object.values(v.bombas).reduce((a, b) => a + b, 0);
    const yb = yBase - h * Math.min(0.3, bombas * 0.06);
    if (bombas) {
      g.fillStyle = colorBase(v);
      g.fillRect(x - wA, yb, wA * 2, yBase - yb);
    }
    if (v.leche > 0) {
      const yl = yBase - h * Math.min(1.05, v.leche);
      g.fillStyle = lineal(g, 0, yl, 0, yb, [[0, 'rgba(250,248,242,0.95)'], [1, conAlfa(colorBase(v), 0.4)]]);
      g.fillRect(x - wA, yl, wA * 2, Math.max(0, yb - yl));
    }
    for (let i = 0; i < v.hielo * 3; i++) {
      const hx = x + ((i % 3) - 1) * wB * 0.3 + ((i * 7) % 5) - 2, hy = yBase - h * (0.12 + Math.floor(i / 3) * 0.1) - (i % 2) * 8;
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.strokeStyle = 'rgba(150,190,220,0.9)';
      g.lineWidth = 2;
      rr(g, hx - 13 * k, hy - 12 * k, 26 * k, 24 * k, 6 * k);
      g.fill();
      g.stroke();
    }
  } else if (v && o.licuado !== null) {
    // Licuado: color parejo con pedacitos de hielo si quedó grueso
    const yl = arriba + h * 0.08;
    g.fillStyle = lineal(g, 0, yl, 0, yBase, [[0, aclarar(colorFrappe(v), 0.15)], [1, oscurecer(colorFrappe(v), 0.08)]]);
    g.fillRect(x - wA, yl, wA * 2, yBase - yl);
    const trozos = Math.round(Math.max(0, 0.7 - o.licuado) * 30);
    for (let i = 0; i < trozos; i++) {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      elipse(g, x + Math.sin(i * 12.9) * wB * 0.4, yl + 20 + ((i * 37) % 100) / 100 * (yBase - yl - 30), 5 * k, 4 * k);
      g.fill();
    }
    if (o.licuado > AGUADO) {
      g.fillStyle = 'rgba(210,225,240,0.4)';
      g.fillRect(x - wA, yl, wA * 2, 30 * k);
    }
  }
  g.restore();
  g.strokeStyle = 'rgba(140,170,190,0.9)';
  g.lineWidth = 3;
  forma();
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.fillRect(x - wA * 0.36, arriba + 14, 7 * k, h * 0.72);
  if (extra.raya) rayita(g, x - wA / 2 - 8, x + wA / 2 + 8, yBase - h * LECHE);
  // Crema chantilly en espiral y lo de encima
  const s = superficieVaso(x, yBase, esc, o);
  if (o.licuado !== null && o.crema > 0.02) {
    const alto = o.crema * 110 * k;
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      chantilly(g, x, arriba + 6 * k - t * alto * 0.7, (wA / 2) * (1 - t * 0.55) * Math.min(1, 0.4 + o.crema));
    }
  }
  if (o.licuado !== null) {
    if (extra.guia) dibujarGuia(g, extra.guia, TOP, s);
    dibujarSuperficie(g, o.sup, s, TOP, ahora, false);
  }
}
function superficieVaso(x: number, yBase: number, esc: number, o: ObraFrappe): Ovalo {
  const k = esc * VASOS[o.vaso?.tam ?? 'M'].esc;
  const h = 250 * k, wA = 132 * k;
  const alto = o.crema > 0.02 ? o.crema * 110 * k * 0.55 : 0;
  return { x, y: yBase - h - alto, rx: wA * 0.42, ry: wA * 0.15 };
}

// ---------------------------------------------------------------------------------------------- Preparar
class EstacionPreparar implements Estacion {
  id = 'preparar';
  nombre = 'Preparar';
  icono = '🧋';
  usaTicket = true;
  private sirviendo = false;
  private sonando = 0;
  constructor(private m: Motor) {}

  private get obra(): ObraFrappe | null {
    return (this.m.activo?.obra as ObraFrappe) ?? null;
  }
  private rVasos(): (Rect & { tam: Tam })[] {
    return (['P', 'M', 'G'] as Tam[]).filter((t) => VASOS[t].desde <= this.m.rango).map((tam, i) => ({ tam, x: 14, y: RIEL + 14 + i * 124, w: 150, h: 114 }));
  }
  private rBombas(): (Rect & { id: string })[] {
    const bs = BASES.filter((b) => b.desde <= this.m.rango);
    const x0 = 184, cols = Math.min(4, bs.length), w = 112;
    return bs.map((b, i) => ({ id: b.id, x: x0 + (i % cols) * (w + 8), y: RIEL + 20 + Math.floor(i / cols) * 190, w, h: 176 }));
  }
  private rHielo(): Rect {
    return { x: 184, y: this.m.H - BARRA - 138, w: 190, h: 124 };
  }
  private rLeche(): Rect {
    return { x: 390, y: this.m.H - BARRA - 138, w: 150, h: 124 };
  }
  private pos() {
    return { x: this.m.zona.w - 150, y: this.m.H - BARRA - 30 };
  }
  private rBotar(): Rect {
    return { x: this.m.zona.w - 240, y: RIEL + 14, w: 150, h: 60 };
  }

  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: RIEL + 400 });
  }
  paso(dt: number) {
    const o = this.obra;
    if (!this.sirviendo || !o?.vaso) return;
    const cerca = this.m.mejora('dispensador') && Math.abs(o.vaso.leche - LECHE) < 0.12 ? 0.45 : 1;
    o.vaso.leche = Math.min(1.1, o.vaso.leche + dt * 0.36 * cerca);
    this.sonando -= dt;
    if (this.sonando <= 0) {
      sonidos.vertir(0.3);
      this.sonando = 0.28;
    }
    if (o.vaso.leche >= 1.08) {
      this.sirviendo = false;
      this.m.aviso('¡Se regó la leche!');
    }
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m, o = this.obra;
    if (tipo === 'subir') {
      this.sirviendo = false;
      return;
    }
    if (tipo !== 'bajar') return;
    if (!o) return m.aviso('Primero toca un pedido del riel de arriba');
    if (o.licuado !== null || o.licuadora >= 0) return m.aviso('Este pedido ya está licuado: sigue en «Licuar» o «Decorar»');
    const rv = this.rVasos().find((r) => dentro(r, x, y));
    if (rv) {
      if (o.vaso && (o.vaso.leche > 0 || o.vaso.hielo || Object.keys(o.vaso.bombas).length)) return m.aviso('Ya hay un vaso empezado: bótalo si quieres otro');
      o.vaso = { tam: rv.tam, bombas: {}, hielo: 0, leche: 0 };
      sonidos.pop();
      m.pistaUnaVez('bombas', 'Dale a la base los bombazos que pide, echa el hielo y la leche hasta la rayita');
      return;
    }
    if (dentro(this.rBotar(), x, y) && o.vaso) {
      o.vaso = null;
      sonidos.papel();
      return;
    }
    if (!o.vaso) return m.aviso('Primero escoge el vaso (a la izquierda)');
    const b = this.rBombas().find((r) => dentro(r, x, y));
    if (b) {
      o.vaso.bombas[b.id] = (o.vaso.bombas[b.id] ?? 0) + 1;
      sonidos.vertir(0.15);
      m.flotar(`+1 ${BASE[b.id].nombre.toLowerCase()}`, b.x + b.w / 2, b.y + 20, '#fff4c9', 22);
      return;
    }
    if (dentro(this.rHielo(), x, y)) {
      if (o.vaso.hielo >= 5) return;
      o.vaso.hielo++;
      sonidos.pop();
      return;
    }
    if (dentro(this.rLeche(), x, y)) this.sirviendo = true;
  }

  dibujar(g: G, t: number) {
    const o = this.obra;
    for (const r of this.rVasos()) {
      const act = o?.vaso?.tam === r.tam;
      boton(g, r, { color: act ? '#ffe2a8' : '#ffffff', activo: act, radio: 14 });
      dibujarVaso(g, { vaso: { tam: r.tam, bombas: {}, hielo: 0, leche: 0 }, licuadora: -1, licuado: null, crema: 0, pitillo: null, sup: superficieNueva() }, r.x + 44, r.y + r.h - 10, 0.36, t);
      texto(g, `${VASOS[r.tam].onzas} oz`, r.x + 108, r.y + r.h / 2, { tam: 20, color: '#4a2a10' });
    }
    // Botellas con bomba
    for (const b of this.rBombas()) {
      const base = BASE[b.id];
      boton(g, b, { color: '#ffffff', radio: 16 });
      const cx = b.x + b.w / 2;
      g.fillStyle = lineal(g, cx - 30, 0, cx + 30, 0, [[0, oscurecer(base.color, 0.25)], [0.4, aclarar(base.color, 0.15)], [1, oscurecer(base.color, 0.3)]]);
      rr(g, cx - 30, b.y + 60, 60, 80, 12);
      g.fill();
      g.fillStyle = '#f7f3ea';
      rr(g, cx - 24, b.y + 84, 48, 26, 6);
      g.fill();
      texto(g, base.nombre, cx, b.y + 97, { tam: 13, color: '#3b2a22', max: 46 });
      g.fillStyle = '#3a3a3a';
      g.fillRect(cx - 5, b.y + 26, 10, 36);
      rr(g, cx - 20, b.y + 18, 40, 14, 6);
      g.fill();
      g.fillRect(cx + 16, b.y + 22, 22, 6);
      const n = o?.vaso?.bombas[b.id] ?? 0;
      if (n) texto(g, `×${n}`, cx, b.y + b.h - 18, { tam: 22, color: '#b8434f' });
    }
    // Hielo y leche
    const h = this.rHielo();
    boton(g, h, { color: '#e6f6ff', radio: 18 });
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.strokeStyle = 'rgba(120,180,220,0.8)';
      g.lineWidth = 2;
      rr(g, h.x + 30 + (i % 3) * 44, h.y + 18 + Math.floor(i / 3) * 34, 34, 28, 7);
      g.fill();
      g.stroke();
    }
    texto(g, `Hielo${o?.vaso ? ` · ${o.vaso.hielo}` : ''}`, h.x + h.w / 2, h.y + h.h - 18, { tam: 20, color: '#2a5a7a' });
    const l = this.rLeche();
    boton(g, l, { color: this.sirviendo ? '#ffe2a8' : '#ffffff', hundido: this.sirviendo, radio: 18 });
    g.fillStyle = lineal(g, l.x + 40, 0, l.x + 110, 0, [[0, '#e8eef2'], [0.5, '#ffffff'], [1, '#cfd8de']]);
    rr(g, l.x + 45, l.y + 14, 60, 76, 10);
    g.fill();
    g.fillStyle = '#4f86c6';
    g.fillRect(l.x + 45, l.y + 44, 60, 16);
    texto(g, 'Leche (mantén)', l.x + l.w / 2, l.y + l.h - 16, { tam: 16, color: '#4a2a10', max: l.w - 10 });
    const p = this.pos();
    if (o?.vaso && o.licuadora < 0 && o.licuado === null) {
      if (this.sirviendo) {
        g.strokeStyle = '#faf7f0';
        g.lineWidth = 12;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(l.x + 110, l.y + 30);
        g.quadraticCurveTo(p.x, l.y - 60, p.x, p.y - 200);
        g.stroke();
      }
      dibujarVaso(g, o, p.x, p.y, 1.2, t, { raya: true });
      botonBotar(g, this.rBotar());
    } else if (o && (o.licuadora >= 0 || o.licuado !== null)) texto(g, 'Ya está en la licuadora ✓', p.x - 40, p.y - 140, { tam: 22, color: '#2f8a3a' });
    else if (o) texto(g, '← Escoge el vaso', p.x - 30, p.y - 140, { tam: 22, color: '#6a5a50' });
  }
}

// ---------------------------------------------------------------------------------------------- Licuar
interface Licuadora {
  ticket: number;
  valor: number;
  andando: boolean;
  avisado: number;
}
class EstacionLicuar implements Estacion {
  id = 'licuar';
  nombre = 'Licuar';
  icono = '🌀';
  usaTicket = true;
  licuadoras: (Licuadora | null)[];
  private sonando = 0;
  constructor(private m: Motor) {
    this.licuadoras = Array.from({ length: 1 + m.mejora('licuadoras') }, () => null);
  }
  private rLicuadora(i: number) {
    const x0 = 20, x1 = this.m.zona.w - 10;
    const w = (x1 - x0) / this.licuadoras.length;
    const cx = x0 + w * (i + 0.5);
    return {
      cx, cy: RIEL + 250, caja: { x: cx - 110, y: RIEL + 40, w: 220, h: 330 },
      boton: { x: cx - 160, y: this.m.H - BARRA - 92, w: 150, h: 70 }, servir: { x: cx + 10, y: this.m.H - BARRA - 92, w: 150, h: 70 },
    };
  }
  private vel() {
    return (1 / 12) * (1 + 0.25 * this.m.mejora('turbo'));
  }
  alerta() {
    return this.licuadoras.some((l) => l?.andando && l.valor > 0.88);
  }
  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: RIEL + 360 });
  }

  paso(dt: number) {
    const m = this.m;
    let motor = false;
    this.licuadoras.forEach((l, i) => {
      if (l && !m.tickets.some((k) => k.id === l.ticket)) this.licuadoras[i] = null;
      if (!l?.andando) return;
      motor = true;
      const antes = l.valor;
      l.valor = Math.min(1.1, l.valor + this.vel() * dt);
      if (m.mejora('alarma'))
        for (const meta of Object.values(LICUADO))
          if (antes < meta && l.valor >= meta) {
            sonidos.alarma();
            l.avisado = m.reloj;
          }
      if (antes < AGUADO && l.valor >= AGUADO) {
        sonidos.quemado();
        m.chef('susto', 2);
        m.aviso(m.actual === 2 ? '¡Se está aguando!' : '¡Se está aguando un frappé en «Licuar»!');
      }
    });
    if (motor && m.actual === 2) {
      this.sonando -= dt;
      if (this.sonando <= 0) {
        sonidos.motor(300);
        this.sonando = 0.4;
      }
    }
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m;
    if (tipo !== 'bajar') return;
    for (let i = 0; i < this.licuadoras.length; i++) {
      const r = this.rLicuadora(i);
      const l = this.licuadoras[i];
      if (l && dentro(r.boton, x, y)) {
        l.andando = !l.andando;
        sonidos.clic();
        if (l.andando) m.pistaUnaVez('licuado', 'Páralo cuando la flecha llegue al punto que pide (grueso, normal o cremoso)');
        return;
      }
      if (l && dentro(r.servir, x, y)) {
        if (l.andando) return m.aviso('Primero para la licuadora');
        if (l.valor < 0.08) return m.aviso('Todavía no está licuado');
        const tk = m.tickets.find((k) => k.id === l.ticket);
        if (tk) {
          const o = tk.obra as ObraFrappe;
          o.licuado = l.valor;
          o.licuadora = -1;
          m.activo = tk;
        }
        this.licuadoras[i] = null;
        sonidos.vertir(0.6);
        m.pistaUnaVez('decorar', 'Ahora ve a «Decorar»: crema, salsas, toppings y pitillo');
        return;
      }
      if (dentro(r.caja, x, y)) {
        if (l) {
          const tk = m.tickets.find((k) => k.id === l.ticket);
          if (tk) m.activo = tk;
          return;
        }
        const o = m.activo?.obra as ObraFrappe | undefined;
        if (!o) return m.aviso('Primero toca un pedido del riel de arriba');
        if (o.licuadora >= 0 || o.licuado !== null) return m.aviso('Ese pedido ya pasó por la licuadora');
        if (!o.vaso || o.vaso.leche < 0.2) return m.aviso('Primero prepara el vaso en «Preparar»');
        this.licuadoras[i] = { ticket: m.activo!.id, valor: 0, andando: false, avisado: 0 };
        o.licuadora = i;
        sonidos.vertir(0.5);
        return;
      }
    }
  }

  dibujar(g: G, t: number) {
    const m = this.m;
    this.licuadoras.forEach((l, i) => {
      const r = this.rLicuadora(i);
      const tk = l ? m.tickets.find((k) => k.id === l.ticket) : undefined;
      const o = tk?.obra as ObraFrappe | undefined;
      this.dibujarLicuadora(g, r.cx, r.cy, l, o?.vaso ?? null, t);
      if (l) {
        const p = tk?.pedido as PedidoFrappe | undefined;
        texto(g, tk ? `Pedido #${tk.numero}` : '—', r.cx, RIEL + 30, { tam: 22, color: '#8a4a2a', borde: '#fff' });
        medidor(g, r.cx + 110, r.cy - 150, 26, 240, l.valor, [
          { desde: 0.28, hasta: 0.44, color: '#d8ecc0', etiqueta: p?.licuado === 'grueso' ? 'Grueso ★' : 'Grueso' },
          { desde: 0.52, hasta: 0.68, color: '#bfe8c0', etiqueta: p?.licuado === 'normal' ? 'Normal ★' : 'Normal' },
          { desde: 0.74, hasta: 0.9, color: '#8fd49a', etiqueta: p?.licuado === 'cremoso' ? 'Cremoso ★' : 'Cremoso' },
          { desde: AGUADO, hasta: 1, color: '#f2a0a0' },
        ], m.mejora('alarma') && m.reloj - l.avisado < 1.2 ? m.reloj : undefined);
        boton(g, r.boton, { color: l.andando ? '#e8434f' : '#5cc26a', hundido: l.andando });
        texto(g, l.andando ? '■ Parar' : '▶ Licuar', r.boton.x + r.boton.w / 2, r.boton.y + 36 + (l.andando ? 4 : 0), { tam: 24, color: '#fff' });
        boton(g, r.servir, { color: l.andando || l.valor < 0.08 ? '#cbbfb4' : '#ffb627' });
        texto(g, 'Servir ➜', r.servir.x + r.servir.w / 2, r.servir.y + 36, { tam: 24, color: '#4a2a10' });
      } else texto(g, m.activo ? `Toca para licuar el #${m.activo.numero}` : 'Libre', r.cx, m.H - BARRA - 56, { tam: 20, color: '#6a5a50', borde: '#fff' });
    });
  }

  private dibujarLicuadora(g: G, x: number, y: number, l: Licuadora | null, v: Vaso | null, t: number) {
    const vib = l?.andando ? Math.sin(t * 70) * 2 : 0;
    sombra(g, x, y + 120, 110, 22, 0.3);
    // Motor
    g.fillStyle = lineal(g, x - 80, 0, x + 80, 0, [[0, '#2e3336'], [0.5, '#5a6166'], [1, '#2a2e31']]);
    rr(g, x - 80 + vib, y + 40, 160, 80, 18);
    g.fill();
    g.fillStyle = l?.andando ? '#5cc26a' : '#9aa2a7';
    elipse(g, x + vib, y + 80, 14, 14);
    g.fill();
    // Jarra
    const arriba = y - 170, abajo = y + 40;
    g.save();
    g.beginPath();
    g.moveTo(x - 80 + vib, arriba);
    g.lineTo(x + 80 + vib, arriba);
    g.lineTo(x + 56 + vib, abajo);
    g.lineTo(x - 56 + vib, abajo);
    g.closePath();
    g.fillStyle = 'rgba(225,240,250,0.35)';
    g.fill();
    g.clip();
    if (l && v) {
      const nivel = arriba + (abajo - arriba) * (0.35 - Math.min(0.1, l.valor * 0.08));
      const col = mezclar(colorBase(v), '#f6ede2', 0.45 * Math.min(1, l.valor * 1.5));
      g.fillStyle = radial(g, x, abajo, 10, 200, [[0, oscurecer(col, 0.1)], [1, aclarar(col, 0.1)]]);
      g.fillRect(x - 100, nivel, 200, abajo - nivel);
      // Remolino y trozos de hielo que se van deshaciendo
      if (l.andando) {
        g.strokeStyle = conAlfa('#ffffff', 0.35);
        g.lineWidth = 5;
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.ellipse(x, abajo - 40 - i * 34, 50 - i * 8, 12, 0, t * 12 + i, t * 12 + i + 3.5);
          g.stroke();
        }
      }
      const trozos = Math.round(Math.max(0, 0.75 - l.valor) * 16);
      for (let i = 0; i < trozos; i++) {
        const a = i * 2.3 + (l.andando ? t * 9 : 0);
        g.fillStyle = 'rgba(255,255,255,0.85)';
        rr(g, x + Math.cos(a) * 40 - 8, abajo - 30 - ((i * 23) % 110) + Math.sin(a) * 6, 16, 14, 4);
        g.fill();
      }
    }
    g.restore();
    g.strokeStyle = 'rgba(140,170,190,0.95)';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x - 80 + vib, arriba);
    g.lineTo(x - 56 + vib, abajo);
    g.lineTo(x + 56 + vib, abajo);
    g.lineTo(x + 80 + vib, arriba);
    g.stroke();
    g.fillStyle = '#2e3336';
    rr(g, x - 86 + vib, arriba - 18, 172, 22, 8);
    g.fill();
    g.strokeStyle = '#2e3336';
    g.lineWidth = 12;
    g.beginPath();
    g.moveTo(x + 76 + vib, arriba + 20);
    g.quadraticCurveTo(x + 130 + vib, arriba + 60, x + 64 + vib, abajo - 30);
    g.stroke();
  }
}

// ---------------------------------------------------------------------------------------------- Decorar
class EstacionDecorar implements Estacion {
  id = 'decorar';
  nombre = 'Decorar';
  icono = '🍒';
  usaTicket = true;
  private herramienta: string | null = null;
  private aplicador = new Aplicador(TOP);
  private aplicando = false;
  private cremando = false;
  private confirmar = 0;
  constructor(private m: Motor) {}

  private get obra(): ObraFrappe | null {
    return (this.m.activo?.obra as ObraFrappe) ?? null;
  }
  private botones() {
    return botonesToppings(TOPS, this.m.rango, 14, RIEL + 14);
  }
  private pos() {
    return { x: 300 + (this.m.zona.w - 300) / 2 - 40, y: this.m.H - BARRA - 34 };
  }
  private rCrema(): Rect {
    const p = this.pos();
    return { x: p.x - 330, y: this.m.H - BARRA - 150, w: 160, h: 130 };
  }
  private rPitillos(): (Rect & { id: string })[] {
    const p = this.pos();
    return PITILLOS.filter((q) => q.desde <= this.m.rango).map((q, i) => ({ id: q.id, x: p.x + 170, y: RIEL + 80 + i * 74, w: 180, h: 64 }));
  }
  private rEntregar(): Rect {
    const p = this.pos();
    return { x: p.x + 150, y: this.m.H - BARRA - 90, w: 190, h: 66 };
  }
  private rBotar(): Rect {
    const p = this.pos();
    return { x: p.x + 150, y: this.m.H - BARRA - 166, w: 190, h: 60 };
  }
  private superficie(): Ovalo | null {
    const o = this.obra;
    if (!o || o.licuado === null) return null;
    const p = this.pos();
    return superficieVaso(p.x, p.y, 1.25, o);
  }

  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: RIEL + 330 });
  }
  paso(dt: number) {
    const o = this.obra;
    if (this.cremando && o) o.crema = Math.min(1.1, o.crema + dt * 0.45);
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m, o = this.obra;
    if (tipo === 'mover') {
      const s = this.superficie();
      if (this.aplicando && s) this.aplicador.mover(aUV(s, x, y));
      return;
    }
    if (tipo === 'subir') {
      this.aplicando = false;
      this.cremando = false;
      this.aplicador.subir();
      return;
    }
    const b = this.botones().find((r) => dentro(r, x, y));
    if (b) {
      this.herramienta = this.herramienta === b.id ? null : b.id;
      sonidos.clic();
      return;
    }
    if (!o) return m.aviso('Primero toca un pedido del riel de arriba');
    if (o.licuado === null && (dentro(this.rCrema(), x, y) || this.herramienta)) return m.aviso('Primero licúalo y sírvelo en «Licuar»');
    if (dentro(this.rCrema(), x, y)) {
      if (o.sup.capas.length) return m.aviso('La crema va antes que los toppings');
      this.cremando = true;
      sonidos.vertir(0.4);
      return;
    }
    const pt = this.rPitillos().find((r) => dentro(r, x, y));
    if (pt && o.licuado !== null) {
      o.pitillo = o.pitillo === pt.id ? null : pt.id;
      sonidos.pop();
      return;
    }
    if (dentro(this.rEntregar(), x, y)) {
      if (o.licuado === null) return m.aviso('Todavía no hay frappé: prepáralo y licúalo');
      if (!o.pitillo && m.reloj - this.confirmar > 3) {
        this.confirmar = m.reloj;
        return m.aviso('¡Falta el pitillo! Toca «Entregar» otra vez para mandarlo así');
      }
      this.herramienta = null;
      m.entregar(m.activo!);
      return;
    }
    if (dentro(this.rBotar(), x, y)) {
      o.crema = 0;
      o.pitillo = null;
      o.sup = superficieNueva();
      sonidos.papel();
      return;
    }
    const s = this.superficie();
    if (this.herramienta && s) {
      const r = this.aplicador.bajar(o.sup, this.herramienta, aUV(s, x, y), m.reloj);
      if (r) {
        this.aplicando = r !== 'pieza';
        if (r === 'pieza') sonidos.pop();
        else if (r === 'salsa') sonidos.vertir(0.3);
        else sonidos.papel();
      }
    }
  }

  dibujar(g: G, t: number) {
    const m = this.m, o = this.obra;
    dibujarBotonesToppings(g, this.botones(), TOP, this.herramienta);
    const p = this.pos();
    if (!o) {
      texto(g, 'Toca un pedido del riel', p.x, p.y - 180, { tam: 26, color: '#9a8a80' });
      return;
    }
    const c = this.rCrema();
    boton(g, c, { color: this.cremando ? '#ffe2a8' : '#ffffff', hundido: this.cremando, radio: 18 });
    chantilly(g, c.x + c.w / 2, c.y + 64, 34);
    texto(g, 'Crema (mantén)', c.x + c.w / 2, c.y + c.h - 16, { tam: 16, color: '#4a2a10', max: c.w - 8 });
    for (const r of this.rPitillos()) {
      const q = PITILLOS.find((x) => x.id === r.id)!;
      const act = o.pitillo === r.id;
      boton(g, r, { color: act ? '#ffe2a8' : '#ffffff', activo: act, radio: 14 });
      g.fillStyle = q.color;
      rr(g, r.x + 16, r.y + 14, 14, r.h - 28, 6);
      g.fill();
      texto(g, `Pitillo ${r.id}`, r.x + 110, r.y + r.h / 2 + 2, { tam: 18, color: '#4a2a10' });
    }
    if (o.vaso) {
      const pd = m.activo!.pedido as PedidoFrappe;
      dibujarVaso(g, o, p.x, p.y, 1.25, t, { guia: m.mejora('guia') ? pd.toppings : undefined });
      // Hasta dónde va la crema que pide
      if (o.licuado !== null && pd.crema !== 'sin' && !o.sup.capas.length && m.mejora('guia')) {
        const k = 1.25 * VASOS[o.vaso.tam].esc;
        rayita(g, p.x - 90, p.x + 90, p.y - 250 * k - CREMA[pd.crema] * 110 * k, 'crema');
      }
      if (o.licuado === null) texto(g, o.licuadora >= 0 ? 'Está en la licuadora…' : 'Falta prepararlo y licuarlo', p.x, p.y - 360, { tam: 22, color: '#8a6a58', borde: '#fff' });
    } else texto(g, 'Este pedido no tiene vaso: ve a «Preparar»', p.x, p.y - 180, { tam: 24, color: '#9a8a80' });
    botonEntregar(g, this.rEntregar());
    botonBotar(g, this.rBotar());
    if (this.herramienta) texto(g, `En la mano: ${TOP[this.herramienta].nombre}`, p.x, RIEL + 26, { tam: 20, color: '#fff', borde: 'rgba(40,30,25,0.8)' });
  }
}

// ---------------------------------------------------------------------------------------------- Tiquete y calificación
function dibujarTicket(g: G, p: PedidoFrappe, r: Rect) {
  let y = r.y + 12;
  const base = BASE[p.base];
  const vaso: Vaso = { tam: p.vaso, bombas: { [p.base]: VASOS[p.vaso].bombas }, hielo: 0, leche: 0 };
  dibujarVaso(g, { vaso, licuadora: -1, licuado: 0.6, crema: CREMA[p.crema], pitillo: p.pitillo, sup: superficieNueva() }, r.x + 36, y + 76, 0.24, 0);
  texto(g, `${base.nombre} · ${VASOS[p.vaso].onzas} oz`, r.x + 70, y + 18, { tam: 18, color: '#3b2a22', alinear: 'left', max: r.w - 80 });
  texto(g, `${VASOS[p.vaso].bombas} bombazos · 🧊 ${p.hielo}`, r.x + 70, y + 42, { tam: 15, color: '#8a6a58', alinear: 'left', peso: 700, max: r.w - 80 });
  texto(g, `Licuado ${p.licuado}`, r.x + 70, y + 64, { tam: 16, color: '#3b2a22', alinear: 'left', max: r.w - 80 });
  texto(g, p.crema === 'sin' ? 'Sin crema' : `Crema ${p.crema}`, r.x + 70, y + 86, { tam: 16, color: '#3b2a22', alinear: 'left', max: r.w - 80 });
  y += 106;
  separador(g, r.x + 14, r.x + r.w - 14, y);
  y += 6;
  for (const t of p.toppings) {
    filaTopping(g, t, TOP[t.id], r.x, r.w, y);
    y += 46;
  }
  const pt = PITILLOS.find((q) => q.id === p.pitillo)!;
  g.fillStyle = pt.color;
  rr(g, r.x + 28, y + 4, 12, 30, 5);
  g.fill();
  texto(g, `Pitillo ${p.pitillo}`, r.x + 62, y + 18, { tam: 18, color: '#3b2a22', alinear: 'left' });
}

function calificar(t: Ticket<PedidoFrappe, ObraFrappe>): Categoria[] {
  const p = t.pedido, o = t.obra;
  let prep = 0;
  if (o.vaso) {
    const v = o.vaso;
    const bien = v.bombas[p.base] ?? 0;
    const otras = Object.entries(v.bombas).filter(([k]) => k !== p.base).reduce((a, [, n]) => a + n, 0);
    const bombas = Math.max(0, puntajeCuenta(bien, VASOS[p.vaso].bombas) - otras * 30);
    prep = Math.round((bombas * 0.4 + puntajeCuenta(v.hielo, p.hielo) * 0.25 + puntajeNivel(v.leche, LECHE) * 0.35) * (v.tam === p.vaso ? 1 : 0.6));
  }
  const licuado = o.licuado === null ? 0 : o.licuado > AGUADO ? 10 : puntajeZona(o.licuado, LICUADO[p.licuado]);
  let deco = 0;
  if (o.licuado !== null) {
    const crema = p.crema === 'sin' ? (o.crema < 0.05 ? 100 : 30) : puntajeNivel(o.crema, CREMA[p.crema], 0.08);
    const pitillo = o.pitillo === p.pitillo ? 100 : o.pitillo ? 60 : 0;
    deco = Math.round(crema * 0.3 + calificarToppings(o.sup, p.toppings, TOP).valor * 0.55 + pitillo * 0.15);
  }
  return [
    { id: 'preparado', nombre: 'Preparado', valor: prep },
    { id: 'licuado', nombre: 'Licuado', valor: licuado },
    { id: 'decorado', nombre: 'Decorado', valor: deco },
  ];
}

const MEJORAS: Mejora[] = [
  { id: 'licuadoras', nombre: 'Otra licuadora', icono: '🌀', niveles: ['Una segunda licuadora', 'Una tercera licuadora'], precios: [45, 110] },
  { id: 'turbo', nombre: 'Licuadora turbo', icono: '⚡', niveles: ['Licúa 25 % más rápido', 'Licúa 50 % más rápido'], precios: [35, 90] },
  { id: 'alarma', nombre: 'Alarma de punto', icono: '⏰', niveles: ['Suena cuando llega a grueso, normal y cremoso'], precios: [25] },
  { id: 'dispensador', nombre: 'Jarra de precisión', icono: '🥛', niveles: ['La leche sale más despacio cerca de la rayita'], precios: [35] },
  { id: 'guia', nombre: 'Guía de emplatado', icono: '📐', niveles: ['Marquitas de dónde va cada pieza y hasta dónde la crema'], precios: [40] },
  { id: 'musica', nombre: 'Parlante con música', icono: '🎶', niveles: ['Los invitados esperan 15 % más contentos', '30 % más contentos'], precios: [30, 80] },
  { id: 'jarra', nombre: 'Frasco de propinas bonito', icono: '🫙', niveles: ['12 % más propina', '24 % más propina', '36 % más propina'], precios: [25, 60, 120] },
];

const DESBLOQUEOS: Desbloqueo[] = [
  ...BASES.filter((b) => b.desde > 1).map((b) => ({ rango: b.desde, texto: `Base nueva: ${b.nombre}` })),
  ...TOPS.filter((x) => x.desde > 1).map((x) => ({ rango: x.desde, texto: `Topping nuevo: ${x.nombre}` })),
  { rango: 2, texto: 'Ahora piden frappés cremosos y más o menos hielo' },
  { rango: 3, texto: 'Vaso grande de 20 oz y crema alta' },
  { rango: 4, texto: 'Ahora piden frappés gruesos (con trocitos de hielo)' },
  { rango: 5, texto: 'Pitillos de colores' },
];

export const FRAPPES = {
  id: 'frappes',
  nombre: 'Frapería',
  titulo: (rol) => `La Frapería de ${rol === 'el' ? 'Él' : 'Ella'}`,
  plato: 'frape_chef',
  nombrePlato: 'Frappés de chef',
  tema: { pared: '#bfe3dc', acento: '#2f9e8f', piso: '#e3efe9' },
  mejoras: MEJORAS,
  desbloqueos: DESBLOQUEOS,
  crearEstaciones(m) {
    return [new EstacionPreparar(m), new EstacionLicuar(m), new EstacionDecorar(m)];
  },
  pedido,
  obraNueva: () => ({ vaso: null, licuadora: -1, licuado: null, crema: 0, pitillo: null, sup: superficieNueva() }),
  tiempoIdeal: (p) => 26 + VASOS[p.vaso].bombas * 1.5 + p.hielo * 1.5 + 12 + p.toppings.length * 5,
  dibujarTicket: (g, p, r) => dibujarTicket(g, p, r),
  calificar,
  dibujarPlato(g, t, x, y, esc, m) {
    if (t.obra.vaso) dibujarVaso(g, t.obra, x, y + 170 * esc, 1.05 * esc, m.reloj + 99);
  },
  /** Para las pruebas automáticas. */
  pruebas: { TOP, VASOS, LICUADO, CREMA, superficieVaso },
} as Receta<PedidoFrappe, ObraFrappe> & { pruebas: unknown };
