// Los colores del perfil de un amigo puestos sobre el muñeco (el de Javier o el de Laura como base): piel, pelo,
// ojos, cejas, rubor, y la camiseta, el pantalón, las medias y los zapatos de fábrica. Se cambian COPIAS de los
// materiales: los del modelo los comparten todos los muñecos del juego, y el color de un amigo no se le puede pegar
// a nadie más. (La ropa del creador la pinta `vestir.ts`.)
import * as THREE from 'three';
import type { AspectoJugador } from './tipos';

type Regla = [RegExp, (a: AspectoJugador) => string | undefined, number];

const det = (a: AspectoJugador, k: string) => a.detalles?.[k];
/** Un color de verdad (no «no» ni vacío). */
const color = (v: string | undefined) => (v && /^#[0-9a-f]{6}$/i.test(v) ? v : undefined);

/** Qué partes del muñeco toman cada color (por el nombre del material) y qué tanto (las orejas, más oscuras). */
const TINTES: Regla[] = [
  [/piel/i, (a) => a.piel, 1],
  [/interior oreja/i, (a) => a.piel, 0.85],
  [/cabello|\bpelo\b|mechon/i, (a) => a.pelo, 1],
  // (las cejas, del color escogido o un poquito más oscuras que el pelo)
  [/cejas/i, (a) => color(det(a, 'cejas')) ?? (a.pelo ? `#${new THREE.Color(a.pelo).multiplyScalar(0.7).getHexString()}` : undefined), 1],
  [/ojos charol/i, (a) => color(det(a, 'ojos')), 1],
  [/brillo rubor/i, () => undefined, 1],
  [/rubor/i, (a) => color(det(a, 'rubor')), 1],
  [/camiseta|chaleco/i, (a) => det(a, 'ropa'), 1],
  [/medias/i, (a) => color(det(a, 'medias')) ?? det(a, 'ropa2'), 1],
  [/pantalon|shorts/i, (a) => det(a, 'ropa2'), 1],
  [/tenis|cordones/i, (a) => det(a, 'zapatos'), 1],
];

/** Partes que el amigo quitó («sin cejas», «sin rubor»): su material queda invisible. */
const OCULTAS: [RegExp, string][] = [
  [/cejas/i, 'cejas'],
  [/rubor/i, 'rubor'],
];

/** Tiñe estas mallas y devuelve los materiales nuevos (para soltarlos al final con `dispose`). */
export function teñirMallas(mallas: Iterable<THREE.Object3D>, a: AspectoJugador): THREE.Material[] {
  const copias = new Map<THREE.Material, THREE.Material>();
  const propios: THREE.Material[] = [];
  for (const o of mallas) {
    const m = o as THREE.Mesh;
    if (!m.isMesh) continue;
    const cambiar = (mat: THREE.Material) => {
      const oculta = OCULTAS.find(([rx, k]) => rx.test(mat.name) && det(a, k) === 'no');
      const regla = TINTES.find(([rx]) => rx.test(mat.name));
      const c0 = regla?.[1](a);
      if (!oculta && (!regla || !c0)) return mat;
      let c = copias.get(mat);
      if (!c) {
        c = mat.clone();
        const std = c as THREE.MeshStandardMaterial;
        if (oculta) c.visible = false;
        else if (std.color) std.color.set(c0!).multiplyScalar(regla![2]);
        copias.set(mat, c);
        propios.push(c);
      }
      return c;
    };
    m.material = Array.isArray(m.material) ? m.material.map(cambiar) : cambiar(m.material);
  }
  return propios;
}

/** Tiñe el muñeco entero y devuelve los materiales nuevos (para soltarlos al final con `dispose`). */
export function teñirModelo(raiz: THREE.Object3D, a: AspectoJugador): THREE.Material[] {
  const mallas: THREE.Object3D[] = [];
  raiz.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) mallas.push(o);
  });
  return teñirMallas(mallas, a);
}
