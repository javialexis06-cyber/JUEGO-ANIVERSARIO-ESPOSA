// Los íconos del Escudo salen de los mismos modelos de Blender: cada torre y cada enemigo se dibuja una vez en un
// lienzo aparte (transparente) y se guarda como imagen. Ese WebGL se suelta apenas termina.
import * as THREE from 'three';
import { ORDEN_TORRES, type IdEnemigo, type IdTorre } from './datos';
import type { EscenaEscudo } from './escena';

export interface Iconos { torre: Record<IdTorre, string>; enemigo: Record<IdEnemigo, string>; rama: Record<string, string> }

export function hacerIconos(esc: EscenaEscudo): Iconos {
  const tam = 128;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = tam;
  const r = new THREE.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(tam, tam, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.25;
  const escena = new THREE.Scene();
  escena.add(new THREE.HemisphereLight('#ffffff', '#6a5a8a', 2.0));
  const sol = new THREE.DirectionalLight('#fff4e0', 2.2);
  sol.position.set(3, 6, 5);
  escena.add(sol);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const foto = (o: THREE.Object3D, alto: number, mirar = 0.5) => {
    escena.add(o);
    const caja = new THREE.Box3().setFromObject(o);
    const c = caja.getCenter(new THREE.Vector3());
    const t = caja.getSize(new THREE.Vector3());
    const d = Math.max(t.y, t.x, t.z) * alto;
    cam.position.set(c.x + d * 0.55, c.y + d * 0.55 * mirar + t.y * 0.1, c.z + d * 1.05);
    cam.lookAt(c.x, c.y, c.z);
    r.clear();
    r.render(escena, cam);
    const url = lienzo.toDataURL('image/png');
    escena.remove(o);
    return url;
  };
  const torre = {} as Record<IdTorre, string>;
  const rama: Record<string, string> = {};
  for (const t of ORDEN_TORRES) {
    torre[t] = foto(esc.armarTorreSuelta(t, 1), 1.75);
    for (const rr of ['a', 'b'] as const) rama[`${t}_${rr}`] = foto(esc.armarTorreSuelta(t, 3, rr), 1.75);
  }
  const enemigo = {} as Record<IdEnemigo, string>;
  for (const e of ['mota', 'motita', 'sombra', 'golem', 'polilla', 'divisora', 'jefe'] as IdEnemigo[]) {
    const { o } = esc.enemigoSuelto(e);
    o.rotation.y = 0.5;
    enemigo[e] = foto(o, 1.45, 0.4);
  }
  r.dispose();
  r.forceContextLoss();
  return { torre, enemigo, rama };
}
