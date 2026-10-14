// Lo que suena en el torneo: los golpes (almohadazos y palmadas de peluche, de los efectos que ya tiene el juego en
// public/sfx/), los saltos, la súper, el público y las voces del presentador y de cada luchador
// (public/audio/peleas/comun/ y, en la versión de la pareja, public/audio/peleas/pareja/; ver scripts/peleas/voces.mjs).
import * as sonido from '../sonido';

type Lista = Record<string, [string, number]>;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let efectos: Promise<Lista> | null = null;
let voces: Promise<Lista> | null = null;
let neutro = false;

function lista(ruta: string, base: string): Promise<Lista> {
  return fetch(ruta)
    .then((r) => (r.ok ? r.json() : {}))
    .then((l: Record<string, [string, number]>) => Object.fromEntries(Object.entries(l ?? {}).map(([k, v]) => [k, [base + v[0], v[1]] as [string, number]])))
    .catch(() => ({}));
}

function cargarAudio(archivo: string): Promise<AudioBuffer | null> {
  let p = buffers.get(archivo);
  const a = sonido.contextoAudio();
  if (!p && a) {
    p = fetch(archivo)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => a.ctx.decodeAudioData(b))
      .catch(() => null);
    buffers.set(archivo, p);
  }
  return p ?? Promise.resolve(null);
}

/** Prepara las listas (los amigos o una sala con amigos: solo las voces comunes). */
export function prepararSonidos(sinPareja: boolean) {
  neutro = sinPareja;
  efectos ??= lista('./sfx/lista.json', './sfx/');
  voces = Promise.all([lista('./audio/peleas/comun/lista.json', './audio/peleas/comun/'), neutro ? Promise.resolve({}) : lista('./audio/peleas/pareja/lista.json', './audio/peleas/pareja/')]).then(([a, b]) => ({ ...a, ...b }));
}

/** Carga de una vez los audios de estas frases y efectos (para que suenen a tiempo). */
export async function precargar(ids: string[]) {
  const [e, v] = await Promise.all([efectos ?? Promise.resolve({} as Lista), voces ?? Promise.resolve({} as Lista)]);
  for (const id of ids) {
    const x = v[id] ?? e[id];
    if (x) void cargarAudio(x[0]);
  }
}

async function tocar(archivo: string, vol: number, vel = 1) {
  const buf = await cargarAudio(archivo);
  const a = sonido.contextoAudio();
  if (!buf || !a || sonido.silenciado()) return null;
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = vel;
  const g = a.ctx.createGain();
  g.gain.value = vol;
  src.connect(g).connect(a.salida);
  src.start();
  return { src, dur: buf.duration / vel };
}

/** Un efecto de la lista de public/sfx (con un sintetizado de respaldo). */
export async function efecto(id: string, vol = 0.8, vel = 1) {
  const l = await (efectos ?? Promise.resolve({} as Lista));
  if (l[id]) return void tocar(l[id][0], vol, vel);
  sonido.nota(320, 0.1, 0, 'triangle', 0.08, 160);
}

let hablando: { src: AudioBufferSourceNode } | null = null;
let hablaHasta = 0;
/** Dice una frase (por su id). `cortar`: calla la anterior; si no, se la salta si alguien está hablando. */
export async function decir(id: string, cortar = false): Promise<number> {
  const l = await (voces ?? Promise.resolve({} as Lista));
  const x = l[id];
  if (!x) return 0;
  const a = sonido.contextoAudio();
  const ahora = a?.ctx.currentTime ?? 0;
  if (!cortar && ahora < hablaHasta) return 0;
  if (cortar && hablando) {
    try {
      hablando.src.stop();
    } catch {
      /* ya había terminado */
    }
  }
  const r = await tocar(x[0], 1);
  if (!r) return 0;
  hablando = r;
  hablaHasta = ahora + r.dur;
  sonido.musica.agachar(true);
  r.src.onended = () => {
    if (hablando === r) {
      hablando = null;
      sonido.musica.agachar(false);
    }
  };
  return r.dur;
}

/** El golpe según su fuerza (almohadazo de peluche) y si lo taparon. */
export function golpe(fuerza: number, tapado: boolean) {
  if (tapado) {
    void efecto('palmada', 0.5, 1.5);
    sonido.nota(900, 0.05, 0, 'square', 0.03, 600);
    return;
  }
  const vel = 0.9 + Math.random() * 0.25;
  if (fuerza >= 3) {
    void efecto('almohadazo', 1, 0.85 * vel);
    void efecto('plaf', 0.6, 0.8);
  } else if (fuerza === 2) void efecto('almohadazo', 0.85, vel);
  else void efecto('palmada', 0.7, 1.1 * vel);
}

export function salto() {
  sonido.nota(380, 0.1, 0, 'sine', 0.05, 700);
}
export function whoosh() {
  sonido.rumor(0.18, 900, 0.06, 0, 1.2, 2400);
}
export function caida() {
  void efecto('pisoton', 0.8, 0.9);
}
export function superSonido() {
  void efecto('flash', 0.9);
  sonido.rumor(0.7, 300, 0.08, 0, 0.8, 2600);
}
export function ko() {
  void efecto('desmayo', 0.9);
  sonido.nota(196, 0.6, 0.05, 'sawtooth', 0.04, 98);
}
export function aplausos() {
  void efecto('palmada_fuerte', 0.5);
}
export function campana() {
  sonido.campana();
}
