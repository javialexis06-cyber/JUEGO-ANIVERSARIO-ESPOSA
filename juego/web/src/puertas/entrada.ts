// Toques sobre el cuarto: tocar objetos, mantener, arrastrar sobre un plano, frotar, deslizar, dibujar trazos,
// varios dedos, pellizcar y girar con dos dedos. Cada acertijo registra lo suyo y se limpia al salir.
import * as THREE from 'three';

export type Dir = 'izq' | 'der' | 'arriba' | 'abajo';

export interface OpArrastre {
  /** Plano del mundo por donde se desliza el objeto. */
  plano: THREE.Plane;
  /** Caja del mundo donde puede quedar su centro. */
  limites?: THREE.Box3;
  alTomar?: () => void;
  alMover?: (p: THREE.Vector3) => void;
  alSoltar?: (p: THREE.Vector3) => void;
}

export interface Registro {
  tocar?: (hit: THREE.Intersection) => void;
  bajar?: (hit: THREE.Intersection) => void;
  soltar?: (ms: number) => void;
  arrastre?: OpArrastre;
  frotar?: (hit: THREE.Intersection, px: number) => void;
  /** Usar un objeto del inventario aquí: true si sirvió (se gasta). */
  usar?: (item: string) => boolean;
  /** No tapa lo que está detrás (por defecto un objeto registrado tapa a los de atrás). */
  atraviesa?: boolean;
}

export interface PuntoTrazo {
  x: number;
  y: number;
  t: number;
}

interface Puntero {
  x: number;
  y: number;
  x0: number;
  y0: number;
  t0: number;
  obj: THREE.Object3D | null;
  hit: THREE.Intersection | null;
  arrastre?: { obj: THREE.Object3D; op: OpArrastre; desfase: THREE.Vector3 };
  trazo: PuntoTrazo[];
  frotando: THREE.Object3D | null;
}

type Gestos = {
  toque: (x: number, y: number, obj: THREE.Object3D | null) => void;
  deslizar: (dir: Dir, vel: number, obj: THREE.Object3D | null, dx: number, dy: number) => void;
  trazo: (puntos: PuntoTrazo[]) => void;
  mover: (x: number, y: number, abajo: boolean) => void;
  dedos: (n: number, objs: (THREE.Object3D | null)[]) => void;
  pellizco: (escala: number) => void;
  giro: (delta: number) => void;
  usoFallido: (item: string) => void;
};

export class Entrada {
  private reg = new Map<THREE.Object3D, Registro>();
  private punteros = new Map<number, Puntero>();
  private rc = new THREE.Raycaster();
  private oyentes: { [K in keyof Gestos]: Set<Gestos[K]> } = {
    toque: new Set(), deslizar: new Set(), trazo: new Set(), mover: new Set(), dedos: new Set(), pellizco: new Set(), giro: new Set(),
    usoFallido: new Set(),
  };
  private dos: { d0: number; a0: number; ultimoA: number } | null = null;
  /** Mientras se cuenta la historia o se abre la puerta no se juega. */
  bloqueada = false;
  /** Objeto del inventario elegido (el próximo toque intenta usarlo). */
  item: string | null = null;
  alGastar: ((item: string) => void) | null = null;

  constructor(private lienzo: HTMLCanvasElement, private camara: THREE.Camera) {
    lienzo.addEventListener('pointerdown', (e) => this.abajo(e));
    lienzo.addEventListener('pointermove', (e) => this.mover(e));
    lienzo.addEventListener('pointerup', (e) => this.arriba(e));
    lienzo.addEventListener('pointercancel', (e) => this.arriba(e, true));
    lienzo.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  registrar(obj: THREE.Object3D, r: Registro) {
    const antes = this.reg.get(obj);
    this.reg.set(obj, { ...antes, ...r });
  }

  quitar(obj: THREE.Object3D) {
    this.reg.delete(obj);
  }

  on<K extends keyof Gestos>(tipo: K, fn: Gestos[K]) {
    this.oyentes[tipo].add(fn);
    return () => this.oyentes[tipo].delete(fn);
  }

  /** Olvida todo lo del acertijo anterior. */
  limpiar() {
    this.reg.clear();
    for (const s of Object.values(this.oyentes)) s.clear();
    this.punteros.clear();
    this.dos = null;
    this.item = null;
  }

  get dedosAbajo() {
    return this.punteros.size;
  }

  private emitir<K extends keyof Gestos>(tipo: K, ...args: Parameters<Gestos[K]>) {
    for (const fn of [...this.oyentes[tipo]]) (fn as (...a: Parameters<Gestos[K]>) => void)(...args);
  }

  private pos(e: PointerEvent) {
    const r = this.lienzo.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private ndc(x: number, y: number) {
    const r = this.lienzo.getBoundingClientRect();
    return new THREE.Vector2((x / r.width) * 2 - 1, -(y / r.height) * 2 + 1);
  }

  /** Objeto registrado bajo (x, y) que tenga lo pedido (el más cercano y visible). */
  buscar(x: number, y: number, quiere?: keyof Registro): { obj: THREE.Object3D; hit: THREE.Intersection } | null {
    if (!this.reg.size) return null;
    this.rc.setFromCamera(this.ndc(x, y), this.camara);
    const hits = this.rc.intersectObjects([...this.reg.keys()], true);
    for (const hit of hits) {
      if (!visible(hit.object)) continue;
      let o: THREE.Object3D | null = hit.object;
      while (o) {
        const r = this.reg.get(o);
        if (r) {
          if (!quiere || r[quiere]) return { obj: o, hit };
          // Lo que está delante tapa: no se toca «a través» de un tapete o de un cojín
          if (!r.atraviesa) return null;
          break;
        }
        o = o.parent;
      }
    }
    return null;
  }

  private abajo(e: PointerEvent) {
    if (this.bloqueada) return;
    try {
      this.lienzo.setPointerCapture(e.pointerId);
    } catch {
      /* puntero sintético */
    }
    const { x, y } = this.pos(e);
    const b = this.buscar(x, y);
    const p: Puntero = { x, y, x0: x, y0: y, t0: performance.now(), obj: b?.obj ?? null, hit: b?.hit ?? null, trazo: [{ x, y, t: performance.now() }], frotando: null };
    this.punteros.set(e.pointerId, p);
    if (b) {
      const r = this.reg.get(b.obj)!;
      r.bajar?.(b.hit);
      if (r.arrastre && !this.item) {
        const punto = this.enPlano(x, y, r.arrastre.plano);
        if (punto) {
          const mundo = b.obj.getWorldPosition(new THREE.Vector3());
          p.arrastre = { obj: b.obj, op: r.arrastre, desfase: mundo.sub(punto) };
          r.arrastre.alTomar?.();
        }
      }
    }
    this.cambioDedos();
  }

  private mover(e: PointerEvent) {
    const p = this.punteros.get(e.pointerId);
    const { x, y } = this.pos(e);
    if (!p) {
      if (!this.bloqueada) this.emitir('mover', x, y, false);
      return;
    }
    const dx = x - p.x, dy = y - p.y;
    p.x = x;
    p.y = y;
    p.trazo.push({ x, y, t: performance.now() });
    if (p.trazo.length > 400) p.trazo.splice(0, p.trazo.length - 400);
    if (this.bloqueada) return;
    if (p.arrastre) {
      const { obj, op, desfase } = p.arrastre;
      const punto = this.enPlano(x, y, op.plano);
      if (punto) {
        punto.add(desfase);
        if (op.limites) op.limites.clampPoint(punto, punto);
        obj.parent?.worldToLocal(punto);
        obj.position.copy(punto);
        op.alMover?.(obj.getWorldPosition(new THREE.Vector3()));
      }
    }
    // Frotar: lo que esté bajo el dedo mientras se mueve
    const f = this.buscar(x, y, 'frotar');
    if (f) this.reg.get(f.obj)!.frotar!(f.hit, Math.hypot(dx, dy));
    if (this.punteros.size === 1) this.emitir('mover', x, y, true);
    if (this.punteros.size === 2) this.dosDedos();
  }

  private arriba(e: PointerEvent, cancelado = false) {
    const p = this.punteros.get(e.pointerId);
    if (!p) return;
    this.punteros.delete(e.pointerId);
    this.dos = null;
    const ms = performance.now() - p.t0;
    if (!this.bloqueada && !cancelado) {
      if (p.obj) this.reg.get(p.obj)?.soltar?.(ms);
      if (p.arrastre) p.arrastre.op.alSoltar?.(p.arrastre.obj.getWorldPosition(new THREE.Vector3()));
      const dx = p.x - p.x0, dy = p.y - p.y0;
      const dist = Math.hypot(dx, dy);
      if (dist < 14 && ms < 600) this.tocar(p.x, p.y);
      else if (!p.arrastre && dist > 45 && ms < 700 && this.punteros.size === 0) {
        const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'der' : 'izq') : dy > 0 ? 'abajo' : 'arriba';
        this.emitir('deslizar', dir, dist / Math.max(ms, 1), p.obj, dx, dy);
      }
      if (this.punteros.size === 0) this.emitir('trazo', p.trazo);
    }
    this.cambioDedos();
  }

  private tocar(x: number, y: number) {
    if (this.item) {
      const u = this.buscar(x, y, 'usar');
      const item = this.item;
      if (u && this.reg.get(u.obj)!.usar!(item)) {
        this.item = null;
        this.alGastar?.(item);
        return;
      }
      this.emitir('usoFallido', item);
      return;
    }
    const b = this.buscar(x, y, 'tocar');
    this.emitir('toque', x, y, b?.obj ?? null);
    if (b) this.reg.get(b.obj)!.tocar!(b.hit);
  }

  private cambioDedos() {
    if (this.bloqueada) return;
    const objs = [...this.punteros.values()].map((p) => p.obj);
    this.emitir('dedos', this.punteros.size, objs);
    if (this.punteros.size === 2) {
      const [a, b] = [...this.punteros.values()];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      this.dos = { d0: Math.hypot(b.x - a.x, b.y - a.y), a0: ang, ultimoA: ang };
    }
  }

  private dosDedos() {
    if (!this.dos) return;
    const [a, b] = [...this.punteros.values()];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    let delta = ang - this.dos.ultimoA;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    this.dos.ultimoA = ang;
    this.emitir('pellizco', d / Math.max(this.dos.d0, 1));
    if (Math.abs(delta) > 0.0001) this.emitir('giro', delta);
  }

  /** Punto del plano bajo (x, y). */
  enPlano(x: number, y: number, plano: THREE.Plane) {
    this.rc.setFromCamera(this.ndc(x, y), this.camara);
    return this.rc.ray.intersectPlane(plano, new THREE.Vector3());
  }
}

function visible(o: THREE.Object3D | null): boolean {
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}
