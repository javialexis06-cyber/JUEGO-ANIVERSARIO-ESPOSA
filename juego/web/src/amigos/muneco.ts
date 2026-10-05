// El muñeco del amigo en 3D (el de Javier o el de Laura como base, con sus colores): para el creador y para la sala
// de juegos de amigos. Una escenita propia y liviana (sin la casa): pedestal, luz cálida, el muñeco respirando y
// girando despacito, saludando al llegar y presumiendo cuando cambia un color. A 30 cuadros y se detiene solo en
// segundo plano.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Personaje } from '../personaje';
import { elegirModelos } from '../recursos';
import * as fondo from '../segundo_plano';
import { teñirModelo } from '../salas/tinte';
import type { AspectoJugador } from '../salas/tipos';

export class Muneco {
  private renderer: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  private p: Personaje | null = null;
  private cuerpo: 'el' | 'ella' | '' = '';
  private propios: THREE.Material[] = [];
  private turno = 0;
  private bucle: { detener(): void } | null = null;
  private ultimo = 0;
  private gesto = 0;
  private gestoTipo: 'saludo' | 'presumir' = 'saludo';
  private giro = 0.35;
  /** El usuario lo está girando con el dedo. */
  private arrastre: { x: number; giro: number } | null = null;
  private pedestal: THREE.Group;

  constructor(private lienzo: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.escena.environmentIntensity = 0.55;
    this.escena.add(new THREE.HemisphereLight('#fff4e8', '#c9a58e', 1.1));
    const sol = new THREE.DirectionalLight('#fff1e2', 2.4);
    sol.position.set(-2, 4, 3);
    this.escena.add(sol);
    const borde = new THREE.DirectionalLight('#ffd6e4', 1.4);
    borde.position.set(2.5, 2, -3);
    this.escena.add(borde);
    // Pedestal redondo de felpa con su borde dorado
    this.pedestal = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.14, 48), new THREE.MeshStandardMaterial({ color: '#f2a5b8', roughness: 0.85 }));
    base.position.y = -0.07;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.645, 0.022, 10, 64), new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.35, metalness: 0.5 }));
    aro.rotation.x = Math.PI / 2;
    aro.position.y = 0.0;
    const tapa = new THREE.Mesh(new THREE.CircleGeometry(0.6, 48), new THREE.MeshStandardMaterial({ color: '#fde9d4', roughness: 0.9 }));
    tapa.rotation.x = -Math.PI / 2;
    tapa.position.y = 0.001;
    this.pedestal.add(base, aro, tapa);
    // Puntitos dorados alrededor (como estrellitas de feria)
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      const bola = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#f2c14e', emissiveIntensity: 0.6 }));
      bola.position.set(Math.cos(a) * 0.66, -0.07, Math.sin(a) * 0.66);
      this.pedestal.add(bola);
    }
    this.escena.add(this.pedestal);
    // Sombrita bajo los pies
    const sombra = new THREE.Mesh(
      new THREE.CircleGeometry(0.32, 32),
      new THREE.MeshBasicMaterial({ color: '#3d2b27', transparent: true, opacity: 0.22, depthWrite: false }),
    );
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = 0.004;
    this.escena.add(sombra);
    this.camara.position.set(0, 0.95, 4.1);
    this.camara.lookAt(0, 0.72, 0);
    lienzo.addEventListener('pointerdown', (e) => {
      this.arrastre = { x: e.clientX, giro: this.giro };
      lienzo.setPointerCapture(e.pointerId);
    });
    lienzo.addEventListener('pointermove', (e) => {
      if (this.arrastre) this.giro = this.arrastre.giro + (e.clientX - this.arrastre.x) * 0.012;
    });
    const soltar = () => (this.arrastre = null);
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
  }

  /** Pone el muñeco con este aspecto (si cambia el cuerpo, carga el otro). */
  async poner(a: AspectoJugador) {
    const turno = ++this.turno;
    if (a.cuerpo !== this.cuerpo || !this.p) {
      await elegirModelos();
      const p = new Personaje({ x: 0, y: 0 }, 1);
      await p.cargarPoses(a.cuerpo);
      if (turno !== this.turno) return;
      if (this.p) this.p.grupo.removeFromParent();
      this.p = p;
      this.cuerpo = a.cuerpo;
      p.suavidad = 8;
      // (el muñeco mide ~2,5: se escala a un poco menos de 2 para que quepa con el pedestal)
      p.grupo.scale.setScalar(0.62);
      this.escena.add(p.grupo);
      this.gestoTipo = 'saludo';
      this.gesto = 2.2;
    } else {
      this.gestoTipo = 'presumir';
      this.gesto = 1.4;
    }
    for (const m of this.propios) m.dispose();
    this.propios = this.p.modelo ? teñirModelo(this.p.modelo, a) : [];
  }

  arrancar() {
    if (this.bucle) return;
    this.ultimo = 0;
    this.bucle = fondo.cuadros((dt, ahora) => {
      if (ahora - this.ultimo < 1000 / 31) return;
      this.ultimo = ahora;
      this.paso(dt);
    });
  }

  detener() {
    this.bucle?.detener();
    this.bucle = null;
  }

  private ajustar() {
    const w = this.lienzo.clientWidth, h = this.lienzo.clientHeight;
    if (!w || !h) return;
    const c = this.renderer.domElement;
    if (c.width !== Math.round(w * this.renderer.getPixelRatio()) || c.height !== Math.round(h * this.renderer.getPixelRatio())) {
      this.renderer.setSize(w, h, false);
      this.camara.aspect = w / h;
      // En un lienzo angosto se aleja un poquito para que quepa entero
      this.camara.position.z = w / h < 0.8 ? 5.2 : 4.1;
      this.camara.updateProjectionMatrix();
    }
  }

  private t = 0;
  private paso(dt: number) {
    this.ajustar();
    this.t += dt;
    const p = this.p;
    if (p) {
      if (!this.arrastre) this.giro += dt * 0.35 * (this.gesto > 0 ? 0.2 : 1);
      // Mira de frente mientras saluda o presume
      const meta = this.gesto > 0 ? Math.round(this.giro / (Math.PI * 2)) * Math.PI * 2 : this.giro;
      p.rot += (meta - p.rot) * Math.min(1, dt * (this.gesto > 0 ? 5 : 20));
      this.gesto = Math.max(0, this.gesto - dt);
      if (this.gesto > 0) {
        const k = 0.5 + 0.5 * Math.sin(this.t * 7);
        if (this.gestoTipo === 'saludo') p.vaiven('saludo_a', 'saludo_b', k);
        else p.vaiven('presumir_a', 'presumir_b', k);
        p.cara(this.gestoTipo === 'saludo' ? 'feliz' : 'presumido');
      } else {
        p.pose('reposo');
        p.cara('normal');
      }
      p.update(dt);
      p.grupo.position.set(0, 0, 0);
      p.grupo.rotation.y = p.rot;
    }
    this.pedestal.rotation.y = this.giro * 0.3;
    this.renderer.render(this.escena, this.camara);
  }

  liberar() {
    this.detener();
    for (const m of this.propios) m.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
