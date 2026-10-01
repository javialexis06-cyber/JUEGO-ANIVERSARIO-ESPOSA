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
  /** Un toque le llega aunque haya otra cosa delante (papelitos del piso: chiquitos y siempre debajo de algo). */
  prioridad?: boolean;
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
  /** Dedo del otro celular (modo pareja): llega por la red con su cámara. */
  remoto: boolean;
  /** Cámara y pantalla con que se mira (la propia, o la del otro celular). */
  vista: Vista | null;
  /** Objeto del inventario que tenía elegido el otro (sus dedos usan su elección). */
  item: string | null;
}

/** Cómo se veía el cuarto en el celular de donde viene un dedo remoto. */
export interface Vista {
  cam: THREE.Camera;
  w: number;
  h: number;
}

/** Un dedo que viaja por la red (modo pareja): posición en la pantalla de quien toca, con su cámara y su reloj. */
export interface DedoRed {
  tipo: 'abajo' | 'mueve' | 'arriba' | 'cancela';
  id: number;
  x: number;
  y: number;
  t: number;
  w: number;
  h: number;
  /** Cámara: posición, cuaternión, fov y aspecto. */
  cam: number[];
  item: string | null;
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
  /** Lo mismo para los dedos del otro celular (en pareja): el otro puede jugar mientras aquí se lee la historia. */
  bloqueoRemoto = false;
  /** Objeto del inventario elegido (el próximo toque intenta usarlo). */
  item: string | null = null;
  alGastar: ((item: string) => void) | null = null;
  /** Modo espejo (el invitado en pareja): los dedos propios solo mueven lo que arrastran (para que se sienta
   *  inmediato) y se mandan al otro celular, que es el que aplica las reglas del acertijo. */
  espejo = false;
  /** Cada vez que se apoya un dedo propio (para la ondita del toque): `algo` si cayó sobre algo que se toca. */
  alTocar: ((x: number, y: number, algo: boolean) => void) | null = null;
  /** Cada dedo propio (para mandarlo por la red en pareja). */
  alDedo: ((tipo: DedoRed['tipo'], id: number, x: number, y: number, t: number) => void) | null = null;
  /** Quién hizo lo último que se aplicó (para mostrarle a esa persona el candado o el acercamiento que salga). */
  actor: 'yo' | 'otro' = 'yo';
  private tActor = 0;
  /** Vista con la que se está procesando un dedo (la del otro celular si el dedo es remoto). */
  private vista: Vista | null = null;
  /** Lo que el invitado arrastra o acaba de soltar (el espejo no se lo quita de la mano). */
  private enMano = new Map<THREE.Object3D, number>();

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

  /** Lo que está registrado (para la revisión de lo que no se puede tapar). */
  registrados() {
    return [...this.reg.entries()];
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
    this.enMano.clear();
  }

  /** ¿Lo último que se aplicó lo hizo el otro (hace poquito)? */
  delOtro(ms = 1600) {
    return this.actor === 'otro' && performance.now() - this.tActor < ms;
  }

  /** Lo que el invitado tiene en la mano o soltó hace un momento (el espejo no lo mueve). */
  enLaMano(o: THREE.Object3D) {
    const t = this.enMano.get(o);
    if (t === undefined) return false;
    if (t > 0 && performance.now() - t > 900) {
      this.enMano.delete(o);
      return false;
    }
    return true;
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
    if (this.vista) return new THREE.Vector2((x / this.vista.w) * 2 - 1, -(y / this.vista.h) * 2 + 1);
    const r = this.lienzo.getBoundingClientRect();
    return new THREE.Vector2((x / r.width) * 2 - 1, -(y / r.height) * 2 + 1);
  }

  private get cam() {
    return this.vista?.cam ?? this.camara;
  }

  /** Objeto registrado bajo (x, y) que tenga lo pedido (el más cercano y visible). */
  buscar(x: number, y: number, quiere?: keyof Registro): { obj: THREE.Object3D; hit: THREE.Intersection } | null {
    if (!this.reg.size) return null;
    this.rc.setFromCamera(this.ndc(x, y), this.cam);
    const hits = this.rc.intersectObjects([...this.reg.keys()], true);
    // Primero lo que tiene prioridad de toque (aunque algo le quede delante)
    if (quiere === 'tocar') {
      for (const hit of hits) {
        if (!visible(hit.object)) continue;
        for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) {
          const r = this.reg.get(o);
          if (r?.prioridad && r.tocar) return { obj: o, hit };
        }
      }
    }
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
    const t = performance.now();
    this.alDedo?.('abajo', e.pointerId, x, y, t);
    this.empezar(e.pointerId, x, y, t, null);
  }

  private mover(e: PointerEvent) {
    const { x, y } = this.pos(e);
    const t = performance.now();
    if (this.punteros.has(e.pointerId)) this.alDedo?.('mueve', e.pointerId, x, y, t);
    this.seguir(e.pointerId, x, y, t);
  }

  private arriba(e: PointerEvent, cancelado = false) {
    if (!this.punteros.has(e.pointerId)) return;
    const { x, y } = this.pos(e);
    const t = performance.now();
    this.alDedo?.(cancelado ? 'cancela' : 'arriba', e.pointerId, x, y, t);
    this.terminar(e.pointerId, t, cancelado);
  }

  /** Un dedo del otro celular (modo pareja, en quien aplica las reglas): se procesa como si fuera propio, con su
   *  cámara, su pantalla, su reloj y su objeto elegido. */
  remoto(d: DedoRed) {
    const id = 100000 + d.id;
    const cam = new THREE.PerspectiveCamera(d.cam[7], d.cam[8], 0.05, 80);
    cam.position.set(d.cam[0], d.cam[1], d.cam[2]);
    cam.quaternion.set(d.cam[3], d.cam[4], d.cam[5], d.cam[6]);
    cam.updateMatrixWorld(true);
    const vista: Vista = { cam, w: d.w, h: d.h };
    this.actor = 'otro';
    this.tActor = performance.now();
    const antes = this.vista, bloqueoAntes = this.bloqueada;
    this.vista = vista;
    this.bloqueada = this.bloqueoRemoto;
    try {
      if (d.tipo === 'abajo') {
        if (!this.bloqueada) this.empezar(id, d.x, d.y, d.t, vista, d.item);
      } else if (d.tipo === 'mueve') {
        const p = this.punteros.get(id);
        if (p) p.vista = vista;
        this.seguir(id, d.x, d.y, d.t);
      } else {
        const p = this.punteros.get(id);
        if (p) p.vista = vista;
        this.terminar(id, d.t, d.tipo === 'cancela', d.item);
      }
    } finally {
      this.vista = antes;
      this.bloqueada = bloqueoAntes;
    }
  }

  private empezar(id: number, x: number, y: number, t: number, vista: Vista | null, item: string | null = this.item) {
    if (!vista) {
      this.actor = 'yo';
      this.tActor = performance.now();
    }
    const b = this.buscar(x, y);
    if (!vista) this.alTocar?.(x, y, !!b);
    const p: Puntero = { x, y, x0: x, y0: y, t0: t, obj: b?.obj ?? null, hit: b?.hit ?? null, trazo: [{ x, y, t }], frotando: null, remoto: !!vista, vista, item };
    this.punteros.set(id, p);
    if (b) {
      const r = this.reg.get(b.obj)!;
      if (!this.espejo) r.bajar?.(b.hit);
      if (r.arrastre && !item) {
        const punto = this.enPlano(x, y, r.arrastre.plano);
        if (punto) {
          const mundo = b.obj.getWorldPosition(new THREE.Vector3());
          p.arrastre = { obj: b.obj, op: r.arrastre, desfase: mundo.sub(punto) };
          if (this.espejo) this.enMano.set(b.obj, 0);
          else r.arrastre.alTomar?.();
        }
      }
    }
    this.cambioDedos();
  }

  private seguir(id: number, x: number, y: number, t: number) {
    const p = this.punteros.get(id);
    if (!p) {
      if (!this.bloqueada && !this.espejo && !this.vista) this.emitir('mover', x, y, false);
      return;
    }
    const antes = this.vista;
    this.vista = p.vista;
    try {
      const dx = x - p.x, dy = y - p.y;
      p.x = x;
      p.y = y;
      p.trazo.push({ x, y, t });
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
          if (!this.espejo) op.alMover?.(obj.getWorldPosition(new THREE.Vector3()));
        }
      }
      // En el espejo lo demás lo decide el otro celular
      if (this.espejo) return;
      // Frotar: lo que esté bajo el dedo mientras se mueve
      const f = this.buscar(x, y, 'frotar');
      if (f) this.reg.get(f.obj)!.frotar!(f.hit, Math.hypot(dx, dy));
      if (this.punteros.size === 1) this.emitir('mover', x, y, true);
      if (this.punteros.size === 2) this.dosDedos();
    } finally {
      this.vista = antes;
    }
  }

  private terminar(id: number, t: number, cancelado: boolean, item: string | null = null) {
    const p = this.punteros.get(id);
    if (!p) return;
    this.punteros.delete(id);
    this.dos = null;
    const ms = t - p.t0;
    if (p.arrastre && this.espejo) this.enMano.set(p.arrastre.obj, performance.now());
    const antes = this.vista, itemAntes = this.item;
    this.vista = p.vista;
    if (p.remoto) this.item = item ?? p.item;
    try {
      if (!this.bloqueada && !cancelado && !this.espejo) {
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
    } finally {
      this.vista = antes;
      // El objeto que el otro tenía elegido no cambia la elección propia (salvo que se haya gastado)
      if (p.remoto) this.item = itemAntes && this.item === null && itemAntes === (item ?? p.item) ? null : itemAntes;
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
    if (this.bloqueada || this.espejo) return;
    const objs = [...this.punteros.values()].map((p) => p.obj);
    this.emitir('dedos', this.punteros.size, objs);
    if (this.punteros.size === 2) {
      const [a, b] = [...this.punteros.values()];
      // Pellizcar y girar son de un mismo celular (un dedo de cada uno no es un pellizco)
      if (a.remoto !== b.remoto) return;
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
    this.rc.setFromCamera(this.ndc(x, y), this.cam);
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
