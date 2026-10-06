// El mando: en el celular, un joystick transparente que aparece donde se toca (mitad izquierda) y el botón de la
// habilidad; en el computador, WASD o las flechas, espacio para la habilidad, Esc para pausar y la rueda para el zoom.
// Tocar algo del mundo (clic del mouse, o el dedo fuera del joystick) lo recoge o lo abre: si está lejos, el
// personaje camina hasta tenerlo al alcance de la mano (mover el joystick o las teclas cancela).
const $ = (id: string) => document.getElementById(id)!;

export class Mando {
  mx = 0;
  my = 0;
  private habilidad = false;
  private teclas = new Set<string>();
  private dedo: number | null = null;
  private ox = 0;
  private oy = 0;
  private radio = 52;
  tactil = false;
  activo = true;
  alPausar: () => void = () => undefined;
  alZoom: (f: number) => void = () => undefined;
  /** Teclas numéricas (para escoger cartas con el teclado). */
  alNumero: (n: number) => void = () => undefined;
  alTecla: (k: string) => void = () => undefined;
  /** Tocó el mundo en (px, py) de la pantalla (quien juega busca qué hay ahí y llama a `ir`). */
  alTocar: (px: number, py: number) => void = () => undefined;
  /** ¿Hay algo para tocar bajo el puntero? (para la manito del mouse) */
  alSobre: (px: number, py: number) => boolean = () => false;
  /** Hacia dónde camina solo (lo que se tocó) y cuánto lleva sin acercarse. */
  private meta: { x: number; y: number; t: number; mejor: number; quieto: number } | null = null;
  private guiando = false;
  private pedido: { x: number; y: number } | null = null;
  private sobreT = 0;
  private quitar: (() => void)[] = [];

  constructor() {
    this.tactil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    document.body.classList.toggle('tactil', this.tactil);
    const zona = $('zona-joystick');
    const joy = $('joystick');
    const palo = joy.querySelector('i') as HTMLElement;
    const abajo = (e: PointerEvent) => {
      if (!this.activo || this.dedo !== null) return;
      if (e.pointerType === 'mouse' && !this.tactil) return;
      this.cancelarMeta();
      this.dedo = e.pointerId;
      this.ox = e.clientX;
      this.oy = e.clientY;
      joy.style.left = `${this.ox}px`;
      joy.style.top = `${this.oy}px`;
      joy.classList.add('activo');
      palo.style.transform = '';
      zona.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerId !== this.dedo) return;
      let dx = e.clientX - this.ox, dy = e.clientY - this.oy;
      const l = Math.hypot(dx, dy);
      // El joystick se arrastra si el dedo se va muy lejos (no se pierde el control)
      if (l > this.radio * 1.6) {
        this.ox += (dx / l) * (l - this.radio * 1.6);
        this.oy += (dy / l) * (l - this.radio * 1.6);
        joy.style.left = `${this.ox}px`;
        joy.style.top = `${this.oy}px`;
        dx = e.clientX - this.ox;
        dy = e.clientY - this.oy;
      }
      const ll = Math.hypot(dx, dy);
      const k = ll > this.radio ? this.radio / ll : 1;
      palo.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      // Zona muerta pequeña y respuesta casi lineal
      const f = Math.min(1, ll / this.radio);
      const m = f < 0.12 ? 0 : (f - 0.12) / 0.88;
      this.mx = ll > 0 ? (dx / ll) * m : 0;
      this.my = ll > 0 ? (dy / ll) * m : 0;
      e.preventDefault();
    };
    const arriba = (e: PointerEvent) => {
      if (e.pointerId !== this.dedo) return;
      this.dedo = null;
      this.mx = this.my = 0;
      joy.classList.remove('activo');
    };
    // Tocar el mundo: el mouse en cualquier parte del juego; el dedo, fuera de la zona del joystick
    const tocar = (e: PointerEvent) => {
      if (!this.activo || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const id = (e.target as HTMLElement | null)?.id;
      if (id !== 'lienzo' && !(id === 'zona-joystick' && e.pointerType === 'mouse' && !this.tactil)) return;
      this.alTocar(e.clientX, e.clientY);
    };
    const sobre = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !this.activo) return;
      const ahora = performance.now();
      if (ahora - this.sobreT < 90) return;
      this.sobreT = ahora;
      const id = (e.target as HTMLElement | null)?.id;
      document.body.classList.toggle('mano', (id === 'lienzo' || id === 'zona-joystick') && this.alSobre(e.clientX, e.clientY));
    };
    addEventListener('pointerdown', tocar);
    addEventListener('pointermove', sobre, { passive: true });
    this.quitar.push(() => removeEventListener('pointerdown', tocar), () => removeEventListener('pointermove', sobre));
    zona.addEventListener('pointerdown', abajo);
    zona.addEventListener('pointermove', mover);
    zona.addEventListener('pointerup', arriba);
    zona.addEventListener('pointercancel', arriba);
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape' || k === 'p') {
        this.alPausar();
        e.preventDefault();
        return;
      }
      if (k === ' ' || k === 'shift' || k === 'e') {
        if (this.activo) this.habilidad = true;
        e.preventDefault();
      }
      if (/^[1-4]$/.test(k)) this.alNumero(Number(k));
      this.alTecla(k);
      this.teclas.add(k);
      this.leerTeclas();
    };
    const ku = (e: KeyboardEvent) => {
      this.teclas.delete(e.key.toLowerCase());
      this.leerTeclas();
    };
    const rueda = (e: WheelEvent) => this.alZoom(e.deltaY > 0 ? 1.06 : 1 / 1.06);
    const perder = () => {
      this.teclas.clear();
      this.leerTeclas();
    };
    addEventListener('keydown', kd);
    addEventListener('keyup', ku);
    addEventListener('wheel', rueda, { passive: true });
    addEventListener('blur', perder);
    this.quitar.push(() => removeEventListener('keydown', kd), () => removeEventListener('keyup', ku), () => removeEventListener('wheel', rueda), () => removeEventListener('blur', perder));
  }

  private leerTeclas() {
    if (this.dedo !== null) return;
    const t = this.teclas;
    let x = 0, y = 0;
    if (t.has('a') || t.has('arrowleft')) x -= 1;
    if (t.has('d') || t.has('arrowright')) x += 1;
    if (t.has('w') || t.has('arrowup')) y -= 1;
    if (t.has('s') || t.has('arrowdown')) y += 1;
    const l = Math.hypot(x, y);
    if (l) this.cancelarMeta();
    else if (this.guiando) return;
    this.mx = l ? x / l : 0;
    this.my = l ? y / l : 0;
  }

  /** Caminar solo hasta (x, y) del mundo para tomar lo que hay ahí. */
  ir(x: number, y: number) {
    if (!this.activo) return;
    this.meta = { x, y, t: 0, mejor: Infinity, quieto: 0 };
  }

  private cancelarMeta() {
    this.meta = null;
    if (this.guiando) {
      this.guiando = false;
      if (this.dedo === null) this.mx = this.my = 0;
    }
  }

  /** Cada cuadro, antes de leer mx/my: si va caminando solo hacia algo, lo lleva; al tenerlo al alcance de la mano
   *  deja el pedido de tomarlo. Se rinde si se atasca (una pared en medio) o tarda mucho. */
  guiar(dt: number, jx: number, jy: number, alcance: number) {
    const m = this.meta;
    if (!m) return;
    if (this.dedo !== null) return this.cancelarMeta();
    const dx = m.x - jx, dy = m.y - jy;
    const d = Math.hypot(dx, dy);
    if (d <= alcance - 0.3) {
      this.pedido = { x: m.x, y: m.y };
      return this.cancelarMeta();
    }
    m.t += dt;
    if (d < m.mejor - 0.25) {
      m.mejor = d;
      m.quieto = 0;
    } else m.quieto += dt;
    if (m.t > 7 || m.quieto > 1.2) return this.cancelarMeta();
    this.guiando = true;
    this.mx = dx / d;
    this.my = dy / d;
  }

  /** ¿Hay algo tocado para tomar? (se consume) */
  tomarPedido() {
    const p = this.pedido;
    this.pedido = null;
    return p;
  }

  /** El botón de la habilidad (del HUD). */
  pedirHabilidad() {
    if (this.activo) this.habilidad = true;
  }

  /** ¿Pidió la habilidad desde la última vez? (se consume) */
  tomarHabilidad() {
    const h = this.habilidad;
    this.habilidad = false;
    return h;
  }

  /** Suelta todo (al abrir un menú o pausar). */
  soltar() {
    this.meta = null;
    this.guiando = false;
    this.pedido = null;
    this.mx = this.my = 0;
    this.dedo = null;
    this.teclas.clear();
    $('joystick').classList.remove('activo');
  }

  mostrarZona(si: boolean) {
    $('zona-joystick').hidden = !si;
    if (!si) this.soltar();
  }

  liberar() {
    document.body.classList.remove('mano');
    for (const q of this.quitar) q();
  }
}
