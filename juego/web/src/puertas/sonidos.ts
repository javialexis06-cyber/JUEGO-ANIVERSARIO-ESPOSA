// Sonidos propios de Cien Puertas, sintetizados con las notas y el ruido de ../sonido (sin archivos):
// el timbre de la casa, el teléfono, la radio, la caja musical, el búho, los relojes, las olas, lo que se rompe…
import { nota, rumor } from './sonido_eco';

/** Campana con parciales de campana de verdad (f, 2.76 f, 5.4 f) y cola larga. */
function campanada(f: number, cuando = 0, vol = 0.12, dur = 1.4) {
  nota(f, dur, cuando, 'sine', vol);
  nota(f * 2.76, dur * 0.5, cuando, 'sine', vol * 0.3);
  nota(f * 5.4, dur * 0.25, cuando, 'sine', vol * 0.12);
  nota(f * 2, dur * 0.7, cuando, 'triangle', vol * 0.15);
}

// --- La casa ----------------------------------------------------------------
/** Ding… dong: el timbre de la casa. */
export function timbre(cuando = 0) {
  campanada(740, cuando, 0.13, 1.1);
  campanada(587, cuando + 0.55, 0.13, 1.6);
}
/** El timbre trabado: un zumbido que no alcanza a sonar (más fuerte según la carga, 0–1). */
export function timbreTrabado(k: number) {
  nota(150 + k * 60, 0.07, 0, 'square', 0.02 + k * 0.03);
  if (k > 0.45) nota(740, 0.06, 0.02, 'sine', 0.02 + (k - 0.45) * 0.08);
}
/** Golpe en una puerta de madera. */
export function golpePuerta(largo = false) {
  rumor(largo ? 0.3 : 0.1, 170, 0.16, 0, 2);
  nota(95, largo ? 0.28 : 0.1, 0, 'sine', 0.14, 70);
}
/** Tic tac de reloj de pared. */
export function tictac(cuantos = 4, cada = 0.5, cuando = 0) {
  for (let i = 0; i < cuantos; i++) {
    nota(i % 2 ? 1700 : 2100, 0.025, cuando + i * cada, 'square', 0.025);
    rumor(0.02, 3000, 0.03, cuando + i * cada, 3);
  }
}
/** El clic de una manecilla que se mueve. */
export const clic = () => nota(2400, 0.02, 0, 'square', 0.02);
/** Interruptor de la luz. */
export const interruptor = () => {
  nota(1800, 0.015, 0, 'square', 0.04);
  rumor(0.03, 2500, 0.05, 0, 2);
};
/** Una lámpara que se prende (zumbidito). */
export const prender = (f = 600) => {
  interruptor();
  nota(f, 0.12, 0.02, 'triangle', 0.05);
};

// --- Afuera -----------------------------------------------------------------
/** Pajarito que canta. */
export function pajaro(cuando = 0) {
  for (let i = 0; i < 3; i++) nota(2300 + i * 200, 0.07, cuando + i * 0.11, 'sine', 0.035, 3300 + i * 150);
}
/** Agua que cae (regadera, olas cortas). */
export const agua = (dur = 0.6, vol = 0.06) => rumor(dur, 1800, vol, 0, 0.6, 900);
/** Olas del mar. */
export const ola = () => rumor(2.2, 500, 0.05, 0, 0.4, 250);
/** Búho: «hu… huuu». */
export function buho(cuando = 0) {
  nota(420, 0.22, cuando, 'sine', 0.11, 380);
  nota(400, 0.5, cuando + 0.3, 'sine', 0.12, 340);
}
/** Grillos de noche. */
export function grillo(cuando = 0) {
  for (let i = 0; i < 4; i++) nota(4200, 0.03, cuando + i * 0.05, 'sine', 0.02);
}
/** Topo que se asoma (y el golpe cuando se le pega). */
export const topoSale = () => nota(500, 0.08, 0, 'sine', 0.05, 900);
export const topoGolpe = () => {
  rumor(0.08, 400, 0.14, 0, 1.5);
  nota(300, 0.12, 0, 'triangle', 0.08, 120);
};
/** Bocina de bus. */
export function pito(cuando = 0) {
  nota(330, 0.35, cuando, 'square', 0.03);
  nota(415, 0.35, cuando, 'square', 0.03);
}
/** Gaviota. */
export const gaviota = () => {
  nota(1500, 0.25, 0, 'sawtooth', 0.02, 900);
  nota(1400, 0.2, 0.3, 'sawtooth', 0.018, 800);
};

// --- Música -----------------------------------------------------------------
/** Nota de caja musical (plin): seno con un armónico alto que se apaga rápido. */
export function cajita(f: number, cuando = 0, vol = 0.08) {
  nota(f, 0.9, cuando, 'sine', vol);
  nota(f * 3, 0.25, cuando, 'sine', vol * 0.35);
  nota(f * 4.2, 0.12, cuando, 'sine', vol * 0.15);
}
/** Nota de piano (tecla con cuerpo y cola). */
export function piano(f: number, cuando = 0, vol = 0.1, dur = 0.9) {
  nota(f, dur, cuando, 'triangle', vol);
  nota(f * 2, dur * 0.5, cuando, 'sine', vol * 0.35);
  nota(f * 3, dur * 0.25, cuando, 'sine', vol * 0.12);
}
/** Nota de rocola (un órgano alegre). */
export function rocola(f: number, cuando = 0, dur = 0.35) {
  nota(f, dur, cuando, 'square', 0.035);
  nota(f * 2, dur, cuando, 'sine', 0.04);
  nota(f / 2, dur, cuando, 'triangle', 0.05);
}
/** Hongo que canta (burbujita con tono). */
export function hongo(f: number, cuando = 0) {
  nota(f, 0.4, cuando, 'sine', 0.1, f * 1.04);
  nota(f * 2, 0.15, cuando, 'triangle', 0.03);
}
/** Organillo del carrusel (una vueltica de melodía). */
export function organillo(cuando = 0) {
  [523, 659, 784, 659, 587, 698, 880, 698].forEach((f, i) => {
    nota(f, 0.22, cuando + i * 0.22, 'triangle', 0.04);
    nota(f * 2, 0.1, cuando + i * 0.22, 'sine', 0.02);
  });
}

// --- Aparatos ---------------------------------------------------------------
/** Pitido (radio, Morse, consolas). */
export const pitido = (dur = 0.12, f = 880, cuando = 0) => nota(f, dur, cuando, 'sine', 0.09);
/** Estática de radio (más fuerte con k alto). */
export const estatica = (k = 1, dur = 0.25) => rumor(dur, 2600, 0.02 + 0.06 * k, 0, 0.3);
/** Teléfono que timbra: rrring rrring. */
export function telefono(cuando = 0) {
  for (let r = 0; r < 2; r++)
    for (let i = 0; i < 14; i++) nota(i % 2 ? 1250 : 1500, 0.035, cuando + r * 0.8 + i * 0.035, 'triangle', 0.035);
}
/** Láser o disparo de feria. */
export const disparo = () => {
  nota(1400, 0.12, 0, 'square', 0.04, 300);
  rumor(0.06, 2000, 0.06, 0, 1);
};
/** Cohete que arranca (sube con la carga 0–1). */
export const motor = (k: number, dur = 0.2) => rumor(dur, 200 + k * 900, 0.04 + k * 0.05, 0, 0.8);
/** Torno, cadena o engranaje. */
export const cadena = () => {
  for (let i = 0; i < 3; i++) nota(900 + i * 70, 0.03, i * 0.05, 'square', 0.025);
};
/** Ronquido del dragón. */
export function ronquido(cuando = 0) {
  rumor(0.9, 140, 0.1, cuando, 3, 90);
  nota(70, 0.9, cuando, 'sawtooth', 0.025, 55);
}
/** Choque de metal (espada, armadura). */
export const metal = () => {
  nota(1900, 0.35, 0, 'triangle', 0.05);
  nota(2600, 0.25, 0, 'sine', 0.03);
  rumor(0.08, 5000, 0.05, 0, 2);
};
/** Martillo de fuerza que llega a la campana. */
export const campanaFeria = () => campanada(1175, 0, 0.12, 1.2);

// --- El desorden ------------------------------------------------------------
/** Algo que choca (más fuerte con k); lo frágil suena más agudo. */
export function golpe(k: number, fragil = false) {
  rumor(0.07 + k * 0.05, fragil ? 1600 : 260, 0.03 + k * 0.1, 0, fragil ? 2 : 1.4);
  if (fragil) nota(2200 + Math.random() * 800, 0.06, 0, 'sine', 0.02 + k * 0.03);
  else nota(120, 0.08, 0, 'sine', 0.03 + k * 0.08, 80);
}
/** Vidrio o cerámica que se rompe. */
export function romper() {
  rumor(0.35, 4200, 0.16, 0, 1.2, 2500);
  rumor(0.12, 900, 0.1, 0, 1.5);
  for (let i = 0; i < 6; i++) nota(2000 + Math.random() * 2400, 0.08 + Math.random() * 0.1, 0.02 + i * 0.035 + Math.random() * 0.03, 'triangle', 0.03);
}
/** Toquecito sobre algo. */
export const toc = (k = 1) => {
  rumor(0.04, 900, 0.05 * k, 0, 2);
  nota(600, 0.04, 0, 'triangle', 0.03 * k);
};
/** Levantar algo. */
export const levantar = () => nota(420, 0.08, 0, 'sine', 0.04, 620);
/** Papelito. */
export const papel = () => rumor(0.18, 3000, 0.05, 0, 0.7, 1800);
/** Apareció algo escondido. */
export const descubrir = () => {
  nota(1046, 0.08, 0, 'sine', 0.05);
  nota(1568, 0.14, 0.07, 'sine', 0.05);
};
/** Moneditas que se gastan en la tienda de dulces. */
export function monedas(n = 3) {
  for (let i = 0; i < n; i++) nota(1900 + (i % 2) * 400, 0.07, i * 0.07, 'square', 0.025);
}

// --- Ambiente de cada capítulo (bajito, cada tanto) --------------------------
/** Lo que se oye de fondo en cada escenario: pájaros en el jardín, tazas en el café, olas en la playa… */
export const AMBIENTE: Record<number, { cada: [number, number]; sonar: () => void }> = {
  2: { cada: [5, 9], sonar: () => pajaro() },
  3: { cada: [8, 13], sonar: () => nota(2600 + Math.random() * 500, 0.05, 0, 'sine', 0.02) },
  4: { cada: [12, 18], sonar: () => pito() },
  5: { cada: [6, 9], sonar: () => (Math.random() < 0.3 ? gaviota() : ola()) },
  6: { cada: [3, 6], sonar: () => grillo() },
};
/** Puertas donde el ambiente estorbaría (hay que oír y contar, o ya suena algo propio). */
export const SIN_AMBIENTE = new Set([37, 53]);
