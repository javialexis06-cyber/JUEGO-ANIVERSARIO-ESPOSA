// Sonido de «Desaparecidos de Astra»: la música suave de fondo (una pista de misterio de la lista de siempre), las
// notas de voz de los casos (public/audio/celular/voces.json, las hace scripts/celular/voces.mjs con ElevenLabs) y
// unos efectos cortos. La música baja mientras suena una voz.

interface VozArchivo { archivo: string; seg: number }
let voces: Record<string, VozArchivo> = {};
let efectos: Record<string, [string, number]> = {};
let musica: HTMLAudioElement | null = null;
let musicaOn = true;
let actual: HTMLAudioElement | null = null;
let alTerminar: (() => void) | null = null;

const VOL_MUSICA = 0.28;

export async function cargarAudio() {
  const leer = async <T>(url: string, vacio: T): Promise<T> => {
    try { const r = await fetch(url); return r.ok ? ((await r.json()) as T) : vacio; } catch { return vacio; }
  };
  const [v, lista, sfx] = await Promise.all([
    leer<{ voces?: Record<string, VozArchivo> }>('./audio/celular/voces.json', {}),
    leer<Record<string, [string, number]>>('./musica/lista.json', {}),
    leer<Record<string, [string, number]>>('./sfx/lista.json', {}),
  ]);
  voces = v.voces ?? {};
  efectos = sfx;
  const pista = lista['mesa-clue'] ?? lista['sangre-menu'] ?? lista['mesa-menu'];
  if (pista) {
    musica = new Audio(`./musica/${pista[0]}`);
    musica.loop = true;
    musica.volume = VOL_MUSICA;
  }
}

/** Arranca la música (después del primer toque, por la regla de los navegadores). */
export function arrancarMusica() {
  if (musica && musicaOn && musica.paused) void musica.play().catch(() => {});
}

export function ponerMusica(on: boolean) {
  musicaOn = on;
  if (!musica) return;
  if (on) arrancarMusica(); else musica.pause();
}

export function hayVoz(id: string) {
  return !!voces[id];
}
export function segundosVoz(id: string) {
  return voces[id]?.seg ?? 0;
}

/** Suena una nota de voz (para la que esté sonando). `fin` se llama al terminar o al pararla. */
export function sonarVoz(id: string, fin?: () => void, progreso?: (u: number) => void): boolean {
  pararVoz();
  const v = voces[id];
  if (!v) return false;
  const a = new Audio(v.archivo);
  actual = a;
  alTerminar = fin ?? null;
  if (musica) musica.volume = VOL_MUSICA * 0.3;
  a.ontimeupdate = () => progreso?.(a.duration ? a.currentTime / a.duration : 0);
  a.onended = () => pararVoz();
  void a.play().catch(() => pararVoz());
  return true;
}

export function pararVoz() {
  if (actual) { actual.pause(); actual.ontimeupdate = null; actual.onended = null; }
  actual = null;
  if (musica) musica.volume = VOL_MUSICA;
  const f = alTerminar;
  alTerminar = null;
  f?.();
}

export function sonandoVoz() {
  return !!actual;
}

/** Un efecto corto de public/sfx (tic, pop, tada…). */
export function efecto(nombre: string, vol = 0.5) {
  const f = efectos[nombre];
  if (!f) return;
  const a = new Audio(`./sfx/${f[0]}`);
  a.volume = vol;
  void a.play().catch(() => {});
}
