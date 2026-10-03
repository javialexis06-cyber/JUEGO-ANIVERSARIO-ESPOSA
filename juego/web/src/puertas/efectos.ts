// Los efectos de Cien Puertas: brillitos donde se toca, la puerta que se abre con rayos de luz y polvito dorado, el
// corazoncito del recuerdo que sale volando, la celebración (confeti de corazones y estrellas, y las estrellas
// ganadas) y la tarjeta con el número de la puerta mientras se cruza a la siguiente. Todo liviano para el celular:
// dos nubes de partículas que se reutilizan (una llamada de dibujo cada una), rayos que se apagan solos y nada que
// se quede corriendo cuando no hace falta. Nada tapa la puerta: el confeti sale por los lados y las tarjetas van
// arriba o sobre el fundido.
import * as THREE from 'three';
import type { Escena } from './escena';
import { corazonForma, estrellaForma, lienzo } from './kit';
import { HUECO } from './puerta';
import { $ } from './ui';

// ---------------------------------------------------------------------------
// Toques: una ondita (dorada si se tocó algo del cuarto)
// ---------------------------------------------------------------------------
let ondas: HTMLElement[] = [];
let ondaSig = 0;
export function toque(x: number, y: number, algo: boolean) {
  if (!ondas.length) {
    const capa = document.createElement('div');
    capa.className = 'toques';
    document.body.appendChild(capa);
    ondas = Array.from({ length: 6 }, () => {
      const o = document.createElement('i');
      o.className = 'toque-onda';
      capa.appendChild(o);
      return o;
    });
  }
  const o = ondas[ondaSig++ % ondas.length];
  o.className = 'toque-onda';
  o.style.left = `${x}px`;
  o.style.top = `${y}px`;
  void o.offsetWidth;
  o.className = `toque-onda sale${algo ? ' algo' : ''}`;
}

// ---------------------------------------------------------------------------
// Nubes de partículas
// ---------------------------------------------------------------------------
interface Particula {
  vida: number;
  dura: number;
  v: THREE.Vector3;
  gira: number;
}

function texturaSuave() {
  return lienzo(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
}

function texturaFormas() {
  // Corazón y estrella mitad y mitad (se usa la misma textura: el confeti mezcla los dos)
  return lienzo(64, 64, (c) => {
    c.fillStyle = '#fff';
    c.translate(32, 34);
    c.scale(1, -1);
    const f = corazonForma(48);
    c.beginPath();
    for (const p of f.getPoints(20)) c.lineTo(p.x, p.y);
    c.fill();
  });
}

function texturaEstrella() {
  return lienzo(64, 64, (c) => {
    c.fillStyle = '#fff';
    c.translate(32, 32);
    c.scale(1, -1);
    const f = estrellaForma(28, 0.48);
    c.beginPath();
    for (const p of f.getPoints(4)) c.lineTo(p.x, p.y);
    c.fill();
  });
}

class Nube {
  readonly puntos: THREE.Points;
  private pos: Float32Array;
  private col: Float32Array;
  private ps: (Particula | null)[];
  private base: Float32Array;
  private vivos = 0;

  constructor(private n: number, mapa: THREE.Texture, tam: number, aditiva: boolean) {
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 4);
    this.base = new Float32Array(n * 3);
    this.ps = Array.from({ length: n }, () => null);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.PointsMaterial({
      map: mapa,
      size: tam,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: aditiva ? THREE.AdditiveBlending : THREE.NormalBlending,
      toneMapped: false,
      alphaTest: aditiva ? 0 : 0.05,
    });
    this.puntos = new THREE.Points(geo, mat);
    this.puntos.frustumCulled = false;
    this.puntos.visible = false;
    this.puntos.renderOrder = 5;
  }

  /** Suelta una partícula. */
  soltar(p: THREE.Vector3, v: THREE.Vector3, color: THREE.Color, dura: number) {
    let i = this.ps.findIndex((x) => !x);
    if (i < 0) i = Math.floor(Math.random() * this.n);
    if (!this.ps[i]) this.vivos++;
    this.ps[i] = { vida: 0, dura, v: v.clone(), gira: (Math.random() - 0.5) * 4 };
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.base.set([color.r, color.g, color.b], i * 3);
    this.col.set([color.r, color.g, color.b, 1], i * 4);
    this.puntos.visible = true;
  }

  paso(dt: number, gravedad: number, roce: number) {
    if (!this.vivos) return;
    for (let i = 0; i < this.n; i++) {
      const p = this.ps[i];
      if (!p) continue;
      p.vida += dt;
      const k = p.vida / p.dura;
      if (k >= 1) {
        this.ps[i] = null;
        this.vivos--;
        this.col[i * 4 + 3] = 0;
        continue;
      }
      p.v.y -= gravedad * dt;
      p.v.multiplyScalar(Math.max(0, 1 - roce * dt));
      p.v.x += Math.sin(p.vida * 5 + i) * p.gira * dt * 0.3;
      this.pos[i * 3] += p.v.x * dt;
      this.pos[i * 3 + 1] += p.v.y * dt;
      this.pos[i * 3 + 2] += p.v.z * dt;
      // Aparece rapidito y se desvanece al final
      this.col[i * 4 + 3] = Math.min(1, k * 8) * (k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1);
    }
    const g = this.puntos.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
    if (!this.vivos) this.puntos.visible = false;
  }

  apagar() {
    this.ps.fill(null);
    this.vivos = 0;
    this.col.fill(0);
    this.puntos.visible = false;
  }
}

// ---------------------------------------------------------------------------
// Los efectos de la escena
// ---------------------------------------------------------------------------
const COLORES_CONFETI = ['#e4574b', '#f59fc0', '#f2c75c', '#8fd3b6', '#9ccbef', '#c9b6ea'].map((c) => new THREE.Color(c));
const ORO = new THREE.Color('#ffd98a');

export class Efectos {
  private polvo: Nube;
  private confeti: Nube;
  private chispas: Nube;
  private rayos = new THREE.Group();
  private rayosMat: THREE.MeshBasicMaterial;
  private corazon: THREE.Group;
  private corazonMat: THREE.MeshBasicMaterial;
  private haloMat: THREE.SpriteMaterial;
  private luzRayos = 0;
  private metaRayos = 0;
  private soltando = 0;
  private t = 0;

  constructor(private escena: Escena) {
    const suave = texturaSuave();
    this.polvo = new Nube(90, suave, 0.08, true);
    this.chispas = new Nube(60, texturaEstrella(), 0.09, true);
    this.confeti = new Nube(110, texturaFormas(), 0.14, false);
    // Rayos de luz que salen de la puerta abierta (planos alargados que se abren en abanico)
    const rayo = lienzo(64, 256, (c, w, h) => {
      const g = c.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(w * 0.42, h);
      c.lineTo(w * 0.58, h);
      c.lineTo(w, 0);
      c.lineTo(0, 0);
      c.closePath();
      c.fill();
    });
    this.rayosMat = new THREE.MeshBasicMaterial({ map: rayo, color: '#fff1c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
    // Un sol de rayos alrededor de la puerta abierta (sobre la pared, como si la luz se regara por el marco)
    const geo = new THREE.PlaneGeometry(0.55, 2.4);
    geo.translate(0, 1.2 + 0.35, 0);
    for (let i = 0; i < 12; i++) {
      const r = new THREE.Mesh(geo, this.rayosMat);
      r.rotation.z = (i / 12) * Math.PI * 2 + (i % 2) * 0.12;
      r.scale.set(0.7 + (i % 3) * 0.3, 0.75 + ((i * 7) % 4) * 0.12, 1);
      this.rayos.add(r);
    }
    this.rayos.position.set(0, HUECO.h * 0.52, 0.06);
    this.rayos.visible = false;
    this.rayos.renderOrder = 4;
    // El corazoncito del recuerdo
    this.corazonMat = new THREE.MeshBasicMaterial({ color: '#ff8fb3', transparent: true, opacity: 0, toneMapped: false });
    const cg = new THREE.ExtrudeGeometry(corazonForma(0.32), { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 16 });
    cg.translate(0, 0, -0.03);
    this.corazon = new THREE.Group();
    this.corazon.add(new THREE.Mesh(cg, this.corazonMat));
    this.haloMat = new THREE.SpriteMaterial({ map: suave, color: '#ffb8d0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const halo = new THREE.Sprite(this.haloMat);
    halo.scale.setScalar(0.9);
    this.corazon.add(halo);
    this.corazon.visible = false;
    this.corazon.renderOrder = 6;
    escena.escena.add(this.polvo.puntos, this.chispas.puntos, this.confeti.puntos, this.rayos, this.corazon);
    escena.cada((dt) => this.cuadro(dt));
  }

  private cuadro(dt: number) {
    this.t += dt;
    this.polvo.paso(dt, -0.05, 0.6);
    this.chispas.paso(dt, 0.4, 1.2);
    this.confeti.paso(dt, 2.6, 1.4);
    // Rayos: se prenden y se apagan suavecito, y giran despacio
    if (this.rayos.visible || this.metaRayos > 0) {
      this.luzRayos += (this.metaRayos - this.luzRayos) * Math.min(1, dt * 3);
      this.rayosMat.opacity = this.luzRayos * (0.42 + Math.sin(this.t * 2.2) * 0.07);
      this.rayos.rotation.z = this.t * 0.18;
      this.rayos.visible = this.luzRayos > 0.01;
    }
    // Polvito dorado que sale por la puerta mientras está abierta
    if (this.soltando > 0) {
      this.soltando -= dt;
      for (let i = 0; i < 2; i++) {
        const p = new THREE.Vector3((Math.random() - 0.5) * HUECO.w * 0.8, 0.2 + Math.random() * HUECO.h * 0.8, -0.1);
        const v = new THREE.Vector3((Math.random() - 0.5) * 0.25, 0.05 + Math.random() * 0.2, 0.5 + Math.random() * 0.5);
        this.polvo.soltar(p, v, ORO, 1.6 + Math.random() * 1.2);
      }
    }
  }

  /** La puerta se abre: rayos de luz, polvito dorado y chispas en la cerradura. `color`: la luz del capítulo. */
  abrir(cerradura: THREE.Vector3, color = '#fff1c8') {
    this.rayosMat.color.set(color);
    this.metaRayos = 1;
    this.rayos.visible = true;
    this.soltando = 2.6;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      this.chispas.soltar(cerradura, new THREE.Vector3(Math.cos(a) * 1.1, Math.sin(a) * 1.1 + 0.3, 0.6), ORO, 0.7 + Math.random() * 0.3);
    }
  }

  /** El corazoncito del recuerdo sale de la puerta, da una vuelta y se va volando hacia arriba a la izquierda. */
  async recuerdo() {
    const e = this.escena;
    const c = this.corazon;
    c.visible = true;
    const a = new THREE.Vector3(0, HUECO.h * 0.5, -0.4), b = new THREE.Vector3(0.15, 1.75, 0.9);
    await e.animar(700, (k) => {
      c.position.lerpVectors(a, b, k);
      c.rotation.y = k * Math.PI * 2;
      c.scale.setScalar(0.4 + 0.6 * k);
      this.corazonMat.opacity = Math.min(1, k * 2);
      this.haloMat.opacity = Math.min(0.9, k * 2);
      if (Math.random() < 0.6) this.polvo.soltar(c.position, new THREE.Vector3((Math.random() - 0.5) * 0.3, -0.1, (Math.random() - 0.5) * 0.3), new THREE.Color('#ffc2d6'), 0.9);
    });
    await e.esperar(220);
    // A la esquina de arriba a la izquierda (donde dice el número de la puerta)
    const destino = new THREE.Vector3(-2.6, 2.9, 1.6);
    const desde = c.position.clone();
    await e.animar(650, (k) => {
      c.position.lerpVectors(desde, destino, k);
      c.position.y += Math.sin(k * Math.PI) * 0.35;
      c.rotation.y += 0.25;
      c.scale.setScalar(1 - 0.75 * k);
      this.corazonMat.opacity = 1 - k * 0.6;
      this.haloMat.opacity = 0.9 * (1 - k);
      this.polvo.soltar(c.position, new THREE.Vector3(0, -0.15, 0), new THREE.Color('#ffd0e0'), 0.7);
    });
    c.visible = false;
    this.corazonMat.opacity = 0;
    this.haloMat.opacity = 0;
  }

  /** Confeti de corazones y estrellas que sale por los lados de la puerta (sin taparla). */
  confetiAbrir() {
    for (const lado of [-1, 1])
      for (let i = 0; i < 26; i++) {
        const p = new THREE.Vector3(lado * (HUECO.w / 2 + 0.5 + Math.random() * 0.6), 0.6 + Math.random() * 0.8, 0.5 + Math.random() * 0.6);
        const v = new THREE.Vector3(lado * (0.4 + Math.random() * 1.4), 2.6 + Math.random() * 2.2, 0.4 + Math.random() * 0.9);
        this.confeti.soltar(p, v, COLORES_CONFETI[(i + (lado > 0 ? 3 : 0)) % COLORES_CONFETI.length], 2.2 + Math.random() * 0.8);
      }
  }

  /** Se apaga todo (al cambiar de puerta). */
  apagar() {
    this.metaRayos = 0;
    this.luzRayos = 0;
    this.rayosMat.opacity = 0;
    this.rayos.visible = false;
    this.soltando = 0;
    this.polvo.apagar();
    this.chispas.apagar();
    this.confeti.apagar();
    this.corazon.visible = false;
  }

  /** Los rayos se van apagando (al cruzar). */
  atenuarRayos() {
    this.metaRayos = 0;
  }
}

// ---------------------------------------------------------------------------
// Tarjetas: las estrellas ganadas y el número de la puerta entre una y otra
// ---------------------------------------------------------------------------
/** Las estrellas que se ganaron (arriba, sin tapar la puerta). */
export function estrellas(n: number, cuantas: number, monedas: number) {
  const el = $('celebra');
  el.innerHTML = `<b class="celebra-titulo">¡Puerta ${n}!</b><span class="celebra-estrellas">${[0, 1, 2]
    .map((i) => `<i class="${i < cuantas ? 'gana' : ''}" style="--i:${i}">★</i>`)
    .join('')}</span>${monedas ? `<small class="celebra-monedas">+${monedas} ${monedas === 1 ? 'moneda' : 'monedas'} para la casa</small>` : ''}`;
  el.hidden = false;
  el.classList.remove('sale', 'se-va');
  void el.offsetWidth;
  el.classList.add('sale');
  window.setTimeout(() => el.classList.add('se-va'), 2600);
  window.setTimeout(() => (el.hidden = true), 3100);
}

/** Tarjeta con el número de la puerta (y el capítulo cuando cambia), sobre el fundido. */
export function tarjetaPuerta(n: number, capitulo: { n: number; titulo: string }, nuevo: boolean) {
  const el = $('tarjeta-puerta');
  el.className = `tarjeta-puerta cap-${capitulo.n}${nuevo ? ' nuevo' : ''}`;
  el.innerHTML = `${nuevo ? `<small>Capítulo ${capitulo.n}</small>` : ''}<span class="tarjeta-icono"><i></i><b>${n}</b></span><strong>${nuevo ? capitulo.titulo : `Puerta ${n}`}</strong>${nuevo ? `<em>Puerta ${n}</em>` : `<em>${capitulo.titulo}</em>`}`;
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add('sale');
}

export function quitarTarjeta() {
  const el = $('tarjeta-puerta');
  el.classList.add('se-va');
  window.setTimeout(() => {
    el.hidden = true;
    el.classList.remove('sale', 'se-va');
  }, 420);
}
