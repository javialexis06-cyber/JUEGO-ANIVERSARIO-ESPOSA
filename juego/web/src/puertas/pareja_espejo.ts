// El espejo del cuarto en pareja. Los dos celulares arman la misma puerta igualita (el mismo montaje, el mismo
// desorden), así que basta con mandar lo que cambia: el anfitrión mira cada cosa del acertijo, del desorden y lo
// pegado a la puerta (posición, giro, tamaño y si se ve), los colores de los materiales propios, las luces, las
// texturas pintadas y el inventario, y el invitado lo aplica suavecito (sin quitarle de la mano lo que está
// arrastrando). Cada tanto va una foto completa de todo lo que ha cambiado, por si se perdió algún paquete.
import * as THREE from 'three';
import { compartido } from './kit';

/** Foto del cuarto: objetos [i, px, py, pz, qx, qy, qz, qw, sx, sy, sz, visible, papá], materiales [i, color, emisivo,
 *  intensidad, opacidad, visible], luces [i, intensidad]. */
export interface FotoCuarto {
  n: number;
  o: number[][];
  m?: number[][];
  l?: number[][];
  luz?: number;
  inv?: string[];
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

export class Espejo {
  readonly objs: THREE.Object3D[] = [];
  /** Índice de cada objeto (para saber de quién es hijo: hay acertijos que pasan una cosa de un papá a otro, como la
   *  llave que el caracol suelta en la piedra). */
  private indice = new Map<THREE.Object3D, number>();
  private ultimos: (number[] | null)[] = [];
  /** Cuándo cambió cada cosa por última vez (se repite un ratico por si se pierde un paquete). */
  private cambio: number[] = [];
  /** Lo que ha cambiado alguna vez (va en las fotos completas). */
  private tocados = new Set<number>();
  private mats: THREE.Material[] = [];
  private matUlt: (string | null)[] = [];
  private matTocados = new Set<number>();
  private luces: THREE.Light[] = [];
  private lucUlt: number[] = [];
  readonly texturas: THREE.CanvasTexture[] = [];
  private texVer: number[] = [];
  private texCuando: number[] = [];
  private completa = 0;
  private otrosUlt = '';
  // Del lado del invitado
  private metas = new Map<number, { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3; nuevo: boolean }>();

  constructor(
    public n: number,
    raices: THREE.Object3D[],
  ) {
    const mats = new Set<THREE.Material>();
    const texs = new Set<THREE.CanvasTexture>();
    for (const r of raices)
      r.traverse((o) => {
        this.objs.push(o);
        const m = o as THREE.Mesh;
        if (m.isMesh)
          for (const mt of Array.isArray(m.material) ? m.material : [m.material]) {
            // (lo que es solo adorno y se anima en cada celular por su cuenta no viaja)
            if (!mt || compartido(mt) || mt.userData.soloAqui) continue;
            mats.add(mt);
            const ms = mt as THREE.MeshStandardMaterial;
            for (const t of [ms.map, ms.emissiveMap]) if ((t as THREE.CanvasTexture | null)?.isCanvasTexture) texs.add(t as THREE.CanvasTexture);
          }
        if ((o as THREE.Light).isLight) this.luces.push(o as THREE.Light);
      });
    this.mats = [...mats];
    this.texturas.push(...texs);
    this.objs.forEach((o, i) => this.indice.set(o, i));
    this.ultimos = this.objs.map((o) => this.estado(o));
    this.cambio = this.objs.map(() => -1e9);
    this.matUlt = this.mats.map((m) => this.firma(m));
    this.lucUlt = this.luces.map((l) => l.intensity);
    this.texVer = this.texturas.map((t) => t.version);
    this.texCuando = this.texturas.map(() => 0);
  }

  private estado(o: THREE.Object3D) {
    const p = o.position, q = o.quaternion, s = o.scale;
    const padre = o.parent ? this.indice.get(o.parent) ?? -1 : -2;
    return [r3(p.x), r3(p.y), r3(p.z), r4(q.x), r4(q.y), r4(q.z), r4(q.w), r3(s.x), r3(s.y), r3(s.z), o.visible ? 1 : 0, padre];
  }

  private firma(m: THREE.Material) {
    const s = m as THREE.MeshStandardMaterial;
    return [s.color?.getHex() ?? 0, s.emissive?.getHex() ?? 0, r3(s.emissiveIntensity ?? 0), r3(m.opacity), m.visible ? 1 : 0].join(',');
  }

  // --- Anfitrión ---------------------------------------------------------------
  /** Lo que cambió (y lo que cambió hace poquito, por si se perdió); completa: todo lo que ha cambiado alguna vez. */
  capturar(extra: { luz: number; inv: string[] }, completa = false): FotoCuarto | null {
    const ahora = performance.now();
    if (!completa && ahora - this.completa > 1500) completa = true;
    if (completa) this.completa = ahora;
    const o: number[][] = [];
    for (let i = 0; i < this.objs.length; i++) {
      const e = this.estado(this.objs[i]);
      const u = this.ultimos[i];
      let distinto = !u;
      if (u) for (let k = 0; k < 12 && !distinto; k++) distinto = u[k] !== e[k];
      if (distinto) {
        this.ultimos[i] = e;
        this.cambio[i] = ahora;
        this.tocados.add(i);
      }
      if (distinto || ahora - this.cambio[i] < 600 || (completa && this.tocados.has(i))) o.push([i, ...e]);
    }
    const m: number[][] = [];
    for (let i = 0; i < this.mats.length; i++) {
      const f = this.firma(this.mats[i]);
      if (f !== this.matUlt[i]) {
        this.matUlt[i] = f;
        this.matTocados.add(i);
        m.push([i, ...f.split(',').map(Number)]);
      } else if (completa && this.matTocados.has(i)) m.push([i, ...f.split(',').map(Number)]);
    }
    const l: number[][] = [];
    for (let i = 0; i < this.luces.length; i++) {
      const v = r3(this.luces[i].intensity);
      if (v !== this.lucUlt[i] || completa) {
        this.lucUlt[i] = v;
        l.push([i, v]);
      }
    }
    const otros = `${r3(extra.luz)}|${extra.inv.join(',')}`;
    const cambiaron = otros !== this.otrosUlt;
    this.otrosUlt = otros;
    if (!o.length && !m.length && !l.length && !cambiaron && !completa) return null;
    return { n: this.n, o, ...(m.length ? { m } : {}), ...(l.length ? { l } : {}), luz: r3(extra.luz), inv: extra.inv };
  }

  /** Texturas pintadas que cambiaron (como imagen), sin mandar la misma más de dos veces por segundo. */
  texturasNuevas(): [number, string][] {
    const ahora = performance.now();
    const out: [number, string][] = [];
    this.texturas.forEach((t, i) => {
      if (t.version === this.texVer[i] || ahora - this.texCuando[i] < 500) return;
      const img = t.image as HTMLCanvasElement | undefined;
      if (!img?.toDataURL) return;
      this.texVer[i] = t.version;
      this.texCuando[i] = ahora;
      let url = img.toDataURL('image/webp', 0.8);
      if (!url.startsWith('data:image/webp')) url = img.toDataURL('image/png');
      out.push([i, url]);
    });
    return out;
  }

  // --- Invitado ----------------------------------------------------------------
  aplicar(f: FotoCuarto, materialesExtra?: (i: number, m: THREE.Material) => void) {
    for (const e of f.o) {
      const o = this.objs[e[0]];
      if (!o) continue;
      o.visible = e[11] === 1;
      // Cambió de papá allá: aquí también (la posición que llega es la de su nuevo papá)
      const padre = e[12];
      if (padre !== undefined && padre >= 0 && this.objs[padre] && o.parent !== this.objs[padre]) {
        this.objs[padre].add(o);
        this.metas.delete(e[0]);
        o.position.set(e[1], e[2], e[3]);
      }
      const meta = this.metas.get(e[0]);
      const p = new THREE.Vector3(e[1], e[2], e[3]), q = new THREE.Quaternion(e[4], e[5], e[6], e[7]), s = new THREE.Vector3(e[8], e[9], e[10]);
      if (meta) {
        meta.p.copy(p);
        meta.q.copy(q);
        meta.s.copy(s);
      } else this.metas.set(e[0], { p, q, s, nuevo: o.position.distanceTo(p) > 1.2 });
    }
    for (const e of f.m ?? []) {
      const m = this.mats[e[0]] as THREE.MeshStandardMaterial | undefined;
      if (!m) continue;
      m.color?.setHex(e[1]);
      m.emissive?.setHex(e[2]);
      if (m.emissiveIntensity !== undefined) m.emissiveIntensity = e[3];
      m.opacity = e[4];
      m.visible = e[5] === 1;
      materialesExtra?.(e[0], m);
    }
    for (const [i, v] of f.l ?? []) if (this.luces[i]) this.luces[i].intensity = v;
  }

  /** Cada cuadro, lo que el anfitrión movió se acerca suavecito a donde está allá. */
  cuadro(dt: number, enMano: (o: THREE.Object3D) => boolean) {
    if (!this.metas.size) return;
    const k = 1 - Math.exp(-dt * 14);
    for (const [i, m] of this.metas) {
      const o = this.objs[i];
      if (enMano(o)) continue;
      if (m.nuevo || o.position.distanceTo(m.p) > 1.5) {
        o.position.copy(m.p);
        o.quaternion.copy(m.q);
        o.scale.copy(m.s);
        m.nuevo = false;
      } else {
        o.position.lerp(m.p, k);
        o.quaternion.slerp(m.q, k);
        o.scale.lerp(m.s, k);
      }
      if (o.position.distanceToSquared(m.p) < 1e-8 && Math.abs(o.quaternion.dot(m.q)) > 0.999999 && o.scale.distanceToSquared(m.s) < 1e-8) {
        o.position.copy(m.p);
        o.quaternion.copy(m.q);
        o.scale.copy(m.s);
        this.metas.delete(i);
      }
    }
  }

  /** Pinta una textura que llegó del otro celular. */
  ponerTextura(i: number, url: string) {
    const t = this.texturas[i];
    const cv = t?.image as HTMLCanvasElement | undefined;
    if (!cv?.getContext) return;
    const img = new Image();
    img.onload = () => {
      const c = cv.getContext('2d');
      if (!c) return;
      c.clearRect(0, 0, cv.width, cv.height);
      c.drawImage(img, 0, 0, cv.width, cv.height);
      t.needsUpdate = true;
    };
    img.src = url;
  }

  /** Huella del estado (pruebas: al final los dos celulares tienen que tener lo mismo). */
  huella() {
    const o = this.objs.map((x) => {
      const e = this.estado(x);
      return [Math.round(e[0] * 50), Math.round(e[1] * 50), Math.round(e[2] * 50), e[10], e[11]].join(',');
    });
    const m = this.mats.map((x) => this.firma(x));
    return { objetos: o.length, o: o.join(';'), m: m.join(';') };
  }
}
