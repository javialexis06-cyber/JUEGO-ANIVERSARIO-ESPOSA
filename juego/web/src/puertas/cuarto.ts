// Los escenarios de cada capítulo: la pared del fondo con el hueco de la puerta, piso, paredes, techo, luz y
// la decoración fija. Lo propio de cada acertijo lo pone el acertijo.
import * as THREE from 'three';
import type { Luces } from './escena';
import { caja, cilindro, en, esfera, grupo, letrero, lienzo, mat, matNuevo, plano, toro } from './kit';
import { HUECO, OpPuerta, shade, TipoPuerta } from './puerta';
import { DIBUJOS } from './ui';

/** Medidas del cuarto: pared del fondo en z = 0, paredes laterales en x = ±ANCHO/2. */
export const CUARTO = { ancho: 7.8, alto: 3.2, fondo: 6.5, grueso: 0.25 };
/** Dónde cuelga la lámpara de la casa (a un lado: nada cuelga delante de la puerta). */
export const LAMPARA = { x: -1.2, z: 1.0 };

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
  t.name = 'telon';
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
// Playa: arena, mar, cabaña y palmeras
// ---------------------------------------------------------------------------
export function arenaTextura() {
  const t = lienzo(512, 512, (c, w, h) => {
    c.fillStyle = '#f1d9a8';
    c.fillRect(0, 0, w, h);
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 5000; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(200,160,100,0.35)' : 'rgba(255,245,220,0.5)';
      c.fillRect(r() * w, r() * h, 2, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function cieloPlaya(atardecer = 0) {
  return lienzo(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, atardecer ? '#6a5aa8' : '#6fc3ee');
    g.addColorStop(0.55, atardecer ? '#f59f7a' : '#bfe6f7');
    g.addColorStop(0.62, atardecer ? '#ffd27a' : '#e8f6fb');
    g.addColorStop(0.63, atardecer ? '#3d6a9c' : '#3b8fc4');
    g.addColorStop(1, atardecer ? '#2a4a78' : '#5fb0dc');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [x, y, r] of [[90, 50, 18], [112, 46, 24], [134, 52, 16], [390, 70, 16], [410, 64, 22]]) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
  });
}

/** Palmera sencilla: tronco curvo y hojas. */
export function palmera(alto = 3.2, inclina = 0.4) {
  const g = grupo('palmera');
  const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(inclina * 0.3, alto * 0.5, 0), new THREE.Vector3(inclina, alto, 0));
  const tronco = new THREE.Mesh(new THREE.TubeGeometry(curva, 16, 0.12, 10), mat('#a5713f'));
  tronco.castShadow = true;
  g.add(tronco);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const hoja = esfera(0.5, mat(i % 2 ? '#4f9a4f' : '#5fae5a'), undefined, 10);
    hoja.scale.set(1.4, 0.12, 0.35);
    hoja.rotation.y = a;
    hoja.rotation.z = -0.35;
    hoja.position.set(inclina + Math.cos(a) * 0.55, alto - 0.12, -Math.sin(a) * 0.55);
    hoja.castShadow = true;
    g.add(hoja);
  }
  for (let i = 0; i < 3; i++) g.add(en(esfera(0.1, mat('#6b4a33'), undefined, 10), inclina + (i - 1) * 0.12, alto - 0.18, 0.08));
  return g;
}


// ---------------------------------------------------------------------------
// Bosque de noche
// ---------------------------------------------------------------------------
export function cieloNocheBosque() {
  return lienzo(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1030');
    g.addColorStop(1, '#2b3570');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    let s = 17;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 160; i++) {
      c.fillStyle = `rgba(255,248,220,${0.4 + r() * 0.6})`;
      c.fillRect(r() * w, r() * h * 0.8, r() > 0.9 ? 3 : 2, r() > 0.9 ? 3 : 2);
    }
    c.fillStyle = '#fff6d8';
    c.beginPath();
    c.arc(w * 0.78, h * 0.25, 22, 0, Math.PI * 2);
    c.fill();
  });
}

/** Árbol de bosque: tronco y copa de bolas oscuras. */
export function arbolBosque(alto = 3.6, r = 0.25, verde = '#2f5a3c') {
  const g = grupo('arbol');
  g.add(en(cilindro(r * 0.8, r, alto * 0.6, mat('#5e3d28')), 0, alto * 0.3, 0));
  for (const [x, y, z, rr] of [[0, 0.75, 0, 0.9], [-0.5, 0.62, 0.1, 0.6], [0.5, 0.65, -0.1, 0.65], [0, 0.95, 0, 0.6]] as [number, number, number, number][]) {
    g.add(en(esfera(rr, mat(shade(verde, (x + z) * 0.05), { rough: 1 }), undefined, 12), x, alto * y, z));
  }
  return g;
}

/** Luciérnagas que flotan solas (se animan al dibujarse). */
function luciernagas(g: THREE.Group, n = 24) {
  const m = new THREE.MeshBasicMaterial({ color: '#e8ff7a' });
  const puntos: { o: THREE.Mesh; x: number; y: number; z: number; f: number }[] = [];
  for (let i = 0; i < n; i++) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), m);
    // (nunca delante de la puerta)
    const p = { o, x: (i % 2 ? -1 : 1) * (1.1 + ((i * 0.37) % 1) * 2.5), y: 0.5 + ((i * 0.61) % 1) * 2.2, z: -0.5 + ((i * 0.83) % 1) * 2.2, f: i * 1.7 };
    o.position.set(p.x, p.y, p.z);
    puntos.push(p);
    g.add(o);
  }
  puntos[0].o.onBeforeRender = () => {
    const t = performance.now() / 1000;
    for (const p of puntos) {
      p.o.position.set(p.x + Math.sin(t * 0.5 + p.f) * 0.3, p.y + Math.sin(t * 0.7 + p.f * 2) * 0.2, p.z + Math.cos(t * 0.4 + p.f) * 0.2);
      p.o.scale.setScalar(0.6 + 0.4 * Math.max(0, Math.sin(t * 2 + p.f * 3)));
    }
  };
}


// ---------------------------------------------------------------------------
// Feria
// ---------------------------------------------------------------------------
function cieloFeria() {
  return lienzo(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3b2f6c');
    g.addColorStop(0.6, '#c9709a');
    g.addColorStop(1, '#f6b47a');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,248,220,0.8)';
    for (let i = 0; i < 40; i++) c.fillRect((i * 97) % w, (i * 41) % (h * 0.45), 2, 2);
  });
}

/** Guirnalda de bombillos entre dos puntos. */
export function bombillos(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, n = 10, caida = 0.3) {
  const colores = ['#ffd27a', '#ff8fa3', '#8ee0ff', '#b6f07a'];
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push(new THREE.Vector3().lerpVectors(a, b, t).add(new THREE.Vector3(0, -Math.sin(t * Math.PI) * caida, 0)));
  }
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.008, 5), mat('#3d2b27'));
  g.add(cable);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const p = new THREE.Vector3().lerpVectors(a, b, t).add(new THREE.Vector3(0, -Math.sin(t * Math.PI) * caida - 0.05, 0));
    g.add(en(esfera(0.045, new THREE.MeshBasicMaterial({ color: colores[i % colores.length] }), undefined, 8), p.x, p.y, p.z));
  }
}

function ruedaFortunaFondo(g: THREE.Group, x: number, z: number, r = 2.4) {
  const rueda = grupo('rueda fondo');
  const blanco = mat('#fff3e0');
  rueda.add(toro(r, 0.05, blanco));
  rueda.add(toro(r * 0.2, 0.05, blanco));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const rayo = caja(0.04, r, 0.04, blanco, 0.01);
    rayo.position.set(Math.cos(a) * r / 2, Math.sin(a) * r / 2, 0);
    rayo.rotation.z = a - Math.PI / 2;
    rueda.add(rayo);
    const cab = caja(0.3, 0.3, 0.3, mat(['#e4574b', '#F7C948', '#8EC5F0', '#8FD6B9', '#F59FC0'][i % 5]), 0.08);
    cab.position.set(Math.cos(a) * r, Math.sin(a) * r - 0.2, 0);
    rueda.add(cab);
  }
  en(rueda, x, r + 0.6, z);
  g.add(rueda);
  for (const s of [-1, 1]) {
    const pata = caja(0.1, r + 0.8, 0.1, mat('#b8bcc4'), 0.02);
    pata.rotation.z = s * 0.25;
    en(pata, x + s * 0.4, (r + 0.8) / 2, z - 0.1);
    g.add(pata);
  }
  (rueda.children[0] as THREE.Mesh).onBeforeRender = () => {
    rueda.rotation.z = performance.now() / 9000;
    for (const cab of rueda.children.filter((o, i) => i >= 2 && i % 2 === 1)) cab.rotation.z = -rueda.rotation.z;
  };
}


// ---------------------------------------------------------------------------
// Castillo
// ---------------------------------------------------------------------------
/** Piedras del muro (con juntas y tonos distintos). */
export function piedraTextura(base = '#b9b2ab', w = 512, h = 512, filas = 8) {
  return lienzo(w, h, (c) => {
    c.fillStyle = '#7d746c';
    c.fillRect(0, 0, w, h);
    const alto = h / filas;
    let semilla = 7;
    const r = () => ((semilla = (semilla * 16807) % 2147483647) - 1) / 2147483646;
    for (let f = 0; f < filas; f++) {
      let x = f % 2 ? -alto * 0.7 : 0;
      while (x < w) {
        const ancho = alto * (1.3 + r() * 0.9);
        const k = 0.86 + r() * 0.22;
        const col = new THREE.Color(base).multiplyScalar(k);
        c.fillStyle = `#${col.getHexString()}`;
        c.beginPath();
        c.roundRect(x + 3, f * alto + 3, ancho - 6, alto - 6, 8);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.08)';
        c.fillRect(x + 6, f * alto + 5, ancho - 14, 4);
        x += ancho;
      }
    }
  });
}

function muroPiedra(g: THREE.Group) {
  const W = CUARTO.ancho, H = CUARTO.alto, e = CUARTO.grueso, F = CUARTO.fondo;
  const lado = (W - HUECO.w) / 2;
  const tex = (ancho: number, alto: number) => {
    const t = piedraTextura();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(ancho / 1.6, alto / 1.6);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
  };
  for (const s of [-1, 1]) g.add(en(new THREE.Mesh(new THREE.BoxGeometry(lado, H, e), tex(lado, H)), s * (HUECO.w / 2 + lado / 2), H / 2, -e / 2));
  g.add(en(new THREE.Mesh(new THREE.BoxGeometry(HUECO.w, H - HUECO.h, e), tex(HUECO.w, H - HUECO.h)), 0, HUECO.h + (H - HUECO.h) / 2, -e / 2));
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, H, F), tex(F, H));
    en(p, s * (W / 2 + 0.1), H / 2, F / 2);
    g.add(p);
  }
}

/** Antorcha en la pared con llama que titila. */
function antorcha(g: THREE.Group, x: number, y: number, z = 0.05) {
  const a = grupo('antorcha');
  const soporte = cilindro(0.035, 0.05, 0.32, mat('#4a3a30'));
  soporte.rotation.x = 0.5;
  en(soporte, 0, 0, 0.1);
  const copa = cilindro(0.08, 0.05, 0.1, mat('#3d2b27', { metal: 0.4 }));
  en(copa, 0, 0.13, 0.17);
  const llama = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.2, 10), new THREE.MeshBasicMaterial({ color: '#ffb23f' }));
  en(llama, 0, 0.27, 0.17);
  const centro = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 8), new THREE.MeshBasicMaterial({ color: '#fff1a8' }));
  en(centro, 0, 0.24, 0.17);
  const luz = new THREE.PointLight('#ffb46a', 2.4, 5, 1.6);
  en(luz, 0, 0.35, 0.35);
  a.add(soporte, copa, llama, centro, luz);
  llama.onBeforeRender = () => {
    const t = performance.now() / 1000 + x;
    const k = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
    llama.scale.set(1, k, 1);
    luz.intensity = 2.2 * k;
  };
  en(a, x, y, z);
  g.add(a);
}

/** Estandarte colgado con el escudo de un corazón. */
function estandarte(g: THREE.Group, x: number, color = '#b83a52') {
  const e = letrero(0.62, 1.1, (c, w, h) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(w, 0);
    c.lineTo(w, h * 0.86);
    c.lineTo(w / 2, h);
    c.lineTo(0, h * 0.86);
    c.fill();
    c.strokeStyle = '#f2c75c';
    c.lineWidth = 10;
    c.strokeRect(14, 14, w - 28, h * 0.8);
    c.fillStyle = '#f2c75c';
    c.font = `700 ${w * 0.5}px sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('♥', w / 2, h * 0.44);
  }, 'estandarte', { transparente: true });
  en(e, x, 2.35, 0.03);
  g.add(e);
  const barra = cilindro(0.02, 0.02, 0.72, mat('#d9b25a', { metal: 0.6, rough: 0.3 }));
  barra.rotation.z = Math.PI / 2;
  g.add(en(barra, x, 2.92, 0.05));
}

export function cieloCastillo() {
  return lienzo(256, 204, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#1b1f45');
    gr.addColorStop(1, '#5b4a86');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff6d0';
    c.beginPath();
    c.arc(w * 0.7, h * 0.3, 20, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 30; i++) c.fillRect((i * 67) % w, (i * 29) % (h * 0.6), 2, 2);
    c.fillStyle = '#2b2346';
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) c.lineTo(x, h * (0.72 + ((x / 32) % 2) * 0.05));
    c.lineTo(w, h);
    c.fill();
  });
}


// ---------------------------------------------------------------------------
// Nave
// ---------------------------------------------------------------------------
/** Paneles metálicos con tornillos y juntas. */
export function panelesTextura(base = '#c9d3dd', w = 512, h = 512) {
  return lienzo(w, h, (c) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    const n = 2;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = (i * w) / n, y = (j * h) / n;
        const gr = c.createLinearGradient(x, y, x + w / n, y + h / n);
        gr.addColorStop(0, 'rgba(255,255,255,0.18)');
        gr.addColorStop(1, 'rgba(0,0,0,0.08)');
        c.fillStyle = gr;
        c.fillRect(x + 4, y + 4, w / n - 8, h / n - 8);
        c.strokeStyle = 'rgba(40,50,70,0.35)';
        c.lineWidth = 4;
        c.strokeRect(x + 2, y + 2, w / n - 4, h / n - 4);
        c.fillStyle = 'rgba(40,50,70,0.45)';
        for (const [a, b] of [[14, 14], [w / n - 14, 14], [14, h / n - 14], [w / n - 14, h / n - 14]]) {
          c.beginPath();
          c.arc(x + a, y + b, 5, 0, Math.PI * 2);
          c.fill();
        }
      }
  });
}

export function espacioTextura(w = 512, h = 512, nebulosa = true) {
  return lienzo(w, h, (c) => {
    c.fillStyle = '#070a1f';
    c.fillRect(0, 0, w, h);
    if (nebulosa) {
      for (const [x, y, r, col] of [[0.3, 0.4, 0.45, 'rgba(180,90,200,0.35)'], [0.7, 0.6, 0.4, 'rgba(70,120,230,0.35)'], [0.55, 0.3, 0.25, 'rgba(240,140,180,0.25)']] as [number, number, number, string][]) {
        const g = c.createRadialGradient(x * w, y * h, 1, x * w, y * h, r * w);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }
    }
    for (let i = 0; i < 260; i++) {
      const x = (i * 197.3) % w, y = (i * 83.7 + i * i * 0.37) % h;
      const r = i % 17 === 0 ? 2.2 : i % 5 === 0 ? 1.4 : 0.8;
      c.fillStyle = i % 9 === 0 ? '#ffe9b0' : '#ffffff';
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
  });
}

function muroNave(g: THREE.Group) {
  const W = CUARTO.ancho, H = CUARTO.alto, e = CUARTO.grueso, F = CUARTO.fondo;
  const lado = (W - HUECO.w) / 2;
  const tex = (ancho: number, alto: number) => {
    const t = panelesTextura();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(ancho / 1.2, alto / 1.2);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.35 });
  };
  for (const s of [-1, 1]) g.add(en(new THREE.Mesh(new THREE.BoxGeometry(lado, H, e), tex(lado, H)), s * (HUECO.w / 2 + lado / 2), H / 2, -e / 2));
  g.add(en(new THREE.Mesh(new THREE.BoxGeometry(HUECO.w, H - HUECO.h, e), tex(HUECO.w, H - HUECO.h)), 0, HUECO.h + (H - HUECO.h) / 2, -e / 2));
  for (const s of [-1, 1]) g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.2, H, F), tex(F, H)), s * (W / 2 + 0.1), H / 2, F / 2));
}

/** Ventanilla redonda con el espacio (y un planeta) detrás. */
function ventanilla(g: THREE.Group, x: number, y: number, r = 0.55) {
  const vista = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ map: espacioTextura() }));
  en(vista, x, y, 0.01);
  g.add(vista);
  const planeta = new THREE.Mesh(new THREE.CircleGeometry(r * 0.35, 32), new THREE.MeshBasicMaterial({ map: lienzo(128, 128, (c, w, h) => {
    const gr = c.createRadialGradient(w * 0.35, h * 0.35, 4, w / 2, h / 2, w / 2);
    gr.addColorStop(0, '#ffd1a8');
    gr.addColorStop(0.6, '#e4577a');
    gr.addColorStop(1, '#5b2a5e');
    c.fillStyle = gr;
    c.beginPath();
    c.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    c.fill();
  }), transparent: true }));
  en(planeta, x + r * 0.3, y - r * 0.25, 0.012);
  g.add(planeta);
  g.add(en(toro(r + 0.03, 0.06, mat('#8a94a8', { metal: 0.7, rough: 0.3 })), x, y, 0.03));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(en(esfera(0.018, mat('#5a6478', { metal: 0.6 }), undefined, 8), x + Math.cos(a) * (r + 0.03), y + Math.sin(a) * (r + 0.03), 0.08));
  }
}

/** Lucecitas de tablero que parpadean. */
function lucesTablero(g: THREE.Group, x: number, y: number, n = 6) {
  const colores = ['#5af0a0', '#ffd24a', '#ff6a7a', '#6ac8ff'];
  for (let i = 0; i < n; i++) {
    const m = new THREE.MeshBasicMaterial({ color: colores[i % 4] });
    const l = esfera(0.025, m, undefined, 8);
    en(l, x + i * 0.09, y, 0.03);
    l.onBeforeRender = () => {
      const t = performance.now() / 1000;
      m.color.set(Math.sin(t * (1.5 + i * 0.7) + i) > 0 ? colores[i % 4] : '#2a3040');
    };
    g.add(l);
  }
}


// ---------------------------------------------------------------------------
// Nuestro hogar para siempre
// ---------------------------------------------------------------------------
/** Cuadrito con el dibujo de un recuerdo (el SVG se pinta cuando carga). */
function cuadroRecuerdo(g: THREE.Group, icono: string, x: number, y: number) {
  const t = lienzo(256, 256, (c, w, h) => {
    c.fillStyle = '#fffaf1';
    c.fillRect(0, 0, w, h);
  });
  const img = new Image();
  img.onload = () => {
    const c = (t.image as HTMLCanvasElement).getContext('2d')!;
    c.drawImage(img, 20, 30, 216, 180);
    t.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(DIBUJOS[icono] ?? DIBUJOS.corazon)}`;
  const foto = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  en(foto, x, y, 0.035);
  g.add(foto, en(caja(0.36, 0.36, 0.03, mat('#c49468'), 0.01), x, y, 0.015));
}

// ---------------------------------------------------------------------------
// Los diez escenarios
// ---------------------------------------------------------------------------
const noche: Luces = {
  fondo: '#1d2340', ambiente: '#a07a66', intensidadAmbiente: 0.75, sol: '#ffe2c0', intensidadSol: 1.35, solDesde: [2.5, 6, 5.5], entorno: 0.42,
};

export const TEMAS: Record<number, Tema> = {
  10: {
    capitulo: 10,
    luces: { ...noche, fondo: '#2a1d33', ambiente: '#b08a8a', intensidadAmbiente: 0.85, intensidadSol: 1.35 },
    puerta: 'corazon',
    opPuerta: { color: '#e4574b', marco: '#f6e3d0' },
    armar(g) {
      paredFondo(g, '#f6dbe0', '#ecc2cb');
      paredesLado(g, '#f3d5da', '#e7bcc5');
      piso(g, tablas('#cf9d70', '#c38f63'), 2.5);
      techo(g, '#fbf1e6');
      ventanaLado(g, cieloNoche());
      lamparaTecho(g, LAMPARA.x, LAMPARA.z, '#ffd8e6');
      tapete(g, '#e8b4b8', 0.4, 2.3, 1.3);
      bombillos(g, new THREE.Vector3(-3.6, 3.0, 0.12), new THREE.Vector3(-0.95, 2.85, 0.12), 10, 0.28);
      bombillos(g, new THREE.Vector3(0.95, 2.85, 0.12), new THREE.Vector3(3.6, 3.0, 0.12), 10, 0.28);
      // Los recuerdos recuperados, en cuadritos sobre las paredes
      ['raton', 'calendario', 'videollamada', 'ojos'].forEach((ic, i) => cuadroRecuerdo(g, ic, -1.25 - i * 0.45, 2.35));
      ['ola', 'luces', 'estrellas', 'casa'].forEach((ic, i) => cuadroRecuerdo(g, ic, 1.25 + i * 0.45, 2.35));
      const cor = letrero(0.5, 0.42, (cx, w, h) => {
        cx.fillStyle = '#e4574b';
        cx.font = `700 ${h * 0.8}px sans-serif`;
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillText('♥', w / 2, h / 2 + 4);
      }, undefined, { transparente: true });
      en(cor, 0, 2.95, 0.02);
      g.add(cor);
      const tibia = new THREE.PointLight('#ffb8c8', 1.4, 7, 1.5);
      en(tibia, 0, 2.2, 1.5);
      g.add(tibia);
    },
  },
  9: {
    capitulo: 9,
    luces: { fondo: '#070a1f', ambiente: '#8aa0c8', intensidadAmbiente: 0.85, sol: '#dfe8ff', intensidadSol: 1.25, solDesde: [2, 6, 6], entorno: 0.45, exposicion: 1.25 },
    puerta: 'iris',
    opPuerta: { color: '#8a94a8', marco: '#5a6478' },
    armar(g) {
      muroNave(g);
      const rejilla = lienzo(256, 256, (c, w, h) => {
        c.fillStyle = '#4a5468';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#384052';
        c.lineWidth = 6;
        for (let i = 0; i <= 8; i++) {
          c.beginPath();
          c.moveTo((i * w) / 8, 0);
          c.lineTo((i * w) / 8, h);
          c.moveTo(0, (i * h) / 8);
          c.lineTo(w, (i * h) / 8);
          c.stroke();
        }
      });
      rejilla.wrapS = rejilla.wrapT = THREE.RepeatWrapping;
      piso(g, rejilla, 3);
      techo(g, '#5a6478');
      for (let i = 0; i < 3; i++) {
        const tira = caja(4, 0.04, 0.12, new THREE.MeshBasicMaterial({ color: '#dff0ff' }), 0.01);
        en(tira, 0, CUARTO.alto - 0.03, 1 + i * 1.8);
        g.add(tira);
      }
      // Marco de luz alrededor de la compuerta
      const marco = toro(HUECO.w / 2 + 0.28, 0.035, new THREE.MeshBasicMaterial({ color: '#6ac8ff' }), 'marco de luz');
      en(marco, 0, HUECO.h / 2 + 0.05, 0.08);
      marco.scale.y = 1.45;
      g.add(marco);
      ventanilla(g, -2.25, 1.85, 0.55);
      lucesTablero(g, -1.95, 0.95);
      lucesTablero(g, 2.6, 2.6, 5);
      // Consola baja a la izquierda
      const consola = caja(1.0, 0.8, 0.5, mat('#8a94a8', { metal: 0.5, rough: 0.35 }), 0.05);
      en(consola, -2.3, 0.4, 0.3);
      g.add(consola);
      const pantalla = letrero(0.7, 0.3, (c, w, h) => {
        c.fillStyle = '#0d1a2e';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#5af0a0';
        c.lineWidth = 4;
        c.beginPath();
        for (let x = 0; x < w; x += 4) c.lineTo(x, h / 2 + Math.sin(x / 18) * h * 0.25);
        c.stroke();
      }, undefined, { brillo: 0.9 });
      pantalla.rotation.x = -0.5;
      en(pantalla, -2.3, 0.83, 0.42);
      g.add(pantalla);
      const azul = new THREE.PointLight('#6ac8ff', 1.2, 6, 1.5);
      en(azul, 0, 2.4, 1.2);
      g.add(azul);
    },
  },
  8: {
    capitulo: 8,
    luces: { fondo: '#1b1f45', ambiente: '#6a5a78', intensidadAmbiente: 0.7, sol: '#ffd8a8', intensidadSol: 1.05, solDesde: [2.5, 6, 5.5], entorno: 0.3, exposicion: 1.3 },
    puerta: 'rastrillo',
    opPuerta: { color: '#4a4f58', marco: '#8a8078' },
    armar(g) {
      muroPiedra(g);
      const suelo = piedraTextura('#a39a90', 512, 512, 4);
      suelo.wrapS = suelo.wrapT = THREE.RepeatWrapping;
      piso(g, suelo, 2.2);
      techo(g, '#4a3a30');
      for (let i = 0; i < 5; i++) g.add(en(caja(CUARTO.ancho, 0.16, 0.2, mat('#5e4636'), 0.02), 0, CUARTO.alto - 0.1, 0.6 + i * 1.3));
      // Arco de piedra sobre el hueco
      const arco = new THREE.Mesh(new THREE.TorusGeometry(HUECO.w / 2 + 0.14, 0.12, 8, 20, Math.PI), mat('#9a918a', { rough: 0.95 }));
      en(arco, 0, HUECO.h - 0.02, 0.06);
      g.add(arco);
      for (const s of [-1, 1]) g.add(en(caja(0.24, HUECO.h, 0.16, mat('#9a918a', { rough: 0.95 }), 0.03), s * (HUECO.w / 2 + 0.14), HUECO.h / 2, 0.06));
      antorcha(g, -2.1, 1.75);
      antorcha(g, 2.1, 1.75);
      estandarte(g, -1.25);
      estandarte(g, 1.25, '#3b5ea8');
      ventanaLado(g, cieloCastillo(), 2.6, '#8a2f45');
      // Alfombra roja hacia la puerta
      const alfombra = caja(1.2, 0.02, 2.4, mat('#a8324a', { rough: 1 }), 0.005);
      en(alfombra, 0, 0.01, 1.4);
      g.add(alfombra);
      for (const s of [-1, 1]) g.add(en(caja(0.06, 0.021, 2.4, mat('#f2c75c'), 0.005), s * 0.57, 0.012, 1.4));
    },
  },
  7: {
    capitulo: 7,
    luces: { fondo: '#3b2f6c', ambiente: '#8a6a8a', intensidadAmbiente: 0.85, sol: '#ffd8b0', intensidadSol: 1.7, solDesde: [3, 6, 6], entorno: 0.45, exposicion: 1.35 },
    puerta: 'carpa',
    opPuerta: { color: '#e4574b', marco: '#fff3e0' },
    armar(g) {
      telon(g, cieloFeria(), 3.6, -9);
      const tierra = lienzo(256, 256, (c, w, h) => {
        c.fillStyle = '#c9a57a';
        c.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) {
          c.fillStyle = i % 2 ? 'rgba(150,110,70,0.3)' : 'rgba(255,240,210,0.3)';
          c.fillRect((i * 71) % w, (i * 37) % h, 3, 3);
        }
      });
      tierra.wrapS = tierra.wrapT = THREE.RepeatWrapping;
      piso(g, tierra, 4, 30);
      const fondo = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshStandardMaterial({ map: tierra, roughness: 1 }));
      fondo.rotation.x = -Math.PI / 2;
      en(fondo, 0, -0.002, -6);
      g.add(fondo);
      // Fachada de la carpa a rayas alrededor de la puerta
      const rayas = lienzo(256, 256, (c, w, h) => {
        for (let i = 0; i < 8; i++) {
          c.fillStyle = i % 2 ? '#fff3e0' : '#e4574b';
          c.fillRect((i * w) / 8, 0, w / 8, h);
        }
      });
      rayas.wrapS = THREE.RepeatWrapping;
      for (const sx of [-1, 1]) {
        const ancho = 1.9;
        const m = new THREE.MeshStandardMaterial({ map: rayas.clone(), roughness: 0.9 });
        (m.map as THREE.Texture).repeat.set(ancho, 1);
        (m.map as THREE.Texture).needsUpdate = true;
        const panel = new THREE.Mesh(new THREE.BoxGeometry(ancho, 2.85, 0.1), m);
        en(panel, sx * (HUECO.w / 2 + 0.25 + ancho / 2), 1.425, -0.05);
        panel.castShadow = true;
        g.add(panel);
      }
      const techo = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.5, 16, 1, true), new THREE.MeshStandardMaterial({ map: rayas, roughness: 0.9, side: THREE.DoubleSide }));
      en(techo, 0, 3.55, -1.4);
      g.add(techo);
      g.add(en(esfera(0.1, mat('#F7C948')), 0, 4.35, -1.4));
      bombillos(g, new THREE.Vector3(-3.4, 2.9, 0.1), new THREE.Vector3(-0.7, 2.75, 0.1), 8, 0.25);
      bombillos(g, new THREE.Vector3(0.7, 2.75, 0.1), new THREE.Vector3(3.4, 2.9, 0.1), 8, 0.25);
      ruedaFortunaFondo(g, 5.2, -5.5, 2.6);
      for (const x of [-3.7, 3.7]) {
        g.add(en(cilindro(0.04, 0.05, 2.9, mat('#3d2b27')), x, 1.45, 0.3));
        g.add(en(esfera(0.12, new THREE.MeshBasicMaterial({ color: '#ffe9b0' })), x, 2.95, 0.3));
      }
      const luz = new THREE.PointLight('#ffcf8a', 3, 8, 1.4);
      en(luz, 0, 2.6, 1.5);
      g.add(luz);
    },
  },
  6: {
    capitulo: 6,
    luces: { fondo: '#0e1430', ambiente: '#1f2a4a', intensidadAmbiente: 0.55, sol: '#a8c0ff', intensidadSol: 1.1, solDesde: [-3, 7, 4], entorno: 0.22, exposicion: 1.5 },
    puerta: 'tronco',
    armar(g) {
      telon(g, cieloNocheBosque(), 3.4, -9);
      piso(g, pastoTextura('#35573a', '#27442d'), 3, 30);
      const fondo = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshStandardMaterial({ map: pastoTextura('#35573a', '#27442d'), roughness: 1 }));
      fondo.rotation.x = -Math.PI / 2;
      en(fondo, 0, -0.002, -6);
      g.add(fondo);
      for (const [x, z, a] of [[-3.3, -1.2, 3.8], [3.2, -1.0, 4.2], [-5.0, -3.0, 4.5], [5.2, -3.5, 4.6], [-2.2, -4.5, 4.0], [2.4, -5.0, 4.4], [-0.6, -7.0, 4.8], [4.0, 0.3, 3.6]] as [number, number, number][]) {
        const a1 = arbolBosque(a);
        en(a1, x, 0, z);
        g.add(a1);
      }
      // Hongos que brillan
      for (const [x, z, col] of [[-1.3, 0.3, '#7af0ff'], [-1.05, 0.45, '#f59fc0'], [1.4, 0.2, '#b6f07a'], [2.3, 0.5, '#7af0ff']] as [number, number, string][]) {
        const h = grupo('hongo');
        h.add(en(cilindro(0.03, 0.04, 0.14, mat('#f6f1e6')), 0, 0.07, 0), en(esfera(0.09, matNuevo(col, { emisivo: col, intensidad: 0.8 }), undefined, 12), 0, 0.15, 0));
        (h.children[1] as THREE.Mesh).scale.y = 0.55;
        en(h, x, 0, z);
        g.add(h);
      }
      luciernagas(g);
      const luna = new THREE.PointLight('#9fb4ff', 2.0, 12, 1.2);
      en(luna, 0, 3.0, 2.0);
      g.add(luna);
    },
  },
  5: {
    capitulo: 5,
    luces: { fondo: '#8fcff2', ambiente: '#c9a878', intensidadAmbiente: 1.0, sol: '#fff0d0', intensidadSol: 2.3, solDesde: [-4, 7, 7], entorno: 0.6, exposicion: 1.25 },
    puerta: 'bambu',
    armar(g) {
      telon(g, cieloPlaya(), 3.2, -14);
      // El mar (con olitas) detrás de la cabaña
      const agua = lienzo(256, 256, (c, w, h) => {
        c.fillStyle = '#4aa6d8';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        c.lineWidth = 3;
        for (let i = 0; i < 18; i++) {
          c.beginPath();
          const y = (i * 37) % h, x = (i * 71) % w;
          c.moveTo(x, y);
          c.quadraticCurveTo(x + 14, y - 6, x + 28, y);
          c.stroke();
        }
      });
      agua.wrapS = agua.wrapT = THREE.RepeatWrapping;
      agua.repeat.set(6, 3);
      const mar = new THREE.Mesh(new THREE.PlaneGeometry(40, 13), new THREE.MeshStandardMaterial({ map: agua, roughness: 0.25, metalness: 0.1 }));
      mar.name = 'mar';
      mar.rotation.x = -Math.PI / 2;
      en(mar, 0, 0.01, -7.6);
      g.add(mar);
      const espuma = caja(40, 0.02, 0.25, mat('#ffffff', { rough: 0.6 }), 0.01);
      en(espuma, 0, 0.02, -1.15);
      g.add(espuma);
      piso(g, arenaTextura(), 3, 40);
      const orilla = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.4), new THREE.MeshStandardMaterial({ map: arenaTextura(), roughness: 0.9 }));
      orilla.rotation.x = -Math.PI / 2;
      en(orilla, 0, 0.001, -0.65);
      orilla.receiveShadow = true;
      g.add(orilla);
      // Cabaña de bambú alrededor de la puerta
      const bambu = mat('#d9b77a');
      const anchoCab = 3.4;
      const lado = (anchoCab - HUECO.w) / 2;
      for (const sx of [-1, 1]) {
        for (let i = 0; i < Math.round(lado / 0.13); i++) {
          const x = sx * (HUECO.w / 2 + 0.065 + i * 0.13);
          const t = cilindro(0.065, 0.065, 3.0, i % 3 ? bambu : mat('#c9a25e'));
          en(t, x, 1.5, -0.1);
          g.add(t);
        }
      }
      for (let i = 0; i < Math.round(HUECO.w / 0.13); i++) {
        const t = cilindro(0.065, 0.065, 3.0 - HUECO.h, bambu);
        en(t, -HUECO.w / 2 + 0.065 + i * 0.13, HUECO.h + (3.0 - HUECO.h) / 2, -0.1);
        g.add(t);
      }
      const techo = caja(anchoCab + 1.0, 0.25, 2.2, mat('#c9a15a', { rough: 1 }), 0.1);
      techo.rotation.x = 0.28;
      en(techo, 0, 3.15, -0.6);
      g.add(techo);
      for (const x of [-anchoCab / 2 - 0.35, anchoCab / 2 + 0.35]) {
        const barandal = caja(0.9, 0.08, 0.08, mat('#8a6a3c'), 0.02);
        en(barandal, x + (x < 0 ? 0.2 : -0.2), 0.9, 0.1);
        g.add(barandal);
      }
      const p1 = palmera(3.4, 0.5);
      en(p1, -3.4, 0, -0.4);
      const p2 = palmera(3.0, -0.45);
      en(p2, 4.4, 0, 0.4);
      g.add(p1, p2);
    },
  },
  4: {
    capitulo: 4,
    luces: { fondo: '#c7d3dc', ambiente: '#8a9aa6', intensidadAmbiente: 0.95, sol: '#fff6ea', intensidadSol: 1.6, solDesde: [3, 7, 6], entorno: 0.55 },
    puerta: 'corrediza',
    armar(g) {
      paredFondo(g, '#eef1ea', '#7fbfae', 1.1);
      paredesLado(g, '#e8ece4', '#76b5a4', 1.1);
      piso(g, baldosas('#e4e6e2', '#cfd4d0', '#b8bdb8', 4), 3);
      techo(g, '#f4f6f2');
      // Ventanal con los buses afuera
      const buses = lienzo(512, 200, (cx, w, h) => {
        const gr = cx.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#9fd3f0');
        gr.addColorStop(1, '#e8f4f8');
        cx.fillStyle = gr;
        cx.fillRect(0, 0, w, h);
        cx.fillStyle = '#8a8f96';
        cx.fillRect(0, h * 0.78, w, h);
        [['#e4574b', 20], ['#3c7a62', 190], ['#F7C948', 360]].forEach(([col, x]) => {
          const X = Number(x);
          cx.fillStyle = String(col);
          cx.fillRect(X, h * 0.42, 150, h * 0.36);
          cx.fillStyle = '#dff2fb';
          for (let i = 0; i < 4; i++) cx.fillRect(X + 10 + i * 34, h * 0.48, 26, 22);
          cx.fillStyle = '#2a211d';
          cx.beginPath();
          cx.arc(X + 30, h * 0.79, 12, 0, Math.PI * 2);
          cx.arc(X + 120, h * 0.79, 12, 0, Math.PI * 2);
          cx.fill();
        });
      });
      const vista = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.95), new THREE.MeshBasicMaterial({ map: buses }));
      en(vista, -2.35, 2.35, 0.02);
      g.add(vista);
      const mv = mat('#5b6b7e', { metal: 0.4, rough: 0.4 });
      g.add(en(caja(2.5, 0.06, 0.06, mv, 0.01), -2.35, 2.83, 0.04), en(caja(2.5, 0.06, 0.06, mv, 0.01), -2.35, 1.87, 0.04));
      for (const x of [-3.57, -2.35, -1.13]) g.add(en(caja(0.06, 1.0, 0.06, mv, 0.01), x, 2.35, 0.04));
      // Reloj grande y letrero de la terminal
      const cartel = letrero(1.6, 0.3, (cx, w, h) => {
        cx.fillStyle = '#26375E';
        cx.fillRect(0, 0, w, h);
        cx.fillStyle = '#F7C948';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.font = `600 ${h * 0.55}px 'Fredoka', sans-serif`;
        cx.fillText('TERMINAL DE LOS DOS', w / 2, h / 2 + 2);
      }, 'cartel terminal');
      en(cartel, 2.3, 2.75, 0.03);
      g.add(cartel);
    },
  },
  3: {
    capitulo: 3,
    luces: { fondo: '#2a211d', ambiente: '#a0795c', intensidadAmbiente: 0.8, sol: '#ffe4c4', intensidadSol: 1.45, solDesde: [2, 6, 5.5], entorno: 0.45 },
    puerta: 'vidrio',
    armar(g) {
      paredFondo(g, '#f3e3cf', '#a5713f', 1.0);
      paredesLado(g, '#efdcc4', '#9a6a3c', 1.0);
      piso(g, baldosas('#f1e3cc', '#b98a5e', '#e8d6bc', 4), 3);
      techo(g, '#f6ead8');
      // Pizarra del menú y lámparas colgantes de café
      const pizarra = letrero(1.2, 0.8, (cx, w, h) => {
        cx.fillStyle = '#2f3b33';
        cx.fillRect(0, 0, w, h);
        cx.strokeStyle = '#a5713f';
        cx.lineWidth = 22;
        cx.strokeRect(0, 0, w, h);
        cx.fillStyle = '#f6f1e6';
        cx.textAlign = 'center';
        cx.font = `600 ${h * 0.13}px 'Fredoka', sans-serif`;
        cx.fillText('Café de los dos', w / 2, h * 0.24);
        cx.font = `500 ${h * 0.09}px 'Fredoka', sans-serif`;
        ['café · té · chocolate', 'torta · galletas', 'y un beso de postre'].forEach((t, i) => cx.fillText(t, w / 2, h * (0.46 + i * 0.16)));
      }, 'pizarra');
      en(pizarra, -2.35, 2.35, 0.03);
      g.add(pizarra);
      for (const x of [-1.1, 1.3]) {
        const z = 2.3;
        const cable = cilindro(0.01, 0.01, 0.9, mat('#3d2b27'));
        en(cable, x, CUARTO.alto - 0.45, z);
        const pantalla = cilindro(0.08, 0.26, 0.24, mat('#3c7a62'));
        en(pantalla, x, CUARTO.alto - 1.0, z);
        const foco = esfera(0.06, matNuevo('#ffe9b0', { emisivo: '#ffd27a', intensidad: 2.4 }));
        en(foco, x, CUARTO.alto - 1.1, z);
        const luz = new THREE.PointLight('#ffd9a8', 3.5, 5, 1.6);
        en(luz, x, CUARTO.alto - 1.2, z);
        g.add(cable, pantalla, foco, luz);
      }
      // Repisa con tazas en la pared
      const repisa = caja(1.5, 0.05, 0.25, mat('#8e5b3c'), 0.02);
      en(repisa, 2.4, 2.2, 0.13);
      g.add(repisa);
      ['#e4574b', '#fff8ee', '#8EC5F0', '#F7C948', '#fff8ee'].forEach((col, i) => {
        const t = cilindro(0.07, 0.06, 0.12, mat(col), undefined, 16);
        en(t, 1.8 + i * 0.3, 2.285, 0.13);
        g.add(t);
      });
    },
  },
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
      lamparaTecho(g, LAMPARA.x, LAMPARA.z);
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
