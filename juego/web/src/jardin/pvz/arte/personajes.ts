// Personajes de la historia de Plantas contra Zombis. Por ahora, Dave el Loco: el vecino de la olla en la cabeza,
// pelo y barba castaños desordenados, nariz grande y camiseta oscura. Mira a la DERECHA (sale por la izquierda de la
// pantalla, como en PvZ). Estados: 'quieto' y 'habla' (boca y cejas animadas, se balancea y gesticula).

import type { DefPersonaje, DefPieza } from './piezas';
import { TINTA, borde, brillo, lineal, onda, radial, sombra, volumen } from './estilo';

const PIEL = '#f2c39a';
const PIEL_O = '#d39a6e';
const PELO = '#7a4a22';
const PELO_O = '#4e2c12';
const CAMISETA = '#353b46';
const CAMISETA_O = '#22262e';
const JEAN = '#3f63a8';
const JEAN_O = '#2b4579';

const DAVE: DefPersonaje = (() => {
  const defs =
    volumen('dv-piel', '#fde0c4', PIEL, PIEL_O, 0.35, 0.3) +
    lineal('dv-olla', [[0, '#7b828b'], [0.22, '#f4f6f8'], [0.5, '#b9c0c8'], [0.85, '#868d96'], [1, '#5d636b']], 0, 0, 1, 0) +
    lineal('dv-cam', [[0, '#4a5160'], [1, CAMISETA_O]], 0, 0, 1, 0.3) +
    lineal('dv-jean', [[0, '#5579c0'], [1, JEAN_O]], 0, 0, 1, 0) +
    radial('dv-boca', [[0, '#a8303a'], [1, '#4a0f16']]);

  const pierna = (x: number, color: string) =>
    `<path d="M${x - 10},172 L${x + 10},172 L${x + 8.5},262 L${x - 8.5},262 Z" fill="${color}" ${borde()}/>` +
    `<path d="M${x + 3},180 L${x + 2},255" stroke="${JEAN_O}" stroke-width="2" opacity="0.6"/>`;
  const zapato = (x: number, color: string) =>
    `<path d="M${x - 9},258 L${x + 8},258 C${x + 16},260 ${x + 24},264 ${x + 24},270 L${x + 24},273 L${x - 10},273 C${x - 12},268 ${x - 11},262 ${x - 9},258 Z" fill="${color}" ${borde()}/>` +
    `<path d="M${x - 8},270 L${x + 23},270" stroke="#e8dcc8" stroke-width="2"/>`;
  const cuerpo =
    // cuello
    `<path d="M74,86 L92,86 L93,104 L73,104 Z" fill="${PIEL_O}" ${borde()}/>` +
    // camiseta oscura, un poco arrugada
    `<path d="M58,104 C64,98 76,97 83,99 C92,97 102,98 108,104 C112,120 111,150 108,178 L60,178 C57,150 56,122 58,104 Z" fill="url(#dv-cam)" ${borde()}/>` +
    `<path d="M74,99 C78,106 88,106 92,99" fill="none" stroke="#1a1d24" stroke-width="2.4"/>` +
    `<path d="M70,130 Q76,136 72,146 M96,124 Q92,134 98,142" fill="none" stroke="#1a1d24" stroke-width="1.8" opacity="0.7"/>` +
    // bolsillo con un lápiz y una semilla
    `<rect x="88" y="116" width="13" height="12" rx="2" fill="#2a2f38" ${borde(1.6)}/>` +
    `<path d="M91,116 L92,106" stroke="${TINTA}" stroke-width="3.6" stroke-linecap="round"/><path d="M91,116 L92,106" stroke="#f2c230" stroke-width="2" stroke-linecap="round"/>` +
    // cinturón
    `<path d="M60,170 L108,170 L108,178 L60,178 Z" fill="#5a3a1e" ${borde(2)}/><rect x="80" y="169" width="9" height="10" rx="1.5" fill="#d8c070" ${borde(1.6)}/>`;
  const brazo = (x: number, piel: string, manga: string) =>
    `<path d="M${x - 6},104 L${x + 6},104 L${x + 5.5},146 L${x - 5.5},146 Z" fill="${piel}" ${borde()}/>` +
    `<path d="M${x - 10},108 C${x - 10},98 ${x + 10},96 ${x + 10},106 L${x + 9},124 L${x - 9},124 Z" fill="${manga}" ${borde()}/>`;
  const antebrazo = (x: number, piel: string) =>
    `<path d="M${x - 5.5},144 L${x + 5.5},144 L${x + 5},184 L${x - 5},184 Z" fill="${piel}" ${borde()}/>` +
    `<path d="M${x - 3},156 l2,2 M${x + 1},164 l2,2 M${x - 2},172 l2,2" stroke="${PELO_O}" stroke-width="1" opacity="0.5"/>`;
  const mano = (x: number, piel: string) =>
    `<path d="M${x - 6},182 C${x - 8},190 ${x - 6},198 ${x},199 C${x + 7},199 ${x + 9},192 ${x + 7},185 L${x + 5},181 Z" fill="${piel}" ${borde()}/>` +
    `<path d="M${x + 6},186 C${x + 11},185 ${x + 12},190 ${x + 8},192" fill="${piel}" ${borde(2)}/>`;

  const cabeza =
    // pelo de atrás (por debajo de la olla)
    `<path d="M58,40 C50,46 52,56 46,60 C54,60 52,68 50,76 C58,72 62,78 62,84 C66,76 70,70 72,64 L72,40 Z" fill="${PELO}" ${borde()}/>` +
    // cara alargada
    `<path d="M66,36 C64,52 64,70 70,82 C76,94 90,98 100,92 C108,86 110,72 109,58 C108,46 106,38 104,34 Z" fill="url(#dv-piel)" ${borde()}/>` +
    // barba de varios días
    `<path d="M68,70 C70,84 78,96 92,96 C102,95 108,86 109,74 C104,82 98,84 92,82 C86,86 76,84 68,70 Z" fill="${PELO}" opacity="0.85"/>` +
    `<path d="M70,72 l1,1 M75,80 l1,1 M80,86 l1,1 M86,89 l1,1 M98,88 l1,1 M104,82 l1,1 M73,76 l1,1 M90,91 l1,1" stroke="${PELO_O}" stroke-width="1.6"/>` +
    // oreja
    `<path d="M68,56 C60,52 58,64 62,68 C64,71 68,70 69,68" fill="${PIEL}" ${borde(2.2)}/>` +
    // ojos locos (uno más grande)
    `<ellipse cx="87" cy="54" rx="6.4" ry="7.6" fill="#fff" ${borde(2)}/><ellipse cx="102" cy="53" rx="5" ry="6" fill="#fff" ${borde(2)}/>` +
    `<circle cx="89" cy="55.5" r="2.6" fill="#1a1208"/><circle cx="101" cy="52" r="2.2" fill="#1a1208"/>` +
    `<circle cx="88" cy="54.4" r="0.9" fill="#fff"/><circle cx="100.4" cy="51.2" r="0.8" fill="#fff"/>` +
    // nariz grande
    `<path d="M101,58 C108,60 117,66 114,72 C112,76 104,75 101,72" fill="${PIEL}" ${borde()}/>` +
    `<path d="M106,72 C107,73 109,73 110,72" fill="none" stroke="${PIEL_O}" stroke-width="1.4"/>` +
    brillo(76, 46, 5, 2.4, -60, 0.35) +
    // pelo de los lados saliendo bajo la olla
    `<path d="M64,34 L58,44 L66,42 L62,52 L70,46 L72,36 Z" fill="${PELO}" ${borde(2)}/>` +
    `<path d="M104,34 L112,40 L106,42 L110,48 L104,46 Z" fill="${PELO}" ${borde(2)}/>`;
  const boca = (abierta: number) =>
    abierta <= 0
      ? `<path d="M85,78 C90,84 98,84 103,79" fill="none" ${borde(2.4)}/><path d="M86,79 L88,77 M102,80 L104,78" ${borde(1.6)}/>`
      : `<path d="M84,77 C88,${78 + abierta * 1.6} 99,${79 + abierta * 1.6} 104,77 C100,79 89,79 84,77 Z" fill="url(#dv-boca)" ${borde(2.2)}/>` +
        `<path d="M87,78 L101,78.5 L100,80.5 L88,80.5 Z" fill="#fff"/>` +
        (abierta > 4 ? `<ellipse cx="94" cy="${80 + abierta * 1.1}" rx="5" ry="${abierta * 0.35}" fill="#e66a78"/>` : '');
  const cejas =
    `<path d="M80,44 C84,40 90,40 94,43" fill="none" stroke="${PELO_O}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M98,43 C101,40 105,40 108,43" fill="none" stroke="${PELO_O}" stroke-width="3.4" stroke-linecap="round"/>`;
  const olla =
    // mango largo hacia atrás
    `<path d="M62,20 L20,10" stroke="${TINTA}" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M62,20 L20,10" stroke="#3a3a3a" stroke-width="6.4" stroke-linecap="round"/>` +
    `<circle cx="24" cy="11" r="1.8" fill="#888"/>` +
    // cuerpo de la olla (boca abajo sobre la cabeza)
    `<path d="M62,36 L66,8 C72,2 104,2 110,8 L114,36 Z" fill="url(#dv-olla)" ${borde()}/>` +
    `<path d="M66,12 C76,16 100,16 110,12" stroke="#5d636b" stroke-width="1.6" fill="none" opacity="0.7"/>` +
    // borde
    `<path d="M57,34 C57,30 119,30 119,34 L119,39 C119,43 57,43 57,39 Z" fill="url(#dv-olla)" ${borde()}/>` +
    `<path d="M74,6 L72,34" stroke="#fff" stroke-width="3" opacity="0.6"/>` +
    `<ellipse cx="96" cy="22" rx="4" ry="2.6" fill="#5d636b" opacity="0.5"/>`;

  const piezas: DefPieza[] = [
    { id: 'sombra', svg: sombra(84, 272, 40, 8), pivote: [84, 272], z: -10, sinTinte: true },
    { id: 'brazo_der', svg: brazo(102, PIEL_O, '#262b33'), pivote: [102, 106], padre: 'cuerpo', z: 0 },
    { id: 'antebrazo_der', svg: antebrazo(102, PIEL_O), pivote: [102, 145], padre: 'brazo_der', z: 0.1 },
    { id: 'mano_der', svg: mano(102, PIEL_O), pivote: [102, 183], padre: 'antebrazo_der', z: 0.2 },
    { id: 'pierna_der', svg: pierna(94, JEAN_O), pivote: [94, 174], z: 1 },
    { id: 'zapato_der', svg: zapato(94, '#4a2c16'), pivote: [94, 262], padre: 'pierna_der', z: 1.1 },
    { id: 'pierna_izq', svg: pierna(74, 'url(#dv-jean)'), pivote: [74, 174], z: 2 },
    { id: 'zapato_izq', svg: zapato(74, '#6a3e1e'), pivote: [74, 262], padre: 'pierna_izq', z: 2.1 },
    { id: 'cuerpo', svg: cuerpo, pivote: [84, 176], z: 5 },
    { id: 'cabeza', svg: cabeza, pivote: [84, 96], padre: 'cuerpo', z: 10 },
    { id: 'boca', svg: boca(0), pivote: [94, 80], padre: 'cabeza', z: 11, estados: { media: boca(3), abierta: boca(7) } },
    { id: 'cejas', svg: cejas, pivote: [94, 42], padre: 'cabeza', z: 12 },
    { id: 'olla', svg: olla, pivote: [88, 38], padre: 'cabeza', z: 13 },
    { id: 'brazo_izq', svg: brazo(66, PIEL, CAMISETA), pivote: [66, 106], padre: 'cuerpo', z: 14 },
    { id: 'antebrazo_izq', svg: antebrazo(66, PIEL), pivote: [66, 145], padre: 'brazo_izq', z: 14.1 },
    { id: 'mano_izq', svg: mano(66, PIEL), pivote: [66, 183], padre: 'antebrazo_izq', z: 14.2 },
  ];
  return {
    id: 'dave', nombre: 'Dave el Loco', ancho: 160, alto: 280, ancla: [84, 272], piezas, defs,
    estados: ['quieto', 'habla'],
    puntos: { globo: [118, 30], cabeza: [88, 4] },
    anim(c) {
      const s = c.semilla;
      const t = c.t;
      const habla = c.estado === 'habla';
      // Boca: alterna abierta/media/cerrada a saltos (balbuceo), con pausas cortas entre palabras.
      const silaba = Math.floor(t * 9 + s);
      const ruido = Math.sin(silaba * 12.9898) * 43758.5453;
      const r = ruido - Math.floor(ruido);
      const pausa = Math.sin(t * 1.7 + s) > 0.82;
      const boca = habla && !pausa ? (r < 0.4 ? 'abierta' : r < 0.75 ? 'media' : undefined) : undefined;
      const k = habla ? 1 : 0.4;
      const cejas = habla ? -Math.abs(Math.sin(t * 3.1 + s)) * 4 - (r > 0.85 ? 3 : 0) : Math.sin(t * 0.7) * 0.8;
      const gesto = habla ? Math.sin(t * 2.3 + s) : 0;
      return {
        cuerpo: { rot: onda(t, 0.45, s) * 2.2 * k + 1, x: onda(t, 0.45, s) * 1.5 * k },
        cabeza: { rot: onda(t, 0.6, s, 1) * 4 * k + (habla ? Math.sin(t * 7) * 1.5 : 0), y: habla ? Math.abs(Math.sin(t * 4.5)) * -1.5 : 0 },
        olla: { rot: onda(t, 0.6, s, 2) * 3 * k, y: habla ? -Math.abs(Math.sin(t * 9)) * 1.4 : 0 },
        boca: { variante: boca },
        cejas: { y: cejas },
        brazo_izq: { rot: habla ? -18 - 26 * Math.max(0, gesto) : 4 + onda(t, 0.45, s) * 2 },
        antebrazo_izq: { rot: habla ? -50 - 40 * Math.max(0, gesto) : -6 },
        mano_izq: { rot: habla ? Math.sin(t * 6) * 15 : 0 },
        brazo_der: { rot: -6 + onda(t, 0.45, s, 2) * 3 },
        antebrazo_der: { rot: -10 },
        pierna_izq: { rot: 0 },
        pierna_der: { rot: 0 },
      };
    },
  };
})();

/** Personajes de la historia por id. */
export const DEF_PERSONAJES: Record<string, DefPersonaje> = { dave: DAVE };
