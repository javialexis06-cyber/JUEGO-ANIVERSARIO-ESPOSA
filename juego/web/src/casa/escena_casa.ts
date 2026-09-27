// La casa en 3D: un cuarto a la vista (sala, cocina, baño o cuarto), la decoración puesta en sus sitios,
// las notas pegadas en la nevera y los marcadores de «aquí se puede decorar».
import * as THREE from 'three';
import { aTres, Mundo } from '../mundo';
import { cargar, cargarJSON, copia, Productos } from '../recursos';
import { ITEM, TipoSitio } from './catalogo';
import { colorSeguro, Cuarto, Nota, Recuerdo } from './modelo';

export interface Punto {
  x: number;
  y: number;
  rot: number;
}
export interface Sitio {
  id: string;
  tipo: TipoSitio;
  x: number;
  y: number;
  z: number;
  rot: number;
}
export interface CasaDato {
  W: number;
  D: number;
  alto: number;
  escala_personas: number;
  cuartos: Record<Cuarto, { nombre: string; puntos: Record<string, Punto>; sitios: Sitio[] }>;
  notas: { cuarto: Cuarto; x: number; y: number; z: number; ancho: number; alto: number };
}

export type Toque =
  | { tipo: 'sitio'; sitio: Sitio }
  | { tipo: 'nevera' }
  | { tipo: 'regalo' }
  | { tipo: 'suelo'; x: number; y: number }
  | null;

const COLORES_NOTA = ['#FFE58A', '#FFC4D6', '#BFE9D8', '#CFE3FF', '#FFD7B0'];

/** Modelo 3D de un objeto del catálogo (o de la utilería del súper, como la planta y los globos). */
export async function modeloItem(id: string): Promise<THREE.Object3D | null> {
  const it = ITEM[id];
  if (!it?.modelo) return null;
  return copia(await cargar(`${it.modelo}.glb`));
}

export class Casa3D {
  grupo = new THREE.Group();
  actual: Cuarto = 'sala';
  private cuartos = new Map<Cuarto, THREE.Group>();
  /** El modelo de cada cuarto (paredes, piso y muebles): solo contra esto se buscan los toques. */
  private bases = new Map<Cuarto, THREE.Object3D>();
  private colaDeco: Promise<void> = Promise.resolve();
  private claveNotas = '';
  private cuartoRegalo: Cuarto | null = null;
  private cargaRegalo: Promise<THREE.Object3D> | null = null;
  private decos = new Map<string, { clave: string; obj: THREE.Object3D }>();
  private marcadores = new Map<string, THREE.Mesh>();
  private notas = new THREE.Group();
  private regaloCaja: THREE.Object3D | null = null;
  private rayo = new THREE.Raycaster();
  private fotos = new Map<string, THREE.Texture>();

  private constructor(private mundo: Mundo, public dato: CasaDato) {
    mundo.escena.add(this.grupo);
  }

  static async cargar(mundo: Mundo, productos: Productos, progreso?: (k: number) => void): Promise<Casa3D> {
    const dato = await cargarJSON<CasaDato>('casa.json');
    const c = new Casa3D(mundo, dato);
    const claves = Object.keys(dato.cuartos) as Cuarto[];
    let hechos = 0;
    await Promise.all(
      claves.map(async (k) => {
        const base = copia(await cargar(`casa_${k}.glb`));
        // El frutero y demás: marcas que se llenan con productos del súper
        base.traverse((o) => {
          if (o.userData?.producto) {
            const pr = productos.crear(o.userData.producto);
            if (pr) o.add(pr);
          }
        });
        const g = new THREE.Group();
        g.add(base);
        c.bases.set(k, base);
        g.visible = k === c.actual;
        c.cuartos.set(k, g);
        c.grupo.add(g);
        progreso?.(++hechos / claves.length);
      }),
    );
    c.cuartos.get(dato.notas.cuarto)!.add(c.notas);
    for (const k of claves) {
      for (const s of dato.cuartos[k].sitios) {
        const m = marcador(s);
        m.visible = false;
        c.marcadores.set(s.id, m);
        c.cuartos.get(k)!.add(m);
      }
    }
    mundo.encuadrar(dato.W, dato.D);
    return c;
  }

  mostrar(c: Cuarto) {
    this.actual = c;
    for (const [k, g] of this.cuartos) g.visible = k === c;
    this.mundo.sucio = true;
  }

  cuarto(c: Cuarto) {
    return this.cuartos.get(c)!;
  }

  puntos(c: Cuarto) {
    return this.dato.cuartos[c].puntos;
  }

  sitioDe(id: string): { cuarto: Cuarto; sitio: Sitio } | null {
    for (const [k, v] of Object.entries(this.dato.cuartos) as [Cuarto, CasaDato['cuartos'][Cuarto]][]) {
      const s = v.sitios.find((x) => x.id === id);
      if (s) return { cuarto: k, sitio: s };
    }
    return null;
  }

  /** Pone, cambia o quita la decoración según el estado compartido. «cuadro_foto:<id>» lleva una foto del álbum.
   *  Los cambios van en fila: dos llamadas seguidas (el otro decoró al mismo tiempo) no dejan objetos repetidos. */
  ponerDeco(deco: Record<string, string>, recuerdos: Recuerdo[]) {
    const copiaDeco = { ...deco };
    this.colaDeco = this.colaDeco.then(() => this.aplicarDeco(copiaDeco, recuerdos)).catch((e) => console.error(e));
    return this.colaDeco;
  }

  private async aplicarDeco(deco: Record<string, string>, recuerdos: Recuerdo[]) {
    for (const [id, actual] of [...this.decos]) {
      if (deco[id] !== actual.clave) {
        actual.obj.removeFromParent();
        liberarFoto(actual.obj);
        this.decos.delete(id);
      }
    }
    for (const [id, clave] of Object.entries(deco)) {
      if (this.decos.has(id)) continue;
      const donde = this.sitioDe(id);
      if (!donde) continue;
      const [item, foto] = clave.split(':');
      const obj = await modeloItem(item);
      if (!obj) continue;
      const s = donde.sitio;
      obj.position.copy(aTres(s.x, s.y, s.z));
      obj.rotation.y = THREE.MathUtils.degToRad(s.rot);
      if (foto) await this.ponerFoto(obj, recuerdos.find((r) => r.id === foto));
      this.cuartos.get(donde.cuarto)!.add(obj);
      this.decos.set(id, { clave, obj });
    }
    this.mundo.sucio = true;
  }

  private async ponerFoto(marco: THREE.Object3D, r: Recuerdo | undefined) {
    if (!r?.foto) return;
    let tex = this.fotos.get(r.id);
    if (!tex) {
      const cargador = new THREE.TextureLoader();
      cargador.setCrossOrigin('anonymous');
      try {
        tex = await cargador.loadAsync(r.foto);
      } catch {
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      this.fotos.set(r.id, tex);
    }
    marco.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !/^foto/.test(m.name)) return;
      // Recorte tipo «cubrir»: la foto llena el marco sin deformarse
      const img = tex!.image as { width: number; height: number };
      const caja = new THREE.Box3().setFromObject(m);
      const tam = caja.getSize(new THREE.Vector3());
      const marcoA = Math.max(tam.x, tam.z) / Math.max(tam.y, 1e-3);
      const fotoA = img.width / img.height;
      const t = tex!.clone();
      t.needsUpdate = true;
      if (fotoA > marcoA) {
        t.repeat.set(marcoA / fotoA, 1);
        t.offset.set((1 - marcoA / fotoA) / 2, 0);
      } else {
        t.repeat.set(1, fotoA / marcoA);
        t.offset.set(0, (1 - fotoA / marcoA) / 2);
      }
      m.material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 });
      m.userData.fotoPropia = true;
    });
  }

  /** Notas de colores pegadas en la puerta de la nevera (hasta 6 visibles). */
  pintarNotas(notas: Nota[]) {
    const vis = notas.slice(-6);
    const clave = vis.map((n) => `${n.id}${n.color}`).join('|');
    if (clave === this.claveNotas) return;
    this.claveNotas = clave;
    for (const hijo of [...this.notas.children]) {
      hijo.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) (m.material as THREE.Material).dispose();
      });
    }
    this.notas.clear();
    const n = this.dato.notas;
    vis.forEach((nota, i) => {
      const col = i % 2, fila = Math.floor(i / 2);
      const mat = new THREE.MeshStandardMaterial({ color: colorSeguro(nota.color, COLORES_NOTA[i % COLORES_NOTA.length]), roughness: 0.8, side: THREE.DoubleSide });
      const p = new THREE.Mesh(GEO_NOTA, mat);
      p.position.copy(aTres(n.x - 0.16 + col * 0.32, n.y - 0.012, n.z + 0.32 - fila * 0.3));
      p.rotation.z = (i % 3 - 1) * 0.12;
      p.castShadow = false;
      // Imán de colores arriba de cada nota
      const iman = new THREE.Mesh(GEO_IMAN, new THREE.MeshStandardMaterial({ color: '#E4566B', roughness: 0.3 }));
      iman.position.set(0, 0.105, 0.015);
      p.add(iman);
      this.notas.add(p);
    });
    this.mundo.sucio = true;
  }

  /** Cajita de regalo sin abrir junto a quien la recibe (una sola; si cambia de cuarto, la cajita lo sigue). */
  async mostrarRegalo(cuarto: Cuarto | null, x = 0, y = 0) {
    if (!cuarto) {
      this.cuartoRegalo = null;
      this.regaloCaja?.removeFromParent();
      this.mundo.sucio = true;
      return;
    }
    if (cuarto === this.cuartoRegalo) return;
    this.cuartoRegalo = cuarto;
    this.cargaRegalo ??= cargar('regalo_cajita.glb').then((g) => {
      const c = copia(g);
      c.scale.setScalar(1.3);
      return c;
    });
    const caja = await this.cargaRegalo;
    this.regaloCaja = caja;
    if (this.cuartoRegalo !== cuarto) return;
    const d = this.dato;
    caja.position.copy(aTres(THREE.MathUtils.clamp(x, -d.W / 2 + 0.5, d.W / 2 - 0.5), THREE.MathUtils.clamp(y, -d.D / 2 + 0.4, d.D / 2 - 0.6), 0));
    this.cuartos.get(cuarto)!.add(caja);
    this.mundo.sucio = true;
  }

  get hayRegaloVisible() {
    return !!this.regaloCaja?.parent;
  }

  /** Muestra los marcadores de los sitios de decoración del cuarto a la vista. */
  modoDecorar(si: boolean) {
    for (const [id, m] of this.marcadores) m.visible = si && this.sitioDe(id)?.cuarto === this.actual;
    this.mundo.sucio = true;
  }

  animar(t: number) {
    for (const m of this.marcadores.values()) {
      if (!m.visible) continue;
      m.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
    }
    if (this.regaloCaja?.parent) this.regaloCaja.rotation.y = Math.sin(t * 2) * 0.25;
  }

  /** Qué se tocó en pantalla: un marcador de decoración, la nevera, el regalo o el piso. */
  tocar(px: number, py: number): Toque {
    const v = new THREE.Vector2((px / window.innerWidth) * 2 - 1, -(py / window.innerHeight) * 2 + 1);
    this.rayo.setFromCamera(v, this.mundo.camara);
    let mejor: { id: string; d: number } | null = null;
    for (const [id, m] of this.marcadores) {
      if (!m.visible) continue;
      const h = this.rayo.intersectObject(m, true)[0];
      if (h && (!mejor || h.distance < mejor.d)) mejor = { id, d: h.distance };
    }
    if (mejor) {
      const d = this.sitioDe(mejor.id);
      if (d) return { tipo: 'sitio', sitio: d.sitio };
    }
    if (this.regaloCaja?.parent && visibleDeVerdad(this.regaloCaja) && this.rayo.intersectObject(this.regaloCaja, true).length) return { tipo: 'regalo' };
    const base = this.bases.get(this.actual);
    const h = base ? this.rayo.intersectObject(base, true).find((x) => visibleDeVerdad(x.object)) : undefined;
    if (!h) return null;
    const x = h.point.x, y = -h.point.z;
    const n = this.dato.notas;
    if (this.actual === n.cuarto && Math.hypot(x - n.x, y - (n.y + 0.35)) < 0.55 && h.point.y > 0.2) return { tipo: 'nevera' };
    return { tipo: 'suelo', x, y };
  }
}

const GEO_NOTA = new THREE.PlaneGeometry(0.27, 0.25);
const GEO_IMAN = new THREE.SphereGeometry(0.025, 12, 8);

/** Suelta el material y la copia de la foto hechos para un marco (el resto del modelo es compartido). */
function liberarFoto(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh || !m.userData.fotoPropia) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.map?.dispose();
    mat.dispose();
  });
}

/** three.js también toca objetos escondidos: se revisa que él y sus padres se vean. */
function visibleDeVerdad(o: THREE.Object3D | null): boolean {
  for (let x = o; x; x = x.parent) if (!x.visible) return false;
  return true;
}

/** Aro con un «+» que late donde se puede poner decoración. */
function marcador(s: Sitio): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ color: '#E4574B', transparent: true, opacity: 0.85, depthTest: false });
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 32), mat);
  const barra = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.02), mat);
  const barra2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.02), mat);
  aro.add(barra, barra2);
  aro.renderOrder = 10;
  const z = s.tipo === 'cuadro' ? s.z : s.z + 0.25;
  aro.position.copy(aTres(s.x, s.y, z));
  if (s.tipo === 'cuadro') aro.rotation.y = THREE.MathUtils.degToRad(s.rot);
  else aro.rotation.y = THREE.MathUtils.degToRad(38);
  // área de toque más grande que el dibujo
  const toque = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  aro.add(toque);
  return aro;
}
