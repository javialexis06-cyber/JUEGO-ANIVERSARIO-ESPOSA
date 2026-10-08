// Un jugador dentro de la expedición: posición, vida, nivel, armas, mejoras, objetos, equipo, reliquias,
// bendiciones, dones de su clase y el estado de su mecánica. Sus estadísticas finales se recalculan cuando algo cambia.
import { ARMAS, MAX_SOBRECARGAS, NIVELES_SOBRECARGA, NIVEL_MAX_ARMA, xpArma } from '../datos/armas';
import { BENDICION, EQUIPO, OBJETO } from '../datos/botin';
import { CLASES } from '../datos/clases';
import {
  ETIQUETAS, F, nuevasStats, type DanoEtiqueta, type DefArma, type Eleccion, type Etiqueta, type IdClase, type ParamsArma, type PerfilJugador,
  type RanuraEquipo, type Stats,
} from '../tipos';
import { statsDeClase } from './mecanicas';

export const RADIO_JUGADOR = 0.34;
export const VEL_BASE = 4.0;
export const IMAN_BASE = 1.7;
export const LUZ_BASE = 6.5;

/** Bits de etiqueta (para sumar el daño por etiqueta rápido). */
export const BIT_ETQ: Record<Etiqueta, number> = Object.fromEntries(ETIQUETAS.map((e, i) => [e, 1 << i])) as Record<Etiqueta, number>;

/** Experiencia para pasar del nivel n al n+1. */
export const xpPara = (n: number) => Math.round(7 + 6 * (n - 1) + 0.42 * (n - 1) ** 2);

/** Comportamientos en los que «cantidad» es cuántos proyectiles salen (en los demás da más área). */
const CUENTA: Record<string, boolean> = { proyectil: true, lanzado: true, bumeran: true, orbita: true, rayo: true, cadena: true, torreta: true };

export class ArmaJ {
  def: DefArma;
  nivel = 1;
  xp = 0;
  sobrecargas: string[] = [];
  /** Tiempo para el próximo ataque. */
  t = 0.3;
  /** Alternar de lado (látigos). */
  lado = 1;
  p!: ParamsArma;
  etq = 0;
  sucio = true;
  danoTotal = 0;
  /** Ya pidió la sobrecarga de este hito (6, 12, 18). */
  pedidas = 0;
  /** Para las órbitas: ángulo actual. */
  giro = 0;
  /** Disparo pendiente (doble golpe). */
  repetir = 0;
  repetirT = 0;

  constructor(public id: string) {
    this.def = ARMAS[id];
  }

  /** Las etiquetas especiales que le dieron sus sobrecargas malditas (a dos manos, de cinto, consentida, gorda). */
  get especiales(): Etiqueta[] {
    const r: Etiqueta[] = [];
    for (const id of this.sobrecargas) {
      const s = this.def.sobrecargas.find((x) => x.id === id);
      if (s?.maldita && s.etiqueta) r.push(s.etiqueta);
    }
    return r;
  }

  /** Recalcula los parámetros con el nivel, las sobrecargas y las estadísticas del jugador. `otras` multiplica el daño
   *  por lo que le hacen las demás armas (las de cinto suben a las otras; la consentida las baja). */
  calcular(st: Stats, otras = 1) {
    const d = this.def;
    const p: ParamsArma = { ...d.base };
    const L = this.nivel;
    p.dano *= 1 + 0.1 * (L - 1);
    p.cadencia *= Math.pow(0.985, L - 1);
    const hitos = (L >= 3 ? 1 : 0) + (L >= 9 ? 1 : 0) + (L >= 15 ? 1 : 0);
    if (CUENTA[d.tipo]) p.cantidad += d.tipo === 'cadena' ? hitos * 2 : hitos;
    else p.area *= 1 + 0.15 * hitos;
    let etq = 0;
    for (const e of d.etiquetas) etq |= BIT_ETQ[e];
    for (const id of this.sobrecargas) {
      const s = d.sobrecargas.find((x) => x.id === id);
      if (!s) continue;
      if (s.por) for (const [k, v] of Object.entries(s.por)) (p as any)[k] *= v as number;
      if (s.mas) for (const [k, v] of Object.entries(s.mas)) (p as any)[k] += v as number;
      if (s.flags) p.flags |= s.flags;
      if (s.etiqueta) etq |= BIT_ETQ[s.etiqueta];
    }
    // Maestría: las tres sobrecargas y el nivel máximo
    if (this.sobrecargas.length >= 3 && L >= NIVEL_MAX_ARMA) p.dano *= 1.25;
    // Estadísticas del jugador
    const areaMult = 1 + st.area;
    if (d.tipo === 'estocada' || d.tipo === 'latigo' || d.tipo === 'cono') {
      p.alcance *= Math.sqrt(areaMult);
      p.area *= Math.sqrt(areaMult);
    } else p.area *= areaMult;
    if (CUENTA[d.tipo]) p.cantidad += st.cantidad;
    else if (st.cantidad > 0 && d.tipo !== 'aura') p.cantidad += st.cantidad;
    else if (st.cantidad > 0) p.area *= 1 + 0.1 * st.cantidad;
    p.cantidad = Math.max(1, Math.round(p.cantidad));
    p.vel *= 1 + st.velProy;
    p.duracion *= 1 + st.duracion;
    p.alcance *= 1 + st.alcance;
    p.critico += st.critico;
    p.cadencia = Math.max(0.08, p.cadencia / Math.max(0.3, 1 + st.cadencia));
    p.dano *= otras;
    // Bala gorda: todo en uno solo, enorme (sin proyectiles: un golpe enorme y más lento)
    if (etq & BIT_ETQ.gorda) {
      if (CUENTA[d.tipo]) {
        p.dano *= Math.max(1, p.cantidad) * 1.15;
        p.area *= 1.5;
        p.cantidad = 1;
        p.perfora += 3;
        p.flags |= F.GORDA;
      } else {
        p.area *= 1.5;
        p.dano *= 1.4;
        p.cadencia *= 1.35;
      }
    }
    this.p = p;
    this.etq = etq;
    this.sucio = false;
  }

  /** Suma experiencia; devuelve true si subió de nivel. */
  ganarXp(x: number): boolean {
    if (this.nivel >= NIVEL_MAX_ARMA) return false;
    this.xp += x;
    let subio = false;
    while (this.nivel < NIVEL_MAX_ARMA && this.xp >= xpArma(this.nivel)) {
      this.xp -= xpArma(this.nivel);
      this.nivel++;
      subio = true;
    }
    if (subio) this.sucio = true;
    return subio;
  }

  /** ¿Le toca escoger una sobrecarga? (llegó a un hito que no ha pedido) */
  get debeSobrecarga() {
    const alcanzados = NIVELES_SOBRECARGA.filter((n) => this.nivel >= n).length;
    return alcanzados > this.pedidas && this.sobrecargas.length < Math.min(MAX_SOBRECARGAS, this.def.sobrecargas.length);
  }
}

export interface ResumenJugador {
  muertes: number;
  elites: number;
  dano: number;
  excavadas: number;
  oro: number;
  hierro: number;
  sangre: number;
  almas: number;
  ejecuciones: number;
  levantados: number;
  frascos: number;
  altares: number;
  prisioneros: number;
  bendiciones: number;
  caidas: number;
  /** Bichos del botín tumbados (ratas del tesoro, ratas doradas, ladrones de tumbas). */
  botin?: number;
  /** Minerales recogidos (los seis juntos). */
  minerales?: number;
}

export class Jugador {
  i: number;
  id: string;
  nombre: string;
  puesto: number;
  clase: IdClase;
  spec: number;
  cuerpo: 'el' | 'ella';
  tipo: 'el' | 'ella' | 'amigo';
  perfil: PerfilJugador;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  /** Hacia dónde mira (unitario). */
  fx = 0;
  fy = 1;
  /** Entrada del mando (−1..1) y si apretó la habilidad. */
  mx = 0;
  my = 0;
  pideHabilidad = false;
  /** Tocó algo con el mouse o el dedo para recogerlo (punto del piso; se consume en el paso). */
  pideTomar: { x: number; y: number } | null = null;
  /** El cofre, santuario o prisionero que está abriendo desde lejos por tocarlo (id, −1 ninguno). */
  usa = -1;
  /** Lo controla otro aparato: la posición la manda él (el anfitrión no lo mueve). */
  remoto = false;
  hp = 100;
  hpMax = 100;
  /** 0 vivo, 1 caído (esperando que lo levanten), 2 fuera hasta la próxima etapa, 3 extraído. */
  estado = 0;
  caidoT = 0;
  levantar = 0;
  invul = 0;
  golpeT = 0;
  nivel = 1;
  xp = 0;
  armas: ArmaJ[] = [];
  dones: Record<string, number> = {};
  extra: Stats = nuevasStats();
  extraEtq: DanoEtiqueta = {};
  objetos: string[] = [];
  equipo: Partial<Record<RanuraEquipo, string>> = {};
  reliquias: string[] = [];
  bendiciones: Record<string, number> = {};
  milagros: string[] = [];
  st: Stats = nuevasStats();
  etq: DanoEtiqueta = {};
  /** Lo recogido en esta etapa (se pierde si no llega a la campana) y lo que ya está a salvo. */
  oro = 0;
  hierro = 0;
  sangre = 0;
  oroSeguro = 0;
  hierroSeguro = 0;
  sangreSeguro = 0;
  /** Los seis minerales del Pozo (índice de MINERALES_ORDEN): en el bolsillo y ya a salvo (se llevan a casa). */
  minerales = [0, 0, 0, 0, 0, 0];
  mineralesSeguro = [0, 0, 0, 0, 0, 0];
  habT = 0;
  habActiva = 0;
  /** Estado de la mecánica de la clase (números libres). */
  m: Record<string, number> = {};
  /** Efectos temporales sobre el jugador. */
  buffDano = 0;
  buffVel = 0;
  buffCad = 0;
  buffT = 0;
  /** Efectos que le dan los compañeros mientras está cerca (canciones, estandarte): se apagan solos. */
  auraDano = 0;
  auraVel = 0;
  auraCura = 0;
  auraT = 0;
  invisible = 0;
  /** Lo que tiene pendiente por escoger (subir de nivel, sobrecargas, cofres, bendiciones). */
  cola: Eleccion[] = [];
  tiradas = 0;
  vetos = 0;
  vetadas: string[] = [];
  /** Ya usó «Segunda piel», «Fénix», «Último aliento» o el reloj parado en esta etapa/expedición. */
  usados: Record<string, number> = {};
  /** Excavando: celda y tiempo (para el polvo y el sonido). */
  excavando = -1;
  excavaT = 0;
  /** Velocidad extra temporal (aire libre del campesino). */
  prisaT = 0;
  /** Encantado por una novia vampira: hacia dónde lo jalan. */
  encantoX = 0;
  encantoY = 0;
  encantoT = 0;
  /** Escudo de almas (reliquia): golpes que para. */
  paraGolpes = 0;
  almasEscudo = 0;
  resumen: ResumenJugador = {
    muertes: 0, elites: 0, dano: 0, excavadas: 0, oro: 0, hierro: 0, sangre: 0, almas: 0, ejecuciones: 0, levantados: 0, frascos: 0, altares: 0,
    prisioneros: 0, bendiciones: 0, caidas: 0, botin: 0,
  };
  /** Para mostrar el número al pegar: hasta cuándo no se vuelve a mostrar el de este jugador. */
  ultimoNumero = 0;

  constructor(i: number, perfil: PerfilJugador) {
    this.i = i;
    this.perfil = perfil;
    this.id = perfil.id;
    this.nombre = perfil.nombre;
    this.puesto = perfil.puesto;
    this.clase = perfil.clase;
    this.spec = perfil.spec;
    this.cuerpo = perfil.cuerpo;
    this.tipo = perfil.tipo;
    this.tiradas = perfil.tiradas;
    this.vetos = perfil.vetos;
    this.equipo = { ...perfil.equipo };
    this.armas = [new ArmaJ(CLASES[perfil.clase].arsenal[0])];
    this.recalcular();
    this.hp = this.hpMax;
  }

  don(id: string) {
    return this.dones[id] ?? 0;
  }
  bend(id: string) {
    return this.bendiciones[id] ?? 0;
  }
  tiene(reliquia: string) {
    return this.reliquias.includes(reliquia);
  }
  objeto(id: string) {
    return this.objetos.includes(id);
  }
  /** Lo que las demás armas le hacen al daño de la de la ranura k (De cinto: +20 % a las otras; La consentida: −30 %). */
  multOtras(k: number) {
    let m = 1;
    this.armas.forEach((b, i) => {
      if (i === k) return;
      for (const e of b.especiales) {
        if (e === 'cinto') m *= 1.2;
        else if (e === 'consentida') m *= 0.7;
      }
    });
    return m;
  }
  get vivo() {
    return this.estado === 0;
  }
  get enJuego() {
    return this.estado === 0 || this.estado === 1;
  }

  /** Estadísticas finales: clase + especialización + permanentes + mejoras + objetos + equipo + dones + bendiciones + reliquias. */
  recalcular() {
    const st = nuevasStats();
    const def = CLASES[this.clase];
    st.vida = def.vida;
    const sumar = (m: Partial<Stats> | undefined) => {
      if (!m) return;
      for (const [k, v] of Object.entries(m)) (st as any)[k] += v as number;
    };
    sumar(def.base);
    sumar(def.specs[this.spec]?.mod);
    sumar(this.perfil.meta);
    sumar(this.extra);
    const etq: DanoEtiqueta = { ...this.extraEtq };
    const sumarEtq = (e: Partial<Record<Etiqueta, number>> | undefined) => {
      if (!e) return;
      for (const [k, v] of Object.entries(e)) etq[k as Etiqueta] = (etq[k as Etiqueta] ?? 0) + (v as number);
    };
    for (const id of this.objetos) {
      const o = OBJETO[id];
      sumar(o?.mod);
      sumarEtq(o?.etq);
    }
    for (const id of Object.values(this.equipo)) {
      const e = id ? EQUIPO[id] : undefined;
      sumar(e?.mod);
      sumarEtq(e?.etq);
    }
    statsDeClase(this, st, etq);
    // Bendiciones
    st.roboVida += 0.02 * this.bend('caliz');
    st.esquiva += 0.06 * this.bend('velo');
    st.dano += 0.12 * this.bend('pacto_sangre');
    st.curacion -= 0.1 * this.bend('pacto_sangre');
    // Reliquias
    if (this.tiene('doble_filo')) {
      st.cantidad += 1;
      st.dano -= 0.25;
    }
    if (this.tiene('paso_fantasma')) st.velocidad += 0.1;
    if (this.tiene('eclipse_propio')) st.luz -= 0.2;
    // Límites
    st.esquiva = Math.min(0.6, Math.max(0, st.esquiva));
    st.velocidad = Math.max(-0.5, st.velocidad);
    st.roboVida = Math.min(0.25, Math.max(0, st.roboVida));
    st.enfriamiento = Math.min(0.6, st.enfriamiento);
    st.vida = Math.max(20, st.vida);
    this.st = st;
    this.etq = etq;
    const antes = this.hpMax;
    this.hpMax = Math.round(st.vida);
    if (this.hpMax > antes) this.hp += this.hpMax - antes;
    this.hp = Math.min(this.hp, this.hpMax);
    for (const a of this.armas) a.sucio = true;
  }

  /** Multiplicador de daño de un golpe con estas etiquetas (bits). */
  multEtiquetas(bits: number) {
    let m = 1 + this.st.dano + this.buffDano + (this.auraT > 0 ? this.auraDano : 0);
    for (let k = 0; k < ETIQUETAS.length; k++) if (bits & (1 << k)) m += this.etq[ETIQUETAS[k]] ?? 0;
    return Math.max(0.1, m);
  }

  get velocidad() {
    return VEL_BASE * Math.max(0.3, 1 + this.st.velocidad + this.buffVel + (this.auraT > 0 ? this.auraVel : 0) + (this.prisaT > 0 ? 0.12 * this.don('aire_libre') : 0));
  }
  get radioIman() {
    return IMAN_BASE * (1 + this.st.iman);
  }
  get radioLuz() {
    return LUZ_BASE * Math.max(0.4, 1 + this.st.luz);
  }

  /** Arma por id (o null). */
  arma(id: string) {
    return this.armas.find((a) => a.id === id) ?? null;
  }

  /** ¿Puede escoger esta arma como nueva? */
  tieneArma(id: string) {
    return this.armas.some((a) => a.id === id || (ARMAS[a.id]?.evolucion && Object.values(ARMAS).some((b) => b.evoluciona?.a === a.id && b.id === id)));
  }

  /** Bits de banderas de la bendición «herida abierta», «pira» y «escarcha» (para los golpes). */
  get bendFlags() {
    return (this.bend('herida_abierta') ? F.SANGRA : 0);
  }

  /** Lo que lleva en el bolsillo pasa a estar a salvo (llegó a la campana). */
  asegurar() {
    this.oroSeguro += this.oro;
    this.hierroSeguro += this.hierro;
    this.sangreSeguro += this.sangre;
    this.oro = this.hierro = this.sangre = 0;
    for (let k = 0; k < 6; k++) this.mineralesSeguro[k] += this.minerales[k];
    this.minerales.fill(0);
  }

  /** Datos para la siguiente etapa (o para guardar el resultado). */
  get totalOro() {
    return this.oro + this.oroSeguro;
  }
}

export { BENDICION };
