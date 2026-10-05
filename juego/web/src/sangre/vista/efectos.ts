// Efectos de pelea dibujados con sombreadores sencillos: tajos en arco, estocadas, conos de fuego y sonido, ondas que
// crecen, rayos encadenados, columnas de luz, explosiones, las zonas del piso (ácido, fuego, hielo, agua bendita,
// pantano, humo…) y los avisos rojos de los golpes que vienen. Piscinas por tipo: nada se crea cuadro a cuadro.
import * as THREE from 'three';

const PLANO = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
const RAYA = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0);
const COLUMNA = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true).translate(0, 0.5, 0);

const FIN = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
`;
const RUIDO = /* glsl */ `
  float hE( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
  float nE( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
    return mix( mix( hE( i ), hE( i + vec2( 1, 0 ) ), f.x ), mix( hE( i + vec2( 0, 1 ) ), hE( i + vec2( 1, 1 ) ), f.x ), f.y ); }
`;

/** Arco (tajo) y sector (cono): el ángulo va como en la simulación (atan2 de y de la simulación, x). */
const FRAG_ARCO = /* glsl */ `
  uniform float uAng; uniform float uArco; uniform float uProg; uniform vec3 uColor; uniform float uTipo; uniform float uTiempo;
  varying vec2 vUv;
  ${RUIDO}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length( p );
    if ( r > 1.0 ) discard;
    float a = atan( -p.y, p.x ) - uAng;
    a = mod( a + 3.14159265, 6.2831853 ) - 3.14159265;
    float medio = uArco * 0.5;
    if ( abs( a ) > medio ) discard;
    float alfa;
    vec3 col = uColor;
    if ( uTipo < 0.5 ) {
      // Tajo: una media luna que barre de un lado al otro y se apaga
      float barrido = clamp( uProg * 2.6, 0.0, 1.0 );
      float pos = ( a + medio ) / max( uArco, 0.001 );
      if ( pos > barrido ) discard;
      float cola = smoothstep( barrido - 0.75, barrido, pos );
      float banda = smoothstep( 0.45, 0.92, r ) * ( 1.0 - smoothstep( 0.96, 1.0, r ) );
      alfa = banda * cola * ( 1.0 - smoothstep( 0.35, 1.0, uProg ) );
      col = mix( uColor, vec3( 1.0 ), smoothstep( 0.85, 1.0, cola ) * 0.6 );
    } else if ( uTipo < 1.5 ) {
      // Cono de fuego / chispas: llamas con ruido que avanzan
      float n = nE( vec2( r * 6.0 - uTiempo * 9.0, a * 5.0 ) );
      float frente = smoothstep( 0.0, 0.25, uProg ) ;
      alfa = ( 1.0 - r ) * 0.6 + n * 0.5;
      alfa *= smoothstep( frente + 0.05, frente - 0.2, r - 0.6 * frente ) * ( 1.0 - smoothstep( 0.4, 1.0, uProg ) );
      alfa *= 1.0 - smoothstep( medio * 0.7, medio, abs( a ) );
      col = mix( uColor, vec3( 1.0, 0.95, 0.7 ), ( 1.0 - r ) * 0.6 );
    } else {
      // Cono de sonido / fogonazo: anillos que se alejan
      float ondas = 0.5 + 0.5 * sin( r * 22.0 - uProg * 30.0 );
      alfa = ondas * smoothstep( 1.0, 0.2, r ) * ( 1.0 - uProg ) * 0.8;
      alfa *= 1.0 - smoothstep( medio * 0.6, medio, abs( a ) );
    }
    gl_FragColor = vec4( col * 2.2, alfa );
    ${FIN}
  }
`;

const FRAG_RAYA = /* glsl */ `
  uniform float uProg; uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float l = vUv.x;
    float w = abs( vUv.y - 0.5 ) * 2.0;
    float avance = clamp( uProg * 3.0, 0.0, 1.0 );
    if ( l > avance ) discard;
    float punta = 1.0 - smoothstep( 0.6, 1.0, l / max( avance, 0.001 ) ) * 0.5;
    float alfa = ( 1.0 - smoothstep( 0.2 + 0.6 * ( 1.0 - l ), 1.0, w ) ) * punta * ( 1.0 - smoothstep( 0.3, 1.0, uProg ) );
    gl_FragColor = vec4( mix( uColor, vec3( 1.0 ), 1.0 - w ) * 2.0, alfa );
    ${FIN}
  }
`;

const FRAG_ONDA = /* glsl */ `
  uniform float uProg; uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length( p );
    float frente = 0.15 + uProg * 0.85;
    float banda = smoothstep( frente - 0.18, frente, r ) * ( 1.0 - smoothstep( frente, frente + 0.03, r ) );
    float alfa = banda * ( 1.0 - uProg ) + ( 1.0 - smoothstep( 0.0, frente, r ) ) * 0.12 * ( 1.0 - uProg );
    if ( alfa < 0.01 ) discard;
    gl_FragColor = vec4( uColor * 2.0, alfa );
    ${FIN}
  }
`;

/** Zonas del piso: 0 ácido, 1 fuego, 2 hielo, 3 sagrada, 4 veneno, 5 pantano, 6 humo, 7 sangre, 8 sombra, 9 tótem, 10 luz, 11 peligro. */
const FRAG_ZONA = /* glsl */ `
  uniform float uTipo; uniform float uVida; uniform float uTiempo; uniform float uAviso; uniform vec3 uColor; uniform float uSemilla;
  varying vec2 vUv;
  ${RUIDO}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length( p );
    if ( r > 1.0 ) discard;
    float borde = smoothstep( 1.0, 0.82, r );
    float n = nE( p * 3.0 + uSemilla + vec2( uTiempo * 0.4, -uTiempo * 0.3 ) ) * 0.6 + nE( p * 7.0 - uTiempo * 0.7 ) * 0.4;
    float alfa;
    vec3 col = uColor;
    if ( uTipo > 10.5 ) {
      // Aviso de peligro: el círculo se llena hasta que pega
      float lleno = step( r, uAviso );
      float aro = smoothstep( 0.9, 0.97, r ) * ( 1.0 - smoothstep( 0.98, 1.0, r ) );
      alfa = aro * 0.9 + lleno * 0.35 + 0.08;
      col = mix( vec3( 1.0, 0.1, 0.05 ), vec3( 1.0, 0.5, 0.2 ), lleno );
      alfa *= uVida;
    } else {
      alfa = borde * ( 0.35 + n * 0.55 ) * uVida;
      if ( uTipo > 0.5 && uTipo < 1.5 ) { col = mix( vec3( 1.0, 0.25, 0.02 ), vec3( 1.0, 0.85, 0.3 ), n ) * 1.6; alfa *= 0.9; }
      else if ( uTipo > 5.5 && uTipo < 6.5 ) { col = vec3( 0.25 ) * ( 0.6 + n ); alfa = borde * 0.7 * uVida; }
      else col *= 0.6 + n * 0.9;
      // Burbujas o destellos
      float b = step( 0.93, hE( floor( ( p + uTiempo * 0.05 ) * 9.0 ) + uSemilla ) );
      col += b * uColor * 0.8;
    }
    gl_FragColor = vec4( col, alfa );
    ${FIN}
  }
`;

const FRAG_COLUMNA = /* glsl */ `
  uniform float uProg; uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float alfa = ( 1.0 - vUv.y ) * ( 1.0 - uProg ) * ( 0.55 + 0.45 * sin( vUv.x * 40.0 + uProg * 20.0 ) );
    gl_FragColor = vec4( uColor * 2.5, alfa );
    ${FIN}
  }
`;

const FRAG_RAYO = /* glsl */ `
  uniform float uProg; uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float w = abs( vUv.y - 0.5 ) * 2.0;
    float alfa = ( 1.0 - w * w ) * ( 1.0 - uProg );
    gl_FragColor = vec4( mix( uColor, vec3( 1.0 ), 1.0 - w ) * 2.4, alfa );
    ${FIN}
  }
`;

interface Activo {
  malla: THREE.Mesh;
  t: number;
  dur: number;
  sigue?: () => { x: number; z: number } | null;
}

class Piscina {
  libres: THREE.Mesh[] = [];
  activos: Activo[] = [];
  constructor(private hacer: () => THREE.Mesh, private padre: THREE.Object3D) {}
  sacar(dur: number): Activo {
    const m = this.libres.pop() ?? this.hacer();
    if (!m.parent) this.padre.add(m);
    m.visible = true;
    const a = { malla: m, t: 0, dur };
    this.activos.push(a);
    return a;
  }
  actualizar(dt: number, cada?: (a: Activo, u: number) => void) {
    for (let k = this.activos.length - 1; k >= 0; k--) {
      const a = this.activos[k];
      a.t += dt;
      const u = Math.min(1, a.t / a.dur);
      (a.malla.material as THREE.ShaderMaterial).uniforms.uProg.value = u;
      if (a.sigue) {
        const p = a.sigue();
        if (p) a.malla.position.set(p.x, a.malla.position.y, p.z);
      }
      cada?.(a, u);
      if (u >= 1) {
        a.malla.visible = false;
        this.libres.push(a.malla);
        this.activos.splice(k, 1);
      }
    }
  }
}

const sombreador = (frag: string, uniforms: Record<string, THREE.IUniform>, geo: THREE.BufferGeometry, orden = 6, aditivo = true) => () => {
  const m = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(uniforms),
      vertexShader: VERT,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
      side: THREE.DoubleSide,
    }),
  );
  m.renderOrder = orden;
  m.frustumCulled = false;
  return m;
};

const U_BASE = { uProg: { value: 0 }, uColor: { value: new THREE.Color() } };

export class Efectos {
  grupo = new THREE.Group();
  private arcos: Piscina;
  private rayas: Piscina;
  private ondas: Piscina;
  private columnas: Piscina;
  private rayos: Piscina;
  private zonas = new Map<number, THREE.Mesh>();
  private zonasLibres: THREE.Mesh[] = [];
  private hacerZona: () => THREE.Mesh;
  private tiempo = { value: 0 };

  constructor() {
    this.arcos = new Piscina(sombreador(FRAG_ARCO, { ...U_BASE, uAng: { value: 0 }, uArco: { value: 1 }, uTipo: { value: 0 }, uTiempo: { value: 0 } }, PLANO, 9), this.grupo);
    this.rayas = new Piscina(sombreador(FRAG_RAYA, U_BASE, RAYA, 9), this.grupo);
    this.ondas = new Piscina(sombreador(FRAG_ONDA, U_BASE, PLANO, 6), this.grupo);
    this.columnas = new Piscina(sombreador(FRAG_COLUMNA, U_BASE, COLUMNA, 9), this.grupo);
    this.rayos = new Piscina(() => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 2 * 3), 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(14 * 2 * 2), 2));
      const idx: number[] = [];
      for (let k = 0; k < 13; k++) idx.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
      geo.setIndex(idx);
      return sombreador(FRAG_RAYO, U_BASE, geo, 9)();
    }, this.grupo);
    this.hacerZona = sombreador(FRAG_ZONA, { uTipo: { value: 0 }, uVida: { value: 1 }, uTiempo: { value: 0 }, uAviso: { value: 0 }, uColor: { value: new THREE.Color() }, uSemilla: { value: 0 } }, PLANO, 2, false);
  }

  /** Tajo en arco alrededor de (x, z). */
  tajo(x: number, z: number, ang: number, radio: number, arco: number, color: THREE.ColorRepresentation, dur = 0.32) {
    const a = this.arcos.sacar(dur);
    const u = (a.malla.material as THREE.ShaderMaterial).uniforms;
    u.uAng.value = ang;
    u.uArco.value = Math.min(Math.PI * 2, arco + 0.2);
    u.uTipo.value = 0;
    u.uColor.value.set(color);
    a.malla.position.set(x, 0.55, z);
    a.malla.scale.setScalar(radio + 0.15);
    return a;
  }

  /** Cono (fuego, chispas: tipo 1; sonido, fogonazo: tipo 2). */
  cono(x: number, z: number, ang: number, largo: number, arco: number, color: THREE.ColorRepresentation, tipo: 1 | 2, dur = 0.35) {
    const a = this.arcos.sacar(dur);
    const u = (a.malla.material as THREE.ShaderMaterial).uniforms;
    u.uAng.value = ang;
    u.uArco.value = arco + 0.25;
    u.uTipo.value = tipo;
    u.uColor.value.set(color);
    a.malla.position.set(x, 0.5, z);
    a.malla.scale.setScalar(largo);
  }

  /** Estocada o latigazo: una raya desde (x, z) hacia el ángulo. */
  raya(x: number, z: number, ang: number, largo: number, ancho: number, color: THREE.ColorRepresentation, dur = 0.26) {
    const a = this.rayas.sacar(dur);
    (a.malla.material as THREE.ShaderMaterial).uniforms.uColor.value.set(color);
    a.malla.position.set(x, 0.6, z);
    a.malla.rotation.set(0, -ang, 0);
    a.malla.scale.set(largo, 1, ancho + 0.2);
  }

  /** Onda que crece desde (x, z). */
  onda(x: number, z: number, radio: number, color: THREE.ColorRepresentation, dur = 0.45, y = 0.08) {
    const a = this.ondas.sacar(dur);
    (a.malla.material as THREE.ShaderMaterial).uniforms.uColor.value.set(color);
    a.malla.position.set(x, y, z);
    a.malla.scale.setScalar(radio);
    return a;
  }

  /** Columna de luz (rayo de luz, yunque, campana). */
  columna(x: number, z: number, radio: number, alto: number, color: THREE.ColorRepresentation, dur = 0.5) {
    const a = this.columnas.sacar(dur);
    (a.malla.material as THREE.ShaderMaterial).uniforms.uColor.value.set(color);
    a.malla.position.set(x, 0, z);
    a.malla.scale.set(radio, alto, radio);
  }

  /** Rayo quebrado entre dos puntos. */
  rayo(x0: number, z0: number, x1: number, z1: number, color: THREE.ColorRepresentation, ancho = 0.18, dur = 0.22, y = 0.8) {
    const a = this.rayos.sacar(dur);
    (a.malla.material as THREE.ShaderMaterial).uniforms.uColor.value.set(color);
    a.malla.position.set(0, 0, 0);
    const geo = a.malla.geometry;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
    const dx = x1 - x0, dz = z1 - z0;
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l, nz = dx / l;
    for (let k = 0; k < 14; k++) {
      const u = k / 13;
      const j = k === 0 || k === 13 ? 0 : (Math.random() - 0.5) * Math.min(0.9, l * 0.15);
      const px = x0 + dx * u + nx * j, pz = z0 + dz * u + nz * j;
      pos.setXYZ(k * 2, px + nx * ancho, y, pz + nz * ancho);
      pos.setXYZ(k * 2 + 1, px - nx * ancho, y, pz - nz * ancho);
      uv.setXY(k * 2, u, 0);
      uv.setXY(k * 2 + 1, u, 1);
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    geo.computeBoundingSphere();
  }

  /** Pone, mueve o quita las zonas del piso según la simulación. */
  zonasDe(zonas: { vivo: boolean; id: number; tipo: number; x: number; y: number; r: number; t: number; vida: number; total: number; retraso: number; enemiga: boolean }[], colores: Record<number, THREE.Color>) {
    const vistas = new Set<number>();
    for (const z of zonas) {
      if (!z.vivo) continue;
      vistas.add(z.id);
      let m = this.zonas.get(z.id);
      if (!m) {
        m = this.zonasLibres.pop() ?? this.hacerZona();
        if (!m.parent) this.grupo.add(m);
        m.visible = true;
        const u = (m.material as THREE.ShaderMaterial).uniforms;
        u.uSemilla.value = Math.random() * 50;
        u.uTiempo = this.tiempo;
        this.zonas.set(z.id, m);
      }
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      const peligro = z.enemiga && z.retraso > 0;
      u.uTipo.value = peligro ? 11 : z.tipo;
      u.uColor.value.copy(colores[z.tipo] ?? colores[0]);
      const resta = z.total - z.t;
      u.uVida.value = Math.min(1, z.t * 4, resta * 2.5);
      u.uAviso.value = peligro ? Math.min(1, z.t / Math.max(0.01, z.retraso)) : 0;
      m.position.set(z.x, 0.035 + (z.id % 7) * 0.002, z.y);
      m.scale.setScalar(z.r);
    }
    for (const [id, m] of this.zonas) {
      if (vistas.has(id)) continue;
      m.visible = false;
      this.zonasLibres.push(m);
      this.zonas.delete(id);
    }
  }

  actualizar(dt: number, t: number) {
    this.tiempo.value = t;
    this.arcos.actualizar(dt, (a) => ((a.malla.material as THREE.ShaderMaterial).uniforms.uTiempo.value = t));
    this.rayas.actualizar(dt);
    this.ondas.actualizar(dt);
    this.columnas.actualizar(dt);
    this.rayos.actualizar(dt);
  }

  limpiar() {
    for (const p of [this.arcos, this.rayas, this.ondas, this.columnas, this.rayos]) for (const a of p.activos) a.t = a.dur;
    this.actualizar(0, this.tiempo.value);
  }
}
