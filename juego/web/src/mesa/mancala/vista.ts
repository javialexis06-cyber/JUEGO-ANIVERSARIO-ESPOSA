// Vista del Mancala: tablero de madera tallada (a lo largo en el celular parado, acostado si hay ancho),
// semillas de colores que saltan de hoyo en hoyo al sembrar y vuelan al almacén al capturar.
// El lado de `yo` va a la izquierda con su almacén abajo: así la siembra se ve en sentido antihorario.
import type { Rol } from '../../casa/modelo';
import * as sonido from '../../sonido';
import type { CtxVista, Suceso, Vista } from '../tipos';
import { juzgar } from './ia';
import { base, CASILLAS, duenoDe, type EstadoMancala, esAlmacen, HOYOS, type Jugada, type Recorrido, recorrer } from './reglas';
import './mancala.css';

const PALETA: [string, string][] = [
  ['#e4574b', '#a8322a'],
  ['#8fd3b6', '#3f9a78'],
  ['#f6cf5a', '#c4951c'],
  ['#9ccbef', '#4f8dc2'],
  ['#f4b6c2', '#d0708a'],
  ['#5b8fd6', '#2f5fa3'],
  ['#e86a8a', '#b23f60'],
  ['#b99be6', '#7a58b8'],
  ['#f59d52', '#c0661f'],
];

const params = new URLSearchParams(location.search);
/** Pruebas: `?rapido=4` acelera también las animaciones del tablero. */
const RAPIDO = Math.max(1, Number(params.get('rapido')) || 1);
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const VEL = (quieto ? 0.6 : 1) / RAPIDO;

/** Azar fijo por número (las semillas caen siempre en el mismo sitio de cada hoyo). */
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

interface Caja {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Punto {
  x: number;
  y: number;
}
interface Plano {
  vertical: boolean;
  /** Diámetro de una semilla. */
  d: number;
  tabla: Caja;
  casillas: Caja[];
  /** Dónde va el numerito de cada casilla (en los almacenes, la etiqueta con el nombre). */
  cuentas: Punto[];
  lados: Record<Rol, Caja>;
}

/** Reparte el tablero en el espacio: centros y tamaños en px de la mesa. */
function planear(W: number, H: number, yo: Rol): Plano {
  const casillas: Caja[] = [];
  const cuentas: Punto[] = [];
  const mio = (i: number) => duenoDe(i) === yo;
  const vertical = H > W * 0.95;
  if (vertical) {
    const g = limitar(Math.round(H * 0.012), 5, 10);
    const lat = limitar(W * 0.11, 30, 50);
    let ph = Math.min((H - 9 * g) / 8.8, 96);
    const pw = Math.min(ph * 1.75, (W - 2 * lat - 3 * g) / 2);
    if (pw < ph * 1.15) ph = pw / 1.15;
    const sh = ph * 1.4;
    const bw = 2 * pw + 3 * g, bh = 2 * sh + 6 * ph + 9 * g;
    const x0 = (W - bw) / 2, y0 = (H - bh) / 2;
    const colX = [x0 + g + pw / 2, x0 + 2 * g + 1.5 * pw];
    const filaY = (r: number) => y0 + 2 * g + sh + r * (ph + g) + ph / 2;
    const fuera = Math.min(22, x0 - 14);
    for (let i = 0; i < CASILLAS; i++) {
      const k = i - base(duenoDe(i));
      if (esAlmacen(i)) {
        const y = mio(i) ? y0 + bh - g - sh / 2 : y0 + g + sh / 2;
        casillas.push({ x: x0 + bw / 2, y, w: bw - 2 * g, h: sh });
        cuentas.push({ x: mio(i) ? x0 - fuera - 6 : x0 + bw + fuera + 6, y });
      } else {
        const c = { x: colX[mio(i) ? 0 : 1], y: filaY(mio(i) ? k : HOYOS - 1 - k), w: pw, h: ph };
        casillas.push(c);
        cuentas.push({ x: mio(i) ? x0 - fuera : x0 + bw + fuera, y: c.y });
      }
    }
    const lado = (x: number): Caja => ({ x, y: (filaY(0) + filaY(5)) / 2, w: pw + g, h: 6 * ph + 6 * g });
    const otroRol: Rol = yo === 'el' ? 'ella' : 'el';
    return {
      vertical,
      d: limitar(Math.min(ph, pw) * 0.27, 9, 19),
      tabla: { x: W / 2, y: H / 2, w: bw, h: bh },
      casillas,
      cuentas,
      lados: { [yo]: lado(colX[0]), [otroRol]: lado(colX[1]) } as Record<Rol, Caja>,
    };
  }
  // Acostado: la fila de `yo` abajo (de izquierda a derecha) y su almacén a la derecha
  const g = limitar(Math.round(Math.min(W, H) * 0.02), 5, 10);
  const lat = limitar(H * 0.1, 22, 34);
  let pw = (W - 9 * g) / 8.7;
  let ph = Math.min((H - 2 * lat - 3 * g) / 2, pw * 0.95, 110);
  pw = Math.min(pw, ph * 1.3);
  ph = Math.min(ph, pw);
  const sw = pw * 1.35;
  const bw = 6 * pw + 2 * sw + 9 * g, bh = 2 * ph + 3 * g;
  const x0 = (W - bw) / 2, y0 = (H - bh) / 2;
  const colX = (c: number) => x0 + 2 * g + sw + c * (pw + g) + pw / 2;
  const filaY = [y0 + g + ph / 2, y0 + 2 * g + 1.5 * ph];
  const fuera = Math.min(17, y0 - 12);
  for (let i = 0; i < CASILLAS; i++) {
    const k = i - base(duenoDe(i));
    if (esAlmacen(i)) {
      const x = mio(i) ? x0 + bw - g - sw / 2 : x0 + g + sw / 2;
      casillas.push({ x, y: y0 + bh / 2, w: sw, h: bh - 2 * g });
      cuentas.push({ x, y: mio(i) ? y0 + bh + fuera + 4 : y0 - fuera - 4 });
    } else {
      const c = { x: colX(mio(i) ? k : HOYOS - 1 - k), y: filaY[mio(i) ? 1 : 0], w: pw, h: ph };
      casillas.push(c);
      cuentas.push({ x: c.x, y: mio(i) ? y0 + bh + fuera : y0 - fuera });
    }
  }
  const lado = (y: number): Caja => ({ x: (colX(0) + colX(5)) / 2, y, w: 6 * pw + 6 * g, h: ph + g });
  const otroRol: Rol = yo === 'el' ? 'ella' : 'el';
  return {
    vertical,
    d: limitar(Math.min(ph, pw) * 0.27, 9, 19),
    tabla: { x: W / 2, y: H / 2, w: bw, h: bh },
    casillas,
    cuentas,
    lados: { [yo]: lado(filaY[1]), [otroRol]: lado(filaY[0]) } as Record<Rol, Caja>,
  };
}

interface Semilla {
  el: HTMLElement;
  x: number;
  y: number;
  s: number;
  /** Giro del brillo (no parecen calcadas). */
  giro: number;
}
interface Vuelo {
  sem: Semilla;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  s0: number;
  s1: number;
  alto: number;
  t0: number;
  dur: number;
  listo: () => void;
}

export function crearVista(ctx: CtxVista<Jugada>): Vista<EstadoMancala, Jugada> {
  const nombre = (r: Rol) => (ctx.modo === 'local' ? ctx.nombres[r] : r === ctx.yo ? 'Tú' : ctx.nombres[r]);
  const h = <K extends keyof HTMLElementTagNameMap>(tag: K, clase: string, padre: HTMLElement) => {
    const n = document.createElement(tag);
    n.className = clase;
    padre.append(n);
    return n;
  };

  const mesa = h('div', 'mancala-mesa', ctx.raiz);
  const tabla = h('div', 'mancala-tabla', mesa);
  const lados = {} as Record<Rol, HTMLElement>;
  for (const r of ['el', 'ella'] as Rol[]) {
    lados[r] = h('div', 'mancala-lado', mesa);
    lados[r].dataset.dueno = r;
  }
  const casillas: HTMLElement[] = [];
  const cuentas: HTMLElement[] = [];
  const numeros: HTMLElement[] = [];
  for (let i = 0; i < CASILLAS; i++) {
    const dueno = duenoDe(i);
    if (esAlmacen(i)) {
      const a = h('div', 'mancala-casilla mancala-almacen', mesa);
      h('span', 'mancala-grabado', a).textContent = nombre(dueno);
      casillas.push(a);
      const t = h('div', 'mancala-granero', mesa);
      h('b', 'mancala-granero-nombre', t).textContent = nombre(dueno);
      numeros[i] = h('span', 'mancala-granero-num', t);
      cuentas.push(t);
    } else {
      const b = h('button', 'mancala-casilla mancala-hoyo', mesa);
      b.type = 'button';
      b.disabled = true;
      b.dataset.i = String(i);
      casillas.push(b);
      const c = h('span', 'mancala-cuenta', mesa);
      numeros[i] = c;
      cuentas.push(c);
    }
    casillas[i].dataset.dueno = dueno;
    cuentas[i].dataset.dueno = dueno;
  }
  const capaSemillas = h('div', 'mancala-semillas', mesa);
  const capaEfectos = h('div', 'mancala-efectos', mesa);

  let plano: Plano = planear(1, 1, ctx.yo);
  let pilas: Semilla[][] = Array.from({ length: CASILLAS }, () => []);
  let permitido: Rol | null = null;
  let destruido = false;
  let animando = false;
  let seMovio = false;
  /** Turnos extra seguidos del que juega (para la «cadena»). */
  let racha = 0;
  let nSemillas = 0;

  // ---------------------------------------------------------------------------
  // Motor de vuelos: cada semilla va de donde está a donde toca, por un arco
  const vuelos = new Set<Vuelo>();
  let raf = 0;
  const poner = (s: Semilla, x: number, y: number, esc: number, alza = 0) => {
    s.x = x;
    s.y = y;
    s.s = esc;
    s.el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - alza).toFixed(1)}px, 0) scale(${esc.toFixed(3)}) rotate(${s.giro}deg)`;
  };
  const cuadro = (ahora: number) => {
    raf = 0;
    for (const v of vuelos) {
      const t = limitar((ahora - v.t0) / v.dur, 0, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const arco = 4 * t * (1 - t);
      const x = v.x0 + (v.x1 - v.x0) * e, y = v.y0 + (v.y1 - v.y0) * e;
      poner(v.sem, x, y, v.s0 + (v.s1 - v.s0) * e + (v.alto > 0 ? 0.22 * arco : 0), v.alto * arco);
      v.sem.x = x;
      v.sem.y = y;
      if (t >= 1) {
        vuelos.delete(v);
        v.listo();
      }
    }
    if (vuelos.size && !destruido) raf = requestAnimationFrame(cuadro);
  };
  const volar = (sem: Semilla, x1: number, y1: number, dur: number, alto: number, s1 = 1): Promise<void> =>
    new Promise((listo) => {
      for (const v of vuelos) if (v.sem === sem) {
        vuelos.delete(v);
        v.listo();
      }
      if (destruido || dur <= 0) {
        poner(sem, x1, y1, s1);
        return listo();
      }
      vuelos.add({ sem, x0: sem.x, y0: sem.y, x1, y1, s0: sem.s, s1, alto, t0: performance.now(), dur: dur * VEL, listo });
      if (!raf) raf = requestAnimationFrame(cuadro);
    });
  const pausa = (ms: number) => new Promise<void>((r) => (destruido ? r() : setTimeout(r, ms * VEL)));

  // ---------------------------------------------------------------------------
  // Dónde queda cada semilla dentro de su casilla: espiral de girasol con un poquito de desorden; si no caben,
  // se amontonan encima (más arriba y por delante)
  function hueco(i: number, k: number): Punto & { z: number } {
    const c = plano.casillas[i];
    const d = plano.d;
    const rx = Math.max(2, c.w / 2 - d * 0.78), ry = Math.max(2, c.h / 2 - d * 0.78);
    const cap = Math.max(5, Math.floor((Math.PI * rx * ry) / (d * d * 0.85)));
    const capa = Math.floor(k / cap), j = k % cap;
    const a = j * 2.39996 + i * 0.9 + capa * 1.3;
    const rr = Math.sqrt((j + 0.5) / cap) * (capa ? 0.78 : 1);
    return {
      x: c.x + rx * rr * Math.cos(a) + (hash(i * 131 + k * 7) - 0.5) * d * 0.3,
      y: c.y + ry * rr * Math.sin(a) + (hash(i * 71 + k * 13 + 5) - 0.5) * d * 0.3 - capa * d * 0.3,
      z: 10 + capa * 60 + j,
    };
  }
  /** Punto de la «mano» que lleva las semillas por encima de la casilla `i`. */
  function enMano(i: number, j: number): Punto {
    const c = plano.casillas[i];
    const d = plano.d;
    const a = j * 2.39996, rr = d * 0.52 * Math.sqrt(j);
    return { x: c.x + rr * Math.cos(a), y: c.y - d * 0.35 + rr * Math.sin(a) * 0.8 };
  }
  function asentar(s: Semilla, i: number, k: number) {
    const p = hueco(i, k);
    s.el.style.zIndex = String(p.z);
    s.el.classList.remove('mancala-en-mano');
    return p;
  }

  function nuevaSemilla(): Semilla {
    const n = nSemillas++;
    const [c, c2] = PALETA[Math.floor(hash(n * 17 + 3) * PALETA.length)];
    const el = h('i', 'mancala-semilla', capaSemillas);
    el.style.setProperty('--c', c);
    el.style.setProperty('--c2', c2);
    return { el, x: 0, y: 0, s: 1, giro: Math.round(hash(n * 29 + 1) * 40 - 20) };
  }

  // ---------------------------------------------------------------------------
  function contar(i: number, salto = false) {
    const n = pilas[i].length;
    numeros[i].textContent = String(n);
    if (!esAlmacen(i)) {
      cuentas[i].classList.toggle('vacio', n === 0);
      casillas[i].setAttribute('aria-label', `Hoyo con ${n} semilla${n === 1 ? '' : 's'}`);
    }
    if (salto) {
      const c = esAlmacen(i) ? numeros[i] : cuentas[i];
      c.classList.remove('salta');
      void c.offsetWidth;
      c.classList.add('salta');
    }
  }

  function medir() {
    const W = mesa.clientWidth, H = mesa.clientHeight;
    if (!W || !H) return;
    plano = planear(W, H, ctx.yo);
    mesa.classList.toggle('vertical', plano.vertical);
    mesa.classList.toggle('acostado', !plano.vertical);
    mesa.style.setProperty('--d', `${plano.d.toFixed(1)}px`);
    mesa.style.setProperty('--ph', `${Math.min(plano.casillas[0].w, plano.casillas[0].h).toFixed(1)}px`);
    const caja = (n: HTMLElement, c: Caja) => {
      n.style.left = `${c.x - c.w / 2}px`;
      n.style.top = `${c.y - c.h / 2}px`;
      n.style.width = `${c.w}px`;
      n.style.height = `${c.h}px`;
    };
    caja(tabla, plano.tabla);
    for (const r of ['el', 'ella'] as Rol[]) caja(lados[r], plano.lados[r]);
    for (let i = 0; i < CASILLAS; i++) {
      caja(casillas[i], plano.casillas[i]);
      cuentas[i].style.left = `${plano.cuentas[i].x}px`;
      cuentas[i].style.top = `${plano.cuentas[i].y}px`;
    }
    if (animando) seMovio = true;
    else recolocar();
  }
  function recolocar() {
    for (let i = 0; i < CASILLAS; i++) {
      pilas[i].forEach((s, k) => {
        const p = asentar(s, i, k);
        poner(s, p.x, p.y, 1);
      });
    }
  }
  const obs = new ResizeObserver(() => medir());
  obs.observe(mesa);

  function pintar(e: EstadoMancala) {
    for (const v of vuelos) v.listo();
    vuelos.clear();
    capaSemillas.innerHTML = '';
    capaEfectos.innerHTML = '';
    nSemillas = 0;
    pilas = e.c.map((n) => Array.from({ length: n }, () => nuevaSemilla()));
    medir();
    recolocar();
    for (let i = 0; i < CASILLAS; i++) contar(i);
    marcarTurno(e.fin ? null : e.turno);
  }

  function marcarTurno(t: Rol | null) {
    for (let i = 0; i < CASILLAS; i++) if (esAlmacen(i)) cuentas[i].classList.toggle('activo', duenoDe(i) === t);
    for (const r of ['el', 'ella'] as Rol[]) lados[r].classList.toggle('activo', r === t);
  }

  const coincide = (e: EstadoMancala) => e.c.every((n, i) => pilas[i].length === n);

  // ---------------------------------------------------------------------------
  // Efectos: números que flotan, destellos, sonidos
  function flotar(texto: string, i: number, dueno: Rol) {
    const c = plano.casillas[i];
    const f = h('span', 'mancala-flota', capaEfectos);
    f.dataset.dueno = dueno;
    f.textContent = texto;
    f.style.left = `${c.x}px`;
    f.style.top = `${c.y}px`;
    f.style.animationDuration = `${1100 * VEL}ms`;
    setTimeout(() => f.remove(), 1200 * VEL);
  }
  function destello(i: number, clase = 'brilla') {
    const c = casillas[i];
    c.classList.remove(clase);
    void c.offsetWidth;
    c.classList.add(clase);
    setTimeout(() => c.classList.remove(clase), 900 * VEL);
  }
  /** Clic de semilla contra la madera; más agudo a medida que avanza la siembra. */
  function clic(n: number, alAlmacen: boolean) {
    if (alAlmacen) {
      sonido.nota(392 + n * 18, 0.12, 0, 'sine', 0.08);
      sonido.nota(784 + n * 36, 0.06, 0.01, 'triangle', 0.035);
    } else {
      sonido.nota(820 + n * 48, 0.045, 0, 'triangle', 0.045);
    }
    sonido.rumor(0.03, 3200 + n * 90, 0.035, 0, 3.5);
  }
  const zumbido = (dur = 0.4) => sonido.rumor(dur, 420, 0.06, 0, 1.1, 2600);

  // ---------------------------------------------------------------------------
  // Sembrar: la mano levanta las semillas y va dejando una en cada casilla, saltando de una a otra
  async function sembrar(r: Recorrido) {
    const mano = pilas[r.desde].splice(0);
    const n = mano.length;
    contar(r.desde, true);
    destello(r.desde, 'sale');
    sonido.rumor(0.1, 1900, 0.05, 0, 1.4);
    const d = plano.d;
    mano.forEach((s, j) => {
      const p = enMano(r.desde, j);
      s.el.style.zIndex = String(1000 + n - j);
      s.el.classList.add('mancala-en-mano');
      void volar(s, p.x, p.y, 190, d * 1.1, 1.15);
    });
    await pausa(200);
    const paso = n <= 6 ? 125 : Math.max(80, 125 - (n - 6) * 5);
    for (let t = 0; t < n; t++) {
      const dest = r.caidas[t];
      const resto = mano.slice(t);
      resto.forEach((s, j) => {
        const p = enMano(dest, j);
        void volar(s, p.x, p.y, paso, d * 0.9, 1.15);
      });
      await pausa(paso);
      const s = mano[t];
      const k = pilas[dest].length;
      pilas[dest].push(s);
      const p = asentar(s, dest, k);
      void volar(s, p.x, p.y, 110, 0, 1);
      contar(dest, true);
      clic(t, esAlmacen(dest));
      if (esAlmacen(dest)) destello(dest);
    }
    await pausa(130);
  }

  /** Lleva semillas de varias casillas a un almacén en un barrido lindo; las cuenta al llegar. */
  async function alAlmacen(desde: number[], destino: number, retraso = 45) {
    const viajan: [Semilla, number][] = [];
    for (const i of desde) {
      for (const s of pilas[i].splice(0)) viajan.push([s, i]);
      contar(i, true);
    }
    const d = plano.d;
    await Promise.all(
      viajan.map(async ([s], j) => {
        await pausa(j * retraso);
        s.el.classList.add('mancala-en-mano');
        s.el.style.zIndex = String(900 + j);
        const k = pilas[destino].length;
        pilas[destino].push(s);
        const p = hueco(destino, k);
        await volar(s, p.x, p.y, 480, d * 3.2, 1);
        asentar(s, destino, k);
        contar(destino, true);
        if (j % 2 === 0 || viajan.length < 6) clic(Math.min(j, 12), true);
      }),
    );
  }

  // ---------------------------------------------------------------------------
  async function animar(antes: EstadoMancala, m: Jugada, despues: EstadoMancala) {
    if (destruido) return;
    if (!coincide(antes)) pintar(antes);
    animando = true;
    seMovio = false;
    marcarTurno(antes.turno);
    const quien = antes.turno;
    const r = recorrer(antes.c, quien, m.hoyo);
    const juicio = juzgar(antes, m);
    const mio = quien === 'el' ? 6 : 13;
    const suceso = (s: Suceso) => {
      if (!destruido) ctx.suceso(s);
    };

    await sembrar(r);

    if (r.extra && !r.barrido) {
      racha++;
      sonido.nota(1046, 0.1, 0, 'triangle', 0.06);
      ctx.sonido('repuesto');
      destello(mio, 'otra-vez');
      if (racha >= 3) suceso({ tipo: 'jugada', quien, calidad: 'genial', texto: `¡Cadena de ${racha}!` });
      // `texto` no está en el tipo de turno_extra, pero la mesa lo muestra igual
      else suceso({ tipo: 'turno_extra', quien, texto: '¡Otra vez!' } as Suceso);
    } else {
      racha = 0;
    }
    if (r.captura) {
      const { hoyo, enfrente, ajenas } = r.captura;
      await pausa(120);
      destello(hoyo, 'captura');
      if (ajenas > 0) destello(enfrente, 'robado');
      await pausa(160);
      const cuanto = 1 + ajenas;
      if (ajenas > 0) {
        suceso({ tipo: 'captura', quien, cuanto, texto: `¡Captura +${cuanto}!` });
        zumbido(0.45);
        ctx.sonido('atrapado');
      } else {
        suceso({ tipo: 'jugada', quien, calidad: 'normal' });
      }
      await alAlmacen(ajenas > 0 ? [enfrente, hoyo] : [hoyo], mio, 55);
      if (ajenas > 0) flotar(`+${cuanto}`, mio, quien);
    } else if (!r.extra) {
      if (juicio.regalo) suceso({ tipo: 'regalo', quien, texto: '¡Regalito!' });
      else suceso({ tipo: 'jugada', quien, calidad: juicio.calidad });
    } else if (r.barrido) {
      suceso({ tipo: 'jugada', quien, calidad: 'buena' });
    }

    if (r.barrido) {
      // Se acabó: cada uno se lleva lo que le quedó en sus hoyos
      await pausa(320);
      zumbido(0.6);
      ctx.sonido('limpio');
      const barridos = (['el', 'ella'] as Rol[]).map(async (dueno) => {
        const hoyos = Array.from({ length: HOYOS }, (_, k) => base(dueno) + k).filter((i) => pilas[i].length > 0);
        if (!hoyos.length) return;
        const cuanto = hoyos.reduce((a, i) => a + pilas[i].length, 0);
        const almacen = dueno === 'el' ? 6 : 13;
        await alAlmacen(hoyos, almacen, 38);
        flotar(`+${cuanto}`, almacen, dueno);
      });
      await Promise.all(barridos);
      await pausa(250);
    }

    animando = false;
    if (seMovio) recolocar();
    if (!coincide(despues)) pintar(despues);
    marcarTurno(despues.fin ? null : despues.turno);
  }

  // ---------------------------------------------------------------------------
  // Jugar: tocar un hoyo propio siembra; dejarlo apretado muestra dónde cae la última (sin jugar)
  let tPrevia = 0;
  /** La vista previa salió por dejar el dedo encima: al soltar no se juega. */
  let previaLarga = false;
  let apretado: number | null = null;

  function mostrarPrevia(i: number) {
    ocultarPrevia();
    const quien = duenoDe(i);
    const r = recorrer(
      pilas.map((p) => p.length),
      quien,
      i - base(quien),
    );
    for (const c of new Set(r.caidas)) casillas[c].classList.add('mancala-paso');
    const ultima = r.caidas[r.caidas.length - 1];
    casillas[ultima].classList.add('mancala-destino');
    const texto = r.extra ? '¡Otra vez!' : r.captura && r.captura.ajenas > 0 ? `Captura +${1 + r.captura.ajenas}` : '';
    const c = plano.casillas[ultima];
    const fantasma = h('i', 'mancala-fantasma', capaEfectos);
    const p = hueco(ultima, pilas[ultima].length);
    fantasma.style.left = `${p.x}px`;
    fantasma.style.top = `${p.y}px`;
    if (texto) {
      const t = h('span', 'mancala-previa', capaEfectos);
      t.dataset.dueno = quien;
      t.textContent = texto;
      t.style.left = `${c.x}px`;
      t.style.top = `${c.y - c.h / 2}px`;
    }
  }
  function ocultarPrevia() {
    for (const c of casillas) c.classList.remove('mancala-paso', 'mancala-destino');
    for (const n of capaEfectos.querySelectorAll('.mancala-fantasma, .mancala-previa')) n.remove();
  }
  const jugable = (i: number) => permitido !== null && !esAlmacen(i) && duenoDe(i) === permitido && pilas[i].length > 0;

  function jugar(i: number) {
    if (!jugable(i)) return;
    ocultarPrevia();
    casillas[i].classList.add('elegido');
    setTimeout(() => casillas[i].classList.remove('elegido'), 300);
    ctx.sonido('toque');
    const quien = permitido!;
    permitir(null);
    ctx.jugar({ hoyo: i - base(quien) });
  }

  for (let i = 0; i < CASILLAS; i++) {
    if (esAlmacen(i)) continue;
    const b = casillas[i];
    b.addEventListener('pointerdown', (ev) => {
      if (!jugable(i)) return;
      sonido.activar();
      apretado = i;
      previaLarga = false;
      b.classList.add('apretado');
      clearTimeout(tPrevia);
      if (ev.pointerType !== 'mouse') {
        tPrevia = window.setTimeout(() => {
          previaLarga = true;
          mostrarPrevia(i);
        }, 380);
      }
    });
    b.addEventListener('pointerup', () => {
      clearTimeout(tPrevia);
      b.classList.remove('apretado');
      if (apretado !== i) return;
      apretado = null;
      if (previaLarga) {
        previaLarga = false;
        return ocultarPrevia();
      }
      jugar(i);
    });
    b.addEventListener('pointerenter', (ev) => {
      if (ev.pointerType === 'mouse' && jugable(i)) mostrarPrevia(i);
    });
    b.addEventListener('pointerleave', () => {
      clearTimeout(tPrevia);
      b.classList.remove('apretado');
      if (apretado === i) apretado = null;
      ocultarPrevia();
    });
    b.addEventListener('pointercancel', () => {
      clearTimeout(tPrevia);
      b.classList.remove('apretado');
      apretado = null;
      ocultarPrevia();
    });
    b.addEventListener('contextmenu', (ev) => ev.preventDefault());
    // Teclado (Enter o espacio): el clic llega sin puntero
    b.addEventListener('click', (ev) => {
      if (ev.detail === 0) jugar(i);
    });
  }
  function permitir(quien: Rol | null) {
    permitido = quien;
    for (let i = 0; i < CASILLAS; i++) {
      if (esAlmacen(i)) continue;
      const si = jugable(i);
      casillas[i].classList.toggle('mancala-jugable', si);
      (casillas[i] as HTMLButtonElement).disabled = !si;
    }
    mesa.dataset.permitido = quien ?? '';
    if (!quien) {
      clearTimeout(tPrevia);
      ocultarPrevia();
    }
  }

  return {
    pintar,
    animar,
    permitir,
    destruir() {
      destruido = true;
      obs.disconnect();
      cancelAnimationFrame(raf);
      for (const v of vuelos) v.listo();
      vuelos.clear();
      clearTimeout(tPrevia);
      mesa.remove();
    },
  };
}
