// La simulación de una pelea 1 contra 1 (60 pasos por segundo, en metros): caminar, saltar (doble salto de quien lo
// tenga), agacharse, tapar (atrás, o atrás y abajo para lo bajo), golpes con arranque/activo/recuperación, cadenas de
// combos que se cancelan, agarres (que se escapan apretando agarre a tiempo), especiales y súper, retroceso estilo
// Smash (con menos vida se vuela más lejos), rebote en la pared, malabares con límite, mareo cuando se llena el
// aguante, rondas al mejor de 3, tiempo y K.O. con cámara lenta. Lo que la vista debe mostrar o sonar sale en
// `eventos` (numerados, para mandarlos por la red). No sabe nada de three.js ni del DOM.
import { DT, NADA, PASOS, type DefLuchador, type Efecto, type Entrada, type Golpe, type IdGolpe } from './tipos';

export type Estado =
  | 'entrada' | 'quieto' | 'caminar' | 'agachado' | 'saltoPre' | 'aire' | 'aterrizaje' | 'ataque' | 'golpeado' | 'bloqueo' | 'volando' | 'suelo'
  | 'levantarse' | 'agarrando' | 'agarrado' | 'mareado' | 'ko' | 'victoria' | 'derrota' | 'rafaga' | 'contraataque';

export type Fase = 'presentacion' | 'cuenta' | 'pelea' | 'ko' | 'tiempo' | 'finRonda' | 'fin';

type Boton = 'a' | 'b' | 'e' | 'g' | 's';
const BOTONES: Boton[] = ['a', 'b', 'e', 'g', 's'];
/** Cuadros que se recuerda un botón apretado antes de poder usarlo (los combos se sienten justos). */
const MEMORIA = 7;
const GRAVEDAD = 38;
const GRAVEDAD_VUELO = 27;
export const BARRA_MAX = 1000;
const TIEMPO_RONDA = 60;
const ANCHO = 0.38;
/** Límite de golpes en el aire antes de que ya no se pueda seguir el malabar. */
const MALABAR = 7;

export interface Peleador {
  i: number;
  def: DefLuchador;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Hacia dónde mira: 1 derecha, -1 izquierda. */
  lado: number;
  suelo: boolean;
  vida: number;
  barra: number;
  /** Aturdimiento acumulado (si pasa del aguante, se marea). */
  aturd: number;
  sinGolpe: number;
  estado: Estado;
  /** Cuadros en el estado actual y cuánto dura (los que tienen tiempo). */
  t: number;
  dur: number;
  golpe: Golpe | null;
  /** El golpe actual ya pegó (o lo taparon): se puede cancelar. */
  pego: boolean;
  /** Cuántas veces pegó este golpe (los de varios golpes). */
  veces: number;
  /** Golpes seguidos que va recibiendo (el combo del otro). */
  combo: number;
  invul: number;
  saltos: number;
  armadura: number;
  /** Cae tumbado al tocar el piso (si no, cae de pie). */
  caeTumbado: boolean;
  /** Con quién está agarrado (el otro). */
  agarre: number;
  /** Se acabó el aguante: al terminar el aturdimiento se marea. */
  mareoPendiente: boolean;
  rondas: number;
  entrada: Entrada;
  previo: Entrada;
  buffer: Record<Boton, number>;
  /** Quién ganó la ronda (para la pose del final). */
  ganoRonda: boolean;
  /** Para la vista: cuándo recibió el último golpe (sacudida del muñeco) y la frase que toca. */
  ultimoGolpe: number;
  /** Daño del combo que va recibiendo (para el letrero). */
  comboDano: number;
  ko: boolean;
}

export type TipoProy = 'bala' | 'trampa' | 'rayo' | 'lluvia' | 'caida' | 'ola';
export interface Proyectil {
  id: number;
  dueno: number;
  tipo: TipoProy;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lado: number;
  t: number;
  vida: number;
  g: Golpe;
  r: number;
  alto: number;
  golpes: number;
  cada: number;
  efecto: Efecto;
  muerto?: boolean;
}

export type Evento =
  | { n: number; k: 'golpe'; x: number; y: number; fuerza: number; tapado: boolean; efecto: Efecto; quien: number; combo: number }
  | { n: number; k: 'anuncio'; que: 'ronda' | 'pelea' | 'ko' | 'tiempo' | 'empate' | 'perfecto' | 'doble' | 'gana' | 'presentacion'; ronda?: number; quien?: number }
  | { n: number; k: 'frase'; quien: number; que: 'entrada' | 'especial' | 'super' | 'victoria' | 'derrota' }
  | { n: number; k: 'super'; quien: number }
  | { n: number; k: 'especial'; quien: number }
  | { n: number; k: 'salto' | 'aterrizo' | 'tumbado' | 'mareo' | 'escape' | 'whoosh' | 'contra' | 'niebla' | 'agarre'; quien: number; x: number; y: number }
  | { n: number; k: 'pared'; quien: number; x: number; y: number }
  | { n: number; k: 'choque' | 'estalla'; x: number; y: number; efecto: Efecto };

/** Un evento antes de numerarlo. */
export type SinNumero<T> = T extends unknown ? Omit<T, 'n'> : never;

export interface OpcionesSim {
  luchadores: [DefLuchador, DefLuchador];
  borde: number;
  semilla?: number;
  /** Sin presentación (rondas siguientes, pruebas). */
  sinPresentacion?: boolean;
  /** Rondas para ganar (2 = al mejor de 3). */
  rondasParaGanar?: number;
  /** Práctica: la vida se recupera sola y no hay tiempo. */
  practica?: boolean;
}

export class Sim {
  L: [Peleador, Peleador];
  P: Proyectil[] = [];
  fase: Fase = 'presentacion';
  faseT = 0;
  ronda = 1;
  /** Cuadros que le quedan a la ronda. */
  reloj = TIEMPO_RONDA * PASOS;
  /** Pausa corta en cada golpe (el «peso» del impacto). */
  pausaGolpe = 0;
  /** La pausa de la súper (la cámara se acerca a quien la lanza). */
  pausaSuper = 0;
  superDe = -1;
  /** Cuadros de cámara lenta (el K.O.). */
  lento = 0;
  ganador = -1;
  /** Quién ganó cada ronda (-1 empate). */
  historial: number[] = [];
  eventos: Evento[] = [];
  private nEvento = 0;
  private nProy = 0;
  private azarS: number;
  pasos = 0;
  readonly borde: number;
  readonly paraGanar: number;
  readonly practica: boolean;

  constructor(public o: OpcionesSim) {
    this.borde = o.borde;
    this.paraGanar = o.rondasParaGanar ?? 2;
    this.practica = !!o.practica;
    this.azarS = (o.semilla ?? 1234) >>> 0;
    this.L = [this.nuevo(0, o.luchadores[0]), this.nuevo(1, o.luchadores[1])];
    this.colocar();
    if (o.sinPresentacion) this.empezarCuenta();
    else {
      this.fase = 'presentacion';
      this.faseT = 0;
      this.evento({ k: 'anuncio', que: 'presentacion' });
      for (const p of this.L) this.poner(p, 'entrada', 150);
    }
  }

  private nuevo(i: number, def: DefLuchador): Peleador {
    return {
      i, def, x: 0, y: 0, vx: 0, vy: 0, lado: i === 0 ? 1 : -1, suelo: true, vida: def.vida, barra: 0, aturd: 0, sinGolpe: 0, estado: 'quieto', t: 0, dur: 0,
      golpe: null, pego: false, veces: 0, combo: 0, invul: 0, saltos: 0, armadura: 0, caeTumbado: false, agarre: -1, mareoPendiente: false, rondas: 0,
      entrada: { ...NADA }, previo: { ...NADA }, buffer: { a: 0, b: 0, e: 0, g: 0, s: 0 }, ganoRonda: false, ultimoGolpe: -99, comboDano: 0, ko: false,
    };
  }

  azar() {
    this.azarS = (this.azarS + 0x6d2b79f5) >>> 0;
    let t = this.azarS;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  evento(e: SinNumero<Evento>) {
    this.eventos.push({ ...(e as Evento), n: ++this.nEvento });
    if (this.eventos.length > 80) this.eventos.splice(0, this.eventos.length - 80);
  }

  /** Eventos nuevos desde el número `desde`. */
  eventosDesde(desde: number) {
    return this.eventos.filter((e) => e.n > desde);
  }
  get ultimoEvento() {
    return this.nEvento;
  }

  private colocar() {
    const [a, b] = this.L;
    a.x = -2.1;
    b.x = 2.1;
    for (const p of this.L) {
      p.y = 0;
      p.vx = p.vy = 0;
      p.suelo = true;
      p.lado = p.i === 0 ? 1 : -1;
      p.vida = p.def.vida;
      p.aturd = 0;
      p.combo = 0;
      p.comboDano = 0;
      p.invul = 0;
      p.agarre = -1;
      p.mareoPendiente = false;
      p.ganoRonda = false;
      p.ko = false;
      p.golpe = null;
      p.buffer = { a: 0, b: 0, e: 0, g: 0, s: 0 };
      this.poner(p, 'quieto');
    }
    this.P = [];
  }

  private empezarCuenta() {
    this.fase = 'cuenta';
    this.faseT = 0;
    this.reloj = TIEMPO_RONDA * PASOS;
    const final = this.L.every((p) => p.rondas === this.paraGanar - 1);
    this.evento({ k: 'anuncio', que: 'ronda', ronda: final ? 0 : this.ronda });
  }

  private poner(p: Peleador, e: Estado, dur = 0) {
    p.estado = e;
    p.t = 0;
    p.dur = dur;
    if (e !== 'ataque') {
      p.golpe = null;
      p.pego = false;
      p.veces = 0;
      p.armadura = 0;
    }
  }

  otro(p: Peleador) {
    return this.L[1 - p.i];
  }

  /** Un paso de 1/60 s con lo que aprieta cada uno. */
  paso(entradas: [Entrada, Entrada]) {
    this.pasos++;
    for (const p of this.L) this.leer(p, entradas[p.i]);
    if (this.lento > 0) this.lento--;
    if (this.pausaGolpe > 0) {
      this.pausaGolpe--;
      return;
    }
    if (this.pausaSuper > 0) {
      this.pausaSuper--;
      return;
    }
    for (const p of this.L) this.olvidar(p);
    this.faseT++;
    this.fases();
    const libres = this.fase === 'pelea' || this.fase === 'ko' || this.fase === 'tiempo' || this.fase === 'finRonda';
    for (const p of this.L) this.pensar(p, libres && this.fase === 'pelea');
    for (const p of this.L) this.moverse(p);
    this.separar();
    if (this.fase === 'pelea' || this.fase === 'ko') {
      for (const p of this.L) this.pegar(p);
      this.proyectiles();
    }
    for (const p of this.L) this.temporizar(p);
  }

  // ------------------------------------------------------------------------------------------------ Entrada
  private leer(p: Peleador, e: Entrada) {
    p.previo = p.entrada;
    p.entrada = e;
    for (const b of BOTONES) if (e[b] && !p.previo[b]) p.buffer[b] = MEMORIA + 1;
  }

  /** Lo recordado se va olvidando (solo cuando el tiempo corre: en las pausas de golpe se guarda para el combo). */
  private olvidar(p: Peleador) {
    for (const b of BOTONES) if (p.buffer[b] > 0) p.buffer[b]--;
  }

  private tomar(p: Peleador, b: Boton) {
    if (p.buffer[b] > 0) {
      p.buffer[b] = 0;
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------------------------------------ Rondas
  private fases() {
    const [a, b] = this.L;
    switch (this.fase) {
      case 'presentacion':
        if (this.faseT === 2) this.evento({ k: 'frase', quien: 0, que: 'entrada' });
        if (this.faseT === 75) this.evento({ k: 'frase', quien: 1, que: 'entrada' });
        if (this.faseT >= 150) {
          for (const p of this.L) this.poner(p, 'quieto');
          this.empezarCuenta();
        }
        break;
      case 'cuenta':
        if (this.faseT === 70) this.evento({ k: 'anuncio', que: 'pelea' });
        if (this.faseT >= 100) {
          this.fase = 'pelea';
          this.faseT = 0;
        }
        break;
      case 'pelea':
        if (!this.practica && this.reloj > 0) this.reloj--;
        if (this.practica) {
          for (const p of this.L) if (p.sinGolpe > 120 && p.vida < p.def.vida) p.vida = Math.min(p.def.vida, p.vida + 10);
        }
        if (!this.practica && this.reloj <= 0) {
          this.fase = 'tiempo';
          this.faseT = 0;
          this.evento({ k: 'anuncio', que: 'tiempo' });
        }
        break;
      case 'ko': {
        const caido = this.L.filter((p) => p.ko);
        if (this.faseT > 70 && caido.every((p) => p.estado === 'ko')) this.cerrarRonda();
        break;
      }
      case 'tiempo':
        if (this.faseT === 60) {
          const fa = a.vida / a.def.vida, fb = b.vida / b.def.vida;
          const g = Math.abs(fa - fb) < 0.001 ? -1 : fa > fb ? 0 : 1;
          for (const p of this.L) if (p.i !== g && g >= 0) this.poner(p, 'derrota', 999);
          this.cerrarRonda(g);
        }
        break;
      case 'finRonda':
        if (this.faseT >= 150) {
          if (this.L.some((p) => p.rondas >= this.paraGanar) || this.ronda >= 5) {
            this.fase = 'fin';
            this.faseT = 0;
            this.ganador = a.rondas === b.rondas ? -1 : a.rondas > b.rondas ? 0 : 1;
          } else {
            this.ronda++;
            this.colocar();
            this.empezarCuenta();
          }
        }
        break;
      case 'fin':
        break;
    }
  }

  private cerrarRonda(g?: number) {
    if (g === undefined) {
      const vivos = this.L.filter((p) => !p.ko);
      g = vivos.length === 1 ? vivos[0].i : -1;
    }
    this.historial.push(g);
    this.fase = 'finRonda';
    this.faseT = 0;
    if (g < 0) {
      this.evento({ k: 'anuncio', que: this.L.every((p) => p.ko) ? 'doble' : 'empate' });
      return;
    }
    const w = this.L[g];
    w.rondas++;
    w.ganoRonda = true;
    this.poner(w, 'victoria', 999);
    w.vx = 0;
    const perfecto = w.vida >= w.def.vida;
    if (perfecto) this.evento({ k: 'anuncio', que: 'perfecto', quien: g });
    if (w.rondas >= this.paraGanar) {
      this.evento({ k: 'frase', quien: g, que: 'victoria' });
      this.evento({ k: 'anuncio', que: 'gana', quien: g });
    } else this.evento({ k: 'frase', quien: g, que: 'victoria' });
    const l = this.otro(w);
    if (!l.ko && l.estado !== 'derrota') this.poner(l, 'derrota', 999);
  }

  // ------------------------------------------------------------------------------------------------ Decidir
  private libre(p: Peleador) {
    return p.estado === 'quieto' || p.estado === 'caminar' || p.estado === 'agachado';
  }

  private pensar(p: Peleador, puede: boolean) {
    const o = this.otro(p);
    const e = p.entrada;
    // Mirar al otro (en el piso y sin estar ocupado)
    if (p.suelo && (this.libre(p) || p.estado === 'aterrizaje' || p.estado === 'bloqueo') && Math.abs(o.x - p.x) > 0.05) p.lado = o.x > p.x ? 1 : -1;
    if (!puede) {
      if (this.libre(p)) {
        p.vx = 0;
        if (p.estado !== 'quieto') this.poner(p, 'quieto');
      }
      return;
    }
    const adelante = e.h === p.lado;
    if (this.libre(p) && p.suelo) {
      if (this.empezarAtaque(p)) return;
      if (e.v > 0) {
        this.poner(p, 'saltoPre', 4);
        p.vx = e.h * p.def.velocidad * 1.12;
        return;
      }
      if (e.v < 0) {
        if (p.estado !== 'agachado') this.poner(p, 'agachado');
        p.vx = 0;
        return;
      }
      if (e.h !== 0) {
        if (p.estado !== 'caminar') this.poner(p, 'caminar');
        p.vx = e.h * p.def.velocidad * (adelante ? 1 : 0.78);
        return;
      }
      if (p.estado !== 'quieto') this.poner(p, 'quieto');
      p.vx = 0;
      return;
    }
    if (p.estado === 'aire') {
      // Doble salto (quien lo tenga) y golpes en el aire
      if (p.def.dobleSalto && p.saltos < 2 && e.v > 0 && p.previo.v <= 0) {
        p.saltos = 2;
        p.vy = p.def.salto * 0.85;
        p.vx = e.h * p.def.velocidad * 1.05;
        this.evento({ k: 'salto', quien: p.i, x: p.x, y: p.y });
        return;
      }
      if (this.tomar(p, 'b')) return this.atacar(p, 'aereoFuerte');
      if (this.tomar(p, 'a')) return this.atacar(p, 'aereo');
      // Un poquito de control en el aire
      if (e.h !== 0) p.vx += (e.h * p.def.velocidad * 1.1 - p.vx) * 0.04;
      return;
    }
    if (p.estado === 'ataque' && p.golpe) this.cancelar(p);
  }

  /** Lo que se puede empezar desde el piso (en orden de prioridad). */
  private empezarAtaque(p: Peleador): boolean {
    const e = p.entrada;
    if (p.buffer.s > 0 && p.barra >= BARRA_MAX) {
      this.tomar(p, 's');
      this.lanzarSuper(p);
      return true;
    }
    if (p.buffer.e > 0 && this.especialPosible(p)) {
      this.tomar(p, 'e');
      this.atacar(p, 'especial');
      return true;
    }
    if (this.tomar(p, 'g')) {
      this.atacar(p, 'agarre');
      return true;
    }
    if (this.tomar(p, 'b')) {
      this.atacar(p, e.v < 0 ? 'fuerteAbajo' : e.v > 0 ? 'fuerteArriba' : 'fuerte');
      return true;
    }
    if (this.tomar(p, 'a')) {
      this.atacar(p, e.v < 0 ? 'rapidoAbajo' : 'rapido1');
      return true;
    }
    return false;
  }

  private especialPosible(p: Peleador) {
    const g = p.def.golpes.especial;
    if (g.especial === 'proyectil') return !this.P.some((x) => x.dueno === p.i && x.tipo === 'bala');
    return true;
  }

  /** Cancelar un golpe en otro (combos): si pegó o lo taparon, y en la cadena de los rápidos aunque no pegue. */
  private cancelar(p: Peleador) {
    const g = p.golpe!;
    const fin = g.arranque + g.activo;
    const enVentana = p.t >= g.arranque && p.t <= fin + 6;
    if (!enVentana || !g.cancela) return;
    const cadena = g.id === 'rapido1' || g.id === 'rapido2' || g.id === 'rapidoAbajo';
    const ok = (id: IdGolpe) => g.cancela!.includes(id) && (p.pego || (cadena && (id === 'rapido2' || id === 'rapido3' || id === 'rapidoAbajo')));
    const e = p.entrada;
    if (p.buffer.s > 0 && p.barra >= BARRA_MAX && ok('super') && p.suelo) {
      this.tomar(p, 's');
      return this.lanzarSuper(p);
    }
    if (p.buffer.e > 0 && ok('especial') && p.suelo && this.especialPosible(p)) {
      this.tomar(p, 'e');
      return this.atacar(p, 'especial');
    }
    if (p.buffer.b > 0) {
      const id: IdGolpe = !p.suelo ? 'aereoFuerte' : e.v < 0 ? 'fuerteAbajo' : e.v > 0 ? 'fuerteArriba' : 'fuerte';
      if (ok(id)) {
        this.tomar(p, 'b');
        return this.atacar(p, id);
      }
    }
    if (p.buffer.a > 0 && p.suelo) {
      const sig: IdGolpe | null = g.id === 'rapido1' ? 'rapido2' : g.id === 'rapido2' ? 'rapido3' : g.id === 'rapidoAbajo' ? 'rapidoAbajo' : null;
      if (sig && ok(sig) && p.t >= fin - 1) {
        this.tomar(p, 'a');
        return this.atacar(p, sig);
      }
    }
  }

  atacar(p: Peleador, id: IdGolpe) {
    const g = p.def.golpes[id];
    this.poner(p, 'ataque', g.arranque + g.activo + g.recup);
    p.golpe = g;
    p.pego = false;
    p.veces = 0;
    p.armadura = g.armadura ?? 0;
    if (g.invul) p.invul = Math.max(p.invul, g.invul);
    if (p.suelo) p.vx = 0;
    if (id === 'especial') {
      this.evento({ k: 'especial', quien: p.i });
      this.evento({ k: 'frase', quien: p.i, que: 'especial' });
    }
    if (g.peso === 'fuerte' && id !== 'especial') this.evento({ k: 'whoosh', quien: p.i, x: p.x, y: p.y });
  }

  private lanzarSuper(p: Peleador) {
    p.barra = 0;
    this.atacar(p, 'super');
    p.invul = Math.max(p.invul, (p.golpe!.invul ?? 0) + 6);
    this.pausaSuper = 42;
    this.superDe = p.i;
    this.evento({ k: 'super', quien: p.i });
    this.evento({ k: 'frase', quien: p.i, que: 'super' });
  }

  // ------------------------------------------------------------------------------------------------ Mover
  private moverse(p: Peleador) {
    p.t++;
    if (p.invul > 0) p.invul--;
    const o = this.otro(p);
    const g = p.golpe;
    switch (p.estado) {
      case 'saltoPre':
        if (p.t >= p.dur) {
          p.vy = p.def.salto;
          p.suelo = false;
          p.saltos = 1;
          this.poner(p, 'aire');
          this.evento({ k: 'salto', quien: p.i, x: p.x, y: p.y });
        }
        break;
      case 'ataque':
        if (g) this.avanzarAtaque(p, g, o);
        break;
      case 'agarrando':
        this.avanzarAgarre(p, o);
        break;
      case 'rafaga':
        this.avanzarRafaga(p, o);
        break;
      case 'agarrado':
        p.vx = p.vy = 0;
        break;
      case 'golpeado':
      case 'bloqueo':
        p.vx *= 0.86;
        if (p.t >= p.dur) {
          if (p.estado === 'golpeado' && p.mareoPendiente) this.marear(p, 110);
          else this.poner(p, p.entrada.v < 0 ? 'agachado' : 'quieto');
        }
        break;
      case 'mareado':
        p.vx *= 0.8;
        if (p.t >= p.dur) {
          p.aturd = 0;
          this.poner(p, 'quieto');
        }
        break;
      case 'aterrizaje':
        p.vx *= 0.7;
        if (p.t >= p.dur) this.poner(p, 'quieto');
        break;
      case 'suelo':
        p.vx *= 0.8;
        if (p.t >= p.dur && !p.ko) {
          this.poner(p, 'levantarse', 18);
          p.invul = 22;
        }
        break;
      case 'levantarse':
        if (p.t >= p.dur) this.poner(p, 'quieto');
        break;
      case 'contraataque':
        p.vx *= 0.7;
        if (p.t >= p.dur) this.poner(p, 'quieto');
        break;
      case 'entrada':
      case 'victoria':
      case 'derrota':
      case 'ko':
        p.vx *= 0.85;
        break;
      default:
        break;
    }
    // Física
    if (!p.suelo || p.y > 0) {
      const grav = p.estado === 'volando' ? GRAVEDAD_VUELO * (1 + Math.min(p.combo, 10) * 0.05) : GRAVEDAD;
      p.vy -= grav * DT;
    }
    if (p.estado !== 'agarrado') {
      p.x += p.vx * DT;
      p.y += p.vy * DT;
    }
    // Paredes (y que no se separen más de lo que cabe en la cámara)
    const lim = this.borde - ANCHO;
    if (p.x < -lim || p.x > lim) {
      const dir = p.x < -lim ? 1 : -1;
      p.x = Math.max(-lim, Math.min(lim, p.x));
      if (p.estado === 'volando' && Math.abs(p.vx) > 6.5 && !p.ko) {
        p.vx = dir * Math.abs(p.vx) * 0.32;
        p.vy = Math.max(p.vy, 5);
        this.evento({ k: 'pared', quien: p.i, x: p.x, y: p.y + 1 });
        this.pausaGolpe = Math.max(this.pausaGolpe, 4);
      } else if (Math.sign(p.vx) === -dir) p.vx = 0;
    }
    const maxSep = 11.5;
    if (Math.abs(p.x - o.x) > maxSep && p.suelo) p.x = o.x + Math.sign(p.x - o.x) * maxSep;
    // Piso
    if (p.y <= 0 && (p.vy <= 0 || p.suelo)) {
      const venia = !p.suelo;
      p.y = 0;
      p.vy = 0;
      p.suelo = true;
      p.saltos = 0;
      if (venia) this.aterrizar(p);
    }
  }

  private aterrizar(p: Peleador) {
    if (p.estado === 'volando') {
      if (p.ko) {
        this.poner(p, 'ko', 999);
        this.evento({ k: 'tumbado', quien: p.i, x: p.x, y: 0 });
      } else if (p.caeTumbado) {
        this.poner(p, 'suelo', 34);
        p.invul = 60;
        this.evento({ k: 'tumbado', quien: p.i, x: p.x, y: 0 });
      } else this.poner(p, 'aterrizaje', 9);
      p.vx *= 0.4;
      return;
    }
    if (p.estado === 'ataque' && p.golpe && (p.golpe.id === 'aereo' || p.golpe.id === 'aereoFuerte' || p.golpe.especial === 'voladora')) {
      const voladora = p.golpe.especial === 'voladora';
      this.poner(p, 'aterrizaje', voladora ? 12 : p.pego ? 3 : 6);
      p.vx = 0;
      this.evento({ k: 'aterrizo', quien: p.i, x: p.x, y: 0 });
      return;
    }
    if (p.estado === 'aire' || p.estado === 'saltoPre') {
      this.poner(p, 'aterrizaje', 3);
      p.vx = 0;
      this.evento({ k: 'aterrizo', quien: p.i, x: p.x, y: 0 });
    }
  }

  /** Que no se atraviesen (salvo saltando por encima). */
  private separar() {
    const [a, b] = this.L;
    if (a.estado === 'agarrado' || b.estado === 'agarrado' || a.ko || b.ko) return;
    const dy = Math.abs(a.y - b.y);
    if (dy > 1.25) return;
    const d = b.x - a.x;
    const min = ANCHO * 2;
    if (Math.abs(d) >= min) return;
    const s = d === 0 ? (a.lado > 0 ? 1 : -1) : Math.sign(d);
    const falta = (min - Math.abs(d)) / 2;
    const lim = this.borde - ANCHO;
    a.x -= s * falta;
    b.x += s * falta;
    // Contra la pared, empuja solo el que tiene espacio
    if (Math.abs(a.x) > lim) {
      const exceso = Math.abs(a.x) - lim;
      a.x = Math.sign(a.x) * lim;
      b.x += Math.sign(a.x) * -exceso;
    }
    if (Math.abs(b.x) > lim) {
      const exceso = Math.abs(b.x) - lim;
      b.x = Math.sign(b.x) * lim;
      a.x += Math.sign(b.x) * -exceso;
    }
  }

  // ------------------------------------------------------------------------------------------------ Los golpes
  private fasesGolpe(p: Peleador, g: Golpe) {
    return { carga: p.t < g.arranque, activo: p.t >= g.arranque && p.t < g.arranque + g.activo };
  }

  private avanzarAtaque(p: Peleador, g: Golpe, o: Peleador) {
    const { carga, activo } = this.fasesGolpe(p, g);
    if (p.suelo) {
      if ((carga || activo) && g.avance && g.especial !== 'voladora') p.vx = p.lado * g.avance * (activo ? 1 : 0.35);
      else p.vx *= 0.75;
    }
    if (p.t === g.arranque) this.alActivar(p, g, o);
    // La cuerda se va estirando
    if (p.estado !== 'ataque') return;
    if (p.t >= p.dur) {
      if (p.suelo) this.poner(p, p.entrada.v < 0 ? 'agachado' : 'quieto');
      else this.poner(p, 'aire');
    }
  }

  /** Lo que pasa el primer cuadro activo de cada golpe especial. */
  private alActivar(p: Peleador, g: Golpe, o: Peleador) {
    const pr = g.proy ?? {};
    if (g.especial === 'proyectil') {
      this.disparar(p, 'bala', p.x + p.lado * 0.75, pr.alto ?? 1.2, p.lado * (pr.vel ?? 8), pr.vy ?? 0, g, { vida: pr.vida ?? 120, r: pr.radio ?? 0.32 });
    } else if (g.especial === 'trampa') {
      for (const x of this.P) if (x.dueno === p.i && x.tipo === 'trampa') x.muerto = true;
      const tx = Math.max(-this.borde + 0.6, Math.min(this.borde - 0.6, p.x + p.lado * (pr.alcance ?? 2.4)));
      this.disparar(p, 'trampa', tx, 0, 0, 0, g, { vida: pr.vida ?? 480, r: pr.radio ?? 0.45 });
    } else if (g.especial === 'niebla') {
      const destino = o.x - o.lado * 1.05;
      const lim = this.borde - ANCHO;
      this.evento({ k: 'niebla', quien: p.i, x: p.x, y: 1 });
      p.x = Math.abs(destino) < lim ? destino : o.x + o.lado * 1.05;
      p.lado = o.x > p.x ? 1 : -1;
      this.evento({ k: 'niebla', quien: p.i, x: p.x, y: 1 });
    } else if (g.especial === 'voladora') {
      p.vy = pr.vy ?? 8.5;
      p.vx = p.lado * (pr.vel ?? 7.5);
      p.suelo = false;
    } else if (g.superTipo === 'rayo') {
      this.disparar(p, 'rayo', p.x, 0, 0, 0, g, { vida: g.activo, r: 0, golpes: pr.golpes ?? 10, cada: g.cada ?? 5 });
    } else if (g.superTipo === 'lluvia') {
      this.disparar(p, 'lluvia', o.x, 0, 0, 0, g, { vida: g.activo, r: 0, golpes: pr.golpes ?? 10, cada: Math.max(4, Math.floor(g.activo / (pr.golpes ?? 10))) });
    } else if (g.superTipo === 'ola') {
      this.disparar(p, 'ola', p.x + p.lado * 0.9, 0, p.lado * (pr.vel ?? 8.5), 0, g, { vida: pr.vida ?? 140, r: pr.radio ?? 0.9, golpes: pr.golpes ?? 3, cada: 9, alto: pr.alto ?? 1.1 });
    }
  }

  private disparar(p: Peleador, tipo: Proyectil['tipo'], x: number, y: number, vx: number, vy: number, g: Golpe, o: { vida: number; r: number; golpes?: number; cada?: number; alto?: number }) {
    this.P.push({ id: ++this.nProy, dueno: p.i, tipo, x, y, vx, vy, lado: p.lado, t: 0, vida: o.vida, g, r: o.r, alto: o.alto ?? 0, golpes: o.golpes ?? 1, cada: o.cada ?? 0, efecto: g.efecto ?? 'normal' });
  }

  /** Caja que pega (en el mundo) del golpe de p, o null si no está activo. */
  cajaGolpe(p: Peleador): [number, number, number, number] | null {
    const g = p.golpe;
    if (p.estado !== 'ataque' || !g) return null;
    const { activo } = this.fasesGolpe(p, g);
    if (!activo || g.especial === 'proyectil' || g.especial === 'trampa' || g.especial === 'niebla' || g.especial === 'contra' || g.superTipo === 'rayo' || g.superTipo === 'lluvia' || g.superTipo === 'ola') return null;
    let [x0, x1, y0, y1] = g.caja;
    if (g.especial === 'cuerda') {
      const k = Math.min(1, (p.t - g.arranque + 1) / (g.activo * 0.6));
      x1 = x0 + (x1 - x0) * k;
    }
    return p.lado > 0 ? [p.x + x0, p.x + x1, p.y + y0, p.y + y1] : [p.x - x1, p.x - x0, p.y + y0, p.y + y1];
  }

  /** Caja donde le pueden pegar a p (null: intocable). */
  cajaCuerpo(p: Peleador): [number, number, number, number] | null {
    if (p.invul > 0 || p.estado === 'suelo' || p.estado === 'levantarse' || p.estado === 'ko' || p.ko) return null;
    if (p.estado === 'volando' && p.combo >= MALABAR) return null;
    const agachado = p.estado === 'agachado' || (p.estado === 'bloqueo' && p.entrada.v < 0) || (p.estado === 'ataque' && (p.golpe?.id === 'rapidoAbajo' || p.golpe?.id === 'fuerteAbajo'));
    const alto = agachado ? 1.1 : p.estado === 'volando' ? 1.3 : 1.72;
    const y0 = p.estado === 'volando' ? p.y + 0.15 : p.y;
    const w = p.estado === 'volando' ? 0.5 : ANCHO + 0.04;
    return [p.x - w, p.x + w, y0, y0 + alto];
  }

  private pegar(p: Peleador) {
    const o = this.otro(p);
    const g = p.golpe;
    if (p.estado !== 'ataque' || !g) return;
    const caja = this.cajaGolpe(p);
    if (!caja) return;
    if (g.cada) {
      // Varios golpes (aliento): uno cada `cada` cuadros
      if ((p.t - g.arranque) % g.cada !== 0) return;
    } else if (p.veces > 0) return;
    const cuerpo = this.cajaCuerpo(o);
    if (!cuerpo || !cruzan(caja, cuerpo)) return;
    const x = (Math.max(caja[0], cuerpo[0]) + Math.min(caja[1], cuerpo[1])) / 2;
    const y = (Math.max(caja[2], cuerpo[2]) + Math.min(caja[3], cuerpo[3])) / 2;
    p.veces++;
    if (g.agarre) return this.intentarAgarre(p, o, g);
    if (g.superTipo === 'rafaga') {
      if (this.golpear(p, o, g, { x, y, dano: Math.round(g.dano * 0.12), suave: true })) this.empezarRafaga(p, o);
      return;
    }
    this.golpear(p, o, g, { x, y });
  }

  /** Aplica un golpe: lo tapa, lo contraataca o le entra. Devuelve true si le entró. */
  golpear(p: Peleador, o: Peleador, g: Golpe, op: { x: number; y: number; dano?: number; proyectil?: boolean; suave?: boolean; ultimo?: boolean }): boolean {
    const dir = op.proyectil ? Math.sign(o.x - op.x) || p.lado : (Math.sign(o.x - p.x) || p.lado);
    let dano = op.dano ?? g.dano;
    // El velo de calma: se lo devuelve
    if (o.estado === 'ataque' && o.golpe?.especial === 'contra' && o.t >= o.golpe.arranque && o.t < o.golpe.arranque + o.golpe.activo) {
      this.contraatacar(o, p, op);
      return false;
    }
    p.pego = true;
    if (this.tapa(o, g)) {
      const chip = Math.round(dano * (g.chip ?? 0));
      o.vida = Math.max(1, o.vida - chip);
      this.poner(o, 'bloqueo', g.bloqueo);
      o.vx = dir * g.empuje * 0.55;
      if (Math.abs(o.x) > this.borde - ANCHO - 0.1 && !op.proyectil) p.vx = -dir * g.empuje * 0.5;
      p.barra = Math.min(BARRA_MAX, p.barra + dano * 0.35);
      o.barra = Math.min(BARRA_MAX, o.barra + dano * 0.25);
      this.evento({ k: 'golpe', x: op.x, y: op.y, fuerza: fuerza(g), tapado: true, efecto: g.efecto ?? 'normal', quien: o.i, combo: 0 });
      this.pausaGolpe = Math.max(this.pausaGolpe, g.peso === 'fuerte' ? 5 : 3);
      return false;
    }
    // Armadura: aguanta el golpe sin aturdirse
    if (o.estado === 'ataque' && o.armadura > 0 && !g.agarre && g.id !== 'super') {
      o.armadura--;
      o.vida -= Math.round(dano * 0.6);
      o.ultimoGolpe = this.pasos;
      this.evento({ k: 'golpe', x: op.x, y: op.y, fuerza: fuerza(g), tapado: true, efecto: 'tierra', quien: o.i, combo: 0 });
      this.pausaGolpe = Math.max(this.pausaGolpe, 6);
      if (o.vida <= 0) this.noquear(p, o, dir, g);
      return true;
    }
    // Le entró
    const escala = Math.max(0.35, 1 - o.combo * 0.09);
    dano = Math.max(1, Math.round(dano * escala));
    o.vida -= dano;
    o.combo++;
    o.comboDano += dano;
    o.sinGolpe = 0;
    o.ultimoGolpe = this.pasos;
    const roba = (g.roba ?? 0) + (p.def.roba ?? 0);
    if (roba) p.vida = Math.min(p.def.vida, p.vida + Math.round(dano * roba));
    p.barra = Math.min(BARRA_MAX, p.barra + dano * 1.05);
    o.barra = Math.min(BARRA_MAX, o.barra + dano * 0.55);
    o.aturd += dano * 0.9;
    if (o.aturd >= o.def.aguante && o.estado !== 'mareado') o.mareoPendiente = true;
    this.evento({ k: 'golpe', x: op.x, y: op.y, fuerza: fuerza(g), tapado: false, efecto: g.efecto ?? 'normal', quien: o.i, combo: o.combo });
    this.pausaGolpe = Math.max(this.pausaGolpe, op.suave ? 3 : g.peso === 'fuerte' ? 9 : g.peso === 'medio' ? 6 : 4);
    if (o.vida <= 0 && !this.practica) {
      this.noquear(p, o, dir, g);
      return true;
    }
    if (this.practica && o.vida <= 0) o.vida = 1;
    if (op.suave) {
      // El primer toque de la ráfaga: solo lo agarra
      return true;
    }
    if (o.estado === 'agarrado') return true;
    // Retroceso estilo Smash: con menos vida se vuela más lejos (y los livianos más)
    const km = (1 + (1 - Math.max(0, o.vida) / o.def.vida) * 0.75) * o.def.peso;
    const enAire = !o.suelo || o.y > 0.05;
    const lanza = g.lanza ?? 0;
    if (o.estado === 'mareado') o.aturd = 0;
    o.mareoPendiente = o.mareoPendiente && o.estado !== 'mareado';
    if (g.marea && !enAire) {
      this.marear(o, g.marea);
      o.vx = dir * g.empuje;
    } else if (enAire || lanza > 0 || g.derriba || (op.ultimo && g.lanza)) {
      this.poner(o, 'volando');
      o.suelo = false;
      o.vx = dir * g.empuje * km * 0.85;
      o.vy = lanza < 0 ? lanza : Math.max(enAire ? 5.5 : 3.5, lanza * Math.sqrt(km));
      if (lanza < 0 && !enAire) o.vy = 2;
      o.y = Math.max(o.y, 0.02);
      o.caeTumbado = !!g.derriba || lanza >= 6 || lanza < 0 || o.combo >= 4;
      if (o.combo >= MALABAR) o.invul = 30;
    } else {
      this.poner(o, 'golpeado', Math.round(g.aturde * (0.9 + km * 0.1)));
      o.vx = dir * g.empuje * km;
    }
    return true;
  }

  private noquear(p: Peleador, o: Peleador, dir: number, g: Golpe) {
    o.vida = 0;
    o.ko = true;
    this.poner(o, 'volando');
    o.suelo = false;
    o.y = Math.max(o.y, 0.05);
    o.vx = dir * Math.max(6, g.empuje * 1.2);
    o.vy = 8.5;
    o.caeTumbado = true;
    if (this.fase === 'pelea') {
      this.fase = 'ko';
      this.faseT = 0;
      this.lento = 50;
      this.pausaGolpe = 14;
      this.evento({ k: 'anuncio', que: 'ko', quien: o.i });
      this.evento({ k: 'frase', quien: o.i, que: 'derrota' });
    }
  }

  /** ¿Lo tapa? De pie tapa lo alto, lo medio y lo que viene de arriba; agachado, lo bajo y lo medio. */
  private tapa(o: Peleador, g: Golpe) {
    if (g.agarre || !o.suelo) return false;
    const atras = o.entrada.h === -o.lado;
    const puede = o.estado === 'quieto' || o.estado === 'caminar' || o.estado === 'agachado' || o.estado === 'bloqueo';
    if (!puede || !atras) return false;
    const agachado = o.entrada.v < 0;
    if (g.nivel === 'bajo') return agachado;
    if (g.nivel === 'aereo') return !agachado;
    return true;
  }

  private marear(p: Peleador, dur: number) {
    this.poner(p, 'mareado', dur);
    p.mareoPendiente = false;
    p.aturd = 0;
    this.evento({ k: 'mareo', quien: p.i, x: p.x, y: p.y + 2 });
  }

  // ------------------------------------------------------------------------------------------------ Agarres
  private intentarAgarre(p: Peleador, o: Peleador, g: Golpe) {
    // No se agarra a quien está aturdido o tapando (ni en el aire, salvo la cuerda)
    const cuerda = g.especial === 'cuerda';
    if ((!o.suelo && !cuerda) || o.estado === 'golpeado' || o.estado === 'bloqueo' || o.estado === 'agarrando') return;
    if (o.estado === 'ataque' && o.golpe?.especial === 'contra' && o.t >= o.golpe.arranque) {
      this.contraatacar(o, p, { x: o.x, y: 1 });
      return;
    }
    p.pego = true;
    this.poner(p, 'agarrando', cuerda ? 42 : 34);
    p.golpe = g;
    p.agarre = o.i;
    p.vx = 0;
    this.poner(o, 'agarrado', 999);
    o.agarre = p.i;
    o.suelo = true;
    o.vx = o.vy = 0;
    if (!cuerda) {
      o.x = p.x + p.lado * 0.78;
      o.y = 0;
    }
    this.evento({ k: 'agarre', quien: p.i, x: (p.x + o.x) / 2, y: 1 });
  }

  private avanzarAgarre(p: Peleador, o: Peleador) {
    const g = p.golpe!;
    const cuerda = g.especial === 'cuerda';
    if (o.estado !== 'agarrado') {
      this.poner(p, 'quieto');
      return;
    }
    // La cuerda lo trae hasta el frente
    const frente = p.x + p.lado * 0.8;
    if (cuerda && p.t < 16) {
      o.x += (frente - o.x) * 0.22;
      o.y = Math.max(0, o.y * 0.8);
    } else {
      o.x = frente;
      o.y = 0;
    }
    // Escapar: apretar agarre al comienzo (no de la cuerda)
    if (!cuerda && p.t <= 9 && o.buffer.g > 0) {
      o.buffer.g = 0;
      this.poner(p, 'golpeado', 14);
      this.poner(o, 'golpeado', 14);
      p.vx = -p.lado * 4;
      o.vx = p.lado * 4;
      o.agarre = p.agarre = -1;
      this.evento({ k: 'escape', quien: o.i, x: (p.x + o.x) / 2, y: 1.1 });
      return;
    }
    const momento = cuerda ? 30 : 22;
    if (p.t === momento) {
      o.agarre = p.agarre = -1;
      this.poner(o, 'quieto');
      // Lo lanza por encima (para atrás) si está contra la pared de adelante
      const contraPared = Math.abs(p.x + p.lado * 1.5) > this.borde - 0.5;
      if (contraPared) {
        o.x = p.x - p.lado * 0.6;
      }
      const dir = contraPared ? -p.lado : p.lado;
      const sim = { ...g, lanza: g.lanza ?? 6, derriba: true };
      this.golpear(p, o, sim, { x: o.x, y: 1.1 });
      o.vx = dir * 6.5 * o.def.peso;
      o.caeTumbado = true;
    }
    if (p.t >= p.dur) this.poner(p, 'quieto');
  }

  private empezarRafaga(p: Peleador, o: Peleador) {
    if (o.ko) return;
    this.poner(p, 'rafaga', (p.golpe!.proy?.golpes ?? 8) * 7 + 26);
    p.golpe = p.def.golpes.super;
    p.agarre = o.i;
    p.vx = 0;
    this.poner(o, 'agarrado', 999);
    o.agarre = p.i;
    o.suelo = true;
    o.y = 0;
  }

  private avanzarRafaga(p: Peleador, o: Peleador) {
    const g = p.golpe!;
    const n = g.proy?.golpes ?? 8;
    if (o.estado !== 'agarrado') {
      this.poner(p, 'quieto');
      return;
    }
    o.x = p.x + p.lado * 0.85;
    const k = Math.floor(p.t / 7);
    if (p.t % 7 === 0 && k >= 1 && k < n) {
      const pequeño = { ...g, lanza: 0, derriba: false };
      this.golpear(p, o, pequeño, { x: o.x - p.lado * 0.3, y: 0.8 + this.azar() * 0.8, dano: Math.round((g.dano * 0.62) / (n - 1)) });
      if (o.ko) return;
    }
    if (p.t === n * 7 + 4) {
      o.agarre = p.agarre = -1;
      this.poner(o, 'quieto');
      this.golpear(p, o, { ...g, lanza: 10, derriba: true, empuje: 8 }, { x: o.x, y: 1.2, dano: Math.round(g.dano * 0.38), ultimo: true });
    }
    if (p.t >= p.dur) this.poner(p, 'quieto');
  }

  private contraatacar(s: Peleador, atacante: Peleador, op: { x: number; y: number }) {
    const g = s.golpe!;
    this.evento({ k: 'contra', quien: s.i, x: op.x, y: op.y });
    s.invul = 20;
    s.barra = Math.min(BARRA_MAX, s.barra + 120);
    // Si el que pega está cerca, el velo lo devuelve con un golpe; si era de lejos (un proyectil), solo lo deshace
    if (Math.abs(atacante.x - s.x) < 2.6 && !atacante.ko) {
      s.lado = atacante.x > s.x ? 1 : -1;
      this.poner(s, 'contraataque', 22);
      const golpeContra: Golpe = { ...g, especial: undefined, id: 'especial' };
      this.golpear(s, atacante, golpeContra, { x: (s.x + atacante.x) / 2, y: 1.2 });
      this.pausaGolpe = Math.max(this.pausaGolpe, 12);
    } else this.poner(s, 'contraataque', 12);
  }

  // ------------------------------------------------------------------------------------------------ Proyectiles
  private proyectiles() {
    for (const x of this.P) {
      if (x.muerto) continue;
      x.t++;
      const p = this.L[x.dueno];
      const o = this.otro(p);
      switch (x.tipo) {
        case 'bala':
        case 'caida':
          x.x += x.vx * DT;
          x.y += x.vy * DT;
          if (x.tipo === 'caida' && x.y <= 0.1) {
            x.muerto = true;
            this.evento({ k: 'estalla', x: x.x, y: 0.1, efecto: x.efecto });
            break;
          }
          if (Math.abs(x.x) > this.borde + 1 || x.t > x.vida) x.muerto = true;
          else this.tocar(x, p, o, x.r, x.r);
          break;
        case 'trampa':
          if (x.t > x.vida) {
            x.muerto = true;
            this.evento({ k: 'estalla', x: x.x, y: 0.3, efecto: x.efecto });
          } else if (x.t > 20 && o.y < 0.4 && Math.abs(o.x - x.x) < x.r + ANCHO && !o.ko && o.estado !== 'suelo' && o.estado !== 'levantarse') {
            x.muerto = true;
            this.evento({ k: 'estalla', x: x.x, y: 0.4, efecto: x.efecto });
            this.golpear(p, o, x.g, { x: x.x, y: 0.6, proyectil: true });
          }
          break;
        case 'rayo': {
          x.lado = p.lado;
          x.x = p.x;
          if (x.t > x.vida || p.estado !== 'ataque') {
            x.muerto = true;
            break;
          }
          if (x.t % x.cada === 0 && x.golpes > 0) {
            const g = x.g;
            const [a0, a1, y0, y1] = g.caja;
            const caja: [number, number, number, number] = p.lado > 0 ? [p.x + a0, p.x + a1, p.y + y0, p.y + y1] : [p.x - a1, p.x - a0, p.y + y0, p.y + y1];
            const cuerpo = this.cajaCuerpo(o);
            if (cuerpo && cruzan(caja, cuerpo)) {
              x.golpes--;
              const ultimo = x.golpes === 0;
              const n = g.proy?.golpes ?? 10;
              this.golpear(p, o, ultimo ? g : { ...g, lanza: 0, empuje: 1.4 }, { x: o.x - p.lado * 0.3, y: 1.1, dano: Math.round(g.dano / n), proyectil: true, ultimo });
            }
          }
          break;
        }
        case 'lluvia':
          x.x = o.x;
          if (x.t > x.vida || x.golpes <= 0) {
            x.muerto = true;
            break;
          }
          if (x.t % x.cada === 1) {
            x.golpes--;
            const n = x.g.proy?.golpes ?? 10;
            const g = x.golpes === 0 ? x.g : { ...x.g, lanza: 0, marea: 0 };
            this.P.push({ id: ++this.nProy, dueno: x.dueno, tipo: 'caida', x: o.x + (this.azar() - 0.5) * 1.6 + o.vx * 0.25, y: 6.5 + this.azar() * 1.5, vx: 0, vy: -13, lado: 1, t: 0, vida: 90,
              g: { ...g, dano: Math.round(x.g.dano / n) }, r: x.g.proy?.radio ?? 0.42, alto: 0, golpes: 1, cada: 0, efecto: x.efecto });
          }
          break;
        case 'ola':
          x.x += x.vx * DT;
          if (Math.abs(x.x) > this.borde + 1.5 || x.t > x.vida) {
            x.muerto = true;
            break;
          }
          if (x.golpes > 0 && x.t % x.cada === 0) {
            const caja: [number, number, number, number] = [x.x - x.r, x.x + x.r, 0, x.alto];
            const cuerpo = this.cajaCuerpo(o);
            if (cuerpo && cruzan(caja, cuerpo)) {
              x.golpes--;
              const n = x.g.proy?.golpes ?? 3;
              const ultimo = x.golpes === 0;
              this.golpear(p, o, ultimo ? x.g : { ...x.g, derriba: false, lanza: 0, empuje: 3 }, { x: o.x, y: 0.6, dano: Math.round(x.g.dano / n), proyectil: true, ultimo });
            }
          }
          break;
      }
    }
    // Dos balas que se encuentran se deshacen
    const balas = this.P.filter((x) => x.tipo === 'bala' && !x.muerto);
    for (let i = 0; i < balas.length; i++) {
      for (let j = i + 1; j < balas.length; j++) {
        const a = balas[i], b = balas[j];
        if (a.dueno !== b.dueno && Math.abs(a.x - b.x) < a.r + b.r && Math.abs(a.y - b.y) < a.r + b.r) {
          a.muerto = b.muerto = true;
          this.evento({ k: 'choque', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, efecto: a.efecto });
        }
      }
    }
    this.P = this.P.filter((x) => !x.muerto);
  }

  private tocar(x: Proyectil, p: Peleador, o: Peleador, rx: number, ry: number) {
    const cuerpo = this.cajaCuerpo(o);
    if (!cuerpo) return;
    if (!cruzan([x.x - rx, x.x + rx, x.y - ry, x.y + ry], cuerpo)) return;
    x.muerto = true;
    const le = this.golpear(p, o, x.g, { x: x.x, y: x.y, proyectil: true });
    if (!le) this.evento({ k: 'estalla', x: x.x, y: x.y, efecto: x.efecto });
  }

  // ------------------------------------------------------------------------------------------------ Tiempos
  private temporizar(p: Peleador) {
    p.sinGolpe++;
    if (p.sinGolpe > 90 && p.aturd > 0) p.aturd = Math.max(0, p.aturd - 2.5);
    // El combo se acaba cuando vuelve a estar libre
    if (this.libre(p) || p.estado === 'aire' || p.estado === 'ataque' || p.estado === 'bloqueo' || p.estado === 'levantarse') {
      p.combo = 0;
      p.comboDano = 0;
    }
  }
}

function cruzan(a: [number, number, number, number], b: [number, number, number, number]) {
  return a[0] < b[1] && a[1] > b[0] && a[2] < b[3] && a[3] > b[2];
}

function fuerza(g: Golpe) {
  return g.peso === 'fuerte' ? 3 : g.peso === 'medio' ? 2 : 1;
}

/** Segundos que le quedan a la ronda (para el reloj de la pantalla). */
export function segundos(s: { reloj: number }) {
  return Math.max(0, Math.ceil(s.reloj / PASOS));
}
