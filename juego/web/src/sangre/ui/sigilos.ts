// Lo que los sigilos muestran en el HUD: el mapa del Cartógrafo (el croquis de toda la etapa en sombra y, en claro,
// lo que ya recorrieron), el objetivo que señala la Brújula de sangre y lo que ve el Ojo del cuervo.
import { RADIO_CUERVO, RADIO_ZAHORI } from '../datos/sigilos';
import { MINERALES } from '../datos/minerales';
import { TIPO_ALTAR } from '../sim/catalogo';
import { ENT, REC, type Entidad, type Enemigos, type Recogible } from '../sim/estado';
import type { Jugador } from '../sim/jugador';
import type { Mapa } from '../sim/mapa';
import { C, MINERALES_ORDEN, type IdObjetivo, type IdSecundario } from '../tipos';

/** Lo que necesitan los sigilos de la simulación (o del espejo del invitado). */
export interface EstadoSigilos {
  mapa: Mapa;
  ent: Entidad[];
  R: Recogible[];
  E: Enemigos;
  J: Jugador[];
  obj: { tipo: IdObjetivo; meta: number; prog: number; hecho: boolean; fallo: boolean };
  sec: { tipo: IdSecundario; meta: number; prog: number };
  campana: Entidad | null;
  guardian: number;
  jefe: number;
}

type Punto = { x: number; y: number };

// ------------------------------------------------------------------------------------------------- La brújula
/** Lo que falta del objetivo principal y del secundario (puntos del mapa); cumplido el principal, el Guardián, el
 *  jefe o la campana. */
export function objetivosPendientes(est: EstadoSigilos, local: number): Punto[] {
  const l: Punto[] = [];
  const o = est.obj;
  const ent = (tipo: number, est0?: number) => {
    for (const e of est.ent) if (e.vivo && e.tipo === tipo && (est0 === undefined || e.est === est0)) l.push(e);
  };
  const celdas = (c: number) => {
    const m = est.mapa;
    for (let i = 0; i < m.c.length; i++) if (m.c[i] === c) l.push({ x: (i % m.w) + 0.5, y: Math.floor(i / m.w) + 0.5 });
  };
  const rec = (tipo: number) => {
    for (const r of est.R) if (r.vivo && r.tipo === tipo && r.hacia < 0) l.push(r);
  };
  const E = est.E;
  if (!o.hecho && !o.fallo) {
    // (lo que lleva este jugador va al cáliz o al osario)
    const lleva = est.ent.some((e) => e.vivo && (e.tipo === ENT.CRISTAL || e.tipo === ENT.HUEVO_GARGOLA) && e.est === 1 && e.quien === local);
    switch (o.tipo) {
      case 'hierro': celdas(C.HIERRO); break;
      case 'altares': for (let i = 0; i < E.max; i++) if (E.vivo[i] && E.tipo[i] === TIPO_ALTAR) l.push({ x: E.x[i], y: E.y[i] }); break;
      case 'prisioneros': ent(ENT.PRISIONERO, 0); break;
      case 'carreta': ent(ENT.CARRETA); break;
      case 'campana': ent(ENT.CAMPANA_DEF); break;
      case 'elite': for (let i = 0; i < E.max; i++) if (E.vivo[i] && (E.marcadoObj[i] === 1 || E.marcadoObj[i] >= 3)) l.push({ x: E.x[i], y: E.y[i] }); break;
      case 'exorcismo': for (const e of est.ent) if (e.vivo && e.tipo === ENT.CAMPANA_EXO && e.est !== 2) l.push(e); break;
      case 'cosecha': if (lleva) ent(ENT.CALIZ); else ent(ENT.CRISTAL, 0); break;
      case 'cria': if (lleva) ent(ENT.OSARIO); else ent(ENT.HUEVO_GARGOLA, 0); break;
    }
  } else {
    if (est.jefe >= 0 && E.vivo[est.jefe]) l.push({ x: E.x[est.jefe], y: E.y[est.jefe] });
    else if (est.guardian >= 0 && E.vivo[est.guardian]) l.push({ x: E.x[est.guardian], y: E.y[est.guardian] });
    else if (est.campana && est.campana.est < 2) l.push(est.campana);
  }
  if (est.sec.prog < est.sec.meta) {
    switch (est.sec.tipo) {
      case 'mercurio': rec(REC.MERCURIO); break;
      case 'campanitas': rec(REC.CAMPANITA); break;
      case 'huevos': celdas(C.HUEVO); rec(REC.HUEVO); break;
      case 'frascos': rec(REC.FRASCO); break;
      case 'cofres': ent(ENT.COFRE_RELIQUIA, 0); break;
      case 'rosas': rec(REC.ROSA); break;
      case 'plumas': rec(REC.PLUMA); break;
      case 'hongos': rec(REC.HONGO); break;
    }
  }
  return l;
}

/** El objetivo pendiente más cercano al jugador. */
export function objetivoCercano(est: EstadoSigilos, j: Jugador): Punto | null {
  let mejor: Punto | null = null, d0 = Infinity;
  for (const p of objetivosPendientes(est, j.i)) {
    const d = (p.x - j.x) ** 2 + (p.y - j.y) ** 2;
    if (d < d0 && d > 0.8) {
      d0 = d;
      mejor = { x: p.x, y: p.y };
    }
  }
  return mejor;
}

// ------------------------------------------------------------------------------------------------- El ojo del cuervo
/** Cofres, llaves, equipo tirado y prisioneros a menos de RADIO_CUERVO. */
export function tesorosCerca(est: EstadoSigilos, j: Jugador): Punto[] {
  const l: Punto[] = [];
  const R2 = RADIO_CUERVO * RADIO_CUERVO;
  const cerca = (p: Punto) => (p.x - j.x) ** 2 + (p.y - j.y) ** 2 < R2;
  for (const r of est.R) if (r.vivo && r.hacia < 0 && (r.tipo === REC.COFRE || r.tipo === REC.LLAVE || r.tipo === REC.EQUIPO) && cerca(r)) l.push(r);
  for (const e of est.ent) {
    if (!e.vivo || e.est !== 0 || !cerca(e)) continue;
    if (e.tipo === ENT.COFRE_RELIQUIA || e.tipo === ENT.COFRE_MALDITO || e.tipo === ENT.PRISIONERO || e.tipo === ENT.SANTUARIO) l.push(e);
  }
  return l;
}

// ------------------------------------------------------------------------------------------------- El mapa
const COLOR_VETA: Record<number, [number, number, number]> = {
  [C.HIERRO]: [156, 196, 238], [C.ORO]: [255, 211, 74], [C.SANGRE]: [255, 58, 58], [C.HUEVO]: [122, 208, 106],
};
const COLOR_MINERAL = MINERALES_ORDEN.map((id) => {
  const h = MINERALES[id].brillo.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] as [number, number, number];
});

/** El mapa del Cartógrafo: un lienzo chiquito en la esquina (grande al tocarlo). Se descubre a medida que pasan. */
export class Minimapa {
  private visto: Uint8Array | null = null;
  private mapa: Mapa | null = null;
  private img: ImageData | null = null;
  private base = document.createElement('canvas');
  private repintarT = 0;
  constructor(private lienzo: HTMLCanvasElement, private zahori: boolean) {}

  /** Marca lo que ven los jugadores y vuelve a dibujar (unas cinco veces por segundo). */
  actualizar(dt: number, est: EstadoSigilos, local: number, objetivo: Punto | null) {
    const m = est.mapa;
    if (m !== this.mapa || !this.visto) {
      this.mapa = m;
      this.visto = new Uint8Array(m.w * m.h);
      this.base.width = m.w;
      this.base.height = m.h;
      this.img = new ImageData(m.w, m.h);
      this.repintarT = 0;
    }
    // Lo que se descubre: alrededor de cada jugador (radio de unos 7 m)
    const R = 7;
    for (const j of est.J) {
      if (j.estado === 3) continue;
      const x0 = Math.max(0, Math.floor(j.x - R)), x1 = Math.min(m.w - 1, Math.ceil(j.x + R));
      const y0 = Math.max(0, Math.floor(j.y - R)), y1 = Math.min(m.h - 1, Math.ceil(j.y + R));
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if ((cx + 0.5 - j.x) ** 2 + (cy + 0.5 - j.y) ** 2 < R * R) this.visto[cy * m.w + cx] = 1;
    }
    this.repintarT -= dt;
    if (this.repintarT > 0) return;
    this.repintarT = 0.2;
    this.pintarBase(est, local);
    this.pintar(est, local, objetivo);
  }

  /** El croquis: lo abierto en sombra, lo recorrido en claro, las paredes oscuras (y las vetas cerca, con el Zahorí). */
  private pintarBase(est: EstadoSigilos, local: number) {
    const m = this.mapa!, d = this.img!.data, v = this.visto!;
    const yo = est.J[local];
    const RZ2 = RADIO_ZAHORI * RADIO_ZAHORI;
    for (let i = 0; i < m.c.length; i++) {
      const c = m.c[i];
      const vis = v[i] === 1;
      let r: number, g: number, b: number, a = 255;
      if (c === C.VACIO || c === C.AGUA) {
        [r, g, b] = vis ? (c === C.AGUA ? [90, 120, 140] : [168, 148, 118]) : [62, 52, 44];
      } else if (c === C.LAVA) {
        [r, g, b] = vis ? [230, 110, 40] : [90, 46, 24];
      } else if (c === C.BORDE) {
        [r, g, b, a] = [0, 0, 0, 0];
      } else {
        [r, g, b] = vis ? [30, 23, 19] : [18, 14, 12];
        // (el Zahorí: las vetas cerca se ven aunque no se haya pasado)
        if (this.zahori && yo) {
          const x = (i % m.w) + 0.5, y = Math.floor(i / m.w) + 0.5;
          if ((x - yo.x) ** 2 + (y - yo.y) ** 2 < RZ2) {
            const col = c === C.MINERAL ? COLOR_MINERAL[m.v[i] % 6] : COLOR_VETA[c];
            if (col) [r, g, b] = col;
          }
        }
      }
      d[i * 4] = r;
      d[i * 4 + 1] = g;
      d[i * 4 + 2] = b;
      d[i * 4 + 3] = a;
    }
    this.base.getContext('2d')!.putImageData(this.img!, 0, 0);
  }

  private pintar(est: EstadoSigilos, local: number, objetivo: Punto | null) {
    const cv = this.lienzo, m = this.mapa!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
    if (!W || !H) return;
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
    }
    const g = cv.getContext('2d')!;
    g.clearRect(0, 0, W, H);
    const esc = Math.min((W - 6 * dpr) / m.w, (H - 6 * dpr) / m.h);
    const ox = (W - m.w * esc) / 2, oy = (H - m.h * esc) / 2;
    g.imageSmoothingEnabled = false;
    g.drawImage(this.base, ox, oy, m.w * esc, m.h * esc);
    const punto = (x: number, y: number, rad: number, color: string, borde = '#000') => {
      g.beginPath();
      g.arc(ox + x * esc, oy + y * esc, rad * dpr, 0, Math.PI * 2);
      g.fillStyle = color;
      g.fill();
      g.lineWidth = 1.2 * dpr;
      g.strokeStyle = borde;
      g.stroke();
    };
    if (est.campana && est.campana.est < 2) punto(est.campana.x, est.campana.y, 3.2, '#ffe08a');
    if (objetivo) {
      const t = performance.now() / 1000;
      punto(objetivo.x, objetivo.y, 3 + Math.sin(t * 6) * 0.8, '#ff3a3a', '#2a0000');
    }
    for (const j of est.J) {
      if (j.estado === 3) continue;
      punto(j.x, j.y, j.i === local ? 3.2 : 2.6, j.i === local ? '#ffd36a' : '#f0e6d6');
    }
  }
}
