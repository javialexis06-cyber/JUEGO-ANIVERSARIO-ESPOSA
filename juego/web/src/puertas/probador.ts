// Resuelve las puertas en las pruebas automáticas con toques de verdad (eventos de puntero sobre el lienzo) y
// sensores simulados: así se comprueba que cada acertijo se puede pasar tal como lo jugaría alguien.
import * as THREE from 'three';
import type { Dir, Entrada } from './entrada';
import type { Escena } from './escena';
import type { Probador } from './nivel';
import type { Sensores } from './sensores';
import { $, pausa, type Inventario, type Paneles } from './ui';

export class ProbadorReal implements Probador {
  sensor: Sensores['simular'];
  private id = 10;

  constructor(
    private raiz: () => THREE.Object3D,
    private escena: Escena,
    private entrada: Entrada,
    private paneles: Paneles,
    private inv: Inventario,
    sensores: Sensores,
  ) {
    this.sensor = sensores.simular;
  }

  obj(nombre: string) {
    const o = this.raiz().getObjectByName(nombre);
    if (!o) throw new Error(`No hay objeto «${nombre}»`);
    return o;
  }

  private o(x: string | THREE.Object3D) {
    return typeof x === 'string' ? this.obj(x) : x;
  }

  /** Punto de la pantalla donde se ve el objeto (y donde un toque le llega a él). */
  pantalla(x: string | THREE.Object3D) {
    const o = this.o(x);
    this.escena.escena.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(o);
    const c = caja.getCenter(new THREE.Vector3());
    const candidatos = [c];
    const t = caja.getSize(new THREE.Vector3());
    for (const [a, b] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25], [0, 0.35], [0, -0.35], [0.35, 0], [-0.35, 0]]) {
      candidatos.push(c.clone().add(new THREE.Vector3(a * t.x, b * t.y, 0)));
    }
    for (const p of candidatos) {
      const s = this.escena.aPantalla(p);
      const b = this.entrada.buscar(s.x, s.y);
      if (b && (esDe(b.obj, o) || esDe(o, b.obj))) return { x: s.x, y: s.y };
    }
    const s = this.escena.aPantalla(c);
    return { x: s.x, y: s.y };
  }

  private evento(tipo: string, id: number, x: number, y: number) {
    const lienzo = this.escena.renderer.domElement;
    lienzo.dispatchEvent(new PointerEvent(tipo, { pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: id === this.id, buttons: tipo === 'pointerup' ? 0 : 1 }));
  }

  async tocar(x: string | THREE.Object3D, veces = 1, cada = 110) {
    for (let i = 0; i < veces; i++) {
      const p = this.pantalla(x);
      const id = ++this.id;
      this.evento('pointerdown', id, p.x, p.y);
      // (sin esperar un temporizador: en un computador lento un cuadro puede tardar más que un toque)
      await Promise.resolve();
      this.evento('pointerup', id, p.x, p.y);
      await pausa(cada);
    }
  }

  async mantener(x: string | THREE.Object3D, ms: number) {
    const p = this.pantalla(x);
    const id = ++this.id;
    this.evento('pointerdown', id, p.x, p.y);
    await pausa(ms);
    this.evento('pointerup', id, p.x, p.y);
    await pausa(80);
  }

  async arrastrar(x: string | THREE.Object3D, hacia: string | THREE.Object3D | THREE.Vector3, pasos = 14) {
    const a = this.pantalla(x);
    const b = hacia instanceof THREE.Vector3 ? this.escena.aPantalla(hacia) : this.pantalla(hacia);
    const id = ++this.id;
    this.evento('pointerdown', id, a.x, a.y);
    for (let i = 1; i <= pasos; i++) {
      await pausa(25);
      this.evento('pointermove', id, a.x + ((b.x - a.x) * i) / pasos, a.y + ((b.y - a.y) * i) / pasos);
    }
    await pausa(40);
    this.evento('pointerup', id, b.x, b.y);
    await pausa(120);
  }

  async arrastrarDesde(desde: THREE.Vector3, hacia: THREE.Vector3, pasos = 14) {
    this.escena.escena.updateMatrixWorld(true);
    const a = this.escena.aPantalla(desde), b = this.escena.aPantalla(hacia);
    const id = ++this.id;
    this.evento('pointerdown', id, a.x, a.y);
    for (let i = 1; i <= pasos; i++) {
      await pausa(25);
      this.evento('pointermove', id, a.x + ((b.x - a.x) * i) / pasos, a.y + ((b.y - a.y) * i) / pasos);
    }
    await pausa(40);
    this.evento('pointerup', id, b.x, b.y);
    await pausa(120);
  }

  async deslizar(dir: Dir, desde?: string | THREE.Object3D, px = 200) {
    const a = desde ? this.pantalla(desde) : { x: innerWidth / 2, y: innerHeight / 2 };
    const d = { izq: [-1, 0], der: [1, 0], arriba: [0, -1], abajo: [0, 1] }[dir];
    const id = ++this.id;
    this.evento('pointerdown', id, a.x, a.y);
    for (let i = 1; i <= 6; i++) {
      await pausa(20);
      this.evento('pointermove', id, a.x + (d[0] * px * i) / 6, a.y + (d[1] * px * i) / 6);
    }
    this.evento('pointerup', id, a.x + d[0] * px, a.y + d[1] * px);
    await pausa(150);
  }

  async frotar(x: string | THREE.Object3D, pasadas = 8) {
    const o = this.o(x);
    this.escena.escena.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(o);
    const ancho = Math.abs(this.escena.aPantalla(caja.max).x - this.escena.aPantalla(caja.min).x);
    const c = this.pantalla(o);
    const id = ++this.id;
    this.evento('pointerdown', id, c.x, c.y);
    const r = Math.max(20, ancho * 0.38);
    for (let i = 0; i < pasadas * 8; i++) {
      await pausa(16);
      const k = i / 8;
      this.evento('pointermove', id, c.x + Math.sin(k * Math.PI * 2) * r, c.y + ((i % 16) - 8) * (r / 10));
    }
    this.evento('pointerup', id, c.x, c.y);
    await pausa(120);
  }

  async trazar(puntos: [number, number][], ms = 700) {
    const id = ++this.id;
    const P = puntos.map(([x, y]) => ({ x: x * innerWidth, y: y * innerHeight }));
    this.evento('pointerdown', id, P[0].x, P[0].y);
    const paso = ms / P.length;
    for (const p of P.slice(1)) {
      await pausa(paso);
      this.evento('pointermove', id, p.x, p.y);
    }
    this.evento('pointerup', id, P[P.length - 1].x, P[P.length - 1].y);
    await pausa(150);
  }

  async trazarPorCuadro(puntos: [number, number][]) {
    const id = ++this.id;
    const P = puntos.map(([x, y]) => ({ x: x * innerWidth, y: y * innerHeight }));
    const cuadro = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    this.evento('pointerdown', id, P[0].x, P[0].y);
    for (const p of P.slice(1)) {
      await cuadro();
      this.evento('pointermove', id, p.x, p.y);
    }
    this.evento('pointerup', id, P[P.length - 1].x, P[P.length - 1].y);
    await pausa(150);
  }

  async dedos(objs: (string | THREE.Object3D)[], ms: number) {
    const ids = objs.map(() => ++this.id);
    const ps = objs.map((o) => this.pantalla(o));
    ps.forEach((p, i) => this.evento('pointerdown', ids[i], p.x, p.y));
    await pausa(ms);
    ps.forEach((p, i) => this.evento('pointerup', ids[i], p.x, p.y));
    await pausa(120);
  }

  private async dosDedos(fn: (k: number) => [number, number, number, number]) {
    const a = ++this.id, b = ++this.id;
    let [x1, y1, x2, y2] = fn(0);
    this.evento('pointerdown', a, x1, y1);
    this.evento('pointerdown', b, x2, y2);
    for (let i = 1; i <= 12; i++) {
      await pausa(30);
      [x1, y1, x2, y2] = fn(i / 12);
      this.evento('pointermove', a, x1, y1);
      this.evento('pointermove', b, x2, y2);
    }
    this.evento('pointerup', a, x1, y1);
    this.evento('pointerup', b, x2, y2);
    await pausa(150);
  }

  pellizcar(escala: number) {
    const cx = innerWidth / 2, cy = innerHeight / 2, r0 = 60;
    return this.dosDedos((k) => {
      const r = r0 * (1 + (escala - 1) * k);
      return [cx - r, cy, cx + r, cy];
    });
  }

  girar(angulo: number) {
    const cx = innerWidth / 2, cy = innerHeight / 2, r = 90;
    return this.dosDedos((k) => {
      const a = angulo * k;
      return [cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
  }

  async usar(item: string, x: string | THREE.Object3D) {
    const b = $('inventario').querySelector<HTMLButtonElement>(`[data-item="${CSS.escape(item)}"]`);
    if (!b) throw new Error(`No tengo «${item}»`);
    if (this.inv.elegido !== item) b.click();
    await pausa(60);
    await this.tocar(x);
  }

  async panel(valor: string) {
    await this.esperarQue(() => this.paneles.abierto !== null, 20000);
    await this.paneles.escribir(valor);
    await pausa(900);
  }

  async cerrarPanel() {
    this.paneles.quitar();
    await pausa(100);
  }

  esperar(ms: number) {
    return pausa(ms);
  }

  async esperarQue(fn: () => boolean, ms = 8000) {
    const t0 = performance.now();
    while (!fn()) {
      if (performance.now() - t0 > ms) throw new Error('Se acabó el tiempo esperando');
      await pausa(50);
    }
  }
}

function esDe(hijo: THREE.Object3D, padre: THREE.Object3D) {
  let o: THREE.Object3D | null = hijo;
  while (o) {
    if (o === padre) return true;
    o = o.parent;
  }
  return false;
}
