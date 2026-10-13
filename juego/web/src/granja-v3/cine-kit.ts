// La caja de herramientas del cine de la granja: lo que comparten todas las películas (azar con semilla, curvas,
// partículas suaves, hablar, instancias de los kits de Blender, senderos). Salió del prólogo (cine-prologo.ts).
import * as THREE from 'three';
import { actuar, type Actor } from './cine-actores';
import type { Cara } from '../personaje';
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
export function hablar(a: Actor, c: ContextoToma, pose = 'reposo', cara: Cara = 'feliz') {
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
  /** Lo que la cámara no puede atravesar ni tapar: círculos en el piso (x, z, radio). */
  obstaculos?: [number, number, number][];
  /** Cosas bajas (mesas): la cámara no se pone encima, pero sí puede mirar por encima de ellas. */
  bajos?: [number, number, number][];
  /** Interiores: la cámara se queda dentro de este rectángulo [xmin, xmax, zmin, zmax]. */
  dentro?: [number, number, number, number];
  /** De qué lado del grupo puede ponerse la cámara (dirección x, z); los decorados quedan al otro lado. */
  audiencia?: [number, number];
}

/** Arma las tomas de un diálogo con planos variados: medio del que habla, sobre el hombro de quien escucha, de dos y
 * general; el narrador va en planos abiertos que se mueven despacio. La toma dura lo que dure la voz. La cámara nunca
 * queda dentro de un obstáculo, ni con uno en medio, ni del lado de los decorados. */
export function tomasDialogo(lineas: LineaCine[], o: OpcionesDialogo): Toma[] {
  const r = azar(o.semilla ?? 7);
  const ids = Object.keys(o.puestos);
  const cx = o.centro?.[0] ?? ids.reduce((a, k) => a + o.puestos[k].x, 0) / Math.max(1, ids.length);
  const cz = o.centro?.[1] ?? ids.reduce((a, k) => a + o.puestos[k].z, 0) / Math.max(1, ids.length);
  const obst = o.obstaculos ?? [];
  const aud = o.audiencia ? (() => { const n = Math.hypot(...o.audiencia!) || 1; return [o.audiencia![0] / n, o.audiencia![1] / n]; })() : null;
  /** ¿Se puede poner la cámara en (x, z) mirando a (mx, mz)? */
  const valida = (x: number, z: number, mx: number, mz: number) => {
    if (aud && (x - cx) * aud[0] + (z - cz) * aud[1] < -0.6) return false;
    if (o.dentro && (x < o.dentro[0] || x > o.dentro[1] || z < o.dentro[2] || z > o.dentro[3])) return false;
    for (const [ox, oz, or] of o.bajos ?? []) if (Math.hypot(x - ox, z - oz) < or + 0.2) return false;
    for (const [ox, oz, or] of obst) {
      if (Math.hypot(x - ox, z - oz) < or + 0.3) return false;
      // Que el obstáculo no quede entre la cámara y lo que mira
      const dx = mx - x, dz = mz - z, l2 = dx * dx + dz * dz || 1, t = clamp(((ox - x) * dx + (oz - z) * dz) / l2, 0, 1);
      if (t > 0.05 && t < 0.92 && Math.hypot(x + dx * t - ox, z + dz * t - oz) < or) return false;
    }
    // Nadie muy cerca de la cámara ni tapando a quien se mira (las cabezas de peluche son grandes)
    for (const k of ids) {
      const p = o.puestos[k], d = Math.hypot(x - p.x, z - p.z);
      if (d < (o.dentro ? 1.2 : 2.1)) return false;
      if (Math.hypot(mx - p.x, mz - p.z) < 0.35) continue;
      const dx = mx - x, dz = mz - z, l2 = dx * dx + dz * dz || 1, t = clamp(((p.x - x) * dx + (p.z - z) * dz) / l2, 0, 1);
      if (t > 0.05 && t < 0.92 && Math.hypot(x + dx * t - p.x, z + dz * t - p.z) < (o.dentro ? 0.55 : 0.8)) return false;
    }
    return true;
  };
  const tomas: Toma[] = [];
  let anterior = '', tipoAnterior = -1, nNarr = 0;
  lineas.forEach((l, i) => {
    const id = `${o.prefijo ?? o.escena}_${i}`;
    const P = o.puestos[l.quien];
    if (!P || l.quien === 'narrador') {
      const propio = o.narrador?.[nNarr++ % Math.max(1, o.narrador?.length ?? 1)];
      if (propio) { tomas.push({ id, dur: 5, escena: o.escena, linea: l, bloom: o.bloom, cam: { de: propio[0], a: propio[1] ?? propio[0], curva: 'ambas' } }); return; }
      let ang = r() * Math.PI * 2;
      if (aud) ang = Math.atan2(aud[1], aud[0]) + (r() - 0.5) * 1.6;
      const d = 9 + r() * 4, h = 3.2 + r() * 2;
      const de: V3 = [cx + Math.cos(ang) * d, h, cz + Math.sin(ang) * d], a: V3 = [cx + Math.cos(ang + 0.25) * (d - 1.5), h - 0.6, cz + Math.sin(ang + 0.25) * (d - 1.5)];
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
    const hc = P.cabeza ?? 1.1, hq = Q.cabeza ?? 1.1;
    const dx = Q.x - P.x, dz = Q.z - P.z, n = Math.hypot(dx, dz) || 1, ux = dx / n, uz = dz / n, lx = -uz, lz = ux;
    const armar = (tipo: number, lado: number, k = 1): [Plano, Plano] => {
      if (tipo === 0) {
        // Medio del que habla (cabeza y torso), un poco de lado, desde donde está quien escucha
        const bx = P.x + (ux * 5.6 + lx * lado * 1.9) * k, bz = P.z + (uz * 5.6 + lz * lado * 1.9) * k;
        return [plano([bx, hc + 0.35, bz], [P.x, hc - 0.25, P.z], 30), plano([P.x + (ux * 5.1 + lx * lado * 1.8) * k, hc + 0.3, P.z + (uz * 5.1 + lz * lado * 1.8) * k], [P.x, hc - 0.22, P.z], 30)];
      }
      if (tipo === 1) {
        // Sobre el hombro de quien escucha
        const bx = Q.x + (ux * 3.0 + lx * lado * 1.5) * k, bz = Q.z + (uz * 3.0 + lz * lado * 1.5) * k;
        return [plano([bx + ux * 0.25, hq + 0.55, bz + uz * 0.25], [P.x, hc - 0.15, P.z], 32), plano([bx, hq + 0.5, bz], [P.x, hc - 0.12, P.z], 31)];
      }
      if (tipo === 2) {
        // De dos, de lado
        const mx = (P.x + Q.x) / 2, mz = (P.z + Q.z) / 2, d = Math.max(5.4, n * 1.9) * k;
        return [plano([mx + lx * lado * d, 1.75, mz + lz * lado * d], [mx, 0.95, mz], 38), plano([mx + lx * lado * (d - 0.6) + ux * 0.5, 1.7, mz + lz * lado * (d - 0.6) + uz * 0.5], [mx, 0.97, mz], 36)];
      }
      // General del grupo, bajito y con un paseo lento
      const ang = Math.atan2(P.z - cz, P.x - cx) + lado * 0.9, d = 9.5 * k;
      return [plano([cx + Math.cos(ang) * d, 2.0, cz + Math.sin(ang) * d], [cx, 0.8, cz], 40), plano([cx + Math.cos(ang + lado * 0.16) * (d - 0.8), 1.8, cz + Math.sin(ang + lado * 0.16) * (d - 0.8)], [cx, 0.85, cz], 38)];
    };
    let tipo = Math.floor(r() * 4);
    if (tipo === tipoAnterior) tipo = (tipo + 1) % 4;
    if (i === 0) tipo = 2;
    const lado0 = r() < 0.5 ? -1 : 1;
    let elegido: [Plano, Plano] | null = null;
    // Si no cabe (cuartos chicos), se intenta más cerca
    for (const kk of o.dentro ? [1, 0.75, 0.6, 0.5] : [1, 0.85]) for (let j = 0; j < 4 && !elegido; j++) for (const lado of [lado0, -lado0]) {
      if (elegido) break;
      const t = (tipo + j) % 4, [de, a] = armar(t, lado, kk);
      if (valida(de.pos[0], de.pos[2], de.mira[0], de.mira[2]) && valida(a.pos[0], a.pos[2], a.mira[0], a.mira[2])) { elegido = [de, a]; tipoAnterior = t; }
    }
    if (!elegido) {
      // Último recurso: buscar alrededor (de lejos a cerca) un punto libre desde donde se vea a quien habla
      const base = aud ? Math.atan2(aud[1], aud[0]) : Math.atan2(P.z - cz, P.x - cx);
      busca: for (const d of o.dentro ? [4.5, 3.6, 2.8, 2.2] : [9.5, 7.5, 5.5]) for (let j = 0; j < 16; j++) {
        const ang = base + (j % 2 ? 1 : -1) * Math.ceil(j / 2) * (Math.PI / 8);
        const x = P.x + Math.cos(ang) * d, z = P.z + Math.sin(ang) * d;
        if (valida(x, z, P.x, P.z)) { elegido = [plano([x, 2.0, z], [P.x, hc - 0.2, P.z], 38), plano([x + (P.x - x) * 0.08, 1.9, z + (P.z - z) * 0.08], [P.x, hc - 0.2, P.z], 36)]; break busca; }
      }
    }
    if (!elegido) {
      const ang = aud ? Math.atan2(aud[1], aud[0]) : 0;
      const d = o.dentro ? 3 : 8;
      elegido = [plano([cx + Math.cos(ang) * d, 2.4, cz + Math.sin(ang) * d], [cx, 0.8, cz], 40), plano([cx + Math.cos(ang) * (d - 0.6), 2.2, cz + Math.sin(ang) * (d - 0.6)], [cx, 0.85, cz], 38)];
    }
    tomas.push({ id, dur: 3.2, escena: o.escena, linea: l, bloom: o.bloom, cam: { de: elegido[0], a: elegido[1], curva: 'ambas' } });
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

// ------------------------------------------------------------------ escenarios: cielos, suelos, luces y efectos

export type Hora = 'dia' | 'tarde' | 'atardecer' | 'noche' | 'noche_roja';
const COLORES_CIELO: Record<Hora, { cenit: string; hor: string; sol: string; nube: string; estrellas: number }> = {
  dia: { cenit: '#3f78d0', hor: '#cfe6f4', sol: '#fff2d6', nube: '#ffffff', estrellas: 0 },
  tarde: { cenit: '#4a7fc8', hor: '#f6d9b0', sol: '#ffd9a0', nube: '#fff1e2', estrellas: 0 },
  atardecer: { cenit: '#3b3f86', hor: '#f49a6c', sol: '#ffb46e', nube: '#ffc6a8', estrellas: 0.25 },
  noche: { cenit: '#070b22', hor: '#1d2650', sol: '#b9c6ff', nube: '#2a3360', estrellas: 1 },
  noche_roja: { cenit: '#0b0510', hor: '#3a1220', sol: '#ff3b3b', nube: '#2a0f18', estrellas: 0.6 },
};

/** Cúpula de cielo con degradado, sol (o luna), nubes de fbm y estrellas que titilan. */
export function cielo(hora: Hora, sol = new THREE.Vector3(-0.5, 0.35, -0.8)) {
  const k = COLORES_CIELO[hora];
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSol: { value: sol.clone().normalize() }, uT: { value: 0 }, uCenit: { value: new THREE.Color(k.cenit) }, uHor: { value: new THREE.Color(k.hor) },
      uColSol: { value: new THREE.Color(k.sol) }, uNube: { value: new THREE.Color(k.nube) }, uEstrellas: { value: k.estrellas }, uLuna: { value: hora.startsWith('noche') ? 1 : 0 } },
    vertexShader: 'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform vec3 uSol;uniform float uT;uniform vec3 uCenit;uniform vec3 uHor;uniform vec3 uColSol;uniform vec3 uNube;uniform float uEstrellas;uniform float uLuna;varying vec3 vDir;${RUIDO}
      void main(){vec3 d=normalize(vDir);float y=d.y;vec3 c=mix(uHor,uCenit,pow(clamp(y+.02,0.,1.),.45));
        float s=max(dot(d,uSol),0.);
        if(uLuna>.5){c+=uColSol*pow(s,18.)*.25;c=mix(c,uColSol*1.4,smoothstep(.9993,.9996,s));}
        else c+=uColSol*pow(s,8.)*.35+uColSol*pow(s,700.)*1.8;
        vec3 q=floor(d*420.);float h=hash3(q);float est=step(.9965,h)*smoothstep(.0,.25,y)*(.6+.4*sin(uT*2.+h*90.));
        c+=vec3(1.,.97,.9)*est*uEstrellas;
        float nube=smoothstep(.55,.82,fbm(vec3(d.x*3.,d.y*8.,d.z*3.)+uT*.01))*smoothstep(.02,.2,y)*(1.-smoothstep(.4,.7,y));
        c=mix(c,uNube*(.7+s*.5),nube*.5);c=mix(c,uHor*.8,smoothstep(0.,-.12,y));gl_FragColor=vec4(c,1.);${FIN_FRAG}}`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 32), mat);
  m.userData.actualizar = (t: number) => { mat.uniforms.uT.value = t; };
  return m;
}

/** Suelo grande con lomas a lo lejos y manchas de color (pasto, tierra, piedra). */
export function suelo(colores: string[], semilla = 5, tam = 260, plano = 26) {
  const geo = new THREE.PlaneGeometry(tam, tam, 130, 130);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col: number[] = [], r = azar(semilla);
  const cs = colores.map((c) => new THREE.Color(c));
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
    const loma = (Math.sin(x * 0.045) * Math.cos(z * 0.038) * 0.5 + 0.5) * 8 + Math.sin(x * 0.11 + z * 0.07) * 1.4;
    p.setY(i, loma * paso(plano, plano * 3.2, d));
    const c = cs[Math.floor(r() * cs.length)].clone().lerp(cs[(i * 7) % cs.length], 0.5).multiplyScalar(0.9 + Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.08);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.receiveShadow = true;
  return m;
}

/** Sol (con sombras suaves), relleno y luz de cielo según la hora. */
export function luces(hora: Hora, sol = new THREE.Vector3(-0.5, 0.6, -0.6), radio = 24) {
  const g = new THREE.Group();
  const conf: Record<Hora, [string, number, string, number, string, string, number]> = {
    dia: ['#fff1d8', 2.6, '#dfe9ff', 1.1, '#e8f1ff', '#6e8a48', 0.9],
    tarde: ['#ffd6a0', 2.6, '#dfe6ff', 1.0, '#ffe6c8', '#5f7a40', 0.85],
    atardecer: ['#ffab6e', 2.2, '#a9b6ff', 0.9, '#ffc9a0', '#4a3a48', 0.75],
    noche: ['#a9b8ff', 1.25, '#6a7ab8', 0.7, '#5a6ab0', '#22223a', 0.85],
    noche_roja: ['#ff6a5a', 0.7, '#5a3050', 0.4, '#5a2030', '#140a10', 0.45],
  };
  const [cs, is, cr, ir, ch, cg, ih] = conf[hora];
  const luz = new THREE.DirectionalLight(cs, is);
  luz.position.copy(sol).normalize().multiplyScalar(60);
  luz.castShadow = true;
  luz.shadow.mapSize.set(2048, 2048);
  Object.assign(luz.shadow.camera, { left: -radio, right: radio, top: radio, bottom: -radio, near: 1, far: 160 });
  luz.shadow.bias = -0.0004;
  luz.shadow.normalBias = 0.03;
  const relleno = new THREE.DirectionalLight(cr, ir);
  relleno.position.set(-sol.x * 20, 12, -sol.z * 20 + 10);
  g.add(luz, luz.target, relleno, new THREE.HemisphereLight(ch, cg, ih));
  return g;
}

/** Luz cálida que titila (velas, faroles, fogatas). */
export function luzCalida(color = '#ffb35a', fuerza = 2.2, alcance = 7) {
  const l = new THREE.PointLight(color, fuerza, alcance, 1.8);
  const base = fuerza, fase = Math.random() * 10;
  l.userData.actualizar = (t: number) => { l.intensity = base * (0.86 + 0.1 * Math.sin(t * 11 + fase) + 0.06 * Math.sin(t * 23.7 + fase * 2)); };
  return l;
}

/** Fuego de fogata con chispas (partículas) y su luz. */
export function fogata(escala = 1, semilla = 41) {
  const g = new THREE.Group();
  const r = azar(semilla);
  const llamas = puntosSuaves(160, (i, pos, col, tam, fase) => {
    pos.set([(r() - 0.5) * 0.5 * escala, 0, (r() - 0.5) * 0.5 * escala], i * 3);
    col.set(r() < 0.5 ? [1, 0.55, 0.15] : [1, 0.82, 0.35], i * 3);
    tam[i] = (5 + r() * 6) * escala;
    fase[i] = r();
  }, `float h=fract(uT*(.9+aFase*.6)+aFase);p=position*(1.-h*.7)+vec3(sin(uT*7.+aFase*30.)*.06,h*1.3*${escala.toFixed(2)},0.);brillo=(1.-h)*(1.-h)*1.4;`, {});
  const chispas = puntosSuaves(60, (i, pos, col, tam, fase) => {
    pos.set([(r() - 0.5) * 0.4 * escala, 0, (r() - 0.5) * 0.4 * escala], i * 3);
    col.set([1, 0.7, 0.3], i * 3);
    tam[i] = 1.4 + r() * 1.4;
    fase[i] = r();
  }, `float h=fract(uT*(.25+aFase*.2)+aFase);p=position+vec3(sin(uT+aFase*20.)*h*.6,h*3.5*${escala.toFixed(2)},cos(uT*.7+aFase*13.)*h*.6);brillo=(1.-h)*step(.02,h);`, {});
  const luz = luzCalida('#ff9a4a', 3 * escala, 9 * escala);
  luz.position.y = 0.6 * escala;
  g.add(llamas, chispas, luz);
  g.userData.actualizar = (t: number, alto: number) => {
    for (const m of [llamas.material, chispas.material] as THREE.ShaderMaterial[]) { m.uniforms.uT.value = t; m.uniforms.uEscala.value = alto / 720; }
    luz.userData.actualizar(t);
  };
  return g;
}

/** Bruma o ceniza flotando alrededor de un centro. */
export function motasFlotantes(n: number, centro: V3, radio: number, alto: number, color: [number, number, number], tam = 2.2, semilla = 13) {
  const r = azar(semilla);
  const m = puntosSuaves(n, (i, pos, col, t, fase) => {
    pos.set([centro[0] + (r() - 0.5) * radio * 2, centro[1] + r() * alto, centro[2] + (r() - 0.5) * radio * 2], i * 3);
    col.set(color, i * 3);
    t[i] = tam * (0.6 + r());
    fase[i] = r() * 6.28;
  }, 'p+=vec3(sin(uT*.25+aFase)*.9,sin(uT*.4+aFase*2.)*.3,cos(uT*.2+aFase)*.9);brillo=.45+.55*sin(uT*1.7+aFase*5.);', {});
  m.userData.actualizar = (t: number, altoPx: number) => { const u = (m.material as THREE.ShaderMaterial).uniforms; u.uT.value = t; u.uEscala.value = altoPx / 720; };
  return m;
}

/** La Constelación de los Amantes: dos manos entrelazadas hechas de estrellas, con sus líneas suaves. `brillo` 0-1. */
export function constelacionAmantes(radio = 300) {
  // Dos manos estilizadas (dedos hacia arriba) que se cruzan en el centro: puntos en un plano de 2 × 1.4
  const izq: [number, number][] = [[-0.95, -0.7], [-0.7, -0.35], [-0.55, 0.05], [-0.62, 0.45], [-0.45, 0.62], [-0.3, 0.5], [-0.18, 0.66], [-0.05, 0.48], [0.08, 0.2]];
  const der: [number, number][] = izq.map(([x, y]) => [-x, y]);
  const pts = [...izq, ...der];
  const pos = new Float32Array(pts.length * 3);
  pts.forEach(([x, y], i) => pos.set([x * 55, 150 + y * 55, -radio], i * 3));
  const g = new THREE.Group();
  const estrellas = puntosSuaves(pts.length, (i, p, col, tam, fase) => { p.set(pos.subarray(i * 3, i * 3 + 3), i * 3); col.set([1, 0.92, 0.75], i * 3); tam[i] = 14 + (i % 3) * 4; fase[i] = i; },
    'brillo=uBrillo*(.75+.25*sin(uT*2.+aFase));', { uBrillo: { value: 1 } }, 300);
  const idx: number[] = [];
  for (let i = 0; i < izq.length - 1; i++) { idx.push(i, i + 1); idx.push(izq.length + i, izq.length + i + 1); }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  lg.setIndex(idx);
  const lineas = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#ffe0a8', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  g.add(estrellas, lineas);
  g.userData.actualizar = (t: number, altoPx: number, brillo: number) => {
    const u = (estrellas.material as THREE.ShaderMaterial).uniforms;
    u.uT.value = t; u.uEscala.value = altoPx / 720; u.uBrillo.value = brillo;
    (lineas.material as THREE.LineBasicMaterial).opacity = 0.35 * brillo;
  };
  return g;
}

/** Pone una copia de una pieza de un kit (con sombras) en x, z, girada y escalada. */
export function poner(kit: THREE.Object3D, clave: string, x: number, z: number, giro = 0, esc = 1, y = 0, asentar = true) {
  const p = piezaKit(kit, clave);
  if (!p) { console.warn('cine: falta la pieza', clave); return new THREE.Group(); }
  const c = p.clone(true);
  c.position.set(x, y, z);
  c.rotation.set(0, giro, 0);
  c.scale.setScalar(esc);
  // Que quede parada en el piso (algunos kits traen el origen en el centro de la pieza)
  if (asentar) { c.updateMatrixWorld(true); const caja = new THREE.Box3().setFromObject(c); if (Number.isFinite(caja.min.y)) c.position.y += y - caja.min.y; }
  c.userData.noLiberar = true;
  c.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return c;
}

/** Actualiza todo lo que tenga `userData.actualizar` (cielos, luces, fuegos, motas). */
export function animarTodo(g: THREE.Object3D, t: number, altoPx: number) {
  g.traverse((o) => { const f = o.userData.actualizar as ((t: number, a: number, b?: number) => void) | undefined; if (f && !o.userData.manual) f(t, altoPx); });
}
