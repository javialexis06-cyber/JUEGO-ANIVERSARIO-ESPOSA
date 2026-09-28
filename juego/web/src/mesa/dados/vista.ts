// Vista de Dados Party: la tarjeta (arriba y abajo, una columna por jugador), la bandeja con los cinco dados
// en 3D y los botones Tirar / Jugar. Todo se anima desde el movimiento, sea de aquí, de la IA o del otro celular.
import { otro, type Rol } from '../../casa/modelo';
import * as sonido from '../../sonido';
import type { Calidad, CtxVista, Suceso, Vista } from '../tipos';
import {
  ABAJO,
  ARRIBA,
  BONO_ARRIBA,
  CASILLAS,
  type Casilla,
  type EstadoDados,
  META_ARRIBA,
  type MovDados,
  NOMBRES,
  TIROS,
  bonoArriba,
  bonoDados,
  cincoIguales,
  conteo,
  libre,
  opcionesDe,
  problema,
  puedeTirar,
  reglas,
  ronda,
  sumaArriba,
  tirar,
  totalDe,
} from './reglas';
import './dados.css';

// Pruebas: ?rapido=4 acelera también las animaciones del tablero
const RAPIDO = Math.max(1, Number(new URLSearchParams(location.search).get('rapido')) || 1);
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ms = (t: number) => (t / RAPIDO) * (QUIETO ? 0.5 : 1);
const esperar = (t: number) => new Promise<void>((r) => setTimeout(r, ms(t)));
const azarVista = Math.random;

/** Color de los puntos de cada cara (como los dados de colores de Plato). */
const COLOR = ['', '#e4574b', '#ef8a3c', '#d9a21b', '#3fa57a', '#4f93d8', '#9a6ad0'];
/** Dónde va cada punto en la cuadrícula de 3×3. */
const PUNTOS: Record<number, number[]> = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
/** Giro del cubo (X, Y) que deja cada cara mirando hacia arriba (al frente). */
const BASE: Record<number, [number, number]> = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
const MINI: Record<Casilla, string> = {
  unos: 'Unos', doses: 'Doses', treses: 'Treses', cuatros: 'Cuatros', cincos: 'Cincos', seises: 'Seises',
  trio: 'Trío', poker: 'Póker', full: 'Full', esc_peq: 'Esc. corta', esc_gra: 'Esc. larga', dados: '5 iguales', chance: 'Chance',
};

function caraSvg(v: number) {
  const pos = [17, 32, 47];
  const puntos = PUNTOS[v].map((k) => `<circle cx="${pos[k % 3]}" cy="${pos[Math.floor(k / 3)]}" r="6.4" fill="${COLOR[v]}"/>`).join('');
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="5" y="5" width="54" height="54" rx="14" fill="#fffaf1" stroke="#3d2b27" stroke-width="3.5"/>${puntos}</svg>`;
}
const CORAZON = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27C7 20.5 3.5 16.3 3.5 11.2 3.5 7.6 6.3 5 9.6 5c2.6 0 4.8 1.5 6.4 3.9C17.6 6.5 19.8 5 22.4 5c3.3 0 6.1 2.6 6.1 6.2 0 5.1-3.5 9.3-12.5 15.8z" fill="#e86a8a" stroke="#3d2b27" stroke-width="2.2" stroke-linejoin="round"/><circle cx="10.5" cy="10.5" r="2.2" fill="#fff" opacity=".7"/></svg>`;
const cara = (v: number) =>
  `<span class="dados-cara" data-v="${v}" style="--p:${COLOR[v]}">${PUNTOS[v].map((k) => `<i style="--x:${k % 3};--y:${Math.floor(k / 3)}"></i>`).join('')}</span>`;

/** Gira de `actual` a un ángulo equivalente a `meta`, dando `vueltas` completas en la dirección `dir`. */
function girar(actual: number, meta: number, vueltas: number, dir: number) {
  const r = (((meta - actual) % 360) + 360) % 360;
  return dir > 0 ? actual + r + 360 * vueltas : actual - ((360 - r) % 360) - 360 * vueltas;
}
const norm = (a: number) => ((a % 360) + 360) % 360;

interface Dado {
  el: HTMLButtonElement;
  cubo: HTMLElement;
  salto: HTMLElement;
  sombra: HTMLElement;
  x: number;
  y: number;
  z: number;
}

// Sonidos propios: el cubilete, el golpe de los dados y el lápiz
function traqueteo(dur: number) {
  for (let t = 0; t < dur; t += 0.025 + Math.random() * 0.035) {
    sonido.rumor(0.03, 1800 + Math.random() * 2600, 0.05, t, 3);
    if (Math.random() < 0.5) sonido.nota(1500 + Math.random() * 1500, 0.02, t, 'square', 0.012);
  }
}
function golpe(cuando: number, fuerza: number) {
  sonido.rumor(0.05, 2400 + Math.random() * 1200, 0.09 * fuerza, cuando, 2.5);
  sonido.nota(900 + Math.random() * 700, 0.035, cuando, 'triangle', 0.05 * fuerza);
}
const lapiz = () => {
  sonido.rumor(0.16, 3200, 0.05, 0, 1.2, 5200);
  sonido.rumor(0.1, 2600, 0.04, 0.12, 1.2, 4200);
};
const clic = (arriba: boolean) => sonido.nota(arriba ? 880 : 620, 0.05, 0, 'triangle', 0.06, arriba ? 1175 : 480);

/** Qué tan buena fue la anotación, y la etiqueta para los momentos grandes. */
function juzgar(casilla: Casilla, valor: number, cien: boolean, bono: boolean): { calidad: Calidad; texto?: string } {
  if (cien) return { calidad: 'genial', texto: `+${100}` };
  if (bono) return { calidad: 'genial', texto: `¡Bono +${BONO_ARRIBA}!` };
  if (valor === 0) return { calidad: 'nula' };
  const i = ARRIBA.indexOf(casilla as (typeof ARRIBA)[number]);
  if (i >= 0) {
    const n = valor / (i + 1);
    return { calidad: n >= 3 ? 'buena' : n === 2 ? 'normal' : 'mala' };
  }
  switch (casilla) {
    case 'dados':
      return { calidad: 'genial' };
    case 'esc_gra':
      return { calidad: 'genial', texto: '¡Escalera grande!' };
    case 'full':
    case 'esc_peq':
      return { calidad: 'buena' };
    case 'poker':
      return { calidad: valor >= 20 ? 'buena' : 'normal' };
    case 'trio':
      return { calidad: valor >= 24 ? 'buena' : valor >= 15 ? 'normal' : 'mala' };
    default:
      return { calidad: valor >= 25 ? 'buena' : valor >= 19 ? 'normal' : 'mala' };
  }
}

/** ¿El último tiro va detrás de algo grande? (4 iguales guardados o escalera de 4 con la grande libre) */
function persigue(e: EstadoDados, retener: boolean[]): 'dados' | 'escalera' | null {
  const t = e.tarjetas[e.turno];
  const g = e.dados.filter((_, i) => retener[i]);
  const c = conteo(g);
  if (c.some((n) => n >= 4) && (libre(t, 'dados') || t.dados === 50)) return 'dados';
  const seguidos = [1, 2, 3].some((a) => c[a] && c[a + 1] && c[a + 2] && c[a + 3]);
  if (seguidos && libre(t, 'esc_gra')) return 'escalera';
  return null;
}

/**
 * ¿El último tiro se quedó a un dado de algo grande? Iba por 5 iguales o escalera grande (o terminó con 4
 * iguales / escalera de 4 guardando buena parte) y no se dio.
 */
function casi(antes: EstadoDados, m: Extract<MovDados, { t: 'tirar' }>) {
  const t = antes.tarjetas[antes.turno];
  const c = conteo(m.dados);
  const guardados = conteo(antes.dados.filter((_, i) => m.retener[i]));
  const larga = (c[1] && c[2] && c[3] && c[4] && c[5]) || (c[2] && c[3] && c[4] && c[5] && c[6]);
  const tras = persigue(antes, m.retener);
  if (tras === 'dados') return !cincoIguales(m.dados);
  if (tras === 'escalera') return !larga;
  const cuatro = c.findIndex((n) => n === 4);
  if (cuatro > 0 && guardados[cuatro] >= 3 && (libre(t, 'dados') || t.dados === 50)) return true;
  const corta = [1, 2, 3].some((a) => c[a] && c[a + 1] && c[a + 2] && c[a + 3]);
  return corta && !larga && libre(t, 'esc_gra') && guardados.filter((n) => n > 0).length >= 3;
}

class VistaDados implements Vista<EstadoDados, MovDados> {
  private e!: EstadoDados;
  private raiz: HTMLElement;
  private caja: HTMLElement;
  private tarjeta: HTMLElement;
  private bandeja: HTMLElement;
  private pestana: HTMLElement;
  private pista: HTMLElement;
  private btnTirar: HTMLButtonElement;
  private btnJugar: HTMLButtonElement;
  private dados: Dado[] = [];
  private celdas = { el: {}, ella: {} } as Record<Rol, Record<Casilla, HTMLButtonElement>>;
  private bonos = {} as Record<Rol, HTMLElement>;
  private totales = {} as Record<Rol, HTMLElement>;
  private mostrado: Record<Rol, number> = { el: 0, ella: 0 };
  private izq: Rol;
  private der: Rol;
  private permitido: Rol | null = null;
  /** Dados guardados que se ven (en el turno del humano cambian al tocarlos, antes de tirar). */
  private guardados = [false, false, false, false, false];
  private elegida: Casilla | null = null;
  private ocupado = false;
  private enviado = false;
  /** El último movimiento que mandó el humano de este celular (para no hacerle parpadear su propia casilla). */
  private propio: MovDados | null = null;
  private vivo = true;

  constructor(private ctx: CtxVista<MovDados>) {
    this.raiz = ctx.raiz;
    this.der = ctx.yo;
    this.izq = otro(ctx.yo);
    const nombre = (r: Rol) => (ctx.modo === 'local' || r !== ctx.yo ? ctx.nombres[r] : 'TÚ');
    const cols = [this.izq, this.der];
    const cab = `<span class="dados-esquina"></span>${cols.map((r) => `<b class="dados-cab" data-r="${r}">${nombre(r)}</b>`).join('')}`;
    const fila = (c: Casilla) =>
      cols.map((r) => `<button class="dados-celda" data-r="${r}" data-c="${c}" aria-label="${NOMBRES[c].largo} (${ctx.nombres[r]})"><span class="dados-num"></span></button>`).join('');
    const arriba =
      cab +
      ARRIBA.map((c, i) => `<span class="dados-rotulo dados-rotulo-cara" title="${NOMBRES[c].largo}">${caraSvg(i + 1)}</span>${fila(c)}`).join('') +
      `<span class="dados-rotulo dados-rotulo-bono"><small>BONO</small><b>+${BONO_ARRIBA}</b><small>más de ${META_ARRIBA - 1}</small></span>` +
      cols.map((r) => `<div class="dados-bono" data-r="${r}"><b></b><small></small><span class="dados-bono-barra"><i></i></span></div>`).join('');
    const abajo =
      cab +
      ABAJO.map((c, i) => `<span class="dados-rotulo dados-rotulo-abajo" title="${NOMBRES[c].largo}" style="--p:${COLOR[i + 1] ?? 'var(--cacao)'}"><b>${NOMBRES[c].corto}</b><small>${MINI[c]}</small></span>${fila(c)}`).join('') +
      `<span class="dados-rotulo dados-rotulo-total"><b>TOTAL</b></span>` +
      cols.map((r) => `<div class="dados-total" data-r="${r}"><b>0</b></div>`).join('');
    const dado = (i: number) =>
      `<button class="dados-dado vacio" data-i="${i}" aria-label="Dado ${i + 1}"><span class="dados-sombra"></span><span class="dados-alza"><span class="dados-salto"><span class="dados-aro"></span><span class="dados-cubo">${[1, 2, 3, 4, 5, 6].map(cara).join('')}<span class="dados-nucleo"></span><span class="dados-nucleo n2"></span><span class="dados-nucleo n3"></span><span class="dados-corazon">${CORAZON}</span></span></span></span></button>`;
    this.raiz.innerHTML = `<div class="dados-juego">
      <section class="dados-tarjeta" aria-label="Tarjeta de puntos">
        <div class="dados-tabla dados-arriba">${arriba}</div>
        <div class="dados-tabla dados-abajo">${abajo}</div>
      </section>
      <section class="dados-bandeja" aria-label="Dados">
        <span class="dados-pestana"></span>
        <span class="dados-pista" aria-live="polite"></span>
        <div class="dados-fila">${[0, 1, 2, 3, 4].map(dado).join('')}</div>
      </section>
      <div class="dados-acciones">
        <button class="dados-tirar"><span>Tirar</span><span class="dados-quedan" aria-hidden="true"><i></i><i></i><i></i></span></button>
        <button class="dados-jugar" disabled><span>Jugar</span><small></small></button>
      </div>
    </div>`;
    const q = <T extends HTMLElement>(s: string) => this.raiz.querySelector(s) as T;
    this.caja = q('.dados-juego');
    this.tarjeta = q('.dados-tarjeta');
    this.bandeja = q('.dados-bandeja');
    this.pestana = q('.dados-pestana');
    this.pista = q('.dados-pista');
    this.btnTirar = q('.dados-tirar');
    this.btnJugar = q('.dados-jugar');
    for (const b of this.raiz.querySelectorAll<HTMLButtonElement>('.dados-celda')) this.celdas[b.dataset.r as Rol][b.dataset.c as Casilla] = b;
    for (const b of this.raiz.querySelectorAll<HTMLElement>('.dados-bono')) this.bonos[b.dataset.r as Rol] = b;
    for (const b of this.raiz.querySelectorAll<HTMLElement>('.dados-total')) this.totales[b.dataset.r as Rol] = b;
    this.dados = [...this.raiz.querySelectorAll<HTMLButtonElement>('.dados-dado')].map((el) => ({
      el,
      cubo: el.querySelector('.dados-cubo') as HTMLElement,
      salto: el.querySelector('.dados-salto') as HTMLElement,
      sombra: el.querySelector('.dados-sombra') as HTMLElement,
      x: 0,
      y: 0,
      z: 0,
    }));
    this.raiz.addEventListener('click', this.alTocar);
  }

  // -------------------------------------------------------------------------
  // Pintar de una vez
  pintar(e: EstadoDados) {
    this.e = e;
    for (const r of [this.izq, this.der]) {
      for (const c of CASILLAS) this.pintarCelda(r, c);
      this.pintarBono(r, false);
      this.mostrado[r] = totalDe(e, r);
      this.totales[r].firstElementChild!.textContent = String(this.mostrado[r]);
    }
    this.guardados = e.tiradas > 0 ? e.retener.slice() : [false, false, false, false, false];
    this.dados.forEach((d, i) => {
      d.el.classList.toggle('vacio', e.tiradas === 0);
      d.el.classList.toggle('guardado', this.guardados[i]);
      this.orientar(d, e.tiradas > 0 ? e.dados[i] : 1, (azarVista() - 0.5) * 12);
    });
    this.pintarTurno();
    this.pintarPosibles();
    const fin = reglas.fin(e);
    if (fin?.ganador) this.totales[fin.ganador].classList.add('gana');
    this.refrescar();
  }

  private pintarCelda(r: Rol, c: Casilla) {
    const b = this.celdas[r][c];
    const v = this.e.tarjetas[r][c];
    b.classList.remove('posible', 'elegida', 'activa');
    b.classList.toggle('lleno', v !== undefined);
    b.classList.toggle('cero', v === 0);
    b.firstElementChild!.textContent = v === undefined ? '' : String(v);
  }

  private pintarBono(r: Rol, animar: boolean) {
    const t = this.e.tarjetas[r];
    const s = sumaArriba(t);
    const b = this.bonos[r];
    const logrado = bonoArriba(t) > 0;
    const antes = b.classList.contains('logrado');
    b.classList.toggle('logrado', logrado);
    b.querySelector('b')!.textContent = logrado ? `+${BONO_ARRIBA}` : String(s);
    b.querySelector('small')!.textContent = logrado ? `${s} pts` : `/${META_ARRIBA}`;
    (b.querySelector('.dados-bono-barra i') as HTMLElement).style.width = `${Math.min(100, (s / META_ARRIBA) * 100)}%`;
    if (animar && logrado && !antes) {
      b.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.35) rotate(-4deg)', offset: 0.35 }, { transform: 'scale(.95)', offset: 0.7 }, { transform: 'scale(1)' }],
        { duration: ms(700), easing: 'ease-out' },
      );
      this.chispas(b, 14, [COLOR[3], COLOR[1], '#fff8ee']);
    }
  }

  private pintarTurno() {
    const e = this.e;
    const t = e.turno;
    const fin = reglas.fin(e) !== null;
    this.tarjeta.dataset.turno = fin ? '' : t;
    this.bandeja.dataset.quien = t;
    this.caja.dataset.quien = t;
    const quien = this.ctx.modo === 'local' ? this.ctx.nombres[t] : t === this.ctx.yo ? 'Tú' : this.ctx.nombres[t];
    this.pestana.innerHTML = fin ? '¡Se acabó!' : `<b>${quien}</b> · Ronda ${ronda(e)}/13`;
  }

  private pintarPosibles() {
    const e = this.e;
    for (const r of [this.izq, this.der]) for (const c of CASILLAS) if (e.tarjetas[r][c] === undefined) this.pintarCelda(r, c);
    if (e.tiradas === 0 || reglas.fin(e)) return;
    for (const o of opcionesDe(e.tarjetas[e.turno], e.dados)) {
      const b = this.celdas[e.turno][o.casilla];
      b.classList.add('posible');
      b.firstElementChild!.textContent = String(o.valor);
    }
  }

  /** Botones, pista y qué se puede tocar según el momento. */
  private refrescar() {
    const e = this.e;
    const mio = this.permitido !== null && this.permitido === e.turno && !this.ocupado && !this.enviado;
    const todos = this.guardados.every(Boolean);
    const puede = puedeTirar(e);
    this.caja.classList.toggle('mio', mio);
    this.btnTirar.disabled = !mio || !puede || (e.tiradas > 0 && todos);
    this.btnTirar.classList.toggle('invita', mio && e.tiradas === 0);
    this.btnTirar.querySelectorAll('i').forEach((p, i) => p.classList.toggle('usado', i < e.tiradas));
    this.btnTirar.firstElementChild!.textContent = !mio || puede ? 'Tirar' : 'Sin tiros';
    const op = this.elegida ? opcionesDe(e.tarjetas[e.turno], e.dados).find((o) => o.casilla === this.elegida) : undefined;
    this.btnJugar.disabled = !mio || !op;
    this.btnJugar.classList.toggle('listo', mio && !!op);
    this.btnJugar.querySelector('small')!.textContent = op ? `+${op.valor + bonoDados(e.tarjetas[e.turno], e.dados)}` : '';
    for (const c of CASILLAS) {
      const b = this.celdas[e.turno]?.[c];
      if (!b) continue;
      b.classList.toggle('activa', mio && b.classList.contains('posible'));
      b.classList.toggle('elegida', mio && this.elegida === c);
    }
    this.bandeja.classList.toggle('activa', mio && e.tiradas > 0 && puede);
    let pista = '';
    if (mio) {
      if (e.tiradas === 0) pista = '¡Tira los dados!';
      else if (!puede && e.tiradas < TIROS) pista = '¡Comodín! Anota ya';
      else if (!puede) pista = 'Elige dónde anotar';
      else if (todos) pista = 'Suelta un dado para tirar';
      else if (this.elegida) pista = 'Toca Jugar para anotar';
      else pista = this.guardados.some(Boolean) ? 'Tira o elige casilla' : 'Toca un dado para guardarlo';
    }
    this.pista.textContent = pista;
    this.pista.hidden = !pista;
  }

  // -------------------------------------------------------------------------
  // Toques del humano
  private alTocar = (ev: Event) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
    if (!b || !this.raiz.contains(b)) return;
    const e = this.e;
    const mio = this.permitido !== null && this.permitido === e.turno && !this.ocupado && !this.enviado;
    if (!mio) {
      if (b.classList.contains('dados-dado') || b.classList.contains('dados-celda')) this.sacudir(b);
      return;
    }
    if (b.classList.contains('dados-dado')) {
      if (e.tiradas === 0 || !puedeTirar(e)) return this.sacudir(b);
      const i = Number(b.dataset.i);
      this.guardados[i] = !this.guardados[i];
      b.classList.toggle('guardado', this.guardados[i]);
      clic(this.guardados[i]);
      this.refrescar();
    } else if (b.classList.contains('dados-celda')) {
      const c = b.dataset.c as Casilla;
      if (b.dataset.r !== e.turno || !b.classList.contains('posible')) return this.sacudir(b);
      if (this.elegida === c) return this.jugar({ t: 'anotar', casilla: c });
      this.elegida = c;
      this.ctx.sonido('toque');
      this.refrescar();
      b.animate([{ transform: 'scale(.9)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1.04)' }], { duration: ms(260), easing: 'cubic-bezier(.2,1.4,.4,1)' });
    } else if (b === this.btnTirar) {
      if (!puedeTirar(e)) return;
      this.jugar(tirar(e, this.guardados, this.ctx.azar));
    } else if (b === this.btnJugar && this.elegida) {
      this.jugar({ t: 'anotar', casilla: this.elegida });
    }
  };

  private jugar(m: MovDados) {
    if (problema(this.e, m)) return;
    this.enviado = true;
    this.propio = m;
    this.refrescar();
    this.ctx.jugar(m);
  }

  private sacudir(el: HTMLElement) {
    el.animate([{ translate: '0 0' }, { translate: '-3px 0' }, { translate: '3px 0' }, { translate: '-2px 0' }, { translate: '0 0' }], { duration: 220 });
  }

  permitir(quien: Rol | null) {
    this.permitido = quien;
    this.enviado = false;
    if (quien) {
      this.elegida = null;
      this.guardados = this.e.tiradas > 0 ? this.e.retener.slice() : [false, false, false, false, false];
      this.dados.forEach((d, i) => d.el.classList.toggle('guardado', this.guardados[i]));
    }
    this.refrescar();
  }

  // -------------------------------------------------------------------------
  // Animaciones
  async animar(antes: EstadoDados, m: MovDados, despues: EstadoDados) {
    this.ocupado = true;
    this.e = antes;
    this.refrescar();
    try {
      if (m.t === 'tirar') await this.animarTiro(antes, m, despues);
      else await this.animarAnotar(antes, m.casilla, despues, m === this.propio);
    } finally {
      this.e = despues;
      this.ocupado = false;
      this.elegida = null;
      if (this.vivo) this.refrescar();
    }
  }

  private async animarTiro(antes: EstadoDados, m: Extract<MovDados, { t: 'tirar' }>, despues: EstadoDados) {
    const quien = antes.turno;
    this.elegida = null;
    for (const c of CASILLAS) this.celdas[quien][c].classList.remove('posible', 'elegida', 'activa');
    // Los guardados de quien tira (la IA o el otro celular los va tocando uno por uno)
    for (let i = 0; i < 5; i++) {
      if (this.dados[i].el.classList.contains('guardado') === m.retener[i]) continue;
      this.dados[i].el.classList.toggle('guardado', m.retener[i]);
      clic(m.retener[i]);
      await esperar(150);
    }
    this.guardados = m.retener.slice();
    const tras = persigue(antes, m.retener);
    const ultimo = antes.tiradas === TIROS - 1;
    this.ctx.suceso({ tipo: 'lanzar', quien });
    if (ultimo && tras) window.setTimeout(() => this.vivo && this.ctx.suceso({ tipo: 'suerte', quien }), ms(260));
    const rodar = this.dados.filter((_, i) => !m.retener[i]);
    // Cubilete: los dados que se tiran tiemblan un momento
    this.bandeja.animate([{ translate: '0 0' }, { translate: '-2px 1px' }, { translate: '2px -1px' }, { translate: '-1px 0' }, { translate: '0 0' }], { duration: ms(300) });
    traqueteo(ms(300) / 1000);
    await Promise.all(
      rodar.map((d) => {
        d.el.classList.remove('vacio');
        return d.salto.animate(
          [
            { transform: 'translate(0,0) rotate(0)' },
            { transform: `translate(${(azarVista() - 0.5) * 6}px,-5px) rotate(${(azarVista() - 0.5) * 24}deg)` },
            { transform: `translate(${(azarVista() - 0.5) * 6}px,-2px) rotate(${(azarVista() - 0.5) * 24}deg)` },
            { transform: `translate(${(azarVista() - 0.5) * 6}px,-6px) rotate(${(azarVista() - 0.5) * 24}deg)` },
            { transform: 'translate(0,0) rotate(0)' },
          ],
          { duration: ms(300) },
        ).finished.catch(() => undefined);
      }),
    );
    // Los dados saltan, giran y caen con rebote
    const dur = ms(900);
    let ultimoGolpe = 0;
    await Promise.all(
      rodar.map((d, n) => {
        const i = this.dados.indexOf(d);
        const retraso = n * ms(45) + azarVista() * ms(40);
        const alto = 30 + azarVista() * 22;
        const lado = (azarVista() - 0.5) * 22;
        const [bx, by] = BASE[m.dados[i]];
        const x = girar(d.x, bx, 1 + (azarVista() < 0.5 ? 1 : 0), azarVista() < 0.5 ? 1 : -1);
        const y = girar(d.y, by, 1 + (azarVista() < 0.35 ? 1 : 0), azarVista() < 0.5 ? 1 : -1);
        const z = girar(d.z, (azarVista() - 0.5) * 14, azarVista() < 0.5 ? 1 : 0, azarVista() < 0.5 ? 1 : -1);
        const de = d.cubo.style.transform;
        d.x = x;
        d.y = y;
        d.z = z;
        d.cubo.style.transform = this.giro(d);
        d.cubo.animate([{ transform: de }, { transform: d.cubo.style.transform }], { duration: dur * 0.8, delay: retraso, easing: 'cubic-bezier(.15,.6,.3,1)', fill: 'backwards' });
        const arriba = 'cubic-bezier(.25,.8,.5,1)';
        const abajo = 'cubic-bezier(.5,0,.85,.45)';
        d.sombra.animate(
          [
            { transform: 'scale(1)', opacity: 1, easing: arriba },
            { transform: 'scale(.5)', opacity: 0.35, offset: 0.2, easing: abajo },
            { transform: 'scale(1.05)', opacity: 1, offset: 0.44, easing: arriba },
            { transform: 'scale(.8)', opacity: 0.7, offset: 0.58, easing: abajo },
            { transform: 'scale(1)', opacity: 1, offset: 0.74 },
            { transform: 'scale(1)', opacity: 1 },
          ],
          { duration: dur, delay: retraso },
        );
        golpe((retraso + dur * 0.44) / 1000, 1);
        golpe((retraso + dur * 0.74) / 1000, 0.45);
        ultimoGolpe = Math.max(ultimoGolpe, retraso + dur * 0.44);
        return d.salto.animate(
          [
            { transform: 'translate(0,0) scale(1)', easing: arriba },
            { transform: `translate(${lado}px,${-alto}px) scale(1.14)`, offset: 0.2, easing: abajo },
            { transform: `translate(${lado * 0.6}px,0) scale(1,.94)`, offset: 0.44, easing: arriba },
            { transform: `translate(${lado * 0.3}px,${-alto * 0.28}px) scale(1.04)`, offset: 0.58, easing: abajo },
            { transform: 'translate(0,0) scale(1,.97)', offset: 0.74, easing: 'ease-out' },
            { transform: `translate(0,${-alto * 0.06}px) scale(1)`, offset: 0.86, easing: 'ease-in' },
            { transform: 'translate(0,0) scale(1)' },
          ],
          { duration: dur, delay: retraso },
        ).finished.catch(() => undefined);
      }),
    );
    if (!this.vivo) return;
    // Quietos: se normalizan los ángulos (mismo giro, números chicos)
    for (const d of rodar) {
      d.x = norm(d.x);
      d.y = norm(d.y);
      d.z = norm(d.z + 180) - 180;
      d.cubo.style.transform = this.giro(d);
      d.el.style.setProperty('--rz', `${d.z}deg`);
    }
    this.e = despues;
    this.pintarPosibles();
    const t = antes.tarjetas[quien];
    if (cincoIguales(m.dados)) {
      // ¡DADOS PARTY!
      this.fiesta();
      this.ctx.suceso({ tipo: 'jugada', quien, calidad: 'genial', texto: '¡DADOS PARTY!' });
      if (t.dados === 50) this.ctx.sonido('campana');
      await esperar(500);
    } else if (ultimo && casi(antes, m)) {
      this.ctx.suceso({ tipo: 'casi', quien });
    }
  }

  private async animarAnotar(antes: EstadoDados, casilla: Casilla, despues: EstadoDados, propia: boolean) {
    const quien = antes.turno;
    const t = antes.tarjetas[quien];
    const cel = this.celdas[quien][casilla];
    const valor = despues.tarjetas[quien][casilla] ?? 0;
    const cien = bonoDados(t, antes.dados) > 0;
    const bono = bonoArriba(t) === 0 && bonoArriba(despues.tarjetas[quien]) > 0;
    // La casilla elegida parpadea (si la eligió otro) y se escribe
    this.elegida = null;
    for (const c of CASILLAS) this.celdas[quien][c].classList.remove('activa', 'elegida');
    cel.classList.add('elegida');
    if (!propia) {
      this.ctx.sonido('toque');
      await cel.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.25 }, { transform: 'scale(1)', offset: 0.5 }, { transform: 'scale(1.14)', offset: 0.75 }, { transform: 'scale(1)' }],
        { duration: ms(560), easing: 'ease-in-out' },
      ).finished.catch(() => undefined);
    } else await esperar(90);
    if (!this.vivo) return;
    this.e = despues;
    this.pintarPosibles();
    this.pintarCelda(quien, casilla);
    cel.classList.add('escrita');
    cel.animate(
      [{ transform: 'scale(1.7) rotate(-8deg)', opacity: 0.2 }, { transform: 'scale(.92) rotate(2deg)', opacity: 1, offset: 0.55 }, { transform: 'scale(1)' }],
      { duration: ms(420), easing: 'cubic-bezier(.2,1.4,.4,1)' },
    );
    lapiz();
    const juicio = juzgar(casilla, valor, cien, bono);
    const s: Suceso = { tipo: 'jugada', quien, calidad: juicio.calidad, ...(juicio.texto ? { texto: juicio.texto } : {}) };
    this.ctx.suceso(s);
    if (valor === 0 && !cien) this.ctx.sonido('vacia');
    else if (juicio.calidad === 'genial') this.ctx.sonido(casilla === 'dados' ? 'regalo' : 'corazon');
    else if (juicio.calidad === 'buena') this.ctx.sonido('repuesto');
    if (cien) this.flotar(this.celdas[quien].dados, '+100');
    this.pintarBono(quien, true);
    await this.contar(quien, totalDe(despues, quien));
    await esperar(260);
    window.setTimeout(() => cel.classList.remove('escrita'), ms(900));
    const fin = reglas.fin(despues);
    if (fin) {
      this.pintarTurno();
      if (fin.ganador) this.totales[fin.ganador].classList.add('gana');
      this.dados.forEach((d) => d.el.classList.remove('guardado'));
      return;
    }
    await this.cambiarTurno();
  }

  /** Los dados salen de la bandeja y vuelven vacíos (con corazón) para el siguiente jugador. */
  private async cambiarTurno() {
    this.guardados = [false, false, false, false, false];
    await Promise.all(
      this.dados.map((d, i) =>
        d.el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(10px) scale(.6)', opacity: 0 }], { duration: ms(170), delay: ms(i * 30), fill: 'forwards', easing: 'ease-in' }).finished.catch(() => undefined),
      ),
    );
    if (!this.vivo) return;
    this.pintarTurno();
    this.dados.forEach((d) => {
      d.el.classList.remove('guardado');
      d.el.classList.add('vacio');
      this.orientar(d, 1, (azarVista() - 0.5) * 12);
    });
    await Promise.all(
      this.dados.map((d, i) => {
        d.el.getAnimations().forEach((a) => a.cancel());
        return d.el.animate([{ transform: 'translateY(-14px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
          duration: ms(320),
          delay: ms(i * 40),
          easing: 'cubic-bezier(.2,1.4,.4,1)',
          fill: 'backwards',
        }).finished.catch(() => undefined);
      }),
    );
  }

  private giro(d: Dado) {
    return `rotateZ(${d.z}deg) rotateX(${d.x}deg) rotateY(${d.y}deg)`;
  }

  private orientar(d: Dado, v: number, z: number) {
    [d.x, d.y] = BASE[v];
    d.z = z;
    d.cubo.style.transform = this.giro(d);
    d.el.style.setProperty('--rz', `${z}deg`);
  }

  /** El total sube contando. */
  private async contar(r: Rol, hasta: number) {
    const el = this.totales[r];
    const b = el.firstElementChild!;
    const desde = this.mostrado[r];
    this.mostrado[r] = hasta;
    if (desde === hasta) return;
    el.classList.remove('sube');
    void el.offsetWidth;
    el.classList.add('sube');
    const dur = ms(Math.min(700, 250 + (hasta - desde) * 6));
    const t0 = performance.now();
    await new Promise<void>((listo) => {
      const paso = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        b.textContent = String(Math.round(desde + (hasta - desde) * (1 - (1 - k) ** 3)));
        if (k < 1 && this.vivo) requestAnimationFrame(paso);
        else listo();
      };
      paso();
    });
  }

  /** «+100» que sube desde la casilla. */
  private flotar(desde: HTMLElement, texto: string) {
    const r = desde.getBoundingClientRect();
    const base = this.caja.getBoundingClientRect();
    const f = document.createElement('span');
    f.className = 'dados-flota';
    f.textContent = texto;
    f.style.left = `${r.left - base.left + r.width / 2}px`;
    f.style.top = `${r.top - base.top}px`;
    this.caja.append(f);
    f.animate(
      [{ transform: 'translate(-50%, 0) scale(.4)', opacity: 0 }, { transform: 'translate(-50%, -22px) scale(1.2)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%, -60px) scale(1)', opacity: 0 }],
      { duration: ms(1400), easing: 'ease-out' },
    ).finished.then(() => f.remove(), () => f.remove());
    this.chispas(desde, 12, [COLOR[1], COLOR[3], COLOR[5]]);
  }

  /** Chispas de colores (puntos de dado) que saltan desde un elemento. */
  private chispas(desde: HTMLElement, n: number, colores: string[]) {
    const r = desde.getBoundingClientRect();
    const base = this.caja.getBoundingClientRect();
    const cx = r.left - base.left + r.width / 2;
    const cy = r.top - base.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'dados-chispa';
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.background = colores[i % colores.length];
      this.caja.append(p);
      const ang = (i / n) * Math.PI * 2 + azarVista() * 0.5;
      const dist = 30 + azarVista() * 50;
      p.animate(
        [
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist - 10}px)) scale(.3)`, opacity: 0 },
        ],
        { duration: ms(650 + azarVista() * 300), easing: 'cubic-bezier(.2,.8,.4,1)' },
      ).finished.then(() => p.remove(), () => p.remove());
    }
  }

  /** ¡DADOS PARTY!: los cinco saltan en ola y la bandeja se llena de chispas. */
  private fiesta() {
    this.bandeja.classList.remove('fiesta');
    void this.bandeja.offsetWidth;
    this.bandeja.classList.add('fiesta');
    window.setTimeout(() => this.bandeja.classList.remove('fiesta'), ms(1600));
    this.dados.forEach((d, i) =>
      d.salto.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(-16px) scale(1.1)', offset: 0.4 }, { transform: 'translateY(0)', offset: 0.7 }, { transform: 'translateY(0)' }],
        { duration: ms(520), delay: ms(i * 70), easing: 'ease-in-out' },
      ),
    );
    this.dados.forEach((d) => this.chispas(d.el, 7, COLOR.slice(1)));
    [523, 659, 784, 1046, 1318].forEach((f, i) => sonido.nota(f, 0.16, 0.05 + i * 0.07, 'triangle', 0.07));
  }

  destruir() {
    this.vivo = false;
    this.raiz.removeEventListener('click', this.alTocar);
    for (const a of this.raiz.getAnimations({ subtree: true })) a.cancel();
    this.raiz.innerHTML = '';
  }
}


export function crearVista(ctx: CtxVista<MovDados>): Vista<EstadoDados, MovDados> {
  return new VistaDados(ctx);
}
