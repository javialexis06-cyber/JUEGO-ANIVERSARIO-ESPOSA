// Galería de desarrollo del arte de Plantas contra Zombis (no entra al build: Vite la sirve en desarrollo).
// Muestra el fondo y todos los personajes en todos sus estados y variantes, animados y con su nombre, los tintes,
// las piezas que se desprenden, los retratos de los sobres y una escena de prueba a tamaño real.
//
//   herramientas/pvz-galeria.html             galería completa
//   herramientas/pvz-galeria.html?escena      escena de prueba a pantalla completa (fondo, plantas, zombis)
//   …&t=2.5                                   reloj fijo (capturas repetibles)
//   …&svg                                     sin el arte de Blender (solo el dibujo SVG)
//
// Para capturas: `await window.__galeria.listo` y luego `window.__galeria.fijar(t)` dibuja el cuadro del segundo t.

import {
  DEF_ARTE, DEF_PERSONAJES, OBJETOS_DIA, PIE_PLANTA, PIE_ZOMBI, PLANTAS_DIA, ZOMBIS_DIA,
  aplicarPerdidas, cargarPersonajes, dibujarFondoDia, dibujarPersonaje, piezaSuelta, puntoMundo, retrato, varianteDe,
  type DefPersonaje, type OpcionesDibujo, type Suelta, type Tinte,
} from '../src/jardin/pvz/arte/index';
import { cargarArteBlender } from '../src/jardin/pvz/arte/blender';
import { ALTO_MUNDO, X_CORTACESPED, X_MAX, X_MIN, centroCol, centroFila } from '../src/jardin/pvz/arte/geometria';

declare global {
  interface Window {
    __galeria: { listo: Promise<void>; fijar(t: number): void; soltar(): void; tarjetas(): number };
  }
}

const params = new URLSearchParams(location.search);
const dpr = Math.min(3, window.devicePixelRatio || 1);
const app = document.getElementById('app')!;

// ---------------------------------------------------------------------------------------------------------------
// Reloj (real o fijo)

let tFijo: number | null = params.has('t') ? Number(params.get('t')) : null;
const inicio = performance.now();
const ahora = () => tFijo ?? (performance.now() - inicio) / 1000;

/** Fase 0..1 de un estado de una sola vez que se repite con una espera entre vueltas. */
function faseCiclica(t: number, dur: number, espera = 0.7): number {
  const k = t % (dur + espera);
  return Math.min(1, k / dur);
}

function def(id: string): DefPersonaje {
  const d = DEF_ARTE[id];
  if (!d) throw new Error('Sin arte: ' + id);
  return d;
}

const COSTOS: Record<string, number> = {
  lanzaguisantes: 100, girasol: 50, petacereza: 150, nuez: 50, patatapum: 25, hielaguisantes: 175, carnivora: 150, repetidora: 200, desesporada: 0,
};

// ---------------------------------------------------------------------------------------------------------------
// Tarjetas de la galería

interface Tarjeta {
  lienzo: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Tamaño en unidades del personaje (antes del zoom). */
  w: number;
  h: number;
  zoom: number;
  dibujar(ctx: CanvasRenderingContext2D, t: number): void;
}

const tarjetas: Tarjeta[] = [];

interface OpTarjeta {
  estado?: string;
  etiqueta?: string;
  variantes?: Record<string, string>;
  perdidas?: string[];
  tinte?: Tinte;
  /** El tinte de golpe titila como en el juego. */
  titila?: boolean;
  espejo?: boolean;
  vel?: number;
  zoom?: number;
  /** Margen extra (unidades) a la izquierda y arriba, para estados que salen del marco (caer, saltar). */
  izq?: number;
  arriba?: number;
  der?: number;
}

function seccion(titulo: string, nota?: string): HTMLElement {
  const h = document.createElement('h2');
  h.textContent = titulo;
  app.appendChild(h);
  if (nota) {
    const p = document.createElement('p');
    p.className = 'nota';
    p.textContent = nota;
    app.appendChild(p);
  }
  const g = document.createElement('div');
  g.className = 'grupo';
  app.appendChild(g);
  return g;
}

function nuevaTarjeta(grupo: HTMLElement, etiqueta: string, w: number, h: number, zoom: number, dibujar: Tarjeta['dibujar']): Tarjeta {
  const caja = document.createElement('div');
  caja.className = 'tarjeta';
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(w * zoom * dpr);
  lienzo.height = Math.round(h * zoom * dpr);
  lienzo.style.width = Math.round(w * zoom) + 'px';
  lienzo.style.height = Math.round(h * zoom) + 'px';
  const span = document.createElement('span');
  span.textContent = etiqueta;
  caja.append(lienzo, span);
  grupo.appendChild(caja);
  const t: Tarjeta = { lienzo, ctx: lienzo.getContext('2d')!, w, h, zoom, dibujar };
  tarjetas.push(t);
  return t;
}

/** Fondo de casillas de césped para juzgar el arte sobre el color real del patio. */
function pasto(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const n = Math.max(1, Math.round(w / 80));
  const paso = w / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#6db83f' : '#8ed357';
    ctx.fillRect(i * paso, 0, paso + 1, h);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, h - 2, w, 2);
}

function tarjetaPersonaje(grupo: HTMLElement, id: string, op: OpTarjeta = {}): Tarjeta {
  const d = def(id);
  const estado = op.estado ?? d.estados?.[0] ?? 'quieto';
  const m = 10;
  const izq = op.izq ?? 0, arriba = op.arriba ?? 0, der = op.der ?? 0;
  const w = d.ancho + 2 * m + izq + der;
  const h = d.alto + 2 * m + arriba;
  const zoom = op.zoom ?? 1;
  const perd = op.perdidas ? aplicarPerdidas(d, op.perdidas) : { ocultar: [], variantes: {} };
  const variantes = { ...perd.variantes, ...(op.variantes ?? {}) };
  const dur = d.duraciones?.[estado];
  const semilla = tarjetas.length * 7 + 3;
  const etiqueta = op.etiqueta ?? `${d.nombre ?? id} · ${estado}`;
  return nuevaTarjeta(grupo, etiqueta, w, h, zoom, (ctx, t) => {
    const fase = dur ? faseCiclica(t + (semilla % 5) * 0.11, dur) : 0;
    let tinte = op.tinte ?? null;
    if (op.titila) tinte = Math.floor(t * 7) % 3 === 0 ? 'golpe' : null;
    const o: OpcionesDibujo = {
      x: m + izq + d.ancla[0], y: m + arriba + d.ancla[1], t, estado, fase, semilla, vel: op.vel,
      ocultar: perd.ocultar, variantes, tinte, espejo: op.espejo,
    };
    if (op.espejo) o.x = m + izq + (d.ancho - d.ancla[0]);
    dibujarPersonaje(ctx, d, o);
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Galería

function galeria(): void {
  const cab = document.createElement('header');
  cab.innerHTML =
    `<h1>Galería de arte · Plantas contra Zombis (mundo 1)</h1>` +
    `<a href="?escena">Escena de prueba (pantalla completa)</a><span>dpr ${dpr}</span>`;
  app.appendChild(cab);

  // Fondo completo y el de las filas sin pasto (1-1 y 1-2).
  const gf = seccion('Fondo · el día en la casa', 'Lienzo en caché por escala. Abajo: 1-1 (una fila de pasto) y 1-2 (tres filas).');
  const anchoFondo = Math.min(1180, window.innerWidth - 48);
  for (const [et, filas, ancho] of [
    ['Mundo 1 · cinco filas', undefined, anchoFondo],
    ['1-1 · una fila', [2], anchoFondo / 2 - 8],
    ['1-2 · tres filas', [1, 2, 3], anchoFondo / 2 - 8],
  ] as [string, number[] | undefined, number][]) {
    const W = X_MAX - X_MIN;
    const z = ancho / W;
    nuevaTarjeta(gf, et, W, ALTO_MUNDO, z, (ctx, t) => {
      ctx.translate(-X_MIN, 0);
      dibujarFondoDia(ctx, { escala: Math.hypot(ctx.getTransform().a, ctx.getTransform().b), filasActivas: filas, t });
    }).lienzo.dataset.fondo = '1';
  }

  // Plantas.
  const gp = seccion('Plantas', 'Miran a la derecha. Estados de una sola vez (ataca, explota…) en bucle con su duración.');
  for (const id of PLANTAS_DIA) {
    const d = def(id);
    for (const estado of d.estados ?? ['quieto']) {
      if (id === 'nuez') {
        for (const v of d.variantes!.dano.valores) tarjetaPersonaje(gp, id, { estado, variantes: varianteDe(d, 'dano', v), etiqueta: `Nuez · ${estado} · ${v.replace('_', ' ')}`, zoom: 1.25 });
        continue;
      }
      const grande = id === 'patatapum' && estado === 'explota';
      tarjetaPersonaje(gp, id, { estado, zoom: 1.25, izq: grande ? 30 : 0, der: grande ? 30 : 0, arriba: grande ? 16 : 0 });
    }
  }

  // Zombis.
  const gz = seccion('Zombis', 'Miran a la izquierda. «muere» y «sin cabeza» ya sin cabeza ni brazo, como en el juego.');
  for (const id of ZOMBIS_DIA) {
    const d = def(id);
    for (const estado of d.estados ?? ['camina']) {
      const perdidas = estado === 'sincabeza' || estado === 'muere' ? ['brazo', 'cabeza', 'casco'] : undefined;
      const izq = estado === 'muere' ? 70 : estado === 'salta' ? 140 : id === 'pertiga' ? 40 : 0;
      const arriba = estado === 'salta' ? 90 : 20;
      tarjetaPersonaje(gz, id, { estado, perdidas, izq, arriba, tinte: estado === 'ceniza' ? 'ceniza' : null });
    }
  }
  const gv = seccion('Cascos, bandera y pérdidas', 'Variantes por daño (2/3 y 1/3 de vida del casco) y partes que se desprenden.');
  for (const id of ['caracono', 'caracubo']) {
    const d = def(id);
    for (const v of d.variantes!.casco.valores) tarjetaPersonaje(gv, id, { estado: 'camina', variantes: varianteDe(d, 'casco', v), etiqueta: `${d.nombre} · ${v.replace('_', ' ')}`, arriba: 20 });
    tarjetaPersonaje(gv, id, { estado: 'camina', perdidas: ['casco'], etiqueta: `${d.nombre} · sin casco`, arriba: 20 });
  }
  const ab = def('abanderado');
  tarjetaPersonaje(gv, 'abanderado', { estado: 'camina', variantes: varianteDe(ab, 'bandera', 'agujereada'), etiqueta: 'Abanderado · bandera agujereada', arriba: 20 });
  tarjetaPersonaje(gv, 'abanderado', { estado: 'camina', perdidas: ['brazo'], etiqueta: 'Abanderado · sin brazo', arriba: 20 });
  tarjetaPersonaje(gv, 'zombi', { estado: 'camina', perdidas: ['brazo'], etiqueta: 'Zombi · sin brazo (hueso)', arriba: 20 });
  tarjetaPersonaje(gv, 'zombi', { estado: 'come', perdidas: ['brazo'], etiqueta: 'Zombi · come sin brazo', arriba: 20 });
  tarjetaPersonaje(gv, 'pertiga', { estado: 'camina', perdidas: ['brazo'], etiqueta: 'Pértiga · camina sin brazo', arriba: 20 });

  // Tintes.
  const gt = seccion('Tintes', 'Congelado (lento), hipnotizado (camina al revés), golpe (destello) y ceniza.');
  tarjetaPersonaje(gt, 'zombi', { estado: 'camina', tinte: 'congelado', vel: 0.5, etiqueta: 'Zombi · congelado', arriba: 20 });
  tarjetaPersonaje(gt, 'caracono', { estado: 'camina', tinte: 'hipnotizado', espejo: true, etiqueta: 'Caracono · hipnotizado', arriba: 20 });
  tarjetaPersonaje(gt, 'caracubo', { estado: 'come', titila: true, etiqueta: 'Caracubo · golpe', arriba: 20 });
  tarjetaPersonaje(gt, 'abanderado', { estado: 'quieto', tinte: 'ceniza', etiqueta: 'Abanderado · ceniza', arriba: 20 });
  tarjetaPersonaje(gt, 'lanzaguisantes', { estado: 'quieto', titila: true, etiqueta: 'Lanzaguisantes · golpe', zoom: 1.25 });
  tarjetaPersonaje(gt, 'nuez', { estado: 'herida', tinte: 'congelado', etiqueta: 'Nuez · congelada', zoom: 1.25 });

  // Piezas sueltas.
  const gs = seccion('Piezas que se desprenden', 'piezaSuelta(): el brazo y la cabeza caen como partículas (cada 3 s).');
  for (const [id, cual] of [['zombi', 'brazo'], ['zombi', 'cabeza'], ['caracono', 'cabeza'], ['caracubo', 'casco'], ['abanderado', 'brazo']] as [string, string][]) tarjetaCaida(gs, id, cual);

  // Retratos.
  const gr = seccion('Retratos', 'Sobres de semilla (retrato con encuadre «arriba») y almanaque (completo), del propio arte.');
  // Sobres al tamaño del banco de semillas en un celular (52 × 72) y al doble.
  for (const [w, h] of [[52, 72], [78, 108]])
    for (const id of PLANTAS_DIA)
      nuevaTarjeta(gr, `${def(id).nombre} · ${w}×${h}`, w, h, 1, (ctx) => pintarSobre(ctx, id, 0, 0, w, h)).lienzo.dataset.fondo = '1';
  for (const id of [...PLANTAS_DIA, ...ZOMBIS_DIA]) {
    const caja = document.createElement('div');
    caja.className = 'tarjeta';
    const L = retrato(def(id), Math.round(72 * dpr), 'quieto');
    L.style.width = L.style.height = '72px';
    const span = document.createElement('span');
    span.textContent = def(id).nombre ?? id;
    caja.append(L, span);
    gr.appendChild(caja);
  }

  // Objetos.
  const go = seccion('Objetos', 'Sol, proyectiles, cortacésped, premios, abono y las nueces de bolos del 1-5.');
  for (const id of OBJETOS_DIA) {
    const d = def(id);
    for (const estado of d.estados ?? ['quieto']) {
      const pequeno = d.alto < 50;
      tarjetaPersonaje(go, id, { estado, zoom: pequeno ? 2.2 : 1.25, arriba: id === 'nuez_explosiva' ? 8 : 0 });
    }
  }

  // Personajes.
  const gd = seccion('Personajes', 'Dave el Loco: quieto, hablando (balbuceo) y los ánimos del guion.');
  const dave = DEF_PERSONAJES.dave;
  tarjetaPersonaje(gd, 'dave', { estado: 'quieto', zoom: 0.9, arriba: 14 });
  tarjetaPersonaje(gd, 'dave', { estado: 'habla', zoom: 0.9, arriba: 14 });
  for (const animo of dave.variantes!.animo.valores.slice(1))
    tarjetaPersonaje(gd, 'dave', { estado: animo === 'feliz' || animo === 'loco' ? 'habla' : 'quieto', variantes: varianteDe(dave, 'animo', animo), etiqueta: `Dave · ${animo}`, zoom: 0.9, arriba: 14 });
}

const retratosSobre = new Map<string, HTMLCanvasElement>();

function pintarSobre(g: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number): void {
  const r = 5;
  g.save();
  g.translate(x, y);
  g.beginPath();
  g.roundRect(1, 1, w - 2, h - 2, r);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#fbf6d8');
  gr.addColorStop(1, '#d9cc93');
  g.fillStyle = gr;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = '#1d1408';
  g.stroke();
  // ventanita verde del retrato
  g.beginPath();
  g.roundRect(4, 4, w - 8, h * 0.66, 3);
  const gv = g.createLinearGradient(0, 4, 0, h * 0.7);
  gv.addColorStop(0, '#bfe58f');
  gv.addColorStop(1, '#79b94a');
  g.fillStyle = gv;
  g.fill();
  g.lineWidth = 1.2;
  g.strokeStyle = 'rgba(29,20,8,0.6)';
  g.stroke();
  const clave = `${id}@${w}x${h}`;
  let ret = retratosSobre.get(clave);
  if (!ret) {
    ret = retrato(def(id), Math.round((w - 8) * dpr), 'quieto', { alto: Math.round(h * 0.66 * dpr), encuadre: 'arriba', margen: Math.round(3 * dpr) });
    retratosSobre.set(clave, ret);
  }
  g.drawImage(ret, 4, 4, w - 8, h * 0.66);
  // costo
  g.fillStyle = '#1d1408';
  g.font = `900 ${Math.round(h * 0.2)}px 'Arial Black', 'Liberation Sans', sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(COSTOS[id] ?? ''), w / 2, h * 0.85);
  g.restore();
}

/** Tarjeta con un zombi que pierde una parte cada 3 s; la parte cae y rebota con física simple. */
function tarjetaCaida(grupo: HTMLElement, id: string, cual: string): void {
  const d = def(id);
  const m = 10;
  const w = d.ancho + 2 * m + 60, h = d.alto + 2 * m + 20;
  const ax = m + 60 + d.ancla[0], ay = m + 20 + d.ancla[1];
  const semilla = 11;
  let suelta: { s: Suelta; t0: number } | null = null;
  nuevaTarjeta(grupo, `${d.nombre} · se le cae ${cual === 'casco' ? 'el casco' : cual === 'brazo' ? 'el brazo' : 'la cabeza'}`, w, h, 1, (ctx, t) => {
    const ciclo = t % 3;
    const caida = ciclo > 0.6;
    const t0 = t - ciclo + 0.6;
    if (caida && (!suelta || suelta.t0 !== t0)) {
      const s = piezaSuelta(d, cual, { t: t0, estado: 'camina', semilla });
      suelta = s ? { s, t0 } : null;
    }
    const perd = caida ? aplicarPerdidas(d, [cual]) : { ocultar: [], variantes: {} };
    dibujarPersonaje(ctx, d, { x: ax, y: ay, t, estado: cual === 'cabeza' && caida ? 'sincabeza' : 'camina', semilla, ocultar: perd.ocultar, variantes: perd.variantes });
    if (caida && suelta) {
      const dt = t - suelta.t0;
      const s = suelta.s;
      // Cae hacia atrás (derecha), gira y rebota una vez en el suelo; luego se desvanece.
      const g = 520, vx = 34, vy = -110;
      const cx0 = ax + s.x + s.ancho / 2, cy0 = ay + s.y + s.alto / 2;
      const suelo = ay - s.alto * 0.3;
      let cx = cx0 + vx * dt;
      let cy = cy0 + vy * dt + 0.5 * g * dt * dt;
      let rot = dt * 4.2;
      if (cy > suelo) {
        // tiempo del primer toque
        const tt = (-vy + Math.sqrt(vy * vy + 2 * g * (suelo - cy0))) / g;
        const d2 = dt - tt;
        const vb = -(vy + g * tt) * 0.3;
        cy = Math.min(suelo, suelo + vb * d2 + 0.5 * g * d2 * d2);
        cx = cx0 + vx * tt + vx * 0.4 * Math.min(d2, 0.4);
        rot = tt * 4.2 + Math.min(d2, 0.4) * 2;
      }
      const alfa = 1 - Math.min(1, Math.max(0, (dt - 1.6) / 0.6));
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.drawImage(s.lienzo, -s.ancho / 2, -s.alto / 2, s.ancho, s.alto);
      ctx.restore();
    }
  });
}

function dibujarTarjetas(): void {
  const t = ahora();
  for (const k of tarjetas) {
    const { ctx } = k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, k.lienzo.width, k.lienzo.height);
    const s = dpr * k.zoom;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    if (!k.lienzo.dataset.fondo) pasto(ctx, k.w, k.h);
    k.dibujar(ctx, t);
  }
}

/**
 * Tira de cuadros para revisar animaciones: `?tira=pertiga:salta,zombi:muere&n=8&zoom=1.5`. Cada fila es un estado
 * dibujado en `n` fases (de 0 a 1) o, si el estado es cíclico, en `n` instantes repartidos en 2 s. Un tercer campo
 * aplica pérdidas (`zombi:camina:brazo+cabeza`) y un cuarto, variantes de grupo (`caracono:camina::casco=abollado`).
 */
function tira(): void {
  document.body.classList.add('tira');
  const n = Number(params.get('n') ?? 8);
  const zoom = Number(params.get('zoom') ?? 1.2);
  for (const item of (params.get('tira') ?? '').split(',').filter(Boolean)) {
    const [id, estado = 'quieto', perdidas = '', grupos = ''] = item.split(':');
    const d = def(id);
    const variantes: Record<string, string> = {};
    for (const g of grupos.split(/[+ ]/).filter(Boolean)) {
      const [k, v] = g.split('=');
      Object.assign(variantes, varianteDe(d, k, v));
    }
    const fila = seccion(`${d.nombre ?? id} · ${estado}${perdidas ? ' · sin ' + perdidas : ''}${grupos ? ' · ' + grupos : ''}`);
    const dur = d.duraciones?.[estado];
    const perd = perdidas ? aplicarPerdidas(d, perdidas.split(/[+ ]/)) : { ocultar: [], variantes: {} };
    const izq = estado === 'salta' ? 150 : estado === 'muere' ? 80 : id === 'pertiga' ? 40 : 6;
    const arriba = estado === 'salta' ? 90 : 16;
    for (let k = 0; k < n; k++) {
      const fase = k / (n - 1);
      const tk = dur ? fase * dur : (k / n) * 2;
      const m = 6;
      nuevaTarjeta(fila, dur ? `fase ${fase.toFixed(2)}` : `t ${tk.toFixed(2)} s`, d.ancho + 2 * m + izq, d.alto + 2 * m + arriba, zoom, (ctx) => {
        dibujarPersonaje(ctx, d, { x: m + izq + d.ancla[0], y: m + arriba + d.ancla[1], t: tk, estado, fase, semilla: 0, ocultar: perd.ocultar, variantes: { ...perd.variantes, ...variantes }, tinte: estado === 'ceniza' ? 'ceniza' : null });
      });
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Escena de prueba: patio del mundo 1 a pantalla completa

interface Ente {
  id: string;
  f: number;
  /** x del ancla en el mundo (o función del tiempo). */
  x: number | ((t: number) => number);
  estado?: string;
  variantes?: Record<string, string>;
  perdidas?: string[];
  tinte?: Tinte | ((t: number) => Tinte);
  vel?: number;
  /** Ciclo de los estados de una sola vez. */
  ciclo?: number;
  pie?: number;
  semilla?: number;
}

function escena(): void {
  document.body.classList.add('escena');
  const L = document.createElement('canvas');
  L.id = 'pantalla';
  app.appendChild(L);
  const ctx = L.getContext('2d')!;
  const col = (c: number) => centroCol(c);
  const caminar = (x0: number, v: number, periodo: number, desfase = 0) => (t: number) => x0 - v * ((t + desfase) % periodo);

  const plantas: Ente[] = [
    { id: 'girasol', f: 0, x: col(0) }, { id: 'lanzaguisantes', f: 0, x: col(1), estado: 'ataca', ciclo: 1.5 }, { id: 'lanzaguisantes', f: 0, x: col(2), estado: 'ataca', ciclo: 1.5 },
    { id: 'nuez', f: 0, x: col(5), variantes: { cuerpo: 'agrietada', cejas: 'agrietada' } },
    { id: 'girasol', f: 1, x: col(0), estado: 'ataca', ciclo: 4 }, { id: 'repetidora', f: 1, x: col(1), estado: 'ataca', ciclo: 1.5 }, { id: 'hielaguisantes', f: 1, x: col(2), estado: 'ataca', ciclo: 1.5 },
    { id: 'patatapum', f: 1, x: col(6), estado: 'armada' },
    { id: 'girasol', f: 2, x: col(0) }, { id: 'lanzaguisantes', f: 2, x: col(1), estado: 'ataca', ciclo: 1.5 }, { id: 'carnivora', f: 2, x: col(3) },
    { id: 'nuez', f: 2, x: col(4), estado: 'herida', variantes: { cuerpo: 'muy_agrietada', cejas: 'muy_agrietada' } },
    { id: 'girasol', f: 3, x: col(0) }, { id: 'hielaguisantes', f: 3, x: col(1), estado: 'ataca', ciclo: 1.5 }, { id: 'repetidora', f: 3, x: col(2) },
    { id: 'desesporada', f: 3, x: col(3), estado: 'dormida' }, { id: 'patatapum', f: 3, x: col(5), estado: 'enterrada' },
    { id: 'girasol', f: 4, x: col(0) }, { id: 'lanzaguisantes', f: 4, x: col(1), estado: 'ataca', ciclo: 1.5 }, { id: 'carnivora', f: 4, x: col(2), estado: 'masticando' },
    { id: 'petacereza', f: 4, x: col(4), estado: 'inflandose', ciclo: 1.6 }, { id: 'nuez', f: 4, x: col(6) },
  ];
  const zombis: Ente[] = [
    { id: 'caracubo', f: 0, x: caminar(900, 9, 30), variantes: { cubo: 'abollado' } },
    { id: 'zombi', f: 0, x: caminar(760, 9, 30, 12), perdidas: ['brazo'] },
    { id: 'pertiga', f: 1, x: caminar(980, 30, 14), estado: 'corre' },
    { id: 'zombi', f: 1, x: caminar(700, 4.5, 30, 3), tinte: 'congelado', vel: 0.5 },
    { id: 'caracono', f: 2, x: col(4) + 34, estado: 'come', tinte: (t) => (Math.floor(t * 6) % 5 === 0 ? 'golpe' : null) },
    { id: 'abanderado', f: 3, x: caminar(860, 10, 30, 4) },
    { id: 'caracono', f: 3, x: caminar(1010, 9, 30, 8), variantes: { cono: 'abollado' } },
    { id: 'zombi', f: 4, x: caminar(740, 9, 30, 6) },
    { id: 'caracono', f: 4, x: caminar(940, 9, 30, 20), variantes: { cono: 'muy_abollado' } },
  ];
  // Guisantes: salen de los tiradores que atacan y viajan a 300 px/s.
  const proyectiles = plantas
    .filter((p) => p.estado === 'ataca' && p.id !== 'girasol')
    .map((p) => {
      // Salen de la boca de cada tirador (punto 'boca' del arte), a la altura de su fila.
      const boca = puntoMundo(def(p.id), 'boca', p.x as number, centroFila(p.f) + PIE_PLANTA);
      return { id: p.id === 'hielaguisantes' ? 'guisante_hielo' : 'guisante', f: p.f, x0: boca.x, y: boca.y, ciclo: p.ciclo ?? 1.5, doble: p.id === 'repetidora' };
    });

  const todas = Object.values(DEF_ARTE);
  let escalaCargada = 0;

  function dibujar(): void {
    const t = ahora();
    const W = window.innerWidth, H = window.innerHeight;
    if (L.width !== Math.round(W * dpr) || L.height !== Math.round(H * dpr)) {
      L.width = Math.round(W * dpr);
      L.height = Math.round(H * dpr);
    }
    const s = H / ALTO_MUNDO;
    const S = s * dpr;
    if (Math.abs(S - escalaCargada) > 0.05) {
      escalaCargada = S;
      void cargarPersonajes(todas, S);
    }
    const vis = W / s;
    const x0 = vis >= X_MAX - X_MIN ? X_MIN - (vis - (X_MAX - X_MIN)) / 2 : Math.max(X_MIN, -vis * 0.17);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.setTransform(S, 0, 0, S, -x0 * S, 0);
    dibujarFondoDia(ctx, { escala: S, t, ancho: L.width, alto: L.height });

    for (let f = 0; f < 5; f++) {
      const yf = centroFila(f);
      dibujarPersonaje(ctx, def('cortacesped'), { x: X_CORTACESPED, y: yf + 30, t, semilla: f });
      for (const p of plantas.filter((e) => e.f === f)) dibujarEnte(p, t, yf + (p.pie ?? PIE_PLANTA));
      const zs = zombis.filter((e) => e.f === f).sort((a, b) => xDe(b, t) - xDe(a, t));
      for (const z of zs) dibujarEnte(z, t, yf + (z.pie ?? PIE_ZOMBI));
      for (const g of proyectiles.filter((e) => e.f === f)) {
        for (const extra of g.doble ? [0, 0.16] : [0]) {
          const k = (t - extra) % g.ciclo;
          const x = g.x0 + k * 300;
          if (k < 0.12 || x > 800) continue;
          dibujarPersonaje(ctx, def(g.id), { x, y: g.y, t, semilla: f });
        }
      }
    }
    // Soles: uno que cae del cielo meciéndose y otro junto a un girasol.
    const caida = t % 9;
    dibujarPersonaje(ctx, def('sol'), { x: 300 + Math.sin(caida * 1.6) * 8, y: Math.min(centroFila(2) + 10, 20 + caida * 40), t, semilla: 1 });
    dibujarPersonaje(ctx, def('sol'), { x: centroCol(0) + 26, y: centroFila(3) + 18, t, semilla: 2 });
    dibujarPersonaje(ctx, def('moneda_plata'), { x: centroCol(7), y: centroFila(4) + 24, t, estado: 'gira', semilla: 3 });

    // Maqueta del banco de semillas (solo para revisar los retratos a tamaño real; la interfaz real va en ui/hud.ts).
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bancoMaqueta(ctx, W, H);
  }

  function xDe(e: Ente, t: number): number {
    return typeof e.x === 'function' ? e.x(t) : e.x;
  }

  function dibujarEnte(e: Ente, t: number, y: number): void {
    const d = def(e.id);
    const estado = e.estado ?? d.estados?.[0];
    const dur = estado ? d.duraciones?.[estado] : undefined;
    const sem = e.semilla ?? Math.round(xDe(e, 0) * 7 + e.f * 13);
    const fase = dur ? faseCiclica(t + (sem % 7) * 0.13, dur, Math.max(0.2, (e.ciclo ?? dur + 0.7) - dur)) : 0;
    const perd = e.perdidas ? aplicarPerdidas(d, e.perdidas) : { ocultar: [], variantes: {} };
    const tinte = typeof e.tinte === 'function' ? e.tinte(t) : e.tinte ?? null;
    dibujarPersonaje(ctx, d, { x: xDe(e, t), y, t, estado, fase, semilla: sem, vel: e.vel, tinte, ocultar: perd.ocultar, variantes: { ...perd.variantes, ...(e.variantes ?? {}) } });
  }

  function bancoMaqueta(g: CanvasRenderingContext2D, W: number, H: number): void {
    // Cabe en la franja de arriba del mundo (80 unidades), como el banco de PvZ sobre la cerca.
    const alto = Math.max(40, Math.min(84, (80 * H) / ALTO_MUNDO - 6));
    const sw = alto * 0.68, sh = alto - 10;
    const ids = PLANTAS_DIA.slice(0, 8);
    const ancho = 10 + alto * 0.95 + ids.length * (sw + 3) + 8;
    g.save();
    g.beginPath();
    g.roundRect(6, 4, ancho, alto, 8);
    const gm = g.createLinearGradient(0, 4, 0, 4 + alto);
    gm.addColorStop(0, '#9a6234');
    gm.addColorStop(1, '#6c3f1e');
    g.fillStyle = gm;
    g.fill();
    g.lineWidth = 2.5;
    g.strokeStyle = '#1d1408';
    g.stroke();
    // contador de sol
    const cx = 10 + alto * 0.47;
    g.beginPath();
    g.roundRect(12, 8, alto * 0.86, alto - 8, 6);
    g.fillStyle = '#f3e6c0';
    g.fill();
    g.stroke();
    g.restore();
    dibujarPersonajeEnPantalla(g, 'sol', cx, 8 + alto * 0.36, alto * 0.0085);
    g.fillStyle = '#1d1408';
    g.font = `900 ${Math.round(alto * 0.26)}px 'Arial Black','Liberation Sans',sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('150', cx, 4 + alto * 0.8);
    ids.forEach((id, i) => pintarSobre(g, id, 10 + alto * 0.95 + i * (sw + 3), 9, sw, sh));
    void W;
  }

  function dibujarPersonajeEnPantalla(g: CanvasRenderingContext2D, id: string, x: number, y: number, escala: number): void {
    dibujarPersonaje(g, def(id), { x, y, t: ahora(), escala });
  }

  const bucle = () => {
    dibujar();
    if (tFijo === null) requestAnimationFrame(bucle);
  };
  redibujar = dibujar;
  arrancar = bucle;
}

// ---------------------------------------------------------------------------------------------------------------
// Arranque

let redibujar: () => void = dibujarTarjetas;
let arrancar: () => void = () => {
  const bucle = () => {
    dibujarTarjetas();
    if (tFijo === null) requestAnimationFrame(bucle);
  };
  bucle();
};

const esEscena = params.has('escena');

const listo = (async () => {
  // El arte de Blender reemplaza al SVG con el mismo id (?svg muestra solo el dibujo SVG); las tarjetas se arman
  // después, con la definición que quedó.
  if (!params.has('svg')) await cargarArteBlender('../jardin/pvz/');
  if (esEscena) escena();
  else if (params.has('tira')) tira();
  else galeria();
  const todas = Object.values(DEF_ARTE);
  const escala = esEscena ? (window.innerHeight / ALTO_MUNDO) * dpr : dpr * 1.3;
  await cargarPersonajes(todas, escala);
  // Los retratos y las piezas sueltas usan la caché más fina: una más grande para que salgan nítidos.
  if (params.has('tira')) await cargarPersonajes(todas, dpr * Number(params.get('zoom') ?? 1.2));
  else if (!esEscena) await cargarPersonajes(todas, dpr * 2.2);
  else await cargarPersonajes(todas, dpr * 1.3);
  retratosSobre.clear();
  arrancar();
})();

window.__galeria = {
  listo,
  fijar(t: number) {
    tFijo = t;
    redibujar();
  },
  soltar() {
    if (tFijo === null) return;
    tFijo = null;
    arrancar();
  },
  tarjetas: () => tarjetas.length,
};
