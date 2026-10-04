// El motor de «Lavarse la cara»: la simulación completa del Vampire Survivors del baño, sin DOM ni three.js (corre
// igual en el celular, en el anfitrión de una partida en pareja y en las pruebas de Node con el bot). Todo vive en
// piscinas de objetos que se reutilizan: nada se crea por cuadro.
import { ARMAS, BASICAS, ID_PASIVAS, MAX_RANURAS, PASIVAS, UNION_PIDE, baseEnNivel, maxNivelArma, type BaseArma } from './armas';
import { Azar, hash2 } from './azar';
import { CARTAS } from './cartas';
import { DISFRAZ, type DefDisfraz } from './disfraces';
import { ENEMIGOS, INDICE_ENEMIGO, type DefEnemigo } from './enemigos';
import { DURACION, ESCENARIOS, type DefEscenario, type EventoOleada } from './escenarios';
import { Rejilla } from './rejilla';
import { PODER } from './tienda';
import { statsVacios, type Efecto, type IdArma, type IdCarta, type IdEnemigo, type IdEscenario, type IdObjeto, type IdPasiva, type Rol, type Stat, type Stats, type TipoEfecto } from './tipos';
import { actualizarArmas, moverProyectiles, moverZonas, pendientesGolpe } from './disparos';
import type { ResumenPartida } from './progreso';
import { valorOpcion } from './bot';
import { cartaVista, disfrazVisto, neutralizar } from './textos';
import type { AspectoJugador } from '../../salas/tipos';

/** Aumento de vida de los bichos por minuto después del 14, y qué parte de eso se vuelve daño. */
export let TARDE_VIDA = 0.06;
export let TARDE_DANO = 0.3;
/** Para el balance (scripts/balance-lavado.ts). */
export function ajustarTarde(vida: number, dano: number) {
  TARDE_VIDA = vida;
  TARDE_DANO = dano;
}
export const MAX_ENEMIGOS = 420;
/**
 * Lo que sube con cada jugador (índice = cuántos juegan − 1). Con dos queda como estaba (ya balanceado en pareja);
 * con tres y cuatro: más mugrosos a la vez, con más vida, jefes más duros, eventos más grandes y élites más seguido.
 */
export const POR_JUGADORES = {
  densidad: [1, 1.4, 1.75, 2.05],
  vida: [1, 1, 1.15, 1.3],
  jefe: [1, 1, 1.3, 1.6],
  evento: [1, 1.3, 1.55, 1.8],
  /** Cada cuántos segundos del reloj sale un élite extra con cofre (además de los del escenario). */
  elite: [0, 150, 95, 70],
};
/** Segundos para escoger cuando hay más de uno (después se escoge solo lo mejor, para no frenar a los demás). */
export const LIMITE_ESCOGER = 15;
export const LIMITE_COFRE = 9;
const POOL_EN = 520;
const MAX_PROY = 760;
const MAX_GEMAS = 320;
const MAX_OBJ = 96;
const MAX_ZONAS = 120;
const MAX_EF = 4096;
/** Radio del personaje para los choques. */
export const RADIO_JUGADOR = 12;
/** Velocidad base al caminar (unidades por segundo). */
export const VEL_JUGADOR = 130;
/** Radio base para recoger gotitas. */
export const IMAN_BASE = 56;
/** Celda del mapa donde puede haber una velita. */
const CELDA_LUZ = 380;

/** Lo que se necesita para pasar del nivel n al n+1 (la curva del original con sus saltos en el 20 y el 40). */
export function xpPara(n: number): number {
  if (n < 20) return 5 + 10 * (n - 1);
  if (n === 20) return 195 + 600;
  if (n < 40) return 195 + 13 * (n - 20);
  if (n === 40) return 455 + 2400;
  return 455 + 16 * (n - 40);
}

// ---------------------------------------------------------------------------------------------------- Entidades
export class Enemigo {
  vivo = false;
  uid = 0;
  tipo: IdEnemigo = 'germen';
  ti = 0;
  def: DefEnemigo = ENEMIGOS.germen;
  x = 0;
  y = 0;
  /** Empuje de los golpes. */
  kx = 0;
  ky = 0;
  /** Velocidad con la que se movió en el último paso (para el dibujo). */
  vx = 0;
  vy = 0;
  hp = 1;
  hpMax = 1;
  r = 10;
  esc = 1;
  elite = false;
  jefe = false;
  /** 0 nada, 1 cofre, 2 cofre con carta. */
  cofre = 0;
  luz = false;
  congelado = 0;
  lento = 0;
  flash = 0;
  toque = 0;
  /** Cuándo puede volver a recibir golpe de cada fuente que se queda (aura, órbitas, charcos…), por jugador. */
  hz = new Float32Array(20);
  fase = 0;
  /** Para los que cruzan: dirección fija y cuándo se van. */
  dx = 0;
  dy = 0;
  vence = 0;
  /** No se reubica si se aleja (enjambres, muros, jefes). */
  fijo = false;
  estado = 0;
  et = 0;
  /** El llamado de «Te busqué por todos lados». */
  llamado = 0;
}

export class Proyectil {
  vivo = false;
  dueno = 0;
  arma: IdArma = 'burbujas';
  /** Ranura del arma (para sumar su daño). */
  slot = 0;
  /** 0 recto, 1 parábola, 2 bumerán, 3 rebote, 4 espiral, 5 rana, 6 botella (vuela y deja charco). */
  comp = 0;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  ax = 0;
  ay = 0;
  r = 8;
  dano = 10;
  crit = 0;
  critX = 2;
  perfora = 1;
  vida = 1;
  t = 0;
  ang = 0;
  giro = 0;
  golpeCada = 0.5;
  retro = 1;
  /** A quiénes ya golpeó (anillo de 16) y hasta cuándo no los vuelve a golpear. */
  gid = new Int32Array(16);
  gt = new Float32Array(16);
  gi = 0;
  /** Libre para cada comportamiento (destino de la botella, rebotes extra, la mira de la rana…). */
  ex = 0;
  ey = 0;
  n = 0;
  mini = false;
}

export class Zona {
  vivo = false;
  dueno = 0;
  arma: IdArma = 'botellas';
  slot = 0;
  /** 0 charco, 1 columna de ducha. */
  tipo = 0;
  x = 0;
  y = 0;
  r = 40;
  w = 0;
  h = 0;
  dano = 10;
  vida = 1;
  dur = 1;
  golpeCada = 0.5;
  hz = 8;
  vx = 0;
  vy = 0;
  crece = 0;
  lento = 0;
  t = 0;
}

export class Gema {
  vivo = false;
  x = 0;
  y = 0;
  xp = 1;
  /** 0 azul, 1 verde, 2 roja, 3 la roja grande (cuando hay demasiadas). */
  tipo = 0;
  jalada = -1;
  v = 0;
  t = 0;
}

export class Objeto {
  vivo = false;
  tipo: IdObjeto = 'moneda';
  x = 0;
  y = 0;
  jalado = -1;
  v = 0;
  /** Cofre: 1 élite, 2 jefe, 3 carta. */
  calidad = 0;
  /** El cofre de jefe es de un solo jugador cuando juegan varios (cada uno el suyo); -1 = de quien lo coja. */
  dueno = -1;
  t = 0;
}

export interface ArmaJ {
  id: IdArma;
  nivel: number;
  b: BaseArma;
  /** Recarga que falta. */
  t: number;
  /** Disparos que faltan de la ráfaga y cuánto para el siguiente. */
  rafaga: number;
  tr: number;
  total: number;
  /** Estado propio: lado del látigo, hora del reloj, ángulo de la órbita… */
  k: number;
  ang: number;
  activo: number;
  desde: number;
}

export interface Opcion {
  tipo: 'arma' | 'pasiva' | 'arepa' | 'oro';
  id: string;
  nivel: number;
  nueva: boolean;
}

export interface PremioCofre {
  tipo: 'arma' | 'pasiva' | 'evolucion' | 'oro';
  id: string;
  nivel: number;
}

export interface CofreAbierto {
  jugador: number;
  premios: PremioCofre[];
  oro: number;
  calidad: number;
}

export interface OpcionesJugador {
  rol: Rol;
  disfraz: string;
  poderes: Partial<Record<Stat, number>>;
  carta?: IdCarta | '' | null;
  /** Armas y pasivas secretas que ya desbloqueó. */
  secretos?: string[];
  /** Cartas desbloqueadas (para los cofres de carta). */
  cartas?: IdCarta[];
  /** En las salas: quién es (para encontrarse en la lista), su nombre y cómo se ve (amigos con sus colores). */
  id?: string;
  nombre?: string;
  aspecto?: AspectoJugador;
  /** Apunta a mano (segundo dedo o mouse) en vez de que las armas busquen solas. */
  manual?: boolean;
}

export interface OpcionesMotor {
  escenario: IdEscenario;
  apurado: boolean;
  jugadores: OpcionesJugador[];
  semilla?: number;
  /** El tutorial: sin oleadas ni velitas (los mugrosos los pone el tutorial) y nadie se cae. */
  tutorial?: boolean;
}

export class Jugador {
  rol: Rol;
  disfraz: DefDisfraz;
  id: string;
  nombre: string;
  aspecto?: AspectoJugador;
  /** Se fue de la partida (o lleva mucho rato sin conexión): no juega, no lo persiguen, no cuenta. */
  fuera = false;
  /** Apuntar a mano: hacia dónde apunta (unitario). */
  manual = false;
  ax = 1;
  ay = 0;
  /** Segundos que lleva escogiendo (cartas, cofre o carta mágica) cuando juegan varios. */
  tEscoger = 0;
  /** Gotas doradas que recogió él mismo (con varios, cada uno se lleva lo suyo + un poquito del equipo). */
  oro = 0;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  /** Hacia dónde mira (unitario) y de qué lado (para el látigo). */
  dx = 1;
  dy = 0;
  mira = 1;
  /** Lo que pide el joystick (-1..1). */
  mx = 0;
  my = 0;
  /** En pareja, el invitado manda su posición: el anfitrión la usa tal cual. */
  remoto = false;
  vida = 100;
  vidaMax = 100;
  st: Stats = statsVacios();
  armas: ArmaJ[] = [];
  pasivas = new Map<IdPasiva, number>();
  poderes: Partial<Record<Stat, number>>;
  cartas: IdCarta[] = [];
  cartasLibres: IdCarta[];
  secretos: Set<string>;
  invul = 0;
  caido = false;
  rescate = 0;
  revivesUsados = 0;
  usadosTirar = 0;
  usadosSaltar = 0;
  usadosVetar = 0;
  /** Cuántas veces ha escogido algo (cartas, cofres, cartas de amor): un toque viejo o repetido no cuenta dos veces. */
  acciones = 0;
  vetadas = new Set<string>();
  opciones: Opcion[] | null = null;
  nivelesPend = 0;
  cofre: CofreAbierto | null = null;
  cofresPend: number[] = [];
  cartaOpciones: IdCarta[] | null = null;
  danos = new Map<IdArma, { dano: number; desde: number }>();
  aji = 0;
  /** Ventana que ve (unidades del mapa), para aparecer afuera y para las armas de pantalla. */
  vistaW = 780;
  vistaH = 360;
  arranque = 0;
  /** Contadores de algunas cartas. */
  eliminadosCarta = 0;
  bonoVideollamadas = 0;
  quieto = 0;
  curado = 0;
  /** El trebolito suma suerte por el resto de la partida. */
  bonoSuerte = 0;

  constructor(public i: number, o: OpcionesJugador) {
    this.rol = o.rol;
    this.disfraz = DISFRAZ[o.disfraz] ?? Object.values(DISFRAZ).find((d) => d.rol === o.rol && d.inicial)!;
    this.id = o.id ?? `j${i}`;
    this.nombre = o.nombre ?? '';
    this.aspecto = o.aspecto;
    this.manual = !!o.manual;
    this.poderes = { ...o.poderes };
    this.secretos = new Set(o.secretos ?? []);
    this.cartasLibres = [...(o.cartas ?? [])];
  }

  get vivo() {
    return !this.caido;
  }
  /** Está jugando: ni caído ni por fuera. */
  get activo() {
    return !this.caido && !this.fuera;
  }
  tieneCarta(c: IdCarta) {
    return this.cartas.includes(c);
  }
  nivelArma(id: IdArma) {
    return this.armas.find((a) => a.id === id)?.nivel ?? 0;
  }
  get revivesQuedan() {
    return Math.max(0, Math.round(this.st.revivir) - this.revivesUsados);
  }
  get quedanTirar() {
    return Math.max(0, Math.round(this.st.tirar) - this.usadosTirar);
  }
  get quedanSaltar() {
    return Math.max(0, Math.round(this.st.saltar) - this.usadosSaltar);
  }
  get quedanVetar() {
    return Math.max(0, Math.round(this.st.vetar) - this.usadosVetar);
  }
  /** Ventana de pantalla alrededor del personaje. */
  enVista(x: number, y: number, margen = 0) {
    return Math.abs(x - this.x) < this.vistaW / 2 + margen && Math.abs(y - this.y) < this.vistaH / 2 + margen;
  }
}

/** Lo que suelta una velita al romperse (pesos como los braseros del original; la suerte sube lo raro). */
const SUELTA_LUZ: [IdObjeto, number, boolean][] = [
  ['moneda', 38, false], ['bolsa', 14, false], ['frasco', 3, true], ['arepa', 14, false], ['ola', 2.4, true], ['hielo', 2.4, true],
  ['aspiradora', 2.2, true], ['trebolito', 2, true], ['aji', 2, true],
];

// ---------------------------------------------------------------------------------------------------- Motor
export class Motor {
  readonly esc: DefEscenario;
  readonly apurado: boolean;
  readonly az: Azar;
  readonly jug: Jugador[];
  readonly tutorial: boolean;
  /** Segundos reales jugados y el reloj de la partida (en «Apurado» corre al doble). */
  tReal = 0;
  t = 0;
  nivel = 1;
  xp = 0;
  eliminados = 0;
  oro = 0;
  gano = false;
  fin = false;
  /** Velitas rotas, cofres abiertos, arepas comidas (para los logros). */
  velitas = 0;
  cofres = 0;
  arepas = 0;
  evoluciones: IdArma[] = [];
  jefes: IdEnemigo[] = [];
  bestiario: Partial<Record<IdEnemigo, number>> = {};
  armasVistas = new Set<IdArma>();
  pasivasVistas = new Set<IdPasiva>();
  revivio = false;

  readonly en: Enemigo[] = [];
  readonly vivos = new Int32Array(POOL_EN);
  nVivos = 0;
  /** Comunes vivos (los que cuentan para el mínimo de la oleada). */
  nComunes = 0;
  readonly pr: Proyectil[] = [];
  readonly zonas: Zona[] = [];
  readonly gemas: Gema[] = [];
  nGemas = 0;
  gemaGrande = -1;
  readonly objs: Objeto[] = [];
  readonly rej = new Rejilla(POOL_EN, 64);
  readonly pend: { vivo: boolean; t: number; x: number; y: number; r: number; dano: number; dueno: number; slot: number; arma: IdArma; tipo: number }[] = [];
  /** Efectos para el dibujo y el sonido (anillo: cada lector lleva su propia cuenta). */
  readonly ef: Efecto[] = [];
  nEf = 0;
  /** Congelados por el reloj de hielo. */
  hielo = 0;
  private sigUid = 1;
  private tTanda = 0;
  private iEvento = 0;
  private sigParca = DURACION;
  private lucesRotas = new Map<number, number>();
  private celdaLuz = new Map<number, number>();
  private tLuces = 0;
  private tLlamado = 120;
  private tTiempo = 60;
  /** Índices temporales (para no pisar la consulta de la rejilla). */
  readonly tmp = new Int32Array(POOL_EN);

  constructor(o: OpcionesMotor) {
    this.esc = ESCENARIOS[o.escenario];
    this.apurado = o.apurado;
    this.tutorial = !!o.tutorial;
    this.az = new Azar(o.semilla);
    for (let i = 0; i < POOL_EN; i++) this.en.push(new Enemigo());
    for (let i = 0; i < MAX_PROY; i++) this.pr.push(new Proyectil());
    for (let i = 0; i < MAX_ZONAS; i++) this.zonas.push(new Zona());
    for (let i = 0; i < MAX_GEMAS + 1; i++) this.gemas.push(new Gema());
    for (let i = 0; i < MAX_OBJ; i++) this.objs.push(new Objeto());
    for (let i = 0; i < 96; i++) this.pend.push({ vivo: false, t: 0, x: 0, y: 0, r: 0, dano: 0, dueno: 0, slot: 0, arma: 'bombillo', tipo: 0 });
    for (let i = 0; i < MAX_EF; i++) this.ef.push({ tipo: 'golpe', x: 0, y: 0, c: 0, d: 0, e: 0, f: 0, t: '' });
    this.jug = o.jugadores.map((oj, i) => new Jugador(i, oj));
    const n = this.jug.length;
    for (const j of this.jug) {
      // Solo, en el centro; en pareja, uno a cada lado; de a tres o cuatro, en ronda
      const a = n === 2 ? (j.i === 0 ? Math.PI : 0) : (j.i / Math.max(1, n)) * Math.PI * 2 + Math.PI;
      j.x = n > 1 ? Math.cos(a) * 34 : 0;
      j.y = n > 2 ? Math.sin(a) * 26 : 0;
      j.mira = j.x <= 0 ? 1 : -1;
      if (oj(o, j.i)?.carta) j.cartas.push(oj(o, j.i)!.carta as IdCarta);
      this.darArma(j, j.disfraz.arma);
      if (j.disfraz.arma2) this.darArma(j, j.disfraz.arma2);
      if (j.tieneCarta('octubre')) {
        const extra = this.az.pesado(BASICAS.filter((a) => !j.armas.some((x) => x.id === a) && this.disponible(j, a)), (a) => ARMAS[a].rareza);
        if (extra) this.darArma(j, extra);
      }
      j.arranque = j.disfraz.arranque ?? 0;
      this.recalcular(j);
      j.vida = j.vidaMax;
    }
    this.tTanda = 0.5;
    this.tGrito = 1.2;
  }

  /** Cuándo se dice la habilidad de cada disfraz al empezar. */
  private tGrito = 0;

  // ------------------------------------------------------------------------------------------------- Efectos
  emitir(tipo: TipoEfecto, x: number, y: number, c = 0, d = 0, e = 0, f = 0, t = '') {
    const ef = this.ef[this.nEf % MAX_EF];
    this.nEf++;
    ef.tipo = tipo;
    ef.x = x;
    ef.y = y;
    ef.c = c;
    ef.d = d;
    ef.e = e;
    ef.f = f;
    ef.t = t;
  }

  /** Un aviso en pantalla (`de`: solo para ese jugador; si no, para todos). En modo neutro, sin nada de la pareja. */
  aviso(t: string, de = -1) {
    this.emitir('aviso', 0, 0, de + 1, 0, 0, 0, neutralizar(t));
  }

  /** Cuántos están jugando (los que se fueron no cuentan para la dificultad). */
  get nJugando() {
    let n = 0;
    for (const j of this.jug) if (!j.fuera) n++;
    return Math.max(1, Math.min(4, n));
  }

  /** Un factor de la tabla de dificultad para los que juegan ahora. */
  porJugadores(k: keyof typeof POR_JUGADORES) {
    return POR_JUGADORES[k][this.nJugando - 1];
  }

  /** ¿La habilidad del disfraz crece justo en este nivel? (las de cada nivel se avisan de 10 en 10) */
  private crecioEn(j: Jugador, n: number) {
    return j.disfraz.crece.some((c) => {
      const desde = c.desde ?? c.cada;
      if (n < desde || n > c.hasta || (n - desde) % c.cada !== 0) return false;
      return c.cada > 1 || n % 10 === 0;
    });
  }

  // ------------------------------------------------------------------------------------------------- Estadísticas
  /** Suma el disfraz, la tienda, las pasivas, el crecimiento por nivel y las cartas. */
  recalcular(j: Jugador) {
    const s = statsVacios();
    let vidaPct = 0;
    for (const [k, v] of Object.entries(j.disfraz.base) as [Stat, number][]) if (k !== 'vida') s[k] += v;
    for (const [k, rango] of Object.entries(j.poderes) as [Stat, number][]) {
      const p = PODER[k];
      if (!p || !rango) continue;
      if (k === 'vida') vidaPct += p.paso * rango;
      else s[k] += p.paso * rango;
    }
    for (const [id, n] of j.pasivas) {
      const p = PASIVAS[id];
      if (p.stat === 'vida') vidaPct += p.paso * n;
      else s[p.stat] += p.paso * n;
    }
    for (const c of j.disfraz.crece) {
      const desde = c.desde ?? c.cada;
      let veces = 0;
      for (let n = desde; n <= Math.min(this.nivel, c.hasta); n += c.cada) veces++;
      s[c.stat] += c.paso * veces;
    }
    // Cartas
    s.suerte += j.bonoSuerte;
    if (j.tieneCarta('octubre')) s.cantidad += 1;
    if (j.tieneCarta('videollamadas')) {
      s.duracion += 0.6;
      s.poder += j.bonoVideollamadas;
    }
    if (j.tieneCarta('metaDiciembre')) {
      const k = (['crecimiento', 'suerte', 'codicia', 'maldicion'] as Stat[])[Math.floor(this.t / 60) % 4];
      s[k] += 0.5;
    }
    if (j.tieneCarta('hogar')) {
      const vacias = MAX_RANURAS - j.armas.length;
      s.poder += 0.1 * vacias;
      s.enfriamiento += 0.05 * vacias;
      s.recuperacion += 0.2 * vacias;
    }
    const antes = j.vidaMax;
    j.vidaMax = Math.max(10, Math.round((100 + (j.disfraz.base.vida ?? 0)) * (1 + vidaPct)));
    if (j.tieneCarta('reina')) s.poder += j.vidaMax / 1000 + s.armadura * 0.05;
    s.vida = j.vidaMax;
    s.enfriamiento = Math.min(0.75, s.enfriamiento);
    j.st = s;
    if (j.vidaMax > antes && antes > 0 && !j.caido) j.vida += j.vidaMax - antes;
    j.vida = Math.min(j.vida, j.vidaMax);
  }

  // ------------------------------------------------------------------------------------------------- Inventario
  disponible(j: Jugador, id: IdArma | IdPasiva) {
    const def = (ARMAS as Record<string, { secreta?: boolean }>)[id] ?? (PASIVAS as Record<string, { secreta?: boolean }>)[id];
    return !!def && (!def.secreta || j.secretos.has(id)) && !j.vetadas.has(id);
  }

  darArma(j: Jugador, id: IdArma, nivel = 1) {
    const a = j.armas.find((x) => x.id === id);
    if (a) {
      a.nivel = Math.min(maxNivelArma(id), a.nivel + 1);
      a.b = baseEnNivel(id, a.nivel);
      return;
    }
    j.armas.push({ id, nivel, b: baseEnNivel(id, nivel), t: 0.3 + j.armas.length * 0.15, rafaga: 0, tr: 0, total: 0, k: 0, ang: 0, activo: 0, desde: this.tReal });
    if (!j.danos.has(id)) j.danos.set(id, { dano: 0, desde: this.tReal });
    this.armasVistas.add(id);
  }

  darPasiva(j: Jugador, id: IdPasiva) {
    j.pasivas.set(id, Math.min(PASIVAS[id].max, (j.pasivas.get(id) ?? 0) + 1));
    this.pasivasVistas.add(id);
    this.recalcular(j);
  }

  /** Las cartas al subir de nivel: 3 (o 4 con suerte) de lo que se puede subir o agarrar, sin repetir. */
  generarOpciones(j: Jugador): Opcion[] {
    const l: { o: Opcion; peso: number }[] = [];
    for (const a of j.armas) {
      const max = maxNivelArma(a.id);
      if (a.nivel < max) l.push({ o: { tipo: 'arma', id: a.id, nivel: a.nivel + 1, nueva: false }, peso: ARMAS[a.id].rareza * 1.6 });
    }
    if (j.armas.length < MAX_RANURAS) {
      for (const id of BASICAS) {
        if (j.armas.some((a) => a.id === id) || !this.disponible(j, id)) continue;
        // Si ya tiene la evolución de esta, no vuelve a salir
        if (j.armas.some((a) => ARMAS[a.id].de?.includes(id))) continue;
        l.push({ o: { tipo: 'arma', id, nivel: 1, nueva: true }, peso: ARMAS[id].rareza });
      }
    }
    for (const [id, n] of j.pasivas) if (n < PASIVAS[id].max) l.push({ o: { tipo: 'pasiva', id, nivel: n + 1, nueva: false }, peso: PASIVAS[id].rareza * 1.4 });
    if (j.pasivas.size < MAX_RANURAS) {
      for (const id of ID_PASIVAS) {
        if (j.pasivas.has(id) || !this.disponible(j, id)) continue;
        l.push({ o: { tipo: 'pasiva', id, nivel: 1, nueva: true }, peso: PASIVAS[id].rareza });
      }
    }
    const suerte = 1 + j.st.suerte;
    const cuantas = this.az.n() < Math.min(0.9, 1 - 1 / suerte) ? 4 : 3;
    const r: Opcion[] = [];
    while (r.length < cuantas && l.length) {
      const x = this.az.pesado(l, (q) => q.peso)!;
      r.push(x.o);
      l.splice(l.indexOf(x), 1);
    }
    if (!r.length) {
      r.push({ tipo: 'arepa', id: 'arepa', nivel: 1, nueva: false }, { tipo: 'oro', id: 'oro', nivel: 1, nueva: false });
    }
    return r;
  }

  /** Lo que escogió al subir de nivel. */
  /** ¿Este toque es de lo que está en pantalla ahora? (`n` = las acciones que llevaba cuando se vio). */
  private vigente(j: Jugador | undefined, n?: number): j is Jugador {
    return !!j && (n === undefined || n === j.acciones);
  }

  escoger(ji: number, k: number, n?: number) {
    const j = this.jug[ji];
    if (!this.vigente(j, n)) return;
    const o = j.opciones?.[k];
    if (!o) return;
    j.acciones++;
    j.tEscoger = 0;
    if (o.tipo === 'arma') this.darArma(j, o.id as IdArma);
    else if (o.tipo === 'pasiva') this.darPasiva(j, o.id as IdPasiva);
    else if (o.tipo === 'arepa') this.curar(j, 30);
    else this.sumarOro(25, j);
    this.recalcular(j);
    this.siguienteOpcion(j);
  }

  tirarCartas(ji: number, n?: number) {
    const j = this.jug[ji];
    if (!this.vigente(j, n) || !j.opciones || j.quedanTirar <= 0) return;
    j.acciones++;
    j.tEscoger = 0;
    j.usadosTirar++;
    j.opciones = this.generarOpciones(j);
  }

  saltarCartas(ji: number, n?: number) {
    const j = this.jug[ji];
    if (!this.vigente(j, n) || !j.opciones || j.quedanSaltar <= 0) return;
    j.acciones++;
    j.tEscoger = 0;
    j.usadosSaltar++;
    // Como en el original: saltar no regala nada (pero tampoco se pierde la experiencia)
    this.siguienteOpcion(j);
  }

  vetar(ji: number, k: number, n?: number) {
    const j = this.jug[ji];
    if (!this.vigente(j, n)) return;
    const o = j.opciones?.[k];
    if (!o || j.quedanVetar <= 0 || (o.tipo !== 'arma' && o.tipo !== 'pasiva')) return;
    j.acciones++;
    j.tEscoger = 0;
    j.usadosVetar++;
    j.vetadas.add(o.id);
    j.opciones = this.generarOpciones(j);
  }

  private siguienteOpcion(j: Jugador) {
    j.opciones = null;
    if (j.nivelesPend > 0) {
      j.nivelesPend--;
      j.opciones = this.generarOpciones(j);
    }
  }

  // ------------------------------------------------------------------------------------------------- Cofres
  /** ¿Qué arma puede evolucionar ya? (nivel máximo + su pasiva, o las dos armas de una unión). */
  evolucionPosible(j: Jugador): { de: IdArma[]; a: IdArma } | null {
    if (this.t < 600 && !this.tutorial) return null;
    for (const a of j.armas) {
      const def = ARMAS[a.id];
      if (!def.evo || a.nivel < maxNivelArma(a.id)) continue;
      if (def.evo.pasiva && j.pasivas.has(def.evo.pasiva)) return { de: [a.id], a: def.evo.a };
      if (def.evo.arma) {
        const otra = j.armas.find((x) => x.id === def.evo!.arma);
        const pide = UNION_PIDE[def.evo.a];
        if (otra && otra.nivel >= maxNivelArma(otra.id) && (!pide || j.pasivas.has(pide))) return { de: [a.id, otra.id], a: def.evo.a };
      }
    }
    return null;
  }

  evolucionar(j: Jugador, de: IdArma[], a: IdArma) {
    const i = j.armas.findIndex((x) => x.id === de[0]);
    const vieja = j.armas[i];
    j.armas = j.armas.filter((x) => !de.includes(x.id));
    j.armas.splice(Math.min(i, j.armas.length), 0, { id: a, nivel: 1, b: baseEnNivel(a, 1), t: 0.2, rafaga: 0, tr: 0, total: 0, k: vieja?.k ?? 0, ang: vieja?.ang ?? 0, activo: 0, desde: this.tReal });
    if (!j.danos.has(a)) j.danos.set(a, { dano: 0, desde: this.tReal });
    this.armasVistas.add(a);
    if (!this.evoluciones.includes(a)) this.evoluciones.push(a);
    this.emitir('evolucion', j.x, j.y, j.i);
    this.recalcular(j);
  }

  abrirCofre(j: Jugador, calidad: number) {
    const suerte = 1 + j.st.suerte;
    const r = this.az.n();
    const p5 = (calidad >= 2 ? 0.06 : 0.025) * suerte;
    const p3 = (calidad >= 2 ? 0.22 : 0.1) * suerte;
    const n = r < p5 ? 5 : r < p5 + p3 ? 3 : 1;
    const premios: PremioCofre[] = [];
    let oro = 0;
    for (let k = 0; k < n; k++) {
      const evo = this.evolucionPosible(j);
      if (evo) {
        this.evolucionar(j, evo.de, evo.a);
        premios.push({ tipo: 'evolucion', id: evo.a, nivel: 1 });
        continue;
      }
      // Solo sube lo que ya tiene (como el original)
      const subibles: (['arma', IdArma] | ['pasiva', IdPasiva])[] = [
        ...j.armas.filter((a) => a.nivel < maxNivelArma(a.id)).map((a): ['arma', IdArma] => ['arma', a.id]),
        ...[...j.pasivas].filter(([id, nv]) => nv < PASIVAS[id].max).map(([id]): ['pasiva', IdPasiva] => ['pasiva', id]),
      ];
      const x = subibles.length ? this.az.uno(subibles) : null;
      if (!x) {
        const g = Math.round((12 + this.t / 30) * (1 + j.st.codicia));
        oro += g;
        premios.push({ tipo: 'oro', id: 'oro', nivel: g });
      } else if (x[0] === 'arma') {
        this.darArma(j, x[1]);
        premios.push({ tipo: 'arma', id: x[1], nivel: j.nivelArma(x[1]) });
      } else {
        this.darPasiva(j, x[1]);
        premios.push({ tipo: 'pasiva', id: x[1], nivel: j.pasivas.get(x[1]) ?? 1 });
      }
    }
    // Además, un chorrito de gotas doradas que salta del cofre
    const extra = Math.round((10 + this.t / 20) * (calidad >= 2 ? 2 : 1) * (1 + j.st.codicia) * (j.tieneCarta('transformice') ? 2 : 1));
    oro += extra;
    this.oro += oro;
    j.oro += oro;
    this.cofres++;
    this.recalcular(j);
    j.cofre = { jugador: j.i, premios, oro, calidad };
    this.emitir('cofre', j.x, j.y, j.i, n);
  }

  cerrarCofre(ji: number, n?: number) {
    const j = this.jug[ji];
    if (!this.vigente(j, n) || !j.cofre) return;
    j.acciones++;
    j.tEscoger = 0;
    j.cofre = null;
    const q = j.cofresPend.shift();
    if (q !== undefined) this.abrirCofreOCarta(j, q);
  }

  private abrirCofreOCarta(j: Jugador, calidad: number) {
    if (calidad === 3) {
      const libres = j.cartasLibres.filter((c) => !j.cartas.includes(c));
      if (libres.length) {
        const ops: IdCarta[] = [];
        while (ops.length < 3 && libres.length) ops.push(libres.splice(Math.floor(this.az.n() * libres.length), 1)[0]);
        j.cartaOpciones = ops;
        return;
      }
      calidad = 2;
    }
    this.abrirCofre(j, calidad);
  }

  escogerCarta(ji: number, id: IdCarta | null, n?: number) {
    const j = this.jug[ji];
    if (!this.vigente(j, n) || !j.cartaOpciones) return;
    j.acciones++;
    j.tEscoger = 0;
    if (id && j.cartaOpciones.includes(id) && !j.cartas.includes(id)) {
      j.cartas.push(id);
      this.aviso(`💌 ${cartaVista(id).nombre}`);
      if (id === 'octubre') {
        const extra = this.az.pesado(BASICAS.filter((a) => !j.armas.some((x) => x.id === a) && this.disponible(j, a)), (a) => ARMAS[a].rareza);
        if (extra && j.armas.length < MAX_RANURAS) this.darArma(j, extra);
      }
    }
    j.cartaOpciones = null;
    this.recalcular(j);
  }

  // ------------------------------------------------------------------------------------------------- Pausas
  /** Mientras alguien escoge cartas o abre un cofre, el juego se detiene (también para el otro). */
  get pausa(): 'nivel' | 'cofre' | 'carta' | null {
    for (const j of this.jug) if (j.cofre) return 'cofre';
    for (const j of this.jug) if (j.cartaOpciones) return 'carta';
    for (const j of this.jug) if (j.opciones) return 'nivel';
    return null;
  }

  // ------------------------------------------------------------------------------------------------- Paso
  paso(dt: number) {
    if (this.fin) return;
    // Pendientes de abrir (subió de nivel o recogió un cofre)
    for (const j of this.jug) {
      if (!j.opciones && !j.cofre && !j.cartaOpciones && j.nivelesPend > 0) {
        j.nivelesPend--;
        j.opciones = this.generarOpciones(j);
      }
      if (!j.opciones && !j.cofre && !j.cartaOpciones && j.cofresPend.length) this.abrirCofreOCarta(j, j.cofresPend.shift()!);
    }
    if (this.pausa) {
      this.escogerSolos(dt);
      return;
    }
    if (this.tGrito > 0 && (this.tGrito -= dt) <= 0) for (const j of this.jug) this.aviso(disfrazVisto(j.disfraz).grito, j.i);
    this.tReal += dt;
    const dReloj = dt * (this.apurado ? 2 : 1);
    const minAntes = Math.floor(this.t / 60);
    this.t += dReloj;
    if (Math.floor(this.t / 60) !== minAntes) for (const j of this.jug) if (j.tieneCarta('metaDiciembre')) this.recalcular(j);
    this.hielo = Math.max(0, this.hielo - dt);
    this.moverJugadores(dt);
    this.cartasTiempo(dt);
    if (!this.tutorial) {
      this.oleadas(dReloj);
      this.luces(dt);
    }
    this.rehacerRejilla();
    for (const j of this.jug) if (j.activo) actualizarArmas(this, j, dt);
    moverProyectiles(this, dt);
    moverZonas(this, dt);
    pendientesGolpe(this, dt);
    this.moverEnemigos(dt);
    this.recoger(dt);
    this.compactar();
    this.subirNivel();
    if (!this.tutorial) this.elitesExtra(dReloj);
    if (this.jug.every((j) => j.caido || j.fuera)) this.terminar();
  }

  /**
   * Con varios jugando, nadie frena a los demás más de la cuenta: a los que se fueron o están sin conexión se les
   * escoge de una, y a los demás, cuando se les acaba el tiempo, se les escoge lo que habría escogido el bot.
   */
  private escogerSolos(dt: number) {
    if (this.jug.length < 2) return;
    for (const j of this.jug) {
      if (!j.opciones && !j.cofre && !j.cartaOpciones) {
        j.tEscoger = 0;
        continue;
      }
      j.tEscoger += dt;
      const limite = j.fuera ? 0 : j.cofre ? LIMITE_COFRE : LIMITE_ESCOGER;
      if (j.tEscoger < limite) continue;
      j.tEscoger = 0;
      if (j.cofre) this.cerrarCofre(j.i);
      else if (j.cartaOpciones) this.escogerCarta(j.i, j.cartaOpciones[0] ?? null);
      else if (j.opciones) {
        let mejor = 0, v = -1e9;
        j.opciones.forEach((o, k) => {
          const x = valorOpcion(j, o);
          if (x > v) {
            v = x;
            mejor = k;
          }
        });
        this.escoger(j.i, mejor);
      }
    }
  }

  /** Lo que le falta a alguien para que se le escoja solo (para la interfaz). */
  restanteEscoger(j: Jugador) {
    if (this.jug.length < 2) return -1;
    return Math.max(0, (j.cofre ? LIMITE_COFRE : LIMITE_ESCOGER) - j.tEscoger);
  }

  private tElite = 0;
  /** Con tres o cuatro (y un poquito en pareja), élites extra con cofre cada tanto. */
  private elitesExtra(dReloj: number) {
    const cada = this.porJugadores('elite');
    if (!cada || this.gano || this.t < 90) return;
    this.tElite += dReloj;
    if (this.tElite < cada) return;
    this.tElite = 0;
    const j = this.objetivoAzar();
    if (!j) return;
    const ol = this.esc.oleadas[Math.min(this.esc.oleadas.length - 1, Math.floor(this.t / 60))];
    const tipo = ol.tipos[Math.floor(this.az.n() * ol.tipos.length)];
    if (ENEMIGOS[tipo].jefe) return;
    this.crear(tipo, this.puntoAfuera(j, 60), j, { elite: true, cofre: 1 });
  }

  /** Se retiraron desde la pausa (cobran igual, pero no los tumbaron). */
  retiro = false;

  terminar(retiro = false) {
    if (this.fin) return;
    this.fin = true;
    this.retiro = retiro;
  }

  // ------------------------------------------------------------------------------------------------- Jugadores
  private moverJugadores(dt: number) {
    const lim = this.esc.limites;
    for (const j of this.jug) {
      j.invul = Math.max(0, j.invul - dt);
      if (j.fuera) continue;
      if (j.caido) {
        // Burbujita: cualquiera que se quede a su lado la revive (dos al lado, más rápido)
        let cerca = 0;
        for (const o of this.jug) if (o !== j && o.activo && Math.hypot(o.x - j.x, o.y - j.y) < 48) cerca++;
        if (cerca) {
          j.rescate += (dt / 3) * Math.min(2, 1 + (cerca - 1) * 0.6);
          if (j.rescate >= 1) {
            j.caido = false;
            j.rescate = 0;
            j.vida = Math.round(j.vidaMax * 0.5);
            j.invul = 2.5;
            this.emitir('levanta', j.x, j.y, j.i);
          }
        } else j.rescate = Math.max(0, j.rescate - dt * 0.5);
        continue;
      }
      if (!j.remoto) {
        let mx = j.mx, my = j.my;
        const m = Math.hypot(mx, my);
        if (m > 1) {
          mx /= m;
          my /= m;
        }
        const v = VEL_JUGADOR * Math.max(0.2, 1 + j.st.movimiento);
        j.vx = mx * v;
        j.vy = my * v;
        j.x += j.vx * dt;
        j.y += j.vy * dt;
        if (m > 0.15) {
          j.dx = mx / Math.max(m, 1e-6);
          j.dy = my / Math.max(m, 1e-6);
          if (Math.abs(mx) > 0.12) j.mira = mx > 0 ? 1 : -1;
        }
      } else if (Math.hypot(j.vx, j.vy) > 5) {
        const m = Math.hypot(j.vx, j.vy);
        j.dx = j.vx / m;
        j.dy = j.vy / m;
        if (Math.abs(j.vx) > 8) j.mira = j.vx > 0 ? 1 : -1;
      }
      if (lim) j.y = Math.max(lim.yMin + 18, Math.min(lim.yMax - 18, j.y));
      j.quieto = Math.hypot(j.vx, j.vy) > 10 ? 0 : j.quieto + dt;
      // Recuperación (la de la carta de psicología cura el doble)
      if (j.st.recuperacion > 0 && j.vida < j.vidaMax) j.vida = Math.min(j.vidaMax, j.vida + j.st.recuperacion * dt * (j.tieneCarta('psicologia') ? 2 : 1));
      if (j.arranque > 0 && j.arranque - dt <= 0) this.aviso('🚀 Se acabó el arranque de cohete: ¡a pelear normal!', j.i);
      j.arranque = Math.max(0, j.arranque - dt);
      if (j.aji > 0) {
        j.aji -= dt;
        this.alientoAji(j, dt);
      }
    }
  }

  curar(j: Jugador, cuanto: number) {
    if (j.caido) return;
    const k = j.tieneCarta('psicologia') ? 2 : 1;
    const antes = j.vida;
    j.vida = Math.min(j.vidaMax, j.vida + cuanto * k);
    const curo = j.vida - antes;
    if (curo > 0.5) this.emitir('curar', j.x, j.y, curo, j.i);
    // Psicología: la curita revienta en espuma alrededor
    if (j.tieneCarta('psicologia') && cuanto >= 1) this.explotar(j.i, -1, 'cremaNoche', j.x, j.y, 90, cuanto * 12 * (1 + j.st.poder), 2);
  }

  herirJugador(j: Jugador, dano: number, e: Enemigo | null) {
    if (j.caido || j.invul > 0) return;
    const d = Math.max(1, dano - j.st.armadura);
    j.vida -= d;
    j.invul = 0.08;
    // (en el tutorial nadie se cae: se aprende tranquilo)
    if (this.tutorial) j.vida = Math.max(j.vidaMax * 0.25, j.vida);
    this.emitir('herido', j.x, j.y, j.i, d);
    // Un cumpleaños de reina: el que pega recibe su merecido
    if (e && j.tieneCarta('reina')) this.herir(e, 20 + j.st.armadura * 10, j.i, -1, 0, 0, false, 'gorro');
    if (j.vida > 0) return;
    if (j.revivesQuedan > 0) {
      j.revivesUsados++;
      j.vida = Math.round(j.vidaMax * 0.5);
      j.invul = 2.5;
      this.revivio = true;
      this.emitir('revive', j.x, j.y, j.i);
      // Al revivir empuja y limpia lo que tiene encima
      const n = this.rej.circulo(j.x, j.y, 200);
      for (let k = 0; k < n; k++) {
        const o = this.en[this.rej.fuera[k]];
        if (!o.vivo || o.luz) continue;
        if (!o.jefe) this.herir(o, 400, j.i, -1, o.x - j.x, o.y - j.y, false, 'curita');
      }
      return;
    }
    j.vida = 0;
    j.caido = true;
    j.rescate = 0;
    this.emitir('cae', j.x, j.y, j.i);
  }

  private alientoAji(j: Jugador, dt: number) {
    j.curado += dt;
    if (j.curado < 0.25) return;
    j.curado = 0;
    const ang = Math.atan2(j.dy, j.dx);
    this.emitir('fuego', j.x, j.y, ang);
    const n = this.rej.circulo(j.x, j.y, 190);
    for (let k = 0; k < n; k++) {
      const e = this.en[this.rej.fuera[k]];
      if (!e.vivo) continue;
      const ex = e.x - j.x, ey = e.y - j.y;
      const d = Math.hypot(ex, ey);
      if (d > 180 + e.r) continue;
      let a = Math.atan2(ey, ex) - ang;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      if (Math.abs(a) < 0.55) this.herir(e, 30 * (1 + j.st.poder), j.i, -1, ex, ey, false, 'aji');
    }
  }

  // ------------------------------------------------------------------------------------------------- Cartas que pasan con el tiempo
  private cartasTiempo(dt: number) {
    const algun = (c: IdCarta) => this.jug.some((j) => j.tieneCarta(c) && !j.caido);
    if (algun('buscarte')) {
      this.tLlamado -= dt;
      if (this.tLlamado <= 0) {
        this.tLlamado = 120;
        const j = this.jug.find((x) => x.tieneCarta('buscarte'))!;
        this.aviso('💞 ¡Te busqué por todos lados!');
        for (let k = 0; k < this.nVivos; k++) {
          const e = this.en[this.vivos[k]];
          if (e.luz) {
            const a = this.az.n() * Math.PI * 2, r = this.az.entre(140, 260);
            e.x = j.x + Math.cos(a) * r;
            e.y = j.y + Math.sin(a) * r;
          } else e.llamado = 6;
        }
      }
    }
    if (algun('primeraVez')) {
      this.tTiempo -= dt;
      if (this.tTiempo <= 0) {
        this.tTiempo = 60;
        this.hielo = Math.max(this.hielo, 4);
        this.emitir('congela', 0, 0, 4);
        this.aviso('⏳ El tiempo se detuvo…');
      }
    }
    for (const j of this.jug) {
      if (!j.tieneCarta('videollamadas')) continue;
      const b = Math.floor(this.tReal / 360) * 0.1;
      if (b !== j.bonoVideollamadas) {
        j.bonoVideollamadas = b;
        this.recalcular(j);
      }
    }
  }

  // ------------------------------------------------------------------------------------------------- Oleadas
  /** Cuánto más fuertes son los bichos por lo avanzada que va la lavada (1 hasta el minuto 14). */
  tarde() {
    return 1 + Math.max(0, this.t / 60 - 14) * TARDE_VIDA;
  }

  maldicion() {
    let m = 0;
    for (const j of this.jug) m = Math.max(m, j.st.maldicion);
    return 1 + m;
  }

  private oleadas(dReloj: number) {
    const esc = this.esc;
    // Eventos fijos
    while (this.iEvento < esc.eventos.length && esc.eventos[this.iEvento].t <= this.t) this.evento(esc.eventos[this.iEvento++]);
    // ¡Se acabó el agua caliente!
    if (this.t >= this.sigParca) {
      if (!this.gano) {
        this.gano = true;
        this.aviso('🥶 ¡Se acabó el agua caliente!');
        for (let k = 0; k < this.nVivos; k++) {
          const e = this.en[this.vivos[k]];
          if (!e.jefe && !e.luz) this.quitar(e);
        }
      }
      this.sigParca += 60;
      const j = this.objetivoAzar();
      if (j) this.crear('duchaHelada', this.puntoAfuera(j, 40), j, { jefe: true });
      this.emitir('jefe', 0, 0, INDICE_ENEMIGO.duchaHelada);
    }
    if (this.gano) return;
    const ol = esc.oleadas[Math.min(esc.oleadas.length - 1, Math.floor(this.t / 60))];
    const mal = this.maldicion();
    // Más jugadores, más mugrosos a la vez (cuentan los que están en pie: si caen, baja mientras los levantan)
    let enPie = 0;
    for (const j of this.jug) if (j.activo) enPie++;
    const pareja = POR_JUGADORES.densidad[Math.max(0, Math.min(3, enPie - 1))];
    // En el pasillo del lavamanos no hay para dónde huir arriba o abajo: llegan menos a la vez
    const densidad = esc.limites ? 0.5 : 1;
    this.tTanda -= dReloj * mal;
    let tandas = 0;
    while (this.tTanda <= 0 && tandas < 4) {
      tandas++;
      this.tTanda += ol.cada;
      for (const tipo of ol.tipos) if (densidad >= 1 || this.az.n() < densidad) this.crearComun(tipo);
    }
    if (this.tTanda < 0) this.tTanda = 0;
    const minimo = Math.round(ol.min * mal * pareja * densidad);
    let k = 0;
    while (this.nComunes < minimo && this.nVivos < MAX_ENEMIGOS && k < 40) {
      this.crearComun(ol.tipos[k % ol.tipos.length]);
      k++;
    }
  }

  private objetivoAzar(): Jugador | null {
    const vivos = this.jug.filter((j) => j.activo);
    return vivos.length ? this.az.uno(vivos) : null;
  }

  /** Un punto justo afuera de lo que ve el jugador (más bien hacia donde camina). */
  puntoAfuera(j: Jugador, margen = 50): [number, number] {
    const hw = j.vistaW / 2 + margen, hh = j.vistaH / 2 + margen;
    const lim = this.esc.limites;
    for (let intento = 0; intento < 6; intento++) {
      let x: number, y: number;
      const moviendo = Math.hypot(j.vx, j.vy) > 20 && this.az.n() < 0.45;
      if (moviendo) {
        const m = Math.hypot(j.vx, j.vy);
        const ux = j.vx / m, uy = j.vy / m;
        // Adelante, en el borde de la ventana, con algo de dispersión
        const s = Math.min(hw / Math.max(1e-3, Math.abs(ux)), hh / Math.max(1e-3, Math.abs(uy)));
        x = j.x + ux * s + this.az.entre(-0.3, 0.3) * hw * Math.abs(uy);
        y = j.y + uy * s + this.az.entre(-0.3, 0.3) * hh * Math.abs(ux);
      } else {
        const lado = this.az.n() * (hw + hh) * 2;
        if (lado < hw * 2) {
          x = j.x - hw + lado;
          y = j.y + (this.az.n() < 0.5 ? -hh : hh);
        } else {
          x = j.x + (this.az.n() < 0.5 ? -hw : hw);
          y = j.y - hh + (lado - hw * 2) * (hh / hw);
        }
      }
      if (lim) {
        if (y < lim.yMin + 20 || y > lim.yMax - 20) {
          y = Math.max(lim.yMin + 24, Math.min(lim.yMax - 24, y));
          x = j.x + (this.az.n() < 0.5 ? -hw : hw);
        }
      }
      return [x, y];
    }
    return [j.x + hw, j.y];
  }

  private crearComun(tipo: IdEnemigo) {
    if (this.nVivos >= MAX_ENEMIGOS) return;
    const j = this.objetivoAzar();
    if (!j) return;
    const def = ENEMIGOS[tipo];
    if (def.comp === 'enjambre' || def.comp === 'flotar') {
      // Solos también cruzan derechito
      const p = this.puntoAfuera(j);
      const e = this.crear(tipo, p, j);
      if (e) {
        const dx = j.x - e.x, dy = j.y - e.y, d = Math.hypot(dx, dy) || 1;
        e.dx = dx / d;
        e.dy = dy / d;
        e.vence = this.tReal + 14;
      }
      return;
    }
    this.crear(tipo, this.puntoAfuera(j), j);
  }

  crear(tipo: IdEnemigo, p: [number, number], j: Jugador | null, o: { elite?: boolean; jefe?: boolean; fijo?: boolean; cofre?: number } = {}): Enemigo | null {
    let e: Enemigo | null = null;
    for (let i = 0; i < POOL_EN; i++) {
      const c = this.en[(this.sigUid + i) % POOL_EN];
      if (!c.vivo) {
        e = c;
        break;
      }
    }
    if (!e) return null;
    const def = ENEMIGOS[tipo];
    const mal = this.maldicion();
    e.vivo = true;
    e.uid = this.sigUid++;
    e.tipo = tipo;
    e.ti = INDICE_ENEMIGO[tipo];
    e.def = def;
    e.x = p[0];
    e.y = p[1];
    e.kx = e.ky = e.vx = e.vy = 0;
    e.elite = !!o.elite;
    e.jefe = !!def.jefe || !!o.jefe;
    e.esc = e.elite ? 1.8 : 1;
    e.r = def.radio * e.esc;
    // Después del minuto 14 el agua se pone más mugrosa: los bichos aguantan más y pegan más duro (sin la tienda
    // de poderes no se llega a los 30 minutos, como en el original)
    const tarde = this.tarde();
    const kv = this.porJugadores('vida');
    let hp = def.vida * mal * tarde * kv;
    if (def.jefe && tipo !== 'duchaHelada') hp = def.vida * Math.max(1, this.nivel) * mal * this.porJugadores('jefe');
    if (e.elite) hp = (def.vida * 16 * mal * tarde + 40 * this.nivel) * kv;
    e.hp = e.hpMax = hp;
    e.cofre = o.cofre ?? (e.elite || (def.jefe && tipo !== 'duchaHelada') ? 1 : 0);
    e.luz = false;
    e.congelado = e.lento = e.flash = e.toque = 0;
    e.hz.fill(0);
    e.fase = this.az.n() * 10;
    e.dx = e.dy = 0;
    e.vence = 0;
    e.fijo = !!o.fijo || e.jefe;
    e.estado = 0;
    e.et = this.az.entre(1, 3);
    e.llamado = 0;
    this.vivos[this.nVivos++] = this.en.indexOf(e);
    if (!e.jefe && !e.elite) this.nComunes++;
    if (j && e.jefe) this.emitir('jefe', e.x, e.y, e.ti);
    return e;
  }

  private evento(ev: EventoOleada) {
    const j = this.objetivoAzar();
    if (!j) return;
    if (ev.aviso) this.aviso(ev.aviso);
    const def = ENEMIGOS[ev.enemigo];
    const cant = Math.round((ev.cant ?? 1) * this.porJugadores('evento'));
    switch (ev.tipo) {
      case 'jefe':
      case 'carta': {
        const e = this.crear(ev.enemigo, this.puntoAfuera(j, 60), j, { jefe: true, cofre: ev.tipo === 'carta' ? 3 : 2 });
        if (e && ev.tipo === 'carta') {
          e.hp = e.hpMax = def.vida * Math.max(1, this.nivel) * 0.7 * this.maldicion() * this.porJugadores('jefe');
        }
        break;
      }
      case 'elite': {
        this.crear(ev.enemigo, this.puntoAfuera(j, 60), j, { elite: true, cofre: 1 });
        break;
      }
      case 'enjambre':
      case 'flotar': {
        // Cruzan la pantalla en línea recta (o en ondas) y se van
        const a = this.az.n() * Math.PI * 2;
        const ux = Math.cos(a), uy = Math.sin(a);
        const lim = this.esc.limites;
        const lejos = Math.max(j.vistaW, j.vistaH) * 0.62;
        const cx = j.x - ux * lejos, cy = j.y - uy * lejos;
        for (let k = 0; k < cant; k++) {
          const lado = (k % 6) - 2.5, fila = Math.floor(k / 6);
          let y = cy - ux * lado * 26 - uy * fila * 30 + this.az.entre(-6, 6);
          const x = cx + uy * lado * 26 - ux * fila * 30 + this.az.entre(-6, 6);
          if (lim) y = Math.max(lim.yMin + 20, Math.min(lim.yMax - 20, y));
          const e = this.crear(ev.enemigo, [x, y], j, { fijo: true });
          if (!e) break;
          e.dx = ux;
          e.dy = uy;
          e.vence = this.tReal + 16;
          e.estado = ev.tipo === 'flotar' ? 1 : 2;
          e.fase = k * 0.7;
        }
        break;
      }
      case 'anillo': {
        const r = Math.max(j.vistaW, j.vistaH) * 0.55;
        for (let k = 0; k < cant; k++) {
          const a = (k / cant) * Math.PI * 2;
          const e = this.crear(ev.enemigo, [j.x + Math.cos(a) * r, j.y + Math.sin(a) * r * 0.75], j, { fijo: true });
          if (!e) break;
          e.estado = 3;
        }
        break;
      }
      case 'muro': {
        const izq = this.az.n() < 0.5;
        const x0 = j.x + (izq ? -1 : 1) * (j.vistaW / 2 + 60);
        const alto = this.esc.limites ? this.esc.limites.yMax - this.esc.limites.yMin - 40 : j.vistaH * 1.3;
        const y0 = this.esc.limites ? this.esc.limites.yMin + 20 : j.y - alto / 2;
        for (let k = 0; k < cant; k++) {
          const e = this.crear(ev.enemigo, [x0 + (izq ? -1 : 1) * (k % 2) * 30, y0 + (k / cant) * alto], j, { fijo: true });
          if (!e) break;
          e.dx = izq ? 1 : -1;
          e.dy = 0;
          e.estado = 2;
          e.vence = this.tReal + 30;
        }
        break;
      }
    }
  }

  // ------------------------------------------------------------------------------------------------- Velitas (las fuentes de luz)
  private luces(dt: number) {
    this.tLuces -= dt;
    if (this.tLuces > 0) return;
    this.tLuces = 0.5;
    const lim = this.esc.limites;
    const sem = this.esc.id === 'cara' ? 11 : this.esc.id === 'lavamanos' ? 23 : 37;
    for (const j of this.jug) {
      if (j.fuera) continue;
      const cx0 = Math.floor(j.x / CELDA_LUZ), cy0 = Math.floor(j.y / CELDA_LUZ);
      for (let cy = cy0 - 2; cy <= cy0 + 2; cy++)
        for (let cx = cx0 - 2; cx <= cx0 + 2; cx++) {
          const clave = cx * 100003 + cy;
          if (this.celdaLuz.has(clave)) continue;
          const roto = this.lucesRotas.get(clave);
          if (roto !== undefined && this.tReal - roto < 75) continue;
          if (hash2(cx, cy, sem) > 0.5) continue;
          const x = (cx + 0.15 + hash2(cx, cy, sem + 1) * 0.7) * CELDA_LUZ;
          let y = (cy + 0.15 + hash2(cx, cy, sem + 2) * 0.7) * CELDA_LUZ;
          if (lim) {
            if (y < lim.yMin + 40 || y > lim.yMax - 40) continue;
            y = Math.max(lim.yMin + 50, Math.min(lim.yMax - 50, y));
          }
          // Que no aparezca de la nada a la vista
          if (this.jug.some((o) => !o.fuera && o.enVista(x, y, 20)) && this.tReal > 1) continue;
          const e = this.crear('germen', [x, y], null, { fijo: true });
          if (!e) continue;
          this.nComunes--;
          e.luz = true;
          e.hp = e.hpMax = 1;
          e.r = 14;
          e.esc = 1;
          e.estado = clave;
          e.cofre = 0;
          e.fase = hash2(cx, cy, sem + 3);
          this.celdaLuz.set(clave, e.uid);
        }
    }
    // Las que quedaron lejísimos se guardan (vuelven a salir cuando se acerque)
    for (let k = 0; k < this.nVivos; k++) {
      const e = this.en[this.vivos[k]];
      if (!e.luz) continue;
      let cerca = false;
      for (const j of this.jug) if (!j.fuera && Math.abs(e.x - j.x) < CELDA_LUZ * 3.5 && Math.abs(e.y - j.y) < CELDA_LUZ * 3.5) cerca = true;
      if (!cerca) {
        this.celdaLuz.delete(e.estado);
        e.vivo = false;
      }
    }
  }

  private romperLuz(e: Enemigo, ji: number) {
    this.velitas++;
    this.lucesRotas.set(e.estado, this.tReal);
    this.celdaLuz.delete(e.estado);
    this.emitir('romper', e.x, e.y, e.fase);
    const j = this.jug[ji] ?? this.jug[0];
    const suerte = 1 + (j?.st.suerte ?? 0);
    const tipo = this.az.pesado(SUELTA_LUZ, (x) => x[1] * (x[2] ? suerte : 1))![0];
    this.soltar(tipo, e.x, e.y);
    if (this.jug.some((x) => x.tieneCarta('cartagena'))) this.explotar(ji, -1, 'aji', e.x, e.y, 130, 240 * (1 + (j?.st.poder ?? 0)), 1);
  }

  soltar(tipo: IdObjeto, x: number, y: number, calidad = 0): Objeto | null {
    for (const o of this.objs) {
      if (o.vivo) continue;
      o.vivo = true;
      o.tipo = tipo;
      o.x = x;
      o.y = y;
      o.jalado = -1;
      o.v = 0;
      o.calidad = calidad;
      o.dueno = -1;
      o.t = 0;
      return o;
    }
    return null;
  }

  // ------------------------------------------------------------------------------------------------- Enemigos
  rehacerRejilla() {
    this.rej.limpiar();
    for (let k = 0; k < this.nVivos; k++) {
      const i = this.vivos[k];
      const e = this.en[i];
      if (e.vivo) this.rej.insertar(i, e.x, e.y);
    }
  }

  /** El jugador vivo más cercano. */
  cercano(x: number, y: number): Jugador | null {
    let mejor: Jugador | null = null;
    let d = Infinity;
    for (const j of this.jug) {
      if (!j.activo) continue;
      const dd = (j.x - x) ** 2 + (j.y - y) ** 2;
      if (dd < d) {
        d = dd;
        mejor = j;
      }
    }
    return mejor;
  }

  private moverEnemigos(dt: number) {
    const lim = this.esc.limites;
    const mal = this.maldicion();
    const congelados = this.hielo > 0;
    for (let k = 0; k < this.nVivos; k++) {
      const e = this.en[this.vivos[k]];
      if (!e.vivo || e.luz) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.toque = Math.max(0, e.toque - dt);
      e.fase += dt;
      e.llamado = Math.max(0, e.llamado - dt);
      const quieto = (congelados && e.def.congelable) || e.congelado > 0;
      e.congelado = Math.max(0, e.congelado - dt);
      e.lento = Math.max(0, e.lento - dt);
      const ox = e.x, oy = e.y;
      // Empuje de los golpes (se va frenando)
      e.x += e.kx * dt;
      e.y += e.ky * dt;
      const fr = Math.exp(-dt * 9);
      e.kx *= fr;
      e.ky *= fr;
      const j = this.cercano(e.x, e.y);
      if (!quieto && j) {
        let v = e.def.vel * (e.def.comp === 'parca' ? 1 : mal) * (e.lento > 0 ? 0.5 : 1) * (e.llamado > 0 ? 2 : 1);
        if (e.elite) v *= 0.85;
        let ux = j.x - e.x, uy = j.y - e.y;
        const d = Math.hypot(ux, uy) || 1;
        ux /= d;
        uy /= d;
        if (e.estado === 1 || e.estado === 2) {
          // Cruzan: derechito (2) o en ondas (1), sin perseguir
          ux = e.dx;
          uy = e.dy;
          if (e.estado === 1) {
            const s = Math.sin(e.fase * 3) * 0.9;
            ux = e.dx - e.dy * s;
            uy = e.dy + e.dx * s;
          }
          v *= 1.15;
          if (this.tReal > e.vence) {
            this.quitar(e);
            continue;
          }
        } else if (e.estado === 3) {
          v *= 0.6;
        } else {
          switch (e.def.comp) {
            case 'revolotear': {
              const s = Math.sin(e.fase * 4 + e.uid) * 0.6;
              const nx = ux - uy * s, ny = uy + ux * s;
              ux = nx;
              uy = ny;
              break;
            }
            case 'saltar': {
              // Brinca un rato y descansa
              const c = (e.fase * 1.6 + e.uid * 0.37) % 1;
              v *= c < 0.45 ? 2.1 : 0.15;
              break;
            }
            case 'embestir': {
              e.et -= dt;
              if (e.estado === 0 && e.et <= 0) {
                e.estado = 4;
                e.et = 0.55;
                e.dx = ux;
                e.dy = uy;
              }
              if (e.estado === 4) {
                v = e.et > 0.35 ? 0 : v * 3.6;
                ux = e.dx;
                uy = e.dy;
                if (e.et <= 0) {
                  e.estado = 0;
                  e.et = e.jefe ? this.az.entre(2.5, 4) : this.az.entre(1.5, 3);
                }
              } else v *= 0.8;
              break;
            }
            case 'flotar': {
              if (e.dx || e.dy) {
                const s = Math.sin(e.fase * 3) * 0.9;
                ux = e.dx - e.dy * s;
                uy = e.dy + e.dx * s;
                if (e.vence && this.tReal > e.vence) {
                  this.quitar(e);
                  continue;
                }
              }
              break;
            }
            case 'enjambre': {
              if (e.dx || e.dy) {
                ux = e.dx;
                uy = e.dy;
                if (e.vence && this.tReal > e.vence) {
                  this.quitar(e);
                  continue;
                }
              }
              break;
            }
          }
        }
        e.x += ux * v * dt;
        e.y += uy * v * dt;
      }
      // Que no se apilen todos en el mismo punto (empujoncito entre vecinos de la misma celda)
      if (!e.jefe) {
        const n = this.rej.circulo(e.x, e.y, e.r * 1.2);
        let empujes = 0;
        for (let q = 0; q < n && empujes < 4; q++) {
          const o = this.en[this.rej.fuera[q]];
          if (o === e || !o.vivo || o.luz) continue;
          const dx = e.x - o.x, dy = e.y - o.y;
          const min = (e.r + o.r) * 0.7;
          const d2 = dx * dx + dy * dy;
          if (d2 < min * min && d2 > 1e-4) {
            const d = Math.sqrt(d2);
            const f = ((min - d) / d) * 0.35;
            e.x += dx * f;
            e.y += dy * f;
            empujes++;
          }
        }
      }
      if (lim) e.y = Math.max(lim.yMin + e.r * 0.6, Math.min(lim.yMax - e.r * 0.6, e.y));
      e.vx = (e.x - ox) / Math.max(dt, 1e-4);
      e.vy = (e.y - oy) / Math.max(dt, 1e-4);
      // Toca a alguien
      if (!quieto) {
        for (const p of this.jug) {
          if (!p.activo) continue;
          const dx = p.x - e.x, dy = p.y - e.y;
          const rr = e.r * 0.85 + RADIO_JUGADOR;
          if (dx * dx + dy * dy < rr * rr && e.toque <= 0) {
            e.toque = 0.5;
            this.herirJugador(p, e.def.dano * (1 + (this.tarde() - 1) * TARDE_DANO), e);
          }
        }
      }
      // Muy lejos de todos: vuelve a aparecer adelante (como en el original)
      if (!e.fijo && j) {
        let lejos = true;
        for (const p of this.jug) {
          if (!p.activo) continue;
          if (Math.abs(e.x - p.x) < p.vistaW * 0.95 && Math.abs(e.y - p.y) < p.vistaH * 1.2) lejos = false;
        }
        if (lejos) {
          const pto = this.puntoAfuera(j, 40);
          e.x = pto[0];
          e.y = pto[1];
        }
      } else if (e.fijo && !e.jefe && j && Math.hypot(e.x - j.x, e.y - j.y) > 2600) this.quitar(e);
    }
  }

  /** Lo quita sin premio (enjambres que se fueron, la toallita, la llegada de la Ducha Helada). */
  quitar(e: Enemigo) {
    if (!e.vivo) return;
    e.vivo = false;
    if (!e.jefe && !e.elite && !e.luz) this.nComunes--;
  }

  /** Cada golpe pasa por aquí. kx, ky: hacia dónde empuja. */
  herir(e: Enemigo, dano: number, ji: number, slot: number, kx: number, ky: number, crit: boolean, arma: IdArma | IdPasiva | 'aji'): void {
    if (!e.vivo) return;
    if (e.luz) {
      e.vivo = false;
      this.romperLuz(e, ji);
      return;
    }
    const j = this.jug[ji];
    let d = dano;
    if (j && (e.congelado > 0 || this.hielo > 0) && j.tieneCarta('primeraVez')) d *= 1.5;
    e.hp -= d;
    e.flash = 0.13;
    if (j && slot >= 0) {
      const a = j.armas[slot];
      if (a) {
        const r = j.danos.get(a.id);
        if (r) r.dano += d;
      }
    }
    this.emitir('golpe', e.x, e.y - e.r * 0.4, d, crit ? 1 : 0, e.uid);
    if (e.def.retro > 0 && (kx || ky)) {
      const m = Math.hypot(kx, ky) || 1;
      const f = 150 * e.def.retro * (e.elite ? 0.4 : 1);
      e.kx += (kx / m) * f;
      e.ky += (ky / m) * f;
    }
    if (e.hp <= 0) this.matar(e, ji, false);
  }

  matar(e: Enemigo, ji: number, borrado: boolean) {
    if (!e.vivo) return;
    this.quitar(e);
    this.eliminados++;
    this.bestiario[e.tipo] = (this.bestiario[e.tipo] ?? 0) + 1;
    this.emitir('muere', e.x, e.y, e.ti, e.esc * (e.jefe ? 2.4 : 1), e.elite ? 1 : 0);
    const j = this.jug[ji];
    if (e.jefe && !this.jefes.includes(e.tipo)) this.jefes.push(e.tipo);
    if (e.cofre) {
      // Con varios, el cofre del jefe sale repetido: uno para cada uno, con su color (los de élite, de quien llegue)
      const duenos = e.jefe && e.cofre >= 2 ? this.jug.filter((x) => !x.fuera) : [];
      if (duenos.length > 1) {
        duenos.forEach((x, k) => {
          const a = (k / duenos.length) * Math.PI * 2;
          const o = this.soltar('cofre', e.x + Math.cos(a) * 34, e.y + Math.sin(a) * 26, e.cofre);
          if (o) o.dueno = x.i;
        });
      } else this.soltar('cofre', e.x, e.y, e.cofre);
    }
    if (borrado) return;
    // La experiencia
    let xp = e.def.xp * (e.elite ? 12 : 1);
    if (e.jefe) xp = e.def.xp + this.nivel * 3;
    this.gema(e.x, e.y, xp);
    if (j) {
      // Espuma devoradora: crece con cada uno que se traga
      for (const a of j.armas) if (a.id === 'espumaDevoradora') a.k = Math.min(70, a.k + 0.4);
      if (j.tieneCarta('cartagena')) {
        j.eliminadosCarta++;
        if (j.eliminadosCarta % 10 === 0) this.explotar(ji, -1, 'aji', e.x, e.y, 70, 35 * (1 + j.st.poder), 1);
      }
    }
  }

  /** Daño en un círculo (explosiones de jabón, luces de diciembre, Cartagena…). */
  explotar(ji: number, slot: number, arma: IdArma | IdPasiva | 'aji', x: number, y: number, r: number, dano: number, tipo: number) {
    this.emitir('explosion', x, y, r, 0, 0, tipo);
    const n = this.rej.circulo(x, y, r + 40);
    for (let k = 0; k < n; k++) this.tmp[k] = this.rej.fuera[k];
    for (let k = 0; k < n; k++) {
      const e = this.en[this.tmp[k]];
      if (!e.vivo) continue;
      const dx = e.x - x, dy = e.y - y;
      if (dx * dx + dy * dy < (r + e.r) ** 2) this.herir(e, dano, ji, slot, dx, dy, false, arma);
    }
  }

  // ------------------------------------------------------------------------------------------------- Gotitas y cosas del piso
  gema(x: number, y: number, xp: number) {
    if (this.nGemas >= MAX_GEMAS) {
      // Demasiadas: todo va a la gema roja grande
      const g = this.gemaGrande >= 0 ? this.gemas[this.gemaGrande] : null;
      if (g && g.vivo && g.tipo === 3) {
        g.xp += xp;
        return;
      }
      const libre = this.gemas[MAX_GEMAS];
      libre.vivo = true;
      libre.x = x;
      libre.y = y;
      libre.xp = xp;
      libre.tipo = 3;
      libre.jalada = -1;
      libre.v = 0;
      libre.t = 0;
      this.gemaGrande = MAX_GEMAS;
      return;
    }
    for (let i = 0; i < MAX_GEMAS; i++) {
      const g = this.gemas[i];
      if (g.vivo) continue;
      g.vivo = true;
      g.x = x + this.az.entre(-4, 4);
      g.y = y + this.az.entre(-4, 4);
      g.xp = xp;
      g.tipo = xp >= 10 ? 2 : xp >= 3 ? 1 : 0;
      g.jalada = -1;
      g.v = 0;
      g.t = 0;
      this.nGemas++;
      return;
    }
  }

  sumarOro(n: number, j: Jugador | null) {
    const k = j?.tieneCarta('transformice') ? 2 : 1;
    const g = Math.round(n * (1 + (j?.st.codicia ?? 0)) * k);
    this.oro += g;
    if (j) j.oro += g;
    return g;
  }

  private recoger(dt: number) {
    for (let i = 0; i <= MAX_GEMAS; i++) {
      const g = this.gemas[i];
      if (!g.vivo) continue;
      g.t += dt;
      if (g.jalada < 0) {
        for (const j of this.jug) {
          if (!j.activo) continue;
          const r = IMAN_BASE * (1 + j.st.iman);
          const dx = j.x - g.x, dy = j.y - g.y;
          if (dx * dx + dy * dy < r * r) {
            g.jalada = j.i;
            g.v = -90;
            break;
          }
        }
        continue;
      }
      const j = this.jug[g.jalada];
      if (!j.activo) {
        g.jalada = -1;
        continue;
      }
      g.v += 900 * dt;
      const dx = j.x - g.x, dy = j.y - g.y, d = Math.hypot(dx, dy) || 1;
      g.x += (dx / d) * g.v * dt;
      g.y += (dy / d) * g.v * dt;
      if (d < 14) {
        g.vivo = false;
        if (i < MAX_GEMAS) this.nGemas--;
        else this.gemaGrande = -1;
        this.xp += g.xp * (1 + j.st.crecimiento);
        this.emitir('gema', g.x, g.y, g.tipo, j.i);
      }
    }
    for (const o of this.objs) {
      if (!o.vivo) continue;
      o.t += dt;
      if (o.jalado < 0) {
        for (const j of this.jug) {
          if (!j.activo || (o.dueno >= 0 && o.dueno !== j.i)) continue;
          const r = o.tipo === 'cofre' ? 26 : Math.max(26, IMAN_BASE * (1 + j.st.iman) * 0.6);
          const dx = j.x - o.x, dy = j.y - o.y;
          if (dx * dx + dy * dy < r * r) {
            o.jalado = j.i;
            o.v = o.tipo === 'cofre' ? 200 : -60;
            break;
          }
        }
        continue;
      }
      const j = this.jug[o.jalado];
      o.v += 700 * dt;
      const dx = j.x - o.x, dy = j.y - o.y, d = Math.hypot(dx, dy) || 1;
      o.x += (dx / d) * o.v * dt;
      o.y += (dy / d) * o.v * dt;
      if (d < 14) {
        o.vivo = false;
        this.tomar(j, o);
      }
    }
  }

  private tomar(j: Jugador, o: Objeto) {
    switch (o.tipo) {
      case 'arepa':
        this.arepas++;
        this.curar(j, 30);
        break;
      case 'ola':
        this.aviso('🌊 ¡Agua fría! Todo limpio');
        this.emitir('limpiar', j.x, j.y, 0);
        for (let k = 0; k < this.nVivos; k++) {
          const e = this.en[this.vivos[k]];
          if (!e.vivo || e.jefe || e.luz) continue;
          if (j.enVista(e.x, e.y, 80)) this.matar(e, j.i, false);
        }
        break;
      case 'hielo':
        this.aviso('🧊 ¡Todos congelados!');
        this.hielo = 10;
        this.emitir('congela', j.x, j.y, 10);
        break;
      case 'aspiradora':
        this.aviso('🌀 ¡Aspiradora! Todas las gotitas para ti');
        for (const g of this.gemas) if (g.vivo) {
          g.jalada = j.i;
          g.v = 120;
        }
        break;
      case 'moneda':
      case 'bolsa':
      case 'frasco': {
        const n = this.sumarOro(o.tipo === 'moneda' ? 1 : o.tipo === 'bolsa' ? 10 : 25, j);
        this.emitir('moneda', o.x, o.y, n, j.i);
        if (j.tieneCarta('transformice')) this.curar(j, o.tipo === 'moneda' ? 1 : 4);
        break;
      }
      case 'trebolito':
        j.bonoSuerte += 0.1;
        this.recalcular(j);
        this.aviso('🍀 +10 % de suerte');
        break;
      case 'aji':
        j.aji = 10;
        this.aviso('🌶️ ¡Ají pique! A escupir fuego');
        break;
      case 'cofre':
        if (j.opciones || j.cofre || j.cartaOpciones) j.cofresPend.push(o.calidad);
        else this.abrirCofreOCarta(j, o.calidad);
        break;
    }
  }

  private subirNivel() {
    let subio = false;
    while (this.xp >= xpPara(this.nivel)) {
      this.xp -= xpPara(this.nivel);
      this.nivel++;
      subio = true;
      for (const j of this.jug) {
        j.nivelesPend++;
        // La habilidad del disfraz se nota: aviso cuando crece
        if (j.disfraz.alCrecer && this.crecioEn(j, this.nivel)) this.aviso(disfrazVisto(j.disfraz).alCrecer ?? '', j.i);
      }
    }
    if (!subio) return;
    this.emitir('nivel', 0, 0, this.nivel);
    for (const j of this.jug) {
      this.recalcular(j);
      if (!j.opciones && !j.cofre && !j.cartaOpciones && j.nivelesPend > 0) {
        j.nivelesPend--;
        j.opciones = this.generarOpciones(j);
      }
    }
  }

  private compactar() {
    let n = 0;
    let comunes = 0;
    for (let k = 0; k < this.nVivos; k++) {
      const i = this.vivos[k];
      const e = this.en[i];
      if (!e.vivo) continue;
      this.vivos[n++] = i;
      if (!e.jefe && !e.elite && !e.luz) comunes++;
    }
    this.nVivos = n;
    this.nComunes = comunes;
  }

  // ------------------------------------------------------------------------------------------------- Final
  /** Las gotas doradas que se lleva cada uno: solo, todas; con más, lo suyo + la cuarta parte de lo de los demás. */
  oroDe(ji: number) {
    const j = this.jug[ji];
    if (!j || this.jug.length < 2) return this.oro;
    return Math.round(j.oro + Math.max(0, this.oro - j.oro) * 0.25);
  }

  resumen(ji = 0, pareja = false): ResumenPartida {
    const j = this.jug[ji];
    return {
      escenario: this.esc.id,
      segundos: this.t,
      gano: this.gano,
      retiro: this.retiro,
      apurado: this.apurado,
      nivel: this.nivel,
      eliminados: this.eliminados,
      oro: this.oroDe(ji),
      cofres: this.cofres,
      velitas: this.velitas,
      arepas: this.arepas,
      evoluciones: [...this.evoluciones],
      jefes: [...this.jefes],
      armas: [...this.armasVistas],
      pasivas: [...this.pasivasVistas],
      bestiario: { ...this.bestiario },
      disfraz: j?.disfraz.id ?? '',
      pareja,
      revivio: this.revivio,
      danos: j ? [...j.danos].map(([arma, r]) => ({ arma, dano: Math.round(r.dano), desde: r.desde, nivel: j.nivelArma(arma) })) : [],
    };
  }
}

function oj(o: OpcionesMotor, i: number) {
  return o.jugadores[i];
}
