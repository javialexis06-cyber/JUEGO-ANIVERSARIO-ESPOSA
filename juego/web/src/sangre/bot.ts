// El piloto automático: juega como un jugador decente (para probar el balance de clases y peligros en Node, y para
// las pruebas del navegador con ?bot). Huye de la horda, va por el objetivo, excava vetas, levanta a los caídos,
// corre a la campana, usa la habilidad cuando lo rodean y escoge mejoras con algo de criterio.
import { C } from './tipos';
import { ENT, REC } from './sim/estado';
import { TIPO_ALTAR } from './sim/catalogo';
import type { Jugador } from './sim/jugador';
import type { Sim } from './sim/sim';
import { escoger } from './sim/opciones';
import { RADIO_CAMPANA } from './sim/objetivos';

interface Memoria {
  meta: { x: number; y: number; cava: boolean } | null;
  dist: Uint16Array | null;
  t: number;
  clave: string;
}
const MEM = new WeakMap<Jugador, Memoria>();
/** Qué tan bien juega (para el balance: `miedo` < 1 esquiva peor, como una persona que todavía no conoce el juego). */
export const NIVEL_BOT = { miedo: 1 };

/** Decide el mando del jugador j para este cuadro. */
export function botPaso(sim: Sim, j: Jugador) {
  if (j.estado !== 0) return;
  let m = MEM.get(j);
  if (!m) MEM.set(j, (m = { meta: null, dist: null, t: 0, clave: '' }));
  // 1. Meta (cada 0,6 s)
  m.t -= 1 / 30;
  if (m.t <= 0) {
    m.t = 0.6;
    const meta = elegirMeta(sim, j);
    const clave = meta ? `${Math.floor(meta.x)},${Math.floor(meta.y)},${meta.cava}` : '';
    if (clave !== m.clave) {
      m.clave = clave;
      m.meta = meta;
      m.dist = meta ? sim.mapa.distancias(meta.x, meta.y, meta.cava) : null;
    } else if (meta && sim.mapa.version % 7 === 0) m.dist = sim.mapa.distancias(meta.x, meta.y, meta.cava);
  }
  let gx = 0, gy = 0;
  if (m.meta && m.dist) {
    const d = bajar(sim, m.dist, j.x, j.y);
    gx = d.x;
    gy = d.y;
    // Ya llegó: si es una veta, empuja contra ella
    if (Math.hypot(m.meta.x - j.x, m.meta.y - j.y) < 1.3) {
      gx = m.meta.x - j.x;
      gy = m.meta.y - j.y;
      if (!m.meta.cava) {
        gx *= 0.2;
        gy *= 0.2;
      }
    }
  }
  // 2. Huir de lo que está cerca (más mientras menos vida)
  const E = sim.E;
  let fx = 0, fy = 0, cerca = 0;
  const n = sim.rej.circulo(j.x, j.y, 4.5);
  for (let k = 0; k < n; k++) {
    const i = sim.rej.fuera[k];
    if (!E.vivo[i] || E.tipo[i] === TIPO_ALTAR) continue;
    const dx = j.x - E.x[i], dy = j.y - E.y[i];
    const d2 = dx * dx + dy * dy;
    if (d2 > 20 || d2 < 1e-4) continue;
    const w = (E.elite[i] ? 3 : 1) / d2;
    fx += dx * w;
    fy += dy * w;
    if (d2 < 6) cerca++;
  }
  // Proyectiles enemigos que vienen
  for (const p of sim.P) {
    if (!p.vivo || p.mov !== 4) continue;
    const dx = j.x - p.x, dy = j.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 9) continue;
    fx += (-p.vy) * Math.sign(dx * -p.vy + dy * p.vx) * 0.4;
    fy += p.vx * Math.sign(dx * -p.vy + dy * p.vx) * 0.4;
  }
  // Zonas de peligro avisadas
  for (const z of sim.Z) {
    if (!z.vivo || !z.enemiga) continue;
    const dx = j.x - z.x, dy = j.y - z.y;
    const d = Math.hypot(dx, dy);
    if (d < z.r + 1.2) {
      fx += (dx / (d || 1)) * 4;
      fy += (dy / (d || 1)) * 4;
    }
  }
  let miedo = (0.8 + (1 - j.hp / j.hpMax) * 2.2) * NIVEL_BOT.miedo;
  // Con la campana abajo lo que importa es llegar y quedarse adentro: huye menos y no se sale del círculo
  const cam = sim.campana;
  if (cam && cam.est === 1) {
    const dc = Math.hypot(cam.x - j.x, cam.y - j.y);
    miedo *= dc > RADIO_CAMPANA - 0.6 ? 0.25 : 0.6;
    if (dc > RADIO_CAMPANA - 1.2) {
      gx += ((cam.x - j.x) / (dc || 1)) * 0.6;
      gy += ((cam.y - j.y) / (dc || 1)) * 0.6;
    }
  }
  let mx = gx + fx * miedo, my = gy + fy * miedo;
  const l = Math.hypot(mx, my);
  if (l > 1e-3) {
    mx /= l;
    my /= l;
  }
  j.mx = mx;
  j.my = my;
  // 3. Habilidad
  if (j.habT <= 0 && (cerca >= 5 || j.hp < j.hpMax * 0.35 || sim.jefe >= 0)) j.pideHabilidad = true;
}

/** Dirección para bajar por un mapa de distancias. */
function bajar(sim: Sim, d: Uint16Array, x: number, y: number) {
  const w = sim.mapa.w;
  const cx = Math.floor(x), cy = Math.floor(y);
  let bx = 0, by = 0, bd = d[cy * w + cx] ?? 65535;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (!sim.mapa.dentro(nx, ny)) continue;
      // Sin cortar esquinas
      if (dx && dy && (sim.mapa.solidaEn(cx + dx + 0.5, cy + 0.5) || sim.mapa.solidaEn(cx + 0.5, cy + dy + 0.5))) continue;
      const v = d[ny * w + nx];
      if (v < bd) {
        bd = v;
        bx = dx;
        by = dy;
      }
    }
  if (!bx && !by) return { x: 0, y: 0 };
  const tx = cx + bx + 0.5 - x, ty = cy + by + 0.5 - y;
  const l = Math.hypot(tx, ty) || 1;
  return { x: tx / l, y: ty / l };
}

function elegirMeta(sim: Sim, j: Jugador): { x: number; y: number; cava: boolean } | null {
  // Campana de extracción
  if (sim.campana) return { x: sim.campana.x, y: sim.campana.y, cava: false };
  // Levantar a un caído
  for (const o of sim.J) if (o.estado === 1 && o.caidoT > 0 && Math.hypot(o.x - j.x, o.y - j.y) < 18) return { x: o.x, y: o.y, cava: false };
  // Comida si va mal
  if (j.hp < j.hpMax * 0.5) {
    const r = cercano(sim, j, (r) => r.tipo === REC.COMIDA, 12);
    if (r) return { x: r.x, y: r.y, cava: false };
  }
  // Cofres y equipo cerca
  const c = cercano(sim, j, (r) => r.tipo === REC.COFRE || r.tipo === REC.EQUIPO || r.tipo === REC.LLAVE, 9);
  if (c) return { x: c.x, y: c.y, cava: false };
  // Santuarios y cofres de reliquias (con llave)
  for (const e of sim.ent) {
    if (!e.vivo || e.est !== 0) continue;
    if ((e.tipo === ENT.SANTUARIO || e.tipo === ENT.COFRE_MALDITO || (e.tipo === ENT.COFRE_RELIQUIA && j.m.llaves > 0)) && Math.hypot(e.x - j.x, e.y - j.y) < 14)
      return { x: e.x, y: e.y, cava: false };
  }
  // El jefe: pelear de lejos
  if (sim.jefe >= 0) return null;
  // Objetivo
  const o = sim.obj;
  if (!o.hecho) {
    switch (o.tipo) {
      case 'hierro':
        return veta(sim, j, C.HIERRO);
      case 'altares': {
        const E = sim.E;
        let mejor = -1, md = Infinity;
        for (let i = 0; i < E.max; i++) if (E.vivo[i] && E.tipo[i] === TIPO_ALTAR) {
          const d = Math.hypot(E.x[i] - j.x, E.y[i] - j.y);
          if (d < md) {
            md = d;
            mejor = i;
          }
        }
        if (mejor >= 0) return md < 3 ? null : { x: E.x[mejor], y: E.y[mejor], cava: false };
        break;
      }
      case 'prisioneros': {
        const p = sim.ent.filter((e) => e.vivo && e.tipo === ENT.PRISIONERO && e.est === 0).sort((a, b) => Math.hypot(a.x - j.x, a.y - j.y) - Math.hypot(b.x - j.x, b.y - j.y))[0];
        if (p) return { x: p.x, y: p.y, cava: false };
        break;
      }
      case 'carreta': {
        const e = sim.ent.find((x) => x.tipo === ENT.CARRETA && x.est === 1);
        if (e) {
          if (e.dato === 'tapada') {
            const r = sim.mapa.rieles[e.k];
            if (r) return { x: r.x, y: r.y, cava: true };
          }
          const r = sim.mapa.rieles[Math.min(sim.mapa.rieles.length - 1, e.k + 2)];
          return { x: r?.x ?? e.x, y: r?.y ?? e.y, cava: false };
        }
        break;
      }
      case 'campana': {
        const e = sim.ent.find((x) => x.tipo === ENT.CAMPANA_DEF && x.est === 1);
        if (e) return { x: e.x, y: e.y, cava: false };
        break;
      }
      case 'elite': {
        const E = sim.E;
        for (let i = 0; i < E.max; i++) if (E.vivo[i] && E.marcadoObj[i] === 1) return Math.hypot(E.x[i] - j.x, E.y[i] - j.y) < 4 ? null : { x: E.x[i], y: E.y[i], cava: false };
        break;
      }
    }
  }
  // Secundario: frascos y huevos
  if (sim.sec.tipo === 'huevos' && sim.sec.prog < sim.sec.meta) {
    const v = veta(sim, j, C.HUEVO);
    if (v && Math.hypot(v.x - j.x, v.y - j.y) < 18) return v;
  }
  const f = cercano(sim, j, (r) => r.tipo === REC.FRASCO || r.tipo === REC.HUEVO, 20);
  if (f) return { x: f.x, y: f.y, cava: true };
  // Vetas de oro y sangre cerca
  const v = veta(sim, j, C.ORO) ?? veta(sim, j, C.SANGRE);
  if (v && Math.hypot(v.x - j.x, v.y - j.y) < 10) return v;
  return null;
}

function cercano(sim: Sim, j: Jugador, filtro: (r: (typeof sim.R)[number]) => boolean, max: number) {
  let mejor = null as (typeof sim.R)[number] | null, md = max * max;
  for (const r of sim.R) {
    if (!r.vivo || !filtro(r)) continue;
    const d = (r.x - j.x) ** 2 + (r.y - j.y) ** 2;
    if (d < md) {
      md = d;
      mejor = r;
    }
  }
  return mejor;
}

/** La celda de veta más cercana (en línea recta). */
function veta(sim: Sim, j: Jugador, tipo: number) {
  const m = sim.mapa;
  let mejor = -1, md = Infinity;
  for (let i = 0; i < m.c.length; i++) {
    if (m.c[i] !== tipo) continue;
    const x = (i % m.w) + 0.5, y = ((i / m.w) | 0) + 0.5;
    const d = (x - j.x) ** 2 + (y - j.y) ** 2;
    if (d < md) {
      md = d;
      mejor = i;
    }
  }
  return mejor < 0 ? null : { x: (mejor % m.w) + 0.5, y: ((mejor / m.w) | 0) + 0.5, cava: true };
}

/** Escoge entre las opciones pendientes con algo de criterio. */
export function botEscoger(sim: Sim, j: Jugador) {
  while (j.cola.length) {
    const e = j.cola[0];
    let mejor = 0, mv = -Infinity;
    e.opciones.forEach((o, k) => {
      let v = o.rareza * 2;
      if (o.tipo === 'evolucion') v += 100;
      else if (o.tipo === 'nueva') v += j.armas.length < 3 ? 30 : 8;
      else if (o.tipo === 'sobrecarga') v += 5 + Math.random();
      else if (o.tipo === 'arma') v += 9;
      else if (o.tipo === 'don') v += 8;
      else if (o.tipo === 'reliquia') v += 20;
      else if (o.tipo === 'equipo') v += 7 + o.rareza * 3;
      else if (o.tipo === 'stat') v += ['dano', 'cadencia', 'area', 'cantidad', 'vida', 'armadura'].includes(o.id) ? 7 : 4;
      else if (o.tipo === 'bendicion') v += 6 + (o.nivel ?? 1);
      else if (o.tipo === 'vida') v += j.hp < j.hpMax * 0.5 ? 12 : 0;
      v += Math.random() * 2;
      if (v > mv) {
        mv = v;
        mejor = k;
      }
    });
    escoger(sim, j, mejor);
  }
}

export { RADIO_CAMPANA };
