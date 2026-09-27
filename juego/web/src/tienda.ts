// La tienda: cascarón, sitios (tapete + vitrina o botón «+»), letreros, stock visible, caja y caminos.
import * as THREE from 'three';
import { aTres } from './mundo';
import { Navegacion, P } from './navegacion';
import { CAPACIDAD, COBRO, PUNTOS_TIENDA } from './balance';
import { cargar, copia, Productos } from './recursos';

export interface SitioDato {
  id: number;
  seccion: string;
  tipo: string;
  inicio: boolean;
  letrero: boolean;
  isla?: boolean;
  posicion: Record<string, { x: number; y: number; rot: number }>;
  huella: Record<string, number[]>;
  color_tapete: string;
}
export interface TiendaDato {
  nivel: number;
  nombre: string;
  W: number;
  D: number;
  tope: number;
  escala_personas: number;
  bodega: P;
  entrada: P;
  sitios: SitioDato[];
}

export { CAPACIDAD, PRECIO } from './balance';
export const NOMBRE_SECCION: Record<string, string> = {
  frutas: 'Frutas', lacteos: 'Lácteos', abarrotes: 'Abarrotes', bebidas: 'Bebidas', panaderia: 'Panadería', congelados: 'Congelados',
  carnes: 'Carnes', caja: 'Caja',
};
export const CAJA_SECCION: Record<string, string> = {
  frutas: 'caja frutas', lacteos: 'caja lacteos', abarrotes: 'caja abarrotes', bebidas: 'caja bebidas', panaderia: 'caja panaderia',
  congelados: 'caja congelados', carnes: 'caja carnes',
};
const GIRO_LETRERO = THREE.MathUtils.degToRad(38);

function rotar(p: P, rot: number): P {
  const c = Math.cos(rot), s = Math.sin(rot);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/** Contorno punteado (como el de los sitios por comprar en los renders): tiras cortas sobre el borde. */
function punteado(forma: THREE.Shape, color: string): THREE.Mesh {
  const pts = forma.getSpacedPoints(90);
  const pos: number[] = [];
  const ancho = 0.022;
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    const nx = (-dy / l) * ancho, ny = (dx / l) * ancho;
    const q = [
      [a.x + nx, a.y + ny], [a.x - nx, a.y - ny], [b.x - nx, b.y - ny],
      [a.x + nx, a.y + ny], [b.x - nx, b.y - ny], [b.x + nx, b.y + ny],
    ];
    for (const [x, y] of q) pos.push(x, 0, -y);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide }));
  m.position.y = 0.004;
  m.receiveShadow = true;
  return m;
}

function tapete(color: string, hx: number, hy: number, r = 0.18, borde?: string): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(-hx + r, -hy);
  s.lineTo(hx - r, -hy);
  s.quadraticCurveTo(hx, -hy, hx, -hy + r);
  s.lineTo(hx, hy - r);
  s.quadraticCurveTo(hx, hy, hx - r, hy);
  s.lineTo(-hx + r, hy);
  s.quadraticCurveTo(-hx, hy, -hx, hy - r);
  s.lineTo(-hx, -hy + r);
  s.quadraticCurveTo(-hx, -hy, -hx + r, -hy);
  const g = new THREE.ShapeGeometry(s, 6);
  g.rotateX(-Math.PI / 2);
  // Los tapetes de sitios por comprar son blancos como en los renders: un leve brillo propio compensa la luz del juego
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  if (borde) {
    mat.emissive.set('#FFF4EC');
    mat.emissiveIntensity = 0.18;
  }
  const m = new THREE.Mesh(g, mat);
  m.position.y = 0.012;
  m.receiveShadow = true;
  if (borde) {
    // El contorno va un poco por dentro del borde del tapete
    const k = 0.06;
    const f = new THREE.Shape();
    const ax = hx - k, ay = hy - k, rr = Math.max(0.05, r - k / 2);
    f.moveTo(-ax + rr, -ay);
    f.lineTo(ax - rr, -ay);
    f.quadraticCurveTo(ax, -ay, ax, -ay + rr);
    f.lineTo(ax, ay - rr);
    f.quadraticCurveTo(ax, ay, ax - rr, ay);
    f.lineTo(-ax + rr, ay);
    f.quadraticCurveTo(-ax, ay, -ax, ay - rr);
    f.lineTo(-ax, -ay + rr);
    f.quadraticCurveTo(-ax, -ay, -ax + rr, -ay);
    m.add(punteado(f, borde));
  }
  return m;
}

/** Un sitio de la tienda: puede estar libre (por comprar) o tener una vitrina de nivel 1..3. */
export class Vitrina {
  grupo = new THREE.Group();
  nivel = 0;
  stock = 0;
  capacidad = 0;
  productos: string[] = [];
  private marcas: THREE.Object3D[] = [];
  tiempoVacia = 0;
  maxVacia = 0;

  constructor(public dato: SitioDato) {
    this.grupo.userData = { tipo: 'sitio', id: dato.id };
  }

  get seccion() {
    return this.dato.seccion;
  }
  posicion(nivel = this.nivel || 1) {
    return this.dato.posicion[String(nivel)];
  }
  /** Punto donde se para quien toma o repone producto (frente de la vitrina). */
  frente(): P {
    const p = this.posicion();
    const h = this.dato.huella[String(this.nivel || 1)];
    const f = rotar({ x: 0, y: h[2] - 0.45 }, p.rot);
    return { x: p.x + f.x, y: p.y + f.y };
  }
  centro(): P {
    const p = this.posicion();
    const h = this.dato.huella[String(this.nivel || 1)];
    const c = rotar({ x: (h[0] + h[1]) / 2, y: (h[2] + h[3]) / 2 }, p.rot);
    return { x: p.x + c.x, y: p.y + c.y };
  }
  /** Rectángulo que ocupa en el mundo (para bloquear el camino). */
  rect(): [number, number, number, number] {
    const p = this.posicion();
    const h = this.dato.huella[String(this.nivel || 1)];
    const esquinas = [
      rotar({ x: h[0], y: h[2] }, p.rot), rotar({ x: h[1], y: h[2] }, p.rot),
      rotar({ x: h[0], y: h[3] }, p.rot), rotar({ x: h[1], y: h[3] }, p.rot),
    ];
    const xs = esquinas.map((e) => e.x + p.x), ys = esquinas.map((e) => e.y + p.y);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  get fraccion() {
    return this.capacidad ? this.stock / this.capacidad : 0;
  }

  async montar(nivel: number, productos: Productos) {
    this.grupo.clear();
    this.nivel = nivel;
    this.marcas = [];
    const pos = this.posicion(nivel || 1);
    const h = this.dato.huella[String(nivel || 1)];
    const hx = (h[1] - h[0]) / 2 + 0.25, hy = (h[3] - h[2]) / 2 + 0.3;
    const cx = (h[0] + h[1]) / 2, cy = (h[2] + h[3]) / 2;
    const base = new THREE.Group();
    base.position.copy(aTres(pos.x, pos.y));
    base.rotation.y = pos.rot;
    this.grupo.add(base);
    if (!nivel) {
      const t = tapete('#FFFFFF', hx + 0.12, hy + 0.12, 0.3, '#B59C8C');
      t.position.set(cx, 0.008, -cy);
      base.add(t);
      const boton = copia(await cargar('boton_comprar.glb'));
      boton.position.set(cx, 0, -cy);
      boton.rotation.y = GIRO_LETRERO - pos.rot;
      base.add(boton);
      this.capacidad = 0;
      this.stock = 0;
    } else {
      const t = tapete(this.dato.color_tapete, hx, hy);
      t.position.set(cx, 0, -cy);
      base.add(t);
      const modelo = copia(await cargar(`vitrina_${this.dato.tipo}_${nivel}.glb`));
      base.add(modelo);
      modelo.traverse((o) => {
        if (o.userData?.producto) this.marcas.push(o);
      });
      // Orden estable: se vacía primero lo de arriba y de adelante
      this.marcas.sort((a, b) => b.position.y - a.position.y || a.position.x - b.position.x);
      for (const m of this.marcas) {
        const pr = productos.crear(m.userData.producto);
        if (pr) m.add(pr);
      }
      this.productos = [...new Set(this.marcas.map((m) => m.userData.producto as string))];
      this.capacidad = CAPACIDAD[this.dato.tipo]?.[nivel] ?? 0;
      this.ponerStock(this.capacidad);
    }
    if (this.dato.letrero && this.dato.seccion !== 'caja') {
      try {
        const letrero = copia(await cargar(`letrero_${this.dato.seccion}.glb`));
        letrero.position.set(cx, 0, -cy);
        letrero.rotation.y = GIRO_LETRERO - pos.rot;
        base.add(letrero);
      } catch {
        /* sin letrero para esta sección */
      }
    }
    this.grupo.traverse((o) => (o.userData = { ...o.userData, tipo: 'sitio', id: this.dato.id }));
  }

  ponerStock(n: number) {
    this.stock = Math.max(0, Math.min(this.capacidad, n));
    const visibles = this.capacidad ? Math.ceil((this.stock / this.capacidad) * this.marcas.length) : 0;
    this.marcas.forEach((m, i) => (m.visible = i >= this.marcas.length - visibles));
  }
}

/** Caja registradora con su fila de clientes. */
export class Caja {
  constructor(public vitrina: Vitrina) {}
  get nivel() {
    return this.vitrina.nivel;
  }
  /** Segundos que tarda en cobrarle a un cliente según cuántas unidades lleva. */
  tiempoCobro(unidades: number) {
    const n = Math.max(1, Math.min(3, this.nivel));
    return COBRO.base[n] + COBRO.porUnidad[n] * unidades;
  }
  /** Donde se para quien cobra (detrás del mostrador). */
  puestoCajero(): P {
    const p = this.vitrina.posicion();
    const h = this.vitrina.dato.huella[String(this.nivel)];
    const f = rotar({ x: 0.1, y: h[3] + 0.4 }, p.rot);
    return { x: p.x + f.x, y: p.y + f.y };
  }
  /** Puesto k de la fila (0 = el que está pagando). */
  puestoFila(k: number): P {
    const p = this.vitrina.posicion();
    const h = this.vitrina.dato.huella[String(this.nivel)];
    const f = rotar({ x: 0.2 + k * 0.62, y: h[2] - 0.5 }, p.rot);
    return { x: p.x + f.x, y: p.y + f.y };
  }
}

// Obstáculos fijos del cascarón de la tiendita (pilas de mercancía, planta, puesto de canastas)
const OBSTACULOS: Record<number, [number, number, number, number][]> = {
  1: [[4.2, -3.9, 5.8, -2.6], [1.3, 3.0, 2.9, 4.5], [-5.9, -4.4, -5.2, -3.7], [-5.8, -4.0, -5.0, -3.3]],
};

export class Tienda {
  grupo = new THREE.Group();
  vitrinas: Vitrina[] = [];
  caja!: Caja;
  nav!: Navegacion;
  bodega!: P;
  entrada!: P;
  canecas: P[] = [];
  puestoCanastas!: P;
  puestoGuardia!: P;
  private obstaculosExtra: [number, number, number, number][] = [];

  constructor(public dato: TiendaDato, private productos: Productos) {}

  /** Pone un objeto de utilería en el piso (y opcionalmente lo vuelve obstáculo). */
  private async utileria(nombre: string, p: P, rot = 0, escala = 1, obstaculo?: [number, number, number, number]) {
    try {
      const o = copia(await cargar(`${nombre}.glb`));
      o.position.copy(aTres(p.x, p.y));
      o.rotation.y = rot;
      o.scale.setScalar(escala);
      this.grupo.add(o);
      if (obstaculo) this.obstaculosExtra.push(obstaculo);
    } catch {
      /* modelo no disponible: se juega igual */
    }
  }

  async montar(niveles: Record<number, number>, mejoras: Record<string, number> = {}) {
    const base = await cargar(`tienda${this.dato.nivel}_base.glb`);
    const cascaron = copia(base);
    // Las cajas de la bodega vienen como marcas: se llenan con el producto
    cascaron.traverse((o) => {
      if (o.userData?.producto) {
        const pr = this.productos.crear(o.userData.producto);
        if (pr) o.add(pr);
      }
    });
    this.grupo.add(cascaron);
    this.bodega = this.dato.bodega;
    this.entrada = this.dato.entrada;
    for (const s of this.dato.sitios) {
      const v = new Vitrina(s);
      await v.montar(niveles[s.id] ?? 0, this.productos);
      this.vitrinas.push(v);
      this.grupo.add(v.grupo);
      if (s.seccion === 'caja') this.caja = new Caja(v);
    }
    // Canecas, canastas y adornos comprados
    const pt = PUNTOS_TIENDA[this.dato.nivel];
    if (pt) {
      const caja = (p: P, r: number): [number, number, number, number] => [p.x - r, p.y - r, p.x + r, p.y + r];
      this.canecas = [pt.caneca];
      await this.utileria('caneca', pt.caneca, 0, 1.1, caja(pt.caneca, 0.3));
      if (mejoras.caneca2) {
        this.canecas.push(pt.caneca2);
        await this.utileria('caneca', pt.caneca2, 0, 1.1, caja(pt.caneca2, 0.3));
      }
      this.puestoCanastas = pt.canastas;
      this.puestoGuardia = pt.guardia;
      for (const [id, d] of Object.entries(pt.decoracion)) if (mejoras[id]) await this.utileria(id, d.p, d.rot, d.escala, d.obstaculo);
    } else {
      this.canecas = [this.bodega];
      this.puestoCanastas = this.entrada;
      this.puestoGuardia = this.entrada;
    }
    this.armarCaminos();
  }

  /** La caneca más cercana a un punto. */
  canecaCercana(p: P): P {
    return this.canecas.reduce((a, c) => (Math.hypot(c.x - p.x, c.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? c : a));
  }

  armarCaminos() {
    this.nav = new Navegacion(this.dato.W, this.dato.D);
    for (const v of this.vitrinas) if (v.nivel) this.nav.bloquear(...v.rect());
    for (const r of OBSTACULOS[this.dato.nivel] ?? []) this.nav.bloquear(...r);
    for (const r of this.obstaculosExtra) this.nav.bloquear(...r);
  }

  /** Vitrinas compradas donde se venden productos (sin la caja). */
  get enVenta() {
    return this.vitrinas.filter((v) => v.nivel > 0 && v.seccion !== 'caja' && v.productos.length);
  }

  porGrupo(o: THREE.Object3D | null): Vitrina | null {
    while (o) {
      if (o.userData?.tipo === 'sitio') return this.vitrinas.find((v) => v.dato.id === o!.userData.id) ?? null;
      o = o.parent;
    }
    return null;
  }
}
