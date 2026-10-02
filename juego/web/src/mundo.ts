// Escena, cámara isométrica (la misma de los renders), luces, sombras de contacto y controles de zoom/arrastre.
import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { vigilarContexto } from './contexto';
import { conTono } from './tono';

const AZ = THREE.MathUtils.degToRad(38);
/** Vector de trabajo (se usa cada cuadro para los globos: así no se crea uno nuevo cada vez). */
const TEMP = new THREE.Vector3();
const EL = THREE.MathUtils.degToRad(38);
const ALTO_PARED = 3.4;

/** Blender (x, y) → Three (x, 0, -y). */
export const aTres = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, -y);

/** Dirección en el piso (Blender) que en la pantalla se ve hacia la derecha (x) y hacia arriba (y): para el joystick. */
export const dePantalla = (x: number, y: number) => ({ x: x * Math.cos(AZ) - y * Math.sin(AZ), y: x * Math.sin(AZ) + y * Math.cos(AZ) });

export class Mundo {
  renderer: THREE.WebGLRenderer;
  escena = new THREE.Scene();
  camara: THREE.OrthographicCamera;
  W = 12;
  D = 9;
  private objetivo = new THREE.Vector3(0, ALTO_PARED / 2, 0);
  private base = 10;
  private zoom = 1;
  private desplazamiento = new THREE.Vector2(0, 0);
  /** Sombras de contacto, suavizado y color final (se cargan aparte: ver postpro.ts). */
  private composer: EffectComposer | null = null;
  /** 'alta': oclusión ambiental (sombras de contacto como en los renders). 'baja': dibujo directo. */
  calidad: 'alta' | 'baja' = 'alta';
  private tiempos: number[] = [];
  /** Hay que volver a dibujar aunque no haya partida (cámara movida, tienda cambiada, pantalla girada). */
  sucio = true;

  constructor(lienzo: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.42;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.escena.background = new THREE.Color('#c7c1ba');
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    // Luz de ambiente de un cuarto (rebotes suaves, como la iluminación global de Cycles)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.escena.environmentIntensity = 0.45;
    this.luces();
    // Sombras de contacto (oclusión ambiental) → antialias → tono AgX: se descargan mientras cargan los modelos
    void import('./postpro').then(({ crearComposer }) => {
      this.composer = crearComposer(this.renderer, this.escena, this.camara, window.innerWidth, window.innerHeight);
      this.ajustar();
      this.sucio = true;
    });
    window.addEventListener('resize', () => this.ajustar());
    vigilarContexto(lienzo, () => {
      this.ajustar();
      this.sucio = true;
    });
    this.controles(lienzo);
  }

  private luces() {
    this.escena.add(new THREE.HemisphereLight('#fff1e4', '#e0c4ae', 1.1));
    const sol = new THREE.DirectionalLight('#fff1e2', 2.4);
    sol.position.set(-6, 12, 9);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.bias = -0.0005;
    sol.shadow.normalBias = 0.02;
    const s = sol.shadow.camera as THREE.OrthographicCamera;
    s.left = -12; s.right = 12; s.top = 12; s.bottom = -12; s.near = 1; s.far = 40;
    this.escena.add(sol);
    const relleno = new THREE.DirectionalLight('#e6f0ff', 0.8);
    relleno.position.set(10, 6, 10);
    this.escena.add(relleno);
  }

  encuadrar(W: number, D: number) {
    this.W = W;
    this.D = D;
    this.ajustar();
  }

  ajustar() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer?.setPixelRatio(this.renderer.getPixelRatio());
    this.composer?.setSize(w, h);
    const a = w / h;
    const horiz = this.W * Math.cos(AZ) + this.D * Math.sin(AZ);
    const vert = (this.W * Math.sin(AZ) + this.D * Math.cos(AZ)) * Math.sin(EL) + ALTO_PARED * Math.cos(EL);
    const ancho = Math.max(horiz, vert * a) * 1.04;
    this.base = ancho;
    const alto = ancho / a;
    this.camara.left = -ancho / 2;
    this.camara.right = ancho / 2;
    this.camara.top = alto / 2;
    this.camara.bottom = -alto / 2;
    this.camara.zoom = this.zoom;
    this.colocarCamara();
  }

  private colocarCamara() {
    const dir = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
    // Desplazamiento de la vista en el plano de la pantalla
    const derecha = new THREE.Vector3(Math.cos(AZ), 0, -Math.sin(AZ));
    const arriba = new THREE.Vector3().crossVectors(dir, derecha).negate().normalize();
    const centro = this.objetivo.clone().addScaledVector(derecha, this.desplazamiento.x).addScaledVector(arriba, this.desplazamiento.y);
    this.camara.position.copy(centro).addScaledVector(dir, 60);
    this.camara.lookAt(centro);
    this.camara.updateProjectionMatrix();
    this.sucio = true;
  }

  private controles(lienzo: HTMLCanvasElement) {
    const toques = new Map<number, { x: number; y: number }>();
    let distInicial = 0, zoomInicial = 1, movido = 0;
    lienzo.addEventListener('pointerdown', (e) => {
      toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
      movido = 0;
      if (toques.size === 2) {
        const [a, b] = [...toques.values()];
        distInicial = Math.hypot(a.x - b.x, a.y - b.y);
        zoomInicial = this.zoom;
      }
    });
    lienzo.addEventListener('pointermove', (e) => {
      const antes = toques.get(e.pointerId);
      if (!antes) return;
      const ahora = { x: e.clientX, y: e.clientY };
      toques.set(e.pointerId, ahora);
      if (toques.size === 2) {
        const [a, b] = [...toques.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.fijarZoom(zoomInicial * (d / Math.max(distInicial, 1)));
        movido += 10;
      } else if (toques.size === 1 && this.zoom > 1.01) {
        const k = this.base / this.zoom / window.innerWidth;
        this.desplazamiento.x -= (ahora.x - antes.x) * k;
        this.desplazamiento.y += (ahora.y - antes.y) * k;
        movido += Math.abs(ahora.x - antes.x) + Math.abs(ahora.y - antes.y);
        this.colocarCamara();
      }
    });
    const soltar = (e: PointerEvent) => toques.delete(e.pointerId);
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
    lienzo.addEventListener('wheel', (e) => this.fijarZoom(this.zoom * (e.deltaY < 0 ? 1.1 : 0.9)), { passive: true });
    (this as any).fueArrastre = () => movido > 12;
  }

  fueArrastre(): boolean {
    return false;
  }

  /** Centra la vista en un punto del mundo con cierto acercamiento. */
  enfocar(p: { x: number; y: number; z: number }, zoom: number, max = 3) {
    const dir = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
    const derecha = new THREE.Vector3(Math.cos(AZ), 0, -Math.sin(AZ));
    const arriba = new THREE.Vector3().crossVectors(dir, derecha).negate().normalize();
    const d = new THREE.Vector3(p.x, p.y, p.z).sub(this.objetivo);
    this.zoom = THREE.MathUtils.clamp(zoom, 1, max);
    this.camara.zoom = this.zoom;
    this.desplazamiento.set(d.dot(derecha), d.dot(arriba));
    this.colocarCamara();
  }

  /** Hacia dónde mira ahora la cámara y con cuánto acercamiento (para moverla suavecito). */
  vista(): { p: THREE.Vector3; zoom: number } {
    const dir = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
    const derecha = new THREE.Vector3(Math.cos(AZ), 0, -Math.sin(AZ));
    const arriba = new THREE.Vector3().crossVectors(dir, derecha).negate().normalize();
    return { p: this.objetivo.clone().addScaledVector(derecha, this.desplazamiento.x).addScaledVector(arriba, this.desplazamiento.y), zoom: this.zoom };
  }

  fijarZoom(z: number) {
    this.zoom = THREE.MathUtils.clamp(z, 1, 3);
    if (this.zoom <= 1.01) this.desplazamiento.set(0, 0);
    this.camara.zoom = this.zoom;
    this.colocarCamara();
  }

  /** Posición en pantalla (px) de un punto del mundo, para globos y avisos. */
  aPantalla(p: THREE.Vector3): { x: number; y: number; visible: boolean } {
    const v = TEMP.copy(p).project(this.camara);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight, visible: v.z < 1 };
  }

  /** Con partida en curso se dibuja cada cuadro; en menús solo cuando algo cambió (ahorra batería). */
  dibujar(dt = 1 / 60, continuo = true) {
    if (!continuo && !this.sucio) return;
    // (en alta calidad, mientras llega el composer no se dibuja: debajo está la pantalla de carga)
    if (this.calidad === 'alta' && !this.composer) return;
    this.sucio = false;
    if (this.calidad === 'alta') this.composer!.render();
    else this.renderer.render(this.escena, this.camara);
    if (continuo) this.vigilarRitmo(dt);
  }

  /** Si el celular no alcanza ~30 cuadros por segundo, se apagan las sombras de contacto y se baja la resolución. */
  private vigilarRitmo(dt: number) {
    if (this.calidad === 'baja' || document.hidden) return;
    this.tiempos.push(dt);
    if (this.tiempos.length < 90) return;
    const orden = [...this.tiempos].sort((a, b) => a - b);
    this.tiempos = [];
    if (orden[Math.floor(orden.length / 2)] > 1 / 28) {
      this.calidad = 'baja';
      // Sin el paso final el fondo no pasa por el tono: se le pone ya con el tono para que no se vea gris
      if (this.escena.background instanceof THREE.Color) this.escena.background = conTono(this.escena.background, this.renderer.toneMappingExposure);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.ajustar();
      // Cambiar el tamaño borra el lienzo: se vuelve a dibujar ya (si no, ese cuadro sale en blanco: un parpadeo)
      this.renderer.render(this.escena, this.camara);
    }
  }
}
