// El muñeco del amigo en 3D, en su propio estudio de fotos (sin nada de la casa): fondo curvo de estudio con luz
// suave, pedestal de felpa con borde dorado, dos lámparas de estudio, alfombra, brillitos flotando y el muñeco
// (el de Javier o el de Laura como molde) vestido con todo lo del creador (`src/salas/vestir.ts`). Se gira
// arrastrando, se acerca con la rueda o pellizcando, se va solo a la cara o a los pies según lo que se esté
// escogiendo, saluda al llegar, presume cuando estrena algo y hace poses. Tiene además los ambientes de la vista
// previa: «lavado» (baldosas, burbujas y cámara de arriba, como en Lavarse la cara) y «sangre» (noche, piedra y una
// antorcha, como en Sangre y Ceniza). A 30 cuadros, se duerme en segundo plano y suelta el WebGL al salir.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Personaje, type Cara } from '../personaje';
import { elegirModelos } from '../recursos';
import * as fondo from '../segundo_plano';
import { Vestidor } from '../salas/vestir';
import type { AspectoJugador } from '../salas/tipos';

export type Encuadre = 'cuerpo' | 'cara' | 'arriba' | 'abajo' | 'pies';
export type Ambiente = 'estudio' | 'lavado' | 'sangre';

/** Altura y distancia de la cámara para cada encuadre (el muñeco mide ~1,6). */
const ENCUADRES: Record<Encuadre, { y: number; d: number }> = {
  cuerpo: { y: 0.8, d: 4.4 },
  cara: { y: 1.3, d: 1.75 },
  arriba: { y: 1.02, d: 2.7 },
  abajo: { y: 0.5, d: 2.7 },
  pies: { y: 0.2, d: 2.1 },
};

/** Poses para el botón «Pose»: [pose a, pose b (vaivén) o null, cara]. */
export const POSES: [string, string | null, Cara][] = [
  ['saludo_a', 'saludo_b', 'feliz'], ['baile_a', 'baile_b', 'carcajada'], ['presumir_a', 'presumir_b', 'presumido'],
  ['pulgares_a', 'pulgares_b', 'feliz'], ['musculo', null, 'presumido'], ['jarras', null, 'concentrado'], ['aplauso_a', 'aplauso_b', 'carcajada'],
  ['risita_a', 'risita_b', 'guino'], ['reverencia', null, 'feliz'], ['corona', null, 'presumido'], ['senalar_arriba', null, 'sorprendido'],
  ['beso_volado_a', 'beso_volado_b', 'guino'], ['chocar_cinco', null, 'feliz'], ['celebrar', 'baile_a', 'carcajada'],
];

/** Textura de degradé vertical (fondo del estudio y del cielo). */
function degrade(arriba: string, abajo: string, extra?: (c: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, arriba);
  g.addColorStop(1, abajo);
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 256);
  extra?.(x);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Baldosas (lavado) o piedras (sangre) dibujadas a mano. */
function texturaPiso(tipo: 'baldosa' | 'piedra') {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  if (tipo === 'baldosa') {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      x.fillStyle = (i + j) % 2 ? '#dff3fb' : '#c9eaf6';
      x.fillRect(i * 64, j * 64, 64, 64);
      x.fillStyle = 'rgba(255,255,255,.35)';
      x.fillRect(i * 64 + 6, j * 64 + 6, 22, 6);
    }
    x.strokeStyle = '#9fcfe0';
    x.lineWidth = 3;
    for (let k = 0; k <= 4; k++) {
      x.beginPath();
      x.moveTo(k * 64, 0);
      x.lineTo(k * 64, 256);
      x.moveTo(0, k * 64);
      x.lineTo(256, k * 64);
      x.stroke();
    }
  } else {
    x.fillStyle = '#1c1714';
    x.fillRect(0, 0, 256, 256);
    let s = 3;
    const az = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 26; k++) {
      const px = az() * 256, py = az() * 256, r = 18 + az() * 26;
      x.fillStyle = `hsl(25, ${8 + az() * 10}%, ${12 + az() * 9}%)`;
      x.beginPath();
      x.ellipse(px, py, r, r * (0.6 + az() * 0.3), az() * 3, 0, Math.PI * 2);
      x.fill();
      x.strokeStyle = 'rgba(0,0,0,.45)';
      x.lineWidth = 3;
      x.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Un puntito de luz suave (brillitos, burbujas y chispas). */
function texturaBrillo() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Muneco {
  private renderer: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  private p: Personaje | null = null;
  private vest: Vestidor | null = null;
  private cuerpo: 'el' | 'ella' | '' = '';
  private turno = 0;
  private bucle: { detener(): void } | null = null;
  private ultimo = 0;
  private t = 0;
  /** Gesto en curso (saludo al llegar, presumir al estrenar, o la pose escogida). */
  private gesto: { a: string; b: string | null; cara: Cara; queda: number } | null = null;
  private giro = 0.35;
  private girando = true;
  private arrastre: { x: number; giro: number } | null = null;
  private dedos = new Map<number, { x: number; y: number }>();
  private pellizco = 0;
  private zoom = 1;
  private encuadre: Encuadre = 'cuerpo';
  private camY = ENCUADRES.cuerpo.y;
  private camD = ENCUADRES.cuerpo.d;
  private ambienteActual: Ambiente = 'estudio';
  private grupos: Record<Ambiente, THREE.Group> = { estudio: new THREE.Group(), lavado: new THREE.Group(), sangre: new THREE.Group() };
  private luces: { sol: THREE.DirectionalLight; borde: THREE.DirectionalLight; hemi: THREE.HemisphereLight; antorcha: THREE.PointLight };
  private pedestal = new THREE.Group();
  private brillos: THREE.Points;
  private burbujas: THREE.Points;
  private chispas: THREE.Points;
  private propios: (THREE.Material | THREE.BufferGeometry | THREE.Texture)[] = [];
  /** Tocaron el muñeco (sin arrastrar): para que la página reaccione. */
  alTocar: (() => void) | null = null;

  constructor(private lienzo: HTMLCanvasElement, ambiente: Ambiente = 'estudio') {
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.escena.environmentIntensity = 0.5;

    // Luces: una principal con sombra suave, un borde rosado por detrás y el cielo
    const hemi = new THREE.HemisphereLight('#fff4e8', '#c9a58e', 1.05);
    const sol = new THREE.DirectionalLight('#fff1e2', 2.5);
    sol.position.set(-2.2, 4.4, 3.2);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    sol.shadow.radius = 5;
    sol.shadow.bias = -0.0008;
    Object.assign(sol.shadow.camera, { left: -1.6, right: 1.6, top: 2.4, bottom: -0.6, near: 0.5, far: 12 });
    const borde = new THREE.DirectionalLight('#ffd6e4', 1.5);
    borde.position.set(2.6, 2.2, -3);
    const antorcha = new THREE.PointLight('#ff9a3d', 0, 7, 1.6);
    antorcha.position.set(1.4, 1.5, 1);
    this.escena.add(hemi, sol, sol.target, borde, antorcha);
    this.luces = { sol, borde, hemi, antorcha };

    this.armarEstudio();
    this.armarLavado();
    this.armarSangre();
    const brillo = texturaBrillo();
    this.propios.push(brillo);
    this.brillos = this.particulas(46, brillo, '#fff3c4', 0.07, 2.6, 2.4);
    this.burbujas = this.particulas(30, brillo, '#e9f8ff', 0.16, 2.2, 2.2);
    this.chispas = this.particulas(40, brillo, '#ffb15c', 0.05, 2.2, 2.6);
    this.grupos.estudio.add(this.brillos);
    this.grupos.lavado.add(this.burbujas);
    this.grupos.sangre.add(this.chispas);
    for (const g of Object.values(this.grupos)) this.escena.add(g);
    this.escena.add(this.pedestal);
    this.ambiente(ambiente);
    this.manejarToques();
  }

  // ---------------------------------------------------------------------------------------------- Escenarios
  private mat<T extends THREE.Material>(m: T): T {
    this.propios.push(m);
    return m;
  }

  private armarEstudio() {
    const g = this.grupos.estudio;
    // Fondo curvo (piso que sube en curva hasta la pared, sin esquina): un plano doblado
    const geo = new THREE.PlaneGeometry(14, 10, 1, 60);
    const pos = geo.getAttribute('position');
    for (let k = 0; k < pos.count; k++) {
      const v = (pos.getY(k) + 5) / 10; // 0 adelante … 1 arriba
      const largo = v * 10;
      let y = 0, z = 4 - largo;
      const curva = 1.6;
      if (largo > 5) {
        const s = largo - 5;
        const a = Math.min(s / curva, Math.PI / 2);
        z = -1 - Math.sin(a) * curva;
        y = (1 - Math.cos(a)) * curva + Math.max(0, s - curva * (Math.PI / 2));
      }
      pos.setXYZ(k, pos.getX(k), y - 0.001, z);
    }
    geo.computeVertexNormals();
    const tex = degrade('#ffd9e2', '#fde9d4', (x) => {
      // lucecitas desenfocadas en la parte de arriba (bokeh)
      for (let k = 0; k < 14; k++) {
        x.fillStyle = `rgba(255,255,255,${0.08 + (k % 3) * 0.04})`;
        x.beginPath();
        x.arc((k * 23) % 64, 20 + ((k * 37) % 90), 3 + (k % 4) * 2, 0, Math.PI * 2);
        x.fill();
      }
    });
    const fondoEst = new THREE.Mesh(geo, this.mat(new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })));
    fondoEst.receiveShadow = true;
    this.propios.push(geo, tex);
    g.add(fondoEst);
    // Alfombra redonda de flecos bajo el pedestal
    const alfombra = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), this.mat(new THREE.MeshStandardMaterial({ color: '#f7c6d2', roughness: 1 })));
    alfombra.rotation.x = -Math.PI / 2;
    alfombra.position.y = 0.002;
    alfombra.receiveShadow = true;
    g.add(alfombra);
    const flecos = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.33, 64, 1), this.mat(new THREE.MeshStandardMaterial({ color: '#fff3e6', roughness: 1 })));
    flecos.rotation.x = -Math.PI / 2;
    flecos.position.y = 0.003;
    g.add(flecos);
    // Dos lámparas de estudio (trípode + caja de luz que brilla)
    for (const lado of [-1, 1]) {
      const l = new THREE.Group();
      const metal = this.mat(new THREE.MeshStandardMaterial({ color: '#3d3540', metalness: 0.6, roughness: 0.4 }));
      for (let k = 0; k < 3; k++) {
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), metal);
        const a = (k / 3) * Math.PI * 2;
        pata.position.set(Math.cos(a) * 0.14, 0.32, Math.sin(a) * 0.14);
        pata.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
        l.add(pata);
      }
      const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.5, 8), metal);
      palo.position.y = 1.35;
      const caja = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.18), this.mat(new THREE.MeshStandardMaterial({ color: '#2e2a33', roughness: 0.6 })));
      caja.position.y = 2.1;
      const luz = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.37), this.mat(new THREE.MeshBasicMaterial({ color: '#fff8ee' })));
      luz.position.set(0, 2.1, 0.092);
      l.add(palo, caja, luz);
      l.position.set(lado * 2.25, 0, -0.7);
      l.rotation.y = -lado * 0.55;
      g.add(l);
    }
  }

  private armarLavado() {
    const g = this.grupos.lavado;
    const tex = texturaPiso('baldosa');
    tex.repeat.set(5, 5);
    this.propios.push(tex);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), this.mat(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.05 })));
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    g.add(piso);
    // Unos charquitos de espuma alrededor
    for (let k = 0; k < 7; k++) {
      const e = new THREE.Mesh(new THREE.CircleGeometry(0.18 + (k % 3) * 0.09, 20), this.mat(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, transparent: true, opacity: 0.75 })));
      const a = k * 2.1;
      e.rotation.x = -Math.PI / 2;
      e.position.set(Math.cos(a) * (1.1 + (k % 2) * 0.8), 0.004, Math.sin(a) * (0.9 + (k % 3) * 0.5));
      g.add(e);
    }
  }

  private armarSangre() {
    const g = this.grupos.sangre;
    const tex = texturaPiso('piedra');
    tex.repeat.set(4, 4);
    this.propios.push(tex);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), this.mat(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })));
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    g.add(piso);
    // La antorcha: palo, canasta y llama que tiembla
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.3, 8), this.mat(new THREE.MeshStandardMaterial({ color: '#3a2618', roughness: 0.9 })));
    palo.position.set(1.4, 0.65, 1);
    const llama = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 10), this.mat(new THREE.MeshBasicMaterial({ color: '#ffb347' })));
    llama.position.set(1.4, 1.44, 1);
    llama.name = 'llama';
    g.add(palo, llama);
    // Lápidas al fondo
    for (let k = 0; k < 4; k++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.12), this.mat(new THREE.MeshStandardMaterial({ color: '#4a4544', roughness: 1 })));
      l.position.set(-2 + k * 1.3, 0.3, -2.4 - (k % 2) * 0.5);
      l.rotation.set(0, (k - 1.5) * 0.2, (k % 2 ? 1 : -1) * 0.08);
      l.castShadow = true;
      g.add(l);
    }
  }

  /** Pedestal de felpa con borde dorado y puntitos de feria (solo en el estudio). */
  private armarPedestal() {
    if (this.pedestal.children.length) return;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.16, 56), this.mat(new THREE.MeshStandardMaterial({ color: '#f2a5b8', roughness: 0.9 })));
    base.position.y = -0.08;
    base.receiveShadow = true;
    base.castShadow = true;
    const zocalo = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.78, 0.06, 56), this.mat(new THREE.MeshStandardMaterial({ color: '#e58aa2', roughness: 0.9 })));
    zocalo.position.y = -0.13;
    zocalo.receiveShadow = true;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.645, 0.022, 10, 64), this.mat(new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.3, metalness: 0.6 })));
    aro.rotation.x = Math.PI / 2;
    const tapa = new THREE.Mesh(new THREE.CircleGeometry(0.6, 56), this.mat(new THREE.MeshStandardMaterial({ color: '#fde9d4', roughness: 0.95 })));
    tapa.rotation.x = -Math.PI / 2;
    tapa.position.y = 0.001;
    tapa.receiveShadow = true;
    this.pedestal.add(base, zocalo, aro, tapa);
    const bombillo = this.mat(new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#f2c14e', emissiveIntensity: 0.9 }));
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      const bola = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), bombillo);
      bola.position.set(Math.cos(a) * 0.68, -0.08, Math.sin(a) * 0.68);
      this.pedestal.add(bola);
    }
  }

  private particulas(n: number, tex: THREE.Texture, color: string, tam: number, ancho: number, alto: number) {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      p[k * 3] = (Math.random() - 0.5) * ancho * 2;
      p[k * 3 + 1] = Math.random() * alto;
      p[k * 3 + 2] = (Math.random() - 0.5) * 2.2 - 0.4;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = this.mat(new THREE.PointsMaterial({ map: tex, color, size: tam, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
    this.propios.push(geo);
    const pts = new THREE.Points(geo, m);
    pts.userData.alto = alto;
    return pts;
  }

  /** Cambia el escenario (el estudio del creador o los de la vista previa de los juegos). */
  ambiente(a: Ambiente) {
    this.ambienteActual = a;
    for (const [k, g] of Object.entries(this.grupos)) g.visible = k === a;
    this.pedestal.visible = a === 'estudio';
    if (a === 'estudio') this.armarPedestal();
    const { sol, borde, hemi, antorcha } = this.luces;
    this.escena.fog = a === 'sangre' ? new THREE.Fog('#0d0709', 3.5, 9) : a === 'lavado' ? new THREE.Fog('#e6f6ff', 6, 14) : null;
    this.escena.background = a === 'sangre' ? new THREE.Color('#0d0709') : a === 'lavado' ? new THREE.Color('#e6f6ff') : null;
    hemi.intensity = a === 'sangre' ? 0.22 : 1.05;
    hemi.color.set(a === 'sangre' ? '#5a4a6a' : '#fff4e8');
    sol.intensity = a === 'sangre' ? 0.35 : 2.5;
    sol.color.set(a === 'sangre' ? '#7f8cff' : '#fff1e2');
    borde.intensity = a === 'sangre' ? 0.9 : 1.5;
    borde.color.set(a === 'sangre' ? '#ff5a3d' : '#ffd6e4');
    antorcha.intensity = a === 'sangre' ? 6 : 0;
    this.escena.environmentIntensity = a === 'sangre' ? 0.12 : 0.5;
    this.renderer.toneMappingExposure = a === 'sangre' ? 1.5 : 1.25;
  }

  // ---------------------------------------------------------------------------------------------- Toques
  private manejarToques() {
    const l = this.lienzo;
    let movio = 0;
    l.addEventListener('pointerdown', (e) => {
      this.dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      l.setPointerCapture(e.pointerId);
      movio = 0;
      if (this.dedos.size === 1) this.arrastre = { x: e.clientX, giro: this.giro };
      else {
        this.arrastre = null;
        const [a, b] = [...this.dedos.values()];
        this.pellizco = Math.hypot(a.x - b.x, a.y - b.y);
      }
      this.girando = false;
    });
    l.addEventListener('pointermove', (e) => {
      if (!this.dedos.has(e.pointerId)) return;
      this.dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.dedos.size >= 2) {
        const [a, b] = [...this.dedos.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pellizco > 0) this.acercar(this.pellizco / Math.max(20, d));
        this.pellizco = d;
      } else if (this.arrastre) {
        movio = Math.max(movio, Math.abs(e.clientX - this.arrastre.x));
        this.giro = this.arrastre.giro + (e.clientX - this.arrastre.x) * 0.012;
      }
    });
    const soltar = (e: PointerEvent) => {
      this.dedos.delete(e.pointerId);
      if (!this.dedos.size) {
        if (this.arrastre && movio < 6) this.alTocar?.();
        this.arrastre = null;
        this.pellizco = 0;
        // Después de un ratito sin tocarlo vuelve a girar solito
        setTimeout(() => {
          if (!this.dedos.size) this.girando = true;
        }, 2600);
      }
    };
    l.addEventListener('pointerup', soltar);
    l.addEventListener('pointercancel', soltar);
    l.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.acercar(Math.exp(e.deltaY * 0.0012));
    }, { passive: false });
  }

  /** Acerca (<1) o aleja (>1) la cámara. */
  acercar(factor: number) {
    this.zoom = THREE.MathUtils.clamp(this.zoom * factor, 0.45, 1.45);
  }

  /** A qué parte mira la cámara (la cara al escoger peinado, los pies al escoger zapatos…). */
  enfocar(e: Encuadre) {
    if (e === this.encuadre) return;
    this.encuadre = e;
    this.zoom = 1;
  }

  // ---------------------------------------------------------------------------------------------- El muñeco
  /** Pone el muñeco con este aspecto (si cambia el cuerpo, carga el otro y saluda; si no, presume lo nuevo). */
  async poner(a: AspectoJugador, presumir = true) {
    const turno = ++this.turno;
    if (a.cuerpo !== this.cuerpo || !this.p) {
      await elegirModelos();
      const p = new Personaje({ x: 0, y: 0 }, 1);
      await p.cargarPoses(a.cuerpo);
      if (turno !== this.turno) return;
      this.vest?.liberar();
      if (this.p) this.p.grupo.removeFromParent();
      this.p = p;
      this.cuerpo = a.cuerpo;
      p.suavidad = 8;
      // (el muñeco mide ~2,55: a ~1,6 para que quepa con el pedestal)
      p.grupo.scale.setScalar(0.62);
      p.grupo.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true;
      });
      this.escena.add(p.grupo);
      this.vest = new Vestidor(p, a.cuerpo);
      await this.vest.aplicar(a);
      if (turno !== this.turno) return;
      this.hacer('saludo_a', 'saludo_b', 'feliz', 2.2);
      return;
    }
    const ok = await this.vest!.aplicar(a);
    if (ok && presumir && turno === this.turno && !this.gesto) this.hacer('presumir_a', 'presumir_b', 'presumido', 1.3);
  }

  /** Hace una pose un ratito (las del botón «Pose»). */
  hacer(a: string, b: string | null, cara: Cara, seg = 3.6) {
    this.gesto = { a, b, cara, queda: seg };
  }

  /** La siguiente pose de la lista. */
  private kPose = -1;
  siguientePose() {
    this.kPose = (this.kPose + 1) % POSES.length;
    const [a, b, c] = POSES[this.kPose];
    this.hacer(a, b, c);
  }

  arrancar() {
    if (this.bucle) return;
    this.ultimo = 0;
    this.bucle = fondo.cuadros((dt, ahora) => {
      if (ahora - this.ultimo < 1000 / 31) return;
      this.ultimo = ahora;
      this.paso(Math.min(dt, 0.1));
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
    const pr = this.renderer.getPixelRatio();
    if (c.width !== Math.round(w * pr) || c.height !== Math.round(h * pr)) {
      this.renderer.setSize(w, h, false);
      this.camara.aspect = w / h;
      this.camara.updateProjectionMatrix();
    }
  }

  private paso(dt: number) {
    this.ajustar();
    this.t += dt;
    const p = this.p;
    const amb = this.ambienteActual;
    if (p) {
      const g = this.gesto;
      if (amb === 'estudio' && this.girando && !this.arrastre) this.giro += dt * 0.32 * (g ? 0.15 : 1);
      // Mira de frente mientras hace un gesto; en la vista previa, camina hacia un lado y otro
      const frente = Math.round(this.giro / (Math.PI * 2)) * Math.PI * 2;
      const meta = amb !== 'estudio' ? Math.sin(this.t * 0.35) * 1.2 : g ? frente : this.giro;
      p.rot += (meta - p.rot) * Math.min(1, dt * (g ? 5 : amb !== 'estudio' ? 3 : 20));
      if (g) {
        g.queda -= dt;
        if (g.b) p.vaiven(g.a, g.b, 0.5 + 0.5 * Math.sin(this.t * 6));
        else p.pose(g.a);
        p.cara(g.cara);
        if (g.queda <= 0) this.gesto = null;
      } else if (amb === 'lavado' || amb === 'sangre') {
        p.vaiven('caminar_a', 'caminar_b', 0.5 + 0.5 * Math.sin(this.t * 7));
        p.cara(amb === 'sangre' ? 'concentrado' : 'feliz');
      } else {
        p.pose('reposo');
        p.cara('normal');
      }
      p.update(dt);
      p.grupo.position.set(0, amb !== 'estudio' && !g ? Math.abs(Math.sin(this.t * 7)) * 0.03 : 0, 0);
      p.grupo.rotation.y = p.rot;
    }
    this.pedestal.rotation.y = this.giro * 0.3;
    // Partículas: los brillitos suben despacio; las burbujas flotan; las chispas de la antorcha suben y se apagan
    const pts = amb === 'estudio' ? this.brillos : amb === 'lavado' ? this.burbujas : this.chispas;
    const pos = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const vel = amb === 'sangre' ? 0.5 : amb === 'lavado' ? 0.18 : 0.08;
    for (let k = 0; k < pos.count; k++) {
      let y = pos.getY(k) + dt * vel * (0.6 + (k % 5) * 0.2);
      if (y > pts.userData.alto) y = 0;
      pos.setY(k, y);
      pos.setX(k, pos.getX(k) + Math.sin(this.t + k) * dt * 0.05);
    }
    pos.needsUpdate = true;
    if (amb === 'sangre') {
      this.luces.antorcha.intensity = 5.2 + Math.sin(this.t * 13) * 0.6 + Math.sin(this.t * 7.3) * 0.5;
      const llama = this.grupos.sangre.getObjectByName('llama');
      if (llama) llama.scale.set(1, 1 + Math.sin(this.t * 15) * 0.12, 1);
    }
    // Cámara: el encuadre que toca, con el zoom del usuario; en la vista previa, desde arriba como en los juegos
    const e = ENCUADRES[this.encuadre];
    const yMeta = amb === 'estudio' ? e.y : 0.62;
    const dMeta = amb === 'estudio' ? e.d * this.zoom : 5.2;
    const k = Math.min(1, dt * 4);
    this.camY += (yMeta - this.camY) * k;
    this.camD += (dMeta - this.camD) * k;
    const alto = amb === 'estudio' ? 0.18 : amb === 'lavado' ? 0.9 : 0.62;
    this.camara.position.set(0, this.camY + this.camD * alto, this.camD);
    this.camara.lookAt(0, this.camY, 0);
    this.renderer.render(this.escena, this.camara);
  }

  liberar() {
    this.detener();
    this.turno++;
    this.vest?.liberar();
    for (const x of this.propios) x.dispose();
    this.escena.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
