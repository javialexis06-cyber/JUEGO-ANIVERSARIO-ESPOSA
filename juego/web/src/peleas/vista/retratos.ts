// Los retratos de los luchadores (la cara y los hombros, con su pose de entrada) para la pantalla de selección y la
// barra de vida: se dibujan una vez con el mismo renderizador en una textura aparte y se guardan en el aparato
// (los del retrador no: cambian con su perfil).
import * as THREE from 'three';
import type { AspectoJugador } from '../../salas/tipos';
import type { DefLuchador } from '../tipos';
import { Muneco } from './muneco';

const VERSION = 'peleas-retratos-3';
const memoria = new Map<string, Promise<string>>();
let cola: Promise<unknown> = Promise.resolve();

function leerGuardado(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(VERSION) ?? '{}');
  } catch {
    return {};
  }
}
function guardar(id: string, url: string) {
  try {
    const g = leerGuardado();
    g[id] = url;
    localStorage.setItem(VERSION, JSON.stringify(g));
  } catch {
    /* sin espacio: se vuelve a dibujar la próxima vez */
  }
}

/** El retrato (data URL) de un luchador; se dibujan de a uno para no trabar el celular. */
export function retrato(renderer: THREE.WebGLRenderer, def: DefLuchador, aspecto?: AspectoJugador): Promise<string> {
  const clave = def.aspecto === 'jugador' ? `retador:${JSON.stringify(aspecto ?? {})}` : def.id;
  let p = memoria.get(clave);
  if (p) return p;
  const guardado = def.aspecto === 'jugador' ? undefined : leerGuardado()[def.id];
  if (guardado) {
    p = Promise.resolve(guardado);
    memoria.set(clave, p);
    return p;
  }
  p = (cola = cola.then(() => dibujar(renderer, def, aspecto))) as Promise<string>;
  memoria.set(clave, p);
  void p.then((url) => def.aspecto !== 'jugador' && url && guardar(def.id, url));
  return p;
}

async function dibujar(renderer: THREE.WebGLRenderer, def: DefLuchador, aspecto?: AspectoJugador): Promise<string> {
  const m = new Muneco(def, aspecto);
  await m.cargar();
  const escena = new THREE.Scene();
  escena.add(new THREE.HemisphereLight('#fff6ea', '#c9a58e', 1.3));
  const sol = new THREE.DirectionalLight('#fff1e2', 2.4);
  sol.position.set(-2, 4, 5);
  const borde = new THREE.DirectionalLight(def.color, 2.2);
  borde.position.set(3, 2, -3);
  escena.add(sol, borde, m.raiz);
  // De frente, un poquito girado, con la cara de presumir
  m.p.rot = -0.35;
  m.p.cara('presumido');
  m.p.pose('reposo', true);
  for (let i = 0; i < 3; i++) m.p.update(0.05);
  m.raiz.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(m.raiz);
  const alto = caja.max.y;
  const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
  cam.position.set(0.15, alto * 0.74, 3.2 * (alto / 1.76));
  cam.lookAt(0, alto * 0.7, 0);
  const tam = 192;
  const rt = new THREE.WebGLRenderTarget(tam, tam, { samples: 4, colorSpace: THREE.SRGBColorSpace });
  const antes = renderer.getRenderTarget();
  const tono = renderer.toneMapping;
  const exp = renderer.toneMappingExposure;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(escena, cam);
  const px = new Uint8Array(tam * tam * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, tam, tam, px);
  renderer.setRenderTarget(antes);
  renderer.toneMapping = tono;
  renderer.toneMappingExposure = exp;
  rt.dispose();
  m.liberar();
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const g = c.getContext('2d')!;
  const img = g.createImageData(tam, tam);
  // (la textura viene de abajo hacia arriba)
  for (let y = 0; y < tam; y++) img.data.set(px.subarray((tam - 1 - y) * tam * 4, (tam - y) * tam * 4), y * tam * 4);
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/webp', 0.85);
}
