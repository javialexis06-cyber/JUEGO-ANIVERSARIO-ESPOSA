// Escena, cámara isométrica (la misma de los renders), luces, sombras de contacto y controles de zoom/arrastre.
import { N8AOPass } from 'n8ao';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const AZ = THREE.MathUtils.degToRad(38);
const EL = THREE.MathUtils.degToRad(38);
const ALTO_PARED = 3.4;

/** Blender (x, y) → Three (x, 0, -y). */
export const aTres = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, -y);

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
  private composer: EffectComposer;
  private ao: N8AOPass;
  private smaa: SMAAPass;
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
    // Sombras de contacto (oclusión ambiental) → antialias → tono AgX
    const w = window.innerWidth, h = window.innerHeight;
    this.composer = new EffectComposer(this.renderer);
    this.ao = new N8AOPass(this.escena, this.camara, w, h);
    const c = this.ao.configuration;
    c.gammaCorrection = false;
    c.aoRadius = 0.7;
    c.distanceFalloff = 0.35;
    c.intensity = 3;
    c.color = new THREE.Color('#2a1a14');
    c.halfRes = true;
    this.ao.setQualityMode('Medium');
    this.composer.addPass(this.ao);
    this.smaa = new SMAAPass(w, h);
    this.composer.addPass(this.smaa);
    this.composer.addPass(new OutputPass());
    window.addEventListener('resize', () => this.ajustar());
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
  enfocar(p: { x: number; y: number; z: number }, zoom: number) {
    const dir = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
    const derecha = new THREE.Vector3(Math.cos(AZ), 0, -Math.sin(AZ));
    const arriba = new THREE.Vector3().crossVectors(dir, derecha).negate().normalize();
    const d = new THREE.Vector3(p.x, p.y, p.z).sub(this.objetivo);
    this.zoom = THREE.MathUtils.clamp(zoom, 1, 3);
    this.camara.zoom = this.zoom;
    this.desplazamiento.set(d.dot(derecha), d.dot(arriba));
    this.colocarCamara();
  }

  fijarZoom(z: number) {
    this.zoom = THREE.MathUtils.clamp(z, 1, 3);
    if (this.zoom <= 1.01) this.desplazamiento.set(0, 0);
    this.camara.zoom = this.zoom;
    this.colocarCamara();
  }

  /** Posición en pantalla (px) de un punto del mundo, para globos y avisos. */
  aPantalla(p: THREE.Vector3): { x: number; y: number; visible: boolean } {
    const v = p.clone().project(this.camara);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight, visible: v.z < 1 };
  }

  /** Con partida en curso se dibuja cada cuadro; en menús solo cuando algo cambió (ahorra batería). */
  dibujar(dt = 1 / 60, continuo = true) {
    if (!continuo && !this.sucio) return;
    this.sucio = false;
    if (this.calidad === 'alta') this.composer.render();
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
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.ajustar();
    }
  }
}
