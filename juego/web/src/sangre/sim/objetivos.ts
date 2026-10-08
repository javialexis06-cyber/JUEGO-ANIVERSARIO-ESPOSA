// Los objetivos de cada etapa (como en Deep Rock Galactic: Survivor): el principal (hierro negro, altares, prisioneros,
// carreta, campana o cacería), el secundario (huevos, frascos, cofres de reliquias), los santuarios de las bendiciones
// y la Campana de Extracción con su cuenta regresiva.
// La etapa se gana peleando: una barra de avance que llenan el tiempo y el objetivo, con oleadas en el camino; llena,
// despierta el Guardián (un élite enorme) y la Noche se impacienta hasta que cae. Al caer él, baja la campana. En la
// etapa final, en vez del Guardián hay cuatro sepulcros con un custodio cada uno; caídos los custodios, sale el jefe.
import { AVANCE_SOLO, CUENTA_EXTRACCION, GUARDIANES, IMPACIENCIA_CADA, PELIGROS, SEPULCROS } from '../datos/mundo';
import { C, esSolida } from '../tipos';
import { TIPO, TIPOS, TIPO_ALTAR } from './catalogo';
import { aparecerEnemigo, modsElite } from './enemigos_ia';
import { ENT, EST, type Entidad, REC, type Recogible, S } from './estado';
import { CampoFlujo } from './flujo';
import { aparecerJefe } from './jefes';
import { type Jugador, RADIO_JUGADOR } from './jugador';
import { nuevaEntidad } from './mecanicas';
import { encolarBendicion, encolarCofre, encolarReliquia } from './opciones';
import type { Sim } from './sim';

/** Radio de la campana de extracción (m). */
export const RADIO_CAMPANA = 3.2;
/** Lo que tarda en bajar (s). */
export const BAJADA_CAMPANA = 5;
/** El cofre de suministros: radio del círculo que hay que excavar y lo que se demora en bajar el ataúd. */
export const RADIO_SUMINISTRO = 2.2;
export const BAJADA_ATAUD = 4;
/** Áreas para abrir (cofres de reliquias, santuarios, cofres malditos) y liberar prisioneros: más grandes que el
 *  dibujo, para que baste con pasar cerca (el anillo del piso las muestra). */
export const RADIO_ABRIR = 2.1;
export const RADIO_LIBERAR = 2.3;
/** Área para recoger los cofres y el equipo que sueltan los élites, y las llaves. */
export const RADIO_GRANDE = 1.5;
export const RADIO_LLAVE = 1.7;
/** Hasta dónde llega la mano al tocar algo con el mouse o el dedo (más lejos, el personaje camina hasta allá). */
export const ALCANCE_MANO = 4.5;

/** Celdas sueltas en los bolsillos cerrados (a los que se llega excavando). */
function enBolsillo(sim: Sim, n: number): { x: number; y: number }[] {
  const m = sim.mapa;
  const d = m.distancias(m.inicio.x, m.inicio.y);
  const r: { x: number; y: number }[] = [];
  for (let k = 0; k < 2000 && r.length < n; k++) {
    const i = Math.floor(sim.az.n() * m.c.length);
    if (m.c[i] === C.VACIO && d[i] === 65535) r.push({ x: (i % m.w) + 0.5, y: ((i / m.w) | 0) + 0.5 });
  }
  return r;
}

/** Rincones con camino (celdas abiertas con roca en 5 o más de las 8 vecinas), lejos del inicio y separados. */
function rincones(sim: Sim, n: number): { x: number; y: number }[] {
  const m = sim.mapa;
  const d = m.distancias(m.inicio.x, m.inicio.y);
  const cand: number[] = [];
  for (let i = 0; i < m.c.length; i++) {
    if (m.c[i] !== C.VACIO || d[i] === 65535 || d[i] < 9) continue;
    const x = i % m.w, y = (i / m.w) | 0;
    let roca = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && m.get(x + dx, y + dy) !== C.VACIO) roca++;
    if (roca >= 5) cand.push(i);
  }
  const r: { x: number; y: number }[] = [];
  for (let k = 0; k < 400 && r.length < n && cand.length; k++) {
    const i = cand[Math.floor(sim.az.n() * cand.length)];
    const x = (i % m.w) + 0.5, y = ((i / m.w) | 0) + 0.5;
    if (r.some((p) => Math.hypot(p.x - x, p.y - y) < 10)) continue;
    r.push({ x, y });
  }
  return r.length < n ? [...r, ...lugares(sim, n - r.length, 8, 10)] : r;
}

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
    case 'rosas': {
      // Regadas por el mapa, y una detrás de la roca
      const ps = lugares(sim, 6, 8, 8);
      for (const p of ps) sim.soltar(REC.ROSA, p.x, p.y, 1, '', false);
      const oculta = enBolsillo(sim, 1);
      for (const p of oculta) sim.soltar(REC.ROSA, p.x, p.y, 1, '', false);
      sim.sec.meta = ps.length + oculta.length;
      break;
    }
    case 'plumas':
      // No están al empezar: caen de a una cerca de alguien mientras dure la etapa (ver plumas())
      sim.sec.meta = 6;
      sim.plumaT = 22;
      break;
    case 'hongos': {
      // Montoncitos de 3 en los rincones (celdas abiertas con roca casi por todos lados), uno en un bolsillo cerrado
      const montones = [...rincones(sim, 3), ...enBolsillo(sim, 1)];
      let puestos = 0;
      for (const p of montones) {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + sim.az.n(), r = k === 0 ? 0 : 0.5;
          if (sim.soltar(REC.HONGO, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 1, '', false)) puestos++;
        }
      }
      sim.sec.meta = puestos;
      break;
    }
  }
  // Santuarios de las bendiciones
  for (const p of lugares(sim, 1 + Math.ceil(n / 2), 8, 12)) nuevaEntidad(sim, ENT.SANTUARIO, p.x, p.y);
  // Etapa final: los sepulcros de los custodios, regados lejos del inicio
  if (cfg.final) for (const p of lugares(sim, SEPULCROS, 11, 13)) nuevaEntidad(sim, ENT.SEPULCRO, p.x, p.y);
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
    // Premio: un cofre a los pies de quien esté más cerca del centro de la acción (y la barra da el salto)
    const ref = sim.vivos()[0];
    if (ref && !sim.cfg.exp.tutorial) sim.soltar(REC.COFRE, ref.x, ref.y, 1);
    if (sim.cfg.exp.tutorial) llamarCampana(sim);
  }
  if (!sim.sinReloj && !sim.cfg.exp.tutorial) avanzar(sim, dt);
  if (sim.sec.tipo === 'plumas') plumas(sim, dt);
  // La cacería: el élite marcado sale al rato (uno de los fuertes del bioma, más duro en las etapas finales)
  if (o.tipo === 'elite' && !o.hecho && !sim.ent.some((e) => e.dato === 'caceria') && sim.t >= 35) {
    const p = lugaresCerca(sim);
    if (p) {
      const orden = [...sim.bioma.enemigos].filter((e) => e.id !== 'caballero_muerte').sort((a, b) => b.desde - a.desde);
      const etapa = sim.cfg.etapa;
      const id = etapa >= 3 ? 'caballero_muerte' : orden[Math.min(orden.length - 1, 2 - Math.min(2, etapa - 1))]?.id ?? 'zombi_gordo';
      // (doble modificador solo desde el peligro 3: en los primeros peligros era el golpe que mataba de una)
      const mods = etapa >= 3 && sim.cfg.exp.peligro >= 3 ? modsElite(sim) | modsElite(sim) : modsElite(sim);
      const i = aparecerEnemigo(sim, TIPO[id], p.x, p.y, { elite: mods, marcado: 1, vida: 0.7 + 0.15 * etapa });
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
      case ENT.SEPULCRO:
        sepulcro(sim, e, dt);
        break;
      case ENT.SUMINISTRO:
        suministro(sim, e, dt);
        break;
    }
  }
  // A la mitad de la barra llega el cofre de suministros (no en la etapa final ni en el tutorial)
  if (!sim.suministroVisto && !sim.cfg.final && !sim.cfg.exp.tutorial && sim.fase === 'juego' && sim.avance >= 0.45) marcarSuministro(sim);
  if (sim.campana) extraccion(sim, sim.campana, dt);
}

/** Las plumas de grifo: cada tanto cae una a 5-9 m de alguien y se va con el viento (despacio); a los 30 s se la
 *  lleva del todo. Siguen cayendo hasta completar la meta (mientras no empiece la extracción). */
function plumas(sim: Sim, dt: number) {
  let vivas = 0;
  for (const r of sim.R) {
    if (!r.vivo || r.tipo !== REC.PLUMA) continue;
    vivas++;
    if (r.hacia >= 0) continue;
    if (r.t > 30) {
      r.vivo = false;
      vivas--;
      continue;
    }
    // (vx, vy = el viento: con la pluma en el piso la caída no los usa)
    const nx = r.x + r.vx * dt, ny = r.y + r.vy * dt;
    if (!sim.mapa.solidaEn(nx, ny)) {
      r.x = nx;
      r.y = ny;
    } else {
      r.vx = -r.vx;
      r.vy = -r.vy;
    }
  }
  if (sim.fase !== 'juego' || sim.sec.prog + vivas >= sim.sec.meta) return;
  sim.plumaT -= dt;
  if (sim.plumaT > 0 || vivas >= 2) return;
  const vivos = sim.vivos();
  if (!vivos.length) return;
  const j = sim.az.uno(vivos);
  for (let k = 0; k < 16; k++) {
    const a = sim.az.n() * Math.PI * 2, d = sim.az.entre(5, 9);
    const p = sim.mapa.abiertaCerca(j.x + Math.cos(a) * d, j.y + Math.sin(a) * d, 3);
    if (!p || sim.flujo.distEn(p.x, p.y) > 25) continue;
    const r = sim.soltar(REC.PLUMA, p.x, p.y, 1, '', false);
    if (r) {
      const v = sim.az.n() * Math.PI * 2;
      r.vx = Math.cos(v) * 0.45;
      r.vy = Math.sin(v) * 0.45;
      sim.aviso(30);
    }
    break;
  }
  sim.plumaT = sim.az.entre(22, 32);
}

// ------------------------------------------------------------------------------------------------- Avance
/** La barra de la etapa: el tiempo la llena despacio y el objetivo de a mucho. En el camino salen las oleadas; llena,
 *  despierta el Guardián (o se abren los sepulcros de la etapa final). */
function avanzar(sim: Sim, dt: number) {
  if (sim.fase === 'juego') {
    sim.avanceT = Math.min(1, sim.avanceT + dt / AVANCE_SOLO);
    sim.calcularAvance();
  }
  while (sim.oleadasHechas < sim.oleadas.length && sim.avance >= sim.oleadas[sim.oleadasHechas]) {
    sim.oleadasHechas++;
    empezarOleada(sim);
  }
  if (sim.oleadaResta > 0) seguirOleada(sim, dt);
  traerImportantes(sim, dt);
  let espera = false;
  if (sim.cfg.final) {
    // Los sepulcros se abren solos a medida que se llena la barra (o antes, si alguien los abre a mano). El jefe sale
    // solo con la barra llena: abrirlos a la carrera adelanta un poco, pero la etapa final no se gana en un minuto
    const seps = sim.ent.filter((e) => e.vivo && e.tipo === ENT.SEPULCRO);
    const abiertos = seps.filter((e) => e.est >= 1).length;
    if (abiertos < Math.floor(sim.avance * seps.length + 1e-6)) {
      const vivos = sim.vivos();
      const cerrado = seps.filter((e) => e.est === 0).sort((a, b) => cercania(vivos, a) - cercania(vivos, b))[0];
      if (cerrado) abrirSepulcro(sim, cerrado, true);
    }
    const todos = seps.every((e) => e.est >= 1);
    if (sim.fase === 'juego' && !sim.jefeVisto && todos && sim.custodiosVivos === 0 && sim.avance >= 1) aparecerJefe(sim);
    espera = sim.fase === 'juego' && !sim.jefeVisto && sim.avance >= 1;
  } else {
    if (sim.avance >= 1 && !sim.guardianVisto && sim.fase === 'juego') aparecerGuardian(sim);
    espera = sim.fase === 'juego' && sim.guardian >= 0;
  }
  // La Noche se impacienta mientras el Guardián (o los custodios) sigan en pie
  if (espera) {
    sim.impacienciaT += dt;
    if (sim.impacienciaT >= IMPACIENCIA_CADA && sim.impaciencia < 8) {
      sim.impacienciaT = 0;
      sim.impaciencia++;
      sim.aviso(22, sim.impaciencia);
    }
  }
}

/** El Guardián, los custodios y el jefe nunca se quedan atascados lejos (en un bolsillo sin camino, o trabados detrás
 *  de una pared mientras los jugadores están en otra punta): si en 8 s no se acercan, se hunden y salen de la tierra
 *  cerca de los jugadores, como en Deep Rock, donde los élites siempre van por uno. */
function traerImportantes(sim: Sim, dt: number) {
  sim.atascoT -= dt;
  if (sim.atascoT > 0) return;
  sim.atascoT = 1;
  const E = sim.E;
  const vivos = sim.vivos();
  if (!vivos.length) return;
  const vistos = new Set<number>();
  for (let i = 0; i < E.max; i++) {
    if (!E.vivo[i] || !(i === sim.guardian || i === sim.jefe || E.marcadoObj[i] === 4)) continue;
    if (E.estado[i] === EST.SALIENDO || E.alt[i] < -0.2) continue;
    const uid = E.uid[i];
    vistos.add(uid);
    let d = Infinity;
    for (const j of vivos) d = Math.min(d, Math.hypot(j.x - E.x[i], j.y - E.y[i]));
    const camino = sim.flujo.distEn(E.x[i], E.y[i]);
    const sinCamino = camino === 65535;
    // (cerca en línea recta pero con roca en medio: el camino da una vuelta enorme)
    const rodeo = !sinCamino && d < 16 && camino > d * 2.2 + 8;
    const m = sim.atascos.get(uid) ?? { d, t: 0 };
    // (se cuenta el tiempo que lleva lejos sin acercarse de verdad)
    if (sinCamino || rodeo || (d > 16 && d > m.d - 1.5)) m.t += 1;
    else {
      m.t = 0;
      m.d = d;
    }
    if (d < m.d) m.d = d;
    sim.atascos.set(uid, m);
    if (m.t < (sinCamino ? 3 : rodeo ? 6 : 8)) continue;
    const p = lugarDeEntrada(sim, 8);
    E.x[i] = p.x;
    E.y[i] = p.y;
    E.vx[i] = E.vy[i] = E.kx[i] = E.ky[i] = 0;
    E.alt[i] = -1;
    E.estado[i] = EST.SALIENDO;
    sim.romperParedes(p.x, p.y, 1.6, null, true);
    sim.suc.push(S.APARECE, p.x, p.y, E.tipo[i], 1, E.elite[i]);
    sim.atascos.set(uid, { d: 8, t: 0 });
  }
  for (const k of sim.atascos.keys()) if (!vistos.has(k)) sim.atascos.delete(k);
}

/** Distancia del más cercano de los vivos a una entidad. */
function cercania(vivos: Jugador[], e: Entidad) {
  let m = Infinity;
  for (const j of vivos) m = Math.min(m, (j.x - e.x) ** 2 + (j.y - e.y) ** 2);
  return m;
}

function empezarOleada(sim: Sim) {
  const pel = PELIGROS[Math.max(0, Math.min(4, sim.cfg.exp.peligro - 1))];
  sim.oleadaResta = Math.round((24 + 9 * sim.n) * (1 + 0.2 * (sim.cfg.etapa - 1)) * pel.cantidad);
  sim.oleadaT = 0;
  sim.aviso(25, sim.oleadasHechas, sim.oleadas.length);
  sim.suc.push(S.JEFE, 6, 0, 0, sim.oleadasHechas);
}

/** La oleada llega en tandas por dos lados, durante unos segundos. */
function seguirOleada(sim: Sim, dt: number) {
  sim.oleadaT -= dt;
  if (sim.oleadaT > 0) return;
  sim.oleadaT = 0.45;
  const vivos = sim.vivos();
  if (!vivos.length) return;
  const cx = vivos.reduce((s, j) => s + j.x, 0) / vivos.length, cy = vivos.reduce((s, j) => s + j.y, 0) / vivos.length;
  const tanda = Math.min(sim.oleadaResta, 4 + sim.n);
  const dir = sim.az.n() * Math.PI * 2;
  let primero = sim.cfg.etapa >= 2 && sim.az.n() < 0.18;
  for (let k = 0; k < tanda; k++) {
    const a = dir + (k % 2 ? Math.PI : 0) + sim.az.entre(-0.7, 0.7), r = sim.az.entre(12, 16);
    const p = sim.mapa.abiertaCerca(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3);
    if (!p || sim.flujo.distEn(p.x, p.y) > 50) continue;
    aparecerEnemigo(sim, sim.tipoAlAzar(), p.x, p.y, { elite: primero ? modsElite(sim) : 0 });
    primero = false;
  }
  sim.oleadaResta -= tanda;
}

/** Un lugar abierto a unos 9 m de los jugadores, con camino hasta ellos (donde sale el Guardián o el jefe). */
export function lugarDeEntrada(sim: Sim, lejos = 9) {
  const vivos = sim.vivos();
  const ref = vivos[0] ?? sim.J[0];
  let p: { x: number; y: number } | null = null;
  for (let k = 0; k < 24 && !p; k++) {
    const a = sim.az.n() * Math.PI * 2;
    const q = sim.mapa.abiertaCerca(ref.x + Math.cos(a) * lejos, ref.y + Math.sin(a) * lejos, 3);
    if (q && sim.flujo.distEn(q.x, q.y) < 40) p = q;
  }
  return p ?? sim.mapa.abiertaCerca(ref.x + 4, ref.y, 6) ?? { x: ref.x, y: ref.y };
}

/** Vida del Guardián: fija (no depende de qué tan flojo sea su tipo), con la escala de la etapa y del grupo. */
function vidaGuardian(sim: Sim) {
  return 1900 * sim.esc.vida * (1 + 0.12 * (sim.cfg.exp.peligro - 1)) * (1 + 0.3 * (sim.n - 1));
}

/** Engorda a un élite para volverlo Guardián o custodio. */
function engordar(sim: Sim, i: number, vida: number, escala: number) {
  const E = sim.E;
  E.hp[i] = E.hpMax[i] = vida;
  if (E.escudo[i] > 0) E.escudo[i] = vida * 0.35;
  E.esc[i] = escala;
  E.r[i] = TIPOS[E.tipo[i]].radio * escala;
  E.dano[i] *= 1.45;
}

/** Se llenó la barra: despierta el Guardián de la etapa. */
export function aparecerGuardian(sim: Sim) {
  sim.guardianVisto = true;
  const lista = GUARDIANES[sim.bioma.id] ?? ['caballero_muerte'];
  const tipo = TIPO[lista[(sim.cfg.etapa - 1) % lista.length]] ?? TIPO.caballero_muerte;
  const p = lugarDeEntrada(sim);
  const dobles = sim.cfg.exp.peligro >= 3 || sim.cfg.etapa >= 3;
  const i = aparecerEnemigo(sim, tipo, p.x, p.y, { elite: modsElite(sim) | (dobles ? modsElite(sim) : 0), desdeTierra: true, marcado: 3 });
  if (i < 0) {
    llamarCampana(sim);
    return;
  }
  engordar(sim, i, vidaGuardian(sim), 1.75);
  sim.guardian = i;
  sim.impacienciaT = 0;
  sim.romperParedes(p.x, p.y, 1.8, null, true);
  sim.suc.push(S.JEFE, 4, p.x, p.y, tipo);
  sim.aviso(21, tipo);
}

/** Cayó el Guardián: botín, un respiro alrededor y baja la campana. */
export function guardianMuerto(sim: Sim, i: number) {
  const E = sim.E;
  const x = E.x[i], y = E.y[i];
  sim.guardian = -1;
  sim.suc.push(S.JEFE, 5, x, y, E.tipo[i]);
  sim.soltarAlmas(x, y, 50 + 15 * sim.cfg.etapa);
  for (let k = 0; k < 3; k++) sim.soltar(REC.ORO, x, y, 5 + sim.az.entero(0, 5));
  if (sim.az.n() < 0.6) sim.soltar(REC.HIERRO, x, y, 3);
  if (sim.az.n() < 0.5) sim.soltar(REC.SANGRE, x, y, 2);
  for (let k = 0; k < sim.n; k++) sim.soltar(REC.COFRE, x, y, 1);
  for (let k = 0; k < E.max; k++) if (E.vivo[k] && k !== i && (E.x[k] - x) ** 2 + (E.y[k] - y) ** 2 < 64) E.aturdido[k] = Math.max(E.aturdido[k], 1.5);
  sim.aviso(23);
  llamarCampana(sim);
}

// ------------------------------------------------------------------------------------------------- Suministros
/** El cofre de suministros (como el de Deep Rock): se marca un círculo de roca cerca de alguien; al excavarlo entero
 *  baja un ataúd colgado de cadenas, y al abrirlo cada uno escoge una reliquia (y se cura un poco). */
function marcarSuministro(sim: Sim) {
  const m = sim.mapa;
  const vivos = sim.vivos();
  if (!vivos.length) return;
  const r = RADIO_SUMINISTRO;
  for (let k = 0; k < 120; k++) {
    const j = vivos[k % vivos.length];
    const a = sim.az.n() * Math.PI * 2, d = sim.az.entre(5, 11);
    const cx = Math.floor(j.x + Math.cos(a) * d), cy = Math.floor(j.y + Math.sin(a) * d);
    if (cx < 5 || cy < 5 || cx >= m.w - 5 || cy >= m.h - 5) continue;
    // Que tenga roca para excavar y que se llegue: al menos 7 celdas de roca y alguna abierta con camino al lado
    let roca = 0, malas = 0, llega = false;
    for (let y = cy - 3; y <= cy + 3; y++)
      for (let x = cx - 3; x <= cx + 3; x++) {
        if ((x + 0.5 - cx - 0.5) ** 2 + (y + 0.5 - cy - 0.5) ** 2 > r * r) continue;
        const t = m.get(x, y);
        if (t === C.BORDE || t === C.LAVA || t === C.AGUA) malas++;
        else if (esSolida(t)) roca++;
        else if (sim.flujo.distEn(x + 0.5, y + 0.5) < 40) llega = true;
      }
    if (malas || roca < 7 || !llega) continue;
    // La roca del círculo se vuelve tierra blanda (que se excava rápido); las vetas se quedan
    let total = 0;
    for (let y = cy - 3; y <= cy + 3; y++)
      for (let x = cx - 3; x <= cx + 3; x++) {
        if ((x + 0.5 - cx - 0.5) ** 2 + (y + 0.5 - cy - 0.5) ** 2 > r * r) continue;
        const t = m.get(x, y);
        if (t === C.DURA) m.poner(x, y, C.BLANDA);
        if (esSolida(m.get(x, y))) total++;
      }
    const e = nuevaEntidad(sim, ENT.SUMINISTRO, cx + 0.5, cy + 0.5);
    e.k = total;
    sim.suministroVisto = true;
    sim.aviso(34);
    return;
  }
  // (si no se encontró dónde, se vuelve a intentar en un rato)
  sim.suministroVisto = sim.az.n() < 0.02;
}

/** Cuánta roca queda en el círculo del cofre de suministros. */
function rocaEnCirculo(sim: Sim, e: Entidad) {
  const m = sim.mapa;
  const r = RADIO_SUMINISTRO;
  const cx = Math.floor(e.x), cy = Math.floor(e.y);
  let n = 0;
  for (let y = cy - 3; y <= cy + 3; y++)
    for (let x = cx - 3; x <= cx + 3; x++) if ((x + 0.5 - e.x) ** 2 + (y + 0.5 - e.y) ** 2 <= r * r && esSolida(m.get(x, y))) n++;
  return n;
}

function suministro(sim: Sim, e: Entidad, dt: number) {
  switch (e.est) {
    case 0: {
      const quedan = rocaEnCirculo(sim, e);
      e.prog = e.k > 0 ? 1 - quedan / e.k : 1;
      if (quedan === 0) {
        e.est = 1;
        e.t = 0;
        e.prog = 0;
        sim.aviso(35);
        sim.suc.push(S.CAMPANA, 0, e.x, e.y);
      }
      break;
    }
    case 1:
      e.t += dt;
      if (e.t >= BAJADA_ATAUD) {
        e.est = 2;
        e.prog = 0;
        sim.suc.push(S.CAMPANA, 1, e.x, e.y);
        sim.aviso(36);
      }
      break;
    case 2: {
      const j = quienUsa(sim, e, RADIO_ABRIR);
      if (!j) {
        e.prog = Math.max(0, e.prog - dt * 0.35);
        return;
      }
      e.prog += dt / 2;
      if (e.prog < 1) return;
      soltarUso(sim, e);
      e.est = 3;
      // Una reliquia para cada uno (las del ataúd son de todos) y un respiro
      for (const o of sim.J) {
        if (o.estado !== 0 && o.estado !== 1) continue;
        encolarReliquia(sim, o);
        if (o.estado === 0) sim.curar(o, o.hpMax * 0.25);
      }
      sim.suc.push(S.LIBERA, e.x, e.y, e.id);
      break;
    }
  }
}

/** Abrir un sepulcro a mano (quedándose al lado, como un cofre). */
function sepulcro(sim: Sim, e: Entidad, dt: number) {
  if (e.est !== 0) return;
  const j = quienUsa(sim, e, RADIO_ABRIR);
  if (!j) {
    e.prog = Math.max(0, e.prog - dt * 0.35);
    return;
  }
  e.prog += dt / 2.5;
  if (e.prog < 1) return;
  soltarUso(sim, e);
  abrirSepulcro(sim, e, false);
}

/** El sepulcro se abre (a mano o solo) y sale su custodio, un élite grande. */
function abrirSepulcro(sim: Sim, e: Entidad, solo: boolean) {
  e.est = 1;
  e.prog = 1;
  const seps = sim.ent.filter((x) => x.vivo && x.tipo === ENT.SEPULCRO);
  const k = seps.filter((x) => x.est >= 1).length;
  const lista = GUARDIANES[sim.bioma.id] ?? ['caballero_muerte'];
  const tipo = TIPO[lista[(k - 1) % lista.length]] ?? TIPO.caballero_muerte;
  // (sale del mismo sepulcro: su celda siempre tiene camino; una vecina podía caer en un bolsillo cerrado)
  const i = aparecerEnemigo(sim, tipo, e.x, e.y, { elite: modsElite(sim), desdeTierra: true, marcado: 4 });
  if (i >= 0) {
    engordar(sim, i, vidaGuardian(sim) * 0.55, 1.5);
    sim.custodiosVivos++;
  }
  // (abrirlo a mano, antes de tiempo, empuja un poquito la barra)
  if (!solo) {
    sim.avanceT = Math.min(1, sim.avanceT + 0.05);
    sim.calcularAvance();
  }
  sim.suc.push(S.LIBERA, e.x, e.y, e.id);
  sim.suc.push(S.JEFE, 7, e.x, e.y, tipo);
  sim.aviso(solo ? 26 : 27, k, seps.length);
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

/** Quién está abriendo o liberando `e`: el que está dentro del área o el que lo tocó y sigue al alcance de la mano. */
export function quienUsa(sim: Sim, e: Entidad, radio: number) {
  const j = jugadorA(sim, e.x, e.y, radio);
  if (j) return j;
  for (const o of sim.J) {
    if (o.usa !== e.id) continue;
    if (o.estado === 0 && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < (ALCANCE_MANO + 0.8) ** 2) return o;
    o.usa = -1;
  }
  return null;
}
/** Ya terminó con `e`: nadie lo sigue usando. */
export function soltarUso(sim: Sim, e: Entidad) {
  for (const o of sim.J) if (o.usa === e.id) o.usa = -1;
}

function prisionero(sim: Sim, e: Entidad, dt: number) {
  if (e.est === 0) {
    const j = quienUsa(sim, e, RADIO_LIBERAR);
    if (j) {
      e.prog += dt / 4;
      if (e.prog >= 1) {
        soltarUso(sim, e);
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
    // (la barra sigue: lo que se pierde es el premio del objetivo)
    sim.obj.hecho = true;
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
  const j = quienUsa(sim, e, RADIO_ABRIR);
  if (e.t > 0) e.t -= dt;
  if (!j) {
    // (se pierde despacio: si la horda obliga a salir un momento, al volver sigue casi donde iba)
    e.prog = Math.max(0, e.prog - dt * 0.35);
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
  soltarUso(sim, e);
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

// ------------------------------------------------------------------------------------------------- Con la mano
/** ¿Se abre o se libera tocándolo? (cofres de reliquias, santuarios, cofres malditos, sepulcros y prisioneros) */
export function esTocable(e: Entidad) {
  return e.vivo && ((e.est === 0 && (e.tipo === ENT.COFRE_RELIQUIA || e.tipo === ENT.SANTUARIO || e.tipo === ENT.COFRE_MALDITO || e.tipo === ENT.PRISIONERO || e.tipo === ENT.SEPULCRO))
    || (e.tipo === ENT.SUMINISTRO && e.est === 2) || (e.tipo === ENT.CAMPANARIO && e.est === 0));
}

/** Lo que hay para recoger o abrir donde se tocó (lo más cercano al punto), o null. Lo usan el aparato (para caminar
 *  hasta allá) y la simulación (para tomarlo). */
export function buscarTocable(est: { R: Recogible[]; ent: Entidad[] }, x: number, y: number): { x: number; y: number; ent: number } | null {
  let mejor: { x: number; y: number; ent: number } | null = null;
  let md = Infinity;
  for (const r of est.R) {
    if (!r.vivo || r.hacia >= 0) continue;
    const d = (r.x - x) ** 2 + (r.y - y) ** 2;
    if (d < 1.4 * 1.4 && d < md) {
      md = d;
      mejor = { x: r.x, y: r.y, ent: -1 };
    }
  }
  for (const e of est.ent) {
    if (!esTocable(e)) continue;
    // (las cosas grandes se tocan desde un poco más lejos y ganan si el toque cae entre las dos)
    const d = (e.x - x) ** 2 + (e.y - y) ** 2 - 0.6;
    if (d < 1.9 * 1.9 && d < md) {
      md = d;
      mejor = { x: e.x, y: e.y, ent: e.id };
    }
  }
  return mejor;
}

/** El jugador tocó (x, y): si hay algo al alcance de la mano, lo atrae (botín) o empieza a abrirlo (cofres, santuarios,
 *  prisioneros). Lo que está cerca del punto tocado viene todo junto (un montón de oro se recoge de un toque). */
export function tomarConMano(sim: Sim, j: Jugador, x: number, y: number) {
  if (j.estado !== 0) return;
  const alcance2 = ALCANCE_MANO * ALCANCE_MANO;
  const b = buscarTocable(sim, x, y);
  if (!b) return;
  if ((b.x - j.x) ** 2 + (b.y - j.y) ** 2 > (ALCANCE_MANO + 0.6) ** 2) return;
  if (b.ent >= 0) {
    j.usa = b.ent;
    return;
  }
  for (const r of sim.R) {
    if (!r.vivo || r.hacia >= 0) continue;
    if ((r.x - b.x) ** 2 + (r.y - b.y) ** 2 > 1.6 * 1.6 || (r.x - j.x) ** 2 + (r.y - j.y) ** 2 > alcance2 + 4) continue;
    r.hacia = j.i;
    r.espera = 0;
  }
}

export { RADIO_JUGADOR };
