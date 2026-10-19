// Candidato «b-volumen»: zombi base con volumen suave, hermano de las plantas renderizadas en Blender.
// Cada masa se pinta como un juguete de plastilina: degradado radial con la luz arriba a la izquierda, sombra propia
// difuminada (feGaussianBlur dentro del recorte de la forma), luz de borde fría en el lado de atrás, oclusión en los
// pliegues, brillos especulares suaves y un contorno oscuro grueso que engorda un poco del lado de la sombra.
// Mismo esqueleto, piezas, padres y z que zombiBase (src/jardin/pvz/arte/estilo.ts).
import type { DefPersonaje, DefPieza } from '../../src/jardin/pvz/arte/piezas';
import { animZombi, HUESOS_ZOMBI, MARCO_ZOMBI, PERDIDAS_ZOMBI, TINTA } from '../../src/jardin/pvz/arte/estilo';

const H = HUESOS_ZOMBI;
const T = TINTA;
type Pt = [number, number];

// ---------------------------------------------------------------------------------------------------------------
// Paleta

const C = {
  piel: '#aab899',
  pielClara: '#dde6cd',
  pielMedia: '#8f9e80',
  pielOscura: '#66765c',
  pielHonda: '#3d4838',
  borde: '#eef8e2',
  pielLejos: '#8d9b7e',
  saco: '#7b5132',
  sacoClaro: '#b38455',
  sacoOscuro: '#4c2f1b',
  sacoHondo: '#26150a',
  camisa: '#f3efe2',
  camisaSombra: '#bdb49c',
  corbata: '#d02d2b',
  corbataOscura: '#7e1418',
  jean: '#5e7aa3',
  jeanClaro: '#9bb5d6',
  jeanOscuro: '#33476a',
  jeanHondo: '#1b263b',
  zapato: '#6a4327',
  zapatoClaro: '#a87850',
  zapatoOscuro: '#2f1c0e',
  diente: '#f2e7bf',
  una: '#3f4637',
};

// ---------------------------------------------------------------------------------------------------------------
// Ayudantes SVG

const f = (n: number) => +n.toFixed(2);
let cont = 0;
const nid = (b: string) => `bv-${b}${++cont}`;

/** Desenfoques usados (se generan los filtros en los defs al final). */
const desenfoques = new Set<number>();
function fb(s: number): string {
  desenfoques.add(s);
  return `url(#bv-f${String(s).replace('.', '_')})`;
}

/** Caja aproximada de un trazado con comandos absolutos (M, L, C, Q, Z): los puntos de control la contienen. */
function caja(d: string): [number, number, number, number] {
  const n = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);
  }
  return [x0, y0, x1, y1];
}

/** Elipse como trazado de curvas (sin arcos), con alto distinto arriba y abajo si se quiere. */
function elipse(cx: number, cy: number, rx: number, ry: number, ryAbajo = ry): string {
  const k = 0.5523;
  return (
    `M${f(cx - rx)},${f(cy)} C${f(cx - rx)},${f(cy - ry * k)} ${f(cx - rx * k)},${f(cy - ry)} ${f(cx)},${f(cy - ry)} ` +
    `C${f(cx + rx * k)},${f(cy - ry)} ${f(cx + rx)},${f(cy - ry * k)} ${f(cx + rx)},${f(cy)} ` +
    `C${f(cx + rx)},${f(cy + ryAbajo * k)} ${f(cx + rx * k)},${f(cy + ryAbajo)} ${f(cx)},${f(cy + ryAbajo)} ` +
    `C${f(cx - rx * k)},${f(cy + ryAbajo)} ${f(cx - rx)},${f(cy + ryAbajo * k)} ${f(cx - rx)},${f(cy)} Z`
  );
}

/** Borde rasgado: curvas entre puntos, cada tramo combado al lado contrario del anterior. */
function rasgado(pts: Pt[], amp = 1.1): string {
  let s = '';
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const k = (i % 2 ? 1 : -1) * amp;
    s += ` Q${f((x0 + x1) / 2 - (dy / L) * k)},${f((y0 + y1) / 2 + (dx / L) * k)} ${f(x1)},${f(y1)}`;
  }
  return s;
}

/**
 * Banda de sombra o de luz pegada al borde interior de la forma, del lado (dx, dy), difuminada. Se dibuja dentro del
 * recorte de la forma: la forma menos la misma forma corrida (−dx, −dy).
 */
function banda(d: string, dx: number, dy: number, color: string, op: number, blur: number): string {
  const [x0, y0, x1, y1] = caja(d);
  const m = 6 + Math.abs(dx) + Math.abs(dy) + blur * 2;
  return (
    `<path d="M${f(x0 - m)},${f(y0 - m)} L${f(x1 + m)},${f(y0 - m)} L${f(x1 + m)},${f(y1 + m)} L${f(x0 - m)},${f(y1 + m)} Z ${d}" ` +
    `fill-rule="evenodd" fill="${color}" opacity="${op}" transform="translate(${f(-dx)} ${f(-dy)})" filter="${fb(blur)}"/>`
  );
}

/** Mancha difuminada (oclusión, rubor, brillo grande). */
function mancha(d: string, color: string, op: number, blur: number): string {
  return `<path d="${d}" fill="${color}" opacity="${op}" filter="${fb(blur)}"/>`;
}

/** Brillo o sombra elíptica difuminada. */
function brillo(cx: number, cy: number, rx: number, ry: number, rot: number, op: number, blur: number, color = '#ffffff'): string {
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${rot} ${f(cx)} ${f(cy)})" fill="${color}" opacity="${op}"${blur > 0 ? ` filter="${fb(blur)}"` : ''}/>`;
}

/** Pliegue afilado en las puntas (arruga, costura de luz): lente entre p0 y p1 combada hacia c, de ancho w. */
function pliegue(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, color: string, op = 1, blur = 0): string {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * w, ny = (dx / L) * w;
  return (
    `<path d="M${f(x0)},${f(y0)} Q${f(cx + nx)},${f(cy + ny)} ${f(x1)},${f(y1)} Q${f(cx - nx)},${f(cy - ny)} ${f(x0)},${f(y0)} Z" ` +
    `fill="${color}" opacity="${op}"${blur > 0 ? ` filter="${fb(blur)}"` : ''}/>`
  );
}

interface OpForma {
  /** Grosor del contorno (0 = sin contorno). */
  trazo?: number;
  /** Trazado del contorno si no es el mismo de la forma (p. ej. abierto por donde la pieza entra en otra). */
  dTrazo?: string;
  /** Engorde del contorno del lado de la sombra (abajo a la derecha). */
  peso?: number;
  color?: string;
}

/** Masa con volumen: contorno engordado, relleno, sombreado recortado a la forma y contorno encima. */
function forma(d: string, relleno: string, sombreado: (d: string) => string = () => '', o: OpForma = {}): string {
  const w = o.trazo ?? 2.6;
  const linea = o.dTrazo ?? d;
  const peso = o.peso ?? w * 0.22;
  const col = o.color ?? T;
  const id = nid('c');
  const somb = sombreado(d);
  const trazo = (extra: string) => `<path d="${linea}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
  return (
    (w > 0 && peso > 0 ? trazo(` transform="translate(${f(peso * 0.7)} ${f(peso)})"`) : '') +
    `<path d="${d}" fill="${relleno}"/>` +
    (somb ? `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">${somb}</g>` : '') +
    (w > 0 ? trazo('') : '')
  );
}

/** Sombreado de juguete estándar: sombra propia abajo a la derecha, luz que envuelve arriba a la izquierda, borde frío. */
function plastilina(oscuro: string, claro: string, borde: string | null, k = 1) {
  return (d: string) =>
    banda(d, 3.6 * k, 3.4 * k, oscuro, 0.55, 2.6 * k) +
    banda(d, -2.2 * k, -2.4 * k, claro, 0.5, 1.8 * k) +
    (borde ? banda(d, 1.1 * k, 0.5 * k, borde, 0.4, 0.6 * k) : '');
}

// ---------------------------------------------------------------------------------------------------------------
// Degradados

function radial(id: string, ps: [number, string, number?][], cx = 0.42, cy = 0.36, r = 0.7, fx = 0.32, fy = 0.24): string {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${ps.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
}
function lineal(id: string, ps: [number, string][], x1 = 0, y1 = 0, x2 = 0, y2 = 1, unidades = ''): string {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${unidades ? ` gradientUnits="${unidades}"` : ''}>${ps.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}

const DEGRADADOS =
  radial('bv-piel', [[0, '#e3ebd3'], [0.45, C.piel], [1, '#7a8a6c']]) +
  radial('bv-pielLejos', [[0, '#a9b796'], [0.5, C.pielLejos], [1, '#5c6a51']]) +
  radial('bv-mand', [[0, '#c9d4b8'], [0.5, '#9dac8d'], [1, '#6b7a5e']], 0.36, 0.3, 0.75, 0.28, 0.25) +
  lineal('bv-cuello', [[0, '#6f7e62'], [1, '#93a284']]) +
  radial('bv-saco', [[0, '#a87a4c'], [0.5, C.saco], [1, '#4f311c']], 0.36, 0.3, 0.78, 0.26, 0.2) +
  radial('bv-sacoLejos', [[0, '#76503a'], [0.6, '#5a3b24'], [1, '#3a2415']], 0.36, 0.3, 0.78, 0.26, 0.2) +
  radial('bv-manga', [[0, '#a6774b'], [0.55, '#78502f'], [1, '#4a2e1a']], 0.3, 0.5, 0.85, 0.2, 0.45) +
  radial('bv-mangaLejos', [[0, '#6e4a2e'], [0.55, '#553722'], [1, '#331f11']], 0.3, 0.5, 0.85, 0.2, 0.45) +
  radial('bv-camisa', [[0, '#ffffff'], [0.55, '#f1ede0'], [1, '#c7bfa8']], 0.35, 0.25, 0.85, 0.3, 0.2) +
  lineal('bv-corbata', [[0, '#f0574b'], [0.45, C.corbata], [1, '#931c1f']], 0, 0, 1, 0) +
  radial('bv-ojo', [[0, '#ffffff'], [0.55, '#f7f2dc'], [1, '#d3c697']], 0.42, 0.42, 0.62, 0.34, 0.3) +
  radial('bv-diente', [[0, '#fffbea'], [0.6, C.diente], [1, '#c4b07c']], 0.4, 0.3, 0.75, 0.3, 0.2) +
  radial('bv-boca', [[0, '#8a2a31'], [0.45, '#511319'], [1, '#22070a']], 0.15, 0.4, 0.95, 0.1, 0.4) +
  radial('bv-lengua', [[0, '#e48a92'], [0.55, '#ba505c'], [1, '#86303c']], 0.4, 0.3, 0.7, 0.3, 0.2) +
  radial('bv-hueso', [[0, '#fffaf0'], [0.6, '#eee3c6'], [1, '#c6b68d']], 0.35, 0.3, 0.75, 0.3, 0.2) +
  radial('bv-carne', [[0, '#b04a46'], [0.6, '#702024'], [1, '#3e0d10']], 0.4, 0.4, 0.65) +
  radial('bv-sombra', [[0, '#000', 0.46], [0.55, '#000', 0.24], [1, '#000', 0]], 0.5, 0.5, 0.5, 0.5, 0.5) +
  radial('bv-zapato', [[0, '#a2724a'], [0.5, C.zapato], [1, '#3b2414']], 0.32, 0.3, 0.8, 0.24, 0.2) +
  radial('bv-zapatoLejos', [[0, '#73502f'], [0.5, '#4f321c'], [1, '#2a190c']], 0.32, 0.3, 0.8, 0.24, 0.2) +
  lineal('bv-suela', [[0, '#4a3322'], [1, '#1d130b']]) +
  radial('bv-rodilla', [[0, '#c9d4b8'], [0.6, '#98a788'], [1, '#5f6e54']], 0.4, 0.35, 0.7);

/** Degradado horizontal del jean en coordenadas del marco (pierna y dobladillo comparten color en la unión). */
function gradJean(id: string, x: number, lejos: boolean): string {
  return lejos
    ? lineal(id, [[0, '#566d92'], [0.45, '#435979'], [1, '#273650']], x - 8, 0, x + 8, 0, 'userSpaceOnUse')
    : lineal(id, [[0, '#86a3c9'], [0.4, C.jean], [1, '#344a6d']], x - 8, 0, x + 8, 0, 'userSpaceOnUse');
}

// ---------------------------------------------------------------------------------------------------------------
// Cabeza, boca y mandíbula (marco local del zombi; la cabeza gira alrededor del cuello)

const D_CABEZA =
  'M24,48.5 C20.5,48 18.8,45.6 19.6,43.2 C16,43.6 12.6,41.6 12.8,38.4 C13,35 16.6,33.4 19.4,34.2 ' +
  'C19.6,32.2 18.4,30.6 17.6,29.2 C16.4,27 16.6,24.4 18.2,22.6 C20,15 27,6.5 39,3.6 C52,0.6 67,3.8 75,12.6 ' +
  'C82,20.6 83.4,33 79,42 C76.4,47.6 71,52.4 64.6,55 C62.6,55.8 60.6,56.2 58.6,56 C48,54.6 36,52 24,48.5 Z';

/** Ojo: globo con degradado, pupila diminuta con brillo, párpado de piel que tapa `parpado` (0..1) desde arriba. */
function ojo(cx: number, cy: number, rx: number, ry: number, parpado: number, caida: number, pupila: Pt, rp: number, lejos = false): string {
  const d = elipse(cx, cy, rx, ry, ry * 1.04);
  const yl = cy - ry + parpado * 2 * ry;
  const idL = nid('p');
  const globo = forma(d, 'url(#bv-ojo)', (dd) =>
    banda(dd, 0, -2.6, '#7f7752', 0.55, 1.4) + banda(dd, 2.2, 2.4, '#a89a6a', 0.45, 1.6) +
    // pupila
    `<circle cx="${f(pupila[0])}" cy="${f(pupila[1])}" r="${f(rp)}" fill="#120c06"/>` +
    `<circle cx="${f(pupila[0] - rp * 0.32)}" cy="${f(pupila[1] - rp * 0.36)}" r="${f(rp * 0.36)}" fill="#ffffff" opacity="0.9"/>` +
    // brillo del globo (como los ojos de las plantas)
    brillo(cx - rx * 0.38, cy - ry * 0.18, rx * 0.26, ry * 0.16, -35, 0.95, 0.25) +
    brillo(cx + rx * 0.35, cy + ry * 0.5, rx * 0.2, ry * 0.1, -20, 0.5, 0.4),
  { trazo: lejos ? 1.9 : 2.1, peso: 0.3 });
  // Párpado: la parte de arriba del globo (un poco más grande) recortada por la línea del párpado.
  const xa = cx - rx - 2.5, xb = cx + rx + 2.5;
  const clipP = `M${f(xa)},${f(yl - caida)} Q${f(cx)},${f(yl + 1.2)} ${f(xb)},${f(yl + caida)} L${f(xb)},${f(cy - ry - 4)} L${f(xa)},${f(cy - ry - 4)} Z`;
  const dP = elipse(cx, cy, rx + 0.9, ry + 0.9);
  const parp =
    `<defs><clipPath id="${idL}"><path d="${clipP}"/></clipPath></defs>` +
    `<g clip-path="url(#${idL})">` +
    `<path d="${dP}" fill="${C.piel}"/>` +
    mancha(dP, C.pielClara, 0.5, 1.2).replace('<path', `<path transform="translate(-1 -1.4)"`) +
    `<path d="${dP}" fill="none" stroke="${T}" stroke-width="2.2"/>` +
    `</g>` +
    // sombra que el párpado echa sobre el globo
    `<defs><clipPath id="${idL}g"><path d="${d}"/></clipPath></defs>` +
    `<g clip-path="url(#${idL}g)">${pliegue(xa, yl - caida + 1.4, cx, yl + 2.6, xb, yl + caida + 1.4, 2.4, '#4a4630', 0.45, 0.9)}</g>` +
    // borde del párpado
    `<path d="M${f(cx - rx - 0.6)},${f(yl - caida * 0.85)} Q${f(cx)},${f(yl + 1.2)} ${f(cx + rx + 0.6)},${f(yl + caida * 0.85)}" fill="none" stroke="${T}" stroke-width="2.3" stroke-linecap="round"/>`;
  return globo + (parpado > 0 ? parp : '');
}

function cabeza(conPelo = true): string {
  const d = D_CABEZA;
  // Dientes de arriba: cuelgan del labio (se dibujan antes de la cabeza, que tapa su raíz).
  const dientes =
    forma('M26.2,47.4 L31.6,48.6 C31.8,51.2 31.3,53.6 30.2,54.4 C29,55.2 27.3,54.8 26.7,53.5 C26.1,51.6 26,49.4 26.2,47.4 Z', 'url(#bv-diente)', (dd) => banda(dd, 1.4, 1.2, '#9c8a58', 0.6, 0.8), { trazo: 1.5, peso: 0.2 }) +
    forma('M33.4,49.4 L40.4,50.8 C40.8,53.6 40.2,56.1 38.7,56.9 C37,57.7 34.8,57.1 34.2,55.6 C33.6,53.8 33.3,51.5 33.4,49.4 Z', 'url(#bv-diente)', (dd) => banda(dd, 1.4, 1.2, '#9c8a58', 0.6, 0.8), { trazo: 1.5, peso: 0.2 }) +
    forma('M45.4,52.2 L50.4,53.4 C51,55.7 50.3,57.8 49,58.4 C47.7,59 46.5,58.1 46.1,57 C45.5,55.5 45.3,53.8 45.4,52.2 Z', 'url(#bv-diente)', (dd) => banda(dd, 1.4, 1.2, '#9c8a58', 0.6, 0.8), { trazo: 1.5, peso: 0.2 });

  const sombreado = (dd: string) =>
    banda(dd, 5, 4.4, C.pielHonda, 0.5, 3.6) +
    banda(dd, -2.8, -3, C.pielClara, 0.55, 2.4) +
    banda(dd, 1.3, 0.3, C.borde, 0.45, 0.7) +
    // luz de rebote abajo (como el césped que ilumina por debajo)
    banda(dd, 0, 1.6, '#b9c99f', 0.3, 1) +
    // cuencas hundidas y ojeras
    brillo(46.6, 29, 13.5, 13.8, 0, 0.42, 2.6, C.pielHonda) +
    brillo(27.4, 31.4, 8.6, 9.4, 0, 0.36, 2.2, C.pielHonda) +
    // mejilla chupada y pómulo
    brillo(51, 45, 9, 3.6, 18, 0.32, 2.2, C.pielHonda) +
    brillo(42.6, 41, 5, 2.4, 10, 0.3, 1.6, C.pielClara) +
    // sien hundida y nuca
    brillo(64, 24, 4, 7, 10, 0.22, 2.4, C.pielHonda) +
    // manchas de piel
    brillo(60.5, 12.5, 3.6, 2.6, 20, 0.28, 0.7, C.pielOscura) +
    brillo(67.4, 19.5, 2.1, 1.6, 0, 0.26, 0.6, C.pielOscura) +
    brillo(29.4, 13.6, 1.8, 1.3, 0, 0.2, 0.5, C.pielOscura) +
    // frente: arrugas de preocupación
    pliegue(24.6, 18.4, 30, 13.6, 36.6, 14.4, 1.1, C.pielOscura, 0.7, 0.3) +
    pliegue(27, 21.6, 32, 18, 37.4, 18.8, 0.9, C.pielOscura, 0.55, 0.3) +
    // ceja ósea: luz encima y pliegue del ceño
    pliegue(36.6, 15.2, 47, 11.6, 57, 15.6, 1.3, C.pielOscura, 0.65, 0.35) +
    pliegue(37, 13.8, 47, 10, 56.4, 13.8, 1.1, C.pielClara, 0.55, 0.5) +
    // aleta de la nariz y fosa
    pliegue(19.8, 35.6, 22.4, 39.6, 20.4, 43, 1, C.pielOscura, 0.7, 0.3) +
    brillo(17.4, 41.8, 1.5, 0.9, 20, 0.85, 0.2, C.pielHonda) +
    brillo(15.6, 37.2, 2.4, 1.6, -30, 0.55, 0.6) +
    // surco hacia la comisura (cara caída) y comisura
    pliegue(24.4, 43.4, 27, 46, 28.6, 48.4, 0.8, C.pielOscura, 0.55, 0.3) +
    pliegue(52, 51.6, 56, 51.2, 58.4, 55.4, 0.9, C.pielOscura, 0.7, 0.3) +
    // labio de arriba un poco más oscuro (morado frío)
    pliegue(24.4, 47.6, 42, 53, 58.4, 55.6, 1.6, '#6c6670', 0.45, 0.6) +
    // brillo grande de la calva y especular de juguete
    brillo(38, 12.4, 11, 4.6, -18, 0.42, 2) +
    brillo(35.4, 10.6, 4, 1.6, -22, 0.75, 0.5) +
    brillo(70.4, 30, 1.6, 4.6, 8, 0.3, 0.8);

  const oreja =
    forma('M66.2,33.4 C69.4,29 76.4,29.6 77.2,35.8 C78,41.6 73.6,46.6 68.4,45.2 C66.4,44.6 65.4,42.6 65.6,40.6 C65.8,38 65.6,35.6 66.2,33.4 Z', 'url(#bv-piel)', (dd) =>
      banda(dd, 2.4, 2.2, C.pielHonda, 0.5, 1.6) + banda(dd, -1.4, -1.6, C.pielClara, 0.5, 1) +
      pliegue(70.4, 34.6, 74.6, 37.6, 70.8, 42.6, 1.8, C.pielOscura, 0.85, 0.4) +
      brillo(66.6, 39.8, 1.8, 4.4, 0, 0.4, 1.2, C.pielHonda),
    { trazo: 2.1, dTrazo: 'M66.2,33.4 C69.4,29 76.4,29.6 77.2,35.8 C78,41.6 73.6,46.6 68.4,45.2 C66.4,44.6 65.4,42.6 65.6,40.6' });

  const ojos =
    ojo(27.8, 30.6, 6.6, 7.4, 0.4, -0.6, [25.4, 32.2], 1.75, true) +
    ojo(46.8, 27.6, 9.8, 10.6, 0.2, 1.4, [43.2, 29.8], 2.3);

  const pelo = conPelo
    ? `<g fill="none" stroke="${T}" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M45.2,3 C44.4,-1.6 40.6,-3.2 41.6,-6.4 C42.4,-8.8 46.2,-8.4 46.6,-6" stroke-width="1.9"/>` +
      `<path d="M52.4,2.4 C53.2,-1.2 56.4,-2.2 58.2,-5" stroke-width="1.7"/>` +
      `<path d="M38.6,4.4 C37,1.4 34.6,0.8 33.6,-1.8" stroke-width="1.6"/>` +
      `<path d="M58.6,3.6 C60.6,1.6 63.6,1.6 64.4,-0.4" stroke-width="1.4"/>` +
      `</g>`
    : '';

  return dientes + forma(d, 'url(#bv-piel)', sombreado, { trazo: 2.8 }) + oreja + ojos + pelo;
}

const D_MANDIBULA = 'M60,51.6 C48,53.2 35,51.4 23,49.4 C18.6,50.8 17.4,58.2 21,63.4 C25.4,69.4 39,70.6 49.4,66.4 C56.6,63.4 61.8,58 60,51.6 Z';

function mandibula(): string {
  const diente = (dd: string) => forma(dd, 'url(#bv-diente)', (x) => banda(x, 1.2, 1.2, '#9c8a58', 0.6, 0.7), { trazo: 1.5, peso: 0.2 });
  const dientes =
    diente('M41.2,54.6 C41,52 41.4,49.8 42.6,48.8 C43.8,47.8 45.4,48.4 45.8,49.8 C46.2,51.2 46.2,53 46,54.8 Z') +
    diente('M22.8,52.4 C22.6,50.2 23,48.2 23.8,47.2 L25.2,48.4 L26.4,47.2 C27.2,48.4 27.4,50.4 27.2,52.6 Z');
  return (
    dientes +
    forma(D_MANDIBULA, 'url(#bv-mand)', (d) =>
      banda(d, 3, 3.6, C.pielHonda, 0.55, 2.4) +
      banda(d, -1.8, -1, C.pielClara, 0.45, 1.4) +
      banda(d, 0, -2.4, C.pielHonda, 0.4, 1.2) +
      banda(d, 1.1, 0.6, C.borde, 0.35, 0.6) +
      // labio de abajo (morado frío) y surco del mentón
      pliegue(22.4, 50.4, 40, 55.8, 59.4, 52.8, 2.4, '#71646e', 0.6, 0.5) +
      pliegue(23.6, 57.6, 30, 59.6, 36.4, 58.6, 0.9, C.pielOscura, 0.6, 0.3) +
      brillo(24.6, 61.4, 3.6, 2, -20, 0.5, 1) +
      brillo(23.4, 60.4, 1.4, 0.8, -20, 0.6, 0.3),
    { trazo: 2.7 })
  );
}

const D_BOCA = 'M59.6,52.6 C48,55 36,52.4 23.2,48 C25.8,52 26.2,58.8 24.6,65 C33,63.4 42,60 49,57.4 C53.4,55.8 57,54.2 60.4,51.8 Z';

function boca(): string {
  return (
    `<path d="${D_BOCA}" fill="url(#bv-boca)"/>` +
    `<path d="M26.4,63.4 C30,58.2 39,56.4 46.4,57.4 C42.4,60.6 33.6,63.6 26.4,63.4 Z" fill="url(#bv-lengua)"/>` +
    brillo(33, 60.2, 3.2, 1, -14, 0.45, 0.5)
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Cuerpo: cuello (con el muñón), saco, camisa, solapas, bolsillo y botón

const D_SACO =
  'M45,64.4 C42.6,72 40.4,86 41,100 C41.2,104 41.8,107.6 43,110.4' +
  rasgado([[43, 110.4], [46.4, 107.6], [49.6, 112], [53.2, 108.8], [57, 112.6], [60.6, 109.2], [64.2, 111.8], [67.4, 108.6], [71.2, 113], [74.6, 109.2], [78.4, 111.6], [81.8, 108.4], [85.6, 110.4], [88.4, 106.6]]) +
  ' C90.2,96 89.6,81 86.4,71.6 C84.4,65 79,60.4 71.4,60 C63,59.6 55,61.6 50,63 C48,63.6 46.4,64 45,64.4 Z';

function cuerpo(): string {
  const saco = forma(D_SACO, 'url(#bv-saco)', (d) =>
    banda(d, 4.4, 3.4, C.sacoHondo, 0.55, 3.2) +
    banda(d, -2.6, -2.4, C.sacoClaro, 0.5, 2) +
    banda(d, 1.2, 0.2, '#e3c49c', 0.4, 0.7) +
    banda(d, 0, 3.2, C.sacoHondo, 0.35, 1.6) +
    // oclusión bajo la cabeza y el cuello
    brillo(60, 63.6, 14, 4.4, -4, 0.5, 2.6, C.sacoHondo) +
    // pliegues: axila, joroba y cintura
    pliegue(64.4, 72, 70, 76, 75, 84.6, 1.7, C.sacoHondo, 0.5, 0.5) +
    pliegue(66, 71.4, 71.6, 75, 76.6, 83, 0.9, C.sacoClaro, 0.45, 0.5) +
    pliegue(76.6, 63.6, 82, 67, 85.2, 75, 1.3, C.sacoHondo, 0.4, 0.6) +
    pliegue(70, 101.6, 77, 99.4, 84.6, 102.6, 1.2, C.sacoHondo, 0.45, 0.5) +
    pliegue(72.4, 105, 78, 103.4, 83.4, 105.4, 0.9, C.sacoHondo, 0.4, 0.5) +
    // costura de la espalda remendada a puntadas
    `<path d="M80.4,77 C82.4,80.4 83,84 82.6,87.6" fill="none" stroke="${C.sacoHondo}" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>` +
    `<path d="M79.6,78.6 L82.4,77.8 M80.6,81.4 L83.6,80.8 M81,84.2 L84,84 M80.8,87 L83.8,87.2" stroke="#e7d3a8" stroke-width="0.8" stroke-linecap="round" opacity="0.9"/>`,
  { trazo: 2.8 });

  // Cuello de la camisa por detrás (rodea el cuello) y cuello de piel con el muñón arriba.
  const cuelloSaco = forma('M48.6,65.6 C48.8,60.8 53.6,57.6 60,57.2 C65.4,57 69.2,58.8 71,61.8 C66.6,62 62.4,63.4 60.4,65.6 Z', '#5a3a22', (d) => banda(d, 0, -1.6, C.sacoHondo, 0.5, 1), { trazo: 2.2 });
  const cuello = forma('M49.8,53.4 C50.2,58 49.6,62.2 48,66.6 L62.6,66.6 C61.4,62.2 61.2,57.8 61.6,53.4 Z', 'url(#bv-cuello)', (d) =>
    banda(d, 2, 0, C.pielHonda, 0.5, 1.4) + banda(d, -1.4, 0, C.pielClara, 0.4, 1) + banda(d, 0, -3, C.pielHonda, 0.5, 1.6) +
    pliegue(53.4, 57, 52.6, 61.4, 51.2, 65.4, 0.8, C.pielOscura, 0.6, 0.3),
  { trazo: 2.4 });
  const munon =
    forma(elipse(55.7, 53.6, 5.9, 2.2), 'url(#bv-carne)', (d) => banda(d, 0, -1, '#2a0607', 0.5, 0.6), { trazo: 1.7, peso: 0 }) +
    forma(elipse(57.4, 53.3, 1.9, 1.1), 'url(#bv-hueso)', () => '', { trazo: 0.9, peso: 0 });

  const camisa = forma('M46.2,65.6 C51,63.6 57.4,63.4 61.4,65.2 C61.6,76.4 59.6,88.4 55.8,98.6 C52,99.8 47.4,98.6 44.6,95.8 C43,86 43.6,74.2 46.2,65.6 Z', 'url(#bv-camisa)', (d) =>
    banda(d, 3.2, 1, C.camisaSombra, 0.7, 1.8) + banda(d, 0, 3, C.camisaSombra, 0.5, 1.6) +
    brillo(53.6, 68.6, 7, 2.6, 0, 0.45, 1.6, '#8f8670') +
    pliegue(46.4, 82, 50.4, 80.4, 55.6, 81.4, 0.9, C.camisaSombra, 0.8, 0.4) +
    pliegue(46.6, 90.4, 50.6, 89, 54.6, 90, 0.8, C.camisaSombra, 0.7, 0.4) +
    // mancha de tierra en la camisa
    brillo(47.6, 88, 2, 1.4, 20, 0.35, 0.6, '#8a7a4a'),
  { trazo: 2.2 });

  const solapaLejos = forma('M45.4,64.8 C43.6,72.4 42.4,84.4 42.8,96.4 C43.8,97.6 45,98.2 46.2,98.4 C45.4,86.4 46,74.4 47.8,65.4 Z', '#5e3d24', (d) => banda(d, 1.4, 0, C.sacoHondo, 0.5, 0.8), { trazo: 1.9, peso: 0.3 });
  const solapa = forma('M60.4,63.4 C63.8,63.4 67,64.6 69,66.8 L65.8,71.6 L69.6,72.8 C66.6,80.4 61.6,90.6 56.4,99.6 C56.8,88 58.8,76 60.4,63.4 Z', 'url(#bv-saco)', (d) =>
    banda(d, 2, 1.6, C.sacoHondo, 0.5, 1.4) + banda(d, -1.4, -0.6, C.sacoClaro, 0.55, 1) +
    pliegue(61.6, 67, 61, 80, 58.2, 94, 0.8, '#e0b98a', 0.35, 0.4),
  { trazo: 2.2 });
  // sombra que echa la solapa sobre la camisa
  const sombraSolapa = mancha('M60.6,64.4 C59,76 57.6,88 55.2,99 L53.8,99 C55.6,88 57,76 58.4,64.4 Z', '#6d6450', 0.45, 1.2);

  const cuelloCamisa =
    forma('M46.4,64.6 C48.6,63.4 51.2,63.6 52.8,65.4 L47.6,72.4 C46.2,70.4 45.6,67.4 46.4,64.6 Z', 'url(#bv-camisa)', (d) => banda(d, 1.4, 1.2, C.camisaSombra, 0.6, 0.9), { trazo: 1.9, peso: 0.3 }) +
    forma('M52.6,65.4 C55,63.6 58.6,63.4 60.8,64.8 C61,68 59.8,71 57.8,72.8 Z', 'url(#bv-camisa)', (d) => banda(d, 1.4, 1.2, C.camisaSombra, 0.6, 0.9), { trazo: 1.9, peso: 0.3 });

  const bolsillo =
    mancha('M68.6,94.6 C72.6,93.8 77,93.8 81,95 L80.6,97.4 C76.6,96.4 72.6,96.4 69,97.6 Z', C.sacoHondo, 0.5, 1) +
    forma('M68.4,90.6 C73,89.4 78.6,89.4 82.6,90.8 C82.4,92.8 81.6,94.6 80.6,95.6 C76.4,94.8 72.4,94.8 69,95.8 C68.2,94.2 68,92.4 68.4,90.6 Z', 'url(#bv-saco)', (d) =>
      banda(d, 0, 1.6, C.sacoHondo, 0.5, 0.9) + banda(d, -1, -1.2, C.sacoClaro, 0.5, 0.8), { trazo: 1.7, peso: 0.3 });

  const boton =
    forma(elipse(59.4, 95.6, 2, 1.9), '#3a2414', (d) => banda(d, -0.6, -0.7, '#8b6440', 0.8, 0.5), { trazo: 1.1, peso: 0.2 }) +
    // hilo suelto donde faltaba el otro botón
    `<path d="M63.2,84.4 C64.4,85.8 63.4,87 64.4,88.4 C65,89.2 64.6,90 64.2,90.4" fill="none" stroke="#e7d3a8" stroke-width="0.8" stroke-linecap="round"/>`;

  return saco + cuelloSaco + cuello + munon + camisa + sombraSolapa + solapaLejos + solapa + cuelloCamisa + bolsillo + boton;
}

function corbata(): string {
  const hoja = 'M50.8,70.2 C52.4,71 53.6,71 54.8,70.4 C56.8,76.6 58.6,83 58.4,89.6 C58.2,92.4 56.2,95.4 53.8,97 C51.2,95.6 49.2,92.8 48.8,89.8 C48.6,83.4 49.6,76.4 50.8,70.2 Z';
  const rayas = [74.6, 80.2, 85.8, 91.4]
    .map((y) => `<path d="M46,${f(y + 2.6)} L61,${f(y - 1.4)} L61,${f(y + 0.6)} L46,${f(y + 4.6)} Z" fill="${C.corbataOscura}" opacity="0.75"/>`)
    .join('');
  return (
    forma(hoja, 'url(#bv-corbata)', (d) =>
      rayas + banda(d, 2.2, 1.4, '#4a0a0c', 0.45, 1.2) + banda(d, -1.2, -1, '#ff9a8a', 0.4, 0.8) +
      brillo(51.8, 82, 0.9, 7, -4, 0.45, 0.8),
    { trazo: 2.1 }) +
    forma('M49.4,65.4 C51.4,64 54.4,64 56.2,65.6 C56.2,67.6 55.6,69.4 54.8,70.6 C53.4,71.2 51.8,71.2 50.6,70.6 C49.8,69 49.4,67.2 49.4,65.4 Z', 'url(#bv-corbata)', (d) =>
      banda(d, 1.6, 1.4, '#4a0a0c', 0.5, 0.9) + brillo(51.6, 66.6, 1.4, 1, -20, 0.6, 0.4),
    { trazo: 2.1 })
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Brazos (se dibujan colgando; la animación los gira hacia delante, así que la luz llega por la izquierda)

const D_BRAZO = 'M47.6,69.6 C47.4,64.4 51,61.6 55.4,61.8 C60,62 63,65.4 62.6,70.4 C63.8,74 65.2,79 64,84.4 C63.4,87.6 62.2,89.6 61.4,90.6 C60.2,93.4 57.8,94.6 55,94.6 C51.4,94.6 48.4,92 48.2,88.2 C48,82 46.8,75.6 47.6,69.6 Z';

function sombreadoManga(lejos: boolean) {
  const hondo = lejos ? '#1d1009' : C.sacoHondo;
  const claro = lejos ? '#8a6343' : C.sacoClaro;
  return (d: string) =>
    banda(d, 3.4, 0.6, hondo, 0.6, 2.2) + banda(d, -2.2, 0.4, claro, 0.55, 1.6) + banda(d, 1, -0.4, '#e3c49c', lejos ? 0.15 : 0.35, 0.6);
}

function brazo(lejos: boolean, dx: number): string {
  const s = sombreadoManga(lejos);
  const hondo = lejos ? '#1d1009' : C.sacoHondo;
  return `<g transform="translate(${dx} 0)">` + forma(D_BRAZO, lejos ? 'url(#bv-mangaLejos)' : 'url(#bv-manga)', (d) =>
    s(d) +
    // pliegues de la tela que cuelga hacia el codo
    pliegue(58.6, 80.6, 61.4, 84.4, 61, 89.4, 1.3, hondo, 0.6, 0.4) +
    pliegue(56.4, 84.4, 58.4, 87.4, 57.8, 91.4, 1, hondo, 0.5, 0.4) +
    // costura del hombro
    pliegue(48.6, 70.8, 55, 72.6, 61.8, 71, 0.8, hondo, 0.5, 0.4) +
    (lejos ? '' : brillo(50.4, 76, 1.4, 6, 0, 0.35, 1.2)),
  { trazo: 2.6 }) + `</g>`;
}

function antebrazo(lejos: boolean, dx: number): string {
  const d =
    'M48.4,88 C48.4,84.2 51.4,81.4 55.2,81.4 C58.8,81.4 61.8,84.4 61.8,88 C62.4,93 63.8,98 65.4,102.6' +
    rasgado([[65.4, 102.6], [62.4, 105.8], [59.6, 103.6], [56.6, 107], [53.2, 104.2], [50.4, 106.2], [47.2, 103.2]], 0.9) +
    ' C47.6,98 48.4,93 48.4,88 Z';
  const s = sombreadoManga(lejos);
  const hondo = lejos ? '#1d1009' : C.sacoHondo;
  return `<g transform="translate(${dx} 0)">` + forma(d, lejos ? 'url(#bv-mangaLejos)' : 'url(#bv-manga)', (dd) =>
    s(dd) +
    banda(dd, 0, 2.6, hondo, 0.75, 1) +
    pliegue(58.2, 90.6, 61, 94, 62.2, 99.6, 1.2, hondo, 0.55, 0.4) +
    (lejos ? '' : brillo(50.2, 94, 1.3, 5, 0, 0.3, 1.1)) +
    // remiendo en el codo (otra tela, cosida)
    (lejos ? '' : `<path d="M50.6,85 C53,83.6 57.6,83.6 59.6,85.2 C60.2,87.6 59.8,90 59,91.4 C56.4,92.4 53,92.4 50.6,91.4 C49.8,89.4 49.8,87 50.6,85 Z" fill="#9c7a4c" stroke="${T}" stroke-width="1.1"/>` +
      `<path d="M51.6,86.2 L58.4,86.2 M51.4,90.4 L58.4,90.4" stroke="#f0e2c0" stroke-width="0.7" stroke-dasharray="1.2 1.1"/>`),
  { trazo: 2.6 }) + `</g>`;
}

/** Mano gris colgando de la muñeca, dibujada en el marco de la pose (apunta a la izquierda, dedos caídos). */
function mano(lejos: boolean, x: number, y: number): string {
  const relleno = lejos ? 'url(#bv-pielLejos)' : 'url(#bv-piel)';
  const hondo = C.pielHonda;
  const claro = lejos ? '#b3c0a0' : C.pielClara;
  const s = (d: string) => banda(d, 1.8, 2, hondo, 0.55, 1.3) + banda(d, -1.2, -1.4, claro, 0.5, 0.9);
  const dedo = (d: string, ux: number, uy: number) =>
    forma(d, relleno, (dd) => s(dd) + brillo(ux, uy, 1.6, 1.1, 20, 0.95, 0.25, C.una), { trazo: 2, peso: 0.35 });
  const pulgar = forma('M-6.4,-3.6 C-9.4,-8 -15,-8.4 -16.4,-5.4 C-17.2,-3.2 -15.2,-1.4 -13,-2 Z', relleno, (d) => s(d) + brillo(-15.6, -5.6, 1.1, 1.3, 0, 0.9, 0.25, C.una), { trazo: 2, peso: 0.35 });
  const dorso = 'M2.6,-4.2 C-2.6,-5.8 -8,-6 -11.2,-3.8 C-13.8,-2 -13.8,1.8 -11.6,3.6 C-8.6,5.8 -3.4,5.4 1.8,3.8 Z';
  return (
    `<g transform="translate(${x} ${y}) rotate(-90)">` +
    pulgar +
    dedo('M-13.4,-2 C-16.6,0 -16.8,4.8 -15,8.2 C-14,10 -11.4,10 -11,8 C-10.6,5.6 -10.8,3 -9.6,0.8 Z', -13.2, 8.4) +
    dedo('M-9.8,1.2 C-11.2,4.6 -11,8.8 -9,10.8 C-7.6,12.2 -5.4,11.4 -5.6,9.2 C-5.8,7 -6,4.6 -5,2.2 Z', -7.6, 10.4) +
    dedo('M-5.4,2 C-6,5 -5.4,8 -3.6,9.6 C-2.4,10.6 -0.6,9.8 -0.8,8.2 C-1,6.4 -1.2,4.4 -0.4,2.8 Z', -2.2, 9.2) +
    forma(dorso, relleno, (d) =>
      s(d) +
      // la muñeca se pierde en la sombra de la manga
      `<rect x="-1.5" y="-7" width="6" height="14" fill="${hondo}" opacity="0.75" filter="${fb(1.2)}"/>` +
      brillo(-8.6, -3, 2, 1.1, -10, 0.45, 0.6) + brillo(-4.4, -3.6, 1.6, 0.9, -10, 0.35, 0.6) +
      pliegue(-10.6, -0.6, -7, 0.6, -3, -0.4, 0.6, hondo, 0.4, 0.3),
    { trazo: 2.2, dTrazo: 'M2.6,-4.2 C-2.6,-5.8 -8,-6 -11.2,-3.8 C-13.8,-2 -13.8,1.8 -11.6,3.6 C-8.6,5.8 -3.4,5.4 1.8,3.8', peso: 0.35 }) +
    `</g>`
  );
}

/** Brazo cercano sin antebrazo: la manga rota en el codo y el hueso a la vista. */
function brazoRoto(): string {
  const d =
    'M47.6,69.6 C47.4,64.4 51,61.6 55.4,61.8 C60,62 63,65.4 62.6,70.4 C63.8,74 65.2,79 64.4,84' +
    rasgado([[64.4, 84], [61.6, 87.6], [59, 85.2], [56.4, 88.8], [53.2, 85.8], [50.6, 88.2], [48.2, 85]], 0.9) +
    ' C47.8,79.6 46.8,74.6 47.6,69.6 Z';
  const s = sombreadoManga(false);
  return (
    forma(elipse(56, 86.6, 7, 2.6), '#2a1209', () => '', { trazo: 1.6, peso: 0 }) +
    forma('M53.4,82 L57.6,82 C57.4,86 57.6,89.6 58.2,91.6 C60.6,91.8 61.4,95.2 59.4,96.6 C58,97.6 56.4,96.8 55.6,96 C54.8,96.8 53,97.6 51.6,96.6 C49.6,95.2 50.4,91.8 52.8,91.6 C53.4,89.6 53.6,86 53.4,82 Z', 'url(#bv-hueso)', (dd) =>
      banda(dd, 1.4, 1, '#8c7c55', 0.6, 0.8) + brillo(54.4, 88, 0.6, 2.6, 0, 0.8, 0.3),
    { trazo: 1.8, peso: 0.3 }) +
    forma(d, 'url(#bv-manga)', (dd) =>
      s(dd) + banda(dd, 0, 2.4, C.sacoHondo, 0.7, 1) +
      pliegue(48.6, 70.8, 55, 72.6, 61.8, 71, 0.8, C.sacoHondo, 0.5, 0.4) +
      brillo(50.4, 76, 1.4, 6, 0, 0.35, 1.2),
    { trazo: 2.6 }) +
    `<path d="M57.4,87.8 C57.8,90 57,91.6 57.8,93.4 M51.8,87.6 C51.4,89.4 52,90.6 51.4,92" fill="none" stroke="#5a3a22" stroke-width="0.8" stroke-linecap="round"/>`
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Piernas y zapatos

function pierna(x: number, lejos: boolean): string {
  const dx = x - 57;
  const d = 'M49.4,95 C48.8,104 49.6,111 48.8,118.4 C48.2,124.2 50,129.4 49.8,133.4 C49.7,135 49.6,136 49.6,137 L64.4,137 C64.4,134 64.4,130 64.8,125 C65.4,117 65.6,107 64.8,95 Z';
  const idg = nid('j');
  const hondo = lejos ? '#141c2c' : C.jeanHondo;
  const agujero = lejos
    ? ''
    : // rodilla rota: borde deshilachado, rodilla gris y hilos blancos
      forma('M51.4,116.2 C53.6,113.4 58.8,113.4 61,115.8 C62.6,117.8 61.8,121.8 59.4,122.8 C56.8,124 52.6,123.2 51.4,121 C50.6,119.6 50.6,117.6 51.4,116.2 Z', 'url(#bv-rodilla)', (dd) =>
        banda(dd, 0, -2, C.pielHonda, 0.7, 0.9) + brillo(55.4, 119.6, 2.4, 1.4, -10, 0.45, 0.6),
      { trazo: 1.7, color: '#151c2a', peso: 0 }) +
      `<path d="M51.6,118.6 C54.4,117.6 57.6,119.6 61.2,118.4 M52.4,121.6 C55,120.8 57.2,122.4 60,121.4" fill="none" stroke="#eef2f8" stroke-width="0.8" stroke-linecap="round" opacity="0.95"/>` +
      `<path d="M51.2,116.4 L50,115.6 M61.4,116.2 L62.6,115.2 M58.6,123.2 L59,124.6 M53.4,123.4 L52.8,124.8" stroke="#dfe6f2" stroke-width="0.8" stroke-linecap="round"/>`;
  return (
    `<defs>${gradJean(idg, 57, lejos)}</defs>` +
    `<g transform="translate(${dx} 0)">` +
    forma(d, `url(#${idg})`, (dd) =>
      banda(dd, 0, -3, hondo, 0.55, 2) +
      banda(dd, 2.4, 0, hondo, 0.4, 1.4) +
      banda(dd, -1.4, 0, lejos ? '#8193b2' : C.jeanClaro, 0.45, 1) +
      // pliegues detrás de la rodilla y brillo de la espinilla
      pliegue(58, 112.4, 61.6, 111.4, 64.6, 113.6, 0.9, hondo, 0.5, 0.4) +
      pliegue(59.4, 125.4, 62.4, 124.4, 64.8, 126.2, 0.9, hondo, 0.5, 0.4) +
      pliegue(51.4, 126, 51, 130, 51.6, 134.4, 0.7, lejos ? '#8193b2' : C.jeanClaro, 0.5, 0.5),
    { trazo: 2.6 }) +
    agujero +
    `</g>`
  );
}

/** Zapato grande y gastado con el dobladillo del jean encima (se dobla con el pie). Tobillo en (x, y). */
function zapato(x: number, y: number, lejos: boolean): string {
  const p = (dx: number, dy: number) => `${f(x + dx)},${f(y + dy)}`;
  const empeine =
    `M${p(6.6, -2)} C${p(9.4, 1.4)} ${p(9.6, 5.6)} ${p(8, 7)} C${p(2, 7.6)} ${p(-9, 7.8)} ${p(-16.4, 7)} ` +
    `C${p(-21, 6.6)} ${p(-22.4, 2.6)} ${p(-19.8, -0.4)} C${p(-17.4, -2.8)} ${p(-12, -2.8)} ${p(-8.6, -2.4)} ` +
    `C${p(-6.4, -2.2)} ${p(-5.2, -3)} ${p(-4.8, -3.4)} C${p(-1, -4.6)} ${p(4, -4)} ${p(6.6, -2)} Z`;
  const suela =
    `M${p(8.8, 5)} C${p(9.6, 7.6)} ${p(8.8, 8.8)} ${p(6.4, 8.8)} L${p(-16, 8.8)} C${p(-20.6, 8.8)} ${p(-23, 6.6)} ${p(-21.8, 4)} ` +
    `C${p(-18, 5.8)} ${p(-8, 6.2)} ${p(8.8, 5)} Z`;
  const idg = nid('j');
  const dobladillo =
    `M${p(-7.6, -4.4)} C${p(-3, -5.2)} ${p(3, -5.2)} ${p(7.8, -4.6)} C${p(8.2, -2.4)} ${p(8.8, 0)} ${p(9.4, 1.6)}` +
    rasgado([[x + 9.4, y + 1.6], [x + 6.4, y + 3.6], [x + 3.6, y + 2], [x + 0.6, y + 3.8], [x - 2.6, y + 2.2], [x - 5.6, y + 3.6], [x - 8.8, y + 1.6]], 0.8) +
    ` C${p(-8.4, 0)} ${p(-8, -2)} ${p(-7.6, -4.4)} Z`;
  const lineaDobladillo =
    `M${p(7.8, -4.6)} C${p(8.2, -2.4)} ${p(8.8, 0)} ${p(9.4, 1.6)}` +
    rasgado([[x + 9.4, y + 1.6], [x + 6.4, y + 3.6], [x + 3.6, y + 2], [x + 0.6, y + 3.8], [x - 2.6, y + 2.2], [x - 5.6, y + 3.6], [x - 8.8, y + 1.6]], 0.8) +
    ` C${p(-8.4, 0)} ${p(-8, -2)} ${p(-7.6, -4.4)}`;
  const hondo = lejos ? '#140b05' : C.zapatoOscuro;
  return (
    forma(suela, 'url(#bv-suela)', (d) => banda(d, -0.8, -0.8, '#6b4a30', 0.6, 0.5), { trazo: 2.3, peso: 0.4 }) +
    forma(empeine, lejos ? 'url(#bv-zapatoLejos)' : 'url(#bv-zapato)', (d) =>
      banda(d, 2.6, 2.6, hondo, 0.6, 1.8) + banda(d, -1.6, -1.6, lejos ? '#8a6444' : C.zapatoClaro, 0.5, 1.2) +
      banda(d, 1, -0.4, '#f2d9b8', lejos ? 0.12 : 0.3, 0.5) +
      // arrugas del cuero y brillo de la puntera (cuero lustroso como las plantas)
      pliegue(x - 9.6, y - 1.6, x - 8.4, y + 1.6, x - 9.4, y + 4.6, 0.9, hondo, 0.55, 0.3) +
      pliegue(x - 6.8, y - 1.8, x - 5.6, y + 1, x - 6.4, y + 3.6, 0.7, hondo, 0.45, 0.3) +
      brillo(x - 16.6, y + 0.4, 2.8, 1.5, -20, lejos ? 0.3 : 0.6, 0.8) +
      brillo(x - 17.4, y - 0.2, 1, 0.6, -20, lejos ? 0.4 : 0.9, 0.2),
    { trazo: 2.6 }) +
    `<defs>${gradJean(idg, x, lejos)}</defs>` +
    forma(dobladillo, `url(#${idg})`, (d) =>
      banda(d, 0, 2.4, lejos ? '#141c2c' : C.jeanHondo, 0.55, 1.2) +
      pliegue(x - 6.8, y - 3.2, x, y - 1.6, x + 7.2, y - 3.2, 0.9, lejos ? '#141c2c' : C.jeanHondo, 0.55, 0.5) +
      pliegue(x - 5.6, y - 0.6, x, y + 0.6, x + 6, y - 0.6, 0.7, lejos ? '#8193b2' : C.jeanClaro, 0.45, 0.5),
    { trazo: 2.4, dTrazo: lineaDobladillo, peso: 0.3 }) +
    // hilos sueltos del dobladillo
    `<path d="M${p(-2.2, 2.6)} C${p(-2.6, 4)} ${p(-1.8, 4.6)} ${p(-2.4, 5.6)} M${p(4.4, 2.4)} L${p(4.8, 4.4)}" fill="none" stroke="${lejos ? '#8a9ab4' : '#dfe6f2'}" stroke-width="0.7" stroke-linecap="round"/>`
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Definición

export default function crear(): DefPersonaje {
  desenfoques.clear();
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: `<ellipse cx="61" cy="143" rx="32" ry="7" fill="url(#bv-sombra)"/>`, pivote: [61, 143], z: -10, sinTinte: true },
    { id: 'brazo_der', svg: brazo(true, H.hombroDer[0] - H.hombroIzq[0]), pivote: H.hombroDer, padre: 'cuerpo', z: 0 },
    { id: 'antebrazo_der', svg: antebrazo(true, H.codoDer[0] - H.codoIzq[0]), pivote: H.codoDer, padre: 'brazo_der', z: 0.1 },
    { id: 'mano_der', svg: mano(true, H.munecaDer[0], H.munecaDer[1]), pivote: H.munecaDer, padre: 'antebrazo_der', z: 0.2 },
    { id: 'pierna_der', svg: pierna(H.caderaDer[0], true), pivote: H.caderaDer, z: 1 },
    { id: 'zapato_der', svg: zapato(H.caderaDer[0], 136, true), pivote: [H.caderaDer[0], 136], padre: 'pierna_der', z: 1.1 },
    { id: 'pierna_izq', svg: pierna(H.caderaIzq[0], false), pivote: H.caderaIzq, z: 2 },
    { id: 'zapato_izq', svg: zapato(H.caderaIzq[0], 136, false), pivote: [H.caderaIzq[0], 136], padre: 'pierna_izq', z: 2.1 },
    { id: 'cuerpo', svg: cuerpo(), pivote: H.cadera, z: 5 },
    { id: 'corbata', svg: corbata(), pivote: [52.8, 67], padre: 'cuerpo', z: 6 },
    { id: 'cabeza', svg: cabeza(), pivote: H.cuello, padre: 'cuerpo', z: 10 },
    { id: 'boca', svg: boca(), pivote: H.mandibula, padre: 'cabeza', z: 8 },
    { id: 'mandibula', svg: mandibula(), pivote: H.mandibula, padre: 'cabeza', z: 9 },
    { id: 'brazo_izq', svg: brazo(false, 0), pivote: H.hombroIzq, padre: 'cuerpo', z: 12, estados: { roto: brazoRoto() } },
    { id: 'antebrazo_izq', svg: antebrazo(false, 0), pivote: H.codoIzq, padre: 'brazo_izq', z: 12.1 },
    { id: 'mano_izq', svg: mano(false, H.munecaIzq[0], H.munecaIzq[1]), pivote: H.munecaIzq, padre: 'antebrazo_izq', z: 12.2 },
  ];
  const filtros = [...desenfoques]
    .map((s) => `<filter id="bv-f${String(s).replace('.', '_')}" filterUnits="userSpaceOnUse" x="-80" y="-80" width="300" height="320" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${s}"/></filter>`)
    .join('');
  return {
    id: 'zombi',
    nombre: 'Zombi',
    ancho: MARCO_ZOMBI.ancho,
    alto: MARCO_ZOMBI.alto,
    ancla: MARCO_ZOMBI.ancla,
    piezas,
    defs: filtros + DEGRADADOS,
    anim: (c) => animZombi(c),
    estados: ['camina', 'come', 'quieto', 'sincabeza', 'muere', 'ceniza'],
    duraciones: { muere: 1.3, ceniza: 1.6 },
    perdidas: { ...PERDIDAS_ZOMBI },
    puntos: { cabeza: [46, 2], boca: [26, 55] },
  };
}
