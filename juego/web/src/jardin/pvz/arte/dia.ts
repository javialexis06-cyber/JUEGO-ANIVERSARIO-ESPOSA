// Arte del mundo 1 (el día en la casa): las 9 plantas, los 5 zombis y los objetos. Dibujos propios al estilo de
// PvZ (formas reconocibles, contorno oscuro, colores saturados), por piezas para animarlos.
// Las plantas miran a la DERECHA y los zombis a la IZQUIERDA. Casilla de 80 × 100: plantas de ~70–85 de alto,
// zombis de ~120–130.

import type { CtxAnim, DefPersonaje, DefPieza, Pose } from './piezas';
import {
  PALETA as P, TINTA, TRAZO, animZombi, borde, brillo, dientes, grupo, hoja, lineal, mezclar, ojoPlanta, onda, PERDIDAS_ZOMBI,
  radial, rosetaHojas, sombra, suave, sumarPoses, tallo, tramo, volumen, zombiBase, MARCO_ZOMBI, HUESOS_ZOMBI,
} from './estilo';

// ---------------------------------------------------------------------------------------------------------------
// Ayudantes de plantas

/** Balanceo vivo de planta: tallo y cabeza a destiempo. */
function balanceo(c: CtxAnim, amp = 1, frec = 0.5): { tallo: number; cabeza: number; hojas: number } {
  const s = c.semilla;
  return {
    tallo: onda(c.t, frec, s) * 3 * amp,
    cabeza: onda(c.t, frec, s, 0.9) * 4.5 * amp,
    hojas: onda(c.t, frec, s, 0.4),
  };
}

/** 'herida': la planta se encoge y agacha la cabeza. */
function herida(c: CtxAnim): { tallo: number; cabeza: number } {
  return { tallo: -4 + onda(c.t, 0.35, c.semilla) * 2, cabeza: 9 + onda(c.t, 0.35, c.semilla, 1) * 2 };
}

/** Retroceso al disparar (fase 0..1): la cabeza se comprime y luego se estira. */
function retroceso(f: number): { x: number; sx: number; sy: number; hocico: number } {
  if (f <= 0 || f >= 1) return { x: 0, sx: 1, sy: 1, hocico: 1 };
  if (f < 0.28) {
    const k = suave(f / 0.28);
    return { x: -5 * k, sx: 1 - 0.1 * k, sy: 1 + 0.08 * k, hocico: 1 - 0.15 * k };
  }
  if (f < 0.45) {
    const k = suave((f - 0.28) / 0.17);
    return { x: mezclar(-5, 4, k), sx: mezclar(0.9, 1.08, k), sy: mezclar(1.08, 0.94, k), hocico: mezclar(0.85, 1.28, k) };
  }
  const k = suave((f - 0.45) / 0.55);
  return { x: mezclar(4, 0, k), sx: mezclar(1.08, 1, k), sy: mezclar(0.94, 1, k), hocico: mezclar(1.28, 1, k) };
}

// ---------------------------------------------------------------------------------------------------------------
// Tiradores: Lanzaguisantes, Hielaguisantes y Repetidora

interface OpcionesTirador {
  id: string;
  nombre: string;
  claro: string;
  medio: string;
  oscuro: string;
  boca: string;
  radio: number;
  /** SVG extra detrás de la cabeza (copete, cresta). */
  nuca: string;
  /** SVG extra encima de la cabeza (cejas de hoja, escarcha). */
  frente?: string;
  /** Disparos por ataque (la Repetidora hace dos retrocesos). */
  disparos?: number;
}

function tirador(op: OpcionesTirador): DefPersonaje {
  const id = op.id;
  const R = op.radio;
  const cx = 38, cy = 36;
  const defs =
    volumen(`${id}-cab`, op.claro, op.medio, op.oscuro, 0.32, 0.25) +
    lineal(`${id}-hoc`, [[0, op.claro], [0.45, op.medio], [1, op.oscuro]]);
  const xb = cx + R * 0.62; // donde nace el hocico
  const xf = cx + R + 16; // boca
  const hocico =
    `<path d="M${xb},${cy - 9} C${xb + 8},${cy - 9.5} ${xf - 6},${cy - 11} ${xf},${cy - 12} L${xf},${cy + 12} C${xf - 6},${cy + 11} ${xb + 8},${cy + 9.5} ${xb},${cy + 9} Z" fill="url(#${id}-hoc)"/>` +
    `<path d="M${xb + 1},${cy - 9} C${xb + 8},${cy - 9.5} ${xf - 6},${cy - 11} ${xf},${cy - 12}" fill="none" ${borde()}/>` +
    `<path d="M${xb + 1},${cy + 9} C${xb + 8},${cy + 9.5} ${xf - 6},${cy + 11} ${xf},${cy + 12}" fill="none" ${borde()}/>` +
    `<ellipse cx="${xf}" cy="${cy}" rx="6" ry="12.2" fill="${op.medio}" ${borde()}/>` +
    `<ellipse cx="${xf + 0.6}" cy="${cy}" rx="3.6" ry="8.6" fill="${op.boca}" ${borde(1.6)}/>` +
    `<path d="M${xb + 4},${cy - 5.5} Q${xf - 8},${cy - 8} ${xf - 4},${cy - 8.5}" stroke="#fff" stroke-width="2" opacity="0.45" fill="none" stroke-linecap="round"/>`;
  const cabeza =
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${id}-cab)" ${borde()}/>` +
    `<path d="M${cx - R * 0.75},${cy + R * 0.55} Q${cx},${cy + R * 1.08} ${cx + R * 0.8},${cy + R * 0.5} Q${cx},${cy + R * 0.82} ${cx - R * 0.75},${cy + R * 0.55} Z" fill="${op.oscuro}" opacity="0.45"/>` +
    brillo(cx - R * 0.42, cy - R * 0.5, R * 0.32, R * 0.17, -35, 0.6) +
    ojoPlanta(cx + R * 0.12, cy - R * 0.38, R * 0.2, R * 0.31) +
    ojoPlanta(cx + R * 0.55, cy - R * 0.42, R * 0.17, R * 0.28) +
    (op.frente ?? '');
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(37, 89, 25, 6.5), pivote: [37, 89], z: -10, sinTinte: true },
    { id: 'hojas', svg: rosetaHojas(37, 88), pivote: [37, 88], z: 1 },
    { id: 'tallo', svg: tallo(`M37,88 C35,79 41,70 ${cx},${cy + R - 2}`, 6.5), pivote: [37, 88], z: 2 },
    { id: 'nuca', svg: op.nuca, pivote: [cx - R * 0.7, cy - R * 0.3], padre: 'cabeza', z: 3 },
    { id: 'cabeza', svg: cabeza, pivote: [cx, cy + R - 2], padre: 'tallo', z: 5 },
    { id: 'hocico', svg: hocico, pivote: [xb, cy], padre: 'cabeza', z: 6 },
  ];
  const disparos = op.disparos ?? 1;
  return {
    id,
    nombre: op.nombre,
    ancho: 92,
    alto: 95,
    ancla: [37, 90],
    piezas,
    defs,
    estados: ['quieto', 'ataca', 'herida'],
    duraciones: { ataca: disparos > 1 ? 0.6 : 0.4 },
    puntos: { boca: [xf + 4, cy], cabeza: [cx, cy - R] },
    anim(c) {
      const b = balanceo(c);
      let rt = { x: 0, sx: 1, sy: 1, hocico: 1 };
      if (c.estado === 'ataca') rt = retroceso(disparos > 1 ? (c.fase * 2) % 1 : c.fase);
      const h = c.estado === 'herida' ? herida(c) : { tallo: 0, cabeza: 0 };
      return {
        hojas: { sx: 1 + b.hojas * 0.03, sy: 1 - b.hojas * 0.03 },
        tallo: { rot: b.tallo + h.tallo },
        cabeza: { rot: b.cabeza + h.cabeza, x: rt.x, sx: rt.sx, sy: rt.sy },
        nuca: { rot: onda(c.t, 0.5, c.semilla, 2) * 6 },
        hocico: { sx: rt.hocico, sy: 1 + (rt.hocico - 1) * 0.6 },
      };
    },
  };
}

const COPETE = hoja(22, 26, 17, 5.5, -160, P.verdeOscuro, P.verdeHondo, -0.5) + hoja(23, 22, 13, 4.5, -128, P.hoja, P.verdeHondo, -0.4);

const LANZAGUISANTES = tirador({
  id: 'lanzaguisantes', nombre: 'Lanzaguisantes', claro: '#c9f58a', medio: '#7cc443', oscuro: '#3a7f1c', boca: '#173d0b', radio: 20, nuca: COPETE,
});

const CRESTA_HIELO = (() => {
  const puntas: [number, number, number, number][] = [[24, 30, 15, -150], [22, 22, 17, -128], [27, 16, 16, -104], [34, 13, 13, -82]];
  return puntas
    .map(([x, y, l, a]) => {
      const r = (a * Math.PI) / 180;
      const tx = x + Math.cos(r) * l, ty = y + Math.sin(r) * l;
      const nx = -Math.sin(r) * 4.5, ny = Math.cos(r) * 4.5;
      return (
        `<path d="M${x + nx},${y + ny} L${tx},${ty} L${x - nx},${y - ny} Z" fill="${P.hieloClaro}" ${borde(2.2)}/>` +
        `<path d="M${x},${y} L${tx * 0.7 + x * 0.3},${ty * 0.7 + y * 0.3}" stroke="#fff" stroke-width="1.6" opacity="0.8"/>`
      );
    })
    .join('');
})();

const ESCARCHA =
  `<path d="M28,47 l2,-2 l2,2 l-2,2 Z M45,50 l1.5,-1.5 l1.5,1.5 l-1.5,1.5 Z" fill="#fff" opacity="0.85"/>` +
  `<path d="M22,40 Q24,36 28,36" stroke="#fff" stroke-width="1.6" opacity="0.6" fill="none"/>`;

const HIELAGUISANTES = tirador({
  id: 'hielaguisantes', nombre: 'Hielaguisantes', claro: '#eefaff', medio: P.hielo, oscuro: P.hieloOscuro, boca: '#16496b', radio: 20,
  nuca: CRESTA_HIELO, frente: ESCARCHA,
});

const CEJAS_HOJA =
  hoja(36, 20, 13, 3.6, -14, P.verdeHondo, null, 0.3) + hoja(51, 18.5, 11, 3.2, 8, P.verdeHondo, null, 0.2);

const REPETIDORA = tirador({
  id: 'repetidora', nombre: 'Repetidora', claro: '#a6e06a', medio: '#4e9a2a', oscuro: '#25600f', boca: '#0f300a', radio: 22,
  nuca: COPETE + hoja(20, 33, 15, 5, 168, P.verdeHondo, P.verdeHondo, -0.6),
  frente: CEJAS_HOJA, disparos: 2,
});

// ---------------------------------------------------------------------------------------------------------------
// Girasol

const GIRASOL: DefPersonaje = (() => {
  const cx = 45, cy = 37;
  const petalos = (n: number, dist: number, rx: number, ry: number, color: string, borde2: string, giro: number) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (i * 360) / n + giro;
      s += `<ellipse cx="${cx}" cy="${cy - dist}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${cx} ${cy})" fill="${color}" stroke="${borde2}" stroke-width="1.2"/>`;
    }
    return s;
  };
  const corona = (dist: number, ry: number) => `<circle cx="${cx}" cy="${cy}" r="${dist + ry - 0.5}" fill="none" stroke="none"/>`;
  const defs =
    radial('gs-cara', [[0, '#f7b94f'], [0.6, '#dc8b26'], [1, '#a65a14']], 0.5, 0.5, 0.55, 0.4, 0.35) +
    lineal('gs-pet', [[0, '#fff27a'], [0.6, P.amarillo], [1, P.amarilloOscuro]]);
  // Contorno exterior de la corona: se dibuja más grueso detrás.
  const petalosAtras =
    `<g stroke="${TINTA}" stroke-width="${TRAZO * 2}">${petalos(14, 19, 6.4, 10.5, TINTA, TINTA, 12.85)}</g>` +
    petalos(14, 19, 6.4, 10.5, P.amarilloOscuro, '#c27a0c', 12.85);
  const petalosDelante =
    `<g>${petalos(14, 18, 6, 10, 'url(#gs-pet)', '#d99211', 0)}</g>` + corona(18, 10);
  const cara =
    `<circle cx="${cx}" cy="${cy}" r="14.5" fill="url(#gs-cara)" ${borde()}/>` +
    `<circle cx="${cx}" cy="${cy}" r="11.5" fill="none" stroke="#8a4a10" stroke-width="1" opacity="0.4" stroke-dasharray="1.2 2.4"/>` +
    ojoPlanta(cx - 3, cy - 3.5, 2.7, 4.1) +
    ojoPlanta(cx + 5.5, cy - 3.5, 2.7, 4.1) +
    `<path d="M${cx - 6},${cy + 3.5} Q${cx + 1.5},${cy + 12} ${cx + 9},${cy + 3.5} Q${cx + 1.5},${cy + 7} ${cx - 6},${cy + 3.5} Z" fill="#4a1e06" ${borde(1.6)}/>` +
    `<ellipse cx="${cx - 7.5}" cy="${cy + 2.5}" rx="2.6" ry="1.6" fill="#ff7b59" opacity="0.45"/>` +
    `<ellipse cx="${cx + 11}" cy="${cy + 2.5}" rx="2.4" ry="1.5" fill="#ff7b59" opacity="0.45"/>` +
    brillo(cx - 6, cy - 8, 4, 2, -30, 0.4);
  const resplandor = `<circle cx="${cx}" cy="${cy}" r="30" fill="#fffbd0" opacity="0.55"/><circle cx="${cx}" cy="${cy}" r="20" fill="#fff" opacity="0.6"/>`;
  const hojas =
    hoja(43, 86, 30, 9, 194, P.hoja, P.verdeHondo, -0.6) + hoja(47, 86, 30, 9, -14, P.hoja, P.verdeHondo, 0.6) +
    hoja(44, 87, 20, 6.5, 208, P.verdeOscuro, P.verdeHondo, -0.3) + hoja(46, 87, 20, 6.5, -28, P.verdeOscuro, P.verdeHondo, 0.3);
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(45, 89, 24, 6), pivote: [45, 89], z: -10, sinTinte: true },
    { id: 'hojas', svg: hojas, pivote: [45, 87], z: 1 },
    { id: 'tallo', svg: tallo(`M45,88 C47,78 42,66 ${cx},${cy + 15}`, 6.5), pivote: [45, 88], z: 2 },
    { id: 'petalos_atras', svg: petalosAtras, pivote: [cx, cy], padre: 'cabeza', z: 3 },
    { id: 'petalos', svg: petalosDelante, pivote: [cx, cy], padre: 'cabeza', z: 4 },
    { id: 'cabeza', svg: cara, pivote: [cx, cy + 15], padre: 'tallo', z: 5 },
    { id: 'resplandor', svg: resplandor, pivote: [cx, cy], padre: 'cabeza', z: 6 },
  ];
  return {
    id: 'girasol', nombre: 'Girasol', ancho: 90, alto: 95, ancla: [45, 89], piezas, defs,
    estados: ['quieto', 'ataca', 'herida'],
    duraciones: { ataca: 1.2 },
    puntos: { sol: [cx, cy], cabeza: [cx, cy - 28] },
    anim(c) {
      // Se mece de lado a lado como bailando; 'ataca' = brilla al producir sol.
      const s = c.semilla;
      const m = onda(c.t, 0.42, s);
      const h = c.estado === 'herida' ? herida(c) : { tallo: 0, cabeza: 0 };
      const brilla = c.estado === 'ataca' ? Math.sin(c.fase * Math.PI) : 0;
      return {
        hojas: { sx: 1 + onda(c.t, 0.42, s, 0.5) * 0.04 },
        tallo: { rot: m * 5 + h.tallo },
        cabeza: { rot: onda(c.t, 0.42, s, 0.8) * 7 + h.cabeza, sx: 1 + brilla * 0.06, sy: 1 + brilla * 0.06 },
        petalos: { rot: onda(c.t, 0.42, s, 1.6) * 3 },
        petalos_atras: { rot: -onda(c.t, 0.42, s, 1.6) * 2 },
        resplandor: { alfa: brilla * 0.85, oculto: brilla <= 0.01, sx: 0.8 + brilla * 0.3, sy: 0.8 + brilla * 0.3 },
      };
    },
  };
})();

// ---------------------------------------------------------------------------------------------------------------
// Nuez

const NUEZ: DefPersonaje = (() => {
  const forma = 'M40,14 C58,13 69,33 69,54 C69,74 57,87 40,87 C23,87 11,74 11,54 C11,33 22,15 40,14 Z';
  const formaRota = 'M40,14 C50,13 56,17 60,23 L53,27 L60,32 L56,37 L66,40 C68,45 69,50 69,54 C69,74 57,87 40,87 C23,87 11,74 11,54 C11,33 22,15 40,14 Z';
  const defs = volumen('nz', '#ecbd7e', P.cafeClaro, '#875022', 0.32, 0.25);
  const vetas =
    `<path d="M22,30 Q18,48 22,68 M58,30 Q63,50 57,70 M30,78 Q40,82 50,78" fill="none" stroke="#8a5426" stroke-width="1.6" opacity="0.55" stroke-linecap="round"/>` +
    `<path d="M27,20 Q33,17 38,18" fill="none" stroke="#fff" stroke-width="2" opacity="0.35" stroke-linecap="round"/>` +
    `<circle cx="20" cy="58" r="1.2" fill="#8a5426" opacity="0.5"/><circle cx="62" cy="62" r="1.2" fill="#8a5426" opacity="0.5"/><circle cx="34" cy="76" r="1" fill="#8a5426" opacity="0.5"/>`;
  const grieta1 = `<path d="M50,15.5 L46,23 L51,27 L47,33" fill="none" stroke="${TINTA}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M13,60 L19,62 L17,68 L23,71" fill="none" stroke="${TINTA}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const grieta2 = grieta1 +
    `<path d="M25,20 L28,29 L23,34 L27,40" fill="none" stroke="${TINTA}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M67,58 L61,62 L64,68 L58,72 L60,79" fill="none" stroke="${TINTA}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M38,86 L40,79 L36,75" fill="none" stroke="${TINTA}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const cuerpo = (d: string, extra: string) => `<path d="${d}" fill="url(#nz)" ${borde()}/>` + vetas + brillo(25, 30, 7, 4, -50, 0.35) + extra;
  const hueco = `<path d="M60,23 L53,27 L60,32 L56,37 L66,40 C64,32 62,27 60,23 Z" fill="#f4dcb0" opacity="0.9"/>`;
  const ojos =
    `<ellipse cx="31" cy="44" rx="7.6" ry="9.6" fill="#fff" ${borde(2.2)}/>` +
    `<ellipse cx="48" cy="43" rx="8.2" ry="10.2" fill="#fff" ${borde(2.2)}/>`;
  const pupilas =
    `<circle cx="33.5" cy="45" r="3.9" fill="#120c06"/><circle cx="32.3" cy="43.6" r="1.3" fill="#fff"/>` +
    `<circle cx="51" cy="44" r="4.1" fill="#120c06"/><circle cx="49.7" cy="42.6" r="1.4" fill="#fff"/>`;
  const parpados =
    `<path d="M23.4,44 C23.4,32 38.6,32 38.6,44 Z" fill="#b97c3e" ${borde(2)}/>` +
    `<path d="M39.8,43 C39.8,30 56.2,30 56.2,43 Z" fill="#b97c3e" ${borde(2)}/>`;
  const cejasMedio = `<path d="M24,32 L36,30" ${borde(2.6)}/><path d="M42,29 L55,31" ${borde(2.6)}/>`;
  const cejasMal =
    `<path d="M24,33 L37,28" ${borde(2.8)}/><path d="M42,27 L56,32" ${borde(2.8)}/>` +
    `<path d="M33,64 Q36,61 39,64 Q42,67 45,64" fill="none" ${borde(2)}/>` +
    `<path d="M63,36 C61,40 61,43 63,44 C65,43 65,40 63,36 Z" fill="#9fe0ff" ${borde(1.2)}/>`;
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(40, 86, 27, 6.5), pivote: [40, 86], z: -10, sinTinte: true },
    { id: 'cuerpo', svg: cuerpo(forma, ''), pivote: [40, 86], z: 1, estados: { agrietada: cuerpo(forma, grieta1), muy_agrietada: cuerpo(formaRota, hueco + grieta2) } },
    { id: 'ojos', svg: ojos, pivote: [40, 44], padre: 'cuerpo', z: 2 },
    { id: 'pupilas', svg: pupilas, pivote: [40, 44], padre: 'ojos', z: 3 },
    { id: 'parpados', svg: parpados, pivote: [40, 32], padre: 'ojos', z: 4 },
    { id: 'cejas', svg: '<g/>', pivote: [40, 30], padre: 'cuerpo', z: 5, estados: { agrietada: cejasMedio, muy_agrietada: cejasMal } },
  ];
  return {
    id: 'nuez', nombre: 'Nuez', ancho: 80, alto: 90, ancla: [40, 86], piezas, defs,
    estados: ['quieto', 'herida'],
    variantes: { dano: { piezas: ['cuerpo', 'cejas'], valores: ['intacta', 'agrietada', 'muy_agrietada'] } },
    puntos: { cabeza: [40, 16] },
    anim(c) {
      const s = c.semilla;
      // Mira a los lados cada tanto y parpadea.
      const ciclo = (c.t * 0.25 + (s % 7) * 0.13) % 1;
      const mira = ciclo < 0.3 ? 0 : ciclo < 0.55 ? 1 : ciclo < 0.8 ? -0.6 : 0;
      const parp = ((c.t + (s % 5)) % 3.7) < 0.14;
      const miedo = c.estado === 'herida' ? Math.sin(c.t * 40) * 0.6 : 0;
      return {
        cuerpo: { rot: onda(c.t, 0.3, s) * 1.2, sy: 1 + onda(c.t, 0.6, s) * 0.012, sx: 1 - onda(c.t, 0.6, s) * 0.01 },
        pupilas: { x: mira * 2.6 + miedo, y: c.estado === 'herida' ? 1.2 : 0 },
        parpados: { oculto: !parp },
      };
    },
  };
})();

// ---------------------------------------------------------------------------------------------------------------
// Petacereza

const PETACEREZA: DefPersonaje = (() => {
  const defs =
    radial('pc-c', [[0, '#ff8a7a'], [0.35, '#f0362f'], [0.8, P.rojo], [1, '#7d0f12']], 0.45, 0.42, 0.6, 0.33, 0.28) +
    radial('pc-i', [[0, '#ffd27a'], [0.35, '#ff5a2a'], [0.8, '#e0121a'], [1, '#8a0a0a']], 0.45, 0.42, 0.6, 0.33, 0.28);
  const cereza = (cx: number, cy: number, r: number, grad: string, gritando: boolean) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${grad})" ${borde()}/>` +
    brillo(cx - r * 0.45, cy - r * 0.45, r * 0.32, r * 0.18, -40, 0.7) +
    // cejas fruncidas
    `<path d="M${cx - r * 0.42},${cy - r * 0.42} L${cx + r * 0.02},${cy - r * 0.16}" ${borde(3.2)}/>` +
    `<path d="M${cx + r * 0.72},${cy - r * 0.46} L${cx + r * 0.3},${cy - r * 0.18}" ${borde(3.2)}/>` +
    // ojos entrecerrados
    `<path d="M${cx - r * 0.34},${cy - r * 0.08} Q${cx - r * 0.14},${cy + r * 0.18} ${cx + r * 0.04},${cy - r * 0.02} Z" fill="#120c06"/>` +
    `<path d="M${cx + r * 0.32},${cy - r * 0.04} Q${cx + r * 0.52},${cy + r * 0.2} ${cx + r * 0.68},${cy - r * 0.08} Z" fill="#120c06"/>` +
    (gritando
      ? `<ellipse cx="${cx + r * 0.2}" cy="${cy + r * 0.45}" rx="${r * 0.36}" ry="${r * 0.28}" fill="#3a0606" ${borde(1.8)}/>` +
        `<path d="M${cx - r * 0.1},${cy + r * 0.3} L${cx + r * 0.5},${cy + r * 0.3}" stroke="#fff" stroke-width="2.2"/>`
      : `<rect x="${cx - r * 0.18}" y="${cy + r * 0.28}" width="${r * 0.72}" height="${r * 0.3}" rx="2" fill="#fff" ${borde(1.7)}/>` +
        `<path d="M${cx + r * 0.06},${cy + r * 0.28} v${r * 0.3} M${cx + r * 0.3},${cy + r * 0.28} v${r * 0.3}" stroke="${TINTA}" stroke-width="1.2"/>`);
  const tallos =
    tallo('M30,46 C31,34 38,22 46,16', 3.2, '#4c9a26') + tallo('M58,38 C57,30 52,22 46,16', 3.2, '#4c9a26') +
    hoja(46, 16, 19, 6.5, -24, P.hoja, P.verdeHondo, -0.3) + hoja(45, 16, 13, 4.5, -150, P.verdeOscuro, P.verdeHondo, 0.4);
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(45, 80, 30, 7), pivote: [45, 80], z: -10, sinTinte: true },
    { id: 'tallos', svg: tallos, pivote: [46, 17], z: 1 },
    { id: 'cereza_a', svg: cereza(30, 61, 17, 'pc-c', false), pivote: [30, 61], z: 2, estados: { inflada: cereza(30, 61, 17, 'pc-i', true) } },
    { id: 'cereza_b', svg: cereza(58, 55, 18, 'pc-c', false), pivote: [58, 55], z: 3, estados: { inflada: cereza(58, 55, 18, 'pc-i', true) } },
  ];
  return {
    id: 'petacereza', nombre: 'Petacereza', ancho: 92, alto: 86, ancla: [45, 80], piezas, defs,
    estados: ['quieto', 'inflandose'],
    duraciones: { inflandose: 1.1 },
    anim(c) {
      // Tiemblan impacientes; al inflarse crecen, enrojecen y tiemblan más.
      const f = c.estado === 'inflandose' ? c.fase : 0;
      const amp = 0.5 + f * 2.6;
      const j = (k: number) => Math.sin(c.t * (31 + k * 7) + k * 2.1 + c.semilla) * amp;
      const crece = 1 + suave(f) * 0.32;
      const v = f > 0.35 ? 'inflada' : undefined;
      return {
        tallos: { rot: Math.sin(c.t * 3 + c.semilla) * 2 + j(3) * 0.6 },
        cereza_a: { x: j(1), y: j(2) * 0.5, sx: crece, sy: crece, variante: v },
        cereza_b: { x: j(4), y: j(5) * 0.5, sx: crece * 1.02, sy: crece * 1.02, variante: v },
      };
    },
  };
})();

// ---------------------------------------------------------------------------------------------------------------
// Patatapum

const PATATAPUM: DefPersonaje = (() => {
  const defs = volumen('pp', '#eac384', '#c4914f', '#7d5226', 0.35, 0.25) + lineal('pp-t', [[0, '#8a5a2e'], [1, '#5a3517']]);
  const papa =
    `<path d="M19,58 C17,44 28,35 41,35 C55,35 63,45 62,57 C62,67 52,72 40,72 C28,72 20,67 19,58 Z" fill="url(#pp)" ${borde()}/>` +
    `<circle cx="27" cy="52" r="1.6" fill="#8a5a2e" opacity="0.7"/><circle cx="33" cy="43" r="1.2" fill="#8a5a2e" opacity="0.7"/><circle cx="56" cy="61" r="1.4" fill="#8a5a2e" opacity="0.7"/>` +
    brillo(30, 42, 6, 3, -25, 0.45) +
    ojoPlanta(44, 49, 2.6, 3.4) + ojoPlanta(53, 48.5, 2.4, 3.2) +
    `<path d="M47,54 C49,52.5 51,52.5 52.5,54" fill="none" ${borde(1.6)}/>` +
    `<path d="M46.5,56.5 L49.5,56.5 L49.5,61 L46.5,61 Z M49.8,56.5 L53,56.5 L53,60.5 L49.8,60.5 Z" fill="#fff" ${borde(1.4)}/>`;
  const tierra = (ancho: number, alto: number) =>
    `<path d="M${40 - ancho},74 C${40 - ancho * 0.8},${74 - alto} ${40 - ancho * 0.35},${74 - alto * 1.1} 40,${74 - alto * 1.1} C${40 + ancho * 0.35},${74 - alto * 1.1} ${40 + ancho * 0.8},${74 - alto} ${40 + ancho},74 Z" fill="url(#pp-t)" ${borde()}/>` +
    `<circle cx="${40 - ancho * 0.5}" cy="${74 - alto * 0.5}" r="2.4" fill="#6b4220" ${borde(1.2)}/>` +
    `<circle cx="${40 + ancho * 0.45}" cy="${74 - alto * 0.55}" r="2" fill="#6b4220" ${borde(1.2)}/>` +
    `<circle cx="${40 + ancho * 0.05}" cy="${74 - alto * 0.85}" r="1.7" fill="#9a6a3a" ${borde(1)}/>`;
  const antena =
    `<path d="M40,37 C40,31 38,27 37,22" fill="none" stroke="${TINTA}" stroke-width="4"/>` +
    `<path d="M40,37 C40,31 38,27 37,22" fill="none" stroke="#9aa2aa" stroke-width="2"/>`;
  const luz = (color: string, halo: boolean) =>
    (halo ? `<circle cx="37" cy="19" r="10" fill="#ff4b3a" opacity="0.28"/><circle cx="37" cy="19" r="7" fill="#ff6b4a" opacity="0.35"/>` : '') +
    `<circle cx="37" cy="19" r="4.6" fill="${color}" ${borde(2)}/><circle cx="35.6" cy="17.6" r="1.4" fill="#fff" opacity="0.8"/>`;
  // Estallido de cómic con el letrero y terrones que salen volando.
  const puntas = (() => {
    let d = '';
    const n = 14;
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? 22 : 40 + (i % 4 === 0 ? 6 : 0);
      const a = (i / (n * 2)) * Math.PI * 2;
      d += (i ? 'L' : 'M') + (40 + Math.cos(a) * r * 1.25).toFixed(1) + ',' + (48 + Math.sin(a) * r * 0.8).toFixed(1);
    }
    return d + 'Z';
  })();
  const estallido =
    `<path d="${puntas}" fill="#ffcf2e" ${borde(3)}/>` +
    `<ellipse cx="40" cy="48" rx="34" ry="20" fill="#fff4b0" opacity="0.8"/>` +
    `<text x="40" y="55" text-anchor="middle" font-family="'Arial Black','Impact','Liberation Sans','DejaVu Sans',sans-serif" font-weight="900" font-size="17" fill="#ff7a12" stroke="${TINTA}" stroke-width="2.4" paint-order="stroke" transform="rotate(-6 40 50)">¡PATAPUM!</text>`;
  const terrones = [[-30, -14], [-18, -30], [6, -36], [28, -24], [36, -6], [-36, 4], [18, -40]]
    .map(([dx, dy], i) => `<path d="M${40 + dx - 3},${50 + dy} l3,-3 l4,1 l1,4 l-4,3 Z" fill="${i % 2 ? '#7a4a22' : '#c4914f'}" ${borde(1.3)}/>`)
    .join('');
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(40, 73, 24, 5.5), pivote: [40, 73], z: -10, sinTinte: true },
    { id: 'antena', svg: antena, pivote: [40, 37], z: 1 },
    { id: 'luz', svg: luz('#8e1418', false), pivote: [37, 19], padre: 'antena', z: 2, estados: { encendida: luz('#ff3b30', true) } },
    { id: 'papa', svg: papa, pivote: [40, 72], z: 3 },
    { id: 'tierra', svg: tierra(28, 12), pivote: [40, 74], z: 6, estados: { plana: tierra(20, 7) } },
    { id: 'terrones', svg: terrones, pivote: [40, 50], z: 7 },
    { id: 'estallido', svg: estallido, pivote: [40, 48], z: 8 },
  ];
  return {
    id: 'patatapum', nombre: 'Patatapum', ancho: 80, alto: 80, ancla: [40, 74], piezas, defs,
    estados: ['armada', 'enterrada', 'explota'],
    duraciones: { explota: 0.9 },
    anim(c) {
      if (c.estado === 'explota') {
        const f = c.fase;
        const k = suave(tramo(f, 0, 0.35));
        return {
          antena: { oculto: true }, papa: { oculto: true }, sombra: { oculto: true },
          tierra: { variante: 'plana', alfa: 1 - tramo(f, 0.2, 0.6) },
          estallido: { sx: 0.3 + k * 0.95, sy: 0.3 + k * 0.95, alfa: 1 - tramo(f, 0.7, 1), rot: -4 + k * 4 },
          terrones: { sx: 0.4 + f * 1.4, sy: 0.4 + f * 1.4, y: f * f * 30, alfa: 1 - tramo(f, 0.55, 1) },
        };
      }
      if (c.estado === 'enterrada') {
        // Solo asoma la antena (apagada) en un montoncito de tierra.
        return {
          papa: { oculto: true }, estallido: { oculto: true }, terrones: { oculto: true },
          antena: { y: 30, rot: onda(c.t, 0.4, c.semilla) * 4 },
          tierra: { variante: 'plana' }, sombra: { sx: 0.7 },
        };
      }
      // 'armada': la luz parpadea (más rápido con vel > 1, cuando hay un zombi cerca).
      const v = c.vel ?? 1;
      const enc = Math.sin(c.t * Math.PI * 2 * 1.2 * v + c.semilla) > 0.1;
      return {
        estallido: { oculto: true }, terrones: { oculto: true },
        papa: { sy: 1 + onda(c.t, 0.8, c.semilla) * 0.025, sx: 1 - onda(c.t, 0.8, c.semilla) * 0.02 },
        antena: { rot: onda(c.t, 0.5, c.semilla) * 5 },
        luz: { variante: enc ? 'encendida' : undefined },
      };
    },
  };
})();

// ---------------------------------------------------------------------------------------------------------------
// Planta carnívora

const CARNIVORA: DefPersonaje = (() => {
  const defs =
    volumen('cv', '#d99bf0', P.morado, '#4b1a5f', 0.3, 0.2) +
    lineal('cv-b', [[0, '#ff9ab0'], [0.5, '#e0456a'], [1, '#7a1030']]) +
    lineal('cv-inf', [[0, '#b46ad0'], [1, '#5e2275']]);
  const espinas = [[50, 21, -110], [62, 16, -95], [74, 16, -80], [85, 21, -62]]
    .map(([x, y, a]) => {
      const r = (a * Math.PI) / 180;
      const tx = x + Math.cos(r) * 8, ty = y + Math.sin(r) * 8;
      const nx = -Math.sin(r) * 3, ny = Math.cos(r) * 3;
      return `<path d="M${x + nx},${y + ny} L${tx},${ty} L${x - nx},${y - ny} Z" fill="#e8f7c8" ${borde(1.8)}/>`;
    })
    .join('');
  const manchas = `<circle cx="58" cy="30" r="3.2" fill="#e7b6f5" opacity="0.6"/><circle cx="72" cy="28" r="2.4" fill="#e7b6f5" opacity="0.6"/><circle cx="46" cy="38" r="2.2" fill="#e7b6f5" opacity="0.5"/>`;
  const sup =
    espinas +
    `<path d="M46,66 C33,60 30,36 43,25 C56,14 80,13 95,26 C102,32 105,41 101,49 C88,46 72,48 54,60 Z" fill="url(#cv)" ${borde()}/>` +
    manchas + brillo(52, 28, 7, 3.5, -25, 0.45) +
    dientes(60, 98, 51.5, 5, 7.5, '#fffbea');
  const inf =
    `<path d="M51,66 C65,61 82,59 99,61 C101,68 93,80 77,83 C63,85 51,80 47,71 Z" fill="url(#cv-inf)" ${borde()}/>` +
    dientes(64, 97, 62.5, 4, -6.5, '#fffbea') +
    `<path d="M58,77 Q72,82 88,76" fill="none" stroke="#3e1050" stroke-width="1.5" opacity="0.5"/>`;
  const garganta =
    `<path d="M50,63 C60,50 86,44 101,50 L100,63 C84,60 66,62 50,67 Z" fill="url(#cv-b)" ${borde(2)}/>` +
    `<path d="M62,61 C70,56 82,55 92,58 C86,61 74,62 62,61 Z" fill="#ff7b9a" opacity="0.8"/>`;
  const cerrada =
    espinas +
    `<path d="M42,70 C27,60 29,30 50,21 C72,12 99,22 104,44 C107,62 95,79 74,82 C60,84 48,80 42,70 Z" fill="url(#cv)" ${borde()}/>` +
    manchas + brillo(52, 30, 8, 4, -25, 0.45) +
    `<path d="M58,58 L64,62 L70,57 L76,62 L82,57 L88,61 L94,56 L101,58" fill="none" ${borde(2.4)}/>` +
    dientes(62, 74, 58, 2, 4.5, '#fffbea') + dientes(82, 94, 57.5, 2, 4.5, '#fffbea') +
    `<ellipse cx="80" cy="70" rx="13" ry="7" fill="#c77fe0" opacity="0.4"/>`;
  const hojas =
    hoja(38, 102, 28, 8, 196, P.hoja, P.verdeHondo, -0.6) + hoja(42, 102, 30, 8, -12, P.hoja, P.verdeHondo, 0.6) +
    hoja(40, 103, 20, 6, 214, P.verdeOscuro, P.verdeHondo, -0.3);
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(42, 104, 27, 6.5), pivote: [42, 104], z: -10, sinTinte: true },
    { id: 'hojas', svg: hojas, pivote: [40, 102], z: 1 },
    { id: 'tallo', svg: tallo('M40,103 C35,92 50,82 48,66', 9), pivote: [40, 103], z: 2 },
    { id: 'garganta', svg: garganta, pivote: [50, 64], padre: 'tallo', z: 3 },
    { id: 'mandibula_inf', svg: inf, pivote: [50, 66], padre: 'tallo', z: 4 },
    { id: 'mandibula_sup', svg: sup, pivote: [49, 62], padre: 'tallo', z: 5 },
    { id: 'cerrada', svg: cerrada, pivote: [48, 66], padre: 'tallo', z: 6 },
  ];
  return {
    id: 'carnivora', nombre: 'Planta carnívora', ancho: 110, alto: 108, ancla: [42, 104], piezas, defs,
    estados: ['quieto', 'ataca', 'masticando', 'herida'],
    duraciones: { ataca: 0.7 },
    puntos: { boca: [96, 56], cabeza: [62, 16] },
    anim(c) {
      const s = c.semilla;
      if (c.estado === 'masticando') {
        const m = Math.sin(c.t * 7 + s);
        return {
          tallo: { rot: onda(c.t, 0.4, s) * 2 },
          garganta: { oculto: true }, mandibula_inf: { oculto: true }, mandibula_sup: { oculto: true },
          cerrada: { sx: 1 + m * 0.05, sy: 1 - m * 0.06, rot: m * 2 },
        };
      }
      let lanza = 0, abre = 0, cierra = 0;
      if (c.estado === 'ataca') {
        const f = c.fase;
        lanza = f < 0.45 ? suave(f / 0.45) : 1 - suave((f - 0.45) / 0.55);
        abre = f < 0.35 ? suave(f / 0.35) : 0;
        cierra = f < 0.35 ? 0 : f < 0.5 ? suave((f - 0.35) / 0.15) : 1;
      }
      const ansia = onda(c.t, 0.9, s);
      const h = c.estado === 'herida' ? herida(c) : { tallo: 0, cabeza: 0 };
      const supRot = -6 + ansia * 4 - abre * 16 + cierra * 15;
      const infRot = 4 + ansia * 3 + abre * 12 - cierra * 10;
      return {
        tallo: { rot: onda(c.t, 0.45, s) * 3 + lanza * 22 + h.tallo, x: lanza * 6 },
        mandibula_sup: { rot: supRot + h.cabeza * 0.5 },
        mandibula_inf: { rot: infRot },
        garganta: { oculto: cierra > 0.9 },
        cerrada: { oculto: true },
      };
    },
  };
})();

// ---------------------------------------------------------------------------------------------------------------
// Seta desesporada

const DESESPORADA: DefPersonaje = (() => {
  const defs =
    volumen('sd', '#e2c8ff', '#a77ad6', '#5b2c88', 0.35, 0.2) +
    lineal('sd-c', [[0, '#f6eefe'], [1, '#c6b0e0']]);
  const cuerpo = (dormida: boolean) =>
    `<path d="M19,51 C17,44 18,36 22,31 L39,31 C42,35 43,40 42,44 C42,48 40,51 37,52 L22,52 C20,52 19,52 19,51 Z" fill="url(#sd-c)" ${borde()}/>` +
    `<path d="M40,40 L48,38.5 C51,38 52.5,40.5 52.5,43 C52.5,45.5 51,47.5 48,47 L41,46 Z" fill="url(#sd-c)" ${borde()}/>` +
    `<ellipse cx="52.3" cy="42.8" rx="2" ry="3.6" fill="#4a2a6a" ${borde(1.4)}/>` +
    (dormida
      ? `<path d="M27,40 Q29.5,42.5 32,40 M34.5,40 Q37,42.5 39.5,40" fill="none" ${borde(1.8)}/>`
      : ojoPlanta(29.5, 40, 2.1, 3.1) + ojoPlanta(37, 39.5, 1.9, 2.9));
  const sombrero =
    `<path d="M9,32 C8,15 45,9 50,29 C51,35 44,37 30,37 C17,37 9,37 9,32 Z" fill="url(#sd)" ${borde()}/>` +
    `<ellipse cx="20" cy="23" rx="4" ry="2.6" fill="#ecdcff" opacity="0.85"/><ellipse cx="33" cy="17" rx="3.2" ry="2" fill="#ecdcff" opacity="0.85"/>` +
    `<ellipse cx="42" cy="25" rx="2.6" ry="1.8" fill="#ecdcff" opacity="0.85"/><ellipse cx="27" cy="30" rx="2.2" ry="1.4" fill="#ecdcff" opacity="0.7"/>` +
    brillo(17, 18, 5, 2, -30, 0.45);
  const zzz =
    `<text x="44" y="14" font-family="'Arial Black','Liberation Sans','DejaVu Sans',sans-serif" font-weight="900" font-size="9" fill="#e9f0ff" stroke="${TINTA}" stroke-width="1.6" paint-order="stroke">z</text>` +
    `<text x="50" y="6" font-family="'Arial Black','Liberation Sans','DejaVu Sans',sans-serif" font-weight="900" font-size="12" fill="#e9f0ff" stroke="${TINTA}" stroke-width="1.8" paint-order="stroke">Z</text>`;
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(30, 52, 17, 4.5), pivote: [30, 52], z: -10, sinTinte: true },
    { id: 'cuerpo', svg: cuerpo(false), pivote: [30, 52], z: 1, estados: { dormida: cuerpo(true) } },
    { id: 'sombrero', svg: sombrero, pivote: [30, 36], padre: 'cuerpo', z: 2 },
    { id: 'zzz', svg: zzz, pivote: [46, 12], z: 3 },
  ];
  return {
    id: 'desesporada', nombre: 'Seta desesporada', ancho: 62, alto: 56, ancla: [30, 52], piezas, defs,
    estados: ['quieto', 'ataca', 'dormida', 'herida'],
    duraciones: { ataca: 0.45 },
    puntos: { boca: [54, 43], cabeza: [30, 14] },
    anim(c) {
      const s = c.semilla;
      const r = onda(c.t, 0.7, s);
      if (c.estado === 'dormida') {
        const z = (c.t * 0.45 + (s % 3) * 0.2) % 1;
        return {
          cuerpo: { variante: 'dormida', sy: 1 + Math.sin(c.t * 1.6 + s) * 0.04, sx: 1 - Math.sin(c.t * 1.6 + s) * 0.02 },
          sombrero: { rot: Math.sin(c.t * 1.6 + s) * 2 },
          zzz: { alfa: Math.sin(z * Math.PI), y: -z * 8, x: z * 3, sx: 0.7 + z * 0.4, sy: 0.7 + z * 0.4 },
        };
      }
      let sq = 0;
      if (c.estado === 'ataca') {
        const f = c.fase;
        sq = f < 0.4 ? -suave(f / 0.4) * 0.16 : mezclar(0.12, 0, suave((f - 0.4) / 0.6));
      }
      const h = c.estado === 'herida' ? 3 : 0;
      return {
        cuerpo: { sy: 1 + r * 0.035 + sq, sx: 1 - r * 0.02 - sq * 0.4, rot: h },
        sombrero: { rot: onda(c.t, 0.7, s, 1) * 3, y: -sq * 4 },
        zzz: { oculto: true },
      };
    },
  };
})();

// ---------------------------------------------------------------------------------------------------------------
// Zombis

const PIEZAS_ZOMBI_BASE = (id: string, op: Parameters<typeof zombiBase>[0] = { id }) => zombiBase({ ...op, id });

function defZombi(id: string, nombre: string, extra: { piezas: DefPieza[]; defs: string }, anim: (c: CtxAnim) => Pose, mas: Partial<DefPersonaje> = {}): DefPersonaje {
  return {
    id, nombre, ancho: MARCO_ZOMBI.ancho, alto: MARCO_ZOMBI.alto, ancla: MARCO_ZOMBI.ancla,
    piezas: extra.piezas, defs: extra.defs,
    estados: ['camina', 'come', 'quieto', 'sincabeza', 'muere', 'ceniza'],
    duraciones: { muere: 1.3, ceniza: 1.6 },
    perdidas: { ...PERDIDAS_ZOMBI },
    puntos: { cabeza: [48, 8], boca: [32, 54] },
    anim, ...mas,
  };
}

const ZOMBI = defZombi('zombi', 'Zombi', PIEZAS_ZOMBI_BASE('zombi'), (c) => animZombi(c));

// Abanderado: sostiene en alto un palo con la bandera roja del cerebro (en la mano lejana, así la conserva si pierde
// el brazo cercano). El palo y la bandera se dibujan «colgando» y la mano los gira 180° hasta dejarlos arriba.
const ABANDERADO: DefPersonaje = (() => {
  const base = PIEZAS_ZOMBI_BASE('abanderado');
  const [mx, my] = HUESOS_ZOMBI.munecaDer;
  const asta =
    `<path d="M${mx},${my - 6} L${mx},${my + 92}" stroke="${TINTA}" stroke-width="6.4" stroke-linecap="round"/>` +
    `<path d="M${mx},${my - 6} L${mx},${my + 92}" stroke="#a8743e" stroke-width="3.6" stroke-linecap="round"/>` +
    `<path d="M${mx - 0.8},${my} L${mx - 0.8},${my + 88}" stroke="#d6a56a" stroke-width="1.1" opacity="0.7"/>` +
    // la mano por encima del palo
    `<path d="M${mx - 4},${my + 1} C${mx - 5},${my + 7} ${mx + 4},${my + 8} ${mx + 4},${my + 2} Z" fill="${P.pielOscura}" ${borde(1.8)}/>`;
  // Bandera (colgando: tras el giro queda arriba y ondea hacia atrás, a la derecha).
  const by = my + 58, bx = mx;
  const cerebro = (x: number, y: number) =>
    `<path d="M${x - 9},${y} C${x - 11},${y - 6} ${x - 5},${y - 9} ${x - 1},${y - 7} C${x + 2},${y - 10} ${x + 9},${y - 8} ${x + 9},${y - 3} C${x + 12},${y} ${x + 9},${y + 6} ${x + 4},${y + 5} C${x + 1},${y + 8} ${x - 6},${y + 7} ${x - 7},${y + 4} C${x - 11},${y + 4} ${x - 12},${y + 1} ${x - 9},${y} Z" fill="#f7a6b8" ${borde(1.6)}/>` +
    `<path d="M${x - 5},${y - 3} Q${x - 1},${y - 1} ${x - 2},${y + 3} M${x + 3},${y - 5} Q${x + 1},${y} ${x + 5},${y + 2}" fill="none" stroke="#c4566e" stroke-width="1.2"/>`;
  const tela = (agujeros: boolean) =>
    `<path d="M${bx},${by} L${bx},${by + 32} L${bx - 10},${by + 30} L${bx - 18},${by + 35} L${bx - 28},${by + 29} L${bx - 36},${by + 33} L${bx - 44},${by + 27} C${bx - 46},${by + 18} ${bx - 45},${by + 10} ${bx - 48},${by + 2} C${bx - 32},${by + 6} ${bx - 16},${by - 2} ${bx},${by} Z" fill="#c8262b" ${borde()}/>` +
    `<path d="M${bx - 4},${by + 4} C${bx - 16},${by + 2} ${bx - 28},${by + 8} ${bx - 42},${by + 6}" stroke="#ff6a5a" stroke-width="2" opacity="0.5" fill="none"/>` +
    grupo(cerebro(bx - 23, by + 16), `rotate(180 ${bx - 23} ${by + 16})`) +
    (agujeros
      ? `<circle cx="${bx - 34}" cy="${by + 20}" r="3.6" fill="#2a1a10" ${borde(1.2)}/><circle cx="${bx - 10}" cy="${by + 11}" r="2.6" fill="#2a1a10" ${borde(1.2)}/>` +
        `<path d="M${bx - 20},${by + 30} L${bx - 22},${by + 24} L${bx - 26},${by + 30} Z" fill="#2a1a10"/>`
      : '');
  base.piezas.push(
    { id: 'asta', svg: asta, pivote: [mx, my], padre: 'mano_der', z: 0.3 },
    { id: 'bandera', svg: tela(false), pivote: [bx, by + 2], padre: 'asta', z: 0.25, estados: { agujereada: tela(true) } },
  );
  return defZombi('abanderado', 'Zombi abanderado', base, (c) => {
    const p = animZombi(c, { ciclo: 1.9 });
    const s = c.semilla;
    const ola = Math.sin(c.t * 5 + s);
    // Brazo lejano en alto con el palo vertical: hombro + codo + mano ≈ 180° con el cuerpo.
    const cuerpo = p.cuerpo?.rot ?? 0;
    const brazo = 40 + Math.sin(c.t * 2.2 + s) * 4;
    const ante = 112;
    if (c.estado !== 'muere' && c.estado !== 'ceniza') {
      p.brazo_der = { rot: brazo };
      p.antebrazo_der = { rot: ante };
      p.mano_der = { rot: 180 - cuerpo - brazo - ante + Math.sin(c.t * 2.6 + s) * 4 };
    } else {
      p.mano_der = { rot: 150 };
    }
    p.bandera = { rot: ola * 4, sx: 1 + Math.sin(c.t * 6.5 + s) * 0.06, sy: 1 - Math.sin(c.t * 6.5 + s + 1) * 0.04 };
    return p;
  }, {
    variantes: { bandera: { piezas: ['bandera'], valores: ['entera', 'agujereada'] } },
    perdidas: { ...PERDIDAS_ZOMBI, bandera: { ocultar: ['asta'] } },
  });
})();

// Caracono: cono de tránsito naranja con franjas blancas (intacto, abollado, muy abollado).
const CARACONO: DefPersonaje = (() => {
  const base = PIEZAS_ZOMBI_BASE('caracono');
  base.defs += lineal('cono', [[0, P.conoOscuro], [0.3, P.conoClaro], [0.55, P.cono], [1, P.conoOscuro]], 0, 0, 1, 0) +
    lineal('cono-f', [[0, '#c8c8c0'], [0.35, '#ffffff'], [1, '#b8b8b0']], 0, 0, 1, 0);
  const cono = (punta: [number, number], abolladuras: string, rotura: string) => {
    const [tx, ty] = punta;
    // Base ancha (y = 17), punta arriba; dos franjas reflectivas.
    const izq = (y: number) => 26 + ((y - 17) / (ty - 17)) * (tx - 2 - 26);
    const der = (y: number) => 70 + ((y - 17) / (ty - 17)) * (tx + 2 - 70);
    const franja = (y0: number, y1: number) =>
      `<path d="M${izq(y0)},${y0} L${der(y0)},${y0} L${der(y1)},${y1} L${izq(y1)},${y1} Z" fill="url(#cono-f)" stroke="${TINTA}" stroke-width="1.4"/>`;
    return (
      `<path d="M26,17 L${tx - 2},${ty} Q${tx},${ty - 2.5} ${tx + 2},${ty} L70,17 Z" fill="url(#cono)" ${borde()}/>` +
      franja(-2, 5) + franja(-20, -14) +
      `<path d="M21,15 C21,12 75,12 75,15 L76,20 C76,24 20,24 20,20 Z" fill="url(#cono)" ${borde()}/>` +
      `<path d="M24,17 C40,15.5 58,15.5 72,17" stroke="#ffd0a0" stroke-width="1.4" opacity="0.6" fill="none"/>` +
      abolladuras + rotura
    );
  };
  const intacto = cono([46, -38], '', '');
  const abollado = cono([52, -32], `<path d="M36,-6 q4,3 9,1" stroke="${P.conoOscuro}" stroke-width="2.4" fill="none"/><ellipse cx="57" cy="-4" rx="3.5" ry="2" fill="${P.conoOscuro}" opacity="0.6"/>`, `<path d="M49,-24 L54,-20 L50,-17" fill="none" ${borde(1.6)}/>`);
  const muyAbollado =
    `<g transform="rotate(10 48 17)">` +
    cono([60, -18], `<ellipse cx="38" cy="2" rx="5" ry="3" fill="${P.conoOscuro}" opacity="0.7"/><ellipse cx="58" cy="5" rx="4" ry="2.4" fill="${P.conoOscuro}" opacity="0.7"/>`,
      `<path d="M44,-8 L50,-2 L45,4 L52,9" fill="none" ${borde(1.8)}/><path d="M57,-14 L62,-12 L66,-17 L60,-21 Z" fill="#2a1a10"/>`) +
    `</g>`;
  base.piezas.push({ id: 'cono', svg: intacto, pivote: [48, 15], padre: 'cabeza', z: 11, estados: { abollado, muy_abollado: muyAbollado } });
  return defZombi('caracono', 'Zombi caracono', base, (c) => {
    const p = animZombi(c);
    p.cono = { rot: -6 + Math.sin(c.t * 3 + c.semilla) * 1.5 };
    return p;
  }, {
    variantes: { casco: { piezas: ['cono'], valores: ['intacto', 'abollado', 'muy_abollado'] } },
    perdidas: { ...PERDIDAS_ZOMBI, casco: { ocultar: ['cono'] } },
    puntos: { cabeza: [46, -36], boca: [32, 54] },
  });
})();

// Caracubo: balde de metal gris que le tapa la frente, con una mancha de pintura roja.
const CARACUBO: DefPersonaje = (() => {
  const base = PIEZAS_ZOMBI_BASE('caracubo');
  base.defs += lineal('cubo', [[0, '#80868f'], [0.25, P.metalClaro], [0.5, P.metal], [0.8, '#8c939c'], [1, '#5b6068']], 0, 0, 1, 0);
  const cubo = (forma: string, golpes: string) =>
    `<path d="${forma}" fill="url(#cubo)" ${borde()}/>` +
    `<path d="M22,18 C38,22 58,22 75,17" stroke="${P.metalOscuro}" stroke-width="2" fill="none" opacity="0.7"/>` +
    `<path d="M27,2 C40,5 56,5 70,1" stroke="${P.metalOscuro}" stroke-width="1.8" fill="none" opacity="0.6"/>` +
    // pintura roja que escurre
    `<path d="M50,-14 C56,-14 60,-13 63,-12 L62,-4 C61,0 60,6 58.5,6 C57,6 57,1 56,-3 C55,2 54,9 52.5,9 C51,9 51,2 50.5,-3 Z" fill="#c8262b" opacity="0.9"/>` +
    // asa de alambre
    `<path d="M24,10 C14,12 12,26 20,30" fill="none" stroke="${TINTA}" stroke-width="3.4"/><path d="M24,10 C14,12 12,26 20,30" fill="none" stroke="${P.metal}" stroke-width="1.6"/>` +
    `<circle cx="24" cy="10" r="2.4" fill="${P.metalOscuro}" ${borde(1.2)}/>` +
    `<path d="M34,-10 L32,22" stroke="#fff" stroke-width="3" opacity="0.45"/>` +
    golpes;
  const forma = 'M30,-16 C40,-19 60,-19 68,-15 L77,24 C77,29 20,29 20,24 Z';
  const intacto = cubo(forma, '');
  const abollado = cubo('M30,-16 C40,-19 52,-15 56,-17 C62,-19 66,-16 68,-15 L77,24 C77,29 20,29 20,24 Z',
    `<ellipse cx="60" cy="6" rx="6" ry="4" fill="${P.metalOscuro}" opacity="0.55"/><path d="M55,3 q5,-3 10,1" stroke="#fff" stroke-width="1.4" opacity="0.6" fill="none"/>` +
    `<ellipse cx="40" cy="-6" rx="4" ry="2.6" fill="${P.metalOscuro}" opacity="0.5"/>`);
  const muyAbollado = cubo('M31,-12 C38,-17 46,-10 52,-15 C58,-19 65,-12 69,-10 L72,4 L78,9 L76,24 C76,29 21,29 21,24 L24,12 L20,6 Z',
    `<ellipse cx="62" cy="10" rx="7" ry="5" fill="${P.metalOscuro}" opacity="0.6"/><ellipse cx="36" cy="2" rx="6" ry="4" fill="${P.metalOscuro}" opacity="0.6"/>` +
    `<path d="M44,-8 L48,0 L44,6" fill="none" ${borde(1.6)}/><circle cx="66" cy="-4" r="2.4" fill="#1d1408"/><circle cx="30" cy="14" r="1.8" fill="#1d1408"/>`);
  base.piezas.push({ id: 'cubo', svg: intacto, pivote: [48, 20], padre: 'cabeza', z: 11, estados: { abollado, muy_abollado: muyAbollado } });
  return defZombi('caracubo', 'Zombi caracubo', base, (c) => {
    const p = animZombi(c);
    p.cubo = { rot: -3 + Math.sin(c.t * 2.5 + c.semilla) * 1 };
    return p;
  }, {
    variantes: { casco: { piezas: ['cubo'], valores: ['intacto', 'abollado', 'muy_abollado'] } },
    perdidas: { ...PERDIDAS_ZOMBI, casco: { ocultar: ['cubo'] } },
    puntos: { cabeza: [48, -18], boca: [32, 54] },
  });
})();

// Saltador de pértiga: atleta rubio con cinta azul, camiseta roja de atletismo, pantaloneta, medias a rayas y
// zapatillas rojas. 'corre' con la pértiga, 'salta' (fase) y 'camina' sin ella.
const AVANCE_SALTO = -130;
const PERTIGA: DefPersonaje = (() => {
  const piel = P.piel, pielO = P.pielOscura;
  const H = HUESOS_ZOMBI;
  const pelo =
    `<path d="M24,22 C22,10 36,2 50,3 C62,3 74,10 74,24 C70,18 66,16 62,17 C64,12 58,8 56,13 C52,8 46,9 46,14 C40,10 34,12 33,18 C29,16 26,18 24,22 Z" fill="#f2cf4a" ${borde()}/>` +
    `<path d="M40,6 C44,4 50,4 54,6" stroke="#fff6b0" stroke-width="2" fill="none" opacity="0.7"/>` +
    // cinta azul en la frente
    `<path d="M23,24 C38,18 58,18 74,24 L74,30 C58,24 38,24 23,30 Z" fill="#2e7fd6" ${borde(2.2)}/>` +
    `<path d="M74,26 L82,22 L80,30 Z M74,28 L83,31 L77,34 Z" fill="#2e7fd6" ${borde(1.8)}/>`;
  const camiseta =
    `<path d="M49,56 L61,56 L62,68 L49,68 Z" fill="${pielO}" ${borde()}/>` +
    `<ellipse cx="55.5" cy="57.5" rx="6" ry="2.4" fill="#5e1f1a" ${borde(1.4)}/>` +
    `<path d="M46,66 C50,63 54,64 56,67 C60,64 66,63 72,64 C77,66 80,72 80,80 C81,90 81,98 80,106 L45,106 C44,94 44,78 46,66 Z" fill="#d43a2a" ${borde()}/>` +
    `<path d="M45.5,92 L80.5,92 L80.5,98 L45,98 Z" fill="#fff" opacity="0.9" ${borde(1.4)}/>` +
    `<text x="66" y="87" text-anchor="middle" font-family="'Arial Black','Liberation Sans','DejaVu Sans',sans-serif" font-weight="900" font-size="15" fill="#fff" stroke="${TINTA}" stroke-width="1.8" paint-order="stroke">0</text>` +
    `<path d="M48,66 C50,72 54,72 56,67" fill="none" stroke="#8e1a12" stroke-width="1.6"/>` +
    `<path d="M76,70 Q79,82 77,100" stroke="#8e1a12" stroke-width="2" fill="none" opacity="0.6"/>`;
  const brazo = (x: number, y0: number, y1: number, color: string) =>
    `<path d="M${x - 4.5},${y0} C${x - 5},${y0 - 5} ${x + 5},${y0 - 5} ${x + 4.5},${y0} L${x + 4},${y1} L${x - 4},${y1} Z" fill="${color}" ${borde()}/>`;
  const antebrazo = (x: number, y0: number, y1: number, color: string) =>
    `<path d="M${x - 4},${y0} L${x + 4},${y0} L${x + 3.6},${y1} L${x - 3.6},${y1} Z" fill="${color}" ${borde()}/>` +
    `<path d="M${x - 4.6},${y1 - 6} L${x + 4.6},${y1 - 6} L${x + 4.4},${y1 + 0.5} L${x - 4.4},${y1 + 0.5} Z" fill="#2e7fd6" ${borde(1.8)}/>`;
  const manga = (x: number, y0: number, color: string) =>
    `<path d="M${x - 6},${y0 + 3} C${x - 6},${y0 - 4} ${x + 6},${y0 - 4} ${x + 6},${y0 + 3} L${x + 5.5},${y0 + 8} L${x - 5.5},${y0 + 8} Z" fill="${color}" ${borde()}/>`;
  const pierna = (x: number, y0: number, oscura: boolean) => {
    const sh = oscura ? '#1f3f78' : '#2b56a0';
    const pi = oscura ? pielO : piel;
    let rayas = '';
    for (let i = 0; i < 4; i++) rayas += `<rect x="${x - 4.6}" y="${120 + i * 4}" width="9.2" height="2" fill="${oscura ? '#b02a22' : '#d43a2a'}"/>`;
    return (
      `<path d="M${x - 4},${y0 + 14} L${x + 4},${y0 + 14} L${x + 4},${136} L${x - 4},${136} Z" fill="${pi}" ${borde()}/>` +
      `<path d="M${x - 4.6},118 L${x + 4.6},118 L${x + 4.6},136.5 L${x - 4.6},136.5 Z" fill="#f4f2ea" ${borde(1.8)}/>` + rayas +
      `<path d="M${x - 7.5},${y0 - 4} L${x + 7.5},${y0 - 4} L${x + 7},${y0 + 16} L${x - 7},${y0 + 16} Z" fill="${sh}" ${borde()}/>`
    );
  };
  const zapatilla = (x: number, y: number, oscura: boolean) =>
    `<path d="M${x + 6},${y - 3} C${x + 7},${y + 2} ${x + 7},${y + 6} ${x + 6},${y + 8} L${x - 13},${y + 8} C${x - 16},${y + 8} ${x - 16},${y + 3} ${x - 12},${y + 1} C${x - 7},${y} ${x - 5},${y - 2} ${x - 5},${y - 3} Z" fill="${oscura ? '#b02a22' : '#e0402e'}" ${borde()}/>` +
    `<path d="M${x - 15},${y + 6} L${x + 6.5},${y + 6}" stroke="#fff" stroke-width="2.2"/>`;
  const base = zombiBase({
    id: 'pertiga', pelo,
    reemplazos: {
      cuerpo: camiseta,
      brazo_izq: brazo(H.hombroIzq[0], H.hombroIzq[1] - 3, H.codoIzq[1] + 1, piel) + manga(H.hombroIzq[0], H.hombroIzq[1] - 4, '#d43a2a'),
      antebrazo_izq: antebrazo(H.codoIzq[0], H.codoIzq[1] - 2, H.munecaIzq[1] + 1, piel),
      brazo_der: brazo(H.hombroDer[0], H.hombroDer[1] - 3, H.codoDer[1] + 1, pielO) + manga(H.hombroDer[0], H.hombroDer[1] - 4, '#a82a1e'),
      antebrazo_der: antebrazo(H.codoDer[0], H.codoDer[1] - 2, H.munecaDer[1] + 1, pielO),
      pierna_izq: pierna(H.caderaIzq[0], H.caderaIzq[1], false),
      pierna_der: pierna(H.caderaDer[0], H.caderaDer[1], true),
      zapato_izq: zapatilla(H.caderaIzq[0], 136, false),
      zapato_der: zapatilla(H.caderaDer[0], 136, true),
      corbata: '<g/>',
    },
    variantesExtra: {
      brazo_izq: {
        roto:
          `<path d="M${H.codoIzq[0] - 1.4},${H.codoIzq[1] - 4} L${H.codoIzq[0] - 1.2},${H.codoIzq[1] + 5}" stroke="${TINTA}" stroke-width="5.6" stroke-linecap="round"/>` +
          `<path d="M${H.codoIzq[0]},${H.codoIzq[1] - 4} L${H.codoIzq[0]},${H.codoIzq[1] + 5}" stroke="${P.hueso}" stroke-width="4" stroke-linecap="round"/>` +
          `<circle cx="${H.codoIzq[0]}" cy="${H.codoIzq[1] + 6}" r="2.8" fill="${P.hueso}" ${borde(1.4)}/>` +
          brazo(H.hombroIzq[0], H.hombroIzq[1] - 3, H.codoIzq[1] - 3, piel) + manga(H.hombroIzq[0], H.hombroIzq[1] - 4, '#d43a2a') +
          `<path d="M${H.codoIzq[0] - 4},${H.codoIzq[1] - 3} L${H.codoIzq[0] - 1},${H.codoIzq[1] - 6} L${H.codoIzq[0] + 2},${H.codoIzq[1] - 2} L${H.codoIzq[0] + 4},${H.codoIzq[1] - 4}" fill="none" stroke="#5e1f1a" stroke-width="1.6"/>`,
      },
    },
  });
  // Pértiga: en la mano (horizontal, apunta adelante) y suelta (para el salto, apoyada en el suelo).
  const largo = 128;
  const [mx, my] = H.munecaDer;
  const palo = (x0: number, y0: number, x1: number, y1: number) =>
    `<path d="M${x0},${y0} L${x1},${y1}" stroke="${TINTA}" stroke-width="5.6" stroke-linecap="round"/>` +
    `<path d="M${x0},${y0} L${x1},${y1}" stroke="#c99a5a" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M${x0 + (x1 - x0) * 0.3},${y0 + (y1 - y0) * 0.3 - 0.8} L${x0 + (x1 - x0) * 0.36},${y0 + (y1 - y0) * 0.36 - 0.8}" stroke="#d43a2a" stroke-width="4.2"/>` +
    `<path d="M${x0 + (x1 - x0) * 0.62},${y0 + (y1 - y0) * 0.62 - 0.8} L${x0 + (x1 - x0) * 0.68},${y0 + (y1 - y0) * 0.68 - 0.8}" stroke="#d43a2a" stroke-width="4.2"/>`;
  const PX = MARCO_ZOMBI.ancla[0] - 62, PY = MARCO_ZOMBI.ancla[1];
  base.piezas.push(
    { id: 'pertiga', svg: palo(mx - 92, my, mx + 36, my), pivote: [mx, my], padre: 'mano_der', z: 11 },
    { id: 'pertiga_suelta', svg: palo(PX, PY, PX, PY - largo), pivote: [PX, PY], z: 13 },
  );
  const def = defZombi('pertiga', 'Zombi saltador de pértiga', base, (c) => {
    const s = c.semilla;
    if (c.estado === 'corre' || c.estado === 'salta') {
      const correr = (t: number): Pose => {
        const p = animZombi({ ...c, t, estado: 'camina' }, { ciclo: 0.95, paso: 26, inclinacion: -12 });
        const cuerpo = p.cuerpo?.rot ?? 0;
        p.brazo_izq = { rot: 30 + Math.sin(t * 6.6 + s) * 4 };
        p.antebrazo_izq = { rot: 34 };
        p.mano_izq = { rot: 0 };
        p.brazo_der = { rot: 22 + Math.sin(t * 6.6 + s) * 4 };
        p.antebrazo_der = { rot: 40 };
        p.mano_der = { rot: -cuerpo - 62 + 6 };
        p.pertiga_suelta = { oculto: true };
        p._raiz = { ...(p._raiz ?? {}), sy: 1.05, sx: 0.97 };
        return p;
      };
      if (c.estado === 'corre') return correr(c.t);
      // Salto: apoya la pértiga adelante, se eleva por encima y cae del otro lado (avance AVANCE_SALTO).
      const f = c.fase;
      const p = correr(f * 0.5);
      const apoyo = tramo(f, 0, 0.22);
      const vuelo = tramo(f, 0.18, 0.78);
      const cae = tramo(f, 0.72, 1);
      const X = AVANCE_SALTO * suave(vuelo);
      const Y = -Math.sin(Math.PI * vuelo) * 86 + apoyo * (1 - vuelo) * 6;
      const giro = Math.sin(Math.PI * vuelo) * -58;
      const angPertiga = vuelo <= 0 ? 62 - apoyo * 10 : cae > 0 ? mezclar(-38, -84, suave(cae)) : mezclar(52, -38, vuelo);
      p._raiz = { x: X, y: Y, sy: 1.05, sx: 0.97 };
      p.cuerpo = { rot: -12 + giro, y: 0 };
      p.pierna_izq = { rot: -20 + Math.sin(Math.PI * vuelo) * -50 };
      p.pierna_der = { rot: -10 + Math.sin(Math.PI * vuelo) * -40 };
      p.brazo_izq = { rot: mezclar(30, 170, Math.sin(Math.PI * vuelo)) };
      p.brazo_der = { rot: mezclar(22, 160, Math.sin(Math.PI * vuelo)) };
      p.antebrazo_izq = { rot: 10 };
      p.antebrazo_der = { rot: 10 };
      p.pertiga = { oculto: apoyo > 0.6 };
      // La pértiga suelta queda clavada en el suelo: se compensa el movimiento de la raíz.
      p.pertiga_suelta = { oculto: apoyo <= 0.6, rot: angPertiga, x: -X / 0.97, y: -Y / 1.05, alfa: 1 - tramo(f, 0.9, 1) };
      return p;
    }
    const p = animZombi(c, { ciclo: 2.0 });
    p.pertiga = { oculto: true };
    p.pertiga_suelta = { oculto: true };
    p._raiz = { ...(p._raiz ?? {}), sy: 1.05, sx: 0.97 };
    return p;
  }, {
    estados: ['corre', 'salta', 'camina', 'come', 'quieto', 'sincabeza', 'muere', 'ceniza'],
    duraciones: { salta: 1.1, muere: 1.3, ceniza: 1.6 },
    avances: { salta: AVANCE_SALTO },
    perdidas: { ...PERDIDAS_ZOMBI, pertiga: { ocultar: ['pertiga'] } },
  });
  return def;
})();

// ---------------------------------------------------------------------------------------------------------------
// Objetos

const SOL: DefPersonaje = (() => {
  const c = 40;
  const defs =
    radial('sol-h', [[0, '#fffbd0', 0.95], [0.45, '#ffe680', 0.55], [1, '#ffd200', 0]]) +
    radial('sol-d', [[0, '#fffde8'], [0.4, P.sol], [1, P.solOscuro]], 0.5, 0.5, 0.55, 0.38, 0.32);
  let rayos = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * 360) / 12;
    rayos += `<path d="M${c - 5.5},${c - 17} L${c},${c - 33} L${c + 5.5},${c - 17} Z" transform="rotate(${a} ${c} ${c})" fill="${i % 2 ? '#ffcf2a' : '#ffe65a'}" stroke="#e8a00e" stroke-width="1.4" stroke-linejoin="round"/>`;
  }
  const piezas: DefPieza[] = [
    { id: 'halo', svg: `<circle cx="${c}" cy="${c}" r="38" fill="url(#sol-h)"/>`, pivote: [c, c], z: 0, sinTinte: true },
    { id: 'rayos', svg: rayos, pivote: [c, c], z: 1 },
    { id: 'disco', svg: `<circle cx="${c}" cy="${c}" r="18" fill="url(#sol-d)" stroke="#e8a00e" stroke-width="2"/>` + brillo(c - 6, c - 7, 7, 4, -35, 0.7) + `<circle cx="${c}" cy="${c}" r="13" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.35"/>`, pivote: [c, c], z: 2 },
  ];
  return {
    id: 'sol', nombre: 'Sol', ancho: 80, alto: 80, ancla: [c, c], piezas, defs, estados: ['quieto'],
    anim(k) {
      const p = 1 + Math.sin(k.t * 3 + k.semilla) * 0.06;
      return { rayos: { rot: (k.t * 40 + k.semilla * 13) % 360 }, halo: { sx: p, sy: p }, disco: { sx: 1 + (p - 1) * 0.4, sy: 1 + (p - 1) * 0.4 } };
    },
  };
})();

function bola(id: string, nombre: string, r: number, claro: string, medio: string, oscuro: string, extra = '', borde2 = true): DefPersonaje {
  const c = r + 6;
  return {
    id, nombre, ancho: c * 2, alto: c * 2, ancla: [c, c],
    defs: volumen(`${id}-g`, claro, medio, oscuro, 0.35, 0.3),
    piezas: [{ id: 'bola', svg: `<circle cx="${c}" cy="${c}" r="${r}" fill="url(#${id}-g)" ${borde2 ? borde(2.2) : ''}/>` + brillo(c - r * 0.35, c - r * 0.4, r * 0.38, r * 0.22, -35, 0.75) + extra, pivote: [c, c], z: 1 }],
    estados: ['quieto'],
    anim: () => ({}),
  };
}

const GUISANTE = bola('guisante', 'Guisante', 8, '#d8ff9c', '#7cc443', '#2f7a17');
const GUISANTE_HIELO = (() => {
  const d = bola('guisante_hielo', 'Guisante de hielo', 8, '#ffffff', '#9bdcff', '#3a8cc8',
    `<path d="M14,3 l1.2,3 l3,1.2 l-3,1.2 l-1.2,3 l-1.2,-3 l-3,-1.2 l3,-1.2 Z" fill="#fff"/>`);
  d.piezas.unshift({ id: 'estela', svg: `<ellipse cx="2" cy="14" rx="10" ry="5" fill="#cfefff" opacity="0.55"/><circle cx="-5" cy="11" r="1.6" fill="#fff"/><circle cx="-2" cy="18" r="1.2" fill="#fff"/>`, pivote: [14, 14], z: 0, sinTinte: true });
  d.anim = (c) => ({ estela: { alfa: 0.7 + Math.sin(c.t * 20) * 0.3 } });
  return d;
})();
const ESPORA: DefPersonaje = (() => {
  const d = bola('espora', 'Espora', 5.5, '#f6ecff', '#c9a6ee', '#7b4db0', '', false);
  d.piezas.unshift({ id: 'nube', svg: `<circle cx="11.5" cy="11.5" r="9.5" fill="#d9c2f5" opacity="0.4"/>`, pivote: [11.5, 11.5], z: 0, sinTinte: true });
  d.anim = (c) => ({ nube: { sx: 1 + Math.sin(c.t * 9) * 0.12, sy: 1 + Math.sin(c.t * 9) * 0.12 } });
  return d;
})();

function moneda(id: string, nombre: string, claro: string, medio: string, oscuro: string, signo: string): DefPersonaje {
  const c = 18;
  return {
    id, nombre, ancho: 36, alto: 36, ancla: [c, c],
    defs: radial(`${id}-g`, [[0, claro], [0.6, medio], [1, oscuro]], 0.5, 0.5, 0.6, 0.35, 0.3),
    piezas: [{
      id: 'moneda',
      svg: `<circle cx="${c}" cy="${c}" r="13" fill="url(#${id}-g)" ${borde(2.2)}/><circle cx="${c}" cy="${c}" r="9.5" fill="none" stroke="${oscuro}" stroke-width="1.6"/>` +
        `<text x="${c}" y="${c + 4.6}" text-anchor="middle" font-family="'Arial Black','Liberation Sans','DejaVu Sans',sans-serif" font-weight="900" font-size="13" fill="${oscuro}">${signo}</text>` +
        brillo(c - 5, c - 6, 4, 2, -35, 0.8),
      pivote: [c, c], z: 1,
    }],
    estados: ['quieto', 'gira'],
    anim(k) {
      if (k.estado !== 'gira') return {};
      const g = Math.cos(k.t * 7 + k.semilla);
      return { moneda: { sx: Math.max(0.08, Math.abs(g)) } };
    },
  };
}

const MONEDA_PLATA = moneda('moneda_plata', 'Moneda de plata', '#ffffff', '#c9d0d8', '#6e7782', '$');
const MONEDA_ORO = moneda('moneda_oro', 'Moneda de oro', '#fff6c0', '#ffc928', '#a8660a', '$');

const DIAMANTE: DefPersonaje = {
  id: 'diamante', nombre: 'Diamante', ancho: 40, alto: 36, ancla: [20, 18],
  defs: lineal('dia-g', [[0, '#ffffff'], [0.5, '#9fe8ff'], [1, '#3aa0d8']], 0, 0, 1, 1),
  piezas: [
    {
      id: 'gema',
      svg: `<path d="M8,12 L14,5 L26,5 L32,12 L20,31 Z" fill="url(#dia-g)" ${borde(2.2)}/>` +
        `<path d="M8,12 L32,12 M14,5 L17,12 L20,31 L23,12 L26,5 M17,12 L20,5 L23,12" fill="none" stroke="#2a7fb8" stroke-width="1.1" opacity="0.8"/>` +
        `<path d="M14,5 L17,12 L8,12 Z" fill="#fff" opacity="0.6"/>`,
      pivote: [20, 18], z: 1,
    },
    { id: 'destello', svg: `<path d="M30,2 l1.5,4 l4,1.5 l-4,1.5 l-1.5,4 l-1.5,-4 l-4,-1.5 l4,-1.5 Z" fill="#fff" ${borde(0.8)}/>`, pivote: [30, 7.5], z: 2, sinTinte: true },
  ],
  estados: ['quieto'],
  anim(k) {
    const d = Math.max(0, Math.sin(k.t * 4 + k.semilla));
    return { destello: { sx: d, sy: d, rot: k.t * 90 }, gema: { y: Math.sin(k.t * 2) * 1 } };
  },
};

const BOLSA_MONEDAS: DefPersonaje = {
  id: 'bolsa_monedas', nombre: 'Bolsa de monedas', ancho: 56, alto: 56, ancla: [28, 50],
  defs: volumen('bolsa', '#f1dcae', '#cfa76a', '#8a6230', 0.35, 0.3),
  piezas: [
    { id: 'sombra', svg: sombra(28, 50, 18, 4), pivote: [28, 50], z: -10, sinTinte: true },
    {
      id: 'bolsa',
      svg: `<path d="M22,16 C14,22 8,32 9,40 C10,48 18,51 28,51 C38,51 46,48 47,40 C48,32 42,22 34,16 Z" fill="url(#bolsa)" ${borde()}/>` +
        `<path d="M21,15 C24,8 26,13 28,9 C30,13 32,8 35,15 Z" fill="#cfa76a" ${borde(2)}/>` +
        `<path d="M20,17 C26,19 30,19 36,17" stroke="#c8262b" stroke-width="3" fill="none"/>` +
        `<circle cx="28" cy="36" r="9" fill="#ffc928" ${borde(2)}/>` +
        `<text x="28" y="40.5" text-anchor="middle" font-family="'Arial Black','Liberation Sans','DejaVu Sans',sans-serif" font-weight="900" font-size="12" fill="#a8660a">$</text>` +
        brillo(18, 30, 4, 2.4, -50, 0.5),
      pivote: [28, 50], z: 1,
    },
  ],
  estados: ['quieto'],
  anim(k) {
    const b = Math.sin(k.t * 3 + k.semilla);
    return { bolsa: { sy: 1 + b * 0.03, sx: 1 - b * 0.02 } };
  },
};

const ABONO: DefPersonaje = {
  id: 'abono', nombre: 'Abono', ancho: 56, alto: 56, ancla: [28, 28],
  defs: lineal('abono-g', [[0, '#d6ff8a'], [0.5, '#5fd12a'], [1, '#1f7a12']], 0, 0, 1, 0) + radial('abono-h', [[0, '#e8ffb0', 0.9], [0.5, '#8cff4a', 0.4], [1, '#5fd12a', 0]]),
  piezas: [
    { id: 'halo', svg: `<circle cx="28" cy="28" r="27" fill="url(#abono-h)"/>`, pivote: [28, 28], z: 0, sinTinte: true },
    {
      id: 'capsula',
      svg: `<g transform="rotate(-28 28 30)"><rect x="18" y="16" width="20" height="30" rx="10" fill="url(#abono-g)" ${borde()}/>` +
        `<path d="M18,31 L38,31" stroke="#1f5a10" stroke-width="2"/>` +
        `<rect x="21.5" y="19" width="4" height="10" rx="2" fill="#fff" opacity="0.7"/></g>` +
        hoja(31, 15, 13, 4.5, -60, '#7be04a', P.verdeHondo, 0.3) + hoja(30, 16, 11, 4, -130, '#4fb82a', P.verdeHondo, -0.3),
      pivote: [28, 30], z: 1,
    },
    { id: 'chispa', svg: `<path d="M44,10 l1.4,3.6 l3.6,1.4 l-3.6,1.4 l-1.4,3.6 l-1.4,-3.6 l-3.6,-1.4 l3.6,-1.4 Z" fill="#fff"/>`, pivote: [44, 15], z: 2, sinTinte: true },
  ],
  estados: ['quieto'],
  anim(k) {
    const p = Math.sin(k.t * 4 + k.semilla);
    return { halo: { sx: 1 + p * 0.1, sy: 1 + p * 0.1, alfa: 0.75 + p * 0.25 }, capsula: { rot: Math.sin(k.t * 2) * 5, y: Math.sin(k.t * 2.2) * 1.5 }, chispa: { sx: Math.max(0, p), sy: Math.max(0, p) } };
  },
};

const CORTACESPED: DefPersonaje = (() => {
  const defs = lineal('cc-r', [[0, '#ff6a5a'], [0.45, '#d42a2a'], [1, '#7e1212']]) + lineal('cc-m', [[0, '#e8ecf0'], [1, '#7a828c']]);
  const rueda = (cx: number, cy: number, r: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#262626" ${borde(2.2)}/><circle cx="${cx}" cy="${cy}" r="${r * 0.48}" fill="#c9ced6" ${borde(1.4)}/>` +
    `<path d="M${cx - r * 0.42},${cy} L${cx + r * 0.42},${cy} M${cx},${cy - r * 0.42} L${cx},${cy + r * 0.42}" stroke="#6a7078" stroke-width="1.4"/>`;
  const cuerpo =
    // manubrio hacia atrás (izquierda)
    `<path d="M30,40 L8,12 L2,12" fill="none" stroke="${TINTA}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M30,40 L8,12 L2,12" fill="none" stroke="#3a3a3a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="-1" y="8.5" width="9" height="7" rx="3" fill="#222" ${borde(1.6)}/>` +
    // chasis rojo
    `<path d="M22,50 C22,40 30,34 42,33 L62,33 C70,33 76,39 76,47 L76,54 L22,54 Z" fill="url(#cc-r)" ${borde()}/>` +
    `<path d="M26,46 L74,46" stroke="#7e1212" stroke-width="1.6" opacity="0.7"/>` +
    // motor
    `<path d="M40,33 L40,24 C40,20 58,20 58,24 L58,33 Z" fill="url(#cc-m)" ${borde()}/>` +
    `<rect x="44" y="18" width="10" height="5" rx="2" fill="#555" ${borde(1.6)}/>` +
    `<path d="M43,27 L55,27 M43,30 L55,30" stroke="#666" stroke-width="1.2"/>` +
    brillo(34, 39, 6, 2.2, -10, 0.5);
  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(48, 62, 30, 5), pivote: [48, 62], z: -10, sinTinte: true },
    { id: 'cuerpo', svg: cuerpo, pivote: [48, 54], z: 1 },
    { id: 'rueda_a', svg: rueda(30, 56, 7.5), pivote: [30, 56], padre: 'cuerpo', z: 2 },
    { id: 'rueda_b', svg: rueda(68, 56, 7.5), pivote: [68, 56], padre: 'cuerpo', z: 2 },
  ];
  return {
    id: 'cortacesped', nombre: 'Cortacésped', ancho: 80, alto: 66, ancla: [48, 63], piezas, defs,
    estados: ['quieto', 'corre'],
    anim(k) {
      if (k.estado !== 'corre') return {};
      const r = (k.t * 900) % 360;
      return { cuerpo: { y: Math.sin(k.t * 50) * 0.8, rot: Math.sin(k.t * 37) * 1.2 }, rueda_a: { rot: r }, rueda_b: { rot: r } };
    },
  };
})();

/** Explosión de la Petacereza (extra para la vista): bola de fuego naranja y humo (fase 0..1). */
const EXPLOSION: DefPersonaje = (() => {
  const defs = radial('ex-f', [[0, '#ffffff'], [0.25, '#fff2a0'], [0.55, '#ff9a1f'], [0.85, '#e0381a'], [1, '#e0381a', 0]]) +
    radial('ex-h', [[0, '#6a5a50', 0.8], [0.7, '#3a302a', 0.5], [1, '#3a302a', 0]]);
  const nube = (n: number, r0: number, r1: number) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      s += `<circle cx="${80 + Math.cos(a) * r0}" cy="${80 + Math.sin(a) * r0 * 0.8}" r="${r1 * (0.8 + (i % 3) * 0.15)}" fill="url(#ex-h)"/>`;
    }
    return s;
  };
  return {
    id: 'explosion', nombre: 'Explosión', ancho: 160, alto: 160, ancla: [80, 110], defs,
    piezas: [
      { id: 'humo', svg: nube(9, 42, 26), pivote: [80, 80], z: 0, sinTinte: true },
      { id: 'fuego', svg: `<circle cx="80" cy="80" r="70" fill="url(#ex-f)"/>`, pivote: [80, 80], z: 1, sinTinte: true },
    ],
    estados: ['explota'],
    duraciones: { explota: 0.9 },
    anim(k) {
      const f = k.fase;
      const g = suave(tramo(f, 0, 0.3));
      return {
        fuego: { sx: 0.3 + g * 0.9, sy: 0.3 + g * 0.9, alfa: 1 - tramo(f, 0.35, 0.8) },
        humo: { sx: 0.6 + f * 0.7, sy: 0.6 + f * 0.7, y: -f * 20, alfa: tramo(f, 0.1, 0.3) * (1 - tramo(f, 0.6, 1)) },
      };
    },
  };
})();

/** Arte del mundo 1: plantas, zombis y objetos por id. */
export const DEF_ARTE_DIA: Record<string, DefPersonaje> = {
  lanzaguisantes: LANZAGUISANTES,
  girasol: GIRASOL,
  petacereza: PETACEREZA,
  nuez: NUEZ,
  patatapum: PATATAPUM,
  hielaguisantes: HIELAGUISANTES,
  carnivora: CARNIVORA,
  repetidora: REPETIDORA,
  desesporada: DESESPORADA,
  zombi: ZOMBI,
  abanderado: ABANDERADO,
  caracono: CARACONO,
  pertiga: PERTIGA,
  caracubo: CARACUBO,
  sol: SOL,
  guisante: GUISANTE,
  guisante_hielo: GUISANTE_HIELO,
  espora: ESPORA,
  cortacesped: CORTACESPED,
  moneda_plata: MONEDA_PLATA,
  moneda_oro: MONEDA_ORO,
  diamante: DIAMANTE,
  bolsa_monedas: BOLSA_MONEDAS,
  abono: ABONO,
  explosion: EXPLOSION,
};

/** Grupos para la galería y el almanaque. */
export const PLANTAS_DIA = ['lanzaguisantes', 'girasol', 'petacereza', 'nuez', 'patatapum', 'hielaguisantes', 'carnivora', 'repetidora', 'desesporada'];
export const ZOMBIS_DIA = ['zombi', 'abanderado', 'caracono', 'pertiga', 'caracubo'];
export const OBJETOS_DIA = ['sol', 'guisante', 'guisante_hielo', 'espora', 'cortacesped', 'moneda_plata', 'moneda_oro', 'diamante', 'bolsa_monedas', 'abono', 'explosion'];
