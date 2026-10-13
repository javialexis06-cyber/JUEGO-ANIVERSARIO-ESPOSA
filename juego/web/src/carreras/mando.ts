// El mando de la carrera. En el celular: joystick transparente abajo a la izquierda (girar; arriba/abajo apunta el
// objeto hacia adelante o hacia atrás), y a la derecha el botón grande de DERRAPE (también el truco en el aire), el de
// OBJETO y el de FRENO (y el de ACELERAR si quien juega apagó «acelerar solo»). En el computador: flechas o WASD,
// espacio para derrapar, X / E / Shift para el objeto.
import type { Entrada } from './sim';

export class Mando {
  giroT = 0;
  joyX = 0;
  joyY = 0;
  private teclas = new Set<string>();
  private derrapeBtn = false;
  private frenoBtn = false;
  private acelBtn = false;
  private objetoPedido = false;
  private dedo: number | null = null;
  private ox = 0;
  private oy = 0;
  private radio = 48;
  raiz: HTMLElement;
  tactil: boolean;
  /** Acelera solo (por defecto en el celular). */
  aceleraSolo: boolean;
  private quitar: (() => void)[] = [];
  alPausar: () => void = () => undefined;

  constructor(contenedor: HTMLElement, aceleraSolo: boolean) {
    this.tactil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.aceleraSolo = aceleraSolo;
    const r = (this.raiz = document.createElement('div'));
    r.className = 'car-mando';
    r.innerHTML = `
      <div class="car-zona-joy"></div>
      <div class="car-joy"><i></i></div>
      <button class="car-btn car-derrape" aria-label="Derrapar"><b>Derrape</b></button>
      <button class="car-btn car-objeto" aria-label="Usar objeto"><b>Objeto</b></button>
      <button class="car-btn car-freno" aria-label="Frenar"><b>Freno</b></button>
      <button class="car-btn car-acel" aria-label="Acelerar"><b>Acelerar</b></button>`;
    contenedor.append(r);
    r.classList.toggle('tactil', this.tactil);
    r.classList.toggle('manual', !aceleraSolo);
    const zona = r.querySelector('.car-zona-joy') as HTMLElement;
    const joy = r.querySelector('.car-joy') as HTMLElement;
    const palo = joy.querySelector('i') as HTMLElement;
    const base = () => {
      const b = zona.getBoundingClientRect();
      this.ox = b.left + 88;
      this.oy = b.bottom - 88;
      joy.style.left = `${this.ox}px`;
      joy.style.top = `${this.oy}px`;
    };
    base();
    const on = (el: EventTarget, ev: string, fn: (e: any) => void) => {
      el.addEventListener(ev, fn, { passive: false });
      this.quitar.push(() => el.removeEventListener(ev, fn));
    };
    on(zona, 'pointerdown', (e: PointerEvent) => {
      if (this.dedo !== null) return;
      this.dedo = e.pointerId;
      this.ox = e.clientX;
      this.oy = e.clientY;
      joy.style.left = `${this.ox}px`;
      joy.style.top = `${this.oy}px`;
      joy.classList.add('activo');
      zona.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    on(zona, 'pointermove', (e: PointerEvent) => {
      if (e.pointerId !== this.dedo) return;
      let dx = e.clientX - this.ox, dy = e.clientY - this.oy;
      const l = Math.hypot(dx, dy);
      if (l > this.radio * 1.5) {
        this.ox += (dx / l) * (l - this.radio * 1.5);
        this.oy += (dy / l) * (l - this.radio * 1.5);
        joy.style.left = `${this.ox}px`;
        joy.style.top = `${this.oy}px`;
        dx = e.clientX - this.ox;
        dy = e.clientY - this.oy;
      }
      const ll = Math.hypot(dx, dy);
      const k = ll > this.radio ? this.radio / ll : 1;
      palo.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      const fx = Math.max(-1, Math.min(1, dx / this.radio));
      this.joyX = Math.abs(fx) < 0.1 ? 0 : Math.sign(fx) * ((Math.abs(fx) - 0.1) / 0.9);
      this.joyY = Math.max(-1, Math.min(1, dy / this.radio));
    });
    const soltar = (e: PointerEvent) => {
      if (e.pointerId !== this.dedo) return;
      this.dedo = null;
      this.joyX = this.joyY = 0;
      palo.style.transform = '';
      joy.classList.remove('activo');
      base();
    };
    on(zona, 'pointerup', soltar);
    on(zona, 'pointercancel', soltar);
    const boton = (sel: string, fn: (si: boolean) => void) => {
      const b = r.querySelector(sel) as HTMLElement;
      on(b, 'pointerdown', (e: PointerEvent) => {
        e.preventDefault();
        b.setPointerCapture?.(e.pointerId);
        b.classList.add('apretado');
        fn(true);
      });
      const fin = () => {
        b.classList.remove('apretado');
        fn(false);
      };
      on(b, 'pointerup', fin);
      on(b, 'pointercancel', fin);
      on(b, 'contextmenu', (e: Event) => e.preventDefault());
    };
    boton('.car-derrape', (si) => (this.derrapeBtn = si));
    boton('.car-objeto', (si) => si && (this.objetoPedido = true));
    boton('.car-freno', (si) => (this.frenoBtn = si));
    boton('.car-acel', (si) => (this.acelBtn = si));
    on(window, 'keydown', (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      this.teclas.add(k);
      if (k === 'x' || k === 'e' || k === 'shift' || k === 'enter') this.objetoPedido = true;
      if (k === 'p') this.alPausar();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    });
    on(window, 'keyup', (e: KeyboardEvent) => this.teclas.delete(e.key.toLowerCase()));
    on(window, 'blur', () => this.teclas.clear());
  }

  /** Llena la entrada del carro de quien juega. */
  leer(e: Entrada) {
    const t = this.teclas;
    const izq = t.has('arrowleft') || t.has('a'), der = t.has('arrowright') || t.has('d');
    const arriba = t.has('arrowup') || t.has('w'), abajo = t.has('arrowdown') || t.has('s');
    const teclado = (izq ? -1 : 0) + (der ? 1 : 0);
    // El teclado gira suavecito (como un joystick)
    this.giroT += (teclado - this.giroT) * (teclado ? 0.22 : 0.4);
    // (la derecha de la pantalla es girar a la derecha: en three.js eso es rumbo negativo)
    e.giro = -(Math.abs(this.joyX) > 0.01 ? this.joyX : this.giroT);
    const frena = this.frenoBtn || abajo;
    const acelera = this.aceleraSolo || this.acelBtn || arriba;
    e.acel = frena ? -1 : acelera ? 1 : 0;
    e.derrape = this.derrapeBtn || t.has(' ') || t.has('z');
    if (this.objetoPedido) {
      e.objeto = true;
      this.objetoPedido = false;
    }
    e.atras = this.joyY > 0.5 || abajo;
    e.adelante = this.joyY < -0.5 || arriba;
  }

  /** Para la cuenta regresiva: ¿está acelerando de verdad (no el automático)? */
  aceleraDeVerdad() {
    return this.acelBtn || this.teclas.has('arrowup') || this.teclas.has('w') || this.derrapeBtn;
  }

  mostrar(si: boolean) {
    this.raiz.hidden = !si;
  }

  liberar() {
    for (const q of this.quitar) q();
    this.raiz.remove();
  }
}
