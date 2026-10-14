// La escena del torneo: el renderizador (30 cuadros, calidad que baja sola), la cámara de lado que sigue a los dos y
// se acerca o se aleja según la distancia (y se va encima de quien lanza la súper o de quien cae en el K.O.), las luces
// de cada escenario, el cielo, lo que flota en el aire (polen dorado, brasas, nieve) y el escenario de Blender.
import * as THREE from 'three';
import { vigilarContexto } from '../../contexto';
import { cargar } from '../../recursos';
import type { DefEscenario, IdEscenario } from '../tipos';

export type Calidad = 'alta' | 'media' | 'baja';

interface Ambiente {
  cieloArriba: string;
  cieloAbajo: string;
  niebla: string;
  densidad: number;
  hemiCielo: string;
  hemiSuelo: string;
  hemi: number;
  sol: string;
  solFuerza: number;
  solDir: [number, number, number];
  relleno: string;
  exposicion: number;
  /** Lo que flota en el aire. */
  aire: { color: string; color2: string; n: number; cae: number; tam: number };
  piso: string;
}

export const ESCENARIOS: Record<IdEscenario, DefEscenario> = {
  plaza: { id: 'plaza', nombre: 'La Plaza del Pueblo del Sol', lema: 'Fiesta del Despertar Dorado', modelo: 'peleas/plaza.glb', musica: 'lavado-partida', borde: 8 },
  brasaviva: { id: 'brasaviva', nombre: 'Brasaviva', lema: 'Las termas al pie del volcán', modelo: 'peleas/brasaviva.glb', musica: 'lavado-intensa', borde: 8 },
  nieveclara: { id: 'nieveclara', nombre: 'Nieveclara', lema: 'El lago helado de los rescatistas', modelo: 'peleas/nieveclara.glb', musica: 'lavado-partida3', borde: 8 },
};
export const ORDEN_ESCENARIOS: IdEscenario[] = ['plaza', 'brasaviva', 'nieveclara'];

const AMBIENTES: Record<IdEscenario, Ambiente> = {
  plaza: {
    cieloArriba: '#7fb8ef', cieloAbajo: '#ffe0a8', niebla: '#f6dcb0', densidad: 0.012, hemiCielo: '#fff3dc', hemiSuelo: '#c8a070', hemi: 1.15,
    sol: '#ffe6bf', solFuerza: 2.6, solDir: [-6, 10, 7], relleno: '#ffc9a0', exposicion: 1.12,
    aire: { color: '#ffe27a', color2: '#fff6c8', n: 90, cae: -0.15, tam: 0.07 }, piso: '#c99560',
  },
  brasaviva: {
    cieloArriba: '#3a2140', cieloAbajo: '#ff8a4a', niebla: '#8a4a3a', densidad: 0.009, hemiCielo: '#ffc8a0', hemiSuelo: '#3a2220', hemi: 0.85,
    sol: '#ffd0a0', solFuerza: 2.3, solDir: [5, 8, 6], relleno: '#ff5a2a', exposicion: 1.1,
    aire: { color: '#ff8a2a', color2: '#ffd070', n: 110, cae: -0.6, tam: 0.06 }, piso: '#4a3a3a',
  },
  nieveclara: {
    cieloArriba: '#2a3f7a', cieloAbajo: '#bfe0f5', niebla: '#d8ecf8', densidad: 0.012, hemiCielo: '#e8f4ff', hemiSuelo: '#8aa8c8', hemi: 1.25,
    sol: '#f4f8ff', solFuerza: 2.1, solDir: [-4, 9, 8], relleno: '#a8d0ff', exposicion: 1.1,
    aire: { color: '#ffffff', color2: '#dff0ff', n: 160, cae: 0.9, tam: 0.06 }, piso: '#e8f2fa',
  },
};

export class EscenaPelea {
  renderer: THREE.WebGLRenderer;
  escena = new THREE.Scene();
  camara = new THREE.PerspectiveCamera(30, 1, 0.3, 160);
  calidad: Calidad;
  private hemi = new THREE.HemisphereLight('#fff', '#888', 1);
  private sol = new THREE.DirectionalLight('#fff', 2);
  private relleno = new THREE.DirectionalLight('#fff', 0.6);
  private cielo: THREE.Mesh;
  private escenario: THREE.Object3D | null = null;
  private aire: THREE.Points | null = null;
  private aireDatos: { vel: Float32Array; cae: number } | null = null;
  /** Cosas que se mueven del escenario (público, llamas, banderines). */
  vivos: { o: THREE.Object3D; tipo: string; fase: number; y0: number; s0: number }[] = [];
  /** Lo que la pelea pone en la escena (muñecos, efectos). */
  capa = new THREE.Group();
  idEscenario: IdEscenario = 'plaza';
  // Cámara
  private foco = new THREE.Vector3(0, 1.2, 0);
  private dist = 9;
  private sacudida = 0;
  private t = 0;
  /** Sacudidas de la cámara (se pueden apagar). */
  sacudidas = true;
  private msMedio = 20;
  private lento = 0;
  private calma = 2;

  constructor(public lienzo: HTMLCanvasElement, calidad: Calidad) {
    this.calidad = calidad;
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: calidad === 'alta', powerPreference: 'high-performance', stencil: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.shadowMap.enabled = calidad !== 'baja';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    vigilarContexto(lienzo);
    this.escena.add(this.hemi, this.sol, this.sol.target, this.relleno, this.capa);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(1024, 1024);
    const c = this.sol.shadow.camera;
    c.left = -12;
    c.right = 12;
    c.top = 8;
    c.bottom = -4;
    c.near = 1;
    c.far = 50;
    this.sol.shadow.bias = -0.0006;
    this.sol.shadow.normalBias = 0.03;
    // El cielo: un domo con degradado (se pinta detrás de todo)
    const geo = new THREE.SphereGeometry(90, 32, 16);
    this.cielo = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { arriba: { value: new THREE.Color() }, abajo: { value: new THREE.Color() } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform vec3 arriba; uniform vec3 abajo; varying vec3 vP; void main(){ float k = smoothstep(-0.05, 0.55, vP.y); gl_FragColor = vec4(mix(abajo, arriba, k), 1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    }));
    this.cielo.renderOrder = -10;
    this.escena.add(this.cielo);
    this.ajustarTamano();
    addEventListener('resize', () => this.ajustarTamano());
  }

  ajustarTamano() {
    const w = innerWidth, h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, this.calidad === 'alta' ? 2 : this.calidad === 'media' ? 1.5 : 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
  }

  /** Arma el escenario (el modelo de Blender, sus luces, su cielo y lo que flota). */
  async ponerEscenario(id: IdEscenario) {
    this.idEscenario = id;
    const a = AMBIENTES[id];
    (this.cielo.material as THREE.ShaderMaterial).uniforms.arriba.value.set(a.cieloArriba);
    (this.cielo.material as THREE.ShaderMaterial).uniforms.abajo.value.set(a.cieloAbajo);
    this.escena.fog = new THREE.FogExp2(a.niebla, a.densidad);
    this.escena.background = new THREE.Color(a.cieloAbajo);
    this.hemi.color.set(a.hemiCielo);
    this.hemi.groundColor.set(a.hemiSuelo);
    this.hemi.intensity = a.hemi;
    this.sol.color.set(a.sol);
    this.sol.intensity = a.solFuerza;
    this.sol.position.set(...a.solDir);
    this.sol.target.position.set(0, 0, 0);
    this.relleno.color.set(a.relleno);
    this.relleno.intensity = 0.7;
    this.relleno.position.set(6, 3, -6);
    this.renderer.toneMappingExposure = a.exposicion;
    // El modelo del escenario
    if (this.escenario) {
      this.escenario.removeFromParent();
      this.escenario = null;
    }
    this.vivos = [];
    try {
      const m = await cargar(ESCENARIOS[id].modelo);
      this.escenario = m.clone(true);
    } catch {
      // (si el modelo no está, un piso sencillo para poder jugar igual)
      const piso = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: a.piso, roughness: 0.9 }));
      piso.rotation.x = -Math.PI / 2;
      piso.receiveShadow = true;
      this.escenario = piso;
    }
    this.escena.add(this.escenario);
    this.escenario.traverse((o) => {
      const n = o.name.toLowerCase();
      // Las piezas vivas del escenario: «vivo_<tipo>_…» (público que salta, llamas que tiemblan, banderines)
      const m = n.match(/^vivo_([a-z]+)/);
      if (m) this.vivos.push({ o, tipo: m[1], fase: Math.random() * 6.28, y0: o.position.y, s0: o.scale.y });
      const malla = o as THREE.Mesh;
      if (malla.isMesh) {
        malla.receiveShadow = true;
        malla.castShadow = this.calidad === 'alta' && malla.position.z > -6;
      }
    });
    // Lo que flota en el aire
    if (this.aire) {
      this.aire.removeFromParent();
      this.aire.geometry.dispose();
    }
    const n = Math.round(a.aire.n * (this.calidad === 'baja' ? 0.5 : 1));
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = new Float32Array(n);
    const c1 = new THREE.Color(a.aire.color), c2 = new THREE.Color(a.aire.color2);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 9;
      pos[i * 3 + 2] = -Math.random() * 14 + 3;
      const c = c1.clone().lerp(c2, Math.random());
      col.set([c.r, c.g, c.b], i * 3);
      vel[i] = 0.5 + Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.aire = new THREE.Points(g, new THREE.PointsMaterial({ size: a.aire.tam, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, map: puntoSuave(), blending: id === 'nieveclara' ? THREE.NormalBlending : THREE.AdditiveBlending }));
    this.aire.frustumCulled = false;
    this.aireDatos = { vel, cae: a.aire.cae };
    this.escena.add(this.aire);
  }

  sacudir(f: number) {
    if (this.sacudidas) this.sacudida = Math.max(this.sacudida, f);
  }

  /**
   * Mueve la cámara: sigue el punto medio de los dos, se aleja si se separan; `cerca` la lleva encima de alguien
   * (la súper, el K.O., la presentación) y `menu` la deja para la pantalla de selección.
   */
  camaraPelea(dt: number, a: THREE.Vector3, b: THREE.Vector3, o: { cerca?: THREE.Vector3 | null; borde: number; menu?: boolean }) {
    this.t += dt;
    const sep = Math.abs(a.x - b.x);
    let fx = (a.x + b.x) / 2;
    let fy = 1.15 + Math.max(a.y, b.y) * 0.35;
    let d = Math.min(11.5, Math.max(6.3, 4.6 + sep * 0.65));
    if (o.menu) {
      fy = 1.05;
      d = 7.4;
    }
    if (o.cerca) {
      fx = o.cerca.x;
      fy = o.cerca.y + 1.0;
      d = 5.6;
    }
    // Que no se vea el final del escenario
    const anchoVisto = d * Math.tan((this.camara.fov * Math.PI) / 360) * this.camara.aspect;
    const lim = Math.max(0, o.borde + 2.5 - anchoVisto);
    fx = Math.max(-lim, Math.min(lim, fx));
    const k = 1 - Math.exp(-dt * (o.cerca ? 5 : 3.2));
    this.foco.x += (fx - this.foco.x) * k;
    this.foco.y += (fy - this.foco.y) * k;
    this.dist += (d - this.dist) * k;
    this.sacudida = Math.max(0, this.sacudida - dt * 2.6);
    const s = this.sacudida * this.sacudida * 0.25;
    const sx = (Math.sin(this.t * 61) + Math.sin(this.t * 37)) * s;
    const sy = (Math.sin(this.t * 53) + Math.sin(this.t * 29)) * s;
    this.camara.position.set(this.foco.x + sx, this.foco.y + 0.3 + this.dist * 0.05 + sy, this.dist);
    this.camara.lookAt(this.foco.x + sx * 0.5, this.foco.y + sy * 0.5, 0);
    this.cielo.position.copy(this.camara.position);
    // El sol (y sus sombras) siguen a la pelea
    const sd = AMBIENTES[this.idEscenario].solDir;
    this.sol.position.set(this.foco.x + sd[0], sd[1], sd[2]);
    this.sol.target.position.set(this.foco.x, 0, 0);
  }

  /** El escenario vive: el público salta, las llamas tiemblan, lo del aire flota. */
  animar(dt: number, emocion: number) {
    for (const v of this.vivos) {
      v.fase += dt;
      if (v.tipo === 'publico') {
        const salto = Math.max(0, Math.sin(v.fase * (4 + emocion * 5))) * (0.05 + emocion * 0.18);
        v.o.position.y = v.y0 + salto;
      } else if (v.tipo === 'llama') {
        v.o.scale.y = v.s0 * (1 + Math.sin(v.fase * 13) * 0.08 + Math.sin(v.fase * 23) * 0.05);
      } else if (v.tipo === 'bandera' || v.tipo === 'banderin') {
        v.o.rotation.z = Math.sin(v.fase * 2.2) * 0.05;
      } else if (v.tipo === 'vapor') {
        v.o.position.y = v.y0 + ((v.fase * 0.4) % 1) * 0.6;
      }
    }
    if (this.aire && this.aireDatos) {
      const pos = this.aire.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const { vel, cae } = this.aireDatos;
      for (let i = 0; i < vel.length; i++) {
        arr[i * 3 + 1] -= cae * vel[i] * dt;
        arr[i * 3] += Math.sin(this.t * 0.7 + i) * 0.15 * dt;
        if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 9;
        if (arr[i * 3 + 1] > 9) arr[i * 3 + 1] = 0;
      }
      pos.needsUpdate = true;
    }
  }

  dibujar(dt: number) {
    const t0 = performance.now();
    this.renderer.render(this.escena, this.camara);
    const ms = performance.now() - t0;
    this.msMedio += (ms + dt * 1000 * 0.2 - this.msMedio) * 0.05;
    // Calidad que baja sola si el celular no da
    if (this.calma > 0) this.calma -= dt;
    else if (dt > 0.05) {
      this.lento += dt;
      if (this.lento > 4 && this.calidad !== 'baja') {
        this.calidad = this.calidad === 'alta' ? 'media' : 'baja';
        this.renderer.shadowMap.enabled = this.calidad !== 'baja';
        this.ajustarTamano();
        this.lento = 0;
        this.calma = 3;
      }
    } else this.lento = Math.max(0, this.lento - dt * 0.5);
  }

  /** Pausa las mediciones un rato (después de cargar algo). */
  calmar(s = 2) {
    this.calma = s;
  }

  liberar() {
    this.escena.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !m.userData.noLiberar) m.geometry?.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

let textPunto: THREE.Texture | null = null;
/** Un puntito suave (polen, brasa, copo). */
export function puntoSuave(): THREE.Texture {
  if (textPunto) return textPunto;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.35, 'rgba(255,255,255,.7)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  textPunto = new THREE.CanvasTexture(c);
  textPunto.colorSpace = THREE.SRGBColorSpace;
  return textPunto;
}
