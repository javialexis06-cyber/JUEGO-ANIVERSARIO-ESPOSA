// El mando: en el celular, un joystick transparente que aparece donde se toca (abajo a la izquierda) y cuatro botones
// pequeños a la derecha (rápido, fuerte, especial, agarre) más el de la súper, que se prende con la barra llena. Para
// dos en el mismo celular, cada uno tiene su joystick y sus botones en su orilla. En el computador, el teclado:
//   uno solo:  flechas o WASD (arriba salta, abajo se agacha, atrás tapa) · J rápido · K fuerte · L especial · U agarre · I súper
//   versus:    jugador 1 WASD + F G H R T   ·   jugador 2 flechas + J K L U I (o el teclado numérico 1 2 3 0 4)
import { NADA, type Entrada } from '../tipos';

type Boton = 'a' | 'b' | 'e' | 'g' | 's';
const TECLAS_UNO: Record<string, Boton> = { j: 'a', z: 'a', f: 'a', k: 'b', x: 'b', g: 'b', l: 'e', c: 'e', h: 'e', u: 'g', v: 'g', r: 'g', i: 's', b: 's', t: 's', o: 's' };
const TECLAS_V1: Record<string, Boton> = { f: 'a', g: 'b', h: 'e', r: 'g', t: 's' };
const TECLAS_V2: Record<string, Boton> = { j: 'a', k: 'b', l: 'e', u: 'g', i: 's', numpad1: 'a', numpad2: 'b', numpad3: 'e', numpad0: 'g', numpad4: 's' };

interface Lado {
  h: number;
  v: number;
  botones: Record<Boton, boolean>;
  dedo: number | null;
  ox: number;
  oy: number;
  joy: HTMLElement;
  palo: HTMLElement;
  zona: HTMLElement;
  btn: Partial<Record<Boton, HTMLElement>>;
}

const NOMBRES: Record<Boton, string> = { a: 'Rápido', b: 'Fuerte', e: 'Especial', g: 'Agarre', s: 'Súper' };
const ICONOS: Record<Boton, string> = {
  a: '<svg viewBox="0 0 24 24"><path d="M7 13c0-3 2-6 5-6h3c2 0 3 1 3 3v3c0 3-2 5-5 5h-2c-2 0-4-2-4-5z" fill="currentColor"/><path d="M3 10h4M2 14h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  b: '<svg viewBox="0 0 24 24"><path d="M6 12c0-4 3-7 7-7h2c3 0 5 2 5 5v3c0 4-3 7-7 7h-2c-3 0-5-3-5-8z" fill="currentColor"/><path d="M14 2l1 3M19 4l-2 2M10 3l1 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  e: '<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.2L21 9l-5 4.4L17.5 20 12 16.6 6.5 20 8 13.4 3 9l6.4-.8z" fill="currentColor"/></svg>',
  g: '<svg viewBox="0 0 24 24"><path d="M5 9c0-2 2-3 3-1l1 3 1-6c0-2 3-2 3 0v5l1-4c1-2 3-1 3 1l-1 6c0 4-3 7-7 7-3 0-5-2-5-5z" fill="currentColor"/></svg>',
  s: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-2 8 9-12h-7z" fill="currentColor"/></svg>',
};

export class Mando {
  tactil: boolean;
  private lados: Lado[] = [];
  private teclas = new Set<string>();
  private quitar: (() => void)[] = [];
  private raiz: HTMLElement;
  activo = true;
  alPausar: () => void = () => undefined;

  /** `dos`: dos jugadores en el mismo aparato. */
  constructor(contenedor: HTMLElement, public dos: boolean) {
    this.tactil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.raiz = document.createElement('div');
    this.raiz.className = `mando ${dos ? 'mando-dos' : 'mando-uno'}${this.tactil ? '' : ' sin-tactil'}`;
    contenedor.append(this.raiz);
    for (let i = 0; i < (dos ? 2 : 1); i++) this.lados.push(this.armarLado(i));
    const kd = (e: KeyboardEvent) => {
      const k = (e.code.startsWith('Numpad') ? e.code : e.key).toLowerCase();
      if (k === 'escape' || k === 'p') {
        if (!e.repeat) this.alPausar();
        e.preventDefault();
        return;
      }
      if (/^(arrow|numpad| $)/.test(k) || k === ' ') e.preventDefault();
      this.teclas.add(k);
    };
    const ku = (e: KeyboardEvent) => {
      const k = (e.code.startsWith('Numpad') ? e.code : e.key).toLowerCase();
      this.teclas.delete(k);
    };
    const blur = () => this.teclas.clear();
    addEventListener('keydown', kd);
    addEventListener('keyup', ku);
    addEventListener('blur', blur);
    this.quitar.push(() => removeEventListener('keydown', kd), () => removeEventListener('keyup', ku), () => removeEventListener('blur', blur));
  }

  private armarLado(i: number): Lado {
    const zona = document.createElement('div');
    zona.className = `mando-zona mando-zona-${i}`;
    const joy = document.createElement('div');
    joy.className = 'mando-joy';
    joy.innerHTML = '<i></i>';
    const botones = document.createElement('div');
    botones.className = `mando-botones mando-botones-${i}`;
    const lado: Lado = { h: 0, v: 0, botones: { a: false, b: false, e: false, g: false, s: false }, dedo: null, ox: 0, oy: 0, joy, palo: joy.querySelector('i')!, zona, btn: {} };
    for (const b of ['s', 'e', 'g', 'b', 'a'] as Boton[]) {
      const el = document.createElement('button');
      el.className = `mando-btn mando-${b}`;
      el.type = 'button';
      el.setAttribute('aria-label', NOMBRES[b]);
      el.innerHTML = `${ICONOS[b]}<span>${NOMBRES[b]}</span>`;
      const abajo = (e: PointerEvent) => {
        e.preventDefault();
        lado.botones[b] = true;
        el.classList.add('apretado');
        el.setPointerCapture?.(e.pointerId);
      };
      const arriba = () => {
        lado.botones[b] = false;
        el.classList.remove('apretado');
      };
      el.addEventListener('pointerdown', abajo);
      el.addEventListener('pointerup', arriba);
      el.addEventListener('pointercancel', arriba);
      el.addEventListener('lostpointercapture', arriba);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      lado.btn[b] = el;
      botones.append(el);
    }
    const radio = 46;
    const abajo = (e: PointerEvent) => {
      if (lado.dedo !== null || !this.activo) return;
      lado.dedo = e.pointerId;
      lado.ox = e.clientX;
      lado.oy = e.clientY;
      joy.style.left = `${lado.ox}px`;
      joy.style.top = `${lado.oy}px`;
      joy.classList.add('activo');
      lado.palo.style.transform = '';
      zona.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerId !== lado.dedo) return;
      let dx = e.clientX - lado.ox, dy = e.clientY - lado.oy;
      const l = Math.hypot(dx, dy);
      if (l > radio * 1.5) {
        lado.ox += (dx / l) * (l - radio * 1.5);
        lado.oy += (dy / l) * (l - radio * 1.5);
        joy.style.left = `${lado.ox}px`;
        joy.style.top = `${lado.oy}px`;
        dx = e.clientX - lado.ox;
        dy = e.clientY - lado.oy;
      }
      const ll = Math.hypot(dx, dy);
      const k = ll > radio ? radio / ll : 1;
      lado.palo.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      const nx = dx / radio, ny = dy / radio;
      lado.h = nx > 0.35 ? 1 : nx < -0.35 ? -1 : 0;
      lado.v = ny < -0.55 ? 1 : ny > 0.5 ? -1 : 0;
      e.preventDefault();
    };
    const arriba = (e: PointerEvent) => {
      if (e.pointerId !== lado.dedo) return;
      lado.dedo = null;
      lado.h = lado.v = 0;
      joy.classList.remove('activo');
    };
    zona.addEventListener('pointerdown', abajo);
    zona.addEventListener('pointermove', mover);
    zona.addEventListener('pointerup', arriba);
    zona.addEventListener('pointercancel', arriba);
    this.raiz.append(zona, joy, botones);
    return lado;
  }

  /** Lo que aprieta el jugador `i` (0 o 1). */
  leer(i: number): Entrada {
    if (!this.activo) return NADA;
    const t = this.teclas;
    let h = 0, v = 0;
    const bot: Record<Boton, boolean> = { a: false, b: false, e: false, g: false, s: false };
    const izq = this.dos ? (i === 0 ? ['a'] : ['arrowleft']) : ['a', 'arrowleft'];
    const der = this.dos ? (i === 0 ? ['d'] : ['arrowright']) : ['d', 'arrowright'];
    const arr = this.dos ? (i === 0 ? ['w'] : ['arrowup']) : ['w', 'arrowup', ' '];
    const aba = this.dos ? (i === 0 ? ['s'] : ['arrowdown']) : ['s', 'arrowdown'];
    if (izq.some((k) => t.has(k))) h -= 1;
    if (der.some((k) => t.has(k))) h += 1;
    if (arr.some((k) => t.has(k))) v = 1;
    if (aba.some((k) => t.has(k))) v = -1;
    const mapa = this.dos ? (i === 0 ? TECLAS_V1 : TECLAS_V2) : TECLAS_UNO;
    for (const [k, b] of Object.entries(mapa)) if (t.has(k)) bot[b] = true;
    const l = this.lados[this.dos ? i : 0];
    if (l && (!this.dos || true)) {
      if (l.h) h = l.h;
      if (l.v) v = l.v;
      for (const b of Object.keys(bot) as Boton[]) bot[b] ||= l.botones[b];
    }
    return { h, v, a: bot.a, b: bot.b, e: bot.e, g: bot.g, s: bot.s };
  }

  /** Prende el botón de la súper (barra llena) de ese lado. */
  superLista(i: number, si: boolean) {
    this.lados[this.dos ? i : 0]?.btn.s?.classList.toggle('lista', si);
  }

  mostrar(si: boolean) {
    this.raiz.hidden = !si;
    if (!si) this.soltar();
  }

  soltar() {
    this.teclas.clear();
    for (const l of this.lados) {
      l.h = l.v = 0;
      l.dedo = null;
      l.joy.classList.remove('activo');
      for (const b of Object.keys(l.botones) as Boton[]) l.botones[b] = false;
    }
  }

  liberar() {
    for (const q of this.quitar) q();
    this.raiz.remove();
  }
}
