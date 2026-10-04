// Texturas hechas en un lienzo (sin archivos): fuego, chispa, humo, polvo, alma, sangre, niebla y luz para las
// partículas, y la llama de las antorchas. Si el frente de figuras deja `sangre/particulas/*.webp`, se usan esas.
import * as THREE from 'three';

/** Escala de los puntos (depende del alto de la pantalla en píxeles): la ajusta la escena al cambiar de tamaño. */
export const ESCALA_PUNTOS = { value: 800 };

let fuego: THREE.Texture | null = null;

/** Una llama: núcleo blanco amarillo, cuerpo naranja y punta que se pierde en rojo. */
export function texturaFuego(): THREE.Texture {
  if (fuego) return fuego;
  const n = 64;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const capa = (cx: number, cy: number, rx: number, ry: number, color: string, a: number) => {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    gr.addColorStop(0, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save();
    g.globalAlpha = a;
    g.translate(cx, cy);
    g.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    g.translate(-cx, -cy);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(cx, cy, Math.max(rx, ry), 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  capa(32, 40, 22, 30, 'rgba(255,60,10,1)', 0.7);
  capa(32, 42, 14, 22, 'rgba(255,140,30,1)', 0.9);
  capa(32, 46, 8, 13, 'rgba(255,230,150,1)', 1);
  fuego = new THREE.CanvasTexture(c);
  fuego.colorSpace = THREE.SRGBColorSpace;
  return fuego;
}

/** Cuadros del atlas de partículas (4 × 2). */
export const CUADRO = { BRASA: 0, CHISPA: 1, HUMO: 2, POLVO: 3, ALMA: 4, SANGRE: 5, NIEBLA: 6, LUZ: 7 } as const;

let atlas: THREE.Texture | null = null;

/** El atlas de partículas: 8 cuadros de 64 px. */
export function atlasParticulas(): THREE.Texture {
  if (atlas) return atlas;
  const t = 64;
  const c = document.createElement('canvas');
  c.width = t * 4;
  c.height = t * 2;
  const g = c.getContext('2d')!;
  const radial = (k: number, stops: [number, string][], escalaY = 1) => {
    const x = (k % 4) * t + t / 2, y = Math.floor(k / 4) * t + t / 2;
    const gr = g.createRadialGradient(x, y, 0, x, y, t / 2);
    for (const [p, col] of stops) gr.addColorStop(p, col);
    g.save();
    g.translate(x, y);
    g.scale(1, escalaY);
    g.translate(-x, -y);
    g.fillStyle = gr;
    g.fillRect((k % 4) * t, Math.floor(k / 4) * t, t, t);
    g.restore();
  };
  // Brasa: punto caliente
  radial(CUADRO.BRASA, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.8)'], [0.6, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']]);
  // Chispa: estirada
  radial(CUADRO.CHISPA, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']], 0.25);
  // Humo y polvo: nubes con grumos
  for (const k of [CUADRO.HUMO, CUADRO.POLVO, CUADRO.NIEBLA]) {
    const x0 = (k % 4) * t, y0 = Math.floor(k / 4) * t;
    for (let b = 0; b < (k === CUADRO.NIEBLA ? 9 : 6); b++) {
      const x = x0 + t / 2 + Math.cos(b * 2.3) * t * 0.16, y = y0 + t / 2 + Math.sin(b * 1.7) * t * 0.14;
      const gr = g.createRadialGradient(x, y, 0, x, y, t * 0.3);
      gr.addColorStop(0, `rgba(255,255,255,${k === CUADRO.POLVO ? 0.35 : 0.22})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(x0, y0, t, t);
    }
  }
  // Alma: núcleo y halo
  radial(CUADRO.ALMA, [[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,0.95)'], [0.4, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
  // Sangre: gota opaca de bordes duros
  radial(CUADRO.SANGRE, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,0.95)'], [0.75, 'rgba(255,255,255,0)']]);
  // Luz: halo muy suave
  radial(CUADRO.LUZ, [[0, 'rgba(255,255,255,0.7)'], [0.4, 'rgba(255,255,255,0.2)'], [1, 'rgba(255,255,255,0)']]);
  atlas = new THREE.CanvasTexture(c);
  atlas.colorSpace = THREE.SRGBColorSpace;
  return atlas;
}

let anillo: THREE.Texture | null = null;
/** Un anillo suave (para auras, ondas y círculos de peligro). */
export function texturaAnillo(): THREE.Texture {
  if (anillo) return anillo;
  const n = 128;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.72, 'rgba(255,255,255,0.08)');
  gr.addColorStop(0.9, 'rgba(255,255,255,0.9)');
  gr.addColorStop(0.97, 'rgba(255,255,255,0.4)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, n, n);
  anillo = new THREE.CanvasTexture(c);
  return anillo;
}
