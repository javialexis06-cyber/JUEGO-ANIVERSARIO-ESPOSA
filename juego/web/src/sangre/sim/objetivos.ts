// Los objetivos de cada etapa (como en Deep Rock Galactic: Survivor): el principal (hierro negro, altares, prisioneros,
// carreta, campana o cacería), el secundario (huevos, frascos, cofres de reliquias), los santuarios de las bendiciones
// y la Campana de Extracción con su cuenta regresiva. En la última etapa, cumplido el objetivo sale el jefe.
import { CUENTA_EXTRACCION } from '../datos/mundo';
import { C } from '../tipos';
import { TIPO, TIPO_ALTAR } from './catalogo';
import { aparecerEnemigo, modsElite } from './enemigos_ia';
import { ENT, type Entidad, REC, S } from './estado';
import { CampoFlujo } from './flujo';
import { aparecerJefe } from './jefes';
import { RADIO_JUGADOR } from './jugador';
import { nuevaEntidad } from './mecanicas';
import { encolarBendicion, encolarCofre, encolarReliquia } from './opciones';
import type { Sim } from './sim';

/** Radio de la campana de extracción (m). */
export const RADIO_CAMPANA = 3.2;
/** Lo que tarda en bajar (s). */
export const BAJADA_CAMPANA = 5;

/** Celdas abiertas lejos del inicio, separadas entre sí, con espacio alrededor. */
function lugares(sim: Sim, n: number, min: number, sep: number, max = 999): { x: number; y: number }[] {
  const m = sim.mapa;
  const d = m.distancias(m.inicio.x, m.inicio.y);
  const cand: number[] = [];
  for (let i = 0; i < m.c.length; i++) {
    if (m.c[i] !== C.VACIO || d[i] === 65535 || d[i] < min || d[i] > max) continue;
    const x = i % m.w, y = (i / m.w) | 0;
    let libre = true;
    for (let dy = -1; dy <= 1 && libre; dy++) for (let dx = -1; dx <= 1; dx++) if (m.get(x + dx, y + dy) !== C.VACIO) libre = false;
    if (libre) cand.push(i);
  }
  const r: { x: number; y: number }[] = [];
  for (let k = 0; k < 400 && r.length < n && cand.length; k++) {
    const i = cand[Math.floor(sim.az.n() * cand.length)];
    const x = (i % m.w) + 0.5, y = ((i / m.w) | 0) + 0.5;
    if (r.some((p) => Math.hypot(p.x - x, p.y - y) < sep)) continue;
    r.push({ x, y });
  }
  // Si no alcanzó con la separación pedida, se relaja
  if (r.length < n && sep > 4) return [...r, ...lugares(sim, n - r.length, Math.max(4, min - 4), sep * 0.6, max)].slice(0, n);
  return r;
}

export function prepararObjetivos(sim: Sim) {
  const n = sim.n;
  const cfg = sim.cfg;
  sim.obj.tipo = cfg.objetivo;
  sim.sec.tipo = cfg.secundario;
  sim.obj.prog = 0;
  sim.obj.hecho = false;
  if (cfg.exp.tutorial) {
    sim.obj.tipo = 'hierro';
    sim.obj.meta = 6;
    sim.sec.meta = 0;
    return;
  }
  switch (cfg.objetivo) {
    case 'hierro':
      sim.obj.meta = 60 + 15 * (n - 1);
      break;
    case 'altares': {
      const meta = 4 + Math.floor(n / 2);
      const ps = lugares(sim, meta, 14, 13);
      sim.obj.meta = ps.length;
      for (const p of ps) aparecerEnemigo(sim, TIPO_ALTAR, p.x, p.y);
      break;
    }
    case 'prisioneros': {
      const ps = lugares(sim, 4 + (n > 2 ? 1 : 0), 12, 14);
      sim.obj.meta = ps.length;
      for (const p of ps) nuevaEntidad(sim, ENT.PRISIONERO, p.x, p.y);
      break;
    }
    case 'carreta': {
      sim.obj.meta = 1;
      const r = sim.mapa.rieles;
      if (r.length > 4) {
        const e = nuevaEntidad(sim, ENT.CARRETA, r[0].x, r[0].y);
        e.hp = e.hpMax = Math.round(700 * (1 + 0.35 * (n - 1)) * (1 + 0.2 * (cfg.etapa - 1)));
        e.est = 1;
        e.k = 1;
        sim.flujoObj = new CampoFlujo(sim.mapa);
      } else sim.obj.tipo = 'hierro';
      break;
    }
    case 'campana': {
      sim.obj.meta = 1;
      const p = lugares(sim, 1, 10, 0, 20)[0] ?? lugares(sim, 1, 6, 0)[0];
      if (p) {
        const e = nuevaEntidad(sim, ENT.CAMPANA_DEF, p.x, p.y);
        e.est = 1;
        sim.flujoObj = new CampoFlujo(sim.mapa);
      }
      break;
    }
    case 'elite':
      sim.obj.meta = 1;
      break;
  }
  if (sim.obj.tipo === 'hierro') sim.obj.meta = 60 + 15 * (n - 1);
  // Secundario
  switch (cfg.secundario) {
    case 'huevos': {
      const m = sim.mapa;
      let puestos = 0;
      for (let k = 0; k < 600 && puestos < 3; k++) {
        const x = sim.az.entero(3, m.w - 4), y = sim.az.entero(3, m.h - 4);
        const t = m.get(x, y);
        if ((t !== C.BLANDA && t !== C.DURA) || !m.expuesta(x, y)) continue;
        if (Math.hypot(x - m.inicio.x, y - m.inicio.y) < 12) continue;
        m.c[m.idx(x, y)] = C.HUEVO;
        m.hp[m.idx(x, y)] = 2.6;
        puestos++;
      }
      sim.sec.meta = puestos;
      break;
    }
    case 'frascos': {
      const ps = lugares(sim, 5, 8, 9);
      for (const p of ps) sim.soltar(REC.FRASCO, p.x, p.y, 1, '', false);
      // Uno o dos escondidos en los bolsillos cerrados (se llega excavando)
      const m = sim.mapa;
      const d = m.distancias(m.inicio.x, m.inicio.y);
      let ocultos = 0;
      for (let k = 0; k < 2000 && ocultos < 2; k++) {
        const i = Math.floor(sim.az.n() * m.c.length);
        if (m.c[i] === C.VACIO && d[i] === 65535) {
          sim.soltar(REC.FRASCO, (i % m.w) + 0.5, ((i / m.w) | 0) + 0.5, 1, '', false);
          ocultos++;
        }
      }
      sim.sec.meta = ps.length + ocultos;
      break;
    }
    case 'cofres': {
      const ps = lugares(sim, 2, 10, 10);
      for (const p of ps) nuevaEntidad(sim, ENT.COFRE_RELIQUIA, p.x, p.y);
      sim.sec.meta = ps.length;
      sim.llavesPendientes = ps.length;
      break;
    }
  }
  // Santuarios de las bendiciones
  for (const p of lugares(sim, 1 + Math.ceil(n / 2), 8, 12)) nuevaEntidad(sim, ENT.SANTUARIO, p.x, p.y);
  // En las bolsas cerradas a veces hay un cofre
  const m = sim.mapa;
  const d = m.distancias(m.inicio.x, m.inicio.y);
  let cofres = 0;
  for (let k = 0; k < 1500 && cofres < 2; k++) {
    const i = Math.floor(sim.az.n() * m.c.length);
    if (m.c[i] === C.VACIO && d[i] === 65535 && sim.az.n() < 0.5) {
      sim.soltar(REC.COFRE, (i % m.w) + 0.5, ((i / m.w) | 0) + 0.5, 1, '', false);
      cofres++;
    }
  }
}

export function actualizarObjetivos(sim: Sim, dt: number) {
  const o = sim.obj;
  if (!o.hecho && o.prog >= o.meta && o.meta > 0) {
    o.hecho = true;
    sim.aviso(1);
    // Premio: un cofre a los pies de quien esté más cerca del centro de la acción y la campana en un minuto
    const ref = sim.vivos()[0];
    if (ref && !sim.cfg.exp.tutorial) sim.soltar(REC.COFRE, ref.x, ref.y, 1);
    if (sim.cfg.exp.tutorial) llamarCampana(sim);
    else sim.limite = Math.min(sim.limite, sim.t + 60);
  }
  // Se acabó el reloj: baja la campana (en la última etapa, sale el jefe)
  if (sim.fase === 'juego' && sim.t >= sim.limite && !sim.sinReloj) {
    sim.aviso(2);
    if (sim.cfg.final) aparecerJefe(sim);
    else llamarCampana(sim);
  }
  // La cacería: el élite marcado sale al rato (uno de los fuertes del bioma, más duro en las etapas finales)
  if (o.tipo === 'elite' && !o.hecho && !sim.ent.some((e) => e.dato === 'caceria') && sim.t >= 35) {
    const p = lugaresCerca(sim);
    if (p) {
      const orden = [...sim.bioma.enemigos].filter((e) => e.id !== 'caballero_muerte').sort((a, b) => b.desde - a.desde);
      const etapa = sim.cfg.etapa;
      const id = etapa >= 3 ? 'caballero_muerte' : orden[Math.min(orden.length - 1, 2 - Math.min(2, etapa - 1))]?.id ?? 'zombi_gordo';
      const mods = etapa >= 3 ? modsElite(sim) | modsElite(sim) : modsElite(sim);
      const i = aparecerEnemigo(sim, TIPO[id], p.x, p.y, { elite: mods, marcado: 1, vida: 0.8 + 0.2 * etapa });
      const e = nuevaEntidad(sim, -1, p.x, p.y);
      e.vivo = false;
      e.dato = 'caceria';
      if (i >= 0) sim.aviso(12);
    }
  }
  for (const e of sim.ent) {
    if (!e.vivo) continue;
    switch (e.tipo) {
      case ENT.PRISIONERO:
        prisionero(sim, e, dt);
        break;
      case ENT.CARRETA:
        carreta(sim, e, dt);
        break;
      case ENT.CAMPANA_DEF:
        campanaDefensa(sim, e, dt);
        break;
      case ENT.COFRE_RELIQUIA:
      case ENT.SANTUARIO:
      case ENT.COFRE_MALDITO:
        abrible(sim, e, dt);
        break;
    }
  }
  if (sim.campana) extraccion(sim, sim.campana, dt);
}

function lugaresCerca(sim: Sim) {
  const vivos = sim.vivos();
  if (!vivos.length) return null;
  for (let k = 0; k < 30; k++) {
    const p = sim.flujo.anillo.length ? sim.flujo.anillo[Math.floor(sim.az.n() * sim.flujo.anillo.length)] : -1;
    if (p < 0) break;
    return { x: (p % sim.mapa.w) + 0.5, y: ((p / sim.mapa.w) | 0) + 0.5 };
  }
  return null;
}

/** ¿Hay algún jugador vivo a menos de r? Devuelve el más cercano. */
function jugadorA(sim: Sim, x: number, y: number, r: number) {
  let mejor: (typeof sim.J)[number] | null = null, md = r * r;
  for (const j of sim.J) {
    if (j.estado !== 0) continue;
    const d = (j.x - x) ** 2 + (j.y - y) ** 2;
    if (d < md) {
      md = d;
      mejor = j;
    }
  }
  return mejor;
}

function prisionero(sim: Sim, e: Entidad, dt: number) {
  if (e.est === 0) {
    const j = jugadorA(sim, e.x, e.y, 1.7);
    if (j) {
      e.prog += dt / 4;
      if (e.prog >= 1) {
        e.est = 1;
        e.quien = j.i;
        sim.obj.prog++;
        j.resumen.prisioneros++;
        sim.suc.push(S.LIBERA, e.x, e.y, e.id);
        sim.aviso(6, sim.obj.prog, sim.obj.meta);
      }
    } else e.prog = Math.max(0, e.prog - dt * 0.3);
    return;
  }
  // Libre: sigue a su salvador (o al vivo más cercano)
  let j = sim.J[e.quien];
  if (!j || j.estado !== 0) {
    const otro = jugadorA(sim, e.x, e.y, 12);
    if (otro) {
      e.quien = otro.i;
      j = otro;
    }
  }
  if (!j || j.estado !== 0) return;
  const dx = j.x - e.x, dy = j.y - e.y;
  const d = Math.hypot(dx, dy);
  if (d > 1.6) {
    const v = Math.min(4.6, d * 2) * dt;
    const p = { x: e.x + (dx / d) * v, y: e.y + (dy / d) * v };
    sim.empujarFuera(p, 0.3, sim.mapa, true);
    if (!sim.mapa.solidaEn(p.x, p.y)) {
      e.x = p.x;
      e.y = p.y;
    }
    e.t += dt;
  }
  if (d > 14) {
    // Se quedó atrás (atrapado): lo alcanza
    e.x = j.x - j.fx;
    e.y = j.y - j.fy;
  }
}

function carreta(sim: Sim, e: Entidad, dt: number) {
  const r = sim.mapa.rieles;
  if (e.t > 0) e.t -= dt;
  if (e.est !== 1) return;
  if (e.hp <= 0) {
    e.est = 2;
    sim.obj.fallo = true;
    sim.aviso(17);
    sim.suc.push(S.EXPLOSION, e.x, e.y, 2, 6);
    if (!sim.obj.hecho) {
      sim.obj.hecho = true;
      if (sim.cfg.final) aparecerJefe(sim);
      else llamarCampana(sim);
    }
    return;
  }
  if (e.k >= r.length) {
    e.est = 2;
    sim.obj.prog = 1;
    return;
  }
  const j = jugadorA(sim, e.x, e.y, 4.5);
  e.cuenta = j ? 1 : 0;
  if (!j) return;
  const p = r[e.k];
  // Escombro delante: no pasa
  if (sim.mapa.get(Math.floor(p.x), Math.floor(p.y)) === C.ESCOMBRO || sim.mapa.solidaEn(p.x, p.y)) {
    e.dato = 'tapada';
    return;
  }
  e.dato = '';
  const dx = p.x - e.x, dy = p.y - e.y;
  const d = Math.hypot(dx, dy);
  const v = 0.95 * dt;
  if (d <= v) {
    e.x = p.x;
    e.y = p.y;
    e.k++;
    sim.obj.prog = Math.min(0.999, e.k / r.length);
    if (e.k >= r.length) sim.obj.prog = 1;
  } else {
    e.x += (dx / d) * v;
    e.y += (dy / d) * v;
  }
}

function campanaDefensa(sim: Sim, e: Entidad, dt: number) {
  if (e.est !== 1) return;
  const j = jugadorA(sim, e.x, e.y, 4.2);
  e.cuenta = j ? 1 : 0;
  sim.presionExtra = sim.evento ? sim.presionExtra : 1.35;
  if (j) {
    e.prog = Math.min(1, e.prog + dt / 100);
    sim.obj.prog = e.prog;
    if (e.prog >= 1) {
      e.est = 2;
      sim.flujoObj = null;
      sim.presionExtra = 1;
    }
  }
}

function abrible(sim: Sim, e: Entidad, dt: number) {
  if (e.est !== 0) return;
  const j = jugadorA(sim, e.x, e.y, 1.5);
  if (e.t > 0) e.t -= dt;
  if (!j) {
    e.prog = Math.max(0, e.prog - dt);
    return;
  }
  if (e.tipo === ENT.COFRE_RELIQUIA && !(j.m.llaves > 0) && !j.tiene('llave_oro')) {
    if (e.t <= 0) {
      sim.aviso(13, j.i);
      e.t = 4;
    }
    return;
  }
  e.prog += dt / (e.tipo === ENT.SANTUARIO ? 1.5 : 1.2);
  if (e.prog < 1) return;
  e.est = 2;
  e.quien = j.i;
  if (e.tipo === ENT.COFRE_RELIQUIA) {
    if (!j.tiene('llave_oro')) j.m.llaves--;
    encolarReliquia(sim, j);
    sim.sec.prog++;
    sim.aviso(11, sim.sec.prog, sim.sec.meta);
  } else if (e.tipo === ENT.SANTUARIO) {
    encolarBendicion(sim, j);
    j.resumen.bendiciones++;
  } else {
    encolarCofre(sim, j, true);
    e.vivo = false;
  }
  sim.suc.push(S.LIBERA, e.x, e.y, e.id);
}

// ------------------------------------------------------------------------------------------------- Extracción
/** Baja la Campana de Extracción en un lugar despejado, lejos (pero no tanto) de los jugadores. */
export function llamarCampana(sim: Sim) {
  if (sim.campana) return;
  const vivos = sim.vivos();
  const ref = vivos[0] ?? sim.J[0];
  const m = sim.mapa;
  const d = m.distancias(ref.x, ref.y);
  const cand: number[] = [];
  let lejos = -1, ld = 0;
  for (let i = 0; i < m.c.length; i++) {
    const di = d[i];
    if (di === 65535 || m.c[i] !== C.VACIO) continue;
    const x = i % m.w, y = (i / m.w) | 0;
    let libre = true;
    for (let dy = -1; dy <= 1 && libre; dy++) for (let dx = -1; dx <= 1; dx++) if (m.get(x + dx, y + dy) !== C.VACIO) libre = false;
    if (!libre) continue;
    // (ni encima ni al otro lado del mapa: con 60 s se llega caminando aunque la horda estorbe)
    if (di >= 10 && di <= 20) cand.push(i);
    if (di > ld && di <= 24) {
      ld = di;
      lejos = i;
    }
  }
  const i = cand.length ? cand[Math.floor(sim.az.n() * cand.length)] : lejos >= 0 ? lejos : m.idx(Math.floor(ref.x), Math.floor(ref.y));
  const e = nuevaEntidad(sim, ENT.EXTRACCION, (i % m.w) + 0.5, ((i / m.w) | 0) + 0.5);
  e.est = 0;
  e.cuenta = CUENTA_EXTRACCION;
  sim.campana = e;
  sim.fase = 'extraccion';
  sim.suc.push(S.CAMPANA, 0, e.x, e.y);
  sim.aviso(5);
}

function extraccion(sim: Sim, e: Entidad, dt: number) {
  e.t += dt;
  if (e.est === 0) {
    if (e.t >= BAJADA_CAMPANA) {
      e.est = 1;
      sim.suc.push(S.CAMPANA, 1, e.x, e.y);
      sim.romperParedes(e.x, e.y, 1.6, null, true);
    }
    return;
  }
  if (e.est !== 1) return;
  e.cuenta -= dt;
  const dentro = (x: number, y: number) => (x - e.x) ** 2 + (y - e.y) ** 2 < (RADIO_CAMPANA + RADIO_JUGADOR) ** 2;
  const vivos = sim.J.filter((j) => j.estado === 0);
  if (vivos.length && vivos.every((j) => dentro(j.x, j.y)) && e.cuenta > 3 && !e.dato) {
    e.cuenta = 3;
    e.dato = 'todos';
    sim.aviso(8);
  }
  if (e.cuenta > 0) return;
  e.est = 2;
  const extraidos: number[] = [];
  for (const j of sim.J) {
    if ((j.estado === 0 || j.estado === 1) && dentro(j.x, j.y)) {
      j.estado = 3;
      j.asegurar();
      extraidos.push(j.i);
    } else if (j.estado !== 3) {
      // Se quedó afuera: pierde lo de esta etapa
      j.oro = j.hierro = j.sangre = 0;
      j.estado = 2;
    }
  }
  let prisioneros = 0;
  for (const p of sim.ent) if (p.vivo && p.tipo === ENT.PRISIONERO && p.est === 1 && dentro(p.x, p.y)) prisioneros++;
  sim.suc.push(S.CAMPANA, 2, e.x, e.y);
  sim.fin = {
    exito: extraidos.length > 0,
    extraidos,
    motivo: extraidos.length ? 'extraccion' : 'derrota',
    objetivo: sim.obj.hecho && !sim.obj.fallo,
    secundario: sim.sec.prog,
    prisioneros,
  };
}

export { RADIO_JUGADOR };
