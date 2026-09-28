// Vista de Puntos y Cajas: hoja de cuaderno cuadriculada con margen rojo, puntos de tinta, líneas de marcador
// que se trazan solas y cajas que se colorean con una estrella (Él) o un corazón (Ella).
// Se toca cerca de una línea libre (la más cercana al dedo): mientras el dedo está abajo se ve la línea
// fantasma y se traza al soltar.
import './cajas.css';
import { otro, type Rol } from '../../casa/modelo';
import * as sonido from '../../sonido';
import type { CtxVista, Suceso, Vista } from '../tipos';
import { type EstadoCajas, type MovCajas, geo, haySegura, listas, regalo, reglas } from './reglas';

const NS = 'http://www.w3.org/2000/svg';
/** Lado de una caja y margen alrededor de los puntos, en unidades del dibujo. */
const U = 100;
const M = 34;
/** Tira del margen rojo (con los huecos de la hoja) a la izquierda, en px. */
const TIRA = 22;
const params = new URLSearchParams(location.search);
const RAPIDO = Math.max(1, Number(params.get('rapido')) || 1);
const REDUCIDO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ms = (x: number) => (x / RAPIDO) * (REDUCIDO ? 0.6 : 1);
const esperar = (x: number) => new Promise<void>((r) => setTimeout(r, ms(x)));

const T_TRAZO = 260;
const T_CAJA = 420;

/** Corazón y estrella centrados en 0,0 (unos 50 de alto). */
const CORAZON = 'M0 22C-9 15-30 3-30-10C-30-21-21-27-13-27C-6-27-2-23 0-18C2-23 6-27 13-27C21-27 30-21 30-10C30 3 9 15 0 22Z';
const ESTRELLA = (() => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 13 : 29;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r + 2).toFixed(1)}`;
  }
  return d + 'Z';
})();
const simbolo = (q: Rol) => (q === 'el' ? ESTRELLA : CORAZON);
const LAPIZ = `<svg class="cajas-lapiz" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z" fill="#f6cf5a" stroke="#3d2b27" stroke-width="2" stroke-linejoin="round"/><path d="M14 6.6l3.4 3.4" stroke="#3d2b27" stroke-width="2"/><path d="M4 20l1.2-4.6 3.4 3.4z" fill="#3d2b27"/></svg>`;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, padre?: Element): SVGElementTagNameMap[K] {
  const x = document.createElementNS(NS, tag);
  for (const k in attrs) x.setAttribute(k, String(attrs[k]));
  padre?.append(x);
  return x;
}

/** Distancia de un punto a un segmento. */
function distancia(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - x1 - t * dx, y - y1 - t * dy);
}

class VistaCajas implements Vista<EstadoCajas, MovCajas> {
  private e!: EstadoCajas;
  private cont: HTMLElement;
  private hoja: HTMLElement;
  private svg!: SVGSVGElement;
  private capas!: Record<'celdas' | 'cajas' | 'guias' | 'ultima' | 'trazos' | 'fantasma' | 'puntos', SVGGElement>;
  private celdas: SVGRectElement[] = [];
  private guias: (SVGPathElement | null)[] = [];
  private ultima!: SVGPathElement;
  private fantasma!: SVGGElement;
  private fantasmaLinea!: SVGPathElement;
  private fantasmaPuntos!: SVGCircleElement[];
  private fichas: Record<Rol, HTMLElement>;
  private quedan: HTMLElement;
  private nota: HTMLElement;
  private permitido: Rol | null = null;
  private animando = false;
  private puntero: number | null = null;
  private candidato = -1;
  /** Cajas seguidas que lleva cerrando el que juega (para la cadena y el «turno extra» una sola vez). */
  private racha = { quien: null as Rol | null, n: 0 };
  private ro: ResizeObserver;

  constructor(private ctx: CtxVista<MovCajas>) {
    const r = ctx.raiz;
    r.innerHTML = `<div class="cajas">
      <div class="cajas-hoja"><i class="cajas-cinta cajas-cinta-a"></i><i class="cajas-cinta cajas-cinta-b"></i>
        <p class="cajas-nota" hidden>Toca entre dos puntos y suelta para trazar</p></div>
      <div class="cajas-fichas"></div>
    </div>`;
    this.cont = r.querySelector('.cajas')!;
    this.hoja = r.querySelector('.cajas-hoja')!;
    this.nota = r.querySelector('.cajas-nota')!;
    const fichas = r.querySelector('.cajas-fichas')!;
    const nombre = (q: Rol) => (ctx.modo !== 'local' && q === ctx.yo ? 'Tú' : ctx.nombres[q]);
    const ficha = (q: Rol) =>
      `<div class="cajas-ficha" data-quien="${q}"><svg class="cajas-ficha-simbolo" viewBox="-34 -32 68 62" aria-hidden="true"><path d="${simbolo(q)}"/></svg>
        <span class="cajas-ficha-nombre">${nombre(q)}</span><b class="cajas-ficha-cuenta">0</b>${LAPIZ}</div>`;
    fichas.innerHTML = `${ficha(ctx.yo)}<span class="cajas-quedan"></span>${ficha(otro(ctx.yo))}`;
    this.fichas = { el: fichas.querySelector('[data-quien="el"]')!, ella: fichas.querySelector('[data-quien="ella"]')! };
    this.quedan = fichas.querySelector('.cajas-quedan')!;

    const h = this.hoja;
    h.addEventListener('pointerdown', this.alBajar);
    h.addEventListener('pointermove', this.alMover);
    h.addEventListener('pointerup', this.alSubir);
    h.addEventListener('pointercancel', this.alCancelar);
    h.addEventListener('pointerleave', this.alSalir);
    this.ro = new ResizeObserver(() => this.medir());
    this.ro.observe(r);
  }

  // -------------------------------------------------------------------------
  // Pintar

  pintar(e: EstadoCajas) {
    this.e = e;
    this.racha = { quien: null, n: 0 };
    const g = geo(e);
    const vw = g.columnas * U + 2 * M, vh = g.filas * U + 2 * M;
    this.svg?.remove();
    const svg = (this.svg = el('svg', { class: 'cajas-svg', viewBox: `0 0 ${vw} ${vh}`, 'aria-label': 'Tablero de puntos y cajas' }));
    svg.innerHTML = `<defs>
      <pattern id="cajas-trama-el" patternUnits="userSpaceOnUse" width="11" height="11" patternTransform="rotate(-38)"><rect width="11" height="11"/><path d="M0 0V11"/></pattern>
      <pattern id="cajas-trama-ella" patternUnits="userSpaceOnUse" width="11" height="11" patternTransform="rotate(38)"><rect width="11" height="11"/><path d="M0 0V11"/></pattern>
    </defs>`;
    const capa = (n: string) => el('g', { class: `cajas-${n}` }, svg);
    this.capas = { celdas: capa('celdas'), cajas: capa('cajas'), guias: capa('guias'), ultima: capa('ultimas'), trazos: capa('trazos'), fantasma: capa('fantasmas'), puntos: capa('puntos') };
    this.hoja.prepend(svg);

    this.celdas = [];
    for (let b = 0; b < g.nc; b++) {
      const r = Math.floor(b / g.columnas), c = b % g.columnas;
      this.celdas.push(el('rect', { class: 'cajas-celda', x: M + c * U + 9, y: M + r * U + 9, width: U - 18, height: U - 18, rx: 12 }, this.capas.celdas));
      if (e.cajas[b]) this.dibujarCaja(b, e.cajas[b]!, false);
    }
    this.guias = [];
    for (let l = 0; l < g.nl; l++) {
      const [r1, c1] = g.puntos[l];
      this.guias.push(e.lineas[l] ? null : el('path', { class: 'cajas-guia', d: this.camino(l), style: `--i:${r1 + c1}` }, this.capas.guias));
      if (e.lineas[l]) this.dibujarTrazo(l, e.lineas[l]!, false);
    }
    this.ultima = el('path', { class: 'cajas-ultima', d: '' }, this.capas.ultima);
    this.ultima.style.display = 'none';
    if (e.ultima >= 0) this.marcarUltima(e.ultima, false);
    this.fantasma = el('g', { class: 'cajas-fantasma' }, this.capas.fantasma);
    this.fantasma.style.display = 'none';
    this.fantasmaLinea = el('path', { class: 'cajas-fantasma-linea', d: '' }, this.fantasma);
    this.fantasmaPuntos = [0, 1].map(() => el('circle', { class: 'cajas-fantasma-punto', r: 17 }, this.fantasma));
    for (let r = 0; r <= g.filas; r++)
      for (let c = 0; c <= g.columnas; c++) {
        const p = el('g', { class: 'cajas-punto', transform: `translate(${M + c * U} ${M + r * U})` }, this.capas.puntos);
        el('circle', { r: 8.5 }, p);
        el('circle', { class: 'cajas-punto-brillo', r: 2.6, cx: -2.6, cy: -2.8 }, p);
      }
    this.pintarFichas();
    this.marcarListas();
    this.medir();
  }

  /** Acomoda la hoja al espacio (a lo alto en el celular, con las fichas al lado si es apaisado). */
  private medir() {
    if (!this.e) return;
    const r = this.ctx.raiz;
    const cs = getComputedStyle(r);
    const w = r.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const h = r.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (w <= 0 || h <= 0) return;
    const g = geo(this.e);
    const vw = g.columnas * U + 2 * M, vh = g.filas * U + 2 * M;
    const ancho = w > h * 1.3;
    this.cont.classList.toggle('cajas-ancho', ancho);
    const arriba = 8; // lo que asoman las cintas
    // En tableta no crece sin fin: cajas de hasta ~92 px
    const esc = Math.min(0.92, ancho ? Math.min((w - TIRA - 150) / vw, (h - arriba) / vh) : Math.min((w - TIRA) / vw, (h - arriba - 58) / vh));
    const sw = Math.max(120, vw * esc), sh = Math.max(120, vh * esc);
    this.svg.style.width = `${sw}px`;
    this.svg.style.height = `${sh}px`;
    const px = sw / vw;
    // La cuadrícula del cuaderno cae justo en los puntos (4 cuadritos por caja)
    this.hoja.style.setProperty('--cuadro', `${(U / 4) * px}px`);
    this.hoja.style.setProperty('--origen-x', `${TIRA + M * px}px`);
    this.hoja.style.setProperty('--origen-y', `${M * px}px`);
    this.hoja.style.setProperty('--tira', `${TIRA}px`);
    this.hoja.style.setProperty('--px', String(px));
  }

  /** Camino de una línea: un pelín torcida, como hecha a mano, y en sentido alterno. */
  private camino(l: number, torcida = false): string {
    const [r1, c1, r2, c2] = geo(this.e).puntos[l];
    let x1 = M + c1 * U, y1 = M + r1 * U, x2 = M + c2 * U, y2 = M + r2 * U;
    if (!torcida) return `M${x1} ${y1}L${x2} ${y2}`;
    if (l % 2) [x1, y1, x2, y2] = [x2, y2, x1, y1];
    const o = (((l * 7919) % 9) - 4) * 0.9;
    const mx = (x1 + x2) / 2 + (y1 === y2 ? 0 : o), my = (y1 + y2) / 2 + (y1 === y2 ? o : 0);
    return `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`;
  }

  private dibujarTrazo(l: number, q: Rol, animado: boolean) {
    const d = this.camino(l, true);
    const g = el('g', { class: `cajas-trazo${animado ? ' nuevo' : ''}`, 'data-quien': q }, this.capas.trazos);
    if (animado) g.style.setProperty('--t', `${ms(T_TRAZO)}ms`);
    el('path', { class: 'cajas-trazo-tinta', d, pathLength: 1 }, g);
    el('path', { class: 'cajas-trazo-brillo', d, pathLength: 1 }, g);
  }

  private dibujarCaja(b: number, q: Rol, animado: boolean, orden = 0) {
    const g = geo(this.e);
    const r = Math.floor(b / g.columnas), c = b % g.columnas;
    const x = M + c * U, y = M + r * U;
    const caja = el('g', { class: `cajas-caja${animado ? ' nueva' : ''}`, 'data-quien': q, 'data-caja': b }, this.capas.cajas);
    caja.style.setProperty('--retraso', `${ms(orden * 130)}ms`);
    el('rect', { class: 'cajas-color', x: x + 7, y: y + 7, width: U - 14, height: U - 14, rx: 10 }, caja);
    const s = el('g', { transform: `translate(${x + U / 2} ${y + U / 2 + 2}) rotate(${((b * 37) % 17) - 8})` }, caja);
    el('path', { class: 'cajas-simbolo', d: simbolo(q) }, s);
  }

  private marcarUltima(l: number, pulso: boolean) {
    const u = this.ultima;
    u.setAttribute('d', this.camino(l));
    u.style.display = '';
    u.classList.remove('pulso');
    if (pulso) {
      void u.getBoundingClientRect();
      u.classList.add('pulso');
    }
  }

  private pintarFichas(salta?: Rol) {
    const p = reglas.puntos(this.e);
    const fin = reglas.fin(this.e);
    for (const q of ['el', 'ella'] as Rol[]) {
      const f = this.fichas[q];
      f.querySelector('.cajas-ficha-cuenta')!.textContent = String(p[q]);
      f.classList.toggle('activa', !fin && this.e.turno === q);
      if (salta === q) {
        f.classList.remove('salta');
        void f.offsetWidth;
        f.classList.add('salta');
      }
    }
    const libres = this.e.cajas.filter((x) => !x).length;
    this.quedan.textContent = fin ? '¡Listo!' : libres === 1 ? '¡Queda una!' : `Quedan ${libres}`;
  }

  /** Cajas con tres lados cuando le toca a un humano: brillan (se cierran con una línea). */
  private marcarListas() {
    const ls = new Set(this.permitido ? listas(this.e) : []);
    this.celdas.forEach((c, b) => c.classList.toggle('lista', ls.has(b)));
  }

  // -------------------------------------------------------------------------
  // Tocar

  permitir(quien: Rol | null) {
    this.permitido = quien;
    this.cont.classList.toggle('cajas-activo', !!quien);
    if (quien) this.cont.dataset.tinta = quien;
    this.nota.hidden = !quien || this.e.lineas.filter(Boolean).length > 1;
    if (!quien) this.soltar();
    this.marcarListas();
  }

  private punto(ev: PointerEvent): [number, number] {
    const r = this.svg.getBoundingClientRect();
    const vb = this.svg.viewBox.baseVal;
    return [((ev.clientX - r.left) * vb.width) / r.width, ((ev.clientY - r.top) * vb.height) / r.height];
  }

  /** La línea libre más cercana al dedo (dentro de su caja), o -1. */
  private cercana(x: number, y: number): number {
    const g = geo(this.e);
    let mejor = -1, dmin = Infinity;
    for (let l = 0; l < g.nl; l++) {
      if (this.e.lineas[l]) continue;
      const [r1, c1, r2, c2] = g.puntos[l];
      const d = distancia(x, y, M + c1 * U, M + r1 * U, M + c2 * U, M + r2 * U);
      if (d < dmin) {
        dmin = d;
        mejor = l;
      }
    }
    return dmin <= U * 0.62 ? mejor : -1;
  }

  private apuntar(ev: PointerEvent) {
    const [x, y] = this.punto(ev);
    const l = this.cercana(x, y);
    if (l === this.candidato) return;
    this.candidato = l;
    const f = this.fantasma;
    if (l < 0) {
      f.style.display = 'none';
      return;
    }
    this.fantasmaLinea.setAttribute('d', this.camino(l));
    const [r1, c1, r2, c2] = geo(this.e).puntos[l];
    this.fantasmaPuntos[0].setAttribute('cx', String(M + c1 * U));
    this.fantasmaPuntos[0].setAttribute('cy', String(M + r1 * U));
    this.fantasmaPuntos[1].setAttribute('cx', String(M + c2 * U));
    this.fantasmaPuntos[1].setAttribute('cy', String(M + r2 * U));
    f.style.display = '';
    f.classList.remove('aparece');
    void f.getBoundingClientRect();
    f.classList.add('aparece');
    if (this.puntero !== null) sonido.rumor(0.035, 3200, 0.025, 0, 2);
  }

  private soltar() {
    this.puntero = null;
    this.candidato = -1;
    if (this.fantasma) this.fantasma.style.display = 'none';
  }

  private alBajar = (ev: PointerEvent) => {
    if (!this.permitido || this.animando || this.puntero !== null) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    ev.preventDefault();
    sonido.activar();
    this.puntero = ev.pointerId;
    try {
      this.hoja.setPointerCapture(ev.pointerId);
    } catch {
      /* sin captura */
    }
    this.nota.hidden = true;
    this.candidato = -2;
    this.apuntar(ev);
  };

  private alMover = (ev: PointerEvent) => {
    if (this.puntero === ev.pointerId) this.apuntar(ev);
    else if (this.puntero === null && ev.pointerType === 'mouse' && this.permitido && !this.animando) this.apuntar(ev);
  };

  private alSubir = (ev: PointerEvent) => {
    if (this.puntero !== ev.pointerId) return;
    this.puntero = null;
    const l = this.candidato;
    if (l >= 0 && this.permitido && !this.animando) {
      // El fantasma se queda hasta que la línea se trace (no se toca el tablero antes de animar)
      this.permitido = null;
      this.cont.classList.remove('cajas-activo');
      this.fantasma.classList.add('elegida');
      this.ctx.jugar({ l });
    } else this.soltar();
  };

  private alCancelar = (ev: PointerEvent) => {
    if (this.puntero === ev.pointerId) this.soltar();
  };

  private alSalir = (ev: PointerEvent) => {
    if (ev.pointerType === 'mouse' && this.puntero === null) this.soltar();
  };

  // -------------------------------------------------------------------------
  // Animar

  async animar(antes: EstadoCajas, m: MovCajas, despues: EstadoCajas) {
    this.animando = true;
    const quien = antes.turno;
    const l = m.l;
    this.soltar();
    this.fantasma.classList.remove('elegida');
    this.nota.hidden = true;
    this.e = despues;
    this.guias[l]?.remove();
    this.guias[l] = null;
    this.ultima.style.display = 'none';
    this.dibujarTrazo(l, quien, true);
    this.sonidoTrazo();
    await esperar(T_TRAZO);
    this.marcarUltima(l, true);

    const nuevas: number[] = [];
    despues.cajas.forEach((d, b) => d && !antes.cajas[b] && nuevas.push(b));
    const fin = reglas.fin(despues);
    if (nuevas.length) {
      if (this.racha.quien !== quien) this.racha = { quien, n: 0 };
      const primera = this.racha.n === 0;
      nuevas.forEach((b, i) => {
        this.dibujarCaja(b, quien, true, i);
        this.sonidoCaja(this.racha.n + i, i);
      });
      this.racha.n += nuevas.length;
      this.pintarFichas(quien);
      const s = this.sucesoCaptura(quien, primera, nuevas.length, !fin && listas(despues).length > 0, !!fin);
      if (s) window.setTimeout(() => this.ctx.suceso(s), ms(120));
      await esperar(T_CAJA + (nuevas.length - 1) * 130);
    } else {
      const s = this.sucesoLinea(antes, l, despues);
      this.racha = { quien: null, n: 0 };
      this.pintarFichas();
      if (s) this.ctx.suceso(s);
    }
    this.pintarFichas();
    this.marcarListas();
    if (fin) await this.celebrar(fin.ganador);
    this.animando = false;
  }

  /** Suceso al cerrar cajas: «turno extra» al empezar la racha y la cadena completa al terminarla. */
  private sucesoCaptura(quien: Rol, primera: boolean, cerradas: number, sigue: boolean, fin: boolean): Suceso | null {
    const n = this.racha.n;
    const cadena = (): Suceso => {
      if (n >= 3) this.ctx.sonido('campana');
      return { tipo: 'jugada', quien, calidad: n >= 4 ? 'genial' : 'buena', texto: n >= 3 ? `¡Cadena de ${n}!` : undefined };
    };
    if (fin) return cadena();
    if (primera && !sigue) return cerradas === 2 ? { tipo: 'jugada', quien, calidad: 'buena', texto: '¡Dos de una!' } : { tipo: 'turno_extra', quien };
    if (primera) return { tipo: 'turno_extra', quien };
    if (!sigue) return cadena();
    return null;
  }

  /** Suceso de una línea que no cerró nada: segura, regalo o trato doble. */
  private sucesoLinea(antes: EstadoCajas, l: number, despues: EstadoCajas): Suceso {
    const quien = antes.turno;
    const ls = listas(despues);
    const servidas = ls.length;
    if (listas(antes).length) {
      // Dejó cajas sin comer: el trato doble (deja 1 o 2 parejas que se cierran con una sola línea, para que el
      // otro tenga que abrir la siguiente cadena) o un descuido
      const g = geo(despues);
      const parejas = servidas <= 4 && ls.every((b) => {
        const k = g.lineasDe[b].find((x) => !despues.lineas[x])!;
        return g.cajasDe[k].some((o) => o !== b && ls.includes(o));
      });
      if (parejas) {
        this.ctx.sonido('atrapado');
        return { tipo: 'jugada', quien, calidad: 'genial', texto: '¡Jugada maestra!' };
      }
      this.ctx.sonido('resbalon');
      return { tipo: 'regalo', quien, texto: '¡Las dejó servidas!' };
    }
    if (!servidas) return { tipo: 'jugada', quien, calidad: 'normal' };
    const g = regalo(antes, l);
    if (haySegura(antes)) {
      this.ctx.sonido('resbalon');
      return { tipo: 'regalo', quien, texto: g >= 3 ? `¡Regaló ${g}!` : '¡Uy, regalito!' };
    }
    // Ya no había líneas seguras: regalar algo era obligado; solo se nota si regaló más de la cuenta
    let min = Infinity;
    antes.lineas.forEach((x, k) => {
      if (!x && min > 0) min = Math.min(min, regalo(antes, k));
    });
    return g > min ? { tipo: 'regalo', quien, texto: `¡Regaló ${g}!` } : { tipo: 'regalo', quien };
  }

  private async celebrar(ganador: Rol | null) {
    if (ganador) {
      const cajas = [...this.capas.cajas.querySelectorAll<SVGGElement>(`.cajas-caja[data-quien="${ganador}"]`)];
      const g = geo(this.e);
      for (const c of cajas) {
        const b = Number(c.dataset.caja);
        c.style.setProperty('--ola', `${ms(((b % g.columnas) + Math.floor(b / g.columnas)) * 60)}ms`);
        c.classList.remove('nueva');
        c.classList.add('festeja');
      }
      this.ctx.sonido('corazon');
    }
    await esperar(900);
  }

  // -------------------------------------------------------------------------
  // Sonidos

  /** Rasguño de marcador sobre papel. */
  private sonidoTrazo() {
    const d = ms(T_TRAZO) / 1000;
    sonido.rumor(d * 0.9, 2600, 0.05, 0, 1.3, 1500);
    sonido.rumor(0.05, 4200, 0.03, d * 0.8, 2);
  }

  /** «Pop» que sube de tono con cada caja de la racha. */
  private sonidoCaja(k: number, orden: number) {
    const f = 620 * Math.pow(2, Math.min(k, 12) / 6);
    const t = ms(orden * 130) / 1000;
    sonido.nota(f, 0.1, t, 'triangle', 0.08);
    sonido.nota(f * 1.5, 0.18, t + 0.06, 'sine', 0.05);
  }

  destruir() {
    this.ro.disconnect();
    this.cont.remove();
  }
}

export const crearVista = (ctx: CtxVista<MovCajas>) => new VistaCajas(ctx);
