// El tutorial de Súper Manía: la primera vez que se abre el día 1 jugando solo (y cuando se quiera, desde «Cómo se
// juega») el reloj se queda quieto y se aprende jugando: caminar, llenar el carrito en la bodega, reponer un estante
// vacío, cobrarle a un cliente y mandar al personaje con un toque. Cada paso espera a que se haga de verdad (no basta
// con leer) y siempre se puede saltar. Al terminar arranca el día de verdad.
import type { Juego } from './juego';
import { aTres, type Mundo } from './mundo';
import type { P } from './navegacion';
import * as sonido from './sonido';
import type { Vitrina } from './tienda';

const CLAVE = 'supermania-tutorial';
export function tutorialVisto() {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return true;
  }
}
function marcarVisto() {
  try {
    localStorage.setItem(CLAVE, '1');
  } catch {
    /* sin almacenamiento */
  }
}

interface Paso {
  titulo: string;
  texto: string;
  /** Lo que se prepara al entrar (vaciar un estante, traer un cliente…). */
  entrar?: (t: TutorialSuper) => void;
  /** ¿Ya lo hizo? */
  listo: (t: TutorialSuper) => boolean;
  /** Adónde apunta la flecha (un punto del piso de la tienda). */
  donde?: (t: TutorialSuper) => P | null;
  /** La manito que arrastra el joystick. */
  mano?: boolean;
  /** Botón para seguir (si el paso no espera nada). */
  boton?: string;
}

const PASOS: Paso[] = [
  {
    titulo: '¡A caminar!',
    texto: 'Arrastra el joystick de abajo a la izquierda para moverte por la tienda (en el computador, WASD o las flechas).',
    mano: true,
    entrar: (t) => (t.inicio = { ...t.j.jugador.pos }),
    listo: (t) => distancia(t.j.jugador.pos, t.inicio) > 2.2,
  },
  {
    titulo: 'La bodega',
    texto: 'Ve a la bodega (la puerta coral, donde está la flecha) y quédate quieto un momentico: se llena el carrito.',
    donde: (t) => t.j.tienda.bodega,
    listo: (t) => t.j.jugador.carga > 0,
  },
  {
    titulo: 'Reponer',
    texto: 'Este estante se quedó vacío (el «!» rojo). Llévale el carrito y quédate junto a él: se llena solo.',
    entrar: (t) => {
      // El estante más a la vista que tenga producto, vaciado para la práctica
      const v = [...t.j.tienda.enVenta].sort((a, b) => distancia(a.frente(), t.j.jugador.pos) - distancia(b.frente(), t.j.jugador.pos))[0];
      if (v) {
        v.ponerStock(0);
        t.vitrina = v;
      }
    },
    donde: (t) => t.vitrina?.frente() ?? null,
    listo: (t) => !t.vitrina || t.vitrina.stock > 0,
  },
  {
    titulo: 'Cobrar',
    texto: 'Llegó una clienta: busca lo que dice su globito y se va a la caja. Ponte detrás de la caja (la flecha) y quédate quieto para cobrarle.',
    entrar: (t) => {
      t.atendidos = t.j.stats.atendidos;
      t.j.traerCliente('mama');
    },
    donde: (t) => t.j.tienda.caja.puestoCajero(),
    listo: (t) => t.j.stats.atendidos > t.atendidos,
  },
  {
    titulo: 'Con un toque también',
    texto: 'Tocar una vitrina, la caja o una mugre manda al personaje solo (y puedes poner varias cosas en fila). Prueba tocando un estante.',
    entrar: (t) => (t.desde = t.reloj),
    listo: (t) => t.j.jugador.fila.length > 0 || t.reloj - t.desde > 14,
    boton: 'Ya entendí',
  },
  {
    titulo: '¡Listo para abrir!',
    texto: 'Que no se acabe nada, que nadie espere mucho en la caja y que la tienda esté limpia. Al cerrar, cada objetivo del día da una estrella.',
    listo: () => false,
    boton: '¡Abrir la tienda!',
  },
];

const distancia = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

export class TutorialSuper {
  i = -1;
  reloj = 0;
  desde = 0;
  inicio: P = { x: 0, y: 0 };
  vitrina: Vitrina | null = null;
  atendidos = 0;
  private raiz: HTMLElement;
  private flecha: HTMLElement;
  terminado = false;

  constructor(public j: Juego, private mundo: Mundo, private alTerminar: () => void) {
    j.congelado = true;
    this.raiz = document.createElement('div');
    this.raiz.className = 'tuto-super';
    this.raiz.innerHTML = `
      <div class="ts-globo" role="dialog" aria-live="polite">
        <small class="ts-paso"></small><b class="ts-titulo"></b><p class="ts-texto"></p>
        <div class="ts-botones"><button class="ts-saltar">Saltar tutorial</button><button class="ts-seguir" hidden></button></div>
      </div>
      <div class="ts-flecha" hidden><span></span></div>
      <div class="ts-mano" hidden><i></i></div>`;
    document.body.append(this.raiz);
    this.flecha = this.raiz.querySelector('.ts-flecha')!;
    this.raiz.querySelector('.ts-saltar')!.addEventListener('click', () => this.terminar());
    this.raiz.querySelector('.ts-seguir')!.addEventListener('click', () => {
      if (this.i >= PASOS.length - 1) this.terminar();
      else this.siguiente();
    });
    this.siguiente();
  }

  private siguiente() {
    this.i++;
    const p = PASOS[this.i];
    p.entrar?.(this);
    this.raiz.querySelector('.ts-paso')!.textContent = `Paso ${this.i + 1} de ${PASOS.length}`;
    this.raiz.querySelector('.ts-titulo')!.textContent = p.titulo;
    this.raiz.querySelector('.ts-texto')!.textContent = p.texto;
    const b = this.raiz.querySelector<HTMLButtonElement>('.ts-seguir')!;
    b.hidden = !p.boton;
    b.textContent = p.boton ?? '';
    (this.raiz.querySelector('.ts-mano') as HTMLElement).hidden = !p.mano;
    const g = this.raiz.querySelector('.ts-globo')!;
    g.classList.remove('entra');
    void (g as HTMLElement).offsetWidth;
    g.classList.add('entra');
    if (this.i > 0) sonido.nota(1318, 0.12, 0, 'sine', 0.05);
    if (this.i > 0) sonido.nota(1760, 0.16, 0.08, 'sine', 0.045);
  }

  /** Cada cuadro: ¿ya hizo lo del paso? y la flecha pegada a su punto de la tienda. */
  paso(dt: number) {
    if (this.terminado) return;
    this.reloj += dt;
    const p = PASOS[this.i];
    if (p.listo(this)) {
      if (this.i >= PASOS.length - 1) return this.terminar();
      return this.siguiente();
    }
    const d = p.donde?.(this);
    this.flecha.hidden = !d;
    // El globo se hace a un lado: al contrario de lo que señala la flecha (o de donde está el personaje)
    const g = this.raiz.querySelector('.ts-globo') as HTMLElement;
    const ref = d ?? this.j.jugador.pos;
    const s = this.mundo.aPantalla(aTres(ref.x, ref.y, d ? 1.4 : 1));
    if (d) this.flecha.style.transform = `translate(${s.x}px, ${s.y}px)`;
    const derecha = s.x < window.innerWidth / 2;
    if (g.classList.contains('derecha') !== derecha) g.classList.toggle('derecha', derecha);
  }

  terminar() {
    if (this.terminado) return;
    this.terminado = true;
    marcarVisto();
    this.j.congelado = false;
    this.raiz.remove();
    this.alTerminar();
  }

  /** Con la pausa encima, el globo se esconde. */
  ocultar(si: boolean) {
    this.raiz.hidden = si;
  }

  /** Si se sale de la partida a la mitad. */
  quitar() {
    this.terminado = true;
    this.raiz.remove();
  }
}
