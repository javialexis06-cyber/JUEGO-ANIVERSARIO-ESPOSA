// Joysticks transparentes en las esquinas de abajo: el de la izquierda mueve a Él y, cuando juegan los dos en el mismo
// celular, el de la derecha mueve a Ella. En el computador: WASD o flechas (en pareja, WASD para Él y flechas para Ella).
export interface Vector {
  x: number;
  y: number;
}

/** Radio (px) que recorre la perilla desde el centro. */
const RADIO = 42;
const TECLAS: Record<string, [number, number, number]> = {
  // tecla → [mando en pareja, x, y]
  KeyW: [0, 0, 1], KeyS: [0, 0, -1], KeyA: [0, -1, 0], KeyD: [0, 1, 0],
  ArrowUp: [1, 0, 1], ArrowDown: [1, 0, -1], ArrowLeft: [1, -1, 0], ArrowRight: [1, 1, 0],
};

class Palanca {
  valor: Vector = { x: 0, y: 0 };
  private dedo: number | null = null;
  private perilla: HTMLElement;
  private base: HTMLElement;

  constructor(public zona: HTMLElement) {
    this.base = zona.querySelector('.mando-base') as HTMLElement;
    this.perilla = zona.querySelector('.mando-perilla') as HTMLElement;
    zona.addEventListener('pointerdown', (e) => {
      if (this.dedo !== null) return;
      e.preventDefault();
      this.dedo = e.pointerId;
      zona.setPointerCapture?.(e.pointerId);
      zona.classList.add('activo');
      this.mover(e);
    });
    zona.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.dedo) this.mover(e);
    });
    const soltar = (e: PointerEvent) => {
      if (e.pointerId !== this.dedo) return;
      this.soltar();
    };
    zona.addEventListener('pointerup', soltar);
    zona.addEventListener('pointercancel', soltar);
    zona.addEventListener('lostpointercapture', soltar);
  }

  private mover(e: PointerEvent) {
    const r = this.base.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > RADIO) {
      dx *= RADIO / d;
      dy *= RADIO / d;
    }
    this.perilla.style.transform = `translate(${dx}px, ${dy}px)`;
    this.valor = { x: dx / RADIO, y: -dy / RADIO };
  }

  soltar() {
    this.dedo = null;
    this.valor = { x: 0, y: 0 };
    this.perilla.style.transform = '';
    this.zona.classList.remove('activo');
  }
}

export class Mandos {
  private palancas: Palanca[];
  private teclas = new Set<string>();
  pareja = false;

  constructor(private raiz: HTMLElement) {
    this.palancas = [...raiz.querySelectorAll<HTMLElement>('.mando')].map((z) => new Palanca(z));
    window.addEventListener('keydown', (e) => {
      if (!TECLAS[e.code] || this.raiz.hidden || (e.target as HTMLElement)?.closest?.('input, textarea')) return;
      this.teclas.add(e.code);
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.teclas.delete(e.code));
    window.addEventListener('blur', () => this.teclas.clear());
  }

  /** Muestra uno o dos joysticks con el nombre de quien mueve cada uno. */
  mostrar(si: boolean, pareja = false, nombres: string[] = []) {
    this.pareja = pareja;
    this.raiz.hidden = !si;
    this.raiz.classList.toggle('pareja', pareja);
    this.palancas.forEach((p, i) => {
      p.soltar();
      p.zona.hidden = i > 0 && !pareja;
      const n = p.zona.querySelector('.mando-nombre');
      if (n) n.textContent = pareja ? nombres[i] ?? '' : '';
    });
    if (!si) this.teclas.clear();
  }

  /** Hacia dónde empuja el mando i (joystick o teclado), de -1 a 1. */
  leer(i: number): Vector {
    const v = { ...(this.palancas[i]?.valor ?? { x: 0, y: 0 }) };
    let tx = 0, ty = 0;
    for (const k of this.teclas) {
      const [m, x, y] = TECLAS[k];
      if ((this.pareja ? m : 0) !== i) continue;
      tx += x;
      ty += y;
    }
    if (tx || ty) {
      const d = Math.hypot(tx, ty);
      return { x: tx / d, y: ty / d };
    }
    return v;
  }
}
