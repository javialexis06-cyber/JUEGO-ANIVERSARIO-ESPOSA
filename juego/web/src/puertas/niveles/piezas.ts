// Piezas que se repiten entre acertijos: llaves, muebles simples, planos para arrastrar y física de canicas.
import * as THREE from 'three';
import { caja, cilindro, en, esfera, grupo, mat, toro } from '../kit';

/** Plano de la pared del fondo (un poco por delante) para arrastrar cosas colgadas. */
export const planoPared = (z = 0.04) => new THREE.Plane(new THREE.Vector3(0, 0, 1), -z);
/** Plano del piso (o de una mesa a cierta altura). */
export const planoPiso = (y = 0) => new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);

/** Caja límite para arrastrar (min y max en el mundo). */
export const limites = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));

/** Llave dorada (acostada: plana sobre XZ; de pie: en XY). */
export function llave(nombre = 'llave', color = '#f2c75c', acostada = true) {
  const g = grupo(nombre);
  const m = mat(color, { rough: 0.3, metal: 0.75 });
  const aro = toro(0.05, 0.016, m);
  en(aro, -0.07, 0, 0);
  const cana = caja(0.14, 0.022, 0.022, m, 0.008);
  en(cana, 0.04, 0, 0);
  const d1 = caja(0.02, 0.04, 0.02, m, 0.006);
  en(d1, 0.09, -0.025, 0);
  const d2 = caja(0.02, 0.028, 0.02, m, 0.006);
  en(d2, 0.06, -0.02, 0);
  g.add(aro, cana, d1, d2);
  if (acostada) g.rotation.x = -Math.PI / 2;
  // Área de toque más grande que la llave (es chiquita)
  const toque = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  toque.name = `${nombre} toque`;
  g.add(toque);
  return g;
}

/** Sofá de dos puestos. */
export function sofa(color = '#9ccbef', nombre = 'sofa') {
  const g = grupo(nombre);
  const m = mat(color);
  g.add(en(caja(2.0, 0.42, 0.85, m, 0.12), 0, 0.33, 0));
  g.add(en(caja(2.0, 0.7, 0.26, m, 0.12), 0, 0.72, -0.34));
  for (const s of [-1, 1]) g.add(en(caja(0.26, 0.6, 0.85, m, 0.12), s * 1.0, 0.44, 0));
  for (const x of [-0.8, 0.8]) for (const z of [-0.32, 0.32]) g.add(en(cilindro(0.04, 0.03, 0.12, mat('#8a5e40')), x, 0.06, z));
  return g;
}

/** Mesita o repisa de madera. */
export function mesa(ancho: number, fondo: number, alto: number, color = '#c49468', nombre = 'mesa') {
  const g = grupo(nombre);
  const m = mat(color);
  g.add(en(caja(ancho, 0.06, fondo, m, 0.02), 0, alto - 0.03, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(en(caja(0.06, alto - 0.06, 0.06, m, 0.015), sx * (ancho / 2 - 0.06), (alto - 0.06) / 2, sz * (fondo / 2 - 0.06)));
  return g;
}

/** Lámpara de mesa con pantalla de color (la pantalla se puede encender). */
export function lamparita(color: string, nombre: string) {
  const g = grupo(nombre);
  g.add(en(cilindro(0.08, 0.1, 0.05, mat('#fff8ee')), 0, 0.025, 0));
  g.add(en(cilindro(0.015, 0.015, 0.3, mat('#d9b25a', { metal: 0.6, rough: 0.3 })), 0, 0.2, 0));
  const pantalla = cilindro(0.09, 0.15, 0.2, new THREE.MeshStandardMaterial({ color, roughness: 0.7, emissive: color, emissiveIntensity: 0 }), `${nombre} pantalla`);
  en(pantalla, 0, 0.42, 0);
  g.add(pantalla);
  const luz = new THREE.PointLight(color, 0, 1.6, 2);
  en(luz, 0, 0.4, 0.1);
  g.add(luz);
  g.userData.prender = (si: boolean) => {
    (pantalla.material as THREE.MeshStandardMaterial).emissiveIntensity = si ? 1.4 : 0;
    luz.intensity = si ? 1.4 : 0;
  };
  return g;
}

/** Canica que rueda dentro de un tablero con repisas (física 2D sencilla). */
export interface Tabla {
  w: number;
  h: number;
  /** Rectángulos sólidos [x0, y0, x1, y1] en coordenadas del tablero (0,0 abajo a la izquierda). */
  solidos: [number, number, number, number][];
}

export class Canica {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  constructor(public tabla: Tabla, x: number, y: number, public r = 0.035) {
    this.x = x;
    this.y = y;
  }

  /** Avanza con la gravedad (ax, ay) del tablero. */
  paso(dt: number, ax: number, ay: number) {
    const sub = 4;
    const h = dt / sub;
    for (let i = 0; i < sub; i++) {
      this.vx += ax * h;
      this.vy += ay * h;
      this.vx *= 0.995;
      this.vy *= 0.995;
      this.x += this.vx * h;
      this.y += this.vy * h;
      this.chocar();
    }
  }

  private chocar() {
    const { w, h } = this.tabla;
    const r = this.r;
    if (this.x < r) (this.x = r), (this.vx = Math.abs(this.vx) * 0.3);
    if (this.x > w - r) (this.x = w - r), (this.vx = -Math.abs(this.vx) * 0.3);
    if (this.y < r) (this.y = r), (this.vy = Math.abs(this.vy) * 0.3);
    if (this.y > h - r) (this.y = h - r), (this.vy = -Math.abs(this.vy) * 0.3);
    for (const [x0, y0, x1, y1] of this.tabla.solidos) {
      const cx = Math.max(x0, Math.min(this.x, x1)), cy = Math.max(y0, Math.min(this.y, y1));
      const dx = this.x - cx, dy = this.y - cy;
      const d = Math.hypot(dx, dy);
      if (d >= r || d === 0) continue;
      const nx = dx / d, ny = dy / d;
      this.x = cx + nx * r;
      this.y = cy + ny * r;
      const vn = this.vx * nx + this.vy * ny;
      if (vn < 0) {
        this.vx -= 1.3 * vn * nx;
        this.vy -= 1.3 * vn * ny;
      }
    }
  }
}

/** Bolita brillante para marcar algo que se puede tocar (se ve solo de cerca). */
export function brillo(color = '#fff6d8') {
  return esfera(0.02, new THREE.MeshBasicMaterial({ color }));
}

/** Superficie que se borra frotando (vidrio empañado, hojas secas, arena): devuelve la malla y cuánto se limpió. */
export function borrable(w: number, h: number, pintar: (c: CanvasRenderingContext2D, W: number, H: number) => void, nombre: string, px = 256) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(px * (w / Math.max(w, h)));
  cv.height = Math.round(px * (h / Math.max(w, h)));
  const cx = cv.getContext('2d', { willReadFrequently: true })!;
  pintar(cx, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, depthWrite: false });
  const malla = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  malla.name = nombre;
  malla.renderOrder = 2;
  return {
    malla,
    /** Borra un círculo en la coordenada de textura (radio en fracción del ancho). */
    borrar(uv: THREE.Vector2, radio = 0.07) {
      cx.globalCompositeOperation = 'destination-out';
      cx.beginPath();
      cx.arc(uv.x * cv.width, (1 - uv.y) * cv.height, radio * cv.width, 0, Math.PI * 2);
      cx.fill();
      cx.globalCompositeOperation = 'source-over';
      tex.needsUpdate = true;
    },
    /** Fracción limpia (0..1), medida en una grilla. */
    limpio() {
      const d = cx.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0, vacios = 0;
      for (let y = 4; y < cv.height; y += 8)
        for (let x = 4; x < cv.width; x += 8) {
          n++;
          if (d[(y * cv.width + x) * 4 + 3] < 40) vacios++;
        }
      return vacios / Math.max(1, n);
    },
  };
}

/** Gotas o partículas que caen con gravedad (agua de la regadera, arena…). */
export class Chorro {
  private gotas: { m: THREE.Mesh; v: THREE.Vector3; vida: number }[] = [];
  constructor(private padre: THREE.Object3D, private color = '#7cc4f0', private r = 0.02) {}

  soltar(desde: THREE.Vector3, vel: THREE.Vector3) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(this.r, 6, 5), mat(this.color, { rough: 0.2, plano: true }));
    m.position.copy(desde);
    this.padre.add(m);
    this.gotas.push({ m, v: vel.clone(), vida: 1.6 });
  }

  /** Avanza; `piso(y)` dice dónde se deshacen. Devuelve cuántas llegaron abajo en este paso. */
  paso(dt: number, piso = 0) {
    let llegaron = 0;
    for (const g of this.gotas) {
      g.v.y -= 9.8 * dt;
      g.m.position.addScaledVector(g.v, dt);
      g.vida -= dt;
      if (g.m.position.y <= piso) {
        g.vida = 0;
        llegaron++;
      }
    }
    for (const g of this.gotas.filter((x) => x.vida <= 0)) {
      g.m.removeFromParent();
      g.m.geometry.dispose();
    }
    this.gotas = this.gotas.filter((x) => x.vida > 0);
    return llegaron;
  }
}

/** Florecita (tallo, pétalos de un color que se puede cambiar y centro amarillo). */
export function florecita(color: string, nombre: string, alto = 0.5) {
  const g = grupo(nombre);
  g.add(en(cilindro(0.015, 0.02, alto, mat('#4f8a55')), 0, alto / 2, 0));
  const petalos = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = esfera(0.07, petalos, undefined, 10);
    p.scale.set(1, 1, 0.45);
    en(p, Math.cos(a) * 0.08, alto + Math.sin(a) * 0.08, 0.02);
    g.add(p);
  }
  g.add(en(esfera(0.05, mat('#F7C948'), undefined, 10), 0, alto, 0.05));
  const hoja = esfera(0.07, mat('#5f9e4f'), undefined, 8);
  hoja.scale.set(1.4, 0.4, 0.6);
  en(hoja, 0.08, alto * 0.35, 0);
  g.add(hoja);
  g.userData.petalos = petalos;
  return g;
}

/** Teclado numérico en la pared: al tocarlo se acerca y pide el código; si acierta, se abre la puerta. */
export function tecladoPared(c: import('../nivel').Ctx, x: number, y: number, z: number, codigo: string, titulo = 'Teclado de la puerta') {
  const t = grupo('teclado');
  t.add(caja(0.2, 0.28, 0.05, mat('#3d2b27'), 0.03));
  for (let f = 0; f < 3; f++) for (let k = 0; k < 3; k++) t.add(en(caja(0.04, 0.04, 0.02, mat('#efe2d0'), 0.008), -0.055 + k * 0.055, 0.06 - f * 0.055, 0.03));
  t.add(en(caja(0.14, 0.04, 0.02, mat('#7ff0b0', { emisivo: '#2f8f68', intensidad: 0.6 }), 0.008), 0, 0.105, 0.03));
  en(t, x, y, z);
  c.g.add(t);
  c.tocar(t, async () => {
    await c.enfocar(t, 0.9);
    const ok = await c.ui.teclado({ titulo, largo: codigo.length, correcto: codigo });
    if (ok) c.resolver();
    else await c.volver();
  });
  return t;
}

/** Candado colgado de la puerta (o de la reja) con ruedas; si acierta, se abre la puerta. */
export function candadoPuerta(c: import('../nivel').Ctx, ruedas: string[][], correcto: string[], titulo = 'Candado', x = 0.35, y = 1.05) {
  const g = grupo('candado');
  const cuerpo = caja(0.2, 0.18, 0.08, mat('#d9b25a', { metal: 0.7, rough: 0.3 }), 0.04);
  const arco = toro(0.065, 0.018, mat('#b8bcc4', { metal: 0.8, rough: 0.3 }), undefined, Math.PI);
  en(arco, 0, 0.09, 0);
  g.add(cuerpo, arco);
  for (let i = 0; i < ruedas.length; i++) g.add(en(caja(0.04, 0.07, 0.02, mat('#3d2b27'), 0.01), -0.05 * (ruedas.length - 1) / 2 + i * 0.05, -0.01, 0.045));
  const toque = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(toque);
  c.puerta.pegar(g, x, y, 0.14);
  c.tocar(g, async () => {
    const ok = await c.ui.ruedas({ titulo, ruedas, correcto });
    if (ok) {
      const y0 = g.position.y;
      void c.escena.animar(400, (k) => (g.position.y = y0 - k * 0.25));
      c.resolver();
    }
  });
  return g;
}

// ---------------------------------------------------------------------------
// Reconocer dibujos hechos con el dedo (corazón, círculo)
// ---------------------------------------------------------------------------
type Pt = { x: number; y: number };

function remuestrear(pts: Pt[], n = 64): Pt[] {
  const largo = pts.reduce((a, p, i) => (i ? a + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
  const paso = largo / (n - 1);
  const out: Pt[] = [pts[0]];
  let acum = 0;
  const q = pts.map((p) => ({ ...p }));
  for (let i = 1; i < q.length && out.length < n; i++) {
    const d = Math.hypot(q[i].x - q[i - 1].x, q[i].y - q[i - 1].y);
    if (acum + d >= paso && d > 0) {
      const t = (paso - acum) / d;
      const nuevo = { x: q[i - 1].x + t * (q[i].x - q[i - 1].x), y: q[i - 1].y + t * (q[i].y - q[i - 1].y) };
      out.push(nuevo);
      q.splice(i, 0, nuevo);
      acum = 0;
    } else acum += d;
  }
  while (out.length < n) out.push(pts[pts.length - 1]);
  return out;
}

function normalizar(pts: Pt[]): Pt[] {
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const t = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  return pts.map((p) => ({ x: (p.x - cx) / t, y: (p.y - cy) / t }));
}

/** Silueta de corazón (y hacia abajo, como la pantalla). */
export function corazonPuntos(n = 64): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return { x: 16 * Math.sin(t) ** 3, y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) };
  });
}

export function circuloPuntos(n = 64): Pt[] {
  return Array.from({ length: n }, (_, i) => ({ x: Math.cos((i / n) * Math.PI * 2), y: Math.sin((i / n) * Math.PI * 2) }));
}

/** ¿El trazo es un corazón? Tiene que parecerse al corazón y claramente más que a un círculo. */
export function esCorazon(trazo: Pt[]) {
  const dc = parecido(trazo, corazonPuntos());
  return dc < 0.14 && dc < parecido(trazo, circuloPuntos()) * 0.8;
}

/** Qué tanto se parece un trazo cerrado a una figura (0 = igual). Prueba todos los puntos de inicio y ambos sentidos. */
export function parecido(trazo: Pt[], figura: Pt[]) {
  if (trazo.length < 8) return 9;
  const a = normalizar(remuestrear(trazo));
  const b0 = normalizar(remuestrear([...figura, figura[0]]));
  let mejor = 9;
  for (const b of [b0, [...b0].reverse()]) {
    for (let k = 0; k < b.length; k += 2) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        const q = b[(i + k) % b.length];
        d += Math.hypot(a[i].x - q.x, a[i].y - q.y);
      }
      mejor = Math.min(mejor, d / a.length);
    }
  }
  return mejor;
}

/** Taza de café con plato (y espuma si se pide). */
export function taza(color = '#fff8ee', nombre = 'taza', espuma?: string) {
  const g = grupo(nombre);
  g.add(en(cilindro(0.2, 0.16, 0.03, mat(color), undefined, 24), 0, 0.015, 0));
  g.add(en(cilindro(0.13, 0.1, 0.16, mat(color), undefined, 24), 0, 0.11, 0));
  const asa = toro(0.05, 0.015, mat(color));
  en(asa, 0.14, 0.12, 0);
  g.add(asa);
  if (espuma) g.add(en(cilindro(0.12, 0.12, 0.01, mat(espuma), `${nombre} espuma`, 24), 0, 0.185, 0));
  return g;
}

/** Mesita redonda de café. */
export function mesaRedonda(r = 0.45, alto = 0.75, color = '#c49468', nombre = 'mesa redonda') {
  const g = grupo(nombre);
  g.add(en(cilindro(r, r, 0.05, mat(color), undefined, 32), 0, alto - 0.025, 0));
  g.add(en(cilindro(0.04, 0.05, alto - 0.05, mat('#3d2b27')), 0, (alto - 0.05) / 2, 0));
  g.add(en(cilindro(0.22, 0.25, 0.03, mat('#3d2b27'), undefined, 20), 0, 0.015, 0));
  return g;
}

/** Mostrador largo de café. */
export function mostrador(ancho: number, color = '#a5713f', tope = '#efe2d0') {
  const g = grupo('mostrador');
  g.add(en(caja(ancho, 0.95, 0.6, mat(color), 0.03), 0, 0.475, 0));
  g.add(en(caja(ancho + 0.08, 0.05, 0.68, mat(tope), 0.02), 0, 0.975, 0));
  for (let i = 0; i < Math.floor(ancho / 0.5); i++) g.add(en(caja(0.02, 0.6, 0.01, mat('#8e5b3c'), 0.005), -ancho / 2 + 0.25 + i * 0.5, 0.45, 0.305));
  return g;
}
