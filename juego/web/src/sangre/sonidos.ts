// Los sonidos de Sangre y Ceniza, sintetizados (sin archivos) y con peso: golpes sordos, huesos que crujen, roca que
// cede, monedas, la campana de bronce, el rugido de los jefes. Y la música lúgubre: un bordón grave, un coro de
// órgano en menor que cambia despacio y tambores lejanos que se aceleran cuando la cosa se pone fea.
// Todo pasa por la salida general del juego (`src/sonido.ts`): respeta el silencio y la música apagada.
import * as fondo from '../segundo_plano';
import * as sonido from '../sonido';
import { S, type Sucesos } from './sim/estado';
import type { Sim } from './sim/sim';

let ruidoBuf: AudioBuffer | null = null;
const ultimo = new Map<string, number>();

function ctxSalida() {
  const c = sonido.contextoAudio();
  if (!c || sonido.silenciado()) return null;
  return c;
}

function ruido(ctx: AudioContext) {
  if (!ruidoBuf) {
    const n = ctx.sampleRate;
    ruidoBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }
  return ruidoBuf;
}

/** No repetir el mismo sonido más de una vez cada `ms` (con 300 enemigos todo pasa a la vez). */
function cupo(k: string, ms: number) {
  const t = performance.now();
  if ((ultimo.get(k) ?? 0) > t) return false;
  ultimo.set(k, t + ms);
  return true;
}

function golpeSordo(frec: number, dur: number, vol: number, ruidoF = 600, ruidoV = 0.5, cuando = 0) {
  const c = ctxSalida();
  if (!c) return;
  const { ctx, salida } = c;
  const t = ctx.currentTime + cuando;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(frec * 1.8, t);
  o.frequency.exponentialRampToValueAtTime(frec, t + dur * 0.4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(salida);
  o.start(t);
  o.stop(t + dur + 0.02);
  if (ruidoV > 0) {
    const s = ctx.createBufferSource();
    s.buffer = ruido(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = ruidoF;
    f.Q.value = 0.9;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(vol * ruidoV, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.7);
    s.connect(f).connect(g2).connect(salida);
    s.start(t, Math.random() * 0.5, dur);
  }
}

function campanada(frec = 196, vol = 0.12, dur = 3.2) {
  const c = ctxSalida();
  if (!c) return;
  const { ctx, salida } = c;
  const t = ctx.currentTime;
  // Parciales de campana de bronce (inarmónicos)
  for (const [r, v] of [[0.5, 0.6], [1, 1], [1.183, 0.5], [1.506, 0.45], [2, 0.35], [2.514, 0.25], [3.011, 0.15]] as const) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = frec * r;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (1.2 - r * 0.15));
    o.connect(g).connect(salida);
    o.start(t);
    o.stop(t + dur * 1.3);
  }
}

function coro(frecs: number[], dur: number, vol: number) {
  const c = ctxSalida();
  if (!c) return;
  const { ctx, salida } = c;
  const t = ctx.currentTime;
  for (const f of frecs) {
    for (const d of [-4, 4]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = d;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(400, t);
      lp.frequency.linearRampToValueAtTime(1800, t + dur * 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + dur * 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp).connect(g).connect(salida);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }
}

export const efectos = {
  golpe: (fuerte: boolean) => cupo('golpe', fuerte ? 50 : 70) && golpeSordo(fuerte ? 70 : 95, fuerte ? 0.16 : 0.1, fuerte ? 0.16 : 0.08, fuerte ? 500 : 900, 0.6),
  muerte: () => cupo('muerte', 55) && (sonido.rumor(0.12, 1400 + Math.random() * 600, 0.05, 0, 2.5, 600), golpeSordo(120, 0.08, 0.05, 1800, 0.3)),
  muerteElite: () => cupo('elite', 200) && (golpeSordo(55, 0.5, 0.22, 300, 0.8), sonido.rumor(0.5, 500, 0.08, 0.02, 0.6, 120)),
  excava: () => cupo('excava', 130) && sonido.rumor(0.13, 700 + Math.random() * 500, 0.05, 0, 1.2, 350),
  roto: () => cupo('roto', 90) && (golpeSordo(60, 0.25, 0.12, 400, 0.9), sonido.rumor(0.35, 1800, 0.04, 0.04, 0.8, 500)),
  alma: () => cupo('alma', 60) && sonido.nota(1046 + Math.random() * 200, 0.12, 0, 'sine', 0.025, 1568),
  oro: () => cupo('oro', 80) && (sonido.nota(2637, 0.06, 0, 'triangle', 0.04), sonido.nota(3520, 0.1, 0.05, 'triangle', 0.03)),
  hierro: () => cupo('hierro', 90) && (sonido.nota(1318, 0.15, 0, 'square', 0.02, 1100), golpeSordo(300, 0.06, 0.04, 3000, 0.4)),
  comida: () => cupo('comida', 150) && sonido.nota(523, 0.2, 0, 'sine', 0.05, 784),
  nivel: () => cupo('nivel', 400) && coro([146.8, 220, 293.7, 349.2], 1.4, 0.022),
  herido: () => cupo('herido', 160) && (golpeSordo(50, 0.22, 0.2, 260, 0.7), sonido.nota(180, 0.15, 0, 'sawtooth', 0.025, 90)),
  bloqueo: () => cupo('bloqueo', 120) && (sonido.nota(1760, 0.18, 0, 'triangle', 0.05, 1500), golpeSordo(200, 0.08, 0.08, 3000, 0.5)),
  caido: () => cupo('caido', 600) && coro([110, 130.8, 164.8], 2, 0.03),
  levanta: () => cupo('levanta', 600) && coro([146.8, 185, 220, 293.7], 1.2, 0.025),
  habilidad: () => cupo('habilidad', 150) && (sonido.rumor(0.45, 600, 0.1, 0, 0.7, 2400), golpeSordo(80, 0.3, 0.12, 400, 0.4)),
  explosion: () => cupo('explosion', 90) && (golpeSordo(42, 0.6, 0.24, 200, 1), sonido.rumor(0.7, 900, 0.07, 0.02, 0.5, 120)),
  disparoE: () => cupo('disparoE', 140) && sonido.rumor(0.12, 2400, 0.025, 0, 2, 1200),
  aparece: () => cupo('aparece', 300) && sonido.rumor(0.5, 300, 0.05, 0, 0.9, 120),
  aviso: () => cupo('aviso', 400) && (sonido.nota(220, 0.4, 0, 'sawtooth', 0.025, 196), sonido.nota(233, 0.4, 0, 'sawtooth', 0.02, 208)),
  evolucion: () => cupo('evolucion', 500) && (coro([196, 246.9, 293.7, 392], 2.2, 0.03), campanada(392, 0.05, 2)),
  sobrecarga: () => cupo('sobrecarga', 400) && (golpeSordo(90, 0.3, 0.12, 2500, 0.8), coro([220, 277.2, 329.6], 1.2, 0.02)),
  jefe: () => cupo('jefe', 1200) && (golpeSordo(32, 1.6, 0.3, 160, 1), sonido.nota(55, 1.6, 0, 'sawtooth', 0.06, 41)),
  campana: () => cupo('campana', 900) && campanada(164.8, 0.13, 3.6),
  ejecuta: () => cupo('ejecuta', 120) && (golpeSordo(70, 0.2, 0.14, 1200, 0.9), sonido.rumor(0.08, 3000, 0.05, 0, 1.5)),
  libera: () => cupo('libera', 400) && (sonido.nota(784, 0.2, 0, 'triangle', 0.04), sonido.nota(988, 0.3, 0.12, 'triangle', 0.04)),
  carta: () => sonido.rumor(0.18, 2600, 0.04, 0, 0.6, 1600),
  boton: () => golpeSordo(140, 0.06, 0.05, 2200, 0.4),
  compra: () => (sonido.nota(1975, 0.08, 0, 'triangle', 0.04), sonido.nota(2637, 0.14, 0.06, 'triangle', 0.035), golpeSordo(160, 0.08, 0.05, 2600, 0.4)),
  yunque: () => (sonido.nota(2093, 0.5, 0, 'triangle', 0.05, 2000), golpeSordo(120, 0.15, 0.14, 3200, 0.8)),
  derrota: () => coro([98, 116.5, 146.8], 3.5, 0.035),
  victoria: () => (coro([146.8, 220, 293.7, 370], 3, 0.03), campanada(293.7, 0.08, 3)),
};

/** Sonidos de los sucesos de un cuadro (solo los cercanos a quien juega en este aparato). */
export function sonarSucesos(suc: Sucesos, sim: Sim, local: number) {
  const d = suc.d;
  const yo = sim.J[local];
  const cerca = (x: number, y: number) => !yo || (x - yo.x) ** 2 + (y - yo.y) ** 2 < 15 * 15;
  for (let n = 0; n < suc.n; n++) {
    const k = n * 7;
    const tipo = d[k];
    switch (tipo) {
      case S.GOLPE:
        if (cerca(d[k + 1], d[k + 2])) efectos.golpe(d[k + 4] > 0);
        break;
      case S.MUERTE:
        if (!cerca(d[k + 1], d[k + 2])) break;
        if (d[k + 5] > 1.05) efectos.muerteElite();
        else efectos.muerte();
        break;
      case S.EXCAVA:
        if (cerca(d[k + 1], d[k + 2])) efectos.excava();
        break;
      case S.ROTO:
        if (cerca(d[k + 1], d[k + 2])) efectos.roto();
        break;
      case S.RECOGE:
        if (d[k + 1] !== local) break;
        if (d[k + 2] <= 2) efectos.alma();
        else if (d[k + 2] === 3) efectos.oro();
        else if (d[k + 2] === 4 || d[k + 2] === 5) efectos.hierro();
        else if (d[k + 2] === 6) efectos.comida();
        else efectos.oro();
        break;
      case S.NIVEL:
        if (d[k + 1] === local) efectos.nivel();
        break;
      case S.HERIDO:
        if (d[k + 1] === local) efectos.herido();
        break;
      case S.BLOQUEO:
        if (d[k + 1] === local) efectos.bloqueo();
        break;
      case S.CAIDO:
        efectos.caido();
        break;
      case S.LEVANTA:
        efectos.levanta();
        break;
      case S.HABILIDAD:
        efectos.habilidad();
        break;
      case S.EXPLOSION:
        if (cerca(d[k + 1], d[k + 2])) efectos.explosion();
        break;
      case S.DISPARO_E:
        if (cerca(d[k + 1], d[k + 2])) efectos.disparoE();
        break;
      case S.APARECE:
        if (d[k + 4] && cerca(d[k + 1], d[k + 2])) efectos.aparece();
        break;
      case S.EVOLUCION:
        if (d[k + 1] === local) efectos.evolucion();
        break;
      case S.SOBRECARGA:
        if (d[k + 1] === local) efectos.sobrecarga();
        break;
      case S.JEFE:
        if (d[k + 1] === 0 || d[k + 1] === 1 || d[k + 1] === 2) efectos.jefe();
        break;
      case S.CAMPANA:
        if (d[k + 1] === 0 || d[k + 1] === 1) efectos.campana();
        break;
      case S.EJECUTA:
        if (cerca(d[k + 1], d[k + 2])) efectos.ejecuta();
        break;
      case S.LIBERA:
        efectos.libera();
        break;
    }
  }
}

// ------------------------------------------------------------------------------------------------- Música
/** Acordes en re menor (i – VI – iv – V), de a 8 segundos. */
const ACORDES = [
  [73.4, 146.8, 174.6, 220],
  [58.3, 116.5, 146.8, 174.6],
  [49, 98, 116.5, 146.8],
  [55, 110, 138.6, 164.8],
];

class Musica {
  private nodos: { g: GainNode; o: OscillatorNode[] } | null = null;
  private reloj = 0;
  private paso = 0;
  private modo: 'menu' | 'juego' | null = null;
  /** 0 calma … 1 horda encima (tambores más seguidos). */
  tension = 0;

  iniciar(modo: 'menu' | 'juego') {
    this.modo = modo;
    this.armar();
  }

  private armar() {
    const c = sonido.contextoAudio();
    if (!c || this.reloj || !this.modo || fondo.enPausa()) return;
    const { ctx, salida } = c;
    // Bordón grave (siempre): dos sierras desafinadas por un filtro bajo que respira
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(this.volumen(), ctx.currentTime, 1.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    lp.Q.value = 2;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 90;
    lfo.connect(lfoG).connect(lp.frequency);
    const os: OscillatorNode[] = [lfo];
    for (const [f, det] of [[36.7, -6], [36.7, 7], [55, 0]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      const og = ctx.createGain();
      og.gain.value = f === 55 ? 0.25 : 0.5;
      o.connect(og).connect(lp);
      os.push(o);
    }
    lp.connect(g).connect(salida);
    for (const o of os) o.start();
    this.nodos = { g, o: os };
    this.paso = 0;
    this.tic();
    this.reloj = window.setInterval(() => this.tic(), 2000);
  }

  private volumen() {
    if (sonido.musica.apagada()) return 0;
    return this.modo === 'menu' ? 0.05 : 0.04;
  }

  /** Cada 2 s: acorde nuevo cada 8 s, tambor según la tensión, alguna campanada lejana. */
  private tic() {
    const c = sonido.contextoAudio();
    if (!c || sonido.musica.apagada() || sonido.silenciado()) {
      this.paso++;
      return;
    }
    const { ctx } = c;
    if (this.nodos) this.nodos.g.gain.setTargetAtTime(this.volumen(), ctx.currentTime, 0.6);
    if (this.paso % 4 === 0) coroLargo(ACORDES[(this.paso / 4) % 4], this.modo === 'menu' ? 0.012 : 0.009);
    if (this.modo === 'juego') {
      const golpes = this.tension > 0.66 ? 4 : this.tension > 0.33 ? 2 : this.paso % 2 ? 1 : 0;
      for (let k = 0; k < golpes; k++) tambor(k * (2 / golpes), 0.05 + this.tension * 0.06);
    } else if (this.paso % 6 === 3) campanadaLejana();
    this.paso++;
  }

  parar() {
    const c = sonido.contextoAudio();
    clearInterval(this.reloj);
    this.reloj = 0;
    if (this.nodos && c) {
      const n = this.nodos;
      n.g.gain.setTargetAtTime(0, c.ctx.currentTime, 0.4);
      setTimeout(() => n.o.forEach((o) => o.stop()), 2000);
    }
    this.nodos = null;
  }

  cambiar(modo: 'menu' | 'juego') {
    if (this.modo === modo && this.reloj) return;
    this.parar();
    this.iniciar(modo);
  }

  /** Después del primer toque (el navegador no deja sonar antes). */
  despertar() {
    this.armar();
  }
}

function coroLargo(frecs: number[], vol: number) {
  const c = sonido.contextoAudio();
  if (!c) return;
  const { ctx, salida } = c;
  const t = ctx.currentTime;
  const dur = 8.4;
  for (const f of frecs) {
    for (const d of [-7, 6]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f * 2;
      o.detune.value = d;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 2.5);
      g.gain.setValueAtTime(vol, t + dur - 2.5);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(lp).connect(g).connect(salida);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }
}

function tambor(cuando: number, vol: number) {
  golpeSordo(48, 0.5, vol, 140, 0.5, cuando);
}

function campanadaLejana() {
  const c = sonido.contextoAudio();
  if (!c) return;
  const { ctx, salida } = c;
  const t = ctx.currentTime;
  for (const [r, v] of [[1, 1], [2.01, 0.4], [2.76, 0.25]] as const) {
    const o = ctx.createOscillator();
    o.frequency.value = 110 * r;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.02 * v, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    o.connect(g).connect(salida);
    o.start(t);
    o.stop(t + 5.1);
  }
}

export const musica = new Musica();
fondo.alPausar(() => musica.parar());
fondo.alReanudar(() => musica.despertar());
