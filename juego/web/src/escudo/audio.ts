// El sonido del Escudo: la música de la granja (M16 en los menús, M19 en la batalla, como en la película C09, y M20 al
// ganar), las voces (public/audio/escudo/voces.json y las de la pareja aparte) y unos efectos sintetizados.
// La música respeta el botón de la música de siempre (src/sonido.ts) y se calla en segundo plano.
import { activar, musica as musicaCasa, nota, rumor, silenciado } from '../sonido';
import { alPausar, alReanudar } from '../segundo_plano';
import { LINEAS, type Linea } from './guion';
import { LINEAS_PAREJA, VOCES_PAREJA } from './pareja';

const PISTAS: Record<string, string> = { menu: 'M16-227f5.ogg', batalla: 'M19-8e464.ogg', final: 'M20-5f27f.ogg' };
let pista: HTMLAudioElement | null = null;
let pistaId: string | null = null;
let agachada = false;
const VOL = 0.42;

function volumen() {
  if (silenciado() || musicaCasa.apagada()) return 0;
  return VOL * (agachada ? 0.35 : 1);
}

/** Pone una pista (con un fundido corto) o la quita. */
export function poner(id: keyof typeof PISTAS | null) {
  if (id === pistaId) return;
  pistaId = id;
  const vieja = pista;
  if (vieja) fundir(vieja, 0, 900, () => { vieja.pause(); vieja.src = ''; });
  pista = null;
  if (!id) return;
  const a = new Audio(`./audio/astra/musica/${PISTAS[id]}`);
  a.loop = true;
  a.volume = 0;
  pista = a;
  void a.play().catch(() => undefined);
  fundir(a, volumen(), 1200);
}

function fundir(a: HTMLAudioElement, meta: number, ms: number, luego?: () => void) {
  const ini = a.volume, t0 = performance.now();
  const paso = () => {
    const t = Math.min(1, (performance.now() - t0) / ms);
    a.volume = Math.max(0, Math.min(1, ini + (meta - ini) * t));
    if (t < 1) requestAnimationFrame(paso);
    else luego?.();
  };
  requestAnimationFrame(paso);
}

export function refrescarVolumen() {
  if (pista) pista.volume = volumen();
}

alPausar(() => { pista?.pause(); voz?.pause(); });
alReanudar(() => { if (pista) void pista.play().catch(() => undefined); });

/** Que el primer toque despierte el audio (lo exige el navegador). */
export function despertar() {
  activar();
  if (pista && pista.paused) void pista.play().catch(() => undefined);
}

// ------------------------------------------------------------------------------------------------- las voces

type Indice = Record<string, { archivo: string; seg: number }>;
let indice: Promise<Indice> | null = null;
function cargarIndice(): Promise<Indice> {
  const leer = (dir: string) => fetch(`./${dir}voces.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})) as Promise<Indice>;
  indice ??= Promise.all([leer('audio/escudo/'), VOCES_PAREJA === 'audio/escudo/' ? Promise.resolve({}) : leer(VOCES_PAREJA)]).then(([a, b]) => ({ ...a, ...b }));
  return indice;
}
void cargarIndice();

let voz: HTMLAudioElement | null = null;

/** La línea por id (común o de la pareja). */
export function linea(id: string): Linea | null {
  return LINEAS_PAREJA[id] ?? LINEAS[id] ?? null;
}

/** Dice una línea. Devuelve cuántos segundos dura (si no hay audio, lo que se demora en leerse). */
export async function decir(id: string, alHablar?: (l: Linea, seg: number) => void): Promise<number> {
  const l = linea(id);
  if (!l) return 0;
  const idx = await cargarIndice();
  const v = idx[l.id];
  const seg = v?.seg ?? Math.max(2, l.texto.length / 15);
  alHablar?.(l, seg);
  if (v && !silenciado()) {
    voz?.pause();
    const a = new Audio(v.archivo.replace(/^\.\//, './'));
    a.volume = 1;
    voz = a;
    agachada = true;
    refrescarVolumen();
    a.onended = () => { if (voz === a) { agachada = false; refrescarVolumen(); } };
    void a.play().catch(() => { agachada = false; refrescarVolumen(); });
  }
  return seg;
}

export function callarVoz() {
  voz?.pause();
  voz = null;
  agachada = false;
  refrescarVolumen();
}

// ------------------------------------------------------------------------------------------------- efectos

/** Efectos cortos sintetizados (no gastan archivos): disparos, golpes, construir, la ceniza que llega. */
export const fx = {
  construir: () => { nota(392, 0.08, 0, 'triangle', 0.06); nota(523, 0.1, 0.06, 'triangle', 0.06); nota(784, 0.16, 0.12, 'triangle', 0.05); },
  mejorar: () => [523, 659, 784, 1046].forEach((f, i) => nota(f, 0.12, i * 0.05, 'triangle', 0.05)),
  vender: () => { nota(784, 0.08, 0, 'sine', 0.05); nota(523, 0.12, 0.07, 'sine', 0.05); },
  fuego: () => rumor(0.25, 700, 0.035, 0, 0.7, 260),
  estallido: () => rumor(0.35, 420, 0.06, 0, 0.6, 120),
  pluma: () => nota(1400, 0.06, 0, 'sine', 0.025, 2200),
  pulso: () => nota(330, 0.35, 0, 'sine', 0.03, 220),
  llama: () => rumor(0.2, 900, 0.02, 0, 0.5, 500),
  luz: () => nota(1760, 0.08, 0, 'sine', 0.02, 2400),
  alma: () => { nota(1318, 0.12, 0, 'sine', 0.03); nota(1760, 0.2, 0.08, 'sine', 0.025); },
  muerte: () => rumor(0.12, 1600, 0.025, 0, 1, 600),
  fuga: () => { nota(220, 0.25, 0, 'sawtooth', 0.04, 110); rumor(0.3, 300, 0.05); },
  oleada: () => { nota(196, 0.5, 0, 'triangle', 0.06); nota(262, 0.5, 0.15, 'triangle', 0.05); nota(196, 0.7, 0.3, 'triangle', 0.05); },
  jefe: () => { nota(98, 1.2, 0, 'sawtooth', 0.05, 70); nota(147, 1.2, 0.1, 'sawtooth', 0.03, 100); },
  meteoro: () => { rumor(0.9, 300, 0.08, 0, 0.6, 90); },
  velo: () => [880, 1108, 1318].forEach((f, i) => nota(f, 0.6, i * 0.08, 'sine', 0.03)),
  lazo: () => [523, 659, 784, 1046, 1318].forEach((f, i) => nota(f, 0.9, i * 0.09, 'sine', 0.04)),
  cura: () => { nota(988, 0.1, 0, 'sine', 0.04); nota(1318, 0.18, 0.08, 'sine', 0.04); },
  toque: () => nota(660, 0.05, 0, 'triangle', 0.04),
  no: () => nota(180, 0.15, 0, 'square', 0.03),
  ganar: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => nota(f, 0.22, i * 0.11, 'triangle', 0.06)),
  perder: () => [392, 330, 262, 196].forEach((f, i) => nota(f, 0.3, i * 0.16, 'triangle', 0.06)),
};
