// Vasos, jarras y tazones: lo de adentro (jugo, leche, crema, frappé) se dibuja con volumen detrás del vidrio
// renderizado: la forma sale de las medidas del modelo (hojas.json) y de la elevación de la cámara, así el líquido
// calza con el vaso. Menisco claro arriba, degradado de profundidad, burbujitas que suben y brillos.
import { aclarar, conAlfa, G, lineal, oscurecer } from './dibujo';
import { recorte, spr } from './sprites';

export interface GeoVaso {
  /** Centro de la base en la pantalla. */
  x: number;
  y: number;
  /** Unidades del juego por metro. */
  k: number;
  se: number;
  ce: number;
  /** Radios (m) abajo y en la boca, alto (m) y dónde empieza el fondo por dentro (m). */
  rb: number;
  rt: number;
  alto: number;
  fondo: number;
  /** Altura extra donde arranca el vaso (la jarra de la licuadora va encima del motor). */
  z0: number;
}

/** Las medidas de un vaso dibujado en (x, y) con tamaño `tam` (las de su recorte o las de respaldo). */
export function geoVaso(id: string, x: number, y: number, tam: number, respaldo: { rb: number; rt: number; alto: number; fondo?: number; elev?: number; ref?: number }): GeoVaso {
  const r = recorte(id);
  const rb = (r?.r_abajo as number) ?? respaldo.rb;
  const rt = (r?.r_arriba as number) ?? respaldo.rt;
  const alto = (r?.alto as number) ?? respaldo.alto;
  const fondo = (r?.fondo as number) ?? respaldo.fondo ?? 0.004;
  const elev = ((r?.elev as number) ?? respaldo.elev ?? 18) * (Math.PI / 180);
  const ref = r?.ref ?? respaldo.ref ?? 0.1;
  const z0 = (r?.z0 as number) ?? 0;
  return { x, y, k: tam / ref, se: Math.sin(elev), ce: Math.cos(elev), rb, rt, alto, fondo, z0 };
}

export const radioEn = (v: GeoVaso, z: number) => (v.rb + ((v.rt - v.rb) * Math.max(0, z - v.z0)) / v.alto) * v.k;
export const yEn = (v: GeoVaso, z: number) => v.y - z * v.ce * v.k;
/** Altura (m) de un nivel 0..1 del interior. */
export const zNivel = (v: GeoVaso, f: number) => v.z0 + v.fondo + (v.alto - v.fondo) * f;

/** Silueta del interior entre dos alturas (m): costados, frente del fondo y atrás de la superficie. */
export function caminoInterior(g: G, v: GeoVaso, z0: number, z1: number, inset = 0.0015) {
  const r0 = Math.max(1, radioEn(v, z0) - inset * v.k), r1 = Math.max(1, radioEn(v, z1) - inset * v.k);
  const y0 = yEn(v, z0), y1 = yEn(v, z1);
  g.beginPath();
  g.moveTo(v.x - r1, y1);
  g.lineTo(v.x - r0, y0);
  g.ellipse(v.x, y0, r0, r0 * v.se, 0, Math.PI, 0, true);
  g.lineTo(v.x + r1, y1);
  g.ellipse(v.x, y1, r1, r1 * v.se, 0, 0, -Math.PI, true);
  g.closePath();
}

export interface OpcionesLiquido {
  /** Segundos (para las burbujas). */
  t?: number;
  burbujas?: boolean;
  /** Espuma arriba (frappé licuado, leche batida). */
  espuma?: string;
  /** Oscurece abajo (jugos) o no (cremas). */
  profundidad?: number;
  /** 0 opaco, 1 transparente (deja ver un poquito lo de atrás). */
  transparencia?: number;
  /** Ondita en la superficie mientras se sirve. */
  ola?: number;
}

/** Líquido hasta un nivel (0..1 del interior). */
export function liquido(g: G, v: GeoVaso, nivel: number, color: string, o: OpcionesLiquido = {}) {
  if (nivel <= 0.003) return;
  const zf = zNivel(v, 0), zl = zNivel(v, Math.min(1.02, nivel));
  const yl = yEn(v, zl), yf = yEn(v, zf);
  const rl = radioEn(v, zl) - 0.0015 * v.k;
  const prof = o.profundidad ?? 0.22;
  g.save();
  g.globalAlpha = 1 - (o.transparencia ?? 0) * 0.35;
  caminoInterior(g, v, zf, zl);
  g.fillStyle = lineal(g, 0, yl, 0, yf + 6, [[0, aclarar(color, 0.08)], [1, oscurecer(color, prof)]]);
  g.fill();
  // Brillo vertical (luz que atraviesa)
  g.clip();
  g.fillStyle = lineal(g, v.x - rl, 0, v.x + rl, 0, [[0, 'rgba(255,255,255,0.0)'], [0.22, 'rgba(255,255,255,0.22)'], [0.4, 'rgba(255,255,255,0.0)'], [0.85, 'rgba(0,0,0,0.1)']]);
  g.fillRect(v.x - rl, yl - rl, rl * 2, yf - yl + rl * 2);
  // Burbujitas que suben (posiciones según el tiempo: nada se crea por cuadro)
  if (o.burbujas && o.t !== undefined) {
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = 1.2;
    const alto = yf - yl;
    for (let i = 0; i < 7; i++) {
      const f = (o.t * (0.35 + (i % 3) * 0.12) + i * 0.37) % 1;
      const bx = v.x + Math.sin(i * 7.3 + o.t * 0.8) * rl * 0.6;
      const by = yf - f * alto;
      g.beginPath();
      g.arc(bx, by, 1.4 + (i % 3) * 0.9, 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.restore();
  // La superficie: elipse clarita con menisco y un reflejo
  const ola = o.ola ?? 0;
  g.save();
  g.globalAlpha = 1 - (o.transparencia ?? 0) * 0.35;
  g.fillStyle = o.espuma ?? aclarar(color, 0.18);
  g.beginPath();
  g.ellipse(v.x, yl, rl, rl * v.se + ola, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = conAlfa(oscurecer(color, 0.25), 0.6);
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.ellipse(v.x - rl * 0.3, yl - rl * v.se * 0.25, rl * 0.38, rl * v.se * 0.3, -0.15, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** Cubitos de hielo flotando cerca de la superficie (recortes translúcidos). */
export function hielos(g: G, v: GeoVaso, n: number, nivel: number, t: number, tam: number) {
  const zl = zNivel(v, Math.max(0.15, Math.min(1, nivel)));
  const rl = radioEn(v, zl);
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + 0.6;
    const hx = v.x + Math.cos(a) * rl * 0.45;
    const hy = yEn(v, zl) + Math.sin(a) * rl * v.se * 0.45 + 4 + Math.sin(t * 2 + i) * 1.5 + Math.floor(i / 3) * tam * 0.7;
    if (!spr(g, `hielo_${i % 3}`, hx, hy, tam * 0.9, { rot: Math.sin(i * 3.1) * 0.3 })) {
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.fillRect(hx - tam * 0.5, hy - tam * 0.5, tam, tam);
    }
  }
}

/** Chorro que cae de (x0, y0) a (x1, y1): grosor, brillo y salpicadura arriba del líquido. */
export function chorro(g: G, x0: number, y0: number, x1: number, y1: number, color: string, grosor: number, t: number) {
  g.save();
  g.lineCap = 'round';
  const curva = () => {
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo(x1 + (x0 - x1) * 0.15, y0 + (y1 - y0) * 0.35, x1, y1);
  };
  curva();
  g.strokeStyle = oscurecer(color, 0.15);
  g.lineWidth = grosor;
  g.stroke();
  curva();
  g.strokeStyle = color;
  g.lineWidth = grosor * 0.7;
  g.stroke();
  // Brillito que baja por el chorro
  g.setLineDash([grosor * 1.5, grosor * 2.2]);
  g.lineDashOffset = -t * 160;
  curva();
  g.strokeStyle = 'rgba(255,255,255,0.45)';
  g.lineWidth = grosor * 0.22;
  g.stroke();
  g.restore();
}
