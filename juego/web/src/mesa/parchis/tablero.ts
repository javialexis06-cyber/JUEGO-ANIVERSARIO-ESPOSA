// Geometría y dibujo del tablero de Parchís en SVG: la cruz de 68 casillas (brazos de 3 carriles por 8),
// los pasillos de colores, las cuatro casas y la meta en el centro. Se dibuja con la casa de este celular
// abajo a la izquierda (si hace falta, todo se gira media vuelta; las fichas siguen de pie).
import type { Rol } from '../../casa/modelo';
import { CASA, ENTRADA, META, SALIDA, SEGUROS, absoluta } from './reglas';

/** Largo de una casilla (a lo largo del camino) y ancho de un carril, en unidades del SVG. */
export const U = 20;
export const W = 25;
/** Donde empieza el centro, su lado y el lado del tablero. */
export const M = 8 * U;
export const C = 3 * W;
export const L = 2 * M + C;
export const MARCO = 12;
export const CAJA = `${-MARCO} ${-MARCO} ${L + 2 * MARCO} ${L + 2 * MARCO}`;

export interface Pt {
  x: number;
  y: number;
}
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Brazo de cada color en el dibujo sin girar (0 abajo, 1 derecha, 2 arriba, 3 izquierda). */
export const BRAZO: Record<Rol, number> = { el: 1, ella: 3 };
/** Colores de los cuatro brazos (0 y 2 no juegan: van suaves). */
export const COLOR = {
  el: { base: '#5b8fd6', claro: '#b9d4f5', oscuro: '#3b69a8', suave: '#cfe2f7', pasillo: '#9fc2ee' },
  ella: { base: '#e86a8a', claro: '#f9bfcd', oscuro: '#b9456a', suave: '#fbd6df', pasillo: '#f3a6ba' },
  amarillo: { base: '#f6cf5a', suave: '#fbeab4', pasillo: '#f8dd8c' },
  verde: { base: '#8fd3b6', suave: '#d3efe2', pasillo: '#b3e2cd' },
};
const COLOR_BRAZO = [COLOR.amarillo, COLOR.el, COLOR.verde, COLOR.ella];

function celda(brazo: number, carril: number, j: number): Rect {
  switch (brazo) {
    case 0:
      return { x: M + carril * W, y: M + C + j * U, w: W, h: U };
    case 1:
      return { x: M + C + j * U, y: M + carril * W, w: U, h: W };
    case 2:
      return { x: M + carril * W, y: M - (j + 1) * U, w: W, h: U };
    default:
      return { x: M - (j + 1) * U, y: M + carril * W, w: U, h: W };
  }
}

/** Brazo, carril y fila de la casilla `t` (0..67) de la vuelta (numeración clásica, antihoraria). */
function lugarVuelta(t: number): [number, number, number] {
  const i = t + 1;
  if (i <= 8) return [0, 2, 8 - i];
  if (i <= 16) return [1, 2, i - 9];
  if (i === 17) return [1, 1, 7];
  if (i <= 25) return [1, 0, 25 - i];
  if (i <= 33) return [2, 2, i - 26];
  if (i === 34) return [2, 1, 7];
  if (i <= 42) return [2, 0, 42 - i];
  if (i <= 50) return [3, 0, i - 43];
  if (i === 51) return [3, 1, 7];
  if (i <= 59) return [3, 2, 59 - i];
  if (i <= 67) return [0, 0, i - 60];
  return [0, 1, 7];
}
const celdaVuelta = (t: number) => celda(...lugarVuelta(t));
/** Casilla `c` (1..7) del pasillo del brazo. */
const celdaPasillo = (brazo: number, c: number) => celda(brazo, 1, 7 - c);
const medio = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
/** Centro de la esquina (casa) que va con cada brazo. */
const ESQUINA: Pt[] = [
  { x: M + C + M / 2, y: M + C + M / 2 },
  { x: M + C + M / 2, y: M / 2 },
  { x: M / 2, y: M / 2 },
  { x: M / 2, y: M + C + M / 2 },
];
/** Puestos de las 4 fichas en casa (alrededor del centro de la esquina). */
const PUESTOS: Pt[] = [
  { x: -27, y: -27 },
  { x: 27, y: -27 },
  { x: -27, y: 27 },
  { x: 27, y: 27 },
];
/** Meta: centro del lado del triángulo, hacia adentro y a lo largo, por brazo. */
const META_BASE: { b: Pt; n: Pt; t: Pt }[] = [
  { b: { x: M + C / 2, y: M + C }, n: { x: 0, y: -1 }, t: { x: 1, y: 0 } },
  { b: { x: M + C, y: M + C / 2 }, n: { x: -1, y: 0 }, t: { x: 0, y: 1 } },
  { b: { x: M + C / 2, y: M }, n: { x: 0, y: 1 }, t: { x: 1, y: 0 } },
  { b: { x: M, y: M + C / 2 }, n: { x: 1, y: 0 }, t: { x: 0, y: 1 } },
];
const PUESTOS_META = [
  [11, -9.5],
  [11, 9.5],
  [24, -4.5],
  [24, 4.5],
];

export const ESCALA = { vuelta: 1, casa: 1.4, meta: 0.68, doble: 0.9 };

/** Posiciones en pantalla (ya giradas si la casa de este celular es la de Él). */
export class Geo {
  constructor(readonly gira: boolean) {}
  p(q: Pt): Pt {
    return this.gira ? { x: L - q.x, y: L - q.y } : q;
  }
  private rect(r: Rect): Rect {
    return this.gira ? { x: L - r.x - r.w, y: L - r.y - r.h, w: r.w, h: r.h } : r;
  }
  /** Centro de la ficha `i` de `r` que va en `p` (sin el corrimiento de cuando comparten casilla). */
  punto(r: Rol, p: number, i: number): Pt {
    if (p === CASA) {
      const c = this.p(ESQUINA[BRAZO[r]]);
      return { x: c.x + PUESTOS[i].x, y: c.y + PUESTOS[i].y };
    }
    if (p === META) return this.p(this.enMeta(BRAZO[r], i));
    const q = p <= ENTRADA ? medio(celdaVuelta(absoluta(r, p))) : medio(celdaPasillo(BRAZO[r], p - ENTRADA));
    const s = this.p(q);
    return { x: s.x, y: s.y - 1.5 };
  }
  private enMeta(brazo: number, i: number): Pt {
    const { b, n, t } = META_BASE[brazo];
    const [d, a] = PUESTOS_META[i];
    return { x: b.x + n.x * d + t.x * a, y: b.y + n.y * d + t.y * a + (n.y === 0 ? 2 : n.y < 0 ? -1 : 5) };
  }
  /** ¿La casilla va en un brazo de arriba/abajo (casillas anchas)? */
  vertical(r: Rol, p: number) {
    const brazo = p <= ENTRADA ? lugarVuelta(absoluta(r, p))[0] : BRAZO[r];
    return brazo % 2 === 0;
  }
  /** Centro de la bandeja del dado de quien juega abajo o arriba (en % del tablero). */
  static bandeja(lado: 'abajo' | 'arriba') {
    const c = lado === 'abajo' ? L - M / 2 : M / 2;
    return ((c + MARCO) / (L + 2 * MARCO)) * 100;
  }

  /** El tablero entero (fondo, casas, casillas, pasillos y meta). */
  dibujar(): string {
    const out: string[] = [];
    const R = (r: Rect, extra: string, ins = 0, rx = 3.5) => {
      const q = this.rect(r);
      return `<rect x="${q.x + ins}" y="${q.y + ins}" width="${q.w - 2 * ins}" height="${q.h - 2 * ins}" rx="${rx}" ${extra}/>`;
    };
    // Marco de madera y papel
    out.push(`<rect x="${-MARCO}" y="${-MARCO + 4}" width="${L + 2 * MARCO}" height="${L + 2 * MARCO - 4}" rx="22" fill="#8a5634"/>`);
    out.push(`<rect x="${-MARCO}" y="${-MARCO}" width="${L + 2 * MARCO}" height="${L + 2 * MARCO - 4}" rx="22" fill="#c98b5a"/>`);
    out.push(`<rect x="${-MARCO + 3}" y="${-MARCO + 3}" width="${L + 2 * MARCO - 6}" height="${L + 2 * MARCO - 10}" rx="19" fill="none" stroke="#dba77c" stroke-width="2"/>`);
    out.push(`<rect x="-1" y="-1" width="${L + 2}" height="${L + 2}" rx="10" fill="#fff8ee" stroke="#8a5634" stroke-opacity=".35" stroke-width="2"/>`);
    // Casas
    for (let b = 0; b < 4; b++) {
      const col = COLOR_BRAZO[b];
      const e = ESQUINA[b];
      const r: Rect = { x: e.x - M / 2, y: e.y - M / 2, w: M, h: M };
      const juega = b % 2 === 1;
      if (juega) {
        const c = col as typeof COLOR.el;
        out.push(R(r, `fill="${c.oscuro}"`, 5, 18));
        out.push(R(r, `fill="${c.base}"`, 5, 18).replace(/height="([\d.]+)"/, (_, h) => `height="${+h - 4}"`));
        const cc = this.p(e);
        out.push(`<circle cx="${cc.x}" cy="${cc.y + 2}" r="60" fill="${c.oscuro}" opacity=".45"/>`);
        out.push(`<circle cx="${cc.x}" cy="${cc.y}" r="60" fill="#fff8ee"/>`);
        out.push(`<circle cx="${cc.x}" cy="${cc.y}" r="54" fill="none" stroke="${c.suave}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>`);
        for (const d of PUESTOS) {
          out.push(`<ellipse cx="${cc.x + d.x}" cy="${cc.y + d.y + 10}" rx="15" ry="7" fill="${c.suave}"/>`);
        }
      } else {
        out.push(R(r, `fill="${col.suave}"`, 5, 18));
        out.push(R(r, `fill="none" stroke="${col.pasillo}" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round"`, 14, 14));
      }
    }
    // Casillas de la vuelta
    const salidas = new Map<number, number>([
      [4, 0],
      [SALIDA.el, 1],
      [38, 2],
      [SALIDA.ella, 3],
    ]);
    const puntas = new Map<number, number>([
      [67, 0],
      [16, 1],
      [33, 2],
      [50, 3],
    ]);
    for (let t = 0; t < 68; t++) {
      const r = celdaVuelta(t);
      const s = salidas.get(t);
      const pu = puntas.get(t);
      const fill = s !== undefined ? COLOR_BRAZO[s].suave : pu !== undefined ? '#fff3e2' : '#fffdf9';
      const borde = s !== undefined ? COLOR_BRAZO[s].base : '#e6d5bf';
      out.push(R(r, `fill="${fill}" stroke="${borde}" stroke-width="1.3"`, 1.2));
      if (SEGUROS.has(t)) {
        const c = this.p(medio(r));
        const tinta = s !== undefined ? (s % 2 ? COLOR_BRAZO[s].base : '#c9a66b') : '#cdb89e';
        out.push(`<circle cx="${c.x}" cy="${c.y}" r="5.6" fill="none" stroke="${tinta}" stroke-width="1.7"/>`);
        out.push(`<circle cx="${c.x}" cy="${c.y}" r="1.8" fill="${tinta}"/>`);
      }
    }
    // Pasillos
    for (let b = 0; b < 4; b++) {
      const col = COLOR_BRAZO[b];
      const juega = b % 2 === 1;
      for (let c = 1; c <= 7; c++) {
        out.push(R(celdaPasillo(b, c), `fill="${col.pasillo}" stroke="${juega ? (col as typeof COLOR.el).base : col.base}" stroke-opacity="${juega ? 0.8 : 0.5}" stroke-width="1.3"`, 1.2));
      }
      // Flechita en la punta, hacia el pasillo
      const punta = this.p(medio(celda(b, 1, 7)));
      const hacia = this.p(medio(celda(b, 1, 6)));
      const dx = Math.sign(hacia.x - punta.x), dy = Math.sign(hacia.y - punta.y);
      const px = -dy, py = dx;
      const a = { x: punta.x + dx * 5, y: punta.y + dy * 5 };
      out.push(
        `<path d="M${a.x - dx * 7 + px * 5} ${a.y - dy * 7 + py * 5}L${a.x} ${a.y}L${a.x - dx * 7 - px * 5} ${a.y - dy * 7 - py * 5}" fill="none" stroke="${juega ? (col as typeof COLOR.el).base : col.base}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="${juega ? 0.9 : 0.6}"/>`,
      );
    }
    // Meta: cuatro triángulos y un corazón en el medio
    const cen = { x: M + C / 2, y: M + C / 2 };
    const esq = [
      [{ x: M, y: M + C }, { x: M + C, y: M + C }],
      [{ x: M + C, y: M + C }, { x: M + C, y: M }],
      [{ x: M + C, y: M }, { x: M, y: M }],
      [{ x: M, y: M }, { x: M, y: M + C }],
    ];
    for (let b = 0; b < 4; b++) {
      const col = COLOR_BRAZO[b];
      const [p1, p2] = esq[b].map((q) => this.p(q));
      const c = this.p(cen);
      out.push(`<path d="M${p1.x} ${p1.y}L${p2.x} ${p2.y}L${c.x} ${c.y}Z" fill="${b % 2 ? col.base : col.suave}" stroke="#fff8ee" stroke-width="2.5" stroke-linejoin="round"/>`);
    }
    const c = this.p(cen);
    out.push(
      `<g transform="translate(${c.x} ${c.y})"><path d="M0 7.5C-9-1-8.5-8.5-3.8-8.5C-1.6-8.5-.4-7 0-5.6C.4-7 1.6-8.5 3.8-8.5C8.5-8.5 9-1 0 7.5Z" fill="#e4574b" stroke="#fff8ee" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="-3.6" cy="-4.6" rx="1.8" ry="1.2" fill="#fff" opacity=".7"/></g>`,
    );
    return out.join('');
  }
}

/** Degradados de las fichas (brillo arriba a la izquierda). */
export function definiciones(): string {
  const g = (r: Rol) => {
    const c = COLOR[r];
    return `<radialGradient id="parchis-g-${r}" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="${c.claro}"/><stop offset=".5" stop-color="${c.base}"/><stop offset="1" stop-color="${c.oscuro}"/></radialGradient>`;
  };
  return `<defs>${g('el')}${g('ella')}</defs>`;
}

/** Una ficha (peón gordito) centrada en (0,0): mide ~15 de ancho y ~21 de alto. */
export function peon(r: Rol): string {
  const c = COLOR[r];
  const f = `url(#parchis-g-${r})`;
  return `<ellipse class="parchis-halo" cx="0" cy="8" rx="11" ry="4.6" fill="none" stroke="${c.base}" stroke-width="2.2"/>
    <ellipse cx="0" cy="8.6" rx="8.2" ry="2.8" fill="#3d2b27" opacity=".28"/>
    <g class="parchis-giro"><g class="parchis-cuerpo">
      <ellipse cx="0" cy="6.3" rx="7.6" ry="2.9" fill="${c.oscuro}" stroke="#3d2b27" stroke-width="1.1"/>
      <path d="M-7 5.6C-7 1.5-3.4 0-2.7-3.2L2.7-3.2C3.4 0 7 1.5 7 5.6C4.5 7.6-4.5 7.6-7 5.6Z" fill="${f}" stroke="#3d2b27" stroke-width="1.1" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-3.4" rx="4.3" ry="1.7" fill="${c.base}" stroke="#3d2b27" stroke-width="1.1"/>
      <circle cx="0" cy="-8" r="4.7" fill="${f}" stroke="#3d2b27" stroke-width="1.1"/>
      <ellipse cx="-1.7" cy="-9.6" rx="1.8" ry="1.15" fill="#fff" opacity=".85"/>
      <path d="M-4.6 4.2C-4.4 1.8-2.6.6-2 -1.4" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
    </g></g>`;
}
