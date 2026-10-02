// Cómo dispara cada arma y cómo se mueven sus proyectiles y zonas (la mitad «armas» del motor). Cada comportamiento
// copia el del original: el látigo alterna de lado, la varita busca al más cercano, el hacha sube y cae, la cruz va
// y vuelve, la biblia orbita, el ajo pica alrededor, el agua bendita deja charcos, la runa rebota en la pantalla…
import { ARMAS } from './armas';
import type { ArmaJ, Enemigo, Jugador, Motor, Proyectil, Zona } from './motor';
import type { IdArma } from './tipos';

/** Ranuras de «ya le pegó» en cada enemigo (por jugador: + índice del jugador). */
const HZ_AURA = 0, HZ_ESPONJAS = 2, HZ_LASER = 4, HZ_COLUMNA = 6, HZ_CHARCO = 8;
const TAU = Math.PI * 2;
/** Armas de zona (para la carta del planetario). */
const ZONA = new Set<IdArma>(['espuma', 'espumaDevoradora', 'botellas', 'inundacion', 'ducha', 'diluvio', 'esponjas', 'esponjasEternas', 'patoAmarillo', 'patoMorado', 'patosEnamorados']);

/** Lo efectivo del arma con las estadísticas del jugador (un solo objeto que se reutiliza). */
const E = { dano: 0, area: 0, vel: 0, cant: 0, dur: 0, enfr: 0, perfora: 0, crit: 0, critX: 2, golpeCada: 0.5, retro: 1, radio: 10, rapidez: 300, congela: 0, inter: 0.1 };

function calcular(j: Jugador, a: ArmaJ) {
  const b = a.b;
  const zona = ZONA.has(a.id) && j.tieneCarta('planetario');
  E.dano = b.dano * (1 + j.st.poder) * (zona ? 1.5 : 1);
  E.area = b.area * Math.max(0.3, 1 + j.st.area) * (zona ? 1 + 0.5 * Math.max(0, j.st.poder) : 1);
  E.vel = b.vel * Math.max(0.3, 1 + j.st.velocidad);
  E.cant = Math.max(1, Math.round(b.cant + j.st.cantidad));
  E.dur = b.dur * Math.max(0.3, 1 + j.st.duracion);
  E.enfr = Math.max(0.05, b.enfr * (1 - j.st.enfriamiento));
  E.perfora = b.perfora;
  const mat = j.tieneCarta('matematicas');
  E.crit = (b.crit + (mat ? 0.1 : 0)) * (1 + j.st.suerte);
  E.critX = b.critX || 2;
  E.golpeCada = Math.max(0.12, b.golpeCada);
  E.retro = b.retro;
  E.radio = b.radio;
  E.rapidez = b.rapidez;
  E.congela = b.congela * (1 + j.st.duracion);
  E.inter = b.inter;
}

// ---------------------------------------------------------------------------------------------------- Ayudas
function libre(m: Motor): Proyectil | null {
  for (let i = 0; i < m.pr.length; i++) {
    const p = m.pr[(m.nEf + i) % m.pr.length];
    if (!p.vivo) return p;
  }
  return null;
}

function nuevoProy(m: Motor, j: Jugador, slot: number, arma: IdArma, comp: number, x: number, y: number, vx: number, vy: number, r: number, vida: number): Proyectil | null {
  const p = libre(m);
  if (!p) return null;
  p.vivo = true;
  p.dueno = j.i;
  p.slot = slot;
  p.arma = arma;
  p.comp = comp;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.ax = p.ay = 0;
  p.r = r;
  p.dano = E.dano;
  p.crit = E.crit;
  p.critX = E.critX;
  p.perfora = E.perfora;
  p.vida = vida;
  p.t = 0;
  p.ang = Math.atan2(vy, vx);
  p.giro = 0;
  p.golpeCada = E.golpeCada;
  p.retro = E.retro;
  p.gi = 0;
  p.gid.fill(0);
  p.gt.fill(0);
  p.ex = p.ey = 0;
  p.n = 0;
  p.mini = false;
  return p;
}

function nuevaZona(m: Motor): Zona | null {
  for (const z of m.zonas) if (!z.vivo) return z;
  return null;
}

/** El mugroso más cercano a (x, y) que no sea una velita (o null). */
export function masCercano(m: Motor, x: number, y: number, rmax: number, evitarUid = 0): Enemigo | null {
  let mejor: Enemigo | null = null;
  let d = rmax * rmax;
  for (let paso = 0; paso < 3; paso++) {
    const r = paso === 0 ? 140 : paso === 1 ? 300 : rmax;
    const n = m.rej.circulo(x, y, Math.min(r, rmax));
    for (let k = 0; k < n; k++) {
      const e = m.en[m.rej.fuera[k]];
      if (!e.vivo || e.luz || e.uid === evitarUid) continue;
      const dd = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (dd < d) {
        d = dd;
        mejor = e;
      }
    }
    if (mejor || r >= rmax) break;
  }
  return mejor;
}

/** Uno al azar de los que se ven en la pantalla de ese jugador. */
function alAzarEnVista(m: Motor, j: Jugador): Enemigo | null {
  if (!m.nVivos) return null;
  for (let intento = 0; intento < 24; intento++) {
    const e = m.en[m.vivos[Math.floor(m.az.n() * m.nVivos)]];
    if (e.vivo && !e.luz && j.enVista(e.x, e.y, -10)) return e;
  }
  return masCercano(m, j.x, j.y, 400);
}

function golpe(m: Motor, j: Jugador, slot: number, e: Enemigo, dano: number, crit: number, critX: number, kx: number, ky: number, arma: IdArma) {
  const c = crit > 0 && m.az.n() < crit;
  m.herir(e, c ? dano * critX : dano, j.i, slot, kx, ky, c, arma);
  if (c && arma === 'toallazo') m.curar(j, 1);
  return c;
}

// ---------------------------------------------------------------------------------------------------- Disparar
export function actualizarArmas(m: Motor, j: Jugador, dt: number) {
  const moviendo = Math.hypot(j.vx, j.vy) > 20;
  let ritmo = 1;
  if (j.tieneCarta('sopetran') && moviendo) ritmo *= 1.3;
  if (j.arranque > 0) ritmo *= 1 + 6 * (j.arranque / Math.max(1, j.disfraz.arranque ?? 1));
  for (let slot = 0; slot < j.armas.length; slot++) {
    const a = j.armas[slot];
    const def = ARMAS[a.id];
    calcular(j, a);
    switch (def.comp) {
      case 'ajo':
        aura(m, j, a, slot);
        continue;
      case 'biblia':
        orbitas(m, j, a, slot, dt, ritmo);
        continue;
      case 'laser':
        laser(m, j, a, slot, dt);
        continue;
      case 'pajaro':
        a.ang += E.rapidez * dt * (a.id === 'patoMorado' ? 1 : 1);
        break;
    }
    a.t -= dt * ritmo;
    if (a.rafaga <= 0 && a.t <= 0) {
      a.total = E.cant;
      // Compañeros de estudio: a veces la tarea se hace dos veces
      if (j.tieneCarta('estudio') && m.az.n() < 0.25) a.total *= 2;
      a.rafaga = a.total;
      a.tr = 0;
      a.t = E.enfr;
    }
    if (a.rafaga > 0) {
      a.tr -= dt;
      while (a.rafaga > 0 && a.tr <= 0) {
        const idx = a.total - a.rafaga;
        a.rafaga--;
        a.tr += Math.max(0.0001, E.inter);
        disparar(m, j, a, slot, idx);
      }
    }
  }
}

function disparar(m: Motor, j: Jugador, a: ArmaJ, slot: number, idx: number) {
  const def = ARMAS[a.id];
  switch (def.comp) {
    case 'latigo': {
      const lado = idx % 2 === 0 ? j.mira : -j.mira;
      const largo = 150 * E.area;
      const alto = E.radio * 2 * E.area;
      const yo = j.y - 8 + Math.floor(idx / 2) * 14 * (idx % 2 ? 1 : -1);
      const x0 = lado > 0 ? j.x + 4 : j.x - 4 - largo;
      const x1 = lado > 0 ? j.x + 4 + largo : j.x - 4;
      m.emitir('latigo', j.x, yo, lado, largo, alto, a.id === 'toallazo' ? 1 : 0);
      const n = m.rej.rect(x0 - 40, yo - alto / 2 - 40, x1 + 40, yo + alto / 2 + 40);
      for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
      for (let k = 0; k < n; k++) {
        const e = m.en[m.tmp[k]];
        if (!e.vivo) continue;
        if (e.x + e.r < x0 || e.x - e.r > x1 || Math.abs(e.y - yo) > alto / 2 + e.r) continue;
        golpe(m, j, slot, e, E.dano, E.crit, E.critX, lado, 0, a.id);
      }
      break;
    }
    case 'varita': {
      const e = masCercano(m, j.x, j.y, 520);
      const ang = e ? Math.atan2(e.y - j.y, e.x - j.x) + (idx % 3 - 1) * 0.05 : Math.atan2(j.dy, j.dx);
      const v = E.rapidez * E.vel;
      nuevoProy(m, j, slot, a.id, 0, j.x, j.y - 6, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      break;
    }
    case 'cuchillo': {
      const base = Math.atan2(j.dy, j.dx);
      const ang = base + (m.az.n() - 0.5) * 0.12;
      const lado = (idx % 2 ? 1 : -1) * Math.ceil(idx / 2) * 7;
      const v = E.rapidez * E.vel;
      nuevoProy(m, j, slot, a.id, 0, j.x - Math.sin(base) * lado, j.y - 6 + Math.cos(base) * lado, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      break;
    }
    case 'hacha': {
      const lado = idx % 2 === 0 ? 1 : -1;
      const vx = lado * m.az.entre(30, 110) * (1 + idx * 0.15) + j.vx * 0.3;
      const vy = -E.rapidez * E.vel * m.az.entre(0.92, 1.08);
      const p = nuevoProy(m, j, slot, a.id, 1, j.x, j.y - 10, vx, vy, E.radio * E.area, E.dur);
      if (p) {
        p.ay = 620;
        p.giro = lado * 10;
      }
      break;
    }
    case 'espiral': {
      const v = E.rapidez * E.vel;
      const ang = (idx / Math.max(1, a.total)) * TAU + a.k;
      if (idx === 0) a.k += 0.35;
      const p = nuevoProy(m, j, slot, a.id, 4, j.x, j.y - 6, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      if (p) {
        p.giro = 2.4;
        p.golpeCada = 0.4;
      }
      break;
    }
    case 'cruz': {
      const e = idx === 0 ? masCercano(m, j.x, j.y, 500) : alAzarEnVista(m, j);
      const ang = e ? Math.atan2(e.y - j.y, e.x - j.x) : Math.atan2(j.dy, j.dx) + idx * 0.6;
      const v = E.rapidez * E.vel;
      const p = nuevoProy(m, j, slot, a.id, 2, j.x, j.y - 6, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      if (p) {
        p.ex = Math.cos(ang);
        p.ey = Math.sin(ang);
        p.n = v;
        p.giro = 14;
      }
      break;
    }
    case 'fuego': {
      if (idx === 0) {
        const e = alAzarEnVista(m, j);
        a.ang = e ? Math.atan2(e.y - j.y, e.x - j.x) : m.az.n() * TAU;
      }
      const ang = a.ang + (idx - (a.total - 1) / 2) * 0.16;
      const v = E.rapidez * E.vel;
      nuevoProy(m, j, slot, a.id, 0, j.x, j.y - 8, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      break;
    }
    case 'agua': {
      const e = m.az.n() < 0.55 ? alAzarEnVista(m, j) : null;
      const tx = e ? e.x + m.az.entre(-20, 20) : j.x + m.az.entre(-170, 170);
      const ty = e ? e.y + m.az.entre(-20, 20) : j.y + m.az.entre(-110, 110);
      const p = nuevoProy(m, j, slot, a.id, 6, j.x, j.y - 10, 0, 0, 8, 0.4);
      if (p) {
        p.ex = tx;
        p.ey = ty;
        p.ax = j.x;
        p.ay = j.y - 10;
        p.giro = 8;
        // Lo que va a mojar el charco al caer
        p.dano = E.dano;
        p.r = E.radio * E.area;
        p.golpeCada = E.golpeCada;
        p.n = E.dur;
      }
      break;
    }
    case 'runa': {
      const ang = m.az.n() * TAU;
      const v = E.rapidez * E.vel;
      const p = nuevoProy(m, j, slot, a.id, 3, j.x, j.y - 6, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      if (p) p.giro = 6;
      break;
    }
    case 'rayo': {
      const e = alAzarEnVista(m, j);
      const x = e ? e.x : j.x + m.az.entre(-200, 200);
      const y = e ? e.y : j.y + m.az.entre(-120, 120);
      const r = E.radio * E.area;
      rayo(m, j, slot, a.id, x, y, r, E.dano, a.id === 'tormenta' ? 1 : 0);
      if (a.id === 'tormenta') {
        for (const q of m.pend) {
          if (q.vivo) continue;
          Object.assign(q, { vivo: true, t: 0.32, x, y, r, dano: E.dano, dueno: j.i, slot, arma: a.id, tipo: 0 });
          break;
        }
      }
      break;
    }
    case 'pentagrama': {
      const luna = a.id === 'lunaDeMiel';
      m.emitir('limpiar', j.x, j.y, luna ? 1 : 0);
      for (let k = 0; k < m.nVivos; k++) {
        const e = m.en[m.vivos[k]];
        if (!e.vivo || e.jefe || e.luz || !j.enVista(e.x, e.y, 40)) continue;
        m.matar(e, j.i, !luna);
      }
      if (luna) {
        for (const g of m.gemas) if (g.vivo && j.enVista(g.x, g.y, 200)) {
          g.jalada = j.i;
          g.v = 200;
          g.xp *= 1.5;
        }
      }
      break;
    }
    case 'pajaro': {
      const dos = a.id === 'patosEnamorados';
      const radio = Math.min(j.vistaW, j.vistaH) * 0.36;
      const angs = dos ? [a.ang, Math.PI - a.ang] : [a.id === 'patoMorado' ? -a.ang : a.ang];
      for (const ang of angs) {
        const bx = j.x + Math.cos(ang) * radio * 1.25, by = j.y + Math.sin(ang) * radio * 0.8;
        const x = bx + m.az.entre(-50, 50), y = by + m.az.entre(-40, 40);
        m.explotar(j.i, slot, a.id, x, y, E.radio * E.area, E.dano, dos ? 4 : 3);
      }
      break;
    }
    case 'gato': {
      const glotona = a.id === 'ranaGlotona';
      const ang = m.az.n() * TAU;
      const p = nuevoProy(m, j, slot, a.id, 5, j.x + Math.cos(ang) * 10, j.y + Math.sin(ang) * 10, 0, 0, E.radio * E.area, E.dur);
      if (p) {
        p.perfora = 999;
        p.golpeCada = E.golpeCada;
        p.n = E.rapidez * E.vel * (glotona ? 1.2 : 1);
        p.ex = m.az.n() * 0.5;
      }
      break;
    }
    case 'cancion': {
      const z = nuevaZona(m);
      if (!z) break;
      const diluvio = a.id === 'diluvio';
      Object.assign(z, {
        vivo: true, dueno: j.i, arma: a.id, slot, tipo: 1, x: j.x, y: j.y, r: 0, w: E.radio * 2 * E.area, h: j.vistaH + 140, dano: E.dano,
        vida: E.dur, dur: E.dur, golpeCada: E.golpeCada, hz: HZ_COLUMNA + j.i, vx: 0, vy: 0, crece: 0, lento: diluvio ? 1.2 : 0, t: 0,
      });
      m.emitir('columna', j.x, j.y, z.w, z.h, E.dur, diluvio ? 1 : 0);
      break;
    }
    case 'reloj': {
      const seda = a.id === 'hiloSeda';
      const largo = E.rapidez * E.area;
      const ancho = E.radio * E.area;
      const ang = -Math.PI / 2 + ((a.k + idx * (12 / Math.max(1, a.total))) % 12) * (Math.PI / 6);
      if (idx === a.total - 1) a.k = (a.k + 1) % 12;
      m.emitir('haz', j.x, j.y - 8, ang, largo, ancho, seda ? 1 : 0);
      const cx = Math.cos(ang), cy = Math.sin(ang);
      const n = m.rej.circulo(j.x + cx * largo * 0.5, j.y + cy * largo * 0.5, largo * 0.5 + 40);
      for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
      for (let k = 0; k < n; k++) {
        const e = m.en[m.tmp[k]];
        if (!e.vivo) continue;
        const ex = e.x - j.x, ey = e.y - (j.y - 8);
        const along = ex * cx + ey * cy;
        if (along < 0 || along > largo + e.r) continue;
        const perp = Math.abs(-ex * cy + ey * cx);
        if (perp > ancho + e.r) continue;
        if (e.def.congelable || e.luz) e.congelado = Math.max(e.congelado, E.congela);
        else e.lento = Math.max(e.lento, E.congela);
        golpe(m, j, slot, e, E.dano, E.crit, E.critX, 0, 0, a.id);
      }
      break;
    }
    case 'pistola': {
      const diag = a.id === 'colonia' ? Math.PI / 4 : 0;
      const v = E.rapidez * E.vel;
      for (let q = 0; q < 4; q++) {
        const ang = diag + q * (Math.PI / 2) + (m.az.n() - 0.5) * 0.05;
        nuevoProy(m, j, slot, a.id, 0, j.x, j.y - 8, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      }
      break;
    }
  }
}

function rayo(m: Motor, j: Jugador, slot: number, arma: IdArma, x: number, y: number, r: number, dano: number, f: number) {
  m.emitir('rayo', x, y, r, 0, 0, f);
  const n = m.rej.circulo(x, y, r + 40);
  for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
  for (let k = 0; k < n; k++) {
    const e = m.en[m.tmp[k]];
    if (!e.vivo) continue;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 < (r + e.r) ** 2) golpe(m, j, slot, e, dano, E.crit, E.critX, e.x - x, e.y - y, arma);
  }
}

/** Los rayos que caen dos veces (la tormenta). */
export function pendientesGolpe(m: Motor, dt: number) {
  for (const q of m.pend) {
    if (!q.vivo) continue;
    q.t -= dt;
    if (q.t > 0) continue;
    q.vivo = false;
    const j = m.jug[q.dueno];
    if (!j) continue;
    E.crit = 0;
    rayo(m, j, q.slot, q.arma, q.x, q.y, q.r, q.dano, 1);
  }
}

// ---------------------------------------------------------------------------------------------------- Lo que se queda
function aura(m: Motor, j: Jugador, a: ArmaJ, slot: number) {
  const devora = a.id === 'espumaDevoradora';
  const r = E.radio * E.area + (devora ? a.k : 0);
  const hz = HZ_AURA + j.i;
  const cada = E.golpeCada * (1 - j.st.enfriamiento * 0.5);
  const n = m.rej.circulo(j.x, j.y, r + 40);
  for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
  for (let k = 0; k < n; k++) {
    const e = m.en[m.tmp[k]];
    if (!e.vivo) continue;
    const dx = e.x - j.x, dy = e.y - j.y;
    if (dx * dx + dy * dy > (r + e.r * 0.6) ** 2) continue;
    if (e.hz[hz] > m.tReal) continue;
    e.hz[hz] = m.tReal + cada;
    golpe(m, j, slot, e, E.dano, E.crit, E.critX, dx * E.retro, dy * E.retro, a.id);
    if (devora && m.az.n() < 0.05) m.curar(j, 1);
  }
}

function orbitas(m: Motor, j: Jugador, a: ArmaJ, slot: number, dt: number, ritmo: number) {
  const eternas = E.dur >= 9000;
  if (a.activo <= 0 && !eternas) {
    a.t -= dt * ritmo;
    if (a.t <= 0) a.activo = E.dur;
    return;
  }
  a.activo -= dt;
  if (a.activo <= 0 && !eternas) a.t = E.enfr;
  a.ang += E.rapidez * E.vel * dt;
  a.total = E.cant;
  const R = 70 * Math.sqrt(E.area) + 8;
  const r = E.radio * E.area;
  const hz = HZ_ESPONJAS + j.i;
  for (let q = 0; q < E.cant; q++) {
    const ang = a.ang + (q / E.cant) * TAU;
    const x = j.x + Math.cos(ang) * R, y = j.y + Math.sin(ang) * R * 0.85;
    const n = m.rej.circulo(x, y, r + 40);
    for (let k = 0; k < n; k++) {
      const e = m.en[m.rej.fuera[k]];
      if (!e.vivo || e.hz[hz] > m.tReal) continue;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 > (r + e.r) ** 2) continue;
      e.hz[hz] = m.tReal + E.golpeCada;
      golpe(m, j, slot, e, E.dano, E.crit, E.critX, e.x - j.x, e.y - j.y, a.id);
    }
  }
}

function laser(m: Motor, j: Jugador, a: ArmaJ, slot: number, dt: number) {
  a.ang += E.rapidez * E.vel * dt;
  a.total = E.cant;
  const largo = 230 * E.area;
  const ancho = E.radio * E.area;
  const hz = HZ_LASER + j.i;
  const n = m.rej.circulo(j.x, j.y, largo + 40);
  for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
  for (let k = 0; k < n; k++) {
    const e = m.en[m.tmp[k]];
    if (!e.vivo || e.hz[hz] > m.tReal) continue;
    const ex = e.x - j.x, ey = e.y - (j.y - 8);
    const d = Math.hypot(ex, ey);
    if (d > largo + e.r) continue;
    // ¿Cerca de alguno de los rayos?
    const ae = Math.atan2(ey, ex);
    let pega = false;
    for (let q = 0; q < E.cant && !pega; q++) {
      let da = ae - (a.ang + (q / E.cant) * TAU);
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(Math.sin(da) * d) < ancho + e.r && Math.cos(da) > 0) pega = true;
    }
    if (!pega) continue;
    e.hz[hz] = m.tReal + E.golpeCada;
    golpe(m, j, slot, e, E.dano, E.crit, E.critX, 0, 0, a.id);
  }
}

// ---------------------------------------------------------------------------------------------------- Proyectiles
const COMP_LUCES = new Set([0, 1, 2, 3, 4]);

export function moverProyectiles(m: Motor, dt: number) {
  for (const p of m.pr) {
    if (!p.vivo) continue;
    p.t += dt;
    p.vida -= dt;
    const j = m.jug[p.dueno];
    switch (p.comp) {
      case 0:
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        break;
      case 1:
        p.vy += p.ay * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ang += p.giro * dt;
        break;
      case 2: {
        const sp = p.n * Math.max(-1.15, 1 - (2 * p.t) / 1.05);
        p.vx = p.ex * sp;
        p.vy = p.ey * sp;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ang += p.giro * dt;
        break;
      }
      case 3: {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ang += p.giro * dt;
        if (j) {
          const hw = j.vistaW / 2 - 8, hh = j.vistaH / 2 - 8;
          let reboto = false;
          if (p.x < j.x - hw && p.vx < 0) (p.vx = -p.vx), (reboto = true);
          if (p.x > j.x + hw && p.vx > 0) (p.vx = -p.vx), (reboto = true);
          if (p.y < j.y - hh && p.vy < 0) (p.vy = -p.vy), (reboto = true);
          if (p.y > j.y + hh && p.vy > 0) (p.vy = -p.vy), (reboto = true);
          if (reboto && p.arma === 'jabonExplosivo') m.explotar(p.dueno, p.slot, p.arma, p.x, p.y, 58 * (p.r / 16), p.dano, 0);
        }
        break;
      }
      case 4: {
        const c = Math.cos(p.giro * dt), s = Math.sin(p.giro * dt);
        const vx = p.vx * c - p.vy * s, vy = p.vx * s + p.vy * c;
        p.vx = vx * 1.004;
        p.vy = vy * 1.004;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ang += 9 * dt;
        break;
      }
      case 5: {
        // Ranita: brinco y descanso; la glotona siempre va por alguien
        const ciclo = 0.5;
        const fase = (p.t + p.ex) % ciclo;
        if (fase < dt * 1.5 || (p.vx === 0 && p.vy === 0)) {
          const glotona = p.arma === 'ranaGlotona';
          const e = glotona || m.az.n() < 0.6 ? masCercano(m, p.x, p.y, glotona ? 400 : 220) : null;
          const ang = e ? Math.atan2(e.y - p.y, e.x - p.x) : m.az.n() * TAU;
          p.vx = Math.cos(ang) * p.n;
          p.vy = Math.sin(ang) * p.n;
          p.ang = ang;
        }
        const salta = fase < ciclo * 0.62;
        if (salta) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        // Si se aleja mucho del dueño, vuelve
        if (j && Math.hypot(p.x - j.x, p.y - j.y) > Math.max(j.vistaW, j.vistaH) * 0.7) {
          const ang = Math.atan2(j.y - p.y, j.x - p.x);
          p.vx = Math.cos(ang) * p.n;
          p.vy = Math.sin(ang) * p.n;
        }
        break;
      }
      case 6: {
        // Botellita volando: cae donde iba y deja el charco
        const k = Math.min(1, p.t / 0.38);
        p.x = p.ax + (p.ex - p.ax) * k;
        p.y = p.ay + (p.ey - p.ay) * k - Math.sin(k * Math.PI) * 50;
        p.ang += p.giro * dt;
        if (k >= 1) {
          p.vivo = false;
          const z = nuevaZona(m);
          if (z && j) {
            const inunda = p.arma === 'inundacion';
            Object.assign(z, {
              vivo: true, dueno: p.dueno, arma: p.arma, slot: p.slot, tipo: 0, x: p.ex, y: p.ey, r: p.r, w: 0, h: 0, dano: p.dano, vida: p.n, dur: p.n,
              golpeCada: p.golpeCada, hz: HZ_CHARCO + p.dueno, vx: 0, vy: 0, crece: inunda ? 1 : 0, lento: 0, t: 0,
            });
            m.emitir('charco', p.ex, p.ey, p.r, p.n, 0, inunda ? 1 : 0);
          }
        }
        continue;
      }
    }
    if (p.vida <= 0) {
      p.vivo = false;
      if (j && !p.mini && COMP_LUCES.has(p.comp) && j.tieneCarta('lucesMedellin')) m.explotar(p.dueno, p.slot, p.arma, p.x, p.y, 42, p.dano * 0.6, 5);
      continue;
    }
    if (!j) continue;
    choques(m, j, p);
  }
}

function choques(m: Motor, j: Jugador, p: Proyectil) {
  const n = m.rej.circulo(p.x, p.y, p.r + 48);
  for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
  for (let k = 0; k < n && p.vivo; k++) {
    const e = m.en[m.tmp[k]];
    if (!e.vivo) continue;
    const rr = p.r + e.r;
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > rr * rr) continue;
    // ¿Ya le pegó?
    let ya = false;
    for (let q = 0; q < 16; q++) if (p.gid[q] === e.uid && p.gt[q] > m.tReal) ya = true;
    if (ya) continue;
    p.gid[p.gi] = e.uid;
    p.gt[p.gi] = p.perfora >= 999 ? m.tReal + p.golpeCada : m.tReal + 1e6;
    p.gi = (p.gi + 1) % 16;
    const kx = p.vx || e.x - p.x, ky = p.vy || e.y - p.y;
    const luz = e.luz;
    golpe(m, j, p.slot, e, p.dano, p.crit, p.critX, kx * p.retro, ky * p.retro, p.arma);
    if (luz) continue;
    // Rana glotona: lo que se traga lo escupe en gotas doradas
    if (!e.vivo && p.arma === 'ranaGlotona' && m.az.n() < 0.3) m.soltar('moneda', e.x, e.y);
    if (j.tieneCarta('propuesta') && e.vivo && m.az.n() < 0.12) e.congelado = Math.max(e.congelado, 1.5);
    if (j.tieneCarta('halloween') && !p.mini && m.az.n() < 0.2 && (p.comp === 0 || p.comp === 2)) {
      const c = libre(m);
      if (c) {
        c.vivo = true;
        Object.assign(c, { dueno: p.dueno, slot: p.slot, arma: p.arma, comp: 0, x: p.x, y: p.y, vx: p.vx * 0.9, vy: p.vy * 0.9, ax: 0, ay: 0, r: p.r * 0.6, dano: p.dano * 0.5, crit: 0, critX: 2, perfora: 1, vida: 0.6, t: 0, ang: p.ang, giro: 0, golpeCada: 0.5, retro: 0.5, gi: 0, ex: 0, ey: 0, n: 0, mini: true });
        c.gid.fill(0);
        c.gid[0] = e.uid;
        c.gt.fill(0);
        c.gt[0] = m.tReal + 1e6;
      }
    }
    if (p.perfora < 999) {
      p.perfora--;
      if (p.perfora <= 0) {
        // Para siempre: rebota a otro
        if (j.tieneCarta('paraSiempre') && p.n < 2 && (p.comp === 0)) {
          const o = masCercano(m, p.x, p.y, 260, e.uid);
          if (o) {
            const v = Math.hypot(p.vx, p.vy);
            const ang = Math.atan2(o.y - p.y, o.x - p.x);
            p.vx = Math.cos(ang) * v;
            p.vy = Math.sin(ang) * v;
            p.ang = ang;
            p.perfora = 1;
            p.n++;
            p.vida = Math.max(p.vida, 0.8);
            continue;
          }
        }
        p.vivo = false;
        if (!p.mini && j.tieneCarta('lucesMedellin') && COMP_LUCES.has(p.comp)) m.explotar(p.dueno, p.slot, p.arma, p.x, p.y, 42, p.dano * 0.6, 5);
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------------- Zonas
export function moverZonas(m: Motor, dt: number) {
  for (const z of m.zonas) {
    if (!z.vivo) continue;
    z.t += dt;
    z.vida -= dt;
    if (z.vida <= 0) {
      z.vivo = false;
      continue;
    }
    const j = m.jug[z.dueno];
    if (!j) continue;
    if (z.tipo === 1) {
      // La columna de la ducha sigue al personaje
      z.x = j.x;
      z.y = j.y;
    } else if (z.crece) {
      // La inundación persigue al dueño despacito
      const dx = j.x - z.x, dy = j.y - z.y, d = Math.hypot(dx, dy);
      if (d > 30) {
        z.x += (dx / d) * 46 * dt;
        z.y += (dy / d) * 46 * dt;
      }
    }
    const n = z.tipo === 1 ? m.rej.rect(z.x - z.w / 2 - 40, z.y - z.h / 2, z.x + z.w / 2 + 40, z.y + z.h / 2) : m.rej.circulo(z.x, z.y, z.r + 40);
    for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
    for (let k = 0; k < n; k++) {
      const e = m.en[m.tmp[k]];
      if (!e.vivo || e.hz[z.hz] > m.tReal) continue;
      if (z.tipo === 1) {
        if (Math.abs(e.x - z.x) > z.w / 2 + e.r * 0.6 || Math.abs(e.y - z.y) > z.h / 2) continue;
      } else if ((e.x - z.x) ** 2 + ((e.y - z.y) * 1.25) ** 2 > (z.r + e.r * 0.5) ** 2) continue;
      e.hz[z.hz] = m.tReal + z.golpeCada;
      if (z.lento) e.lento = Math.max(e.lento, z.lento);
      golpe(m, j, z.slot, e, z.dano, E.crit * 0, 2, z.tipo === 1 ? 0 : e.x - z.x, z.tipo === 1 ? 1 : e.y - z.y, z.arma);
      if (z.crece && z.r < 160) z.r += 0.6;
    }
  }
}
