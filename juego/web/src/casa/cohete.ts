// El retrete espacial: después de la leche (Ella) o del picante (Él), el inodoro sale disparado al espacio con
// el personaje sentado. Se arrastra el dedo para esquivar asteroides; se gana por el tiempo que se aguante y el
// personaje va diciendo lo que piensa. Al chocar, explota y cae de vuelta a la casa.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import './cohete.css';
import { Muneco } from '../reacciones/muneco';
import { nota, rumor } from '../sonido';
import type { Rol, Ropa } from './modelo';
import { Vestuario } from './ropa';

export interface Resultado {
  segundos: number;
}

interface Opciones {
  rol: Rol;
  ropa?: Ropa;
  colorPelo?: string;
  record?: Partial<Record<Rol, number>>;
}

/** Lo que va diciendo en el espacio (se sabía que algún día pasaría). */
const FRASES: Record<Rol, string[]> = {
  el: [
    'No debí comerme ese picante…',
    'Siempre supe que algún día saldría como un cohete del baño.',
    '¡Houston, tenemos un problema… estomacal!',
    '¡Ni en Cartagena volé tan alto!',
    '¿Esto cuenta como viaje espacial? Quiero el certificado.',
    'El ají no perdona.',
    '¡Mi amor, si me ves pasar por la ventana, saluda!',
    'La próxima vez pido el ají suavecito.',
    'Esto no estaba en el presupuesto del mes.',
    '¡Guárdame la cena, ya vuelvo! Creo.',
  ],
  ella: [
    '¡Sabía que la leche me iba a hacer esto!',
    'Intolerante a la lactosa… y ahora astronauta.',
    'Nunca más un vaso de leche. NUNCA.',
    '¿Alguien tiene papel higiénico en el espacio?',
    'Siempre supe que algún día saldría como un cohete del baño.',
    '¡Qué vista tan bonita… qué vergüenza tan grande!',
    'Si esto sale en las noticias, no me conoces.',
    'Transformice nunca me preparó para esto.',
    'Directora de Yanbal… y ahora de la NASA.',
    '¡Mi amor, esto es culpa de tu leche!',
  ],
};
const CASI = ['¡Uy, casi!', '¡Esa estuvo cerca!', '¡Ay, mi retrete!', '¡Por un pelito!'];
const FIN = ['¡NOOOO!', '¡Me voooy!', '¡Mi baño!'];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const elegir = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

export function jugarCohete(o: Opciones): Promise<Resultado> {
  return new Promise((listo) => {
    void new RetreteEspacial(o, listo).empezar();
  });
}

interface Roca {
  m: THREE.Mesh;
  r: number;
  v: number;
  giro: THREE.Vector3;
  casi: boolean;
}

class RetreteEspacial {
  private capa: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara = new THREE.PerspectiveCamera(50, 2, 0.1, 200);
  private nave = new THREE.Group();
  private fuego = new THREE.Group();
  private muneco: Muneco;
  private rocas: Roca[] = [];
  private formas: THREE.BufferGeometry[] = [];
  private matRoca = new THREE.MeshStandardMaterial({ color: '#8d7b6a', roughness: 0.95, flatShading: true });
  private estrellas: THREE.Points[] = [];
  private tierra: THREE.Mesh;
  private chispas: { m: THREE.Mesh; v: THREE.Vector3; vida: number }[] = [];
  private bolita = new THREE.SphereGeometry(1, 8, 6);
  private matHumo = new THREE.MeshBasicMaterial({ color: '#d9d4e8', transparent: true, opacity: 0.8 });
  private matChispa = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, toneMapped: false });
  private tHumo = 0;
  // Estado del juego
  private fase: 'intro' | 'juego' | 'choque' | 'fin' = 'intro';
  private t = 0;
  private tJuego = 0;
  private proxRoca = 0;
  private proxFrase = 3;
  private temblor = 0;
  private meta = new THREE.Vector2(-3, 0);
  private vel = new THREE.Vector2();
  private limites = { x: 6, y: 3.3 };
  private teclas = new Set<string>();
  private arrastre: { x: number; y: number } | null = null;
  private ultimo = 0;
  private cuadro = 0;

  constructor(private o: Opciones, private listo: (r: Resultado) => void) {
    cohete.actual = this;
    this.capa = document.createElement('section');
    this.capa.className = 'cohete';
    this.capa.innerHTML = `
      <canvas class="cohete-lienzo"></canvas>
      <div class="cohete-hud">
        <b class="cohete-tiempo">0.0 s</b>
        <span class="cohete-records"></span>
      </div>
      <p class="cohete-aviso">¡Despegue!</p>
      <p class="cohete-globo" hidden></p>
      <div class="cohete-destello"></div>`;
    document.body.append(this.capa);
    const lienzo = this.capa.querySelector('canvas')!;
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.escena.environmentIntensity = 0.5;
    this.escena.background = new THREE.Color('#0b0a1f');
    this.escena.add(new THREE.HemisphereLight('#c9d8ff', '#2a1a3a', 1.1));
    const sol = new THREE.DirectionalLight('#fff1e2', 2.2);
    sol.position.set(-6, 5, 8);
    this.escena.add(sol);
    const borde = new THREE.DirectionalLight('#9ccbef', 1.2);
    borde.position.set(6, -2, -4);
    this.escena.add(borde);
    this.camara.position.set(0, 0, 12);
    this.camara.lookAt(0, 0, 0);
    this.cielo();
    this.tierra = new THREE.Mesh(new THREE.SphereGeometry(9, 48, 32), new THREE.MeshStandardMaterial({ color: '#3f7fd0', roughness: 0.8 }));
    const tierraVerde = new THREE.Mesh(new THREE.SphereGeometry(9.03, 24, 16, 0.3, 1.4, 0.6, 1.2), new THREE.MeshStandardMaterial({ color: '#6ab04c', roughness: 0.9 }));
    this.tierra.add(tierraVerde);
    this.tierra.position.set(0, -12, -2);
    this.escena.add(this.tierra);
    // Formas de asteroide (esferas abolladas)
    for (let k = 0; k < 4; k++) {
      const g = new THREE.IcosahedronGeometry(1, 2);
      const pos = g.attributes.position;
      // Abolladuras que dependen del punto (los vértices repetidos se mueven igual y no quedan grietas)
      const a = rnd(2, 5), b = rnd(2, 5), c = rnd(0, 6);
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, i);
        v.multiplyScalar(1 + 0.2 * Math.sin(v.x * a + c) * Math.cos(v.y * b - v.z * a) + 0.08 * Math.sin(v.z * 7 + v.y * 5));
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      this.formas.push(g);
    }
    this.muneco = new Muneco(o.rol, 0.62);
    this.retrete();
    // Grande en pantalla (el personaje y el retrete juntos)
    this.nave.scale.setScalar(1.5);
    this.nave.position.set(-3, -7, 0);
    this.escena.add(this.nave);
    this.ajustar();
    window.addEventListener('resize', this.ajustar);
    this.controles(lienzo);
    const r = o.record ?? {};
    const fmt = (v?: number) => (v ? `${v.toFixed(1)} s` : '—');
    this.capa.querySelector('.cohete-records')!.textContent = `Récord · Él ${fmt(r.el)} · Ella ${fmt(r.ella)}`;
  }

  async empezar() {
    await this.muneco.cargar();
    if (this.o.ropa || this.o.colorPelo) await new Vestuario(this.muneco.p, this.o.rol).aplicar(this.o.ropa, this.o.colorPelo).catch(() => undefined);
    this.nave.add(this.muneco.p.grupo);
    this.muneco.ponerEn(0, 0.02, 0);
    void this.muneco.actuar({ nombre: 'retrete', pasos: [{ dur: 99, pose: 'sentado', cara: 'sorprendido' }], bucle: true });
    this.capa.classList.add('visible');
    rumor(2.4, 180, 0.12, 0, 0.6, 90);
    nota(90, 2.2, 0, 'sawtooth', 0.05, 320);
    this.ultimo = performance.now();
    this.cuadro = requestAnimationFrame((t) => this.bucle(t));
  }

  // ------------------------------------------------------------------ Armado
  private cielo() {
    for (const [n, tam, z] of [[500, 0.05, -30], [260, 0.08, -18], [90, 0.12, -8]] as const) {
      const g = new THREE.BufferGeometry();
      const p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        p[i * 3] = rnd(-40, 40);
        p[i * 3 + 1] = rnd(-24, 24);
        p[i * 3 + 2] = z;
      }
      g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff6d8', size: tam * (z < -20 ? 4 : 2.5), sizeAttenuation: true }));
      this.estrellas.push(pts);
      this.escena.add(pts);
    }
    // Un planeta con anillo, lejos
    const planeta = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 20), new THREE.MeshStandardMaterial({ color: '#e8a6c8', roughness: 0.7 }));
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.18, 8, 48), new THREE.MeshStandardMaterial({ color: '#f6cf5a', roughness: 0.6 }));
    anillo.rotation.x = 1.2;
    planeta.add(anillo);
    planeta.position.set(14, 7, -20);
    planeta.name = 'planeta';
    this.escena.add(planeta);
  }

  /** El inodoro de porcelana con su fuego de cohete. */
  private retrete() {
    const porcelana = new THREE.MeshStandardMaterial({ color: '#f7f5f0', roughness: 0.22 });
    // Las mismas medidas del inodoro del baño de la casa (la taza a la altura de la cadera)
    const base = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.13, 0), new THREE.Vector2(0.12, 0.2), new THREE.Vector2(0.2, 0.38), new THREE.Vector2(0.001, 0.4)], 24), porcelana);
    const taza = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.055, 10, 28), porcelana);
    taza.rotation.x = Math.PI / 2;
    taza.scale.set(1, 1.2, 1);
    taza.position.set(0, 0.41, 0.05);
    const tanque = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.2), porcelana);
    tanque.position.set(0, 0.62, -0.22);
    const boton = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), new THREE.MeshStandardMaterial({ color: '#c9ccd1', metalness: 0.8, roughness: 0.25 }));
    boton.position.set(0, 0.85, -0.22);
    const inodoro = new THREE.Group();
    inodoro.add(base, taza, tanque, boton);
    inodoro.position.y = -0.42;
    this.nave.add(inodoro);
    // Fuego: conos que titilan bajo la taza
    for (const [r, h, color] of [[0.24, 1.1, '#ff9f1c'], [0.15, 0.8, '#ffe066'], [0.07, 0.5, '#ffffff']] as const) {
      const cono = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, toneMapped: false }));
      cono.rotation.x = Math.PI;
      cono.position.y = -h / 2;
      this.fuego.add(cono);
    }
    this.fuego.position.y = -0.42;
    this.nave.add(this.fuego);
  }

  private ajustar = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
    // Lo que se ve a la profundidad del juego
    const alto = 2 * Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2)) * 12;
    this.limites = { x: (alto * this.camara.aspect) / 2 - 0.8, y: alto / 2 - 0.9 };
  };

  private controles(lienzo: HTMLCanvasElement) {
    // Se arrastra el dedo en cualquier parte: el retrete se mueve lo mismo que el dedo (no queda tapado)
    lienzo.addEventListener('pointerdown', (e) => {
      this.arrastre = { x: e.clientX, y: e.clientY };
      lienzo.setPointerCapture(e.pointerId);
    });
    lienzo.addEventListener('pointermove', (e) => {
      if (!this.arrastre) return;
      const k = (2 * this.limites.y + 1.8) / window.innerHeight;
      this.meta.x += (e.clientX - this.arrastre.x) * k * 1.15;
      this.meta.y -= (e.clientY - this.arrastre.y) * k * 1.15;
      this.arrastre = { x: e.clientX, y: e.clientY };
    });
    const soltar = () => (this.arrastre = null);
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
    window.addEventListener('keydown', this.tecla);
    window.addEventListener('keyup', this.tecla);
  }

  private tecla = (e: KeyboardEvent) => {
    if (e.type === 'keydown') this.teclas.add(e.key.toLowerCase());
    else this.teclas.delete(e.key.toLowerCase());
  };

  // ------------------------------------------------------------------ Bucle
  private bucle(ms: number) {
    if (this.fase === 'fin') return;
    this.cuadro = requestAnimationFrame((t) => this.bucle(t));
    const dt = Math.min(0.05, (ms - this.ultimo) / 1000);
    this.ultimo = ms;
    this.paso(dt);
    this.renderer.render(this.escena, this.camara);
  }

  /** Pruebas: avanza el juego a pasos fijos y pinta una vez. */
  simular(seg: number) {
    for (let t = 0; t < seg; t += 1 / 30) this.paso(1 / 30);
    this.renderer.render(this.escena, this.camara);
  }

  private paso(dt: number) {
    this.t += dt;
    this.muneco.update(dt);
    // Las estrellas pasan de derecha a izquierda (van hacia adelante)
    const rapidez = this.fase === 'intro' ? 0.4 : 1 + this.tJuego * 0.02;
    this.estrellas.forEach((e, i) => {
      e.position.x -= dt * (1.5 + i * 2.5) * rapidez;
      if (e.position.x < -40) e.position.x += 80;
    });
    const planeta = this.escena.getObjectByName('planeta')!;
    planeta.position.x -= dt * 0.25;
    planeta.rotation.y += dt * 0.1;
    // Fuego que titila
    const f = 1 + Math.sin(this.t * 40) * 0.12 + (this.fase === 'intro' ? 0.5 : 0);
    this.fuego.scale.set(1, f * (this.fase === 'choque' ? 0.2 : 1), 1);
    // Estela: bolitas de humo y chispas que salen del fuego
    this.tHumo -= dt;
    if (this.fase !== 'choque' && this.tHumo <= 0) {
      this.tHumo = 0.035;
      const boca = new THREE.Vector3(0, -1.1, 0).applyMatrix4(this.nave.matrixWorld);
      const humo = Math.random() < 0.7;
      const m = new THREE.Mesh(this.bolita, humo ? this.matHumo.clone() : this.matChispa.clone());
      m.scale.setScalar(humo ? rnd(0.12, 0.26) : rnd(0.05, 0.09));
      m.position.copy(boca);
      this.escena.add(m);
      this.chispas.push({ m, v: new THREE.Vector3(rnd(-4.5, -2.5), rnd(-1.2, 0.2), 0), vida: humo ? 0.7 : 0.4 });
    }
    if (this.fase === 'intro') this.intro(dt);
    else if (this.fase === 'juego') this.juego(dt);
    else if (this.fase === 'choque') this.choque(dt);
    this.moverRocas(dt);
    this.moverChispas(dt);
    // Temblor de cámara
    this.temblor = Math.max(0, this.temblor - dt * 1.5);
    this.camara.position.set((Math.random() - 0.5) * this.temblor, (Math.random() - 0.5) * this.temblor, 12);
    this.globo(dt);
  }

  private intro(dt: number) {
    // Despega desde la Tierra hasta su lugar
    const k = Math.min(1, this.t / 2.6);
    this.nave.position.y = -7 + (7 * (1 - Math.pow(1 - k, 3)));
    this.nave.rotation.z = Math.sin(this.t * 18) * 0.03 * (1 - k);
    this.tierra.position.y = -12 - k * 6;
    this.temblor = 0.25 * (1 - k);
    if (this.t > 1.4 && this.t - dt <= 1.4) this.aviso('¡Esquiva los asteroides!');
    if (k >= 1) {
      this.fase = 'juego';
      this.meta.set(this.nave.position.x, this.nave.position.y);
      this.decir(elegir(FRASES[this.o.rol]), 3.2);
      void this.muneco.actuar({ nombre: 'retrete', pasos: [{ dur: 99, pose: 'sentado', cara: 'nervioso' }], bucle: true });
    }
  }

  private juego(dt: number) {
    this.tJuego += dt;
    this.capa.querySelector('.cohete-tiempo')!.textContent = `${this.tJuego.toFixed(1)} s`;
    // Teclado (pruebas en el computador)
    const ej = (this.teclas.has('arrowright') || this.teclas.has('d') ? 1 : 0) - (this.teclas.has('arrowleft') || this.teclas.has('a') ? 1 : 0);
    const ei = (this.teclas.has('arrowup') || this.teclas.has('w') ? 1 : 0) - (this.teclas.has('arrowdown') || this.teclas.has('s') ? 1 : 0);
    this.meta.x += ej * dt * 7;
    this.meta.y += ei * dt * 7;
    this.meta.x = THREE.MathUtils.clamp(this.meta.x, -this.limites.x, this.limites.x * 0.35);
    this.meta.y = THREE.MathUtils.clamp(this.meta.y, -this.limites.y, this.limites.y);
    const antes = this.nave.position.y;
    this.nave.position.x += (this.meta.x - this.nave.position.x) * Math.min(1, dt * 9);
    this.nave.position.y += (this.meta.y - this.nave.position.y) * Math.min(1, dt * 9);
    // Se inclina según sube o baja
    const vy = (this.nave.position.y - antes) / Math.max(dt, 1e-3);
    this.nave.rotation.z += (THREE.MathUtils.clamp(-vy * 0.05, -0.4, 0.4) - 0.15 - this.nave.rotation.z) * Math.min(1, dt * 6);
    // Asteroides: cada vez más seguidos y más rápidos
    this.proxRoca -= dt;
    if (this.proxRoca <= 0) {
      this.nuevaRoca();
      this.proxRoca = Math.max(0.26, 0.95 - this.tJuego * 0.012) * rnd(0.7, 1.3);
    }
    this.proxFrase -= dt;
    if (this.proxFrase <= 0) {
      this.decir(elegir(FRASES[this.o.rol]), 3.2);
      this.proxFrase = rnd(4.5, 7);
    }
    // ¿Chocó? (un círculo un poquito más chico que el retrete con el personaje: se perdonan los roces)
    const radio = 0.82;
    for (const r of this.rocas) {
      const d = Math.hypot(r.m.position.x - this.nave.position.x, r.m.position.y - (this.nave.position.y + 0.5));
      if (d < r.r * 0.85 + radio) return this.chocar();
      if (!r.casi && d < r.r + radio + 0.55 && r.m.position.x < this.nave.position.x) {
        r.casi = true;
        this.decir(elegir(CASI), 1.4);
        nota(1200, 0.12, 0, 'sine', 0.05, 700);
      }
    }
  }

  private nuevaRoca() {
    const r = rnd(0.35, 1.25) * (this.tJuego > 25 ? rnd(0.8, 1.2) : 1);
    const m = new THREE.Mesh(this.formas[Math.floor(Math.random() * this.formas.length)], this.matRoca);
    m.scale.setScalar(r);
    m.position.set(this.limites.x + 2 + r, rnd(-this.limites.y - 0.4, this.limites.y + 0.4), 0);
    this.escena.add(m);
    this.rocas.push({ m, r, v: rnd(3.2, 5.5) + this.tJuego * 0.09, giro: new THREE.Vector3(rnd(-2, 2), rnd(-2, 2), rnd(-2, 2)), casi: false });
  }

  private moverRocas(dt: number) {
    this.rocas = this.rocas.filter((r) => {
      r.m.position.x -= r.v * dt;
      r.m.rotation.x += r.giro.x * dt;
      r.m.rotation.y += r.giro.y * dt;
      if (r.m.position.x < -this.limites.x - 3) {
        this.escena.remove(r.m);
        return false;
      }
      return true;
    });
  }

  private chocar() {
    this.fase = 'choque';
    this.tChoque = 0;
    this.temblor = 0.9;
    this.decir(elegir(FIN), 2);
    void this.muneco.actuar({ nombre: 'retrete', pasos: [{ dur: 99, pose: 'sentado', cara: 'llorando' }], bucle: true });
    this.capa.querySelector('.cohete-destello')!.classList.add('va');
    rumor(1.4, 140, 0.2, 0, 0.5, 60);
    nota(110, 0.9, 0, 'sawtooth', 0.08, 40);
    // Explosión: chispas naranjas, amarillas y humo
    for (let i = 0; i < 60; i++) {
      const color = ['#ff9f1c', '#ffe066', '#e4574b', '#8d7b6a', '#ffffff'][i % 5];
      const m = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.05, 0.16), 6, 4), new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false }));
      m.position.copy(this.nave.position);
      const a = rnd(0, Math.PI * 2), v = rnd(2, 8);
      this.escena.add(m);
      this.chispas.push({ m, v: new THREE.Vector3(Math.cos(a) * v, Math.sin(a) * v, rnd(-2, 2)), vida: rnd(0.6, 1.4) });
    }
  }

  private tChoque = 0;
  private choque(dt: number) {
    this.tChoque += dt;
    // Cae dando vueltas hacia la Tierra
    this.nave.rotation.z += dt * 7;
    this.nave.position.y -= dt * (2 + this.tChoque * 6);
    this.nave.position.x -= dt * 1.5;
    if (this.tChoque > 2.2) this.terminar();
  }

  private moverChispas(dt: number) {
    this.chispas = this.chispas.filter((c) => {
      c.vida -= dt;
      c.m.position.addScaledVector(c.v, dt);
      c.v.multiplyScalar(1 - dt * 1.5);
      (c.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, c.vida);
      if (c.vida <= 0) {
        this.escena.remove(c.m);
        if (c.m.geometry !== this.bolita) c.m.geometry.dispose();
        (c.m.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });
  }

  // ------------------------------------------------------------------ Textos
  private tGlobo = 0;
  private decir(texto: string, dur: number) {
    const g = this.capa.querySelector<HTMLElement>('.cohete-globo')!;
    g.textContent = texto;
    g.hidden = false;
    g.classList.remove('sale');
    void g.offsetWidth;
    g.classList.add('sale');
    this.tGlobo = dur;
  }

  /** El globito sigue al personaje por la pantalla. */
  private globo(dt: number) {
    const g = this.capa.querySelector<HTMLElement>('.cohete-globo')!;
    if (g.hidden) return;
    this.tGlobo -= dt;
    if (this.tGlobo <= 0) {
      g.hidden = true;
      return;
    }
    const p = this.nave.position.clone().add(new THREE.Vector3(0.3, 2.5, 0)).project(this.camara);
    g.style.left = `${(p.x * 0.5 + 0.5) * window.innerWidth}px`;
    g.style.top = `${(-p.y * 0.5 + 0.5) * window.innerHeight}px`;
  }

  private aviso(texto: string) {
    const a = this.capa.querySelector<HTMLElement>('.cohete-aviso')!;
    a.textContent = texto;
    a.classList.remove('sale');
    void a.offsetWidth;
    a.classList.add('sale');
  }

  private terminar() {
    this.fase = 'fin';
    cancelAnimationFrame(this.cuadro);
    window.removeEventListener('resize', this.ajustar);
    window.removeEventListener('keydown', this.tecla);
    window.removeEventListener('keyup', this.tecla);
    this.capa.classList.remove('visible');
    const segundos = Math.round(this.tJuego * 10) / 10;
    setTimeout(() => {
      this.renderer.dispose();
      // Suelta el contexto 3D de una vez: si no, se van acumulando y el celular le quita el suyo a la casa (pantalla en blanco)
      this.renderer.forceContextLoss();
      this.capa.remove();
      if (cohete.actual === this) cohete.actual = null;
      this.listo({ segundos });
    }, 450);
  }
}

/** Para las pruebas: el juego en curso. */
export const cohete: { actual: RetreteEspacial | null } = { actual: null };
