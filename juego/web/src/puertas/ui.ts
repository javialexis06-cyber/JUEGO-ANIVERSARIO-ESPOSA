// Interfaz de Cien Puertas: globo del narrador, inventario, pistas, candados de ruedas, teclado numérico y notas.
import * as sonido from '../sonido';
import { iconoItem } from './kit';

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
export const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function mostrar(id: string, si = true) {
  $(id).hidden = !si;
}

// ---------------------------------------------------------------------------
// Globo de diálogo
// ---------------------------------------------------------------------------
export class Globo {
  private el = $('globo');
  private texto = $('globo-texto');
  private seguir = $('globo-seguir');
  private capa = $('dialogo');
  private chico = $('globo-chico');
  private timerChico = 0;
  /** Dónde apunta el globo (px); lo actualiza el narrador cada cuadro. */
  ancla = { x: 0, y: 0 };
  hablando = false;

  /** Muestra las líneas una por una (máquina de escribir) y espera un toque para cada una. */
  async decir(lineas: string[], alLetra?: (hablando: boolean) => void) {
    this.capa.hidden = false;
    this.el.hidden = false;
    for (const linea of lineas) {
      this.hablando = true;
      this.seguir.hidden = true;
      let saltar = false;
      const toque = () => (saltar = true);
      this.capa.addEventListener('pointerdown', toque);
      this.texto.textContent = '';
      for (let i = 1; i <= linea.length; i++) {
        if (saltar) {
          this.texto.textContent = linea;
          break;
        }
        this.texto.textContent = linea.slice(0, i);
        alLetra?.(i % 3 !== 0);
        if (i % 4 === 0) sonido.nota(520 + (i % 5) * 40, 0.03, 0, 'sine', 0.018);
        await pausa(/[.,!?…]/.test(linea[i - 1]) ? 110 : 26);
      }
      this.capa.removeEventListener('pointerdown', toque);
      alLetra?.(false);
      this.hablando = false;
      this.seguir.hidden = false;
      await new Promise<void>((listo) => {
        const fn = () => {
          this.capa.removeEventListener('pointerdown', fn);
          listo();
        };
        // Pequeña espera para que el toque que saltó la escritura no pase también la línea
        setTimeout(() => this.capa.addEventListener('pointerdown', fn), 180);
      });
      sonido.toque();
    }
    this.el.hidden = true;
    this.capa.hidden = true;
  }

  /** Globito que se va solo (ánimo en medio del acertijo, sin tapar el juego). */
  susurrar(texto: string, ms = 3400) {
    this.chico.textContent = texto;
    this.chico.hidden = false;
    this.chico.classList.remove('saliendo');
    clearTimeout(this.timerChico);
    this.timerChico = window.setTimeout(() => {
      this.chico.classList.add('saliendo');
      this.timerChico = window.setTimeout(() => (this.chico.hidden = true), 400);
    }, ms);
  }

  callar() {
    this.chico.hidden = true;
  }

  /** Sigue la cabeza del narrador en la pantalla. */
  ubicar(x: number, y: number) {
    this.ancla = { x, y };
    const w = window.innerWidth;
    for (const el of [this.el, this.chico]) {
      if (el.hidden) continue;
      const ancho = el.offsetWidth || 260;
      const izq = Math.min(Math.max(12, x + 18), w - ancho - 12);
      el.style.left = `${izq}px`;
      el.style.top = `${Math.max(12, y - el.offsetHeight - 8)}px`;
      el.style.setProperty('--cola', `${Math.max(16, Math.min(ancho - 24, x - izq))}px`);
    }
  }
}

// ---------------------------------------------------------------------------
// Inventario
// ---------------------------------------------------------------------------
export class Inventario {
  private el = $('inventario');
  items: string[] = [];
  elegido: string | null = null;
  alElegir: (item: string | null) => void = () => {};

  agregar(item: string) {
    this.items.push(item);
    this.pintar();
    sonido.caja();
  }

  quitar(item: string) {
    const i = this.items.indexOf(item);
    if (i >= 0) this.items.splice(i, 1);
    if (this.elegido === item) this.elegir(null);
    this.pintar();
  }

  vaciar() {
    this.items = [];
    this.elegir(null);
    this.pintar();
  }

  elegir(item: string | null) {
    this.elegido = item;
    this.alElegir(item);
    this.pintar();
  }

  /** Sacude el objeto elegido: «aquí no sirve». */
  noSirve() {
    const b = this.el.querySelector('.elegido');
    b?.classList.remove('no');
    void (b as HTMLElement | null)?.offsetWidth;
    b?.classList.add('no');
    sonido.vacia();
  }

  private pintar() {
    this.el.hidden = !this.items.length;
    this.el.innerHTML = this.items
      .map((it, i) => `<button class="ranura${this.elegido === it ? ' elegido' : ''}" data-item="${esc(it)}" data-i="${i}" aria-label="${esc(it)}">${iconoItem(it)}</button>`)
      .join('');
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('button')) {
      b.onclick = () => {
        sonido.toque();
        this.elegir(this.elegido === b.dataset.item ? null : b.dataset.item!);
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Paneles: candado de ruedas, teclado numérico y notas
// ---------------------------------------------------------------------------
export interface OpRuedas {
  titulo?: string;
  ruedas: string[][];
  inicial?: number[];
  correcto: string[] | ((v: string[]) => boolean);
  estilo?: 'candado' | 'maleta' | 'criptex' | 'colores';
}

export interface OpTeclado {
  titulo?: string;
  largo: number;
  correcto: string | ((v: string) => boolean);
  /** Teclas (por defecto 0–9). */
  teclas?: string[];
}

export class Paneles {
  private capa = $('panel');
  private carta = $('panel-carta');
  private cerrar: (() => void) | null = null;
  alFallar: () => void = () => {};
  abierto: 'ruedas' | 'teclado' | 'nota' | null = null;

  private abrir(tipo: 'ruedas' | 'teclado' | 'nota', html: string, clase = '') {
    this.cerrar?.();
    this.abierto = tipo;
    this.carta.className = `panel-carta ${tipo} ${clase}`;
    this.carta.innerHTML = `<button class="boton-redondo boton-cerrar panel-x" aria-label="Cerrar"></button>${html}`;
    this.capa.hidden = false;
    sonido.toque();
  }

  private finalizar() {
    this.capa.hidden = true;
    this.abierto = null;
    this.cerrar = null;
  }

  /** Cierra lo que esté abierto (como si tocaran la X). */
  quitar() {
    this.cerrar?.();
  }

  /** Candado de ruedas: se gira cada rueda con sus flechas; se abre solo al acertar. */
  ruedas(op: OpRuedas): Promise<boolean> {
    const vals = op.ruedas.map((_, i) => op.inicial?.[i] ?? 0);
    const celda = (v: string) => (/^#[0-9a-f]{6}$/i.test(v) ? `<i class="color" style="background:${v}"></i>` : esc(v));
    const html = `${op.titulo ? `<h3>${esc(op.titulo)}</h3>` : ''}<div class="ruedas estilo-${op.estilo ?? 'candado'}">${op.ruedas
      .map((r, i) => `<div class="rueda" data-r="${i}"><button class="flecha" data-d="-1" aria-label="Arriba">▲</button><b class="valor">${celda(r[vals[i]])}</b><button class="flecha" data-d="1" aria-label="Abajo">▼</button></div>`)
      .join('')}</div>`;
    return new Promise((listo) => {
      this.abrir('ruedas', html, `estilo-${op.estilo ?? 'candado'}`);
      let hecho = false;
      this.cerrar = () => {
        this.finalizar();
        if (!hecho) listo(false);
      };
      this.carta.querySelector<HTMLElement>('.panel-x')!.onclick = () => this.cerrar?.();
      for (const rueda of this.carta.querySelectorAll<HTMLElement>('.rueda')) {
        const i = Number(rueda.dataset.r);
        for (const b of rueda.querySelectorAll<HTMLButtonElement>('.flecha')) {
          b.onclick = () => {
            if (hecho) return;
            const r = op.ruedas[i];
            vals[i] = (vals[i] + Number(b.dataset.d) + r.length) % r.length;
            rueda.querySelector('.valor')!.innerHTML = celda(r[vals[i]]);
            sonido.nota(900 + i * 60, 0.03, 0, 'square', 0.03);
            const actual = vals.map((v, k) => op.ruedas[k][v]);
            const ok = typeof op.correcto === 'function' ? op.correcto(actual) : actual.every((v, k) => v === (op.correcto as string[])[k]);
            if (ok) {
              hecho = true;
              this.carta.classList.add('acierto');
              sonido.atrapado();
              setTimeout(() => {
                this.finalizar();
                listo(true);
              }, 650);
            }
          };
        }
      }
    });
  }

  /** Teclado numérico: se comprueba al completar los dígitos. */
  teclado(op: OpTeclado): Promise<boolean> {
    const teclas = op.teclas ?? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', ''];
    const html = `${op.titulo ? `<h3>${esc(op.titulo)}</h3>` : ''}<div class="pantallita" aria-live="polite">${'<i></i>'.repeat(op.largo)}</div>
      <div class="teclas">${teclas.map((t) => (t ? `<button class="tecla" data-t="${esc(t)}">${esc(t)}</button>` : '<span></span>')).join('')}</div>`;
    return new Promise((listo) => {
      this.abrir('teclado', html);
      let v = '';
      let hecho = false;
      this.cerrar = () => {
        this.finalizar();
        if (!hecho) listo(false);
      };
      this.carta.querySelector<HTMLElement>('.panel-x')!.onclick = () => this.cerrar?.();
      const pintar = () => {
        const cajas = this.carta.querySelectorAll('.pantallita i');
        cajas.forEach((c, i) => (c.textContent = v[i] ?? ''));
      };
      for (const b of this.carta.querySelectorAll<HTMLButtonElement>('.tecla')) {
        b.onclick = () => {
          if (hecho) return;
          const t = b.dataset.t!;
          sonido.nota(700 + (Number(t) || 0) * 40, 0.05, 0, 'square', 0.03);
          if (t === '⌫') v = v.slice(0, -1);
          else if (v.length < op.largo) v += t;
          pintar();
          if (v.length === op.largo) {
            const ok = typeof op.correcto === 'function' ? op.correcto(v) : v === op.correcto;
            if (ok) {
              hecho = true;
              this.carta.classList.add('acierto');
              sonido.atrapado();
              setTimeout(() => {
                this.finalizar();
                listo(true);
              }, 650);
            } else {
              this.carta.classList.remove('error');
              void this.carta.offsetWidth;
              this.carta.classList.add('error');
              sonido.vacia();
              this.alFallar();
              setTimeout(() => {
                v = '';
                pintar();
              }, 450);
            }
          }
        };
      }
    });
  }

  /** Nota, foto o dibujo para mirar de cerca. */
  nota(html: string, clase = ''): Promise<void> {
    return new Promise((listo) => {
      this.abrir('nota', `<div class="nota-cuerpo">${html}</div>`, clase);
      this.cerrar = () => {
        this.finalizar();
        listo();
      };
      this.carta.querySelector<HTMLElement>('.panel-x')!.onclick = () => this.cerrar?.();
      this.capa.onclick = (e) => {
        if (e.target === this.capa) this.cerrar?.();
      };
    });
  }

  // --- Para las pruebas -----------------------------------------------------
  async escribir(valor: string) {
    if (this.abierto === 'teclado') {
      for (const ch of valor) {
        this.carta.querySelector<HTMLButtonElement>(`.tecla[data-t="${CSS.escape(ch)}"]`)?.click();
        await pausa(60);
      }
      return;
    }
    if (this.abierto === 'ruedas') {
      const partes = valor.includes('|') ? valor.split('|') : [...valor];
      const ruedas = [...this.carta.querySelectorAll<HTMLElement>('.rueda')];
      for (let i = 0; i < ruedas.length; i++) {
        const abajo = ruedas[i].querySelector<HTMLButtonElement>('.flecha[data-d="1"]')!;
        for (let k = 0; k < 40; k++) {
          const v = ruedas[i].querySelector('.valor')!;
          const actual = v.querySelector('i') ? (v.querySelector('i') as HTMLElement).style.background : v.textContent;
          if (mismo(actual ?? '', partes[i]) || !this.abierto) break;
          abajo.click();
          await pausa(20);
        }
      }
    }
  }
}

function mismo(a: string, b: string) {
  if (a === b) return true;
  if (/^#/.test(b) && /^rgb/.test(a)) {
    const n = parseInt(b.slice(1), 16);
    return a.replace(/\s/g, '') === `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
  }
  return false;
}

export const pausa = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Aviso corto arriba (no es del narrador): «Sostén el celular quieto». */
let timerAviso = 0;
export function aviso(texto: string, ms = 2600) {
  const el = $('aviso');
  el.textContent = texto;
  el.hidden = false;
  clearTimeout(timerAviso);
  timerAviso = window.setTimeout(() => (el.hidden = true), ms);
}
