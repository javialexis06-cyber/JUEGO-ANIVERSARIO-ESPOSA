// Los jefes de cada bioma, con sus fases y sus ataques avisados (la sombra en el piso antes del golpe): el Gólem de
// Osarios, la Abadesa de los Lamentos, el Gusano de Sangre, el Obispo Hueco y el Conde Sangrevil (tres fases).
import { disparoEnemigo, zonaPeligro } from './armas';
import { JEFES_ORDEN, TIPO, TIPO_JEFE, TIPOS } from './catalogo';
import { aparecerEnemigo, invocarEsqueletos } from './enemigos_ia';
import { EST, REC, S, ZONA } from './estado';
import { RADIO_JUGADOR } from './jugador';
import { llamarCampana } from './objetivos';
import type { Sim } from './sim';

const JEFE_DE_BIOMA: Record<string, (typeof JEFES_ORDEN)[number]> = {
  cementerio: 'golem_osarios', catacumbas: 'abadesa', minas: 'gusano_sangre', abadia: 'obispo_hueco', castillo: 'conde',
};

/** Estados del jefe (en E.estado): 0 caminando, 10+ un ataque en curso. */
const A = { NADA: 0, GOLPE: 10, LANZAR: 11, PISOTON: 12, RODAR: 13, GRITO: 14, TELE: 15, BAJO_TIERRA: 16, SALIR: 17, ESCUPIR: 18, FUEGO: 19, PILARES: 20, ESPIRAL: 21, TAJO: 22, LLUVIA: 23, DRENAR: 24 } as const;

export function aparecerJefe(sim: Sim) {
  if (sim.jefe >= 0 || sim.jefeVisto) return;
  sim.jefeVisto = true;
  const id = JEFE_DE_BIOMA[sim.bioma.id] ?? 'golem_osarios';
  const tipo = TIPO_JEFE + JEFES_ORDEN.indexOf(id);
  const vivos = sim.vivos();
  const ref = vivos[0] ?? sim.J[0];
  // A unos 9 m, en un lugar abierto
  let p = null;
  for (let k = 0; k < 24 && !p; k++) {
    const a = sim.az.n() * Math.PI * 2;
    const q = sim.mapa.abiertaCerca(ref.x + Math.cos(a) * 9, ref.y + Math.sin(a) * 9, 3);
    if (q && sim.flujo.distEn(q.x, q.y) < 40) p = q;
  }
  p ??= sim.mapa.abiertaCerca(ref.x + 4, ref.y, 6) ?? { x: ref.x, y: ref.y };
  // Más vida con más jugadores (aparte de la escala general)
  const extra = (1 + 0.75 * (sim.n - 1)) / (1 + 0.38 * (sim.n - 1));
  const i = aparecerEnemigo(sim, tipo, p.x, p.y, { desdeTierra: true, vida: extra * (1 + 0.15 * (sim.cfg.exp.peligro - 1)) });
  if (i < 0) return;
  sim.jefe = i;
  sim.jefeFase = 1;
  sim.fase = 'jefe';
  sim.E.et[i] = 3;
  sim.E.alt[i] = -1;
  // Se despeja un poco el lugar
  sim.romperParedes(p.x, p.y, 2.2, null, true);
  sim.suc.push(S.JEFE, 0, p.x, p.y, tipo);
  sim.aviso(18, tipo);
}

export function jefeMuerto(sim: Sim, i: number) {
  const E = sim.E;
  const x = E.x[i], y = E.y[i];
  sim.suc.push(S.JEFE, 2, x, y, E.tipo[i]);
  sim.soltarAlmas(x, y, 220 + 40 * sim.cfg.etapa);
  for (let k = 0; k < 6; k++) sim.soltar(REC.ORO, x, y, 10 + sim.az.entero(0, 10));
  for (let k = 0; k < 4; k++) sim.soltar(REC.SANGRE, x, y, 3);
  for (let k = 0; k < 3; k++) sim.soltar(REC.HIERRO, x, y, 3);
  for (let k = 0; k < sim.n; k++) sim.soltar(REC.COFRE, x, y, 1);
  sim.jefe = -1;
  sim.obj.hecho = true;
  // Los secuaces se deshacen
  for (let k = 0; k < E.max; k++) if (E.vivo[k] && k !== i && sim.az.n() < 0.6) E.aturdido[k] = 2;
  llamarCampana(sim);
}

/** Cada cuadro, la cabeza del jefe. */
export function moverJefe(sim: Sim, i: number, dt: number) {
  const E = sim.E;
  const id = TIPOS[E.tipo[i]].id;
  // Saliendo de la tierra (la entrada)
  if (E.estado[i] === EST.SALIENDO) {
    E.alt[i] += dt * 0.5;
    if (E.alt[i] >= 0) {
      E.alt[i] = 0;
      E.estado[i] = A.NADA;
    }
    return;
  }
  // Fases por vida
  const frac = E.hp[i] / E.hpMax[i];
  const fases = id === 'conde' ? 3 : 2;
  const nueva = frac < 0.25 && fases === 3 ? 3 : frac < (fases === 3 ? 0.6 : 0.5) ? 2 : 1;
  if (nueva > sim.jefeFase) {
    sim.jefeFase = nueva;
    sim.suc.push(S.JEFE, 1, E.x[i], E.y[i], nueva);
    sim.aviso(19, nueva);
    E.estado[i] = A.NADA;
    E.et[i] = 1.5;
    E.aturdido[i] = 0;
    if (id === 'golem_osarios') invocarEsqueletos(sim, E.x[i], E.y[i], 6);
    if (id === 'obispo_hueco') for (let k = 0; k < 2; k++) aparecerEnemigo(sim, TIPO.inquisidor_muerto, E.x[i] + k * 2 - 1, E.y[i] + 1.5, { desdeTierra: true });
    if (id === 'conde' && nueva === 2) for (let k = 0; k < 2; k++) aparecerEnemigo(sim, TIPO.novia_vampira, E.x[i] + k * 3 - 1.5, E.y[i], {});
  }
  const j = sim.jugadorCercano(E.x[i], E.y[i]);
  if (E.golpe[i] > 0) E.golpe[i] = Math.max(0, E.golpe[i] - dt * 5);
  if (E.ataque[i] > 0) E.ataque[i] = Math.max(0, E.ataque[i] - dt * 1.5);
  if (!j) return;
  const dx = j.x - E.x[i], dy = j.y - E.y[i];
  const dist = Math.hypot(dx, dy) || 0.01;
  const f = sim.jefeFase;
  const dano = E.dano[i];
  E.et[i] -= dt;
  const est = E.estado[i];
  // Contacto
  if (dist < E.r[i] + RADIO_JUGADOR && E.atqT[i] <= 0 && E.alt[i] > -0.3) {
    sim.herir(j, dano * 0.6, E.x[i], E.y[i]);
    E.atqT[i] = 1;
  }
  if (E.atqT[i] > 0) E.atqT[i] -= dt;
  switch (id) {
    case 'golem_osarios':
      return golem(sim, i, j, dx, dy, dist, dt, f, est, dano);
    case 'abadesa':
      return abadesa(sim, i, j, dx, dy, dist, dt, f, est, dano);
    case 'gusano_sangre':
      return gusano(sim, i, j, dx, dy, dist, dt, f, est, dano);
    case 'obispo_hueco':
      return obispo(sim, i, j, dx, dy, dist, dt, f, est, dano);
    default:
      return conde(sim, i, j, dx, dy, dist, dt, f, est, dano);
  }
}

type J = { x: number; y: number; vx: number; vy: number };

/** Camina hacia el jugador (por el campo de flujo si hay paredes en medio). */
function caminar(sim: Sim, i: number, dx: number, dy: number, dist: number, dt: number, vel: number, vuela = false) {
  const E = sim.E;
  let mx = dx / dist, my = dy / dist;
  if (!vuela && dist > 3) {
    const d = { x: 0, y: 0 };
    if (sim.flujo.direccion(E.x[i], E.y[i], d)) {
      mx = d.x;
      my = d.y;
    }
  }
  const nx = E.x[i] + mx * vel * dt, ny = E.y[i] + my * vel * dt;
  if (vuela) {
    E.x[i] = nx;
    E.y[i] = ny;
  } else {
    const p = { x: nx, y: E.y[i] };
    sim.empujarFuera(p, E.r[i] * 0.7, sim.mapa, true);
    p.y = ny;
    sim.empujarFuera(p, E.r[i] * 0.7, sim.mapa, false);
    E.x[i] = p.x;
    E.y[i] = p.y;
  }
  E.vx[i] = mx * vel;
  E.vy[i] = my * vel;
  girarHacia(sim, i, dx, dy, dt);
  E.fase[i] += vel * dt * 1.6;
}

function girarHacia(sim: Sim, i: number, dx: number, dy: number, dt: number) {
  const E = sim.E;
  let d = Math.atan2(dx, dy) - E.rot[i];
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  E.rot[i] += d * Math.min(1, dt * 5);
}

function empezar(sim: Sim, i: number, ataque: number, dur: number) {
  sim.E.estado[i] = ataque;
  sim.E.et[i] = dur;
  sim.E.ataque[i] = 1;
  sim.suc.push(S.JEFE, 3, sim.E.x[i], sim.E.y[i], ataque);
}

/** Abanico de proyectiles enemigos. */
function abanico(sim: Sim, x: number, y: number, ang: number, n: number, apertura: number, vel: number, dano: number, tipo: number, r = 0.3, alcance = 12) {
  for (let k = 0; k < n; k++) {
    const a = n > 1 ? ang - apertura / 2 + (apertura * k) / (n - 1) : ang;
    disparoEnemigo(sim, x, y, a, vel, dano, tipo, alcance, r);
  }
}

function anillo(sim: Sim, x: number, y: number, n: number, giro: number, vel: number, dano: number, tipo: number, r = 0.3) {
  for (let k = 0; k < n; k++) disparoEnemigo(sim, x, y, giro + (k / n) * Math.PI * 2, vel, dano, tipo, 14, r);
}

// ------------------------------------------------------------------------------------------------- Gólem
function golem(sim: Sim, i: number, j: J, dx: number, dy: number, dist: number, dt: number, f: number, est: number, dano: number) {
  const E = sim.E;
  const tipoHueso = TIPO.esqueleto_arquero;
  if (est === A.NADA) {
    caminar(sim, i, dx, dy, dist, dt, E.vel[i] * (f === 2 ? 1.25 : 1));
    if (E.et[i] > 0) return;
    const r = sim.az.n();
    if (dist < 3.5 && r < 0.5) {
      empezar(sim, i, A.GOLPE, 1.0);
      const ang = Math.atan2(dy, dx);
      zonaPeligro(sim, E.x[i] + Math.cos(ang) * 2, E.y[i] + Math.sin(ang) * 2, 2.4, dano * 1.6, 1.0);
    } else if (r < 0.75) {
      empezar(sim, i, A.PISOTON, 1.25);
      zonaPeligro(sim, E.x[i], E.y[i], 4.6, dano * 1.2, 1.25);
    } else if (f === 2 && r < 0.9) {
      empezar(sim, i, A.RODAR, 0.7);
      sim.suc.push(S.SALTO, E.x[i], E.y[i], j.x, j.y, 3);
    } else {
      empezar(sim, i, A.LANZAR, 0.8);
    }
    return;
  }
  if (est === A.RODAR) {
    // Primero apunta (0,7 s) y después rueda en línea recta 1,1 s
    if (E.et[i] > 0 && E.dotT[i] <= 0) {
      girarHacia(sim, i, dx, dy, dt);
      return;
    }
    if (E.dotT[i] <= 0) {
      E.dotT[i] = 1.1;
      E.et[i] = 0;
    }
    E.dotT[i] -= dt;
    const v = 9;
    const ax = E.x[i], ay = E.y[i];
    const p = { x: E.x[i] + Math.sin(E.rot[i]) * v * dt, y: E.y[i] + Math.cos(E.rot[i]) * v * dt };
    sim.empujarFuera(p, E.r[i] * 0.7, sim.mapa, true);
    E.x[i] = p.x;
    E.y[i] = p.y;
    E.fase[i] += v * dt;
    for (const o of sim.J) {
      if (o.estado !== 0 || E.atqT[i] > 0) continue;
      if ((o.x - E.x[i]) ** 2 + (o.y - E.y[i]) ** 2 < (E.r[i] + RADIO_JUGADOR) ** 2) {
        sim.herir(o, dano * 1.4, E.x[i], E.y[i]);
        E.atqT[i] = 0.8;
      }
    }
    const atascado = Math.hypot(E.x[i] - ax, E.y[i] - ay) < v * dt * 0.3;
    if (E.dotT[i] <= 0 || atascado) {
      E.dotT[i] = 0;
      if (atascado) {
        sim.suc.push(S.EXPLOSION, E.x[i], E.y[i], 1.6, 6);
        sim.romperParedes(E.x[i], E.y[i], 1.8, null, false);
      }
      E.estado[i] = A.NADA;
      E.et[i] = 1.6;
    }
    return;
  }
  if (E.et[i] > 0) return;
  if (est === A.LANZAR) {
    const ang = Math.atan2(j.y + j.vy * 0.4 - E.y[i], j.x + j.vx * 0.4 - E.x[i]);
    abanico(sim, E.x[i], E.y[i], ang, f === 2 ? 5 : 3, 0.7, 8, dano * 0.8, tipoHueso, 0.45);
  }
  E.estado[i] = A.NADA;
  E.et[i] = f === 2 ? 1.4 : 2.2;
}

// ------------------------------------------------------------------------------------------------- Abadesa
function abadesa(sim: Sim, i: number, j: J, dx: number, dy: number, dist: number, dt: number, f: number, est: number, dano: number) {
  const E = sim.E;
  const tipoOrbe = TIPO.espectro;
  E.alt[i] = 0.5 + Math.sin(sim.t * 1.5) * 0.15;
  if (est === A.NADA) {
    if (dist > 5) caminar(sim, i, dx, dy, dist, dt, E.vel[i], true);
    else girarHacia(sim, i, dx, dy, dt);
    if (E.et[i] > 0) return;
    const r = sim.az.n();
    if (r < 0.35) {
      empezar(sim, i, A.GRITO, 1.0);
      const ang = Math.atan2(dy, dx);
      for (let k = 1; k <= 3; k++) zonaPeligro(sim, E.x[i] + Math.cos(ang) * k * 2.2, E.y[i] + Math.sin(ang) * k * 2.2, 1.2 + k * 0.4, dano, 1.0);
    } else if (r < 0.6) {
      empezar(sim, i, A.TELE, 0.6);
    } else if (r < 0.8) {
      empezar(sim, i, A.LANZAR, 0.7);
      for (let k = 0; k < 3 + f; k++) {
        const a = (k / (3 + f)) * Math.PI * 2;
        const p = sim.mapa.abiertaCerca(E.x[i] + Math.cos(a) * 2, E.y[i] + Math.sin(a) * 2, 2);
        if (p) aparecerEnemigo(sim, TIPO.espectro, p.x, p.y);
      }
    } else {
      empezar(sim, i, A.ESPIRAL, 0.8);
    }
    return;
  }
  if (E.et[i] > 0) return;
  switch (est) {
    case A.TELE: {
      const a = sim.az.n() * Math.PI * 2;
      const p = { x: j.x + Math.cos(a) * 4, y: j.y + Math.sin(a) * 4 };
      sim.suc.push(S.SALTO, E.x[i], E.y[i], p.x, p.y, 2);
      E.x[i] = p.x;
      E.y[i] = p.y;
      if (f === 2) anillo(sim, p.x, p.y, 10, sim.az.n(), 4.5, dano * 0.6, tipoOrbe, 0.35);
      break;
    }
    case A.ESPIRAL:
      anillo(sim, E.x[i], E.y[i], f === 2 ? 18 : 12, sim.t, 3.8, dano * 0.6, tipoOrbe, 0.35);
      break;
  }
  E.estado[i] = A.NADA;
  E.et[i] = f === 2 ? 1.2 : 2;
}

// ------------------------------------------------------------------------------------------------- Gusano
function gusano(sim: Sim, i: number, j: J, dx: number, dy: number, dist: number, dt: number, f: number, est: number, dano: number) {
  const E = sim.E;
  if (est === A.NADA) {
    E.alt[i] = 0;
    girarHacia(sim, i, dx, dy, dt);
    if (dist > 4) caminar(sim, i, dx, dy, dist, dt, E.vel[i] * 0.6);
    if (E.et[i] > 0) return;
    const r = sim.az.n();
    if (r < 0.45) {
      // Se hunde y viaja bajo tierra
      empezar(sim, i, A.BAJO_TIERRA, 2.2);
    } else {
      empezar(sim, i, A.ESCUPIR, 0.7);
    }
    return;
  }
  if (est === A.BAJO_TIERRA) {
    E.alt[i] = Math.max(-1.2, E.alt[i] - dt * 3);
    // Se mueve rápido hacia el jugador (con polvo)
    const v = 7 * dt;
    E.x[i] += (dx / dist) * Math.min(v, dist);
    E.y[i] += (dy / dist) * Math.min(v, dist);
    E.x[i] = Math.max(2, Math.min(sim.mapa.w - 2, E.x[i]));
    E.y[i] = Math.max(2, Math.min(sim.mapa.h - 2, E.y[i]));
    if (sim.az.n() < dt * 12) sim.suc.push(S.EXCAVA, Math.floor(E.x[i]), Math.floor(E.y[i]), 1, -1);
    if (E.et[i] <= 0) {
      empezar(sim, i, A.SALIR, 0.9);
      E.x[i] = j.x + j.vx * 0.5;
      E.y[i] = j.y + j.vy * 0.5;
      zonaPeligro(sim, E.x[i], E.y[i], 2.6, dano * 1.5, 0.9);
      if (f === 2) {
        const a = sim.az.n() * Math.PI * 2;
        zonaPeligro(sim, j.x + Math.cos(a) * 4, j.y + Math.sin(a) * 4, 2.2, dano * 1.2, 1.1);
      }
    }
    return;
  }
  if (E.et[i] > 0) return;
  switch (est) {
    case A.SALIR: {
      E.alt[i] = 0;
      sim.romperParedes(E.x[i], E.y[i], 1.8, null, false);
      const p = sim.mapa.abiertaCerca(E.x[i], E.y[i], 4);
      if (p) {
        E.x[i] = p.x;
        E.y[i] = p.y;
      }
      sim.suc.push(S.EXPLOSION, E.x[i], E.y[i], 2.6, 4);
      if (f === 2) for (let k = 0; k < 2; k++) aparecerEnemigo(sim, TIPO.lacayo_explosivo, E.x[i] + k - 0.5, E.y[i] + 1, { desdeTierra: true });
      break;
    }
    case A.ESCUPIR: {
      // Bolas de sangre que caen y dejan charcos
      for (let k = 0; k < (f === 2 ? 5 : 3); k++) {
        const x = j.x + sim.az.entre(-3, 3), y = j.y + sim.az.entre(-3, 3);
        if (sim.mapa.solidaEn(x, y)) continue;
        zonaPeligro(sim, x, y, 1.3, dano * 0.9, 1.1);
        const z = sim.nuevaZona();
        if (z) Object.assign(z, { tipo: ZONA.SANGRE, x, y, r: 1.3, dps: dano * 0.5, vida: 6, total: 6, enemiga: true, retraso: 1.1 });
      }
      break;
    }
  }
  E.estado[i] = A.NADA;
  E.et[i] = f === 2 ? 1.2 : 2;
}

// ------------------------------------------------------------------------------------------------- Obispo
function obispo(sim: Sim, i: number, j: J, dx: number, dy: number, dist: number, dt: number, f: number, est: number, dano: number) {
  const E = sim.E;
  const fuego = TIPO.inquisidor_muerto;
  if (est === A.NADA) {
    if (dist > 6) caminar(sim, i, dx, dy, dist, dt, E.vel[i]);
    else if (dist < 3.5) caminar(sim, i, -dx, -dy, dist, dt, E.vel[i] * 0.7);
    else girarHacia(sim, i, dx, dy, dt);
    if (E.et[i] > 0) return;
    const r = sim.az.n();
    if (r < 0.35) empezar(sim, i, A.FUEGO, 0.8);
    else if (r < 0.65) {
      empezar(sim, i, A.PILARES, 1.3);
      for (let k = 0; k < 4 + f; k++) {
        const x = j.x + sim.az.entre(-4, 4), y = j.y + sim.az.entre(-4, 4);
        if (!sim.mapa.solidaEn(x, y)) zonaPeligro(sim, x, y, 1.2, dano * 1.2, 1.3, ZONA.FUEGO);
      }
      zonaPeligro(sim, j.x + j.vx * 0.8, j.y + j.vy * 0.8, 1.3, dano * 1.2, 1.3, ZONA.FUEGO);
    } else if (r < 0.8) {
      empezar(sim, i, A.LANZAR, 1);
      for (let k = 0; k < 4; k++) aparecerEnemigo(sim, TIPO.monje_caido, E.x[i] + sim.az.entre(-2, 2), E.y[i] + sim.az.entre(-2, 2), { desdeTierra: true });
    } else if (f === 2) empezar(sim, i, A.ESPIRAL, 3.5);
    else empezar(sim, i, A.FUEGO, 0.8);
    return;
  }
  if (est === A.ESPIRAL) {
    // Rayos que giran: chorros de fuego en espiral mientras dura
    E.dotT[i] -= dt;
    if (E.dotT[i] <= 0) {
      E.dotT[i] = 0.12;
      const g = sim.t * 2.2;
      for (let k = 0; k < 3; k++) disparoEnemigo(sim, E.x[i], E.y[i], g + (k / 3) * Math.PI * 2, 6, dano * 0.5, fuego, 12, 0.3);
    }
    if (E.et[i] > 0) return;
  }
  if (E.et[i] > 0) return;
  if (est === A.FUEGO) {
    anillo(sim, E.x[i], E.y[i], f === 2 ? 16 : 12, sim.az.n(), 5, dano * 0.7, fuego, 0.3);
    if (f === 2) anillo(sim, E.x[i], E.y[i], 16, 0.2 + sim.az.n(), 3.6, dano * 0.7, fuego, 0.3);
  }
  E.estado[i] = A.NADA;
  E.et[i] = f === 2 ? 1.2 : 1.9;
}

// ------------------------------------------------------------------------------------------------- Conde
function conde(sim: Sim, i: number, j: J, dx: number, dy: number, dist: number, dt: number, f: number, est: number, dano: number) {
  const E = sim.E;
  const sangre = TIPO.vampiro;
  if (f >= 2) E.alt[i] = 0.6 + Math.sin(sim.t * 2) * 0.15;
  if (est === A.NADA) {
    if (dist > 2.2) caminar(sim, i, dx, dy, dist, dt, E.vel[i] * (f === 3 ? 1.3 : 1), f >= 2);
    else girarHacia(sim, i, dx, dy, dt);
    if (E.et[i] > 0) return;
    const r = sim.az.n();
    if (dist < 3.2 && r < 0.4) {
      empezar(sim, i, A.TAJO, 0.75);
      const ang = Math.atan2(dy, dx);
      zonaPeligro(sim, E.x[i] + Math.cos(ang) * 1.6, E.y[i] + Math.sin(ang) * 1.6, 2.2, dano * 1.4, 0.75);
    } else if (r < 0.6) {
      empezar(sim, i, A.TELE, 0.5);
    } else if (r < 0.75) {
      empezar(sim, i, A.LANZAR, 0.6);
      for (let k = 0; k < 6 + 2 * f; k++) aparecerEnemigo(sim, TIPO.murcielago, E.x[i] + sim.az.entre(-1, 1), E.y[i] + sim.az.entre(-1, 1));
    } else if (f >= 2 && r < 0.9) {
      empezar(sim, i, A.LLUVIA, 5);
    } else if (f === 3) {
      empezar(sim, i, A.DRENAR, 1.2);
      zonaPeligro(sim, E.x[i], E.y[i], 5, dano * 1.3, 1.2);
    } else {
      empezar(sim, i, A.ESPIRAL, 0.7);
    }
    return;
  }
  if (est === A.LLUVIA) {
    E.dotT[i] -= dt;
    if (E.dotT[i] <= 0) {
      E.dotT[i] = 0.3;
      for (const o of sim.J) {
        if (o.estado !== 0) continue;
        const x = o.x + sim.az.entre(-3, 3), y = o.y + sim.az.entre(-3, 3);
        if (!sim.mapa.solidaEn(x, y)) zonaPeligro(sim, x, y, 1, dano * 0.8, 0.9, ZONA.SANGRE);
      }
    }
    if (E.et[i] > 0) return;
  }
  if (E.et[i] > 0) return;
  switch (est) {
    case A.TELE: {
      // Aparece detrás del jugador
      const l = Math.hypot(j.vx, j.vy) || 1;
      const p = sim.mapa.abiertaCerca(j.x - (j.vx / l) * 2, j.y - (j.vy / l) * 2, 2) ?? { x: j.x + 2, y: j.y };
      sim.suc.push(S.SALTO, E.x[i], E.y[i], p.x, p.y, 2);
      E.x[i] = p.x;
      E.y[i] = p.y;
      E.et[i] = 0.5;
      E.estado[i] = A.NADA;
      return;
    }
    case A.ESPIRAL:
      anillo(sim, E.x[i], E.y[i], 14 + f * 2, sim.t, 4.6, dano * 0.6, sangre, 0.32);
      break;
    case A.DRENAR: {
      // Se bebe a sus secuaces cercanos y se cura, y suelta una nova carmesí
      let n = 0;
      for (let k = 0; k < E.max && n < 6; k++) {
        if (!E.vivo[k] || k === i || (E.x[k] - E.x[i]) ** 2 + (E.y[k] - E.y[i]) ** 2 > 64) continue;
        sim.matar(k, sim.G.reset());
        n++;
      }
      E.hp[i] = Math.min(E.hpMax[i], E.hp[i] + E.hpMax[i] * 0.03 * n);
      anillo(sim, E.x[i], E.y[i], 20, sim.az.n(), 5.5, dano * 0.6, sangre, 0.35);
      break;
    }
  }
  E.estado[i] = A.NADA;
  E.et[i] = f === 3 ? 0.9 : f === 2 ? 1.3 : 1.8;
}
