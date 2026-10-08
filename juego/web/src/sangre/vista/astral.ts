// La visión astral: con un botón el mundo se vuelve gris azulado (lo hace cada material con `uAstral`, ver luz.ts) y
// lo que importa brilla en su color por encima de todo, hasta detrás de las paredes: las vetas (hierro, oro, sangre,
// huevos), el botín del piso (cofres, equipo, llaves, frascos, comida), lo que se abre o se libera (santuarios,
// cofres de reliquias y malditos, prisioneros), el objetivo (altares, carreta, campana que se defiende, el élite
// marcado) y la Campana de Extracción. Fuera de la visión astral nada se señala en el mapa salvo la campana.
import * as THREE from 'three';
import { C, MINERALES_ORDEN } from '../tipos';
import { MINERALES } from '../datos/minerales';
import { TIPOS, TIPO_ALTAR } from '../sim/catalogo';
import { ENT, REC, esMineral } from '../sim/estado';
import type { EstadoVista } from './escena';
import { UNI_LUZ } from './luz';

/** Hasta dónde alcanza la visión (m). */
export const RADIO_ASTRAL = 20;
const MAX = 700;

/** Qué brilla y de qué color (también la leyenda del HUD). */
export const COLOR_ASTRAL = {
  hierro: '#9cc4ee',
  oro: '#ffd34a',
  sangre: '#ff3a3a',
  huevo: '#7ad06a',
  mineral: '#c8e8ff',
  botin: '#ffb04a',
  santo: '#a8c8ff',
  reliquia: '#c890ff',
  objetivo: '#ff4a4a',
  prisionero: '#f0e4c8',
  campana: '#ffe8a0',
} as const;
const COL = Object.fromEntries(Object.entries(COLOR_ASTRAL).map(([k, v]) => [k, new THREE.Color(v)])) as Record<keyof typeof COLOR_ASTRAL, THREE.Color>;
/** Cada mineral brilla de su color (en el orden de MINERALES_ORDEN). */
const COL_MINERAL = MINERALES_ORDEN.map((id) => new THREE.Color(MINERALES[id].brillo));

const VERT = /* glsl */ `
  varying vec2 vUv; varying vec3 vCol; varying float vFase;
  void main() {
    vUv = uv;
    vCol = instanceColor;
    vFase = fract( sin( dot( instanceMatrix[3].xz, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
  }
`;
/** Las vetas: un cristal en rombo con sus caras (una más clara) que late, para que se lea como mineral. */
const FRAG_VETA = /* glsl */ `
  uniform float uTiempo; uniform float uFuerza;
  varying vec2 vUv; varying vec3 vCol; varying float vFase;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = abs( p.x ) + abs( p.y );
    if ( d > 1.0 ) discard;
    float pulso = 0.75 + 0.25 * sin( uTiempo * 3.5 + vFase * 6.2831 );
    float cuerpo = smoothstep( 0.82, 0.7, d );
    float filo = smoothstep( 0.06, 0.0, abs( d - 0.76 ) );
    float cara = p.x + p.y < 0.0 ? 1.0 : 0.62;
    float brillo = smoothstep( 0.5, 0.0, length( p + vec2( 0.18, 0.2 ) ) );
    float halo = smoothstep( 1.0, 0.75, d ) * 0.3;
    float alfa = ( cuerpo * 0.55 * cara + filo * 0.9 + brillo * 0.7 + halo ) * pulso * uFuerza;
    gl_FragColor = vec4( mix( vCol, vec3( 1.0 ), brillo * 0.55 ) * 1.5, alfa );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const FRAG = /* glsl */ `
  uniform float uTiempo; uniform float uFuerza;
  varying vec2 vUv; varying vec3 vCol; varying float vFase;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length( p );
    if ( r > 1.0 ) discard;
    float pulso = 0.78 + 0.22 * sin( uTiempo * 4.0 + vFase * 6.2831 );
    float nucleo = smoothstep( 0.42, 0.0, r );
    float halo = smoothstep( 1.0, 0.15, r ) * 0.4;
    float aro = smoothstep( 0.07, 0.0, abs( r - 0.8 - 0.06 * sin( uTiempo * 3.0 + vFase * 6.2831 ) ) ) * 0.75;
    float alfa = ( nucleo + halo + aro ) * pulso * uFuerza;
    gl_FragColor = vec4( mix( vCol, vec3( 1.0 ), nucleo * 0.45 ) * 1.6, alfa );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const P = new THREE.Vector3();
const S = new THREE.Vector3();

export class VisionAstral {
  readonly grupo = new THREE.Group();
  /** ¿La pidió el jugador? (la transición la lleva `f`) */
  activa = false;
  /** 0 normal, 1 visión astral completa. */
  private f = 0;
  private marcas: THREE.InstancedMesh;
  private vetas: THREE.InstancedMesh;
  private mat: THREE.ShaderMaterial;
  private matVeta: THREE.ShaderMaterial;
  private buscarT = 0;

  constructor(tiempo: { value: number }) {
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uTiempo: tiempo, uFuerza: { value: 0 } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      // (por encima de todo: se ve aunque una pared o el techo lo tape)
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    this.matVeta = this.mat.clone();
    this.matVeta.fragmentShader = FRAG_VETA;
    // (las dos comparten el reloj y la fuerza)
    this.matVeta.uniforms = this.mat.uniforms;
    const geo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    const hacer = (mat: THREE.ShaderMaterial) => {
      const m = new THREE.InstancedMesh(geo, mat, MAX);
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
      m.count = 0;
      m.frustumCulled = false;
      m.renderOrder = 20;
      this.grupo.add(m);
      return m;
    };
    this.vetas = hacer(this.matVeta);
    this.marcas = hacer(this.mat);
  }

  /** Cuánto se ve la visión astral (0-1), para el HUD. */
  get fuerza() {
    return this.f;
  }

  actualizar(dt: number, est: EstadoVista, local: number) {
    const meta = this.activa ? 1 : 0;
    this.f += Math.sign(meta - this.f) * Math.min(Math.abs(meta - this.f), dt * 3.5);
    UNI_LUZ.uAstral.value = this.f;
    this.mat.uniforms.uFuerza.value = this.f;
    this.grupo.visible = this.f > 0.01;
    if (!this.grupo.visible) return;
    this.buscarT -= dt;
    if (this.buscarT > 0) return;
    this.buscarT = 0.25;
    this.buscar(est, local);
  }

  /** Arma las marcas de lo que hay alrededor del jugador. */
  private buscar(est: EstadoVista, local: number) {
    const j = est.J[local] ?? est.J[0];
    if (!j) return;
    let n = 0, nv = 0;
    const poner = (x: number, y: number, alto: number, tam: number, c: THREE.Color, veta = false) => {
      const malla = veta ? this.vetas : this.marcas;
      const k = veta ? nv : n;
      if (k >= MAX) return;
      P.set(x, alto, y);
      S.set(tam, 1, tam);
      M.compose(P, Q, S);
      malla.setMatrixAt(k, M);
      malla.setColorAt(k, c);
      if (veta) nv++;
      else n++;
    };
    const R = RADIO_ASTRAL, R2 = R * R;
    const cerca = (x: number, y: number) => (x - j.x) ** 2 + (y - j.y) ** 2 < R2;
    // Lo importante primero (si hay demasiadas vetas, que no se queden por fuera)
    if (est.campana && est.campana.est < 2) poner(est.campana.x, est.campana.y, 0.2, 1.7, COL.campana);
    for (const e of est.ent) {
      if (!e.vivo || !cerca(e.x, e.y)) continue;
      if (e.tipo === ENT.SANTUARIO && e.est === 0) poner(e.x, e.y, 0.2, 1.15, COL.santo);
      else if ((e.tipo === ENT.COFRE_RELIQUIA || e.tipo === ENT.COFRE_MALDITO) && e.est === 0) poner(e.x, e.y, 0.2, 1, COL.reliquia);
      else if (e.tipo === ENT.PRISIONERO && e.est === 0) poner(e.x, e.y, 0.2, 1, COL.prisionero);
      else if ((e.tipo === ENT.CARRETA || e.tipo === ENT.CAMPANA_DEF) && e.est === 1) poner(e.x, e.y, 0.2, 1.3, COL.objetivo);
      else if (e.tipo === ENT.SEPULCRO && e.est === 0) poner(e.x, e.y, 0.2, 1.4, COL.objetivo);
      else if (e.tipo === ENT.SUMINISTRO && e.est <= 2) poner(e.x, e.y, 0.2, 2.2, COL.reliquia);
    }
    const E = est.E;
    for (let i = 0; i < E.max; i++) {
      if (!E.vivo[i] || !cerca(E.x[i], E.y[i])) continue;
      // (los bichos del botín brillan como el botín)
      if (TIPOS[E.tipo[i]]?.conducta === 'ladron') poner(E.x[i], E.y[i], 0.2, 0.9, COL.botin);
      else if (E.tipo[i] === TIPO_ALTAR || E.marcadoObj[i] === 1 || E.marcadoObj[i] >= 3) poner(E.x[i], E.y[i], 0.2, 1.1, COL.objetivo);
    }
    for (const r of est.R) {
      if (!r.vivo || r.hacia >= 0 || !cerca(r.x, r.y)) continue;
      const t = r.tipo;
      if (t === REC.COFRE || t === REC.EQUIPO || t === REC.LLAVE || t === REC.IMAN) poner(r.x, r.y, 0.15, 0.75, COL.botin);
      else if (t === REC.FRASCO || t === REC.ROSA || t === REC.PLUMA || t === REC.HONGO) poner(r.x, r.y, 0.15, 0.6, COL.reliquia);
      else if (t === REC.HUEVO) poner(r.x, r.y, 0.15, 0.6, COL.huevo);
      else if (t === REC.COMIDA) poner(r.x, r.y, 0.15, 0.5, COL.huevo);
      else if (t === REC.ORO && r.valor >= 5) poner(r.x, r.y, 0.15, 0.45, COL.oro);
      else if (esMineral(t)) poner(r.x, r.y, 0.15, 0.5, COL_MINERAL[t - REC.MINERAL]);
    }
    // Las vetas en las paredes (encima de la roca)
    const m = est.mapa;
    const x0 = Math.max(0, Math.floor(j.x - R)), x1 = Math.min(m.w - 1, Math.ceil(j.x + R));
    const y0 = Math.max(0, Math.floor(j.y - R)), y1 = Math.min(m.h - 1, Math.ceil(j.y + R));
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const c = m.c[cy * m.w + cx];
        const col = c === C.HIERRO ? COL.hierro : c === C.ORO ? COL.oro : c === C.SANGRE ? COL.sangre : c === C.HUEVO ? COL.huevo : c === C.MINERAL ? COL_MINERAL[m.v[cy * m.w + cx] % 6] : null;
        if (!col || !cerca(cx + 0.5, cy + 0.5)) continue;
        poner(cx + 0.5, cy + 0.5, 1.2, 0.42, col, true);
      }
    for (const [malla, cuantas] of [[this.marcas, n], [this.vetas, nv]] as const) {
      malla.count = cuantas;
      malla.instanceMatrix.needsUpdate = true;
      if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
    }
  }

  liberar() {
    UNI_LUZ.uAstral.value = 0;
    this.marcas.geometry.dispose();
    this.mat.dispose();
    this.matVeta.dispose();
  }
}
