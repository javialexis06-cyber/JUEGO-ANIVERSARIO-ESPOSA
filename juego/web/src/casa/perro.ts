// El perrito del patio en 3D: un cachorro de plastilina por piezas (cuerpo, cabeza, orejas, cejas, cola y patas)
// que se anima con código: camina esquivando los muebles, mueve la cola según su ánimo, parpadea, come, se baña y se
// sacude, duerme en su casita, trae la pelota, hace trucos y reacciona a caricias, cosquillas y jalones de cola.
import * as THREE from 'three';
import { aTres } from '../mundo';
import { cargar, copia } from '../recursos';
import type { Casa3D } from './escena_casa';

type P = { x: number; y: number };

/** Colores del pelaje: el principal y el de las manchas (orejas, cola, parche de la cabeza). */
export const PELAJES: Record<string, { nombre: string; pelaje: string; manchas: string }> = {
  caramelo: { nombre: 'Caramelo', pelaje: '#E0A96D', manchas: '#B9784A' },
  chocolate: { nombre: 'Chocolate', pelaje: '#8A5A3C', manchas: '#5E3A26' },
  negro: { nombre: 'Negrito', pelaje: '#3B3434', manchas: '#231F1F' },
  gris: { nombre: 'Gris', pelaje: '#A8A9B4', manchas: '#6F7180' },
  manchas: { nombre: 'Con manchas', pelaje: '#FBF3E8', manchas: '#C98A56' },
  dorado: { nombre: 'Dorado', pelaje: '#F2C46B', manchas: '#D39A3E' },
};

/** Lo que el perrito hace (cada cosa con su pose y su cara). */
export type Accion =
  | 'comer' | 'beber' | 'banar' | 'sacudir' | 'sentado' | 'pata' | 'rodar' | 'muerto' | 'saltar' | 'pedir' | 'caricia' | 'cosquillas'
  | 'cola' | 'estornudo' | 'ladrar' | 'hablar' | 'escuchar' | 'dormir' | 'feliz';

export type Cara = 'normal' | 'feliz' | 'dormido' | 'enojado' | 'triste';

const ESCALA = 1.1;
let GOTA: { geo: THREE.SphereGeometry; mat: THREE.Material } | null = null;
const VELOCIDAD = 1.25;
/** Canales de la pose (se suavizan hacia su meta cada cuadro). */
const CANALES = [
  'alto', 'cuerpoRX', 'cuerpoRZ', 'cuerpoY', 'cabezaRX', 'cabezaRY', 'cabezaRZ', 'colaRX', 'orejaI', 'orejaD', 'pataDI', 'pataDD', 'pataTI', 'pataTD',
  'cejas', 'boca',
] as const;
type Canal = (typeof CANALES)[number];

interface Parte {
  obj: THREE.Object3D;
  pos: THREE.Vector3;
  rot: THREE.Euler;
}

export class Perro3D {
  grupo = new THREE.Group();
  pos: P = { x: 0.2, y: -0.55 };
  rot = 0;
  /** Encima de algo (la tina): altura del piso donde está parado. */
  piso = 0;
  /** Qué tan contento está (0 triste · 1 normal · 2 feliz): la cola y las orejas lo dicen. */
  animo = 1;
  dormido = false;
  cargado = false;
  private partes = new Map<string, Parte>();
  private val = Object.fromEntries(CANALES.map((c) => [c, 0])) as Record<Canal, number>;
  private meta = Object.fromEntries(CANALES.map((c) => [c, 0])) as Record<Canal, number>;
  private ruta: P[] = [];
  private alLlegar: (() => void) | null = null;
  private recto = false;
  private accion: { tipo: Accion; t: number; dur: number; fin?: () => void } | null = null;
  private caraFija: Cara | null = null;
  private parpadeo = 3;
  private fase = 0;
  private espera = 4;
  private ultimaCara = '';
  /** Volumen de la voz mientras «habla» (repite lo que le dijeron). */
  voz = 0;
  /** Lo que tiene en la boca (la pelota). */
  private enBoca: THREE.Object3D | null = null;
  private burbujas: THREE.Mesh[] = [];
  private gotas: { m: THREE.Mesh; v: THREE.Vector3; vida: number }[] = [];

  constructor(private casa: Casa3D) {
    this.grupo.name = 'perrito';
  }

  async cargar(pelaje: string) {
    const m = copia(await cargar('perro.glb'));
    m.scale.setScalar(ESCALA);
    this.grupo.add(m);
    m.traverse((o) => {
      if (/^p_/.test(o.name)) this.partes.set(o.name, { obj: o, pos: o.position.clone(), rot: o.rotation.clone() });
      const malla = o as THREE.Mesh;
      if (malla.isMesh) {
        malla.castShadow = true;
        // Material propio (se pinta del color que escojan)
        if (/Perro \| (pelaje|manchas)/.test((malla.material as THREE.Material).name)) malla.material = (malla.material as THREE.Material).clone();
      }
    });
    this.pintar(pelaje);
    this.cargado = true;
    this.cara('normal');
  }

  pintar(pelaje: string) {
    const p = PELAJES[pelaje] ?? PELAJES.caramelo;
    this.grupo.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (!m?.name) return;
      if (m.name === 'Perro | pelaje') m.color.set(p.pelaje);
      if (m.name === 'Perro | manchas') m.color.set(p.manchas);
    });
  }

  /** Lo pone de una en un sitio (sin caminar). */
  poner(p: P, rotGrados = 0) {
    this.pos = { ...p };
    this.rot = THREE.MathUtils.degToRad(rotGrados);
    this.ruta = [];
    this.alLlegar = null;
  }

  /** Camina hasta un punto esquivando los muebles (o derecho, para meterse a la casita o a la tina). */
  ir(p: P, luego?: () => void, recto = false) {
    this.accion = null;
    this.recto = recto;
    this.ruta = recto ? [{ ...p }] : this.casa.nav('patio').ruta(this.pos, p);
    if (!this.ruta.length) this.ruta = [{ ...p }];
    this.alLlegar = luego ?? null;
  }

  get caminando() {
    return this.ruta.length > 0;
  }

  get haciendo() {
    return this.accion?.tipo ?? null;
  }

  /** Hace algo un rato (o hasta que se pida otra cosa, si dur es Infinity). */
  hacer(tipo: Accion, dur: number, fin?: () => void) {
    this.accion = { tipo, t: 0, dur, fin };
  }

  parar() {
    this.accion = null;
  }

  /** Mira hacia un punto del patio. */
  mirar(p: P) {
    this.rot = Math.atan2(p.x - this.pos.x, -(p.y - this.pos.y));
  }

  /** Cara fija (o null para la que toque según lo que hace). */
  ponerCara(c: Cara | null) {
    this.caraFija = c;
  }

  /** Pone algo en la boca (la pelota) o lo suelta en el piso delante de él. */
  morder(o: THREE.Object3D | null) {
    if (this.enBoca && !o) {
      const f = this.frente(0.32);
      this.enBoca.position.copy(aTres(f.x, f.y, 0.06));
      this.grupo.parent?.add(this.enBoca);
    }
    this.enBoca = o;
  }

  /** Un punto a cierta distancia delante del perrito (coordenadas del patio). */
  frente(d: number): P {
    return { x: this.pos.x + Math.sin(this.rot) * d, y: this.pos.y - Math.cos(this.rot) * d };
  }

  /** Posición de la cabeza en el mundo (para los globos y la cámara). */
  cabeza(): THREE.Vector3 {
    const c = this.partes.get('p_cabeza')?.obj;
    const v = new THREE.Vector3();
    if (c) c.getWorldPosition(v);
    else v.copy(aTres(this.pos.x, this.pos.y, 0.6));
    return v;
  }

  private cara(c: Cara, bocaAbierta = false) {
    const clave = `${c}|${bocaAbierta}`;
    if (clave === this.ultimaCara) return;
    this.ultimaCara = clave;
    const ver = (n: string, si: boolean) => {
      const p = this.partes.get(n);
      if (p) p.obj.visible = si;
    };
    ver('p_ojos_abiertos', c === 'normal' || c === 'enojado' || c === 'triste');
    ver('p_ojos_felices', c === 'feliz');
    ver('p_ojos_cerrados', c === 'dormido');
    ver('p_boca_abierta', bocaAbierta);
    ver('p_boca_cerrada', !bocaAbierta);
  }

  update(dt: number, t: number) {
    if (!this.cargado) return;
    const M = this.meta;
    for (const c of CANALES) M[c] = 0;
    let cara: Cara = this.animo === 0 ? 'triste' : 'normal';
    let boca = false;
    // Ánimo de siempre: la cola alegre y las orejas paraditas si está feliz; gachas si está triste
    let colaVel = this.animo === 2 ? 14 : this.animo === 1 ? 7 : 0;
    let colaAmp = this.animo === 2 ? 0.55 : this.animo === 1 ? 0.3 : 0.05;
    M.colaRX = this.animo === 0 ? 0.9 : 0;
    M.orejaI = M.orejaD = this.animo === 0 ? -0.15 : 0.1;
    M.cejas = this.animo === 0 ? -1 : 0;
    // Caminar por la ruta
    let pasoVel = 0;
    if (this.ruta.length) {
      const d = this.ruta[0];
      const dx = d.x - this.pos.x, dy = d.y - this.pos.y;
      const dist = Math.hypot(dx, dy);
      const avance = VELOCIDAD * dt;
      if (dist <= avance) {
        this.pos = { ...d };
        this.ruta.shift();
        if (!this.ruta.length) {
          const f = this.alLlegar;
          this.alLlegar = null;
          f?.();
        }
      } else {
        this.pos.x += (dx / dist) * avance;
        this.pos.y += (dy / dist) * avance;
        const meta = Math.atan2(dx, -dy);
        this.rot += Math.atan2(Math.sin(meta - this.rot), Math.cos(meta - this.rot)) * Math.min(1, dt * 10);
      }
      pasoVel = 11;
      colaVel = 12;
      colaAmp = 0.4;
    }
    // Lo que está haciendo
    const a = this.accion;
    let extra = { saltoY: 0, rodar: 0, sacudida: 0, pedaleo: 0 };
    if (a) {
      a.t += dt;
      const k = a.t;
      switch (a.tipo) {
        case 'comer':
        case 'beber':
          M.cabezaRX = 0.75 + Math.sin(k * 9) * 0.1;
          M.pataDI = M.pataDD = -0.15;
          boca = Math.sin(k * 9) > 0;
          colaVel = 12;
          colaAmp = 0.45;
          break;
        case 'banar':
          cara = 'feliz';
          M.cabezaRX = -0.15;
          M.orejaI = M.orejaD = -0.25;
          colaAmp = 0.1;
          break;
        case 'sacudir':
          extra.sacudida = Math.sin(k * 42) * 0.38 * Math.max(0, 1 - k / a.dur);
          M.orejaI = M.orejaD = Math.sin(k * 42) * 0.6;
          cara = 'feliz';
          break;
        case 'sentado':
        case 'pata':
        case 'pedir':
        case 'escuchar':
        case 'hablar':
          // Sentado: el cuerpo se inclina hacia atrás y las patas de atrás se doblan
          M.cuerpoRX = a.tipo === 'pedir' ? -0.95 : -0.5;
          M.cuerpoY = a.tipo === 'pedir' ? -0.02 : -0.05;
          M.pataTI = M.pataTD = -1.1;
          M.pataDI = M.pataDD = a.tipo === 'pedir' ? -0.4 : 0.5;
          M.cabezaRX = a.tipo === 'pedir' ? 0.6 : 0.35;
          if (a.tipo === 'pata') {
            M.pataDI = -1.35 + Math.sin(k * 6) * 0.1;
            cara = 'feliz';
          }
          if (a.tipo === 'pedir') {
            M.pataDI = M.pataDD = -1.6 + Math.sin(k * 10) * 0.2;
            cara = 'feliz';
            boca = true;
          }
          if (a.tipo === 'escuchar') {
            M.orejaI = M.orejaD = 0.7;
            M.cabezaRZ = 0.3;
          }
          if (a.tipo === 'hablar') {
            boca = this.voz > 0.12;
            M.boca = this.voz;
            M.cabezaRX = 0.25 - this.voz * 0.2;
            M.orejaI = M.orejaD = 0.3 + this.voz * 0.4;
          }
          break;
        case 'rodar':
          extra.rodar = Math.min(1, k / a.dur) * Math.PI * 2;
          M.cuerpoY = -0.1;
          M.pataDI = M.pataDD = -0.9;
          M.pataTI = M.pataTD = 0.9;
          cara = 'feliz';
          break;
        case 'muerto':
          extra.rodar = Math.min(1, k / 0.4) * Math.PI / 2;
          M.cuerpoY = -0.12;
          M.pataDI = M.pataDD = M.pataTI = M.pataTD = -0.3;
          cara = 'dormido';
          boca = true;
          colaAmp = 0;
          break;
        case 'saltar': {
          const u = Math.min(1, k / a.dur);
          extra.saltoY = Math.sin(u * Math.PI) * 0.35;
          M.pataDI = M.pataDD = -0.8;
          M.pataTI = M.pataTD = 0.8;
          cara = 'feliz';
          boca = true;
          break;
        }
        case 'caricia':
          cara = 'feliz';
          M.cabezaRZ = 0.28 * Math.sin(k * 2.5);
          M.cabezaRX = -0.1;
          M.orejaI = M.orejaD = -0.1;
          colaVel = 18;
          colaAmp = 0.7;
          break;
        case 'cosquillas':
          // Panza arriba pataleando
          extra.rodar = Math.min(1, k / 0.35) * Math.PI;
          M.cuerpoY = -0.1;
          // (boca arriba, la cabeza se echa hacia atrás para no quedar enterrada en la grama)
          M.cabezaRX = 2.1;
          extra.pedaleo = 1;
          cara = 'feliz';
          boca = true;
          colaVel = 20;
          colaAmp = 0.6;
          break;
        case 'cola':
          cara = 'enojado';
          M.cejas = 1;
          M.cabezaRY = 0.9 * Math.min(1, k * 4);
          M.orejaI = M.orejaD = 0.6;
          boca = Math.sin(k * 14) > 0.3;
          extra.saltoY = k < 0.35 ? Math.sin((k / 0.35) * Math.PI) * 0.18 : 0;
          colaVel = 30;
          colaAmp = 0.2;
          break;
        case 'estornudo': {
          const u = k / a.dur;
          M.cabezaRX = u < 0.6 ? -0.45 * (u / 0.6) : 0.5;
          cara = u < 0.6 ? 'normal' : 'dormido';
          boca = u >= 0.6 && u < 0.8;
          M.orejaI = M.orejaD = u >= 0.6 ? 0.8 : 0;
          break;
        }
        case 'ladrar':
          boca = Math.sin(k * 16) > 0;
          M.cabezaRX = -0.25;
          M.orejaI = M.orejaD = 0.4;
          break;
        case 'dormir':
          M.cuerpoY = -0.13;
          M.pataDI = M.pataDD = -1.45;
          M.pataTI = M.pataTD = 1.35;
          M.cabezaRX = 0.3;
          M.orejaI = M.orejaD = -0.2;
          cara = 'dormido';
          colaAmp = 0;
          break;
        case 'feliz':
          cara = 'feliz';
          boca = true;
          extra.saltoY = Math.abs(Math.sin(k * 7)) * 0.1;
          colaVel = 20;
          colaAmp = 0.7;
          break;
      }
      if (a.t >= a.dur) {
        this.accion = null;
        a.fin?.();
      }
    } else if (!this.ruta.length) {
      // Quieto: respira, mira a su alrededor, a veces se sienta o se rasca
      this.espera -= dt;
      if (this.espera <= 0) {
        this.espera = 4 + Math.random() * 5;
        if (Math.random() < 0.35) this.hacer('sentado', 2.5 + Math.random() * 2);
      }
      M.cabezaRY = Math.sin(t * 0.7) * 0.25;
    }
    if (this.caraFija) cara = this.caraFija;
    // Parpadeo (despierto)
    this.parpadeo -= dt;
    if (this.parpadeo < 0.12 && cara === 'normal') cara = 'dormido';
    if (this.parpadeo < 0) this.parpadeo = 2.5 + Math.random() * 3.5;
    this.cara(cara, boca);
    // Suavizado de la pose
    const s = 1 - Math.exp(-dt * 12);
    for (const c of CANALES) this.val[c] += (M[c] - this.val[c]) * s;
    this.aplicar(t, dt, pasoVel, colaVel, colaAmp, extra);
  }

  private aplicar(t: number, dt: number, pasoVel: number, colaVel: number, colaAmp: number, extra: { saltoY: number; rodar: number; sacudida: number; pedaleo: number }) {
    const V = this.val;
    const parte = (n: string) => this.partes.get(n);
    const girar = (n: string, rx = 0, ry = 0, rz = 0) => {
      const p = parte(n);
      if (!p) return;
      p.obj.rotation.set(p.rot.x + rx, p.rot.y + ry, p.rot.z + rz);
    };
    this.fase += dt * pasoVel;
    const paso = pasoVel ? Math.sin(this.fase) * 0.55 : 0;
    const rebote = pasoVel ? Math.abs(Math.sin(this.fase)) * 0.025 : Math.sin(t * 2.2) * 0.004;
    const cuerpo = parte('p_cuerpo');
    if (cuerpo) {
      cuerpo.obj.position.set(cuerpo.pos.x, cuerpo.pos.y + (V.cuerpoY + rebote) / ESCALA, cuerpo.pos.z);
      cuerpo.obj.rotation.set(cuerpo.rot.x + V.cuerpoRX, cuerpo.rot.y, cuerpo.rot.z + extra.rodar + extra.sacudida);
      // Respira
      cuerpo.obj.scale.setScalar(1 + Math.sin(t * 2.4) * 0.012);
    }
    girar('p_cabeza', V.cabezaRX, V.cabezaRY, V.cabezaRZ);
    girar('p_cola', V.colaRX, 0, Math.sin(t * colaVel) * colaAmp);
    const aleteo = pasoVel ? Math.sin(this.fase * 2) * 0.12 : 0;
    girar('p_oreja_izq', 0, 0, V.orejaI + aleteo);
    girar('p_oreja_der', 0, 0, -V.orejaD - aleteo);
    // Cejas: enojado (hacia adentro y abajo) o triste (hacia afuera y arriba)
    girar('p_ceja_izq', 0, 0, -V.cejas * 0.45);
    girar('p_ceja_der', 0, 0, V.cejas * 0.45);
    const ped = extra.pedaleo ? Math.sin(t * 22) * 0.6 : 0;
    girar('p_pata_del_izq', V.pataDI + paso + ped);
    girar('p_pata_del_der', V.pataDD - paso - ped);
    girar('p_pata_tra_izq', V.pataTI - paso - ped);
    girar('p_pata_tra_der', V.pataTD + paso + ped);
    const boca = parte('p_boca_abierta');
    if (boca) boca.obj.scale.set(1, 1, 1).multiplyScalar(0.8 + Math.min(1, V.boca) * 0.5);
    this.grupo.position.copy(aTres(this.pos.x, this.pos.y, this.piso + extra.saltoY));
    this.grupo.rotation.y = this.rot;
    // La pelota en la boca
    if (this.enBoca) {
      const c = parte('p_boca_abierta')?.obj ?? parte('p_cabeza')?.obj;
      if (c) {
        c.updateWorldMatrix(true, false);
        const v = new THREE.Vector3(0, -0.02, 0.04).applyMatrix4(c.matrixWorld);
        const padre = this.enBoca.parent;
        if (padre) this.enBoca.position.copy(padre.worldToLocal(v));
      }
    }
    this.animarBurbujas(dt, t);
  }

  /** Burbujas de jabón pegadas al perrito mientras se baña. */
  espuma(si: boolean) {
    if (si && !this.burbujas.length) {
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, transparent: true, opacity: 0.92 });
      for (let i = 0; i < 16; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.03 + Math.random() * 0.035, 10, 8), mat);
        const a = (i / 16) * Math.PI * 2;
        b.position.set(Math.cos(a) * 0.14, 0.25 + Math.random() * 0.25, Math.sin(a) * 0.2);
        b.userData.fase = Math.random() * 6;
        this.grupo.add(b);
        this.burbujas.push(b);
      }
    } else if (!si) {
      // (se sueltan de la tarjeta gráfica: cada baño hacía 16 esferas nuevas)
      for (const b of this.burbujas) {
        b.removeFromParent();
        b.geometry.dispose();
      }
      (this.burbujas[0]?.material as THREE.Material | undefined)?.dispose();
      this.burbujas = [];
    }
  }

  /** Gotitas que salen volando al sacudirse. */
  salpicar() {
    const padre = this.grupo.parent;
    if (!padre) return;
    // Una sola gotita (geometría y material) para todas las sacudidas: no queda memoria suelta
    GOTA ??= { geo: new THREE.SphereGeometry(0.018, 6, 5), mat: new THREE.MeshStandardMaterial({ color: '#9fd3f2', roughness: 0.1, transparent: true, opacity: 0.85 }) };
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(GOTA.geo, GOTA.mat);
      m.position.copy(this.grupo.position).add(new THREE.Vector3(0, 0.3, 0));
      const a = Math.random() * Math.PI * 2;
      this.gotas.push({ m, v: new THREE.Vector3(Math.cos(a) * 1.6, 1 + Math.random() * 1.4, Math.sin(a) * 1.6), vida: 0.9 });
      padre.add(m);
    }
  }

  private animarBurbujas(dt: number, t: number) {
    for (const b of this.burbujas) b.scale.setScalar(1 + Math.sin(t * 3 + b.userData.fase) * 0.12);
    for (const g of this.gotas) {
      g.vida -= dt;
      g.v.y -= 6 * dt;
      g.m.position.addScaledVector(g.v, dt);
    }
    for (const g of this.gotas.filter((x) => x.vida <= 0 || x.m.position.y < 0)) g.m.removeFromParent();
    this.gotas = this.gotas.filter((x) => x.vida > 0 && x.m.position.y >= 0);
  }

  /** Para tocarlo: qué parte quedó bajo el dedo (cabeza, nariz, barriga, cola, pata). */
  parteTocada(o: THREE.Object3D): 'cabeza' | 'nariz' | 'barriga' | 'cola' | 'pata' | null {
    if (/nariz/.test(o.name)) return 'nariz';
    for (let x: THREE.Object3D | null = o; x; x = x.parent) {
      if (x.name === 'p_cola') return 'cola';
      if (/^p_pata/.test(x.name)) return 'pata';
      if (x.name === 'p_cabeza') return 'cabeza';
      if (x.name === 'p_cuerpo') return 'barriga';
      if (x === this.grupo) return 'barriga';
    }
    return null;
  }
}
