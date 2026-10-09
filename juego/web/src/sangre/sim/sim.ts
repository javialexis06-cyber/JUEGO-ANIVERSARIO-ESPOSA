// La simulación de una etapa de Sangre y Ceniza: el mapa, los jugadores, la horda, las armas, los recogibles, los
// objetivos y la campana de extracción. No sabe nada del dibujo ni de la red: corre en el celular de quien juega solo,
// en el anfitrión de una partida de hasta 4 y en Node con el bot. Cada `paso(dt)` deja lo que pasó en `suc`.
import { Azar } from '../../casa/lavado/azar';
import { Rejilla } from '../../casa/lavado/rejilla';
import { AVANCE_OBJETIVO, AVANCE_SOLO, BIOMAS, CUENTA_EXTRACCION, DESCANSO, DURACION_ETAPA, ETAPAS, MOD_ELITE, OLEADAS, PELIGROS, type DefBioma, type DefEnemigo } from '../datos/mundo';
import { C, esExcavable, esSolida, type ConfigExpedicion, type IdBioma, type IdObjetivo, type IdSecundario } from '../tipos';
import { TIPOS, TIPO_ALTAR, esJefe } from './catalogo';
import { Aliado, ENT, Entidad, Enemigos, Proyectil, REC, Recogible, S, Sucesos, Zona } from './estado';
import { CampoFlujo } from './flujo';
import { BIT_ETQ, RADIO_JUGADOR, type Jugador, xpPara } from './jugador';

/** Los tipos de daño que cuenta la Navaja multiusos (para abrirla: hacer cinco en una expedición). */
const TIPOS_DANO = BIT_ETQ.fisico | BIT_ETQ.fuego | BIT_ETQ.sagrado | BIT_ETQ.veneno | BIT_ETQ.sangre | BIT_ETQ.sombra | BIT_ETQ.hielo;
import { generarMapa, type Mapa } from './mapa';
import { actualizarArmas, moverProyectiles, moverZonas } from './armas';
import { dirigirHorda, moverEnemigos, aparecerEnemigo } from './enemigos_ia';
import { moverAliados } from './aliados';
import * as mec from './mecanicas';
import { prepararObjetivos, actualizarObjetivos, llamarCampana, tomarConMano, guardianMuerto, RADIO_GRANDE, RADIO_LLAVE } from './objetivos';
import { actualizarBioma, alRomperBioma, prepararBioma, type Reventon } from './biomas';
import { encolarNivel, encolarSobrecarga } from './opciones';
import { jefeMuerto } from './jefes';
import { Golpe } from './golpe';
export { Golpe };

export const MAX_ENEMIGOS = 720;
const CANDIDATOS: number[] = [];
const MAX_PROY = 900;
const MAX_ZONAS = 180;
const MAX_REC = 800;
const MAX_ALIADOS = 90;

export interface ConfigEtapa {
  exp: ConfigExpedicion;
  etapa: number;
  objetivo: IdObjetivo;
  secundario: IdSecundario;
  /** La última etapa: después del objetivo sale el jefe. */
  final: boolean;
  /** El bioma de esta etapa (en el modo infinito cambia cada 5; si no, el de la expedición). */
  bioma?: IdBioma;
}

export interface FinEtapa {
  exito: boolean;
  /** Índices de los que llegaron a la campana. */
  extraidos: number[];
  motivo: 'extraccion' | 'derrota' | 'abandono';
  objetivo: boolean;
  secundario: number;
  prisioneros: number;
}

export class Sim {
  az: Azar;
  cfg: ConfigEtapa;
  bioma: DefBioma;
  mapa: Mapa;
  flujo: CampoFlujo;
  /** Campo hacia el objetivo que hay que proteger (carreta, campana) o null. */
  flujoObj: CampoFlujo | null = null;
  E = new Enemigos(MAX_ENEMIGOS);
  P: Proyectil[] = [];
  Z: Zona[] = [];
  R: Recogible[] = [];
  A: Aliado[] = [];
  ent: Entidad[] = [];
  J: Jugador[];
  suc = new Sucesos();
  rej = new Rejilla(MAX_ENEMIGOS, 2, 2048);
  /** Segundos de la etapa. */
  t = 0;
  /** Avance de la etapa (0-1), como en Deep Rock Galactic: Survivor. Lo llenan el tiempo (despacio) y el objetivo
   *  principal (de a mucho); en el camino salen las oleadas y, lleno, el Guardián. La campana baja cuando él cae. */
  avance = 0;
  /** La parte del avance que puso el tiempo. */
  avanceT = 0;
  /** En qué punto de la barra sale cada oleada, y cuántas han salido. */
  oleadas: number[] = [];
  oleadasHechas = 0;
  /** Bichos que le faltan a la oleada en curso (salen de a tandas). */
  oleadaResta = 0;
  oleadaT = 0;
  /** El Guardián: índice en la piscina (−1 si no está vivo) y si ya salió. */
  guardian = -1;
  guardianVisto = false;
  /** La Noche se impacienta: desde que sale el Guardián, cada tanto la horda sale más rápida y más brava. */
  impaciencia = 0;
  impacienciaT = 0;
  /** Cuándo sale cada bicho del botín en esta etapa (ordenado). */
  botinPlan: { t: number; id: string }[] = [];
  /** Reglas del bioma (sim/biomas.ts): relojes, lo que revienta después, niebla, vitrales y avisos de la primera vez. */
  biomaT = 0;
  biomaT2 = 0;
  reventones: Reventon[] = [];
  niebla = 0;
  vitrales = 0;
  vitralT = 0;
  avisoGrisu = false;
  avisoColumna = false;
  avisoTumbas = false;
  avisoArmadura = false;
  vagGolpes = new Map<number, Set<number>>();
  /** Ya se marcó el cofre de suministros de esta etapa. */
  suministroVisto = false;
  /** Plumas de grifo: cuánto falta para que caiga la siguiente. */
  plumaT = 0;
  /** Los importantes que se quedaron lejos (uid → distancia más corta y segundos sin acercarse). */
  atascos = new Map<number, { d: number; t: number }>();
  atascoT = 0;
  fase: 'juego' | 'extraccion' | 'jefe' = 'juego';
  campana: Entidad | null = null;
  obj = { tipo: 'hierro' as IdObjetivo, meta: 1, prog: 0, hecho: false, fallo: false, texto: '' };
  sec = { tipo: 'huevos' as IdSecundario, meta: 1, prog: 0 };
  /** Índice del jefe en la piscina de enemigos (o -1). */
  jefe = -1;
  jefeFase = 0;
  jefeVisto = false;
  /** Lo que rinde la curación en este peligro (en los altos, menos). */
  curaPeligro = 1;
  /** Mutadores que se miran en cada golpe o cada cuadro (para no buscarlos en la lista cada vez). */
  acorazados = false;
  barro = false;
  /** La anomalía «Solo minería». */
  mineria = false;
  /** El fantasma del Conde (mutador): su índice y cuándo vuelve si lo tumban. */
  fantasma = -1;
  fantasmaT = 25;
  /** Escala de la horda según el peligro, la etapa y cuántos juegan. */
  esc = { vida: 1, dano: 1, cantidad: 1, elites: 1, botin: 1, xp: 1 };
  /** Revienta un cartucho de minero ahora mismo (para que no encadene otro dentro de la misma explosión). */
  private enCartucho = false;
  /** Mientras revienta una explosión minera: a quién le vuela el botín de las vetas (−1 nadie). */
  private atraerA = -1;
  fin: FinEtapa | null = null;
  /** Efecto de eclipse en curso (s): menos luz, enemigos más rápidos. */
  eclipse = 0;
  /** Tiempo detenido por el reloj parado (s). */
  quieto = 0;
  hordaAcum = 0;
  eventoT = 75;
  evento: string | null = null;
  eventoFin = 0;
  eventoSub = 0;
  eventoDir = 0;
  /** Reloj de los daños que se repiten (quemadura, veneno, sangrado). */
  presionTick = 0;
  /** Extra de presión de la horda (eventos, campana). */
  presionExtra = 1;
  private flujoT = 0;
  private flujoObjT = 0;
  private sigId = 1;
  private dotT = 0;
  /** Contadores del director de la horda. */
  aparecidos = 0;
  elitesVivos = 0;
  /** Llaves de cofres de reliquias que faltan por soltar. */
  llavesPendientes = 0;
  /** Para el tutorial: la horda no sale sola. */
  sinHorda = false;
  /** Para el tutorial: la campana no baja sola al acabarse el tiempo. */
  sinReloj = false;
  /** Pruebas: nadie se muere. */
  inmortales = false;
  readonly G = new Golpe();
  private tmp = { x: 0, y: 0 };

  constructor(cfg: ConfigEtapa, jugadores: Jugador[]) {
    this.cfg = cfg;
    this.az = new Azar(cfg.exp.semilla * 7 + cfg.etapa * 131);
    this.bioma = BIOMAS[cfg.bioma ?? cfg.exp.bioma];
    this.J = jugadores;
    const n = jugadores.length;
    const pel = PELIGROS[Math.max(0, Math.min(4, cfg.exp.peligro - 1))];
    const mut = (m: string) => cfg.exp.mutadores.includes(m as never);
    // Modo infinito: después de la quinta etapa, cada una bastante más dura que la anterior (crece más rápido que el
    // jugador, que se estanca con las armas al máximo: tarde o temprano la noche gana)
    // (la prueba del bioma, de 10 etapas, también se endurece después de la quinta)
    const inf = cfg.exp.infinito || (cfg.exp.etapas ?? ETAPAS) > ETAPAS ? Math.max(0, cfg.etapa - ETAPAS) : 0;
    const aprendiz = cfg.exp.anomalia === 'aprendiz' ? 2 : 1;
    // Cada etapa arranca más o menos donde terminó la anterior (dentro de la etapa los enemigos se endurecen con el
    // reloj): así las últimas son las difíciles, como en Deep Rock, y no la primera
    const etapaV = 2 ** (Math.min(cfg.etapa, ETAPAS) - 1);
    const base = pel.vida * (1 + 0.38 * (n - 1)) * (mut('codicia') ? 1.25 : 1) * (mut('fragiles') ? 0.75 : 1);
    this.esc = {
      vida: base * etapaV * 1.3 ** inf,
      dano: (1 + 0.5 * (Math.min(cfg.etapa, ETAPAS) - 1)) * pel.dano * (mut('sangrienta') ? 1.3 : 1) * 1.1 ** inf * aprendiz,
      cantidad: pel.cantidad * (1 + 0.6 * (n - 1)) * (1 + 0.2 * (Math.min(cfg.etapa, ETAPAS) - 1)) * (1 + 0.05 * inf),
      elites: pel.elites * (1 + 0.3 * (n - 1)) * (mut('elites_dobles') ? 2 : 1) * (1 + 0.12 * inf),
      botin: 1 / (1 + 0.45 * (n - 1)),
      // Las almas valen más en las etapas duras, pero no tanto como crece la vida (si no, el jugador sube de nivel tan
      // rápido como se endurecen los enemigos); en el infinito ya no valen más (el poder del jugador se estanca)
      xp: base * etapaV ** 0.7 * (mut('nocturna') ? 1.25 : 1) * aprendiz,
    };
    this.acorazados = mut('acorazados');
    this.mineria = cfg.exp.anomalia === 'mineria';
    this.barro = mut('barro');
    this.curaPeligro = cfg.exp.sinCurar ? 0 : pel.curacion * (mut('bendita') ? 1.5 : 1) * (mut('hambruna') ? 0.5 : 1);
    // (tinieblas: la luz de cada uno alumbra menos)
    for (const j of jugadores) j.luzMut = mut('tinieblas') ? -0.35 : 0;
    this.mapa = generarMapa({
      bioma: this.bioma, semilla: cfg.exp.semilla * 31 + cfg.etapa * 977, jugadores: n, rocaDura: mut('roca_dura'), sinAntorchas: mut('sin_antorchas'),
      vetasHierro: cfg.objetivo === 'hierro' ? 10 + 2 * n : 2, carreta: cfg.objetivo === 'carreta', tutorial: cfg.exp.tutorial,
    });
    this.flujo = new CampoFlujo(this.mapa);
    for (let k = 0; k < MAX_PROY; k++) this.P.push(new Proyectil());
    for (let k = 0; k < MAX_ZONAS; k++) this.Z.push(new Zona());
    for (let k = 0; k < MAX_REC; k++) this.R.push(new Recogible());
    for (let k = 0; k < MAX_ALIADOS; k++) this.A.push(new Aliado());
    // Los jugadores aparecen en la cámara de inicio, en círculo
    jugadores.forEach((j, k) => {
      const a = (k / Math.max(1, n)) * Math.PI * 2;
      const p = this.mapa.abiertaCerca(this.mapa.inicio.x + Math.cos(a) * 1.4, this.mapa.inicio.y + Math.sin(a) * 1.4) ?? this.mapa.inicio;
      j.x = p.x;
      j.y = p.y;
      j.vx = j.vy = 0;
      const seQuedo = j.estado === 2;
      if (j.estado === 2 || j.estado === 3 || j.estado === 1) {
        // Vuelve a la expedición (el que se quedó afuera llega con media vida)
        if (j.estado === 2) j.hp = Math.max(1, Math.round(j.hpMax * 0.5));
        j.estado = 0;
      }
      // Descanso en la Forja: el que salió en la campana recupera un tercio de la vida (no baja medio muerto)
      if (cfg.etapa > 1 && !seQuedo) j.hp = Math.min(j.hpMax, j.hp + j.hpMax * DESCANSO);
      j.caidoT = 0;
      j.levantar = 0;
      j.usa = -1;
      j.pideTomar = null;
      j.invul = 2;
      j.habT = Math.min(j.habT, 3);
      j.cola = j.cola.filter((e) => e.motivo !== 'bendicion');
      for (const a of j.armas) a.t = 0.5 + k * 0.1;
      j.usados.reloj_parado = 0;
      j.usados.ultimo_aliento = 0;
      j.usados.fenix = 0;
      mec.alEmpezarEtapa(this, j);
    });
    prepararObjetivos(this);
    prepararBioma(this);
    // Las oleadas, repartidas a lo largo de la barra (la etapa final no tiene: tiene los sepulcros)
    const nOl = cfg.final || cfg.exp.tutorial ? 0 : OLEADAS[Math.min(OLEADAS.length - 1, cfg.etapa - 1)];
    for (let k = 0; k < nOl; k++) this.oleadas.push(((k + 1) / (nOl + 1)) * 0.92);
    // Los bichos del botín de la etapa: ratas del tesoro repartidas, a veces una rata dorada y, desde la segunda etapa,
    // a veces un ladrón de tumbas
    if (!cfg.exp.tutorial) {
      // (el queso podrido atrae el doble)
      const queso = this.J.some((j) => j.tiene('queso_podrido')) ? 2 : 1;
      const ratas = (3 + (cfg.etapa >= 3 ? 1 : 0)) * queso;
      for (let k = 0; k < ratas; k++) this.botinPlan.push({ t: 35 + (k + this.az.n() * 0.8) * (265 / ratas), id: 'rata_tesoro' });
      if (queso > 1) this.botinPlan.push({ t: this.az.entre(60, 260), id: 'ladron_tumbas' });
      if (this.az.n() < (cfg.exp.peligro >= 3 ? 0.35 : 0.25)) this.botinPlan.push({ t: this.az.entre(60, 260), id: 'rata_dorada' });
      if (cfg.etapa >= 2 && this.az.n() < 0.55) this.botinPlan.push({ t: this.az.entre(80, 280), id: 'ladron_tumbas' });
      this.botinPlan.sort((a, b) => a.t - b.t);
    }
    this.calcularFlujo();
  }

  // ----------------------------------------------------------------------------------------------- Utilidades
  id() {
    return this.sigId++;
  }
  get n() {
    return this.J.length;
  }
  /** Jugadores que pueden pelear (vivos). */
  vivos(): Jugador[] {
    return this.J.filter((j) => j.estado === 0);
  }
  get duracion() {
    return DURACION_ETAPA;
  }
  /** Custodios de los sepulcros que siguen vivos (etapa final). */
  custodiosVivos = 0;

  /** Lo que el objetivo principal le pone a la barra (0-1). Fallido también cuenta: la noche sigue, sin premio. */
  get fracObjetivo() {
    const o = this.obj;
    if (o.fallo || o.hecho) return 1;
    return o.meta > 0 ? Math.min(1, o.prog / o.meta) : 0;
  }

  /** Recalcula el avance con el tiempo que lleva y el objetivo. */
  calcularAvance() {
    this.avance = Math.min(1, this.avanceT + AVANCE_OBJETIVO * this.fracObjetivo);
  }

  /** Pruebas: deja la barra a `seg` segundos de llenarse (sin contar el objetivo que falta). */
  adelantar(seg: number) {
    this.avanceT = Math.max(this.avanceT, 1 - AVANCE_OBJETIVO * this.fracObjetivo - seg / AVANCE_SOLO);
    this.calcularAvance();
  }

  /** El jugador vivo más cercano (o null). Los invisibles no cuentan para los enemigos. */
  jugadorCercano(x: number, y: number, paraEnemigo = true): Jugador | null {
    let mejor: Jugador | null = null, md = Infinity;
    for (const j of this.J) {
      if (j.estado !== 0 || (paraEnemigo && j.invisible > 0)) continue;
      const d = (j.x - x) ** 2 + (j.y - y) ** 2;
      if (d < md) {
        md = d;
        mejor = j;
      }
    }
    return mejor;
  }

  /** Busca un blanco para un arma. Modo: cercano, mira (hacia donde camina), azar, denso, fuerte. */
  blanco(x: number, y: number, alcance: number, modo: string, fx = 0, fy = 1): number {
    const E = this.E;
    const n0 = this.rej.circulo(x, y, alcance);
    const r2 = alcance * alcance;
    // Copia de los candidatos (la densidad hace otra consulta a la rejilla)
    const cand = CANDIDATOS;
    cand.length = 0;
    for (let k = 0; k < n0; k++) {
      const i = this.rej.fuera[k];
      if (!E.vivo[i] || E.alt[i] < -0.3) continue;
      if ((E.x[i] - x) ** 2 + (E.y[i] - y) ** 2 > r2) continue;
      cand.push(i);
    }
    if (!cand.length) return -1;
    if (modo === 'azar') return cand[Math.floor(this.az.n() * cand.length)];
    let mejor = -1, md = Infinity;
    // En el modo denso solo se miden unos pocos (es más caro)
    const paso = modo === 'denso' ? Math.max(1, Math.floor(cand.length / 12)) : 1;
    for (let k = 0; k < cand.length; k += paso) {
      const i = cand[k];
      const dx = E.x[i] - x, dy = E.y[i] - y;
      const d = dx * dx + dy * dy;
      let v = d;
      if (modo === 'fuerte') v = -E.hp[i] - (E.elite[i] || esJefe(E.tipo[i]) ? 1e6 : 0) + d * 0.01;
      else if (modo === 'mira') v = d - (dx * fx + dy * fy) * 4;
      else if (modo === 'atras') v = d + (dx * fx + dy * fy) * 4;
      else if (modo === 'denso') v = d * 0.2 - this.densidad(E.x[i], E.y[i]) * 3;
      // Los altares atraen un poco menos que los que vienen encima
      if (E.tipo[i] === TIPO_ALTAR) v += 6;
      if (v < md) {
        md = v;
        mejor = i;
      }
    }
    return mejor;
  }

  /** Cuántos enemigos hay a 1,6 m (para apuntar al montón). */
  private densidad(x: number, y: number) {
    const E = this.E;
    let c = 0;
    const n = this.rej.circulo(x, y, 1.6);
    const f = this.rej.fuera;
    // (la consulta pisa el resultado de la búsqueda de afuera: se usa una copia corta)
    for (let k = 0; k < n && k < 24; k++) if (E.vivo[f[k]] && (E.x[f[k]] - x) ** 2 + (E.y[f[k]] - y) ** 2 < 2.6) c++;
    return c;
  }

  /** Índices de los enemigos a menos de r de (x, y) (copia en un arreglo propio: se puede anidar). */
  enRadio(x: number, y: number, r: number, fuera: number[]): number {
    const E = this.E;
    fuera.length = 0;
    const n = this.rej.circulo(x, y, r + 1.6);
    for (let k = 0; k < n; k++) {
      const i = this.rej.fuera[k];
      if (!E.vivo[i]) continue;
      const rr = r + E.r[i];
      if ((E.x[i] - x) ** 2 + (E.y[i] - y) ** 2 <= rr * rr) fuera.push(i);
    }
    return fuera.length;
  }

  nuevoProyectil(): Proyectil | null {
    for (const p of this.P) if (!p.vivo) {
      p.vivo = true;
      p.t = 0;
      p.z = 0;
      p.gi = 0;
      p.gt.fill(0);
      p.gid.fill(0);
      p.flags = 0;
      p.vuelta = false;
      p.aliado = false;
      p.quema = p.veneno = p.sangrado = p.lento = p.aturde = p.maldicion = p.critico = p.empuje = p.duracion = p.area = 0;
      p.rebotes = 0;
      p.perfora = 1;
      p.ranura = -1;
      p.dueno = -1;
      p.etq = 0;
      return p;
    }
    return null;
  }

  nuevaZona(): Zona | null {
    for (const z of this.Z) if (!z.vivo) {
      z.vivo = true;
      z.t = 0;
      z.lento = z.veneno = z.quema = z.maldicion = z.cura = 0;
      z.enemiga = false;
      z.sigue = -1;
      z.dueno = -1;
      z.ranura = -1;
      z.etq = 0;
      z.id = this.id();
      return z;
    }
    return null;
  }

  nuevoAliado(): Aliado | null {
    for (const a of this.A) if (!a.vivo) {
      a.vivo = true;
      a.atqT = 0.3;
      a.fase = Math.random() * 6;
      a.ataque = a.golpe = 0;
      a.blanco = -1;
      a.a = a.b = 0;
      a.vx = a.vy = 0;
      a.vida = 0;
      a.imita = -1;
      a.id = this.id();
      return a;
    }
    return null;
  }

  /** Suelta algo en el piso (sale volando un poco). */
  soltar(tipo: number, x: number, y: number, valor = 1, dato = '', volar = true): Recogible | null {
    let libre: Recogible | null = null;
    for (const r of this.R) if (!r.vivo) {
      libre = r;
      break;
    }
    if (!libre) {
      // Lleno: las almas azules sueltas se juntan en la más cercana para hacer espacio
      if (tipo <= REC.ALMA_ROJA) {
        let mejor: Recogible | null = null, md = Infinity;
        for (const r of this.R) {
          if (!r.vivo || r.tipo > REC.ALMA_ROJA || r.hacia >= 0) continue;
          const d = (r.x - x) ** 2 + (r.y - y) ** 2;
          if (d < md) {
            md = d;
            mejor = r;
          }
        }
        if (mejor) {
          mejor.valor += valor;
          if (mejor.valor >= 25) mejor.tipo = REC.ALMA_ROJA;
          else if (mejor.valor >= 5) mejor.tipo = REC.ALMA_VERDE;
        }
      }
      return null;
    }
    const r = libre;
    r.vivo = true;
    r.tipo = tipo;
    r.x = x;
    r.y = y;
    r.z = 0.2;
    const a = this.az.n() * Math.PI * 2, v = volar ? this.az.entre(0.6, 2.2) : 0;
    r.vx = Math.cos(a) * v;
    r.vy = Math.sin(a) * v;
    r.vz = volar ? this.az.entre(2.5, 4) : 0;
    r.valor = valor;
    // (lo que revienta la carga minera o un cartucho le llega solo al que la tiró, como en Deep Rock)
    r.hacia = this.atraerA >= 0 && (tipo === REC.ORO || tipo === REC.HIERRO || tipo === REC.SANGRE) ? this.atraerA : -1;
    r.t = 0;
    r.dato = dato;
    r.id = this.id();
    r.espera = volar ? 0.35 : 0;
    return r;
  }

  /** Almas según la experiencia que valga lo que murió. */
  soltarAlmas(x: number, y: number, xp: number) {
    let resto = xp;
    while (resto >= 25) {
      this.soltar(REC.ALMA_ROJA, x, y, 25);
      resto -= 25;
    }
    while (resto >= 5) {
      this.soltar(REC.ALMA_VERDE, x, y, 5);
      resto -= 5;
    }
    if (resto > 0) this.soltar(REC.ALMA_AZUL, x, y, resto);
  }

  aviso(codigo: number, a = 0, b = 0) {
    this.suc.push(S.AVISO, codigo, a, b);
  }

  // ----------------------------------------------------------------------------------------------- Daño a enemigos
  /** Golpea al enemigo i. Devuelve el daño hecho. */
  danar(i: number, base: number, g: Golpe): number {
    const E = this.E;
    if (!E.vivo[i] || base <= 0 || E.alt[i] < -0.5) return 0;
    const t = E.tipo[i];
    const def = TIPOS[t];
    const j = g.j >= 0 ? this.J[g.j] : null;
    let d = base;
    let crit = g.critico;
    const fuerte = E.elite[i] !== 0 || esJefe(t) || t === TIPO_ALTAR;
    if (j) {
      d *= j.multEtiquetas(g.etq) * mec.multDano(this, j, i, g);
      if (g.aliado) d *= 1 + j.st.invocaciones;
      crit += mec.criticoExtra(this, j, i, g);
      if (fuerte) d *= 1 + j.st.danoElite;
    }
    d *= this.vulnerable(i, j, g);
    if (this.acorazados) d *= 0.8;
    let esCrit = false;
    if (crit > 0 && this.az.n() < crit) {
      esCrit = true;
      d *= 1.5 + (j ? j.st.danoCritico : 0);
    }
    // Escudo de élite: absorbe primero
    if (E.escudo[i] > 0) {
      const a = Math.min(E.escudo[i], d * 0.8);
      E.escudo[i] -= a;
      d -= a;
    }
    const antes = E.hp[i];
    E.hp[i] -= d;
    E.golpe[i] = 1;
    if (g.j >= 0) E.ultimo[i] = g.j;
    // Empuje (los pesados casi no se mueven)
    if (g.empuje > 0 && def.masa < 1) {
      const k = g.empuje * (1 - def.masa) * (E.elite[i] ? 0.5 : 1);
      E.kx[i] += g.dx * k;
      E.ky[i] += g.dy * k;
    }
    // Estados alterados (la potencia pone más carga de cada uno)
    const durMult = j ? 1 + j.st.duracion : 1;
    const pot = j ? Math.max(0.2, 1 + j.st.potencia) : 1;
    if (g.quema > 0) {
      E.quema[i] = Math.max(E.quema[i], g.quema * pot);
      E.quemaT[i] = 3 * durMult;
    }
    if (g.veneno > 0) {
      E.veneno[i] = Math.min(E.veneno[i] + g.veneno * 0.5 * pot, g.veneno * 4 * pot);
      E.venenoT[i] = 4 * durMult;
    }
    if (g.sangrado > 0) {
      E.sangrado[i] = Math.max(E.sangrado[i], g.sangrado * pot);
      E.sangradoT[i] = 4 * durMult;
    }
    if (g.lento > 0) {
      E.lento[i] = Math.max(E.lento[i], Math.min(0.85, g.lento * (1 + (pot - 1) * 0.5)));
      E.lentoT[i] = 2 * durMult;
    }
    if (g.aturde > 0 && !esJefe(t)) E.aturdido[i] = Math.max(E.aturdido[i], g.aturde * (E.elite[i] ? 0.5 : 1));
    if (j) {
      const real = Math.min(d, Math.max(0, antes));
      const r = j.resumen;
      r.dano += real;
      if (real > (r.golpeMax ?? 0)) r.golpeMax = real;
      if (g.etq & BIT_ETQ.fuego) r.danoFuego = (r.danoFuego ?? 0) + real;
      if (g.etq & BIT_ETQ.hielo) r.danoHielo = (r.danoHielo ?? 0) + real;
      r.tipos = (r.tipos ?? 0) | (g.etq & TIPOS_DANO);
      if (g.ranura >= 0 && !g.aliado) {
        const a = j.armas[g.ranura];
        if (a) {
          a.danoTotal += real;
          if (a.ganarXp(real)) encolarSobrecarga(this, j, g.ranura);
        }
      }
      if (j.st.roboVida > 0 && !g.aliado) this.curar(j, real * j.st.roboVida * 0.5, true);
      mec.alGolpear(this, j, i, real, g, esCrit);
    }
    // Número del golpe (no todos: los críticos, los grandes y de vez en cuando)
    if (!g.callado && (esCrit || d > 40 || this.az.n() < 0.25)) this.suc.push(S.GOLPE, E.x[i], E.y[i], d, esCrit ? 1 : 0, g.etq, g.j);
    if (E.hp[i] <= 0) this.matar(i, g);
    else if (j) mec.revisarEjecucion(this, j, i, g);
    return d;
  }

  /** Cuánto más daño recibe el enemigo por lo que le pusieron encima (maldición, juicio, marcas, frío…). */
  private vulnerable(i: number, j: Jugador | null, g: Golpe) {
    const E = this.E;
    let m = 1;
    const mald = E.maldicion[i];
    if (mald) m *= 1 + mald * (0.04 + (j ? 0.02 * mec.donDeGrupo(this, 'maleficio') : 0));
    if (E.juzgado[i] > 0) m *= 2;
    if (E.cristal[i]) {
      m *= 2;
      E.cristal[i] = 0;
    }
    if (j) {
      if ((E.aturdido[i] > 0 || E.lentoT[i] > 0) && j.tiene('sangre_fria') && (E.aturdido[i] > 0 || E.lento[i] > 0.4)) m *= 1.4;
      if (E.lentoT[i] > 0 && j.bend('vacio')) m *= 1 + 0.15 * j.bend('vacio');
      // Estacas y agua bendita contra vampiros
      if (TIPOS[E.tipo[i]].vampiro && g.ranura >= 0 && j.armas[g.ranura]?.id === 'estacas') m *= 2;
      // Lo sagrado contra los muertos (el exorcista más)
      if (!TIPOS[E.tipo[i]].vivo && (g.etq & BIT_ETQ.sagrado)) m *= 1.1;
    }
    return m;
  }

  /** Daño de los estados alterados (quemadura, veneno, sangrado): cuenta para quien lo puso. */
  danoEstado(i: number, d: number, etq: string) {
    const E = this.E;
    const g = this.G.reset();
    g.j = E.ultimo[i];
    g.etq = BIT_ETQ[etq as keyof typeof BIT_ETQ] ?? 0;
    g.callado = this.az.n() > 0.15;
    // (el daño de estados del que lo puso)
    const j = g.j >= 0 ? this.J[g.j] : null;
    this.danar(i, d * (j ? Math.max(0.2, 1 + j.st.estados) : 1), g);
  }

  /** Mata al enemigo i (botín, mecánicas, objetivos). */
  matar(i: number, g: Golpe) {
    const E = this.E;
    if (!E.vivo[i]) return;
    const t = E.tipo[i];
    const def = TIPOS[t];
    const x = E.x[i], y = E.y[i];
    const elite = E.elite[i];
    const j = g.j >= 0 ? this.J[g.j] : null;
    this.suc.push(S.MUERTE, x, y, t, E.uid[i], E.esc[i], E.rot[i]);
    E.hp[i] = 0;
    // Botín
    if (t === TIPO_ALTAR) {
      this.soltarAlmas(x, y, Math.round(def.xp * this.esc.xp));
      this.soltar(REC.ORO, x, y, 6 + this.az.entero(0, 6));
      if (this.az.n() < 0.5) this.soltar(REC.SANGRE, x, y, 2);
    } else if (esJefe(t)) {
      jefeMuerto(this, i);
    } else if (def.conducta === 'ladron') {
      // Los bichos del botín: lo que cargan es la plata de la etapa
      this.soltarAlmas(x, y, def.xp);
      if (def.id === 'rata_dorada') {
        for (let k = 0; k < 6; k++) this.soltar(REC.ORO, x, y, this.az.entero(8, 14));
        this.soltar(REC.SANGRE, x, y, 2);
      } else if (def.id === 'ladron_tumbas') {
        this.soltar(REC.COFRE, x, y, 1);
        for (let k = 0; k < 2; k++) this.soltar(REC.ORO, x, y, this.az.entero(5, 9));
        if (this.az.n() < 0.4) this.soltar(REC.EQUIPO, x, y, 1, '');
      } else {
        for (let k = 0; k < 3; k++) this.soltar(REC.ORO, x, y, this.az.entero(4, 7));
        if (this.az.n() < 0.5) this.soltar(REC.HIERRO, x, y, 2);
        if (this.az.n() < 0.3) this.soltar(REC.SANGRE, x, y, 1);
      }
      if (j) j.resumen.botin = (j.resumen.botin ?? 0) + 1;
    } else if (elite === MOD_ELITE.MINI) {
      if (!this.mineria) this.soltarAlmas(x, y, def.xp * 3);
      if (this.az.n() < 0.5) this.soltar(REC.ORO, x, y, this.az.entero(2, 4));
      if (this.az.n() < 0.15) this.soltar(REC.HIERRO, x, y, 1);
    } else {
      // (solo minería: los muertos no sueltan almas)
      if (!this.mineria) this.soltarAlmas(x, y, def.xp * (elite ? 6 : 1));
      const suerte = j ? j.st.suerte : 0;
      if (this.az.n() < 0.035 + suerte * 0.0006 || elite) this.soltar(REC.ORO, x, y, elite ? this.az.entero(8, 15) : this.az.entero(1, 3));
      if (!this.cfg.exp.mutadores.includes('fragiles') && !this.cfg.exp.mutadores.includes('hambruna') && this.az.n() < (elite ? 0.3 : 0.004 + suerte * 0.00005)) this.soltar(REC.COMIDA, x, y, 1);
      if (elite) {
        this.elitesVivos = Math.max(0, this.elitesVivos - 1);
        if (this.az.n() < 0.35 + suerte * 0.004) this.soltar(REC.COFRE, x, y, 1);
        if (this.az.n() < 0.32) this.soltar(REC.EQUIPO, x, y, 1, '');
        if (this.az.n() < 0.3) this.soltar(REC.HIERRO, x, y, 2);
        if (this.az.n() < 0.25) this.soltar(REC.SANGRE, x, y, 2);
        if (this.llavesPendientes > 0) {
          this.llavesPendientes--;
          this.soltar(REC.LLAVE, x, y, 1);
        }
        if (j) j.resumen.elites++;
      }
      if (this.cfg.exp.mutadores.includes('plaga') && this.az.n() < 0.08) {
        const z = this.nuevaZona();
        if (z) Object.assign(z, { tipo: 4, x, y, r: 1.1, dps: 6 * this.esc.dano, vida: 4, total: 4, enemiga: true });
      }
    }
    // Explosivo (élite o lacayo)
    if (elite & MOD_ELITE.EXPLOSIVO) this.explosionEnemiga(x, y, 2.2, 14 * this.esc.dano);
    if (j) {
      j.resumen.muertes++;
      mec.alMatar(this, j, i, g);
    }
    // Reliquias y bendiciones de todos (los de cualquier jugador cerca)
    mec.alMorirCualquiera(this, i, g);
    if (E.marcadoObj[i] === 1) {
      this.obj.prog = this.obj.meta;
      this.aviso(4);
    }
    if (E.marcadoObj[i] === 4) this.custodiosVivos = Math.max(0, this.custodiosVivos - 1);
    if (i === this.guardian) guardianMuerto(this, i);
    if (t === TIPO_ALTAR) {
      this.obj.prog++;
      if (j) j.resumen.altares++;
      // Cada altar que cae llama una oleada
      for (let k = 0; k < 10 + 4 * this.n; k++) {
        const a = this.az.n() * Math.PI * 2, r = this.az.entre(5, 8);
        const p = this.mapa.abiertaCerca(x + Math.cos(a) * r, y + Math.sin(a) * r, 3);
        if (p) aparecerEnemigo(this, this.tipoAlAzar(), p.x, p.y, { desdeTierra: true });
      }
      this.aviso(3, this.obj.prog, this.obj.meta);
    }
    E.quitar(i);
  }

  /** Un tipo del bioma según el reloj (para oleadas). */
  tipoAlAzar(): number {
    const desdeEf = 1 + 0.35 * (this.cfg.etapa - 1);
    const lista = this.bioma.enemigos.filter((e) => e.desde / desdeEf <= this.t + 30 && e.id !== 'caballero_muerte');
    const e = this.az.pesado(lista, (x) => x.peso) ?? this.bioma.enemigos[0];
    return TIPOS.findIndex((d) => d.id === e.id);
  }

  /** Explosión de un jugador: daña en área. */
  private profExplosion = 0;
  /** Explosiones que provocó otra explosión (en cadena): se hacen en el paso siguiente, no anidadas. */
  private diferidas: { x: number; y: number; r: number; dano: number; g: Golpe; clase: number }[] = [];

  explosion(x: number, y: number, r: number, dano: number, g: Golpe, clase = 0) {
    if (this.profExplosion >= 2) {
      if (this.diferidas.length < 160) this.diferidas.push({ x, y, r, dano, g: Object.assign(new Golpe(), g), clase });
      return;
    }
    this.profExplosion++;
    try {
      this.explotar(x, y, r, dano, g, clase);
    } finally {
      this.profExplosion--;
    }
  }

  private explotar(x: number, y: number, r: number, dano: number, g: Golpe, clase: number) {
    this.suc.push(S.EXPLOSION, x, y, r, clase);
    // (lista propia: una muerte dentro puede provocar otra explosión)
    const lista: number[] = [];
    this.enRadio(x, y, r, lista);
    const gx = g.dx, gy = g.dy;
    for (const i of lista) {
      const dx = this.E.x[i] - x, dy = this.E.y[i] - y;
      const l = Math.hypot(dx, dy) || 1;
      g.dx = dx / l;
      g.dy = dy / l;
      this.danar(i, dano, g);
    }
    g.dx = gx;
    g.dy = gy;
  }

  /** Explosión de un enemigo: daña a los jugadores (y a los aliados). */
  explosionEnemiga(x: number, y: number, r: number, dano: number) {
    this.suc.push(S.EXPLOSION, x, y, r, 4);
    for (const j of this.J) {
      if (j.estado !== 0) continue;
      if ((j.x - x) ** 2 + (j.y - y) ** 2 < (r + RADIO_JUGADOR) ** 2) this.herir(j, dano, x, y);
    }
    for (const a of this.A) if (a.vivo && a.hpMax > 1 && (a.x - x) ** 2 + (a.y - y) ** 2 < r * r) a.hp -= dano;
  }

  /** Rompe las paredes blandas (y escombros) a menos de r (explosiones del explosivista, la bomba); con `vetas`, también
   *  las vetas, que sueltan lo que tienen (la carga minera, los cartuchos). */
  romperParedes(x: number, y: number, r: number, j: Jugador | null, tambienDuras = false, vetas = false) {
    const m = this.mapa;
    const antes = this.atraerA;
    if (vetas && j) this.atraerA = j.i;
    for (let cy = Math.floor(y - r); cy <= Math.ceil(y + r); cy++)
      for (let cx = Math.floor(x - r); cx <= Math.ceil(x + r); cx++) {
        if ((cx + 0.5 - x) ** 2 + (cy + 0.5 - y) ** 2 > r * r) continue;
        const t = m.get(cx, cy);
        if (t === C.BLANDA || t === C.ESCOMBRO || (tambienDuras && t === C.DURA) || (vetas && (t === C.HIERRO || t === C.ORO || t === C.SANGRE || t === C.HUEVO || t === C.MINERAL))) {
          const roto = m.excavar(cx, cy, 99);
          if (roto >= 0) this.alRomper(cx, cy, roto, j);
        }
      }
    this.atraerA = antes;
  }

  // ----------------------------------------------------------------------------------------------- Jugadores
  curar(j: Jugador, cant: number, robo = false) {
    if (j.estado !== 0 || cant <= 0) return;
    const c = cant * Math.max(0.1, 1 + j.st.curacion) * this.curaPeligro;
    const antes = j.hp;
    j.hp = Math.min(j.hpMax, j.hp + c);
    j.resumen.curado = (j.resumen.curado ?? 0) + (j.hp - antes);
    if (!robo && j.hp - antes >= 1) this.suc.push(S.CURA, j.i, j.hp - antes);
  }

  /** Un enemigo (o una trampa) le pega a un jugador. Devuelve el daño hecho. */
  herir(j: Jugador, dano: number, x: number, y: number, esquivable = true): number {
    if (j.estado !== 0 || j.invul > 0 || this.inmortales && j.hp <= 1) return 0;
    // (grasa de armadura: caminando se esquiva más)
    const esq = j.st.esquiva + (j.tiene('grasa_armadura') && Math.hypot(j.vx, j.vy) > 1 ? 0.1 : 0);
    if (esquivable && esq > 0 && this.az.n() < esq) {
      this.suc.push(S.ESQUIVA, j.i);
      j.invul = 0.15;
      j.resumen.esquivas = (j.resumen.esquivas ?? 0) + 1;
      return 0;
    }
    if (j.paraGolpes > 0) {
      j.paraGolpes--;
      this.suc.push(S.BLOQUEO, j.i);
      j.invul = 0.4;
      return 0;
    }
    let d = mec.alRecibir(this, j, dano, x, y);
    if (d <= 0) return 0;
    // (la armadura rinde menos mientras más hondo, como en Deep Rock; la costra suma por la vida que falta)
    const arm = j.st.armadura + (j.tiene('costra') ? Math.floor((1 - j.hp / j.hpMax) * 50) : 0);
    d *= arm >= 0 ? 1 - arm / (arm + 12 + 2.5 * (this.cfg.etapa - 1)) : 1 + Math.min(0.5, -arm * 0.03);
    d = Math.max(1, d);
    j.hp -= d;
    j.golpeT = 0.25;
    j.invul = 0.3;
    this.suc.push(S.HERIDO, j.i, d, x, y);
    // Espinas
    if (j.st.espinas > 0) {
      const n = this.rej.circulo(j.x, j.y, 1.6);
      const g = this.G.reset();
      g.j = j.i;
      g.callado = true;
      for (let k = 0; k < n && k < 6; k++) {
        const i = this.rej.fuera[k];
        if (this.E.vivo[i] && (this.E.x[i] - j.x) ** 2 + (this.E.y[i] - j.y) ** 2 < 2) this.danar(i, j.st.espinas, g);
      }
    }
    if (j.hp <= 0) this.caer(j);
    else mec.alSerHerido(this, j, d, x, y);
    return d;
  }

  /** Se le acabó la vida: segunda oportunidad, caído (con compañeros) o derrota. */
  private caer(j: Jugador) {
    if (this.inmortales) {
      j.hp = 1;
      return;
    }
    if (mec.segundaOportunidad(this, j)) return;
    j.hp = 0;
    j.resumen.caidas++;
    if (this.J.filter((o) => o !== j && o.estado === 0).length > 0) {
      j.estado = 1;
      j.caidoT = 40;
      j.levantar = 0;
      this.suc.push(S.CAIDO, j.i);
    } else {
      j.estado = 1;
      j.caidoT = 0;
      this.suc.push(S.CAIDO, j.i);
    }
  }

  /** Experiencia compartida: todos los que siguen en pie la reciben (con su propio % extra). */
  ganarXp(xp: number) {
    const f = this.n > 1 ? this.esc.botin * 1.25 : 1;
    for (const j of this.J) {
      if (j.estado !== 0 && j.estado !== 1) continue;
      j.xp += xp * f * (1 + j.st.experiencia);
      let subidas = 0;
      while (j.xp >= xpPara(j.nivel) && subidas < 5) {
        j.xp -= xpPara(j.nivel);
        j.nivel++;
        subidas++;
        this.suc.push(S.NIVEL, j.i, j.nivel);
        encolarNivel(this, j);
        this.curar(j, j.hpMax * 0.05);
        if (j.tiene('iman_total')) this.atraerTodo(j);
      }
    }
  }

  /** Atrae todas las almas del mapa hacia el jugador. */
  atraerTodo(j: Jugador) {
    for (const r of this.R) if (r.vivo && r.tipo <= REC.ALMA_ROJA) r.hacia = j.i;
  }

  // ----------------------------------------------------------------------------------------------- Paso
  paso(dt: number) {
    this.suc.limpiar();
    if (this.fin) return;
    if (this.quieto > 0) {
      this.quieto -= dt;
      // El tiempo detenido: los jugadores se mueven y pegan, la horda no
      this.rehacerRejilla();
      for (const j of this.J) this.moverJugador(j, dt);
      for (const j of this.J) if (j.estado === 0) actualizarArmas(this, j, dt);
      moverProyectiles(this, dt, true);
      this.recoger(dt);
      return;
    }
    this.t += dt;
    if (this.eclipse > 0) this.eclipse -= dt;
    this.rehacerRejilla();
    // Jugadores: moverse, excavar, mecánica, habilidad y armas
    for (const j of this.J) this.moverJugador(j, dt);
    for (const j of this.J) {
      if (j.estado !== 0) continue;
      mec.tick(this, j, dt);
      if (j.pideHabilidad) {
        j.pideHabilidad = false;
        if (j.habT <= 0) mec.habilidad(this, j);
      }
      if (j.pideTomar) {
        tomarConMano(this, j, j.pideTomar.x, j.pideTomar.y);
        j.pideTomar = null;
      }
      actualizarArmas(this, j, dt);
    }
    this.levantarCaidos(dt);
    // Las explosiones en cadena que quedaron pendientes
    if (this.diferidas.length) for (const d of this.diferidas.splice(0, 40)) this.explosion(d.x, d.y, d.r, d.dano, d.g, d.clase);
    // Campo de flujo (unas 4 veces por segundo, o ya si se excavó)
    this.flujoT -= dt;
    if (this.flujoT <= 0 || this.mapa.cambios.length > 0 && this.flujoT < 0.15) this.calcularFlujo();
    if (this.flujoObj) {
      this.flujoObjT -= dt;
      if (this.flujoObjT <= 0) this.calcularFlujoObjetivo();
    }
    if (!this.sinHorda) dirigirHorda(this, dt);
    moverEnemigos(this, dt);
    moverAliados(this, dt);
    moverProyectiles(this, dt, false);
    moverZonas(this, dt);
    this.recoger(dt);
    actualizarObjetivos(this, dt);
    actualizarBioma(this, dt);
    // Fin por derrota: nadie queda en pie
    if (!this.fin && !this.J.some((j) => j.estado === 0)) {
      this.fin = { exito: false, extraidos: [], motivo: 'derrota', objetivo: this.obj.hecho, secundario: this.sec.prog, prisioneros: 0 };
    }
  }

  private rehacerRejilla() {
    const E = this.E;
    this.rej.limpiar();
    for (let i = 0; i < E.max; i++) if (E.vivo[i]) this.rej.insertar(i, E.x[i], E.y[i]);
  }

  calcularFlujo() {
    this.flujoT = 0.25;
    const fuentes = this.J.filter((j) => j.estado === 0 && j.invisible <= 0);
    this.flujo.calcular(fuentes.length ? fuentes : this.J);
    this.mapa.cambios.length = 0;
  }

  calcularFlujoObjetivo() {
    this.flujoObjT = 0.5;
    const e = this.ent.find((x) => x.vivo && (x.tipo === ENT.CARRETA || x.tipo === ENT.CAMPANA_DEF) && x.est === 1);
    if (!e || !this.flujoObj) return;
    this.flujoObj.calcular([{ x: e.x, y: e.y }], 10, 22);
  }

  // ----------------------------------------------------------------------------------------------- Movimiento
  /** Mueve a un jugador con su mando: choca con las paredes, excava las que empuja y lo frena el agua. */
  moverJugador(j: Jugador, dt: number) {
    if (j.invul > 0) j.invul -= dt;
    if (j.golpeT > 0) j.golpeT -= dt;
    if (j.invisible > 0) j.invisible -= dt;
    if (j.prisaT > 0) j.prisaT -= dt;
    if (j.buffT > 0) {
      j.buffT -= dt;
      if (j.buffT <= 0) j.buffDano = j.buffVel = j.buffCad = 0;
    }
    if (j.estado !== 0) {
      j.vx = j.vy = 0;
      return;
    }
    // Regeneración
    if (j.st.regen !== 0) {
      if (j.st.regen > 0) this.curar(j, j.st.regen * dt, true);
      else j.hp = Math.max(1, j.hp + j.st.regen * dt);
    }
    if (j.remoto) {
      // Lo mueve su propio aparato: aquí solo se excava si empuja una pared
      this.excavarEmpujando(j, j.mx, j.my, dt);
      return;
    }
    let mx = j.mx, my = j.my;
    // Encantado por una novia vampira: lo jalan
    if (j.encantoT > 0) {
      j.encantoT -= dt;
      const l = Math.hypot(j.encantoX - j.x, j.encantoY - j.y) || 1;
      mx = mx * 0.35 + ((j.encantoX - j.x) / l) * 0.65;
      my = my * 0.35 + ((j.encantoY - j.y) / l) * 0.65;
    }
    const l = Math.hypot(mx, my);
    if (l > 1) {
      mx /= l;
      my /= l;
    }
    let vel = j.velocidad * (this.barro ? 0.85 : 1);
    if (this.mapa.get(Math.floor(j.x), Math.floor(j.y)) === C.AGUA) vel *= 0.6;
    if (mec.embistiendo(j)) {
      mec.moverEmbestida(this, j, dt);
      return;
    }
    // Aceleración y frenado suaves: arranca con algo de peso y frena deslizando un poquito (antes era casi instantáneo
    // y se sentía tosco: cada toque del joystick era un tirón)
    const k = Math.min(1, dt * (l > 0.05 ? 9 : 7));
    j.vx += (mx * vel - j.vx) * k;
    j.vy += (my * vel - j.vy) * k;
    if (l > 0.15) {
      // Gira hacia donde va en vez de voltearse de golpe
      const kf = Math.min(1, dt * 16);
      j.fx += (mx / Math.max(l, 1e-3) - j.fx) * kf;
      j.fy += (my / Math.max(l, 1e-3) - j.fy) * kf;
      const lf = Math.hypot(j.fx, j.fy) || 1;
      j.fx /= lf;
      j.fy /= lf;
    }
    this.moverCirculo(j, j.vx * dt, j.vy * dt);
    j.quietoT = l > 0.15 ? 0 : j.quietoT + dt;
    if (l > 0.3) this.excavarEmpujando(j, mx, my, dt);
    else j.excavando = -1;
  }

  /** Mueve un círculo de jugador con choque contra la rejilla (deslizando por las paredes). */
  moverCirculo(j: { x: number; y: number }, dx: number, dy: number, r = RADIO_JUGADOR) {
    const m = this.mapa;
    // Pasos chicos para no atravesar paredes a alta velocidad
    const pasos = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.3));
    for (let s = 0; s < pasos; s++) {
      j.x += dx / pasos;
      this.empujarFuera(j, r, m, true);
      j.y += dy / pasos;
      this.empujarFuera(j, r, m, false);
    }
  }

  /** Saca al círculo de las celdas sólidas cercanas. */
  empujarFuera(p: { x: number; y: number }, r: number, m: Mapa, _ejeX: boolean) {
    const cx0 = Math.floor(p.x - r), cx1 = Math.floor(p.x + r), cy0 = Math.floor(p.y - r), cy1 = Math.floor(p.y + r);
    for (let cy = cy0; cy <= cy1; cy++)
      for (let cx = cx0; cx <= cx1; cx++) {
        if (!esSolida(m.get(cx, cy))) continue;
        // Punto más cercano de la celda al centro
        const nx = Math.max(cx, Math.min(p.x, cx + 1)), ny = Math.max(cy, Math.min(p.y, cy + 1));
        const dx = p.x - nx, dy = p.y - ny;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        if (d2 < 1e-8) {
          // El centro quedó adentro: salir por el lado más corto
          const izq = p.x - cx, der = cx + 1 - p.x, arr = p.y - cy, aba = cy + 1 - p.y;
          const mn = Math.min(izq, der, arr, aba);
          if (mn === izq) p.x = cx - r;
          else if (mn === der) p.x = cx + 1 + r;
          else if (mn === arr) p.y = cy - r;
          else p.y = cy + 1 + r;
          continue;
        }
        const d = Math.sqrt(d2);
        const empuje = r - d;
        p.x += (dx / d) * empuje;
        p.y += (dy / d) * empuje;
      }
  }

  /** Si el jugador camina contra una pared excavable, la excava (con su velocidad de excavar). */
  excavarEmpujando(j: Jugador, mx: number, my: number, dt: number) {
    const l = Math.hypot(mx, my);
    if (l < 0.3) {
      j.excavando = -1;
      return;
    }
    const ux = mx / l, uy = my / l;
    // La celda justo delante (un poco más allá del radio)
    const alc = RADIO_JUGADOR + (j.tiene('pico_largo') ? 0.55 : 0.18);
    const px = j.x + ux * alc, py = j.y + uy * alc;
    let cx = Math.floor(px), cy = Math.floor(py);
    let t = this.mapa.get(cx, cy);
    if (!esExcavable(t)) {
      // Probar con el eje dominante (al deslizar por una esquina)
      if (Math.abs(ux) > Math.abs(uy)) cy = Math.floor(j.y);
      else cx = Math.floor(j.x);
      t = this.mapa.get(cx, cy);
      if (!esExcavable(t)) {
        j.excavando = -1;
        return;
      }
    }
    const fuerza = (1 + j.st.excavar) * (this.cfg.exp.tutorial ? 1.6 : 1);
    const i = this.mapa.idx(cx, cy);
    if (j.excavando !== i) {
      j.excavando = i;
      j.excavaT = 0;
    }
    j.excavaT -= dt;
    if (j.excavaT <= 0) {
      j.excavaT = 0.16;
      this.suc.push(S.EXCAVA, cx, cy, t, j.i);
    }
    const roto = this.mapa.excavar(cx, cy, fuerza * dt);
    if (roto >= 0) {
      j.excavando = -1;
      this.alRomper(cx, cy, roto, j);
    }
    // Pico ancho: también pica las dos paredes de los lados
    if (j.objeto('pico_ancho')) {
      const lados = Math.abs(ux) > Math.abs(uy) ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      for (const [dx, dy] of lados) {
        if (!esExcavable(this.mapa.get(cx + dx, cy + dy))) continue;
        const r2 = this.mapa.excavar(cx + dx, cy + dy, fuerza * dt * 0.6);
        if (r2 >= 0) this.alRomper(cx + dx, cy + dy, r2, j);
      }
    }
  }

  /** Se rompió una pared: botín de las vetas, mecánicas y sucesos. */
  alRomper(cx: number, cy: number, tipo: number, j: Jugador | null) {
    this.suc.push(S.ROTO, cx, cy, tipo);
    const x = cx + 0.5, y = cy + 0.5;
    const vetas = (1 + (j ? mec.extraVetas(j) + j.st.vetas : 0)) * (this.cfg.exp.mutadores.includes('esmeralda') ? 1.8 : 1) * (this.cfg.exp.mutadores.includes('cosecha') ? 1.6 : 1) * (this.mineria ? 3 : 1);
    // (la minería paga bien: con eso se compra en la Forja y se suben las armas en el yunque)
    // (las vetas pagan menos que antes: la plata grande la cargan los bichos del botín)
    if (tipo === C.HIERRO) this.soltar(REC.HIERRO, x, y, Math.round(this.az.entero(2, 3) * vetas));
    else if (tipo === C.SANGRE) this.soltar(REC.SANGRE, x, y, Math.round(this.az.entero(1, 3) * vetas));
    else if (tipo === C.ORO) this.soltar(REC.ORO, x, y, Math.round(this.az.entero(4, 7) * vetas));
    else if (tipo === C.HUEVO) this.soltar(REC.HUEVO, x, y, 1);
    else if (tipo === C.GRISU || tipo === C.COLUMNA) alRomperBioma(this, cx, cy, tipo);
    else if (tipo === C.MINERAL) this.soltar(REC.MINERAL + (this.mapa.v[this.mapa.idx(cx, cy)] % 6), x, y, Math.max(1, Math.round(this.az.entero(1, 2) * vetas)));
    // (solo minería: las almas salen de la roca)
    if (this.mineria) this.soltarAlmas(x, y, 5);
    if (j) {
      j.resumen.excavadas++;
      mec.alExcavar(this, j, cx, cy, tipo);
      if (j.tiene('excavar_almas')) this.soltar(REC.ALMA_AZUL, x, y, 1);
      // Cartuchos de minero: cada 6 paredes rotas, la siguiente revienta (rompe roca y vetas, lastima alrededor)
      if (j.objeto('cartuchos_minero') && !this.enCartucho) {
        j.m.cartuchos = (j.m.cartuchos ?? 0) + 1;
        if (j.m.cartuchos >= 6) {
          j.m.cartuchos = 0;
          this.enCartucho = true;
          const g = this.G.reset();
          g.j = j.i;
          g.empuje = 4;
          this.explosion(x, y, 1.8, 20 * (1 + j.st.dano), g, 0);
          this.romperParedes(x, y, 1.6, j, false, true);
          this.enCartucho = false;
        }
      }
    }
    this.flujoT = Math.min(this.flujoT, 0.05);
  }

  // ----------------------------------------------------------------------------------------------- Caídos
  private levantarCaidos(dt: number) {
    for (const j of this.J) {
      if (j.estado !== 1) continue;
      if (j.caidoT > 0) {
        j.caidoT -= dt;
        if (j.caidoT <= 0) {
          j.estado = 2;
          j.oro = j.hierro = j.sangre = 0;
          this.aviso(7, j.i);
          continue;
        }
      }
      let alguien = false;
      for (const o of this.J) {
        if (o === j || o.estado !== 0) continue;
        if ((o.x - j.x) ** 2 + (o.y - j.y) ** 2 < 1.8 * 1.8) {
          alguien = true;
          j.levantar += (dt / 3) * mec.velocidadLevantar(o);
        }
      }
      if (!alguien) j.levantar = Math.max(0, j.levantar - dt * 0.25);
      if (j.levantar >= 1) {
        j.estado = 0;
        j.hp = Math.round(j.hpMax * 0.4);
        j.invul = 2;
        j.levantar = 0;
        this.suc.push(S.LEVANTA, j.i);
        for (const o of this.J) if (o !== j && o.estado === 0 && (o.x - j.x) ** 2 + (o.y - j.y) ** 2 < 4) o.resumen.levantados++;
      }
    }
  }

  // ----------------------------------------------------------------------------------------------- Recogibles
  private recoger(dt: number) {
    for (const r of this.R) {
      if (!r.vivo) continue;
      r.t += dt;
      if (r.espera > 0) r.espera -= dt;
      // Vuelo inicial (sale disparado del muerto)
      if (r.z > 0 || r.vz > 0) {
        r.vz -= 14 * dt;
        r.z += r.vz * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        if (this.mapa.solidaEn(r.x, r.y)) {
          r.x -= r.vx * dt;
          r.y -= r.vy * dt;
          r.vx = r.vy = 0;
        }
        if (r.z <= 0) {
          r.z = 0;
          r.vz = 0;
          r.vx *= 0.3;
          r.vy *= 0.3;
        }
      }
      if (r.espera > 0) continue;
      // Imán: el jugador vivo más cercano dentro de su radio
      if (r.hacia < 0) {
        const grande = r.tipo === REC.COFRE || r.tipo === REC.EQUIPO;
        for (const j of this.J) {
          if (j.estado !== 0) continue;
          // (el área de recoger es más grande que el dibujo: basta con pasar cerca)
          const rad = grande ? RADIO_GRANDE : r.tipo === REC.LLAVE ? RADIO_LLAVE : j.radioIman;
          if ((j.x - r.x) ** 2 + (j.y - r.y) ** 2 < rad * rad) {
            r.hacia = j.i;
            break;
          }
        }
        continue;
      }
      const j = this.J[r.hacia];
      if (!j || j.estado !== 0) {
        r.hacia = -1;
        continue;
      }
      const dx = j.x - r.x, dy = j.y - r.y;
      const d = Math.hypot(dx, dy);
      const v = 6 + r.t * 10;
      if (d < 0.35 || d < v * dt) {
        this.tomar(j, r);
        r.vivo = false;
        continue;
      }
      r.x += (dx / d) * v * dt;
      r.y += (dy / d) * v * dt;
    }
  }

  /** El jugador toma un recogible. */
  private tomar(j: Jugador, r: Recogible) {
    const f = this.esc.botin;
    switch (r.tipo) {
      case REC.ALMA_AZUL:
      case REC.ALMA_VERDE:
      case REC.ALMA_ROJA:
        this.ganarXp(r.valor * (j.clase === 'juglar' && j.spec === 2 ? 1.2 : 1));
        j.resumen.almas += r.valor;
        mec.alRecoger(this, j, 'alma', r.valor);
        break;
      case REC.ORO: {
        const v = r.valor * (1 + j.st.oro) * mec.multOroGrupo(this);
        for (const o of this.J) if (o.estado === 0 || o.estado === 1) o.oro += v * (this.n > 1 ? f * 1.2 : 1);
        j.resumen.oro += v;
        mec.alRecoger(this, j, 'oro', v);
        break;
      }
      case REC.HIERRO:
        for (const o of this.J) if (o.estado === 0 || o.estado === 1) o.hierro += r.valor * (this.n > 1 ? f * 1.3 : 1);
        j.resumen.hierro += r.valor;
        if (this.obj.tipo === 'hierro') this.obj.prog = Math.min(this.obj.meta, this.obj.prog + r.valor);
        mec.alRecoger(this, j, 'hierro', r.valor);
        break;
      case REC.SANGRE:
        for (const o of this.J) if (o.estado === 0 || o.estado === 1) o.sangre += r.valor * (this.n > 1 ? f * 1.3 : 1);
        j.resumen.sangre += r.valor;
        if (j.tiene('cristal_sangre')) this.curar(j, 3);
        break;
      case REC.COMIDA:
        if (!j.tiene('vampirismo')) this.curar(j, j.hpMax * 0.3);
        // (corazón confitado: cada pierna de pollo sube la vida máxima)
        if (j.tiene('corazon_confitado')) {
          j.extra.vida = (j.extra.vida ?? 0) + 3;
          j.recalcular();
        }
        break;
      case REC.GOTA:
        this.curar(j, 2 + 1.5 * j.bend('banquete'));
        break;
      case REC.COFRE:
        mec.abrirCofre(this, j, false);
        break;
      case REC.LLAVE:
        j.m.llaves = (j.m.llaves ?? 0) + 1;
        this.aviso(9, j.i);
        break;
      case REC.FRASCO:
        if (this.sec.tipo === 'frascos') this.sec.prog++;
        j.resumen.frascos++;
        this.aviso(10, this.sec.prog, this.sec.meta);
        break;
      case REC.HUEVO:
        if (this.sec.tipo === 'huevos') this.sec.prog++;
        this.aviso(11, this.sec.prog, this.sec.meta);
        break;
      case REC.MINERAL:
      case REC.MINERAL + 1:
      case REC.MINERAL + 2:
      case REC.MINERAL + 3:
      case REC.MINERAL + 4:
      case REC.MINERAL + 5:
        // (los minerales son de todos: cada uno se lleva la cantidad completa a su Pozo)
        for (const o of this.J) if (o.estado === 0 || o.estado === 1) o.minerales[r.tipo - REC.MINERAL] += r.valor;
        j.resumen.minerales = (j.resumen.minerales ?? 0) + r.valor;
        break;
      case REC.ROSA:
        if (this.sec.tipo === 'rosas') this.sec.prog++;
        this.curar(j, j.hpMax * 0.06);
        this.aviso(31, this.sec.prog, this.sec.meta);
        break;
      case REC.PLUMA:
        // (el viento del grifo: un ratico más rápido)
        if (this.sec.tipo === 'plumas') this.sec.prog++;
        j.buffVel = Math.max(j.buffVel, 0.3);
        j.buffT = Math.max(j.buffT, 6);
        this.aviso(32, this.sec.prog, this.sec.meta);
        break;
      case REC.HONGO:
        if (this.sec.tipo === 'hongos') this.sec.prog++;
        this.ganarXp(3 * this.esc.xp);
        if (this.sec.prog === this.sec.meta || this.sec.prog % 3 === 0) this.aviso(33, this.sec.prog, this.sec.meta);
        break;
      case REC.EQUIPO:
        mec.recogerEquipo(this, j);
        break;
      case REC.IMAN:
        this.atraerTodo(j);
        break;
    }
    this.suc.push(S.RECOGE, j.i, r.tipo, r.valor);
  }

  /** La campana: la llama el objetivo cumplido, el reloj o la muerte del jefe. */
  llamarCampana() {
    llamarCampana(this);
  }

  /** ¿Qué tan oscuro está? (para el dibujo) 0 normal, 1 eclipse total. */
  get oscuridad() {
    if (this.eclipse > 0) return Math.min(1, this.eclipse / 2, (20 - Math.max(0, 20 - this.eclipse)) / 2 + 0.3);
    // (la niebla del cementerio: oscurece menos que el eclipse)
    return this.niebla > 0 ? 0.55 * Math.min(1, this.niebla / 2, (16 - this.niebla) / 2 + 0.2) : 0;
  }

  /** Para pruebas y para el bot: la entrada de un jugador. */
  mando(i: number, mx: number, my: number, habilidad = false) {
    const j = this.J[i];
    if (!j) return;
    j.mx = mx;
    j.my = my;
    if (habilidad) j.pideHabilidad = true;
  }

  /** El dueño de la carreta / campana de defensa para el dibujo y la red. */
  entidad(tipo: number) {
    return this.ent.find((e) => e.vivo && e.tipo === tipo) ?? null;
  }

  /** Daño de enemigo según su tipo y la escala. */
  danoEnemigo(def: DefEnemigo, elite: number) {
    return def.dano * this.esc.dano * this.calentamiento * (elite ? 1.5 : 1);
  }

  /** Los primeros dos minutos de la primera etapa pegan más suave (para armarse antes de que llegue lo duro). */
  get calentamiento() {
    return this.cfg.etapa === 1 ? 0.55 + 0.45 * Math.min(1, this.t / 150) : 1;
  }

  get cuentaExtraccion() {
    return CUENTA_EXTRACCION * (this.cfg.exp.mutadores.includes('campana_borracha') ? 0.55 : 1);
  }
  get proyectilesVivos() {
    let n = 0;
    for (const p of this.P) if (p.vivo) n++;
    return n;
  }
}
