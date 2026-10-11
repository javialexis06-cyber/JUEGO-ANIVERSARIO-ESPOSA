// Las voces de Él y Ella (hechas con IA a partir de sus voces: docs/sistemas/voces.md). Cada frase que dicen en un
// globito suena si tiene su audio. El audio se busca con un código que sale de quién la dice y del texto limpio (sin
// emojis), así sirve en cualquier parte del juego sin numerar frases: si el texto cambia, simplemente deja de sonar
// hasta que se vuelva a generar. La lista (public/voces/lista.json) la arma scripts/voces-ia.mjs; sin lista (la
// versión para amigos no la trae) no suena nada. Suena por el mismo audio del juego (respeta el silencio y la pausa)
// y baja la música mientras hablan. Con amigos en la sala (modo neutro) se callan: son las voces de la pareja.
import { esNeutro } from './neutro';
import * as sonido from './sonido';

export type Quien = 'el' | 'ella';

/** Qué hacer si ya está sonando otra frase: cortarla, saltarse esta, o esperar a que termine. */
export type ModoVoz = 'cortar' | 'saltar' | 'esperar';

/** El texto como se lee para el código: sin emojis y con los espacios en orden. */
export function limpiar(texto: string) {
  return texto
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Código de la frase (FNV-1a de 32 bits de «quien|texto limpio»), el mismo que usa scripts/voces-ia.mjs. */
export function idFrase(quien: Quien, texto: string) {
  const s = `${quien}|${limpiar(texto)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, '0');
}

/** código → [archivo, segundos] */
type Lista = Record<string, [string, number]>;
let lista: Promise<Lista> | null = null;

function disponibles(): Promise<Lista> {
  lista ??= fetch('./voces/lista.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((l: unknown) => {
      const out: Lista = {};
      if (!l || typeof l !== 'object' || Array.isArray(l)) return out;
      for (const [k, v] of Object.entries(l as Record<string, unknown>)) {
        if (Array.isArray(v) && typeof v[0] === 'string') out[k] = [v[0], Number(v[1]) || 0];
        else if (typeof v === 'string') out[k] = [v, 0];
      }
      return out;
    })
    .catch(() => ({}));
  return lista;
}

/** Carga la lista de una vez (para que la primera frase no llegue tarde). */
export function precargar() {
  void disponibles();
}

const buffers = new Map<string, Promise<AudioBuffer | null>>();
function cargar(ctx: AudioContext, archivo: string) {
  let p = buffers.get(archivo);
  if (!p) {
    p = fetch(`./voces/${archivo}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => ctx.decodeAudioData(b))
      .catch(() => null);
    buffers.set(archivo, p);
    // Que no se acumulen: se guardan las últimas 40
    if (buffers.size > 40) buffers.delete(buffers.keys().next().value!);
  }
  return p;
}

let fuente: AudioBufferSourceNode | null = null;
let terminaEn = 0;
let turno = 0;

const sonando = () => fuente !== null && performance.now() < terminaEn;

function soltar() {
  if (fuente) {
    try {
      fuente.onended = null;
      fuente.stop();
    } catch {
      /* ya había parado */
    }
  }
  fuente = null;
  sonido.musica.agachar(false);
}

/** Calla la frase que esté sonando. */
export function callar() {
  turno++;
  soltar();
}

/** ¿Hay audio para esta frase? Devuelve cuánto dura (segundos) o 0. */
export async function duracion(quien: Quien, texto: string | null | undefined): Promise<number> {
  if (!texto || esNeutro()) return 0;
  return (await disponibles())[idFrase(quien, texto)]?.[1] ?? 0;
}

/** Suena un audio por su código (los recuerdos de Cien Puertas también tienen código propio). */
async function oirCodigo(ids: string[], modo: ModoVoz): Promise<number> {
  if (sonido.silenciado()) return 0;
  const l = await disponibles();
  const pedazos = ids.map((id) => l[id]).filter((x): x is [string, number] => !!x);
  if (!pedazos.length) return 0;
  if (modo === 'saltar' && sonando()) return 0;
  if (modo === 'esperar') {
    const hasta = performance.now() + 4000;
    while (sonando() && performance.now() < hasta) await new Promise((ok) => setTimeout(ok, 120));
  }
  const mio = ++turno;
  soltar();
  sonido.activar();
  const audio = sonido.contextoAudio();
  if (!audio) return 0;
  const total = pedazos.reduce((a, [, s]) => a + s, 0);
  void (async () => {
    for (const [archivo] of pedazos) {
      const buf = await cargar(audio.ctx, archivo);
      if (mio !== turno) return;
      if (!buf) continue;
      const f = audio.ctx.createBufferSource();
      f.buffer = buf;
      f.connect(audio.salida);
      fuente = f;
      terminaEn = performance.now() + buf.duration * 1000 + 50;
      sonido.musica.agachar(true);
      await new Promise<void>((listo) => {
        f.onended = () => listo();
        f.start();
      });
      if (mio !== turno) return;
    }
    fuente = null;
    sonido.musica.agachar(false);
  })();
  return total;
}

/** Dice la frase (o varias seguidas) con la voz de quien habla, si tiene audio. Devuelve cuánto dura (s) o 0. */
export function decir(quien: Quien, texto: string | (string | null | undefined)[] | null | undefined, modo: ModoVoz = 'cortar') {
  if (!texto || esNeutro()) return Promise.resolve(0);
  const textos = (Array.isArray(texto) ? texto : [texto]).filter((t): t is string => !!t);
  return oirCodigo(textos.map((t) => idFrase(quien, t)), modo);
}
