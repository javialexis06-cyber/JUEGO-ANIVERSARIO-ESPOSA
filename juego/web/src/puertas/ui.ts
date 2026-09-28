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

  private yo = $('globo-yo');
  private yoTexto = $('globo-yo-texto');
  private yoNombre = $('globo-yo-nombre');
  private yoSeguir = $('globo-yo-seguir');

  /** Muestra las líneas una por una (máquina de escribir) y espera un toque para cada una.
   *  Una línea con `jugador` la dice quien juega (globo de abajo, con su nombre). */
  async decir(lineas: (string | { texto: string; jugador: string })[], alLetra?: (hablando: boolean, jugador: boolean) => void) {
    this.capa.hidden = false;
    for (const l of lineas) {
      const linea = typeof l === 'string' ? l : l.texto;
      const deJugador = typeof l !== 'string';
      const texto = deJugador ? this.yoTexto : this.texto;
      const seguir = deJugador ? this.yoSeguir : this.seguir;
      this.el.hidden = deJugador;
      this.yo.hidden = !deJugador;
      if (deJugador) this.yoNombre.textContent = l.jugador;
      this.hablando = true;
      seguir.hidden = true;
      let saltar = false;
      const toque = () => (saltar = true);
      this.capa.addEventListener('pointerdown', toque);
      texto.textContent = '';
      for (let i = 1; i <= linea.length; i++) {
        if (saltar) {
          texto.textContent = linea;
          break;
        }
        texto.textContent = linea.slice(0, i);
        alLetra?.(i % 3 !== 0, deJugador);
        if (i % 4 === 0) sonido.nota((deJugador ? 440 : 520) + (i % 5) * 40, 0.03, 0, 'sine', 0.018);
        await pausa(/[.,!?…]/.test(linea[i - 1]) ? 110 : 26);
      }
      this.capa.removeEventListener('pointerdown', toque);
      alLetra?.(false, deJugador);
      this.hablando = false;
      seguir.hidden = false;
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
    this.yo.hidden = true;
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

/** Tarjeta de «Recuerdo recuperado» (se cierra tocando). */
export function tarjetaRecuerdo(r: { titulo: string; fecha: string; icono: string }, n: number, total: number): Promise<void> {
  const capa = $('recuerdo');
  capa.innerHTML = `<article class="polaroid"><span class="recuerdo-cinta">Recuerdo recuperado · ${n} de ${total}</span>
    <div class="recuerdo-dibujo">${DIBUJOS[r.icono] ?? DIBUJOS.corazon}</div>
    <h3>${esc(r.titulo)}</h3><p>${esc(r.fecha)}</p><small>toca para recordar ▸</small></article>`;
  capa.hidden = false;
  sonido.regalo();
  return new Promise((listo) => {
    setTimeout(() => {
      capa.onclick = () => {
        capa.onclick = null;
        capa.hidden = true;
        sonido.toque();
        listo();
      };
    }, 400);
  });
}

/** Dibujitos de los recuerdos. */
export const DIBUJOS: Record<string, string> = {
  raton: '<svg viewBox="0 0 120 100"><circle cx="30" cy="30" r="20" fill="#c9b6ea" stroke="#3d2b27" stroke-width="4"/><circle cx="90" cy="30" r="20" fill="#c9b6ea" stroke="#3d2b27" stroke-width="4"/><ellipse cx="60" cy="58" rx="38" ry="32" fill="#e8e0d4" stroke="#3d2b27" stroke-width="4"/><circle cx="46" cy="52" r="5" fill="#3d2b27"/><circle cx="74" cy="52" r="5" fill="#3d2b27"/><circle cx="60" cy="66" r="6" fill="#e86a8a"/><path d="M40 70l-22 4M40 76l-20 10M80 70l22 4M80 76l20 10" stroke="#3d2b27" stroke-width="3" stroke-linecap="round"/><path d="M60 12c6-8 16-4 12 4-2 4-12 10-12 10s-10-6-12-10c-4-8 6-12 12-4z" fill="#e4574b"/></svg>',
  charla: '<svg viewBox="0 0 120 100"><path d="M10 14h64a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8H36l-14 12V56H18a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z" fill="#9ccbef" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round"/><text x="46" y="42" font-size="20" text-anchor="middle" font-family="sans-serif" fill="#3d2b27">π ∞</text><path d="M110 40H56a8 8 0 0 0-8 8v22a8 8 0 0 0 8 8h36l14 12V78h4a8 8 0 0 0 0-16z" fill="#f4b6c2" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round"/><text x="80" y="66" font-size="20" text-anchor="middle" fill="#e4574b">♥</text></svg>',
  calendario: '<svg viewBox="0 0 120 100"><rect x="22" y="16" width="76" height="72" rx="10" fill="#fff8ee" stroke="#3d2b27" stroke-width="4"/><rect x="22" y="16" width="76" height="20" rx="10" fill="#e4574b"/><text x="60" y="30" font-size="12" text-anchor="middle" fill="#fff" font-family="sans-serif">OCTUBRE</text><text x="60" y="70" font-size="30" text-anchor="middle" fill="#3d2b27" font-family="sans-serif" font-weight="700">25</text><text x="86" y="84" font-size="16" fill="#e4574b">♥</text></svg>',
  ojos: '<svg viewBox="0 0 120 100"><circle cx="60" cy="50" r="40" fill="#f7d2b6" stroke="#3d2b27" stroke-width="4"/><path d="M44 44c-8-10-20 0-8 12l8 8 8-8c12-12 0-22-8-12zM80 44c-8-10-20 0-8 12l8 8 8-8c12-12 0-22-8-12z" fill="#e4574b"/><path d="M44 72q16 12 32 0" stroke="#3d2b27" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
  ola: '<svg viewBox="0 0 120 100"><path d="M0 70q15-14 30 0t30 0 30 0 30 0v30H0z" fill="#4aa6d8"/><path d="M28 60l40-16 26 10-10 10H34z" fill="#e4574b" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round"/><circle cx="62" cy="34" r="8" fill="#f7d2b6" stroke="#3d2b27" stroke-width="3"/><path d="M94 20l6 10M100 14l6 12" stroke="#8a94b8" stroke-width="4" stroke-linecap="round"/><path d="M84 12q10-10 20 0" stroke="#6a7a9a" stroke-width="5" fill="none"/></svg>',
  luces: '<svg viewBox="0 0 120 100"><path d="M6 20q54 40 108 0" stroke="#3d2b27" stroke-width="3" fill="none"/><g stroke="#3d2b27" stroke-width="2"><circle cx="20" cy="34" r="7" fill="#f7c948"/><circle cx="40" cy="42" r="7" fill="#e4574b"/><circle cx="60" cy="45" r="7" fill="#8fd3b6"/><circle cx="80" cy="42" r="7" fill="#9ccbef"/><circle cx="100" cy="34" r="7" fill="#f59fc0"/></g><circle cx="60" cy="78" r="12" fill="#1e1a18"/><circle cx="48" cy="66" r="8" fill="#1e1a18"/><circle cx="72" cy="66" r="8" fill="#1e1a18"/></svg>',
  antifaz: '<svg viewBox="0 0 120 100"><path d="M14 40q46-20 92 0-4 26-26 26-12 0-20-10-8 10-20 10-22 0-26-26z" fill="#3b2f5c" stroke="#f2c75c" stroke-width="4"/><ellipse cx="40" cy="46" rx="10" ry="7" fill="#fff8ee"/><ellipse cx="80" cy="46" rx="10" ry="7" fill="#fff8ee"/><path d="M60 70l-18 26h36z" fill="#e86a8a" stroke="#3d2b27" stroke-width="3"/></svg>',
  copa: '<svg viewBox="0 0 120 100"><path d="M30 14h26q2 28-13 30Q28 42 30 14z" fill="#f7d6c0" stroke="#3d2b27" stroke-width="4"/><path d="M43 44v34M32 80h22" stroke="#3d2b27" stroke-width="4" stroke-linecap="round"/><path d="M64 14h26q2 28-13 30-15-2-13-30z" fill="#f7d6c0" stroke="#3d2b27" stroke-width="4"/><path d="M77 44v34M66 80h22" stroke="#3d2b27" stroke-width="4" stroke-linecap="round"/><path d="M60 8l4 8 8 1-6 5 2 8-8-4-8 4 2-8-6-5 8-1z" fill="#f2c75c"/></svg>',
  estrellas: '<svg viewBox="0 0 120 100"><path d="M10 90a50 50 0 0 1 100 0z" fill="#26375E" stroke="#3d2b27" stroke-width="4"/><g fill="#fff6c8"><circle cx="40" cy="60" r="3"/><circle cx="60" cy="50" r="4"/><circle cx="78" cy="64" r="3"/><circle cx="52" cy="74" r="2"/><circle cx="88" cy="80" r="2"/><circle cx="30" cy="80" r="2"/></g><path d="M40 60L60 50 78 64" stroke="#fff6c8" stroke-width="1.5"/></svg>',
  anillo: '<svg viewBox="0 0 120 100"><circle cx="60" cy="62" r="26" fill="none" stroke="#f2c75c" stroke-width="10"/><path d="M48 30l12-16 12 16-12 10z" fill="#bfe9ff" stroke="#3d2b27" stroke-width="3" stroke-linejoin="round"/><path d="M92 20c4-6 12-2 9 4-2 3-9 8-9 8s-7-5-9-8c-3-6 5-10 9-4z" fill="#e4574b"/></svg>',
  lupa: '<svg viewBox="0 0 120 100"><circle cx="50" cy="42" r="26" fill="#dff1fb" stroke="#3d2b27" stroke-width="6"/><path d="M69 61l24 24" stroke="#3d2b27" stroke-width="10" stroke-linecap="round"/><circle cx="36" cy="42" r="7" fill="#c9b6ea" stroke="#3d2b27" stroke-width="3"/><circle cx="62" cy="42" r="7" fill="#c9b6ea" stroke="#3d2b27" stroke-width="3"/><ellipse cx="49" cy="48" rx="12" ry="10" fill="#e8e0d4" stroke="#3d2b27" stroke-width="3"/><path d="M92 18c3-5 10-2 8 3-2 3-8 7-8 7s-6-4-8-7c-2-5 5-8 8-3z" fill="#e4574b"/></svg>',
  videollamada: '<svg viewBox="0 0 120 100"><rect x="12" y="14" width="44" height="72" rx="8" fill="#fff8ee" stroke="#3d2b27" stroke-width="4"/><rect x="64" y="14" width="44" height="72" rx="8" fill="#fff8ee" stroke="#3d2b27" stroke-width="4"/><circle cx="34" cy="44" r="12" fill="#f7d2b6" stroke="#3d2b27" stroke-width="3"/><path d="M22 40q12-18 24 0" fill="#1e1a18"/><circle cx="86" cy="44" r="12" fill="#f7d2b6" stroke="#3d2b27" stroke-width="3"/><path d="M76 38q10-12 20 0" fill="#5e3d28"/><path d="M60 60c3-5 10-2 8 3-2 3-8 7-8 7s-6-4-8-7c-2-5 5-8 8-3z" fill="#e4574b"/><text x="60" y="30" font-size="12" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#3d2b27">24h</text></svg>',
  lapiz: '<svg viewBox="0 0 120 100"><rect x="14" y="26" width="50" height="62" rx="4" fill="#9ccbef" stroke="#3d2b27" stroke-width="4"/><path d="M22 40h34M22 52h34M22 64h24" stroke="#3d2b27" stroke-width="3" stroke-linecap="round"/><path d="M70 80l6-22 34-34 14 14-34 34z" fill="#f7c948" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round" transform="translate(-10 0)"/><path d="M66 80l2-10 8 8z" fill="#3d2b27"/><circle cx="96" cy="82" r="8" fill="#e4574b" stroke="#3d2b27" stroke-width="3"/><circle cx="84" cy="88" r="5" fill="#8fd3b6" stroke="#3d2b27" stroke-width="3"/></svg>',
  birrete: '<svg viewBox="0 0 120 100"><path d="M60 16l50 20-50 20-50-20z" fill="#3b2f5c" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round"/><path d="M32 46v18q28 16 56 0V46" fill="#3b2f5c" stroke="#3d2b27" stroke-width="4"/><path d="M100 40v26" stroke="#f2c75c" stroke-width="4"/><circle cx="100" cy="70" r="5" fill="#f2c75c"/><text x="60" y="44" font-size="18" text-anchor="middle" fill="#f59fc0" font-family="serif" font-weight="700">Ψ</text><path d="M20 78h20v14H20zM16 78h28" stroke="#3d2b27" stroke-width="3" fill="#f59fc0"/><path d="M30 70v8" stroke="#e4574b" stroke-width="3"/></svg>',
  trofeo: '<svg viewBox="0 0 120 100"><path d="M38 14h44v20a22 22 0 0 1-44 0z" fill="#f2c75c" stroke="#3d2b27" stroke-width="4"/><path d="M38 20H24q0 18 16 20M82 20h14q0 18-16 20" fill="none" stroke="#3d2b27" stroke-width="4"/><path d="M60 56v14M44 86h32l-4-16H48z" fill="#f2c75c" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round"/><path d="M60 22l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff8ee"/></svg>',
  flor: '<svg viewBox="0 0 120 100"><path d="M60 92V52" stroke="#3c7a62" stroke-width="5"/><path d="M60 76q-18-2-22-16 18 0 22 16zM60 70q16-4 22-16-18 2-22 16z" fill="#8fd3b6" stroke="#3d2b27" stroke-width="3"/><g fill="#f59fc0" stroke="#3d2b27" stroke-width="3"><circle cx="60" cy="18" r="12"/><circle cx="78" cy="32" r="12"/><circle cx="72" cy="52" r="12"/><circle cx="48" cy="52" r="12"/><circle cx="42" cy="32" r="12"/></g><circle cx="60" cy="36" r="10" fill="#f7c948" stroke="#3d2b27" stroke-width="3"/><circle cx="100" cy="16" r="8" fill="#f7c948"/><path d="M100 2v6M100 24v6M86 16h6M108 16h6" stroke="#f7c948" stroke-width="3" stroke-linecap="round"/></svg>',
  bus: '<svg viewBox="0 0 120 100"><rect x="14" y="26" width="92" height="50" rx="10" fill="#f7c948" stroke="#3d2b27" stroke-width="4"/><rect x="22" y="34" width="18" height="16" rx="3" fill="#dff1fb" stroke="#3d2b27" stroke-width="3"/><rect x="46" y="34" width="18" height="16" rx="3" fill="#dff1fb" stroke="#3d2b27" stroke-width="3"/><rect x="70" y="34" width="18" height="16" rx="3" fill="#dff1fb" stroke="#3d2b27" stroke-width="3"/><circle cx="34" cy="78" r="9" fill="#3d2b27"/><circle cx="86" cy="78" r="9" fill="#3d2b27"/><path d="M56 62c3-5 10-2 8 3-2 3-8 7-8 7s-6-4-8-7c-2-5 5-8 8-3z" fill="#e4574b"/><text x="60" y="20" font-size="12" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#3d2b27">8 h… ¿9?</text></svg>',
  castillo: '<svg viewBox="0 0 120 100"><path d="M24 90V40h14v10h10V40h24v10h10V40h14v50z" fill="#c9b6ea" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round"/><path d="M50 90V70a10 10 0 0 1 20 0v20" fill="#5e3d28" stroke="#3d2b27" stroke-width="3"/><path d="M24 40l7-16 7 16M82 40l7-16 7 16" fill="#f59fc0" stroke="#3d2b27" stroke-width="3" stroke-linejoin="round"/><path d="M60 16v18M60 16l14 5-14 5" stroke="#3d2b27" stroke-width="3" fill="#e4574b"/><path d="M60 52c2-4 8-2 6 2-1 3-6 6-6 6s-5-3-6-6c-2-4 4-6 6-2z" fill="#e4574b"/></svg>',
  casa: '<svg viewBox="0 0 120 100"><path d="M18 50L60 14l42 36" fill="none" stroke="#3d2b27" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 44v44h64V44L60 18z" fill="#fff3e0" stroke="#3d2b27" stroke-width="4" stroke-linejoin="round"/><path d="M60 78C44 68 40 60 40 54a10 10 0 0 1 20-3 10 10 0 0 1 20 3c0 6-4 14-20 24z" fill="#e4574b" stroke="#3d2b27" stroke-width="3"/><path d="M84 30V16h8v20" fill="#c49468" stroke="#3d2b27" stroke-width="3"/></svg>',
  familia: '<svg viewBox="0 0 120 100"><path d="M40 70C18 56 12 44 12 36a14 14 0 0 1 28-4 14 14 0 0 1 28 4c0 8-6 20-28 34z" fill="#e4574b" stroke="#3d2b27" stroke-width="4"/><path d="M80 70C58 56 52 44 52 36a14 14 0 0 1 28-4 14 14 0 0 1 28 4c0 8-6 20-28 34z" fill="#f59fc0" stroke="#3d2b27" stroke-width="4"/><path d="M60 94C50 88 46 82 46 78a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 4-4 10-14 16z" fill="#f7c948" stroke="#3d2b27" stroke-width="3"/><path d="M56 20q4-10 8 0-4 4-8 0z" fill="#c9b6ea" stroke="#3d2b27" stroke-width="2"/></svg>',
  corazon: '<svg viewBox="0 0 120 100"><path d="M60 88C24 64 14 46 14 32a22 22 0 0 1 46-6 22 22 0 0 1 46 6c0 14-10 32-46 56z" fill="#e4574b" stroke="#3d2b27" stroke-width="4"/></svg>',
};

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
