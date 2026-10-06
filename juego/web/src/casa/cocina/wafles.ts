// La waflería (estilo Papa's Pancakeria): en la plancha se sirve la masa en las waffleras, se voltean a tiempo y
// se sacan doraditos o tostaditos; en «Armar» se ponen en el plato y se decoran (mantequilla, miel, arequipe,
// frutas donde van, chispitas…) y, desde el rango 3, en «Bebidas» se sirve el jugo hasta la rayita con su hielo.
// En pareja las waffleras y la rejilla son de los dos (uno puede estar en la plancha y el otro armando).
import { colorCoccion, dentro, elipse, G, lineal, Masa, mezclar, oscurecer, radial, Rect, rr, sombra, texto, wafle as wafleDibujado } from './dibujo';
import {
  Aplicador, aUV, botonBotar, botonEntregar, botonesToppings, calificarToppings, dibujarBotonesToppings, dibujarEnMano, dibujarGuia, dibujarSuperficie,
  filaTopping, letra, Ovalo, puntajeCuenta, puntajeNivel, puntajeZona, rayita, separador, Superficie, superficieNueva, ToppingDef, ToppingPedido,
} from './herramientas';
import type { Invitado } from './invitados';
import { BARRA, Categoria, Estacion, Motor, Receta, RIEL, sonidos, Ticket } from './motor';
import { fondoEstacion } from './pantallas';
import { caja, hay, punto, spr } from './sprites';
import type { Desbloqueo, Mejora } from './tipos';
import { chorro, geoVaso, hielos, liquido, yEn, zNivel } from './vasos';

// ---------------------------------------------------------------------------------------------- Ingredientes
const MASAS: (Masa & { desde: number })[] = [
  { id: 'clasica', nombre: 'Clásica', crudo: '#f7e6b8', dorado: '#e9a54e', tostado: '#b5672b', desde: 1 },
  { id: 'chocolate', nombre: 'Chocolate', crudo: '#c09472', dorado: '#7d4b2b', tostado: '#4e2a16', desde: 2 },
  { id: 'red_velvet', nombre: 'Red velvet', crudo: '#ef8f86', dorado: '#bb3f3a', tostado: '#7c2521', desde: 5 },
  { id: 'avena', nombre: 'Avena y canela', crudo: '#f1dcb5', dorado: '#cf9859', tostado: '#9a6432', pintas: '#6e3f1c', desde: 8 },
];
const MASA = Object.fromEntries(MASAS.map((m) => [m.id, m]));
/** La masa cruda (lo que sale de la jarra). */
const CRUDA: Record<string, string> = { clasica: '#f3dea6', chocolate: '#8e5c3d', red_velvet: '#c4433f', avena: '#e6cc98' };
/** Punto de cocción: dónde va la flecha para cada lado. */
const PUNTOS = { doradito: 0.5, tostadito: 0.72 } as const;
type Punto = keyof typeof PUNTOS;

const TOPS: ToppingDef[] = [
  { id: 'mantequilla', nombre: 'Mantequilla', tipo: 'pieza', desde: 1, tam: 0.17 },
  { id: 'miel', nombre: 'Miel', tipo: 'salsa', color: '#eaa51f', desde: 1 },
  { id: 'fresa', nombre: 'Fresas', tipo: 'pieza', desde: 1, tam: 0.14 },
  { id: 'arequipe', nombre: 'Arequipe', tipo: 'salsa', color: '#b8712c', desde: 2 },
  { id: 'chantilly', nombre: 'Crema chantilly', tipo: 'pieza', desde: 2, tam: 0.19 },
  { id: 'banano', nombre: 'Banano', tipo: 'pieza', desde: 3, tam: 0.13 },
  { id: 'chocolate', nombre: 'Chocolate', tipo: 'salsa', color: '#55301f', desde: 3 },
  { id: 'chispitas', nombre: 'Chispitas', tipo: 'polvo', desde: 4 },
  { id: 'arandano', nombre: 'Arándanos', tipo: 'pieza', desde: 4, tam: 0.16 },
  { id: 'leche_condensada', nombre: 'Leche condensada', tipo: 'salsa', color: '#f2dfb0', desde: 5 },
  { id: 'helado', nombre: 'Helado de vainilla', tipo: 'pieza', sabor: 'vainilla', desde: 6, tam: 0.28 },
  { id: 'azucar', nombre: 'Azúcar glas', tipo: 'polvo', desde: 7 },
  { id: 'masmelo', nombre: 'Masmelos', tipo: 'pieza', desde: 9, tam: 0.15 },
  { id: 'kiwi', nombre: 'Kiwi', tipo: 'pieza', desde: 10, tam: 0.14 },
];
const TOP = Object.fromEntries(TOPS.map((t) => [t.id, t]));
/** Cuántas piezas puede pedir de cada una. */
const CUANTAS: Record<string, [number, number]> = {
  mantequilla: [1, 1], helado: [1, 1], chantilly: [1, 5], fresa: [3, 6], banano: [3, 6], arandano: [4, 8], masmelo: [3, 6], kiwi: [3, 5],
};

const BEBIDAS = [
  { id: 'naranja', nombre: 'Jugo de naranja', color: '#ffa228', desde: 3 },
  { id: 'mora', nombre: 'Jugo de mora', color: '#8a2352', desde: 3 },
  { id: 'cafe', nombre: 'Café con leche', color: '#b98556', desde: 4 },
  { id: 'chocolate', nombre: 'Chocolate', color: '#6a3a20', desde: 6 },
  { id: 'lulo', nombre: 'Jugo de lulo', color: '#d3d35a', desde: 8 },
];
const BEBIDA = Object.fromEntries(BEBIDAS.map((b) => [b.id, b]));
type Tam = 'P' | 'M' | 'G';
const TAM: Record<Tam, { nombre: string; vel: number; rb: number; rt: number; alto: number }> = {
  P: { nombre: 'Pequeño', vel: 0.5, rb: 0.028, rt: 0.035, alto: 0.09 },
  M: { nombre: 'Mediano', vel: 0.42, rb: 0.031, rt: 0.04, alto: 0.11 },
  G: { nombre: 'Grande', vel: 0.35, rb: 0.034, rt: 0.045, alto: 0.135 },
};
const LLENO = 0.85;

// ---------------------------------------------------------------------------------------------- Pedido, obra y máquinas
export interface PedidoWafles {
  n: number;
  masa: string;
  punto: Punto;
  toppings: ToppingPedido[];
  bebida?: { sabor: string; tam: Tam; hielo: number };
}
interface WafleHecho {
  id: number;
  masa: string;
  a: number;
  b: number;
}
interface Vaso {
  tam: Tam;
  sabor: string | null;
  nivel: number;
  hielo: number;
  mezcla: boolean;
}
interface ObraWafles {
  wafles: WafleHecho[];
  sup: Superficie;
  vaso: Vaso | null;
}
interface Plancha {
  masa: string | null;
  fase: 'vacia' | 'vertiendo' | 'cocinando' | 'volteando';
  lado: 'a' | 'b';
  a: number;
  b: number;
  t: number;
  avisado: number;
}
const planchaVacia = (): Plancha => ({ masa: null, fase: 'vacia', lado: 'a', a: 0, b: 0, t: 0, avisado: 0 });

function pedido(rango: number, _dia: number, azar: () => number, inv?: Invitado): PedidoWafles {
  const tomar = <T,>(l: T[]) => l[Math.floor(azar() * l.length)];
  const masas = MASAS.filter((m) => m.desde <= rango);
  const pareja = inv?.especial === 'pareja';
  // A Ella le encantan los wafles: pide más y bien decorados
  const n = 1 + (azar() < Math.min(0.6, 0.12 + rango * 0.07) || pareja ? 1 : 0) + (rango >= 6 && azar() < 0.3 ? 1 : 0);
  const punto: Punto = rango >= 3 && azar() < 0.32 ? 'tostadito' : 'doradito';
  const disponibles = TOPS.filter((t) => t.desde <= rango);
  const k = Math.max(1, Math.min(5, disponibles.length, 1 + Math.floor(rango / 3) + (azar() < 0.5 ? 1 : 0) + (pareja ? 1 : 0)));
  const elegidos: ToppingDef[] = [];
  if (pareja && rango >= 2) elegidos.push(TOP.fresa, TOP.chantilly);
  while (elegidos.length < k) {
    const t = tomar(disponibles);
    if (!elegidos.includes(t)) elegidos.push(t);
  }
  // La mantequilla va primero y el helado de último (como se sirve de verdad)
  elegidos.sort((a, b) => (a.id === 'mantequilla' ? -1 : b.id === 'mantequilla' ? 1 : 0) || (a.id === 'helado' ? 1 : b.id === 'helado' ? -1 : 0));
  const toppings = elegidos.slice(0, Math.max(k, elegidos.length)).map((t): ToppingPedido => {
    if (t.tipo !== 'pieza') return { id: t.id };
    const [a, b] = CUANTAS[t.id] ?? [1, 1];
    return { id: t.id, n: a + Math.floor(azar() * (b - a + 1)) };
  });
  const p: PedidoWafles = { n, masa: tomar(masas).id, punto, toppings };
  if (rango >= 3 && azar() < Math.min(0.8, 0.4 + (rango - 3) * 0.06)) {
    p.bebida = { sabor: tomar(BEBIDAS.filter((b) => b.desde <= rango)).id, tam: tomar(['P', 'M', 'G'] as Tam[]), hielo: rango >= 5 ? Math.floor(azar() * 4) : 0 };
  }
  return p;
}

let contador = 0;
/** Ids que no chocan entre los que cocinan juntos (cada puesto de la sala con su propio rango de números). */
const idWafle = (puesto: number) => (puesto + 1) * 100000000 + ((Date.now() % 1000000) * 100 + (contador++ % 100));

// ---------------------------------------------------------------------------------------------- El wafle dibujado
const ETAPAS = [0, 0.5, 0.72, 1];
/** El wafle con su punto de cocción (mezcla los recortes de cada etapa: crudo, doradito, tostadito, quemado). */
export function dibujarWafle(g: G, masa: string, coccion: number, x: number, y: number, r: number, alfa = 1) {
  const c = Math.max(0, Math.min(1, coccion));
  let i = 0;
  while (i < ETAPAS.length - 2 && c > ETAPAS[i + 1]) i++;
  const k = (c - ETAPAS[i]) / (ETAPAS[i + 1] - ETAPAS[i]);
  const a = `wafle_${masa}_${i}`, b = `wafle_${masa}_${i + 1}`;
  if (!hay(a)) return wafleDibujado(g, x, y, r, MASA[masa] ?? MASAS[0], c);
  g.globalAlpha = alfa;
  spr(g, a, x, y, r);
  if (k > 0.02) spr(g, b, x, y, r, { alfa: k });
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------------------------------------- Lo compartido de la cocina
class Cocina {
  /** (local) la jarra en la mano y el wafle escogido de la rejilla. */
  jarra: string | null = null;
  elegido = 0;
  /** (local) wafles que vuelan de la wafflera a la rejilla. */
  vuelos: { id: number; x: number; y: number; t0: number }[] = [];
  constructor(public m: Motor) {}
  get planchas(): Plancha[] {
    return this.m.maq.planchas;
  }
  get rejilla(): WafleHecho[] {
    return this.m.maq.rejilla;
  }
  get vel() {
    return (1 / 14) * (1 + 0.25 * this.m.mejora('turbo'));
  }
}

/** La rejilla con los wafles listos (abajo en la plancha y en armar). */
function rectsRejilla(m: Motor, x0: number): Rect[] {
  const y = m.H - BARRA - 122, fin = m.zona.x + m.zona.w - 118;
  const n = Math.max(1, Math.floor((fin - x0) / 112));
  return Array.from({ length: Math.min(8, n) }, (_, i) => ({ x: x0 + i * 112, y, w: 104, h: 104 }));
}
const rectBasura = (m: Motor): Rect => ({ x: m.zona.x + m.zona.w - 106, y: m.H - BARRA - 128, w: 92, h: 118 });

function dibujarRejilla(g: G, c: Cocina, m: Motor, x0: number) {
  const rs = rectsRejilla(m, x0);
  const y = rs[0].y + 74;
  // La rejilla cromada: punta izquierda, el medio repetido y la punta derecha
  sombra(g, x0 + (rs.length * 112) / 2, y + 6, rs.length * 60, 14, 0.22);
  let ok = spr(g, 'rejilla_izq', x0 - 4, y, 112);
  for (let i = 0; i < rs.length && ok; i++) spr(g, 'rejilla_medio', x0 + 52 + i * 112, y, 112);
  if (ok) spr(g, 'rejilla_der', x0 + 108 + (rs.length - 1) * 112, y, 112);
  else {
    g.fillStyle = 'rgba(60,50,45,0.35)';
    rr(g, x0 - 10, rs[0].y - 6, rs.length * 112 + 12, 112, 16);
    g.fill();
    ok = true;
  }
  rs.forEach((r, i) => {
    const w = c.rejilla[i];
    if (!w) return;
    const sel = c.elegido === w.id;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 6 - (sel ? 12 : 0);
    if (c.vuelos.some((v) => v.id === w.id)) return;
    if (sel) {
      g.fillStyle = 'rgba(255,190,60,0.4)';
      elipse(g, cx, cy + 10, 54, 30);
      g.fill();
    }
    dibujarWafle(g, w.masa, (w.a + w.b) / 2, cx, cy, 46);
  });
  // Wafles que vienen volando de la plancha
  for (const v of c.vuelos) {
    const i = c.rejilla.findIndex((w) => w.id === v.id);
    const w = c.rejilla[i];
    const k = Math.min(1, (m.reloj - v.t0) / 0.5);
    if (!w || i < 0 || i >= rs.length) continue;
    const r = rs[i];
    const tx = r.x + r.w / 2, ty = r.y + r.h / 2 + 6;
    const x = v.x + (tx - v.x) * k, yy = v.y + (ty - v.y) * k - Math.sin(k * Math.PI) * 120;
    dibujarWafle(g, w.masa, (w.a + w.b) / 2, x, yy, 46 + 30 * (1 - k));
  }
  c.vuelos = c.vuelos.filter((v) => m.reloj - v.t0 < 0.5);
  texto(g, 'Rejilla', x0 + 6, rs[0].y - 6, { tam: 18, color: '#fff', alinear: 'left', borde: 'rgba(40,30,25,0.7)' });
  // Caneca para botar
  const b = rectBasura(m);
  if (!spr(g, 'caneca', b.x + b.w / 2, b.y + b.h - 4, 108)) texto(g, '🗑', b.x + b.w / 2, b.y + b.h / 2 + 10, { tam: 34 });
}

/** Toque en la rejilla o en la caneca. Devuelve el wafle tocado (si hay). */
function tocarRejilla(c: Cocina, m: Motor, x0: number, x: number, y: number): WafleHecho | null {
  if (dentro(rectBasura(m), x, y)) {
    const i = c.rejilla.findIndex((w) => w.id === c.elegido);
    if (i >= 0) {
      c.rejilla.splice(i, 1);
      c.elegido = 0;
      m.cambioMaq('rejilla');
      sonidos.papel();
      m.flotar('A la basura', x, y - 30, '#ffd0d0', 24);
    } else m.aviso('Toca un wafle de la rejilla y luego la caneca para botarlo');
    return null;
  }
  const i = rectsRejilla(m, x0).findIndex((r) => dentro(r, x, y));
  return i >= 0 ? c.rejilla[i] ?? null : null;
}

// ---------------------------------------------------------------------------------------------- Plancha
class EstacionPlancha implements Estacion {
  id = 'plancha';
  nombre = 'Plancha';
  icono = 'wafflera';
  emoji = '🧇';
  private sonando = 0;
  private vapor = 0;
  constructor(private c: Cocina, private m: Motor) {}

  private jarras(): (Rect & { id: string })[] {
    const ms = MASAS.filter((x) => x.desde <= this.m.rango);
    const h = Math.min(122, (this.m.H - RIEL - BARRA - 150) / ms.length);
    return ms.map((x, i) => ({ id: x.id, x: 14, y: RIEL + 16 + i * h, w: 214, h: h - 8 }));
  }
  private planchaRect(i: number) {
    const x0 = 250, x1 = this.m.zona.w - 16;
    const n = this.c.planchas.length;
    const w = (x1 - x0) / n;
    const cx = x0 + w * (i + 0.5) + 14, cy = RIEL + 182;
    const r = Math.min(104, w * 0.3);
    return { cx, cy, r, caja: { x: cx - w / 2 + 6, y: RIEL + 40, w: w - 12, h: 300 } };
  }

  alerta() {
    return this.c.planchas.some((p) => p.fase === 'cocinando' && this.valor(p) > 0.8);
  }
  enMano() {
    return this.c.jarra;
  }
  private valor(p: Plancha) {
    return p.lado === 'a' ? p.a : p.b;
  }

  fondo(g: G) {
    fondoEstacion(this.m, g, RIEL + 300, { campana: true });
  }

  paso(dt: number) {
    const c = this.c, m = this.m;
    let cocinando = false;
    c.planchas.forEach((p, i) => {
      p.t += dt;
      if (p.fase === 'vertiendo' && p.t > 0.8) {
        p.fase = 'cocinando';
        p.t = 0;
      }
      if (p.fase === 'volteando' && p.t > 0.5) {
        p.fase = 'cocinando';
        p.t = 0;
      }
      if (p.fase !== 'cocinando') return;
      cocinando = true;
      const antes = this.valor(p);
      const v = Math.min(1.2, antes + c.vel * dt);
      if (p.lado === 'a') p.a = v;
      else p.b = v;
      // Alarma de punto (mejora): suena al llegar a doradito y a tostadito
      if (m.mejora('alarma')) {
        for (const meta of [PUNTOS.doradito, PUNTOS.tostadito])
          if (antes < meta && v >= meta) {
            sonidos.alarma();
            p.avisado = m.reloj;
          }
      }
      if (antes < 0.9 && v >= 0.9) {
        sonidos.quemado();
        m.chef('susto', 2);
        if (m.actual !== 1) m.aviso('¡Se está quemando un wafle en la plancha!');
      }
      if (m.actual === 1) {
        const r = this.planchaRect(i);
        if (v > 0.86 && Math.random() < dt * (v > 0.95 ? 10 : 5)) m.humo(r.cx + (Math.random() - 0.5) * r.r, r.cy - r.r * 0.4, v > 0.95);
        else if (Math.random() < dt * 3) m.fx.vapor(r.cx + (Math.random() - 0.5) * r.r * 1.6, r.cy - r.r * 0.2, 1, 0.8);
      }
    });
    if (cocinando && m.actual === 1) {
      this.sonando -= dt;
      if (this.sonando <= 0) {
        sonidos.chisporroteo();
        this.sonando = 0.45;
      }
    }
    void this.vapor;
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    if (tipo !== 'bajar') return;
    const c = this.c, m = this.m;
    const j = this.jarras().find((r) => dentro(r, x, y));
    if (j) {
      c.jarra = c.jarra === j.id ? null : j.id;
      sonidos.clic();
      m.pistaUnaVez('jarra', 'Ahora toca una wafflera vacía para servir la masa');
      return;
    }
    for (let i = 0; i < c.planchas.length; i++) {
      const r = this.planchaRect(i);
      if (!dentro(r.caja, x, y)) continue;
      const p = c.planchas[i];
      if (p.fase === 'vacia') {
        if (!c.jarra) return m.aviso('Primero toca una jarra de masa (a la izquierda)');
        Object.assign(p, { masa: c.jarra, fase: 'vertiendo', lado: 'a', a: 0, b: 0, t: 0 });
        sonidos.vertir(0.7);
        m.pistaUnaVez('voltear', 'Cuando la flecha llegue a la rayita, toca la wafflera para voltearla');
      } else if (p.fase === 'cocinando' && p.lado === 'a') {
        p.lado = 'b';
        p.fase = 'volteando';
        p.t = 0;
        sonidos.volteo();
        if (Math.abs(p.a - PUNTOS.doradito) < 0.05 || Math.abs(p.a - PUNTOS.tostadito) < 0.05) m.acierto(r.cx, r.cy - r.r, '¡En su punto!');
        m.pistaUnaVez('sacar', 'Y cuando el otro lado llegue a la rayita, tócala otra vez para sacarlo');
      } else if (p.fase === 'cocinando' && p.lado === 'b') {
        if (c.rejilla.length >= 8) return m.aviso('La rejilla está llena: bota o usa algún wafle');
        const w: WafleHecho = { id: idWafle(m.puesto), masa: p.masa!, a: Math.round(Math.min(1, p.a) * 1000) / 1000, b: Math.round(Math.min(1, p.b) * 1000) / 1000 };
        c.rejilla.push(w);
        c.vuelos.push({ id: w.id, x: r.cx, y: r.cy, t0: m.reloj });
        Object.assign(p, planchaVacia());
        m.cambioMaq('rejilla');
        sonidos.pop();
        if (Math.abs(w.b - PUNTOS.doradito) < 0.05 || Math.abs(w.b - PUNTOS.tostadito) < 0.05) m.acierto(r.cx, r.cy - r.r - 20, '¡Listo!');
        else m.flotar('¡Listo!', r.cx, r.cy - r.r - 20, '#fff3c4');
        m.pistaUnaVez('armar', 'Ve a «Armar» para ponerlo en el plato y decorarlo');
      } else return;
      m.cambioMaq('planchas');
      return;
    }
    const w = tocarRejilla(c, m, 250, x, y);
    if (w) {
      c.elegido = c.elegido === w.id ? 0 : w.id;
      sonidos.clic();
    }
  }

  dibujar(g: G, t: number) {
    const c = this.c, m = this.m;
    // Jarras de masa en su repisa
    const js = this.jarras();
    if (js.length) {
      const y0 = js[0].y - 8, y1 = js[js.length - 1].y + js[js.length - 1].h + 8;
      g.fillStyle = 'rgba(70,45,30,0.35)';
      rr(g, 6, y0, 230, y1 - y0, 18);
      g.fill();
    }
    for (const j of js) {
      const act = c.jarra === j.id;
      g.fillStyle = act ? 'rgba(255,226,168,0.95)' : 'rgba(255,248,238,0.8)';
      rr(g, j.x, j.y, j.w, j.h, 16);
      g.fill();
      if (act) {
        g.strokeStyle = '#ffb627';
        g.lineWidth = 4;
        rr(g, j.x, j.y, j.w, j.h, 16);
        g.stroke();
      }
      const tam = Math.min(1, j.h / 110) * 92;
      if (!spr(g, `jarra_${j.id}`, j.x + 62, j.y + j.h - 8 - (act ? 6 : 0), tam)) {
        g.fillStyle = CRUDA[j.id];
        rr(g, j.x + 34, j.y + 20, 52, j.h - 36, 10);
        g.fill();
      }
      texto(g, MASA[j.id].nombre, j.x + 160, j.y + j.h / 2, { tam: 20, color: '#4a2a10', max: 100 });
    }
    // Waffleras
    c.planchas.forEach((p, i) => {
      const r = this.planchaRect(i);
      this.dibujarWafflera(g, p, r.cx, r.cy, r.r, t, i);
      const bw = Math.min(236, r.caja.w - 24), bx = r.cx - bw / 2, by = r.cy + r.r + 56;
      this.medidorLado(g, p, bx, by, bw);
    });
    dibujarRejilla(g, c, m, 250);
  }

  private dibujarWafflera(g: G, p: Plancha, x: number, y: number, r: number, t: number, i: number) {
    const volteo = p.fase === 'volteando' ? Math.cos(Math.min(1, p.t / 0.5) * Math.PI) : 1;
    const ey = Math.max(0.06, Math.abs(volteo));
    const c = this.c;
    const hayRecorte = hay('wafflera');
    sombra(g, x + 6, y + r * 0.95, r * 1.6, r * 0.32, 0.32);
    if (hayRecorte) spr(g, 'wafflera', x, y, r, { ey });
    else {
      g.fillStyle = radial(g, x - r * 0.3, y - r * 0.3, r * 0.1, r * 1.3, [[0, '#5a5a5a'], [1, '#1c1c1c']]);
      elipse(g, x, y, r * 1.18, r * 1.18 * 0.62 * ey);
      g.fill();
    }
    if (p.fase === 'vertiendo') {
      // La jarra se inclina y la masa se riega por la cuadrícula
      const k = Math.min(1, p.t / 0.7);
      g.save();
      g.beginPath();
      g.ellipse(x, y, r * 1.0, r * 0.62, 0, 0, Math.PI * 2);
      g.clip();
      const col = CRUDA[p.masa!];
      g.fillStyle = radial(g, x - r * 0.2, y - r * 0.2, 4, r * k, [[0, mezclar(col, '#ffffff', 0.25)], [0.7, col], [1, oscurecer(col, 0.1)]]);
      g.beginPath();
      g.ellipse(x, y, r * 0.98 * k, r * 0.6 * k, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.beginPath();
      g.ellipse(x - r * 0.25 * k, y - r * 0.18 * k, r * 0.3 * k, r * 0.1 * k, -0.2, 0, Math.PI * 2);
      g.fill();
      g.restore();
      if (p.t < 0.6) {
        const jx = x + r * 0.5, jy = y - r * 1.25;
        chorro(g, jx - 18, jy + 24, x, y - 4, CRUDA[p.masa!], 12, t);
        spr(g, `jarra_${p.masa}`, jx + 20, jy + 30, 74, { rot: -1.1 });
      }
    } else if (p.fase === 'cocinando' || p.fase === 'volteando') {
      // Se ve el lado que se está cocinando (en el volteo, el otro aparece a la mitad)
      const lado = p.fase === 'volteando' && p.t < 0.25 ? 'a' : p.lado;
      const v = lado === 'a' ? p.a : p.b;
      g.save();
      g.translate(x, y);
      g.scale(1, ey);
      g.translate(-x, -y);
      dibujarWafle(g, p.masa!, v, x, y - r * 0.04, r * 0.96);
      if (v > 0.86) {
        g.fillStyle = `rgba(255,${v > 0.95 ? 40 : 110},20,${0.12 + 0.1 * Math.sin(t * 10)})`;
        elipse(g, x, y, r * 1.05, r * 0.65);
        g.fill();
      }
      spr(g, 'wafflera_tapa', x, y, r);
      g.restore();
      if (this.m.mejora('alarma') && this.m.reloj - p.avisado < 1.2) {
        g.strokeStyle = `rgba(92,194,106,${0.85 - (this.m.reloj - p.avisado) * 0.6})`;
        g.lineWidth = 7;
        elipse(g, x, y, r * 1.45, r * 0.95);
        g.stroke();
      }
      // Etiqueta de lado
      g.fillStyle = 'rgba(40,24,16,0.75)';
      rr(g, x - 30, y + r * 0.64 - 4, 60, 24, 12);
      g.fill();
      texto(g, lado === 'a' ? 'Lado 1' : 'Lado 2', x, y + r * 0.64 + 8, { tam: 14, color: '#fff3d6', peso: 800 });
    } else if (c.jarra) {
      // Vacía y con una jarra en la mano: invita a servir
      const k = 0.5 + 0.5 * Math.sin(t * 5 + i);
      g.strokeStyle = `rgba(255,214,120,${0.4 + 0.5 * k})`;
      g.lineWidth = 4;
      g.setLineDash([10, 8]);
      elipse(g, x, y, r * 1.08, r * 0.68);
      g.stroke();
      g.setLineDash([]);
      texto(g, 'Toca para servir', x, y + r * 0.95 + 8, { tam: 17, color: '#fff', borde: 'rgba(40,30,25,0.75)', peso: 800 });
    }
    void caja;
  }

  private medidorLado(g: G, p: Plancha, x: number, y: number, w: number) {
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.3)';
    g.shadowBlur = 6;
    g.fillStyle = '#3b2a22';
    rr(g, x - 5, y - 5, w + 10, 34, 13);
    g.fill();
    g.restore();
    const zonas: [number, number, string, string][] = [[0, 0.4, '#f6e7c6', '#efd9a8'], [0.4, 0.6, '#f6c86a', '#e7a935'], [0.6, 0.82, '#c7853f', '#a8652a'],
      [0.82, 1, '#4a2a1a', '#2a1810']];
    g.save();
    rr(g, x, y, w, 24, 9);
    g.clip();
    for (const [a, b, c1, c2] of zonas) {
      g.fillStyle = lineal(g, 0, y, 0, y + 24, [[0, c1], [1, c2]]);
      g.fillRect(x + w * a, y, w * (b - a), 24);
    }
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.fillRect(x, y + 2, w, 5);
    g.restore();
    for (const [k, l] of [[PUNTOS.doradito, 'D'], [PUNTOS.tostadito, 'T']] as const) {
      g.fillStyle = '#ffffff';
      g.fillRect(x + w * k - 2, y - 6, 4, 36);
      texto(g, l, x + w * k, y - 16, { tam: 16, color: '#fff', borde: '#3b2a22' });
    }
    if (p.fase === 'cocinando' || p.fase === 'volteando') {
      const v = Math.min(1, p.lado === 'a' ? p.a : p.b);
      g.fillStyle = '#e8434f';
      g.strokeStyle = '#fff';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + w * v, y + 26);
      g.lineTo(x + w * v - 11, y + 44);
      g.lineTo(x + w * v + 11, y + 44);
      g.closePath();
      g.fill();
      g.stroke();
      if (p.lado === 'b') texto(g, `(el lado 1 quedó en ${Math.round(Math.min(1, p.a) * 100)})`, x + w / 2, y + 58, { tam: 14, color: '#fff', borde: 'rgba(40,30,25,0.7)', max: w });
    }
  }
}

// ---------------------------------------------------------------------------------------------- Armar
function ovaloPlato(m: Motor): Ovalo {
  const x0 = 320, x1 = m.zona.w;
  const rx = Math.min(214, (x1 - x0) / 2 - 20);
  return { x: (x0 + x1) / 2, y: RIEL + 196, rx, ry: rx * 0.62 };
}
/** La superficie del wafle de arriba (donde caen los toppings). */
function superficieDe(o: Ovalo, n: number): Ovalo {
  const r = o.rx * 0.72;
  return { x: o.x, y: o.y - Math.max(0, n - 1) * 15 - r * 0.62 * 0.2, rx: r * 0.86, ry: r * 0.62 * 0.86 };
}

function dibujarPlatoWafles(g: G, obra: ObraWafles, o: Ovalo, ahora: number, guia?: ToppingPedido[]) {
  if (!spr(g, 'plato', o.x, o.y, o.rx)) {
    g.fillStyle = '#fffaf2';
    elipse(g, o.x, o.y, o.rx, o.ry);
    g.fill();
  }
  const r = o.rx * 0.72;
  obra.wafles.forEach((w, i) => dibujarWafle(g, w.masa, (w.a + w.b) / 2, o.x, o.y - i * 15 - r * 0.06, r));
  if (!obra.wafles.length) return;
  const s = superficieDe(o, obra.wafles.length);
  if (guia) dibujarGuia(g, guia, TOP, s);
  dibujarSuperficie(g, obra.sup, s, TOP, ahora);
}

class EstacionArmar implements Estacion {
  id = 'armar';
  nombre = 'Armar';
  icono = 'plato';
  emoji = '🍓';
  usaTicket = true;
  private herramienta: string | null = null;
  private aplicador = new Aplicador(TOP);
  private aplicando = false;
  private confirmar = 0;
  constructor(private c: Cocina, private m: Motor) {}

  private botones() {
    return botonesToppings(TOPS, this.m.rango, 16, RIEL + 16, 3, 92, this.m.H - RIEL - BARRA - 150);
  }
  private get obra(): ObraWafles | null {
    return (this.m.activo?.obra as ObraWafles) ?? null;
  }
  private rEntregar(): Rect {
    const o = ovaloPlato(this.m);
    return { x: o.x + o.rx - 170, y: o.y + o.ry + 14, w: 200, h: 66 };
  }
  private rBotar(): Rect {
    const o = ovaloPlato(this.m);
    return { x: o.x - o.rx - 30, y: o.y + o.ry + 14, w: 124, h: 66 };
  }
  enMano() {
    return this.herramienta;
  }

  fondo(g: G) {
    fondoEstacion(this.m, g, RIEL + 230);
  }
  paso() {}

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m, c = this.c;
    const obra = this.obra;
    const o = ovaloPlato(m);
    if (tipo === 'mover') {
      if (this.aplicando && obra && this.aplicador.mover(aUV(superficieDe(o, obra.wafles.length), x, y), m.reloj)) m.cambioObra();
      return;
    }
    if (tipo === 'subir') {
      this.aplicando = false;
      this.aplicador.subir();
      return;
    }
    const b = this.botones().find((r) => dentro(r, x, y));
    if (b) {
      this.herramienta = this.herramienta === b.id ? null : b.id;
      sonidos.clic();
      return;
    }
    if (!obra) return m.aviso('Primero toca un pedido del riel de arriba');
    if (dentro(this.rEntregar(), x, y)) {
      if (!obra.wafles.length) return m.aviso('El plato está vacío: toca un wafle de la rejilla');
      const pd = m.activo!.pedido as PedidoWafles;
      if (pd.bebida && !obra.vaso?.sabor && m.reloj - this.confirmar > 3) {
        this.confirmar = m.reloj;
        return m.aviso('¡Falta la bebida! Toca «Entregar» otra vez para mandarlo así');
      }
      this.herramienta = null;
      m.entregar(m.activo!);
      return;
    }
    if (dentro(this.rBotar(), x, y)) {
      if (!obra.wafles.length && !obra.sup.capas.length) return;
      obra.wafles = [];
      obra.sup = superficieNueva();
      m.cambioObra();
      sonidos.papel();
      m.flotar('Plato limpio', o.x, o.y - 60, '#ffd0d0', 26);
      return;
    }
    // Wafle de la rejilla al plato
    const w = tocarRejilla(c, m, 320, x, y);
    if (w) {
      if (obra.sup.capas.length) return m.aviso('Ya empezaste a decorar: los wafles van antes que los toppings');
      if (obra.wafles.length >= 4) return m.aviso('No caben más wafles');
      c.rejilla.splice(c.rejilla.indexOf(w), 1);
      obra.wafles.push(w);
      c.elegido = 0;
      m.cambioMaq('rejilla');
      m.cambioObra();
      sonidos.pop();
      m.fx.migas(o.x, o.y - 20, '#e9b158', 6);
      m.pistaUnaVez('toppings', 'Escoge un topping a la izquierda y ponlo en el wafle como dice el tiquete');
      return;
    }
    if (this.herramienta && obra.wafles.length) {
      const s = superficieDe(o, obra.wafles.length);
      const r = this.aplicador.bajar(obra.sup, this.herramienta, aUV(s, x, y), m.reloj);
      if (r) {
        m.cambioObra();
        this.aplicando = r !== 'pieza';
        if (r === 'pieza') sonidos.pop();
        else if (r === 'salsa') sonidos.vertir(0.3);
        else sonidos.papel();
      }
    } else if (this.herramienta && Math.hypot((x - o.x) / o.rx, (y - o.y) / o.ry) < 1) m.aviso('Primero pon un wafle en el plato');
  }

  dibujar(g: G, t: number) {
    const m = this.m;
    dibujarBotonesToppings(g, this.botones(), TOP, this.herramienta);
    const o = ovaloPlato(m);
    const obra = this.obra;
    if (obra) {
      const pd = m.activo!.pedido as PedidoWafles;
      dibujarPlatoWafles(g, obra, o, t, m.mejora('guia') ? pd.toppings : undefined);
      if (!obra.wafles.length) texto(g, 'Toca un wafle de la rejilla ↓', o.x, o.y, { tam: 24, color: '#7a6a60', borde: 'rgba(255,255,255,0.8)' });
      botonEntregar(g, this.rEntregar());
      botonBotar(g, this.rBotar());
      if (obra.vaso?.sabor) dibujarVaso(g, obra.vaso, o.x + o.rx + 30, o.y + o.ry * 0.6, 0.55, t);
    } else {
      spr(g, 'plato', o.x, o.y, o.rx);
      texto(g, 'Toca un pedido del riel', o.x, o.y, { tam: 26, color: '#7a6a60', borde: 'rgba(255,255,255,0.8)' });
    }
    if (this.herramienta) {
      const d = TOP[this.herramienta];
      texto(g, `En la mano: ${d.nombre}${d.tipo === 'salsa' ? ' (arrastra para chorrear)' : d.tipo === 'polvo' ? ' (arrastra para espolvorear)' : ' (toca donde va)'}`, o.x, RIEL + 26,
        { tam: 20, color: '#fff', borde: 'rgba(40,30,25,0.85)', max: m.zona.w - 340 });
      if (m.dedo && this.aplicador.enUso) dibujarEnMano(g, d, m.dedo.x, m.dedo.y, t);
    }
    dibujarRejilla(g, this.c, m, 320);
  }
}

// ---------------------------------------------------------------------------------------------- Bebidas
class EstacionBebidas implements Estacion {
  id = 'bebidas';
  nombre = 'Bebidas';
  icono = 'vaso_M';
  emoji = '🥤';
  usaTicket = true;
  private chorro: string | null = null;
  private sonando = 0;
  /** Dónde está el vaso (se corre debajo de la llave que se usa). */
  private vasoX = 0;
  private ultimaLlave = '';
  constructor(private m: Motor) {}

  private get vaso(): Vaso | null {
    return (this.m.activo?.obra as ObraWafles)?.vaso ?? null;
  }
  private rVasos(): (Rect & { tam: Tam })[] {
    return (['P', 'M', 'G'] as Tam[]).map((tam, i) => ({ tam, x: 16 + i * 96, y: RIEL + 40, w: 90, h: 230 }));
  }
  private rLlaves(): (Rect & { id: string })[] {
    const bs = BEBIDAS.filter((b) => b.desde <= this.m.rango);
    const x0 = 330, x1 = this.m.zona.w - 210;
    const w = Math.min(150, (x1 - x0) / bs.length);
    const xi = x0 + ((x1 - x0) - w * bs.length) / 2;
    return bs.map((b, i) => ({ id: b.id, x: xi + i * w + 4, y: RIEL + 16, w: w - 8, h: 270 }));
  }
  /** Tamaño del tanque para que quepa entero (ancho y alto) en su espacio. */
  private tamTanque(r: Rect) {
    return Math.min(r.w * 0.32, r.h * 0.17, 52);
  }
  private rHielo(): Rect {
    return { x: this.m.zona.w - 192, y: RIEL + 130, w: 176, h: 150 };
  }
  private rBotar(): Rect {
    return { x: this.m.zona.w - 192, y: RIEL + 300, w: 176, h: 64 };
  }
  private posVaso() {
    const ll = this.rLlaves();
    const r = ll.find((x) => x.id === this.ultimaLlave) ?? ll[Math.floor(ll.length / 2)];
    const meta = r ? r.x + r.w / 2 : 500;
    if (!this.vasoX) this.vasoX = meta;
    return { x: this.vasoX, meta, y: this.m.H - BARRA - 36 };
  }
  enMano() {
    return this.chorro;
  }

  fondo(g: G) {
    fondoEstacion(this.m, g, this.m.H - BARRA - 150);
  }

  paso(dt: number) {
    const p = this.posVaso();
    this.vasoX += (p.meta - this.vasoX) * Math.min(1, dt * 10);
    const v = this.vaso;
    if (!this.chorro || !v) return;
    if (Math.abs(this.vasoX - p.meta) > 6) return;
    const cerca = this.m.mejora('dispensador') && Math.abs(v.nivel - LLENO) < 0.12 ? 0.45 : 1;
    v.nivel = Math.min(1.08, v.nivel + TAM[v.tam].vel * dt * cerca);
    if (v.sabor && v.sabor !== this.chorro) v.mezcla = true;
    v.sabor = this.chorro;
    this.m.cambioObra();
    this.sonando -= dt;
    if (this.sonando <= 0) {
      sonidos.vertir(0.3);
      this.sonando = 0.28;
    }
    if (v.nivel >= 1.05) {
      this.chorro = null;
      this.m.aviso('¡Se regó!');
      this.m.fx.salpicar(p.x, p.y - 150, BEBIDA[v.sabor].color, 12);
    }
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m;
    if (tipo === 'subir') {
      if (this.chorro && this.vaso && Math.abs(this.vaso.nivel - LLENO) < 0.035) m.acierto(this.posVaso().x, this.m.H - BARRA - 220, '¡Exacto!');
      this.chorro = null;
      return;
    }
    if (tipo !== 'bajar') return;
    const obra = m.activo?.obra as ObraWafles | undefined;
    if (!obra) return m.aviso('Primero toca un pedido del riel de arriba');
    const rv = this.rVasos().find((r) => dentro(r, x, y));
    if (rv) {
      if (obra.vaso?.sabor) return m.aviso('Ya hay un vaso servido: bótalo primero si quieres otro');
      obra.vaso = { tam: rv.tam, sabor: null, nivel: 0, hielo: 0, mezcla: false };
      m.cambioObra();
      sonidos.pop();
      return;
    }
    const ll = this.rLlaves().find((r) => dentro(r, x, y));
    if (ll) {
      if (!obra.vaso) return m.aviso('Primero escoge un vaso (a la izquierda)');
      this.chorro = ll.id;
      this.ultimaLlave = ll.id;
      return;
    }
    if (dentro(this.rHielo(), x, y)) {
      if (!obra.vaso) return m.aviso('Primero escoge un vaso');
      if (obra.vaso.hielo >= 4) return;
      obra.vaso.hielo++;
      m.cambioObra();
      sonidos.hielo();
      const p = this.posVaso();
      m.fx.salpicar(p.x, p.y - 120, obra.vaso.sabor ? BEBIDA[obra.vaso.sabor].color : '#cfe8ff', 6, 0.7);
      return;
    }
    if (dentro(this.rBotar(), x, y) && obra.vaso) {
      obra.vaso = null;
      m.cambioObra();
      sonidos.papel();
    }
  }

  dibujar(g: G, t: number) {
    const m = this.m;
    // Repisa con los vasos limpios
    g.fillStyle = 'rgba(70,45,30,0.3)';
    rr(g, 8, RIEL + 30, 304, 252, 18);
    g.fill();
    for (const r of this.rVasos()) {
      if (!spr(g, `vaso_${r.tam}`, r.x + r.w / 2, r.y + r.h - 44, 150)) dibujarVaso(g, { tam: r.tam, sabor: null, nivel: 0, hielo: 0, mezcla: false }, r.x + r.w / 2, r.y + r.h - 44, 0.9, t);
      texto(g, TAM[r.tam].nombre, r.x + r.w / 2, r.y + r.h - 18, { tam: 15, color: '#fff', borde: 'rgba(40,30,25,0.7)', max: r.w - 4 });
    }
    // La máquina de jugos: un tanque por sabor, sobre su repisa de acero
    const ll = this.rLlaves();
    if (ll.length) {
      const a = ll[0], z = ll[ll.length - 1];
      const ry = a.y + a.h, x0 = a.x - 14, x1 = z.x + z.w + 14;
      for (const bx of [x0 + 26, x1 - 26]) {
        g.fillStyle = lineal(g, bx - 7, 0, bx + 7, 0, [[0, '#8d949c'], [0.5, '#e4e8ec'], [1, '#7c838b']]);
        g.fillRect(bx - 7, ry, 14, m.H - BARRA - 150 - ry);
      }
      g.fillStyle = 'rgba(40,30,25,0.18)';
      rr(g, x0 + 4, ry + 8, x1 - x0, 16, 6);
      g.fill();
      g.fillStyle = lineal(g, 0, ry - 4, 0, ry + 14, [[0, '#f4f6f8'], [0.45, '#c3c9cf'], [1, '#8a9198']]);
      rr(g, x0, ry - 4, x1 - x0, 18, 6);
      g.fill();
    }
    for (const r of ll) {
      const b = BEBIDA[r.id];
      const act = this.chorro === r.id;
      const cx = r.x + r.w / 2, base = r.y + r.h;
      if (!spr(g, `tanque_${r.id}`, cx, base, this.tamTanque(r))) {
        g.fillStyle = lineal(g, 0, r.y + 40, 0, r.y + 150, [[0, mezclar(b.color, '#ffffff', 0.15)], [1, b.color]]);
        rr(g, r.x + 12, r.y + 40, r.w - 24, 106, 10);
        g.fill();
      }
      g.fillStyle = act ? '#ffb627' : 'rgba(255,248,238,0.92)';
      rr(g, cx - 54, base + 6, 108, 26, 10);
      g.fill();
      texto(g, b.nombre.replace('Jugo de ', ''), cx, base + 19, { tam: 16, color: '#4a2a10', max: 100 });
    }
    // Hielo
    const h = this.rHielo();
    if (!spr(g, 'hielera', h.x + h.w / 2, h.y + h.h - 14, 72)) texto(g, '🧊', h.x + h.w / 2, h.y + h.h / 2, { tam: 50 });
    texto(g, '🧊 Hielo', h.x + h.w / 2, h.y + h.h + 6, { tam: 18, color: '#fff', borde: 'rgba(40,30,25,0.7)' });
    const obra = m.activo?.obra as ObraWafles | undefined;
    if (obra?.vaso) {
      botonBotar(g, this.rBotar());
      const p = this.posVaso();
      if (this.chorro) {
        const b = BEBIDA[this.chorro];
        const r = ll.find((x) => x.id === this.chorro);
        if (r) {
          const boca = punto(`tanque_${r.id}`, 'boca', r.x + r.w / 2, r.y + r.h, this.tamTanque(r));
          const geo = geoVaso(`vaso_${obra.vaso.tam}`, p.x, p.y, 230, TAM[obra.vaso.tam]);
          chorro(g, boca.x, boca.y, p.x, yEn(geo, zNivel(geo, obra.vaso.nivel)) - 2, b.color, 9, t);
        }
      }
      dibujarVaso(g, obra.vaso, p.x, p.y, 1, t, true);
    } else if (m.activo) texto(g, '← Escoge un vaso', this.posVaso().x, m.H - BARRA - 110, { tam: 24, color: '#fff', borde: 'rgba(40,30,25,0.7)' });
  }
}

/** Un vaso de vidrio con el jugo (menisco, burbujas), el hielo y la rayita de «hasta aquí». tam: 1 = el de la estación. */
function dibujarVaso(g: G, v: Vaso, x: number, yBase: number, esc = 1, t = 0, conRaya = false) {
  const id = `vaso_${v.tam}`;
  const tam = 230 * esc;
  const geo = geoVaso(id, x, yBase, tam, TAM[v.tam]);
  sombra(g, x, yBase, geo.rb * geo.k * 1.4, 10 * esc, 0.25);
  if (v.sabor && v.nivel > 0) {
    const b = BEBIDA[v.sabor];
    const color = v.mezcla ? mezclar(b.color, '#6a5a40', 0.5) : b.color;
    liquido(g, geo, Math.min(1, v.nivel), color, { t, burbujas: v.sabor !== 'cafe' && v.sabor !== 'chocolate', profundidad: 0.28 });
  }
  if (v.hielo) hielos(g, geo, v.hielo, v.sabor ? v.nivel : 0.2, t, 22 * esc);
  if (!spr(g, id, x, yBase, tam)) {
    g.strokeStyle = 'rgba(140,170,190,0.9)';
    g.lineWidth = 3;
    g.strokeRect(x - geo.rt * geo.k, yEn(geo, geo.alto), geo.rt * geo.k * 2, geo.alto * geo.k);
  }
  if (conRaya) {
    const z = zNivel(geo, LLENO);
    const r = geo.rb * geo.k + (geo.rt - geo.rb) * geo.k * (z / geo.alto);
    rayita(g, x - r - 8, x + r + 8, yEn(geo, z));
  }
}

// ---------------------------------------------------------------------------------------------- Receta
function dibujarTicket(g: G, p: PedidoWafles, r: Rect) {
  const masa = MASA[p.masa];
  let y = r.y + 10;
  // Wafles apilados
  for (let i = 0; i < p.n; i++) dibujarWafle(g, p.masa, PUNTOS[p.punto], r.x + 44, y + 40 - i * 9, 30);
  letra(g, `${p.n} × ${masa.nombre}`, r.x + 86, y + 18, { tam: 17, max: r.w - 92 });
  const tost = p.punto === 'tostadito';
  g.fillStyle = tost ? '#b9793a' : '#f0c060';
  rr(g, r.x + 86, y + 32, 104, 24, 12);
  g.fill();
  texto(g, tost ? 'Tostadito' : 'Doradito', r.x + 138, y + 45, { tam: 15, color: tost ? '#fff' : '#4a2a10' });
  y += 72;
  separador(g, r.x + 12, r.x + r.w - 12, y - 6);
  for (const t of p.toppings) {
    filaTopping(g, t, TOP[t.id], r.x, r.w, y);
    y += 46;
  }
  if (p.bebida) {
    y += 4;
    separador(g, r.x + 12, r.x + r.w - 12, y);
    const b = BEBIDA[p.bebida.sabor];
    dibujarVaso(g, { tam: p.bebida.tam, sabor: p.bebida.sabor, nivel: LLENO, hielo: p.bebida.hielo, mezcla: false }, r.x + 34, y + 70, 0.26);
    letra(g, b.nombre, r.x + 64, y + 24, { tam: 15, max: r.w - 72 });
    letra(g, `${TAM[p.bebida.tam].nombre}${p.bebida.hielo ? ` · hielo ×${p.bebida.hielo}` : ' · sin hielo'}`, r.x + 64, y + 48, { tam: 14, color: '#6a4a3a', max: r.w - 72 });
  }
}

function calificar(t: Ticket<PedidoWafles, ObraWafles>): Categoria[] {
  const p = t.pedido, o = t.obra;
  // Plancha: cada wafle pedido (masa y punto de los dos lados); los de más restan
  const meta = PUNTOS[p.punto];
  let suma = 0;
  for (let i = 0; i < p.n; i++) {
    const w = o.wafles[i];
    if (!w) continue;
    const coc = (puntajeZona(w.a, meta) + puntajeZona(w.b, meta)) / 2;
    suma += coc * (w.masa === p.masa ? 1 : 0.4);
  }
  const plancha = Math.max(0, Math.round(suma / p.n - Math.max(0, o.wafles.length - p.n) * 25));
  const cats: Categoria[] = [
    { id: 'plancha', nombre: 'Plancha', valor: plancha },
    { id: 'armado', nombre: 'Armado', valor: o.wafles.length ? calificarToppings(o.sup, p.toppings, TOP).valor : 0 },
  ];
  if (p.bebida) {
    const v = o.vaso;
    let b = 0;
    if (v?.sabor) {
      b = puntajeNivel(v.nivel, LLENO) * (v.sabor === p.bebida.sabor ? 1 : 0.2) * (v.tam === p.bebida.tam ? 1 : 0.5) * (v.mezcla ? 0.5 : 1);
      b = b * 0.8 + puntajeCuenta(v.hielo, p.bebida.hielo) * 0.2;
    }
    cats.push({ id: 'bebida', nombre: 'Bebida', valor: Math.round(b) });
  }
  return cats;
}

const MEJORAS: Mejora[] = [
  { id: 'planchas', nombre: 'Otra wafflera', icono: '🧇', niveles: ['Una tercera wafflera', 'Una cuarta wafflera'], precios: [45, 110] },
  { id: 'turbo', nombre: 'Waffleras turbo', icono: '🔥', niveles: ['Cocinan 25 % más rápido', 'Cocinan 50 % más rápido'], precios: [35, 90] },
  { id: 'alarma', nombre: 'Alarma de punto', icono: '⏰', niveles: ['Suena y brilla cuando el lado está doradito o tostadito'], precios: [25] },
  { id: 'guia', nombre: 'Guía de emplatado', icono: '📐', niveles: ['Marquitas en el wafle de dónde va cada pieza'], precios: [40] },
  { id: 'dispensador', nombre: 'Dispensador de precisión', icono: '🥤', niveles: ['Sirve más despacio cerca de la rayita'], precios: [35] },
  { id: 'musica', nombre: 'Parlante con música', icono: '🎶', niveles: ['Los invitados esperan 15 % más contentos', '30 % más contentos'], precios: [30, 80] },
  { id: 'jarra', nombre: 'Frasco de propinas bonito', icono: '🫙', niveles: ['12 % más propina', '24 % más propina', '36 % más propina'], precios: [25, 60, 120] },
];

const DESBLOQUEOS: Desbloqueo[] = [
  ...MASAS.filter((x) => x.desde > 1).map((x) => ({ rango: x.desde, texto: `Masa nueva: ${x.nombre}` })),
  ...TOPS.filter((x) => x.desde > 1).map((x) => ({ rango: x.desde, texto: `Topping nuevo: ${x.nombre}` })),
  { rango: 3, texto: '¡Estación de bebidas! Ahora también piden jugo' },
  ...BEBIDAS.filter((x) => x.desde > 3).map((x) => ({ rango: x.desde, texto: `Bebida nueva: ${x.nombre}` })),
  { rango: 3, texto: 'Ahora piden wafles tostaditos' },
  { rango: 5, texto: 'Ahora piden hielo en las bebidas' },
];

/** En pareja: un wafle que quedó en un plato y también en la rejilla (los dos lo tomaron a la vez) sale de la rejilla. */
function reconciliar(m: Motor) {
  const rej = m.maq.rejilla as WafleHecho[] | undefined;
  if (!rej?.length) return;
  const usados = new Set<number>();
  for (const t of m.s.tickets) for (const w of (t.obra as ObraWafles)?.wafles ?? []) usados.add(w.id);
  const limpia = rej.filter((w) => !usados.has(w.id));
  if (limpia.length !== rej.length) {
    m.maq.rejilla = limpia;
    if (m.anfitrion) m.cambioMaq('rejilla');
  }
}

export const WAFLES = {
  id: 'wafles',
  nombre: 'Waflería',
  titulo: (nombre) => `La Waflería de ${nombre}`,
  plato: 'wafle_chef',
  nombrePlato: 'Wafles de chef',
  icono: 'wafle_clasica_1',
  tema: { pared: '#f6c98f', acento: '#e0793a', piso: '#e9d3b8', oscuro: '#5a2e14' },
  mejoras: MEJORAS,
  desbloqueos: DESBLOQUEOS,
  maquinas: (mejora) => ({ planchas: Array.from({ length: 2 + mejora('planchas') }, planchaVacia), rejilla: [] }),
  crearEstaciones(m) {
    const c = new Cocina(m);
    const l: Estacion[] = [new EstacionPlancha(c, m), new EstacionArmar(c, m)];
    if (m.rango >= 3) l.push(new EstacionBebidas(m));
    return l;
  },
  pedido,
  obraNueva: () => ({ wafles: [], sup: superficieNueva(), vaso: null }),
  tiempoIdeal: (p) => 22 + p.n * 6 + p.toppings.length * 5 + (p.bebida ? 9 : 0),
  dibujarTicket: (g, p, r) => dibujarTicket(g, p, r),
  calificar,
  reconciliar,
  dibujarPlato(g, t, x, y, esc, m) {
    const o = { x, y, rx: 200 * esc, ry: 200 * esc * 0.62 };
    dibujarPlatoWafles(g, t.obra, o, m.reloj + 99);
    if (t.obra.vaso?.sabor) dibujarVaso(g, t.obra.vaso, x + 200 * esc, y + 40, 0.7 * esc, m.reloj);
  },
  /** Para las pruebas automáticas. */
  pruebas: { ovaloPlato, superficieDe, TOP, PUNTOS, rectsRejilla },
} as Receta<PedidoWafles, ObraWafles> & { pruebas: unknown };
void colorCoccion;
