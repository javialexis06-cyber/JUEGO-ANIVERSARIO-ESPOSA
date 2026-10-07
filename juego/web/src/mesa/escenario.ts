// Escenario de la mesa: los dos muñequitos arriba del tablero (el de este celular a la izquierda) y sus
// marcadores en el medio; reaccionan a cada jugada con sus poses, caras, efectos y frases. Cada lado («el» o «ella»
// es solo el puesto en el tablero) puede ser Javier o Laura con su ropa de la casa, o un amigo con su muñeco y sus
// colores (`Lado`).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { otro, type Rol, type Ropa } from '../casa/modelo';
import { Vestuario } from '../casa/ropa';
import { Director } from '../reacciones/director';
import { type Anclas, Efectos } from '../reacciones/efectos';
import { Muneco } from '../reacciones/muneco';
import type { Final, Suceso } from './tipos';
import { vigilarContexto } from '../contexto';
import { cuadros } from '../segundo_plano';
import { vestirAmigo } from '../neutro';
import type { AspectoJugador } from '../salas/tipos';
import { NOMBRE_PAREJA } from '../nombres';

/** Quién va en un lado del escenario: su nombre, su muñeco base y (si es un amigo) sus colores. */
export interface Lado {
  nombre: string;
  cuerpo: Rol;
  aspecto?: AspectoJugador | null;
  /** Ponerle la ropa que tiene en la casa (solo Javier y Laura en su propio lado). */
  vestir?: boolean;
}
const LADOS_PAREJA: Record<Rol, Lado> = { el: { nombre: NOMBRE_PAREJA.el, cuerpo: 'el', vestir: true }, ella: { nombre: NOMBRE_PAREJA.ella, cuerpo: 'ella', vestir: true } };

export class Escenario {
  private renderer: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara = new THREE.PerspectiveCamera(28, 2, 0.1, 60);
  private m: Record<Rol, Muneco> = { el: new Muneco('el', 1), ella: new Muneco('ella', 1) };
  private sombras: Record<Rol, THREE.Mesh>;
  private efectos: Efectos;
  director: Director;
  private cargando: Promise<void> | null = null;
  private yo: Rol = 'el';
  /** Tiempo juntado hasta el próximo cuadro (se dibuja a 30 por segundo: igual de fluido y el celular no se calienta). */
  private acumulado = 0;
  private puntos: Record<Rol, number> = { el: 0, ella: 0 };
  private anclas: Record<Rol, Anclas>;

  constructor(private lienzo: HTMLCanvasElement, capa: HTMLElement, private rapido = 1) {
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
    vigilarContexto(lienzo);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.setClearColor(0x000000, 0);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.escena.environmentIntensity = 0.55;
    const sol = new THREE.DirectionalLight('#fff3e2', 1.5);
    sol.position.set(2, 5, 6);
    this.escena.add(new THREE.HemisphereLight('#ffffff', '#c9a48c', 0.85), sol);
    // Sombrita suave bajo cada uno (más barata que un mapa de sombras y se ve igual de tierna)
    const tex = sombraTextura();
    const sombra = () => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      s.rotation.x = -Math.PI / 2;
      this.escena.add(s);
      return s;
    };
    this.sombras = { el: sombra(), ella: sombra() };
    this.efectos = new Efectos(capa, rapido);
    this.anclas = { el: this.anclasDe('el'), ella: this.anclasDe('ella') };
    this.director = new Director(this.m, this.efectos, this.anclas, rapido);
    window.addEventListener('resize', () => this.ajustar());
    // (en segundo plano el bucle se detiene solo y vuelve sin salto de tiempo)
    cuadros((dt) => this.cuadro(dt), 0.05);
  }

  private anclasDe(rol: Rol): Anclas {
    const m = this.m[rol];
    const aCapa = (v: THREE.Vector3, radio: number) => {
      const w = this.lienzo.clientWidth, h = this.lienzo.clientHeight;
      const arriba = this.lienzo.offsetTop;
      const p = v.clone().project(this.camara);
      const borde = v.clone().add(new THREE.Vector3(radio, 0, 0)).project(this.camara);
      return { x: ((p.x + 1) / 2) * w, y: arriba + ((1 - p.y) / 2) * h, r: Math.max(8, (Math.abs(borde.x - p.x) / 2) * w) };
    };
    return {
      cabeza: () => aCapa(m.puntoCabeza(), m.radioCabeza),
      cara: () => aCapa(m.puntoCara(), m.radioCabeza),
      pies: () => aCapa(m.puntoPies(), m.radioCabeza),
      lado: () => (Math.sin(m.p.rot) >= 0 ? 1 : -1),
    };
  }

  /** Cómo está armado cada lado ahora (si no cambia, no se vuelve a cargar nada). */
  private claves: Record<Rol, string> = { el: '', ella: '' };
  private propios: Record<Rol, THREE.Material[]> = { el: [], ella: [] };

  /**
   * Pone a los dos en su lado (el de este celular a la izquierda): Javier y Laura con su ropa de la casa, o un amigo
   * con su muñeco y sus colores. Solo carga lo que cambió desde la última partida.
   */
  async preparar(yo: Rol, lados: Record<Rol, Lado> = LADOS_PAREJA) {
    this.yo = yo;
    const turno = (this.cargando ?? Promise.resolve()).then(() => this.ponerLados(lados));
    this.cargando = turno.catch(() => undefined);
    await turno;
    this.director.limpiar();
    const marc = document.querySelectorAll<HTMLElement>('.marcador');
    const izq = yo, der = otro(yo);
    marc[0].dataset.quien = izq;
    marc[1].dataset.quien = der;
    marc[0].querySelector('.marcador-nombre')!.textContent = lados[izq].nombre;
    marc[1].querySelector('.marcador-nombre')!.textContent = lados[der].nombre;
    this.puntos = { el: 0, ella: 0 };
    this.ajustar();
  }

  private async ponerLados(lados: Record<Rol, Lado>) {
    let vestidos: Record<Rol, { ropa?: Ropa; colorPelo?: string }> | null = null;
    try {
      vestidos = JSON.parse(localStorage.getItem('nuestro-hogar-vestidos') ?? 'null');
    } catch {
      /* sin ropa guardada */
    }
    let cambio = false;
    await Promise.all((['el', 'ella'] as Rol[]).map(async (r) => {
      const l = lados[r];
      const clave = JSON.stringify([l.cuerpo, l.aspecto ?? null, !!l.vestir]);
      if (clave === this.claves[r] && this.m[r].listo) return;
      cambio = true;
      // Un muñeco nuevo para este lado (el de antes se suelta)
      const viejo = this.m[r];
      const nuevo = this.claves[r] === '' && viejo.rol === l.cuerpo && !viejo.listo ? viejo : new Muneco(l.cuerpo, 1);
      await nuevo.cargar();
      if (nuevo !== viejo) {
        this.escena.remove(viejo.p.grupo);
        viejo.p.grupo.traverse((o) => (o as THREE.SkinnedMesh).isSkinnedMesh && (o as THREE.SkinnedMesh).skeleton.dispose());
      }
      for (const mat of this.propios[r]) mat.dispose();
      this.propios[r] = vestirAmigo(nuevo.p.modelo, l.aspecto);
      const v = l.vestir ? vestidos?.[l.cuerpo] : null;
      if (v?.ropa || v?.colorPelo) await new Vestuario(nuevo.p, l.cuerpo).aplicar(v.ropa, v.colorPelo).catch(() => undefined);
      this.m[r] = nuevo;
      this.anclas[r] = this.anclasDe(r);
      this.escena.add(nuevo.p.grupo);
      this.claves[r] = clave;
    }));
    if (cambio) this.director.conectar();
  }

  /** Encuadre: los dos de cuerpo entero con aire arriba para saltar, a un lado y al otro del escenario. */
  private ajustar() {
    const w = this.lienzo.clientWidth || 1, h = this.lienzo.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const aspecto = w / h;
    this.camara.aspect = aspecto;
    const alto = this.m.el.listo ? this.m.el.p.escala * this.m.el.alto : 2.7;
    // Alto visible: el muñeco + espacio para saltos arriba + un poquito bajo los pies
    // En una columna angosta (celular acostado) se aleja para que quepan los dos de lado a lado
    const visible = Math.max(alto * 1.58, (alto * 2.35) / aspecto);
    const dist = visible / 2 / Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2));
    // Los pies casi en el borde de abajo; el aire que sobre queda arriba para saltar
    const centroY = visible / 2 - alto * 0.1;
    this.camara.position.set(0, centroY + alto * 0.1, dist);
    this.camara.lookAt(0, centroY, 0);
    this.camara.updateProjectionMatrix();
    const ancho = visible * aspecto;
    // A los lados, dejando el centro para el marcador
    const x = Math.min(ancho * (aspecto > 1.4 ? 0.33 : 0.26), alto * 1.35);
    const lados: [Rol, number][] = [[this.yo, -x], [otro(this.yo), x]];
    for (const [r, px] of lados) {
      this.m[r].ubicar(px, 0, px < 0 ? 0.42 : -0.42);
      this.sombras[r].scale.setScalar(alto * 0.62);
    }
  }

  private cuadro(dtReal: number) {
    this.acumulado += dtReal;
    if (this.acumulado < 1 / 32) return;
    const dt = Math.min(0.05, this.acumulado) * this.rapido;
    this.acumulado = 0;
    if (!this.m.el.listo) return;
    // La actuación sigue aunque no se vea (así el final y el saludo siempre terminan)
    if (!this.congelado) this.paso(dt);
    if (!this.sin3d && this.lienzo.offsetParent) this.renderer.render(this.escena, this.camara);
  }

  /** Pruebas: el tiempo solo avanza con `simular`; `sin3d` no pinta (los navegadores de prueba van lentos). */
  congelado = new URLSearchParams(location.search).has('congelar');
  sin3d = new URLSearchParams(location.search).has('sin3d');

  /** Pruebas en computadores lentos: adelanta la animación a pasos cortos y pinta una vez. */
  simular(segundos: number) {
    for (let t = 0; t < segundos; t += 1 / 30) this.paso(1 / 30);
    this.renderer.render(this.escena, this.camara);
  }

  private paso(dt: number) {
    for (const r of ['el', 'ella'] as Rol[]) {
      const m = this.m[r];
      m.update(dt);
      // La sombra sigue los pies y se achica cuando salta
      const g = m.p.grupo.position;
      const alto = m.p.cuerpo.position.y;
      this.sombras[r].position.set(g.x, 0.005, g.z);
      this.sombras[r].scale.setScalar(Math.max(0.2, 1 - alto * 0.6) * m.alto * m.p.escala * 0.62);
      (this.sombras[r].material as THREE.MeshBasicMaterial).opacity = Math.max(0.25, 1 - alto);
    }
    this.director.cuadro(dt);
    this.efectos.cuadro(dt);
  }

  // ------------------------------------------------------------------ Lo que manda la partida
  async inicio(empieza: Rol) {
    await conLimite(this.director.inicio(empieza), 3500 / this.rapido);
  }
  turno(t: Rol, humanoAqui: boolean) {
    for (const m of document.querySelectorAll<HTMLElement>('.marcador')) m.classList.toggle('activo', m.dataset.quien === t);
    this.director.turno(t, humanoAqui);
  }
  pensar(quien: Rol, si: boolean) {
    this.director.pensar(quien, si);
  }
  suceso(s: Suceso) {
    this.director.evento(s);
  }
  adelante(quien: Rol) {
    this.director.adelante(quien);
  }
  marcador(p: Record<Rol, number>) {
    for (const el of document.querySelectorAll<HTMLElement>('.marcador')) {
      const r = el.dataset.quien as Rol;
      const n = p[r] ?? 0;
      el.querySelector('.marcador-puntos')!.textContent = String(n);
      if (n > this.puntos[r]) {
        el.classList.remove('salta');
        void el.offsetWidth;
        el.classList.add('salta');
      }
    }
    this.puntos = { ...p };
  }
  async final(f: Final) {
    for (const m of document.querySelectorAll<HTMLElement>('.marcador')) m.classList.remove('activo');
    await conLimite(this.director.final(f.ganador), 4500 / this.rapido);
  }

  /** Espera a que los dos terminen lo que están actuando (la IA no juega encima de una reacción). */
  calma(maxMs: number): Promise<void> {
    const t0 = performance.now();
    return new Promise((listo) => {
      const mirar = () => {
        const ocupados = (['el', 'ella'] as Rol[]).some((r) => this.m[r].actuando);
        if (!ocupados || performance.now() - t0 > maxMs / this.rapido) listo();
        else setTimeout(mirar, 80);
      };
      mirar();
    });
  }

  /** Pruebas y vitrina: que un muñeco haga una reacción del catálogo. */
  probar(rol: Rol, coreo: string) {
    return this.director.hacer(rol, coreo);
  }
}

/** Nunca deja la partida esperando a una animación (si el celular se pausa o algo se queda pegado). */
const conLimite = (p: Promise<void>, ms: number) => Promise.race([p, new Promise<void>((r) => setTimeout(r, ms))]);

function sombraTextura() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, 'rgba(61,43,39,0.42)');
  r.addColorStop(0.6, 'rgba(61,43,39,0.16)');
  r.addColorStop(1, 'rgba(61,43,39,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
