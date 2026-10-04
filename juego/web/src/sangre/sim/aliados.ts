// Los aliados: la guardia del monarca, los esqueletos y espíritus del sepulturero, las ánimas del Santo Hueco, los
// encantados por la flauta, las torretas y trampas del herrero, los cuervos y el tótem de la bruja y las espigas del
// campesino. Pelean solos, siguen a su dueño y los enemigos que los tocan los van gastando.
import { TIPOS, esJefe } from './catalogo';
import { ALI, MOV, S, ZONA, type Aliado } from './estado';
import { BIT_ETQ } from './jugador';
import { Golpe, type Sim } from './sim';

const G = new Golpe();
const LISTA: number[] = [];
const P = { x: 0, y: 0 };

function golpe(sim: Sim, a: Aliado, etq: number) {
  G.reset();
  G.j = a.dueno;
  G.aliado = true;
  G.etq = etq | BIT_ETQ.invocacion;
  G.empuje = 2;
  G.callado = sim.az.n() > 0.3;
  return G;
}

export function moverAliados(sim: Sim, dt: number) {
  for (const a of sim.A) {
    if (!a.vivo) continue;
    if (a.vida > 0) {
      a.vida -= dt;
      if (a.vida <= 0) {
        morir(sim, a);
        continue;
      }
    }
    if (a.golpe > 0) a.golpe = Math.max(0, a.golpe - dt * 5);
    if (a.ataque > 0) a.ataque = Math.max(0, a.ataque - dt * 3);
    if (a.atqT > 0) a.atqT -= dt;
    switch (a.tipo) {
      case ALI.CABALLERO:
      case ALI.ESQUELETO:
      case ALI.ESPIRITU:
      case ALI.ANIMA:
      case ALI.ENCANTADO:
        cuerpoACuerpo(sim, a, dt);
        break;
      case ALI.BALLESTERO:
        tirador(sim, a, dt);
        break;
      case ALI.TORRETA:
        torreta(sim, a);
        break;
      case ALI.TRAMPA:
        trampa(sim, a);
        break;
      case ALI.CUERVO:
        cuervo(sim, a, dt);
        break;
      case ALI.TOTEM:
        totem(sim, a);
        break;
      case ALI.ESPIGA:
        espiga(sim, a, dt);
        break;
    }
    // Los enemigos que lo tocan lo gastan (los que tienen vida de verdad)
    if (a.vivo && a.hpMax > 1 && a.hpMax < 900) {
      const E = sim.E;
      const n = sim.rej.circulo(a.x, a.y, a.r + 1);
      for (let k = 0; k < n; k++) {
        const i = sim.rej.fuera[k];
        if (!E.vivo[i]) continue;
        if ((E.x[i] - a.x) ** 2 + (E.y[i] - a.y) ** 2 < (E.r[i] + a.r + 0.1) ** 2) a.hp -= E.dano[i] * dt * 0.55;
      }
      if (a.hp <= 0) morir(sim, a);
    }
  }
}

function morir(sim: Sim, a: Aliado) {
  a.vivo = false;
  sim.suc.push(S.MUERTE, a.x, a.y, 200 + a.tipo, a.id & 0xffff, 0, 0);
  const j = sim.J[a.dueno];
  // Los esqueletos del nigromante revientan al morir
  if (a.tipo === ALI.ESQUELETO && j && j.clase === 'sepulturero' && j.spec === 0) {
    const g = golpe(sim, a, BIT_ETQ.sombra | BIT_ETQ.area);
    sim.explosion(a.x, a.y, 1.8, 15 + j.nivel, g, 5);
  }
  if (a.tipo === ALI.ENCANTADO && a.imita >= 0) sim.soltarAlmas(a.x, a.y, TIPOS[a.imita].xp);
}

/** Busca al enemigo más cercano a este aliado (sin alejarse mucho del dueño). */
function buscar(sim: Sim, a: Aliado, radio: number): number {
  const E = sim.E;
  if (a.blanco >= 0 && E.vivo[a.blanco] && (E.x[a.blanco] - a.x) ** 2 + (E.y[a.blanco] - a.y) ** 2 < radio * radio * 1.4 && sim.az.n() > 0.05) return a.blanco;
  a.blanco = sim.blanco(a.x, a.y, radio, 'cercano');
  return a.blanco;
}

function moverHacia(sim: Sim, a: Aliado, tx: number, ty: number, vel: number, dt: number, atraviesa: boolean) {
  const dx = tx - a.x, dy = ty - a.y;
  const l = Math.hypot(dx, dy);
  if (l < 0.05) {
    a.vx *= 0.7;
    a.vy *= 0.7;
    return;
  }
  const k = Math.min(1, dt * 8);
  a.vx += ((dx / l) * vel - a.vx) * k;
  a.vy += ((dy / l) * vel - a.vy) * k;
  P.x = a.x + a.vx * dt;
  P.y = a.y + a.vy * dt;
  if (!atraviesa) {
    sim.empujarFuera(P, a.r * 0.9, sim.mapa, true);
    if (sim.mapa.solidaEn(P.x, P.y)) {
      P.x = a.x;
      P.y = a.y;
    }
  }
  a.x = P.x;
  a.y = P.y;
  a.rot = Math.atan2(a.vx, a.vy);
  a.fase += Math.hypot(a.vx, a.vy) * dt * 2.6;
}

function cuerpoACuerpo(sim: Sim, a: Aliado, dt: number) {
  const j = sim.J[a.dueno];
  const E = sim.E;
  const atraviesa = a.tipo === ALI.ESPIRITU || a.tipo === ALI.ANIMA;
  const vel = a.tipo === ALI.ANIMA ? 4.8 : a.tipo === ALI.CABALLERO ? 3.9 : 3.5;
  const i = buscar(sim, a, 7);
  const lejosDueno = j ? Math.hypot(j.x - a.x, j.y - a.y) : 0;
  if (i >= 0 && lejosDueno < 11) {
    const d = Math.hypot(E.x[i] - a.x, E.y[i] - a.y);
    if (d > a.r + E.r[i] + 0.3) moverHacia(sim, a, E.x[i], E.y[i], vel, dt, atraviesa);
    else {
      a.vx *= 0.6;
      a.vy *= 0.6;
      a.rot = Math.atan2(E.x[i] - a.x, E.y[i] - a.y);
      if (a.atqT <= 0) {
        a.atqT = a.tipo === ALI.CABALLERO ? 0.75 : 0.85;
        a.ataque = 1;
        const etq = a.tipo === ALI.ESPIRITU || a.tipo === ALI.ANIMA ? BIT_ETQ.sombra : BIT_ETQ.fisico;
        const g = golpe(sim, a, etq);
        g.dx = (E.x[i] - a.x) / (d || 1);
        g.dy = (E.y[i] - a.y) / (d || 1);
        const antes = E.vivo[i];
        sim.danar(i, a.dano, g);
        // Juramento del monarca: los caballeros curan a su rey cuando matan
        if (antes && !E.vivo[i] && j && a.tipo === ALI.CABALLERO && j.don('juramento')) sim.curar(j, j.don('juramento'));
      }
    }
  } else if (j) {
    // Seguir al dueño (detrás, un poco a un lado)
    const ang = Math.atan2(j.fy, j.fx) + Math.PI + ((a.id % 5) - 2) * 0.45;
    const tx = j.x + Math.cos(ang) * 1.8, ty = j.y + Math.sin(ang) * 1.8;
    if (Math.hypot(tx - a.x, ty - a.y) > 0.5) moverHacia(sim, a, tx, ty, Math.min(vel * 1.4, 5.5), dt, atraviesa);
    else {
      a.vx *= 0.7;
      a.vy *= 0.7;
    }
    // Si quedó muy lejos (encerrado), aparece al lado
    if (lejosDueno > 16) {
      a.x = j.x;
      a.y = j.y;
    }
  }
}

function disparo(sim: Sim, a: Aliado, i: number, vel: number, dano: number, quema = 0) {
  const E = sim.E;
  const pr = sim.nuevoProyectil();
  if (!pr) return;
  const ang = Math.atan2(E.y[i] - a.y, E.x[i] - a.x);
  Object.assign(pr, {
    dueno: a.dueno, ranura: -1, arma: -4, mov: MOV.TORRETA, x: a.x, y: a.y, z: 0.8, ang, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, r: 0.2,
    dano, perfora: 1, rebotes: 0, flags: 0, vida: 10 / vel, etq: BIT_ETQ.distancia | BIT_ETQ.construccion, aliado: true, quema, blanco: -1,
  });
  a.rot = Math.atan2(E.x[i] - a.x, E.y[i] - a.y);
  a.ataque = 1;
}

function tirador(sim: Sim, a: Aliado, dt: number) {
  const j = sim.J[a.dueno];
  const i = buscar(sim, a, 8);
  if (j) {
    const ang = Math.atan2(j.fy, j.fx) + Math.PI + ((a.id % 5) - 2) * 0.5;
    const tx = j.x + Math.cos(ang) * 2, ty = j.y + Math.sin(ang) * 2;
    if (Math.hypot(tx - a.x, ty - a.y) > 0.6) moverHacia(sim, a, tx, ty, 4.4, dt, false);
    if (Math.hypot(j.x - a.x, j.y - a.y) > 16) {
      a.x = j.x;
      a.y = j.y;
    }
  }
  if (i >= 0 && a.atqT <= 0) {
    a.atqT = 1.1;
    disparo(sim, a, i, 18, a.dano);
  }
}

function torreta(sim: Sim, a: Aliado) {
  if (a.atqT > 0) return;
  const i = buscar(sim, a, 9);
  if (i < 0) {
    a.atqT = 0.25;
    return;
  }
  const j = sim.J[a.dueno];
  a.atqT = j && j.clase === 'herrero' && j.spec === 0 ? 0.55 : 0.8;
  disparo(sim, a, i, 20, a.dano, a.a);
}

function trampa(sim: Sim, a: Aliado) {
  if (a.atqT > 0) return;
  const E = sim.E;
  const n = sim.rej.circulo(a.x, a.y, a.r + 0.8);
  for (let k = 0; k < n; k++) {
    const i = sim.rej.fuera[k];
    if (!E.vivo[i] || TIPOS[E.tipo[i]].vuela) continue;
    if ((E.x[i] - a.x) ** 2 + (E.y[i] - a.y) ** 2 > (a.r + E.r[i]) ** 2) continue;
    const g = golpe(sim, a, BIT_ETQ.construccion | BIT_ETQ.fisico);
    g.aturde = a.b === 1 ? 1.2 : 0.3;
    g.sangrado = a.b === 1 ? 3 : 2;
    g.callado = false;
    sim.danar(i, a.dano, g);
    a.ataque = 1;
    a.atqT = 1.2;
    a.a--;
    sim.suc.push(S.EXPLOSION, a.x, a.y, 0.5, 6);
    if (a.a <= 0) morir(sim, a);
    return;
  }
}

function cuervo(sim: Sim, a: Aliado, dt: number) {
  const j = sim.J[a.dueno];
  if (!j) return;
  a.a += dt * 2.3;
  const r = 1.4 + Math.sin(sim.t * 1.7 + a.id) * 0.25;
  const tx = j.x + Math.cos(a.a) * r, ty = j.y + Math.sin(a.a) * r;
  // Picotazo: se lanza al enemigo y vuelve
  const E = sim.E;
  if (a.atqT <= 0) {
    const i = sim.blanco(a.x, a.y, 2.8, 'cercano');
    if (i >= 0) {
      a.atqT = 0.7;
      a.ataque = 1;
      a.x = (a.x + E.x[i]) / 2;
      a.y = (a.y + E.y[i]) / 2;
      const g = golpe(sim, a, BIT_ETQ.sombra);
      g.maldicion = 1;
      g.empuje = 0.5;
      sim.danar(i, a.dano, g);
    } else a.atqT = 0.3;
  }
  a.x += (tx - a.x) * Math.min(1, dt * 6);
  a.y += (ty - a.y) * Math.min(1, dt * 6);
  a.rot = a.a + Math.PI / 2;
  a.fase += dt * 9;
  // La cuervera: los cuervos le traen las almas y el oro cercanos
  if (j.spec === 0 && j.clase === 'bruja' && (a.id + Math.floor(sim.t * 2)) % 6 === 0) {
    for (const r of sim.R) {
      if (!r.vivo || r.hacia >= 0 || r.tipo > 3) continue;
      if ((r.x - j.x) ** 2 + (r.y - j.y) ** 2 < 36) {
        r.hacia = j.i;
        break;
      }
    }
  }
}

function totem(sim: Sim, a: Aliado) {
  if (a.atqT > 0) return;
  a.atqT = 1;
  const E = sim.E;
  sim.enRadio(a.x, a.y, 6, LISTA);
  sim.suc.push(S.ONDA, a.x, a.y, 6, -9);
  for (const i of [...LISTA]) {
    if (!E.vivo[i]) continue;
    E.lento[i] = Math.max(E.lento[i], 0.4);
    E.lentoT[i] = 1.2;
    const g = golpe(sim, a, BIT_ETQ.sombra);
    g.maldicion = 1;
    g.callado = true;
    sim.danar(i, a.dano, g);
  }
}

function espiga(sim: Sim, a: Aliado, dt: number) {
  const j = sim.J[a.dueno];
  if (!j) return;
  const antes = a.a;
  a.a = Math.min(1, a.a + dt / 4);
  if (antes < 1 && a.a >= 1) {
    // Madura: el pirómano la vuelve una paca ardiendo
    if (j.spec === 2) {
      const z = sim.nuevaZona();
      if (z) Object.assign(z, { tipo: ZONA.FUEGO, dueno: j.i, x: a.x, y: a.y, r: 1.6, dps: 8 + j.nivel * 0.6, vida: 6, total: 6, quema: 4, etq: BIT_ETQ.fuego });
    }
  }
  if (a.a < 1) return;
  for (const o of sim.J) {
    if (o.estado !== 0 || (o.x - a.x) ** 2 + (o.y - a.y) ** 2 > 0.8 * 0.8) continue;
    sim.curar(o, o.hpMax * (0.06 + 0.04 * j.don('pan_casero')));
    if (j.spec === 0) {
      const g = golpe(sim, a, BIT_ETQ.fisico | BIT_ETQ.area);
      g.aliado = false;
      g.callado = false;
      sim.explosion(a.x, a.y, 2.2, 20 + 2 * j.nivel, g, 6);
    }
    a.vivo = false;
    sim.suc.push(S.ESPIGA, a.x, a.y, 1);
    return;
  }
}

export { esJefe };
