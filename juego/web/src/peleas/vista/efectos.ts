// Los efectos de la pelea: chispas de golpe (estrella, anillo y chispitas del color de cada luchador), letreros de
// historieta («¡PAF!», «¡PUM!»), las estrellitas del mareo, el polvo al caer, la niebla del Conde, el fuego del dragón y
// cómo se ven los proyectiles y las súper (corazones, chispas doradas, lirios, murciélagos, jarrones, la avalancha, el
// rayo). Las cosas (proyectiles, jarrones, la cuerda) son modelos de Blender (`peleas/cosas.glb`, una pieza
// «m_<clave>» por cosa); lo que es luz (chispas, rayo, humo) se dibuja aquí.
import * as THREE from 'three';
import { cargar } from '../../recursos';
import type { Proyectil, Sim } from '../sim';
import type { Efecto } from '../tipos';
import { puntoSuave } from './escena';

export const COLOR_EFECTO: Record<Efecto, string> = {
  normal: '#fff1a8', fuego: '#ff7a2a', luz: '#ffd84a', hielo: '#9fe0ff', sombra: '#d04aff', corazon: '#ff5a8a', lirio: '#c9a8ff', estrella: '#ffe066',
  porcelana: '#f4efe6', tierra: '#d9a066',
};

/** La pieza de Blender de cada proyectil. */
const PIEZA_PROY: Partial<Record<Efecto, string>> = {
  corazon: 'corazon', luz: 'chispa', estrella: 'estrella', lirio: 'lirio', sombra: 'murcielago', porcelana: 'porcelana', hielo: 'bola_nieve', fuego: 'llama',
};

const PALABRAS = ['¡PAF!', '¡PUM!', '¡ZAS!', '¡POW!', '¡TOC!', '¡BAM!'];

function textura(dibujar: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 128, h = 128) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  dibujar(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let TEX: { estrella: THREE.Texture; anillo: THREE.Texture; palabras: THREE.Texture[]; humo: THREE.Texture; escudo: THREE.Texture; rayo: THREE.Texture } | null = null;
function texturas() {
  if (TEX) return TEX;
  const estrella = textura((g, w) => {
    g.translate(w / 2, w / 2);
    const rad = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
    rad.addColorStop(0, 'rgba(255,255,255,1)');
    rad.addColorStop(0.3, 'rgba(255,255,255,.9)');
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rad;
    g.beginPath();
    const n = 9;
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? w * 0.13 : w * (0.36 + (i % 4 === 0 ? 0.12 : 0));
      const a = (i / (n * 2)) * Math.PI * 2;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.fill();
  });
  const anillo = textura((g, w) => {
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineWidth = 7;
    g.beginPath();
    g.arc(w / 2, w / 2, w / 2 - 8, 0, Math.PI * 2);
    g.stroke();
  });
  const humo = textura((g, w) => {
    const rad = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    rad.addColorStop(0, 'rgba(255,255,255,.75)');
    rad.addColorStop(0.6, 'rgba(255,255,255,.3)');
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rad;
    g.fillRect(0, 0, w, w);
  });
  const escudo = textura((g, w) => {
    g.translate(w / 2, w / 2);
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.lineWidth = 6;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      g.lineTo(Math.cos(a) * w * 0.42, Math.sin(a) * w * 0.42);
    }
    g.closePath();
    g.fill();
    g.stroke();
  });
  const rayo = textura((g, w, h) => {
    const lin = g.createLinearGradient(0, 0, 0, h);
    lin.addColorStop(0, 'rgba(255,255,255,0)');
    lin.addColorStop(0.35, 'rgba(255,255,255,.55)');
    lin.addColorStop(0.5, 'rgba(255,255,255,1)');
    lin.addColorStop(0.65, 'rgba(255,255,255,.55)');
    lin.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lin;
    g.fillRect(0, 0, w, h);
  }, 16, 64);
  const palabras = PALABRAS.map((p) => textura((g, w, h) => {
    g.font = '900 54px Fredoka, "Arial Black", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.translate(w / 2, h / 2);
    g.rotate(-0.12);
    g.lineWidth = 14;
    g.strokeStyle = '#5a1a2a';
    g.strokeText(p, 0, 0);
    const lin = g.createLinearGradient(0, -24, 0, 24);
    lin.addColorStop(0, '#fff6a0');
    lin.addColorStop(1, '#ff9a2a');
    g.fillStyle = lin;
    g.fillText(p, 0, 0);
  }, 256, 96));
  TEX = { estrella, anillo, palabras, humo, escudo, rayo };
  return TEX;
}

interface Destello { s: THREE.Sprite; t: number; dur: number; crece: number; base: number; vy?: number }

/** Chispitas (un solo dibujo para todas). */
class Chispitas {
  n = 420;
  pos = new Float32Array(this.n * 3);
  vel = new Float32Array(this.n * 3);
  col = new Float32Array(this.n * 3);
  tam = new Float32Array(this.n);
  vida = new Float32Array(this.n);
  grav = new Float32Array(this.n);
  i = 0;
  puntos: THREE.Points;
  constructor() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('tam', new THREE.BufferAttribute(this.tam, 1));
    this.puntos = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { mapa: { value: puntoSuave() }, escala: { value: 300 } },
      vertexShader: 'attribute float tam; attribute vec3 color; varying vec3 vC; uniform float escala; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = tam * escala / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D mapa; varying vec3 vC; void main(){ vec4 t = texture2D(mapa, gl_PointCoord); gl_FragColor = vec4(vC * t.a * 1.6, t.a); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.puntos.frustumCulled = false;
  }
  soltar(x: number, y: number, z: number, vx: number, vy: number, vz: number, c: THREE.Color, tam: number, vida: number, grav = 9) {
    const i = this.i;
    this.i = (this.i + 1) % this.n;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx, vy, vz], i * 3);
    this.col.set([c.r, c.g, c.b], i * 3);
    this.tam[i] = tam;
    this.vida[i] = vida;
    this.grav[i] = grav;
  }
  mover(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.vida[i] <= 0) {
        if (this.tam[i] > 0) this.tam[i] = 0;
        continue;
      }
      this.vida[i] -= dt;
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3] *= 0.97;
      this.vel[i * 3 + 2] *= 0.97;
      if (this.vida[i] < 0.15) this.tam[i] *= 0.85;
    }
    const g = this.puntos.geometry;
    (g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (g.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    (g.getAttribute('tam') as THREE.BufferAttribute).needsUpdate = true;
  }
}

export class Efectos {
  grupo = new THREE.Group();
  private destellos: Destello[] = [];
  private chispas = new Chispitas();
  private kit: THREE.Object3D | null = null;
  private proy = new Map<number, THREE.Object3D>();
  private estrellasMareo: THREE.Sprite[][] = [[], []];
  private rayos = new Map<number, THREE.Mesh>();
  private t = 0;

  constructor() {
    this.grupo.add(this.chispas.puntos);
    const T = texturas();
    for (let q = 0; q < 2; q++) {
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.estrella, color: '#ffe066', depthTest: false, transparent: true }));
        s.scale.setScalar(0.26);
        s.visible = false;
        s.renderOrder = 5;
        this.estrellasMareo[q].push(s);
        this.grupo.add(s);
      }
    }
  }

  async cargarKit() {
    try {
      this.kit = await cargar('peleas/cosas.glb');
    } catch {
      this.kit = null;
    }
  }

  /** Una copia de una pieza del kit de Blender (o null si no está). */
  pieza(clave: string): THREE.Object3D | null {
    const p = this.kit?.getObjectByName(`m_${clave}`);
    if (!p) return null;
    const c = p.clone(true);
    c.position.set(0, 0, 0);
    c.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).userData.noLiberar = true) : null));
    return c;
  }

  private sprite(map: THREE.Texture, color: string, x: number, y: number, tam: number, dur: number, crece: number, z = 0.6, aditivo = true) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, depthTest: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending }));
    s.position.set(x, y, z);
    s.scale.setScalar(tam);
    s.renderOrder = 6;
    this.grupo.add(s);
    const d: Destello = { s, t: 0, dur, crece, base: tam };
    this.destellos.push(d);
    return d;
  }

  /** Chispa de golpe: estrella, anillo, chispitas y (si fue fuerte) un letrero de historieta. */
  golpe(x: number, y: number, fuerza: number, tapado: boolean, efecto: Efecto) {
    const T = texturas();
    const color = tapado ? '#a8d8ff' : COLOR_EFECTO[efecto];
    const c = new THREE.Color(color);
    if (tapado) {
      this.sprite(T.escudo, '#bfe6ff', x, y, 0.7 + fuerza * 0.1, 0.18, 0.5);
      for (let i = 0; i < 6; i++) this.chispas.soltar(x, y, 0.5, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 2, c, 0.12, 0.25);
      return;
    }
    this.sprite(T.estrella, '#ffffff', x, y, 0.55 + fuerza * 0.28, 0.14 + fuerza * 0.03, 1.6);
    this.sprite(T.estrella, color, x, y, 0.9 + fuerza * 0.35, 0.2 + fuerza * 0.04, 1.2).s.material.rotation = Math.random() * 3;
    this.sprite(T.anillo, color, x, y, 0.3, 0.22 + fuerza * 0.04, 6 + fuerza * 2);
    const n = 8 + fuerza * 7;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 5 * fuerza;
      this.chispas.soltar(x, y, 0.5, Math.cos(a) * v, Math.sin(a) * v + 2, (Math.random() - 0.5) * 3, c, 0.12 + Math.random() * 0.12, 0.25 + Math.random() * 0.3);
    }
    if (fuerza >= 2 && Math.random() < (fuerza >= 3 ? 0.9 : 0.4)) {
      const w = T.palabras[Math.floor(Math.random() * T.palabras.length)];
      const d = this.sprite(w, '#ffffff', x + (Math.random() - 0.5) * 0.5, y + 0.7, 1, 0.55, 0.4, 1, false);
      d.s.scale.set(1.5, 0.56, 1);
      d.vy = 1.2;
    }
  }

  /** Polvo al caer al piso o al aterrizar. */
  polvo(x: number, fuerte = false) {
    const c = new THREE.Color('#e8d8c0');
    const T = texturas();
    for (let i = 0; i < (fuerte ? 6 : 3); i++) {
      const d = this.sprite(T.humo, '#f4e8d8', x + (Math.random() - 0.5) * (fuerte ? 1.4 : 0.6), 0.2, fuerte ? 0.9 : 0.5, 0.6, 1.5, 0.3, false);
      d.s.material.opacity = 0.6;
    }
    for (let i = 0; i < (fuerte ? 10 : 4); i++) this.chispas.soltar(x, 0.1, 0.3, (Math.random() - 0.5) * 4, Math.random() * 2, (Math.random() - 0.5), c, 0.1, 0.4, 6);
  }

  /** Nube de niebla (el Conde que se esfuma), escape de agarre o choque de proyectiles. */
  nube(x: number, y: number, color: string, n = 7, tam = 0.9) {
    const T = texturas();
    for (let i = 0; i < n; i++) {
      const d = this.sprite(T.humo, color, x + (Math.random() - 0.5) * 0.9, y + (Math.random() - 0.5) * 1.2, tam * (0.6 + Math.random() * 0.6), 0.7, 1.4, 0.4, false);
      d.s.material.opacity = 0.75;
      d.vy = 0.6;
    }
  }

  chispaSola(x: number, y: number, color: string, n = 12, v = 4) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      this.chispas.soltar(x, y, 0.4, Math.cos(a) * v * Math.random(), Math.sin(a) * v * Math.random() + 1, (Math.random() - 0.5) * 2, c, 0.14, 0.5, 4);
    }
  }

  /** Lo que se dibuja cada cuadro (proyectiles, estrellitas, rayo, fuego) a partir de la pelea. */
  actualizar(dt: number, sim: Pick<Sim, 'P' | 'L'>, cabezas: THREE.Vector3[], manos: THREE.Vector3[]) {
    this.t += dt;
    for (let i = this.destellos.length - 1; i >= 0; i--) {
      const d = this.destellos[i];
      d.t += dt;
      const k = d.t / d.dur;
      if (k >= 1) {
        d.s.removeFromParent();
        d.s.material.dispose();
        this.destellos.splice(i, 1);
        continue;
      }
      if (d.vy) d.s.position.y += d.vy * dt;
      if (d.s.scale.x === d.s.scale.y) d.s.scale.setScalar(d.base * (1 + d.crece * k));
      d.s.material.opacity = (1 - k * k) * (d.s.material.blending === THREE.NormalBlending ? 0.9 : 1);
    }
    this.chispas.mover(dt);
    // Estrellitas del mareo
    sim.L.forEach((p, q) => {
      const ver = p.estado === 'mareado';
      this.estrellasMareo[q].forEach((s, i) => {
        s.visible = ver;
        if (!ver) return;
        const a = this.t * 4 + (i / 3) * Math.PI * 2;
        s.position.set(cabezas[q].x + Math.cos(a) * 0.45, cabezas[q].y + 0.15 + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.45);
      });
    });
    // Proyectiles
    const vistos = new Set<number>();
    for (const x of sim.P) {
      vistos.add(x.id);
      if (x.tipo === 'rayo') {
        this.dibujarRayo(x, sim);
        continue;
      }
      if (x.tipo === 'lluvia') continue;
      let o = this.proy.get(x.id);
      if (!o) {
        o = this.crearProy(x);
        this.proy.set(x.id, o);
        this.grupo.add(o);
      }
      o.position.set(x.x, x.y, 0);
      if (x.tipo === 'bala') {
        o.rotation.y = x.lado > 0 ? 0 : Math.PI;
        o.rotation.z = Math.sin(this.t * 12) * 0.15;
        if (Math.random() < 0.5) this.chispas.soltar(x.x - x.lado * 0.2, x.y + (Math.random() - 0.5) * 0.3, 0, -x.vx * 0.1, 0.4, 0, new THREE.Color(COLOR_EFECTO[x.efecto]), 0.14, 0.35, 0);
      } else if (x.tipo === 'caida') {
        o.rotation.y += dt * 5;
      } else if (x.tipo === 'trampa') {
        const armada = x.t > 20;
        o.scale.setScalar(armada ? 1 + Math.sin(this.t * 6) * 0.04 : Math.min(1, x.t / 12));
        if (armada && Math.random() < 0.2) this.chispas.soltar(x.x + (Math.random() - 0.5) * 0.4, 0.6, 0, 0, 0.8, 0, new THREE.Color('#b07cff'), 0.12, 0.6, -0.5);
      } else if (x.tipo === 'ola') {
        o.scale.set(x.lado, 1 + Math.sin(this.t * 14) * 0.06, 1);
        if (Math.random() < 0.9) this.chispas.soltar(x.x - x.lado * 0.5, 0.3 + Math.random() * 0.9, (Math.random() - 0.5), -x.vx * 0.2, 2, 0, new THREE.Color('#ffffff'), 0.2, 0.5, 5);
      }
    }
    for (const [id, o] of this.proy) {
      if (!vistos.has(id)) {
        o.removeFromParent();
        this.proy.delete(id);
      }
    }
    for (const [id, m] of this.rayos) {
      if (!vistos.has(id)) {
        m.removeFromParent();
        (m.material as THREE.Material).dispose();
        this.rayos.delete(id);
      }
    }
    // Fuego del aliento y la cuerda de rescate
    sim.L.forEach((p, q) => {
      const g = p.golpe;
      if (p.estado !== 'ataque' || !g) return;
      const activo = p.t >= g.arranque && p.t < g.arranque + g.activo;
      if (g.especial === 'fuego' && activo) {
        const c1 = new THREE.Color('#ff7a2a'), c2 = new THREE.Color('#ffd070');
        for (let i = 0; i < 6; i++) {
          const v = 6 + Math.random() * 4;
          this.chispas.soltar(cabezas[q].x + p.lado * 0.4, cabezas[q].y - 0.45, 0.2, p.lado * v, (Math.random() - 0.4) * 2.2, (Math.random() - 0.5) * 1.5, Math.random() < 0.5 ? c1 : c2, 0.3 + Math.random() * 0.25, 0.28, -1);
        }
      }
      if (g.especial === 'cuerda' && p.t >= g.arranque - 2 && p.t < g.arranque + g.activo) {
        const k = Math.min(1, (p.t - g.arranque + 1) / (g.activo * 0.6));
        const largo = Math.max(0.2, (g.proy?.alcance ?? 3.8) * k);
        const c = new THREE.Color('#f2c94c');
        for (let i = 0; i < 10; i++) this.chispas.soltar(manos[q].x + p.lado * largo * (i / 10), manos[q].y + Math.sin(i + this.t * 20) * 0.04, 0.3, 0, 0, 0, c, 0.09, 0.05, 0);
      }
    });
  }

  private crearProy(x: Proyectil): THREE.Object3D {
    const clave = x.tipo === 'trampa' ? 'jarron' : x.tipo === 'ola' ? 'ola' : PIEZA_PROY[x.efecto] ?? 'estrella';
    const kit = this.pieza(clave);
    const g = new THREE.Group();
    if (kit) g.add(kit);
    else {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturas().estrella, color: COLOR_EFECTO[x.efecto], blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      s.scale.setScalar(x.tipo === 'ola' ? 1.8 : 0.8);
      g.add(s);
    }
    // Un brillo alrededor (lo que es luz)
    if (x.tipo === 'bala' || x.tipo === 'caida') {
      const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: puntoSuave(), color: COLOR_EFECTO[x.efecto], blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 }));
      b.scale.setScalar(1.1);
      g.add(b);
    }
    return g;
  }

  private dibujarRayo(x: Proyectil, sim: Pick<Sim, 'L'>) {
    const p = sim.L[x.dueno];
    let m = this.rayos.get(x.id);
    if (!m) {
      m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texturas().rayo, color: COLOR_EFECTO[x.efecto], blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      m.renderOrder = 4;
      this.rayos.set(x.id, m);
      this.grupo.add(m);
    }
    const largo = 13;
    const grosor = 1.15 + Math.sin(this.t * 40) * 0.08;
    m.scale.set(largo, grosor, 1);
    m.position.set(p.x + p.lado * (0.6 + largo / 2), p.y + 1.05, 0.4);
    const k = Math.min(1, x.t / 6) * Math.min(1, (x.vida - x.t) / 8);
    (m.material as THREE.MeshBasicMaterial).opacity = k;
    const c = new THREE.Color(COLOR_EFECTO[x.efecto]);
    for (let i = 0; i < 3; i++) this.chispas.soltar(p.x + p.lado * (0.8 + Math.random() * 10), p.y + 1.05 + (Math.random() - 0.5) * 0.8, 0.5, p.lado * 6, (Math.random() - 0.5) * 2, 0, c, 0.22, 0.3, 0);
  }

  limpiar() {
    for (const o of this.proy.values()) o.removeFromParent();
    this.proy.clear();
    for (const m of this.rayos.values()) m.removeFromParent();
    this.rayos.clear();
  }
}
