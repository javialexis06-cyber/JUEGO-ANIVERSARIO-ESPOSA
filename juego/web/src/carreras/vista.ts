// La carrera en 3D: la pista (modelo de Blender, juntado por material para dibujarlo en pocas llamadas), el cielo de
// cada región, los ocho corredores, las cajas de objetos, lo que hay tirado en la pista, las partículas, la cámara
// que persigue, el podio y la calidad que baja sola.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cargar } from '../recursos';
import { PISTAS, type Corredor, type IdPista } from './datos';
import { Efectos } from './efectos';
import { Kart3D, pieza } from './kart3d';
import type { Pista } from './pista';
import type { Evento, Kart, Sim } from './sim';

export type Calidad = 'alta' | 'media' | 'baja';

const COLOR_CHISPA = ['#ffffff', '#6fc8ff', '#ffb43a', '#ff7ae0'];

/** El cielo: una esfera grande con degradado (arriba → horizonte). */
function cieloDegradado(arriba: string, abajo: string) {
  const geo = new THREE.SphereGeometry(1200, 24, 12);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { arriba: { value: new THREE.Color(arriba) }, abajo: { value: new THREE.Color(abajo) } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 arriba; uniform vec3 abajo; varying float h; void main(){ float t = smoothstep(-0.15, 0.6, h); gl_FragColor = vec4(mix(abajo, arriba, t), 1.0); }',
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = -1;
  return m;
}

export class Vista {
  renderer: THREE.WebGLRenderer;
  escena!: THREE.Scene;
  camara = new THREE.PerspectiveCamera(68, 2, 0.3, 1400);
  calidad: Calidad;
  karts: Kart3D[] = [];
  efectos!: Efectos;
  private sol!: THREE.DirectionalLight;
  private pistaObj: THREE.Object3D | null = null;
  private cielo: THREE.Mesh | null = null;
  private estrellas: THREE.Points | null = null;
  private cajas: THREE.Object3D[] = [];
  private cosas = new Map<number, THREE.Object3D>();
  private plantillas = new Map<string, THREE.Object3D>();
  private nubes = new Map<number, THREE.Object3D>();
  private camPos = new THREE.Vector3();
  private camMira = new THREE.Vector3();
  private camLista = false;
  private fov = 68;
  private sacudir = 0;
  private tiempos: number[] = [];
  private bajadas = 0;
  private reloj = 0;
  podioObj: THREE.Object3D | null = null;
  private podioKarts: Kart3D[] = [];
  enPodio = false;
  /** El carro que sigue la cámara. */
  sigue = 0;

  constructor(public lienzo: HTMLCanvasElement, calidad: Calidad) {
    this.calidad = calidad;
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: calidad !== 'baja', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = calidad !== 'baja';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.aplicarCalidad();
    this.sol = new THREE.DirectionalLight('#fff2d6', 2.1);
    this.efectos = this.armar();
    this.redimensionar();
  }

  /** Escena nueva (cada carrera empieza limpia; el lienzo y el contexto se quedan). */
  private armar() {
    this.escena = new THREE.Scene();
    const hemi = new THREE.HemisphereLight('#fff8ee', '#7a6a58', 1.35);
    this.escena.add(hemi);
    const c = this.calidad;
    this.sol = new THREE.DirectionalLight('#fff2d6', 2.1);
    this.sol.castShadow = c !== 'baja';
    this.sol.shadow.mapSize.set(c === 'alta' ? 2048 : 1024, c === 'alta' ? 2048 : 1024);
    const sc = this.sol.shadow.camera;
    sc.left = sc.bottom = -26;
    sc.right = sc.top = 26;
    sc.near = 1;
    sc.far = 120;
    this.sol.shadow.bias = -0.0008;
    this.sol.shadow.normalBias = 0.04;
    this.escena.add(this.sol, this.sol.target);
    this.efectos = new Efectos(this.escena);
    return this.efectos;
  }

  /** Suelta la carrera anterior y deja la escena vacía. */
  vaciar() {
    for (const k of [...this.karts, ...this.podioKarts]) k?.liberar();
    this.karts = [];
    this.podioKarts = [];
    this.pistaObj?.traverse((o) => (o as THREE.Mesh).isMesh && (o as THREE.Mesh).geometry.dispose());
    this.pistaObj = null;
    this.cielo = null;
    this.estrellas = null;
    this.cajas = [];
    this.cosas.clear();
    this.nubes.clear();
    this.podioObj = null;
    this.enPodio = false;
    this.camLista = false;
    this.garajeKart = null;
    this.fantasma?.liberar();
    this.fantasma = null;
    this.armar();
  }

  // ------------------------------------------------------------------------------------------ garaje (menú)

  private garajeKart: Kart3D | null = null;
  private garajeT = 0;

  /** El carro escogido dando vueltas en su tapete (en el menú). */
  async garaje(c: Corredor) {
    if (!this.garajeKart || this.garajeKart.grupo.parent === null) {
      this.vaciar();
      this.escena.background = new THREE.Color('#f6e2c8');
      this.escena.fog = null;
      const tapete = await pieza('m_garaje').catch(() => null);
      if (tapete) this.escena.add(tapete);
    }
    const k = new Kart3D(c);
    await k.cargar(true);
    this.garajeKart?.liberar();
    this.garajeKart = k;
    this.escena.add(k.grupo);
  }

  dibujarGaraje(dt: number) {
    this.garajeT += dt;
    const k = this.garajeKart;
    if (k) {
      k.actualizar(dt, 0, 0, 0, this.garajeT * 0.6, 0, { derrape: 0, giro: 0, giroVis: 0, suelo: true, invisible: false, truco: 0, cayendo: false });
    }
    // Cámara: el carro a la derecha de la pantalla (el menú va a la izquierda)
    this.camara.fov = 40;
    this.camara.aspect = (this.lienzo.clientWidth || 1) / (this.lienzo.clientHeight || 1);
    this.camara.position.set(-4.4, 2.9, 7.6);
    this.camara.lookAt(-3.1, 0.95, 0);
    this.camara.updateProjectionMatrix();
    this.sol.position.set(6, 12, 8);
    this.sol.target.position.set(0, 0, 0);
    this.renderer.render(this.escena, this.camara);
  }

  aplicarCalidad() {
    const dpr = window.devicePixelRatio || 1;
    const c = this.calidad;
    this.renderer.setPixelRatio(c === 'alta' ? Math.min(dpr, 1.6) : c === 'media' ? Math.min(dpr, 1.15) : Math.min(dpr, 0.8));
    this.redimensionar();
  }

  redimensionar() {
    const w = this.lienzo.clientWidth || window.innerWidth, h = this.lienzo.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / Math.max(1, h);
    this.camara.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------------------------------ carga

  async cargarPista(id: IdPista, pista: Pista) {
    const info = PISTAS[id];
    const g = await cargar(`carreras/carreras_${id}.glb`);
    const obj = this.juntar(g);
    this.escena.add(obj);
    this.pistaObj = obj;
    // Cielo con degradado y niebla de la región
    this.cielo = cieloDegradado(info.cielo[0], info.cielo[1]);
    this.escena.add(this.cielo);
    this.escena.fog = new THREE.Fog(info.niebla[0], info.niebla[1], info.niebla[2]);
    this.escena.background = new THREE.Color(info.cielo[1]);
    this.sol.color.set(info.sol);
    if (id === 'cielo' || id === 'brasa') {
      // Estrellas (o chispitas de ceniza en Brasaviva) en el cielo
      const n = id === 'cielo' ? 900 : 300;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, b = Math.random() * (id === 'cielo' ? 1.4 : 0.8) - 0.2;
        pos.set([Math.cos(a) * Math.cos(b) * 900, Math.sin(b) * 900, Math.sin(a) * Math.cos(b) * 900], i * 3);
      }
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.estrellas = new THREE.Points(pg, new THREE.PointsMaterial({ color: id === 'cielo' ? '#fff6dc' : '#ffb070', size: 2.2, sizeAttenuation: false, fog: false }));
      this.escena.add(this.estrellas);
    }
    if (id === 'cielo') (this.escena.getObjectByProperty('type', 'HemisphereLight') as THREE.HemisphereLight).intensity = 1.6;
    // Cajas de objetos
    const caja = await pieza('m_caja_objetos');
    void pista;
    this.plantillas.set('caja', caja);
    for (const nombre of ['obj_semilla', 'obj_enredadera', 'obj_charco', 'obj_brasa', 'obj_lucero', 'obj_nube']) this.plantillas.set(nombre, await pieza(`m_${nombre}`));
  }

  /** Junta las mallas de la pista por material (y sin sombra propia: solo la reciben). */
  private juntar(g: THREE.Object3D): THREE.Object3D {
    g.updateMatrixWorld(true);
    const porMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material)) return;
      // (las posiciones vienen cuantizadas: se pasan a números de verdad antes de moverlas al mundo)
      const geo = new THREE.BufferGeometry();
      for (const k of ['position', 'normal'] as const) {
        const a = m.geometry.getAttribute(k);
        if (!a) continue;
        const arr = new Float32Array(a.count * 3);
        for (let i = 0; i < a.count; i++) arr.set([a.getX(i), a.getY(i), a.getZ(i)], i * 3);
        geo.setAttribute(k, new THREE.BufferAttribute(arr, 3));
      }
      if (m.geometry.index) geo.setIndex(Array.from(m.geometry.index.array as ArrayLike<number>));
      geo.applyMatrix4(m.matrixWorld);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const lista = porMat.get(m.material) ?? [];
      lista.push(geo);
      porMat.set(m.material, lista);
    });
    const out = new THREE.Group();
    for (const [mat, geos] of porMat) {
      const todos = geos.every((x) => x.index);
      const listos = todos ? geos : geos.map((x) => (x.index ? x.toNonIndexed() : x));
      const una = listos.length > 1 ? mergeGeometries(listos, false) : listos[0];
      if (!una) continue;
      const mm = mat as THREE.MeshStandardMaterial;
      // (sin coordenadas de textura el relieve de felpa no sirve en la pista)
      mm.normalMap = null;
      const malla = new THREE.Mesh(una, mat);
      malla.receiveShadow = true;
      malla.castShadow = false;
      malla.matrixAutoUpdate = false;
      out.add(malla);
    }
    return out;
  }

  async cargarKarts(corredores: Corredor[], alAvance?: (f: number) => void) {
    let hechos = 0;
    // De a dos para no ahogar el celular
    const cola = corredores.map((c, i) => ({ c, i }));
    const trabajar = async () => {
      for (let x = cola.shift(); x; x = cola.shift()) {
        const k = new Kart3D(x.c);
        await k.cargar();
        this.karts[x.i] = k;
        this.escena.add(k.grupo);
        alAvance?.(++hechos / corredores.length);
      }
    };
    await Promise.all([trabajar(), trabajar()]);
  }

  /** Compila los sombreadores antes de arrancar (si no, el primer turbo congela el cuadro). */
  async precalentar() {
    const extra: THREE.Object3D[] = [];
    for (const [n, t] of this.plantillas) {
      const c = t.clone(true);
      c.position.set(0, -500, 0);
      this.escena.add(c);
      extra.push(c);
      void n;
    }
    this.efectos.echar(0, -500, 0, 0, 0, 0, '#fff', 0.1, 0.1);
    try {
      await this.renderer.compileAsync(this.escena, this.camara);
    } catch {
      /* sin compileAsync */
    }
    this.renderer.render(this.escena, this.camara);
    for (const c of extra) c.removeFromParent();
  }

  // ------------------------------------------------------------------------------------------ cada cuadro

  dibujar(sim: Sim, dt: number, sigue: number) {
    this.reloj += dt;
    this.sigue = sigue;
    const p = sim.pista;
    sim.karts.forEach((k, i) => {
      const k3 = this.karts[i];
      if (!k3) return;
      k3.actualizar(dt, k.x, k.y, k.z, k.h, k.v, {
        derrape: k.derrape, giro: k.entrada.giro, giroVis: k.giroT > 0 ? 1 - k.giroT / 1.2 : 0, suelo: k.suelo,
        invisible: k.invisible > 0, truco: k.truco, cayendo: k.cayendo > 0,
      });
      this.particulasDe(k, k3, dt);
      // Nube de lluvia sobre los mojados
      let nube = this.nubes.get(i);
      if (k.mojado > 0) {
        if (!nube) {
          nube = this.plantillas.get('obj_nube')!.clone(true);
          nube.scale.setScalar(2.2);
          this.escena.add(nube);
          this.nubes.set(i, nube);
        }
        nube.position.set(k.x, k.y + 3.2 + Math.sin(this.reloj * 3) * 0.1, k.z);
        if (Math.random() < 0.6) this.efectos.echar(k.x + (Math.random() - 0.5) * 2.4, k.y + 2.4, k.z + (Math.random() - 0.5) * 2.4, 0, -9, 0, '#6fb5f0', 0.07, 0.35);
      } else if (nube) {
        nube.removeFromParent();
        this.nubes.delete(i);
      }
    });
    // Cajas
    if (!this.cajas.length && sim.cajas.length) {
      for (const c of sim.cajas) {
        const o = this.plantillas.get('caja')!.clone(true);
        o.scale.setScalar(1.25);
        o.position.set(c.x, c.y, c.z);
        this.escena.add(o);
        this.cajas.push(o);
      }
    }
    sim.cajas.forEach((c, i) => {
      const o = this.cajas[i];
      if (!o) return;
      const visible = c.vuelve <= 0;
      if (o.visible && !visible) this.efectos.explosion(c.x, c.y, c.z, ['#b79be8', '#f2c14e', '#ffffff', '#4fbf7a'], 14, 7, 0.16, 0.7);
      o.visible = visible || c.vuelve < 0.25;
      const crecer = c.vuelve > 0 ? Math.max(0, 1 - c.vuelve / 0.25) : 1;
      o.scale.setScalar(1.25 * crecer);
      o.rotation.y = this.reloj * 1.3 + i;
      o.rotation.x = Math.sin(this.reloj * 1.7 + i) * 0.25;
      o.position.y = c.y + Math.sin(this.reloj * 2.4 + i) * 0.18;
    });
    // Lo que hay en la pista
    const vivos = new Set<number>();
    for (const c of sim.cosas) {
      vivos.add(c.id);
      let o = this.cosas.get(c.id);
      const plantilla = c.tipo === 'semilla_vuela' ? (c.charco ? 'obj_charco' : 'obj_semilla') : c.tipo === 'enredadera' ? 'obj_enredadera' : c.tipo === 'charco' ? 'obj_charco' : c.tipo === 'brasa' ? 'obj_brasa' : 'obj_lucero';
      if (o && o.userData.plantilla !== plantilla) {
        o.removeFromParent();
        o = undefined;
      }
      if (!o) {
        o = this.plantillas.get(plantilla)!.clone(true);
        o.userData.plantilla = plantilla;
        this.escena.add(o);
        this.cosas.set(c.id, o);
      }
      o.position.set(c.x, c.tipo === 'brasa' || c.tipo === 'lucero' ? c.y - 0.6 : c.y, c.z);
      if (c.tipo === 'enredadera') {
        o.scale.setScalar(1.3 * Math.min(1, c.t * 3));
        o.rotation.y = c.id;
      } else if (c.tipo === 'charco') {
        o.scale.setScalar(1.25 * Math.min(1, c.t * 4 + 0.3));
      } else if (c.tipo === 'brasa') {
        o.rotation.y = c.h;
        o.scale.setScalar(1.6);
        if (Math.random() < 0.7) this.efectos.echar(c.x, c.y, c.z, 0, 1.5, 0, Math.random() < 0.5 ? '#ff7a2a' : '#ffe27a', 0.22, 0.4, 0, 1);
      } else if (c.tipo === 'lucero') {
        o.rotation.y = c.h;
        o.scale.setScalar(1.6);
        if (Math.random() < 0.7) this.efectos.echar(c.x, c.y, c.z, 0, 0.5, 0, '#ffe9a8', 0.2, 0.5, 0, 0.5);
      } else {
        o.rotation.set(c.t * 6, c.h, 0);
        o.scale.setScalar(1.4);
      }
    }
    for (const [id, o] of this.cosas) if (!vivos.has(id)) {
      o.removeFromParent();
      this.cosas.delete(id);
    }
    this.efectos.actualizar(dt);
    if (!this.enPodio) this.mover(sim, dt, p);
    if (this.estrellas) this.estrellas.position.copy(this.camara.position);
    if (this.cielo) this.cielo.position.copy(this.camara.position);
    this.renderer.render(this.escena, this.camara);
  }

  private particulasDe(k: Kart, k3: Kart3D, dt: number) {
    const atras = new THREE.Vector3();
    const fx = Math.sin(k.h), fz = Math.cos(k.h);
    const rx = Math.cos(k.h), rz = -Math.sin(k.h);
    const sale = (lado: number, dist: number) => atras.set(k.x - fx * dist + rx * lado, k.y + 0.35, k.z - fz * dist + rz * lado);
    // Chispas del derrape (blancas → azules → naranjas → rosadas de Aura)
    if (k.derrape && k.suelo) {
      const nivel = k.carga >= 2.6 ? 3 : k.carga >= 1.6 ? 2 : k.carga >= 0.8 ? 1 : 0;
      for (const lado of [-0.75, 0.75]) {
        if (Math.random() < 0.9) {
          sale(lado, 2.3);
          this.efectos.echar(atras.x, atras.y - 0.2, atras.z, (Math.random() - 0.5) * 3 - fx * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 3 - fz * 2,
            COLOR_CHISPA[nivel], nivel ? 0.11 : 0.07, 0.3, 14);
        }
      }
    }
    // Fuego del turbo
    if (k.turbo > 0 && Math.random() < 0.95) {
      sale((Math.random() - 0.5) * 0.6, 2.6);
      const col = k.turboNivel >= 3 ? (Math.random() < 0.5 ? '#ff7ae0' : '#ffd27a') : Math.random() < 0.5 ? '#ff8a2a' : '#ffe27a';
      this.efectos.echar(atras.x, atras.y + 0.2, atras.z, -fx * 6 + (Math.random() - 0.5), 0.6, -fz * 6 + (Math.random() - 0.5), col, 0.28, 0.32, 0, -0.6);
    }
    // Polvo o nieve fuera de la pista, y polvito normal al correr
    if (k.suelo && Math.abs(k.v) > 8) {
      const pid = this.pistaId;
      const pasto = k.fueraPista;
      if (Math.random() < (pasto ? 0.8 : 0.18)) {
        sale((Math.random() - 0.5) * 1.6, 2.4);
        const col = pid === 'nieve' ? '#ffffff' : pid === 'brasa' ? '#5a4a48' : pid === 'cielo' ? '#c9b6ea' : pasto ? '#8cc461' : '#d8b07a';
        this.efectos.echar(atras.x, atras.y - 0.25, atras.z, (Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2, col, pasto ? 0.3 : 0.2, 0.55, 2, 1.2);
      }
    }
    // Rebufo: rayitas de viento
    if (k.rebufo > 0.3 && Math.random() < 0.5) {
      this.efectos.echar(k.x + rx * (Math.random() - 0.5) * 3 + fx * 2, k.y + 0.6 + Math.random() * 1.2, k.z + rz * (Math.random() - 0.5) * 3 + fz * 2, -fx * 18, 0, -fz * 18, '#ffffff', 0.06, 0.25);
    }
    void k3;
    void dt;
  }

  pistaId: IdPista = 'valle';

  /** La cámara detrás del carro que se sigue. */
  private mover(sim: Sim, dt: number, p: Pista) {
    const k = sim.karts[this.sigue];
    if (!k) return;
    void p;
    const atras = k.cayendo > 0 ? 9 : 7.6;
    const alto = 3.1;
    const h = k.h + (k.derrape ? k.derrape * 0.12 : 0);
    const meta = new THREE.Vector3(k.x - Math.sin(h) * atras, k.y + alto, k.z - Math.cos(h) * atras);
    const mira = new THREE.Vector3(k.x + Math.sin(k.h) * 4, k.y + 1.3, k.z + Math.cos(k.h) * 4);
    if (k.cayendo > 0) mira.y = k.y + 1;
    if (!this.camLista) {
      this.camPos.copy(meta);
      this.camMira.copy(mira);
      this.camLista = true;
    }
    const f = 1 - Math.exp(-dt * 7);
    this.camPos.lerp(meta, f);
    // (que la cámara no quede por debajo del camino)
    this.camPos.y = Math.max(this.camPos.y, k.lugar.y + 1.2);
    this.camMira.lerp(mira, 1 - Math.exp(-dt * 12));
    this.camara.position.copy(this.camPos);
    if (this.sacudir > 0) {
      this.sacudir = Math.max(0, this.sacudir - dt);
      this.camara.position.x += (Math.random() - 0.5) * this.sacudir * 0.8;
      this.camara.position.y += (Math.random() - 0.5) * this.sacudir * 0.8;
    }
    this.camara.lookAt(this.camMira);
    const fov = 66 + (k.turbo > 0 ? 9 : 0) + Math.min(6, Math.max(0, k.v - 20) * 0.5);
    this.fov += (fov - this.fov) * Math.min(1, dt * 4);
    this.camara.fov = this.fov;
    this.camara.updateProjectionMatrix();
    // El sol sigue al carro (sombras nítidas cerca)
    this.sol.position.set(k.x + 30, k.y + 60, k.z + 20);
    this.sol.target.position.set(k.x, k.y, k.z);
  }

  /** Lo que se ve cuando pasa algo (las partículas y la cámara; el sonido va aparte). */
  efecto(ev: Evento, sim: Sim, mio: number) {
    const k = 'k' in ev ? sim.karts[ev.k] : null;
    const k3 = k ? this.karts[k.i] : null;
    switch (ev.t) {
      case 'turbo':
        if (k) this.efectos.explosion(k.x, k.y + 0.6, k.z, ev.nivel >= 3 ? ['#ff7ae0', '#ffd27a', '#ffffff'] : ['#ff8a2a', '#ffe27a'], 10, 5, 0.18, 0.4, 4);
        k3?.cara('feliz', 1.2);
        break;
      case 'golpe':
        if (k) this.efectos.explosion(k.x, k.y + 1, k.z, ['#ffe27a', '#ffffff', '#ff7a2a'], 22, 9, 0.2, 0.7);
        if (k3) k3.cara('sorprendido', 0.6), setTimeout(() => k3.cara('enojado', 1.4), 600);
        if (ev.k === mio) this.sacudir = 0.5;
        if (ev.por >= 0 && ev.por !== ev.k) this.karts[ev.por]?.cara('carcajada', 1.6);
        break;
      case 'muro':
        if (ev.k === mio) this.sacudir = Math.min(0.4, ev.fuerza * 0.5);
        if (k) this.efectos.explosion(k.x, k.y + 0.6, k.z, ['#ffffff', '#ffe9a8'], 6, 4, 0.12, 0.4);
        break;
      case 'caja':
        k3?.cara('feliz', 1);
        break;
      case 'usa':
        k3?.cara(ev.o === 'chispa' || ev.o === 'tres' ? 'feliz' : 'presumido', 1.4);
        break;
      case 'caida':
        k3?.cara('llorando', 2);
        if (k && this.pistaId === 'brasa') this.efectos.explosion(k.x, k.y, k.z, ['#ff6a1a', '#ffb43a', '#3a2c2a'], 26, 8, 0.25, 0.9);
        break;
      case 'truco':
        k3?.cara('carcajada', 1);
        if (k) this.efectos.explosion(k.x, k.y + 1, k.z, ['#f2c14e', '#ffffff', '#b79be8'], 12, 5, 0.14, 0.5, 2);
        break;
      case 'meta':
        if (k) this.efectos.explosion(k.x, k.y + 2, k.z, ['#e4566b', '#f7c948', '#4fb3ff', '#6fd39a', '#b79be8', '#ffffff'], 60, 12, 0.18, 1.6, 9);
        k3?.cara(ev.puesto <= 3 ? 'carcajada' : 'triste', 4);
        break;
      case 'adelanta':
        k3?.cara('guino', 1.2);
        this.karts[ev.a]?.cara('puchero', 1.2);
        break;
      case 'lluvia':
        for (const i of ev.mojados) this.karts[i]?.cara('nervioso', 3);
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------------------------------------ fotos del menú

  /** Postal de una pista desde el aire (para las tarjetas del menú; se hace con ?postal=<pista>). */
  async postal(id: IdPista, pista: Pista) {
    this.vaciar();
    await this.cargarPista(id, pista);
    const i = Math.floor(pista.n * 0.04);
    const x = pista.x[i], y = pista.y[i], z = pista.z[i];
    const h = pista.rumbo(i);
    this.camara.fov = 55;
    this.camara.aspect = 96 / 58;
    this.camara.updateProjectionMatrix();
    this.camara.position.set(x - Math.sin(h) * 26 + Math.cos(h) * 10, y + 16, z - Math.cos(h) * 26 - Math.sin(h) * 10);
    this.camara.lookAt(x + Math.sin(h) * 30, y, z + Math.cos(h) * 30);
    this.sol.position.set(x + 30, y + 60, z + 20);
    this.sol.target.position.set(x, y, z);
    if (this.cielo) this.cielo.position.copy(this.camara.position);
    this.renderer.render(this.escena, this.camara);
  }

  /** Retrato de una criatura sola, de lado, con fondo transparente (?retrato=<criatura>). */
  async retrato(c: Corredor) {
    this.vaciar();
    this.escena.background = new THREE.Color('#ffffff');
    const k = new Kart3D(c);
    await k.cargar(false);
    if (k.carro) k.carro.visible = false;
    this.escena.add(k.grupo);
    k.actualizar(0.01, 0, 0, 0, -Math.PI / 2 + 0.5, 0, { derrape: 0, giro: 0, giroVis: 0, suelo: true, invisible: false, truco: 0, cayendo: false });
    k.grupo.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(k.criatura!);
    const centro = caja.getCenter(new THREE.Vector3());
    const tam = caja.getSize(new THREE.Vector3()).length();
    this.camara.fov = 30;
    this.camara.aspect = 1;
    this.camara.updateProjectionMatrix();
    this.camara.position.set(centro.x, centro.y + tam * 0.35, centro.z + tam * 1.4);
    this.camara.lookAt(centro);
    this.sol.position.set(4, 8, 8);
    this.renderer.render(this.escena, this.camara);
  }

  // ------------------------------------------------------------------------------------------ fantasma

  private fantasma: Kart3D | null = null;

  /** El fantasma del contrarreloj: tu mejor vuelta, transparente. */
  async cargarFantasma(c: Corredor) {
    const k = new Kart3D({ ...c, id: 'fantasma' });
    await k.cargar(true);
    this.escena.add(k.grupo);
    this.fantasma = k;
  }

  moverFantasma(d: number[], t: number, dt: number) {
    const k = this.fantasma;
    if (!k) return;
    const n = d.length / 4;
    const x = t / 0.1;
    const i = Math.min(n - 2, Math.floor(x));
    if (i < 0 || x >= n - 1) {
      k.grupo.visible = false;
      return;
    }
    const f = x - i;
    const a = i * 4, b = (i + 1) * 4;
    const l = (u: number, v: number) => u + (v - u) * f;
    const dh = Math.atan2(Math.sin(d[b + 3] - d[a + 3]), Math.cos(d[b + 3] - d[a + 3]));
    const v = Math.hypot(d[b] - d[a], d[b + 2] - d[a + 2]) / 0.1;
    k.actualizar(dt, l(d[a], d[b]), l(d[a + 1], d[b + 1]), l(d[a + 2], d[b + 2]), d[a + 3] + dh * f, v,
      { derrape: 0, giro: 0, giroVis: 0, suelo: true, invisible: true, truco: 0, cayendo: false });
  }

  // ------------------------------------------------------------------------------------------ podio

  /** El podio: los tres primeros arriba, celebrando, con confeti; la cámara da la vuelta. */
  async mostrarPodio(top: Corredor[]) {
    this.enPodio = true;
    if (this.pistaObj) this.pistaObj.visible = false;
    for (const k of this.karts) k.grupo.visible = false;
    for (const c of this.cajas) c.visible = false;
    for (const [, o] of this.cosas) o.visible = false;
    if (!this.podioObj) {
      this.podioObj = await pieza('m_podio');
      const copa = await pieza('m_copa');
      copa.name = 'copa-podio';
      this.podioObj.add(copa);
    }
    const base = new THREE.Vector3(0, 400, 0);
    this.podioObj.position.copy(base);
    this.podioObj.rotation.y = Math.PI;
    this.escena.add(this.podioObj);
    this.escena.fog = null;
    // Cielo de atardecer con estrellas detrás del podio
    this.cielo?.removeFromParent();
    this.cielo = cieloDegradado('#2a2058', '#c98ab8');
    this.escena.add(this.cielo);
    this.escena.background = new THREE.Color('#2a2058');
    this.podioObj.updateMatrixWorld(true);
    const puestos = [1, 2, 3].map((n) => {
      const o = this.podioObj!.getObjectByName(`puesto_${n}`);
      return o ? o.getWorldPosition(new THREE.Vector3()) : base.clone();
    });
    for (const k of this.podioKarts) k.liberar();
    this.podioKarts = [];
    const poses = ['trofeo', 'celebrar', 'aplauso_a'];
    await Promise.all(top.slice(0, 3).map(async (c, i) => {
      const k = new Kart3D(c);
      await k.cargar(true);
      // Solo el muñeco de pie (sin carro) y su criatura al lado
      if (k.carro) k.carro.visible = false;
      const m = k.muneco!;
      m.pose(m.tienePose(poses[i]) ? poses[i] : 'celebrar', true);
      m.cara(i === 0 ? 'carcajada' : 'feliz');
      m.grupo.parent!.position.set(0, 0, 0);
      m.grupo.parent!.scale.setScalar(1.25);
      if (k.criatura) {
        // La criatura al pie del podio, mirando a la cámara
        const alto = i === 0 ? 1.25 : i === 1 ? 0.9 : 0.65;
        k.criatura.position.set(0.35, -alto, 1.7);
        k.criatura.scale.setScalar(0.62);
        k.criatura.rotation.y = 0;
        // (el bicho está corrido hacia adelante dentro de su envoltura: se centra)
        const b = k.criatura.children[0];
        if (b) b.position.z = -0.6;
      }
      k.grupo.position.copy(puestos[i]);
      k.grupo.rotation.y = Math.PI;
      this.escena.add(k.grupo);
      this.podioKarts[i] = k;
    }));
    const copa = this.podioObj.getObjectByName('copa-podio');
    if (copa) {
      copa.position.set(0, 2.55, -0.15);
      copa.scale.setScalar(0.9);
    }
    this.camLista = false;
    this.podioT = 0;
  }

  private podioT = 0;

  /** Cada cuadro del podio (la cámara gira despacio, confeti, los muñecos celebran). */
  dibujarPodio(dt: number) {
    this.podioT += dt;
    this.reloj += dt;
    const c = new THREE.Vector3(0, 401.6, 0);
    const a = Math.PI + Math.sin(this.podioT * 0.25) * 0.45;
    const r = 8.2 - Math.min(2, this.podioT * 0.4);
    this.camara.position.set(c.x + Math.sin(a) * r, c.y + 1.4, c.z + Math.cos(a) * r);
    this.camara.lookAt(c);
    this.camara.fov = 55;
    this.camara.updateProjectionMatrix();
    this.sol.position.set(10, 440, -12);
    this.sol.target.position.copy(c);
    if (Math.random() < 0.9) {
      const cols = ['#e4566b', '#f7c948', '#4fb3ff', '#6fd39a', '#b79be8', '#ffffff'];
      this.efectos.echar((Math.random() - 0.5) * 9, 408, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, -2, (Math.random() - 0.5) * 2, cols[(Math.random() * 6) | 0], 0.09, 3.5, 0.5);
    }
    this.podioKarts.forEach((k, i) => {
      const m = k.muneco;
      if (!m) return;
      // Vaivén de celebración: alterna las dos poses _a/_b si existen
      const pares = [['trofeo', 'corona'], ['celebrar', 'pulgares_a'], ['aplauso_a', 'aplauso_b']][i];
      if (pares && m.tienePose(pares[1])) m.vaiven(pares[0], pares[1], 0.5 + 0.5 * Math.sin(this.reloj * (i === 2 ? 8 : 2.5)));
      m.update(dt);
    });
    this.efectos.actualizar(dt);
    if (this.cielo) this.cielo.position.copy(this.camara.position);
    this.renderer.render(this.escena, this.camara);
  }

  // ------------------------------------------------------------------------------------------ calidad

  /** Mide cuánto tarda cada cuadro y baja la calidad si el celular no da (devuelve true si bajó). */
  medir(ms: number): boolean {
    this.tiempos.push(ms);
    if (this.tiempos.length < 90) return false;
    const prom = this.tiempos.reduce((a, b) => a + b, 0) / this.tiempos.length;
    this.tiempos = [];
    if (prom > 40 && this.calidad !== 'baja' && this.bajadas < 2) {
      this.bajadas++;
      this.calidad = this.calidad === 'alta' ? 'media' : 'baja';
      if (this.calidad === 'baja') {
        this.sol.castShadow = false;
        this.renderer.shadowMap.enabled = false;
      }
      this.aplicarCalidad();
      return true;
    }
    return false;
  }

  liberar() {
    for (const k of [...this.karts, ...this.podioKarts]) k?.liberar();
    this.escena.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.parent === this.pistaObj) m.geometry.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
