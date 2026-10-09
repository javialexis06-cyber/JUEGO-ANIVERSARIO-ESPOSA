// Lo que hace que cada clase se juegue distinto: su mecánica propia, su habilidad activa, sus especializaciones y sus
// dones; además los efectos de las reliquias, las bendiciones y los objetos especiales. La simulación llama estos
// ganchos en los momentos justos (al golpear, al matar, al recibir daño, al recoger, al excavar…).
import { F, type DanoEtiqueta, type Stats } from '../tipos';
import { ponerTorreta, ponerZona, zonaPeligro } from './armas';
import { TIPO, TIPOS, TIPO_ALTAR, esJefe } from './catalogo';
import { ALI, ENT, Entidad, MOV, type Proyectil, S, ZONA } from './estado';
import { BIT_ETQ, RADIO_JUGADOR, type Jugador } from './jugador';
import { encolarCofre, encolarEquipo } from './opciones';
import { Golpe } from './golpe';
import type { Sim } from './sim';

const LISTA: number[] = [];

// ------------------------------------------------------------------------------------------------- Estadísticas
/** Lo que la clase, la especialización y los dones le suman a las estadísticas. */
export function statsDeClase(j: Jugador, st: Stats, etq: DanoEtiqueta) {
  const d = (id: string) => j.don(id);
  const suma = (e: keyof DanoEtiqueta, v: number) => (etq[e] = (etq[e] ?? 0) + v);
  switch (j.clase) {
    case 'monarca':
      if (j.spec === 1) suma('cuerpo', 0.1);
      st.oro += 0.15 * d('tesoro_real');
      break;
    case 'campesino':
      st.excavar += j.spec === 1 ? 2 : 1;
      st.excavar += 0.25 * d('manos_callosas');
      st.armadura += 2 * d('piel_curtida');
      break;
    case 'prisionero':
      st.roboVida += 0.02 * d('sed_sangre');
      st.velocidad += 0.1 * d('cadenas_rotas');
      st.vida += 12 * d('piel_dura');
      suma('cuerpo', 0.1 * d('grilletes_pesados'));
      break;
    case 'caballero':
      st.armadura += 3 * d('placas');
      st.vida += 15 * d('juramento_hierro');
      st.curacion += 0.1 * d('fe');
      st.regen += 0.3 * d('fe');
      if (j.spec === 1) suma('sagrado', 0.25);
      break;
    case 'cazador':
      st.critico += 0.08 * d('ojo_cazador');
      st.danoCritico += 0.2 * d('plata');
      st.velocidad += 0.08 * d('pies_ligeros');
      st.danoElite += 0.2 * d('caza_mayor');
      if (j.spec === 2) suma('sagrado', 0.3);
      break;
    case 'herrero':
      st.armadura += 2 * d('yelmo_forjado');
      st.area += 0.12 * d('martillo_pesado');
      suma('fuego', 0.15 * d('fragua'));
      suma('construccion', 0.15 * d('fragua'));
      if (j.spec === 1) suma('cuerpo', 0.2);
      break;
    case 'alquimista':
      st.area += 0.1 * d('frascos_reforzados');
      st.duracion += 0.15 * d('destilado');
      st.cadencia += 0.1 * d('mano_firme');
      st.regen += 0.4 * d('antidoto');
      break;
    case 'sepulturero':
      st.excavar += 0.3 * d('pala_rapida');
      suma('sombra', 0.15 * d('frio_tumba'));
      st.experiencia += 0.1 * d('velatorio');
      break;
    case 'inquisidor':
      suma('sagrado', 0.25 * d('penitencia'));
      st.regen += 0.5 * d('vigilia');
      st.danoElite += 0.15 * d('martillo_herejes');
      break;
    case 'verdugo':
      suma('cuerpo', 0.1 * d('filo'));
      st.vida += 15 * d('capucha');
      break;
    case 'bruja':
      st.suerte += 10 * d('ojos_noche');
      st.luz += 0.15 * d('ojos_noche');
      st.velocidad += 0.08 * d('escoba');
      st.vida += 10 * d('brebaje');
      st.regen += 0.3 * d('brebaje');
      if (j.spec === 2) suma('veneno', 0.3);
      break;
    case 'juglar':
      st.cadencia += 0.1 * d('virtuoso');
      st.experiencia += 0.1 * d('publico');
      st.velocidad += 0.08 * d('pies_danzarines');
      st.esquiva += 0.05 * d('pies_danzarines');
      st.area += 0.15 * d('afinado');
      break;
  }
}

/** Lo que pasa al empezar cada etapa. */
export function alEmpezarEtapa(sim: Sim, j: Jugador) {
  j.m.escudo = j.clase === 'caballero' && j.spec !== 2 ? (j.spec === 0 ? 2 : 1) : 0;
  j.m.escudoT = 0;
  j.m.cancion = 0;
  j.m.cancionT = 0;
  j.m.ovacion = 0;
  j.m.fervor = 0;
  j.m.embestidaT = 0;
  j.m.oroRecluta = j.m.oroRecluta ?? 0;
  if (j.objeto('dados_cargados')) j.tiradas++;
  void sim;
}

// ------------------------------------------------------------------------------------------------- Cada cuadro
export function tick(sim: Sim, j: Jugador, dt: number) {
  const m = j.m;
  if (j.auraT > 0) {
    j.auraT -= dt;
    if (j.auraCura > 0) sim.curar(j, j.hpMax * j.auraCura * dt, true);
    if (j.auraT <= 0) j.auraDano = j.auraVel = j.auraCura = 0;
  }
  if (j.habT > 0) j.habT -= dt;
  if (m.cazaT > 0) m.cazaT -= dt;
  if (m.sombraT > 0) m.sombraT -= dt;
  m.lentoT = (m.lentoT ?? 0) - dt;
  const lento = m.lentoT <= 0;
  if (lento) m.lentoT = 0.5;
  switch (j.clase) {
    case 'monarca':
      monarcaTick(sim, j);
      break;
    case 'prisionero':
      if (j.spec === 0) {
        m.sinMatar = (m.sinMatar ?? 0) + dt;
        if (m.sinMatar > 2 && m.ovacion > 0) m.ovacion = Math.max(0, m.ovacion - dt);
      }
      break;
    case 'caballero':
      if (j.spec !== 2) {
        const max = j.spec === 0 ? 2 : 1;
        if (m.escudo < max) {
          m.escudoT += dt;
          if (m.escudoT >= Math.max(2, 6 - j.don('escudo_rapido'))) {
            m.escudoT = 0;
            m.escudo++;
          }
        }
      }
      break;
    case 'herrero':
      if (j.spec === 2) {
        m.trampaT = (m.trampaT ?? 0) - dt;
        if (m.trampaT <= 0 && Math.hypot(j.vx, j.vy) > 1) {
          m.trampaT = 4;
          let n = 0;
          for (const a of sim.A) if (a.vivo && a.tipo === ALI.TRAMPA && a.dueno === j.i && a.b === 1) n++;
          if (n < 8) ponerTrampa(sim, j, j.x - j.fx * 0.6, j.y - j.fy * 0.6, 1);
        }
      }
      break;
    case 'inquisidor':
      if (lento) auraSagrada(sim, j);
      if (j.spec === 2) j.hp = Math.max(1, j.hp - dt);
      if (j.spec === 0) {
        m.juezT = (m.juezT ?? 0) - dt;
        if (m.juezT <= 0) {
          m.juezT = 6;
          const i = sim.blanco(j.x, j.y, 8, 'fuerte');
          if (i >= 0) {
            sim.E.juzgado[i] = 6;
            sim.suc.push(S.MARCA, sim.E.x[i], sim.E.y[i], 2, i);
          }
        }
      }
      m.fervorT = (m.fervorT ?? 0) + dt;
      if (m.fervorT > 3 && m.fervor > 0) {
        m.fervorT = 2;
        m.fervor--;
      }
      break;
    case 'verdugo':
      m.miedoT = (m.miedoT ?? 0) - dt;
      if (m.miedoT <= 0) {
        m.miedoT = 1;
        const r = 2.5 + j.don('terror');
        sim.enRadio(j.x, j.y, r, LISTA);
        for (const i of LISTA) {
          if (sim.E.elite[i] || esJefe(sim.E.tipo[i]) || sim.E.tipo[i] === TIPO_ALTAR) continue;
          if (sim.az.n() < 0.25 + 0.1 * j.don('terror')) sim.E.miedo[i] = 1.5;
        }
      }
      break;
    case 'bruja':
      mantenerCuervos(sim, j);
      if (j.spec === 1) {
        m.lanzaT = (m.lanzaT ?? 0) - dt;
        if (m.lanzaT <= 0) {
          const i = sim.blanco(j.x, j.y, 9, 'cercano');
          if (i >= 0 && j.hp > j.hpMax * 0.25) {
            m.lanzaT = 5;
            j.hp -= j.hpMax * 0.03;
            const ang = Math.atan2(sim.E.y[i] - j.y, sim.E.x[i] - j.x);
            proyectilDeClase(sim, j, ang, 30 + 4 * j.nivel, 16, BIT_ETQ.sangre | BIT_ETQ.sombra, 3, 'p_sangre');
          } else m.lanzaT = 0.5;
        }
      }
      break;
    case 'juglar':
      juglarTick(sim, j, dt);
      break;
  }
  // Reliquias y bendiciones con reloj
  if (j.tiene('rayo_10')) {
    m.rayoT = (m.rayoT ?? 0) - dt;
    if (m.rayoT <= 0) {
      m.rayoT = 8;
      const i = sim.blanco(j.x, j.y, 9, 'fuerte');
      if (i >= 0) caerRayo(sim, j, sim.E.x[i], sim.E.y[i], 1.4, 40 + 4 * j.nivel, BIT_ETQ.sagrado);
    }
  }
  if (j.bend('brasero') && lento) {
    const g = golpeSimple(j, BIT_ETQ.fuego);
    sim.enRadio(j.x, j.y, 1.6, LISTA);
    for (const i of [...LISTA]) sim.danar(i, 1.5 * j.bend('brasero') + j.nivel * 0.15, g);
  }
  if (j.milagros.includes('rio_carmesi')) {
    m.rioT = (m.rioT ?? 0) - dt;
    if (m.rioT <= 0) {
      m.rioT = 8;
      sim.enRadio(j.x, j.y, 12, LISTA);
      const g = golpeSimple(j, BIT_ETQ.sangre);
      for (const i of [...LISTA]) if (sim.E.sangradoT[i] > 0) {
        sim.suc.push(S.EXPLOSION, sim.E.x[i], sim.E.y[i], 0.8, 4);
        sim.danar(i, sim.E.sangrado[i] * 6 + 10, g);
      }
    }
  }
  if (j.milagros.includes('lluvia_ceniza')) {
    m.cenizaT = (m.cenizaT ?? 0) - dt;
    if (m.cenizaT <= 0) {
      m.cenizaT = 3;
      const i = sim.blanco(j.x, j.y, 9, 'azar');
      if (i >= 0) caerRayo(sim, j, sim.E.x[i], sim.E.y[i], 1.4, 30 + 3 * j.nivel, BIT_ETQ.fuego);
    }
  }
  if (j.milagros.includes('noche_hueca')) {
    m.huecaT = (m.huecaT ?? 0) - dt;
    if (m.huecaT <= 0) {
      m.huecaT = 10;
      sim.suc.push(S.ONDA, j.x, j.y, 6, -3);
      sim.enRadio(j.x, j.y, 6, LISTA);
      for (const i of LISTA) if (!esJefe(sim.E.tipo[i])) sim.E.aturdido[i] = Math.max(sim.E.aturdido[i], 2);
    }
  }
  if (j.tiene('eclipse_propio') && lento) {
    let luz = false;
    for (const a of sim.mapa.antorchas) if ((a.cx - j.x) ** 2 + (a.cy - j.y) ** 2 < 49) {
      luz = true;
      break;
    }
    m.oscuro = !luz || sim.eclipse > 0 ? 1 : 0;
  }
}

/** Golpe simple de un efecto de clase (no cuenta para ningún arma). */
function golpeSimple(j: Jugador, etq: number, empuje = 0) {
  const g = new Golpe();
  g.j = j.i;
  g.etq = etq;
  g.empuje = empuje;
  g.callado = false;
  return g;
}

function caerRayo(sim: Sim, j: Jugador, x: number, y: number, r: number, dano: number, etq: number) {
  sim.suc.push(S.RAYO, x, y, r, -1 - (etq & BIT_ETQ.fuego ? 1 : 0));
  const g = golpeSimple(j, etq, 2);
  sim.explosion(x, y, r, dano, g, etq & BIT_ETQ.fuego ? 0 : 1);
}

function proyectilDeClase(sim: Sim, j: Jugador, ang: number, dano: number, vel: number, etq: number, perfora: number, _tipo: string) {
  const pr = sim.nuevoProyectil();
  if (!pr) return;
  Object.assign(pr, {
    dueno: j.i, ranura: -1, arma: -2, mov: MOV.RECTO, x: j.x, y: j.y, z: 0.7, ang, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, r: 0.3, dano, perfora,
    rebotes: 0, flags: 0, vida: 10 / vel, area: 0, etq, blanco: -1,
  });
}

// ------------------------------------------------------------------------------------------------- Daño
/** Multiplicador de daño propio de la clase y de los objetos especiales. */
export function multDano(sim: Sim, j: Jugador, i: number, g: Golpe): number {
  const E = sim.E;
  let m = 1;
  const m_ = j.m;
  switch (j.clase) {
    case 'monarca':
      if (j.don('corona_hierro')) m += 0.06 * j.don('corona_hierro') * contarAliados(sim, j, ALI.CABALLERO, ALI.BALLESTERO);
      if (j.spec === 1) m += m_.reyBonus ?? 0;
      break;
    case 'prisionero': {
      const falta = 1 - j.hp / j.hpMax;
      m += Math.min(0.75 + 0.25 * j.don('rabia'), falta * (1 + 0.25 * j.don('rabia')));
      if (j.spec === 0) m += (m_.ovacion ?? 0) * 0.01;
      break;
    }
    case 'cazador':
      if (j.spec === 1 && E.marca[i] > 0 && (E.elite[i] || esJefe(E.tipo[i]))) m += 0.4;
      break;
    case 'alquimista':
      if (j.spec === 2) m += Math.min(0.4, (j.totalOro / 25) * 0.01);
      break;
    case 'sepulturero':
      if (j.spec === 2 && !TIPOS[E.tipo[i]].vivo) m += 0.25;
      break;
    case 'inquisidor':
      m += (m_.fervor ?? 0) * 0.01;
      if (j.spec === 2) m += Math.floor((1 - j.hp / j.hpMax) * 10) * 0.08;
      break;
    case 'verdugo':
      if (j.don('trofeos')) m += Math.min(0.3, ((m_.ejecuciones ?? 0) / 10) * 0.01);
      break;
  }
  if (j.objeto('saco_avaro')) m += Math.floor(j.totalOro / 100) * 0.03;
  if (j.objeto('cadena_condenado') && j.hp < j.hpMax * 0.5) m += 0.4;
  if (j.objeto('reliquia_peregrino')) m += 0.03 * (sim.cfg.etapa - 1);
  if (j.tiene('hierro_dano')) m += Math.min(0.4, ((j.hierro + j.hierroSeguro) / 5) * 0.01);
  if (j.tiene('eclipse_propio') && m_.oscuro) m += 0.3;
  void g;
  return m;
}

export function criticoExtra(sim: Sim, j: Jugador, i: number, g: Golpe): number {
  let c = 0;
  if (j.clase === 'cazador' && sim.E.marca[i] > 0) c += 0.3 + 0.1 * j.don('marca_profunda');
  if (j.clase === 'verdugo' && j.spec === 2 && (j.m.sombraT ?? 0) > 0) c += 0.5;
  void g;
  return c;
}

/** Ajustes al golpe de cualquier arma de este jugador (fuego del pirómano, sangrado del carnicero, bendiciones…). */
export function modGolpe(sim: Sim, j: Jugador, g: Golpe) {
  if (j.clase === 'campesino' && j.spec === 2) g.quema += 2;
  else if (j.clase === 'verdugo') {
    if (j.spec === 0) g.sangrado *= 2;
    else if (j.spec === 1) {
      g.quema += 3;
      g.etq |= BIT_ETQ.fuego;
    }
  } else if (j.clase === 'alquimista' && j.spec === 0) g.veneno *= 2;
  else if (j.clase === 'prisionero') g.empuje *= 1 + 0.15 * j.don('grilletes_pesados');
  // Bendiciones de azar
  const b1 = j.bend('herida_abierta'), b2 = j.bend('pira'), b3 = j.bend('escarcha');
  if (b1 && sim.az.n() < 0.07 + 0.08 * b1) g.sangrado = Math.max(g.sangrado, 3 + 2 * b1);
  if (b2 && sim.az.n() < 0.07 + 0.08 * b2) g.quema = Math.max(g.quema, 3 + 2 * b2);
  if (b3 && sim.az.n() < 0.05 + 0.07 * b3) g.lento = Math.max(g.lento, 0.6);
}

/** Velocidad de ataque extra temporal. */
export function cadenciaExtra(sim: Sim, j: Jugador) {
  void sim;
  return (j.m.cazaT ?? 0) > 0 ? 0.15 : 0;
}

export function multConstruccion(j: Jugador) {
  return 1 + 0.25 * j.don('engranajes') + 0.15 * j.don('fragua') + (j.etq.construccion ?? 0) + j.st.dano;
}

export function perforaExtra(j: Jugador) {
  return j.clase === 'cazador' && j.spec === 0 ? 1 : 0;
}

/** El mayor nivel de un don entre todos los jugadores (la maldición la pone la bruja, la aprovechan todos). */
export function donDeGrupo(sim: Sim, id: string) {
  let n = 0;
  for (const j of sim.J) n = Math.max(n, j.don(id));
  return n;
}

/** Después de cada golpe: marcas, maldiciones, mezclas, robo de vida compartido, chispas de tormenta. */
export function alGolpear(sim: Sim, j: Jugador, i: number, real: number, g: Golpe, esCrit: boolean) {
  const E = sim.E;
  if (!E.vivo[i] && j.clase !== 'alquimista') return;
  switch (j.clase) {
    case 'cazador':
      if (g.etq & BIT_ETQ.distancia && !g.aliado) {
        if (!(E.marca[i] > 0)) sim.suc.push(S.MARCA, E.x[i], E.y[i], 0, i);
        E.marca[i] = 5 + 3 * j.don('marca_profunda');
      }
      if (j.spec === 1 && esCrit && TIPOS[E.tipo[i]].vampiro && E.vivo[i]) {
        const g2 = golpeSimple(j, BIT_ETQ.sagrado);
        E.hp[i] = 0.01;
        sim.danar(i, 1, g2);
      }
      break;
    case 'alquimista':
      if (g.sustancia && E.vivo[i]) mezclar(sim, j, i, g.sustancia);
      break;
    case 'prisionero':
      if (j.spec === 2 && j.st.roboVida > 0) {
        for (const o of sim.J) if (o !== j && o.estado === 0 && (o.x - j.x) ** 2 + (o.y - j.y) ** 2 < 36) sim.curar(o, real * j.st.roboVida * 0.3, true);
      }
      break;
    case 'bruja':
      if (j.spec === 1 && E.maldicion[i] > 0) sim.curar(j, real * 0.04, true);
      break;
  }
  // Maldición: la bruja maldice con todo, los demás solo con armas malditas
  const mald = (j.clase === 'bruja' && !g.aliado ? 1 : 0) + g.maldicion;
  if (mald > 0 && E.vivo[i] && !(E.condenaT[i] > 0)) {
    E.maldicion[i] = Math.min(10, E.maldicion[i] + mald);
    if (E.maldicion[i] >= 10) {
      E.condenaT[i] = 2;
      sim.suc.push(S.CONDENA, E.x[i], E.y[i]);
    }
  }
  if (esCrit && j.tiene('ojo_tormenta') && sim.az.n() < 0.5) {
    const o = sim.blanco(E.x[i], E.y[i], 4, 'cercano');
    if (o >= 0 && o !== i) {
      sim.suc.push(S.CADENA, E.x[i], E.y[i], E.x[o], E.y[o], -1);
      sim.danar(o, real * 0.4 + 5, golpeSimple(j, BIT_ETQ.fisico));
    }
  }
}

/** La condena de la bruja: el maldito estalla. */
export function condenar(sim: Sim, i: number) {
  const E = sim.E;
  if (!E.vivo[i]) return;
  const quien = E.ultimo[i] >= 0 ? sim.J[E.ultimo[i]] : sim.J.find((j) => j.clase === 'bruja') ?? null;
  const mult = 1 + 0.5 * donDeGrupo(sim, 'condena_mayor');
  const dano = (40 + Math.min(E.hpMax[i] * 0.1, 300) + (quien ? quien.nivel * 3 : 0)) * mult;
  const g = new Golpe();
  g.j = quien ? quien.i : -1;
  g.etq = BIT_ETQ.sombra;
  g.empuje = 3;
  E.maldicion[i] = 0;
  const x = E.x[i], y = E.y[i];
  sim.explosion(x, y, 2.2, dano, g, 5);
  if (sim.J.some((j) => j.clase === 'bruja' && j.spec === 2)) {
    const z = sim.nuevaZona();
    if (z) Object.assign(z, { tipo: ZONA.PANTANO, dueno: g.j, x, y, r: 1.8, dps: 6, vida: 4, total: 4, lento: 0.45, veneno: 4, etq: BIT_ETQ.veneno });
  }
}

/** Mezclas del alquimista: dos sustancias distintas seguidas en el mismo enemigo provocan una reacción. */
function mezclar(sim: Sim, j: Jugador, i: number, sus: number) {
  const E = sim.E;
  const antes = E.mezclaT[i] > 0 ? E.mezcla[i] : 0;
  const nueva = sus & ~antes;
  if (antes && nueva) {
    const combo = antes | sus;
    const mult = (1 + 0.3 * j.don('catalizador')) * (j.spec === 1 ? 2 : 1);
    const x = E.x[i], y = E.y[i];
    E.mezcla[i] = 0;
    E.mezclaT[i] = 0;
    const g = golpeSimple(j, BIT_ETQ.area);
    if (combo & 1 && combo & 2) {
      sim.suc.push(S.REACCION, x, y, 0);
      g.etq |= BIT_ETQ.fuego;
      g.empuje = 4;
      sim.explosion(x, y, 2, (25 + 2 * j.nivel) * mult, g, 0);
      if (j.spec === 1) sim.romperParedes(x, y, 1.4, j);
    } else if (combo & 4 && combo & 2) {
      sim.suc.push(S.REACCION, x, y, 1);
      sim.enRadio(x, y, 2.2, LISTA);
      for (const o of LISTA) E.aturdido[o] = Math.max(E.aturdido[o], 1);
      sim.explosion(x, y, 2.2, (10 + j.nivel) * mult, g, 3);
    } else if (combo & 1 && combo & 4) {
      sim.suc.push(S.REACCION, x, y, 2);
      E.cristal[i] = 1;
    } else if (combo & 8 && combo & 2) {
      sim.suc.push(S.REACCION, x, y, 3);
      g.etq |= BIT_ETQ.sagrado;
      sim.explosion(x, y, 1.6, (20 + 2 * j.nivel) * mult, g, 1);
      for (const o of sim.J) if (o.estado === 0 && (o.x - x) ** 2 + (o.y - y) ** 2 < 9) sim.curar(o, 3 * mult);
    } else {
      sim.suc.push(S.REACCION, x, y, 4);
      E.lento[i] = 0.8;
      E.lentoT[i] = 2;
      E.veneno[i] *= 2;
    }
    return;
  }
  E.mezcla[i] |= sus;
  E.mezclaT[i] = 3;
}

/** Ejecución del verdugo (y de las armas que rematan). */
export function revisarEjecucion(sim: Sim, j: Jugador, i: number, g: Golpe) {
  const E = sim.E;
  if (!E.vivo[i] || esJefe(E.tipo[i]) || E.tipo[i] === TIPO_ALTAR) return;
  let umbral = g.ejecutaExtra;
  if (j.clase === 'verdugo') umbral += (E.elite[i] ? 0.08 : 0.15) + 0.03 * j.don('umbral');
  else if (g.flags & F.EJECUTA) umbral += E.elite[i] ? 0.05 : 0.12;
  if (umbral <= 0 || E.hp[i] > E.hpMax[i] * umbral) return;
  sim.suc.push(S.EJECUTA, E.x[i], E.y[i]);
  j.resumen.ejecuciones++;
  j.m.ejecuciones = (j.m.ejecuciones ?? 0) + 1;
  const x = E.x[i], y = E.y[i];
  if (j.clase === 'verdugo') {
    if (j.spec === 0) {
      const g2 = golpeSimple(j, BIT_ETQ.sangre);
      g2.sangrado = 6;
      sim.explosion(x, y, 1.8, 15 + j.nivel, g2, 4);
    } else if (j.spec === 1) {
      const z = sim.nuevaZona();
      if (z) Object.assign(z, { tipo: ZONA.FUEGO, dueno: j.i, x, y, r: 1.3, dps: 8 + j.nivel * 0.5, vida: 3, total: 3, quema: 4, etq: BIT_ETQ.fuego });
    } else {
      j.invisible = 1.5;
      j.m.sombraT = 1.5;
    }
    if (j.don('incansable')) j.habT = Math.max(0, j.habT - 0.5);
  }
  sim.matar(i, g);
}

// ------------------------------------------------------------------------------------------------- Muertes
export function alMatar(sim: Sim, j: Jugador, i: number, g: Golpe) {
  const E = sim.E;
  const x = E.x[i], y = E.y[i];
  const t = E.tipo[i];
  switch (j.clase) {
    case 'campesino':
      if (j.spec === 0 && g.habilidad) j.habT = Math.max(0, j.habT - 0.5);
      break;
    case 'prisionero':
      if (j.spec === 0) {
        j.m.ovacion = Math.min(30, (j.m.ovacion ?? 0) + 1);
        j.m.sinMatar = 0;
      }
      break;
    case 'cazador':
      if (E.marca[i] > 0) {
        j.m.cazaT = 3;
        if (j.spec === 2) {
          sim.enRadio(x, y, 3, LISTA);
          let n = 0;
          for (const o of LISTA) if (o !== i && n < 2) {
            E.marca[o] = 5;
            n++;
          }
        }
      }
      break;
    case 'alquimista':
      if (j.spec === 0 && E.veneno[i] > 0) {
        sim.enRadio(x, y, 2.5, LISTA);
        let n = 0;
        for (const o of LISTA) if (o !== i && n < 3) {
          E.veneno[o] = Math.max(E.veneno[o], E.veneno[i]);
          E.venenoT[o] = 4;
          E.ultimo[o] = j.i;
          n++;
        }
      }
      if (j.spec === 2 && sim.az.n() < 0.05 && !esJefe(t)) {
        sim.suc.push(S.REACCION, x, y, 5);
        sim.soltar(3, x, y, sim.az.entero(5, 10));
      }
      break;
    case 'sepulturero': {
      const p = j.spec === 0 ? 0.18 : 0.12;
      if (sim.az.n() < p && !esJefe(t) && t !== TIPO_ALTAR) levantarMuerto(sim, j, x, y, false);
      break;
    }
    case 'inquisidor':
      if ((x - j.x) ** 2 + (y - j.y) ** 2 < radioAura(j) ** 2) {
        j.m.fervor = Math.min(20 + 10 * j.don('fervor_ardiente'), (j.m.fervor ?? 0) + 1);
        j.m.fervorT = 0;
      }
      break;
  }
}

/** Efectos de reliquias y bendiciones de cualquiera al morir un enemigo (los del que lo mató). */
export function alMorirCualquiera(sim: Sim, i: number, g: Golpe) {
  const j = g.j >= 0 ? sim.J[g.j] : null;
  if (!j) return;
  const E = sim.E;
  const x = E.x[i], y = E.y[i];
  if (j.tiene('cadaveres') && sim.az.n() < 0.15) {
    const g2 = golpeSimple(j, BIT_ETQ.area | BIT_ETQ.veneno, 3);
    sim.explosion(x, y, 1.8, 12 + j.nivel, g2, 2);
  }
  if (j.tiene('fuego_muertos') && sim.az.n() < 0.1) {
    const z = sim.nuevaZona();
    if (z) Object.assign(z, { tipo: ZONA.FUEGO, dueno: j.i, x, y, r: 1.1, dps: 6 + j.nivel * 0.4, vida: 3, total: 3, quema: 3, etq: BIT_ETQ.fuego });
  }
  if (j.tiene('vampirismo')) sim.curar(j, 0.5, true);
  if (j.bend('banquete') && sim.az.n() < 0.03 * j.bend('banquete')) sim.soltar(12, x, y, 1);
  if (j.bend('ceniza_viento') && E.quemaT[i] > 0) {
    const g2 = golpeSimple(j, BIT_ETQ.fuego, 2);
    sim.explosion(x, y, 1.6, 6 + 5 * j.bend('ceniza_viento') + j.nivel * 0.5, g2, 0);
  }
  if (j.bend('animas')) {
    j.m.animas = (j.m.animas ?? 0) + 1;
    if (j.m.animas >= 40) {
      j.m.animas = 0;
      let n = 0;
      for (const a of sim.A) if (a.vivo && a.tipo === ALI.ANIMA && a.dueno === j.i) n++;
      if (n < j.bend('animas')) {
        const a = sim.nuevoAliado();
        if (a) Object.assign(a, { tipo: ALI.ANIMA, dueno: j.i, x, y, hp: 999, hpMax: 999, dano: 8 + j.nivel, vida: 15, r: 0.35 });
      }
    }
  }
}

/** Levanta un esqueleto (o espíritu) aliado del sepulturero. */
export function levantarMuerto(sim: Sim, j: Jugador, x: number, y: number, extra: boolean) {
  const espiritu = j.spec === 2;
  const tipo = espiritu ? ALI.ESPIRITU : ALI.ESQUELETO;
  if (!extra) {
    const max = (j.spec === 0 ? 10 : 6) + 2 * j.don('legion');
    let n = 0;
    for (const a of sim.A) if (a.vivo && (a.tipo === ALI.ESQUELETO || a.tipo === ALI.ESPIRITU) && a.dueno === j.i && !a.b) n++;
    if (n >= max) return;
  }
  const p = sim.mapa.abiertaCerca(x, y, 2);
  if (!p) return;
  const a = sim.nuevoAliado();
  if (!a) return;
  const f = 1 + 0.3 * j.don('huesos_fuertes');
  Object.assign(a, {
    tipo, dueno: j.i, x: p.x, y: p.y, hp: (30 + 4 * j.nivel) * f * (extra ? 1.5 : 1), dano: (7 + 0.9 * j.nivel) * f * (extra ? 1.3 : 1),
    vida: extra ? 12 : 20 + 6 * j.don('descanso'), r: 0.34, b: extra ? 1 : 0,
  });
  a.hpMax = a.hp;
  sim.suc.push(S.INVOCA, p.x, p.y, tipo);
}

// ------------------------------------------------------------------------------------------------- Recibir daño
/** Antes de que un golpe enemigo llegue: el escudo del caballero, el decreto del monarca, la armadura del mártir. */
export function alRecibir(sim: Sim, j: Jugador, dano: number, x: number, y: number): number {
  const m = j.m;
  if (j.clase === 'caballero' && (m.escudo ?? 0) >= 1) {
    m.escudo--;
    m.escudoT = 0;
    j.invul = 0.5;
    sim.suc.push(S.BLOQUEO, j.i);
    if (j.spec === 0) {
      const g = golpeSimple(j, BIT_ETQ.fisico, 7);
      sim.suc.push(S.ONDA, j.x, j.y, 3, -2);
      sim.enRadio(j.x, j.y, 3, LISTA);
      for (const i of [...LISTA]) {
        const dx = sim.E.x[i] - j.x, dy = sim.E.y[i] - j.y, l = Math.hypot(dx, dy) || 1;
        g.dx = dx / l;
        g.dy = dy / l;
        sim.danar(i, 25 + 2 * j.nivel, g);
      }
    } else if (j.spec === 1) sim.curar(j, j.hpMax * 0.08);
    if (j.don('contraataque')) {
      const g = golpeSimple(j, BIT_ETQ.fisico | BIT_ETQ.cuerpo, 4);
      sim.suc.push(S.TAJO, j.x, j.y, 0, 2.5, Math.PI * 2, -1 * 8 + j.i);
      sim.enRadio(j.x, j.y, 2.5, LISTA);
      for (const i of [...LISTA]) sim.danar(i, (30 + 3 * j.nivel) * j.don('contraataque'), g);
    }
    return 0;
  }
  let d = dano;
  if (j.clase === 'monarca' && j.don('decreto') && (x - j.x) ** 2 + (y - j.y) ** 2 < 9) d *= 1 - 0.1 * j.don('decreto');
  if (j.clase === 'prisionero' && j.spec === 2) d *= 1 - 0.3 * (1 - j.hp / j.hpMax);
  // Reloj parado (una vez por etapa)
  if (j.tiene('reloj_parado') && !j.usados.reloj_parado && j.hp - d < j.hpMax * 0.25) {
    j.usados.reloj_parado = 1;
    sim.quieto = 3;
    sim.aviso(14, j.i);
  }
  return d;
}

/** Ya recibió el golpe (y sigue en pie). */
export function alSerHerido(sim: Sim, j: Jugador, d: number) {
  if (j.clase === 'prisionero' && j.spec === 2) {
    const g = golpeSimple(j, BIT_ETQ.sangre, 4);
    sim.explosion(j.x, j.y, 3, d * 1.5 + 5, g, 4);
  }
}

/** Antes de caer: último aliento, fénix o segunda piel. */
export function segundaOportunidad(sim: Sim, j: Jugador): boolean {
  if (j.don('ultimo_aliento') && !j.usados.ultimo_aliento) {
    j.usados.ultimo_aliento = 1;
    revivir(sim, j, 0.3);
    return true;
  }
  if (j.bend('fenix') && !j.usados.fenix) {
    j.usados.fenix = 1;
    revivir(sim, j, 0.5);
    const g = golpeSimple(j, BIT_ETQ.fuego, 6);
    sim.explosion(j.x, j.y, 3.5, 40 + 4 * j.nivel, g, 0);
    return true;
  }
  if (j.objeto('segunda_piel') && !j.usados.segunda_piel) {
    j.usados.segunda_piel = 1;
    revivir(sim, j, 0.5);
    return true;
  }
  return false;
}

function revivir(sim: Sim, j: Jugador, frac: number) {
  j.hp = Math.round(j.hpMax * frac);
  j.invul = 2.5;
  sim.suc.push(S.LEVANTA, j.i);
  sim.aviso(15, j.i);
}

export function velocidadLevantar(o: Jugador) {
  return o.clase === 'inquisidor' && o.spec === 1 ? 2 : 1;
}

// ------------------------------------------------------------------------------------------------- Recoger y excavar
export function multOroGrupo(sim: Sim) {
  // (la Codicia y la luna Aurelia: más oro)
  let m = (sim.cfg.exp.mutadores.includes('codicia') ? 1.5 : 1) * (sim.cfg.exp.mutadores.includes('aurelia') ? 1.4 : 1);
  for (const j of sim.J) if (j.clase === 'monarca' && j.spec === 2) m += 0.3;
  return m;
}

export function extraVetas(j: Jugador) {
  let e = 0;
  if (j.clase === 'campesino') e += 0.5 + 0.2 * j.don('buena_cosecha') + (j.spec === 1 ? 0.5 : 0);
  if (j.objeto('lampara_minero')) e += 0.3;
  return e;
}

export function alRecoger(sim: Sim, j: Jugador, que: 'alma' | 'oro' | 'hierro', v: number) {
  const m = j.m;
  if (que === 'alma') {
    if (j.tiene('escudo_almas')) {
      j.almasEscudo += v;
      if (j.almasEscudo >= 50) {
        j.almasEscudo = 0;
        j.paraGolpes = Math.min(2, j.paraGolpes + 1);
      }
    }
    if (j.clase === 'campesino') {
      m.almas = (m.almas ?? 0) + v;
      const cada = 20 - 5 * j.don('abono');
      if (m.almas >= cada) {
        m.almas -= cada;
        brotarEspiga(sim, j);
      }
    }
  } else if (que === 'oro') {
    if (j.clase !== 'monarca') return;
    if (j.spec === 1) {
      m.oroRey = (m.oroRey ?? 0) + v;
      while (m.oroRey >= 40) {
        m.oroRey -= 40;
        m.reyBonus = (m.reyBonus ?? 0) + 0.03;
      }
      return;
    }
    m.oroRecluta = (m.oroRecluta ?? 0) + v;
    const costo = j.spec === 0 ? 20 : 30;
    while (m.oroRecluta >= costo) {
      m.oroRecluta -= costo;
      reclutar(sim, j);
    }
  } else if (que === 'hierro') {
    if (j.clase !== 'herrero') return;
    m.hierroTrampa = (m.hierroTrampa ?? 0) + v;
    const cada = j.don('chatarra') ? 4 : 6;
    while (m.hierroTrampa >= cada) {
      m.hierroTrampa -= cada;
      const a = sim.az.n() * Math.PI * 2;
      ponerTrampa(sim, j, j.x + Math.cos(a) * 1.5, j.y + Math.sin(a) * 1.5, 0);
    }
    if (j.spec === 1) {
      m.hierroArmero = (m.hierroArmero ?? 0) + v;
      while (m.hierroArmero >= 8) {
        m.hierroArmero -= 8;
        const a = sim.az.uno(j.armas);
        if (a && a.nivel < 18) {
          a.nivel++;
          a.sucio = true;
          sim.suc.push(S.SOBRECARGA, j.i, -1);
        }
      }
    }
  }
}

export function alExcavar(sim: Sim, j: Jugador, cx: number, cy: number, tipo: number) {
  void tipo;
  if (j.don('aire_libre')) j.prisaT = 3;
  if (j.clase === 'campesino' && j.spec === 1) {
    // Esquirlas contra los enemigos cercanos
    for (let k = 0; k < 3; k++) {
      const i = sim.blanco(cx + 0.5, cy + 0.5, 7, 'azar');
      if (i < 0) break;
      const ang = Math.atan2(sim.E.y[i] - cy - 0.5, sim.E.x[i] - cx - 0.5);
      const pr = sim.nuevoProyectil();
      if (!pr) break;
      Object.assign(pr, {
        dueno: j.i, ranura: -1, arma: -3, mov: MOV.RECTO, x: cx + 0.5, y: cy + 0.5, z: 0.6, ang, vx: Math.cos(ang) * 14, vy: Math.sin(ang) * 14, r: 0.2,
        dano: 8 + 0.8 * j.nivel, perfora: 1, rebotes: 0, flags: 0, vida: 0.6, etq: BIT_ETQ.fisico, blanco: -1,
      });
    }
  }
  if (j.clase === 'sepulturero' && j.spec === 1) {
    const r = sim.az.n();
    if (r < 0.01) sim.soltar(7, cx + 0.5, cy + 0.5, 1);
    else if (r < 0.07) sim.soltar(3, cx + 0.5, cy + 0.5, sim.az.entero(3, 8));
  }
}

// ------------------------------------------------------------------------------------------------- Habilidades
export function embistiendo(j: Jugador) {
  return (j.m.embestidaT ?? 0) > 0;
}

/** La embestida del caballero, el garfio del cazador y el salto del fugitivo: un movimiento rápido en línea. */
export function moverEmbestida(sim: Sim, j: Jugador, dt: number) {
  const m = j.m;
  m.embestidaT -= dt;
  const v = m.embVel;
  const ax = j.x, ay = j.y;
  sim.moverCirculo(j, m.embX * v * dt, m.embY * v * dt);
  j.vx = m.embX * v;
  j.vy = m.embY * v;
  j.invul = Math.max(j.invul, 0.1);
  const g = golpeSimple(j, BIT_ETQ.fisico | BIT_ETQ.cuerpo, 9);
  g.dx = m.embX;
  g.dy = m.embY;
  if (m.embDano > 0) {
    sim.enRadio(j.x, j.y, 1.1, LISTA);
    for (const i of LISTA) {
      if (sim.E.hz[i * 8 + 7] > sim.t) continue;
      sim.E.hz[i * 8 + 7] = sim.t + 0.6;
      sim.danar(i, m.embDano, g);
    }
  }
  // Estela (cruzado: luz; caballero negro: sombra; fugitivo: grilletes)
  m.estelaT = (m.estelaT ?? 0) - dt;
  if (m.estelaT <= 0 && m.embEstela) {
    m.estelaT = 0.1;
    if (m.embEstela === 3) ponerTrampa(sim, j, j.x, j.y, 2);
    else {
      const z = sim.nuevaZona();
      if (z) Object.assign(z, {
        tipo: m.embEstela === 1 ? ZONA.SAGRADA : ZONA.SOMBRA, dueno: j.i, x: j.x, y: j.y, r: 1, dps: m.embEstela === 1 ? 4 : 10 + j.nivel, vida: 3, total: 3,
        cura: m.embEstela === 1 ? 1 : 0, etq: m.embEstela === 1 ? BIT_ETQ.sagrado : BIT_ETQ.sombra,
      });
    }
  }
  const atascado = Math.hypot(j.x - ax, j.y - ay) < v * dt * 0.25;
  if (m.embestidaT <= 0 || atascado) {
    m.embestidaT = 0;
    j.vx *= 0.3;
    j.vy *= 0.3;
    if (m.alLlegar === 1) {
      // Garfio: aturde al llegar
      sim.suc.push(S.ONDA, j.x, j.y, 2.2, -4);
      sim.enRadio(j.x, j.y, 2.2, LISTA);
      for (const i of [...LISTA]) {
        sim.E.aturdido[i] = Math.max(sim.E.aturdido[i], 1);
        sim.danar(i, 15 + j.nivel, g);
      }
      if (j.spec === 2) {
        const z = sim.nuevaZona();
        if (z) Object.assign(z, { tipo: ZONA.SAGRADA, dueno: j.i, x: j.x, y: j.y, r: 2, dps: 8 + j.nivel * 0.5, vida: 4, total: 4, cura: 1, etq: BIT_ETQ.sagrado });
      }
    }
    m.alLlegar = 0;
  }
}

function empezarEmbestida(j: Jugador, dirX: number, dirY: number, dist: number, dur: number, dano: number, estela: number, alLlegar = 0) {
  const l = Math.hypot(dirX, dirY) || 1;
  j.m.embX = dirX / l;
  j.m.embY = dirY / l;
  j.m.embVel = dist / dur;
  j.m.embestidaT = dur;
  j.m.embDano = dano;
  j.m.embEstela = estela;
  j.m.alLlegar = alLlegar;
}

/** Recarga de la habilidad (con los dones que la bajan). */
export function recarga(j: Jugador, base: number) {
  let r = base;
  if (j.clase === 'monarca') r *= 1 - 0.15 * j.don('voz_mando');
  if (j.clase === 'prisionero') r -= 2 * j.don('tiron_brutal');
  if (j.clase === 'caballero') r -= 2 * j.don('galope');
  if (j.clase === 'cazador') r -= 1.5 * j.don('garfio_rapido');
  if (j.clase === 'alquimista') r -= 2 * j.don('humo_espeso');
  if (j.clase === 'inquisidor') r -= 2 * j.don('luz_divina');
  if (j.clase === 'juglar') r -= 3 * j.don('gira');
  return Math.max(2, r * (1 - j.st.enfriamiento));
}

/** Usa la habilidad activa de la clase. */
export function habilidad(sim: Sim, j: Jugador) {
  const RECARGAS: Record<string, number> = {
    monarca: 24, campesino: 11, prisionero: 14, caballero: 9, cazador: 6, herrero: 16, alquimista: 15, sepulturero: 24, inquisidor: 13, verdugo: 12, bruja: 18, juglar: 22,
  };
  j.habT = recarga(j, RECARGAS[j.clase]);
  j.m.habMax = j.habT;
  const ang = Math.atan2(j.fy, j.fx);
  sim.suc.push(S.HABILIDAD, j.i, j.x, j.y, ang, 0);
  const E = sim.E;
  switch (j.clase) {
    case 'monarca': {
      const dur = 8 + 3 * j.don('voz_mando');
      for (const o of sim.J) {
        if (o.estado !== 0 || (o.x - j.x) ** 2 + (o.y - j.y) ** 2 > 81) continue;
        o.buffDano = Math.max(o.buffDano, 0.3);
        o.buffVel = Math.max(o.buffVel, 0.2);
        o.buffT = Math.max(o.buffT, dur);
      }
      if (j.spec === 1) sim.curar(j, j.hpMax * 0.15);
      sim.enRadio(j.x, j.y, j.spec === 0 ? 8 : 4, LISTA);
      for (const i of LISTA) if (!esJefe(E.tipo[i]) && E.tipo[i] !== TIPO_ALTAR) E.miedo[i] = 1.5;
      break;
    }
    case 'campesino': {
      const r = 3.5 * (1 + 0.3 * j.don('trilla')) * (1 + j.st.area);
      const g = golpeSimple(j, BIT_ETQ.fisico | BIT_ETQ.cuerpo | BIT_ETQ.area, 8);
      g.habilidad = true;
      if (j.spec === 2) g.quema = 6;
      sim.suc.push(S.TAJO, j.x, j.y, ang, r, Math.PI * 2, -2 * 8 + j.i);
      sim.enRadio(j.x, j.y, r, LISTA);
      for (const i of [...LISTA]) {
        const dx = E.x[i] - j.x, dy = E.y[i] - j.y, l = Math.hypot(dx, dy) || 1;
        g.dx = dx / l;
        g.dy = dy / l;
        sim.danar(i, (35 + 3.5 * j.nivel) * (1 + 0.3 * j.don('trilla')), g);
      }
      break;
    }
    case 'prisionero': {
      if (j.spec === 1) {
        empezarEmbestida(j, j.fx, j.fy, 6, 0.3, 10 + j.nivel, 3);
        break;
      }
      const g = golpeSimple(j, BIT_ETQ.fisico, 0);
      g.aturde = 1;
      sim.suc.push(S.ONDA, j.x, j.y, 9, -5);
      sim.enRadio(j.x, j.y, 9, LISTA);
      for (const i of [...LISTA]) {
        if (esJefe(E.tipo[i]) || E.tipo[i] === TIPO_ALTAR) continue;
        const dx = j.x - E.x[i], dy = j.y - E.y[i], l = Math.hypot(dx, dy) || 1;
        g.dx = dx / l;
        g.dy = dy / l;
        g.empuje = Math.min(16, l * 2.6);
        sim.danar(i, (20 + 2 * j.nivel) * (1 + j.don('tiron_brutal')), g);
      }
      if (j.spec === 0) j.m.ovacion = Math.min(30, (j.m.ovacion ?? 0) + 10);
      break;
    }
    case 'caballero':
      empezarEmbestida(j, j.fx, j.fy, 6 + 2 * j.don('galope'), 0.35, 30 + 3 * j.nivel, j.spec === 1 ? 1 : j.spec === 2 ? 2 : 0);
      break;
    case 'cazador': {
      // Hasta la pared más cercana en la dirección en que camina (o 6 m)
      let d = 0.5;
      while (d < 10 && !sim.mapa.solidaEn(j.x + j.fx * d, j.y + j.fy * d)) d += 0.25;
      const dist = Math.max(1.5, Math.min(10, d) - 0.6);
      empezarEmbestida(j, j.fx, j.fy, dist, Math.max(0.18, dist / 26), 0, 0, 1);
      sim.suc.push(S.SALTO, j.x, j.y, j.x + j.fx * dist, j.y + j.fy * dist, 4);
      break;
    }
    case 'herrero': {
      const max = j.spec === 0 ? 4 : 2;
      let n = 0;
      let mas: { vida: number; al: (typeof sim.A)[number] } | null = null;
      for (const a of sim.A) if (a.vivo && a.tipo === ALI.TORRETA && a.dueno === j.i && a.b === -1) {
        n++;
        if (!mas || a.vida < mas.vida) mas = { vida: a.vida, al: a };
      }
      if (n >= max && mas) mas.al.vivo = false;
      const p = sim.mapa.abiertaCerca(j.x + j.fx * 1.3, j.y + j.fy * 1.3, 2) ?? { x: j.x, y: j.y };
      ponerTorreta(sim, j, p.x, p.y, 10 + 1.2 * j.nivel, 25, -1);
      if (j.spec === 2) for (let k = 0; k < 4; k++) ponerTrampa(sim, j, j.x + Math.cos(k * 1.57) * 1.8, j.y + Math.sin(k * 1.57) * 1.8, 1);
      break;
    }
    case 'alquimista': {
      const z = sim.nuevaZona();
      if (z) Object.assign(z, { tipo: ZONA.HUMO, dueno: j.i, x: j.x, y: j.y, r: 4, dps: 0, vida: 5 + 2 * j.don('humo_espeso'), total: 5 + 2 * j.don('humo_espeso'), lento: 0.6 });
      j.invisible = 3;
      break;
    }
    case 'sepulturero':
      for (let k = 0; k < 6; k++) levantarMuerto(sim, j, j.x + Math.cos(k) * 1.6, j.y + Math.sin(k) * 1.6, true);
      if (j.spec === 1) sim.soltar(3, j.x, j.y, sim.az.entero(10, 20));
      break;
    case 'inquisidor': {
      let i = j.spec === 0 ? sim.blanco(j.x, j.y, 8, 'fuerte') : -1;
      if (i < 0) i = sim.blanco(j.x, j.y, 8, 'denso');
      const x = i >= 0 ? E.x[i] : j.x + j.fx * 3, y = i >= 0 ? E.y[i] : j.y + j.fy * 3;
      sim.suc.push(S.RAYO, x, y, 3, -10);
      const g = golpeSimple(j, BIT_ETQ.sagrado | BIT_ETQ.area, 3);
      g.habilidad = true;
      sim.explosion(x, y, 3, (60 + 6 * j.nivel) * (1 + 0.3 * j.don('luz_divina')), g, 1);
      for (const o of sim.J) if (o.estado === 0 && (o.x - x) ** 2 + (o.y - y) ** 2 < 9) sim.curar(o, o.hpMax * 0.2);
      break;
    }
    case 'verdugo': {
      const i = sim.blanco(j.x, j.y, 7, 'cercano');
      const a = i >= 0 ? Math.atan2(E.y[i] - j.y, E.x[i] - j.x) : ang;
      const ux = Math.cos(a), uy = Math.sin(a);
      sim.suc.push(S.ESTOCADA, j.x, j.y, a, 7, 2.5, -4 * 8 + j.i);
      const g = golpeSimple(j, BIT_ETQ.fisico | BIT_ETQ.cuerpo, 5);
      g.habilidad = true;
      g.ejecutaExtra = 0.35;
      g.dx = ux;
      g.dy = uy;
      sim.enRadio(j.x + ux * 3.5, j.y + uy * 3.5, 4.5, LISTA);
      for (const o of [...LISTA]) {
        const dx = E.x[o] - j.x, dy = E.y[o] - j.y;
        const t = dx * ux + dy * uy;
        if (t < -0.5 || t > 7.5 || Math.abs(dx * uy - dy * ux) > 1.25 + E.r[o]) continue;
        sim.danar(o, 80 + 8 * j.nivel, g);
      }
      break;
    }
    case 'bruja': {
      const p = sim.mapa.abiertaCerca(j.x + j.fx, j.y + j.fy, 2) ?? { x: j.x, y: j.y };
      const a = sim.nuevoAliado();
      if (a) Object.assign(a, { tipo: ALI.TOTEM, dueno: j.i, x: p.x, y: p.y, hp: 999, hpMax: 999, vida: 10, r: 0.4, dano: 4 + j.nivel * 0.4 });
      break;
    }
    case 'juglar': {
      for (const o of sim.J) {
        if (o.estado !== 0 || (o.x - j.x) ** 2 + (o.y - j.y) ** 2 > 100) continue;
        o.buffCad = Math.max(o.buffCad, 0.4);
        o.buffT = Math.max(o.buffT, 8);
      }
      sim.suc.push(S.ONDA, j.x, j.y, 5, -6);
      sim.enRadio(j.x, j.y, 5, LISTA);
      for (const i of LISTA) if (!esJefe(E.tipo[i])) E.aturdido[i] = Math.max(E.aturdido[i], 1.5);
      break;
    }
  }
}

// ------------------------------------------------------------------------------------------------- Ayudantes de clase
function contarAliados(sim: Sim, j: Jugador, ...tipos: number[]) {
  let n = 0;
  for (const a of sim.A) if (a.vivo && a.dueno === j.i && tipos.includes(a.tipo)) n++;
  return n;
}

function monarcaTick(sim: Sim, j: Jugador) {
  void sim;
  void j;
}

/** Llega un caballero de la guardia real (o dos, el tirano; ballestero, el mecenas). */
function reclutar(sim: Sim, j: Jugador) {
  if (j.spec === 1) return;
  const tipo = j.spec === 2 ? ALI.BALLESTERO : ALI.CABALLERO;
  const max = (j.spec === 0 ? 5 : 3) + j.don('leva');
  const cuantos = j.spec === 0 ? 2 : 1;
  for (let k = 0; k < cuantos; k++) {
    if (contarAliados(sim, j, ALI.CABALLERO, ALI.BALLESTERO) >= max) return;
    const p = sim.mapa.abiertaCerca(j.x - j.fx * 1.2 + k * 0.6, j.y - j.fy * 1.2, 2) ?? { x: j.x, y: j.y };
    const a = sim.nuevoAliado();
    if (!a) return;
    const f = 1 + 0.4 * j.don('armadura_guardia');
    Object.assign(a, { tipo, dueno: j.i, x: p.x, y: p.y, hp: (50 + 6 * j.nivel) * f, dano: (8 + 1.2 * j.nivel) * f, vida: j.spec === 0 ? 25 : 0, r: 0.38 });
    a.hpMax = a.hp;
    sim.suc.push(S.INVOCA, p.x, p.y, tipo);
  }
}

/** Una espiga brota a los pies del campesino (madura en 4 s; al pisarla, cura). */
function brotarEspiga(sim: Sim, j: Jugador) {
  const a = sim.nuevoAliado();
  if (!a) return;
  Object.assign(a, { tipo: ALI.ESPIGA, dueno: j.i, x: j.x + sim.az.entre(-0.4, 0.4), y: j.y + sim.az.entre(-0.4, 0.4), hp: 1, hpMax: 1, vida: 25, r: 0.4, a: 0 });
  sim.suc.push(S.ESPIGA, a.x, a.y);
}

export function ponerTrampa(sim: Sim, j: Jugador, x: number, y: number, clase: number) {
  if (sim.mapa.solidaEn(x, y)) return;
  const a = sim.nuevoAliado();
  if (!a) return;
  Object.assign(a, { tipo: ALI.TRAMPA, dueno: j.i, x, y, hp: 1, hpMax: 1, vida: clase === 2 ? 10 : 40, r: 0.5, b: clase, a: clase === 1 ? 3 : 2, dano: (clase === 1 ? 26 : 14) + j.nivel * 1.5 });
  a.dano *= multConstruccion(j);
}

/** La bruja mantiene a sus cuervos familiares. */
function mantenerCuervos(sim: Sim, j: Jugador) {
  const quiere = 2 + j.don('mas_cuervos') + (j.spec === 0 ? 3 : 0);
  let n = 0;
  for (const a of sim.A) if (a.vivo && a.tipo === ALI.CUERVO && a.dueno === j.i) n++;
  for (; n < quiere; n++) {
    const a = sim.nuevoAliado();
    if (!a) return;
    Object.assign(a, { tipo: ALI.CUERVO, dueno: j.i, x: j.x, y: j.y, hp: 999, hpMax: 999, dano: 4 + 0.6 * j.nivel, vida: 0, r: 0.25, a: (n / quiere) * Math.PI * 2 });
  }
}

/** El aura sagrada del inquisidor (cada medio segundo). */
function radioAura(j: Jugador) {
  return 3 * (1 + 0.2 * j.don('devocion')) * (j.spec === 1 ? 1.3 : 1) * (1 + j.st.area * 0.5);
}
function auraSagrada(sim: Sim, j: Jugador) {
  const r = radioAura(j);
  const g = golpeSimple(j, BIT_ETQ.sagrado | BIT_ETQ.area, 0.3);
  g.callado = true;
  sim.enRadio(j.x, j.y, r, LISTA);
  for (const i of [...LISTA]) sim.danar(i, (4 + 0.5 * j.nivel) * 0.5 * (j.spec === 2 ? 2.5 : 1), g);
  const cura = 0.01 * 0.5 * (j.spec === 1 ? 3 : 1);
  for (const o of sim.J) if (o.estado === 0 && (o.x - j.x) ** 2 + (o.y - j.y) ** 2 < r * r) sim.curar(o, o.hpMax * cura, true);
}

/** Las canciones del juglar: cambian cada 10 s y le llegan a los aliados cercanos. */
function juglarTick(sim: Sim, j: Jugador, dt: number) {
  const m = j.m;
  m.cancionT = (m.cancionT ?? 0) + dt;
  if (m.cancionT >= 10) {
    m.cancionT = 0;
    m.cancion = ((m.cancion ?? 0) + 1) % 3;
    sim.suc.push(S.ONDA, j.x, j.y, 3, -7 - m.cancion);
    sim.enRadio(j.x, j.y, 3, LISTA);
    for (const i of LISTA) {
      if (esJefe(sim.E.tipo[i])) continue;
      sim.E.aturdido[i] = Math.max(sim.E.aturdido[i], 0.6);
      if (j.spec === 1) sim.E.miedo[i] = 1.5;
    }
  }
  const mult = (1 + 0.2 * j.don('estribillo')) * (j.spec === 0 ? 1.5 : 1);
  const r = j.spec === 0 ? 16 : 8;
  for (const o of sim.J) {
    if (o.estado !== 0 || (o.x - j.x) ** 2 + (o.y - j.y) ** 2 > r * r) continue;
    o.auraT = 0.6;
    if (m.cancion === 0) o.auraVel = Math.max(o.auraVel, 0.15 * mult);
    else if (m.cancion === 1) o.auraCura = Math.max(o.auraCura, 0.015 * mult);
    else o.auraDano = Math.max(o.auraDano, 0.2 * mult);
  }
  if (j.spec === 2) {
    m.trovT = (m.trovT ?? 0) - dt;
    if (m.trovT <= 0) {
      m.trovT = 0.5;
      const g = golpeSimple(j, BIT_ETQ.sombra | BIT_ETQ.area, 0);
      g.callado = true;
      sim.enRadio(j.x, j.y, 6, LISTA);
      for (const i of [...LISTA]) sim.danar(i, (6 + 0.6 * j.nivel) * 0.5, g);
    }
  }
}

// ------------------------------------------------------------------------------------------------- Varios
/** La flauta encanta: el enemigo pelea un rato del lado de los jugadores. */
export function encantar(sim: Sim, pr: Proyectil, i: number) {
  const E = sim.E;
  if (sim.az.n() > 0.25 || E.elite[i] || esJefe(E.tipo[i]) || E.tipo[i] === TIPO_ALTAR) return;
  const a = sim.nuevoAliado();
  if (!a) return;
  Object.assign(a, {
    tipo: ALI.ENCANTADO, dueno: pr.dueno, x: E.x[i], y: E.y[i], hp: E.hp[i], hpMax: E.hpMax[i], dano: E.dano[i] * 1.2, vida: Math.max(2, pr.duracion || 4),
    r: E.r[i], imita: E.tipo[i], rot: E.rot[i],
  });
  sim.suc.push(S.MARCA, E.x[i], E.y[i], 3, i);
  E.quitar(i);
}

export function nuevaEntidad(sim: Sim, tipo: number, x: number, y: number): Entidad {
  const e = new Entidad();
  e.tipo = tipo;
  e.id = sim.id();
  e.x = x;
  e.y = y;
  sim.ent.push(e);
  return e;
}

/** Un cofre: tres opciones (equipo, armas, reliquia, evolución, oro…). */
export function abrirCofre(sim: Sim, j: Jugador, especial: boolean) {
  encolarCofre(sim, j, especial);
}

export function recogerEquipo(sim: Sim, j: Jugador) {
  encolarEquipo(sim, j);
}

export { ENT, TIPO, RADIO_JUGADOR, zonaPeligro, ponerZona };
