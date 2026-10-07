// El escenario en 3D: el piso (textura del bioma + sombras de contacto al pie de las paredes), las paredes en trozos
// de 8 × 8 celdas con instancias (tiemblan y se encogen mientras las excavan, se rehacen al romperse), las antorchas
// y velas con sus llamas, la decoración, el agua negra, la lava y los rieles de la carreta. En calidad alta, además,
// el detalle: piedritas, huesos, hojas, velas, cadenas… regados con un azar fijo por celda (solo en la vista: no
// cambia nada del juego ni de lo que se sincroniza), juntados en una sola malla por trozo.
import * as THREE from 'three';
import { hash2 } from '../../casa/lavado/azar';
import type { DefBioma } from '../datos/mundo';
import { C, VIDA_CELDA, esSolida } from '../tipos';
import type { Mapa } from '../sim/mapa';
import { conLuz, type FuenteLuz } from './luz';
import { FUEGOS, type Biblioteca, type Detalle } from './modelos';
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
  /** El detalle de la calidad alta de este trozo (una malla, un grupo por clase de material). */
  detalle?: THREE.Mesh;
}

/** Vértices de una pieza de detalle por clase de material (0 mate, 1 metal, 2 lisa). */
interface ParteDetalle {
  pos: Float32Array;
  nor: Float32Array;
  col: Float32Array;
}
interface ModeloDetalle {
  lugar: Detalle['lugar'];
  peso: number;
  clases: (ParteDetalle | null)[];
}
const claseMaterial = (nombre: string) => (/^(hierro|oro)/.test(nombre) ? 1 : /^(cera|sangre|agua)/.test(nombre) ? 2 : 0);
/** Qué tan seguido sale cada cosa: en el piso abierto (una y a veces dos por celda), al pie y colgada de las paredes. */
const DENSIDAD = { suelo: 0.6, suelo2: 0.28, pie: 0.62, muro: 0.42 };

export class Mapa3D {
  grupo = new THREE.Group();
  private trozos: Trozo[] = [];
  private tw: number;
  private th: number;
  private copia: Uint8Array;
  private version = -1;
  private paredes: ModelosPared;
  /** Losas modeladas del bioma (2 × 2 m) con su peso, o vacío si se usa la textura. */
  private pisosM: { mod: ModeloFijo; peso: number }[] = [];
  private pesoPisos = 0;
  /** Paredes del GLB: no se giran ni cambian de alto (los techos encajan con los vecinos). */
  private modelado: boolean;
  private sombraAO: THREE.Mesh | null = null;
  /** Tapa plana para la roca de adentro (la que no toca ninguna celda abierta): solo se le ve el techo. */
  private tapa: { geo: THREE.BufferGeometry; mat: THREE.Material } | null = null;
  /** Las paredes hacen sombra (solo en calidad alta: es lo que más pesa). */
  sombraParedes = false;
  private piso!: THREE.Mesh;
  private ao!: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; img: ImageData; tex: THREE.CanvasTexture };
  private llamas!: THREE.Points;
  private tiempoLlamas = { value: 0 };
  private temblando = new Map<number, { malla: THREE.InstancedMesh; k: number; base: THREE.Matrix4 }>();
  fijas: FuenteLuz[] = [];
  /** Hay que rehacer la luz fija (se rompió una pared). */
  luzSucia = true;
  /** Detalle de la calidad alta (vacío si no se pidió): las piezas por lugar, sus materiales y dónde no va nada. */
  private dets: Record<Detalle['lugar'], ModeloDetalle[]> = { suelo: [], pie: [], muro: [] };
  private matsDetalle: THREE.Material[] = [];
  private sinDetalle = new Set<number>();
  private conAntorcha = new Set<number>();
  private verDetalle = true;

  constructor(private m: Mapa, private bioma: DefBioma, private bib: Biblioteca, private colorAntorcha: THREE.Color, pisoModelado = true, sombraParedes = false, detalle = false) {
    this.sombraParedes = sombraParedes;
    if (detalle) this.prepararDetalle(bib.detalles());
    this.tw = Math.ceil(m.w / TROZO);
    this.th = Math.ceil(m.h / TROZO);
    this.copia = m.c.slice();
    this.paredes = bib.paredes();
    if (!pisoModelado) {
      // Calidad baja: de cada pared, la variante más liviana
      const p = { ...this.paredes };
      const tri = (x: ModeloFijo) => (x.geo.index ? x.geo.index.count : x.geo.getAttribute('position').count);
      for (const k of Object.keys(p) as (keyof ModelosPared)[]) if (p[k].length > 1) p[k] = [p[k].reduce((a, b) => (tri(b) < tri(a) ? b : a))];
      this.paredes = p;
    }
    this.modelado = bib.escenarioModelado;
    if (this.modelado && pisoModelado) {
      this.pisosM = bib.pisos().map((mod) => ({ mod, peso: Number(mod.datos?.peso) || 1 }));
      this.pesoPisos = this.pisosM.reduce((a, b) => a + b.peso, 0);
    }
    this.hacerPiso(detalle);
    if (this.modelado) {
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 1.5, 0);
      // Del color del techo de las paredes modeladas (sus triángulos que miran arriba), para que empalmen
      const ref = this.paredes.dura[0] ?? this.paredes.blanda[0];
      const col = ref ? colorTecho(ref.geo) : null;
      const mat = new THREE.MeshStandardMaterial({ map: texturaTecho(), color: col ?? new THREE.Color(bioma.roca[1]), roughness: 1, metalness: 0 });
      this.tapa = { geo, mat: detalle ? conLuz(mat, bib.rocaParedes, 'roca') : conLuz(mat) };
    }
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
  private hacerPiso(alta = false) {
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
    if (this.pisosM.length) {
      // Con losas modeladas, el plano solo queda como sombra de contacto al pie de las paredes (encima de las losas).
      // En calidad alta también oscurece a manchas grandes (humedad, mugre) en el mundo: así no se nota que las losas
      // de 2 × 2 m se repiten.
      this.piso.visible = false;
      const sombra = new THREE.ShaderMaterial({
        uniforms: { uAO: { value: aoTex } },
        vertexShader: 'varying vec2 vUv; varying vec2 vP; void main(){ vUv = uv; vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: /* glsl */ `
          uniform sampler2D uAO;
          varying vec2 vUv;
          varying vec2 vP;
          float hs( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
          float vn( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
            return mix( mix( hs( i ), hs( i + vec2( 1, 0 ) ), f.x ), mix( hs( i + vec2( 0, 1 ) ), hs( i + vec2( 1, 1 ) ), f.x ), f.y ); }
          void main() {
            float a = 1.0 - texture2D( uAO, vec2( vUv.x, 1.0 - vUv.y ) ).g;
            a *= 0.85;
            ${alta ? `float m = vn( vP * 0.21 ) * 0.6 + vn( vP * 0.53 + 7.3 ) * 0.3 + vn( vP * 1.7 + 3.1 ) * 0.1;
            a = 1.0 - ( 1.0 - a ) * ( 1.0 - smoothstep( 0.42, 0.8, m ) * 0.38 );` : ''}
            gl_FragColor = vec4( 0.0, 0.0, 0.0, a );
          }`,
        transparent: true, depthWrite: false,
      });
      const g2 = geo.clone();
      g2.translate(0, 0.025, 0);
      this.sombraAO = new THREE.Mesh(g2, sombra);
      this.sombraAO.renderOrder = 1;
      this.grupo.add(this.sombraAO);
    }
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
    const tapas: number[] = [];
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
        // La roca de adentro (sin ninguna celda abierta alrededor) solo muestra el techo: una tapa plana
        if (this.tapa && tipo !== C.HUEVO && !this.tocaAbierta(cx, cy)) {
          tapas.push(i);
          continue;
        }
        lista(lst[v % lst.length]).push(i);
      }
    if (tapas.length && this.tapa) {
      const malla = new THREE.InstancedMesh(this.tapa.geo, this.tapa.mat, tapas.length);
      malla.receiveShadow = true;
      tapas.forEach((i, k) => {
        M.makeTranslation((i % m.w) + 0.5, 0, ((i / m.w) | 0) + 0.5);
        malla.setMatrixAt(k, M);
      });
      malla.instanceMatrix.needsUpdate = true;
      malla.computeBoundingSphere();
      t.grupo.add(malla);
      t.mallas.push(malla);
    }
    // Losas del piso (de a 2 × 2 celdas): solo donde alguna celda está abierta (las demás quedan bajo la roca)
    const losas = new Map<ModeloFijo, number[]>();
    if (this.pisosM.length) {
      for (let cy = t.cy * TROZO; cy < Math.min(m.h, (t.cy + 1) * TROZO); cy += 2)
        for (let cx = t.cx * TROZO; cx < Math.min(m.w, (t.cx + 1) * TROZO); cx += 2) {
          if (esSolida(m.get(cx, cy)) && esSolida(m.get(cx + 1, cy)) && esSolida(m.get(cx, cy + 1)) && esSolida(m.get(cx + 1, cy + 1))) continue;
          let r = hash2(cx, cy, 17) * this.pesoPisos;
          let mod = this.pisosM[0].mod;
          for (const x of this.pisosM) {
            r -= x.peso;
            if (r <= 0) {
              mod = x.mod;
              break;
            }
          }
          const l = losas.get(mod) ?? [];
          l.push(cx, cy);
          losas.set(mod, l);
        }
    }
    for (const [mod, celdas] of losas) {
      const malla = new THREE.InstancedMesh(mod.geo, mod.mats, celdas.length / 2);
      malla.receiveShadow = true;
      for (let k = 0; k < celdas.length; k += 2) {
        M.makeTranslation(celdas[k] + 1, 0, celdas[k + 1] + 1);
        malla.setMatrixAt(k / 2, M);
      }
      malla.instanceMatrix.needsUpdate = true;
      malla.computeBoundingSphere();
      t.grupo.add(malla);
      t.mallas.push(malla);
    }
    for (const [mod, celdas] of porModelo) {
      const malla = new THREE.InstancedMesh(mod.geo, mod.mats, celdas.length);
      malla.castShadow = this.sombraParedes || !this.modelado;
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
    this.construirDetalle(t);
    t.sucio = false;
  }

  // ----------------------------------------------------------------------------------------------- Detalle (alta)
  private prepararDetalle(lista: Detalle[]) {
    if (!lista.length) return;
    const crear = (rugosidad: number, metal: number) =>
      conLuz(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rugosidad, metalness: metal }));
    this.matsDetalle = [crear(0.92, 0), crear(0.42, 0.7), crear(0.32, 0)];
    for (const d of lista) {
      const g = d.mod.geo;
      const p = g.getAttribute('position'), n = g.getAttribute('normal'), c = g.getAttribute('color');
      const grupos = g.groups.length ? g.groups : [{ start: 0, count: p.count, materialIndex: 0 }];
      const rangos: [number, number][][] = [[], [], []];
      for (const gr of grupos) rangos[claseMaterial(d.mod.mats[gr.materialIndex ?? 0]?.name ?? '')].push([gr.start, gr.count]);
      const clases = rangos.map((r) => {
        const total = r.reduce((a, [, k]) => a + k, 0);
        if (!total) return null;
        const parte: ParteDetalle = { pos: new Float32Array(total * 3), nor: new Float32Array(total * 3), col: new Float32Array(total * 3).fill(1) };
        let o = 0;
        for (const [ini, k] of r)
          for (let i = ini; i < ini + k; i++, o += 3) {
            parte.pos[o] = p.getX(i); parte.pos[o + 1] = p.getY(i); parte.pos[o + 2] = p.getZ(i);
            parte.nor[o] = n.getX(i); parte.nor[o + 1] = n.getY(i); parte.nor[o + 2] = n.getZ(i);
            if (c) (parte.col[o] = c.getX(i), parte.col[o + 1] = c.getY(i), parte.col[o + 2] = c.getZ(i));
          }
        return parte;
      });
      this.dets[d.lugar].push({ lugar: d.lugar, peso: d.peso, clases });
    }
    // Donde ya hay algo del juego (decoración, rieles, velas de piso) no se riega nada
    const { m } = this;
    for (const d of m.deco) this.sinDetalle.add(Math.floor(d.y) * m.w + Math.floor(d.x));
    for (const r of m.rieles) this.sinDetalle.add(Math.floor(r.y) * m.w + Math.floor(r.x));
    for (const a of m.antorchas) {
      if (a.vela) this.sinDetalle.add(a.cy * m.w + a.cx);
      else if (a.dx === 0 && a.dy === 1) this.conAntorcha.add(a.cy * m.w + a.cx);
    }
  }

  private escoger(lista: ModeloDetalle[], r: number) {
    let total = 0;
    for (const d of lista) total += d.peso;
    r *= total;
    for (const d of lista) if ((r -= d.peso) <= 0) return d;
    return lista[lista.length - 1];
  }

  /** Riega el detalle del trozo (con un azar fijo por celda: sale igual cada vez que se rehace). */
  private construirDetalle(t: Trozo) {
    if (t.detalle) {
      t.grupo.remove(t.detalle);
      t.detalle.geometry.dispose();
      t.detalle = undefined;
    }
    if (!this.matsDetalle.length) return;
    const { m } = this;
    const pon: [ModeloDetalle, number, number, number, number][] = [];
    const abierta = (c: number) => !esSolida(c) && c !== C.AGUA;
    const pared = (c: number) => c === C.BLANDA || c === C.DURA || c === C.BORDE || c === C.ESCOMBRO;
    const { suelo, pie, muro } = this.dets;
    for (let cy = t.cy * TROZO; cy < Math.min(m.h, (t.cy + 1) * TROZO); cy++)
      for (let cx = t.cx * TROZO; cx < Math.min(m.w, (t.cx + 1) * TROZO); cx++) {
        const i = cy * m.w + cx;
        const c = m.c[i];
        if (abierta(c)) {
          if (this.sinDetalle.has(i)) continue;
          // En el piso: una cosita (y a veces otra) en un punto al azar de la celda
          if (suelo.length)
            for (const [k, dens] of [[0, DENSIDAD.suelo], [1, DENSIDAD.suelo2]] as const) {
              if (hash2(cx, cy, 101 + k) >= dens) continue;
              pon.push([this.escoger(suelo, hash2(cx, cy, 111 + k)), cx + 0.2 + 0.6 * hash2(cx, cy, 121 + k), cy + 0.2 + 0.6 * hash2(cx, cy, 131 + k),
                hash2(cx, cy, 141 + k) * Math.PI * 2, 0.85 + 0.3 * hash2(cx, cy, 151 + k)]);
            }
          // Al pie de las paredes de atrás y de los lados (de frente a lo abierto)
          if (pie.length)
            for (const [dx, dy, rot, k] of [[0, -1, 0, 0], [-1, 0, Math.PI / 2, 1], [1, 0, -Math.PI / 2, 2]] as const) {
              if (!pared(m.get(cx + dx, cy + dy)) || hash2(cx, cy, 201 + k) >= DENSIDAD.pie) continue;
              const a = (hash2(cx, cy, 211 + k) - 0.5) * 0.36;
              const x = dx ? cx + (dx < 0 ? 0 : 1) : cx + 0.5 + a;
              const y = dy ? cy : cy + 0.5 + a;
              pon.push([this.escoger(pie, hash2(cx, cy, 221 + k)), x, y, rot + (hash2(cx, cy, 231 + k) - 0.5) * 0.3, 0.85 + 0.3 * hash2(cx, cy, 241 + k)]);
            }
        } else if (muro.length && (c === C.BLANDA || c === C.DURA || c === C.BORDE) && abierta(m.get(cx, cy + 1)) && !this.conAntorcha.has(i)) {
          // Colgada en la cara de la pared que ve la cámara
          if (hash2(cx, cy, 301) >= DENSIDAD.muro) continue;
          pon.push([this.escoger(muro, hash2(cx, cy, 311)), cx + 0.5 + (hash2(cx, cy, 321) - 0.5) * 0.4, cy + 1, 0, 0.9 + 0.2 * hash2(cx, cy, 331)]);
        }
      }
    if (!pon.length) return;
    const tot = [0, 0, 0];
    for (const [d] of pon) for (let k = 0; k < 3; k++) tot[k] += d.clases[k]?.pos.length ?? 0;
    const suma = tot[0] + tot[1] + tot[2];
    const pos = new Float32Array(suma), nor = new Float32Array(suma), col = new Float32Array(suma);
    const off = [0, tot[0], tot[0] + tot[1]];
    for (const [d, x, y, rot, esc] of pon) {
      const co = Math.cos(rot), si = Math.sin(rot);
      for (let k = 0; k < 3; k++) {
        const pa = d.clases[k];
        if (!pa) continue;
        let o = off[k];
        const P = pa.pos, N = pa.nor;
        for (let j = 0; j < P.length; j += 3, o += 3) {
          const px = P[j], pz = P[j + 2], nx = N[j], nz = N[j + 2];
          pos[o] = (px * co + pz * si) * esc + x;
          pos[o + 1] = P[j + 1] * esc;
          pos[o + 2] = (-px * si + pz * co) * esc + y;
          nor[o] = nx * co + nz * si;
          nor[o + 1] = N[j + 1];
          nor[o + 2] = -nx * si + nz * co;
        }
        col.set(pa.col, off[k]);
        off[k] = o;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    let ini = 0;
    for (let k = 0; k < 3; k++) {
      if (tot[k]) geo.addGroup(ini / 3, tot[k] / 3, k);
      ini += tot[k];
    }
    geo.computeBoundingSphere();
    const malla = new THREE.Mesh(geo, this.matsDetalle);
    malla.receiveShadow = true;
    malla.visible = this.verDetalle;
    t.grupo.add(malla);
    t.detalle = malla;
  }

  /** Prende o apaga el detalle (si la calidad baja sola en plena etapa). */
  mostrarDetalle(v: boolean) {
    this.verDetalle = v;
    for (const t of this.trozos) if (t.detalle) t.detalle.visible = v;
  }

  /**
   * ¿Se le ve algún costado a esta pared? La cámara mira desde el sur y desde arriba: se ven la cara de abajo (+y) y
   * las de los lados (también si lo abierto está en diagonal hacia abajo); la de atrás (−y) nunca. Si no, basta el techo.
   */
  private tocaAbierta(cx: number, cy: number) {
    const ab = (dx: number, dy: number) => !esSolida(this.m.get(cx + dx, cy + dy));
    return ab(0, 1) || ab(1, 0) || ab(-1, 0) || ab(1, 1) || ab(-1, 1);
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
    const fijaGLB = this.modelado && t !== C.HUEVO && t !== C.ESCOMBRO;
    let rot = fijaGLB ? 0 : (v % 4) * (Math.PI / 2);
    if (!fijaGLB && (t === C.HIERRO || t === C.SANGRE || t === C.ORO || t === C.HUEVO)) {
      // Que los cristales miren a lo abierto (prefiere abajo, hacia la cámara)
      const dirs: [number, number][] = [[0, 1], [1, 0], [-1, 0], [0, -1]];
      const d = dirs.find(([dx, dy]) => !esSolida(m.get(cx + dx, cy + dy)));
      if (d) rot = Math.atan2(d[0], d[1]) + Math.PI;
    }
    const alto = t === C.BORDE || fijaGLB ? 1 : 0.92 + (v / 255) * 0.2;
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
      const items: { x: number; y: number; m: THREE.Matrix4 }[] = [];
      deAntorcha.forEach((a) => {
        // En la cara de la pared que mira a lo abierto
        const rot = Math.atan2(a.dx, a.dy) + Math.PI;
        Q.setFromAxisAngle(Y, rot);
        P.set(a.cx + 0.5 + a.dx * 0.5, 0, a.cy + 0.5 + a.dy * 0.5);
        S.setScalar(1);
        M.compose(P, Q, S);
        items.push({ x: P.x, y: P.z, m: M.clone() });
        const ll = llamaLocal.clone().applyQuaternion(Q).add(P);
        puntos.push(ll.x, ll.y, ll.z);
        tam.push(0.55);
        fase.push(hash2(a.cx, a.cy, 9) * 10);
        this.fijas.push({ x: ll.x + a.dx * 0.6, y: ll.z + a.dy * 0.6, r: 7.5, color: this.colorAntorcha, fuerza: 1.15 });
      });
      this.porTrozos(ant, items, false);
    }
    if (deVela.length) {
      const items: { x: number; y: number; m: THREE.Matrix4 }[] = [];
      deVela.forEach((a) => {
        const rot = hash2(a.cx, a.cy, 3) * Math.PI * 2;
        Q.setFromAxisAngle(Y, rot);
        P.set(a.cx + 0.5, 0, a.cy + 0.5);
        S.setScalar(1);
        M.compose(P, Q, S);
        items.push({ x: P.x, y: P.z, m: M.clone() });
        const llamasV = vel.llamas?.length ? vel.llamas : LLAMAS_VELAS.map(([x, z, h]) => new THREE.Vector3(x, h + 0.04, z));
        for (const l0 of llamasV) {
          const x = l0.x;
          const ll = l0.clone().applyQuaternion(Q).add(P);
          puntos.push(ll.x, ll.y, ll.z);
          tam.push(0.16);
          fase.push(hash2(a.cx * 7 + x * 10, a.cy, 9) * 10);
        }
        this.fijas.push({ x: a.cx + 0.5, y: a.cy + 0.5, r: 4, color: this.colorAntorcha, fuerza: 0.65 });
      });
      this.porTrozos(vel, items, false);
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
    const tam: number[] = [];
    const fase: number[] = [];
    for (const [tipo, lista] of porTipo) {
      const mod = this.bib.fijo('deco', tipo);
      const items: { x: number; y: number; m: THREE.Matrix4 }[] = [];
      lista.forEach((d) => {
        Q.setFromAxisAngle(Y, d.rot);
        P.set(d.x, 0, d.y);
        S.setScalar(d.esc);
        M.compose(P, Q, S);
        items.push({ x: d.x, y: d.y, m: M.clone() });
        const luzG = mod.datos?.luz as { color: string; intensidad: number; alcance: number; particulas?: string } | undefined;
        const luz = DECO_LUZ[tipo];
        if (luzG) this.fijas.push({ x: d.x, y: d.y, r: luzG.alcance, color: new THREE.Color(luzG.color), fuerza: Math.min(1.3, luzG.intensidad * 0.9) });
        else if (luz) this.fijas.push({ x: d.x, y: d.y, r: luz[2], color: new THREE.Color(luz[0]), fuerza: luz[1] });
        if (luzG?.particulas === 'fuego' && mod.llamas)
          for (const l0 of mod.llamas) {
            const ll = l0.clone().multiplyScalar(d.esc).applyQuaternion(Q).add(P);
            llamas.push(ll.x, ll.y, ll.z);
            tam.push(l0.y > 0.8 ? 0.4 : 0.16);
            fase.push(hash2(d.x * 13, d.y * 7, 5) * 10);
          }
      });
      this.porTrozos(mod, items, this.sombraParedes);
    }
    if (llamas.length) this.grupo.add(llamasPuntos(llamas, tam, fase, this.tiempoLlamas));
  }

  /** Instancias agrupadas por trozo del mapa (así la cámara descarta las que no ve). */
  private porTrozos(mod: ModeloFijo, items: { x: number; y: number; m: THREE.Matrix4 }[], sombra: boolean) {
    const grupos = new Map<number, THREE.Matrix4[]>();
    for (const it of items) {
      const k = Math.floor(it.y / TROZO) * 1000 + Math.floor(it.x / TROZO);
      const l = grupos.get(k) ?? [];
      l.push(it.m);
      grupos.set(k, l);
    }
    for (const l of grupos.values()) {
      const malla = new THREE.InstancedMesh(mod.geo, mod.mats, l.length);
      l.forEach((m, k) => malla.setMatrixAt(k, m));
      malla.castShadow = sombra;
      malla.receiveShadow = true;
      malla.instanceMatrix.needsUpdate = true;
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
    // Las llamas modeladas titilan todas juntas (el material «fuego» de los GLB)
    const f = 0.82 + Math.sin(t * 11.3) * 0.1 + Math.sin(t * 23.7 + 1.3) * 0.07;
    for (const m of FUEGOS) m.emissiveIntensity = (m.userData.emisionBase ?? 1) * f;
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
    for (const t of this.trozos) t.detalle?.geometry.dispose();
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
/** Color medio de lo que mira hacia arriba en una geometría con color en los vértices (el techo de una pared). */
function colorTecho(g: THREE.BufferGeometry): THREE.Color | null {
  const c = g.getAttribute('color'), n = g.getAttribute('normal'), p = g.getAttribute('position');
  if (!c || !n || !p) return null;
  let r = 0, gg = 0, b = 0, k = 0;
  for (let i = 0; i < c.count; i++) {
    if (n.getY(i) < 0.8 || p.getY(i) < 1.2) continue;
    r += c.getX(i);
    gg += c.getY(i);
    b += c.getZ(i);
    k++;
  }
  return k ? new THREE.Color(r / k, gg / k, b / k).multiplyScalar(0.9) : null;
}

/** El techo de la roca maciza: piedra gris con grietas (se tiñe con el color del techo de las paredes). */
let techo: THREE.CanvasTexture | null = null;
function texturaTecho(): THREE.CanvasTexture {
  if (techo) return techo;
  const n = 128;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  g.fillStyle = '#d8d8d8';
  g.fillRect(0, 0, n, n);
  let sd = 7;
  const az = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 40; k++) {
    g.fillStyle = az() < 0.5 ? '#ffffff' : '#9a9a9a';
    g.globalAlpha = 0.2 + az() * 0.25;
    const x = az() * n, y = az() * n, r = 6 + az() * 18;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.5 + az() * 0.5), az() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 0.45;
  g.strokeStyle = '#3a3a3a';
  g.lineWidth = 1.5;
  for (let k = 0; k < 6; k++) {
    g.beginPath();
    let x = az() * n, y = az() * n;
    g.moveTo(x, y);
    for (let s2 = 0; s2 < 4; s2++) g.lineTo((x += (az() - 0.5) * 40), (y += (az() - 0.5) * 40));
    g.stroke();
  }
  g.globalAlpha = 1;
  techo = new THREE.CanvasTexture(c);
  techo.colorSpace = THREE.SRGBColorSpace;
  techo.wrapS = techo.wrapT = THREE.RepeatWrapping;
  return techo;
}

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
