// Texturas que se pintan al empezar (en lienzos 2D, sin archivos): los efectos (burbujas con reflejo de arcoíris,
// brillos, gotas, espuma, corazones, llamas, aire caliente, perfume…), los números de daño, el ruido para el piso y
// el detalle de cada escenario (los poros y las pecas de la cara, la porcelana del lavamanos, el agua de la bañera)
// y su decoración (lunares con pelito, vellitos, cicatrices, gotas, pelos, pétalos).
import * as THREE from 'three';
import { cuadroDe, type Cuadro } from './sprites';

const lienzo = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

function textura(c: HTMLCanvasElement, repetir = false, mip = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = mip;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

let semilla = 12345;
const az = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

// ------------------------------------------------------------------------------------------------------ Ruido
/** Ruido de valor que se repite (tileable), suavizado, en varias octavas. */
export function ruidoTileable(n: number, celdas: number, seed: number): Float32Array {
  semilla = seed;
  const g = new Float32Array(celdas * celdas);
  for (let i = 0; i < g.length; i++) g[i] = az();
  const out = new Float32Array(n * n);
  const s = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const fx = (x / n) * celdas, fy = (y / n) * celdas;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = s(fx - x0), ty = s(fy - y0);
      const a = g[(y0 % celdas) * celdas + (x0 % celdas)], b = g[(y0 % celdas) * celdas + ((x0 + 1) % celdas)];
      const c = g[((y0 + 1) % celdas) * celdas + (x0 % celdas)], d = g[((y0 + 1) % celdas) * celdas + ((x0 + 1) % celdas)];
      out[y * n + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    }
  return out;
}

export function fbm(n: number, base: number, octavas: number, seed: number): Float32Array {
  const out = new Float32Array(n * n);
  let amp = 1, total = 0;
  for (let o = 0; o < octavas; o++) {
    const r = ruidoTileable(n, base << o, seed + o * 101);
    for (let i = 0; i < out.length; i++) out[i] += r[i] * amp;
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Textura de ruido (RGBA = cuatro ruidos distintos) para los shaders del piso. */
export function texturaRuido(): THREE.DataTexture {
  const n = 256;
  const a = fbm(n, 4, 4, 11), b = fbm(n, 8, 3, 23), c = fbm(n, 16, 3, 37), d = fbm(n, 3, 2, 51);
  const datos = new Uint8Array(n * n * 4);
  for (let i = 0; i < n * n; i++) {
    datos[i * 4] = a[i] * 255;
    datos[i * 4 + 1] = b[i] * 255;
    datos[i * 4 + 2] = c[i] * 255;
    datos[i * 4 + 3] = d[i] * 255;
  }
  const t = new THREE.DataTexture(datos, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

// ------------------------------------------------------------------------------------------------------ Efectos
export type IdFx =
  | 'burbuja' | 'brillo' | 'chispa' | 'gota' | 'espuma' | 'anillo' | 'humo' | 'corazon' | 'estrella' | 'llama' | 'aire' | 'perfume'
  | 'confeti' | 'copo' | 'sombra' | 'onda' | 'salpicadura' | 'trazo' | 'petalo' | 'rayo' | 'cruz' | 'nota' | 'polvo' | 'chorro';

const FX: IdFx[] = [
  'burbuja', 'brillo', 'chispa', 'gota', 'espuma', 'anillo', 'humo', 'corazon', 'estrella', 'llama', 'aire', 'perfume', 'confeti', 'copo',
  'sombra', 'onda', 'salpicadura', 'trazo', 'petalo', 'rayo', 'cruz', 'nota', 'polvo', 'chorro',
];

function corazonCamino(g: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  g.beginPath();
  g.moveTo(cx, cy + s * 0.35);
  g.bezierCurveTo(cx - s * 0.9, cy - s * 0.25, cx - s * 0.45, cy - s * 0.9, cx, cy - s * 0.42);
  g.bezierCurveTo(cx + s * 0.45, cy - s * 0.9, cx + s * 0.9, cy - s * 0.25, cx, cy + s * 0.35);
  g.closePath();
}

function estrellaCamino(g: CanvasRenderingContext2D, cx: number, cy: number, r1: number, r2: number, puntas: number, giro = -Math.PI / 2) {
  g.beginPath();
  for (let k = 0; k < puntas * 2; k++) {
    const r = k % 2 ? r2 : r1;
    const a = giro + (k / (puntas * 2)) * Math.PI * 2;
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.closePath();
}

function pintarFx(g: CanvasRenderingContext2D, id: IdFx, C: number) {
  const m = C / 2;
  g.save();
  switch (id) {
    case 'burbuja': {
      // Pompa de jabón: borde iridiscente, casi transparente por dentro y dos reflejos
      const r = C * 0.44;
      const cuerpo = g.createRadialGradient(m, m, r * 0.2, m, m, r);
      cuerpo.addColorStop(0, 'rgba(255,255,255,0.05)');
      cuerpo.addColorStop(0.75, 'rgba(210,240,255,0.18)');
      cuerpo.addColorStop(1, 'rgba(255,255,255,0.0)');
      g.fillStyle = cuerpo;
      g.beginPath();
      g.arc(m, m, r, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = C * 0.05;
      const iri = g.createLinearGradient(0, 0, C, C);
      ['#ff9de2', '#a8e6ff', '#c9ffb4', '#ffe9a0', '#d4b3ff'].forEach((c, i) => iri.addColorStop(i / 4, c));
      g.strokeStyle = iri;
      g.globalAlpha = 0.9;
      g.beginPath();
      g.arc(m, m, r * 0.94, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.beginPath();
      g.ellipse(m - r * 0.38, m - r * 0.42, r * 0.22, r * 0.12, -0.7, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(m + r * 0.4, m + r * 0.38, r * 0.07, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'brillo': {
      const gr = g.createRadialGradient(m, m, 0, m, m, m);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.25, 'rgba(255,255,255,0.65)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, C, C);
      break;
    }
    case 'chispa': {
      const gr = g.createRadialGradient(m, m, 0, m, m, m * 0.35);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, C, C);
      g.fillStyle = '#fff';
      estrellaCamino(g, m, m, C * 0.48, C * 0.06, 4, 0);
      g.fill();
      break;
    }
    case 'gota': {
      g.translate(m, m);
      const gr = g.createLinearGradient(-C * 0.2, -C * 0.3, C * 0.2, C * 0.35);
      gr.addColorStop(0, '#d8f4ff');
      gr.addColorStop(1, '#3f9fe0');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, -C * 0.42);
      g.bezierCurveTo(C * 0.12, -C * 0.2, C * 0.3, C * 0.02, C * 0.3, C * 0.16);
      g.arc(0, C * 0.16, C * 0.3, 0, Math.PI);
      g.bezierCurveTo(-C * 0.3, C * 0.02, -C * 0.12, -C * 0.2, 0, -C * 0.42);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath();
      g.ellipse(-C * 0.1, C * 0.08, C * 0.06, C * 0.11, 0.3, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'espuma': {
      // Motica de espuma: varias pompas pegadas, blanca con sombrita azul
      const pompas: [number, number, number][] = [[0, 0, 0.3], [-0.2, 0.08, 0.2], [0.2, 0.06, 0.22], [-0.05, -0.18, 0.2], [0.12, 0.2, 0.16], [-0.18, -0.12, 0.13]];
      for (const [x, y, r] of pompas) {
        const gr = g.createRadialGradient(m + (x - r * 0.3) * C, m + (y - r * 0.35) * C, 0, m + x * C, m + y * C, r * C);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(0.7, '#f4f9ff');
        gr.addColorStop(1, '#c9dcef');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(m + x * C, m + y * C, r * C, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'anillo': {
      g.lineWidth = C * 0.07;
      g.strokeStyle = '#ffffff';
      g.shadowColor = '#ffffff';
      g.shadowBlur = C * 0.08;
      g.beginPath();
      g.arc(m, m, C * 0.4, 0, Math.PI * 2);
      g.stroke();
      break;
    }
    case 'humo': {
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        const gr = g.createRadialGradient(m + Math.cos(a) * C * 0.14, m + Math.sin(a) * C * 0.14, 0, m + Math.cos(a) * C * 0.14, m + Math.sin(a) * C * 0.14, C * 0.3);
        gr.addColorStop(0, 'rgba(255,255,255,0.55)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, C, C);
      }
      break;
    }
    case 'corazon': {
      const gr = g.createLinearGradient(0, C * 0.1, 0, C * 0.9);
      gr.addColorStop(0, '#ff9ab8');
      gr.addColorStop(1, '#e8436e');
      g.fillStyle = gr;
      corazonCamino(g, m, m + C * 0.08, C * 0.85);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.beginPath();
      g.ellipse(m - C * 0.18, m - C * 0.12, C * 0.08, C * 0.05, -0.6, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'estrella': {
      const gr = g.createLinearGradient(0, 0, 0, C);
      gr.addColorStop(0, '#fff6b8');
      gr.addColorStop(1, '#f2b53c');
      g.fillStyle = gr;
      estrellaCamino(g, m, m + C * 0.03, C * 0.46, C * 0.2, 5);
      g.fill();
      break;
    }
    case 'llama': {
      const gr = g.createRadialGradient(m, m + C * 0.18, 0, m, m + C * 0.05, C * 0.45);
      gr.addColorStop(0, 'rgba(255,250,210,1)');
      gr.addColorStop(0.35, 'rgba(255,190,70,0.95)');
      gr.addColorStop(0.7, 'rgba(240,80,40,0.7)');
      gr.addColorStop(1, 'rgba(200,30,20,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(m, C * 0.04);
      g.bezierCurveTo(m + C * 0.12, C * 0.3, m + C * 0.42, C * 0.5, m + C * 0.3, C * 0.78);
      g.arc(m, C * 0.7, C * 0.3, 0.3, Math.PI - 0.3);
      g.bezierCurveTo(m - C * 0.42, C * 0.5, m - C * 0.12, C * 0.3, m, C * 0.04);
      g.fill();
      break;
    }
    case 'aire': {
      // Ráfaga de aire caliente: rayitas curvas naranjas y blancas
      g.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        g.strokeStyle = k % 2 ? 'rgba(255,200,140,0.9)' : 'rgba(255,255,255,0.95)';
        g.lineWidth = C * (0.07 - k * 0.012);
        g.beginPath();
        const y = m + (k - 1.5) * C * 0.15;
        g.moveTo(C * 0.1, y);
        g.quadraticCurveTo(m, y - C * 0.16 * (k % 2 ? 1 : -1), C * 0.9, y + C * 0.05);
        g.stroke();
      }
      break;
    }
    case 'perfume': {
      const gr = g.createRadialGradient(m, m, 0, m, m, m * 0.9);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.3, 'rgba(255,190,230,0.9)');
      gr.addColorStop(1, 'rgba(230,130,220,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, C, C);
      g.fillStyle = '#ffffff';
      estrellaCamino(g, m, m, C * 0.3, C * 0.05, 4, 0);
      g.fill();
      break;
    }
    case 'confeti': {
      const colores = ['#ff7aa8', '#7db7e8', '#ffd45c', '#8fd3b6', '#c9b6ea'];
      for (let k = 0; k < 6; k++) {
        g.fillStyle = colores[k % colores.length];
        g.save();
        g.translate(C * (0.2 + (k % 3) * 0.3), C * (0.25 + Math.floor(k / 3) * 0.45));
        g.rotate(k * 0.9);
        g.fillRect(-C * 0.08, -C * 0.035, C * 0.16, C * 0.07);
        g.restore();
      }
      break;
    }
    case 'copo': {
      g.strokeStyle = '#ffffff';
      g.lineWidth = C * 0.05;
      g.lineCap = 'round';
      g.shadowColor = '#bfe6f5';
      g.shadowBlur = C * 0.08;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        g.beginPath();
        g.moveTo(m, m);
        g.lineTo(m + Math.cos(a) * C * 0.42, m + Math.sin(a) * C * 0.42);
        g.moveTo(m + Math.cos(a) * C * 0.26, m + Math.sin(a) * C * 0.26);
        g.lineTo(m + Math.cos(a + 0.5) * C * 0.36, m + Math.sin(a + 0.5) * C * 0.36);
        g.moveTo(m + Math.cos(a) * C * 0.26, m + Math.sin(a) * C * 0.26);
        g.lineTo(m + Math.cos(a - 0.5) * C * 0.36, m + Math.sin(a - 0.5) * C * 0.36);
        g.stroke();
      }
      break;
    }
    case 'sombra': {
      const gr = g.createRadialGradient(m, m, 0, m, m, m);
      gr.addColorStop(0, 'rgba(0,0,0,0.75)');
      gr.addColorStop(0.55, 'rgba(0,0,0,0.45)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, C, C);
      break;
    }
    case 'onda': {
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = `rgba(255,255,255,${0.9 - k * 0.25})`;
        g.lineWidth = C * (0.04 - k * 0.008);
        g.beginPath();
        g.arc(m, m, C * (0.44 - k * 0.11), 0, Math.PI * 2);
        g.stroke();
      }
      break;
    }
    case 'salpicadura': {
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(m, m, C * 0.22, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + 0.3;
        const r = C * (0.28 + (k % 3) * 0.06);
        g.beginPath();
        g.arc(m + Math.cos(a) * r, m + Math.sin(a) * r, C * (0.04 + (k % 2) * 0.03), 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.ellipse(m + Math.cos(a) * r * 0.6, m + Math.sin(a) * r * 0.6, C * 0.07, C * 0.035, a, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'trazo': {
      // Estela del toallazo: una banda blanca que se adelgaza (se tiñe en el juego)
      const gr = g.createLinearGradient(0, 0, C, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.3, 'rgba(255,255,255,0.8)');
      gr.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, m);
      g.quadraticCurveTo(m, m - C * 0.42, C, m - C * 0.12);
      g.quadraticCurveTo(m * 1.1, m - C * 0.05, C * 0.98, m + C * 0.2);
      g.quadraticCurveTo(m, m + C * 0.1, 0, m);
      g.fill();
      break;
    }
    case 'petalo': {
      const gr = g.createLinearGradient(0, 0, C, C);
      gr.addColorStop(0, '#ffd1e0');
      gr.addColorStop(1, '#f07aa0');
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(m, m, C * 0.2, C * 0.4, 0.5, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'rayo': {
      g.lineCap = 'round';
      g.lineJoin = 'round';
      const pts: [number, number][] = [[0.5, 0], [0.38, 0.28], [0.58, 0.36], [0.4, 0.62], [0.6, 0.7], [0.46, 1]];
      for (const [ancho, color] of [[0.16, 'rgba(255,240,140,0.35)'], [0.08, 'rgba(255,250,200,0.9)'], [0.03, '#ffffff']] as const) {
        g.strokeStyle = color;
        g.lineWidth = C * ancho;
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x * C, y * C) : g.moveTo(x * C, y * C)));
        g.stroke();
      }
      break;
    }
    case 'cruz': {
      g.fillStyle = '#ffffff';
      g.fillRect(m - C * 0.1, C * 0.15, C * 0.2, C * 0.7);
      g.fillRect(C * 0.15, m - C * 0.1, C * 0.7, C * 0.2);
      break;
    }
    case 'nota': {
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.ellipse(m - C * 0.12, m + C * 0.22, C * 0.16, C * 0.12, -0.4, 0, Math.PI * 2);
      g.fill();
      g.fillRect(m + C * 0.02, C * 0.15, C * 0.06, C * 0.45);
      g.fillRect(m + C * 0.02, C * 0.15, C * 0.25, C * 0.08);
      break;
    }
    case 'polvo': {
      for (let k = 0; k < 14; k++) {
        g.fillStyle = `rgba(255,255,255,${0.4 + az() * 0.6})`;
        g.beginPath();
        g.arc(C * (0.15 + az() * 0.7), C * (0.15 + az() * 0.7), C * (0.02 + az() * 0.05), 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'chorro': {
      // Agua que cae (se repite en vertical): hilos claros y oscuros
      const gr = g.createLinearGradient(0, 0, C, 0);
      gr.addColorStop(0, 'rgba(160,220,250,0)');
      gr.addColorStop(0.2, 'rgba(160,220,250,0.75)');
      gr.addColorStop(0.5, 'rgba(230,248,255,0.95)');
      gr.addColorStop(0.8, 'rgba(160,220,250,0.75)');
      gr.addColorStop(1, 'rgba(160,220,250,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, C, C);
      for (let k = 0; k < 10; k++) {
        g.fillStyle = k % 2 ? 'rgba(255,255,255,0.8)' : 'rgba(90,170,230,0.45)';
        const x = C * (0.15 + az() * 0.7);
        g.fillRect(x, az() * C, C * 0.02, C * (0.2 + az() * 0.4));
      }
      break;
    }
  }
  g.restore();
}

export interface AtlasFx {
  textura: THREE.CanvasTexture;
  c: Record<IdFx, Cuadro>;
}

export function atlasFx(): AtlasFx {
  semilla = 777;
  const C = 128, por = 8;
  const filas = Math.ceil(FX.length / por);
  const cv = lienzo(C * por, C * filas);
  const g = cv.getContext('2d')!;
  const c = {} as Record<IdFx, Cuadro>;
  FX.forEach((id, i) => {
    const x = (i % por) * C, y = Math.floor(i / por) * C;
    g.save();
    g.translate(x, y);
    g.beginPath();
    g.rect(0, 0, C, C);
    g.clip();
    pintarFx(g, id, C);
    g.restore();
    // medio píxel adentro para que no se cuele el vecino
    c[id] = cuadroDe(x + 1, y + 1, C - 2, C - 2, cv.width, cv.height);
  });
  return { textura: textura(cv), c };
}

// ------------------------------------------------------------------------------------------------------ Números
export interface AtlasNumeros {
  textura: THREE.CanvasTexture;
  /** Cuadro de cada dígito (0-9) y su ancho relativo. */
  d: Cuadro[];
  ancho: number[];
}

export function atlasNumeros(): AtlasNumeros {
  const W = 64, H = 80;
  const cv = lienzo(W * 12, H);
  const g = cv.getContext('2d')!;
  g.font = `700 ${H * 0.82}px Fredoka, Nunito, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  const d: Cuadro[] = [];
  const ancho: number[] = [];
  for (let k = 0; k < 11; k++) {
    const s = k < 10 ? String(k) : '+';
    const x = k * W + W / 2;
    g.lineWidth = 12;
    g.strokeStyle = '#3d2b27';
    g.strokeText(s, x, H / 2 + 3);
    g.fillStyle = '#ffffff';
    g.fillText(s, x, H / 2 + 3);
    d.push(cuadroDe(k * W, 0, W, H, cv.width, cv.height));
    ancho.push(Math.min(1, (g.measureText(s).width + 12) / W));
  }
  return { textura: textura(cv, false, true), d, ancho };
}

// ------------------------------------------------------------------------------------------------------ Pisos
/** Detalle de la piel (se repite): poros, pequitas, rayitas finas y vellitos. Tonos neutros que el shader colorea. */
export function detalleCara(): THREE.CanvasTexture {
  semilla = 4242;
  const N = 512;
  const cv = lienzo(N, N);
  const g = cv.getContext('2d')!;
  const base = fbm(N, 8, 4, 91);
  const img = g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const v = 0.5 + (base[i] - 0.5) * 0.35;
    img.data[i * 4] = v * 255;
    img.data[i * 4 + 1] = v * 255;
    img.data[i * 4 + 2] = v * 255;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tile = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) fn(x + dx, y + dy);
  };
  // Rayitas finas de la piel (como una malla muy suave)
  g.strokeStyle = 'rgba(70,40,30,0.08)';
  g.lineWidth = 1;
  for (let k = 0; k < 220; k++) {
    const x = az() * N, y = az() * N, a = az() * Math.PI, l = 10 + az() * 24;
    tile((px, py) => {
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
      g.stroke();
    }, x, y);
  }
  // Poros: puntico oscuro con borde claro
  for (let k = 0; k < 520; k++) {
    const x = az() * N, y = az() * N, r = 1 + az() * 1.8;
    tile((px, py) => {
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.beginPath();
      g.arc(px - 0.6, py - 0.6, r + 0.8, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(60,25,20,${0.22 + az() * 0.18})`;
      g.beginPath();
      g.arc(px, py, r, 0, Math.PI * 2);
      g.fill();
    }, x, y);
  }
  // Pequitas (manchitas cálidas, en grupos)
  for (let grupo = 0; grupo < 9; grupo++) {
    const cx = az() * N, cy = az() * N;
    for (let k = 0; k < 14; k++) {
      const x = cx + (az() - 0.5) * 90, y = cy + (az() - 0.5) * 70, r = 2 + az() * 3.5;
      tile((px, py) => {
        g.fillStyle = `rgba(150,70,35,${0.16 + az() * 0.18})`;
        g.beginPath();
        g.ellipse(px, py, r, r * (0.7 + az() * 0.3), az() * 3, 0, Math.PI * 2);
        g.fill();
      }, x, y);
    }
  }
  // Vellitos finitos
  g.lineCap = 'round';
  for (let k = 0; k < 160; k++) {
    const x = az() * N, y = az() * N, a = -0.6 + az() * 0.5, l = 6 + az() * 9;
    tile((px, py) => {
      g.strokeStyle = `rgba(90,60,45,${0.18 + az() * 0.15})`;
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(px, py);
      g.quadraticCurveTo(px + Math.cos(a) * l * 0.5, py + Math.sin(a) * l * 0.5 - 2, px + Math.cos(a) * l, py + Math.sin(a) * l);
      g.stroke();
    }, x, y);
  }
  return textura(cv, true);
}

/** Porcelana del lavamanos: vidriado con vetas suaves, goticas y restos de jabón. */
export function detalleLavamanos(): THREE.CanvasTexture {
  semilla = 999;
  const N = 512;
  const cv = lienzo(N, N);
  const g = cv.getContext('2d')!;
  const base = fbm(N, 4, 4, 17);
  const vetas = fbm(N, 16, 3, 29);
  const img = g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const v = 0.55 + (base[i] - 0.5) * 0.25 + Math.max(0, 0.08 - Math.abs(vetas[i] - 0.5)) * 1.2;
    img.data[i * 4] = v * 255;
    img.data[i * 4 + 1] = v * 255;
    img.data[i * 4 + 2] = v * 255;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // Goticas de agua con brillo
  for (let k = 0; k < 70; k++) {
    const x = az() * N, y = az() * N, r = 2 + az() * 6;
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {
      g.fillStyle = 'rgba(80,120,160,0.22)';
      g.beginPath();
      g.ellipse(x + dx + 1, y + dy + 1.5, r, r * 0.85, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.beginPath();
      g.ellipse(x + dx - r * 0.3, y + dy - r * 0.3, r * 0.35, r * 0.25, -0.6, 0, Math.PI * 2);
      g.fill();
    }
  }
  // Restos de espuma (manchas blancas suaves)
  for (let k = 0; k < 14; k++) {
    const x = az() * N, y = az() * N;
    const gr = g.createRadialGradient(x, y, 0, x, y, 30);
    gr.addColorStop(0, 'rgba(255,255,255,0.3)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(x - 30, y - 30, 60, 60);
  }
  return textura(cv, true);
}

/** Agua de la bañera: ondas, espumita y burbujitas (el shader le pone las cáusticas que se mueven). */
export function detalleBanera(): THREE.CanvasTexture {
  semilla = 2024;
  const N = 512;
  const cv = lienzo(N, N);
  const g = cv.getContext('2d')!;
  const base = fbm(N, 4, 4, 61);
  const img = g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const v = 0.5 + (base[i] - 0.5) * 0.4;
    img.data[i * 4] = v * 255;
    img.data[i * 4 + 1] = v * 255;
    img.data[i * 4 + 2] = v * 255;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let k = 0; k < 120; k++) {
    const x = az() * N, y = az() * N, r = 1.5 + az() * 5;
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.beginPath();
      g.arc(x + dx - r * 0.35, y + dy - r * 0.35, r * 0.25, 0, Math.PI * 2);
      g.fill();
    }
  }
  return textura(cv, true);
}

// ------------------------------------------------------------------------------------------------------ Decoración del piso
export type IdDecor =
  | 'lunar' | 'pecas' | 'vellos' | 'cicatriz' | 'brilloGrasa' | 'poroGrande' | 'ceja'
  | 'gotaAgua' | 'pelito' | 'pasta' | 'manchaJabon' | 'baldosa' | 'desague'
  | 'petalos' | 'espumaIsla' | 'burbujitas' | 'hojita';

const DECOR: IdDecor[] = ['lunar', 'pecas', 'vellos', 'cicatriz', 'brilloGrasa', 'poroGrande', 'ceja', 'gotaAgua', 'pelito', 'pasta', 'manchaJabon',
  'baldosa', 'desague', 'petalos', 'espumaIsla', 'burbujitas', 'hojita'];

function pintarDecor(g: CanvasRenderingContext2D, id: IdDecor, C: number) {
  const m = C / 2;
  g.lineCap = 'round';
  switch (id) {
    case 'lunar': {
      const gr = g.createRadialGradient(m - C * 0.05, m - C * 0.05, 0, m, m, C * 0.16);
      gr.addColorStop(0, '#8a5a44');
      gr.addColorStop(1, '#4e2e22');
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(m, m, C * 0.15, C * 0.13, 0.3, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#3a221a';
      g.lineWidth = C * 0.012;
      g.beginPath();
      g.moveTo(m + C * 0.02, m - C * 0.04);
      g.quadraticCurveTo(m + C * 0.15, m - C * 0.3, m + C * 0.32, m - C * 0.34);
      g.stroke();
      break;
    }
    case 'pecas': {
      for (let k = 0; k < 16; k++) {
        g.fillStyle = `rgba(160,80,40,${0.3 + az() * 0.35})`;
        g.beginPath();
        g.ellipse(m + (az() - 0.5) * C * 0.8, m + (az() - 0.5) * C * 0.6, C * (0.015 + az() * 0.025), C * (0.012 + az() * 0.02), az() * 3, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'vellos': {
      for (let k = 0; k < 18; k++) {
        const x = m + (az() - 0.5) * C * 0.7, y = m + (az() - 0.5) * C * 0.5;
        g.strokeStyle = `rgba(80,50,35,${0.35 + az() * 0.3})`;
        g.lineWidth = C * 0.008;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + C * 0.05, y - C * 0.06, x + C * 0.11, y - C * 0.05);
        g.stroke();
      }
      break;
    }
    case 'cicatriz': {
      g.strokeStyle = 'rgba(210,120,110,0.55)';
      g.lineWidth = C * 0.05;
      g.beginPath();
      g.moveTo(C * 0.25, m + C * 0.05);
      g.quadraticCurveTo(m, m - C * 0.08, C * 0.75, m + C * 0.03);
      g.stroke();
      g.strokeStyle = 'rgba(255,220,210,0.5)';
      g.lineWidth = C * 0.015;
      g.stroke();
      break;
    }
    case 'brilloGrasa': {
      const gr = g.createRadialGradient(m, m, 0, m, m, m);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)');
      gr.addColorStop(0.4, 'rgba(255,250,235,0.25)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(m, m, m, m * 0.6, -0.4, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'poroGrande': {
      for (let k = 0; k < 5; k++) {
        const x = m + (az() - 0.5) * C * 0.6, y = m + (az() - 0.5) * C * 0.5;
        g.fillStyle = 'rgba(255,255,255,0.3)';
        g.beginPath();
        g.arc(x - 1.5, y - 1.5, C * 0.04, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(70,35,25,0.55)';
        g.beginPath();
        g.arc(x, y, C * 0.028, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'ceja': {
      for (let k = 0; k < 40; k++) {
        const t = k / 40;
        const x = C * 0.1 + t * C * 0.8, y = m + Math.sin(t * Math.PI) * -C * 0.12 + (az() - 0.5) * C * 0.08;
        g.strokeStyle = `rgba(60,35,25,${0.6 + az() * 0.3})`;
        g.lineWidth = C * 0.012;
        g.beginPath();
        g.moveTo(x, y + C * 0.05);
        g.lineTo(x + C * 0.08, y - C * 0.04);
        g.stroke();
      }
      break;
    }
    case 'gotaAgua': {
      for (let k = 0; k < 4; k++) {
        const x = m + (az() - 0.5) * C * 0.6, y = m + (az() - 0.5) * C * 0.5, r = C * (0.04 + az() * 0.07);
        g.fillStyle = 'rgba(60,110,160,0.28)';
        g.beginPath();
        g.ellipse(x + 2, y + 3, r, r * 0.9, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(220,240,255,0.55)';
        g.beginPath();
        g.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.beginPath();
        g.ellipse(x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.2, -0.6, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'pelito': {
      g.strokeStyle = 'rgba(40,28,24,0.85)';
      g.lineWidth = C * 0.01;
      g.beginPath();
      g.moveTo(C * 0.1, m);
      g.bezierCurveTo(C * 0.35, C * 0.1, C * 0.55, C * 0.9, C * 0.9, C * 0.4);
      g.stroke();
      break;
    }
    case 'pasta': {
      g.strokeStyle = '#f4faff';
      g.lineWidth = C * 0.09;
      g.beginPath();
      g.moveTo(C * 0.2, m);
      g.bezierCurveTo(C * 0.4, C * 0.3, C * 0.6, C * 0.7, C * 0.8, m);
      g.stroke();
      g.strokeStyle = '#68c9b9';
      g.lineWidth = C * 0.025;
      g.stroke();
      break;
    }
    case 'manchaJabon': {
      for (let k = 0; k < 6; k++) {
        const x = m + (az() - 0.5) * C * 0.5, y = m + (az() - 0.5) * C * 0.4;
        const gr = g.createRadialGradient(x, y, 0, x, y, C * 0.18);
        gr.addColorStop(0, 'rgba(255,255,255,0.7)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, C, C);
      }
      break;
    }
    case 'baldosa': {
      g.fillStyle = 'rgba(255,255,255,0.2)';
      g.fillRect(C * 0.06, C * 0.06, C * 0.88, C * 0.88);
      g.strokeStyle = 'rgba(120,150,170,0.5)';
      g.lineWidth = C * 0.04;
      g.strokeRect(C * 0.04, C * 0.04, C * 0.92, C * 0.92);
      break;
    }
    case 'desague': {
      g.fillStyle = '#c9ced8';
      g.beginPath();
      g.arc(m, m, C * 0.38, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5a6068';
      for (let k = 0; k < 6; k++) {
        g.save();
        g.translate(m, m);
        g.rotate((k / 6) * Math.PI);
        g.fillRect(-C * 0.28, -C * 0.025, C * 0.56, C * 0.05);
        g.restore();
      }
      g.strokeStyle = '#8a9098';
      g.lineWidth = C * 0.04;
      g.beginPath();
      g.arc(m, m, C * 0.38, 0, Math.PI * 2);
      g.stroke();
      break;
    }
    case 'petalos': {
      for (let k = 0; k < 5; k++) {
        const gr = g.createLinearGradient(0, 0, C, C);
        gr.addColorStop(0, '#ffd1e0');
        gr.addColorStop(1, '#f07aa0');
        g.fillStyle = gr;
        g.beginPath();
        g.ellipse(m + (az() - 0.5) * C * 0.5, m + (az() - 0.5) * C * 0.5, C * 0.07, C * 0.13, az() * 3, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'espumaIsla': {
      for (let k = 0; k < 12; k++) {
        const x = m + (az() - 0.5) * C * 0.6, y = m + (az() - 0.5) * C * 0.35, r = C * (0.06 + az() * 0.1);
        const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(1, 'rgba(210,230,245,0.9)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'burbujitas': {
      for (let k = 0; k < 7; k++) {
        const x = m + (az() - 0.5) * C * 0.7, y = m + (az() - 0.5) * C * 0.5, r = C * (0.03 + az() * 0.06);
        g.strokeStyle = 'rgba(255,255,255,0.8)';
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.8)';
        g.beginPath();
        g.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'hojita': {
      g.fillStyle = '#7fcb5a';
      g.beginPath();
      g.ellipse(m, m, C * 0.12, C * 0.25, 0.8, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#4e8a32';
      g.lineWidth = C * 0.015;
      g.beginPath();
      g.moveTo(m - C * 0.15, m + C * 0.15);
      g.lineTo(m + C * 0.15, m - C * 0.15);
      g.stroke();
      break;
    }
  }
}

export interface AtlasDecor {
  textura: THREE.CanvasTexture;
  c: Record<IdDecor, Cuadro>;
}

export function atlasDecor(): AtlasDecor {
  semilla = 31337;
  const C = 128, por = 8;
  const cv = lienzo(C * por, C * Math.ceil(DECOR.length / por));
  const g = cv.getContext('2d')!;
  const c = {} as Record<IdDecor, Cuadro>;
  DECOR.forEach((id, i) => {
    const x = (i % por) * C, y = Math.floor(i / por) * C;
    g.save();
    g.translate(x, y);
    g.beginPath();
    g.rect(0, 0, C, C);
    g.clip();
    pintarDecor(g, id, C);
    g.restore();
    c[id] = cuadroDe(x + 1, y + 1, C - 2, C - 2, cv.width, cv.height);
  });
  return { textura: textura(cv), c };
}
