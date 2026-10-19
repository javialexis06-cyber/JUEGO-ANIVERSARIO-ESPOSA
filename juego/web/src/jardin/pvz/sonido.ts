// Sonido de Plantas contra Zombis: efectos y música sintetizados con WebAudio (sin archivos ni audio del juego
// original). Todo es opcional: si el navegador no deja crear audio, el juego sigue en silencio.

export type Efecto =
  | 'siembra' | 'disparo' | 'impacto' | 'metal' | 'mordida' | 'sol' | 'moneda' | 'explosion' | 'cortacesped'
  | 'sirena' | 'ultima' | 'cabeza' | 'pala' | 'abono' | 'recogeAbono' | 'traga' | 'arma' | 'boton' | 'error'
  | 'gana' | 'pierde' | 'plantaNueva' | 'rebote' | 'congela' | 'listos' | 'plantar' | 'dave' | 'sobre';

/** Ánimo de la música por mundo. */
export type Musica = 'titulo' | 'dia' | 'noche' | 'piscina' | 'niebla' | 'tejado' | 'mapa' | 'jefe' | 'seleccion' | null;

interface Tema {
  /** Pulsos por minuto. */
  bpm: number;
  /** Escala (semitonos sobre la raíz) y raíz en Hz. */
  escala: number[];
  raiz: number;
  /** Acordes (grados de la escala) por compás. */
  acordes: number[];
  /** Instrumento de la melodía. */
  timbre: OscillatorType;
  volumen: number;
}

const MAYOR = [0, 2, 4, 5, 7, 9, 11];
const MENOR = [0, 2, 3, 5, 7, 8, 10];
const TEMAS: Record<Exclude<Musica, null>, Tema> = {
  titulo: { bpm: 96, escala: MAYOR, raiz: 196, acordes: [0, 5, 3, 4], timbre: 'triangle', volumen: 0.05 },
  mapa: { bpm: 104, escala: MAYOR, raiz: 220, acordes: [0, 3, 4, 0], timbre: 'triangle', volumen: 0.045 },
  seleccion: { bpm: 112, escala: MAYOR, raiz: 207.65, acordes: [0, 4, 5, 3], timbre: 'square', volumen: 0.03 },
  dia: { bpm: 118, escala: MAYOR, raiz: 261.63, acordes: [0, 5, 3, 4], timbre: 'square', volumen: 0.032 },
  noche: { bpm: 100, escala: MENOR, raiz: 220, acordes: [0, 5, 3, 4], timbre: 'triangle', volumen: 0.045 },
  piscina: { bpm: 126, escala: MAYOR, raiz: 293.66, acordes: [0, 3, 4, 3], timbre: 'square', volumen: 0.03 },
  niebla: { bpm: 92, escala: MENOR, raiz: 196, acordes: [0, 6, 5, 4], timbre: 'sine', volumen: 0.05 },
  tejado: { bpm: 122, escala: MAYOR, raiz: 246.94, acordes: [0, 4, 5, 3], timbre: 'square', volumen: 0.03 },
  jefe: { bpm: 140, escala: MENOR, raiz: 164.81, acordes: [0, 0, 5, 4], timbre: 'sawtooth', volumen: 0.025 },
};

class SonidoPvZ {
  private ctx: AudioContext | null = null;
  private maestro: GainNode | null = null;
  private bus: GainNode | null = null;
  private ruidoBuf: AudioBuffer | null = null;
  efectos = true;
  musica = true;
  private tema: Musica = null;
  private reloj: number | null = null;
  private siguiente = 0;
  private paso = 0;
  /** Límite de disparos por instante para que veinte tiradores no saturen. */
  private ultimos = new Map<string, number>();

  private asegurar(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      this.ctx = new C();
      this.maestro = this.ctx.createGain();
      this.maestro.gain.value = 0.9;
      this.maestro.connect(this.ctx.destination);
      this.bus = this.ctx.createGain();
      this.bus.gain.value = 1;
      this.bus.connect(this.maestro);
      const n = this.ctx.sampleRate;
      this.ruidoBuf = this.ctx.createBuffer(1, n, n);
      const d = this.ruidoBuf.getChannelData(0);
      let x = 12345;
      for (let i = 0; i < n; i++) {
        x = (x * 1103515245 + 12345) & 0x7fffffff;
        d[i] = (x / 0x7fffffff) * 2 - 1;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Hay que llamarla con un toque del jugador (los navegadores bloquean el audio antes). */
  desbloquear(): void {
    const c = this.asegurar();
    if (c && c.state === 'suspended') void c.resume().catch(() => undefined);
  }

  suspender(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend().catch(() => undefined);
  }

  reanudar(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
  }

  private tono(f: number, dur: number, op: { tipo?: OscillatorType; vol?: number; hasta?: number; ataque?: number; inicio?: number; destino?: AudioNode } = {}): void {
    const c = this.ctx;
    if (!c || !this.bus) return;
    const t0 = c.currentTime + (op.inicio ?? 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = op.tipo ?? 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (op.hasta) o.frequency.exponentialRampToValueAtTime(Math.max(20, op.hasta), t0 + dur);
    const v = op.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (op.ataque ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(op.destino ?? this.bus);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  private ruido(dur: number, op: { filtro?: number; tipoFiltro?: BiquadFilterType; vol?: number; hasta?: number; inicio?: number; q?: number } = {}): void {
    const c = this.ctx;
    if (!c || !this.bus || !this.ruidoBuf) return;
    const t0 = c.currentTime + (op.inicio ?? 0);
    const s = c.createBufferSource();
    s.buffer = this.ruidoBuf;
    const f = c.createBiquadFilter();
    f.type = op.tipoFiltro ?? 'lowpass';
    f.frequency.setValueAtTime(op.filtro ?? 1200, t0);
    if (op.hasta) f.frequency.exponentialRampToValueAtTime(Math.max(30, op.hasta), t0 + dur);
    f.Q.value = op.q ?? 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(op.vol ?? 0.3, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.bus);
    s.start(t0, Math.random() * 0.5);
    s.stop(t0 + dur + 0.02);
  }

  efecto(e: Efecto): void {
    if (!this.efectos) return;
    const c = this.asegurar();
    if (!c || c.state !== 'running') return;
    // Los efectos muy repetidos (disparos, impactos, mordidas) se limitan para no saturar.
    const limite = e === 'disparo' ? 0.045 : e === 'impacto' || e === 'metal' ? 0.04 : e === 'mordida' ? 0.12 : 0;
    if (limite) {
      const ult = this.ultimos.get(e) ?? 0;
      if (c.currentTime - ult < limite) return;
      this.ultimos.set(e, c.currentTime);
    }
    switch (e) {
      case 'siembra':
        this.ruido(0.16, { filtro: 500, hasta: 120, vol: 0.45 });
        this.tono(150, 0.14, { tipo: 'sine', vol: 0.35, hasta: 70 });
        break;
      case 'disparo':
        this.tono(520, 0.07, { tipo: 'sine', vol: 0.14, hasta: 900 });
        this.ruido(0.04, { filtro: 3000, tipoFiltro: 'bandpass', vol: 0.06 });
        break;
      case 'impacto':
        this.ruido(0.08, { filtro: 1400, hasta: 300, vol: 0.22 });
        this.tono(240, 0.06, { tipo: 'triangle', vol: 0.08, hasta: 120 });
        break;
      case 'metal':
        this.tono(1250, 0.18, { tipo: 'square', vol: 0.06, hasta: 1100 });
        this.tono(1870, 0.14, { tipo: 'sine', vol: 0.06 });
        break;
      case 'mordida':
        this.ruido(0.09, { filtro: 900, tipoFiltro: 'bandpass', vol: 0.3, q: 2 });
        this.tono(110, 0.08, { tipo: 'square', vol: 0.05, hasta: 70 });
        break;
      case 'sol':
        this.tono(880, 0.12, { tipo: 'triangle', vol: 0.16 });
        this.tono(1320, 0.18, { tipo: 'triangle', vol: 0.14, inicio: 0.07 });
        break;
      case 'moneda':
        this.tono(1568, 0.08, { tipo: 'square', vol: 0.06 });
        this.tono(2093, 0.22, { tipo: 'square', vol: 0.06, inicio: 0.07 });
        break;
      case 'explosion':
        this.ruido(1.1, { filtro: 1800, hasta: 60, vol: 0.9 });
        this.tono(90, 0.7, { tipo: 'sine', vol: 0.6, hasta: 30 });
        break;
      case 'cortacesped':
        this.tono(70, 1.6, { tipo: 'sawtooth', vol: 0.12, hasta: 110 });
        this.ruido(1.6, { filtro: 400, vol: 0.12 });
        break;
      case 'sirena':
        for (let i = 0; i < 3; i++) {
          this.tono(440, 0.5, { tipo: 'sawtooth', vol: 0.07, hasta: 660, inicio: i * 0.55 });
        }
        break;
      case 'ultima':
        this.tono(330, 0.4, { tipo: 'sawtooth', vol: 0.08 });
        this.tono(247, 0.9, { tipo: 'sawtooth', vol: 0.08, inicio: 0.35 });
        break;
      case 'cabeza':
        this.ruido(0.12, { filtro: 600, hasta: 150, vol: 0.25 });
        break;
      case 'pala':
        this.ruido(0.22, { filtro: 2400, hasta: 400, vol: 0.25 });
        break;
      case 'abono':
        for (let i = 0; i < 5; i++) this.tono(523 * Math.pow(1.26, i), 0.18, { tipo: 'triangle', vol: 0.09, inicio: i * 0.05 });
        break;
      case 'recogeAbono':
        this.tono(660, 0.1, { tipo: 'sine', vol: 0.12 });
        this.tono(990, 0.16, { tipo: 'sine', vol: 0.12, inicio: 0.06 });
        break;
      case 'traga':
        this.ruido(0.3, { filtro: 500, tipoFiltro: 'bandpass', vol: 0.35, q: 3, hasta: 200 });
        this.tono(180, 0.25, { tipo: 'square', vol: 0.06, hasta: 60 });
        break;
      case 'arma':
        this.tono(1200, 0.06, { tipo: 'square', vol: 0.05 });
        this.tono(1200, 0.06, { tipo: 'square', vol: 0.05, inicio: 0.12 });
        break;
      case 'boton':
        this.tono(700, 0.05, { tipo: 'triangle', vol: 0.1 });
        break;
      case 'error':
        this.tono(180, 0.15, { tipo: 'square', vol: 0.06 });
        break;
      case 'rebote':
        this.tono(300, 0.08, { tipo: 'sine', vol: 0.2, hasta: 500 });
        this.ruido(0.06, { filtro: 900, vol: 0.15 });
        break;
      case 'congela':
        this.tono(2200, 0.4, { tipo: 'sine', vol: 0.06, hasta: 3200 });
        break;
      case 'listos':
        this.tono(392, 0.25, { tipo: 'square', vol: 0.06 });
        break;
      case 'plantar':
        this.tono(523, 0.15, { tipo: 'square', vol: 0.07 });
        this.tono(784, 0.35, { tipo: 'square', vol: 0.07, inicio: 0.12 });
        break;
      case 'gana':
        [523, 659, 784, 1047].forEach((f, i) => this.tono(f, 0.35, { tipo: 'triangle', vol: 0.12, inicio: i * 0.12 }));
        break;
      case 'plantaNueva':
        [784, 988, 1175, 1568].forEach((f, i) => this.tono(f, 0.4, { tipo: 'triangle', vol: 0.1, inicio: i * 0.09 }));
        break;
      case 'pierde':
        [392, 370, 349, 262].forEach((f, i) => this.tono(f, 0.5, { tipo: 'sawtooth', vol: 0.07, inicio: i * 0.35 }));
        break;
      case 'dave':
        // Balbuceo de Dave: tres sílabas rápidas a tono aleatorio.
        for (let i = 0; i < 3; i++) this.tono(160 + Math.random() * 120, 0.08, { tipo: 'sawtooth', vol: 0.04, inicio: i * 0.09, hasta: 140 + Math.random() * 160 });
        break;
      case 'sobre':
        this.tono(1000, 0.04, { tipo: 'triangle', vol: 0.08 });
        break;
    }
  }

  // --------------------------------------------------------------------------------------------------------------
  // Música: un ciclo de cuatro compases (bajo, acordes punteados y una melodía con semilla fija por tema).

  ponerMusica(m: Musica): void {
    if (m === this.tema) return;
    this.tema = m;
    if (this.reloj !== null) {
      clearInterval(this.reloj);
      this.reloj = null;
    }
    if (!m || !this.musica) return;
    const c = this.asegurar();
    if (!c) return;
    this.siguiente = c.currentTime + 0.1;
    this.paso = 0;
    this.reloj = window.setInterval(() => this.programar(), 100);
  }

  private programar(): void {
    const c = this.ctx;
    if (!c || !this.tema || c.state !== 'running') return;
    const tema = TEMAS[this.tema];
    const negra = 60 / tema.bpm;
    const corchea = negra / 2;
    while (this.siguiente < c.currentTime + 0.25) {
      const p = this.paso;
      const compas = Math.floor(p / 8) % tema.acordes.length;
      const grado = tema.acordes[compas];
      const nota = (g: number, oct = 0) => tema.raiz * Math.pow(2, (tema.escala[((g % 7) + 7) % 7] + 12 * (oct + Math.floor(g / 7))) / 12);
      const inicio = this.siguiente - c.currentTime;
      if (p % 4 === 0) this.tono(nota(grado, -2), negra * 0.9, { tipo: 'triangle', vol: tema.volumen * 1.6, inicio });
      if (p % 2 === 1) for (const k of [0, 2, 4]) this.tono(nota(grado + k, -1), corchea * 0.6, { tipo: 'sine', vol: tema.volumen * 0.5, inicio });
      // Melodía: patrón determinista por compás.
      const h = (p * 7 + compas * 13 + tema.bpm) % 11;
      if (h < 6) this.tono(nota(grado + [0, 2, 4, 2, 5, 4][h]), corchea * 0.85, { tipo: tema.timbre, vol: tema.volumen, inicio });
      this.siguiente += corchea;
      this.paso = (p + 1) % (8 * tema.acordes.length * 2);
    }
  }

  alternarMusica(si: boolean): void {
    this.musica = si;
    const t = this.tema;
    this.tema = null;
    if (this.reloj !== null) {
      clearInterval(this.reloj);
      this.reloj = null;
    }
    if (si) this.ponerMusica(t);
    else this.tema = t;
  }

  cerrar(): void {
    if (this.reloj !== null) clearInterval(this.reloj);
    this.reloj = null;
    this.tema = null;
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}

export const sonido = new SonidoPvZ();
