// Dibujitos de la cocina (canvas 2D): la comida, la loza y los botones, todo a mano con degradados y brillos para
// que se vea rico. Las medidas van en unidades de la pantalla virtual (720 de alto).
export type G = CanvasRenderingContext2D;

// ---------------------------------------------------------------------------------------------- Colores
/** [r, g, b] de un color «#rrggbb» o «rgb(r,g,b)» (los que salen de mezclar). */
const hex = (c: string) => {
  if (c.startsWith('rgb')) return (c.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Mezcla dos colores #rrggbb (t = 0 el primero, 1 el segundo). */
export function mezclar(a: string, b: string, t: number) {
  const x = hex(a), y = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
}
export const aclarar = (c: string, t: number) => mezclar(c, '#ffffff', t);
export const oscurecer = (c: string, t: number) => mezclar(c, '#000000', t);
export const conAlfa = (c: string, a: number) => {
  const [r, g, b] = hex(c);
  return `rgba(${r},${g},${b},${a})`;
};

// ---------------------------------------------------------------------------------------------- Formas
export function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + k, y);
  g.arcTo(x + w, y, x + w, y + h, k);
  g.arcTo(x + w, y + h, x, y + h, k);
  g.arcTo(x, y + h, x, y, k);
  g.arcTo(x, y, x + w, y, k);
  g.closePath();
}
export function elipse(g: G, x: number, y: number, rx: number, ry: number) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
}
export function sombra(g: G, x: number, y: number, rx: number, ry: number, a = 0.28) {
  const gr = g.createRadialGradient(x, y, 0, x, y, rx);
  gr.addColorStop(0, `rgba(60,30,20,${a})`);
  gr.addColorStop(1, 'rgba(60,30,20,0)');
  g.save();
  g.translate(x, y);
  g.scale(1, ry / rx);
  g.translate(-x, -y);
  g.fillStyle = gr;
  elipse(g, x, y, rx, rx);
  g.fill();
  g.restore();
}
export function lineal(g: G, x0: number, y0: number, x1: number, y1: number, paradas: [number, string][]) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [t, c] of paradas) gr.addColorStop(t, c);
  return gr;
}
export function radial(g: G, x: number, y: number, r0: number, r1: number, paradas: [number, string][], x1 = x, y1 = y) {
  const gr = g.createRadialGradient(x, y, r0, x1, y1, r1);
  for (const [t, c] of paradas) gr.addColorStop(t, c);
  return gr;
}
/** Brillito de luz (un óvalo blanco suave). */
export function brillo(g: G, x: number, y: number, rx: number, ry: number, a = 0.55, rot = -0.5) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = radial(g, 0, 0, 0, rx, [[0, `rgba(255,255,255,${a})`], [1, 'rgba(255,255,255,0)']]);
  g.scale(1, ry / rx);
  elipse(g, 0, 0, rx, rx);
  g.fill();
  g.restore();
}

// ---------------------------------------------------------------------------------------------- Texto
export function texto(g: G, t: string, x: number, y: number, o: { tam?: number; color?: string; alinear?: CanvasTextAlign; peso?: number; borde?: string; max?: number; base?: CanvasTextBaseline } = {}) {
  g.font = `${o.peso ?? 800} ${o.tam ?? 24}px Nunito, "Baloo 2", system-ui, sans-serif`;
  g.textAlign = o.alinear ?? 'center';
  g.textBaseline = o.base ?? 'middle';
  if (o.borde) {
    g.lineJoin = 'round';
    g.lineWidth = (o.tam ?? 24) * 0.22;
    g.strokeStyle = o.borde;
    g.strokeText(t, x, y, o.max);
  }
  g.fillStyle = o.color ?? '#3b2418';
  g.fillText(t, x, y, o.max);
}

// ---------------------------------------------------------------------------------------------- Botones
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const dentro = (r: Rect | null | undefined, x: number, y: number) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** Botón con relieve (como una tecla de caramelo). */
export function boton(g: G, r: Rect, o: { color?: string; activo?: boolean; apagado?: boolean; hundido?: boolean; radio?: number } = {}) {
  const c = o.apagado ? '#cbbfb4' : o.color ?? '#ffffff';
  const hundido = o.hundido ? 4 : 0;
  const rad = o.radio ?? 16;
  g.save();
  if (!o.hundido) {
    g.fillStyle = oscurecer(c, 0.28);
    rr(g, r.x, r.y + 5, r.w, r.h, rad);
    g.fill();
  }
  g.fillStyle = lineal(g, 0, r.y + hundido, 0, r.y + r.h + hundido, [[0, aclarar(c, 0.35)], [1, c]]);
  rr(g, r.x, r.y + hundido, r.w, r.h, rad);
  g.fill();
  if (o.activo) {
    g.lineWidth = 5;
    g.strokeStyle = '#ffb627';
    g.shadowColor = 'rgba(255,182,39,0.8)';
    g.shadowBlur = 16;
    rr(g, r.x - 2, r.y + hundido - 2, r.w + 4, r.h + 4, rad + 2);
    g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------------------------------------- Masa y wafles
export interface Masa {
  id: string;
  nombre: string;
  crudo: string;
  dorado: string;
  tostado: string;
  /** Pintitas (avena, chips). */
  pintas?: string;
}
export const QUEMADO = '#2b1a12';
/** Color de la masa según qué tan cocida está (0 cruda, 0.5 doradita, 0.72 tostadita, 1 quemada). */
export function colorCoccion(m: Masa, c: number) {
  if (c < 0.5) return mezclar(m.crudo, m.dorado, c / 0.5);
  if (c < 0.74) return mezclar(m.dorado, m.tostado, (c - 0.5) / 0.24);
  return mezclar(m.tostado, QUEMADO, (c - 0.74) / 0.26);
}

/** Un wafle redondo belga visto desde arriba en perspectiva (k = alto/ancho del óvalo). */
export function wafle(g: G, x: number, y: number, r: number, m: Masa, coccion: number, k = 0.62, grosor = 0.16) {
  const base = colorCoccion(m, coccion);
  const borde = oscurecer(base, 0.25);
  const h = r * grosor;
  g.save();
  // Canto
  g.fillStyle = lineal(g, x - r, 0, x + r, 0, [[0, oscurecer(base, 0.35)], [0.5, oscurecer(base, 0.12)], [1, oscurecer(base, 0.4)]]);
  g.beginPath();
  g.ellipse(x, y + h, r, r * k, 0, 0, Math.PI);
  g.lineTo(x - r, y);
  g.ellipse(x, y, r, r * k, 0, Math.PI, 0, true);
  g.closePath();
  g.fill();
  // Cara de arriba
  g.translate(x, y);
  g.scale(1, k);
  g.fillStyle = radial(g, -r * 0.3, -r * 0.3, r * 0.1, r * 1.1, [[0, aclarar(base, 0.12)], [1, base]]);
  elipse(g, 0, 0, r, r);
  g.fill();
  g.save();
  elipse(g, 0, 0, r * 0.93, r * 0.93);
  g.clip();
  // Cuadritos (los huequitos del wafle) con sombra adentro
  const n = 5;
  const paso = (r * 2) / n;
  const lado = paso * 0.66;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const cx = -r + paso * (i + 0.5), cy = -r + paso * (j + 0.5);
      if (Math.hypot(cx, cy) > r * 0.98) continue;
      g.fillStyle = lineal(g, 0, cy - lado / 2, 0, cy + lado / 2, [[0, oscurecer(base, 0.32)], [0.55, oscurecer(base, 0.14)], [1, aclarar(base, 0.06)]]);
      rr(g, cx - lado / 2, cy - lado / 2, lado, lado, lado * 0.18);
      g.fill();
    }
  g.restore();
  // Borde tostadito
  g.lineWidth = r * 0.07;
  g.strokeStyle = borde;
  elipse(g, 0, 0, r * 0.965, r * 0.965);
  g.stroke();
  if (m.pintas) {
    g.fillStyle = m.pintas;
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 14) * r * 0.85;
      elipse(g, Math.cos(a) * d, Math.sin(a) * d, r * 0.035, r * 0.025);
      g.fill();
    }
  }
  g.restore();
  // Humito si se quemó
  if (coccion > 0.9) brillo(g, x, y - r * 0.2, r * 0.5, r * 0.25, 0.15);
  else brillo(g, x - r * 0.35, y - r * k * 0.35, r * 0.35, r * 0.14, 0.28);
}

export function plato(g: G, x: number, y: number, rx: number, ry: number, color = '#ffffff') {
  sombra(g, x + 6, y + ry * 0.18, rx * 1.08, ry * 1.1, 0.3);
  g.fillStyle = lineal(g, 0, y - ry, 0, y + ry, [[0, aclarar(color, 0.2)], [1, oscurecer(color, 0.12)]]);
  elipse(g, x, y, rx, ry);
  g.fill();
  g.fillStyle = radial(g, x, y - ry * 0.1, rx * 0.1, rx * 0.72, [[0, color], [1, oscurecer(color, 0.07)]]);
  elipse(g, x, y, rx * 0.72, ry * 0.72);
  g.fill();
  g.strokeStyle = 'rgba(120,90,70,0.18)';
  g.lineWidth = 2;
  elipse(g, x, y, rx * 0.72, ry * 0.72);
  g.stroke();
  // Filito dorado
  g.strokeStyle = 'rgba(214,170,90,0.7)';
  g.lineWidth = 2.5;
  elipse(g, x, y, rx * 0.93, ry * 0.93);
  g.stroke();
}

// ---------------------------------------------------------------------------------------------- Frutas y toppings
export function fresa(g: G, x: number, y: number, s: number, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = radial(g, -s * 0.3, -s * 0.3, s * 0.1, s * 1.2, [[0, '#ff6b6b'], [0.6, '#e5243b'], [1, '#a3101f']]);
  g.beginPath();
  g.moveTo(0, s * 0.95);
  g.bezierCurveTo(s * 0.9, s * 0.45, s * 0.95, -s * 0.55, 0, -s * 0.6);
  g.bezierCurveTo(-s * 0.95, -s * 0.55, -s * 0.9, s * 0.45, 0, s * 0.95);
  g.fill();
  g.fillStyle = '#ffe28a';
  for (let i = 0; i < 12; i++) {
    const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 12) * s * 0.62;
    elipse(g, Math.cos(a) * d * 0.9, Math.sin(a) * d + s * 0.1, s * 0.045, s * 0.07);
    g.fill();
  }
  // Hojitas
  g.fillStyle = '#3f9d45';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.55;
    g.save();
    g.translate(0, -s * 0.55);
    g.rotate(a + Math.PI / 2);
    elipse(g, 0, -s * 0.16, s * 0.1, s * 0.22);
    g.fill();
    g.restore();
  }
  g.fillStyle = '#2f7d34';
  rr(g, -s * 0.05, -s * 0.9, s * 0.1, s * 0.3, s * 0.05);
  g.fill();
  brillo(g, -s * 0.3, -s * 0.15, s * 0.28, s * 0.14, 0.45);
  g.restore();
}

/** Media fresa (o un cuarto): se ve la carne clarita por dentro. */
export function fresaCorte(g: G, x: number, y: number, s: number, rot = 0, tipo: 'mitad' | 'cuarto' | 'lamina' = 'mitad') {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  if (tipo === 'lamina') g.scale(1, 0.9);
  const w = tipo === 'cuarto' ? 0.5 : 1;
  g.beginPath();
  if (tipo === 'cuarto') {
    g.moveTo(0, s * 0.9);
    g.bezierCurveTo(s * 0.8, s * 0.4, s * 0.85, -s * 0.5, 0, -s * 0.55);
    g.closePath();
  } else {
    g.moveTo(0, s * 0.9);
    g.bezierCurveTo(s * 0.9, s * 0.42, s * 0.92, -s * 0.52, 0, -s * 0.58);
    g.bezierCurveTo(-s * 0.92, -s * 0.52, -s * 0.9, s * 0.42, 0, s * 0.9);
  }
  g.fillStyle = '#d61f36';
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = radial(g, 0, 0, s * 0.1, s * 0.85, [[0, '#fff1ec'], [0.45, '#ffb3b8'], [0.8, '#ff5b6b'], [1, '#d61f36']]);
  g.translate(tipo === 'cuarto' ? s * 0.08 : 0, 0);
  g.scale(w * 0.86 + 0.14, 1);
  elipse(g, 0, 0, s * 0.8, s * 0.85);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.7)';
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.moveTo(0, -s * 0.45);
  g.quadraticCurveTo(0, s * 0.2, 0, s * 0.6);
  g.stroke();
  g.restore();
  g.fillStyle = '#ffe28a';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    if (tipo === 'cuarto' && Math.cos(a) < 0) continue;
    elipse(g, Math.cos(a) * s * 0.7 * (tipo === 'cuarto' ? 0.6 : 1), Math.sin(a) * s * 0.66 + s * 0.08, s * 0.03, s * 0.045);
    g.fill();
  }
  g.restore();
}

export function banano(g: G, x: number, y: number, s: number) {
  g.fillStyle = lineal(g, 0, y - s, 0, y + s, [[0, '#fff6c9'], [1, '#f2dc8c']]);
  elipse(g, x, y, s, s * 0.82);
  g.fill();
  g.strokeStyle = '#e2c36c';
  g.lineWidth = s * 0.12;
  elipse(g, x, y, s * 0.94, s * 0.77);
  g.stroke();
  g.fillStyle = '#8d6a3a';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    elipse(g, x + Math.cos(a) * s * 0.2, y + Math.sin(a) * s * 0.16, s * 0.07, s * 0.05);
    g.fill();
  }
  brillo(g, x - s * 0.35, y - s * 0.3, s * 0.35, s * 0.18, 0.5);
}

export function arandano(g: G, x: number, y: number, s: number) {
  g.fillStyle = radial(g, x - s * 0.35, y - s * 0.35, s * 0.1, s * 1.1, [[0, '#7b8fe0'], [0.5, '#3a4aa8'], [1, '#1c2466']]);
  elipse(g, x, y, s, s * 0.92);
  g.fill();
  g.strokeStyle = '#1a1f4a';
  g.lineWidth = s * 0.12;
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.moveTo(x, y - s * 0.35);
    g.lineTo(x + Math.cos(a) * s * 0.22, y - s * 0.35 + Math.sin(a) * s * 0.16);
  }
  g.stroke();
  brillo(g, x - s * 0.4, y - s * 0.3, s * 0.3, s * 0.18, 0.6);
}

export function masmelo(g: G, x: number, y: number, s: number, color = '#ffd3e2') {
  g.fillStyle = lineal(g, 0, y - s, 0, y + s, [[0, aclarar(color, 0.5)], [1, color]]);
  rr(g, x - s * 0.7, y - s * 0.5, s * 1.4, s * 1.1, s * 0.45);
  g.fill();
  g.fillStyle = aclarar(color, 0.7);
  elipse(g, x, y - s * 0.42, s * 0.62, s * 0.26);
  g.fill();
}

export function cereza(g: G, x: number, y: number, s: number) {
  g.strokeStyle = '#4b7a2a';
  g.lineWidth = s * 0.14;
  g.beginPath();
  g.moveTo(x, y - s * 0.6);
  g.quadraticCurveTo(x + s * 0.2, y - s * 1.5, x + s * 0.7, y - s * 1.8);
  g.stroke();
  g.fillStyle = radial(g, x - s * 0.35, y - s * 0.3, s * 0.1, s * 1.1, [[0, '#ff6b7d'], [0.5, '#d4102c'], [1, '#7a0616']]);
  elipse(g, x, y, s, s * 0.92);
  g.fill();
  brillo(g, x - s * 0.35, y - s * 0.35, s * 0.35, s * 0.2, 0.7);
}

export function kiwi(g: G, x: number, y: number, s: number) {
  g.fillStyle = '#6a4a2a';
  elipse(g, x, y, s, s * 0.85);
  g.fill();
  g.fillStyle = radial(g, x, y, s * 0.1, s * 0.95, [[0, '#f6f2c8'], [0.3, '#b7d65a'], [1, '#6fa52b']]);
  elipse(g, x, y, s * 0.9, s * 0.76);
  g.fill();
  g.fillStyle = '#231a10';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    elipse(g, x + Math.cos(a) * s * 0.42, y + Math.sin(a) * s * 0.36, s * 0.05, s * 0.035);
    g.fill();
  }
}

/** Crema chantilly en espiral (la de la manga). */
export function chantilly(g: G, x: number, y: number, s: number, color = '#fffaf2') {
  const sombraC = oscurecer(color, 0.12);
  for (let k = 0; k < 4; k++) {
    const r = s * (1 - k * 0.22), yy = y - k * s * 0.34;
    g.fillStyle = lineal(g, 0, yy - r * 0.5, 0, yy + r * 0.45, [[0, aclarar(color, 0.6)], [0.7, color], [1, sombraC]]);
    g.beginPath();
    g.ellipse(x, yy, r, r * 0.5, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = conAlfa('#c9b8a4', 0.35);
    g.lineWidth = s * 0.04;
    for (let j = -2; j <= 2; j++) {
      g.beginPath();
      g.moveTo(x + j * r * 0.3, yy - r * 0.35);
      g.quadraticCurveTo(x + j * r * 0.38, yy, x + j * r * 0.3, yy + r * 0.4);
      g.stroke();
    }
  }
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x - s * 0.2, y - s * 1.05);
  g.quadraticCurveTo(x + s * 0.05, y - s * 1.55, x + s * 0.12, y - s * 1.12);
  g.fill();
  brillo(g, x - s * 0.3, y - s * 0.7, s * 0.3, s * 0.14, 0.7);
}

export const SABORES_HELADO: Record<string, string> = { vainilla: '#fff1c9', chocolate: '#7a4a2c', fresa: '#ffb3c7', arequipe: '#d99a52', mora: '#9c4a8a' };
export function helado(g: G, x: number, y: number, s: number, sabor = 'vainilla') {
  const c = SABORES_HELADO[sabor] ?? sabor;
  sombra(g, x, y + s * 0.5, s * 1.1, s * 0.35, 0.25);
  g.fillStyle = radial(g, x - s * 0.35, y - s * 0.6, s * 0.1, s * 1.3, [[0, aclarar(c, 0.45)], [0.6, c], [1, oscurecer(c, 0.18)]]);
  g.beginPath();
  g.moveTo(x - s, y + s * 0.2);
  g.bezierCurveTo(x - s * 1.05, y - s * 1.1, x + s * 1.05, y - s * 1.1, x + s, y + s * 0.2);
  // Bordecito ondulado (se está derritiendo)
  for (let i = 0; i <= 8; i++) {
    const t = 1 - i / 8;
    const xx = x - s + t * 2 * s;
    g.lineTo(xx, y + s * 0.2 + (i % 2 ? s * 0.22 : 0) + (i === 3 ? s * 0.25 : 0));
  }
  g.closePath();
  g.fill();
  brillo(g, x - s * 0.35, y - s * 0.55, s * 0.35, s * 0.2, 0.6);
}

export function mantequilla(g: G, x: number, y: number, s: number) {
  g.fillStyle = conAlfa('#ffe27a', 0.55);
  elipse(g, x, y + s * 0.2, s * 1.1, s * 0.55);
  g.fill();
  g.fillStyle = lineal(g, 0, y - s * 0.6, 0, y + s * 0.4, [[0, '#fff4b0'], [1, '#f5cf4a']]);
  rr(g, x - s * 0.6, y - s * 0.55, s * 1.2, s * 0.8, s * 0.2);
  g.fill();
  g.fillStyle = '#fff9d8';
  rr(g, x - s * 0.5, y - s * 0.5, s * 1.0, s * 0.3, s * 0.12);
  g.fill();
}

export function barquillo(g: G, x: number, y: number, s: number, rot = -0.5) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = lineal(g, -s * 0.18, 0, s * 0.18, 0, [[0, '#b97a3c'], [0.5, '#f0c27a'], [1, '#a86a30']]);
  rr(g, -s * 0.18, -s * 1.3, s * 0.36, s * 2.2, s * 0.16);
  g.fill();
  g.strokeStyle = 'rgba(120,70,30,0.5)';
  g.lineWidth = s * 0.05;
  for (let i = -5; i < 4; i++) {
    g.beginPath();
    g.moveTo(-s * 0.18, i * s * 0.25);
    g.lineTo(s * 0.18, i * s * 0.25 - s * 0.14);
    g.stroke();
  }
  g.restore();
}

export function galleta(g: G, x: number, y: number, s: number) {
  g.fillStyle = '#2d1c16';
  elipse(g, x, y + s * 0.18, s, s * 0.55);
  g.fill();
  g.fillStyle = '#f7f2ea';
  g.fillRect(x - s, y - s * 0.05, s * 2, s * 0.2);
  g.fillStyle = radial(g, x - s * 0.3, y - s * 0.3, s * 0.1, s, [[0, '#4a3226'], [1, '#231510']]);
  elipse(g, x, y - s * 0.1, s, s * 0.55);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.3)';
  g.lineWidth = s * 0.05;
  elipse(g, x, y - s * 0.1, s * 0.65, s * 0.34);
  g.stroke();
}

export function menta(g: G, x: number, y: number, s: number, rot = 0.4) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  for (const lado of [-1, 1]) {
    g.save();
    g.rotate(lado * 0.5);
    g.fillStyle = lineal(g, 0, -s, 0, s * 0.2, [[0, '#7fd06a'], [1, '#2f8a3a']]);
    elipse(g, 0, -s * 0.5, s * 0.34, s * 0.6);
    g.fill();
    g.strokeStyle = 'rgba(20,80,30,0.6)';
    g.lineWidth = s * 0.05;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -s * 0.95);
    g.stroke();
    g.restore();
  }
  g.restore();
}

/** Chorrito de salsa (miel, arequipe, chocolate…) por una lista de puntos. */
export function trazoSalsa(g: G, pts: { x: number; y: number }[], color: string, grosor: number) {
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
  const linea = (w: number, c: string, dy = 0) => {
    g.strokeStyle = c;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y + dy);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      g.quadraticCurveTo(pts[i].x, pts[i].y + dy, mx, my + dy);
    }
    g.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y + dy);
    g.stroke();
  };
  linea(grosor, oscurecer(color, 0.25), grosor * 0.18);
  linea(grosor * 0.86, color);
  linea(grosor * 0.26, conAlfa('#ffffff', 0.45), -grosor * 0.18);
}

export const COLORES_CHISPITAS = ['#ff5d8f', '#ffd23f', '#3ec1d3', '#7ed957', '#b57cff', '#ff8c42'];
export function chispita(g: G, x: number, y: number, s: number, i: number) {
  g.save();
  g.translate(x, y);
  g.rotate(i * 1.7);
  g.fillStyle = COLORES_CHISPITAS[i % COLORES_CHISPITAS.length];
  rr(g, -s, -s * 0.32, s * 2, s * 0.64, s * 0.32);
  g.fill();
  g.restore();
}

/** Granitos de un polvo (azúcar glas, queso rallado, canela, galleta triturada). */
export function granito(g: G, x: number, y: number, s: number, tipo: string, i: number) {
  switch (tipo) {
    case 'queso':
      g.save();
      g.translate(x, y);
      g.rotate(i * 0.9);
      g.fillStyle = i % 3 ? '#ffe7a0' : '#f6d36b';
      rr(g, -s * 1.2, -s * 0.3, s * 2.4, s * 0.6, s * 0.3);
      g.fill();
      g.restore();
      break;
    case 'azucar':
      g.fillStyle = 'rgba(255,255,255,0.9)';
      elipse(g, x, y, s * 0.55, s * 0.45);
      g.fill();
      break;
    case 'canela':
      g.fillStyle = i % 2 ? '#8a4b22' : '#a25a28';
      elipse(g, x, y, s * 0.45, s * 0.38);
      g.fill();
      break;
    case 'galleta':
      g.fillStyle = i % 3 ? '#2d1c16' : '#f2ece2';
      rr(g, x - s * 0.6, y - s * 0.5, s * 1.2, s, s * 0.2);
      g.fill();
      break;
    case 'coco':
      g.fillStyle = '#fffdf6';
      rr(g, x - s * 0.9, y - s * 0.2, s * 1.8, s * 0.4, s * 0.2);
      g.fill();
      break;
    default:
      chispita(g, x, y, s, i);
  }
}

// ---------------------------------------------------------------------------------------------- Ícono de un topping (tickets y bandeja)
export function iconoTopping(g: G, id: string, x: number, y: number, s: number, extra?: { color?: string; sabor?: string }) {
  switch (id) {
    case 'fresa':
      return fresaCorte(g, x, y, s * 0.9, 0.2, 'mitad');
    case 'fresa_entera':
      return fresa(g, x, y + s * 0.1, s * 0.85);
    case 'banano':
      return banano(g, x, y, s * 0.8);
    case 'arandano':
      arandano(g, x - s * 0.35, y + s * 0.15, s * 0.45);
      return arandano(g, x + s * 0.3, y - s * 0.1, s * 0.45);
    case 'kiwi':
      return kiwi(g, x, y, s * 0.8);
    case 'masmelo':
      masmelo(g, x - s * 0.3, y + s * 0.15, s * 0.5, '#ffd3e2');
      return masmelo(g, x + s * 0.35, y - s * 0.1, s * 0.5, '#fffaf2');
    case 'cereza':
      return cereza(g, x, y + s * 0.3, s * 0.55);
    case 'chantilly':
      return chantilly(g, x, y + s * 0.45, s * 0.75);
    case 'helado':
      return helado(g, x, y + s * 0.3, s * 0.75, extra?.sabor);
    case 'mantequilla':
      return mantequilla(g, x, y, s * 0.8);
    case 'barquillo':
      return barquillo(g, x, y, s * 0.55, -0.6);
    case 'galleta':
      return galleta(g, x, y, s * 0.7);
    case 'menta':
      return menta(g, x, y + s * 0.4, s * 0.8);
    case 'chispitas':
      for (let i = 0; i < 9; i++) chispita(g, x + Math.cos(i * 2.4) * s * 0.55 * Math.sqrt(i / 9), y + Math.sin(i * 2.4) * s * 0.5 * Math.sqrt(i / 9), s * 0.14, i);
      return;
    case 'queso':
    case 'azucar':
    case 'canela':
    case 'galleta_triturada':
    case 'coco': {
      const t = id === 'galleta_triturada' ? 'galleta' : id;
      g.fillStyle = id === 'azucar' ? '#e9e2da' : id === 'queso' ? '#f3e1b0' : '#e8d7c0';
      elipse(g, x, y + s * 0.35, s * 0.8, s * 0.3);
      g.fill();
      for (let i = 0; i < 16; i++) granito(g, x + Math.cos(i * 2.4) * s * 0.6 * Math.sqrt(i / 16), y - s * 0.05 + Math.sin(i * 2.4) * s * 0.4 * Math.sqrt(i / 16), s * 0.12, t, i);
      return;
    }
    default:
      // Salsas: una gotota del color
      if (extra?.color) {
        g.fillStyle = radial(g, x - s * 0.2, y - s * 0.2, s * 0.05, s * 0.8, [[0, aclarar(extra.color, 0.35)], [1, extra.color]]);
        g.beginPath();
        g.moveTo(x, y - s * 0.75);
        g.bezierCurveTo(x + s * 0.2, y - s * 0.4, x + s * 0.6, y - s * 0.05, x + s * 0.55, y + s * 0.3);
        g.arc(x, y + s * 0.3, s * 0.55, 0, Math.PI);
        g.bezierCurveTo(x - s * 0.6, y - s * 0.05, x - s * 0.2, y - s * 0.4, x, y - s * 0.75);
        g.fill();
        brillo(g, x - s * 0.2, y + s * 0.1, s * 0.2, s * 0.12, 0.6);
      }
  }
}

// ---------------------------------------------------------------------------------------------- Efectos
export interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  max: number;
  color: string;
  tam: number;
  tipo: 'chispa' | 'humo' | 'corazon' | 'estrella' | 'moneda' | 'gota';
}
export function particula(g: G, p: Particula) {
  const k = Math.max(0, p.vida / p.max);
  g.save();
  g.globalAlpha = p.tipo === 'humo' ? k * 0.45 : Math.min(1, k * 2);
  switch (p.tipo) {
    case 'humo':
      g.fillStyle = p.color;
      elipse(g, p.x, p.y, p.tam * (2 - k), p.tam * (2 - k));
      g.fill();
      break;
    case 'corazon':
      g.fillStyle = p.color;
      g.translate(p.x, p.y);
      g.scale(p.tam / 10, p.tam / 10);
      g.beginPath();
      g.moveTo(0, 4);
      g.bezierCurveTo(-10, -4, -5, -11, 0, -5);
      g.bezierCurveTo(5, -11, 10, -4, 0, 4);
      g.fill();
      break;
    case 'estrella':
      g.fillStyle = p.color;
      g.translate(p.x, p.y);
      g.rotate(p.vida * 3);
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? p.tam * 0.45 : p.tam;
        g.lineTo(Math.cos((i / 10) * Math.PI * 2) * r, Math.sin((i / 10) * Math.PI * 2) * r);
      }
      g.fill();
      break;
    case 'moneda':
      g.fillStyle = radial(g, p.x - p.tam * 0.3, p.y - p.tam * 0.3, 1, p.tam, [[0, '#fff3b0'], [1, '#e8a91a']]);
      elipse(g, p.x, p.y, p.tam * Math.abs(Math.cos(p.vida * 8)) + 1, p.tam);
      g.fill();
      break;
    case 'gota':
      g.fillStyle = p.color;
      elipse(g, p.x, p.y, p.tam * 0.7, p.tam);
      g.fill();
      break;
    default:
      g.fillStyle = p.color;
      elipse(g, p.x, p.y, p.tam, p.tam);
      g.fill();
  }
  g.restore();
}
