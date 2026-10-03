// Retratos de los disfraces del lavado (fondo transparente): Él o Ella con la ropa del clóset y los accesorios del
// baño, sacados del mismo 3D del juego. Lo usa scripts/generar-sprites-lavado.mjs en un navegador.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Cara } from '../src/personaje';
import { DISFRACES } from '../src/casa/lavado/disfraces';
import { Jugador3D } from '../src/casa/lavado/dibujo/jugadores';

/** Pose y cara de cada retrato (que se note la personalidad del disfraz). */
const POSE: Record<string, [string, Cara, number]> = {
  el_panda: ['saludo_a', 'feliz', 18],
  el_perro: ['jarras', 'presumido', 20],
  el_dentista: ['pulgares_a', 'guino', 16],
  el_heroe: ['jarras', 'presumido', 14],
  el_lenador: ['celebrar', 'carcajada', 20],
  el_astronauta: ['pulgares_a', 'feliz', 18],
  el_bombero: ['pulgares_a', 'feliz', 18],
  el_barbero: ['jarras', 'guino', 18],
  ella_pulga: ['saludo_a', 'feliz', -18],
  ella_guerrera: ['jarras', 'presumido', -16],
  ella_yanbal: ['beso', 'beso', -18],
  ella_turbante: ['reposo', 'feliz', -14],
  ella_sirena: ['celebrar', 'carcajada', -18],
  ella_ranita: ['baile_a', 'carcajada', -16],
  ella_princesa: ['jarras', 'presumido', -16],
  ella_estilista: ['pulgares_a', 'guino', -18],
};

export async function generar(ids: string[], lado = 256): Promise<Record<string, string>> {
  const W = 640, H = 760;
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
  const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  const salida: Record<string, string> = {};
  for (const id of ids) {
    const d = DISFRACES.find((x) => x.id === id);
    if (!d) continue;
    const j = new Jugador3D(d.rol, d);
    await j.cargar();
    // Derechito y a tamaño normal (en el juego va inclinado hacia la cámara)
    const inclinado = (j as unknown as { inclinado: THREE.Group }).inclinado;
    inclinado.rotation.set(0, 0, 0);
    inclinado.scale.setScalar(1);
    escena.add(j.raiz);
    const [pose, cara, giro] = POSE[id] ?? ['reposo', 'feliz', 18];
    j.p.rot = THREE.MathUtils.degToRad(giro);
    j.p.pose(pose, true);
    j.p.cara(cara);
    for (let i = 0; i < 40; i++) j.p.update(1 / 30);
    j.p.grupo.position.set(0, 0, 0);
    j.p.grupo.rotation.y = j.p.rot;
    j.raiz.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(j.raiz);
    const alto = caja.max.y - caja.min.y;
    const media = alto * 0.62;
    camara.left = -media * (W / H);
    camara.right = media * (W / H);
    camara.top = media;
    camara.bottom = -media;
    camara.position.set(0, caja.min.y + alto * 0.5 + 0.5, 10);
    camara.lookAt(0, caja.min.y + alto * 0.5, 0);
    camara.updateProjectionMatrix();
    renderer.render(escena, camara);
    // Recorte al contenido y centrado en un cuadrado (pegado abajo, con aire arriba)
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
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const k = (lado * 0.92) / Math.max(w, h);
    const out = document.createElement('canvas');
    out.width = out.height = lado;
    const g = out.getContext('2d')!;
    g.imageSmoothingQuality = 'high';
    g.drawImage(lienzo, x0, y0, w, h, (lado - w * k) / 2, lado - h * k - lado * 0.03, w * k, h * k);
    salida[id] = out.toDataURL('image/webp', 0.9);
    j.liberar();
  }
  renderer.dispose();
  return salida;
}
