// Mundo 1 · la casa (día): las 9 plantas del día con sus mecánicas de PvZ 1 y su abono de PvZ 2, y el saltador
// de pértiga. Zombi, abanderado, caracono y caracubo no necesitan nada propio: el motor resuelve caminar, morder
// y gastar el casco.
import { defZombi } from '../datos/zombis';
import type { MotorPvZ } from '../motor/motor';
import { ANCHO_COL, MEDIO_PLANTA, MEDIO_ZOMBI, X_ATACABLE } from '../motor/reglas';
import type { ComportamientoPlanta, ComportamientoZombi, Planta, RegistroComportamientos, Zombi } from '../tipos';
import { crearTirador, dato, disparoDe, empezarRafaga } from './comun';

// --- Disparadores -------------------------------------------------------------------------------------------------

/** Lanzaguisantes. Abono: Guisantralladora por un momento, 60 guisantes en 3 s (1200 de daño). */
const lanzaguisantes = crearTirador({ proyectil: 'guisante' }, {
  abono(m, p) {
    empezarRafaga(p, 60, 3);
    return true;
  },
});

/** Hielaguisantes: ralentiza 10 s. Abono: ralentiza a todos los de delante y dispara 60 guisantes helados. */
const hielaguisantes = crearTirador({ proyectil: 'guisanteHielo', efecto: 'lento' }, {
  abono(m, p) {
    const t = dato(m, p, 'lento', 10);
    for (const z of m.zombis) {
      if (z.vida > 0 && z.fila === p.fila && !z.hipnotizado && z.x + MEDIO_ZOMBI > p.x && z.x < X_ATACABLE) z.lento = Math.max(z.lento, t);
    }
    empezarRafaga(p, dato(m, p, 'rafaga', 60), dato(m, p, 'rafagaT', 3));
    return true;
  },
});

/** Repetidora: dos guisantes seguidos. Abono: 90 guisantes en 3 s, un segundo en rojo y un guisante gigante de 600. */
const repetidora = crearTirador({ proyectil: 'guisante' }, {
  paso(m, p, dt) {
    p.datos.ocupada = 0;
    if (!(p.datos.gigante > 0) || p.datos.rafaga > 0) return;
    p.datos.ocupada = 1;
    m.ponerEstado(p, 'carga');
    p.datos.cargaReloj -= dt;
    if (p.datos.cargaReloj > 0) return;
    disparoDe(m, p, { proyectil: 'guisanteGigante' }, 'guisanteGigante', dato(m, p, 'gigante', 600));
    p.datos.gigante = 0;
    m.ponerEstado(p, 'ataca');
  },
  abono(m, p) {
    const carga = dato(m, p, 'carga', 1);
    empezarRafaga(p, dato(m, p, 'rafaga', 90), dato(m, p, 'rafagaT', 3), carga);
    p.datos.gigante = 1;
    p.datos.cargaReloj = carga;
    return true;
  },
});

/** Seta desesporada: esporas de alcance corto (3 casillas). Duerme de día. Abono: todas disparan 30 esporas. */
const desesporada = crearTirador({ proyectil: 'espora' }, {
  abono(m, p) {
    for (const q of m.plantas) {
      if (q.vida > 0 && q.tipo === p.tipo && (!q.dormida || q === p)) {
        empezarRafaga(q, dato(m, q, 'rafaga', 30), dato(m, q, 'rafagaT', 1.5));
        if (q !== p) m.emitir({ t: 'abono', planta: q.id, tipo: q.tipo, fila: q.fila, col: q.col });
      }
    }
    return true;
  },
});

// --- Girasol ------------------------------------------------------------------------------------------------------

const girasol: ComportamientoPlanta = {
  iniciar(m, p) {
    p.reloj = m.azar.rango(dato(m, p, 'primeroMin', 3), dato(m, p, 'primeroMax', 12.5));
  },
  paso(m, p, dt) {
    p.reloj -= dt;
    // La cara brilla un momento antes de soltar el sol (estado 'ataca' del arte, 1,2 s).
    if (p.reloj <= 1.2 && p.estado !== 'ataca') m.ponerEstado(p, 'ataca');
    if (p.reloj > 0) return;
    m.solDePlanta(p, dato(m, p, 'sol', 25));
    p.reloj = m.azar.rango(dato(m, p, 'intervaloMin', 23.5), dato(m, p, 'intervaloMax', 25));
    m.ponerEstado(p, 'quieto');
  },
  abono(m, p) {
    // 150 de sol al instante: tres soles grandes de 50.
    const total = dato(m, p, 'abonoSol', 150);
    for (let i = 0; i < 3; i++) m.solDePlanta(p, total / 3, 'abono');
    return true;
  },
};

// --- Explosivas ---------------------------------------------------------------------------------------------------

/** Petacereza: se infla 1,2 s y estalla en 3×3 (1800). Abono (propuesto): durante la mecha, 5×5. */
const petacereza: ComportamientoPlanta = {
  iniciar(m, p) {
    p.reloj = dato(m, p, 'mecha', 1.2);
    p.datos.radio = dato(m, p, 'radio', 1);
    m.ponerEstado(p, 'inflandose');
  },
  paso(m, p, dt) {
    p.reloj -= dt;
    if (p.reloj > 0) return;
    m.explotar(p.fila, p.col, p.datos.radio, dato(m, p, 'dano', 1800), p.tipo);
    m.quitarPlanta(p, 'gastada');
  },
  abono(m, p) {
    if (p.reloj <= 0) return false;
    p.datos.radio = dato(m, p, 'radioAbono', 2);
    return true;
  },
};

/** Zombis que pisan la Patatapum armada (en su casilla, por el suelo o bajo tierra, sin estar saltando). */
function pisaMina(m: MotorPvZ, p: Planta): boolean {
  for (const z of m.zombis) {
    if (z.vida <= 0 || z.fila !== p.fila || z.hipnotizado || z.estado === 'salta') continue;
    if (z.altura !== 'suelo' && z.altura !== 'bajo tierra') continue;
    if (z.x - MEDIO_ZOMBI <= p.x + MEDIO_PLANTA && z.x + MEDIO_ZOMBI >= p.x - MEDIO_PLANTA) return true;
  }
  return false;
}

function armarMina(m: MotorPvZ, p: Planta): void {
  p.datos.armada = 1;
  p.reloj = 0;
  m.ponerEstado(p, 'armada');
  m.emitir({ t: 'arma', planta: p.id, fila: p.fila, col: p.col });
}

/** Patatapum: 15 s enterrada (se la pueden comer); armada estalla al primer contacto: 1800 en su casilla. */
const patatapum: ComportamientoPlanta = {
  iniciar(m, p) {
    p.reloj = dato(m, p, 'armado', 15);
    p.datos.armada = 0;
    m.ponerEstado(p, 'enterrada');
  },
  paso(m, p, dt) {
    if (!p.datos.armada) {
      p.reloj -= dt;
      if (p.reloj <= 0) armarMina(m, p);
      return;
    }
    if (!pisaMina(m, p)) return;
    // Alcanza a los zombis de su fila que estén sobre su casilla (con un poco de margen), no a los del aire.
    const ancho = ANCHO_COL / 2 + 20;
    const dano = dato(m, p, 'dano', 1800);
    for (const z of m.zombis) {
      if (z.vida <= 0 || z.fila !== p.fila || z.hipnotizado || z.altura === 'aire') continue;
      if (z.x + MEDIO_ZOMBI < p.x - ancho || z.x - MEDIO_ZOMBI > p.x + ancho) continue;
      m.danarZombi(z, dano, 'explosion');
    }
    m.emitir({ t: 'explosion', tipo: p.tipo, fila: p.fila, col: p.col, x: p.x, radio: 0 });
    m.quitarPlanta(p, 'gastada');
  },
  mordible(m, p) {
    return !p.datos.armada;
  },
  abono(m, p) {
    if (!p.datos.armada) armarMina(m, p);
    // Dos copias armadas en casillas libres al azar.
    const def = m.defPlanta(p.tipo);
    const libres: [number, number][] = [];
    for (const f of m.filasActivas) for (let c = 0; c < m.columnas; c++) if (m.validarCasilla(def, f, c).ok) libres.push([f, c]);
    for (let i = 0; i < dato(m, p, 'copiasAbono', 2) && libres.length; i++) {
      const [f, c] = libres.splice(m.azar.entero(libres.length), 1)[0];
      armarMina(m, m.crearPlanta(p.tipo, f, c));
    }
    return true;
  },
};

// --- Barrera ------------------------------------------------------------------------------------------------------

/** Nuez: 4000 de vida. Abono: se cura y se pone una coraza metálica de 8000 que dura hasta romperse. */
const nuez: ComportamientoPlanta = {
  abono(m, p) {
    p.coraza = dato(m, p, 'coraza', 8000);
    return true;
  },
};

// --- Carnívora ----------------------------------------------------------------------------------------------------

/**
 * Zombi en la boca de la Carnívora: su caja toca la franja que va del borde de su casilla hasta `alcance` px más
 * allá (la mitad izquierda de la casilla de delante, como en PvZ), por el suelo y sin estar saltando.
 */
function presaCarnivora(m: MotorPvZ, p: Planta): Zombi | undefined {
  const a = p.x + ANCHO_COL / 2;
  const b = a + dato(m, p, 'alcance', 40);
  let mejor: Zombi | undefined;
  for (const z of m.zombis) {
    if (z.vida <= 0 || z.fila !== p.fila || z.hipnotizado || z.altura !== 'suelo' || z.estado === 'salta') continue;
    if (z.x + MEDIO_ZOMBI < a || z.x - MEDIO_ZOMBI > b) continue;
    if (!mejor || z.x < mejor.x) mejor = z;
  }
  return mejor;
}

function tragable(z: Zombi): boolean {
  return defZombi(z.tipo)?.tragable !== false;
}

/**
 * Carnívora: apunta al zombi de delante y a los 0,7 s cierra la boca. Si sigue ahí se lo traga entero (sin importar
 * casco) y mastica 42 s, vulnerable; si no puede tragarlo (Zombistein) le da un mordisco de 40. Si el zombi ya no
 * está (saltó con la pértiga), falla.
 */
const carnivora: ComportamientoPlanta = {
  paso(m, p, dt) {
    if (p.estado === 'masticando') {
      p.reloj -= dt;
      if (p.reloj <= 0) m.ponerEstado(p, 'quieto');
      return;
    }
    if (p.estado === 'ataca') {
      p.reloj -= dt;
      if (p.reloj > 0) return;
      const z = presaCarnivora(m, p);
      if (z && tragable(z)) {
        m.emitir({ t: 'traga', planta: p.id, zombi: z.id, fila: p.fila, col: p.col });
        m.matarZombi(z, 'comido');
        p.reloj = dato(m, p, 'mastica', 42);
        m.ponerEstado(p, 'masticando');
      } else {
        if (z) m.danarZombi(z, dato(m, p, 'mordisco', 40), 'aplastar');
        m.ponerEstado(p, 'quieto');
      }
      return;
    }
    if (presaCarnivora(m, p)) {
      m.ponerEstado(p, 'ataca');
      p.reloj = dato(m, p, 'mordida', 0.7);
    }
  },
  abono(m, p) {
    // Aspira a los 3 más cercanos de su fila (a 3 casillas o menos), se los traga y eructa a los demás hacia atrás.
    const lejos = p.x + ANCHO_COL / 2 + dato(m, p, 'abonoAlcance', 3) * ANCHO_COL;
    const cerca = m.zombis
      .filter((z) => z.vida > 0 && z.fila === p.fila && !z.hipnotizado && z.altura === 'suelo' && z.x + MEDIO_ZOMBI >= p.x - 20 && z.x - MEDIO_ZOMBI <= lejos)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))
      .slice(0, dato(m, p, 'abonoTraga', 3));
    for (const z of cerca) {
      if (tragable(z)) {
        m.emitir({ t: 'traga', planta: p.id, zombi: z.id, fila: p.fila, col: p.col });
        m.matarZombi(z, 'comido');
      } else m.danarZombi(z, dato(m, p, 'abonoDano', 1000), 'aplastar');
    }
    const empuje = dato(m, p, 'eructo', 80);
    for (const z of m.zombis) if (z.vida > 0 && z.fila === p.fila && !z.hipnotizado && z.x > p.x) z.x = Math.min(X_ATACABLE - 1, z.x + empuje);
    p.reloj = 0;
    p.abono = Math.max(p.abono, 1.5);
    m.ponerEstado(p, 'quieto');
    return true;
  },
};

// --- Zombis -------------------------------------------------------------------------------------------------------

/** Planta que el saltador tiene delante para saltar (la más adelantada a menos de `distancia` px). */
function plantaParaSaltar(m: MotorPvZ, z: Zombi, distancia: number): Planta | undefined {
  let mejor: Planta | undefined;
  for (const p of m.plantas) {
    if (p.vida <= 0 || p.fila !== z.fila || p.capa === 'temporal' || m.defPlanta(p.tipo).rastrera) continue;
    if (p.x > z.x + 10 || p.x < z.x - distancia) continue;
    if (!mejor || p.x > mejor.x) mejor = p;
  }
  return mejor;
}

/** Nuez de la bolera que rueda hacia el saltador en su fila. */
function nuezRodandoCerca(m: MotorPvZ, z: Zombi, distancia: number): boolean {
  return m.proyectiles.some((pr) => pr.forma === 'rodante' && pr.dano > 0 && pr.fila === z.fila && pr.x <= z.x && pr.x >= z.x - distancia);
}

function soltarPertiga(m: MotorPvZ, z: Zombi): void {
  const d = defZombi(z.tipo)!;
  z.datos.pertiga = 0;
  z.vel = (d.datos?.velSinPertiga ?? d.velocidad) * (z.vel / d.velocidad);
  m.ponerEstado(z, z.sinCabeza ? 'sincabeza' : 'camina');
}

/**
 * Saltador de pértiga: corre (2,5 s por casilla) y al llegar a la primera planta clava la pértiga y la salta (1,1 s,
 * 155 px), cae detrás y sigue a pie (4,7 s por casilla) comiéndose lo siguiente. No puede saltar la Nuez
 * cáscara-rabias (choca, pierde la pértiga y se pone a comerla) ni las plantas rastreras. También salta la primera
 * nuez de la bolera que le llega rodando.
 */
const pertiga: ComportamientoZombi = {
  iniciar(m, z) {
    z.datos.pertiga = 1;
    m.ponerEstado(z, 'corre');
  },
  paso(m, z, dt) {
    if (!z.datos.pertiga) return false;
    const d = defZombi(z.tipo)!;
    if (z.estado === 'salta') {
      if (z.congelado > 0 || z.mantequilla > 0) return true;
      const f = z.lento > 0 ? 0.5 : 1;
      const dur = d.datos?.duracionSalto ?? 1.1;
      z.x -= ((d.datos?.salto ?? 155) / dur) * f * dt;
      z.datos.saltoT = (z.datos.saltoT ?? 0) + f * dt;
      if (z.datos.saltoT >= dur) soltarPertiga(m, z);
      return true;
    }
    if (z.sinCabeza || z.congelado > 0 || z.mantequilla > 0) return false;
    const distancia = d.datos?.distanciaSalto ?? 85;
    const p = plantaParaSaltar(m, z, distancia);
    if (p && m.defPlanta(p.tipo).saltable === false) {
      soltarPertiga(m, z);
      return false;
    }
    if (p || nuezRodandoCerca(m, z, distancia)) {
      z.datos.saltoT = 0;
      z.mordiendo = 0;
      m.ponerEstado(z, 'salta');
      m.emitir({ t: 'salta', zombi: z.id, fila: z.fila, x: z.x });
      return true;
    }
    return false;
  },
};

export const DIA: RegistroComportamientos = {
  plantas: { lanzaguisantes, girasol, petacereza, nuez, patatapum, hielaguisantes, carnivora, repetidora, desesporada },
  zombis: { pertiga },
};
