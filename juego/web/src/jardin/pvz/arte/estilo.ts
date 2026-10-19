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
      if (!v) continue;
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

/** Manga de saco colgando entre (x, y0) y (x, y1): se ensancha en el codo, con arrugas y el puño rasgado opcional. */
function manga(x: number, y0: number, y1: number, ancho: number, relleno: string, oscuro: string, rasgada: boolean, hombro: boolean): string {
  const a = ancho / 2;
  const m = (y0 + y1) / 2;
  const arriba = hombro ? `M${x - a},${y0 + 4} C${x - a},${y0 - 3.5} ${x + a},${y0 - 3.5} ${x + a},${y0 + 4}` : `M${x - a},${y0} L${x + a},${y0}`;
  const abajo = rasgada
    ? `Q${x + a * 0.75},${y1 + 3.5} ${x + a * 0.3},${y1 + 0.2} Q${x},${y1 + 4.5} ${x - a * 0.35},${y1 + 0.6} Q${x - a * 0.8},${y1 + 3.2} ${x - a + 0.8},${y1 - 0.3}`
    : `Q${x},${y1 + 1.8} ${x - a + 0.8},${y1}`;
  return (
    `<path d="${arriba} C${x + a + 0.8},${m - 4} ${x + a + 0.2},${y1 - 6} ${x + a - 0.8},${y1} ${abajo} C${x - a - 0.6},${y1 - 6} ${x - a + 0.6},${m - 2} ${x - a},${y0 + 4} Z" fill="${relleno}" ${borde()}/>` +
    `<path d="M${x + a * 0.2},${y0 + 3} C${x + a + 0.5},${m - 6} ${x + a * 0.6},${y1 - 7} ${x + a - 1},${y1 - 1} Q${x + a * 0.2},${y1 - 2} ${x + a * 0.1},${y1 - 6} Z" fill="${oscuro}" opacity="0.45"/>` +
    `<path d="M${x - a + 1.2},${m - 1} q${a * 0.9},${3} ${a * 1.7},${0.4} M${x - a + 1.6},${m + 2.4} q${a * 0.8},${2} ${a * 1.5},${0.2}" fill="none" stroke="${oscuro}" stroke-width="1.15" stroke-linecap="round" opacity="0.7"/>` +
    `<path d="M${x - a + 1.4},${y0 + 5} C${x - a + 1.2},${m - 4} ${x - a + 1.6},${m} ${x - a + 2},${m + 2}" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.18"/>`
  );
}

/** Mano gris colgando, gordita: palma, cuatro dedos redondeados con nudillos, pulgar y uñas negras. */
export function manoZombi(x: number, y: number, piel: string, oscura: string): string {
  const dedos = [[-4.5, 14.5], [-1.4, 17.2], [1.8, 16.5], [4.6, 13]];
  return (
    `<path d="M${x - 5.2},${y - 1} C${x - 7.2},${y + 4} ${x - 7.6},${y + 9} ${x - 6.2},${y + 13} C${x - 5.5},${y + 16.5} ${x - 2.6},${y + 16.8} ${x - 2},${y + 13.4} C${x - 1.8},${y + 17.4} ${x + 1.2},${y + 18} ${x + 1.8},${y + 14.2} C${x + 2.4},${y + 17.2} ${x + 5.4},${y + 16.8} ${x + 5.2},${y + 12.6} C${x + 6.8},${y + 8.5} ${x + 6.4},${y + 3} ${x + 4.8},${y - 1} Z" fill="${piel}" ${borde(TRAZO * 0.85)}/>` +
    `<path d="M${x - 7},${y + 4} C${x - 11},${y + 5.5} ${x - 11.6},${y + 10.5} ${x - 8.4},${y + 12} C${x - 6.6},${y + 12.6} ${x - 5.4},${y + 10} ${x - 6},${y + 8}" fill="${piel}" ${borde(TRAZO * 0.8)}/>` +
    `<path d="M${x + 3},${y + 1} C${x + 6.4},${y + 5} ${x + 6.4},${y + 11} ${x + 5.2},${y + 12.6} C${x + 4.6},${y + 8} ${x + 3.4},${y + 4} ${x + 1},${y + 1} Z" fill="${oscura}" opacity="0.5"/>` +
    `<path d="M${x - 2.2},${y + 8} L${x - 2.1},${y + 13} M${x + 1.5},${y + 8} L${x + 1.6},${y + 13.6}" stroke="${oscura}" stroke-width="1.1" stroke-linecap="round" opacity="0.75"/>` +
    dedos.map(([dx, dy]) => `<ellipse cx="${x + dx}" cy="${y + dy}" rx="1.5" ry="1" fill="#3f4a35"/>`).join('') +
    `<path d="M${x - 3.6},${y + 2.2} q1,-1.6 2.6,-0.6 M${x + 0.6},${y + 1.8} q1.2,-1.6 2.6,-0.4" fill="none" stroke="${oscura}" stroke-width="1" opacity="0.55"/>`
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

/** Pierna de pantalón (de la cadera al tobillo): ancha, con el dobladillo deshilachado, pliegues y remiendo cosido. */
function pierna(x: number, y0: number, y1: number, relleno: string, oscuro: string, remiendo: boolean): string {
  const rod = y0 + (y1 - y0) * 0.55;
  return (
    `<path d="M${x - 7.6},${y0 - 4} C${x - 8.4},${y0 + 10} ${x - 7.4},${y1 - 14} ${x - 6.8},${y1 - 2} C${x - 8.6},${y1 + 0.6} ${x - 7.2},${y1 + 3.4} ${x - 4.4},${y1 + 1.4} C${x - 3.2},${y1 + 3.8} ${x - 0.4},${y1 + 3.2} ${x + 0.8},${y1 + 0.6} C${x + 2.8},${y1 + 3.4} ${x + 6},${y1 + 2.4} ${x + 6.6},${y1 - 2} C${x + 7.2},${y1 - 14} ${x + 8.4},${y0 + 8} ${x + 7.6},${y0 - 4} Z" fill="${relleno}" ${borde()}/>` +
    `<path d="M${x + 2.6},${y0 - 2} C${x + 4},${y0 + 14} ${x + 4.4},${y1 - 12} ${x + 6},${y1 - 1} L${x + 6.6},${y1 - 2} C${x + 7.2},${y1 - 14} ${x + 8.4},${y0 + 8} ${x + 7.6},${y0 - 4} Z" fill="${oscuro}" opacity="0.5"/>` +
    `<path d="M${x - 6},${rod} q6,2.6 12,0 M${x - 5.2},${rod + 3} q5,1.6 10,0" fill="none" stroke="${oscuro}" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>` +
    (remiendo
      ? `<path d="M${x - 6},${y0 + 13} Q${x - 0.5},${y0 + 11.6} ${x + 4.6},${y0 + 13} Q${x + 5.6},${y0 + 18} ${x + 4.4},${y0 + 21.6} Q${x - 0.5},${y0 + 23} ${x - 5.6},${y0 + 21.6} Q${x - 6.8},${y0 + 17} ${x - 6},${y0 + 13} Z" fill="#9b7a45" ${borde(1.5)}/>` +
        `<path d="M${x - 4.6},${y0 + 14.6} L${x + 3.4},${y0 + 14.6} M${x - 4.6},${y0 + 20} L${x + 3.4},${y0 + 20}" stroke="#f1e6c8" stroke-width="0.9" stroke-dasharray="1.6 1.4"/>`
      : '')
  );
}

/** Bota gastada y grande, apunta a la izquierda, con el tobillo en (x, y): punta redonda, suela y cordón. */
function zapato(x: number, y: number, color: string): string {
  return (
    `<path d="M${x + 6.6},${y - 4} C${x + 8.6},${y + 1.6} ${x + 8.6},${y + 6.4} ${x + 6.8},${y + 9} L${x - 13},${y + 9} C${x - 18.4},${y + 9} ${x - 19.2},${y + 2.4} ${x - 13.4},${y + 0.2} C${x - 9},${y - 1} ${x - 6.2},${y - 2.2} ${x - 5.4},${y - 4} Z" fill="${color}" ${borde()}/>` +
    `<path d="M${x - 18.2},${y + 6.4} L${x + 7.6},${y + 6.4} L${x + 7.4},${y + 9.6} L${x - 15},${y + 9.6} C${x - 18},${y + 9.6} ${x - 19},${y + 8} ${x - 18.2},${y + 6.4} Z" fill="#2a1a0c" ${borde(1.6)}/>` +
    `<path d="M${x - 14},${y + 1.6} C${x - 11},${y - 0.4} ${x - 8},${y - 0.6} ${x - 6},${y + 0.4}" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.3"/>` +
    `<path d="M${x - 6},${y - 1} L${x - 3.4},${y + 2.4} M${x - 2.4},${y - 1.6} L${x + 0.2},${y + 2}" stroke="#d8c9a4" stroke-width="1.2" stroke-linecap="round"/>`
  );
}

/** Cabeza del zombi: cráneo grande y calvo, ceño pesado, ojos enormes y desiguales, nariz de bola y dientes chuecos. */
export function cabezaZombi(id: string, piel: string, pielClara: string, pielOscura: string, pelo: string, ojos = true): string {
  const cabeza =
    'M60,58 C72,55 79,42 76,27 C73,11 58,4 43,7 C28,10 19,22 21.5,35 C22.4,41 24,45 26.5,48 C25.4,50.6 26.6,53 29.6,53 C39,56 49,56 58,57.6 Z';
  return (
    `<path d="${cabeza}" fill="${piel}" ${borde()}/>` +
    // luz de la calva y sombra del lado de atrás (sombreado plano, como una ilustración)
    `<path d="M30,16 C36,9 48,7 56,10 C48,10 38,13 33,20 C29,24 28,29 28,34 C25,28 25,21 30,16 Z" fill="${pielClara}" opacity="0.85"/>` +
    `<path d="M71,18 C80,34 74,52 60,57.6 C68,48 72,36 66,22 Z" fill="${pielOscura}" opacity="0.6"/>` +
    // oreja
    `<path d="M65,33 C72.6,30.6 75.4,40 71.4,45 C69,47.6 65.6,46.6 64.6,43.6" fill="${piel}" ${borde(TRAZO * 0.85)}/>` +
    `<path d="M67.6,36.6 C70,37.4 70.4,41 68,42.4" fill="none" stroke="${pielOscura}" stroke-width="1.4"/>` +
    // arrugas de la frente y cicatriz cosida en la sien
    `<path d="M27,23 Q34.5,17.4 42,21.6 M30,17.6 Q35,14.6 40,16" fill="none" stroke="${pielOscura}" stroke-width="1.5" stroke-linecap="round" opacity="0.75"/>` +
    `<path d="M55,14 C59,18 62,22 62.4,28" fill="none" stroke="${TINTA}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M56.2,16.6 l3,-2 M58.4,19.6 l3.2,-1.8 M60.4,23 l3.2,-1.4 M61.6,26.6 l3,-0.8" stroke="${TINTA}" stroke-width="1.1" stroke-linecap="round"/>` +
    (ojos
      ? ojoZombi(31.5, 33, 5.8, [-0.5, 0.2], 0.32, piel) + ojoZombi(46.5, 30.6, 9, [-0.55, 0.15], 0.26, piel) +
        `<path d="M38.4,41.4 Q46.5,45.4 54.6,40.4" fill="none" stroke="${pielOscura}" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>` +
        `<path d="M26.4,40 Q31.4,42.6 36.4,40" fill="none" stroke="${pielOscura}" stroke-width="1.5" stroke-linecap="round" opacity="0.75"/>`
      : '') +
    // nariz de bola con fosa
    `<path d="M27,36.6 C21.6,39 20.6,44.4 24.6,46.6 C27.4,47.8 29.6,46.4 30.4,44.6" fill="${pielClara}" ${borde(TRAZO * 0.8)}/>` +
    `<path d="M24.2,42.6 q1.2,1 2.6,0.6" fill="none" stroke="${pielOscura}" stroke-width="1.3" stroke-linecap="round"/>` +
    // pómulo y labio con dientes chuecos
    `<path d="M41,47 Q47,50 53,48" fill="none" stroke="${pielOscura}" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>` +
    dientes(31, 45, 51, 3, 4.6) +
    `<path d="M28.4,50.4 C35,53.4 44,53.4 50.6,52" fill="none" ${borde(TRAZO * 0.9)}/>` +
    brillo(39, 14.6, 9, 3.2, -14, 0.5) +
    pelo
  );
}

const PELO_POCOS =
  `<path d="M47.6,8.4 C43,2.4 48,-3.4 54.4,-1.4 C58.4,0 58.6,4 56,6" fill="none" ${borde(1.9)}/>` +
  `<path d="M54,8.4 C56.4,3.4 61.6,2.4 64,5.6" fill="none" ${borde(1.8)}/>` +
  `<path d="M42,9 C37.4,5.4 38,-0.4 42.6,-2.6" fill="none" ${borde(1.8)}/>` +
  `<path d="M60.6,10 C65,8.4 68,10.4 68,13.4" fill="none" ${borde(1.6)}/>`;

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
    `<path d="M48.6,56 C50,60 50.4,64 49.6,68 L62,68 C61,64 61.6,60 62.4,56 Z" fill="${pielOscura}" ${borde()}/>` +
    `<ellipse cx="55.6" cy="57.4" rx="6.4" ry="2.6" fill="#5e1f1a" ${borde(1.4)}/>` +
    // saco ancho y caído, con el borde de abajo gastado
    `<path d="M45.6,66.4 C53,60.6 71,60.6 80.4,66 C86,76 88.6,92 87.4,106 C85.4,108.4 82.6,106.4 80.6,108.6 C78.4,111.6 75.6,108.4 73.4,110.6 C70.6,107.6 67.6,109.8 64.4,108.6 C62.2,111.6 58.4,108.6 56.2,110.6 C53.4,108.2 49.6,110.4 46.6,107.4 C43,100 42,90 42.8,80 C43,74 44,70 45.6,66.4 Z" fill="url(#${id}-saco)" ${borde()}/>` +
    `<path d="M79,66 C86,76 88.6,92 87.4,106 C85,108 82.6,106.4 80.6,108.6 C83,98 82,80 74,66 Z" fill="${sacoOscuro}" opacity="0.55"/>` +
    // camisa por el frente y solapas anchas
    `<path d="M46,66.4 C51,63.4 58,63 60,64.6 C60.4,78 58.4,92 55.6,101 C51.6,103.4 46.4,101.4 45,98 C43,88 43.6,76 46,66.4 Z" fill="${camisa}" ${borde(TRAZO * 0.9)}/>` +
    `<path d="M47.4,90 Q52,88.4 56.4,89.4 M46.6,80 Q52,78.6 57.4,79.4" fill="none" stroke="${PALETA.camisaSombra}" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="M58,64.4 C62.4,64.6 65.4,66 67,68.4 C64.4,78 61.4,88 59.6,98 C57,92 57.4,76 58,64.4 Z" fill="${sacoOscuro}" ${borde(TRAZO * 0.8)}/>` +
    `<path d="M47,63.6 L53.6,62.6 L50.4,70.4 Z M53.6,62.6 L60,63.6 L56.4,70.6 Z" fill="${camisa}" ${borde(1.6)}/>` +
    // bolsillo con solapa, botón, remiendo y pliegues
    `<path d="M66.4,88 Q72,86.4 77.4,87.6" fill="none" stroke="${sacoOscuro}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<circle cx="61.4" cy="96.4" r="1.8" fill="${sacoOscuro}" ${borde(0.9)}/>` +
    `<path d="M70.6,73.6 Q74.4,72.6 77.6,73.4 Q78.4,77 77.4,80 Q74,81 70.4,80 Q69.6,76.6 70.6,73.6 Z" fill="${sacoClaro}" ${borde(1.2)}/>` +
    `<path d="M74.4,74.6 L74.2,79.4" stroke="#f1e6c8" stroke-width="0.8" stroke-dasharray="1.2 1.2"/>` +
    `<path d="M80.6,84 Q83,92 80.6,100 M66,100 Q69,96 71,100" fill="none" stroke="${sacoOscuro}" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>` +
    `<path d="M47.4,72 C46,80 46.4,90 48,98" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.15"/>`;

  const corbataSvg = corbata
    ? `<path d="M49.4,65.6 C51.6,64 55.6,64 57.4,65.8 L56.2,70.4 C54.4,71.4 52.2,71.4 50.6,70.4 Z" fill="${corbata}" ${borde(TRAZO * 0.85)}/>` +
      `<path d="M50.8,70.2 L56,70.2 C57.6,78 59.6,87 57.4,93.6 C55.4,96.4 52,96.6 50,93.8 C47.8,87 49.4,78 50.8,70.2 Z" fill="${corbata}" ${borde(TRAZO * 0.85)}/>` +
      `<path d="M50.6,76 L57.2,74.2 M50.2,80.6 L58,78.6 M49.8,85.2 L58.4,83.2" stroke="#f2e8e4" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>` +
      `<path d="M55,71 C56.6,79 57.2,87 56,93" fill="none" stroke="${PALETA.corbataOscura}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>`
    : '';

  // Mandibula y boca: la boca queda abierta (un hueco oscuro) y la mandíbula baja con su fila de dientes.
  const mandibula =
    `<g transform="translate(0 4.2)">` +
    `<path d="M27.6,49 C26,57.6 30,65 39,66.4 C48,67.2 56,63.4 60,56.6 L58.6,52 C49,53.4 38,52.6 27.6,49 Z" fill="url(#${id}-mandibula)" ${borde()}/>` +
    `<path d="M33,64 C40,66.2 49,65 55.4,60.6" fill="none" stroke="${pielOscura}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>` +
    dientes(34, 44, 52.6, 2, -3.8) +
    `<path d="M31.6,52 C37,56 46,57 54,54" fill="#9a4a46" opacity="0.9"/>` +
    `</g>`;

  const boca = `<path d="M28.4,49 C30,60 48,64.6 59,58 L58,50 C48,53 38,53 28.4,49 Z" fill="${PALETA.bocaZombi}"/>`;

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
    // La sombra no gira con el cuerpo: se compensa el giro y el levantón de la raíz y se corre bajo el cuerpo caído.
    const g = (giro * Math.PI) / 180;
    const dx = -34 * caida, dy = 17 * caida;
    return {
      // Al girar sobre los pies, el pecho quedaría bajo el suelo: se levanta la figura mientras cae.
      _raiz: { rot: giro, y: -17 * caida, alfa: 1 - tramo(f, 0.8, 1) },
      cuerpo: { rot: incl * (1 - caida) },
      cabeza: { rot: 10 * caida },
      mandibula: { rot: -14 * caida },
      brazo_izq: { rot: 40 + 60 * caida },
      antebrazo_izq: { rot: 10 + 20 * caida },
      brazo_der: { rot: 30 + 70 * caida },
      antebrazo_der: { rot: 10 + 15 * caida },
      pierna_izq: { rot: 14 * caida },
      pierna_der: { rot: -6 * caida },
      sombra: { rot: -giro, x: dx * Math.cos(g) + dy * Math.sin(g), y: -dx * Math.sin(g) + dy * Math.cos(g), sx: 1 + caida * 0.9, alfa: 1 - caida * 0.4 },
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
