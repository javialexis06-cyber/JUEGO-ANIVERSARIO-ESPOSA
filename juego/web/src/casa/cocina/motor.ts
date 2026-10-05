// El motor de la cocina de chef, al estilo de los juegos de Papa's: llegan invitados, se les toma el pedido (un
// tiquete que sale de la impresora y queda colgado arriba), se cocina en las estaciones de cada restaurante y se
// entrega; el invitado lo prueba y califica cada parte (espera y cada estación) y deja propina. Al final del día hay
// puntos de chef (rango: ingredientes e invitados nuevos), propinas para mejorar la cocina y el premio para la casa.
//
// Juntos, de 2 a 4 en una sala (linea.ts), el anfitrión lleva el día (invitados, tiquetes, reloj, calificación) y
// todos cocinan: cada plato y cada máquina es un objeto compartido que cualquiera cambia. Lo que se ve de cada uno
// (en qué estación está, qué tiquete tiene, dónde tiene el dedo) viaja como presencia. Con amigos (o si cocina un
// amigo) todo va en modo neutro: la pareja no llega a comer y no hay frases de amor, apodos ni premios de la casa.
import * as fondo from '../../segundo_plano';
import { nota, rumor } from '../../sonido';
import { COLOR_PUESTO } from '../../salas/sala';
import type { JugadorSala } from '../../salas/tipos';
import { NOMBRE_ROL, type Rol } from '../modelo';
import { imagenChefAmigo, chefAmigoListo, prepararChefAmigo, type PoseChef } from './chef_amigo';
import { boton, dentro, G, Rect, rr, texto } from './dibujo';
import { Efectos } from './efectos';
import {
  Animo, FRASES, frasePareja, Invitado, invitadoPareja, invitadoPorId, INVITADOS, invitadosDelDia, POSES, Pose,
} from './invitados';
import { Presencia, Sincro } from './linea';
import * as P from './pantallas';
import { cargarRecortes, soltarFondos } from './sprites';
import {
  Desbloqueo, InfoFinDia, JugadorCocina, Mejora, nombreRango, OpcionesCocina, ProgresoCocina, rangoDe, RecetaId, ResultadoDia, SalidaCocina,
  umbralRango,
} from './tipos';

// ---------------------------------------------------------------------------------------------- Lo que pone cada restaurante
export interface Estacion {
  id: string;
  nombre: string;
  /** Recorte para la pestaña (o un emoji si no hay). */
  icono: string;
  emoji: string;
  /** Muestra el tiquete escogido a la derecha (las estaciones donde se arma el plato). */
  usaTicket?: boolean;
  /** Fondo fijo (se pinta una vez y se guarda). */
  fondo(g: G, W: number, H: number): void;
  dibujar(g: G, t: number): void;
  /** Corre siempre (lo que se está cocinando sigue aunque se mire otra estación). */
  paso(dt: number): void;
  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number): void;
  /** Algo pide atención (la pestaña titila). */
  alerta?(): boolean;
  /** Lo que tiene en la mano (para mostrárselo al otro). */
  enMano?(): string | null;
}

export interface Categoria {
  id: string;
  nombre: string;
  valor: number;
}

export interface Tema {
  pared: string;
  acento: string;
  piso: string;
  /** Color oscuro del restaurante (letreros, barra). */
  oscuro: string;
}

export interface Receta<P = any, O = any> {
  id: RecetaId;
  nombre: string;
  /** Lo que dice el letrero (con el nombre de quién es la cocina). */
  titulo(nombre: string): string;
  /** El plato que se lleva a la despensa. */
  plato: string;
  nombrePlato: string;
  /** Recorte que lo representa (tarjetas, pestañas). */
  icono: string;
  tema: Tema;
  mejoras: Mejora[];
  desbloqueos: Desbloqueo[];
  /** Las máquinas compartidas del día (waffleras, rejilla…), según las mejoras. */
  maquinas(mejora: (id: string) => number): Record<string, unknown>;
  crearEstaciones(m: Motor): Estacion[];
  pedido(rango: number, dia: number, azar: () => number, inv?: Invitado): P;
  obraNueva(p: P): O;
  /** Segundos que tomaría hacerlo bien (para saber si hizo esperar al invitado). */
  tiempoIdeal(p: P): number;
  /** Dibuja el pedido dentro del tiquete. */
  dibujarTicket(g: G, p: P, r: Rect, m: Motor): void;
  calificar(t: Ticket<P, O>, m: Motor): Categoria[];
  dibujarPlato(g: G, t: Ticket<P, O>, x: number, y: number, escala: number, m: Motor): void;
  /** Después de recibir cambios del otro: arreglos (un wafle que quedó en dos partes…). */
  reconciliar?(m: Motor): void;
}

export interface Ticket<P = any, O = any> {
  id: number;
  numero: number;
  /** Índice del invitado en el día. */
  inv: number;
  pedido: P;
  obra: O;
  tomado: number;
}

export type EstadoInv = 'fuera' | 'fila' | 'pidiendo' | 'esperando' | 'comiendo' | 'saliendo' | 'ido';
export interface InvDia {
  id: string;
  llega: number;
  estado: EstadoInv;
  llegoEn: number;
  tomadoEn: number;
  /** Tiquete colgado (0 si todavía no). */
  ticket: number;
  /** Lo que pidió (mientras se imprime el tiquete). */
  pedido: unknown | null;
  animo: Animo;
  frase: { texto: string; hasta: number } | null;
  /** Quién le tomó el pedido (id del jugador). */
  tomo: string | null;
}

export interface JuicioDia {
  n: number;
  ticket: Ticket;
  cats: Categoria[];
  total: number;
  propina: number;
  frase: string;
  animo: Animo;
  /** Quién lo entregó (id del jugador). */
  por: string;
}

export type Fase = 'espera' | 'jugando' | 'juicio' | 'pausa' | 'fin';
/** El día (lo que el anfitrión lleva y le manda al otro). */
export interface EstadoDia {
  /** Número de día de esta sesión (cambia con cada día nuevo). */
  n: number;
  dia: number;
  rango: number;
  mejoras: Record<string, number>;
  fase: Fase;
  t: number;
  invitados: InvDia[];
  tickets: Ticket[];
  numero: number;
  juicio: JuicioDia | null;
  puntajes: number[];
  propinas: number;
  perfectos: number;
  xp: number;
  resultado: ResultadoDia | null;
  rangoAntes: number;
  /** Quién la puso (id del jugador) o «red» si se cortó la conexión con alguien. */
  pausa: { por: string; motivo: string; antes: Fase } | null;
}

/** Alto del riel de tiquetes y de la barra de estaciones (unidades del juego, 720 de alto). */
export const RIEL = 98;
export const BARRA = 82;
const ALTO = 720;
const ANCHO_MIN = 1280;
const azarCon = (semilla: number) => () => {
  semilla |= 0;
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const elegir = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const genero = (rol: Rol, t: string) => t.replace(/(\p{L}+)\|(\p{L}+)/gu, (_, a, b) => (rol === 'el' ? a : b));
/** Dificultad según cuántos cocinan: cada cuánto llegan, cuánta paciencia traen y cuántos invitados más vienen. */
const POR_COCINEROS = { intervalo: [1, 0.8, 0.7, 0.62], paciencia: [1, 0.85, 0.8, 0.75], extra: [0, 0, 2, 4] };

// ---------------------------------------------------------------------------------------------- Sonidos
export const sonidos = {
  campana: () => {
    nota(1568, 0.18, 0, 'sine', 0.06);
    nota(2093, 0.35, 0.12, 'sine', 0.05);
  },
  pop: () => nota(700 + Math.random() * 300, 0.07, 0, 'sine', 0.05, 1300),
  vertir: (dur = 0.35) => rumor(dur, 900, 0.05, 0, 0.9, 500),
  chisporroteo: () => rumor(0.45, 4200, 0.018, 0, 0.4),
  volteo: () => nota(300, 0.16, 0, 'triangle', 0.05, 900),
  corte: () => {
    rumor(0.06, 3200, 0.09, 0, 1.5);
    nota(1800, 0.04, 0.01, 'square', 0.015, 900);
  },
  motor: (frec = 380) => rumor(0.42, frec, 0.035, 0, 2.2),
  alarma: () => [0, 0.14].forEach((d) => nota(1760, 0.1, d, 'square', 0.03)),
  quemado: () => nota(170, 0.35, 0, 'square', 0.035, 120),
  caja: () => [1046, 1318, 1568, 2093].forEach((f, i) => nota(f, 0.12, i * 0.06, 'triangle', 0.05)),
  bien: () => [784, 988, 1175].forEach((f, i) => nota(f, 0.14, i * 0.07, 'sine', 0.05)),
  mal: () => [392, 330].forEach((f, i) => nota(f, 0.18, i * 0.12, 'triangle', 0.05)),
  clic: () => nota(1200, 0.03, 0, 'sine', 0.03),
  papel: () => rumor(0.12, 5000, 0.05, 0, 0.6),
  impresora: () => [0, 0.09, 0.18, 0.27, 0.36, 0.45].forEach((d) => rumor(0.06, 2600, 0.03, d, 2)),
  tic: (i = 0) => nota(880 + i * 120, 0.05, 0, 'triangle', 0.04),
  sello: () => {
    nota(120, 0.12, 0, 'square', 0.05, 60);
    rumor(0.1, 800, 0.06, 0, 1);
  },
  acierto: () => [1318, 1760].forEach((f, i) => nota(f, 0.1, i * 0.05, 'sine', 0.045)),
  hielo: () => [0, 0.05].forEach((d) => nota(2400 + Math.random() * 800, 0.04, d, 'triangle', 0.025)),
  mordisco: () => {
    nota(300, 0.05, 0, 'square', 0.03, 180);
    nota(260, 0.05, 0.12, 'square', 0.03, 160);
  },
};

// ---------------------------------------------------------------------------------------------- El motor
export class Motor {
  W = ANCHO_MIN;
  H = ALTO;
  /** Pixeles del lienzo por unidad virtual. */
  k = 1;
  private raiz: HTMLElement;
  lienzo: HTMLCanvasElement;
  g: G;
  private bucle: { detener(): void } | null = null;
  private quitarFondo: (() => void)[] = [];
  private terminado = false;
  /** Reloj que siempre corre (animaciones). */
  reloj = 0;
  /** Lo local de la pantalla: el «modo chef» y los letreros encima. */
  vista: 'intro' | 'juego' = 'intro';
  introT = 0;
  estaciones: Estacion[] = [];
  /** Estación que se mira (0 = pedidos). */
  actual = 0;
  private fondos = new Map<number, HTMLCanvasElement>();
  /** El día (compartido en pareja). */
  s: EstadoDia;
  /** Las máquinas compartidas (waffleras, rejilla, batidoras, licuadoras). */
  maq: Record<string, any> = {};
  /** El tiquete que tengo escogido (cada uno el suyo). */
  activoId = 0;
  fx = new Efectos();
  flotantes: { en: number; texto: string; x: number; y: number; vida: number; color: string; tam: number }[] = [];
  private imgs = new Map<string, HTMLImageElement>();
  /** Cara del chef en la esquina (cambia con lo que pasa). */
  caraChef: { pose: PoseChef; hasta: number } = { pose: 'concentrado', hasta: 0 };
  pista: { texto: string; hasta: number } | null = null;
  private pistasVistas = new Set<string>();
  dedo: { x: number; y: number } | null = null;
  /** Mi progreso en este restaurante (juntos, los demás guardan aquí sus puntos y propinas). */
  progreso: ProgresoCocina;
  private azar: () => number;
  /** La pareja que llega a comer (solo Javier y Laura, sin amigos). */
  pareja: Invitado | null;
  /** Quién cocina en este celular y todos los que cocinan (solo: nada más yo). */
  yo: JugadorCocina;
  jugadores: JugadorCocina[];
  /** Modo neutro: cocina un amigo o hay amigos (nada personal ni romántico de la pareja). */
  readonly neutro: boolean;
  /** Cocinar juntos (en una sala). */
  sync: Sincro | null = null;
  /** Si soy el que lleva el día (solo o anfitrión). */
  anfitrion = true;
  /** Juntos: esperando la primera foto del día del anfitrión. */
  esperandoOtro = false;
  /** Cuánto se lleva esperando que estén los recortes del chef de un amigo (el «modo chef» espera un ratico). */
  private esperaChef = 0;
  private quitarSala: (() => void)[] = [];
  /** Cuándo se vio por primera vez cada juicio (para animarlo en este celular). */
  juicioVisto = { n: 0, t0: 0 };
  /** Animación de cambiar de estación. */
  private transicion: { lienzo: HTMLCanvasElement; t: number; dir: number } | null = null;
  /** Tiquete que se está imprimiendo (animación) y tiquetes que acaban de colgarse (vuelan al riel). */
  impreso: { inv: number; t0: number } | null = null;
  colgados = new Map<number, number>();
  /** Lo que ya se guardó (para no guardar dos veces un día). */
  private guardadoN = -1;
  private nJuicio = 0;
  /** Calidad automática según cómo va el celular. */
  private medidas = { suma: 0, n: 0 };
  calidad = 1;
  private entregando = 0;

  constructor(public receta: Receta, private o: OpcionesCocina, private alSalir: (s: SalidaCocina) => void) {
    this.progreso = structuredClone(o.progreso);
    this.yo = o.yo ?? { id: o.rol, nombre: NOMBRE_ROL[o.rol], tipo: o.rol, rol: o.rol, puesto: 0 };
    this.jugadores = o.linea ? o.linea.config.jugadores : [this.yo];
    this.neutro = !!o.neutro || this.yo.tipo === 'amigo' || this.jugadores.some((j) => j.tipo === 'amigo');
    this.azar = azarCon(this.progreso.dia * 7919 + this.yo.puesto + 1);
    this.pareja = !this.neutro && o.pareja ? invitadoPareja(o.pareja.rol, o.pareja.nombre, receta.id) : null;
    // Los recortes del chef de cada amigo se van haciendo desde ya
    for (const j of this.jugadores) if (j.tipo === 'amigo' && j.aspecto) void prepararChefAmigo(j.aspecto);
    this.raiz = document.createElement('section');
    this.raiz.className = `cocina cocina-${receta.id}`;
    this.raiz.innerHTML = `<canvas class="cocina-lienzo"></canvas>
      <button class="cocina-pausa" aria-label="Pausa">❚❚</button>
      <div class="cocina-capa" hidden></div>`;
    document.body.append(this.raiz);
    this.lienzo = this.raiz.querySelector('canvas')!;
    this.g = this.lienzo.getContext('2d')!;
    this.raiz.querySelector('.cocina-pausa')!.addEventListener('click', () => this.pausar('mano'));
    const pos = (e: PointerEvent) => ({ x: (e.clientX * this.dpr) / this.k, y: (e.clientY * this.dpr) / this.k });
    this.lienzo.addEventListener('pointerdown', (e) => {
      this.lienzo.setPointerCapture(e.pointerId);
      const p = pos(e);
      this.dedo = p;
      this.tocar('bajar', p.x, p.y);
    });
    this.lienzo.addEventListener('pointermove', (e) => {
      if (!this.dedo) return;
      const p = pos(e);
      this.dedo = p;
      this.tocar('mover', p.x, p.y);
    });
    const soltar = (e: PointerEvent) => {
      if (!this.dedo) return;
      this.dedo = null;
      const p = pos(e);
      this.tocar('subir', p.x, p.y);
    };
    this.lienzo.addEventListener('pointerup', soltar);
    this.lienzo.addEventListener('pointercancel', soltar);
    this.raiz.querySelector('.cocina-capa')!.addEventListener('click', (ev) => this.clicCapa(ev));
    // El día: juntos, el restaurante es el del anfitrión (su día, su rango y sus mejoras) y los demás esperan su foto
    const c = o.linea?.config;
    this.s = c ? this.diaVacio(c.dia, c.rango, { ...c.mejoras }) : this.diaVacio(this.progreso.dia, rangoDe(this.progreso.xp), { ...this.progreso.mejoras });
    if (o.linea) this.prepararLinea(o.linea);
    if (this.anfitrion) this.nuevoDia();
    else {
      this.s.n = -1;
      this.reiniciarCocina();
    }
    void cargarRecortes();
    this.cargarImagenes();
  }

  get dpr() {
    return Math.min(this.calidad < 1 ? 1.5 : 2, window.devicePixelRatio || 1);
  }
  get rol() {
    return this.o.rol;
  }
  get dia() {
    return this.s.dia;
  }
  get rango() {
    return this.s.rango;
  }
  get t() {
    return this.s.t;
  }
  get tickets() {
    return this.s.tickets;
  }
  get invitados() {
    return this.s.invitados;
  }
  /** Cocinando con alguien más (en una sala). */
  get enPareja() {
    return !!this.sync;
  }
  /** Hay alguien más cocinando ahora mismo. */
  get juntos() {
    return !!this.sync && this.sync.companeros.length > 0;
  }
  /** Cuántos cocinan (para la dificultad). */
  get cocineros() {
    return Math.max(1, Math.min(4, this.sync ? this.sync.sala.jugadores.length : 1));
  }
  /** Mi puesto (0 = anfitrión o solo): los ids de lo que hago no chocan con los de los demás. */
  get puesto() {
    return this.yo.puesto;
  }
  /** El que lleva el día (el dueño del restaurante). */
  get duenoCocina(): JugadorCocina {
    return this.jugadores.find((j) => j.puesto === 0) ?? this.yo;
  }
  /** El nombre de un jugador por su id (o «alguien»). */
  nombreJugador(id: string) {
    return this.jugadores.find((j) => j.id === id)?.nombre ?? 'Alguien';
  }
  /** El color de cada uno (el de su puesto en la sala). */
  colorDe(j: JugadorCocina) {
    return COLOR_PUESTO[j.puesto] ?? '#ff8fb8';
  }
  /** La carita del chef de un jugador en esa pose (Javier y Laura: sus recortes; un amigo: el suyo, hecho aquí). */
  imgChef(j: JugadorCocina, pose: PoseChef) {
    if (j.tipo === 'amigo' && j.aspecto) return imagenChefAmigo(j.aspecto, pose);
    return this.img(`./cocina/gente/${j.rol}_chef_${pose}.webp`);
  }
  /** Los demás que están cocinando ahora (con conexión), con dónde están y su color. */
  otros(): { j: JugadorCocina; p: Presencia; color: string }[] {
    if (!this.sync) return [];
    const out: { j: JugadorCocina; p: Presencia; color: string }[] = [];
    for (const [id, p] of this.sync.otros) {
      const j = this.jugadores.find((x) => x.id === id);
      if (j && this.sync.sala.conectado(id)) out.push({ j, p, color: this.colorDe(j) });
    }
    return out;
  }
  /** El tiquete que tengo escogido. */
  get activo(): Ticket | null {
    return this.s.tickets.find((t) => t.id === this.activoId) ?? null;
  }
  set activo(t: Ticket | null) {
    this.activoId = t?.id ?? 0;
  }
  /** Nivel de una mejora (las del restaurante de este día). */
  mejora(id: string) {
    return this.s.mejoras[id] ?? 0;
  }
  img(ruta: string) {
    let i = this.imgs.get(ruta);
    if (!i) {
      i = new Image();
      i.decoding = 'async';
      i.src = ruta;
      this.imgs.set(ruta, i);
    }
    return i;
  }
  private cargarImagenes() {
    for (const j of this.jugadores) for (const p of ['concentrado', 'feliz', 'celebra', 'susto', 'presume'] as PoseChef[]) this.imgChef(j, p);
    this.imgChef(this.yo, 'intro');
  }
  def(e: InvDia): Invitado {
    return invitadoPorId(e.id, this.pareja);
  }
  sprite(inv: Invitado, pose: Pose) {
    return this.img(`${inv.ruta}_${pose}.webp`);
  }

  // ------------------------------------------------------------------------------------------- Arranque
  empezar() {
    this.ajustar();
    window.addEventListener('resize', this.ajustar);
    // Segundo plano (otra app, pantalla bloqueada): pausa con aviso (en pareja, al otro le sale la pausa) y el bucle se
    // detiene solo; al volver sigue sin salto de tiempo (ver segundo_plano.ts)
    this.quitarFondo.push(
      fondo.alPausar(() => this.pausar('fondo')),
      fondo.alReanudar(() => {
        this.sync?.despertar();
        if (this.vista === 'juego') this.pintarCapa();
      }),
    );
    requestAnimationFrame(() => this.raiz.classList.add('visible'));
    // A 30 cuadros como tope (el celular no se calienta): se juntan los ratos hasta completar un cuadro
    let junto = 0;
    this.bucle = fondo.cuadros((dt) => {
      if (this.terminado) return;
      junto += dt;
      if (junto < 1 / 30 - 0.004) return;
      const paso = Math.min(0.05, junto);
      this.medir(junto);
      junto = 0;
      this.reloj += paso;
      this.paso(paso);
      this.dibujar();
    });
    this.intro();
  }

  /** Si el celular va lento, baja la calidad sola (menos partículas y menos resolución). */
  private medir(dt: number) {
    if (this.calidad < 1 || this.vista !== 'juego') return;
    this.medidas.suma += dt;
    this.medidas.n++;
    if (this.medidas.n >= 90) {
      const prom = this.medidas.suma / this.medidas.n;
      this.medidas = { suma: 0, n: 0 };
      if (prom > 0.05) {
        this.calidad = 0.6;
        this.fx.calidad = 0.5;
        this.ajustar();
      }
    }
  }

  private ajustar = () => {
    const d = this.dpr;
    const w = window.innerWidth, h = window.innerHeight;
    this.lienzo.width = Math.round(w * d);
    this.lienzo.height = Math.round(h * d);
    const esc = Math.min(w / ANCHO_MIN, h / ALTO);
    this.W = w / esc;
    this.H = h / esc;
    this.k = esc * d;
    this.fondos.clear();
  };

  private diaVacio(dia: number, rango: number, mejoras: Record<string, number>): EstadoDia {
    return {
      n: 0, dia, rango, mejoras, fase: 'espera', t: 0, invitados: [], tickets: [], numero: 0, juicio: null, puntajes: [], propinas: 0, perfectos: 0, xp: 0,
      resultado: null, rangoAntes: rango, pausa: null,
    };
  }

  /** (Anfitrión) el día nuevo: quiénes vienen y a qué hora; máquinas limpias. */
  private nuevoDia() {
    const p = this.progreso;
    const rango = rangoDe(p.xp);
    const n = this.s.n + 1;
    this.s = this.diaVacio(p.dia, rango, { ...p.mejoras });
    this.s.n = n;
    this.azar = azarCon(p.dia * 7919 + this.yo.puesto + 1 + n * 31);
    const k = this.cocineros - 1;
    const lista = invitadosDelDia(this.s.dia, rango, this.pareja, this.azar, POR_COCINEROS.extra[k]);
    const intervalo = Math.max(14, 38 - this.s.dia * 1.6) * POR_COCINEROS.intervalo[k];
    let t = 1.5;
    this.s.invitados = lista.map((inv, i) => {
      if (i > 0) t += intervalo * (0.75 + this.azar() * 0.5);
      return { id: inv.id, llega: t, estado: 'fuera', llegoEn: 0, tomadoEn: 0, ticket: 0, pedido: null, animo: 'feliz', frase: null, tomo: null };
    });
    this.reiniciarCocina();
    this.cambioDia();
    for (const e of this.s.invitados) for (const pose of POSES) this.sprite(this.def(e), pose);
  }

  /** Máquinas y estaciones del día (según las mejoras). */
  private reiniciarCocina() {
    this.maq = this.receta.maquinas((id) => this.mejora(id)) as Record<string, any>;
    for (const k of Object.keys(this.maq)) this.sync?.nace(`m:${k}`);
    this.estaciones = this.receta.crearEstaciones(this);
    this.activoId = 0;
    this.fondos.clear();
    this.colgados.clear();
    this.impreso = null;
    this.fx.limpiar();
    this.xs.length = 0;
    this.metas.length = 0;
  }

  // ------------------------------------------------------------------------------------------- Juntos (en una sala)
  private prepararLinea(l: NonNullable<OpcionesCocina['linea']>) {
    this.anfitrion = l.sala.soyAnfitrion;
    this.esperandoOtro = !this.anfitrion;
    this.sync = new Sincro(l.sala, this.anfitrion, {
      leer: (k) => this.leerObjeto(k),
      escribir: (k, d) => this.escribirObjeto(k, d),
      claves: () => ['dia', ...Object.keys(this.maq).map((k) => `m:${k}`), ...this.s.tickets.map((t) => `o:${t.id}`)],
      accion: (a, d, de) => this.accionDe(a, d, de),
      salio: (j) => this.seFue(j),
      conexion: (cortados) => this.conexion(cortados),
      aLaSala: () => this.salir('sala', false),
    });
    // Si el anfitrión se va (o se cae la sala), la cocina se cierra para los demás con aviso
    this.quitarSala.push(l.sala.alFin((_motivo, texto) => this.salaAcabada(texto)));
  }

  private leerObjeto(k: string): unknown {
    if (k === 'dia') return { ...this.s, tickets: this.s.tickets.map(({ obra: _o, ...t }) => t) };
    if (k.startsWith('m:')) return this.maq[k.slice(2)];
    if (k.startsWith('o:')) return this.s.tickets.find((t) => t.id === Number(k.slice(2)))?.obra;
    return undefined;
  }

  /** Obras que llegaron antes que su tiquete. */
  private huerfanas = new Map<number, unknown>();

  private escribirObjeto(k: string, d: unknown) {
    if (k === 'dia') return this.recibirDia(d as EstadoDia);
    if (k.startsWith('m:')) {
      this.maq[k.slice(2)] = d;
      this.receta.reconciliar?.(this);
      return;
    }
    if (k.startsWith('o:')) {
      const id = Number(k.slice(2));
      const t = this.s.tickets.find((x) => x.id === id);
      if (t) t.obra = d;
      else this.huerfanas.set(id, d);
      this.receta.reconciliar?.(this);
    }
  }

  /** (Los demás) llegó el día del anfitrión: se conserva lo que se está cocinando aquí. */
  private recibirDia(d: EstadoDia) {
    const antes = this.s;
    const obras = new Map(antes.tickets.map((t) => [t.id, t.obra]));
    const nuevoDia = d.n !== antes.n;
    d.tickets = d.tickets.map((t) => {
      const obra = obras.get(t.id) ?? this.huerfanas.get(t.id) ?? this.receta.obraNueva(t.pedido);
      this.huerfanas.delete(t.id);
      return { ...t, obra };
    });
    // (si el anfitrión está sin conexión, aquí la cocina se queda quieta hasta que vuelva)
    if (this.anfitrionCortado && (d.fase === 'jugando' || d.fase === 'juicio')) {
      d.pausa = { por: 'red', motivo: 'conexion', antes: d.fase };
      d.fase = 'pausa';
    }
    this.s = d;
    if (nuevoDia) {
      this.reiniciarCocina();
      if (this.esperandoOtro) {
        this.esperandoOtro = false;
        this.aviso(`¡Estás en la cocina de ${this.duenoCocina.nombre}! ${this.neutro ? '👨‍🍳' : '💞'}`, 3);
      }
      for (const e of d.invitados) for (const pose of POSES) this.sprite(this.def(e), pose);
    }
    // Tiquetes nuevos: vuelan al riel
    for (const t of d.tickets) if (!antes.tickets.some((x) => x.id === t.id)) this.colgados.set(t.id, this.reloj);
    if (!d.tickets.some((t) => t.id === this.activoId)) this.activoId = d.tickets[0]?.id ?? 0;
    this.alCambiarFase(antes, nuevoDia);
  }

  /** Lo que cambia la pantalla cuando cambia la fase (en todos los celulares). */
  private alCambiarFase(antes: EstadoDia, nuevoDia: boolean) {
    const s = this.s;
    if (s.juicio && s.juicio.n !== this.juicioVisto.n) this.empezarJuicio(s.juicio);
    if (s.fase === 'fin' && s.resultado && this.guardadoN !== s.n) void this.alFinDelDia();
    if (this.vista === 'juego' && (antes.fase !== s.fase || nuevoDia || (s.fase === 'pausa' && antes.pausa?.por !== s.pausa?.por))) this.pintarCapa();
    // Alguien tomó un pedido: se imprime el tiquete
    const pid = s.invitados.findIndex((e) => e.estado === 'pidiendo');
    if (pid >= 0 && this.impreso?.inv !== pid) {
      this.impreso = { inv: pid, t0: this.reloj };
      sonidos.impresora();
    }
  }

  /** Alguien se fue de la sala (y de la cocina). */
  private seFue(j: JugadorSala) {
    if (!this.sync || this.cerrado) return;
    if (j.id === this.sync.idAnfitrion) return; // (eso lo avisa la sala: «… cerró la sala»)
    sonidos.mal();
    const solo = this.sync.companeros.length === 0;
    this.aviso(`${j.nombre} se fue de la cocina${solo ? ': sigues cocinando tú' : ''}`, 4);
    if (this.anfitrion && this.s.fase === 'pausa' && this.s.pausa?.por === 'red' && this.sync.conectado) this.seguir();
    else if (this.anfitrion && this.s.fase === 'pausa' && this.s.pausa?.por === j.id) this.seguir();
    else if (this.vista === 'juego') this.pintarCapa();
  }
  private cerrado = false;

  /** (Los demás) el anfitrión se fue: la cocina se acaba aquí con aviso. */
  private salaAcabada(texto: string) {
    if (this.terminado || this.cerrado) return;
    this.cerrado = true;
    this.sync?.cerrar();
    sonidos.mal();
    this.capa(`<div class="cocina-tarjeta"><h2>${esc(texto)}</h2><p>El día se quedó en su restaurante. ¡Otra vez será, chef!</p>
      <div class="botones"><button class="boton-cocina principal" data-c="salir">${esc(this.o.textoSalir ?? '🏠 Volver a la casa')}</button></div></div>`, 'pausa');
  }

  /** ¿El anfitrión está sin conexión? (los demás se quedan quietos esperándolo) */
  private anfitrionCortado = false;

  private conexion(cortados: JugadorSala[]) {
    if (!this.sync) return;
    if (this.anfitrion) {
      const s = this.s;
      if (cortados.length && (s.fase === 'jugando' || s.fase === 'juicio')) {
        s.pausa = { por: 'red', motivo: 'conexion', antes: s.fase };
        s.fase = 'pausa';
        this.cambioDia();
      } else if (!cortados.length && s.fase === 'pausa' && s.pausa?.por === 'red') {
        s.fase = s.pausa.antes;
        s.pausa = null;
        this.cambioDia();
        this.aviso('¡Volvieron todos! Sigan cocinando 💪', 3);
      }
    } else {
      const cortado = cortados.some((j) => j.id === this.sync!.idAnfitrion);
      if (cortado && !this.anfitrionCortado && (this.s.fase === 'jugando' || this.s.fase === 'juicio')) {
        this.s.pausa = { por: 'red', motivo: 'conexion', antes: this.s.fase };
        this.s.fase = 'pausa';
      } else if (!cortado && this.anfitrionCortado) this.aviso('¡Volvió la conexión!', 2.5);
      this.anfitrionCortado = cortado;
    }
    if (this.vista === 'juego') this.pintarCapa();
  }

  /** (Anfitrión) lo que piden los demás. */
  private accionDe(a: string, d: any, de: string) {
    if (!this.jugadores.some((j) => j.id === de)) return;
    if (a === 'tomar') this.tomarPedido(de);
    else if (a === 'entregar') {
      const t = this.s.tickets.find((x) => x.id === d?.id);
      if (t && this.s.fase === 'jugando') {
        if (d.obra) t.obra = d.obra;
        this.entregarAqui(t, de);
      }
    } else if (a === 'cerrar') {
      if (this.s.juicio?.n === d?.n) this.cerrarJuicio();
    } else if (a === 'pausa') {
      const motivo = d?.motivo === 'fondo' ? 'fondo' : 'mano';
      // (si ya estaba quieta porque la sala lo vio irse al fondo, la pausa queda a su nombre: «salió un momentico»)
      if (this.s.fase === 'pausa' && this.s.pausa?.por === 'red') {
        this.s.pausa = { ...this.s.pausa, por: de, motivo };
        this.cambioDia();
        if (this.vista === 'juego') this.pintarCapa();
      } else this.pausarAqui(de, motivo);
    }
    else if (a === 'seguir') this.seguir();
    else if (a === 'jugar') this.jugar();
  }

  /** El día cambió (el anfitrión se lo manda al otro). */
  cambioDia() {
    this.sync?.cambio('dia');
  }
  /** Cambié el plato del tiquete (o el de `t`). */
  cambioObra(t: Ticket | null = this.activo) {
    if (t) this.sync?.cambio(`o:${t.id}`);
  }
  cambioMaq(nombre: string) {
    this.sync?.cambio(`m:${nombre}`);
  }
  // ------------------------------------------------------------------------------------------- Capas (intro, día, pausa, fin, tienda)
  private capa(html: string, clase = '') {
    const c = this.raiz.querySelector('.cocina-capa') as HTMLElement;
    c.className = `cocina-capa ${clase}`;
    c.innerHTML = html;
    c.hidden = !html;
    return c;
  }

  /** «Modo chef»: se concentra muchísimo (líneas de velocidad, brillo en los ojos) y aparece la cocina profesional. */
  private intro() {
    this.vista = 'intro';
    this.introT = 0;
    this.capa('');
    [0, 0.5, 1, 1.5].forEach((d) => nota(220 + d * 110, 0.5, d, 'sine', 0.03, 440 + d * 220));
    rumor(2.4, 300, 0.05, 0.4, 0.5, 2600);
  }
  /** El «modo chef» va con el reloj del juego (en un celular lento o en segundo plano no se adelanta ni se corta). */
  private pasoIntro(dt: number) {
    // Un amigo: se espera un ratico a que esté su chef renderizado (si no, sale su carita con gorro)
    if (this.introT === 0 && this.yo.aspecto && this.yo.tipo === 'amigo' && !chefAmigoListo(this.yo.aspecto) && this.esperaChef < 6) {
      this.esperaChef += dt;
      return;
    }
    const antes = this.introT;
    this.introT += dt;
    if (antes < 2.25 && this.introT >= 2.25) [523, 659, 784, 1046].forEach((f, i) => nota(f, 0.3, i * 0.08, 'triangle', 0.06));
    if (this.introT > 4.6) this.terminarIntro();
  }
  private terminarIntro() {
    if (this.vista !== 'intro') return;
    this.vista = 'juego';
    this.pintarCapa();
  }

  /** La tarjeta que toca según la fase del día. */
  pintarCapa() {
    if (this.vista !== 'juego' || this.cerrado) return;
    const s = this.s;
    if (this.enPareja && this.esperandoOtro) return this.tarjetaEspera();
    if (s.fase === 'espera') return this.tarjetaDia();
    if (s.fase === 'pausa') return this.tarjetaPausa();
    if (s.fase === 'fin' && s.resultado) return this.pintarFin();
    this.capa('');
  }

  /** El botón de salir de las tarjetas (volver a la casa o a la sala de juegos). */
  private get textoSalir() {
    return esc(this.o.textoSalir ?? '🏠 Volver a la casa');
  }
  /** Los nombres en una lista bonita: «Pipe», «Pipe y Laura», «Pipe, Laura y Caro». */
  private lista(nombres: string[]) {
    return nombres.length <= 1 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
  }

  private tarjetaEspera() {
    this.capa(`<div class="cocina-tarjeta pareja"><h2>Entrando a la cocina de ${esc(this.duenoCocina.nombre)}… <span class="latido">${this.neutro ? '👨‍🍳' : '💞'}</span></h2>
        <p>Un momentico, que se está conectando.</p>
        <div class="botones"><button class="boton-cocina" data-c="salir">${this.textoSalir}</button></div></div>`, 'dia');
  }

  private tarjetaDia() {
    const n = this.s.invitados.length;
    const pareja = this.pareja && this.s.invitados.some((e) => this.def(e).especial === 'pareja') ? this.pareja : null;
    const critico = this.s.invitados.some((e) => this.def(e).especial === 'critico');
    const juntos = this.juntos;
    const icono = P.iconoHTML(this.receta.icono, 86);
    const otros = this.sync?.companeros.map((j) => esc(j.nombre)) ?? [];
    const conQuien = this.anfitrion ? `${this.lista(otros)} ${otros.length === 1 ? 'te ayuda' : 'te ayudan'} hoy` : `ayudas en la cocina de ${esc(this.duenoCocina.nombre)}`;
    const iconoJuntos = this.neutro ? '👥' : '👩‍❤️‍👨';
    this.capa(`<div class="cocina-tarjeta">
        <div class="cabeza">${icono}<div><p class="letrero">${esc(this.receta.titulo(this.duenoCocina.nombre))}</p>
        <h2>Día ${this.s.dia}</h2></div></div>
        <p>${n} invitados vienen a comer${pareja ? ` · <b>¡${esc(pareja.nombre)} viene hoy!</b> 💖` : ''}${critico ? ' · <b>¡Viene el crítico famoso!</b> ⭐' : ''}</p>
        ${juntos ? `<p class="juntos">${iconoJuntos} Cocinan juntos: ${conQuien}. Las propinas y los puntos del día son de ${otros.length > 1 ? 'todos' : 'los dos'}.</p>` : ''}
        <p class="rango">${nombreRango(this.s.rango)} · rango ${this.s.rango}</p>
        <div class="botones">${this.anfitrion ? '<button class="boton-cocina" data-c="tienda">🛠️ Mejoras</button>' : ''}<button class="boton-cocina principal" data-c="jugar">¡A cocinar!</button></div>
      </div>`, 'dia');
  }

  private tarjetaPausa() {
    const p = this.s.pausa;
    const red = p?.por === 'red';
    const quien = p && !red && p.por !== this.yo.id ? esc(this.nombreJugador(p.por)) : '';
    const motivo = p?.motivo === 'fondo' && quien ? `${quien} salió un momentico de la app` : quien ? `${quien} puso pausa` : 'La cocina te espera.';
    const cortados = red ? (this.anfitrion ? this.sync?.listaCortados() ?? [] : this.jugadores.filter((j) => j.id === this.sync?.idAnfitrion)) : [];
    const nombres = this.lista(cortados.map((j) => esc(j.nombre))) || 'los demás';
    const titulo = red ? `Se cortó la conexión con ${nombres}…` : 'Pausa';
    const sigo = red && this.anfitrion ? `<button class="boton-cocina" data-c="solo">Seguir sin ${cortados.length === 1 ? nombres : 'esperar'}</button>` : '';
    const quedan = this.sync?.companeros.filter((j) => j.id !== this.sync?.idAnfitrion).length ?? 0;
    const nota = this.anfitrion
      ? this.juntos ? `Si sales ahora, se acaba el día ${this.s.dia} para todos (las mejoras quedan).` : `Si sales ahora, el día ${this.s.dia} se pierde (las mejoras quedan).`
      : `Si te vas, ${esc(this.duenoCocina.nombre)}${quedan ? ' y los demás siguen' : ' sigue'} cocinando.`;
    this.capa(`<div class="cocina-tarjeta"><h2>${titulo}</h2><p>${red ? 'Esperando a que vuelva… (la cocina está quieta)' : motivo}</p>
      <div class="botones"><button class="boton-cocina" data-c="salir">${this.textoSalir}</button>${sigo}${red ? '' : '<button class="boton-cocina principal" data-c="seguir">Seguir cocinando</button>'}</div>
      <p class="nota">${nota}</p></div>`, 'pausa');
  }

  private clicCapa(ev: Event) {
    const b = (ev.target as HTMLElement).closest('[data-c]') as HTMLElement | null;
    if (!b) return;
    sonidos.clic();
    const c = b.dataset.c!;
    if (c === 'jugar') this.anfitrion ? this.jugar() : this.sync?.pedir('jugar');
    else if (c === 'tienda') this.tienda(b.dataset.volver ?? 'dia');
    else if (c.startsWith('comprar:')) void this.comprar(c.slice(8), b.dataset.volver ?? 'dia');
    else if (c === 'volver-dia' || c === 'volver-fin') this.pintarCapa();
    else if (c === 'seguir') this.anfitrion ? this.seguir() : this.sync?.pedir('seguir');
    else if (c === 'salir') this.salir('salir');
    else if (c === 'sala') this.salir('sala');
    else if (c === 'siguiente') this.siguienteDia();
    else if (c === 'solo') this.seguirSinLosCortados();
  }

  /** (Anfitrión) no esperar más a los que se cortaron: se sigue sin ellos (si vuelven, entran de una). */
  private seguirSinLosCortados() {
    for (const j of this.sync?.listaCortados() ?? []) this.sync?.olvidarCorte(j.id);
    if (this.s.fase === 'pausa') this.seguir();
    else this.pintarCapa();
  }

  private jugar() {
    if (this.s.fase !== 'espera') return;
    this.s.fase = 'jugando';
    this.cambioDia();
    this.capa('');
    this.actual = 0;
    if (this.s.dia === 1) this.mostrarPista('Llegan invitados al mostrador: toca «Tomar pedido»', 'inicio');
  }

  pausar(motivo: 'mano' | 'fondo' = 'mano') {
    if (this.vista !== 'juego' || (this.s.fase !== 'jugando' && this.s.fase !== 'juicio')) return;
    if (this.anfitrion) {
      this.pausarAqui(this.yo.id, motivo);
      // Al irse a segundo plano el bucle se detiene: el aviso sale ya, no en el próximo paquete
      this.sync?.enviar(true);
    } else this.sync?.pedir('pausa', { motivo });
    // En este celular se ve la pausa de una (aunque el anfitrión la confirme después)
    if (!this.anfitrion) {
      this.s.pausa = { por: this.yo.id, motivo, antes: this.s.fase };
      this.s.fase = 'pausa';
      this.pintarCapa();
    }
  }
  private pausarAqui(por: string, motivo: string) {
    if (this.s.fase !== 'jugando' && this.s.fase !== 'juicio') return;
    this.s.pausa = { por, motivo, antes: this.s.fase };
    this.s.fase = 'pausa';
    this.cambioDia();
    this.pintarCapa();
  }
  private seguir() {
    if (this.s.fase !== 'pausa') return;
    this.s.fase = this.s.pausa?.antes === 'juicio' && this.s.juicio ? 'juicio' : 'jugando';
    this.s.pausa = null;
    this.cambioDia();
    this.capa('');
  }

  // ------------------------------------------------------------------------------------------- Tienda de mejoras
  private tienda(volver: string) {
    const p = this.progreso;
    const filas = this.receta.mejoras
      .map((m) => {
        const nv = p.mejoras[m.id] ?? 0;
        const max = nv >= m.niveles.length;
        const precio = m.precios[nv];
        return `<li class="${max ? 'lleno' : ''}">
          <span class="ico">${m.icono}</span>
          <div><b>${m.nombre}</b><small>${max ? m.niveles[m.niveles.length - 1] : m.niveles[nv]}</small>
            <span class="puntos">${m.niveles.map((_, i) => `<i class="${i < nv ? 'si' : ''}"></i>`).join('')}</span></div>
          ${max ? '<em>¡Al máximo!</em>' : `<button class="boton-cocina ${p.propinas >= precio ? 'principal' : 'apagado'}" data-c="comprar:${m.id}" data-volver="${volver}">🪙 ${precio}</button>`}
        </li>`;
      })
      .join('');
    this.capa(`<div class="cocina-tienda">
        <header>${P.iconoHTML(this.receta.icono, 44)}<h2>Mejoras de la cocina</h2><span class="saldo">🪙 ${p.propinas} en propinas</span></header>
        <ul>${filas}</ul>
        <div class="botones"><button class="boton-cocina principal" data-c="${volver === 'fin' ? 'volver-fin' : 'volver-dia'}">Listo</button></div>
      </div>`, 'tienda');
  }

  private async comprar(id: string, volver: string) {
    const m = this.receta.mejoras.find((x) => x.id === id);
    if (!m) return;
    const nv = this.progreso.mejoras[id] ?? 0;
    const precio = m.precios[nv];
    if (nv >= m.niveles.length || this.progreso.propinas < precio) {
      sonidos.mal();
      return;
    }
    this.progreso.propinas -= precio;
    this.progreso.mejoras[id] = nv + 1;
    sonidos.caja();
    // Si el día no ha empezado, la mejora se estrena hoy mismo
    if (this.s.fase === 'espera' && this.anfitrion) {
      this.s.mejoras = { ...this.progreso.mejoras };
      this.reiniciarCocina();
      this.cambioDia();
    }
    this.fondos.clear();
    this.tienda(volver);
    await this.o.guardar(structuredClone(this.progreso)).catch(() => {});
  }

  // ------------------------------------------------------------------------------------------- Durante el día
  private paso(dt: number) {
    if (this.vista === 'intro') this.pasoIntro(dt);
    if (this.transicion) {
      this.transicion.t += dt;
      if (this.transicion.t > 0.32) this.transicion = null;
    }
    this.sync?.paso(dt);
    if (this.sync) this.sync.presencia(this.miPresencia());
    const s = this.s;
    if (s.fase === 'jugando' && !this.esperandoOtro) {
      if (this.anfitrion) this.pasoDia(dt);
      else s.t += dt;
      for (const e of this.estaciones) e.paso(dt);
    }
    this.pasoVisual(dt);
    this.fx.vista = this.actual;
    this.fx.paso(dt);
    for (const f of this.flotantes) {
      f.y -= 46 * dt;
      f.vida -= dt;
    }
    if (this.flotantes.length && this.flotantes[0].vida <= 0) this.flotantes = this.flotantes.filter((f) => f.vida > 0);
    // (Anfitrión) el juicio se cierra solo si nadie toca
    if (this.anfitrion && s.fase === 'juicio' && s.juicio && this.reloj - this.juicioVisto.t0 > 9) this.cerrarJuicio();
    if (this.entregando && this.reloj - this.entregando > 4) this.entregando = 0;
  }

  private miPresencia(): Presencia {
    const e = this.estaciones[this.actual - 1];
    return {
      est: this.actual, act: this.activoId, x: this.dedo ? this.dedo.x / this.W : 0.5, y: this.dedo ? this.dedo.y / this.H : 0.5, dedo: !!this.dedo,
      herr: e?.enMano?.() ?? null,
    };
  }

  /** (Anfitrión) el reloj del día: llegan invitados, se impacientan, se cuelgan los tiquetes. */
  private pasoDia(dt: number) {
    const s = this.s;
    s.t += dt;
    let cambio = false;
    for (const e of s.invitados) {
      if (e.estado === 'fuera' && s.t >= e.llega) {
        e.estado = 'fila';
        e.llegoEn = s.t;
        sonidos.campana();
        e.frase = { texto: this.saludo(this.def(e)), hasta: s.t + 3.4 };
        if (this.actual !== 0) this.aviso(`¡Llegó ${this.def(e).nombre}!`);
        cambio = true;
      }
      if (e.estado === 'fila' || e.estado === 'pidiendo' || e.estado === 'esperando') {
        const v = this.puntajeEspera(e, s.t);
        const antes = e.animo;
        e.animo = v >= 70 ? 'feliz' : v >= 40 ? 'espera' : 'bravo';
        if (antes !== e.animo) {
          cambio = true;
          if (e.animo !== 'feliz' && !e.frase) e.frase = { texto: elegir(FRASES.apurado), hasta: s.t + 2.6 };
        }
      }
      if (e.frase && s.t > e.frase.hasta) {
        e.frase = null;
        cambio = true;
      }
    }
    const pid = s.invitados.find((e) => e.estado === 'pidiendo');
    if (pid && s.t - pid.tomadoEn > 2.4) {
      this.colgarTicket(pid);
      cambio = true;
    }
    s.invitados.forEach((e, i) => {
      if (e.estado === 'saliendo' && (this.xs[i] ?? 0) >= this.W + 190) {
        e.estado = 'ido';
        cambio = true;
      }
    });
    if (cambio) this.cambioDia();
    if (s.invitados.length && s.invitados.every((e) => e.estado === 'ido')) this.finDia();
  }

  /**
   * Lo que dice el invitado al llegar. Las frases con «mijo|mija» van con la forma de quien cocina (Javier o Laura);
   * con amigos no se supone nada: se escoge entre las que no tienen forma.
   */
  private saludo(inv: Invitado) {
    const sinForma = inv.saludos.filter((x) => !x.includes('|'));
    return genero(this.rol, elegir(this.neutro && sinForma.length ? sinForma : inv.saludos));
  }

  /** Posición en pantalla de cada invitado (solo se ve: no viaja), por su índice en el día. */
  xs: number[] = [];
  metas: number[] = [];
  private pasoVisual(dt: number) {
    const s = this.s;
    let enFila = 0, enEspera = 0;
    for (let i = 0; i < s.invitados.length; i++) {
      const e = s.invitados[i];
      let meta = this.W + 200;
      if (e.estado === 'fila' || e.estado === 'pidiendo') meta = this.puestoFila(enFila++);
      else if (e.estado === 'esperando') meta = this.puestoEspera(enEspera++);
      else if (e.estado === 'comiendo') meta = this.W * 0.5;
      let x = this.xs[i] ?? this.W + 160;
      if (e.estado === 'fuera') x = this.W + 160;
      const d = meta - x;
      x += Math.sign(d) * Math.min(Math.abs(d), dt * 380);
      this.xs[i] = x;
      this.metas[i] = meta;
    }
  }
  puestoFila(i: number) {
    return this.W * 0.52 + (i ? 70 + i * 165 : 0);
  }
  puestoEspera(i: number) {
    return 196 + (i % 6) * 104;
  }

  /** Qué tan bien va la espera (100 = no ha esperado de más). */
  puntajeEspera(e: InvDia, ahora: number) {
    const pac = this.def(e).paciencia * (1 + 0.15 * this.mejora('musica')) * POR_COCINEROS.paciencia[this.cocineros - 1];
    const fila = e.tomadoEn ? e.tomadoEn - e.llegoEn : ahora - e.llegoEn;
    let exceso = Math.max(0, fila - 10 * pac);
    const t = e.ticket ? this.s.tickets.find((x) => x.id === e.ticket) : null;
    if (t) exceso += Math.max(0, ahora - e.tomadoEn - this.receta.tiempoIdeal(t.pedido) * pac);
    return Math.max(0, Math.round(100 - exceso * 1.3));
  }

  /** Toma el pedido del primero de la fila (el anfitrión decide qué pide). */
  private tomarPedido(quien: string) {
    const s = this.s;
    if (s.fase !== 'jugando' || s.invitados.some((i) => i.estado === 'pidiendo')) return;
    const e = s.invitados.find((i) => i.estado === 'fila');
    if (!e) return;
    e.estado = 'pidiendo';
    e.tomadoEn = s.t;
    e.frase = null;
    e.tomo = quien;
    e.pedido = this.receta.pedido(s.rango, s.dia, this.azar, this.def(e));
    this.impreso = { inv: s.invitados.indexOf(e), t0: this.reloj };
    sonidos.impresora();
    if (quien === this.yo.id) this.chef('feliz', 2.5);
    this.cambioDia();
    this.pistaUnaVez('pedido', 'Mira bien el tiquete: dice todo lo que quiere');
  }

  private colgarTicket(e: InvDia) {
    const s = this.s;
    const p = e.pedido ?? this.receta.pedido(s.rango, s.dia, this.azar, this.def(e));
    e.pedido = null;
    const id = ++s.numero;
    const t: Ticket = { id, numero: id, inv: s.invitados.indexOf(e), pedido: p, obra: this.receta.obraNueva(p), tomado: s.t };
    e.ticket = id;
    e.estado = 'esperando';
    s.tickets.push(t);
    this.sync?.nace(`o:${id}`);
    this.colgados.set(id, this.reloj);
    if (!this.activoId) this.activoId = id;
    sonidos.papel();
    this.pistaUnaVez('estaciones', `Ahora ve a «${this.estaciones[0]?.nombre}» (abajo) y prepara el pedido #${t.numero}`);
  }

  /** Se entrega el plato (en pareja, el invitado se lo pide al anfitrión). */
  entregar(t: Ticket) {
    if (this.s.fase !== 'jugando') return;
    if (this.anfitrion) return this.entregarAqui(t, this.yo.id);
    if (this.entregando) return;
    this.entregando = this.reloj;
    this.cambioObra(t);
    this.sync?.pedir('entregar', { id: t.id, obra: t.obra });
    this.aviso('¡Entregando!… 🛎️', 1.5);
  }

  /** (Anfitrión) el invitado lo prueba y califica. */
  private entregarAqui(t: Ticket, por: string) {
    const s = this.s;
    const e = s.invitados[t.inv];
    if (!e) return;
    const inv = this.def(e);
    const cats = [{ id: 'espera', nombre: 'Espera', valor: this.puntajeEspera(e, s.t) }, ...this.receta.calificar(t, this)];
    let total = Math.round(cats.reduce((a, c) => a + c.valor, 0) / cats.length);
    // El crítico es exigente: lo que no es excelente le parece regular
    if (inv.especial === 'critico') total = Math.round(100 * Math.pow(total / 100, 1.5));
    const base = 3 + this.receta.tiempoIdeal(t.pedido) * 0.06;
    let propina = Math.max(0, Math.round(base * (total / 100) * inv.propina * (1 + 0.12 * this.mejora('jarra'))));
    if (total >= 95) propina += 2;
    s.tickets = s.tickets.filter((x) => x !== t);
    e.estado = 'comiendo';
    const animo: Animo = total >= 90 ? 'encantado' : total >= 70 ? 'feliz' : total >= 50 ? 'espera' : 'bravo';
    const tono = total >= 90 ? 'encantado' : total >= 70 ? 'feliz' : total >= 50 ? 'normal' : 'bravo';
    const frase = inv.especial === 'pareja' && this.o.pareja ? frasePareja(this.o.pareja.rol, this.receta.id, tono) : genero(this.rol, elegir(FRASES[tono]));
    s.juicio = { n: ++this.nJuicio + s.n * 1000, ticket: t, cats, total, propina, frase, animo, por };
    s.fase = 'juicio';
    s.puntajes.push(total);
    s.propinas += propina;
    s.xp += total;
    if (total >= 95) s.perfectos++;
    this.sync?.olvidar(`o:${t.id}`);
    this.cambioDia();
    this.empezarJuicio(s.juicio);
  }

  /** Arranca la animación del juicio en este celular. */
  private empezarJuicio(j: JuicioDia) {
    this.juicioVisto = { n: j.n, t0: this.reloj };
    this.entregando = 0;
    if (this.activoId === j.ticket.id) this.activoId = this.s.tickets[0]?.id ?? 0;
    this.chef(j.total >= 90 ? 'celebra' : j.total >= 60 ? 'feliz' : 'susto', 5);
    P.sonarJuicio(this, j);
  }

  private cerrarJuicio() {
    const s = this.s;
    const j = s.juicio;
    if (!j) return;
    const e = s.invitados[j.ticket.inv];
    if (e) {
      e.estado = 'saliendo';
      e.animo = j.animo;
    }
    s.juicio = null;
    if (s.fase === 'juicio') s.fase = 'jugando';
    this.cambioDia();
  }

  // ------------------------------------------------------------------------------------------- Fin del día
  private finDia() {
    const s = this.s;
    if (s.fase === 'fin') return;
    const servidos = s.puntajes.length;
    const promedio = servidos ? Math.round(s.puntajes.reduce((a, b) => a + b, 0) / servidos) : 0;
    const xp = s.xp + 20;
    const monedas = Math.max(1, Math.min(20, Math.round(servidos * (promedio / 100) * 2.2)));
    const buenos = s.puntajes.filter((v) => v >= 70).length;
    const platos = buenos ? Math.min(4, 1 + Math.floor(buenos / 2)) : 0;
    s.resultado = { receta: this.receta.id, dia: s.dia, servidos, promedio, propinas: s.propinas, perfectos: s.perfectos, xp, monedas, platos };
    s.fase = 'fin';
    this.cambioDia();
    void this.alFinDelDia();
  }

  /** Cada uno guarda lo suyo (el anfitrión el día y el premio de la casa; el invitado sus puntos y propinas). */
  private async alFinDelDia() {
    const s = this.s;
    const r = s.resultado;
    if (!r || this.guardadoN === s.n) return;
    this.guardadoN = s.n;
    const p = this.progreso;
    const rangoAntes = rangoDe(p.xp);
    p.xp += r.xp;
    p.propinas += r.propinas;
    p.servidos += r.servidos;
    p.perfectos += r.perfectos;
    p.mejor = Math.max(p.mejor, r.promedio);
    if (this.anfitrion) p.dia = s.dia + 1;
    this.rangoAntesFin = rangoAntes;
    // El premio de la casa es del dueño de la cocina (y solo si es Javier o Laura en su casa)
    const mio: ResultadoDia = this.anfitrion && this.o.premioCasa ? r : { ...r, monedas: 0, platos: 0 };
    void this.o.guardar(structuredClone(p), mio).catch(() => {});
    [523, 659, 784, 1046, 1318].forEach((f, i) => nota(f, 0.2, i * 0.1, 'triangle', 0.05));
    // Gancho para escenas especiales (se pintan encima; la tarjeta del final sale después)
    const info: InfoFinDia = {
      receta: this.receta.id, rol: this.rol, enPareja: this.juntos, jugadores: this.jugadores, anfitrion: this.anfitrion, rangoAntes, rango: rangoDe(p.xp),
      raiz: this.raiz,
    };
    const ganchos = [this.o.alTerminarDia, ...ganchosFin];
    for (const f of ganchos) {
      if (!f) continue;
      try {
        await f(mio, info);
      } catch {
        /* una escena que falla no tumba la cocina */
      }
    }
    this.pintarCapa();
  }
  private rangoAntesFin = 1;

  private pintarFin() {
    const r = this.s.resultado!;
    const p = this.progreso;
    const rango = rangoDe(p.xp);
    const estrellas = r.promedio >= 90 ? 3 : r.promedio >= 70 ? 2 : r.promedio >= 45 ? 1 : 0;
    const desde = umbralRango(rango), hasta = umbralRango(rango + 1);
    const avance = Math.round(((p.xp - desde) / (hasta - desde)) * 100);
    const subio = [...this.receta.desbloqueos, ...INVITADOS.filter((i) => i.desde > 1).map((i) => ({ rango: i.desde, texto: `Ahora viene a comer: ${i.nombre}` }))]
      .filter((d) => d.rango > this.rangoAntesFin && d.rango <= rango);
    const juntos = this.juntos;
    const dueno = this.duenoCocina;
    const tuya = this.receta.nombre.toLowerCase();
    const premio = this.anfitrion && this.o.premioCasa
      ? `<p class="premio">Para la casa: <b>+${r.monedas} ${r.monedas === 1 ? 'moneda' : 'monedas'}</b>${r.platos ? ` y <b>${r.platos} × ${this.receta.nombrePlato}</b> a la despensa${this.neutro ? '' : ' (se pueden comer o regalar)'}` : ''}</p>`
      : !this.anfitrion
        ? `<p class="premio">${!this.neutro && dueno.tipo !== 'amigo' ? `El premio de la casa lo guardó ${esc(dueno.nombre)}; tus` : 'Tus'} puntos de chef y las propinas (🪙 ${r.propinas}) van a tu propia ${tuya}.</p>`
        : this.yo.tipo === 'amigo'
          ? '<p class="premio">Tus puntos de chef y las propinas quedan guardados en este celular: vuelve cuando quieras a seguir subiendo de rango.</p>'
          : '';
    const botones = this.anfitrion
      ? `${this.enPareja ? '<button class="boton-cocina" data-c="sala">👥 A la sala</button>' : `<button class="boton-cocina" data-c="salir">${this.textoSalir}</button>`}
         <button class="boton-cocina" data-c="tienda" data-volver="fin">🛠️ Mejoras (🪙 ${p.propinas})</button>
         <button class="boton-cocina principal" data-c="siguiente">Día ${p.dia} ➜</button>`
      : `<button class="boton-cocina" data-c="salir">${this.textoSalir}</button><span class="espera-otro">${esc(dueno.nombre)} decide si siguen con otro día…</span>`;
    const etiqueta = juntos ? (this.neutro ? ' <small>en equipo 👥</small>' : ' <small>en pareja 💞</small>') : '';
    this.capa(`<div class="cocina-fin">
        <div class="cabeza">${P.iconoHTML(this.receta.icono, 70)}<h2>¡Terminó el día ${r.dia}!${etiqueta}</h2></div>
        <div class="estrellas">${[0, 1, 2].map((i) => `<i class="${i < estrellas ? 'si' : ''}" style="--d:${0.3 + i * 0.25}s">★</i>`).join('')}</div>
        <ul class="cifras">
          <li><b>${r.servidos}</b><span>invitados atendidos</span></li>
          <li><b>${r.promedio}%</b><span>calificación promedio</span></li>
          <li><b>🪙 ${r.propinas}</b><span>en propinas</span></li>
          <li><b>${r.perfectos}</b><span>${r.perfectos === 1 ? 'plato perfecto' : 'platos perfectos'}</span></li>
        </ul>
        <div class="rango-barra"><span>${nombreRango(rango)} · rango ${rango}${rango > this.rangoAntesFin ? ' <b>¡SUBISTE!</b>' : ''}</span><i style="--v:${avance}%"></i></div>
        ${subio.length ? `<div class="nuevo">${subio.map((d) => `<p>✨ ${d.texto}</p>`).join('')}</div>` : ''}
        ${premio}
        <div class="botones">${botones}</div>
      </div>`, 'fin');
  }

  private siguienteDia() {
    if (!this.anfitrion) return;
    this.nuevoDia();
    this.pintarCapa();
  }

  /**
   * Se cierra la cocina: `salir` (a la casa o a la sala de juegos; quien la abrió decide qué pasa con la sala) o `sala`
   * (de vuelta a la sala de espera; si lo decide el anfitrión, se van todos con él).
   */
  private salir(como: SalidaCocina = 'salir', avisar = true) {
    if (this.terminado) return;
    if (como === 'sala' && avisar && this.anfitrion) this.sync?.volverTodosALaSala();
    this.sync?.cerrar();
    for (const q of this.quitarSala.splice(0)) q();
    this.terminado = true;
    this.bucle?.detener();
    this.bucle = null;
    for (const q of this.quitarFondo.splice(0)) q();
    window.removeEventListener('resize', this.ajustar);
    this.raiz.classList.remove('visible');
    setTimeout(() => {
      this.raiz.remove();
      soltarFondos();
      this.fondos.clear();
      this.lienzo.width = this.lienzo.height = 1;
    }, 450);
    this.alSalir(como);
  }

  // ------------------------------------------------------------------------------------------- Ayudas para las estaciones
  /** Cambia un ratico la carita del chef de la esquina. */
  chef(pose: 'concentrado' | 'feliz' | 'celebra' | 'susto' | 'presume', seg = 2) {
    this.caraChef = { pose, hasta: this.reloj + seg };
  }
  flotar(texto: string, x: number, y: number, color = '#ffffff', tam = 30) {
    this.flotantes.push({ en: this.actual, texto, x, y, vida: 1.4, color, tam });
  }
  chispas(x: number, y: number, color = '#ffd23f', n = 12, tipo: 'estrella' | 'chispa' | 'corazon' | 'gota' | 'confeti' = 'estrella') {
    if (tipo === 'gota') this.fx.salpicar(x, y, color, n);
    else if (tipo === 'corazon') this.fx.corazones(x, y, n);
    else this.fx.chispas(x, y, color, n, tipo);
  }
  /** ¡Bien hecho! (chispitas, sonido y un letrerito). */
  acierto(x: number, y: number, texto = '¡Perfecto!') {
    this.fx.chispas(x, y, '#ffd23f', 14, 'estrella');
    this.fx.brillos(x, y, 50, 30, 4);
    this.flotar(texto, x, y - 30, '#fff3c4', 28);
    sonidos.acierto();
  }
  humo(x: number, y: number, negro = false) {
    this.fx.humo(x, y, negro);
  }
  /** Mensaje arriba (se ve unos segundos). */
  aviso(texto: string, seg = 2.6) {
    this.pista = { texto, hasta: this.reloj + seg };
  }
  mostrarPista(texto: string, clave: string) {
    this.pistasVistas.add(clave);
    this.aviso(texto, 5);
  }
  /** Pistas del primer día (cada una una sola vez). */
  pistaUnaVez(clave: string, texto: string) {
    if (this.s.dia > 1 || this.pistasVistas.has(clave)) return;
    this.mostrarPista(texto, clave);
  }

  /** La zona de trabajo (sin el riel de arriba ni la barra de abajo, y sin el tiquete si la estación lo usa). */
  get zona(): Rect {
    const e = this.estaciones[this.actual - 1];
    const der = e?.usaTicket ? 262 : 0;
    return { x: 0, y: RIEL, w: this.W - der, h: this.H - RIEL - BARRA };
  }
  /** Dónde se dibuja el tiquete escogido en las estaciones que lo usan. */
  get cajaTicket(): Rect {
    return { x: this.W - 254, y: RIEL + 8, w: 244, h: this.H - RIEL - BARRA - 16 };
  }

  // ------------------------------------------------------------------------------------------- Toques
  private tocar(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    if (this.vista === 'intro') {
      if (tipo === 'bajar' && this.introT > 1.4) this.terminarIntro();
      return;
    }
    const s = this.s;
    if (s.fase === 'juicio') {
      if (tipo === 'bajar' && s.juicio && this.reloj - this.juicioVisto.t0 > 2.8) {
        if (this.anfitrion) this.cerrarJuicio();
        else this.sync?.pedir('cerrar', { n: s.juicio.n });
      }
      return;
    }
    if (s.fase !== 'jugando' || this.esperandoOtro) return;
    if (tipo === 'bajar') {
      if (y < RIEL) {
        const t = this.ticketEn(x, y);
        if (t) {
          this.activo = t;
          sonidos.papel();
        }
        return;
      }
      if (y > this.H - BARRA) {
        const i = this.pestanaEn(x);
        if (i !== null && i !== this.actual) this.irA(i);
        return;
      }
    }
    if (this.actual === 0) {
      if (tipo === 'bajar') this.toquePedidos(x, y);
      return;
    }
    this.estaciones[this.actual - 1].toque(tipo, x, y);
  }

  /** Cambia de estación con una transición suave (la anterior se desliza). */
  irA(i: number) {
    if (i === this.actual) return;
    // Foto de cómo se veía (un solo lienzo que se reusa)
    const c = this.fotoTransicion ?? (this.fotoTransicion = document.createElement('canvas'));
    if (c.width !== this.lienzo.width || c.height !== this.lienzo.height) {
      c.width = this.lienzo.width;
      c.height = this.lienzo.height;
    }
    const gc = c.getContext('2d')!;
    gc.clearRect(0, 0, c.width, c.height);
    gc.drawImage(this.lienzo, 0, 0);
    this.transicion = { lienzo: c, t: 0, dir: i > this.actual ? 1 : -1 };
    this.actual = i;
    sonidos.clic();
  }
  private fotoTransicion: HTMLCanvasElement | null = null;

  rectTicket(i: number): Rect {
    return { x: 12 + i * 114, y: 6, w: 106, h: RIEL - 14 };
  }
  private ticketEn(x: number, y: number) {
    return this.s.tickets.find((_, i) => dentro(this.rectTicket(i), x, y)) ?? null;
  }
  pestanas(): Rect[] {
    const n = this.estaciones.length + 1;
    const w = Math.min(240, (this.W - 300) / n);
    const x0 = (this.W - w * n) / 2;
    return Array.from({ length: n }, (_, i) => ({ x: x0 + i * w + 6, y: this.H - BARRA + 10, w: w - 12, h: BARRA - 16 }));
  }
  private pestanaEn(x: number) {
    const i = this.pestanas().findIndex((r) => x >= r.x - 6 && x <= r.x + r.w + 6);
    return i >= 0 ? i : null;
  }

  botonTomar: Rect | null = null;
  private toquePedidos(x: number, y: number) {
    if (!this.botonTomar || !dentro(this.botonTomar, x, y)) return;
    if (this.anfitrion) this.tomarPedido(this.yo.id);
    else {
      this.sync?.pedir('tomar');
      this.botonTomar = null;
      sonidos.papel();
    }
  }

  // ------------------------------------------------------------------------------------------- Dibujo
  private dibujar() {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.vista === 'intro') {
      g.setTransform(this.k, 0, 0, this.k, 0, 0);
      P.dibujarIntro(this, g, this.introT);
      return;
    }
    // Fondo guardado de la estación que se ve (se pinta una sola vez)
    let f = this.fondos.get(this.actual);
    if (!f || f.width !== this.lienzo.width || f.height !== this.lienzo.height) {
      f = document.createElement('canvas');
      f.width = this.lienzo.width;
      f.height = this.lienzo.height;
      const gf = f.getContext('2d')!;
      gf.setTransform(this.k, 0, 0, this.k, 0, 0);
      const listo = this.actual === 0 ? P.fondoPedidos(this, gf) : (this.estaciones[this.actual - 1].fondo(gf, this.W, this.H), P.fondoListo(this));
      // Si las imágenes todavía están cargando, se vuelve a pintar en el siguiente cuadro
      if (listo) this.fondos.set(this.actual, f);
    }
    // Transición: la estación nueva entra deslizándose y la vieja se va desvaneciendo (riel y barra quietos)
    const tr = this.transicion;
    const ek = tr ? 1 - Math.pow(1 - Math.min(1, tr.t / 0.32), 3) : 1;
    const dx = tr ? tr.dir * (1 - ek) * this.W * 0.22 : 0;
    if (dx) {
      g.fillStyle = '#2b1a10';
      g.fillRect(0, 0, this.lienzo.width, this.lienzo.height);
    }
    g.drawImage(f, dx * this.k, 0);
    g.setTransform(this.k, 0, 0, this.k, dx * this.k, 0);
    if (this.actual === 0) P.dibujarPedidos(this, g);
    else {
      const e = this.estaciones[this.actual - 1];
      e.dibujar(g, this.reloj);
      if (e.usaTicket) P.dibujarTicketGrande(this, g);
    }
    if (tr) {
      const y0 = Math.floor(RIEL * this.k), y1 = Math.ceil((this.H - BARRA) * this.k);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1 - ek;
      g.drawImage(tr.lienzo, 0, y0, tr.lienzo.width, y1 - y0, -tr.dir * ek * this.lienzo.width * 0.3, y0, tr.lienzo.width, y1 - y0);
      g.globalAlpha = 1;
      g.setTransform(this.k, 0, 0, this.k, 0, 0);
    }
    this.fx.dibujar(g);
    for (const fl of this.flotantes) {
      if (fl.en !== this.actual) continue;
      g.globalAlpha = Math.min(1, fl.vida * 1.5);
      texto(g, fl.texto, fl.x, fl.y, { tam: fl.tam, color: fl.color, borde: 'rgba(40,20,10,0.85)' });
      g.globalAlpha = 1;
    }
    P.dibujarManoOtro(this, g);
    P.dibujarRiel(this, g);
    P.dibujarBarra(this, g);
    if (this.pista && this.reloj < this.pista.hasta) P.dibujarPista(this, g, this.pista.texto);
    if (this.s.fase === 'juicio' && this.s.juicio) P.dibujarJuicio(this, g, this.s.juicio, this.reloj - this.juicioVisto.t0);
  }

  /** Dibuja un botón de la estación (los de las estaciones usan el mismo estilo). */
  boton(r: Rect, txt: string, color = '#ffb627', o: { tam?: number; color?: string; borde?: string; apagado?: boolean } = {}) {
    boton(this.g, r, { color, apagado: o.apagado });
    texto(this.g, txt, r.x + r.w / 2, r.y + r.h / 2 + 2, { tam: o.tam ?? 26, color: o.color ?? '#4a2a10', borde: o.borde, max: r.w - 12 });
  }
  /** Rectángulo redondeado con relleno (atajo). */
  caja(r: Rect, color: string, radio = 14) {
    this.g.fillStyle = color;
    rr(this.g, r.x, r.y, r.w, r.h, radio);
    this.g.fill();
  }

  /** Para las pruebas. */
  probar(que: 'llegar' | 'tomar' | 'fin' | 'jugar' | 'intro' | 'juicio' | 'avanzar', v = 0) {
    if (que === 'intro') this.terminarIntro();
    // Adelanta el juego `v` segundos de una (a 30 cuadros, sin dibujar) y pinta el resultado
    if (que === 'avanzar') {
      for (let i = 0; i < Math.round(v * 30); i++) {
        this.reloj += 1 / 30;
        this.paso(1 / 30);
      }
      this.dibujar();
      return;
    }
    if (que === 'jugar') {
      this.terminarIntro();
      if (this.anfitrion) this.jugar();
      else this.sync?.pedir('jugar');
    }
    if (!this.anfitrion) {
      if (que === 'tomar') this.sync?.pedir('tomar');
      return;
    }
    if (que === 'llegar') for (const e of this.s.invitados) if (e.estado === 'fuera') e.llega = Math.min(e.llega, this.s.t + v);
    if (que === 'tomar') {
      const e = this.s.invitados.find((i) => i.estado === 'fila');
      if (e) {
        this.tomarPedido(this.yo.id);
        this.colgarTicket(e);
      }
    }
    if (que === 'juicio' && this.s.juicio) this.cerrarJuicio();
    if (que === 'fin') {
      for (const e of this.s.invitados) e.estado = 'ido';
      if (!this.s.puntajes.length) this.s.puntajes.push(80);
      this.finDia();
    }
  }

  /** Estado para las pruebas (sin las obras). */
  resumen() {
    return {
      fase: this.s.fase, n: this.s.n, dia: this.s.dia, t: Math.round(this.s.t * 10) / 10, tickets: this.s.tickets.map((t) => t.id), propinas: this.s.propinas,
      puntajes: [...this.s.puntajes], invitados: this.s.invitados.map((e) => e.estado), juntos: this.juntos, anfitrion: this.anfitrion,
      conectado: this.sync?.conectado ?? null, actual: this.actual, activo: this.activoId, vista: this.vista, stats: this.sync?.stats ?? null,
    };
  }
}

/** Escenas enganchadas al final del día (las registra otro módulo con `cocina.alTerminarDia.push(...)`). */
const ganchosFin: NonNullable<OpcionesCocina['alTerminarDia']>[] = [];

/** Abre la cocina con la receta; al cerrarla dice si se salió del todo o se vuelve a la sala de espera. */
export function abrirCocina(receta: Receta, o: OpcionesCocina): Promise<SalidaCocina> {
  return new Promise((listo) => {
    const m = new Motor(receta, o, (como) => {
      if (cocina.actual === m) cocina.actual = null;
      listo(como);
    });
    cocina.actual = m;
    (window as any).__cocinaMotor = m;
    m.empezar();
  });
}
export const cocina: { actual: Motor | null; alTerminarDia: typeof ganchosFin } = { actual: null, alTerminarDia: ganchosFin };
