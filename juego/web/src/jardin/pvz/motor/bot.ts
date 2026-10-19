// Piloto de pruebas: juega con las mismas órdenes y reglas que una persona (sembrar con costo, recarga y casillas
// válidas; recoger soles; usar el abono; palear) y no toca el estado del motor. Determinista: no usa azar propio.
//
//   const bot = crearBot();
//   const m = new MotorPvZ(nivel, { semilla, mazo: elegirMazo(nivel) });
//   while (m.estado === 'intro' || m.estado === 'jugando') { bot(m); m.paso(); }
import { defPlanta } from '../datos/plantas';
import type { DefNivel, IdPlanta, ItemCinta, Planta, Zombi } from '../tipos';
import type { MotorPvZ } from './motor';
import { ANCHO_COL, DANO_BOLOS, MEDIO_ZOMBI, X_ATACABLE } from './reglas';

/** Orden de preferencia del piloto al elegir sobres. */
const PREFERENCIA: IdPlanta[] = ['girasol', 'repetidora', 'hielaguisantes', 'lanzaguisantes', 'petacereza', 'nuez', 'patatapum', 'carnivora', 'desesporada'];

/** Mazo del piloto para un nivel con selección (las que prefiere, hasta llenar las ranuras). */
export function elegirMazo(nivel: DefNivel, ranuras = nivel.ranuras): IdPlanta[] {
  const disponibles = nivel.plantasDisponibles;
  const orden = [...PREFERENCIA.filter((t) => disponibles.includes(t)), ...disponibles.filter((t) => !PREFERENCIA.includes(t))];
  return orden.slice(0, ranuras);
}

/** Daño por segundo aproximado de cada disparador (20 de daño cada ~1,43 s). */
const DPS: Record<string, number> = { lanzaguisantes: 14, hielaguisantes: 16, repetidora: 28, desesporada: 14 };
const TIRADORES = ['repetidora', 'hielaguisantes', 'lanzaguisantes'];

interface Fila {
  fila: number;
  zombis: Zombi[];
  /** Daño por segundo de la fila y x del disparador más adelantado (−1 si no hay). */
  dps: number;
  frente: number;
  tiradores: number;
  nuez: Planta | undefined;
  /** Daño por segundo que haría falta para que nadie llegue a los disparadores. */
  necesita: number;
  /** Segundos hasta que el primero llegue al frente. */
  llegada: number;
}

/** Vida que hay que quitarle a un zombi para matarlo (sin contar lo que se drena sin cabeza). */
function vidaUtil(z: Zombi): number {
  return (z.casco?.vida ?? 0) + (z.escudo?.vida ?? 0) + Math.max(0, z.vida - z.vidaMax / 3);
}

function velocidad(z: Zombi): number {
  return z.vel * (z.lento > 0 ? 0.5 : 1);
}

function analizar(m: MotorPvZ): Fila[] {
  return m.filasActivas.map((fila) => {
    const plantas = m.plantas.filter((p) => p.vida > 0 && p.fila === fila);
    const tiradores = plantas.filter((p) => DPS[p.tipo] && !p.dormida);
    const dps = tiradores.reduce((s, p) => s + DPS[p.tipo], 0);
    const frente = tiradores.reduce((x, p) => Math.max(x, p.x), -1);
    const nuez = plantas.find((p) => p.tipo === 'nuez');
    const minas = plantas.filter((p) => p.tipo === 'patatapum');
    const zombis = m.zombis.filter((z) => z.vida > 0 && z.fila === fila && !z.hipnotizado && z.x < X_ATACABLE).sort((a, b) => a.x - b.x);
    let necesita = 0;
    let llegada = Infinity;
    let acumulada = 0;
    const usadas = new Set<number>();
    for (const z of zombis) {
      // Una Patatapum delante que se arma antes de que llegue se encarga de él.
      const mina = minas.find((p) => !usadas.has(p.id) && p.x < z.x && (p.datos.armada || p.reloj < (z.x - p.x - 55) / Math.max(1, velocidad(z))));
      if (mina && z.tipo !== 'pertiga') {
        usadas.add(mina.id);
        continue;
      }
      // Tiempo hasta que llegue al disparador más adelantado (o a la casa), más lo que tarde en comerse la nuez.
      const meta = (frente >= 0 ? frente : 0) + 70;
      let t = Math.max(0.5, (z.x - meta) / Math.max(1, velocidad(z)));
      if (nuez && nuez.x > meta - 70 && z.x > nuez.x && z.tipo !== 'pertiga') t += nuez.vida / 100 / Math.max(1, zombis.length);
      acumulada += vidaUtil(z);
      necesita = Math.max(necesita, acumulada / t);
      llegada = Math.min(llegada, t);
    }
    return { fila, zombis, dps, frente, tiradores: tiradores.length, nuez, necesita, llegada };
  });
}

/** Siembra si se puede (true si sembró). */
function probar(m: MotorPvZ, tipo: IdPlanta, fila: number, col: number): boolean {
  return m.sembrar(tipo, fila, col).ok;
}

function lista(m: MotorPvZ, tipo: IdPlanta): boolean {
  return !!m.tarjeta(tipo)?.disponible;
}

/** Mejor disparador que se puede pagar ahora (o el mejor que hay si `esperar`: devuelve null para ahorrar). */
function mejorTirador(m: MotorPvZ, urgente: boolean): IdPlanta | null {
  for (const t of TIRADORES) {
    const tj = m.tarjeta(t);
    if (!tj) continue;
    if (tj.disponible) return t;
    // Sin urgencia se ahorra para el mejor; con urgencia se baja al siguiente que esté listo.
    if (!urgente && tj.restante <= 0) return null;
  }
  return null;
}

/** Primera columna libre para un tipo entre las dadas. */
function columnaLibre(m: MotorPvZ, tipo: IdPlanta, fila: number, cols: number[]): number {
  for (const c of cols) if (m.puedeSembrar(tipo, fila, c).ok) return c;
  return -1;
}

/** Casilla para una Petacereza que atrape a más zombis (al menos `minimo`), o null. */
function mejorExplosion(m: MotorPvZ, minimo: number, filas: number[] = m.filasActivas): { fila: number; col: number; n: number } | null {
  let mejor: { fila: number; col: number; n: number } | null = null;
  for (const f of filas) {
    for (const z of m.zombis) {
      if (z.vida <= 0 || z.fila !== f || z.hipnotizado || z.x >= X_ATACABLE - 20) continue;
      // El zombi se mueve ~20 px durante la mecha: apuntar un poco por delante.
      const col = Math.max(0, Math.min(m.columnas - 1, Math.floor((z.x - 15) / ANCHO_COL)));
      for (const c of [col, col - 1, col + 1]) {
        if (c < 0 || c >= m.columnas) continue;
        for (const fc of [f, f - 1, f + 1]) {
          if (!m.filasActivas.includes(fc) || !m.puedeSembrar('petacereza', fc, c).ok) continue;
          const x = m.xCol(c);
          const n = m.zombis.filter((o) => o.vida > 0 && !o.hipnotizado && Math.abs(o.fila - fc) <= 1 && o.x + MEDIO_ZOMBI >= x - 120 && o.x - MEDIO_ZOMBI <= x + 120)
            .reduce((s, o) => s + 1 + vidaUtil(o) / 600, 0);
          if (n >= minimo && (!mejor || n > mejor.n)) mejor = { fila: fc, col: c, n };
        }
      }
    }
  }
  return mejor;
}

function recogerTodo(m: MotorPvZ): void {
  for (const s of [...m.soles]) m.recoger(s.id);
  for (const c of [...m.monedas]) m.recoger(c.id);
  for (const a of [...m.abonosSueltos]) if (m.abonoCargas < m.abonoMax) m.recoger(a.id);
}

// --- Niveles normales ------------------------------------------------------------------------------------------

function usarAbono(m: MotorPvZ, filas: Fila[]): boolean {
  if (m.abonoCargas <= 0 || !m.abonoActivo) return false;
  // En la fila más apurada, sobre su mejor disparador.
  const apurada = filas.filter((f) => f.zombis.length && f.necesita > f.dps * 0.8 && f.tiradores > 0).sort((a, b) => a.llegada - b.llegada)[0];
  if (apurada) {
    const p = m.plantas
      .filter((q) => q.vida > 0 && q.fila === apurada.fila && DPS[q.tipo] && !q.dormida && q.abono <= 0)
      .sort((a, b) => DPS[b.tipo] - DPS[a.tipo])[0];
    if (p && m.usarAbono(p.fila, p.col).ok) return true;
  }
  // Una nuez muy mordida con zombis encima.
  for (const f of filas) {
    if (f.nuez && f.nuez.vida < 1500 && f.zombis.some((z) => z.mordiendo === f.nuez!.id) && m.usarAbono(f.nuez.fila, f.nuez.col).ok) return true;
  }
  // Con el abono lleno, sol extra en un girasol.
  if (m.abonoCargas >= m.abonoMax) {
    const g = m.plantas.find((p) => p.vida > 0 && p.tipo === 'girasol' && p.abono <= 0);
    if (g && m.usarAbono(g.fila, g.col).ok) return true;
  }
  return false;
}

function botNormal(m: MotorPvZ): void {
  const filas = analizar(m);
  if (usarAbono(m, filas)) return;
  const nFilas = filas.length;
  const girasoles = m.plantas.filter((p) => p.vida > 0 && p.tipo === 'girasol').length;
  const metaGirasoles = m.tarjeta('girasol') ? (nFilas >= 5 ? 10 : nFilas * 2) : 0;
  const colsTirador = [2, 3, 1, 4, 5, 0, 6];
  const delante = (f: Fila, c: number, margen: number) => !f.zombis.length || m.xCol(c) + margen < f.zombis[0].x;

  // 1) Filas cuyo daño no alcanza para frenar a sus zombis, la más apurada primero.
  const apuradas = filas.filter((f) => f.zombis.length && f.necesita > f.dps * 0.9).sort((a, b) => a.llegada - b.llegada);
  for (const f of apuradas) {
    const z = f.zombis[0];
    const critica = f.llegada < 8 || (f.tiradores === 0 && z.x < 300);
    // A punto de comerse la defensa: Petacereza (o a un grupo grande en cualquier momento).
    if (lista(m, 'petacereza')) {
      const e = mejorExplosion(m, critica ? 1 : 4, critica ? [f.fila] : m.filasActivas);
      if (e && probar(m, 'petacereza', e.fila, e.col)) return;
    }
    // Un disparador más si cabe delante del zombi.
    if (f.tiradores < 6) {
      const t = mejorTirador(m, true);
      if (t) {
        const c = columnaLibre(m, t, f.fila, colsTirador.filter((c) => delante(f, c, 60)));
        if (c >= 0 && probar(m, t, f.fila, c)) return;
      }
    }
    // Sin sol para un disparador: Patatapum delante del primero si le da tiempo a armarse.
    if (lista(m, 'patatapum') && z.tipo !== 'pertiga') {
      for (let c = m.columnas - 1; c >= 0; c--) {
        const x = m.xCol(c);
        if (x <= f.frente || x + 60 > z.x || (z.x - x - 55) / Math.max(1, velocidad(z)) < 16) continue;
        if (probar(m, 'patatapum', f.fila, c)) return;
        break;
      }
    }
    // Ganar tiempo con una nuez delante de los disparadores (solo si ya hay quien dispare).
    if (f.tiradores > 0 && !f.nuez && lista(m, 'nuez')) {
      for (const c of [6, 5, 7, 4]) if (m.xCol(c) > f.frente && delante(f, c, 75) && probar(m, 'nuez', f.fila, c)) return;
    }
    if (f.tiradores > 0 && lista(m, 'carnivora')) {
      for (const c of [5, 4, 6]) if (m.xCol(c) > f.frente && delante(f, c, 110) && probar(m, 'carnivora', f.fila, c)) return;
    }
    // Ahorrar para responder (no gastar en girasoles) si es grave.
    if (critica || f.tiradores === 0) return;
  }

  // 2) Girasoles: uno por fila, después dos (sin pasarse si ya vienen muchos zombis).
  if (girasoles < metaGirasoles && lista(m, 'girasol') && (girasoles < nFilas || apuradas.length === 0)) {
    for (const col of [0, 1]) for (const f of filas) if (probar(m, 'girasol', f.fila, col)) return;
  }
  if (girasoles < Math.min(metaGirasoles, nFilas) && m.t < 60) return;

  // 3) Disparadores donde más falten: 1 por fila, luego 2, nueces, 3, y hasta 5.
  const ordenadas = [...filas].sort((a, b) => (a.dps - a.necesita) - (b.dps - b.necesita) || a.tiradores - b.tiradores);
  for (const tope of [1, 2, 3, 4, 5]) {
    for (const f of ordenadas) {
      if (f.tiradores >= tope) continue;
      const t = mejorTirador(m, tope === 1);
      if (!t) return;
      const c = columnaLibre(m, t, f.fila, colsTirador.filter((c) => c <= 5 && delante(f, c, 60)));
      if (c >= 0 && probar(m, t, f.fila, c)) return;
    }
    if (tope === 2 && lista(m, 'nuez')) {
      for (const f of ordenadas) {
        if (f.nuez || f.tiradores < 2) continue;
        const c = columnaLibre(m, 'nuez', f.fila, [7, 6].filter((c) => delante(f, c, 75)));
        if (c >= 0 && probar(m, 'nuez', f.fila, c)) return;
      }
    }
  }
}

// --- La bolera -------------------------------------------------------------------------------------------------

/** Golpes de nuez que le faltan a un zombi (casco con desborde, escudo sin desborde). */
function golpesBolos(z: Zombi): number {
  return (z.escudo ? Math.ceil(z.escudo.vida / DANO_BOLOS) : 0) + Math.max(1, Math.ceil(((z.casco?.vida ?? 0) + Math.max(0, z.vida - z.vidaMax / 3 + 1)) / DANO_BOLOS));
}

function botBolera(m: MotorPvZ): void {
  const cinta = m.cinta!;
  if (!cinta.length) return;
  const linea = m.nivel.lineaRoja ?? 3;
  const zombis = m.zombis.filter((z) => z.vida > 0 && !z.hipnotizado && z.x < X_ATACABLE - 10);
  if (!zombis.length) return;
  // Nueces que ya van rectas hacia cada zombi.
  const rodando = m.proyectiles.filter((p) => p.forma === 'rodante' && p.dano > 0 && (p.dirY ?? 0) === 0);
  const pendientes = (z: Zombi) => rodando.filter((p) => p.fila === z.fila && p.x < z.x).length;
  const columna = (z: Zombi) => {
    for (let c = linea - 1; c >= 0; c--) if (m.xCol(c) + 30 < z.x - MEDIO_ZOMBI) return c;
    return -1;
  };
  const explosiva = cinta.find((it) => it.tipo === 'nuezexplosiva');
  const normal = cinta.find((it) => it.tipo !== 'nuezexplosiva');
  // La explosiva va al grupo más grande (o a lo más cercano si la cinta se llena).
  if (explosiva) {
    let mejor: { z: Zombi; n: number } | null = null;
    for (const z of zombis) {
      const delante = zombis.filter((o) => o.fila === z.fila && o.x < z.x).length;
      if (delante > 0 || pendientes(z) > 0) continue;
      const n = zombis.filter((o) => Math.abs(o.fila - z.fila) <= 1 && Math.abs(o.x - z.x) <= 110).length;
      if (!mejor || n > mejor.n) mejor = { z, n };
    }
    if (mejor && (mejor.n >= 2 || !normal || cinta.length >= 6)) {
      const c = columna(mejor.z);
      if (c >= 0 && m.sembrarCinta(explosiva.id, mejor.z.fila, c).ok) return;
    }
  }
  if (!normal) return;
  const objetivo = zombis
    .filter((z) => pendientes(z) < golpesBolos(z) && columna(z) >= 0)
    .sort((a, b) => a.x - b.x)[0];
  if (!objetivo) return;
  m.sembrarCinta(normal.id, objetivo.fila, columna(objetivo));
}

// --- Cinta (ataque total) --------------------------------------------------------------------------------------

function botCinta(m: MotorPvZ): void {
  const cinta = m.cinta!;
  if (!cinta.length) return;
  const filas = analizar(m);
  const llena = cinta.length >= 8;
  const usar = (it: ItemCinta, fila: number, col: number) => col >= 0 && m.sembrarCinta(it.id, fila, col).ok;
  const libre = (tipo: IdPlanta, fila: number, cols: number[]) => {
    const d = defPlanta(tipo)!;
    for (const c of cols) if (m.validarCasilla(d, fila, c).ok) return c;
    return -1;
  };
  const apuradas = filas.filter((f) => f.zombis.length && f.necesita > f.dps * 0.9).sort((a, b) => a.llegada - b.llegada);
  for (const it of cinta) {
    switch (it.tipo) {
      case 'petacereza': {
        const e = mejorExplosion(m, apuradas.some((f) => f.llegada < 6) ? 1 : llena ? 1.5 : 3.5);
        if (e && usar(it, e.fila, e.col)) return;
        break;
      }
      case 'patatapum': {
        for (const f of [...apuradas, ...filas.filter((f) => f.zombis.length)]) {
          const z = f.zombis[0];
          for (let c = m.columnas - 1; c >= 0; c--) {
            const x = m.xCol(c);
            if (x <= f.frente || x + 60 > z.x || (z.x - x - 55) / Math.max(1, velocidad(z)) < 16) continue;
            if (usar(it, f.fila, libre(it.tipo, f.fila, [c]))) return;
            break;
          }
        }
        if (llena) {
          const f = [...filas].sort((a, b) => b.zombis.length - a.zombis.length)[0];
          if (usar(it, f.fila, libre(it.tipo, f.fila, [8, 7, 6]))) return;
        }
        break;
      }
      case 'nuez': {
        const f = filas.filter((f) => !f.nuez && f.tiradores > 0).sort((a, b) => b.necesita - a.necesita)[0];
        if (f && (f.zombis.length || llena) && usar(it, f.fila, libre(it.tipo, f.fila, [6, 5, 7].filter((c) => !f.zombis.length || m.xCol(c) + 75 < f.zombis[0].x)))) return;
        break;
      }
      case 'carnivora': {
        const f = [...apuradas, ...[...filas].sort((a, b) => b.necesita - a.necesita)][0];
        if (f && usar(it, f.fila, libre(it.tipo, f.fila, [5, 4, 6].filter((c) => m.xCol(c) > f.frente && (!f.zombis.length || m.xCol(c) + 110 < f.zombis[0].x))))) return;
        break;
      }
      default: {
        if (!DPS[it.tipo]) break;
        const f = [...filas].sort((a, b) => (a.dps - a.necesita) - (b.dps - b.necesita) || a.tiradores - b.tiradores)[0];
        if (usar(it, f.fila, libre(it.tipo, f.fila, [0, 1, 2, 3, 4].filter((c) => !f.zombis.length || m.xCol(c) + 60 < f.zombis[0].x)))) return;
      }
    }
  }
}

/** Crea el piloto. Llamarlo antes de cada paso del motor. */
export function crearBot(): (m: MotorPvZ) => void {
  return (m) => {
    if (m.estado === 'intro') {
      if (m.nivel.palearAntes) for (const p of [...m.plantas]) m.palear(p.fila, p.col);
      m.comenzar();
      return;
    }
    if (m.estado !== 'jugando') return;
    recogerTodo(m);
    if (m.cinta) {
      if (m.nivel.minijuego === 'bolera') botBolera(m);
      else botCinta(m);
      return;
    }
    botNormal(m);
  };
}
