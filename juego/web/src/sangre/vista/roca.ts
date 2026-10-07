// Detalle de roca de la calidad alta, pintado en el mundo desde los tres ejes (sin coordenadas de textura: sirve
// para cualquier pared, bloque o lápida de los GLB). El color de los vértices sigue mandando (las formas grandes:
// hiladas, musgo, humedad); esto le suma lo fino que la malla no alcanza: relieve con la luz, poros, grietas,
// estratos, motas. Las paredes usan la textura de su bioma (`modelos/sangre/alta/<bioma>_roca.webp`, hecha con
// personajes/blender/sangre_roca_alta.py: R = alto, G = oscuro, B = claro, un cuadro de 1 m); la decoración, una
// genérica de grano y grietas hecha aquí mismo.
import * as THREE from 'three';
import { hash2 } from '../../casa/lavado/azar';

let generica: THREE.DataTexture | null = null;

/** Grano y grietas genéricos (se repite sin costuras): R = grano, G = grietas, B = nada. */
export function texturaRocaGenerica(): THREE.DataTexture {
  if (generica) return generica;
  const n = 256;
  // Ruido de valor periódico (rejilla de p celdas que se repite en la textura)
  const valor = (x: number, y: number, p: number, s: number) => {
    const fx = (x / n) * p, fy = (y / n) * p;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const h = (a: number, b: number) => hash2(((a % p) + p) % p, ((b % p) + p) % p, s);
    const a = h(ix, iy) + (h(ix + 1, iy) - h(ix, iy)) * sx;
    const b = h(ix, iy + 1) + (h(ix + 1, iy + 1) - h(ix, iy + 1)) * sx;
    return a + (b - a) * sy;
  };
  // Grietas: bordes de celdas de Voronoi (periódicas), solo algunos tramos
  const celdas = 5;
  const puntos: [number, number][] = [];
  for (let j = 0; j < celdas; j++)
    for (let i = 0; i < celdas; i++) puntos.push([(i + 0.15 + 0.7 * hash2(i, j, 71)) / celdas, (j + 0.15 + 0.7 * hash2(i, j, 72)) / celdas]);
  const datos = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const g = valor(x, y, 8, 11) * 0.42 + valor(x, y, 16, 12) * 0.26 + valor(x, y, 32, 13) * 0.18 + valor(x, y, 64, 14) * 0.14;
      const u = x / n, v = y / n;
      let f1 = 9, f2 = 9;
      const ci = Math.floor(u * celdas), cj = Math.floor(v * celdas);
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const i2 = ci + di, j2 = cj + dj;
          const [px, py] = puntos[(((j2 % celdas) + celdas) % celdas) * celdas + (((i2 % celdas) + celdas) % celdas)];
          // (el punto de la celda vecina, corrido una vuelta si la celda se sale de la textura)
          const d = Math.hypot(u - px - Math.floor(i2 / celdas), v - py - Math.floor(j2 / celdas));
          if (d < f1) (f2 = f1), (f1 = d);
          else if (d < f2) f2 = d;
        }
      const tramo = Math.max(0, Math.min(1, (valor(x, y, 4, 15) - 0.66) / 0.1));
      const grieta = Math.max(0, 1 - (f2 - f1) / (0.004 + 0.007 * tramo)) * tramo * (0.6 + 0.4 * valor(x, y, 32, 16));
      const i = (y * n + x) * 4;
      datos[i] = Math.round(g * 255);
      datos[i + 1] = Math.round(Math.min(1, grieta) * 255);
      datos[i + 2] = 0;
      datos[i + 3] = 255;
    }
  generica = prepararTextura(new THREE.DataTexture(datos, n, n, THREE.RGBAFormat));
  return generica;
}

/** Repetida, lineal (son datos, no color) y con mipmaps. */
export function prepararTextura<T extends THREE.Texture>(t: T): T {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/** ¿A este material le va el detalle de roca? (piedra y tierra; la madera, el metal y la tela no). */
export const esRoca = (nombre: string) => /^(piedra|tierra)/.test(nombre);

export type InyectorRoca = (s: THREE.WebGLProgramParametersWithUniforms) => void;

/**
 * El pedacito de sombreador (para encadenar en `conLuz`, que ya pasa la posición en el mundo `vMundoLuz`).
 * `tex`: la textura del bioma (o la genérica si es null); `escala`: veces que se repite por metro; `relieve`, `oscuro`
 * y `claro`: cuánto pesa cada canal. Todos usan el mismo programa (lo que cambia va en uniformes).
 */
export function conRoca(tex: THREE.Texture | null, escala = 1, relieve = 1.4, oscuro = 0.55, claro = 0.45): InyectorRoca {
  return (s) => {
    Object.assign(s.uniforms, {
      uRocaDet: { value: tex ?? texturaRocaGenerica() },
      uRocaAj: { value: new THREE.Vector4(escala, relieve, oscuro, claro) },
    });
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNorRoca;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vNorRoca = objectNormal;
        #ifdef USE_INSTANCING
          vNorRoca = mat3( instanceMatrix ) * vNorRoca;
        #endif
        vNorRoca = mat3( modelMatrix ) * vNorRoca;`,
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vNorRoca;
        uniform sampler2D uRocaDet;
        uniform vec4 uRocaAj;
        vec3 rocaTri( vec3 p, vec3 n ) {
          vec3 w = pow( abs( n ), vec3( 4.0 ) );
          w /= ( w.x + w.y + w.z + 1e-4 );
          p *= uRocaAj.x;
          vec3 a = texture2D( uRocaDet, p.zy ).rgb;
          vec3 b = texture2D( uRocaDet, p.xz ).rgb;
          vec3 c = texture2D( uRocaDet, p.xy ).rgb;
          vec3 r = a * w.x + b * w.y + c * w.z;
          // una segunda pasada más chiquita y girada (solo relieve) para que no se note el cuadro que se repite
          vec2 q = ( p.zy * w.x + p.xz * w.y + p.xy * w.z ) * 2.3;
          float fino = texture2D( uRocaDet, vec2( q.x * 0.8 - q.y * 0.6, q.x * 0.6 + q.y * 0.8 ) + 0.37 ).r;
          return vec3( r.x * 0.75 + fino * 0.25, r.y, r.z );
        }
        vec3 rocaRelieve( vec3 sp, vec3 sn, vec2 dH, float cara ) {
          vec3 sx = normalize( dFdx( sp ) );
          vec3 sy = normalize( dFdy( sp ) );
          vec3 r1 = cross( sy, sn );
          vec3 r2 = cross( sn, sx );
          float det = dot( sx, r1 ) * cara;
          vec3 grad = sign( det ) * ( dH.x * r1 + dH.y * r2 );
          return normalize( abs( det ) * sn - grad );
        }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          vec3 rocaD = rocaTri( vMundoLuz, normalize( vNorRoca ) );
          float rocaH = rocaD.x - rocaD.y * 0.35;
          normal = rocaRelieve( - vViewPosition, normal, vec2( dFdx( rocaH ), dFdy( rocaH ) ) * uRocaAj.y, faceDirection );
          diffuseColor.rgb *= ( 0.84 + 0.32 * rocaD.x ) * ( 1.0 - uRocaAj.z * rocaD.y ) * ( 1.0 + uRocaAj.w * rocaD.z );
        }`,
      );
  };
}

/** La genérica (decoración y lo que no tenga textura de bioma). */
export const inyectarRoca: InyectorRoca = conRoca(null, 0.62, 1.6, 0.3, 0);
