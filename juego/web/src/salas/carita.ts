// La carita de un jugador dibujada en SVG con sus colores (cabeza cuadradita redondeada, pelo de felpa, ojitos con
// brillo, cachetes y los hombros con su camiseta), para las salas, los chips de los juegos y la sala de amigos.
// Sirve para cualquiera: Javier, Laura o un amigo con lo que armó en el creador (peinado, gorro, gafas, ojos,
// cachetes, aretes y la prenda de arriba, de `prendas.ts`).
import { MODELO, piezaDe } from './prendas';
import type { AspectoJugador } from './tipos';

/** Los colores de fábrica de los muñecos (en sRGB, como se ven en el juego). */
export const COLORES_BASE: Record<'el' | 'ella', { piel: string; pelo: string; ropa: string }> = {
  el: { piel: '#f2b38a', pelo: '#17120f', ropa: '#2a2a30' },
  ella: { piel: '#f2b38a', pelo: '#1d1512', ropa: '#9c8775' },
};

let sig = 0;
const HEX = /^#[0-9a-f]{6}$/i;
const hex = (v: string | undefined, d: string) => (v && HEX.test(v) ? v : d);

/** Color de una prenda de los detalles: el escogido, el de su primera variante o uno de reserva. */
function colorPrenda(valor: string | undefined, k: 0 | 1, reserva: string): string {
  if (!valor) return reserva;
  const [m, c1, c2] = valor.split('#');
  const c = k === 0 ? c1 : c2;
  if (c && HEX.test(`#${c}`)) return `#${c}`;
  const mu = MODELO[m]?.mu?.[0]?.[k];
  return mu ?? reserva;
}

/** El pelo de atrás y el de arriba según el peinado (familia de forma) y el molde. */
function pelos(f: string, ella: boolean, pelo: string): [string, string] {
  const p = `fill="${pelo}"`;
  const brillo = 'fill="rgba(255,255,255,.18)"';
  const largoAtras = `<path d="M14 40 C10 70 14 92 26 96 L74 96 C86 92 90 70 86 40 Z" ${p}/>`;
  const capul = `<path d="M17 44 C16 22 32 12 50 12 C68 12 84 22 83 44 C76 34 66 30 58 31 C52 26 40 26 30 34 C26 37 21 40 17 44 Z" ${p}/>
       <path d="M30 34 C38 30 46 31 52 36 C46 33 37 34 30 38 Z" ${brillo}/>`;
  const copete = `<path d="M18 46 C15 24 30 13 50 13 C70 13 85 24 82 46 C78 38 72 34 66 33 C62 24 52 22 44 27 C38 22 26 26 22 36 C20 40 19 43 18 46 Z" ${p}/>
       <path d="M44 27 C48 18 60 16 66 24 C60 21 52 22 48 27 Z" ${brillo}/>`;
  switch (f) {
    case 'rapado':
      return ['', `<path d="M19 40 C19 22 33 16 50 16 C67 16 81 22 81 40 C72 32 60 30 50 30 C40 30 28 32 19 40 Z" ${p} opacity=".92"/>`];
    case 'lado':
      return ['', `<path d="M18 46 C15 24 30 13 50 13 C70 13 85 24 82 44 C76 30 62 26 40 32 C30 35 22 40 18 46 Z" ${p}/><path d="M40 30 C52 22 66 22 74 30 C64 26 52 27 42 33 Z" ${brillo}/>`];
    case 'copete':
      return ['', `<path d="M18 46 C15 26 28 16 40 15 C38 4 62 0 70 10 C78 14 86 26 82 46 C78 36 70 32 62 32 C56 24 40 26 30 36 C24 39 20 42 18 46 Z" ${p}/><path d="M44 12 C52 4 64 4 68 12 C60 8 52 9 46 14 Z" ${brillo}/>`];
    case 'mohicano':
      return ['', `<path d="M40 36 C38 18 42 4 50 2 C58 4 62 18 60 36 Z" ${p}/><path d="M19 42 C20 30 26 26 32 26 L32 34 C26 35 22 38 19 42 Z M81 42 C80 30 74 26 68 26 L68 34 C74 35 78 38 81 42 Z" ${p} opacity=".55"/>`];
    case 'afro':
      return [`<circle cx="50" cy="40" r="40" ${p}/>`, `<path d="M16 46 C14 22 30 10 50 10 C70 10 86 22 84 46 C76 34 64 30 50 30 C36 30 24 34 16 46 Z" ${p}/>${[[24, 22], [40, 12], [60, 12], [76, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" ${brillo}/>`).join('')}`];
    case 'rizos':
      return ['', `${[[22, 38], [28, 24], [40, 16], [52, 14], [64, 17], [74, 25], [79, 38], [34, 30], [50, 25], [66, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" ${p}/>`).join('')}`];
    case 'rizado':
      return [`<path d="M12 40 C6 70 12 96 26 98 L74 98 C88 96 94 70 88 40 Z" ${p}/>${[[12, 60], [14, 80], [88, 60], [86, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" ${p}/>`).join('')}`, capul];
    case 'colita':
      return ['', `${copete}<circle cx="50" cy="9" r="7" ${p}/>`];
    case 'cola':
      return [`<path d="M78 34 C96 40 98 70 86 86 C84 70 82 54 72 44 Z" ${p}/>`, capul];
    case 'mono':
      return ['', `${capul}<circle cx="50" cy="8" r="11" ${p}/><circle cx="46" cy="5" r="4" ${brillo}/>`];
    case 'trenzas':
      return [`${[18, 82].map((x) => `<path d="M${x - 6} 44 Q${x - 10} 70 ${x - 2} 96 L${x + 6} 96 Q${x + 2} 70 ${x + 6} 44 Z" ${p}/>`).join('')}`, capul];
    case 'colitas':
      return [`<ellipse cx="10" cy="46" rx="9" ry="16" ${p}/><ellipse cx="90" cy="46" rx="9" ry="16" ${p}/>`, capul];
    case 'corto':
      return [`<path d="M14 40 C10 60 14 74 22 78 L78 78 C86 74 90 60 86 40 Z" ${p}/>`, `<path d="M17 50 C14 24 30 12 50 12 C70 12 86 24 83 50 C80 42 76 38 70 38 L30 38 C24 38 20 42 17 50 Z" ${p}/>`];
    case 'flequillo':
      return [largoAtras, `<path d="M17 50 C14 24 30 12 50 12 C70 12 86 24 83 50 C80 42 76 38 70 38 L30 38 C24 38 20 42 17 50 Z" ${p}/>`];
    case 'ondas':
    case 'largo_el':
      return [`<path d="M14 40 C6 56 16 70 10 84 C14 96 26 98 30 98 L70 98 C74 98 86 96 90 84 C84 70 94 56 86 40 Z" ${p}/>`, capul];
    default:
      return ella ? [largoAtras, capul] : ['', copete];
  }
}

/** Gorros, sombreros, coronas, orejitas… (encima de todo). */
function gorro(f: string, c1: string, c2: string): string {
  switch (f) {
    case 'gorra':
      return `<path d="M18 38 C18 18 34 10 50 10 C66 10 82 18 82 38 Z" fill="${c1}"/><path d="M50 36 C66 34 86 36 94 42 C80 44 64 42 50 40 Z" fill="${c2}"/><circle cx="50" cy="11" r="3" fill="${c2}"/>`;
    case 'boina':
      return `<ellipse cx="44" cy="22" rx="34" ry="12" fill="${c1}"/><circle cx="44" cy="11" r="3" fill="${c1}"/>`;
    case 'gorro':
      return `<path d="M18 40 C16 16 34 8 50 8 C66 8 84 16 82 40 Z" fill="${c1}"/><rect x="16" y="32" width="68" height="10" rx="5" fill="${c1}" opacity=".85"/><circle cx="50" cy="7" r="8" fill="${c2}"/>`;
    case 'chef':
      return `<rect x="26" y="20" width="48" height="20" rx="4" fill="#fff"/><circle cx="34" cy="16" r="12" fill="#fff"/><circle cx="50" cy="10" r="13" fill="#fff"/><circle cx="66" cy="16" r="12" fill="#fff"/>`;
    case 'fiesta':
      return `<path d="M50 -6 L70 32 L30 32 Z" fill="${c1}"/><path d="M42 10 L58 10 M36 22 L64 22" stroke="${c2}" stroke-width="4"/><circle cx="50" cy="-5" r="5" fill="${c2}"/>`;
    case 'bruja':
      return `<ellipse cx="50" cy="32" rx="46" ry="8" fill="${c1}"/><path d="M30 32 L52 -10 L70 32 Z" fill="${c1}"/><rect x="31" y="24" width="38" height="6" fill="${c2}"/>`;
    case 'copa':
      return `<ellipse cx="50" cy="30" rx="40" ry="7" fill="${c1}"/><rect x="28" y="-4" width="44" height="34" rx="3" fill="${c1}"/><rect x="28" y="20" width="44" height="6" fill="${c2}"/>`;
    case 'pirata':
      return `<path d="M8 32 C26 12 74 12 92 32 C70 26 30 26 8 32 Z" fill="#1d1d24"/><path d="M22 28 C30 8 70 8 78 28 Z" fill="#1d1d24"/><circle cx="50" cy="19" r="5" fill="#fff"/>`;
    case 'sombrero':
      return `<ellipse cx="50" cy="32" rx="48" ry="10" fill="${c1}"/><path d="M26 32 C26 10 74 10 74 32 Z" fill="${c1}"/><rect x="26" y="24" width="48" height="6" fill="${c2}"/>`;
    case 'corona':
      return `<path d="M24 30 L24 10 L36 20 L50 4 L64 20 L76 10 L76 30 Z" fill="${c1 === '#f4efe6' ? '#f2c14e' : c1}" stroke="#b8892a" stroke-width="1.5"/><circle cx="50" cy="20" r="3.5" fill="${c2}"/>`;
    case 'aureola':
      return `<ellipse cx="50" cy="4" rx="22" ry="5" fill="none" stroke="#ffd34d" stroke-width="4"/>`;
    case 'diadema':
      return `<path d="M18 36 C20 18 34 12 50 12 C66 12 80 18 82 36" fill="none" stroke="${c1}" stroke-width="5"/><path d="M58 14 L74 6 L72 22 Z M58 14 L44 4 L46 20 Z" fill="${c1}"/><circle cx="58" cy="14" r="4" fill="${c1}"/>`;
    case 'flor':
      return `<g transform="translate(74 20)">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${Math.cos((a * Math.PI) / 180) * 7}" cy="${Math.sin((a * Math.PI) / 180) * 7}" r="6" fill="${c1}"/>`).join('')}<circle r="4.5" fill="${c2}"/></g>`;
    case 'orejas':
      return `<circle cx="22" cy="16" r="12" fill="${c1}"/><circle cx="78" cy="16" r="12" fill="${c1}"/><circle cx="22" cy="16" r="6" fill="${c2}"/><circle cx="78" cy="16" r="6" fill="${c2}"/>`;
    case 'conejo':
      return `<ellipse cx="34" cy="0" rx="8" ry="22" fill="${c1}"/><ellipse cx="66" cy="0" rx="8" ry="22" fill="${c1}"/><ellipse cx="34" cy="2" rx="4" ry="15" fill="${c2}"/><ellipse cx="66" cy="2" rx="4" ry="15" fill="${c2}"/>`;
    case 'cuernos':
      return `<path d="M26 22 C22 10 26 2 32 0 C30 8 32 14 36 20 Z M74 22 C78 10 74 2 68 0 C70 8 68 14 64 20 Z" fill="${c1}"/>`;
    case 'antenas':
      return `<path d="M38 16 C34 6 30 2 26 0 M62 16 C66 6 70 2 74 0" stroke="#1d1d24" stroke-width="2.5" fill="none"/><circle cx="26" cy="0" r="5" fill="${c2}"/><circle cx="74" cy="0" r="5" fill="${c2}"/>`;
    default:
      return '';
  }
}

/** Gafas, antifaz, parche, nariz de payaso, bigotes… (sobre la cara). */
function enLaCara(f: string, c1: string, c2: string): string {
  switch (f) {
    case 'gafas':
      return `<circle cx="36" cy="56" r="10" fill="rgba(255,255,255,.18)" stroke="${c1}" stroke-width="3"/><circle cx="64" cy="56" r="10" fill="rgba(255,255,255,.18)" stroke="${c1}" stroke-width="3"/><path d="M46 55 L54 55" stroke="${c1}" stroke-width="3"/>`;
    case 'gafas_sol':
      return `<rect x="24" y="48" width="23" height="15" rx="6" fill="${c2}" stroke="${c1}" stroke-width="2.5"/><rect x="53" y="48" width="23" height="15" rx="6" fill="${c2}" stroke="${c1}" stroke-width="2.5"/><path d="M47 53 L53 53" stroke="${c1}" stroke-width="3"/><path d="M28 51 l6 0" stroke="#fff" stroke-width="2" opacity=".6"/>`;
    case 'antifaz':
      return `<path d="M20 50 C30 44 70 44 80 50 C80 60 70 64 60 60 L50 56 L40 60 C30 64 20 60 20 50 Z" fill="${c1}"/><ellipse cx="36" cy="54" rx="5" ry="4" fill="#fff"/><ellipse cx="64" cy="54" rx="5" ry="4" fill="#fff"/>`;
    case 'parche':
      return `<path d="M18 40 L82 60" stroke="#1d1d24" stroke-width="2"/><ellipse cx="64" cy="56" rx="9" ry="8" fill="#1d1d24"/>`;
    case 'nariz':
      return `<circle cx="50" cy="63" r="6" fill="#e8394b"/><circle cx="48" cy="61" r="2" fill="#fff" opacity=".6"/>`;
    case 'bigote':
      return `<path d="M50 66 C44 60 34 62 32 68 C38 66 44 70 50 68 C56 70 62 66 68 68 C66 62 56 60 50 66 Z" fill="${c1}"/>`;
    case 'bigotes_gato':
      return `<path d="M30 64 L14 60 M30 67 L14 68 M70 64 L86 60 M70 67 L86 68" stroke="#3d2b27" stroke-width="1.6"/><ellipse cx="50" cy="63" rx="3" ry="2" fill="#f07a85"/>`;
    default:
      return '';
  }
}

/** SVG de la carita (tam en px). `gesto`: feliz (^ ^), normal o triste. */
export function caritaSvg(a: AspectoJugador, tam = 64, gesto: 'normal' | 'feliz' | 'triste' = 'normal'): string {
  const base = COLORES_BASE[a.cuerpo] ?? COLORES_BASE.el;
  const d = a.detalles ?? {};
  const piel = hex(a.piel, base.piel);
  const pelo = hex(a.pelo, base.pelo);
  const arriba = piezaDe(d.arriba, 'arriba', a.cuerpo);
  const ropa = arriba ? colorPrenda(d.arriba, 0, '#f4efe6') : hex(d.ropa, base.ropa);
  const id = `c${++sig}`;
  const ella = a.cuerpo === 'ella';
  const peinado = piezaDe(d.peinado, 'pelo', a.cuerpo);
  const [peloAtras, peloArriba] = pelos(peinado ? MODELO[peinado.modelo]?.f ?? '' : '', ella, pelo);
  const cabeza = piezaDe(d.cabeza, 'cabeza', a.cuerpo);
  const cara = piezaDe(d.cara, 'cara', a.cuerpo);
  const ojo = hex(d.ojos, '#17120f');
  const rubor = d.rubor === 'no' ? '' : hex(d.rubor, '#f07a85');
  const [tipoArete, cArete] = (d.aretes ?? '').split('#');
  const aretes = tipoArete ? `<circle cx="18.5" cy="66" r="3.2" fill="${cArete && HEX.test(`#${cArete}`) ? `#${cArete}` : '#f2c14e'}"/><circle cx="81.5" cy="66" r="3.2" fill="${cArete && HEX.test(`#${cArete}`) ? `#${cArete}` : '#f2c14e'}"/>` : '';
  const boca =
    gesto === 'triste'
      ? '<path d="M43 71 Q50 66 57 71" stroke="#3d2b27" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      : '<path d="M42 67 Q50 75 58 67 Q50 71 42 67 Z" fill="#7a2230" stroke="#3d2b27" stroke-width="2" stroke-linejoin="round"/>';
  const ojos =
    gesto === 'feliz'
      ? '<path d="M31 57 Q36 51 41 57" stroke="#17120f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M59 57 Q64 51 69 57" stroke="#17120f" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : `<ellipse cx="36" cy="56" rx="5.2" ry="6.4" fill="${ojo}"/><ellipse cx="64" cy="56" rx="5.2" ry="6.4" fill="${ojo}"/>
         <circle cx="37.8" cy="53.4" r="1.9" fill="#fff"/><circle cx="65.8" cy="53.4" r="1.9" fill="#fff"/>`;
  const cejas = d.cejas === 'no' ? '' : `<path d="M30 46 Q36 43 42 46 M58 46 Q64 43 70 46" stroke="${hex(d.cejas, pelo)}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".85"/>`;
  const fc = cabeza ? MODELO[cabeza.modelo]?.f ?? '' : '';
  // Las capuchas tapan el pelo de arriba (se ve la cara dentro de la capucha)
  const capucha = cabeza?.modelo.startsWith('capucha_');
  const c1c = colorPrenda(d.cabeza, 0, '#f4efe6');
  const c2c = colorPrenda(d.cabeza, 1, '#e85d5d');
  return `<svg class="carita" viewBox="0 -12 100 112" width="${tam}" height="${tam}" aria-hidden="true">
    <defs>
      <radialGradient id="${id}p" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></radialGradient>
      <pattern id="${id}f" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="rgba(255,255,255,.12)"/><circle cx="3" cy="3" r=".6" fill="rgba(0,0,0,.12)"/></pattern>
    </defs>
    ${capucha ? `<path d="M10 50 C8 14 28 4 50 4 C72 4 92 14 90 50 C90 80 76 96 50 96 C24 96 10 80 10 50 Z" fill="${c1c}"/>` : peloAtras}
    <path d="M14 100 C14 84 28 78 50 78 C72 78 86 84 86 100 Z" fill="${ropa}"/>
    <path d="M14 100 C14 84 28 78 50 78 C72 78 86 84 86 100 Z" fill="url(#${id}f)"/>
    <path d="M40 79 Q50 86 60 79" stroke="rgba(0,0,0,.22)" stroke-width="2.4" fill="none"/>
    <rect x="18" y="24" width="64" height="60" rx="22" fill="${piel}"/>
    <rect x="18" y="24" width="64" height="60" rx="22" fill="url(#${id}p)"/>
    <ellipse cx="18.5" cy="58" rx="4" ry="6" fill="${piel}"/><ellipse cx="81.5" cy="58" rx="4" ry="6" fill="${piel}"/>
    ${aretes}
    ${capucha ? `<path d="M18 44 C20 26 34 18 50 18 C66 18 80 26 82 44 C70 36 30 36 18 44 Z" fill="${c1c}"/>${gorro(fc === 'conejo' ? 'conejo' : 'orejas', c1c, colorPrenda(d.cabeza, 1, '#f39ab0'))}` : `${peloArriba}
    <path d="M18 46 C15 24 30 13 50 13 C70 13 85 24 82 46" fill="url(#${id}f)" opacity="${peinado?.modelo === 'pelo_rapado' ? 0.3 : 0.9}"/>`}
    ${cejas}${ojos}
    ${rubor ? `<ellipse cx="29" cy="66" rx="6" ry="3.6" fill="${rubor}" opacity=".55"/><ellipse cx="71" cy="66" rx="6" ry="3.6" fill="${rubor}" opacity=".55"/>` : ''}
    ${boca}
    ${cara ? enLaCara(MODELO[cara.modelo]?.f ?? '', colorPrenda(d.cara, 0, '#3d2b27'), colorPrenda(d.cara, 1, '#2f3e4f')) : ''}
    ${!capucha && cabeza ? gorro(fc, c1c, c2c) : ''}
  </svg>`;
}
