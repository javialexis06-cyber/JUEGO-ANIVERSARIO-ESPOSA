// IA del Parchís. Suave: mueve al azar (a veces aprovecha para comer o llegar). Normal: mira cómo queda el
// tablero (comer, llegar, escapar del peligro, avanzar la de adelante, hacer barrera). Sin piedad: además
// piensa en los seis dados que puede sacar el otro y en su mejor respuesta.
import { otro, type Rol } from '../../casa/modelo';
import type { NivelIA } from '../tipos';
import {
  CASA,
  ENTRADA,
  META,
  SALIDA,
  SEGUROS,
  absoluta,
  enVuelta,
  esBarrera,
  mapa,
  reglas,
  type EstadoParchis,
  type MovParchis,
} from './reglas';

/** Lo que vale una ficha según dónde va (salir ya vale bastante: cuesta un 5). */
function valorFicha(p: number) {
  if (p === CASA) return 0;
  const base = 12 + p + (p * p) / 400;
  if (p === META) return base + 14;
  return p > ENTRADA ? base + 6 : base;
}

/** Probabilidad de que `o` coma en su próxima tirada a una ficha sola en la casilla `a` de la vuelta. */
function peligro(e: EstadoParchis, o: Rol, a: number, m: Uint8Array, oCasa: boolean): number {
  const seguro = SEGUROS.has(a);
  const salidaLibre = oCasa && m[SALIDA[o] * 2 + (o === 'el' ? 0 : 1)] < 2;
  let casos = 0;
  for (let d = 1; d <= 6; d++) {
    if (d === 5 && salidaLibre) {
      // Con un 5 está obligado a sacar: solo come si la ficha está en su salida
      if (a === SALIDA[o]) casos++;
      continue;
    }
    if (seguro) continue;
    const pasos = d === 6 && !oCasa ? 7 : d;
    for (const pb of e.fichas[o]) {
      if (!enVuelta(pb) || pb + pasos > ENTRADA || absoluta(o, pb + pasos) !== a) continue;
      let libre = true;
      for (let s = pb + 1; s < pb + pasos && libre; s++) if (esBarrera(m, absoluta(o, s))) libre = false;
      if (libre) {
        casos++;
        break;
      }
    }
  }
  return casos / 6;
}

function lado(e: EstadoParchis, r: Rol, m: Uint8Array): number {
  const o = otro(r);
  const f = e.fichas[r];
  const oCasa = e.fichas[o].includes(CASA);
  // Al que le toca mover todavía puede escapar: su peligro pesa menos
  const peso = e.turno === r ? 0.35 : 1;
  let v = 0;
  for (const p of f) {
    v += valorFicha(p);
    if (!enVuelta(p)) continue;
    const a = absoluta(r, p);
    const barrera = f.filter((x) => x === p).length >= 2;
    if (barrera) {
      // Una barrera no se puede comer y frena al otro si viene detrás
      v += 1.5;
      for (const pb of e.fichas[o]) {
        if (!enVuelta(pb)) continue;
        const dist = (a - absoluta(o, pb) + 68) % 68;
        if (dist > 0 && dist <= 12 && pb + dist <= ENTRADA) v += 2;
      }
      continue;
    }
    v -= peso * peligro(e, o, a, m, oCasa) * (valorFicha(p) + 20);
  }
  return v;
}

/** Qué tan bien está `r` (positivo = mejor que el otro). */
export function valor(e: EstadoParchis, r: Rol): number {
  const f = reglas.fin(e);
  if (f) return f.ganador === r ? 1e4 : -1e4;
  const m = mapa(e);
  let v = lado(e, r, m) - lado(e, otro(r), m);
  if (e.fase === 'mover' && e.bono > 0) v += (e.turno === r ? 0.9 : -0.9) * e.bono;
  return v;
}

const esMover = (m: MovParchis): m is { t: 'mover'; ficha: number; pasos: number } => m.t === 'mover';

/** Juega `r` a lo voraz mientras le toque mover (el dado y luego sus premios). */
function voraz(e: EstadoParchis, r: Rol): EstadoParchis {
  for (let k = 0; k < 8 && e.turno === r && e.fase === 'mover' && !reglas.fin(e); k++) {
    let mejor: EstadoParchis | null = null;
    let mv = -Infinity;
    for (const m of reglas.movimientos(e)) {
      const s = reglas.aplicar(e, m);
      const v = valor(s, r);
      if (v > mv) {
        mv = v;
        mejor = s;
      }
    }
    if (!mejor) break;
    e = mejor;
  }
  return e;
}

/** Valor para `r` tras su jugada: resuelve sus premios y promedia la respuesta del otro en sus seis dados. */
function esperado(s: EstadoParchis, r: Rol, prof: number): number {
  if (reglas.fin(s)) return valor(s, r);
  if (s.turno === r) {
    if (s.fase === 'mover' && prof > 0) {
      let mejor = -Infinity;
      for (const m of reglas.movimientos(s)) mejor = Math.max(mejor, esperado(reglas.aplicar(s, m), r, prof - 1));
      return mejor;
    }
    // Vuelve a tirar (sacó 6): se queda con cómo quedó
    return valor(s, r) + 2;
  }
  const o = s.turno;
  let total = 0;
  for (let d = 1; d <= 6; d++) total += valor(voraz(reglas.aplicar(s, { t: 'tirar', dado: d }), o), r);
  return total / 6;
}

export function ia(e: EstadoParchis, nivel: NivelIA, azar: () => number): MovParchis {
  if (e.fase === 'tirar') return { t: 'tirar', dado: Math.min(6, 1 + Math.floor(azar() * 6)) };
  const movs = reglas.movimientos(e);
  if (movs.length <= 1) return movs[0] ?? { t: 'pasar' };
  const r = e.turno;
  const al = <T>(xs: T[]) => xs[Math.min(xs.length - 1, Math.floor(azar() * xs.length))];

  if (nivel === 'facil') {
    // A veces ve la jugada obvia; el resto, a lo que salga
    const o = otro(r);
    const buenas = movs.filter((m) => {
      if (!esMover(m)) return false;
      const s = reglas.aplicar(e, m);
      return s.fichas[r][m.ficha] === META || s.fichas[o].filter((p) => p === CASA).length > e.fichas[o].filter((p) => p === CASA).length;
    });
    if (buenas.length && azar() < 0.45) return al(buenas);
    return al(movs);
  }

  let mejor = movs[0];
  let mv = -Infinity;
  for (const m of movs) {
    const s = reglas.aplicar(e, m);
    const v = (nivel === 'dificil' ? esperado(s, r, 3) : valor(voraz(s, r), r)) + azar() * 0.01;
    if (v > mv) {
      mv = v;
      mejor = m;
    }
  }
  return mejor;
}
