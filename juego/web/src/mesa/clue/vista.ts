// Vista de «¿Quién fue?»: la casona en SVG (cuartos con su piso y sus muebles, pasillos de baldosa, puertas con
// tapete, pasadizos y el sótano con el sobre), los dos detectives que caminan casilla por casilla, las figuritas de
// los sospechosos y las armas doradas que se mudan de cuarto con cada sospecha, y a un lado los dos dados, el botón
// de lo que toca y los del cuaderno, las cartas y la acusación. Las cartas secretas solo se pintan para quien las ve.
import { otro, type Rol } from '../../casa/modelo';
import * as sonido from '../../sonido';
import type { CtxVista, Vista } from '../tipos';
import { arma, cuarto as dibujoCuarto, figurita } from './arte';
import {
  ARMAS, IDS_ARMAS, IDS_CUARTOS, IDS_SOSPECHOSOS, SOSPECHOSOS, cartasParaMostrar, nombreCarta, ocupadaPor, reglas,
  repartir, sabidas, suma, tipoDe, type Carta, type EstadoClue, type IdArma, type IdSospechoso, type MovClue,
} from './reglas';
import { ALTO, ANCHO, CUARTO, CUARTOS, ESQUINAS, INICIO, SOTANO, alcance, enCuarto, pasillo, type IdCuarto, type Lugar } from './tablero';
import './clue.css';

const ROLES: Rol[] = ['el', 'ella'];
const NS = 'http://www.w3.org/2000/svg';
const RAPIDO = Math.max(1, Number(new URLSearchParams(location.search).get('rapido')) || 1);
const REDUCIDO = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ms = (x: number) => (x / RAPIDO) * (REDUCIDO ? 0.55 : 1);
const dormir = (x: number) => new Promise<void>((r) => setTimeout(r, ms(x)));
const suave = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const rebote = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;

function tween(dur: number, fn: (t: number) => void): Promise<void> {
  const d = ms(dur);
  return new Promise((res) => {
    const t0 = performance.now();
    const paso = (ahora: number) => {
      const t = d <= 0 ? 1 : Math.min(1, (ahora - t0) / d);
      fn(t);
      if (t < 1) requestAnimationFrame(paso);
      else res();
    };
    requestAnimationFrame(paso);
  });
}

// Sonidos propios: dados en la mano, el golpe en la mesa, los pasitos y el papel de las cartas
function sonarDados() {
  for (let k = 0; k < 8; k++) sonido.rumor(0.045, 2000 + Math.random() * 1600, 0.07, (k * 0.09 + Math.random() * 0.04) / RAPIDO, 3);
}
function golpe() {
  sonido.nota(170, 0.1, 0, 'sine', 0.13, 90);
  sonido.rumor(0.05, 800, 0.08, 0, 1.2);
}
function paso(n: number) {
  sonido.nota(520 + (n % 2) * 90, 0.04, 0, 'triangle', 0.04);
}
function papel() {
  sonido.rumor(0.08, 3600, 0.05, 0, 2, 1800);
}

/** Colores de cada detective (los mismos de la mesa: él azul, ella rosado). */
const COLOR: Record<Rol, { base: string; oscuro: string; suave: string; piel: string; pelo: string }> = {
  el: { base: '#5b8fd6', oscuro: '#3b69a8', suave: '#cfe2f7', piel: '#e2a77f', pelo: '#3b2418' },
  ella: { base: '#e86a8a', oscuro: '#b9456a', suave: '#fbd6df', piel: '#f3c6a2', pelo: '#6b3d22' },
};
/** Nombres cortos en el tablero (los completos van en las cartas). */
const CORTO: Record<IdCuarto, string> = {
  cocina: 'Cocina', salon: 'Salón de fiestas', patio: 'Patio', juegos: 'Juegos', biblioteca: 'Biblioteca',
  estudio: 'Estudio', comedor: 'Comedor', salatv: 'Sala de TV', recibidor: 'Recibidor',
};
const EN: Record<IdCuarto, string> = {
  cocina: 'en la Cocina', salon: 'en el Salón de fiestas', patio: 'en el Patio de las matas', juegos: 'en el Cuarto de juegos',
  biblioteca: 'en la Biblioteca', estudio: 'en el Estudio', comedor: 'en el Comedor', salatv: 'en la Sala de TV', recibidor: 'en el Recibidor',
};
const QUIEN: Record<IdSospechoso, string> = {
  fresa: 'la Señorita Fresa', maracuya: 'el Coronel Maracuyá', arepa: 'Doña Arepa', aguacate: 'Don Aguacate',
  arandano: 'la Señora Arándano', mora: 'el Profe Mora',
};
const conQue = (a: IdArma) => {
  const n = ARMAS.find((x) => x.id === a)!.nombre;
  return n[0].toLowerCase() + n.slice(1);
};
const frase = (s: IdSospechoso, a: IdArma, c: IdCuarto) => `¿Fue ${QUIEN[s]} con ${conQue(a)} ${EN[c]}?`;

/** Mezcla un color con el papel (para el fondo de las cartas). */
function aclarar(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const papel = [0xff, 0xf8, 0xee];
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v + (papel[i] - v) * k));
  return `rgb(${c.join(',')})`;
}

// ---------------------------------------------------------------------------
// Dibujos
type Pt = { x: number; y: number };

/** Lado de la esquina que da hacia afuera (ahí va la trampilla del pasadizo; la carta boca abajo, al otro lado). */
const AFUERA: Partial<Record<IdCuarto, 'izq' | 'der'>> = { cocina: 'izq', salatv: 'izq', patio: 'der', estudio: 'der' };
function puntoPasadizo(id: IdCuarto): Pt {
  const c = CUARTO[id];
  return { x: AFUERA[id] === 'izq' ? c.x + 0.55 : c.x + c.w - 0.55, y: c.y + 0.6 };
}
function puntoBocaAbajo(id: IdCuarto): Pt {
  const c = CUARTO[id];
  return { x: AFUERA[id] === 'izq' ? c.x + c.w - 0.55 : c.x + 0.55, y: c.y + 0.62 };
}
/** Dónde se para cada detective: en el pasillo, en su casilla; en un cuarto, a la derecha (cada uno en su puesto). */
function puntoDetective(l: Lugar, r: Rol): Pt {
  if (enCuarto(l)) {
    const c = CUARTO[l.c];
    return { x: c.x + c.w - (r === 'el' ? 1.45 : 0.65), y: c.y + c.h - 0.7 };
  }
  return { x: l.x + 0.5, y: l.y + 0.8 };
}
/** Dónde va cada figurita: los sospechosos en una fila y las armas debajo, desde la izquierda del cuarto. */
function puntosFiguras(e: EstadoClue): Map<string, Pt> {
  const m = new Map<string, Pt>();
  for (const c of CUARTOS) {
    IDS_SOSPECHOSOS.filter((s) => e.sospechosos[s] === c.id).forEach((s, k) => m.set(`s:${s}`, { x: c.x + 0.6 + k * 0.78, y: c.y + c.h - 1.27 }));
    IDS_ARMAS.filter((a) => e.armas[a] === c.id).forEach((a, k) => m.set(`a:${a}`, { x: c.x + 0.6 + k * 0.78, y: c.y + c.h - 0.43 }));
  }
  return m;
}

/** El detective: muñequito con gabardina de su color, sombrero de detective y lupa (pies en el origen). */
function detective(r: Rol): string {
  const c = COLOR[r];
  const pelo = r === 'ella'
    ? `<rect x="-0.32" y="-0.95" width="0.64" height="0.66" rx="0.22" fill="${c.pelo}" stroke="#3d2b27" stroke-width="0.04"/>`
    : '';
  return `<ellipse class="clue-halo" cx="0" cy="0" rx="0.5" ry="0.18" fill="none" stroke="${c.base}" stroke-width="0.07"/>
    <ellipse cx="0" cy="0.02" rx="0.36" ry="0.12" fill="rgba(61,43,39,0.32)"/>
    <g class="clue-salto">
      ${pelo}
      <path d="M-0.34 0 q0 -0.54 0.34 -0.54 q0.34 0 0.34 0.54 q-0.34 0.1 -0.68 0z" fill="${c.base}" stroke="#3d2b27" stroke-width="0.05"/>
      <path d="M0 -0.5 v0.46 M-0.12 -0.46 l0.12 0.14 l0.12 -0.14" fill="none" stroke="${c.oscuro}" stroke-width="0.045"/>
      <rect x="-0.27" y="-0.98" width="0.54" height="0.48" rx="0.17" fill="${c.piel}" stroke="#3d2b27" stroke-width="0.05"/>
      <circle cx="-0.1" cy="-0.72" r="0.04" fill="#2a1a10"/><circle cx="0.1" cy="-0.72" r="0.04" fill="#2a1a10"/>
      <ellipse cx="-0.17" cy="-0.63" rx="0.05" ry="0.03" fill="#f07a85" opacity="0.7"/><ellipse cx="0.17" cy="-0.63" rx="0.05" ry="0.03" fill="#f07a85" opacity="0.7"/>
      <path d="M-0.29 -0.86 q0.02 -0.32 0.29 -0.32 q0.27 0 0.29 0.32z" fill="${c.oscuro}" stroke="#3d2b27" stroke-width="0.045"/>
      <path d="M-0.4 -0.86 h0.8" stroke="#3d2b27" stroke-width="0.075" stroke-linecap="round"/>
      <circle cx="0.38" cy="-0.36" r="0.14" fill="rgba(200,230,255,0.65)" stroke="#c99a1e" stroke-width="0.05"/>
      <path d="M0.28 -0.26 l-0.13 0.15" stroke="#5b3a29" stroke-width="0.07" stroke-linecap="round"/>
    </g>`;
}

/** El reverso de las cartas: vinotinto con la lupa dorada. */
function dorso(w = 0.62, h = 0.84): string {
  return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="0.08" fill="#7a2e3b" stroke="#f2c94c" stroke-width="0.045"/>
    <rect x="${-w / 2 + 0.07}" y="${-h / 2 + 0.07}" width="${w - 0.14}" height="${h - 0.14}" rx="0.05" fill="none" stroke="#f2c94c" stroke-width="0.02" opacity="0.7"/>
    <circle cx="-0.03" cy="-0.04" r="${w * 0.2}" fill="none" stroke="#f2c94c" stroke-width="0.045"/>
    <path d="M${w * 0.1} ${w * 0.11} l${w * 0.14} ${w * 0.16}" stroke="#f2c94c" stroke-width="0.06" stroke-linecap="round"/>`;
}

/** La casona entera (lo que no se mueve). */
function dibujarCasona(): string {
  let s = `<defs>${CUARTOS.map((c) => `<clipPath id="clue-c-${c.id}"><rect width="${c.w}" height="${c.h}" rx="0.15"/></clipPath>`).join('')}
    <clipPath id="clue-c-sotano"><rect width="${SOTANO.w}" height="${SOTANO.h}" rx="0.2"/></clipPath></defs>`;
  // Marco de madera y el jardín de afuera
  s += `<rect x="-0.75" y="-0.75" width="${ANCHO + 1.5}" height="${ALTO + 1.5}" rx="0.6" fill="#6b4226"/>
    <rect x="-0.5" y="-0.5" width="${ANCHO + 1}" height="${ALTO + 1}" rx="0.4" fill="#8a5a34"/>
    <rect x="-0.14" y="-0.14" width="${ANCHO + 0.28}" height="${ALTO + 0.28}" rx="0.14" fill="#bfa47a"/>`;
  // Pasillos de baldosa a cuadros
  for (let y = 0; y < ALTO; y++)
    for (let x = 0; x < ANCHO; x++)
      if (pasillo(x, y)) s += `<rect x="${x + 0.03}" y="${y + 0.03}" width="0.94" height="0.94" rx="0.07" fill="${(x + y) % 2 ? '#f3e5c6' : '#e3cda2'}"/>`;
  // El sótano: piedra, la escalera, la silueta de tiza de Don Cuervo y el sobre
  let sot = '';
  for (let y = 0; y < SOTANO.h; y++) for (let x = 0; x < SOTANO.w; x++) sot += `<rect x="${x}" y="${y}" width="1" height="1" fill="${(x * 3 + y) % 2 ? '#5a5160' : '#4f4756'}" stroke="#3f3846" stroke-width="0.03"/>`;
  for (let k = 0; k < 5; k++) sot += `<rect x="0.25" y="${0.3 + k * 0.7}" width="${1.35 - k * 0.08}" height="0.55" rx="0.06" fill="${['#b39a7c', '#a58d70', '#977f64', '#897258', '#7b654d'][k]}" stroke="#3d2b27" stroke-width="0.04"/>`;
  sot += `<g transform="translate(4.85 2.75)" fill="none" stroke="#fff8ee" stroke-width="0.07" stroke-dasharray="0.16 0.09" opacity="0.85">
      <ellipse cx="0" cy="0" rx="0.62" ry="0.36"/><circle cx="-0.82" cy="-0.12" r="0.26"/><path d="M-1.07 -0.14 l-0.22 0.07 l0.21 0.07"/>
      <path d="M0.55 0.1 l0.38 0.16 M0.55 -0.12 l0.4 -0.1 M-0.2 0.34 l-0.08 0.3 M0.12 0.34 l0.08 0.3"/>
      <circle cx="-0.84" cy="-0.42" r="0.11" stroke-dasharray="none"/></g>
    <text x="4.85" y="3.72" class="clue-tiza" font-size="0.32">Don Cuervo</text>
    <g transform="translate(2.85 1.75) rotate(-6)">
      <rect x="-0.85" y="-0.55" width="1.7" height="1.1" rx="0.08" fill="#f4e2bd" stroke="#3d2b27" stroke-width="0.06"/>
      <path d="M-0.85 -0.55 L0 0.12 L0.85 -0.55" fill="#ead2a0" stroke="#3d2b27" stroke-width="0.05" stroke-linejoin="round"/>
      <circle cx="0" cy="0.1" r="0.26" fill="#c2354a" stroke="#7a1f2b" stroke-width="0.05"/>
      <text x="0" y="0.22" class="clue-sello" font-size="0.34">?</text></g>
    <text x="3" y="0.62" class="clue-nombre clue-nombre-sotano" font-size="0.5">Sótano</text>`;
  s += `<g transform="translate(${SOTANO.x} ${SOTANO.y})"><g clip-path="url(#clue-c-sotano)">${sot}</g>
    <rect width="${SOTANO.w}" height="${SOTANO.h}" rx="0.2" fill="none" stroke="#2a1a10" stroke-width="0.14"/></g>`;
  // Los cuartos: piso, muebles y paredes
  for (const c of CUARTOS)
    s += `<g transform="translate(${c.x} ${c.y})"><g clip-path="url(#clue-c-${c.id})">${dibujoCuarto(c.id, c.w, c.h)}</g>
      <rect width="${c.w}" height="${c.h}" rx="0.15" fill="none" stroke="#4a2e22" stroke-width="0.16"/></g>`;
  // Puertas: el hueco en la pared y el tapete afuera (por ahí se entra)
  for (const c of CUARTOS)
    for (const [px, py] of c.puertas) {
      let x1 = px, y1 = py, x2 = px, y2 = py;
      if (py === c.y + c.h) [x1, y1, x2, y2] = [px + 0.14, c.y + c.h, px + 0.86, c.y + c.h];
      else if (py === c.y - 1) [x1, y1, x2, y2] = [px + 0.14, c.y, px + 0.86, c.y];
      else if (px === c.x - 1) [x1, y1, x2, y2] = [c.x, py + 0.14, c.x, py + 0.86];
      else [x1, y1, x2, y2] = [c.x + c.w, py + 0.14, c.x + c.w, py + 0.86];
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f3e5c6" stroke-width="0.2"/>
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c99a1e" stroke-width="0.05" stroke-dasharray="0.08 0.06"/>
        <rect x="${px + 0.13}" y="${py + 0.13}" width="0.74" height="0.74" rx="0.12" fill="#b8574a" opacity="0.78"/>
        <rect x="${px + 0.22}" y="${py + 0.22}" width="0.56" height="0.56" rx="0.08" fill="none" stroke="#f6cf5a" stroke-width="0.04" stroke-dasharray="0.08 0.06"/>`;
    }
  // Las trampillas de los pasadizos (con la flecha hacia el otro lado)
  for (const c of CUARTOS) {
    if (!c.pasadizo) continue;
    const p = puntoPasadizo(c.id);
    const d = CUARTO[c.pasadizo];
    const ang = (Math.atan2(d.y + d.h / 2 - (c.y + c.h / 2), d.x + d.w / 2 - (c.x + c.w / 2)) * 180) / Math.PI;
    s += `<g class="clue-trampilla" transform="translate(${p.x} ${p.y})">
      <rect x="-0.34" y="-0.34" width="0.68" height="0.68" rx="0.08" fill="#5b3a29" stroke="#2a1a10" stroke-width="0.05"/>
      ${[-0.17, 0, 0.17].map((y) => `<path d="M-0.26 ${y} h0.52" stroke="#3d2b27" stroke-width="0.05"/>`).join('')}
      <g transform="rotate(${ang.toFixed(1)})"><path d="M-0.16 0 h0.3 M0.06 -0.12 l0.12 0.12 l-0.12 0.12" fill="none" stroke="#f6cf5a" stroke-width="0.075" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;
  }
  // Nombres de los cuartos
  for (const c of CUARTOS) s += `<text class="clue-nombre" x="${c.x + c.w / 2}" y="${c.y + 0.78}" font-size="0.56">${CORTO[c.id]}</text>`;
  // Dónde arranca cada detective
  for (const r of ROLES) {
    const [x, y] = INICIO[r];
    s += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.36" fill="none" stroke="${COLOR[r].base}" stroke-width="0.08" stroke-dasharray="0.15 0.1"/>`;
  }
  return s;
}

/** El arte de una carta (para las hojas). */
function arteCarta(c: Carta): string {
  const t = tipoDe(c);
  if (t === 'sospechoso') return `<svg viewBox="-0.6 -1.06 1.2 1.6" aria-hidden="true">${figurita(c as IdSospechoso)}</svg>`;
  if (t === 'arma') return `<svg viewBox="-0.62 -0.62 1.24 1.24" aria-hidden="true">${arma(c as IdArma)}</svg>`;
  const q = CUARTO[c as IdCuarto];
  return `<svg viewBox="0 0 ${q.w} ${q.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${dibujoCuarto(q.id, q.w, q.h)}</svg>`;
}
const tinte = (c: Carta) => {
  const t = tipoDe(c);
  return t === 'sospechoso' ? aclarar(SOSPECHOSOS.find((s) => s.id === c)!.color, 0.55) : t === 'arma' ? '#f7e4a6' : '#d5eadb';
};
const TIPO_TXT = { sospechoso: 'Quién', arma: 'Con qué', cuarto: 'Dónde' } as const;

interface OpcCarta {
  /** Ya se sabe que no está en el sobre (sello ✗). */
  sabida?: boolean;
  apagada?: boolean;
  boton?: boolean;
  nota?: string;
}
function cartaHTML(c: Carta, o: OpcCarta = {}): string {
  const tag = o.boton ? 'button' : 'div';
  const t = tipoDe(c);
  return `<${tag} class="clue-carta clue-carta-${t}${o.sabida ? ' clue-sabida' : ''}${o.apagada ? ' clue-apagada' : ''}" data-carta="${c}" style="--tinte:${tinte(c)}"${o.boton ? ' type="button" aria-pressed="false"' : ''}>
    <span class="clue-tipo">${TIPO_TXT[t]}</span><span class="clue-arte">${arteCarta(c)}</span><b>${nombreCarta(c)}</b>${o.nota ? `<small>${o.nota}</small>` : ''}</${tag}>`;
}

// Dado 3D (el número que salió queda arriba, como en el Parchís)
const CARAS: Record<number, [number, number]> = { 1: [90, 0], 2: [-90, 90], 3: [0, 0], 4: [180, 0], 5: [90, 90], 6: [-90, 0] };
const MIRADA = 'rotateX(-63deg) rotateY(22deg)';
const PUNTOS: Record<number, number[]> = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const siguiente = (min: number, meta: number) => min + ((((meta - min) % 360) + 360) % 360);
interface Dado {
  el: HTMLElement;
  cubo: HTMLElement;
  rx: number;
  ry: number;
}

type Marca = '' | 'no' | 'si' | 'duda';
const CLAVE_NOTAS = 'nuestro-hogar-clue-notas';
const SIG_MARCA: Record<Marca, Marca> = { '': 'no', no: 'si', si: 'duda', duda: '' };
const TXT_MARCA: Record<Marca, string> = { '': '', no: '✗', si: '✓', duda: '?' };

const ICONO = {
  cuaderno: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="15" height="18" rx="2.5" fill="#f6cf5a" stroke="#3d2b27" stroke-width="1.6"/><path d="M8.5 8h8M8.5 12h8M8.5 16h5" stroke="#3d2b27" stroke-width="1.5" stroke-linecap="round"/><path d="M3.5 7h3M3.5 12h3M3.5 17h3" stroke="#3d2b27" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  cartas: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="11" height="15" rx="2" fill="#d5eadb" stroke="#3d2b27" stroke-width="1.6" transform="rotate(-10 8 12)"/><rect x="9" y="4" width="11" height="15" rx="2" fill="#fff8ee" stroke="#3d2b27" stroke-width="1.6" transform="rotate(8 15 11)"/><circle cx="15" cy="11" r="2.3" fill="#e4574b"/></svg>`,
  acusar: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="#cfe2f7" stroke="#3d2b27" stroke-width="1.8"/><path d="M14.5 14.5l5.5 5.5" stroke="#3d2b27" stroke-width="2.6" stroke-linecap="round"/><path d="M10 6.8v4.2M10 13.2v.2" stroke="#e4574b" stroke-width="2" stroke-linecap="round"/></svg>`,
};

class VistaClue implements Vista<EstadoClue, MovClue> {
  private e: EstadoClue = reglas.inicial('el');
  private quien: Rol | null = null;
  private vivo = true;
  private readonly yo: Rol;
  private readonly svg: SVGSVGElement;
  private readonly capaMarcas: SVGGElement;
  private readonly capaPistas: SVGGElement;
  private readonly capaFiguras: SVGGElement;
  private readonly capaDetectives: SVGGElement;
  private readonly capaVuelo: SVGGElement;
  private readonly detectives = {} as Record<Rol, SVGGElement>;
  private readonly figuras = new Map<string, SVGGElement>();
  private readonly pos = new Map<SVGGElement, Pt>();
  private readonly dados: Dado[] = [];
  private readonly capa: HTMLElement;
  private readonly aviso: HTMLElement;
  private readonly estado: HTMLElement;
  private readonly suma: HTMLElement;
  private readonly bAccion: HTMLButtonElement;
  private readonly bSec: HTMLButtonElement;
  private readonly bAcusar: HTMLButtonElement;
  private fAccion: (() => void) | null = null;
  private fSec: (() => void) | null = null;
  /** El destino que tocó (se confirma con «Ir aquí» o tocándolo otra vez). */
  private sel: Lugar | null = null;
  /** Mientras la máquina o el otro caminan: a dónde podía ir (se ve un instante). */
  private previa: { r: Rol; al: ReturnType<typeof alcance> } | null = null;
  private hoja: string | null = null;
  /** Lo que se abre cuando se cierre la hoja de ahora (la sospecha después de mirar la carta boca abajo...). */
  private pendiente: (() => void) | null = null;
  private alCerrar: (() => void) | null = null;
  private marcas: Partial<Record<Carta, Marca>> = {};
  private firma = '';
  private tAviso = 0;
  private tAuto = 0;

  constructor(private readonly ctx: CtxVista<MovClue>) {
    this.yo = ctx.yo;
    const cara = (n: number) => `<div class="clue-cara clue-c${n}">${PUNTOS[n].map((p) => `<i style="grid-area:${Math.ceil(p / 3)}/${((p - 1) % 3) + 1}"></i>`).join('')}</div>`;
    const dado = (k: number) => `<div class="clue-dado" data-k="${k}" role="button" aria-label="Dado ${k + 1}"><div class="clue-salto-dado"><div class="clue-cubo">${[1, 2, 3, 4, 5, 6].map(cara).join('')}</div></div></div>`;
    ctx.raiz.innerHTML = `
      <div class="clue">
        <div class="clue-tablero">
          <svg class="clue-svg" viewBox="-0.75 -0.75 ${ANCHO + 1.5} ${ALTO + 1.5}" preserveAspectRatio="xMidYMid meet" aria-label="La casona">
            ${dibujarCasona()}
            <g class="clue-marcas"></g><g class="clue-pistas"></g><g class="clue-figuras"></g><g class="clue-detectives"></g><g class="clue-vuelo"></g>
          </svg>
          <div class="clue-aviso" hidden></div>
        </div>
        <aside class="clue-lado">
          <p class="clue-estado" aria-live="polite"></p>
          <div class="clue-dados">${dado(0)}${dado(1)}<b class="clue-suma"></b></div>
          <button class="clue-accion" type="button">Tirar</button>
          <button class="clue-sec" type="button" hidden></button>
          <div class="clue-redondos">
            <button type="button" data-b="cuaderno" aria-label="Cuaderno del detective">${ICONO.cuaderno}<small>Notas</small></button>
            <button type="button" data-b="cartas" aria-label="Mis cartas">${ICONO.cartas}<small>Cartas</small></button>
            <button type="button" data-b="acusar" aria-label="Acusar">${ICONO.acusar}<small>Acusar</small></button>
          </div>
        </aside>
        <div class="clue-capa" hidden></div>
      </div>`;
    const raiz = ctx.raiz;
    this.svg = raiz.querySelector('.clue-svg')!;
    this.capaMarcas = raiz.querySelector('.clue-marcas')!;
    this.capaPistas = raiz.querySelector('.clue-pistas')!;
    this.capaFiguras = raiz.querySelector('.clue-figuras')!;
    this.capaDetectives = raiz.querySelector('.clue-detectives')!;
    this.capaVuelo = raiz.querySelector('.clue-vuelo')!;
    this.capa = raiz.querySelector('.clue-capa')!;
    this.aviso = raiz.querySelector('.clue-aviso')!;
    this.estado = raiz.querySelector('.clue-estado')!;
    this.suma = raiz.querySelector('.clue-suma')!;
    this.bAccion = raiz.querySelector('.clue-accion')!;
    this.bSec = raiz.querySelector('.clue-sec')!;
    this.bAcusar = raiz.querySelector('[data-b="acusar"]')!;
    for (const r of ROLES) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'clue-detective');
      g.dataset.rol = r;
      g.innerHTML = detective(r);
      this.capaDetectives.append(g);
      this.detectives[r] = g;
    }
    for (const s of IDS_SOSPECHOSOS) this.crearFigura(`s:${s}`, figurita(s), 0.78);
    for (const a of IDS_ARMAS) this.crearFigura(`a:${a}`, arma(a), 0.68);
    raiz.querySelectorAll<HTMLElement>('.clue-dado').forEach((d) => {
      const dd: Dado = { el: d, cubo: d.querySelector('.clue-cubo')!, rx: 0, ry: 0 };
      this.dados.push(dd);
      d.addEventListener('click', () => this.tocarDados());
    });
    this.ponerCara(this.dados[0], 5, false);
    this.ponerCara(this.dados[1], 2, false);
    this.bAccion.addEventListener('click', () => {
      sonido.activar();
      this.fAccion?.();
    });
    this.bSec.addEventListener('click', () => {
      sonido.activar();
      this.fSec?.();
    });
    raiz.querySelector('[data-b="cuaderno"]')!.addEventListener('click', () => this.hojaCuaderno());
    raiz.querySelector('[data-b="cartas"]')!.addEventListener('click', () => this.hojaCartas());
    this.bAcusar.addEventListener('click', () => this.hojaAcusar());
    this.capa.addEventListener('click', (ev) => {
      if (ev.target === this.capa && this.capa.dataset.cerrable === 'si') this.cerrarHoja();
    });
    this.svg.addEventListener('pointerdown', this.alTocar);
  }

  private crearFigura(clave: string, cuerpo: string, escala: number) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'clue-fig');
    g.dataset.clave = clave;
    g.dataset.escala = String(escala);
    g.innerHTML = `<g class="clue-fig-in">${cuerpo}</g>`;
    this.capaFiguras.append(g);
    this.figuras.set(clave, g);
  }

  // -------------------------------------------------------------------------
  // Contrato
  pintar(e: EstadoClue) {
    this.e = e;
    this.leerNotas();
    const repartido = e.fase !== 'repartir';
    for (const g of this.figuras.values()) g.style.opacity = repartido ? '1' : '0';
    this.colocar(e);
    this.pintarMarcas();
    this.refrescar();
  }

  permitir(quien: Rol | null) {
    this.quien = quien;
    this.sel = null;
    clearTimeout(this.tAuto);
    const e = this.e;
    if (quien && !reglas.fin(e)) {
      // Quien empieza reparte solo (con su azar); la sospecha y el mostrar abren su hoja
      if (e.fase === 'repartir') this.tAuto = window.setTimeout(() => this.jugar(repartir(this.ctx.azar)), ms(600));
      else if (e.fase === 'sospechar') this.cuandoLibre(() => this.hojaSospecha());
      else if (e.fase === 'mostrar') this.cuandoLibre(() => this.hojaMostrar());
    }
    this.refrescar();
  }

  async animar(antes: EstadoClue, m: MovClue, despues: EstadoClue) {
    this.quien = null;
    this.sel = null;
    clearTimeout(this.tAuto);
    // Si la jugada llegó por otro lado (la red, una prueba), la hoja de decidir ya no sirve
    if (this.hoja === 'sospecha' || this.hoja === 'mostrar' || this.hoja === 'acusar') {
      this.pendiente = null;
      this.cerrarHoja();
    }
    if (this.pendiente && (m.t === 'sospechar' || m.t === 'mostrar' || m.t === 'terminar' || m.t === 'acusar')) this.pendiente = null;
    this.e = antes;
    this.refrescar();
    const r = antes.activo;
    switch (m.t) {
      case 'repartir':
        await this.animarReparto(despues);
        break;
      case 'tirar':
        await this.animarDados(r, m.dados);
        if (despues.fase === 'despues') this.decir(r === this.yo ? '¡Encerrado! No hay por dónde caminar' : `${this.nom(r)} quedó encerrado`, 2000);
        break;
      case 'tirar_ir':
        await this.animarDados(r, m.dados);
        if (!this.vivo) return;
        this.previa = { r, al: alcance(antes.pos[r], suma(m.dados), ocupadaPor(antes, r)) };
        this.e = { ...antes, fase: 'mover', dados: m.dados };
        this.refrescar();
        await dormir(650);
        this.previa = null;
        await this.caminar(antes, r, suma(m.dados), m.a, despues);
        break;
      case 'ir':
        await this.caminar(antes, r, suma(antes.dados), m.a, despues);
        break;
      case 'pasadizo':
        await this.animarPasadizo(antes, r, despues);
        break;
      case 'sospechar':
        await this.animarSospecha(antes, r, despues);
        break;
      case 'mostrar':
        await this.animarMostrar(despues);
        break;
      case 'acusar':
        await this.animarAcusacion(antes, m, despues);
        break;
      case 'terminar':
        this.e = despues;
        this.refrescar();
        await dormir(250);
        break;
    }
    if (!this.vivo) return;
    this.e = despues;
    this.colocar(despues);
    this.pintarMarcas();
    this.refrescar();
  }

  destruir() {
    this.vivo = false;
    clearTimeout(this.tAviso);
    clearTimeout(this.tAuto);
    this.svg.removeEventListener('pointerdown', this.alTocar);
    this.ctx.raiz.innerHTML = '';
  }

  // -------------------------------------------------------------------------
  // Jugar
  private nom(r: Rol) {
    return r === this.yo ? 'Tú' : this.ctx.nombres[r];
  }
  private otroNom() {
    return this.ctx.nombres[otro(this.yo)];
  }
  /** ¿Juega este celular ahora? */
  private mio(): boolean {
    return !!this.quien && this.quien === this.yo && reglas.turno(this.e) === this.yo && !reglas.fin(this.e);
  }

  private jugar(m: MovClue) {
    if (!this.quien) return;
    this.quien = null;
    this.sel = null;
    clearTimeout(this.tAuto);
    this.refrescar();
    this.ctx.jugar(m);
  }

  private tocarDados() {
    sonido.activar();
    if (this.mio() && this.e.fase === 'turno') this.tirar();
  }

  private tirar() {
    const d = (): number => Math.min(6, 1 + Math.floor(this.ctx.azar() * 6));
    for (const dd of this.dados) dd.el.classList.add('clue-apretado');
    this.jugar({ t: 'tirar', dados: [d(), d()] });
  }

  private alcanceMio() {
    const e = this.e;
    if (e.fase !== 'mover' || !e.dados) return null;
    return alcance(e.pos[e.activo], suma(e.dados), ocupadaPor(e, e.activo));
  }

  private readonly alTocar = (ev: PointerEvent) => {
    sonido.activar();
    if (!this.mio() || this.e.fase !== 'mover' || this.hoja) return;
    const al = this.alcanceMio();
    const ctm = this.svg.getScreenCTM();
    if (!al || !ctm) return;
    const q = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
    let elegido: Lugar | null = null;
    // Un cuarto al que se llega (se toca en cualquier parte del cuarto)
    for (const c of al.cuartos) {
      const k = CUARTO[c.c];
      if (q.x >= k.x - 0.1 && q.x <= k.x + k.w + 0.1 && q.y >= k.y - 0.1 && q.y <= k.y + k.h + 0.1) elegido = { c: c.c };
    }
    // O la casilla más cercana a la que se llega
    if (!elegido) {
      let d = 0.95;
      for (const c of al.casillas) {
        const dd = Math.hypot(c.x + 0.5 - q.x, c.y + 0.5 - q.y);
        if (dd < d) {
          d = dd;
          elegido = { x: c.x, y: c.y };
        }
      }
    }
    if (!elegido) return;
    ev.preventDefault();
    const igual = this.sel && JSON.stringify(this.sel) === JSON.stringify(elegido);
    if (igual) return this.irSel();
    sonido.toque();
    this.sel = elegido;
    this.refrescar();
  };

  private irSel() {
    if (!this.sel || !this.mio() || this.e.fase !== 'mover') return;
    this.jugar({ t: 'ir', a: this.sel });
  }

  // -------------------------------------------------------------------------
  // Pintar
  private ponerFig(g: SVGGElement, p: Pt, k = 1, alto = 0) {
    this.pos.set(g, p);
    const s = Number(g.dataset.escala) * k;
    g.setAttribute('transform', `translate(${p.x.toFixed(3)} ${(p.y - alto).toFixed(3)}) scale(${s.toFixed(3)})`);
  }
  private ponerDetective(r: Rol, p: Pt, salto = 0) {
    const g = this.detectives[r];
    this.pos.set(g, p);
    g.setAttribute('transform', `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) scale(1)`);
    (g.querySelector('.clue-salto') as SVGGElement).setAttribute('transform', `translate(0 ${(-salto).toFixed(3)})`);
  }

  private colocar(e: EstadoClue) {
    for (const r of ROLES) this.ponerDetective(r, puntoDetective(e.pos[r], r));
    for (const [k, p] of puntosFiguras(e)) this.ponerFig(this.figuras.get(k)!, p);
    this.ordenar();
  }

  private ordenar() {
    const gs = [...this.figuras.values()].sort((a, b) => (this.pos.get(a)?.y ?? 0) - (this.pos.get(b)?.y ?? 0));
    for (const g of gs) this.capaFiguras.append(g);
    const ds = ROLES.map((r) => this.detectives[r]).sort((a, b) => (this.pos.get(a)?.y ?? 0) - (this.pos.get(b)?.y ?? 0));
    for (const g of ds) this.capaDetectives.append(g);
  }

  /** Las cartas boca abajo de las esquinas (la que ya miró, se ve de frente chiquita). */
  private pintarMarcas() {
    const e = this.e;
    let s = '';
    for (const c of ESQUINAS) {
      const carta = e.bocaAbajo[c];
      if (!carta) continue;
      const p = puntoBocaAbajo(c);
      const vista = e.miradas[this.yo].includes(c);
      s += `<g class="clue-boca${vista ? ' clue-vista' : ''}" transform="translate(${p.x} ${p.y}) rotate(${AFUERA[c] === 'izq' ? 8 : -8})">`;
      s += vista
        ? `<rect x="-0.31" y="-0.42" width="0.62" height="0.84" rx="0.08" fill="${tinte(carta)}" stroke="#3d2b27" stroke-width="0.045"/>
           <g transform="translate(0 ${tipoDe(carta) === 'sospechoso' ? 0.12 : 0}) scale(${tipoDe(carta) === 'cuarto' ? 0.1 : 0.42})">${tipoDe(carta) === 'sospechoso' ? figurita(carta as IdSospechoso) : tipoDe(carta) === 'arma' ? arma(carta as IdArma) : `<g transform="translate(${-CUARTO[carta as IdCuarto].w / 2} ${-CUARTO[carta as IdCuarto].h / 2})">${dibujoCuarto(carta as IdCuarto, CUARTO[carta as IdCuarto].w, CUARTO[carta as IdCuarto].h)}</g>`}</g>`
        : dorso();
      s += `</g>`;
    }
    this.capaMarcas.innerHTML = s;
  }

  /** A dónde se puede ir (casillas con puntico y cuartos que brillan) y el camino al que tocó. */
  private pintarPistas() {
    const e = this.e;
    let al: ReturnType<typeof alcance> | null = null;
    let r: Rol = e.activo;
    if (this.previa) {
      al = this.previa.al;
      r = this.previa.r;
    } else if (this.mio() && e.fase === 'mover') al = this.alcanceMio();
    if (!al) {
      this.capaPistas.innerHTML = '';
      return;
    }
    const col = COLOR[r];
    let s = '';
    for (const c of al.cuartos) {
      const k = CUARTO[c.c];
      const elegido = this.sel && enCuarto(this.sel) && this.sel.c === c.c;
      s += `<rect class="clue-meta${elegido ? ' clue-elegido' : ''}" x="${k.x + 0.1}" y="${k.y + 0.1}" width="${k.w - 0.2}" height="${k.h - 0.2}" rx="0.18" stroke="${col.base}" fill="${col.base}"/>`;
    }
    for (const c of al.casillas) {
      const elegido = this.sel && !enCuarto(this.sel) && this.sel.x === c.x && this.sel.y === c.y;
      s += `<circle class="clue-paso${elegido ? ' clue-elegido' : ''}" cx="${c.x + 0.5}" cy="${c.y + 0.5}" r="${elegido ? 0.36 : 0.17}" fill="${col.base}" stroke="${col.oscuro}"/>`;
    }
    // El camino hasta lo que tocó
    if (this.sel) {
      const cam = enCuarto(this.sel) ? al.cuartos.find((c) => c.c === (this.sel as { c: IdCuarto }).c)?.camino : al.camino(this.sel.x, this.sel.y);
      if (cam) {
        const pts = [puntoDetective(e.pos[r], r), ...cam.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 }))];
        if (enCuarto(this.sel)) pts.push(puntoDetective(this.sel, r));
        s += `<polyline class="clue-camino" points="${pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}" stroke="${col.oscuro}"/>`;
      }
    }
    this.capaPistas.innerHTML = s;
  }

  private textoEstado(): string {
    const e = this.e;
    const f = reglas.fin(e);
    if (f) return f.ganador === this.yo ? '¡Resolviste el caso!' : `${this.otroNom()} resolvió el caso`;
    const t = reglas.turno(e);
    const mio = this.mio();
    const n = this.nom(t);
    switch (e.fase) {
      case 'repartir':
        return 'Repartiendo las cartas…';
      case 'turno': {
        if (!mio) return `${n} va a tirar…`;
        const p = e.pos[this.yo];
        return enCuarto(p) && CUARTO[p.c].pasadizo ? 'Tira los dados o toma el pasadizo' : 'Tira los dados';
      }
      case 'mover':
        if (!mio) return `${n} está caminando…`;
        return this.sel ? '¿Vas para allá? Toca «Ir aquí»' : `Sacaste ${suma(e.dados)}: toca a dónde vas`;
      case 'sospechar': {
        const p = e.pos[e.activo];
        return mio ? `Estás ${enCuarto(p) ? EN[p.c] : ''}: ¿de quién sospechas?` : `${n} está sospechando…`;
      }
      case 'mostrar':
        return mio ? 'Escoge qué carta mostrar' : `${n} busca qué carta mostrarte…`;
      case 'despues':
        return mio ? 'Puedes acusar o terminar tu turno' : `${n} está pensando…`;
    }
  }

  private refrescar() {
    const e = this.e;
    const fin = !!reglas.fin(e);
    const mio = this.mio();
    this.estado.textContent = this.textoEstado();
    this.estado.dataset.quien = reglas.turno(e);
    let acc: { texto: string; ok: boolean; f: () => void } | null = null;
    let sec: { texto: string; f: () => void } | null = null;
    if (mio)
      switch (e.fase) {
        case 'turno': {
          acc = { texto: 'Tirar', ok: true, f: () => this.tirar() };
          const p = e.pos[this.yo];
          if (enCuarto(p) && CUARTO[p.c].pasadizo) sec = { texto: `Pasadizo → ${CORTO[CUARTO[p.c].pasadizo!]}`, f: () => this.jugar({ t: 'pasadizo' }) };
          break;
        }
        case 'mover':
          acc = { texto: 'Ir aquí', ok: !!this.sel, f: () => this.irSel() };
          break;
        case 'sospechar':
          acc = { texto: 'Sospechar', ok: true, f: () => this.hojaSospecha() };
          sec = { texto: 'Terminar turno', f: () => this.jugar({ t: 'terminar' }) };
          break;
        case 'mostrar':
          acc = { texto: 'Mostrar carta', ok: true, f: () => this.hojaMostrar() };
          break;
        case 'despues':
          acc = { texto: 'Terminar turno', ok: true, f: () => this.jugar({ t: 'terminar' }) };
          break;
      }
    this.bAccion.textContent = acc?.texto ?? (fin ? 'Fin del caso' : 'Espera…');
    this.bAccion.disabled = !acc?.ok;
    this.bAccion.classList.toggle('clue-listo', !!acc?.ok);
    this.fAccion = acc?.ok ? acc.f : null;
    this.bSec.hidden = !sec;
    this.bSec.textContent = sec?.texto ?? '';
    this.fSec = sec?.f ?? null;
    const puedeAcusar = mio && (e.fase === 'turno' || e.fase === 'sospechar' || e.fase === 'despues');
    this.bAcusar.disabled = !puedeAcusar;
    const tirar = mio && e.fase === 'turno';
    for (const d of this.dados) {
      d.el.classList.toggle('clue-listo', tirar);
      d.el.style.setProperty('--punto', COLOR[e.activo].oscuro);
      if (!tirar) d.el.classList.remove('clue-apretado');
    }
    this.suma.textContent = e.dados ? `= ${suma(e.dados)}` : '';
    for (const r of ROLES) this.detectives[r].classList.toggle('clue-turno', !fin && e.activo === r && e.fase !== 'repartir');
    this.pintarPistas();
  }

  /** Aviso arriba del tablero. */
  private decir(texto: string, dur = 2200) {
    const a = this.aviso;
    a.innerHTML = texto;
    a.hidden = false;
    a.classList.remove('clue-sale');
    void a.offsetWidth;
    a.classList.add('clue-sale');
    clearTimeout(this.tAviso);
    this.tAviso = window.setTimeout(() => (a.hidden = true), ms(dur));
  }

  // -------------------------------------------------------------------------
  // Dados
  private ponerCara(d: Dado, n: number, girar: boolean) {
    const [ax, ay] = CARAS[n];
    if (girar) {
      d.rx = siguiente(d.rx + 360, ax);
      d.ry = siguiente(d.ry + 720, ay);
      d.cubo.style.transitionDuration = `${ms(820)}ms`;
    } else {
      d.rx = ax;
      d.ry = ay;
      d.cubo.style.transitionDuration = '0s';
    }
    d.cubo.style.transform = `${MIRADA} rotateX(${d.rx}deg) rotateY(${d.ry}deg)`;
  }

  private async animarDados(r: Rol, n: [number, number]) {
    this.ctx.suceso({ tipo: 'lanzar', quien: r });
    this.dados.forEach((d, k) => {
      d.el.classList.remove('clue-rodando', 'clue-apretado', 'clue-listo');
      void d.el.offsetWidth;
      d.el.style.setProperty('--dur', `${ms(840 + k * 80)}ms`);
      d.el.style.setProperty('--punto', COLOR[r].oscuro);
      d.el.classList.add('clue-rodando');
      this.ponerCara(d, n[k], true);
    });
    this.suma.textContent = '';
    sonarDados();
    await dormir(900);
    golpe();
    for (const d of this.dados) d.el.classList.remove('clue-rodando');
    this.suma.textContent = `= ${n[0] + n[1]}`;
    this.suma.classList.remove('clue-pop');
    void this.suma.offsetWidth;
    this.suma.classList.add('clue-pop');
    await dormir(350);
  }

  // -------------------------------------------------------------------------
  // Animaciones
  private async caminar(antes: EstadoClue, r: Rol, pasos: number, a: Lugar, despues: EstadoClue) {
    const al = alcance(antes.pos[r], pasos, ocupadaPor(antes, r));
    const cam = enCuarto(a) ? al.cuartos.find((c) => c.c === a.c)?.camino : al.camino(a.x, a.y);
    const pts = (cam ?? []).map(([x, y]) => ({ x: x + 0.5, y: y + 0.8 }));
    pts.push(puntoDetective(a, r));
    this.e = { ...antes, dados: null, fase: 'mover' };
    this.capaPistas.innerHTML = '';
    let k = 0;
    for (const p of pts) {
      const ini = this.pos.get(this.detectives[r])!;
      if (Math.hypot(p.x - ini.x, p.y - ini.y) < 0.01) continue;
      const lejos = Math.hypot(p.x - ini.x, p.y - ini.y) > 1.3;
      await tween(lejos ? 260 : 150, (t) => {
        const q = suave(t);
        this.ponerDetective(r, { x: ini.x + (p.x - ini.x) * q, y: ini.y + (p.y - ini.y) * q }, Math.sin(Math.PI * t) * 0.22);
      });
      paso(k++);
      this.ordenar();
      if (!this.vivo) return;
    }
    if (enCuarto(a)) {
      sonido.nota(660, 0.08, 0, 'triangle', 0.05);
      await this.mirarBocaAbajo(antes, r, despues);
    }
  }

  private async animarPasadizo(antes: EstadoClue, r: Rol, despues: EstadoClue) {
    const p = antes.pos[r];
    if (!enCuarto(p)) return;
    const al = CUARTO[p.c].pasadizo!;
    const g = this.detectives[r];
    const ini = this.pos.get(g)!;
    const t1 = puntoPasadizo(p.c);
    this.decir(`${this.nom(r)} ${r === this.yo ? 'tomas' : 'toma'} el pasadizo secreto → ${CORTO[al]}`, 1800);
    await tween(380, (t) => this.ponerDetective(r, { x: ini.x + (t1.x - ini.x) * suave(t), y: ini.y + (t1.y - ini.y) * suave(t) }, Math.sin(Math.PI * t) * 0.3));
    sonido.nota(400, 0.25, 0, 'sine', 0.07, 160);
    await tween(260, (t) => g.setAttribute('transform', `translate(${t1.x} ${t1.y}) scale(${(1 - t).toFixed(3)})`));
    await dormir(260);
    const t2 = puntoPasadizo(al);
    const fin = puntoDetective({ c: al }, r);
    sonido.nota(160, 0.25, 0, 'sine', 0.07, 420);
    await tween(280, (t) => g.setAttribute('transform', `translate(${t2.x} ${t2.y}) scale(${rebote(t).toFixed(3)})`));
    await tween(380, (t) => this.ponerDetective(r, { x: t2.x + (fin.x - t2.x) * suave(t), y: t2.y + (fin.y - t2.y) * suave(t) }, Math.sin(Math.PI * t) * 0.3));
    this.ordenar();
    await this.mirarBocaAbajo(antes, r, despues);
  }

  /** Al entrar a una esquina con carta boca abajo sin mirar: la mira (en secreto). */
  private async mirarBocaAbajo(antes: EstadoClue, r: Rol, despues: EstadoClue) {
    if (despues.miradas[r].length <= antes.miradas[r].length) return;
    const c = despues.miradas[r][despues.miradas[r].length - 1];
    const carta = despues.bocaAbajo[c]!;
    this.e = { ...this.e, miradas: despues.miradas };
    if (r === this.yo) {
      this.pintarMarcas();
      await this.revelar(`La carta boca abajo ${EN[c]}`, carta, 'No está en el sobre: queda tachada en tu cuaderno.');
    } else {
      this.decir(`${this.nom(r)} miró a escondidas la carta boca abajo ${EN[c]}`, 2200);
      papel();
      await dormir(700);
    }
  }

  private async animarSospecha(antes: EstadoClue, r: Rol, despues: EstadoClue) {
    const q = despues.sospechas[despues.sospechas.length - 1];
    this.ctx.suceso({ tipo: 'suerte', quien: r });
    this.decir(`<b>${this.nom(r)}:</b> ${frase(q.s, q.a, q.c)}`, 3600);
    sonido.aviso();
    // El sospechoso y el arma llegan volando al cuarto
    const fin = puntosFiguras(despues);
    const vuelos: Promise<void>[] = [];
    for (const clave of [`s:${q.s}`, `a:${q.a}`]) {
      const g = this.figuras.get(clave)!;
      const ini = this.pos.get(g)!;
      const p = fin.get(clave)!;
      if (Math.hypot(p.x - ini.x, p.y - ini.y) < 0.05) {
        vuelos.push(tween(500, (t) => this.ponerFig(g, p, 1 + Math.sin(Math.PI * t) * 0.35)));
        continue;
      }
      vuelos.push(dormir(clave[0] === 'a' ? 180 : 0).then(() =>
        tween(800, (t) => {
          const k = suave(t);
          this.ponerFig(g, { x: ini.x + (p.x - ini.x) * k, y: ini.y + (p.y - ini.y) * k }, 1 + Math.sin(Math.PI * t) * 0.5, Math.sin(Math.PI * t) * 1.6);
        }),
      ));
    }
    // Las otras figuras del cuarto se hacen a un lado
    for (const [clave, p] of fin) {
      if (clave === `s:${q.s}` || clave === `a:${q.a}`) continue;
      const g = this.figuras.get(clave)!;
      const ini = this.pos.get(g)!;
      if (Math.hypot(p.x - ini.x, p.y - ini.y) > 0.01) vuelos.push(tween(400, (t) => this.ponerFig(g, { x: ini.x + (p.x - ini.x) * suave(t), y: ini.y + (p.y - ini.y) * suave(t) })));
    }
    await Promise.all(vuelos);
    this.ordenar();
    golpe();
    await dormir(1300);
    void antes;
  }

  private async animarMostrar(despues: EstadoClue) {
    const q = despues.sospechas[despues.sospechas.length - 1];
    if (!q) return;
    const quien = q.quien;
    const muestra = otro(quien);
    if (q.carta) {
      this.ctx.suceso({ tipo: 'jugada', quien, calidad: 'buena', texto: '¡Una pista!' });
      papel();
      if (quien === this.yo) {
        this.e = despues;
        await this.revelar(`${this.ctx.nombres[muestra]} te mostró`, q.carta, 'Esa no fue: queda tachada en tu cuaderno.');
      } else {
        this.decir(`Le mostraste <b>${nombreCarta(q.carta)}</b> a ${this.ctx.nombres[quien]}`, 2400);
        await dormir(1200);
      }
    } else {
      this.ctx.suceso({ tipo: 'jugada', quien, calidad: 'genial', texto: '¡Nadie la desmiente!' });
      sonido.campana();
      this.decir(
        quien === this.yo
          ? `${this.otroNom()} no tiene ninguna: o están en el sobre… o boca abajo`
          : `No tenías ninguna: ${this.ctx.nombres[quien]} anda con la pista caliente`,
        3000,
      );
      await dormir(1500);
    }
  }

  private async animarAcusacion(antes: EstadoClue, m: Extract<MovClue, { t: 'acusar' }>, despues: EstadoClue) {
    const r = antes.activo;
    const sobre = despues.sobre!;
    const acerto = !!despues.acusacion?.acerto;
    this.ctx.suceso({ tipo: 'suerte', quien: r });
    const h = this.abrirHoja(
      'sobre',
      `<h3>${r === this.yo ? 'Acusas' : `${this.ctx.nombres[r]} acusa`}</h3>
      <p class="clue-frase">${frase(m.s, m.a, m.c).replace('¿Fue', '¡Fue').replace('?', '!')}</p>
      <div class="clue-fila clue-sobre">${([sobre.s, sobre.a, sobre.c] as Carta[]).map((c, k) => `<div class="clue-volteo" data-k="${k}"><div class="clue-volteo-in"><div class="clue-dorso"></div><div class="clue-frente">${cartaHTML(c)}</div></div></div>`).join('')}</div>
      <p class="clue-veredicto" hidden></p>`,
      false,
    );
    sonido.aviso();
    await dormir(1200);
    const dichas = [m.s, m.a, m.c];
    const vs = [...h.querySelectorAll<HTMLElement>('.clue-volteo')];
    for (let k = 0; k < 3; k++) {
      if (!this.vivo) return;
      vs[k].classList.add('clue-abierta');
      vs[k].classList.add(dichas[k] === [sobre.s, sobre.a, sobre.c][k] ? 'clue-bien' : 'clue-mal');
      papel();
      await dormir(750);
    }
    const v = h.querySelector<HTMLElement>('.clue-veredicto')!;
    v.hidden = false;
    v.classList.toggle('clue-acerto', acerto);
    v.textContent = acerto
      ? r === this.yo ? '¡Caso resuelto! Eres la mera detective' : `¡${this.ctx.nombres[r]} resolvió el caso!`
      : r === this.yo ? `¡No era! El caso se lo lleva ${this.otroNom()}` : `¡${this.ctx.nombres[r]} se equivocó! El caso es tuyo`;
    if (r === this.yo && acerto && this.yo === 'el') v.textContent = '¡Caso resuelto! Eres el mero detective';
    this.ctx.suceso(acerto ? { tipo: 'jugada', quien: r, calidad: 'genial', texto: '¡Caso resuelto!' } : { tipo: 'jugada', quien: r, calidad: 'nula', texto: '¡Se equivocó!' });
    if (acerto) sonido.regalo();
    else sonido.enojo();
    await dormir(2600);
    this.cerrarHoja();
  }

  private async animarReparto(d: EstadoClue) {
    this.decir('Don Cuervo amaneció en el sótano con un chichón del tamaño de una arepa. <b>¿Quién fue, con qué y dónde?</b>', 4200);
    const centro: Pt = { x: SOTANO.x + 2.85, y: SOTANO.y + 1.75 };
    const metas: Pt[] = [centro, centro, centro, ...ESQUINAS.map(puntoBocaAbajo)];
    for (let k = 0; k < 14; k++) metas.push(k % 2 ? { x: 12, y: -1.4 } : { x: 12, y: ALTO + 1.4 });
    const vuelos = metas.map((p, k) => {
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = dorso();
      g.setAttribute('transform', `translate(${centro.x} ${centro.y}) scale(0)`);
      this.capaVuelo.append(g);
      return dormir(k * 75).then(async () => {
        if (k % 3 === 0) papel();
        await tween(420, (t) => {
          const q = suave(t);
          const x = centro.x + (p.x - centro.x) * q;
          const y = centro.y + (p.y - centro.y) * q - Math.sin(Math.PI * t) * 1.2;
          g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(t * 360 * (k % 2 ? 1 : -1)).toFixed(0)}) scale(${(0.6 + 0.4 * Math.min(1, t * 3)).toFixed(2)})`);
        });
        g.remove();
        if (k >= 3 && k < 7) {
          this.e = { ...this.e, bocaAbajo: d.bocaAbajo };
          this.pintarMarcas();
        }
      });
    });
    await Promise.all(vuelos);
    if (!this.vivo) return;
    // Las figuritas aparecen en sus cuartos (una por cuarto, como en el original)
    const fin = puntosFiguras(d);
    let k = 0;
    const pops: Promise<void>[] = [];
    for (const [clave, p] of fin) {
      const g = this.figuras.get(clave)!;
      g.style.opacity = '1';
      this.ponerFig(g, p, 0);
      pops.push(dormir(k++ * 70).then(() => {
        sonido.burbuja();
        return tween(380, (t) => this.ponerFig(g, p, rebote(t)));
      }));
    }
    await Promise.all(pops);
    this.ordenar();
    this.e = d;
    await dormir(300);
    // Cada uno mira sus cartas antes de arrancar
    await new Promise<void>((res) => this.hojaCartas(true, res));
  }

  // -------------------------------------------------------------------------
  // Hojas
  private abrirHoja(tipo: string, html: string, cerrable = true): HTMLElement {
    this.alCerrar = null;
    this.capa.hidden = false;
    this.capa.dataset.cerrable = cerrable ? 'si' : 'no';
    this.capa.innerHTML = `<div class="clue-hoja clue-hoja-${tipo}" role="dialog">${cerrable ? '<button class="clue-x" type="button" aria-label="Cerrar">×</button>' : ''}${html}</div>`;
    this.hoja = tipo;
    const h = this.capa.firstElementChild as HTMLElement;
    h.querySelector('.clue-x')?.addEventListener('click', () => this.cerrarHoja());
    return h;
  }

  private cerrarHoja() {
    if (!this.hoja) return;
    this.capa.hidden = true;
    this.capa.innerHTML = '';
    this.hoja = null;
    const f = this.alCerrar;
    this.alCerrar = null;
    f?.();
    const p = this.pendiente;
    this.pendiente = null;
    p?.();
    this.refrescar();
  }

  /** Abre algo cuando no haya otra hoja encima. */
  private cuandoLibre(f: () => void) {
    if (this.hoja) this.pendiente = f;
    else f();
  }

  /** Una carta que se voltea (la que le mostraron o la boca abajo): espera a que se vea y queda hasta «¡Anotado!». */
  private async revelar(titulo: string, carta: Carta, nota: string) {
    const h = this.abrirHoja(
      'revela',
      `<h3>${titulo}</h3><div class="clue-volteo clue-grande"><div class="clue-volteo-in"><div class="clue-dorso"></div><div class="clue-frente">${cartaHTML(carta)}</div></div></div>
      <p class="clue-nota">${nota}</p><button class="clue-boton" type="button" data-ok>¡Anotado!</button>`,
      false,
    );
    h.querySelector('[data-ok]')!.addEventListener('click', () => this.cerrarHoja());
    await dormir(350);
    papel();
    h.querySelector('.clue-volteo')!.classList.add('clue-abierta');
    await dormir(900);
  }

  private hojaSospecha() {
    const e = this.e;
    const p = e.pos[this.yo];
    if (!this.mio() || e.fase !== 'sospechar' || !enCuarto(p)) return;
    const sabe = sabidas(e, this.yo);
    let s: IdSospechoso | null = null;
    let a: IdArma | null = null;
    const h = this.abrirHoja(
      'sospecha',
      `<h3>¿Quién fue y con qué? <small>${EN[p.c]}</small></h3>
      <div class="clue-fila" data-fila="s">${IDS_SOSPECHOSOS.map((c) => cartaHTML(c, { sabida: sabe.has(c), boton: true })).join('')}</div>
      <div class="clue-fila" data-fila="a">${IDS_ARMAS.map((c) => cartaHTML(c, { sabida: sabe.has(c), boton: true })).join('')}</div>
      <div class="clue-pie"><p class="clue-frase">Escoge un sospechoso y un arma</p>
        <button class="clue-boton clue-boton-sec" type="button" data-no>Ahora no</button><button class="clue-boton" type="button" data-ok disabled>Sospechar</button></div>`,
    );
    const ok = h.querySelector<HTMLButtonElement>('[data-ok]')!;
    const texto = h.querySelector('.clue-frase')!;
    const pintar = () => {
      h.querySelectorAll<HTMLElement>('.clue-carta').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.carta === s || b.dataset.carta === a)));
      ok.disabled = !(s && a);
      texto.textContent = s && a ? frase(s, a, p.c) : s ? `${QUIEN[s][0].toUpperCase()}${QUIEN[s].slice(1)}… ¿con qué?` : a ? `Con ${conQue(a)}… ¿quién?` : 'Escoge un sospechoso y un arma';
    };
    h.querySelectorAll<HTMLElement>('.clue-carta').forEach((b) =>
      b.addEventListener('click', () => {
        sonido.toque();
        const c = b.dataset.carta as Carta;
        if (tipoDe(c) === 'sospechoso') s = c as IdSospechoso;
        else a = c as IdArma;
        pintar();
      }),
    );
    h.querySelector('[data-no]')!.addEventListener('click', () => this.cerrarHoja());
    ok.addEventListener('click', () => {
      if (!s || !a) return;
      const m: MovClue = { t: 'sospechar', s, a };
      this.cerrarHoja();
      this.jugar(m);
    });
  }

  private hojaMostrar() {
    const e = this.e;
    const q = e.sospechas[e.sospechas.length - 1];
    if (!this.mio() || e.fase !== 'mostrar' || !q) return;
    const tengo = cartasParaMostrar(e);
    const n = this.ctx.nombres[q.quien];
    const h = this.abrirHoja(
      'mostrar',
      `<h3>${n} sospecha</h3><p class="clue-frase">${frase(q.s, q.a, q.c)}</p>
      <div class="clue-fila">${([q.s, q.a, q.c] as Carta[]).map((c) => cartaHTML(c, { apagada: !tengo.includes(c), boton: tengo.includes(c), nota: tengo.includes(c) ? 'la tienes' : 'no la tienes' })).join('')}</div>
      <p class="clue-nota">${tengo.length > 1 ? `Tienes ${tengo.length}: toca la que le vas a mostrar (solo la ve ${n}).` : tengo.length ? `Tienes esta: tócala para mostrársela (solo la ve ${n}).` : 'No tienes ninguna: nadie la puede desmentir.'}</p>
      ${tengo.length ? '' : '<button class="clue-boton" type="button" data-ok>Listo</button>'}`,
      false,
    );
    const mostrar = (carta: Carta | null) => {
      this.cerrarHoja();
      this.jugar({ t: 'mostrar', carta });
    };
    h.querySelectorAll<HTMLElement>('button.clue-carta').forEach((b) => b.addEventListener('click', () => mostrar(b.dataset.carta as Carta)));
    h.querySelector('[data-ok]')?.addEventListener('click', () => mostrar(null));
  }

  private hojaAcusar() {
    const e = this.e;
    if (!this.mio() || !(e.fase === 'turno' || e.fase === 'sospechar' || e.fase === 'despues')) return;
    sonido.toque();
    const sabe = sabidas(e, this.yo);
    const elegido: { s: IdSospechoso | null; a: IdArma | null; c: IdCuarto | null } = { s: null, a: null, c: null };
    const h = this.abrirHoja(
      'acusar',
      `<h3>Acusar <small>una sola vez: si te equivocas, ${this.otroNom()} gana el caso</small></h3>
      <div class="clue-fila" data-fila="s">${IDS_SOSPECHOSOS.map((c) => cartaHTML(c, { sabida: sabe.has(c), boton: true })).join('')}</div>
      <div class="clue-fila" data-fila="a">${IDS_ARMAS.map((c) => cartaHTML(c, { sabida: sabe.has(c), boton: true })).join('')}</div>
      <div class="clue-fila clue-fila-cuartos" data-fila="c">${IDS_CUARTOS.map((c) => cartaHTML(c, { sabida: sabe.has(c), boton: true })).join('')}</div>
      <div class="clue-pie"><p class="clue-frase">Escoge quién, con qué y dónde</p><button class="clue-boton clue-boton-peligro" type="button" data-ok disabled>Acusar</button></div>`,
    );
    const ok = h.querySelector<HTMLButtonElement>('[data-ok]')!;
    const texto = h.querySelector('.clue-frase')!;
    let seguro = false;
    const pintar = () => {
      h.querySelectorAll<HTMLElement>('.clue-carta').forEach((b) => b.setAttribute('aria-pressed', String(Object.values(elegido).includes(b.dataset.carta as never))));
      const listo = !!(elegido.s && elegido.a && elegido.c);
      ok.disabled = !listo;
      seguro = false;
      ok.textContent = 'Acusar';
      texto.textContent = listo ? frase(elegido.s!, elegido.a!, elegido.c!) : 'Escoge quién, con qué y dónde';
    };
    h.querySelectorAll<HTMLElement>('.clue-carta').forEach((b) =>
      b.addEventListener('click', () => {
        sonido.toque();
        const c = b.dataset.carta as Carta;
        const t = tipoDe(c);
        if (t === 'sospechoso') elegido.s = c as IdSospechoso;
        else if (t === 'arma') elegido.a = c as IdArma;
        else elegido.c = c as IdCuarto;
        pintar();
      }),
    );
    ok.addEventListener('click', () => {
      if (!elegido.s || !elegido.a || !elegido.c) return;
      // Confirmar: es la jugada de la partida
      if (!seguro) {
        seguro = true;
        ok.textContent = '¿Segur@? ¡Acuso!';
        texto.innerHTML = `${frase(elegido.s, elegido.a, elegido.c)} <b>Si no es, pierdes.</b>`;
        sonido.alarma();
        return;
      }
      const m: MovClue = { t: 'acusar', s: elegido.s, a: elegido.a, c: elegido.c };
      this.cerrarHoja();
      this.jugar(m);
    });
  }

  /** Mis cartas y las boca abajo que ya miré. `inicio`: al repartir (con el cuento). */
  private hojaCartas(inicio = false, alCerrar?: () => void) {
    const e = this.e;
    if (!e.manos[this.yo].length) return alCerrar?.();
    if (!inicio) sonido.toque();
    const vistas = e.miradas[this.yo].filter((c) => e.bocaAbajo[c]);
    const h = this.abrirHoja(
      'cartas',
      `<h3>${inicio ? 'Tus cartas' : 'Mis cartas'} <small>${inicio ? 'ninguna de estas está en el sobre (ya quedaron tachadas en tu cuaderno)' : 'ninguna está en el sobre'}</small></h3>
      <div class="clue-fila clue-mano">${e.manos[this.yo].map((c) => cartaHTML(c)).join('')}</div>
      ${vistas.length ? `<div class="clue-fila clue-mano">${vistas.map((c) => cartaHTML(e.bocaAbajo[c]!, { nota: `boca abajo · ${CORTO[c]}` })).join('')}</div>` : ''}
      ${inicio ? `<button class="clue-boton" type="button" data-ok>¡A investigar!</button>` : ''}`,
      !inicio,
    );
    if (alCerrar) this.alCerrar = alCerrar;
    h.querySelector('[data-ok]')?.addEventListener('click', () => this.cerrarHoja());
    papel();
  }

  // Cuaderno del detective
  private leerNotas() {
    const firma = `${this.e.empieza}|${this.e.manos[this.yo].join(',')}`;
    if (firma === this.firma) return;
    this.firma = firma;
    this.marcas = {};
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_NOTAS) || 'null');
      if (g && g.firma === firma) this.marcas = g.m ?? {};
    } catch {
      /* sin notas guardadas */
    }
  }
  private guardarNotas() {
    try {
      localStorage.setItem(CLAVE_NOTAS, JSON.stringify({ firma: this.firma, m: this.marcas }));
    } catch {
      /* sin espacio: las marcas quedan solo en esta partida */
    }
  }

  /** Lo que el cuaderno sabe solo de cada carta. */
  private auto(c: Carta): string {
    const e = this.e;
    if (e.manos[this.yo].includes(c)) return 'tuya';
    if (e.miradas[this.yo].some((q) => e.bocaAbajo[q] === c)) return 'boca abajo';
    if (e.sospechas.some((q) => q.quien === this.yo && q.carta === c)) return 'te la mostró';
    return '';
  }

  private hojaCuaderno(pestana: 'cartas' | 'sospechas' = 'cartas') {
    sonido.toque();
    this.leerNotas();
    const e = this.e;
    const fila = (c: Carta) => {
      const a = this.auto(c);
      const m = this.marcas[c] ?? '';
      const mini = tipoDe(c) === 'cuarto' ? '' : `<i class="clue-mini">${arteCarta(c)}</i>`;
      return `<button type="button" class="clue-nota-fila${a ? ' clue-tachada' : ''}" data-carta="${c}" data-marca="${a ? '' : m}"${a ? ' disabled' : ''}>
        ${mini}<span>${nombreCarta(c)}</span>${a ? `<em>${a}</em>` : `<b>${TXT_MARCA[m]}</b>`}</button>`;
    };
    const col = (t: string, l: Carta[]) => `<div class="clue-col"><h4>${t}</h4>${l.map(fila).join('')}</div>`;
    const historia = e.sospechas.length
      ? e.sospechas
          .map((q) => {
            const mia = q.quien === this.yo;
            const fin = q.carta
              ? mia ? `te mostró <b>${nombreCarta(q.carta)}</b>` : `le mostraste <b>${nombreCarta(q.carta)}</b>`
              : mia ? '<b class="clue-caliente">nadie la desmintió</b>' : 'no tenías ninguna';
            return `<li data-quien="${q.quien}"><span>${this.nom(q.quien)}:</span> ${frase(q.s, q.a, q.c)} → ${fin}</li>`;
          })
          .reverse()
          .join('')
      : '<li class="clue-vacio">Todavía nadie ha sospechado de nadie.</li>';
    const pendientes = this.posiblesEnSobre();
    const h = this.abrirHoja(
      'cuaderno',
      `<h3>Cuaderno del detective</h3>
      <div class="clue-pestanas"><button type="button" data-p="cartas" aria-pressed="${pestana === 'cartas'}">Cartas</button><button type="button" data-p="sospechas" aria-pressed="${pestana === 'sospechas'}">Sospechas (${e.sospechas.length})</button></div>
      ${pestana === 'cartas'
        ? `<p class="clue-nota">Lo que ya sabes queda tachado solo. Toca las demás para marcarlas: ✗ no fue, ✓ ¡fue!, ? quién sabe. Quedan <b>${pendientes}</b> sin descartar.</p>
           <div class="clue-columnas">${col('Quién', IDS_SOSPECHOSOS)}${col('Con qué', IDS_ARMAS)}${col('Dónde', IDS_CUARTOS)}</div>`
        : `<ol class="clue-historia">${historia}</ol>`}`,
    );
    h.querySelectorAll<HTMLElement>('[data-p]').forEach((b) => b.addEventListener('click', () => this.hojaCuaderno(b.dataset.p as 'cartas')));
    h.querySelectorAll<HTMLButtonElement>('.clue-nota-fila:not([disabled])').forEach((b) =>
      b.addEventListener('click', () => {
        const c = b.dataset.carta as Carta;
        const m = SIG_MARCA[this.marcas[c] ?? ''];
        this.marcas[c] = m;
        this.guardarNotas();
        b.dataset.marca = m;
        b.querySelector('b')!.textContent = TXT_MARCA[m];
        sonido.nota(m === 'si' ? 880 : 620, 0.05, 0, 'triangle', 0.05);
      }),
    );
  }

  private posiblesEnSobre(): number {
    const sabe = sabidas(this.e, this.yo);
    return [...IDS_SOSPECHOSOS, ...IDS_ARMAS, ...IDS_CUARTOS].filter((c) => !sabe.has(c)).length;
  }
}

export function crearVista(ctx: CtxVista<MovClue>): Vista<EstadoClue, MovClue> {
  return new VistaClue(ctx);
}
