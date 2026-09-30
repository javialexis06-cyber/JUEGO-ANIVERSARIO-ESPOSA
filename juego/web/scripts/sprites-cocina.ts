// Recortes para la cocina de chef (fondo transparente): los invitados que llegan a comer (los mismos muñecos del
// súper) y Él y Ella vestidos de chef. Lo usa scripts/generar-sprites-cocina.mjs en un navegador.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Vestuario } from '../src/casa/ropa';
import { cargarAnimado } from '../src/recursos';
import type { Ropa } from '../src/casa/modelo';
import { type Cara, Personaje } from '../src/personaje';

export interface Pedido {
  nombre: string;
  pose: string;
  cara: Cara;
  /** Giro en grados (+ = hacia la derecha de la pantalla). */
  giro?: number;
}

/** Dibuja el modelo `clave` (el, ella o un cliente del súper) en cada pose y devuelve los recortes en webp. */
export async function generar(clave: string, pedidos: Pedido[], opciones: { alto?: number; ropa?: Ropa; clipsDe?: string } = {}): Promise<Record<string, string>> {
  const alto = opciones.alto ?? 320;
  const W = 700, H = 860;
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
  await p.cargarPoses(clave);
  if (opciones.ropa && (clave === 'el' || clave === 'ella')) await new Vestuario(p, clave).aplicar(opciones.ropa);
  escena.add(p.grupo);
  // Los muñecos del súper solo traen caminar y reposo: se les prestan las poses de Él o de Ella (mismo esqueleto)
  let prestadas: { mezclador: THREE.AnimationMixer; clips: THREE.AnimationClip[] } | null = null;
  if (opciones.clipsDe && p.modelo) prestadas = { mezclador: new THREE.AnimationMixer(p.modelo), clips: (await cargarAnimado(`${opciones.clipsDe}.glb`)).clips };
  p.pose('reposo', true);
  for (let i = 0; i < 10; i++) p.update(1 / 30);
  const caja = new THREE.Box3().setFromObject(p.grupo);
  const altoModelo = caja.max.y - caja.min.y;
  const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  const media = altoModelo * 0.66;
  camara.left = -media * (W / H);
  camara.right = media * (W / H);
  camara.top = media;
  camara.bottom = -media;
  camara.position.set(0, altoModelo * 0.5 + 0.6, 10);
  camara.lookAt(0, altoModelo * 0.5, 0);
  camara.updateProjectionMatrix();
  const salida: Record<string, string> = {};
  for (const pd of pedidos) {
    p.rot = THREE.MathUtils.degToRad(pd.giro ?? 16);
    p.sincronizar();
    p.pose(pd.pose, true);
    p.cara(pd.cara);
    for (let i = 0; i < 30; i++) p.update(1 / 30);
    p.cara(pd.cara);
    const clip = prestadas?.clips.find((c) => c.name === pd.pose);
    if (prestadas && clip) {
      prestadas.mezclador.stopAllAction();
      prestadas.mezclador.clipAction(clip).play();
      prestadas.mezclador.update(0.01);
    }
    renderer.render(escena, camara);
    // Recorte al contenido (con un margencito) y escalado a la altura pedida
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
    const m = 6;
    x0 = Math.max(0, x0 - m);
    y0 = Math.max(0, y0 - m);
    x1 = Math.min(W - 1, x1 + m);
    y1 = Math.min(H - 1, y1 + m);
    const k = alto / (y1 - y0 + 1);
    const out = document.createElement('canvas');
    out.width = Math.round((x1 - x0 + 1) * k);
    out.height = alto;
    const g = out.getContext('2d')!;
    g.imageSmoothingQuality = 'high';
    g.drawImage(lienzo, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, out.width, out.height);
    salida[pd.nombre] = out.toDataURL('image/webp', 0.88);
  }
  renderer.dispose();
  return salida;
}
