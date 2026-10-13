// Los sonidos de la carrera: los efectos (sintetizados o los de public/sfx), el galope del carro propio y las voces
// del presentador y de los corredores (public/audio/carreras/lista.json; las de Javier y Laura en
// public/audio/carreras-pareja/lista.json, que la versión para amigos no lleva). Cada voz sale también escrita en un
// globito (`alDecir`), así se entiende aunque no haya audio.
import * as sonido from '../sonido';
import { sonar } from '../reacciones/sonidos';
import { CON_PAREJA, FRASES_PAREJA } from './pareja';
import { FRASES_VECINOS, PRESENTADOR, type Linea, type Momento } from './frases';

const { nota, rumor } = sonido;

export const efecto = {
  caja: () => { nota(1318, 0.06, 0, 'square', 0.04); nota(1760, 0.1, 0.05, 'triangle', 0.06); nota(2349, 0.16, 0.1, 'triangle', 0.05); },
  ruleta: () => nota(1200 + Math.random() * 600, 0.04, 0, 'square', 0.02),
  objeto: () => { nota(988, 0.08, 0, 'triangle', 0.06); nota(1319, 0.18, 0.07, 'triangle', 0.07); },
  turbo: (n: number) => { rumor(0.5, 900, 0.09, 0, 0.6, 2400); nota(220 + n * 60, 0.45, 0, 'sawtooth', 0.025, 660 + n * 120); },
  chispas: (n: number) => nota(880 + n * 330, 0.08, 0, 'square', 0.025, 1400 + n * 300),
  golpe: () => sonar('almohadazo'),
  muro: () => { rumor(0.1, 500, 0.08, 0, 0.6); nota(110, 0.12, 0, 'sine', 0.07, 70); },
  salto: () => nota(260, 0.25, 0, 'triangle', 0.06, 700),
  truco: () => sonar('risita'),
  aterriza: () => { nota(90, 0.1, 0, 'sine', 0.08, 50); rumor(0.08, 600, 0.05); },
  caida: () => nota(700, 0.9, 0, 'sine', 0.05, 120),
  lava: () => { rumor(0.4, 400, 0.1, 0, 0.5, 150); sonar('splash'); },
  cuenta: () => nota(660, 0.18, 0, 'square', 0.05),
  ya: () => { nota(1320, 0.4, 0, 'square', 0.05); nota(1760, 0.4, 0, 'triangle', 0.04); },
  vuelta: () => sonar('tin'),
  ultima: () => [784, 988, 1175, 1568].forEach((f, i) => nota(f, 0.14, i * 0.09, 'square', 0.035)),
  meta: () => sonar('fanfarria'),
  rebufo: () => rumor(0.35, 2600, 0.05, 0, 0.6, 4000),
  lluvia: () => { for (let i = 0; i < 8; i++) nota(1400 + Math.random() * 800, 0.05, i * 0.07, 'sine', 0.03, 600); },
  semilla: () => sonar('pop'),
  ceniza: () => rumor(0.4, 300, 0.07, 0, 0.6, 120),
  brasa: () => { rumor(0.3, 700, 0.08, 0, 0.6, 300); nota(160, 0.3, 0, 'sawtooth', 0.03, 90); },
  lucero: () => { nota(1568, 0.3, 0, 'sine', 0.05, 2093); nota(2093, 0.4, 0.1, 'sine', 0.03); },
  velo: () => nota(600, 0.6, 0, 'sine', 0.05, 1500),
  pluma: () => sonar('boing'),
  toque: () => sonido.toque(),
};

/** Cascos al galope del carro propio: golpecitos suaves al ritmo de la velocidad. */
export class Galope {
  private t = 0;
  actualizar(dt: number, v: number, suelo: boolean) {
    if (!suelo || Math.abs(v) < 2) return;
    this.t += dt * (1.2 + Math.abs(v) * 0.11);
    if (this.t >= 0.5) {
      this.t -= 0.5;
      nota(140 + Math.random() * 30, 0.05, 0, 'sine', 0.035, 90);
      rumor(0.03, 900 + Math.random() * 300, 0.025, 0.06, 1.2);
    }
  }
}

// ------------------------------------------------------------------------------------------ voces

type Lista = Record<string, [string, number]>;
let listas: Promise<Lista> | null = null;
function lista(): Promise<Lista> {
  const leer = (dir: string) =>
    fetch(`./audio/${dir}/lista.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((l: Lista) => Object.fromEntries(Object.entries(l ?? {}).map(([k, v]) => [k, [`./audio/${dir}/${v[0]}`, v[1]] as [string, number]])))
      .catch(() => ({}) as Lista);
  listas ??= Promise.all([leer('carreras'), CON_PAREJA ? leer('carreras-pareja') : Promise.resolve({} as Lista)]).then(([a, b]) => ({ ...a, ...b }));
  return listas;
}
const buffers = new Map<string, Promise<AudioBuffer | null>>();
function buffer(archivo: string) {
  let p = buffers.get(archivo);
  const audio = sonido.contextoAudio();
  if (!p && audio) {
    p = fetch(archivo)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('sin audio'))))
      .then((b) => audio.ctx.decodeAudioData(b))
      .catch(() => null);
    buffers.set(archivo, p);
  }
  return p ?? Promise.resolve(null);
}

const TODAS: Linea[] = [...PRESENTADOR, ...FRASES_VECINOS, ...FRASES_PAREJA];
const POR_ID = new Map(TODAS.map((l) => [l.id, l]));

export class Voces {
  private hablando = 0;
  private fuente: AudioBufferSourceNode | null = null;
  private ultimo = new Map<string, number>();
  /** Muestra el globito (quién y qué). */
  alDecir: (quien: string, texto: string, seg: number) => void = () => undefined;
  /** Sin voces de la pareja (hay amigos en la sala). */
  neutro = false;
  callado = false;

  precargar(ids: string[]) {
    void lista().then((l) => {
      for (const id of ids) if (l[id]) void buffer(l[id][0]);
    });
  }

  /** Dice una línea por id. `prioridad`: el presentador corta lo demás; los corredores no se pisan. */
  async decir(id: string, prioridad = false) {
    const l = POR_ID.get(id);
    if (!l || this.callado) return;
    if (this.neutro && (l.quien === 'el' || l.quien === 'ella')) return;
    const ahora = performance.now();
    if (!prioridad && ahora < this.hablando) return;
    // La misma persona no habla dos veces seguidas en 6 s
    if (!prioridad && (this.ultimo.get(l.quien) ?? 0) > ahora - 6000) return;
    this.ultimo.set(l.quien, ahora);
    const lst = await lista();
    const audio = sonido.contextoAudio();
    const dato = lst[id];
    const seg = dato ? dato[1] : Math.max(1.4, l.texto.length * 0.06);
    this.hablando = ahora + seg * 1000 + 250;
    this.alDecir(l.quien, l.texto, seg);
    if (!dato || !audio || sonido.silenciado()) return;
    const buf = await buffer(dato[0]);
    if (!buf) return;
    try {
      this.fuente?.stop();
    } catch {
      /* ya terminó */
    }
    const f = audio.ctx.createBufferSource();
    f.buffer = buf;
    const g = audio.ctx.createGain();
    g.gain.value = 1;
    f.connect(g).connect(audio.salida);
    sonido.musica.agachar(true);
    f.onended = () => {
      if (this.fuente === f) {
        this.fuente = null;
        sonido.musica.agachar(false);
      }
    };
    this.fuente = f;
    f.start();
  }

  /** Una frase de un corredor en un momento (si tiene). */
  corredor(voz: string, m: Momento, prioridad = false) {
    void this.decir(`${voz}.${m}`, prioridad);
  }

  callar() {
    try {
      this.fuente?.stop();
    } catch {
      /* nada */
    }
    this.fuente = null;
    sonido.musica.agachar(false);
  }
}
