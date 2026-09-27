// Sensores del celular para los acertijos: inclinar, sacudir, boca abajo, voltear, apagar la pantalla, quieto,
// soplar (micrófono) y vibrar. Todo se puede simular (teclado y window.__puertas) para probar sin celular.
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

type Evento = 'sacudida' | 'volteo' | 'pantalla' | 'soplido';
type Oyente = (dato: number) => void;

const G = 9.81;

export class Sensores {
  /** Gravedad vista en la pantalla (en g): x hacia la derecha, y hacia abajo. Suavizada. */
  inclinacion = { x: 0, y: 1 };
  /** Componente de la gravedad hacia la espalda del celular: -1 boca arriba sobre la mesa, +1 boca abajo. */
  profundidad = 0;
  /** Hubo lecturas reales del acelerómetro (si no, las mecánicas usan su alternativa táctil). */
  hayMovimiento = false;
  /** Volumen del micrófono (0..1) mientras está encendido. */
  volumen = 0;
  microfono: 'apagado' | 'pidiendo' | 'encendido' | 'negado' = 'apagado';

  private oyentes = new Map<Evento, Set<Oyente>>();
  private picos: number[] = [];
  private ultimoMovimiento = performance.now();
  private ocultoDesde = 0;
  private angulo = 0;
  private signo = 1;
  private invertidoDesde = 0;
  private simulada: { x: number; y: number; z: number } | null = null;
  private audio: { ctx: AudioContext; an: AnalyserNode; datos: Float32Array; stream: MediaStream } | null = null;
  private soplandoDesde = 0;

  constructor() {
    this.angulo = anguloPantalla();
    window.addEventListener('devicemotion', (e) => this.movimiento(e));
    const cambio = () => {
      const a = anguloPantalla();
      const d = Math.abs(((a - this.angulo + 540) % 360) - 180);
      this.angulo = a;
      if (d < 45) this.emitir('volteo', 180);
    };
    screen.orientation?.addEventListener?.('change', cambio);
    window.addEventListener('orientationchange', () => setTimeout(cambio, 50));
    document.addEventListener('visibilitychange', () => (document.hidden ? this.apagar() : this.prender()));
    if (Capacitor.isNativePlatform()) {
      void App.addListener('appStateChange', ({ isActive }) => (isActive ? this.prender() : this.apagar()));
    }
  }

  on(e: Evento, fn: Oyente) {
    let s = this.oyentes.get(e);
    if (!s) this.oyentes.set(e, (s = new Set()));
    s.add(fn);
    return () => s!.delete(fn);
  }

  private emitir(e: Evento, dato = 0) {
    for (const fn of [...(this.oyentes.get(e) ?? [])]) fn(dato);
  }

  private apagar() {
    if (!this.ocultoDesde) this.ocultoDesde = performance.now();
  }

  private prender() {
    if (!this.ocultoDesde) return;
    const ms = performance.now() - this.ocultoDesde;
    this.ocultoDesde = 0;
    if (ms > 250) this.emitir('pantalla', ms);
  }

  private movimiento(e: DeviceMotionEvent) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    if (!this.hayMovimiento && Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z) < 1) return;
    this.hayMovimiento = true;
    this.gravedad(a.x, a.y, a.z);
    // Sacudida: picos fuertes de aceleración (sin gravedad si el celular la da)
    const l = e.acceleration;
    const fuerza = l && l.x != null ? Math.hypot(l.x, l.y ?? 0, l.z ?? 0) : Math.abs(Math.hypot(a.x, a.y, a.z) - G);
    const ahora = performance.now();
    if (fuerza > 1.2) this.ultimoMovimiento = ahora;
    if (fuerza > 13) {
      if (!this.picos.length || ahora - this.picos[this.picos.length - 1] > 90) this.picos.push(ahora);
      this.picos = this.picos.filter((t) => ahora - t < 1000);
      if (this.picos.length >= 3) {
        this.picos = [];
        this.emitir('sacudida', fuerza);
      }
    }
  }

  /** Aceleración con gravedad del celular (ejes del aparato) → gravedad en la pantalla. */
  private gravedad(x: number, y: number, z: number) {
    const t = (this.angulo * Math.PI) / 180;
    const derecha = (x * Math.cos(t) - y * Math.sin(t)) * this.signo;
    const arriba = (x * Math.sin(t) + y * Math.cos(t)) * this.signo;
    const k = 0.25;
    this.inclinacion.x += (-derecha / G - this.inclinacion.x) * k;
    this.inclinacion.y += (arriba / G - this.inclinacion.y) * k;
    this.profundidad += (-z / G - this.profundidad) * k;
    // Con la app en horizontal la pantalla gira sola: si «abajo» sale arriba por mucho rato, el signo está al revés
    const ahora = performance.now();
    if (this.inclinacion.y < -0.6 && Math.abs(this.profundidad) < 0.5) {
      if (!this.invertidoDesde) this.invertidoDesde = ahora;
      else if (ahora - this.invertidoDesde > 1800) {
        this.signo *= -1;
        this.invertidoDesde = 0;
      }
    } else this.invertidoDesde = 0;
  }

  get bocaAbajo() {
    return this.profundidad > 0.7;
  }

  /** Milisegundos sin moverse (sin acelerómetro cuenta como quieto). */
  get quieto() {
    return performance.now() - this.ultimoMovimiento;
  }

  /** Enciende el micrófono (pide permiso). Devuelve si quedó escuchando. */
  async escuchar(): Promise<boolean> {
    if (this.audio) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.microfono = 'negado';
      return false;
    }
    this.microfono = 'pidiendo';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(an);
      this.audio = { ctx, an, datos: new Float32Array(an.fftSize), stream };
      this.microfono = 'encendido';
      return true;
    } catch {
      this.microfono = 'negado';
      return false;
    }
  }

  callar() {
    if (!this.audio) return;
    for (const t of this.audio.stream.getTracks()) t.stop();
    void this.audio.ctx.close();
    this.audio = null;
    this.volumen = 0;
    this.microfono = 'apagado';
  }

  /** Cada cuadro: volumen del micrófono y detección de soplido (ruido fuerte y parejo). */
  actualizar() {
    if (this.simulada) {
      const s = this.simulada;
      this.inclinacion.x += (s.x - this.inclinacion.x) * 0.3;
      this.inclinacion.y += (s.y - this.inclinacion.y) * 0.3;
      this.profundidad += (s.z - this.profundidad) * 0.3;
    }
    if (!this.audio) return;
    this.audio.an.getFloatTimeDomainData(this.audio.datos);
    let suma = 0;
    for (const v of this.audio.datos) suma += v * v;
    const rms = Math.sqrt(suma / this.audio.datos.length);
    this.volumen += (Math.min(1, rms * 6) - this.volumen) * 0.3;
    const ahora = performance.now();
    if (this.volumen > 0.35) {
      if (!this.soplandoDesde) this.soplandoDesde = ahora;
      else if (ahora - this.soplandoDesde > 350) this.emitir('soplido', this.volumen);
    } else this.soplandoDesde = 0;
  }

  vibrar(patron: number | number[]) {
    try {
      return navigator.vibrate?.(patron) ?? false;
    } catch {
      return false;
    }
  }

  // --- Simulación (pruebas y computador) ----------------------------------------
  simular = {
    inclinar: (x: number, y: number, z = 0) => {
      this.hayMovimiento = true;
      this.simulada = { x, y, z };
    },
    soltar: () => {
      this.simulada = null;
      this.inclinacion = { x: 0, y: 1 };
      this.profundidad = 0;
    },
    sacudir: () => {
      this.ultimoMovimiento = performance.now();
      this.emitir('sacudida', 20);
    },
    voltear: () => this.emitir('volteo', 180),
    pantalla: (ms = 1500) => this.emitir('pantalla', ms),
    soplar: () => this.emitir('soplido', 1),
    moverse: () => (this.ultimoMovimiento = performance.now()),
  };

  /** Teclas para probar en el computador: flechas inclinan, S sacude, B boca abajo, V voltea, P apaga la pantalla, O sopla. */
  teclado() {
    const inc = { x: 0, y: 1, z: 0 };
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'arrowleft') inc.x = Math.max(-1, inc.x - 0.35);
      else if (k === 'arrowright') inc.x = Math.min(1, inc.x + 0.35);
      else if (k === 'arrowup') inc.y = Math.max(-1, inc.y - 0.35);
      else if (k === 'arrowdown') inc.y = Math.min(1, inc.y + 0.35);
      else if (k === 'b') inc.z = inc.z > 0.5 ? 0 : 1;
      else if (k === 's') return this.simular.sacudir();
      else if (k === 'v') return this.simular.voltear();
      else if (k === 'p') return this.simular.pantalla();
      else if (k === 'o') return this.simular.soplar();
      else return;
      this.simular.inclinar(inc.x, inc.y, inc.z);
    });
  }
}

function anguloPantalla() {
  const a = screen.orientation?.angle;
  if (typeof a === 'number') return a;
  const w = (window as unknown as { orientation?: number }).orientation;
  return typeof w === 'number' ? (w + 360) % 360 : 0;
}
