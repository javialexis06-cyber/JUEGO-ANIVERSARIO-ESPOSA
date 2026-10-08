// Los dibujitos de los recuerdos: ilustraciones 2D con cariño (cielos, luces, mar, montañas, ciudad…) y Él y
// Ella de verdad (recortes sacados del mismo modelo 3D del juego). El fondo de cada escena se pinta una sola
// vez y encima se anima lo que se mueve (agua, lucecitas, confeti, los dos meciéndose).
export const W = 320, H = 170;
type G = CanvasRenderingContext2D;
export type Quien = 'el' | 'ella' | null;

// ------------------------------------------------------------------ Recortes de Él y Ella
const POSES = ['feliz', 'habla', 'risa', 'beso', 'abrazo', 'saludo', 'celebra', 'piensa', 'sorpresa', 'llora', 'puchero', 'regalo', 'arriba', 'sentado', 'presume', 'guino', 'timido', 'rodillas', 'baile', 'duerme'] as const;
export type Pose = (typeof POSES)[number];
const sprites = new Map<string, HTMLImageElement>();
export function precargar() {
  if (sprites.size) return;
  for (const rol of ['el', 'ella'])
    for (const p of POSES) {
      const img = new Image();
      img.src = `./recuerdos/${rol}_${p}.webp`;
      sprites.set(`${rol}_${p}`, img);
    }
}

/** Cómo reacciona cada uno a la frase que se está diciendo (la pone el panel de recuerdos): la pose se queda toda
 *  la frase y se mueve de a poquito (se ríe sacudiéndose, llora temblando, celebra brincando…), sin volver a empezar. */
export type Movimiento = 'risa' | 'temblor' | 'brinco' | 'vaiven' | 'asomo' | null;
export interface Reaccion {
  pose: Pose;
  mov: Movimiento;
  /** Cuándo empezó (segundos desde que empezó el recuerdo): el brinco de la sorpresa se hace una sola vez. */
  desde: number;
}
let reacciones: Partial<Record<'el' | 'ella', Reaccion>> = {};
export function ponerReacciones(r: Partial<Record<'el' | 'ella', Reaccion>>) {
  reacciones = r;
}
/** Poses que la escena necesita tal cual (dormidos, sentados): la reacción no las cambia. */
const FIJAS: Pose[] = ['duerme', 'sentado', 'arriba'];

/** Él o Ella parado en (x, y = los pies), de `alto` px. Ella se voltea para mirar hacia la izquierda. */
function actor(g: G, rol: 'el' | 'ella', pose: Pose, x: number, y: number, alto: number, t: number, habla: Quien, o: { espejo?: boolean; sombra?: boolean; salto?: boolean } = {}) {
  const r = reacciones[rol];
  const reacciona = r && !FIJAS.includes(pose) && alto > 40;
  if (reacciona) pose = r.pose;
  const img = sprites.get(`${rol}_${pose}`);
  if (!img?.complete || !img.naturalWidth) return;
  const k = alto / img.naturalHeight;
  const w = img.naturalWidth * k;
  const fase = rol === 'el' ? 0 : 1.7;
  let dy = Math.sin(t * 2 + fase) * 0.7;
  let dx = 0;
  let giro = 0;
  if (reacciona) {
    const u = t - r.desde;
    // Cada reacción se sostiene toda la frase (no se reinicia)
    if (r.mov === 'risa') {
      dy -= Math.abs(Math.sin(t * 16)) * 1.6;
      giro = Math.sin(t * 8) * 0.035;
    } else if (r.mov === 'temblor') dx = Math.sin(t * 30) * 0.7;
    else if (r.mov === 'brinco') dy -= Math.abs(Math.sin(t * 5 + fase)) * 6;
    else if (r.mov === 'vaiven') giro = Math.sin(t * 2.2 + fase) * 0.05;
    else if (r.mov === 'asomo') dy -= u < 0.35 ? Math.sin((u / 0.35) * Math.PI) * 9 : 0;
    else if (habla === rol) dy -= Math.abs(Math.sin(t * 7)) * 0.9;
  } else if (habla === rol) dy -= Math.abs(Math.sin(t * 7)) * 0.9;
  if (o.salto && !reacciona) dy -= Math.abs(Math.sin(t * 3.2 + fase)) * 7;
  if (o.sombra !== false) {
    const gr = g.createRadialGradient(x, y, 1, x, y, w * 0.45);
    gr.addColorStop(0, 'rgba(40,20,20,0.32)');
    gr.addColorStop(1, 'rgba(40,20,20,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(x, y, w * 0.45, w * 0.11, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.save();
  g.translate(x + dx, y + dy);
  if (giro) g.rotate(giro);
  if (o.espejo ?? rol === 'ella') g.scale(-1, 1);
  g.drawImage(img, -w / 2, -alto, w, alto);
  g.restore();
}

/** Dónde queda la cabeza de un actor (para ponerle orejas, corona, antifaz…). */
const cabeza = (x: number, y: number, alto: number) => ({ x, y: y - alto * 0.72, r: alto * 0.27 });

// ------------------------------------------------------------------ Azar con semilla (fondos iguales siempre)
function azar(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ Piezas
function cielo(g: G, ...colores: string[]) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  colores.forEach((c, i) => gr.addColorStop(i / (colores.length - 1), c));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}

function brillo(g: G, x: number, y: number, r: number, color: string, fuerza = 0.8) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.save();
  g.globalAlpha = fuerza;
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

function sol(g: G, x: number, y: number, r: number, centro = '#fff6d0', borde = '#ffc46b') {
  brillo(g, x, y, r * 4, 'rgba(255,214,140,0.9)', 0.55);
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
  gr.addColorStop(0, centro);
  gr.addColorStop(1, borde);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function luna(g: G, x: number, y: number, r: number, fondo: string) {
  brillo(g, x, y, r * 3.5, 'rgba(255,246,200,0.7)', 0.45);
  g.fillStyle = '#fff4c7';
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(230,214,160,0.55)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.18], [0.25, 0.3, 0.12], [0.1, -0.4, 0.09]]) {
    g.beginPath();
    g.arc(x + dx * r, y + dy * r, rr * r, 0, Math.PI * 2);
    g.fill();
  }
  if (fondo) {
    g.fillStyle = fondo;
    g.beginPath();
    g.arc(x + r * 0.45, y - r * 0.2, r * 0.88, 0, Math.PI * 2);
    g.fill();
  }
}

function estrellitas(g: G, n: number, semilla: number, alto = H * 0.7, t = 0, color = '#fff6d8') {
  const r = azar(semilla);
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * alto, tam = 0.4 + r() * 1.3, f = r() * 6;
    g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * (1 + r()) + f));
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, tam, 0, Math.PI * 2);
    g.fill();
    if (tam > 1.4) {
      g.fillRect(x - tam * 2.2, y - 0.25, tam * 4.4, 0.5);
      g.fillRect(x - 0.25, y - tam * 2.2, 0.5, tam * 4.4);
    }
  }
  g.globalAlpha = 1;
}

function nube(g: G, x: number, y: number, s: number, color = '#ffffff', sombra = 'rgba(180,170,210,0.35)') {
  const bolas: [number, number, number][] = [[-22, 2, 12], [-8, -6, 16], [10, -4, 14], [24, 3, 10], [0, 5, 14]];
  g.fillStyle = sombra;
  for (const [dx, dy, r] of bolas) {
    g.beginPath();
    g.arc(x + dx * s, y + (dy + 3) * s, r * s, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = color;
  for (const [dx, dy, r] of bolas) {
    g.beginPath();
    g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    g.fill();
  }
}

/** Una cordillera con su ruido (varias capas con neblina hacen profundidad). */
function cordillera(g: G, base: number, amp: number, color: string, semilla: number, picos = 5) {
  const r = azar(semilla);
  const fases = Array.from({ length: 3 }, () => r() * 6);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) {
    const k = x / W;
    const y = base - amp * (0.55 * Math.sin(k * Math.PI * picos * 0.5 + fases[0]) + 0.3 * Math.sin(k * Math.PI * picos * 1.3 + fases[1]) + 0.15 * Math.sin(k * Math.PI * picos * 3.1 + fases[2]));
    g.lineTo(x, y);
  }
  g.lineTo(W, H);
  g.fill();
}

function neblina(g: G, y: number, alto: number, color = 'rgba(255,255,255,0.35)') {
  const gr = g.createLinearGradient(0, y - alto, 0, y + alto);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.5, color);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, y - alto, W, alto * 2);
}

function ciudad(g: G, base: number, color: string, semilla: number, luces = true, altoMax = 60) {
  const r = azar(semilla);
  let x = -5;
  while (x < W) {
    const w = 12 + r() * 22, h = 15 + r() * altoMax;
    g.fillStyle = color;
    g.fillRect(x, base - h, w, h + 2);
    if (r() < 0.25) g.fillRect(x + w * 0.4, base - h - 8, 2, 8);
    if (luces)
      for (let yy = base - h + 4; yy < base - 4; yy += 6)
        for (let xx = x + 3; xx < x + w - 3; xx += 5)
          if (r() < 0.45) {
            g.fillStyle = r() < 0.8 ? 'rgba(255,214,130,0.9)' : 'rgba(255,245,220,0.95)';
            g.fillRect(xx, yy, 2, 2.5);
          }
    x += w + 1 + r() * 3;
  }
}

function piso(g: G, y: number, a: string, b: string) {
  const gr = g.createLinearGradient(0, y, 0, H);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  g.fillStyle = gr;
  g.fillRect(0, y, W, H - y);
}

function arbol(g: G, x: number, y: number, s: number, color = '#6cbf6a', oscuro = '#4e9d57') {
  g.fillStyle = '#8a5a3c';
  g.fillRect(x - 2 * s, y - 16 * s, 4 * s, 16 * s);
  for (const [dx, dy, r, c] of [[-8, -22, 11, oscuro], [8, -24, 12, oscuro], [0, -32, 14, color], [-9, -27, 9, color], [9, -29, 9, color]] as const) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.beginPath();
  g.arc(x - 4 * s, y - 38 * s, 5 * s, 0, Math.PI * 2);
  g.fill();
}

function flor(g: G, x: number, y: number, s: number, color: string, t = 0) {
  g.strokeStyle = '#4e9d57';
  g.lineWidth = 1.4 * s;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + 2 * s, y - 6 * s, x, y - 12 * s);
  g.stroke();
  const cy = y - 12 * s;
  g.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + t * 0.3;
    g.beginPath();
    g.ellipse(x + Math.cos(a) * 3.2 * s, cy + Math.sin(a) * 3.2 * s, 3 * s, 2.1 * s, a, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#f6cf5a';
  g.beginPath();
  g.arc(x, cy, 1.9 * s, 0, Math.PI * 2);
  g.fill();
}

export function corazon(g: G, x: number, y: number, r: number, color = '#e4574b', brillito = true) {
  const gr = g.createLinearGradient(x, y - r, x, y + r);
  gr.addColorStop(0, color);
  gr.addColorStop(1, oscurecer(color));
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.8, y - r * 1.4, x, y - r * 0.5);
  g.bezierCurveTo(x + r * 0.8, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  g.fill();
  if (brillito && r > 4) {
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath();
    g.ellipse(x - r * 0.55, y - r * 0.55, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2);
    g.fill();
  }
}

function oscurecer(c: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(c);
  if (!m) return c;
  const n = parseInt(m[1], 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.72));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function estrella(g: G, x: number, y: number, r: number, color = '#f6cf5a') {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

/** Guirnalda de bombillitos con brillo (titilan). */
function guirnalda(g: G, x0: number, y0: number, x1: number, y1: number, caida: number, n: number, t: number, colores = ['#ff6b6b', '#f6cf5a', '#6bcBff', '#8fd3b6', '#f4b6c2', '#c59bff']) {
  g.strokeStyle = 'rgba(60,40,40,0.6)';
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(x0, y0);
  g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + caida, x1, y1);
  g.stroke();
  for (let i = 1; i < n; i++) {
    const k = i / n;
    const x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * ((x0 + x1) / 2) + k * k * x1;
    const y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * (Math.max(y0, y1) + caida) + k * k * y1;
    const c = colores[i % colores.length];
    const on = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.7);
    brillo(g, x, y + 2, 7, c, 0.5 * on);
    g.fillStyle = c;
    g.beginPath();
    g.ellipse(x, y + 2.5, 1.8, 2.4, 0, 0, Math.PI * 2);
    g.fill();
  }
}

function confeti(g: G, t: number, n = 30, semilla = 3) {
  const r = azar(semilla);
  const colores = ['#e4574b', '#f6cf5a', '#6bcbff', '#8fd3b6', '#f4b6c2', '#c59bff'];
  for (let i = 0; i < n; i++) {
    const x = (r() * W + Math.sin(t + i) * 10) % W, y = (r() * H + t * (20 + r() * 25)) % (H + 10) - 5, a = t * (2 + r() * 3) + i;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = colores[i % colores.length];
    g.fillRect(-2, -1, 4, 2.2);
    g.restore();
  }
}

function corazonesQueSuben(g: G, t: number, n = 5, color = '#f4b6c2') {
  const r = azar(9);
  for (let i = 0; i < n; i++) {
    const k = (t * (0.18 + r() * 0.1) + r()) % 1;
    g.globalAlpha = Math.sin(k * Math.PI) * 0.85;
    corazon(g, 20 + r() * (W - 40) + Math.sin(t * 2 + i) * 6, H - k * (H + 20), 3 + r() * 3, color);
  }
  g.globalAlpha = 1;
}

/** Destellos de bokeh (luces desenfocadas). */
function bokeh(g: G, n: number, semilla: number, colores: string[], t = 0) {
  const r = azar(semilla);
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H * 0.75, rr = 4 + r() * 12;
    g.globalAlpha = (0.12 + r() * 0.2) * (0.7 + 0.3 * Math.sin(t + i));
    g.fillStyle = colores[i % colores.length];
    g.beginPath();
    g.arc(x, y, rr, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

function texto(g: G, s: string, x: number, y: number, tam = 12, color = '#3d2b27', peso = 700) {
  g.fillStyle = color;
  g.font = `${peso} ${tam}px Fredoka, Nunito, sans-serif`;
  g.textAlign = 'center';
  g.fillText(s, x, y);
}

/** Pared de un cuarto con su ventana (para las escenas de adentro). */
function cuarto(g: G, pared: string, pared2: string, pisoA: string, pisoB: string, ventana?: { x: number; noche: boolean }) {
  cielo(g, pared, pared2);
  // Rayitas del papel de colgadura
  g.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = 6; x < W; x += 14) g.fillRect(x, 0, 5, 118);
  if (ventana) {
    const { x, noche } = ventana;
    const gr = g.createLinearGradient(0, 20, 0, 80);
    gr.addColorStop(0, noche ? '#1d1a44' : '#9fd4ff');
    gr.addColorStop(1, noche ? '#4b3a7a' : '#fff1d6');
    g.fillStyle = '#fff8ee';
    g.fillRect(x - 3, 17, 66, 66);
    g.fillStyle = gr;
    g.fillRect(x, 20, 60, 60);
    if (noche) {
      g.save();
      g.beginPath();
      g.rect(x, 20, 60, 60);
      g.clip();
      estrellitas(g, 18, 5, 80);
      luna(g, x + 44, 34, 7, '#27224f');
      g.restore();
    } else nube(g, x + 30, 45, 0.45);
    g.fillStyle = '#fff8ee';
    g.fillRect(x + 28, 20, 3, 60);
    g.fillRect(x, 48, 60, 3);
    // Cortinas
    g.fillStyle = 'rgba(244,182,194,0.9)';
    g.beginPath();
    g.moveTo(x - 8, 14);
    g.quadraticCurveTo(x + 6, 50, x - 4, 88);
    g.lineTo(x - 12, 88);
    g.lineTo(x - 12, 14);
    g.fill();
    g.beginPath();
    g.moveTo(x + 68, 14);
    g.quadraticCurveTo(x + 54, 50, x + 64, 88);
    g.lineTo(x + 72, 88);
    g.lineTo(x + 72, 14);
    g.fill();
  }
  // Zócalo y piso de madera
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.fillRect(0, 116, W, 3);
  piso(g, 119, pisoA, pisoB);
  g.strokeStyle = 'rgba(0,0,0,0.06)';
  g.lineWidth = 1;
  for (let y = 126; y < H; y += 9) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
}

/** El toque final de cuento: un poquito de luz cálida y las esquinas suaves. */
function vineta(g: G) {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(40,20,30,0.28)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}

// ------------------------------------------------------------------ Escenas
export interface Escena2D {
  /** Lo quieto (se pinta una vez). */
  fondo: (g: G) => void;
  /** Lo que se mueve, los dos y lo que va encima. */
  frente: (g: G, t: number, habla: Quien) => void;
}

export const ESCENAS: Record<string, Escena2D> = {
  // Matemáticas y filosofía: de noche en una banca, con símbolos que flotan como luciérnagas
  charla: {
    fondo(g) {
      cielo(g, '#141236', '#2d2160', '#5b3f78');
      estrellitas(g, 60, 21, 100);
      luna(g, 262, 34, 13, '#1c1845');
      cordillera(g, 118, 16, '#3a2f66', 4, 4);
      ciudad(g, 124, '#2a2350', 8, true, 26);
      piso(g, 124, '#2f3a5c', '#1d2340');
      // La banca
      g.fillStyle = '#8a5a3c';
      g.fillRect(96, 128, 128, 6);
      g.fillRect(100, 134, 4, 14);
      g.fillRect(216, 134, 4, 14);
      g.fillRect(96, 110, 128, 5);
    },
    frente(g, t, h) {
      actor(g, 'el', h === 'el' ? 'habla' : 'piensa', 128, 150, 90, t, h);
      actor(g, 'ella', h === 'ella' ? 'habla' : 'timido', 196, 150, 90, t, h);
      const sim = ['π', '∑', '√', '∞', '?', 'φ', '♥'];
      for (let i = 0; i < sim.length; i++) {
        const k = (t * 0.12 + i / sim.length) % 1;
        const x = 70 + ((i * 47) % 180) + Math.sin(t + i) * 8, y = 100 - k * 90;
        g.globalAlpha = Math.sin(k * Math.PI);
        brillo(g, x, y - 4, 12, 'rgba(255,240,170,0.9)', 0.6);
        texto(g, sim[i], x, y, 13, '#fff6c9');
      }
      g.globalAlpha = 1;
      vineta(g);
    },
  },

  // Te busqué por todos lados: un prado de juego con arbustos; ella busca con la lupa y él se asoma
  lupa: {
    fondo(g) {
      cielo(g, '#8fd0ff', '#dff3ff');
      sol(g, 50, 30, 12);
      nube(g, 110, 30, 0.8);
      nube(g, 250, 22, 0.6);
      cordillera(g, 105, 18, '#9fd49a', 12, 3);
      cordillera(g, 118, 12, '#7cc47a', 13, 4);
      piso(g, 118, '#8fd07a', '#6cbf6a');
      for (let i = 0; i < 14; i++) flor(g, 10 + i * 23, 128 + (i % 3) * 12, 0.8, ['#f4b6c2', '#fff', '#f6cf5a'][i % 3]);
      // Letrero
      g.fillStyle = '#8a5a3c';
      g.fillRect(262, 92, 3, 30);
      g.fillStyle = '#c98a5c';
      g.fillRect(242, 86, 44, 13);
      texto(g, '¿Dónde?', 264, 96, 8, '#fff8ee');
    },
    frente(g, t, h) {
      actor(g, 'el', h === 'el' ? 'habla' : 'guino', 70, 152, 84, t, h);
      // Él detrás de un arbusto (se asoma)
      g.fillStyle = '#4e9d57';
      for (const [dx, dy, r] of [[-26, -8, 16], [-8, -14, 20], [14, -10, 17], [30, -4, 13]]) {
        g.beginPath();
        g.arc(70 + dx, 156 + dy, r, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#6cbf6a';
      for (const [dx, dy, r] of [[-18, -14, 10], [4, -22, 12], [22, -14, 9]]) {
        g.beginPath();
        g.arc(70 + dx, 156 + dy, r, 0, Math.PI * 2);
        g.fill();
      }
      actor(g, 'ella', h === 'ella' ? 'habla' : 'piensa', 210, 150, 92, t, h);
      // La lupa que barre
      const x = 150 + Math.sin(t * 1.3) * 34, y = 78 + Math.cos(t * 1.9) * 12;
      g.strokeStyle = '#8a5634';
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x + 11, y + 11);
      g.lineTo(x + 24, y + 24);
      g.stroke();
      g.strokeStyle = '#e0a82e';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, y, 14, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = 'rgba(210,240,255,0.45)';
      g.beginPath();
      g.arc(x, y, 12.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.beginPath();
      g.ellipse(x - 5, y - 5, 4, 2, -0.7, 0, Math.PI * 2);
      g.fill();
      vineta(g);
    },
  },

  // El 25 de octubre: un calendario de escritorio que pasa las hojas hasta el día marcado
  calendario: {
    fondo(g) {
      cuarto(g, '#fbe3d6', '#f3cbbf', '#d9a57e', '#b9835e', { x: 238, noche: false });
      // Escritorio
      g.fillStyle = '#b9835e';
      g.fillRect(40, 120, 180, 8);
      g.fillStyle = '#9a6a48';
      g.fillRect(48, 128, 6, 40);
      g.fillRect(206, 128, 6, 40);
    },
    frente(g, t, h) {
      const n = Math.min(40, Math.floor((t % 11) * 5.5));
      const dia = 15 + n;
      const mes = dia <= 30 ? 'Septiembre' : 'Octubre';
      const d = dia <= 30 ? dia : dia - 30;
      // Calendario con espiral
      g.fillStyle = 'rgba(0,0,0,0.15)';
      g.fillRect(104, 58, 76, 64);
      g.fillStyle = '#fff';
      g.fillRect(100, 54, 76, 64);
      g.fillStyle = '#e4574b';
      g.fillRect(100, 54, 76, 17);
      texto(g, mes, 138, 66, 9, '#fff');
      for (let i = 0; i < 8; i++) {
        g.fillStyle = '#9aa0a8';
        g.beginPath();
        g.arc(106 + i * 9, 54, 2.2, 0, Math.PI * 2);
        g.fill();
      }
      texto(g, String(d), 138, 104, 28, n >= 40 ? '#e4574b' : '#3d2b27');
      if (n >= 40) {
        g.strokeStyle = '#e4574b';
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(138, 95, 20, 15, 0, 0, Math.PI * 2);
        g.stroke();
        corazon(g, 170, 60 + Math.sin(t * 5) * 2, 7);
        confeti(g, t, 18, 7);
      }
      actor(g, 'el', h === 'el' ? 'habla' : 'feliz', 40, 152, 78, t, h);
      actor(g, 'ella', h === 'ella' ? 'habla' : n >= 40 ? 'celebra' : 'piensa', 236, 152, 84, t, h, { salto: n >= 40 });
      vineta(g);
    },
  },

  // Videollamada de noche: dos celulares, cada uno en su cuarto, y el reloj que da vueltas (nadie cuelga)
  videollamada: {
    fondo(g) {
      cielo(g, '#1a1640', '#3b2a66');
      estrellitas(g, 40, 33, 90);
      luna(g, 160, 24, 9, '#211b4d');
      piso(g, 132, '#2b2150', '#1a1438');
      for (const [x, pared] of [[62, '#bcd8f5'], [258, '#f7c6d2']] as const) {
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.fillRect(x - 44, 30, 92, 132);
        g.fillStyle = '#2b2a2a';
        g.beginPath();
        g.roundRect(x - 46, 26, 92, 134, 12);
        g.fill();
        const gr = g.createLinearGradient(0, 34, 0, 152);
        gr.addColorStop(0, pared);
        gr.addColorStop(1, '#fff8ee');
        g.fillStyle = gr;
        g.beginPath();
        g.roundRect(x - 41, 32, 82, 122, 8);
        g.fill();
        g.fillStyle = '#2b2a2a';
        g.beginPath();
        g.roundRect(x - 10, 34, 20, 5, 3);
        g.fill();
      }
    },
    frente(g, t, h) {
      for (const [x, rol] of [[62, 'el'], [258, 'ella']] as const) {
        g.save();
        g.beginPath();
        g.roundRect(x - 41, 32, 82, 122, 8);
        g.clip();
        const dormido = t % 12 > 9.5;
        actor(g, rol, dormido ? 'duerme' : h === rol ? 'habla' : 'feliz', x, 170, 118, t, h, { sombra: false, espejo: rol === 'ella' });
        g.restore();
        if (dormido) texto(g, 'z z', x + 22, 60 + Math.sin(t * 2) * 3, 11, '#6b5fa8');
      }
      // Reloj que da vueltas: ya es tardísimo
      g.fillStyle = '#fff8ee';
      g.beginPath();
      g.arc(160, 86, 22, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#e4574b';
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(160, 86, 22, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = '#3d2b27';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(160, 86);
      g.lineTo(160 + Math.cos(t * 3 - Math.PI / 2) * 15, 86 + Math.sin(t * 3 - Math.PI / 2) * 15);
      g.moveTo(160, 86);
      g.lineTo(160 + Math.cos(t * 0.25 - Math.PI / 2) * 9, 86 + Math.sin(t * 0.25 - Math.PI / 2) * 9);
      g.stroke();
      texto(g, 'Ya es tarde…', 160, 124, 10, '#fff6c9');
      corazon(g, 160, 144 + Math.sin(t * 4) * 2, 6);
      vineta(g);
    },
  },

  // Compañeros de estudio: escritorio con lámpara, cuadernos y el lápiz que escribe solo
  lapiz: {
    fondo(g) {
      cuarto(g, '#e8f0ff', '#cfdcf5', '#c98a5c', '#a86d45', { x: 24, noche: true });
      // Repisa con libros
      g.fillStyle = '#9a6a48';
      g.fillRect(190, 40, 110, 4);
      const colores = ['#e4574b', '#6bcbff', '#8fd3b6', '#f6cf5a', '#c59bff', '#f4b6c2'];
      for (let i = 0; i < 12; i++) {
        g.fillStyle = colores[i % 6];
        const h = 18 + (i % 3) * 4;
        g.fillRect(194 + i * 8.5, 40 - h, 7, h);
      }
      // Escritorio y cuaderno
      g.fillStyle = '#b9835e';
      g.fillRect(90, 118, 140, 7);
      g.fillStyle = '#fff';
      g.fillRect(126, 108, 68, 12);
      g.strokeStyle = '#9ccbef';
      g.lineWidth = 0.6;
      for (let y = 111; y < 120; y += 3) {
        g.beginPath();
        g.moveTo(126, y);
        g.lineTo(194, y);
        g.stroke();
      }
      // Lámpara
      g.fillStyle = '#e4574b';
      g.beginPath();
      g.moveTo(206, 88);
      g.lineTo(224, 88);
      g.lineTo(219, 76);
      g.lineTo(211, 76);
      g.fill();
      g.fillRect(214, 88, 2, 30);
    },
    frente(g, t, h) {
      brillo(g, 215, 98, 44, 'rgba(255,220,140,0.9)', 0.55);
      g.strokeStyle = '#3d2b27';
      g.lineWidth = 1;
      g.beginPath();
      const hasta = 130 + ((t * 18) % 60);
      for (let x = 130; x < hasta; x += 2) g.lineTo(x, 113 + Math.sin(x * 0.8) * 1.5 + (Math.floor((x - 130) / 30) * 3));
      g.stroke();
      g.fillStyle = '#f6cf5a';
      g.save();
      g.translate(hasta, 110);
      g.rotate(-0.8);
      g.fillRect(0, -1.5, 16, 3);
      g.fillStyle = '#f4b6c2';
      g.fillRect(16, -1.5, 3, 3);
      g.restore();
      actor(g, 'el', h === 'el' ? 'habla' : 'piensa', 80, 154, 88, t, h);
      actor(g, 'ella', h === 'ella' ? 'habla' : 'feliz', 250, 154, 88, t, h);
      vineta(g);
    },
  },

  // Psicología / graduación: un escenario con telón, birretes que vuelan y confeti
  birrete: {
    fondo(g) {
      cielo(g, '#5b2a52', '#8a3f6a');
      // Telón
      for (let x = 0; x < W; x += 20) {
        const gr = g.createLinearGradient(x, 0, x + 20, 0);
        gr.addColorStop(0, '#9d2f4a');
        gr.addColorStop(0.5, '#c94a66');
        gr.addColorStop(1, '#9d2f4a');
        g.fillStyle = gr;
        g.fillRect(x, 0, 20, 118);
      }
      g.fillStyle = '#e0a82e';
      g.fillRect(0, 0, W, 8);
      piso(g, 118, '#c98a5c', '#8a5a3c');
      brillo(g, 160, 90, 120, 'rgba(255,240,200,0.8)', 0.5);
      texto(g, '¡Felicitaciones!', 160, 30, 16, '#fff3b0', 600);
    },
    frente(g, t, h) {
      actor(g, 'el', h === 'el' ? 'habla' : 'celebra', 105, 154, 90, t, h, { salto: true });
      actor(g, 'ella', h === 'ella' ? 'habla' : 'celebra', 215, 154, 94, t, h, { salto: true });
      // Birrete en la cabeza de ella y otros que vuelan
      const birrete = (x: number, y: number, s: number, a: number) => {
        g.save();
        g.translate(x, y);
        g.rotate(a);
        g.fillStyle = '#231815';
        g.beginPath();
        g.moveTo(-16 * s, 0);
        g.lineTo(0, -6 * s);
        g.lineTo(16 * s, 0);
        g.lineTo(0, 6 * s);
        g.fill();
        g.fillRect(-8 * s, 0, 16 * s, 7 * s);
        g.strokeStyle = '#f6cf5a';
        g.lineWidth = 1.2 * s;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(12 * s, 8 * s);
        g.stroke();
        g.restore();
      };
      const c = cabeza(215, 154, 94);
      birrete(c.x, c.y - c.r * 0.85 - Math.abs(Math.sin(t * 3.2 + 1.7)) * 7, 1.1, -0.1);
      for (let i = 0; i < 3; i++) birrete(60 + i * 100, 50 - Math.abs(Math.sin(t * 1.6 + i)) * 35, 0.8, Math.sin(t * 3 + i));
      confeti(g, t, 36, 11);
      vineta(g);
    },
  },

  // La primera vez que nos vimos: una plaza al atardecer con luces desenfocadas
  ojos: {
    fondo(g) {
      cielo(g, '#ffb38a', '#ffd9b3', '#ffe9d6');
      sol(g, 160, 96, 22, '#fff3d0', '#ff9f6b');
      ciudad(g, 118, 'rgba(160,90,90,0.45)', 17, false, 40);
      for (const x of [30, 290]) arbol(g, x, 124, 1.3, '#e89b6a', '#c97a52');
      piso(g, 118, '#e8b38f', '#c98a6a');
      g.strokeStyle = 'rgba(255,255,255,0.25)';
      for (let x = -40; x < W + 40; x += 22) {
        g.beginPath();
        g.moveTo(160, 118);
        g.lineTo(x, H);
        g.stroke();
      }
    },
    frente(g, t, h) {
      bokeh(g, 16, 23, ['#fff3b0', '#ffc2d1', '#ffe0a3'], t);
      const k = Math.min(1, (t % 13) / 4);
      actor(g, 'el', h === 'el' ? 'habla' : k < 1 ? 'timido' : 'feliz', 60 + k * 58, 152, 92, t, h);
      actor(g, 'ella', h === 'ella' ? 'habla' : k < 1 ? 'sorpresa' : 'risa', 260 - k * 58, 152, 92, t, h);
      if (k >= 1) {
        for (let i = 0; i < 6; i++) estrella(g, 160 + Math.cos(t * 1.5 + i) * 26, 70 + Math.sin(t * 1.5 + i) * 12, 3.5, '#fff6c9');
        corazon(g, 160, 64 + Math.sin(t * 4) * 3, 10 + Math.sin(t * 7));
      }
      vineta(g);
    },
  },

  // Me enamoré de la vida: de un día gris y con lluvia a uno de sol, con una flor que crece y un arcoíris
  flor: {
    fondo(g) {
      cielo(g, '#9fd4ff', '#e8f6ff');
      cordillera(g, 112, 14, '#b9e2a8', 31, 3);
      piso(g, 118, '#9fd49a', '#7cc47a');
    },
    frente(g, t, h) {
      const k = Math.min(1, (t % 13) / 6);
      // Arcoíris que aparece
      g.save();
      g.globalAlpha = Math.max(0, k - 0.5) * 1.6;
      ['#ff6b6b', '#ffb347', '#f6cf5a', '#8fd3b6', '#6bcbff', '#c59bff'].forEach((c, i) => {
        g.strokeStyle = c;
        g.lineWidth = 4;
        g.beginPath();
        g.arc(160, 150, 120 - i * 4, Math.PI, Math.PI * 2);
        g.stroke();
      });
      g.restore();
      sol(g, 270, 30, 12 * k + 2);
      // Nubes grises que se van y lluvia que se acaba
      g.globalAlpha = 1 - k;
      g.fillStyle = 'rgba(110,120,140,0.55)';
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) {
        const x = (i * 37 + t * 60) % W, y = (i * 53 + t * 180) % H;
        g.fillStyle = 'rgba(210,225,255,0.7)';
        g.fillRect(x, y, 1, 6);
      }
      nube(g, 70 - k * 90, 30, 1, '#9aa3b5', 'rgba(70,80,100,0.4)');
      nube(g, 220 + k * 90, 24, 0.9, '#9aa3b5', 'rgba(70,80,100,0.4)');
      g.globalAlpha = 1;
      // La flor que crece
      g.save();
      g.translate(160, 138);
      g.scale(0.4 + k * 1.1, 0.4 + k * 1.1);
      flor(g, 0, 0, 2.2, '#f4b6c2', t);
      g.restore();
      actor(g, 'el', h === 'el' ? 'habla' : k > 0.6 ? 'regalo' : 'feliz', 84, 156, 90, t, h);
      actor(g, 'ella', h === 'ella' ? 'habla' : k > 0.6 ? 'llora' : 'puchero', 236, 156, 90, t, h);
      if (k >= 1) corazonesQueSuben(g, t, 5);
      vineta(g);
    },
  },

  // Las luces de diciembre en Medellín: el río de luces, arcos de colores y la ciudad en las montañas
  luces: {
    fondo(g) {
      cielo(g, '#0f1433', '#1f2152', '#3b2a66');
      estrellitas(g, 30, 41, 60);
      // Montañas con casitas iluminadas (como las laderas de Medellín)
      cordillera(g, 92, 20, '#241f4a', 44, 3);
      const r = Math.random;
      g.fillStyle = 'rgba(255,214,130,0.8)';
      for (let i = 0; i < 160; i++) {
        const x = (i * 97) % W, y = 72 + ((i * 41) % 40);
        if (y > 76 + Math.sin(x / 30) * 8) g.fillRect(x, y, 1.2, 1.2);
      }
      void r;
      ciudad(g, 124, '#1a1640', 45, true, 34);
      // El río
      g.fillStyle = '#1b2a55';
      g.fillRect(0, 124, W, 16);
      piso(g, 140, '#2b2150', '#1a1438');
    },
    frente(g, t, h) {
      // Arcos de luces sobre el río
      for (let i = 0; i < 4; i++) guirnalda(g, i * 86 - 10, 70, i * 86 + 76, 70, -34, 12, t + i);
      guirnalda(g, -10, 18, W + 10, 22, 26, 22, t * 1.2);
      // Reflejos de colores en el agua
      for (let i = 0; i < 20; i++) {
        g.fillStyle = `hsla(${(i * 50 + t * 40) % 360},90%,65%,${0.25 + 0.2 * Math.sin(t * 3 + i)})`;
        g.fillRect((i * 17) % W, 127 + (i % 4) * 3, 8, 1.2);
      }
      actor(g, 'el', h === 'el' ? 'habla' : 'arriba', 132, 160, 84, t, h);
      actor(g, 'ella', h === 'ella' ? 'habla' : 'feliz', 192, 160, 84, t, h);
      vineta(g);
    },
  },

  // De Sopetrán a Bucaramanga: la cordillera de los Andes, la carretera y el bus con corazones
  bus: {
    fondo(g) {
      cielo(g, '#8fd0ff', '#d8f0ff', '#fff4dc');
      sol(g, 262, 34, 13);
      nube(g, 80, 28, 0.7);
      cordillera(g, 80, 26, '#a8c8e8', 51, 4);
      neblina(g, 84, 14);
      cordillera(g, 96, 22, '#8fbfa0', 52, 5);
      neblina(g, 100, 10);
      cordillera(g, 112, 16, '#6aa87a', 53, 6);
      piso(g, 124, '#7cc47a', '#5aa35c');
      // Carretera
      g.fillStyle = '#7a6a64';
      g.fillRect(0, 128, W, 14);
      g.fillStyle = '#fff8ee';
      for (let x = 0; x < W; x += 20) g.fillRect(x, 134, 10, 1.5);
      // Letreros
      for (const [x, txt] of [[26, 'Sopetrán'], [290, 'Bucaramanga']] as const) {
        g.fillStyle = '#8a5a3c';
        g.fillRect(x - 1, 108, 2, 20);
        g.fillStyle = '#3f8f4c';
        g.beginPath();
        g.roundRect(x - 26, 100, 52, 12, 3);
        g.fill();
        texto(g, txt, x, 109, 7.5, '#fff8ee');
      }
    },
    frente(g, t, h) {
      const x = ((t * 26) % (W + 110)) - 70;
      // El bus
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.beginPath();
      g.ellipse(x + 36, 141, 38, 3, 0, 0, Math.PI * 2);
      g.fill();
      const cuerpo = g.createLinearGradient(0, 104, 0, 136);
      cuerpo.addColorStop(0, '#ff7a6b');
      cuerpo.addColorStop(1, '#c9443a');
      g.fillStyle = cuerpo;
      g.beginPath();
      g.roundRect(x, 108, 72, 28, 6);
      g.fill();
      g.fillStyle = '#fff8ee';
      g.fillRect(x, 124, 72, 3);
      for (let i = 0; i < 4; i++) {
        g.fillStyle = '#bfe4ff';
        g.beginPath();
        g.roundRect(x + 6 + i * 16, 112, 12, 9, 2);
        g.fill();
      }
      // Los dos en las ventanitas (caritas asomadas)
      g.save();
      g.beginPath();
      g.roundRect(x + 38, 112, 12, 9, 2);
      g.roundRect(x + 54, 112, 12, 9, 2);
      g.clip();
      actor(g, 'el', h === 'el' ? 'habla' : 'feliz', x + 44, 128, 22, t, h, { sombra: false });
      actor(g, 'ella', h === 'ella' ? 'habla' : 'feliz', x + 60, 128, 22, t, h, { sombra: false });
      g.restore();
      g.fillStyle = '#2b2a2a';
      for (const dx of [14, 58]) {
        g.beginPath();
        g.arc(x + dx, 137, 5, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#9aa0a8';
        g.beginPath();
        g.arc(x + dx, 137, 2, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#2b2a2a';
      }
      for (let i = 1; i < 5; i++) corazon(g, x - i * 16, 118 + Math.sin(t * 4 + i) * 4, 4.5 - i * 0.6, '#e86a8a');
      vineta(g);
    },
  },

  // El planetario del Parque Explora: la cúpula con constelaciones; ella mira las estrellas y él la mira a ella
  estrellas: {
    fondo(g) {
      cielo(g, '#070a24', '#141a4a', '#2d2160');
      // Nebulosa
      brillo(g, 90, 50, 80, 'rgba(197,155,255,0.6)', 0.45);
      brillo(g, 230, 40, 70, 'rgba(107,203,255,0.5)', 0.4);
      estrellitas(g, 90, 91, 130);
      // Constelaciones
      const lineas: [number, number][][] = [
        [[40, 30], [58, 22], [74, 34], [90, 26]],
        [[210, 60], [228, 44], [250, 52], [262, 36], [284, 44]],
        [[130, 20], [146, 34], [162, 18]],
      ];
      g.strokeStyle = 'rgba(200,220,255,0.45)';
      g.lineWidth = 0.8;
      for (const l of lineas) {
        g.beginPath();
        l.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.stroke();
        for (const [x, y] of l) estrella(g, x, y, 2.4, '#fff6d8');
      }
      // Las sillas del planetario
      g.fillStyle = '#1a1440';
      g.beginPath();
      g.ellipse(160, 176, 200, 44, 0, 0, Math.PI * 2);
      g.fill();
    },
    frente(g, t, h) {
      estrellitas(g, 30, 92, 120, t);
      const k = (t * 0.12) % 1;
      if (k < 0.3) {
        g.strokeStyle = `rgba(255,255,255,${1 - k / 0.3})`;
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(300 - k * 400, 20 + k * 90);
        g.lineTo(312 - k * 400, 14 + k * 90);
        g.stroke();
      }
      actor(g, 'el', h === 'el' ? 'habla' : 'feliz', 134, 162, 86, t, h);
      actor(g, 'ella', h === 'ella' ? 'habla' : 'arriba', 194, 162, 86, t, h);
      corazon(g, 150, 80 + Math.sin(t * 3) * 3, 5, '#f4b6c2');
      vineta(g);
    },
  },

  // Mi hogar eres tú: una casita al atardecer con ventanas cálidas y corazones que salen de la chimenea
  casa: {
    fondo(g) {
      cielo(g, '#ffb38a', '#ffd9c2', '#ffeede');
      sol(g, 60, 70, 16, '#fff3d0', '#ff9f6b');
      cordillera(g, 108, 14, '#e8b38f', 101, 3);
      piso(g, 118, '#a8d89a', '#7cc47a');
      // Casita
      g.fillStyle = '#fff1e0';
      g.fillRect(150, 70, 90, 56);
      g.fillStyle = '#e4574b';
      g.beginPath();
      g.moveTo(142, 72);
      g.lineTo(195, 36);
      g.lineTo(248, 72);
      g.fill();
      g.fillStyle = 'rgba(0,0,0,0.12)';
      g.beginPath();
      g.moveTo(195, 36);
      g.lineTo(248, 72);
      g.lineTo(240, 72);
      g.fill();
      g.fillStyle = '#b9483e';
      g.fillRect(222, 40, 10, 20);
      g.fillStyle = '#8a5634';
      g.beginPath();
      g.roundRect(186, 96, 18, 30, [8, 8, 0, 0]);
      g.fill();
      for (const x of [160, 214]) {
        g.fillStyle = '#ffe08a';
        g.fillRect(x, 84, 16, 14);
        g.fillStyle = '#fff1e0';
        g.fillRect(x + 7, 84, 2, 14);
        g.fillRect(x, 90, 16, 2);
      }
      for (let i = 0; i < 9; i++) flor(g, 150 + i * 11, 132, 0.7, ['#f4b6c2', '#fff', '#f6cf5a'][i % 3]);
      arbol(g, 290, 126, 1.2);
    },
    frente(g, t, h) {
      for (const x of [168, 222]) brillo(g, x, 91, 16, 'rgba(255,214,130,0.9)', 0.5 + 0.1 * Math.sin(t * 2 + x));
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.3 + i / 4) % 1;
        g.globalAlpha = Math.sin(k * Math.PI);
        corazon(g, 227 + Math.sin(k * 6 + i) * 6, 36 - k * 40, 3 + k * 4, '#e86a8a');
      }
      g.globalAlpha = 1;
      actor(g, 'el', h === 'el' ? 'habla' : 'abrazo', 78, 158, 90, t, h);
      actor(g, 'ella', h === 'ella' ? 'habla' : 'feliz', 120, 158, 90, t, h);
      vineta(g);
    },
  },

};
