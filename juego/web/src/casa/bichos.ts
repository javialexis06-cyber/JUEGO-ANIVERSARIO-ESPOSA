// Los bichos de los eventos graciosos del baño: un ratón que cruza corriendo, cucarachas (una vuela), una araña que
// baja del techo, una mosca que ronda la cabeza y una lagartija en la pared. Hechos con figuras simples de plastilina
// (unas pocas esferas), y se borran solos al rato. Las coordenadas son las del piso de Blender (x, y) → aTres.
import * as THREE from 'three';
import { aTres } from '../mundo';

export type TipoBicho = 'raton' | 'cucaracha' | 'arana' | 'mosca' | 'lagartija';

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
const bola = (r: number, m: THREE.Material, sx = 1, sy = 1, sz = 1) => {
  const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m);
  b.scale.set(sx, sy, sz);
  return b;
};
const palo = (largo: number, grosor: number, m: THREE.Material) => {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(grosor, grosor, largo, 5), m);
  p.geometry.translate(0, -largo / 2, 0);
  return p;
};

/** Cada bicho mira hacia -z local (su nariz) y camina en el plano del piso (o de la pared). */
function modelo(tipo: TipoBicho): { g: THREE.Group; patas: THREE.Object3D[]; alas: THREE.Object3D[]; cola?: THREE.Object3D } {
  const g = new THREE.Group();
  const patas: THREE.Object3D[] = [];
  const alas: THREE.Object3D[] = [];
  const negro = mat('#1f1716', { roughness: 0.4 });
  const ojo = (x: number, y: number, z: number, r = 0.008) => {
    const o = bola(r, negro);
    o.position.set(x, y, z);
    g.add(o);
  };
  switch (tipo) {
    case 'raton': {
      const gris = mat('#9b95a3'), rosa = mat('#f2a5b8');
      const cuerpo = bola(0.07, gris, 0.85, 0.7, 1.25);
      cuerpo.position.y = 0.05;
      g.add(cuerpo);
      const cabeza = bola(0.045, gris, 1, 0.9, 1.2);
      cabeza.position.set(0, 0.065, -0.1);
      g.add(cabeza);
      const nariz = bola(0.012, rosa);
      nariz.position.set(0, 0.062, -0.155);
      g.add(nariz);
      for (const s of [-1, 1]) {
        const oreja = bola(0.028, rosa, 1, 1, 0.3);
        oreja.position.set(s * 0.035, 0.105, -0.085);
        g.add(oreja);
        ojo(s * 0.02, 0.08, -0.14);
        for (const z of [-0.05, 0.05]) {
          const pata = bola(0.014, rosa, 1, 0.6, 1.4);
          pata.position.set(s * 0.04, 0.008, z);
          g.add(pata);
          patas.push(pata);
        }
      }
      const cola = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.04, 0.08), new THREE.Vector3(0.03, 0.03, 0.16), new THREE.Vector3(-0.02, 0.05, 0.24), new THREE.Vector3(0.03, 0.08, 0.3)]), 12, 0.006, 5), rosa);
      g.add(cola);
      return { g, patas, alas, cola };
    }
    case 'cucaracha': {
      const cafe = mat('#6b3a22', { roughness: 0.35 });
      const cuerpo = bola(0.035, cafe, 0.75, 0.4, 1.35);
      cuerpo.position.y = 0.02;
      g.add(cuerpo);
      const cabeza = bola(0.017, cafe);
      cabeza.position.set(0, 0.02, -0.05);
      g.add(cabeza);
      for (const s of [-1, 1]) {
        const antena = palo(0.08, 0.002, cafe);
        antena.position.set(s * 0.008, 0.025, -0.06);
        antena.rotation.set(-1.9, 0, s * 0.35);
        g.add(antena);
        for (const z of [-0.025, 0, 0.025]) {
          const pata = palo(0.04, 0.003, cafe);
          pata.position.set(s * 0.02, 0.02, z);
          pata.rotation.z = s * 1.1;
          g.add(pata);
          patas.push(pata);
        }
        const ala = bola(0.03, mat('#8a4c2c', { transparent: true, opacity: 0.85 }), 0.5, 0.15, 1.2);
        ala.position.set(s * 0.015, 0.035, 0.005);
        g.add(ala);
        alas.push(ala);
      }
      return { g, patas, alas };
    }
    case 'arana': {
      const cuerpo = bola(0.04, negro, 1, 0.9, 1);
      g.add(cuerpo);
      const cabeza = bola(0.025, negro);
      cabeza.position.set(0, -0.01, -0.045);
      g.add(cabeza);
      const blanco = mat('#ffffff');
      for (const s of [-1, 1]) {
        const o = bola(0.009, blanco);
        o.position.set(s * 0.011, 0.0, -0.066);
        g.add(o);
        for (let i = 0; i < 4; i++) {
          const pata = palo(0.08, 0.0035, negro);
          pata.position.set(s * 0.02, 0, -0.03 + i * 0.02);
          pata.rotation.set(0, (i - 1.5) * 0.35 * s, s * 2.1);
          g.add(pata);
          patas.push(pata);
        }
      }
      // El hilo hacia el techo
      const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 3, 3), mat('#ffffff', { transparent: true, opacity: 0.7 }));
      hilo.geometry.translate(0, 1.5, 0);
      hilo.name = 'hilo';
      g.add(hilo);
      return { g, patas, alas };
    }
    case 'mosca': {
      const cuerpo = bola(0.022, negro, 0.9, 0.8, 1.2);
      g.add(cuerpo);
      const rojo = mat('#b0302a', { roughness: 0.3 });
      for (const s of [-1, 1]) {
        const o = bola(0.01, rojo);
        o.position.set(s * 0.012, 0.006, -0.02);
        g.add(o);
        const ala = bola(0.028, mat('#dfeaf2', { transparent: true, opacity: 0.55 }), 1.2, 0.1, 0.6);
        ala.position.set(s * 0.025, 0.02, 0.005);
        g.add(ala);
        alas.push(ala);
      }
      return { g, patas, alas };
    }
    case 'lagartija': {
      const verde = mat('#6bbf6a'), claro = mat('#a8dc8e');
      const cuerpo = bola(0.05, verde, 0.6, 0.35, 1.5);
      g.add(cuerpo);
      const cabeza = bola(0.03, verde, 0.9, 0.55, 1.3);
      cabeza.position.set(0, 0.005, -0.09);
      g.add(cabeza);
      const cola = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0.06), new THREE.Vector3(0.03, 0, 0.14), new THREE.Vector3(-0.02, 0, 0.22), new THREE.Vector3(0.02, 0, 0.28)]), 12, 0.012, 5), verde);
      g.add(cola);
      for (const s of [-1, 1]) {
        ojo(s * 0.018, 0.018, -0.1, 0.009);
        for (const z of [-0.04, 0.04]) {
          const pata = bola(0.014, claro, 1.4, 0.4, 1);
          pata.position.set(s * 0.045, 0, z);
          g.add(pata);
          patas.push(pata);
        }
      }
      return { g, patas, alas, cola };
    }
  }
}

interface Bicho {
  tipo: TipoBicho;
  g: THREE.Group;
  patas: THREE.Object3D[];
  alas: THREE.Object3D[];
  cola?: THREE.Object3D;
  t: number;
  fase: number;
  /** Camino por el piso (x, y de Blender) que recorre en bucle. */
  camino: { x: number; y: number }[];
  i: number;
  vel: number;
  x: number;
  y: number;
  /** Salta volando de vez en cuando (la cucaracha voladora). */
  vuela?: number;
}

export class Bichos {
  private lista: Bicho[] = [];
  private vida = 0;

  constructor(private padre: () => THREE.Object3D | null) {}

  /** ¿Hay bichos a la vista? */
  get hay() {
    return this.lista.length > 0 || !!this.charco;
  }

  /**
   * Suelta bichos alrededor de un punto (el inodoro o la cabeza del personaje).
   * `cerca` es el punto de interés (x, y de Blender) y `cabeza` su altura (para la araña y la mosca).
   */
  soltar(tipo: TipoBicho, n: number, cerca: { x: number; y: number }, cabeza = 1.1, seg = 30) {
    this.quitar();
    const padre = this.padre();
    if (!padre) return;
    this.vida = seg;
    for (let k = 0; k < n; k++) {
      const m = modelo(tipo);
      const b: Bicho = { tipo, ...m, t: 0, fase: Math.random() * 6, camino: [], i: 0, vel: 0.9, x: cerca.x, y: cerca.y };
      if (tipo === 'raton') {
        // Entra por la puerta del baño, pasa al lado del inodoro y da vueltas por el piso
        b.camino = [{ x: 2.2, y: 1.7 }, { x: 1.2, y: 0.4 }, { x: cerca.x + 0.6, y: cerca.y - 0.9 }, { x: cerca.x - 0.3, y: cerca.y - 0.7 }, { x: -0.4, y: -0.6 }, { x: 0.9, y: -0.9 }, { x: 1.6, y: 0.2 }];
        b.x = 2.4;
        b.y = 1.9;
        b.vel = 1.5;
        m.g.scale.setScalar(2.6);
      } else if (tipo === 'cucaracha') {
        const a0 = (k / n) * Math.PI * 2;
        b.camino = Array.from({ length: 6 }, (_, j) => ({ x: cerca.x + 0.5 + Math.cos(a0 + j * 1.1) * (0.5 + (j % 2) * 0.35), y: cerca.y - 0.9 + Math.sin(a0 + j * 1.1) * 0.5 }));
        b.x = b.camino[0].x;
        b.y = b.camino[0].y;
        b.vel = 0.7 + Math.random() * 0.5;
        if (k === 0) b.vuela = 3;
        m.g.scale.setScalar(2.8);
      } else if (tipo === 'lagartija') {
        // En la pared del fondo, al lado del inodoro
        b.x = cerca.x + 0.55;
        b.y = 2.08;
        m.g.scale.setScalar(2.4);
      } else {
        b.x = cerca.x;
        b.y = cerca.y - 0.25;
        m.g.scale.setScalar(tipo === 'arana' ? 2.4 : 2.2);
      }
      this.poner(b, cabeza);
      padre.add(m.g);
      this.lista.push(b);
    }
    this.cabeza = cabeza;
  }

  private cabeza = 1.1;
  private charco: THREE.Mesh | null = null;
  private tCharco = 0;

  /** El inodoro tapado: el agua va saliendo y se riega por el piso. */
  agua(cerca: { x: number; y: number }, seg = 30) {
    this.quitar();
    const padre = this.padre();
    if (!padre) return;
    this.vida = seg;
    this.tCharco = 0;
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshStandardMaterial({ color: '#8fd3f2', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.72 }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.copy(aTres(cerca.x + 0.2, cerca.y - 0.45, 0.012));
    m.scale.setScalar(0.05);
    padre.add(m);
    this.charco = m;
  }

  quitar() {
    if (this.charco) {
      this.charco.removeFromParent();
      this.charco.geometry.dispose();
      (this.charco.material as THREE.Material).dispose();
      this.charco = null;
    }
    for (const b of this.lista) {
      b.g.removeFromParent();
      b.g.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        }
      });
    }
    this.lista = [];
  }

  private poner(b: Bicho, cabeza: number) {
    const t = b.t;
    switch (b.tipo) {
      case 'arana': {
        // Baja del techo, se queda frente a la cara balanceándose y vuelve a subir al final
        const baja = Math.min(1, t / 2.5);
        const sube = this.vida < 3 ? 1 - this.vida / 3 : 0;
        const h = 3 - (3 - (cabeza + 0.25)) * baja + sube * 2;
        b.g.position.copy(aTres(b.x + Math.sin(t * 1.3) * 0.04, b.y, h));
        b.g.rotation.set(0, Math.sin(t * 0.8) * 0.5, 0);
        // El hilo llega justo hasta el techo
        const hilo = b.g.getObjectByName('hilo');
        if (hilo) hilo.scale.y = Math.max(0.01, (3 - h) / (3 * b.g.scale.y));
        return;
      }
      case 'mosca': {
        const p = aTres(b.x + Math.sin(t * 2.3) * 0.35, b.y + Math.sin(t * 3.1 + 1) * 0.25, cabeza + 0.15 + Math.sin(t * 5.2) * 0.12);
        b.g.position.copy(p);
        b.g.rotation.y = Math.atan2(-Math.cos(t * 2.3) * 0.8, Math.cos(t * 3.1 + 1) * 0.78);
        return;
      }
      case 'lagartija': {
        // Sube y baja despacito por la pared, con pausas
        const z = 0.9 + Math.sin(t * 0.35) * 0.35;
        b.g.position.copy(aTres(b.x + Math.sin(t * 0.21) * 0.25, b.y, z));
        // Acostada contra la pared (la espalda hacia la cámara); la cabeza hacia donde va
        b.g.rotation.set(Math.PI / 2, (Math.cos(t * 0.35) > 0 ? 0 : Math.PI) + Math.sin(t * 2) * 0.2, 0);
        return;
      }
      default: {
        let alto = 0;
        if (b.vuela !== undefined) {
          // La cucaracha voladora: cada rato da un vuelo corto hacia la cámara (¡UNA VUELA!)
          const c = (t + 1.5) % 4.5;
          if (c < 1.1) alto = Math.sin((c / 1.1) * Math.PI) * 0.9;
        }
        b.g.position.copy(aTres(b.x, b.y, alto));
      }
    }
  }

  update(dt: number) {
    if (!this.hay) return;
    this.vida -= dt;
    if (this.vida <= 0) return this.quitar();
    if (this.charco) {
      // Crece rápido al principio y se va regando despacio, con ondas
      this.tCharco += dt;
      const r = Math.min(1.15, 0.05 + this.tCharco * 0.45);
      this.charco.scale.set(r * (1 + Math.sin(this.tCharco * 3) * 0.02), r * 0.8, 1);
    }
    for (const b of this.lista) {
      b.t += dt;
      b.fase += dt;
      if (b.camino.length) {
        const meta = b.camino[b.i];
        const dx = meta.x - b.x, dy = meta.y - b.y, d = Math.hypot(dx, dy);
        const paso = b.vel * dt * (b.tipo === 'cucaracha' ? 0.6 + Math.abs(Math.sin(b.fase * 3)) : 1);
        if (d < paso + 0.02) b.i = (b.i + 1) % b.camino.length;
        else {
          b.x += (dx / d) * paso;
          b.y += (dy / d) * paso;
          // Mira hacia donde camina (en three, «adelante» del bicho es -z local)
          b.g.rotation.y = Math.atan2(-dx, dy);
        }
      }
      // Patitas y alas moviéndose rapidito
      b.patas.forEach((p, i) => (p.position.y += Math.sin(b.fase * 28 + i * 1.7) * 0.0012));
      for (const a of b.alas) a.rotation.z = Math.sin(b.fase * (b.tipo === 'mosca' ? 70 : 40)) * 0.6 * (b.tipo === 'mosca' || (b.vuela !== undefined && b.g.position.y > 0.05) ? 1 : 0.1);
      if (b.cola) b.cola.rotation.y = Math.sin(b.fase * 6) * 0.25;
      this.poner(b, this.cabeza);
    }
  }
}
