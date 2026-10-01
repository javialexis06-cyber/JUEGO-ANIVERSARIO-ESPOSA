// Los poderes del retrete espacial: salen flotando en su burbuja (con su ícono 3D brillante), se agarran
// tocándolos y duran lo que digan las mejoras. Aquí vive lo que se ve de cada uno: la burbuja de jabón alrededor
// del retrete, el imán, el cañón desatascador con sus rayos, el mini-retrete ayudante y el «×2» que flota.
import * as THREE from 'three';
import { nota } from '../../sonido';
import { CUADRO } from './arte';
import { type IdPoder, PODERES, type ProgresoCohete, duracionPoder, poderDisponible, valorDe } from './datos';
import type { Efectos } from './efectos';
import type { Modelos } from './modelos';
import type { Obst, Obstaculos } from './obstaculos';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const BURBUJA_V = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = -mv.xyz;
  vP = position;
  gl_Position = projectionMatrix * mv;
}`;
const BURBUJA_F = /* glsl */ `
uniform float tiempo, alfa;
uniform vec3 tinte;
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN), v = normalize(vV);
  float f = 1.0 - abs(dot(n, v));
  float h = f * 2.2 + vP.y * 0.9 + vP.x * 0.4 + tiempo * 0.35;
  vec3 iri = 0.5 + 0.5 * cos(6.2831 * (h + vec3(0.0, 0.33, 0.67)));
  vec3 col = mix(tinte, iri, 0.6) * (0.25 + pow(f, 1.4) * 1.1);
  float a = (pow(f, 2.2) * 0.8 + 0.05);
  float brillo = pow(max(0.0, dot(n, normalize(vec3(-0.45, 0.6, 0.65)))), 60.0);
  float brillo2 = pow(max(0.0, dot(n, normalize(vec3(0.5, -0.4, 0.75)))), 120.0);
  col += (brillo * 1.6 + brillo2 * 0.8);
  a = (a + brillo * 0.9 + brillo2 * 0.5) * alfa;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

export function materialBurbuja(tinte = '#BFEFFF') {
  return new THREE.ShaderMaterial({
    uniforms: { tiempo: { value: 0 }, alfa: { value: 1 }, tinte: { value: new THREE.Color(tinte) } },
    vertexShader: BURBUJA_V,
    fragmentShader: BURBUJA_F,
    transparent: true,
    depthWrite: false,
  });
}

/** Letrero en un lienzo (el «×2» que flota y los avisos 3D). */
function letrero(texto: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.font = '900 96px Fredoka, Nunito, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 16;
  g.strokeStyle = '#5A3A00';
  g.strokeText(texto, 128, 68);
  g.fillStyle = color;
  g.fillText(texto, 128, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(1.3, 0.65, 1);
  return s;
}

interface Recogible {
  id: IdPoder;
  obj: THREE.Group;
  x: number;
  y: number;
  t: number;
  vivo: boolean;
}

interface Rayo {
  m: THREE.Mesh;
  x: number;
  y: number;
  blanco: Obst;
  vida: number;
}

export class Poderes {
  /** Lo que está prendido: segundos que le quedan y su duración total. */
  activos = new Map<IdPoder, { resta: number; total: number }>();
  private recogibles: Recogible[] = [];
  private proximo = 7;
  private ultimo: IdPoder | null = null;
  // Lo que se le pega al retrete
  readonly burbuja: THREE.Mesh;
  private matBurbuja: THREE.ShaderMaterial;
  private iman: THREE.Object3D | null;
  private canon: THREE.Object3D | null;
  private doble: THREE.Sprite;
  // El ayudante
  ayudante: THREE.Object3D | null = null;
  readonly posAyudante = new THREE.Vector2(-6, 2);
  private helice: THREE.Object3D | null = null;
  private rayos: Rayo[] = [];
  private libresRayo: THREE.Mesh[] = [];
  private proxDisparo = 0;
  private halo: THREE.Texture;
  private t = 0;
  /** Para la burbuja chiquita de cada recogible. */
  private matBurbujaChica: THREE.ShaderMaterial;
  private geoBurbuja = new THREE.SphereGeometry(1, 32, 20);

  constructor(
    private mundo: THREE.Group,
    private nave: THREE.Group,
    private modelos: Modelos,
    private fx: Efectos,
    private p: ProgresoCohete,
    halo: THREE.Texture,
  ) {
    this.halo = halo;
    this.matBurbuja = materialBurbuja();
    this.burbuja = new THREE.Mesh(this.geoBurbuja, this.matBurbuja);
    this.burbuja.scale.setScalar(0.95);
    this.burbuja.position.set(0, 0.5, 0);
    this.burbuja.renderOrder = 9;
    this.burbuja.visible = false;
    nave.add(this.burbuja);
    this.matBurbujaChica = materialBurbuja('#FFFFFF');
    this.iman = modelos.cosa('iman_nave', 0.55);
    if (this.iman) {
      this.iman.position.set(0.48, 0.62, 0.25);
      this.iman.visible = false;
      nave.add(this.iman);
    }
    this.canon = modelos.cosa('canon_nave', 0.62);
    if (this.canon) {
      this.canon.position.set(0.42, 0.15, 0.32);
      this.canon.visible = false;
      nave.add(this.canon);
    }
    this.doble = letrero('×2', '#FFD23F');
    this.doble.position.set(0, 1.85, 0.2);
    this.doble.visible = false;
    nave.add(this.doble);
  }

  tiene(id: IdPoder) {
    return this.activos.has(id);
  }

  /** Prende un poder (o le suma tiempo si ya estaba). Devuelve su duración. */
  activar(id: IdPoder, segundos?: number) {
    const total = segundos ?? duracionPoder(this.p, id);
    if (PODERES[id].instantaneo) return 0;
    const a = this.activos.get(id);
    if (a) {
      a.resta = Math.max(a.resta, total);
      a.total = Math.max(a.total, total);
    } else this.activos.set(id, { resta: total, total });
    if (id === 'mini' && !this.ayudante) this.llamarAyudante();
    return total;
  }

  apagar(id: IdPoder) {
    this.activos.delete(id);
  }

  private llamarAyudante() {
    const o = this.modelos.cosa('ayudante', 1.1) ?? this.modelos.poder('mini');
    this.ayudante = o;
    this.helice = o.getObjectByName('helice') ?? null;
    this.posAyudante.set(this.nave.position.x - 5, this.nave.position.y + 3);
    o.position.set(this.posAyudante.x, this.posAyudante.y, 0.3);
    this.mundo.add(o);
    this.fx.estallido(this.posAyudante.x, this.posAyudante.y, CUADRO.estrella, ['#FFFFFF', '#8FE3C8'], 10, 3, 0.35, true);
  }

  // ------------------------------------------------------------------ Recogibles
  /** Va sacando poderes en su burbuja (más seguido con la mejora de suerte). */
  aparecer(dt: number, limX: number, limY: number, obst: Obst[]) {
    this.proximo -= dt;
    if (this.proximo > 0) return;
    this.proximo = rnd(9, 14) * valorDe(this.p, 'suerte');
    const posibles = (Object.keys(PODERES) as IdPoder[]).filter((id) => poderDisponible(this.p, id) && id !== this.ultimo && !this.activos.has(id));
    if (!posibles.length) return;
    // Los raros (paca, ambientador) salen menos
    const peso = (id: IdPoder) => (id === 'paca' || id === 'ambientador' ? 0.5 : id === 'turbo' ? 1.2 : 1);
    let r = Math.random() * posibles.reduce((s, id) => s + peso(id), 0);
    let id = posibles[0];
    for (const c of posibles) {
      r -= peso(c);
      if (r <= 0) {
        id = c;
        break;
      }
    }
    this.ultimo = id;
    let y = rnd(-limY * 0.75, limY * 0.75);
    // Que no salga encima de una roca
    for (let k = 0; k < 6 && obst.some((o) => o.vivo && Math.abs(o.x - (limX + 2)) < 3 && Math.abs(o.y - y) < o.radio + 1.2); k++) y = rnd(-limY * 0.75, limY * 0.75);
    this.sacar(id, limX + 2.5, y);
  }

  sacar(id: IdPoder, x: number, y: number) {
    const g = new THREE.Group();
    const modelo = this.modelos.poder(id);
    modelo.name = 'modelo';
    g.add(modelo);
    const burbuja = new THREE.Mesh(this.geoBurbuja, this.matBurbujaChica);
    burbuja.scale.setScalar(0.78);
    burbuja.renderOrder = 9;
    g.add(burbuja);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.halo, color: PODERES[id].color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    halo.scale.setScalar(2.6);
    halo.renderOrder = 4;
    g.add(halo);
    g.position.set(x, y, 0);
    this.mundo.add(g);
    this.recogibles.push({ id, obj: g, x, y, t: Math.random() * 5, vivo: true });
  }

  /** Mueve los recogibles; si alguno toca la nave, lo devuelve. */
  recoger(dt: number, avance: number, nx: number, ny: number, radio: number): IdPoder | null {
    let agarrado: IdPoder | null = null;
    for (const r of this.recogibles) {
      if (!r.vivo) continue;
      r.t += dt;
      r.x -= avance;
      const y = r.y + Math.sin(r.t * 2.4) * 0.25;
      r.obj.position.set(r.x, y, 0);
      const m = r.obj.getObjectByName('modelo');
      if (m) {
        m.rotation.y = Math.sin(r.t * 1.5) * 0.9;
        m.rotation.z = Math.sin(r.t * 2.1) * 0.15;
      }
      const s = 1 + Math.sin(r.t * 5) * 0.04;
      r.obj.scale.setScalar(s);
      if (Math.random() < dt * 6) {
        const a = Math.random() * Math.PI * 2;
        this.fx.brillo.emitir({ x: r.x + Math.cos(a) * 0.75, y: y + Math.sin(a) * 0.75, z: 0.3, vida: 0.6, tam0: 0.3, tam1: 0.05, color0: '#FFFFFF', color1: PODERES[r.id].color, cuadro: CUADRO.chispa, arrastre: 1, giro: a });
      }
      if (!agarrado && Math.hypot(r.x - nx, y - ny) < radio + 0.8) {
        agarrado = r.id;
        r.vivo = false;
        this.fx.chispazo(r.x, y, PODERES[r.id].color, 14, 0.5);
        this.fx.onda(r.x, y, 3.5, 0.4, PODERES[r.id].color);
        this.mundo.remove(r.obj);
        this.soltarRecogible(r);
      } else if (r.x < -30) {
        r.vivo = false;
        this.mundo.remove(r.obj);
        this.soltarRecogible(r);
      }
    }
    let w = 0;
    for (const r of this.recogibles) if (r.vivo) this.recogibles[w++] = r;
    this.recogibles.length = w;
    return agarrado;
  }

  private soltarRecogible(r: Recogible) {
    r.obj.traverse((o) => {
      const s = o as THREE.Sprite;
      if (s.isSprite) (s.material as THREE.Material).dispose();
    });
  }

  // ------------------------------------------------------------------ Cada cuadro
  /**
   * Avanza los tiempos y lo que se ve. Devuelve los poderes que se acabaron en este cuadro.
   */
  actualizar(dt: number, mundo: number, obst: Obstaculos, alDestruir: (o: Obst, por: 'laser') => void): IdPoder[] {
    this.t += dt;
    const fin: IdPoder[] = [];
    for (const [id, a] of this.activos) {
      a.resta -= dt;
      if (a.resta <= 0) {
        this.activos.delete(id);
        fin.push(id);
      }
    }
    // Burbuja: titila cuando se va a acabar
    const esc = this.activos.get('escudo');
    this.burbuja.visible = !!esc && (esc.resta > 2 || Math.sin(this.t * 22) > -0.2);
    this.matBurbuja.uniforms.tiempo.value = this.t;
    this.matBurbujaChica.uniforms.tiempo.value = this.t;
    this.burbuja.scale.setScalar(0.95 + Math.sin(this.t * 3) * 0.025);
    // Imán: con ondas que salen
    const im = this.activos.get('iman');
    if (this.iman) {
      this.iman.visible = !!im;
      if (im) {
        this.iman.rotation.z = Math.sin(this.t * 6) * 0.1;
        if (Math.random() < dt * 4) {
          const p = this.iman.getWorldPosition(new THREE.Vector3());
          this.fx.onda(p.x + 0.3, p.y, 2.2, 0.5, Math.random() < 0.5 ? '#FF6B6B' : '#7FC8FF');
        }
      }
    }
    // Cañón desatascador: dispara solo al que esté adelante
    const laser = this.activos.get('laser');
    if (this.canon) this.canon.visible = !!laser;
    this.proxDisparo -= dt;
    if (laser && this.proxDisparo <= 0) {
      const boca = (this.canon ?? this.nave).getWorldPosition(new THREE.Vector3());
      boca.x += 0.45;
      const b = obst.blancoAdelante(boca.x, boca.y, 15);
      if (b) {
        this.disparar(boca.x, boca.y, b);
        this.proxDisparo = 0.32;
      }
    }
    this.moverRayos(dt, obst, alDestruir);
    // ×2 flotando
    this.doble.visible = this.activos.has('doble');
    if (this.doble.visible) {
      this.doble.position.y = 1.85 + Math.sin(this.t * 3) * 0.08;
      this.doble.material.rotation = Math.sin(this.t * 2) * 0.12;
    }
    // Ayudante: busca rollitos o se queda cerca
    if (this.ayudante) {
      const activo = this.activos.has('mini');
      if (this.helice) this.helice.rotation.y += dt * 30;
      if (!activo) {
        // Se despide subiendo
        this.posAyudante.y += dt * 6;
        this.posAyudante.x -= dt * 3;
        if (this.posAyudante.y > 10) {
          this.mundo.remove(this.ayudante);
          this.ayudante = null;
        }
      }
      if (this.ayudante) {
        this.ayudante.position.set(this.posAyudante.x, this.posAyudante.y + Math.sin(this.t * 4) * 0.08, 0.3);
        this.ayudante.rotation.z = Math.sin(this.t * 3) * 0.15;
        if (Math.random() < dt * 12) {
          this.fx.brillo.emitir({ x: this.posAyudante.x, y: this.posAyudante.y - 0.45, vx: -2, vy: -2, vida: 0.25, tam0: 0.35, tam1: 0.05, color0: '#FFF3B0', color1: '#FF8A3C', cuadro: CUADRO.llama, arrastre: 1 });
        }
      }
    }
    return fin;
  }

  /** El ayudante vuela hacia `meta` (o se queda junto a la nave si no hay nada). */
  guiarAyudante(dt: number, meta: { x: number; y: number } | null) {
    if (!this.ayudante || !this.activos.has('mini')) return;
    const mx = meta ? meta.x : this.nave.position.x - 0.6, my = meta ? meta.y : this.nave.position.y + 2.1;
    const dx = mx - this.posAyudante.x, dy = my - this.posAyudante.y;
    const d = Math.hypot(dx, dy);
    const v = Math.min(d, dt * (meta ? 13 : 8));
    if (d > 1e-3) {
      this.posAyudante.x += (dx / d) * v;
      this.posAyudante.y += (dy / d) * v;
    }
  }

  private disparar(x: number, y: number, blanco: Obst) {
    const m = this.libresRayo.pop() ?? new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.6, 4, 8), new THREE.MeshBasicMaterial({ color: '#FFB3E6', toneMapped: false }));
    m.rotation.z = Math.PI / 2;
    m.position.set(x, y, 0.3);
    m.visible = true;
    if (!m.parent) this.mundo.add(m);
    this.rayos.push({ m, x, y, blanco, vida: 1 });
    nota(1700, 0.08, 0, 'square', 0.03, 500);
    this.fx.chispazo(x, y, '#FF4FA3', 5, 0.3);
  }

  private moverRayos(dt: number, obst: Obstaculos, alDestruir: (o: Obst, por: 'laser') => void) {
    for (let i = this.rayos.length - 1; i >= 0; i--) {
      const r = this.rayos[i];
      r.vida -= dt;
      const b = r.blanco;
      const dx = b.x - r.x, dy = b.y - r.y;
      const d = Math.hypot(dx, dy);
      const paso = dt * 34;
      if (b.vivo && d > paso + b.radio * 0.5) {
        r.x += (dx / d) * paso;
        r.y += (dy / d) * paso;
        r.m.position.set(r.x, r.y, 0.3);
        r.m.rotation.z = Math.atan2(dy, dx) + Math.PI / 2;
        this.fx.brillo.emitir({ x: r.x, y: r.y, vida: 0.15, tam0: 0.5, tam1: 0.1, color0: '#FF4FA3', color1: '#FF4FA3', cuadro: CUADRO.brillo, alfa: 0.7 });
      } else {
        if (b.vivo) {
          alDestruir(b, 'laser');
          obst.destruir(b);
        }
        r.vida = 0;
      }
      if (r.vida <= 0) {
        r.m.visible = false;
        this.libresRayo.push(r.m);
        this.rayos.splice(i, 1);
      }
    }
  }

  /** Revienta la burbuja (choque con el escudo). */
  reventar() {
    this.activos.delete('escudo');
    const p = this.burbuja.getWorldPosition(new THREE.Vector3());
    this.fx.estallido(p.x, p.y, CUADRO.burbuja, ['#BFF0FF', '#D9C8FF', '#FFD6EE'], 22, 6, 0.45);
    this.fx.onda(p.x, p.y, 4, 0.35, '#BFF0FF');
  }

  /** Quita todo (fin del vuelo o la tienda). */
  vaciar() {
    this.activos.clear();
    for (const r of this.recogibles) {
      this.mundo.remove(r.obj);
      this.soltarRecogible(r);
    }
    this.recogibles = [];
    for (const r of this.rayos) {
      r.m.visible = false;
      this.libresRayo.push(r.m);
    }
    this.rayos = [];
    if (this.ayudante) this.mundo.remove(this.ayudante);
    this.ayudante = null;
    this.burbuja.visible = false;
    if (this.iman) this.iman.visible = false;
    if (this.canon) this.canon.visible = false;
    this.doble.visible = false;
  }

  /** Recogibles a la vista (para el bot de pruebas). */
  get flotando() {
    return this.recogibles.map((r) => ({ id: r.id, x: r.x, y: r.y }));
  }

  liberar() {
    this.vaciar();
    this.matBurbuja.dispose();
    this.matBurbujaChica.dispose();
    this.geoBurbuja.dispose();
    (this.doble.material.map as THREE.Texture).dispose();
    this.doble.material.dispose();
  }
}
