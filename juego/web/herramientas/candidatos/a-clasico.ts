// Candidato «a-clasico»: el zombi del patio pintado como una ilustración vectorial clásica. Formas blandas, volumen
// pintado por capas (base con degradado, sombras y luces con forma, desenfocadas y recortadas a cada pieza) y un
// contorno oscuro grueso y parejo encima. Mismo esqueleto, piezas, padres y z que `zombiBase` (estilo.ts).
import type { DefPersonaje, DefPieza } from '../../src/jardin/pvz/arte/piezas';
import { animZombi, HUESOS_ZOMBI, MARCO_ZOMBI, PERDIDAS_ZOMBI, TINTA } from '../../src/jardin/pvz/arte/estilo';

const H = HUESOS_ZOMBI;
/** Prefijo de todos los ids SVG del candidato. */
const P = 'zac';
/** Grosor del contorno principal. */
const T = 2.8;

// ---------------------------------------------------------------------------------------------------------------
// Paleta (cerca = lado que da a la cámara; lejos = brazo y pierna de atrás, más oscuros)

interface Tonos {
  luz: string;
  clara: string;
  base: string;
  sombra: string;
  honda: string;
  rebote: string;
}

const PIEL: Tonos & { morado: string } = { luz: '#e6ecd8', clara: '#c8d2b6', base: '#a6b395', sombra: '#78876b', honda: '#56644c', rebote: '#b9c6a6', morado: '#6f6a7c' };
const PIEL_L: Tonos = { luz: '#c7d0b9', clara: '#a9b598', base: '#8c997d', sombra: '#67745b', honda: '#4a5641', rebote: '#9aa787' };
const SACO: Tonos = { luz: '#c6955c', clara: '#a8763f', base: '#80542f', sombra: '#583720', honda: '#3a2312', rebote: '#946639' };
const SACO_L: Tonos = { luz: '#9e6f40', clara: '#8a5d34', base: '#6a4427', sombra: '#4a2e18', honda: '#2f1c0d', rebote: '#76512f' };
const JEAN: Tonos & { hilo: string } = { luz: '#a2badd', clara: '#7896c4', base: '#5877a5', sombra: '#3d5881', honda: '#283d5d', rebote: '#6d8bb8', hilo: '#d3dfee' };
const JEAN_L: Tonos & { hilo: string } = { luz: '#7f99c2', clara: '#6280ad', base: '#486591', sombra: '#334c71', honda: '#213450', rebote: '#57729d', hilo: '#a9bcd8' };
const ZAPATO: Tonos = { luz: '#c58f5a', clara: '#9c6839', base: '#74472a', sombra: '#4c2d18', honda: '#2e1a0c', rebote: '#86593a' };
const ZAPATO_L: Tonos = { luz: '#a87547', clara: '#86562f', base: '#613a21', sombra: '#3f2513', honda: '#26150a', rebote: '#6e4a2f' };
const CAMISA = { base: '#f1ecd9', sombra: '#cbc2a6', honda: '#a59c82', luz: '#fffdf2' };
const CORBATA = { clara: '#e6503f', base: '#c52f2b', sombra: '#8c1b1d', raya: '#76121a', luz: '#ff8a72' };
const HUESO = { base: '#f1e8cc', sombra: '#c8b993', honda: '#9c8c68' };
const DIENTE = { base: '#f4ebc9', sombra: '#d2c18c' };

// ---------------------------------------------------------------------------------------------------------------
// Ayudantes SVG

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Corre todos los pares «x,y» de un trazado (solo comandos absolutos escritos como pares). */
function mover(d: string, dx: number, dy = 0): string {
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${r2(+x + dx)},${r2(+y + dy)}`);
}

let serie = 0;
const nid = (n: string) => `${P}-${n}${serie++}`;

function contorno(d: string, w = T, color = TINTA): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/**
 * Volumen pintado: relleno base, capas (luces, sombras, pliegues) recortadas a la forma y el contorno encima.
 * `trazoD` permite contornear solo una parte (p. ej. sin el borde que se funde con otra pieza).
 */
function vol(d: string, base: string, capas: string, w = T, trazoD?: string): string {
  const id = nid('r');
  return (
    `<clipPath id="${id}"><path d="${d}"/></clipPath>` +
    `<path d="${d}" fill="${base}"/>` +
    (capas ? `<g clip-path="url(#${id})">${capas}</g>` : '') +
    (w ? contorno(trazoD ?? d, w) : '')
  );
}

/** Mancha pintada (luz o sombra) con borde suave. */
function mancha(d: string, color: string, op = 1, b = 0): string {
  return `<path d="${d}" fill="${color}" opacity="${op}"${b ? ` filter="url(#${P}-b${b})"` : ''}/>`;
}

function elip(cx: number, cy: number, rx: number, ry: number, color: string, op = 1, b = 0, rot = 0): string {
  return (
    `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${color}" opacity="${op}"` +
    (rot ? ` transform="rotate(${rot} ${r2(cx)} ${r2(cy)})"` : '') +
    (b ? ` filter="url(#${P}-b${b})"` : '') +
    '/>'
  );
}

function linea(d: string, color: string, w: number, op = 1): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
}

/** Oscurece el borde por dentro (oclusión suave junto al contorno). Va dentro de las capas de `vol`. */
function bordeInterior(d: string, color: string, op = 0.35, w = 5): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" opacity="${op}" filter="url(#${P}-b2)"/>`;
}

// ---------------------------------------------------------------------------------------------------------------
// Definiciones comunes: desenfoques y degradados

function defsComunes(): string {
  const filtro = (n: number, s: number) =>
    `<filter id="${P}-b${n}" filterUnits="userSpaceOnUse" x="-40" y="-40" width="220" height="240" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${s}"/></filter>`;
  const paradas = (ps: [number, string][]) => ps.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const linU = (id: string, x1: number, y1: number, x2: number, y2: number, ps: [number, string][]) =>
    `<linearGradient id="${P}-${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${paradas(ps)}</linearGradient>`;
  const radU = (id: string, cx: number, cy: number, r: number, fx: number, fy: number, ps: [number, string][]) =>
    `<radialGradient id="${P}-${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${paradas(ps)}</radialGradient>`;
  const radB = (id: string, cx: number, cy: number, r: number, ps: [number, string][]) =>
    `<radialGradient id="${P}-${id}" cx="${cx}" cy="${cy}" r="${r}" fx="${cx - 0.05}" fy="${cy - 0.05}">${paradas(ps)}</radialGradient>`;
  const linB = (id: string, x1: number, y1: number, x2: number, y2: number, ps: [number, string][]) =>
    `<linearGradient id="${P}-${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${paradas(ps)}</linearGradient>`;
  return (
    filtro(1, 0.7) + filtro(2, 1.4) + filtro(3, 2.6) + filtro(4, 4) +
    radU('cabeza', 36, 20, 60, 30, 12, [[0, PIEL.luz], [0.28, PIEL.clara], [0.6, PIEL.base], [1, PIEL.sombra]]) +
    radU('mandibula', 30, 58, 34, 26, 60, [[0, PIEL.clara], [0.5, PIEL.base], [1, PIEL.sombra]]) +
    radB('nariz', 0.35, 0.3, 0.8, [[0, PIEL.luz], [0.45, PIEL.clara], [1, PIEL.base]]) +
    radB('mano', 0.35, 0.25, 0.85, [[0, PIEL.clara], [0.5, PIEL.base], [1, PIEL.sombra]]) +
    radB('manoL', 0.35, 0.25, 0.85, [[0, PIEL_L.clara], [0.5, PIEL_L.base], [1, PIEL_L.sombra]]) +
    radB('esclera', 0.38, 0.32, 0.7, [[0, '#fffbe8'], [0.55, '#f2e9c4'], [1, '#cbbd88']]) +
    linB('parpado', 0, 0, 0, 1, [[0, PIEL.clara], [1, PIEL.base]]) +
    linB('diente', 0, 0, 0, 1, [[0, DIENTE.base], [1, DIENTE.sombra]]) +
    linU('saco', 40, 64, 92, 100, [[0, SACO.clara], [0.42, SACO.base], [1, SACO.sombra]]) +
    linU('mangaI', 46, 0, 64, 0, [[0, SACO.clara], [0.5, SACO.base], [1, SACO.sombra]]) +
    linU('mangaD', 63, 0, 81, 0, [[0, SACO_L.clara], [0.5, SACO_L.base], [1, SACO_L.sombra]]) +
    linU('jeanI', 47, 0, 67, 0, [[0, JEAN.clara], [0.5, JEAN.base], [1, JEAN.sombra]]) +
    linU('jeanD', 59, 0, 79, 0, [[0, JEAN_L.clara], [0.5, JEAN_L.base], [1, JEAN_L.sombra]]) +
    radB('zapatoI', 0.3, 0.25, 0.9, [[0, ZAPATO.clara], [0.5, ZAPATO.base], [1, ZAPATO.sombra]]) +
    radB('zapatoD', 0.3, 0.25, 0.9, [[0, ZAPATO_L.clara], [0.5, ZAPATO_L.base], [1, ZAPATO_L.sombra]]) +
    linB('corbata', 0, 0, 1, 0.2, [[0, CORBATA.clara], [0.45, CORBATA.base], [1, CORBATA.sombra]]) +
    linB('boca', 0, 0, 0, 1, [[0, '#4a1716'], [1, '#1e0707']]) +
    linB('hueso', 0, 0, 1, 0, [[0, HUESO.base], [1, HUESO.sombra]])
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Cabeza

const CRANEO =
  'M22.5,50.6 C20.4,48.8 19.6,46.6 20,44.2 C17.4,40.6 16.8,34.2 18.2,29.6 C17.4,26.4 18.8,23.2 21.4,21.4 ' +
  'C24.6,11.6 32.6,4.4 44,2.6 C51.6,1.4 57.4,2.6 62,3.6 C70.6,4.6 78.6,10.8 81.6,20.4 C84.6,30 83,40.4 78.4,47.4 ' +
  'C74.2,54 68.4,58.4 62.2,59.8 C56.8,60.8 51.6,58.4 47.4,56.6 C41.6,55.2 35.6,54 30.6,52.8 C27.4,52.2 24.8,51.6 22.5,50.6 Z';

/** Ojo grande con párpado caído, pupila diminuta y brillo. `mirar` corre la pupila (−1..1). */
function ojo(cx: number, cy: number, r: number, mirar: [number, number], parpado: number, incl: number, pupila: number): string {
  const id = nid('ojo');
  const yp = cy - r + parpado * 2 * r;
  const px = cx + mirar[0] * r * 0.55;
  const py = cy + mirar[1] * r * 0.55;
  const ancho = r + 3;
  return (
    // cuenca hundida alrededor
    `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${P}-esclera)"/>` +
    `<g clip-path="url(#${id})">` +
    elip(cx + r * 0.35, cy + r * 0.45, r * 0.85, r * 0.6, '#b8a874', 0.45, 2) +
    linea(`M${r2(cx + r * 0.95)},${r2(cy + r * 0.1)} C${r2(cx + r * 0.6)},${r2(cy + r * 0.05)} ${r2(cx + r * 0.45)},${r2(cy + r * 0.25)} ${r2(cx + r * 0.3)},${r2(cy + r * 0.2)}`, '#c06a5c', 0.6, 0.55) +
    `<circle cx="${r2(px)}" cy="${r2(py)}" r="${pupila}" fill="#140d08"/>` +
    `<circle cx="${r2(px - pupila * 0.35)}" cy="${r2(py - pupila * 0.35)}" r="${r2(pupila * 0.32)}" fill="#fff" opacity="0.85"/>` +
    elip(cx - r * 0.38, cy - r * 0.2, r * 0.32, r * 0.22, '#ffffff', 0.85, 1, -30) +
    `<g transform="rotate(${incl} ${cx} ${cy})">` +
    mancha(`M${cx - ancho},${r2(yp - 1)} L${cx + ancho},${r2(yp - 1)} L${cx + ancho},${r2(yp + 3.2)} L${cx - ancho},${r2(yp + 3.2)} Z`, '#3b3326', 0.35, 1) +
    `<path d="M${cx - ancho},${r2(yp)} Q${cx},${r2(yp + r * 0.22)} ${cx + ancho},${r2(yp)} L${cx + ancho},${cy - r - 4} L${cx - ancho},${cy - r - 4} Z" fill="url(#${P}-parpado)"/>` +
    elip(cx - r * 0.2, cy - r * 0.7, r * 0.55, r * 0.18, PIEL.luz, 0.6, 1) +
    linea(`M${cx - ancho},${r2(yp)} Q${cx},${r2(yp + r * 0.22)} ${cx + ancho},${r2(yp)}`, TINTA, 2.3) +
    `</g>` +
    `</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${TINTA}" stroke-width="${T * 0.9}"/>`
  );
}

function cabeza(): string {
  // Tres pelos parados (detrás del cráneo: salen del contorno).
  const pelos =
    `<path d="M45.4,4.6 C42.8,-0.8 45.2,-6.6 50.6,-6.8 C47.8,-5.2 46.8,-1.6 48,3.4 Z" fill="#2a2117"/>` +
    `<path d="M51.4,3.2 C51.6,-3 55.6,-8.2 61,-7.4 C57,-5.6 54.2,-2 54,3 Z" fill="#2a2117"/>` +
    `<path d="M58,3.8 C60.4,0 64.8,-1.2 67.6,1.4 C64.2,1 61.8,2.6 60.8,4.6 Z" fill="#2a2117"/>`;
  // Dientes de arriba (cuelgan del labio: el cráneo tapa su raíz).
  const dientes =
    vol('M24.6,49.6 L30.2,51.4 C30.6,53.6 30.2,55.8 28.8,56.8 C27.2,57.6 25.6,56.8 25,55.2 C24.6,53.4 24.4,51.4 24.6,49.6 Z', `url(#${P}-diente)`, mancha('M28.4,51 L31,51 L31,58 L28.6,58 Z', DIENTE.sombra, 0.7, 1), 1.6) +
    vol('M34.4,53 L38.6,54 C38.8,55.8 38.2,57.2 37,57.6 C35.6,57.8 34.6,56.8 34.4,55.4 Z', `url(#${P}-diente)`, '', 1.5);
  const capas =
    // sombra general de atrás y de abajo
    mancha('M58,-2 C82,2 94,28 85,52 C78,64 60,68 44,63 C64,57 76,44 76,28 C76,15 69,5 58,-2 Z', PIEL.sombra, 0.7, 4) +
    mancha('M75,26 C80,38 76,52 62,61 L82,64 L92,26 Z', PIEL.honda, 0.55, 3) +
    // rebote de luz en el borde de la nuca
    mancha('M80.2,21 C83.6,29.6 83.2,39.6 78.8,46.6 C80.8,38.6 81.2,29.6 80.2,21 Z', PIEL.rebote, 0.75, 1) +
    // sombra bajo la mejilla
    mancha('M16,48 C32,54 48,57.4 66,58.6 L66,68 L16,68 Z', PIEL.honda, 0.6, 2) +
    // cuencas moradas
    elip(43.6, 30.4, 14.5, 13.2, PIEL.morado, 0.5, 3) +
    elip(25.8, 32.2, 10, 10.4, PIEL.morado, 0.45, 3) +
    // luz de la calva y la frente
    elip(38, 12.4, 16, 7.4, PIEL.luz, 0.8, 3, -16) +
    mancha('M29.4,13.4 C33.2,7.6 40.6,4.8 47.4,5.4 C41.2,7 35.4,9.8 31.4,14.4 Z', '#ffffff', 0.8, 1) +
    elip(52.4, 5.2, 3, 1.2, '#ffffff', 0.55, 1, 4) +
    // pómulo
    elip(41.6, 46.4, 7.4, 3.4, PIEL.clara, 0.65, 2, -8) +
    // manchas de piel gastada
    elip(66.4, 14.2, 4.6, 3, PIEL.sombra, 0.4, 1, 24) +
    elip(72.6, 25.4, 2.6, 1.8, PIEL.sombra, 0.4, 1, 10) +
    elip(60.4, 22.8, 1.8, 1.3, PIEL.sombra, 0.35, 1) +
    bordeInterior(CRANEO, PIEL.honda, 0.3, 5);
  const oreja =
    vol('M66.2,33.4 C68.6,29.4 74.4,28.4 77.2,32.4 C80,36.6 78.4,43.4 73.6,45.6 C70.6,47 67.4,45.8 66.4,43.2 Z', PIEL.base,
      elip(73.4, 35, 3.4, 2.4, PIEL.clara, 0.7, 1) +
      mancha('M69.4,35.2 C72.6,33.6 75.4,36.6 74.6,39.8 C74,42.2 71.6,43.4 69.8,42.4 Z', PIEL.honda, 0.7, 0.5),
      T * 0.85, 'M66.2,33.4 C68.6,29.4 74.4,28.4 77.2,32.4 C80,36.6 78.4,43.4 73.6,45.6 C70.6,47 67.4,45.8 66.4,43.2') +
    linea('M70,36.4 C72,35.6 73.6,37 73.4,39', PIEL.honda, 1.4, 0.9);
  const arrugas =
    linea('M35.6,15.8 Q43.4,12.4 51,15.6', PIEL.sombra, 1.6, 0.85) +
    linea('M38.8,11.4 Q44.4,9.2 49.6,11.2', PIEL.sombra, 1.3, 0.7) +
    linea('M19.6,23.6 Q23.6,20.6 28.4,21.8', PIEL.sombra, 1.4, 0.75) +
    // bolsas bajo los ojos
    linea('M34.6,42.8 Q43.4,46.2 52.4,41.6', PIEL.sombra, 1.7, 0.85) +
    linea('M20.6,41.8 Q25.4,44.2 30.2,42.4', PIEL.sombra, 1.4, 0.75) +
    // surco de la mejilla junto a la boca
    linea('M33.4,46.6 C36.4,48.4 38.6,50.6 40.6,54.2', PIEL.sombra, 1.6, 0.8) +
    // costura vieja en la sien
    linea('M60.8,11.6 C64.6,15.4 67,19.6 67.6,25', TINTA, 1.5) +
    linea('M61.6,14.6 l3,-1.8 M63.8,17.6 l3,-1.6 M65.6,21 l3,-1.2', TINTA, 1.2);
  const nariz =
    vol('M31.6,37.6 C27.2,36.2 20.4,37.4 16.8,40.6 C13.6,43.4 14.4,48 18.6,48.6 C20.8,49 22.6,48.2 23.8,47 C26.4,48.4 30.2,47.6 31.4,44.8 Z', `url(#${P}-nariz)`,
      elip(17.8, 44.6, 4.4, 3.6, '#9a7f86', 0.4, 1.5) +
      elip(19.4, 41.4, 3, 1.4, '#ffffff', 0.7, 1, -24) +
      mancha('M24,46.2 C27,47.4 30.4,46.6 31.4,44.2 L32,49 L22,49 Z', PIEL.sombra, 0.6, 1),
      T * 0.85, 'M31.6,37.6 C27.2,36.2 20.4,37.4 16.8,40.6 C13.6,43.4 14.4,48 18.6,48.6 C20.8,49 22.6,48.2 23.8,47 C26.4,48.4 30.2,47.6 31.4,44.8') +
    linea('M19.4,45.8 C20.6,47 22.2,47 23,46', TINTA, 1.5);
  // Sombra que la nariz echa sobre la cara.
  const sombraNariz = mancha('M24,48 C28,50 33,50 35,47 L35,52 L24,52 Z', PIEL.honda, 0.4, 1.5);
  return (
    pelos +
    dientes +
    vol(CRANEO, `url(#${P}-cabeza)`, capas + sombraNariz) +
    oreja +
    arrugas +
    ojo(25.8, 31.6, 7.4, [-0.25, 0.35], 0.4, -12, 2) +
    ojo(43.6, 29.2, 10.6, [-0.5, 0.28], 0.3, 8, 2.5) +
    // ceja caída del ojo grande
    linea('M33.6,17.4 Q41,14.6 50.4,19.2', PIEL.honda, 1.8, 0.8) +
    nariz
  );
}

// Boca: el hueco oscuro detrás del labio y la mandíbula, con la lengua.
const BOCA =
  'M21.6,49.2 C30,50.6 44,52.4 58.6,49.6 L59.4,58.4 C54,62.4 47,65.6 43,66.8 C37,69.4 31.6,70.8 27.6,70.4 ' +
  'C25,67 24,61.6 23.8,57.8 C23.4,54.8 22.6,52 21.6,49.2 Z';

function boca(): string {
  return vol(BOCA, `url(#${P}-boca)`,
    vol('M25.4,67 C28.6,61.6 37,60 44.4,62.6 C47.4,63.8 46.4,67.8 42.2,69 C36,70.8 29,71 25.4,67 Z', '#87495a',
      linea('M30,64.4 C34,63.2 39,63.2 43,64.4', '#b77a87', 1.2, 0.8) + linea('M35.4,64 C35.6,66 35.4,68 35,69.6', '#5e2b38', 1, 0.8), 0) +
    elip(48, 55, 9, 4, '#000000', 0.45, 2),
    T * 0.9);
}

const MANDIBULA =
  'M60.4,48.6 C62.8,54.4 61.4,60.4 56.4,64.2 C51,68.6 44.6,72.6 37.4,73.6 C31.4,74.4 25.8,72.2 23.6,67.6 ' +
  'C21.8,63.8 22.2,59.6 23.8,56.6 C28.6,57 34.6,57.4 40.6,56.4 C47.6,55.4 54.6,52.6 60.4,48.6 Z';

function mandibula(): string {
  const dientes =
    vol('M30.4,57.4 C30.2,55.4 30.8,53.6 32.2,53.4 C33.6,53.2 34.4,54.8 34.4,57.4 Z', `url(#${P}-diente)`, '', 1.5) +
    vol('M39.8,57 C39.8,55.6 40.4,54.6 41.4,54.6 C42.4,54.6 42.8,55.8 42.8,56.8 Z', `url(#${P}-diente)`, '', 1.3);
  const capas =
    mancha('M23,56 C34,58.4 48,57 62,48 L64,40 L20,40 Z', PIEL.honda, 0.55, 2) +
    mancha('M20,68 C30,76 46,74 62,60 L66,80 L18,80 Z', PIEL.honda, 0.5, 2) +
    elip(29.4, 64.6, 5.4, 3.6, PIEL.luz, 0.55, 2, -10) +
    // labio de abajo, morado grisáceo
    mancha('M23.8,56.6 C30,57.4 38,57.4 46,55.6 C40,59.8 30.4,60.6 24.2,59.6 Z', '#8f7f8c', 0.75, 0.5) +
    linea('M26.4,62.6 C29.4,63.8 32.6,63.8 35.2,62.8', PIEL.sombra, 1.4, 0.8) +
    bordeInterior(MANDIBULA, PIEL.honda, 0.3, 4);
  return dientes + vol(MANDIBULA, `url(#${P}-mandibula)`, capas);
}

// ---------------------------------------------------------------------------------------------------------------
// Cuerpo: cuello (con su muñón por si cae la cabeza), saco, camisa, solapa, bolsillo y remiendo

const CUELLO = 'M48.4,56 C49.8,60.4 50,64.6 48.8,69.4 L62.8,69.4 C61.4,64.6 61.4,60.4 62.8,56.6 Z';
const SACO_D =
  'M47.4,63.4 C52,60.6 57.8,59.8 63.2,60.4 C70.4,59.8 77.8,62 82.8,67.4 C88.6,73.8 91.2,84.4 91.4,95.6 ' +
  'C91.6,101.2 91.2,106.6 90.2,111.6 L87,109.6 L84.6,113.8 L81,110.4 L77,113.2 C74.2,111.2 71.4,111.8 68.6,113.6 ' +
  'L66,110.2 L62,112.8 L59,110.6 C56,112.4 52.4,112 50,111 L47,112.8 L44.6,109.8 L41.2,111.2 ' +
  'C39.8,104.4 39,96.4 39.6,88.6 C40.2,80.4 43,70.6 47.4,63.4 Z';
const CAMISA_D = 'M46.4,64.6 C49.4,62.8 54.8,62.2 59,63.2 C58.6,72.4 55.8,85.6 50.8,98 C47,93.6 44.6,86.2 44,78.6 C43.8,73 44.6,68 46.4,64.6 Z';
const SOLAPA = 'M58.6,62.6 C62,63 65.2,64.4 67.4,66.6 L64.8,69.8 L69.6,71.4 C67.2,80.8 61.2,90.8 51.2,98.6 C55.6,86.6 57.8,74.6 58.6,62.6 Z';

function cuerpo(): string {
  const cuello =
    vol(CUELLO, PIEL.base,
      mancha('M56,54 L66,54 L66,72 L58,72 C60,66 59,60 56,54 Z', PIEL.honda, 0.6, 1.5) +
      elip(51.4, 64, 2, 4, PIEL.clara, 0.6, 1)) +
    linea('M49.6,61.6 C48,62.6 48,64.8 49.6,65.6', PIEL.sombra, 1.3) +
    // muñón: solo se ve si se cae la cabeza
    vol('M47.8,56.4 C49.6,53.2 61,53.4 63.2,56.8 C61.6,60 49.8,59.8 47.8,56.4 Z', '#7c2622',
      elip(55.4, 56.6, 5, 1.8, '#4e1111', 0.9) + elip(52.4, 55.6, 2.4, 0.8, '#b0473c', 0.6, 0.5), 1.8) +
    `<circle cx="55.8" cy="56.6" r="1.7" fill="${HUESO.base}" stroke="${TINTA}" stroke-width="1.1"/>`;
  const capasSaco =
    // luz de los hombros
    mancha('M46,64 C54,58.6 70,58 82,64.6 C70,62.8 56,63.6 47,68.6 Z', SACO.luz, 0.6, 2) +
    // espalda en sombra y luz de rebote
    mancha('M78,62 C92,72 95,96 90,116 L100,116 L100,60 Z', SACO.honda, 0.7, 3) +
    mancha('M89.6,80 C91,88 91.2,98 90.2,106 C89.6,98 89.4,88 89.6,80 Z', SACO.rebote, 0.65, 1) +
    // sombra bajo el brazo cercano y bajo la solapa
    elip(63, 82, 8, 13, SACO.honda, 0.4, 3) +
    // frente del saco (lado lejano de la abertura), iluminado
    mancha('M44,68 C41,80 40.4,96 42,110 L46,110 C44.4,96 44.6,82 47,70 Z', SACO.luz, 0.45, 2) +
    // pliegues
    linea('M64.4,77.2 C68.8,78.4 73.2,80.6 76.4,84', SACO.honda, 1.7, 0.75) +
    linea('M64.8,75.4 C69.2,76.4 73.8,78.6 77.2,82', SACO.luz, 1, 0.45) +
    linea('M60.4,89.6 C66,88.6 72,88.8 77.4,90.2', SACO.honda, 1.5, 0.55) +
    linea('M70.6,101.4 C71.2,105 71.4,108.6 71,112.6', SACO.honda, 1.6, 0.65) +
    linea('M69.2,101.6 C69.6,105 69.6,108 69.2,111.4', SACO.luz, 0.9, 0.4) +
    linea('M80.8,99.2 C81.6,103 82,106.8 81.6,110.2', SACO.honda, 1.6, 0.65) +
    linea('M43.4,96 C44.4,100 45,104 44.8,109', SACO.honda, 1.3, 0.5) +
    // borde de abajo más oscuro
    mancha('M38,108 C56,106 76,106 94,106 L94,118 L38,118 Z', SACO.honda, 0.4, 2) +
    bordeInterior(SACO_D, SACO.honda, 0.4, 5);
  const cuelloSaco = vol('M60.4,61.4 C61.2,57.6 64.8,55.8 68.8,57.2 C71,58.4 70.8,61 69,62.4 C66,61.6 63,61.2 60.4,61.4 Z', SACO.clara,
    mancha('M66,56 L72,58 L70,64 L64,62 Z', SACO.sombra, 0.6, 1), 2.2);
  const camisa = vol(CAMISA_D, CAMISA.base,
    mancha('M44,68 C44.6,80 47,92 51.6,99.6 L42,99.6 L42,68 Z', CAMISA.sombra, 0.8, 1.5) +
    elip(52.4, 65.4, 8, 4.4, CAMISA.honda, 0.6, 2) +
    linea('M47.2,86.4 Q50,85.4 52.6,86.6', CAMISA.sombra, 1.2) +
    elip(54.6, 91.4, 2, 1.5, '#b4a274', 0.45, 0.5), T * 0.85);
  const solapa =
    mancha('M69.6,71.4 C67.2,80.8 61.2,90.8 51.2,98.6 L55.6,100 C64.6,92.4 70.4,82.6 72.8,72.4 Z', SACO.honda, 0.55, 1.5) +
    vol(SOLAPA, SACO.base,
      mancha('M58,62 C58,76 55,88 50,99 L54,99 C59,88 61,76 61,63 Z', SACO.luz, 0.5, 1.5) +
      mancha('M70,70 C66,82 60,92 52,99 L60,100 L72,74 Z', SACO.sombra, 0.6, 1.5),
      T * 0.85);
  const boton =
    `<circle cx="51.2" cy="101.4" r="2.3" fill="${SACO.honda}" stroke="${TINTA}" stroke-width="1.4"/>` +
    elip(50.6, 100.7, 0.9, 0.6, SACO.luz, 0.8);
  const abertura = mancha('M50.8,103.6 C49.8,106.4 48.6,109 47.8,112.2 L52.8,111.6 C52,108.8 51.4,106.4 50.8,103.6 Z', '#22150b');
  const bolsillo =
    vol('M62.4,94.6 C67.6,93.2 73.6,92.8 79,93.8 L78.4,98.6 C74.8,100 70.4,100.2 66.4,99.4 L64.6,101.8 L63.2,98.4 Z', SACO.base,
      mancha('M62,94 L80,92.6 L80,95.6 L62,96.8 Z', SACO.luz, 0.55, 1) + mancha('M62,98 L80,97 L80,102 L62,102 Z', SACO.sombra, 0.6, 1), 1.9);
  const remiendo =
    vol('M77.4,74.4 C80.4,73.4 83.8,72.8 86.8,73 C87.6,76.6 88,80.4 87.8,84 C84.6,84.8 81.4,85.4 78.4,85.6 C77.6,81.8 77.2,78 77.4,74.4 Z', '#8c7b52',
      mancha('M76,72 L90,72 L90,76 L76,77 Z', '#ae9a68', 0.6, 1) + mancha('M84,72 L90,72 L90,88 L84,88 Z', '#5f5233', 0.55, 1.5), 1.7) +
    linea('M77.2,76.6 l2.2,0.2 M77.4,80.4 l2.2,0 M78,84.2 l2,-0.6 M80.4,73.4 l0.4,2 M84,72.8 l0.2,2 M86.4,76.6 l-2,0.2 M86.8,80.6 l-2.2,0', '#eee2bf', 1.1);
  const roto = mancha('M83.4,100.6 L85.6,99.4 L87,101.6 L86.4,104.6 L84,105 L82.6,102.8 Z', '#22150b') +
    contorno('M83.4,100.6 L85.6,99.4 L87,101.6 L86.4,104.6 L84,105 L82.6,102.8 Z', 1.3);
  return cuello + vol(SACO_D, `url(#${P}-saco)`, capasSaco) + cuelloSaco + camisa + solapa + boton + abertura + bolsillo + remiendo + roto;
}

// Corbata roja con rayas, con las puntas del cuello de la camisa encima del nudo.
function corbata(): string {
  const HOJA = 'M50.8,69.8 L54.8,69.8 C56.6,75.4 58.6,83.4 58.4,91 L53.6,97.8 L48.8,90.8 C48.4,83.4 49.4,75.4 50.8,69.8 Z';
  const rayas =
    mancha('M44,77.4 L64,70.6 L64,73.4 L44,80.2 Z', CORBATA.raya, 0.85) +
    mancha('M44,84.6 L64,77.8 L64,80.6 L44,87.4 Z', CORBATA.raya, 0.85) +
    mancha('M44,91.8 L64,85 L64,87.8 L44,94.6 Z', CORBATA.raya, 0.85) +
    linea('M44,81.6 L64,74.8 M44,88.8 L64,82', '#f3c9a8', 0.8, 0.6);
  const hoja = vol(HOJA, `url(#${P}-corbata)`,
    rayas +
    mancha('M49,72 C49,80 49.2,86 50,91 L48,91 L48,72 Z', CORBATA.luz, 0.5, 1) +
    mancha('M55,70 C57,78 58.6,86 58.4,92 L54,98 L60,98 L60,70 Z', CORBATA.sombra, 0.6, 1.5) +
    linea('M53.2,72 C54.2,80 54.6,88 53.6,96', CORBATA.sombra, 1.2, 0.6), T * 0.85);
  const nudo = vol('M49.6,65.4 C51.4,64.2 54.2,64.2 56,65.4 L55,70.4 C53.6,71.2 51.8,71.2 50.6,70.4 Z', CORBATA.base,
    mancha('M54,64 L57,64 L56,72 L53,72 Z', CORBATA.sombra, 0.7, 1) + elip(51.4, 66.4, 1.4, 1, CORBATA.luz, 0.7, 0.5), T * 0.8);
  const puntas =
    vol('M45.6,63.2 C48.4,63.4 51,64.4 52.8,66 L49.6,70.4 C47.8,68.6 46.4,66 45.6,63.2 Z', CAMISA.base, mancha('M50,64 L54,66 L50,72 Z', CAMISA.sombra, 0.7, 1), 1.8) +
    vol('M59.6,63 C57,63.4 54.6,64.4 52.8,66 L56.6,70.6 C58.2,68.4 59.2,65.8 59.6,63 Z', CAMISA.base, mancha('M56,64 L60,63 L60,70 L57,71 Z', CAMISA.sombra, 0.7, 1), 1.8);
  return hoja + nudo + puntas;
}

// ---------------------------------------------------------------------------------------------------------------
// Brazos: manga de arriba (hombro → codo), manga de abajo (codo → muñeca) y mano con el puño rasgado de la manga

const MANGA_SUP =
  'M46.4,70.2 C46,64.2 50,60.4 55.2,60.4 C60.6,60.4 64.4,64.6 64,70.4 C63.8,75.6 62.8,81 62,86.6 ' +
  'C62,91.4 58.8,94.6 55,94.6 C51.2,94.6 48,91.6 48,87.6 C48,82.6 46.8,76.4 46.4,70.2 Z';
const MANGA_SUP_ROTA =
  'M46.4,70.2 C46,64.2 50,60.4 55.2,60.4 C60.6,60.4 64.4,64.6 64,70.4 C63.8,75.6 63,81 62.4,86.4 ' +
  'L60.6,85.2 L59.2,89.6 L56.6,86.8 L54.2,90.4 L52,87 L49.6,89.2 L48.2,86.2 C47.6,80.6 46.8,75.6 46.4,70.2 Z';
const MANGA_INF =
  'M48.6,88.4 C48.6,84.6 51.4,81.6 55.2,81.6 C58.8,81.6 61.6,84.4 61.6,88.2 C61.8,92.6 62.6,97.4 63.4,101.6 ' +
  'L63.6,104.8 L46.6,104.8 L46.8,101.6 C47.6,97.4 48.4,92.8 48.6,88.4 Z';
const PUNO =
  'M47.8,99.4 C52.4,98.2 57.8,98.2 62.4,99.4 C63.6,101.8 64.6,104.6 65.2,107.4 L62.8,106.6 L61.4,109.6 ' +
  'L58.8,107.6 L56.2,110.4 L53.6,107.8 L51.2,109.8 L49.4,107 L46.6,108.4 L45.4,107.2 C46,104.4 46.8,101.6 47.8,99.4 Z';
const MANO =
  'M50.6,103.6 C49,107 47.8,110.4 47.8,113.4 C45.2,114 43,116.8 43.6,119.8 C44.2,122.8 47.6,123.4 49,121 ' +
  'C48.8,123.8 50.2,126.4 52.6,126.2 C54.4,126 55,124 54.8,122.4 C55.4,125.2 57,127 59,126.4 C60.8,125.8 61.2,123.6 60.6,121.8 ' +
  'C61.8,123.4 63.8,123.2 64.4,121.2 C65,119.2 64,116.2 62.8,114.2 C62.8,110.4 61.8,106.8 60,103.6 Z';

function brazoSup(dx: number, S: Tonos, grad: string, rota: boolean): string {
  const d = mover(rota ? MANGA_SUP_ROTA : MANGA_SUP, dx);
  const capas =
    elip(52.4 + dx, 64.8, 6, 3.4, S.luz, 0.55, 2, -20) +
    mancha(mover('M60.6,62 C66,68 65,84 60,96 L70,96 L70,60 Z', dx), S.honda, 0.6, 2) +
    mancha(mover('M63,72 C63,78 62.4,83 61.6,87 C62.6,83 63.4,78 63,72 Z', dx), S.rebote, 0.6, 1) +
    linea(mover('M48.6,81.8 C50.6,82.8 52.6,84.4 53.4,86.8', dx), S.honda, 1.6, 0.8) +
    linea(mover('M48.8,80 C50.8,80.6 52.6,81.8 53.8,83.6', dx), S.luz, 1, 0.45) +
    linea(mover('M57.8,70.8 C59.8,74.8 60.2,78.8 59.4,82.8', dx), S.sombra, 1.3, 0.7) +
    bordeInterior(d, S.honda, 0.35, 4);
  if (!rota) return vol(d, `url(#${P}-${grad})`, capas);
  // Hueso a la vista: sale de la manga rasgada (se dibuja antes, la manga lo tapa por arriba).
  const hueso =
    vol(mover('M53.4,84 L57.4,84 C57.4,88 57.2,92 57.6,94.6 C59.6,94.4 60.6,96.4 59.6,98 C58.6,99.6 56.8,99.2 56,98.2 ' +
      'C55,99.4 53,99.6 52.2,98 C51.4,96.4 52.4,94.6 53.8,94.6 C54,92 53.6,88 53.4,84 Z', dx), `url(#${P}-hueso)`,
      mancha(mover('M56,84 L58,84 L58,100 L56,100 Z', dx), HUESO.sombra, 0.6, 0.5), 1.9) +
    mancha(mover('M51.6,86 C53,88.6 57,88.8 59.4,86.6 C58,90.6 53.2,90.8 51.6,86 Z', dx), '#6f201c', 0.95);
  return hueso + vol(d, `url(#${P}-${grad})`, capas + mancha(mover('M47,85 L63,85 L63,92 L47,92 Z', dx), S.honda, 0.5, 1));
}

function antebrazo(dx: number, S: Tonos, grad: string): string {
  const d = mover(MANGA_INF, dx);
  return vol(d, `url(#${P}-${grad})`,
    mancha(mover('M59,82 C64,90 64,98 64,106 L70,106 L70,80 Z', dx), S.honda, 0.6, 2) +
    elip(51.4 + dx, 86, 3.4, 2.6, S.luz, 0.5, 1.5) +
    linea(mover('M50.2,86.6 C52.8,84.8 57.4,84.8 60.2,86.8', dx), S.honda, 1.4, 0.7) +
    linea(mover('M51.2,93.4 C53.4,94.4 55.6,94.2 57.6,92.8', dx), S.honda, 1.3, 0.6) +
    bordeInterior(d, S.honda, 0.35, 4));
}

function mano(dx: number, S: Tonos, Pi: Tonos, grad: string, gradPiel: string): string {
  const d = mover(MANO, dx);
  const capasMano =
    mancha(mover('M59,104 C64,110 66,118 64,124 L70,124 L70,104 Z', dx), Pi.honda, 0.55, 2) +
    elip(52 + dx, 112.6, 4, 3, Pi.luz, 0.5, 1.5) +
    elip(46.4 + dx, 117.6, 1.8, 1.4, Pi.luz, 0.5, 1) +
    // sombra que echa el puño de la manga
    mancha(mover('M44,102 L66,102 L66,109.6 C60,111 50,111 44,109.6 Z', dx), Pi.honda, 0.65, 1.5) +
    linea(mover('M49,121 C49.4,119 49.6,117.4 49.4,115.6', dx), Pi.honda, 1.4) +
    linea(mover('M54.8,122.4 C54.8,120.4 54.8,119 54.6,117.4', dx), Pi.honda, 1.4) +
    linea(mover('M60.6,121.8 C60.4,119.8 60.2,118.4 59.8,117', dx), Pi.honda, 1.4) +
    linea(mover('M50.6,119.4 q1.4,0.8 2.8,0 M56.2,119.8 q1.4,0.8 2.8,0', dx), Pi.sombra, 1, 0.8) +
    elip(52.2 + dx, 124.4, 1.7, 1.1, '#56533d', 0.9) +
    elip(58.4 + dx, 124.8, 1.7, 1.1, '#56533d', 0.9) +
    elip(63.4 + dx, 120.6, 1.5, 1, '#56533d', 0.9, 0, -60) +
    elip(45 + dx, 120.8, 1.5, 1, '#56533d', 0.9, 0, 40) +
    bordeInterior(d, Pi.honda, 0.3, 3.5);
  const puno = mover(PUNO, dx);
  return (
    vol(d, `url(#${P}-${gradPiel})`, capasMano, T * 0.9) +
    vol(puno, `url(#${P}-${grad})`,
      mancha(mover('M60,98 C64,102 66,106 66,110 L70,110 L70,96 Z', dx), S.honda, 0.6, 1.5) +
      linea(mover('M47.4,102.2 C52,101.2 58,101.2 63.4,102.4', dx), S.honda, 1.4, 0.7) +
      linea(mover('M47.6,100.8 C52,99.8 58,99.8 62.8,100.8', dx), S.luz, 0.9, 0.45), T * 0.9)
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Piernas (jean roto) y zapatos

const PIERNA =
  'M48.2,93.4 C48,101.4 47.4,109.4 47.4,116 C47.4,119.6 48.4,122.4 49,125.4 C49.6,129.4 48.8,133.6 48,137.4 ' +
  'L50.6,136.2 L52.2,139 L54.8,136.6 L57.2,139.2 L59.8,136.6 L62.4,138.8 L64.4,136.6 L66.4,137.6 ' +
  'C65.8,132.4 64.8,127.8 64.6,123.6 C64.4,120 65.6,117.2 66.2,113.6 C66.8,107 66.8,100 66.4,93.4 Z';

function pierna(dx: number, J: Tonos & { hilo: string }, grad: string, cerca: boolean): string {
  const d = mover(PIERNA, dx);
  let capas =
    // sombra que echa el saco
    mancha(mover('M44,90 L70,90 L70,108 C62,112 52,112 44,108 Z', dx), J.honda, 0.65, 2) +
    mancha(mover('M61,100 C64,112 62,126 63,140 L70,140 L70,100 Z', dx), J.honda, 0.55, 2) +
    elip(51.2 + dx, 123, 2.6, 5, J.luz, 0.45, 2) +
    // pliegues detrás de la rodilla y costura
    linea(mover('M66,115.4 C63.8,116.4 62,117.8 61,119.6 M65.6,119.2 C63.8,119.8 62.6,121 62,122.4', dx), J.honda, 1.3, 0.7) +
    linea(mover('M62.6,96 C63.2,108 62.4,124 63.4,136', dx), J.rebote, 1, 0.55) +
    // dobladillo deshilachado
    mancha(mover('M46,134.6 L68,134.6 L68,140 L46,140 Z', dx), J.honda, 0.5, 1) +
    linea(mover('M49,136.6 L50.4,135.4 M53.6,137.6 L54.2,135.6 M58.6,137.4 L58.8,135.6 M63.2,137.2 L63.6,135.4', dx), J.hilo, 0.9, 0.7) +
    bordeInterior(d, J.honda, 0.35, 4);
  if (cerca) {
    // Hueco en la rodilla: se ve la piel con hilos sueltos.
    const hueco = 'M49.8,113.6 L52.2,112 L54,113.4 L56.4,111.8 L58.2,114.2 C59,116.6 58.2,119.2 56.4,120.6 L54,119.6 L51.8,121 C50,119.6 49.2,116.2 49.8,113.6 Z';
    capas +=
      vol(hueco, PIEL.base,
        mancha('M48,111 L60,111 L60,115.6 C56,114 52,114 48,115.6 Z', PIEL.honda, 0.7, 1) +
        elip(54, 117.4, 2.6, 1.8, PIEL.clara, 0.7, 1), 1.6) +
      linea('M49.6,116.2 L58.6,115.4 M50.2,118.4 C53,117.6 55.6,118.2 58,117.6', '#ebe7da', 0.9, 0.95) +
      linea('M49.4,113 L52.2,111 L54.2,112.6 L56.6,110.8 L58.8,113.8', J.hilo, 1, 0.8);
  } else {
    // Remiendo de jean más claro en la canilla.
    capas +=
      vol(mover('M51.4,124 L58.6,123.2 L59.4,130.2 L52,131 Z', dx), J.clara, mancha(mover('M56,122 L60,122 L60,132 L56,132 Z', dx), J.sombra, 0.6, 1), 1.4) +
      linea(mover('M52.2,125.4 l1.6,0 M58.2,125 l-1.6,0 M52.6,129.4 l1.6,0 M58.6,129 l-1.6,0', dx), '#e7dcc0', 1);
  }
  return vol(d, `url(#${P}-${grad})`, capas);
}

const ZAPATO_D =
  'M62.8,131.6 C66,132.4 67.6,136.4 67.4,140.4 C67.2,142.6 66.4,144.4 64.6,145 L44,145.2 C38,145.2 35,142 35.8,138.6 ' +
  'C36.6,135.4 40.2,133.4 44.4,132.8 C47.6,132.4 49.4,131 50.6,129.8 C52.6,128.4 55.4,129 56.6,130.4 C58.6,131.8 60.8,131.6 62.8,131.6 Z';
const SUELA = 'M67.2,141.4 C67,143.4 66.2,144.6 64.6,145.2 L44,145.4 C38.6,145.4 35.6,143.4 35.4,141.2 C41,142.4 51,142.6 67.2,141.4 Z';

function zapato(dx: number, Z: Tonos, grad: string, cerca: boolean): string {
  const d = mover(ZAPATO_D, dx);
  const capas =
    mancha(mover('M58,128 C66,132 70,138 68,146 L74,146 L74,128 Z', dx), Z.honda, 0.65, 2) +
    elip(40.6 + dx, 136.4, 4, 2, '#ffffff', 0.4, 1.5, -20) +
    elip(40 + dx, 136.2, 1.6, 0.8, '#ffffff', 0.7, 0.5, -20) +
    linea(mover('M44.2,133.6 C42.4,136.4 42,139.6 42.8,142', dx), Z.honda, 1.5, 0.8) +
    linea(mover('M45,133.4 C43.4,136.2 43,139 43.6,141.4', dx), Z.luz, 0.8, 0.4) +
    bordeInterior(d, Z.honda, 0.4, 4);
  const cordones =
    linea(mover('M50.4,131.8 L54.6,133.8 M51.2,134.2 L55.2,131.4', dx), TINTA, 2.8) +
    linea(mover('M50.4,131.8 L54.6,133.8 M51.2,134.2 L55.2,131.4', dx), '#e7dab3', 1.3) +
    (cerca ? linea(mover('M54.6,133.8 C56,136.4 54,138.6 55.4,140.6', dx), TINTA, 2.4) + linea(mover('M54.6,133.8 C56,136.4 54,138.6 55.4,140.6', dx), '#e7dab3', 1.1) : '');
  const suela = vol(mover(SUELA, dx), '#2e2017', mancha(mover('M34,140 L70,140 L70,142.6 L34,143 Z', dx), '#5c4636', 0.7, 0.6), 1.9) +
    linea(mover('M60,142.2 L60.4,145', dx), '#5c4636', 1, 0.7);
  return vol(d, `url(#${P}-${grad})`, capas) + suela + cordones;
}

// ---------------------------------------------------------------------------------------------------------------
// Ensamble

export default function crear(): DefPersonaje {
  serie = 0;
  const dD = H.hombroDer[0] - H.hombroIzq[0]; // 17: del brazo cercano al lejano
  const dP = H.caderaDer[0] - H.caderaIzq[0]; // 12: de la pierna cercana a la lejana
  const sombraSuelo =
    elip(60, 142.6, 31, 6.4, '#000000', 0.26, 3) + elip(59, 142.8, 20, 3.8, '#000000', 0.22, 2);
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombraSuelo, pivote: [60, 142], z: -10, sinTinte: true },
    { id: 'brazo_der', svg: brazoSup(dD, SACO_L, 'mangaD', false), pivote: H.hombroDer, padre: 'cuerpo', z: 0 },
    { id: 'antebrazo_der', svg: antebrazo(dD, SACO_L, 'mangaD'), pivote: H.codoDer, padre: 'brazo_der', z: 0.1 },
    { id: 'mano_der', svg: mano(dD, SACO_L, PIEL_L, 'mangaD', 'manoL'), pivote: H.munecaDer, padre: 'antebrazo_der', z: 0.2 },
    { id: 'pierna_der', svg: pierna(dP, JEAN_L, 'jeanD', false), pivote: H.caderaDer, z: 1 },
    { id: 'zapato_der', svg: zapato(dP, ZAPATO_L, 'zapatoD', false), pivote: [H.caderaDer[0], 136], padre: 'pierna_der', z: 1.1 },
    { id: 'pierna_izq', svg: pierna(0, JEAN, 'jeanI', true), pivote: H.caderaIzq, z: 2 },
    { id: 'zapato_izq', svg: zapato(0, ZAPATO, 'zapatoI', true), pivote: [H.caderaIzq[0], 136], padre: 'pierna_izq', z: 2.1 },
    { id: 'cuerpo', svg: cuerpo(), pivote: H.cadera, z: 5 },
    { id: 'corbata', svg: corbata(), pivote: [52.5, 66], padre: 'cuerpo', z: 6 },
    { id: 'cabeza', svg: cabeza(), pivote: H.cuello, padre: 'cuerpo', z: 10 },
    { id: 'boca', svg: boca(), pivote: H.mandibula, padre: 'cabeza', z: 8 },
    { id: 'mandibula', svg: mandibula(), pivote: H.mandibula, padre: 'cabeza', z: 9 },
    {
      id: 'brazo_izq', svg: brazoSup(0, SACO, 'mangaI', false), pivote: H.hombroIzq, padre: 'cuerpo', z: 12,
      estados: { roto: brazoSup(0, SACO, 'mangaI', true) },
    },
    { id: 'antebrazo_izq', svg: antebrazo(0, SACO, 'mangaI'), pivote: H.codoIzq, padre: 'brazo_izq', z: 12.1 },
    { id: 'mano_izq', svg: mano(0, SACO, PIEL, 'mangaI', 'mano'), pivote: H.munecaIzq, padre: 'antebrazo_izq', z: 12.2 },
  ];
  return {
    id: 'zombi',
    nombre: 'Zombi',
    ancho: MARCO_ZOMBI.ancho,
    alto: MARCO_ZOMBI.alto,
    ancla: MARCO_ZOMBI.ancla,
    piezas,
    defs: defsComunes(),
    anim: (c) => animZombi(c),
    estados: ['camina', 'come', 'quieto', 'sincabeza', 'muere', 'ceniza'],
    duraciones: { muere: 1.3, ceniza: 1.6 },
    perdidas: { ...PERDIDAS_ZOMBI },
    puntos: { cabeza: [52, 2], boca: [30, 57] },
  };
}
