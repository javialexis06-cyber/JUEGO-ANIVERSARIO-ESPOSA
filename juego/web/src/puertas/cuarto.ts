// Los escenarios de cada capítulo: la pared del fondo con el hueco de la puerta, piso, paredes, techo, luz y
// la decoración fija. Lo propio de cada acertijo lo pone el acertijo.
import * as THREE from 'three';
import type { Luces } from './escena';
import { caja, cilindro, en, esfera, grupo, letrero, lienzo, mat, matNuevo, plano, toro } from './kit';
import { HUECO, OpPuerta, shade, TipoPuerta } from './puerta';

/** Medidas del cuarto: pared del fondo en z = 0, paredes laterales en x = ±ANCHO/2. */
export const CUARTO = { ancho: 7.8, alto: 3.2, fondo: 6.5, grueso: 0.25 };

export interface Tema {
  capitulo: number;
  luces: Luces;
  puerta: TipoPuerta;
  opPuerta?: OpPuerta;
  armar(g: THREE.Group): void;
}

/** Textura de tablas de madera. */
function tablas(c1: string, c2: string, junta = '#8a5e40', n = 8) {
  const t = lienzo(512, 512, (c, w, h) => {
    const alto = h / n;
    for (let i = 0; i < n; i++) {
      const g = c.createLinearGradient(0, i * alto, w, i * alto + alto);
      const a = i % 2 ? c1 : c2;
      g.addColorStop(0, a);
      g.addColorStop(1, shade(a, -0.03));
      c.fillStyle = g;
      c.fillRect(0, i * alto, w, alto);
      c.fillStyle = junta;
      c.fillRect(0, i * alto, w, 3);
      const corte = ((i * 197) % 400) + 40;
      c.fillRect(corte, i * alto, 3, alto);
      // vetas suaves
      c.globalAlpha = 0.12;
      for (let k = 0; k < 5; k++) {
        c.fillRect(0, i * alto + 8 + k * (alto / 5), w, 1.5);
      }
      c.globalAlpha = 1;
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Textura de baldosas. */
export function baldosas(c1: string, c2: string, junta = '#ffffff', n = 4) {
  const t = lienzo(512, 512, (c, w, h) => {
    const l = w / n;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        c.fillStyle = (i + j) % 2 ? c1 : c2;
        c.fillRect(i * l, j * l, l, l);
      }
    c.fillStyle = junta;
    for (let k = 0; k <= n; k++) {
      c.fillRect(k * l - 2, 0, 4, h);
      c.fillRect(0, k * l - 2, w, 4);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function piso(g: THREE.Group, tex: THREE.Texture | string, repetir = 3, ancho = CUARTO.ancho + 0.4) {
  const m = typeof tex === 'string' ? mat(tex) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
  if (typeof tex !== 'string') {
    tex.repeat.set(repetir * (ancho / CUARTO.fondo), repetir);
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  const p = plano(ancho, CUARTO.fondo, m, 'piso');
  p.rotation.x = -Math.PI / 2;
  en(p, 0, 0, CUARTO.fondo / 2);
  p.receiveShadow = true;
  g.add(p);
}

/** Pared del fondo con el hueco de la puerta (tres bloques) y su zócalo. */
function paredFondo(g: THREE.Group, color: string, abajo?: string, altoAbajo = 0.95) {
  const W = CUARTO.ancho, H = CUARTO.alto, e = CUARTO.grueso;
  const lado = (W - HUECO.w) / 2;
  const m = mat(color, { rough: 0.92 });
  for (const s of [-1, 1]) g.add(en(caja(lado, H, e, m, 0), s * (HUECO.w / 2 + lado / 2), H / 2, -e / 2));
  g.add(en(caja(HUECO.w, H - HUECO.h, e, m, 0), 0, HUECO.h + (H - HUECO.h) / 2, -e / 2));
  if (abajo) {
    const mb = mat(abajo, { rough: 0.9 });
    for (const s of [-1, 1]) {
      g.add(en(caja(lado, altoAbajo, 0.03, mb, 0.005), s * (HUECO.w / 2 + lado / 2), altoAbajo / 2, 0.015));
      g.add(en(caja(lado, 0.05, 0.05, mat('#fff8ee'), 0.01), s * (HUECO.w / 2 + lado / 2), altoAbajo, 0.03));
    }
  }
  for (const s of [-1, 1]) g.add(en(caja(lado, 0.12, 0.04, mat('#fff8ee'), 0.01), s * (HUECO.w / 2 + lado / 2), 0.06, 0.05));
}

function paredesLado(g: THREE.Group, color: string, abajo?: string, altoAbajo = 0.95) {
  const H = CUARTO.alto, F = CUARTO.fondo;
  for (const s of [-1, 1]) {
    const p = en(caja(0.2, H, F, mat(color, { rough: 0.92 }), 0), s * (CUARTO.ancho / 2 + 0.1), H / 2, F / 2);
    p.castShadow = false;
    g.add(p);
    if (abajo) g.add(en(caja(0.03, altoAbajo, F, mat(abajo, { rough: 0.9 }), 0.005), s * (CUARTO.ancho / 2 - 0.015), altoAbajo / 2, F / 2));
    g.add(en(caja(0.04, 0.12, F, mat('#fff8ee'), 0.01), s * (CUARTO.ancho / 2 - 0.02), 0.06, F / 2));
  }
}

function techo(g: THREE.Group, color: string) {
  const t = plano(CUARTO.ancho + 0.4, CUARTO.fondo, mat(color, { rough: 0.95 }), 'techo');
  t.rotation.x = Math.PI / 2;
  en(t, 0, CUARTO.alto, CUARTO.fondo / 2);
  g.add(t);
}

/** Ventana en la pared izquierda con un paisaje pintado. */
function ventanaLado(g: THREE.Group, paisaje: THREE.Texture, z = 2.6, cortina = '#f4b6c2') {
  const x = -CUARTO.ancho / 2 + 0.02;
  const vista = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), new THREE.MeshBasicMaterial({ map: paisaje }));
  vista.rotation.y = Math.PI / 2;
  en(vista, x + 0.01, 1.75, z);
  g.add(vista);
  const m = mat('#fff8ee');
  g.add(en(caja(0.08, 0.08, 1.7, m, 0.02), x + 0.04, 2.38, z), en(caja(0.08, 0.08, 1.7, m, 0.02), x + 0.04, 1.12, z));
  g.add(en(caja(0.08, 1.34, 0.08, m, 0.02), x + 0.04, 1.75, z - 0.8), en(caja(0.08, 1.34, 0.08, m, 0.02), x + 0.04, 1.75, z + 0.8));
  g.add(en(caja(0.06, 1.26, 0.04, m, 0.01), x + 0.04, 1.75, z));
  for (const s of [-1, 1]) {
    const c = caja(0.1, 1.9, 0.35, mat(cortina), 0.05);
    en(c, x + 0.12, 1.65, z + s * 1.0);
    g.add(c);
  }
  g.add(en(cilindro(0.025, 0.025, 2.6, mat('#d9b25a', { metal: 0.6, rough: 0.3 })), x + 0.14, 2.62, z));
  (g.children[g.children.length - 1] as THREE.Mesh).rotation.x = Math.PI / 2;
}

function cieloNoche() {
  return lienzo(256, 204, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#141a3c');
    gr.addColorStop(1, '#3c3f78');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff6d8';
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % w, y = (i * 53) % (h * 0.8);
      c.globalAlpha = 0.5 + ((i * 13) % 5) / 10;
      c.fillRect(x, y, 2, 2);
    }
    c.globalAlpha = 1;
    c.beginPath();
    c.arc(w * 0.72, h * 0.3, 22, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#2a2f5e';
    c.beginPath();
    c.arc(w * 0.68, h * 0.27, 20, 0, Math.PI * 2);
    c.fill();
    // techos de enfrente
    c.fillStyle = '#1b1d33';
    c.fillRect(0, h * 0.78, w, h);
    for (let i = 0; i < 6; i++) c.fillRect(i * 48, h * (0.62 + (i % 3) * 0.05), 36, h);
    c.fillStyle = '#f6cf5a';
    for (let i = 0; i < 6; i++) c.fillRect(i * 48 + 12, h * (0.7 + (i % 3) * 0.05), 7, 8);
  });
}

/** Lámpara colgante que da la luz cálida. */
function lamparaTecho(g: THREE.Group, x: number, z: number, color = '#f6cf5a') {
  const cable = cilindro(0.01, 0.01, 0.6, mat('#3d2b27'));
  en(cable, x, CUARTO.alto - 0.3, z);
  const pantalla = cilindro(0.12, 0.32, 0.28, mat('#fff3e0'), 'lampara techo');
  en(pantalla, x, CUARTO.alto - 0.72, z);
  const foco = esfera(0.08, matNuevo(color, { emisivo: color, intensidad: 2.5 }));
  en(foco, x, CUARTO.alto - 0.84, z);
  const luz = new THREE.PointLight('#ffd9a8', 6, 7, 1.6);
  en(luz, x, CUARTO.alto - 0.95, z);
  g.add(cable, pantalla, foco, luz);
}

function tapete(g: THREE.Group, color: string, x = 0, z = 2.2, r = 1.2) {
  const t = cilindro(r, r, 0.02, mat(color, { rough: 1 }), 'tapete redondo', 40);
  t.scale.z = 0.7;
  en(t, x, 0.01, z);
  t.castShadow = false;
  g.add(t);
  const borde = toro(r, 0.025, mat(shade(color, -0.1)));
  borde.rotation.x = Math.PI / 2;
  borde.scale.y = 0.7;
  en(borde, x, 0.02, z);
  g.add(borde);
}


// ---------------------------------------------------------------------------
// Afuera: pasto, setos, cielo
// ---------------------------------------------------------------------------
export function pastoTextura(c1 = '#8fca6a', c2 = '#6fb24f') {
  const t = lienzo(512, 512, (c, w, h) => {
    c.fillStyle = c1;
    c.fillRect(0, 0, w, h);
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2600; i++) {
      c.strokeStyle = r() > 0.5 ? c2 : shade(c1, 0.06);
      c.lineWidth = 2;
      const x = r() * w, y = r() * h;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (r() - 0.5) * 6, y - 6 - r() * 8);
      c.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Seto con bultos (hojas) y florecitas. */
function seto(w: number, h: number, d: number, color = '#5f9e4f', flores = true) {
  const g = grupo('seto');
  const m = mat(color, { rough: 1 });
  g.add(en(caja(w, h, d, m, Math.min(0.25, d / 2 - 0.01)), 0, h / 2, 0));
  let s = Math.round(w * 100 + h * 10);
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const n = Math.round(w * h * 3);
  for (let i = 0; i < n; i++) {
    const b = esfera(0.18 + r() * 0.12, mat(shade(color, (r() - 0.5) * 0.08), { rough: 1 }), undefined, 10);
    en(b, (r() - 0.5) * w * 0.95, 0.15 + r() * (h - 0.2), d / 2 - 0.05);
    b.castShadow = false;
    g.add(b);
    if (flores && r() > 0.7) {
      const f = esfera(0.04, mat(['#F59FC0', '#ffffff', '#F7C948'][i % 3]), undefined, 8);
      en(f, b.position.x, b.position.y + 0.08, d / 2 + 0.14);
      g.add(f);
    }
  }
  return g;
}

export function cieloDia(arriba = '#8fcff2', abajo = '#dff2fb', nubes = true) {
  return lienzo(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, arriba);
    g.addColorStop(1, abajo);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    if (!nubes) return;
    c.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [x, y, r] of [[80, 60, 26], [110, 55, 34], [140, 64, 24], [360, 90, 22], [390, 82, 30], [420, 92, 20], [250, 40, 18], [270, 36, 24]]) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
  });
}

/** Telón de fondo (cielo, mar, montañas) detrás de la pared del fondo. */
function telon(g: THREE.Group, tex: THREE.Texture, y = 3.5, z = -4) {
  const t = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
  en(t, 0, y, z);
  g.add(t);
}

function cantero(g: THREE.Group, x: number, z: number, ancho: number, colores = ['#F59FC0', '#F7C948', '#ffffff', '#c9b6ea']) {
  const tierra = caja(ancho, 0.12, 0.5, mat('#8a5e40', { rough: 1 }), 0.05);
  en(tierra, x, 0.06, z);
  g.add(tierra);
  const n = Math.round(ancho * 5);
  for (let i = 0; i < n; i++) {
    const fx = x - ancho / 2 + 0.1 + (i * (ancho - 0.2)) / Math.max(1, n - 1);
    const tallo = cilindro(0.01, 0.01, 0.25, mat('#4f8a55'));
    en(tallo, fx, 0.25, z + ((i % 2) - 0.5) * 0.18);
    const flor = esfera(0.06, mat(colores[i % colores.length]), undefined, 10);
    en(flor, fx, 0.4, tallo.position.z);
    g.add(tallo, flor);
  }
}

// ---------------------------------------------------------------------------
// Los diez escenarios
// ---------------------------------------------------------------------------
const noche: Luces = {
  fondo: '#1d2340', ambiente: '#a07a66', intensidadAmbiente: 0.75, sol: '#ffe2c0', intensidadSol: 1.35, solDesde: [2.5, 6, 5.5], entorno: 0.42,
};

export const TEMAS: Record<number, Tema> = {
  2: {
    capitulo: 2,
    luces: { fondo: '#9fd6f2', ambiente: '#7fa35a', intensidadAmbiente: 1.0, sol: '#fff4dc', intensidadSol: 2.3, solDesde: [4, 8, 6], entorno: 0.55, exposicion: 1.25 },
    puerta: 'reja',
    armar(g) {
      telon(g, cieloDia(), 4.2, -5);
      // Pared de seto con el hueco de la reja
      const W = CUARTO.ancho, lado = (W - HUECO.w) / 2 - 0.1 + 1.6;
      for (const sx of [-1, 1]) {
        const s = seto(lado, 2.9, 0.7);
        en(s, sx * (HUECO.w / 2 + 0.1 + lado / 2), 0, -0.35);
        g.add(s);
        // Setos bajitos a los lados: el jardín se ve abierto
        const sl = seto(CUARTO.fondo, 1.0, 0.6, '#5a984a', false);
        sl.rotation.y = -sx * Math.PI / 2;
        en(sl, sx * (W / 2 + 0.6), 0, CUARTO.fondo / 2);
        g.add(sl);
      }
      const arriba = seto(HUECO.w + 0.3, 0.45, 0.7, '#5f9e4f', false);
      en(arriba, 0, 2.62, -0.35);
      g.add(arriba);
      piso(g, pastoTextura(), 3, 16);
      cantero(g, -2.3, 0.45, 1.6);
      cantero(g, 2.4, 0.45, 1.4, ['#e4574b', '#F7C948', '#ffffff']);
      // Camino de piedras hasta la reja
      for (let i = 0; i < 5; i++) {
        const p = cilindro(0.22, 0.24, 0.05, mat('#cfc6ba', { rough: 1 }), undefined, 14);
        p.scale.z = 0.7;
        en(p, (i % 2 ? 0.12 : -0.1), 0.02, 0.5 + i * 0.6);
        g.add(p);
      }
    },
  },
  1: {
    capitulo: 1,
    luces: noche,
    puerta: 'madera',
    armar(g) {
      paredFondo(g, '#f3dcd4', '#e7c2b8');
      paredesLado(g, '#efd5cc', '#e2bcb2');
      piso(g, tablas('#cf9d70', '#c38f63'), 2.5);
      techo(g, '#fbf1e6');
      ventanaLado(g, cieloNoche());
      lamparaTecho(g, 0, 1.6);
      tapete(g, '#e8b4b8', 0.4, 2.3, 1.3);
      // Un corazón pintado sobre la puerta (la casa de los dos)
      const c = letrero(0.5, 0.42, (cx, w, h) => {
        cx.fillStyle = '#e4574b';
        cx.font = `700 ${h * 0.8}px sans-serif`;
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillText('♥', w / 2, h / 2 + 4);
      }, 'corazon puerta', { transparente: true });
      en(c, 0, 2.75, 0.02);
      g.add(c);
    },
  },
};

/** Escenario provisional para capítulos aún sin decorar (mismo cuarto con otros colores). */
export function tema(capitulo: number): Tema {
  const t = TEMAS[capitulo];
  if (t) return t;
  const colores = ['#dfe9d6', '#f1e4cf', '#dde6ee', '#f6e6c8', '#cfd8cf', '#f2d6e6', '#d9d2c8', '#cdd6e6', '#f6e3d0'];
  const c = colores[(capitulo - 2) % colores.length];
  const tipos: TipoPuerta[] = ['reja', 'vidrio', 'corrediza', 'bambu', 'tronco', 'carpa', 'rastrillo', 'iris', 'corazon'];
  return {
    capitulo,
    luces: { ...noche, fondo: '#c7c1ba', intensidadSol: 1.6 },
    puerta: tipos[(capitulo - 2) % tipos.length],
    armar(g) {
      paredFondo(g, c, shade(c, -0.06));
      paredesLado(g, shade(c, -0.02));
      piso(g, tablas('#cf9d70', '#c38f63'), 2.5);
      techo(g, '#fbf1e6');
      lamparaTecho(g, 0, 1.6);
    },
  };
}
