// Utilería de las reacciones: trofeo, corona, bandera blanca, pañuelo y dados. Si existe el modelo de Blender
// (reaccion_<nombre>.glb) se usa; mientras tanto, una versión hecha aquí con el mismo estilo.
import * as THREE from 'three';
import { cargar, copia } from '../recursos';
import type { Prop } from './tipos';

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...extra });
const ORO = () => mat('#f2c75c', { metalness: 0.55, roughness: 0.3, emissive: '#5a3d00', emissiveIntensity: 0.15 });

/** Altura de cada cosa como fracción de la altura del personaje. */
const ALTO: Record<Prop, number> = {
  trofeo: 0.3, corona: 0.13, bandera: 0.55, panuelo: 0.16, dados: 0.09,
  guitarra: 0.62, almohada: 0.2, pastel: 0.2, chocolate: 0.1, lupa: 0.22, anillo: 0.08, camara: 0.12, ramo: 0.38, globo: 0.7,
  microfono: 0.2, tablero: 0.06, taza: 0.1, helado: 0.2, sombrilla: 0.7, libro: 0.16, carta: 0.1, peluche: 0.26, palomitas: 0.18,
  abanico: 0.2, sombrero: 0.16,
};

const CON_MODELO = new Set<Prop>(['trofeo', 'corona', 'bandera', 'panuelo', 'dados']);

/** De dónde se agarra cada cosa: una mano (la derecha del personaje), las dos, o puesta en la cabeza. */
export const AGARRE: Partial<Record<Prop, 'dos' | 'cabeza'>> = {
  dados: 'dos', guitarra: 'dos', almohada: 'dos', pastel: 'dos', tablero: 'dos', palomitas: 'dos',
  libro: 'dos', corona: 'cabeza', sombrero: 'cabeza',
};

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
  else extra(cual, g);
  return g;
}

const cilindro = (r1: number, r2: number, h: number, m: THREE.Material, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m);
const bola = (r: number, m: THREE.Material) => new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m);
const caja = (x: number, y: number, z: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z, 2, 2, 2), m);
const en = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number, g?: THREE.Object3D) => {
  o.position.set(x, y, z);
  g?.add(o);
  return o;
};
function corazonForma(r = 0.2) {
  const f = new THREE.Shape();
  f.moveTo(0, -r);
  f.bezierCurveTo(-r * 2.2, r * 0.5, -r, r * 2.2, 0, r);
  f.bezierCurveTo(r, r * 2.2, r * 2.2, r * 0.5, 0, -r);
  return f;
}

/** La utilería de las escenas premium (modelos sencillos en el mismo estilo de plastilina). */
function extra(cual: Prop, g: THREE.Group) {
  const madera = mat('#b9793f'), crema = mat('#fff8ee'), rosa = mat('#e86a8a'), azul = mat('#5b8fd6'), cacao = mat('#6b4632');
  switch (cual) {
    case 'guitarra': {
      const cuerpo = new THREE.Group();
      en(cilindro(0.3, 0.3, 0.12, madera), 0, 0, 0, cuerpo).rotation.x = Math.PI / 2;
      en(cilindro(0.22, 0.22, 0.12, madera), 0, 0.33, 0, cuerpo).rotation.x = Math.PI / 2;
      en(cilindro(0.08, 0.08, 0.13, cacao), 0, 0.12, 0.01, cuerpo).rotation.x = Math.PI / 2;
      en(caja(0.08, 0.75, 0.05, cacao), 0, 0.8, 0.02, cuerpo);
      en(caja(0.14, 0.16, 0.05, cacao), 0, 1.22, 0.02, cuerpo);
      cuerpo.rotation.z = -0.9;
      g.add(cuerpo);
      break;
    }
    case 'almohada': {
      const a = bola(0.5, crema);
      a.scale.set(1, 0.45, 0.7);
      en(a, 0, 0.25, 0, g);
      break;
    }
    case 'pastel': {
      en(cilindro(0.4, 0.4, 0.05, mat('#e8e2da')), 0, 0.02, 0, g);
      en(cilindro(0.33, 0.33, 0.28, mat('#f4b6c2')), 0, 0.19, 0, g);
      en(cilindro(0.34, 0.34, 0.06, crema), 0, 0.34, 0, g);
      en(bola(0.07, mat('#e4574b')), 0, 0.42, 0, g);
      break;
    }
    case 'chocolate': {
      en(caja(0.5, 0.08, 0.3, cacao), 0, 0.04, 0, g);
      en(caja(0.52, 0.09, 0.2, rosa), 0, 0.045, 0, g);
      break;
    }
    case 'lupa': {
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 10, 28), mat('#3d2b27'));
      en(aro, 0, 0.55, 0, g);
      const vidrio = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), mat('#cfe9ff', { transparent: true, opacity: 0.5, roughness: 0.05 }));
      en(vidrio, 0, 0.55, 0, g);
      en(cilindro(0.04, 0.05, 0.35, madera), 0, 0.18, 0, g);
      break;
    }
    case 'anillo': {
      en(caja(0.3, 0.2, 0.3, rosa), 0, 0.1, 0, g);
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 10, 24), ORO());
      en(aro, 0, 0.25, 0, g);
      en(new THREE.Mesh(new THREE.OctahedronGeometry(0.05), mat('#dff4ff', { roughness: 0.05, metalness: 0.2 })), 0, 0.34, 0, g);
      break;
    }
    case 'camara': {
      en(caja(0.5, 0.32, 0.22, mat('#3d2b27')), 0, 0.16, 0, g);
      en(cilindro(0.1, 0.12, 0.14, mat('#9a8f86')), 0, 0.16, 0.16, g).rotation.x = Math.PI / 2;
      en(caja(0.12, 0.06, 0.08, crema), -0.14, 0.35, 0, g);
      break;
    }
    case 'ramo': {
      en(cilindro(0.04, 0.12, 0.45, mat('#6fbf73')), 0, 0.22, 0, g);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        en(bola(0.1, i % 2 ? rosa : mat('#e4574b')), Math.sin(a) * 0.13, 0.5 + (i % 3) * 0.03, Math.cos(a) * 0.13, g);
      }
      en(bola(0.1, mat('#f6cf5a')), 0, 0.56, 0, g);
      break;
    }
    case 'globo': {
      const c = new THREE.Mesh(new THREE.ExtrudeGeometry(corazonForma(0.18), { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }), rosa);
      en(c, 0, 0.95, -0.06, g);
      en(cilindro(0.005, 0.005, 0.95, crema, 6), 0, 0.45, 0, g);
      break;
    }
    case 'microfono': {
      en(bola(0.09, mat('#9a8f86')), 0, 0.38, 0, g);
      en(cilindro(0.04, 0.03, 0.3, mat('#3d2b27')), 0, 0.17, 0, g);
      break;
    }
    case 'tablero': {
      en(caja(0.9, 0.05, 0.9, mat('#c98b5a')), 0, 0.025, 0, g);
      en(caja(0.8, 0.02, 0.8, crema), 0, 0.055, 0, g);
      break;
    }
    case 'taza': {
      en(cilindro(0.12, 0.1, 0.22, crema), 0, 0.11, 0, g);
      en(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), crema), 0.13, 0.12, 0, g);
      en(cilindro(0.11, 0.11, 0.01, cacao), 0, 0.21, 0, g);
      break;
    }
    case 'helado': {
      en(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 16), mat('#d9a066')), 0, 0.15, 0, g).rotation.x = Math.PI;
      en(bola(0.12, mat('#f4b6c2')), 0, 0.33, 0, g);
      en(bola(0.1, mat('#fff3c4')), 0, 0.45, 0, g);
      break;
    }
    case 'sombrilla': {
      en(cilindro(0.015, 0.015, 0.9, cacao, 8), 0, 0.45, 0, g);
      const tela = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.22, 12, 1, true), mat('#9ccbef', { side: THREE.DoubleSide }));
      en(tela, 0, 0.95, 0, g);
      break;
    }
    case 'libro': {
      en(caja(0.4, 0.06, 0.3, rosa), 0, 0.03, 0, g);
      en(caja(0.38, 0.05, 0.28, crema), 0, 0.035, 0.005, g);
      break;
    }
    case 'carta': {
      en(caja(0.4, 0.26, 0.02, crema), 0, 0.13, 0, g);
      const c = new THREE.Mesh(new THREE.ShapeGeometry(corazonForma(0.04)), rosa);
      en(c, 0, 0.13, 0.012, g);
      break;
    }
    case 'peluche': {
      const cafe = mat('#b98a64');
      en(bola(0.18, cafe), 0, 0.2, 0, g).scale.set(1, 1.1, 0.9);
      en(bola(0.15, cafe), 0, 0.48, 0, g);
      for (const s of [-1, 1]) en(bola(0.06, cafe), s * 0.11, 0.6, 0, g);
      const cor = new THREE.Mesh(new THREE.ShapeGeometry(corazonForma(0.05)), rosa);
      en(cor, 0, 0.22, 0.17, g);
      break;
    }
    case 'palomitas': {
      en(cilindro(0.2, 0.15, 0.35, mat('#e4574b')), 0, 0.17, 0, g);
      for (let i = 0; i < 9; i++) en(bola(0.06, mat('#fff3c4')), Math.sin(i * 2.4) * 0.12, 0.38 + (i % 3) * 0.04, Math.cos(i * 2.4) * 0.12, g);
      break;
    }
    case 'abanico': {
      const t = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16, 0, Math.PI), mat('#f4b6c2', { side: THREE.DoubleSide }));
      en(t, 0, 0.3, 0, g);
      en(cilindro(0.02, 0.02, 0.3, cacao, 6), 0, 0.15, 0, g);
      break;
    }
    case 'sombrero': {
      en(cilindro(0.4, 0.4, 0.03, mat('#f6cf5a')), 0, 0.015, 0, g);
      en(cilindro(0.22, 0.25, 0.25, mat('#f6cf5a')), 0, 0.14, 0, g);
      en(cilindro(0.255, 0.255, 0.06, rosa), 0, 0.06, 0, g);
      break;
    }
  }
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
  // El modelo de Blender reemplaza al hecho aquí (solo existen los de las reacciones de los juegos)
  if (!CON_MODELO.has(cual)) {
    raiz.visible = false;
    return raiz;
  }
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
