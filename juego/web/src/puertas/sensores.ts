// Sensores del celular para los acertijos: inclinar, sacudir, boca abajo, voltear, apagar la pantalla, quieto,
// soplar (micrófono) y vibrar. Todo se puede simular (teclado y window.__puertas) para probar sin celular.
import * as fondo from '../segundo_plano';

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
  /** Lo mismo, pero solo del celular propio (en pareja la inclinación puede venir del otro). */
  hayMovimientoPropio = false;
  /** Lo que mide el celular propio (la inclinación de arriba puede venir del otro en pareja). */
  private local = { x: 0, y: 1, z: 0 };
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
    // Cerrar los ojos (apagar la pantalla, irse a otra app): el aviso común de segundo plano de toda la app
    fondo.alPausar(() => this.apagar());
    fondo.alReanudar(() => this.prender());
  }

  on(e: Evento, fn: Oyente) {
    let s = this.oyentes.get(e);
    if (!s) this.oyentes.set(e, (s = new Set()));
    s.add(fn);
    return () => s!.delete(fn);
  }

  /** Pareja (anfitrión): un sensor del otro celular (sacudió, volteó, apagó la pantalla, sopló). */
  externo(e: Evento, dato = 0) {
    this.emitir(e, dato);
  }

  /** Pareja (anfitrión): inclinación del otro celular [x, y, profundidad]; cuenta mientras la propia esté quieta. */
  ponerInclinacionExterna(i: [number, number, number] | null) {
    this.externa = i ? { x: i[0], y: i[1], z: i[2], t: performance.now() } : null;
  }
  private externa: { x: number; y: number; z: number; t: number } | null = null;

  /** Inclinación propia para mandarla al otro celular (null si no hay acelerómetro o no se está usando). */
  inclinacionPropia(): [number, number, number] | null {
    if (!this.hayMovimientoPropio && !this.simulada) return null;
    const l = this.local;
    return [Math.round(l.x * 100) / 100, Math.round(l.y * 100) / 100, Math.round(l.z * 100) / 100];
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
    this.hayMovimientoPropio = true;
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
    const l = this.local;
    l.x += (-derecha / G - l.x) * k;
    l.y += (arriba / G - l.y) * k;
    l.z += (-z / G - l.z) * k;
    // Con la app en horizontal la pantalla gira sola: si «abajo» sale arriba por mucho rato, el signo está al revés
    const ahora = performance.now();
    if (l.y < -0.6 && Math.abs(l.z) < 0.5) {
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
    const l = this.local;
    if (this.simulada) {
      const s = this.simulada;
      l.x += (s.x - l.x) * 0.3;
      l.y += (s.y - l.y) * 0.3;
      l.z += (s.z - l.z) * 0.3;
    }
    // En pareja: si el celular propio está quieto (o no tiene acelerómetro) y el del otro se está inclinando, manda
    // el del otro
    const ex = this.externa;
    const propia = (this.hayMovimientoPropio || !!this.simulada) && (Math.abs(l.x) > 0.2 || Math.abs(l.y - 1) > 0.25 || Math.abs(l.z) > 0.4);
    if (ex && performance.now() - ex.t < 700 && !propia) {
      this.inclinacion.x += (ex.x - this.inclinacion.x) * 0.35;
      this.inclinacion.y += (ex.y - this.inclinacion.y) * 0.35;
      this.profundidad += (ex.z - this.profundidad) * 0.35;
      this.hayMovimiento = true;
    } else {
      this.inclinacion.x = l.x;
      this.inclinacion.y = l.y;
      this.profundidad = l.z;
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
      this.local = { x: 0, y: 1, z: 0 };
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
