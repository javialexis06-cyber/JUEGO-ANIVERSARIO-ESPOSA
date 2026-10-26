// Un efecto de sonido en archivo (public/sfx/, los hace scripts/musica-ia.mjs desde musica-guion/guion.mjs), cargado
// solo cuando se pide: el patio y el perro del show lo usan. Devuelve false si todavía no está (quien llama decide si
// suena algo sintetizado mientras tanto). Respeta el silencio general.
import * as sonido from './sonido';

let lista: Promise<Record<string, [string, number]>> | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const hechos = new Map<string, AudioBuffer>();

function cargar(nombre: string): Promise<AudioBuffer | null> {
  const audio = sonido.contextoAudio();
  if (!audio) return Promise.resolve(null);
  lista ??= fetch('./sfx/lista.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  let p = buffers.get(nombre);
  if (!p) {
    p = lista.then((l) => {
      const archivo = l[nombre]?.[0];
      if (!archivo) return null;
      return fetch(`./sfx/${archivo}`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status))))).then((b) => audio.ctx.decodeAudioData(b));
    }).then((b) => { if (b) hechos.set(nombre, b); return b; }).catch(() => null);
    buffers.set(nombre, p);
  }
  return p;
}

/** Deja listos estos efectos (para que el primero no llegue tarde). */
export function precargarEfectos(nombres: string[]) {
  for (const n of nombres) void cargar(n);
}

/** Suena el efecto si ya está cargado (con una pizca de variación de tono). */
export function efectoArchivo(nombre: string, vol = 0.7, variar = 0.08): boolean {
  const audio = sonido.contextoAudio();
  if (!audio) return false;
  const buf = hechos.get(nombre);
  if (!buf) {
    void cargar(nombre);
    return false;
  }
  if (sonido.silenciado()) return true;
  const f = audio.ctx.createBufferSource();
  f.buffer = buf;
  f.playbackRate.value = 1 - variar / 2 + Math.random() * variar;
  const g = audio.ctx.createGain();
  g.gain.value = vol;
  f.connect(g).connect(audio.salida);
  f.start();
  return true;
}
