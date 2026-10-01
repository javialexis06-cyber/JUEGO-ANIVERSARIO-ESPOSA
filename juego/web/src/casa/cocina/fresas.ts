// La fresería (fresas con crema a la colombiana, estilo Papa's Freezeria/Cupcakeria): en «Picar» se escoge el vaso
// y se cortan las fresas deslizando el cuchillo (en mitades, cuartos o láminas, bien por el centro); en «Batir» se
// echa la crema de leche hasta la rayita, la leche condensada a cucharadas y se bate hasta el punto (suave o firme,
// sin que se corte); en «Servir» se baña con la crema y se decora: queso rallado, leche condensada, arequipe…
// En pareja las batidoras son de los dos; cada uno tiene su tabla de picar.
import { aclarar, dentro, elipse, fresa, G, lineal, mezclar, oscurecer, Rect, rr, sombra, texto } from './dibujo';
import {
  Aplicador, aUV, botonBotar, botonEntregar, botonesToppings, calificarToppings, dibujarBotonesToppings, dibujarEnMano, dibujarGuia, dibujarSuperficie,
  filaTopping, letra, medidor, Ovalo, puntajeCuenta, puntajeNivel, puntajeZona, rayita, separador, Superficie, superficieNueva, ToppingDef, ToppingPedido,
} from './herramientas';
import type { Invitado } from './invitados';
import { BARRA, Categoria, Estacion, Motor, Receta, RIEL, sonidos, Ticket } from './motor';
import { fondoEstacion } from './pantallas';
import { hay, punto, recorte, spr } from './sprites';
import type { Desbloqueo, Mejora } from './tipos';
import { caminoInterior, chorro, GeoVaso, geoVaso, radioEn, yEn, zNivel } from './vasos';

// ---------------------------------------------------------------------------------------------- Ingredientes
type Tam = 'P' | 'M' | 'G';
const VASOS: Record<Tam, { nombre: string; fresas: number; desde: number; rb: number; rt: number; alto: number }> = {
  P: { nombre: 'Pequeño', fresas: 3, desde: 1, rb: 0.03, rt: 0.042, alto: 0.085 },
  M: { nombre: 'Mediano', fresas: 4, desde: 1, rb: 0.034, rt: 0.048, alto: 0.1 },
  G: { nombre: 'Grande', fresas: 5, desde: 2, rb: 0.038, rt: 0.054, alto: 0.115 },
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

function pedido(rango: number, _dia: number, azar: () => number, inv?: Invitado): PedidoFresas {
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
  // La pareja las pide gigantes (como las de Amor y Amistad)
  const pareja = inv?.especial === 'pareja';
  return {
    vaso: pareja ? vasos[vasos.length - 1] : tomar(vasos),
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

// ---------------------------------------------------------------------------------------------- La fresa en la tabla
/** Pulpa vista por el corte: borde rojo, carne rosada y el corazón blanco (una franjita a lo largo del corte). */
function caraCorte(g: G, x0: number, y0: number, x1: number, y1: number, ancho: number) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const gr = g.createLinearGradient(x0 + nx * ancho, y0 + ny * ancho, x0 - nx * ancho, y0 - ny * ancho);
  gr.addColorStop(0, '#c8102e');
  gr.addColorStop(0.25, '#f06a78');
  gr.addColorStop(0.5, '#fff0ee');
  gr.addColorStop(0.75, '#f06a78');
  gr.addColorStop(1, '#c8102e');
  g.strokeStyle = gr;
  g.lineWidth = ancho * 2;
  g.lineCap = 'butt';
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
}

/** Una fresa (vista desde arriba en la tabla) cortada: cada pedazo se corre de las líneas de corte y deja ver la pulpa. */
function fresaCortada(g: G, x: number, y: number, s: number, cortes: Linea[], sep = 7) {
  const dibujarFresa = () => {
    if (!spr(g, 'fresa_grande', x, y, s)) fresa(g, x, y, s);
  };
  const n = cortes.length;
  if (!n) return dibujarFresa();
  for (let k = 0; k < 1 << n; k++) {
    g.save();
    let dx = 0, dy = 0;
    cortes.forEach((c, i) => {
      const lado = k & (1 << i) ? 1 : -1;
      const nx = -Math.sin(c.a), ny = Math.cos(c.a);
      const px = x + nx * c.d * s, py = y + ny * c.d * s;
      const L = s * 5;
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
    g.translate(dx, dy);
    dibujarFresa();
    // La pulpa por donde se cortó (recortada al cuerpo de la fresa)
    g.save();
    g.beginPath();
    g.ellipse(x - s * 0.05, y + s * 0.05, s * 1.25, s * 0.82, -0.25, 0, Math.PI * 2);
    g.clip();
    for (const c of cortes) {
      const nx = -Math.sin(c.a), ny = Math.cos(c.a);
      const px = x + nx * c.d * s, py = y + ny * c.d * s;
      caraCorte(g, px - Math.cos(c.a) * s * 1.4, py - Math.sin(c.a) * s * 1.4, px + Math.cos(c.a) * s * 1.4, py + Math.sin(c.a) * s * 1.4, s * 0.09);
    }
    g.restore();
    g.restore();
  }
}

// ---------------------------------------------------------------------------------------------- El vaso con las fresas y la crema
const ID_VASO = (t: Tam) => `vasofresa_${t}`;
const geoDe = (t: Tam, x: number, y: number, tam: number) => geoVaso(ID_VASO(t), x, y, tam, { ...VASOS[t], fondo: 0.002, elev: 20 });

/** Los pedazos de fresa en capas adentro del vaso (vistos por el plástico). */
function fresasEnVaso(g: G, v: GeoVaso, o: ObraFresas) {
  const pedazos: { tipo: string; i: number }[] = [];
  o.fresas.forEach((f, i) => {
    const n = f.cortes.length;
    const tipo = n >= 3 ? 'lamina' : n === 2 ? 'cuarto' : n === 1 ? 'mitad' : 'entera';
    const cuantos = n ? Math.min(4, n + 1) : 1;
    for (let j = 0; j < cuantos; j++) pedazos.push({ tipo, i: i * 7 + j });
  });
  const porFila = 3;
  const tam = v.rb * v.k * 0.62;
  pedazos.forEach((p, n) => {
    const fila = Math.floor(n / porFila), col = n % porFila;
    const z = v.fondo + 0.008 + fila * 0.0085;
    if (z > v.alto * 0.95) return;
    const r = radioEn(v, z);
    const ang = (col / (porFila - 1) - 0.5) * 1.6 + (fila % 2) * 0.35;
    const px = v.x + Math.sin(ang) * r * 0.62;
    const py = yEn(v, z) + Math.cos(ang) * r * v.se * 0.4;
    const id = `vfresa_${p.tipo}`;
    if (!spr(g, id, px, py, tam, { rot: Math.sin(p.i * 1.7) * 0.5, espejo: p.i % 2 === 1 })) fresa(g, px, py, tam * 0.9);
  });
}

function colorCrema(t: Tazon) {
  let c = t.textura > CORTADA ? '#f3e2a6' : '#fffaf2';
  for (const s of SABORES) if ((t.sabor[s.id] ?? 0) > 0) c = aclarar(s.color, 0.55 - Math.min(0.3, (t.sabor[s.id] - 1) * 0.12));
  return c;
}

/** La crema adentro del vaso: cubre las fresas hasta donde llegue, con picos y brillos arriba. */
function cremaEnVaso(g: G, v: GeoVaso, nivel: number, t: Tazon) {
  const col = colorCrema(t);
  const zl = zNivel(v, Math.min(1.08, nivel));
  g.save();
  caminoInterior(g, v, v.fondo + 0.003, zl);
  g.globalAlpha = 0.93;
  g.fillStyle = lineal(g, 0, yEn(v, zl), 0, yEn(v, v.fondo), [[0, aclarar(col, 0.4)], [0.4, col], [1, oscurecer(col, 0.1)]]);
  g.fill();
  g.restore();
  // Superficie con picos (más con más textura)
  const r = radioEn(v, zl);
  const y = yEn(v, zl);
  const firme = t.textura > 0.62;
  g.fillStyle = aclarar(col, 0.25);
  g.beginPath();
  g.ellipse(v.x, y, r, r * v.se, 0, 0, Math.PI * 2);
  g.fill();
  const picos = firme ? 9 : 5;
  for (let i = 0; i < picos; i++) {
    const a = i * 2.39 + 0.5, d = Math.sqrt((i + 0.5) / picos) * 0.8;
    const px = v.x + Math.cos(a) * r * d, py = y + Math.sin(a) * r * v.se * d;
    const h = (firme ? 13 : 6) * (v.k / 2200);
    g.fillStyle = aclarar(col, 0.4);
    g.beginPath();
    g.moveTo(px - h * 1.1, py + 2);
    g.quadraticCurveTo(px - h * 0.2, py - h * 0.6, px + h * 0.15, py - h * 1.3);
    g.quadraticCurveTo(px + h * 0.25, py - h * 0.4, px + h * 1.1, py + 2);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    elipse(g, px - h * 0.15, py - h * 0.55, h * 0.18, h * 0.3);
    g.fill();
  }
  if (t.textura > CORTADA) {
    g.fillStyle = 'rgba(230,200,110,0.65)';
    for (let i = 0; i < 6; i++) {
      elipse(g, v.x + Math.cos(i * 1.7) * r * 0.6, y + Math.sin(i * 1.7) * r * v.se * 0.6, r * 0.12, r * v.se * 0.12);
      g.fill();
    }
  }
}

/** El vaso de plástico con las fresas, la crema y (si hay) los toppings encima. */
function dibujarVaso(g: G, o: ObraFresas, x: number, yBase: number, tam: number, ahora: number, conRaya = false, guia?: ToppingPedido[]) {
  const tv = o.vaso ?? 'M';
  const v = geoDe(tv, x, yBase, tam);
  sombra(g, x, yBase + 2, v.rt * v.k * 1.05, 10, 0.25);
  g.save();
  caminoInterior(g, v, v.fondo, v.alto);
  g.clip();
  fresasEnVaso(g, v, o);
  g.restore();
  if (o.crema > 0 && o.tazon) cremaEnVaso(g, v, o.crema, o.tazon);
  if (!spr(g, ID_VASO(tv), x, yBase, tam)) {
    g.strokeStyle = 'rgba(200,120,140,0.6)';
    g.lineWidth = 3;
    caminoInterior(g, v, 0, v.alto, 0);
    g.stroke();
  }
  if (conRaya) {
    const z = zNivel(v, LLENO_VASO), r = radioEn(v, z);
    rayita(g, x - r - 8, x + r + 8, yEn(v, z));
  }
  if (o.crema > 0.3) {
    const s = superficieVaso(x, yBase, tam, o);
    if (guia) dibujarGuia(g, guia, TOP, s);
    dibujarSuperficie(g, o.sup, s, TOP, ahora);
  }
}
function superficieVaso(x: number, yBase: number, tam: number, o: ObraFresas): Ovalo {
  const v = geoDe(o.vaso ?? 'M', x, yBase, tam);
  const z = zNivel(v, Math.min(1.04, Math.max(0.6, o.crema)));
  const r = radioEn(v, z);
  return { x, y: yEn(v, z), rx: r * 0.86, ry: r * v.se * 0.86 };
}

// ---------------------------------------------------------------------------------------------- Picar
class EstacionPicar implements Estacion {
  id = 'picar';
  nombre = 'Picar';
  icono = 'cuchillo';
  emoji = '🔪';
  usaTicket = true;
  /** (local) la fresa en la tabla de cada uno. */
  private tabla: { cortes: Linea[]; t: number } | null = null;
  private trazo: { x: number; y: number }[] = [];
  private volando: { t: number; cortes: Linea[] } | null = null;
  private filo = 0;
  constructor(private m: Motor) {}

  private get obra(): ObraFresas | null {
    return (this.m.activo?.obra as ObraFresas) ?? null;
  }
  private rVasos(): (Rect & { tam: Tam })[] {
    return (['P', 'M', 'G'] as Tam[]).filter((t) => VASOS[t].desde <= this.m.rango).map((tam, i) => ({ tam, x: 14, y: RIEL + 14 + i * 128, w: 156, h: 120 }));
  }
  private tablaPos() {
    const z = this.m.zona;
    return { x: 190 + (z.w - 190 - 250) / 2, y: RIEL + 236, r: 92 };
  }
  private rCanasta(): Rect {
    return { x: 184, y: this.m.H - BARRA - 150, w: 200, h: 140 };
  }
  private rVasoPos() {
    return { x: this.m.zona.w - 128, y: this.m.H - BARRA - 34 };
  }
  private rAlVaso(): Rect {
    const p = this.tablaPos();
    return { x: p.x - 104, y: this.m.H - BARRA - 92, w: 208, h: 70 };
  }
  private rBotar(): Rect {
    return { x: this.m.zona.w - 210, y: RIEL + 14, w: 160, h: 58 };
  }
  enMano() {
    return this.tabla ? 'cuchillo' : null;
  }

  fondo(g: G) {
    fondoEstacion(this.m, g, RIEL + 130);
  }
  paso(dt: number) {
    if (this.volando) {
      this.volando.t += dt;
      if (this.volando.t > 0.5) this.volando = null;
    }
    this.filo = Math.max(0, this.filo - dt);
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
        m.cambioObra();
        sonidos.pop();
        m.pistaUnaVez('canasta', 'Toca la canasta para poner una fresa en la tabla');
        return;
      }
      if (dentro(this.rCanasta(), x, y)) {
        if (this.tabla) return m.aviso('Ya hay una fresa en la tabla');
        this.tabla = { cortes: [], t: m.reloj };
        sonidos.pop();
        m.pistaUnaVez('cortar', 'Desliza el cuchillo sobre la fresa para cortarla como dice el tiquete');
        return;
      }
      if (dentro(this.rAlVaso(), x, y) && this.tabla) return this.alVaso();
      if (dentro(this.rBotar(), x, y) && obra && (obra.vaso || obra.fresas.length)) {
        obra.vaso = null;
        obra.fresas = [];
        m.cambioObra();
        sonidos.papel();
        return;
      }
      this.trazo.push({ x, y });
      return;
    }
    if (tipo === 'mover') {
      if (this.trazo.length) this.trazo.push({ x, y });
      if (this.trazo.length > 60) this.trazo.splice(1, 1);
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
    const an = ((Math.atan2(b.y - a.y, b.x - a.x) % Math.PI) + Math.PI) % Math.PI;
    const nx = -Math.sin(an), ny = Math.cos(an);
    const d = -((p.x - a.x) * nx + (p.y - a.y) * ny) / p.r;
    if (Math.abs(d) > 0.95 || this.tabla.cortes.length >= 5) return;
    this.tabla.cortes.push({ a: an, d });
    sonidos.corte();
    this.filo = 0.25;
    m.fx.salpicar(p.x, p.y, '#e2304a', 8, 0.8);
    m.fx.salpicar(p.x, p.y, '#ff8a9a', 4, 0.5);
    // ¿Corte limpio? (sobre una línea de las que pide)
    const pd = m.activo?.pedido as PedidoFresas | undefined;
    if (pd && CORTES[pd.corte].lineas.some((q) => {
      let da = Math.abs(an - q.a) % Math.PI;
      da = Math.min(da, Math.PI - da);
      return da < 0.12 && Math.abs(d * (Math.abs(an - q.a) < Math.PI / 2 ? 1 : -1) - q.d) < 0.1;
    })) m.acierto(p.x, p.y - p.r, '¡Derechito!');
  }

  private alVaso() {
    const m = this.m, obra = this.obra;
    if (!obra) return m.aviso('Primero toca un pedido del riel de arriba');
    if (!obra.vaso) return m.aviso('Primero escoge el vaso (a la izquierda)');
    if (obra.fresas.length >= 8) return m.aviso('El vaso ya está lleno');
    const pd = m.activo!.pedido as PedidoFresas;
    const c = this.tabla!.cortes;
    obra.fresas.push({ cortes: c.map((x) => ({ a: Math.round(x.a * 1000) / 1000, d: Math.round(x.d * 1000) / 1000 })), valor: Math.round(valorCortes(c, CORTES[pd.corte].lineas, m.mejora('cuchillo')) * 1000) / 1000 });
    m.cambioObra();
    this.volando = { t: 0, cortes: c };
    this.tabla = null;
    sonidos.pop();
    if (obra.fresas.length === VASOS[obra.vaso].fresas) m.acierto(this.rVasoPos().x, this.rVasoPos().y - 200, '¡Completo!');
    if (obra.fresas.length === 1) m.pistaUnaVez('llenar', `Llena el vaso hasta que tenga ${VASOS[obra.vaso].fresas} fresas y luego ve a «Batir»`);
  }

  dibujar(g: G, t: number) {
    const m = this.m, obra = this.obra;
    g.fillStyle = 'rgba(70,45,30,0.3)';
    const vs = this.rVasos();
    rr(g, 6, RIEL + 6, 172, vs.length * 128 + 8, 18);
    g.fill();
    for (const r of vs) {
      const act = obra?.vaso === r.tam;
      g.fillStyle = act ? 'rgba(255,226,168,0.95)' : 'rgba(255,248,238,0.8)';
      rr(g, r.x, r.y, r.w, r.h, 14);
      g.fill();
      if (act) {
        g.strokeStyle = '#ffb627';
        g.lineWidth = 4;
        rr(g, r.x, r.y, r.w, r.h, 14);
        g.stroke();
      }
      if (!spr(g, ID_VASO(r.tam), r.x + 50, r.y + r.h - 10, 92)) texto(g, '🥤', r.x + 50, r.y + r.h / 2, { tam: 40 });
      texto(g, VASOS[r.tam].nombre, r.x + 112, r.y + r.h / 2, { tam: 17, color: '#4a2a10', max: 80 });
    }
    // Tabla de picar
    const p = this.tablaPos();
    if (!spr(g, 'tabla', p.x, p.y + 16, 230)) {
      g.fillStyle = lineal(g, 0, p.y - 150, 0, p.y + 150, [[0, '#e8b77f'], [1, '#c98a50']]);
      rr(g, p.x - 220, p.y - 140, 440, 270, 40);
      g.fill();
    }
    if (this.tabla) {
      const cae = Math.max(0, 1 - (m.reloj - this.tabla.t) / 0.25);
      fresaCortada(g, p.x, p.y - cae * 90, p.r, this.tabla.cortes);
      if (m.mejora('cuchillo') >= 2 && m.activo) {
        g.save();
        g.setLineDash([8, 8]);
        g.strokeStyle = 'rgba(255,255,255,0.75)';
        g.lineWidth = 3;
        for (const c of CORTES[(m.activo.pedido as PedidoFresas).corte].lineas) {
          const nx = -Math.sin(c.a), ny = Math.cos(c.a);
          const px = p.x + nx * c.d * p.r, py = p.y + ny * c.d * p.r;
          g.beginPath();
          g.moveTo(px - Math.cos(c.a) * p.r * 1.4, py - Math.sin(c.a) * p.r * 1.4);
          g.lineTo(px + Math.cos(c.a) * p.r * 1.4, py + Math.sin(c.a) * p.r * 1.4);
          g.stroke();
        }
        g.restore();
      }
      m.boton(this.rAlVaso(), 'Al vaso ➜', '#ff8fa3', { color: '#fff', borde: '#b83a52', tam: 28 });
    } else texto(g, 'Toca la canasta 🧺', p.x, p.y, { tam: 26, color: 'rgba(90,50,20,0.65)' });
    // El cuchillo sigue el dedo y deja una estela
    if (this.trazo.length > 1) {
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = 10;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(this.trazo[0].x, this.trazo[0].y);
      for (const q of this.trazo) g.lineTo(q.x, q.y);
      g.stroke();
      const u = this.trazo[this.trazo.length - 1], a = this.trazo[Math.max(0, this.trazo.length - 6)];
      const ang = Math.atan2(u.y - a.y, u.x - a.x);
      if (!spr(g, 'cuchillo', u.x, u.y, 120, { rot: ang - 0.15 })) texto(g, '🔪', u.x, u.y, { tam: 50 });
    } else if (this.tabla && m.dedo === null) {
      // Cuchillo quieto al lado de la tabla
      spr(g, 'cuchillo', p.x + 150, p.y + 120, 110, { rot: -0.3 });
    }
    if (this.filo > 0) {
      g.globalAlpha = this.filo / 0.25;
      g.fillStyle = '#fff';
      elipse(g, p.x, p.y, p.r * 1.5, p.r * 0.25);
      g.fill();
      g.globalAlpha = 1;
    }
    // Canasta de fresas
    const c = this.rCanasta();
    if (!spr(g, 'canasta', c.x + c.w / 2, c.y + c.h - 10, 92)) texto(g, '🧺', c.x + c.w / 2, c.y + c.h / 2, { tam: 70 });
    // El vaso del pedido
    const v = this.rVasoPos();
    if (obra?.vaso) {
      dibujarVaso(g, obra, v.x, v.y, 220, t);
      const need = VASOS[obra.vaso].fresas;
      const lleno = obra.fresas.length >= need;
      g.fillStyle = lleno ? 'rgba(80,170,90,0.92)' : 'rgba(40,24,16,0.78)';
      rr(g, v.x - 84, v.y - 238, 168, 36, 18);
      g.fill();
      texto(g, `${obra.fresas.length} / ${need} fresas`, v.x, v.y - 219, { tam: 21, color: '#fff' });
      botonBotar(g, this.rBotar());
    } else if (obra) texto(g, '← Escoge el vaso', v.x, v.y - 100, { tam: 22, color: '#fff', borde: 'rgba(40,30,25,0.7)' });
    if (this.volando) {
      const k = this.volando.t / 0.5;
      fresaCortada(g, p.x + (v.x - p.x) * k, p.y + (v.y - 130 - p.y) * k - Math.sin(k * Math.PI) * 130, p.r * (1 - k * 0.7), this.volando.cortes, 4);
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
  icono = 'batidora';
  emoji = '🥣';
  usaTicket = true;
  private elegido = 0;
  private vertiendo = false;
  private sonando = 0;
  constructor(private m: Motor) {}

  /** Qué tiquete tiene cada batidora (0 = libre). */
  private get slots(): number[] {
    return this.m.maq.batidoras;
  }
  private tazonDeSlot(i: number): { t: Ticket; tz: Tazon } | null {
    const id = this.slots[i];
    if (!id) return null;
    const t = this.m.s.tickets.find((x) => x.id === id);
    const tz = (t?.obra as ObraFresas | undefined)?.tazon;
    return t && tz ? { t, tz } : null;
  }
  private herramientas(): (Rect & { id: string; nombre: string })[] {
    const l = [{ id: 'crema', nombre: 'Crema de leche' }, { id: 'condensada', nombre: 'Leche condensada' }, ...SABORES.filter((s) => s.desde <= this.m.rango).map((s) => ({ id: s.id, nombre: s.nombre }))];
    const h = Math.min(104, (this.m.H - RIEL - BARRA - 110) / l.length);
    return l.map((x, i) => ({ ...x, x: 14, y: RIEL + 14 + i * h, w: 206, h: h - 8 }));
  }
  private rTazon(i: number) {
    const x0 = 236, x1 = this.m.zona.w - 10;
    const w = (x1 - x0) / this.slots.length;
    const cx = x0 + w * (i + 0.5) - 30;
    const by = RIEL + 340;
    return { cx, by, caja: { x: cx - w / 2 + 36, y: RIEL + 40, w: w - 12, h: 320 }, boton: { x: cx - 92, y: this.m.H - BARRA - 90, w: 184, h: 68 } };
  }
  private vel() {
    return (1 / 16) * (1 + 0.25 * this.m.mejora('turbo'));
  }
  alerta() {
    return this.slots.some((_, i) => {
      const s = this.tazonDeSlot(i);
      return !!s && s.tz.batiendo && s.tz.textura > 0.85;
    });
  }
  enMano() {
    return this.vertiendo ? 'crema' : null;
  }

  fondo(g: G) {
    fondoEstacion(this.m, g, RIEL + 300, { campana: false });
  }

  paso(dt: number) {
    const m = this.m;
    let motor = false;
    // Las batidoras de pedidos ya entregados quedan libres
    for (let i = 0; i < this.slots.length; i++) if (this.slots[i] && !m.s.tickets.some((k) => k.id === this.slots[i])) this.slots[i] = 0;
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.tazonDeSlot(i);
      if (!s || !s.tz.batiendo) continue;
      const tz = s.tz;
      motor = true;
      const antes = tz.textura;
      tz.textura = Math.min(1.1, tz.textura + this.vel() * dt * (tz.nivel > 0.05 ? 1 : 0));
      if (m.mejora('alarma'))
        for (const meta of Object.values(PUNTO_CREMA))
          if (antes < meta && tz.textura >= meta) {
            sonidos.alarma();
            tz.avisado = m.reloj;
          }
      if (antes < CORTADA && tz.textura >= CORTADA) {
        sonidos.quemado();
        m.chef('susto', 2);
        m.aviso(m.actual === 2 ? '¡Uy! La crema se está cortando' : '¡Se está cortando una crema en «Batir»!');
      }
      if (m.actual === 2 && Math.random() < dt * 4) {
        const r = this.rTazon(i);
        m.fx.salpicar(r.cx, r.by - 80, '#fffaf2', 1, 0.5);
      }
    }
    const s = this.tazonDeSlot(this.elegido);
    if (this.vertiendo && s) {
      s.tz.nivel = Math.min(1.1, s.tz.nivel + dt * 0.42);
      m.cambioObra(s.t);
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

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m;
    if (tipo === 'subir') {
      if (this.vertiendo) {
        const s = this.tazonDeSlot(this.elegido);
        if (s && Math.abs(s.tz.nivel - NIVEL_TAZON) < 0.05) m.acierto(this.rTazon(this.elegido).cx, RIEL + 150, '¡Exacto!');
      }
      this.vertiendo = false;
      return;
    }
    if (tipo !== 'bajar') return;
    for (let i = 0; i < this.slots.length; i++) {
      const r = this.rTazon(i);
      if (dentro(r.boton, x, y)) {
        const s = this.tazonDeSlot(i);
        if (!s) return m.aviso('Ese tazón está vacío');
        s.tz.batiendo = !s.tz.batiendo;
        m.cambioObra(s.t);
        sonidos.clic();
        if (!s.tz.batiendo) {
          const p = (s.t.pedido as PedidoFresas).punto;
          if (Math.abs(s.tz.textura - PUNTO_CREMA[p]) < 0.05) m.acierto(r.cx, RIEL + 150, p === 'firme' ? '¡Firme!' : '¡Suavecita!');
        } else m.pistaUnaVez('punto', 'Para la batidora cuando la flecha esté en el punto que pide (suave o firme)');
        return;
      }
      if (dentro(r.caja, x, y)) {
        this.elegido = i;
        const s = this.tazonDeSlot(i);
        if (!s && m.activo) {
          const ya = this.slots.indexOf(m.activo.id);
          if (ya >= 0) {
            this.elegido = ya;
            return m.aviso(`El pedido #${m.activo.numero} ya tiene su tazón`);
          }
          const obra = m.activo.obra as ObraFresas;
          this.slots[i] = m.activo.id;
          obra.tazon = { nivel: 0, dulce: 0, sabor: {}, textura: 0, batiendo: false, avisado: 0 };
          m.cambioMaq('batidoras');
          m.cambioObra();
          sonidos.pop();
          m.pistaUnaVez('crema', 'Mantén «Crema de leche» hasta la rayita y agrega las cucharadas de leche condensada');
        } else if (s) m.activo = s.t;
        sonidos.clic();
        return;
      }
    }
    const h = this.herramientas().find((r) => dentro(r, x, y));
    if (h) {
      let s = this.tazonDeSlot(this.elegido);
      // Si el tazón escogido es de otro pedido, se usa el del pedido activo
      if (m.activo && s?.t.id !== m.activo.id) {
        const i = this.slots.indexOf(m.activo.id);
        if (i >= 0) {
          this.elegido = i;
          s = this.tazonDeSlot(i);
        }
      }
      if (!s) return m.aviso('Toca una batidora libre para el pedido');
      if (s.tz.batiendo || s.tz.textura > 0.05) return m.aviso('Ya se está batiendo: bota el tazón para empezar otra vez');
      if (h.id === 'crema') this.vertiendo = true;
      else if (h.id === 'condensada') {
        s.tz.dulce++;
        sonidos.pop();
        m.flotar(`🥄 ${s.tz.dulce}`, this.rTazon(this.elegido).cx, RIEL + 120, '#fff4c9');
        m.fx.salpicar(this.rTazon(this.elegido).cx, this.rTazon(this.elegido).by - 90, '#f4e3bc', 5, 0.6);
      } else {
        s.tz.sabor[h.id] = (s.tz.sabor[h.id] ?? 0) + 1;
        sonidos.pop();
        m.fx.salpicar(this.rTazon(this.elegido).cx, this.rTazon(this.elegido).by - 90, SABORES.find((q) => q.id === h.id)!.color, 5, 0.6);
      }
      m.cambioObra(s.t);
      return;
    }
    if (dentro(this.rBotarTazon(), x, y)) {
      const id = this.slots[this.elegido];
      if (!id) return;
      const tk = m.s.tickets.find((k) => k.id === id);
      if (tk) {
        (tk.obra as ObraFresas).tazon = null;
        m.cambioObra(tk);
      }
      this.slots[this.elegido] = 0;
      m.cambioMaq('batidoras');
      sonidos.papel();
    }
  }
  private rBotarTazon(): Rect {
    return { x: 14, y: this.m.H - BARRA - 82, w: 206, h: 62 };
  }

  dibujar(g: G, tiempo: number) {
    const m = this.m;
    const hs = this.herramientas();
    g.fillStyle = 'rgba(70,45,30,0.3)';
    rr(g, 6, RIEL + 6, 222, hs.length * (hs[0]?.h + 8 || 100) + 8, 18);
    g.fill();
    for (const h of hs) {
      const act = h.id === 'crema' && this.vertiendo;
      g.fillStyle = act ? 'rgba(255,226,168,0.95)' : 'rgba(255,248,238,0.82)';
      rr(g, h.x, h.y, h.w, h.h, 14);
      g.fill();
      const id = h.id === 'crema' ? 'ing_crema' : h.id === 'condensada' ? 'ing_condensada' : `ing_${h.id}`;
      if (!spr(g, id, h.x + 46, h.y + h.h - 8, Math.min(1, h.h / 96) * 50, act ? { rot: -0.9 } : undefined)) texto(g, h.id === 'crema' ? '🥛' : '🥫', h.x + 46, h.y + h.h / 2, { tam: 36 });
      texto(g, h.nombre, h.x + 144, h.y + h.h / 2, { tam: 17, color: '#4a2a10', max: 104 });
    }
    m.boton(this.rBotarTazon(), '🗑 Botar tazón', '#f0e4d8', { tam: 20, color: '#7a4a3a' });
    this.slots.forEach((_, i) => {
      const r = this.rTazon(i);
      const s = this.tazonDeSlot(i);
      const sel = i === this.elegido;
      if (sel && this.slots.length > 1) {
        g.fillStyle = 'rgba(255,190,60,0.16)';
        rr(g, r.caja.x, r.caja.y, r.caja.w, r.caja.h, 22);
        g.fill();
      }
      this.dibujarBatidora(g, s?.tz ?? null, r.cx, r.by, tiempo, sel && this.vertiendo);
      if (s) {
        const tz = s.tz;
        const p = s.t.pedido as PedidoFresas;
        texto(g, `Pedido #${s.t.numero}`, r.cx, RIEL + 28, { tam: 20, color: '#fff', borde: 'rgba(40,30,25,0.75)' });
        medidor(g, r.cx + 150, RIEL + 70, 26, 230, tz.textura, [
          { desde: 0.4, hasta: 0.6, color: '#bfe8c0', etiqueta: p.punto === 'suave' ? 'Suave ★' : 'Suave' },
          { desde: 0.64, hasta: 0.84, color: '#8fd49a', etiqueta: p.punto === 'firme' ? 'Firme ★' : 'Firme' },
          { desde: CORTADA, hasta: 1, color: '#f2a0a0' },
        ], m.mejora('alarma') && m.reloj - tz.avisado < 1.2 ? m.reloj : undefined);
        m.boton(r.boton, tz.batiendo ? '■ Parar' : '▶ Batir', tz.batiendo ? '#e8434f' : '#5cc26a', { color: '#fff', tam: 26 });
        texto(g, `🥄 ${tz.dulce}${Object.entries(tz.sabor).map(([k, v]) => ` · ${k} ${v}`).join('')}`, r.cx, r.by + 30, { tam: 18, color: '#fff', borde: 'rgba(40,30,25,0.75)' });
      } else texto(g, m.activo ? `Toca para el #${m.activo.numero}` : 'Libre', r.cx, r.by + 30, { tam: 20, color: '#fff', borde: 'rgba(40,30,25,0.75)' });
    });
  }

  private dibujarBatidora(g: G, tz: Tazon | null, x: number, by: number, t: number, vertiendo: boolean) {
    const vib = tz?.batiendo ? Math.sin(t * 60) * 1.5 : 0;
    const tam = 132;
    const bol = punto('batidora', 'bol', x, by, tam);
    const eje = punto('batidora', 'eje', x + vib, by, tam);
    const hayB = hay('batidora');
    // Cuerpo de la batidora (atrás)
    if (hayB) spr(g, 'batidora', x + vib, by, tam);
    // Varilla girando (de lado: se estira y se encoge)
    const giro = tz?.batiendo ? Math.cos(t * 26) : 1;
    // Bol con la crema
    if (!spr(g, 'bol', bol.x, bol.y, tam)) {
      g.fillStyle = lineal(g, x - 130, 0, x + 130, 0, [[0, '#8f989d'], [0.35, '#eef2f4'], [0.6, '#c3cacd'], [1, '#7d868b']]);
      g.beginPath();
      g.moveTo(x - 120, by - 100);
      g.bezierCurveTo(x - 114, by, x + 114, by, x + 120, by - 100);
      g.fill();
    }
    const rb = recorte('bol');
    const R = ((rb?.r_boca as number) ?? 0.11) * (tam / (rb?.ref ?? 0.11));
    const alto = ((rb?.alto as number) ?? 0.075) * (tam / (rb?.ref ?? 0.11));
    const se = Math.sin(25 * Math.PI / 180), ce = Math.cos(25 * Math.PI / 180);
    const boca = { x: bol.x, y: bol.y - alto * ce };
    if (tz && tz.nivel > 0) {
      const col = colorCrema(tz);
      const nv = Math.min(1.05, tz.nivel);
      const h = alto * (0.25 + 0.65 * nv);
      const rr2 = R * (0.62 + 0.36 * Math.min(1, h / alto));
      const cy = bol.y - h * ce;
      g.save();
      g.beginPath();
      g.ellipse(boca.x, boca.y, R * 0.985, R * 0.985 * se, 0, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = lineal(g, 0, cy - rr2 * se, 0, cy + rr2 * se, [[0, aclarar(col, 0.4)], [1, oscurecer(col, 0.06)]]);
      g.beginPath();
      g.ellipse(boca.x, cy, rr2, rr2 * se, 0, 0, Math.PI * 2);
      g.fill();
      // Picos de crema (más con más textura) que giran si bate
      const picos = Math.floor(Math.min(1, tz.textura) * 11);
      for (let i = 0; i < picos; i++) {
        const a = i * 2.4 + (tz.batiendo ? t * 4 : 0);
        const d = ((i % 3) / 3 + 0.25) * rr2 * 0.85;
        const px = boca.x + Math.cos(a) * d, py = cy + Math.sin(a) * d * se;
        const hp = 8 + tz.textura * 16;
        g.fillStyle = aclarar(col, 0.3);
        g.beginPath();
        g.moveTo(px - 12, py + 3);
        g.quadraticCurveTo(px - 2, py - hp * 0.5, px + 2, py - hp);
        g.quadraticCurveTo(px + 4, py - hp * 0.4, px + 12, py + 3);
        g.closePath();
        g.fill();
      }
      if (tz.textura > CORTADA) {
        g.fillStyle = 'rgba(232,206,120,0.75)';
        for (let i = 0; i < 7; i++) {
          elipse(g, boca.x + Math.cos(i * 1.7) * rr2 * 0.6, cy + Math.sin(i * 1.7) * rr2 * se * 0.6, 12, 6);
          g.fill();
        }
      }
      g.restore();
    }
    // La rayita de «hasta aquí» por dentro del bol
    const hR = alto * (0.25 + 0.65 * NIVEL_TAZON);
    rayita(g, boca.x - R * 0.82, boca.x + R * 0.82, bol.y - hR * ce);
    // Varilla (entra a la crema)
    if (hayB) {
      g.save();
      g.beginPath();
      g.rect(eje.x - 60, eje.y - 10, 120, (bol.y - alto * 0.3 * ce) - eje.y + 10);
      g.clip();
      spr(g, 'varilla', eje.x, eje.y, tam * 0.82, { ex: 0.25 + 0.75 * Math.abs(giro) });
      g.restore();
    }
    if (vertiendo) {
      const c = { x: x - R * 1.2, y: boca.y - 150 };
      chorro(g, c.x + 20, c.y + 26, boca.x - 10, boca.y + 4, '#fffaf2', 12, t);
      spr(g, 'ing_crema', c.x, c.y + 30, 54, { rot: 1.9 });
    }
  }
}

// ---------------------------------------------------------------------------------------------- Servir
class EstacionServir implements Estacion {
  id = 'servir';
  nombre = 'Servir';
  icono = 'vasofresa_M';
  emoji = '🍓';
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
    return botonesToppings(TOPS, this.m.rango, 16, RIEL + 16, 3, 92, this.m.H - RIEL - BARRA - 24);
  }
  private pos() {
    return { x: 330 + (this.m.zona.w - 330) / 2 - 40, y: this.m.H - BARRA - 30 };
  }
  private tam() {
    return 330;
  }
  private rCrema(): Rect {
    const p = this.pos();
    return { x: p.x - 330, y: RIEL + 70, w: 160, h: 150 };
  }
  private rEntregar(): Rect {
    const p = this.pos();
    return { x: p.x + 150, y: this.m.H - BARRA - 88, w: 200, h: 66 };
  }
  private rBotar(): Rect {
    const p = this.pos();
    return { x: p.x + 150, y: this.m.H - BARRA - 166, w: 200, h: 60 };
  }
  private superficie(): Ovalo | null {
    const o = this.obra;
    if (!o || o.crema <= 0.3) return null;
    const p = this.pos();
    return superficieVaso(p.x, p.y, this.tam(), o);
  }
  enMano() {
    return this.herramienta ?? (this.echando ? 'crema' : null);
  }

  fondo(g: G) {
    fondoEstacion(this.m, g, RIEL + 290);
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
    this.m.cambioObra();
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
      if (this.aplicando && s && this.aplicador.mover(aUV(s, x, y), m.reloj)) m.cambioObra();
      return;
    }
    if (tipo === 'subir') {
      if (this.echando && o && Math.abs(o.crema - LLENO_VASO) < 0.05) m.acierto(this.pos().x, this.pos().y - 300, '¡Hasta el borde!');
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
      if (o.tazon.batiendo) return m.aviso('Para la batidora antes de servir');
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
      m.cambioObra();
      sonidos.papel();
      return;
    }
    const s = this.superficie();
    if (this.herramienta) {
      if (!s) return m.aviso('Primero échale la crema');
      const r = this.aplicador.bajar(o.sup, this.herramienta, aUV(s, x, y), m.reloj);
      if (r) {
        m.cambioObra();
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
      texto(g, 'Toca un pedido del riel', p.x, p.y - 180, { tam: 26, color: '#fff', borde: 'rgba(40,30,25,0.7)' });
      return;
    }
    // La manga con la crema del tazón
    const c = this.rCrema();
    g.fillStyle = this.echando ? 'rgba(255,226,168,0.95)' : 'rgba(255,248,238,0.85)';
    rr(g, c.x, c.y, c.w, c.h, 18);
    g.fill();
    if (!this.echando && !spr(g, 'manga', c.x + c.w / 2, c.y + c.h - 30, 70, { rot: 0.5 })) texto(g, '🍦', c.x + c.w / 2, c.y + 60, { tam: 48 });
    texto(g, 'Echar crema (mantén)', c.x + c.w / 2, c.y + c.h - 14, { tam: 15, color: '#4a2a10', max: c.w - 8 });
    if (o.vaso) dibujarVaso(g, o, p.x, p.y, this.tam(), t, o.crema < 1.1 && !o.sup.capas.length, m.mejora('guia') ? (m.activo!.pedido as PedidoFresas).toppings : undefined);
    else texto(g, 'Este pedido no tiene vaso: ve a «Picar»', p.x, p.y - 180, { tam: 24, color: '#fff', borde: 'rgba(40,30,25,0.7)' });
    if (this.echando && o.tazon && o.vaso) {
      const s = superficieVaso(p.x, p.y, this.tam(), o);
      const col = colorCrema(o.tazon);
      const mx = p.x + 30, my = s.y - 190;
      chorro(g, mx - 14, my + 70, p.x, s.y - 6, col, 18, t);
      spr(g, 'manga', mx, my, 90, { rot: -0.3 });
      if (Math.random() < 0.3) m.fx.salpicar(p.x, s.y - 6, col, 1, 0.4);
    }
    botonEntregar(g, this.rEntregar());
    botonBotar(g, this.rBotar());
    if (this.herramienta) {
      const d = TOP[this.herramienta];
      texto(g, `En la mano: ${d.nombre}`, p.x, RIEL + 26, { tam: 20, color: '#fff', borde: 'rgba(40,30,25,0.85)' });
      if (m.dedo && this.aplicador.enUso) dibujarEnMano(g, d, m.dedo.x, m.dedo.y, t);
    }
  }
}

// ---------------------------------------------------------------------------------------------- Tiquete y calificación
function dibujarTicket(g: G, p: PedidoFresas, r: Rect) {
  let y = r.y + 8;
  const v = geoDe(p.vaso, r.x + 34, y + 62, 60);
  if (!spr(g, ID_VASO(p.vaso), v.x, v.y, 60)) texto(g, '🥤', r.x + 34, y + 30, { tam: 30 });
  letra(g, `Vaso ${VASOS[p.vaso].nombre.toLowerCase()}`, r.x + 66, y + 18, { tam: 16, max: r.w - 74 });
  letra(g, `${VASOS[p.vaso].fresas} fresas`, r.x + 66, y + 40, { tam: 14, color: '#8a6a58', max: r.w - 74 });
  y += 70;
  fresaCortada(g, r.x + 34, y + 18, 17, CORTES[p.corte].lineas, 2.5);
  letra(g, CORTES[p.corte].nombre, r.x + 66, y + 18, { tam: 16, max: r.w - 74 });
  y += 46;
  g.fillStyle = p.sabor ? aclarar(SABORES.find((s) => s.id === p.sabor)!.color, 0.5) : '#fffaf2';
  elipse(g, r.x + 34, y + 20, 22, 12);
  g.fill();
  g.strokeStyle = '#c3cacd';
  g.lineWidth = 3;
  g.stroke();
  letra(g, `Crema ${p.punto}${p.sabor ? ` de ${p.sabor}` : ''}`, r.x + 66, y + 12, { tam: 15, max: r.w - 74 });
  letra(g, `🥄 ${p.dulce} de leche condensada`, r.x + 66, y + 34, { tam: 13, color: '#8a6a58', max: r.w - 74 });
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
  const need = VASOS[p.vaso].fresas;
  const cortes = o.fresas.length ? o.fresas.reduce((a, f) => a + f.valor, 0) / o.fresas.length : 0;
  const picar = o.vaso ? Math.round((puntajeCuenta(o.fresas.length, need) * 0.4 + cortes * 100 * 0.6) * (o.vaso === p.vaso ? 1 : 0.6)) : 0;
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
  icono: 'vasofresa_M',
  tema: { pared: '#f8c9d2', acento: '#e2475d', piso: '#f5e1e3', oscuro: '#6a1a2a' },
  mejoras: MEJORAS,
  desbloqueos: DESBLOQUEOS,
  maquinas: (mejora) => ({ batidoras: Array.from({ length: 1 + mejora('batidoras') }, () => 0) }),
  crearEstaciones(m) {
    return [new EstacionPicar(m), new EstacionBatir(m), new EstacionServir(m)];
  },
  pedido,
  obraNueva: () => ({ vaso: null, fresas: [], tazon: null, crema: 0, sup: superficieNueva() }),
  tiempoIdeal: (p) => 24 + VASOS[p.vaso].fresas * CORTES[p.corte].lineas.length * 2.5 + 14 + p.toppings.length * 5,
  dibujarTicket: (g, p, r) => dibujarTicket(g, p, r),
  calificar,
  dibujarPlato(g, t, x, y, esc, m) {
    if (t.obra.vaso) dibujarVaso(g, t.obra, x, y + 130 * esc, 300 * esc, m.reloj + 99);
  },
  /** Para las pruebas automáticas. */
  pruebas: { TOP, CORTES, VASOS, superficieVaso, PUNTO_CREMA },
} as Receta<PedidoFresas, ObraFresas> & { pruebas: unknown };
void mezclar;
void chorro;
