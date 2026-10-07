// Efectos de pelea dibujados con sombreadores sencillos: tajos en arco, estocadas, conos de fuego y sonido, ondas que
// crecen, rayos encadenados, columnas de luz, explosiones, las zonas del piso (ácido, fuego, hielo, agua bendita,
// pantano, humo…) y los avisos rojos de los golpes que vienen. Piscinas por tipo: nada se crea cuadro a cuadro.
import * as THREE from 'three';

const PLANO = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
const RAYA = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0);
const COLUMNA = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true).translate(0, 0.5, 0);
/** El aura: un poco más ancha arriba (como una llama que se abre) y con más lados (el contorno se ve liso). */
const AURA = new THREE.CylinderGeometry(1.15, 0.85, 1, 28, 1, true).translate(0, 0.5, 0);

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

/** El aura dorada de subir de nivel: un manto de luz que sube por el personaje con vetas que corren hacia arriba, entra
 *  rápido y se apaga despacio (lo acompaña mientras camina). */
const VERT_AURA = /* glsl */ `
  varying vec2 vUv; varying float vBorde;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4( position, 1.0 );
    vec3 n = normalize( normalMatrix * normal );
    // Brilla en el contorno (de canto a la cámara) y deja ver al personaje por el medio
    vBorde = 1.0 - abs( dot( n, normalize( -mv.xyz ) ) );
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG_AURA = /* glsl */ `
  uniform float uProg; uniform vec3 uColor; uniform float uTiempo;
  varying vec2 vUv; varying float vBorde;
  ${RUIDO}
  void main() {
    float y = vUv.y;
    float entra = smoothstep( 0.0, 0.08, uProg );
    float sale = 1.0 - smoothstep( 0.4, 1.0, uProg );
    // La luz sube: la parte de arriba aparece un poco después que la de abajo
    float sube = smoothstep( y - 0.3, y + 0.02, uProg * 2.4 );
    // Vetas que corren hacia arriba (llamitas de luz)
    float n = nE( vec2( vUv.x * 22.0, y * 4.0 - uTiempo * 3.2 ) );
    float vetas = smoothstep( 0.35, 0.85, n );
    float contorno = pow( vBorde, 1.6 );
    float alfa = pow( 1.0 - y, 1.2 ) * ( 0.1 + 0.9 * contorno ) * ( 0.35 + 0.65 * vetas ) * entra * sale * sube;
    vec3 col = mix( uColor, vec3( 1.0, 0.96, 0.8 ), 0.35 * ( 1.0 - y ) * vetas );
    gl_FragColor = vec4( col * 1.9, alfa );
    ${FIN}
  }
`;

/** El haz de la Campana de Extracción: una columna alta que no se apaga mientras la campana está abajo. */
const FRAG_HAZ = /* glsl */ `
  uniform vec3 uColor; uniform float uTiempo; uniform float uFuerza;
  varying vec2 vUv;
  ${RUIDO}
  void main() {
    float y = vUv.y;
    float n = nE( vec2( vUv.x * 14.0, y * 5.0 - uTiempo * 1.4 ) );
    // Más fuerte abajo y en el centro del cilindro (los bordes se ven de canto: se apagan para no hacer una pared blanca)
    float canto = 0.35 + 0.65 * pow( abs( sin( vUv.x * 3.14159265 * 2.0 ) ), 0.5 );
    float alfa = pow( 1.0 - y, 2.0 ) * ( 0.35 + 0.45 * n ) * uFuerza * canto * ( 0.85 + 0.15 * sin( uTiempo * 2.6 ) );
    gl_FragColor = vec4( uColor * 1.3, alfa );
    ${FIN}
  }
`;

/** El círculo de la campana en el piso: borde que late, relleno suave, ondas que suben hacia el centro y la cuenta
 *  regresiva como un arco que se va vaciando (rojo cuando quedan pocos segundos). */
const FRAG_ANILLO = /* glsl */ `
  uniform vec3 uColor; uniform float uTiempo; uniform float uResto; uniform float uUrge;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length( p );
    if ( r > 1.0 ) discard;
    vec3 col = mix( uColor, vec3( 1.0, 0.25, 0.15 ), uUrge );
    float pulso = 0.5 + 0.5 * sin( uTiempo * mix( 3.0, 10.0, uUrge ) );
    float borde = smoothstep( 0.84, 0.92, r ) * ( 1.0 - smoothstep( 0.96, 1.0, r ) );
    float a = atan( p.x, -p.y ) / 6.2831853 + 0.5;
    float queda = step( a, uResto );
    float arco = smoothstep( 0.74, 0.79, r ) * ( 1.0 - smoothstep( 0.81, 0.86, r ) ) * queda;
    float onda = smoothstep( 0.035, 0.0, abs( r - ( 1.0 - fract( uTiempo * 0.45 ) ) ) ) * 0.45;
    float alfa = borde * ( 0.6 + 0.4 * pulso ) + arco * 0.85 + onda * 0.6 + 0.04;
    gl_FragColor = vec4( col * 1.25, alfa * 0.85 );
    ${FIN}
  }
`;

/** El área de lo que se abre o se libera (cofres, santuarios, prisioneros): un borde punteado que gira despacio y,
 *  mientras alguien lo usa, un arco grueso que se va llenando (la barrita de progreso en el piso). */
const FRAG_USO = /* glsl */ `
  uniform vec3 uColor; uniform float uTiempo; uniform float uLleno; uniform float uFuerza;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length( p );
    if ( r > 1.0 ) discard;
    // (empieza arriba y se llena como las agujas del reloj, visto desde la cámara)
    float a = atan( -p.x, -p.y ) / 6.2831853 + 0.5;
    float trazo = step( 0.42, fract( a * 26.0 - uTiempo * 0.3 ) );
    float borde = smoothstep( 0.89, 0.93, r ) * ( 1.0 - smoothstep( 0.97, 1.0, r ) ) * ( 0.3 + 0.7 * trazo );
    float banda = smoothstep( 0.71, 0.75, r ) * ( 1.0 - smoothstep( 0.84, 0.88, r ) );
    float usando = step( 0.001, uLleno );
    float arco = banda * step( a, uLleno );
    // La punta del arco brilla más (se ve avanzar)
    float punta = banda * smoothstep( 0.05, 0.0, uLleno - a ) * step( a, uLleno );
    float brillo = 0.85 + 0.15 * sin( uTiempo * 8.0 );
    float alfa = borde * uFuerza * ( 0.32 + 0.38 * usando ) + arco * brillo + punta * 0.6 + banda * usando * 0.07 + usando * 0.04;
    gl_FragColor = vec4( mix( uColor, vec3( 1.0 ), punta * 0.6 ) * 1.15, alfa );
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
  /** Deja una lista (escondida) para que su sombreador se compile detrás de la pantalla de carga. */
  precalentar() {
    if (this.libres.length || this.activos.length) return;
    const m = this.hacer();
    m.visible = false;
    this.padre.add(m);
    this.libres.push(m);
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
  private auras: Piscina;
  private zonas = new Map<number, THREE.Mesh>();
  /** El haz (adentro y su halo) y el círculo de la campana: uno solo, se crea la primera vez. */
  private campanaMallas: { haz: THREE.Mesh; halo: THREE.Mesh; anillo: THREE.Mesh } | null = null;
  private zonasLibres: THREE.Mesh[] = [];
  /** Los anillos de lo que se abre o se libera (por id de la entidad). */
  private usos = new Map<number, THREE.Mesh>();
  private usosLibres: THREE.Mesh[] = [];
  private hacerZona: () => THREE.Mesh;
  private tiempo = { value: 0 };

  constructor() {
    this.arcos = new Piscina(sombreador(FRAG_ARCO, { ...U_BASE, uAng: { value: 0 }, uArco: { value: 1 }, uTipo: { value: 0 }, uTiempo: { value: 0 } }, PLANO, 9), this.grupo);
    this.rayas = new Piscina(sombreador(FRAG_RAYA, U_BASE, RAYA, 9), this.grupo);
    this.ondas = new Piscina(sombreador(FRAG_ONDA, U_BASE, PLANO, 6), this.grupo);
    this.columnas = new Piscina(sombreador(FRAG_COLUMNA, U_BASE, COLUMNA, 9), this.grupo);
    this.auras = new Piscina(() => {
      const m = sombreador(FRAG_AURA, { ...U_BASE, uTiempo: { value: 0 } }, AURA, 9)();
      const mat = m.material as THREE.ShaderMaterial;
      mat.vertexShader = VERT_AURA;
      mat.uniforms.uTiempo = this.tiempo;
      return m;
    }, this.grupo);
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

  /** Aura dorada de subir de nivel alrededor de (x, z); `sigue` la lleva con el personaje mientras dura. */
  aura(x: number, z: number, sigue: () => { x: number; z: number } | null, color: THREE.ColorRepresentation = '#ffd36a', dur = 1.5) {
    const a = this.auras.sacar(dur);
    (a.malla.material as THREE.ShaderMaterial).uniforms.uColor.value.set(color);
    a.malla.position.set(x, 0, z);
    a.malla.scale.set(0.7, 2.2, 0.7);
    a.sigue = sigue;
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

  /** La marca de la Campana de Extracción mientras está abajo (null o est 2: se quita). `resto` va de 1 a 0. */
  marcaCampana(c: { x: number; y: number; est: number } | null, radio: number, resto: number, urge: boolean) {
    if (!c || c.est >= 2) {
      if (this.campanaMallas) for (const m of Object.values(this.campanaMallas)) m.visible = false;
      return;
    }
    if (!this.campanaMallas) {
      const u = () => ({ uColor: { value: new THREE.Color('#ffd890') }, uTiempo: { value: 0 }, uFuerza: { value: 1 }, uResto: { value: 1 }, uUrge: { value: 0 } });
      const haz = sombreador(FRAG_HAZ, u(), COLUMNA, 9)();
      const halo = sombreador(FRAG_HAZ, u(), COLUMNA, 8)();
      const anillo = sombreador(FRAG_ANILLO, u(), PLANO, 3)();
      // (todas leen el mismo reloj de los efectos)
      for (const m of [haz, halo, anillo]) (m.material as THREE.ShaderMaterial).uniforms.uTiempo = this.tiempo;
      this.campanaMallas = { haz, halo, anillo };
      this.grupo.add(haz, halo, anillo);
    }
    const { haz, halo, anillo } = this.campanaMallas;
    for (const m of [haz, halo, anillo]) m.visible = true;
    // Mientras baja, el haz es más fuerte (se ve desde lejos); después se queda encendido
    // (no muy alto: con la cámara inclinada, una columna altísima se viene encima de la pantalla y tapa todo)
    const fuerza = c.est === 0 ? 1.15 : 0.85;
    haz.position.set(c.x, 0, c.y);
    haz.scale.set(0.75, 16, 0.75);
    (haz.material as THREE.ShaderMaterial).uniforms.uFuerza.value = fuerza;
    halo.position.set(c.x, 0, c.y);
    halo.scale.set(1.5, 11, 1.5);
    (halo.material as THREE.ShaderMaterial).uniforms.uFuerza.value = fuerza * 0.3;
    anillo.position.set(c.x, 0.06, c.y);
    anillo.scale.setScalar(radio);
    const ua = (anillo.material as THREE.ShaderMaterial).uniforms;
    ua.uResto.value = Math.max(0, Math.min(1, resto));
    ua.uUrge.value = urge ? 1 : 0;
  }

  /** Los anillos de las cosas que se abren o se liberan cerca: `lleno` 0-1 (0 = nadie lo usa), `fuerza` según lo
   *  cerca que esté el jugador (lejos no se dibuja). */
  marcasUso(lista: { id: number; x: number; y: number; r: number; lleno: number; fuerza: number; color: THREE.Color }[]) {
    const vistas = new Set<number>();
    for (const u of lista) {
      if (u.fuerza <= 0.01 && u.lleno <= 0) continue;
      vistas.add(u.id);
      let m = this.usos.get(u.id);
      if (!m) {
        m = this.usosLibres.pop();
        if (!m) {
          m = sombreador(FRAG_USO, { uColor: { value: new THREE.Color() }, uTiempo: { value: 0 }, uLleno: { value: 0 }, uFuerza: { value: 1 } }, PLANO, 3)();
          (m.material as THREE.ShaderMaterial).uniforms.uTiempo = this.tiempo;
          this.grupo.add(m);
        }
        m.visible = true;
        this.usos.set(u.id, m);
      }
      m.position.set(u.x, 0.05, u.y);
      m.scale.setScalar(u.r);
      const un = (m.material as THREE.ShaderMaterial).uniforms;
      un.uColor.value.copy(u.color);
      un.uLleno.value = Math.min(1, u.lleno);
      un.uFuerza.value = u.fuerza;
    }
    for (const [id, m] of this.usos) {
      if (vistas.has(id)) continue;
      m.visible = false;
      this.usosLibres.push(m);
      this.usos.delete(id);
    }
  }

  actualizar(dt: number, t: number) {
    this.tiempo.value = t;
    this.arcos.actualizar(dt, (a) => ((a.malla.material as THREE.ShaderMaterial).uniforms.uTiempo.value = t));
    this.rayas.actualizar(dt);
    this.ondas.actualizar(dt);
    this.columnas.actualizar(dt);
    this.rayos.actualizar(dt);
    this.auras.actualizar(dt);
  }

  /** Un ejemplar escondido de cada efecto, para compilar todos los sombreadores antes de jugar: si no, el primer
   *  uso de cada uno (el aura de subir de nivel, el haz de la campana, los anillos de abrir) congela el cuadro y en
   *  algunos celulares la pantalla queda negra mientras tanto. */
  precalentar() {
    for (const p of [this.arcos, this.rayas, this.ondas, this.columnas, this.rayos, this.auras]) p.precalentar();
    if (!this.zonasLibres.length && !this.zonas.size) {
      const z = this.hacerZona();
      z.visible = false;
      this.grupo.add(z);
      this.zonasLibres.push(z);
    }
    this.marcaCampana({ x: 0, y: 0, est: 0 }, 1, 1, false);
    this.marcaCampana(null, 1, 1, false);
    this.marcasUso([{ id: -1, x: 0, y: 0, r: 1, lleno: 0, fuerza: 1, color: new THREE.Color() }]);
    this.marcasUso([]);
  }

  limpiar() {
    for (const p of [this.arcos, this.rayas, this.ondas, this.columnas, this.rayos, this.auras]) for (const a of p.activos) a.t = a.dur;
    this.actualizar(0, this.tiempo.value);
  }
}
