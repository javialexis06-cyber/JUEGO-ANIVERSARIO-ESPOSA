// Las armas en plena pelea: cada comportamiento (tajos, estocadas, látigos, proyectiles, frascos, órbitas, auras,
// ondas, cadenas, rayos, bumeranes, conos, zonas y torretas), el vuelo de los proyectiles y las zonas del piso.
import { ARMAS_LISTA } from '../datos/armas';
import { C, F, esSolida, tapaLuz } from '../tipos';
import { esJefe } from './catalogo';
import { ALI, MOV, Proyectil, S, ZONA, type Zona } from './estado';
import { BIT_ETQ, RADIO_JUGADOR, type ArmaJ, type Jugador } from './jugador';
import * as mec from './mecanicas';
import { Golpe } from './golpe';
import type { Sim } from './sim';

export const INDICE_ARMA: Record<string, number> = Object.fromEntries(ARMAS_LISTA.map((a, i) => [a.id, i]));

const GA = new Golpe();
const GP = new Golpe();
const GZ = new Golpe();
const LISTA: number[] = [];
const ORBES = new WeakMap<ArmaJ, Proyectil[]>();
const DOS_PI = Math.PI * 2;

const angDif = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= DOS_PI;
  while (d < -Math.PI) d += DOS_PI;
  return d;
};

/** Sustancia del alquimista según las etiquetas (1 veneno/ácido, 2 fuego, 4 hielo, 8 sagrado). */
function sustancia(etq: number) {
  return (etq & BIT_ETQ.veneno ? 1 : 0) | (etq & BIT_ETQ.fuego ? 2 : 0) | (etq & BIT_ETQ.hielo ? 4 : 0) | (etq & BIT_ETQ.sagrado ? 8 : 0);
}

/** Llena un golpe con los parámetros del arma. */
export function golpeDeArma(sim: Sim, g: Golpe, j: Jugador, a: ArmaJ, ranura: number, dx: number, dy: number) {
  const p = a.p;
  g.reset();
  g.j = j.i;
  g.ranura = ranura;
  g.etq = a.etq;
  g.critico = p.critico;
  g.empuje = p.empuje;
  g.dx = dx;
  g.dy = dy;
  g.quema = p.quema;
  g.veneno = p.veneno;
  g.sangrado = p.sangrado;
  g.lento = p.lento;
  g.aturde = p.aturde;
  g.maldicion = p.maldicion;
  g.flags = p.flags;
  g.sustancia = sustancia(a.etq);
  mec.modGolpe(sim, j, g);
  return g;
}

/** Cada cuadro: las armas del jugador cuentan su tiempo y atacan cuando toca. */
export function actualizarArmas(sim: Sim, j: Jugador, dt: number) {
  const cad = 1 + j.buffCad + mec.cadenciaExtra(sim, j);
  for (let k = 0; k < j.armas.length; k++) {
    const a = j.armas[k];
    if (a.sucio) a.calcular(j.st, j.multOtras(k));
    const tipo = a.def.tipo;
    if (tipo === 'orbita') {
      orbitar(sim, j, a, k, dt);
      continue;
    }
    if (a.repetir > 0) {
      a.repetirT -= dt;
      if (a.repetirT <= 0) {
        a.repetir--;
        a.repetirT = 0.2;
        atacar(sim, j, a, k, true);
      }
    }
    a.t -= dt * cad;
    if (a.t > 0) continue;
    if (atacar(sim, j, a, k, false)) {
      a.t = a.p.cadencia;
      if (a.p.flags & F.DOBLE) {
        a.repetir = 1;
        a.repetirT = 0.2;
      }
    } else a.t = 0.12;
  }
  // Órbitas de armas que ya no están (cambió el arma por una evolución)
}

/** Quita las órbitas de un arma (al evolucionarla o cambiarla). */
export function soltarOrbitas(a: ArmaJ) {
  const l = ORBES.get(a);
  if (l) for (const p of l) p.vivo = false;
  ORBES.delete(a);
}

function atacar(sim: Sim, j: Jugador, a: ArmaJ, k: number, eco: boolean): boolean {
  switch (a.def.tipo) {
    case 'barrido':
      return barrido(sim, j, a, k);
    case 'estocada':
    case 'latigo':
      return estocada(sim, j, a, k, eco);
    case 'proyectil':
      return proyectil(sim, j, a, k);
    case 'lanzado':
      return lanzado(sim, j, a, k);
    case 'bumeran':
      return bumeran(sim, j, a, k);
    case 'cono':
      return cono(sim, j, a, k);
    case 'onda':
      return onda(sim, j, a, k);
    case 'aura':
      return aura(sim, j, a, k);
    case 'cadena':
      return cadena(sim, j, a, k);
    case 'rayo':
      return rayo(sim, j, a, k);
    case 'zona':
      return zona(sim, j, a, k);
    case 'torreta':
      return torreta(sim, j, a, k);
    case 'trampa':
      return trampa(sim, j, a, k);
  }
  return false;
}

/** Dirección hacia el blanco (o hacia donde mira). Devuelve el ángulo o null si no hay blanco. */
function apuntar(sim: Sim, j: Jugador, a: ArmaJ, alcance: number): { ang: number; i: number; x: number; y: number } | null {
  const ap = a.def.apunta;
  const i = sim.blanco(j.x, j.y, alcance, ap === 'veta' ? 'denso' : ap === 'pie' ? 'cercano' : ap, j.fx, j.fy);
  if (i < 0) {
    if (ap === 'mira' && (Math.abs(j.vx) + Math.abs(j.vy) > 0.4)) return { ang: Math.atan2(j.fy, j.fx), i: -1, x: j.x + j.fx * 4, y: j.y + j.fy * 4 };
    return null;
  }
  const E = sim.E;
  // (hacia atrás: si el más cercano viene por delante, el golpe sale igual a la espalda)
  if (ap === 'atras' && (E.x[i] - j.x) * j.fx + (E.y[i] - j.y) * j.fy > 0) return { ang: Math.atan2(-j.fy, -j.fx), i: -1, x: j.x - j.fx * 3, y: j.y - j.fy * 3 };
  return { ang: Math.atan2(E.y[i] - j.y, E.x[i] - j.x), i, x: E.x[i], y: E.y[i] };
}

const codigo = (a: ArmaJ, j: Jugador) => INDICE_ARMA[a.id] * 8 + j.i;

// ------------------------------------------------------------------------------------------------- Cuerpo a cuerpo
function barrido(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  const b = apuntar(sim, j, a, Math.max(p.alcance, p.area + 0.5));
  if (!b) return false;
  const gira = !!(p.flags & F.GIRA) || p.arco >= 6;
  const golpes: number[] = [b.ang];
  for (let n = 1; n < p.cantidad; n++) golpes.push(b.ang + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * Math.min(p.arco * 0.7, 1.2));
  if (p.flags & F.DETRAS) golpes.push(b.ang + Math.PI);
  const E = sim.E;
  const ya = new Set<number>();
  for (const ang of golpes) {
    sim.suc.push(S.TAJO, j.x, j.y, ang, p.area, gira ? DOS_PI : p.arco, codigo(a, j));
    sim.enRadio(j.x, j.y, p.area, LISTA);
    for (const i of LISTA) {
      if (ya.has(i) || !E.vivo[i]) continue;
      const ai = Math.atan2(E.y[i] - j.y, E.x[i] - j.x);
      if (!gira && Math.abs(angDif(ai, ang)) > p.arco / 2 + 0.25) continue;
      ya.add(i);
      golpeDeArma(sim, GA, j, a, k, Math.cos(ai), Math.sin(ai));
      sim.danar(i, p.dano, GA);
    }
  }
  return true;
}

function estocada(sim: Sim, j: Jugador, a: ArmaJ, k: number, eco: boolean): boolean {
  const p = a.p;
  const b = apuntar(sim, j, a, p.alcance + 0.5);
  if (!b) return false;
  const latigo = a.def.tipo === 'latigo';
  if (latigo && !eco) a.lado = -a.lado;
  const golpes: number[] = [];
  const base = b.ang + (latigo ? a.lado * 0.22 : 0);
  for (let n = 0; n < p.cantidad; n++) golpes.push(base + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * (latigo ? 0.5 : 0.35));
  if (p.flags & F.DETRAS) golpes.push(base + Math.PI);
  if (p.flags & F.GIRA) golpes.push(base + Math.PI / 2, base - Math.PI / 2);
  const E = sim.E;
  const ya = new Set<number>();
  for (const ang of golpes) {
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const largo = p.alcance, ancho = p.area;
    sim.suc.push(S.ESTOCADA, j.x, j.y, ang, largo, ancho, codigo(a, j));
    sim.enRadio(j.x + ux * largo * 0.5, j.y + uy * largo * 0.5, largo * 0.5 + ancho, LISTA);
    for (const i of LISTA) {
      if (ya.has(i) || !E.vivo[i]) continue;
      const dx = E.x[i] - j.x, dy = E.y[i] - j.y;
      const t = dx * ux + dy * uy;
      if (t < -0.3 || t > largo + E.r[i]) continue;
      const perp = Math.abs(dx * uy - dy * ux);
      if (perp > ancho / 2 + E.r[i]) continue;
      ya.add(i);
      golpeDeArma(sim, GA, j, a, k, ux, uy);
      sim.danar(i, p.dano, GA);
    }
  }
  return true;
}

function cono(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  const b = apuntar(sim, j, a, p.alcance + 0.3);
  if (!b) return false;
  // (la lanza de fuego da vueltas: cada chorro sale un poco más girado que el anterior)
  if (p.flags & F.GIRA) a.giro += 0.75;
  const angs = [p.flags & F.GIRA ? a.giro : b.ang];
  for (let n = 1; n < p.cantidad; n++) angs.push(b.ang + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * p.arco * 0.8);
  if (p.flags & F.DETRAS) angs.push(angs[0] + Math.PI);
  const E = sim.E;
  const ya = new Set<number>();
  for (const ang of angs) {
    sim.suc.push(S.CONO, j.x, j.y, ang, p.alcance, p.arco, codigo(a, j));
    sim.enRadio(j.x, j.y, p.alcance, LISTA);
    for (const i of LISTA) {
      if (ya.has(i) || !E.vivo[i]) continue;
      const ai = Math.atan2(E.y[i] - j.y, E.x[i] - j.x);
      if (Math.abs(angDif(ai, ang)) > p.arco / 2 + 0.15) continue;
      ya.add(i);
      golpeDeArma(sim, GA, j, a, k, Math.cos(ai), Math.sin(ai));
      sim.danar(i, p.dano, GA);
    }
    if (p.flags & F.CHARCO) ponerZona(sim, j, a, k, j.x + Math.cos(ang) * p.alcance * 0.6, j.y + Math.sin(ang) * p.alcance * 0.6, 1.1, p.dano * 1.5, Math.max(1.5, p.duracion));
  }
  return true;
}

function onda(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  // Solo si hay alguien cerca (no golpear el aire)
  const b = apuntar(sim, j, a, p.area + 0.5);
  if (!b) return false;
  sim.suc.push(S.ONDA, j.x, j.y, p.area, codigo(a, j));
  sim.enRadio(j.x, j.y, p.area, LISTA);
  const E = sim.E;
  for (const i of LISTA) {
    const dx = E.x[i] - j.x, dy = E.y[i] - j.y;
    const l = Math.hypot(dx, dy) || 1;
    golpeDeArma(sim, GA, j, a, k, dx / l, dy / l);
    sim.danar(i, p.dano, GA);
  }
  return true;
}

function aura(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  const E = sim.E;
  sim.enRadio(j.x, j.y, p.area, LISTA);
  for (const i of LISTA) {
    const dx = E.x[i] - j.x, dy = E.y[i] - j.y;
    const l = Math.hypot(dx, dy) || 1;
    golpeDeArma(sim, GA, j, a, k, dx / l, dy / l);
    GA.callado = sim.az.n() > 0.2;
    GA.empuje = 0.3;
    sim.danar(i, p.dano, GA);
  }
  // Curar y animar a los aliados que estén dentro
  for (const o of sim.J) {
    if (o.estado !== 0 || (o.x - j.x) ** 2 + (o.y - j.y) ** 2 > p.area * p.area) continue;
    if (p.flags & F.CURA) sim.curar(o, (o === j ? 0.5 : 1) * (0.6 + p.dano * 0.12) * (j.spec === 1 && j.clase === 'inquisidor' ? 2 : 1), true);
    if (a.id === 'estandarte') o.m.animoT = 0.7;
  }
  return true;
}

function cadena(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  const b = apuntar(sim, j, a, p.alcance);
  if (!b) return false;
  const E = sim.E;
  const ya = new Set<number>();
  let x = j.x, y = j.y, i = b.i;
  for (let n = 0; n < p.cantidad && i >= 0; n++) {
    ya.add(i);
    sim.suc.push(S.CADENA, x, y, E.x[i], E.y[i], codigo(a, j));
    const dx = E.x[i] - x, dy = E.y[i] - y;
    const l = Math.hypot(dx, dy) || 1;
    x = E.x[i];
    y = E.y[i];
    golpeDeArma(sim, GA, j, a, k, dx / l, dy / l);
    sim.danar(i, p.dano, GA);
    // El siguiente: el más cercano que no haya tocado
    let sig = -1, md = p.area * p.area;
    sim.enRadio(x, y, p.area, LISTA);
    for (const o of LISTA) {
      if (ya.has(o) || !E.vivo[o]) continue;
      const d = (E.x[o] - x) ** 2 + (E.y[o] - y) ** 2;
      if (d < md) {
        md = d;
        sig = o;
      }
    }
    i = sig;
  }
  return true;
}

// ------------------------------------------------------------------------------------------------- Proyectiles
function salirProyectil(sim: Sim, j: Jugador, a: ArmaJ, k: number, ang: number, mov: number): Proyectil | null {
  const p = a.p;
  const pr = sim.nuevoProyectil();
  if (!pr) return null;
  pr.dueno = j.i;
  pr.ranura = k;
  pr.arma = INDICE_ARMA[a.id];
  pr.mov = mov;
  pr.x = j.x + Math.cos(ang) * 0.35;
  pr.y = j.y + Math.sin(ang) * 0.35;
  pr.z = 0.65;
  pr.ang = ang;
  pr.vx = Math.cos(ang) * p.vel;
  pr.vy = Math.sin(ang) * p.vel;
  pr.r = (0.22 + (a.def.tipo === 'bumeran' ? 0.15 : 0)) * (p.flags & F.GORDA ? 2.2 : 1);
  pr.dano = p.dano;
  pr.perfora = p.perfora;
  pr.rebotes = p.rebotes + (j.tiene('rebote') ? 1 : 0);
  pr.flags = p.flags | (j.tiene('rebote') ? F.REBOTA : 0);
  pr.vida = (p.alcance * 1.35) / Math.max(1, p.vel);
  pr.area = p.area;
  pr.quema = p.quema;
  pr.veneno = p.veneno;
  pr.sangrado = p.sangrado;
  pr.lento = p.lento;
  pr.aturde = p.aturde;
  pr.maldicion = p.maldicion;
  pr.critico = p.critico;
  pr.empuje = p.empuje;
  pr.duracion = p.duracion;
  pr.etq = a.etq;
  pr.blanco = -1;
  pr.mini = false;
  return pr;
}

function proyectil(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  const espiral = !!(p.flags & F.ESPIRAL);
  const b = apuntar(sim, j, a, p.alcance);
  if (!b && !espiral) return false;
  const n = p.cantidad;
  if (espiral) {
    if (!b) return false;
    a.giro += 0.45;
    for (let s = 0; s < n; s++) salirProyectil(sim, j, a, k, a.giro + (s / n) * DOS_PI, MOV.RECTO);
    return true;
  }
  const abanico = n > 1 ? Math.min(p.arco, 0.16 * (n - 1) + 0.12) : 0;
  // (a dos manos: la misma ráfaga sale también hacia atrás)
  for (const atras of p.flags & F.DETRAS ? [0, Math.PI] : [0]) {
    for (let s = 0; s < n; s++) {
      const ang = b!.ang + atras + (n > 1 ? -abanico / 2 + (abanico * s) / (n - 1) : 0);
      const pr = salirProyectil(sim, j, a, k, ang, MOV.RECTO);
      if (pr && p.flags & F.TELEDIRIGIDO && !atras) pr.blanco = b!.i;
    }
  }
  return true;
}

function bumeran(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  const b = apuntar(sim, j, a, p.alcance);
  if (!b) return false;
  // (a dos manos: otra tanda hacia atrás)
  const n = p.cantidad * (p.flags & F.DETRAS ? 2 : 1);
  for (let s = 0; s < n; s++) {
    const atras = s >= p.cantidad ? Math.PI : 0;
    const q = s % p.cantidad;
    const pr = salirProyectil(sim, j, a, k, b.ang + atras + (q - (p.cantidad - 1) / 2) * 0.4, MOV.BUMERAN);
    if (!pr) break;
    pr.perfora = 999;
    pr.ref = p.alcance;
    pr.vida = 4;
    pr.x0 = j.x;
    pr.y0 = j.y;
  }
  return true;
}

/** La veta (hierro, oro, sangre) más cercana con un lado abierto, a menos de `alcance` (o null). */
function vetaCercana(sim: Sim, j: Jugador, alcance: number): { ang: number; i: number; x: number; y: number } | null {
  const m = sim.mapa;
  let mejor: { x: number; y: number } | null = null, md = alcance * alcance;
  const x0 = Math.floor(j.x - alcance), x1 = Math.ceil(j.x + alcance), y0 = Math.floor(j.y - alcance), y1 = Math.ceil(j.y + alcance);
  for (let cy = y0; cy <= y1; cy++)
    for (let cx = x0; cx <= x1; cx++) {
      const t = m.get(cx, cy);
      if (t !== C.HIERRO && t !== C.ORO && t !== C.SANGRE && t !== C.MINERAL) continue;
      const d = (cx + 0.5 - j.x) ** 2 + (cy + 0.5 - j.y) ** 2;
      if (d >= md || !m.expuesta(cx, cy)) continue;
      md = d;
      mejor = { x: cx + 0.5, y: cy + 0.5 };
    }
  return mejor ? { ang: Math.atan2(mejor.y - j.y, mejor.x - j.x), i: -1, x: mejor.x, y: mejor.y } : null;
}

function lanzado(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  // (la carga minera va a la veta; si no hay ninguna cerca, al montón de enemigos)
  const b = (a.def.apunta === 'veta' ? vetaCercana(sim, j, p.alcance) : null) ?? apuntar(sim, j, a, p.alcance);
  if (!b) return false;
  // (a dos manos: la misma tanda cae también del otro lado, a la misma distancia)
  const n = p.cantidad * (p.flags & F.DETRAS ? 2 : 1);
  for (let s = 0; s < n; s++) {
    const atras = s >= p.cantidad;
    const bx = atras ? 2 * j.x - b.x : b.x, by = atras ? 2 * j.y - b.y : b.y;
    const pr = salirProyectil(sim, j, a, k, atras ? b.ang + Math.PI : b.ang, MOV.LANZADO);
    if (!pr) break;
    const dispersion = s % p.cantidad === 0 ? 0 : 1.2 + p.area * 0.4;
    const ax = sim.az.entre(-1, 1) * dispersion, ay = sim.az.entre(-1, 1) * dispersion;
    pr.x0 = j.x;
    pr.y0 = j.y;
    pr.x1 = bx + ax;
    pr.y1 = by + ay;
    const dist = Math.hypot(pr.x1 - j.x, pr.y1 - j.y);
    pr.vida = Math.min(0.85, Math.max(0.35, dist / 10)) + (s % p.cantidad) * 0.08;
  }
  return true;
}

function rayo(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  const b = apuntar(sim, j, a, p.alcance);
  if (!b) return false;
  const E = sim.E;
  const elegidos = [b.i];
  for (let s = 1; s < p.cantidad; s++) {
    const i = sim.blanco(j.x, j.y, p.alcance, s % 2 ? 'azar' : a.def.apunta);
    if (i >= 0) elegidos.push(i);
  }
  elegidos.forEach((i, s) => {
    const pr = salirProyectil(sim, j, a, k, 0, MOV.CAE);
    if (!pr) return;
    // Cae donde va a estar (un poquito adelante)
    pr.x = E.x[i] + E.vx[i] * 0.3 + (s ? sim.az.entre(-0.4, 0.4) : 0);
    pr.y = E.y[i] + E.vy[i] * 0.3 + (s ? sim.az.entre(-0.4, 0.4) : 0);
    pr.vida = 0.42 + s * 0.09;
    pr.z = 6;
  });
  return true;
}

function zona(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  const b = apuntar(sim, j, a, p.alcance);
  if (!b) return false;
  // (el humo sale donde estás parado; a dos manos, otra nube detrás)
  const pie = a.def.apunta === 'pie';
  const cx = pie ? j.x : b.x, cy = pie ? j.y : b.y;
  for (let s = 0; s < p.cantidad; s++) {
    const ox = s ? sim.az.entre(-2, 2) : 0, oy = s ? sim.az.entre(-2, 2) : 0;
    ponerZona(sim, j, a, k, cx + ox, cy + oy, p.area, p.dano, p.duracion);
  }
  if (p.flags & F.DETRAS) ponerZona(sim, j, a, k, j.x - j.fx * (p.area + 0.8), j.y - j.fy * (p.area + 0.8), p.area, p.dano, p.duracion);
  return true;
}

function torreta(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  // (la ballesta de pie solo se arma con el jugador quieto un momento)
  if (a.def.quieto && j.quietoT < 0.6) return false;
  let cuantas = 0;
  for (const al of sim.A) if (al.vivo && al.tipo === ALI.TORRETA && al.dueno === j.i && al.b === k) cuantas++;
  if (cuantas >= p.cantidad) return true;
  const pos = sim.mapa.abiertaCerca(j.x + j.fx * 1.3, j.y + j.fy * 1.3, 2);
  if (!pos) return false;
  ponerTorreta(sim, j, pos.x, pos.y, p.dano, p.duracion, k, a.p.quema);
  return true;
}

/** Trampas (abrojos, cepos): se riegan alrededor y se quedan en el piso hasta que alguien las pisa. */
function trampa(sim: Sim, j: Jugador, a: ArmaJ, k: number): boolean {
  const p = a.p;
  if (sim.blanco(j.x, j.y, p.alcance, 'cercano') < 0) return false;
  const n = p.cantidad * (p.flags & F.DETRAS ? 2 : 1);
  const atrasAng = Math.atan2(-j.fy, -j.fx);
  for (let s = 0; s < n; s++) {
    const atras = s >= p.cantidad;
    const ang = atras ? atrasAng + sim.az.entre(-0.7, 0.7) : sim.az.entre(0, DOS_PI);
    const dist = atras ? sim.az.entre(0.9, 2) : p.cantidad > 1 ? sim.az.entre(0.6, 2) : 0.9;
    const x = j.x + Math.cos(ang) * dist, y = j.y + Math.sin(ang) * dist;
    if (tapaLuz(sim.mapa.get(Math.floor(x), Math.floor(y)))) continue;
    const pr = salirProyectil(sim, j, a, k, ang, MOV.TRAMPA);
    if (!pr) break;
    pr.x = x;
    pr.y = y;
    pr.z = 0.04;
    pr.vx = pr.vy = 0;
    pr.vida = Math.max(2, p.duracion);
    pr.r = (0.3 + p.area * 0.35) * (p.flags & F.GORDA ? 1.8 : 1);
  }
  return true;
}

/** Una trampa en el piso: pica (o se cierra) a los que la pisan. */
function moverTrampa(sim: Sim, pr: Proyectil) {
  if (pr.t >= pr.vida) {
    pr.vivo = false;
    return;
  }
  const E = sim.E;
  sim.enRadio(pr.x, pr.y, pr.r, LISTA);
  // (a lo sumo tres por cuadro: un montón encima no la gasta de un tirón)
  let golpes = 0;
  for (const i of LISTA) {
    if (!E.vivo[i] || pr.yaGolpeo(E.uid[i], sim.t)) continue;
    if (++golpes > 3) break;
    pr.anotar(E.uid[i], sim.t + 0.7);
    golpeProyectil(sim, pr, GP, 0, 0);
    sim.danar(i, pr.dano, GP);
    if (pr.flags & F.EXPLOTA) {
      explotar(sim, pr);
      pr.vivo = false;
      return;
    }
    pr.perfora--;
    if (pr.perfora <= 0) {
      pr.vivo = false;
      return;
    }
  }
}

export function ponerTorreta(sim: Sim, j: Jugador, x: number, y: number, dano: number, vida: number, ranura: number, quema = 0) {
  const al = sim.nuevoAliado();
  if (!al) return;
  al.tipo = ALI.TORRETA;
  al.dueno = j.i;
  al.x = x;
  al.y = y;
  al.hp = al.hpMax = 1;
  al.dano = dano * mec.multConstruccion(j);
  al.vida = vida + 8 * j.don('remaches');
  al.b = ranura;
  al.a = quema;
  al.r = 0.4;
  sim.suc.push(S.INVOCA, x, y, ALI.TORRETA);
}

/** Pone una zona de un arma en el piso. */
export function ponerZona(sim: Sim, j: Jugador, a: ArmaJ, k: number, x: number, y: number, r: number, dps: number, dur: number): Zona | null {
  const z = sim.nuevaZona();
  if (!z) return null;
  const etq = a.etq;
  z.tipo = etq & BIT_ETQ.fuego ? ZONA.FUEGO : etq & BIT_ETQ.hielo ? ZONA.HIELO : etq & BIT_ETQ.sagrado ? ZONA.SAGRADA : a.p.lento > 0 && etq & BIT_ETQ.veneno ? ZONA.PANTANO : etq & BIT_ETQ.veneno ? ZONA.ACIDO : ZONA.SOMBRA;
  z.dueno = j.i;
  z.ranura = k;
  z.x = x;
  z.y = y;
  z.r = r;
  z.dps = dps;
  z.vida = z.total = Math.max(0.8, dur);
  z.lento = a.p.lento;
  z.veneno = a.p.veneno;
  z.quema = a.p.quema;
  z.maldicion = a.p.maldicion;
  z.cura = a.p.flags & F.CURA ? 1 : 0;
  z.etq = etq;
  z.arma = INDICE_ARMA[a.id];
  return z;
}

// ------------------------------------------------------------------------------------------------- Órbitas
function orbitar(sim: Sim, j: Jugador, a: ArmaJ, k: number, dt: number) {
  const p = a.p;
  let l = ORBES.get(a);
  if (!l) ORBES.set(a, (l = []));
  // Ajustar la cantidad de orbes
  for (let s = l.length - 1; s >= 0; s--) if (!l[s].vivo) l.splice(s, 1);
  while (l.length < p.cantidad) {
    const pr = salirProyectil(sim, j, a, k, 0, MOV.ORBITA);
    if (!pr) break;
    pr.vida = 1e9;
    pr.perfora = 9999;
    l.push(pr);
  }
  while (l.length > p.cantidad) l.pop()!.vivo = false;
  a.giro += p.vel * dt * (1 + j.buffCad * 0.5);
  const E = sim.E;
  const persigue = !!(p.flags & F.PERSIGUE);
  for (let s = 0; s < l.length; s++) {
    const pr = l[s];
    const ang = a.giro + (s / l.length) * DOS_PI;
    let r = p.area;
    if (persigue) r *= 1 + 0.55 * Math.max(0, Math.sin(sim.t * 3.1 + s * 2.1));
    pr.x = j.x + Math.cos(ang) * r;
    pr.y = j.y + Math.sin(ang) * r;
    pr.ang = ang + Math.PI / 2;
    pr.z = 0.7;
    if (j.estado !== 0) continue;
    sim.enRadio(pr.x, pr.y, 0.42, LISTA);
    for (const i of LISTA) {
      const hz = i * 8 + k;
      if (E.hz[hz] > sim.t) continue;
      E.hz[hz] = sim.t + p.cadencia;
      golpeDeArma(sim, GA, j, a, k, Math.cos(ang + Math.PI / 2), Math.sin(ang + Math.PI / 2));
      GA.callado = sim.az.n() > 0.35;
      sim.danar(i, p.dano, GA);
    }
  }
}

// ------------------------------------------------------------------------------------------------- Vuelo
/** Mueve los proyectiles (si `soloJugadores`, los de los enemigos se quedan quietos: tiempo detenido). */
export function moverProyectiles(sim: Sim, dt: number, soloJugadores: boolean) {
  for (const pr of sim.P) {
    if (!pr.vivo || pr.mov === MOV.ORBITA) continue;
    if (pr.mov === MOV.ENEMIGO) {
      if (!soloJugadores) moverEnemigo(sim, pr, dt);
      continue;
    }
    pr.t += dt;
    switch (pr.mov) {
      case MOV.RECTO:
      case MOV.TORRETA:
        moverRecto(sim, pr, dt);
        break;
      case MOV.LANZADO:
        if (pr.t >= pr.vida) {
          caer(sim, pr);
          pr.vivo = false;
        } else {
          const u = pr.t / pr.vida;
          pr.x = pr.x0 + (pr.x1 - pr.x0) * u;
          pr.y = pr.y0 + (pr.y1 - pr.y0) * u;
          pr.z = 0.6 + 4 * u * (1 - u) * (1.2 + Math.hypot(pr.x1 - pr.x0, pr.y1 - pr.y0) * 0.18);
          pr.ang += dt * 12;
        }
        break;
      case MOV.BUMERAN:
        moverBumeran(sim, pr, dt);
        break;
      case MOV.TRAMPA:
        moverTrampa(sim, pr);
        break;
      case MOV.CAE:
        pr.z = Math.max(0, 6 * (1 - pr.t / pr.vida));
        if (pr.t >= pr.vida) {
          impactoRayo(sim, pr);
          pr.vivo = false;
        }
        break;
    }
  }
}

function jugadorDe(sim: Sim, pr: Proyectil): Jugador | null {
  return pr.dueno >= 0 ? sim.J[pr.dueno] ?? null : null;
}

/** Llena el golpe de un proyectil (sus parámetros quedaron guardados al disparar). */
function golpeProyectil(sim: Sim, pr: Proyectil, g: Golpe, dx: number, dy: number) {
  g.reset();
  g.j = pr.dueno;
  g.ranura = pr.aliado ? -1 : pr.ranura;
  g.aliado = pr.aliado;
  g.etq = pr.etq;
  g.critico = pr.critico;
  g.empuje = pr.empuje;
  g.dx = dx;
  g.dy = dy;
  g.quema = pr.quema;
  g.veneno = pr.veneno;
  g.sangrado = pr.sangrado;
  g.lento = pr.lento;
  g.aturde = pr.aturde;
  g.maldicion = pr.maldicion;
  g.flags = pr.flags;
  g.sustancia = sustancia(pr.etq);
  const j = jugadorDe(sim, pr);
  if (j) mec.modGolpe(sim, j, g);
  return g;
}

function moverRecto(sim: Sim, pr: Proyectil, dt: number) {
  const E = sim.E;
  if (pr.t >= pr.vida) {
    if (pr.flags & F.EXPLOTA) explotar(sim, pr);
    pr.vivo = false;
    return;
  }
  // Teledirigido: gira hacia su blanco (o busca otro)
  if (pr.flags & F.TELEDIRIGIDO) {
    if (pr.blanco < 0 || !E.vivo[pr.blanco]) pr.blanco = sim.blanco(pr.x, pr.y, 6, 'cercano');
    if (pr.blanco >= 0) {
      const v = Math.hypot(pr.vx, pr.vy);
      const deseado = Math.atan2(E.y[pr.blanco] - pr.y, E.x[pr.blanco] - pr.x);
      const actual = Math.atan2(pr.vy, pr.vx);
      const giro = Math.max(-7 * dt, Math.min(7 * dt, angDif(deseado, actual)));
      pr.vx = Math.cos(actual + giro) * v;
      pr.vy = Math.sin(actual + giro) * v;
    }
  }
  const nx = pr.x + pr.vx * dt, ny = pr.y + pr.vy * dt;
  const celda = sim.mapa.get(Math.floor(nx), Math.floor(ny));
  if (tapaLuz(celda) && !(pr.flags & F.FANTASMA)) {
    if (pr.flags & F.EXCAVA && (celda === C.BLANDA || celda === C.ESCOMBRO)) {
      const roto = sim.mapa.excavar(Math.floor(nx), Math.floor(ny), 99);
      if (roto >= 0) sim.alRomper(Math.floor(nx), Math.floor(ny), roto, jugadorDe(sim, pr));
    }
    if (pr.flags & F.REBOTA && pr.rebotes > 0) {
      pr.rebotes--;
      // Rebote: se invierte el eje que choca
      const cx = Math.floor(pr.x), cy = Math.floor(pr.y);
      if (Math.floor(nx) !== cx && tapaLuz(sim.mapa.get(Math.floor(nx), cy))) pr.vx = -pr.vx;
      else if (Math.floor(ny) !== cy && tapaLuz(sim.mapa.get(cx, Math.floor(ny)))) pr.vy = -pr.vy;
      else {
        pr.vx = -pr.vx;
        pr.vy = -pr.vy;
      }
      pr.ang = Math.atan2(pr.vy, pr.vx);
      return;
    }
    if (pr.flags & F.EXPLOTA) explotar(sim, pr);
    pr.vivo = false;
    return;
  }
  pr.x = nx;
  pr.y = ny;
  pr.ang = Math.atan2(pr.vy, pr.vx);
  // ¿Le pegó a alguien?
  sim.enRadio(pr.x, pr.y, pr.r, LISTA);
  for (const i of LISTA) {
    if (!E.vivo[i] || pr.yaGolpeo(E.uid[i], sim.t)) continue;
    pr.anotar(E.uid[i], sim.t + 10);
    const v = Math.hypot(pr.vx, pr.vy) || 1;
    golpeProyectil(sim, pr, GP, pr.vx / v, pr.vy / v);
    if (pr.flags & F.ATRAE) {
      const j = jugadorDe(sim, pr);
      if (j) {
        const dx = j.x - E.x[i], dy = j.y - E.y[i];
        const l = Math.hypot(dx, dy) || 1;
        GP.dx = dx / l;
        GP.dy = dy / l;
        GP.empuje = Math.min(14, l * 2.2);
      }
    }
    if (pr.flags & F.MARCA) E.marca[i] = Math.max(E.marca[i], 5);
    sim.danar(i, pr.dano, GP);
    if (pr.flags & F.ENCANTA && E.vivo[i]) mec.encantar(sim, pr, i);
    if (pr.flags & F.EXPLOTA) {
      explotar(sim, pr);
      pr.vivo = false;
      return;
    }
    if (pr.flags & F.DIVIDE && !pr.mini) dividir(sim, pr);
    if (pr.flags & F.SALTA && pr.rebotes > 0) {
      pr.rebotes--;
      const sig = sim.blanco(pr.x, pr.y, 5, 'cercano');
      if (sig >= 0 && sig !== i) {
        const d = Math.atan2(E.y[sig] - pr.y, E.x[sig] - pr.x);
        pr.vx = Math.cos(d) * v;
        pr.vy = Math.sin(d) * v;
        pr.t = Math.min(pr.t, pr.vida * 0.4);
        continue;
      }
    }
    pr.perfora--;
    if (pr.perfora <= 0) {
      pr.vivo = false;
      return;
    }
  }
}

function moverBumeran(sim: Sim, pr: Proyectil, dt: number) {
  const j = jugadorDe(sim, pr);
  if (!j || pr.t > pr.vida) {
    pr.vivo = false;
    return;
  }
  const v = Math.hypot(pr.vx, pr.vy) || 1;
  if (!pr.vuelta) {
    if (Math.hypot(pr.x - pr.x0, pr.y - pr.y0) >= pr.ref) pr.vuelta = true;
  }
  if (pr.vuelta) {
    const dx = j.x - pr.x, dy = j.y - pr.y;
    const l = Math.hypot(dx, dy);
    if (l < 0.6) {
      pr.vivo = false;
      return;
    }
    const vel = Math.max(v, 9);
    pr.vx = (dx / l) * vel;
    pr.vy = (dy / l) * vel;
  }
  const nx = pr.x + pr.vx * dt, ny = pr.y + pr.vy * dt;
  const cx = Math.floor(nx), cy = Math.floor(ny);
  const celda = sim.mapa.get(cx, cy);
  if (tapaLuz(celda)) {
    if (pr.flags & F.EXCAVA && (celda === C.BLANDA || celda === C.ESCOMBRO)) {
      const roto = sim.mapa.excavar(cx, cy, 99);
      if (roto >= 0) sim.alRomper(cx, cy, roto, j);
    } else if (!pr.vuelta) pr.vuelta = true;
  }
  pr.x = nx;
  pr.y = ny;
  pr.ang += dt * 16;
  const E = sim.E;
  sim.enRadio(pr.x, pr.y, pr.r, LISTA);
  for (const i of LISTA) {
    if (!E.vivo[i] || pr.yaGolpeo(E.uid[i], sim.t)) continue;
    pr.anotar(E.uid[i], sim.t + 0.45);
    golpeProyectil(sim, pr, GP, pr.vx / v, pr.vy / v);
    sim.danar(i, pr.dano, GP);
    if (pr.flags & F.SALTA && pr.rebotes > 0 && !pr.vuelta) {
      pr.rebotes--;
      const sig = sim.blanco(pr.x, pr.y, 5, 'cercano');
      if (sig >= 0 && sig !== i) {
        const d = Math.atan2(E.y[sig] - pr.y, E.x[sig] - pr.x);
        pr.vx = Math.cos(d) * v;
        pr.vy = Math.sin(d) * v;
      }
    }
  }
}

/** Un frasco, bomba o hacha cae: explota, deja charco o golpea donde cae. */
function caer(sim: Sim, pr: Proyectil) {
  const j = jugadorDe(sim, pr);
  if (pr.flags & F.EXPLOTA || pr.flags & F.CHARCO) {
    if (pr.flags & F.EXPLOTA) explotar(sim, pr);
    else impactoArea(sim, pr, pr.area * 0.7, pr.dano);
    if (pr.flags & F.CHARCO && j) {
      const a = j.armas[pr.ranura];
      if (a) ponerZona(sim, j, a, pr.ranura, pr.x1, pr.y1, pr.area * 0.95, pr.dano * 0.9 + (pr.quema + pr.veneno) * 0.5, pr.duracion || 2.5);
    }
  } else impactoArea(sim, pr, Math.max(0.8, pr.area), pr.dano);
  if (pr.flags & F.DIVIDE && !pr.mini) {
    for (let s = 0; s < 3; s++) {
      const a = (s / 3) * DOS_PI + sim.az.n();
      const x = pr.x1 + Math.cos(a) * pr.area * 0.9, y = pr.y1 + Math.sin(a) * pr.area * 0.9;
      golpeProyectil(sim, pr, GP, 0, 0);
      sim.explosion(x, y, pr.area * 0.5, pr.dano * 0.45, GP, claseExplosion(pr.etq));
    }
  }
}

/** Golpe en área sin explosión grande (el hacha que cae, el frasco que salpica). */
function impactoArea(sim: Sim, pr: Proyectil, r: number, dano: number) {
  const E = sim.E;
  sim.suc.push(S.EXPLOSION, pr.x1 || pr.x, pr.y1 || pr.y, r, 6);
  sim.enRadio(pr.x1 || pr.x, pr.y1 || pr.y, r, LISTA);
  for (const i of LISTA) {
    const dx = E.x[i] - pr.x, dy = E.y[i] - pr.y;
    const l = Math.hypot(dx, dy) || 1;
    golpeProyectil(sim, pr, GP, dx / l, dy / l);
    sim.danar(i, dano, GP);
  }
}

const claseExplosion = (etq: number) => (etq & BIT_ETQ.sagrado ? 1 : etq & BIT_ETQ.veneno ? 2 : etq & BIT_ETQ.hielo ? 3 : etq & BIT_ETQ.sangre ? 4 : etq & BIT_ETQ.sombra ? 5 : 0);

function explotar(sim: Sim, pr: Proyectil) {
  const j = jugadorDe(sim, pr);
  const x = pr.mov === MOV.LANZADO ? pr.x1 : pr.x, y = pr.mov === MOV.LANZADO ? pr.y1 : pr.y;
  let r = Math.max(0.9, pr.area);
  if (j && j.clase === 'alquimista' && j.spec === 1) r *= 1.3;
  golpeProyectil(sim, pr, GP, 0, 0);
  GP.empuje = Math.max(GP.empuje, 3);
  sim.explosion(x, y, r, pr.dano, GP, claseExplosion(pr.etq));
  if (pr.flags & F.EXCAVA || (j && j.clase === 'alquimista' && j.spec === 1)) sim.romperParedes(x, y, r * 0.75, j, false, !!(pr.flags & F.MINA));
}

function dividir(sim: Sim, pr: Proyectil) {
  for (const s of [-0.5, 0.5]) {
    const n = sim.nuevoProyectil();
    if (!n) return;
    const ang = Math.atan2(pr.vy, pr.vx) + s;
    const v = Math.hypot(pr.vx, pr.vy);
    Object.assign(n, {
      dueno: pr.dueno, ranura: pr.ranura, arma: pr.arma, mov: MOV.RECTO, x: pr.x, y: pr.y, z: pr.z, ang, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
      r: pr.r * 0.8, dano: pr.dano * 0.5, perfora: 1, rebotes: 0, flags: pr.flags & ~F.DIVIDE, vida: pr.vida * 0.5, area: pr.area * 0.6,
      quema: pr.quema, veneno: pr.veneno, sangrado: pr.sangrado, lento: pr.lento, aturde: 0, maldicion: pr.maldicion, critico: pr.critico,
      empuje: pr.empuje * 0.5, etq: pr.etq, mini: true, blanco: -1,
    });
    for (let k = 0; k < 8; k++) {
      n.gid[k] = pr.gid[k];
      n.gt[k] = pr.gt[k];
    }
  }
}

function impactoRayo(sim: Sim, pr: Proyectil) {
  const E = sim.E;
  const j = jugadorDe(sim, pr);
  sim.suc.push(S.RAYO, pr.x, pr.y, pr.area, pr.arma);
  sim.enRadio(pr.x, pr.y, pr.area, LISTA);
  for (const i of LISTA) {
    const dx = E.x[i] - pr.x, dy = E.y[i] - pr.y;
    const l = Math.hypot(dx, dy) || 1;
    golpeProyectil(sim, pr, GP, dx / l, dy / l);
    // La guillotina remata a lo que quede con menos del 25 %
    if (pr.flags & F.EJECUTA && !esJefe(E.tipo[i]) && E.hp[i] < E.hpMax[i] * 0.25 + pr.dano) GP.ejecutaExtra = 0.25;
    sim.danar(i, pr.dano, GP);
  }
  if (pr.flags & F.CHARCO && j) {
    const a = j.armas[pr.ranura];
    if (a) ponerZona(sim, j, a, pr.ranura, pr.x, pr.y, pr.area, pr.dano * 0.4 + pr.quema, pr.duracion || 2.5);
  }
}

// ------------------------------------------------------------------------------------------------- Proyectiles enemigos
function moverEnemigo(sim: Sim, pr: Proyectil, dt: number) {
  pr.t += dt;
  if (pr.t >= pr.vida) {
    pr.vivo = false;
    return;
  }
  const nx = pr.x + pr.vx * dt, ny = pr.y + pr.vy * dt;
  if (!(pr.flags & F.FANTASMA) && tapaLuz(sim.mapa.get(Math.floor(nx), Math.floor(ny)))) {
    pr.vivo = false;
    return;
  }
  pr.x = nx;
  pr.y = ny;
  pr.ang = Math.atan2(pr.vy, pr.vx);
  for (const j of sim.J) {
    if (j.estado !== 0) continue;
    if ((j.x - pr.x) ** 2 + (j.y - pr.y) ** 2 < (pr.r + RADIO_JUGADOR) ** 2) {
      sim.herir(j, pr.dano, pr.x - pr.vx * 0.1, pr.y - pr.vy * 0.1);
      if (pr.lento > 0) j.prisaT = 0;
      pr.vivo = false;
      return;
    }
  }
  // Las torretas y los aliados grandes también paran flechas
  for (const a of sim.A) {
    if (!a.vivo || a.hpMax <= 1 || (a.x - pr.x) ** 2 + (a.y - pr.y) ** 2 > (pr.r + a.r) ** 2) continue;
    a.hp -= pr.dano;
    a.golpe = 1;
    pr.vivo = false;
    return;
  }
}

/** Dispara un proyectil enemigo. */
export function disparoEnemigo(sim: Sim, x: number, y: number, ang: number, vel: number, dano: number, tipo: number, alcance = 9, r = 0.22, flags = 0) {
  const pr = sim.nuevoProyectil();
  if (!pr) return null;
  pr.mov = MOV.ENEMIGO;
  pr.dueno = -1;
  pr.arma = tipo;
  pr.x = x;
  pr.y = y;
  pr.z = 0.7;
  pr.ang = ang;
  pr.vx = Math.cos(ang) * vel;
  pr.vy = Math.sin(ang) * vel;
  pr.dano = dano;
  pr.r = r;
  pr.vida = alcance / Math.max(0.5, vel);
  pr.flags = flags;
  sim.suc.push(S.DISPARO_E, x, y, tipo);
  return pr;
}

// ------------------------------------------------------------------------------------------------- Zonas
export function moverZonas(sim: Sim, dt: number) {
  const E = sim.E;
  for (const z of sim.Z) {
    if (!z.vivo) continue;
    z.t += dt;
    if (z.t >= z.vida) {
      z.vivo = false;
      continue;
    }
    if (z.sigue >= 0) {
      const j = sim.J[z.sigue];
      if (j) {
        z.x = j.x;
        z.y = j.y;
      }
    }
    if (z.t < z.retraso) continue;
    if (z.unico) {
      if (z.hecho) continue;
      z.hecho = true;
      z.vida = Math.min(z.vida, z.t + 0.35);
      if (z.enemiga) {
        for (const j of sim.J) if (j.estado === 0 && (j.x - z.x) ** 2 + (j.y - z.y) ** 2 < (z.r + RADIO_JUGADOR * 0.5) ** 2) sim.herir(j, z.dps, z.x, z.y);
        for (const a of sim.A) if (a.vivo && a.hpMax > 1 && (a.x - z.x) ** 2 + (a.y - z.y) ** 2 < z.r * z.r) a.hp -= z.dps;
      }
      continue;
    }
    z.tickT -= dt;
    if (z.tickT > 0) continue;
    z.tickT = 0.25;
    if (z.enemiga) {
      for (const j of sim.J) {
        if (j.estado !== 0 || (j.x - z.x) ** 2 + (j.y - z.y) ** 2 > z.r * z.r) continue;
        sim.herir(j, z.dps * 0.25, z.x, z.y, false);
      }
      continue;
    }
    if (z.cura > 0) for (const j of sim.J) if (j.estado === 0 && (j.x - z.x) ** 2 + (j.y - z.y) ** 2 < z.r * z.r) sim.curar(j, 0.6 * z.cura, true);
    if (z.dps <= 0 && z.lento <= 0 && z.maldicion <= 0) continue;
    sim.enRadio(z.x, z.y, z.r, LISTA);
    const j = z.dueno >= 0 ? sim.J[z.dueno] : null;
    for (const i of LISTA) {
      GZ.reset();
      GZ.j = z.dueno;
      GZ.ranura = z.ranura;
      GZ.etq = z.etq;
      GZ.lento = z.lento;
      GZ.veneno = z.veneno;
      GZ.quema = z.quema;
      GZ.maldicion = z.maldicion && sim.az.n() < 0.3 ? 1 : 0;
      GZ.callado = sim.az.n() > 0.12;
      GZ.sustancia = sustancia(z.etq);
      if (z.tipo === ZONA.HUMO) {
        E.lento[i] = Math.max(E.lento[i], 0.6);
        E.lentoT[i] = 0.5;
        E.miedo[i] = Math.max(E.miedo[i], 0.3);
      }
      if (j) mec.modGolpe(sim, j, GZ);
      if (z.dps > 0) sim.danar(i, z.dps * 0.25, GZ);
      else if (z.lento > 0) {
        E.lento[i] = Math.max(E.lento[i], z.lento);
        E.lentoT[i] = 0.6;
      }
    }
  }
}

/** Zona enemiga con aviso (sombra en el piso, después el golpe): huesos que llueven, golpes de jefe. */
export function zonaPeligro(sim: Sim, x: number, y: number, r: number, dano: number, retraso: number, tipo: number = ZONA.PELIGRO) {
  const z = sim.nuevaZona();
  if (!z) return null;
  z.tipo = tipo;
  z.x = x;
  z.y = y;
  z.r = r;
  z.dps = dano;
  z.enemiga = true;
  z.retraso = retraso;
  z.unico = true;
  z.hecho = false;
  z.vida = z.total = retraso + 0.4;
  return z;
}

export { esSolida };
