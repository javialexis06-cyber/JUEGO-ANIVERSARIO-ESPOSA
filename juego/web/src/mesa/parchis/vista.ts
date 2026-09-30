// Vista del Parchís: el tablero en SVG con la casa de este celular abajo a la izquierda, fichas gorditas que
// saltan casilla por casilla y los avisos a los muñequitos. Con un color, un dado 3D para cada uno en las
// esquinas libres; con dos colores, dos dados que caen al centro del tablero (se toca uno para elegirlo).
// El número que salió queda en la cara de arriba del dado, como en la mesa de verdad.
import { otro, type Rol } from '../../casa/modelo';
import * as sonido from '../../sonido';
import type { CtxVista, Vista } from '../tipos';
import {
  CASA, ENTRADA, FICHAS, META, SEGUROS, absoluta, colorDe, dosColores, enBarrera, enVuelta, pasosDelDado, reglas,
  type EstadoParchis, type MovParchis,
} from './reglas';
import { CAJA, COLOR, ESCALA, Geo, colorFicha, definiciones, peon, type Pt } from './tablero';
import './parchis.css';

const ROLES: Rol[] = ['el', 'ella'];
const RAPIDO = Math.max(1, Number(new URLSearchParams(location.search).get('rapido')) || 1);
const REDUCIDO = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Duración ajustada (pruebas rápidas y movimiento reducido: más corto, nunca nada). */
const ms = (x: number) => (x / RAPIDO) * (REDUCIDO ? 0.55 : 1);
const dormir = (x: number) => new Promise<void>((r) => setTimeout(r, ms(x)));
const suave = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Anima con requestAnimationFrame (t de 0 a 1). */
function tween(dur: number, fn: (t: number) => void): Promise<void> {
  const d = ms(dur);
  return new Promise((res) => {
    const t0 = performance.now();
    const paso = (ahora: number) => {
      const t = d <= 0 ? 1 : Math.min(1, (ahora - t0) / d);
      fn(t);
      if (t < 1) requestAnimationFrame(paso);
      else res();
    };
    requestAnimationFrame(paso);
  });
}

// Sonidos propios: el dado en la mano, el golpe en la bandeja y el toc de cada salto
function sonarDado() {
  for (let k = 0; k < 6; k++) sonido.rumor(0.045, 2000 + Math.random() * 1600, 0.07, (k * 0.11 + Math.random() * 0.04) / RAPIDO, 3);
}
function golpe() {
  sonido.nota(170, 0.1, 0, 'sine', 0.13, 90);
  sonido.rumor(0.05, 800, 0.08, 0, 1.2);
}
function toc(n: number) {
  sonido.nota(740 + (n % 3) * 95, 0.05, 0, 'triangle', 0.05);
  sonido.rumor(0.025, 3200, 0.035, 0, 4);
}

/** Rotación del cubo (X, Y) para dejar cada cara ARRIBA: el número que salió es el de arriba, como en la mesa. */
const CARAS: Record<number, [number, number]> = { 1: [90, 0], 2: [-90, 90], 3: [0, 0], 4: [180, 0], 5: [90, 90], 6: [-90, 0] };
/** Cómo se mira el dado: desde arriba y un poquito de lado (la cara de arriba es la grande). */
const MIRADA = 'rotateX(-63deg) rotateY(22deg)';
const PUNTOS: Record<number, number[]> = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
/** El menor valor >= min que da `meta` vueltas completas aparte. */
const siguiente = (min: number, meta: number) => min + ((((meta - min) % 360) + 360) % 360);

interface Pos {
  x: number;
  y: number;
  s: number;
}
interface Dado {
  el: HTMLElement;
  cubo: HTMLElement;
  premio: HTMLElement;
  rx: number;
  ry: number;
}
interface Franja {
  el: HTMLElement;
  estado: HTMLElement;
  metas: HTMLElement;
  tirar: HTMLButtonElement;
}
type Mover = Extract<MovParchis, { t: 'mover' }>;
const esMover = (m: MovParchis): m is Mover => m.t === 'mover';

class VistaParchis implements Vista<EstadoParchis, MovParchis> {
  /** Con dos colores: los dos dados del centro y cuál se eligió para mover. */
  private readonly centro: Dado[] = [];
  private elegido: 0 | 1 = 0;
  private e: EstadoParchis = reglas.inicial('el');
  private quien: Rol | null = null;
  private readonly geo: Geo;
  private readonly abajo: Rol;
  private readonly svg: SVGSVGElement;
  private readonly capaFichas: SVGGElement;
  private readonly capaPistas: SVGGElement;
  private readonly capaChispas: SVGGElement;
  private readonly fichas: Record<Rol, SVGGElement[]> = { el: [], ella: [] };
  private readonly pos = new Map<SVGGElement, Pos>();
  private readonly dados = {} as Record<Rol, Dado>;
  private readonly franjas = {} as Record<Rol, Franja>;
  private readonly globo: HTMLElement;
  private tGlobo = 0;
  private tPase = 0;
  private vivo = true;

  constructor(private readonly ctx: CtxVista<MovParchis>, private readonly colores: 1 | 2 = 1) {
    this.abajo = ctx.yo;
    this.geo = new Geo(ctx.yo === 'el', colores);
    const dos = colores === 2;
    const arriba = otro(ctx.yo);
    const nombre = (r: Rol) => (ctx.modo === 'local' ? ctx.nombres[r] : r === ctx.yo ? 'Tú' : ctx.nombres[r]);
    const franja = (r: Rol, lado: string) => `
      <div class="parchis-franja" data-lado="${lado}" data-quien="${r}">
        <svg class="parchis-avatar" viewBox="-12 -14 24 25" aria-hidden="true">${peon(r)}</svg>
        <span class="parchis-quien"><b>${nombre(r)}</b><span class="parchis-metas" aria-label="Fichas en la meta">${Array.from({ length: FICHAS * colores }, (_, k) => `<i${k >= FICHAS ? ' class="parchis-meta2"' : ''}></i>`).join('')}</span></span>
        <span class="parchis-estado" aria-live="polite"></span>
        <button class="parchis-tirar" type="button">Tirar</button>
      </div>`;
    const cara = (n: number) => `<div class="parchis-cara parchis-c${n}">${PUNTOS[n].map((p) => `<i style="grid-area:${Math.ceil(p / 3)}/${((p - 1) % 3) + 1}"></i>`).join('')}</div>`;
    const cubo = `<div class="parchis-salto"><div class="parchis-cubo">${[1, 2, 3, 4, 5, 6].map(cara).join('')}</div></div><span class="parchis-premio" hidden></span>`;
    const dado = (r: Rol, lado: string) => dos ? '' : `
      <div class="parchis-dado" data-lado="${lado}" data-quien="${r}" role="button" aria-label="Dado de ${ctx.nombres[r]}"
        style="left:${Geo.bandeja(lado as 'abajo')}%;top:${Geo.bandeja(lado as 'abajo')}%">${cubo}</div>`;
    const centro = (k: number) => `
      <div class="parchis-dado parchis-dado-centro parchis-activo" data-k="${k}" role="button" aria-label="Dado ${k + 1}"
        style="left:${k ? 54.6 : 45.4}%;top:50%">${cubo}</div>`;
    ctx.raiz.innerHTML = `
      <div class="parchis${dos ? ' dos-colores' : ''}">
        <div class="parchis-mesa">
          ${franja(arriba, 'arriba')}
          <div class="parchis-tablero">
            <svg class="parchis-svg" viewBox="${CAJA}" aria-label="Tablero de parchís">
              ${definiciones()}${this.geo.dibujar()}
              <g class="parchis-pistas"></g><g class="parchis-fichas"></g><g class="parchis-chispas"></g>
            </svg>
            ${dado(arriba, 'arriba')}${dado(ctx.yo, 'abajo')}${dos ? centro(0) + centro(1) : ''}
            <div class="parchis-globo" hidden></div>
          </div>
          ${franja(ctx.yo, 'abajo')}
        </div>
      </div>`;
    const raiz = ctx.raiz;
    this.svg = raiz.querySelector('.parchis-svg')!;
    this.capaFichas = raiz.querySelector('.parchis-fichas')!;
    this.capaPistas = raiz.querySelector('.parchis-pistas')!;
    this.capaChispas = raiz.querySelector('.parchis-chispas')!;
    this.globo = raiz.querySelector('.parchis-globo')!;
    const NS = 'http://www.w3.org/2000/svg';
    const armar = (d: HTMLElement): Dado => ({ el: d, cubo: d.querySelector('.parchis-cubo')!, premio: d.querySelector('.parchis-premio')!, rx: 0, ry: 0 });
    for (const r of ROLES) {
      for (let i = 0; i < FICHAS * colores; i++) {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'parchis-ficha');
        g.dataset.rol = r;
        g.dataset.ficha = String(i);
        g.innerHTML = peon(colorFicha(r, i));
        this.capaFichas.append(g);
        this.fichas[r].push(g);
      }
      if (!dos) {
        const d = raiz.querySelector<HTMLElement>(`.parchis-dado[data-quien="${r}"]`)!;
        this.dados[r] = armar(d);
        d.style.setProperty('--punto', COLOR[r].oscuro);
        d.addEventListener('click', () => this.tirar(r));
      }
      const f = raiz.querySelector<HTMLElement>(`.parchis-franja[data-quien="${r}"]`)!;
      f.style.setProperty('--color2', r === 'el' ? COLOR.amarillo.oscuro : COLOR.verde.oscuro);
      this.franjas[r] = { el: f, estado: f.querySelector('.parchis-estado')!, metas: f.querySelector('.parchis-metas')!, tirar: f.querySelector('.parchis-tirar')! };
      this.franjas[r].tirar.hidden = !(ctx.modo === 'local' || r === ctx.yo);
      this.franjas[r].tirar.addEventListener('click', () => this.tirar(r));
      if (!dos) this.ponerCara(this.dados[r], r === ctx.yo ? 5 : 1, false);
    }
    if (dos) {
      raiz.querySelectorAll<HTMLElement>('.parchis-dado-centro').forEach((d, k) => {
        const dd = armar(d);
        this.centro.push(dd);
        d.style.setProperty('--punto', '#3d2b27');
        this.ponerCara(dd, k ? 6 : 5, false);
        // En su turno: toca los dados para tirar; ya tirados, toca uno para elegir con cuál mueve
        d.addEventListener('click', () => {
          const e = this.e;
          if (e.fase === 'tirar') return this.quien && this.tirar(this.quien);
          if (!this.quien || e.turno !== this.quien || e.bono > 0 || e.usados?.[k]) return;
          sonido.toque();
          this.elegido = k as 0 | 1;
          this.refrescar();
        });
      });
    }
    this.svg.addEventListener('pointerdown', this.alTocar);
  }

  // -------------------------------------------------------------------------
  // Contrato
  pintar(e: EstadoParchis) {
    this.e = e;
    this.colocar(e, false);
    if (this.colores === 2) {
      if (e.dados?.[0]) e.dados.forEach((n, k) => this.ponerCara(this.centro[k], n, false));
    } else if (e.dado) this.ponerCara(this.dados[e.turno], e.dado, false);
    this.refrescar();
  }

  permitir(quien: Rol | null) {
    this.quien = quien;
    this.refrescar();
  }

  async animar(antes: EstadoParchis, m: MovParchis, despues: EstadoParchis) {
    this.quien = null;
    clearTimeout(this.tPase);
    this.e = antes;
    this.refrescar();
    if (m.t === 'tirar') await this.animarTiro(antes, m.dado, despues);
    else if (m.t === 'mover') await this.animarMovida(antes, m, despues);
    else await this.animarPase(antes);
    if (!this.vivo) return;
    this.e = despues;
    await this.colocar(despues, true);
    this.refrescar();
  }

  destruir() {
    this.vivo = false;
    clearTimeout(this.tPase);
    clearTimeout(this.tGlobo);
    this.svg.removeEventListener('pointerdown', this.alTocar);
    this.ctx.raiz.innerHTML = '';
  }

  // -------------------------------------------------------------------------
  // Jugar
  private tirar(r: Rol) {
    const e = this.e;
    if (this.quien !== r || e.turno !== r || e.fase !== 'tirar' || reglas.fin(e)) return;
    sonido.activar();
    this.quien = null;
    for (const d of this.colores === 2 ? this.centro : [this.dados[r]]) d.el.classList.add('parchis-apretado');
    this.refrescar();
    const tiro = () => Math.min(6, 1 + Math.floor(this.ctx.azar() * 6));
    const dado = tiro();
    this.ctx.jugar(this.colores === 2 ? { t: 'tirar', dado, dado2: tiro() } : { t: 'tirar', dado });
  }

  /** Movimientos que se muestran (con dos dados, los del dado elegido; los premios, todos). */
  private visibles(e: EstadoParchis): MovParchis[] {
    const movs = reglas.movimientos(e);
    if (!dosColores(e) || e.bono > 0 || e.fase !== 'mover') return movs;
    const con = (k: number) => movs.filter((m) => m.t !== 'mover' || m.cual === k || m.cual === 2);
    // Si el elegido ya se usó o no mueve nada, se pasa solo al otro
    if (e.usados?.[this.elegido] || !con(this.elegido).some(esMover)) {
      const otroK = (1 - this.elegido) as 0 | 1;
      if (!e.usados?.[otroK] && con(otroK).some(esMover)) this.elegido = otroK;
    }
    return con(this.elegido);
  }

  private readonly alTocar = (ev: PointerEvent) => {
    sonido.activar();
    const e = this.e;
    const r = this.quien;
    if (!r || e.turno !== r || e.fase !== 'mover') return;
    const ctm = this.svg.getScreenCTM();
    if (!ctm) return;
    const q = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
    // La ficha más cercana (o la marca de a dónde llegaría) que se pueda mover
    let mejor: Mover | null = null;
    let dist = 30;
    for (const m of this.visibles(e).filter(esMover)) {
      const g = this.fichas[r][m.ficha];
      const p = this.pos.get(g)!;
      const pistas = [{ x: p.x, y: p.y - 2 * p.s }, this.destinoDe(e, m)];
      for (const c of pistas) {
        const d = Math.hypot(c.x - q.x, c.y - q.y);
        if (d < dist) {
          dist = d;
          mejor = m;
        }
      }
    }
    if (!mejor) return;
    ev.preventDefault();
    this.quien = null;
    const g = this.fichas[r][mejor.ficha];
    g.classList.add('parchis-tocada');
    sonido.toque();
    this.refrescar();
    this.ctx.jugar(mejor);
  };

  private destinoDe(e: EstadoParchis, m: Mover): Pt {
    const s = reglas.aplicar(e, m);
    return this.geo.punto(e.turno, s.fichas[e.turno][m.ficha], m.ficha);
  }

  // -------------------------------------------------------------------------
  // Pintar el estado
  /** Dónde va cada ficha (las que comparten casilla se hacen a un lado). */
  private lugares(e: EstadoParchis): Map<SVGGElement, Pos> {
    const grupos = new Map<string, { g: SVGGElement; r: Rol; p: number; i: number }[]>();
    for (const r of ROLES) {
      e.fichas[r].forEach((p, i) => {
        const k = p === CASA || p === META ? `${r}${p}${i}` : enVuelta(p) ? `v${absoluta(r, p, i)}` : `${r}${colorDe(i)}p${p}`;
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k)!.push({ g: this.fichas[r][i], r, p, i });
      });
    }
    const out = new Map<SVGGElement, Pos>();
    for (const grupo of grupos.values()) {
      grupo.forEach(({ g, r, p, i }, k) => {
        const c = this.geo.punto(r, p, i);
        let s = p === CASA ? ESCALA.casa : p === META ? ESCALA.meta : ESCALA.vuelta;
        if (grupo.length > 1) {
          const lado = k === 0 ? -1 : 1;
          const vert = this.geo.vertical(r, p, i);
          c.x += lado * (vert ? 5.8 : 4.2);
          c.y += vert ? 0 : lado * 3.6;
          s = ESCALA.doble;
        }
        out.set(g, { x: c.x, y: c.y, s });
      });
    }
    return out;
  }

  private ponerFicha(g: SVGGElement, p: Pos) {
    this.pos.set(g, p);
    g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${p.s.toFixed(3)})`);
  }

  private async colocar(e: EstadoParchis, animado: boolean) {
    const lugares = this.lugares(e);
    const cambios: Promise<void>[] = [];
    for (const [g, fin] of lugares) {
      const ini = this.pos.get(g);
      if (!animado || !ini || (Math.abs(ini.x - fin.x) < 0.1 && Math.abs(ini.y - fin.y) < 0.1 && Math.abs(ini.s - fin.s) < 0.01)) {
        this.ponerFicha(g, fin);
        continue;
      }
      cambios.push(tween(200, (t) => {
        const k = suave(t);
        this.ponerFicha(g, { x: ini.x + (fin.x - ini.x) * k, y: ini.y + (fin.y - ini.y) * k, s: ini.s + (fin.s - ini.s) * k });
      }));
    }
    await Promise.all(cambios);
    this.ordenar();
  }

  /** Las de más abajo se pintan encima. */
  private ordenar() {
    const gs = [...this.fichas.el, ...this.fichas.ella].sort((a, b) => this.pos.get(a)!.y - this.pos.get(b)!.y);
    for (const g of gs) this.capaFichas.append(g);
  }

  private textoEstado(r: Rol): string {
    const e = this.e;
    const f = reglas.fin(e);
    if (f) return f.ganador === r ? '¡Ganó!' : '';
    if (e.turno !== r) return '';
    const mio = this.quien === r;
    const dos = dosColores(e);
    if (e.fase === 'tirar') {
      const repite = dos ? '¡Par! Tira otra vez' : '¡Seis! Tira otra vez';
      return mio ? (e.seises ? repite : 'Te toca tirar') : e.seises ? 'Repite…' : 'Va a tirar…';
    }
    const movs = reglas.movimientos(e);
    if (movs[0]?.t === 'pasar') return e.bono ? `Nadie puede contar ${e.bono}` : 'Sin jugada';
    if (e.bono) return mio ? `Cuenta ${e.bono} con una ficha` : `Cuenta ${e.bono}…`;
    if (!mio) return 'Moviendo…';
    const f2 = e.fichas[r];
    if (dos) {
      const [a, b] = e.dados ?? [0, 0];
      const quedan = [a, b].filter((_, k) => !e.usados?.[k]);
      const vis = this.visibles(e).filter(esMover);
      if (vis.length && vis.every((m) => f2[m.ficha] === CASA && m.cual !== 2) && (e.dados?.[this.elegido] === 5)) return '¡Saca una ficha con el 5!';
      if (vis.length && vis.every((m) => m.cual === 2)) return `¡${a} y ${b} suman 5: saca una ficha!`;
      const otroSirve = movs.some((m) => esMover(m) && m.cual === 1 - this.elegido);
      if (quedan.length === 2 && a !== b) return otroSirve ? `Mueve el ${e.dados?.[this.elegido]} (toca el otro dado para cambiar)` : `Mueve el ${e.dados?.[this.elegido]}`;
      return quedan.length === 2 ? `Mueve ${a} y ${b}` : `Te queda el ${quedan[0]}`;
    }
    if (e.dado === 5 && movs.every((m) => esMover(m) && f2[m.ficha] === CASA)) return '¡Saca una ficha!';
    if (e.dado === 6 && movs.every((m) => esMover(m) && enBarrera(r, f2, m.ficha)) && f2.some((p, i) => !movs.some((m) => esMover(m) && m.ficha === i) && p !== CASA && p !== META))
      return 'Abre tu barrera';
    if (pasosDelDado(e) === 7) return 'El 6 cuenta 7';
    return `Mueve ${e.dado}`;
  }

  private refrescar() {
    const e = this.e;
    const fin = reglas.fin(e);
    for (const r of ROLES) {
      const f = this.franjas[r];
      const suTurno = !fin && e.turno === r;
      const puedeTirar = this.quien === r && suTurno && e.fase === 'tirar';
      f.el.classList.toggle('parchis-turno', suTurno);
      f.estado.textContent = this.textoEstado(r);
      f.tirar.disabled = !puedeTirar;
      f.tirar.classList.toggle('parchis-listo', puedeTirar);
      // Fichas en la meta de cada color (con dos colores, los cuatro primeros puntos son del primero)
      [...f.metas.children].forEach((c, k) => {
        const col = k >= FICHAS ? 1 : 0;
        const llenas = e.fichas[r].filter((p, i) => p === META && colorDe(i) === col).length;
        c.classList.toggle('parchis-llena', k % FICHAS < llenas);
      });
      const d = this.dados[r];
      if (!d) continue;
      d.el.classList.toggle('parchis-activo', suTurno);
      d.el.classList.toggle('parchis-listo', puedeTirar);
      if (!puedeTirar) d.el.classList.remove('parchis-apretado');
      d.premio.hidden = !(suTurno && e.fase === 'mover' && e.bono > 0);
      d.premio.textContent = `+${e.bono}`;
    }
    // Dos colores: los dados del centro (el elegido con aro, los usados apagados)
    const r = this.quien;
    if (this.centro.length) {
      const puedeTirar = !fin && !!r && e.turno === r && e.fase === 'tirar';
      const eligiendo = !fin && !!r && e.turno === r && e.fase === 'mover' && e.bono === 0;
      if (eligiendo) this.visibles(e);
      this.centro.forEach((d, k) => {
        d.el.classList.toggle('parchis-listo', puedeTirar);
        if (!puedeTirar) d.el.classList.remove('parchis-apretado');
        d.el.classList.toggle('parchis-usado', e.fase === 'mover' && !!e.usados?.[k]);
        d.el.classList.toggle('parchis-elegido', eligiendo && !e.usados?.[k] && this.elegido === k && e.dados?.[0] !== e.dados?.[1]);
        d.el.style.setProperty('--punto', COLOR[e.turno].oscuro);
      });
      const pr = this.centro[1].premio;
      pr.hidden = !(!fin && e.fase === 'mover' && e.bono > 0);
      pr.textContent = `+${e.bono}`;
    }
    // Fichas que se pueden mover: saltan, y se marca a dónde llegarían
    const movs = r && e.turno === r && e.fase === 'mover' && !fin ? this.visibles(e) : [];
    const movibles = new Set(movs.filter(esMover).map((m) => m.ficha));
    for (const rr of ROLES)
      this.fichas[rr].forEach((g, i) => {
        g.classList.toggle('parchis-movible', rr === r && movibles.has(i));
        g.classList.remove('parchis-tocada');
      });
    this.capaPistas.innerHTML = movs
      .filter(esMover)
      .map((m) => {
        const q = this.destinoDe(e, m);
        return `<circle class="parchis-pista" cx="${q.x}" cy="${q.y + 6}" r="8.5" stroke="${COLOR[e.turno].oscuro}"/>`;
      })
      .join('');
    // Sin jugada: se ve el aviso y pasa solo
    clearTimeout(this.tPase);
    if (r && movs.length === 1 && movs[0].t === 'pasar') {
      this.decir(r, e.bono ? `Se pierde el +${e.bono}` : 'Sin jugada', 1400);
      const antes = e;
      this.tPase = window.setTimeout(() => {
        if (this.vivo && this.quien === r && this.e === antes) {
          this.quien = null;
          this.ctx.jugar({ t: 'pasar' });
        }
      }, ms(1100));
    }
  }

  /** Globito junto a la bandeja del dado de `r`. */
  private decir(r: Rol, texto: string, dur = 1300) {
    const lado = r === this.abajo ? 'abajo' : 'arriba';
    const g = this.globo;
    const igual = !g.hidden && g.textContent === texto && g.dataset.quien === r;
    g.textContent = texto;
    g.dataset.lado = lado;
    g.dataset.quien = r;
    g.hidden = false;
    if (!igual) {
      g.classList.remove('parchis-sale');
      void g.offsetWidth;
      g.classList.add('parchis-sale');
    }
    clearTimeout(this.tGlobo);
    this.tGlobo = window.setTimeout(() => (g.hidden = true), ms(dur));
  }

  // -------------------------------------------------------------------------
  // Dado
  private ponerCara(d: Dado, n: number, girar: boolean) {
    const [ax, ay] = CARAS[n];
    if (girar) {
      d.rx = siguiente(d.rx + 360, ax);
      d.ry = siguiente(d.ry + 720, ay);
      d.cubo.style.transitionDuration = `${ms(820)}ms`;
    } else {
      d.rx = ax;
      d.ry = ay;
      d.cubo.style.transitionDuration = '0s';
    }
    d.cubo.style.transform = `${MIRADA} rotateX(${d.rx}deg) rotateY(${d.ry}deg)`;
  }

  private async rodar(r: Rol, n: number) {
    const d = this.dados[r];
    d.el.classList.remove('parchis-rodando', 'parchis-apretado');
    void d.el.offsetWidth;
    d.el.style.setProperty('--dur', `${ms(820)}ms`);
    d.el.classList.add('parchis-rodando');
    sonarDado();
    this.ponerCara(d, n, true);
    await dormir(840);
    golpe();
    d.el.classList.remove('parchis-rodando');
  }

  /** Dos colores: los dos dados caen al centro desde el lado de quien tira y quedan con su número arriba. */
  private async caer(r: Rol, n: [number, number]) {
    const desde = r === this.abajo ? 1 : -1;
    this.centro.forEach((d, k) => {
      d.el.classList.remove('parchis-cae', 'parchis-apretado', 'parchis-usado', 'parchis-elegido');
      void d.el.offsetWidth;
      d.el.style.setProperty('--dur', `${ms(900)}ms`);
      d.el.style.setProperty('--dy', `${desde * (330 + k * 40)}%`);
      d.el.style.setProperty('--dx', `${(k ? 1 : -1) * 60}%`);
      d.el.style.setProperty('--punto', COLOR[r].oscuro);
      d.el.classList.add('parchis-cae');
      this.ponerCara(d, n[k], true);
    });
    sonarDado();
    await dormir(520);
    golpe();
    await dormir(400);
    for (const d of this.centro) d.el.classList.remove('parchis-cae');
  }

  // -------------------------------------------------------------------------
  // Animaciones de cada movimiento
  private async animarTiro(antes: EstadoParchis, dado: number, despues: EstadoParchis) {
    const r = antes.turno;
    const f = antes.fichas[r];
    const dos = dosColores(antes);
    const par = dos && !!despues.dados && despues.dados[0] === despues.dados[1];
    // Solo le quedan fichas en el pasillo: necesita el número exacto
    const apurado = f.some((p) => p > ENTRADA && p < META) && f.every((p) => p > ENTRADA);
    this.ctx.suceso({ tipo: apurado ? 'suerte' : 'lanzar', quien: r });
    if (dos) await this.caer(r, despues.dados ?? [dado, dado]);
    else await this.rodar(r, dado);
    if (!this.vivo) return;
    // Arranca con el dado más alto elegido
    if (dos && despues.dados) this.elegido = despues.dados[1] > despues.dados[0] ? 1 : 0;
    if (antes.seises === 2 && (dos ? par : dado === 6)) {
      // Tres seises (o tres pares): la última ficha movida vuelve a casa
      const texto = dos ? '¡Tres pares!' : '¡Tres seises!';
      this.ctx.suceso({ tipo: 'jugada', quien: r, calidad: 'nula', texto });
      this.decir(r, texto, 1600);
      this.ctx.sonido('enojo');
      const i = f.findIndex((p, k) => p !== despues.fichas[r][k]);
      if (i >= 0) {
        await dormir(250);
        await this.aCasa(r, i, despues);
      } else await dormir(500);
      return;
    }
    this.e = despues;
    const movs = reglas.movimientos(despues);
    const sinJugada = movs[0]?.t === 'pasar';
    if (dos ? par : dado === 6) {
      this.ctx.suceso({ tipo: 'turno_extra', quien: r });
      this.ctx.sonido('campana');
      this.decir(r, sinJugada ? 'Sin jugada… ¡pero repite!' : dos ? '¡Par! Repite' : '¡Seis! Repite', 1500);
    } else if (sinJugada) {
      this.ctx.suceso({ tipo: 'casi', quien: r });
      this.ctx.sonido('vacia');
      this.decir(r, this.seQuedoCorto(despues) ? '¡Casi! Se pasa de la meta' : 'Sin jugada', 2200);
    } else if (this.seQuedoCorto(despues)) {
      this.ctx.suceso({ tipo: 'casi', quien: r });
    }
    await dormir(sinJugada ? 350 : 120);
  }

  /** ¿Alguna ficha estaba a un pasito de la meta y el dado se pasó? */
  private seQuedoCorto(e: EstadoParchis) {
    if (dosColores(e)) return false;
    const pasos = pasosDelDado(e);
    const f = e.fichas[e.turno];
    const llega = reglas.movimientos(e).some((m) => esMover(m) && f[m.ficha] + m.pasos === META);
    return !llega && f.some((p) => p !== CASA && p !== META && META - p <= 7 && META - p < pasos);
  }

  private async animarMovida(antes: EstadoParchis, m: Mover, despues: EstadoParchis) {
    const r = antes.turno;
    const o = otro(r);
    const i = m.ficha;
    const p0 = antes.fichas[r][i];
    const p1 = despues.fichas[r][i];
    const g = this.fichas[r][i];
    const final = this.lugares(despues).get(g)!;
    this.capaFichas.append(g);
    g.classList.remove('parchis-movible', 'parchis-tocada');
    if (p0 === CASA) {
      await this.salto(g, final, 46, 430);
      this.ctx.sonido('repuesto');
    } else {
      const n = p1 - p0;
      const dur = Math.max(55, Math.min(150, 850 / Math.max(1, n)));
      for (let s = p0 + 1; s <= p1 && this.vivo; s++) {
        const c = s === p1 ? final : { ...this.geo.punto(r, s, i), s: ESCALA.vuelta };
        await this.salto(g, c, s === p1 ? 13 : 7, s === p1 ? dur * 1.4 : dur);
        toc(s);
      }
    }
    if (!this.vivo) return;
    await this.aplastar(g);
    const victima = despues.fichas[o].findIndex((p, k) => p === CASA && antes.fichas[o][k] !== CASA);
    if (victima >= 0) {
      const perdio = antes.fichas[o][victima] + 1;
      this.ctx.sonido('mordisco');
      if (perdio >= 40) this.ctx.suceso({ tipo: 'jugada', quien: r, calidad: 'genial', texto: '¡A casa!' });
      else this.ctx.suceso({ tipo: 'captura', quien: r, cuanto: Math.max(1, perdio), texto: '¡Te comí!' });
      this.decir(r, `¡Te comí! +20`, 1500);
      await this.aCasa(o, victima, despues);
      return;
    }
    if (p1 === META) {
      this.ctx.sonido('corazon');
      this.ctx.suceso({ tipo: 'jugada', quien: r, calidad: 'buena', texto: '+10' });
      this.chispas(final, COLOR[r].base);
      this.decir(r, '¡A la meta! +10', 1400);
      await dormir(420);
      return;
    }
    if (p0 === CASA) {
      this.ctx.suceso({ tipo: 'jugada', quien: r, calidad: 'buena' });
      return;
    }
    if (antes.bono === 20) {
      this.ctx.suceso({ tipo: 'jugada', quien: r, calidad: 'buena', texto: '+20' });
      return;
    }
    if (this.esRegalo(antes, despues, r, i)) this.ctx.suceso({ tipo: 'regalo', quien: r });
  }

  /** La ficha quedó sola en una casilla normal, justo delante de una del otro (y tenía otra opción). */
  private esRegalo(antes: EstadoParchis, despues: EstadoParchis, r: Rol, i: number) {
    const p = despues.fichas[r][i];
    if (!enVuelta(p) || p < 8 || enBarrera(r, despues.fichas[r], i)) return false;
    const a = absoluta(r, p, i);
    if (SEGUROS.has(a)) return false;
    if (reglas.movimientos(antes).filter(esMover).length < 2) return false;
    const o = otro(r);
    return despues.fichas[o].some((pb, k) => {
      if (!enVuelta(pb)) return false;
      const dist = (a - absoluta(o, pb, k) + 68) % 68;
      return dist >= 1 && dist <= 3 && pb + dist <= ENTRADA;
    });
  }

  private async animarPase(antes: EstadoParchis) {
    if (antes.bono) {
      this.decir(antes.turno, `Se pierde el +${antes.bono}`, 1100);
      this.ctx.sonido('vacia');
    }
    await dormir(antes.bono ? 500 : 250);
  }

  /** Un salto en arco hasta `a`. */
  private salto(g: SVGGElement, a: Pos, alto: number, dur: number) {
    const b = this.pos.get(g)!;
    return tween(dur, (t) => {
      const k = t;
      this.ponerFicha(g, { x: b.x + (a.x - b.x) * k, y: b.y + (a.y - b.y) * k - alto * 4 * t * (1 - t), s: b.s + (a.s - b.s) * k });
    });
  }

  /** Aplastadita al caer. */
  private aplastar(g: SVGGElement) {
    const giro = g.querySelector<SVGGElement>('.parchis-giro')!;
    return tween(170, (t) => {
      const k = Math.sin(t * Math.PI);
      giro.setAttribute('transform', `translate(0 8) scale(${1 + 0.16 * k} ${1 - 0.18 * k}) translate(0 -8)`);
    }).then(() => giro.removeAttribute('transform'));
  }

  /** Ficha comida (o castigada) que vuela a su casa dando vueltas. */
  private async aCasa(r: Rol, i: number, despues: EstadoParchis) {
    const g = this.fichas[r][i];
    const b = this.pos.get(g)!;
    const a = this.lugares(despues).get(g)!;
    const giro = g.querySelector<SVGGElement>('.parchis-giro')!;
    this.capaFichas.append(g);
    this.ctx.sonido('resbalon');
    await tween(720, (t) => {
      const k = suave(t);
      this.ponerFicha(g, { x: b.x + (a.x - b.x) * k, y: b.y + (a.y - b.y) * k - 70 * 4 * t * (1 - t), s: b.s + (a.s - b.s) * k + 0.35 * Math.sin(t * Math.PI) });
      giro.setAttribute('transform', `rotate(${720 * k})`);
    });
    giro.removeAttribute('transform');
    await this.aplastar(g);
  }

  /** Brillitos al llegar a la meta. */
  private chispas(c: Pt, color: string) {
    const NS = 'http://www.w3.org/2000/svg';
    const piezas: { el: SVGElement; ang: number; v: number }[] = [];
    for (let k = 0; k < 12; k++) {
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('d', 'M0-4L1.1-1.1L4 0L1.1 1.1L0 4L-1.1 1.1L-4 0L-1.1-1.1Z');
      el.setAttribute('fill', k % 3 === 0 ? '#f6cf5a' : k % 3 === 1 ? color : '#fff8ee');
      el.setAttribute('stroke', '#3d2b27');
      el.setAttribute('stroke-width', '.6');
      this.capaChispas.append(el);
      piezas.push({ el, ang: (k / 12) * Math.PI * 2 + Math.random() * 0.4, v: 22 + Math.random() * 18 });
    }
    void tween(750, (t) => {
      const k = 1 - (1 - t) ** 3;
      for (const p of piezas) {
        const x = c.x + Math.cos(p.ang) * p.v * k;
        const y = c.y + Math.sin(p.ang) * p.v * k - 6 * k;
        p.el.setAttribute('transform', `translate(${x} ${y}) rotate(${t * 180}) scale(${1.3 - t * 0.9})`);
        p.el.setAttribute('opacity', String(1 - t * t));
      }
    }).then(() => piezas.forEach((p) => p.el.remove()));
  }
}

export function crearVista(ctx: CtxVista<MovParchis>): Vista<EstadoParchis, MovParchis> {
  return new VistaParchis(ctx);
}

/** Con dos colores cada uno y los dados al centro. */
export function crearVista2(ctx: CtxVista<MovParchis>): Vista<EstadoParchis, MovParchis> {
  return new VistaParchis(ctx, 2);
}
