// El motor de la cocina de chef, al estilo de los juegos de Papa's: llegan invitados, se les toma el pedido (un
// tiquete que queda colgado arriba), se cocina en las estaciones de cada restaurante y se entrega; el invitado lo
// prueba y califica cada parte (espera y cada estación) y deja propina. Al final del día hay puntos de chef
// (rango: ingredientes e invitados nuevos), propinas para mejorar la cocina y el premio para la casa.
import { nota, rumor } from '../../sonido';
import type { Rol } from '../modelo';
import {
  aclarar, boton, conAlfa, dentro, elipse, G, lineal, oscurecer, particula, Particula, radial, Rect, rr, sombra, texto,
} from './dibujo';
import { Animo, FRASES, FRASES_PAREJA, Invitado, invitadoPareja, INVITADOS, invitadosDelDia, POSE_PAREJA } from './invitados';
import { Desbloqueo, Mejora, nombreRango, OpcionesCocina, ProgresoCocina, rangoDe, RecetaId, ResultadoDia, umbralRango } from './tipos';

// ---------------------------------------------------------------------------------------------- Lo que pone cada restaurante
export interface Estacion {
  id: string;
  nombre: string;
  icono: string;
  /** Muestra el tiquete escogido a la derecha (las estaciones donde se arma el plato). */
  usaTicket?: boolean;
  fondo(g: G, W: number, H: number): void;
  dibujar(g: G, t: number): void;
  /** Corre siempre (lo que se está cocinando sigue aunque se mire otra estación). */
  paso(dt: number): void;
  toque(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number): void;
  /** Algo pide atención (la pestaña titila). */
  alerta?(): boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  valor: number;
}

export interface Receta<P = any, O = any> {
  id: RecetaId;
  nombre: string;
  /** Lo que dice el letrero (con el nombre de quién cocina). */
  titulo(rol: Rol): string;
  /** El plato que se lleva a la despensa. */
  plato: string;
  nombrePlato: string;
  tema: { pared: string; acento: string; piso: string };
  mejoras: Mejora[];
  desbloqueos: Desbloqueo[];
  crearEstaciones(m: Motor): Estacion[];
  pedido(rango: number, dia: number, azar: () => number): P;
  obraNueva(p: P): O;
  /** Segundos que tomaría hacerlo bien (para saber si hizo esperar al invitado). */
  tiempoIdeal(p: P): number;
  /** Dibuja el pedido dentro del tiquete. */
  dibujarTicket(g: G, p: P, r: Rect, m: Motor): void;
  calificar(t: Ticket<P, O>, m: Motor): Categoria[];
  dibujarPlato(g: G, t: Ticket<P, O>, x: number, y: number, escala: number, m: Motor): void;
}

export interface Ticket<P = any, O = any> {
  id: number;
  numero: number;
  inv: EnDia;
  pedido: P;
  obra: O;
  tomado: number;
}

type EstadoInv = 'fuera' | 'fila' | 'pidiendo' | 'esperando' | 'comiendo' | 'saliendo' | 'ido';
export interface EnDia {
  inv: Invitado;
  llega: number;
  estado: EstadoInv;
  x: number;
  meta: number;
  llegoEn: number;
  tomadoEn: number;
  ticket?: Ticket;
  /** Lo que pidió (mientras se escribe el tiquete). */
  pedido?: unknown;
  frase?: { texto: string; hasta: number };
  animo: Animo;
}

interface Flotante {
  /** En qué estación salió (solo se ve ahí). */
  en: number;
  texto: string;
  x: number;
  y: number;
  vida: number;
  color: string;
  tam: number;
}

interface Juicio {
  ticket: Ticket;
  cats: Categoria[];
  total: number;
  propina: number;
  t: number;
  frase: string;
  animo: Animo;
}

const ALTO = 720;
const ANCHO_MIN = 1280;
/** Alto del riel de tiquetes y de la barra de estaciones. */
export const RIEL = 104;
export const BARRA = 88;
const azarCon = (semilla: number) => () => {
  semilla |= 0;
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const elegir = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
const genero = (rol: Rol, t: string) => t.replace(/(\p{L}+)\|(\p{L}+)/gu, (_, a, b) => (rol === 'el' ? a : b));

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
};

// ---------------------------------------------------------------------------------------------- El motor
export class Motor {
  W = ANCHO_MIN;
  H = ALTO;
  /** Pixeles del lienzo por unidad virtual. */
  private k = 1;
  private raiz: HTMLElement;
  private lienzo: HTMLCanvasElement;
  g: G;
  private cuadro = 0;
  private ultimo = 0;
  private terminado = false;
  /** Segundos de juego del día (sin contar pausas ni la calificación). */
  t = 0;
  /** Reloj que siempre corre (animaciones). */
  reloj = 0;
  estado: 'intro' | 'jugando' | 'juicio' | 'pausa' | 'fin' = 'intro';
  estaciones: Estacion[] = [];
  actual = 0;
  private fondos = new Map<number, HTMLCanvasElement>();
  tickets: Ticket[] = [];
  activo: Ticket | null = null;
  invitados: EnDia[] = [];
  private numero = 0;
  private particulas: Particula[] = [];
  private flotantes: Flotante[] = [];
  private juicio: Juicio | null = null;
  private imgs = new Map<string, HTMLImageElement>();
  /** Cara del chef en la esquina (cambia con lo que pasa). */
  private caraChef: { pose: string; hasta: number } = { pose: 'concentrado', hasta: 0 };
  private pista: { texto: string; hasta: number } | null = null;
  private pistasVistas = new Set<string>();
  private dedo: { x: number; y: number } | null = null;
  // Lo del día
  dia: number;
  rango: number;
  progreso: ProgresoCocina;
  private puntajes: number[] = [];
  private propinasDia = 0;
  private perfectosDia = 0;
  private xpDia = 0;
  private azar: () => number;

  constructor(public receta: Receta, private o: OpcionesCocina, private alSalir: () => void) {
    this.progreso = structuredClone(o.progreso);
    this.dia = this.progreso.dia;
    this.rango = rangoDe(this.progreso.xp);
    this.azar = azarCon(this.dia * 7919 + (o.rol === 'el' ? 1 : 2));
    this.raiz = document.createElement('section');
    this.raiz.className = `cocina cocina-${receta.id}`;
    this.raiz.innerHTML = `<canvas class="cocina-lienzo"></canvas>
      <button class="cocina-pausa" aria-label="Pausa">❚❚</button>
      <div class="cocina-capa" hidden></div>`;
    document.body.append(this.raiz);
    this.lienzo = this.raiz.querySelector('canvas')!;
    this.g = this.lienzo.getContext('2d')!;
    this.raiz.querySelector('.cocina-pausa')!.addEventListener('click', () => this.pausar());
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
    this.estaciones = receta.crearEstaciones(this);
    this.cargarImagenes();
  }

  private get dpr() {
    return Math.min(2, window.devicePixelRatio || 1);
  }
  get rol() {
    return this.o.rol;
  }
  /** Nivel de una mejora comprada. */
  mejora(id: string) {
    return this.progreso.mejoras[id] ?? 0;
  }
  img(ruta: string) {
    let i = this.imgs.get(ruta);
    if (!i) {
      i = new Image();
      i.src = ruta;
      this.imgs.set(ruta, i);
    }
    return i;
  }
  private cargarImagenes() {
    for (const p of ['concentrado', 'feliz', 'celebra', 'susto', 'presume']) this.img(`./cocina/${this.rol}_chef_${p}.webp`);
  }
  private spriteDe(inv: Invitado, a: Animo) {
    return this.img(inv.especial === 'pareja' ? `${inv.ruta}_${POSE_PAREJA[a]}.webp` : `${inv.ruta}_${a}.webp`);
  }

  // ------------------------------------------------------------------------------------------- Arranque
  empezar() {
    this.ajustar();
    window.addEventListener('resize', this.ajustar);
    requestAnimationFrame(() => this.raiz.classList.add('visible'));
    this.ultimo = performance.now();
    let salto = false;
    const bucle = (ms: number) => {
      if (this.terminado) return;
      this.cuadro = requestAnimationFrame(bucle);
      const dt = Math.min(0.05, (ms - this.ultimo) / 1000);
      // Sin el dedo encima y sin nada rápido, a 30 cuadros (el celular no se calienta)
      if (!this.dedo && this.estado !== 'juicio' && (salto = !salto)) return;
      this.ultimo = ms;
      this.reloj += dt;
      if (this.estado === 'jugando') this.paso(dt);
      else if (this.estado === 'juicio') this.pasoEfectos(dt);
      // Con un letrero encima (el día, la pausa, el final) casi no se redibuja
      if (this.estado === 'jugando' || this.estado === 'juicio' || this.reloj - this.dibujado > 0.5) {
        this.dibujado = this.reloj;
        this.dibujar();
      }
    };
    this.cuadro = requestAnimationFrame(bucle);
    this.intro();
  }

  private dibujado = 0;

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

  /** El día nuevo: quiénes vienen y a qué hora. */
  private planear() {
    const pareja = invitadoPareja(this.o.pareja.rol, this.o.pareja.nombre);
    const lista = invitadosDelDia(this.dia, this.rango, pareja, this.azar);
    const intervalo = Math.max(14, 38 - this.dia * 1.6);
    let t = 1.5;
    this.invitados = lista.map((inv, i) => {
      if (i > 0) t += intervalo * (0.75 + this.azar() * 0.5);
      return { inv, llega: t, estado: 'fuera', x: this.W + 160, meta: this.W + 160, llegoEn: 0, tomadoEn: 0, animo: 'feliz' };
    });
    for (const e of this.invitados) for (const a of ['feliz', 'espera', 'bravo', 'encantado'] as Animo[]) this.spriteDe(e.inv, a);
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
    this.estado = 'intro';
    this.capa(`<div class="cocina-modo-chef">
        <div class="lineas"></div>
        <div class="chef"><img src="./cocina/${this.rol}_chef_concentrado.webp" alt=""><i class="destello a"></i><i class="destello b"></i></div>
        <p class="respira">${genero(this.rol, 'Respira… siente la cocina… hoy eres un|una chef profesional…')}</p>
        <h1><span>MODO</span> <b>CHEF</b></h1>
        <small>Toca para seguir</small>
      </div>`, 'intro');
    [0, 0.5, 1, 1.5].forEach((d) => nota(220 + d * 110, 0.5, d, 'sine', 0.03, 440 + d * 220));
    rumor(2.4, 300, 0.05, 0.4, 0.5, 2600);
    setTimeout(() => {
      if (this.estado !== 'intro') return;
      [523, 659, 784, 1046].forEach((f, i) => nota(f, 0.3, i * 0.08, 'triangle', 0.06));
    }, 2300);
    this.introHasta = performance.now() + 3400;
    this.planear();
    setTimeout(() => {
      if (this.estado === 'intro' && this.raiz.querySelector('.cocina-modo-chef')) this.tarjetaDia();
    }, 4200);
  }
  private introHasta = 0;

  private tarjetaDia() {
    const n = this.invitados.length;
    const hayPareja = this.invitados.some((e) => e.inv.especial === 'pareja');
    const critico = this.invitados.some((e) => e.inv.especial === 'critico');
    this.capa(`<div class="cocina-tarjeta">
        <p class="letrero">${this.receta.titulo(this.rol)}</p>
        <h2>Día ${this.dia}</h2>
        <p>${n} invitados vienen a comer${hayPareja ? ` · <b>¡${this.o.pareja.nombre} viene hoy!</b> 💖` : ''}${critico ? ' · <b>¡Viene el crítico famoso!</b>' : ''}</p>
        <p class="rango">${nombreRango(this.rango)} · rango ${this.rango}</p>
        <div class="botones"><button class="boton-cocina" data-c="tienda">🛠️ Mejoras</button><button class="boton-cocina principal" data-c="jugar">¡A cocinar!</button></div>
      </div>`, 'dia');
  }

  private clicCapa(ev: Event) {
    const b = (ev.target as HTMLElement).closest('[data-c]') as HTMLElement | null;
    if (this.estado === 'intro' && !b) {
      if (performance.now() > this.introHasta - 2600) this.tarjetaDia();
      return;
    }
    if (!b) return;
    sonidos.clic();
    const c = b.dataset.c!;
    if (c === 'jugar') this.jugar();
    else if (c === 'tienda') this.tienda(b.dataset.volver ?? 'dia');
    else if (c.startsWith('comprar:')) void this.comprar(c.slice(8), b.dataset.volver ?? 'dia');
    else if (c === 'volver-dia') this.tarjetaDia();
    else if (c === 'volver-fin') this.pintarFin();
    else if (c === 'seguir') this.seguir();
    else if (c === 'salir') this.salir();
    else if (c === 'siguiente') this.siguienteDia();
  }

  private jugar() {
    this.capa('');
    this.estado = 'jugando';
    this.actual = 0;
    if (this.dia === 1) this.mostrarPista('Llegan invitados al mostrador: toca «Tomar pedido»', 'inicio');
  }

  pausar() {
    if (this.estado !== 'jugando') return;
    this.estado = 'pausa';
    this.capa(`<div class="cocina-tarjeta"><h2>Pausa</h2><p>La cocina te espera.</p>
      <div class="botones"><button class="boton-cocina" data-c="salir">Volver a la casa</button><button class="boton-cocina principal" data-c="seguir">Seguir cocinando</button></div>
      <p class="nota">Si vuelves a la casa ahora, el día ${this.dia} se pierde (las mejoras quedan).</p></div>`, 'pausa');
  }
  private seguir() {
    this.capa('');
    this.estado = 'jugando';
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
        <header><h2>Mejoras de la cocina</h2><span class="saldo">🪙 ${p.propinas} en propinas</span></header>
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
    this.fondos.clear();
    this.tienda(volver);
    await this.o.guardar(structuredClone(this.progreso)).catch(() => {});
  }

  // ------------------------------------------------------------------------------------------- Durante el día
  private paso(dt: number) {
    this.t += dt;
    const W = this.W;
    // Llegan los invitados y caminan a su puesto
    const fila = this.invitados.filter((e) => e.estado === 'fila' || e.estado === 'pidiendo');
    for (const e of this.invitados) {
      if (e.estado === 'fuera' && this.t >= e.llega) {
        e.estado = 'fila';
        e.llegoEn = this.t;
        e.x = W + 120;
        sonidos.campana();
        e.frase = { texto: genero(this.rol, elegir(e.inv.saludos)), hasta: this.t + 3.2 };
        if (this.actual !== 0) this.aviso(`¡Llegó ${e.inv.nombre}!`);
      }
    }
    fila.forEach((e, i) => (e.meta = this.puestoFila(i)));
    const esperan = this.invitados.filter((e) => e.estado === 'esperando');
    esperan.forEach((e, i) => (e.meta = this.puestoEspera(i)));
    for (const e of this.invitados) {
      if (e.estado === 'saliendo') e.meta = W + 200;
      const d = e.meta - e.x;
      e.x += Math.sign(d) * Math.min(Math.abs(d), dt * 420);
      if (e.estado === 'saliendo' && e.x >= W + 190) e.estado = 'ido';
      // Ánimo: según cuánto va esperando
      if (e.estado === 'fila' || e.estado === 'pidiendo' || e.estado === 'esperando') {
        const v = this.puntajeEspera(e, this.t);
        const antes = e.animo;
        e.animo = v >= 70 ? 'feliz' : v >= 40 ? 'espera' : 'bravo';
        if (antes !== e.animo && e.animo !== 'feliz' && !e.frase) e.frase = { texto: elegir(FRASES.apurado), hasta: this.t + 2.5 };
      }
      if (e.frase && this.t > e.frase.hasta) e.frase = undefined;
    }
    // Tomando el pedido: al rato queda el tiquete colgado
    const pid = this.invitados.find((e) => e.estado === 'pidiendo');
    if (pid && this.t - pid.tomadoEn > 2.4) this.colgarTicket(pid);
    for (const s of this.estaciones) s.paso(dt);
    this.pasoEfectos(dt);
    if (this.invitados.length && this.invitados.every((e) => e.estado === 'ido')) this.finDia();
  }

  private pasoEfectos(dt: number) {
    for (const p of this.particulas) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.tipo !== 'humo') p.vy += 600 * dt;
      else p.vy -= 10 * dt;
      p.vida -= dt;
    }
    this.particulas = this.particulas.filter((p) => p.vida > 0);
    for (const f of this.flotantes) {
      f.y -= 50 * dt;
      f.vida -= dt;
    }
    this.flotantes = this.flotantes.filter((f) => f.vida > 0);
    if (this.juicio) this.juicio.t += dt;
  }

  private puestoFila(i: number) {
    return this.W * 0.5 + (i ? 60 + i * 175 : 0);
  }
  private puestoEspera(i: number) {
    return 120 + (i % 5) * 105;
  }

  /** Qué tan bien va la espera (100 = no ha esperado de más). */
  puntajeEspera(e: EnDia, ahora: number) {
    const pac = e.inv.paciencia * (1 + 0.15 * this.mejora('musica'));
    const fila = e.tomadoEn ? e.tomadoEn - e.llegoEn : ahora - e.llegoEn;
    let exceso = Math.max(0, fila - 10 * pac);
    if (e.ticket) exceso += Math.max(0, ahora - e.tomadoEn - this.receta.tiempoIdeal(e.ticket.pedido) * pac);
    return Math.max(0, Math.round(100 - exceso * 1.3));
  }

  private tomarPedido(e: EnDia) {
    e.estado = 'pidiendo';
    e.tomadoEn = this.t;
    e.frase = undefined;
    e.pedido = this.receta.pedido(this.rango, this.dia, this.azar);
    sonidos.papel();
    this.chef('feliz', 2.5);
    this.pistaUnaVez('pedido', 'Mira bien el tiquete: dice todo lo que quiere');
  }

  private colgarTicket(e: EnDia) {
    const p = e.pedido ?? this.receta.pedido(this.rango, this.dia, this.azar);
    e.pedido = undefined;
    const t: Ticket = { id: ++this.numero, numero: this.numero, inv: e, pedido: p, obra: this.receta.obraNueva(p), tomado: this.t };
    e.ticket = t;
    e.estado = 'esperando';
    this.tickets.push(t);
    this.activo ??= t;
    sonidos.papel();
    this.pistaUnaVez('estaciones', `Ahora ve a «${this.estaciones[1]?.nombre}» (abajo) y prepara el pedido #${t.numero}`);
  }

  /** Se entrega el plato: el invitado lo prueba y califica. */
  entregar(t: Ticket) {
    const e = t.inv;
    const cats = [{ id: 'espera', nombre: 'Espera', valor: this.puntajeEspera(e, this.t) }, ...this.receta.calificar(t, this)];
    let total = Math.round(cats.reduce((a, c) => a + c.valor, 0) / cats.length);
    // El crítico es exigente: lo que no es excelente le parece regular
    if (e.inv.especial === 'critico') total = Math.round(100 * Math.pow(total / 100, 1.5));
    const base = 3 + this.receta.tiempoIdeal(t.pedido) * 0.06;
    let propina = Math.max(0, Math.round(base * (total / 100) * e.inv.propina * (1 + 0.12 * this.mejora('jarra'))));
    if (total >= 95) propina += 2;
    this.tickets = this.tickets.filter((x) => x !== t);
    if (this.activo === t) this.activo = this.tickets[0] ?? null;
    e.estado = 'comiendo';
    e.x = this.W * 0.5;
    const animo: Animo = total >= 90 ? 'encantado' : total >= 70 ? 'feliz' : total >= 50 ? 'espera' : 'bravo';
    const tono = total >= 90 ? 'encantado' : total >= 70 ? 'feliz' : total >= 50 ? 'normal' : 'bravo';
    const frase = genero(this.rol, elegir(e.inv.especial === 'pareja' ? FRASES_PAREJA[tono] : FRASES[tono]));
    this.juicio = { ticket: t, cats, total, propina, t: 0, frase, animo };
    this.estado = 'juicio';
    this.puntajes.push(total);
    this.propinasDia += propina;
    this.xpDia += total;
    if (total >= 95) this.perfectosDia++;
    this.chef(total >= 90 ? 'celebra' : total >= 60 ? 'feliz' : 'susto', 4);
    setTimeout(() => (total >= 70 ? sonidos.bien() : sonidos.mal()), 900);
    setTimeout(() => sonidos.caja(), 2300);
  }

  private cerrarJuicio() {
    const j = this.juicio;
    if (!j) return;
    j.ticket.inv.estado = 'saliendo';
    j.ticket.inv.animo = j.animo;
    this.juicio = null;
    this.estado = 'jugando';
    this.actual = 0;
  }

  // ------------------------------------------------------------------------------------------- Fin del día
  private resultado: ResultadoDia | null = null;
  private subio: Desbloqueo[] = [];

  private finDia() {
    if (this.estado === 'fin') return;
    this.estado = 'fin';
    const servidos = this.puntajes.length;
    const promedio = servidos ? Math.round(this.puntajes.reduce((a, b) => a + b, 0) / servidos) : 0;
    const xp = this.xpDia + 20;
    const rangoAntes = this.rango;
    const p = this.progreso;
    p.xp += xp;
    p.propinas += this.propinasDia;
    p.dia = this.dia + 1;
    p.servidos += servidos;
    p.perfectos += this.perfectosDia;
    p.mejor = Math.max(p.mejor, promedio);
    this.rango = rangoDe(p.xp);
    this.subio = [...this.receta.desbloqueos, ...INVITADOS.filter((i) => i.desde > 1).map((i) => ({ rango: i.desde, texto: `Ahora viene a comer: ${i.nombre}` }))]
      .filter((d) => d.rango > rangoAntes && d.rango <= this.rango);
    const monedas = Math.max(1, Math.min(20, Math.round(servidos * (promedio / 100) * 2.2)));
    const buenos = this.puntajes.filter((v) => v >= 70).length;
    const platos = buenos ? Math.min(4, 1 + Math.floor(buenos / 2)) : 0;
    this.resultado = { receta: this.receta.id, dia: this.dia, servidos, promedio, propinas: this.propinasDia, perfectos: this.perfectosDia, xp, monedas, platos };
    void this.o.guardar(structuredClone(p), this.resultado).catch(() => {});
    [523, 659, 784, 1046, 1318].forEach((f, i) => nota(f, 0.2, i * 0.1, 'triangle', 0.05));
    this.pintarFin(rangoAntes);
  }

  private pintarFin(rangoAntes = this.rango) {
    const r = this.resultado!;
    const p = this.progreso;
    const estrellas = r.promedio >= 90 ? 3 : r.promedio >= 70 ? 2 : r.promedio >= 45 ? 1 : 0;
    const desde = umbralRango(this.rango), hasta = umbralRango(this.rango + 1);
    const avance = Math.round(((p.xp - desde) / (hasta - desde)) * 100);
    this.capa(`<div class="cocina-fin">
        <h2>¡Terminó el día ${r.dia}!</h2>
        <div class="estrellas">${[0, 1, 2].map((i) => `<i class="${i < estrellas ? 'si' : ''}" style="--d:${0.3 + i * 0.25}s">★</i>`).join('')}</div>
        <ul class="cifras">
          <li><b>${r.servidos}</b><span>invitados atendidos</span></li>
          <li><b>${r.promedio}%</b><span>calificación promedio</span></li>
          <li><b>🪙 ${r.propinas}</b><span>en propinas</span></li>
          <li><b>${r.perfectos}</b><span>${r.perfectos === 1 ? 'plato perfecto' : 'platos perfectos'}</span></li>
        </ul>
        <div class="rango-barra"><span>${nombreRango(this.rango)} · rango ${this.rango}${this.rango > rangoAntes ? ' <b>¡SUBISTE!</b>' : ''}</span><i style="--v:${avance}%"></i></div>
        ${this.subio.length ? `<div class="nuevo">${this.subio.map((d) => `<p>✨ ${d.texto}</p>`).join('')}</div>` : ''}
        <p class="premio">Para la casa: <b>+${r.monedas} ${r.monedas === 1 ? 'moneda' : 'monedas'}</b>${r.platos ? ` y <b>${r.platos} × ${this.receta.nombrePlato}</b> a la despensa (se pueden comer o regalar)` : ''}</p>
        <div class="botones">
          <button class="boton-cocina" data-c="salir">🏠 Volver a la casa</button>
          <button class="boton-cocina" data-c="tienda" data-volver="fin">🛠️ Mejoras (🪙 ${p.propinas})</button>
          <button class="boton-cocina principal" data-c="siguiente">Día ${p.dia} ➜</button>
        </div>
      </div>`, 'fin');
  }

  private siguienteDia() {
    this.dia = this.progreso.dia;
    this.azar = azarCon(this.dia * 7919 + (this.rol === 'el' ? 1 : 2));
    this.t = 0;
    this.tickets = [];
    this.activo = null;
    this.puntajes = [];
    this.propinasDia = 0;
    this.perfectosDia = 0;
    this.xpDia = 0;
    this.particulas = [];
    this.estaciones = this.receta.crearEstaciones(this);
    this.fondos.clear();
    this.planear();
    this.tarjetaDia();
    this.estado = 'intro';
  }

  private salir() {
    this.terminado = true;
    cancelAnimationFrame(this.cuadro);
    window.removeEventListener('resize', this.ajustar);
    this.raiz.classList.remove('visible');
    setTimeout(() => this.raiz.remove(), 450);
    this.alSalir();
  }

  // ------------------------------------------------------------------------------------------- Ayudas para las estaciones
  /** Cambia un ratico la carita del chef de la esquina. */
  chef(pose: 'concentrado' | 'feliz' | 'celebra' | 'susto' | 'presume', seg = 2) {
    this.caraChef = { pose, hasta: this.reloj + seg };
  }
  flotar(texto: string, x: number, y: number, color = '#ffffff', tam = 30) {
    this.flotantes.push({ en: this.actual, texto, x, y, vida: 1.4, color, tam });
  }
  chispas(x: number, y: number, color = '#ffd23f', n = 12, tipo: Particula['tipo'] = 'estrella') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 150 + Math.random() * 250;
      this.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, vida: 0.8 + Math.random() * 0.5, max: 1.2, color, tam: 6 + Math.random() * 6, tipo });
    }
  }
  humo(x: number, y: number, color = '#8a8a8a') {
    this.particulas.push({ x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 20, vy: -60 - Math.random() * 40, vida: 1.4, max: 1.4, color, tam: 10 + Math.random() * 10, tipo: 'humo' });
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
    if (this.dia > 1 || this.pistasVistas.has(clave)) return;
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
    return { x: this.W - 254, y: RIEL + 6, w: 244, h: this.H - RIEL - BARRA - 12 };
  }

  // ------------------------------------------------------------------------------------------- Toques
  private tocar(tipo: 'bajar' | 'mover' | 'subir', x: number, y: number) {
    if (this.estado === 'juicio') {
      if (tipo === 'bajar' && this.juicio && this.juicio.t > 2.6) this.cerrarJuicio();
      return;
    }
    if (this.estado !== 'jugando') return;
    if (tipo === 'bajar') {
      // Riel de tiquetes
      if (y < RIEL) {
        const t = this.ticketEn(x, y);
        if (t) {
          this.activo = t;
          sonidos.papel();
        }
        return;
      }
      // Barra de estaciones
      if (y > this.H - BARRA) {
        const i = this.pestanaEn(x);
        if (i !== null && i !== this.actual) {
          this.actual = i;
          sonidos.clic();
        }
        return;
      }
    }
    if (this.actual === 0) {
      if (tipo === 'bajar') this.toquePedidos(x, y);
      return;
    }
    this.estaciones[this.actual - 1].toque(tipo, x, y);
  }

  private rectTicket(i: number): Rect {
    return { x: 12 + i * 112, y: 8, w: 104, h: 88 };
  }
  private ticketEn(x: number, y: number) {
    return this.tickets.find((_, i) => dentro(this.rectTicket(i), x, y)) ?? null;
  }
  private pestanas(): Rect[] {
    const n = this.estaciones.length + 1;
    const w = Math.min(250, (this.W - 40) / n);
    const x0 = (this.W - w * n) / 2;
    return Array.from({ length: n }, (_, i) => ({ x: x0 + i * w + 6, y: this.H - BARRA + 10, w: w - 12, h: BARRA - 18 }));
  }
  private pestanaEn(x: number) {
    const i = this.pestanas().findIndex((r) => x >= r.x - 6 && x <= r.x + r.w + 6);
    return i >= 0 ? i : null;
  }

  private botonTomar: Rect | null = null;
  private toquePedidos(x: number, y: number) {
    const e = this.invitados.find((i) => i.estado === 'fila' && Math.abs(i.x - this.puestoFila(0)) < 8);
    if (e && dentro(this.botonTomar, x, y) && !this.invitados.some((i) => i.estado === 'pidiendo')) this.tomarPedido(e);
  }

  // ------------------------------------------------------------------------------------------- Dibujo
  private dibujar() {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    // Fondo guardado de la estación que se ve (se pinta una sola vez)
    let f = this.fondos.get(this.actual);
    if (!f) {
      f = document.createElement('canvas');
      f.width = this.lienzo.width;
      f.height = this.lienzo.height;
      const gf = f.getContext('2d')!;
      gf.setTransform(this.k, 0, 0, this.k, 0, 0);
      if (this.actual === 0) this.fondoPedidos(gf);
      else this.estaciones[this.actual - 1].fondo(gf, this.W, this.H);
      this.fondos.set(this.actual, f);
    }
    g.drawImage(f, 0, 0);
    g.setTransform(this.k, 0, 0, this.k, 0, 0);
    if (this.actual === 0) this.dibujarPedidos(g);
    else {
      const e = this.estaciones[this.actual - 1];
      e.dibujar(g, this.reloj);
      if (e.usaTicket) this.dibujarTicketGrande(g);
    }
    this.dibujarRiel(g);
    this.dibujarBarra(g);
    for (const p of this.particulas) particula(g, p);
    for (const fl of this.flotantes) {
      if (fl.en !== this.actual) continue;
      g.globalAlpha = Math.min(1, fl.vida * 1.5);
      texto(g, fl.texto, fl.x, fl.y, { tam: fl.tam, color: fl.color, borde: 'rgba(40,20,10,0.85)' });
      g.globalAlpha = 1;
    }
    if (this.pista && this.reloj < this.pista.hasta) this.dibujarPista(g, this.pista.texto);
    if (this.juicio) this.dibujarJuicio(g, this.juicio);
  }

  /** Pared de cocina profesional: azulejos blancos, acero y una campana (lo usan las estaciones). */
  fondoCocina(g: G, o: { mesa?: number } = {}) {
    const { W, H } = this;
    const mesa = o.mesa ?? H - BARRA - 150;
    g.fillStyle = '#e9eef0';
    g.fillRect(0, 0, W, H);
    // Azulejos tipo metro
    const aw = 64, ah = 32;
    for (let y = 0; y < mesa; y += ah) {
      const off = (y / ah) % 2 ? aw / 2 : 0;
      for (let x = -aw; x < W + aw; x += aw) {
        g.fillStyle = lineal(g, 0, y, 0, y + ah, [[0, '#ffffff'], [1, '#e3e9ec']]);
        rr(g, x + off + 2, y + 2, aw - 4, ah - 4, 5);
        g.fill();
      }
    }
    // Franja de color del restaurante
    g.fillStyle = this.receta.tema.acento;
    g.fillRect(0, mesa - 86, W, 14);
    g.fillStyle = aclarar(this.receta.tema.acento, 0.4);
    g.fillRect(0, mesa - 72, W, 4);
    // Mesón de acero
    g.fillStyle = lineal(g, 0, mesa, 0, H, [[0, '#d5dadd'], [0.08, '#b9c0c4'], [0.1, '#8f979c'], [0.12, '#c7cdd1'], [1, '#9aa2a7']]);
    g.fillRect(0, mesa, W, H - mesa);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(0, mesa + 2, W, 3);
    for (let x = 30; x < W; x += 140) {
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(x, mesa + 16, 60, H - mesa);
    }
  }

  private fondoPedidos(g: G) {
    const { W, H } = this;
    const tema = this.receta.tema;
    const piso = H - BARRA - 170;
    // Pared
    g.fillStyle = lineal(g, 0, 0, 0, piso, [[0, aclarar(tema.pared, 0.2)], [1, tema.pared]]);
    g.fillRect(0, 0, W, piso);
    // Papel de colgadura con rayitas
    g.fillStyle = conAlfa('#ffffff', 0.18);
    for (let x = 0; x < W; x += 46) g.fillRect(x, 0, 18, piso);
    // Ventanas con cielo y cortinas
    for (const vx of [W * 0.12, W * 0.74]) {
      const vw = 200, vh = 170, vy = RIEL + 60;
      g.fillStyle = '#6a4632';
      rr(g, vx - 10, vy - 10, vw + 20, vh + 20, 12);
      g.fill();
      g.fillStyle = lineal(g, 0, vy, 0, vy + vh, [[0, '#8fd3ff'], [1, '#dff4ff']]);
      g.fillRect(vx, vy, vw, vh);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      elipse(g, vx + 60, vy + 50, 34, 14);
      g.fill();
      elipse(g, vx + 140, vy + 90, 28, 11);
      g.fill();
      g.fillStyle = '#6a4632';
      g.fillRect(vx + vw / 2 - 4, vy, 8, vh);
      g.fillRect(vx, vy + vh / 2 - 4, vw, 8);
      g.fillStyle = aclarar(tema.acento, 0.2);
      for (const lado of [-1, 1]) {
        g.beginPath();
        const x0 = lado < 0 ? vx - 18 : vx + vw + 18;
        g.moveTo(x0, vy - 14);
        g.quadraticCurveTo(x0 - lado * 70, vy + vh * 0.5, x0 - lado * 20, vy + vh + 20);
        g.lineTo(x0, vy + vh + 20);
        g.closePath();
        g.fill();
      }
    }
    // Tablero del menú
    const mx = W * 0.36, my = RIEL + 40, mw = W * 0.28, mh = 150;
    g.fillStyle = '#7a5236';
    rr(g, mx - 10, my - 10, mw + 20, mh + 20, 14);
    g.fill();
    g.fillStyle = '#2f3b36';
    rr(g, mx, my, mw, mh, 8);
    g.fill();
    texto(g, this.receta.titulo(this.rol), mx + mw / 2, my + 40, { tam: 34, color: '#fff7e6', max: mw - 30 });
    texto(g, `Día ${this.dia} · hecho con amor`, mx + mw / 2, my + 88, { tam: 22, color: '#ffd9a0', peso: 700 });
    texto(g, '♥ ★ ♥', mx + mw / 2, my + 122, { tam: 22, color: '#ff9fb4' });
    // Lámparas colgantes con luz
    for (const lx of [W * 0.3, W * 0.7]) {
      g.strokeStyle = '#3b2a22';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(lx, RIEL);
      g.lineTo(lx, RIEL + 30);
      g.stroke();
      g.fillStyle = radial(g, lx, RIEL + 60, 10, 200, [[0, 'rgba(255,230,160,0.45)'], [1, 'rgba(255,230,160,0)']]);
      g.fillRect(lx - 200, RIEL, 400, 300);
      g.fillStyle = tema.acento;
      g.beginPath();
      g.moveTo(lx - 34, RIEL + 56);
      g.quadraticCurveTo(lx, RIEL + 14, lx + 34, RIEL + 56);
      g.closePath();
      g.fill();
    }
    // Piso de baldosas
    g.fillStyle = tema.piso;
    g.fillRect(0, piso, W, H - piso);
    for (let x = 0; x < W; x += 60)
      for (let y = piso; y < H; y += 40) if (((x / 60) + (y - piso) / 40) % 2 < 1) {
        g.fillStyle = oscurecer(tema.piso, 0.08);
        g.fillRect(x, y, 60, 40);
      }
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, piso, W, 8);
    // Mesitas de la zona de espera
    for (let i = 0; i < 3; i++) {
      const tx = 150 + i * 190, ty = piso + 40;
      sombra(g, tx, ty + 60, 80, 16, 0.3);
      g.fillStyle = '#8a5a3c';
      g.fillRect(tx - 6, ty, 12, 60);
      g.fillStyle = lineal(g, 0, ty - 14, 0, ty + 10, [[0, '#fff7ee'], [1, '#ead7c3']]);
      elipse(g, tx, ty, 70, 18);
      g.fill();
      g.fillStyle = tema.acento;
      elipse(g, tx, ty - 8, 10, 10);
      g.fill();
    }
  }

  private dibujarPedidos(g: G) {
    const { W, H } = this;
    const piso = H - BARRA - 170;
    // Invitados esperando (atrás, chiquitos) y la fila (adelante)
    const orden = [...this.invitados].filter((e) => ['fila', 'pidiendo', 'esperando', 'saliendo'].includes(e.estado)).sort((a, b) => (a.estado === 'esperando' ? 0 : 1) - (b.estado === 'esperando' ? 0 : 1));
    const my = H - BARRA - 96;
    for (const e of orden) {
      const lejos = e.estado === 'esperando';
      const primero = !lejos && Math.abs(e.x - this.puestoFila(0)) < 30;
      this.dibujarInvitado(g, e, e.x, lejos ? piso + 70 : my + 12, lejos ? 190 : primero ? 300 : 250);
    }
    // Mostrador
    g.fillStyle = lineal(g, 0, my, 0, H - BARRA, [[0, '#9a6340'], [1, '#6e4128']]);
    g.fillRect(0, my + 18, W, H - BARRA - my);
    g.fillStyle = lineal(g, 0, my, 0, my + 22, [[0, '#f2e4d4'], [1, '#d6c1ab']]);
    rr(g, -10, my, W + 20, 24, 8);
    g.fill();
    for (let x = 40; x < W; x += 180) {
      g.fillStyle = 'rgba(0,0,0,0.1)';
      g.fillRect(x, my + 34, 120, 40);
    }
    // Campanita y frasco de propinas
    const cx = W * 0.5 - 190;
    g.fillStyle = '#c9a24a';
    g.beginPath();
    g.arc(cx, my + 4, 26, Math.PI, 0);
    g.fill();
    g.fillStyle = '#8a6a2a';
    g.fillRect(cx - 32, my + 2, 64, 6);
    const jx = W - 80;
    g.fillStyle = 'rgba(220,240,255,0.55)';
    rr(g, jx - 30, my - 58, 60, 66, 12);
    g.fill();
    const lleno = Math.min(1, this.propinasDia / 40);
    g.fillStyle = '#f2b52a';
    rr(g, jx - 26, my + 4 - 58 * lleno, 52, 58 * lleno, 8);
    g.fill();
    texto(g, `🪙 ${this.propinasDia}`, jx, my - 76, { tam: 24, color: '#fff', borde: '#6e4128' });
    // Botón de tomar el pedido
    const e = this.invitados.find((i) => i.estado === 'fila' && Math.abs(i.x - this.puestoFila(0)) < 8);
    const pidiendo = this.invitados.find((i) => i.estado === 'pidiendo');
    this.botonTomar = null;
    if (e && !pidiendo) {
      const r = { x: W * 0.5 - 470, y: my - 110, w: 260, h: 74 };
      this.botonTomar = r;
      const lat = 1 + Math.sin(this.reloj * 5) * 0.03;
      g.save();
      g.translate(r.x + r.w / 2, r.y + r.h / 2);
      g.scale(lat, lat);
      g.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
      boton(g, r, { color: '#ffb627' });
      texto(g, '📝 Tomar pedido', r.x + r.w / 2, r.y + r.h / 2 + 2, { tam: 30, color: '#4a2a10' });
      g.restore();
    }
    // Pidiendo: el tiquete se va escribiendo en un globo
    if (pidiendo) {
      // Lo que pide se va escribiendo en el tiquete, de arriba abajo
      const k = Math.min(1, (this.t - pidiendo.tomadoEn) / 0.4);
      const r = { x: W * 0.5 + 150, y: RIEL + 14, w: 244, h: H - RIEL - BARRA - 120 };
      g.save();
      g.globalAlpha = k;
      g.translate(r.x, r.y + r.h);
      g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      g.translate(-r.x, -(r.y + r.h));
      this.papel(g, r);
      texto(g, `#${this.numero + 1} · ${pidiendo.inv.nombre}`, r.x + r.w / 2, r.y + 22, { tam: 19, color: '#8a4a2a', max: r.w - 16 });
      g.beginPath();
      g.rect(r.x, r.y + 36, r.w, (r.h - 36) * Math.min(1, (this.t - pidiendo.tomadoEn) / 1.9));
      g.clip();
      if (pidiendo.pedido) this.receta.dibujarTicket(g, pidiendo.pedido, { x: r.x, y: r.y + 38, w: r.w, h: r.h - 42 }, this);
      g.restore();
    }
    // Globos de lo que dicen
    for (const e2 of this.invitados) {
      if (!e2.frase || !['fila', 'pidiendo', 'esperando'].includes(e2.estado)) continue;
      const lejos = e2.estado === 'esperando';
      this.globo(g, e2.frase.texto, e2.x, lejos ? piso + 70 - 200 : my + 12 - 300);
    }
    if (!this.invitados.some((i) => ['fila', 'pidiendo'].includes(i.estado)) && this.invitados.some((i) => i.estado === 'fuera'))
      texto(g, 'Esperando al próximo invitado…', W * 0.5, my - 60, { tam: 26, color: '#fff', borde: 'rgba(60,30,20,0.7)' });
  }

  private globo(g: G, t: string, x: number, y: number) {
    g.font = '800 22px Nunito, system-ui, sans-serif';
    const w = Math.min(360, g.measureText(t).width + 36);
    const bx = Math.max(10, Math.min(this.W - w - 10, x - w / 2));
    g.fillStyle = 'rgba(255,255,255,0.96)';
    rr(g, bx, y - 50, w, 48, 18);
    g.fill();
    g.beginPath();
    g.moveTo(x - 10, y - 4);
    g.lineTo(x, y + 14);
    g.lineTo(x + 12, y - 4);
    g.fill();
    texto(g, t, bx + w / 2, y - 26, { tam: 22, color: '#4a2a10', max: w - 24 });
  }

  /** Dibuja a un invitado con los pies en (x, y) y alto `h`, respirando. */
  private dibujarInvitado(g: G, e: EnDia, x: number, y: number, h: number) {
    const img = this.spriteDe(e.inv, e.animo);
    if (!img.complete || !img.naturalWidth) return;
    const camina = Math.abs(e.meta - e.x) > 2;
    const resp = camina ? Math.abs(Math.sin(this.reloj * 10)) * 10 : Math.sin(this.reloj * 2.2 + e.llega) * 3;
    const w = (img.naturalWidth / img.naturalHeight) * h;
    sombra(g, x, y, w * 0.42, 16, 0.3);
    g.drawImage(img, x - w / 2, y - h - resp, w, h + resp * 0.3);
    if (e.animo === 'bravo' && e.estado !== 'saliendo') {
      // Vapor de la rabia
      const k = (this.reloj * 1.5) % 1;
      g.globalAlpha = 1 - k;
      texto(g, '💢', x + w * 0.32, y - h * 0.92 - k * 20, { tam: 34 });
      g.globalAlpha = 1;
    }
    if (e.inv.especial === 'pareja' && e.estado !== 'saliendo') texto(g, '💖', x - w * 0.34, y - h * 0.9 + Math.sin(this.reloj * 3) * 6, { tam: 30 });
    if (e.ticket && e.estado === 'esperando') {
      g.fillStyle = '#fff8ea';
      rr(g, x - 24, y - h - 44, 48, 34, 10);
      g.fill();
      texto(g, `#${e.ticket.numero}`, x, y - h - 27, { tam: 20, color: '#8a4a2a' });
    }
  }

  /** Hoja de tiquete (papel con muesca). */
  papel(g: G, r: Rect, resaltado = false) {
    g.save();
    g.shadowColor = resaltado ? 'rgba(255,182,39,0.9)' : 'rgba(60,30,20,0.3)';
    g.shadowBlur = resaltado ? 18 : 8;
    g.shadowOffsetY = 3;
    g.fillStyle = '#fffaf0';
    rr(g, r.x, r.y, r.w, r.h, 8);
    g.fill();
    g.restore();
    g.fillStyle = '#f0e4d2';
    g.fillRect(r.x, r.y, r.w, 6);
    g.strokeStyle = 'rgba(200,170,140,0.35)';
    g.lineWidth = 1;
    for (let y = r.y + 30; y < r.y + r.h - 6; y += 22) {
      g.beginPath();
      g.moveTo(r.x + 8, y);
      g.lineTo(r.x + r.w - 8, y);
      g.stroke();
    }
  }

  private dibujarRiel(g: G) {
    const { W } = this;
    g.fillStyle = lineal(g, 0, 0, 0, RIEL, [[0, '#4a3a33'], [1, '#2e241f']]);
    g.fillRect(0, 0, W, RIEL);
    g.fillStyle = lineal(g, 0, 2, 0, 14, [[0, '#dfe5e8'], [1, '#8e979c']]);
    g.fillRect(0, 2, W, 10);
    this.tickets.forEach((t, i) => {
      const r = this.rectTicket(i);
      const sel = t === this.activo;
      const y = r.y + (sel ? 4 : 0);
      this.papel(g, { ...r, y }, sel);
      g.fillStyle = '#c9ccd0';
      g.fillRect(r.x + r.w / 2 - 12, 2, 24, 14);
      texto(g, `#${t.numero}`, r.x + 24, y + 24, { tam: 20, color: '#8a4a2a' });
      // Carita del invitado
      const img = this.spriteDe(t.inv.inv, 'feliz');
      if (img.complete && img.naturalWidth) {
        g.save();
        elipse(g, r.x + r.w - 28, y + 30, 22, 22);
        g.clip();
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const sw = iw * 0.72, sh = sw;
        g.drawImage(img, iw * 0.14, ih * 0.1, sw, sh, r.x + r.w - 52, y + 6, 48, 48);
        g.restore();
      }
      const v = this.puntajeEspera(t.inv, this.t);
      g.fillStyle = v >= 70 ? '#5cc26a' : v >= 40 ? '#f2b52a' : '#e8434f';
      rr(g, r.x + 10, y + r.h - 20, (r.w - 20) * (v / 100), 10, 5);
      g.fill();
      texto(g, t.inv.inv.nombre.split(/[ ,]/)[0], r.x + r.w / 2, y + 62, { tam: 16, color: '#6a4a3a', peso: 700, max: r.w - 12 });
    });
    if (!this.tickets.length) texto(g, 'Aquí se cuelgan los pedidos', 24, RIEL / 2 + 6, { tam: 20, color: 'rgba(255,255,255,0.45)', alinear: 'left', peso: 700 });
    // Día y propinas a la derecha, junto a la carita del chef (cambia con lo que pasa)
    const hechos = this.invitados.filter((e) => ['comiendo', 'saliendo', 'ido'].includes(e.estado)).length;
    texto(g, `Día ${this.dia} · ${hechos}/${this.invitados.length}`, W - 190, 38, { tam: 22, color: '#fff', alinear: 'right' });
    texto(g, `🪙 ${this.propinasDia}`, W - 190, 72, { tam: 22, color: '#ffd46b', alinear: 'right' });
    const pose = this.reloj < this.caraChef.hasta ? this.caraChef.pose : 'concentrado';
    const img = this.img(`./cocina/${this.rol}_chef_${pose}.webp`);
    g.fillStyle = '#fff3e4';
    elipse(g, W - 142, RIEL / 2, 44, 44);
    g.fill();
    if (img.complete && img.naturalWidth) {
      g.save();
      elipse(g, W - 142, RIEL / 2, 40, 40);
      g.clip();
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const w = 124, h = (ih / iw) * w;
      g.drawImage(img, W - 142 - w / 2, RIEL / 2 - h * 0.5, w, h);
      g.restore();
    }
  }

  private dibujarBarra(g: G) {
    const { W, H } = this;
    g.fillStyle = lineal(g, 0, H - BARRA, 0, H, [[0, '#3a2c26'], [1, '#231a16']]);
    g.fillRect(0, H - BARRA, W, BARRA);
    const nombres = [{ nombre: 'Pedidos', icono: '🧾' }, ...this.estaciones.map((e) => ({ nombre: e.nombre, icono: e.icono }))];
    const hayFila = this.invitados.some((e) => e.estado === 'fila');
    this.pestanas().forEach((r, i) => {
      const act = i === this.actual;
      const alerta = i === 0 ? hayFila : !!this.estaciones[i - 1].alerta?.();
      boton(g, r, { color: act ? '#ffb627' : '#fff3e4', hundido: act, radio: 18 });
      texto(g, `${nombres[i].icono} ${nombres[i].nombre}`, r.x + r.w / 2, r.y + r.h / 2 + (act ? 4 : 0), { tam: 25, color: '#4a2a10', max: r.w - 16 });
      if (alerta && !act) {
        const k = 0.6 + 0.4 * Math.sin(this.reloj * 8);
        g.fillStyle = `rgba(232,67,79,${k})`;
        elipse(g, r.x + r.w - 10, r.y + 8, 11, 11);
        g.fill();
      }
    });
  }

  private dibujarTicketGrande(g: G) {
    const r = this.cajaTicket;
    g.fillStyle = 'rgba(40,30,25,0.18)';
    rr(g, r.x - 4, r.y - 2, r.w + 8, r.h + 6, 12);
    g.fill();
    if (!this.activo) {
      this.papel(g, r);
      texto(g, 'Toca un pedido', r.x + r.w / 2, r.y + r.h / 2 - 20, { tam: 24, color: '#9a7a68' });
      texto(g, 'del riel de arriba', r.x + r.w / 2, r.y + r.h / 2 + 14, { tam: 24, color: '#9a7a68' });
      return;
    }
    this.papel(g, r);
    texto(g, `#${this.activo.numero} · ${this.activo.inv.inv.nombre}`, r.x + r.w / 2, r.y + 22, { tam: 19, color: '#8a4a2a', max: r.w - 16 });
    this.receta.dibujarTicket(g, this.activo.pedido, { x: r.x, y: r.y + 38, w: r.w, h: r.h - 42 }, this);
  }

  private dibujarPista(g: G, t: string) {
    g.font = '800 24px Nunito, system-ui, sans-serif';
    const w = Math.min(this.W - 40, g.measureText(t).width + 50);
    const x = (this.W - w) / 2, y = RIEL + 12;
    g.fillStyle = 'rgba(40,24,16,0.85)';
    rr(g, x, y, w, 46, 23);
    g.fill();
    texto(g, t, this.W / 2, y + 24, { tam: 24, color: '#fff3d6', max: w - 30 });
  }

  private dibujarJuicio(g: G, j: Juicio) {
    const { W, H } = this;
    const a = Math.min(1, j.t / 0.3);
    g.fillStyle = `rgba(30,18,12,${0.62 * a})`;
    g.fillRect(0, 0, W, H);
    const pw = Math.min(W - 60, 1180), ph = H - 80;
    const px = (W - pw) / 2, py = 40 + (1 - a) * 60;
    g.fillStyle = lineal(g, 0, py, 0, py + ph, [[0, '#fff8ee'], [1, '#f3e2cc']]);
    rr(g, px, py, pw, ph, 28);
    g.fill();
    // El plato
    const cx = px + pw * 0.22, cy = py + ph * 0.55;
    this.receta.dibujarPlato(g, j.ticket, cx, cy, 1, this);
    texto(g, j.ticket.inv.inv.nombre, cx, py + 44, { tam: 28, color: '#6a3a22', max: pw * 0.4 });
    // Las barras de cada parte
    const bx = px + pw * 0.42, bw = pw * 0.24;
    j.cats.forEach((c, i) => {
      const k = Math.max(0, Math.min(1, (j.t - 0.4 - i * 0.3) / 0.5));
      const y = py + 70 + i * 74;
      texto(g, c.nombre, bx, y, { tam: 24, color: '#5a3a28', alinear: 'left' });
      g.fillStyle = '#e8d8c6';
      rr(g, bx, y + 18, bw, 24, 12);
      g.fill();
      const v = c.valor * k;
      g.fillStyle = v >= 70 ? '#5cc26a' : v >= 40 ? '#f2b52a' : '#e8434f';
      rr(g, bx, y + 18, Math.max(24, bw * (v / 100)), 24, 12);
      g.fill();
      texto(g, `${Math.round(v)}%`, bx + bw + 14, y + 30, { tam: 24, color: '#5a3a28', alinear: 'left' });
    });
    // Total y propina
    const k = Math.max(0, Math.min(1, (j.t - 0.6 - j.cats.length * 0.3) / 0.5));
    if (k > 0) {
      const ty = py + ph - 80;
      texto(g, `${Math.round(j.total * k)}%`, bx + bw * 0.3, ty, { tam: 64 * (0.8 + 0.2 * k), color: j.total >= 70 ? '#2f8a3a' : j.total >= 50 ? '#c07a10' : '#c0303c' });
      texto(g, `🪙 +${j.propina}`, bx + bw * 0.95, ty, { tam: 40, color: '#b07a10' });
    }
    // El invitado reacciona
    const img = this.spriteDe(j.ticket.inv.inv, k > 0 ? j.animo : 'espera');
    const ix = px + pw * 0.87, iy = py + ph - 30;
    if (img.complete && img.naturalWidth) {
      const h = ph * 0.64 * (k > 0 && j.animo === 'encantado' ? 1 + Math.abs(Math.sin(j.t * 6)) * 0.04 : 1);
      const w = (img.naturalWidth / img.naturalHeight) * h;
      sombra(g, ix, iy, w * 0.4, 18, 0.3);
      g.drawImage(img, ix - w / 2, iy - h, w, h);
    }
    if (k > 0) {
      this.globo(g, j.frase, ix, py + 90);
      if (j.t < 3.5 && j.total >= 90 && Math.random() < 0.3) this.chispas(ix, py + 200, j.ticket.inv.inv.especial === 'pareja' ? '#ff6b8f' : '#ffd23f', 2, j.ticket.inv.inv.especial === 'pareja' ? 'corazon' : 'estrella');
    }
    if (j.t > 2.6) texto(g, 'Toca para seguir', W / 2, py + ph - 20, { tam: 20, color: '#9a7a68', peso: 700 });
  }

  /** Para las pruebas. */
  probar(que: 'llegar' | 'tomar' | 'fin', v = 0) {
    if (que === 'llegar') for (const e of this.invitados) if (e.estado === 'fuera') e.llega = Math.min(e.llega, this.t + v);
    if (que === 'tomar') {
      const e = this.invitados.find((i) => i.estado === 'fila');
      if (e) {
        e.x = this.puestoFila(0);
        this.tomarPedido(e);
        this.colgarTicket(e);
      }
    }
    if (que === 'fin') {
      for (const e of this.invitados) e.estado = 'ido';
      if (!this.puntajes.length) this.puntajes.push(80);
    }
  }
}

/** Abre la cocina con la receta; al volver a la casa se resuelve. */
export function abrirCocina(receta: Receta, o: OpcionesCocina): Promise<void> {
  return new Promise((listo) => {
    const m = new Motor(receta, o, listo);
    cocina.actual = m;
    (window as any).__cocinaMotor = m;
    m.empezar();
  });
}
export const cocina: { actual: Motor | null } = { actual: null };
