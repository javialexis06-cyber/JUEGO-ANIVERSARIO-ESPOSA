// Lotes de sprites con instancias: cientos de mugrosos, gotitas o proyectiles en un solo dibujo. Cada sprite es un
// cartón parado en el piso (mira a la cámara, que nunca gira) o acostado en el piso, con su cuadro del atlas, su
// destello blanco al recibir un golpe, su color, su transparencia, su giro y el estirar y aplastar al caminar.
// Los buffers se reescriben en cada cuadro sin crear nada nuevo.
import * as THREE from 'three';

/** Elevación de la cámara del juego (y cuánto hay que estirar los cartones parados para que no se vean bajitos). */
export const ELEVACION = THREE.MathUtils.degToRad(56);
export const ESTIRAR = 1 / Math.cos(ELEVACION);

const VERT = /* glsl */ `
  attribute vec4 aPos;    // x, y del mapa, altura sobre el piso, giro (rad, en la pantalla)
  attribute vec4 aTam;    // ancho, alto (mapa), ancla x (0..1), ancla y (0..1 desde arriba)
  attribute vec4 aUV;     // u0, v0, u1, v1
  attribute vec4 aCol;    // r, g, b (tinte que multiplica), alfa
  attribute vec4 aExtra;  // destello blanco, aplastar (+ = ancho y bajito), voltear (±1), brillo (suma)
  uniform float uPiso;    // 1 = acostado en el piso
  uniform float uEstirar;
  varying vec2 vUv;
  varying vec4 vCol;
  varying vec2 vExtra;
  void main() {
    vec2 q = position.xy; // -0.5..0.5
    float w = aTam.x * (1.0 + aExtra.y);
    float h = aTam.y * (1.0 - aExtra.y * 0.85);
    // Ancla: el punto (aTam.z, aTam.w) del dibujo queda en (x, y)
    vec2 local = vec2((q.x + 0.5 - aTam.z) * w * aExtra.z, (0.5 - q.y - aTam.w) * -h);
    float c = cos(aPos.w), s = sin(aPos.w);
    local = vec2(c * local.x - s * local.y, s * local.x + c * local.y);
    vec3 p;
    if (uPiso > 0.5) {
      p = vec3(aPos.x + local.x, aPos.z + 0.02, aPos.y - local.y);
    } else {
      p = vec3(aPos.x + local.x, aPos.z + local.y * uEstirar, aPos.y);
    }
    vUv = vec2(mix(aUV.x, aUV.z, q.x + 0.5), mix(aUV.y, aUV.w, q.y + 0.5));
    vCol = aCol;
    vExtra = vec2(aExtra.x, aExtra.w);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMapa;
  uniform float uAditivo;
  varying vec2 vUv;
  varying vec4 vCol;
  varying vec2 vExtra;
  void main() {
    vec4 t = texture2D(uMapa, vUv);
    vec3 c = t.rgb * vCol.rgb;
    c = mix(c, vec3(1.0), vExtra.x * 0.85);
    c += vExtra.y * t.a;
    float a = t.a * vCol.a;
    if (a < 0.015) discard;
    if (uAditivo > 0.5) gl_FragColor = vec4(c * a, a);
    else gl_FragColor = vec4(c, a);
    #include <colorspace_fragment>
  }
`;

export interface OpcionesLote {
  max: number;
  mapa: THREE.Texture;
  piso?: boolean;
  aditivo?: boolean;
  orden?: number;
  /** Sin prueba de profundidad (encima de todo: números, avisos). */
  encima?: boolean;
}

export class LoteSprites {
  readonly malla: THREE.Mesh;
  readonly max: number;
  n = 0;
  private pos: Float32Array;
  private tam: Float32Array;
  private uv: Float32Array;
  private col: Float32Array;
  private extra: Float32Array;
  private atributos: THREE.InstancedBufferAttribute[];
  private geo: THREE.InstancedBufferGeometry;
  readonly mat: THREE.ShaderMaterial;

  constructor(o: OpcionesLote) {
    this.max = o.max;
    const base = new THREE.PlaneGeometry(1, 1);
    this.geo = new THREE.InstancedBufferGeometry();
    this.geo.index = base.index;
    this.geo.setAttribute('position', base.getAttribute('position'));
    const attr = (k: number) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(o.max * k), k);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    const aPos = attr(4), aTam = attr(4), aUV = attr(4), aCol = attr(4), aExtra = attr(4);
    this.geo.setAttribute('aPos', aPos);
    this.geo.setAttribute('aTam', aTam);
    this.geo.setAttribute('aUV', aUV);
    this.geo.setAttribute('aCol', aCol);
    this.geo.setAttribute('aExtra', aExtra);
    this.atributos = [aPos, aTam, aUV, aCol, aExtra];
    this.pos = aPos.array as Float32Array;
    this.tam = aTam.array as Float32Array;
    this.uv = aUV.array as Float32Array;
    this.col = aCol.array as Float32Array;
    this.extra = aExtra.array as Float32Array;
    this.geo.instanceCount = 0;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uMapa: { value: o.mapa }, uPiso: { value: o.piso ? 1 : 0 }, uAditivo: { value: o.aditivo ? 1 : 0 }, uEstirar: { value: ESTIRAR } },
      transparent: true,
      depthWrite: false,
      depthTest: !o.encima,
      blending: o.aditivo ? THREE.CustomBlending : THREE.NormalBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    if (o.aditivo) {
      this.mat.blendSrc = THREE.OneFactor;
      this.mat.blendDst = THREE.OneFactor;
      this.mat.blendEquation = THREE.AddEquation;
    }
    this.malla = new THREE.Mesh(this.geo, this.mat);
    this.malla.frustumCulled = false;
    this.malla.renderOrder = o.orden ?? 10;
  }

  empezar() {
    this.n = 0;
  }

  /**
   * Agrega un sprite. uv = [u0, v0, u1, v1] en 0..1 (v desde abajo). ax, ay: el ancla en el dibujo (0..1, y desde
   * arriba). Devuelve false si ya no caben.
   */
  poner(x: number, y: number, z: number, w: number, h: number, ax: number, ay: number, u0: number, v0: number, u1: number, v1: number,
    r = 1, g = 1, b = 1, a = 1, destello = 0, aplastar = 0, voltear = 1, giro = 0, brillo = 0): boolean {
    if (this.n >= this.max) return false;
    const i = this.n * 4;
    this.pos[i] = x;
    this.pos[i + 1] = y;
    this.pos[i + 2] = z;
    this.pos[i + 3] = giro;
    this.tam[i] = w;
    this.tam[i + 1] = h;
    this.tam[i + 2] = ax;
    this.tam[i + 3] = ay;
    this.uv[i] = u0;
    this.uv[i + 1] = v0;
    this.uv[i + 2] = u1;
    this.uv[i + 3] = v1;
    this.col[i] = r;
    this.col[i + 1] = g;
    this.col[i + 2] = b;
    this.col[i + 3] = a;
    this.extra[i] = destello;
    this.extra[i + 1] = aplastar;
    this.extra[i + 2] = voltear;
    this.extra[i + 3] = brillo;
    this.n++;
    return true;
  }

  terminar() {
    this.geo.instanceCount = this.n;
    for (const a of this.atributos) {
      a.clearUpdateRanges();
      a.addUpdateRange(0, Math.max(1, this.n) * 4);
      a.needsUpdate = true;
    }
  }

  liberar() {
    this.geo.dispose();
    this.mat.dispose();
  }
}

/** Un cuadro del atlas en coordenadas de textura (v desde abajo, como three). */
export interface Cuadro {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export function cuadroDe(x: number, y: number, w: number, h: number, ancho: number, alto: number): Cuadro {
  return { u0: x / ancho, v0: 1 - (y + h) / alto, u1: (x + w) / ancho, v1: 1 - y / alto };
}
