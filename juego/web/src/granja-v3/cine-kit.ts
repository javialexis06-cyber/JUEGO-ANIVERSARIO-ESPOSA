// La caja de herramientas del cine de la granja: lo que comparten todas las películas (azar con semilla, curvas,
// partículas suaves, hablar, instancias de los kits de Blender, senderos). Salió del prólogo (cine-prologo.ts).
import * as THREE from 'three';
import { actuar, type Actor } from './cine-actores';
import type { ContextoToma, LineaCine, Plano, Toma, V3 } from './cine-granja';


/** Azar con semilla (cada escena sale igual siempre, también al grabar). */
export function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
export const paso = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const bez = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number) =>
  new THREE.Vector3().copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(b, 2 * (1 - t) * t).addScaledVector(c, t * t);

export const RUIDO = /* glsl */ `
float hash3(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float ruido(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*ruido(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
`;
// Los #include van en su propia línea (pegados a otra instrucción no compilan)
export const FIN_FRAG = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';

/** Partículas suaves (estrellas, chispas, polen) dibujadas como puntos con su núcleo brillante. */
export function puntosSuaves(n: number, llenar: (i: number, pos: Float32Array, col: Float32Array, tam: Float32Array, fase: Float32Array) => void,
  vertice: string, uniforms: Record<string, THREE.IUniform>, ref = 10) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tam = new Float32Array(n), fase = new Float32Array(n);
  for (let i = 0; i < n; i++) llenar(i, pos, col, tam, fase);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
  geo.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
  // Los uniformes propios de cada sistema se declaran solos según su tipo
  const propios = Object.entries(uniforms).map(([k, u]) => `uniform ${(u.value as THREE.Vector3).isVector3 ? 'vec3' : 'float'} ${k};`).join('');
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uEscala: { value: 1 }, uAlfa: { value: 1 }, uRef: { value: ref }, ...uniforms },
    vertexShader: `attribute vec3 aColor;attribute float aTam;attribute float aFase;uniform float uT;uniform float uEscala;uniform float uRef;${propios}
      varying vec3 vColor;varying float vBrillo;
      ${RUIDO}
      void main(){vec3 p=position;float brillo=1.;${vertice}
        vColor=aColor;vBrillo=brillo;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=aTam*uEscala*clamp(uRef/max(.1,-mv.z),.35,6.);}`,
    fragmentShader: `uniform float uAlfa;varying vec3 vColor;varying float vBrillo;
      void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=smoothstep(.5,0.,d);a=a*a+pow(a,8.)*1.5;
        gl_FragColor=vec4(vColor*a*uAlfa*vBrillo,1.);${FIN_FRAG}}`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  return p;
}

/** Hablar mientras dura la línea: boca y manos (vaivén), y vuelve a su pose al terminar. */
export function hablar(a: Actor, c: ContextoToma, pose = 'reposo', cara: 'normal' | 'feliz' = 'feliz') {
  const l = c.toma.linea, desde = l?.desde ?? 0.4;
  const hasta = c.dur - 0.9;
  if (l && c.local > desde && c.local < hasta) {
    a.p.vaiven('hablar_a', 'hablar_b', 0.5 + 0.5 * Math.sin(c.t * 3.1));
    a.p.cara(Math.sin(c.t * 9.0) > -0.3 ? 'hablar' : cara);
  } else actuar(a, pose, cara);
}

/** Copia una pieza del kit muchas veces con instancias (pocas llamadas de dibujo). */
export function instanciar(pieza: THREE.Object3D, lugares: [number, number, number, number, number?][]) {
  const g = new THREE.Group();
  if (!lugares.length) return g;
  pieza.updateMatrixWorld(true);
  const inv = pieza.matrixWorld.clone().invert(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), eje = new THREE.Vector3(0, 1, 0);
  pieza.traverse((o) => {
    const malla = o as THREE.Mesh;
    if (!malla.isMesh) return;
    const local = inv.clone().multiply(malla.matrixWorld);
    const im = new THREE.InstancedMesh(malla.geometry, malla.material, lugares.length);
    lugares.forEach(([x, y, z, giro, esc = 1], i) => { m.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(eje, giro), new THREE.Vector3(esc, esc, esc)); im.setMatrixAt(i, m.clone().multiply(local)); });
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = true;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    im.userData.noLiberar = true;
    g.add(im);
  });
  return g;
}

/** Busca una pieza en un kit de la granja (un vacío «m_<clave>» por pieza) o devuelve el modelo entero. */
export const piezaKit = (kit: THREE.Object3D, clave: string) => kit.getObjectByName('m_' + clave) ?? kit.getObjectByName(clave) ?? null;


export function sendero(curva: THREE.CatmullRomCurve3, ancho: number) {
  const n = 160, pos: number[] = [], col: number[] = [], idx: number[] = [];
  const c1 = new THREE.Color('#b9915f'), c2 = new THREE.Color('#9a7448');
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curva.getPoint(t), d = curva.getTangent(t), lado = new THREE.Vector3(-d.z, 0, d.x).normalize();
    for (const s of [-1, -0.45, 0, 0.45, 1]) {
      const borde = Math.abs(s) > 0.9;
      const q = p.clone().addScaledVector(lado, s * ancho * 0.5 * (1 + Math.sin(t * 40 + s) * 0.06));
      pos.push(q.x, 0.025 - (borde ? 0.02 : 0), q.z);
      const cc = c1.clone().lerp(c2, borde ? 0.8 : Math.abs(Math.sin(t * 90 + s * 3)) * 0.35);
      col.push(cc.r, cc.g, cc.b);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j; idx.push(a, a + 5, a + 1, a + 1, a + 5, a + 6); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.receiveShadow = true;
  return m;
}


// ------------------------------------------------------------------ dirección automática de diálogos


/** Un plano (posición, a qué mira y lente). */
export const plano = (pos: V3, mira: V3, fov = 0): Plano => ({ pos, mira, fov });

/** Camina por una curva (bezier de tres puntos) con s de 0 a 1; devuelve si ya llegó. */
export function caminar(a: Actor, camino: THREE.Vector3[], s: number, t: number) {
  const k = clamp(s, 0, 1);
  const pt = bez(camino[0], camino[1], camino[2], k), q = bez(camino[0], camino[1], camino[2], Math.min(1, k + 0.01));
  a.raiz.position.copy(pt);
  if (s < 1) {
    a.raiz.rotation.y = Math.atan2(q.x - pt.x, q.z - pt.z);
    const fase = t * 7.2;
    a.p.vaiven('caminar_a', 'caminar_b', 0.5 + 0.5 * Math.sin(fase));
    a.p.cuerpo.position.y = Math.abs(Math.sin(fase)) * 0.035;
  }
  return s >= 1;
}

/** Gira al actor poco a poco hacia un punto. */
export function mirarA(a: Actor, x: number, z: number, k = 0.12) {
  const meta = Math.atan2(x - a.raiz.position.x, z - a.raiz.position.z);
  const d = Math.atan2(Math.sin(meta - a.raiz.rotation.y), Math.cos(meta - a.raiz.rotation.y));
  a.raiz.rotation.y += d * clamp(k, 0, 1);
}

/** Dónde está cada quien en una escena de diálogo (x, z) y a qué altura tiene la cabeza. */
export interface Puesto { x: number; z: number; cabeza?: number }
export interface OpcionesDialogo {
  escena: string;
  puestos: Record<string, Puesto>;
  /** Centro del grupo (para los planos generales y del narrador). */
  centro?: [number, number];
  semilla?: number;
  /** Planos propios para el narrador (si no, vuela alrededor del grupo). */
  narrador?: Plano[][];
  bloom?: number;
  prefijo?: string;
}

/** Arma las tomas de un diálogo con planos variados: medio del que habla, sobre el hombro de quien escucha, de dos y
 * general; el narrador va en planos abiertos que se mueven despacio. La toma dura lo que dure la voz. */
export function tomasDialogo(lineas: LineaCine[], o: OpcionesDialogo): Toma[] {
  const r = azar(o.semilla ?? 7);
  const ids = Object.keys(o.puestos);
  const cx = o.centro?.[0] ?? ids.reduce((a, k) => a + o.puestos[k].x, 0) / Math.max(1, ids.length);
  const cz = o.centro?.[1] ?? ids.reduce((a, k) => a + o.puestos[k].z, 0) / Math.max(1, ids.length);
  const tomas: Toma[] = [];
  let anterior = '', tipoAnterior = -1, nNarr = 0;
  lineas.forEach((l, i) => {
    const id = `${o.prefijo ?? o.escena}_${i}`;
    const P = o.puestos[l.quien];
    if (!P || l.quien === 'narrador') {
      const propio = o.narrador?.[nNarr++ % Math.max(1, o.narrador?.length ?? 1)];
      if (propio) { tomas.push({ id, dur: 5, escena: o.escena, linea: l, bloom: o.bloom, cam: { de: propio[0], a: propio[1] ?? propio[0], curva: 'ambas' } }); return; }
      const ang = r() * Math.PI * 2, d = 9 + r() * 4, h = 3.2 + r() * 2;
      const de: V3 = [cx + Math.cos(ang) * d, h, cz + Math.sin(ang) * d], a: V3 = [cx + Math.cos(ang + 0.35) * (d - 1.5), h - 0.6, cz + Math.sin(ang + 0.35) * (d - 1.5)];
      tomas.push({ id, dur: 5, escena: o.escena, linea: l, bloom: o.bloom, cam: { de: plano(de, [cx, 0.8, cz], 40), a: plano(a, [cx, 0.9, cz], 38), curva: 'ambas' } });
      return;
    }
    // A quién le habla: al último que habló, o al que esté más cerca
    let oyente = anterior && anterior !== l.quien && o.puestos[anterior] ? anterior : '';
    if (!oyente) {
      let mejor = 1e9;
      for (const k of ids) if (k !== l.quien) { const d = Math.hypot(o.puestos[k].x - P.x, o.puestos[k].z - P.z); if (d < mejor) { mejor = d; oyente = k; } }
    }
    const Q = o.puestos[oyente] ?? { x: cx, z: cz };
    const hc = P.cabeza ?? 0.95, hq = Q.cabeza ?? 0.95;
    const dx = Q.x - P.x, dz = Q.z - P.z, n = Math.hypot(dx, dz) || 1, ux = dx / n, uz = dz / n, lx = -uz, lz = ux;
    let tipo = Math.floor(r() * 4);
    if (tipo === tipoAnterior) tipo = (tipo + 1) % 4;
    if (i === 0) tipo = 2;
    tipoAnterior = tipo;
    const lado = r() < 0.5 ? -1 : 1;
    let de: Plano, a: Plano;
    if (tipo === 0) {
      // Medio corto del que habla, un poco de lado (frente a él, del lado de quien escucha)
      const bx = P.x + ux * 2.3 + lx * lado * 0.9, bz = P.z + uz * 2.3 + lz * lado * 0.9;
      de = plano([bx, hc + 0.25, bz], [P.x, hc, P.z], 34);
      a = plano([P.x + ux * 1.9 + lx * lado * 0.8, hc + 0.22, P.z + uz * 1.9 + lz * lado * 0.8], [P.x, hc + 0.02, P.z], 32);
    } else if (tipo === 1) {
      // Sobre el hombro de quien escucha
      const bx = Q.x - ux * 0.9 + lx * lado * 0.55, bz = Q.z - uz * 0.9 + lz * lado * 0.55;
      de = plano([bx - ux * 0.3, hq + 0.35, bz - uz * 0.3], [P.x, hc, P.z], 36);
      a = plano([bx, hq + 0.3, bz], [P.x, hc, P.z], 34);
    } else if (tipo === 2) {
      // De dos, de lado
      const mx = (P.x + Q.x) / 2, mz = (P.z + Q.z) / 2, d = Math.max(3.4, n * 1.6);
      de = plano([mx + lx * lado * d, 1.5, mz + lz * lado * d], [mx, 0.85, mz], 38);
      a = plano([mx + lx * lado * (d - 0.6) + ux * 0.6, 1.45, mz + lz * lado * (d - 0.6) + uz * 0.6], [mx, 0.85, mz], 36);
    } else {
      // General del grupo, bajito y con un paseo lento
      const ang = Math.atan2(P.z - cz, P.x - cx) + lado * (0.9 + r() * 0.5), d = 6.5 + r() * 2;
      de = plano([cx + Math.cos(ang) * d, 1.9, cz + Math.sin(ang) * d], [cx, 0.8, cz], 40);
      a = plano([cx + Math.cos(ang + lado * 0.18) * (d - 0.8), 1.7, cz + Math.sin(ang + lado * 0.18) * (d - 0.8)], [cx, 0.85, cz], 38);
    }
    tomas.push({ id, dur: 3.2, escena: o.escena, linea: l, bloom: o.bloom, cam: { de, a, curva: 'ambas' } });
    anterior = l.quien;
  });
  return tomas;
}

/** Anima a todo el reparto en una toma de diálogo: el que habla mueve boca y manos y mira a quien le habla; los demás
 * miran al que habla (con su pose de escucha). `poses` cambia la pose de alguien en una toma concreta. */
export function actuarDialogo(reparto: Record<string, Actor>, c: ContextoToma, poses: Record<string, string> = {}, escucha: Record<string, string> = {}) {
  const l = c.toma.linea;
  const habla = l ? reparto[l.quien] : undefined;
  for (const [k, a] of Object.entries(reparto)) {
    if (!a.raiz.visible) continue;
    if (a === habla) {
      // Mira al último que estaba mirando o al centro del grupo
      let ox = 0, oz = 0, n = 0;
      for (const [k2, b] of Object.entries(reparto)) if (k2 !== k && b.raiz.visible) { ox += b.raiz.position.x; oz += b.raiz.position.z; n++; }
      if (n) mirarA(a, ox / n, oz / n, c.dt * 3);
      hablar(a, c, poses[k] ?? 'reposo', 'feliz');
    } else {
      if (habla) mirarA(a, habla.raiz.position.x, habla.raiz.position.z, c.dt * 3);
      actuar(a, poses[k] ?? escucha[k] ?? a.p.poseQuieto ?? 'reposo', 'normal');
    }
    a.p.update(c.dt);
  }
}
