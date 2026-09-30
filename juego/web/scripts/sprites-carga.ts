// Recortes de Él y Ella para las pantallas de carga (todos a la misma escala y con dónde quedan los pies, así se
// pueden poner corriendo, brincando o tirados en el piso sobre la misma línea). Lo usa generar-sprites-carga.mjs.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { type Cara, Personaje } from '../src/personaje';

export interface Pedido {
  nombre: string;
  pose: string;
  cara: Cara;
  giro?: number;
}
export interface Recorte {
  url: string;
  w: number;
  h: number;
  /** Dónde quedan los pies (el origen del modelo) dentro del recorte, en píxeles. */
  ox: number;
  oy: number;
}

/** `alto`: alto en píxeles del personaje de pie (todas las poses usan esa misma escala). */
export async function generar(rol: 'el' | 'ella', pedidos: Pedido[], alto = 200): Promise<Record<string, Recorte>> {
  const W = 900, H = 900;
  const lienzo = document.createElement('canvas');
  lienzo.width = W;
  lienzo.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.4;
  const escena = new THREE.Scene();
  escena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.55;
  escena.add(new THREE.HemisphereLight('#fff4e8', '#d9b8a4', 0.9));
  const sol = new THREE.DirectionalLight('#fff1e2', 1.7);
  sol.position.set(-3, 5, 6);
  const borde = new THREE.DirectionalLight('#ffd6e4', 1.1);
  borde.position.set(4, 3, -4);
  escena.add(sol, borde);
  const p = new Personaje({ x: 0, y: 0 }, 1);
  await p.cargarPoses(rol);
  escena.add(p.grupo);
  p.pose('reposo', true);
  for (let i = 0; i < 10; i++) p.update(1 / 30);
  const caja = new THREE.Box3().setFromObject(p.grupo);
  const altoModelo = caja.max.y - caja.min.y;
  // Cámara fija con espacio de sobra (para brincos, brazos arriba y acostado)
  const media = altoModelo * 1.1;
  const camara = new THREE.OrthographicCamera(-media, media, media, -media, 0.1, 50);
  camara.position.set(0, altoModelo * 0.45 + 0.6, 10);
  camara.lookAt(0, altoModelo * 0.45, 0);
  camara.updateProjectionMatrix();
  const aPx = (v: THREE.Vector3) => {
    const q = v.clone().project(camara);
    return { x: (q.x * 0.5 + 0.5) * W, y: (-q.y * 0.5 + 0.5) * H };
  };
  // Dónde quedan los pies: lo más bajo que se ve del personaje de pie (la caja cuenta mallas escondidas)
  p.rot = THREE.MathUtils.degToRad(20);
  p.sincronizar();
  renderer.render(escena, camara);
  const medir = document.createElement('canvas');
  medir.width = W;
  medir.height = H;
  const gm = medir.getContext('2d')!;
  gm.drawImage(lienzo, 0, 0);
  const dm = gm.getImageData(0, 0, W, H).data;
  let arriba = H, abajo = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (dm[(y * W + x) * 4 + 3] > 8) {
        if (y < arriba) arriba = y;
        abajo = y;
        break;
      }
  const pies = { x: aPx(new THREE.Vector3(0, 0, 0)).x, y: abajo };
  const k = alto / (abajo - arriba);
  const salida: Record<string, Recorte> = {};
  for (const pd of pedidos) {
    p.rot = THREE.MathUtils.degToRad(pd.giro ?? 20);
    p.sincronizar();
    p.pose(pd.pose, true);
    p.cara(pd.cara);
    for (let i = 0; i < 30; i++) p.update(1 / 30);
    p.cara(pd.cara);
    renderer.render(escena, camara);
    const c2 = document.createElement('canvas');
    c2.width = W;
    c2.height = H;
    const g2 = c2.getContext('2d')!;
    g2.drawImage(lienzo, 0, 0);
    const datos = g2.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (datos[(y * W + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    const m = 4;
    x0 = Math.max(0, x0 - m);
    y0 = Math.max(0, y0 - m);
    x1 = Math.min(W - 1, x1 + m);
    y1 = Math.min(H - 1, y1 + m);
    const out = document.createElement('canvas');
    out.width = Math.round((x1 - x0 + 1) * k);
    out.height = Math.round((y1 - y0 + 1) * k);
    const g = out.getContext('2d')!;
    g.imageSmoothingQuality = 'high';
    g.drawImage(lienzo, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, out.width, out.height);
    salida[pd.nombre] = { url: out.toDataURL('image/webp', 0.86), w: out.width, h: out.height, ox: Math.round((pies.x - x0) * k), oy: Math.round((pies.y - y0) * k) };
  }
  renderer.dispose();
  return salida;
}
