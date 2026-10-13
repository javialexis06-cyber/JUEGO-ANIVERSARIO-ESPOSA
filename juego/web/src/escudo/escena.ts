// El Escudo de las Hermanas: lo que se ve. Arma el Borde de Astra con los kits de Blender (escudo_mapa, escudo_torres,
// escudo_enemigos y las criaturas de la granja), sigue al motor (motor.ts) y dibuja sus eventos con efectos. Cámara
// inclinada que se mueve con un dedo y se acerca con dos. 30 cuadros por segundo y la calidad baja sola.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { cargar, copia, elegirModelos } from '../recursos';
import { ELEMENTOS, ENEMIGOS, TORRES, type IdEnemigo, type IdTorre, type Nivel, type Punto } from './datos';
import { distanciaACaminos, enRuta, hayIsla, type Enemigo, type Evento, type Motor, type Proyectil, type Torre } from './motor';

// ------------------------------------------------------------------------------------------------- utilidades

/** Azar con semilla para repartir la utilería (cada nivel se ve igual cada vez). */
function azar(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

let texHalo: THREE.Texture | null = null;
/** Brillo redondo suave (para chispas, almas de luz y destellos). */
export function texturaHalo() {
  if (texHalo) return texHalo;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.3, 'rgba(255,255,255,.6)');
  r.addColorStop(0.7, 'rgba(255,255,255,.12)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  texHalo = new THREE.CanvasTexture(c);
  texHalo.colorSpace = THREE.SRGBColorSpace;
  return texHalo;
}

let texHumo: THREE.Texture | null = null;
function texturaHumo() {
  if (texHumo) return texHumo;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  for (let k = 0; k < 6; k++) {
    const x = 20 + Math.random() * 24, y = 20 + Math.random() * 24, r0 = 10 + Math.random() * 12;
    const r = g.createRadialGradient(x, y, 0, x, y, r0);
    r.addColorStop(0, 'rgba(255,255,255,.55)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  }
  texHumo = new THREE.CanvasTexture(c);
  texHumo.colorSpace = THREE.SRGBColorSpace;
  return texHumo;
}

let texAnillo: THREE.Texture | null = null;
function texturaAnillo() {
  if (texAnillo) return texAnillo;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(64, 64, 40, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,0)');
  r.addColorStop(0.75, 'rgba(255,255,255,.15)');
  r.addColorStop(0.92, 'rgba(255,255,255,.9)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  texAnillo = new THREE.CanvasTexture(c);
  texAnillo.colorSpace = THREE.SRGBColorSpace;
  return texAnillo;
}

/** El cielo de Astra: degradado, nebulosas y miles de estrellas (una esfera grande con su textura). */
function cielo(arriba: string, abajo: string) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext('2d')!;
  const f = g.createLinearGradient(0, 0, 0, 1024);
  f.addColorStop(0, abajo);
  f.addColorStop(0.45, arriba);
  f.addColorStop(0.62, abajo);
  f.addColorStop(1, '#010103');
  g.fillStyle = f;
  g.fillRect(0, 0, 2048, 1024);
  const r = azar(91);
  // Nebulosas (manchones de color)
  for (let k = 0; k < 18; k++) {
    const x = r() * 2048, y = 250 + r() * 500, rr = 120 + r() * 260;
    const col = ['rgba(150,90,255,', 'rgba(80,160,255,', 'rgba(255,140,190,', 'rgba(90,220,200,'][k % 4];
    const n = g.createRadialGradient(x, y, 0, x, y, rr);
    n.addColorStop(0, col + '0.16)');
    n.addColorStop(1, col + '0)');
    g.fillStyle = n;
    g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  for (let k = 0; k < 2600; k++) {
    const x = r() * 2048, y = r() * 1024, s = r() < 0.04 ? 1.8 : r() < 0.3 ? 1.1 : 0.6;
    g.fillStyle = `rgba(${220 + r() * 35},${220 + r() * 35},255,${0.4 + r() * 0.6})`;
    g.beginPath();
    g.arc(x, y, s, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10;
  return m;
}

/** Copia una pieza del kit (vacío m_<clave>) como InstancedMesh, una por malla, con todas las matrices dadas. */
function instanciar(pieza: THREE.Object3D, matrices: THREE.Matrix4[], sombras = true): THREE.Group {
  const g = new THREE.Group();
  if (!matrices.length) return g;
  pieza.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(pieza.matrixWorld).invert();
  pieza.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const local = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const im = new THREE.InstancedMesh(m.geometry, m.material, matrices.length);
    const tmp = new THREE.Matrix4();
    matrices.forEach((mt, i) => im.setMatrixAt(i, tmp.multiplyMatrices(mt, local)));
    im.castShadow = sombras;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    g.add(im);
  });
  return g;
}

const mat4 = (x: number, y: number, z: number, giro = 0, esc = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), giro), new THREE.Vector3(esc, esc, esc));

// ------------------------------------------------------------------------------------------------- partículas

interface Particula { s: THREE.Sprite; vx: number; vy: number; vz: number; vida: number; total: number; tam0: number; tam1: number; gravedad: number; op: number }

class Particulas {
  private libres: THREE.Sprite[] = [];
  private vivas: Particula[] = [];
  readonly grupo = new THREE.Group();
  constructor(private max = 260) {}
  emitir(x: number, y: number, z: number, o: { color: string; n?: number; vel?: number; arriba?: number; vida?: number; tam?: [number, number]; gravedad?: number;
    humo?: boolean; op?: number; dir?: [number, number, number] }) {
    const n = o.n ?? 8;
    for (let i = 0; i < n; i++) {
      if (this.vivas.length >= this.max) this.morir(0);
      let s = this.libres.pop();
      const tex = o.humo ? texturaHumo() : texturaHalo();
      if (!s || (s.material as THREE.SpriteMaterial).map !== tex) {
        if (s) { s.material.dispose(); }
        s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: o.humo ? THREE.NormalBlending : THREE.AdditiveBlending, fog: false }));
      }
      (s.material as THREE.SpriteMaterial).color.set(o.color);
      s.position.set(x, y, z);
      s.visible = true;
      this.grupo.add(s);
      const v = o.vel ?? 2;
      const a = Math.random() * Math.PI * 2, b = Math.random() * 0.6;
      const d = o.dir;
      const vida = (o.vida ?? 0.7) * (0.7 + Math.random() * 0.6);
      this.vivas.push({
        s, vida, total: vida, tam0: o.tam?.[0] ?? 0.5, tam1: o.tam?.[1] ?? 0.1, gravedad: o.gravedad ?? 0, op: o.op ?? 1,
        vx: d ? d[0] * v * (0.6 + Math.random() * 0.6) + (Math.random() - 0.5) * v * 0.4 : Math.cos(a) * v * (0.3 + Math.random()),
        vy: d ? d[1] * v + (Math.random() - 0.5) * v * 0.3 : (o.arriba ?? 1) * (0.5 + Math.random()) + Math.sin(b) * v * 0.3,
        vz: d ? d[2] * v * (0.6 + Math.random() * 0.6) + (Math.random() - 0.5) * v * 0.4 : Math.sin(a) * v * (0.3 + Math.random()),
      });
    }
  }
  private morir(i: number) {
    const p = this.vivas[i];
    p.s.visible = false;
    this.grupo.remove(p.s);
    this.libres.push(p.s);
    this.vivas.splice(i, 1);
  }
  actualizar(dt: number) {
    for (let i = this.vivas.length - 1; i >= 0; i--) {
      const p = this.vivas[i];
      p.vida -= dt;
      if (p.vida <= 0) { this.morir(i); continue; }
      p.vy -= p.gravedad * dt;
      p.s.position.x += p.vx * dt;
      p.s.position.y += p.vy * dt;
      p.s.position.z += p.vz * dt;
      const t = 1 - p.vida / p.total;
      p.s.scale.setScalar(p.tam0 + (p.tam1 - p.tam0) * t);
      (p.s.material as THREE.SpriteMaterial).opacity = p.op * Math.min(1, (1 - t) * 2.2);
    }
  }
  limpiar() {
    while (this.vivas.length) this.morir(0);
  }
}

// ------------------------------------------------------------------------------------------------- la escena

interface VistaEnemigo { o: THREE.Group; cuerpo: THREE.Object3D; alas?: THREE.Object3D[]; barra: THREE.Group; relleno: THREE.Mesh; fase: number; golpe: number; tipo: IdEnemigo }
interface VistaTorre { o: THREE.Group; clave: string; animado?: { mixer: THREE.AnimationMixer; raiz: THREE.Object3D }; cabeza?: THREE.Object3D; llama?: THREE.Object3D; luna?: THREE.Object3D;
  orbes?: THREE.Object3D[]; orbe?: THREE.Object3D; humo: number; salto: number }
interface VistaProyectil { o: THREE.Object3D; halo?: THREE.Sprite }
interface Efecto { o: THREE.Object3D; t: number; dur: number; animar: (t: number) => void }

/** Alturas de las bases (como en el motor). */
const ALTURA_BASE = [0.33, 0.48, 0.58];

export interface Calidad { nivel: 0 | 1 | 2 }

export class EscenaEscudo {
  readonly renderer: THREE.WebGLRenderer;
  readonly escena = new THREE.Scene();
  readonly camara = new THREE.PerspectiveCamera(36, 1, 0.5, 400);
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  /** 2 alta (sombras y brillo), 1 media (sombras), 0 baja. */
  calidad: 0 | 1 | 2 = 2;
  private kits: Record<string, THREE.Object3D> = {};
  private criaturas: Record<string, { escena: THREE.Group; clips: THREE.AnimationClip[] }> = {};
  readonly mundo = new THREE.Group();
  private mapa = new THREE.Group();
  private particulas = new Particulas();
  private enemigos = new Map<number, VistaEnemigo>();
  private torres = new Map<number, VistaTorre>();
  private proyectiles = new Map<number, VistaProyectil>();
  private efectos: Efecto[] = [];
  private sitiosVista: THREE.Object3D[] = [];
  private marcaSitio: THREE.Mesh;
  private alcance: THREE.Mesh;
  private cortina: THREE.Mesh | null = null;
  private cortinaMat: THREE.ShaderMaterial | null = null;
  private golpeEscudo = 0;
  private sol = new THREE.DirectionalLight('#dfe4ff', 1.9);
  /** Cámara: punto que mira, distancia, inclinación. */
  objetivo = new THREE.Vector3(0, 0, 0.8);
  distancia = 27;
  inclinacion = 0.98;
  giroCam = 0;
  /** Lo que la cámara quiere (se acerca suavecito). */
  private objetivoMeta = new THREE.Vector3(0, 0, 0.8);
  private distanciaMeta = 27;
  libreCamara = true;
  private reloj = 0;
  private cuadros: number[] = [];
  private ultimoAjuste = 0;
  /** Capa de textos flotantes (+luz). */
  capaTextos: HTMLElement | null = null;
  private textos: { el: HTMLElement; p: THREE.Vector3; t: number }[] = [];
  /** Lo que el juego agrega encima (las Santas, la pareja y la constelación). */
  readonly extras = new THREE.Group();
  nivel: Nivel | null = null;
  finRuta: Punto = [17, 0];
  private ondaLazo = 0;

  constructor(lienzo: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.escena.add(this.mundo, this.particulas.grupo, this.extras);
    // Luces: la luz fría de las estrellas desde arriba y un rebote morado desde el abismo
    this.escena.add(new THREE.HemisphereLight('#b9c8ff', '#3a2450', 0.95));
    this.sol.position.set(-14, 26, 16);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(2048, 2048);
    const sc = this.sol.shadow.camera;
    sc.left = -24; sc.right = 24; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 80;
    this.sol.shadow.bias = -0.0008;
    this.sol.shadow.normalBias = 0.03;
    this.escena.add(this.sol, this.sol.target);
    const calida = new THREE.DirectionalLight('#ffd0a0', 0.55);
    calida.position.set(20, 8, -6);
    this.escena.add(calida);
    this.marcaSitio = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: texturaAnillo(), color: '#ffd98a', transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.marcaSitio.rotation.x = -Math.PI / 2;
    this.marcaSitio.visible = false;
    this.alcance = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.13, depthWrite: false, fog: false }));
    const borde = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 2.04), new THREE.MeshBasicMaterial({ map: texturaAnillo(), color: '#ffe9a8', transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false }));
    this.alcance.add(borde);
    this.alcance.rotation.x = -Math.PI / 2;
    this.alcance.visible = false;
    this.escena.add(this.marcaSitio, this.alcance);
  }

  async cargar(avance: (f: number) => void = () => undefined) {
    await elegirModelos();
    const lista: [string, Promise<unknown>][] = [
      ['mapa', cargar('escudo_mapa.glb')], ['torres', cargar('escudo_torres.glb')], ['enemigos', cargar('escudo_enemigos.glb')],
    ];
    let hechos = 0;
    const { cargarAnimado } = await import('../recursos');
    const criaturas = ['dragon', 'grifo', 'unicornio'].map((c) => cargarAnimado(`granja-v3/${c}_lod.glb`).then((r) => { this.criaturas[c] = r; avance(++hechos / 6); }));
    const kits = await Promise.all(lista.map(([, p]) => p.then((g) => { avance(++hechos / 6); return g as THREE.Group; })));
    await Promise.all(criaturas);
    for (const k of kits) {
      for (const h of k.children) if (h.name.startsWith('m_')) this.kits[h.name.slice(2)] = h;
    }
  }

  /** Una copia de una pieza del kit (comparte geometría y materiales). */
  pieza(clave: string): THREE.Object3D {
    const p = this.kits[clave];
    if (!p) { console.warn('falta la pieza', clave); return new THREE.Group(); }
    const c = copia(p);
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.scale.set(1, 1, 1);
    return c;
  }

  criatura(id: 'dragon' | 'grifo' | 'unicornio', clip = 'reposo') {
    const c = this.criaturas[id];
    const o = c.escena.clone(true);
    const mixer = new THREE.AnimationMixer(o);
    const a = c.clips.find((x) => x.name === clip) ?? c.clips[0];
    if (a) mixer.clipAction(a).play();
    mixer.update(Math.random() * 2);
    return { o, mixer, clips: c.clips };
  }

  // ------------------------------------------------------------------------------------------------ el mapa

  montarNivel(m: Motor) {
    this.limpiarNivel();
    const n = m.nivel;
    this.nivel = n;
    const r = azar(n.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
    this.escena.background = new THREE.Color(n.cielo[1]);
    this.escena.fog = new THREE.Fog(n.cielo[1], 42, 110);
    const fondo = cielo(n.cielo[0], n.cielo[1]);
    this.mapa.add(fondo);
    // Celia a lo lejos, detrás del escudo (el mundo que se defiende)
    const planeta = new THREE.Mesh(new THREE.SphereGeometry(16, 40, 20), new THREE.MeshStandardMaterial({ color: '#5f9a6a', emissive: '#1a3a4a', emissiveIntensity: 0.5,
      roughness: 1, fog: false }));
    planeta.position.set(70, -6, -95);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaHalo(), color: '#9fd6ff', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
      depthWrite: false, fog: false }));
    halo.scale.setScalar(52);
    halo.position.copy(planeta.position);
    this.mapa.add(planeta, halo);
    // Las islas: cuadrícula de 4 m (las de la orilla con más roca colgando)
    const porTipo: Record<string, THREE.Matrix4[]> = { isla_a: [], isla_b: [], isla_c: [], isla_borde: [] };
    for (let ix = -4; ix <= 4; ix++) {
      for (let iz = -2; iz <= 2; iz++) {
        const x = ix * 4, z = iz * 4;
        if (!hayIsla(n, x, z)) continue;
        const orilla = Math.abs(ix) === 4 || Math.abs(iz) === 2 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !hayIsla(n, x + a * 4, z + b * 4));
        const tipo = orilla ? 'isla_borde' : (['isla_a', 'isla_b', 'isla_c'] as const)[Math.floor(r() * 3)];
        porTipo[tipo].push(mat4(x + (r() - 0.5) * 0.3, -0.02 - r() * 0.04, z + (r() - 0.5) * 0.3, Math.floor(r() * 4) * Math.PI / 2, 1.16));
      }
    }
    for (const [k, ms] of Object.entries(porTipo)) this.mapa.add(instanciar(this.kits[k], ms));
    // Islitas sueltas flotando en el abismo
    const sueltas: THREE.Matrix4[] = [];
    for (let k = 0; k < 14; k++) {
      const a = r() * Math.PI * 2;
      const x = Math.cos(a) * (24 + r() * 14), z = Math.sin(a) * (15 + r() * 10);
      sueltas.push(mat4(x, -3 - r() * 6, z, r() * 6, 0.3 + r() * 0.45));
    }
    this.mapa.add(instanciar(this.kits.isla_a, sueltas, false));
    // El camino: losas en filas a lo largo de cada ruta (sin repetir donde las rutas se juntan)
    const losas: THREE.Matrix4[][] = [[], [], [], []];
    const puestas: [number, number][] = [];
    const lejos = (x: number, z: number) => puestas.every(([a, b]) => (a - x) ** 2 + (b - z) ** 2 > 0.13);
    for (const ruta of m.rutas) {
      for (let s = 0; s < ruta.largo; s += 0.4) {
        const q = enRuta(ruta, s);
        for (let k = -2; k <= 2; k++) {
          const lado = k * 0.36 + (r() - 0.5) * 0.12;
          const x = q.x - q.dz * lado + (r() - 0.5) * 0.08, z = q.z + q.dx * lado + (r() - 0.5) * 0.08;
          if (!lejos(x, z) || x > 17.4 || x < -18) continue;
          puestas.push([x, z]);
          const e = 0.85 + r() * 0.3 - Math.abs(k) * 0.07;
          losas[Math.floor(r() * 4)].push(mat4(x, 0.02, z, r() * 6, e));
        }
      }
    }
    losas.forEach((ms, i) => this.mapa.add(instanciar(this.kits[`losa_${i + 1}`], ms, false)));
    // La tierra pisada debajo (marca el camino contra el musgo)
    const tierra: THREE.Matrix4[] = [];
    const manchas: [number, number][] = [];
    for (const ruta of m.rutas) {
      for (let s = 0; s < ruta.largo; s += 0.5) {
        const q = enRuta(ruta, s);
        if (q.x > 17.4 || manchas.some(([a, b]) => (a - q.x) ** 2 + (b - q.z) ** 2 < 0.12)) continue;
        manchas.push([q.x, q.z]);
        tierra.push(mat4(q.x + (r() - 0.5) * 0.15, 0.006, q.z + (r() - 0.5) * 0.15, r() * 6, 1.45 + r() * 0.25));
      }
    }
    if (this.kits.tierra) this.mapa.add(instanciar(this.kits.tierra, tierra, false));
    // Los portales (donde empiezan las rutas) y el ancla del escudo (donde terminan)
    const portales: Punto[] = [];
    for (const ruta of m.rutas) {
      const p = ruta.p[0];
      if (portales.some(([x, z]) => Math.hypot(x - p[0], z - p[1]) < 1)) continue;
      portales.push(p);
      const o = this.pieza('portal');
      o.position.set(p[0] - 0.6, 0, p[1]);
      o.rotation.y = Math.PI / 2;
      this.mapa.add(o);
      const luz = new THREE.PointLight('#b05cff', 4, 8, 1.6);
      luz.position.set(p[0], 1.6, p[1]);
      this.mapa.add(luz);
      this.agregarEfecto(o, 1e9, (t) => { if (Math.random() < 0.3) this.particulas.emitir(p[0] - 0.3, 0.4 + Math.random() * 2, p[1] + (Math.random() - 0.5) * 2, { color: '#9a5cff', n: 1, vel: 0.6, arriba: 0.5, vida: 1.4, tam: [0.4, 0.05], op: 0.7 }); void t; });
    }
    const fin = m.rutas[0].p[m.rutas[0].p.length - 1];
    this.finRuta = fin;
    const ancla = this.pieza('ancla_escudo');
    ancla.position.set(fin[0] + 0.3, 0, fin[1]);
    ancla.rotation.y = Math.PI / 2;
    this.mapa.add(ancla);
    const luzAncla = new THREE.PointLight('#ffe0a0', 6, 12, 1.4);
    luzAncla.position.set(fin[0] - 0.5, 2.5, fin[1]);
    this.mapa.add(luzAncla);
    this.montarCortina(fin);
    // Sitios para construir
    this.sitiosVista = m.sitios.map(([x, z]) => {
      const o = this.pieza('zocalo');
      o.position.set(x, 0, z);
      o.rotation.y = r() * 6;
      this.mapa.add(o);
      return o;
    });
    // La utilería: lejos del camino, de los sitios y de donde se paran los defensores
    const ocupado: [number, number, number][] = m.sitios.map(([x, z]) => [x, z, 1.5]);
    ocupado.push([fin[0] - 1.5, fin[1] - 2.6, 1.2], [fin[0] - 1.5, fin[1] + 2.6, 1.2], [fin[0] - 0.4, fin[1] - 3.8, 1.2], [fin[0] - 0.4, fin[1] + 3.8, 1.2], [fin[0], fin[1], 3]);
    for (const p of portales) ocupado.push([p[0], p[1], 2.5]);
    const libre = (x: number, z: number, rad: number) => hayIsla(n, x, z) && distanciaACaminos(m.rutas, x, z) > 1.3 + rad && ocupado.every(([a, b, c]) => Math.hypot(a - x, b - z) > c + rad);
    const grandes = new Set(['arbol_estelar', 'tienda_campana', 'arco_roto', 'columna_rota', 'roca_lunar_2']);
    let puestosProps = 0;
    for (let k = 0; k < 900 && puestosProps < 46; k++) {
      const clave = n.utileria[Math.floor(r() * n.utileria.length)];
      const rad = grandes.has(clave) ? 1.3 : 0.6;
      const x = -16.5 + r() * 32.5, z = -9 + r() * 18;
      if (!libre(x, z, rad)) continue;
      ocupado.push([x, z, rad]);
      const o = this.pieza(clave);
      o.position.set(x, 0, z);
      o.rotation.y = clave.startsWith('estandarte') || clave === 'farol_estrella' ? Math.atan2(-x, -z) + (r() - 0.5) * 0.6 : r() * 6.3;
      o.scale.setScalar(0.85 + r() * 0.3);
      this.mapa.add(o);
      puestosProps++;
    }
    // Matas pequeñas por todos lados (que nada se vea vacío)
    const matas: THREE.Matrix4[] = [], hongos: THREE.Matrix4[] = [], rocas: THREE.Matrix4[] = [];
    for (let k = 0; k < 2200 && matas.length + hongos.length + rocas.length < 120; k++) {
      const x = -17 + r() * 34, z = -9.4 + r() * 18.8;
      if (!libre(x, z, 0.2)) continue;
      ocupado.push([x, z, 0.4]);
      const v = r();
      (v < 0.55 ? matas : v < 0.75 ? hongos : rocas).push(mat4(x, 0, z, r() * 6, 0.45 + r() * 0.35));
    }
    this.mapa.add(instanciar(this.kits.flores_estrella, matas, false), instanciar(this.kits.hongos_luz, hongos, false), instanciar(this.kits.roca_lunar_1, rocas));
    this.mundo.add(this.mapa);
    this.prepararSombra();
    // La cámara: que quepa todo el ancho del mapa
    this.encuadrar(true);
  }

  private montarCortina(fin: Punto) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { t: { value: 0 }, golpe: { value: 0 }, lazo: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float t; uniform float golpe; uniform float lazo;
        void main(){
          float y = vUv.y;
          float borde = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          float fade = (1.0 - y) * 0.9 + 0.1;
          vec2 h = vec2(vUv.x * 30.0, y * 12.0 + t * 0.3);
          float panal = abs(sin(h.x) * sin(h.y + sin(h.x * 0.5)));
          float lineas = smoothstep(0.92, 1.0, panal) * 0.6;
          float onda = 0.5 + 0.5 * sin(y * 18.0 - t * 2.5 + vUv.x * 6.0);
          vec3 c = mix(vec3(0.55, 0.8, 1.0), vec3(1.0, 0.85, 0.5), 0.35 + 0.25 * sin(t * 0.7 + vUv.x * 3.0));
          c = mix(c, vec3(1.0, 0.3, 0.3), golpe);
          c = mix(c, vec3(1.0, 0.82, 0.95), lazo * 0.7);
          float a = (0.10 + lineas * 0.35 + onda * 0.05) * fade * borde * (1.0 + golpe * 1.5 + lazo * 1.6);
          gl_FragColor = vec4(c * a, a);
        }`,
    });
    this.cortinaMat = mat;
    const c = new THREE.Mesh(new THREE.PlaneGeometry(20, 7, 1, 1), mat);
    c.position.set(fin[0] + 0.6, 3.4, 0);
    c.rotation.y = Math.PI / 2;
    c.renderOrder = 5;
    this.cortina = c;
    this.mapa.add(c);
  }

  private prepararSombra() {
    this.sol.castShadow = this.calidad >= 1;
    this.renderer.shadowMap.enabled = this.calidad >= 1;
    this.sol.shadow.mapSize.set(this.calidad === 2 ? 2048 : 1024, this.calidad === 2 ? 2048 : 1024);
    this.sol.shadow.map?.dispose();
    (this.sol.shadow as any).map = null;
  }

  limpiarNivel() {
    this.mundo.remove(this.mapa);
    this.mapa.traverse((o) => {
      if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
    });
    this.mapa = new THREE.Group();
    for (const v of this.enemigos.values()) this.mundo.remove(v.o);
    for (const v of this.torres.values()) this.mundo.remove(v.o);
    for (const v of this.proyectiles.values()) this.mundo.remove(v.o);
    for (const e of this.efectos) e.o.parent?.remove(e.o);
    this.enemigos.clear();
    this.torres.clear();
    this.proyectiles.clear();
    this.efectos = [];
    this.particulas.limpiar();
    for (const t of this.textos) t.el.remove();
    this.textos = [];
    this.marcaSitio.visible = false;
    this.alcance.visible = false;
  }

  /** Encuadra el mapa entero (o se acerca a un punto). */
  encuadrar(ya = false) {
    const aspecto = Math.max(1, this.camara.aspect || 2);
    const anchoVisible = 40;
    const vfov = (this.camara.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspecto);
    const d = anchoVisible / 2 / Math.tan(hfov / 2) * 1.02;
    this.distanciaMeta = Math.min(36, Math.max(16, d));
    this.objetivoMeta.set(0.8, 0, 1.2);
    if (ya) {
      this.distancia = this.distanciaMeta;
      this.objetivo.copy(this.objetivoMeta);
    }
  }

  /** El mundo visible desde la cámara de ahora: mover (dx, dy en píxeles) y acercar. */
  arrastrar(dx: number, dy: number) {
    const esc = this.distancia / (this.renderer.domElement.clientHeight || 400) * 1.1;
    this.objetivoMeta.x -= dx * esc;
    this.objetivoMeta.z -= dy * esc / Math.sin(this.inclinacion);
    this.limitar();
    this.objetivo.copy(this.objetivoMeta);
  }
  acercar(f: number) {
    this.distanciaMeta = Math.min(36, Math.max(9, this.distanciaMeta * f));
    this.limitar();
  }
  private limitar() {
    const holgura = Math.max(0, (36 - this.distanciaMeta) / 36);
    this.objetivoMeta.x = Math.min(10 * holgura + 3, Math.max(-10 * holgura - 3, this.objetivoMeta.x));
    this.objetivoMeta.z = Math.min(6 * holgura + 2.5, Math.max(-6 * holgura - 1, this.objetivoMeta.z));
  }
  mirarA(x: number, z: number, dist: number) {
    this.objetivoMeta.set(x, 0, z);
    this.distanciaMeta = dist;
  }

  /** Punto del piso bajo un toque (null si es cielo). */
  puntoEnPiso(px: number, py: number): Punto | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, this.camara);
    const p = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return null;
    return [p.x, p.z];
  }

  /** Pixel de pantalla de un punto del mundo (para los menús que salen junto a una torre). */
  aPantalla(x: number, y: number, z: number): [number, number] {
    const v = new THREE.Vector3(x, y, z).project(this.camara);
    const r = this.renderer.domElement.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  }

  marcarSitio(p: Punto | null) {
    this.marcaSitio.visible = !!p;
    if (p) this.marcaSitio.position.set(p[0], 0.2, p[1]);
  }

  mostrarAlcance(p: Punto | null, radio = 0, color = '#ffe9a8') {
    this.alcance.visible = !!p;
    if (!p) return;
    this.alcance.position.set(p[0], 0.18, p[1]);
    this.alcance.scale.setScalar(radio);
    (this.alcance.material as THREE.MeshBasicMaterial).color.set(color);
    ((this.alcance.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(color);
  }

  // ------------------------------------------------------------------------------------------------ torres

  private armarTorre(m: Motor, t: Torre): VistaTorre {
    const o = new THREE.Group();
    o.position.set(t.x, 0, t.z);
    const nivelVis = t.rama ? 3 : t.nivel;
    o.add(this.pieza(`base_${nivelVis}`));
    const alto = ALTURA_BASE[nivelVis - 1];
    const v: VistaTorre = { o, clave: `${t.tipo}${t.nivel}${t.rama ?? ''}`, humo: 0, salto: 0 };
    const cuerpo = new THREE.Group();
    cuerpo.position.y = alto;
    o.add(cuerpo);
    const crece = 0.9 + nivelVis * 0.06;
    cuerpo.scale.setScalar(crece);
    const poner = (clave: string, y = 0) => { const p = this.pieza(clave); p.position.y = y; cuerpo.add(p); return p; };
    const animar = (id: 'dragon' | 'grifo' | 'unicornio', esc: number, y: number) => {
      const c = this.criatura(id);
      c.o.scale.setScalar(esc);
      c.o.position.y = y;
      const cabeza = new THREE.Group();
      cabeza.position.y = 0;
      cabeza.add(c.o);
      cuerpo.add(cabeza);
      v.animado = { mixer: c.mixer, raiz: c.o };
      v.cabeza = cabeza;
    };
    switch (t.tipo) {
      case 'aura':
        poner('aura_altar');
        v.llama = poner('aura_llama', 1.12);
        if (t.rama) poner(`aura_${t.rama}`);
        break;
      case 'lara':
        poner('lara_altar');
        v.luna = poner('lara_luna', 1.95);
        if (t.rama) poner(`lara_${t.rama}`);
        break;
      case 'dragon':
        poner('dragon_nido');
        animar('dragon', 0.36 + nivelVis * 0.03, 0.15);
        if (t.rama) poner(`dragon_${t.rama}`);
        break;
      case 'grifo':
        poner('grifo_percha');
        animar('grifo', 0.33 + nivelVis * 0.02, 1.86);
        if (t.rama) poner(`grifo_${t.rama}`);
        break;
      case 'unicornio':
        poner('unicornio_fuente');
        animar('unicornio', 0.34 + nivelVis * 0.02, 0.2);
        if (t.rama) poner(`unicornio_${t.rama}`);
        break;
      case 'fuatia':
        poner('fuatia_pilar');
        if (t.rama === 'a') poner('fuatia_a');
        if (t.rama === 'b') {
          poner('fuatia_b');
          v.orbes = (['fuego', 'agua', 'tierra', 'aire'] as const).map((e) => poner(`fuatia_${e}`, 2.0));
        } else v.orbe = poner(`fuatia_${t.elemento}`, 2.0);
        break;
    }
    // Un brillo suave del color de la torre (sprite: una luz de verdad obligaría a recompilar los sombreadores)
    const brillo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaHalo(), color: TORRES[t.tipo].color, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    brillo.scale.setScalar(2.2);
    brillo.position.y = alto + 1.3;
    o.add(brillo);
    void m;
    return v;
  }

  private sincronizarTorres(m: Motor, dt: number) {
    const vivos = new Set<number>();
    for (const t of m.torres) {
      vivos.add(t.id);
      let v = this.torres.get(t.id);
      const clave = `${t.tipo}${t.nivel}${t.rama ?? ''}${t.tipo === 'fuatia' && !t.rama ? t.elemento : ''}`;
      if (!v || v.clave !== clave) {
        const nueva = !v;
        if (v) this.mundo.remove(v.o);
        v = this.armarTorre(m, t);
        v.clave = clave;
        this.torres.set(t.id, v);
        this.mundo.add(v.o);
        v.salto = nueva ? 1 : 0.7;
        this.particulas.emitir(t.x, 0.6, t.z, { color: TORRES[t.tipo].color, n: 18, vel: 2.4, arriba: 2, vida: 0.9, tam: [0.6, 0.1] });
      }
      // Animaciones: rebote al construir, la criatura mira a su blanco, la llama y la luna respiran
      v.salto = Math.max(0, v.salto - dt * 2.2);
      const s = 1 + Math.sin(v.salto * Math.PI * 3) * v.salto * 0.12;
      v.o.scale.set(s, 1 + (s - 1) * 1.6, s);
      if (v.animado) v.animado.mixer.update(dt * (t.apagada > 0 ? 0 : 1));
      if (v.cabeza && (t.tipo === 'dragon' || t.tipo === 'grifo' || t.tipo === 'unicornio')) {
        let d = t.giro - v.cabeza.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        v.cabeza.rotation.y += d * Math.min(1, dt * 8);
        const lanza = t.disparando > 0 ? Math.sin((t.disparando / 0.35) * Math.PI) : 0;
        v.cabeza.position.z = Math.cos(v.cabeza.rotation.y) * lanza * 0.15;
        v.cabeza.position.x = Math.sin(v.cabeza.rotation.y) * lanza * 0.15;
        if (t.tipo === 'grifo') v.cabeza.position.y = lanza * 0.25;
      }
      if (v.llama) {
        const f = t.apagada > 0 ? 0.25 : 1 + Math.sin(this.reloj * 9 + t.id) * 0.08 + t.disparando * 0.6;
        v.llama.scale.set(f, f * (1 + Math.sin(this.reloj * 13) * 0.05), f);
        v.llama.rotation.y += dt * 1.5;
      }
      if (v.luna) {
        v.luna.position.y = 1.95 + Math.sin(this.reloj * 1.6 + t.id) * 0.1;
        v.luna.rotation.y += dt * 0.8;
        v.luna.visible = t.apagada <= 0;
      }
      if (v.orbe) {
        v.orbe.position.y = 2.0 + Math.sin(this.reloj * 2.2 + t.id) * 0.08;
        v.orbe.rotation.y += dt * 2;
        v.orbe.scale.setScalar(t.cambiando > 0 ? 1 - Math.sin((t.cambiando / 1.2) * Math.PI) * 0.6 : 1);
      }
      if (v.orbes) {
        v.orbes.forEach((o, i) => {
          const a = this.reloj * 1.4 + (i * Math.PI) / 2;
          o.position.set(Math.cos(a) * 0.45, 2.0 + Math.sin(this.reloj * 2 + i) * 0.08, Math.sin(a) * 0.45);
        });
      }
      if (t.apagada > 0) {
        v.humo -= dt;
        if (v.humo <= 0) {
          v.humo = 0.12;
          this.particulas.emitir(t.x, 1.4, t.z, { color: '#2a2234', n: 2, vel: 0.5, arriba: 1.2, vida: 1.2, tam: [0.6, 1.3], humo: true, op: 0.8 });
        }
      }
    }
    for (const [id, v] of this.torres) if (!vivos.has(id)) { this.mundo.remove(v.o); this.torres.delete(id); }
  }

  /** Lo que hace falta para el ícono de una torre (la torre de nivel 1 sola). */
  armarTorreSuelta(tipo: IdTorre, nivel: 1 | 2 | 3 = 1, rama: 'a' | 'b' | null = null) {
    const t = { id: -1, tipo, sitio: 0, x: 0, z: 0, nivel, rama, recarga: 0, giro: 0.6, elemento: 'fuego', apagada: 0, cambiando: 0, reloj2: 0,
      bono: { dano: 0, rapidez: 0, alcance: 0 }, gastado: 0, disparando: 0, bajas: 0 } as Torre;
    const calidad = this.calidad;
    this.calidad = 0;
    const v = this.armarTorre(null as unknown as Motor, t);
    this.calidad = calidad;
    if (v.animado) v.animado.mixer.update(0.5);
    if (v.cabeza) v.cabeza.rotation.y = 0.5;
    return v.o;
  }

  // ------------------------------------------------------------------------------------------------ enemigos

  enemigoSuelto(tipo: IdEnemigo) {
    const o = new THREE.Group();
    const cuerpo = this.pieza(tipo === 'motita' ? 'mota' : tipo);
    o.add(cuerpo);
    if (tipo === 'motita') cuerpo.scale.setScalar(0.85);
    // Más grandecitos en la pantalla del celular (que se lean bien de lejos)
    o.scale.setScalar(tipo === 'jefe' ? 1.15 : tipo === 'golem' ? 1.1 : 1.3);
    let alas: THREE.Object3D[] | undefined;
    if (tipo === 'polilla') {
      alas = [-1, 1].map((s) => {
        const pivote = new THREE.Group();
        const a = this.pieza('polilla_ala');
        pivote.add(a);
        pivote.scale.x = s;
        pivote.position.set(s * 0.08, 0.05, 0);
        // El ala se exportó acostada en el piso de Blender (plano xy): en three queda en xz
        cuerpo.add(pivote);
        return pivote;
      });
    }
    return { o, cuerpo, alas };
  }

  private armarEnemigo(e: Enemigo): VistaEnemigo {
    const { o, cuerpo, alas } = this.enemigoSuelto(e.tipo);
    const d = ENEMIGOS[e.tipo];
    // Barra de vida (aparece cuando lo hieren)
    const barra = new THREE.Group();
    const ancho = Math.max(0.7, d.radio * 1.8);
    const fondo = new THREE.Mesh(new THREE.PlaneGeometry(ancho + 0.08, 0.16), new THREE.MeshBasicMaterial({ color: '#1a1020', depthTest: false, transparent: true, opacity: 0.85, fog: false }));
    const relleno = new THREE.Mesh(new THREE.PlaneGeometry(ancho, 0.1), new THREE.MeshBasicMaterial({ color: e.tipo === 'jefe' ? '#b05cff' : '#ff6a4a', depthTest: false, fog: false }));
    relleno.position.z = 0.001;
    relleno.geometry.translate(ancho / 2, 0, 0);
    relleno.position.x = -ancho / 2;
    fondo.renderOrder = relleno.renderOrder = 20;
    barra.add(fondo, relleno);
    barra.position.y = e.tipo === 'jefe' ? 3.7 : e.tipo === 'golem' ? 2.0 : e.tipo === 'sombra' ? 1.5 : e.tipo === 'divisora' ? 1.4 : 1.05;
    barra.visible = false;
    o.add(barra);
    const v: VistaEnemigo = { o, cuerpo, alas, barra, relleno, fase: Math.random() * 6, golpe: 0, tipo: e.tipo };
    this.particulas.emitir(e.x, 0.8, e.z, { color: '#9a5cff', n: 6, vel: 1.2, arriba: 1, vida: 0.7, tam: [0.6, 0.1] });
    return v;
  }

  private sincronizarEnemigos(m: Motor, dt: number) {
    const vivos = new Set<number>();
    const q = new THREE.Quaternion();
    this.camara.getWorldQuaternion(q);
    for (const e of m.enemigos) {
      vivos.add(e.id);
      let v = this.enemigos.get(e.id);
      if (!v) {
        v = this.armarEnemigo(e);
        this.enemigos.set(e.id, v);
        this.mundo.add(v.o);
      }
      const quieto = e.quieto > 0;
      v.fase += dt * (quieto ? 0 : ENEMIGOS[e.tipo].vel * (1 - e.lento) * 3.2);
      const y = e.aereo ? 2.1 + Math.sin(v.fase * 0.7) * 0.18 : 0;
      v.o.position.set(e.x, y, e.z);
      const giro = Math.atan2(e.dx, e.dz);
      let d = giro - v.o.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      v.o.rotation.y += d * Math.min(1, dt * 10);
      // Andares: la mota rebota, la sombra corre inclinada, el gólem pisa duro y la polilla aletea
      const c = v.cuerpo;
      switch (e.tipo) {
        case 'mota': case 'motita':
          c.position.y = Math.abs(Math.sin(v.fase * 1.6)) * 0.16;
          c.scale.set(1 + Math.sin(v.fase * 3.2) * 0.05, 1 - Math.sin(v.fase * 3.2) * 0.06, 1);
          if (e.tipo === 'motita') c.scale.multiplyScalar(0.85);
          break;
        case 'sombra':
          c.rotation.x = 0.25;
          c.position.y = Math.abs(Math.sin(v.fase * 2)) * 0.08;
          c.rotation.z = Math.sin(v.fase * 2) * 0.1;
          break;
        case 'golem':
          c.rotation.z = Math.sin(v.fase) * 0.07;
          c.position.y = Math.abs(Math.sin(v.fase)) * 0.06;
          break;
        case 'divisora':
          c.rotation.z = Math.sin(v.fase * 1.2) * 0.12;
          c.position.y = Math.abs(Math.sin(v.fase * 1.2)) * 0.08;
          break;
        case 'polilla':
          if (v.alas) v.alas.forEach((a, i) => (a.rotation.z = (i ? -1 : 1) * Math.sin(this.reloj * 16 + v!.fase) * 0.7));
          c.rotation.x = 0.15;
          break;
        case 'jefe':
          c.position.y = 0.15 + Math.sin(this.reloj * 1.3) * 0.12;
          c.rotation.z = Math.sin(this.reloj * 0.9) * 0.04;
          if (Math.random() < 0.35) this.particulas.emitir(e.x + (Math.random() - 0.5) * 1.5, 0.3, e.z + (Math.random() - 0.5) * 1.5, { color: '#2a2234', n: 1, vel: 0.4, arriba: 0.8, vida: 1.6, tam: [0.6, 1.4], humo: true, op: 0.7 });
          break;
      }
      // Quemado, ralentizado o enraizado se nota
      if (e.quemaT > 0 && Math.random() < 0.25) this.particulas.emitir(e.x, y + 0.6, e.z, { color: '#ff8a2a', n: 1, vel: 0.4, arriba: 1.4, vida: 0.5, tam: [0.35, 0.05] });
      if (e.lento > 0.3 && Math.random() < 0.12) this.particulas.emitir(e.x, y + 0.3, e.z, { color: '#c9b6ff', n: 1, vel: 0.3, arriba: 0.5, vida: 0.8, tam: [0.3, 0.05] });
      if (quieto && Math.random() < 0.2) this.particulas.emitir(e.x, 0.2, e.z, { color: '#9c6fd6', n: 1, vel: 0.6, arriba: 0.2, vida: 0.6, tam: [0.3, 0.05] });
      // Barra de vida mirando a la cámara
      const frac = Math.max(0, e.vida / e.vidaMax);
      v.barra.visible = frac < 0.999 || e.tipo === 'jefe';
      if (v.barra.visible) {
        v.relleno.scale.x = frac;
        v.barra.quaternion.copy(v.o.quaternion).invert().multiply(q);
      }
      v.golpe = Math.max(0, v.golpe - dt * 4);
    }
    for (const [id, v] of this.enemigos) if (!vivos.has(id)) { this.mundo.remove(v.o); this.enemigos.delete(id); }
  }

  // ------------------------------------------------------------------------------------------------ proyectiles

  private sincronizarProyectiles(m: Motor) {
    const vivos = new Set<number>();
    for (const p of m.proyectiles) {
      vivos.add(p.id);
      let v = this.proyectiles.get(p.id);
      if (!v) {
        v = this.armarProyectil(p);
        this.proyectiles.set(p.id, v);
        this.mundo.add(v.o);
      }
      const t = Math.max(0, Math.min(1, p.t / p.dur));
      v.o.visible = p.t >= 0;
      const blanco = m.enemigos.find((e) => e.id === p.blanco);
      const y1 = p.tipo === 'meteoro' ? 0.3 : blanco?.aereo ? 2.2 : 0.55;
      const x = p.x0 + (p.x1 - p.x0) * t, z = p.z0 + (p.z1 - p.z0) * t;
      const y = p.y0 + (y1 - p.y0) * t + p.arco * 4 * t * (1 - t);
      const antes = v.o.position.clone();
      v.o.position.set(x, y, z);
      const dir = v.o.position.clone().sub(antes);
      if (dir.lengthSq() > 1e-6) v.o.lookAt(v.o.position.clone().add(dir));
      if (p.tipo === 'fuego' || p.tipo === 'meteoro') this.particulas.emitir(x, y, z, { color: '#ffb040', n: p.tipo === 'meteoro' ? 4 : 1, vel: 0.3, arriba: 0.3, vida: 0.35, tam: [p.tipo === 'meteoro' ? 1.4 : 0.5, 0.05] });
      if (p.tipo === 'luz' && Math.random() < 0.6) this.particulas.emitir(x, y, z, { color: '#cfe8ff', n: 1, vel: 0.2, arriba: 0, vida: 0.3, tam: [0.35, 0.05] });
    }
    for (const [id, v] of this.proyectiles) if (!vivos.has(id)) { this.mundo.remove(v.o); this.proyectiles.delete(id); }
  }

  private armarProyectil(p: Proyectil): VistaProyectil {
    const o = new THREE.Group();
    let clave = 'orbe_luz';
    if (p.tipo === 'fuego') clave = 'bola_fuego';
    else if (p.tipo === 'pluma') clave = 'pluma';
    else if (p.tipo === 'meteoro') clave = 'meteoro';
    else if (p.tipo in ELEMENTOS) clave = `fuatia_${p.tipo}`;
    const pz = this.pieza(clave);
    // Las piezas se modelaron con la cola hacia +y de Blender (-z en three): lookAt mira hacia +z, así que se voltean
    if (clave === 'bola_fuego' || clave === 'pluma' || clave === 'meteoro') pz.rotation.y = Math.PI;
    if (p.tipo in ELEMENTOS) pz.scale.setScalar(0.7);
    o.add(pz);
    const color = p.tipo === 'fuego' || p.tipo === 'meteoro' ? '#ffb040' : p.tipo === 'pluma' ? '#ffe08a' : p.tipo === 'luz' ? '#cfe8ff' : ELEMENTOS[p.tipo as keyof typeof ELEMENTOS]?.color ?? '#fff';
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaHalo(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8, fog: false }));
    h.scale.setScalar(p.tipo === 'meteoro' ? 3 : 0.9);
    o.add(h);
    return { o, halo: h };
  }

  // ------------------------------------------------------------------------------------------------ eventos

  private agregarEfecto(o: THREE.Object3D, dur: number, animar: (t: number) => void, padre: THREE.Object3D = this.mapa) {
    padre.add(o);
    this.efectos.push({ o, t: 0, dur, animar });
  }

  private anilloSuelo(x: number, z: number, radio: number, color: string, dur = 0.6, crece = true) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: texturaAnillo(), color, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.15, z);
    this.agregarEfecto(m, dur, (t) => {
      m.scale.setScalar(radio * (crece ? 0.3 + 0.7 * t : 1));
      (m.material as THREE.MeshBasicMaterial).opacity = 1 - t;
      if (t >= 1) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
    }, this.mundo);
  }

  /** Texto que sube (+luz) sobre un punto del mundo. */
  textoFlotante(x: number, y: number, z: number, texto: string, clase = '') {
    if (!this.capaTextos) return;
    const el = document.createElement('div');
    el.className = `escudo-flota ${clase}`;
    el.textContent = texto;
    this.capaTextos.append(el);
    this.textos.push({ el, p: new THREE.Vector3(x, y, z), t: 0 });
  }

  /** Dibuja lo que pasó en este paso del motor. */
  eventos(m: Motor, evs: Evento[]) {
    for (const ev of evs) {
      switch (ev.k) {
        case 'impacto': {
          const y = ev.aereo && ev.radio === 0 ? 2.2 : 0.4;
          if (ev.tipo === 'fuego' || ev.tipo === 'meteoro') {
            const r = ev.radio;
            this.particulas.emitir(ev.x, 0.5, ev.z, { color: '#ffb040', n: ev.tipo === 'meteoro' ? 40 : 16, vel: r * 2.6, arriba: 2, vida: 0.6, tam: [ev.tipo === 'meteoro' ? 1.6 : 0.9, 0.1] });
            this.particulas.emitir(ev.x, 0.4, ev.z, { color: '#3a2a2a', n: ev.tipo === 'meteoro' ? 14 : 5, vel: r * 1.2, arriba: 1.2, vida: 1.0, tam: [0.8, 1.6], humo: true, op: 0.6 });
            this.anilloSuelo(ev.x, ev.z, r * 1.1, '#ff9a2a', 0.45);
            if (ev.tipo === 'meteoro') this.sacudir(0.5);
          } else if (ev.tipo === 'pluma') this.particulas.emitir(ev.x, y, ev.z, { color: '#ffe08a', n: 8, vel: 2, arriba: 0.6, vida: 0.4, tam: [0.5, 0.05] });
          else if (ev.tipo === 'luz') this.particulas.emitir(ev.x, y, ev.z, { color: '#cfe8ff', n: 6, vel: 1.5, arriba: 0.5, vida: 0.4, tam: [0.5, 0.05] });
          else {
            const c = ELEMENTOS[ev.tipo as keyof typeof ELEMENTOS]?.color ?? '#ffffff';
            this.particulas.emitir(ev.x, y, ev.z, { color: c, n: 8, vel: 1.8, arriba: 0.8, vida: 0.45, tam: [0.6, 0.05] });
            if (ev.tipo === 'tierra') this.particulas.emitir(ev.x, 0.3, ev.z, { color: '#6a5a40', n: 6, vel: 1.4, arriba: 2, vida: 0.7, tam: [0.4, 0.3], humo: true, gravedad: 6 });
          }
          break;
        }
        case 'pulso':
          this.anilloSuelo(ev.x, ev.z, ev.radio, ev.raiz ? '#c98bff' : '#b9a4f0', ev.raiz ? 0.9 : 0.7);
          if (ev.raiz) for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            this.particulas.emitir(ev.x + Math.cos(a) * ev.radio * 0.6, 0.2, ev.z + Math.sin(a) * ev.radio * 0.6, { color: '#9c6fd6', n: 2, vel: 0.5, arriba: 1.6, vida: 0.9, tam: [0.5, 0.1] });
          }
          break;
        case 'llamarada': {
          const t = this.torres.get(ev.torre);
          const y = t ? 0.9 + (t.cabeza?.position.y ?? 0) : 0.9;
          for (let k = 0; k < 5; k++) {
            const a = ev.giro + ((Math.random() - 0.5) * ev.cono * Math.PI) / 180;
            this.particulas.emitir(ev.x + Math.sin(ev.giro) * 0.5, y, ev.z + Math.cos(ev.giro) * 0.5, { color: k % 2 ? '#ffd27a' : '#ff7a2a', n: 1, vel: ev.alcance * 2.6, dir: [Math.sin(a), -0.15, Math.cos(a)], vida: 0.38, tam: [0.3, 1.1] });
          }
          break;
        }
        case 'rayo': {
          const pts: THREE.Vector3[] = [new THREE.Vector3(ev.de[0], 1.2, ev.de[1])];
          for (const [x, z] of ev.a) {
            const a = pts[pts.length - 1];
            for (let k = 1; k <= 3; k++) {
              const t = k / 4;
              pts.push(new THREE.Vector3(a.x + (x - a.x) * t + (Math.random() - 0.5) * 0.4, 1.2 + (Math.random() - 0.5) * 0.5, a.z + (z - a.z) * t + (Math.random() - 0.5) * 0.4));
            }
            pts.push(new THREE.Vector3(x, 1.0, z));
          }
          const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#9fe3ff', transparent: true, blending: THREE.AdditiveBlending, fog: false }));
          this.agregarEfecto(l, 0.25, (t) => { (l.material as THREE.LineBasicMaterial).opacity = 1 - t; if (t >= 1) { l.geometry.dispose(); (l.material as THREE.Material).dispose(); } }, this.mundo);
          for (const [x, z] of ev.a) this.particulas.emitir(x, 1, z, { color: '#9fe3ff', n: 4, vel: 1.5, vida: 0.3, tam: [0.5, 0.05] });
          break;
        }
        case 'muerte': {
          const y = ev.aereo ? 2.1 : 0.5;
          const grande = ev.tipo === 'golem' || ev.tipo === 'jefe' || ev.tipo === 'divisora';
          if (ev.acompanado) {
            // El alma se va con la luz de Lara: una estrellita que sube
            const o = this.pieza('estrella');
            o.position.set(ev.x, y + 0.4, ev.z);
            const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaHalo(), color: '#d9ccff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
            h.scale.setScalar(1.4);
            o.add(h);
            this.agregarEfecto(o, 1.6, (t) => {
              o.position.y = y + 0.4 + t * 3.5;
              o.rotation.y = t * 8;
              h.material.opacity = 1 - t;
              o.scale.setScalar(1 - t * 0.5);
              if (t >= 1) h.material.dispose();
            }, this.mundo);
            this.particulas.emitir(ev.x, y, ev.z, { color: '#e9e4ff', n: 14, vel: 1.4, arriba: 2.2, vida: 1.1, tam: [0.5, 0.05] });
          } else {
            this.particulas.emitir(ev.x, y, ev.z, { color: '#4a4452', n: grande ? 14 : 7, vel: grande ? 2 : 1.4, arriba: 1.4, vida: 0.9, tam: [grande ? 1.2 : 0.7, 1.5], humo: true, op: 0.75 });
            this.particulas.emitir(ev.x, y, ev.z, { color: '#ff8a3a', n: grande ? 10 : 4, vel: 2.2, arriba: 1.6, vida: 0.5, tam: [0.4, 0.05] });
          }
          this.textoFlotante(ev.x, y + 1, ev.z, `+${ev.luz}`, ev.acompanado ? 'alma' : '');
          if (ev.tipo === 'jefe') this.sacudir(1);
          break;
        }
        case 'fuga':
          this.golpeEscudo = 1;
          this.particulas.emitir(this.finRuta[0], 1.4, this.finRuta[1], { color: '#ff6a6a', n: 16, vel: 2.5, vida: 0.6, tam: [0.8, 0.1] });
          this.sacudir(0.25);
          break;
        case 'apaga':
          this.anilloSuelo(ev.x, ev.z, 1.6, '#6a3aa0', 0.8, false);
          this.particulas.emitir(ev.x, 1.5, ev.z, { color: '#2a2234', n: 12, vel: 1.2, arriba: 1.2, vida: 1.2, tam: [0.8, 1.6], humo: true });
          break;
        case 'invoca':
          this.anilloSuelo(ev.x, ev.z, 2.2, '#9a5cff', 0.8);
          break;
        case 'cura': {
          const t = m.torres.find((x) => x.id === ev.torre);
          if (t) {
            this.particulas.emitir(t.x, 1.5, t.z, { color: '#bfe6ff', n: 10, vel: 1, arriba: 2, vida: 0.9, tam: [0.5, 0.05] });
            this.textoFlotante(t.x, 2.6, t.z, '+♥', 'cura');
          }
          break;
        }
        case 'vende':
          this.particulas.emitir(ev.x, 0.8, ev.z, { color: '#ffe08a', n: 16, vel: 2, arriba: 2, vida: 0.8, tam: [0.5, 0.05] });
          break;
        case 'habilidad':
          if (ev.id === 'serena') {
            this.anilloSuelo(ev.x, ev.z, 2.8, '#c9b6ff', 1.2);
            for (let k = 0; k < 24; k++) {
              const a = Math.random() * Math.PI * 2, r = Math.random() * 2.6;
              this.particulas.emitir(ev.x + Math.cos(a) * r, 2.5 + Math.random(), ev.z + Math.sin(a) * r, { color: k % 2 ? '#e9e4ff' : '#9c7fe8', n: 1, vel: 0.3, arriba: -1.6, vida: 1.6, tam: [0.5, 0.1] });
            }
          } else if (ev.id === 'lazo') this.ondaLazo = 1;
          break;
        default:
          break;
      }
    }
  }

  private sacudida = 0;
  sacudir(f: number) {
    this.sacudida = Math.max(this.sacudida, f);
  }

  // ------------------------------------------------------------------------------------------------ cada cuadro

  /** Sigue al motor (si hay) y anima todo lo demás. */
  actualizar(dt: number, m: Motor | null) {
    this.reloj += dt;
    if (m) {
      this.sincronizarTorres(m, dt);
      this.sincronizarEnemigos(m, dt);
      this.sincronizarProyectiles(m);
    }
    this.particulas.actualizar(dt);
    for (let i = this.efectos.length - 1; i >= 0; i--) {
      const e = this.efectos[i];
      e.t += dt;
      const t = Math.min(1, e.t / e.dur);
      e.animar(t);
      if (t >= 1) { e.o.parent?.remove(e.o); this.efectos.splice(i, 1); }
    }
    this.golpeEscudo = Math.max(0, this.golpeEscudo - dt * 2.5);
    this.ondaLazo = Math.max(0, this.ondaLazo - dt * 0.12);
    if (this.cortinaMat) {
      this.cortinaMat.uniforms.t.value = this.reloj;
      this.cortinaMat.uniforms.golpe.value = this.golpeEscudo;
      this.cortinaMat.uniforms.lazo.value = m && m.lazo > 0 ? 0.6 + 0.4 * Math.sin(this.reloj * 6) : 0;
    }
    // Cámara: se acerca suavecito a lo que se pidió
    const k = Math.min(1, dt * 6);
    this.objetivo.lerp(this.objetivoMeta, k);
    this.distancia += (this.distanciaMeta - this.distancia) * k;
    const sx = (Math.random() - 0.5) * this.sacudida * 0.3, sy = (Math.random() - 0.5) * this.sacudida * 0.3;
    this.sacudida = Math.max(0, this.sacudida - dt * 2);
    this.camara.position.set(
      this.objetivo.x + Math.sin(this.giroCam) * Math.cos(this.inclinacion) * this.distancia + sx,
      this.objetivo.y + Math.sin(this.inclinacion) * this.distancia + sy,
      this.objetivo.z + Math.cos(this.giroCam) * Math.cos(this.inclinacion) * this.distancia,
    );
    this.camara.lookAt(this.objetivo);
    // Textos flotantes
    for (let i = this.textos.length - 1; i >= 0; i--) {
      const t = this.textos[i];
      t.t += dt;
      if (t.t > 1.1) { t.el.remove(); this.textos.splice(i, 1); continue; }
      const [x, y] = this.aPantalla(t.p.x, t.p.y + t.t * 0.9, t.p.z);
      t.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      t.el.style.opacity = String(Math.min(1, (1.1 - t.t) * 3));
    }
  }

  tamano(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
    this.composer?.setSize(w, h);
    if (this.nivel) this.encuadrar();
  }

  /** Dibuja (con brillo en calidad alta) y ajusta la calidad según lo que tarda. */
  render(msCuadro?: number) {
    if (this.calidad === 2 && !this.composer) {
      const w = this.renderer.domElement.width, h = this.renderer.domElement.height;
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.escena, this.camara));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.55, 0.5, 0.82);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight);
    }
    if (this.calidad === 2 && this.composer) this.composer.render();
    else this.renderer.render(this.escena, this.camara);
    if (msCuadro !== undefined) this.medir(msCuadro);
  }

  /** Si los cuadros tardan mucho, baja la calidad (y la resolución) solita. */
  private medir(ms: number) {
    this.cuadros.push(ms);
    // Los primeros cuadros se miden rápido (si el aparato no da, que se note de una)
    if (this.cuadros.length < (this.ultimoAjuste === 0 ? 10 : 45)) return;
    const prom = this.cuadros.reduce((a, b) => a + b, 0) / this.cuadros.length;
    this.cuadros = [];
    if (this.ultimoAjuste && performance.now() - this.ultimoAjuste < 2500) return;
    if (!this.ultimoAjuste) this.ultimoAjuste = 1;
    if (prom > 40) {
      this.ultimoAjuste = performance.now();
      const pr = this.renderer.getPixelRatio();
      if (this.calidad === 2) this.ponerCalidad(1);
      else if (pr > 0.75) { this.renderer.setPixelRatio(Math.max(0.7, pr - 0.25)); this.tamano(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight); }
      else if (this.calidad === 1) this.ponerCalidad(0);
    }
  }

  ponerCalidad(c: 0 | 1 | 2) {
    this.calidad = c;
    if (c < 2 && this.composer) {
      this.composer.dispose();
      this.bloom?.dispose();
      this.composer = null;
      this.bloom = null;
    }
    this.prepararSombra();
  }

  /** Suelta todo (y el contexto WebGL) al salir. */
  liberar() {
    this.limpiarNivel();
    this.composer?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
