// El cine de las escenas premium: una capa a pantalla completa con un cuarto de la casa (o el escenario
// grande), los dos muñequitos actuando su guion, la cámara que se mueve entre planos, subtítulos,
// globitos, efectos, cosas que vuelan y partículas. Se salta tocando la ×.
import { N8AOPass } from 'n8ao';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { otro, type Rol, type Ropa } from '../casa/modelo';
import { Vestuario } from '../casa/ropa';
import { cargar, copia } from '../recursos';
import { COREOS } from '../reacciones/coreografias';
import { type Anclas, Efectos } from '../reacciones/efectos';
import { Muneco } from '../reacciones/muneco';
import { sonar } from '../reacciones/sonidos';
import { utileria } from '../reacciones/utileria';
import './cine.css';
import type { Actor, Escena, Hace, Particulas, Plano, Punto, Toma } from './tipos';

const ESCALA = 0.68;
/** Pruebas: el tiempo solo avanza con `simular`. */
const CONGELADO = new URLSearchParams(location.search).has('congelar');
const rad = THREE.MathUtils.degToRad;
/** Hacia dónde está el lado abierto de los cuartos (donde va la cámara, como en la casa). */
const ABIERTO = new THREE.Vector3(Math.sin(rad(34)), 0, Math.cos(rad(34)));
/** Distancia de un punto al segmento a–b. */
function distSegmento(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) {
  const ab = b.clone().sub(a);
  const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
  return a.clone().addScaledVector(ab, t).distanceTo(p);
}
/** Punto del cuarto (x, y de casa.json) → three. */
const aTres = (x: number, y: number, alto = 0) => new THREE.Vector3(x, alto, -y);

interface Particula {
  m: THREE.Mesh;
  v: THREE.Vector3;
  giro: THREE.Vector3;
  vida: number;
  cae: number;
}

interface Volando {
  o: THREE.Object3D;
  de: THREE.Vector3;
  a: THREE.Vector3;
  t: number;
}

export class Cine {
  private capa: HTMLElement;
  private lienzo: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private escena3 = new THREE.Scene();
  private composer: EffectComposer;
  private camara = new THREE.PerspectiveCamera(40, 1, 0.05, 60);
  private camPos = new THREE.Vector3();
  private camMira = new THREE.Vector3();
  private metaPos = new THREE.Vector3();
  private metaMira = new THREE.Vector3();
  private plano: Plano = 'general';
  private temblor = 0;
  private m: Record<Actor, Muneco>;
  private efectos: Efectos;
  private anclas: Record<Actor, Anclas>;
  private objetos = new Map<string, THREE.Object3D>();
  private volando: Volando[] = [];
  private particulas: Particula[] = [];
  private t = 0;
  private i = 0;
  private fin = false;
  private ultimo = 0;
  private terminar: () => void = () => undefined;

  private constructor(private e: Escena, private roles: Record<Actor, Rol>, private rapido: number) {
    this.capa = document.createElement('div');
    this.capa.className = `cine cine-${e.lugar}`;
    this.capa.innerHTML = `<canvas class="cine-lienzo"></canvas><div class="cine-efectos"></div>
      <p class="cine-titulo"><b>${e.nombre}</b></p><p class="cine-sub" hidden></p>
      <button class="cine-saltar" aria-label="Saltar la escena">×</button><div class="cine-flash"></div>`;
    document.body.append(this.capa);
    this.lienzo = this.capa.querySelector('canvas')!;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.lienzo, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.4;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena3.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.escena3.environmentIntensity = 0.5;
    // Luz de película: la del sol por la ventana (como en la casa), un relleno frío del lado de la cámara y
    // una luz de contorno por detrás que separa el pelo del fondo
    const sol = new THREE.DirectionalLight('#fff1e2', 2.3);
    sol.position.set(-5, 9, 6);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.015;
    sol.shadow.radius = 4;
    Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 25 });
    const relleno = new THREE.DirectionalLight('#e6f0ff', 0.75);
    relleno.position.set(6, 4, 8);
    const contorno = new THREE.DirectionalLight('#ffd9b0', 1.1);
    contorno.position.set(1, 5, -7);
    this.escena3.add(new THREE.HemisphereLight('#fff1e4', '#e0c4ae', 1.0), sol, relleno, contorno);
    // Sombras de contacto (oclusión ambiental) y antialias, como la casa pero en calidad alta
    this.composer = new EffectComposer(this.renderer);
    const ao = new N8AOPass(this.escena3, this.camara, window.innerWidth, window.innerHeight);
    Object.assign(ao.configuration, { gammaCorrection: false, aoRadius: 0.55, distanceFalloff: 0.3, intensity: 3.2, halfRes: false });
    ao.configuration.color = new THREE.Color('#2a1a14');
    ao.setQualityMode(window.devicePixelRatio > 2.5 ? 'Medium' : 'High');
    this.composer.addPass(ao);
    this.composer.addPass(new SMAAPass(window.innerWidth, window.innerHeight));
    this.composer.addPass(new OutputPass());
    this.m = { A: new Muneco(roles.A, ESCALA), B: new Muneco(roles.B, ESCALA) };
    this.m.A.otro = this.m.B;
    this.m.B.otro = this.m.A;
    this.efectos = new Efectos(this.capa.querySelector('.cine-efectos')!, rapido);
    this.anclas = { A: this.anclasDe('A'), B: this.anclasDe('B') };
    for (const a of ['A', 'B'] as Actor[]) this.m[a].alEfecto = (fx) => this.efectos.lanzar(fx, this.anclas[a], this.anclas[a === 'A' ? 'B' : 'A']);
    this.capa.querySelector('.cine-saltar')!.addEventListener('click', () => this.acabar());
    window.addEventListener('resize', this.ajustar);
  }

  /** Reproduce una escena; `roles` dice quién es A y quién B. Termina al acabar o al saltarla. */
  static async reproducir(e: Escena, quienLanza: Rol, rapido = 1): Promise<void> {
    const A = e.de ?? quienLanza;
    const c = new Cine(e, { A, B: otro(A) }, rapido);
    cineActual.c = c;
    await c.preparar();
    return new Promise((listo) => {
      c.terminar = listo;
      c.capa.classList.add('visible');
      requestAnimationFrame((t) => c.cuadro(t));
    });
  }

  private anclasDe(a: Actor): Anclas {
    const m = this.m[a];
    const aCapa = (v: THREE.Vector3, radio: number) => {
      const w = this.lienzo.clientWidth, h = this.lienzo.clientHeight;
      const p = v.clone().project(this.camara);
      const borde = v.clone().add(new THREE.Vector3(radio, 0, 0).applyQuaternion(this.camara.quaternion)).project(this.camara);
      return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h, r: Math.max(10, (Math.hypot(borde.x - p.x, borde.y - p.y) / 2) * w) };
    };
    return {
      cabeza: () => aCapa(m.puntoCabeza(), m.radioCabeza),
      cara: () => aCapa(m.puntoCara(), m.radioCabeza),
      pies: () => aCapa(m.puntoPies(), m.radioCabeza),
      lado: () => {
        const derecha = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camara.quaternion);
        const frente = new THREE.Vector3(Math.sin(m.p.rot), 0, Math.cos(m.p.rot));
        return frente.dot(derecha) >= 0 ? 1 : -1;
      },
    };
  }

  private async preparar() {
    const e = this.e;
    // El lugar: un cuarto de la casa o el escenario grande
    if (e.lugar === 'grande') {
      this.escena3.background = new THREE.Color('#f6dccd');
      const piso = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshStandardMaterial({ color: '#f2c9a8', roughness: 0.9 }));
      piso.rotation.x = -Math.PI / 2;
      piso.receiveShadow = true;
      this.escena3.add(piso);
      const telon = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 4, 48, 1, true, Math.PI * 0.75, Math.PI * 1.5), new THREE.MeshStandardMaterial({ color: '#e86a8a', roughness: 0.8, side: THREE.BackSide }));
      telon.position.set(0, 2, 0.6);
      this.escena3.add(telon);
    } else {
      this.escena3.background = new THREE.Color('#c7c1ba');
      try {
        const cuarto = copia(await cargar(`casa_${e.lugar}.glb`));
        cuarto.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        this.escena3.add(cuarto);
      } catch {
        /* sin el cuarto: igual se actúa sobre el fondo */
      }
    }
    // Los dos, vestidos como en la casa
    let vestidos: Record<Rol, { ropa?: Ropa; colorPelo?: string }> | null = null;
    try {
      vestidos = JSON.parse(localStorage.getItem('nuestro-hogar-vestidos') ?? 'null');
    } catch {
      /* sin ropa guardada */
    }
    await Promise.all(
      (['A', 'B'] as Actor[]).map(async (a) => {
        const m = this.m[a];
        await m.cargar();
        const v = vestidos?.[this.roles[a]];
        if (v?.ropa || v?.colorPelo) await new Vestuario(m.p, this.roles[a]).aplicar(v.ropa, v.colorPelo).catch(() => undefined);
        m.p.grupo.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) o.castShadow = true;
        });
        const [x, y, rot] = e.inicio[a];
        const p = aTres(x, y);
        m.ponerEn(p.x, p.z, rad(rot));
        const prop = e.props?.[a];
        if (prop) m.sostener(prop);
        this.escena3.add(m.p.grupo);
      }),
    );
    this.ajustar();
    this.encuadre('general', true);
  }

  private ajustar = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
  };

  /** Dónde va la cámara para cada plano (siempre del lado abierto del cuarto, como en la casa). */
  private encuadre(p: Plano, corte = false) {
    this.plano = p;
    const a = this.m.A.p.grupo.position, b = this.m.B.p.grupo.position;
    const alto = this.m.A.alto * ESCALA;
    // Dirección de la casa (38° a un lado) pero más bajita, como una cámara de película
    const dir = (az: number, el: number) => new THREE.Vector3(Math.sin(rad(az)) * Math.cos(rad(el)), Math.sin(rad(el)), Math.cos(rad(az)) * Math.cos(rad(el)));
    const grande = this.e.lugar === 'grande';
    if (p === 'general') {
      const centro = grande ? new THREE.Vector3(0, alto * 0.6, 0) : new THREE.Vector3(0, 0.9, -0.2);
      this.metaMira.copy(centro);
      this.metaPos.copy(centro).addScaledVector(grande ? dir(0, 10) : dir(30, 26), grande ? 5.2 : 7.2);
    } else if (p === 'dos') {
      const centro = a.clone().add(b).multiplyScalar(0.5).setY(alto * 0.5);
      const sep = Math.hypot(b.x - a.x, b.z - a.z);
      // De costado a la línea entre los dos, del lado abierto del cuarto y en tres cuartos
      let n = new THREE.Vector3(-(b.z - a.z), 0, b.x - a.x);
      if (n.lengthSq() < 1e-4) n.set(0.5, 0, 0.87);
      n.normalize();
      if (n.dot(ABIERTO) < 0) n.negate();
      // Un poquito hacia el lado abierto (tres cuartos), sin llegar a que uno tape al otro
      n.lerp(ABIERTO, 0.4).normalize();
      this.metaMira.copy(centro);
      this.metaPos.copy(centro).addScaledVector(new THREE.Vector3(n.x, Math.tan(rad(grande ? 8 : 13)), n.z).normalize(), Math.max(3.5, sep * 1.4 + 2.4));
    } else {
      const actor: Actor = p === 'A' || p === 'caraA' ? 'A' : 'B';
      const m = this.m[actor];
      const cerca = p.startsWith('cara');
      const foco = cerca ? m.puntoCabeza().setY(m.puntoCabeza().y - alto * 0.05) : m.p.grupo.position.clone().setY(alto * 0.5);
      // Hacia donde mira el actor, pero siempre desde el lado abierto (si mira al fondo, de tres cuartos)
      const f = new THREE.Vector3(Math.sin(m.p.rot), 0, Math.cos(m.p.rot));
      const base = f.dot(ABIERTO) < 0.25 ? f.clone().multiplyScalar(0.25).add(ABIERTO.clone().multiplyScalar(0.75)) : f.clone().multiplyScalar(0.65).add(ABIERTO.clone().multiplyScalar(0.35));
      const dist = cerca ? 1.7 : 2.6;
      // Que el otro no quede en medio: se prueba girando la cámara hacia un lado o al otro
      const otroPos = this.m[actor === 'A' ? 'B' : 'A'].p.grupo.position;
      let mejor = base.setY(0).normalize();
      for (const giro of [0, 0.5, -0.5, 0.9, -0.9]) {
        const n = mejor.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), giro);
        if (n.dot(ABIERTO) < -0.1) continue;
        const cam = foco.clone().addScaledVector(n, dist);
        if (distSegmento(otroPos.clone().setY(foco.y), foco, cam) > alto * 0.45) {
          mejor = n;
          break;
        }
      }
      this.metaMira.copy(foco);
      this.metaPos.copy(foco).addScaledVector(new THREE.Vector3(mejor.x, Math.tan(rad(cerca ? 5 : 11)), mejor.z).normalize(), dist);
    }
    if (!grande) {
      // Nunca detrás de las paredes del fondo ni de la izquierda
      this.metaPos.x = THREE.MathUtils.clamp(this.metaPos.x, -2.3, 6);
      this.metaPos.z = Math.max(this.metaPos.z, -1.5);
    }
    if (corte) {
      this.camPos.copy(this.metaPos);
      this.camMira.copy(this.metaMira);
    }
  }

  private cuadro(ms: number) {
    if (this.fin) return;
    requestAnimationFrame((t) => this.cuadro(t));
    const dt = Math.min(0.05, (ms - (this.ultimo || ms)) / 1000) * this.rapido;
    this.ultimo = ms;
    // En pruebas el tiempo y el dibujo solo avanzan con `simular` (el navegador de pruebas va muy lento)
    if (CONGELADO) return;
    this.paso(dt);
    this.composer.render();
  }

  /** Pruebas en computadores lentos: adelanta la escena y pinta una vez. */
  simular(seg: number) {
    if (seg <= 0) this.paso(0);
    for (let t = 0; t < seg; t += 1 / 30) this.paso(1 / 30);
    this.composer.render();
  }

  private paso(dt: number) {
    this.t += dt;
    const g = this.e.guion;
    while (this.i < g.length && g[this.i].t <= this.t) this.ejecutar(g[this.i++]);
    for (const a of ['A', 'B'] as Actor[]) this.m[a].update(dt);
    // La cámara sigue su plano (los planos de los actores se recalculan porque ellos se mueven)
    if (this.plano !== 'general') this.encuadre(this.plano);
    const k = Math.min(1, dt * 2.6);
    this.camPos.lerp(this.metaPos, k);
    this.camMira.lerp(this.metaMira, k);
    this.camara.position.copy(this.camPos);
    if (this.temblor > 0) {
      this.temblor = Math.max(0, this.temblor - dt);
      this.camara.position.x += (Math.random() - 0.5) * this.temblor * 0.15;
      this.camara.position.y += (Math.random() - 0.5) * this.temblor * 0.15;
    }
    this.camara.lookAt(this.camMira);
    this.moverVolando(dt);
    this.moverParticulas(dt);
    this.efectos.cuadro(dt);
    if (this.t >= this.e.dur) this.acabar();
  }

  private ejecutar(toma: Toma) {
    // La cámara primero: así «mirar al otro» ya sabe desde dónde se filma
    if (toma.camara) this.encuadre(toma.camara, toma.camara === 'general');
    for (const a of ['A', 'B'] as Actor[]) {
      const h = toma[a];
      if (h !== undefined) this.hacer(a, h);
    }
    if (toma.dice) this.efectos.globo(toma.dice[1], this.anclas[toma.dice[0]], 2.4 / this.rapido);
    if (toma.sub !== undefined) this.subtitulo(toma.sub);
    for (const [a, fx] of toma.fx ?? []) this.efectos.lanzar(fx, this.anclas[a], this.anclas[a === 'A' ? 'B' : 'A']);
    sonar(toma.sonido);
    if (toma.objeto) this.objeto(toma.objeto);
    if (toma.particulas) this.soltarParticulas(...toma.particulas);
    if (toma.flash) {
      const f = this.capa.querySelector<HTMLElement>('.cine-flash')!;
      f.classList.remove('va');
      void f.offsetWidth;
      f.classList.add('va');
      sonar('flash');
    }
    if (toma.temblor) this.temblor = toma.temblor;
  }

  private hacer(a: Actor, h: Hace) {
    const m = this.m[a];
    if (typeof h === 'string') {
      void m.actuar(COREOS[h] ?? h);
      return;
    }
    if (h.en) {
      const p = aTres(h.en[0], h.en[1]);
      m.ponerEn(p.x, p.z, m.rotBase);
    }
    if (h.prop !== undefined) m.sostener(h.prop);
    // En la primera toma ya están sentados o acostados (no se ve cómo se suben)
    const ya = this.t < 0.05;
    if (h.alto !== undefined) m.elevar(h.alto, ya);
    if (h.acostado !== undefined) m.recostar(h.acostado ? 1 : 0, ya);
    if (h.ir) {
      const p = aTres(h.ir[0], h.ir[1]);
      void m.irA(p.x, p.z, h.vel ?? 1.1, this.rotDe(a, h.rot, p));
    } else if (h.rot !== undefined) {
      const r = this.rotDe(a, h.rot);
      if (r !== undefined) m.girarA(r);
    }
    if (h.coreo) void m.actuar(COREOS[h.coreo] ?? h.coreo);
    if (h.pasos) void m.actuar({ nombre: 'escena', pasos: h.pasos, prioridad: 5 });
  }

  /** Giro para `rot` visto desde `desde` (donde va a quedar parado; por defecto donde está). */
  private rotDe(a: Actor, rot: number | 'otro' | 'camara' | undefined, desde?: THREE.Vector3): number | undefined {
    if (rot === undefined) return undefined;
    const aqui = desde ?? this.m[a].p.grupo.position;
    const hacia = (v: THREE.Vector3) => Math.atan2(v.x - aqui.x, v.z - aqui.z);
    if (rot === 'otro') {
      // Como en el teatro: hacia el otro pero abiertos a la cámara, de tres cuartos (con el pelo tan grande,
      // de perfil no se les ve la cara)
      const alOtro = hacia(this.m[a === 'A' ? 'B' : 'A'].p.grupo.position);
      const aCamara = hacia(this.metaPos);
      const d = Math.atan2(Math.sin(aCamara - alOtro), Math.cos(aCamara - alOtro));
      return alOtro + d * 0.35;
    }
    if (rot === 'camara') return hacia(this.metaPos);
    return rad(rot);
  }

  private subtitulo(texto: string) {
    const p = this.capa.querySelector<HTMLElement>('.cine-sub')!;
    p.hidden = !texto;
    p.textContent = texto;
  }

  // ------------------------------------------------------------------ Cosas sueltas y partículas
  private objeto(o: NonNullable<Toma['objeto']>) {
    let obj = this.objetos.get(o.id);
    if (o.quitar) {
      if (obj) this.escena3.remove(obj);
      this.objetos.delete(o.id);
      return;
    }
    if (!obj && o.prop) {
      obj = utileria(o.prop, this.m.A.alto);
      obj.visible = true;
      obj.scale.setScalar(ESCALA);
      obj.traverse((x) => {
        if ((x as THREE.Mesh).isMesh) x.castShadow = true;
      });
      this.escena3.add(obj);
      this.objetos.set(o.id, obj);
    }
    if (!obj) return;
    if (o.en) obj.position.copy(aTres(o.en[0], o.en[1], o.en[2]));
    if (o.volar) this.volando.push({ o: obj, de: obj.position.clone(), a: aTres(o.volar[0], o.volar[1], o.volar[2]), t: 0 });
  }

  private moverVolando(dt: number) {
    this.volando = this.volando.filter((v) => {
      v.t = Math.min(1, v.t + dt / 0.7);
      v.o.position.lerpVectors(v.de, v.a, v.t);
      v.o.position.y += Math.sin(v.t * Math.PI) * 0.9;
      v.o.rotation.x += dt * 9;
      v.o.rotation.z += dt * 6;
      if (v.t >= 1) {
        v.o.rotation.set(0, v.o.rotation.y, Math.PI * 0.08);
        this.temblor = 0.25;
        sonar('plaf');
      }
      return v.t < 1;
    });
  }

  private soltarParticulas(tipo: Particulas, donde: Actor | Punto) {
    const centro = typeof donde === 'string' ? this.m[donde].puntoCabeza() : aTres(donde[0], donde[1], 0.5);
    const cuantas = tipo === 'plumas' ? 40 : tipo === 'fichas' ? 18 : 26;
    const colores: Record<Particulas, string[]> = {
      fichas: ['#e4574b', '#5b8fd6', '#f6cf5a', '#8fd3b6', '#fff8ee'],
      plumas: ['#ffffff', '#fff8ee'],
      crema: ['#fff8ee', '#f4b6c2'],
      petalos: ['#e86a8a', '#f4b6c2', '#e4574b'],
      corazones: ['#e86a8a', '#e4574b'],
      agua: ['#9ccbef', '#cfe9ff'],
      estrellas: ['#f6cf5a'],
      palomitas: ['#fff3c4', '#fff8ee'],
      burbujas: ['#e8f6ff', '#f4e8ff', '#ffffff'],
    };
    for (let i = 0; i < cuantas; i++) {
      const color = colores[tipo][i % colores[tipo].length];
      const geo =
        tipo === 'fichas' ? new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12)
        : tipo === 'plumas' || tipo === 'petalos' ? new THREE.PlaneGeometry(0.07, 0.03)
        : tipo === 'estrellas' ? new THREE.OctahedronGeometry(0.04)
        : new THREE.SphereGeometry(tipo === 'agua' ? 0.025 : tipo === 'burbujas' ? 0.03 + Math.random() * 0.05 : 0.035, 10, 8);
      const burbuja = tipo === 'burbujas';
      const m = new THREE.Mesh(
        geo,
        burbuja
          ? new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, transmission: 0.6, iridescence: 1, transparent: true, opacity: 0.7 })
          : new THREE.MeshStandardMaterial({ color, roughness: 0.6, side: THREE.DoubleSide, transparent: true }),
      );
      m.position.copy(centro);
      const ang = Math.random() * Math.PI * 2;
      const fuerza = tipo === 'plumas' || tipo === 'petalos' ? 0.8 : burbuja ? 0.35 : 2;
      const v = new THREE.Vector3(Math.cos(ang) * fuerza * Math.random(), burbuja ? 0.15 + Math.random() * 0.3 : 1 + Math.random() * 2.2, Math.sin(ang) * fuerza * Math.random());
      this.escena3.add(m);
      // Las burbujas suben despacito (gravedad al revés) y duran más
      const cae = tipo === 'plumas' || tipo === 'petalos' ? 0.8 : burbuja ? -0.25 : 6;
      this.particulas.push({ m, v, giro: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8), vida: burbuja ? 3.5 + Math.random() * 1.5 : 2.6 + Math.random(), cae });
    }
  }

  private moverParticulas(dt: number) {
    this.particulas = this.particulas.filter((p) => {
      p.vida -= dt;
      p.v.y -= p.cae * dt;
      // Las livianas bajan meciéndose
      if (p.cae < 2) p.v.x = Math.sin(p.vida * 4) * 0.5;
      p.m.position.addScaledVector(p.v, dt);
      if (p.m.position.y < 0.02) {
        p.m.position.y = 0.02;
        p.v.set(p.v.x * 0.5, Math.abs(p.v.y) * 0.3, p.v.z * 0.5);
      }
      p.m.rotation.x += p.giro.x * dt;
      p.m.rotation.y += p.giro.y * dt;
      (p.m.material as THREE.MeshStandardMaterial).opacity = Math.min(p.cae < 0 ? 0.7 : 1, p.vida);
      if (p.vida <= 0) {
        this.escena3.remove(p.m);
        p.m.geometry.dispose();
        return false;
      }
      return true;
    });
  }

  private acabar() {
    if (this.fin) return;
    this.fin = true;
    this.capa.classList.remove('visible');
    window.removeEventListener('resize', this.ajustar);
    setTimeout(() => {
      this.efectos.limpiar();
      this.composer.dispose();
      this.renderer.dispose();
      this.capa.remove();
      if (cineActual.c === this) cineActual.c = null;
      this.terminar();
    }, 450);
  }
}

/** Para las pruebas: la escena que se está viendo. */
export const cineActual: { c: Cine | null } = { c: null };
