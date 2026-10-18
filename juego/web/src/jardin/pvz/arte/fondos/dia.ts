// Escenario del mundo 1 (el día en la casa): casa con porche a la izquierda, césped de 9 × 5 a cuadros claros y
// oscuros, cerca con arbustos arriba, andén y calle a la derecha. Se pinta UNA vez en un lienzo en caché (por escala
// y filas activas) y cada cuadro solo se copia. Las filas no activas se ven de tierra sin pasto, como en el 1-1.

import {
  ALTO_FILA, ALTO_MUNDO, ANCHO_COL, ANCHO_CESPED, COLUMNAS, FILAS, ORIGEN_CESPED_X, ORIGEN_CESPED_Y, X_MAX, X_MIN,
} from '../geometria';

export interface OpcionesFondo {
  /** Píxeles de dispositivo por unidad de mundo (resolución de la caché). */
  escala: number;
  /** Filas con pasto (0..4). Por defecto todas. */
  filasActivas?: readonly number[];
  /** Reloj en segundos (flores y nubes que se mecen; el resto es fijo). */
  t?: number;
  /** Tamaño del lienzo de destino en píxeles: lo que quede fuera del mundo pintado se rellena con su color de borde. */
  ancho?: number;
  alto?: number;
}

export interface LienzoFondo {
  lienzo: HTMLCanvasElement;
  /** Zona del mundo que cubre el lienzo. */
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

const cache = new Map<string, LienzoFondo>();

/** Color de relleno fuera del mundo pintado. */
export const COLOR_BORDE_DIA = '#34501f';

/**
 * Dibuja el escenario del día. Igual que los personajes, usa la transformación actual del contexto (mundo →
 * píxeles) y cubre de X_MIN a X_MAX y de 0 a ALTO_MUNDO.
 */
export function dibujarFondoDia(ctx: CanvasRenderingContext2D, op: OpcionesFondo): void {
  if (op.ancho && op.alto) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLOR_BORDE_DIA;
    ctx.fillRect(0, 0, op.ancho, op.alto);
    ctx.restore();
  }
  const f = lienzoFondoDia(op);
  ctx.drawImage(f.lienzo, f.x, f.y, f.ancho, f.alto);
  if (op.t !== undefined) dibujarVivos(ctx, op.t);
}

/** Lienzo en caché del escenario (para la vista o la pantalla de elegir semillas). */
export function lienzoFondoDia(op: OpcionesFondo): LienzoFondo {
  const filas = [...(op.filasActivas ?? [0, 1, 2, 3, 4])].sort();
  const esc = Math.max(0.25, Math.round(op.escala * 8) / 8);
  const clave = esc + '|' + filas.join(',');
  const ya = cache.get(clave);
  if (ya) return ya;
  const ancho = X_MAX - X_MIN;
  const L = document.createElement('canvas');
  L.width = Math.ceil(ancho * esc);
  L.height = Math.ceil(ALTO_MUNDO * esc);
  const g = L.getContext('2d')!;
  g.setTransform(esc, 0, 0, esc, -X_MIN * esc, 0);
  pintar(g, new Set(filas));
  const r: LienzoFondo = { lienzo: L, x: X_MIN, y: 0, ancho, alto: ALTO_MUNDO };
  cache.set(clave, r);
  return r;
}

/** Suelta las cachés del fondo (al salir del juego). */
export function liberarFondoDia(): void {
  for (const f of cache.values()) f.lienzo.width = f.lienzo.height = 0;
  cache.clear();
}

// ---------------------------------------------------------------------------------------------------------------

/** Azar con semilla (mismo dibujo siempre). */
function azar(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const TINTA = '#1d1408';
const Y0 = ORIGEN_CESPED_Y;
const Y1 = ORIGEN_CESPED_Y + ALTO_FILA * FILAS;
const XC1 = ORIGEN_CESPED_X + ANCHO_CESPED;
/** Donde termina el pasto sin cortar y empieza el andén. */
const X_ANDEN = 812;
const X_SARDINEL = 918;
const X_CASA = -150;
const X_PORCHE = -72;

function pintar(g: CanvasRenderingContext2D, activas: Set<number>): void {
  const r = azar(20261018);
  cielo(g, r);
  cerca(g, r);
  pastoBorde(g, r);
  cesped(g, r, activas);
  andenYCalle(g, r);
  casa(g, r);
  arbustos(g, r);
  sombras(g);
}

function cielo(g: CanvasRenderingContext2D, r: () => number): void {
  const cielo = g.createLinearGradient(0, 0, 0, 60);
  cielo.addColorStop(0, '#8fd0f5');
  cielo.addColorStop(1, '#c9ecff');
  g.fillStyle = cielo;
  g.fillRect(X_MIN, 0, X_MAX - X_MIN, 70);
  // árboles del fondo
  for (let x = X_MIN; x < X_MAX + 40; x += 34 + r() * 20) {
    const y = 26 + r() * 10;
    const rr = 22 + r() * 12;
    g.fillStyle = r() < 0.5 ? '#3f8a2a' : '#4b9a30';
    g.beginPath();
    g.arc(x, y, rr, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.beginPath();
    g.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.45, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#2f6d1f';
  g.fillRect(X_MIN, 44, X_MAX - X_MIN, 30);
}

function cerca(g: CanvasRenderingContext2D, r: () => number): void {
  // Cerca de tablas blancas detrás del césped (de la casa al andén).
  const y0 = 30, y1 = 76;
  g.fillStyle = '#d9cfb6';
  g.fillRect(X_PORCHE - 10, y0 + 12, X_ANDEN - X_PORCHE + 10, 6);
  g.fillRect(X_PORCHE - 10, y0 + 32, X_ANDEN - X_PORCHE + 10, 6);
  for (let x = X_PORCHE - 6; x < X_ANDEN; x += 15) {
    g.fillStyle = '#f4efe2';
    g.strokeStyle = TINTA;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x, y1);
    g.lineTo(x, y0 + 6);
    g.lineTo(x + 5.5, y0);
    g.lineTo(x + 11, y0 + 6);
    g.lineTo(x + 11, y1);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = 'rgba(120,100,70,0.18)';
    g.fillRect(x + 7.5, y0 + 7, 3, y1 - y0 - 8);
  }
}

function pastoBorde(g: CanvasRenderingContext2D, r: () => number): void {
  // Pasto general (bajo todo): a la izquierda del césped y entre el césped y el andén.
  g.fillStyle = '#5aa634';
  g.fillRect(X_PORCHE, 70, X_ANDEN - X_PORCHE, ALTO_MUNDO - 70);
  briznas(g, r, X_PORCHE, 70, X_ANDEN - X_PORCHE, ALTO_MUNDO - 70, 1400, ['#4c9a2b', '#6bb83f', '#53a12f']);
}

function briznas(g: CanvasRenderingContext2D, r: () => number, x: number, y: number, w: number, h: number, n: number, colores: string[]): void {
  g.lineWidth = 1.3;
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const px = x + r() * w;
    const py = y + r() * h;
    g.strokeStyle = colores[(r() * colores.length) | 0];
    g.globalAlpha = 0.55 + r() * 0.35;
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(px + (r() - 0.5) * 3, py - 3 - r() * 4);
    g.stroke();
  }
  g.globalAlpha = 1;
}

function cesped(g: CanvasRenderingContext2D, r: () => number, activas: Set<number>): void {
  for (let f = 0; f < FILAS; f++) {
    const y = Y0 + f * ALTO_FILA;
    if (!activas.has(f)) {
      tierra(g, r, y, f);
      continue;
    }
    for (let c = 0; c < COLUMNAS; c++) {
      const x = ORIGEN_CESPED_X + c * ANCHO_COL;
      const claro = (f + c) % 2 === 0;
      const gr = g.createLinearGradient(x, y, x, y + ALTO_FILA);
      if (claro) {
        gr.addColorStop(0, '#8ed357');
        gr.addColorStop(1, '#7cc649');
      } else {
        gr.addColorStop(0, '#6db83f');
        gr.addColorStop(1, '#5eab35');
      }
      g.fillStyle = gr;
      g.fillRect(x, y, ANCHO_COL, ALTO_FILA);
      // franjas de la podadora dentro de la casilla
      g.fillStyle = claro ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
      g.fillRect(x + 10, y, 20, ALTO_FILA);
      g.fillRect(x + 50, y, 20, ALTO_FILA);
      briznas(g, r, x, y + 4, ANCHO_COL, ALTO_FILA - 4, 46, claro ? ['#6db83f', '#a4e06a', '#7cc649'] : ['#4f9c2c', '#7fc84c', '#5aa634']);
    }
    // línea suave entre filas
    g.fillStyle = 'rgba(0,0,0,0.07)';
    g.fillRect(ORIGEN_CESPED_X, y + ALTO_FILA - 2, ANCHO_CESPED, 2);
  }
  // Florecitas y piedritas al azar sobre el pasto (no en la tierra).
  for (let i = 0; i < 26; i++) {
    const f = (r() * FILAS) | 0;
    if (!activas.has(f)) continue;
    const x = r() * ANCHO_CESPED;
    const y = Y0 + f * ALTO_FILA + 10 + r() * 80;
    if (r() < 0.6) flor(g, x, y, ['#fff', '#ffe14d', '#ff9ad0'][(r() * 3) | 0]);
    else piedra(g, x, y, 2 + r() * 2);
  }
}

function tierra(g: CanvasRenderingContext2D, r: () => number, y: number, f: number): void {
  const x = ORIGEN_CESPED_X - 4;
  const w = ANCHO_CESPED + 8;
  const gr = g.createLinearGradient(0, y, 0, y + ALTO_FILA);
  gr.addColorStop(0, '#8a5a30');
  gr.addColorStop(0.5, '#9c6a3a');
  gr.addColorStop(1, '#7c4f28');
  g.fillStyle = gr;
  g.fillRect(x, y + 2, w, ALTO_FILA - 4);
  // terrones y surcos
  for (let i = 0; i < 160; i++) {
    const px = x + r() * w;
    const py = y + 6 + r() * (ALTO_FILA - 12);
    g.fillStyle = r() < 0.5 ? 'rgba(60,35,15,0.35)' : 'rgba(200,150,100,0.25)';
    g.beginPath();
    g.ellipse(px, py, 2 + r() * 4, 1 + r() * 2, 0, 0, Math.PI * 2);
    g.fill();
  }
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = 'rgba(60,35,15,0.25)';
    g.lineWidth = 2;
    g.beginPath();
    const yy = y + 25 + k * 25;
    g.moveTo(x, yy);
    for (let xx = x; xx <= x + w; xx += 40) g.lineTo(xx, yy + (r() - 0.5) * 3);
    g.stroke();
  }
  // borde de pasto irregular arriba y abajo
  g.fillStyle = '#5aa634';
  for (const borde of [y + 2, y + ALTO_FILA - 2]) {
    g.beginPath();
    g.moveTo(x, borde);
    for (let xx = x; xx <= x + w; xx += 6) g.lineTo(xx, borde + (borde === y + 2 ? 1 : -1) * (2 + r() * 5));
    g.lineTo(x + w, borde);
    g.closePath();
    g.fill();
  }
  // borde oscuro como de tierra removida
  g.strokeStyle = 'rgba(40,22,8,0.45)';
  g.lineWidth = 1.5;
  g.strokeRect(x + 1, y + 6, w - 2, ALTO_FILA - 12);
  void f;
}

function flor(g: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  g.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.beginPath();
    g.arc(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.8, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#f5a623';
  g.beginPath();
  g.arc(x, y, 1.3, 0, Math.PI * 2);
  g.fill();
}

function piedra(g: CanvasRenderingContext2D, x: number, y: number, rr: number): void {
  g.fillStyle = '#b9b2a2';
  g.strokeStyle = 'rgba(29,20,8,0.6)';
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(x, y, rr * 1.3, rr, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
}

function andenYCalle(g: CanvasRenderingContext2D, r: () => number): void {
  // Borde de flores y pasto alto entre el césped y el andén.
  g.fillStyle = '#4f9a2c';
  g.fillRect(XC1, Y0 - 6, X_ANDEN - XC1, Y1 - Y0 + 26);
  briznas(g, r, XC1, Y0, X_ANDEN - XC1, Y1 - Y0 + 20, 400, ['#3f8a22', '#6bb83f', '#5aa634', '#2f6d18']);
  // Andén de concreto con juntas.
  const gr = g.createLinearGradient(X_ANDEN, 0, X_SARDINEL, 0);
  gr.addColorStop(0, '#d8d3c8');
  gr.addColorStop(1, '#c6c0b3');
  g.fillStyle = gr;
  g.fillRect(X_ANDEN, 0, X_SARDINEL - X_ANDEN, ALTO_MUNDO);
  g.strokeStyle = 'rgba(70,60,45,0.35)';
  g.lineWidth = 1.6;
  for (let y = 10; y < ALTO_MUNDO; y += 86) {
    g.beginPath();
    g.moveTo(X_ANDEN, y);
    g.lineTo(X_SARDINEL, y);
    g.stroke();
  }
  g.beginPath();
  g.moveTo((X_ANDEN + X_SARDINEL) / 2, 0);
  g.lineTo((X_ANDEN + X_SARDINEL) / 2, ALTO_MUNDO);
  g.stroke();
  for (let i = 0; i < 90; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)';
    g.beginPath();
    g.arc(X_ANDEN + r() * (X_SARDINEL - X_ANDEN), r() * ALTO_MUNDO, 1 + r() * 2.5, 0, Math.PI * 2);
    g.fill();
  }
  // borde de pasto sobre el andén
  g.fillStyle = '#4f9a2c';
  g.beginPath();
  g.moveTo(X_ANDEN - 2, 0);
  for (let y = 0; y <= ALTO_MUNDO; y += 7) g.lineTo(X_ANDEN + 1 + r() * 5, y);
  g.lineTo(X_ANDEN - 2, ALTO_MUNDO);
  g.closePath();
  g.fill();
  // Sardinel.
  g.fillStyle = '#e9e5dc';
  g.fillRect(X_SARDINEL, 0, 14, ALTO_MUNDO);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(X_SARDINEL + 12, 0, 4, ALTO_MUNDO);
  // Calle de asfalto con línea amarilla discontinua.
  const ga = g.createLinearGradient(X_SARDINEL + 14, 0, X_MAX, 0);
  ga.addColorStop(0, '#55585e');
  ga.addColorStop(1, '#63666c');
  g.fillStyle = ga;
  g.fillRect(X_SARDINEL + 16, 0, X_MAX - X_SARDINEL - 16, ALTO_MUNDO);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.07)';
    g.fillRect(X_SARDINEL + 16 + r() * (X_MAX - X_SARDINEL), r() * ALTO_MUNDO, 1.5, 1.5);
  }
  g.fillStyle = '#f2c230';
  for (let y = 4; y < ALTO_MUNDO; y += 60) g.fillRect(1100, y, 8, 34);
  // Grietas.
  g.strokeStyle = 'rgba(20,20,20,0.35)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    let x = X_SARDINEL + 40 + r() * 230, y = r() * ALTO_MUNDO;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += (r() - 0.5) * 16;
      y += 6 + r() * 8;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

function casa(g: CanvasRenderingContext2D, r: () => number): void {
  // Porche de tablas (donde descansan los cortacéspedes al borde del césped).
  const gp = g.createLinearGradient(X_CASA, 0, X_PORCHE, 0);
  gp.addColorStop(0, '#a87a4c');
  gp.addColorStop(1, '#c99a63');
  g.fillStyle = gp;
  g.fillRect(X_CASA, 60, X_PORCHE - X_CASA, ALTO_MUNDO - 60);
  g.strokeStyle = 'rgba(80,50,20,0.45)';
  g.lineWidth = 1.4;
  for (let y = 66; y < ALTO_MUNDO; y += 13) {
    g.beginPath();
    g.moveTo(X_CASA, y);
    g.lineTo(X_PORCHE, y);
    g.stroke();
    // juntas de las tablas
    const jx = X_CASA + 10 + r() * (X_PORCHE - X_CASA - 20);
    g.beginPath();
    g.moveTo(jx, y);
    g.lineTo(jx, y + 13);
    g.stroke();
  }
  // borde del porche y escalón
  g.fillStyle = '#7a5230';
  g.fillRect(X_PORCHE - 8, 60, 8, ALTO_MUNDO - 60);
  g.fillStyle = '#e8dcc0';
  g.fillRect(X_PORCHE, 60, 10, ALTO_MUNDO - 60);
  g.strokeStyle = TINTA;
  g.lineWidth = 2;
  g.strokeRect(X_PORCHE, 60, 10, ALTO_MUNDO - 60);
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.fillRect(X_PORCHE + 10, 60, 8, ALTO_MUNDO - 60);

  // Pared de la casa (tablas horizontales color crema).
  const gw = g.createLinearGradient(X_MIN, 0, X_CASA, 0);
  gw.addColorStop(0, '#e9dcbc');
  gw.addColorStop(1, '#f6ecd2');
  g.fillStyle = gw;
  g.fillRect(X_MIN, 40, X_CASA - X_MIN, ALTO_MUNDO - 40);
  g.strokeStyle = 'rgba(120,95,60,0.35)';
  g.lineWidth = 1.2;
  for (let y = 48; y < ALTO_MUNDO; y += 11) {
    g.beginPath();
    g.moveTo(X_MIN, y);
    g.lineTo(X_CASA, y);
    g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(X_CASA - 10, 40, 10, ALTO_MUNDO - 40);
  g.fillStyle = '#d9cba6';
  g.strokeStyle = TINTA;
  g.lineWidth = 2;
  g.fillRect(X_CASA - 4, 40, 8, ALTO_MUNDO - 40);
  g.strokeRect(X_CASA - 4, 40, 8, ALTO_MUNDO - 40);

  ventana(g, -238, 110, 66, 86);
  ventana(g, -238, 420, 66, 86);
  puerta(g, -232, 250, 64, 128);

  // Columnas del porche.
  for (const y of [70, 300, 530]) columna(g, X_PORCHE - 30, y);

  // Alero del techo arriba a la izquierda.
  g.fillStyle = '#6b3d22';
  g.beginPath();
  g.moveTo(X_MIN, 0);
  g.lineTo(X_PORCHE + 12, 0);
  g.lineTo(X_PORCHE + 12, 46);
  g.lineTo(X_MIN, 70);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(30,15,5,0.5)';
  g.lineWidth = 1.5;
  for (let x = X_MIN + 8; x < X_PORCHE + 12; x += 16) {
    for (let y = 6; y < 66; y += 12) {
      const lim = 70 - ((x - X_MIN) / (X_PORCHE + 12 - X_MIN)) * 24;
      if (y > lim - 6) continue;
      g.beginPath();
      g.moveTo(x + ((y / 12) % 2) * 8, y);
      g.lineTo(x + ((y / 12) % 2) * 8, y + 10);
      g.stroke();
    }
    g.beginPath();
  }
  g.fillStyle = '#4a2814';
  g.beginPath();
  g.moveTo(X_MIN, 64);
  g.lineTo(X_PORCHE + 12, 40);
  g.lineTo(X_PORCHE + 12, 48);
  g.lineTo(X_MIN, 74);
  g.closePath();
  g.fill();
  g.strokeStyle = TINTA;
  g.lineWidth = 2;
  g.stroke();
}

function ventana(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.fillStyle = '#3b6b3a';
  g.strokeStyle = TINTA;
  g.lineWidth = 2;
  g.fillRect(x - 12, y - 4, 12, h + 8);
  g.strokeRect(x - 12, y - 4, 12, h + 8);
  g.fillRect(x + w, y - 4, 12, h + 8);
  g.strokeRect(x + w, y - 4, 12, h + 8);
  const gv = g.createLinearGradient(x, y, x + w, y + h);
  gv.addColorStop(0, '#d8f1ff');
  gv.addColorStop(0.5, '#8cc8ec');
  gv.addColorStop(1, '#5c9cc8');
  g.fillStyle = '#fbf6ea';
  g.fillRect(x - 4, y - 4, w + 8, h + 8);
  g.strokeRect(x - 4, y - 4, w + 8, h + 8);
  g.fillStyle = gv;
  g.fillRect(x, y, w, h);
  g.strokeStyle = '#fbf6ea';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x + w / 2, y);
  g.lineTo(x + w / 2, y + h);
  g.moveTo(x, y + h / 2);
  g.lineTo(x + w, y + h / 2);
  g.stroke();
  g.strokeStyle = TINTA;
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.beginPath();
  g.moveTo(x + 4, y + 4);
  g.lineTo(x + 18, y + 4);
  g.lineTo(x + 4, y + 22);
  g.closePath();
  g.fill();
  // matera bajo la ventana
  g.fillStyle = '#b5532a';
  g.fillRect(x - 6, y + h + 6, w + 12, 12);
  g.strokeRect(x - 6, y + h + 6, w + 12, 12);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? '#e8414b' : '#ffd23f';
    g.beginPath();
    g.arc(x + 4 + i * 11, y + h + 4, 4.5, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
}

function puerta(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.fillStyle = '#fbf6ea';
  g.strokeStyle = TINTA;
  g.lineWidth = 2;
  g.fillRect(x - 6, y - 6, w + 12, h + 6);
  g.strokeRect(x - 6, y - 6, w + 12, h + 6);
  const gd = g.createLinearGradient(x, y, x + w, y);
  gd.addColorStop(0, '#7c3f1d');
  gd.addColorStop(1, '#a3582a');
  g.fillStyle = gd;
  g.fillRect(x, y, w, h);
  g.strokeRect(x, y, w, h);
  g.strokeStyle = 'rgba(40,15,5,0.6)';
  g.lineWidth = 1.6;
  g.strokeRect(x + 8, y + 10, w - 16, h * 0.36);
  g.strokeRect(x + 8, y + h * 0.52, w - 16, h * 0.4);
  g.fillStyle = '#f2c230';
  g.strokeStyle = TINTA;
  g.beginPath();
  g.arc(x + w - 10, y + h * 0.5, 3.6, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  // tapete
  g.fillStyle = '#b8443a';
  g.fillRect(x + w + 14, y + 20, 26, h - 40);
  g.strokeRect(x + w + 14, y + 20, 26, h - 40);
}

function columna(g: CanvasRenderingContext2D, x: number, y: number): void {
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.beginPath();
  g.ellipse(x + 12, y + 50, 16, 6, 0, 0, Math.PI * 2);
  g.fill();
  const gc = g.createLinearGradient(x, 0, x + 18, 0);
  gc.addColorStop(0, '#ffffff');
  gc.addColorStop(1, '#d8cfb8');
  g.fillStyle = gc;
  g.strokeStyle = TINTA;
  g.lineWidth = 2;
  g.fillRect(x, y - 30, 18, 80);
  g.strokeRect(x, y - 30, 18, 80);
  g.fillRect(x - 4, y + 42, 26, 8);
  g.strokeRect(x - 4, y + 42, 26, 8);
}

function arbusto(g: CanvasRenderingContext2D, r: () => number, x: number, y: number, tam: number): void {
  const bolas = 5 + ((r() * 3) | 0);
  const pos: [number, number, number][] = [];
  for (let i = 0; i < bolas; i++) pos.push([x + (r() - 0.5) * tam * 1.3, y + (r() - 0.5) * tam * 0.6, tam * (0.38 + r() * 0.22)]);
  g.fillStyle = TINTA;
  for (const [px, py, rr] of pos) {
    g.beginPath();
    g.arc(px, py, rr + 2, 0, Math.PI * 2);
    g.fill();
  }
  for (const [px, py, rr] of pos) {
    const gb = g.createRadialGradient(px - rr * 0.35, py - rr * 0.4, rr * 0.1, px, py, rr);
    gb.addColorStop(0, '#6fc048');
    gb.addColorStop(1, '#2f7a1c');
    g.fillStyle = gb;
    g.beginPath();
    g.arc(px, py, rr, 0, Math.PI * 2);
    g.fill();
  }
}

function arbustos(g: CanvasRenderingContext2D, r: () => number): void {
  // Fila de arbustos al pie de la cerca y unos cuantos en las esquinas del andén.
  for (let x = X_PORCHE + 10; x < X_ANDEN + 10; x += 30 + r() * 16) arbusto(g, r, x, 70 + r() * 6, 22 + r() * 8);
  arbusto(g, r, 790, 100, 34);
  arbusto(g, r, 800, 160, 26);
  arbusto(g, r, 795, 575, 36);
  arbusto(g, r, X_PORCHE + 4, 590, 30);
}

function sombras(g: CanvasRenderingContext2D): void {
  // Sombra suave de la cerca sobre la primera fila y del porche sobre el borde izquierdo.
  const gs = g.createLinearGradient(0, Y0 - 4, 0, Y0 + 26);
  gs.addColorStop(0, 'rgba(0,0,0,0.28)');
  gs.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gs;
  g.fillRect(X_PORCHE + 18, Y0 - 4, X_ANDEN - X_PORCHE, 30);
  const gl = g.createLinearGradient(X_PORCHE + 18, 0, X_PORCHE + 50, 0);
  gl.addColorStop(0, 'rgba(0,0,0,0.18)');
  gl.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gl;
  g.fillRect(X_PORCHE + 18, Y0, 32, Y1 - Y0 + 20);
}

/** Detalles vivos encima de la caché (mariposas que pasan por arriba). Baratos: unos pocos trazos. */
function dibujarVivos(ctx: CanvasRenderingContext2D, t: number): void {
  for (let i = 0; i < 2; i++) {
    const x = ((t * 22 + i * 520) % (X_MAX - X_MIN)) + X_MIN;
    const y = 30 + Math.sin(t * 1.3 + i * 2) * 10 + i * 8;
    const a = Math.abs(Math.sin(t * 12 + i)) * 4 + 1;
    ctx.fillStyle = i ? '#ffe14d' : '#ffffff';
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x - 2.5, y, a, 3, -0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 2.5, y, a, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
