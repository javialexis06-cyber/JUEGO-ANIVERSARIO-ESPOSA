import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { grupo, material } from './formas.mjs';

// Lo que hay que limpiar en la granja (como el terreno del principio de Stardew): maleza para la azada o la guadaña,
// tocones para el hacha, piedras para el pico y menas en la mina. Todo con color por vértice que imita fieltro
// (fibras, motas y sombritas en las grietas), en una sola malla por modelo para gastar una sola llamada de dibujo.
// Metros, Y arriba, de frente +Z, el origen en el piso al centro de la casilla.

// ── Ruido ──────────────────────────────────────────────────────────────
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function ruido3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const fbm = (x, y, z, oct = 4) => { let a = 0, f = 1, amp = 0.5; for (let i = 0; i < oct; i++) { a += amp * ruido3(x * f, y * f, z * f); f *= 2.03; amp *= 0.5; } return a; };
function azar(semilla) { let s = semilla >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ── Color de fieltro por vértice ───────────────────────────────────────
/** `fn(p, n)` devuelve el color base del punto; encima va el grano de fieltro y la oclusión de abajo. */
function pintar(g, fn, { grano = 0.07, motas = 0.05, sombraPiso = 0.35 } = {}) {
  // Normales suaves antes de separar los triángulos (si no, todo se ve facetado)
  if (!g.index) { g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g, 1e-4); }
  g.computeVertexNormals(); g = g.toNonIndexed();
  const p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    P.fromBufferAttribute(p, i); N.fromBufferAttribute(n, i);
    c.copy(fn(P, N));
    // Grano: fibras finas (ruido alto) + motas sueltas, como la felpa
    const fibra = (fbm(P.x * 38, P.y * 38, P.z * 38, 2) - 0.5) * 2 * grano;
    const mota = hash3(Math.round(P.x * 90), Math.round(P.y * 90), Math.round(P.z * 90)) > 0.93 ? -motas : 0;
    const piso = sombraPiso * Math.max(0, 1 - P.y / 0.12);
    const k = (1 + fibra + mota) * (1 - piso * 0.6);
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.deleteAttribute('uv');
  return g;
}
const C = (h) => new THREE.Color(h);
const mezcla = (a, b, t) => a.clone().lerp(b, Math.max(0, Math.min(1, t)));

function juntar(id, partes, kind = 'clay') {
  const geo = mergeVertices(mergeGeometries(partes.map((g) => (g.index ? g.toNonIndexed() : g)), false), 1e-5);
  geo.computeVertexNormals();
  const root = grupo(id);
  const m = new THREE.Mesh(geo, material('#ffffff', kind));
  m.name = id + '_malla'; m.castShadow = true; m.receiveShadow = true;
  root.add(m);
  return root;
}
const sinNormales = (g) => { g.deleteAttribute('normal'); g.deleteAttribute('uv'); return g; };
function deformar(g, fn) {
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  return g;
}

// ── Hojas y briznas ────────────────────────────────────────────────────
/** Brizna de pasto: cinta gruesita que se afina y se curva, con dos caras. */
function brizna(alto, ancho, inclina, giro, curva, x, z) {
  const filas = 6, pos = [], idx = [];
  for (let j = 0; j <= filas; j++) {
    const t = j / filas, w = ancho * (1 - t * 0.92) / 2, y = alto * t, off = curva * t * t;
    for (const s of [-1, 1]) pos.push(s * w, y, off);
  }
  for (let j = 0; j < filas; j++) { const a = j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  // Dos caras (copia invertida un pelito corrida) para que se vea por ambos lados sin transparencia
  const atras = g.clone(); atras.setIndex(idx.slice().reverse());
  deformar(atras, (v) => { v.z -= 0.004; });
  const b = mergeGeometries([g.toNonIndexed(), atras.toNonIndexed()].map(sinNormales));
  b.rotateX(inclina); b.rotateY(giro); b.translate(x, 0, z);
  return b;
}
/** Hoja ancha con borde dentado (diente de león, cardo). Pegada en el origen, crece hacia +Y. */
function hojaDentada(largo, ancho, dientes, curva) {
  const filas = 10, pos = [], idx = [];
  for (let j = 0; j <= filas; j++) {
    const t = j / filas;
    const diente = dientes ? 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * dientes)) : 1;
    const w = Math.sin(Math.PI * Math.min(1, t * 1.08)) * ancho / 2 * diente;
    const y = largo * t, z = curva * t * t;
    pos.push(-w, y, z + Math.abs(w) * 0.25, 0, y, z - 0.008, w, y, z + Math.abs(w) * 0.25);
  }
  for (let j = 0; j < filas; j++) for (const k of [0, 1]) { const a = j * 3 + k, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const atras = g.clone(); atras.setIndex(idx.slice().reverse()); deformar(atras, (v) => { v.z -= 0.006; });
  return mergeGeometries([g.toNonIndexed(), atras.toNonIndexed()].map(sinNormales));
}
function bulto(r, alto, detalle, semilla, rugo = 0.18) {
  const g = new THREE.IcosahedronGeometry(1, detalle);
  return deformar(g, (v) => {
    const d = 1 + (fbm(v.x * 1.7 + semilla, v.y * 1.7, v.z * 1.7 - semilla, 3) - 0.5) * 2 * rugo;
    v.multiplyScalar(d); v.set(v.x * r, v.y * alto, v.z * r);
  });
}
function montoncito(r, semilla) {
  // Tierrita removida bajo la mata
  const g = bulto(r, 0.05, 2, semilla, 0.25);
  deformar(g, (v) => { if (v.y < 0) v.y *= 0.2; });
  return pintar(g, (P) => mezcla(C('#7a5638'), C('#9a7048'), fbm(P.x * 9, 0, P.z * 9)), { grano: 0.1 });
}

// ── Maleza ─────────────────────────────────────────────────────────────
function malezaHierba() {
  const r = azar(11), partes = [];
  const base = C('#3f7a33'), punta = C('#a6d06a'), seca = C('#c9b25a');
  for (let i = 0; i < 64; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.26, alto = 0.2 + r() * 0.34 * (1 - d * 1.4);
    const g = brizna(alto, 0.06 + r() * 0.04, (r() - 0.5) * 0.5 + Math.cos(a) * d * 1.2, a + (r() - 0.5), 0.05 + r() * 0.12, Math.cos(a) * d, Math.sin(a) * d);
    const amarilla = r() < 0.12;
    partes.push(pintar(g, (P) => mezcla(amarilla ? mezcla(base, seca, 0.6) : base, amarilla ? seca : punta, P.y / 0.5), { grano: 0.05, sombraPiso: 0.5 }));
  }
  return { id: 'maleza_hierba', label: 'Maleza · pasto alto', category: 'escombros', footprint: [1, 1], root: juntar('maleza_hierba', partes) };
}
function malezaFlores() {
  const r = azar(23), partes = [];
  // Roseta de hojas dentadas (diente de león)
  for (let i = 0; i < 9; i++) {
    const g = hojaDentada(0.2 + r() * 0.08, 0.075, 4, 0.03);
    g.rotateX(-1.25 + r() * 0.25); g.rotateY((i / 9) * Math.PI * 2 + r() * 0.3); g.translate(0, 0.02, 0);
    partes.push(pintar(g, (P) => mezcla(C('#3d7a35'), C('#7fb755'), Math.hypot(P.x, P.z) / 0.25), { grano: 0.05 }));
  }
  // Tallos con flores amarillas y un vilano blanco
  const flores = [[0.06, 0.04, 0.3, 'amarilla'], [-0.08, 0.05, 0.25, 'amarilla'], [0.02, -0.09, 0.34, 'vilano'], [-0.03, 0.1, 0.2, 'boton']];
  for (const [x, z, h, tipo] of flores) {
    const tallo = new THREE.CylinderGeometry(0.008, 0.011, h, 5, 4); tallo.translate(x, h / 2, z);
    deformar(tallo, (v) => { v.x += Math.sin(v.y * 6) * 0.015; });
    partes.push(pintar(tallo, () => C('#5b8f3c'), { grano: 0.04 }));
    if (tipo === 'vilano') {
      const bola = bulto(0.055, 0.055, 2, 5.1, 0.35); bola.translate(x, h + 0.04, z);
      partes.push(pintar(bola, (P) => mezcla(C('#f4f1e6'), C('#ffffff'), fbm(P.x * 30, P.y * 30, P.z * 30)), { grano: 0.12, motas: 0.1 }));
    } else {
      const flor = new THREE.CylinderGeometry(tipo === 'boton' ? 0.025 : 0.05, 0.02, 0.035, 12, 2);
      deformar(flor, (v) => { const a = Math.atan2(v.z, v.x); const k = 1 + 0.18 * Math.sin(a * 14); v.x *= k; v.z *= k; });
      flor.translate(x, h + 0.015, z);
      partes.push(pintar(flor, (P) => (P.y > h + 0.025 ? C('#f4b72f') : C('#f7cf3d')), { grano: 0.08 }));
    }
  }
  // Briznas alrededor para que no se vea pelado
  for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = 0.15 + r() * 0.12; partes.push(pintar(brizna(0.12 + r() * 0.16, 0.05, 0.3, a, 0.05, Math.cos(a) * d, Math.sin(a) * d), (P) => mezcla(C('#447f36'), C('#9cc965'), P.y / 0.3))); }
  return { id: 'maleza_flores', label: 'Maleza · diente de león', category: 'escombros', footprint: [1, 1], root: juntar('maleza_flores', partes) };
}
function malezaMatorral() {
  const r = azar(37), partes = [montoncito(0.26, 3.7)];
  // Bulticos de follaje con hojas encima
  const bultos = [[0, 0.16, 0, 0.2], [0.13, 0.12, 0.06, 0.15], [-0.12, 0.11, 0.05, 0.14], [0.03, 0.12, -0.13, 0.15], [-0.05, 0.25, -0.02, 0.13]];
  for (const [x, y, z, s] of bultos) {
    const g = bulto(s, s * 0.85, 3, x * 10 + z * 7, 0.28); g.translate(x, y, z);
    partes.push(pintar(g, (P, N) => mezcla(C('#2e5f2c'), C('#6aa04a'), 0.35 + N.y * 0.45 + (fbm(P.x * 14, P.y * 14, P.z * 14) - 0.5)), { grano: 0.09, motas: 0.08 }));
  }
  for (let i = 0; i < 22; i++) {
    const g = hojaDentada(0.1 + r() * 0.06, 0.06, 0, 0.02);
    const a = r() * Math.PI * 2, y = 0.12 + r() * 0.2, d = 0.16 + r() * 0.08;
    g.rotateX(-0.9 + r() * 0.5); g.rotateY(a); g.translate(Math.cos(a) * d * 0.8, y, Math.sin(a) * d * 0.8);
    partes.push(pintar(g, () => mezcla(C('#3f7a35'), C('#82b85a'), r()), { grano: 0.05 }));
  }
  // Moritas silvestres
  for (let i = 0; i < 5; i++) { const g = new THREE.SphereGeometry(0.018, 8, 6); const a = r() * 6.3; g.translate(Math.cos(a) * 0.17, 0.2 + r() * 0.1, Math.sin(a) * 0.17); partes.push(pintar(g, () => C('#b8364f'), { grano: 0.03 })); }
  return { id: 'maleza_matorral', label: 'Maleza · matorral', category: 'escombros', footprint: [1, 1], root: juntar('maleza_matorral', partes) };
}

// ── Tocones ────────────────────────────────────────────────────────────
function corteza(r0, r1, alto, semilla, quebrado) {
  const g = new THREE.CylinderGeometry(r1, r0, alto, 28, 10, false);
  g.translate(0, alto / 2, 0);
  return deformar(g, (v) => {
    const a = Math.atan2(v.z, v.x), t = v.y / alto;
    const surco = 0.035 * Math.max(0, Math.sin(a * 11 + fbm(a, t * 3, semilla) * 4)) ** 2;
    const k = 1 - surco + (fbm(a * 2, t * 4, semilla) - 0.5) * 0.08 + Math.max(0, 0.18 - t) * 0.9;
    v.x *= k; v.z *= k;
    if (t > 0.98) v.y += quebrado ? (fbm(a * 1.5, 0, semilla) - 0.4) * 0.2 : (fbm(a * 3, 0, semilla) - 0.5) * 0.02;
  });
}
function raiz(a, largo, grosor) {
  const pts = [];
  for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(new THREE.Vector3(Math.cos(a) * (0.18 + t * largo), 0.14 * (1 - t) ** 1.6 - 0.01, Math.sin(a) * (0.18 + t * largo))); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 1, 7, false);
  // Más gruesa en la base
  const p = g.attributes.position, centro = new THREE.Vector3();
  const curva = new THREE.CatmullRomCurve3(pts);
  for (let i = 0; i < p.count; i++) {
    const t = Math.floor(i / 8) / 10; curva.getPoint(Math.min(1, t), centro);
    const v = new THREE.Vector3().fromBufferAttribute(p, i), d = v.sub(centro);
    const r = grosor * (1 - t * 0.75);
    // Al crear el tubo con radio 1, la distancia al centro ya es 1: se escala
    p.setXYZ(i, centro.x + d.x * r, centro.y + d.y * r, centro.z + d.z * r);
  }
  g.computeVertexNormals();
  return g;
}
function hongo(x, z, s, y = 0) {
  const pie = new THREE.CylinderGeometry(0.012 * s, 0.016 * s, 0.05 * s, 8, 2); pie.translate(x, y + 0.025 * s, z);
  const som = new THREE.SphereGeometry(0.035 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); som.scale(1, 0.75, 1); som.translate(x, y + 0.045 * s, z);
  return [pintar(pie, () => C('#f1e6cf'), { sombraPiso: 0 }), pintar(som, (P) => (hash3(Math.round(P.x * 300), Math.round(P.y * 300), Math.round(P.z * 300)) > 0.86 ? C('#fff4e2') : C('#d0533f')), { grano: 0.04, sombraPiso: 0 })];
}
function tocon(id, label, grande) {
  const r = azar(grande ? 71 : 53), R = grande ? 0.38 : 0.3, alto = grande ? 0.5 : 0.36, partes = [];
  const anillos = (P) => { const d = Math.hypot(P.x, P.z) / R; const anillo = 0.5 + 0.5 * Math.sin(d * 34 + fbm(P.x * 6, 0, P.z * 6) * 3); return d > 0.86 ? C('#7b4e30') : mezcla(C('#d4a46c'), C('#b98551'), anillo * 0.8 + d * 0.3); };
  const musgo = (P, N, base) => { const m = N.y * 0.6 + (fbm(P.x * 8, P.y * 8, P.z * 8) - 0.45) * 1.6 - (grande ? 0 : 0.25); return m > 0.35 ? mezcla(C('#5f8f3a'), C('#86b34f'), fbm(P.x * 20, P.y * 20, P.z * 20)) : base; };
  const tronco = corteza(R, R * 0.92, alto, grande ? 3.3 : 1.7, grande);
  partes.push(pintar(tronco, (P, N) => {
    if (N.y > 0.7 && P.y > alto * 0.9) return anillos(P);
    const a = Math.atan2(P.z, P.x), grieta = Math.max(0, Math.sin(a * 11 + fbm(a, P.y * 3 / alto, 1.7) * 4)) ** 2;
    return musgo(P, N, mezcla(C('#8a5a37'), C('#4f321f'), grieta * 0.9 + fbm(P.x * 20, P.y * 20, P.z * 20) * 0.3));
  }, { grano: 0.08 }));
  // Tapa del corte (con anillos) un pelito más abajo del borde
  if (!grande) {
    const tapa = new THREE.CircleGeometry(R * 0.9, 32); tapa.rotateX(-Math.PI / 2); tapa.translate(0, alto * 0.985, 0);
    partes.push(pintar(tapa, anillos, { grano: 0.05, sombraPiso: 0 }));
  } else {
    // Tronco quebrado: astillas en la punta
    for (let i = 0; i < 7; i++) {
      const a = r() * Math.PI * 2, h = 0.08 + r() * 0.16;
      const g = new THREE.ConeGeometry(0.04 + r() * 0.03, h, 5); g.translate(Math.cos(a) * R * 0.6, alto + h / 2 - 0.03, Math.sin(a) * R * 0.6);
      partes.push(pintar(g, (P) => mezcla(C('#c69561'), C('#8a5a37'), (P.y - alto) / 0.2)));
    }
  }
  for (let i = 0; i < (grande ? 6 : 5); i++) partes.push(pintar(raiz((i / (grande ? 6 : 5)) * Math.PI * 2 + r() * 0.5, 0.16 + r() * 0.14, (grande ? 0.075 : 0.06)), (P, N) => musgo(P, N, mezcla(C('#7a4d2f'), C('#5b3a24'), r() * 0.5))));
  partes.push(...hongo(R * 0.95, 0.06, 1.1), ...hongo(R * 0.85, 0.16, 0.8));
  if (grande) {
    partes.push(...hongo(-R * 0.6, R * 0.8, 1.3), ...hongo(-0.05, 0.02, 0.9, alto * 0.95));
    // Helechito al pie
    for (let i = 0; i < 6; i++) { const g = hojaDentada(0.22, 0.07, 6, 0.06); g.rotateX(-0.8); g.rotateY(-0.6 + i * 0.25); g.translate(-R * 0.9, 0.02, -R * 0.5); partes.push(pintar(g, (P) => mezcla(C('#3c7536'), C('#7ab452'), P.y / 0.2))); }
  }
  for (let i = 0; i < 10; i++) { const a = r() * 6.3, d = R + 0.05 + r() * 0.12; partes.push(pintar(brizna(0.1 + r() * 0.14, 0.03, 0.35, a, 0.04, Math.cos(a) * d, Math.sin(a) * d), (P) => mezcla(C('#447f36'), C('#9cc965'), P.y / 0.25))); }
  return { id, label, category: 'escombros', footprint: [1, 1], root: juntar(id, partes) };
}

// ── Piedras y menas ───────────────────────────────────────────────────
function roca(R, alto, semilla, detalle = 4) {
  const g = new THREE.IcosahedronGeometry(1, detalle);
  return deformar(g, (v) => {
    // Facetas suaves (cortes planos) + ruido, y la base aplanada contra el piso
    const n = v.clone().normalize();
    let k = 1 + (fbm(n.x * 1.6 + semilla, n.y * 1.6, n.z * 1.6, 4) - 0.5) * 0.55;
    for (const [px, py, pz, d] of [[0.7, 0.4, 0.2, 0.86], [-0.5, 0.5, 0.6, 0.9], [0.1, 0.9, -0.4, 0.88]]) { const dot = n.x * px + n.y * py + n.z * pz; if (dot * k > d) k = d / dot; }
    v.copy(n.multiplyScalar(k));
    v.set(v.x * R, v.y * alto, v.z * R * 0.9);
    if (v.y < 0) v.y *= 0.25;
  });
}
const colorRoca = (base, liquen) => (P, N) => {
  const m = fbm(P.x * 7, P.y * 7, P.z * 7, 4), grieta = fbm(P.x * 25, P.y * 25, P.z * 25, 2);
  let c = mezcla(C(base[0]), C(base[1]), m * 1.2 - 0.1);
  if (grieta < 0.33) c = mezcla(c, C('#55524c'), (0.33 - grieta) * 3);
  if (liquen && N.y > 0.45 && fbm(P.x * 5 + 9, P.y * 5, P.z * 5) > 0.55) c = mezcla(C('#7aa24a'), C('#a4c46a'), fbm(P.x * 30, P.y * 30, P.z * 30));
  return c;
};
function piedraChica() {
  const r = azar(91), partes = [];
  const piezas = [[0, 0, 0.13, 0.09], [0.15, 0.06, 0.08, 0.06], [-0.12, 0.08, 0.09, 0.06], [0.04, -0.15, 0.07, 0.05], [-0.06, -0.08, 0.05, 0.035], [0.17, -0.1, 0.045, 0.03]];
  piezas.forEach(([x, z, R, h], i) => { const g = roca(R, h, i * 3.1, 3); g.rotateY(r() * 6); g.translate(x, h * 0.55, z); partes.push(pintar(g, colorRoca(i % 2 ? ['#a7a39a', '#d3cfc4'] : ['#9a958b', '#c8c2b5'], i === 0), { grano: 0.06 })); });
  for (let i = 0; i < 8; i++) { const a = r() * 6.3, d = 0.18 + r() * 0.1; partes.push(pintar(brizna(0.08 + r() * 0.1, 0.028, 0.35, a, 0.03, Math.cos(a) * d, Math.sin(a) * d), (P) => mezcla(C('#447f36'), C('#9cc965'), P.y / 0.2))); }
  return { id: 'piedra_chica', label: 'Piedritas', category: 'escombros', footprint: [1, 1], root: juntar('piedra_chica', partes) };
}
function piedra() {
  const r = azar(97), partes = [];
  const g = roca(0.3, 0.26, 4.2); g.translate(0, 0.2, 0);
  partes.push(pintar(g, colorRoca(['#8f8b82', '#c7c1b3'], true), { grano: 0.07 }));
  for (const [x, z, R] of [[0.3, 0.12, 0.07], [-0.26, 0.2, 0.06], [0.1, -0.3, 0.05]]) { const p = roca(R, R * 0.7, x * 9, 2); p.translate(x, R * 0.4, z); partes.push(pintar(p, colorRoca(['#a29d93', '#d0cbbf'], false))); }
  for (let i = 0; i < 12; i++) { const a = r() * 6.3, d = 0.28 + r() * 0.1; partes.push(pintar(brizna(0.1 + r() * 0.12, 0.03, 0.35, a, 0.04, Math.cos(a) * d, Math.sin(a) * d), (P) => mezcla(C('#447f36'), C('#9cc965'), P.y / 0.22))); }
  return { id: 'piedra', label: 'Piedra', category: 'escombros', footprint: [1, 1], root: juntar('piedra', partes) };
}
function piedraGrande() {
  const r = azar(101), partes = [];
  // Peñasco partido en dos, con musgo arriba y florecitas al pie
  const a = roca(0.36, 0.42, 7.7); a.translate(-0.07, 0.3, 0.02);
  const b = roca(0.24, 0.3, 2.9); b.rotateY(0.8); b.translate(0.24, 0.2, -0.1);
  partes.push(pintar(a, colorRoca(['#857f76', '#bdb6a8'], true), { grano: 0.08 }), pintar(b, colorRoca(['#8d877d', '#c4bdb0'], true), { grano: 0.08 }));
  for (let i = 0; i < 18; i++) { const an = r() * 6.3, d = 0.34 + r() * 0.12; partes.push(pintar(brizna(0.12 + r() * 0.16, 0.032, 0.35, an, 0.05, Math.cos(an) * d, Math.sin(an) * d), (P) => mezcla(C('#447f36'), C('#9cc965'), P.y / 0.28))); }
  for (let i = 0; i < 4; i++) { const an = -0.4 + i * 0.35, f = new THREE.SphereGeometry(0.022, 8, 6); f.translate(Math.cos(an) * 0.42, 0.06 + r() * 0.04, Math.sin(an) * 0.42); partes.push(pintar(f, () => (i % 2 ? C('#f2f0ea') : C('#c9a3e0')), { sombraPiso: 0 })); }
  return { id: 'piedra_grande', label: 'Peñasco', category: 'escombros', footprint: [1, 1], root: juntar('piedra_grande', partes) };
}
function mena(id, label, colores, brillo) {
  const r = azar(id.length * 13), partes = [];
  const g = roca(0.32, 0.3, id.length * 1.3); g.translate(0, 0.22, 0);
  const veta = colorRoca(['#5f5a55', '#8f877d'], false);
  partes.push(pintar(g, (P, N) => (fbm(P.x * 9 + 3, P.y * 9, P.z * 9) > 0.62 ? mezcla(C(colores[0]), C(colores[1]), fbm(P.x * 30, P.y * 30, P.z * 30)) : veta(P, N)), { grano: 0.08 }));
  // Vetas: cristales que asoman de la roca
  for (let i = 0; i < 12; i++) {
    const a = r() * Math.PI * 2, el = 0.25 + r() * 0.9, h = 0.12 + r() * 0.12;
    const c = new THREE.CylinderGeometry(0, 0.05 + r() * 0.03, h, 6, 1); c.translate(0, h / 2, 0);
    c.rotateZ(Math.PI / 2 - el); c.rotateY(a);
    const n = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), -Math.sin(a) * Math.cos(el));
    c.translate(n.x * 0.27, 0.2 + n.y * 0.24, n.z * 0.25);
    partes.push(pintar(c, (P) => mezcla(C(colores[0]), C(colores[1]), (P.y - 0.2) * 4), { grano: 0.03, motas: 0, sombraPiso: 0 }));
  }
  return { id, label, category: 'escombros', footprint: [1, 1], root: juntar(id, partes, brillo ? 'emissive' : 'clay') };
}

export function crearEscombros() {
  return [
    malezaHierba(), malezaFlores(), malezaMatorral(),
    tocon('tocon', 'Tocón', false), tocon('tocon_grande', 'Tocón viejo con musgo', true),
    piedraChica(), piedra(), piedraGrande(),
    mena('mena_cobre', 'Veta de cobre', ['#b8642f', '#f0a05e'], false),
    mena('mena_hierro', 'Veta de hierro', ['#9aa4ad', '#e3ecf2'], false),
    mena('mena_cristal', 'Veta de cristal', ['#5fc7d9', '#d6fbff'], false),
  ];
}
