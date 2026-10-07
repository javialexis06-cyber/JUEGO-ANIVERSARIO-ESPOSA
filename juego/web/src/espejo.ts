// La tienda en el celular del invitado (jugando en línea): el anfitrión simula todo y cada décima de segundo manda
// una «foto» (dónde está cada quien, qué pose tiene, cuánto hay en cada estante, la mugre, las canastas, el reloj y
// lo que pasó). Aquí se aplica esa foto sobre una tienda igualita, y los personajes caminan suavecito de una foto a
// la siguiente. El personaje propio se mueve apenas se toca el joystick (sin esperar la foto) y se corrige si se aleja.
import * as THREE from 'three';
import { VELOCIDAD_EL } from './balance';
import { Cliente } from './cliente';
import type { Evento, Juego, Stats } from './juego';
import type { Jugador, NuevaTarea, Tarea } from './jugador';
import { aTres, dePantalla } from './mundo';
import type { P } from './navegacion';
import { Personaje } from './personaje';
import { CanastaSuelta, Ladron, Mugre, Nina } from './problemas';
import { cargar, copia, liberarEsqueletos } from './recursos';
import * as sonido from './sonido';
import type { TipoCliente } from './balance';

/** Un personaje en la foto: x, y, giro, pose, ¿caminando? */
type Pj = [number, number, number, string, 0 | 1];
type TareaFoto = [number, Tarea['tipo'], number];
export interface Foto {
  n: number;
  t: number;
  /** Las cuentas del día (sin las esperas de la caja, que viajan resumidas en `es`: suma y cuántas). */
  st: Stats;
  es: [number, number];
  cn: number;
  cafe: number;
  mus: number;
  co: [number, number, number, number, 0 | 1] | null;
  /** Él y Ella: personaje, carrito, trapero, bolsa, canastas, progreso de la acción (-1 si nada), banderas
   *  (1 cobrando, 2 cargando en la bodega, 4 lavando el trapero, 8 mareado) y su fila de toques. */
  j: [...Pj, number, number, number, number, number, number, TareaFoto[]][];
  /** Clientes: id, tipo, personaje, estado, paciencia, lo que busca, cuántos, bravo, con canasta. */
  c: [number, TipoCliente, ...Pj, string, number, string | null, number, 0 | 1, 0 | 1][];
  a: Pj[];
  l: [number, ...Pj, string, 0 | 1][];
  ni: [number, ...Pj, string][];
  v: [number, number, 0 | 1][];
  mg: [number, Mugre['tipo'], number, number, string, number, number][];
  cs: [number, number, number][];
  ev: Evento[];
}

/** Lo que pide el invitado con un toque (se resuelve en el celular del anfitrión). */
export type Orden =
  | { tipo: 'reponer'; vitrina: number }
  | { tipo: 'caja' }
  | { tipo: 'lavar' }
  | { tipo: 'mugre'; id: number }
  | { tipo: 'canasta'; id: number }
  | { tipo: 'atrapar'; id: number };

const r2 = (v: number) => Math.round(v * 100) / 100;
const pj = (p: Personaje): Pj => [r2(p.pos.x), r2(p.pos.y), r2(p.rot), p.poseVisible, p.moviendo ? 1 : 0];
const refDe = (t: Tarea) =>
  t.tipo === 'reponer' ? t.vitrina.dato.id : t.tipo === 'mugre' ? t.mugre.id : t.tipo === 'canasta' ? t.canasta.id : t.tipo === 'atrapar' ? t.objetivo.id : 0;

// ---------------------------------------------------------------------------------------------- Anfitrión
/** La foto de la tienda para el invitado (con los eventos desde `desde`). */
export function tomarFoto(j: Juego, n: number, desde: number): Foto {
  const c = j.corazon;
  return {
    n,
    t: r2(j.tiempo),
    st: { ...j.stats, esperas: [] },
    es: [r2(j.stats.esperas.reduce((a, b) => a + b, 0)), j.stats.esperas.length],
    cn: j.canastas,
    cafe: r2(Math.max(0, j.cafeHasta - j.tiempo)),
    mus: r2(Math.max(0, j.musicaHasta - j.tiempo)),
    co: c ? [r2(c.pos.x), r2(c.pos.y), r2(c.desde), r2(c.hasta), c.tomado ? 1 : 0] : null,
    j: j.jugadores.map((p) => [
      ...pj(p), p.carga, p.trapero, p.bolsa, p.canastasEnMano, p.haciendo ? r2(p.progresoAccion) : -1,
      (p.estaCobrando ? 1 : 0) | (p.cargandoBodega ? 2 : 0) | (p.lavando ? 4 : 0) | (p.atontado ? 8 : 0),
      p.fila.map((t): TareaFoto => [t.id, t.tipo, refDe(t)]),
    ]),
    c: j.clientes.map((x) => [x.id, x.tipo, ...pj(x), x.estado, r2(x.paciencia), x.deseo, x.cantidadDeseada, x.enojado ? 1 : 0, (x as any).tieneCanasta ? 1 : 0]),
    a: j.ayudantes.map(pj),
    l: j.ladrones.map((x) => [x.id, ...pj(x), x.estado, x.visible ? 1 : 0]),
    ni: j.ninas.map((x) => [x.id, ...pj(x), x.estado]),
    v: j.tienda.vitrinas.filter((v) => v.nivel > 0).map((v) => [v.dato.id, v.stock, v.tumbada ? 1 : 0]),
    mg: j.mugres.map((m) => [m.id, m.tipo, r2(m.pos.x), r2(m.pos.y), m.reservado ?? '', m.unidades ?? 0, m.vitrina?.dato.id ?? -1]),
    cs: j.canastasSueltas.map((x) => [x.id, r2(x.pos.x), r2(x.pos.y)]),
    ev: j.eventos.slice(desde),
  };
}

/** El anfitrión le pone a la fila del invitado lo que tocó (o se la quita si ya estaba; si la tiene el anfitrión, «otro»). */
export function aplicarOrden(j: Juego, jug: Jugador, o: Orden): string {
  let t: NuevaTarea | null = null;
  if (o.tipo === 'reponer') {
    const v = j.tienda.vitrinas.find((x) => x.dato.id === o.vitrina);
    if (v && v.nivel) t = { tipo: 'reponer', vitrina: v };
  } else if (o.tipo === 'caja' || o.tipo === 'lavar') t = { tipo: o.tipo };
  else if (o.tipo === 'mugre') {
    const m = j.mugres.find((x) => x.id === o.id);
    if (m?.reservado === 'aseo') return 'aseo';
    if (m) t = { tipo: 'mugre', mugre: m };
  } else if (o.tipo === 'canasta') {
    const c = j.canastasSueltas.find((x) => x.id === o.id);
    if (c) t = { tipo: 'canasta', canasta: c };
  } else if (o.tipo === 'atrapar') {
    const x = j.perseguibles().find((p) => p.id === o.id);
    if (x) t = { tipo: 'atrapar', objetivo: x };
  }
  return t ? j.asignar(t, jug) : 'ya';
}

// ---------------------------------------------------------------------------------------------- Invitado
interface Meta {
  x: number;
  y: number;
  r: number;
  p: string;
  m: boolean;
}
const angulo = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
/** Cada cuánto llega una foto (s): los personajes tardan eso en ir de una a la otra. */
const INTERVALO = 0.1;

export class Espejo {
  private clientes = new Map<number, Cliente>();
  private ladrones = new Map<number, Ladron>();
  private ninas = new Map<number, Nina>();
  private mugres = new Map<number, Mugre>();
  private canastas = new Map<number, CanastaSuelta>();
  private metas = new Map<Personaje, Meta>();
  private creando = new Set<string>();
  private yo: Jugador;
  private manejando = false;
  private soltado = 0;
  /** Última foto aplicada (las que llegan tarde se ignoran). */
  ultima = -1;
  /** Segundos desde la última foto (si pasa mucho, se perdió la conexión). */
  sinFoto = 0;
  private cerrado = false;

  /** `yoId`: el id del personaje de este celular («el»/«ella» entre la pareja, «j1»… en una sala). */
  constructor(private j: Juego, yoId: string) {
    this.yo = j.jugadores.find((p) => p.id === yoId) ?? j.jugadores[1] ?? j.jugadores[0];
  }

  aplicar(f: Foto) {
    if (this.cerrado || f.n <= this.ultima) return;
    this.ultima = f.n;
    this.sinFoto = 0;
    const j = this.j;
    j.tiempo = f.t;
    const [suma, cuantas] = f.es;
    j.stats = { ...f.st, esperas: cuantas ? Array<number>(cuantas).fill(suma / cuantas) : [] };
    j.canastas = f.cn;
    j.cafeHasta = f.t + f.cafe;
    j.musicaHasta = f.t + f.mus;
    j.corazon = f.co ? { pos: { x: f.co[0], y: f.co[1] }, desde: f.co[2], hasta: f.co[3], tomado: !!f.co[4] } : null;
    // Estantes
    for (const [id, stock, tumbada] of f.v) {
      const v = j.tienda.vitrinas.find((x) => x.dato.id === id);
      if (!v) continue;
      if (v.stock !== stock) v.ponerStock(stock);
      if (tumbada && !v.tumbada) v.tumbar();
    }
    this.aplicarMugres(f);
    this.aplicarCanastas(f);
    this.aplicarClientes(f);
    this.aplicarProblemas(f);
    f.a.forEach((a, i) => {
      const x = j.ayudantes[i];
      if (x) this.meta(x, a);
    });
    // Él y Ella: lo que llevan, su fila de toques y la barrita de lo que hacen
    f.j.forEach((d, i) => {
      const p = j.jugadores[i];
      if (!p) return;
      const [x, y, r, pose, mov, carga, trapero, bolsa, canastas, progreso, banderas, fila] = d;
      if (p.carga !== carga) {
        p.carga = carga;
        (p as any).actualizarCarrito();
      }
      p.trapero = trapero;
      p.bolsa = bolsa;
      p.canastasEnMano = canastas;
      p.mareo = banderas & 8 ? 0.5 : 0;
      (p as any).cobrando = !!(banderas & 1);
      p.cargandoBodega = !!(banderas & 2);
      p.lavando = !!(banderas & 4);
      (p as any).accion = progreso >= 0 ? Math.max(0.001, 1 - progreso) : 0;
      p.accionTotal = progreso >= 0 ? 1 : 0;
      const tareas = fila.map(([id, tipo, ref]) => this.tarea(id, tipo, ref)).filter((t): t is Tarea => !!t);
      p.actual = tareas[0] ?? null;
      p.tareas = tareas.slice(1);
      if (p === this.yo) {
        // El propio: si el joystick lo está moviendo, manda lo de acá (salvo que se haya ido muy lejos)
        const lejos = Math.hypot(p.pos.x - x, p.pos.y - y);
        if (this.manejando || performance.now() - this.soltado < 350) {
          if (lejos > 1.4) {
            p.pos = { x, y };
            p.sincronizar();
          }
          this.metas.delete(p);
          return;
        }
      }
      this.meta(p, [x, y, r, pose, mov]);
    });
    // Lo que pasó: globos, avisos y sonidos
    for (const e of f.ev) {
      j.eventos.push(e);
      if (e.tipo === 'cobro') sonido.caja();
      else if (e.tipo === 'repuesto') sonido.repuesto();
      else if (e.tipo === 'vacia') sonido.vacia();
      else if (e.tipo === 'perdido') sonido.enojo();
      else if (e.tipo === 'pop' && e.data?.clase === 'combo') sonido.combo(2);
      else if (e.tipo === 'pop' && e.data?.clase === 'corazon') sonido.corazon();
      else if (e.tipo === 'pop' && e.data?.clase === 'choque') sonido.nota(190, 0.16, 0, 'square', 0.07, 80);
    }
  }

  private meta(p: Personaje, d: Pj) {
    this.metas.set(p, { x: d[0], y: d[1], r: d[2], p: d[3], m: !!d[4] });
  }

  private tarea(id: number, tipo: Tarea['tipo'], ref: number): Tarea | null {
    const j = this.j;
    if (tipo === 'reponer') {
      const v = j.tienda.vitrinas.find((x) => x.dato.id === ref);
      return v ? { id, tipo, vitrina: v } : null;
    }
    if (tipo === 'caja' || tipo === 'lavar') return { id, tipo };
    if (tipo === 'mugre') {
      const m = this.mugres.get(ref);
      return m ? { id, tipo, mugre: m } : null;
    }
    if (tipo === 'canasta') {
      const c = this.canastas.get(ref);
      return c ? { id, tipo, canasta: c } : null;
    }
    const o = this.ladrones.get(ref) ?? this.ninas.get(ref);
    return o ? { id, tipo: 'atrapar', objetivo: o } : null;
  }

  private aplicarMugres(f: Foto) {
    const j = this.j;
    const vivos = new Set<number>();
    for (const [id, tipo, x, y, reservado, unidades, vid] of f.mg) {
      vivos.add(id);
      const m = this.mugres.get(id);
      if (m) {
        m.reservado = reservado || undefined;
        m.unidades = unidades || undefined;
        continue;
      }
      const clave = `m${id}`;
      if (this.creando.has(clave)) continue;
      this.creando.add(clave);
      const v = vid >= 0 ? j.tienda.vitrinas.find((x) => x.dato.id === vid) : undefined;
      void j.nuevaMugre(tipo, { x, y }, v, unidades || undefined).then((nueva) => {
        this.creando.delete(clave);
        nueva.id = id;
        // Si ya se limpió mientras cargaba, se quita de una
        if (this.cerrado || !this.vivas.has(id)) j.quitarMugre(nueva);
        else this.mugres.set(id, nueva);
      });
    }
    this.vivas = vivos;
    for (const [id, m] of this.mugres) {
      if (vivos.has(id)) continue;
      j.quitarMugre(m);
      this.mugres.delete(id);
    }
  }
  private vivas = new Set<number>();

  private aplicarCanastas(f: Foto) {
    const j = this.j;
    const vivas = new Set(f.cs.map((c) => c[0]));
    for (const [id, x, y] of f.cs) {
      if (this.canastas.has(id) || this.creando.has(`c${id}`)) continue;
      this.creando.add(`c${id}`);
      void cargar('canasta.glb').then((base) => {
        this.creando.delete(`c${id}`);
        if (this.cerrado || !this.vivasCanastas.has(id)) return;
        const obj = copia(base);
        obj.position.copy(aTres(x, y));
        obj.rotation.set(0, (id * 2.39) % (Math.PI * 2), 0.35);
        obj.scale.setScalar(0.85 * j.escalaDe() / 0.68);
        const c: CanastaSuelta = { id, pos: { x, y }, obj };
        j.canastasSueltas.push(c);
        j.mundo.escena.add(obj);
        this.canastas.set(id, c);
      });
    }
    this.vivasCanastas = vivas;
    for (const [id, c] of this.canastas) {
      if (vivas.has(id)) continue;
      j.quitarCanasta(c);
      this.canastas.delete(id);
    }
  }
  private vivasCanastas = new Set<number>();

  private aplicarClientes(f: Foto) {
    const j = this.j;
    const vivos = new Set<number>();
    for (const d of f.c) {
      const [id, tipo, x, y, r, pose, mov, estado, paciencia, deseo, cantidad, enojado, canasta] = d;
      vivos.add(id);
      let c = this.clientes.get(id);
      if (!c) {
        if (this.creando.has(`k${id}`)) continue;
        this.creando.add(`k${id}`);
        const nuevo = new Cliente(tipo, { x, y }, j.escalaDe(tipo), 1, j);
        nuevo.rot = r;
        void nuevo.preparar().then(() => {
          this.creando.delete(`k${id}`);
          if (this.cerrado || !this.vivosClientes.has(id)) return liberarEsqueletos(nuevo.grupo);
          nuevo.sincronizar();
          j.clientes.push(nuevo);
          j.mundo.escena.add(nuevo.grupo);
          this.clientes.set(id, nuevo);
        });
        continue;
      }
      (c as any).estado = estado;
      c.paciencia = paciencia;
      c.enojado = !!enojado;
      // Lo que busca (para el globo): una lista de un solo producto
      c.lista = deseo ? [{ vitrina: j.tienda.vitrinas[0], producto: deseo, cantidad, tomadas: 0 }] : [];
      c.paso = 0;
      const cn = (c as any).canasta as THREE.Object3D | null;
      if (cn) cn.visible = !!canasta;
      this.meta(c, [x, y, r, pose, mov]);
    }
    this.vivosClientes = vivos;
    for (const [id, c] of this.clientes) {
      if (vivos.has(id)) continue;
      this.quitar(c);
      j.clientes = j.clientes.filter((x) => x !== c);
      this.clientes.delete(id);
    }
  }
  private vivosClientes = new Set<number>();

  private aplicarProblemas(f: Foto) {
    const j = this.j;
    const vivos = new Set<number>([...f.l.map((l) => l[0]), ...f.ni.map((n) => n[0])]);
    for (const d of f.l) {
      const [id, x, y, r, pose, mov, estado, visible] = d;
      let l = this.ladrones.get(id);
      if (!l) {
        if (this.creando.has(`l${id}`)) continue;
        this.creando.add(`l${id}`);
        const nuevo = new Ladron({ x, y }, j.escalaDe('ladron'), j, !!j.mejoras.camara);
        void nuevo.preparar().then(() => {
          this.creando.delete(`l${id}`);
          if (this.cerrado || !this.vivosProblemas.has(id)) return liberarEsqueletos(nuevo.grupo);
          nuevo.id = id;
          j.ladrones.push(nuevo);
          j.mundo.escena.add(nuevo.grupo);
          this.ladrones.set(id, nuevo);
        });
        continue;
      }
      l.estado = estado as Ladron['estado'];
      l.visible = !!visible;
      this.meta(l, [x, y, r, pose, mov]);
    }
    for (const d of f.ni) {
      const [id, x, y, r, pose, mov, estado] = d;
      let n = this.ninas.get(id);
      if (!n) {
        if (this.creando.has(`n${id}`)) continue;
        this.creando.add(`n${id}`);
        const nueva = new Nina({ x, y }, j.escalaDe('nina'), j);
        void nueva.preparar().then(() => {
          this.creando.delete(`n${id}`);
          if (this.cerrado || !this.vivosProblemas.has(id)) return liberarEsqueletos(nueva.grupo);
          nueva.id = id;
          j.ninas.push(nueva);
          j.mundo.escena.add(nueva.grupo);
          this.ninas.set(id, nueva);
        });
        continue;
      }
      n.estado = estado as Nina['estado'];
      this.meta(n, [x, y, r, pose, mov]);
    }
    this.vivosProblemas = vivos;
    for (const [id, l] of this.ladrones) if (!vivos.has(id)) {
      this.quitar(l);
      j.ladrones = j.ladrones.filter((x) => x !== l);
      this.ladrones.delete(id);
    }
    for (const [id, n] of this.ninas) if (!vivos.has(id)) {
      this.quitar(n);
      j.ninas = j.ninas.filter((x) => x !== n);
      this.ninas.delete(id);
    }
  }
  private vivosProblemas = new Set<number>();

  private quitar(p: Personaje) {
    this.j.mundo.escena.remove(p.grupo);
    liberarEsqueletos(p.grupo);
    this.metas.delete(p);
  }

  /** Se acabó el día (o se salieron): lo que estaba cargando ya no se pone en la tienda. */
  cerrar() {
    this.cerrado = true;
  }

  /** Cada cuadro: los personajes caminan hacia su última foto y el propio se mueve con el joystick. */
  update(dt: number, mando: { x: number; y: number }) {
    const j = this.j;
    this.sinFoto += dt;
    j.tienda.animar(dt);
    // El propio, al instante con el joystick
    const f = Math.hypot(mando.x, mando.y);
    const yo = this.yo;
    if (f > 0.25 && !yo.atontado) {
      this.manejando = true;
      const d = dePantalla(mando.x / f, mando.y / f);
      const antes = { ...yo.pos };
      const v0 = VELOCIDAD_EL[j.mejoras.zapatos ?? 0] * (j.cafeActivo ? 1.4 : 1);
      yo.velocidad = v0 * Math.max(0.3, Math.min(1, (Math.min(1, f) - 0.25) / 0.55));
      yo.ruta = [{ x: yo.pos.x + d.x * 3, y: yo.pos.y + d.y * 3 }];
      Personaje.prototype.update.call(yo, dt);
      const libre = (p: P) => {
        const [i, k] = j.tienda.nav.aCelda(p);
        return j.tienda.nav.esLibre(i, k);
      };
      if (!libre(yo.pos) && libre(antes)) {
        const soloX = { x: yo.pos.x, y: antes.y }, soloY = { x: antes.x, y: yo.pos.y };
        yo.pos = libre(soloX) ? soloX : libre(soloY) ? soloY : antes;
        yo.sincronizar();
      }
    } else if (this.manejando) {
      this.manejando = false;
      this.soltado = performance.now();
      yo.ruta = [];
      yo.quieto();
    }
    for (const p of [...j.jugadores, ...j.clientes, ...j.ayudantes, ...j.ladrones, ...j.ninas]) {
      if (p === yo && this.manejando) continue;
      const m = this.metas.get(p);
      if (m) {
        const dx = m.x - p.pos.x, dy = m.y - p.pos.y;
        const d = Math.hypot(dx, dy);
        if (d > 3) {
          p.pos = { x: m.x, y: m.y };
          p.ruta = [];
        } else if (d > 0.03) {
          p.ruta = [{ x: m.x, y: m.y }];
          p.velocidad = Math.max(0.5, d / INTERVALO);
        } else if (!p.ruta.length) {
          p.rot = angulo(p.rot, m.r, Math.min(1, dt * 10));
          if (m.p && p.poseVisible !== m.p) p.pose(m.p);
        }
      }
      Personaje.prototype.update.call(p, dt);
    }
  }

  /** Qué se tocó (para mandárselo al anfitrión) o un aviso («llena», «cajera»…). */
  orden(x: number, y: number): Orden | string | null {
    const o = this.j.objetivoDeToque(x, y);
    if (!o || typeof o === 'string') return o;
    const t = o.t;
    if (t.tipo === 'reponer') return { tipo: 'reponer', vitrina: t.vitrina.dato.id };
    if (t.tipo === 'caja' || t.tipo === 'lavar') return { tipo: t.tipo };
    if (t.tipo === 'mugre') return { tipo: 'mugre', id: t.mugre.id };
    if (t.tipo === 'canasta') return { tipo: 'canasta', id: t.canasta.id };
    return { tipo: 'atrapar', id: t.objetivo.id };
  }
}
