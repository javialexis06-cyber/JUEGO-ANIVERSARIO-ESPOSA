// Las puertas: cada capítulo tiene la suya (de madera, reja, vidrio, corrediza, bambú, tronco, carpa, rastrillo,
// compuerta espacial y la del corazón). Todas se sacuden si están cerradas y se abren con su propia animación.
import * as THREE from 'three';
import * as sonido from '../sonido';
import { Escena, salida } from './escena';
import { caja, cilindro, en, esfera, forma, grupo, lienzo, mat, matNuevo, toro } from './kit';

export type TipoPuerta = 'madera' | 'reja' | 'vidrio' | 'corrediza' | 'bambu' | 'tronco' | 'carpa' | 'rastrillo' | 'iris' | 'corazon';

/** Hueco de la pared donde va la puerta (ancho y alto, en metros). */
export const HUECO = { w: 1.3, h: 2.4 };

export interface OpPuerta {
  color?: string;
  marco?: string;
  metal?: string;
  /** La cerradura se ve (la mayoría de las puertas se abren con llave o con el acertijo). */
  cerradura?: boolean;
  luz?: string;
}

interface Hoja {
  obj: THREE.Object3D;
  abrir: (k: number) => void;
  sacudir: (k: number) => void;
}

export class Puerta {
  grupo = grupo('puerta');
  /** Placa de la cerradura (donde se usa la llave). */
  cerradura: THREE.Object3D;
  /** Lo que se toca de la puerta (las hojas). */
  toque = grupo('puerta toque');
  private hojas: Hoja[] = [];
  private extras: ((k: number) => void)[] = [];
  private luzDetras: THREE.Mesh;
  bloqueada = true;
  abierta = false;
  private pegados: THREE.Object3D[] = [];

  constructor(public tipo: TipoPuerta, private escena: Escena, o: OpPuerta = {}) {
    const W = HUECO.w, H = HUECO.h;
    // Detrás: un pasillo corto que se ilumina al abrir
    const tunel = caja(W + 0.1, H + 0.1, 1.2, matNuevo('#2a211d', { plano: true, lados: THREE.BackSide }), 0);
    tunel.castShadow = false;
    en(tunel, 0, H / 2, -0.62);
    const brillo = lienzo(64, 128, (c) => {
      const g = c.createRadialGradient(32, 70, 4, 32, 70, 90);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.45, o.luz ?? '#fff1d6');
      g.addColorStop(1, '#f2c79a');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 128);
    });
    this.luzDetras = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: brillo, transparent: true, opacity: 0 }));
    en(this.luzDetras, 0, H / 2, -0.3);
    this.grupo.add(tunel, this.luzDetras, this.toque);
    this.cerradura = grupo('cerradura');
    (Construir[tipo] ?? Construir.madera)(this, o);
    if (o.cerradura === false) this.cerradura.visible = false;
  }

  /** Agrega una hoja con su manera de abrirse. */
  hoja(obj: THREE.Object3D, abrir: (k: number) => void, sacudir: (k: number) => void = () => {}) {
    this.toque.add(obj);
    this.hojas.push({ obj, abrir, sacudir });
  }

  /** Pega un objeto del acertijo a la primera hoja (se mueve con ella); (x, y, z) medidos con la puerta cerrada. */
  pegar(obj: THREE.Object3D, x: number, y: number, z: number) {
    this.grupo.updateMatrixWorld(true);
    // La hoja que está en ese punto (en las puertas dobles, la izquierda o la derecha)
    const punto = this.grupo.localToWorld(new THREE.Vector3(x, y, 0));
    const hoja =
      this.hojas.find((h) => {
        const b = new THREE.Box3().setFromObject(h.obj);
        return punto.x >= b.min.x - 0.01 && punto.x <= b.max.x + 0.01;
      })?.obj ?? this.hojas[0]?.obj ?? this.grupo;
    const mundo = this.grupo.localToWorld(new THREE.Vector3(x, y, z));
    obj.position.copy(hoja.worldToLocal(mundo));
    hoja.add(obj);
    this.pegados.push(obj);
  }

  /** Quita lo pegado por el acertijo anterior. */
  despegar() {
    for (const o of this.pegados.splice(0)) o.removeFromParent();
  }

  /** Algo más que se mueve al abrir (una campanita, luces). */
  alAbrir(fn: (k: number) => void) {
    this.extras.push(fn);
  }

  /** «Está cerrada»: se sacude un poquito. */
  async sacudir() {
    sonido.rumor(0.12, 600, 0.09, 0, 1.4);
    sonido.rumor(0.1, 500, 0.07, 0.12, 1.4);
    await this.escena.animar(360, (k) => {
      const s = Math.sin(k * Math.PI * 6) * (1 - k);
      for (const h of this.hojas) h.sacudir(s);
    }, (k) => k);
    for (const h of this.hojas) h.sacudir(0);
  }

  /** Se quita el seguro (clic de la cerradura). */
  async desbloquear() {
    if (!this.bloqueada) return;
    this.bloqueada = false;
    sonido.nota(1800, 0.05, 0, 'square', 0.05);
    sonido.nota(1200, 0.07, 0.07, 'square', 0.05);
    await this.escena.animar(300, (k) => (this.cerradura.rotation.z = -k * Math.PI * 0.5));
  }

  async abrir() {
    if (this.abierta) return;
    await this.desbloquear();
    this.abierta = true;
    sonido.rumor(0.9, 380, 0.06, 0, 2, 900);
    const m = this.luzDetras.material as THREE.MeshBasicMaterial;
    await this.escena.animar(1300, (k) => {
      for (const h of this.hojas) h.abrir(k);
      for (const fn of this.extras) fn(k);
      m.opacity = Math.min(1, k * 1.6);
    }, salida);
  }

  /** Vuelve a quedar cerrada (al repetir una puerta). */
  cerrar() {
    this.abierta = false;
    this.bloqueada = true;
    this.cerradura.rotation.z = 0;
    for (const h of this.hojas) h.abrir(0);
    for (const fn of this.extras) fn(0);
    (this.luzDetras.material as THREE.MeshBasicMaterial).opacity = 0;
  }
}

// ---------------------------------------------------------------------------
// Cada tipo de puerta
// ---------------------------------------------------------------------------
const W = HUECO.w, H = HUECO.h;

function placaCerradura(p: Puerta, x: number, y: number, z: number, metal: string) {
  const placa = caja(0.12, 0.22, 0.03, mat(metal, { rough: 0.35, metal: 0.6 }), 0.02);
  const ojo = cilindro(0.022, 0.022, 0.04, '#1e1a18');
  ojo.rotation.x = Math.PI / 2;
  en(ojo, 0, -0.03, 0.012);
  const ranura = caja(0.012, 0.05, 0.04, '#1e1a18', 0.004);
  en(ranura, 0, -0.065, 0.012);
  p.cerradura.add(placa, ojo, ranura);
  en(p.cerradura, x, y, z);
}

/** Marco de madera alrededor del hueco. */
function marco(color: string, grueso = 0.1, prof = 0.16) {
  const g = grupo('marco');
  const m = mat(color);
  g.add(en(caja(grueso, H + grueso, prof, m, 0.02), -W / 2 - grueso / 2, (H + grueso) / 2, 0));
  g.add(en(caja(grueso, H + grueso, prof, m, 0.02), W / 2 + grueso / 2, (H + grueso) / 2, 0));
  g.add(en(caja(W + grueso * 2, grueso, prof, m, 0.02), 0, H + grueso / 2, 0));
  return g;
}

/** Hoja con bisagra en un borde: gira hacia adentro. */
function bisagra(p: Puerta, hoja: THREE.Object3D, lado: -1 | 1, ancho: number, x0: number, angulo = 105) {
  const piv = grupo('bisagra');
  en(piv, x0 + lado * (ancho / 2), 0, 0);
  hoja.position.x -= piv.position.x;
  piv.add(hoja);
  p.hoja(
    piv,
    (k) => (piv.rotation.y = -lado * THREE.MathUtils.degToRad(angulo) * k),
    (s) => (piv.rotation.y = lado * s * 0.025),
  );
  return piv;
}

const Construir: Record<TipoPuerta, (p: Puerta, o: OpPuerta) => void> = {
  madera(p, o) {
    const c = o.color ?? '#b9794f', mc = o.marco ?? '#8e5b3c', metal = o.metal ?? '#d9b25a';
    p.grupo.add(marco(mc));
    const hoja = grupo('hoja');
    hoja.add(en(caja(W - 0.04, H - 0.03, 0.08, mat(c), 0.03), 0, (H - 0.03) / 2, 0));
    // Cuatro tableros en relieve
    for (const [x, y, h] of [[-0.27, 1.62, 0.9], [0.27, 1.62, 0.9], [-0.27, 0.55, 0.75], [0.27, 0.55, 0.75]] as const) {
      hoja.add(en(caja(0.44, h, 0.03, mat(shade(c, -0.08)), 0.03), x, y, 0.045));
    }
    const pomo = esfera(0.055, mat(metal, { rough: 0.3, metal: 0.7 }), 'pomo');
    en(pomo, 0.47, 1.05, 0.11);
    const cuello = cilindro(0.025, 0.035, 0.06, mat(metal, { rough: 0.3, metal: 0.7 }));
    cuello.rotation.x = Math.PI / 2;
    en(cuello, 0.47, 1.05, 0.07);
    hoja.add(pomo, cuello);
    placaCerradura(p, 0.47, 0.88, 0.055, metal);
    hoja.add(p.cerradura);
    en(hoja, 0, 0, 0.02);
    bisagra(p, hoja, -1, W - 0.04, 0);
  },

  reja(p, o) {
    const c = o.color ?? '#3f6b52', metal = o.metal ?? '#d9b25a';
    // Arco de enredadera encima
    const arco = toro(W / 2 + 0.08, 0.09, mat('#4f8a55'), 'arco', Math.PI);
    en(arco, 0, H - 0.02, 0);
    p.grupo.add(arco, marco('#6b8f5a', 0.12, 0.2));
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI;
      const flor = esfera(0.06, mat(['#F59FC0', '#F7C948', '#ffffff'][i % 3]));
      en(flor, Math.cos(a) * (W / 2 + 0.1), H - 0.02 + Math.sin(a) * (W / 2 + 0.1), 0.08);
      p.grupo.add(flor);
    }
    for (const lado of [-1, 1] as const) {
      const hoja = grupo('hoja');
      const ancho = W / 2 - 0.02;
      const m = mat(c, { rough: 0.5, metal: 0.3 });
      hoja.add(en(caja(ancho, 0.07, 0.06, m, 0.02), 0, 0.2, 0), en(caja(ancho, 0.07, 0.06, m, 0.02), 0, H - 0.25, 0));
      for (let i = 0; i < 5; i++) {
        const x = -ancho / 2 + 0.06 + (i * (ancho - 0.12)) / 4;
        hoja.add(en(caja(0.04, H - 0.2, 0.04, m, 0.015), x, (H - 0.2) / 2 + 0.05, 0));
        const punta = esfera(0.04, mat(metal, { metal: 0.6, rough: 0.3 }));
        en(punta, x, H - 0.12, 0);
        hoja.add(punta);
      }
      en(hoja, lado * (ancho / 2 + 0.01), 0, 0);
      if (lado === 1) {
        placaCerradura(p, -ancho / 2 + 0.08, 1.05, 0.05, metal);
        hoja.add(p.cerradura);
      }
      bisagra(p, hoja, lado === -1 ? -1 : 1, ancho, lado * (ancho / 2 + 0.01), 95);
    }
  },

  vidrio(p, o) {
    const c = o.marco ?? '#2f5a4a', metal = o.metal ?? '#d9b25a';
    p.grupo.add(marco(c, 0.12));
    const hoja = grupo('hoja');
    const m = mat(o.color ?? '#3c7a62');
    const a = W - 0.04;
    hoja.add(en(caja(a, 0.14, 0.07, m, 0.02), 0, 0.07, 0), en(caja(a, 0.14, 0.07, m, 0.02), 0, H - 0.1, 0));
    hoja.add(en(caja(0.12, H - 0.05, 0.07, m, 0.02), -a / 2 + 0.06, H / 2, 0), en(caja(0.12, H - 0.05, 0.07, m, 0.02), a / 2 - 0.06, H / 2, 0));
    hoja.add(en(caja(a, 0.1, 0.07, m, 0.02), 0, 1.0, 0));
    const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(a - 0.2, H - 0.3), new THREE.MeshStandardMaterial({ color: '#cfe8f0', transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.1 }));
    en(vidrio, 0, H / 2 + 0.05, 0);
    hoja.add(vidrio);
    const manija = caja(0.04, 0.4, 0.04, mat(metal, { metal: 0.7, rough: 0.3 }), 0.02);
    en(manija, 0.42, 1.05, 0.08);
    hoja.add(manija);
    placaCerradura(p, 0.42, 0.72, 0.05, metal);
    hoja.add(p.cerradura);
    // Campanita
    const campana = cilindro(0.03, 0.07, 0.09, mat(metal, { metal: 0.7, rough: 0.3 }), 'campanita');
    en(campana, 0.45, H + 0.02, 0.12);
    p.grupo.add(campana);
    en(hoja, 0, 0, 0.02);
    bisagra(p, hoja, -1, a, 0);
    p.alAbrir((k) => (campana.rotation.z = Math.sin(k * 14) * 0.3 * (1 - k)));
  },

  corrediza(p, o) {
    const c = o.color ?? '#cfd6dc', metal = o.metal ?? '#8a949e';
    p.grupo.add(marco(o.marco ?? '#6b7680', 0.12, 0.2));
    const sensor = caja(0.3, 0.06, 0.05, mat('#26313a'), 0.02);
    en(sensor, 0, H + 0.2, 0.08);
    const led = esfera(0.02, matNuevo('#e4574b', { emisivo: '#e4574b', intensidad: 2 }), 'led');
    en(led, 0.1, H + 0.2, 0.11);
    p.grupo.add(sensor, led);
    for (const lado of [-1, 1] as const) {
      const hoja = grupo('hoja');
      const a = W / 2 - 0.01;
      hoja.add(en(caja(a, H - 0.02, 0.05, mat(metal, { metal: 0.4, rough: 0.4 }), 0.015), 0, H / 2, 0));
      const v = new THREE.Mesh(new THREE.PlaneGeometry(a - 0.12, H - 0.3), new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.45, roughness: 0.1 }));
      en(v, 0, H / 2 + 0.05, 0.03);
      hoja.add(v);
      const x0 = lado * (a / 2 + 0.005);
      en(hoja, x0, 0, 0.02);
      if (lado === 1) {
        placaCerradura(p, -a / 2 + 0.08, 1.0, 0.04, '#9aa4b0');
        hoja.add(p.cerradura);
      }
      p.hoja(hoja, (k) => {
        hoja.position.x = x0 + lado * a * 0.95 * k;
        (led.material as THREE.MeshStandardMaterial).emissive.set(k > 0 ? '#5fd38d' : '#e4574b');
      }, (s) => (hoja.position.x = x0 + lado * s * 0.01));
    }
  },

  bambu(p, o) {
    const c = o.color ?? '#d9b77a';
    p.grupo.add(marco(o.marco ?? '#8a6a3c', 0.14, 0.2));
    // Techito de palma
    const techo = caja(W + 0.7, 0.18, 0.5, mat('#c9a15a'), 0.08);
    en(techo, 0, H + 0.2, 0.1);
    techo.rotation.x = 0.15;
    p.grupo.add(techo);
    const hoja = grupo('hoja');
    const n = 11;
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + 0.06 + (i * (W - 0.12)) / (n - 1);
      const tallo = cilindro(0.055, 0.055, H - 0.04, mat(shade(c, (i % 3) * 0.04 - 0.04)));
      en(tallo, x, H / 2, 0);
      hoja.add(tallo);
      for (const y of [0.5, 1.3, 2.0]) hoja.add(en(toro(0.057, 0.012, mat(shade(c, -0.15))), x, y, 0));
    }
    hoja.children.slice(0, 0);
    for (const y of [0.45, 1.75]) hoja.add(en(caja(W - 0.05, 0.05, 0.04, mat('#8a6a3c'), 0.02), 0, y, 0.07));
    placaCerradura(p, 0.4, 1.0, 0.09, '#d9b25a');
    hoja.add(p.cerradura);
    p.hoja(hoja, (k) => {
      hoja.position.y = k * (H - 0.35);
      hoja.scale.y = 1 - k * 0.85;
    }, (s) => (hoja.rotation.z = s * 0.01));
  },

  tronco(p, o) {
    // Tronco enorme con una puerta redonda
    const corteza = mat(o.marco ?? '#7a5236');
    const tronco = cilindro(1.35, 1.6, 4.2, corteza, 'tronco', 32);
    en(tronco, 0, 2.1, -1.25);
    const aro = toro(0.72, 0.1, mat('#5e3d28'));
    en(aro, 0, 1.2, 0.02);
    p.grupo.add(tronco, aro);
    const hoja = grupo('hoja');
    const disco = cilindro(0.66, 0.66, 0.08, mat(o.color ?? '#a5713f'), 'disco', 40);
    disco.rotation.x = Math.PI / 2;
    en(disco, 0, 1.2, 0);
    hoja.add(disco);
    for (let i = -2; i <= 2; i++) hoja.add(en(caja(0.03, 1.1 - Math.abs(i) * 0.12, 0.02, mat('#8a5a33'), 0.01), i * 0.22, 1.2, 0.05));
    const pomo = esfera(0.06, mat('#d9b25a', { metal: 0.7, rough: 0.3 }), 'pomo');
    en(pomo, 0, 1.2, 0.08);
    hoja.add(pomo);
    placaCerradura(p, 0.36, 1.0, 0.06, '#d9b25a');
    hoja.add(p.cerradura);
    bisagra(p, hoja, -1, 1.32, 0, 100);
  },

  carpa(p, o) {
    const c = o.color ?? '#e4574b', c2 = o.marco ?? '#fff3e0';
    // Arco de carpa con banderines
    const arriba = caja(W + 0.5, 0.35, 0.2, mat(c), 0.08);
    en(arriba, 0, H + 0.12, 0.05);
    p.grupo.add(arriba);
    for (let i = 0; i < 7; i++) {
      const b = caja(0.12, 0.16, 0.01, mat(['#F7C948', '#8EC5F0', '#F59FC0'][i % 3]), 0.005);
      en(b, -W / 2 - 0.1 + (i * (W + 0.2)) / 6, H - 0.12, 0.17);
      b.rotation.z = Math.PI / 4;
      p.grupo.add(b);
    }
    for (const lado of [-1, 1] as const) {
      const hoja = grupo('hoja');
      const a = W / 2 + 0.03;
      for (let i = 0; i < 4; i++) {
        const tira = caja(a / 4 + 0.01, H - 0.02, 0.04, mat(i % 2 ? c : c2), 0.02);
        en(tira, -a / 2 + a / 8 + (i * a) / 4, H / 2, (i % 2) * 0.02);
        hoja.add(tira);
      }
      const x0 = lado * a / 2;
      en(hoja, x0, 0, 0.03);
      if (lado === 1) {
        placaCerradura(p, -a / 2 + 0.1, 1.0, 0.05, '#d9b25a');
        hoja.add(p.cerradura);
      }
      p.hoja(hoja, (k) => {
        hoja.scale.x = 1 - 0.78 * k;
        hoja.position.x = x0 + lado * a * 0.4 * k;
      }, (s) => (hoja.rotation.z = s * 0.02 * lado));
    }
  },

  rastrillo(p, o) {
    const piedra = mat(o.marco ?? '#9a938a');
    for (const x of [-1, 1]) p.grupo.add(en(caja(0.45, H + 0.4, 0.4, piedra, 0.06), x * (W / 2 + 0.22), (H + 0.4) / 2, 0));
    p.grupo.add(en(caja(W + 0.9, 0.4, 0.4, piedra, 0.06), 0, H + 0.2, 0));
    const madera = en(caja(W - 0.02, H - 0.02, 0.06, mat(o.color ?? '#6b4a33'), 0.02), 0, H / 2, -0.12);
    p.hoja(madera, (k) => (madera.rotation.y = -k * 1.7), () => {});
    madera.geometry.translate(W / 2, 0, 0);
    madera.position.x = -W / 2;
    const reja = grupo('hoja');
    const m = mat(o.metal ?? '#3a3a40', { metal: 0.6, rough: 0.4 });
    for (let i = 0; i < 6; i++) reja.add(en(caja(0.05, H, 0.05, m, 0.01), -W / 2 + 0.1 + (i * (W - 0.2)) / 5, H / 2, 0.02));
    for (let j = 0; j < 5; j++) reja.add(en(caja(W, 0.05, 0.05, m, 0.01), 0, 0.3 + j * 0.48, 0.02));
    placaCerradura(p, 0, 1.0, 0.07, '#9aa4b0');
    reja.add(p.cerradura);
    p.hoja(reja, (k) => (reja.position.y = k * (H - 0.2)), (s) => (reja.position.y = Math.abs(s) * 0.02));
  },

  iris(p, o) {
    const c = o.color ?? '#b8c4d4', metal = o.metal ?? '#5b6b7e';
    p.grupo.add(marco(o.marco ?? '#3a4656', 0.16, 0.24));
    const luces = matNuevo('#6ee7ff', { emisivo: '#6ee7ff', intensidad: 1.6 });
    for (const x of [-1, 1]) p.grupo.add(en(caja(0.04, H - 0.4, 0.03, luces, 0.01), x * (W / 2 + 0.1), H / 2, 0.13));
    for (const lado of [-1, 1] as const) {
      const hoja = grupo('hoja');
      hoja.add(en(caja(W - 0.02, H / 2, 0.08, mat(lado > 0 ? c : shade(c, -0.06), { metal: 0.3, rough: 0.45 }), 0.02), 0, H / 4, 0));
      hoja.add(en(caja(W * 0.6, 0.04, 0.02, mat('#ffb000'), 0.01), 0, lado > 0 ? 0.04 : H / 2 - 0.04, 0.05));
      const y0 = lado > 0 ? 0 : H / 2;
      en(hoja, 0, y0, 0.02);
      if (lado > 0) {
        placaCerradura(p, 0.4, 1.0, 0.06, metal);
        hoja.add(p.cerradura);
        p.cerradura.position.y = 1.0;
      }
      p.hoja(hoja, (k) => (hoja.position.y = y0 + (lado > 0 ? -1 : 1) * (H / 2 + 0.05) * k), (s) => (hoja.position.x = s * 0.01));
    }
  },

  corazon(p, o) {
    const c = o.color ?? '#e4574b', metal = o.metal ?? '#f2c75c';
    // Marco con forma de corazón sobre un panel que tapa las esquinas del hueco
    const panel = caja(W + 0.3, H + 0.3, 0.12, mat(o.marco ?? '#f6e3d0'), 0.03);
    en(panel, 0, (H + 0.3) / 2, -0.02);
    p.grupo.add(panel);
    for (const lado of [-1, 1] as const) {
      const hoja = grupo('hoja');
      const media = forma(mitadCorazon(lado), 0.1, mat(c), 'media corazon', 0.03);
      // Corazón alto: llena el hueco de la pared
      media.scale.set(W - 0.06, H - 0.05, 1);
      media.position.set(0, 0.5 * (H - 0.05) + 0.03, 0.08);
      hoja.add(media);
      const borde = toro(0.05, 0.02, mat(metal, { metal: 0.7, rough: 0.3 }));
      en(borde, lado * 0.1, 1.15, 0.15);
      hoja.add(borde);
      if (lado === 1) {
        placaCerradura(p, 0.1, 0.95, 0.15, metal);
        hoja.add(p.cerradura);
      }
      // La bisagra va en el borde de afuera de cada mitad
      const piv = grupo('bisagra');
      en(piv, lado * (W / 2 - 0.03), 0, 0);
      hoja.position.x -= piv.position.x;
      piv.add(hoja);
      p.hoja(piv, (k) => (piv.rotation.y = -lado * THREE.MathUtils.degToRad(100) * k), (sac) => (piv.rotation.y = -lado * sac * 0.025));
    }
  },
};

/** Media silueta de corazón (tamaño 1) del lado pedido: las dos mitades forman la puerta. */
function mitadCorazon(lado: -1 | 1) {
  const f = new THREE.Shape();
  const x = (v: number) => v * -lado;
  f.moveTo(0, -0.5);
  f.bezierCurveTo(x(-0.08), -0.42, x(-0.5), -0.12, x(-0.5), 0.14);
  f.bezierCurveTo(x(-0.5), 0.42, x(-0.2), 0.52, 0, 0.3);
  f.lineTo(0, -0.5);
  return f;
}

/** Aclara (+) u oscurece (-) un color. */
export function shade(color: string, k: number) {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + k, 0, 1));
  return `#${c.getHexString()}`;
}
