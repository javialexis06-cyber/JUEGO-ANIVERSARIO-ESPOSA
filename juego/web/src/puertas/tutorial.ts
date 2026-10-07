// El tutorial de Cien Puertas: la primera vez, la puerta 1 se juega con un globo que va diciendo qué hacer y una
// flecha que señala: correr el tapete, leer la notica, buscar en el abrigo, guardar la llave y usarla en la puerta.
// Cada paso espera a que se haga de verdad (no basta con leer) y siempre se puede saltar.
import * as THREE from 'three';

const CLAVE = 'cien-puertas-tutorial';
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

/** Lo que el tutorial mira del juego. */
export interface Ganchos {
  /** Dónde se ve (en la pantalla) el objeto `nombre`; null si no está. */
  donde(nombre: string): { x: number; y: number } | null;
  obj(nombre: string): THREE.Object3D | null;
  items(): string[];
  elegido(): string | null;
  panelAbierto(): boolean;
  /** Ya se resolvió la puerta. */
  resuelta(): boolean;
}

interface Paso {
  titulo: string;
  texto: string;
  entrar?: (t: TutorialPuertas) => void;
  listo: (t: TutorialPuertas) => boolean;
  /** Adónde apunta la flecha (en la pantalla). */
  donde: (t: TutorialPuertas) => { x: number; y: number } | null;
}

const PASOS: Paso[] = [
  {
    titulo: 'Toca y arrastra',
    texto: 'Aquí las cosas se tocan y se mueven. Arrastra el tapete con el dedo para correrlo.',
    entrar: (t) => (t.tapete = t.g.obj('tapete')?.position.clone() ?? null),
    listo: (t) => {
      const o = t.g.obj('tapete');
      return !o || !t.tapete || o.position.distanceTo(t.tapete) > 0.3;
    },
    donde: (t) => t.g.donde('tapete'),
  },
  {
    titulo: 'Lee lo que encuentres',
    texto: 'Debajo había una notica. Tócala para leerla (las noticas y los cuadritos siempre dicen algo).',
    listo: (t) => t.g.panelAbierto(),
    donde: (t) => t.g.donde('nota tapete'),
  },
  {
    titulo: 'Busca en la entrada',
    texto: 'Dice que la llave quedó en un bolsillo. Toca el abrigo del perchero.',
    listo: (t) => !t.g.panelAbierto() && !!t.g.obj('llave')?.visible,
    donde: (t) => (t.g.panelAbierto() ? null : t.g.donde('abrigo')),
  },
  {
    titulo: 'Guárdala',
    texto: '¡Se cayó la llave! Tócala: se guarda en tu bolsillo, aquí abajo.',
    listo: (t) => t.g.items().includes('llave'),
    donde: (t) => t.g.donde('llave'),
  },
  {
    titulo: 'Úsala en la puerta',
    texto: 'Toca la llave en tu bolsillo y después la cerradura de la puerta. Si alguna vez te enredas, el dulce 🍬 de arriba se cambia por una pista.',
    listo: (t) => t.g.resuelta(),
    donde: (t) => {
      if (t.g.elegido() === 'llave') return t.g.donde('puerta toque');
      const r = document.querySelector('#inventario [data-item="llave"]')?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + 4 } : null;
    },
  },
];

export class TutorialPuertas {
  i = -1;
  tapete: THREE.Vector3 | null = null;
  private raiz: HTMLElement;
  private flecha: HTMLElement;
  private globo: HTMLElement;
  terminado = false;

  constructor(public g: Ganchos) {
    this.raiz = document.createElement('div');
    this.raiz.className = 'tuto-puertas';
    this.raiz.innerHTML = `
      <div class="tp-globo" role="dialog" aria-live="polite">
        <small class="tp-paso"></small><b class="tp-titulo"></b><p class="tp-texto"></p>
        <button class="tp-saltar">Saltar tutorial</button>
      </div>
      <div class="tp-flecha" hidden><span></span></div>`;
    document.body.append(this.raiz);
    this.flecha = this.raiz.querySelector('.tp-flecha')!;
    this.globo = this.raiz.querySelector('.tp-globo')!;
    this.raiz.querySelector('.tp-saltar')!.addEventListener('click', () => this.terminar());
    this.siguiente();
  }

  private siguiente() {
    this.i++;
    const p = PASOS[this.i];
    p.entrar?.(this);
    this.raiz.querySelector('.tp-paso')!.textContent = `Cómo se juega · ${this.i + 1} de ${PASOS.length}`;
    this.raiz.querySelector('.tp-titulo')!.textContent = p.titulo;
    this.raiz.querySelector('.tp-texto')!.textContent = p.texto;
    this.globo.classList.remove('entra');
    void this.globo.offsetWidth;
    this.globo.classList.add('entra');
  }

  /** Cada cuadro: ¿ya lo hizo? y la flecha pegada a lo que hay que tocar. */
  paso() {
    if (this.terminado) return;
    const p = PASOS[this.i];
    if (p.listo(this)) {
      if (this.i >= PASOS.length - 1) return this.terminar();
      return this.siguiente();
    }
    let d: { x: number; y: number } | null = null;
    try {
      d = p.donde(this);
    } catch {
      d = null;
    }
    this.flecha.hidden = !d;
    if (d) this.flecha.style.transform = `translate(${d.x}px, ${d.y}px)`;
    // El globo se hace al lado contrario de lo que señala
    const derecha = !d || d.x < window.innerWidth / 2;
    if (this.globo.classList.contains('derecha') !== derecha) this.globo.classList.toggle('derecha', derecha);
    // Con un candado o una nota abierta, el globo se esconde
    this.raiz.classList.toggle('debajo', this.g.panelAbierto() && this.i !== 1);
  }

  terminar() {
    if (this.terminado) return;
    this.terminado = true;
    marcarVisto();
    this.raiz.remove();
  }

  /** Si se sale de la puerta a la mitad (el tutorial vuelve la próxima vez). */
  quitar() {
    this.terminado = true;
    this.raiz.remove();
  }
}
