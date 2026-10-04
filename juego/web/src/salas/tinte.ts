// Los colores del perfil de un amigo puestos sobre el muñeco (el de Javier o el de Laura como base): piel, pelo,
// camiseta, pantalón y zapatos. Se cambian COPIAS de los materiales: los del modelo los comparten todos los
// muñecos del juego, y el color de un amigo no se le puede pegar a nadie más.
import * as THREE from 'three';
import type { AspectoJugador } from './tipos';

/** Qué partes del muñeco toman cada color (por el nombre del material) y qué tanto (las orejas y cejas, más oscuras). */
const TINTES: [RegExp, (a: AspectoJugador) => string | undefined, number][] = [
  [/piel/i, (a) => a.piel, 1],
  [/interior oreja/i, (a) => a.piel, 0.85],
  [/cabello|\bpelo\b|mechon/i, (a) => a.pelo, 1],
  [/cejas/i, (a) => a.pelo, 0.7],
  [/camiseta|chaleco/i, (a) => a.detalles?.ropa, 1],
  [/pantalon|shorts|medias/i, (a) => a.detalles?.ropa2, 1],
  [/tenis|cordones/i, (a) => a.detalles?.zapatos, 1],
];

/** Tiñe el muñeco y devuelve los materiales nuevos (para soltarlos al final con `dispose`). */
export function teñirModelo(raiz: THREE.Object3D, a: AspectoJugador): THREE.Material[] {
  const copias = new Map<THREE.Material, THREE.Material>();
  const propios: THREE.Material[] = [];
  raiz.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const cambiar = (mat: THREE.Material) => {
      const regla = TINTES.find(([rx]) => rx.test(mat.name));
      const color = regla?.[1](a);
      if (!regla || !color) return mat;
      let c = copias.get(mat);
      if (!c) {
        c = mat.clone();
        const std = c as THREE.MeshStandardMaterial;
        if (std.color) std.color.set(color).multiplyScalar(regla[2]);
        copias.set(mat, c);
        propios.push(c);
      }
      return c;
    };
    m.material = Array.isArray(m.material) ? m.material.map(cambiar) : cambiar(m.material);
  });
  return propios;
}
