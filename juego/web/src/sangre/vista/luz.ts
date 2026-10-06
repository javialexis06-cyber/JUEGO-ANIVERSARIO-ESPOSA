// La luz de las cuevas: una rejilla (un texel por celda) que guarda cuánta luz llega a cada celda desde las
// antorchas, las velas, las vetas de sangre, la lava, la campana y los jugadores. La luz se propaga por las celdas
// abiertas (las paredes la tapan) y se lee en todos los materiales con un pedacito de sombreador, con parpadeo.
// Así hay decenas de luces sin que el celular sufra: solo la del jugador propio es una luz de verdad.
import * as THREE from 'three';
import { C, tapaLuz } from '../tipos';
import type { Mapa } from '../sim/mapa';

export interface FuenteLuz {
  x: number;
  y: number;
  r: number;
  color: THREE.Color;
  fuerza: number;
}

/** Uniformes compartidos por todos los materiales que leen la rejilla. */
export const UNI_LUZ = {
  uLuzMapa: { value: null as THREE.Texture | null },
  uLuzTam: { value: new THREE.Vector2(1, 1) },
  uLuzFuerza: { value: 3.2 },
  uTiempo: { value: 0 },
  /** 0 = normal, 1 = eclipse (todo más oscuro). */
  uOscuro: { value: 0 },
  uAmbiente: { value: new THREE.Color('#202838') },
  /** 0 = normal, 1 = visión astral (todo gris azulado; lo importante brilla aparte, ver astral.ts). */
  uAstral: { value: 0 },
};

export class LuzRejilla {
  readonly w: number;
  readonly h: number;
  private estatica: Float32Array;
  private total: Float32Array;
  readonly datos: Uint8Array;
  readonly textura: THREE.DataTexture;
  private dist: Uint8Array;
  private cola: Int32Array;
  private tocadas: number[] = [];
  fuentes: FuenteLuz[] = [];

  constructor(private m: Mapa) {
    this.w = m.w;
    this.h = m.h;
    const n = m.w * m.h;
    this.estatica = new Float32Array(n * 3);
    this.total = new Float32Array(n * 3);
    this.datos = new Uint8Array(n * 4);
    this.dist = new Uint8Array(n);
    this.cola = new Int32Array(n);
    this.textura = new THREE.DataTexture(this.datos, m.w, m.h, THREE.RGBAFormat);
    this.textura.magFilter = THREE.LinearFilter;
    this.textura.minFilter = THREE.LinearFilter;
    this.textura.wrapS = this.textura.wrapT = THREE.ClampToEdgeWrapping;
    this.textura.needsUpdate = true;
    UNI_LUZ.uLuzMapa.value = this.textura;
    UNI_LUZ.uLuzTam.value.set(m.w, m.h);
  }

  /** Las luces fijas (antorchas, velas, vetas, lava). Se rehace cuando se rompe una pared. */
  rehacerEstatica(fijas: FuenteLuz[]) {
    this.estatica.fill(0);
    for (const f of fijas) this.sumar(this.estatica, f);
    // La lava y las vetas de sangre brillan solas (un poquito, en su celda y alrededor)
    const m = this.m;
    for (let i = 0; i < m.c.length; i++) {
      const t = m.c[i];
      if (t === C.LAVA) {
        this.estatica[i * 3] += 1.1;
        this.estatica[i * 3 + 1] += 0.32;
        this.estatica[i * 3 + 2] += 0.06;
      }
    }
  }

  /** Suma una luz que se propaga por las celdas abiertas (BFS hasta su radio). */
  private sumar(dest: Float32Array, f: FuenteLuz) {
    const { w, h, m } = this;
    const cx = Math.floor(f.x), cy = Math.floor(f.y);
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) return;
    const r = Math.min(14, f.r);
    const r2 = r * r;
    const cr = f.color.r * f.fuerza, cg = f.color.g * f.fuerza, cb = f.color.b * f.fuerza;
    let a = 0, b = 0;
    const i0 = cy * w + cx;
    this.cola[b++] = i0;
    this.dist[i0] = 1;
    this.tocadas.push(i0);
    while (a < b) {
      const i = this.cola[a++];
      const x = i % w, y = (i / w) | 0;
      const dx = x + 0.5 - f.x, dy = y + 0.5 - f.y;
      const d2 = dx * dx + dy * dy;
      // Caída suave (cuadrática hasta el borde del radio)
      const k = Math.max(0, 1 - d2 / r2);
      const v = k * k;
      dest[i * 3] += cr * v;
      dest[i * 3 + 1] += cg * v;
      dest[i * 3 + 2] += cb * v;
      // Las paredes reciben luz pero no la dejan pasar
      if (tapaLuz(m.c[i]) && i !== i0) continue;
      for (let k2 = 0; k2 < 4; k2++) {
        const nx = x + (k2 === 0 ? 1 : k2 === 1 ? -1 : 0), ny = y + (k2 === 2 ? 1 : k2 === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (this.dist[j]) continue;
        if ((nx + 0.5 - f.x) ** 2 + (ny + 0.5 - f.y) ** 2 > r2) continue;
        this.dist[j] = 1;
        this.tocadas.push(j);
        this.cola[b++] = j;
      }
    }
    for (const t of this.tocadas) this.dist[t] = 0;
    this.tocadas.length = 0;
  }

  /** Cada cuadro: luces fijas + las que se mueven (jugadores, fuego, explosiones). */
  actualizar(movibles: FuenteLuz[]) {
    const tot = this.total;
    tot.set(this.estatica);
    for (const f of movibles) this.sumar(tot, f);
    const d = this.datos;
    const n = this.w * this.h;
    for (let i = 0; i < n; i++) {
      // Se guarda con una curva (más resolución en lo oscuro) y tope 4
      d[i * 4] = Math.min(255, Math.sqrt(Math.min(4, tot[i * 3]) / 4) * 255);
      d[i * 4 + 1] = Math.min(255, Math.sqrt(Math.min(4, tot[i * 3 + 1]) / 4) * 255);
      d[i * 4 + 2] = Math.min(255, Math.sqrt(Math.min(4, tot[i * 3 + 2]) / 4) * 255);
      d[i * 4 + 3] = 255;
    }
    this.textura.needsUpdate = true;
  }

  liberar() {
    this.textura.dispose();
  }
}

// ------------------------------------------------------------------------------------------------- Sombreador
const VERT_DECL = /* glsl */ `
varying vec3 vMundoLuz;
`;
const VERT_CUERPO = /* glsl */ `
{
  vec4 mundoLuz = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    mundoLuz = instanceMatrix * mundoLuz;
  #endif
  mundoLuz = modelMatrix * mundoLuz;
  vMundoLuz = mundoLuz.xyz;
}
`;
const FRAG_DECL = /* glsl */ `
varying vec3 vMundoLuz;
uniform sampler2D uLuzMapa;
uniform vec2 uLuzTam;
uniform float uLuzFuerza;
uniform float uTiempo;
uniform float uOscuro;
uniform vec3 uAmbiente;
uniform float uAstral;
float hashLuz( vec2 p ) { return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }
vec3 luzRejilla( vec3 p ) {
  vec3 l = texture2D( uLuzMapa, p.xz / uLuzTam ).rgb;
  l = l * l * 4.0;
  // Parpadeo de las llamas: cada zona titila a su ritmo
  float h = hashLuz( floor( p.xz * 0.5 ) );
  float t = uTiempo * ( 6.0 + h * 5.0 ) + h * 40.0;
  float parpadeo = 0.86 + 0.09 * sin( t ) + 0.05 * sin( t * 2.7 + 1.3 );
  // Las caras altas reciben un poco menos (la luz viene de abajo, de las antorchas)
  float alto = clamp( 1.15 - p.y * 0.18, 0.55, 1.15 );
  return l * uLuzFuerza * parpadeo * alto * ( 1.0 - uOscuro * 0.55 );
}
`;
const FRAG_CUERPO = /* glsl */ `
reflectedLight.indirectDiffuse += diffuseColor.rgb * ( luzRejilla( vMundoLuz ) + uAmbiente * ( 1.0 - uOscuro * 0.6 ) );
`;
/** Visión astral: el color se vuelve gris azulado y un poco más oscuro (antes del tono de la cámara). */
const FRAG_ASTRAL = /* glsl */ `
if ( uAstral > 0.0 ) {
  float grisAstral = dot( gl_FragColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3( grisAstral ) * vec3( 0.72, 0.8, 0.98 ) * 0.85, uAstral );
}
`;

/** Le enseña a un material a leer la rejilla de luz (se puede encadenar con otro onBeforeCompile). */
export function conLuz<T extends THREE.Material>(mat: T, extra?: (s: THREE.WebGLProgramParametersWithUniforms) => void, clave = ''): T {
  const antes = mat.onBeforeCompile;
  mat.onBeforeCompile = (s, r) => {
    antes?.call(mat, s, r);
    Object.assign(s.uniforms, UNI_LUZ);
    s.vertexShader = s.vertexShader.replace('#include <common>', `#include <common>\n${VERT_DECL}`).replace('#include <project_vertex>', `#include <project_vertex>\n${VERT_CUERPO}`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_DECL}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${FRAG_CUERPO}`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>\n${FRAG_ASTRAL}`);
    extra?.(s);
  };
  const clavePrev = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => `luz${clave}|${clavePrev ? clavePrev() : ''}`;
  mat.needsUpdate = true;
  return mat;
}

/** Recorre un objeto y les pone la rejilla de luz a todos sus materiales (clonándolos si se comparten). */
export function iluminarObjeto(o: THREE.Object3D, clonar = false) {
  const hechos = new Map<THREE.Material, THREE.Material>();
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    const conv = (mat: THREE.Material) => {
      let n = hechos.get(mat);
      if (!n) {
        n = clonar ? mat.clone() : mat;
        if (!(n as any).__luz) {
          (n as any).__luz = true;
          conLuz(n);
        }
        hechos.set(mat, n);
      }
      return n;
    };
    m.material = Array.isArray(m.material) ? m.material.map(conv) : conv(m.material);
  });
}
