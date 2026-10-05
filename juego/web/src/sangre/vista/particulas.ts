// Partículas: dos capas de puntos (las que brillan y las opacas) con un atlas de 8 cuadros. Piscina fija en arreglos
// planos: brasas, chispas, polvo al excavar, piedritas, almas que suben, sangre en neblina (sin gore), humo, niebla.
import * as THREE from 'three';
import { atlasParticulas, CUADRO, ESCALA_PUNTOS } from './texturas';

class Capa {
  readonly max: number;
  n = 0;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly vz: Float32Array;
  readonly g: Float32Array;
  readonly frena: Float32Array;
  readonly vida: Float32Array;
  readonly total: Float32Array;
  readonly t0: Float32Array;
  readonly t1: Float32Array;
  readonly a0: Float32Array;
  readonly rgb: Float32Array;
  readonly cuadro: Float32Array;
  readonly puntos: THREE.Points;
  private pos: THREE.BufferAttribute;
  private col: THREE.BufferAttribute;
  private tam: THREE.BufferAttribute;
  private cua: THREE.BufferAttribute;
  private sig = 0;

  constructor(max: number, aditiva: boolean) {
    this.max = max;
    const f = () => new Float32Array(max);
    this.x = f(); this.y = f(); this.z = f(); this.vx = f(); this.vy = f(); this.vz = f(); this.g = f(); this.frena = f();
    this.vida = f(); this.total = f(); this.t0 = f(); this.t1 = f(); this.a0 = f(); this.cuadro = f();
    this.rgb = new Float32Array(max * 3);
    const geo = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.col = new THREE.BufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.tam = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    this.cua = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.pos);
    geo.setAttribute('aColor', this.col);
    geo.setAttribute('aTam', this.tam);
    geo.setAttribute('aCuadro', this.cua);
    geo.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: atlasParticulas() }, uEscala: ESCALA_PUNTOS },
      vertexShader: /* glsl */ `
        attribute vec4 aColor;
        attribute float aTam;
        attribute float aCuadro;
        uniform float uEscala;
        varying vec4 vColor;
        varying float vCuadro;
        void main() {
          vec4 mv = modelViewMatrix * vec4( position, 1.0 );
          gl_PointSize = aTam * uEscala / -mv.z;
          gl_Position = projectionMatrix * mv;
          vColor = aColor;
          vCuadro = aCuadro;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex;
        varying vec4 vColor;
        varying float vCuadro;
        void main() {
          float c = floor( vCuadro + 0.5 );
          vec2 uv = vec2( ( mod( c, 4.0 ) + gl_PointCoord.x ) / 4.0, 1.0 - ( floor( c / 4.0 ) + gl_PointCoord.y ) / 2.0 );
          vec4 t = texture2D( uTex, uv );
          gl_FragColor = vec4( vColor.rgb, vColor.a * t.a );
          if ( gl_FragColor.a < 0.01 ) discard;
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      blending: aditiva ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.puntos = new THREE.Points(geo, mat);
    this.puntos.frustumCulled = false;
    this.puntos.renderOrder = aditiva ? 8 : 7;
  }

  crear(x: number, y: number, z: number, vx: number, vy: number, vz: number, vida: number, t0: number, t1: number, r: number, g: number, b: number, a: number, cuadro: number, grav = 0, frena = 0) {
    let k: number;
    if (this.n < this.max) k = this.n++;
    else {
      // Llena: se recicla una al azar de las viejas
      this.sig = (this.sig + 1) % this.max;
      k = this.sig;
    }
    this.x[k] = x;
    this.y[k] = y;
    this.z[k] = z;
    this.vx[k] = vx;
    this.vy[k] = vy;
    this.vz[k] = vz;
    this.vida[k] = this.total[k] = vida;
    this.t0[k] = t0;
    this.t1[k] = t1;
    this.rgb[k * 3] = r;
    this.rgb[k * 3 + 1] = g;
    this.rgb[k * 3 + 2] = b;
    this.a0[k] = a;
    this.cuadro[k] = cuadro;
    this.g[k] = grav;
    this.frena[k] = frena;
  }

  actualizar(dt: number) {
    const p = this.pos.array as Float32Array, c = this.col.array as Float32Array, s = this.tam.array as Float32Array, q = this.cua.array as Float32Array;
    let k = 0;
    while (k < this.n) {
      this.vida[k] -= dt;
      if (this.vida[k] <= 0) {
        // Se cambia por la última (sin huecos)
        const u = --this.n;
        if (k !== u) {
          this.x[k] = this.x[u]; this.y[k] = this.y[u]; this.z[k] = this.z[u];
          this.vx[k] = this.vx[u]; this.vy[k] = this.vy[u]; this.vz[k] = this.vz[u];
          this.vida[k] = this.vida[u]; this.total[k] = this.total[u]; this.t0[k] = this.t0[u]; this.t1[k] = this.t1[u];
          this.rgb[k * 3] = this.rgb[u * 3]; this.rgb[k * 3 + 1] = this.rgb[u * 3 + 1]; this.rgb[k * 3 + 2] = this.rgb[u * 3 + 2];
          this.a0[k] = this.a0[u]; this.cuadro[k] = this.cuadro[u]; this.g[k] = this.g[u]; this.frena[k] = this.frena[u];
        }
        continue;
      }
      const fr = this.frena[k] ? Math.exp(-this.frena[k] * dt) : 1;
      this.vx[k] *= fr;
      this.vy[k] = (this.vy[k] - this.g[k] * dt) * fr;
      this.vz[k] *= fr;
      this.x[k] += this.vx[k] * dt;
      this.y[k] += this.vy[k] * dt;
      this.z[k] += this.vz[k] * dt;
      if (this.y[k] < 0.02 && this.g[k] > 0) {
        this.y[k] = 0.02;
        this.vy[k] *= -0.3;
        this.vx[k] *= 0.6;
        this.vz[k] *= 0.6;
      }
      const u = 1 - this.vida[k] / this.total[k];
      p[k * 3] = this.x[k];
      p[k * 3 + 1] = this.y[k];
      p[k * 3 + 2] = this.z[k];
      c[k * 4] = this.rgb[k * 3];
      c[k * 4 + 1] = this.rgb[k * 3 + 1];
      c[k * 4 + 2] = this.rgb[k * 3 + 2];
      // Aparece rápido y se apaga suave
      c[k * 4 + 3] = this.a0[k] * Math.min(1, u * 8) * (1 - u * u);
      s[k] = this.t0[k] + (this.t1[k] - this.t0[k]) * u;
      q[k] = this.cuadro[k];
      k++;
    }
    const geo = this.puntos.geometry;
    geo.setDrawRange(0, this.n);
    this.pos.needsUpdate = this.col.needsUpdate = this.tam.needsUpdate = this.cua.needsUpdate = true;
  }
}

const az = Math.random;
const COL = new THREE.Color();

export class Particulas {
  luz = new Capa(2600, true);
  sombra = new Capa(1600, false);
  /** 0-1: cuántas se crean (baja sola si el celular va lento). */
  cupo = 1;

  constructor(padre: THREE.Object3D) {
    padre.add(this.luz.puntos, this.sombra.puntos);
  }

  private n(base: number) {
    const v = base * this.cupo;
    return Math.floor(v) + (az() < v % 1 ? 1 : 0);
  }

  actualizar(dt: number) {
    this.luz.actualizar(dt);
    this.sombra.actualizar(dt);
  }

  /** Chispas de un golpe (color del arma). */
  chispas(x: number, y: number, z: number, color: THREE.ColorRepresentation, n = 6, fuerza = 4) {
    COL.set(color);
    for (let k = this.n(n); k > 0; k--) {
      const a = az() * Math.PI * 2, v = fuerza * (0.4 + az());
      this.luz.crear(x, y, z, Math.cos(a) * v, az() * fuerza * 0.8, Math.sin(a) * v, 0.18 + az() * 0.25, 0.09, 0.02, COL.r * 2, COL.g * 2, COL.b * 2, 1, CUADRO.CHISPA, 9, 3);
    }
  }

  /** Brasas que suben (antorchas, fuego, muertes). */
  brasas(x: number, y: number, z: number, n = 4, r = 0.3, color: THREE.ColorRepresentation = '#ff8a3a') {
    COL.set(color);
    for (let k = this.n(n); k > 0; k--) {
      this.luz.crear(x + (az() - 0.5) * r, y, z + (az() - 0.5) * r, (az() - 0.5) * 0.6, 0.6 + az() * 1.2, (az() - 0.5) * 0.6, 0.6 + az() * 0.9, 0.07, 0.02, COL.r * 2.2, COL.g * 2, COL.b * 2, 1, CUADRO.BRASA, -0.4, 0.8);
    }
  }

  /** Polvo y piedritas al excavar. */
  polvo(x: number, y: number, z: number, color: THREE.ColorRepresentation, n = 5, piedras = 3) {
    COL.set(color);
    for (let k = this.n(n); k > 0; k--) {
      this.sombra.crear(x + (az() - 0.5) * 0.6, y + az() * 0.8, z + (az() - 0.5) * 0.6, (az() - 0.5) * 1.2, 0.3 + az() * 0.6, (az() - 0.5) * 1.2, 0.7 + az() * 0.6, 0.35, 0.9, COL.r * 0.9, COL.g * 0.9, COL.b * 0.9, 0.55, CUADRO.POLVO, -0.1, 1.5);
    }
    for (let k = this.n(piedras); k > 0; k--) {
      const a = az() * Math.PI * 2;
      this.sombra.crear(x, y + 0.6 + az() * 0.6, z, Math.cos(a) * (1 + az() * 2), 1 + az() * 2.5, Math.sin(a) * (1 + az() * 2), 0.6 + az() * 0.4, 0.06 + az() * 0.05, 0.05, COL.r * 0.55, COL.g * 0.55, COL.b * 0.55, 1, CUADRO.SANGRE, 14, 0.5);
    }
  }

  /** Sangre en neblina (oscura, sin exagerar). */
  sangre(x: number, y: number, z: number, n = 4, color: THREE.ColorRepresentation = '#5a0a10') {
    COL.set(color);
    for (let k = this.n(n); k > 0; k--) {
      const a = az() * Math.PI * 2, v = 0.6 + az() * 1.6;
      this.sombra.crear(x, y, z, Math.cos(a) * v, 0.5 + az() * 1.5, Math.sin(a) * v, 0.35 + az() * 0.3, 0.12, 0.25, COL.r, COL.g, COL.b, 0.75, CUADRO.HUMO, 4, 2.5);
    }
  }

  /** Muerte: brasas que se van con el cuerpo que se desintegra, y un poco de ceniza. */
  muerte(x: number, z: number, alto: number, color: THREE.ColorRepresentation) {
    for (let k = this.n(7); k > 0; k--) this.luz.crear(x + (az() - 0.5) * 0.5, az() * alto, z + (az() - 0.5) * 0.5, (az() - 0.5) * 0.7, 0.8 + az() * 1.4, (az() - 0.5) * 0.7, 0.5 + az() * 0.8, 0.08, 0.02, 2.4, 0.8, 0.25, 1, CUADRO.BRASA, -0.6, 0.6);
    COL.set(color);
    for (let k = this.n(3); k > 0; k--) this.sombra.crear(x + (az() - 0.5) * 0.4, az() * alto * 0.7, z + (az() - 0.5) * 0.4, (az() - 0.5) * 0.4, 0.4 + az() * 0.5, (az() - 0.5) * 0.4, 0.8 + az() * 0.6, 0.25, 0.6, COL.r * 0.4, COL.g * 0.4, COL.b * 0.4, 0.5, CUADRO.HUMO, -0.2, 1);
  }

  /** Un alma que sube (al recogerla). */
  alma(x: number, y: number, z: number, color: THREE.ColorRepresentation) {
    COL.set(color);
    for (let k = this.n(3); k > 0; k--) this.luz.crear(x + (az() - 0.5) * 0.2, y, z + (az() - 0.5) * 0.2, (az() - 0.5) * 0.3, 1.2 + az(), (az() - 0.5) * 0.3, 0.4 + az() * 0.3, 0.16, 0.03, COL.r * 2, COL.g * 2, COL.b * 2, 1, CUADRO.ALMA, -1, 1);
  }

  /** Humo (explosiones, bomba de humo). */
  humo(x: number, y: number, z: number, n = 6, r = 1, color: THREE.ColorRepresentation = '#2a2624', vida = 1.4) {
    COL.set(color);
    for (let k = this.n(n); k > 0; k--) this.sombra.crear(x + (az() - 0.5) * r, y + az() * 0.5, z + (az() - 0.5) * r, (az() - 0.5) * 0.8, 0.3 + az() * 0.6, (az() - 0.5) * 0.8, vida * (0.7 + az() * 0.6), 0.6 * r, 1.6 * r, COL.r, COL.g, COL.b, 0.55, CUADRO.HUMO, -0.1, 1.2);
  }

  /** Destello de luz (un halo grande que se apaga rápido). */
  destello(x: number, y: number, z: number, tam: number, color: THREE.ColorRepresentation, vida = 0.18) {
    COL.set(color);
    this.luz.crear(x, y, z, 0, 0, 0, vida, tam * 0.6, tam, COL.r * 1.6, COL.g * 1.6, COL.b * 1.6, 1, CUADRO.LUZ, 0, 0);
  }

  /** Puntos de luz quietos que se apagan (estelas). */
  estela(x: number, y: number, z: number, color: THREE.ColorRepresentation, tam = 0.12, vida = 0.25) {
    if (az() > this.cupo) return;
    COL.set(color);
    this.luz.crear(x, y, z, 0, 0.05, 0, vida, tam, tam * 0.3, COL.r * 1.5, COL.g * 1.5, COL.b * 1.5, 0.8, CUADRO.BRASA, 0, 0);
  }

  /** Niebla baja que flota (ambiente). */
  niebla(x: number, z: number, color: THREE.ColorRepresentation) {
    COL.set(color);
    this.sombra.crear(x, 0.25 + az() * 0.3, z, (az() - 0.5) * 0.3, 0, (az() - 0.5) * 0.3, 5 + az() * 4, 2.2, 3.4, COL.r, COL.g, COL.b, 0.22, CUADRO.NIEBLA, 0, 0);
  }

  /** Motas que flotan en el aire (polvo iluminado). */
  motas(x: number, z: number, color: THREE.ColorRepresentation) {
    COL.set(color);
    this.luz.crear(x, 0.3 + az() * 1.8, z, (az() - 0.5) * 0.15, (az() - 0.5) * 0.1, (az() - 0.5) * 0.15, 3 + az() * 3, 0.03, 0.03, COL.r * 0.6, COL.g * 0.6, COL.b * 0.6, 0.6, CUADRO.BRASA, 0, 0);
  }

  get cuantas() {
    return this.luz.n + this.sombra.n;
  }
}
