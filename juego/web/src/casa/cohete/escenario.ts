// El fondo del retrete espacial: cielo con nebulosas que se repiten, tres capas de estrellas con parallax, nubes
// en el cielo del barrio, planetas de verdad (la Tierra abajo en la órbita, la Luna, Marte, Júpiter, Saturno…),
// polvo de velocidad y la luz de cada tramo. Todo se mezcla suave al pasar de un tramo al otro.
import * as THREE from 'three';
import { type Planeta, texturaAnillo, texturaHalo, texturaNebulosa, texturaNube, texturaPlaneta } from './arte';
import { TRAMOS } from './datos';

/** Cómo se ve cada tramo. */
interface Look {
  arriba: string;
  abajo: string;
  neb1: string;
  neb2: string;
  nebulosa: number;
  estrellas: number;
  nubes: number;
  sol: string;
  solFuerza: number;
  cielo: string;
  suelo: string;
  /** Rocas de fondo (cinturón). */
  rocas: number;
  /** Color del polvo de velocidad. */
  polvo: string;
  planeta?: Planeta;
}

export const LOOKS: Look[] = [
  // El cielo del barrio: azul de mediodía con nubes de algodón
  { arriba: '#3E8EDB', abajo: '#BFE6FF', neb1: '#FFFFFF', neb2: '#FFFFFF', nebulosa: 0, estrellas: 0, nubes: 1, sol: '#FFF4DE', solFuerza: 2.6,
    cielo: '#DCEBFF', suelo: '#8FB7D8', rocas: 0, polvo: '#FFFFFF' },
  // La órbita: casi negro, la Tierra abajo con su brillo azul
  { arriba: '#03040F', abajo: '#10204A', neb1: '#2A3F8F', neb2: '#5B7BD6', nebulosa: 0.3, estrellas: 1, nubes: 0, sol: '#FFF6E8', solFuerza: 2.4,
    cielo: '#C9D8FF', suelo: '#2A3A6A', rocas: 0, polvo: '#BFD4FF', planeta: 'tierra' },
  // La Luna: gris azulado y frío
  { arriba: '#05050C', abajo: '#1A1A2E', neb1: '#3A3A66', neb2: '#8E8EC9', nebulosa: 0.22, estrellas: 1, nubes: 0, sol: '#F2F2FF', solFuerza: 2.3,
    cielo: '#D6D6F0', suelo: '#2B2B3E', rocas: 0.25, polvo: '#D8D8F0', planeta: 'luna' },
  // Marte: rojizo y polvoriento
  { arriba: '#0E0408', abajo: '#3A1212', neb1: '#8F2A1A', neb2: '#FF8A4F', nebulosa: 0.45, estrellas: 0.8, nubes: 0, sol: '#FFE2C8', solFuerza: 2.4,
    cielo: '#FFC9A8', suelo: '#4A1A12', rocas: 0.35, polvo: '#FFB08A', planeta: 'marte' },
  // El cinturón: café dorado con rocas por todas partes
  { arriba: '#0B0805', abajo: '#2E2010', neb1: '#7A5420', neb2: '#E8B45A', nebulosa: 0.38, estrellas: 0.8, nubes: 0, sol: '#FFE9C2', solFuerza: 2.5,
    cielo: '#FFE2B0', suelo: '#3A2810', rocas: 1, polvo: '#E8C48A', planeta: 'jupiter' },
  // La nebulosa: morado, fucsia y turquesa
  { arriba: '#0A0520', abajo: '#2A0F3A', neb1: '#9B2FAE', neb2: '#2FD5C9', nebulosa: 0.8, estrellas: 1, nubes: 0, sol: '#F2DCFF', solFuerza: 2.4,
    cielo: '#E2C8FF', suelo: '#2A1040', rocas: 0.3, polvo: '#E8B8FF', planeta: 'saturno' },
  // La galaxia del amor: rosado por todas partes
  { arriba: '#16051A', abajo: '#4A0D35', neb1: '#E8396E', neb2: '#FFB3D1', nebulosa: 0.7, estrellas: 1, nubes: 0, sol: '#FFE0EC', solFuerza: 2.5,
    cielo: '#FFD0E4', suelo: '#40102C', rocas: 0.2, polvo: '#FFC2DA', planeta: 'corazon' },
];

const CIELO_V = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
const CIELO_F = /* glsl */ `
uniform vec3 arriba, abajo, neb1, neb2;
uniform float nebulosa, desplaz, aspecto, tiempo, horizonte;
uniform sampler2D tex;
varying vec2 vUv;
void main() {
  float y = vUv.y;
  vec3 col = mix(abajo, arriba, smoothstep(0.0, 1.0, y));
  vec2 uv = vec2(vUv.x * aspecto * 0.42 + desplaz, y * 0.85 + 0.08);
  vec4 n = texture2D(tex, uv);
  vec4 m = texture2D(tex, uv * 1.6 + vec2(desplaz * 0.55 + 0.37, 0.21));
  float nubes = n.r * (0.55 + 0.45 * m.r);
  col += neb1 * nubes * nebulosa * 0.75;
  col += neb2 * (n.g * 0.6 + m.g * 0.4) * nebulosa * 0.45;
  col += mix(neb1, neb2, 0.5) * n.b * nebulosa * 0.1;
  // Resplandor del horizonte (la atmósfera de la Tierra abajo)
  col += vec3(0.35, 0.6, 1.0) * horizonte * pow(1.0 - y, 6.0) * 0.6;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const ESTRELLAS_V = /* glsl */ `
attribute float tam;
attribute float fase;
attribute vec3 tono;
uniform float desplaz, ancho, tiempo, escala;
varying vec3 vTono;
varying float vBrillo;
void main() {
  vec3 p = position;
  p.x = mod(p.x - desplaz + ancho * 0.5, ancho) - ancho * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.65 + 0.35 * sin(tiempo * (1.5 + fase) + fase * 6.28);
  gl_PointSize = tam * escala * (0.85 + 0.15 * tw) / -mv.z;
  vTono = tono;
  vBrillo = tw;
}`;
const ESTRELLAS_F = /* glsl */ `
uniform float brillo;
varying vec3 vTono;
varying float vBrillo;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float centro = smoothstep(0.5, 0.0, d);
  float cruz = max(smoothstep(0.06, 0.0, abs(p.x)) * smoothstep(0.5, 0.1, abs(p.y)), smoothstep(0.06, 0.0, abs(p.y)) * smoothstep(0.5, 0.1, abs(p.x)));
  float a = (pow(centro, 3.0) + cruz * 0.5 * vBrillo) * brillo;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vTono * a, a);
  #include <colorspace_fragment>
}`;

const RESPLANDOR_F = /* glsl */ `
uniform vec3 color;
uniform float fuerza;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
  gl_FragColor = vec4(color * f * fuerza, f * fuerza);
  #include <colorspace_fragment>
}`;
const RESPLANDOR_V = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalMatrix * normal;
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const c = (h: string) => new THREE.Color(h);
/** Altura de una nube de adelante: en la franja de arriba o en la de abajo. */
const yFrente = () => (Math.random() < 0.5 ? 1 : -1) * (5.2 + Math.random() * 1.5);
const mezcla = (a: number, b: number, k: number) => a + (b - a) * k;

interface Capa {
  pts: THREE.Points;
  mat: THREE.ShaderMaterial;
  parallax: number;
}
interface Nube {
  s: THREE.Sprite;
  v: number;
  frente: boolean;
}
interface CuerpoCeleste {
  grupo: THREE.Group;
  planeta: Planeta;
  /** El tramo donde sale. */
  tramo: number;
  listo: boolean;
  radio: number;
}

export class Escenario {
  readonly grupo = new THREE.Group();
  private cielo: THREE.Mesh;
  private matCielo: THREE.ShaderMaterial;
  private capas: Capa[] = [];
  private nubes: Nube[] = [];
  private cuerpos: CuerpoCeleste[] = [];
  private tierra: CuerpoCeleste | null = null;
  private polvo: THREE.LineSegments;
  private polvoPos: Float32Array;
  private polvoDatos: Float32Array;
  private rocas: THREE.InstancedMesh;
  private rocasDatos: Float32Array;
  private halo: THREE.Texture;
  private sol: THREE.Sprite;
  readonly luzSol = new THREE.DirectionalLight('#ffffff', 2.4);
  readonly luzCielo = new THREE.HemisphereLight('#ffffff', '#333333', 1.1);
  private desplaz = 0;
  private t = 0;
  private dummy = new THREE.Object3D();
  /** Mezcla actual (0..1 por tramo) para que el juego sepa en qué tramo va. */
  tramo = 0;
  mezcla = 0;
  private looks = LOOKS.map((l) => ({ ...l, cArriba: c(l.arriba), cAbajo: c(l.abajo), cNeb1: c(l.neb1), cNeb2: c(l.neb2), cSol: c(l.sol), cCielo: c(l.cielo), cSuelo: c(l.suelo), cPolvo: c(l.polvo) }));
  private tmpA = new THREE.Color();
  private tmpB = new THREE.Color();
  /** Para el despegue: las nubes bajan en vez de ir a la izquierda. */
  subiendo = 0;
  private bajo = false;
  private nubesFactor = 1;

  constructor(private camara: THREE.PerspectiveCamera, geometriaRoca: THREE.BufferGeometry, materialRoca: THREE.Material) {
    this.halo = texturaHalo();
    // Cielo de fondo
    this.matCielo = new THREE.ShaderMaterial({
      uniforms: {
        arriba: { value: new THREE.Color() }, abajo: { value: new THREE.Color() }, neb1: { value: new THREE.Color() }, neb2: { value: new THREE.Color() },
        nebulosa: { value: 0 }, desplaz: { value: 0 }, aspecto: { value: 2 }, tiempo: { value: 0 }, horizonte: { value: 0 },
        tex: { value: new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1) },
      },
      vertexShader: CIELO_V,
      fragmentShader: CIELO_F,
      depthWrite: false,
      depthTest: false,
    });
    this.cielo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.matCielo);
    this.cielo.frustumCulled = false;
    this.cielo.renderOrder = -10;
    this.grupo.add(this.cielo);
    void texturaNebulosa(5).then((t) => {
      (this.matCielo.uniforms.tex.value as THREE.Texture).dispose();
      this.matCielo.uniforms.tex.value = t;
    });
    // Estrellas: lejos (muchas y chiquitas), en medio y cerca (pocas y grandes)
    for (const [n, z, tam, parallax] of [[700, -40, 0.22, 0.04], [320, -22, 0.2, 0.12], [90, -9, 0.16, 0.35]] as const) {
      const ancho = 2 * Math.tan(THREE.MathUtils.degToRad(25)) * (12 - z) * 2.6;
      const alto = 2 * Math.tan(THREE.MathUtils.degToRad(25)) * (12 - z) * 1.3;
      const pos = new Float32Array(n * 3), t = new Float32Array(n), f = new Float32Array(n), tono = new Float32Array(n * 3);
      const tonos = [c('#FFFFFF'), c('#FFF2D6'), c('#D6E6FF'), c('#FFE0F0'), c('#E8FFF6')];
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * ancho;
        pos[i * 3 + 1] = (Math.random() - 0.5) * alto;
        pos[i * 3 + 2] = z + (Math.random() - 0.5) * 3;
        t[i] = tam * (0.5 + Math.pow(Math.random(), 4) * 2.2);
        f[i] = Math.random();
        const k = tonos[Math.floor(Math.random() * tonos.length)];
        tono[i * 3] = k.r;
        tono[i * 3 + 1] = k.g;
        tono[i * 3 + 2] = k.b;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('tam', new THREE.BufferAttribute(t, 1));
      g.setAttribute('fase', new THREE.BufferAttribute(f, 1));
      g.setAttribute('tono', new THREE.BufferAttribute(tono, 3));
      const mat = new THREE.ShaderMaterial({
        uniforms: { desplaz: { value: 0 }, ancho: { value: ancho }, tiempo: { value: 0 }, escala: { value: 400 }, brillo: { value: 0 } },
        vertexShader: ESTRELLAS_V,
        fragmentShader: ESTRELLAS_F,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(g, mat);
      pts.frustumCulled = false;
      pts.renderOrder = -9;
      this.capas.push({ pts, mat, parallax });
      this.grupo.add(pts);
    }
    // El sol: un resplandor grande arriba a la izquierda (en el espacio)
    this.sol = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.halo, color: '#FFF1D0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.sol.scale.setScalar(26);
    this.sol.position.set(-30, 20, -45);
    this.sol.renderOrder = -8;
    this.grupo.add(this.sol);
    // Nubes del barrio: atrás (lentas) y adelante (rápidas y transparentes)
    const tex = [0, 1, 2].map((k) => texturaNube(k + 1));
    for (let k = 0; k < 16; k++) {
      const frente = k >= 12;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex[k % 3], transparent: true, depthWrite: false, opacity: frente ? 0.75 : 0.95, toneMapped: false }));
      const tam = frente ? 6 + Math.random() * 3 : 5 + Math.random() * 6;
      s.scale.set(tam, tam / 2, 1);
      // Las de adelante pasan por arriba y por abajo (nunca tapan al personaje)
      s.position.set((Math.random() - 0.5) * 60, frente ? yFrente() : (Math.random() - 0.5) * 16, frente ? 5 : -6 - Math.random() * 14);
      s.renderOrder = frente ? 8 : -7;
      this.nubes.push({ s, v: frente ? 1.6 : 0.35 + Math.random() * 0.3, frente });
      this.grupo.add(s);
    }
    // Polvo de velocidad: rayitas que pasan
    const N = 70;
    this.polvoPos = new Float32Array(N * 6);
    this.polvoDatos = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) this.reponerPolvo(i, true);
    const gp = new THREE.BufferGeometry();
    gp.setAttribute('position', new THREE.BufferAttribute(this.polvoPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.polvo = new THREE.LineSegments(gp, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.polvo.frustumCulled = false;
    this.polvo.renderOrder = -6;
    this.grupo.add(this.polvo);
    // Rocas lejanas del cinturón
    const NR = 46;
    this.rocas = new THREE.InstancedMesh(geometriaRoca, materialRoca, NR);
    this.rocasDatos = new Float32Array(NR * 6);
    for (let i = 0; i < NR; i++) {
      this.rocasDatos[i * 6] = (Math.random() - 0.5) * 70;
      this.rocasDatos[i * 6 + 1] = (Math.random() - 0.5) * 26;
      this.rocasDatos[i * 6 + 2] = -14 - Math.random() * 16;
      this.rocasDatos[i * 6 + 3] = 0.25 + Math.pow(Math.random(), 2) * 1.1;
      this.rocasDatos[i * 6 + 4] = Math.random() * 6;
      this.rocasDatos[i * 6 + 5] = 0.2 + Math.random() * 0.8;
    }
    this.rocas.frustumCulled = false;
    this.rocas.visible = false;
    this.grupo.add(this.rocas);
    // Luces
    this.luzSol.position.set(-6, 6, 8);
    this.grupo.add(this.luzSol, this.luzCielo);
    // Planetas: se pintan de a poquito mientras se juega (cada uno sale en su tramo)
    LOOKS.forEach((l, i) => {
      if (l.planeta) this.cuerpos.push(this.crearCuerpo(l.planeta, i));
    });
    void this.pintarPlanetas();
    this.aplicar(0, 0);
  }

  private crearCuerpo(planeta: Planeta, tramo: number): CuerpoCeleste {
    const grupo = new THREE.Group();
    const esTierra = planeta === 'tierra';
    const radio = esTierra ? 44 : planeta === 'jupiter' ? 9 : planeta === 'saturno' ? 6 : planeta === 'luna' ? 7 : 5.5;
    const esfera = new THREE.Mesh(new THREE.SphereGeometry(radio, 64, 40), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, metalness: 0 }));
    esfera.name = 'esfera';
    grupo.add(esfera);
    // Resplandor de atmósfera en el borde
    const colAtm = { tierra: '#4F9BFF', luna: '#B8B8D8', marte: '#FF9A6B', jupiter: '#FFD9A8', saturno: '#FFE6B0', neptuno: '#8FB8FF', corazon: '#FF8FC0' }[planeta];
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(radio * 1.06, 48, 32),
      new THREE.ShaderMaterial({
        uniforms: { color: { value: c(colAtm) }, fuerza: { value: esTierra ? 0.85 : planeta === 'luna' ? 0.3 : 0.7 } },
        vertexShader: RESPLANDOR_V,
        fragmentShader: RESPLANDOR_F,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    );
    grupo.add(atm);
    if (planeta === 'saturno') {
      const anillo = new THREE.Mesh(new THREE.RingGeometry(radio * 1.35, radio * 2.3, 96, 1), new THREE.MeshStandardMaterial({ map: texturaAnillo(), transparent: true, side: THREE.DoubleSide, roughness: 0.9, depthWrite: false }));
      // Coordenadas para que la tira del anillo vaya de adentro hacia afuera
      const pos = anillo.geometry.attributes.position, uv = anillo.geometry.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const r = Math.hypot(pos.getX(i), pos.getY(i));
        uv.setXY(i, (r - radio * 1.35) / (radio * 0.95), 0.5);
      }
      anillo.rotation.x = -1.2;
      anillo.rotation.y = 0.25;
      grupo.add(anillo);
    }
    if (esTierra) {
      grupo.position.set(0, -radio - 4.2, -14);
      // El polo mira a la cámara: arriba queda el ecuador y al girar en z pasan los continentes
      esfera.rotation.x = Math.PI / 2 - 0.25;
    } else {
      grupo.position.set(60, 4 + Math.random() * 4, -38);
      grupo.rotation.z = 0.25;
    }
    grupo.visible = false;
    this.grupo.add(grupo);
    const cuerpo = { grupo, planeta, tramo, listo: false, radio };
    if (esTierra) this.tierra = cuerpo;
    return cuerpo;
  }

  private async pintarPlanetas() {
    for (const k of this.cuerpos) {
      const t = await texturaPlaneta(k.planeta, k.planeta === 'tierra' ? 512 : 256, k.planeta === 'tierra' ? 256 : 128);
      const esfera = k.grupo.getObjectByName('esfera') as THREE.Mesh;
      const m = esfera.material as THREE.MeshStandardMaterial;
      m.map = t;
      m.needsUpdate = true;
      k.listo = true;
    }
  }

  private reponerPolvo(i: number, inicio = false) {
    const d = this.polvoDatos;
    d[i * 4] = inicio ? (Math.random() - 0.5) * 30 : 15 + Math.random() * 10;
    d[i * 4 + 1] = (Math.random() - 0.5) * 13;
    d[i * 4 + 2] = -4 + Math.random() * 8;
    d[i * 4 + 3] = 0.6 + Math.random() * 1.2;
  }

  /** Tamaño de la pantalla (para las estrellas y el cielo). */
  ajustar(altoPx: number) {
    const e = altoPx / (2 * Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2)));
    for (const k of this.capas) k.mat.uniforms.escala.value = e;
    this.matCielo.uniforms.aspecto.value = this.camara.aspect;
  }

  /** Calidad baja: menos estrellas y sin polvo ni rocas lejanas. */
  bajar() {
    this.bajo = true;
    this.capas[0].pts.geometry.setDrawRange(0, 350);
    this.polvo.geometry.setDrawRange(0, 70);
  }

  /** Mezcla los looks de dos tramos (k de 0 a 1). */
  private aplicar(i: number, k: number) {
    const a = this.looks[i], b = this.looks[Math.min(i + 1, this.looks.length - 1)];
    const u = this.matCielo.uniforms;
    (u.arriba.value as THREE.Color).copy(a.cArriba).lerp(b.cArriba, k);
    (u.abajo.value as THREE.Color).copy(a.cAbajo).lerp(b.cAbajo, k);
    (u.neb1.value as THREE.Color).copy(a.cNeb1).lerp(b.cNeb1, k);
    (u.neb2.value as THREE.Color).copy(a.cNeb2).lerp(b.cNeb2, k);
    u.nebulosa.value = mezcla(a.nebulosa, b.nebulosa, k);
    const estrellas = mezcla(a.estrellas, b.estrellas, k);
    for (const capa of this.capas) capa.mat.uniforms.brillo.value = estrellas;
    const nubes = mezcla(a.nubes, b.nubes, k);
    this.nubesFactor = nubes;
    for (const n of this.nubes) {
      n.s.visible = nubes > 0.01;
      (n.s.material as THREE.SpriteMaterial).opacity = nubes * (n.frente ? 0.55 : 0.95);
    }
    this.luzSol.color.copy(a.cSol).lerp(b.cSol, k);
    this.luzSol.intensity = mezcla(a.solFuerza, b.solFuerza, k);
    this.luzCielo.color.copy(a.cCielo).lerp(b.cCielo, k);
    this.luzCielo.groundColor.copy(a.cSuelo).lerp(b.cSuelo, k);
    (this.sol.material as THREE.SpriteMaterial).opacity = 0.55 * estrellas;
    const rocas = mezcla(a.rocas, b.rocas, k);
    this.rocas.visible = rocas > 0.02 && !this.bajo;
    this.rocas.count = Math.round(this.rocasDatos.length / 6 * rocas);
    const lm = this.polvo.material as THREE.LineBasicMaterial;
    lm.color.copy(a.cPolvo).lerp(b.cPolvo, k);
  }

  /**
   * Avanza el fondo. `avance` es lo que corrió el mundo en este cuadro (unidades), `metros` la distancia del vuelo
   * (para el tramo) y `turbo` (0..1) estira el polvo de velocidad.
   */
  actualizar(dt: number, avance: number, metros: number, turbo: number) {
    this.t += dt;
    this.desplaz += avance;
    // Tramo y mezcla: se pasa de uno al otro en los 200 m antes de que empiece
    let i = 0;
    while (i + 1 < TRAMOS.length && metros >= TRAMOS[i + 1].desde - 200) i++;
    let k = 0;
    if (i > 0 && metros < TRAMOS[i].desde) {
      k = Math.max(0, Math.min(1, 1 - (TRAMOS[i].desde - metros) / 200));
      i--;
    }
    this.tramo = i;
    this.mezcla = k;
    this.aplicar(i, k);
    const u = this.matCielo.uniforms;
    u.desplaz.value = this.desplaz * 0.0035;
    u.tiempo.value = this.t;
    for (const capa of this.capas) {
      capa.mat.uniforms.desplaz.value = this.desplaz * capa.parallax;
      capa.mat.uniforms.tiempo.value = this.t;
    }
    // Nubes: van a la izquierda (o bajan durante el despegue)
    for (const n of this.nubes) {
      if (!n.s.visible) continue;
      const s = n.s;
      s.position.x -= avance * n.v * (1 - this.subiendo);
      s.position.y -= dt * 14 * n.v * this.subiendo;
      if (s.position.x < -34) {
        s.position.x = 34 + Math.random() * 10;
        s.position.y = n.frente ? yFrente() : (Math.random() - 0.5) * 16;
      }
      if (s.position.y < -14) {
        s.position.y = 14 + Math.random() * 6;
        s.position.x = (Math.random() - 0.5) * 50;
      }
      // Las de adelante se desvanecen si pasan por la franja del personaje (después del despegue)
      if (n.frente) (s.material as THREE.SpriteMaterial).opacity = this.nubesFactor * 0.55 * Math.min(1, Math.max(this.subiendo, (Math.abs(s.position.y) - 3.2) / 1.5));
    }
    // Polvo de velocidad
    const largo = 0.15 + Math.min(4, avance / Math.max(dt, 1e-3) * 0.02) + turbo * 2.6;
    const d = this.polvoDatos, p = this.polvoPos;
    const n = d.length / 4;
    for (let j = 0; j < n; j++) {
      d[j * 4] -= avance * d[j * 4 + 3] * 1.4;
      if (d[j * 4] < -18) this.reponerPolvo(j);
      const x = d[j * 4], y = d[j * 4 + 1], z = d[j * 4 + 2];
      p[j * 6] = x;
      p[j * 6 + 1] = y;
      p[j * 6 + 2] = z;
      p[j * 6 + 3] = x + largo * d[j * 4 + 3];
      p[j * 6 + 4] = y;
      p[j * 6 + 5] = z;
    }
    (this.polvo.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.polvo.material as THREE.LineBasicMaterial).opacity = Math.min(0.55, 0.12 + turbo * 0.45) * (this.looks[i].nubes > 0.5 && k < 0.5 ? 0.6 : 1);
    // Rocas lejanas
    if (this.rocas.visible) {
      const r = this.rocasDatos;
      for (let j = 0; j < this.rocas.count; j++) {
        r[j * 6] -= avance * (0.25 + r[j * 6 + 5] * 0.2);
        if (r[j * 6] < -40) r[j * 6] = 40 + Math.random() * 10;
        r[j * 6 + 4] += dt * r[j * 6 + 5];
        this.dummy.position.set(r[j * 6], r[j * 6 + 1], r[j * 6 + 2]);
        this.dummy.rotation.set(r[j * 6 + 4], r[j * 6 + 4] * 0.7, 0);
        this.dummy.scale.setScalar(r[j * 6 + 3]);
        this.dummy.updateMatrix();
        this.rocas.setMatrixAt(j, this.dummy.matrix);
      }
      this.rocas.instanceMatrix.needsUpdate = true;
    }
    // Planetas: el de cada tramo cruza despacito; la Tierra se queda abajo girando en la órbita
    const tramoReal = i + (k > 0.5 ? 1 : 0);
    for (const cuerpo of this.cuerpos) {
      const g = cuerpo.grupo;
      if (cuerpo === this.tierra) {
        // Sube por debajo al salir del cielo y se va hundiendo al llegar a la Luna
        const ver = i === 0 ? k : i === 1 ? 1 - Math.max(0, k - 0.2) * 1.25 : 0;
        g.visible = cuerpo.listo && ver > 0.01;
        g.position.y = -cuerpo.radio - 4.2 - (1 - ver) * 14;
        g.rotation.z += avance * 0.0022;
        u.horizonte.value = ver;
        continue;
      }
      const activo = tramoReal === cuerpo.tramo || (tramoReal === cuerpo.tramo - 1 && k > 0.3);
      if (!g.visible && activo && cuerpo.listo) {
        g.visible = true;
        g.position.x = 46 + cuerpo.radio;
        g.position.y = 2 + Math.random() * 5;
      }
      if (g.visible) {
        g.position.x -= avance * 0.05;
        const esf = g.getObjectByName('esfera');
        if (esf) esf.rotation.y += dt * 0.04;
        if (g.position.x < -60 - cuerpo.radio * 2) g.visible = false;
      }
    }
  }

  liberar() {
    this.grupo.traverse((o) => {
      const m = o as THREE.Mesh;
      if (o === this.rocas) return;
      if (m.geometry) m.geometry.dispose();
      const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
      for (const mt of mats) {
        for (const v of Object.values(mt)) if (v instanceof THREE.Texture) v.dispose();
        if ((mt as THREE.ShaderMaterial).uniforms) for (const u of Object.values((mt as THREE.ShaderMaterial).uniforms)) if (u.value instanceof THREE.Texture) u.value.dispose();
        mt.dispose();
      }
    });
    this.halo.dispose();
  }
}
