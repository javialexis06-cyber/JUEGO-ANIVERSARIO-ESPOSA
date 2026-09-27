// Modelos de la casa y la tienda (plantas, peluches, cuadros, comida…) puestos a la medida que pide el acertijo.
import * as THREE from 'three';
import { cargar, copia } from '../recursos';

/** Carga `nombre`.glb, lo escala para que mida `alto` metros y lo apoya en y = 0. */
export async function modelo(nombre: string, alto: number): Promise<THREE.Object3D> {
  const o = copia(await cargar(`${nombre}.glb`));
  const caja = new THREE.Box3().setFromObject(o);
  const t = caja.getSize(new THREE.Vector3());
  const k = alto / Math.max(t.y, 0.001);
  o.scale.multiplyScalar(k);
  const g = new THREE.Group();
  g.name = nombre;
  o.position.y -= caja.min.y * k;
  o.position.x -= ((caja.min.x + caja.max.x) / 2) * k;
  o.position.z -= ((caja.min.z + caja.max.z) / 2) * k;
  o.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  g.add(o);
  return g;
}
