// Utilería de las reacciones: trofeo, corona, bandera blanca, pañuelo y dados. Si existe el modelo de Blender
// (reaccion_<nombre>.glb) se usa; mientras tanto, una versión hecha aquí con el mismo estilo.
import * as THREE from 'three';
import { cargar, copia } from '../recursos';
import type { Prop } from './tipos';

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...extra });
const ORO = () => mat('#f2c75c', { metalness: 0.55, roughness: 0.3, emissive: '#5a3d00', emissiveIntensity: 0.15 });

/** Altura de cada cosa como fracción de la altura del personaje. */
const ALTO: Record<Prop, number> = { trofeo: 0.3, corona: 0.13, bandera: 0.55, panuelo: 0.16, dados: 0.09 };

function hecha(cual: Prop): THREE.Object3D {
  const g = new THREE.Group();
  if (cual === 'trofeo') {
    const perfil = [[0, 0], [0.42, 0], [0.42, 0.08], [0.2, 0.14], [0.12, 0.3], [0.1, 0.42], [0.2, 0.5], [0.5, 0.62], [0.58, 1], [0.52, 1], [0, 0.66]].map(
      ([x, y]) => new THREE.Vector2(x, y),
    );
    const copa = new THREE.Mesh(new THREE.LatheGeometry(perfil, 28), ORO());
    copa.material.side = THREE.DoubleSide;
    g.add(copa);
    for (const s of [-1, 1]) {
      const asa = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 10, 20, Math.PI * 1.2), ORO());
      asa.position.set(s * 0.58, 0.8, 0);
      asa.rotation.z = s > 0 ? -Math.PI * 0.6 : Math.PI * 1.6;
      g.add(asa);
    }
    const corazon = new THREE.Shape();
    corazon.moveTo(0, -0.1);
    corazon.bezierCurveTo(-0.22, 0.05, -0.1, 0.22, 0, 0.1);
    corazon.bezierCurveTo(0.1, 0.22, 0.22, 0.05, 0, -0.1);
    const cor = new THREE.Mesh(new THREE.ExtrudeGeometry(corazon, { depth: 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }), mat('#e86a8a'));
    cor.position.set(0, 0.74, 0.5);
    g.add(cor);
    g.scale.setScalar(1);
  } else if (cual === 'corona') {
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.46, 0.34, 32, 1, true), ORO());
    aro.material.side = THREE.DoubleSide;
    aro.position.y = 0.17;
    g.add(aro);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pico = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.36, 10), ORO());
      pico.position.set(Math.sin(a) * 0.46, 0.5, Math.cos(a) * 0.46);
      g.add(pico);
      const bola = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), ORO());
      bola.position.set(Math.sin(a) * 0.46, 0.7, Math.cos(a) * 0.46);
      g.add(bola);
      const gema = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), mat(i % 2 ? '#e86a8a' : '#9ccbef', { roughness: 0.15 }));
      gema.position.set(Math.sin(a + Math.PI / 6) * 0.49, 0.17, Math.cos(a + Math.PI / 6) * 0.49);
      g.add(gema);
    }
    g.scale.setScalar(1 / 0.76);
  } else if (cual === 'bandera') {
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 10), mat('#a8764a'));
    palo.position.y = 0.3;
    g.add(palo);
    const tela = new THREE.PlaneGeometry(0.62, 0.42, 12, 4);
    const pos = tela.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) + 0.31) * 7) * 0.04 * (pos.getX(i) + 0.31));
    tela.computeVertexNormals();
    const t = new THREE.Mesh(tela, mat('#fffdf7', { side: THREE.DoubleSide }));
    t.position.set(0.33, 0.6, 0);
    g.add(t);
  } else if (cual === 'panuelo') {
    const tela = new THREE.PlaneGeometry(0.8, 0.8, 8, 8);
    const pos = tela.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 6) * 0.05 + Math.cos(pos.getY(i) * 5) * 0.04);
    tela.computeVertexNormals();
    const p = new THREE.Mesh(tela, mat('#fbd6df', { side: THREE.DoubleSide }));
    p.rotation.z = Math.PI / 4;
    p.position.y = 0.3;
    g.add(p);
  } else if (cual === 'dados') {
    for (const [x, r] of [[-0.55, 0.3], [0.55, -0.4]] as const) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 3, 3, 3), mat('#fff8ee', { roughness: 0.35 }));
      d.position.set(x, 0.5, 0);
      d.rotation.set(r, r * 1.3, r * 0.6);
      const pip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat('#e4574b'));
      pip.position.set(0, 0, 0.5);
      d.add(pip);
      g.add(d);
    }
  }
  return g;
}

/** La utilería lista para colgar, medida en unidades del personaje (sin su escala). */
export function utileria(cual: Prop, altoPersonaje: number): THREE.Object3D {
  const raiz = new THREE.Group();
  const cont = new THREE.Group();
  raiz.add(cont);
  const medir = (o: THREE.Object3D) => {
    const caja = new THREE.Box3().setFromObject(o);
    const h = caja.max.y - caja.min.y || 1;
    const k = (ALTO[cual] * altoPersonaje) / h;
    o.scale.multiplyScalar(k);
  };
  const propia = hecha(cual);
  medir(propia);
  cont.add(propia);
  // El modelo de Blender reemplaza al hecho aquí si ya existe
  cargar(`reaccion_${cual}.glb`)
    .then((original) => {
      const m = copia(original);
      m.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true;
      });
      medir(m);
      cont.clear();
      cont.add(m);
    })
    .catch(() => undefined);
  raiz.visible = false;
  return raiz;
}
