// El Escudo de las Hermanas: la simulación (paso fijo de 1/30 s). No dibuja nada: escena.ts lee su estado y sus
// eventos. Corre igual sin pantalla (el bot de balance la usa en Node).
import {
  ELEMENTOS, ENEMIGOS, ESPERA, HABILIDADES, NIVELES, ORDEN_ELEMENTOS, TORRES, VIDAS, oleadaInfinita,
  type Elemento, type Etapa, type IdEnemigo, type IdTorre, type Nivel, type Oleada, type Punto, type Rama,
} from './datos';

export const PASO = 1 / 30;

/** Azar con semilla (para que el bot y las pruebas den lo mismo cada vez). */
export function azarCon(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// ------------------------------------------------------------------------------------------------- las rutas

export interface Ruta {
  /** Puntos ya suavizados. */
  p: Punto[];
  /** Distancia acumulada hasta cada punto. */
  d: number[];
  largo: number;
}

/** Suaviza las esquinas (Chaikin, dos pasadas) sin mover las puntas. */
function suavizar(pts: Punto[], pasadas = 2): Punto[] {
  let p = pts;
  for (let k = 0; k < pasadas; k++) {
    const q: Punto[] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, az] = p[i], [bx, bz] = p[i + 1];
      if (i > 0) q.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
      if (i < p.length - 2) q.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

export function armarRuta(pts: Punto[]): Ruta {
  const p = suavizar(pts);
  const d = [0];
  for (let i = 1; i < p.length; i++) d.push(d[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  return { p, d, largo: d[d.length - 1] };
}

/** Punto y dirección a una distancia del principio de la ruta. */
export function enRuta(r: Ruta, s: number, out = { x: 0, z: 0, dx: 1, dz: 0 }) {
  s = Math.max(0, Math.min(r.largo, s));
  let lo = 0, hi = r.d.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (r.d[m] <= s) lo = m;
    else hi = m;
  }
  const [ax, az] = r.p[lo], [bx, bz] = r.p[hi];
  const l = r.d[hi] - r.d[lo] || 1;
  const t = (s - r.d[lo]) / l;
  out.x = ax + (bx - ax) * t;
  out.z = az + (bz - az) * t;
  out.dx = (bx - ax) / l;
  out.dz = (bz - az) / l;
  return out;
}

/** Distancia de un punto al camino más cercano (para escoger sitios y repartir la utilería). */
export function distanciaACaminos(rutas: Ruta[], x: number, z: number) {
  let mejor = Infinity;
  for (const r of rutas) {
    for (let i = 0; i < r.p.length - 1; i++) {
      const [ax, az] = r.p[i], [bx, bz] = r.p[i + 1];
      const vx = bx - ax, vz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1)));
      mejor = Math.min(mejor, Math.hypot(x - ax - vx * t, z - az - vz * t));
    }
  }
  return mejor;
}

/** ¿Hay isla en este punto? (la cuadrícula de 4 m menos los huecos del nivel). */
export function hayIsla(n: Nivel, x: number, z: number) {
  if (Math.abs(x) > 17.6 || Math.abs(z) > 9.6) return false;
  const ix = Math.round(x / 4), iz = Math.round(z / 4);
  return !(n.huecos ?? []).some(([a, b]) => a === ix && b === iz);
}

/** Los sitios para construir: los que más camino cubren, separados entre sí y lejos del camino. */
export function escogerSitios(n: Nivel, rutas: Ruta[]): Punto[] {
  const muestras: Punto[] = [];
  for (const r of rutas) for (let s = 0; s < r.largo; s += 0.8) { const q = enRuta(r, s); muestras.push([q.x, q.z]); }
  const cand: { p: Punto; v: number }[] = [];
  for (let x = -15; x <= 13.5; x += 0.5) {
    for (let z = -8.5; z <= 8.5; z += 0.5) {
      const d = distanciaACaminos(rutas, x, z);
      if (d < 1.85 || d > 2.6 || !hayIsla(n, x, z) || !hayIsla(n, x + 1, z) || !hayIsla(n, x - 1, z) || !hayIsla(n, x, z + 1) || !hayIsla(n, x, z - 1)) continue;
      // Cuánto camino ve a 4 m (las esquinas valen más) y un poquito de preferencia por el centro del mapa
      let v = 0;
      for (const [mx, mz] of muestras) if (Math.hypot(mx - x, mz - z) < 4) v++;
      cand.push({ p: [x, z], v: v - Math.abs(x) * 0.05 });
    }
  }
  cand.sort((a, b) => b.v - a.v);
  const out: Punto[] = [...(n.sitiosExtra ?? [])];
  for (const c of cand) {
    if (out.length >= n.sitios) break;
    if (out.every(([x, z]) => Math.hypot(x - c.p[0], z - c.p[1]) >= 2.5)) out.push(c.p);
  }
  return out;
}

// ------------------------------------------------------------------------------------------------- el estado

export interface Enemigo {
  id: number;
  tipo: IdEnemigo;
  ruta: number;
  /** Distancia recorrida en su ruta. */
  s: number;
  /** Corrimiento a un lado del camino (para que no vayan en fila india). */
  lado: number;
  vida: number;
  vidaMax: number;
  armadura: number;
  aereo: boolean;
  vel: number;
  x: number;
  z: number;
  dx: number;
  dz: number;
  lento: number;
  lentoT: number;
  quema: number;
  quemaT: number;
  quieto: number;
  /** Segundos que le quedan dentro de la luz de Lara (si cae ahí, se va acompañado). */
  velado: number;
  purificado: number;
  /** El jefe: relojes de sus poderes. */
  invoca?: number;
  apaga?: number;
  muerto?: boolean;
}

export interface Torre {
  id: number;
  tipo: IdTorre;
  sitio: number;
  x: number;
  z: number;
  nivel: 1 | 2 | 3;
  rama: Rama | null;
  recarga: number;
  /** Hacia dónde mira (radianes, para el dragón y el grifo). */
  giro: number;
  elemento: Elemento;
  /** Segundos apagada por Nath'Gora. */
  apagada: number;
  /** Cambiando de elemento (Fuatia). */
  cambiando: number;
  /** Para la rama b de Lara (enraizar) y la cura del unicornio. */
  reloj2: number;
  /** Lo que el unicornio de al lado le suma (se recalcula cada segundo). */
  bono: { dano: number; rapidez: number; alcance: number };
  /** Toda la luz que se ha gastado en ella (para vender). */
  gastado: number;
  disparando: number;
  /** Cuántos ha vencido (se muestra en el menú). */
  bajas: number;
}

export interface Proyectil {
  id: number;
  tipo: 'fuego' | 'pluma' | 'luz' | Elemento | 'meteoro';
  torre: number;
  x0: number; z0: number; y0: number;
  x1: number; z1: number;
  t: number;
  dur: number;
  /** A quién persigue (si sigue vivo, el punto final lo sigue). */
  blanco: number;
  dano: number;
  radio: number;
  aire: number;
  tierra: number;
  perfora?: boolean;
  quema?: [number, number];
  lento?: [number, number];
  empuja?: number;
  cadena?: number;
  /** Arco de la trayectoria (altura extra en el medio). */
  arco: number;
}

/** Charcos de fuego en el piso (dragón rama b). */
export interface Charco { x: number; z: number; t: number; dps: number; radio: number }

export type Evento =
  | { k: 'disparo'; torre: number; tipo: IdTorre; x: number; z: number; tx: number; tz: number }
  | { k: 'impacto'; tipo: Proyectil['tipo']; x: number; z: number; radio: number; aereo?: boolean }
  | { k: 'pulso'; torre: number; x: number; z: number; radio: number; raiz?: boolean }
  | { k: 'llamarada'; torre: number; x: number; z: number; giro: number; alcance: number; cono: number }
  | { k: 'rayo'; de: [number, number]; a: [number, number][] }
  | { k: 'muerte'; id: number; tipo: IdEnemigo; x: number; z: number; luz: number; acompanado: boolean; aereo: boolean }
  | { k: 'fuga'; id: number; tipo: IdEnemigo; dano: number }
  | { k: 'oleada'; n: number }
  | { k: 'jefe'; id: number }
  | { k: 'jefeMitad'; id: number }
  | { k: 'apaga'; torre: number; x: number; z: number }
  | { k: 'invoca'; x: number; z: number }
  | { k: 'cura'; torre: number }
  | { k: 'habilidad'; id: 'eliana' | 'serena' | 'lazo'; x: number; z: number }
  | { k: 'fin'; gano: boolean }
  | { k: 'construye'; torre: number }
  | { k: 'mejora'; torre: number }
  | { k: 'vende'; torre: number; x: number; z: number }
  | { k: 'elemento'; torre: number; elemento: Elemento };

export interface Opciones {
  semilla?: number;
  /** Modo infinito. */
  infinito?: boolean;
  /** Luz de más al empezar (la misión desde la granja). */
  luzExtra?: number;
  /** Torres permitidas (por defecto las del nivel). */
  torres?: IdTorre[];
}

export class Motor {
  readonly nivel: Nivel;
  readonly rutas: Ruta[];
  readonly sitios: Punto[];
  readonly infinito: boolean;
  readonly torresPermitidas: IdTorre[];
  azar: () => number;
  t = 0;
  luz: number;
  vidas = VIDAS;
  vidasMax = VIDAS;
  /** Oleada que va (0 = ninguna todavía). */
  oleada = 0;
  /** Segundos para la próxima oleada (null: espera a que el jugador la llame, al principio). */
  cuenta: number | null = null;
  enemigos: Enemigo[] = [];
  torres: Torre[] = [];
  proyectiles: Proyectil[] = [];
  charcos: Charco[] = [];
  eventos: Evento[] = [];
  /** Cola de enemigos por salir: [segundos que faltan, tipo, ruta]. */
  private cola: [number, IdEnemigo, number][] = [];
  recargas = { eliana: 0, serena: 0, lazo: 0 };
  /** Segundos que le quedan al Lazo (escudo intocable y torres más fuertes). */
  lazo = 0;
  terminado: null | 'gano' | 'perdio' = null;
  vencidos = 0;
  acompanados = 0;
  luzGanada = 0;
  private sigId = 1;
  private relojApoyo = 0;
  /** El jefe ya pasó la mitad de su vida (para decirlo una vez). */
  private mitadDicha = new Set<number>();

  constructor(nivel: Nivel, op: Opciones = {}) {
    this.nivel = nivel;
    this.infinito = !!op.infinito;
    this.azar = azarCon(op.semilla ?? 23);
    this.rutas = nivel.rutas.map(armarRuta);
    this.sitios = escogerSitios(nivel, this.rutas);
    this.luz = nivel.luz + (op.luzExtra ?? 0);
    this.torresPermitidas = op.torres ?? nivel.torres;
  }

  get totalOleadas() {
    return this.infinito ? Infinity : this.nivel.oleadas.length;
  }

  /** La oleada que viene (para la vista previa). */
  oleadaSiguiente(): Oleada | null {
    if (this.infinito) return this.previaInfinita ??= oleadaInfinita(this.oleada, azarCon(1000 + this.oleada));
    return this.nivel.oleadas[this.oleada] ?? null;
  }
  private previaInfinita: Oleada | null = null;

  /** ¿Ya salió todo lo de la oleada actual y no queda nadie? */
  get oleadaLimpia() {
    return this.cola.length === 0 && this.enemigos.length === 0;
  }
  get saliendo() {
    return this.cola.length > 0;
  }

  // ------------------------------------------------------------------------------------------------ jugadas

  etapa(t: Torre): Etapa {
    const d = TORRES[t.tipo];
    return t.rama ? d.ramas[t.rama] : d.etapas[t.nivel - 1];
  }

  /** Lo que costaría la siguiente mejora (null si ya está al máximo). */
  costoMejora(t: Torre): number | null {
    if (t.rama || t.nivel === 3) return null;
    return TORRES[t.tipo].etapas[t.nivel].costo;
  }

  valorVenta(t: Torre) {
    return Math.floor(t.gastado * 0.6);
  }

  torreEn(sitio: number) {
    return this.torres.find((t) => t.sitio === sitio) ?? null;
  }

  construir(sitio: number, tipo: IdTorre): Torre | null {
    if (this.terminado || this.torreEn(sitio) || !this.sitios[sitio] || !this.torresPermitidas.includes(tipo)) return null;
    const costo = TORRES[tipo].etapas[0].costo;
    if (this.luz < costo) return null;
    this.luz -= costo;
    const [x, z] = this.sitios[sitio];
    const t: Torre = {
      id: this.sigId++, tipo, sitio, x, z, nivel: 1, rama: null, recarga: 0.4, giro: Math.PI, elemento: 'fuego', apagada: 0, cambiando: 0,
      reloj2: 0, bono: { dano: 0, rapidez: 0, alcance: 0 }, gastado: costo, disparando: 0, bajas: 0,
    };
    this.torres.push(t);
    this.recalcularApoyo();
    this.eventos.push({ k: 'construye', torre: t.id });
    return t;
  }

  mejorar(t: Torre): boolean {
    const c = this.costoMejora(t);
    if (c === null || this.luz < c || this.terminado) return false;
    this.luz -= c;
    t.gastado += c;
    t.nivel = (t.nivel + 1) as 2 | 3;
    this.recalcularApoyo();
    this.eventos.push({ k: 'mejora', torre: t.id });
    return true;
  }

  escogerRama(t: Torre, r: Rama): boolean {
    if (t.nivel !== 3 || t.rama || this.terminado) return false;
    const c = TORRES[t.tipo].ramas[r].costo;
    if (this.luz < c) return false;
    this.luz -= c;
    t.gastado += c;
    t.rama = r;
    this.recalcularApoyo();
    this.eventos.push({ k: 'mejora', torre: t.id });
    return true;
  }

  vender(t: Torre) {
    if (this.terminado) return;
    this.luz += this.valorVenta(t);
    this.torres = this.torres.filter((x) => x !== t);
    this.recalcularApoyo();
    this.eventos.push({ k: 'vende', torre: t.id, x: t.x, z: t.z });
  }

  cambiarElemento(t: Torre, e: Elemento) {
    if (t.tipo !== 'fuatia' || t.elemento === e || t.rama === 'b') return;
    t.elemento = e;
    t.cambiando = 1.2;
    this.eventos.push({ k: 'elemento', torre: t.id, elemento: e });
  }

  /** Llama la siguiente oleada ya (si había cuenta, da la luz del tiempo que faltaba). */
  llamarOleada() {
    if (this.terminado) return 0;
    if (this.oleada >= this.totalOleadas) return 0;
    const premio = this.cuenta !== null && this.oleada > 0 ? Math.round(this.cuenta * 2.2) : 0;
    this.luz += premio;
    this.luzGanada += premio;
    this.empezarOleada();
    return premio;
  }

  private empezarOleada() {
    const o = this.oleadaSiguiente();
    this.previaInfinita = null;
    if (!o) return;
    for (const gr of o) {
      for (let i = 0; i < gr.n; i++) {
        const r = gr.r ?? Math.floor(this.azar() * this.rutas.length);
        this.cola.push([(gr.tras ?? 0) + i * gr.cada, gr.t, Math.min(r, this.rutas.length - 1)]);
      }
    }
    this.cola.sort((a, b) => a[0] - b[0]);
    this.oleada++;
    this.cuenta = null;
    this.eventos.push({ k: 'oleada', n: this.oleada });
  }

  habilidadLista(id: 'eliana' | 'serena' | 'lazo') {
    return this.recargas[id] <= 0 && !this.terminado;
  }

  usarHabilidad(id: 'eliana' | 'serena' | 'lazo', x = 0, z = 0): boolean {
    if (!this.habilidadLista(id)) return false;
    const h = HABILIDADES[id];
    this.recargas[id] = h.recarga;
    this.eventos.push({ k: 'habilidad', id, x, z });
    if (id === 'eliana') {
      // La brasa del Alba cae del cielo (tarda un segundo en llegar)
      this.proyectiles.push({ id: this.sigId++, tipo: 'meteoro', torre: 0, x0: x - 3, z0: z - 2, y0: 14, x1: x, z1: z, t: 0, dur: 0.9, blanco: 0,
        dano: 200 + this.oleada * 12, radio: h.radio, aire: 0.6, tierra: 1, quema: [20, 3], arco: 0 });
    } else if (id === 'serena') {
      for (const e of this.enemigos) {
        if (Math.hypot(e.x - x, e.z - z) > h.radio) continue;
        e.lento = 0.92;
        e.lentoT = 4.5;
        e.velado = 4.5;
        this.herir(e, 50 + this.oleada * 4, { aire: 1, tierra: 1, perfora: true }, null);
      }
    } else {
      this.lazo = 9;
    }
    return true;
  }

  // ------------------------------------------------------------------------------------------------ el paso

  paso() {
    if (this.terminado) return;
    const dt = PASO;
    this.t += dt;
    for (const k of ['eliana', 'serena', 'lazo'] as const) this.recargas[k] = Math.max(0, this.recargas[k] - dt);
    this.lazo = Math.max(0, this.lazo - dt);
    // Oleadas
    if (this.cola.length) {
      for (const c of this.cola) c[0] -= dt;
      while (this.cola.length && this.cola[0][0] <= 0) {
        const [, tipo, r] = this.cola.shift()!;
        this.soltar(tipo, r, 0);
      }
    } else if (this.cuenta !== null) {
      this.cuenta -= dt;
      if (this.cuenta <= 0) this.empezarOleada();
    } else if (this.oleada > 0 && this.oleada < this.totalOleadas && this.enemigos.length <= 3) {
      // Ya salió todo: empieza la cuenta para la siguiente
      this.cuenta = ESPERA;
    }
    this.moverEnemigos(dt);
    this.relojApoyo -= dt;
    if (this.relojApoyo <= 0) {
      this.relojApoyo = 1;
      this.recalcularApoyo();
    }
    for (const t of this.torres) this.actuarTorre(t, dt);
    this.moverProyectiles(dt);
    this.charcos = this.charcos.filter((c) => (c.t -= dt) > 0);
    for (const c of this.charcos) for (const e of this.enemigos) if (!e.aereo && Math.hypot(e.x - c.x, e.z - c.z) < c.radio) this.herir(e, c.dps * dt, { aire: 0, tierra: 1 }, null);
    this.limpiarMuertos();
    // ¿Terminó?
    if (this.vidas <= 0) {
      this.vidas = 0;
      this.terminado = 'perdio';
      this.eventos.push({ k: 'fin', gano: false });
    } else if (!this.infinito && this.oleada >= this.totalOleadas && this.oleadaLimpia) {
      this.terminado = 'gano';
      this.eventos.push({ k: 'fin', gano: true });
    }
  }

  private soltar(tipo: IdEnemigo, ruta: number, s: number, lado?: number) {
    const d = ENEMIGOS[tipo];
    const crece = this.infinito ? 1 + this.oleada * 0.13 + this.oleada * this.oleada * 0.004 : this.nivel.fuerza * (1 + (this.oleada - 1) * 0.08);
    const vida = Math.round(d.vida * (tipo === 'jefe' ? (this.infinito ? 0.5 + this.oleada * 0.05 : 1) : crece));
    const e: Enemigo = {
      id: this.sigId++, tipo, ruta, s, lado: lado ?? (this.azar() - 0.5) * (d.aereo ? 1.2 : 0.8), vida, vidaMax: vida, armadura: d.armadura, aereo: d.aereo,
      vel: d.vel * (0.93 + this.azar() * 0.14), x: 0, z: 0, dx: 1, dz: 0, lento: 0, lentoT: 0, quema: 0, quemaT: 0, quieto: 0, velado: 0, purificado: 0,
    };
    if (tipo === 'jefe') {
      e.invoca = 7;
      e.apaga = 10;
      this.eventos.push({ k: 'jefe', id: e.id });
    }
    this.ubicar(e);
    this.enemigos.push(e);
    return e;
  }

  private ubicar(e: Enemigo) {
    const q = enRuta(this.rutas[e.ruta], e.s);
    e.x = q.x - q.dz * e.lado;
    e.z = q.z + q.dx * e.lado;
    e.dx = q.dx;
    e.dz = q.dz;
  }

  private moverEnemigos(dt: number) {
    for (const e of this.enemigos) {
      if (e.lentoT > 0) e.lentoT -= dt;
      else e.lento = 0;
      if (e.quemaT > 0) {
        e.quemaT -= dt;
        this.herir(e, e.quema * dt, { aire: 1, tierra: 1, perfora: true }, null);
      }
      e.velado = Math.max(0, e.velado - dt);
      e.purificado = Math.max(0, e.purificado - dt);
      if (e.quieto > 0) {
        e.quieto -= dt;
        continue;
      }
      e.s += e.vel * (1 - e.lento) * dt;
      this.ubicar(e);
      if (e.tipo === 'jefe') this.poderesJefe(e, dt);
      if (e.s >= this.rutas[e.ruta].largo) {
        e.muerto = true;
        const d = ENEMIGOS[e.tipo].dano;
        if (this.lazo <= 0) this.vidas -= d;
        this.eventos.push({ k: 'fuga', id: e.id, tipo: e.tipo, dano: this.lazo > 0 ? 0 : d });
      }
    }
  }

  private poderesJefe(e: Enemigo, dt: number) {
    e.invoca! -= dt;
    e.apaga! -= dt;
    if (e.invoca! <= 0) {
      e.invoca = 9;
      for (let i = 0; i < 4; i++) this.soltar(i % 2 ? 'mota' : 'sombra', e.ruta, Math.max(0, e.s - 0.6 - i * 0.5), (i - 1.5) * 0.4);
      this.eventos.push({ k: 'invoca', x: e.x, z: e.z });
    }
    if (e.apaga! <= 0) {
      const cerca = this.torres.filter((t) => t.apagada <= 0 && Math.hypot(t.x - e.x, t.z - e.z) < 6.5).sort((a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z))[0];
      if (cerca) {
        e.apaga = 13;
        cerca.apagada = 4.5;
        this.eventos.push({ k: 'apaga', torre: cerca.id, x: cerca.x, z: cerca.z });
      } else e.apaga = 2;
    }
    if (!this.mitadDicha.has(e.id) && e.vida < e.vidaMax / 2) {
      this.mitadDicha.add(e.id);
      this.eventos.push({ k: 'jefeMitad', id: e.id });
    }
  }

  /** Daño a un enemigo con sus resistencias. `torre` lleva la cuenta de bajas. */
  herir(e: Enemigo, dano: number, como: { aire: number; tierra: number; perfora?: boolean }, torre: Torre | null) {
    if (e.muerto || dano <= 0) return;
    const m = e.aereo ? como.aire : como.tierra;
    if (m <= 0) return;
    const armadura = como.perfora || e.purificado > 0 ? 0 : e.armadura;
    e.vida -= dano * m * (1 - armadura) * (this.lazo > 0 ? 1.3 : 1);
    if (e.vida <= 0) {
      e.muerto = true;
      if (torre) torre.bajas++;
      this.morir(e, e.velado > 0);
    }
  }

  private morir(e: Enemigo, acompanado: boolean) {
    const d = ENEMIGOS[e.tipo];
    const luz = Math.round(d.valor * (acompanado ? 1.5 : 1));
    this.luz += luz;
    this.luzGanada += luz;
    this.vencidos++;
    if (acompanado) this.acompanados++;
    this.eventos.push({ k: 'muerte', id: e.id, tipo: e.tipo, x: e.x, z: e.z, luz, acompanado, aereo: e.aereo });
    if (e.tipo === 'divisora') for (let i = 0; i < 3; i++) this.soltar('motita', e.ruta, Math.max(0, e.s - 0.3 * i), (i - 1) * 0.45);
  }

  private limpiarMuertos() {
    if (this.enemigos.some((e) => e.muerto)) this.enemigos = this.enemigos.filter((e) => !e.muerto);
  }

  /** El unicornio les suma a las torres de su radio (no se suma consigo mismo). */
  private recalcularApoyo() {
    for (const t of this.torres) t.bono = { dano: 0, rapidez: 0, alcance: 0 };
    for (const u of this.torres) {
      if (u.tipo !== 'unicornio' || u.apagada > 0) continue;
      const et = this.etapa(u);
      for (const t of this.torres) {
        if (t === u || t.tipo === 'unicornio' || Math.hypot(t.x - u.x, t.z - u.z) > et.alcance) continue;
        t.bono.dano = Math.max(t.bono.dano, et.apoyo!.dano);
        t.bono.rapidez = Math.max(t.bono.rapidez, et.apoyo!.rapidez ?? 0);
        t.bono.alcance = Math.max(t.bono.alcance, et.apoyo!.alcance ?? 0);
      }
    }
  }

  alcanceDe(t: Torre) {
    return this.etapa(t).alcance * (1 + t.bono.alcance);
  }

  /** El que va más adelante dentro del alcance (los voladores primero si la torre los prefiere). */
  private blanco(t: Torre, alcance: number, puedeAire: boolean, puedeTierra: boolean, prefiereAire = false, sin?: Set<number>) {
    let mejor: Enemigo | null = null;
    let mejorV = -Infinity;
    for (const e of this.enemigos) {
      if (e.muerto || (e.aereo ? !puedeAire : !puedeTierra) || sin?.has(e.id)) continue;
      if (Math.hypot(e.x - t.x, e.z - t.z) > alcance) continue;
      const v = e.s / this.rutas[e.ruta].largo + (prefiereAire && e.aereo ? 10 : 0);
      if (v > mejorV) {
        mejorV = v;
        mejor = e;
      }
    }
    return mejor;
  }

  private actuarTorre(t: Torre, dt: number) {
    t.disparando = Math.max(0, t.disparando - dt);
    t.cambiando = Math.max(0, t.cambiando - dt);
    if (t.apagada > 0) {
      t.apagada -= dt;
      return;
    }
    const et = this.etapa(t);
    const fuerza = (1 + t.bono.dano) * (this.lazo > 0 ? 1.3 : 1);
    const alcance = this.alcanceDe(t);
    t.recarga -= dt * (1 + t.bono.rapidez);
    // El unicornio cura el escudo cada tanto aunque no haya nadie
    if (t.tipo === 'unicornio' && et.cura) {
      t.reloj2 += dt;
      if (t.reloj2 >= et.cura) {
        t.reloj2 = 0;
        if (this.vidas < this.vidasMax) {
          this.vidas++;
          this.eventos.push({ k: 'cura', torre: t.id });
        }
      }
      if (et.purifica) for (const e of this.enemigos) if (Math.hypot(e.x - t.x, e.z - t.z) <= alcance) e.purificado = 0.6;
    }
    if (t.tipo === 'lara' && et.aturde) t.reloj2 += dt;
    if (t.recarga > 0) return;
    switch (t.tipo) {
      case 'aura': {
        const sin = new Set<number>();
        let disparo = false;
        for (let k = 0; k < (et.multi ?? 1); k++) {
          const e = this.blanco(t, alcance, false, true, false, sin);
          if (!e) break;
          sin.add(e.id);
          // Apunta adonde va a estar el enemigo cuando llegue la bola
          const dur = 0.75;
          const q = enRuta(this.rutas[e.ruta], e.s + e.vel * (1 - e.lento) * dur * (e.quieto > 0 ? 0 : 1));
          this.proyectiles.push({ id: this.sigId++, tipo: 'fuego', torre: t.id, x0: t.x, z0: t.z, y0: 2.0 + this.alturaBase(t), x1: q.x - q.dz * e.lado,
            z1: q.z + q.dx * e.lado, t: 0, dur, blanco: 0, dano: et.dano * fuerza, radio: et.radio!, aire: 0, tierra: 1, quema: et.quema, arco: 2.2 });
          this.eventos.push({ k: 'disparo', torre: t.id, tipo: t.tipo, x: t.x, z: t.z, tx: e.x, tz: e.z });
          disparo = true;
        }
        if (disparo) { t.recarga = et.cada; t.disparando = 0.4; }
        break;
      }
      case 'lara': {
        const hay = this.enemigos.some((e) => Math.hypot(e.x - t.x, e.z - t.z) <= alcance);
        if (!hay) { t.reloj2 = Math.min(t.reloj2, (et.aturde?.[0] ?? 0) - 0.5); break; }
        t.recarga = et.cada;
        t.disparando = 0.5;
        const raiz = !!et.aturde && t.reloj2 >= et.aturde[0];
        if (raiz) t.reloj2 = 0;
        this.eventos.push({ k: 'pulso', torre: t.id, x: t.x, z: t.z, radio: alcance, raiz });
        for (const e of this.enemigos) {
          if (e.muerto || Math.hypot(e.x - t.x, e.z - t.z) > alcance) continue;
          e.velado = 1.3;
          if (et.lento && et.lento[0] >= e.lento) { e.lento = et.lento[0]; e.lentoT = et.lento[1]; }
          if (raiz && e.tipo !== 'jefe') e.quieto = Math.max(e.quieto, et.aturde![1]);
          if (et.acompana && e.tipo !== 'jefe' && e.vida < e.vidaMax * et.acompana) {
            e.muerto = true;
            t.bajas++;
            this.morir(e, true);
            continue;
          }
          this.herir(e, et.dano * fuerza, { aire: 1, tierra: 1 }, t);
        }
        break;
      }
      case 'dragon': {
        const e = this.blanco(t, alcance, true, true);
        if (!e) break;
        t.recarga = et.cada;
        t.giro = Math.atan2(e.x - t.x, e.z - t.z);
        t.disparando = 0.35;
        const medio = ((et.cono ?? 60) * Math.PI) / 360;
        this.eventos.push({ k: 'llamarada', torre: t.id, x: t.x, z: t.z, giro: t.giro, alcance, cono: et.cono ?? 60 });
        for (const o of this.enemigos) {
          const dx = o.x - t.x, dz = o.z - t.z;
          const d = Math.hypot(dx, dz);
          if (d > alcance) continue;
          let a = Math.atan2(dx, dz) - t.giro;
          a = Math.atan2(Math.sin(a), Math.cos(a));
          if (Math.abs(a) > medio && d > 0.8) continue;
          this.herir(o, et.dano * et.cada * fuerza, { aire: et.aire, tierra: 1, perfora: et.perfora }, t);
        }
        if (et.charco && this.azar() < 0.35) this.charcos.push({ x: e.x, z: e.z, t: et.charco[1], dps: et.charco[0] * fuerza, radio: 0.9 });
        break;
      }
      case 'grifo': {
        const e = this.blanco(t, alcance, true, true, true);
        if (!e) break;
        t.recarga = et.cada;
        t.giro = Math.atan2(e.x - t.x, e.z - t.z);
        t.disparando = 0.3;
        const d = Math.hypot(e.x - t.x, e.z - t.z);
        this.proyectiles.push({ id: this.sigId++, tipo: 'pluma', torre: t.id, x0: t.x, z0: t.z, y0: 2.6 + this.alturaBase(t), x1: e.x, z1: e.z, t: 0,
          dur: 0.12 + d * 0.035, blanco: e.id, dano: et.dano * fuerza, radio: 0, aire: et.aire, tierra: et.tierra, cadena: et.cadena, arco: 0.4 });
        this.eventos.push({ k: 'disparo', torre: t.id, tipo: t.tipo, x: t.x, z: t.z, tx: e.x, tz: e.z });
        break;
      }
      case 'unicornio': {
        const e = this.blanco(t, alcance, true, true);
        if (!e) break;
        t.recarga = et.cada;
        t.giro = Math.atan2(e.x - t.x, e.z - t.z);
        t.disparando = 0.3;
        this.proyectiles.push({ id: this.sigId++, tipo: 'luz', torre: t.id, x0: t.x, z0: t.z, y0: 1.6 + this.alturaBase(t), x1: e.x, z1: e.z, t: 0, dur: 0.3,
          blanco: e.id, dano: et.dano * fuerza, radio: 0, aire: 1, tierra: 1, arco: 0.3 });
        this.eventos.push({ k: 'disparo', torre: t.id, tipo: t.tipo, x: t.x, z: t.z, tx: e.x, tz: e.z });
        break;
      }
      case 'fuatia': {
        if (t.cambiando > 0) break;
        const elementos: Elemento[] = t.rama === 'b' ? ORDEN_ELEMENTOS : [t.elemento];
        // Si el elemento no le llega a nadie (fuego contra voladores), espera
        const puede = (el: Elemento) => ({ aire: ELEMENTOS[el].aire > 0, tierra: ELEMENTOS[el].tierra > 0 });
        const aire = elementos.some((el) => puede(el).aire);
        const tierra = elementos.some((el) => puede(el).tierra);
        const e = this.blanco(t, alcance, aire, tierra, t.elemento === 'aire' && t.rama !== 'b');
        if (!e) break;
        t.recarga = et.cada;
        t.disparando = 0.3;
        t.giro = Math.atan2(e.x - t.x, e.z - t.z);
        const m = et.elementos! * fuerza * (t.rama === 'b' ? 0.75 : 1);
        for (const [i, el] of elementos.entries()) {
          const E = ELEMENTOS[el];
          this.proyectiles.push({ id: this.sigId++, tipo: el, torre: t.id, x0: t.x + (i - 1.5) * 0.15, z0: t.z, y0: 2.2 + this.alturaBase(t), x1: e.x, z1: e.z,
            t: -i * 0.06, dur: 0.35, blanco: e.id, dano: E.dano * m, radio: el === 'tierra' ? 0.8 : 0, aire: E.aire, tierra: E.tierra, perfora: E.perfora,
            quema: E.quema ? [E.quema[0] * m, E.quema[1]] : undefined, lento: E.lento, empuja: E.empuja, arco: 0.8 });
        }
        this.eventos.push({ k: 'disparo', torre: t.id, tipo: t.tipo, x: t.x, z: t.z, tx: e.x, tz: e.z });
        // La Balanza: cambia sola al siguiente
        if (t.rama === 'a') t.elemento = ORDEN_ELEMENTOS[(ORDEN_ELEMENTOS.indexOf(t.elemento) + 1) % 4];
        break;
      }
    }
  }

  /** Altura de la base según el nivel (para que los disparos salgan de arriba). */
  alturaBase(t: Torre) {
    return t.nivel === 1 && !t.rama ? 0.33 : t.nivel === 2 ? 0.48 : 0.58;
  }

  private moverProyectiles(dt: number) {
    const vivos: Proyectil[] = [];
    for (const p of this.proyectiles) {
      p.t += dt;
      if (p.blanco) {
        const e = this.enemigos.find((x) => x.id === p.blanco && !x.muerto);
        if (e) { p.x1 = e.x; p.z1 = e.z; }
      }
      if (p.t < p.dur) { vivos.push(p); continue; }
      this.impactar(p);
    }
    this.proyectiles = vivos;
  }

  private impactar(p: Proyectil) {
    const torre = this.torres.find((t) => t.id === p.torre) ?? null;
    const como = { aire: p.aire, tierra: p.tierra, perfora: p.perfora };
    const aplicar = (e: Enemigo, dano: number) => {
      if (p.quema && (!e.aereo || p.aire > 0) && p.quema[0] >= e.quema) { e.quema = p.quema[0]; e.quemaT = p.quema[1]; }
      if (p.lento && p.lento[0] >= e.lento) { e.lento = p.lento[0]; e.lentoT = p.lento[1]; }
      if (p.empuja && e.aereo && e.tipo !== 'jefe') e.s = Math.max(0, e.s - p.empuja);
      this.herir(e, dano, como, torre);
    };
    if (p.radio > 0) {
      let aereoGolpeado = false;
      for (const e of this.enemigos) {
        if (Math.hypot(e.x - p.x1, e.z - p.z1) > p.radio + ENEMIGOS[e.tipo].radio * 0.5) continue;
        if (e.aereo) aereoGolpeado = true;
        aplicar(e, p.dano);
      }
      this.eventos.push({ k: 'impacto', tipo: p.tipo, x: p.x1, z: p.z1, radio: p.radio, aereo: aereoGolpeado });
      return;
    }
    const e = this.enemigos.find((x) => x.id === p.blanco && !x.muerto);
    if (!e) return;
    aplicar(e, p.dano);
    this.eventos.push({ k: 'impacto', tipo: p.tipo, x: e.x, z: e.z, radio: 0, aereo: e.aereo });
    if (p.cadena) {
      const saltos: [number, number][] = [];
      const ya = new Set([e.id]);
      let de = e;
      let dano = p.dano;
      for (let i = 0; i < p.cadena; i++) {
        const sig = this.enemigos.filter((x) => !x.muerto && !ya.has(x.id) && Math.hypot(x.x - de.x, x.z - de.z) < 3.2)
          .sort((a, b) => Math.hypot(a.x - de.x, a.z - de.z) - Math.hypot(b.x - de.x, b.z - de.z))[0];
        if (!sig) break;
        ya.add(sig.id);
        dano *= 0.75;
        this.herir(sig, dano, como, torre);
        saltos.push([sig.x, sig.z]);
        de = sig;
      }
      if (saltos.length) this.eventos.push({ k: 'rayo', de: [e.x, e.z], a: saltos });
    }
  }

  /** Estrellas al ganar (por los corazones que quedaron). */
  estrellas() {
    if (this.terminado !== 'gano') return 0;
    return this.vidas >= 18 ? 3 : this.vidas >= 10 ? 2 : 1;
  }

  /** Para las pruebas: el nivel por su id. */
  static nivel(id: string) {
    return NIVELES.find((n) => n.id === id)!;
  }
}
