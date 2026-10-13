import { camaAnimal } from './refugios';
import { conKit, fundir } from './cuartos';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Native clay art. All geometry and materials created here belong to the returned
 * object. Animal recolouring clones only changed geometry, never the GLB cache. */
type V3 = [number, number, number];
type ColorSpec = [string, string];
const C = (hex: string) => new THREE.Color(hex);
const PALETAS: Record<string, ColorSpec[]> = {
  vaca: [['#f6ead8', '#79513b'], ['#faf1e0', '#303139'], ['#d9ae6d', '#fff1d5'], ['#fff7e8', '#d6d9d8']],
  cerdito: [['#e9aea2', '#f0baae'], ['#f2c4ac', '#594742'], ['#996546', '#b17e5b'], ['#f5e4bf', '#fff0d4']],
  gallina: [['#f5dfb8', '#b47b47'], ['#363644', '#78607e'], ['#b76742', '#efb574'], ['#fff5e5', '#d6cbb9']],
  conejo: [['#c5a98c', '#fff3dc'], ['#3d3840', '#b0a6aa'], ['#9caaa9', '#f0efde'], ['#fff6e8', '#eddfda']],
  oveja: [['#f6ecd9', '#97745c'], ['#484251', '#716072'], ['#b7865d', '#87604d'], ['#ecedef', '#b29aa2']],
};
const BASES: Record<string, string[]> = {
  vaca: ['#f6ead8', '#79513b'], cerdito: ['#e9aea2', '#f0baae'],
  gallina: ['#f5dfb8', '#fff3dc', '#e7cfa7', '#f3deb8', '#e8cfa4', '#b47b47', '#d5b47b'],
  conejo: ['#c5a98c'], oveja: ['#f6ecd9', '#e5d7bc', '#eee1c9', '#97745c', '#a9876c'],
};
const FANTASIA: Record<string, ColorSpec> = {
  vaca_volcan: ['#61536c', '#302d40'], vaca_nube: ['#e2eef6', '#acbad6'],
  cerdito_musgo: ['#a4b888', '#d9d9a2'], cerdito_ambar: ['#dfa458', '#f2cd80'],
  gallina_oscura: ['#39354e', '#756084'], gallina_aurora: ['#aed4c9', '#ca9ed3'],
  conejo_lunar: ['#c9c1e0', '#f6e5f0'], conejo_escarcha: ['#d2e8ed', '#b5d5e0'],
  oveja_cristal: ['#c7dcd8', '#afbabf'], oveja_tormenta: ['#888fba', '#c3c9db'],
};
const normalizar = (especie: string) => especie === 'cerdo' ? 'cerdito' : especie === 'pollo' ? 'gallina' : especie;
function fantasiaId(especie: string, id: string | null) {
  if (!id) return null;
  if (FANTASIA[id]) return id;
  const normalized = id.replace(/^cerdo_/, 'cerdito_');
  return FANTASIA[normalized] ? normalized : FANTASIA[`${especie}_${id}`] ? `${especie}_${id}` : null;
}

function newMaterial(hex: string, glow = false) {
  const m = new THREE.MeshStandardMaterial({ color: hex, roughness: .78, metalness: 0 });
  if (glow) { m.emissive.set(hex); m.emissiveIntensity = .32; }
  return m;
}
function mesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, material: THREE.Material, pos: V3 = [0, 0, 0], name = 'detalle') {
  const o = new THREE.Mesh(geo, material); o.position.set(...pos); o.name = name;
  o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function ell(parent: THREE.Object3D, size: V3, pos: V3, mat: THREE.Material, name = 'forma') {
  const geo = new THREE.SphereGeometry(1, 14, 9); geo.scale(size[0] / 2, size[1] / 2, size[2] / 2);
  return mesh(parent, geo, mat, pos, name);
}
function box(parent: THREE.Object3D, size: V3, pos: V3, mat: THREE.Material, radius = .045) {
  return mesh(parent, new RoundedBoxGeometry(...size, 1, Math.min(radius, ...size.map(x => x * .4))), mat, pos);
}
function rod(parent: THREE.Object3D, a: V3, b: V3, radius: number, mat: THREE.Material) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), delta = bv.clone().sub(av);
  const o = mesh(parent, new THREE.CylinderGeometry(radius, radius, delta.length(), 8), mat);
  o.position.copy(av.add(bv).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return o;
}
function tube(parent: THREE.Object3D, points: V3[], radius: number, mat: THREE.Material, segments = 18) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, 6, false), mat);
}
function crystal(parent: THREE.Object3D, pos: V3, length: number, width: number, mat: THREE.Material, rot: V3 = [0, 0, 0]) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g);
  mesh(g, new THREE.CylinderGeometry(width * .62, width, length * .69, 5), mat, [0, length * .345, 0]);
  mesh(g, new THREE.ConeGeometry(width * .62, length * .31, 5), mat, [0, length * .845, 0]); return g;
}
function leaf(parent: THREE.Object3D, pos: V3, size: number, mat: THREE.Material, rot = 0) {
  const o = ell(parent, [size * .47, size, size * .15], pos, mat, 'hoja'); o.rotation.set(.35, 0, rot); return o;
}
function flower(parent: THREE.Object3D, pos: V3, size: number, petal: THREE.Material, center: THREE.Material) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ell(g, [size * .62, size * .23, size * .62], [Math.cos(a) * size * .32, 0, Math.sin(a) * size * .32], petal); }
  ell(g, [size * .37, size * .29, size * .37], [0, size * .07, 0], center); return g;
}
function collectResources(root: THREE.Object3D) {
  const geometry = new Set<THREE.BufferGeometry>(), material = new Set<THREE.Material>();
  root.traverse(o => { if (!(o instanceof THREE.Mesh)) return; geometry.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) material.add(m); });
  return { geometry, material };
}
/** Call only for objects produced by crearRefugio / decorarInterior. */
export function disponerArte(root: THREE.Object3D) {
  const resources = collectResources(root); root.removeFromParent();
  // (las piezas del kit de Blender comparten materiales con las demás copias: esos no se destruyen)
  resources.geometry.forEach(g => { if (!g.userData.compartido) g.dispose(); }); resources.material.forEach(m => { if (!m.userData.compartido) m.dispose(); });
}
function compact(root: THREE.Group) {
  const byMaterial = new Map<THREE.Material, THREE.Mesh[]>();
  root.updateMatrixWorld(true);
  root.traverse(o => { if (o instanceof THREE.Mesh && !Array.isArray(o.material)) { const list = byMaterial.get(o.material) ?? []; list.push(o); byMaterial.set(o.material, list); } });
  const inverse = root.matrixWorld.clone().invert();
  for (const [mat, meshes] of byMaterial) {
    if (meshes.length < 2) continue;
    const parts = meshes.map(m => { const g = m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld)); g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; });
    const merged = mergeGeometries(parts, false); parts.forEach(g => g.dispose()); if (!merged) continue;
    meshes.forEach(m => { m.removeFromParent(); m.geometry.dispose(); }); mesh(root, merged, mat, [0, 0, 0], 'superficie_' + mat.uuid.slice(0, 6));
  }
}

export function aplicarVariante(root: THREE.Group, especie: string, variante: 0 | 1 | 2 | 3, fantasia: string | null = null): () => void {
  especie = normalizar(especie); const fant = fantasiaId(especie, fantasia);
  const palette = fant ? FANTASIA[fant] : PALETAS[especie]?.[variante];
  const replacements: { mesh: THREE.Mesh; original: THREE.BufferGeometry; owned: THREE.BufferGeometry }[] = [];
  const added: THREE.Group[] = [];
  if (palette && (variante !== 0 || fant)) {
    const targets = palette.map(C), bases = (BASES[especie] ?? []).map(C);
    root.traverse(o => {
      if (!(o instanceof THREE.Mesh) || !o.geometry.getAttribute('color')) return;
      let p: THREE.Object3D | null = o;
      while (p && p !== root) { if (/ojo_|pezuña|mandibula/.test(p.name)) return; p = p.parent; }
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.some(m => /eye|metal|glass/.test(m.name))) return;
      const original = o.geometry, input = original.getAttribute('color'), positions = original.getAttribute('position');
      const colors = new Float32Array(input.count * 3); let changed = false;
      for (let i = 0; i < input.count; i++) {
        const color = new THREE.Vector3(input.getX(i), input.getY(i), input.getZ(i)); let best = .0032, which = -1, shade = 1;
        // Compare against each original colour ray, preserving the clay's baked
        // underside shading. Eye pivots and hooves are excluded above.
        for (let j = 0; j < bases.length; j++) {
          const b = new THREE.Vector3(bases[j].r, bases[j].g, bases[j].b), t = color.dot(b) / b.lengthSq();
          const d = color.clone().addScaledVector(b, -t).lengthSq() / Math.max(.1, b.lengthSq());
          if (t >= .87 && t <= 1.035 && d < best) { best = d; which = j; shade = t; }
        }
        let result: THREE.Color | undefined;
        if (which >= 0) {
          let index = especie === 'oveja' ? (which > 2 ? 1 : 0) : especie === 'gallina' ? (which > 4 ? 1 : 0) : especie === 'vaca' ? which : 0;
          result = targets[index].clone().multiplyScalar(shade);
          if (especie === 'cerdito' && variante === 1 && !fant) {
            const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
            const a = ((x + .31) / .23) ** 2 + ((y - .08) / .33) ** 2 + ((z + .19) / .41) ** 2;
            const b = ((x - .35) / .22) ** 2 + ((y - .05) / .38) ** 2 + ((z - .19) / .25) ** 2;
            result.lerp(targets[1], 1 - THREE.MathUtils.smoothstep(Math.min(a, b), .7, 1.23));
          }
          changed = true;
        }
        // Cow marks have a soft interpolation on the original mesh. Map that
        // interpolation too, so a new black coat has no leftover brown border.
        if (especie === 'vaca' && !result && bases.length > 1) {
          const lo = new THREE.Vector3(bases[1].r, bases[1].g, bases[1].b), hi = new THREE.Vector3(bases[0].r, bases[0].g, bases[0].b), delta = hi.clone().sub(lo);
          const t = THREE.MathUtils.clamp(color.clone().sub(lo).dot(delta) / delta.lengthSq(), 0, 1);
          const projected = lo.clone().addScaledVector(delta, t);
          if (color.distanceToSquared(projected) < .0018) { result = targets[1].clone().lerp(targets[0], t); changed = true; }
        }
        colors[i * 3] = result?.r ?? color.x; colors[i * 3 + 1] = result?.g ?? color.y; colors[i * 3 + 2] = result?.b ?? color.z;
      }
      if (changed) { const owned = original.clone(); owned.setAttribute('color', new THREE.BufferAttribute(colors, 3)); o.geometry = owned; replacements.push({ mesh: o, original, owned }); }
    });
  }
  if (fant) {
    let body: THREE.Object3D = root, head: THREE.Object3D = root;
    root.traverse(o => { if (o.name.includes('torso_respiracion')) body = o; if (o.name.includes('cabeza_pivote')) head = o; });
    const bodyArt = new THREE.Group(), headArt = new THREE.Group(); bodyArt.name = 'fantasia_torso'; headArt.name = 'fantasia_corona'; body.add(bodyArt); head.add(headArt); added.push(bodyArt, headArt);
    const gold = newMaterial('#ebc784', true), mint = newMaterial('#a9d6bd'), ice = newMaterial('#a9dae6', true), lilac = newMaterial('#baa5e0', true), dark = newMaterial('#524a69'), rose = newMaterial('#dba5c6');
    if (fant === 'vaca_volcan') {
      const lava = newMaterial('#f3a177', true), basalt = newMaterial('#74617a');
      for (const s of [-1, 1]) {
        const surface = (y: number, z: number): V3 => [s * (.485 * Math.sqrt(Math.max(.01, 1 - (y / .455) ** 2 - (z / .74) ** 2)) * (1 + .085 * z / .74) + .007), y, z];
        tube(bodyArt, [surface(.18, -.48), surface(.03, -.25), surface(-.10, .05), surface(-.26, .24)], .011, lava);
        tube(bodyArt, [surface(.03, -.24), surface(.12, -.08), surface(.12, .16)], .008, lava);
        crystal(headArt, [s * .19, .34, -.015], .25, .052, lava, [0, 0, -s * .24]);
      }
      for (let i = 0; i < 4; i++) { const z = -.48 + i * .21; crystal(bodyArt, [0, .455 * Math.sqrt(1 - (z / .74) ** 2) - .023, z], .16 + (i % 2) * .06, .075, basalt, [-.18, 0, 0]); }
    } else if (fant === 'vaca_nube') {
      const cloud = newMaterial('#edf2f4');
      for (let i = 0; i < 7; i++) ell(bodyArt, [.23, .19, .25], [Math.sin(i * 2.4) * .25, .43 + Math.sin(i) * .04, -.36 + i * .11], cloud);
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) ell(headArt, [.14, .12, .12], [s * (.19 + i * .06), .36 + Math.sin(i) * .03, .01], cloud);
      const halo = mesh(headArt, new THREE.TorusGeometry(.18, .012, 6, 24), gold, [0, .57, .01]); halo.rotation.x = Math.PI / 2;
    } else if (fant === 'cerdito_musgo') {
      const moss = newMaterial('#829b67'), petal = newMaterial('#efe0a7');
      for (let i = 0; i < 12; i++) ell(bodyArt, [.17, .10, .20], [Math.sin(i * 2.399) * .31, .32 - Math.abs(Math.sin(i * 2.399)) * .03, Math.cos(i * 2.399) * .36], moss);
      for (let i = 0; i < 4; i++) { flower(bodyArt, [Math.sin(i * 2.4) * .24, .39, Math.cos(i * 2.4) * .28], .11, petal, gold); }
      leaf(headArt, [-.08, .33, .06], .20, mint, .65); leaf(headArt, [.06, .33, .06], .17, moss, -.65);
    } else if (fant === 'cerdito_ambar') {
      for (let i = 0; i < 6; i++) crystal(bodyArt, [Math.sin(i * 2.4) * .27, .29, Math.cos(i * 2.4) * .32], .15 + (i % 2) * .055, .065, gold, [0, i, Math.sin(i) * .4]);
      crystal(headArt, [0, .28, .05], .20, .057, gold);
    } else if (fant === 'gallina_oscura') {
      for (let i = 0; i < 5; i++) leaf(headArt, [(i - 2) * .04, .30 + Math.abs(i - 2) * -.018, -.05], .18, i % 2 ? dark : lilac, (i - 2) * -.27);
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) ell(bodyArt, [.014, .025, .021], [s * .278, .03 - i * .035, -.17 + i * .10], gold);
    } else if (fant === 'gallina_aurora') {
      const tailArt = new THREE.Group(); tailArt.name = 'fantasia_cola'; let tail: THREE.Object3D = body;
      root.traverse(o => { if (o instanceof THREE.Group && o.name.includes('cola_pivote')) tail = o; }); tail.add(tailArt); added.push(tailArt);
      for (let i = 0; i < 7; i++) { const g = leaf(tailArt, [(i - 3) * .035, .17, -.06], .34 + .045 * (3 - Math.abs(i - 3)), [mint, lilac, rose][i % 3], (i - 3) * -.18); g.rotation.x = -.6; }
      crystal(headArt, [0, .28, .005], .19, .024, gold);
    } else if (fant === 'conejo_lunar') {
      // A sculpted crescent made from a solid curved ribbon, not a flat decal.
      const pts: V3[] = []; for (let i = 0; i <= 18; i++) { const a = .6 + i / 18 * 4.7; pts.push([Math.cos(a) * .071, .30 + Math.sin(a) * .074, .21]); } tube(headArt, pts, .013, gold);
      for (const s of [-1, 1]) ell(bodyArt, [.027, .033, .026], [s * .317, .12, -.10], gold);
    } else if (fant === 'conejo_escarcha') {
      for (const s of [-1, 1]) { crystal(headArt, [s * .18, .21, -.03], .21, .035, ice, [0, 0, -s * .46]); crystal(bodyArt, [s * .19, .30, -.22], .13, .044, ice, [0, 0, -s * .3]); }
    } else if (fant === 'oveja_cristal') {
      for (let i = 0; i < 10; i++) crystal(bodyArt, [Math.sin(i * 2.4) * .31, .32 - Math.abs(Math.sin(i * 2.4)) * .02, Math.cos(i * 2.4) * .39], .18 + (i % 3) * .05, .057, i % 2 ? ice : lilac, [Math.cos(i) * .23, i, Math.sin(i) * .3]);
      for (const s of [-1, 1]) crystal(headArt, [s * .15, .24, .02], .18, .045, ice, [0, 0, -s * .33]);
    } else if (fant === 'oveja_tormenta') {
      const cloud = newMaterial('#69779e');
      for (let i = 0; i < 7; i++) ell(bodyArt, [.25, .17, .23], [Math.sin(i * 2.4) * .27, .43, Math.cos(i * 2.4) * .36], cloud);
      for (const s of [-1, 1]) tube(bodyArt, [[s * .42, .23, -.15], [s * .47, .13, -.10], [s * .45, .14, -.03], [s * .44, .02, .08]], .016, gold, 8);
    }
    // Materials created for another branch are unused; dispose them now.
    const used = new Set<THREE.Material>(); added.forEach(g => collectResources(g).material.forEach(m => used.add(m)));
    for (const m of [gold, mint, ice, lilac, dark, rose]) if (!used.has(m)) m.dispose();
    added.forEach(compact);
  }
  let disposed = false;
  return () => {
    if (disposed) return; disposed = true;
    for (const r of replacements) { if (r.mesh.geometry === r.owned) r.mesh.geometry = r.original; r.owned.dispose(); }
    // Some materials are shared between body/head accessories; dispose once.
    const geometry = new Set<THREE.BufferGeometry>(), material = new Set<THREE.Material>();
    for (const g of added) { const r = collectResources(g); r.geometry.forEach(x => geometry.add(x)); r.material.forEach(x => material.add(x)); g.removeFromParent(); }
    geometry.forEach(g => g.dispose()); material.forEach(m => m.dispose());
  };
}

/** A 4 × 4 m building, centred on its footprint. The +Z doorway is open.
 * The game should switch to decorarInterior on entry rather than draw through
 * a closed roof. Styles are visual recipes; gameplay ownership lives elsewhere. */
export function crearRefugio(especie: string, estilo = 'madera'): THREE.Group {
  especie = normalizar(especie); const root = new THREE.Group(); root.name = `refugio_${especie}_${estilo}`;
  root.userData = { footprint: [4, 4], entrada: [0, 0, 2.1], tipo: 'refugio', especie, estilo, ownsResources: true };
  // Techos con color propio y vivo (como el gallinero rojo de Stardew), para reconocer cada refugio de lejos
  const themes: Record<string, string> = { caballo:'#7b4f3b',cabra:'#a8743f',pato:'#4f8f8a',avestruz:'#b4884f',dinosaurio:'#5f8f5a',vaca: '#9c3f36', cerdito: '#c4766b', gallina: '#c65b45', conejo: '#6f9a55', oveja: '#5f7f9c', unicornio: '#a58cc4', dragon: '#7d5a8f', grifo: '#c0954f' };
  const climates: Record<string, [string, string, string]> = { volcanico: ['#b3a4b2', '#77657f', '#edb087'], celeste: ['#d9d5dd', '#afa8c9', '#ebd7a0'], humedo: ['#c5c6a4', '#86a07d', '#d9c193'], mineral: ['#ccc4bd', '#9cb3b6', '#acd7d5'], sombrio: ['#bbb0c3', '#6f6486', '#c8b0d4'], polar: ['#dce3e1', '#9fbdca', '#d2edf0'] };
  const climate = climates[estilo];
  const wall = newMaterial(climate?.[0] ?? (estilo === 'piedra' ? '#b8b9a8' : estilo === 'fantasia' ? '#c0bdce' : '#e0caa1'));
  const timber = newMaterial('#916c50'), dark = newMaterial('#635443'), roof = newMaterial(climate?.[1] ?? themes[especie] ?? '#a58d70'), edge = newMaterial('#eedfbc'), stone = newMaterial('#b8b6a1'), glass = newMaterial('#a5c5c2'), metal = newMaterial(climate?.[2] ?? '#b5a26e');
  box(root, [3.88, .17, 3.90], [0, .075, 0], stone);
  // Side and rear walls, with a genuine clear 1.2 m doorway in front.
  box(root, [.16, 1.90, 3.55], [-1.72, 1.08, 0], wall); box(root, [.16, 1.90, 3.55], [1.72, 1.08, 0], wall);
  box(root, [3.45, 1.90, .16], [0, 1.08, -1.72], wall);
  for (const s of [-1, 1]) { box(root, [1.07, 1.9, .16], [s * 1.16, 1.08, 1.72], wall); box(root, [.14, 2.0, .20], [s * .64, 1.12, 1.77], timber); }
  box(root, [1.41, .17, .23], [0, 2.00, 1.77], timber);
  box(root, [1.4, .13, .66], [0, .12, 1.94], dark);
  for (const x of [-1.76, 1.76]) for (const z of [-1.76, 1.76]) box(root, [.17, 2.09, .17], [x, 1.09, z], timber);
  for (let i = 0; i < 7; i++) { const y = .30 + i * .25; for (const s of [-1, 1]) { box(root, [.025, .022, 3.38], [s * 1.812, y, 0], timber, .005); box(root, [1.04, .022, .025], [s * 1.16, y, 1.811], timber, .005); } }
  // Solid gable ends and two thick roof slopes.
  for (const z of [-1.75, 1.75]) {
    const shape = new THREE.Shape(); shape.moveTo(-1.73, 1.99); shape.lineTo(1.73, 1.99); shape.lineTo(0, 2.91); shape.closePath();
    mesh(root, new THREE.ExtrudeGeometry(shape, { depth: .10, bevelEnabled: false }), wall, [0, 0, z]);
  }
  for (const s of [-1, 1]) {
    const panel = box(root, [2.16, .14, 4.10], [s * .91, 2.48, 0], roof); panel.rotation.z = -s * .478;
    rod(root, [0, 2.99, 2.08], [s * 1.93, 2.0, 2.08], .065, edge);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 9; col++) {
      const x = s * (.26 + row * .47), y = 3.07 - Math.abs(x) * .518;
      const tile = box(root, [.51, .075, .45], [x, y, -1.80 + col * .45 + (row % 2) * .07], roof, .035); tile.rotation.z = -s * .478;
    }
  }
  rod(root, [0, 2.99, -2.03], [0, 2.99, 2.09], .075, edge);
  // Windows, frames, sill boxes and living greenery.
  for (const s of [-1, 1]) {
    box(root, [.70, .67, .08], [s * 1.18, 1.33, 1.831], dark);
    box(root, [.56, .52, .09], [s * 1.18, 1.33, 1.88], glass);
    box(root, [.045, .57, .05], [s * 1.18, 1.33, 1.94], edge); box(root, [.62, .045, .05], [s * 1.18, 1.33, 1.94], edge);
    box(root, [.85, .22, .30], [s * 1.18, .87, 1.98], timber); box(root, [.76, .045, .23], [s * 1.18, 1.00, 1.98], dark);
    for (let i = 0; i < 4; i++) leaf(root, [s * 1.18 + (i - 1.5) * .18, 1.10, 1.98], .26, glass, (i - 1.5) * .35);
  }
  // A species silhouette on the gable makes each home readable at game scale.
  const sign = new THREE.Group(); sign.position.set(0, 2.41, 1.90); root.add(sign);
  ell(sign, [.50, .37, .075], [0, 0, 0], edge);
  const ears = especie === 'conejo' ? .33 : especie === 'cerdito' ? .15 : .12;
  for (const s of [-1, 1]) { const ear = ell(sign, [.12, ears, .06], [s * .18, ears * .42, -.008], edge); ear.rotation.z = -s * .35; ell(sign, [.026, .03, .025], [s * .075, .015, .045], dark); }
  if (['vaca', 'unicornio', 'dragon'].includes(especie)) for (const s of especie === 'unicornio' ? [0] : [-1, 1]) crystal(sign, [s * .14, .17, -.02], especie === 'unicornio' ? .22 : .15, .04, metal, [0, 0, -s * .2]);
  if (especie === 'gallina') for (let i = 0; i < 3; i++) ell(sign, [.07, .12, .055], [(i - 1) * .05, .18, 0], roof);
  if (especie === 'oveja') for (let i = 0; i < 6; i++) ell(sign, [.13, .13, .09], [Math.sin(i * 2.4) * .19, .14 + Math.cos(i * 2.4) * .045, -.025], edge);
  if (especie === 'dragon' || estilo === 'fantasia') for (let i = 0; i < 5; i++) crystal(root, [0, 3, -1.6 + i * .72], .18 + (i % 2) * .07, .10, metal);
  if (estilo === 'volcanico' || estilo === 'mineral' || estilo === 'polar') {
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) crystal(root, [s * 1.78, .16, -1.5 + i * 1.48], .24 + (i % 2) * .13, .13, metal, [0, i, -s * .3]);
  }
  if (estilo === 'humedo') for (const s of [-1, 1]) for (let i = 0; i < 6; i++) leaf(root, [s * 1.65, .38 + i * .28, 1.87], .29, glass, s * (.5 + (i % 2) * .3));
  if (estilo === 'celeste') {
    const halo = mesh(root, new THREE.TorusGeometry(.24, .025, 6, 28), metal, [0, 3.26, .05]); halo.rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) ell(root, [.35, .15, .23], [(i - 2) * .22, 3.00 + Math.sin(i) * .015, .05], edge);
  }
  if (especie === 'grifo') { const perch = box(root, [2.30, .10, .18], [0, 1.16, 2.06], timber); perch.name = 'percha_exterior'; }
  detallesRefugio(root, especie, { wall, timber, dark, roof, edge, stone, metal });
  compact(root);
  // Con granja_refugios.glb (personajes/blender/granja_refugios.py) todo lo de arriba se cambia por el refugio de
  // peluche: cuerpo, techo de tejas gorditas, veleta, la carita de la especie en el frontón y los adornos de clima y
  // especie. Las partes «ref …» del modelo toman los colores de aquí (clima y especie); mientras carga, lo de arriba.
  conKit(root, 'granja_refugios.glb', m => {
    const claves = ['refe_cuerpo', 'refe_techo', especie === 'gallina' || especie === 'pato' ? 'refe_veleta_gallo' : 'refe_veleta_flecha', 'refe_emb_' + especie];
    if (especie === 'gallina' || especie === 'pato') claves.push('refe_nidales');
    if (especie === 'grifo') claves.push('refe_percha');
    if (especie === 'dragon' || estilo === 'fantasia') claves.push('refe_cristales_techo');
    if (estilo === 'volcanico' || estilo === 'mineral' || estilo === 'polar') claves.push('refe_cristales_lado');
    if (estilo === 'humedo') claves.push('refe_enredadera');
    if (estilo === 'celeste') claves.push('refe_halo');
    if (!m.get('refe_cuerpo') || !m.get('refe_techo')) return;
    const por: Record<string, THREE.Material> = { 'ref muro': wall, 'ref techo': roof, 'ref madera': timber, 'ref oscuro': dark, 'ref borde': edge, 'ref piedra': stone, 'ref vidrio': glass, 'ref metal': metal };
    const nuevo = new THREE.Group();
    for (const k of claves) { const b = m.get(k); if (!b) continue; const c = b.clone(true); c.traverse(o => { const x = o as THREE.Mesh; if (!x.isMesh) return; const n = (x.material as THREE.Material).name.replace(/^Granja \| /, ''); if (por[n]) x.material = por[n]; }); nuevo.add(c); }
    const propios = new Set(Object.values(por));
    for (const c of [...root.children]) { c.removeFromParent(); c.traverse(o => { const x = o as THREE.Mesh; if (!x.isMesh) return; x.geometry.dispose(); for (const mt of ([] as THREE.Material[]).concat(x.material)) if (!propios.has(mt)) mt.dispose(); }); }
    const f = fundir(nuevo); f.traverse(o => { o.castShadow = true; o.receiveShadow = true; }); root.add(f);
  });
  return root;
}

/** Detalles de granja de verdad: cimiento de piedras, veleta en el caballete, farol junto a la puerta, heno y
 * costal de alimento; los gallineros y patos llevan nidales con paja y una rampita con su puertica. */
function detallesRefugio(root: THREE.Group, especie: string, m: Record<'wall' | 'timber' | 'dark' | 'roof' | 'edge' | 'stone' | 'metal', THREE.Material>) {
  const piedra = [newMaterial('#a9a596'), newMaterial('#bdb8a6'), newMaterial('#979383')], paja = newMaterial('#e3c77a'), pajaOscura = newMaterial('#c9a95c'), costal = newMaterial('#d8c49c'), hierro = newMaterial('#5d5a58'), luz = newMaterial('#ffd98a');
  (luz as THREE.MeshStandardMaterial).emissive = new THREE.Color('#ffb347'); (luz as THREE.MeshStandardMaterial).emissiveIntensity = .8;
  // Cimiento: piedras redondas alrededor de la base
  for (const [x0, z0, dx, dz, n] of [[-1.8, -1.84, 1, 0, 10], [-1.84, -1.8, 0, 1, 10], [1.84, -1.8, 0, 1, 10], [-1.8, 1.84, 1, 0, 3], [1.8, 1.84, -1, 0, 3]] as [number, number, number, number, number][])
    for (let i = 0; i < n; i++) { const t = i * .37; ell(root, [.2 + (i % 3) * .03, .12, .16], [x0 + dx * t, .12, z0 + dz * t], piedra[i % 3]); }
  // Veleta en el caballete (gallito en los gallineros)
  rod(root, [0, 3.0, -1.2], [0, 3.75, -1.2], .03, hierro); rod(root, [-.32, 3.55, -1.2], [.32, 3.55, -1.2], .018, hierro); rod(root, [0, 3.55, -1.52], [0, 3.55, -.88], .018, hierro);
  if (especie === 'gallina' || especie === 'pato') { const gallo = new THREE.Group(); gallo.position.set(0, 3.82, -1.2); root.add(gallo); ell(gallo, [.16, .1, .05], [0, 0, 0], hierro); ell(gallo, [.06, .07, .045], [.12, .07, 0], hierro); ell(gallo, [.07, .11, .03], [-.13, .07, 0], hierro); box(gallo, [.035, .05, .03], [.17, .13, 0], newMaterial('#b8442f'), .005); }
  else { const flecha = new THREE.Mesh(new THREE.ConeGeometry(.06, .18, 4), hierro); flecha.rotation.z = -Math.PI / 2; flecha.position.set(.26, 3.75, -1.2); root.add(flecha); rod(root, [-.26, 3.75, -1.2], [.2, 3.75, -1.2], .016, hierro); }
  // Farol junto a la puerta
  box(root, [.05, .3, .05], [.82, 1.75, 1.93], hierro, .005); box(root, [.16, .2, .16], [.82, 1.5, 1.98], hierro, .01); box(root, [.12, .15, .12], [.82, 1.5, 1.98], luz, .01);
  // Heno y costal de alimento en la esquina de enfrente
  for (const [x, y, z, r] of [[-1.55, .27, 2.25, .2], [-1.05, .27, 2.3, -.1], [-1.32, .7, 2.27, .05]] as [number, number, number, number][]) { const paca = box(root, [.52, .4, .36], [x, y, z], paja, .06); paca.rotation.y = r; for (const k of [-.13, .13]) { const cinta = box(root, [.04, .41, .37], [x + k * Math.cos(r), y, z - k * Math.sin(r)], pajaOscura, .01); cinta.rotation.y = r; } }
  ell(root, [.22, .3, .18], [1.5, .3, 2.25], costal); ell(root, [.13, .08, .12], [1.5, .6, 2.25], costal); rod(root, [1.4, .55, 2.25], [1.6, .55, 2.25], .02, pajaOscura);
  if (especie === 'gallina' || especie === 'pato') {
    // Nidales con techito y paja asomando, en el costado
    box(root, [.42, .55, 1.6], [1.98, .95, -.3], m.timber, .03); const techo = box(root, [.56, .08, 1.7], [2.02, 1.27, -.3], m.roof, .02); techo.rotation.z = -.35;
    for (let i = 0; i < 3; i++) { box(root, [.04, .4, .44], [2.2, .95, -.82 + i * .52], m.dark, .01); for (let k = 0; k < 4; k++) rod(root, [2.2, .8, -.95 + i * .52 + k * .08], [2.28, .86 + (k % 2) * .05, -.93 + i * .52 + k * .08], .02, paja); ell(root, [.06, .05, .06], [2.2, .85, -.78 + i * .52], newMaterial(i === 1 ? '#c99a6a' : '#f3ead8')); }
    // Puertica y rampa con travesaños para que suban las gallinas
    box(root, [.08, .4, .36], [-1.83, .62, .6], m.dark, .01); const rampa = box(root, [.9, .05, .34], [-2.12, .3, .6], m.timber, .01); rampa.rotation.z = .55;
    for (let k = 0; k < 4; k++) { const t = box(root, [.04, .04, .34], [-2.42 + k * .2, .14 + k * .11, .6], m.dark, .005); t.rotation.z = .55; }
  }
}

/** Patio del refugio (local 0..4 × 4..8): caminito de tierra desde la puerta, paja regada, bebedero y comedero;
 * en los gallineros, granitos de maíz en el suelo. Todo bajito: los animales caminan por encima. */
export function patioRefugio(especie: string): THREE.Group {
  especie = normalizar(especie); const root = new THREE.Group(); root.name = 'patio_refugio';
  const tierra = newMaterial('#b08f68'), tierraClara = newMaterial('#c4a57c'), paja = newMaterial('#e3c77a'), madera = newMaterial('#8f6a4c'), agua = newMaterial('#7fbcd0'), piedra = newMaterial('#a9a596'), maiz = newMaterial('#f2c94c');
  const h = (i: number, k: number) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n); };
  // Caminito pisado desde la puerta y manchas de tierra
  for (let i = 0; i < 6; i++) { const m = ell(root, [.42 + h(i, 1) * .2, .012, .34 + h(i, 2) * .15], [2 + (h(i, 3) - .5) * .5, .012, 4.3 + i * .55], i % 2 ? tierra : tierraClara); m.castShadow = false; }
  for (let i = 0; i < 5; i++) { const m = ell(root, [.5 + h(i, 4) * .4, .01, .4 + h(i, 5) * .3], [.6 + h(i, 6) * 2.8, .01, 4.6 + h(i, 7) * 3], tierra); m.castShadow = false; }
  // Paja regada
  for (let i = 0; i < 36; i++) { const x = .4 + h(i, 8) * 3.2, z = 4.4 + h(i, 9) * 3.2, a = h(i, 10) * 6.3; rod(root, [x, .02, z], [x + Math.cos(a) * .18, .02, z + Math.sin(a) * .18], .012, paja); }
  // Bebedero de piedra y comedero de madera contra la valla
  box(root, [.7, .2, .4], [.7, .1, 7.3], piedra, .05); box(root, [.58, .02, .28], [.7, .19, 7.3], agua, .01);
  box(root, [.9, .22, .32], [3.2, .14, 7.25], madera, .03); for (const x of [2.8, 3.6]) box(root, [.06, .28, .32], [x, .14, 7.25], madera, .01);
  for (let i = 0; i < 6; i++) rod(root, [2.85 + i * .13, .26, 7.15], [2.9 + i * .12, .27, 7.35], .015, paja);
  if (especie === 'gallina' || especie === 'pato' || especie === 'avestruz') for (let i = 0; i < 40; i++) ell(root, [.025, .018, .025], [.8 + h(i, 11) * 2.4, .02, 5 + h(i, 12) * 2.4], maiz);
  compact(root); return root;
}

/** Decorative interior shell. Entry at +Z; beds are along the side walls and
 * the centre aisle remains clear. Occupancy/feeding belong to the simulation. */
export function decorarInterior(especie: string, comederoInteractivo = false, capacidad = 6): THREE.Group {
  especie = normalizar(especie); const root = new THREE.Group(); root.name = `interior_${especie}`;
  root.userData = { footprint: [4, 4], entrada: [0, 0, 2], especie, capacidad, ownsResources: true };
  const wood = newMaterial('#b7956c'), dark = newMaterial('#7d6450'), hay = newMaterial('#dbc68e'), stone = newMaterial('#b3ada1'), water = newMaterial('#8ebdc5'), green = newMaterial('#9bb382'), pale = newMaterial('#efdfbc');
  box(root, [4, .14, 4], [0, -.07, 0], wood);
  for (let i = 0; i < 13; i++) box(root, [.016, .008, 3.98], [-1.85 + i * .30, .005, 0], dark, .001);
  for (const s of [-1, 1]) {
    box(root, [.12, 1.15, 4], [s * 1.95, .575, 0], pale);
    if (capacidad <= 6) for (const z of [-.95, .72]) {
      box(root, [1.05, .10, 1.25], [s * 1.34, .08, z], hay);
      for (let i = 0; i < 8; i++) rod(root, [s * 1.34 - .4 + i * .11, .15, z - .4], [s * 1.34 - .31 + i * .09, .15, z + .38], .012, pale);
    }
    if (capacidad <= 6) for (const z of [-1.67, -.2, 1.39]) { for (const x of [s * .77, s * 1.86]) box(root, [.08, .76, .08], [x, .39, z], dark); for (const y of [.32, .65]) box(root, [1.11, .07, .07], [s * 1.32, y, z], wood); }
    if (!(comederoInteractivo && s < 0)) {
    const troughZ = -.38;
    box(root, [.50, .07, .60], [s * .44, .065, troughZ], stone);
    for (const side of [-1, 1]) { box(root, [.06, .26, .60], [s * .44 + side * .22, .18, troughZ], stone); box(root, [.40, .26, .06], [s * .44, .18, troughZ + side * .27], stone); }
    box(root, [.39, .022, .48], [s * .44, .236, troughZ], s < 0 ? green : water);
    if (s < 0) for (let i = 0; i < 5; i++) rod(root, [s * .44 - .14 + i * .064, .257, troughZ - .15], [s * .44 - .10 + i * .055, .26, troughZ + .14], .013, hay);
    }
  }
  if (capacidad > 6) for (let i = 0; i < capacidad; i++) {
    const p = camaAnimal(i, capacidad), x = p.u - 2, z = p.v - 2;
    box(root, [.91, .035, .57], [x, .025, z], dark, .008);
    box(root, [.85, .055, .51], [x, .055, z], hay, .015);
    for (let j = 0; j < 5; j++) rod(root, [x - .33 + j * .15, .085, z - .20], [x - .29 + j * .14, .085, z + .21], .008, pale);
  }
  box(root, [4, 1.6, .12], [0, .8, -1.95], pale);
  for (const x of [-1.1, 0, 1.1]) box(root, [.12, 1.65, .12], [x, .825, -1.84], dark);
  if (['gallina','pato','dinosaurio','avestruz','grifo'].includes(especie)) {
    rod(root, [-1.3, .8, -1.48], [1.3, .8, -1.48], .06, wood);
    for (const x of [-.95, 0, .95]) { box(root, [.62, .35, .58], [x, .2, -1.56], wood); ell(root, [.44, .07, .4], [x, .4, -1.49], hay); }
  } else if (especie === 'conejo') {
    const arch = mesh(root, new THREE.TorusGeometry(.33, .12, 8, 16, Math.PI), wood, [0, .12, -1.35]); arch.rotation.x = Math.PI / 2;
    for (const x of [-.56, .56]) leaf(root, [x, .27, -1.3], .27, green, x);
  } else if (especie === 'dragon') {
    for (let i = 0; i < 7; i++) crystal(root, [Math.cos(i) * .50, .10, -1.4 + Math.sin(i) * .21], .30, .12, stone);
  } else { box(root, [1.1, .5, .46], [0, .25, -1.62], wood); box(root, [.98, .05, .34], [0, .52, -1.62], hay); }
  compact(root);
  // Cuando carga granja_obras.glb (personajes/blender/granja_obras.py) todo se cambia por sus piezas, en los mismos
  // sitios: el piso de tablas con nudos, las paredes con sus juntas, herraduras y cuadrito, pesebres, corrales, el
  // bebedero y el comedero de piedra, las camas, la percha con los nidales, la madriguera, los cristales o el pesebre alto
  conKit(root, 'granja_obras.glb', m => {
    if (!m.get('ref_piso') || !m.get('ref_pared_fondo')) return;
    const kit = new THREE.Group();
    const poner = (clave: string, x: number, y: number, z: number, ry = 0) => { const b = m.get(clave); if (!b) return; const c = b.clone(true); c.position.set(x, y, z); c.rotation.y = ry; kit.add(c); };
    poner('ref_piso', 0, 0, 0);
    poner('ref_pared_fondo', 0, 0, -1.95);
    for (const s of [-1, 1]) {
      poner('ref_pared_lado', s * 1.95, 0, 0);
      if (capacidad <= 6) {
        for (const z of [-.95, .72]) poner('ref_pesebre', s * 1.34, .03, z, s < 0 ? Math.PI : 0);
        for (const z of [-1.67, -.2, 1.39]) poner('ref_corral', s * 1.315, 0, z);
      }
      if (!(comederoInteractivo && s < 0)) poner(s < 0 ? 'ref_comedero_verde' : 'ref_bebedero', s * .44, 0, -.38);
    }
    if (capacidad > 6) for (let i = 0; i < capacidad; i++) { const p = camaAnimal(i, capacidad); poner('ref_cama', p.u - 2, 0, p.v - 2); }
    if (['gallina', 'pato', 'dinosaurio', 'avestruz', 'grifo'].includes(especie)) {
      poner('ref_percha', 0, .8, -1.48);
      for (const x of [-.95, 0, .95]) poner('ref_nidal', x, 0, -1.56);
    } else if (especie === 'conejo') poner('ref_madriguera', 0, 0, -1.35);
    else if (especie === 'dragon') poner('ref_cristales', 0, 0, -1.4);
    else poner('ref_heno_alto', 0, 0, -1.62);
    const unida = fundir(kit); unida.name = 'interior-kit';
    for (const c of [...root.children]) { c.removeFromParent(); c.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); for (const mt of Array.isArray(o.material) ? o.material : [o.material]) if (!mt.userData.compartido) mt.dispose(); } }); }
    root.add(unida);
  });
  return root;
}
