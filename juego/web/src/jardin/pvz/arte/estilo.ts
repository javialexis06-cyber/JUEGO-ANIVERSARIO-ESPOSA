// Estilo común del arte de Plantas contra Zombis: paleta, contornos y ayudantes SVG (ojos, hojas, tallos, sombras,
// degradados) y el zombi base por piezas, que reutilizan todos los zombis de todos los mundos.
// Dibujos propios al estilo de PvZ: formas reconocibles, contorno oscuro, colores saturados y brillos blancos.

import type { CtxAnim, DefPieza, Pose, PosePieza } from './piezas';

/** Color del contorno de todo el arte. */
export const TINTA = '#1d1408';
/** Grosor normal del contorno (unidades de mundo). */
export const TRAZO = 2.6;

export const PALETA = {
  tinta: TINTA,
  // plantas
  verde: '#7cc443',
  verdeClaro: '#b4ea6c',
  verdeOscuro: '#3f8a22',
  verdeHondo: '#245c14',
  tallo: '#57a32e',
  talloOscuro: '#2f6d18',
  hoja: '#4f9e2c',
  hojaClara: '#8fd14f',
  amarillo: '#ffd21f',
  amarilloOscuro: '#f2a516',
  naranja: '#e58a1f',
  cafe: '#8a5426',
  cafeClaro: '#c68a4a',
  cafeOscuro: '#5c3517',
  rojo: '#d7262b',
  rojoOscuro: '#8e1418',
  hielo: '#8fd3f4',
  hieloClaro: '#d9f3ff',
  hieloOscuro: '#3f93c9',
  morado: '#8e3fa8',
  moradoClaro: '#c77fe0',
  moradoOscuro: '#55206b',
  lila: '#a77ad6',
  // zombis
  piel: '#a2ad8f',
  pielClara: '#c2cbb0',
  pielOscura: '#76835f',
  saco: '#71492a',
  sacoClaro: '#91633b',
  sacoOscuro: '#4a2e18',
  camisa: '#f1efe2',
  camisaSombra: '#c9c6b4',
  corbata: '#c8262b',
  corbataOscura: '#86161b',
  pantalon: '#5f4a36',
  pantalonOscuro: '#3f3123',
  zapato: '#3b2a1d',
  hueso: '#f2ead2',
  diente: '#f3e9b8',
  bocaZombi: '#3a1414',
  // objetos
  sol: '#ffe23a',
  solClaro: '#fff7b0',
  solOscuro: '#ffb20f',
  metal: '#b8bec6',
  metalClaro: '#eef1f5',
  metalOscuro: '#6c727b',
  cono: '#f07a1c',
  conoClaro: '#ffa552',
  conoOscuro: '#b44f0e',
} as const;

// ---------------------------------------------------------------------------------------------------------------
// Atributos y degradados

/** Atributos de contorno: `<path d="…" fill="…" ${borde()}/>`. */
export function borde(w = TRAZO): string {
  return `stroke="${TINTA}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
}

type Parada = [number, string] | [number, string, number];

function paradas(ps: Parada[]): string {
  return ps.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('');
}

/** Degradado lineal en la caja del objeto (0..1). Por defecto de arriba a abajo. */
export function lineal(id: string, ps: Parada[], x1 = 0, y1 = 0, x2 = 0, y2 = 1): string {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${paradas(ps)}</linearGradient>`;
}

/** Degradado radial en la caja del objeto (0..1), con foco opcional para el brillo. */
export function radial(id: string, ps: Parada[], cx = 0.5, cy = 0.5, r = 0.5, fx = cx, fy = cy): string {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${paradas(ps)}</radialGradient>`;
}

/** Degradado radial típico de volumen: claro arriba a la izquierda, oscuro abajo a la derecha. */
export function volumen(id: string, claro: string, medio: string, oscuro: string, fx = 0.35, fy = 0.3): string {
  return radial(id, [[0, claro], [0.55, medio], [1, oscuro]], 0.45, 0.42, 0.62, fx, fy);
}

// ---------------------------------------------------------------------------------------------------------------
// Formas comunes

/** Sombra suave en el suelo. */
export function sombra(cx: number, cy: number, rx: number, ry: number, opacidad = 0.32): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${opacidad * 0.45}"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.78}" ry="${ry * 0.72}" fill="#000" opacity="${opacidad * 0.55}"/>`
  );
}

/** Brillo blanco translúcido (hojas, cabezas, frutos). */
export function brillo(cx: number, cy: number, rx: number, ry: number, rot = -30, opacidad = 0.55): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#fff" opacity="${opacidad}"/>`;
}

/** Ojo de planta: óvalo negro con brillo blanco arriba. */
export function ojoPlanta(cx: number, cy: number, rx: number, ry: number, rot = 0): string {
  return (
    `<g transform="rotate(${rot} ${cx} ${cy})">` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#120c06"/>` +
    `<ellipse cx="${cx - rx * 0.22}" cy="${cy - ry * 0.42}" rx="${rx * 0.46}" ry="${ry * 0.3}" fill="#fff"/>` +
    `<circle cx="${cx + rx * 0.3}" cy="${cy + ry * 0.42}" r="${rx * 0.17}" fill="#fff" opacity="0.75"/>` +
    `</g>`
  );
}

/** Ojo de zombi: globo amarillento con pupila diminuta y párpado caído. `mirar` desplaza la pupila (−1..1). */
export function ojoZombi(cx: number, cy: number, r: number, mirar: [number, number] = [-0.35, 0.1], parpado = 0.3, piel: string = PALETA.piel): string {
  const px = cx + mirar[0] * r * 0.5;
  const py = cy + mirar[1] * r * 0.5;
  const yp = cy - r + parpado * 2 * r;
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f4f1d4" ${borde(TRAZO * 0.8)}/>` +
    `<circle cx="${cx + r * 0.25}" cy="${cy + r * 0.3}" r="${r * 0.7}" fill="#d9d3a6" opacity="0.5"/>` +
    `<circle cx="${px}" cy="${py}" r="${Math.max(1.3, r * 0.26)}" fill="#120c06"/>` +
    (parpado > 0
      ? `<path d="M${cx - r - 0.6},${yp} Q${cx},${yp - r * 0.25} ${cx + r + 0.6},${yp} L${cx + r + 0.6},${cy - r - 1.5} L${cx - r - 0.6},${cy - r - 1.5} Z" fill="${piel}"/>` +
        `<path d="M${cx - r},${yp} Q${cx},${yp - r * 0.25} ${cx + r},${yp}" fill="none" ${borde(TRAZO * 0.75)}/>`
      : '') +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${borde(TRAZO * 0.8)}/>`
  );
}

/**
 * Hoja desde su base (x, y), apuntando con `ang` grados (0 = a la derecha, −90 = arriba). `curva` dobla la punta.
 */
export function hoja(x: number, y: number, largo: number, ancho: number, ang: number, relleno: string, nervio: string | null = PALETA.verdeHondo, curva = 0): string {
  const L = largo, W = ancho;
  const cy = curva * L * 0.25;
  const d = `M0,0 C${L * 0.25},${-W * 1.05} ${L * 0.7},${-W * 0.8 + cy} ${L},${cy} C${L * 0.7},${W * 0.7 + cy} ${L * 0.25},${W * 0.95} 0,0 Z`;
  return (
    `<g transform="translate(${x} ${y}) rotate(${ang})">` +
    `<path d="${d}" fill="${relleno}" ${borde()}/>` +
    (nervio ? `<path d="M${L * 0.08},0 Q${L * 0.5},${cy * 0.4 - W * 0.08} ${L * 0.86},${cy * 0.9}" fill="none" stroke="${nervio}" stroke-width="1.3" stroke-linecap="round" opacity="0.55"/>` : '') +
    `<path d="M${L * 0.22},${-W * 0.42} Q${L * 0.45},${-W * 0.62} ${L * 0.66},${-W * 0.42 + cy * 0.5}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.35"/>` +
    `</g>`
  );
}

/** Tallo: trazo grueso con contorno y una línea de brillo. */
export function tallo(d: string, grosor: number, color: string = PALETA.tallo, claro: string = PALETA.hojaClara): string {
  return (
    `<path d="${d}" fill="none" stroke="${TINTA}" stroke-width="${grosor + TRAZO * 2}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${claro}" stroke-width="${grosor * 0.28}" stroke-linecap="round" opacity="0.55" transform="translate(${-grosor * 0.22} 0)"/>`
  );
}

/** Roseta de hojas en la base de una planta (vista de lado, como en PvZ). */
export function rosetaHojas(cx: number, cy: number, tam = 1, claro: string = PALETA.hoja, oscuro: string = PALETA.verdeOscuro): string {
  const s = tam;
  return (
    hoja(cx - 2 * s, cy - 1, 26 * s, 7 * s, 168, oscuro, PALETA.verdeHondo, -0.6) +
    hoja(cx + 2 * s, cy - 1, 26 * s, 7 * s, 12, oscuro, PALETA.verdeHondo, 0.6) +
    hoja(cx - 1 * s, cy, 22 * s, 7.5 * s, 196, claro, PALETA.verdeHondo, -0.4) +
    hoja(cx + 1 * s, cy, 23 * s, 7.5 * s, -14, claro, PALETA.verdeHondo, 0.4)
  );
}

/** Dientes en fila: triángulos con contorno fino entre (x0, y) y (x1, y); `alto` > 0 hacia abajo. */
export function dientes(x0: number, x1: number, y: number, n: number, alto: number, color: string = PALETA.diente): string {
  let s = '';
  const paso = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * paso;
    s += `<path d="M${a},${y} L${a + paso / 2},${y + alto} L${a + paso},${y} Z" fill="${color}" ${borde(1.3)}/>`;
  }
  return s;
}

/** Envuelve un fragmento SVG con una transformación. */
export function grupo(svg: string, transform: string): string {
  return `<g transform="${transform}">${svg}</g>`;
}

// ---------------------------------------------------------------------------------------------------------------
// Ayudantes de animación

/** Seno de una fase con semilla (desfase propio de cada entidad). */
export function onda(t: number, frecuencia: number, semilla = 0, desfase = 0): number {
  return Math.sin(t * frecuencia * Math.PI * 2 + (semilla % 997) * 0.731 + desfase);
}

export function suave(x: number): number {
  const v = Math.min(1, Math.max(0, x));
  return v * v * (3 - 2 * v);
}

/** Tramo 0..1 de `x` entre a y b. */
export function tramo(x: number, a: number, b: number): number {
  return Math.min(1, Math.max(0, (x - a) / (b - a)));
}

export function mezclar(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

/** Junta varias poses (las últimas mandan; rot, x e y se suman). */
export function sumarPoses(...poses: Pose[]): Pose {
  const r: Pose = {};
  for (const p of poses)
    for (const [k, v] of Object.entries(p)) {
      const a: PosePieza = r[k] ?? {};
      r[k] = {
        ...a,
        ...v,
        rot: (a.rot ?? 0) + (v.rot ?? 0) || undefined,
        x: (a.x ?? 0) + (v.x ?? 0) || undefined,
        y: (a.y ?? 0) + (v.y ?? 0) || undefined,
      };
    }
  return r;
}

// ---------------------------------------------------------------------------------------------------------------
// Zombi base

export interface OpcionesZombi {
  /** Prefijo de los ids de degradados (único por personaje). */
  id: string;
  piel?: string;
  pielClara?: string;
  pielOscura?: string;
  saco?: string;
  sacoClaro?: string;
  sacoOscuro?: string;
  camisa?: string;
  corbata?: string | null;
  pantalon?: string;
  pantalonOscuro?: string;
  zapato?: string;
  /** Mechones: 'pocos' (el clásico), 'ninguno' o un SVG propio para el pelo. */
  pelo?: 'pocos' | 'ninguno' | string;
  /** Reemplaza el SVG de piezas concretas (id → svg) para trajes distintos. */
  reemplazos?: Partial<Record<PiezaZombi, string>>;
  /** Variantes extra de piezas base (id → {variante: svg}). */
  variantesExtra?: Partial<Record<PiezaZombi, Record<string, string>>>;
}

export type PiezaZombi =
  | 'sombra' | 'pierna_der' | 'zapato_der' | 'brazo_der' | 'antebrazo_der' | 'mano_der'
  | 'pierna_izq' | 'zapato_izq' | 'cuerpo' | 'corbata' | 'boca' | 'mandibula' | 'cabeza'
  | 'brazo_izq' | 'antebrazo_izq' | 'mano_izq';

/** Marco del zombi base: ancho, alto, ancla (pies en el suelo). Mira a la IZQUIERDA. */
export const MARCO_ZOMBI = { ancho: 120, alto: 150, ancla: [62, 143] as [number, number] };

/** Puntos de articulación del esqueleto del zombi base (marco local). */
export const HUESOS_ZOMBI = {
  cadera: [63, 100] as [number, number],
  cuello: [55, 62] as [number, number],
  mandibula: [55, 53] as [number, number],
  hombroIzq: [55, 69] as [number, number],
  codoIzq: [55, 88] as [number, number],
  munecaIzq: [55, 105] as [number, number],
  hombroDer: [72, 69] as [number, number],
  codoDer: [72, 88] as [number, number],
  munecaDer: [72, 105] as [number, number],
  caderaIzq: [57, 100] as [number, number],
  caderaDer: [69, 100] as [number, number],
};

/** Manga de saco colgando entre (x, y0) y (x, y1), con puño rasgado opcional. */
function manga(x: number, y0: number, y1: number, ancho: number, relleno: string, oscuro: string, rasgada: boolean, hombro: boolean): string {
  const a = ancho / 2;
  const top = hombro
    ? `M${x - a},${y0 + 3} C${x - a},${y0 - 3} ${x + a},${y0 - 3} ${x + a},${y0 + 3}`
    : `M${x - a},${y0} L${x + a},${y0}`;
  const fondo = rasgada
    ? `L${x + a - 0.6},${y1 - 1} L${x + a * 0.45},${y1 + 2.2} L${x},${y1 - 0.4} L${x - a * 0.45},${y1 + 2.4} L${x - a + 0.6},${y1 - 0.6}`
    : `L${x + a - 0.6},${y1} L${x - a + 0.6},${y1}`;
  return (
    `<path d="${top} ${fondo} Z" fill="${relleno}" ${borde()}/>` +
    `<path d="M${x + a * 0.35},${y0 + 4} L${x + a * 0.3},${y1 - 3}" stroke="${oscuro}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`
  );
}

/** Mano de zombi colgando desde la muñeca (x, y): palma y dedos largos hacia abajo y al frente. */
export function manoZombi(x: number, y: number, piel: string, oscura: string): string {
  return (
    `<path d="M${x - 4.5},${y - 1} C${x - 6},${y + 4} ${x - 6.5},${y + 9} ${x - 5},${y + 13} L${x - 3},${y + 16} L${x - 1.6},${y + 12} L${x},${y + 16.5} L${x + 1.5},${y + 11.5} L${x + 3.4},${y + 14.5} L${x + 4},${y + 9} C${x + 5},${y + 6} ${x + 5},${y + 2} ${x + 4},${y - 1} Z" fill="${piel}" ${borde(TRAZO * 0.85)}/>` +
    `<path d="M${x - 7},${y + 5} C${x - 9},${y + 7} ${x - 9},${y + 10} ${x - 7.5},${y + 11}" fill="none" ${borde(TRAZO * 0.8)}/>` +
    `<path d="M${x - 2},${y + 2} L${x - 1.5},${y + 9}" stroke="${oscura}" stroke-width="1.2" opacity="0.6"/>`
  );
}

/** Hueso a la vista cuando el antebrazo ya cayó. */
function hueso(x: number, y: number): string {
  return (
    `<path d="M${x - 1.6},${y - 2} L${x - 1.4},${y + 7} M${x + 1.6},${y - 2} L${x + 1.4},${y + 7}" stroke="${TINTA}" stroke-width="5.6" stroke-linecap="round"/>` +
    `<path d="M${x},${y - 2} L${x},${y + 7}" stroke="${PALETA.hueso}" stroke-width="4.2" stroke-linecap="round"/>` +
    `<circle cx="${x - 1.8}" cy="${y + 8}" r="2.6" fill="${PALETA.hueso}" ${borde(1.4)}/><circle cx="${x + 1.8}" cy="${y + 8}" r="2.6" fill="${PALETA.hueso}" ${borde(1.4)}/>`
  );
}

/** Pierna de pantalón (de la cadera al tobillo) con remiendo opcional. */
function pierna(x: number, y0: number, y1: number, relleno: string, oscuro: string, remiendo: boolean): string {
  return (
    `<path d="M${x - 7},${y0 - 4} L${x + 7},${y0 - 4} L${x + 6},${y1} L${x + 3},${y1 + 1.6} L${x},${y1 - 0.5} L${x - 3},${y1 + 1.5} L${x - 6.2},${y1} Z" fill="${relleno}" ${borde()}/>` +
    `<path d="M${x + 3},${y0} L${x + 2.5},${y1 - 4}" stroke="${oscuro}" stroke-width="2" opacity="0.55"/>` +
    (remiendo ? `<path d="M${x - 5},${y0 + 14} l7,-1 l0.6,7 l-7,1 Z" fill="${oscuro}" ${borde(1.2)} opacity="0.9"/>` : '')
  );
}

/** Zapato que apunta a la izquierda, con el tobillo en (x, y). */
function zapato(x: number, y: number, color: string): string {
  return (
    `<path d="M${x + 6},${y - 3} C${x + 7},${y + 2} ${x + 7},${y + 6} ${x + 6},${y + 8} L${x - 13},${y + 8} C${x - 16},${y + 8} ${x - 16},${y + 3} ${x - 12},${y + 1} C${x - 7},${y} ${x - 5},${y - 2} ${x - 5},${y - 3} Z" fill="${color}" ${borde()}/>` +
    `<path d="M${x - 11},${y + 2.5} Q${x - 8},${y + 1} ${x - 5},${y + 2}" stroke="#fff" stroke-width="1.4" opacity="0.25" fill="none"/>`
  );
}

/** Cabeza calva del zombi clásico (sin mandíbula), mirando a la izquierda. */
export function cabezaZombi(id: string, piel: string, pielClara: string, pielOscura: string, pelo: string, ojos = true): string {
  const cabeza =
    'M60,58 C72,55 77,40 73,26 C69,12 54,6 41,9 C29,12 22,23 23,35 C23,41 25,45 27,48 C26,50 27,52 29,52 C38,54 48,54 56,58 Z';
  return (
    // cuello por detrás (lo tapa la cabeza)
    `<path d="${cabeza}" fill="url(#${id}-piel)" ${borde()}/>` +
    // sombra del lado de atrás
    `<path d="M70,22 C77,36 73,52 60,57 C66,48 70,36 66,22 Z" fill="${pielOscura}" opacity="0.55"/>` +
    // oreja
    `<path d="M66,34 C72,32 74,40 71,44 C69,47 66,46 65,44" fill="${piel}" ${borde(TRAZO * 0.85)}/>` +
    `<path d="M68,37 C70,38 70,41 68,42" fill="none" stroke="${pielOscura}" stroke-width="1.3"/>` +
    // frente y cejas caídas
    `<path d="M27,25 Q34,20 41,23" fill="none" stroke="${pielOscura}" stroke-width="1.6" opacity="0.7"/>` +
    (ojos
      ? ojoZombi(31.5, 32.5, 5.6, [-0.5, 0.2], 0.32, piel) + ojoZombi(46, 30.5, 8.4, [-0.55, 0.15], 0.26, piel) +
        // ojeras
        `<path d="M40,40 Q46,43 53,39" fill="none" stroke="${pielOscura}" stroke-width="1.6" opacity="0.75"/>` +
        `<path d="M27,39 Q31,41 35,39" fill="none" stroke="${pielOscura}" stroke-width="1.4" opacity="0.7"/>`
      : '') +
    // nariz
    `<path d="M27,37 C23,40 22,44 25,46 C27,47 29,46 30,45" fill="${pielClara}" ${borde(TRAZO * 0.8)}/>` +
    // labio de arriba con dientes torcidos
    dientes(31, 45, 51, 3, 4.6) +
    `<path d="M28.5,50.5 C35,53 44,53 50,52" fill="none" ${borde(TRAZO * 0.9)}/>` +
    // brillo de la calva
    brillo(39, 15, 9, 3.4, -12, 0.35) +
    pelo
  );
}

const PELO_POCOS =
  `<path d="M48,9 C47,4 50,1 53,0" fill="none" ${borde(1.6)}/>` +
  `<path d="M54,9.5 C55,5 59,3 61,4" fill="none" ${borde(1.6)}/>` +
  `<path d="M42,10 C40,6 41,3 43,1.5" fill="none" ${borde(1.5)}/>`;

/**
 * Piezas del zombi clásico de PvZ (cabeza calva con pocos pelos, mandíbula con dientes, piel gris verdosa, camisa
 * blanca, saco café, corbata roja, pantalón remendado, zapatos, brazos en 2 segmentos + mano y piernas). Mira a la
 * izquierda; el brazo IZQUIERDO es el cercano (el que se cae). Devuelve también los <defs> de sus degradados.
 */
export function zombiBase(op: OpcionesZombi): { piezas: DefPieza[]; defs: string } {
  const id = op.id;
  const piel = op.piel ?? PALETA.piel;
  const pielClara = op.pielClara ?? PALETA.pielClara;
  const pielOscura = op.pielOscura ?? PALETA.pielOscura;
  const saco = op.saco ?? PALETA.saco;
  const sacoClaro = op.sacoClaro ?? PALETA.sacoClaro;
  const sacoOscuro = op.sacoOscuro ?? PALETA.sacoOscuro;
  const camisa = op.camisa ?? PALETA.camisa;
  const corbata = op.corbata === undefined ? PALETA.corbata : op.corbata;
  const pantalon = op.pantalon ?? PALETA.pantalon;
  const pantalonOscuro = op.pantalonOscuro ?? PALETA.pantalonOscuro;
  const zap = op.zapato ?? PALETA.zapato;
  const pelo = op.pelo === undefined || op.pelo === 'pocos' ? PELO_POCOS : op.pelo === 'ninguno' ? '' : op.pelo;
  const H = HUESOS_ZOMBI;

  const defs =
    volumen(`${id}-piel`, pielClara, piel, pielOscura, 0.3, 0.25) +
    lineal(`${id}-saco`, [[0, sacoClaro], [0.55, saco], [1, sacoOscuro]], 0, 0, 1, 0.4) +
    lineal(`${id}-mandibula`, [[0, piel], [1, pielOscura]]);

  const cuerpo =
    // cuello (queda a la vista si se cae la cabeza)
    `<path d="M49,56 L61,56 L62,68 L49,68 Z" fill="${pielOscura}" ${borde()}/>` +
    `<ellipse cx="55.5" cy="57.5" rx="6" ry="2.4" fill="#5e1f1a" ${borde(1.4)}/>` +
    // saco
    `<path d="M45,67 C52,62 70,62 79,66 C83,74 84,90 85,105 L80,103 L76,108 L70,104 L63,109 L57,104 L51,108 L46,104 L43,106 C42,92 42,76 45,67 Z" fill="url(#${id}-saco)" ${borde()}/>` +
    // camisa blanca por el frente
    `<path d="M45.5,67 L58,65 L57,94 L51,101 L46,100 C44,88 44,76 45.5,67 Z" fill="${camisa}" ${borde(TRAZO * 0.9)}/>` +
    `<path d="M47,90 L56,88 M46.5,80 L57,79" stroke="${PALETA.camisaSombra}" stroke-width="1.3"/>` +
    // solapa
    `<path d="M58,65 L63,66 L58,84 L57,94 Z" fill="${sacoOscuro}" ${borde(TRAZO * 0.8)}/>` +
    // cuello de la camisa
    `<path d="M47,64 L53,63 L50,70 Z M53,63 L59,64 L56,70 Z" fill="${camisa}" ${borde(1.6)}/>` +
    // bolsillo, botón y remiendo
    `<path d="M66,88 L77,87" stroke="${sacoOscuro}" stroke-width="2"/>` +
    `<circle cx="60" cy="96" r="1.6" fill="${sacoOscuro}"/>` +
    `<path d="M71,74 l6,-0.5 l0.3,6 l-6,0.6 Z" fill="${sacoClaro}" ${borde(1.2)}/>` +
    `<path d="M80,84 Q82,92 80,100" stroke="${sacoOscuro}" stroke-width="2" fill="none" opacity="0.7"/>`;

  const corbataSvg = corbata
    ? `<path d="M50,66 L55,66 L54,70 L56.5,88 L52.5,93 L49,88 L51,70 Z" fill="${corbata}" ${borde(TRAZO * 0.85)}/>` +
      `<path d="M52.5,72 L53.5,86" stroke="${PALETA.corbataOscura}" stroke-width="1.4" opacity="0.6"/>`
    : '';

  const mandibula =
    `<path d="M28,49 C27,56 30,63 38,64.5 C47,65.5 55,62 59,56 L58,52 C49,53 39,52 28,49 Z" fill="url(#${id}-mandibula)" ${borde()}/>` +
    dientes(34, 44, 52.5, 2, -3.8) +
    `<path d="M34,60 Q40,62 47,60" fill="none" stroke="${pielOscura}" stroke-width="1.4" opacity="0.7"/>`;

  const boca = `<path d="M29,50 C33,58 47,60 57,55 L56,51 C47,53 38,53 29,50 Z" fill="${PALETA.bocaZombi}"/>`;

  const brazoDer = manga(H.hombroDer[0], H.hombroDer[1] - 4, H.codoDer[1] + 1, 11, sacoOscuro, '#2f1d0e', false, true);
  const antebrazoDer = manga(H.codoDer[0], H.codoDer[1] - 2, H.munecaDer[1] + 1, 9.5, sacoOscuro, '#2f1d0e', true, false);
  const manoDer = manoZombi(H.munecaDer[0], H.munecaDer[1], pielOscura, '#4f5a40');
  const brazoIzq = manga(H.hombroIzq[0], H.hombroIzq[1] - 4, H.codoIzq[1] + 1, 11.5, `url(#${id}-saco)`, sacoOscuro, false, true);
  const brazoIzqRoto =
    hueso(H.codoIzq[0], H.codoIzq[1] - 2) + manga(H.hombroIzq[0], H.hombroIzq[1] - 4, H.codoIzq[1] - 2, 11.5, `url(#${id}-saco)`, sacoOscuro, true, true);
  const antebrazoIzq = manga(H.codoIzq[0], H.codoIzq[1] - 2, H.munecaIzq[1] + 1, 10, `url(#${id}-saco)`, sacoOscuro, true, false);
  const manoIzq = manoZombi(H.munecaIzq[0], H.munecaIzq[1], piel, pielOscura);

  const R = op.reemplazos ?? {};
  const V = op.variantesExtra ?? {};
  const p = (pz: Omit<DefPieza, 'svg'> & { svg: string }): DefPieza => {
    const k = pz.id as PiezaZombi;
    const estados = { ...(pz.estados ?? {}), ...(V[k] ?? {}) };
    return { ...pz, svg: R[k] ?? pz.svg, estados: Object.keys(estados).length ? estados : undefined };
  };

  const piezas: DefPieza[] = [
    p({ id: 'sombra', svg: sombra(60, 142, 32, 7), pivote: [60, 142], z: -10, sinTinte: true }),
    p({ id: 'brazo_der', svg: brazoDer, pivote: H.hombroDer, padre: 'cuerpo', z: 0 }),
    p({ id: 'antebrazo_der', svg: antebrazoDer, pivote: H.codoDer, padre: 'brazo_der', z: 0.1 }),
    p({ id: 'mano_der', svg: manoDer, pivote: H.munecaDer, padre: 'antebrazo_der', z: 0.2 }),
    p({ id: 'pierna_der', svg: pierna(H.caderaDer[0], H.caderaDer[1], 136, pantalonOscuro, '#2a2018', false), pivote: H.caderaDer, z: 1 }),
    p({ id: 'zapato_der', svg: zapato(H.caderaDer[0], 136, zap), pivote: [H.caderaDer[0], 136], padre: 'pierna_der', z: 1.1 }),
    p({ id: 'pierna_izq', svg: pierna(H.caderaIzq[0], H.caderaIzq[1], 136, pantalon, pantalonOscuro, true), pivote: H.caderaIzq, z: 2 }),
    p({ id: 'zapato_izq', svg: zapato(H.caderaIzq[0], 136, zap), pivote: [H.caderaIzq[0], 136], padre: 'pierna_izq', z: 2.1 }),
    p({ id: 'cuerpo', svg: cuerpo, pivote: H.cadera, z: 5 }),
    p({ id: 'corbata', svg: corbataSvg, pivote: [52.5, 66], padre: 'cuerpo', z: 6 }),
    p({ id: 'cabeza', svg: cabezaZombi(id, piel, pielClara, pielOscura, pelo), pivote: H.cuello, padre: 'cuerpo', z: 10 }),
    p({ id: 'boca', svg: boca, pivote: H.mandibula, padre: 'cabeza', z: 8 }),
    p({ id: 'mandibula', svg: mandibula, pivote: H.mandibula, padre: 'cabeza', z: 9 }),
    p({ id: 'brazo_izq', svg: brazoIzq, pivote: H.hombroIzq, padre: 'cuerpo', z: 12, estados: { roto: brazoIzqRoto } }),
    p({ id: 'antebrazo_izq', svg: antebrazoIzq, pivote: H.codoIzq, padre: 'brazo_izq', z: 12.1 }),
    p({ id: 'mano_izq', svg: manoIzq, pivote: H.munecaIzq, padre: 'antebrazo_izq', z: 12.2 }),
  ];
  return { piezas, defs };
}

/** Pérdidas del zombi base: el antebrazo cercano (queda el hueso) y la cabeza (con todo lo que lleve encima). */
export const PERDIDAS_ZOMBI = {
  brazo: { ocultar: ['antebrazo_izq'], variantes: { brazo_izq: 'roto' } },
  cabeza: { ocultar: ['cabeza'] },
};

export interface OpcionesAnimZombi {
  /** Segundos por ciclo de dos pasos a velocidad normal. */
  ciclo?: number;
  /** Amplitud del paso (grados de la pierna). */
  paso?: number;
  /** Inclinación del cuerpo hacia delante (grados, negativo = hacia la izquierda). */
  inclinacion?: number;
}

/**
 * Animación base del zombi. Estados: 'camina', 'quieto', 'come', 'muere' (fase), 'sincabeza', 'ceniza' (fase: se
 * deshace), 'congelado' (pose quieta). Devuelve la pose de las piezas de `zombiBase`.
 */
export function animZombi(c: CtxAnim, op: OpcionesAnimZombi = {}): Pose {
  const s = c.semilla;
  const vel = c.vel ?? 1;
  const ciclo = op.ciclo ?? 2.3;
  const amp = op.paso ?? 17;
  const incl = op.inclinacion ?? -7;
  const t = c.t * vel;
  const ph = (t / ciclo) * Math.PI * 2 + (s % 997) * 0.731;
  const sn = Math.sin(ph);
  const cs = Math.cos(ph);
  const idle = Math.sin(c.t * 1.9 + s);

  if (c.estado === 'come') {
    const k = (c.t * vel) / 0.85 + (s % 13) * 0.17;
    const m = Math.sin(k * Math.PI * 2);
    const muerde = Math.max(0, m);
    return {
      cuerpo: { rot: incl - 5 + m * 2.5, y: muerde * 1.2 },
      cabeza: { rot: 6 + muerde * 12 - Math.max(0, -m) * 4, x: -muerde * 2 },
      mandibula: { rot: -3 - Math.max(0, -m) * 22 },
      corbata: { rot: m * 6 },
      brazo_izq: { rot: 78 + m * 9 },
      antebrazo_izq: { rot: 22 - m * 12 },
      mano_izq: { rot: 10 + m * 10 },
      brazo_der: { rot: 70 - m * 8 },
      antebrazo_der: { rot: 26 + m * 10 },
      mano_der: { rot: 6 },
      pierna_izq: { rot: 9 },
      zapato_izq: { rot: -9 },
      pierna_der: { rot: -6 },
      zapato_der: { rot: 6 },
    };
  }

  if (c.estado === 'muere') {
    // Cae de frente (hacia la izquierda), rebota un poco y se desvanece.
    const f = c.fase;
    const caida = Math.pow(tramo(f, 0, 0.55), 1.8);
    const rebote = Math.sin(tramo(f, 0.55, 0.75) * Math.PI) * 6;
    const giro = -86 * caida + rebote;
    return {
      _raiz: { rot: giro, y: 0, alfa: 1 - tramo(f, 0.8, 1) },
      cuerpo: { rot: incl * (1 - caida) },
      cabeza: { rot: 10 * caida },
      mandibula: { rot: -14 * caida },
      brazo_izq: { rot: 40 + 60 * caida },
      antebrazo_izq: { rot: 10 + 20 * caida },
      brazo_der: { rot: 30 + 70 * caida },
      antebrazo_der: { rot: 10 + 15 * caida },
      pierna_izq: { rot: 14 * caida },
      pierna_der: { rot: -6 * caida },
      sombra: { sx: 1 + caida * 0.6, alfa: 1 - caida * 0.4 },
    };
  }

  if (c.estado === 'ceniza') {
    // Silueta tiesa que se desmorona: con fase > 0.35 cada pieza baja y se desvanece.
    const f = tramo(c.fase, 0.35, 1);
    const caer = (k: number): PosePieza => ({ y: f * f * (20 + k * 9), alfa: 1 - tramo(c.fase, 0.5 + k * 0.05, 1), sx: 1 + f * 0.05 * k });
    return {
      cuerpo: { ...caer(1), rot: incl },
      cabeza: { ...caer(2), rot: 4 },
      mandibula: { rot: -6 },
      brazo_izq: { ...caer(3), rot: 55 },
      antebrazo_izq: { rot: 18 },
      brazo_der: { ...caer(3), rot: 48 },
      antebrazo_der: { rot: 20 },
      pierna_izq: { ...caer(0), rot: 8 },
      pierna_der: { ...caer(0), rot: -8 },
      sombra: { alfa: 1 - f },
    };
  }

  if (c.estado === 'sincabeza') {
    // Tambalea sin rumbo agitando el puño.
    const w = Math.sin(ph * 0.8);
    return {
      _raiz: { rot: w * 4 },
      cuerpo: { rot: incl + w * 6 + Math.sin(ph * 1.7) * 3, y: -Math.abs(cs) * 2 },
      corbata: { rot: Math.sin(ph * 2) * 12 },
      brazo_izq: { rot: 110 + Math.sin(ph * 2.6) * 30 },
      antebrazo_izq: { rot: 40 + Math.sin(ph * 2.6 + 1) * 25 },
      mano_izq: { rot: 20 },
      brazo_der: { rot: 25 + Math.sin(ph * 1.3) * 18 },
      antebrazo_der: { rot: 15 },
      pierna_izq: { rot: sn * amp * 0.7 },
      zapato_izq: { rot: -sn * amp * 0.4 },
      pierna_der: { rot: -sn * amp * 0.7 },
      zapato_der: { rot: sn * amp * 0.4 },
    };
  }

  if (c.estado === 'quieto' || c.estado === 'congelado') {
    const k = c.estado === 'congelado' ? 0 : 1;
    return {
      cuerpo: { rot: incl + idle * 2 * k, y: Math.sin(c.t * 1.3 + s) * 0.8 * k },
      cabeza: { rot: 3 + Math.sin(c.t * 1.1 + s * 2) * 4 * k },
      mandibula: { rot: -3 - Math.max(0, Math.sin(c.t * 2.1 + s)) * 7 * k },
      corbata: { rot: idle * 3 * k },
      brazo_izq: { rot: 38 + Math.sin(c.t * 1.5 + s) * 5 * k },
      antebrazo_izq: { rot: 14 + Math.sin(c.t * 1.5 + s + 0.6) * 5 * k },
      mano_izq: { rot: 8 },
      brazo_der: { rot: 30 + Math.sin(c.t * 1.4 + s + 1) * 5 * k },
      antebrazo_der: { rot: 16 },
      pierna_izq: { rot: 4 },
      zapato_izq: { rot: -4 },
      pierna_der: { rot: -3 },
      zapato_der: { rot: 3 },
    };
  }

  // 'camina' (y cualquier estado desconocido): balanceo torpe, pasos y brazos estirados al frente.
  const pasoIzq = sn * amp;
  const pasoDer = -sn * amp;
  return {
    _raiz: { y: -Math.abs(sn) * 1.2 },
    cuerpo: { rot: incl + cs * 3.2, y: -Math.abs(cs) * 2.6, x: sn * 1.2 },
    cabeza: { rot: 4 + Math.sin(ph + 0.9) * 6, y: Math.abs(cs) * 0.8 },
    mandibula: { rot: -4 - Math.max(0, Math.sin(ph * 2 + 1)) * 8 },
    corbata: { rot: Math.sin(ph + 1.2) * 8 },
    brazo_izq: { rot: 58 + sn * 9 },
    antebrazo_izq: { rot: 18 + Math.sin(ph + 0.6) * 9 },
    mano_izq: { rot: 14 + Math.sin(ph + 1) * 6 },
    brazo_der: { rot: 52 - sn * 9 },
    antebrazo_der: { rot: 20 - Math.sin(ph + 0.6) * 8 },
    mano_der: { rot: 10 },
    pierna_izq: { rot: pasoIzq },
    zapato_izq: { rot: -pasoIzq * 0.75 + Math.max(0, -sn) * -8 },
    pierna_der: { rot: pasoDer },
    zapato_der: { rot: -pasoDer * 0.75 + Math.max(0, sn) * -8 },
    sombra: { sx: 1 + Math.abs(sn) * 0.08 },
  };
}
