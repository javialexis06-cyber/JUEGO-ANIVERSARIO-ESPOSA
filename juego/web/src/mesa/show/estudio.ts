// El estudio de televisión en 3D: el set de Blender (show_estudio.glb), Él y Ella en sus atriles con la ropa de la
// casa (los muñecos de las reacciones), el perrito presentador, reflectores con haces de luz que se mueven, pantallas
// de LED animadas, bombillos en cadena, el público que aplaude, confeti y una cámara de televisión que hace cortes y
// planos. Va a 30 cuadros por segundo, baja la calidad sola si el celular no da y suelta el WebGL al salir.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Ropa } from '../../casa/modelo';
import { Vestuario } from '../../casa/ropa';
import { vigilarContexto } from '../../contexto';
import { Director } from '../../reacciones/director';
import { type Anclas, Efectos } from '../../reacciones/efectos';
import { Muneco } from '../../reacciones/muneco';
import type { Coreografia } from '../../reacciones/tipos';
import { cargar, liberarEsqueletos } from '../../recursos';
import type { Perrito } from './motor';
import type { Rol } from './preguntas';
import { type AccionPerro, Presentador } from './presentador';

export type Plano = 'general' | 'grua' | 'pareja' | 'el' | 'ella' | 'presentador' | 'pantalla' | 'publico';
export type Animo = 'intro' | 'normal' | 'suspenso' | 'bien' | 'mal' | 'fiesta' | 'relampago';
export type Pantalla =
  | { modo: 'logo' }
  | { modo: 'pregunta'; texto: string; color?: string }
  | { modo: 'ronda'; titulo: string; texto: string; color?: string }
  | { modo: 'medidor'; valor: number };

const ESCALA_MUNECO = 0.43;
const FPS = 30;
/** Blender (x, y, z arriba) → three (x, z, -y). */
const tres = (x: number, y: number, z: number) => new THREE.Vector3(x, z, -y);

interface Toma {
  pos: THREE.Vector3;
  mira: THREE.Vector3;
  /** Ancho que se debe ver a la distancia de `mira` (la cámara calcula su apertura según el espacio libre). */
  ancho: number;
  /** Qué cámara del set está «al aire» (su luz roja se prende). */
  cam: number;
}

const TOMAS: Record<Exclude<Plano, 'grua'>, Toma> = {
  general: { pos: new THREE.Vector3(0, 2.35, 9.2), mira: new THREE.Vector3(0, 1.55, -0.4), ancho: 9.4, cam: 0 },
  pareja: { pos: new THREE.Vector3(0, 1.45, 3.9), mira: new THREE.Vector3(0, 1.05, 0.15), ancho: 3.7, cam: 0 },
  el: { pos: new THREE.Vector3(-0.35, 1.3, 2.75), mira: new THREE.Vector3(-0.95, 1.05, 0.2), ancho: 2.1, cam: 1 },
  ella: { pos: new THREE.Vector3(0.35, 1.3, 2.75), mira: new THREE.Vector3(0.95, 1.03, 0.2), ancho: 2.1, cam: 1 },
  presentador: { pos: new THREE.Vector3(-1.2, 1.3, 2.9), mira: new THREE.Vector3(-2.55, 0.95, 0.75), ancho: 2.5, cam: 1 },
  pantalla: { pos: new THREE.Vector3(0, 2.0, 4.6), mira: new THREE.Vector3(0, 1.85, -2.5), ancho: 5.6, cam: 2 },
  publico: { pos: new THREE.Vector3(0.4, 1.7, -0.2), mira: new THREE.Vector3(0, 0.7, 6.5), ancho: 9, cam: 2 },
};

/** Colores de cada ánimo: haces de luz, LED, y el baño de luz del estudio. */
const ANIMOS: Record<Animo, { haces: string[]; led: string; cielo: string; suelo: string; clave: number; rapidez: number; fuerza: number }> = {
  intro: { haces: ['#ffffff', '#ff6fa5', '#4fa3ff', '#ffd25a'], led: '#ff6fa5', cielo: '#c9a6ff', suelo: '#3a1d63', clave: 1.0, rapidez: 1.4, fuerza: 1 },
  normal: { haces: ['#ff6fa5', '#4fa3ff', '#ffffff', '#b48ce0'], led: '#b48ce0', cielo: '#d8c4ff', suelo: '#3a1d63', clave: 1.0, rapidez: 0.5, fuerza: 0.75 },
  suspenso: { haces: ['#7b4dff', '#4fa3ff', '#7b4dff', '#ff6fa5'], led: '#6a3fff', cielo: '#8f73d9', suelo: '#1c0f35', clave: 0.55, rapidez: 0.25, fuerza: 0.95 },
  bien: { haces: ['#ffd25a', '#ffffff', '#46d6a0', '#ffd25a'], led: '#46d6a0', cielo: '#fff0c8', suelo: '#5a3a1d', clave: 1.25, rapidez: 1.8, fuerza: 1.15 },
  mal: { haces: ['#ff3d3d', '#b42d6b', '#ff3d3d', '#7b2dff'], led: '#ff3d3d', cielo: '#ffb3b3', suelo: '#3a0f1f', clave: 0.75, rapidez: 0.8, fuerza: 0.9 },
  fiesta: { haces: ['#ff6fa5', '#ffd25a', '#4fa3ff', '#46d6a0'], led: '#ffd25a', cielo: '#ffe4f0', suelo: '#4a1d55', clave: 1.15, rapidez: 2.0, fuerza: 1.1 },
  relampago: { haces: ['#ff7a3d', '#ffd25a', '#ff3d3d', '#ffffff'], led: '#ff7a3d', cielo: '#ffd9c2', suelo: '#4a1d1d', clave: 1.0, rapidez: 2.6, fuerza: 1.0 },
};

// ------------------------------------------------------------------------------------------------- Sombreadores
const HAZ_VERT = `
varying float vAlto;
varying vec3 vNormal;
varying vec3 vVista;
void main() {
  vAlto = uv.y;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vVista = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const HAZ_FRAG = `
uniform vec3 uColor;
uniform float uFuerza;
varying float vAlto;
varying vec3 vNormal;
varying vec3 vVista;
void main() {
  float borde = pow(abs(dot(vNormal, vVista)), 1.6);
  float a = borde * smoothstep(0.0, 0.85, vAlto) * uFuerza * 0.32;
  gl_FragColor = vec4(uColor * a, a);
}`;

const LED_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const LED_FRAG = `
uniform float uT;
uniform vec3 uA;
uniform vec3 uB;
uniform sampler2D uTexto;
uniform float uHayTexto;
uniform float uPatron;
uniform vec2 uCeldas;
varying vec2 vUv;
float corazon(vec2 p) {
  p.y -= 0.25; p.x = abs(p.x);
  return length(vec2(p.x, p.y - sqrt(max(p.x, 0.0)) * 0.6)) - 0.5;
}
void main() {
  vec2 uv = vUv;
  vec2 c = floor(uv * uCeldas) / uCeldas;
  float t = uT;
  float f;
  if (uPatron < 0.5) {
    f = 0.5 + 0.5 * sin((c.x * 3.0 + c.y * 2.0) * 6.2831 - t * 1.6);
  } else if (uPatron < 1.5) {
    vec2 d = c - 0.5; d.x *= uCeldas.x / uCeldas.y;
    float ang = atan(d.y, d.x);
    f = 0.5 + 0.5 * sin(ang * 8.0 + t * 2.4) * smoothstep(0.0, 0.6, length(d));
  } else {
    // Ecualizador: columnas que suben y bajan, con un corazón que late arriba
    float col8 = floor(c.x * 8.0);
    float alto = 0.25 + 0.6 * abs(sin(t * (1.3 + fract(col8 * 0.37) * 2.0) + col8 * 1.7));
    f = step(c.y, alto) * (0.55 + 0.45 * c.y / max(alto, 0.01));
    vec2 hp = (uv - vec2(0.5, 0.86)) * vec2(1.0, uCeldas.y / uCeldas.x) * 3.2;
    f = max(f, (1.0 - smoothstep(-0.02, 0.04, corazon(hp))) * (0.8 + 0.2 * sin(t * 6.0)));
  }
  vec3 col = mix(uA * 0.35, uB, f);
  if (uHayTexto > 0.5) {
    vec4 tx = texture2D(uTexto, uv);
    col = mix(col * 0.45, tx.rgb, tx.a);
  }
  vec2 celda = fract(uv * uCeldas) - 0.5;
  float led = 1.0 - smoothstep(0.32, 0.5, max(abs(celda.x), abs(celda.y)));
  col *= 0.55 + 0.6 * led;
  gl_FragColor = vec4(col, 1.0);
}`;

function texturaRadial(colorCentro = 'rgba(255,255,255,1)', n = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  r.addColorStop(0, colorCentro);
  r.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, n, n);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** La geometría de un molde con su tamaño real: al comprimir el GLB, las posiciones quedan normalizadas y la escala
 *  verdadera queda en el nodo; aquí se hornea (en flotantes) para poder repetirla sola. */
function geometriaReal(m: THREE.Mesh): THREE.BufferGeometry {
  m.updateWorldMatrix(true, false);
  const g = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(m.geometry.attributes)) {
    const at = a as THREE.BufferAttribute;
    const arr = new Float32Array(at.count * at.itemSize);
    for (let i = 0; i < at.count; i++) for (let j = 0; j < at.itemSize; j++) arr[i * at.itemSize + j] = at.getComponent(i, j);
    g.setAttribute(k, new THREE.BufferAttribute(arr, at.itemSize));
  }
  if (m.geometry.index) g.setIndex(m.geometry.index.clone());
  g.applyMatrix4(m.matrixWorld);
  return g;
}

/** Envuelve un nodo del GLB en un grupo (así se mueve sin perder la escala que le dejó la compresión). */
function envolver(o: THREE.Object3D | undefined): THREE.Object3D | null {
  if (!o) return null;
  o.removeFromParent();
  const g = new THREE.Group();
  g.name = `${o.name} (envoltura)`;
  g.add(o);
  return g;
}

/** Envuelve un texto en líneas que quepan en `ancho`. */
function lineas(g: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const palabras = texto.split(/\s+/);
  const out: string[] = [];
  let l = '';
  for (const p of palabras) {
    const prueba = l ? `${l} ${p}` : p;
    if (g.measureText(prueba).width > ancho && l) {
      out.push(l);
      l = p;
    } else l = prueba;
  }
  if (l) out.push(l);
  return out;
}

interface Haz {
  yugo: THREE.Object3D;
  cabeza: THREE.Object3D;
  cono: THREE.Mesh;
  charco: THREE.Mesh;
  fase: number;
  color: THREE.Color;
  meta: THREE.Color;
}

interface Papel {
  m: THREE.InstancedMesh;
  pos: Float32Array;
  vel: Float32Array;
  giro: Float32Array;
  vida: number;
}

export class Estudio {
  private renderer: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara = new THREE.PerspectiveCamera(40, 1, 0.05, 80);
  private lienzo: HTMLCanvasElement;
  private capa: HTMLElement;
  private set: THREE.Object3D | null = null;
  m: Record<Rol, Muneco>;
  private director: Director;
  private efectos: Efectos;
  private anclas: Record<Rol, Anclas>;
  private perro = new Presentador(1.32);
  private perroListo = false;
  private tarima = new THREE.Group();
  private haces: Haz[] = [];
  private led: THREE.ShaderMaterial | null = null;
  private ledLados: THREE.ShaderMaterial | null = null;
  private lienzoTexto = document.createElement('canvas');
  private texTexto: THREE.CanvasTexture;
  private marcadores: Record<Rol, { lienzo: HTMLCanvasElement; tex: THREE.CanvasTexture; puntos: number; listo: boolean; sobre: boolean }> | null = null;
  private bombillos: THREE.MeshStandardMaterial[] = [];
  private mats = new Map<string, THREE.MeshStandardMaterial>();
  private tallys: THREE.MeshStandardMaterial[] = [];
  private publicoMallas: { cuerpos: THREE.InstancedMesh[]; manos: THREE.InstancedMesh; sitios: { p: THREE.Vector3; v: number; k: number; fase: number }[] } | null = null;
  private estadoPublico: 'quieto' | 'aplaudir' | 'ovacion' | 'ohh' = 'quieto';
  private tPublico = 0;
  private papeles: Papel | null = null;
  private paletas: Record<Rol, THREE.Group | null> = { el: null, ella: null };
  private votos: Record<Rol, 'e' | 'a' | '-' | null> = { el: null, ella: null };
  private luces: { cielo: THREE.HemisphereLight; clave: THREE.DirectionalLight; contra: THREE.DirectionalLight; rosa: THREE.PointLight; azul: THREE.PointLight };
  private animoActual: Animo = 'normal';
  private planoActual: Plano = 'general';
  private toma: Toma = TOMAS.general;
  private camPos = new THREE.Vector3();
  private camMira = new THREE.Vector3();
  private metaPos = new THREE.Vector3();
  private metaMira = new THREE.Vector3();
  private tToma = 0;
  private grua = 0;
  private desplazado = 0;
  private metaDesplazado = 0;
  private t = 0;
  private ultimo = 0;
  private acumulado = 0;
  private reloj = 0;
  private vivo = true;
  private pausado = false;
  private ratio = Math.min(window.devicePixelRatio || 1, 1.6);
  private medidas: number[] = [];
  private sombras: Record<Rol, THREE.Mesh>;
  private anchoPanel = 0;
  private perroBase = new THREE.Vector3(-2.7, 0.34, 0.67);
  private puntaje: Record<Rol, number> = { el: 0, ella: 0 };
  private congelado = new URLSearchParams(location.search).has('congelar');
  private sin3d = new URLSearchParams(location.search).has('sin3d');

  private constructor(raiz: HTMLElement, private yo: Rol, private rapido: number) {
    this.lienzo = raiz.querySelector('.show-lienzo') as HTMLCanvasElement;
    this.capa = raiz.querySelector('.show-efectos') as HTMLElement;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.lienzo, antialias: true, powerPreference: 'high-performance' });
    vigilarContexto(this.lienzo);
    this.renderer.setPixelRatio(this.ratio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setClearColor('#0d0618');
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.escena.environmentIntensity = 0.42;
    this.escena.fog = new THREE.Fog('#0d0618', 11, 24);
    const cielo = new THREE.HemisphereLight('#d8c4ff', '#3a1d63', 1.1);
    const clave = new THREE.DirectionalLight('#fff1e2', 1.6);
    clave.position.set(1.5, 6, 7);
    const contra = new THREE.DirectionalLight('#ff9fd0', 1.1);
    contra.position.set(-2, 5, -6);
    const rosa = new THREE.PointLight('#ff6fa5', 4, 7, 1.6);
    rosa.position.set(2.2, 2.2, 1.6);
    const azul = new THREE.PointLight('#4fa3ff', 4, 7, 1.6);
    azul.position.set(-2.2, 2.2, 1.6);
    this.luces = { cielo, clave, contra, rosa, azul };
    this.escena.add(cielo, clave, contra, rosa, azul);
    // Los muñecos van parados en la tarima de los concursantes
    this.escena.add(this.tarima);
    this.m = { el: new Muneco('el', ESCALA_MUNECO), ella: new Muneco('ella', ESCALA_MUNECO) };
    this.efectos = new Efectos(this.capa, rapido);
    this.anclas = { el: this.anclasDe('el'), ella: this.anclasDe('ella') };
    this.director = new Director(this.m, this.efectos, this.anclas, rapido);
    const tex = this.texturaSombra();
    const sombra = () => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      s.rotation.x = -Math.PI / 2;
      this.tarima.add(s);
      return s;
    };
    this.sombras = { el: sombra(), ella: sombra() };
    this.lienzoTexto.width = 1024;
    this.lienzoTexto.height = 512;
    this.texTexto = new THREE.CanvasTexture(this.lienzoTexto);
    this.texTexto.colorSpace = THREE.SRGBColorSpace;
    // Las superficies del GLB traen la v de arriba hacia abajo (como glTF)
    this.texTexto.flipY = false;
    this.escena.add(this.perro.grupo);
    window.addEventListener('resize', this.ajustar);
  }

  static async crear(raiz: HTMLElement, o: { yo: Rol; perro: Perrito; rapido: number }): Promise<Estudio> {
    const e = new Estudio(raiz, o.yo, o.rapido);
    await e.cargarTodo(o.perro);
    return e;
  }

  // ---------------------------------------------------------------------------------------------- Carga
  private async cargarTodo(perro: Perrito) {
    const [set] = await Promise.all([
      cargar('show_estudio.glb').catch(() => null),
      ...(['el', 'ella'] as Rol[]).map((r) => this.m[r].cargar()),
      document.fonts?.load('700 60px Fredoka').catch(() => undefined),
    ]);
    if (set) this.armarSet(set);
    // Vestidos como en la casa
    let vestidos: Record<Rol, { ropa?: Ropa; colorPelo?: string }> | null = null;
    try {
      vestidos = JSON.parse(localStorage.getItem('nuestro-hogar-vestidos') ?? 'null');
    } catch {
      /* sin ropa guardada */
    }
    const anclas: Record<Rol, THREE.Vector3> = { el: tres(-0.95, -0.2, 0.42), ella: tres(0.95, -0.2, 0.42) };
    for (const r of ['el', 'ella'] as Rol[]) {
      const a = this.set?.getObjectByName(`ancla_${r}`);
      if (a) anclas[r] = a.getWorldPosition(new THREE.Vector3());
    }
    this.tarima.position.y = anclas.el.y;
    for (const r of ['el', 'ella'] as Rol[]) {
      const m = this.m[r];
      this.tarima.add(m.p.grupo);
      const v = vestidos?.[r];
      if (v?.ropa || v?.colorPelo) await new Vestuario(m.p, r).aplicar(v.ropa, v.colorPelo).catch(() => undefined);
      m.ubicar(anclas[r].x, anclas[r].z, r === 'el' ? 0.22 : -0.22);
      // Los pies en el mundo (la tarima está levantada)
      m.puntoPies = () => m.p.grupo.getWorldPosition(new THREE.Vector3());
    }
    const ap = this.set?.getObjectByName('ancla_perro');
    if (ap) {
      ap.getWorldPosition(this.perroBase);
      this.perro.grupo.rotation.y = ap.getWorldQuaternion(new THREE.Quaternion()).angleTo(new THREE.Quaternion()) * (ap.rotation.y >= 0 ? 1 : -1) || 0.42;
    } else this.perro.grupo.rotation.y = 0.42;
    this.perro.grupo.position.copy(this.perroBase);
    await this.ponerPerro(perro);
    this.pintarPantalla({ modo: 'logo' });
    this.pintarMarcadores();
    this.paletas = { el: this.crearPaleta('el'), ella: this.crearPaleta('ella') };
    this.ajustar();
    this.planoActual = 'general';
    this.toma = TOMAS.general;
    this.camPos.copy(this.toma.pos);
    this.camMira.copy(this.toma.mira);
    this.metaPos.copy(this.toma.pos);
    this.metaMira.copy(this.toma.mira);
    // Los sombreadores se preparan durante la pantalla de carga (si no, el primer cuadro congela el show)
    this.camara.position.copy(this.camPos);
    this.camara.lookAt(this.camMira);
    this.camara.updateProjectionMatrix();
    for (const p of Object.values(this.paletas)) if (p) p.visible = true;
    if (this.papeles) this.papeles.m.visible = true;
    if (!this.sin3d) await this.renderer.compileAsync(this.escena, this.camara).catch(() => undefined);
    for (const p of Object.values(this.paletas)) if (p) p.visible = false;
    if (this.papeles) this.papeles.m.visible = false;
    this.ultimo = performance.now();
    this.reloj = requestAnimationFrame(this.cuadro);
  }

  private corbatin: THREE.Object3D | null = null;
  private microfono: THREE.Object3D | null = null;

  async ponerPerro(p: Perrito) {
    if (this.perroListo) return;
    this.perroListo = true;
    await this.perro.cargar(p.pelaje, this.corbatin, this.microfono);
  }

  private armarSet(set: THREE.Group) {
    const s = set.clone(true);
    this.set = s;
    this.escena.add(s);
    s.updateMatrixWorld(true);
    // Materiales: el piso brilla de verdad, las cosas que alumbran no llevan relieve y van más vivas
    s.traverse((o) => {
      const malla = o as THREE.Mesh;
      if (!malla.isMesh) return;
      malla.castShadow = malla.receiveShadow = false;
      const mat = malla.material as THREE.MeshStandardMaterial;
      if (!mat?.name) return;
      const n = mat.name.replace(/^Show \| /, '');
      if (!this.mats.has(n)) this.mats.set(n, mat);
      if (/^(escenario|medallon|corazon piso|piso estudio)$/.test(n)) {
        mat.roughness = n === 'piso estudio' ? 0.35 : 0.14;
        mat.normalMap = null;
        mat.envMapIntensity = 1.6;
        mat.needsUpdate = true;
      }
      if (/^(bombillo|lente|led|neon|tally|aplausos|estrellas|letras)/.test(n)) {
        mat.normalMap = null;
        mat.toneMapped = n.startsWith('letras') ? true : false;
        mat.needsUpdate = true;
      }
      if (/^bombillo \d/.test(n) && !this.bombillos.includes(mat)) this.bombillos.push(mat);
      if (/^tally \d/.test(n)) this.tallys[Number(n.slice(6))] = mat;
    });
    // Pantallas: el sombreador de LED (la grande con el texto encima)
    const crearLed = (texto: boolean, celdas: [number, number], patron: number) =>
      new THREE.ShaderMaterial({
        vertexShader: LED_VERT,
        fragmentShader: LED_FRAG,
        uniforms: {
          uT: { value: 0 },
          uA: { value: new THREE.Color('#3a1d63') },
          uB: { value: new THREE.Color('#ff6fa5') },
          uTexto: { value: this.texTexto },
          uHayTexto: { value: texto ? 1 : 0 },
          uPatron: { value: patron },
          uCeldas: { value: new THREE.Vector2(...celdas) },
        },
        toneMapped: false,
      });
    this.led = crearLed(true, [184, 92], 0);
    this.ledLados = crearLed(false, [34, 82], 2);
    const grande = s.getObjectByName('pantalla_grande') as THREE.Mesh | undefined;
    if (grande) grande.material = this.led;
    for (const n of ['pantalla_izq', 'pantalla_der']) {
      const p = s.getObjectByName(n) as THREE.Mesh | undefined;
      if (p) p.material = this.ledLados;
    }
    // Marcadores de los atriles
    this.marcadores = {
      el: this.crearMarcador(),
      ella: this.crearMarcador(),
    };
    for (const r of ['el', 'ella'] as Rol[]) {
      const p = s.getObjectByName(`marcador_${r}`) as THREE.Mesh | undefined;
      if (p) p.material = new THREE.MeshBasicMaterial({ map: this.marcadores[r].tex, toneMapped: false });
    }
    // Reflectores con su haz de luz y su charco en el piso
    const textCharco = texturaRadial();
    for (let i = 0; i < 12; i++) {
      const yugo = s.getObjectByName(`foco_${i}`);
      const cabeza = s.getObjectByName(`foco_${i}_cabeza`);
      if (!yugo || !cabeza) continue;
      const largo = 5.2;
      const g = new THREE.CylinderGeometry(0.06, 0.85, largo, 24, 1, true);
      g.translate(0, -largo / 2 - 0.13, 0);
      // uv.y: 1 en la lente, 0 en la punta
      const mat = new THREE.ShaderMaterial({
        vertexShader: HAZ_VERT,
        fragmentShader: HAZ_FRAG,
        uniforms: { uColor: { value: new THREE.Color('#ffffff') }, uFuerza: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const cono = new THREE.Mesh(g, mat);
      cono.renderOrder = 5;
      cabeza.add(cono);
      const charco = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: textCharco, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      );
      charco.rotation.x = -Math.PI / 2;
      charco.renderOrder = 4;
      this.escena.add(charco);
      this.haces.push({ yugo, cabeza, cono, charco, fase: i * 1.37, color: new THREE.Color('#ffffff'), meta: new THREE.Color('#ffffff') });
    }
    // El vestuario del presentador y el público salen del set (son moldes)
    this.corbatin = envolver(s.getObjectByName('corbatin'));
    this.microfono = envolver(s.getObjectByName('microfono'));
    this.armarPublico(s);
    this.armarConfeti();
  }

  private crearMarcador() {
    const lienzo = document.createElement('canvas');
    lienzo.width = 384;
    lienzo.height = 104;
    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    return { lienzo, tex, puntos: 0, listo: false, sobre: false };
  }

  private pintarMarcadores() {
    if (!this.marcadores) return;
    for (const r of ['el', 'ella'] as Rol[]) {
      const mk = this.marcadores[r];
      const g = mk.lienzo.getContext('2d')!;
      const w = mk.lienzo.width, h = mk.lienzo.height;
      const color = r === 'el' ? '#4fa3ff' : '#ff6fa5';
      g.fillStyle = '#0b0614';
      g.fillRect(0, 0, w, h);
      // Puntitos de LED de fondo
      g.fillStyle = mk.listo ? (mk.sobre ? '#3a2d66' : '#13402e') : '#1a1030';
      for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 8) g.fillRect(x, y, 5, 5);
      g.font = '700 46px Fredoka, sans-serif';
      g.textBaseline = 'middle';
      g.fillStyle = color;
      g.shadowColor = color;
      g.shadowBlur = 14;
      g.textAlign = 'left';
      g.fillText(r === 'el' ? 'ÉL' : 'ELLA', 18, h / 2 + 2);
      g.textAlign = 'right';
      g.fillStyle = mk.listo ? (mk.sobre ? '#c9b8ff' : '#46d6a0') : '#ffd25a';
      g.shadowColor = g.fillStyle;
      g.fillText(mk.listo ? (mk.sobre ? '✉' : '✓ LISTO') : String(mk.puntos), w - 18, h / 2 + 2);
      g.shadowBlur = 0;
      mk.tex.needsUpdate = true;
    }
  }

  private armarPublico(s: THREE.Object3D) {
    const moldes = ['publico_a', 'publico_b', 'publico_c'].map((n) => s.getObjectByName(n) as THREE.Mesh | undefined).filter((m): m is THREE.Mesh => !!m?.isMesh);
    const mano = s.getObjectByName('publico_mano') as THREE.Mesh | undefined;
    if (!moldes.length || !mano) return;
    const geos = moldes.map(geometriaReal);
    const geoMano = geometriaReal(mano);
    for (const m of [...moldes, mano]) m.removeFromParent();
    const sitios: { p: THREE.Vector3; v: number; k: number; fase: number }[] = [];
    const filas: [number, number][] = [[-6.0, 0], [-6.9, 0.32], [-7.8, 0.64]];
    let k = 0;
    for (const [y, z] of filas) {
      for (let j = 0; j < 17; j++) {
        const x = -5.0 + j * 0.625 + (Math.random() - 0.5) * 0.05;
        sitios.push({ p: tres(x, y + 0.08, z + 0.12), v: Math.floor(Math.random() * moldes.length), k: k++, fase: Math.random() * 10 });
      }
    }
    const paleta = ['#6b4e8a', '#8a4e6b', '#4e6b8a', '#4e8a6b', '#8a7a4e', '#5d4e8a', '#8a5a4e', '#4e5d8a', '#7a4e8a'];
    const cuerpos = moldes.map((molde, v) => {
      const lista = sitios.filter((x) => x.v === v);
      const mat = (molde.material as THREE.MeshStandardMaterial).clone();
      mat.color.set('#ffffff');
      const im = new THREE.InstancedMesh(geos[v], mat, Math.max(1, lista.length));
      im.count = lista.length;
      lista.forEach((x, i) => im.setColorAt(i, new THREE.Color(paleta[(x.k * 7) % paleta.length]).multiplyScalar(0.55 + Math.random() * 0.25)));
      im.frustumCulled = false;
      this.escena.add(im);
      return im;
    });
    const mm = (mano.material as THREE.MeshStandardMaterial).clone();
    mm.color.set('#d9b8a0');
    const manos = new THREE.InstancedMesh(geoMano, mm, sitios.length * 2);
    manos.frustumCulled = false;
    this.escena.add(manos);
    this.publicoMallas = { cuerpos, manos, sitios };
    this.moverPublico(0, true);
  }

  private moverPublico(dt: number, forzar = false) {
    const pm = this.publicoMallas;
    if (!pm) return;
    // Solo se mueve si se ve (en el plano general, la grúa o mirando al público)
    if (!forzar && !(this.planoActual === 'general' || this.planoActual === 'grua' || this.planoActual === 'publico')) return;
    this.tPublico += dt;
    const t = this.tPublico;
    const o = new THREE.Object3D();
    const cuentas = pm.cuerpos.map(() => 0);
    const est = this.estadoPublico;
    pm.sitios.forEach((s, i) => {
      const im = pm.cuerpos[s.v];
      const j = cuentas[s.v]++;
      const salto = est === 'ovacion' ? Math.max(0, Math.sin(t * 9 + s.fase)) * 0.09 : est === 'aplaudir' ? Math.abs(Math.sin(t * 7 + s.fase)) * 0.025 : Math.sin(t * 1.2 + s.fase) * 0.008;
      o.position.copy(s.p);
      o.position.y += salto;
      o.rotation.set(est === 'ohh' ? -0.12 : 0, Math.PI + Math.sin(t * 0.6 + s.fase) * 0.12, Math.sin(t * 0.9 + s.fase) * 0.04);
      o.scale.setScalar(1);
      o.updateMatrix();
      im.setMatrixAt(j, o.matrix);
      // Manos: aplauden (se juntan y se separan) frente al pecho; en la ovación, arriba
      for (const lado of [-1, 1]) {
        const abre = est === 'aplaudir' || est === 'ovacion' ? 0.06 + Math.abs(Math.sin(t * (est === 'ovacion' ? 13 : 10) + s.fase)) * 0.07 : 0.15;
        const alto = est === 'ovacion' ? 0.95 + Math.sin(t * 5 + s.fase) * 0.06 : est === 'ohh' ? 0.8 : est === 'aplaudir' ? 0.62 : 0.4;
        o.position.set(s.p.x + lado * abre, s.p.y + alto + salto, s.p.z - 0.12);
        o.rotation.set(0, 0, lado * 0.3);
        o.updateMatrix();
        pm.manos.setMatrixAt(i * 2 + (lado > 0 ? 1 : 0), o.matrix);
      }
    });
    for (const im of pm.cuerpos) im.instanceMatrix.needsUpdate = true;
    pm.manos.instanceMatrix.needsUpdate = true;
  }

  private armarConfeti() {
    const n = 280;
    const g = new THREE.PlaneGeometry(0.045, 0.07);
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
    const im = new THREE.InstancedMesh(g, m, n);
    const colores = ['#ff6fa5', '#ffd25a', '#4fa3ff', '#46d6a0', '#ffffff', '#b48ce0', '#ff7a3d'];
    for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(colores[i % colores.length]));
    im.visible = false;
    im.frustumCulled = false;
    this.escena.add(im);
    this.papeles = { m: im, pos: new Float32Array(n * 3), vel: new Float32Array(n * 3), giro: new Float32Array(n * 3), vida: 0 };
  }

  private crearPaleta(rol: Rol): THREE.Group {
    const grupo = new THREE.Group();
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const cara = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    const atras = cara.clone();
    atras.rotation.y = Math.PI;
    const borde = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 8, 32), new THREE.MeshStandardMaterial({ color: '#f2c14e', metalness: 0.7, roughness: 0.3 }));
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 8), new THREE.MeshStandardMaterial({ color: '#c98b5a', roughness: 0.7 }));
    palo.position.y = -0.27;
    const disco = new THREE.Group();
    disco.add(cara, atras, borde);
    disco.position.y = -0.02;
    grupo.add(disco, palo);
    grupo.userData.lienzo = c;
    grupo.userData.tex = tex;
    grupo.visible = false;
    this.tarima.add(grupo);
    void rol;
    return grupo;
  }

  private pintarPaleta(p: THREE.Group, voto: 'e' | 'a' | '-') {
    const c = p.userData.lienzo as HTMLCanvasElement;
    const g = c.getContext('2d')!;
    const color = voto === 'e' ? '#4fa3ff' : voto === 'a' ? '#ff6fa5' : '#8b7bd8';
    g.fillStyle = color;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath();
    g.arc(90, 80, 70, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.font = `700 ${voto === 'a' ? 74 : 92}px Fredoka, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(voto === 'e' ? 'ÉL' : voto === 'a' ? 'ELLA' : '?', 128, 136);
    (p.userData.tex as THREE.CanvasTexture).needsUpdate = true;
  }

  // ---------------------------------------------------------------------------------------------- Pantalla gigante
  pantalla(c: Pantalla) {
    this.pintarPantalla(c);
  }

  private pintarPantalla(c: Pantalla) {
    const g = this.lienzoTexto.getContext('2d')!;
    const W = 1024, H = 512;
    g.clearRect(0, 0, W, H);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const sombra = (color: string, blur = 18) => {
      g.shadowColor = color;
      g.shadowBlur = blur;
    };
    if (c.modo === 'logo') {
      sombra('#ffd25a', 30);
      g.fillStyle = '#ffd25a';
      g.font = '700 150px Fredoka, sans-serif';
      g.fillText('El Show', W / 2, H * 0.36);
      sombra('#ff6fa5', 30);
      g.fillStyle = '#ff8fbd';
      g.font = '700 108px Fredoka, sans-serif';
      g.fillText('de Nosotros', W / 2, H * 0.68);
      if (this.led) this.led.uniforms.uPatron.value = 1;
    } else if (c.modo === 'pregunta') {
      g.fillStyle = 'rgba(10, 4, 24, 0.55)';
      g.fillRect(40, 70, W - 80, H - 140);
      sombra('#000', 0);
      g.fillStyle = '#fff7ef';
      let tam = 66;
      let l: string[] = [];
      for (; tam > 34; tam -= 4) {
        g.font = `600 ${tam}px Fredoka, sans-serif`;
        l = lineas(g, c.texto, W - 150);
        if (l.length * tam * 1.15 < H - 170) break;
      }
      sombra(c.color ?? '#ffd25a', 12);
      const y0 = H / 2 - ((l.length - 1) * tam * 1.15) / 2;
      l.forEach((x, i) => g.fillText(x, W / 2, y0 + i * tam * 1.15));
      if (this.led) this.led.uniforms.uPatron.value = 0;
    } else if (c.modo === 'ronda') {
      sombra('#000', 0);
      g.fillStyle = c.color ?? '#ffd25a';
      g.font = '700 80px Fredoka, sans-serif';
      g.fillText(c.titulo.toUpperCase(), W / 2, H * 0.3);
      sombra('#ffffff', 22);
      g.fillStyle = '#ffffff';
      let tam = 104;
      for (; tam > 50; tam -= 6) {
        g.font = `700 ${tam}px Fredoka, sans-serif`;
        if (g.measureText(c.texto).width < W - 80) break;
      }
      g.fillText(c.texto, W / 2, H * 0.62);
      if (this.led) this.led.uniforms.uPatron.value = 1;
    } else if (c.modo === 'medidor') {
      sombra('#ff6fa5', 30);
      g.fillStyle = '#fff';
      g.font = '700 210px Fredoka, sans-serif';
      g.fillText(`${c.valor}%`, W / 2, H * 0.48);
      g.font = '600 56px Fredoka, sans-serif';
      g.fillStyle = '#ffd25a';
      g.fillText('de conexión', W / 2, H * 0.82);
      if (this.led) this.led.uniforms.uPatron.value = 2;
    }
    g.shadowBlur = 0;
    this.texTexto.needsUpdate = true;
  }

  // ---------------------------------------------------------------------------------------------- Lo que manda el show
  /** Cambia de plano: con corte seco (como en la tele) o moviendo la cámara. */
  plano(p: Plano, o: { corte?: boolean } = {}) {
    this.planoActual = p;
    this.tToma = 0;
    if (p === 'grua') {
      this.grua = 0.0001;
      this.toma = TOMAS.general;
      this.camPos.set(6.5, 5.2, 8.5);
      this.camMira.set(0, 2.2, -1);
      return;
    }
    this.grua = 0;
    this.toma = TOMAS[p];
    this.metaPos.copy(this.toma.pos);
    this.metaMira.copy(this.toma.mira);
    if (o.corte ?? true) {
      this.camPos.copy(this.metaPos);
      this.camMira.copy(this.metaMira);
    }
    this.tallys.forEach((m, i) => {
      if (m) m.emissiveIntensity = i === this.toma.cam ? 6 : 0.25;
    });
  }

  /** Deja espacio a la derecha para el panel de contestar (el plano se corre a la izquierda). */
  encuadre(panel: boolean) {
    this.metaDesplazado = panel ? 1 : 0;
  }

  /** Luces, haces y pantallas según el momento. */
  animo(a: Animo) {
    this.animoActual = a;
    const A = ANIMOS[a];
    this.haces.forEach((h, i) => h.meta.set(A.haces[i % A.haces.length]));
    this.mats.get('led')?.emissive.set(A.led);
    if (this.led) {
      this.led.uniforms.uB.value.set(A.led);
      this.led.uniforms.uA.value.set(A.suelo);
    }
    if (this.ledLados) {
      this.ledLados.uniforms.uB.value.set(A.haces[0]);
      this.ledLados.uniforms.uA.value.set(A.suelo);
    }
  }

  marcador(p: Record<Rol, number>) {
    this.puntaje = { ...p };
    if (!this.marcadores) return;
    for (const r of ['el', 'ella'] as Rol[]) {
      this.marcadores[r].puntos = p[r];
      this.marcadores[r].listo = false;
    }
    this.pintarMarcadores();
  }

  /** La pantallita del atril dice «listo» (o el sobre, si quedó guardado para después). */
  listo(r: Rol, si: boolean, sobre = false) {
    if (!this.marcadores) return;
    this.marcadores[r].listo = si;
    this.marcadores[r].sobre = sobre;
    this.marcadores[r].puntos = this.puntaje[r];
    this.pintarMarcadores();
  }

  /** Levanta la paleta con el voto (null la baja). */
  paleta(r: Rol, voto: 'e' | 'a' | '-' | null) {
    const p = this.paletas[r];
    const antes = this.votos[r];
    this.votos[r] = voto;
    if (!p) return;
    if (!voto) {
      if (antes) this.m[r].esperar('nada');
      p.visible = false;
      if (antes) void this.m[r].actuar(BAJAR);
      return;
    }
    this.pintarPaleta(p, voto);
    p.visible = true;
    p.userData.aparecer = 0;
    void this.m[r].actuar(LEVANTAR);
  }

  pensando(r: Rol, si: boolean) {
    this.m[r].esperar(si ? 'pensando' : 'nada');
  }

  hacer(r: Rol, coreo: string, demora = 0): Promise<void> {
    return this.director.hacer(r, coreo, undefined, demora);
  }

  decir(r: Rol, texto: string) {
    this.efectos.globo(texto, this.anclas[r], 2.3 / this.rapido);
  }

  perroHabla(si: boolean) {
    this.perro.hablar(si);
  }

  perroAccion(a: AccionPerro | 'senalar') {
    this.perro.mirarA = a === 'senalar' ? 1 : 0;
    this.perro.hacer(a, a === 'saltar' ? 1.4 : a === 'aplaudir' ? 2.2 : 1.6);
  }

  /** Dónde está la cabeza del perrito en la pantalla (para su globo); null si no se ve. */
  anclaPerro(): { x: number; y: number; r: number } | null {
    const v = this.perro.cabeza();
    const p = v.clone().project(this.camara);
    if (p.z > 1 || p.z < -1) return null;
    const w = this.lienzo.clientWidth, h = this.lienzo.clientHeight;
    const borde = v.clone().add(new THREE.Vector3(0.18, 0, 0)).project(this.camara);
    return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h, r: Math.max(10, (Math.abs(borde.x - p.x) / 2) * w) };
  }

  confeti(grande = false) {
    const c = this.papeles;
    if (!c) return;
    const n = c.m.count;
    for (let i = 0; i < n; i++) {
      const desde = i % 3;
      let x: number, y: number, z: number, vx: number, vy: number, vz: number;
      if (desde < 2 || !grande) {
        // De los cañones a los lados del escenario
        const s = i % 2 ? 1 : -1;
        x = s * 4.1;
        y = 0.6;
        z = 3.1;
        vx = -s * (1.2 + Math.random() * 2.2);
        vy = 4.5 + Math.random() * 3;
        vz = -0.8 - Math.random() * 2;
      } else {
        // Lluvia desde la cercha
        x = (Math.random() - 0.5) * 8;
        y = 4.4 + Math.random() * 0.5;
        z = (Math.random() - 0.5) * 3;
        vx = (Math.random() - 0.5) * 0.4;
        vy = -0.2;
        vz = (Math.random() - 0.5) * 0.4;
      }
      c.pos.set([x, y, z], i * 3);
      c.vel.set([vx, vy, vz], i * 3);
      c.giro.set([Math.random() * 6, Math.random() * 6, 4 + Math.random() * 8], i * 3);
    }
    c.vida = grande ? 7 : 5;
    c.m.visible = true;
  }

  publico(estado: 'quieto' | 'aplaudir' | 'ovacion' | 'ohh') {
    this.estadoPublico = estado;
    const ap = this.mats.get('aplausos');
    if (ap) ap.emissiveIntensity = estado === 'aplaudir' || estado === 'ovacion' ? 8 : 0.4;
    clearTimeout(this.tAplausos);
    if (estado !== 'quieto') this.tAplausos = window.setTimeout(() => this.publico('quieto'), (estado === 'ovacion' ? 3600 : 2600) / this.rapido);
  }
  private tAplausos = 0;

  async final(ganador: Rol | null) {
    await Promise.race([this.director.final(ganador), new Promise((r) => setTimeout(r, 5000 / this.rapido))]);
  }

  /** Espera a que los dos terminen lo que están actuando. */
  calma(maxMs: number): Promise<void> {
    const t0 = performance.now();
    return new Promise((listo) => {
      const mirar = () => {
        const ocupados = (['el', 'ella'] as Rol[]).some((r) => this.m[r].actuando);
        if (!ocupados || performance.now() - t0 > maxMs / this.rapido || !this.vivo) listo();
        else setTimeout(mirar, 80);
      };
      mirar();
    });
  }

  pausar(si: boolean) {
    this.pausado = si;
  }

  // ---------------------------------------------------------------------------------------------- Cada cuadro
  private ajustar = () => {
    const w = this.lienzo.clientWidth || window.innerWidth, h = this.lienzo.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    const panel = this.lienzo.parentElement?.querySelector('.show-panel') as HTMLElement | null;
    // El panel ocupa casi la mitad de la derecha en el celular acostado
    this.anchoPanel = w > h ? Math.min(410, w * 0.47) + 16 : 0;
    void panel;
  };

  private anclasDe(rol: Rol): Anclas {
    const m = this.m[rol];
    const aCapa = (v: THREE.Vector3, radio: number) => {
      const w = this.lienzo.clientWidth, h = this.lienzo.clientHeight;
      const p = v.clone().project(this.camara);
      const borde = v.clone().add(new THREE.Vector3(radio, 0, 0)).project(this.camara);
      return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h, r: Math.max(8, (Math.abs(borde.x - p.x) / 2) * w) };
    };
    return {
      cabeza: () => aCapa(m.puntoCabeza(), m.radioCabeza),
      cara: () => aCapa(m.puntoCara(), m.radioCabeza),
      pies: () => aCapa(m.puntoPies(), m.radioCabeza),
      lado: () => (rol === 'el' ? 1 : -1),
    };
  }

  private cuadro = (ms: number) => {
    if (!this.vivo) return;
    this.reloj = requestAnimationFrame(this.cuadro);
    const dtReal = Math.min(0.1, (ms - this.ultimo) / 1000);
    this.acumulado += dtReal;
    this.ultimo = ms;
    // 30 cuadros por segundo: menos calor y batería
    if (this.acumulado < 1 / FPS - 0.002) return;
    const dt = Math.min(0.08, this.acumulado) * this.rapido;
    this.acumulado = 0;
    if (!this.congelado) this.paso(dt);
    if (!this.sin3d && this.lienzo.offsetParent !== null) {
      const t0 = performance.now();
      this.renderer.render(this.escena, this.camara);
      this.medir(performance.now() - t0, dtReal);
    }
  };

  /** Pruebas (con ?sin3d el cuadro no pinta): pinta una vez lo que hay ahora. */
  pintar() {
    this.renderer.render(this.escena, this.camara);
  }

  /** Pruebas: avanza a pasos y pinta una vez. */
  simular(segundos: number) {
    for (let t = 0; t < segundos; t += 1 / 30) this.paso(1 / 30);
    this.renderer.render(this.escena, this.camara);
  }

  private medir(ms: number, dtReal: number) {
    this.medidas.push(dtReal * 1000);
    if (this.medidas.length < 60) return;
    const prom = this.medidas.reduce((a, b) => a + b, 0) / this.medidas.length;
    this.medidas = [];
    // Si no alcanza los 30 cuadros, baja la resolución (y si sobra mucho, la sube un poco)
    if (prom > 44 && this.ratio > 0.7) {
      this.ratio = Math.max(0.7, this.ratio - 0.2);
      this.renderer.setPixelRatio(this.ratio);
      this.ajustar();
      if (this.ratio <= 0.9) for (const h of this.haces) h.charco.visible = false;
    }
    void ms;
  }

  private paso(dt: number) {
    this.t += dt;
    const t = this.t;
    const A = ANIMOS[this.animoActual];
    // Muñecos, perrito, efectos
    for (const r of ['el', 'ella'] as Rol[]) {
      const m = this.m[r];
      m.update(dt);
      const g = m.p.grupo.position;
      const alto = m.p.cuerpo.position.y;
      this.sombras[r].position.set(g.x, 0.006, g.z);
      this.sombras[r].scale.setScalar(Math.max(0.2, 1 - alto * 0.6) * m.alto * m.p.escala * 0.62);
    }
    this.director.cuadro(dt);
    this.efectos.cuadro(dt);
    this.perro.update(dt, t);
    this.moverPaletas(dt);
    // Reflectores: barren el escenario, cada uno a su ritmo; en suspenso apuntan a los atriles
    const objetivo = new THREE.Vector3();
    this.haces.forEach((h, i) => {
      h.color.lerp(h.meta, Math.min(1, dt * 3));
      (h.cono.material as THREE.ShaderMaterial).uniforms.uColor.value.copy(h.color);
      const f = A.fuerza * (this.animoActual === 'relampago' ? 0.7 + 0.3 * Math.sign(Math.sin(t * 9 + i)) : 1);
      (h.cono.material as THREE.ShaderMaterial).uniforms.uFuerza.value = f;
      let pan: number, tilt: number;
      if (this.animoActual === 'suspenso') {
        const r = i % 2 ? 'ella' : 'el';
        objetivo.copy(this.m[r].p.grupo.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(Math.sin(t * 0.7 + i) * 0.25, 0, 0));
        const desde = h.yugo.getWorldPosition(new THREE.Vector3());
        const d = objetivo.sub(desde);
        pan = Math.atan2(d.x, d.z) + Math.PI;
        tilt = Math.atan2(Math.hypot(d.x, d.z), -d.y);
        h.yugo.rotation.y += (pan - h.yugo.rotation.y) * Math.min(1, dt * 2);
        h.cabeza.rotation.x += (-tilt - h.cabeza.rotation.x) * Math.min(1, dt * 2);
      } else {
        pan = Math.sin(t * A.rapidez * 0.6 + h.fase) * 0.9;
        tilt = 0.35 + Math.sin(t * A.rapidez * 0.45 + h.fase * 1.7) * 0.3;
        h.yugo.rotation.y += (pan - h.yugo.rotation.y) * Math.min(1, dt * 3);
        h.cabeza.rotation.x += (tilt - h.cabeza.rotation.x) * Math.min(1, dt * 3);
      }
      // El charco de luz donde el haz toca el piso
      if (h.charco.visible) {
        const lente = h.cabeza.localToWorld(new THREE.Vector3(0, -0.13, 0));
        const dir = h.cabeza.localToWorld(new THREE.Vector3(0, -1.13, 0)).sub(lente).normalize();
        const piso = 0.25;
        if (dir.y < -0.15) {
          const k = (piso - lente.y) / dir.y;
          h.charco.position.set(lente.x + dir.x * k, piso + 0.004 + i * 0.0004, lente.z + dir.z * k);
          h.charco.scale.setScalar(0.5 + k * 0.32);
          (h.charco.material as THREE.MeshBasicMaterial).color.copy(h.color).multiplyScalar(0.55 * f);
        }
      }
    });
    // Bombillos en cadena (más rápido en la fiesta); en suspenso, titilan despacio
    const vel = this.animoActual === 'fiesta' || this.animoActual === 'intro' || this.animoActual === 'relampago' ? 7 : this.animoActual === 'bien' ? 9 : this.animoActual === 'suspenso' ? 1.2 : 2.2;
    const fase = Math.floor(t * vel) % 3;
    this.bombillos.forEach((m, k) => {
      const on = this.animoActual === 'normal' ? 0.75 + 0.25 * Math.sin(t * 2 + k * 2.1) : k === fase ? 1 : 0.25;
      m.emissiveIntensity = 2 + on * 7;
    });
    const led = this.mats.get('led');
    if (led) led.emissiveIntensity = 2.5 + Math.sin(t * (this.animoActual === 'relampago' ? 10 : 2.4)) * 1.2;
    const neon = this.mats.get('neon');
    if (neon) neon.emissiveIntensity = 4 + (Math.random() < 0.02 ? -3 : 0);
    if (this.estadoPublico === 'aplaudir' || this.estadoPublico === 'ovacion') {
      const ap = this.mats.get('aplausos');
      if (ap) ap.emissiveIntensity = Math.sin(t * 8) > 0 ? 9 : 2;
    }
    // Luces del estudio hacia el ánimo
    const L = this.luces;
    L.cielo.color.lerp(new THREE.Color(A.cielo), Math.min(1, dt * 2));
    L.cielo.groundColor.lerp(new THREE.Color(A.suelo), Math.min(1, dt * 2));
    L.clave.intensity += (1.6 * A.clave - L.clave.intensity) * Math.min(1, dt * 2.5);
    L.rosa.intensity = 3.2 + Math.sin(t * 1.3) * 0.8;
    L.azul.intensity = 3.2 + Math.cos(t * 1.1) * 0.8;
    if (this.led) this.led.uniforms.uT.value = t;
    if (this.ledLados) this.ledLados.uniforms.uT.value = t * 1.3;
    this.moverPublico(dt);
    this.moverConfeti(dt);
    this.moverCamara(dt);
  }

  private moverPaletas(dt: number) {
    for (const r of ['el', 'ella'] as Rol[]) {
      const p = this.paletas[r];
      if (!p?.visible) continue;
      const m = this.m[r];
      const mano = m.hueso('mano.L');
      if (!mano) continue;
      const mundo = mano.getWorldPosition(new THREE.Vector3());
      p.position.copy(this.tarima.worldToLocal(mundo));
      p.position.y += 0.17;
      p.rotation.set(0, m.p.rot * 0.6, Math.sin(this.t * 3) * 0.05);
      const k = (p.userData.aparecer = Math.min(1, (p.userData.aparecer ?? 0) + dt * 5));
      p.scale.setScalar(Math.max(0.01, k < 1 ? k * (1 + Math.sin(k * Math.PI) * 0.3) : 1));
    }
  }

  private moverConfeti(dt: number) {
    const c = this.papeles;
    if (!c || !c.m.visible) return;
    c.vida -= dt;
    if (c.vida <= 0) {
      c.m.visible = false;
      return;
    }
    const o = new THREE.Object3D();
    const n = c.m.count;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      // Gravedad, aire que frena y un vaivén de papelito
      c.vel[j + 1] -= 9.8 * dt * 0.55;
      const aire = Math.pow(0.35, dt);
      c.vel[j] *= aire;
      c.vel[j + 2] *= aire;
      if (c.vel[j + 1] < -0.9) c.vel[j + 1] = -0.9;
      c.pos[j] += (c.vel[j] + Math.sin(this.t * 3 + i) * 0.25) * dt;
      c.pos[j + 1] += c.vel[j + 1] * dt;
      c.pos[j + 2] += c.vel[j + 2] * dt;
      if (c.pos[j + 1] < 0.26) c.pos[j + 1] = 0.26;
      o.position.set(c.pos[j], c.pos[j + 1], c.pos[j + 2]);
      o.rotation.set(c.giro[j] + this.t * c.giro[j + 2], c.giro[j + 1] + this.t * 2, this.t * 3 + i);
      o.updateMatrix();
      c.m.setMatrixAt(i, o.matrix);
    }
    c.m.instanceMatrix.needsUpdate = true;
  }

  private moverCamara(dt: number) {
    this.tToma += dt;
    const w = this.lienzo.clientWidth || 1, h = this.lienzo.clientHeight || 1;
    // La grúa de la entrada: baja desde arriba del público hasta el plano general
    if (this.grua > 0) {
      this.grua = Math.min(1, this.grua + dt / 4.2);
      const k = 1 - Math.pow(1 - this.grua, 3);
      this.camPos.set(6.5 * (1 - k), 5.2 + (TOMAS.general.pos.y - 5.2) * k, 8.5 + (TOMAS.general.pos.z - 8.5) * k);
      this.camMira.set(0, 2.2 + (TOMAS.general.mira.y - 2.2) * k, -1 + (TOMAS.general.mira.z + 1) * k);
      if (this.grua >= 1) {
        this.grua = 0;
        this.planoActual = 'general';
        this.metaPos.copy(TOMAS.general.pos);
        this.metaMira.copy(TOMAS.general.mira);
      }
    } else {
      const k = Math.min(1, dt * 2.2);
      this.camPos.lerp(this.metaPos, k);
      this.camMira.lerp(this.metaMira, k);
    }
    // Un empujoncito lento de cámara (como un operador de verdad) y un pulso de mano casi imperceptible
    const empuje = Math.min(1, this.tToma / 9) * 0.06;
    const pos = this.camPos.clone().lerp(this.camMira, empuje);
    pos.x += Math.sin(this.t * 0.7) * 0.012;
    pos.y += Math.sin(this.t * 0.9 + 1) * 0.008;
    this.camara.position.copy(pos);
    this.camara.lookAt(this.camMira);
    // Espacio libre (si está el panel, la parte izquierda) y la apertura para que quepa lo que se quiere ver
    this.desplazado += (this.metaDesplazado - this.desplazado) * Math.min(1, dt * 5);
    const libre = w - this.anchoPanel * this.desplazado;
    const dist = pos.distanceTo(this.camMira);
    const anchoVisto = this.toma.ancho * (this.grua > 0 ? 1.1 : 1);
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(anchoVisto / 2 / dist / (libre / h)));
    this.camara.fov = THREE.MathUtils.clamp(fov, 18, 72);
    this.camara.aspect = w / h;
    const d = (w - libre) / 2;
    if (d > 0.5) this.camara.setViewOffset(w + 2 * d, h, 2 * d, 0, w, h);
    else this.camara.clearViewOffset();
    this.camara.updateProjectionMatrix();
  }

  private texturaSombra() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    r.addColorStop(0, 'rgba(10,4,20,0.5)');
    r.addColorStop(0.6, 'rgba(10,4,20,0.2)');
    r.addColorStop(1, 'rgba(10,4,20,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // ---------------------------------------------------------------------------------------------- Salir
  destruir() {
    if (!this.vivo) return;
    this.vivo = false;
    cancelAnimationFrame(this.reloj);
    clearTimeout(this.tAplausos);
    window.removeEventListener('resize', this.ajustar);
    this.director.limpiar();
    this.efectos.limpiar();
    liberarEsqueletos(this.m.el.p.grupo, this.m.ella.p.grupo);
    // Lo propio de esta escena (lo compartido con la casa, como los modelos cacheados, se queda)
    this.escena.traverse((o) => {
      const m = o as THREE.Mesh;
      if ((m as THREE.InstancedMesh).isInstancedMesh) (m as THREE.InstancedMesh).dispose();
      if (m.isMesh && m.material && ((m.material as THREE.Material).type === 'ShaderMaterial' || (m.material as THREE.MeshBasicMaterial).map instanceof THREE.CanvasTexture)) {
        (m.material as THREE.Material).dispose();
      }
    });
    this.texTexto.dispose();
    if (this.marcadores) for (const r of ['el', 'ella'] as Rol[]) this.marcadores[r].tex.dispose();
    this.escena.environment?.dispose();
    this.renderer.dispose();
    // Android deja la casa en blanco si no se suelta el WebGL de los minijuegos
    this.renderer.forceContextLoss();
  }
}

/** Levantar la paleta (puño arriba, quieto un rato) y bajarla. */
const LEVANTAR: Coreografia = {
  nombre: 'levantar paleta',
  prioridad: 3,
  pasos: [
    { dur: 0.18, pose: 'preparar_salto', cara: 'concentrado', suave: 26 },
    { dur: 2.6, pose: 'puno_a', cara: 'presumido', suave: 22, mov: [{ tipo: 'rebote', alto: 0.02, frec: 1.5 }] },
  ],
};
const BAJAR: Coreografia = { nombre: 'bajar paleta', pasos: [{ dur: 0.3, pose: 'reposo', cara: 'normal' }] };
