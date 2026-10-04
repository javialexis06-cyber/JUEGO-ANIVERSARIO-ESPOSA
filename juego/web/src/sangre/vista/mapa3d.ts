// El escenario en 3D: el piso (textura del bioma + sombras de contacto al pie de las paredes), las paredes en trozos
// de 8 × 8 celdas con instancias (tiemblan y se encogen mientras las excavan, se rehacen al romperse), las antorchas
// y velas con sus llamas, la decoración, el agua negra, la lava y los rieles de la carreta.
import * as THREE from 'three';
import { hash2 } from '../../casa/lavado/azar';
import type { DefBioma } from '../datos/mundo';
import { C, VIDA_CELDA, esSolida } from '../tipos';
import type { Mapa } from '../sim/mapa';
import { conLuz, type FuenteLuz } from './luz';
import type { Biblioteca } from './modelos';
import { DECO_LUZ, LLAMAS_VELAS, type ModeloFijo, type ModelosPared } from './reemplazos_mapa';
import { ESCALA_PUNTOS, texturaFuego } from './texturas';
export { ESCALA_PUNTOS };

const TROZO = 8;
const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);

interface Trozo {
  cx: number;
  cy: number;
  grupo: THREE.Group;
  mallas: THREE.InstancedMesh[];
  /** Celda → [malla, índice] (para hacerla temblar). */
  donde: Map<number, [THREE.InstancedMesh, number]>;
  sucio: boolean;
}

export class Mapa3D {
  grupo = new THREE.Group();
  private trozos: Trozo[] = [];
  private tw: number;
  private th: number;
  private copia: Uint8Array;
  private version = -1;
  private paredes: ModelosPared;
  private piso!: THREE.Mesh;
  private ao!: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; img: ImageData; tex: THREE.CanvasTexture };
  private llamas!: THREE.Points;
  private tiempoLlamas = { value: 0 };
  private temblando = new Map<number, { malla: THREE.InstancedMesh; k: number; base: THREE.Matrix4 }>();
  fijas: FuenteLuz[] = [];
  /** Hay que rehacer la luz fija (se rompió una pared). */
  luzSucia = true;

  constructor(private m: Mapa, private bioma: DefBioma, private bib: Biblioteca, private colorAntorcha: THREE.Color) {
    this.tw = Math.ceil(m.w / TROZO);
    this.th = Math.ceil(m.h / TROZO);
    this.copia = m.c.slice();
    this.paredes = bib.paredes();
    this.hacerPiso();
    for (let ty = 0; ty < this.th; ty++)
      for (let tx = 0; tx < this.tw; tx++) {
        const g = new THREE.Group();
        this.grupo.add(g);
        this.trozos.push({ cx: tx, cy: ty, grupo: g, mallas: [], donde: new Map(), sucio: true });
      }
    this.hacerAntorchas();
    this.hacerDeco();
    this.hacerLiquidos();
    this.hacerRieles();
    this.actualizar(0, []);
  }

  // ----------------------------------------------------------------------------------------------- Piso
  private hacerPiso() {
    const { w, h } = this.m;
    const geo = new THREE.PlaneGeometry(w, h, 1, 1);
    geo.rotateX(-Math.PI / 2);
    geo.translate(w / 2, 0, h / 2);
    const tex = texturaPiso(this.bioma);
    tex.repeat.set(w / 4, h / 4);
    // Sombras de contacto: 4 texels por celda
    const canvas = document.createElement('canvas');
    canvas.width = w * 4;
    canvas.height = h * 4;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(canvas.width, canvas.height);
    const aoTex = new THREE.CanvasTexture(canvas);
    aoTex.flipY = false;
    aoTex.colorSpace = THREE.NoColorSpace;
    this.ao = { canvas, ctx, img, tex: aoTex };
    this.pintarAO(0, 0, w, h);
    const matPiso = conLuz(new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.92, metalness: 0, aoMap: aoTex, aoMapIntensity: 1, normalMap: texturaNormalPiso(), normalScale: new THREE.Vector2(0.9, 0.9),
    }));
    matPiso.normalMap!.repeat.set(w / 2, h / 2);
    this.piso = new THREE.Mesh(geo, matPiso);
    this.piso.receiveShadow = true;
    this.grupo.add(this.piso);
  }

  /** Oscurece el piso al pie de las paredes (en la región dada, en celdas). */
  private pintarAO(x0: number, y0: number, x1: number, y1: number) {
    const { w, h } = this.m;
    const W = w * 4;
    const d = this.ao.img.data;
    const ax = Math.max(0, x0 * 4), ay = Math.max(0, y0 * 4), bx = Math.min(W, x1 * 4), by = Math.min(h * 4, y1 * 4);
    for (let py = ay; py < by; py++)
      for (let px = ax; px < bx; px++) {
        const x = (px + 0.5) / 4, y = (py + 0.5) / 4;
        const cx = Math.floor(x), cy = Math.floor(y);
        let dmin = 2;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const t = this.m.get(cx + dx, cy + dy);
            if (!esSolida(t) || t === C.LAVA) continue;
            const qx = Math.max(cx + dx, Math.min(x, cx + dx + 1)), qy = Math.max(cy + dy, Math.min(y, cy + dy + 1));
            const dd = Math.hypot(x - qx, y - qy);
            if (dd < dmin) dmin = dd;
          }
        const v = Math.round(255 * (0.32 + 0.68 * Math.min(1, Math.pow(dmin / 1.4, 0.7))));
        const i = (py * W + px) * 4;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
    this.ao.ctx.putImageData(this.ao.img, 0, 0);
    this.ao.tex.needsUpdate = true;
  }

  // ----------------------------------------------------------------------------------------------- Paredes
  private construir(t: Trozo) {
    for (const m of t.mallas) {
      t.grupo.remove(m);
      m.dispose();
    }
    t.mallas = [];
    t.donde.clear();
    const porModelo = new Map<ModeloFijo, number[]>();
    const lista = (mod: ModeloFijo) => {
      let l = porModelo.get(mod);
      if (!l) porModelo.set(mod, (l = []));
      return l;
    };
    const { m } = this;
    for (let cy = t.cy * TROZO; cy < Math.min(m.h, (t.cy + 1) * TROZO); cy++)
      for (let cx = t.cx * TROZO; cx < Math.min(m.w, (t.cx + 1) * TROZO); cx++) {
        const i = cy * m.w + cx;
        const tipo = m.c[i];
        const v = m.v[i];
        const p = this.paredes;
        let lst: ModeloFijo[] | null = null;
        if (tipo === C.BLANDA) lst = p.blanda;
        else if (tipo === C.DURA) lst = p.dura;
        else if (tipo === C.BORDE) {
          // El borde de afuera, si no se ve desde ninguna celda abierta, ni se dibuja
          if (!this.cercaDeAbierta(cx, cy)) continue;
          lst = p.borde;
        } else if (tipo === C.HIERRO) lst = p.hierro;
        else if (tipo === C.SANGRE) lst = p.sangre;
        else if (tipo === C.ORO) lst = p.oro;
        else if (tipo === C.HUEVO) lst = p.huevo;
        else if (tipo === C.ESCOMBRO) lst = p.escombro;
        if (!lst || !lst.length) continue;
        lista(lst[v % lst.length]).push(i);
      }
    for (const [mod, celdas] of porModelo) {
      const malla = new THREE.InstancedMesh(mod.geo, mod.mats, celdas.length);
      malla.castShadow = true;
      malla.receiveShadow = true;
      celdas.forEach((i, k) => {
        this.matrizCelda(i, M);
        malla.setMatrixAt(k, M);
        t.donde.set(i, [malla, k]);
      });
      malla.instanceMatrix.needsUpdate = true;
      malla.computeBoundingSphere();
      t.grupo.add(malla);
      t.mallas.push(malla);
    }
    t.sucio = false;
  }

  private cercaDeAbierta(cx: number, cy: number) {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!esSolida(this.m.get(cx + dx, cy + dy))) return true;
    return false;
  }

  /** La matriz de la pared de una celda: girada al azar (o hacia lo abierto si es veta) y con su alto propio. */
  private matrizCelda(i: number, out: THREE.Matrix4, temblor = 0, encoge = 1) {
    const m = this.m;
    const cx = i % m.w, cy = (i / m.w) | 0;
    const t = m.c[i];
    const v = m.v[i];
    let rot = (v % 4) * (Math.PI / 2);
    if (t === C.HIERRO || t === C.SANGRE || t === C.ORO || t === C.HUEVO) {
      // Que los cristales miren a lo abierto (prefiere abajo, hacia la cámara)
      const dirs: [number, number][] = [[0, 1], [1, 0], [-1, 0], [0, -1]];
      const d = dirs.find(([dx, dy]) => !esSolida(m.get(cx + dx, cy + dy)));
      if (d) rot = Math.atan2(d[0], d[1]) + Math.PI;
    }
    const alto = t === C.BORDE ? 1 : 0.92 + (v / 255) * 0.2;
    Q.setFromAxisAngle(Y, rot);
    P.set(cx + 0.5 + (temblor ? (Math.random() - 0.5) * temblor : 0), 0, cy + 0.5 + (temblor ? (Math.random() - 0.5) * temblor : 0));
    S.set(encoge, alto * encoge, encoge);
    out.compose(P, Q, S);
  }

  /** Las paredes que se están excavando tiemblan y se encogen según la vida que les queda. */
  temblar(celdas: number[]) {
    const ahora = new Set(celdas);
    for (const [i, x] of this.temblando) {
      if (ahora.has(i)) continue;
      x.malla.setMatrixAt(x.k, x.base);
      x.malla.instanceMatrix.needsUpdate = true;
      this.temblando.delete(i);
    }
    for (const i of celdas) {
      const t = this.trozos[Math.floor(((i / this.m.w) | 0) / TROZO) * this.tw + Math.floor((i % this.m.w) / TROZO)];
      const d = t?.donde.get(i);
      if (!d) continue;
      if (!this.temblando.has(i)) {
        const base = new THREE.Matrix4();
        d[0].getMatrixAt(d[1], base);
        this.temblando.set(i, { malla: d[0], k: d[1], base });
      }
      const max = VIDA_CELDA[this.m.c[i]] ?? 1;
      const frac = Math.max(0, Math.min(1, this.m.hp[i] / max));
      this.matrizCelda(i, M, 0.06, 0.82 + 0.18 * frac);
      d[0].setMatrixAt(d[1], M);
      d[0].instanceMatrix.needsUpdate = true;
    }
  }

  // ----------------------------------------------------------------------------------------------- Antorchas y velas
  private hacerAntorchas() {
    const m = this.m;
    const ant = this.bib.antorcha();
    const vel = this.bib.velas();
    const deAntorcha = m.antorchas.filter((a) => !a.vela);
    const deVela = m.antorchas.filter((a) => a.vela);
    const llamaLocal = this.bib.llamaAntorcha();
    const puntos: number[] = [];
    const tam: number[] = [];
    const fase: number[] = [];
    if (deAntorcha.length) {
      const malla = new THREE.InstancedMesh(ant.geo, ant.mats, deAntorcha.length);
      deAntorcha.forEach((a, k) => {
        // En la cara de la pared que mira a lo abierto
        const rot = Math.atan2(a.dx, a.dy) + Math.PI;
        Q.setFromAxisAngle(Y, rot);
        P.set(a.cx + 0.5 + a.dx * 0.5, 0, a.cy + 0.5 + a.dy * 0.5);
        S.setScalar(1);
        M.compose(P, Q, S);
        malla.setMatrixAt(k, M);
        const ll = llamaLocal.clone().applyQuaternion(Q).add(P);
        puntos.push(ll.x, ll.y, ll.z);
        tam.push(0.55);
        fase.push(hash2(a.cx, a.cy, 9) * 10);
        this.fijas.push({ x: ll.x + a.dx * 0.6, y: ll.z + a.dy * 0.6, r: 7.5, color: this.colorAntorcha, fuerza: 1.15 });
      });
      malla.castShadow = false;
      malla.computeBoundingSphere();
      this.grupo.add(malla);
    }
    if (deVela.length) {
      const malla = new THREE.InstancedMesh(vel.geo, vel.mats, deVela.length);
      deVela.forEach((a, k) => {
        const rot = hash2(a.cx, a.cy, 3) * Math.PI * 2;
        Q.setFromAxisAngle(Y, rot);
        P.set(a.cx + 0.5, 0, a.cy + 0.5);
        S.setScalar(1);
        M.compose(P, Q, S);
        malla.setMatrixAt(k, M);
        for (const [x, z, h] of LLAMAS_VELAS) {
          const ll = new THREE.Vector3(x, h + 0.04, z).applyQuaternion(Q).add(P);
          puntos.push(ll.x, ll.y, ll.z);
          tam.push(0.16);
          fase.push(hash2(a.cx * 7 + x * 10, a.cy, 9) * 10);
        }
        this.fijas.push({ x: a.cx + 0.5, y: a.cy + 0.5, r: 4, color: this.colorAntorcha, fuerza: 0.65 });
      });
      malla.computeBoundingSphere();
      this.grupo.add(malla);
    }
    this.llamas = llamasPuntos(puntos, tam, fase, this.tiempoLlamas);
    this.grupo.add(this.llamas);
  }

  // ----------------------------------------------------------------------------------------------- Decoración
  private hacerDeco() {
    const porTipo = new Map<string, typeof this.m.deco>();
    for (const d of this.m.deco) {
      const l = porTipo.get(d.tipo) ?? [];
      l.push(d);
      porTipo.set(d.tipo, l);
    }
    const llamas: number[] = [];
    for (const [tipo, lista] of porTipo) {
      const mod = this.bib.fijo('deco', tipo);
      const malla = new THREE.InstancedMesh(mod.geo, mod.mats, lista.length);
      lista.forEach((d, k) => {
        Q.setFromAxisAngle(Y, d.rot);
        P.set(d.x, 0, d.y);
        S.setScalar(d.esc);
        M.compose(P, Q, S);
        malla.setMatrixAt(k, M);
        const luz = DECO_LUZ[tipo];
        if (luz) this.fijas.push({ x: d.x, y: d.y, r: luz[2], color: new THREE.Color(luz[0]), fuerza: luz[1] });
        void llamas;
      });
      malla.castShadow = true;
      malla.receiveShadow = true;
      malla.computeBoundingSphere();
      this.grupo.add(malla);
    }
  }

  // ----------------------------------------------------------------------------------------------- Agua y lava
  private hacerLiquidos() {
    const m = this.m;
    for (const tipo of [C.AGUA, C.LAVA]) {
      const pos: number[] = [];
      for (let cy = 0; cy < m.h; cy++)
        for (let cx = 0; cx < m.w; cx++) {
          if (m.c[cy * m.w + cx] !== tipo) continue;
          const y = tipo === C.LAVA ? 0.05 : 0.03;
          pos.push(cx, y, cy, cx, y, cy + 1, cx + 1, y, cy + 1, cx, y, cy, cx + 1, y, cy + 1, cx + 1, y, cy);
        }
      if (!pos.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const mat = materialLiquido(tipo === C.LAVA, this.tiempoLlamas);
      const malla = new THREE.Mesh(geo, mat);
      malla.renderOrder = 1;
      this.grupo.add(malla);
    }
  }

  private hacerRieles() {
    const r = this.m.rieles;
    if (r.length < 2) return;
    const madera = conLuz(new THREE.MeshStandardMaterial({ color: '#3e2c1e', roughness: 0.95 }));
    const hierro = conLuz(new THREE.MeshStandardMaterial({ color: '#5a5c62', roughness: 0.4, metalness: 0.8 }));
    const travesanos = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.08, 0.22), madera, r.length * 2);
    const rieles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.08, 1), hierro, r.length * 2);
    let k = 0, kr = 0;
    for (let i = 0; i < r.length - 1; i++) {
      const a = r[i], b = r[i + 1];
      const ang = Math.atan2(b.x - a.x, b.y - a.y);
      Q.setFromAxisAngle(Y, ang);
      for (const f of [0, 0.5]) {
        P.set(a.x + (b.x - a.x) * f + 0.5, 0.04, a.y + (b.y - a.y) * f + 0.5);
        S.setScalar(1);
        M.compose(P, Q, S);
        travesanos.setMatrixAt(k++, M);
      }
      const l = Math.hypot(b.x - a.x, b.y - a.y);
      for (const lado of [-0.42, 0.42]) {
        const ox = Math.cos(ang) * lado, oz = -Math.sin(ang) * lado;
        P.set((a.x + b.x) / 2 + 0.5 + ox, 0.1, (a.y + b.y) / 2 + 0.5 + oz);
        S.set(1, 1, l);
        M.compose(P, Q, S);
        rieles.setMatrixAt(kr++, M);
      }
    }
    travesanos.count = k;
    rieles.count = kr;
    travesanos.receiveShadow = rieles.receiveShadow = true;
    this.grupo.add(travesanos, rieles);
  }

  // ----------------------------------------------------------------------------------------------- Cada cuadro
  /** Rehace los trozos cuyas celdas cambiaron y hace temblar las que se excavan. */
  actualizar(t: number, excavando: number[]) {
    this.tiempoLlamas.value = t;
    if (this.m.version !== this.version) {
      this.version = this.m.version;
      const c = this.m.c;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let i = 0; i < c.length; i++) {
        if (c[i] === this.copia[i]) continue;
        this.copia[i] = c[i];
        const cx = i % this.m.w, cy = (i / this.m.w) | 0;
        // Se marca el trozo y los vecinos (el borde de afuera puede quedar a la vista)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const tx = Math.floor((cx + dx * 3) / TROZO), ty = Math.floor((cy + dy * 3) / TROZO);
            if (tx >= 0 && ty >= 0 && tx < this.tw && ty < this.th) this.trozos[ty * this.tw + tx].sucio = true;
          }
        this.temblando.delete(i);
        x0 = Math.min(x0, cx - 3);
        y0 = Math.min(y0, cy - 3);
        x1 = Math.max(x1, cx + 4);
        y1 = Math.max(y1, cy + 4);
        this.luzSucia = true;
      }
      if (x1 >= 0) this.pintarAO(Math.max(0, x0), Math.max(0, y0), x1, y1);
    }
    for (const tr of this.trozos) if (tr.sucio) this.construir(tr);
    this.temblar(excavando);
  }

  liberar() {
    this.grupo.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh || (o as THREE.Points).isPoints) {
        (m as THREE.InstancedMesh).dispose?.();
      }
    });
    this.ao.tex.dispose();
  }
}

// ------------------------------------------------------------------------------------------------- Texturas del piso
const texturasPiso = new Map<string, THREE.CanvasTexture>();
function texturaPiso(b: DefBioma): THREE.CanvasTexture {
  const c0 = texturasPiso.get(b.id);
  if (c0) return c0;
  const n = 512;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const [p0, p1, p2] = b.piso;
  g.fillStyle = p0;
  g.fillRect(0, 0, n, n);
  let s = 11;
  const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const mancha = (col: string, a: number, r0: number, r1: number, cuantas: number) => {
    g.fillStyle = col;
    for (let k = 0; k < cuantas; k++) {
      g.globalAlpha = a * (0.4 + az() * 0.6);
      const x = az() * n, y = az() * n, r = r0 + az() * (r1 - r0);
      for (const [ox, oy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) {
        g.beginPath();
        g.ellipse(x + ox, y + oy, r, r * (0.6 + az() * 0.6), az() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  };
  mancha(p1, 0.35, 20, 70, 50);
  mancha(p2, 0.25, 10, 40, 60);
  const losas = b.id === 'catacumbas' || b.id === 'abadia' || b.id === 'castillo';
  if (losas) {
    // Losas de 1 m (128 px) desparejas, con juntas y bordes gastados
    const t = b.id === 'castillo' ? 64 : 128;
    for (let y = 0; y < n; y += t)
      for (let x = 0; x < n; x += t) {
        const des = (y / t) % 2 ? t / 2 : 0;
        g.fillStyle = new THREE.Color(az() < 0.5 ? p0 : p2).offsetHSL(0, 0, (az() - 0.5) * 0.06).getStyle();
        g.globalAlpha = 0.55;
        g.fillRect(x + des + 3, y + 3, t - 6, t - 6);
        g.globalAlpha = 1;
        g.strokeStyle = 'rgba(0,0,0,0.55)';
        g.lineWidth = 4;
        g.strokeRect(x + des + 1, y + 1, t - 2, t - 2);
        if (des) g.strokeRect(x + des - t + 1, y + 1, t - 2, t - 2);
      }
  } else {
    // Tierra: piedritas y matas
    for (let k = 0; k < 260; k++) {
      const x = az() * n, y = az() * n, r = 1.5 + az() * 4;
      g.fillStyle = `rgba(${az() < 0.5 ? '200,190,170' : '20,18,14'},${0.15 + az() * 0.25})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    if (b.id === 'cementerio') {
      g.strokeStyle = 'rgba(70,90,50,0.55)';
      g.lineWidth = 1.5;
      for (let k = 0; k < 90; k++) {
        const x = az() * n, y = az() * n;
        for (let h = 0; h < 5; h++) {
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + (az() - 0.5) * 10, y - 5 - az() * 9);
          g.stroke();
        }
      }
    }
  }
  // Grietas
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = 1.6;
  for (let k = 0; k < 14; k++) {
    let x = az() * n, y = az() * n;
    g.beginPath();
    g.moveTo(x, y);
    for (let p = 0; p < 6; p++) {
      x += (az() - 0.5) * 50;
      y += (az() - 0.5) * 50;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // Manchas oscuras (humedad, sangre vieja)
  mancha(b.id === 'castillo' || b.id === 'minas' ? '#3a0808' : '#0a0806', 0.25, 15, 45, 12);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  texturasPiso.set(b.id, tex);
  return tex;
}

let normalPiso: THREE.Texture | null = null;
function texturaNormalPiso() {
  if (normalPiso) return normalPiso;
  // Relieve de piedra: ruido grueso + fino
  const n = 256;
  const alto = new Float32Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) alto[y * n + x] = hash2(x >> 3, y >> 3, 5) * 0.6 + hash2(x, y, 6) * 0.4;
  for (let pas = 0; pas < 2; pas++) {
    const c = alto.slice();
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += c[((y + dy + n) % n) * n + ((x + dx + n) % n)];
        alto[y * n + x] = s / 9;
      }
  }
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const h = (xx: number, yy: number) => alto[((yy + n) % n) * n + ((xx + n) % n)];
      const dx = (h(x + 1, y) - h(x - 1, y)) * 5, dy = (h(x, y + 1) - h(x, y - 1)) * 5;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * n + x) * 4;
      data[i] = ((-dx / l) * 0.5 + 0.5) * 255;
      data[i + 1] = ((-dy / l) * 0.5 + 0.5) * 255;
      data[i + 2] = (1 / l) * 255;
      data[i + 3] = 255;
    }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  normalPiso = t;
  return t;
}

// ------------------------------------------------------------------------------------------------- Llamas
/** Llamas de antorchas y velas: puntos con textura de fuego que titilan (una sola llamada). */
function llamasPuntos(pos: number[], tam: number[], fase: number[], tiempo: { value: number }): THREE.Points {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aTam', new THREE.Float32BufferAttribute(tam, 1));
  geo.setAttribute('aFase', new THREE.Float32BufferAttribute(fase, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: texturaFuego() }, uTiempo: tiempo, uEscala: ESCALA_PUNTOS },
    vertexShader: /* glsl */ `
      attribute float aTam;
      attribute float aFase;
      uniform float uTiempo;
      uniform float uEscala;
      varying float vF;
      void main() {
        vec4 mv = modelViewMatrix * vec4( position + vec3( 0.0, aTam * 0.25, 0.0 ), 1.0 );
        float t = uTiempo * 9.0 + aFase;
        vF = 0.82 + 0.12 * sin( t ) + 0.06 * sin( t * 2.3 );
        gl_PointSize = aTam * vF * uEscala / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      varying float vF;
      void main() {
        vec4 c = texture2D( uTex, vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ) );
        gl_FragColor = vec4( c.rgb * 2.2 * vF, c.a );
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  p.renderOrder = 5;
  return p;
}


function materialLiquido(lava: boolean, tiempo: { value: number }) {
  return new THREE.ShaderMaterial({
    uniforms: { uTiempo: tiempo },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
    fragmentShader: /* glsl */ `
      uniform float uTiempo;
      varying vec2 vP;
      float h( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
      float n( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
        return mix( mix( h( i ), h( i + vec2( 1, 0 ) ), f.x ), mix( h( i + vec2( 0, 1 ) ), h( i + vec2( 1, 1 ) ), f.x ), f.y ); }
      void main() {
        vec2 p = vP * 1.6;
        float a = n( p + vec2( uTiempo * 0.35, uTiempo * 0.2 ) ) * 0.6 + n( p * 2.3 - vec2( uTiempo * 0.25, 0.0 ) ) * 0.4;
        ${lava
          ? `vec3 c = mix( vec3( 0.25, 0.03, 0.0 ), vec3( 2.6, 0.75, 0.12 ), smoothstep( 0.35, 0.8, a ) );
             c += vec3( 3.0, 1.4, 0.3 ) * smoothstep( 0.78, 0.95, a );
             gl_FragColor = vec4( c, 1.0 );`
          : `vec3 c = mix( vec3( 0.01, 0.02, 0.025 ), vec3( 0.05, 0.08, 0.09 ), a );
             c += vec3( 0.25, 0.3, 0.32 ) * smoothstep( 0.86, 0.97, a );
             gl_FragColor = vec4( c, 0.92 );`}
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: !lava,
    depthWrite: lava,
  });
}
