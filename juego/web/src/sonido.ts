// Efectos de sonido sintetizados (sin archivos): se activan con el primer toque, como exige el navegador.
import { alPausar, alReanudar, enPausa } from './segundo_plano';
let ctx: AudioContext | null = null;
let silencio = false;
try {
  silencio = localStorage.getItem('supermania-silencio') === '1';
} catch {
  /* sin almacenamiento */
}

let maestro: GainNode | null = null;
let salidaEfectos: GainNode | null = null;
let salidaMusica: GainNode | null = null;
let salidaPistas: GainNode | null = null;
let musicaApagada = false;
try {
  musicaApagada = localStorage.getItem('supermania-musica') === '0';
} catch {
  /* sin almacenamiento */
}

export function activar() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    ctx = new AudioContext();
    maestro = ctx.createGain();
    maestro.gain.value = silencio ? 0 : 1;
    maestro.connect(ctx.destination);
    salidaEfectos = ctx.createGain();
    salidaEfectos.connect(maestro);
    // La música pasa por un filtro suave para que quede de fondo y no tape los efectos
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 5200;
    salidaMusica = ctx.createGain();
    salidaMusica.gain.value = 0;
    salidaMusica.connect(filtro).connect(maestro);
    // Las pistas en archivo van sin el filtro (ya vienen mezcladas)
    salidaPistas = ctx.createGain();
    salidaPistas.gain.value = volumenPistas();
    salidaPistas.connect(maestro);
    if (musicaPendiente) musica.iniciar(musicaPendiente, bpm, cancion);
    if (pistaPedida) void ponerPista(pistaPedida.id, pistaPedida.op);
  } catch {
    ctx = null;
  }
}

/** Calla todo mientras la app está en segundo plano (activar() la despierta). */
export function suspender() {
  if (ctx && ctx.state === 'running') void ctx.suspend();
}

export function silenciado() {
  return silencio;
}

/** El contexto de audio y la salida general (para minijuegos con su propia música, como lavarse la cara). */
export function contextoAudio(): { ctx: AudioContext; salida: GainNode } | null {
  return ctx && maestro ? { ctx, salida: maestro } : null;
}
export function alternar() {
  silencio = !silencio;
  if (ctx && maestro) maestro.gain.setTargetAtTime(silencio ? 0 : 1, ctx.currentTime, 0.05);
  try {
    localStorage.setItem('supermania-silencio', silencio ? '1' : '0');
  } catch {
    /* sin almacenamiento */
  }
  return silencio;
}

/** Una nota corta con envolvente suave. */
export function nota(frec: number, dur: number, cuando = 0, tipo: OscillatorType = 'sine', vol = 0.12, hasta?: number) {
  if (!ctx || silencio || !salidaEfectos) return;
  const t = ctx.currentTime + cuando;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(frec, t);
  if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(salidaEfectos);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const toque = () => nota(660, 0.07, 0, 'triangle', 0.06);
export const repuesto = () => { nota(784, 0.09); nota(1046, 0.14, 0.07); };
export const caja = () => { nota(1318, 0.06, 0, 'square', 0.05); nota(1760, 0.18, 0.06, 'triangle', 0.08); };
export const vacia = () => { nota(523, 0.12, 0, 'triangle', 0.08); nota(392, 0.22, 0.1, 'triangle', 0.08); };
export const enojo = () => nota(220, 0.3, 0, 'sawtooth', 0.05, 140);
export const combo = (n: number) => { for (let i = 0; i < Math.min(n, 5); i++) nota(660 * Math.pow(1.122, i * 2), 0.09, i * 0.06, 'triangle', 0.07); };
export const alarma = () => { nota(880, 0.12, 0, 'square', 0.05); nota(660, 0.12, 0.14, 'square', 0.05); nota(880, 0.12, 0.28, 'square', 0.05); };
export const atrapado = () => { nota(523, 0.1); nota(659, 0.1, 0.08); nota(784, 0.2, 0.16); };
export const resbalon = () => nota(500, 0.25, 0, 'sine', 0.08, 180);
export const limpio = () => nota(1200, 0.08, 0, 'sine', 0.05, 1600);
export const corazon = () => { nota(784, 0.1); nota(988, 0.1, 0.09); nota(1318, 0.25, 0.18); };
export const campana = () => { nota(1568, 0.5, 0, 'sine', 0.06); nota(2093, 0.4, 0.05, 'sine', 0.04); };
// Casa
export const beso = () => { nota(1400, 0.05, 0, 'sine', 0.08, 700); nota(1800, 0.04, 0.05, 'sine', 0.05, 900); };
export const abrazo = () => [523, 659, 784].forEach((f, i) => nota(f, 0.5, i * 0.04, 'sine', 0.05));
export const mordisco = () => { nota(300, 0.05, 0, 'square', 0.03, 180); nota(260, 0.05, 0.12, 'square', 0.03, 160); };
export const burbuja = () => nota(600 + Math.random() * 500, 0.08, 0, 'sine', 0.05, 1400 + Math.random() * 600);
export const regalo = () => [784, 988, 1175, 1568].forEach((f, i) => nota(f, 0.2, i * 0.07, 'triangle', 0.06));
export const aviso = () => { nota(988, 0.12, 0, 'sine', 0.07); nota(1318, 0.2, 0.1, 'sine', 0.07); };
/** Ruido filtrado corto (puertas que crujen, arena, viento, papel). */
export function rumor(dur: number, frec = 1200, vol = 0.08, cuando = 0, q = 0.8, hasta?: number) {
  if (!ctx || silencio || !salidaEfectos) return;
  const t = ctx.currentTime + cuando;
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = b;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(frec, t);
  if (hasta) f.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(salidaEfectos);
  src.start(t);
}

export const bostezo = () => nota(440, 0.6, 0, 'sine', 0.05, 250);
export const fin = (bien: boolean) => (bien ? [523, 659, 784, 1046].forEach((f, i) => nota(f, 0.18, i * 0.12, 'triangle', 0.08)) : [392, 330, 262].forEach((f, i) => nota(f, 0.22, i * 0.15, 'triangle', 0.08)));

// ---------------------------------------------------------------------------
// Música de fondo: cumbia suave de tienda de barrio, sintetizada en vivo.
// 16 compases en do mayor (piano eléctrico en los contratiempos, bajo, marimba, güiro, maraca y bombo).
// ---------------------------------------------------------------------------
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const ACORDES: Record<string, { bajo: number; voces: number[] }> = {
  C: { bajo: 36, voces: [60, 64, 67, 71] },
  Am: { bajo: 33, voces: [60, 64, 67, 69] },
  Dm: { bajo: 38, voces: [60, 62, 65, 69] },
  G: { bajo: 31, voces: [59, 62, 65, 67] },
  F: { bajo: 29, voces: [60, 64, 65, 69] },
  Em: { bajo: 40, voces: [59, 62, 64, 67] },
};
const PROGRESION = ['C', 'Am', 'Dm', 'G', 'C', 'Am', 'F', 'G', 'F', 'Em', 'Dm', 'G', 'C', 'Am', 'Dm', 'G'];
// Melodía de marimba: [compás, corchea, nota, duración en corcheas]
const MELODIA: [number, number, number, number][] = [
  [0, 0, 72, 2], [0, 2, 76, 1], [0, 3, 79, 2], [0, 5, 76, 2],
  [1, 0, 72, 2], [1, 2, 74, 2], [1, 4, 76, 3],
  [2, 0, 77, 2], [2, 2, 76, 1], [2, 3, 74, 2], [2, 5, 72, 2],
  [3, 0, 74, 3], [3, 3, 71, 4],
  [4, 0, 72, 2], [4, 2, 76, 1], [4, 3, 79, 2], [4, 5, 81, 2],
  [5, 0, 79, 2], [5, 2, 76, 2], [5, 4, 72, 3],
  [6, 0, 77, 2], [6, 2, 81, 2], [6, 4, 79, 1], [6, 5, 77, 2],
  [7, 0, 76, 2], [7, 2, 74, 2], [7, 4, 71, 3],
  [8, 0, 81, 2], [8, 2, 79, 2], [8, 4, 77, 2], [8, 6, 76, 2],
  [9, 0, 79, 2], [9, 2, 76, 2], [9, 4, 74, 3],
  [10, 0, 77, 2], [10, 2, 76, 2], [10, 4, 74, 2], [10, 6, 72, 2],
  [11, 0, 74, 2], [11, 2, 76, 2], [11, 4, 79, 3],
  [12, 0, 72, 2], [12, 2, 76, 1], [12, 3, 79, 2], [12, 5, 76, 2],
  [13, 0, 72, 2], [13, 2, 74, 2], [13, 4, 76, 3],
  [14, 0, 77, 2], [14, 2, 76, 1], [14, 3, 74, 2], [14, 5, 71, 2],
  [15, 0, 72, 5],
];
const MELODIA_POR_PASO = new Map<number, [number, number]>();
for (const [c, k, n, d] of MELODIA) MELODIA_POR_PASO.set(c * 8 + k, [n, d]);

let ruido: AudioBuffer | null = null;
function bufferRuido() {
  if (ruido || !ctx) return ruido;
  ruido = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = ruido.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ruido;
}

function voz(frec: number, t: number, dur: number, tipo: OscillatorType, vol: number, ataque = 0.01) {
  if (!ctx || !salidaMusica) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(frec, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(salidaMusica);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function percusion(t: number, dur: number, frec: number, q: number, vol: number, barrido?: number) {
  const b = bufferRuido();
  if (!ctx || !salidaMusica || !b) return;
  const src = ctx.createBufferSource();
  src.buffer = b;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(frec, t);
  if (barrido) f.frequency.exponentialRampToValueAtTime(barrido, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(salidaMusica);
  src.start(t, Math.random() * 0.3);
  src.stop(t + dur + 0.02);
}

function bombo(t: number, vol: number) {
  if (!ctx || !salidaMusica) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g).connect(salidaMusica);
  o.start(t);
  o.stop(t + 0.25);
}

/** Toca la corchea `paso` (0-127) del ciclo en el instante t. */
function tocarPaso(paso: number, t: number, corchea: number) {
  const compas = Math.floor(paso / 8) % 16;
  const k = paso % 8;
  const ac = ACORDES[PROGRESION[compas]];
  // Bombo en 1 y 3, maraca en todas las corcheas (acento a contratiempo), güiro raspando en 2 y 4
  if (k === 0 || k === 4) bombo(t, 0.22);
  percusion(t, 0.05, 7000, 1.2, k % 2 ? 0.05 : 0.025);
  if (k === 2 || k === 6) percusion(t, corchea * 0.9, 2600, 3, 0.035, 4200);
  // Bajo cumbiero: fundamental, quinta y octava
  const bajo = [ac.bajo, null, null, ac.bajo + 7, ac.bajo + 12, null, ac.bajo + 7, null][k];
  if (bajo !== null) voz(midi(bajo), t, corchea * 1.6, 'triangle', 0.16, 0.008);
  // Piano eléctrico en los contratiempos («chucu-chucu»)
  if (k % 2 === 1) for (const n of ac.voces) voz(midi(n), t, corchea * 0.8, 'sine', 0.028, 0.004);
  // Marimba con la melodía
  const m = MELODIA_POR_PASO.get(compas * 8 + k);
  if (m) {
    voz(midi(m[0]), t, Math.min(0.5, corchea * m[1]), 'sine', 0.07, 0.003);
    voz(midi(m[0] + 24), t, 0.08, 'sine', 0.012, 0.002);
  }
}

// ---------------------------------------------------------------------------
// «Nuestro Hogar»: balada suave de cajita de música en fa mayor (arpegios, bajo largo y melodía).
// ---------------------------------------------------------------------------
const ACORDES_HOGAR: Record<string, { bajo: number; voces: number[] }> = {
  F: { bajo: 41, voces: [65, 69, 72] },
  Dm: { bajo: 38, voces: [62, 65, 69] },
  Bb: { bajo: 46, voces: [62, 65, 70] },
  C: { bajo: 36, voces: [64, 67, 72] },
  Am: { bajo: 45, voces: [64, 69, 72] },
  Gm: { bajo: 43, voces: [62, 67, 70] },
};
const PROGRESION_HOGAR = ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C', 'Dm', 'Am', 'Bb', 'F', 'Gm', 'C', 'F', 'C'];
const MELODIA_HOGAR: [number, number, number, number][] = [
  [0, 0, 77, 3], [0, 3, 76, 1], [0, 4, 77, 2], [0, 6, 81, 2],
  [1, 0, 81, 3], [1, 3, 79, 1], [1, 4, 77, 4],
  [2, 0, 74, 2], [2, 2, 77, 2], [2, 4, 82, 3], [2, 7, 81, 1],
  [3, 0, 79, 6],
  [4, 0, 77, 3], [4, 3, 76, 1], [4, 4, 77, 2], [4, 6, 84, 2],
  [5, 0, 84, 3], [5, 3, 81, 1], [5, 4, 76, 4],
  [6, 0, 74, 2], [6, 2, 77, 2], [6, 4, 82, 2], [6, 6, 81, 2],
  [7, 0, 79, 6],
  [8, 0, 81, 3], [8, 3, 79, 1], [8, 4, 77, 2], [8, 6, 74, 2],
  [9, 0, 76, 3], [9, 3, 77, 1], [9, 4, 81, 4],
  [10, 0, 82, 2], [10, 2, 81, 2], [10, 4, 79, 2], [10, 6, 77, 2],
  [11, 0, 81, 6],
  [12, 0, 79, 2], [12, 2, 77, 2], [12, 4, 74, 2], [12, 6, 79, 2],
  [13, 0, 79, 3], [13, 3, 81, 1], [13, 4, 76, 4],
  [14, 0, 77, 8],
];
const MELODIA_HOGAR_PASO = new Map<number, [number, number]>();
for (const [c, k, n, d] of MELODIA_HOGAR) MELODIA_HOGAR_PASO.set(c * 8 + k, [n, d]);

function tocarPasoHogar(paso: number, t: number, corchea: number) {
  const compas = Math.floor(paso / 8) % 16;
  const k = paso % 8;
  const ac = ACORDES_HOGAR[PROGRESION_HOGAR[compas]];
  if (k === 0) voz(midi(ac.bajo), t, corchea * 7, 'triangle', 0.12, 0.05);
  if (k === 4) voz(midi(ac.bajo + 7), t, corchea * 3.5, 'triangle', 0.07, 0.05);
  // Arpegio de piano suave: sube y baja por el acorde
  const arpegio = [0, 1, 2, 1, 0, 1, 2, 1][k];
  voz(midi(ac.voces[arpegio]), t, corchea * 2.2, 'sine', 0.035, 0.01);
  // Cajita de música: fundamental + dos octavas arriba muy suave
  const m = MELODIA_HOGAR_PASO.get(compas * 8 + k);
  if (m) {
    voz(midi(m[0]), t, Math.min(1.6, corchea * m[1] * 1.2), 'sine', 0.06, 0.004);
    voz(midi(m[0] + 24), t, 0.25, 'sine', 0.012, 0.002);
  }
  if (k === 0 && compas % 4 === 0) percusion(t, 0.8, 9000, 2, 0.01);
}

// --- Mesa de juegos: bossa bajita (Fmaj7 · Dm7 · Gm7 · C7), para acompañar sin estorbar ---
const ACORDES_MESA = [
  { bajo: 41, voces: [57, 60, 64, 69] },
  { bajo: 38, voces: [57, 60, 62, 65] },
  { bajo: 43, voces: [58, 62, 65, 67] },
  { bajo: 36, voces: [58, 60, 64, 67] },
];
const MELODIA_MESA = [69, 72, 74, 72, 69, 67, 65, 67, 69, 74, 72, 69, 67, 69, 65, 64];

function tocarPasoMesa(paso: number, t: number, corchea: number) {
  const compas = Math.floor(paso / 8) % 16;
  const k = paso % 8;
  const ac = ACORDES_MESA[compas % 4];
  // Bajo de bossa: raíz, quinta y raíz arriba
  if (k === 0) voz(midi(ac.bajo), t, corchea * 2.6, 'triangle', 0.09, 0.02);
  if (k === 3) voz(midi(ac.bajo + 7), t, corchea * 1.4, 'triangle', 0.06, 0.02);
  if (k === 6) voz(midi(ac.bajo + 12), t, corchea * 1.2, 'triangle', 0.05, 0.02);
  // Piano eléctrico: acorde largo al comienzo y un toquecito sincopado
  if (k === 0 || k === 5) for (const n of ac.voces) voz(midi(n), t, corchea * (k === 0 ? 3.5 : 1.2), 'sine', k === 0 ? 0.018 : 0.012, 0.015);
  // Melodía escasa: una nota cada tanto, en los compases pares
  if (compas % 2 === 0 && (k === 2 || k === 7)) voz(midi(MELODIA_MESA[(compas + k) % MELODIA_MESA.length]), t, corchea * 2.4, 'sine', 0.022, 0.01);
  // Escobillas muy suaves
  if (k === 2 || k === 6) percusion(t, 0.09, 6000, 1.5, 0.006);
}

let cancion: 'cumbia' | 'hogar' | 'mesa' = 'cumbia';
let musicaPendiente: 'menu' | 'juego' | null = null;
/** Callada por un rato sin tocar la preferencia de quien juega (con la tele prendida, para oír el video). */
let musicaCallada = false;
/** Mientras habla alguien (las voces de la pareja) la música baja para que se le entienda. */
let musicaAgachada = false;
const volumenMusica = () => (musicaApagada || musicaCallada ? 0 : (musicaPendiente === 'menu' ? 0.45 : 0.8) * (musicaAgachada ? 0.35 : 1));
let reloj: ReturnType<typeof setInterval> | null = null;
let pasoActual = 0;
let proximo = 0;
let bpm = 100;

/** El reloj de la música: cada 30 ms programa las notas de los próximos 0,2 s. */
function arrancarReloj() {
  if (reloj || !ctx || !musicaPendiente || enPausa()) return;
  proximo = ctx.currentTime + 0.1;
  reloj = setInterval(() => {
    if (!ctx) return;
    const corchea = 60 / bpm / 2;
    // Si el reloj se atrasó (celular lento o pestaña dormida), se salta lo perdido en vez de tocarlo todo junto
    if (proximo < ctx.currentTime - 0.3) proximo = ctx.currentTime + 0.05;
    while (proximo < ctx.currentTime + 0.2) {
      // Un poco de swing: la corchea del contratiempo llega tarde
      const swing = pasoActual % 2 ? corchea * 0.08 : 0;
      if (!musicaApagada && !musicaCallada && !silencio && !pistaActiva) (cancion === 'hogar' ? tocarPasoHogar : cancion === 'mesa' ? tocarPasoMesa : tocarPaso)(pasoActual, proximo + (cancion === 'cumbia' ? swing : 0), corchea);
      proximo += corchea;
      pasoActual = (pasoActual + 1) % 128;
    }
  }, 30);
}

// En segundo plano (otra app, pantalla bloqueada) no suena nada y el reloj de la música no despierta al celular;
// al volver, la música sigue donde iba (sin tocar de golpe lo que se perdió)
alPausar(() => {
  if (reloj) clearInterval(reloj);
  reloj = null;
  suspender();
});
alReanudar(() => {
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  arrancarReloj();
});

export const musica = {
  /** Arranca (o cambia de ambiente): en el menú suena más bajito. */
  iniciar(modo: 'menu' | 'juego', tempo = 100, cual: 'cumbia' | 'hogar' | 'mesa' = 'cumbia') {
    musicaPendiente = modo;
    bpm = tempo;
    cancion = cual;
    if (!ctx || !salidaMusica) return;
    salidaMusica.gain.setTargetAtTime(volumenMusica(), ctx.currentTime, 0.4);
    arrancarReloj();
  },
  /** Pone una pista en archivo (null: vuelve la sintetizada). Si no hay archivo, sigue la sintetizada. */
  pista(id: string | null, op: OpcionesPista = {}) {
    if (id === (pistaPedida?.id ?? null) && !op.reiniciar) {
      // La misma: solo se actualiza qué sigue después
      if (pistaPedida) pistaPedida.op = op;
      if (sonando && sonando.id === id) sonando.luego = op.luego;
      return;
    }
    pistaPedida = id ? { id, op } : null;
    void ponerPista(id, op);
  },
  /** La pista pedida (para devolverla después de un minijuego que pone la suya). */
  pistaActual: () => pistaPedida?.id ?? null,
  /** La que de verdad está sonando en archivo (null: la sintetizada o nada). */
  pistaSonando: () => sonando?.id ?? null,
  /** Un minijuego (lavado, cohete…) puso su música: la casa no la cambia hasta que termine. */
  enMinijuego: false,
  /** Más rápido o más lento (1 = normal), sin cortar: el súper al final del día. */
  prisa(v: number) {
    if (Math.abs(v - velocidad) < 0.001) return;
    velocidad = v;
    reprogramar();
  },
  /** Un remate corto (ganar, perder, abrir) encima de la música, que baja un momento. */
  remate(id: string) {
    void tocarRemate(id);
  },
  /** Más rápido cuando falta poco para cerrar. */
  tempo(t: number) {
    bpm = t;
  },
  apagada() {
    return musicaApagada;
  },
  alternar() {
    musicaApagada = !musicaApagada;
    try {
      localStorage.setItem('supermania-musica', musicaApagada ? '0' : '1');
    } catch {
      /* sin almacenamiento */
    }
    if (ctx && salidaMusica) salidaMusica.gain.setTargetAtTime(volumenMusica(), ctx.currentTime, 0.2);
    if (ctx && salidaPistas) salidaPistas.gain.setTargetAtTime(volumenPistas(), ctx.currentTime, 0.2);
    return musicaApagada;
  },
  /** Calla la música un rato (la tele prendida) y la devuelve después, sin cambiar lo que eligió quien juega. */
  callar(si: boolean) {
    if (musicaCallada === si) return;
    musicaCallada = si;
    if (ctx && salidaMusica) salidaMusica.gain.setTargetAtTime(volumenMusica(), ctx.currentTime, si ? 0.15 : 0.8);
    if (ctx && salidaPistas) salidaPistas.gain.setTargetAtTime(volumenPistas(), ctx.currentTime, si ? 0.15 : 0.8);
  },
  /** Baja la música mientras alguien habla (y la sube suavecito después). */
  agachar(si: boolean) {
    if (musicaAgachada === si) return;
    musicaAgachada = si;
    if (ctx && salidaMusica) salidaMusica.gain.setTargetAtTime(volumenMusica(), ctx.currentTime, si ? 0.12 : 0.6);
    if (ctx && salidaPistas) salidaPistas.gain.setTargetAtTime(volumenPistas(), ctx.currentTime, si ? 0.12 : 0.6);
  },
};

// ------------------------------------------------------------------------------------------ Música en archivos
// Las pistas de Eleven Music (docs/sistemas/musica.md): si un juego pide una pista y su archivo existe, suena esa
// (las de jugar en bucle, con un cambio suave de una vuelta a la otra) y la sintetizada se calla. Si no existe (la app
// de amigos no trae las de la pareja, o todavía no se generó) sigue la sintetizada de siempre. Las listas las arma
// scripts/musica-ia.mjs: public/musica/lista.json y public/musica/pareja/lista.json.

export interface OpcionesPista {
  /** Repetirla (las de jugar). false: canciones y remates, que suenan una vez. */
  bucle?: boolean;
  /** Cuando termina una que no se repite (por ejemplo, la canción de la entrada y después la de jugar). */
  luego?: string;
  /** Volver a empezarla aunque ya esté sonando. */
  reiniciar?: boolean;
  /** Si esta no tiene archivo (la app de amigos no trae las de la pareja), esta otra. */
  oSino?: string;
}
type ListaPistas = Record<string, [string, number]>;
let listaPistas: Promise<ListaPistas> | null = null;
function leerLista(dir: string): Promise<ListaPistas> {
  return fetch(`./${dir}lista.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((l: unknown) => {
      const out: ListaPistas = {};
      if (l && typeof l === 'object' && !Array.isArray(l))
        for (const [k, v] of Object.entries(l as Record<string, unknown>)) if (Array.isArray(v) && typeof v[0] === 'string') out[k] = [dir + v[0], Number(v[1]) || 0];
      return out;
    })
    .catch(() => ({}));
}
function pistasDisponibles() {
  listaPistas ??= Promise.all([leerLista('musica/'), leerLista('musica/pareja/')]).then(([a, b]) => ({ ...a, ...b }));
  return listaPistas;
}
/** ¿Hay archivo para esta pista? (para escoger entre una pista y otra). */
export async function hayPista(id: string) {
  return !!(await pistasDisponibles())[id];
}

const buffersPistas = new Map<string, Promise<AudioBuffer | null>>();
function cargarPista(archivo: string): Promise<AudioBuffer | null> {
  let p = buffersPistas.get(archivo);
  if (!p && ctx) {
    const c = ctx;
    p = fetch(`./${archivo}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => c.decodeAudioData(b))
      .catch(() => null);
    buffersPistas.set(archivo, p);
    // Que no se llene la memoria: se guardan las últimas 6
    if (buffersPistas.size > 6) buffersPistas.delete(buffersPistas.keys().next().value!);
  }
  return p ?? Promise.resolve(null);
}

if (typeof window !== 'undefined') (window as unknown as { __musica?: unknown }).__musica = () => ({ pista: sonando?.id ?? null, activa: pistaActiva, velocidad });

const volumenPistas = () => (musicaApagada || musicaCallada ? 0 : 0.62 * (musicaAgachada ? 0.35 : 1));
/** Lo que dura el cruce entre una vuelta y la siguiente. */
const CRUCE = 2.5;
interface Vuelta { f: AudioBufferSourceNode; g: GainNode; inicio: number; desde: number; vel: number }
interface Sonando { id: string; buf: AudioBuffer; g: GainNode; bucle: boolean; luego?: string; vueltas: Vuelta[]; proxima: number; reloj: number }
let pistaPedida: { id: string; op: OpcionesPista } | null = null;
let sonando: Sonando | null = null;
/** Hay una pista en archivo sonando: la sintetizada se calla. */
let pistaActiva = false;
let velocidad = 1;
let turnoPista = 0;

async function ponerPista(id: string | null, op: OpcionesPista) {
  const mio = ++turnoPista;
  if (!ctx || !salidaPistas) return;
  if (!id) return soltarPista();
  const lista = await pistasDisponibles();
  if (!lista[id] && op.oSino) return ponerPista(op.oSino, { ...op, oSino: undefined });
  const archivo = lista[id]?.[0];
  const buf = archivo ? await cargarPista(archivo) : null;
  if (mio !== turnoPista || !ctx || !salidaPistas) return;
  if (!buf) return soltarPista();
  soltarPista(false);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
  g.connect(salidaPistas);
  const bucle = op.bucle ?? true;
  sonando = { id, buf, g, bucle, luego: op.luego, vueltas: [], proxima: 0, reloj: 0 };
  pistaActiva = true;
  vuelta(sonando, ctx.currentTime + 0.05, 0, true);
  const s = sonando;
  s.reloj = window.setInterval(() => cuidarPista(s), 400);
}

/** Programa una vuelta de la pista desde `desde` (segundos del archivo) en el momento `t`. */
function vuelta(s: Sonando, t: number, desde: number, primera = false) {
  if (!ctx) return;
  const f = ctx.createBufferSource();
  f.buffer = s.buf;
  f.playbackRate.value = velocidad;
  const g = ctx.createGain();
  f.connect(g).connect(s.g);
  const v: Vuelta = { f, g, inicio: t, desde, vel: velocidad };
  if (s.bucle && !primera && desde === 0) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + CRUCE);
  }
  f.start(t, desde);
  s.vueltas.push(v);
  programarFin(s, v);
}

/** Cuándo se apaga una vuelta y cuándo entra la siguiente (según la velocidad). */
function programarFin(s: Sonando, v: Vuelta) {
  if (!ctx) return;
  const fin = v.inicio + (s.buf.duration - v.desde) / v.vel;
  if (s.bucle) {
    const cruce = Math.min(CRUCE, (s.buf.duration - v.desde) / v.vel / 3);
    v.g.gain.cancelScheduledValues(Math.max(ctx.currentTime, fin - cruce));
    v.g.gain.setValueAtTime(1, Math.max(ctx.currentTime, fin - cruce));
    v.g.gain.linearRampToValueAtTime(0, fin);
    s.proxima = fin - cruce;
  } else s.proxima = Infinity;
  try {
    v.f.stop(fin + 0.05);
  } catch {
    /* ya paró */
  }
}

/** Cada poco: entra la vuelta siguiente a tiempo, y al terminar una que no se repite sigue la de «luego». */
function cuidarPista(s: Sonando) {
  if (!ctx || sonando !== s) return clearInterval(s.reloj);
  const ahora = ctx.currentTime;
  s.vueltas = s.vueltas.filter((v) => v.inicio + (s.buf.duration - v.desde) / v.vel > ahora - 0.5);
  if (s.bucle && ahora > s.proxima - 1.5 && s.proxima !== Infinity) {
    const t = Math.max(ahora + 0.05, s.proxima);
    s.proxima = Infinity;
    vuelta(s, t, 0);
  }
  if (!s.bucle && !s.vueltas.length) {
    const luego = s.luego;
    soltarPista();
    if (luego) musica.pista(luego);
    else pistaPedida = null;
  }
}

/** Cambió la velocidad: la vuelta que suena sigue desde donde iba, a la velocidad nueva. */
function reprogramar() {
  if (!ctx || !sonando) return;
  const s = sonando;
  const ahora = ctx.currentTime;
  const actual = s.vueltas.filter((v) => v.inicio <= ahora).pop();
  for (const v of s.vueltas) if (v.inicio > ahora) {
    try {
      v.f.stop();
    } catch {
      /* ya paró */
    }
  }
  s.vueltas = s.vueltas.filter((v) => v.inicio <= ahora);
  if (!actual) return;
  const pos = actual.desde + (ahora - actual.inicio) * actual.vel;
  if (pos >= s.buf.duration - 0.2) return;
  actual.f.playbackRate.setTargetAtTime(velocidad, ahora, 0.3);
  actual.inicio = ahora;
  actual.desde = pos;
  actual.vel = velocidad;
  programarFin(s, actual);
}

function soltarPista(volverSintetizada = true) {
  const s = sonando;
  sonando = null;
  if (s && ctx) {
    clearInterval(s.reloj);
    const t = ctx.currentTime;
    s.g.gain.cancelScheduledValues(t);
    s.g.gain.setValueAtTime(s.g.gain.value, t);
    s.g.gain.linearRampToValueAtTime(0, t + 1.2);
    for (const v of s.vueltas) {
      try {
        v.f.stop(t + 1.3);
      } catch {
        /* ya paró */
      }
    }
    setTimeout(() => s.g.disconnect(), 1500);
  }
  if (volverSintetizada) pistaActiva = false;
}

async function tocarRemate(id: string) {
  if (!ctx || !salidaPistas || silencio) return;
  const archivo = (await pistasDisponibles())[id]?.[0];
  const buf = archivo ? await cargarPista(archivo) : null;
  if (!buf || !ctx || !salidaPistas) return;
  const f = ctx.createBufferSource();
  f.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = musicaApagada ? 0.7 : 1.15;
  f.connect(g).connect(maestro ?? salidaPistas);
  f.start();
  // La música de fondo baja mientras suena el remate
  musica.agachar(true);
  setTimeout(() => musica.agachar(false), buf.duration * 1000);
}
