// La frapería (estilo Papa's Freezeria): en «Preparar» se escoge el vaso, se echan los bombazos de la base (café,
// chocolate, moca, fresa…), las paladas de hielo y la leche hasta la rayita; en «Licuar» se licúa hasta que quede
// grueso, normal o cremoso (sin que se agüe) y se sirve; en «Decorar» va la crema chantilly a la altura que pide,
// las salsas, los toppings, la cereza y el pitillo. En pareja las licuadoras son de los dos.
import { aclarar, dentro, elipse, G, lineal, mezclar, oscurecer, Rect, rr, sombra, texto } from './dibujo';
import {
  Aplicador, aUV, botonBotar, botonEntregar, botonesToppings, calificarToppings, dibujarBotonesToppings, dibujarEnMano, dibujarGuia, dibujarSuperficie,
  filaTopping, letra, medidor, Ovalo, puntajeCuenta, puntajeNivel, puntajeZona, rayita, separador, Superficie, superficieNueva, ToppingDef, ToppingPedido,
} from './herramientas';
import type { Invitado } from './invitados';
import { BARRA, Categoria, Estacion, Motor, Receta, RIEL, sonidos, Ticket } from './motor';
import { fondoEstacion } from './pantallas';
import { hay, punto, spr } from './sprites';
import type { Desbloqueo, Mejora } from './tipos';
import { caminoInterior, chorro, GeoVaso, geoVaso, hielos, liquido, radioEn, yEn, zNivel } from './vasos';

// ---------------------------------------------------------------------------------------------- Ingredientes
type Tam = 'P' | 'M' | 'G';
const VASOS: Record<Tam, { nombre: string; onzas: number; bombas: number; desde: number; rb: number; rt: number; alto: number }> = {
  P: { nombre: 'Pequeño', onzas: 12, bombas: 2, desde: 1, rb: 0.03, rt: 0.042, alto: 0.12 },
  M: { nombre: 'Mediano', onzas: 16, bombas: 3, desde: 1, rb: 0.032, rt: 0.046, alto: 0.14 },
  G: { nombre: 'Grande', onzas: 20, bombas: 4, desde: 3, rb: 0.034, rt: 0.05, alto: 0.16 },
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
interface Licuadora {
  ticket: number;
  valor: number;
  andando: boolean;
  avisado: number;
}

function pedido(rango: number, _dia: number, azar: () => number, inv?: Invitado): PedidoFrappe {
  const tomar = <T,>(l: T[]) => l[Math.floor(azar() * l.length)];
  const disponibles = TOPS.filter((t) => t.desde <= rango);
  const k = Math.max(1, Math.min(4, disponibles.length, 1 + Math.floor(rango / 4) + (azar() < 0.5 ? 1 : 0)));
  const elegidos: ToppingDef[] = [];
  while (elegidos.length < k) {
    const t = tomar(disponibles);
    if (!elegidos.includes(t)) elegidos.push(t);
  }
  elegidos.sort((a, b) => (a.tipo === 'pieza' ? 1 : 0) - (b.tipo === 'pieza' ? 1 : 0));
  const licuados: Licuado[] = ['normal', ...(rango >= 2 ? (['cremoso'] as Licuado[]) : []), ...(rango >= 4 ? (['grueso'] as Licuado[]) : [])];
  const cremas: Crema[] = ['normal', 'normal', 'sin', ...(rango >= 3 ? (['alta'] as Crema[]) : [])];
  // A Él le encanta el frappé de café (ella siempre lo recibe con uno después del trabajo)
  const cafe = inv?.id === 'pareja_el';
  return {
    vaso: tomar((Object.keys(VASOS) as Tam[]).filter((t) => VASOS[t].desde <= rango)),
    base: cafe ? 'cafe' : tomar(BASES.filter((b) => b.desde <= rango)).id,
    hielo: rango >= 2 ? 1 + Math.floor(azar() * 3) : 2,
    licuado: tomar(licuados),
    crema: cafe ? 'normal' : tomar(cremas),
    toppings: elegidos.map((t) => {
      if (t.tipo !== 'pieza') return { id: t.id };
      const [a, b] = CUANTAS[t.id] ?? [1, 1];
      return { id: t.id, n: a + Math.floor(azar() * (b - a + 1)) };
    }),
    pitillo: tomar(PITILLOS.filter((p) => p.desde <= rango)).id,
  };
}

// ---------------------------------------------------------------------------------------------- Colores y el vaso
const colorBase = (v: Vaso) => {
  const ids = Object.keys(v.bombas).filter((k) => v.bombas[k] > 0);
  if (!ids.length) return '#f4efe8';
  let c = BASE[ids[0]].color;
  for (const id of ids.slice(1)) c = mezclar(c, BASE[id].color, 0.5);
  return c;
};
/** El color del frappé licuado: la base con la leche. */
const colorFrappe = (v: Vaso) => mezclar(colorBase(v), '#f6ede2', 0.45);
const ID_VASO = (t: Tam) => `vasofrappe_${t}`;
const geoDe = (t: Tam, x: number, y: number, tam: number) => geoVaso(ID_VASO(t), x, y, tam, { ...VASOS[t], fondo: 0.002, elev: 20, ref: 0.14 });

/** Lo de adentro del vaso antes de licuar: la base abajo, la leche y el hielo. */
function contenidoSinLicuar(g: G, v: GeoVaso, vaso: Vaso, t: number) {
  const bombas = Object.values(vaso.bombas).reduce((a, b) => a + b, 0);
  const nb = Math.min(0.28, bombas * 0.055);
  const cb = colorBase(vaso);
  if (vaso.leche > nb) liquido(g, v, Math.min(1.04, vaso.leche), 'rgba(250,247,240,1)', { t, burbujas: true, profundidad: 0.05, transparencia: 0.3 });
  if (bombas) {
    // La base pesada abajo, con una franja donde se mezcla con la leche
    g.save();
    caminoInterior(g, v, zNivel(v, 0), zNivel(v, nb + (vaso.leche > nb ? 0.06 : 0)));
    const y0 = yEn(v, zNivel(v, nb + 0.06)), y1 = yEn(v, zNivel(v, 0));
    g.fillStyle = lineal(g, 0, y0, 0, y1, [[0, vaso.leche > nb ? 'rgba(250,247,240,0)' : cb], [0.35, cb], [1, oscurecer(cb, 0.2)]]);
    g.fill();
    g.restore();
  }
  if (vaso.hielo) hielos(g, v, vaso.hielo * 2, Math.max(0.2, vaso.leche), t, v.k * 0.013);
}

/** El frappé licuado: espeso, con trocitos de hielo si quedó grueso y aguado arriba si se pasó. */
function contenidoLicuado(g: G, v: GeoVaso, vaso: Vaso, licuado: number, t: number) {
  const col = colorFrappe(vaso);
  liquido(g, v, 0.93, col, { t, profundidad: 0.12, espuma: aclarar(col, 0.25) });
  g.save();
  caminoInterior(g, v, zNivel(v, 0), zNivel(v, 0.93));
  g.clip();
  // Escarcha: puntitos claros (más si quedó grueso)
  const trozos = Math.round(Math.max(0.15, 0.75 - licuado) * 40);
  const yTop = yEn(v, zNivel(v, 0.93)), yBot = yEn(v, zNivel(v, 0));
  for (let i = 0; i < trozos; i++) {
    g.fillStyle = i % 3 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.75)';
    elipse(g, v.x + Math.sin(i * 12.9) * radioEn(v, v.alto * 0.5) * 0.8, yTop + 8 + (((i * 37) % 100) / 100) * (yBot - yTop - 12), 2.5 + (i % 3), 2 + (i % 2));
    g.fill();
  }
  if (licuado > AGUADO) {
    g.fillStyle = 'rgba(210,225,240,0.45)';
    g.fillRect(v.x - 200, yTop, 400, 26);
  }
  g.restore();
}

/** La crema chantilly encima del vaso (copos que suben según cuánta crema lleva). */
function cremaEncima(g: G, v: GeoVaso, crema: number) {
  if (crema <= 0.02) return;
  const zr = v.alto;
  const r = radioEn(v, zr);
  const yr = yEn(v, zr);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const s = r * (1.0 - k * 0.55) * Math.min(1, 0.45 + crema);
    const y = yr - k * crema * r * 1.7;
    if (!spr(g, 'top_chantilly', v.x, y + s * 0.2, s)) {
      g.fillStyle = '#fffaf2';
      elipse(g, v.x, y, s, s * 0.5);
      g.fill();
    }
  }
}
function superficieVaso(x: number, yBase: number, tam: number, o: ObraFrappe): Ovalo {
  const v = geoDe(o.vaso?.tam ?? 'M', x, yBase, tam);
  const r = radioEn(v, v.alto);
  const alto = o.crema > 0.02 ? o.crema * r * 1.7 * 0.6 : 0;
  return { x, y: yEn(v, v.alto) - alto, rx: r * 0.8, ry: r * v.se * 0.9 };
}

/** Vaso de frappé (vacío, preparado o licuado, con su crema, toppings y pitillo). */
function dibujarVaso(g: G, o: ObraFrappe, x: number, yBase: number, tam: number, ahora: number, extra: { raya?: boolean; guia?: ToppingPedido[] } = {}) {
  const vaso = o.vaso;
  const tv = vaso?.tam ?? 'M';
  const v = geoDe(tv, x, yBase, tam);
  sombra(g, x, yBase + 2, v.rt * v.k, 10, 0.25);
  // Pitillo (atrás)
  if (o.pitillo) {
    const p = PITILLOS.find((q) => q.id === o.pitillo)!;
    const L = v.alto * v.k * 1.25;
    if (!spr(g, `pitillo_${o.pitillo}`, x + v.rt * v.k * 0.25, yEn(v, v.alto * 0.08), L / 0.2 * 0.2, { rot: 0.22 })) {
      g.save();
      g.translate(x + v.rt * v.k * 0.25, yEn(v, v.alto * 0.08));
      g.rotate(0.22);
      g.fillStyle = p.color;
      rr(g, -6, -L, 12, L, 5);
      g.fill();
      g.restore();
    }
  }
  if (vaso && o.licuado === null) contenidoSinLicuar(g, v, vaso, ahora);
  else if (vaso && o.licuado !== null) contenidoLicuado(g, v, vaso, o.licuado, ahora);
  if (!spr(g, ID_VASO(tv), x, yBase, tam)) {
    g.strokeStyle = 'rgba(140,170,190,0.9)';
    g.lineWidth = 3;
    caminoInterior(g, v, 0, v.alto, 0);
    g.stroke();
  }
  if (extra.raya) {
    const z = zNivel(v, LECHE), r = radioEn(v, z);
    rayita(g, x - r - 8, x + r + 8, yEn(v, z));
  }
  if (o.licuado !== null) {
    cremaEncima(g, v, o.crema);
    const s = superficieVaso(x, yBase, tam, o);
    if (extra.guia) dibujarGuia(g, extra.guia, TOP, s);
    dibujarSuperficie(g, o.sup, s, TOP, ahora, false);
  }
}

// ---------------------------------------------------------------------------------------------- Preparar
class EstacionPreparar implements Estacion {
  id = 'preparar';
  nombre = 'Preparar';
  icono = 'bomba_cafe';
  emoji = '🧋';
  usaTicket = true;
  private sirviendo = false;
  private sonando = 0;
  /** Bombazos recientes (animación de la bomba y el chorrito). */
  private bombazos: { id: string; t: number }[] = [];
  private paladas: number[] = [];
  constructor(private m: Motor) {}

  private get obra(): ObraFrappe | null {
    return (this.m.activo?.obra as ObraFrappe) ?? null;
  }
  private rVasos(): (Rect & { tam: Tam })[] {
    return (['P', 'M', 'G'] as Tam[]).filter((t) => VASOS[t].desde <= this.m.rango).map((tam, i) => ({ tam, x: 14, y: RIEL + 14 + i * 128, w: 156, h: 120 }));
  }
  private rBombas(): (Rect & { id: string })[] {
    const bs = BASES.filter((b) => b.desde <= this.m.rango);
    const x0 = 186, cols = Math.min(4, bs.length), w = 116;
    return bs.map((b, i) => ({ id: b.id, x: x0 + (i % cols) * (w + 8), y: RIEL + 16 + Math.floor(i / cols) * 196, w, h: 186 }));
  }
  private rHielo(): Rect {
    return { x: 186, y: this.m.H - BARRA - 150, w: 200, h: 136 };
  }
  private rLeche(): Rect {
    return { x: 400, y: this.m.H - BARRA - 150, w: 160, h: 136 };
  }
  private pos() {
    return { x: this.m.zona.w - 140, y: this.m.H - BARRA - 30 };
  }
  private rBotar(): Rect {
    return { x: this.m.zona.w - 250, y: RIEL + 14, w: 150, h: 58 };
  }
  enMano() {
    return this.sirviendo ? 'leche' : null;
  }

  fondo(g: G) {
    fondoEstacion(this.m, g, RIEL + 390);
  }
  paso(dt: number) {
    const o = this.obra;
    if (!this.sirviendo || !o?.vaso) return;
    const cerca = this.m.mejora('dispensador') && Math.abs(o.vaso.leche - LECHE) < 0.12 ? 0.45 : 1;
    o.vaso.leche = Math.min(1.1, o.vaso.leche + dt * 0.36 * cerca);
    this.m.cambioObra();
    this.sonando -= dt;
    if (this.sonando <= 0) {
      sonidos.vertir(0.3);
      this.sonando = 0.28;
    }
    if (o.vaso.leche >= 1.08) {
      this.sirviendo = false;
      this.m.aviso('¡Se regó la leche!');
      this.m.fx.salpicar(this.pos().x, this.pos().y - 280, '#fbfaf4', 12);
    }
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m, o = this.obra;
    if (tipo === 'subir') {
      if (this.sirviendo && o?.vaso && Math.abs(o.vaso.leche - LECHE) < 0.035) m.acierto(this.pos().x, this.pos().y - 330, '¡Exacto!');
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
      m.cambioObra();
      sonidos.pop();
      m.pistaUnaVez('bombas', 'Dale a la base los bombazos que pide, echa el hielo y la leche hasta la rayita');
      return;
    }
    if (dentro(this.rBotar(), x, y) && o.vaso) {
      o.vaso = null;
      m.cambioObra();
      sonidos.papel();
      return;
    }
    if (!o.vaso) return m.aviso('Primero escoge el vaso (a la izquierda)');
    const b = this.rBombas().find((r) => dentro(r, x, y));
    if (b) {
      o.vaso.bombas[b.id] = (o.vaso.bombas[b.id] ?? 0) + 1;
      m.cambioObra();
      sonidos.vertir(0.15);
      this.bombazos.push({ id: b.id, t: m.reloj });
      m.flotar(`+1 ${BASE[b.id].nombre.toLowerCase()}`, b.x + b.w / 2, b.y + 14, '#fff4c9', 22);
      const pd = m.activo?.pedido as PedidoFrappe | undefined;
      if (pd && b.id === pd.base && o.vaso.bombas[b.id] === VASOS[pd.vaso].bombas) m.acierto(this.pos().x, this.pos().y - 220, '¡Justo!');
      return;
    }
    if (dentro(this.rHielo(), x, y)) {
      if (o.vaso.hielo >= 5) return;
      o.vaso.hielo++;
      m.cambioObra();
      sonidos.hielo();
      this.paladas.push(m.reloj);
      return;
    }
    if (dentro(this.rLeche(), x, y)) this.sirviendo = true;
  }

  dibujar(g: G, t: number) {
    const m = this.m, o = this.obra;
    const vs = this.rVasos();
    g.fillStyle = 'rgba(70,45,30,0.3)';
    rr(g, 6, RIEL + 6, 172, vs.length * 128 + 8, 18);
    g.fill();
    for (const r of vs) {
      const act = o?.vaso?.tam === r.tam;
      g.fillStyle = act ? 'rgba(255,226,168,0.95)' : 'rgba(255,248,238,0.8)';
      rr(g, r.x, r.y, r.w, r.h, 14);
      g.fill();
      if (!spr(g, ID_VASO(r.tam), r.x + 46, r.y + r.h - 8, 72)) texto(g, '🥤', r.x + 46, r.y + r.h / 2, { tam: 40 });
      texto(g, `${VASOS[r.tam].onzas} oz`, r.x + 112, r.y + r.h / 2, { tam: 20, color: '#4a2a10' });
    }
    // Botellas con bomba (se hunde la bomba al apretar)
    this.bombazos = this.bombazos.filter((b) => m.reloj - b.t < 0.45);
    for (const b of this.rBombas()) {
      const base = BASE[b.id];
      g.fillStyle = 'rgba(255,248,238,0.78)';
      rr(g, b.x, b.y, b.w, b.h, 16);
      g.fill();
      const ap = this.bombazos.find((x) => x.id === b.id);
      const hundido = ap ? Math.sin(Math.min(1, (m.reloj - ap.t) / 0.3) * Math.PI) * 6 : 0;
      if (!spr(g, `bomba_${b.id}`, b.x + b.w / 2 + 8, b.y + b.h - 26 + hundido * 0.2, 124, { ey: 1 - hundido * 0.01 })) {
        g.fillStyle = base.color;
        rr(g, b.x + b.w / 2 - 30, b.y + 60, 60, 80, 12);
        g.fill();
      }
      texto(g, base.nombre, b.x + b.w / 2, b.y + b.h - 12, { tam: 16, color: '#4a2a10', max: b.w - 8 });
      const n = o?.vaso?.bombas[b.id] ?? 0;
      if (n) {
        g.fillStyle = '#b8434f';
        elipse(g, b.x + b.w - 18, b.y + 18, 15, 15);
        g.fill();
        texto(g, `${n}`, b.x + b.w - 18, b.y + 19, { tam: 17, color: '#fff' });
      }
      if (ap && o?.vaso) {
        const k = (m.reloj - ap.t) / 0.45;
        const pico = punto(`bomba_${b.id}`, 'pico', b.x + b.w / 2 + 8, b.y + b.h - 26, 124);
        const p = this.pos();
        const v = geoDe(o.vaso.tam, p.x, p.y, 300);
        const ex = p.x, ey = yEn(v, v.alto);
        const cx = pico.x + (ex - pico.x) * k, cy = pico.y + (ey - pico.y) * k - Math.sin(k * Math.PI) * 120;
        g.fillStyle = base.color;
        elipse(g, cx, cy, 7, 9);
        g.fill();
      }
    }
    // Hielo y leche
    const h = this.rHielo();
    g.fillStyle = 'rgba(230,246,255,0.8)';
    rr(g, h.x, h.y, h.w, h.h, 18);
    g.fill();
    if (!spr(g, 'hielera_pala', h.x + h.w / 2 - 10, h.y + h.h - 22, 72)) texto(g, '🧊', h.x + h.w / 2, h.y + h.h / 2, { tam: 50 });
    texto(g, `Hielo${o?.vaso ? ` · ${o.vaso.hielo}` : ''}`, h.x + h.w / 2, h.y + h.h - 10, { tam: 18, color: '#2a5a7a' });
    const l = this.rLeche();
    g.fillStyle = this.sirviendo ? 'rgba(255,226,168,0.95)' : 'rgba(255,248,238,0.85)';
    rr(g, l.x, l.y, l.w, l.h, 18);
    g.fill();
    if (!this.sirviendo && !spr(g, 'leche', l.x + l.w / 2, l.y + l.h - 26, 90)) texto(g, '🥛', l.x + l.w / 2, l.y + l.h / 2, { tam: 50 });
    texto(g, 'Leche (mantén)', l.x + l.w / 2, l.y + l.h - 10, { tam: 16, color: '#4a2a10', max: l.w - 10 });
    const p = this.pos();
    if (o?.vaso && o.licuadora < 0 && o.licuado === null) {
      const v = geoDe(o.vaso.tam, p.x, p.y, 300);
      if (this.sirviendo) {
        const bx = p.x - 90, by = yEn(v, v.alto) - 110;
        chorro(g, bx + 30, by + 34, p.x - 4, yEn(v, zNivel(v, o.vaso.leche)) - 2, '#fbfaf4', 13, t);
        spr(g, 'leche', bx, by + 60, 90, { rot: 1.75 });
      }
      // Paladas de hielo que caen al vaso
      this.paladas = this.paladas.filter((x) => m.reloj - x < 0.4);
      for (const pt of this.paladas) {
        const k = (m.reloj - pt) / 0.4;
        for (let i = 0; i < 3; i++) spr(g, `hielo_${i}`, p.x - 30 + i * 30 + (1 - k) * -200, yEn(v, v.alto) - (1 - k) * 200 + Math.sin(k * Math.PI) * -60, 22);
      }
      dibujarVaso(g, o, p.x, p.y, 300, t, { raya: true });
      m.boton(this.rBotar(), '🗑 Botar', '#f0e4d8', { tam: 22, color: '#7a4a3a' });
    } else if (o && (o.licuadora >= 0 || o.licuado !== null)) texto(g, 'Ya está en la licuadora ✓', p.x - 40, p.y - 140, { tam: 22, color: '#fff', borde: '#2f8a3a' });
    else if (o) texto(g, '← Escoge el vaso', p.x - 30, p.y - 140, { tam: 22, color: '#fff', borde: 'rgba(40,30,25,0.7)' });
  }
}

// ---------------------------------------------------------------------------------------------- Licuar
class EstacionLicuar implements Estacion {
  id = 'licuar';
  nombre = 'Licuar';
  icono = 'licuadora_base';
  emoji = '🌀';
  usaTicket = true;
  private sonando = 0;
  constructor(private m: Motor) {}
  private get licuadoras(): (Licuadora | null)[] {
    return this.m.maq.licuadoras;
  }
  private rLicuadora(i: number) {
    const x0 = 16, x1 = this.m.zona.w - 16;
    const w = (x1 - x0) / this.licuadoras.length;
    const cx = x0 + w * (i + 0.5) - 40;
    return {
      cx, by: this.m.H - BARRA - 100, caja: { x: cx - 120, y: RIEL + 30, w: 240, h: this.m.H - RIEL - BARRA - 130 },
      boton: { x: cx - 166, y: this.m.H - BARRA - 86, w: 156, h: 68 }, servir: { x: cx + 10, y: this.m.H - BARRA - 86, w: 156, h: 68 },
    };
  }
  private vel() {
    return (1 / 12) * (1 + 0.25 * this.m.mejora('turbo'));
  }
  alerta() {
    return this.licuadoras.some((l) => l?.andando && l.valor > 0.88);
  }
  fondo(g: G) {
    fondoEstacion(this.m, g, this.m.H - BARRA - 110, { campana: false });
  }

  paso(dt: number) {
    const m = this.m;
    let motor = false;
    this.licuadoras.forEach((l, i) => {
      if (l && !m.s.tickets.some((k) => k.id === l.ticket)) this.licuadoras[i] = null;
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
        m.cambioMaq('licuadoras');
        sonidos.clic();
        if (!l.andando) {
          const tk = m.s.tickets.find((k) => k.id === l.ticket);
          const p = tk?.pedido as PedidoFrappe | undefined;
          if (p && Math.abs(l.valor - LICUADO[p.licuado]) < 0.05) m.acierto(r.cx, RIEL + 120, '¡En su punto!');
        } else m.pistaUnaVez('licuado', 'Páralo cuando la flecha llegue al punto que pide (grueso, normal o cremoso)');
        return;
      }
      if (l && dentro(r.servir, x, y)) {
        if (l.andando) return m.aviso('Primero para la licuadora');
        if (l.valor < 0.08) return m.aviso('Todavía no está licuado');
        const tk = m.s.tickets.find((k) => k.id === l.ticket);
        if (tk) {
          const o = tk.obra as ObraFrappe;
          o.licuado = Math.round(l.valor * 1000) / 1000;
          o.licuadora = -1;
          m.activo = tk;
          m.cambioObra(tk);
        }
        this.licuadoras[i] = null;
        m.cambioMaq('licuadoras');
        sonidos.vertir(0.6);
        m.pistaUnaVez('decorar', 'Ahora ve a «Decorar»: crema, salsas, toppings y pitillo');
        return;
      }
      if (dentro(r.caja, x, y)) {
        if (l) {
          const tk = m.s.tickets.find((k) => k.id === l.ticket);
          if (tk) m.activo = tk;
          return;
        }
        const o = m.activo?.obra as ObraFrappe | undefined;
        if (!o) return m.aviso('Primero toca un pedido del riel de arriba');
        if (o.licuadora >= 0 || o.licuado !== null) return m.aviso('Ese pedido ya pasó por la licuadora');
        if (!o.vaso || o.vaso.leche < 0.2) return m.aviso('Primero prepara el vaso en «Preparar»');
        this.licuadoras[i] = { ticket: m.activo!.id, valor: 0, andando: false, avisado: 0 };
        o.licuadora = i;
        m.cambioMaq('licuadoras');
        m.cambioObra();
        sonidos.vertir(0.5);
        return;
      }
    }
  }

  dibujar(g: G, t: number) {
    const m = this.m;
    this.licuadoras.forEach((l, i) => {
      const r = this.rLicuadora(i);
      const tk = l ? m.s.tickets.find((k) => k.id === l.ticket) : undefined;
      const o = tk?.obra as ObraFrappe | undefined;
      this.dibujarLicuadora(g, r.cx, r.by, l, o?.vaso ?? null, t);
      if (l) {
        const p = tk?.pedido as PedidoFrappe | undefined;
        texto(g, tk ? `Pedido #${tk.numero}` : '—', r.cx, RIEL + 26, { tam: 21, color: '#fff', borde: 'rgba(40,30,25,0.75)' });
        medidor(g, r.cx + 124, RIEL + 70, 26, 250, l.valor, [
          { desde: 0.28, hasta: 0.44, color: '#d8ecc0', etiqueta: p?.licuado === 'grueso' ? 'Grueso ★' : 'Grueso' },
          { desde: 0.52, hasta: 0.68, color: '#bfe8c0', etiqueta: p?.licuado === 'normal' ? 'Normal ★' : 'Normal' },
          { desde: 0.74, hasta: 0.9, color: '#8fd49a', etiqueta: p?.licuado === 'cremoso' ? 'Cremoso ★' : 'Cremoso' },
          { desde: AGUADO, hasta: 1, color: '#f2a0a0' },
        ], m.mejora('alarma') && m.reloj - l.avisado < 1.2 ? m.reloj : undefined);
        m.boton(r.boton, l.andando ? '■ Parar' : '▶ Licuar', l.andando ? '#e8434f' : '#5cc26a', { color: '#fff', tam: 24 });
        m.boton(r.servir, 'Servir ➜', '#ffb627', { tam: 24, apagado: l.andando || l.valor < 0.08 });
      } else texto(g, m.activo ? `Toca para licuar el #${m.activo.numero}` : 'Libre', r.cx, r.by + 6, { tam: 20, color: '#fff', borde: 'rgba(40,30,25,0.75)' });
    });
  }

  private dibujarLicuadora(g: G, x: number, by: number, l: Licuadora | null, v: Vaso | null, t: number) {
    const vib = l?.andando ? Math.sin(t * 70) * 2 : 0;
    const tam = 280;
    sombra(g, x, by, 120, 20, 0.3);
    if (!spr(g, 'licuadora_base', x + vib, by, tam)) {
      g.fillStyle = lineal(g, x - 80, 0, x + 80, 0, [[0, '#2e3336'], [0.5, '#5a6166'], [1, '#2a2e31']]);
      rr(g, x - 80 + vib, by - 80, 160, 80, 18);
      g.fill();
    }
    const geo = geoVaso('licuadora_jarra', x + vib, by, tam, { rb: 0.04, rt: 0.058, alto: 0.19, fondo: 0, elev: 15, ref: 0.19 });
    if (!hay('licuadora_jarra')) geo.z0 = 0.126;
    if (l && v) {
      // Lo de adentro: primero en capas; al licuar se mezcla, gira y se deshace el hielo
      const mezcla = Math.min(1, l.valor * 1.6);
      const cb = colorBase(v);
      const col = mezclar(mezclar(cb, '#f6ede2', 0.5), colorFrappe(v), mezcla);
      const nivel = 0.55 - Math.min(0.08, l.valor * 0.08);
      liquido(g, geo, nivel, col, { t, profundidad: 0.1, espuma: l.andando ? aclarar(col, 0.3) : undefined, ola: l.andando ? Math.sin(t * 20) * 3 : 0 });
      g.save();
      caminoInterior(g, geo, zNivel(geo, 0), zNivel(geo, nivel));
      g.clip();
      const yTop = yEn(geo, zNivel(geo, nivel)), yBot = yEn(geo, zNivel(geo, 0));
      if (mezcla < 0.6) {
        g.fillStyle = `rgba(0,0,0,0)`;
        g.fillStyle = lineal(g, 0, yTop, 0, yBot, [[0, 'rgba(250,247,240,0)'], [0.6, 'rgba(250,247,240,0)'], [0.75, `${cb}`], [1, oscurecer(cb, 0.2)]]);
        g.globalAlpha = 1 - mezcla / 0.6;
        g.fillRect(x - 100, yTop, 200, yBot - yTop);
        g.globalAlpha = 1;
      }
      if (l.andando) {
        // Remolino
        g.strokeStyle = 'rgba(255,255,255,0.4)';
        g.lineWidth = 5;
        for (let i = 0; i < 4; i++) {
          const yy = yBot - 18 - i * ((yBot - yTop) / 4.5);
          const r = radioEn(geo, zNivel(geo, (nivel * (i + 0.5)) / 4.5)) * 0.8;
          g.beginPath();
          g.ellipse(x + vib, yy, r, r * geo.se * 1.4, 0, t * 14 + i, t * 14 + i + 3.6);
          g.stroke();
        }
      }
      // Trocitos de hielo que se van deshaciendo (giran si está andando)
      const trozos = Math.round(Math.max(0, 0.75 - l.valor) * (6 + v.hielo * 3));
      for (let i = 0; i < trozos; i++) {
        const a = i * 2.3 + (l.andando ? t * 9 : 0);
        const r = radioEn(geo, zNivel(geo, 0.2)) * 0.6;
        const s = 7 + (1 - l.valor) * 8;
        const yy = yBot - 14 - ((i * 23) % Math.max(20, yBot - yTop - 20));
        spr(g, `hielo_${i % 3}`, x + vib + Math.cos(a) * r, yy + Math.sin(a) * 6, s, { rot: a });
      }
      g.restore();
    }
    if (!spr(g, 'licuadora_jarra', x + vib, by, tam)) {
      g.strokeStyle = 'rgba(140,170,190,0.95)';
      g.lineWidth = 4;
      caminoInterior(g, geo, zNivel(geo, 0), zNivel(geo, 1), 0);
      g.stroke();
    }
  }
}

// ---------------------------------------------------------------------------------------------- Decorar
class EstacionDecorar implements Estacion {
  id = 'decorar';
  nombre = 'Decorar';
  icono = 'top_cereza';
  emoji = '🍒';
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
    return botonesToppings(TOPS, this.m.rango, 16, RIEL + 16, 3, 92, this.m.H - RIEL - BARRA - 24);
  }
  private pos() {
    return { x: 330 + (this.m.zona.w - 330) / 2 - 30, y: this.m.H - BARRA - 30 };
  }
  private tam() {
    return 300;
  }
  private rCrema(): Rect {
    const p = this.pos();
    return { x: p.x - 330, y: this.m.H - BARRA - 170, w: 150, h: 150 };
  }
  private rPitillos(): (Rect & { id: string })[] {
    const p = this.pos();
    return PITILLOS.filter((q) => q.desde <= this.m.rango).map((q, i) => ({ id: q.id, x: p.x + 170, y: RIEL + 70 + i * 70, w: 190, h: 62 }));
  }
  private rEntregar(): Rect {
    const p = this.pos();
    return { x: p.x + 160, y: this.m.H - BARRA - 88, w: 200, h: 66 };
  }
  private rBotar(): Rect {
    const p = this.pos();
    return { x: p.x + 160, y: this.m.H - BARRA - 164, w: 200, h: 60 };
  }
  private superficie(): Ovalo | null {
    const o = this.obra;
    if (!o || o.licuado === null) return null;
    const p = this.pos();
    return superficieVaso(p.x, p.y, this.tam(), o);
  }
  enMano() {
    return this.herramienta ?? (this.cremando ? 'crema' : null);
  }

  fondo(g: G) {
    fondoEstacion(this.m, g, RIEL + 300);
  }
  paso(dt: number) {
    const o = this.obra;
    if (this.cremando && o) {
      o.crema = Math.min(1.1, o.crema + dt * 0.45);
      this.m.cambioObra();
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
      if (this.cremando && o && m.activo) {
        const p = m.activo.pedido as PedidoFrappe;
        if (p.crema !== 'sin' && Math.abs(o.crema - CREMA[p.crema]) < 0.06) m.acierto(this.pos().x, this.pos().y - 420, '¡Qué copete!');
      }
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
      m.cambioObra();
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
      m.cambioObra();
      sonidos.papel();
      return;
    }
    const s = this.superficie();
    if (this.herramienta && s) {
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
    const c = this.rCrema();
    g.fillStyle = this.cremando ? 'rgba(255,226,168,0.95)' : 'rgba(255,248,238,0.85)';
    rr(g, c.x, c.y, c.w, c.h, 18);
    g.fill();
    if (!this.cremando && !spr(g, 'sifon', c.x + c.w / 2, c.y + c.h - 30, 96)) texto(g, '🍦', c.x + c.w / 2, c.y + 64, { tam: 48 });
    texto(g, 'Crema (mantén)', c.x + c.w / 2, c.y + c.h - 12, { tam: 16, color: '#4a2a10', max: c.w - 8 });
    for (const r of this.rPitillos()) {
      const q = PITILLOS.find((x) => x.id === r.id)!;
      const act = o.pitillo === r.id;
      g.fillStyle = act ? 'rgba(255,226,168,0.95)' : 'rgba(255,248,238,0.85)';
      rr(g, r.x, r.y, r.w, r.h, 14);
      g.fill();
      if (!spr(g, `pitillo_${r.id}`, r.x + 34, r.y + r.h - 6, 60, { rot: Math.PI / 2 - 0.05 })) {
        g.fillStyle = q.color;
        rr(g, r.x + 16, r.y + 14, 14, r.h - 28, 6);
        g.fill();
      }
      texto(g, `Pitillo ${r.id}`, r.x + 120, r.y + r.h / 2 + 2, { tam: 18, color: '#4a2a10' });
    }
    if (o.vaso) {
      const pd = m.activo!.pedido as PedidoFrappe;
      dibujarVaso(g, o, p.x, p.y, this.tam(), t, { guia: m.mejora('guia') ? pd.toppings : undefined });
      const v = geoDe(o.vaso.tam, p.x, p.y, this.tam());
      // Hasta dónde va la crema que pide (con la guía)
      if (o.licuado !== null && pd.crema !== 'sin' && !o.sup.capas.length && m.mejora('guia')) {
        const r = radioEn(v, v.alto);
        rayita(g, p.x - 90, p.x + 90, yEn(v, v.alto) - CREMA[pd.crema] * r * 1.7 * 0.85, 'crema');
      }
      if (this.cremando) {
        const sx = p.x + 10, sy = yEn(v, v.alto) - o.crema * radioEn(v, v.alto) * 1.7 - 150;
        spr(g, 'sifon', sx, sy, 96, { rot: 2.7 });
        if (Math.random() < 0.4) m.fx.salpicar(p.x, sy + 130, '#fffaf2', 1, 0.3);
      }
      if (o.licuado === null) texto(g, o.licuadora >= 0 ? 'Está en la licuadora…' : 'Falta prepararlo y licuarlo', p.x, p.y - 380, { tam: 22, color: '#fff', borde: 'rgba(40,30,25,0.75)' });
    } else texto(g, 'Este pedido no tiene vaso: ve a «Preparar»', p.x, p.y - 180, { tam: 24, color: '#fff', borde: 'rgba(40,30,25,0.7)' });
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
function dibujarTicket(g: G, p: PedidoFrappe, r: Rect) {
  let y = r.y + 8;
  const base = BASE[p.base];
  const vaso: Vaso = { tam: p.vaso, bombas: { [p.base]: VASOS[p.vaso].bombas }, hielo: 0, leche: 0 };
  dibujarVaso(g, { vaso, licuadora: -1, licuado: 0.6, crema: CREMA[p.crema], pitillo: p.pitillo, sup: superficieNueva() }, r.x + 34, y + 96, 70, 0);
  letra(g, `${base.nombre} · ${VASOS[p.vaso].onzas} oz`, r.x + 68, y + 16, { tam: 16, max: r.w - 76 });
  letra(g, `${VASOS[p.vaso].bombas} bombazos · hielo ×${p.hielo}`, r.x + 68, y + 38, { tam: 13, color: '#8a6a58', max: r.w - 76 });
  letra(g, `Licuado ${p.licuado}`, r.x + 68, y + 60, { tam: 15, max: r.w - 76 });
  letra(g, p.crema === 'sin' ? 'Sin crema' : `Crema ${p.crema}`, r.x + 68, y + 82, { tam: 15, max: r.w - 76 });
  y += 106;
  separador(g, r.x + 14, r.x + r.w - 14, y);
  y += 6;
  for (const t of p.toppings) {
    filaTopping(g, t, TOP[t.id], r.x, r.w, y);
    y += 46;
  }
  const pt = PITILLOS.find((q) => q.id === p.pitillo)!;
  if (!spr(g, `pitillo_${p.pitillo}`, r.x + 30, y + 34, 40, { rot: 0.3 })) {
    g.fillStyle = pt.color;
    rr(g, r.x + 28, y + 4, 12, 30, 5);
    g.fill();
  }
  letra(g, `Pitillo ${p.pitillo}`, r.x + 56, y + 18, { tam: 16 });
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
  icono: 'vasofrappe_M',
  tema: { pared: '#bfe3dc', acento: '#2f9e8f', piso: '#e3efe9', oscuro: '#15433d' },
  mejoras: MEJORAS,
  desbloqueos: DESBLOQUEOS,
  maquinas: (mejora) => ({ licuadoras: Array.from({ length: 1 + mejora('licuadoras') }, () => null) }),
  crearEstaciones(m) {
    return [new EstacionPreparar(m), new EstacionLicuar(m), new EstacionDecorar(m)];
  },
  pedido,
  obraNueva: () => ({ vaso: null, licuadora: -1, licuado: null, crema: 0, pitillo: null, sup: superficieNueva() }),
  tiempoIdeal: (p) => 26 + VASOS[p.vaso].bombas * 1.5 + p.hielo * 1.5 + 12 + p.toppings.length * 5,
  dibujarTicket: (g, p, r) => dibujarTicket(g, p, r),
  calificar,
  dibujarPlato(g, t, x, y, esc, m) {
    if (t.obra.vaso) dibujarVaso(g, t.obra, x, y + 150 * esc, 280 * esc, m.reloj + 99);
  },
  /** Para las pruebas automáticas. */
  pruebas: { TOP, VASOS, LICUADO, CREMA, superficieVaso },
} as Receta<PedidoFrappe, ObraFrappe> & { pruebas: unknown };
