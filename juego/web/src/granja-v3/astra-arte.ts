/** El arte de las regiones de Astra (solo dibujo: los anclajes, las colisiones y las reglas siguen en astra.ts).
 * Cada región tiene su estilo: la casa de su kit de Blender (granja_astra.glb), el color del suelo, el de los
 * cristales de su mineral y el paisaje que la rodea (granja_astra_paisaje.glb y los kits del monte). Lo grande va por
 * fuera de la zona caminable (|x| < 24, |z| < 28) y adentro solo cosas bajitas que no estorban. */
import * as THREE from 'three';
import { conKit, fundir } from './cuartos';
import { mallaAgua } from './paisaje-render';
import { senderoTierra } from './zonas-render';

type Paleta = { base: string; claro: string; oscuro: string; seco: string; textura?: boolean };
/** [clave, escala mínima, escala máxima, bajo (se puede poner adelante, donde la cámara)] */
type Planta = [string, number, number, boolean?];
interface Estilo {
  casa: string;
  /** Color del «acento» de la casa (los módulos de la órbita). */
  acento?: string;
  cristal: string;
  suelo: Paleta;
  /** Lo que rodea el pueblo (se reparte por el borde, con su peso). */
  borde: Planta[];
  /** Cosas bajitas adentro (en sitios libres fijos). */
  adentro: string[];
  agua?: { hondo: string; claro: string };
  extra?: (poner: Poner) => void;
}
type Poner = (clave: string, x: number, z: number, giro?: number, escala?: number, y?: number) => void;

const VERDE: Paleta = { base: '#8db06c', claro: '#a9c77d', oscuro: '#6f9654', seco: '#b8bf78' };
const ESPACIO = (base: string, claro: string, oscuro: string): Paleta => ({ base, claro, oscuro, seco: claro, textura: false });
const LUNA: Planta[] = [['roca_lunar', 0.8, 2.2], ['crater', 0.9, 2.2, true], ['roca_lunar', 0.5, 1, true], ['antena', 0.9, 1.2], ['panel_solar', 1, 1.2]];

const ESTILOS: Record<string, Estilo> = {
  puerto: {
    casa: 'casa_puerto', cristal: '#7fd0e8', suelo: { base: '#94b874', claro: '#b3cf88', oscuro: '#78a05e', seco: '#d6cc98' },
    borde: [['juncos', 1, 1.6, true], ['piedra_orilla', 1, 1.8, true], ['roble', 0.8, 1.1], ['poste_amarre', 1, 1.2, true], ['mata', 1, 1.5, true]],
    adentro: ['piedra_orilla', 'juncos', 'poste_amarre'], agua: { hondo: '#3f8fb0', claro: '#7cc6d6' },
    extra: (poner) => {
      for (let k = 0; k < 5; k++) poner('muelle', -24 + k * 12, -30.2, Math.PI, 1.3);
      for (const [x, z, r] of [[-18, -37, 0.4], [3, -40, -0.3], [21, -36, 0.9]] as const) poner('barca', x, z, r, 1.2, -0.1);
    },
  },
  bruma: {
    casa: 'casa_bruma', cristal: '#9fe0a8', suelo: { base: '#6f9a5a', claro: '#86b06a', oscuro: '#55804a', seco: '#9aa868' },
    borde: [['arbol_niebla', 0.8, 1.15], ['roble', 0.9, 1.3], ['hongo_gigante', 0.7, 1.2], ['helecho', 1.2, 2, true], ['hongo', 1.2, 2, true], ['tronco_caido', 1, 1.3, true]],
    adentro: ['helecho', 'hongo', 'mata'],
  },
  piedra: {
    casa: 'casa_piedra', cristal: '#ffd27a', suelo: { base: '#a7a582', claro: '#bdb894', oscuro: '#8a8a6c', seco: '#c9b98a' },
    borde: [['roca_grande', 1, 2.2], ['cristales', 0.6, 1, true], ['pino', 0.8, 1.1], ['piedra_orilla', 1.2, 2, true]],
    adentro: ['piedra_orilla', 'cristales'],
    extra: (poner) => { poner('boca_mina', 15, -32, 0, 1.3); for (let k = 0; k < 4; k++) poner('riel', 15, -29.4 + k * 0.8); poner('vagoneta', 15, -27.6); },
  },
  brasa: {
    casa: 'casa_brasa', cristal: '#ff8a4a', suelo: { base: '#7a6458', claro: '#8e766a', oscuro: '#5e4c44', seco: '#9a7a62', textura: false },
    borde: [['basalto', 0.8, 1.6], ['roca_volcanica', 1, 2], ['charco_lava', 0.9, 1.5, true], ['roca_volcanica', 0.4, 0.8, true]],
    adentro: ['charco_lava', 'roca_volcanica'],
  },
  nieve: {
    casa: 'casa_nieve', cristal: '#bfe6ff', suelo: { base: '#e6edf3', claro: '#f6f9fc', oscuro: '#d2dce6', seco: '#dfe7ef', textura: false },
    borde: [['pino_nevado', 0.9, 1.4], ['roca_nevada', 1, 2], ['pino_nevado', 0.5, 0.8, true], ['roca_nevada', 0.5, 0.9, true]],
    adentro: ['roca_nevada'],
  },
  vigilia: {
    casa: 'casa_vigilia', cristal: '#e0a8b0', suelo: { base: '#9c9a6a', claro: '#b0aa7a', oscuro: '#807e58', seco: '#c2b082' },
    borde: [['pino', 0.8, 1.2], ['roca_grande', 1, 1.8], ['mata', 1, 1.5, true]],
    adentro: ['piedra_orilla'],
    extra: (poner) => {
      poner('atalaya', -27, -31, 0.3, 1);
      poner('atalaya', 28, -30, -0.2, 1);
      for (let k = 0; k < 12; k++) poner('empalizada', -27 + k * 4.6, -27.5 - (k % 2) * 0.3, 0, 1.5);
    },
  },
  verdia: {
    casa: 'casa_verdia', cristal: '#f7c6d9', suelo: { base: '#a8cda0', claro: '#c2e0b4', oscuro: '#8fbb88', seco: '#d8e2b0' },
    borde: [['cerezo', 0.9, 1.3], ['rosal', 1, 1.6, true], ['arbol_b', 0.8, 1.1], ['mata', 1, 1.4, true]],
    adentro: ['rosal', 'rosal', 'mata'],
    extra: (poner) => { poner('arco_rosas', 0, 27.2, 0, 1.4); poner('arco_rosas', -24.5, -1.5, Math.PI / 2, 1.2); },
  },
  senda: {
    casa: 'casa_senda', cristal: '#c9a8ff', suelo: { base: '#a99cba', claro: '#bdb2cc', oscuro: '#8e82a2', seco: '#c4b8c8' },
    borde: [['pilar_hilos', 0.9, 1.3], ['roca_grande', 0.8, 1.4], ['cristal_oscuro', 0.5, 0.8, true], ['piedra_orilla', 1, 1.6, true]],
    adentro: ['piedra_orilla'],
  },
  nox: {
    casa: 'casa_nox', cristal: '#9a7ae0', suelo: { base: '#4a4a66', claro: '#5a5a7a', oscuro: '#3a3a52', seco: '#56526a', textura: false },
    borde: [['cristal_oscuro', 0.9, 1.6], ['roca_grande', 0.8, 1.5], ['cristal_oscuro', 0.4, 0.7, true]],
    adentro: ['cristal_oscuro'],
    extra: (poner) => { for (let k = 0; k < 19; k++) poner('poste_cadena', -24 + k * 2.6, 28.6); },
  },
  orbita: { casa: 'casa_orbita', acento: '#2f8f9a', cristal: '#8ee8ff', suelo: ESPACIO('#9a98a2', '#aeacb6', '#86848e'), borde: LUNA, adentro: ['crater', 'roca_lunar'] },
  huerto: {
    casa: 'casa_orbita', acento: '#e0b040', cristal: '#ffe07a', suelo: ESPACIO('#a8a6a0', '#bcb8ae', '#8e8c88'), adentro: ['crater'],
    borde: [['invernadero_cupula', 1, 1.4], ['panel_solar', 1, 1.3], ['roca_lunar', 0.6, 1.6], ['crater', 1, 2, true]],
  },
  nocturna: { casa: 'casa_orbita', acento: '#3a4a8a', cristal: '#c9d6ff', suelo: ESPACIO('#5a5c6e', '#6a6c80', '#4a4c5c'), borde: [...LUNA, ['cristal_oscuro', 0.5, 0.9, true]], adentro: ['crater'] },
  esmeralda: { casa: 'casa_orbita', acento: '#2f8f68', cristal: '#5fe0a0', suelo: ESPACIO('#8a9a90', '#9aaa9e', '#748478'), borde: [...LUNA, ['cristales', 0.7, 1.1, true]], adentro: ['cristales', 'crater'] },
  fragmentos: { casa: 'casa_orbita', acento: '#c4753f', cristal: '#ffb07a', suelo: ESPACIO('#8a7e74', '#9a8e82', '#74685e'), borde: [...LUNA, ['cristales', 0.7, 1.1, true]], adentro: ['crater', 'roca_lunar'] },
  ambar: {
    casa: 'casa_orbita', acento: '#e0a050', cristal: '#ffc060', suelo: ESPACIO('#d4ac78', '#e2c090', '#bc9462'),
    borde: [['roca_volcanica', 0.8, 1.8], ['roca_lunar', 0.8, 2], ['crater', 1, 2, true], ['panel_solar', 1, 1.2], ['invernadero_cupula', 1, 1.2]], adentro: ['crater'],
  },
  iris: {
    casa: 'casa_orbita', acento: '#8a6fb0', cristal: '#d0a8ff', suelo: { base: '#8a7cae', claro: '#a090c2', oscuro: '#706496', seco: '#b0a0c0' },
    borde: [['cerezo', 0.8, 1.2], ['cristal_oscuro', 0.8, 1.3], ['hongo_gigante', 0.8, 1.2], ['cristales', 0.6, 1, true]], adentro: ['cristales', 'hongo'],
  },
  confluencia: {
    casa: 'casa_orbita', cristal: '#ffe7a0', suelo: { base: '#cbb995', claro: '#dccaa6', oscuro: '#b5a380', seco: '#e0d0aa' },
    borde: [['pilar_elemental', 0.9, 1.3], ['roca_grande', 0.8, 1.6], ['piedra_orilla', 1, 1.8, true]], adentro: ['piedra_orilla'],
  },
  valle: { casa: 'casa_bruma', cristal: '#9fe0a8', suelo: VERDE, borde: [['roble', 0.9, 1.3], ['pino', 0.9, 1.2], ['mata', 1, 1.5, true], ['helecho', 1, 1.6, true]], adentro: ['mata'] },
};
const CRISTAL_ELEMENTO: Record<string, string> = { confluencia_fuego: '#ff7a3a', confluencia_agua: '#5ab8ff', confluencia_tierra: '#8ad06a', confluencia_aire: '#e8f4ff' };
const REGION: Record<string, keyof typeof ESTILOS> = {
  puerto_lirios: 'puerto', brumaverde: 'bruma', piedralumbre: 'piedra', brasaviva: 'brasa', nieveclara: 'nieve', vigilia: 'vigilia',
  rosal_eterno: 'verdia', jardines_eco: 'verdia', travesia: 'senda', refugio_hilos: 'senda', bastion_velo: 'nox',
  estacion_celia: 'orbita', borde_astra: 'orbita', huerto_aurelia: 'huerto', vigia_nocturna: 'nocturna', cantera_esmeralda: 'esmeralda',
  campamento_fragmentos: 'fragmentos', fragmentos_cobre: 'fragmentos', fragmentos_cristal: 'fragmentos', ambarina: 'ambar', iridalia: 'iris',
  confluencia: 'confluencia', confluencia_fuego: 'confluencia', confluencia_agua: 'confluencia', confluencia_tierra: 'confluencia', confluencia_aire: 'confluencia',
  cruce_valle: 'valle',
};
const estilo = (region: string) => ESTILOS[REGION[region] ?? 'valle'];
export const paletaSueloAstra = (region: string) => estilo(region).suelo;

const azar = (a: number, b: number) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

/** Material propio teñido (no compartido: se libera con la escena). */
function tenir(o: THREE.Object3D, parte: string, color: string, brillo = 0, cache: Map<string, THREE.Material>) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material) || !m.material.name.toLowerCase().endsWith('| ' + parte)) return;
    const clave = m.material.uuid + color;
    let t = cache.get(clave);
    if (!t) {
      const c = (m.material as THREE.MeshStandardMaterial).clone();
      c.userData = {};
      c.color.set(color);
      if (brillo) { c.emissive.set(color); c.emissiveIntensity = brillo; }
      t = c;
      cache.set(clave, t);
    }
    m.material = t;
  });
}

/** Tablero con un nombre pintado (para los letreros de Blender): plano propio de ancho × alto, de cara a +z. */
export function tablaNombre(nombre: string, ancho = 1.5, alto = 0.42): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round(512 * alto / ancho);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d9b98a'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#8a6242'; ctx.lineWidth = 9; ctx.strokeRect(5, 5, c.width - 10, c.height - 10);
  for (let k = 0; k < 5; k++) { ctx.strokeStyle = '#c4a272'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 18 + k * c.height / 6); ctx.lineTo(c.width - 10, 22 + k * c.height / 6); ctx.stroke(); }
  ctx.fillStyle = '#4a3324'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let tam = Math.round(c.height * 0.48);
  ctx.font = `700 ${tam}px Nunito, sans-serif`;
  while (ctx.measureText(nombre).width > c.width - 40 && tam > 18) { tam -= 2; ctx.font = `700 ${tam}px Nunito, sans-serif`; }
  ctx.fillText(nombre, c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  m.name = 'tabla-nombre';
  return m;
}

/** Letrero de Blender (poste con tablero) con su nombre, mirando a la cámara. */
function letrero(g: THREE.Group, m: Map<string, THREE.Object3D>, nombre: string, x: number, z: number, escala = 1) {
  const base = m.get('letrero_nombre');
  if (!base) return;
  const o = fundir(base.clone(true));
  o.position.set(x, 0, z); o.scale.setScalar(escala);
  const t = tablaNombre(nombre, 1.46, 0.4);
  t.position.set(0, 1.55, 0.05);
  o.add(t);
  g.add(o);
}

/** La casa de la región para una vivienda (8 × 6, centrada en su huella, la puerta hacia la entrada en +z). */
export function viviendaAstra(capa: THREE.Group, region: string, h: { id: string; nombre: string; x: number; z: number; entrada: { x: number; z: number } },
  listo: (o: THREE.Object3D) => void) {
  const e = estilo(region);
  conKit(capa, 'granja_astra.glb', (m) => {
    const base = m.get(e.casa);
    if (!base) return;
    const cache = new Map<string, THREE.Material>();
    const copia = base.clone(true);
    if (e.acento) tenir(copia, 'acento', e.acento, 0, cache);
    const o = fundir(copia);
    o.name = 'astra-vivienda-' + h.id;
    o.position.set(h.x + 4, 0, h.z + 3);
    capa.add(o);
    // El nombre de la casa en un letrero al lado de la entrada (sin tapar la puerta)
    letrero(capa, m, h.nombre, h.entrada.x + 2.6, h.entrada.z - 0.2, 0.8);
    listo(o);
  });
}

/** Recurso de la región sobre su punto (afloramiento, troncos, cantero o puesto de observación) con su letrero. */
export function recursoAstra(g: THREE.Group, region: string, d: { id: string; nombre: string; clase: string }, p: { x: number; z: number },
  listo: (o: THREE.Object3D) => void) {
  const e = estilo(region);
  conKit(g, 'granja_astra.glb', (m) => {
    const base = m.get('recurso_' + (d.clase === 'mineral' || d.clase === 'madera' || d.clase === 'semilla' ? d.clase : 'fauna'));
    if (!base) return;
    const copia = base.clone(true);
    tenir(copia, 'cristal', CRISTAL_ELEMENTO[region] ?? e.cristal, 0.7, new Map());
    const o = fundir(copia);
    o.name = 'astra-recurso-' + d.id;
    o.position.set(p.x, 0, p.z);
    g.add(o);
    letrero(g, m, d.nombre, p.x + 2.4, p.z + 0.3, 0.85);
    listo(o);
  });
}

/** Archivo público (atril y tablón) o lugar de la Confluencia, y la puerta de la zona de combate. */
export function lugaresAstra(capa: THREE.Group, region: string, archivo: string, combate: boolean) {
  conKit(capa, 'granja_astra.glb', (m) => {
    const a = m.get('archivo_publico');
    if (a) { const o = fundir(a.clone(true)); o.position.set(0, 0, 23.2); capa.add(o); letrero(capa, m, archivo, -2.6, 23.4, 0.85); }
    const c = m.get('puerta_combate');
    if (combate && c) {
      const o = fundir(c.clone(true));
      o.position.set(18, 0, 24.2);
      const t = tablaNombre('Zona de combate', 1.5, 0.42);
      t.position.set(0, 2.45, 0.41);
      o.add(t);
      capa.add(o);
    }
  });
}

/** Paisaje de la región: caminos entre las casas, agua, lo que la rodea y unas cositas adentro. */
export function paisajeAstra(capa: THREE.Group, region: string, viviendas: { x: number; z: number; entrada: { x: number; z: number } }[],
  rutas: { x: number; z: number }[]) {
  const e = estilo(region);
  // Caminos: el que une las entradas de arriba y uno corto desde cada entrada de abajo hasta la plaza
  if (viviendas.some((h) => h.entrada.z < -5)) capa.add(senderoTierra(0, -8.6, 42, 2.2));
  for (const h of viviendas) if (h.entrada.z > -5) capa.add(senderoTierra(h.entrada.x, (h.entrada.z + 13) / 2, 2.2, 13 - h.entrada.z));
  // Las rutas siguen hacia afuera
  for (const r of rutas) capa.add(senderoTierra(Math.sign(r.x) * 31, r.z, 16, 2.6));
  if (e.agua) { const a = mallaAgua(70, 14, e.agua.hondo, e.agua.claro); a.position.set(0, 0.02, -44); capa.add(a); }
  const archivos = ['granja_astra_paisaje.glb', 'granja_monte.glb', 'granja_pueblo.glb'];
  conKit(capa, archivos[0], (m1) => conKit(capa, archivos[1], (m2) => conKit(capa, archivos[2], (m3) => {
    const m = new Map([...m3, ...m2, ...m1]), kit = new THREE.Group(), cache = new Map<string, THREE.Material>();
    const poner: Poner = (clave, x, z, giro = 0, escala = 1, y = 0) => {
      const base = m.get(clave);
      if (!base) return;
      const o = base.clone(true);
      o.position.set(x, y, z); o.rotation.y = giro; o.scale.setScalar(escala);
      if (clave === 'cristales' || clave === 'pilar_elemental') tenir(o, 'cristal', CRISTAL_ELEMENTO[region] ?? e.cristal, 0.8, cache);
      kit.add(o);
    };
    const libreRuta = (x: number, z: number) => !rutas.some((r) => Math.sign(r.x) === Math.sign(x) && Math.abs(z - r.z) < 3.2);
    // El borde: una franja alrededor de la zona caminable; adelante (cerca de la cámara) solo lo bajito
    const altas = e.borde.filter((p) => !p[3]), bajas = e.borde.filter((p) => p[3]);
    let n = 0;
    for (let x = -40; x <= 40; x += 3.4) for (let z = -46; z <= 36; z += 3.4) {
      const jx = x + (azar(x, z) - 0.5) * 2.6, jz = z + (azar(z, x) - 0.5) * 2.6;
      const fuera = Math.abs(jx) > 25.5 || jz < -29.5 || jz > 29.5;
      if (!fuera || !libreRuta(jx, jz)) continue;
      if (e.agua && jz < -31 && Math.abs(jx) < 40) continue;
      const adelante = jz > 26;
      const lista = adelante ? bajas : (azar(jx * 3, jz) < 0.72 ? altas : bajas);
      if (!lista.length || azar(jx, jz * 2) < (adelante ? 0.45 : 0.18)) continue;
      const [clave, a, b] = lista[Math.floor(azar(jx * 7, jz * 5) * lista.length)];
      poner(clave, jx, jz, azar(jx, jz * 3) * 6.28, a + (b - a) * azar(jx * 2, jz));
      n++;
    }
    // Adentro, en sitios que no usa nada (ni casas, ni recursos, ni el archivo, ni los caminos)
    const sitios: [number, number][] = [[-21, 26], [-10.5, 25.5], [10.5, 25.5], [22, -15], [22, -8.5], [-22, -21], [-1, -21], [21.5, 2.5], [-21.5, 10]];
    sitios.forEach(([x, z], k) => { if (!libreRuta(x, z) || viviendas.some((h) => x > h.x - 1 && x < h.x + 9 && z > h.z - 1 && z < h.z + 8)) return; poner(e.adentro[k % e.adentro.length], x, z, k * 1.7, 0.9 + (k % 3) * 0.15); });
    e.extra?.(poner);
    if (!kit.children.length) return;
    const unido = fundir(kit);
    unido.name = 'astra-paisaje-' + region + '-' + n;
    capa.add(unido);
  })));
}
