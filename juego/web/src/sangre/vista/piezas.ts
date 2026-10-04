// Enemigos, jefes y aliados dibujados con instancias por piezas: cada modelo se arma con sus piezas (cuerpo, cabeza,
// brazos, piernas, alas, cola, mandíbula, extras), cada pieza con su punto de giro en la articulación. Todo el modelo
// queda en una sola geometría con un atributo «pieza», y el sombreador anima cada pieza (caminar, atacar, aletear,
// morir desintegrándose, destellar al recibir un golpe) con los datos de cada instancia. Así cientos de muertos
// vivientes cuestan unas pocas llamadas de dibujo.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { conLuz } from './luz';

export const PIEZAS = ['cuerpo', 'cabeza', 'brazo_izq', 'brazo_der', 'pierna_izq', 'pierna_der', 'ala_izq', 'ala_der', 'cola', 'mandibula', 'extra_capa', 'extra_alas'] as const;
export const PIEZA: Record<string, number> = Object.fromEntries(PIEZAS.map((p, i) => [p, i]));

/** Índice de pieza según el nombre de un nodo del modelo (los extra_* que no se conocen van como capa). */
export function piezaDeNombre(n: string): number {
  const limpio = n.toLowerCase().replace(/\.\d+$/, '');
  for (const p of PIEZAS) if (limpio === p || limpio.startsWith(p + '_') || limpio.endsWith('_' + p)) return PIEZA[p];
  if (limpio.startsWith('extra')) return limpio.includes('ala') ? PIEZA.extra_alas : PIEZA.extra_capa;
  if (limpio.includes('cabeza')) return PIEZA.cabeza;
  return -1;
}

export interface ModeloPiezas {
  geo: THREE.BufferGeometry;
  mats: THREE.Material[];
  piv: THREE.Vector3[];
  alto: number;
  /** Amplitudes del movimiento: piernas, brazos, rebote, aleteo. */
  mov: THREE.Vector4;
}

/** Una pieza suelta (para armar los modelos de reemplazo). */
export interface PiezaSuelta {
  pieza: number;
  geo: THREE.BufferGeometry;
  /** Clave del material (colores iguales comparten material). */
  mat: string;
}

// ------------------------------------------------------------------------------------------------- Sombreador
const UNIF_COMUNES = {
  uRim: { value: new THREE.Color('#5a7aa8') },
};

/** El material de las piezas (MeshStandard con la animación por piezas, la desintegración y el destello). */
export function materialPiezas(base: THREE.MeshStandardMaterial, piv: THREE.Vector3[], mov: THREE.Vector4): THREE.MeshStandardMaterial {
  const uPiv = { value: piv };
  const uMov = { value: mov };
  return conLuz(base, (s) => {
    s.uniforms.uPiv = uPiv;
    s.uniforms.uMov = uMov;
    s.uniforms.uRim = UNIF_COMUNES.uRim;
    s.vertexShader = s.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
attribute float aPieza;
attribute vec4 iAnim;
attribute vec4 iTinte;
attribute vec4 iExtra;
uniform vec3 uPiv[12];
uniform vec4 uMov;
varying vec4 vTinte;
varying vec2 vMuerteGolpe;
varying vec3 vLocal;
varying float vTransp;
mat3 rotX( float a ) { float c = cos( a ), s = sin( a ); return mat3( 1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c ); }
mat3 rotY( float a ) { float c = cos( a ), s = sin( a ); return mat3( c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c ); }
mat3 rotZ( float a ) { float c = cos( a ), s = sin( a ); return mat3( c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0 ); }
`,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
{
  int p = int( aPieza + 0.5 );
  vec3 piv = uPiv[ p ];
  float fase = iAnim.x;
  float atq = iAnim.y;
  float paso = sin( fase * 3.14159 );
  vec3 q = transformed - piv;
  if ( p == 4 ) q = rotX( paso * 0.65 * uMov.x ) * q;
  else if ( p == 5 ) q = rotX( -paso * 0.65 * uMov.x ) * q;
  else if ( p == 2 ) q = rotX( -paso * 0.5 * uMov.y + atq * 1.5 ) * rotZ( -atq * 0.25 ) * q;
  else if ( p == 3 ) q = rotX( paso * 0.5 * uMov.y + atq * 1.5 ) * rotZ( atq * 0.25 ) * q;
  else if ( p == 1 ) q = rotX( atq * 0.3 + sin( fase * 6.283 ) * 0.05 ) * rotZ( sin( fase * 1.7 ) * 0.06 ) * q;
  else if ( p == 9 ) q = rotX( atq * 0.6 + abs( sin( fase * 4.0 ) ) * 0.12 ) * q;
  else if ( p == 6 ) q = rotZ( sin( fase * 5.0 * uMov.w + 1.0 ) * 0.85 ) * q;
  else if ( p == 7 ) q = rotZ( -sin( fase * 5.0 * uMov.w + 1.0 ) * 0.85 ) * q;
  else if ( p == 8 ) q = rotY( sin( fase * 2.0 ) * 0.45 ) * q;
  else if ( p == 10 ) q = rotX( -abs( paso ) * 0.12 - atq * 0.1 ) * q;
  else if ( p == 11 ) q = rotZ( sin( fase * 3.0 ) * 0.15 ) * q;
  transformed = q + piv;
  // Todo el cuerpo: rebote al caminar y se inclina al atacar
  transformed.y += abs( paso ) * 0.06 * uMov.z;
  transformed = rotX( atq * 0.28 ) * transformed;
  // Aturdido: tambalea
  transformed = rotZ( iExtra.z * sin( fase * 9.0 ) * 0.25 ) * transformed;
  // Muerte: se va de espaldas y se hunde
  float m = iAnim.w;
  transformed = rotX( -m * 0.9 ) * transformed;
  transformed.y -= m * m * 0.35;
  // Altura (vuela, sale de la tierra)
  transformed.y += iExtra.x;
  vLocal = position;
  vTinte = iTinte;
  vMuerteGolpe = vec2( m, iAnim.z );
  vTransp = iExtra.w;
}
`,
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
varying vec4 vTinte;
varying vec2 vMuerteGolpe;
varying vec3 vLocal;
varying float vTransp;
uniform vec3 uRim;
float hashP( vec3 p ) { p = fract( p * 0.3183099 + 0.1 ); p *= 17.0; return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) ); }
float ruidoP( vec3 x ) {
  vec3 i = floor( x ), f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mix( hashP( i ), hashP( i + vec3( 1, 0, 0 ) ), f.x ), mix( hashP( i + vec3( 0, 1, 0 ) ), hashP( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
              mix( mix( hashP( i + vec3( 0, 0, 1 ) ), hashP( i + vec3( 1, 0, 1 ) ), f.x ), mix( hashP( i + vec3( 0, 1, 1 ) ), hashP( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}
`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        /* glsl */ `#include <clipping_planes_fragment>
float nDis = ruidoP( vLocal * 9.0 ) * 0.7 + ruidoP( vLocal * 23.0 ) * 0.3;
if ( vMuerteGolpe.x > 0.0 && nDis < vMuerteGolpe.x * 1.05 ) discard;
if ( vTransp > 0.0 && hashP( floor( gl_FragCoord.xyz * 0.5 ) ) < vTransp ) discard;
`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
// Borde que arde al desintegrarse
if ( vMuerteGolpe.x > 0.0 && nDis < vMuerteGolpe.x * 1.05 + 0.09 ) totalEmissiveRadiance += vec3( 1.6, 0.45, 0.12 ) * 2.2;
// Destello del golpe (blanco caliente)
totalEmissiveRadiance += vec3( 1.0, 0.92, 0.85 ) * vMuerteGolpe.y * 0.9;
// Brillo de élite, encantado o aliado (late)
totalEmissiveRadiance += vTinte.rgb * vTinte.a * ( 0.55 + 0.45 * sin( uTiempo * 5.0 + vLocal.y * 3.0 ) );
`,
      )
      .replace(
        '#include <lights_fragment_end>',
        /* glsl */ `#include <lights_fragment_end>
// Contraluz frío: la silueta se lee aunque esté oscuro
{
  float rim = 1.0 - clamp( dot( normalize( normal ), normalize( vViewPosition ) ), 0.0, 1.0 );
  reflectedLight.indirectDiffuse += uRim * pow( rim, 2.5 ) * 0.9;
}
`,
      );
  }, '-piezas');
}

/** Cambia el color del contraluz (según el bioma). */
export function colorContraluz(c: THREE.ColorRepresentation) {
  UNIF_COMUNES.uRim.value.set(c);
}

// ------------------------------------------------------------------------------------------------- Armar modelos
/** Junta las piezas sueltas en una geometría con grupos por material. */
export function modeloDePiezas(piezas: PiezaSuelta[], pivotes: Partial<Record<number, THREE.Vector3>>, mats: Record<string, THREE.MeshStandardMaterial>, mov = new THREE.Vector4(1, 1, 1, 1)): ModeloPiezas {
  const porMat = new Map<string, THREE.BufferGeometry[]>();
  for (const p of piezas) {
    const g = normalizarGeo(p.geo);
    const n = g.getAttribute('position').count;
    g.setAttribute('aPieza', new THREE.BufferAttribute(new Float32Array(n).fill(p.pieza), 1));
    const l = porMat.get(p.mat) ?? [];
    l.push(g);
    porMat.set(p.mat, l);
  }
  const claves = [...porMat.keys()];
  const juntas = claves.map((k) => mergeGeometries(porMat.get(k)!, false)!);
  const geo = mergeGeometries(juntas, true)!;
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  const piv = PIEZAS.map((_, i) => pivotes[i]?.clone() ?? new THREE.Vector3());
  const alto = geo.boundingBox ? geo.boundingBox.max.y : 1;
  const materiales = claves.map((k) => materialPiezas(mats[k].clone(), piv, mov));
  for (const g of juntas) g.dispose();
  return { geo, mats: materiales, piv, alto, mov };
}

/** Deja la geometría con los mismos atributos (posición, normal, uv) y sin índice para poder unirla. */
function normalizarGeo(g0: THREE.BufferGeometry): THREE.BufferGeometry {
  let g = g0.index ? g0.toNonIndexed() : g0.clone();
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
  for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
  g.morphAttributes = {};
  g = g;
  return g;
}

/** Arma un modelo de piezas desde un nodo de un GLB (enemigo_<id> con hijos cuerpo, cabeza…). */
export function modeloDeNodo(nodo: THREE.Object3D, mov?: THREE.Vector4): ModeloPiezas | null {
  nodo.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(nodo.matrixWorld).invert();
  const piezas: PiezaSuelta[] = [];
  const pivotes: Partial<Record<number, THREE.Vector3>> = {};
  const mats: Record<string, THREE.MeshStandardMaterial> = {};
  // La pieza de cada malla: el primer antepasado (hijo directo del nodo) con nombre de pieza
  const piezaDe = (o: THREE.Object3D): { p: number; raiz: THREE.Object3D } => {
    let x: THREE.Object3D | null = o;
    while (x && x.parent !== nodo) x = x.parent;
    const raiz = x ?? o;
    const p = piezaDeNombre(raiz.name);
    return { p: p < 0 ? 0 : p, raiz };
  };
  nodo.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const { p, raiz } = piezaDe(m);
    if (pivotes[p] === undefined) pivotes[p] = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(inv, raiz.matrixWorld));
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
    const clave = mat.uuid;
    mats[clave] = mat;
    const g = m.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    piezas.push({ pieza: p, geo: g, mat: clave });
  });
  if (!piezas.length) return null;
  return modeloDePiezas(piezas, pivotes, mats, mov);
}

// ------------------------------------------------------------------------------------------------- Lotes de instancias
const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const V = new THREE.Vector3();
const ESC = new THREE.Vector3();
const EJE_Y = new THREE.Vector3(0, 1, 0);

/** Las instancias de un tipo de modelo (crece solo si hacen falta más). */
export class LotePiezas {
  malla: THREE.InstancedMesh;
  private cap: number;
  private anim: THREE.InstancedBufferAttribute;
  private tinte: THREE.InstancedBufferAttribute;
  private extra: THREE.InstancedBufferAttribute;
  n = 0;

  constructor(public modelo: ModeloPiezas, private padre: THREE.Object3D, cap = 32, private sombra = false) {
    this.cap = cap;
    this.malla = this.crear(cap);
    this.anim = this.malla.geometry.getAttribute('iAnim') as THREE.InstancedBufferAttribute;
    this.tinte = this.malla.geometry.getAttribute('iTinte') as THREE.InstancedBufferAttribute;
    this.extra = this.malla.geometry.getAttribute('iExtra') as THREE.InstancedBufferAttribute;
  }

  private crear(cap: number) {
    const geo = this.modelo.geo.clone();
    geo.setAttribute('iAnim', new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4));
    geo.setAttribute('iTinte', new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4));
    geo.setAttribute('iExtra', new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4));
    for (const n of ['iAnim', 'iTinte', 'iExtra']) (geo.getAttribute(n) as THREE.InstancedBufferAttribute).setUsage(THREE.DynamicDrawUsage);
    const m = new THREE.InstancedMesh(geo, this.modelo.mats, cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    m.castShadow = this.sombra;
    m.receiveShadow = false;
    m.count = 0;
    this.padre.add(m);
    return m;
  }

  empezar() {
    this.n = 0;
  }

  /** Agrega una instancia. rot = hacia dónde mira (como en la simulación: atan2(dx, dy)). */
  poner(x: number, y: number, rot: number, esc: number, fase: number, atq: number, golpe: number, muerte: number, alt: number, tr = 0, tg = 0, tb = 0, ta = 0, aturdido = 0, transp = 0) {
    if (this.n >= this.cap) this.crecer();
    const k = this.n++;
    Q.setFromAxisAngle(EJE_Y, rot + Math.PI);
    ESC.setScalar(esc);
    V.set(x, 0, y);
    M.compose(V, Q, ESC);
    this.malla.setMatrixAt(k, M);
    this.anim.setXYZW(k, fase, atq, golpe, muerte);
    this.tinte.setXYZW(k, tr, tg, tb, ta);
    this.extra.setXYZW(k, alt / Math.max(0.01, esc), esc, aturdido, transp);
  }

  terminar() {
    const m = this.malla;
    m.count = this.n;
    if (this.n) {
      m.instanceMatrix.needsUpdate = true;
      this.anim.needsUpdate = true;
      this.tinte.needsUpdate = true;
      this.extra.needsUpdate = true;
    }
  }

  private crecer() {
    const nueva = this.cap * 2;
    const vieja = this.malla;
    const m = this.crear(nueva);
    // Copiar lo que ya había en este cuadro
    for (let k = 0; k < this.n; k++) {
      vieja.getMatrixAt(k, M);
      m.setMatrixAt(k, M);
    }
    for (const n of ['iAnim', 'iTinte', 'iExtra']) {
      const a = vieja.geometry.getAttribute(n) as THREE.InstancedBufferAttribute;
      const b = m.geometry.getAttribute(n) as THREE.InstancedBufferAttribute;
      (b.array as Float32Array).set((a.array as Float32Array).subarray(0, this.n * 4));
    }
    this.padre.remove(vieja);
    vieja.geometry.dispose();
    vieja.dispose();
    this.malla = m;
    this.cap = nueva;
    this.anim = m.geometry.getAttribute('iAnim') as THREE.InstancedBufferAttribute;
    this.tinte = m.geometry.getAttribute('iTinte') as THREE.InstancedBufferAttribute;
    this.extra = m.geometry.getAttribute('iExtra') as THREE.InstancedBufferAttribute;
  }

  liberar() {
    this.padre.remove(this.malla);
    this.malla.geometry.dispose();
    this.malla.dispose();
  }
}
