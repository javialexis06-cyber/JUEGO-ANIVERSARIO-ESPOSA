// Las fotos de «Desaparecidos de Astra» (public/celular/fotos): escenarios armados con los kits de Blender de la granja
// y de Sangre y Ceniza y los muñecos de peluche, fotografiados con el motor de cine de la granja. Cada escenario trae
// sus tomas (una por foto) con la cámara, las poses y quién sale. Lo usa scripts/celular/fotos.mjs; no entra al juego.
import * as THREE from 'three';
import { cargar } from '../../src/recursos';
import { actorVecino, actorVestido, actuar, halo, piezaRopa, type Actor } from '../../src/granja-v3/cine-actores';
import type { Escenario, Guion, Toma } from '../../src/granja-v3/cine-granja';
import { agua, anillo, colocar, copia, escenario } from '../../src/granja-v3/cine-acto1';
import { azar, fogata, instanciar, luzCalida, motasFlotantes, piezaKit, plano, poner, puntosSuaves, type Hora } from '../../src/granja-v3/cine-kit';
import type { Cara } from '../../src/personaje';

type V3 = [number, number, number];
export interface TomaFoto {
  id: string;
  cam: [V3, V3, number?];
  /** Pose y cara de cada actor en esta foto (los que no salen, ocultos). */
  poses?: Record<string, [string, Cara?]>;
  /** Solo salen estos actores (por defecto, los que tienen pose). */
  salen?: string[];
  /** Retrato cuadrado (para las caras de los contactos). */
  cuadrado?: boolean;
  /** Filtro de la foto: vieja (sepia), cámara de seguridad, o muy oscura. */
  filtro?: 'sepia' | 'camara' | 'oscura';
  /** Texto sobreimpreso (la hora de la cámara de seguridad). */
  marca?: string;
  /** Algo propio de la toma (prender una luz de un color…). */
  hacer?: string;
  bloom?: number;
}
export interface SetFotos {
  id: string;
  escenario: () => Escenario;
  tomas: TomaFoto[];
}

type Reparto = Record<string, Actor>;
const PIELES = ['#f3cfb3', '#e5b48f', '#c98e66', '#a8714d', '#f6d7c1', '#8d5a3b'];
const P = piezaRopa;

/** Los personajes nuevos de los casos (los vecinos de Astra salen con su ropa de siempre: actorVecino). */
const NUEVOS: Record<string, () => Promise<Actor>> = {
  marcela: () => actorVestido('ella', { piel: PIELES[1], pelo: '#4a2e22', detalles: { ojos: '#4a2a1a' } }, { pelo: P('pelo_trenzas', 'pelo', { principal: '#4a2e22', liga: '#b4475a' }), cabeza: P('panoleta', 'cabeza', { principal: '#f2ead8', puntos: '#b4475a' }), arriba: P('vestido', 'arriba', { principal: '#7a2a3a', cinta: '#f2ead8' }), pies: P('zapatos', 'pies', { principal: '#3a2a20' }) }),
  marcela_hoy: () => actorVestido('ella', { piel: PIELES[1], pelo: '#5a3e32', detalles: { ojos: '#4a2a1a' } }, { pelo: P('pelo_mono_bajo', 'pelo', { principal: '#5a3e32' }), cabeza: P('panoleta', 'cabeza', { principal: '#c4553f', puntos: '#f6cf5a' }), arriba: P('delantal', 'arriba', { principal: '#f2e6cc', ribete: '#8a5a3c' }), abajo: P('falda_larga', 'abajo', { principal: '#5a4a6a' }), pies: P('botas', 'pies', { principal: '#4a3226' }) }),
  teresa: () => actorVestido('ella', { piel: PIELES[2], pelo: '#cfc8bf', detalles: { ojos: '#3a2a1a' } }, { pelo: P('pelo_mono', 'pelo', { principal: '#cfc8bf' }), cabeza: P('panoleta', 'cabeza', { principal: '#7a2a34', puntos: '#f2ead8' }), arriba: P('delantal', 'arriba', { principal: '#ffffff', ribete: '#7a2a34' }), abajo: P('falda_larga', 'abajo', { principal: '#3a3040' }), pies: P('zapatos', 'pies') }, 1.04),
  mama: () => actorVestido('ella', { piel: PIELES[1], pelo: '#a8a29a', detalles: { ojos: '#3a2a1a' } }, { pelo: P('pelo_mono_bajo', 'pelo', { principal: '#a8a29a' }), arriba: P('ruana', 'arriba', { principal: '#7a5aa0', camisa: '#f2ead8' }), abajo: P('falda_larga', 'abajo', { principal: '#4a3a32' }), pies: P('zapatos', 'pies', { principal: '#3a2a20' }) }),
  tobias: () => actorVestido('el', { piel: PIELES[3], pelo: '#2b2422', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_copete', 'pelo', { principal: '#2b2422' }), cabeza: P('gorra', 'cabeza', { principal: '#4f7a5a', visera: '#2a3a2a' }), arriba: P('camisa_cuadros', 'arriba', { principal: '#4f7a5a', botones: '#f2ead8' }), abajo: P('overol', 'abajo', { principal: '#6a5a4a' }), pies: P('botas', 'pies') }),
  conde: () => actorVestido('el', { piel: '#e7c2a6', pelo: '#6b6460', detalles: { ojos: '#4a3a3a' } }, { pelo: P('pelo_lado', 'pelo'), cara: P('bigote', 'cara'), cabeza: P('corona', 'cabeza'), arriba: P('sangre_monarca', 'arriba', {}, ['abajo']), espalda: P('capa', 'espalda', { principal: '#5a1424', broche: '#d9b45a' }), pies: P('botas', 'pies') }),
  abundio: () => actorVestido('el', { piel: PIELES[3], pelo: '#e6e1da', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_calvo', 'pelo', { principal: '#e6e1da' }), cabeza: P('sombrero_pescador', 'cabeza', { principal: '#e3d2a8' }), cara: P('bigote', 'cara', { principal: '#e6e1da' }), arriba: P('ruana', 'arriba', { principal: '#2f6f8a', camisa: '#f2ead8' }), abajo: P('pantalon', 'abajo', { principal: '#4a4a52' }), pies: P('botas_lluvia', 'pies', { principal: '#f2c12a' }) }),
  quintero: () => actorVestido('el', { piel: PIELES[2], pelo: '#3b2a22', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_rizos', 'pelo', { principal: '#3b2a22' }), cabeza: P('gorro_lana', 'cabeza', { principal: '#c4553f' }), cara: P('barba', 'cara', { principal: '#3b2a22' }), arriba: P('chaqueta', 'arriba', { principal: '#e8a03a' }), abajo: P('pantalon', 'abajo', { principal: '#3a4a5a' }), pies: P('botas_lluvia', 'pies', { principal: '#2f8f68' }) }),
  quintero2: () => actorVestido('el', { piel: PIELES[2], pelo: '#3b2a22', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_lado', 'pelo', { principal: '#3b2a22' }), cabeza: P('gorra', 'cabeza', { principal: '#2f6f9a' }), arriba: P('chaqueta', 'arriba', { principal: '#c4553f' }), abajo: P('pantalon', 'abajo', { principal: '#3a4a5a' }), pies: P('botas_lluvia', 'pies', { principal: '#2f8f68' }) }),
  rosalba: () => actorVestido('ella', { piel: PIELES[2], pelo: '#2b1d14', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_cola', 'pelo', { principal: '#2b1d14', detalle: '#e0a12a' }), cabeza: P('casco_minero', 'cabeza', { principal: '#e0a12a' }), arriba: P('camiseta', 'arriba', { principal: '#c4553f' }), abajo: P('overol', 'abajo', { principal: '#5a6670' }), pies: P('botas', 'pies', { principal: '#3b2a22' }) }),
  papa_minero: () => actorVestido('el', { piel: PIELES[2], pelo: '#2b2422', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_lado', 'pelo'), cabeza: P('casco_minero', 'cabeza', { principal: '#c8c0b0' }), cara: P('bigote', 'cara'), arriba: P('camiseta', 'arriba', { principal: '#7a6a5a' }), abajo: P('overol', 'abajo', { principal: '#5a6670' }), pies: P('botas', 'pies') }),
  abril: () => actorVestido('ella', { piel: PIELES[4], pelo: '#b0532f', detalles: { ojos: '#4a6a3a' } }, { pelo: P('pelo_ondas', 'pelo', { principal: '#b0532f' }), cabeza: P('flor_pelo', 'cabeza', { principal: '#f4a7b9' }), arriba: P('vestido_puntos', 'arriba', { principal: '#f4b6c2', cinta: '#ffffff' }), pies: P('sandalias', 'pies', { principal: '#e8c77a' }) }, 0.94),
  teofilo: () => actorVestido('el', { piel: PIELES[0], pelo: '#a8a29a', detalles: { ojos: '#3a4a6a' } }, { pelo: P('pelo_lado', 'pelo', { principal: '#a8a29a' }), cara: P('gafas_redondas', 'cara', { principal: '#c9a050' }), arriba: P('traje_astronauta', 'arriba', { principal: '#e8e8f0', detalle: '#7a8cff' }, ['abajo']), pies: P('botas', 'pies', { principal: '#c8c8d0' }) }),
  simon: () => actorVestido('el', { piel: PIELES[3], pelo: '#2b2422', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_rapado', 'pelo'), cabeza: P('sombrero_vaquero', 'cabeza', { principal: '#c9a46a' }), arriba: P('camisa', 'arriba', { principal: '#f2e2c4' }), abajo: P('pantalon', 'abajo', { principal: '#8a6a4a' }), pies: P('botas', 'pies', { principal: '#6b4a33' }), espalda: P('mochila', 'espalda', { principal: '#e07a2a' }) }),
  ximena: () => actorVestido('ella', { piel: PIELES[5], pelo: '#1f1a22', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_afro', 'pelo', { principal: '#1f1a22' }), cabeza: P('boina', 'cabeza', { principal: '#9a5aff' }), arriba: P('vestido', 'arriba', { principal: '#5a3a9a', cinta: '#ff8ad0' }), pies: P('botas', 'pies', { principal: '#2a2238' }) }),
  joaquin: () => actorVestido('el', { piel: PIELES[1], pelo: '#2b2422', detalles: { ojos: '#2a1a12' } }, { pelo: P('pelo_rapado', 'pelo'), cara: P('barba', 'cara'), arriba: P('traje_astronauta', 'arriba', { principal: '#f2f2f6', detalle: '#3ac0d9' }, ['abajo']), pies: P('botas', 'pies', { principal: '#c8ccd4' }) }),
};

/** Arma el reparto: [nombre en la foto, quién lo actúa, x, z, mira x, mira z]. */
type Puesto = [string, string, number, number, number, number];
async function reparto(g: THREE.Group, cast: Puesto[]): Promise<Reparto> {
  const as = await Promise.all(cast.map(([, q]) => (NUEVOS[q] ? NUEVOS[q]() : actorVecino(q))));
  const rp: Reparto = {};
  cast.forEach(([id, , x, z, mx, mz], i) => { rp[id] = as[i]; colocar(as[i], x, z, mx, mz); g.add(as[i].raiz); });
  return rp;
}

/** Un escenario de fotos: lo común (cielo, suelo, luces) + lo propio, y en cada toma las poses de su lista. */
function set(id: string, o: {
  hora: Hora; sol?: THREE.Vector3; colores?: string[] | null; fondo?: string; niebla?: [string, number, number]; exposicion?: number; radio?: number;
  cast: Puesto[];
  montar: (g: THREE.Group, k: Kits) => Promise<void> | void;
  hacer?: (que: string, g: THREE.Group, rp: Reparto) => void;
}, tomas: TomaFoto[]): SetFotos {
  return {
    id, tomas,
    escenario: () => {
      let rp: Reparto = {};
      let grupo: THREE.Group;
      let ultima = '';
      return escenario({
        hora: o.hora, sol: o.sol, colores: o.colores, fondo: o.fondo, niebla: o.niebla, exposicion: o.exposicion, radio: o.radio,
        async montar(g) {
          grupo = g;
          const k = await kits();
          await o.montar(g, k);
          rp = await reparto(g, o.cast);
          // Los actores se agregan aquí; escenario() los vuelve a agregar (no pasa nada)
          return rp;
        },
        animar(c) {
          const t = tomas.find((x) => x.id === c.toma.id);
          if (!t) return;
          const salen = t.salen ?? Object.keys(t.poses ?? {});
          for (const [k, a] of Object.entries(rp)) {
            a.raiz.visible = salen.includes(k);
            const ps = t.poses?.[k];
            if (ps) actuar(a, ps[0], ps[1]);
            a.p.update(c.dt);
          }
          if (t.id !== ultima) { ultima = t.id; o.hacer?.(t.hacer ?? '', grupo, rp); }
        },
      });
    },
  };
}

// ------------------------------------------------------------------ los kits

interface Kits {
  castillo: THREE.Object3D; cementerio: THREE.Object3D; catacumbas: THREE.Object3D; minas: THREE.Object3D; abadia: THREE.Object3D;
  pueblo: THREE.Object3D; monte: THREE.Object3D; paisaje: THREE.Object3D; astra: THREE.Object3D; muebles: THREE.Object3D;
  cria: THREE.Object3D; obras: THREE.Object3D; cercas: THREE.Object3D; invernadero: THREE.Object3D; edificios: THREE.Object3D;
  eterna: THREE.Object3D; nodos: THREE.Object3D; maquinas: THREE.Object3D;
  v2: (n: string) => Promise<THREE.Object3D>;
}
let kitsP: Promise<Kits> | null = null;
function kits(): Promise<Kits> {
  kitsP ??= (async () => {
    const n = ['sangre/bioma_castillo', 'sangre/bioma_cementerio', 'sangre/bioma_catacumbas', 'sangre/bioma_minas', 'sangre/bioma_abadia', 'granja_pueblo', 'granja_monte', 'granja_astra_paisaje', 'granja_astra', 'granja_muebles', 'granja_cria', 'granja_obras', 'granja_cercas', 'granja_invernadero', 'granja_edificios', 'granja_eterna', 'granja_nodos', 'granja_maquinas'];
    const [castillo, cementerio, catacumbas, minas, abadia, pueblo, monte, paisaje, astra, muebles, cria, obras, cercas, invernadero, edificios, eterna, nodos, maquinas] = await Promise.all(n.map((x) => cargar(`${x}.glb`)));
    return { castillo, cementerio, catacumbas, minas, abadia, pueblo, monte, paisaje, astra, muebles, cria, obras, cercas, invernadero, edificios, eterna, nodos, maquinas, v2: (x: string) => cargar(`granja-v2/${x}.glb`) };
  })();
  return kitsP;
}

/** Muchas copias de una pieza alrededor (bosques, rocas…). */
function regar(g: THREE.Group, kit: THREE.Object3D, clave: string, n: number, rmin: number, rmax: number, cx: number, cz: number, esc: [number, number], semilla: number, libre: (x: number, z: number) => boolean = () => true) {
  const p = piezaKit(kit, clave);
  if (p) g.add(instanciar(p, anillo(azar(semilla), n, rmin, rmax, cx, cz, esc, libre)));
}
function luz(g: THREE.Group, x: number, y: number, z: number, color = '#ffb35a', f = 2, alcance = 7) {
  const l = luzCalida(color, f, alcance);
  l.position.set(x, y, z);
  g.add(l);
  return l;
}
/** Un brillo (halo) en un punto. */
function brillo(g: THREE.Group, x: number, y: number, z: number, color: string, tam: number, op = 0.6) {
  const h = halo(color, tam);
  h.position.set(x, y, z);
  h.material.opacity = op;
  g.add(h);
  return h;
}
function piso(g: THREE.Group, kit: THREE.Object3D, x0: number, x1: number, z0: number, z1: number, claves = ['piso_a', 'piso_b', 'piso_c', 'piso_e']) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.add(poner(kit, claves[(x * 7 + z * 3 + 400) % claves.length], x * 2, z * 2, 0, 1, 0, false));
}
/** Un cuarto de piedra: piso y muros alrededor (sin el lado de la cámara, +z). */
function cuarto(g: THREE.Group, kit: THREE.Object3D, ancho: number, fondo: number, muros = ['pared_dura_a', 'pared_dura_b', 'pared_borde']) {
  piso(g, kit, -ancho, ancho, -fondo, 2);
  for (let x = -ancho; x <= ancho; x++) g.add(poner(kit, muros[(x + 40) % muros.length], x * 2, -fondo * 2 - 1.8, 0, 2.4));
  for (let z = -fondo; z <= 1; z++) { g.add(poner(kit, muros[(z + 41) % muros.length], -ancho * 2 - 1.8, z * 2, 0, 2.4)); g.add(poner(kit, muros[(z + 42) % muros.length], ancho * 2 + 1.8, z * 2, 0, 2.4)); }
}

const sentado = (a: Actor, y: number) => { a.raiz.position.y = y; };

/** Retrato cuadrado de un actor del reparto, de frente (por donde mira). */
function retrato(id: string, cast: Puesto[], quien: string, pose: string, cara: Cara, dist = 3.3, alto = 1.12): TomaFoto {
  const c = cast.find((x) => x[0] === quien)!;
  const [, , x, z, mx, mz] = c;
  const l = Math.hypot(mx - x, mz - z) || 1;
  return { id, cam: [[x + ((mx - x) / l) * dist, alto + 0.28, z + ((mz - z) / l) * dist], [x, alto, z], 30], poses: { [quien]: [pose, cara] }, cuadrado: true };
}


// =================================================================== Caso 1 · La noche del pacto

function terraza(roja: boolean): SetFotos {
  return set(roja ? 'c1_terraza_roja' : 'c1_terraza', {
    hora: roja ? 'noche_roja' : 'noche', sol: new THREE.Vector3(0.1, 0.4, -0.9), colores: null, fondo: '#05050c', niebla: ['#0b0814', 22, 110], exposicion: 1.5, radio: 14,
    cast: [['conde', 'conde', -1.2, -0.6, 2, 6]],
    montar(g, k) {
      const kit = k.castillo;
      piso(g, kit, -4, 4, -4, 3);
      for (let x = -4; x <= 4; x += 2) g.add(poner(kit, 'deco_columna_marmol', x * 2, -8.6));
      for (const z of [-6, -2, 2]) { g.add(poner(kit, 'deco_columna_marmol', -8.6, z)); g.add(poner(kit, 'deco_columna_marmol', 8.6, z)); }
      g.add(poner(kit, 'deco_gargola', -6, -8.7, 0, 1.1), poner(kit, 'deco_gargola', 6, -8.7, 0, 1.1));
      g.add(poner(kit, 'deco_trono', 0, -1.4, Math.PI, 1.3), poner(kit, 'deco_alfombra', 0, 1, 0, 1.6));
      g.add(poner(kit, 'deco_mesa_banquete', 3.6, -3.4, Math.PI / 2, 1.0), poner(kit, 'deco_estandarte', -4, -7.6), poner(kit, 'deco_estandarte', 4, -7.6));
      for (const [x, z] of [[-3, -5.5], [3, -5.5], [-4, 1], [4, 1]] as const) { g.add(poner(kit, 'luz_candelabro', x, z)); luz(g, x, 1.6, z, '#ffb06a', 1.5, 6); }
      // La copa sobre la mesa de la terraza
      g.add(poner(k.cria, 'copa_conde', 3.4, -3.2, 0, 1.6, 0.95, false));
      const luna = new THREE.Mesh(new THREE.SphereGeometry(14, 32, 16), new THREE.MeshBasicMaterial({ color: roja ? '#ff5a4a' : '#e8ecff', fog: false }));
      luna.position.set(-20, 30, -120);
      g.add(luna);
      brillo(g, -20, 30, -120, roja ? '#ff3a2a' : '#c9d4ff', 110, 0.55);
      // Las montañas del reino y la muralla abajo
      regar(g, k.paisaje, 'roca_volcanica', 30, 30, 90, 0, -40, [4, 9], 3, (x, z) => z < -20);
      if (roja) g.add(motasFlotantes(220, [0, 3, -4], 8, 6, [0.6, 0.55, 0.65], 2.4, 11));
    },
  }, roja
    ? [{ id: 'c1_luna', cam: [[3, 1.4, 4], [-8, 14, -60], 48], salen: [], bloom: 1.1 }]
    : [
      { id: 'c1_fondo', cam: [[3, 1.4, 4], [-8, 14, -60], 48], salen: [], bloom: 0.9 },
      { id: 'c1_conde', cam: [[0.6, 1.5, 3.0], [-1.4, 1.0, -0.8], 36], poses: { conde: ['triste_b', 'triste'] }, bloom: 0.8 },
      { id: 'c1_copa', cam: [[2.4, 1.6, -2.1], [3.4, 1.0, -3.2], 26], salen: [], bloom: 1 },
    ]);
}

const comedor = set('c1_comedor', {
  hora: 'noche', colores: null, fondo: '#0a0606', exposicion: 1.7, radio: 12,
  cast: [],
  montar(g, k) {
    const kit = k.castillo;
    cuarto(g, kit, 4, 4);
    g.add(poner(kit, 'deco_mesa_banquete', 0, -3, 0, 1.4), poner(kit, 'deco_mesa_banquete', 0, -0.4, 0, 1.4));
    g.add(poner(kit, 'deco_tapiz', -4, -9.4), poner(kit, 'deco_tapiz', 4, -9.4), poner(kit, 'deco_retrato', 0, -9.4, 0, 1.3), poner(kit, 'luz_chimenea', -8.6, -4, Math.PI / 2, 1.2));
    g.add(poner(kit, 'deco_armadura', -7, -8), poner(kit, 'deco_armadura', 7, -8), poner(kit, 'deco_reloj', 8, -6, -0.6), poner(kit, 'deco_jarron', -8, 0));
    for (const z of [-4, -2.2, -0.4, 1.4]) { g.add(poner(kit, 'luz_candelabro', 0, z, 0, 0.8, 0.95, false)); luz(g, 0, 1.8, z, '#ffb06a', 1.6, 6); }
    luz(g, -7.6, 1, -4, '#ff8a3a', 2.5, 9);
    g.add(poner(k.cria, 'copa_conde', 0.6, 2.6, 0, 1.3, 0.95, false));
  },
}, [{ id: 'c1_comedor', cam: [[2.6, 2.0, 4.6], [-0.5, 0.8, -3], 44], salen: [] }]);

const cocina = set('c1_cocina', {
  hora: 'noche', colores: null, fondo: '#0a0606', exposicion: 1.6, radio: 10,
  cast: [['teresa', 'teresa', -1.6, -2.0, 1, 3], ['marcela', 'marcela', 1.4, -1.6, -1, 3], ['tobias', 'tobias', 3.6, -2.4, -1, 3]],
  async montar(g, k) {
    cuarto(g, k.castillo, 3, 3, ['pared_dura_a', 'pared_blanda_a', 'pared_dura_b']);
    const [barril, cajon] = await Promise.all([k.v2('barril'), k.v2('cajon')]);
    for (const [x, z] of [[-5, -5], [-4, -5.6], [-5.6, -4], [5, -5.4], [5.6, -4.4]] as const) g.add(copia(barril, x, z, x, 1.2));
    g.add(copia(cajon, 4.2, -5.8, 0.3, 1.2), copia(cajon, -3, -6, 0, 1));
    g.add(poner(k.castillo, 'luz_chimenea', 0, -6.2, 0, 1.3), poner(k.pueblo, 'mesa_posada', 0, -0.4, 0, 1.2));
    g.add(poner(k.muebles, 'canasta_frutas', -0.6, -0.4, 0, 0.9, 1.1, false), poner(k.pueblo, 'troncos_pila', -6, -1, 0.4, 1.2));
    luz(g, 0, 1, -5.6, '#ff8a3a', 4, 12);
    luz(g, 1, 2.6, 2, '#ffcf8a', 2.4, 10);
    g.add(poner(k.castillo, 'deco_estandarte', -3.2, -6.4), poner(k.castillo, 'luz_antorcha', 3, -6.6), poner(k.castillo, 'luz_antorcha', -5.8, -2));
    luz(g, 3, 2, -6, '#ffa04a', 1.6, 6);
  },
}, [
  { id: 'c1_despensa', cam: [[1.5, 1.7, 5.2], [-0.5, 1.0, -3], 46], poses: { teresa: ['frotar_manos_a', 'concentrado'] } },
  { id: 'c1_av_teresa', cam: [[-1.3, 1.4, 1.9], [-1.6, 1.12, -2.0], 30], poses: { teresa: ['reposo', 'feliz'] }, cuadrado: true },
  { id: 'c1_marcela', cam: [[1.2, 1.4, 2.5], [1.4, 1.12, -1.6], 30], poses: { marcela: ['saludo_a', 'feliz'] }, cuadrado: true },
  { id: 'c1_av_tobias', cam: [[3.3, 1.4, 1.7], [3.6, 1.12, -2.4], 30], poses: { tobias: ['pulgares_a', 'guino'] }, cuadrado: true },
]);

const tunel = set('c1_tunel', {
  hora: 'noche', colores: null, fondo: '#020203', exposicion: 1, radio: 8,
  cast: [],
  montar(g, k) {
    const kit = k.catacumbas;
    piso(g, kit, -1, 1, -6, 2);
    for (let z = -6; z <= 2; z++) { g.add(poner(kit, z % 2 ? 'pared_dura_a' : 'pared_dura_b', -3.2, z * 2, 0, 1.4)); g.add(poner(kit, z % 2 ? 'pared_dura_b' : 'pared_borde', 3.2, z * 2, 0, 1.4)); }
    g.add(poner(k.monte, 'marco_tunel', 0, -2, 0, 1.4), poner(k.monte, 'entibado', 0, -7, 0, 1.4), poner(k.pueblo, 'troncos_pila', 1.6, 1, 0.3));
    // La boca del túnel, abierta al bosque: luz de luna al fondo
    brillo(g, 0, 1.4, -14, '#9ab0ff', 7, 0.7);
    luz(g, 0, 1.4, -11, '#9ab0ff', 3, 9);
    luz(g, 0.5, 1.2, 2, '#ffd08a', 1.2, 5);
  },
}, [{ id: 'c1_tunel', cam: [[0.2, 1.3, 4], [0, 1.1, -10], 50], salen: [] }]);

const vigilia = set('c1_vigilia', {
  hora: 'tarde', sol: new THREE.Vector3(-0.7, 0.3, -0.5), colores: ['#8a8070', '#9a8e7a', '#7a7262', '#6a7a52'], niebla: ['#e8c8a8', 30, 140], exposicion: 1.05,
  cast: [['celina', 'marcela_hoy', -0.6, 0.2, 0.6, 3], ['mama', 'mama', 0.9, 0.4, -0.6, 3], ['brigida', 'vigilia_brigida', -2.6, -1.6, 0, 2], ['ulises', 'vigilia_ulises', 3, -1, 1, 4]],
  async montar(g, k) {
    g.add(poner(k.astra, 'casa_vigilia', 0, -8, 0, 1.3), poner(k.paisaje, 'atalaya', -9, -9, 0.4), poner(k.paisaje, 'empalizada', 8, -10, -0.3, 1.2), poner(k.paisaje, 'empalizada', -5, -12, 0.2, 1.2));
    g.add(poner(k.pueblo, 'mesa_posada', -0.2, -1.6, 0, 1.2), poner(k.muebles, 'canasta_frutas', 0.4, -1.6, 0, 0.8, 1.1, false), poner(k.pueblo, 'banco', 4, -3, -0.4), poner(k.pueblo, 'farol', 5, 0.5));
    const f = fogata(1, 7); f.position.set(-4.5, 0, 0.5); g.add(f);
    luz(g, -4.5, 1, 0.5, '#ff9a4a', 2, 6);
    regar(g, k.monte, 'pino', 30, 16, 60, 0, -6, [1, 1.6], 4, (x, z) => z < -2 || Math.abs(x) > 14);
  },
  hacer(que, _g, rp) {
    if (que === 'abrazo') { colocar(rp.celina, -0.05, 0.3, 3, 0.3); colocar(rp.mama, 0.6, 0.3, -3, 0.3); }
    else { colocar(rp.celina, -0.6, 0.2, 0.6, 3); colocar(rp.mama, 0.9, 0.4, -0.6, 3); }
  },
}, [
  { id: 'c1_fin_comedor', cam: [[2, 2.4, 7], [-0.5, 1, -2], 44], poses: { celina: ['frotar_manos_a', 'concentrado'], brigida: ['jarras', 'feliz'] } },
  { id: 'c1_fin_celina', cam: [[-0.2, 1.3, 3.4], [-0.6, 0.95, 0.2], 34], poses: { celina: ['triste', 'llorando'] } },
  { id: 'c1_fin_abrazo', cam: [[0.6, 1.6, 4.4], [0.1, 0.9, 0.3], 38], poses: { celina: ['abrazo_izq', 'llorando'], mama: ['abrazo_der', 'feliz'] }, hacer: 'abrazo' },
  { id: 'c1_av_mama', cam: [[0.9, 1.4, 4.2], [0.9, 1.12, 0.4], 30], poses: { mama: ['reposo', 'feliz'] }, cuadrado: true },
  { id: 'ulises', cam: [[2.7, 1.4, 2.9], [3, 1.12, -1], 30], poses: { ulises: ['saludo_a', 'feliz'] }, cuadrado: true },
]);

// =================================================================== Caso 2 · El faro que no encendió

/** Un banco de arena (o una loma baja): un disco aplastado de arena. */
function banco(g: THREE.Group, x: number, z: number, rx: number, rz: number, color = '#e8d6a6', alto = 0.25) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  m.scale.set(rx, alto, rz);
  m.position.set(x, 0, z);
  m.receiveShadow = true;
  g.add(m);
  return m;
}

const CAST_PUERTO: Puesto[] = [['abundio', 'abundio', -1.4, 1.2, 1, 6], ['julian', 'lirios_julian', 1.2, 1.4, -1, 6], ['carmela', 'lirios_carmela', 3.4, 0.6, 0, 6], ['olga', 'lirios_olga', -3.4, 0.8, 1, 6]];
function puerto(noche: boolean): SetFotos {
  return set(noche ? 'c2_puerto_noche' : 'c2_puerto', {
    hora: noche ? 'noche' : 'atardecer', sol: new THREE.Vector3(-0.8, 0.18, -0.6), colores: ['#c9b27a', '#b8a36a', '#7a9a52', '#d6c08a'], niebla: noche ? ['#0b1024', 30, 160] : ['#f3b88a', 40, 220], exposicion: noche ? 1.3 : 1.05, radio: 26,
    cast: CAST_PUERTO,
    async montar(g, k) {
      const mar = agua(200, 120, noche ? '#1a3a5a' : '#3f8fb0');
      mar.position.set(0, 0.04, -66);
      g.add(mar);
      g.add(poner(k.paisaje, 'faro', -9, -9, 0, 1.6), poner(k.monte, 'muelle', 2, -6.5, 0, 1.4), poner(k.monte, 'muelle', 2, -11, 0, 1.4));
      g.add(poner(k.paisaje, 'barca', 5.2, -9, 0.6, 1.2), poner(k.paisaje, 'poste_amarre', 3.8, -7.4), poner(k.paisaje, 'poste_amarre', 0.4, -8.6), poner(k.paisaje, 'barca', -2, -13, 2.2, 1));
      g.add(poner(k.astra, 'casa_puerto', 10, -2, -0.6, 1.2), poner(k.pueblo, 'farol', 4, -4.6), poner(k.pueblo, 'farol', -3, -4.6), poner(k.pueblo, 'puesto_mercado_verde', 8, 3, -1.2));
      regar(g, k.monte, 'juncos', 40, 6, 24, -14, -4, [1, 1.6], 3, (x, z) => z > -6 && x < -2);
      regar(g, k.monte, 'piedra_orilla', 24, 4, 26, 0, -4, [0.8, 1.4], 5, (x, z) => z < -2 && z > -6);
      regar(g, k.monte, 'roble', 24, 26, 70, 0, 0, [1, 1.6], 7, (x, z) => z > -6);
      for (const x of [4, -3]) luz(g, x, 2.6, -4.6, '#ffc27a', noche ? 2.4 : 0.8, 9);
      if (noche) {
        // La Garza en el agua con el farolito en la proa
        const barca = poner(k.paisaje, 'barca', -6, -18, 0.9, 1.1);
        g.add(barca);
        luz(g, -5.4, 1.2, -17.6, '#ffcf7a', 4, 10);
        brillo(g, -5.4, 1.3, -17.6, '#ffd08a', 2.4, 0.9);
        brillo(g, -9, 11.5, -9, '#fff2b0', 14, 0.0).name = 'haz';
      }
    },
    hacer(que, g) {
      const h = g.getObjectByName('haz') as THREE.Sprite | undefined;
      if (h) h.material.opacity = que === 'faro_prendido' ? 0.9 : 0;
    },
  }, noche
    ? [
      { id: 'c2_noche', cam: [[-2, 1.6, -6], [-5.6, 0.8, -18], 34], salen: [], bloom: 1.2 },
      { id: 'c2_fin_faro', cam: [[3.5, 1.6, 5.5], [-6, 4, -10], 44], poses: { julian: ['senalar_arriba', 'feliz'], abundio: ['jarras', 'feliz'], carmela: ['aplauso_a', 'feliz'] }, hacer: 'faro_prendido', bloom: 1.2 },
    ]
    : [
      { id: 'c2_fondo', cam: [[4, 2, 8], [-6, 5, -12], 48], salen: [] },
      { id: 'c2_faro', cam: [[-4, 1, -1], [-9, 6, -9], 50], salen: [] },
      { id: 'c2_marca', cam: [[2.6, 1.2, -4.6], [3.8, 0.6, -7.4], 30], salen: [] },
      { id: 'c2_garza', cam: [[7.6, 1.6, -5.6], [5.2, 0.4, -9], 34], salen: [] },
      { id: 'c2_abundio', cam: [[-0.8, 1.45, 4.4], [-1.4, 1.12, 1.2], 30], poses: { abundio: ['reposo', 'feliz'] }, cuadrado: true },
      retrato('c2_av_julian', CAST_PUERTO, 'julian', 'saludo_a', 'feliz'),
      retrato('c2_av_carmela', CAST_PUERTO, 'carmela', 'jarras', 'feliz'),
    ]);
}

const bancoArena = set('c2_banco', {
  hora: 'atardecer', sol: new THREE.Vector3(-0.8, 0.2, -0.5), colores: ['#7a9a52'], niebla: ['#f3b88a', 50, 260], exposicion: 1.05, radio: 30,
  cast: [],
  montar(g, k) {
    const mar = agua(300, 300, '#3f8fb0');
    mar.position.set(0, 0.06, -30);
    g.add(mar);
    banco(g, 6, -26, 9, 3.2, '#e8d6a6', 0.4);
    banco(g, -8, -40, 4, 2, '#e8d6a6', 0.3);
    regar(g, k.monte, 'juncos', 30, 10, 30, -18, -30, [1, 1.5], 9);
    for (let i = 0; i < 4; i++) g.add(poner(k.paisaje, 'barca', -14 + i * 4, -6 - i * 2, 1.2, 0.9));
  },
}, [{ id: 'c2_banco', cam: [[-4, 9, 8], [4, 0, -24], 42], salen: [] }]);

const CAST_ERAS: Puesto[] = [['abundio', 'abundio', -0.4, 0.4, 0, 6], ['q1', 'quintero', 1.2, 0.2, -0.5, 6], ['q2', 'quintero2', -1.9, 0.0, 0.8, 6], ['julian', 'lirios_julian', 2.8, 2.4, -1, -2], ['olga', 'lirios_olga', 3.8, 1.6, -2, -1]];
function eras(amanecer: boolean): SetFotos {
  return set(amanecer ? 'c2_eras_alba' : 'c2_eras', {
    hora: amanecer ? 'atardecer' : 'tarde', sol: amanecer ? new THREE.Vector3(0.8, 0.15, -0.5) : new THREE.Vector3(-0.5, 0.5, -0.6), colores: ['#e6e2d6', '#f2efe6', '#cfd8c8', '#9ab07a'], niebla: amanecer ? ['#f6c8a8', 30, 160] : ['#e8eef2', 40, 200], exposicion: 1.05, radio: 22,
    cast: CAST_ERAS,
    async montar(g, k) {
      // Las eras de sal inundadas: espejos de agua en cuadros
      for (let x = -3; x <= 3; x++) for (let z = 0; z < 3; z++) { const a = agua(3.4, 3.4, '#7ab8d0'); a.position.set(x * 3.8 + 2, 0.05, 8 + z * 3.8); g.add(a); }
      banco(g, 0, -2, 7, 5, '#9ab07a', 1.4);
      const casita = await k.v2('casita_pueblo');
      g.add(copia(casita, 0, -3.6, 0, 1.2, 1.2));
      g.add(poner(k.pueblo, 'troncos_pila', 3, -2), poner(k.paisaje, 'barca', 6, 4, 0.4, 1));
      const f = fogata(1, 3); f.position.set(-0.4, 1.3, 1.6); g.add(f);
      luz(g, -0.4, 2.2, 1.6, '#ff9a4a', 2.4, 6);
      regar(g, k.monte, 'juncos', 30, 10, 30, 0, 6, [1, 1.5], 11, (x, z) => z > 4);
      for (const a of ['abundio', 'q1', 'q2']) void a;
    },
    hacer(_q, _g, rp) { for (const k of ['abundio', 'q1', 'q2']) if (rp[k]) rp[k].raiz.position.y = 1.15; },
  }, amanecer
    ? [
      { id: 'c2_fin_amanecer', cam: [[12, 2.4, 22], [0, 1, -2], 40], poses: { julian: ['senalar_a', 'feliz'], olga: ['agitar_a', 'feliz'] }, hacer: 'x' },
    ]
    : [
      { id: 'c2_eras', cam: [[8, 4, 20], [0, 1.2, 2], 46], salen: [], hacer: 'x' },
      { id: 'c2_fin_choza', cam: [[0.4, 2.2, 5.6], [-0.4, 1.9, 0.4], 40], poses: { abundio: ['sentado_feliz', 'feliz'], q1: ['comer_sentado_a', 'feliz'], q2: ['sentado', 'carcajada'] }, hacer: 'x' },
    ]);
}

// =================================================================== Caso 3 · La cota tres

const CAST_BOCA: Puesto[] = [['papa', 'papa_minero', -2.8, 0.6, 0, 7], ['rosalba', 'rosalba', -1.0, 1.2, 0.2, 7], ['eloy', 'piedra_eloy', 0.8, 0.6, 0, 7], ['petra', 'piedra_petra', -2.8, 0.6, 0, 7], ['ursula', 'piedra_ursula', 2.6, 1.0, 0, 7], ['amparo', 'piedra_amparo', 4.2, 0.4, -1, 7], ['hugo', 'piedra_hugo', -4.4, 0.2, 1, 7]];
const bocamina = set('c3_boca', {
  hora: 'tarde', sol: new THREE.Vector3(-0.6, 0.35, -0.5), colores: ['#8a7a6a', '#9a8a72', '#7a6a5a', '#6a7a52'], niebla: ['#e8c8a8', 30, 150], exposicion: 1.05, radio: 22,
  cast: CAST_BOCA,
  async montar(g, k) {
    g.add(poner(k.monte, 'boca_mina', 0, -6, 0, 1.6), poner(k.monte, 'vagoneta', 4.5, -3, 0.4, 1.2), poner(k.monte, 'riel', 2.5, -3.5, 0.4, 1.4), poner(k.monte, 'riel', 0.6, -5, 0.2, 1.4));
    g.add(poner(k.minas, 'deco_barriles', -5, -3, 0.4), poner(k.minas, 'deco_sacos', -6.6, -1.6), poner(k.minas, 'deco_cajas_dinamita', 6.4, -1), poner(k.minas, 'luz_lampara', -2.4, -4.6), poner(k.minas, 'luz_lampara', 2.4, -4.6));
    g.add(poner(k.pueblo, 'piedras_mineral', 7, -4), poner(k.paisaje, 'basalto', -9, -7, 0, 1.6), poner(k.paisaje, 'basalto', 9, -8, 1, 2));
    regar(g, k.paisaje, 'roca_volcanica', 30, 12, 50, 0, -8, [1.5, 4], 6, (x, z) => z < -4);
    regar(g, k.monte, 'pino', 30, 14, 60, 0, 0, [1, 1.5], 8, (x, z) => z > -2 || Math.abs(x) > 12);
    luz(g, 0, 1.6, -5, '#ffb35a', 1.6, 7);
  },
}, [
  { id: 'c3_brigada', cam: [[0, 1.8, 8.4], [0, 1, 0], 46], poses: { rosalba: ['saludo_a', 'feliz'], eloy: ['brazos_cruzados', 'normal'], petra: ['pulgares_a', 'carcajada'], ursula: ['reposo', 'feliz'], amparo: ['jarras', 'feliz'], hugo: ['agitar_a', 'feliz'] } },
  retrato('c3_rosalba', CAST_BOCA, 'rosalba', 'reposo', 'feliz'),
  retrato('c3_av_eloy', CAST_BOCA, 'eloy', 'brazos_cruzados', 'normal'),
  retrato('c3_av_ursula', CAST_BOCA, 'ursula', 'pensando', 'concentrado'),
  retrato('c3_av_petra', CAST_BOCA, 'petra', 'risita_a', 'carcajada'),
  { id: 'c3_casco', cam: [[-2.1, 1.4, 4.0], [-2.8, 1.12, 0.6], 30], poses: { papa: ['reposo', 'feliz'] }, salen: ['papa'], filtro: 'sepia' },
]);
// (el papá de Rosalba, en la foto vieja de AV 281)

const galeria = set('c3_galeria', {
  hora: 'noche', colores: null, fondo: '#050403', exposicion: 1.4, radio: 10,
  cast: [],
  montar(g, k) {
    const kit = k.minas;
    piso(g, kit, -2, 2, -6, 2, ['piso_a', 'piso_b', 'piso_c', 'piso_d']);
    for (let z = -6; z <= 2; z++) { g.add(poner(kit, ['pared_dura_a', 'veta_hierro', 'pared_dura_b'][(z + 9) % 3], -4.6, z * 2, z, 2)); g.add(poner(kit, ['pared_dura_b', 'pared_borde', 'veta_oro'][(z + 9) % 3], 4.6, z * 2, z, 2)); }
    for (const z of [-1, -5, -9]) { g.add(poner(kit, 'deco_puntal', -3, z), poner(kit, 'deco_puntal', 3, z)); }
    g.add(poner(kit, 'deco_riel_recto', 0, 0), poner(kit, 'deco_riel_recto', 0, -4), poner(kit, 'deco_riel_roto', 0, -8));
    g.add(poner(k.cercas, 'porton_cerrado', 0, -7, 0, 1.6), poner(kit, 'luz_lampara', -2.6, -6), poner(kit, 'deco_cristal_chico', 3, -11, 0, 1.2));
    luz(g, -2.6, 1.6, -6, '#ffb35a', 2.4, 8);
    brillo(g, 0, 1.2, -13, '#ff8a3a', 5, 0.5);
    luz(g, 0, 1, -12, '#ff7a2a', 2.5, 8);
  },
}, [
  { id: 'c3_fondo', cam: [[0.4, 1.5, 3], [0, 1.2, -8], 50], salen: [] },
  { id: 'c3_reja', cam: [[1.2, 1.3, -2], [0, 1.1, -7.6], 42], salen: [] },
]);

const CAST_NIDO: Puesto[] = [['rosalba', 'rosalba', 1.8, 1.4, -1, -1], ['eloy', 'piedra_eloy', -1.0, 4.2, 0, 0], ['amparo', 'piedra_amparo', 0.4, 4.6, 0, 0], ['ursula', 'piedra_ursula', -2.4, 4.6, 0, 0]];
function nido(conGente: boolean): SetFotos {
  return set(conGente ? 'c3_nido_gente' : 'c3_nido', {
    hora: 'noche', colores: null, fondo: '#0a0402', exposicion: 1.45, radio: 12,
    cast: conGente ? CAST_NIDO : [],
    async montar(g, k) {
      const kit = k.minas;
      piso(g, kit, -4, 4, -4, 3, ['piso_a', 'piso_b', 'piso_c', 'piso_d']);
      const r = azar(4);
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2, d = 9 + r();
        if (Math.sin(a) > 0.7) continue;
        g.add(poner(kit, ['pared_dura_a', 'veta_oro', 'pared_dura_b', 'veta_sangre'][i % 4], Math.cos(a) * d, Math.sin(a) * d - 1, r() * 6, 2.2));
      }
      g.add(poner(kit, 'deco_cristal_grande', -5, -5, 0.4, 1.4), poner(kit, 'deco_cristal_grande', 5.6, -4, 1.2, 1.2), poner(kit, 'deco_cristal_chico', 3, -6.4, 0, 1.4), poner(kit, 'deco_lava_charco', -3, -2.4));
      const dragon = await cargar('granja-v3/dragon.glb');
      const d = copia(dragon, -1.6, -3.2, 0.5, 2.6);
      d.name = 'dragon';
      g.add(d);
      // El huevo de piedra que golpea
      g.add(poner(k.obras, 'ref_huevo_dino', 2.2, -1.6, 0.3, 3.2));
      brillo(g, 2.2, 0.8, -1.6, '#ffb35a', 2.4, 0.5);
      for (const [x, z, c] of [[-5, -5, '#7ad0ff'], [5.6, -4, '#c07aff'], [3, -6.4, '#7affc0']] as const) { luz(g, x, 1.6, z, c, 2.4, 7); brillo(g, x, 1.6, z, c, 4, 0.45); }
      luz(g, -3, 0.6, -2.4, '#ff6a2a', 3, 8);
      luz(g, 0.5, 2.6, 2, '#ffd8a0', 1.6, 10);
      g.add(motasFlotantes(140, [0, 1, -2], 6, 3, [1, 0.6, 0.3], 1.8, 3));
      if (conGente) for (const [x, z] of [[-1, 3.6], [0.4, 4]] as const) luz(g, x, 1.4, z, '#fff2c8', 1.6, 6);
    },
  }, conGente
    ? [
      { id: 'c3_fin_entrada', cam: [[-0.2, 1.7, 8.6], [-1, 1.2, -2], 46], poses: { eloy: ['inclinado', 'sorprendido'], amparo: ['boca_abierta', 'sorprendido'], ursula: ['senalar_a', 'sorprendido'] } },
      { id: 'c3_fin_nido', cam: [[3.6, 1.4, 4.2], [1.2, 0.9, -1.6], 40], poses: { rosalba: ['sentado_feliz', 'feliz'] }, hacer: 'sentada' },
    ]
    : [
      { id: 'c3_cristales', cam: [[3, 1.6, 2], [-5, 1.4, -5], 44], salen: [] },
      { id: 'c3_huevo', cam: [[3.6, 1.1, 1.2], [2.2, 0.6, -1.6], 32], salen: [] },
      { id: 'c3_ojo', cam: [[1.2, 1.8, 0.8], [-1.6, 1.6, -3.2], 26], salen: [], filtro: 'oscura' },
      { id: 'c3_fondo_nido', cam: [[0, 2, 7], [0, 1, -3], 50], salen: [] },
    ]);
}

const CAST_SALIDA: Puesto[] = [['rosalba', 'rosalba', 0, 1.5, 0, 8], ['eloy', 'piedra_eloy', -1.6, 0.8, 0, 8], ['amparo', 'piedra_amparo', 1.6, 0.8, 0, 8], ['petra', 'piedra_petra', 3.2, 1.6, -1, 8]];
const salida = set('c3_salida', {
  hora: 'atardecer', sol: new THREE.Vector3(0.7, 0.2, -0.6), colores: ['#8a7a6a', '#9a8a72', '#7a6a5a'], niebla: ['#f0a878', 30, 150], exposicion: 1.1, radio: 18,
  cast: CAST_SALIDA,
  async montar(g, k) {
    g.add(poner(k.monte, 'boca_mina', 0, -5, 0, 1.6), poner(k.monte, 'vagoneta', 4.5, -3, 0.4, 1.2), poner(k.minas, 'luz_lampara', -2.4, -3.6), poner(k.minas, 'luz_lampara', 2.4, -3.6));
    const cajon = await k.v2('cajon');
    g.add(copia(cajon, 0, 1.5, 0, 1.1));
    regar(g, k.paisaje, 'roca_volcanica', 24, 12, 50, 0, -8, [1.5, 4], 6, (x, z) => z < -4);
    luz(g, 0, 1.6, -4, '#ffb35a', 2, 7);
  },
  hacer(_q, _g, rp) { if (rp.rosalba) rp.rosalba.raiz.position.y = 0.7; },
}, [{ id: 'c3_fin_salida', cam: [[0.6, 1.6, 7.4], [0, 1, 0], 42], poses: { rosalba: ['sentado_feliz', 'feliz'], eloy: ['pulgares_a', 'feliz'], amparo: ['aplauso_a', 'feliz'], petra: ['celebrar', 'carcajada'] }, hacer: 'x' }]);

// =================================================================== Caso 4 · La niña del Eco

const CAST_CORO: Puesto[] = [['abril', 'abril', 0, 1.2, 0, 8], ['sora', 'eco_sora', -1.8, 0.6, 0.4, 8], ['casiano', 'eco_casiano', 1.8, 0.4, -0.4, 8], ['gregoria', 'eco_gregoria', -3.4, -0.2, 0.6, 8], ['basilia', 'eco_basilia', 3.4, -0.2, -0.6, 8], ['esteban', 'eco_esteban', 5.2, 1.2, -1, 8]];
function jardines(noche: boolean): SetFotos {
  return set(noche ? 'c4_jardines_noche' : 'c4_jardines', {
    hora: noche ? 'noche' : 'atardecer', sol: new THREE.Vector3(-0.7, 0.2, -0.6), colores: ['#7aa860', '#8ab870', '#6a9a52', '#a8c880'], niebla: noche ? ['#141838', 25, 120] : ['#f6c8b8', 35, 180], exposicion: noche ? 1.4 : 1.05, radio: 24,
    cast: CAST_CORO,
    async montar(g, k) {
      g.add(poner(k.paisaje, 'arco_rosas', 0, -4, 0, 1.4), poner(k.astra, 'casa_verdia', -10, -10, 0.4, 1.2), poner(k.paisaje, 'cerezo', 8, -8, 0, 1.6), poner(k.paisaje, 'cerezo', -7, -3, 1, 1.3));
      regar(g, k.paisaje, 'rosal', 18, 4, 9, 0, -4, [1, 1.4], 2, (x, z) => z < -1);
      regar(g, k.paisaje, 'cerezo', 20, 18, 60, 0, -4, [1.2, 1.8], 5);
      const flores = await k.v2('flores_pradera');
      g.add(instanciar(flores.children[0] ?? flores, anillo(azar(9), 40, 3, 16, 0, 0, [0.8, 1.3], (x, z) => Math.hypot(x, z - 1) > 3)));
      // El seto en zigzag (a la derecha): hileras de rosales apretados y los pilares de hilos de Senda adentro
      const seto = new THREE.Group();
      for (let fila = 0; fila < 5; fila++) for (let i = 0; i < 7; i++) seto.add(poner(k.paisaje, 'rosal', (fila % 2 ? 0.4 : 0) + i * 0.9, -fila * 1.6, i, 1.5));
      for (const [x, z] of [[2.5, -2.4], [4.6, -5.6]] as const) seto.add(poner(k.paisaje, 'pilar_hilos', x, z, 0, 1));
      seto.add(poner(k.pueblo, 'banco', 3.3, -0.8, 0, 1), poner(k.pueblo, 'farol', 4.6, -0.8));
      seto.position.set(12, 0, 2);
      seto.rotation.y = -0.5;
      g.add(seto);
      const lf = luz(g, 15.6, 2.4, 3.4, '#ffd08a', noche ? 2.6 : 1, 6); void lf;
      for (const [x, z] of [[14.6, -0.6], [16.7, -3.4]] as const) brillo(g, x, 1.6, z, '#c9a0ff', noche ? 3.5 : 2, noche ? 0.8 : 0.35);
      g.add(motasFlotantes(160, [0, 1.2, 0], 12, 3, noche ? [0.8, 0.7, 1] : [1, 0.85, 0.7], 1.8, 5));
    },
    hacer(que, _g, rp) {
      if (que === 'sale') colocar(rp.abril, 12.6, 3.6, 9.6, 7.6);
      else if (que === 'coro') for (const [id, , x, z] of CAST_CORO) colocar(rp[id], x, z, 14, 1);
      else for (const [id, , x, z, mx, mz] of CAST_CORO) colocar(rp[id], x, z, mx, mz);
    },
  }, noche
    ? [
      { id: 'c4_pilares', cam: [[13.2, 1.5, 6.2], [15.6, 1.4, -2.0], 44], salen: [], filtro: 'oscura', bloom: 1.2 },
      { id: 'c4_fin_seto', cam: [[8, 1.8, 9], [15, 1.4, 0], 44], salen: [], bloom: 1.3 },
    ]
    : [
      { id: 'c4_fondo', cam: [[2, 2.2, 10], [0, 2, -6], 50], salen: [] },
      { id: 'c4_coro', cam: [[0.6, 1.8, 8.5], [0.6, 1, 0], 46], poses: { abril: ['risita_a', 'carcajada'], sora: ['saludo_b', 'feliz'], casiano: ['reposo', 'feliz'], gregoria: ['aplauso_a', 'feliz'], basilia: ['reposo', 'feliz'] } },
      { id: 'c4_seto', cam: [[8, 1.6, 8], [14, 1, 1], 44], salen: [] },
      { id: 'c4_banca', cam: [[13.2, 1.3, 6.0], [15.0, 0.8, 2.8], 38], salen: [] },
      retrato('c4_abril', CAST_CORO, 'abril', 'reposo', 'feliz'),
      retrato('c4_av_sora', CAST_CORO, 'sora', 'saludo_a', 'feliz'),
      retrato('c4_av_esteban', CAST_CORO, 'esteban', 'pensando', 'concentrado'),
      { id: 'c4_fin_coro', cam: [[-3, 1.6, 6], [8, 1.2, 1], 44], poses: { sora: ['senalar_a', 'feliz'], casiano: ['aplauso_a', 'feliz'], gregoria: ['reposo', 'hablar'], basilia: ['reposo', 'hablar'], esteban: ['brazos_cruzados', 'feliz'] }, hacer: 'coro' },
      { id: 'c4_fin_abril', cam: [[9.6, 1.4, 7.6], [12.2, 1.0, 3.6], 34], poses: { abril: ['saludo_b', 'llorando'] }, hacer: 'sale' },
    ]);
}

// =================================================================== Caso 5 · El astrónomo de Nocturna

const CAST_LUNA: Puesto[] = [['teofilo', 'teofilo', 0, 1.2, 0, 8], ['naim', 'nocturna_naim', -2.4, 0.4, 0.6, 8], ['matea', 'nocturna_matea', 2.4, 0.4, -0.6, 8], ['bernardo', 'nocturna_bernardo', 4.2, -0.4, -1, 8]];
function nocturna(mancha: boolean): SetFotos {
  return set(mancha ? 'c5_mancha' : 'c5_luna', {
    hora: 'noche', sol: new THREE.Vector3(0.5, 0.45, 0.4), colores: mancha ? ['#4a4a52', '#3a3a42', '#55555c'] : ['#9a9aa8', '#8a8a98', '#aaaab6'], niebla: ['#05060f', 40, 220], exposicion: 1.4, radio: 26,
    cast: CAST_LUNA,
    async montar(g, k) {
      if (!mancha) g.add(poner(k.astra, 'casa_orbita', -3, -8, 0.3, 1.3), poner(k.paisaje, 'antena', 5, -7, -0.4, 1.3), poner(k.paisaje, 'panel_solar', 8, -3, -0.8), poner(k.paisaje, 'plataforma_nave', -9, -2, 0.4), poner(k.maquinas, 'nave_exploradora', -9, -2, 0.8, 1));
      regar(g, k.paisaje, 'roca_lunar', 40, 4, 40, 0, -4, [0.8, 2], mancha ? 13 : 3, (x, z) => Math.hypot(x, z - 1) > 4);
      regar(g, k.paisaje, 'crater', 14, 6, 40, 0, -4, [1, 2.4], mancha ? 7 : 5, (x, z) => Math.hypot(x, z - 1) > 5);
      // Las balizas del tránsito: una fila de faroles hacia el borde
      const farol = await k.v2('farol');
      for (let i = 0; i < 9; i++) {
        const x = 6 + i * 3.2, z = -2 - i * 4.2;
        const f = copia(farol, mancha ? -6 + i * 2.6 : x, mancha ? 2 - i * 3.6 : z, 0, 1.2);
        f.name = 'baliza' + i;
        g.add(f);
        const h = brillo(g, f.position.x, 2.3, f.position.z, '#ffe08a', 2.2, 0);
        h.name = 'luz' + i;
      }
      // El planeta grande en el cielo
      const pl = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 24), new THREE.MeshStandardMaterial({ color: '#5f9a6a', emissive: '#1a3a4a', emissiveIntensity: 0.5, roughness: 1, fog: false }));
      pl.position.set(-60, 40, -160);
      g.add(pl);
      brillo(g, -60, 40, -160, '#9fd6ff', 90, 0.4);
      // La Andariega: una astilla oscura que tapa estrellas, con su cola de ceniza
      const astilla = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 0), new THREE.MeshBasicMaterial({ color: '#0a0a10', fog: false }));
      astilla.position.set(40, 70, -160);
      astilla.name = 'astilla';
      g.add(astilla);
      brillo(g, 40, 70, -160, '#5a5a8a', 30, 0.25);
      if (mancha) g.add(motasFlotantes(400, [0, 4, -6], 14, 8, [0.5, 0.5, 0.55], 2.4, 21));
    },
    hacer(que, g, rp) {
      const n = que.includes('fila') ? 9 : que === 'una' ? 1 : 0;
      for (let i = 0; i < 9; i++) { const h = g.getObjectByName('luz' + i) as THREE.Sprite | undefined; if (h) h.material.opacity = i < n ? 0.95 : 0; }
      if (que.includes('refugio')) colocar(rp.teofilo, 23.6, -25.2, 30, -18);
      else colocar(rp.teofilo, 0, 1.2, 0, 8);
    },
  }, mancha
    ? [
      { id: 'c5_mancha', cam: [[0, 2, 9], [6, 6, -40], 52], salen: [], hacer: 'nada' },
      { id: 'c5_balizas', cam: [[-8, 1.6, 6], [6, 0.8, -20], 46], salen: [], hacer: 'una' },
      { id: 'c5_polvo', cam: [[-4.6, 1.6, 4.2], [-6, 1.4, 2], 34], salen: [], hacer: 'nada', filtro: 'sepia' },
    ]
    : [
      { id: 'c5_fondo', cam: [[4, 1.6, 10], [-10, 12, -40], 54], salen: [], hacer: 'nada' },
      { id: 'c5_vigia', cam: [[3, 2, 8], [-2, 2.2, -7], 46], salen: [], hacer: 'nada' },
      { id: 'c5_hueco', cam: [[0, 1, 4], [40, 70, -160], 30], salen: [], hacer: 'nada' },
      { id: 'c5_fin_fila', cam: [[0, 2.2, 8], [18, 1, -30], 50], salen: [], hacer: 'fila', bloom: 1.2 },
      { id: 'c5_fin_cielo', cam: [[0, 1.4, 6], [10, 30, -60], 56], poses: { teofilo: ['senalar_arriba', 'feliz'], matea: ['reposo', 'feliz'] }, hacer: 'fila', bloom: 1.1 },
      { id: 'c5_fin_refugio', cam: [[27, 1.6, -19], [24.4, 1.1, -26], 38], poses: { teofilo: ['sentado_feliz', 'feliz'] }, hacer: 'fila refugio', bloom: 1.1 },
      retrato('c5_teofilo', CAST_LUNA, 'teofilo', 'reposo', 'feliz'),
      retrato('c5_av_naim', CAST_LUNA, 'naim', 'brazos_cruzados', 'normal'),
      retrato('c5_av_matea', CAST_LUNA, 'matea', 'saludo_a', 'feliz'),
    ]);
}

// =================================================================== Caso 6 · La ruta del carro de agua

const CAST_DESIERTO: Puesto[] = [['simon', 'simon', 0, 1, 0, 8], ['ezequiel', 'ambar_ezequiel', -2.2, 0.4, 0.4, 8], ['kenzo', 'ambar_kenzo', 2.2, 0.4, -0.4, 8], ['zora', 'ambar_zora', 4, 0, -1, 8], ['rocio', 'ambar_rocio', -4, -0.4, 1, 8]];
function desierto(tormenta: boolean): SetFotos {
  return set(tormenta ? 'c6_tormenta' : 'c6_desierto', {
    hora: 'tarde', sol: new THREE.Vector3(-0.4, 0.6, -0.6), colores: ['#e8c88a', '#dcb874', '#f0d49a', '#d0a868'], niebla: tormenta ? ['#d8a868', 6, 40] : ['#f6dcb0', 40, 200], exposicion: 1.05, radio: 24,
    cast: tormenta ? [] : CAST_DESIERTO,
    async montar(g, k) {
      for (const [x, z, rx, rz] of [[-20, -30, 14, 6], [18, -40, 20, 8], [0, -60, 30, 10], [30, -10, 10, 5], [-30, 0, 8, 6]] as const) banco(g, x, z, rx, rz, '#e4c080', 2.2);
      // Las ruinas de la terraza 9 (a la derecha, al fondo)
      const ruinas = new THREE.Group();
      for (let i = 0; i < 6; i++) ruinas.add(poner(k.abadia, i % 2 ? 'pared_dura_a' : 'pared_borde', i * 2 - 5, -2, 0, 1.6));
      ruinas.add(poner(k.abadia, 'pared_dura_b', -6, 0, Math.PI / 2, 1.6), poner(k.cementerio, 'deco_fosa', 0, 1.4, 0, 1.4));
      ruinas.add(poner(k.paisaje, 'basalto', 5, 2, 0, 1.4), poner(k.paisaje, 'roca_volcanica', -4, 3, 1, 1.2));
      ruinas.position.set(10, 0, -12);
      g.add(ruinas);
      // El carro: la vagoneta con los doce barriles
      const barril = await k.v2('barril');
      const carro = new THREE.Group();
      carro.add(poner(k.minas, 'deco_vagoneta', 0, 0, 0, 1.6));
      for (let i = 0; i < 6; i++) carro.add(copia(barril, -0.6 + (i % 3) * 0.6, -0.3 + Math.floor(i / 3) * 0.6, 0, 0.55, 0.7));
      carro.position.set(-5, 0, -4);
      carro.rotation.y = 0.5;
      g.add(carro);
      g.add(poner(k.paisaje, 'invernadero_cupula', -16, -24, 0, 1.4), poner(k.paisaje, 'pozo', -9, 2, 0, 1.1));
      regar(g, k.paisaje, 'roca_volcanica', 20, 8, 50, 0, -10, [0.8, 2.4], 4);
      if (tormenta) g.add(motasFlotantes(600, [0, 2, -4], 18, 6, [0.85, 0.65, 0.4], 3.2, 31));
    },
  }, tormenta
    ? [{ id: 'c6_tormenta', cam: [[-1, 1.6, 6], [-5, 1, -6], 46], salen: [] }]
    : [
      { id: 'c6_fondo', cam: [[0, 2.4, 12], [0, 2, -20], 50], salen: [] },
      { id: 'c6_carro', cam: [[-1.6, 1.6, 1.6], [-5, 0.8, -4], 40], salen: [] },
      { id: 'c6_terraza', cam: [[6, 1.8, -1], [10, 1.2, -12], 44], salen: [] },
      { id: 'c6_losa', cam: [[10, 2.6, -7], [10, 0.2, -10.6], 40], salen: [] },
      retrato('c6_simon', CAST_DESIERTO, 'simon', 'reposo', 'feliz'),
      retrato('c6_av_ezequiel', CAST_DESIERTO, 'ezequiel', 'brazos_cruzados', 'normal'),
      retrato('c6_av_kenzo', CAST_DESIERTO, 'kenzo', 'pulgares_a', 'feliz'),
      { id: 'c6_fin_llegan', cam: [[3, 1.6, 9], [4, 1.2, -6], 46], poses: { ezequiel: ['saludo_a', 'feliz'], kenzo: ['senalar_a', 'feliz'], zora: ['reposo', 'feliz'] } },
    ]);
}

const CAST_ALJIBE: Puesto[] = [['simon', 'simon', -1.2, 1.4, 0.4, 6], ['zora', 'ambar_zora', 1.2, 1.6, -0.4, 6], ['kenzo', 'ambar_kenzo', 2.8, 0.8, -1, 6]];
const aljibe = set('c6_aljibe', {
  hora: 'noche', colores: null, fondo: '#070503', exposicion: 1.5, radio: 10,
  cast: CAST_ALJIBE,
  montar(g, k) {
    const kit = k.catacumbas;
    piso(g, kit, -3, 3, -4, 2);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; if (Math.sin(a) > 0.6) continue; g.add(poner(kit, i % 2 ? 'pared_dura_a' : 'pared_dura_b', Math.cos(a) * 7, Math.sin(a) * 6 - 2, -a, 2)); }
    const pozo = agua(6, 4, '#2a6a8a');
    pozo.position.set(0, 0.08, -2.4);
    g.add(pozo);
    g.add(poner(k.paisaje, 'roca_volcanica', -3.4, -2.4, 0, 0.8), poner(k.paisaje, 'roca_volcanica', 3.4, -2.6, 2, 0.8), poner(k.minas, 'luz_lampara', -2.4, 0.4));
    brillo(g, 0, 7, -2, '#ffe8b0', 8, 0.5);
    luz(g, 0, 6, -2, '#ffe8b0', 4, 14);
    luz(g, -2.4, 1.4, 0.4, '#ffb35a', 2, 7);
    luz(g, 0, 0.6, -2.4, '#6ac0e0', 1.4, 5);
  },
}, [
  { id: 'c6_aljibe', cam: [[0.4, 2.4, 3], [0, 0, -2.6], 44], salen: [], filtro: 'oscura' },
  { id: 'c6_fin_aljibe', cam: [[0, 1.8, 6.6], [0, 0.9, -1], 44], poses: { simon: ['senalar_a', 'feliz'], zora: ['boca_abierta', 'sorprendido'], kenzo: ['aplauso_a', 'carcajada'] } },
]);

const CAST_HUERTA: Puesto[] = [['rocio', 'ambar_rocio', 0.4, 1.2, 0, 8], ['simon', 'simon', -1.8, 0.8, 0.4, 8], ['nina', 'nina', 2.2, 1.6, -0.4, 8], ['nino', 'nino', -3.4, 1.8, 0.6, 8]];
const huerta = set('c6_huerta', {
  hora: 'tarde', sol: new THREE.Vector3(-0.6, 0.45, -0.5), colores: ['#e8c88a', '#dcb874', '#f0d49a'], niebla: ['#f6dcb0', 40, 200], exposicion: 1.05, radio: 18,
  cast: CAST_HUERTA,
  async montar(g, k) {
    const [parcela, tomate, maiz, zanahoria] = await Promise.all([k.v2('parcela_regada'), k.v2('tomate_3'), k.v2('maiz_3'), k.v2('zanahoria_3')]);
    for (let x = -3; x <= 3; x++) for (let z = -3; z <= -1; z++) { g.add(copia(parcela, x * 1.6, z * 1.6, 0, 1)); g.add(copia([tomate, maiz, zanahoria][(x + z + 9) % 3], x * 1.6, z * 1.6, x, 1)); }
    g.add(poner(k.paisaje, 'invernadero_cupula', 9, -8, -0.4, 1.2), poner(k.paisaje, 'pozo', -7, -2), poner(k.astra, 'casa_orbita', -10, -10, 0.4, 1.1));
  },
}, [{ id: 'c6_fin_huerta', cam: [[0, 1.8, 7.6], [0, 0.9, -1], 46], poses: { rocio: ['aplauso_a', 'feliz'], simon: ['pulgares_a', 'carcajada'], nina: ['celebrar', 'carcajada'], nino: ['salto', 'feliz'] } }]);

// =================================================================== Caso 7 · Un concierto que se vea

const COLORES_SENAS: Record<string, string> = { luz1: '#3ad46a', luz2: '#ffb02a', luz3: '#3a7aff', luz4: '#ff4a4a', luz5: '#b04aff' };
const CAST_IRIS: Puesto[] = [['ximena', 'ximena', 0, 1.4, 0, 8], ['maia', 'iris_maia', -2, 0.8, 0.4, 8], ['nahuel', 'iris_nahuel', 2, 0.8, -0.4, 8], ['orin', 'iris_orin', 3.8, 0.2, -1, 8], ['mauro', 'iris_mauro', -3.8, 0.2, 1, 8], ['calista', 'iris_calista', 5.4, 1.2, -1, 8]];
function iridalia(noche: boolean): SetFotos {
  return set(noche ? 'c7_noche' : 'c7_tarde', {
    hora: noche ? 'noche' : 'atardecer', sol: new THREE.Vector3(-0.6, 0.25, -0.6), colores: ['#6a4a8a', '#7a5a9a', '#5a3a7a', '#8a6aa8'], niebla: noche ? ['#140c24', 25, 140] : ['#c8a0e0', 35, 180], exposicion: noche ? 1.35 : 1.05, radio: 24,
    cast: CAST_IRIS,
    async montar(g, k) {
      // El escenario de la loma con el cristal madre
      g.add(poner(k.eterna, 'deck_rio', 0, -3.4, 0, 1.6));
      const madre = poner(k.minas, 'deco_cristal_grande', 0, -5, 0, 3.2);
      g.add(madre);
      brillo(g, 0, 2.6, -5, '#d8b0ff', 7, noche ? 0.7 : 0.35);
      luz(g, 0, 2.4, -4.4, '#c890ff', noche ? 3 : 1.4, 9);
      const cristal = await k.v2('mena_cristal');
      // Los cristales del valle (al fondo, en la ladera)
      const r = azar(17);
      for (let i = 0; i < 26; i++) {
        const x = -26 + r() * 52, z = -12 - r() * 26;
        g.add(copia(cristal, x, z, r() * 6, 1.4 + r() * 1.4));
        const h = brillo(g, x, 1.2, z, '#ffffff', 3, 0);
        h.name = 'valle' + i;
      }
      regar(g, k.nodos, 'nodo_cristales', 20, 6, 22, 0, 0, [1, 1.8], 4, (x, z) => Math.hypot(x, z) > 6);
      regar(g, k.monte, 'pino', 30, 24, 70, 0, -10, [1.2, 1.8], 6);
      // La boca de la Gran Geoda, a la derecha del escenario
      const boca = new THREE.Group();
      for (let i = 0; i < 5; i++) boca.add(poner(k.minas, i % 2 ? 'pared_dura_a' : 'veta_oro', Math.cos(i * 0.8) * 2.4, Math.sin(i * 0.8) * -1.4, i, 1.6));
      boca.add(poner(k.minas, 'deco_cristal_chico', 0.6, 0.4, 0, 1.6), poner(k.minas, 'deco_puntal', -1, 0.8));
      boca.position.set(9, 0, -4);
      g.add(boca);
      brillo(g, 9, 0.8, -3.4, '#b07aff', 3, 0.5);
      g.add(motasFlotantes(140, [0, 1.5, -6], 14, 4, [0.9, 0.75, 1], 1.8, 9));
    },
    hacer(que, g, rp) {
      const color = COLORES_SENAS[que];
      for (let i = 0; i < 26; i++) {
        const h = g.getObjectByName('valle' + i) as THREE.Sprite | undefined;
        if (!h) continue;
        if (que === 'fiesta') { h.material.color.set(Object.values(COLORES_SENAS)[i % 5]); h.material.opacity = 0.95; h.scale.setScalar(5); }
        else if (color && i % 3 === 0) { h.material.color.set(color); h.material.opacity = 0.95; h.scale.setScalar(6); }
        else h.material.opacity = 0;
      }
      if (que === 'rescate') { colocar(rp.orin, 8, -1.6, 9, -4); colocar(rp.mauro, 10.4, -1.4, 9, -4); colocar(rp.ximena, 9, -3.4, 9, 4); }
      else { for (const [id, , x, z, mx, mz] of CAST_IRIS) colocar(rp[id], x, z, mx, mz); }
    },
  }, noche
    ? [
      ...(['luz1', 'luz2', 'luz3', 'luz4', 'luz5'] as const).map((id): TomaFoto => ({ id: 'c7_' + id, cam: [[0, 3, 10], [0, 1, -24], 46], salen: [], hacer: id, bloom: 1.3 })),
      { id: 'c7_fin_concierto', cam: [[0, 2.2, 9], [0, 1.6, -10], 50], poses: { ximena: ['acariciar', 'feliz'], maia: ['aplauso_a', 'carcajada'], nahuel: ['senalar_a', 'feliz'], orin: ['aplauso_b', 'feliz'], mauro: ['celebrar', 'feliz'], calista: ['aplauso_a', 'feliz'] }, hacer: 'fiesta', bloom: 1.4 },
      { id: 'c7_fin_senas', cam: [[1, 1.5, 5.2], [0.8, 1.1, 1.1], 34], poses: { ximena: ['saludo_b', 'feliz'], nahuel: ['hablar_a', 'feliz'] }, hacer: 'fiesta', bloom: 1.2 },
      { id: 'c7_fin_rescate', cam: [[7, 1.6, 3], [9.2, 0.9, -3], 40], poses: { orin: ['agitar_a', 'sorprendido'], mauro: ['senalar_a', 'feliz'], ximena: ['saludo_a', 'llorando'] }, hacer: 'rescate', bloom: 1.2 },
    ]
    : [
      { id: 'c7_fondo', cam: [[0, 2.4, 10], [0, 2, -16], 52], salen: [], hacer: 'nada' },
      { id: 'c7_escenario', cam: [[3, 1.8, 6], [0, 1.4, -4.4], 44], salen: [], hacer: 'nada' },
      { id: 'c7_manos', cam: [[1.6, 1.5, 3.4], [0.2, 1.2, -1.0], 36], poses: { ximena: ['acariciar', 'concentrado'] }, hacer: 'manos' },
      { id: 'c7_entrada', cam: [[7.2, 1.4, 1.4], [9, 0.8, -4], 40], salen: [], hacer: 'nada' },
      retrato('c7_ximena', CAST_IRIS, 'ximena', 'reposo', 'feliz'),
      retrato('c7_av_maia', CAST_IRIS, 'maia', 'pulgares_a', 'feliz'),
      retrato('c7_av_nahuel', CAST_IRIS, 'nahuel', 'saludo_a', 'feliz'),
    ]);
}

// =================================================================== Caso 8 · El último turno

const CAST_EST: Puesto[] = [['joaquin', 'joaquin', 0, 1, 0, 8], ['helena', 'orbita_helena', -2, 0.4, 0.4, 8], ['boris', 'orbita_boris', 2, 0.4, -0.4, 8], ['valentina', 'orbita_valentina', 3.8, -0.2, -1, 8]];
function estacion(): SetFotos {
  return set('c8_estacion', {
    hora: 'noche', sol: new THREE.Vector3(0.6, 0.5, 0.4), colores: ['#8a8a96', '#9a9aa6', '#7a7a86'], niebla: ['#0a0c18', 40, 200], exposicion: 1.35, radio: 26,
    cast: CAST_EST,
    montar(g, k) {
      g.add(poner(k.paisaje, 'invernadero_cupula', -6, -7, 0.3, 1.6), poner(k.paisaje, 'antena', 6, -6, -0.4, 1.3), poner(k.paisaje, 'plataforma_nave', 9, 1, 0.6), poner(k.maquinas, 'nave_exploradora', 9, 1, 0.3, 1));
      g.add(poner(k.astra, 'casa_orbita', 2, -12, 0, 1.4));
      for (let i = 0; i < 5; i++) g.add(poner(k.paisaje, 'panel_solar', -12 + i * 2.6, 4, 0.2));
      regar(g, k.paisaje, 'roca_lunar', 20, 10, 40, 0, -2, [0.8, 1.6], 3, (x, z) => Math.hypot(x, z) > 8);
      const pl = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), new THREE.MeshStandardMaterial({ color: '#5f9a6a', emissive: '#1a3a4a', emissiveIntensity: 0.5, roughness: 1, fog: false }));
      pl.position.set(-40, 20, -150);
      g.add(pl);
      brillo(g, -40, 20, -150, '#9fd6ff', 120, 0.45);
      for (const [x, z] of [[-6, -3.8], [6, -3], [9, 4]] as const) luz(g, x, 2, z, '#7ad8ff', 1.4, 7);
      luz(g, -6, 2, -7, '#b0ffb0', 2, 8);
    },
    hacer(que, _g, rp) {
      if (que === 'afuera') colocar(rp.joaquin, -9, 3, -6, -5);
      else if (que === 'cupula') colocar(rp.joaquin, -3.4, -3.6, -6, -7);
      else if (que === 'puerta') { colocar(rp.helena, -4.6, -3.2, -6, -7); colocar(rp.boris, -3, -3.8, -6, -7); }
      else for (const [id, , x, z, mx, mz] of CAST_EST) colocar(rp[id], x, z, mx, mz);
    },
  }, [
    { id: 'c8_fondo', cam: [[4, 1.6, 10], [-12, 10, -60], 54], salen: [], hacer: 'nada' },
    { id: 'c8_estacion', cam: [[6, 3, 14], [-2, 2, -8], 50], salen: [], hacer: 'nada' },
    { id: 'c8_panel', cam: [[-6, 1.6, 8], [-9, 1, 3], 40], poses: { joaquin: ['pulgares_a', 'feliz'] }, hacer: 'afuera' },
    { id: 'c8_cupula', cam: [[0.4, 1.6, 2], [-5, 1.6, -6], 44], poses: { joaquin: ['caminar_a', 'concentrado'] }, hacer: 'cupula' },
    { id: 'c8_cam_7', cam: [[-2, 5, 6], [-6, 0.6, -2], 50], poses: { joaquin: ['caminar_b', 'concentrado'] }, hacer: 'cupula', filtro: 'camara', marca: 'CASCO S7 · 04/PRI · 02:48:31' },
    { id: 'c8_cam_b', cam: [[13, 4, 6], [9, 0.4, 0], 50], salen: [], hacer: 'nada', filtro: 'camara', marca: 'ESCLUSA B · 04/PRI · 03:12:00' },
    { id: 'c8_fin_puerta', cam: [[-1, 1.6, 2.6], [-5, 1.2, -5], 42], poses: { helena: ['senalar_a', 'enojado'], boris: ['frotar_manos_a', 'concentrado'] }, hacer: 'puerta' },
    { id: 'c8_fin_celia', cam: [[2, 1.4, 5], [-30, 18, -150], 44], poses: { joaquin: ['saludo_b', 'feliz'] }, hacer: 'nada' },
    retrato('c8_joaquin', CAST_EST, 'joaquin', 'reposo', 'feliz'),
    retrato('c8_av_helena', CAST_EST, 'helena', 'brazos_cruzados', 'normal'),
    retrato('c8_av_boris', CAST_EST, 'boris', 'pulgares_a', 'feliz'),
  ]);
}

const CAST_CUPULA: Puesto[] = [['joaquin', 'joaquin', 0.6, -0.4, 0, 6]];
function cupulaDentro(oscura: boolean): SetFotos {
  return set(oscura ? 'c8_dentro' : 'c8_matas', {
    hora: 'noche', colores: null, fondo: '#040608', exposicion: oscura ? 1.1 : 1.5, radio: 10,
    cast: CAST_CUPULA,
    async montar(g, k) {
      const [tomate, maiz, helecho] = await Promise.all([k.v2('tomate_3'), k.v2('maiz_3'), Promise.resolve(piezaKit(k.invernadero, 'inv_helecho'))]);
      for (let x = -3; x <= 3; x++) g.add(poner(k.invernadero, 'inv_piso', x * 2, -1, 0, 1, 0, false), poner(k.invernadero, 'inv_piso', x * 2, -3, 0, 1, 0, false));
      for (const z of [-4.4, 1.8]) for (let x = -2; x <= 2; x++) { g.add(poner(k.invernadero, 'inv_cama', x * 2.2, z, 0, 1)); g.add(copia(x % 2 ? tomate : maiz, x * 2.2, z, x, 1, 0.5)); }
      g.add(poner(k.invernadero, 'inv_estante', -5, -2, Math.PI / 2), poner(k.invernadero, 'inv_costales', 4.6, -1, 0), poner(k.invernadero, 'inv_regadera', 3.6, 0.2), poner(k.invernadero, 'inv_colgante', -2, -2, 0, 1, 2.6, false));
      if (helecho) g.add(copia(helecho, 5, -3.6, 0, 1.4));
      luz(g, 0, 3, 0, oscura ? '#9ad8ff' : '#e8ffe0', oscura ? 1.2 : 3, 12);
      if (oscura) { luz(g, 1, 1.4, 1, '#fff6c8', 2.6, 5); brillo(g, 1.0, 1.3, 0.8, '#fff6c8', 2, 0.5); }
      g.add(motasFlotantes(80, [0, 1.5, -1], 6, 2, [0.8, 1, 0.8], 1.4, 3));
    },
    hacer(_q, _g, rp) { if (rp.joaquin) rp.joaquin.raiz.position.y = 0; },
  }, oscura
    ? [{ id: 'c8_dentro', cam: [[1.2, 1.4, 2.4], [-1, 1, -4.4], 46], salen: [], filtro: 'oscura' }]
    : [{ id: 'c8_fin_matas', cam: [[0.6, 1.4, 3.8], [0.6, 0.7, -0.4], 40], poses: { joaquin: ['sentado', 'dormido'] } }]);
}

export const SETS: Record<string, SetFotos[]> = {
  c1: [terraza(false), terraza(true), comedor, cocina, tunel, vigilia],
  c2: [puerto(false), puerto(true), bancoArena, eras(false), eras(true)],
  c3: [bocamina, galeria, nido(false), nido(true), salida],
  c4: [jardines(false), jardines(true)],
  c5: [nocturna(false), nocturna(true)],
  c6: [desierto(false), desierto(true), aljibe, huerta],
  c7: [iridalia(false), iridalia(true)],
  c8: [estacion(), cupulaDentro(true), cupulaDentro(false)],
};

/** El guion para el motor de cine: una toma quieta por foto. */
export function guionDe(s: SetFotos): Guion {
  const tomas: Toma[] = s.tomas.map((t) => ({ id: t.id, escena: s.id, dur: 1, cam: { de: plano(...(t.cam as [V3, V3, number])), a: plano(...(t.cam as [V3, V3, number])) }, bloom: t.bloom ?? 0.6 }));
  return { id: s.id, nombre: s.id, fov: 40, tomas, escenarios: { [s.id]: s.escenario } };
}

export { sentado, puntosSuaves, agua };
