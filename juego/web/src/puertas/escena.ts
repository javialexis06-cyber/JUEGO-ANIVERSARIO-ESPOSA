// La vista en primera persona: mirando la puerta de frente, con luces suaves de cuarto, acercamientos a los
// objetos y el paseo a través de la puerta abierta.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { vigilarContexto } from '../contexto';
import '../tono';

/** Dónde está el ojo cuando se mira el cuarto entero. */
export const OJO = new THREE.Vector3(0, 1.5, 4.3);
export const MIRA = new THREE.Vector3(0, 1.15, 0);

export interface Luces {
  fondo: string;
  ambiente: string;
  intensidadAmbiente: number;
  sol: string;
  intensidadSol: number;
  solDesde: [number, number, number];
  entorno?: number;
  niebla?: [string, number, number];
  exposicion?: number;
}

type Tarea = (dt: number, t: number) => void;

export const suave = (t: number) => t * t * (3 - 2 * t);
export const salida = (t: number) => 1 - Math.pow(1 - t, 3);

export class Escena {
  renderer: THREE.WebGLRenderer;
  escena = new THREE.Scene();
  camara: THREE.PerspectiveCamera;
  private tareas = new Set<Tarea>();
  private hemi = new THREE.HemisphereLight('#ffffff', '#b89a86', 0.8);
  private sol = new THREE.DirectionalLight('#fff3e2', 1.6);
  private mira = MIRA.clone();
  t = 0;
  /** Multiplicador del tiempo (pruebas en computadores lentos). */
  rapidez = 1;
  /** Sin dibujar (revisiones automáticas: todo corre igual, pero mucho más rápido). */
  dibujar = true;

  constructor(lienzo: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
    vigilarContexto(lienzo);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camara = new THREE.PerspectiveCamera(50, 1, 0.05, 80);
    this.camara.position.copy(OJO);
    this.camara.lookAt(this.mira);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.escena.environmentIntensity = 0.5;
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(1024, 1024);
    this.sol.shadow.bias = -0.0004;
    this.sol.shadow.normalBias = 0.02;
    const s = this.sol.shadow.camera;
    s.left = -5;
    s.right = 5;
    s.top = 5;
    s.bottom = -2;
    s.near = 0.5;
    s.far = 25;
    this.sol.target.position.set(0, 0.8, 1.5);
    this.escena.add(this.hemi, this.sol, this.sol.target);
    this.ajustar();
    window.addEventListener('resize', () => this.ajustar());
  }

  ajustar() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    // En pantallas angostas se abre el ángulo para que quepan la puerta y lo que la rodea
    this.camara.fov = w / h < 1.3 ? 64 : w / h < 1.7 ? 55 : 50;
    this.camara.updateProjectionMatrix();
  }

  luces(l: Luces) {
    this.entornoBase = null;
    this.escena.traverse((o) => delete o.userData.base);
    this.escena.background = new THREE.Color(l.fondo);
    this.hemi.color.set('#ffffff');
    this.hemi.groundColor.set(l.ambiente);
    this.hemi.intensity = l.intensidadAmbiente;
    this.sol.color.set(l.sol);
    this.sol.intensity = l.intensidadSol;
    this.sol.position.set(...l.solDesde);
    this.escena.environmentIntensity = l.entorno ?? 0.5;
    this.escena.fog = l.niebla ? new THREE.Fog(l.niebla[0], l.niebla[1], l.niebla[2]) : null;
    this.renderer.toneMappingExposure = l.exposicion ?? 1.35;
  }

  /** Baja las luces (0 = oscuridad casi total, 1 = normal). Las luces guardan su intensidad original. */
  atenuar(k: number) {
    this.escena.traverse((o) => {
      const l = o as THREE.Light;
      if (!l.isLight) return;
      if (l.userData.base === undefined) l.userData.base = l.intensity;
      l.intensity = l.userData.base * k;
    });
    if (this.entornoBase === null) this.entornoBase = this.escena.environmentIntensity;
    this.escena.environmentIntensity = this.entornoBase * Math.max(0.05, k);
    this.nivelLuz = k;
  }
  private entornoBase: number | null = null;
  nivelLuz = 1;

  /** Función que corre en cada cuadro hasta que se quita (devuelve cómo quitarla). */
  cada(fn: Tarea) {
    this.tareas.add(fn);
    return () => this.tareas.delete(fn);
  }

  /** Animación de `ms` milisegundos: fn(k) con k de 0 a 1. */
  animar(ms: number, fn: (k: number) => void, curva = suave): Promise<void> {
    return new Promise((listo) => {
      let t = 0;
      const quitar = this.cada((dt) => {
        t += dt * 1000;
        const k = Math.min(1, t / ms);
        fn(curva(k));
        if (k >= 1) {
          quitar();
          listo();
        }
      });
    });
  }

  esperar(ms: number) {
    return this.animar(ms, () => {});
  }

  /** Acerca la cámara a un punto (para mirar un candado, una nota...). */
  enfocar(punto: THREE.Vector3, distancia = 1.2, ms = 650, desde?: THREE.Vector3) {
    const ojo0 = this.camara.position.clone(), mira0 = this.mira.clone();
    const dir = (desde ?? OJO).clone().sub(punto).normalize();
    const ojo1 = punto.clone().addScaledVector(dir, distancia);
    return this.animar(ms, (k) => {
      this.camara.position.lerpVectors(ojo0, ojo1, k);
      this.mira.lerpVectors(mira0, punto, k);
      this.camara.lookAt(this.mira);
    });
  }

  /** Vuelve a la vista de todo el cuarto. */
  volver(ms = 550) {
    const ojo0 = this.camara.position.clone(), mira0 = this.mira.clone();
    return this.animar(ms, (k) => {
      this.camara.position.lerpVectors(ojo0, OJO, k);
      this.mira.lerpVectors(mira0, MIRA, k);
      this.camara.lookAt(this.mira);
    });
  }

  get enVistaGeneral() {
    return this.camara.position.distanceTo(OJO) < 0.01;
  }

  /** Pone la cámara de una en la vista general. */
  vistaGeneral() {
    this.camara.position.copy(OJO);
    this.mira.copy(MIRA);
    this.camara.lookAt(this.mira);
  }

  /** Temblor corto (puerta cerrada, golpe). */
  temblar(fuerza = 0.02, ms = 260) {
    const base = this.camara.position.clone();
    return this.animar(ms, (k) => {
      const f = fuerza * (1 - k);
      this.camara.position.set(base.x + (Math.random() - 0.5) * f, base.y + (Math.random() - 0.5) * f, base.z);
      if (k >= 1) this.camara.position.copy(base);
    }, (k) => k);
  }

  /** Posición en pantalla (px) de un punto del mundo. */
  aPantalla(p: THREE.Vector3) {
    const v = p.clone().project(this.camara);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight, detras: v.z > 1 };
  }

  cuadro(dt: number) {
    const d = Math.min(dt, 0.1) * this.rapidez;
    this.t += d;
    for (const fn of [...this.tareas]) fn(d, this.t);
    if (this.dibujar) this.renderer.render(this.escena, this.camara);
    else this.escena.updateMatrixWorld();
  }
}
