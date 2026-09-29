// Sonidos de las reacciones, sintetizados como el resto del juego (sin archivos).
import * as sonido from '../sonido';

const { nota, rumor } = sonido;

export const SONIDOS: Record<string, () => void> = {
  tin: () => { nota(2093, 0.18, 0, 'sine', 0.05); nota(3136, 0.25, 0.06, 'sine', 0.035); },
  pop: () => nota(420, 0.08, 0, 'sine', 0.09, 900),
  boing: () => { nota(180, 0.32, 0, 'triangle', 0.09, 620); nota(620, 0.12, 0.3, 'sine', 0.04, 500); },
  si: () => { nota(659, 0.09, 0, 'triangle', 0.07); nota(988, 0.16, 0.08, 'triangle', 0.07); },
  sacudir: () => rumor(0.09, 3200, 0.05, 0, 1.2),
  musiquita: () => [523, 659, 784, 659, 880, 784, 659, 523].forEach((f, i) => nota(f, 0.13, i * 0.17, 'triangle', 0.045)),
  fanfarria: () => {
    [523, 523, 523, 698].forEach((f, i) => nota(f, i < 3 ? 0.1 : 0.5, i * 0.13, 'square', 0.035));
    [659, 880].forEach((f, i) => nota(f, 0.5, 0.39 + i * 0.001, 'triangle', 0.04));
  },
  puchero: () => { nota(392, 0.16, 0, 'triangle', 0.06, 350); nota(349, 0.3, 0.2, 'triangle', 0.05, 300); },
  plaf: () => { rumor(0.08, 900, 0.1, 0, 0.6); nota(160, 0.1, 0, 'sine', 0.08, 90); },
  wawa: () => [392, 370, 349, 311].forEach((f, i) => nota(f, i < 3 ? 0.28 : 0.7, i * 0.32, 'sawtooth', 0.03, i < 3 ? f * 0.97 : 280)),
  duda: () => { nota(440, 0.12, 0, 'sine', 0.05, 520); nota(520, 0.16, 0.14, 'sine', 0.05, 470); },
  gota: () => nota(1400, 0.1, 0, 'sine', 0.05, 600),
  uf: () => rumor(0.45, 700, 0.06, 0, 0.5, 300),
  enojo: () => sonido.enojo(),
  pisoton: () => { nota(90, 0.09, 0, 'sine', 0.1, 50); rumor(0.06, 500, 0.05); },
  hmph: () => { rumor(0.16, 900, 0.07, 0, 0.9, 500); nota(200, 0.12, 0, 'sawtooth', 0.02, 160); },
  sorpresa: () => nota(300, 0.3, 0, 'sine', 0.07, 900),
  palmada: () => rumor(0.05, 2500, 0.07, 0, 1.5),
  palmada_fuerte: () => { rumor(0.07, 2200, 0.13, 0, 1.4); nota(1800, 0.25, 0.02, 'sine', 0.04, 2400); },
  risita: () => [880, 988, 880, 1047].forEach((f, i) => nota(f, 0.07, i * 0.11, 'sine', 0.045, f * 0.9)),
  carcajada: () => [587, 523, 587, 523, 494, 440].forEach((f, i) => nota(f, 0.09, i * 0.13, 'triangle', 0.05, f * 0.85)),
  frotar: () => { for (let i = 0; i < 5; i++) rumor(0.08, 1800, 0.035, i * 0.22, 1); },
  beso: () => sonido.beso(),
  corazon: () => sonido.corazon(),
  abrazo: () => sonido.abrazo(),
  idea: () => { nota(1318, 0.08, 0, 'sine', 0.05); nota(1760, 0.2, 0.08, 'sine', 0.05); },
  tictac: () => { for (let i = 0; i < 4; i++) nota(i % 2 ? 1500 : 1200, 0.03, i * 0.25, 'square', 0.025); },
  tic: () => nota(1300, 0.025, 0, 'square', 0.02),
  bostezo: () => sonido.bostezo(),
  agitar: () => { for (let i = 0; i < 6; i++) rumor(0.05, 3000 + (i % 2) * 800, 0.05, i * 0.1, 2); },
  soplo: () => rumor(0.35, 1100, 0.06, 0, 0.7, 700),
  llanto: () => [523, 494, 523, 494, 440].forEach((f, i) => nota(f, 0.34, i * 0.4, 'triangle', 0.04, f * 0.92)),
  porque: () => nota(523, 0.9, 0, 'triangle', 0.05, 330),
  rendirse: () => [659, 587, 523].forEach((f, i) => nota(f, 0.3, i * 0.28, 'sine', 0.05)),
  otra: () => { nota(392, 0.1, 0, 'square', 0.04); nota(523, 0.22, 0.1, 'square', 0.04); },
  desmayo: () => nota(700, 0.8, 0, 'sine', 0.05, 150),
  flash: () => { rumor(0.05, 5000, 0.08, 0, 1.2); nota(2600, 0.12, 0.02, 'sine', 0.03, 1800); },
  guitarra: () => [196, 247, 294, 392, 494].forEach((f, i) => nota(f, 0.9, i * 0.05, 'triangle', 0.035, f * 0.998)),
  almohadazo: () => { rumor(0.12, 700, 0.12, 0, 0.6, 300); nota(140, 0.12, 0, 'sine', 0.08, 90); },
  splash: () => { rumor(0.25, 1600, 0.1, 0, 0.8, 500); nota(300, 0.2, 0, 'sine', 0.05, 120); },
  pasos: () => { for (let i = 0; i < 4; i++) nota(120, 0.05, i * 0.18, 'sine', 0.06, 80); },
  tada: () => { nota(523, 0.12, 0, 'triangle', 0.06); nota(784, 0.4, 0.12, 'triangle', 0.07); nota(1047, 0.5, 0.12, 'sine', 0.03); },
  huida: () => { for (let i = 0; i < 6; i++) nota(i % 2 ? 330 : 294, 0.07, i * 0.11, 'triangle', 0.045); },
};

export function sonar(nombre: string | undefined) {
  if (!nombre) return;
  (SONIDOS[nombre] ?? (sonido as unknown as Record<string, (() => void) | undefined>)[nombre])?.();
}
