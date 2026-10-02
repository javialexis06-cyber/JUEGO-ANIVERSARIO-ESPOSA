// La casa en 3D: un cuarto a la vista (sala, cocina, baño, cuarto y los de la ampliación), la decoración puesta en
// sus sitios, las notas pegadas en la nevera, los marcadores de «aquí se puede decorar», los trofeos ganados en los
// minijuegos, la bebé en su cuna (y la cigüeña que la trae). Los cuartos se cargan cuando hacen falta.
import * as THREE from 'three';
import { aTres, Mundo } from '../mundo';
import { Navegacion, P } from '../navegacion';
import { cargar, cargarJSON, copia, Productos } from '../recursos';
import { ITEM, TipoSitio } from './catalogo';
import { colorSeguro, Cuarto, Nota, Recuerdo } from './modelo';
import { acomodarDato, acomodarModelo, AdornosSala } from './sala_trofeos';
import type { SalaTrofeos } from './trofeos';
import { fundido } from '../transiciones';

/** Color con que se ve el fondo del 3D en pantalla (después del tono): de ahí sale el fundido entre cuartos. */
const FONDO_VISTO = '#d5cac0';

export interface Punto {
  x: number;
  y: number;
  rot: number;
  /** Pasos para llegar sin atravesar el mueble (sofá, silla, tina, cama); se sale por los mismos al revés. */
  acceso?: [number, number][];
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
  cuartos: Record<Cuarto, { nombre: string; puntos: Record<string, Punto>; sitios: Sitio[]; marcas?: Record<string, { x: number; y: number; z: number }> }>;
  notas: { cuarto: Cuarto; x: number; y: number; z: number; ancho: number; alto: number };
}

export type Toque =
  | { tipo: 'sitio'; sitio: Sitio }
  | { tipo: 'nevera' }
  | { tipo: 'regalo' }
  | { tipo: 'bebe' }
  /** El piso o un mueble (`mueble`: el nombre del mueble tocado, como «arcade» o «pedestal_super»). */
  | { tipo: 'suelo'; x: number; y: number; mueble?: string }
  | null;

const COLORES_NOTA = ['#FFE58A', '#FFC4D6', '#BFE9D8', '#CFE3FF', '#FFD7B0'];
/** Los que se cargan al abrir la casa (los demás cuando alguien entra o se miran). */
const INICIALES: Cuarto[] = ['sala', 'cocina', 'bano', 'cuarto'];
/** Piezas del cuarto que no estorban al caminar (paredes, piso, puertas, ventanas, tapetes). */
const NO_ESTORBA = /^(pared|muro|piso|z[oó]calo|cornisa|puerta|ventan|marco|vidrio|parteluz|cortina|manija|tapete|utiler)/i;
/** Casillas de la cuadrícula de caminos de la casa (más finas que las de la tienda: los cuartos son chicos). */
const CELDA = 0.125;
/** Distancia del centro del personaje a un mueble (medio cuerpo). */
const HOLGURA = 0.2;
/** Huella de un mueble en el piso (x, y de Blender). */
type Huella = { x0: number; y0: number; x1: number; y1: number };

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
  /** Caminos de cada cuarto (se rehacen cuando cambia la decoración del piso). */
  private navs = new Map<Cuarto, Navegacion>();
  private muebles = new Map<Cuarto, Huella[]>();
  /** Dibujitos animados en la pantalla de la tele de la sala mientras está prendida. */
  private tele: { panel: THREE.Mesh; lienzo: HTMLCanvasElement; tex: THREE.CanvasTexture; ultimo: number } | null = null;
  /** Pantallas siempre prendidas (la del arcade, la del computador de Él). */
  private pantallas: { cuarto: Cuarto; panel: THREE.Mesh; lienzo: HTMLCanvasElement; tex: THREE.CanvasTexture; ultimo: number; dibujar: Dibujo }[] = [];
  private cargas = new Map<Cuarto, Promise<void>>();
  /** Color de las paredes de los cuartos propios. */
  private pintura: Partial<Record<Cuarto, string>> = {};
  private salaTrofeos: SalaTrofeos | null = null;
  private trofeos = new Map<string, { nivel: number; obj: THREE.Object3D }>();
  /** Las placas con los títulos, el cuadro de honor y la vitrina de la sala de trofeos. */
  private adornos: AdornosSala | null = null;
  private colaTrofeos: Promise<void> = Promise.resolve();
  private hayBebe = false;
  /** La cigüeña la trae en el pañuelo: todavía no está en la cuna. */
  private bebeEnCamino = false;
  private bebe: THREE.Object3D | null = null;
  private cargaBebe: Promise<void> | null = null;
  private meciendo = false;
  private vaivenCuna = 0;
  private cigue: { obj: THREE.Object3D; alas: THREE.Object3D[]; paquete: THREE.Object3D[]; t0: number; soltado: boolean; alSoltar: () => void; fin: () => void } | null = null;
  /** Qué cuartos puede decorar quien juega (los propios solo su dueño). */
  private puedeDecorar: (c: Cuarto) => boolean = () => true;
  /** Ya se mostró algún cuarto (el primero no hace fundido). */
  private mostrado = false;

  private constructor(private mundo: Mundo, public dato: CasaDato, private productos: Productos) {
    mundo.escena.add(this.grupo);
  }

  /** Carga la casa con los cuartos de siempre; los de la ampliación se cargan con `asegurar` cuando se construyen. */
  static async cargar(mundo: Mundo, productos: Productos, progreso?: (k: number) => void, iniciales: Cuarto[] = INICIALES): Promise<Casa3D> {
    const dato = await cargarJSON<CasaDato>('casa.json');
    acomodarDato(dato);
    const c = new Casa3D(mundo, dato, productos);
    const claves = Object.keys(dato.cuartos) as Cuarto[];
    for (const k of claves) {
      const g = new THREE.Group();
      g.visible = k === c.actual;
      c.cuartos.set(k, g);
      c.grupo.add(g);
    }
    const primero = iniciales.filter((k) => claves.includes(k));
    let hechos = 0;
    await Promise.all(primero.map((k) => c.asegurar(k).then(() => progreso?.(++hechos / primero.length))));
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

  /** Carga el modelo de un cuarto (una sola vez) y le pone lo suyo: pintura, trofeos, la bebé, las pantallas. */
  asegurar(k: Cuarto): Promise<void> {
    let p = this.cargas.get(k);
    if (!p) {
      p = (async () => {
        const base = copia(await cargar(`casa_${k}.glb`));
        // El frutero y demás: marcas que se llenan con productos del súper
        base.traverse((o) => {
          if (o.userData?.producto) {
            const pr = this.productos.crear(o.userData.producto);
            if (pr) o.add(pr);
          }
        });
        if (k === 'trofeos') {
          acomodarModelo(base);
          // Dentro del modelo: así tocarlos es tocar un mueble (abre la hoja de trofeos)
          this.adornos = new AdornosSala(base.getObjectByName('casa_trofeos') ?? base);
        }
        this.cuartos.get(k)!.add(base);
        this.bases.set(k, base);
        this.navs.delete(k);
        this.muebles.delete(k);
        this.aplicarPintura(k);
        if (k === 'trofeos') this.aplicarTrofeos();
        if (k === 'cuna') void this.aplicarBebe();
        if (k === 'juegos') this.crearPantalla(k, 'pantalla_arcade', dibujarArcade);
        if (k === 'cuarto_el') this.crearPantalla(k, 'pantalla_pc', dibujarComputador);
        this.mundo.sucio = true;
      })();
      p.catch(() => this.cargas.delete(k));
      this.cargas.set(k, p);
    }
    return p;
  }

  cargado(k: Cuarto) {
    return this.bases.has(k);
  }

  mostrar(c: Cuarto) {
    // Cambio de cuarto con un fundido corto desde el color del fondo (el 3D ya muestra el cuarto nuevo debajo)
    if (c !== this.actual && this.mostrado) fundido(FONDO_VISTO);
    this.mostrado = true;
    this.actual = c;
    for (const [k, g] of this.cuartos) g.visible = k === c;
    void this.asegurar(c);
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
      const [base, color] = clave.split('#');
      const [item, foto] = base.split(':');
      const obj = await modeloItem(item);
      if (!obj) continue;
      if (color && /^[0-9a-f]{6}$/i.test(color)) pintarTinte(obj, `#${color}`);
      const s = donde.sitio;
      obj.position.copy(aTres(s.x, s.y, s.z));
      obj.rotation.y = THREE.MathUtils.degToRad(s.rot);
      if (foto) await this.ponerFoto(obj, recuerdos.find((r) => r.id === foto));
      this.cuartos.get(donde.cuarto)!.add(obj);
      this.decos.set(id, { clave, obj });
    }
    this.navs.clear();
    this.mundo.sucio = true;
  }

  /** Huellas de los muebles del cuarto que llegan a la altura del cuerpo (se miden del modelo, así sirven para muebles nuevos). */
  private huellasMuebles(c: Cuarto): Huella[] {
    let h = this.muebles.get(c);
    if (h) return h;
    h = [];
    const base = this.bases.get(c);
    if (!base) return h;
    base.updateMatrixWorld(true);
    // Los muebles son los hijos del nodo casa_<cuarto> (o del modelo, si no lo trae)
    const raiz = base.getObjectByName(`casa_${c}`) ?? base;
    for (const o of raiz.children) {
      if (NO_ESTORBA.test(o.name)) continue;
      const hh = huella(o);
      if (hh) h.push(hh);
    }
    this.muebles.set(c, h);
    return h;
  }

  /** Cuadrícula de caminos del cuarto: muebles, decoración del piso y una franja junto a la pared del fondo (la cabeza no la atraviesa). */
  nav(c: Cuarto): Navegacion {
    let n = this.navs.get(c);
    if (n) return n;
    const { W, D } = this.dato;
    n = new Navegacion(W, D, 0.35, CELDA);
    n.bloquear(-W / 2, D / 2 - 0.5, W / 2, D / 2, 0);
    for (const h of this.huellasMuebles(c)) n.bloquear(h.x0, h.y0, h.x1, h.y1, HOLGURA);
    for (const [id, d] of this.decos) {
      const donde = this.sitioDe(id);
      if (donde?.cuarto !== c || donde.sitio.tipo !== 'piso') continue;
      const hh = huella(d.obj);
      if (hh) n.bloquear(hh.x0, hh.y0, hh.x1, hh.y1, HOLGURA);
    }
    // (sin el modelo todavía no se sabe dónde están los muebles: no se guarda)
    if (this.bases.has(c)) this.navs.set(c, n);
    return n;
  }

  /** ¿Se puede estar parado ahí sin atravesar nada? */
  libre(c: Cuarto, p: P) {
    const n = this.nav(c);
    const [i, j] = n.aCelda(p);
    return n.esLibre(i, j);
  }

  /** El punto libre más cercano (para destinos que caen dentro de un mueble). */
  cercaLibre(c: Cuarto, p: P): P {
    if (this.libre(c, p)) return p;
    const n = this.nav(c);
    return n.aPunto(...n.cercana(p));
  }

  /** Junto a la puerta del cuarto (en la pared más cercana a su entrada): por ahí se sale y se entra. */
  puerta(c: Cuarto): Punto {
    const pts = this.puntos(c);
    if (pts.puerta) return pts.puerta;
    const e = pts.entrada;
    const { W, D } = this.dato;
    // Las puertas van en las dos paredes altas (izquierda y fondo); mirando hacia adentro (rot 0 = hacia la cámara)
    if (e.x + W / 2 < D / 2 - e.y) return { x: -W / 2 + 0.22, y: e.y, rot: 90 };
    return { x: e.x, y: D / 2 - 0.22, rot: 0 };
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
    // Sobre el piso libre (no dentro del sofá ni de la mesa)
    const p = this.cercaLibre(cuarto, { x: THREE.MathUtils.clamp(x, -d.W / 2 + 0.5, d.W / 2 - 0.5), y: THREE.MathUtils.clamp(y, -d.D / 2 + 0.4, d.D / 2 - 0.6) });
    caja.position.copy(aTres(p.x, p.y, 0));
    this.cuartos.get(cuarto)!.add(caja);
    this.mundo.sucio = true;
  }

  get hayRegaloVisible() {
    return !!this.regaloCaja?.parent;
  }

  /** Muestra los marcadores de los sitios de decoración del cuarto a la vista (si quien juega lo puede decorar). */
  modoDecorar(si: boolean, puede?: (c: Cuarto) => boolean) {
    if (puede) this.puedeDecorar = puede;
    for (const [id, m] of this.marcadores) {
      const c = this.sitioDe(id)?.cuarto;
      m.visible = si && c === this.actual && this.puedeDecorar(c);
    }
    this.mundo.sucio = true;
  }

  /** Color de las paredes de los cuartos propios (sin color: el de fábrica). */
  pintar(p: Partial<Record<Cuarto, string>>) {
    this.pintura = { ...p };
    for (const k of this.bases.keys()) this.aplicarPintura(k);
  }

  private aplicarPintura(k: Cuarto) {
    const base = this.bases.get(k);
    if (!base) return;
    base.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !/^pared_(fondo|izquierda)/.test(m.name)) return;
      if (!m.userData.colorFabrica) {
        // Cada cuarto con su propio material (el modelo lo comparte con las copias)
        m.material = (m.material as THREE.MeshStandardMaterial).clone();
        m.userData.colorFabrica = '#' + (m.material as THREE.MeshStandardMaterial).color.getHexString();
      }
      (m.material as THREE.MeshStandardMaterial).color.set(this.pintura[k] ?? m.userData.colorFabrica);
    });
    this.mundo.sucio = true;
  }

  /** Los trofeos de la sala de trofeos (0 = sin ganar: se ve la silueta; 1 bronce, 2 plata, 3 oro), con los títulos
   *  de las placas, el cuadro de honor y los trofeos chiquitos de cada uno en la vitrina. */
  ponerTrofeos(sala: SalaTrofeos) {
    this.salaTrofeos = sala;
    if (this.bases.has('trofeos')) this.aplicarTrofeos();
  }

  private aplicarTrofeos() {
    this.colaTrofeos = this.colaTrofeos
      .then(async () => {
        const marcas = this.dato.cuartos.trofeos?.marcas;
        const sala = this.salaTrofeos;
        if (!marcas || !sala) return;
        const modelo = await cargar('reaccion_trofeo.glb');
        for (const [id, m] of Object.entries(marcas)) {
          const nv = sala.niveles[id as keyof SalaTrofeos['niveles']] ?? 0;
          const ya = this.trofeos.get(id);
          if (ya?.nivel === nv) continue;
          ya?.obj.removeFromParent();
          const t = copia(modelo);
          tenirTrofeo(t, nv);
          const esc = id === 'amor' ? 1.25 : 0.72;
          t.scale.setScalar(esc);
          // El origen del trofeo es el tallo: la peana queda 22 cm más abajo
          t.position.copy(aTres(m.x, m.y, m.z + 0.225 * esc));
          t.userData.trofeo = id;
          this.cuartos.get('trofeos')!.add(t);
          this.trofeos.set(id, { nivel: nv, obj: t });
        }
        this.adornos?.actualizar(sala, (nv) => {
          const t = copia(modelo);
          tenirTrofeo(t, nv);
          return t;
        });
        this.mundo.sucio = true;
      })
      .catch((e) => console.error(e));
  }

  /** La bebé en su cuna (cuando la cigüeña ya la trajo). */
  ponerBebe(si: boolean) {
    this.hayBebe = si;
    if (this.bases.has('cuna')) void this.aplicarBebe();
  }

  private async aplicarBebe() {
    if (!this.hayBebe || this.bebeEnCamino) {
      this.bebe?.removeFromParent();
      return;
    }
    if (this.bebe?.parent) return;
    this.cargaBebe ??= (async () => {
      const m = this.dato.cuartos.cuna?.marcas?.bebe;
      if (!m) return;
      const b = copia(await cargar('bebe.glb'));
      // Recostadita en la almohada, con la carita hacia quien la mira (grandecita: que se vea)
      b.scale.setScalar(1.6);
      b.rotation.x = -0.95;
      const acostada = new THREE.Group();
      acostada.add(b);
      acostada.rotation.y = 0.55;
      const caja = new THREE.Box3().setFromObject(acostada);
      const centro = caja.getCenter(new THREE.Vector3());
      const destino = aTres(m.x, m.y, m.z);
      acostada.position.set(destino.x - centro.x, destino.y - caja.min.y, destino.z - centro.z);
      acostada.userData.bebe = true;
      this.bebe = acostada;
    })();
    await this.cargaBebe;
    if (!this.bebe || !this.hayBebe || this.bebeEnCamino) return;
    // Va dentro de la cuna: si la mecen, se mece con ella
    const cuna = this.mueble('cuna', /^cuna/);
    (cuna ?? this.cuartos.get('cuna')!).attach(this.bebe);
    this.mundo.sucio = true;
  }

  /** Alguien está meciendo la cuna. */
  mecerCuna(si: boolean) {
    this.meciendo = si;
  }

  /** La cigüeña entra por la ventana con la bebé en el pañuelo, la deja en la cuna y se va. */
  async cigueña(alSoltar: () => void): Promise<void> {
    const m = this.dato.cuartos.cuna?.marcas;
    if (!m?.bebe) return alSoltar();
    await this.asegurar('cuna');
    const obj = copia(await cargar('ciguena.glb'));
    obj.scale.setScalar(1.8);
    const alas: THREE.Object3D[] = [];
    const paquete: THREE.Object3D[] = [];
    obj.traverse((o) => {
      if (/^ala_/.test(o.name)) alas.push(o);
      if (/^(pa.uelo|cabeza_en|gorrito|nudo_pa)/.test(o.name)) paquete.push(o);
    });
    this.bebeEnCamino = true;
    this.bebe?.removeFromParent();
    this.cuartos.get('cuna')!.add(obj);
    return new Promise((fin) => {
      this.cigue = { obj, alas, paquete, t0: -1, soltado: false, alSoltar, fin };
      this.mundo.sucio = true;
    });
  }

  /** Una pieza del modelo de un cuarto por su nombre (si el cuarto ya cargó). */
  objeto(c: Cuarto, nombre: string): THREE.Object3D | null {
    return this.bases.get(c)?.getObjectByName(nombre) ?? null;
  }

  /** Escribe un texto en un letrero del modelo (el nombre del perrito en su casita). */
  letrero(c: Cuarto, malla: string, texto: string) {
    const m = this.objeto(c, malla) as THREE.Mesh | null;
    if (!m?.geometry) return;
    let panel = m.userData.panel as THREE.Mesh | undefined;
    if (!panel) {
      m.geometry.computeBoundingBox();
      const b = m.geometry.boundingBox!;
      const lienzo = document.createElement('canvas');
      lienzo.width = 256;
      lienzo.height = 72;
      const tex = new THREE.CanvasTexture(lienzo);
      tex.colorSpace = THREE.SRGBColorSpace;
      panel = new THREE.Mesh(
        new THREE.PlaneGeometry((b.max.x - b.min.x) * 0.92, (b.max.y - b.min.y) * 0.8),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }),
      );
      panel.position.set((b.max.x + b.min.x) / 2, (b.max.y + b.min.y) / 2, b.max.z + 0.002);
      m.add(panel);
      m.userData.panel = panel;
    }
    const tex = (panel.material as THREE.MeshBasicMaterial).map as THREE.CanvasTexture;
    const g = (tex.image as HTMLCanvasElement).getContext('2d')!;
    g.clearRect(0, 0, 256, 72);
    g.fillStyle = '#7a3b2e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let t = 44;
    do g.font = `700 ${t}px Fredoka, sans-serif`;
    while (g.measureText(texto).width > 236 && (t -= 3) > 16);
    g.fillText(texto, 128, 38);
    tex.needsUpdate = true;
    this.mundo.sucio = true;
  }

  /** Un mueble del cuarto por el nombre (el primer hijo del modelo cuyo nombre empieza así). */
  mueble(c: Cuarto, patron: RegExp): THREE.Object3D | null {
    const base = this.bases.get(c);
    const raiz = base?.getObjectByName(`casa_${c}`) ?? base;
    return raiz?.children.find((o) => patron.test(o.name)) ?? null;
  }

  private crearPantalla(c: Cuarto, nombre: string, dibujar: Dibujo) {
    let pantalla: THREE.Mesh | undefined;
    this.bases.get(c)?.traverse((o) => {
      if (!pantalla && (o as THREE.Mesh).isMesh && o.name.startsWith(nombre)) pantalla = o as THREE.Mesh;
    });
    if (!pantalla?.geometry) return;
    pantalla.geometry.computeBoundingBox();
    const b = pantalla.geometry.boundingBox!;
    const lienzo = document.createElement('canvas');
    lienzo.width = 256;
    lienzo.height = 192;
    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry((b.max.x - b.min.x) * 0.94, (b.max.y - b.min.y) * 0.92),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    );
    panel.position.set((b.max.x + b.min.x) / 2, (b.max.y + b.min.y) / 2, b.max.z + 0.003);
    pantalla.add(panel);
    this.pantallas.push({ cuarto: c, panel, lienzo, tex, ultimo: -1, dibujar });
  }

  /** El inodoro del baño (sale volando con el retrete espacial y cae de vuelta). */
  inodoro(): THREE.Object3D | null {
    return this.bases.get('bano')?.getObjectByName('inodoro') ?? null;
  }

  /** Prende o apaga la pantalla de la tele de la sala (se ve desde la casa con la tele en la ventanita). */
  telePrendida(si: boolean) {
    if (si && !this.tele) {
      const base = this.bases.get('sala');
      const pantalla = base?.getObjectByName('pantalla_tv') as THREE.Mesh | undefined;
      if (!pantalla?.geometry) return;
      pantalla.geometry.computeBoundingBox();
      const b = pantalla.geometry.boundingBox!;
      const lienzo = document.createElement('canvas');
      lienzo.width = 256;
      lienzo.height = 144;
      const tex = new THREE.CanvasTexture(lienzo);
      tex.colorSpace = THREE.SRGBColorSpace;
      // La pantalla del modelo no tiene coordenadas de textura: una lámina encima, un pelito adelante
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry((b.max.x - b.min.x) * 0.96, (b.max.y - b.min.y) * 0.94),
        new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
      );
      panel.position.set((b.max.x + b.min.x) / 2, (b.max.y + b.min.y) / 2, b.max.z + 0.003);
      pantalla.add(panel);
      this.tele = { panel, lienzo, tex, ultimo: -1 };
    }
    if (this.tele) this.tele.panel.visible = si;
    this.mundo.sucio = true;
  }

  animar(t: number) {
    if (this.tele?.panel.visible && t - this.tele.ultimo > 1 / 12) {
      this.tele.ultimo = t;
      dibujarTele(this.tele.lienzo.getContext('2d')!, t);
      this.tele.tex.needsUpdate = true;
    }
    for (const p of this.pantallas) {
      if (p.cuarto !== this.actual || t - p.ultimo < 1 / 12) continue;
      p.ultimo = t;
      p.dibujar(p.lienzo.getContext('2d')!, t);
      p.tex.needsUpdate = true;
    }
    // Los trofeos dan vueltas despacito en sus pedestales
    if (this.actual === 'trofeos') for (const { obj } of this.trofeos.values()) obj.rotation.y = t * 0.5 + obj.position.x;
    if (this.bebe?.parent) {
      // Respira dormidita
      const b = this.bebe.children[0];
      if (b) b.scale.z = 1.6 * (1 + Math.sin(t * 2.2) * 0.04);
    }
    // La cuna se mece mientras la arrullan
    this.vaivenCuna += ((this.meciendo ? 1 : 0) - this.vaivenCuna) * 0.05;
    if (this.vaivenCuna > 0.002) {
      const cuna = this.mueble('cuna', /^cuna/);
      if (cuna) cuna.rotation.x = Math.sin(t * 2.6) * 0.045 * this.vaivenCuna;
    }
    if (this.cigue) this.volarCigueña(t);
    for (const m of this.marcadores.values()) {
      if (!m.visible) continue;
      m.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
    }
    if (this.regaloCaja?.parent) this.regaloCaja.rotation.y = Math.sin(t * 2) * 0.25;
  }

  private volarCigueña(t: number) {
    const v = this.cigue!;
    if (v.t0 < 0) v.t0 = t;
    const k = t - v.t0;
    const m = this.dato.cuartos.cuna!.marcas!;
    const b = m.bebe, ven = m.ventana ?? { x: -2.5, y: 1.2, z: 1.75 };
    // Afuera → la ventana → encima de la cuna → baja, suelta la bebé → sube y se va por la derecha
    const tramos: [number, [number, number, number]][] = [
      [0, [-3.6, ven.y - 0.3, ven.z + 0.9]],
      [1.6, [ven.x + 0.4, ven.y - 0.2, ven.z + 0.3]],
      [3.4, [b.x - 0.15, b.y - 0.35, b.z + 1.35]],
      [4.6, [b.x - 0.1, b.y - 0.3, b.z + 0.78]],
      [5.8, [b.x - 0.05, b.y - 0.3, b.z + 0.78]],
      [7.6, [2.6, -0.4, 2.6]],
      [8.6, [3.8, -1.0, 3.0]],
    ];
    const i = Math.max(0, tramos.findIndex(([tt]) => tt > k) - 1);
    const fin = tramos[tramos.length - 1][0];
    if (k >= fin) {
      v.obj.removeFromParent();
      this.cigue = null;
      v.fin();
      return;
    }
    const [t0, a] = tramos[i], [t1, c] = tramos[i + 1];
    const u = (k - t0) / (t1 - t0);
    const s = u * u * (3 - 2 * u);
    const p = aTres(a[0] + (c[0] - a[0]) * s, a[1] + (c[1] - a[1]) * s, a[2] + (c[2] - a[2]) * s + Math.sin(k * 3) * 0.04);
    const d = aTres(c[0] - a[0], c[1] - a[1], 0);
    if (Math.hypot(d.x, d.z) > 0.05) {
      const meta = Math.atan2(-d.z, d.x);
      v.obj.rotation.y += Math.atan2(Math.sin(meta - v.obj.rotation.y), Math.cos(meta - v.obj.rotation.y)) * 0.12;
    }
    v.obj.position.copy(p);
    // Aletea (más despacio mientras baja con cuidado)
    const aleteo = Math.sin(k * (i === 3 || i === 4 ? 9 : 15)) * 0.7;
    for (const ala of v.alas) ala.rotation.x = /izq/.test(ala.name) ? aleteo : -aleteo;
    if (!v.soltado && k >= 5.2) {
      v.soltado = true;
      for (const o of v.paquete) o.visible = false;
      this.bebeEnCamino = false;
      this.hayBebe = true;
      void this.aplicarBebe();
      v.alSoltar();
    }
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
    if (this.bebe?.parent && visibleDeVerdad(this.bebe) && this.rayo.intersectObject(this.bebe, true).length) return { tipo: 'bebe' };
    const base = this.bases.get(this.actual);
    const h = base ? this.rayo.intersectObject(base, true).find((x) => visibleDeVerdad(x.object)) : undefined;
    if (!h) return null;
    const x = h.point.x, y = -h.point.z;
    const n = this.dato.notas;
    if (this.actual === n.cuarto && Math.hypot(x - n.x, y - (n.y + 0.35)) < 0.55 && h.point.y > 0.2) return { tipo: 'nevera' };
    // El mueble tocado: el hijo del modelo del cuarto que contiene lo que tocó el dedo
    const raiz = base!.getObjectByName(`casa_${this.actual}`) ?? base!;
    let o: THREE.Object3D | null = h.object;
    while (o && o.parent && o.parent !== raiz) o = o.parent;
    const mueble = o && o.parent === raiz && !NO_ESTORBA.test(o.name) ? o.name : undefined;
    return { tipo: 'suelo', x, y, mueble };
  }
}

/** Huella en el piso de un objeto que estorba al caminar: llega abajo (menos de 60 cm) y no es plano como un tapete. */
function huella(o: THREE.Object3D): Huella | null {
  o.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(o);
  if (b.isEmpty() || b.min.y > 0.6 || b.max.y < 0.15) return null;
  // Three (x, arriba, -y) → Blender (x, y)
  return { x0: b.min.x, x1: b.max.x, y0: -b.max.z, y1: -b.min.z };
}

/** Tiñe una copia del trofeo: bronce, plata u oro (o una silueta clarita si todavía no se gana). */
function tenirTrofeo(t: THREE.Object3D, nivel: number) {
  const metal = ['#cfc3b6', '#C98A4B', '#D9DEE6', ''][nivel] ?? '';
  t.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = (m.material as THREE.MeshStandardMaterial).clone();
    if (nivel === 0) {
      mat.color.set(metal);
      mat.metalness = 0;
      mat.transparent = true;
      mat.opacity = 0.35;
      mat.depthWrite = false;
    } else if (metal && /oro/i.test(mat.name)) mat.color.set(metal);
    m.material = mat;
  });
}

type Dibujo = (g: CanvasRenderingContext2D, t: number) => void;

/** La pantalla del arcade: la tiendita de Súper Manía con productos que caen al carrito y «TOCA PARA JUGAR». */
function dibujarArcade(g: CanvasRenderingContext2D, t: number) {
  const W = 256, H = 192;
  const cielo = g.createLinearGradient(0, 0, 0, H);
  cielo.addColorStop(0, '#2d2150');
  cielo.addColorStop(1, '#6a3f86');
  g.fillStyle = cielo;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 18; i++) {
    g.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i));
    g.fillStyle = '#fff6c9';
    g.fillRect((i * 71) % W, (i * 37) % 90, 2, 2);
  }
  g.globalAlpha = 1;
  // Estantes con productos de colores
  for (let f = 0; f < 2; f++) {
    g.fillStyle = '#c9956a';
    g.fillRect(14, 70 + f * 34, W - 28, 5);
    for (let k = 0; k < 9; k++) {
      g.fillStyle = ['#e4574b', '#f7c948', '#4fb477', '#4a90d9', '#f2a5b8'][(k + f) % 5];
      g.fillRect(22 + k * 25, 52 + f * 34, 16, 18);
    }
  }
  // El carrito que va y viene recogiendo lo que cae
  const x = 128 + Math.sin(t * 1.6) * 90;
  g.fillStyle = '#f7d774';
  g.fillRect(x - 20, 146, 40, 16);
  g.fillStyle = '#2b2a33';
  g.beginPath();
  g.arc(x - 12, 166, 5, 0, Math.PI * 2);
  g.arc(x + 12, 166, 5, 0, Math.PI * 2);
  g.fill();
  const caeX = 128 + Math.sin((t - ((t * 0.9) % 1.1)) * 1.6) * 90;
  const k = (t * 0.9) % 1.1;
  g.fillStyle = '#e4574b';
  g.fillRect(caeX - 6, 20 + k * 115, 12, 12);
  // Letrero
  g.fillStyle = '#ffffff';
  g.font = '800 22px sans-serif';
  g.textAlign = 'center';
  g.fillText('SÚPER MANÍA', W / 2, 32);
  if (Math.floor(t * 2) % 2 === 0) {
    g.fillStyle = '#ffe38a';
    g.font = '800 15px sans-serif';
    g.fillText('TOCA PARA JUGAR', W / 2, 138);
  }
  g.textAlign = 'start';
}

/** La pantalla del computador de Él: código que se escribe solo y un corazón que late en la esquina. */
function dibujarComputador(g: CanvasRenderingContext2D, t: number) {
  const W = 256, H = 192;
  g.fillStyle = '#1e2433';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#2b3348';
  g.fillRect(0, 0, W, 16);
  for (const [i, c] of ['#e4574b', '#f7c948', '#4fb477'].entries()) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(10 + i * 12, 8, 4, 0, Math.PI * 2);
    g.fill();
  }
  const lineas = Math.floor(t * 3) % 14;
  const colores = ['#9fd3f2', '#f2a5b8', '#b8e2a0', '#f7d774', '#c9b6ea'];
  for (let i = 0; i <= lineas; i++) {
    const sangria = [0, 12, 24, 24, 12, 0, 12, 24, 36, 24, 12, 0, 12, 0][i] ?? 0;
    const largo = 30 + ((i * 53) % 110);
    const ancho = i === lineas ? largo * ((t * 3) % 1) : largo;
    g.fillStyle = colores[i % colores.length];
    g.fillRect(10 + sangria, 24 + i * 11, ancho, 5);
  }
  const r = 14 + Math.sin(t * 5) * 2;
  const x = W - 34, y = H - 34;
  g.fillStyle = '#e4574b';
  g.beginPath();
  g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.8, y - r * 1.4, x, y - r * 0.5);
  g.bezierCurveTo(x + r * 0.8, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  g.fill();
}

const GEO_NOTA = new THREE.PlaneGeometry(0.27, 0.25);
const GEO_IMAN = new THREE.SphereGeometry(0.025, 12, 8);

/** Suelta el material y la copia de la foto hechos para un marco (el resto del modelo es compartido). */
function liberarFoto(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh || !(m.userData.fotoPropia || m.userData.tintePropio)) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (m.userData.fotoPropia) mat.map?.dispose();
    mat.dispose();
  });
}

/** Pinta de otro color las partes «tinte» de una decoración (luces neón, LED, lava…), con materiales propios
 *  para no pintar las demás copias del mismo modelo. */
function pintarTinte(o: THREE.Object3D, color: string) {
  const c = new THREE.Color(color);
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (Array.isArray(mat) || !/tinte/i.test(mat.name)) return;
    const nuevo = mat.clone();
    nuevo.color.copy(c);
    if (nuevo.emissive && nuevo.emissive.getHex() !== 0) nuevo.emissive.copy(c);
    m.material = nuevo;
    m.userData.tintePropio = true;
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

/** Lo que se ve en la tele prendida: tres dibujitos de los dos que se turnan (sus caritas con un corazón,
 *  un ecualizador con notas y un cielo de noche con estrellas). */
function dibujarTele(g: CanvasRenderingContext2D, t: number) {
  const W = 256, H = 144;
  const modo = Math.floor(t / 7) % 3;
  const fondo = g.createLinearGradient(0, 0, W, H);
  const h = (t * 12) % 360;
  if (modo === 2) {
    fondo.addColorStop(0, '#2d2150');
    fondo.addColorStop(1, '#5b3f78');
  } else {
    fondo.addColorStop(0, `hsl(${h} 80% 86%)`);
    fondo.addColorStop(1, `hsl(${(h + 60) % 360} 80% 80%)`);
  }
  g.fillStyle = fondo;
  g.fillRect(0, 0, W, H);
  const corazon = (x: number, y: number, r: number, color: string) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, y + r * 0.9);
    g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.8, y - r * 1.4, x, y - r * 0.5);
    g.bezierCurveTo(x + r * 0.8, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
    g.fill();
  };
  const carita = (x: number, y: number, ella: boolean, guino: boolean) => {
    g.fillStyle = '#2b1d18';
    g.beginPath();
    if (ella) g.ellipse(x, y + 8, 27, 34, 0, 0, Math.PI * 2);
    else g.arc(x, y - 4, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f2c9a8';
    g.beginPath();
    g.arc(x, y + 4, 21, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2b1d18';
    g.beginPath();
    g.ellipse(x, y - 12, 22, 10, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(x - 8, y + 4, 3, 0, Math.PI * 2);
    if (guino) g.fillRect(x + 5, y + 3, 7, 2);
    else g.arc(x + 8, y + 4, 3, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(232,106,138,0.55)';
    g.beginPath();
    g.arc(x - 13, y + 12, 4, 0, Math.PI * 2);
    g.arc(x + 13, y + 12, 4, 0, Math.PI * 2);
    g.fill();
  };
  if (modo === 0) {
    // Sus caritas meciéndose con un corazón que late en el medio
    const m = Math.sin(t * 2.4) * 4;
    carita(74, 72 + m, false, Math.sin(t * 1.3) > 0.85);
    carita(182, 72 - m, true, Math.sin(t * 1.7 + 1) > 0.85);
    corazon(128, 70, 13 + Math.sin(t * 6) * 2.5, '#e4574b');
  } else if (modo === 1) {
    // Ecualizador con notas que suben
    for (let i = 0; i < 12; i++) {
      const alto = 18 + (Math.sin(t * 5 + i * 1.3) * 0.5 + 0.5) * 70;
      g.fillStyle = `hsl(${(i * 30 + h) % 360} 70% 60%)`;
      g.fillRect(18 + i * 19, H - 16 - alto, 13, alto);
    }
    g.fillStyle = '#fff';
    g.font = '600 26px sans-serif';
    for (let i = 0; i < 3; i++) g.fillText(i % 2 ? '♫' : '♪', 40 + i * 80, 40 + Math.sin(t * 3 + i) * 10);
  } else {
    // Noche de estrellas con una luna y un corazón
    for (let i = 0; i < 26; i++) {
      const x = (i * 97) % W, y = (i * 53) % (H - 20);
      g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
      g.fillStyle = '#fff6c9';
      g.fillRect(x, y, 2.5, 2.5);
    }
    g.globalAlpha = 1;
    g.fillStyle = '#fff1b8';
    g.beginPath();
    g.arc(196, 44, 20, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2d2150';
    g.beginPath();
    g.arc(206, 38, 18, 0, Math.PI * 2);
    g.fill();
    corazon(90, 80 + Math.sin(t * 2) * 6, 16, '#f4b6c2');
  }
  // Corazoncitos que suben
  for (let i = 0; i < 4; i++) {
    const k = (t * 0.35 + i / 4) % 1;
    g.globalAlpha = 1 - k;
    corazon(30 + i * 62, H - k * H, 5, '#ffffff');
  }
  g.globalAlpha = 1;
  // Barrita de «se está reproduciendo»
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.fillRect(12, H - 8, W - 24, 3);
  g.fillStyle = '#e4574b';
  g.fillRect(12, H - 8, (W - 24) * ((t / 40) % 1), 3);
}
