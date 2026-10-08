// Las reglas propias de cada bioma (Sangre y Ceniza 2, F; como los peligros de cada bioma de Deep Rock):
//   Cementerio: las tumbas se abren solas y sueltan muertos; a ratos baja la niebla del pantano.
//   Catacumbas: columnas de hueso que, si se rompen, tumban el techo encima de todos; el agua negra frena.
//   Minas: bolsas de grisú en la roca que revientan al picarlas; vagonetas sueltas que atropellan a todos.
//   Abadía: los vitrales se caen a pedazos; el campanario llama una oleada (y paga si se aguanta).
//   Castillo: trampas de pinchos en los pasillos; armaduras que despiertan cuando alguien pasa.
// Lo que revienta (grisú, techo, vidrios) le pega a todos, enemigos y jugadores: se puede usar a favor.
import { C, esSolida } from '../tipos';
import { TIPO, TIPOS } from './catalogo';
import { aparecerEnemigo, modsElite } from './enemigos_ia';
import { ENT, REC, S, type Entidad } from './estado';
import { zonaPeligro } from './armas';
import { Golpe } from './golpe';
import { RADIO_JUGADOR } from './jugador';
import { nuevaEntidad } from './mecanicas';
import { RADIO_ABRIR, quienUsa, soltarUso } from './objetivos';
import type { Sim } from './sim';

const GB = new Golpe();

/** Algo que revienta un rato después (grisú, techo que cae, vidrio): le pega a todos alrededor. */
export interface Reventon {
  t: number;
  x: number;
  y: number;
  r: number;
  /** Daño a los enemigos (sube con la etapa) y a los jugadores. */
  dE: number;
  dJ: number;
  /** Clase de explosión del dibujo (0 fuego, 6 polvo…). */
  clase: number;
  /** Rompe la roca blanda alrededor (y las vetas: el grisú hace cadena). */
  rompe: boolean;
  /** En vez de reventar, sale un muerto de este tipo (las tumbas del cementerio). */
  sale?: number;
}

/** Al armar la etapa: lo que pone cada bioma en el mapa. */
export function prepararBioma(sim: Sim) {
  if (sim.cfg.exp.tutorial) return;
  const b = sim.bioma.id;
  // (lo primero del bioma llega al minuto: los primeros segundos son para armarse)
  sim.biomaT = sim.cfg.etapa === 1 ? 70 : 45;
  sim.biomaT2 = sim.cfg.etapa === 1 ? 100 : 60;
  if (b === 'abadia' && !sim.cfg.final) {
    const p = lugarAbierto(sim, 10, 999, 3);
    if (p) nuevaEntidad(sim, ENT.CAMPANARIO, p.x, p.y);
  }
  if (b === 'castillo') {
    for (const p of lugaresPasillo(sim, 10 + 2 * sim.n)) nuevaEntidad(sim, ENT.PINCHOS, p.x, p.y);
    for (let k = 0; k < 6; k++) {
      const p = lugarAbierto(sim, 9, 999, 1);
      if (p) {
        const e = nuevaEntidad(sim, ENT.ARMADURA, p.x, p.y);
        e.k = Math.floor(sim.az.n() * 4);
      }
    }
  }
}

/** Cada cuadro. */
export function actualizarBioma(sim: Sim, dt: number) {
  // Lo que revienta (de cualquier bioma)
  for (let k = sim.reventones.length - 1; k >= 0; k--) {
    const r = sim.reventones[k];
    if (sim.t < r.t) continue;
    sim.reventones.splice(k, 1);
    if (r.sale !== undefined) aparecerEnemigo(sim, r.sale, r.x + sim.az.entre(-0.4, 0.4), r.y + sim.az.entre(-0.4, 0.4), { desdeTierra: true });
    else reventar(sim, r);
  }
  if (sim.niebla > 0) sim.niebla = Math.max(0, sim.niebla - dt);
  if (sim.cfg.exp.tutorial || sim.fase === 'jefe' || sim.sinHorda) return;
  const vivos = sim.vivos();
  if (!vivos.length) return;
  sim.biomaT -= dt;
  sim.biomaT2 -= dt;
  switch (sim.bioma.id) {
    case 'cementerio':
      if (sim.biomaT <= 0) {
        sim.biomaT = sim.az.entre(28, 42);
        abrirTumbas(sim);
      }
      if (sim.biomaT2 <= 0) {
        sim.biomaT2 = sim.az.entre(70, 95);
        sim.niebla = 16;
        sim.aviso(38);
      }
      break;
    case 'minas':
      if (sim.biomaT <= 0) {
        sim.biomaT = sim.az.entre(38, 55);
        soltarVagoneta(sim);
      }
      break;
    case 'abadia':
      if (sim.biomaT <= 0) {
        sim.biomaT = sim.az.entre(40, 55);
        sim.vitrales = 7;
        sim.aviso(41);
      }
      if (sim.vitrales > 0) {
        sim.vitrales -= dt;
        sim.vitralT -= dt;
        if (sim.vitralT <= 0) {
          sim.vitralT = 0.45;
          caerVidrio(sim);
        }
      }
      break;
  }
  for (const e of sim.ent) {
    if (!e.vivo) continue;
    if (e.tipo === ENT.VAGONETA) moverVagoneta(sim, e, dt);
    else if (e.tipo === ENT.PINCHOS) pinchos(sim, e, dt);
    else if (e.tipo === ENT.ARMADURA) armadura(sim, e);
    else if (e.tipo === ENT.CAMPANARIO) campanario(sim, e, dt);
  }
}

/** Se rompió una pared: el grisú revienta y las columnas de hueso tumban el techo. */
export function alRomperBioma(sim: Sim, cx: number, cy: number, tipo: number) {
  const x = cx + 0.5, y = cy + 0.5;
  const fuerza = Math.sqrt(sim.esc.vida);
  if (tipo === C.GRISU) {
    sim.suc.push(S.MARCA, x, y, 4, -1);
    sim.reventones.push({ t: sim.t + 0.55, x, y, r: 2.6, dE: 70 * fuerza, dJ: 16 * sim.esc.dano, clase: 0, rompe: true });
    if (!sim.avisoGrisu) {
      sim.avisoGrisu = true;
      sim.aviso(39);
    }
  } else if (tipo === C.COLUMNA) {
    // Se desploma el techo alrededor (la sombra avisa: un segundo para salir)
    zonaPeligro(sim, x, y, 3, 0, 1.1);
    sim.reventones.push({ t: sim.t + 1.1, x, y, r: 3, dE: 110 * fuerza, dJ: 20 * sim.esc.dano, clase: 6, rompe: false });
    if (!sim.avisoColumna) {
      sim.avisoColumna = true;
      sim.aviso(40);
    }
  }
}

function reventar(sim: Sim, r: Reventon) {
  const g = GB.reset();
  g.empuje = 6;
  g.aturde = r.clase === 6 ? 1.2 : 0.3;
  sim.explosion(r.x, r.y, r.r, r.dE, g, r.clase);
  // (a los jugadores: la explosión enemiga ya dibuja su propio estallido)
  for (const j of sim.J) {
    if (j.estado !== 0) continue;
    if ((j.x - r.x) ** 2 + (j.y - r.y) ** 2 < (r.r + RADIO_JUGADOR) ** 2) sim.herir(j, r.dJ, r.x, r.y);
  }
  if (r.rompe) sim.romperParedes(r.x, r.y, 1.6, null, false, true);
  if (r.clase === 6) sim.suc.push(S.CAMPANA, 1, r.x, r.y);
}

// ------------------------------------------------------------------------------------------------- Cementerio
/** Dos o tres tumbas se abren cerca de alguien: la tierra avisa y salen los muertos. */
function abrirTumbas(sim: Sim) {
  const j = sim.az.uno(sim.vivos());
  const n = 2 + (sim.az.n() < 0.4 ? 1 : 0);
  let abiertas = 0;
  for (let k = 0; k < 24 && abiertas < n; k++) {
    const a = sim.az.n() * Math.PI * 2, d = sim.az.entre(5, 9);
    const p = sim.mapa.abiertaCerca(j.x + Math.cos(a) * d, j.y + Math.sin(a) * d, 2);
    if (!p || sim.flujo.distEn(p.x, p.y) > 20) continue;
    zonaPeligro(sim, p.x, p.y, 1.2, 0, 1.4);
    const cuantos = 3 + Math.floor(sim.az.n() * 3);
    for (let q = 0; q < cuantos; q++) {
      const tipo = q === 0 && sim.cfg.etapa >= 3 && sim.az.n() < 0.3 ? TIPO.zombi_gordo : sim.az.n() < 0.7 ? TIPO.zombi : TIPO.esqueleto;
      sim.reventones.push({ t: sim.t + 1.4 + q * 0.25, x: p.x, y: p.y, r: 0, dE: 0, dJ: 0, clase: 0, rompe: false, sale: tipo });
    }
    abiertas++;
  }
  if (abiertas && !sim.avisoTumbas) {
    sim.avisoTumbas = true;
    sim.aviso(37);
  }
}

// ------------------------------------------------------------------------------------------------- Minas
/** Una vagoneta suelta: aparece en una punta de un pasillo largo que pasa cerca de alguien y rueda hasta chocar. */
function soltarVagoneta(sim: Sim) {
  const m = sim.mapa;
  const j = sim.az.uno(sim.vivos());
  const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let k = 0; k < 4; k++) {
    const [dx, dy] = dirs[(k + Math.floor(sim.az.n() * 4)) % 4];
    // Hacia atrás desde el jugador: ¿hay pasillo largo?
    let x = Math.floor(j.x), y = Math.floor(j.y), n = 0;
    while (n < 14 && !esSolida(m.get(x - dx, y - dy))) {
      x -= dx;
      y -= dy;
      n++;
    }
    if (n < 7) continue;
    const e = nuevaEntidad(sim, ENT.VAGONETA, x + 0.5, y + 0.5);
    e.k = dirs.findIndex((d) => d[0] === dx && d[1] === dy);
    e.est = 0;
    e.t = 0;
    sim.aviso(42);
    return;
  }
}

const VEL_VAGONETA = 7.5;
function moverVagoneta(sim: Sim, e: Entidad, dt: number) {
  const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const [dx, dy] = dirs[e.k] ?? dirs[0];
  e.t += dt;
  // (un segundo de aviso: el traqueteo antes de que arranque)
  if (e.est === 0) {
    if (e.t > 1.2) e.est = 1;
    return;
  }
  const nx = e.x + dx * VEL_VAGONETA * dt, ny = e.y + dy * VEL_VAGONETA * dt;
  if (sim.mapa.solidaEn(nx + dx * 0.45, ny + dy * 0.45) || e.t > 9) {
    // Choca: se hace astillas
    e.vivo = false;
    const g = GB.reset();
    g.empuje = 5;
    sim.explosion(e.x, e.y, 1.6, 30 * Math.sqrt(sim.esc.vida), g, 6);
    sim.romperParedes(e.x + dx * 0.8, e.y + dy * 0.8, 1, null);
    return;
  }
  e.x = nx;
  e.y = ny;
  // Atropella a todos los que estén en la vía (a cada uno una vez)
  const E = sim.E;
  let ya = sim.vagGolpes.get(e.id);
  if (!ya) sim.vagGolpes.set(e.id, (ya = new Set()));
  const g = GB.reset();
  g.empuje = 10;
  g.dx = dx;
  g.dy = dy;
  g.aturde = 0.6;
  for (let i = 0; i < E.max; i++) {
    if (!E.vivo[i] || E.alt[i] < -0.5) continue;
    if ((E.x[i] - e.x) ** 2 + (E.y[i] - e.y) ** 2 > (0.8 + E.r[i]) ** 2) continue;
    if (ya.has(E.uid[i])) continue;
    ya.add(E.uid[i]);
    sim.danar(i, 55 * Math.sqrt(sim.esc.vida), g);
  }
  for (const j of sim.J) {
    if (j.estado !== 0 || j.m.vagoneta === e.id + 1) continue;
    if ((j.x - e.x) ** 2 + (j.y - e.y) ** 2 > (0.8 + RADIO_JUGADOR) ** 2) continue;
    j.m.vagoneta = e.id + 1;
    sim.herir(j, 14 * sim.esc.dano, e.x - dx, e.y - dy);
  }
}

// ------------------------------------------------------------------------------------------------- Abadía
/** Un vidrio de vitral que cae cerca de alguien (la sombra avisa); le pega a todos los que estén debajo. */
function caerVidrio(sim: Sim) {
  const j = sim.az.uno(sim.vivos());
  const x = j.x + j.vx * 0.6 + sim.az.entre(-4, 4), y = j.y + j.vy * 0.6 + sim.az.entre(-4, 4);
  if (sim.mapa.solidaEn(x, y)) return;
  zonaPeligro(sim, x, y, 1.1, 0, 1.0);
  sim.reventones.push({ t: sim.t + 1.0, x, y, r: 1.1, dE: 40 * Math.sqrt(sim.esc.vida), dJ: 7 * sim.esc.dano * sim.calentamiento, clase: 1, rompe: false });
}

/** El campanario: tocarlo llama una oleada grande; al aguantarla suelta dos cofres y oro. */
function campanario(sim: Sim, e: Entidad, dt: number) {
  if (e.est === 0) {
    const j = quienUsa(sim, e, RADIO_ABRIR);
    if (!j) {
      e.prog = Math.max(0, e.prog - dt * 0.35);
      return;
    }
    e.prog += dt / 2;
    if (e.prog < 1) return;
    soltarUso(sim, e);
    e.est = 1;
    e.t = 0;
    sim.oleadaResta += Math.round(40 * (1 + 0.25 * (sim.cfg.etapa - 1)) * (1 + 0.4 * (sim.n - 1)));
    sim.oleadaT = 0;
    sim.suc.push(S.CAMPANA, 0, e.x, e.y);
    sim.suc.push(S.JEFE, 6, e.x, e.y, 0);
    sim.aviso(43);
    return;
  }
  if (e.est === 1) {
    e.t += dt;
    // Cuando ya no quedan de la oleada y pasó un rato, paga
    if (sim.oleadaResta <= 0 && e.t > 25) {
      e.est = 2;
      sim.soltar(REC.COFRE, e.x + 1, e.y, 1);
      sim.soltar(REC.COFRE, e.x - 1, e.y, 1);
      for (let k = 0; k < 4; k++) sim.soltar(REC.ORO, e.x, e.y, 8 + Math.floor(sim.az.n() * 8));
      sim.suc.push(S.CAMPANA, 1, e.x, e.y);
      sim.aviso(44);
    }
  }
}

// ------------------------------------------------------------------------------------------------- Castillo
/** Las trampas de pinchos: suben y bajan cada 3 s (1 s de aviso); pinchan a todos los que estén encima. */
function pinchos(sim: Sim, e: Entidad, dt: number) {
  e.t += dt;
  const ciclo = (e.t + e.k * 0.7) % 3;
  const antes = e.est;
  e.est = ciclo < 1.5 ? 0 : ciclo < 2.4 ? 1 : 2;
  if (e.est !== 2 || antes === 2) return;
  // Suben: pinchan una vez
  sim.suc.push(S.ESPIGA, e.x, e.y, 2);
  const g = GB.reset();
  g.empuje = 2;
  g.sangrado = 4;
  const E = sim.E;
  for (let i = 0; i < E.max; i++) {
    if (!E.vivo[i] || E.alt[i] < -0.5 || TIPOS[E.tipo[i]].vuela) continue;
    if (Math.abs(E.x[i] - e.x) < 0.6 + E.r[i] * 0.5 && Math.abs(E.y[i] - e.y) < 0.6 + E.r[i] * 0.5) sim.danar(i, 30 * Math.sqrt(sim.esc.vida), g);
  }
  for (const j of sim.J) {
    if (j.estado !== 0) continue;
    if (Math.abs(j.x - e.x) < 0.6 && Math.abs(j.y - e.y) < 0.6) sim.herir(j, 8 * sim.esc.dano, e.x, e.y);
  }
}

/** Las armaduras del castillo despiertan cuando alguien pasa cerca: salen como caballeros de la muerte. */
function armadura(sim: Sim, e: Entidad) {
  // (en la primera etapa despiertan más tarde y más débiles: un caballero de la muerte al minuto uno mataba)
  if (e.est !== 0 || sim.t < (sim.cfg.etapa === 1 ? 60 : 15)) return;
  if (!jugadorCerca(sim, e, 3.2)) return;
  e.est = 1;
  e.vivo = false;
  const i = aparecerEnemigo(sim, TIPO.caballero_muerte, e.x, e.y, { elite: sim.cfg.etapa >= 3 ? modsElite(sim) : 0, vida: sim.cfg.etapa === 1 ? 0.45 : 0.8 });
  if (i >= 0) sim.suc.push(S.APARECE, e.x, e.y, TIPO.caballero_muerte, 0);
  if (!sim.avisoArmadura) {
    sim.avisoArmadura = true;
    sim.aviso(45);
  }
}

// ------------------------------------------------------------------------------------------------- Lugares
function jugadorCerca(sim: Sim, e: Entidad, r: number) {
  for (const j of sim.J) if (j.estado === 0 && (j.x - e.x) ** 2 + (j.y - e.y) ** 2 < r * r) return j;
  return null;
}

/** Una celda abierta con `libre` celdas abiertas alrededor, a `min`-`max` del inicio (con camino). */
function lugarAbierto(sim: Sim, min: number, max: number, libre: number): { x: number; y: number } | null {
  const m = sim.mapa;
  const d = m.distancias(m.inicio.x, m.inicio.y);
  for (let k = 0; k < 600; k++) {
    const i = Math.floor(sim.az.n() * m.c.length);
    if (m.c[i] !== C.VACIO || d[i] === 65535 || d[i] < min || d[i] > max) continue;
    const x = i % m.w, y = (i / m.w) | 0;
    let ok = true;
    for (let dy = -libre; dy <= libre && ok; dy++) for (let dx = -libre; dx <= libre; dx++) if (m.get(x + dx, y + dy) !== C.VACIO) ok = false;
    if (ok && !sim.ent.some((e) => e.vivo && Math.hypot(e.x - x - 0.5, e.y - y - 0.5) < 3)) return { x: x + 0.5, y: y + 0.5 };
  }
  return null;
}

/** Celdas de pasillo (abiertas, con roca a dos lados opuestos) lejos del inicio, separadas. */
function lugaresPasillo(sim: Sim, n: number): { x: number; y: number }[] {
  const m = sim.mapa;
  const d = m.distancias(m.inicio.x, m.inicio.y);
  const r: { x: number; y: number }[] = [];
  for (let k = 0; k < 3000 && r.length < n; k++) {
    const i = Math.floor(sim.az.n() * m.c.length);
    if (m.c[i] !== C.VACIO || d[i] === 65535 || d[i] < 7) continue;
    const x = i % m.w, y = (i / m.w) | 0;
    const horiz = esSolida(m.get(x, y - 1)) && esSolida(m.get(x, y + 1)) && !esSolida(m.get(x - 1, y)) && !esSolida(m.get(x + 1, y));
    const vert = esSolida(m.get(x - 1, y)) && esSolida(m.get(x + 1, y)) && !esSolida(m.get(x, y - 1)) && !esSolida(m.get(x, y + 1));
    if (!horiz && !vert) continue;
    if (r.some((p) => Math.hypot(p.x - x, p.y - y) < 6)) continue;
    r.push({ x: x + 0.5, y: y + 0.5 });
  }
  return r;
}
