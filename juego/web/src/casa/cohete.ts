// El retrete espacial: después de la leche (Ella) o del picante (Él), el inodoro sale disparado al espacio con
// el personaje sentado. Se arrastra el dedo para esquivar lo que venga (pájaros, chanclas, satélites, asteroides,
// ovnis, cometas, agujeros negros…), se recogen rollitos de papel dorados y poderes (burbuja, imán, turbo de
// frijoles, cámara lenta, ×2, desatascador láser, ayudante…). El viaje pasa por tramos con su propio cielo y
// música. Al chocar cae con un paracaídas de papel y sale la pantalla del vuelo; con los rollitos se compran
// mejoras, retretes, estelas y cascos en la tienda del retrete (que también se abre desde el cuarto de juegos).
// Un amigo lo juega sin la casa (retrete.html): con su muñeco y sus colores, y todo en modo neutro (nada de la pareja:
// ni la leche y el picante, ni apodos, ni recuerdos, ni banderitas de «¡Te pasé, mi amor!»).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clone as clonarConEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import './cohete.css';
import { Muneco } from '../reacciones/muneco';
import { cargar, cargarAnimado, liberarEsqueletos } from '../recursos';
import * as fondo from '../segundo_plano';
import { activar as activarSonido, musica, nota, rumor } from '../sonido';
import { CUADRO, atlasParticulas, texturaHalo } from './cohete/arte';
import {
  type Cuentas, DURA_PATICO, ESPERA_PATICO, type IdMejora, type IdPoder, PODERES, type ProgresoCohete, type TipoCosmetico, copiaProgreso,
  cuentasNuevas, ganarCosmeticos, multiplicador, nombreTramo, normalizarCohete, ponerNeutroCohete, registrarVuelo, revisarMisiones, tramoDe,
  valorDe,
} from './cohete/datos';
import { Efectos, Propulsor } from './cohete/efectos';
import { Escenario } from './cohete/escenario';
import { Modelos } from './cohete/modelos';
import { MusicaEspacial } from './cohete/musica';
import { type Obst, Obstaculos } from './cohete/obstaculos';
import { Particulas } from './cohete/particulas';
import { Poderes } from './cohete/poderes';
import { mostrarResultado, pintarPremioCasa, type DatosResultado, type PremioCasa } from './cohete/resultado';
import { FIGURAS, Rollitos, figura } from './cohete/rollitos';
import { Tienda } from './cohete/tienda';
import { NOMBRE_ROL, otro, type Rol, type Ropa } from './modelo';
import { Vestuario } from './ropa';
import { teñirModelo } from '../salas/tinte';
import type { AspectoJugador } from '../salas/tipos';

export interface Resultado {
  /** Segundos que duró el vuelo (para el récord viejo y las monedas de la casa). */
  segundos: number;
  metros: number;
  puntaje: number;
  rollitos: number;
  /** Si voló (false: solo se abrió la tienda). */
  volo: boolean;
  /** Cuántos vuelos se hicieron sin salir (con «Volar otra vez»). */
  vuelos: number;
  /** Monedas que les dio la casa por todos los vuelos (ya sumadas allá, con el tope del día). */
  monedas: number;
}

export type { PremioCasa };

interface Opciones {
  /** Javier o Laura; para un amigo, el cuerpo de su muñeco (el de Javier o el de Laura como base). */
  rol: Rol;
  ropa?: Ropa;
  colorPelo?: string;
  /** Lo de cada uno en el retrete (rollitos, mejoras, misiones…). */
  progreso?: ProgresoCohete;
  /** Récord de la pareja (metros) para ponerle su banderita en el camino. */
  recordPareja?: number;
  /** Guarda el progreso en la casa (después del vuelo y en cada compra). */
  guardar?: (p: ProgresoCohete) => Promise<unknown> | void;
  /** Solo la tienda (desde el cuarto de juegos), sin vuelo. */
  soloTienda?: boolean;
  /** Despegue corto (ya lo había descubierto: sale del inodoro sin tanto drama). */
  corto?: boolean;
  /** La casa da sus monedas por cada vuelo apenas termina (con el tope del día) y dice cuántas fueron. */
  premio?: (segundos: number) => Promise<PremioCasa>;
  /** Juega un amigo (sin casa, en modo neutro): su nombre y cómo se ve. */
  amigo?: { nombre: string; aspecto: AspectoJugador };
  /** El botón de salir de la pantalla del vuelo (volver a la casa o a la sala de juegos). */
  textoSalir?: string;
}

/** Lo que va diciendo en el espacio (se sabía que algún día pasaría). */
const FRASES: Record<Rol, string[]> = {
  el: [
    'No debí comerme ese picante…',
    'Siempre supe que algún día saldría como un cohete del baño.',
    '¡Houston, tenemos un problema… estomacal!',
    '¡Ni en un columpio volé tan alto!',
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
    'Ningún videojuego me preparó para esto.',
    'Del baño a la NASA en un solo jalón.',
    '¡Mi amor, esto es culpa de tu leche!',
  ],
};
const FRASES_TRAMO: Record<Rol, string[]> = {
  el: [
    '¡Chao, barrio!',
    'Desde aquí la Tierra se ve chiquitica… como mi dignidad.',
    'La Luna… y yo sin una serenata preparada.',
    '¿Habrá baños en Marte? Pregunto por un amigo.',
    'Esto está más lleno que el metro de Medellín en hora pico.',
    'Parece un concierto con luces de colores. Qué nivel.',
    '¡Todo es rosado! Esto lo decoró mi amor, seguro.',
  ],
  ella: [
    '¡Chao, barrio! ¡Que nadie me vea!',
    'Desde aquí la Tierra se ve chiquitica… como mi paciencia.',
    '¿La Luna es de queso? Ni loca la pruebo: lactosa.',
    '¿Habrá baños en Marte? Ojalá con papel.',
    'Esto está más lleno que el metro de Medellín en hora pico.',
    '¡Qué colores tan bonitos! Parece un cuadro.',
    '¡Todo rosado! Así sí me gusta el espacio.',
  ],
};
const FRASE_PODER: Record<IdPoder, Record<Rol, string>> = {
  escudo: { el: '¡Limpiecito y protegido!', ella: '¡Burbujita protectora!' },
  iman: { el: '¡Vengan, rollitos míos!', ella: '¡Vengan a mamá, rollitos!' },
  turbo: { el: '¡Los frijoles de mi suegra!', ella: '¡Esa bandeja paisa no perdona!' },
  lenta: { el: 'Todo va como Netflix con mal internet…', ella: 'Ay, qué paz… todo despacito.' },
  doble: { el: '¡Doble o nada!', ella: '¡Todo me sale doble!' },
  laser: { el: '¡Destapando el universo!', ella: '¡Desatascador láser, a la orden!' },
  mini: { el: '¡Mi retretico ayudante!', ella: '¡Un retretico bebé!' },
  hormiga: { el: '¡Me encogí como ropa en lavadora!', ella: '¡Quedé chiquitica!' },
  ambientador: { el: '¡Huele a lavanda! Ya era hora.', ella: '¡Aroma a lavanda, por fin!' },
  paca: { el: '¡Papel para todo el año!', ella: '¡Papel pa’ la casa entera!' },
};
/** Lo que dice al volver a volar sin bajarse. */
const OTRA_VEZ: Record<Rol, string[]> = {
  el: ['¡Una más y ya!', 'Esta vez sí le gano a mi amor.', '¡Revancha, universo!', 'Ya le cogí el tiro a esto.'],
  ella: ['¡Una más y ya!', 'Ahora sí voy con toda.', '¡Revancha, universo!', 'Me quedé con ganas de más.'],
};
/**
 * Modo neutro (juega un amigo): lo mismo, sin la leche, el picante, los apodos ni los recuerdos de la pareja, y sin
 * «liviano|liviana» (no sabemos cómo le gusta que le digan).
 */
const NEUTRO = {
  frases: [
    '¡¿Qué le echaron a ese almuerzo?!',
    'Siempre supe que algún día saldría como un cohete del baño.',
    '¡Houston, tenemos un problema… estomacal!',
    '¿Esto cuenta como viaje espacial? Quiero el certificado.',
    'Nunca más el corrientazo de la esquina. NUNCA.',
    '¿Alguien tiene papel higiénico en el espacio?',
    '¡Qué vista tan bonita… qué vergüenza tan grande!',
    'Si esto sale en las noticias, no me conocen.',
    'Esto no estaba en el presupuesto del mes.',
    '¡Guárdenme la comida, ya vuelvo! Creo.',
    '¡Mamá, mírame! Sin manos… y sin dignidad.',
    'Esa bandeja paisa venía con propulsión incluida.',
  ],
  tramo: [
    '¡Chao, barrio! ¡Que nadie me vea!',
    'Desde aquí la Tierra se ve chiquitica… como mi dignidad.',
    '¿La Luna es de queso? Mejor no la pruebo, por si acaso.',
    '¿Habrá baños en Marte? Pregunto por un amigo.',
    'Esto está más lleno que el TransMilenio en hora pico.',
    '¡Qué colores! Parece una discoteca espacial.',
    '¡Todo rosado! Esto parece un algodón de azúcar gigante.',
  ],
  poder: {
    escudo: '¡Burbujita protectora!', iman: '¡Vengan, rollitos!', turbo: '¡Esos frijoles no perdonan!', lenta: 'Todo va como internet de pueblo…',
    doble: '¡Todo me sale doble!', laser: '¡Desatascador láser, a la orden!', mini: '¡Un retretico ayudante!', hormiga: '¡Modo chiquitico!',
    ambientador: '¡Aroma a lavanda, por fin!', paca: '¡Papel para todo el año!',
  } as Record<IdPoder, string>,
  otraVez: ['¡Una más y ya!', '¡Revancha, universo!', 'Ya le cogí el tiro a esto.', 'Ahora sí voy con toda.', 'Me quedé con ganas de más.'],
};
const CASI = ['¡Uy, casi!', '¡Esa estuvo cerca!', '¡Ay, mi retrete!', '¡Por un pelito!', '¡Uf!', '¡Me peinó!'];
const FIN = ['¡NOOOO!', '¡Me voooy!', '¡Mi baño!', '¡Mi retreteee!'];
/** Cascos que tapan el copete de Él. */
const TAPA_COPETE = new Set(['ducha', 'aviador', 'vikingo', 'rollo', 'astronauta']);
/** Unidades del mundo → metros. */
const METROS = 2.5;
const EJE_Z = new THREE.Vector3(0, 0, 1);
const ESCALA_RETRETE = 1.3;
/** Velocidad del mundo: la de arranque, lo que sube con la distancia y en cuántos metros (unidades/s). */
const VEL = [7, 7, 5000];
/** El arranque tranquilo: de qué segundo a qué segundo se pasa de la velocidad suave a la normal, y qué tan suave. */
const CALMA = [3, 30, 0.6];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const elegir = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
const mil = (v: number) => Math.round(v).toLocaleString('es-CO');

export function jugarCohete(o: Opciones): Promise<Resultado> {
  return new Promise((listo) => {
    void new RetreteEspacial(o, listo).empezar();
  });
}

/** La tienda del retrete sola (desde el retrete en miniatura del cuarto de juegos). */
export function abrirTiendaCohete(o: Omit<Opciones, 'soloTienda'>): Promise<Resultado> {
  return jugarCohete({ ...o, soloTienda: true });
}

type Fase = 'carga' | 'intro' | 'juego' | 'revivir' | 'choque' | 'resultado' | 'taller' | 'fin';

class RetreteEspacial {
  private capa: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private escena = new THREE.Scene();
  private camara = new THREE.PerspectiveCamera(50, 2, 0.1, 300);
  private mundo = new THREE.Group();
  /** La nave: el retrete, el personaje y lo que se le pega (la burbuja, el imán, el cañón). */
  private nave = new THREE.Group();
  private soporte = new THREE.Group();
  private retreteObj: THREE.Object3D | null = null;
  private muneco: Muneco;
  private vestuario: Vestuario | null = null;
  private cascoMallas: THREE.Object3D[] = [];
  private copete: THREE.Object3D[] = [];
  private paracaidas: THREE.Group | null = null;
  // Piezas
  private modelos!: Modelos;
  private escenario!: Escenario;
  private brillo!: Particulas;
  private humo!: Particulas;
  private fx!: Efectos;
  private propulsor!: Propulsor;
  private obst!: Obstaculos;
  private rollos!: Rollitos;
  private poderes!: Poderes;
  private musica = new MusicaEspacial();
  private texHalo = texturaHalo();
  private atlas = atlasParticulas();
  private marcas: { g: THREE.Group; metros: number }[] = [];
  // Progreso (copia de trabajo; se guarda al terminar y en cada compra)
  private p: ProgresoCohete;
  private inicioMisiones: number[];
  private cuentas: Cuentas = cuentasNuevas();
  // Estado del vuelo
  private fase: Fase = 'carga';
  private pausado = false;
  private t = 0;
  private tFase = 0;
  private tJuego = 0;
  private distancia = 0;
  private puntaje = 0;
  private rollitosVuelo = 0;
  private velocidad = 7;
  private avance = 0;
  private sinPoder = 0;
  private revivir = 0;
  private invulnerable = 0;
  private turboArranque = 0;
  private escalaHormiga = 1;
  private tramoActual = -1;
  private rachaRollitos = 0;
  private tRacha = 0;
  private proxFigura = 3;
  private proxFrase = 7;
  private temblor = 0;
  private fov = 50;
  private meta = new THREE.Vector2(-5, 0);
  private limites = { x: 11, y: 4.7 };
  private jalon = new THREE.Vector2();
  private teclas = new Set<string>();
  private arrastre: { x: number; y: number } | null = null;
  private acumulado = 0;
  private bucleFondo: { detener: () => void } | null = null;
  private quitarFondo: (() => void)[] = [];
  private tiempos: number[] = [];
  private calidad: 'alta' | 'media' | 'baja' = 'alta';
  private bot = false;
  private multVuelo = 1;
  /** Pruebas: nada lo tumba (para tomar fotos de todos los tramos). */
  dios = false;
  manual = false;
  private record = 0;
  private pasoRecord = false;
  private pasoPareja = false;
  private tienda: Tienda | null = null;
  private resultado: DatosResultado | null = null;
  private carasHasta = 0;
  private caraBase = 'nervioso';
  private debug = new URLSearchParams(location.search).has('cohete_debug');
  private aros: THREE.LineLoop[] = [];
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private blanco = { x: 0, y: 0, r: 0.6 };
  /** Lo que dura el despegue (más corto al volver a volar). */
  private durIntro = 2.6;
  /** Vuelos de esta vez (con «Volar otra vez») y las monedas que dio la casa por ellos. */
  private vuelosSesion = 0;
  private monedasSesion = 0;

  /** Juega un amigo: nada de la pareja (frases, banderitas, figuras ni la galaxia del amor). */
  private readonly neutro: boolean;
  /** Los materiales con los colores del amigo (se sueltan al final). */
  private tintes: THREE.Material[] = [];

  constructor(private o: Opciones, private listo: (r: Resultado) => void) {
    cohete.actual = this;
    this.neutro = !!o.amigo;
    ponerNeutroCohete(this.neutro);
    this.p = copiaProgreso(normalizarCohete(o.progreso));
    this.inicioMisiones = this.p.misiones.map((m) => m.avance);
    this.record = this.p.mejor;
    this.capa = document.createElement('section');
    this.capa.className = 'cohete';
    this.capa.innerHTML = `
      <canvas class="cohete-lienzo"></canvas>
      <div class="cohete-velo"></div>
      <div class="cohete-hud" hidden>
        <div class="ch-izq"><b class="ch-metros">0 m</b><small class="ch-record"></small></div>
        <div class="ch-centro"><span class="ch-rollitos"><i class="ico-rollito"></i><b>0</b></span></div>
        <div class="ch-der"><span class="ch-puntos"><em>×${multiplicador(this.p)}</em><b>0</b></span><button class="ch-pausa" aria-label="Pausa"><i></i><i></i></button></div>
      </div>
      <div class="ch-poderes"></div>
      <button class="ch-patico" hidden aria-label="Soltar un patico salvavidas"><img src="./modelos/iconos/cohete_patico.webp" alt=""><b>0</b><i></i></button>
      <div class="ch-avisos"></div>
      <p class="cohete-aviso"></p>
      <div class="cohete-tramo"><small></small><b></b></div>
      <div class="ch-mision" hidden></div>
      <p class="cohete-globo" hidden></p>
      <div class="ch-dedo" hidden><i></i><span>Arrastra el dedo para esquivar</span></div>
      <div class="cohete-destello"></div>
      <div class="ch-pausa-capa" hidden><div><b>En pausa</b><p>El retrete flota quietico esperándote.</p><button class="cb-boton cb-principal" data-seguir>Seguir volando</button><button class="cb-boton" data-rendirse>Aterrizar ya</button></div></div>
      <div class="cohete-carga"><i class="ico-rollito cc-rollo"></i><p>Prendiendo motores…</p></div>`;
    document.body.append(this.capa);
    const lienzo = this.capa.querySelector('canvas')!;
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.escena.environmentIntensity = 0.55;
    this.escena.add(this.mundo);
    this.camara.position.set(0, 0, 12);
    this.muneco = new Muneco(o.rol, 0.62);
    this.ajustar();
    window.addEventListener('resize', this.ajustar);
    // En segundo plano (otra app, pantalla bloqueada) se pausa solo; al volver espera a que toque «Seguir»
    this.quitarFondo.push(
      fondo.alPausar(() => {
        if (this.fase === 'juego' || this.fase === 'intro') this.pausar(true);
        this.musica.pausar(true);
      }),
      fondo.alReanudar(() => {
        if (!this.pausado) this.musica.pausar(false);
      }),
    );
    this.controles(lienzo);
    this.botones();
  }

  async empezar() {
    activarSonido();
    // Mientras carga se ve el rollito girando
    requestAnimationFrame(() => this.capa.classList.add('visible'));
    const [modelos] = await Promise.all([Modelos.cargar(), this.muneco.cargar()]);
    this.modelos = modelos;
    this.armar();
    const p = this.p;
    if (this.o.ropa || this.o.colorPelo || p.puesto.casco !== 'ninguno') {
      this.vestuario = new Vestuario(this.muneco.p, this.o.rol);
      const ropa = { ...(this.o.ropa ?? {}) };
      if (p.puesto.casco !== 'ninguno') delete ropa.cabeza;
      await this.vestuario.aplicar(ropa, this.o.colorPelo).catch(() => undefined);
    }
    // El amigo con sus colores (piel, pelo, camiseta, pantalón y zapatos) sobre el muñeco que escogió
    if (this.o.amigo && this.muneco.p.modelo) this.tintes = teñirModelo(this.muneco.p.modelo, this.o.amigo.aspecto);
    this.soporte.add(this.muneco.p.grupo);
    this.muneco.ponerEn(0, 0.02, 0);
    await this.ponerCasco(p.puesto.casco);
    this.ponerRetrete(p.puesto.retrete);
    this.propulsor.estela = p.puesto.estela;
    this.capa.querySelector('.cohete-carga')!.remove();
    if (this.o.soloTienda) {
      this.entrarTaller();
    } else {
      if (this.o.corto) this.durIntro = 1.8;
      this.despegue('¡Despegue!');
    }
    // El bucle se detiene solo en segundo plano y vuelve sin salto de tiempo
    this.bucleFondo = fondo.cuadros((dt) => this.bucle(dt));
  }

  // ------------------------------------------------------------------ Armado
  private armar() {
    this.brillo = new Particulas(1400, this.atlas, true);
    this.humo = new Particulas(900, this.atlas, false);
    this.escenario = new Escenario(this.camara, this.modelos.asteroidesChicos[0], this.modelos.matRocas[4]);
    this.escena.add(this.escenario.grupo);
    this.mundo.add(this.brillo.puntos, this.humo.puntos);
    this.fx = new Efectos(this.brillo, this.humo, this.mundo, this.modelos.asteroidesChicos[1], this.modelos.matRocas[0], this.texturaAro());
    this.propulsor = new Propulsor(this.fx);
    this.obst = new Obstaculos(this.mundo, this.modelos, this.fx, {
      aviso: (y, tipo) => this.avisoBorde(y, tipo),
      lluvia: (si) => {
        if (si) {
          this.aviso('¡Lluvia de meteoritos!');
          this.decir(this.neutro || this.o.rol === 'el' ? '¡Está lloviendo piedra!' : '¡Ay no, granizo espacial!', 2.4);
          rumor(1.2, 600, 0.06, 0, 0.7, 200);
        } else this.decir('¡Sobreviví a la lluvia!', 1.8);
      },
      frase: (t) => this.decir(t, 2.2),
    }, this.texHalo);
    this.rollos = new Rollitos(this.modelos.rollito);
    this.mundo.add(this.rollos.grupo);
    this.mundo.add(this.nave);
    this.nave.add(this.soporte);
    this.poderes = new Poderes(this.mundo, this.nave, this.modelos, this.fx, this.p, this.texHalo);
    this.nave.scale.setScalar(1.5);
    this.nave.position.set(-this.limites.x * 0.45, -8, 0);
    // Medio de perfil: el frente del retrete mira hacia donde va (la derecha)
    this.soporte.rotation.y = 0.55;
    this.ajustar();
    if (this.debug) this.armarAros();
  }

  private texturaAro() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0)');
    gr.addColorStop(0.85, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  private ponerRetrete(id: string) {
    if (this.retreteObj) this.soporte.remove(this.retreteObj);
    const r = this.modelos.retrete(id);
    // Un poquito más grande que el del baño: así se luce debajo del personaje
    r.scale.setScalar(ESCALA_RETRETE);
    r.position.y = -0.445 * ESCALA_RETRETE + 0.03;
    this.retreteObj = r;
    this.soporte.add(r);
    this.luces = [];
    r.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats as THREE.MeshStandardMaterial[]) if (/rgb|led/i.test(mat.name)) this.luces.push(mat);
    });
  }
  private luces: THREE.MeshStandardMaterial[] = [];

  /** El casco o gorro comprado, amarrado a la cabeza del personaje (con su esqueleto). */
  private async ponerCasco(id: string) {
    for (const m of this.cascoMallas) m.removeFromParent();
    liberarEsqueletos(...this.cascoMallas);
    this.cascoMallas = [];
    for (const c of this.copete) c.visible = true;
    this.copete = [];
    if (id === 'ninguno') return;
    const raiz = this.muneco.p.raizMallas;
    const r = await cargarAnimado(`ropa/cohete_${id}_${this.o.rol}.glb`).catch(() => null);
    if (!r || !raiz) return;
    const copia = clonarConEsqueleto(r.escena);
    const mallas: THREE.SkinnedMesh[] = [];
    copia.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) mallas.push(o as THREE.SkinnedMesh);
    });
    for (const m of mallas) {
      const huesos = m.skeleton.bones.map((b) => this.muneco.p.huesos.get(b.name));
      if (huesos.some((h) => !h)) continue;
      m.bind(new THREE.Skeleton(huesos as THREE.Bone[], m.skeleton.boneInverses), m.bindMatrix);
      m.frustumCulled = false;
      raiz.add(m);
      this.cascoMallas.push(m);
    }
    // Brillo del vidrio y el metal
    for (const m of mallas) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats as THREE.MeshStandardMaterial[]) {
        const n = mat.name.toLowerCase();
        if (/vidrio/.test(n)) {
          mat.transparent = true;
          mat.opacity = 0.28;
          mat.roughness = 0.04;
          mat.depthWrite = false;
          mat.normalMap = null;
          m.renderOrder = 10;
        } else if (/metal|oro|dorad|cromo|plata/.test(n)) {
          mat.metalness = 1;
          mat.roughness = 0.25;
        } else if (/luz|estrella/.test(n)) {
          mat.toneMapped = false;
          mat.emissiveIntensity = Math.max(1.5, mat.emissiveIntensity);
        }
      }
    }
    if (this.o.rol === 'el' && TAPA_COPETE.has(id)) {
      for (const [n, lista] of this.muneco.p.partes) {
        if (/^mechon (copete|flequillo)/.test(n)) for (const o of lista) {
          o.visible = false;
          this.copete.push(o);
        }
      }
    }
  }

  private ajustar = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
    // Lo que se ve a la profundidad del juego
    const alto = 2 * Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2)) * 12;
    this.limites = { x: (alto * this.camara.aspect) / 2 - 0.8, y: alto / 2 - 0.95 };
    const px = h * this.renderer.getPixelRatio();
    this.brillo?.ajustar(px, this.camara.fov);
    this.humo?.ajustar(px, this.camara.fov);
    this.escenario?.ajustar(px);
  };

  private controles(lienzo: HTMLCanvasElement) {
    // Se arrastra el dedo en cualquier parte: el retrete se mueve lo mismo que el dedo (no queda tapado)
    lienzo.addEventListener('pointerdown', (e) => {
      this.arrastre = { x: e.clientX, y: e.clientY };
      lienzo.setPointerCapture(e.pointerId);
      this.capa.querySelector('.ch-dedo')?.setAttribute('hidden', '');
    });
    lienzo.addEventListener('pointermove', (e) => {
      if (!this.arrastre || this.fase !== 'juego' || this.pausado) return;
      const k = (2 * this.limites.y + 1.9) / window.innerHeight;
      this.meta.x += (e.clientX - this.arrastre.x) * k * 1.2;
      this.meta.y -= (e.clientY - this.arrastre.y) * k * 1.2;
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
    if (e.type === 'keydown' && (e.key === 'p' || e.key === 'Escape')) this.pausar(!this.pausado);
    if (e.type === 'keydown' && e.key === ' ' && !e.repeat) this.soltarPatico();
  };

  private botones() {
    this.capa.querySelector('.ch-pausa')!.addEventListener('click', () => this.pausar(true));
    this.capa.querySelector('.ch-patico')!.addEventListener('click', () => this.soltarPatico());
    this.capa.querySelector('[data-seguir]')!.addEventListener('click', () => this.pausar(false));
    this.capa.querySelector('[data-rendirse]')!.addEventListener('click', () => {
      this.pausar(false);
      if (this.fase === 'juego') this.chocar(true);
    });
  }

  private pausar(si: boolean) {
    if (si && !(this.fase === 'juego' || this.fase === 'intro')) return;
    this.pausado = si;
    this.capa.querySelector('.ch-pausa-capa')!.toggleAttribute('hidden', !si);
    this.musica.pausar(si);
    this.arrastre = null;
    this.acumulado = 0;
  }

  // ------------------------------------------------------------------ Bucle
  private bucle(dt: number) {
    if (this.fase === 'fin') return;
    // Pruebas: el tiempo lo maneja `simular` (sin tarjeta gráfica cada cuadro tarda demasiado)
    if (this.manual) return;
    this.acumulado += dt;
    // 30 cuadros por segundo bastan (ahorra batería y no calienta)
    if (this.acumulado < 1 / 31) return;
    const paso = Math.min(0.1, this.acumulado);
    this.acumulado = 0;
    if (!this.pausado) {
      this.paso(paso);
      this.renderer.render(this.escena, this.camara);
      this.vigilarRitmo(paso);
    }
  }

  /** Si el celular no alcanza ~30 cuadros por segundo, se baja la resolución y las partículas. */
  private vigilarRitmo(dt: number) {
    if (this.calidad === 'baja' || document.hidden || this.fase !== 'juego') return;
    this.tiempos.push(dt);
    if (this.tiempos.length < 60) return;
    const orden = [...this.tiempos].sort((a, b) => a - b);
    this.tiempos = [];
    if (orden[30] > 1 / 26) {
      this.calidad = this.calidad === 'alta' ? 'media' : 'baja';
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.calidad === 'media' ? 1.3 : 1));
      this.brillo.densidad = this.humo.densidad = this.calidad === 'media' ? 0.7 : 0.45;
      if (this.calidad === 'baja') this.escenario.bajar();
      this.ajustar();
    }
  }

  /** Pruebas: avanza el juego a pasos fijos y pinta una vez. */
  simular(seg: number) {
    for (let t = 0; t < seg; t += 1 / 30) this.paso(1 / 30);
    this.renderer.render(this.escena, this.camara);
  }

  private paso(dt: number) {
    if (!this.modelos) return;
    this.t += dt;
    this.tFase += dt;
    const lento = this.poderes.tiene('lenta') ? 0.5 : 1;
    const turbo = this.turboActivo();
    this.muneco.update(dt);
    // Velocidad del mundo: sube con la distancia; el turbo la triplica y la cámara lenta la parte en dos
    const metros = this.distancia * METROS;
    const base = this.velocidadBase(metros);
    let v = 0;
    if (this.fase === 'juego') v = base * (turbo ? 2.7 : 1) * lento;
    else if (this.fase === 'intro') v = base * Math.min(1, this.tFase / 2.4) * 0.6;
    else if (this.fase === 'choque') v = base * Math.max(0, 1 - this.tFase * 0.8);
    else if (this.fase === 'resultado' || this.fase === 'taller') v = 1.2;
    this.velocidad += (v - this.velocidad) * Math.min(1, dt * (turbo ? 3 : 5));
    this.avance = this.velocidad * dt;
    if (this.fase === 'juego') this.distancia += this.avance;
    this.escenario.subiendo = this.fase === 'intro' ? Math.max(0, 1 - this.tFase / this.durIntro) : 0;
    this.escenario.actualizar(dt, this.avance, this.distancia * METROS, turbo ? 1 : 0);
    if (this.fase === 'intro') this.intro(dt);
    else if (this.fase === 'juego') this.juego(dt, lento);
    else if (this.fase === 'revivir') this.revivirPaso(dt);
    else if (this.fase === 'choque') this.choque(dt);
    else if (this.fase === 'resultado') this.vitrina(dt, false);
    else if (this.fase === 'taller') this.vitrina(dt, true);
    // Fuego y estela
    this.nave.updateMatrixWorld(true);
    const boca = this.tmp.set(0, -0.445 * ESCALA_RETRETE - 0.02, 0.05).applyMatrix4(this.soporte.matrixWorld);
    const dir = this.tmp2.set(-0.55, -1, 0).applyAxisAngle(EJE_Z, this.nave.rotation.z).normalize();
    this.propulsor.fuerza = this.fase === 'intro' ? 2.2 : turbo ? 2.6 : this.fase === 'taller' || this.fase === 'resultado' ? 0.7 : 1;
    this.propulsor.verde += ((turbo ? 1 : 0) - this.propulsor.verde) * Math.min(1, dt * 6);
    const prendido = this.fase !== 'choque' && this.fase !== 'resultado';
    this.propulsor.actualizar(dt, { x: boca.x, y: boca.y, dx: dir.x, dy: dir.y }, this.velocidad, prendido);
    this.moverLlama(boca, dir, prendido);
    const dtp = dt * (this.fase === 'juego' ? lento : 1);
    this.brillo.actualizar(dtp, this.velocidad);
    this.humo.actualizar(dtp, this.velocidad);
    this.fx.actualizar(dtp, this.velocidad);
    // Luces RGB del retrete gamer
    if (this.luces.length) this.luces.forEach((m, i) => m.emissive.setHSL((this.t * 0.25 + i * 0.17) % 1, 1, 0.5));
    // Cámara: sigue un poquito a la nave, tiembla con los golpes y abre el lente con el turbo
    this.temblor = Math.max(0, this.temblor - dt * 1.6);
    this.fov += ((turbo ? 58 : 50) - this.fov) * Math.min(1, dt * 3);
    if (Math.abs(this.camara.fov - this.fov) > 0.01) {
      this.camara.fov = this.fov;
      this.camara.updateProjectionMatrix();
    }
    if (this.fase !== 'taller' && this.fase !== 'resultado') {
      const sigue = THREE.MathUtils.clamp(this.nave.position.y * 0.12, -0.6, 0.6);
      this.camara.position.set((Math.random() - 0.5) * this.temblor, sigue + (Math.random() - 0.5) * this.temblor, 12);
      this.camara.lookAt(0, sigue * 0.6, 0);
    }
    this.globo(dt);
    if (this.debug) this.moverAros();
  }

  /** La llama del cohete: tres capas que titilan, apuntando hacia atrás y abajo. */
  private llama: THREE.Group | null = null;
  private matsLlama: THREE.MeshBasicMaterial[] = [];
  private moverLlama(boca: THREE.Vector3, dir: THREE.Vector3, prendido: boolean) {
    if (!this.llama) {
      this.llama = new THREE.Group();
      const perfil = [[0, 0], [0.09, 0.03], [0.13, 0.12], [0.11, 0.3], [0.07, 0.55], [0.03, 0.8], [0, 0.95]].map(([r, y]) => new THREE.Vector2(r, y));
      const g = new THREE.LatheGeometry(perfil, 20);
      for (const [k, col, op] of [[1, '#FF6A2A', 0.55], [0.72, '#FFB341', 0.75], [0.42, '#FFF7D6', 0.95]] as const) {
        const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, toneMapped: false });
        this.matsLlama.push(m);
        const c = new THREE.Mesh(g, m);
        c.scale.set(k * 1.6, k, k * 1.6);
        c.renderOrder = 6 - k;
        this.llama.add(c);
      }
      this.mundo.add(this.llama);
    }
    const l = this.llama;
    l.visible = prendido;
    if (!prendido) return;
    const f = this.propulsor.fuerza;
    const s = this.nave.scale.y / 1.5;
    l.position.copy(boca);
    l.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2;
    const tit = 1 + Math.sin(this.t * 41) * 0.12 + Math.sin(this.t * 67) * 0.08;
    l.scale.set(s * (1 + Math.sin(this.t * 33) * 0.06), s * (0.75 + f * 0.45) * tit, s);
    const verde = this.propulsor.verde;
    this.matsLlama[0].color.setRGB(1, 0.42 + verde * 0.4, 0.16 * (1 - verde));
    this.matsLlama[1].color.setRGB(1 - verde * 0.3, 0.7 + verde * 0.25, 0.25 * (1 - verde));
  }

  /**
   * Qué tan rápido va el mundo: los primeros ~25 s van tranquilos (para aprender a esquivar) y de ahí sube de a
   * poquito con la distancia.
   */
  private velocidadBase(metros: number) {
    const calma = THREE.MathUtils.smoothstep(this.tJuego, CALMA[0], CALMA[1]);
    return (VEL[0] + VEL[1] * (1 - Math.exp(-metros / VEL[2]))) * (CALMA[2] + (1 - CALMA[2]) * calma);
  }

  private turboActivo() {
    return this.poderes?.tiene('turbo') || this.turboArranque > 0;
  }

  // ------------------------------------------------------------------ Fases
  /** Arranca el despegue desde abajo (el primero y cada «Volar otra vez»). */
  private despegue(texto: string) {
    this.fase = 'intro';
    this.tFase = 0;
    this.cara('sorprendido', 99);
    rumor(this.durIntro - 0.2, 180, 0.12, 0, 0.6, 90);
    nota(90, this.durIntro - 0.4, 0, 'sawtooth', 0.05, 320);
    musica.callar(true);
    this.musica.iniciar();
    this.musica.pausar(false);
    this.musica.prisa = 1;
    this.musica.tramo(0);
    this.aviso(texto);
  }

  private intro(dt: number) {
    // Despega desde abajo, entre nubes que bajan, hasta su lugar
    const k = Math.min(1, this.tFase / this.durIntro);
    const e = 1 - Math.pow(1 - k, 3);
    this.nave.position.set(-this.limites.x * 0.45, -9 + 9 * e, 0);
    this.nave.rotation.z = Math.sin(this.t * 18) * 0.04 * (1 - k) - 0.1 * e;
    this.temblor = 0.3 * (1 - k);
    const medio = this.durIntro / 2;
    if (this.tFase > medio && this.tFase - dt <= medio) this.aviso('¡Esquiva lo que venga!');
    if (k >= 1) this.arrancar();
  }

  private arrancar() {
    this.fase = 'juego';
    this.tFase = 0;
    this.meta.set(this.nave.position.x, this.nave.position.y);
    this.capa.querySelector('.cohete-hud')!.removeAttribute('hidden');
    this.decir(this.frase(), 3.2);
    this.caraBase = 'nervioso';
    this.cara('nervioso', 99);
    this.revivir = valorDe(this.p, 'revivir');
    this.multVuelo = multiplicador(this.p);
    this.quitarPatico(false);
    this.esperaPatico = 0;
    this.pintarPatico();
    this.pintarRecord();
    // Lo comprado para el arranque
    const arr = valorDe(this.p, 'arranque');
    if (arr > 0) {
      this.turboArranque = arr / METROS;
      this.aviso('¡Arranque con frijoles!');
      this.cara('carcajada', 99);
      rumor(1.5, 120, 0.12, 0, 0.6, 50);
    }
    const esc = valorDe(this.p, 'escudo_inicio');
    if (esc > 0) this.poderes.activar('escudo', esc);
    if (this.p.vuelos < 2) {
      const d = this.capa.querySelector('.ch-dedo') as HTMLElement;
      d.hidden = false;
      setTimeout(() => (d.hidden = true), 4200);
    }
    this.mostrarTramo(0);
    // Las marcas del récord propio y de la pareja
    if (this.record > 150) this.marca(this.record, 'Tu récord', '#FFD23F');
    if (!this.neutro && (this.o.recordPareja ?? 0) > 150) this.marca(this.o.recordPareja!, `Récord de ${NOMBRE_ROL[otro(this.o.rol)]}`, '#FF7FB0');
  }

  private juego(dt: number, lento: number) {
    this.tJuego += dt;
    const turbo = this.turboActivo();
    if (this.turboArranque > 0) {
      this.turboArranque -= this.avance;
      if (this.turboArranque <= 0) {
        this.invulnerable = Math.max(this.invulnerable, 1.2);
        this.caraBase = 'nervioso';
        this.cara('nervioso', 99);
      }
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.pasoPatico(dt);
    const metros = this.distancia * METROS;
    this.cuentas.metros = metros;
    // Teclado (pruebas en el computador) y piloto automático
    const ej = (this.teclas.has('arrowright') || this.teclas.has('d') ? 1 : 0) - (this.teclas.has('arrowleft') || this.teclas.has('a') ? 1 : 0);
    const ei = (this.teclas.has('arrowup') || this.teclas.has('w') ? 1 : 0) - (this.teclas.has('arrowdown') || this.teclas.has('s') ? 1 : 0);
    this.meta.x += ej * dt * 8;
    this.meta.y += ei * dt * 8;
    if (this.bot) this.pilotar();
    // El agujero negro jala (hay que pelearle)
    this.meta.x += this.jalon.x * dt;
    this.meta.y += this.jalon.y * dt;
    const L = this.limites;
    // Que el personaje nunca se salga de la pantalla (la cabeza va 1,9 arriba del asiento)
    const s = this.nave.scale.y / 1.5;
    // (de lado a lado de lo que se ve: antes había una pared invisible al 30 % de la pantalla)
    this.meta.x = THREE.MathUtils.clamp(this.meta.x, -L.x + 0.8, L.x - 0.9);
    this.meta.y = THREE.MathUtils.clamp(this.meta.y, -L.y - 0.2 + 0.7 * s, L.y + 0.6 - 2.1 * s);
    const antes = this.nave.position.y;
    const n = this.nave.position;
    n.x += (this.meta.x - n.x) * Math.min(1, dt * 10);
    n.y += (this.meta.y - n.y) * Math.min(1, dt * 10);
    const vy = (n.y - antes) / Math.max(dt, 1e-3);
    this.nave.rotation.z += (THREE.MathUtils.clamp(-vy * 0.045, -0.4, 0.4) - 0.12 - this.nave.rotation.z) * Math.min(1, dt * 6);
    // Tamaño: chiquitico con la pastilla
    const meta = this.poderes.tiene('hormiga') ? 0.55 : 1;
    this.escalaHormiga += (meta - this.escalaHormiga) * Math.min(1, dt * 7);
    this.nave.scale.setScalar(1.5 * this.escalaHormiga);
    // Parpadeo mientras es invulnerable (sin contar el turbo)
    this.soporte.visible = this.invulnerable <= 0 || turbo || Math.sin(this.t * 30) > -0.3;
    // Tramos
    const tramo = tramoDe(metros);
    if (tramo !== this.tramoActual) this.mostrarTramo(tramo);
    // Lo que sale
    this.obst.dirigir(this.avance, metros, tramo, L.x, L.y, this.velocidad, dt * lento, false);
    this.poderes.aparecer(dt, L.x, L.y, this.obst.lista);
    this.proxFigura -= this.avance;
    if (this.proxFigura <= 0) {
      const f = this.figuraAlAzar(tramo);
      const n = this.rollos.poner(f, L.x + 3, rnd(-L.y * 0.7, L.y * 0.7), L.y - 0.3);
      this.proxFigura = Math.max(6, n * 0.45) + rnd(7, 13);
    }
    // Movimiento y choques
    const b = this.hitbox();
    this.obst.actualizar(dt, this.velocidad, L.x, L.y, b, this.jalon, lento);
    this.obst.choca(b, (o) => this.golpe(o, turbo));
    if (this.fase !== 'juego') return;
    this.obst.pasados(n.x, (o) => this.pasoCerca(o));
    // Rollitos (el imán y el ayudante los jalan)
    const iman = this.poderes.tiene('iman') || turbo ? { x: n.x, y: n.y + 0.5 * this.nave.scale.y, radio: turbo ? 2.2 : valorDe(this.p, 'fuerza_iman') } : null;
    const ay = this.poderes.ayudante ? this.poderes.posAyudante : null;
    this.poderes.guiarAyudante(dt, ay ? this.rollos.cercano(ay.x, ay.y, 7, -1) : null);
    this.rollos.actualizar(
      dt,
      this.avance,
      iman,
      (x, y) => this.toca(x, y, b) || (!!ay && (x - ay.x) ** 2 + (y - ay.y) ** 2 < 0.45),
      (x, y, valor) => this.cogerRollito(x, y, valor),
      (nombre, corazon) => this.figuraCompleta(nombre, corazon),
      ay,
    );
    // Poderes
    const agarrado = this.poderes.recoger(dt, this.avance, n.x, n.y + 0.5 * this.nave.scale.y, b.r);
    if (agarrado) this.agarrar(agarrado);
    for (const fin of this.poderes.actualizar(dt, this.velocidad, this.obst, (o) => this.destruido(o, 'laser'))) this.seAcabo(fin);
    if (!this.poderes.activos.size && !turbo) this.sinPoder += this.avance * METROS;
    this.cuentas.sinpoder = Math.max(this.cuentas.sinpoder, this.sinPoder);
    // Puntaje: los metros cuentan (×2 con el poder) por el multiplicador de misiones
    const mult = multiplicador(this.p) * (this.poderes.tiene('doble') ? 2 : 1);
    this.puntaje += this.avance * METROS * mult;
    this.cuentas.puntaje = Math.floor(this.puntaje);
    this.cuentas.tramo = Math.max(this.cuentas.tramo, tramo);
    Object.assign(this.cuentas, this.obst.cuentas);
    this.tRacha -= dt;
    if (this.tRacha <= 0) this.rachaRollitos = 0;
    // Récords en el camino
    if (!this.pasoRecord && this.record > 150 && metros > this.record) {
      this.pasoRecord = true;
      this.aviso('¡Récord nuevo!');
      this.decir('¡Récord nuevo! ¡Que me vean!', 2.2);
      this.fx.estallido(n.x, n.y + 1, CUADRO.estrella, ['#FFD23F', '#FFFFFF', '#FF9F1C'], 24, 6, 0.5, true);
      [784, 988, 1175, 1568].forEach((f, i) => nota(f, 0.2, i * 0.08, 'triangle', 0.06));
    }
    const rp = this.o.recordPareja ?? 0;
    if (!this.neutro && !this.pasoPareja && rp > 150 && metros > rp) {
      this.pasoPareja = true;
      this.decir(this.o.rol === 'el' ? '¡Te pasé, mi amor! 😏' : '¡Chao, mi amor! Te dejé atrás 💅', 2.6);
      this.fx.estallido(n.x, n.y + 1, CUADRO.corazon, ['#FF4F7E', '#FF8FB1'], 18, 5, 0.45);
    }
    this.moverMarcas();
    // Misiones (cada medio segundo)
    if (Math.floor(this.tJuego * 2) !== Math.floor((this.tJuego - dt) * 2)) this.revisarMisiones(false);
    // Frases de vez en cuando
    this.proxFrase -= dt;
    if (this.proxFrase <= 0) {
      this.decir(this.frase(), 3);
      this.proxFrase = rnd(9, 14);
    }
    if (this.carasHasta > 0 && this.t > this.carasHasta) {
      this.carasHasta = 0;
      this.cara(this.turboActivo() ? 'carcajada' : this.caraBase, 99);
    }
    this.hud(metros);
  }

  private figuraAlAzar(tramo: number) {
    // En la galaxia del amor salen más corazones y mensajes
    if (tramo >= 6 && Math.random() < 0.5) return figura(elegir([4, 5, 6, 7, 8]));
    const r = Math.random();
    if (r < 0.45) return figura(Math.floor(Math.random() * 4));
    return figura(Math.floor(Math.random() * FIGURAS.length));
  }

  /** Dónde está la nave para los choques (un círculo en el centro del personaje sentado en el retrete). */
  private hitbox() {
    const n = this.nave.position, s = this.nave.scale.y;
    this.blanco.x = n.x;
    this.blanco.y = n.y + 0.38 * s;
    this.blanco.r = 0.56 * s * valorDe(this.p, 'aero');
    return this.blanco;
  }

  /** ¿Un rollito toca la nave? (un poco más generoso que los choques). */
  private toca(x: number, y: number, b: { x: number; y: number; r: number }) {
    return (x - b.x) ** 2 + ((y - b.y) * 0.85) ** 2 < (b.r + 0.42) ** 2;
  }

  /** Algo tocó la nave: con turbo explota; con la burbuja revienta; si no, ¡pum! */
  private golpe(o: Obst, turbo: boolean): boolean {
    if (turbo) {
      if (o.tipo === 'rayo' || o.tipo === 'agujero') return false;
      if (o.destruible || o.tipo === 'avion') {
        this.destruido(o, 'turbo');
        this.obst.destruir(o);
        this.temblor = Math.max(this.temblor, 0.25);
      }
      return false;
    }
    if (this.invulnerable > 0 || this.dios) return false;
    if (this.poderes.tiene('escudo') && o.tipo !== 'agujero') {
      this.poderes.reventar();
      this.cuentas.escudos++;
      if (o.destruible) this.obst.destruir(o);
      this.invulnerable = 1.3;
      this.temblor = 0.4;
      this.decir('¡Plop! Se reventó la burbuja.', 1.6);
      this.cara('enojado', 0.9);
      nota(600, 0.15, 0, 'sine', 0.08, 1400);
      return false;
    }
    if (this.patico > 0 && o.tipo !== 'agujero') {
      this.reventarPatico();
      if (o.destruible) this.obst.destruir(o);
      this.invulnerable = 1.3;
      this.temblor = 0.45;
      this.decir(elegir(['¡Cuac! El patico me salvó.', '¡Gracias, patico!', 'Patico: 1, asteroide: 0']), 1.6);
      this.cara('sorprendido', 0.9);
      return false;
    }
    if (this.revivir > 0 && o.tipo !== 'agujero') {
      this.revivir--;
      this.empezarRevivir();
      return true;
    }
    this.causa = o.tipo;
    this.chocar(false, o.tipo === 'agujero');
    return true;
  }
  private causa = '';

  private destruido(o: Obst, por: 'turbo' | 'laser' | 'ambientador') {
    const mult = multiplicador(this.p) * (this.poderes.tiene('doble') ? 2 : 1);
    this.puntaje += o.puntos * mult;
    this.cuentas.destruidos++;
    if (por === 'laser') this.cuentas.laser++;
    if (o.tipo === 'ovni') this.cuentas.ovnis++;
    // A veces sueltan rollitos
    if (Math.random() < 0.35) for (let k = 0; k < 1 + Math.floor(Math.random() * 3); k++) this.rollos.suelto(o.x, o.y, 1, rnd(-3, 3), rnd(-3, 3));
  }

  private pasoCerca(o: Obst) {
    if (o.holgura < 0.5 && o.holgura >= 0 && !this.turboActivo()) {
      this.cuentas.casi++;
      const mult = multiplicador(this.p);
      this.puntaje += 50 * mult;
      if (Math.random() < 0.6) this.decir(elegir(CASI), 1.2);
      this.cara('sorprendido', 0.8);
      this.texto3d('¡Por un pelito! +50', '#FFE27A');
      rumor(0.3, 2400, 0.05, 0, 1, 500);
    }
    if (o.tipo === 'cometa' && !this.turboActivo()) this.decir('¡Esquivé el cometa!', 1.5);
    if (o.tipo === 'agujero') {
      this.decir(this.o.rol === 'el' || this.neutro ? '¡Casi me espaguetifico!' : '¡Me salvé del agujero negro!', 2);
      this.texto3d('¡Te escapaste del agujero negro!', '#C3A6FF');
    }
  }

  private cogerRollito(x: number, y: number, valor: number) {
    const doble = this.poderes.tiene('doble') ? 2 : 1;
    const n = valor * doble;
    this.rollitosVuelo += n;
    this.cuentas.rollitos += n;
    this.puntaje += 10 * n * multiplicador(this.p);
    this.rachaRollitos++;
    this.tRacha = 0.5;
    this.fx.chispazo(x, y, '#FFD23F', valor > 1 ? 16 : 5, valor > 1 ? 0.6 : 0.28);
    // Cada rollito seguido suena un poquito más agudo
    const f = 1046 * Math.pow(2, Math.min(this.rachaRollitos, 14) / 24);
    nota(f, 0.07, 0, 'triangle', 0.035);
    nota(f * 1.5, 0.05, 0.03, 'sine', 0.015);
    if (valor > 1) this.texto3d(`+${n} rollitos`, '#FFE27A');
  }

  private figuraCompleta(nombre: string, corazon: boolean) {
    this.cuentas.figuras++;
    if (corazon) this.cuentas.corazon++;
    const premio = 10 * (this.poderes.tiene('doble') ? 2 : 1);
    this.rollitosVuelo += premio;
    this.cuentas.rollitos += premio;
    this.texto3d(`¡${nombre[0].toUpperCase() + nombre.slice(1)} completo! +${premio}`, corazon ? '#FF8FB1' : '#FFE27A');
    const n = this.nave.position;
    if (corazon) this.fx.estallido(n.x + 1, n.y + 1, CUADRO.corazon, ['#FF4F7E', '#FF8FB1', '#FFFFFF'], 16, 5, 0.45);
    [1046, 1318, 1568].forEach((f, i) => nota(f, 0.12, i * 0.06, 'triangle', 0.05));
  }

  private agarrar(id: IdPoder) {
    const info = PODERES[id];
    this.cuentas.poderes++;
    this.sinPoder = 0;
    this.aviso(info.grito);
    this.decir(this.neutro ? NEUTRO.poder[id] : FRASE_PODER[id][this.o.rol], 2);
    [784, 988, 1318, 1568].forEach((f, i) => nota(f, 0.14, i * 0.05, 'triangle', 0.05));
    const n = this.nave.position;
    switch (id) {
      case 'turbo':
        this.cuentas.turbos++;
        this.poderes.activar('turbo');
        this.caraBase = 'nervioso';
        this.cara('carcajada', 99);
        this.temblor = 0.4;
        this.musica.prisa = 1.15;
        rumor(1.2, 110, 0.14, 0, 0.6, 45);
        // ¡Prrrt!
        nota(95, 0.35, 0, 'sawtooth', 0.07, 55);
        break;
      case 'ambientador': {
        // Una ola de lavanda que vuelve flores todo lo que hay en pantalla
        this.fx.onda(n.x, n.y, 30, 0.9, '#C3A6FF');
        this.fx.onda(n.x, n.y, 22, 0.7, '#FFB3E6');
        for (const o of this.obst.lista) {
          if (o.vivo && o.destruible && o.x < this.limites.x + 4) {
            this.destruido(o, 'ambientador');
            this.obst.destruir(o, 'flores');
          }
        }
        rumor(1.1, 5000, 0.08, 0, 0.5, 2000);
        this.cara('feliz', 1.5);
        break;
      }
      case 'paca': {
        // Llueven rollitos: un corazón lleno, una hilera doble y un rollito gigante
        const L = this.limites;
        this.rollos.poner(FIGURAS[5](), L.x + 2, 0, L.y - 0.3);
        this.rollos.poner(FIGURAS[1](), L.x + 7, rnd(-2, 2), L.y - 0.3);
        this.rollos.suelto(L.x + 1, rnd(-2, 2), 25);
        this.proxFigura += 10;
        this.cara('carcajada', 1.5);
        break;
      }
      default:
        this.poderes.activar(id);
        this.cara(id === 'doble' || id === 'laser' ? 'presumido' : id === 'lenta' ? 'concentrado' : 'feliz', 1.6);
        if (id === 'hormiga') nota(1200, 0.4, 0, 'sine', 0.06, 300);
        if (id === 'lenta') this.capa.classList.add('lenta');
    }
  }

  private seAcabo(id: IdPoder) {
    if (id === 'turbo') {
      this.invulnerable = Math.max(this.invulnerable, 1.5);
      this.decir('¡Ahhh, qué alivio!', 1.6);
      this.caraBase = 'nervioso';
      this.cara('nervioso', 99);
      this.musica.prisa = 1;
    }
    if (id === 'lenta') this.capa.classList.remove('lenta');
    if (id === 'hormiga') nota(300, 0.4, 0, 'sine', 0.06, 1200);
  }

  private empezarRevivir() {
    this.fase = 'revivir';
    this.tFase = 0;
    this.temblor = 0.6;
    const n = this.nave.position;
    this.fx.estallido(n.x, n.y + 0.5, CUADRO.corazon, ['#FF4F7E', '#FF8FB1', '#FFFFFF'], 30, 7, 0.55);
    this.fx.onda(n.x, n.y + 0.5, 9, 0.6, '#FF8FB1');
    this.aviso('¡Segunda oportunidad!');
    this.decir('¡Todavía no me voy!', 1.8);
    this.cara('sorprendido', 1);
    [523, 659, 784, 1046].forEach((f, i) => nota(f, 0.2, i * 0.09, 'sine', 0.07));
    this.capa.querySelector('.cohete-destello')!.classList.remove('va');
    void (this.capa.querySelector('.cohete-destello') as HTMLElement).offsetWidth;
    this.capa.querySelector('.cohete-destello')!.classList.add('va');
  }

  private revivirPaso(dt: number) {
    void dt;
    this.nave.rotation.z = Math.sin(this.tFase * 20) * 0.1 * (1 - this.tFase);
    if (this.tFase > 0.9) {
      this.obst.despejar(this.nave.position.x, this.nave.position.y, 7);
      this.invulnerable = 2.5;
      if (valorDe(this.p, 'revivir') >= 1 && (this.p.mejoras.revivir ?? 0) >= 2) this.poderes.activar('escudo', 6);
      this.fase = 'juego';
      this.tFase = 0;
    }
  }

  /** ¡Pum! (o se rindió desde la pausa). */
  private chocar(rendido: boolean, agujero = false) {
    this.fase = 'choque';
    this.tFase = 0;
    this.temblor = rendido ? 0.3 : 0.9;
    this.decir(agujero ? '¡Me chupa el agujero negrooo!' : elegir(FIN), 2);
    this.cara('llorando', 99);
    this.capa.classList.remove('lenta');
    const d = this.capa.querySelector('.cohete-destello')!;
    d.classList.remove('va');
    void (d as HTMLElement).offsetWidth;
    d.classList.add('va');
    rumor(1.4, 140, 0.2, 0, 0.5, 60);
    nota(110, 0.9, 0, 'sawtooth', 0.08, 40);
    const n = this.nave.position;
    if (!rendido) this.fx.explotar(n.x, n.y + 0.4, 1.6);
    this.poderes.vaciar();
    this.capa.querySelector('.cohete-hud')!.setAttribute('hidden', '');
    this.capa.querySelector('.ch-poderes')!.innerHTML = '';
    this.musica.pausar(true);
  }

  private choque(dt: number) {
    // Cae dando vueltas y echando humo
    this.nave.rotation.z += dt * 7 * Math.max(0.2, 1 - this.tFase * 0.4);
    this.nave.position.y -= dt * (1.5 + this.tFase * 4);
    this.nave.position.x -= dt * 1.2;
    this.soporte.visible = true;
    if (Math.random() < dt * 30) {
      const n = this.nave.position;
      this.humo.emitir({ x: n.x, y: n.y + 0.4, vx: rnd(-1, 1), vy: rnd(0.5, 1.5), vida: 1.2, tam0: 0.6, tam1: 1.8, color0: '#5A5050', color1: '#2A2630', alfa: 0.7, cuadro: CUADRO.humo, roce: 1 });
    }
    if (this.tFase > 1.9) this.terminarVuelo();
  }

  // ------------------------------------------------------------------ Patico salvavidas
  /** Segundos que le quedan al patico puesto (0: no hay) y la espera para soltar otro. */
  private patico = 0;
  private esperaPatico = 0;
  private paticoObj: THREE.Object3D | null = null;
  private paticoAnim = 0;
  private paticoHud = '';

  /** Suelta un patico (si tiene, no hay uno puesto y ya pasó la espera). */
  private soltarPatico() {
    if (this.fase !== 'juego' || this.pausado || this.p.paticos <= 0 || this.patico > 0 || this.esperaPatico > 0) {
      nota(220, 0.12, 0, 'triangle', 0.04);
      return;
    }
    this.p.paticos--;
    this.cuentas.paticos++;
    this.patico = DURA_PATICO;
    if (!this.paticoObj && this.modelos?.tiene('patico')) {
      this.paticoObj = this.modelos.cosa('patico', 1.15);
      // A la cintura del retrete, acostado, con la cabeza del pato hacia adelante
      this.paticoObj?.position.set(0, -0.22 * ESCALA_RETRETE, 0.02);
    }
    if (this.paticoObj) {
      this.soporte.add(this.paticoObj);
      this.paticoObj.visible = true;
    }
    this.paticoAnim = 0;
    // ¡Cuac cuac! y se infla
    [1245, 1480].forEach((f, k) => nota(f, 0.09, k * 0.12, 'square', 0.035, f * 1.35));
    rumor(0.35, 1800, 0.05, 0, 0.6, 900);
    this.aviso('¡Patico salvavidas!');
    this.decir(elegir(['¡Al agua, patico!', 'Con mi patico no me pasa nada', '¡Cuac! Protegido por 30 segundos']), 1.8);
    this.pintarPatico();
  }

  /** El patico aguantó el golpe: se revienta en plumitas y empieza la espera. */
  private reventarPatico() {
    const o = this.paticoObj;
    if (o) {
      const w = o.getWorldPosition(this.tmp);
      for (let k = 0; k < 26; k++) {
        const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 4;
        this.brillo.emitir({
          x: w.x, y: w.y, z: 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.5 + Math.random() * 0.5, tam0: 0.5, tam1: 0.1,
          color0: k % 3 ? '#FFD23F' : '#FFFFFF', color1: '#FF9A1F', cuadro: CUADRO.chispa, roce: 2, arrastre: 0.6,
        });
      }
    }
    [880, 660, 440].forEach((f, k) => nota(f, 0.12, k * 0.07, 'square', 0.04, f * 0.7));
    this.quitarPatico(true);
  }

  /** Se acaba (o se revienta): desaparece y corre la espera para el siguiente. */
  private quitarPatico(espera: boolean) {
    this.patico = 0;
    if (espera) this.esperaPatico = ESPERA_PATICO;
    if (this.paticoObj) {
      this.paticoObj.visible = false;
      this.paticoObj.removeFromParent();
    }
    this.pintarPatico();
  }

  private pasoPatico(dt: number) {
    if (this.esperaPatico > 0) this.esperaPatico = Math.max(0, this.esperaPatico - dt);
    if (this.patico > 0) {
      this.patico -= dt;
      const o = this.paticoObj;
      if (o) {
        // Se infla al ponerlo, se mece y en los últimos segundos titila (se está desinflando)
        this.paticoAnim = Math.min(1, this.paticoAnim + dt * 4);
        const k = this.paticoAnim;
        const infla = k < 1 ? 1 - Math.pow(1 - k, 3) * Math.cos(k * 9) : 1;
        const des = this.patico < 3 ? 0.85 + 0.15 * Math.max(0, this.patico / 3) : 1;
        o.scale.setScalar(Math.max(0.01, infla * des));
        // (el modelo trae la cabeza hacia atrás del retrete: media vuelta para que mire a la cámara)
        o.rotation.set(Math.sin(this.t * 3) * 0.08, Math.PI + Math.sin(this.t * 1.7) * 0.25, Math.sin(this.t * 2.3) * 0.06);
        o.visible = this.patico > 3 || Math.sin(this.t * 22) > -0.4;
      }
      if (this.patico <= 0) {
        nota(520, 0.25, 0, 'sine', 0.04, 260);
        this.quitarPatico(true);
      }
    }
    this.pintarPatico();
  }

  /** El botón: cuántos quedan, si está puesto (con su tiempo) o esperando (con el reloj). */
  private pintarPatico() {
    const b = this.capa?.querySelector<HTMLElement>('.ch-patico');
    if (!b || !this.p) return;
    const estado = this.patico > 0 ? 'puesto' : this.esperaPatico > 0 ? 'espera' : this.p.paticos > 0 ? 'listo' : 'vacio';
    const k = this.patico > 0 ? this.patico / DURA_PATICO : this.esperaPatico > 0 ? 1 - this.esperaPatico / ESPERA_PATICO : 1;
    const clave = `${this.fase}|${estado}|${this.p.paticos}|${Math.round(k * 40)}`;
    if (clave === this.paticoHud) return;
    this.paticoHud = clave;
    b.hidden = this.fase !== 'juego' || (this.p.paticos <= 0 && this.patico <= 0 && this.esperaPatico <= 0);
    b.dataset.estado = estado;
    b.style.setProperty('--k', k.toFixed(3));
    b.querySelector('b')!.textContent = String(this.p.paticos);
  }

  // ------------------------------------------------------------------ Fin del vuelo
  private cumplidas: { texto: string; premio: number }[] = [];
  private revisarMisiones(cerrar: boolean) {
    const r = revisarMisiones(this.p, this.cuentas, this.inicioMisiones, cerrar);
    for (const c of r.cumplidas) {
      this.toastMision(c.texto, c.premio);
      this.cumplidas.push(c);
    }
    return r;
  }

  private terminarVuelo() {
    const p = this.p;
    const metros = Math.floor(this.distancia * METROS);
    // Rollitos: lo recogido más el papel triple hoja
    const extra = Math.round(this.rollitosVuelo * valorDe(p, 'triple'));
    const ganados = this.rollitosVuelo + extra;
    const antesNivel = p.nivel;
    const misiones = p.misiones.map((m) => ({ ...m }));
    const r = this.revisarMisiones(true);
    // Las que se completaron al terminar ya quedaron hechas en la copia de antes
    if (r.subio) for (const m of misiones) m.hecha = true;
    p.rollitos += ganados;
    p.ganados += ganados;
    p.vuelos++;
    // Lo de este vuelo cuenta para los retos de los retretes, estelas y cascos
    this.cuentas.metros = Math.max(this.cuentas.metros, metros);
    registrarVuelo(p, this.cuentas);
    const cosmeticos = ganarCosmeticos(p);
    const record = metros > p.mejor;
    if (record) p.mejor = metros;
    const recordPuntaje = this.puntaje > p.mejorPuntaje;
    if (recordPuntaje) p.mejorPuntaje = Math.floor(this.puntaje);
    void this.o.guardar?.(copiaProgreso(p));
    this.vuelosSesion++;
    this.resultado = {
      metros, puntaje: Math.floor(this.puntaje), rollitos: this.rollitosVuelo, extraTriple: extra, record, recordPuntaje,
      segundos: this.tJuego, mult: this.multVuelo, misionesAntes: misiones, cumplidas: this.cumplidas, subio: r.subio, nivelAntes: antesNivel,
      progreso: p, rol: this.o.rol, recordPareja: this.neutro ? 0 : this.o.recordPareja ?? 0, casa: null, textoSalir: this.o.textoSalir,
      cosmeticos,
    };
    // Las monedas de la casa se dan apenas aterriza (si se cierra la app en la pantalla del vuelo, no se pierden)
    const res = this.resultado;
    void this.o.premio?.(this.tJuego)
      .then((pc) => {
        this.monedasSesion += pc.monedas;
        res.casa = pc;
        if (this.resultado === res) pintarPremioCasa(this.capa, pc);
      })
      .catch(() => undefined);
    // Cae con un paracaídas de papel higiénico
    this.fase = 'resultado';
    this.tFase = 0;
    this.obst.vaciar();
    this.rollos.vaciar();
    this.nave.rotation.set(0, 0, 0);
    this.nave.position.set(-this.limites.x * 0.42, 6, 0);
    this.nave.scale.setScalar(1.5);
    this.escalaHormiga = 1;
    this.ponerParacaidas(true);
    this.cara(record ? 'carcajada' : 'puchero', 99);
    setTimeout(() => this.mostrarResultado(), 900);
  }

  private mostrarResultado() {
    if (!this.resultado || this.fase === 'fin') return;
    mostrarResultado(this.capa, this.resultado, {
      tienda: () => this.entrarTaller(),
      casa: () => this.terminar(),
      otra: () => this.otraVez(),
    });
  }

  /** La vitrina: el retrete flotando grande (resultado) o dando vueltas para la tienda. */
  private vitrina(dt: number, taller: boolean) {
    const n = this.nave.position;
    if (taller) {
      const x = -this.limites.x * 0.52;
      n.x += (x - n.x) * Math.min(1, dt * 4);
      n.y += (-0.9 + Math.sin(this.t * 1.4) * 0.15 - n.y) * Math.min(1, dt * 4);
      this.soporte.rotation.y += dt * 0.45;
      this.nave.rotation.z = Math.sin(this.t * 1.1) * 0.05;
      this.nave.scale.setScalar(THREE.MathUtils.lerp(this.nave.scale.x, 2.1, Math.min(1, dt * 3)));
    } else {
      const meta = -0.6 + Math.sin(this.t * 0.9) * 0.25;
      n.y += (meta - n.y) * Math.min(1, dt * 1.6);
      n.x += (-this.limites.x * 0.42 - n.x) * Math.min(1, dt * 2);
      this.nave.rotation.z = Math.sin(this.t * 1.3) * 0.12;
      this.soporte.rotation.y += (0.35 - this.soporte.rotation.y) * Math.min(1, dt * 2);
    }
    this.camara.position.set(0, 0, 12);
    this.camara.lookAt(0, 0, 0);
  }

  private ponerParacaidas(si: boolean) {
    if (!si) {
      if (this.paracaidas) this.paracaidas.visible = false;
      return;
    }
    if (!this.paracaidas) {
      const g = new THREE.Group();
      // Cúpula de papel higiénico con franjas pastel
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      const cols = ['#FFFFFF', '#FFE3EC', '#FFFFFF', '#DFF3FF'];
      for (let k = 0; k < 8; k++) {
        ctx.fillStyle = cols[k % 4];
        ctx.fillRect(k * 32, 0, 32, 64);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let k = 0; k < 40; k++) ctx.fillRect((k * 37) % 256, (k * 23) % 64, 2, 2);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      const cupula = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.9 }));
      cupula.scale.set(1, 0.7, 1);
      cupula.position.y = 2.3;
      g.add(cupula);
      const pts: number[] = [];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        pts.push(Math.cos(a) * 1.25 * 0.97, 2.3 + 0.62 * 0.7 * 0.5, Math.sin(a) * 1.25 * 0.97, 0, 0.95, 0);
      }
      const gl = new THREE.BufferGeometry();
      gl.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      g.add(new THREE.LineSegments(gl, new THREE.LineBasicMaterial({ color: '#F2E6D8' })));
      this.paracaidas = g;
      this.nave.add(g);
    }
    this.paracaidas.visible = true;
  }

  /**
   * «Volar otra vez» desde la pantalla del vuelo: todo vuelve a empezar ahí mismo (sin pasar por la casa). Se reusa lo
   * que ya está armado (modelos, partículas, escenario y el mismo lienzo): nada se vuelve a cargar ni se acumula.
   */
  private otraVez() {
    if (this.fase !== 'resultado') return;
    this.capa.querySelector('.cohete-resultado')?.remove();
    // Lo del vuelo
    this.inicioMisiones = this.p.misiones.map((m) => m.avance);
    this.cuentas = cuentasNuevas();
    this.cumplidas = [];
    this.record = this.p.mejor;
    this.resultado = null;
    this.distancia = this.puntaje = this.rollitosVuelo = this.tJuego = this.sinPoder = 0;
    this.revivir = this.invulnerable = this.turboArranque = 0;
    this.quitarPatico(false);
    this.esperaPatico = 0;
    this.rachaRollitos = this.tRacha = 0;
    this.proxFigura = 3;
    this.proxFrase = 7;
    this.pasoRecord = this.pasoPareja = false;
    this.causa = '';
    this.carasHasta = 0;
    this.jalon.set(0, 0);
    this.escalaHormiga = 1;
    this.tramoActual = -1;
    this.hudCache = { m: -1, r: -1, p: -1, mult: -1, poderes: '' };
    for (const m of this.marcas) this.soltarMarca(m.g);
    this.marcas = [];
    this.obst.reiniciar();
    this.rollos.vaciar();
    this.poderes.reiniciar();
    this.escenario.reiniciar();
    // La nave vuelve abajo, sin paracaídas, lista para despegar
    this.ponerParacaidas(false);
    this.nave.rotation.set(0, 0, 0);
    this.nave.scale.setScalar(1.5);
    this.nave.position.set(-this.limites.x * 0.45, -9, 0);
    this.soporte.rotation.y = 0.55;
    this.soporte.visible = true;
    this.capa.classList.remove('lenta');
    this.capa.querySelector('.ch-poderes')!.innerHTML = '';
    this.capa.querySelector('.ch-avisos')!.innerHTML = '';
    (this.capa.querySelector('.ch-mision') as HTMLElement).hidden = true;
    this.durIntro = 1.8;
    this.despegue('¡Otra vez!');
    this.decir(elegir(this.neutro ? NEUTRO.otraVez : OTRA_VEZ[this.o.rol]), 2.2);
  }

  private soltarMarca(g: THREE.Group) {
    g.removeFromParent();
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.MeshBasicMaterial | undefined;
      mat?.map?.dispose();
      mat?.dispose();
    });
  }

  private entrarTaller() {
    this.fase = 'taller';
    this.tFase = 0;
    this.ponerParacaidas(false);
    this.capa.querySelector('.cohete-hud')?.setAttribute('hidden', '');
    this.capa.querySelector('.cohete-resultado')?.remove();
    if (this.o.soloTienda) {
      this.nave.position.set(-this.limites.x * 0.52, -0.9, 0);
      // Sin vuelo, la tienda se ve en la órbita (la Tierra girando abajo y sin nubes que tapen el retrete)
      this.distancia = 900 / METROS;
    }
    this.cara('feliz', 99);
    this.tienda = new Tienda(this.capa, this.p, this.o.rol, {
      probar: (tipo, id) => this.probar(tipo, id),
      comprado: () => {
        void this.o.guardar?.(copiaProgreso(this.p));
        this.cara('carcajada', 1.4);
        const n = this.nave.position;
        this.fx.estallido(n.x, n.y + 1.2, CUADRO.estrella, ['#FFD23F', '#FFFFFF', '#FF9F1C'], 18, 5, 0.45, true);
      },
      cerrar: () => {
        this.tienda = null;
        // Lo que se dejó puesto (lo probado sin comprar vuelve a lo de antes)
        this.probar('retrete', this.p.puesto.retrete);
        this.probar('estela', this.p.puesto.estela);
        this.probar('casco', this.p.puesto.casco);
        if (this.o.soloTienda || !this.resultado) this.terminar();
        else {
          this.fase = 'resultado';
          this.soporte.rotation.y = 0.35;
          this.ponerParacaidas(true);
          this.mostrarResultado();
        }
      },
    });
  }

  private cascoProbado = '';
  private probar(tipo: TipoCosmetico, id: string) {
    if (tipo === 'retrete') this.ponerRetrete(id);
    else if (tipo === 'estela') this.propulsor.estela = id;
    else if (id !== this.cascoProbado) {
      this.cascoProbado = id;
      void this.ponerCasco(id);
    }
    if (tipo === 'casco') this.cascoProbado = id;
    this.cara('presumido', 1.2);
  }

  private terminar() {
    if (this.fase === 'fin') return;
    this.fase = 'fin';
    this.bucleFondo?.detener();
    for (const q of this.quitarFondo) q();
    this.musica.detener();
    musica.callar(false);
    ponerNeutroCohete(false);
    window.removeEventListener('resize', this.ajustar);
    window.removeEventListener('keydown', this.tecla);
    window.removeEventListener('keyup', this.tecla);
    this.capa.classList.remove('visible');
    const r: Resultado = {
      segundos: Math.round(this.tJuego * 10) / 10,
      metros: Math.floor(this.distancia * METROS),
      puntaje: Math.floor(this.puntaje),
      rollitos: this.rollitosVuelo,
      volo: this.vuelosSesion > 0,
      vuelos: this.vuelosSesion,
      monedas: this.monedasSesion,
    };
    setTimeout(() => {
      this.liberar();
      if (cohete.actual === this) cohete.actual = null;
      this.listo(r);
    }, 450);
  }

  private liberar() {
    this.poderes?.liberar();
    this.obst?.vaciar();
    this.obst?.liberar();
    this.rollos?.liberar();
    this.brillo?.liberar();
    this.humo?.liberar();
    this.escenario?.liberar();
    this.modelos?.liberar();
    this.vestuario?.liberar();
    for (const m of this.tintes) m.dispose();
    this.tintes = [];
    for (const m of this.cascoMallas) m.removeFromParent();
    liberarEsqueletos(...this.cascoMallas);
    liberarEsqueletos(this.muneco.p.grupo);
    for (const m of this.marcas) this.soltarMarca(m.g);
    this.marcas = [];
    this.atlas.dispose();
    this.texHalo.dispose();
    this.escena.environment?.dispose();
    this.renderer.dispose();
    // Suelta el contexto 3D de una vez: si no, se van acumulando y el celular le quita el suyo a la casa (pantalla en blanco)
    this.renderer.forceContextLoss();
    this.capa.remove();
  }

  // ------------------------------------------------------------------ Interfaz
  private hudCache = { m: -1, r: -1, p: -1, mult: -1, poderes: '' };
  private hud(metros: number) {
    const c = this.hudCache;
    const m = Math.floor(metros);
    if (m !== c.m) {
      c.m = m;
      this.capa.querySelector('.ch-metros')!.textContent = `${mil(m)} m`;
    }
    if (this.rollitosVuelo !== c.r) {
      c.r = this.rollitosVuelo;
      const b = this.capa.querySelector('.ch-rollitos b')!;
      b.textContent = mil(c.r);
      const s = this.capa.querySelector('.ch-rollitos') as HTMLElement;
      s.classList.remove('salta');
      void s.offsetWidth;
      s.classList.add('salta');
    }
    const pts = Math.floor(this.puntaje / 10) * 10;
    if (pts !== c.p) {
      c.p = pts;
      this.capa.querySelector('.ch-puntos b')!.textContent = mil(pts);
    }
    const mult = multiplicador(this.p) * (this.poderes.tiene('doble') ? 2 : 1);
    if (mult !== c.mult) {
      c.mult = mult;
      const em = this.capa.querySelector('.ch-puntos em') as HTMLElement;
      em.textContent = `×${mult}`;
      em.classList.toggle('doble', this.poderes.tiene('doble'));
    }
    // Poderes activos con su reloj
    const lista = [...this.poderes.activos.entries()];
    if (this.turboArranque > 0) lista.unshift(['turbo', { resta: this.turboArranque * METROS / 100, total: valorDe(this.p, 'arranque') / 100 }]);
    const clave = lista.map(([id]) => id).join(',');
    const cont = this.capa.querySelector('.ch-poderes') as HTMLElement;
    if (clave !== c.poderes) {
      c.poderes = clave;
      cont.innerHTML = lista.map(([id]) => `<span class="ch-poder" data-p="${id}" style="--c:${PODERES[id].color}"><img src="./modelos/iconos/cohete_poder_${id}.webp" alt="" onerror="this.style.visibility='hidden'"><i></i></span>`).join('');
    }
    for (const [id, a] of lista) {
      const el = cont.querySelector(`[data-p="${id}"]`) as HTMLElement | null;
      if (el) {
        const k = Math.max(0, a.resta / a.total);
        el.style.setProperty('--k', `${k * 360}deg`);
        el.classList.toggle('acaba', a.resta < 2);
      }
    }
  }

  private pintarRecord() {
    const r = this.capa.querySelector('.ch-record')!;
    r.textContent = this.record > 0 ? `Récord ${mil(this.record)} m` : '¡Primer vuelo!';
  }

  /** Banderita en el camino con un récord (tuyo o de la pareja). */
  private marca(metros: number, texto: string, color: string) {
    const g = new THREE.Group();
    const linea = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 13), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
    g.add(linea);
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 96;
    const ctx = c.getContext('2d')!;
    ctx.font = '800 44px Fredoka, Nunito, system-ui, sans-serif';
    const w = Math.min(500, ctx.measureText(texto).width + 48);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect((512 - w) / 2, 14, w, 68, 34);
    ctx.fill();
    ctx.fillStyle = '#3D2B27';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, 256, 50);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(3.6, 0.68, 1);
    s.position.y = this.limites.y + 0.1;
    g.add(s);
    g.visible = false;
    this.mundo.add(g);
    this.marcas.push({ g, metros });
  }

  private moverMarcas() {
    for (const m of this.marcas) {
      const x = this.nave.position.x + (m.metros / METROS - this.distancia);
      m.g.visible = x < this.limites.x + 4 && x > -this.limites.x - 4;
      m.g.position.x = x;
    }
  }

  private mostrarTramo(i: number) {
    const anterior = this.tramoActual;
    this.tramoActual = i;
    this.musica.tramo(i);
    const t = this.capa.querySelector('.cohete-tramo') as HTMLElement;
    t.querySelector('small')!.textContent = i === 0 ? 'Despegando de' : `Tramo ${i + 1}`;
    t.querySelector('b')!.textContent = nombreTramo(i);
    t.classList.remove('sale');
    void t.offsetWidth;
    t.classList.add('sale');
    if (anterior >= 0) {
      this.decir((this.neutro ? NEUTRO.tramo : FRASES_TRAMO[this.o.rol])[i], 3);
      this.proxFrase = 8;
      nota(523, 0.3, 0, 'sine', 0.05);
      nota(784, 0.4, 0.12, 'sine', 0.05);
    }
  }

  private toastMision(texto: string, premio: number) {
    const m = this.capa.querySelector('.ch-mision') as HTMLElement;
    m.innerHTML = `<b>¡Misión cumplida!</b><span>${texto}</span><em>+${mil(premio)} <i class="ico-rollito"></i></em>`;
    m.hidden = false;
    m.classList.remove('sale');
    void m.offsetWidth;
    m.classList.add('sale');
    [1046, 1318, 1568, 2093].forEach((f, i) => nota(f, 0.16, i * 0.07, 'triangle', 0.05));
    clearTimeout(this.tMision);
    this.tMision = setTimeout(() => (m.hidden = true), 3200);
  }
  private tMision: ReturnType<typeof setTimeout> | undefined;

  private avisoBorde(y: number, tipo: 'cometa' | 'avion' | 'rayo') {
    const cont = this.capa.querySelector('.ch-avisos') as HTMLElement;
    const p = this.tmp.set(this.limites.x, y, 0).project(this.camara);
    const top = (-p.y * 0.5 + 0.5) * window.innerHeight;
    const e = document.createElement('div');
    e.className = `ch-alerta ${tipo}`;
    e.style.top = `${top}px`;
    e.innerHTML = tipo === 'rayo' ? '<i></i>' : '<b>!</b>';
    cont.append(e);
    setTimeout(() => e.remove(), tipo === 'rayo' ? 1000 : 1350);
  }

  /** Texto que sube desde la nave («¡Por un pelito!», «+25 rollitos»). */
  private texto3d(texto: string, color: string) {
    const n = this.nave.position;
    const p = this.tmp.set(n.x, n.y + 1.6 * this.nave.scale.y, 0).project(this.camara);
    const e = document.createElement('div');
    e.className = 'ch-flota';
    e.style.left = `${(p.x * 0.5 + 0.5) * window.innerWidth}px`;
    e.style.top = `${(-p.y * 0.5 + 0.5) * window.innerHeight}px`;
    e.style.color = color;
    e.textContent = texto;
    this.capa.append(e);
    setTimeout(() => e.remove(), 1300);
  }

  /** Cara del personaje (por un rato o fija). */
  private cara(c: string, seg: number) {
    const feliz = ['feliz', 'carcajada', 'presumido', 'guino'].includes(c);
    void this.muneco.actuar({
      nombre: 'retrete',
      pasos: [{ dur: 99, pose: feliz ? 'sentado_feliz' : 'sentado', cara: c, mov: c === 'nervioso' ? [{ tipo: 'temblor', amp: 0.004, frec: 9 }] : c === 'carcajada' ? [{ tipo: 'rebote', alto: 0.02, frec: 5 }] : undefined }],
      bucle: true,
    });
    this.carasHasta = seg < 90 ? this.t + seg : 0;
  }

  /** Una frase al azar para el vuelo (la del modo neutro si juega un amigo). */
  private frase() {
    return elegir(this.neutro ? NEUTRO.frases : FRASES[this.o.rol]);
  }

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
    if (this.tGlobo <= 0 || this.fase === 'taller') {
      g.hidden = true;
      return;
    }
    const n = this.nave.position;
    const p = this.tmp.set(n.x + 0.3, n.y + 1.75 * this.nave.scale.y, 0).project(this.camara);
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

  // ------------------------------------------------------------------ Pruebas
  /** Piloto automático: busca la altura con menos peligro (y con rollitos y poderes cerca). */
  private pilotar() {
    const L = this.limites;
    const n = this.nave.position;
    const b = this.hitbox();
    let mejor = n.y, menor = Infinity;
    const sc = this.nave.scale.y / 1.5;
    const y0 = -L.y - 0.2 + 0.7 * sc, y1 = L.y + 0.6 - 2.1 * sc;
    for (let k = 0; k <= 16; k++) {
      const y = y0 + ((y1 - y0) * k) / 16;
      let peligro = Math.abs(y - n.y) * 0.08;
      for (const o of this.obst.lista) {
        if (!o.vivo || o.x < n.x - 1.5) continue;
        const rel = o.vx - this.velocidad * o.arrastre;
        const tLlega = rel < -0.1 ? (o.x - n.x) / -rel : o.tipo === 'ovni' ? 0.5 : 99;
        if (o.tipo === 'rayo') {
          if (Math.abs(y + 0.38 * this.nave.scale.y - o.y) < 1.4) peligro += 50;
          continue;
        }
        if (o.tipo === 'ovni' && (o.fase === 'carga' || o.fase === 'dispara')) {
          if (Math.abs(y + 0.38 * this.nave.scale.y - o.y) < 1.8) peligro += 40;
        }
        if (tLlega > 2.5) continue;
        const yo = o.y + o.vy * tLlega;
        const lado = o.radio + b.r + 0.9;
        const d = Math.abs(yo - (y + 0.38 * this.nave.scale.y));
        if (d < lado) peligro += (12 * (1 - d / lado)) / (tLlega + 0.25);
      }
      this.rollos.cada((x, ry) => {
        if (x > n.x && x < n.x + 7 && Math.abs(ry - y) < 0.9) peligro -= 0.05;
      });
      for (const f of this.poderes.flotando) if (f.x > n.x && f.x < n.x + 9 && Math.abs(f.y - y) < 1) peligro -= 1.5;
      if (peligro < menor) {
        menor = peligro;
        mejor = y;
      }
    }
    this.meta.y += (mejor - this.meta.y) * 0.35;
    this.meta.x += (-L.x * 0.5 - this.meta.x) * 0.1;
  }

  private armarAros() {
    for (let k = 0; k < 1; k++) {
      const pts = [];
      for (let i = 0; i < 32; i++) pts.push(new THREE.Vector3(Math.cos((i / 32) * Math.PI * 2), Math.sin((i / 32) * Math.PI * 2), 0.5));
      const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#00FF88', depthTest: false }));
      l.renderOrder = 99;
      this.mundo.add(l);
      this.aros.push(l);
    }
  }

  private moverAros() {
    const b = this.hitbox();
    this.aros[0].position.set(b.x, b.y, 0.5);
    this.aros[0].scale.setScalar(b.r);
  }

  /** Para las pruebas. */
  get estado() {
    return {
      fase: this.fase, metros: Math.floor(this.distancia * METROS), puntaje: Math.floor(this.puntaje), rollitos: this.rollitosVuelo, t: this.tJuego,
      poderes: [...this.poderes?.activos.keys() ?? []], obstaculos: this.obst?.lista.length ?? 0, tramo: this.tramoActual, revivir: this.revivir,
      progreso: this.p, cuentas: this.cuentas, calidad: this.calidad, particulas: (this.brillo?.vivas ?? 0) + (this.humo?.vivas ?? 0), causa: this.causa,
    };
  }
  pruebaPoder(id: IdPoder) {
    if (this.fase === 'juego') this.agarrar(id);
  }
  pruebaSaltar(metros: number) {
    this.distancia += metros / METROS;
  }
  pruebaBot(si: boolean) {
    this.bot = si;
  }
  pruebaSacar(id: IdPoder) {
    this.poderes.sacar(id, this.nave.position.x + 4, this.nave.position.y + 0.5);
  }
  pruebaRollitos(n: number) {
    this.p.rollitos += n;
    void this.o.guardar?.(copiaProgreso(this.p));
    this.tienda?.repintar();
  }
  pruebaMejoras(m: Partial<Record<IdMejora, number>>) {
    Object.assign(this.p.mejoras, m);
  }
  pruebaChocar() {
    if (this.fase === 'juego') this.chocar(false);
  }
  pruebaBoton(sel: string) {
    (this.capa.querySelector(sel) as HTMLElement | null)?.click();
  }
}

/** Para las pruebas: el juego en curso. */
export const cohete: { actual: RetreteEspacial | null } = { actual: null };

/** Ganchos de prueba: `__cohete.dar(500)`, `.saltar(1000)`, `.poder('turbo')`, `.bot(true)`, `.simular(5)`… */
(window as any).__cohete = {
  juego: () => cohete.actual,
  estado: () => cohete.actual?.estado,
  simular: (seg: number) => cohete.actual?.simular(seg),
  dar: (n: number) => cohete.actual?.pruebaRollitos(n),
  saltar: (m: number) => cohete.actual?.pruebaSaltar(m),
  poder: (id: IdPoder) => cohete.actual?.pruebaPoder(id),
  sacar: (id: IdPoder) => cohete.actual?.pruebaSacar(id),
  bot: (si = true) => cohete.actual?.pruebaBot(si),
  manual: (si = true) => cohete.actual && (cohete.actual.manual = si),
  chocar: () => cohete.actual?.pruebaChocar(),
  mejoras: (m: Partial<Record<IdMejora, number>>) => cohete.actual?.pruebaMejoras(m),
  dios: (si = true) => cohete.actual && (cohete.actual.dios = si),
  boton: (sel: string) => cohete.actual?.pruebaBoton(sel),
  patico: () => cohete.actual?.pruebaBoton('.ch-patico'),
};

/**
 * Para las pruebas de amigos: todo lo de la pareja que el modo neutro esconde (las frases propias de Javier y Laura,
 * las palabras de las figuras, la galaxia del amor y las banderitas de la pareja). Un amigo no debe ver nada de esto.
 */
export function textosDeLaPareja(): string[] {
  const neutras = new Set<string>([...NEUTRO.frases, ...NEUTRO.tramo, ...Object.values(NEUTRO.poder), ...NEUTRO.otraVez]);
  const todas = [
    ...FRASES.el, ...FRASES.ella, ...FRASES_TRAMO.el, ...FRASES_TRAMO.ella, ...OTRA_VEZ.el, ...OTRA_VEZ.ella,
    ...Object.values(FRASE_PODER).flatMap((f) => [f.el, f.ella]),
  ];
  return [...new Set(todas.filter((t) => !neutras.has(t))), 'J ♥ L', 'TE AMO', 'TQM', 'La galaxia del amor', 'Récord de Laura', 'Récord de Javier', 'Le ganaste'];
}

/** Empieza a cargar los modelos del vuelo (mientras el personaje va al baño). */
export function precargarCohete() {
  void cargar('cohete_retretes.glb').catch(() => null);
  void cargar('cohete_cosas.glb').catch(() => null);
}
