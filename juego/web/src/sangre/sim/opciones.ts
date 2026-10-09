// Las elecciones: subir de nivel (1 de 3 con rareza), las sobrecargas de las armas, los cofres (equipo, evolución,
// reliquias, oro), el equipo que cae, las bendiciones de los santuarios y las reliquias. También volver a tirar,
// descartar y aplicar lo escogido.
import { ARMAS, ARMAS_LISTA, MAX_ARMAS, NIVEL_EVOLUCION, NIVEL_MAX_ARMA } from '../datos/armas';
import { ABRE_SPEC, CLASES } from '../datos/clases';
import { BENDICION, BENDICIONES, EQUIPOS, EQUIPO, MEJORA, MEJORAS, OBJETO, PAREJA_EVOLUCION, RELIQUIA, RELIQUIAS, SANTOS, type DefObjeto, type IdSanto } from '../datos/botin';
import { NOMBRE_RAREZA, PESO_RAREZA, RANURAS_EQUIPO, type Eleccion, type Opcion, type Rareza } from '../tipos';
import { soltarOrbitas } from './armas';
import { S } from './estado';
import { ArmaJ, BIT_ETQ, type Jugador, xpPara } from './jugador';
import type { Sim } from './sim';

/** Rareza al azar (la suerte sube las probabilidades de lo bueno). */
export function tirarRareza(az: { n(): number }, suerte: number, bonus = 0): Rareza {
  const s = Math.max(0, suerte);
  const r = az.n();
  const leg = 0.012 + s * 0.0008 + bonus * 0.03;
  const epi = leg + 0.04 + s * 0.0015 + bonus * 0.06;
  const rar = epi + 0.11 + s * 0.002 + bonus * 0.1;
  const poc = rar + 0.26 + s * 0.002 + bonus * 0.1;
  return (r < leg ? 4 : r < epi ? 3 : r < rar ? 2 : r < poc ? 1 : 0) as Rareza;
}

const fmtValor = (v: number, fmt: string) =>
  fmt === '%' ? `${Math.round(v * 1000) / 10} %`.replace('.', ',') : fmt === 'e' ? String(Math.max(1, Math.round(v))) : String(Math.round(v * 10) / 10).replace('.', ',');

/** Cuántos niveles sube «entrenar» según la rareza. */
const NIVELES_ENTRENAR = [1, 2, 2, 3, 4];

// ------------------------------------------------------------------------------------------------- Subir de nivel
export function encolarNivel(sim: Sim, j: Jugador) {
  j.cola.push({ motivo: 'nivel', titulo: `¡Nivel ${j.nivel}!`, opciones: opcionesNivel(sim, j, 3) });
}

interface Candidato {
  tipo: Opcion['tipo'];
  id: string;
  peso: number;
  ranura?: number;
}

function candidatosNivel(j: Jugador): Candidato[] {
  const c: Candidato[] = [];
  const vet = new Set(j.vetadas);
  // Armas nuevas: su arsenal y las comunes desbloqueadas
  if (j.armas.length < MAX_ARMAS) {
    const libres = encontrables(j).filter((id) => ARMAS[id] && !ARMAS[id].evolucion && !j.tieneArma(id) && !vet.has(id));
    const peso = libres.length ? Math.min(2.6, 9 / libres.length) * (j.armas.length <= 1 ? 1.6 : 1) : 0;
    for (const id of libres) c.push({ tipo: 'nueva', id, peso });
  }
  // Entrenar las que ya tiene
  j.armas.forEach((a, k) => {
    if (a.nivel < NIVEL_MAX_ARMA) c.push({ tipo: 'arma', id: a.id, peso: 2.1, ranura: k });
  });
  // Dones de la clase
  for (const d of CLASES[j.clase].dones) if (j.don(d.id) < d.max && !vet.has(d.id)) c.push({ tipo: 'don', id: d.id, peso: 1.9 });
  // Mejoras de estadísticas. Las de etiqueta, como en Deep Rock, solo salen con DOS armas de esa etiqueta (eso arma
  // las combinaciones) y pesan más con tres o cuatro; la potencia y el daño de estados, si algo pone estados.
  const porEtq = new Map<number, number>();
  let estados = false;
  for (const a of j.armas) {
    const bits = a.etq || a.def.etiquetas.reduce((s, e) => s | BIT_ETQ[e], 0);
    for (const b of Object.values(BIT_ETQ)) if (bits & b) porEtq.set(b, (porEtq.get(b) ?? 0) + 1);
    const p = a.p ?? a.def.base;
    if (p.quema > 0 || p.veneno > 0 || p.sangrado > 0 || p.lento > 0) estados = true;
  }
  if (j.bend('herida_abierta') || j.bend('pira') || j.bend('escarcha')) estados = true;
  for (const m of MEJORAS) {
    if (vet.has(m.id)) continue;
    let peso = 1;
    if (m.etiqueta) {
      const n = porEtq.get(BIT_ETQ[m.etiqueta]) ?? 0;
      if (n < 2) continue;
      peso = 0.9 + 0.35 * (n - 2);
    }
    if (m.id === 'potencia' || m.id === 'estados') peso = estados ? 0.8 : 0.08;
    if (m.id === 'cantidad') peso = 0.35;
    if (m.id === 'excavar' && j.st.excavar > 2) peso = 0.4;
    c.push({ tipo: 'stat', id: m.id, peso });
  }
  return c;
}

export function opcionesNivel(sim: Sim, j: Jugador, n: number, evitar: string[] = []): Opcion[] {
  const cands = candidatosNivel(j).filter((c) => !evitar.includes(c.tipo + ':' + c.id));
  const elegidas: Opcion[] = [];
  const usados = new Set<string>();
  for (let k = 0; k < n * 6 && elegidas.length < n; k++) {
    const c = sim.az.pesado(cands.filter((x) => !usados.has(x.tipo + ':' + x.id)), (x) => x.peso);
    if (!c) break;
    usados.add(c.tipo + ':' + c.id);
    let r = tirarRareza(sim.az, j.st.suerte);
    if (c.id === 'cantidad' && r < 3) r = 3;
    const op = describir(j, c.tipo, c.id, r, c.ranura);
    if (op) elegidas.push(op);
  }
  while (elegidas.length < n) elegidas.push(elegidas.length % 2 ? relleno('vida', sim) : relleno('oro', sim));
  return elegidas;
}

function relleno(tipo: 'oro' | 'vida', sim: Sim): Opcion {
  if (tipo === 'oro') return { tipo: 'oro', id: 'oro', rareza: 0, nombre: 'Bolsa de oro', desc: `+${15 + 5 * sim.cfg.etapa} de oro`, glifo: 'oro', nivel: 15 + 5 * sim.cfg.etapa };
  return { tipo: 'vida', id: 'vida', rareza: 0, nombre: 'Pan negro', desc: 'Recupera 30 % de la vida', glifo: 'pan' };
}

/** Arma el texto de una opción. */
export function describir(j: Jugador, tipo: Opcion['tipo'], id: string, r: Rareza, ranura?: number): Opcion | null {
  switch (tipo) {
    case 'stat': {
      const m = MEJORA[id];
      if (!m) return null;
      const v = m.base * PESO_RAREZA[r];
      return { tipo, id, rareza: r, nombre: m.nombre, desc: `+${fmtValor(m.id === 'cantidad' ? 1 : v, m.fmt)} ${m.texto}`, glifo: m.glifo };
    }
    case 'arma': {
      const a = j.armas[ranura ?? -1];
      if (!a) return null;
      const n = Math.min(NIVELES_ENTRENAR[r], NIVEL_MAX_ARMA - a.nivel);
      return { tipo, id, rareza: r, ranura, nombre: a.def.nombre, desc: `Entrenar: sube ${n} ${n === 1 ? 'nivel' : 'niveles'} (Nv ${a.nivel} → ${a.nivel + n})`, glifo: a.def.glifo, icono: a.def.id, nivel: a.nivel + n };
    }
    case 'nueva': {
      const d = ARMAS[id];
      if (!d) return null;
      return { tipo, id, rareza: 0, nombre: d.nombre, desc: `Arma nueva: ${d.desc}`, glifo: d.glifo, icono: d.id, nivel: 1 };
    }
    case 'don': {
      const d = CLASES[j.clase].dones.find((x) => x.id === id);
      if (!d) return null;
      const nv = j.don(id) + 1;
      return { tipo, id, rareza: Math.min(4, nv) as Rareza, nombre: d.nombre, desc: `${d.desc} (${nv}/${d.max})`, glifo: d.glifo, nivel: nv };
    }
  }
  return null;
}

// ------------------------------------------------------------------------------------------------- Sobrecargas
export function encolarSobrecarga(sim: Sim, j: Jugador, ranura: number) {
  const a = j.armas[ranura];
  if (!a || !a.debeSobrecarga) return;
  a.pedidas++;
  const e = eleccionSobrecarga(sim.az, a, ranura, `Nv ${a.nivel}`);
  if (!e) return;
  j.cola.push(e);
  sim.suc.push(S.SOBRECARGA, j.i, ranura);
}

/** Lo que se ofrece en el siguiente escalón de sobrecargas de un arma (como en Deep Rock): las dos primeras veces, 3
 *  de las templadas que quedan; la tercera, las dos malditas (si el arma las tiene). */
export function eleccionSobrecarga(az: { n(): number }, a: ArmaJ, ranura: number, cola: string): Eleccion | null {
  const libres = a.def.sobrecargas.filter((s) => !a.sobrecargas.includes(s.id));
  const templadas = libres.filter((s) => !s.maldita);
  const malditas = libres.filter((s) => s.maldita);
  const yaMaldita = a.def.sobrecargas.some((s) => s.maldita && a.sobrecargas.includes(s.id));
  const tocaMaldita = a.sobrecargas.length >= 2 && malditas.length > 0 && !yaMaldita;
  let lista = tocaMaldita ? malditas : templadas;
  if (!lista.length) lista = libres;
  if (!lista.length) return null;
  // (3 al azar de las que quedan, sin repetir)
  const mezcla = [...lista];
  for (let k = mezcla.length - 1; k > 0; k--) {
    const r = Math.floor(az.n() * (k + 1));
    [mezcla[k], mezcla[r]] = [mezcla[r], mezcla[k]];
  }
  const ofrecidas = mezcla.slice(0, 3);
  return {
    motivo: 'sobrecarga', ranura, titulo: `${tocaMaldita ? 'Sobrecarga maldita' : 'Sobrecarga'} · ${a.def.nombre} ${cola}`,
    opciones: ofrecidas.map((s) => ({ tipo: 'sobrecarga' as const, id: s.id, rareza: (s.maldita ? 4 : 3) as Rareza, ranura, nombre: s.nombre, desc: s.desc, glifo: a.def.glifo, icono: a.def.id })),
  };
}

/** La descripción de un objeto, con las armas suyas que evoluciona (los objetos de siempre también son pareja). */
export function descObjeto(o: DefObjeto, j: Jugador) {
  if (o.evoluciona) return o.desc;
  const ev = j.armas.filter((a) => a.def.evoluciona?.con === o.id).map((a) => a.def.nombre);
  return ev.length ? `${o.desc} Evoluciona: ${ev.join(', ')}.` : o.desc;
}

/** ¿La cuenta ya abrió esta reliquia? (las de siempre, sí; las de hitos, cuando se cumplió su proeza) */
export const abierta = (j: Jugador, id: string) => !RELIQUIA[id]?.hito || (j.perfil.reliquias ?? []).includes(id);

// ------------------------------------------------------------------------------------------------- Lo que se encuentra
const ABIERTAS = new Map<string, string[]>();
/** Las armas que puede encontrar: su arsenal, las comunes que tiene abiertas y las de la etiqueta de su especialización. */
export function encontrables(j: Jugador): string[] {
  if (j.armaUnica) return [];
  const k = `${j.clase}:${j.spec}`;
  let extra = ABIERTAS.get(k);
  if (!extra) {
    const abre = ABRE_SPEC[CLASES[j.clase]?.specs[j.spec]?.id ?? ''] ?? [];
    extra = ARMAS_LISTA.filter((a) => !a.evolucion && a.clase !== j.clase && a.etiquetas.some((e) => abre.includes(e))).map((a) => a.id);
    ABIERTAS.set(k, extra);
  }
  return [...new Set([...j.perfil.arsenal, ...j.perfil.comunes, ...extra])];
}

// ------------------------------------------------------------------------------------------------- Cofres
/** ¿Qué armas de este jugador pueden evolucionar ya? (y las uniones: dos armas altas que se vuelven una) */
export function evolucionables(j: Jugador): { ranura: number; a: ArmaJ; a2: string; ranura2?: number }[] {
  const r: { ranura: number; a: ArmaJ; a2: string; ranura2?: number }[] = [];
  j.armas.forEach((a, k) => {
    const ev = a.def.evoluciona;
    if (!ev || a.nivel < NIVEL_EVOLUCION) return;
    if (j.objeto(ev.con) || j.tiene(ev.con)) r.push({ ranura: k, a, a2: ev.a });
  });
  for (const u of UNIONES_LISTA) {
    const k1 = j.armas.findIndex((a) => a.id === u.union![0] && a.nivel >= NIVEL_EVOLUCION);
    const k2 = j.armas.findIndex((a) => a.id === u.union![1] && a.nivel >= NIVEL_EVOLUCION);
    if (k1 >= 0 && k2 >= 0) r.push({ ranura: k1, a: j.armas[k1], a2: u.id, ranura2: k2 });
  }
  return r;
}
const UNIONES_LISTA = Object.values(ARMAS).filter((a) => a.union);

export function encolarCofre(sim: Sim, j: Jugador, especial: boolean) {
  j.cola.push({ motivo: 'cofre', titulo: especial ? 'Cofre maldito' : 'Cofre', opciones: opcionesCofre(sim, j, especial) });
}

export function opcionesCofre(sim: Sim, j: Jugador, especial: boolean): Opcion[] {
  const n = 3 + (j.tiene('botin_doble') ? 1 : 0);
  const ops: Opcion[] = [];
  for (const e of evolucionables(j)) {
    const d = ARMAS[e.a2];
    if (e.ranura2 !== undefined) {
      const b = j.armas[e.ranura2];
      ops.push({ tipo: 'evolucion', id: e.a2, ranura: e.ranura, ranura2: e.ranura2, rareza: 4, nombre: d.nombre, desc: `¡Unión! ${e.a.def.nombre} y ${b.def.nombre} se vuelven una sola (y queda un espacio libre): ${d.desc.replace(/^[^:]*: /, '')}`, glifo: d.glifo, icono: d.id });
    } else ops.push({ tipo: 'evolucion', id: e.a2, ranura: e.ranura, rareza: 4, nombre: d.nombre, desc: `¡Evolución! ${e.a.def.nombre} se vuelve: ${d.desc}`, glifo: d.glifo, icono: d.id });
    if (ops.length >= 1) break;
  }
  const bonus = especial ? 1.2 : 0.4;
  let intentos = 0;
  while (ops.length < n && intentos++ < 30) {
    const r = sim.az.n();
    if (r < 0.32) {
      const eq = elegirEquipo(sim, j, bonus);
      if (eq && !ops.some((o) => o.id === eq.id)) ops.push(eq);
    } else if (r < 0.45 + (especial ? 0.25 : 0)) {
      const rel = RELIQUIAS.filter((x) => !j.tiene(x.id) && abierta(j, x.id) && !ops.some((o) => o.id === x.id));
      if (rel.length && sim.az.n() < (especial ? 0.8 : sim.cfg.exp.mutadores.includes('relicaria') ? 0.75 : 0.3)) {
        const x = sim.az.uno(rel);
        ops.push({ tipo: 'reliquia', id: x.id, rareza: 4, nombre: x.nombre, desc: x.desc, glifo: x.glifo });
      }
    } else if (r < 0.62) {
      // Un objeto que evoluciona un arma que ya va alta
      const falta = j.armas.find((a) => a.def.evoluciona && a.nivel >= NIVEL_EVOLUCION - 4 && !j.objeto(a.def.evoluciona.con));
      if (falta) {
        const o = OBJETO[falta.def.evoluciona!.con];
        if (o && !ops.some((x) => x.id === o.id)) ops.push({ tipo: 'equipo', id: 'obj:' + o.id, rareza: 3, nombre: o.nombre, desc: descObjeto(o, j), glifo: o.glifo });
      }
    } else if (r < 0.8) {
      const a = j.armas.filter((x) => x.nivel < NIVEL_MAX_ARMA);
      if (a.length) {
        const arma = sim.az.uno(a);
        const k = j.armas.indexOf(arma);
        if (!ops.some((o) => o.tipo === 'arma' && o.ranura === k)) {
          const op = describir(j, 'arma', arma.id, Math.min(4, tirarRareza(sim.az, j.st.suerte, bonus) + 1) as Rareza, k);
          if (op) ops.push(op);
        }
      }
    } else if (r < 0.92) {
      const m = sim.az.uno(MEJORAS.filter((x) => !x.etiqueta && x.id !== 'cantidad'));
      if (!ops.some((o) => o.id === m.id)) {
        const op = describir(j, 'stat', m.id, Math.max(2, tirarRareza(sim.az, j.st.suerte, bonus)) as Rareza);
        if (op) ops.push(op);
      }
    } else if (!ops.some((o) => o.tipo === 'oro')) {
      const v = Math.round((20 + 12 * sim.cfg.etapa) * (especial ? 2 : 1));
      ops.push({ tipo: 'oro', id: 'oro', rareza: 1, nombre: 'Tesoro', desc: `+${v} de oro`, glifo: 'oro', nivel: v });
    }
  }
  while (ops.length < n) ops.push(relleno(ops.length % 2 ? 'vida' : 'oro', sim));
  return ops;
}

function elegirEquipo(sim: Sim, j: Jugador, bonus: number): Opcion | null {
  const r = tirarRareza(sim.az, j.st.suerte, bonus);
  const lista = EQUIPOS.filter((e) => e.rareza === Math.min(3, r) && j.equipo[e.ranura] !== e.id);
  if (!lista.length) return null;
  const e = sim.az.uno(lista);
  const actual = j.equipo[e.ranura] ? EQUIPO[j.equipo[e.ranura]!] : null;
  return {
    tipo: 'equipo', id: e.id, rareza: e.rareza as Rareza, nombre: e.nombre,
    desc: `${e.desc}${actual ? ` (cambia: ${actual.nombre})` : ''}`, glifo: e.ranura,
  };
}

/** Equipo que cae de un élite: ponérselo o fundirlo en oro. */
export function encolarEquipo(sim: Sim, j: Jugador) {
  const eq = elegirEquipo(sim, j, 0.2);
  if (!eq) {
    j.oro += 8;
    return;
  }
  const oro = 6 + 6 * eq.rareza;
  j.cola.push({
    motivo: 'cofre', titulo: 'Equipo encontrado',
    opciones: [eq, { tipo: 'oro', id: 'oro', rareza: 0, nombre: 'Fundirlo', desc: `Lo vendes por ${oro} de oro`, glifo: 'oro', nivel: oro }],
  });
}

// ------------------------------------------------------------------------------------------------- Bendiciones y reliquias
export function encolarBendicion(sim: Sim, j: Jugador) {
  j.cola.push({ motivo: 'bendicion', titulo: 'Santuario de los Santos Oscuros', opciones: opcionesBendicion(sim, j) });
}

export function opcionesBendicion(sim: Sim, j: Jugador): Opcion[] {
  const ops: Opcion[] = [];
  for (const santo of ['sangrio', 'ceniza', 'hueco'] as IdSanto[]) {
    const suyas = BENDICIONES.filter((b) => b.santo === santo && j.bend(b.id) < b.max);
    if (!suyas.length) continue;
    const tiene = suyas.filter((b) => j.bend(b.id) > 0);
    const b = tiene.length && sim.az.n() < 0.5 ? sim.az.uno(tiene) : sim.az.uno(suyas);
    const nv = j.bend(b.id) + 1;
    ops.push({ tipo: 'bendicion', id: b.id, rareza: Math.min(4, 1 + nv) as Rareza, nombre: `${b.nombre} · ${SANTOS[santo].nombre}`, desc: `${b.desc} (${nv}/${b.max})`, glifo: b.glifo, nivel: nv });
  }
  if (!ops.length) ops.push(relleno('vida', sim));
  return ops;
}

export function encolarReliquia(sim: Sim, j: Jugador) {
  const lista = RELIQUIAS.filter((r) => !j.tiene(r.id) && abierta(j, r.id));
  const ops: Opcion[] = [];
  for (let k = 0; k < 3 && lista.length; k++) {
    const r = lista.splice(Math.floor(sim.az.n() * lista.length), 1)[0];
    ops.push({ tipo: 'reliquia', id: r.id, rareza: 4, nombre: r.nombre, desc: r.desc, glifo: r.glifo });
  }
  if (!ops.length) ops.push(relleno('oro', sim));
  j.cola.push({ motivo: 'cofre', titulo: 'Cofre de reliquias', opciones: ops });
}

// ------------------------------------------------------------------------------------------------- Aplicar
/** Aplica la opción k de la primera elección pendiente. Devuelve false si no había. */
export function escoger(sim: Sim, j: Jugador, k: number): boolean {
  const e = j.cola[0];
  if (!e) return false;
  const op = e.opciones[Math.max(0, Math.min(e.opciones.length - 1, k))];
  j.cola.shift();
  if (op) aplicar(sim, j, op);
  return true;
}

export function aplicar(sim: Sim, j: Jugador, op: Opcion) {
  switch (op.tipo) {
    case 'stat': {
      const m = MEJORA[op.id];
      const v = m.id === 'cantidad' ? 1 : m.base * PESO_RAREZA[op.rareza];
      if (m.stat) j.extra[m.stat] += v;
      if (m.etiqueta) j.extraEtq[m.etiqueta] = (j.extraEtq[m.etiqueta] ?? 0) + v;
      j.recalcular();
      break;
    }
    case 'arma': {
      const a = j.armas[op.ranura ?? -1];
      if (!a) break;
      const n = Math.min(NIVELES_ENTRENAR[op.rareza], NIVEL_MAX_ARMA - a.nivel);
      for (let k = 0; k < n; k++) {
        a.nivel++;
        a.xp = 0;
        if (a.debeSobrecarga) encolarSobrecarga(sim, j, op.ranura!);
      }
      a.sucio = true;
      break;
    }
    case 'nueva':
      if (j.armas.length < MAX_ARMAS && ARMAS[op.id]) {
        const a = new ArmaJ(op.id);
        a.t = 0.2;
        j.armas.push(a);
      }
      break;
    case 'don':
      j.dones[op.id] = j.don(op.id) + 1;
      j.recalcular();
      break;
    case 'oro':
      j.oro += op.nivel ?? 15;
      break;
    case 'vida':
      sim.curar(j, j.hpMax * 0.3);
      break;
    case 'sobrecarga': {
      const a = j.armas[op.ranura ?? -1];
      if (a && !a.sobrecargas.includes(op.id)) {
        a.sobrecargas.push(op.id);
        // (todas: una maldita de cinto o consentida les cambia el daño a las otras)
        for (const b of j.armas) b.sucio = true;
      }
      break;
    }
    case 'evolucion': {
      const a = j.armas[op.ranura ?? -1];
      if (!a || !ARMAS[op.id]) break;
      soltarOrbitas(a);
      const n = new ArmaJ(op.id);
      n.nivel = a.nivel;
      n.danoTotal = a.danoTotal;
      n.pedidas = 3;
      j.armas[op.ranura!] = n;
      // Unión: la segunda arma se va y su espacio queda libre (lo que esperaba por ella en la cola se corre)
      const b = op.ranura2 !== undefined ? j.armas[op.ranura2] : undefined;
      if (b && op.ranura2 !== op.ranura) {
        const k2 = op.ranura2!;
        soltarOrbitas(b);
        n.nivel = Math.max(n.nivel, b.nivel);
        n.danoTotal += b.danoTotal;
        j.armas.splice(k2, 1);
        j.cola = j.cola.filter((e) => e.ranura !== k2);
        for (const e of j.cola) {
          if (e.ranura !== undefined && e.ranura > k2) e.ranura--;
          for (const o of e.opciones) if (o.ranura !== undefined && o.ranura > k2) o.ranura--;
        }
        for (const x of j.armas) x.sucio = true;
      }
      sim.suc.push(S.EVOLUCION, j.i, j.armas.indexOf(n));
      break;
    }
    case 'equipo':
      if (op.id.startsWith('obj:')) {
        const id = op.id.slice(4);
        if (OBJETO[id] && !j.objetos.includes(id)) j.objetos.push(id);
      } else {
        const e = EQUIPO[op.id];
        if (e) j.equipo[e.ranura] = e.id;
      }
      j.recalcular();
      break;
    case 'reliquia':
      if (RELIQUIA[op.id] && !j.tiene(op.id)) {
        j.reliquias.push(op.id);
        // Grimorio olvidado: tres niveles de una
        if (op.id === 'grimorio_olvidado') {
          for (let k = 0; k < 3; k++) j.xp += xpPara(j.nivel + k);
          sim.ganarXp(0);
        }
      }
      j.recalcular();
      break;
    case 'bendicion': {
      const b = BENDICION[op.id];
      if (!b) break;
      j.bendiciones[op.id] = j.bend(op.id) + 1;
      // Milagro: cuatro niveles de un mismo santo
      const santo = SANTOS[b.santo];
      const total = BENDICIONES.filter((x) => x.santo === b.santo).reduce((s, x) => s + j.bend(x.id), 0);
      if (total >= 4 && !j.milagros.includes(santo.milagro.id)) {
        j.milagros.push(santo.milagro.id);
        sim.aviso(16, j.i, ['sangrio', 'ceniza', 'hueco'].indexOf(b.santo));
      }
      j.recalcular();
      break;
    }
  }
}

/** Vuelve a tirar las opciones de la elección actual (si le quedan tiradas). */
export function volverATirar(sim: Sim, j: Jugador): boolean {
  const e = j.cola[0];
  if (!e || j.tiradas <= 0 || e.motivo === 'sobrecarga') return false;
  j.tiradas--;
  j.resumen.tiradas = (j.resumen.tiradas ?? 0) + 1;
  // (herradura vieja: esta tirada sale con 20 de suerte más)
  const herradura = j.tiene('herradura_vieja') ? 20 : 0;
  j.st.suerte += herradura;
  if (e.motivo === 'nivel') e.opciones = opcionesNivel(sim, j, e.opciones.length, e.opciones.map((o) => o.tipo + ':' + o.id));
  else if (e.motivo === 'bendicion') e.opciones = opcionesBendicion(sim, j);
  else if (e.titulo === 'Cofre' || e.titulo === 'Cofre maldito') e.opciones = opcionesCofre(sim, j, e.titulo === 'Cofre maldito');
  j.st.suerte -= herradura;
  return true;
}

/** Descarta una opción para siempre en esta expedición (y pone otra en su lugar). */
export function vetar(sim: Sim, j: Jugador, k: number): boolean {
  const e = j.cola[0];
  if (!e || j.vetos <= 0 || e.motivo !== 'nivel') return false;
  const op = e.opciones[k];
  if (!op || op.tipo === 'oro' || op.tipo === 'vida') return false;
  j.vetos--;
  j.vetadas.push(op.id);
  const otra = opcionesNivel(sim, j, 1, e.opciones.map((o) => o.tipo + ':' + o.id))[0];
  e.opciones[k] = otra;
  return true;
}

/** Texto para las pantallas: rareza. */
export const nombreRareza = (r: number) => NOMBRE_RAREZA[r] ?? '';
export { RANURAS_EQUIPO };
export type { Eleccion };
