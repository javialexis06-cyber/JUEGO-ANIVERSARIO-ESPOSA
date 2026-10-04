// Lo que hay que esquivar en el retrete espacial, tramo por tramo: pájaros, aviones y la chancla de la mamá en el
// cielo del barrio; satélites y basura espacial en la órbita; asteroides de todos los tamaños; ovnis que disparan;
// cometas con aviso; lluvias de meteoritos y agujeros negros que jalan. Cada vez más seguido según la distancia.
import * as THREE from 'three';
import { nota, rumor } from '../../sonido';
import { CUADRO } from './arte';
import type { Efectos } from './efectos';
import type { Modelos, TipoBasura } from './modelos';
import { Auras, Borde, ROJO_PELIGRO, ladoAura } from './resaltar';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export type TipoObst = 'roca' | 'meteoro' | 'satelite' | 'inodoro' | 'chancla' | 'lata' | 'ovni' | 'avion' | 'pajaro' | 'cometa' | 'agujero' | 'rayo';

/** Círculo de choque relativo al centro (antes de girar). */
type Circulo = [number, number, number];

export interface Obst {
  tipo: TipoObst;
  obj: THREE.Object3D;
  x: number;
  y: number;
  /** Velocidad propia (además de la del mundo). */
  vx: number;
  vy: number;
  /** Qué tanto lo arrastra el mundo (1: está quieto en el espacio). */
  arrastre: number;
  giro: THREE.Vector3;
  rot: number;
  circulos: Circulo[];
  radio: number;
  vivo: boolean;
  t: number;
  destruible: boolean;
  puntos: number;
  /** Lo más cerca que pasó de la nave (para el «¡por un pelito!»). */
  holgura: number;
  pasado: boolean;
  /** Datos propios (ovni, cometa, agujero). */
  fase?: string;
  n?: number;
  extra?: THREE.Object3D;
}

/** Cómo va la nave (para apuntar, jalar y medir). */
export interface Blanco {
  x: number;
  y: number;
  r: number;
}

export interface Eventos {
  aviso: (y: number, tipo: 'cometa' | 'avion' | 'rayo') => void;
  /** Una lluvia de meteoritos empieza (true) o termina (false). */
  lluvia: (empieza: boolean) => void;
  frase: (texto: string) => void;
}

const DISCO_V = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DISCO_F = /* glsl */ `
uniform float tiempo;
varying vec2 vUv;
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float a = atan(p.y, p.x);
  float remolino = sin(a * 3.0 - r * 9.0 + tiempo * 4.0) * 0.5 + 0.5;
  float banda = smoothstep(0.32, 0.45, r) * smoothstep(1.0, 0.55, r);
  float brillo = banda * (0.55 + 0.45 * remolino);
  vec3 col = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.95, 0.8), smoothstep(0.75, 0.4, r));
  col = mix(col, vec3(0.7, 0.3, 1.0), smoothstep(0.7, 1.0, r) * 0.6);
  gl_FragColor = vec4(col * brillo * 1.6, brillo);
  #include <colorspace_fragment>
}`;

export class Obstaculos {
  lista: Obst[] = [];
  private proximo = 4;
  private lluviaHasta = 0;
  private proxLluvia = 0;
  private proxAgujero = 0;
  private proxOvni = 0;
  private libres = new Map<string, THREE.Object3D[]>();
  private texHalo: THREE.Texture;
  private matCometa: THREE.MeshStandardMaterial;
  private tiempo = 0;
  /** Estadísticas que piden las misiones. */
  cuentas = { cometas: 0, chanclas: 0, lluvias: 0, agujeros: 0 };
  /** Mientras dura un evento (lluvia) no salen obstáculos normales. */
  enLluvia = false;
  /** Lo que hace perder se ve rojo: borde encendido en el material y un aura alrededor. */
  private borde = new Borde(ROJO_PELIGRO, 2.2, 1.6, 'peligro');
  private auras = new Auras(ROJO_PELIGRO, 220, { borde: true, aditiva: false, opacidad: 0.8 });

  constructor(
    private grupo: THREE.Group,
    private modelos: Modelos,
    private fx: Efectos,
    private ev: Eventos,
    texHalo: THREE.Texture,
  ) {
    this.texHalo = texHalo;
    this.matCometa = new THREE.MeshStandardMaterial({ color: '#CFEFFF', vertexColors: true, roughness: 0.4, emissive: '#7FD8FF', emissiveIntensity: 0.45 });
    this.grupo.add(this.auras.malla);
  }

  // ------------------------------------------------------------------ Piezas
  private pedir(clave: string, crear: () => THREE.Object3D) {
    const l = this.libres.get(clave);
    const o = l?.pop() ?? crear();
    o.userData.clave = clave;
    o.visible = true;
    if (!o.parent) this.grupo.add(o);
    return o;
  }

  private soltar(o: THREE.Object3D) {
    o.visible = false;
    const c = o.userData.clave as string;
    const l = this.libres.get(c) ?? [];
    l.push(o);
    this.libres.set(c, l);
  }

  private nuevo(tipo: TipoObst, obj: THREE.Object3D, x: number, y: number, radio: number, extra: Partial<Obst> = {}): Obst {
    const o: Obst = {
      tipo, obj, x, y, vx: 0, vy: 0, arrastre: 1, giro: new THREE.Vector3(), rot: 0, circulos: [[0, 0, radio]], radio, vivo: true, t: 0, destruible: true,
      puntos: 25, holgura: Infinity, pasado: false, ...extra,
    };
    obj.position.set(x, y, 0);
    this.lista.push(o);
    return o;
  }

  roca(x: number, y: number, r: number, tramo: number, vx = rnd(-1.5, 0.3), vy = rnd(-0.4, 0.4)) {
    const chica = r < 0.55;
    const formas = chica ? this.modelos.asteroidesChicos : this.modelos.asteroides;
    const k = Math.floor(Math.random() * formas.length);
    const mat = this.modelos.matRocas[Math.min(tramo, this.modelos.matRocas.length - 1)];
    const m = this.pedir(`roca${chica ? 'c' : 'g'}${k}`, () => new THREE.Mesh(formas[k], mat)) as THREE.Mesh;
    m.material = this.borde.material(mat);
    m.scale.setScalar(r);
    m.rotation.set(Math.random() * 6, Math.random() * 6, 0);
    return this.nuevo('roca', m, x, y, r * 0.86, { vx, vy, giro: new THREE.Vector3(rnd(-1.5, 1.5), rnd(-1.5, 1.5), rnd(-0.6, 0.6)), puntos: Math.round(15 + r * 20) });
  }

  private basura(tipo: TipoBasura, x: number, y: number) {
    const lado = { satelite: 3.6, inodoro: 1.5, chancla: 1.1, lata: 0.7, ovni: 2.6, avion: 5.2, pajaro: 0.75 }[tipo];
    const o = this.pedir(`b-${tipo}`, () => {
      const b = this.modelos.basura(tipo, lado);
      this.borde.aplicar(b);
      return b;
    });
    o.rotation.set(0, 0, 0);
    return o;
  }

  // ------------------------------------------------------------------ Salidas
  private satelite(x: number, y: number) {
    const o = this.basura('satelite', x, y);
    // El cuerpo y las alas de paneles (giran con él)
    return this.nuevo('satelite', o, x, y, 0.6, {
      vx: rnd(-1, 0.5), vy: rnd(-0.3, 0.3), giro: new THREE.Vector3(0.4, 0, rnd(-0.5, 0.5)),
      circulos: [[0, 0, 0.55], [1.0, 0, 0.36], [-1.0, 0, 0.36], [1.55, 0, 0.3], [-1.55, 0, 0.3]], puntos: 40,
    });
  }

  private chatarra(tipo: 'inodoro' | 'chancla' | 'lata', x: number, y: number) {
    const o = this.basura(tipo, x, y);
    const r = { inodoro: 0.62, chancla: 0.42, lata: 0.3 }[tipo];
    const giro = tipo === 'chancla' ? new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(7, 11) * (Math.random() < 0.5 ? -1 : 1)) : new THREE.Vector3(rnd(-2, 2), rnd(-2, 2), rnd(-2, 2));
    const ob = this.nuevo(tipo, o, x, y, r, { vx: tipo === 'chancla' ? rnd(-5, -2.5) : rnd(-2, 0), vy: rnd(-0.8, 0.8), giro, puntos: 30 });
    if (tipo === 'chancla' && Math.random() < 0.35) this.ev.frase(Math.random() < 0.5 ? '¡¿Esa es la chancla de mi mamá?!' : '¡La chancla voladora!');
    return ob;
  }

  private avion(limX: number, y: number) {
    const o = this.basura('avion', limX + 5, y);
    this.ev.aviso(y, 'avion');
    const ob = this.nuevo('avion', o, limX + 9, y, 0.6, {
      vx: -9, fase: 'aviso', t: 0, destruible: false, puntos: 0,
      circulos: [[-1.7, -0.05, 0.42], [-0.6, 0, 0.5], [0.6, 0, 0.5], [1.7, 0.05, 0.42], [2.2, 0.55, 0.35]],
    });
    o.visible = false;
    return ob;
  }

  private bandada(limX: number, y: number) {
    // (al principio, mientras se aprende, las bandadas son más pequeñas)
    const n = (this.tiempo < 15 ? 2 : 3) + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const fila = Math.ceil(k / 2), lado = k % 2 ? 1 : -1;
      const o = this.basura('pajaro', 0, 0);
      this.nuevo('pajaro', o, limX + 2 + fila * 0.9, y + (k ? lado * fila * 0.65 : 0), 0.3, { vx: -2.2, giro: new THREE.Vector3(), puntos: 10, n: Math.random() * 6 });
    }
  }

  private ovni(limX: number, y: number) {
    const o = this.basura('ovni', 0, 0);
    return this.nuevo('ovni', o, limX + 3, y, 1, { arrastre: 0, vx: 0, fase: 'entra', t: 0, n: 0, puntos: 120, circulos: [[0, 0.05, 0.95], [0, 0.45, 0.45]] });
  }

  private cometa(limX: number, y: number, vMundo: number) {
    const k = Math.floor(Math.random() * this.modelos.asteroidesChicos.length);
    const m = this.pedir(`cometa${k}`, () => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(this.modelos.asteroidesChicos[k], this.borde.material(this.matCometa)));
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texHalo, color: '#FF9A7A', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(2.6);
      g.add(halo);
      return g;
    });
    m.scale.setScalar(0.55);
    this.ev.aviso(y, 'cometa');
    nota(1500, 0.12, 0, 'square', 0.035);
    nota(1500, 0.12, 0.2, 'square', 0.035);
    const ob = this.nuevo('cometa', m, limX + 4, y, 0.5, { vx: -(16 + vMundo * 0.6), arrastre: 1, fase: 'aviso', t: 0, puntos: 60, destruible: true });
    m.visible = false;
    return ob;
  }

  private agujero(limX: number, y: number) {
    const g = this.pedir('agujero', () => {
      const grupo = new THREE.Group();
      const disco = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 5.2),
        new THREE.ShaderMaterial({ uniforms: { tiempo: { value: 0 } }, vertexShader: DISCO_V, fragmentShader: DISCO_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
      );
      disco.name = 'disco';
      disco.rotation.x = -1.15;
      const sombra = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 20), new THREE.MeshBasicMaterial({ color: '#000000' }));
      const lente = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texHalo, color: '#8A5CFF', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
      lente.scale.setScalar(4.2);
      const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 8, 64), new THREE.MeshBasicMaterial({ color: '#FF4A36', toneMapped: false }));
      grupo.add(lente, disco, sombra, anillo);
      return grupo;
    });
    rumor(2.5, 90, 0.08, 0, 0.6, 60);
    return this.nuevo('agujero', g, limX + 4, y, 0.9, { vx: 1.5, arrastre: 1, destruible: false, puntos: 0, circulos: [[0, 0, 0.85]] });
  }

  private meteoro(limX: number, limY: number, vMundo: number) {
    const r = rnd(0.25, 0.48);
    const o = this.roca(rnd(-limX * 0.2, limX + 6), limY + 2 + r, r, 3, -rnd(3, 6) - vMundo * 0.2, -rnd(6, 9));
    o.tipo = 'meteoro';
    o.puntos = 20;
    return o;
  }

  // ------------------------------------------------------------------ Director
  /**
   * Decide qué sale. `avance` es lo que corrió el mundo en este cuadro; `metros` la distancia; `dif` de 0 a 1.
   */
  dirigir(avance: number, metros: number, tramo: number, limX: number, limY: number, vMundo: number, dt: number, enPausa: boolean) {
    this.tiempo += dt;
    if (enPausa) return;
    const dif = Math.min(1, metros / 8000);
    // Lluvia de meteoritos (de Marte en adelante)
    if (this.enLluvia) {
      if (Math.random() < dt * (7 + dif * 6)) this.meteoro(limX, limY, vMundo);
      if (this.tiempo > this.lluviaHasta) {
        this.enLluvia = false;
        this.cuentas.lluvias++;
        this.ev.lluvia(false);
      }
      return;
    }
    if (tramo >= 3 && this.tiempo > this.proxLluvia) {
      if (this.proxLluvia > 0) {
        this.enLluvia = true;
        this.lluviaHasta = this.tiempo + 4.5;
        this.ev.lluvia(true);
        this.proxLluvia = this.tiempo + rnd(26, 36);
        return;
      }
      this.proxLluvia = this.tiempo + rnd(10, 18);
    }
    this.proximo -= avance;
    if (this.proximo > 0) return;
    // (los primeros ~25 s, mientras se aprende, salen más separados)
    const espacio = (8.2 - 3.9 * dif) * (1.35 - 0.35 * Math.min(1, this.tiempo / 25));
    this.proximo = espacio * rnd(0.75, 1.3);
    const x = limX + 3;
    const y = rnd(-limY, limY);
    const r = Math.random();
    switch (tramo) {
      case 0:
        if (metros < 60) return;
        if (r < 0.45) this.bandada(limX, rnd(-limY * 0.8, limY * 0.8));
        else if (r < 0.7) this.chatarra('chancla', x, y);
        // Los aviones salen cuando ya pasó el arranque tranquilo
        else if (r < 0.85 && metros > 150 && this.tiempo > 20) this.avion(limX, rnd(-limY * 0.7, limY * 0.7));
        else this.chatarra(Math.random() < 0.5 ? 'inodoro' : 'lata', x, y);
        return;
      case 1:
        if (r < 0.3) this.satelite(x + 1, y * 0.8);
        else if (r < 0.62) this.chatarra((['inodoro', 'chancla', 'lata'] as const)[Math.floor(Math.random() * 3)], x, y);
        else this.roca(x, y, rnd(0.35, 0.75), tramo);
        return;
      default:
        break;
    }
    // De la Luna en adelante: rocas, pares, muros con hueco, campos, y de vez en cuando lo raro
    const raro = Math.random();
    if (tramo >= 2 && this.tiempo > this.proxOvni && raro < 0.12 && !this.lista.some((o) => o.tipo === 'ovni')) {
      this.proxOvni = this.tiempo + rnd(14, 22) - dif * 6;
      this.ovni(limX, y * 0.6);
      return;
    }
    if (tramo >= 3 && raro > 0.86) {
      this.cometa(limX, rnd(-limY * 0.85, limY * 0.85), vMundo);
      return;
    }
    if (tramo >= 4 && raro > 0.8 && raro <= 0.86 && this.tiempo > this.proxAgujero) {
      this.proxAgujero = this.tiempo + rnd(22, 34);
      this.agujero(limX, rnd(-limY * 0.6, limY * 0.6));
      this.proximo += 6;
      return;
    }
    if (r < 0.5) this.roca(x, y, rnd(0.4, 1.0 + dif * 0.6), tramo);
    else if (r < 0.66) {
      // Par: uno arriba y otro abajo, con espacio para pasar en medio
      const hueco = rnd(-limY * 0.4, limY * 0.4);
      this.roca(x, hueco + rnd(2.1, 2.8), rnd(0.5, 0.9), tramo, -0.5, 0);
      this.roca(x + rnd(-0.5, 0.5), hueco - rnd(2.1, 2.8), rnd(0.5, 0.9), tramo, -0.5, 0);
    } else if (r < 0.76 && metros > 2500) {
      // Muro con un hueco de por lo menos 3 de alto
      const hueco = rnd(-limY + 1.8, limY - 1.8);
      for (let yy = -limY - 0.3; yy <= limY + 0.3; yy += 1.25) {
        if (Math.abs(yy - hueco) < 1.75) continue;
        this.roca(x + rnd(-0.25, 0.25), yy, rnd(0.5, 0.68), tramo, 0, 0);
      }
      this.proximo += 3;
    } else if (r < 0.86 && tramo >= 4) {
      // Campo de piedritas
      for (let k = 0; k < 5 + dif * 4; k++) this.roca(x + rnd(0, 6), rnd(-limY, limY), rnd(0.25, 0.45), tramo, rnd(-1, 0.5), rnd(-0.5, 0.5));
      this.proximo += 4;
    } else if (r < 0.93 && tramo <= 3) this.satelite(x + 1, y * 0.8);
    else this.chatarra((['inodoro', 'chancla', 'lata'] as const)[Math.floor(Math.random() * 3)], x, y);
  }

  // ------------------------------------------------------------------ Movimiento
  /**
   * Mueve todo. Devuelve el tirón del agujero negro sobre la nave (x, y) en `jalon`.
   */
  actualizar(dt: number, vMundo: number, limX: number, limY: number, nave: Blanco, jalon: THREE.Vector2, lento: number) {
    jalon.set(0, 0);
    const dts = dt * lento;
    for (const o of this.lista) {
      if (!o.vivo) continue;
      o.t += dts;
      switch (o.tipo) {
        case 'ovni':
          this.moverOvni(o, dts, limX, nave);
          break;
        case 'avion':
        case 'cometa':
          if (o.fase === 'aviso') {
            if (o.t > (o.tipo === 'avion' ? 1.2 : 1.35)) {
              o.fase = 'va';
              o.obj.visible = true;
              if (o.tipo === 'cometa') rumor(0.9, 2400, 0.05, 0, 0.8, 500);
              else rumor(1.6, 300, 0.05, 0, 0.6, 120);
            }
            continue;
          }
          if (o.tipo === 'cometa') {
            // Cola: hielo que se evapora (azul) y polvo (dorado)
            for (let k = 0; k < 3; k++) {
              this.fx.brillo.emitir({
                x: o.x + rnd(0, 0.3), y: o.y + rnd(-0.2, 0.2), z: rnd(-0.3, 0.3), vx: rnd(2, 6), vy: rnd(-0.4, 0.4), vida: rnd(0.4, 0.8), tam0: rnd(0.6, 1.1),
                tam1: 0.2, color0: k ? '#BFF0FF' : '#FFFFFF', color1: '#3A7BFF', cuadro: CUADRO.brillo, alfa: 0.8, arrastre: 0.3,
              });
            }
          }
          break;
        case 'pajaro': {
          // Aletea (las alas suben y bajan escalando el modelo) y sube y baja un poquito
          o.n = (o.n ?? 0) + dts * 12;
          o.obj.scale.y = 0.75 + Math.abs(Math.sin(o.n)) * 0.5;
          o.vy = Math.cos(o.n * 0.25) * 0.5;
          break;
        }
        case 'agujero': {
          const disco = o.obj.getObjectByName('disco') as THREE.Mesh | undefined;
          if (disco) (disco.material as THREE.ShaderMaterial).uniforms.tiempo.value += dts;
          const dx = o.x - nave.x, dy = o.y - nave.y;
          const d = Math.hypot(dx, dy);
          if (d < 8) {
            const f = 30 / (d * d + 3);
            jalon.x += (dx / d) * f;
            jalon.y += (dy / d) * f;
          }
          // Espiral de polvo que cae
          if (Math.random() < dt * 30) {
            const a = Math.random() * Math.PI * 2, rr = rnd(2, 3);
            this.fx.brillo.emitir({
              x: o.x + Math.cos(a) * rr, y: o.y + Math.sin(a) * rr * 0.35, vx: -Math.cos(a) * 3 - Math.sin(a) * 3, vy: -Math.sin(a) * 1, vida: 0.6,
              tam0: 0.3, tam1: 0.05, color0: '#FFD9A0', color1: '#8A5CFF', cuadro: CUADRO.punto, arrastre: 1,
            });
          }
          break;
        }
        case 'rayo': {
          // Se prende de golpe, tiembla y se apaga
          const k = Math.min(1, o.t / 0.06) * Math.max(0, Math.min(1, (0.5 - o.t) / 0.12));
          o.obj.scale.y = o.obj.scale.z = k * (1 + Math.sin(o.t * 90) * 0.12);
          break;
        }
        case 'meteoro':
          if (Math.random() < 0.8) {
            this.fx.brillo.emitir({
              x: o.x, y: o.y, z: -0.1, vx: -o.vx * 0.2, vy: -o.vy * 0.2, vida: 0.35, tam0: o.radio * 2.6, tam1: 0.1, color0: '#FFE08A', color1: '#FF4A1C',
              cuadro: CUADRO.llama, giro: Math.atan2(o.vx, -o.vy) + Math.PI, arrastre: 0.5,
            });
          }
          break;
        default:
          break;
      }
      o.x += (o.vx - vMundo * o.arrastre) * dts;
      o.y += o.vy * dts;
      o.obj.position.set(o.x, o.y, 0);
      if (o.tipo !== 'pajaro' && o.tipo !== 'avion') {
        o.obj.rotation.x += o.giro.x * dts;
        o.obj.rotation.y += o.giro.y * dts;
        o.obj.rotation.z += o.giro.z * dts;
      }
      o.rot = o.obj.rotation.z;
      if (o.x < -limX - 8 || o.y < -limY - 6 || o.y > limY + 7 || o.x > limX + 30) this.quitar(o);
    }
    this.limpiar();
    this.resaltar();
  }

  /** El aura roja de cada uno (todas de una sola vez) y el latido del borde. */
  private resaltar() {
    this.borde.latir(this.tiempo);
    const a = this.auras;
    a.empezar();
    for (const o of this.lista) {
      if (!o.vivo || !o.obj.visible || o.tipo === 'rayo') continue;
      // Un brillo por cada círculo de choque: abraza la forma de lo que de verdad tumba (las alas del satélite, el avión…)
      const c = Math.cos(o.rot), s = Math.sin(o.rot);
      const crece = o.tipo === 'roca' || o.tipo === 'meteoro' ? 1.16 : o.tipo === 'agujero' ? 1.12 : 1.08;
      for (const [cx, cy, r] of o.circulos) {
        const lado = ladoAura(r * crece + 0.06);
        a.poner(o.x + cx * c - cy * s, o.y + cx * s + cy * c, -0.9, lado, lado);
      }
    }
    a.terminar(0.75 + 0.15 * Math.sin(this.tiempo * 6.5));
  }

  private moverOvni(o: Obst, dt: number, limX: number, nave: Blanco) {
    const luces = o.obj;
    luces.rotation.y += dt * 2.5;
    o.vy = 0;
    switch (o.fase) {
      case 'entra':
        o.x += (limX - 1.6 - o.x) * Math.min(1, dt * 2.5);
        if (o.t > 1.2) {
          o.fase = 'sigue';
          o.t = 0;
        }
        break;
      case 'sigue':
        o.y += Math.sign(nave.y - o.y) * Math.min(Math.abs(nave.y - o.y), dt * 2.6);
        if (o.t > 1.1) {
          o.fase = 'carga';
          o.t = 0;
          this.ev.aviso(o.y, 'rayo');
          nota(300, 0.9, 0, 'sawtooth', 0.04, 1200);
        }
        break;
      case 'carga':
        // Junta energía (destellos rosados) antes de disparar
        if (Math.random() < 0.6) {
          const a = Math.random() * Math.PI * 2;
          this.fx.brillo.emitir({ x: o.x - 0.8 + Math.cos(a) * 1.2, y: o.y - 0.2 + Math.sin(a) * 1.2, vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 3, vida: 0.35, tam0: 0.3, tam1: 0.05, color0: '#FFB3E6', color1: '#FF3FA4', cuadro: CUADRO.punto });
        }
        if (o.t > 0.95) {
          o.fase = 'dispara';
          o.t = 0;
          this.rayo(o);
        }
        break;
      case 'dispara':
        if (o.t > 0.55) {
          o.n = (o.n ?? 0) + 1;
          o.fase = (o.n ?? 0) >= 3 ? 'sale' : 'sigue';
          o.t = 0;
        }
        break;
      case 'sale':
        o.y += dt * 5;
        o.x += dt * 4;
        break;
    }
  }

  /** El rayo del ovni: una franja que cruza la pantalla a su altura. */
  private rayo(ovni: Obst) {
    const g = this.pedir('rayo', () => {
      const grupo = new THREE.Group();
      const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false, transparent: true }));
      nucleo.rotation.z = Math.PI / 2;
      const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#FF2A1F', toneMapped: false, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.rotation.z = Math.PI / 2;
      grupo.add(halo, nucleo);
      return grupo;
    });
    const largo = 40;
    g.scale.set(largo, 1, 1);
    nota(880, 0.4, 0, 'sawtooth', 0.05, 220);
    rumor(0.5, 3000, 0.06, 0, 1, 800);
    const o = this.nuevo('rayo', g, ovni.x - 1 - largo / 2, ovni.y - 0.15, 0.32, { arrastre: 0, destruible: false, puntos: 0, circulos: [] });
    o.n = ovni.x - 1;
    o.extra = ovni.obj;
  }

  private quitar(o: Obst) {
    if (!o.vivo) return;
    o.vivo = false;
    this.soltar(o.obj);
  }

  private limpiar() {
    let w = 0;
    for (const o of this.lista) {
      if (o.tipo === 'rayo' && o.vivo && o.t > 0.5) this.quitar(o);
      if (o.vivo) this.lista[w++] = o;
    }
    this.lista.length = w;
  }

  // ------------------------------------------------------------------ Choques
  /** ¿Algún obstáculo toca la nave? (círculos girados con el obstáculo). */
  choca(n: Blanco, alChocar: (o: Obst) => boolean) {
    for (const o of this.lista) {
      if (!o.vivo || o.fase === 'aviso') continue;
      if (o.tipo === 'rayo') {
        const inicio = o.n ?? 0;
        if (n.x < inicio && Math.abs(n.y - o.y) < 0.38 + n.r * 0.7 && o.t > 0.05 && o.t < 0.42) {
          if (alChocar(o)) return true;
        }
        continue;
      }
      const c = Math.cos(o.rot), s = Math.sin(o.rot);
      let minimo = Infinity;
      for (const [dx, dy, r] of o.circulos) {
        const cx = o.x + dx * c - dy * s, cy = o.y + dx * s + dy * c;
        const d = Math.hypot(n.x - cx, n.y - cy) - r - n.r;
        if (d < minimo) minimo = d;
      }
      o.holgura = Math.min(o.holgura, minimo);
      if (minimo < 0 && alChocar(o)) return true;
    }
    return false;
  }

  /** Los que ya pasaron la nave sin tocarla (para el «¡por un pelito!», cometas y chanclas esquivadas). */
  pasados(nx: number, alPasar: (o: Obst) => void) {
    for (const o of this.lista) {
      if (!o.vivo || o.pasado || o.fase === 'aviso' || o.tipo === 'rayo') continue;
      if (o.x < nx - 1.2) {
        o.pasado = true;
        if (o.tipo === 'cometa') this.cuentas.cometas++;
        if (o.tipo === 'chancla') this.cuentas.chanclas++;
        if (o.tipo === 'agujero') this.cuentas.agujeros++;
        alPasar(o);
      }
    }
  }

  /** Explota y desaparece (turbo, láser, ambientador o la burbuja). */
  destruir(o: Obst, como: 'explota' | 'flores' = 'explota') {
    if (!o.vivo) return;
    if (como === 'flores') {
      this.fx.estallido(o.x, o.y, CUADRO.flor, ['#C3A6FF', '#FFB3E6', '#FFFFFF', '#B8F2E6'], 12, 4, 0.5);
      this.fx.estallido(o.x, o.y, CUADRO.petalo, ['#E8A6FF', '#FFC2E2'], 6, 3, 0.4);
    } else {
      const tam = o.tipo === 'roca' || o.tipo === 'meteoro' ? Math.min(1.6, o.radio * 1.4) : o.tipo === 'satelite' || o.tipo === 'ovni' ? 1.4 : 0.9;
      this.fx.explotar(o.x, o.y, tam);
      rumor(0.5, 160, 0.12, 0, 0.6, 60);
    }
    this.quitar(o);
  }

  /** El más cercano adelante de la nave (para el láser). */
  blancoAdelante(nx: number, ny: number, alcance: number): Obst | null {
    let mejor: Obst | null = null, d = alcance;
    for (const o of this.lista) {
      if (!o.vivo || !o.destruible || o.fase === 'aviso' || o.x < nx + 0.5) continue;
      const dd = Math.hypot(o.x - nx, (o.y - ny) * 1.6);
      if (dd < d) {
        d = dd;
        mejor = o;
      }
    }
    return mejor;
  }

  /** Quita todo lo que hay cerca (al revivir). */
  despejar(x: number, y: number, radio: number) {
    for (const o of this.lista) if (o.vivo && Math.hypot(o.x - x, o.y - y) < radio + o.radio) this.destruir(o);
  }

  vaciar() {
    for (const o of this.lista) this.quitar(o);
    this.lista.length = 0;
    this.enLluvia = false;
    this.auras.empezar();
    this.auras.terminar();
  }

  /** Otro vuelo: sin obstáculos, con los relojes en cero y las cuentas de las misiones limpias. */
  reiniciar() {
    this.vaciar();
    this.proximo = 4;
    this.lluviaHasta = this.proxLluvia = this.proxAgujero = this.proxOvni = this.tiempo = 0;
    this.cuentas = { cometas: 0, chanclas: 0, lluvias: 0, agujeros: 0 };
  }

  liberar() {
    this.borde.liberar();
    this.auras.liberar();
    this.matCometa.dispose();
  }
}
