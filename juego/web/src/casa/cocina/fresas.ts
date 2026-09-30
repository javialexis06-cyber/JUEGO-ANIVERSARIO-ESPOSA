// La fresería (fresas con crema a la colombiana, estilo Papa's Freezeria/Cupcakeria): en «Picar» se escoge el vaso
// y se cortan las fresas deslizando el dedo (en mitades, cuartos o láminas, bien por el centro); en «Batir» se echa
// la crema de leche hasta la rayita, la leche condensada a cucharadas y se bate hasta el punto (suave o firme, sin
// que se corte); en «Servir» se baña con la crema y se decora: queso rallado, leche condensada, arequipe, chispitas…
import {
  aclarar, boton, conAlfa, dentro, elipse, fresa, fresaCorte, G, lineal, oscurecer, radial, Rect, rr, sombra, texto,
} from './dibujo';
import {
  Aplicador, aUV, botonBotar, botonEntregar, botonesToppings, calificarToppings, dibujarBotonesToppings, dibujarGuia, dibujarSuperficie,
  filaTopping, medidor, Ovalo, puntajeCuenta, puntajeNivel, puntajeZona, rayita, separador, Superficie, superficieNueva, ToppingDef,
  ToppingPedido,
} from './herramientas';
import { BARRA, Categoria, Estacion, Motor, Receta, RIEL, sonidos, Ticket } from './motor';
import type { Desbloqueo, Mejora } from './tipos';

// ---------------------------------------------------------------------------------------------- Ingredientes
type Tam = 'P' | 'M' | 'G';
const VASOS: Record<Tam, { nombre: string; esc: number; fresas: number; desde: number }> = {
  P: { nombre: 'Pequeño', esc: 0.85, fresas: 3, desde: 1 },
  M: { nombre: 'Mediano', esc: 1, fresas: 4, desde: 1 },
  G: { nombre: 'Grande', esc: 1.15, fresas: 5, desde: 2 },
};
type Corte = 'mitades' | 'cuartos' | 'laminas';
interface Linea {
  /** Ángulo de la línea (0 horizontal, π/2 vertical) y distancia al centro (en radios). */
  a: number;
  d: number;
}
const CORTES: Record<Corte, { nombre: string; lineas: Linea[]; desde: number }> = {
  mitades: { nombre: 'En mitades', lineas: [{ a: Math.PI / 2, d: 0 }], desde: 1 },
  cuartos: { nombre: 'En cuartos', lineas: [{ a: Math.PI / 2, d: 0 }, { a: 0, d: 0 }], desde: 2 },
  laminas: { nombre: 'En láminas', lineas: [{ a: Math.PI / 2, d: -0.42 }, { a: Math.PI / 2, d: 0 }, { a: Math.PI / 2, d: 0.42 }], desde: 3 },
};
const PUNTO_CREMA = { suave: 0.5, firme: 0.74 } as const;
type PuntoCrema = keyof typeof PUNTO_CREMA;
const CORTADA = 0.92;
const SABORES = [
  { id: 'arequipe', nombre: 'Arequipe', color: '#c07a34', desde: 5 },
  { id: 'chocolate', nombre: 'Chocolate', color: '#5a321f', desde: 8 },
];
const NIVEL_TAZON = 0.8;
const LLENO_VASO = 0.9;

const TOPS: ToppingDef[] = [
  { id: 'queso', nombre: 'Queso rallado', tipo: 'polvo', desde: 1 },
  { id: 'leche_condensada', nombre: 'Leche condensada', tipo: 'salsa', color: '#f2dfb0', desde: 1 },
  { id: 'fresa_entera', nombre: 'Fresa entera', tipo: 'pieza', desde: 2, tam: 0.2 },
  { id: 'arequipe', nombre: 'Arequipe', tipo: 'salsa', color: '#b8712c', desde: 3 },
  { id: 'chispitas', nombre: 'Chispitas', tipo: 'polvo', desde: 4 },
  { id: 'masmelo', nombre: 'Masmelos', tipo: 'pieza', desde: 5, tam: 0.16 },
  { id: 'chocolate', nombre: 'Chocolate', tipo: 'salsa', color: '#55301f', desde: 6 },
  { id: 'barquillo', nombre: 'Barquillo', tipo: 'pieza', desde: 6, tam: 0.24 },
  { id: 'helado', nombre: 'Helado de fresa', tipo: 'pieza', sabor: 'fresa', desde: 7, tam: 0.3 },
  { id: 'menta', nombre: 'Hojita de menta', tipo: 'pieza', desde: 9, tam: 0.16 },
  { id: 'galleta_triturada', nombre: 'Galleta triturada', tipo: 'polvo', desde: 10 },
];
const TOP = Object.fromEntries(TOPS.map((t) => [t.id, t]));
const CUANTAS: Record<string, [number, number]> = { fresa_entera: [1, 3], masmelo: [3, 6], barquillo: [1, 2], helado: [1, 1], menta: [1, 2] };

// ---------------------------------------------------------------------------------------------- Pedido y obra
export interface PedidoFresas {
  vaso: Tam;
  corte: Corte;
  punto: PuntoCrema;
  dulce: number;
  sabor: string | null;
  toppings: ToppingPedido[];
}
interface FresaPicada {
  cortes: Linea[];
  valor: number;
}
interface Tazon {
  ticket: number;
  nivel: number;
  dulce: number;
  sabor: Record<string, number>;
  textura: number;
  batiendo: boolean;
  avisado: number;
}
interface ObraFresas {
  vaso: Tam | null;
  fresas: FresaPicada[];
  tazon: Tazon | null;
  crema: number;
  sup: Superficie;
}

function pedido(rango: number, _dia: number, azar: () => number): PedidoFresas {
  const tomar = <T,>(l: T[]) => l[Math.floor(azar() * l.length)];
  const vasos = (Object.keys(VASOS) as Tam[]).filter((k) => VASOS[k].desde <= rango);
  const cortes = (Object.keys(CORTES) as Corte[]).filter((k) => CORTES[k].desde <= rango);
  const disponibles = TOPS.filter((t) => t.desde <= rango);
  const k = Math.max(1, Math.min(5, disponibles.length, 1 + Math.floor(rango / 3) + (azar() < 0.5 ? 1 : 0)));
  const elegidos: ToppingDef[] = [];
  while (elegidos.length < k) {
    const t = tomar(disponibles);
    if (!elegidos.includes(t)) elegidos.push(t);
  }
  // El queso siempre abajo (así se come en Colombia) y las piezas encima
  elegidos.sort((a, b) => (a.id === 'queso' ? -1 : b.id === 'queso' ? 1 : 0) || (a.tipo === 'pieza' ? 1 : 0) - (b.tipo === 'pieza' ? 1 : 0));
  const sabores = SABORES.filter((s) => s.desde <= rango);
  return {
    vaso: tomar(vasos),
    corte: tomar(cortes),
    punto: rango >= 2 && azar() < 0.45 ? 'firme' : 'suave',
    dulce: 1 + Math.floor(azar() * (rango >= 3 ? 3 : 2)),
    sabor: sabores.length && azar() < 0.35 ? tomar(sabores).id : null,
    toppings: elegidos.map((t) => {
      if (t.tipo !== 'pieza') return { id: t.id };
      const [a, b] = CUANTAS[t.id] ?? [1, 1];
      return { id: t.id, n: a + Math.floor(azar() * (b - a + 1)) };
    }),
  };
}

// ---------------------------------------------------------------------------------------------- Dibujos
/** Una fresa cortada: cada pedazo se corre un poquito de las líneas de corte (y se ve lo clarito de adentro). */
function fresaCortada(g: G, x: number, y: number, s: number, cortes: Linea[], sep = 7) {
  const n = cortes.length;
  if (!n) return fresa(g, x, y, s);
  for (let k = 0; k < 1 << n; k++) {
    g.save();
    let dx = 0, dy = 0;
    g.beginPath();
    g.rect(x - s * 2, y - s * 2, s * 4, s * 4);
    g.clip();
    cortes.forEach((c, i) => {
      const lado = k & (1 << i) ? 1 : -1;
      // Normal de la línea y el semiplano de este pedazo
      const nx = -Math.sin(c.a), ny = Math.cos(c.a);
      const px = x + nx * c.d * s, py = y + ny * c.d * s;
      const L = s * 4;
      g.beginPath();
      g.moveTo(px - Math.cos(c.a) * L, py - Math.sin(c.a) * L);
      g.lineTo(px + Math.cos(c.a) * L, py + Math.sin(c.a) * L);
      g.lineTo(px + Math.cos(c.a) * L + nx * lado * L, py + Math.sin(c.a) * L + ny * lado * L);
      g.lineTo(px - Math.cos(c.a) * L + nx * lado * L, py - Math.sin(c.a) * L + ny * lado * L);
      g.closePath();
      g.clip();
      dx += nx * lado * sep;
      dy += ny * lado * sep;
    });
    {
      g.translate(dx, dy);
      fresa(g, x, y, s);
      // Lo clarito de adentro, en el borde del corte
      for (const c of cortes) {
        const nx = -Math.sin(c.a), ny = Math.cos(c.a);
        const px = x + nx * c.d * s, py = y + ny * c.d * s;
        g.strokeStyle = 'rgba(255,214,220,0.95)';
        g.lineWidth = s * 0.16;
        g.beginPath();
        g.moveTo(px - Math.cos(c.a) * s, py - Math.sin(c.a) * s);
        g.lineTo(px + Math.cos(c.a) * s, py + Math.sin(c.a) * s);
        g.stroke();
      }
    }
    g.restore();
  }
}

/** El vaso de plástico con las fresas adentro, la crema y (si hay) la superficie de toppings. */
function dibujarVaso(g: G, o: ObraFresas, x: number, yBase: number, esc: number, ahora: number, conRaya = false, guia?: ToppingPedido[]) {
  const t = VASOS[o.vaso ?? 'M'];
  const k = esc * t.esc;
  const h = 190 * k, wA = 160 * k, wB = 112 * k;
  const arriba = yBase - h;
  const forma = () => {
    g.beginPath();
    g.moveTo(x - wA / 2, arriba);
    g.lineTo(x + wA / 2, arriba);
    g.lineTo(x + wB / 2, yBase);
    g.lineTo(x - wB / 2, yBase);
    g.closePath();
  };
  sombra(g, x, yBase + 4, wA * 0.6, 12, 0.28);
  g.save();
  forma();
  g.clip();
  g.fillStyle = 'rgba(255,245,248,0.35)';
  g.fillRect(x - wA, arriba, wA * 2, h);
  // Fresas (en capas desde abajo)
  const pedazos = o.fresas.flatMap((f, i) => {
    const n = Math.max(1, Math.min(4, f.cortes.length + 1));
    const tipo = f.cortes.length >= 3 ? 'lamina' : f.cortes.length === 2 ? 'cuarto' : 'mitad';
    return Array.from({ length: f.cortes.length ? n : 1 }, (_, j) => ({ i, j, tipo: f.cortes.length ? tipo : 'entera' }));
  });
  pedazos.forEach((p, n) => {
    const fila = Math.floor(n / 3), col = n % 3;
    const px = x + (col - 1) * wB * 0.32 + (fila % 2) * 10 * k, py = yBase - 24 * k - fila * 22 * k - (col === 1 ? 6 : 0);
    if (p.tipo === 'entera') fresa(g, px, py, 24 * k, (n % 3) * 0.6 - 0.6);
    else fresaCorte(g, px, py, 24 * k, (n * 1.3) % 2 - 1, p.tipo as 'mitad' | 'cuarto' | 'lamina');
  });
  // Crema (cubre las fresas hasta donde llegue), con sombrita para que se note en el vaso
  if (o.crema > 0 && o.tazon) {
    const col = colorCrema(o.tazon);
    const yl = yBase - h * Math.min(1.05, o.crema);
    const picos = o.tazon.textura > 0.62 ? 7 : 3, alto = o.tazon.textura > 0.62 ? 12 * k : 5 * k;
    const borde = () => {
      g.beginPath();
      g.moveTo(x - wA, yl);
      for (let i = 0; i <= 28; i++) g.lineTo(x - wA + (i / 28) * wA * 2, yl - Math.abs(Math.sin((i / 28) * Math.PI * picos)) * alto);
    };
    g.globalAlpha = 0.95;
    g.fillStyle = lineal(g, 0, yl - alto, 0, yBase, [[0, aclarar(col, 0.5)], [0.35, col], [1, oscurecer(col, 0.12)]]);
    borde();
    g.lineTo(x + wA, yBase);
    g.lineTo(x - wA, yBase);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = oscurecer(col, 0.2);
    g.lineWidth = 2.5;
    borde();
    g.stroke();
  }
  g.restore();
  // Borde del vaso con brillo
  g.strokeStyle = 'rgba(200,120,140,0.55)';
  g.lineWidth = 3;
  forma();
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.fillRect(x - wA * 0.36, arriba + 12, 7 * k, h * 0.7);
  g.fillStyle = '#e2475d';
  rr(g, x - wA / 2 - 4, arriba - 6, wA + 8, 10, 5);
  g.fill();
  if (conRaya) rayita(g, x - wA / 2 - 8, x + wA / 2 + 8, yBase - h * LLENO_VASO);
  // Toppings encima de la crema
  if (o.crema > 0.3) {
    const s = superficieVaso(x, yBase, esc, o);
    if (guia) dibujarGuia(g, guia, TOP, s);
    dibujarSuperficie(g, o.sup, s, TOP, ahora);
  }
}
function superficieVaso(x: number, yBase: number, esc: number, o: ObraFresas): Ovalo {
  const k = esc * VASOS[o.vaso ?? 'M'].esc;
  const h = 190 * k, wA = 160 * k;
  return { x, y: yBase - h * Math.min(1.02, Math.max(0.6, o.crema)) + 4 * k, rx: wA * 0.44, ry: wA * 0.16 };
}
function colorCrema(t: Tazon) {
  let c = t.textura > CORTADA ? '#f6e7b0' : '#fffaf2';
  for (const s of SABORES) if ((t.sabor[s.id] ?? 0) > 0) c = aclarar(s.color, 0.55 - Math.min(0.3, (t.sabor[s.id] - 1) * 0.12));
  return c;
}

// ---------------------------------------------------------------------------------------------- Picar
class EstacionPicar implements Estacion {
  id = 'picar';
  nombre = 'Picar';
  icono = '🔪';
  usaTicket = true;
  private tabla: { cortes: Linea[]; t: number } | null = null;
  private trazo: { x: number; y: number }[] = [];
  private volando: { t: number; cortes: Linea[] } | null = null;
  constructor(private m: Motor) {}

  private get obra(): ObraFresas | null {
    return (this.m.activo?.obra as ObraFresas) ?? null;
  }
  private rVasos(): (Rect & { tam: Tam })[] {
    return (['P', 'M', 'G'] as Tam[]).filter((t) => VASOS[t].desde <= this.m.rango).map((tam, i) => ({ tam, x: 14, y: RIEL + 14 + i * 124, w: 150, h: 114 }));
  }
  private tablaPos() {
    const z = this.m.zona;
    return { x: 180 + (z.w - 180 - 250) / 2, y: RIEL + 250, r: 100 };
  }
  private rCanasta(): Rect {
    return { x: 180, y: this.m.H - BARRA - 140, w: 170, h: 124 };
  }
  private rVasoPos() {
    return { x: this.m.zona.w - 130, y: this.m.H - BARRA - 30 };
  }
  private rAlVaso(): Rect {
    const p = this.tablaPos();
    return { x: p.x - 100, y: this.m.H - BARRA - 100, w: 200, h: 70 };
  }
  private rBotar(): Rect {
    return { x: this.m.zona.w - 200, y: RIEL + 14, w: 150, h: 60 };
  }

  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: RIEL + 150 });
  }
  paso(dt: number) {
    if (this.volando) {
      this.volando.t += dt;
      if (this.volando.t > 0.5) this.volando = null;
    }
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m, obra = this.obra;
    if (tipo === 'bajar') {
      this.trazo = [];
      const rv = this.rVasos().find((r) => dentro(r, x, y));
      if (rv) {
        if (!obra) return m.aviso('Primero toca un pedido del riel de arriba');
        if (obra.fresas.length) return m.aviso('Ese vaso ya tiene fresas: bótalo si quieres otro');
        obra.vaso = rv.tam;
        sonidos.pop();
        m.pistaUnaVez('canasta', 'Toca la canasta para poner una fresa en la tabla');
        return;
      }
      if (dentro(this.rCanasta(), x, y)) {
        if (this.tabla) return m.aviso('Ya hay una fresa en la tabla');
        this.tabla = { cortes: [], t: m.reloj };
        sonidos.pop();
        m.pistaUnaVez('cortar', 'Desliza el dedo sobre la fresa para cortarla como dice el tiquete');
        return;
      }
      if (dentro(this.rAlVaso(), x, y) && this.tabla) return this.alVaso();
      if (dentro(this.rBotar(), x, y) && obra && (obra.vaso || obra.fresas.length)) {
        obra.vaso = null;
        obra.fresas = [];
        sonidos.papel();
        return;
      }
      this.trazo.push({ x, y });
      return;
    }
    if (tipo === 'mover') {
      if (this.trazo.length) this.trazo.push({ x, y });
      return;
    }
    // Soltó: ¿el trazo cruzó la fresa?
    const tr = this.trazo;
    this.trazo = [];
    if (tr.length < 2 || !this.tabla) return;
    const p = this.tablaPos();
    const a = tr[0], b = tr[tr.length - 1];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    if (L < p.r * 1.1) return;
    // La línea del corte: su ángulo (entre 0 y π) y a qué distancia del centro pasa (en radios, sobre su normal)
    const an = ((Math.atan2(b.y - a.y, b.x - a.x) % Math.PI) + Math.PI) % Math.PI;
    const nx = -Math.sin(an), ny = Math.cos(an);
    const d = -((p.x - a.x) * nx + (p.y - a.y) * ny) / p.r;
    if (Math.abs(d) > 0.95 || this.tabla.cortes.length >= 5) return;
    this.tabla.cortes.push({ a: an, d });
    sonidos.corte();
    m.chispas(p.x, p.y, '#ff8a9a', 6, 'gota');
  }

  private alVaso() {
    const m = this.m, obra = this.obra;
    if (!obra) return m.aviso('Primero toca un pedido del riel de arriba');
    if (!obra.vaso) return m.aviso('Primero escoge el vaso (a la izquierda)');
    if (obra.fresas.length >= 8) return m.aviso('El vaso ya está lleno');
    const pd = m.activo!.pedido as PedidoFresas;
    const c = this.tabla!.cortes;
    obra.fresas.push({ cortes: c, valor: valorCortes(c, CORTES[pd.corte].lineas, m.mejora('cuchillo')) });
    this.volando = { t: 0, cortes: c };
    this.tabla = null;
    sonidos.pop();
    if (obra.fresas.length === 1) m.pistaUnaVez('llenar', `Llena el vaso hasta que tenga ${VASOS[obra.vaso].fresas} fresas y luego ve a «Batir»`);
  }

  dibujar(g: G, t: number) {
    const m = this.m, obra = this.obra;
    for (const r of this.rVasos()) {
      const act = obra?.vaso === r.tam;
      boton(g, r, { color: act ? '#ffe2a8' : '#ffffff', activo: act, radio: 14 });
      dibujarVaso(g, { vaso: r.tam, fresas: [], tazon: null, crema: 0, sup: superficieNueva() }, r.x + 52, r.y + r.h - 12, 0.42, t);
      texto(g, VASOS[r.tam].nombre, r.x + 110, r.y + r.h / 2, { tam: 17, color: '#4a2a10', max: 70 });
    }
    // Tabla de picar
    const p = this.tablaPos();
    sombra(g, p.x, p.y + 110, 230, 30, 0.3);
    g.fillStyle = lineal(g, 0, p.y - 150, 0, p.y + 150, [[0, '#e8b77f'], [1, '#c98a50']]);
    rr(g, p.x - 220, p.y - 140, 440, 270, 40);
    g.fill();
    g.strokeStyle = 'rgba(140,80,40,0.25)';
    g.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
      g.beginPath();
      g.moveTo(p.x - 200, p.y + i * 28);
      g.bezierCurveTo(p.x - 60, p.y + i * 28 + 8, p.x + 60, p.y + i * 28 - 8, p.x + 200, p.y + i * 28);
      g.stroke();
    }
    if (this.tabla) {
      const cae = Math.max(0, 1 - (m.reloj - this.tabla.t) / 0.25);
      fresaCortada(g, p.x, p.y - cae * 80, p.r, this.tabla.cortes);
      // Guía del cuchillo afilado: dónde van los cortes
      if (m.mejora('cuchillo') >= 2 && m.activo) {
        g.save();
        g.setLineDash([8, 8]);
        g.strokeStyle = 'rgba(255,255,255,0.7)';
        g.lineWidth = 3;
        for (const c of CORTES[(m.activo.pedido as PedidoFresas).corte].lineas) {
          const nx = -Math.sin(c.a), ny = Math.cos(c.a);
          const px = p.x + nx * c.d * p.r, py = p.y + ny * c.d * p.r;
          g.beginPath();
          g.moveTo(px - Math.cos(c.a) * p.r * 1.3, py - Math.sin(c.a) * p.r * 1.3);
          g.lineTo(px + Math.cos(c.a) * p.r * 1.3, py + Math.sin(c.a) * p.r * 1.3);
          g.stroke();
        }
        g.restore();
      }
      boton(g, this.rAlVaso(), { color: '#ff8fa3' });
      texto(g, 'Al vaso ➜', this.rAlVaso().x + 100, this.rAlVaso().y + 36, { tam: 28, color: '#fff', borde: '#b83a52' });
    } else texto(g, 'Toca la canasta 🧺', p.x, p.y, { tam: 26, color: 'rgba(90,50,20,0.55)' });
    // El trazo del cuchillo
    if (this.trazo.length > 1) {
      g.strokeStyle = 'rgba(255,255,255,0.85)';
      g.lineWidth = 8;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(this.trazo[0].x, this.trazo[0].y);
      for (const q of this.trazo) g.lineTo(q.x, q.y);
      g.stroke();
    }
    // Canasta de fresas
    const c = this.rCanasta();
    g.fillStyle = lineal(g, 0, c.y + 40, 0, c.y + c.h, [[0, '#d99a52'], [1, '#9a6230']]);
    rr(g, c.x, c.y + 40, c.w, c.h - 40, 18);
    g.fill();
    for (let i = 0; i < 7; i++) fresa(g, c.x + 26 + (i % 4) * 38, c.y + 44 - Math.floor(i / 4) * 22, 22, (i % 3) * 0.4 - 0.4);
    g.strokeStyle = '#7a4a22';
    g.lineWidth = 3;
    for (let i = 1; i < 6; i++) {
      g.beginPath();
      g.moveTo(c.x + i * (c.w / 6), c.y + 48);
      g.lineTo(c.x + i * (c.w / 6), c.y + c.h - 6);
      g.stroke();
    }
    // El vaso del pedido
    const v = this.rVasoPos();
    if (obra?.vaso) {
      dibujarVaso(g, obra, v.x, v.y, 1.05, t);
      const need = VASOS[obra.vaso].fresas;
      texto(g, `${obra.fresas.length} / ${need} fresas`, v.x, v.y - 250, { tam: 24, color: obra.fresas.length === need ? '#2f8a3a' : '#5a3a28', borde: '#fff' });
      botonBotar(g, this.rBotar());
    } else if (obra) texto(g, '← Escoge el vaso', v.x, v.y - 100, { tam: 22, color: '#6a5a50' });
    if (this.volando) {
      const k = this.volando.t / 0.5;
      fresaCortada(g, p.x + (v.x - p.x) * k, p.y + (v.y - 120 - p.y) * k - Math.sin(k * Math.PI) * 120, p.r * (1 - k * 0.7), this.volando.cortes, 4);
    }
  }
}

/** Qué tan bien quedaron los cortes contra los que pide (1 perfecto). */
function valorCortes(hechos: Linea[], ideales: Linea[], cuchillo: number) {
  const tol = 1 + cuchillo * 0.35;
  const libres = [...hechos];
  let suma = 0;
  for (const q of ideales) {
    if (!libres.length) continue;
    let mejor = 0, costo = Infinity;
    libres.forEach((h, i) => {
      let da = Math.abs(h.a - q.a) % Math.PI;
      da = Math.min(da, Math.PI - da);
      // Una línea con el ángulo al revés tiene la distancia con el signo cambiado
      const mismo = Math.abs(h.a - q.a) < Math.PI / 2 ? 1 : -1;
      const c = da / 0.45 + Math.abs(h.d * mismo - q.d) / 0.3;
      if (c < costo) {
        costo = c;
        mejor = i;
      }
    });
    libres.splice(mejor, 1);
    suma += Math.max(0, 1 - (costo * 0.5) / tol);
  }
  return Math.max(0, suma / ideales.length - libres.length * 0.3);
}

// ---------------------------------------------------------------------------------------------- Batir
class EstacionBatir implements Estacion {
  id = 'batir';
  nombre = 'Batir';
  icono = '🥣';
  usaTicket = true;
  tazones: (Tazon | null)[];
  private elegido = 0;
  private vertiendo = false;
  private sonando = 0;
  constructor(private m: Motor) {
    this.tazones = Array.from({ length: 1 + m.mejora('batidoras') }, () => null);
  }

  private herramientas(): (Rect & { id: string; nombre: string })[] {
    const l = [{ id: 'crema', nombre: 'Crema de leche' }, { id: 'condensada', nombre: 'Leche condensada' }, ...SABORES.filter((s) => s.desde <= this.m.rango).map((s) => ({ id: s.id, nombre: s.nombre }))];
    return l.map((h, i) => ({ ...h, x: 14, y: RIEL + 14 + i * 104, w: 200, h: 96 }));
  }
  private rTazon(i: number) {
    const x0 = 240, x1 = this.m.zona.w - 10;
    const w = (x1 - x0) / this.tazones.length;
    const cx = x0 + w * (i + 0.5);
    return { cx, cy: RIEL + 250, caja: { x: cx - w / 2 + 8, y: RIEL + 60, w: w - 16, h: 290 }, boton: { x: cx - 90, y: this.m.H - BARRA - 96, w: 180, h: 70 } };
  }
  private vel() {
    return (1 / 16) * (1 + 0.25 * this.m.mejora('turbo'));
  }
  alerta() {
    return this.tazones.some((t) => t?.batiendo && t.textura > 0.85);
  }

  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: RIEL + 330 });
  }

  paso(dt: number) {
    const m = this.m;
    let motor = false;
    // Los tazones de pedidos ya entregados quedan libres
    this.tazones.forEach((t, i) => {
      if (t && !m.tickets.some((k) => k.id === t.ticket)) this.tazones[i] = null;
    });
    this.tazones.forEach((t) => {
      if (!t || !t.batiendo) return;
      motor = true;
      const antes = t.textura;
      t.textura = Math.min(1.1, t.textura + this.vel() * dt * (t.nivel > 0.05 ? 1 : 0));
      if (m.mejora('alarma'))
        for (const meta of Object.values(PUNTO_CREMA))
          if (antes < meta && t.textura >= meta) {
            sonidos.alarma();
            t.avisado = m.reloj;
          }
      if (antes < CORTADA && t.textura >= CORTADA) {
        sonidos.quemado();
        m.chef('susto', 2);
        m.aviso(m.actual === 2 ? '¡Uy! La crema se está cortando' : '¡Se está cortando una crema en «Batir»!');
      }
    });
    const t = this.tazones[this.elegido];
    if (this.vertiendo && t) {
      t.nivel = Math.min(1.1, t.nivel + dt * 0.42);
      this.sonando -= dt;
      if (this.sonando <= 0) {
        sonidos.vertir(0.3);
        this.sonando = 0.28;
      }
    }
    if (motor && m.actual === 2) {
      this.sonando -= dt;
      if (this.sonando <= 0) {
        sonidos.motor(520);
        this.sonando = 0.4;
      }
    }
  }

  /** El tazón del pedido escogido (o uno libre para él). */
  private tazonDe(ticket: number) {
    return this.tazones.findIndex((t) => t?.ticket === ticket);
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m;
    if (tipo === 'subir') {
      this.vertiendo = false;
      return;
    }
    if (tipo !== 'bajar') return;
    for (let i = 0; i < this.tazones.length; i++) {
      const r = this.rTazon(i);
      if (dentro(r.boton, x, y)) {
        const t = this.tazones[i];
        if (!t) return m.aviso('Ese tazón está vacío');
        t.batiendo = !t.batiendo;
        sonidos.clic();
        if (t.batiendo) m.pistaUnaVez('punto', 'Para la batidora cuando la flecha esté en el punto que pide (suave o firme)');
        return;
      }
      if (dentro(r.caja, x, y)) {
        this.elegido = i;
        const t = this.tazones[i];
        if (!t && m.activo) {
          const ya = this.tazonDe(m.activo.id);
          if (ya >= 0) {
            this.elegido = ya;
            return m.aviso(`El pedido #${m.activo.numero} ya tiene su tazón`);
          }
          this.tazones[i] = { ticket: m.activo.id, nivel: 0, dulce: 0, sabor: {}, textura: 0, batiendo: false, avisado: 0 };
          (m.activo.obra as ObraFresas).tazon = this.tazones[i];
          sonidos.pop();
          m.pistaUnaVez('crema', 'Mantén «Crema de leche» hasta la rayita y agrega las cucharadas de leche condensada');
        } else if (t) {
          const tk = m.tickets.find((x) => x.id === t.ticket);
          if (tk) m.activo = tk;
        }
        sonidos.clic();
        return;
      }
    }
    const h = this.herramientas().find((r) => dentro(r, x, y));
    if (h) {
      let t = this.tazones[this.elegido];
      // Si el tazón escogido es de otro pedido, se usa el del pedido activo
      if (m.activo && t?.ticket !== m.activo.id) {
        const i = this.tazonDe(m.activo.id);
        if (i >= 0) {
          this.elegido = i;
          t = this.tazones[i];
        }
      }
      if (!t) return m.aviso('Toca un tazón vacío para el pedido');
      if (t.batiendo || t.textura > 0.05) return m.aviso('Ya se está batiendo: bota el tazón para empezar otra vez');
      if (h.id === 'crema') this.vertiendo = true;
      else if (h.id === 'condensada') {
        t.dulce++;
        sonidos.pop();
        m.flotar(`🥄 ${t.dulce}`, this.rTazon(this.elegido).cx, RIEL + 120, '#fff4c9');
      } else {
        t.sabor[h.id] = (t.sabor[h.id] ?? 0) + 1;
        sonidos.pop();
      }
      return;
    }
    if (dentro(this.rBotarTazon(), x, y)) {
      const t = this.tazones[this.elegido];
      if (!t) return;
      const tk = m.tickets.find((k) => k.id === t.ticket);
      if (tk) (tk.obra as ObraFresas).tazon = null;
      this.tazones[this.elegido] = null;
      sonidos.papel();
    }
  }
  private rBotarTazon(): Rect {
    return { x: 14, y: this.m.H - BARRA - 84, w: 200, h: 64 };
  }

  dibujar(g: G, tiempo: number) {
    const m = this.m;
    for (const h of this.herramientas()) {
      const act = h.id === 'crema' && this.vertiendo;
      boton(g, h, { color: act ? '#ffe2a8' : '#ffffff', hundido: act, radio: 14 });
      const cx = h.x + 44, cy = h.y + h.h / 2;
      if (h.id === 'crema') {
        g.fillStyle = lineal(g, cx - 22, 0, cx + 22, 0, [[0, '#e8f2ff'], [1, '#bcd4f2']]);
        rr(g, cx - 22, cy - 34, 44, 64, 6);
        g.fill();
        g.fillStyle = '#4f86c6';
        g.fillRect(cx - 22, cy - 6, 44, 14);
      } else if (h.id === 'condensada') {
        g.fillStyle = lineal(g, cx - 24, 0, cx + 24, 0, [[0, '#d7dde0'], [0.5, '#ffffff'], [1, '#b9c0c4']]);
        rr(g, cx - 24, cy - 26, 48, 54, 8);
        g.fill();
        g.fillStyle = '#e2475d';
        g.fillRect(cx - 24, cy - 10, 48, 20);
      } else {
        const s = SABORES.find((q) => q.id === h.id)!;
        g.fillStyle = 'rgba(240,230,210,0.9)';
        rr(g, cx - 24, cy - 28, 48, 58, 10);
        g.fill();
        g.fillStyle = s.color;
        rr(g, cx - 20, cy - 8, 40, 34, 8);
        g.fill();
      }
      texto(g, h.nombre, h.x + 144, cy, { tam: 17, color: '#4a2a10', max: 100 });
    }
    this.tazones.forEach((t, i) => {
      const r = this.rTazon(i);
      const sel = i === this.elegido;
      if (sel && this.tazones.length > 1) {
        g.strokeStyle = conAlfa('#ffb627', 0.8);
        g.lineWidth = 5;
        g.setLineDash([14, 10]);
        rr(g, r.caja.x, r.caja.y, r.caja.w, r.caja.h, 20);
        g.stroke();
        g.setLineDash([]);
      }
      this.dibujarTazon(g, t, r.cx, r.cy, tiempo);
      if (t) {
        const tk = m.tickets.find((k) => k.id === t.ticket);
        texto(g, tk ? `Pedido #${tk.numero}` : '—', r.cx, r.cy + 140, { tam: 22, color: '#8a4a2a', borde: '#fff' });
        const tkp = tk?.pedido as PedidoFresas | undefined;
        medidor(g, r.cx + 120, r.cy - 140, 26, 220, t.textura, [
          { desde: 0.4, hasta: 0.6, color: '#bfe8c0', etiqueta: tkp?.punto === 'suave' ? 'Suave ★' : 'Suave' },
          { desde: 0.64, hasta: 0.84, color: '#8fd49a', etiqueta: tkp?.punto === 'firme' ? 'Firme ★' : 'Firme' },
          { desde: CORTADA, hasta: 1, color: '#f2a0a0' },
        ], m.mejora('alarma') && m.reloj - t.avisado < 1.2 ? m.reloj : undefined);
        boton(g, r.boton, { color: t.batiendo ? '#e8434f' : '#5cc26a', hundido: t.batiendo });
        texto(g, t.batiendo ? '■ Parar' : '▶ Batir', r.boton.x + 90, r.boton.y + 36 + (t.batiendo ? 4 : 0), { tam: 26, color: '#fff' });
        texto(g, `Cucharadas: ${t.dulce}${Object.entries(t.sabor).map(([k, v]) => ` · ${k === 'arequipe' ? 'arequipe' : 'chocolate'} ${v}`).join('')}`, r.cx, r.cy + 110, { tam: 20, color: '#5a3a28', borde: '#fff' });
      } else texto(g, m.activo ? `Toca para el #${m.activo.numero}` : 'Libre', r.cx, r.cy + 110, { tam: 20, color: '#6a5a50', borde: '#fff' });
    });
    boton(g, this.rBotarTazon(), { color: '#f0e4d8' });
    texto(g, '🗑 Botar tazón', 114, this.rBotarTazon().y + 34, { tam: 20, color: '#7a4a3a' });
  }

  private dibujarTazon(g: G, t: Tazon | null, x: number, y: number, tiempo: number) {
    sombra(g, x, y + 70, 150, 26, 0.3);
    // Tazón de acero
    g.fillStyle = lineal(g, x - 130, 0, x + 130, 0, [[0, '#8f989d'], [0.35, '#eef2f4'], [0.6, '#c3cacd'], [1, '#7d868b']]);
    g.beginPath();
    g.moveTo(x - 130, y - 40);
    g.bezierCurveTo(x - 124, y + 70, x + 124, y + 70, x + 130, y - 40);
    g.closePath();
    g.fill();
    g.fillStyle = '#5e666b';
    elipse(g, x, y - 40, 130, 26);
    g.fill();
    if (t && t.nivel > 0) {
      const col = colorCrema(t);
      const nv = Math.min(1, t.nivel);
      const ry = 22 * nv + 2;
      g.fillStyle = radial(g, x - 30, y - 45, 5, 120, [[0, aclarar(col, 0.4)], [1, oscurecer(col, 0.06)]]);
      elipse(g, x, y - 36 + (1 - nv) * 30, 124 * (0.75 + 0.25 * nv), ry);
      g.fill();
      // Picos de crema (más con más textura) y un aro que gira si bate
      const picos = Math.floor(Math.min(1, t.textura) * 10);
      for (let i = 0; i < picos; i++) {
        const a = i * 2.4 + (t.batiendo ? tiempo * 4 : 0);
        const px = x + Math.cos(a) * 70 * ((i % 3) / 3 + 0.3), py = y - 38 + (1 - nv) * 30 + Math.sin(a) * 12;
        g.fillStyle = aclarar(col, 0.25);
        g.beginPath();
        g.moveTo(px - 12, py + 4);
        g.quadraticCurveTo(px, py - 12 - t.textura * 16, px + 12, py + 4);
        g.fill();
      }
      if (t.textura > CORTADA) {
        g.fillStyle = '#f2d77a';
        for (let i = 0; i < 6; i++) {
          elipse(g, x + Math.cos(i * 1.7) * 60, y - 36 + Math.sin(i * 1.7) * 10, 10, 6);
          g.fill();
        }
      }
    }
    rayita(g, x - 110, x + 110, y - 36 + (1 - NIVEL_TAZON) * 30 - 22 * NIVEL_TAZON * 0.2);
    // La batidora encima
    const vib = t?.batiendo ? Math.sin(tiempo * 60) * 2 : 0;
    g.fillStyle = lineal(g, x - 60, 0, x + 60, 0, [[0, '#ffb3c2'], [1, '#e2475d']]);
    rr(g, x - 60 + vib, y - 190, 120, 60, 26);
    g.fill();
    g.fillStyle = '#fff';
    rr(g, x - 40 + vib, y - 176, 30, 12, 6);
    g.fill();
    g.strokeStyle = '#c9d0d4';
    g.lineWidth = 6;
    for (const dx of [-22, 22]) {
      const giro = t?.batiendo ? Math.sin(tiempo * 30 + dx) * 10 : 0;
      g.beginPath();
      g.moveTo(x + dx + vib, y - 132);
      g.lineTo(x + dx + vib, y - 60);
      g.stroke();
      g.beginPath();
      g.ellipse(x + dx + vib, y - 56, 14 + giro * 0.3, 22, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
}

// ---------------------------------------------------------------------------------------------- Servir
class EstacionServir implements Estacion {
  id = 'servir';
  nombre = 'Servir';
  icono = '🍓';
  usaTicket = true;
  private herramienta: string | null = null;
  private aplicador = new Aplicador(TOP);
  private aplicando = false;
  private echando = false;
  private sonando = 0;
  private confirmar = 0;
  constructor(private m: Motor) {}

  private get obra(): ObraFresas | null {
    return (this.m.activo?.obra as ObraFresas) ?? null;
  }
  private botones() {
    return botonesToppings(TOPS, this.m.rango, 14, RIEL + 14);
  }
  private pos() {
    return { x: 300 + (this.m.zona.w - 300) / 2, y: this.m.H - BARRA - 40 };
  }
  private rCrema(): Rect {
    const p = this.pos();
    return { x: p.x - 330, y: RIEL + 60, w: 170, h: 120 };
  }
  private rEntregar(): Rect {
    const p = this.pos();
    return { x: p.x + 150, y: this.m.H - BARRA - 90, w: 190, h: 66 };
  }
  private rBotar(): Rect {
    const p = this.pos();
    return { x: p.x + 150, y: this.m.H - BARRA - 170, w: 190, h: 60 };
  }
  private superficie(): Ovalo | null {
    const o = this.obra;
    if (!o || o.crema <= 0.3) return null;
    const p = this.pos();
    return superficieVaso(p.x, p.y, 1.45, o);
  }

  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: RIEL + 300 });
  }

  paso(dt: number) {
    const o = this.obra;
    if (!this.echando || !o?.tazon) return;
    if (o.tazon.nivel <= 0) {
      this.echando = false;
      return this.m.aviso('Se acabó la crema del tazón');
    }
    o.crema = Math.min(1.1, o.crema + dt * 0.32);
    o.tazon.nivel = Math.max(0, o.tazon.nivel - dt * 0.2);
    this.sonando -= dt;
    if (this.sonando <= 0) {
      sonidos.vertir(0.3);
      this.sonando = 0.3;
    }
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
      this.echando = false;
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
    if (dentro(this.rCrema(), x, y)) {
      if (!o.vaso || !o.fresas.length) return m.aviso('Primero pica las fresas en «Picar»');
      if (!o.tazon || o.tazon.nivel <= 0.02) return m.aviso('Primero bate la crema en «Batir»');
      if (o.sup.capas.length) return m.aviso('Ya decoraste: la crema va antes que los toppings');
      this.echando = true;
      return;
    }
    if (dentro(this.rEntregar(), x, y)) {
      if (!o.fresas.length && o.crema <= 0) return m.aviso('El vaso está vacío');
      if (o.crema < 0.3 && m.reloj - this.confirmar > 3) {
        this.confirmar = m.reloj;
        return m.aviso('¡Le falta la crema! Toca «Entregar» otra vez para mandarlo así');
      }
      this.herramienta = null;
      m.entregar(m.activo!);
      return;
    }
    if (dentro(this.rBotar(), x, y)) {
      o.crema = 0;
      o.sup = superficieNueva();
      sonidos.papel();
      return;
    }
    const s = this.superficie();
    if (this.herramienta) {
      if (!s) return m.aviso('Primero échale la crema');
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
    // Manga con la crema del tazón
    const c = this.rCrema();
    boton(g, c, { color: this.echando ? '#ffe2a8' : '#ffffff', hundido: this.echando, radio: 18 });
    g.fillStyle = o.tazon ? colorCrema(o.tazon) : '#eee';
    g.beginPath();
    g.moveTo(c.x + 40, c.y + 20);
    g.lineTo(c.x + 130, c.y + 20);
    g.lineTo(c.x + 90, c.y + 86);
    g.lineTo(c.x + 80, c.y + 86);
    g.closePath();
    g.fill();
    g.strokeStyle = '#d9c7b8';
    g.lineWidth = 3;
    g.stroke();
    texto(g, 'Echar crema', c.x + c.w / 2, c.y + c.h - 16, { tam: 18, color: '#4a2a10' });
    if (this.echando && o.tazon) {
      const s = superficieVaso(p.x, p.y, 1.45, o);
      g.strokeStyle = colorCrema(o.tazon);
      g.lineWidth = 16;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(c.x + 85, c.y + 90);
      g.quadraticCurveTo(p.x, c.y + 100, p.x, s.y - 10);
      g.stroke();
    }
    if (o.vaso) dibujarVaso(g, o, p.x, p.y, 1.45, t, o.crema < 1.1 && !o.sup.capas.length, m.mejora('guia') ? (m.activo!.pedido as PedidoFresas).toppings : undefined);
    else texto(g, 'Este pedido no tiene vaso: ve a «Picar»', p.x, p.y - 180, { tam: 24, color: '#9a8a80' });
    botonEntregar(g, this.rEntregar());
    botonBotar(g, this.rBotar());
    if (this.herramienta) {
      const d = TOP[this.herramienta];
      texto(g, `En la mano: ${d.nombre}`, p.x, RIEL + 26, { tam: 20, color: '#fff', borde: 'rgba(40,30,25,0.8)' });
    }
  }
}

// ---------------------------------------------------------------------------------------------- Tiquete y calificación
function iconoCorte(g: G, x: number, y: number, c: Corte) {
  fresaCortada(g, x, y, 20, CORTES[c].lineas, 2.5);
}
function dibujarTicket(g: G, p: PedidoFresas, r: Rect) {
  let y = r.y + 16;
  dibujarVaso(g, { vaso: p.vaso, fresas: [], tazon: null, crema: 0, sup: superficieNueva() }, r.x + 36, y + 50, 0.26, 0);
  texto(g, `Vaso ${VASOS[p.vaso].nombre.toLowerCase()}`, r.x + 66, y + 18, { tam: 18, color: '#3b2a22', alinear: 'left', max: r.w - 76 });
  texto(g, `${VASOS[p.vaso].fresas} fresas`, r.x + 66, y + 40, { tam: 15, color: '#8a6a58', alinear: 'left', peso: 700 });
  y += 62;
  iconoCorte(g, r.x + 36, y + 18, p.corte);
  texto(g, CORTES[p.corte].nombre, r.x + 66, y + 18, { tam: 18, color: '#3b2a22', alinear: 'left', max: r.w - 76 });
  y += 46;
  g.fillStyle = p.sabor ? aclarar(SABORES.find((s) => s.id === p.sabor)!.color, 0.5) : '#fffaf2';
  elipse(g, r.x + 36, y + 20, 22, 12);
  g.fill();
  g.strokeStyle = '#c3cacd';
  g.lineWidth = 3;
  g.stroke();
  texto(g, `Crema ${p.punto}${p.sabor ? ` de ${p.sabor}` : ''}`, r.x + 66, y + 12, { tam: 17, color: '#3b2a22', alinear: 'left', max: r.w - 76 });
  texto(g, `🥄 ${p.dulce} de leche condensada`, r.x + 66, y + 34, { tam: 14, color: '#8a6a58', alinear: 'left', peso: 700, max: r.w - 76 });
  y += 54;
  separador(g, r.x + 14, r.x + r.w - 14, y);
  y += 6;
  for (const t of p.toppings) {
    filaTopping(g, t, TOP[t.id], r.x, r.w, y);
    y += 46;
  }
}

function calificar(t: Ticket<PedidoFresas, ObraFresas>): Categoria[] {
  const p = t.pedido, o = t.obra;
  // Picar: el vaso, cuántas fresas y qué tan bien cortadas
  const need = VASOS[p.vaso].fresas;
  const cortes = o.fresas.length ? o.fresas.reduce((a, f) => a + f.valor, 0) / o.fresas.length : 0;
  const picar = o.vaso ? Math.round((puntajeCuenta(o.fresas.length, need) * 0.4 + cortes * 100 * 0.6) * (o.vaso === p.vaso ? 1 : 0.6)) : 0;
  // Batido: cantidad, dulce, sabor y el punto
  const tz = o.tazon;
  let batido = 0;
  if (tz) {
    const sabor = p.sabor ? puntajeCuenta(tz.sabor[p.sabor] ?? 0, 1) : Object.keys(tz.sabor).length ? 30 : 100;
    const punto = tz.textura > CORTADA ? 0 : puntajeZona(tz.textura, PUNTO_CREMA[p.punto]);
    const nivelAntes = Math.min(1.1, tz.nivel + o.crema * 0.2 / 0.32);
    batido = Math.round(puntajeNivel(nivelAntes, NIVEL_TAZON, 0.08) * 0.2 + puntajeCuenta(tz.dulce, p.dulce) * 0.25 + sabor * 0.15 + punto * 0.4);
  }
  const decorado = o.crema > 0.3 ? Math.round(puntajeNivel(o.crema, LLENO_VASO, 0.05) * 0.3 + calificarToppings(o.sup, p.toppings, TOP).valor * 0.7) : 0;
  return [
    { id: 'picar', nombre: 'Picado', valor: picar },
    { id: 'batido', nombre: 'Batido', valor: batido },
    { id: 'decorado', nombre: 'Decorado', valor: decorado },
  ];
}

const MEJORAS: Mejora[] = [
  { id: 'batidoras', nombre: 'Otra batidora', icono: '🥣', niveles: ['Un segundo tazón con batidora', 'Un tercer tazón con batidora'], precios: [45, 110] },
  { id: 'turbo', nombre: 'Batidora turbo', icono: '⚡', niveles: ['Bate 25 % más rápido', 'Bate 50 % más rápido'], precios: [35, 90] },
  { id: 'alarma', nombre: 'Alarma de punto', icono: '⏰', niveles: ['Suena cuando la crema llega a suave y a firme'], precios: [25] },
  { id: 'cuchillo', nombre: 'Cuchillo de chef', icono: '🔪', niveles: ['Corta más derechito (perdona más)', 'Además muestra por dónde cortar'], precios: [30, 75] },
  { id: 'guia', nombre: 'Guía de emplatado', icono: '📐', niveles: ['Marquitas en la crema de dónde va cada pieza'], precios: [40] },
  { id: 'musica', nombre: 'Parlante con música', icono: '🎶', niveles: ['Los invitados esperan 15 % más contentos', '30 % más contentos'], precios: [30, 80] },
  { id: 'jarra', nombre: 'Frasco de propinas bonito', icono: '🫙', niveles: ['12 % más propina', '24 % más propina', '36 % más propina'], precios: [25, 60, 120] },
];

const DESBLOQUEOS: Desbloqueo[] = [
  { rango: 2, texto: 'Ahora piden fresas en cuartos, crema firme y vaso grande' },
  { rango: 3, texto: 'Ahora piden fresas en láminas y más dulce' },
  ...SABORES.map((s) => ({ rango: s.desde, texto: `Crema de ${s.nombre.toLowerCase()}` })),
  ...TOPS.filter((x) => x.desde > 1).map((x) => ({ rango: x.desde, texto: `Topping nuevo: ${x.nombre}` })),
];

export const FRESAS = {
  id: 'fresas',
  nombre: 'Fresería',
  titulo: (rol) => `La Fresería de ${rol === 'el' ? 'Él' : 'Ella'}`,
  plato: 'fresas_chef',
  nombrePlato: 'Fresas con crema de chef',
  tema: { pared: '#f8c9d2', acento: '#e2475d', piso: '#f5e1e3' },
  mejoras: MEJORAS,
  desbloqueos: DESBLOQUEOS,
  crearEstaciones(m) {
    return [new EstacionPicar(m), new EstacionBatir(m), new EstacionServir(m)];
  },
  pedido,
  obraNueva: () => ({ vaso: null, fresas: [], tazon: null, crema: 0, sup: superficieNueva() }),
  tiempoIdeal: (p) => 24 + VASOS[p.vaso].fresas * CORTES[p.corte].lineas.length * 2.5 + 14 + p.toppings.length * 5,
  dibujarTicket: (g, p, r) => dibujarTicket(g, p, r),
  calificar,
  dibujarPlato(g, t, x, y, esc, m) {
    if (t.obra.vaso) dibujarVaso(g, t.obra, x, y + 150 * esc, 1.2 * esc, m.reloj + 99);
  },
  /** Para las pruebas automáticas. */
  pruebas: { TOP, CORTES, VASOS, superficieVaso, PUNTO_CREMA },
} as Receta<PedidoFresas, ObraFresas> & { pruebas: unknown };
