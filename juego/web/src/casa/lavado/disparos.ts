// Cómo dispara cada arma y cómo se mueven sus proyectiles y zonas (la mitad «armas» del motor). Cada comportamiento
// copia el del original: el látigo alterna de lado, la varita busca al más cercano, el hacha sube y cae, la cruz va
// y vuelve, la biblia orbita, el ajo pica alrededor, el agua bendita deja charcos, la runa rebota en la pantalla…
import { ARMAS } from './armas';
import type { ArmaJ, Enemigo, Jugador, Motor, Proyectil, Zona } from './motor';
import type { IdArma } from './tipos';

/** Ranuras de «ya le pegó» en cada enemigo (por jugador: + índice del jugador). */
const HZ_AURA = 0, HZ_ESPONJAS = 4, HZ_LASER = 8, HZ_COLUMNA = 12, HZ_CHARCO = 16, HZ_MASCARILLA = 20;
const TAU = Math.PI * 2;
/** Armas de zona (para la carta del planetario). */
const ZONA = new Set<IdArma>(['espuma', 'espumaDevoradora', 'botellas', 'inundacion', 'ducha', 'diluvio', 'esponjas', 'esponjasEternas', 'patoAmarillo', 'patoMorado', 'patosEnamorados',
  'mascarilla', 'spa', 'chancletas', 'pisoton']);

/** Lo efectivo del arma con las estadísticas del jugador (un solo objeto que se reutiliza). */
const E = { dano: 0, area: 0, vel: 0, cant: 0, dur: 0, enfr: 0, perfora: 0, crit: 0, critX: 2, golpeCada: 0.5, retro: 1, radio: 10, rapidez: 300, congela: 0, inter: 0.1 };

function calcular(j: Jugador, a: ArmaJ) {
  const b = a.b;
  const zona = ZONA.has(a.id) && j.tieneCarta('estrellas');
  E.dano = b.dano * (1 + j.st.poder) * (zona ? 1.5 : 1);
  E.area = b.area * Math.max(0.3, 1 + j.st.area) * (zona ? 1 + 0.5 * Math.max(0, j.st.poder) : 1);
  E.vel = b.vel * Math.max(0.3, 1 + j.st.velocidad);
  E.cant = Math.max(1, Math.round(b.cant + j.st.cantidad));
  E.dur = b.dur * Math.max(0.3, 1 + j.st.duracion);
  E.enfr = Math.max(0.05, b.enfr * (1 - j.st.enfriamiento));
  E.perfora = b.perfora;
  const mat = j.tieneCarta('certero');
  E.crit = (b.crit + (mat ? 0.1 : 0)) * (1 + j.st.suerte);
  E.critX = b.critX || 2;
  E.golpeCada = Math.max(0.12, b.golpeCada);
  E.retro = b.retro;
  E.radio = b.radio;
  E.rapidez = b.rapidez;
  E.congela = b.congela * (1 + j.st.duracion);
  E.inter = b.inter;
  switch (ARMAS[a.id].comp) {
    case 'piedra':
      // Daño fijo según el nivel: no le importa el poder
      E.dano = b.dano;
      break;
    case 'brillantina':
      // Cada vida extra le suma un rayito
      E.cant += Math.max(0, Math.round(j.st.revivir));
      break;
    case 'lanza':
      // La duración trae más cepillos
      E.cant += Math.floor(Math.max(0, E.dur - 1) * 4);
      break;
    case 'letras':
      // La velocidad y la duración las hacen pegar a más
      E.perfora = b.perfora + Math.floor(Math.max(0, j.st.velocidad) * 5 + Math.max(0, j.st.duracion) * 5);
      break;
  }
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

/** Apuntar a mano: el ángulo hacia donde apunta el jugador (null si sus armas buscan solas). */
function aMano(j: Jugador): number | null {
  return j.manual ? Math.atan2(j.ay, j.ax) : null;
}

/** Hacia dónde va un arma «de adelante»: a mano, hacia donde apunta; si no, hacia el más cercano si está a menos de
 *  `r` (huyendo, adelante casi nunca hay nadie) y, si no hay nadie cerca, hacia donde mira. */
function apuntar(m: Motor, j: Jugador, r: number): number {
  const mano = aMano(j);
  if (mano !== null) return mano;
  const e = masCercano(m, j.x, j.y, r);
  return e ? Math.atan2(e.y - j.y, e.x - j.x) : Math.atan2(j.dy, j.dx);
}

function golpe(m: Motor, j: Jugador, slot: number, e: Enemigo, dano: number, crit: number, critX: number, kx: number, ky: number, arma: IdArma) {
  const c = crit > 0 && m.az.n() < crit;
  m.herir(e, c ? dano * critX : dano, j.i, slot, kx, ky, c, arma);
  if (c && (arma === 'toallazo' || arma === 'afeitada')) m.curar(j, 1);
  return c;
}

/** Uno al azar de los que están a menos de `r` (o el más cercano, si no hay). */
function cercaAlAzar(m: Motor, x: number, y: number, r: number): Enemigo | null {
  const n = m.rej.circulo(x, y, r);
  for (let intento = 0; intento < 8 && n > 0; intento++) {
    const e = m.en[m.rej.fuera[Math.floor(m.az.n() * n)]];
    if (e.vivo && !e.luz && (e.x - x) ** 2 + (e.y - y) ** 2 < r * r) return e;
  }
  return masCercano(m, x, y, r);
}

/** El más cercano que esté adelante (a menos de 70° de `dir`). */
function adelante(m: Motor, j: Jugador, dir: number, r: number): Enemigo | null {
  const n = m.rej.circulo(j.x, j.y, r);
  const cx = Math.cos(dir), cy = Math.sin(dir);
  let mejor: Enemigo | null = null, d0 = r * r;
  for (let k = 0; k < n; k++) {
    const e = m.en[m.rej.fuera[k]];
    if (!e.vivo || e.luz) continue;
    const dx = e.x - j.x, dy = e.y - j.y, d = dx * dx + dy * dy;
    if (d >= d0 || d < 1) continue;
    if ((dx * cx + dy * cy) / Math.sqrt(d) < 0.05) continue;
    d0 = d;
    mejor = e;
  }
  return mejor;
}

/** Golpea a todos en un círculo (sin crear nada). Devuelve cuántos tocó. */
function circulo(m: Motor, j: Jugador, slot: number, x: number, y: number, r: number, dano: number, arma: IdArma, empuje = 1) {
  const n = m.rej.circulo(x, y, r + 40);
  for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
  let t = 0;
  for (let k = 0; k < n; k++) {
    const e = m.en[m.tmp[k]];
    if (!e.vivo) continue;
    const dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy > (r + e.r * 0.7) ** 2) continue;
    golpe(m, j, slot, e, dano, E.crit, E.critX, dx * empuje, dy * empuje, arma);
    t++;
  }
  return t;
}

/** Golpea a todos en un rectángulo (centro, medio ancho y medio alto). */
function rectangulo(m: Motor, j: Jugador, slot: number, cx: number, cy: number, hw: number, hh: number, dano: number, arma: IdArma, kx: number, ky: number) {
  const n = m.rej.rect(cx - hw - 40, cy - hh - 40, cx + hw + 40, cy + hh + 40);
  for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
  for (let k = 0; k < n; k++) {
    const e = m.en[m.tmp[k]];
    if (!e.vivo) continue;
    if (Math.abs(e.x - cx) > hw + e.r * 0.7 || Math.abs(e.y - cy) > hh + e.r * 0.7) continue;
    golpe(m, j, slot, e, dano, E.crit, E.critX, kx, ky, arma);
  }
}

// ---------------------------------------------------------------------------------------------------- Disparar
export function actualizarArmas(m: Motor, j: Jugador, dt: number) {
  const moviendo = Math.hypot(j.vx, j.vy) > 20;
  let ritmo = 1;
  if (j.tieneCarta('viajeLargo') && moviendo) ritmo *= 1.3;
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
      case 'chancla':
        chanclas(m, j, a, slot, dt * ritmo);
        continue;
      case 'pajaro':
        a.ang += E.rapidez * dt * (a.id === 'patoMorado' ? 1 : 1);
        break;
      case 'tajo':
        // La máquina pega más mientras más camine sin parar (y se reinicia al frenar)
        a.k = moviendo ? a.k + Math.hypot(j.vx, j.vy) * dt : 0;
        break;
    }
    // La máquina y los cubitos se recargan más rápido caminando
    const caminando = moviendo && (def.comp === 'tajo' || def.comp === 'cubito') ? 1.5 * (1 + Math.max(0, j.st.movimiento)) : 1;
    a.t -= dt * ritmo * caminando;
    if (a.rafaga <= 0 && a.t <= 0) {
      // (las luces del espejo: cada proyectil son cuatro rayitas)
      a.total = E.cant * (def.comp === 'luces' ? 4 : 1);
      // Compañeros de estudio: a veces la tarea se hace dos veces
      if (j.tieneCarta('dobleTurno') && m.az.n() < 0.25) a.total *= 2;
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
      // (a mano, el primer toallazo va hacia donde apunta)
      const frente = j.manual ? (j.ax >= 0 ? 1 : -1) : j.mira;
      const lado = idx % 2 === 0 ? frente : -frente;
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
      const mano = aMano(j);
      const e = mano === null ? masCercano(m, j.x, j.y, 520) : null;
      const ang = mano !== null ? mano + (idx % 3 - 1) * 0.07 : e ? Math.atan2(e.y - j.y, e.x - j.x) + (idx % 3 - 1) * 0.05 : Math.atan2(j.dy, j.dx);
      const v = E.rapidez * E.vel;
      nuevoProy(m, j, slot, a.id, 0, j.x, j.y - 6, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      break;
    }
    case 'cuchillo': {
      const base = aMano(j) ?? Math.atan2(j.dy, j.dx);
      const ang = base + (m.az.n() - 0.5) * 0.12;
      const lado = (idx % 2 ? 1 : -1) * Math.ceil(idx / 2) * 7;
      const v = E.rapidez * E.vel;
      nuevoProy(m, j, slot, a.id, 0, j.x - Math.sin(base) * lado, j.y - 6 + Math.cos(base) * lado, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      break;
    }
    case 'hacha': {
      const lado = (idx % 2 === 0 ? 1 : -1) * (j.manual && j.ax < 0 ? -1 : 1);
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
      const mano = aMano(j);
      const e = mano !== null ? null : idx === 0 ? masCercano(m, j.x, j.y, 500) : alAzarEnVista(m, j);
      const ang = mano !== null ? mano + (idx % 2 ? 1 : -1) * Math.ceil(idx / 2) * 0.22 : e ? Math.atan2(e.y - j.y, e.x - j.x) : Math.atan2(j.dy, j.dx) + idx * 0.6;
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
        const mano = aMano(j);
        const e = mano === null ? alAzarEnVista(m, j) : null;
        a.ang = mano ?? (e ? Math.atan2(e.y - j.y, e.x - j.x) : m.az.n() * TAU);
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
      const mano = aMano(j);
      const ang = mano !== null ? mano + (m.az.n() - 0.5) * 0.3 : m.az.n() * TAU;
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
          Object.assign(q, { vivo: true, t: 0.32, x, y, r, dano: E.dano, dueno: j.i, slot, arma: a.id, tipo: 0, crit: 0, critX: 2 });
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
        vida: E.dur, dur: E.dur, golpeCada: E.golpeCada, hz: HZ_COLUMNA + j.i, vx: 0, vy: 0, crece: 0, lento: diluvio ? 1.2 : 0, dientes: 0, t: 0,
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
      const diag = (a.id === 'colonia' ? Math.PI / 4 : 0) + (aMano(j) ?? 0);
      const v = E.rapidez * E.vel;
      for (let q = 0; q < 4; q++) {
        const ang = diag + q * (Math.PI / 2) + (m.az.n() - 0.5) * 0.05;
        nuevoProy(m, j, slot, a.id, 0, j.x, j.y - 8, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      }
      break;
    }
    // ============================================================================================== Versión 2
    case 'tajo': {
      // Máquina de afeitar: tajos cortos adelante, uno encima de otro (la afeitada, a lado y lado)
      const afeitada = a.id === 'afeitada';
      const frente = j.manual ? (j.ax >= 0 ? 1 : -1) : j.mira;
      const lado = afeitada && idx % 2 ? -frente : frente;
      const fila = afeitada ? Math.floor(idx / 2) : idx;
      const largo = E.rapidez * E.area * Math.max(0.7, E.vel);
      const alto = E.radio * 2 * E.area * 0.8;
      const yo = j.y - 8 + (fila % 2 ? 1 : -1) * Math.ceil(fila / 2) * alto * 0.6;
      // (lo caminado sin parar se vuelve daño: hasta 5 por nivel)
      const bono = Math.min(5 * (afeitada ? 10 : a.nivel), a.k / 150) * (1 + j.st.poder);
      m.emitir('latigo', j.x, yo, lado, largo, alto, afeitada ? 3 : 2);
      rectangulo(m, j, slot, j.x + lado * (6 + largo / 2), yo, largo / 2, alto / 2, E.dano + bono, a.id, lado, 0);
      break;
    }
    case 'plancha': {
      // Plancha del pelo: planchazos al más cercano (y a los que estén por ahí)
      const diva = a.id === 'planchaDiva';
      const e = idx === 0 ? masCercano(m, j.x, j.y, 330) : cercaAlAzar(m, j.x, j.y, 260);
      const dir = aMano(j) ?? Math.atan2(j.dy, j.dx);
      const x = e ? e.x : j.x + Math.cos(dir) * 50, y = e ? e.y : j.y + Math.sin(dir) * 40;
      const r = E.radio * E.area;
      const dano = E.dano + (diva ? a.k3 * (1 + j.st.poder) : 0);
      m.emitir('tajo', x, y, r, m.az.n() * Math.PI, 0, diva ? 1 : 0);
      circulo(m, j, slot, x, y, r, dano, a.id, 0.6);
      // Remate (desde el nivel 8): cada cinco planchazos, uno enorme de arriba a abajo
      a.k2++;
      if (E.crit > 0 && a.k2 % 5 === 0) {
        const ancho = 46 * E.area;
        m.emitir('tajo', x, j.y, j.vistaH * 0.9, ancho, 0, 2);
        rectangulo(m, j, slot, x, j.y, ancho / 2, j.vistaH * 0.45, dano * 2, a.id, 0, 1);
      }
      break;
    }
    case 'vapor': {
      // Vaporizador: un cono de nubecitas hirviendo (la sauna, adelante y atrás)
      const sauna = a.id === 'sauna';
      if (idx === 0) a.ang = apuntar(m, j, 260);
      const ang = a.ang + (sauna && idx % 2 ? Math.PI : 0) + (m.az.n() - 0.5) * 0.75;
      const v = E.rapidez * E.vel * m.az.entre(0.75, 1.15);
      const p = nuevoProy(m, j, slot, a.id, 11, j.x + Math.cos(ang) * 12, j.y - 6 + Math.sin(ang) * 10, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      if (p) {
        p.dano = E.dano + (sauna ? a.k3 * (1 + j.st.poder) : 0);
        p.n = E.radio * E.area;
        p.ex = E.dur;
      }
      break;
    }
    case 'mariposa':
      // Una bandada entera de una vez (las demás vueltas de la ráfaga no hacen nada)
      if (idx === 0) {
        bandada(m, j, a, slot, a.total);
        a.rafaga = 0;
      }
      break;
    case 'pistolaAgua': {
      const hidro = a.id === 'hidrolavadora';
      if (idx === 0) {
        const dir = aMano(j) ?? Math.atan2(j.dy, j.dx);
        const e = adelante(m, j, dir, 480);
        if (!e) {
          // Nadie adelante: guarda los tiros para después
          a.k = Math.min(40, a.k + a.total);
          a.rafaga = 0;
          break;
        }
        if (a.k >= 1) {
          const extra = Math.floor(a.k);
          a.rafaga += extra;
          a.total += extra;
          a.k = 0;
        }
        a.ang = Math.atan2(e.y - j.y, e.x - j.x);
        // La hidrolavadora, cada tanto, suelta un chorrazo que rebota por toda la pantalla
        if (hidro && ++a.k2 % 6 === 0) {
          for (let q = 0; q < 18; q++) {
            const ang = (q / 18) * TAU + m.az.n() * 0.2;
            const v = E.rapidez * E.vel * 0.6;
            const c = nuevoProy(m, j, slot, a.id, 3, j.x, j.y - 6, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area * 1.3, 2.2);
            if (c) {
              c.perfora = 999;
              c.golpeCada = 0.4;
              c.dano = E.dano * 0.8;
            }
          }
        }
      }
      const ang = a.ang + (m.az.n() - 0.5) * 0.12;
      const v = E.rapidez * E.vel;
      nuevoProy(m, j, slot, a.id, 0, j.x + Math.cos(ang) * 10, j.y - 8 + Math.sin(ang) * 8, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
      break;
    }
    case 'brillantina': {
      // Rayitos de brillantina: los primeros al más cercano, los demás a los de por ahí
      const lluvia = a.id === 'lluviaBrillantina';
      const e = idx === 0 ? masCercano(m, j.x, j.y, 420) : cercaAlAzar(m, j.x, j.y, 380);
      if (!e) break;
      m.emitir('rayo', e.x, e.y, 14, 0, 0, 2);
      const c = m.az.n() < E.crit;
      m.herir(e, E.dano, j.i, slot, 0, 0, c, a.id);
      if (c) {
        // El crítico revienta alrededor, y encadenado pega cada vez más (las vidas extra suben el tope)
        const tope = Math.max(2, 3 * Math.round(j.st.revivir) + (lluvia ? 4 : 2));
        a.k = a.k >= tope ? 0 : a.k + 1;
        m.explotar(j.i, slot, a.id, e.x, e.y, E.radio * E.area, E.dano * (1 + a.k), 6);
      }
      break;
    }
    case 'cubito': {
      // Cubitos cortos hacia donde mira; la granizada, quieta, para seis lados
      const granizo = a.id === 'granizada';
      const moviendo = Math.hypot(j.vx, j.vy) > 20;
      const mano = aMano(j);
      if (idx === 0) a.ang = apuntar(m, j, 240);
      const base = a.ang;
      const angs: number[] = [];
      if (granizo && !moviendo && mano === null) for (let q = 0; q < 6; q++) angs.push((q / 6) * TAU + idx * 0.18);
      else angs.push(base + (idx % 2 ? 1 : -1) * Math.ceil(idx / 2) * 0.16 + (m.az.n() - 0.5) * 0.1);
      for (const ang of angs) {
        const v = E.rapidez * E.vel;
        const p = nuevoProy(m, j, slot, a.id, 0, j.x + Math.cos(ang) * 8, j.y - 8 + Math.sin(ang) * 6, Math.cos(ang) * v, Math.sin(ang) * v, E.radio * E.area, E.dur);
        if (p) {
          p.dano *= moviendo ? 1.25 : 1;
          p.ey = E.congela;
          p.ex = granizo ? 0.16 : 0.05;
        }
      }
      break;
    }
    case 'lanza': {
      // Cepillos de espalda: caen del cielo en abanico adelante y revientan en espuma
      const celeste = a.id === 'cepilloCeleste';
      if (idx === 0) a.ang = apuntar(m, j, 320);
      const n = Math.max(1, a.total);
      const abre = (idx - (n - 1) / 2) * 0.34;
      const d = 95 + (idx % 3) * 34 + m.az.entre(-8, 8);
      const x = j.x + Math.cos(a.ang + abre) * d, y = j.y + Math.sin(a.ang + abre) * d * 0.85;
      const r = E.radio * E.area;
      const demora = 0.36;
      m.emitir('lanza', x, y, r, demora, 0, celeste ? 1 : 0);
      pendiente(m, j, slot, a.id, 1, demora, x, y, r, E.dano);
      if (celeste) pendiente(m, j, slot, a.id, 1, demora + 0.28, x, y, r * 1.35, E.dano * 0.6);
      break;
    }
    case 'mascarilla': {
      // Mascarilla de pepino: una gota que se queda adelante un ratico
      const spa = a.id === 'spa';
      if (idx === 0) a.ang = apuntar(m, j, 200);
      const n = Math.max(1, a.total);
      const ang = a.ang + (idx - (n - 1) / 2) * 0.6;
      const r = E.radio * E.area;
      const d = 26 + r * 1.05 + (idx % 2) * 12;
      const z = nuevaZona(m);
      if (!z) break;
      Object.assign(z, {
        vivo: true, dueno: j.i, arma: a.id, slot, tipo: 2, x: j.x + Math.cos(ang) * d, y: j.y + Math.sin(ang) * d * 0.85, r, w: 0, h: 0, dano: E.dano,
        vida: E.dur, dur: E.dur, golpeCada: E.golpeCada, hz: HZ_MASCARILLA + j.i, vx: Math.cos(ang) * 30, vy: Math.sin(ang) * 26, crece: 0, lento: 0,
        dientes: (0.03 + E.crit) * (1 + Math.max(0, j.st.suerte)), t: 0,
      });
      m.emitir('charco', z.x, z.y, r, E.dur, 0, 2);
      if (spa && idx === 0) m.curar(j, 1);
      break;
    }
    case 'piedra': {
      // Piedra pómez: cae desde arriba de la pantalla hacia un mugroso y se parte en pedacitos
      const e = alAzarEnVista(m, j);
      const tx = e ? e.x : j.x + m.az.entre(-200, 200), ty = e ? e.y : j.y + m.az.entre(-100, 100);
      const sx = tx + m.az.entre(-70, 70), sy = j.y - j.vistaH / 2 - 60;
      const v = E.rapidez * E.vel;
      const d = Math.hypot(tx - sx, ty - sy) || 1;
      const p = nuevoProy(m, j, slot, a.id, 7, sx, sy, ((tx - sx) / d) * v, ((ty - sy) / d) * v, E.radio * E.area, d / v + 0.04);
      if (p) {
        p.perfora = 1;
        p.giro = m.az.entre(-6, 6);
        p.n = 3 + Math.floor(E.cant / 2);
        p.ex = E.dur;
      }
      break;
    }
    case 'luces': {
      // Luces del espejo: rayitas delgadas sobre un mugroso (rojo la primera; después amarillo, azul, fucsia, naranja)
      const camerino = a.id === 'camerino';
      const e = idx === 0 ? masCercano(m, j.x, j.y, 560) : alAzarEnVista(m, j);
      if (!e) break;
      const vertical = camerino && idx % 2 === 1;
      const largo = E.rapidez * 2 * E.area;
      const grosor = E.radio;
      const color = idx === 0 ? 0 : 1 + ((idx - 1) % 4);
      m.emitir('luces', e.x, e.y - 6, largo, grosor, vertical ? 1 : 0, color);
      if (vertical) rectangulo(m, j, slot, e.x, e.y, grosor, largo / 2, E.dano, a.id, 0, 0);
      else rectangulo(m, j, slot, e.x, e.y, largo / 2, grosor, E.dano, a.id, 0, 0);
      break;
    }
    case 'letras': {
      // Letras de espuma: suben desde abajo de la pantalla y caen locas (solo pegan cayendo)
      const abc = a.id === 'abecedario';
      const x = j.x + m.az.entre(-0.42, 0.42) * j.vistaW;
      const y = j.y + j.vistaH / 2 + 30;
      const sube = Math.sqrt(2 * 900 * j.vistaH * m.az.entre(0.6, 0.9));
      const p = nuevoProy(m, j, slot, a.id, 8, x, y, m.az.entre(-90, 90), -sube, E.radio * E.area, 4);
      if (p) {
        p.ay = 900;
        p.perfora = E.perfora;
        p.golpeCada = 0.03;
        p.n = abc ? 1 : 0;
        p.giro = m.az.entre(-5, 5);
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
    E.crit = q.crit;
    E.critX = q.critX;
    if (q.tipo === 1) {
      // El cepillo de espalda llega al piso: revienta en espuma
      m.emitir('explosion', q.x, q.y, q.r, 0, 0, 7);
      circulo(m, j, q.slot, q.x, q.y, q.r, q.dano, q.arma, 1);
    } else rayo(m, j, q.slot, q.arma, q.x, q.y, q.r, q.dano, 1);
  }
}

/** Un golpe que cae después (con el crítico del arma en ese momento). */
function pendiente(m: Motor, j: Jugador, slot: number, arma: IdArma, tipo: number, t: number, x: number, y: number, r: number, dano: number) {
  for (const q of m.pend) {
    if (q.vivo) continue;
    Object.assign(q, { vivo: true, t, x, y, r, dano, dueno: j.i, slot, arma, tipo, crit: E.crit, critX: E.critX });
    return;
  }
}

/** Una bandada de mariposas: entra por un borde de la pantalla y la cruza pasando por el centro. */
function bandada(m: Motor, j: Jugador, a: ArmaJ, slot: number, cuantas: number) {
  const ang = m.az.n() * TAU;
  const R = Math.hypot(j.vistaW, j.vistaH) * 0.55;
  const sx = j.x + Math.cos(ang) * R, sy = j.y + Math.sin(ang) * R * 0.8;
  const tx = j.x + m.az.entre(-60, 60), ty = j.y + m.az.entre(-40, 40);
  const dir = Math.atan2(ty - sy, tx - sx);
  const c = Math.cos(dir), s = Math.sin(dir);
  const v = E.rapidez * E.vel;
  const vida = (Math.hypot(tx - sx, ty - sy) * 2.1) / v;
  for (let q = 0; q < cuantas; q++) {
    const lado = (q % 2 ? 1 : -1) * Math.ceil(q / 2) * 13;
    const atras = -m.az.n() * 70;
    const k = m.az.entre(0.9, 1.1);
    nuevoProy(m, j, slot, a.id, 0, sx + c * atras - s * lado, sy + s * atras + c * lado, c * v * k, s * v * k, E.radio * E.area, vida);
  }
}

/** Chancletas mojadas: al caminar dejan huellitas que pican; al frenar, salen todas disparadas. */
function chanclas(m: Motor, j: Jugador, a: ArmaJ, slot: number, dt: number) {
  const moviendo = Math.hypot(j.vx, j.vy) > 20;
  a.t -= dt;
  let n = 0;
  for (const p of m.pr) if (p.vivo && p.comp === 9 && p.dueno === j.i && p.slot === slot) n++;
  a.total = n;
  if (moviendo) {
    if (a.t > 0 || n >= 2 + E.cant * 3) return;
    a.tr -= dt * (1 + Math.max(0, j.st.movimiento));
    if (a.tr > 0) return;
    a.tr = E.inter;
    // (una huella de cada pie, un poquito atrás)
    a.k = a.k ? 0 : 1;
    const atras = Math.atan2(-j.dy, -j.dx), pie = a.k ? 6 : -6;
    const x = j.x + Math.cos(atras) * 12 - Math.sin(atras) * pie, y = j.y + Math.sin(atras) * 12 + Math.cos(atras) * pie;
    const p = nuevoProy(m, j, slot, a.id, 9, x, y, Math.cos(atras) * 8 * E.vel, Math.sin(atras) * 8 * E.vel, E.radio * E.area, E.dur + 1.5);
    if (p) {
      p.perfora = 999;
      p.golpeCada = E.golpeCada;
      p.ang = Math.atan2(j.dy, j.dx);
      p.n = E.rapidez * E.vel;
      p.ex = E.dano;
    }
    return;
  }
  if (n === 0 || j.quieto < 0.06) return;
  // Frenó: todas hacia donde mira (más fuertes mientras más tiempo llevaban en el piso)
  const dir = aMano(j) ?? Math.atan2(j.dy, j.dx);
  for (const p of m.pr) {
    if (!p.vivo || p.comp !== 9 || p.dueno !== j.i || p.slot !== slot) continue;
    p.comp = 10;
    p.dano = p.ex * (1 + Math.min(3, p.t));
    const ang = dir + (m.az.n() - 0.5) * 0.12;
    p.vx = Math.cos(ang) * p.n;
    p.vy = Math.sin(ang) * p.n;
    p.ang = ang;
    p.vida = 0.5 * Math.sqrt(E.area) + 0.22;
    p.golpeCada = 9;
    p.giro = a.id === 'pisoton' ? 1 : 0;
    p.gid.fill(0);
    p.gt.fill(0);
  }
  a.t = E.enfr;
  a.tr = 0;
}

/** Le quitaron vida: la plancha contraataca alrededor y las mariposas mandan otra bandada. */
export function alHerido(m: Motor, j: Jugador) {
  for (let slot = 0; slot < j.armas.length; slot++) {
    const a = j.armas[slot];
    const comp = ARMAS[a.id].comp;
    if (comp !== 'plancha' && comp !== 'mariposa') continue;
    if (m.tReal < a.k) continue;
    calcular(j, a);
    if (comp === 'plancha') {
      a.k = m.tReal + 0.6;
      const r = E.radio * E.area * 0.9, R = 44 * Math.sqrt(E.area);
      for (let q = 0; q < 6; q++) {
        const ang = (q / 6) * TAU;
        const x = j.x + Math.cos(ang) * R, y = j.y + Math.sin(ang) * R * 0.85;
        m.emitir('tajo', x, y, r, ang, 0, 3);
        circulo(m, j, slot, x, y, r, E.dano + (a.id === 'planchaDiva' ? a.k3 : 0), a.id, 1.2);
      }
    } else {
      const mariposario = a.id === 'mariposario';
      a.k = m.tReal + (mariposario ? 1 : 1.8);
      bandada(m, j, a, slot, E.cant);
      if (mariposario) m.curar(j, 3);
    }
  }
}

/** Cayó un mugroso: la plancha de diva y la sauna se calientan (sin tope de por vida, pero con tope por partida). */
export function alMatar(j: Jugador) {
  for (const a of j.armas) {
    if (a.id === 'planchaDiva') a.k3 = Math.min(60, a.k3 + 0.02);
    else if (a.id === 'sauna') a.k3 = Math.min(40, a.k3 + 0.01);
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
              golpeCada: p.golpeCada, hz: HZ_CHARCO + p.dueno, vx: 0, vy: 0, crece: inunda ? 1 : 0, lento: 0, dientes: 0, t: 0,
            });
            m.emitir('charco', p.ex, p.ey, p.r, p.n, 0, inunda ? 1 : 0);
          }
        }
        continue;
      }
      case 7:
        // Piedra pómez cayendo: al llegar, se parte
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ang += p.giro * dt;
        if (p.vida <= 0) {
          p.vivo = false;
          if (j) partir(m, j, p);
          continue;
        }
        break;
      case 8: {
        // Letra de espuma: sube, se frena y cae dando tumbos (a veces cambia de lado)
        p.vy += p.ay * dt;
        if (m.az.n() < dt * 2.5) p.vx = m.az.entre(-150, 150);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ang += p.giro * dt;
        if (j && p.vy > 0 && p.y > j.y + j.vistaH / 2 + 40) {
          // (el abecedario rebota una vez abajo antes de irse)
          if (p.n > 0) {
            p.n--;
            p.vy = -p.vy * 0.72;
            p.gid.fill(0);
            p.gt.fill(0);
          } else p.vivo = false;
        }
        if (!p.vivo) continue;
        break;
      }
      case 9: {
        // Huellita en el piso: se va quedando atrás despacito
        const k = 1 + 0.9 * dt;
        p.vx *= k;
        p.vy *= k;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        break;
      }
      case 10:
        // Chancla disparada: al final, el pisotón revienta en un charco
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.vida <= 0 && p.giro === 1) m.explotar(p.dueno, p.slot, p.arma, p.x, p.y, 44 * (p.r / 15), p.dano * 0.5, 0);
        break;
      case 11: {
        // Nubecita de vapor: se frena y se infla
        const f = Math.exp(-2.4 * dt);
        p.vx *= f;
        p.vy *= f;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r = p.n * (0.7 + 1.5 * Math.min(1, p.t / Math.max(0.05, p.ex)));
        break;
      }
    }
    if (p.vida <= 0) {
      p.vivo = false;
      if (j && !p.mini && COMP_LUCES.has(p.comp) && j.tieneCarta('lucesFeria')) m.explotar(p.dueno, p.slot, p.arma, p.x, p.y, 42, p.dano * 0.6, 5);
      continue;
    }
    if (!j) continue;
    choques(m, j, p);
  }
}

function choques(m: Motor, j: Jugador, p: Proyectil) {
  const n = m.rej.circulo(p.x, p.y, p.r + 48);
  for (let k = 0; k < n; k++) m.tmp[k] = m.rej.fuera[k];
  // (las letras de espuma solo pegan cayendo)
  if (p.comp === 8 && p.vy < 0) return;
  const hielo = p.arma === 'cubitos' || p.arma === 'granizada';
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
    // Cubitos: a los congelados les pegan el doble, y a veces congelan
    const congelado = hielo && (e.congelado > 0 || m.hielo > 0);
    golpe(m, j, p.slot, e, congelado ? p.dano * 2 : p.dano, p.crit, p.critX, kx * p.retro, ky * p.retro, p.arma);
    if (luz) continue;
    if (hielo && e.vivo && m.az.n() < p.ex * (1 + Math.max(0, j.st.suerte))) {
      if (e.def.congelable) e.congelado = Math.max(e.congelado, p.ey);
      else e.lento = Math.max(e.lento, p.ey);
    }
    // Rana glotona: lo que se traga lo escupe en gotas doradas
    if (!e.vivo && p.arma === 'ranaGlotona' && m.az.n() < 0.3) m.soltar('moneda', e.x, e.y);
    if (j.tieneCarta('diamante') && e.vivo && m.az.n() < 0.12) e.congelado = Math.max(e.congelado, 1.5);
    if (j.tieneCarta('fiestaDisfraces') && !p.mini && m.az.n() < 0.2 && (p.comp === 0 || p.comp === 2)) {
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
        if (j.tieneCarta('reboteSinFin') && p.n < 2 && (p.comp === 0)) {
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
        if (p.comp === 7) partir(m, j, p);
        if (!p.mini && j.tieneCarta('lucesFeria') && COMP_LUCES.has(p.comp)) m.explotar(p.dueno, p.slot, p.arma, p.x, p.y, 42, p.dano * 0.6, 5);
      }
    }
  }
}

/** La piedra pómez se parte en pedacitos (la mitad del daño); las calientes, además, revientan. */
function partir(m: Motor, j: Jugador, p: Proyectil) {
  const calientes = p.arma === 'piedrasCalientes';
  if (calientes) m.explotar(p.dueno, p.slot, p.arma, p.x, p.y, 40 * (p.r / 15), p.dano * 0.5, 1);
  else m.emitir('romper', p.x, p.y);
  const n = Math.max(1, Math.round(p.n));
  for (let q = 0; q < n; q++) {
    const c = libre(m);
    if (!c) return;
    const ang = (q / n) * TAU + m.az.n() * 0.8;
    const v = 260 + m.az.n() * 120;
    c.vivo = true;
    Object.assign(c, { dueno: p.dueno, slot: p.slot, arma: p.arma, comp: 0, x: p.x, y: p.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, ax: 0, ay: 0,
      r: p.r * 0.5, dano: p.dano * 0.5, crit: 0, critX: 2, perfora: calientes ? 2 : 1, vida: p.ex, t: 0, ang, giro: 0, golpeCada: 0.5, retro: 0.5, gi: 0,
      ex: 0, ey: 0, n: 0, mini: false });
    c.gid.fill(0);
    c.gt.fill(0);
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
    } else if (z.tipo === 2) {
      // La gota de mascarilla avanza despacito
      z.x += z.vx * dt;
      z.y += z.vy * dt;
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
      if (z.dientes && !e.jefe && !e.sinDientes && m.az.n() < z.dientes) e.sinDientes = true;
      golpe(m, j, z.slot, e, z.dano, E.crit * 0, 2, z.tipo === 1 ? 0 : e.x - z.x, z.tipo === 1 ? 1 : e.y - z.y, z.arma);
      if (z.crece && z.r < 160) z.r += 0.6;
    }
  }
}
