// El chef de un amigo: los recortes de Javier y Laura vestidos de chef vienen renderizados de antes
// (public/cocina/gente/<rol>_chef_<pose>.webp, scripts/generar-sprites-cocina.mjs); los de un amigo se hacen aquí
// mismo, una vez, con su muñeco (el de Javier o el de Laura como base), sus colores, el gorro y la chaqueta de chef,
// en las mismas poses y con la misma luz. Mientras se hacen (y si el celular no tiene WebGL) se usa su carita con
// gorro de chef dibujada en SVG.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { type Cara, Personaje } from '../../personaje';
import { elegirModelos, liberarEsqueletos } from '../../recursos';
import { caritaSvg } from '../../salas/carita';
import { teñirModelo } from '../../salas/tinte';
import type { AspectoJugador } from '../../salas/tipos';
import { Vestuario } from '../ropa';

export type PoseChef = 'concentrado' | 'feliz' | 'celebra' | 'susto' | 'presume' | 'intro';

/** Las mismas poses de los recortes de Javier y Laura (scripts/generar-sprites-cocina.mjs). */
const POSES: { nombre: PoseChef; pose: string; cara: Cara; giro: number; alto: number }[] = [
  { nombre: 'concentrado', pose: 'pensando', cara: 'concentrado', giro: 8, alto: 300 },
  { nombre: 'feliz', pose: 'frotar_manos_a', cara: 'feliz', giro: 8, alto: 300 },
  { nombre: 'celebra', pose: 'celebrar', cara: 'carcajada', giro: 8, alto: 300 },
  { nombre: 'susto', pose: 'boca_abierta', cara: 'sorprendido', giro: 8, alto: 300 },
  { nombre: 'presume', pose: 'jarras', cara: 'presumido', giro: 8, alto: 300 },
  { nombre: 'intro', pose: 'puno_a', cara: 'concentrado', giro: 4, alto: 560 },
];
const CHAQUETA = { cabeza: 'gorro_chef', arriba: 'chaqueta_chef' };
/** Mechones que atraviesan el gorro de chef (los de las sienes del muñeco de Javier). */
const OCULTAR: Record<'el' | 'ella', RegExp | null> = { el: /mechon_lado_(der|izq)_2/i, ella: null };

const clave = (a: AspectoJugador) => JSON.stringify([a.cuerpo, a.piel, a.pelo, a.detalles?.ropa, a.detalles?.ropa2, a.detalles?.zapatos]);
const hechos = new Map<string, Partial<Record<PoseChef, HTMLImageElement>>>();
const haciendo = new Map<string, Promise<void>>();
const respaldos = new Map<string, HTMLImageElement>();
/** Uno a la vez (cada uno abre su propio contexto 3D y lo suelta al terminar). */
let cola: Promise<void> = Promise.resolve();

/** La imagen del chef de un amigo en esa pose: la renderizada si ya está; si no, su carita con gorro (y la pide). */
export function imagenChefAmigo(a: AspectoJugador, pose: PoseChef): HTMLImageElement {
  const k = clave(a);
  const lista = hechos.get(k);
  const img = lista?.[pose] ?? lista?.concentrado;
  if (img) return img;
  void prepararChefAmigo(a);
  return respaldo(a);
}

/** ¿Ya están los recortes de este amigo? */
export const chefAmigoListo = (a: AspectoJugador) => !!hechos.get(clave(a))?.intro;

/** Hace los recortes del chef de este amigo (una vez; las demás veces devuelve el mismo trabajo). */
export function prepararChefAmigo(a: AspectoJugador): Promise<void> {
  const k = clave(a);
  let p = haciendo.get(k);
  if (!p) {
    p = cola = cola.then(() => renderizar(a).then((imgs) => void hechos.set(k, imgs)).catch((e) => console.warn('chef del amigo', e)));
    haciendo.set(k, p);
  }
  return p;
}

/** Su carita con gorro de chef (SVG), para mientras tanto. */
function respaldo(a: AspectoJugador): HTMLImageElement {
  const k = clave(a);
  let img = respaldos.get(k);
  if (img) return img;
  const cara = caritaSvg(a, 200, 'feliz').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130" width="200" height="260">
    <g transform="translate(0 26)">${cara}</g>
    <path d="M24 40 C14 38 12 22 24 19 C24 6 42 2 50 10 C58 2 76 6 76 19 C88 22 86 38 76 40 Z" fill="#fffdf8" stroke="#d9cdbd" stroke-width="2"/>
    <rect x="25" y="34" width="50" height="10" rx="4" fill="#f4ede2" stroke="#d9cdbd" stroke-width="2"/></svg>`;
  img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  respaldos.set(k, img);
  return img;
}

async function renderizar(a: AspectoJugador): Promise<Partial<Record<PoseChef, HTMLImageElement>>> {
  await elegirModelos();
  const H = 900, W = Math.round(H * 0.82);
  const lienzo = document.createElement('canvas');
  lienzo.width = W;
  lienzo.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  const p = new Personaje({ x: 0, y: 0 }, 1);
  const propios: THREE.Material[] = [];
  try {
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = 1.4;
    const escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    escena.environmentIntensity = 0.55;
    escena.add(new THREE.HemisphereLight('#fff4e8', '#d9b8a4', 0.9));
    const sol = new THREE.DirectionalLight('#fff1e2', 1.7);
    sol.position.set(-3, 5, 6);
    const borde = new THREE.DirectionalLight('#ffd6e4', 1.1);
    borde.position.set(4, 3, -4);
    escena.add(sol, borde);
    await p.cargarPoses(a.cuerpo);
    await new Vestuario(p, a.cuerpo).aplicar(CHAQUETA);
    if (p.modelo) propios.push(...teñirModelo(p.modelo, a));
    const ocultar = OCULTAR[a.cuerpo];
    if (ocultar) p.grupo.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && ocultar.test(o.name)) o.visible = false;
    });
    escena.add(p.grupo);
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
    const salida: Partial<Record<PoseChef, HTMLImageElement>> = {};
    const copia = document.createElement('canvas');
    copia.width = W;
    copia.height = H;
    const gc = copia.getContext('2d', { willReadFrequently: true })!;
    for (const pd of POSES) {
      p.rot = THREE.MathUtils.degToRad(pd.giro);
      p.sincronizar();
      p.pose(pd.pose, true);
      p.cara(pd.cara);
      for (let i = 0; i < 30; i++) p.update(1 / 30);
      p.cara(pd.cara);
      renderer.render(escena, camara);
      // Recorte al contenido (con un margencito) y escalado a la altura pedida
      gc.clearRect(0, 0, W, H);
      gc.drawImage(lienzo, 0, 0);
      const datos = gc.getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let y = 0; y < H; y += 2)
        for (let x = 0; x < W; x += 2)
          if (datos[(y * W + x) * 4 + 3] > 8) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      if (x1 <= x0 || y1 <= y0) continue;
      x0 = Math.max(0, x0 - 6);
      y0 = Math.max(0, y0 - 6);
      x1 = Math.min(W - 1, x1 + 6);
      y1 = Math.min(H - 1, y1 + 6);
      const k = pd.alto / (y1 - y0 + 1);
      const out = document.createElement('canvas');
      out.width = Math.round((x1 - x0 + 1) * k);
      out.height = pd.alto;
      const g = out.getContext('2d')!;
      g.imageSmoothingQuality = 'high';
      g.drawImage(lienzo, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, out.width, out.height);
      const img = new Image();
      img.src = out.toDataURL('image/webp', 0.88);
      await img.decode().catch(() => undefined);
      salida[pd.nombre] = img;
      // (un respiro entre pose y pose: el celular no se congela)
      await new Promise((r) => setTimeout(r, 0));
    }
    escena.environment?.dispose();
    return salida;
  } finally {
    for (const m of propios) m.dispose();
    liberarEsqueletos(p.grupo);
    renderer.dispose();
    // Suelta el contexto 3D de una vez (Android tiene pocos y la cocina es 2D)
    renderer.forceContextLoss();
  }
}
