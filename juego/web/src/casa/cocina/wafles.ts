// La waflería (estilo Papa's Pancakeria): en la plancha se sirve la masa en las waffleras, se voltean a tiempo y
// se sacan doraditos o tostaditos; en «Armar» se ponen en el plato y se decoran (mantequilla, miel, arequipe,
// frutas donde van, chispitas…) y, desde el rango 3, en «Bebidas» se sirve el jugo hasta la rayita con su hielo.
import {
  aclarar, boton, colorCoccion, conAlfa, dentro, elipse, G, lineal, Masa, mezclar, oscurecer, plato, radial, Rect, rr, sombra,
  texto, wafle,
} from './dibujo';
import {
  Aplicador, aUV, botonBotar, botonEntregar, botonesToppings, calificarToppings, dibujarBotonesToppings, dibujarGuia, dibujarSuperficie,
  filaTopping, Ovalo, patron, puntajeCuenta, puntajeNivel, puntajeZona, rayita, separador, Superficie, superficieNueva, ToppingDef,
  ToppingPedido,
} from './herramientas';
import { BARRA, Categoria, Estacion, Motor, Receta, RIEL, sonidos, Ticket } from './motor';
import type { Desbloqueo, Mejora } from './tipos';

// ---------------------------------------------------------------------------------------------- Ingredientes
const MASAS: (Masa & { desde: number })[] = [
  { id: 'clasica', nombre: 'Clásica', crudo: '#f7e6b8', dorado: '#e9a54e', tostado: '#b5672b', desde: 1 },
  { id: 'chocolate', nombre: 'Chocolate', crudo: '#c09472', dorado: '#7d4b2b', tostado: '#4e2a16', desde: 2 },
  { id: 'red_velvet', nombre: 'Red velvet', crudo: '#ef8f86', dorado: '#bb3f3a', tostado: '#7c2521', desde: 5 },
  { id: 'avena', nombre: 'Avena y canela', crudo: '#f1dcb5', dorado: '#cf9859', tostado: '#9a6432', pintas: '#6e3f1c', desde: 8 },
];
const MASA = Object.fromEntries(MASAS.map((m) => [m.id, m]));
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
const TAM: Record<Tam, { nombre: string; alto: number; ancho: number; vel: number }> = {
  P: { nombre: 'Pequeño', alto: 120, ancho: 74, vel: 0.5 },
  M: { nombre: 'Mediano', alto: 150, ancho: 84, vel: 0.42 },
  G: { nombre: 'Grande', alto: 185, ancho: 96, vel: 0.35 },
};
const LLENO = 0.85;

// ---------------------------------------------------------------------------------------------- Pedido y obra
export interface PedidoWafles {
  n: number;
  masa: string;
  punto: Punto;
  toppings: ToppingPedido[];
  bebida?: { sabor: string; tam: Tam; hielo: number };
}
interface WafleHecho {
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

function pedido(rango: number, _dia: number, azar: () => number): PedidoWafles {
  const tomar = <T,>(l: T[]) => l[Math.floor(azar() * l.length)];
  const masas = MASAS.filter((m) => m.desde <= rango);
  const n = 1 + (azar() < Math.min(0.6, 0.12 + rango * 0.07) ? 1 : 0) + (rango >= 6 && azar() < 0.3 ? 1 : 0);
  const punto: Punto = rango >= 3 && azar() < 0.32 ? 'tostadito' : 'doradito';
  const disponibles = TOPS.filter((t) => t.desde <= rango);
  const k = Math.max(1, Math.min(5, disponibles.length, 1 + Math.floor(rango / 3) + (azar() < 0.5 ? 1 : 0)));
  const elegidos: ToppingDef[] = [];
  while (elegidos.length < k) {
    const t = tomar(disponibles);
    if (!elegidos.includes(t)) elegidos.push(t);
  }
  // La mantequilla va primero y el helado de último (como se sirve de verdad)
  elegidos.sort((a, b) => (a.id === 'mantequilla' ? -1 : b.id === 'mantequilla' ? 1 : 0) || (a.id === 'helado' ? 1 : b.id === 'helado' ? -1 : 0));
  const toppings = elegidos.map((t): ToppingPedido => {
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

// ---------------------------------------------------------------------------------------------- Estado de la cocina (compartido entre estaciones)
interface Plancha {
  masa: string | null;
  fase: 'vacia' | 'vertiendo' | 'cocinando' | 'volteando';
  lado: 'a' | 'b';
  a: number;
  b: number;
  t: number;
  avisado: number;
  humo: number;
}
class Cocina {
  planchas: Plancha[];
  rejilla: WafleHecho[] = [];
  jarra: string | null = null;
  elegidoRejilla = -1;
  constructor(public m: Motor) {
    this.planchas = Array.from({ length: 2 + m.mejora('planchas') }, () => ({ masa: null, fase: 'vacia', lado: 'a', a: 0, b: 0, t: 0, avisado: 0, humo: 0 }));
  }
  get vel() {
    return (1 / 14) * (1 + 0.25 * this.m.mejora('turbo'));
  }
}

/** La rejilla con los wafles listos (abajo en la plancha y en armar). */
function rectsRejilla(m: Motor, x0: number): Rect[] {
  const y = m.H - BARRA - 116, fin = m.zona.x + m.zona.w - 110;
  const n = Math.max(1, Math.floor((fin - x0) / 112));
  return Array.from({ length: Math.min(8, n) }, (_, i) => ({ x: x0 + i * 112, y, w: 104, h: 100 }));
}
const rectBasura = (m: Motor): Rect => ({ x: m.zona.x + m.zona.w - 100, y: m.H - BARRA - 112, w: 86, h: 96 });

function dibujarRejilla(g: G, c: Cocina, m: Motor, x0: number) {
  const rs = rectsRejilla(m, x0);
  const y = rs[0].y;
  g.fillStyle = 'rgba(60,50,45,0.35)';
  rr(g, x0 - 10, y - 6, rs.length * 112 + 12, 112, 16);
  g.fill();
  g.strokeStyle = '#c7ccd0';
  g.lineWidth = 3;
  for (let i = 0; i <= 10; i++) {
    const x = x0 - 4 + i * ((rs.length * 112) / 10);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y + 100);
    g.stroke();
  }
  texto(g, 'Rejilla', x0 + 6, y - 16, { tam: 18, color: '#fff', alinear: 'left', borde: 'rgba(40,30,25,0.7)' });
  rs.forEach((r, i) => {
    const w = c.rejilla[i];
    if (!w) return;
    const sel = c.elegidoRejilla === i;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2 - (sel ? 10 : 0);
    if (sel) {
      g.fillStyle = conAlfa('#ffb627', 0.45);
      elipse(g, cx, cy + 4, 52, 36);
      g.fill();
    }
    wafle(g, cx, cy, 44, MASA[w.masa], (w.a + w.b) / 2);
  });
  // Caneca para botar
  const b = rectBasura(m);
  g.fillStyle = lineal(g, b.x, 0, b.x + b.w, 0, [[0, '#5d6a70'], [0.5, '#8d9aa0'], [1, '#56626a']]);
  rr(g, b.x + 8, b.y + 16, b.w - 16, b.h - 16, 10);
  g.fill();
  g.fillStyle = '#46525a';
  rr(g, b.x, b.y + 4, b.w, 16, 6);
  g.fill();
  texto(g, '🗑', b.x + b.w / 2, b.y + b.h / 2 + 10, { tam: 34 });
}

/** Toque en la rejilla o en la caneca. Devuelve el wafle tocado (si hay). */
function tocarRejilla(c: Cocina, m: Motor, x0: number, x: number, y: number): number | null {
  if (dentro(rectBasura(m), x, y)) {
    if (c.elegidoRejilla >= 0 && c.rejilla[c.elegidoRejilla]) {
      c.rejilla.splice(c.elegidoRejilla, 1);
      c.elegidoRejilla = -1;
      sonidos.papel();
      m.flotar('A la basura', x, y - 30, '#ffd0d0', 24);
    } else m.aviso('Toca un wafle de la rejilla y luego la caneca para botarlo');
    return null;
  }
  const i = rectsRejilla(m, x0).findIndex((r) => dentro(r, x, y));
  return i >= 0 && c.rejilla[i] ? i : null;
}

// ---------------------------------------------------------------------------------------------- Plancha
class EstacionPlancha implements Estacion {
  id = 'plancha';
  nombre = 'Plancha';
  icono = '🧇';
  private sonando = 0;
  constructor(private c: Cocina, private m: Motor) {}

  private jarras(): (Rect & { id: string })[] {
    const ms = MASAS.filter((x) => x.desde <= this.m.rango);
    return ms.map((x, i) => ({ id: x.id, x: 18, y: RIEL + 18 + i * 124, w: 200, h: 112 }));
  }
  private planchaRect(i: number) {
    const x0 = 250, x1 = this.m.zona.w - 20;
    const n = this.c.planchas.length;
    const w = (x1 - x0) / n;
    const cx = x0 + w * (i + 0.5), cy = RIEL + 170;
    const r = Math.min(110, w * 0.36);
    return { cx, cy, r, caja: { x: cx - w / 2 + 6, y: RIEL + 20, w: w - 12, h: 330 } };
  }

  alerta() {
    return this.c.planchas.some((p) => p.fase === 'cocinando' && this.valor(p) > 0.8);
  }
  private valor(p: Plancha) {
    return p.lado === 'a' ? p.a : p.b;
  }

  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: RIEL + 330 });
    // Campana extractora
    const { W } = this.m;
    g.fillStyle = lineal(g, 0, RIEL, 0, RIEL + 60, [[0, '#aeb6ba'], [1, '#d7dde0']]);
    g.beginPath();
    g.moveTo(240, RIEL);
    g.lineTo(W - 20, RIEL);
    g.lineTo(W - 60, RIEL + 44);
    g.lineTo(280, RIEL + 44);
    g.closePath();
    g.fill();
  }

  paso(dt: number) {
    const c = this.c, m = this.m;
    let cocinando = false;
    c.planchas.forEach((p, i) => {
      p.t += dt;
      if (p.fase === 'vertiendo' && p.t > 0.7) {
        p.fase = 'cocinando';
        p.t = 0;
      }
      if (p.fase === 'volteando' && p.t > 0.45) {
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
      if (v > 0.86 && m.actual === 1) {
        p.humo -= dt;
        if (p.humo <= 0) {
          const r = this.planchaRect(i);
          m.humo(r.cx, r.cy - r.r * 0.4, v > 0.95 ? '#4a4a4a' : '#9a9a9a');
          p.humo = 0.18;
        }
      }
    });
    if (cocinando && m.actual === 1) {
      this.sonando -= dt;
      if (this.sonando <= 0) {
        sonidos.chisporroteo();
        this.sonando = 0.45;
      }
    }
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
        sonidos.vertir(0.6);
        m.pistaUnaVez('voltear', 'Cuando la flecha llegue a la rayita, toca la wafflera para voltearla');
      } else if (p.fase === 'cocinando' && p.lado === 'a') {
        p.lado = 'b';
        p.fase = 'volteando';
        p.t = 0;
        sonidos.volteo();
        m.pistaUnaVez('sacar', 'Y cuando el otro lado llegue a la rayita, tócala otra vez para sacarlo');
      } else if (p.fase === 'cocinando' && p.lado === 'b') {
        if (c.rejilla.length >= 8) return m.aviso('La rejilla está llena: bota o usa algún wafle');
        c.rejilla.push({ masa: p.masa!, a: Math.min(1, p.a), b: Math.min(1, p.b) });
        Object.assign(p, { masa: null, fase: 'vacia', a: 0, b: 0, t: 0 });
        sonidos.pop();
        m.flotar('¡Listo!', r.cx, r.cy - r.r - 20, '#fff3c4');
        m.pistaUnaVez('armar', 'Ve a «Armar» para ponerlo en el plato y decorarlo');
      }
      return;
    }
    const k = tocarRejilla(c, m, 250, x, y);
    if (k !== null) {
      c.elegidoRejilla = c.elegidoRejilla === k ? -1 : k;
      sonidos.clic();
    }
  }

  dibujar(g: G, t: number) {
    const c = this.c, m = this.m;
    // Jarras de masa
    for (const j of this.jarras()) {
      const ms = MASA[j.id];
      const act = c.jarra === j.id;
      boton(g, j, { color: act ? '#ffe2a8' : '#ffffff', activo: act });
      const jx = j.x + 52, jy = j.y + 58;
      g.fillStyle = 'rgba(220,235,245,0.8)';
      rr(g, jx - 30, jy - 38, 60, 76, 12);
      g.fill();
      g.fillStyle = lineal(g, 0, jy - 20, 0, jy + 36, [[0, aclarar(ms.crudo, 0.1)], [1, oscurecer(ms.crudo, 0.1)]]);
      rr(g, jx - 26, jy - 16, 52, 50, 10);
      g.fill();
      g.strokeStyle = 'rgba(220,235,245,0.9)';
      g.lineWidth = 6;
      g.beginPath();
      g.arc(jx + 34, jy, 16, -1.2, 1.2);
      g.stroke();
      texto(g, ms.nombre, j.x + 142, j.y + j.h / 2 + 4, { tam: 21, color: '#4a2a10', max: 104 });
    }
    // Waffleras
    c.planchas.forEach((p, i) => {
      const r = this.planchaRect(i);
      this.dibujarWafflera(g, p, r.cx, r.cy, r.r, t);
      // Medidor del lado que se cocina
      const bw = Math.min(230, r.caja.w - 20), bx = r.cx - bw / 2, by = r.cy + r.r + 50;
      this.medidorLado(g, p, bx, by, bw);
    });
    dibujarRejilla(g, c, m, 250);
  }

  private dibujarWafflera(g: G, p: Plancha, x: number, y: number, r: number, t: number) {
    const volteo = p.fase === 'volteando' ? Math.cos(Math.min(1, p.t / 0.45) * Math.PI) : 1;
    sombra(g, x + 8, y + r * 0.72, r * 1.35, r * 0.4, 0.35);
    // Mango
    g.fillStyle = '#2a2a2a';
    rr(g, x - r * 2.1 * 0 - r - 70, y - 12, 80, 24, 12);
    g.fill();
    g.save();
    g.translate(x, y);
    g.scale(1, Math.max(0.05, Math.abs(volteo)) * 0.62);
    // Base de hierro
    g.fillStyle = radial(g, -r * 0.3, -r * 0.3, r * 0.1, r * 1.3, [[0, '#5a5a5a'], [1, '#1c1c1c']]);
    elipse(g, 0, 0, r * 1.18, r * 1.18);
    g.fill();
    if (p.fase === 'vacia') {
      // Placa con cuadritos
      g.fillStyle = '#2c2c2c';
      elipse(g, 0, 0, r, r);
      g.fill();
      g.save();
      elipse(g, 0, 0, r, r);
      g.clip();
      g.fillStyle = '#1a1a1a';
      const paso = (r * 2) / 5;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
        rr(g, -r + paso * i + paso * 0.18, -r + paso * j + paso * 0.18, paso * 0.64, paso * 0.64, 6);
        g.fill();
      }
      g.restore();
    } else if (p.fase === 'vertiendo') {
      g.fillStyle = '#2c2c2c';
      elipse(g, 0, 0, r, r);
      g.fill();
      const k = Math.min(1, p.t / 0.6);
      g.fillStyle = MASA[p.masa!].crudo;
      elipse(g, 0, 0, r * 0.95 * k, r * 0.95 * k);
      g.fill();
    } else {
      // Tapa cerrada con el termómetro
      g.fillStyle = radial(g, -r * 0.4, -r * 0.5, r * 0.05, r * 1.1, [[0, '#6b6b6b'], [0.6, '#2e2e2e'], [1, '#161616']]);
      elipse(g, 0, 0, r * 1.05, r * 1.05);
      g.fill();
      g.strokeStyle = '#444';
      g.lineWidth = 6;
      elipse(g, 0, 0, r * 0.8, r * 0.8);
      g.stroke();
    }
    g.restore();
    if (p.fase === 'cocinando') {
      // Vaporcito por los bordes y un reloj en la tapa
      const v = p.lado === 'a' ? p.a : p.b;
      g.fillStyle = '#f5f5f5';
      elipse(g, x, y - 4, 34, 22);
      g.fill();
      g.strokeStyle = colorCoccion(MASA[p.masa!], v);
      g.lineWidth = 8;
      g.beginPath();
      g.ellipse(x, y - 4, 26, 16, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, v));
      g.stroke();
      texto(g, p.lado === 'a' ? '1' : '2', x, y - 3, { tam: 18, color: '#333' });
      if (v < 0.86) {
        const k = (t * 0.8 + x) % 1;
        g.globalAlpha = (1 - k) * 0.5;
        g.fillStyle = '#ffffff';
        elipse(g, x + r * 0.9, y - r * 0.3 - k * 40, 10 + k * 10, 8 + k * 8);
        g.fill();
        g.globalAlpha = 1;
      }
      if (this.m.mejora('alarma') && this.m.reloj - p.avisado < 1.2) {
        g.strokeStyle = `rgba(92,194,106,${0.8 - (this.m.reloj - p.avisado) * 0.6})`;
        g.lineWidth = 8;
        elipse(g, x, y, r * 1.3, r * 0.85);
        g.stroke();
      }
    }
    if (p.fase === 'vacia') texto(g, this.c.jarra ? 'Toca para servir' : 'Vacía', x, y + r * 0.72 + 30, { tam: 18, color: '#6a5a50', peso: 700 });
  }

  private medidorLado(g: G, p: Plancha, x: number, y: number, w: number) {
    g.fillStyle = '#3b2a22';
    rr(g, x - 4, y - 4, w + 8, 36, 12);
    g.fill();
    const zonas: [number, number, string][] = [[0, 0.4, '#f6e7c6'], [0.4, 0.6, '#f0c060'], [0.6, 0.82, '#b9793a'], [0.82, 1, '#4a2a1a']];
    for (const [a, b, col] of zonas) {
      g.fillStyle = col;
      g.fillRect(x + w * a, y, w * (b - a), 28);
    }
    for (const [k, l] of [[PUNTOS.doradito, 'D'], [PUNTOS.tostadito, 'T']] as const) {
      g.fillStyle = '#ffffff';
      g.fillRect(x + w * k - 2, y - 6, 4, 40);
      texto(g, l, x + w * k, y - 16, { tam: 16, color: '#fff', borde: '#3b2a22' });
    }
    if (p.fase === 'cocinando' || p.fase === 'volteando') {
      const v = Math.min(1, p.lado === 'a' ? p.a : p.b);
      g.fillStyle = '#e8434f';
      g.beginPath();
      g.moveTo(x + w * v, y + 30);
      g.lineTo(x + w * v - 10, y + 46);
      g.lineTo(x + w * v + 10, y + 46);
      g.closePath();
      g.fill();
      texto(g, p.lado === 'a' ? 'Lado 1' : `Lado 2 (el 1 quedó en ${Math.round(Math.min(1, p.a) * 100)})`, x + w / 2, y + 62, { tam: 16, color: '#fff', borde: 'rgba(40,30,25,0.7)', max: w });
    }
  }
}

// ---------------------------------------------------------------------------------------------- Armar
function ovaloPlato(m: Motor): Ovalo {
  const x0 = 300, x1 = m.zona.w;
  const rx = Math.min(220, (x1 - x0) / 2 - 20);
  return { x: (x0 + x1) / 2, y: RIEL + 190, rx, ry: rx * 0.56 };
}
/** La superficie del wafle de arriba (donde caen los toppings). */
function superficieDe(o: Ovalo, n: number): Ovalo {
  const r = o.rx * 0.72;
  return { x: o.x, y: o.y - Math.max(0, n - 1) * 16 - r * 0.62 * 0.12, rx: r * 0.9, ry: r * 0.62 * 0.9 };
}

function dibujarPlatoWafles(g: G, obra: ObraWafles, o: Ovalo, ahora: number, guia?: ToppingPedido[]) {
  plato(g, o.x, o.y, o.rx, o.ry);
  const r = o.rx * 0.72;
  obra.wafles.forEach((w, i) => wafle(g, o.x, o.y - i * 16 - r * 0.62 * 0.12, r, MASA[w.masa], (w.a + w.b) / 2));
  if (!obra.wafles.length) return;
  const s = superficieDe(o, obra.wafles.length);
  if (guia) dibujarGuia(g, guia, TOP, s);
  dibujarSuperficie(g, obra.sup, s, TOP, ahora);
}

class EstacionArmar implements Estacion {
  id = 'armar';
  nombre = 'Armar';
  icono = '🍓';
  usaTicket = true;
  private herramienta: string | null = null;
  private aplicador = new Aplicador(TOP);
  private aplicando = false;
  private confirmar = 0;
  constructor(private c: Cocina, private m: Motor) {}

  private botones() {
    return botonesToppings(TOPS, this.m.rango, 14, RIEL + 14);
  }
  private get obra(): ObraWafles | null {
    return (this.m.activo?.obra as ObraWafles) ?? null;
  }
  private rEntregar(): Rect {
    const o = ovaloPlato(this.m);
    return { x: o.x + o.rx - 150, y: o.y + o.ry + 12, w: 190, h: 66 };
  }
  private rBotar(): Rect {
    const o = ovaloPlato(this.m);
    return { x: o.x - o.rx - 40, y: o.y + o.ry + 12, w: 120, h: 66 };
  }

  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: RIEL + 250 });
  }
  paso() {}

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m, c = this.c;
    const obra = this.obra;
    const o = ovaloPlato(m);
    if (tipo === 'mover') {
      if (this.aplicando && obra) this.aplicador.mover(aUV(superficieDe(o, obra.wafles.length), x, y));
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
      sonidos.papel();
      m.flotar('Plato limpio', o.x, o.y - 60, '#ffd0d0', 26);
      return;
    }
    // Wafle de la rejilla al plato
    const k = tocarRejilla(c, m, 300, x, y);
    if (k !== null) {
      if (obra.sup.capas.length) return m.aviso('Ya empezaste a decorar: los wafles van antes que los toppings');
      if (obra.wafles.length >= 4) return m.aviso('No caben más wafles');
      obra.wafles.push(c.rejilla.splice(k, 1)[0]);
      c.elegidoRejilla = -1;
      sonidos.pop();
      m.pistaUnaVez('toppings', 'Escoge un topping a la izquierda y ponlo en el wafle como dice el tiquete');
      return;
    }
    if (this.herramienta && obra.wafles.length) {
      const s = superficieDe(o, obra.wafles.length);
      const r = this.aplicador.bajar(obra.sup, this.herramienta, aUV(s, x, y), m.reloj);
      if (r) {
        this.aplicando = r !== 'pieza';
        if (r === 'pieza') sonidos.pop();
        else if (r === 'salsa') sonidos.vertir(0.3);
        else sonidos.papel();
      }
    } else if (this.herramienta && Math.hypot((x - o.x) / o.rx, (y - o.y) / o.ry) < 1) m.aviso('Primero pon un wafle en el plato');
  }

  alerta() {
    return false;
  }

  dibujar(g: G, t: number) {
    const m = this.m;
    dibujarBotonesToppings(g, this.botones(), TOP, this.herramienta);
    const o = ovaloPlato(m);
    const obra = this.obra;
    if (obra) {
      const pd = m.activo!.pedido as PedidoWafles;
      dibujarPlatoWafles(g, obra, o, t, m.mejora('guia') ? pd.toppings : undefined);
      if (!obra.wafles.length) texto(g, 'Toca un wafle de la rejilla', o.x, o.y, { tam: 24, color: '#9a8a80' });
      botonEntregar(g, this.rEntregar());
      botonBotar(g, this.rBotar());
    } else {
      plato(g, o.x, o.y, o.rx, o.ry);
      texto(g, 'Toca un pedido del riel', o.x, o.y, { tam: 26, color: '#9a8a80' });
    }
    // Lo que tiene en la mano
    if (this.herramienta) {
      const d = TOP[this.herramienta];
      texto(g, `En la mano: ${d.nombre}${d.tipo === 'salsa' ? ' (arrastra para chorrear)' : d.tipo === 'polvo' ? ' (arrastra para espolvorear)' : ' (toca donde va)'}`, o.x, RIEL + 26, { tam: 20, color: '#fff', borde: 'rgba(40,30,25,0.8)', max: m.zona.w - 330 });
    }
    dibujarRejilla(g, this.c, m, 300);
  }
}

// ---------------------------------------------------------------------------------------------- Bebidas
class EstacionBebidas implements Estacion {
  id = 'bebidas';
  nombre = 'Bebidas';
  icono = '🥤';
  usaTicket = true;
  private chorro: string | null = null;
  private sonando = 0;
  constructor(private m: Motor) {}

  private get vaso(): Vaso | null {
    return (this.m.activo?.obra as ObraWafles)?.vaso ?? null;
  }
  private rVasos(): (Rect & { tam: Tam })[] {
    return (['P', 'M', 'G'] as Tam[]).map((tam, i) => ({ tam, x: 16 + i * 92, y: RIEL + 40, w: 86, h: 220 }));
  }
  private rLlaves(): (Rect & { id: string })[] {
    const bs = BEBIDAS.filter((b) => b.desde <= this.m.rango);
    const x0 = 330, x1 = this.m.zona.w - 200;
    const w = Math.min(150, (x1 - x0) / bs.length);
    return bs.map((b, i) => ({ id: b.id, x: x0 + i * w + 6, y: RIEL + 20, w: w - 12, h: 250 }));
  }
  private rHielo(): Rect {
    return { x: this.m.zona.w - 180, y: RIEL + 150, w: 160, h: 130 };
  }
  private rBotar(): Rect {
    return { x: this.m.zona.w - 180, y: RIEL + 300, w: 160, h: 64 };
  }
  private posVaso() {
    const ll = this.rLlaves();
    const x0 = ll[0]?.x ?? 330, x1 = (ll[ll.length - 1]?.x ?? 500) + (ll[ll.length - 1]?.w ?? 100);
    return { x: (x0 + x1) / 2, y: this.m.H - BARRA - 40 };
  }

  fondo(g: G) {
    this.m.fondoCocina(g, { mesa: this.m.H - BARRA - 150 });
  }

  paso(dt: number) {
    const v = this.vaso;
    if (!this.chorro || !v) return;
    const cerca = this.m.mejora('dispensador') && Math.abs(v.nivel - LLENO) < 0.12 ? 0.45 : 1;
    v.nivel = Math.min(1.08, v.nivel + TAM[v.tam].vel * dt * cerca);
    if (v.sabor && v.sabor !== this.chorro) v.mezcla = true;
    v.sabor = this.chorro;
    this.sonando -= dt;
    if (this.sonando <= 0) {
      sonidos.vertir(0.3);
      this.sonando = 0.28;
    }
    if (v.nivel >= 1.05) {
      this.chorro = null;
      this.m.aviso('¡Se regó!');
    }
  }

  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    const m = this.m;
    if (tipo === 'subir') {
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
      sonidos.pop();
      return;
    }
    const ll = this.rLlaves().find((r) => dentro(r, x, y));
    if (ll) {
      if (!obra.vaso) return m.aviso('Primero escoge un vaso (a la izquierda)');
      this.chorro = ll.id;
      return;
    }
    if (dentro(this.rHielo(), x, y)) {
      if (!obra.vaso) return m.aviso('Primero escoge un vaso');
      if (obra.vaso.hielo >= 4) return;
      obra.vaso.hielo++;
      sonidos.pop();
      return;
    }
    if (dentro(this.rBotar(), x, y) && obra.vaso) {
      obra.vaso = null;
      sonidos.papel();
    }
  }

  dibujar(g: G, t: number) {
    const m = this.m;
    for (const r of this.rVasos()) {
      boton(g, r, { color: '#ffffff', radio: 14 });
      const tm = TAM[r.tam];
      dibujarVaso(g, { tam: r.tam, sabor: null, nivel: 0, hielo: 0, mezcla: false }, r.x + r.w / 2, r.y + r.h - 40, 0.55);
      texto(g, tm.nombre, r.x + r.w / 2, r.y + r.h - 18, { tam: 15, color: '#4a2a10', max: r.w - 6 });
    }
    // La máquina de jugos
    const ll = this.rLlaves();
    if (ll.length) {
      const x0 = ll[0].x - 14, x1 = ll[ll.length - 1].x + ll[ll.length - 1].w + 14;
      g.fillStyle = lineal(g, 0, RIEL + 10, 0, RIEL + 290, [[0, '#dfe5e8'], [1, '#a9b2b7']]);
      rr(g, x0, RIEL + 10, x1 - x0, 290, 20);
      g.fill();
    }
    for (const r of ll) {
      const b = BEBIDA[r.id];
      const act = this.chorro === r.id;
      // Tanque con el jugo
      g.fillStyle = 'rgba(230,245,255,0.7)';
      rr(g, r.x + 8, r.y + 10, r.w - 16, 140, 14);
      g.fill();
      g.fillStyle = lineal(g, 0, r.y + 40, 0, r.y + 150, [[0, aclarar(b.color, 0.15)], [1, b.color]]);
      rr(g, r.x + 12, r.y + 40 + Math.sin(t * 2 + r.x) * 3, r.w - 24, 106, 10);
      g.fill();
      texto(g, b.nombre.replace('Jugo de ', ''), r.x + r.w / 2, r.y + 172, { tam: 18, color: '#3b2a22', max: r.w - 6 });
      // La llave
      boton(g, { x: r.x + r.w / 2 - 34, y: r.y + 192, w: 68, h: 46 }, { color: act ? '#ffb627' : '#ffffff', hundido: act, radio: 12 });
      texto(g, 'Servir', r.x + r.w / 2, r.y + 216 + (act ? 4 : 0), { tam: 15, color: '#4a2a10' });
    }
    // Hielo y botar
    const h = this.rHielo();
    boton(g, h, { color: '#e6f6ff', radio: 18 });
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(255,255,255,0.9)';
      rr(g, h.x + 24 + (i % 3) * 38, h.y + 24 + Math.floor(i / 3) * 34, 30, 28, 7);
      g.fill();
      g.strokeStyle = 'rgba(120,180,220,0.8)';
      g.lineWidth = 2;
      g.stroke();
    }
    texto(g, '🧊 Hielo', h.x + h.w / 2, h.y + h.h - 18, { tam: 20, color: '#2a5a7a' });
    const obra = m.activo?.obra as ObraWafles | undefined;
    if (obra?.vaso) {
      boton(g, this.rBotar(), { color: '#f0e4d8' });
      texto(g, '🗑 Botar', this.rBotar().x + 80, this.rBotar().y + 34, { tam: 22, color: '#7a4a3a' });
      const p = this.posVaso();
      // Chorro cayendo
      if (this.chorro) {
        const b = BEBIDA[this.chorro];
        const r = ll.find((x) => x.id === this.chorro)!;
        g.strokeStyle = b.color;
        g.lineWidth = 12;
        g.beginPath();
        g.moveTo(r.x + r.w / 2, r.y + 240);
        g.quadraticCurveTo(p.x, r.y + 280, p.x, p.y - TAM[obra.vaso.tam].alto * 0.3);
        g.stroke();
      }
      dibujarVaso(g, obra.vaso, p.x, p.y, 1.25, true);
    } else if (m.activo) texto(g, 'Escoge un vaso ←', this.posVaso().x, m.H - BARRA - 100, { tam: 24, color: '#6a5a50' });
  }
}

/** Un vaso de vidrio con el jugo, el hielo y la rayita de «hasta aquí». */
function dibujarVaso(g: G, v: Vaso, x: number, yBase: number, esc = 1, conRaya = false) {
  const tm = TAM[v.tam];
  const h = tm.alto * esc, w = tm.ancho * esc;
  const arriba = yBase - h;
  const forma = (inset = 0) => {
    g.beginPath();
    g.moveTo(x - w / 2 + inset, arriba + inset);
    g.lineTo(x + w / 2 - inset, arriba + inset);
    g.lineTo(x + w * 0.4 - inset, yBase - inset);
    g.lineTo(x - w * 0.4 + inset, yBase - inset);
    g.closePath();
  };
  sombra(g, x, yBase, w * 0.6, 10, 0.25);
  if (v.sabor && v.nivel > 0) {
    const b = BEBIDA[v.sabor];
    g.save();
    forma(3);
    g.clip();
    const yl = yBase - h * Math.min(1, v.nivel);
    g.fillStyle = lineal(g, 0, yl, 0, yBase, [[0, aclarar(v.mezcla ? mezclar(b.color, '#6a5a40', 0.5) : b.color, 0.15)], [1, v.mezcla ? '#6a5a40' : b.color]]);
    g.fillRect(x - w, yl, w * 2, yBase - yl);
    g.restore();
  }
  for (let i = 0; i < v.hielo; i++) {
    const hx = x - w * 0.22 + (i % 2) * w * 0.3, hy = yBase - h * Math.min(0.9, Math.max(0.15, v.nivel)) + 12 + Math.floor(i / 2) * 22 * esc;
    g.fillStyle = 'rgba(255,255,255,0.75)';
    rr(g, hx - 11 * esc, hy - 10 * esc, 24 * esc, 22 * esc, 5);
    g.fill();
  }
  g.fillStyle = 'rgba(220,240,255,0.25)';
  forma();
  g.fill();
  g.strokeStyle = 'rgba(140,170,190,0.9)';
  g.lineWidth = 3;
  forma();
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.fillRect(x - w * 0.34, arriba + 10, 6 * esc, h * 0.7);
  if (conRaya) rayita(g, x - w / 2 - 6, x + w / 2 + 6, yBase - h * LLENO);
}

// ---------------------------------------------------------------------------------------------- Receta
function dibujarTicket(g: G, p: PedidoWafles, r: Rect) {
  const masa = MASA[p.masa];
  let y = r.y + 24;
  // Wafles
  for (let i = 0; i < p.n; i++) wafle(g, r.x + 40 + i * 18, y + 18 - i * 6, 26, masa, PUNTOS[p.punto]);
  texto(g, `${p.n} × ${masa.nombre}`, r.x + 150, y + 4, { tam: 20, color: '#3b2a22', max: 150 });
  g.fillStyle = p.punto === 'tostadito' ? '#b9793a' : '#f0c060';
  rr(g, r.x + 100, y + 22, 100, 24, 12);
  g.fill();
  texto(g, p.punto === 'tostadito' ? 'Tostadito' : 'Doradito', r.x + 150, y + 35, { tam: 16, color: p.punto === 'tostadito' ? '#fff' : '#4a2a10' });
  y += 70;
  // Toppings, en orden
  for (const t of p.toppings) {
    filaTopping(g, t, TOP[t.id], r.x, r.w, y);
    y += 50;
  }
  if (p.bebida) {
    y += 6;
    separador(g, r.x + 14, r.x + r.w - 14, y);
    const b = BEBIDA[p.bebida.sabor];
    dibujarVaso(g, { tam: p.bebida.tam, sabor: p.bebida.sabor, nivel: LLENO, hielo: 0, mezcla: false }, r.x + 36, y + 64, 0.34);
    texto(g, b.nombre, r.x + 66, y + 24, { tam: 18, color: '#3b2a22', alinear: 'left', max: r.w - 80 });
    texto(g, `${TAM[p.bebida.tam].nombre}${p.bebida.hielo ? ` · 🧊 ${p.bebida.hielo}` : ' · sin hielo'}`, r.x + 66, y + 50, { tam: 16, color: '#6a4a3a', alinear: 'left', peso: 700 });
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

export const WAFLES = {
  id: 'wafles',
  nombre: 'Waflería',
  titulo: (rol) => `La Waflería de ${rol === 'el' ? 'Él' : 'Ella'}`,
  plato: 'wafle_chef',
  nombrePlato: 'Wafles de chef',
  tema: { pared: '#f6c98f', acento: '#e0793a', piso: '#e9d3b8' },
  mejoras: MEJORAS,
  desbloqueos: DESBLOQUEOS,
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
  dibujarPlato(g, t, x, y, esc, m) {
    const o = { x, y, rx: 190 * esc, ry: 190 * esc * 0.56 };
    dibujarPlatoWafles(g, t.obra, o, m.reloj + 99);
    if (t.obra.vaso?.sabor) dibujarVaso(g, t.obra.vaso, x + 190 * esc, y + 30, 0.8);
  },  /** Para las pruebas automáticas. */
  pruebas: { ovaloPlato, superficieDe, TOP, patron },
} as Receta<PedidoWafles, ObraWafles> & { pruebas: unknown };
