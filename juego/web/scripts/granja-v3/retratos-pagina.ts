// Página para scripts/granja-v3/retratos-vecinos.mjs: arma a cada vecino de peluche y le toma la foto.
import * as THREE from 'three';
import { vecinoPeluche } from '../../src/granja-v3/vecinos3d';
import { NPC_ASTRA } from '../../src/granja-v3/astra';
import { NPCS_PUEBLO } from '../../src/granja-v3/pueblo-datos';
const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c') as HTMLCanvasElement, alpha: true, antialias: true, preserveDrawingBuffer: true });
r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.AgXToneMapping; r.toneMappingExposure = 1.15; r.setClearColor(0, 0);
const escena = new THREE.Scene();
escena.add(new THREE.HemisphereLight('#fff8e5', '#8a9a70', 1.9));
const sol = new THREE.DirectionalLight('#fff0d7', 2.6); sol.position.set(1.5, 3, 4); escena.add(sol);
const relleno = new THREE.DirectionalLight('#cfe3ff', .9); relleno.position.set(-3, 1.5, 2); escena.add(relleno);
const cam = new THREE.PerspectiveCamera(26, 1, .05, 50);
(window as any).ids = [...new Set([...NPCS_PUEBLO.map((n) => n.id), ...NPC_ASTRA.map((n) => n.id)])];
const mallas = (g: THREE.Object3D) => { let n = 0; g.traverse((o) => { if ((o as THREE.Mesh).isMesh) n++; }); return n; };
(window as any).foto = async (id: string, i: number) => {
  const g = vecinoPeluche(id, i); escena.add(g);
  // Espera a que lo vistan (las mallas dejan de cambiar)
  let antes = -1, igual = 0;
  for (let k = 0; k < 160 && igual < 6; k++) { await new Promise((ok) => setTimeout(ok, 120)); const n = mallas(g); igual = n === antes && n > 3 ? igual + 1 : 0; antes = n; }
  g.rotation.y = -0.32; g.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(g), alto = caja.max.y - caja.min.y, cx = (caja.max.x + caja.min.x) / 2;
  const mira = new THREE.Vector3(cx, caja.max.y - alto * 0.3, 0);
  cam.position.set(cx + alto * 0.38, mira.y + alto * 0.05, alto * 2.6); cam.lookAt(mira);
  r.render(escena, cam);
  const c = document.createElement('canvas'); c.width = c.height = 160; c.getContext('2d')!.drawImage(r.domElement, 0, 0, 160, 160);
  escena.remove(g);
  return c.toDataURL('image/webp', 0.88);
};
(window as any).listo = true;
