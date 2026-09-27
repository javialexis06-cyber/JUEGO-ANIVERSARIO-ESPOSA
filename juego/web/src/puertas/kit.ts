// Piezas para armar cuartos y acertijos con el mismo aire de plastilina de la casa: materiales mates con relieve,
// cajas redondeadas, formas extruidas (corazón, estrella), letreros pintados en lienzo y sombras de contacto.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { texturaRelieve } from '../recursos';

export interface OpMat {
  rough?: number;
  metal?: number;
  emisivo?: string;
  intensidad?: number;
  opacidad?: number;
  plano?: boolean;
  lados?: THREE.Side;
}

const mats = new Map<string, THREE.MeshStandardMaterial>();

/** Material de plastilina (se comparte por color y opciones: no clonar si se va a cambiar el color). */
export function mat(color: string, o: OpMat = {}): THREE.MeshStandardMaterial {
  const k = `${color}|${JSON.stringify(o)}`;
  let m = mats.get(k);
  if (!m) {
    m = matNuevo(color, o);
    mats.set(k, m);
  }
  return m;
}

/** Material propio (para cambiarle el color o la emisión sin afectar a otros). */
export function matNuevo(color: string, o: OpMat = {}) {
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.78,
    metalness: o.metal ?? 0,
    side: o.lados ?? THREE.FrontSide,
  });
  if (!o.plano) {
    m.normalMap = texturaRelieve();
    m.normalScale.set(0.35, 0.35);
  }
  if (o.emisivo) {
    m.emissive.set(o.emisivo);
    m.emissiveIntensity = o.intensidad ?? 1;
  }
  if (o.opacidad !== undefined) {
    m.transparent = true;
    m.opacity = o.opacidad;
    m.depthWrite = o.opacidad > 0.9;
  }
  return m;
}

function malla(geo: THREE.BufferGeometry, m: THREE.Material | string, nombre?: string, sombra = true) {
  const x = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m);
  x.castShadow = sombra;
  x.receiveShadow = true;
  if (nombre) x.name = nombre;
  return x;
}

export function caja(w: number, h: number, d: number, m: THREE.Material | string, r = 0.03, nombre?: string) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  return malla(rr > 0.002 ? new RoundedBoxGeometry(w, h, d, 3, rr) : new THREE.BoxGeometry(w, h, d), m, nombre);
}

export function cilindro(rArriba: number, rAbajo: number, h: number, m: THREE.Material | string, nombre?: string, seg = 28) {
  return malla(new THREE.CylinderGeometry(rArriba, rAbajo, h, seg), m, nombre);
}

export function esfera(r: number, m: THREE.Material | string, nombre?: string, seg = 24) {
  return malla(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), m, nombre);
}

export function toro(r: number, tubo: number, m: THREE.Material | string, nombre?: string, arco = Math.PI * 2) {
  return malla(new THREE.TorusGeometry(r, tubo, 12, 36, arco), m, nombre);
}

export function plano(w: number, h: number, m: THREE.Material | string, nombre?: string) {
  const x = malla(new THREE.PlaneGeometry(w, h), m, nombre, false);
  return x;
}

export function corazonForma(s = 1) {
  const f = new THREE.Shape();
  f.moveTo(0, -0.5 * s);
  f.bezierCurveTo(-0.08 * s, -0.42 * s, -0.5 * s, -0.12 * s, -0.5 * s, 0.14 * s);
  f.bezierCurveTo(-0.5 * s, 0.42 * s, -0.2 * s, 0.52 * s, 0, 0.3 * s);
  f.bezierCurveTo(0.2 * s, 0.52 * s, 0.5 * s, 0.42 * s, 0.5 * s, 0.14 * s);
  f.bezierCurveTo(0.5 * s, -0.12 * s, 0.08 * s, -0.42 * s, 0, -0.5 * s);
  return f;
}

export function estrellaForma(r = 0.5, adentro = 0.45, puntas = 5) {
  const f = new THREE.Shape();
  for (let i = 0; i <= puntas * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / puntas;
    const rr = i % 2 ? r * adentro : r;
    if (i === 0) f.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else f.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return f;
}

/** Forma plana extruida con bisel suave, centrada en su grosor. */
export function forma(f: THREE.Shape, grosor: number, m: THREE.Material | string, nombre?: string, bisel = 0.02) {
  const geo = new THREE.ExtrudeGeometry(f, { depth: grosor, bevelEnabled: bisel > 0, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 3, curveSegments: 18 });
  geo.translate(0, 0, -grosor / 2);
  return malla(geo, m, nombre);
}

export const corazon = (tam: number, grosor: number, m: THREE.Material | string, nombre?: string) => forma(corazonForma(tam), grosor, m, nombre, grosor * 0.35);
export const estrella = (tam: number, grosor: number, m: THREE.Material | string, nombre?: string) => forma(estrellaForma(tam / 2), grosor, m, nombre, grosor * 0.3);

/** Lienzo pintado como textura (letreros, notas, cuadros, números). */
export function lienzo(w: number, h: number, pintar: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  pintar(c, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export const FUENTE = "'Fredoka', 'Nunito', system-ui, sans-serif";

/** Letrero plano con texto (o lo que se pinte) del tamaño dado en metros. */
export function letrero(
  w: number,
  h: number,
  pintar: (c: CanvasRenderingContext2D, W: number, H: number) => void,
  nombre?: string,
  o: { px?: number; brillo?: number; transparente?: boolean } = {},
) {
  const px = o.px ?? 256;
  const t = lienzo(Math.round(px * (w / Math.max(w, h))) * 2, Math.round(px * (h / Math.max(w, h))) * 2, pintar);
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, transparent: !!o.transparente, alphaTest: o.transparente ? 0.02 : 0 });
  if (o.brillo) {
    m.emissive.set('#ffffff');
    m.emissiveMap = t;
    m.emissiveIntensity = o.brillo;
  }
  const x = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  x.receiveShadow = true;
  if (nombre) x.name = nombre;
  return x;
}

/** Texto centrado en un lienzo. */
export function textoEn(c: CanvasRenderingContext2D, texto: string, x: number, y: number, tam: number, color = '#3d2b27', peso = 600) {
  c.font = `${peso} ${tam}px ${FUENTE}`;
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(texto, x, y);
}

/** Sombra de contacto: mancha oscura y difusa bajo un objeto (más barata que las sombras de verdad). */
let texSombra: THREE.Texture | null = null;
export function sombraSuelo(w: number, d: number, fuerza = 0.35) {
  if (!texSombra) {
    texSombra = lienzo(128, 128, (c) => {
      const g = c.createRadialGradient(64, 64, 4, 64, 64, 62);
      g.addColorStop(0, 'rgba(40,25,20,1)');
      g.addColorStop(1, 'rgba(40,25,20,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
    });
  }
  const m = new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, opacity: fuerza, depthWrite: false });
  const x = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  x.rotation.x = -Math.PI / 2;
  x.position.y = 0.004;
  x.renderOrder = -1;
  return x;
}

/** Pone un objeto en (x, y, z) y lo devuelve (para encadenar al armar). */
export function en<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, ry = 0): T {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  return o;
}

export function grupo(nombre?: string, ...hijos: THREE.Object3D[]) {
  const g = new THREE.Group();
  if (nombre) g.name = nombre;
  if (hijos.length) g.add(...hijos);
  return g;
}

/** Azar repetible (cada puerta sale igual siempre). */
export function azar(semilla: number) {
  let s = (semilla * 9301 + 49297) % 233280 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Íconos del inventario (SVG sencillos con el mismo trazo de la interfaz)
// ---------------------------------------------------------------------------
export const ICONOS: Record<string, string> = {
  llave: '<svg viewBox="0 0 48 48"><circle cx="15" cy="24" r="9" fill="#F2C75C" stroke="#8a5a1c" stroke-width="3"/><circle cx="15" cy="24" r="3.5" fill="#fff8ee" stroke="#8a5a1c" stroke-width="2"/><path d="M24 24h19M36 24v7M42 24v5" stroke="#8a5a1c" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M24 24h19M36 24v7M42 24v5" stroke="#F2C75C" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>',
  moneda: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="15" fill="#F6CF5A" stroke="#9a6a14" stroke-width="3"/><circle cx="24" cy="24" r="9" fill="none" stroke="#c9952c" stroke-width="2.5"/></svg>',
  tiquete: '<svg viewBox="0 0 48 48"><path d="M6 14h36v7a4 4 0 0 0 0 8v7H6v-7a4 4 0 0 0 0-8z" fill="#F4B6C2" stroke="#7a3848" stroke-width="3" stroke-linejoin="round"/><path d="M18 16v18" stroke="#7a3848" stroke-width="2" stroke-dasharray="3 3"/></svg>',
  flor: '<svg viewBox="0 0 48 48"><path d="M24 26v16" stroke="#2f8f68" stroke-width="4" stroke-linecap="round"/><g fill="#F59FC0" stroke="#a64b6c" stroke-width="2"><circle cx="24" cy="12" r="6"/><circle cx="33" cy="19" r="6"/><circle cx="15" cy="19" r="6"/><circle cx="19" cy="28" r="6"/><circle cx="29" cy="28" r="6"/></g><circle cx="24" cy="21" r="5" fill="#F6CF5A" stroke="#9a6a14" stroke-width="2"/></svg>',
  pieza: '<svg viewBox="0 0 48 48"><path d="M10 12h10a5 5 0 1 1 8 0h10v10a5 5 0 1 0 0 8v10H10z" fill="#9ccbef" stroke="#2c5a86" stroke-width="3" stroke-linejoin="round"/></svg>',
  vela: '<svg viewBox="0 0 48 48"><rect x="17" y="20" width="14" height="22" rx="3" fill="#fff8ee" stroke="#7a625a" stroke-width="3"/><path d="M24 6c5 6 5 10 0 12-5-2-5-6 0-12z" fill="#F6CF5A" stroke="#c96a1c" stroke-width="2"/></svg>',
  martillo: '<svg viewBox="0 0 48 48"><path d="M24 20l14 20" stroke="#8a5a3c" stroke-width="6" stroke-linecap="round"/><rect x="8" y="8" width="24" height="12" rx="3" transform="rotate(-30 20 14)" fill="#9aa4b0" stroke="#4a5058" stroke-width="3"/></svg>',
  imán: '<svg viewBox="0 0 48 48"><path d="M12 10v14a12 12 0 0 0 24 0V10h-8v14a4 4 0 0 1-8 0V10z" fill="#E4574B" stroke="#7a2020" stroke-width="3" stroke-linejoin="round"/><path d="M12 10h8v6h-8zM28 10h8v6h-8z" fill="#dfe6ee"/></svg>',
  corazon: '<svg viewBox="0 0 48 48"><path d="M24 40C10 30 6 22 6 16a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 6-4 14-18 24z" fill="#E4574B" stroke="#8a2030" stroke-width="3" stroke-linejoin="round"/></svg>',
  foco: '<svg viewBox="0 0 48 48"><path d="M24 6a12 12 0 0 0-7 22v6h14v-6a12 12 0 0 0-7-22z" fill="#F6CF5A" stroke="#9a6a14" stroke-width="3"/><rect x="18" y="36" width="12" height="6" rx="2" fill="#9aa4b0" stroke="#4a5058" stroke-width="2"/></svg>',
};

export const iconoItem = (id: string) => ICONOS[id] ?? ICONOS.pieza;
