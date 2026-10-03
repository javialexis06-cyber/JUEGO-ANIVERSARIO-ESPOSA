// Texturas pintadas a mano (en un lienzo) para el retrete espacial: el atlas de partículas (fuego, humo,
// corazones, notas, burbujas…), las nebulosas que se repiten de lado, los planetas y las nubes.
import * as THREE from 'three';

const lienzo = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

// ---------------------------------------------------------------------------
// Ruido que se repite (para nebulosas y planetas sin costura)
// ---------------------------------------------------------------------------
function ruidoPeriodico(semilla: number) {
  const N = 256;
  const p = new Uint8Array(N * 2);
  const v = new Float32Array(N);
  let s = semilla * 9301 + 49297;
  const azar = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N; i++) {
    p[i] = i;
    v[i] = azar();
  }
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < N; i++) p[N + i] = p[i];
  const suave = (t: number) => t * t * (3 - 2 * t);
  /** Ruido de valor en (x, y) que se repite cada `px` en x y cada `py` en y. */
  return (x: number, y: number, px: number, py: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = suave(x - xi), fy = suave(y - yi);
    const m = (a: number, per: number) => (((a % per) + per) % per) & 255;
    const x0 = m(xi, px), x1 = m(xi + 1, px), y0 = m(yi, py), y1 = m(yi + 1, py);
    const h = (a: number, b: number) => v[p[p[a] + b]];
    const a = h(x0, y0) + (h(x1, y0) - h(x0, y0)) * fx;
    const b = h(x0, y1) + (h(x1, y1) - h(x0, y1)) * fx;
    return a + (b - a) * fy;
  };
}

/** fbm periódico en [0, 1). */
function fbm(r: ReturnType<typeof ruidoPeriodico>, u: number, v: number, base: number, octavas: number, perY = base) {
  let a = 0, amp = 0.5, f = 1, tot = 0;
  for (let o = 0; o < octavas; o++) {
    a += amp * r(u * base * f, v * perY * f, base * f, perY * f);
    tot += amp;
    amp *= 0.5;
    f *= 2;
  }
  return a / tot;
}

const suave01 = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Pinta fila por fila soltando el hilo cada pocos milisegundos (para no trabar el juego mientras se pinta). */
async function porFilas(H: number, fila: (y: number) => void) {
  let t0 = performance.now();
  for (let y = 0; y < H; y++) {
    fila(y);
    if (performance.now() - t0 > 6) {
      await new Promise((r) => setTimeout(r, 0));
      t0 = performance.now();
    }
  }
}

/**
 * Textura de nebulosa (canal r: nubes grandes, g: filamentos, b: polvo fino) que se repite de lado, para el fondo.
 * Se pinta de a poquitos (no traba el juego).
 */
export async function texturaNebulosa(semilla = 3): Promise<THREE.DataTexture> {
  const W = 512, H = 256;
  const datos = new Uint8Array(W * H * 4);
  const r1 = ruidoPeriodico(semilla), r2 = ruidoPeriodico(semilla + 7), r3 = ruidoPeriodico(semilla + 13);
  await porFilas(H, (y) => {
    for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      // Torcido: el ruido grande desplaza al de los filamentos (se ven como humo)
      // Nubes grandes y suaves (torcidas por otro ruido para que parezcan humo), con filamentos solo donde hay nube
      const w = fbm(r3, u, v, 3, 3, 2);
      const n1 = fbm(r1, u + w * 0.12, v + w * 0.08, 3, 4, 2);
      const n2 = fbm(r2, u + w * 0.25, v - w * 0.15, 6, 3, 3);
      const n3 = fbm(r3, u, v, 32, 2, 16);
      const nube = suave01(0.4, 0.72, n1);
      const filo = Math.pow(Math.max(0, 1 - Math.abs(n2 - 0.5) * 3.2), 4) * suave01(0.32, 0.62, n1);
      const i = (y * W + x) * 4;
      datos[i] = Math.round(nube * 255);
      datos[i + 1] = Math.round(filo * 255);
      datos[i + 2] = Math.max(0, Math.min(255, (n3 - 0.5) * 3 * 255));
      datos[i + 3] = 255;
    }
  });
  const t = new THREE.DataTexture(datos, W, H, THREE.RGBAFormat);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.MirroredRepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------------------
// Atlas de partículas: 4 × 4 casillas de 64 px
// ---------------------------------------------------------------------------
export const CUADRO = {
  brillo: 0, humo: 1, corazon: 2, estrella: 3, chispa: 4, nota: 5, burbuja: 6, petalo: 7, confeti: 8, frijol: 9, llama: 10, cuadrado: 11, aro: 12,
  rollito: 13, punto: 14, flor: 15,
} as const;
export type Cuadro = keyof typeof CUADRO;

export function atlasParticulas(): THREE.CanvasTexture {
  const C = 64;
  const c = lienzo(C * 4, C * 4);
  const g = c.getContext('2d')!;
  const celda = (n: number, dibujar: (g: CanvasRenderingContext2D) => void) => {
    g.save();
    g.translate((n % 4) * C + C / 2, Math.floor(n / 4) * C + C / 2);
    dibujar(g);
    g.restore();
  };
  const radial = (r: number, paradas: [number, string][]) => {
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    for (const [k, col] of paradas) gr.addColorStop(k, col);
    return gr;
  };
  // Brillo suave (fuego, destellos)
  celda(CUADRO.brillo, (g) => {
    g.fillStyle = radial(31, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.75)'], [0.6, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
    g.fillRect(-32, -32, 64, 64);
  });
  // Bocanada de humo: varios círculos suaves encimados
  celda(CUADRO.humo, (g) => {
    let s = 5;
    const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 9; k++) {
      const x = (az() - 0.5) * 26, y = (az() - 0.5) * 26, r = 10 + az() * 12;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  });
  const corazon = (g: CanvasRenderingContext2D, s: number) => {
    g.beginPath();
    g.moveTo(0, s * 0.35);
    g.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.5, -s * 1.05, 0, -s * 0.45);
    g.bezierCurveTo(s * 0.5, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35);
    g.closePath();
  };
  celda(CUADRO.corazon, (g) => {
    g.translate(0, 6);
    corazon(g, 26);
    g.fillStyle = '#fff';
    g.fill();
    // brillito
    g.fillStyle = 'rgba(255,255,255,0.0)';
  });
  const estrella = (g: CanvasRenderingContext2D, R: number, r: number, puntas: number) => {
    g.beginPath();
    for (let k = 0; k < puntas * 2; k++) {
      const a = (k * Math.PI) / puntas - Math.PI / 2;
      const rr = k % 2 ? r : R;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
  };
  celda(CUADRO.estrella, (g) => {
    estrella(g, 28, 12, 5);
    g.fillStyle = '#fff';
    g.lineJoin = 'round';
    g.lineWidth = 4;
    g.strokeStyle = '#fff';
    g.fill();
    g.stroke();
  });
  // Chispa de cuatro puntas con halo
  celda(CUADRO.chispa, (g) => {
    g.fillStyle = radial(20, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
    g.fillRect(-32, -32, 64, 64);
    g.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const rr = k % 2 ? 4 : 30;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    g.fillStyle = '#fff';
    g.fill();
  });
  // Nota musical (corchea)
  celda(CUADRO.nota, (g) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.ellipse(-8, 16, 11, 8, -0.4, 0, Math.PI * 2);
    g.fill();
    g.fillRect(1, -24, 5, 40);
    g.beginPath();
    g.moveTo(6, -24);
    g.quadraticCurveTo(24, -16, 18, 2);
    g.quadraticCurveTo(18, -10, 6, -12);
    g.fill();
  });
  // Burbuja: aro con reflejos
  celda(CUADRO.burbuja, (g) => {
    g.fillStyle = radial(28, [[0, 'rgba(255,255,255,0.05)'], [0.75, 'rgba(255,255,255,0.18)'], [0.93, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
    g.beginPath();
    g.arc(0, 0, 28, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath();
    g.ellipse(-10, -11, 7, 4, -0.7, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(9, 10, 2.5, 0, Math.PI * 2);
    g.fill();
  });
  // Pétalo
  celda(CUADRO.petalo, (g) => {
    g.rotate(0.5);
    g.beginPath();
    g.moveTo(0, 24);
    g.bezierCurveTo(-24, 6, -16, -22, 0, -26);
    g.bezierCurveTo(16, -22, 24, 6, 0, 24);
    g.fillStyle = '#fff';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.12)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 20);
    g.quadraticCurveTo(-3, 0, 0, -20);
    g.stroke();
  });
  // Confeti: tirita redondeada
  celda(CUADRO.confeti, (g) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.roundRect(-16, -9, 32, 18, 5);
    g.fill();
  });
  // Frijol (forma de riñón con brillo)
  celda(CUADRO.frijol, (g) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(-20, -4);
    g.bezierCurveTo(-22, -22, 6, -24, 20, -10);
    g.bezierCurveTo(30, 2, 22, 22, 4, 20);
    g.bezierCurveTo(-4, 19, -2, 8, -10, 8);
    g.bezierCurveTo(-18, 9, -19, 4, -20, -4);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath();
    g.ellipse(6, 4, 9, 6, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath();
    g.ellipse(-6, -10, 7, 3, -0.3, 0, Math.PI * 2);
    g.fill();
  });
  // Lengua de fuego (gota alargada, suave)
  celda(CUADRO.llama, (g) => {
    const gr = g.createRadialGradient(0, 10, 0, 0, 4, 28);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, -30);
    g.bezierCurveTo(14, -10, 22, 10, 0, 28);
    g.bezierCurveTo(-22, 10, -14, -10, 0, -30);
    g.fill();
  });
  // Cuadrado suave (cintas del arcoíris)
  celda(CUADRO.cuadrado, (g) => {
    const gr = g.createLinearGradient(0, -30, 0, 30);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.2, 'rgba(255,255,255,1)');
    gr.addColorStop(0.8, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(-28, -30, 56, 60);
  });
  // Aro (onda expansiva)
  celda(CUADRO.aro, (g) => {
    g.fillStyle = radial(31, [[0, 'rgba(255,255,255,0)'], [0.72, 'rgba(255,255,255,0)'], [0.86, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    g.fillRect(-32, -32, 64, 64);
  });
  // Rollito chiquito (para la paca y el confeti de rollitos)
  celda(CUADRO.rollito, (g) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.roundRect(-18, -14, 30, 28, 6);
    g.fill();
    g.beginPath();
    g.ellipse(12, 0, 8, 14, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(12, 0, 3.5, 6, 0, 0, Math.PI * 2);
    g.fill();
  });
  celda(CUADRO.punto, (g) => {
    g.fillStyle = radial(10, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]);
    g.beginPath();
    g.arc(0, 0, 10, 0, Math.PI * 2);
    g.fill();
  });
  // Florecita (lo que deja el ambientador)
  celda(CUADRO.flor, (g) => {
    g.fillStyle = '#fff';
    for (let k = 0; k < 5; k++) {
      g.save();
      g.rotate((k * Math.PI * 2) / 5);
      g.beginPath();
      g.ellipse(0, -13, 9, 13, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.beginPath();
    g.arc(0, 0, 7, 0, Math.PI * 2);
    g.fill();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/** Halo radial (sprites de brillo detrás de poderes, planetas, ovnis). */
export function texturaHalo(): THREE.CanvasTexture {
  const c = lienzo(128, 128);
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.2, 'rgba(255,255,255,0.6)');
  gr.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------------
// Nubes (el primer tramo, con el cielo del barrio)
// ---------------------------------------------------------------------------
export function texturaNube(semilla: number): THREE.CanvasTexture {
  const c = lienzo(256, 128);
  const g = c.getContext('2d')!;
  let s = semilla * 7 + 3;
  const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // Sombra abajo, cuerpo blanco y luz arriba (nubes de algodón, como de peluche)
  const bolas: [number, number, number][] = [];
  const n = 9 + Math.floor(az() * 5);
  for (let k = 0; k < n; k++) {
    const x = 50 + az() * 156;
    const arco = Math.sin(((x - 50) / 156) * Math.PI);
    bolas.push([x, 80 - arco * 26 - az() * 10, 18 + arco * 22 + az() * 8]);
  }
  bolas.push([128, 88, 30], [80, 92, 22], [176, 92, 22]);
  for (const [x, y, r] of bolas) {
    const gr = g.createRadialGradient(x, y + r * 0.35, r * 0.2, x, y + r * 0.2, r);
    gr.addColorStop(0, 'rgba(226,234,248,1)');
    gr.addColorStop(1, 'rgba(226,234,248,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y + 6, r, 0, Math.PI * 2);
    g.fill();
  }
  for (const [x, y, r] of bolas) {
    const gr = g.createRadialGradient(x - r * 0.25, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.75, 'rgba(250,251,255,0.95)');
    gr.addColorStop(1, 'rgba(240,244,255,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r * 0.92, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------------
// Planetas (mapas equirrectangulares de 512 × 256)
// ---------------------------------------------------------------------------
export type Planeta = 'tierra' | 'luna' | 'marte' | 'jupiter' | 'saturno' | 'neptuno' | 'corazon';

const mezclar = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, k)));
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export async function texturaPlaneta(cual: Planeta, W = 256, H = 128): Promise<THREE.DataTexture> {
  const d = new Uint8Array(W * H * 4);
  const r1 = ruidoPeriodico(11), r2 = ruidoPeriodico(23), r3 = ruidoPeriodico(37);
  // Cráteres (luna y marte): centro (u, v), radio
  const crateres: [number, number, number][] = [];
  let s = cual.length * 31;
  const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  if (cual === 'luna' || cual === 'marte') for (let k = 0; k < (cual === 'luna' ? 70 : 30); k++) crateres.push([az(), 0.12 + az() * 0.76, 0.006 + Math.pow(az(), 3) * 0.06]);
  await porFilas(H, (y) => {
    const v = y / H;
    const lat = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      let c: number[];
      const n = fbm(r1, u, v, 6, 5, 3);
      const n2 = fbm(r2, u, v, 16, 3, 8);
      switch (cual) {
        case 'tierra': {
          const tierra = n + (lat > 0.8 ? 0.3 : 0) > 0.53;
          c = tierra ? mezclar(hex('#5FAE57'), hex('#C9B27A'), (n2 - 0.4) * 2.5) : mezclar(hex('#1D5FA8'), hex('#3D8FD6'), (n - 0.3) * 3);
          if (lat > 0.84) c = hex('#F4F8FF');
          // Nubes
          const nube = fbm(r3, u + n * 0.1, v, 8, 5, 4);
          c = mezclar(c, [255, 255, 255], (nube - 0.58) * 2.4);
          break;
        }
        case 'luna':
          c = mezclar(hex('#8E8A92'), hex('#C9C6CC'), n * 1.3 - 0.1);
          c = mezclar(c, hex('#6F6B74'), (fbm(r2, u, v, 3, 3, 2) - 0.5) * 3);
          break;
        case 'marte':
          c = mezclar(hex('#A8462B'), hex('#E07B4A'), n * 1.4 - 0.2);
          c = mezclar(c, hex('#6E2A1E'), (n2 - 0.55) * 3);
          if (lat > 0.86) c = mezclar(c, hex('#FFF4EC'), (lat - 0.86) * 12);
          break;
        case 'jupiter': {
          const banda = Math.sin(v * 38 + n * 6) * 0.5 + 0.5;
          c = mezclar(hex('#C99B6D'), hex('#F2DDB8'), banda);
          c = mezclar(c, hex('#9A6A47'), (Math.sin(v * 13 + n2 * 4) - 0.6) * 2);
          // La gran mancha roja
          const du = (u - 0.62) * 2.2, dv = (v - 0.62) * 6;
          c = mezclar(c, hex('#C4573A'), 1 - Math.hypot(du, dv) * 1.4);
          break;
        }
        case 'saturno': {
          const banda = Math.sin(v * 30 + n * 3) * 0.5 + 0.5;
          c = mezclar(hex('#E2C68E'), hex('#F6E7C3'), banda);
          break;
        }
        case 'neptuno': {
          const banda = Math.sin(v * 20 + n * 5) * 0.5 + 0.5;
          c = mezclar(hex('#3B6FD8'), hex('#78A8F2'), banda * 0.8 + n2 * 0.3);
          break;
        }
        case 'corazon': {
          const banda = Math.sin(v * 24 + n * 7) * 0.5 + 0.5;
          c = mezclar(hex('#F27BA8'), hex('#FFD1E3'), banda);
          c = mezclar(c, hex('#C9418A'), (n2 - 0.55) * 3);
          break;
        }
      }
      for (const [cu, cv, cr] of crateres) {
        let du = Math.abs(u - cu);
        du = Math.min(du, 1 - du) * 2;
        const dist = Math.hypot(du, v - cv) / cr;
        if (dist < 1.25) {
          if (dist < 0.85) c = mezclar(c, c.map((q) => q * 0.72), 0.9 - dist * 0.6);
          else c = mezclar(c, c.map((q) => Math.min(255, q * 1.18)), 1 - Math.abs(dist - 1.05) * 5);
        }
      }
      const i = (y * W + x) * 4;
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
      d[i + 3] = 255;
    }
  });
  const t = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** Anillo de Saturno (franjas con huecos), en una tira que se envuelve en un aro. */
export function texturaAnillo(): THREE.CanvasTexture {
  const c = lienzo(256, 8);
  const g = c.getContext('2d')!;
  for (let x = 0; x < 256; x++) {
    const k = x / 256;
    const a = 0.25 + 0.55 * Math.abs(Math.sin(k * 40) * Math.sin(k * 7 + 1)) * (k > 0.55 && k < 0.6 ? 0.1 : 1);
    const col = `rgba(${230 - k * 40},${205 - k * 50},${160 - k * 40},${a * (1 - Math.pow(Math.abs(k - 0.5) * 2, 6))})`;
    g.fillStyle = col;
    g.fillRect(x, 0, 1, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ícono de una estela para la tienda: un chorro de sus partículas en diagonal. */
export function iconoEstela(id: string, atlas: HTMLCanvasElement | null = null): string {
  const c = lienzo(144, 144);
  const g = c.getContext('2d')!;
  const fuente = atlas ?? ((atlasParticulas().image as HTMLCanvasElement) ?? null);
  const cuadro = (n: number, x: number, y: number, s: number, color: string, rot = 0, alfa = 1) => {
    if (!fuente) return;
    // Teñir la casilla: se dibuja en un lienzo aparte con el color encima
    const t = lienzo(64, 64);
    const tg = t.getContext('2d')!;
    tg.drawImage(fuente, (n % 4) * 64, Math.floor(n / 4) * 64, 64, 64, 0, 0, 64, 64);
    tg.globalCompositeOperation = 'source-in';
    tg.fillStyle = color;
    tg.fillRect(0, 0, 64, 64);
    g.save();
    g.globalAlpha = alfa;
    g.translate(x, y);
    g.rotate(rot);
    g.drawImage(t, -s / 2, -s / 2, s, s);
    g.restore();
  };
  const ESTILO: Record<string, { cuadros: number[]; colores: string[] }> = {
    fuego: { cuadros: [CUADRO.llama, CUADRO.brillo], colores: ['#FFF3B0', '#FFB347', '#FF7A3D', '#E8473B'] },
    frijoles: { cuadros: [CUADRO.humo, CUADRO.frijol], colores: ['#A6D66A', '#7DBB4B', '#C9E39A', '#8B5A3C'] },
    burbujas: { cuadros: [CUADRO.burbuja], colores: ['#9FE7FF', '#C9B6FF', '#FFC6E8', '#B8FFF0'] },
    corazones: { cuadros: [CUADRO.corazon], colores: ['#FF5C8A', '#FF8FB1', '#E8396E', '#FFC2D4'] },
    chispitas: { cuadros: [CUADRO.chispa, CUADRO.estrella], colores: ['#FFE27A', '#FFD23F', '#FFF5C2', '#FFB627'] },
    notas: { cuadros: [CUADRO.nota], colores: ['#FF6B6B', '#4ECDC4', '#FFD23F', '#A06CD5'] },
    confeti: { cuadros: [CUADRO.confeti], colores: ['#FCD116', '#003893', '#CE1126', '#FCD116'] },
    petalos: { cuadros: [CUADRO.petalo], colores: ['#E8395B', '#FF6F91', '#C9184A', '#FF9EB5'] },
    arcoiris: { cuadros: [CUADRO.cuadrado], colores: ['#FF4B4B', '#FF9F1C', '#FFE66D', '#5BD46B', '#4AA8FF', '#9B6BFF'] },
    estrellas: { cuadros: [CUADRO.estrella, CUADRO.chispa], colores: ['#FFFFFF', '#FFF2A8', '#BFE3FF', '#FFD6F5'] },
  };
  const e = ESTILO[id] ?? ESTILO.fuego;
  // Fondo: círculo de cielo nocturno
  const gr = g.createRadialGradient(72, 72, 10, 72, 72, 70);
  gr.addColorStop(0, '#2B2F6B');
  gr.addColorStop(1, '#14163A');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(72, 72, 68, 0, Math.PI * 2);
  g.fill();
  for (let k = 0; k < 14; k++) {
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillRect((k * 53) % 136 + 4, (k * 37) % 136 + 4, 2, 2);
  }
  if (id === 'arcoiris') {
    for (let b = 0; b < 6; b++) for (let k = 0; k < 9; k++) cuadro(CUADRO.cuadrado, 22 + k * 11, 40 + b * 9 + Math.sin(k * 0.9) * 6, 16, e.colores[b]);
  } else {
    for (let k = 0; k < 14; k++) {
      const t = k / 13;
      const x = 118 - t * 96, y = 30 + t * 84 + Math.sin(t * 9) * 6;
      const s = 14 + (1 - t) * 30;
      cuadro(e.cuadros[k % e.cuadros.length], x, y, s, e.colores[k % e.colores.length], k * 0.7, 0.35 + (1 - t) * 0.65);
    }
  }
  return c.toDataURL('image/png');
}
