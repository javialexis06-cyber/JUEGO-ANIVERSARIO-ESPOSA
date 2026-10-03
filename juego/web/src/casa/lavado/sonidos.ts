// Sonidos de «Lavarse la cara» (sintetizados, con más cuerpo que los cortitos de antes) y su música: una canción
// de bañera alegre y suave (ukelele, marimba, bajo redondo y un shaker de burbujas) que se anima con los minutos y
// se pone seria cuando llega un jefe. Nada suena encima de nada: cada efecto tiene su límite por segundo.
import { contextoAudio, musica as musicaCasa, nota, rumor, silenciado } from '../../sonido';
import type { Efecto } from './tipos';

const ultimo = new Map<string, number>();
/** No más de un sonido de cada tipo cada `ms` milisegundos. */
function limite(clave: string, ms: number) {
  const ahora = performance.now();
  if ((ultimo.get(clave) ?? 0) + ms > ahora) return false;
  ultimo.set(clave, ahora);
  return true;
}

let rachaGemas = 0;
let tRacha = 0;

export const sfx = {
  burbuja: () => limite('burbuja', 70) && nota(700 + Math.random() * 300, 0.09, 0, 'sine', 0.035, 1500 + Math.random() * 400),
  latigo: () => {
    if (!limite('latigo', 90)) return;
    rumor(0.16, 2400, 0.05, 0, 0.9, 700);
    nota(180, 0.07, 0.09, 'triangle', 0.04, 110);
  },
  tiro: () => limite('tiro', 60) && nota(1300 + Math.random() * 200, 0.04, 0, 'triangle', 0.014, 2000),
  golpe: () => limite('golpe', 45) && nota(420 + Math.random() * 160, 0.05, 0, 'square', 0.012, 260),
  muere: () => {
    if (!limite('muere', 55)) return;
    nota(500 + Math.random() * 500, 0.08, 0, 'sine', 0.04, 160);
    rumor(0.06, 1800, 0.02, 0, 1.2);
  },
  gema: () => {
    if (!limite('gema', 40)) return;
    const ahora = performance.now();
    rachaGemas = ahora - tRacha < 400 ? Math.min(16, rachaGemas + 1) : 0;
    tRacha = ahora;
    nota(1180 * Math.pow(1.06, rachaGemas), 0.07, 0, 'sine', 0.03, 1900 * Math.pow(1.06, rachaGemas));
  },
  moneda: () => {
    if (!limite('moneda', 60)) return;
    nota(1568, 0.06, 0, 'square', 0.025);
    nota(2093, 0.14, 0.05, 'triangle', 0.035);
  },
  nivel: () => [523, 659, 784, 1046, 1318].forEach((f, i) => nota(f, 0.22, i * 0.07, 'triangle', 0.06)),
  herido: () => {
    if (!limite('herido', 150)) return;
    nota(160, 0.18, 0, 'sawtooth', 0.04, 90);
    rumor(0.12, 400, 0.05, 0, 0.8);
  },
  rayo: () => {
    if (!limite('rayo', 80)) return;
    rumor(0.22, 3000, 0.07, 0, 0.6, 600);
    nota(90, 0.25, 0, 'sawtooth', 0.04, 50);
  },
  explosion: () => {
    if (!limite('explosion', 90)) return;
    rumor(0.35, 900, 0.08, 0, 0.7, 200);
    nota(120, 0.2, 0, 'sine', 0.06, 50);
  },
  charco: () => limite('charco', 120) && rumor(0.25, 1400, 0.05, 0, 1.4, 500),
  ducha: () => limite('ducha', 250) && rumor(0.6, 4000, 0.04, 0, 0.5, 2500),
  limpiar: () => {
    rumor(1.2, 600, 0.12, 0, 0.6, 2400);
    [784, 988, 1175, 1568].forEach((f, i) => nota(f, 0.3, 0.2 + i * 0.06, 'sine', 0.04));
  },
  congela: () => [2093, 2637, 3136, 2637].forEach((f, i) => nota(f, 0.35, i * 0.06, 'sine', 0.03)),
  jefe: () => {
    rumor(1.6, 160, 0.14, 0, 0.6, 70);
    [196, 185, 175].forEach((f, i) => nota(f, 0.45, i * 0.35, 'sawtooth', 0.05, f * 0.98));
  },
  romper: () => {
    if (!limite('romper', 80)) return;
    [2600, 3300, 2900].forEach((f, i) => nota(f, 0.08, i * 0.03, 'triangle', 0.025));
  },
  arepa: () => {
    nota(300, 0.06, 0, 'square', 0.03, 180);
    nota(260, 0.06, 0.12, 'square', 0.03, 160);
    [659, 880].forEach((f, i) => nota(f, 0.15, 0.25 + i * 0.07, 'sine', 0.04));
  },
  revive: () => [392, 523, 659, 784, 1046, 1318].forEach((f, i) => nota(f, 0.4, i * 0.09, 'sine', 0.05)),
  cae: () => [523, 440, 349, 262].forEach((f, i) => nota(f, 0.3, i * 0.14, 'triangle', 0.05)),
  evolucion: () => {
    rumor(1.4, 3000, 0.05, 0, 0.5, 6000);
    [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => nota(f, 0.5, i * 0.08, 'triangle', 0.05));
  },
  cofreAbre: () => {
    rumor(0.4, 700, 0.06, 0, 0.8, 1600);
    [523, 659, 784, 1046].forEach((f, i) => nota(f, 0.3, 0.2 + i * 0.1, 'triangle', 0.06));
  },
  ruleta: () => nota(1200 + Math.random() * 600, 0.03, 0, 'square', 0.015),
  premio: () => [1046, 1318, 1568].forEach((f, i) => nota(f, 0.2, i * 0.05, 'triangle', 0.05)),
  carta: () => [659, 784, 988, 1318].forEach((f, i) => nota(f, 0.5, i * 0.12, 'sine', 0.05)),
  toque: () => nota(880, 0.06, 0, 'triangle', 0.04),
  aji: () => rumor(0.4, 900, 0.07, 0, 0.6, 300),
  fin: (gano: boolean) =>
    gano ? [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => nota(f, 0.3, i * 0.13, 'triangle', 0.06))
      : [523, 466, 415, 392].forEach((f, i) => nota(f, 0.4, i * 0.22, 'triangle', 0.06)),
};

/** Sonidos según lo que pasó en el motor (el jugador de este celular suena más). */
export function sonarEfecto(e: Efecto, yo: number) {
  switch (e.tipo) {
    case 'golpe':
      sfx.golpe();
      break;
    case 'muere':
      sfx.muere();
      break;
    case 'latigo':
      sfx.latigo();
      break;
    case 'gema':
      if (e.d === yo) sfx.gema();
      break;
    case 'moneda':
      if (e.d === yo) sfx.moneda();
      break;
    case 'nivel':
      sfx.nivel();
      break;
    case 'herido':
      if (e.c === yo) sfx.herido();
      break;
    case 'rayo':
      sfx.rayo();
      break;
    case 'explosion':
      sfx.explosion();
      break;
    case 'charco':
      sfx.charco();
      break;
    case 'columna':
      sfx.ducha();
      break;
    case 'limpiar':
      sfx.limpiar();
      break;
    case 'congela':
      sfx.congela();
      break;
    case 'jefe':
      sfx.jefe();
      break;
    case 'romper':
      sfx.romper();
      break;
    case 'curar':
      if (e.c >= 20) sfx.arepa();
      break;
    case 'revive':
    case 'levanta':
      sfx.revive();
      break;
    case 'cae':
      sfx.cae();
      break;
    case 'evolucion':
      sfx.evolucion();
      break;
    case 'fuego':
      sfx.aji();
      break;
  }
}

// ---------------------------------------------------------------------------------------------------- Música
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// Re mayor alegre: D · Bm · G · A (y un puente)
const ACORDES: { bajo: number; voces: number[] }[] = [
  { bajo: 38, voces: [62, 66, 69] }, { bajo: 35, voces: [59, 62, 66] }, { bajo: 43, voces: [59, 62, 67] }, { bajo: 45, voces: [61, 64, 69] },
  { bajo: 38, voces: [62, 66, 69] }, { bajo: 42, voces: [61, 66, 69] }, { bajo: 43, voces: [62, 67, 71] }, { bajo: 45, voces: [61, 64, 67] },
];
const ACORDES_JEFE: { bajo: number; voces: number[] }[] = [
  { bajo: 35, voces: [59, 62, 66] }, { bajo: 43, voces: [59, 62, 67] }, { bajo: 40, voces: [59, 64, 67] }, { bajo: 42, voces: [61, 66, 70] },
];
// Melodía de marimba: [corchea del ciclo de 64, nota, duración en corcheas]
const MELODIA: [number, number, number][] = [
  [0, 74, 2], [2, 76, 1], [3, 78, 2], [6, 81, 2], [8, 78, 3], [12, 76, 2], [14, 74, 2],
  [16, 71, 2], [18, 74, 2], [20, 78, 3], [24, 79, 2], [26, 78, 1], [27, 76, 2], [30, 74, 2],
  [32, 74, 2], [34, 76, 1], [35, 78, 2], [38, 81, 2], [40, 83, 3], [44, 81, 2], [46, 78, 2],
  [48, 79, 2], [50, 78, 2], [52, 76, 2], [54, 73, 2], [56, 74, 6],
];
const MEL = new Map<number, [number, number]>(MELODIA.map(([k, n, d]) => [k, [n, d]]));

class Musica {
  private reloj = 0;
  private paso = 0;
  private proximo = 0;
  private gan: GainNode | null = null;
  private bpm = 112;
  /** 0 tranquila … 3 a todo dar (sube con los minutos). */
  intensidad = 0;
  jefe = false;
  private apagada = false;

  iniciar() {
    const a = contextoAudio();
    if (!a || this.reloj) return;
    musicaCasa.callar(true);
    this.apagada = musicaCasa.apagada();
    const { ctx, salida } = a;
    this.gan = ctx.createGain();
    this.gan.gain.value = 0;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 5600;
    this.gan.connect(filtro).connect(salida);
    this.gan.gain.setTargetAtTime(this.apagada ? 0 : 0.5, ctx.currentTime, 0.8);
    this.proximo = ctx.currentTime + 0.15;
    this.reloj = window.setInterval(() => this.programar(), 40);
  }

  /** La música de la casa se respeta: si la tienen apagada, aquí tampoco suena. */
  alternar() {
    this.apagada = !this.apagada;
    const a = contextoAudio();
    if (a && this.gan) this.gan.gain.setTargetAtTime(this.apagada ? 0 : 0.5, a.ctx.currentTime, 0.2);
    return this.apagada;
  }

  get muda() {
    return this.apagada;
  }

  pausar(si: boolean) {
    const a = contextoAudio();
    if (a && this.gan) this.gan.gain.setTargetAtTime(si || this.apagada ? 0 : 0.5, a.ctx.currentTime, 0.25);
  }

  detener() {
    clearInterval(this.reloj);
    this.reloj = 0;
    const a = contextoAudio();
    if (a && this.gan) {
      const g = this.gan;
      g.gain.setTargetAtTime(0, a.ctx.currentTime, 0.3);
      setTimeout(() => g.disconnect(), 1500);
    }
    this.gan = null;
    musicaCasa.callar(false);
  }

  private voz(f: number, t: number, dur: number, tipo: OscillatorType, vol: number, ataque = 0.01) {
    const a = contextoAudio();
    if (!a || !this.gan) return;
    const o = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.gan);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private ruido(t: number, dur: number, frec: number, vol: number) {
    const a = contextoAudio();
    if (!a || !this.gan) return;
    const n = Math.max(1, Math.floor(a.ctx.sampleRate * dur));
    const b = a.ctx.createBuffer(1, n, a.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = a.ctx.createBufferSource();
    src.buffer = b;
    const f = a.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = frec;
    f.Q.value = 1.4;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.gan);
    src.start(t);
  }

  private programar() {
    const a = contextoAudio();
    if (!a || !this.gan || silenciado()) return;
    const ctx = a.ctx;
    const bpm = this.jefe ? 124 : this.bpm + this.intensidad * 4;
    const corchea = 60 / bpm / 2;
    if (this.proximo < ctx.currentTime - 0.3) this.proximo = ctx.currentTime + 0.05;
    while (this.proximo < ctx.currentTime + 0.25) {
      if (!this.apagada) this.tocar(this.paso, this.proximo, corchea);
      this.proximo += corchea;
      this.paso = (this.paso + 1) % 64;
    }
  }

  private tocar(paso: number, t: number, corchea: number) {
    const k = paso % 8;
    const compas = Math.floor(paso / 8);
    const lista = this.jefe ? ACORDES_JEFE : ACORDES;
    const ac = lista[compas % lista.length];
    // Bajo redondo (raíz y quinta)
    if (k === 0) this.voz(midi(ac.bajo), t, corchea * 2.4, 'triangle', 0.12, 0.01);
    if (k === 3 || k === 6) this.voz(midi(ac.bajo + 7), t, corchea * 1.2, 'triangle', 0.07, 0.01);
    // Ukelele rasgueado (los acordes en los contratiempos)
    if (k % 2 === 1 || (this.intensidad >= 2 && k === 4)) {
      ac.voces.forEach((n, i) => this.voz(midi(n + 12), t + i * 0.012, corchea * 0.9, 'triangle', 0.018, 0.004));
    }
    // Marimba con la melodía (en el jefe, solo cada tanto)
    const m = MEL.get(paso);
    if (m && (!this.jefe || paso % 16 === 0)) {
      this.voz(midi(m[0] - (this.jefe ? 3 : 0)), t, Math.min(0.6, corchea * m[1] * 1.1), 'sine', 0.06, 0.003);
      this.voz(midi(m[0] + 12), t, 0.09, 'sine', 0.012, 0.002);
    }
    // Shaker de burbujas y «plops»
    this.ruido(t, 0.04, 7500, k % 2 ? 0.035 : 0.018);
    if (this.intensidad >= 1 && (k === 2 || k === 6)) this.voz(900 + (paso % 5) * 120, t, 0.06, 'sine', 0.018, 0.002);
    if (k === 0 || (this.intensidad >= 2 && k === 4) || this.jefe) {
      // Bombo suave
      const ctx = contextoAudio()!.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(this.jefe ? 0.2 : 0.14, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(this.gan!);
      o.start(t);
      o.stop(t + 0.25);
    }
    if (this.intensidad >= 3 && k === 4) this.ruido(t, 0.12, 2400, 0.03);
  }
}

export const musicaLavado = new Musica();
