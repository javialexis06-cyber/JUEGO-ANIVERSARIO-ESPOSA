// La horda: cómo aparece (el director que sube la presión con el reloj, los élites, los eventos cada 90 s) y cómo se
// mueve y pelea cada tipo (persigue por el campo de flujo, vuela por encima de las paredes, atraviesa muros, dispara,
// salta, embiste, se teletransporta, encanta, invoca o revienta).
import { DURACION_ETAPA, EVENTOS, MOD_ELITE, PELIGROS, type IdEvento } from '../datos/mundo';
import { C, esSolida } from '../tipos';
import { disparoEnemigo, zonaPeligro } from './armas';
import { TIPO, TIPOS, esJefe } from './catalogo';
import { ENT, EST, S } from './estado';
import { RADIO_JUGADOR } from './jugador';
import { moverJefe } from './jefes';
import * as mec from './mecanicas';
import { Golpe } from './golpe';
import type { Sim } from './sim';

const DIR = { x: 0, y: 0 };
const GE = new Golpe();

export interface OpcionesAparecer {
  elite?: number;
  desdeTierra?: boolean;
  desdePared?: boolean;
  marcado?: number;
  vida?: number;
  /** Va hacia el objetivo (carreta, campana) en vez de hacia los jugadores. */
  alObjetivo?: boolean;
}

/** Pone un enemigo en el mapa con la escala de la etapa. Devuelve su índice (o −1). */
export function aparecerEnemigo(sim: Sim, tipo: number, x: number, y: number, o: OpcionesAparecer = {}): number {
  const E = sim.E;
  const i = E.nuevo();
  if (i < 0) return -1;
  const def = TIPOS[tipo];
  // Se endurecen con el reloj de la etapa (así a los dos minutos la cosa no se vuelve fácil)
  const reloj = 1 + 1.1 * Math.min(1.3, sim.t / DURACION_ETAPA);
  let vida = def.vida * sim.esc.vida * (esJefe(tipo) || def.conducta === 'quieto' ? 1 : reloj) * (o.vida ?? 1);
  const elite = o.elite ?? 0;
  let esc = 1;
  if (elite === MOD_ELITE.MINI) {
    vida *= 2.4;
    esc = 1.15;
  } else if (elite) {
    vida *= 5.5;
    esc = 1.35;
    if (elite & MOD_ELITE.ESCUDO) E.escudo[i] = vida * 0.5;
  }
  E.tipo[i] = tipo;
  E.x[i] = x;
  E.y[i] = y;
  E.hp[i] = E.hpMax[i] = vida;
  E.r[i] = def.radio * esc;
  E.esc[i] = esc;
  // (la Noche impaciente los manda más rápidos y más bravos)
  const imp = esJefe(tipo) ? 0 : sim.impaciencia;
  E.vel[i] = def.vel * (elite & MOD_ELITE.RAPIDO ? 1.45 : elite === MOD_ELITE.MINI ? 1.18 : 1) * (sim.cfg.exp.mutadores.includes('velocidad') ? 1.2 : 1) * (1 + 0.06 * imp) * sim.az.entre(0.92, 1.08);
  E.dano[i] = sim.danoEnemigo(def, elite) * (1 + 0.1 * imp) * (elite === MOD_ELITE.MINI ? 0.85 : 1);
  if (def.escapa) E.et[i] = def.escapa;
  E.elite[i] = elite;
  E.marcadoObj[i] = o.marcado ?? (o.alObjetivo ? 2 : 0);
  E.atqT[i] = sim.az.entre(0.3, 1.2);
  E.et[i] = sim.az.entre(3, 6);
  if (o.desdeTierra || o.desdePared) {
    E.alt[i] = -1;
    E.estado[i] = EST.SALIENDO;
  } else if (def.vuela) E.alt[i] = 0;
  if (elite && elite !== MOD_ELITE.MINI) sim.elitesVivos++;
  sim.aparecidos++;
  sim.suc.push(S.APARECE, x, y, tipo, o.desdePared ? 2 : o.desdeTierra ? 1 : 0, elite);
  return i;
}

/** Un élite al azar: 1 modificador (2 en peligro alto o tarde en la etapa). */
export function modsElite(sim: Sim) {
  const lista = [MOD_ELITE.RAPIDO, MOD_ELITE.ESCUDO, MOD_ELITE.EXPLOSIVO, MOD_ELITE.REGENERA, MOD_ELITE.VAMPIRICO, MOD_ELITE.INVOCA];
  let m: number = sim.az.uno(lista);
  if (sim.cfg.exp.peligro >= 4 || (sim.cfg.etapa >= 3 && sim.az.n() < 0.4)) m |= sim.az.uno(lista);
  return m;
}

// ------------------------------------------------------------------------------------------------- Director
export function dirigirHorda(sim: Sim, dt: number) {
  eventos(sim, dt);
  if (sim.cfg.exp.mutadores.includes('conde_fantasma') && !sim.cfg.exp.tutorial) fantasmaDelConde(sim, dt);
  while (sim.botinPlan.length && sim.botinPlan[0].t <= sim.t) soltarBotin(sim, sim.botinPlan.shift()!.id);
  const pel = PELIGROS[Math.max(0, Math.min(4, sim.cfg.exp.peligro - 1))];
  const tope = Math.round((260 + 70 * (sim.n - 1)) * Math.min(1.5, 0.75 + pel.cantidad * 0.35));
  if (sim.E.vivos >= tope) return;
  const u = Math.min(1.25, sim.t / DURACION_ETAPA);
  // Horda de verdad: arranca con unos cuantos y a los 4 minutos son cientos
  // (los mapas grandes obligan a caminar más: la horda es un poco menos densa para compensar)
  let presion = 1.65 * (1 + 2.8 * Math.pow(u, 1.3)) * sim.esc.cantidad * sim.presionExtra;
  if (sim.fase === 'extraccion') presion *= 1.55;
  presion *= 1 + 0.3 * sim.impaciencia;
  if (sim.fase === 'jefe') presion *= 0.5;
  if (sim.cfg.exp.mutadores.includes('enjambres')) presion *= 1.2;
  // Un respiro al llegar: el primer minuto de la primera etapa es para armarse (y en las otras, los primeros 20 s)
  presion *= Math.min(1, sim.cfg.etapa === 1 ? 0.35 + sim.t / 110 : 0.5 + sim.t / 40);
  sim.hordaAcum += presion * dt;
  let seguro = 0;
  while (sim.hordaAcum >= 1 && seguro++ < 8) {
    const tipo = elegirTipo(sim);
    const def = TIPOS[tipo];
    const enjambre = def.conducta === 'enjambre' || def.conducta === 'volador';
    // Los enjambres empiezan chicos y crecen con el reloj
    const grupo = enjambre ? sim.az.entero(2, 3 + Math.round(4 * u)) : sim.az.entero(1, 4);
    sim.hordaAcum -= grupo * (enjambre ? 0.6 : 1);
    aparecerGrupo(sim, tipo, grupo);
  }
}

/** Sale un bicho del botín a unos 10-14 m de alguien (con camino), saliendo de la tierra. */
function soltarBotin(sim: Sim, id: string) {
  const vivos = sim.vivos();
  if (!vivos.length || sim.fase !== 'juego') return;
  const j = sim.az.uno(vivos);
  for (let k = 0; k < 16; k++) {
    const a = sim.az.n() * Math.PI * 2, r = sim.az.entre(10, 14);
    const p = sim.mapa.abiertaCerca(j.x + Math.cos(a) * r, j.y + Math.sin(a) * r, 3);
    if (!p || sim.flujo.distEn(p.x, p.y) > 30) continue;
    aparecerEnemigo(sim, TIPO[id], p.x, p.y, { desdeTierra: true });
    if (id !== 'rata_tesoro') sim.aviso(29, TIPO[id]);
    return;
  }
}

function elegirTipo(sim: Sim): number {
  const desdeEf = 1 + 0.28 * (sim.cfg.etapa - 1);
  const lista = sim.enemigos.filter((e) => e.desde / desdeEf <= sim.t);
  const enj = sim.cfg.exp.mutadores.includes('enjambres');
  const e = sim.az.pesado(lista, (x) => x.peso * (enj && (TIPOS[TIPO[x.id]].conducta === 'enjambre' || TIPOS[TIPO[x.id]].conducta === 'volador') ? 2.5 : 1));
  return TIPO[(e ?? sim.bioma.enemigos[0]).id];
}

/** Un grupo aparece junto, fuera de la vista pero con camino hacia los jugadores. */
export function aparecerGrupo(sim: Sim, tipo: number, cuantos: number, cerca?: { x: number; y: number }) {
  const m = sim.mapa;
  const anillo = sim.flujo.anillo;
  let cx: number, cy: number;
  if (cerca) {
    cx = Math.floor(cerca.x);
    cy = Math.floor(cerca.y);
  } else if (anillo.length) {
    const k = anillo[Math.floor(sim.az.n() * anillo.length)];
    cx = k % m.w;
    cy = (k / m.w) | 0;
  } else return;
  const def = TIPOS[tipo];
  // Élite: el jefe del grupo
  const pElite = 0.0045 * sim.esc.elites * (1 + sim.t / 110) * (sim.fase === 'extraccion' ? 1.6 : 1);
  const pMini = 0.012 * (sim.cfg.etapa - 1) * sim.esc.elites;
  const objetivo = sim.flujoObj && sim.az.n() < 0.32;
  const cementerio = sim.bioma.id === 'cementerio';
  for (let n = 0; n < cuantos; n++) {
    let x = cx + 0.5 + sim.az.entre(-1.2, 1.2), y = cy + 0.5 + sim.az.entre(-1.2, 1.2);
    let desdePared = false, desdeTierra = false;
    if (def.conducta === 'excavador' || (def.conducta === 'perseguir' && sim.az.n() < 0.25)) {
      // Sale de una pared cercana
      const p = paredCerca(sim, cx, cy);
      if (p) {
        x = p.x;
        y = p.y;
        desdePared = true;
      }
    } else if (cementerio && def.conducta === 'perseguir' && sim.az.n() < 0.5) desdeTierra = true;
    if (!def.vuela && def.conducta !== 'fantasma' && m.solidaEn(x, y)) {
      const p = m.abiertaCerca(x, y, 2);
      if (!p) continue;
      x = p.x;
      y = p.y;
    }
    let elite = n === 0 && sim.az.n() < pElite && def.conducta !== 'enjambre' && def.id !== 'murcielago' ? modsElite(sim) : 0;
    // Mini-élites (morados) mezclados en la horda desde la segunda etapa, cada vez más
    if (!elite && sim.cfg.etapa >= 2 && def.conducta !== 'enjambre' && def.id !== 'murcielago' && sim.az.n() < pMini) elite = MOD_ELITE.MINI;
    aparecerEnemigo(sim, tipo, x, y, { elite, desdePared, desdeTierra, alObjetivo: !!objetivo });
  }
}

/** Una celda abierta pegada a una pared (de donde sale el bicho), cerca de (cx, cy). */
function paredCerca(sim: Sim, cx: number, cy: number): { x: number; y: number } | null {
  const m = sim.mapa;
  for (let r = 0; r <= 3; r++)
    for (let k = 0; k < 8; k++) {
      const x = cx + sim.az.entero(-r, r), y = cy + sim.az.entero(-r, r);
      if (m.get(x, y) !== C.VACIO) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const t = m.get(x + dx, y + dy);
        if (t === C.BLANDA || t === C.DURA) return { x: x + 0.5 + dx * 0.3, y: y + 0.5 + dy * 0.3 };
      }
    }
  return null;
}

// ------------------------------------------------------------------------------------------------- Eventos
function eventos(sim: Sim, dt: number) {
  if (sim.fase === 'jefe' || sim.cfg.exp.tutorial) return;
  if (sim.evento && sim.t >= sim.eventoFin) {
    sim.evento = null;
    sim.presionExtra = sim.flujoObj && sim.ent.some((e) => e.tipo === ENT.CAMPANA_DEF && e.est === 1) ? 1.35 : 1;
  }
  if (sim.evento) continuarEvento(sim, dt);
  if (sim.t < sim.eventoT) return;
  sim.eventoT += sim.cfg.exp.mutadores.includes('eclipse') ? 60 : 90;
  const opciones: IdEvento[] = ['enjambre', 'cerco', 'lluvia_huesos', 'eclipse', 'marea', 'cofre_maldito'];
  const id = sim.az.uno(opciones);
  sim.evento = id;
  sim.eventoSub = 0;
  sim.eventoDir = sim.az.n() * Math.PI * 2;
  sim.aviso(20, opciones.indexOf(id));
  const vivos = sim.vivos();
  if (!vivos.length) return;
  const centro = { x: vivos.reduce((s, j) => s + j.x, 0) / vivos.length, y: vivos.reduce((s, j) => s + j.y, 0) / vivos.length };
  switch (id) {
    case 'enjambre': {
      const tipo = sim.bioma.id === 'minas' ? TIPO.rata_peste : TIPO.murcielago;
      const n = 26 + 8 * sim.n;
      for (let k = 0; k < n; k++) {
        const a = sim.eventoDir + sim.az.entre(-0.5, 0.5), r = sim.az.entre(14, 18);
        const x = centro.x + Math.cos(a) * r, y = centro.y + Math.sin(a) * r;
        if (TIPOS[tipo].vuela) aparecerEnemigo(sim, tipo, x, y);
        else {
          const p = sim.mapa.abiertaCerca(x, y, 4);
          if (p && sim.flujo.distEn(p.x, p.y) < 60) aparecerEnemigo(sim, tipo, p.x, p.y);
        }
      }
      sim.eventoFin = sim.t + 1;
      break;
    }
    case 'cerco': {
      const j = sim.az.uno(vivos);
      const n = 22 + 6 * sim.n;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2, r = sim.az.entre(7.5, 9);
        const p = sim.mapa.abiertaCerca(j.x + Math.cos(a) * r, j.y + Math.sin(a) * r, 1);
        if (p) aparecerEnemigo(sim, sim.tipoAlAzar(), p.x, p.y, { desdeTierra: true });
      }
      sim.eventoFin = sim.t + 1;
      break;
    }
    case 'lluvia_huesos':
      sim.eventoFin = sim.t + 12;
      break;
    case 'eclipse':
      sim.eclipse = 20;
      sim.eventoFin = sim.t + 20;
      break;
    case 'marea':
      sim.eventoFin = sim.t + 7;
      sim.presionExtra = 1;
      break;
    case 'cofre_maldito': {
      const j = sim.az.uno(vivos);
      for (let k = 0; k < 20; k++) {
        const a = sim.az.n() * Math.PI * 2;
        const p = sim.mapa.abiertaCerca(j.x + Math.cos(a) * 10, j.y + Math.sin(a) * 10, 3);
        if (!p || sim.flujo.distEn(p.x, p.y) > 30) continue;
        const cofre = nuevaEntidad(sim, ENT.COFRE_MALDITO, p.x, p.y);
        cofre.hp = 1;
        for (let s = 0; s < 2; s++) aparecerEnemigo(sim, sim.tipoAlAzar(), p.x + sim.az.entre(-1, 1), p.y + sim.az.entre(-1, 1), { elite: modsElite(sim) });
        break;
      }
      sim.eventoFin = sim.t + 1;
      break;
    }
  }
}

function continuarEvento(sim: Sim, dt: number) {
  sim.eventoSub -= dt;
  if (sim.eventoSub > 0) return;
  const vivos = sim.vivos();
  if (!vivos.length) return;
  if (sim.evento === 'lluvia_huesos') {
    sim.eventoSub = 0.35;
    const j = sim.az.uno(vivos);
    const x = j.x + j.vx * 0.8 + sim.az.entre(-3.5, 3.5), y = j.y + j.vy * 0.8 + sim.az.entre(-3.5, 3.5);
    if (!sim.mapa.solidaEn(x, y)) zonaPeligro(sim, x, y, 1.1, 14 * sim.esc.dano, 1.1);
  } else if (sim.evento === 'marea') {
    sim.eventoSub = 0.5;
    const centro = vivos[0];
    for (let k = 0; k < 5 + sim.n * 2; k++) {
      const a = sim.eventoDir + sim.az.entre(-0.6, 0.6), r = sim.az.entre(13, 17);
      const p = sim.mapa.abiertaCerca(centro.x + Math.cos(a) * r, centro.y + Math.sin(a) * r, 3);
      if (p && sim.flujo.distEn(p.x, p.y) < 50) aparecerEnemigo(sim, sim.tipoAlAzar(), p.x, p.y);
    }
  }
}

function nuevaEntidad(sim: Sim, tipo: number, x: number, y: number) {
  return mec.nuevaEntidad(sim, tipo, x, y);
}

// ------------------------------------------------------------------------------------------------- Movimiento
export function moverEnemigos(sim: Sim, dt: number) {
  const E = sim.E;
  const m = sim.mapa;
  const prisa = (sim.eclipse > 0 ? 1.25 : 1);
  sim.presionTick = (sim.presionTick ?? 0) + dt;
  const tickDot = sim.presionTick >= 0.25;
  if (tickDot) sim.presionTick = 0;
  const tercos = sim.cfg.exp.mutadores.includes('tercos');
  for (let i = 0; i < E.max; i++) {
    if (!E.vivo[i]) continue;
    const t = E.tipo[i];
    const def = TIPOS[t];
    // Relojes
    if (E.golpe[i] > 0) E.golpe[i] = Math.max(0, E.golpe[i] - dt * 5);
    if (E.ataque[i] > 0) E.ataque[i] = Math.max(0, E.ataque[i] - dt * 2.8);
    if (E.atqT[i] > 0) E.atqT[i] -= dt;
    if (E.aturdido[i] > 0) E.aturdido[i] -= dt;
    if (E.miedo[i] > 0) E.miedo[i] -= dt;
    if (E.lentoT[i] > 0) {
      E.lentoT[i] -= dt;
      if (E.lentoT[i] <= 0) E.lento[i] = 0;
    }
    if (E.marca[i] > 0) E.marca[i] -= dt;
    if (E.juzgado[i] > 0) E.juzgado[i] -= dt;
    if (E.mezclaT[i] > 0) {
      E.mezclaT[i] -= dt;
      if (E.mezclaT[i] <= 0) E.mezcla[i] = 0;
    }
    // Estados que hacen daño con el tiempo (cada 0,25 s)
    if (tickDot) {
      if (E.quemaT[i] > 0) {
        E.quemaT[i] -= 0.25;
        sim.danoEstado(i, E.quema[i] * 0.25, 'fuego');
        if (!E.vivo[i]) continue;
      }
      if (E.venenoT[i] > 0) {
        E.venenoT[i] -= 0.25;
        sim.danoEstado(i, E.veneno[i] * 0.25, 'veneno');
        if (!E.vivo[i]) continue;
      } else E.veneno[i] = 0;
      if (E.sangradoT[i] > 0) {
        E.sangradoT[i] -= 0.25;
        // Sangra más si se mueve
        const mov = Math.abs(E.vx[i]) + Math.abs(E.vy[i]) > 0.3 ? 1.5 : 1;
        sim.danoEstado(i, E.sangrado[i] * 0.25 * mov, 'sangre');
        if (!E.vivo[i]) continue;
      }
      // (el Guardián, los custodios y el jefe se regeneran mucho más despacio: con 3 % por segundo no se morían nunca)
      if (E.elite[i] & MOD_ELITE.REGENERA) E.hp[i] = Math.min(E.hpMax[i], E.hp[i] + E.hpMax[i] * (E.marcadoObj[i] >= 3 ? 0.006 : 0.03) * 0.25);
      // (muertos tercos: todos se curan 1 % por segundo)
      if (tercos && E.hp[i] < E.hpMax[i]) E.hp[i] = Math.min(E.hpMax[i], E.hp[i] + E.hpMax[i] * 0.01 * 0.25);
      if (E.condenaT[i] > 0) {
        E.condenaT[i] -= 0.25;
        if (E.condenaT[i] <= 0) mec.condenar(sim, i);
        if (!E.vivo[i]) continue;
      }
    }
    if (esJefe(t)) {
      moverJefe(sim, i, dt);
      continue;
    }
    if (def.conducta === 'quieto') continue;
    // Saliendo de la tierra o de la pared
    if (E.estado[i] === EST.SALIENDO) {
      E.alt[i] += dt * 1.4;
      if (E.alt[i] >= 0) {
        E.alt[i] = def.vuela ? 0 : 0;
        E.estado[i] = EST.NORMAL;
      }
      continue;
    }
    // Empuje de los golpes
    if (E.kx[i] !== 0 || E.ky[i] !== 0) {
      const f = Math.exp(-dt * 9);
      E.kx[i] *= f;
      E.ky[i] *= f;
      if (Math.abs(E.kx[i]) + Math.abs(E.ky[i]) < 0.05) E.kx[i] = E.ky[i] = 0;
    }
    if (E.aturdido[i] > 0) {
      E.vx[i] = E.kx[i];
      E.vy[i] = E.ky[i];
      moverYChocar(sim, i, def.vuela || def.conducta === 'fantasma', dt);
      continue;
    }
    const j = sim.jugadorCercano(E.x[i], E.y[i]);
    let vel = E.vel[i] * prisa * (1 - E.lento[i]);
    let dx = 0, dy = 0, dist = 99;
    if (j) {
      dx = j.x - E.x[i];
      dy = j.y - E.y[i];
      dist = Math.hypot(dx, dy) || 0.001;
    }
    let mx = 0, my = 0;
    if (!j) {
      // Nadie a quien perseguir (todos invisibles o caídos): dan vueltas
      mx = Math.cos(E.fase[i] * 0.3 + i);
      my = Math.sin(E.fase[i] * 0.3 + i);
      vel *= 0.3;
    } else if (E.miedo[i] > 0) {
      mx = -dx / dist;
      my = -dy / dist;
    } else {
      switch (def.conducta) {
        case 'volador': {
          // Zigzag por encima de todo
          const w = Math.sin(sim.t * 3 + E.uid[i]) * 0.6;
          mx = dx / dist - (dy / dist) * w;
          my = dy / dist + (dx / dist) * w;
          E.alt[i] = 0.9 + Math.sin(sim.t * 4 + E.uid[i]) * 0.15;
          if (def.id === 'gargola') cargador(sim, i, j, dx, dy, dist, dt);
          break;
        }
        case 'fantasma':
          mx = dx / dist;
          my = dy / dist;
          E.alt[i] = 0.25 + Math.sin(sim.t * 2 + E.uid[i]) * 0.1;
          break;
        case 'arquero': {
          const p = def.proyectil!;
          if (dist < 4.5) {
            mx = -dx / dist;
            my = -dy / dist;
            vel *= 0.8;
          } else if (dist > p.alcance - 1) {
            haciaFlujo(sim, i, dx, dy, dist);
            mx = DIR.x;
            my = DIR.y;
          } else {
            // De lado mientras apunta
            mx = (-dy / dist) * 0.4 * Math.sign(Math.sin(E.uid[i]));
            my = (dx / dist) * 0.4 * Math.sign(Math.sin(E.uid[i]));
          }
          if (E.atqT[i] <= 0 && dist < p.alcance && m.vista(E.x[i], E.y[i], j.x, j.y)) {
            const lead = dist / p.vel;
            const ang = Math.atan2(j.y + j.vy * lead * 0.6 - E.y[i], j.x + j.vx * lead * 0.6 - E.x[i]);
            disparoEnemigo(sim, E.x[i], E.y[i], ang, p.vel, p.dano * sim.esc.dano * sim.calentamiento * (E.elite[i] ? 1.4 : 1), t, p.alcance + 2);
            E.atqT[i] = p.cada * sim.az.entre(0.85, 1.15);
            E.ataque[i] = 1;
          }
          break;
        }
        case 'explosivo':
          if (E.estado[i] === EST.MECHA) {
            E.et[i] -= dt;
            vel = 0;
            if (E.et[i] <= 0) {
              sim.explosionEnemiga(E.x[i], E.y[i], 2.1, E.dano[i]);
              GE.reset();
              GE.callado = true;
              sim.matar(i, GE);
              continue;
            }
          } else if (dist < 1.4) {
            E.estado[i] = EST.MECHA;
            E.et[i] = 0.65;
            E.ataque[i] = 1;
          } else {
            haciaFlujo(sim, i, dx, dy, dist);
            mx = DIR.x;
            my = DIR.y;
          }
          break;
        case 'saltador':
          if (E.estado[i] === EST.SALTANDO) {
            E.et[i] -= dt;
            const u = 1 - Math.max(0, E.et[i]) / 0.45;
            E.alt[i] = Math.sin(u * Math.PI) * 0.7;
            mx = E.vx[i];
            my = E.vy[i];
            vel = 1;
            if (dist < E.r[i] + RADIO_JUGADOR + 0.15 && E.atqT[i] <= 0.6) {
              sim.herir(j, E.dano[i] * 1.2, E.x[i], E.y[i]);
              E.atqT[i] = 1.6;
            }
            if (E.et[i] <= 0) {
              E.estado[i] = EST.NORMAL;
              E.alt[i] = 0;
              E.atqT[i] = Math.max(E.atqT[i], 1.4);
            }
            moverYChocar(sim, i, false, dt, mx, my);
            continue;
          }
          if (dist < 3.6 && dist > 1.2 && E.atqT[i] <= 0 && sim.flujo.distEn(E.x[i], E.y[i]) <= 4) {
            E.estado[i] = EST.SALTANDO;
            E.et[i] = 0.45;
            const v = (dist + 0.5) / 0.45;
            E.vx[i] = (dx / dist) * v;
            E.vy[i] = (dy / dist) * v;
            E.ataque[i] = 1;
            sim.suc.push(S.SALTO, E.x[i], E.y[i], j.x, j.y, 1);
            continue;
          }
          haciaFlujo(sim, i, dx, dy, dist);
          mx = DIR.x;
          my = DIR.y;
          break;
        case 'cargador':
          if (cargador(sim, i, j, dx, dy, dist, dt)) continue;
          haciaFlujo(sim, i, dx, dy, dist);
          mx = DIR.x;
          my = DIR.y;
          break;
        case 'teletransporte':
          E.et[i] -= dt;
          if (E.et[i] <= 0 && dist > 3.5 && dist < 14) {
            E.et[i] = sim.az.entre(4, 6.5);
            const a = Math.atan2(-dy, -dx) + sim.az.entre(-1.2, 1.2);
            const p = m.abiertaCerca(j.x - Math.cos(a) * 2.3, j.y - Math.sin(a) * 2.3, 2);
            if (p) {
              sim.suc.push(S.SALTO, E.x[i], E.y[i], p.x, p.y, 2);
              E.x[i] = p.x;
              E.y[i] = p.y;
              E.atqT[i] = Math.max(E.atqT[i], 0.5);
              continue;
            }
          }
          haciaFlujo(sim, i, dx, dy, dist);
          mx = DIR.x;
          my = DIR.y;
          break;
        case 'encantador':
          E.et[i] -= dt;
          if (dist < 4.5) {
            mx = -dx / dist;
            my = -dy / dist;
          } else if (dist > 7) {
            haciaFlujo(sim, i, dx, dy, dist);
            mx = DIR.x;
            my = DIR.y;
          }
          if (E.et[i] <= 0 && dist < 8 && m.vista(E.x[i], E.y[i], j.x, j.y)) {
            E.et[i] = sim.az.entre(6, 8);
            j.encantoT = 1.6;
            j.encantoX = E.x[i];
            j.encantoY = E.y[i];
            E.ataque[i] = 1;
            sim.suc.push(S.MARCA, j.x, j.y, 1, i);
          }
          break;
        case 'ladron': {
          // Bicho del botín: camina tranquilo hasta que alguien se le acerca; ahí huye cuesta arriba por el campo de
          // flujo (alejándose por las cuevas, sin pegarse contra las paredes) y, si nadie lo alcanza, se escapa
          E.et[i] -= dt;
          if (E.et[i] <= 0) {
            sim.suc.push(S.APARECE, E.x[i], E.y[i], t, 1, 0);
            sim.aviso(28, t);
            E.quitar(i);
            continue;
          }
          if (dist < 7.5 && sim.flujo.direccion(E.x[i], E.y[i], DIR)) {
            mx = -DIR.x;
            my = -DIR.y;
          } else if (dist < 7.5) {
            mx = -dx / dist;
            my = -dy / dist;
          } else {
            mx = Math.cos(E.fase[i] * 0.4 + E.uid[i]);
            my = Math.sin(E.fase[i] * 0.4 + E.uid[i]);
            vel *= 0.45;
          }
          break;
        }
        case 'invocador':
          E.et[i] -= dt;
          if (dist < 5.5) {
            mx = -dx / dist;
            my = -dy / dist;
          } else if (dist > 8) {
            haciaFlujo(sim, i, dx, dy, dist);
            mx = DIR.x;
            my = DIR.y;
          }
          if (E.et[i] <= 0) {
            E.et[i] = 7;
            E.ataque[i] = 1;
            invocarEsqueletos(sim, E.x[i], E.y[i], 3);
          }
          break;
        default: {
          // Perseguir (y enjambres y los que salen de las paredes); algunos van por el objetivo
          if (E.marcadoObj[i] === 2 && sim.flujoObj && objetivoCerca(sim, i, dt)) continue;
          if (E.marcadoObj[i] === 2 && sim.flujoObj && sim.flujoObj.direccion(E.x[i], E.y[i], DIR)) {
            mx = DIR.x;
            my = DIR.y;
          } else {
            haciaFlujo(sim, i, dx, dy, dist);
            mx = DIR.x;
            my = DIR.y;
          }
        }
      }
      // Invocador élite
      if (E.elite[i] & MOD_ELITE.INVOCA) {
        E.et[i] -= dt;
        if (E.et[i] <= 0) {
          E.et[i] = 8;
          invocarEsqueletos(sim, E.x[i], E.y[i], 2);
        }
      }
    }
    // Velocidad deseada + empuje
    const k = Math.min(1, dt * 8);
    E.vx[i] += (mx * vel - E.vx[i]) * k;
    E.vy[i] += (my * vel - E.vy[i]) * k;
    moverYChocar(sim, i, def.vuela || def.conducta === 'fantasma', dt);
    // Pegarle al jugador (los del botín no pegan)
    if (j && E.atqT[i] <= 0 && def.conducta !== 'arquero' && def.dano > 0 && dist < E.r[i] + RADIO_JUGADOR + 0.18 && (!def.vuela || E.alt[i] < 1.4)) {
      const hecho = sim.herir(j, E.dano[i], E.x[i], E.y[i]);
      if (hecho > 0 && E.elite[i] & MOD_ELITE.VAMPIRICO) E.hp[i] = Math.min(E.hpMax[i], E.hp[i] + hecho * 3);
      E.atqT[i] = 1.05;
      E.ataque[i] = 1;
    }
  }
}

/** Dirección por el campo de flujo (o directo si ya está encima). Queda en DIR. */
function haciaFlujo(sim: Sim, i: number, dx: number, dy: number, dist: number) {
  const E = sim.E;
  if (dist < 2.2 || !sim.flujo.direccion(E.x[i], E.y[i], DIR)) {
    DIR.x = dx / dist;
    DIR.y = dy / dist;
  }
}

/** Mueve al enemigo con su velocidad y su empuje, lo separa de los vecinos y lo saca de las paredes. */
function moverYChocar(sim: Sim, i: number, atraviesa: boolean, dt: number, mx?: number, my?: number) {
  const E = sim.E;
  let vx = E.vx[i] + E.kx[i], vy = E.vy[i] + E.ky[i];
  if (mx !== undefined && my !== undefined) {
    vx = mx + E.kx[i];
    vy = my + E.ky[i];
  }
  // Separación de los vecinos (pocos, para que no cueste)
  const n = sim.rej.circulo(E.x[i], E.y[i], 0.9);
  let sx = 0, sy = 0, c = 0;
  for (let k = 0; k < n && c < 5; k++) {
    const o = sim.rej.fuera[k];
    if (o === i || !E.vivo[o]) continue;
    const dx = E.x[i] - E.x[o], dy = E.y[i] - E.y[o];
    const rr = E.r[i] + E.r[o];
    const d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr || d2 < 1e-6) continue;
    const d = Math.sqrt(d2);
    const f = (rr - d) / rr;
    sx += (dx / d) * f;
    sy += (dy / d) * f;
    c++;
  }
  vx += sx * 3.2;
  vy += sy * 3.2;
  const nx = E.x[i] + vx * dt, ny = E.y[i] + vy * dt;
  if (atraviesa) {
    E.x[i] = Math.max(1, Math.min(sim.mapa.w - 1, nx));
    E.y[i] = Math.max(1, Math.min(sim.mapa.h - 1, ny));
  } else {
    const p = PUNTO;
    p.x = nx;
    p.y = E.y[i];
    sim.empujarFuera(p, E.r[i] * 0.9, sim.mapa, true);
    p.y = ny;
    sim.empujarFuera(p, E.r[i] * 0.9, sim.mapa, false);
    // Si quedó dentro de una celda sólida (por el empuje), vuelve a la anterior
    if (esSolida(sim.mapa.get(Math.floor(p.x), Math.floor(p.y)))) {
      p.x = E.x[i];
      p.y = E.y[i];
    }
    E.x[i] = p.x;
    E.y[i] = p.y;
  }
  const v2 = vx * vx + vy * vy;
  if (v2 > 0.04) {
    const objetivo = Math.atan2(vx, vy);
    let d = objetivo - E.rot[i];
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    E.rot[i] += d * Math.min(1, dt * 9);
  }
  E.fase[i] += Math.sqrt(v2) * dt * 2.6;
}
const PUNTO = { x: 0, y: 0 };

/** Embestida de hombres lobo, abominaciones y gárgolas. Devuelve true si ya se movió. */
function cargador(sim: Sim, i: number, j: { x: number; y: number }, dx: number, dy: number, dist: number, dt: number): boolean {
  const E = sim.E;
  const def = TIPOS[E.tipo[i]];
  if (E.estado[i] === EST.CARGANDO) {
    E.et[i] -= dt;
    E.vx[i] *= 0.8;
    E.vy[i] *= 0.8;
    if (E.et[i] <= 0) {
      E.estado[i] = EST.EMBISTIENDO;
      E.et[i] = 0.85;
    }
    return true;
  }
  if (E.estado[i] === EST.EMBISTIENDO) {
    E.et[i] -= dt;
    const vel = E.vel[i] * 3.4;
    const ang = E.rot[i];
    const mx = Math.sin(ang) * vel, my = Math.cos(ang) * vel;
    const ax = E.x[i], ay = E.y[i];
    moverYChocar(sim, i, !!def.vuela, dt, mx, my);
    for (const o of sim.J) {
      if (o.estado !== 0) continue;
      if ((o.x - E.x[i]) ** 2 + (o.y - E.y[i]) ** 2 < (E.r[i] + RADIO_JUGADOR + 0.2) ** 2 && E.atqT[i] <= 0) {
        sim.herir(o, E.dano[i] * 1.5, E.x[i], E.y[i]);
        E.atqT[i] = 1;
      }
    }
    // Chocó contra una pared: queda aturdido
    if (!def.vuela && Math.hypot(E.x[i] - ax, E.y[i] - ay) < vel * dt * 0.3) {
      E.estado[i] = EST.NORMAL;
      E.aturdido[i] = 0.8;
      E.atqT[i] = 3;
      sim.suc.push(S.EXPLOSION, E.x[i], E.y[i], 0.8, 6);
    }
    if (E.et[i] <= 0) {
      E.estado[i] = EST.NORMAL;
      E.atqT[i] = 2.6;
    }
    return true;
  }
  if (dist < 7.5 && dist > 2.2 && E.atqT[i] <= 0 && (def.vuela || sim.mapa.vista(E.x[i], E.y[i], j.x, j.y))) {
    E.estado[i] = EST.CARGANDO;
    E.et[i] = 0.6;
    E.rot[i] = Math.atan2(dx, dy);
    E.ataque[i] = 1;
    sim.suc.push(S.SALTO, E.x[i], E.y[i], j.x, j.y, 3);
    return true;
  }
  return false;
}

/** Los que van por el objetivo le pegan cuando llegan. Devuelve true si está pegándole. */
function objetivoCerca(sim: Sim, i: number, dt: number): boolean {
  const E = sim.E;
  const e = sim.ent.find((x) => x.vivo && x.tipo === ENT.CARRETA && x.est === 1);
  if (!e) return false;
  if ((e.x - E.x[i]) ** 2 + (e.y - E.y[i]) ** 2 > (E.r[i] + 0.9) ** 2) return false;
  E.vx[i] *= 0.7;
  E.vy[i] *= 0.7;
  if (E.atqT[i] <= 0) {
    e.hp -= E.dano[i];
    e.t = 0.3;
    E.atqT[i] = 1.1;
    E.ataque[i] = 1;
  }
  void dt;
  return true;
}

export function invocarEsqueletos(sim: Sim, x: number, y: number, n: number) {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const p = sim.mapa.abiertaCerca(x + Math.cos(a) * 1.4, y + Math.sin(a) * 1.4, 2);
    if (p) aparecerEnemigo(sim, TIPO.esqueleto, p.x, p.y, { desdeTierra: true });
  }
  sim.suc.push(S.INVOCA, x, y, 100);
}

export { EVENTOS };

/** El fantasma del Conde (mutador): un espectro grande y lento que no se muere y persigue a los jugadores toda la
 *  etapa (atraviesa las paredes). Si de alguna manera lo tumban, vuelve a los 20 s. */
function fantasmaDelConde(sim: Sim, dt: number) {
  const E = sim.E;
  if (sim.fantasma >= 0 && (!E.vivo[sim.fantasma] || E.tipo[sim.fantasma] !== TIPO.espectro)) {
    sim.fantasma = -1;
    sim.fantasmaT = 20;
  }
  if (sim.fantasma >= 0) {
    // (no se muere: cada golpe se le cura)
    E.hp[sim.fantasma] = E.hpMax[sim.fantasma];
    return;
  }
  sim.fantasmaT -= dt;
  if (sim.fantasmaT > 0) return;
  const vivos = sim.vivos();
  if (!vivos.length) return;
  const j = sim.az.uno(vivos);
  const a = sim.az.entre(0, Math.PI * 2);
  const p = sim.mapa.abiertaCerca(j.x + Math.cos(a) * 14, j.y + Math.sin(a) * 14, 6) ?? { x: j.x + Math.cos(a) * 14, y: j.y + Math.sin(a) * 14 };
  const i = aparecerEnemigo(sim, TIPO.espectro, p.x, p.y, { vida: 40 });
  if (i < 0) return;
  E.vel[i] = 1.2;
  E.dano[i] *= 3;
  E.esc[i] = 1.9;
  E.r[i] *= 1.5;
  sim.fantasma = i;
  sim.aviso(46);
}
