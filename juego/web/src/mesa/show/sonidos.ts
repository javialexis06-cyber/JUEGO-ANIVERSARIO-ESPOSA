// Los sonidos del show, sintetizados como todo el juego (sin archivos): la música de concurso (alegre de fondo y de
// suspenso mientras contestan), el redoble, el timbre de acierto, el «¡bzzz!» del error, los aplausos y el «¡ohhh!» del
// público, el tic tac del reloj y la fanfarria de cada ronda. La música respeta el botón ♪ de la mesa.
import * as sonido from '../../sonido';

const { nota, rumor } = sonido;
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export const SFX = {
  /** Timbre de acierto (campanas brillantes). */
  ding: () => {
    [1047, 1319, 1568, 2093].forEach((f, i) => nota(f, 0.5, i * 0.07, 'sine', 0.07));
    nota(2637, 0.6, 0.28, 'triangle', 0.035);
  },
  /** «¡Bzzz!» de error. */
  bzzz: () => {
    nota(110, 0.55, 0, 'sawtooth', 0.06, 104);
    nota(116, 0.55, 0, 'square', 0.035, 110);
  },
  /** Casi: dos notas que no terminan de subir. */
  casi: () => {
    nota(523, 0.14, 0, 'triangle', 0.06);
    nota(587, 0.3, 0.14, 'triangle', 0.06, 560);
  },
  /** Redoble de tambor que crece. */
  redoble: (seg = 1.4) => {
    const golpes = Math.round(seg * 22);
    for (let i = 0; i < golpes; i++) rumor(0.05, 1500 + (i % 2) * 250, 0.02 + (0.06 * i) / golpes, i / 22, 1.3);
    // Platillo al final
    rumor(0.9, 6500, 0.08, seg, 0.4, 3000);
    nota(90, 0.3, seg, 'sine', 0.12, 45);
  },
  /** Aplausos del público (n = cuánto duran). */
  aplausos: (seg = 2.2, fuerza = 1) => {
    const n = Math.round(seg * 26);
    for (let i = 0; i < n; i++) {
      const t = i / 26 + Math.random() * 0.03;
      const caida = i > n * 0.6 ? 1 - (i - n * 0.6) / (n * 0.4) : 1;
      rumor(0.035, 1800 + Math.random() * 2600, (0.025 + Math.random() * 0.03) * fuerza * caida, t, 1.6);
    }
  },
  /** «¡Ohhh!» de lástima del público (voces graves que bajan). */
  ohh: () => {
    for (const [f, d] of [[220, 0], [262, 0.03], [196, 0.05], [247, 0.02]] as const) nota(f, 1.0, d, 'sawtooth', 0.012, f * 0.78);
    rumor(1.0, 500, 0.03, 0, 0.6, 300);
  },
  /** «¡Uuuh!» del público (sorpresa, sube). */
  uuh: () => {
    for (const [f, d] of [[262, 0], [330, 0.03], [294, 0.05]] as const) nota(f, 0.7, d, 'sawtooth', 0.012, f * 1.35);
  },
  /** Risas del público. */
  risas: () => {
    for (let i = 0; i < 9; i++) nota(520 + Math.random() * 260, 0.08, i * 0.12 + Math.random() * 0.03, 'triangle', 0.02, 420);
    rumor(1.1, 1200, 0.025, 0, 0.7);
  },
  /** Barrido de transición (cortinilla de TV). */
  whoosh: () => rumor(0.45, 900, 0.07, 0, 0.8, 4200),
  /** Golpe del logo. */
  golpe: () => {
    nota(70, 0.4, 0, 'sine', 0.16, 40);
    rumor(0.25, 300, 0.08, 0, 0.5);
  },
  /** Tic del reloj (el último segundo más agudo). */
  tic: (urgente = false) => nota(urgente ? 1760 : 1320, 0.04, 0, 'square', 0.025),
  /** Timbre del atril al contestar. */
  timbre: () => {
    nota(880, 0.08, 0, 'square', 0.03);
    nota(1320, 0.18, 0.07, 'triangle', 0.05);
  },
  /** Botón del celular. */
  toque: () => nota(700, 0.05, 0, 'triangle', 0.05),
  /** Fanfarria de entrada de ronda. */
  fanfarria: () => {
    [67, 72, 76, 79].forEach((n, i) => nota(midi(n), 0.16, i * 0.1, 'square', 0.03));
    [72, 76, 79, 84].forEach((n) => nota(midi(n), 0.7, 0.42, 'triangle', 0.04));
    nota(midi(48), 0.7, 0.42, 'triangle', 0.08);
  },
  /** Fanfarria grande (final, ganador). */
  fanfarriaGrande: () => {
    [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => nota(midi(n), 0.14, i * 0.11, 'square', 0.03));
    [72, 76, 79, 84, 88].forEach((n) => nota(midi(n), 1.3, 0.9, 'triangle', 0.035));
    nota(midi(36), 1.3, 0.9, 'triangle', 0.09);
    rumor(1.2, 6500, 0.06, 0.9, 0.4, 3000);
  },
  /** Puntos que suman. */
  puntos: () => [1568, 2093].forEach((f, i) => nota(f, 0.09, i * 0.06, 'triangle', 0.04)),
  /** Cañón de confeti. */
  confeti: () => {
    rumor(0.12, 400, 0.12, 0, 0.6);
    rumor(0.5, 5000, 0.05, 0.05, 0.6, 2500);
  },
  /** Se abre el sobre sellado. */
  sobre: () => {
    rumor(0.25, 2500, 0.05, 0, 1.2, 1200);
    nota(988, 0.25, 0.15, 'sine', 0.04);
  },
  /** El medidor de conexión subiendo. */
  medidor: (k: number) => nota(400 + k * 900, 0.05, 0, 'triangle', 0.035),
  /** Ladrido del presentador. */
  guau: () => {
    nota(420, 0.09, 0, 'sawtooth', 0.04, 260);
    nota(380, 0.12, 0.16, 'sawtooth', 0.04, 220);
  },
};

// ------------------------------------------------------------------------------------------------- Música
// Tema del concurso: brillante y saltarín en las entradas; mientras contestan, un colchón de suspenso que no estorba.
type Tema = 'tema' | 'suspenso' | 'relampago' | null;
let tema: Tema = null;
let reloj = 0;
let proximo = 0;
let paso = 0;

const ACORDES = [
  [48, [64, 67, 72]],
  [45, [64, 69, 72]],
  [41, [65, 69, 72]],
  [43, [62, 67, 71]],
] as const;
const MELODIA = [72, 74, 76, 79, 76, 74, 72, 67, 69, 72, 74, 72, 69, 67, 64, 67];

function tocar(t: Tema, i: number, cuando: number, corchea: number) {
  const compas = Math.floor(i / 8) % 4;
  const k = i % 8;
  const [bajo, voces] = ACORDES[compas];
  if (t === 'tema' || t === 'relampago') {
    // Bombo, caja y platillo cerrado
    if (k === 0 || k === 4) nota(110, 0.12, cuando, 'sine', 0.09, 45);
    if (k === 2 || k === 6) rumor(0.08, 1900, 0.035, cuando, 0.8);
    rumor(0.03, 8000, 0.012, cuando, 2);
    // Bajo saltarín
    if (k % 2 === 0) nota(midi(bajo + (k === 4 ? 7 : 0)), corchea * 0.9, cuando, 'triangle', 0.07);
    // Metales: golpes en los contratiempos
    if (k === 3 || k === 7) for (const v of voces) nota(midi(v), corchea * 0.6, cuando, 'square', 0.009);
    // Melodía cada dos compases
    if (compas % 2 === 0 && k % 2 === 0) nota(midi(MELODIA[(compas * 4 + k / 2) % MELODIA.length]), corchea * 1.6, cuando, 'triangle', 0.03);
    if (t === 'relampago' && k % 2 === 1) rumor(0.025, 9000, 0.01, cuando, 2);
  } else if (t === 'suspenso') {
    // Pulso grave y un acorde suave que respira (sin melodía: no distrae mientras piensan)
    if (k === 0) nota(midi(bajo - 12), corchea * 7, cuando, 'sine', 0.05);
    if (k === 0 && compas % 2 === 0) for (const v of voces) nota(midi(v - 12), corchea * 14, cuando, 'sine', 0.012);
    if (k === 4) nota(midi(voces[2] + 12), corchea * 0.5, cuando, 'sine', 0.012);
    rumor(0.02, 7000, 0.006, cuando, 2);
  }
}

/** Cambia (o apaga con null) la música del show. */
export function musica(t: Tema) {
  tema = t;
  if (!t) {
    clearInterval(reloj);
    reloj = 0;
    return;
  }
  if (reloj) return;
  proximo = performance.now() / 1000 + 0.1;
  paso = 0;
  reloj = window.setInterval(() => {
    const ahora = performance.now() / 1000;
    const bpm = tema === 'relampago' ? 150 : tema === 'suspenso' ? 84 : 124;
    const corchea = 60 / bpm / 2;
    if (proximo < ahora - 0.3) proximo = ahora + 0.05;
    while (proximo < ahora + 0.25) {
      if (tema && !sonido.musica.apagada() && !sonido.silenciado() && document.visibilityState === 'visible') tocar(tema, paso, proximo - ahora, corchea);
      proximo += corchea;
      paso = (paso + 1) % 64;
    }
  }, 40);
}
