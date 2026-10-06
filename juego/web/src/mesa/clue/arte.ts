// El arte de «¿Quién fue?» en SVG: los íconos de los sospechosos (figuritas de su color) y de las armas, el dibujo de
// cada cuarto (piso y muebles vistos desde arriba, como el Clue de 2023 pero en nuestro estilo de fieltro) y las
// cartas. Si existe el tablero renderizado en Blender (`modelos/clue/tablero.webp`), va de fondo y esto queda para
// las cartas y las fichas.
import type { IdCuarto } from './tablero';
import type { IdArma, IdSospechoso } from './reglas';
import { SOSPECHOSOS } from './reglas';

/** Una figurita de fieltro vista de frente (para las fichas y las cartas): cabeza, cuerpo y su detalle. */
export function figurita(id: IdSospechoso, tam = 1): string {
  const s = SOSPECHOSOS.find((x) => x.id === id)!;
  const c = s.color;
  const borde = id === 'arepa' ? '#b9a98f' : '#3d2b27';
  const detalle: Record<IdSospechoso, string> = {
    // corona de telenovela
    fresa: `<path d="M-0.22 -0.78 L-0.14 -0.95 L-0.05 -0.82 L0.05 -0.97 L0.13 -0.82 L0.22 -0.95 L0.24 -0.78 Z" fill="#ffd34a" stroke="${borde}" stroke-width="0.03"/>`,
    // bigote enorme
    maracuya: `<path d="M-0.2 -0.47 q0.1 -0.08 0.2 0 q0.1 -0.08 0.2 0 q-0.1 0.07 -0.2 0.02 q-0.1 0.05 -0.2 -0.02z" fill="#5b3a29"/>`,
    // gorro de cocinera
    arepa: `<path d="M-0.2 -0.78 q-0.12 -0.18 0.04 -0.24 q0.06 -0.12 0.16 -0.02 q0.16 -0.04 0.12 0.14 q0.02 0.12 -0.32 0.12z" fill="#fff" stroke="${borde}" stroke-width="0.03"/>`,
    // sombrero de jardinero
    aguacate: `<ellipse cx="0" cy="-0.8" rx="0.32" ry="0.07" fill="#c99a5b" stroke="${borde}" stroke-width="0.03"/><path d="M-0.16 -0.8 q0.16 -0.22 0.32 0z" fill="#c99a5b" stroke="${borde}" stroke-width="0.03"/>`,
    // perlas
    arandano: `${[-0.14, -0.07, 0, 0.07, 0.14].map((x) => `<circle cx="${x}" cy="${-0.32 + Math.abs(x) * 0.3}" r="0.035" fill="#fff"/>`).join('')}`,
    // gafotas
    mora: `<circle cx="-0.09" cy="-0.58" r="0.075" fill="none" stroke="${borde}" stroke-width="0.035"/><circle cx="0.09" cy="-0.58" r="0.075" fill="none" stroke="${borde}" stroke-width="0.035"/>`,
  };
  return `<g transform="scale(${tam})">
    <ellipse cx="0" cy="0.42" rx="0.34" ry="0.09" fill="rgba(0,0,0,0.25)"/>
    <path d="M-0.3 0.4 q0 -0.62 0.3 -0.62 q0.3 0 0.3 0.62z" fill="${c}" stroke="${borde}" stroke-width="0.04"/>
    <rect x="-0.25" y="-0.82" width="0.5" height="0.46" rx="0.16" fill="${c}" stroke="${borde}" stroke-width="0.04"/>
    <circle cx="-0.09" cy="-0.58" r="0.035" fill="#2a1a10"/><circle cx="0.09" cy="-0.58" r="0.035" fill="#2a1a10"/>
    <ellipse cx="-0.16" cy="-0.5" rx="0.05" ry="0.03" fill="#f07a85" opacity="0.7"/><ellipse cx="0.16" cy="-0.5" rx="0.05" ry="0.03" fill="#f07a85" opacity="0.7"/>
    ${detalle[id]}
  </g>`;
}

/** Las armas, chiquitas y doradas como en el Clue (en un cuadro de -0.5 a 0.5). */
export function arma(id: IdArma, tam = 1): string {
  const oro = '#e3b54a', sombra = '#8a6516';
  const t: Record<IdArma, string> = {
    chancla: `<path d="M-0.18 -0.42 q0.2 -0.08 0.3 0.06 q0.1 0.3 0 0.62 q-0.12 0.2 -0.3 0.04 q-0.12 -0.34 0 -0.72z" fill="${oro}" stroke="${sombra}" stroke-width="0.05"/>
      <path d="M-0.06 -0.2 L-0.16 0.02 M-0.06 -0.2 L0.06 0.02" stroke="${sombra}" stroke-width="0.06" stroke-linecap="round"/>`,
    rodillo: `<rect x="-0.3" y="-0.11" width="0.6" height="0.22" rx="0.1" fill="${oro}" stroke="${sombra}" stroke-width="0.05"/>
      <rect x="-0.48" y="-0.04" width="0.17" height="0.08" rx="0.04" fill="${oro}" stroke="${sombra}" stroke-width="0.04"/><rect x="0.31" y="-0.04" width="0.17" height="0.08" rx="0.04" fill="${oro}" stroke="${sombra}" stroke-width="0.04"/>`,
    olla: `<path d="M-0.32 -0.12 h0.64 v0.3 q0 0.16 -0.16 0.16 h-0.32 q-0.16 0 -0.16 -0.16z" fill="${oro}" stroke="${sombra}" stroke-width="0.05"/>
      <path d="M-0.36 -0.16 h0.72" stroke="${sombra}" stroke-width="0.06" stroke-linecap="round"/><rect x="-0.05" y="-0.3" width="0.1" height="0.14" fill="${oro}" stroke="${sombra}" stroke-width="0.04"/>
      <path d="M0.32 0 h0.14" stroke="${sombra}" stroke-width="0.07" stroke-linecap="round"/>`,
    control: `<rect x="-0.13" y="-0.42" width="0.26" height="0.84" rx="0.08" fill="${oro}" stroke="${sombra}" stroke-width="0.05"/>
      <circle cx="0" cy="-0.26" r="0.05" fill="#e4574b"/>${[-0.08, 0.08].map((y) => `<circle cx="-0.05" cy="${y}" r="0.03" fill="${sombra}"/><circle cx="0.05" cy="${y}" r="0.03" fill="${sombra}"/>`).join('')}`,
    escoba: `<path d="M-0.04 -0.48 L-0.04 0.12" stroke="${sombra}" stroke-width="0.07" stroke-linecap="round"/>
      <path d="M-0.2 0.12 h0.32 l0.06 0.34 h-0.44z" fill="${oro}" stroke="${sombra}" stroke-width="0.05"/>
      ${[-0.14, -0.04, 0.06].map((x) => `<path d="M${x} 0.18 v0.24" stroke="${sombra}" stroke-width="0.025"/>`).join('')}`,
    matera: `<path d="M-0.24 -0.02 h0.48 l-0.07 0.42 h-0.34z" fill="${oro}" stroke="${sombra}" stroke-width="0.05"/>
      <path d="M0 -0.02 q-0.05 -0.24 -0.2 -0.3 M0 -0.02 q0.04 -0.26 0.18 -0.34 M0 -0.02 v-0.36" stroke="#5aa94c" stroke-width="0.06" stroke-linecap="round" fill="none"/>
      <circle cx="0" cy="-0.42" r="0.07" fill="#f29bb8"/>`,
  };
  return `<g transform="scale(${tam})">${t[id]}</g>`;
}

/** El piso y los muebles de cada cuarto vistos desde arriba (en el rectángulo w × h del cuarto). */
export function cuarto(id: IdCuarto, w: number, h: number): string {
  const madera = (c1: string, c2: string) => {
    let s = `<rect width="${w}" height="${h}" fill="${c1}"/>`;
    for (let y = 0; y < h; y += 0.33) s += `<rect x="0" y="${y.toFixed(2)}" width="${w}" height="0.02" fill="${c2}" opacity="0.5"/>`;
    for (let k = 0; k < w * h * 1.2; k++) {
      const x = ((k * 7.3) % (w * 10)) / 10, y = Math.floor((k * 7.3) / (w * 10)) * 0.33;
      if (y < h) s += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="0.02" height="0.33" fill="${c2}" opacity="0.45"/>`;
    }
    return s;
  };
  const cuadros = (c1: string, c2: string, l = 0.5) => {
    let s = `<rect width="${w}" height="${h}" fill="${c1}"/>`;
    for (let y = 0; y < h; y += l) for (let x = 0; x < w; x += l) if ((Math.round(x / l) + Math.round(y / l)) % 2) s += `<rect x="${x}" y="${y}" width="${l}" height="${l}" fill="${c2}"/>`;
    return s;
  };
  const alfombra = (x: number, y: number, aw: number, ah: number, c: string, b: string) =>
    `<rect x="${x}" y="${y}" width="${aw}" height="${ah}" rx="0.12" fill="${c}" stroke="${b}" stroke-width="0.08"/><rect x="${x + 0.18}" y="${y + 0.18}" width="${aw - 0.36}" height="${ah - 0.36}" rx="0.08" fill="none" stroke="${b}" stroke-width="0.04" stroke-dasharray="0.12 0.08"/>`;
  const mueble = (x: number, y: number, mw: number, mh: number, c: string, extra = '') =>
    `<rect x="${x + 0.05}" y="${y + 0.08}" width="${mw}" height="${mh}" rx="0.12" fill="rgba(0,0,0,0.22)"/><rect x="${x}" y="${y}" width="${mw}" height="${mh}" rx="0.12" fill="${c}" stroke="#3d2b27" stroke-width="0.05"/>${extra}`;
  const mata = (x: number, y: number, r = 0.32) =>
    `<circle cx="${x + 0.04}" cy="${y + 0.06}" r="${r}" fill="rgba(0,0,0,0.2)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#5aa94c" stroke="#2f6b2a" stroke-width="0.05"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * r * 0.55).toFixed(2)}" cy="${(y + Math.sin((a * Math.PI) / 180) * r * 0.55).toFixed(2)}" r="${(r * 0.38).toFixed(2)}" fill="#7ccf6b"/>`).join('')}`;
  const sofa = (x: number, y: number, sw: number, c: string) =>
    mueble(x, y, sw, 0.7, c, `<rect x="${x + 0.12}" y="${y + 0.14}" width="${sw - 0.24}" height="0.42" rx="0.1" fill="rgba(255,255,255,0.18)"/>`);
  const d: Record<IdCuarto, string> = {
    cocina:
      cuadros('#f4efe6', '#d8c3a5') +
      mueble(0.15, 0.15, w - 0.3, 0.75, '#e9e4dd', `<circle cx="0.8" cy="0.52" r="0.18" fill="#4a4a52"/><circle cx="1.35" cy="0.52" r="0.18" fill="#4a4a52"/><rect x="2.4" y="0.3" width="1.1" height="0.45" rx="0.08" fill="#9ccbef"/>`) +
      mueble(w - 1.1, 1.1, 0.9, 1.6, '#c98b5a') +
      `<circle cx="${w - 0.65}" cy="1.5" r="0.2" fill="#e3b54a" stroke="#8a6516" stroke-width="0.04"/>`,
    salon:
      madera('#c98a4b', '#8a5a2b') +
      `<circle cx="${w / 2}" cy="${h / 2}" r="1.3" fill="none" stroke="#f0d488" stroke-width="0.06" opacity="0.7"/><circle cx="${w / 2}" cy="${h / 2}" r="0.32" fill="#e9e4dd" stroke="#8a8f98" stroke-width="0.05"/>` +
      mueble(0.25, 0.25, 1.6, 1.1, '#1d1d24', `<rect x="0.35" y="1.15" width="1.4" height="0.12" fill="#f4efe6"/>`) +
      mueble(w - 1.3, 0.3, 1, 0.6, '#c2354a') + mueble(w - 1.3, h - 0.95, 1, 0.6, '#c2354a'),
    patio:
      `<rect width="${w}" height="${h}" fill="#8fdb7c"/>` +
      cuadros('#e9d8b4', '#d8c3a5', 0.6).replace(`<rect width="${w}" height="${h}" fill="#e9d8b4"/>`, `<rect x="1.2" y="0.6" width="${w - 2.4}" height="${h - 1.2}" fill="#e9d8b4"/>`) +
      mata(0.55, 0.55) + mata(w - 0.55, 0.55) + mata(0.55, h - 0.55, 0.28) + mata(w - 0.55, h - 0.55, 0.28) +
      `<circle cx="${w / 2}" cy="${h / 2}" r="0.45" fill="#8ec5f0" stroke="#4f8fe0" stroke-width="0.06"/>`,
    juegos:
      madera('#9c6b43', '#5b3a29') +
      mueble(w / 2 - 1.3, h / 2 - 0.65, 2.6, 1.3, '#2f8f5b', `<rect x="${w / 2 - 1.1}" y="${h / 2 - 0.45}" width="2.2" height="0.9" rx="0.08" fill="#3fb5a3" opacity="0.5"/><circle cx="${w / 2 - 0.4}" cy="${h / 2}" r="0.09" fill="#fff"/><circle cx="${w / 2 + 0.3}" cy="${h / 2 - 0.15}" r="0.09" fill="#e4574b"/>`) +
      `<rect x="0.2" y="0.2" width="0.7" height="0.5" rx="0.06" fill="#1d1d24"/>`,
    biblioteca:
      alfombra(0, 0, w, h, '#7a3b52', '#f0d488') +
      mueble(0.1, 0.1, w - 0.2, 0.45, '#5b3a29', Array.from({ length: Math.floor(w * 3) }, (_, k) => `<rect x="${0.2 + k * 0.32}" y="0.16" width="0.22" height="0.33" fill="${['#e4574b', '#4f8fe0', '#f2c94c', '#5aa94c'][k % 4]}"/>`).join('')) +
      mueble(w / 2 - 0.5, h / 2 - 0.1, 1, 0.8, '#c98b5a'),
    estudio:
      madera('#7a4a2a', '#4a2e22') + alfombra(0.6, 0.6, w - 1.2, h - 1.2, '#2a4f9e', '#f0d488') +
      mueble(w / 2 - 1, 0.5, 2, 0.9, '#5b3a29', `<rect x="${w / 2 - 0.4}" y="0.7" width="0.5" height="0.35" fill="#f4efe6"/>`) +
      mata(w - 0.5, h - 0.5, 0.3),
    comedor:
      madera('#b07045', '#703d24') + alfombra(0.5, 0.5, w - 1, h - 1, '#c2354a', '#f2c94c') +
      mueble(1, h / 2 - 0.55, w - 2, 1.1, '#9c6b43', Array.from({ length: 4 }, (_, k) => `<circle cx="${1.5 + k * ((w - 3) / 3)}" cy="${h / 2}" r="0.16" fill="#f4efe6" stroke="#8a8f98" stroke-width="0.03"/>`).join('')),
    salatv:
      alfombra(0, 0, w, h, '#d8c3a5', '#9c6b43') + sofa(0.8, h - 1.1, w - 1.6, '#4f8fe0') +
      `<rect x="${w / 2 - 1}" y="0.15" width="2" height="0.22" rx="0.05" fill="#1d1d24"/>` + mueble(w / 2 - 0.6, h / 2 - 0.3, 1.2, 0.6, '#c98b5a'),
    recibidor:
      cuadros('#f4efe6', '#3d2b27', 0.5) + alfombra(1.5, 0.5, w - 3, h - 1, '#c2354a', '#f2c94c') +
      `<circle cx="${w / 2}" cy="${h / 2}" r="0.5" fill="#e9e4dd" stroke="#8a8f98" stroke-width="0.06"/>` + mata(0.5, 0.5, 0.3) + mata(w - 0.5, 0.5, 0.3),
  };
  return d[id];
}
