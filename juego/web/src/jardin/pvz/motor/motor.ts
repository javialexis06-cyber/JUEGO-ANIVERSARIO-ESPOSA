// MotorPvZ: la partida de Plantas contra Zombis en paso fijo de 1/60 s, determinista y sin vista.
//
// Uso típico desde la interfaz:
//   const m = new MotorPvZ(nivelPorId('1-4')!, { semilla, mazo });
//   m.comenzar();                       // tras «¡Preparados… listos… a plantar!»
//   cada cuadro: m.paso() (dos veces con ×2), leer m.eventos y dibujar las entidades.
//   órdenes: m.sembrar(tipo, fila, col), m.sembrarCinta(idItem, fila, col), m.palear(fila, col),
//            m.recoger(id), m.usarAbono(fila, col).
//
// El motor resuelve lo común (caminar, morder, armaduras, estados, proyectiles, cortacéspedes, sol, oleadas,
// monedas y abono). Lo propio de cada planta o zombi vive en comportamiento/<area>.ts.
import { COMPORTAMIENTO_PLANTAS, COMPORTAMIENTO_ZOMBIS } from '../comportamiento/index';
import { ordenNivel } from '../datos/niveles';
import { defPlanta, PLANTAS } from '../datos/plantas';
import { defZombi } from '../datos/zombis';
import type {
  AbonoSuelto, Altura, Capa, CausaMuerte, Cortacesped, Crater, DefNivel, DefPlanta, DefZombi, EstadoJuego, Evento,
  IdPlanta, IdZombi, ItemCinta, Lapida, Moneda, MotivoRechazo, Planta, Premio, Proyectil, Resultado, Sol, Tarjeta,
  Terreno, TipoDano, Zombi, ZombiCaido,
} from '../tipos';
import { Azar } from './azar';
import { pasoCinta } from './cinta';
import { crearDirector, pasoOleadas, planificarOleadas, type EstadoDirector, type PlanOleada } from './oleadas';
import * as R from './reglas';

export interface OpcionesMotor {
  /** Semilla del azar (misma semilla y mismas órdenes → misma partida). */
  semilla?: number;
  /** Sobres elegidos en la selección. Por defecto, las plantas disponibles que quepan en las ranuras. */
  mazo?: IdPlanta[];
  /** Ranuras del banco (compras de la tienda). Por defecto, las del nivel. */
  ranuras?: number;
  /** Pala y abono ganados (en la aventura llegan al superar 1-4). Por defecto, según el orden del nivel. */
  pala?: boolean;
  abono?: boolean;
  /** Caen monedas (desde 2-1 o al repetir). */
  monedas?: boolean;
  /** Segunda vuelta: más oleadas, más zombis, fórmula de puntos más alta y bolsa de monedas como premio. */
  repeticion?: boolean;
  /** Para pruebas y modos libres: sin director de oleadas o sin sol del cielo. */
  sinOleadas?: boolean;
  sinSolCielo?: boolean;
}

/** Pala, abono y monedas que tiene el jugador al llegar a este nivel la primera vez. */
export function opcionesPorDefecto(nivel: DefNivel, repeticion = false): Required<Pick<OpcionesMotor, 'pala' | 'abono' | 'monedas'>> {
  const orden = ordenNivel(nivel.id);
  const trasPala = orden < 0 || orden > ordenNivel('1-4');
  return { pala: trasPala || repeticion, abono: trasPala || repeticion, monedas: repeticion || nivel.mundo >= 2 };
}

/** Resultado del daño a un zombi (para el sonido del impacto y los efectos). */
export interface Golpe {
  dano: number;
  capa: 'escudo' | 'casco' | 'cuerpo' | null;
  metal: boolean;
  murio: boolean;
}

const NINGUNO: Golpe = { dano: 0, capa: null, metal: false, murio: false };
const ok: Resultado = { ok: true };
const no = (motivo: MotivoRechazo): Resultado => ({ ok: false, motivo });
const ORDEN_CAPAS: readonly Capa[] = ['principal', 'cubierta', 'base', 'temporal'];
/** Al morder, lo de encima se come primero. */
const ORDEN_MORDIDA: readonly Capa[] = ['cubierta', 'principal', 'base'];

export class MotorPvZ {
  readonly nivel: DefNivel;
  readonly semilla: number;
  readonly repeticion: boolean;
  readonly columnas = R.COLUMNAS;
  readonly filas: number;
  readonly altoFila: number;
  /** Filas donde salen zombis (césped o agua). */
  readonly filasActivas: number[];
  /** terreno[fila][col]. */
  readonly terreno: Terreno[][];
  readonly dia: boolean;
  readonly palaActiva: boolean;
  readonly abonoActivo: boolean;
  readonly monedasActivas: boolean;
  readonly sinOleadas: boolean;
  readonly solCielo: boolean;
  readonly abonoMax = R.ABONO_MAX;

  estado: EstadoJuego = 'intro';
  /** Segundos de juego desde comenzar(). */
  t = 0;
  /** Pasos dados (no avanza después del fin). */
  pasos = 0;
  sol: number;
  /** Dinero ganado en este nivel (monedas recogidas, cortacéspedes sobrantes y bolsa). */
  dinero = 0;
  abonoCargas = 0;
  /** Banco de semillas (vacío en los niveles de cinta). */
  mazo: Tarjeta[];
  /** Cinta transportadora (null si el nivel no tiene). */
  cinta: ItemCinta[] | null;
  cintaReloj = 0;

  plantas: Planta[] = [];
  zombis: Zombi[] = [];
  caidos: ZombiCaido[] = [];
  proyectiles: Proyectil[] = [];
  soles: Sol[] = [];
  monedas: Moneda[] = [];
  abonosSueltos: AbonoSuelto[] = [];
  cortacespedes: Cortacesped[];
  lapidas: Lapida[] = [];
  crateres: Crater[] = [];
  /** Columnas tapadas por la niebla desde la derecha. */
  nieblaColumnas: number;

  /** Oleadas ya lanzadas, total y banderas (oleadas enormes). */
  oleada = 0;
  readonly oleadasTotal: number;
  readonly banderas: number;
  /** Plan de oleadas (qué zombis trae cada una). La selección de semillas puede mostrar los tipos. */
  readonly plan: PlanOleada[];
  director: EstadoDirector;

  /** Lo que suelta el último zombi al ganar. */
  premio: Premio | null = null;
  /** Eventos del último paso (incluye los de las órdenes dadas desde el paso anterior). */
  eventos: Evento[] = [];
  azar: Azar;
  zombisMuertos = 0;
  solesCaidos = 0;
  relojCielo = 0;
  ultimaMuerte: { x: number; fila: number } | null = null;

  private ultimoId = 0;
  private enPaso = false;
  private pendientes: Evento[] = [];

  constructor(nivel: DefNivel, opciones: OpcionesMotor = {}) {
    this.nivel = nivel;
    this.semilla = opciones.semilla ?? 1;
    this.azar = new Azar(this.semilla);
    this.repeticion = !!opciones.repeticion;
    const porDefecto = opcionesPorDefecto(nivel, this.repeticion);
    this.palaActiva = opciones.pala ?? porDefecto.pala;
    this.abonoActivo = (opciones.abono ?? porDefecto.abono) && !nivel.sinAbono;
    this.monedasActivas = opciones.monedas ?? porDefecto.monedas;
    this.sinOleadas = !!opciones.sinOleadas;
    this.filas = nivel.filas;
    this.altoFila = nivel.filas === 6 ? R.ALTO_FILA_6 : R.ALTO_FILA_5;
    this.dia = !nivel.noche;
    const activas = (this.repeticion && nivel.repeticion?.filasActivas) || nivel.filasActivas;
    this.terreno = [];
    for (let f = 0; f < this.filas; f++) {
      const fila: Terreno[] = [];
      for (let c = 0; c < R.COLUMNAS; c++) {
        const d = nivel.terreno?.[f];
        if (d !== undefined) fila.push(Array.isArray(d) ? d[c] ?? 'tierra' : d);
        else if (nivel.area === 'tejado') fila.push('tejado');
        else if (nivel.filasAgua?.includes(f)) fila.push('agua');
        else fila.push(activas.includes(f) ? 'cesped' : 'tierra');
      }
      this.terreno.push(fila);
    }
    this.filasActivas = [];
    for (let f = 0; f < this.filas; f++) if (this.terreno[f].some((t) => t !== 'tierra')) this.filasActivas.push(f);
    this.solCielo = nivel.solDelCielo && !nivel.noche && !nivel.cinta && !opciones.sinSolCielo;
    this.sol = nivel.solInicial;
    this.nieblaColumnas = nivel.niebla ?? 0;
    this.cortacespedes = nivel.sinCortacesped ? [] : this.filasActivas.map((fila) => ({ fila, x: R.X_CORTACESPED, estado: 'listo' as const }));

    // Banco de semillas o cinta.
    this.cinta = nivel.cinta ? [] : null;
    const ranuras = opciones.ranuras ?? nivel.ranuras;
    const elegidas = nivel.cinta ? [] : (opciones.mazo ?? nivel.plantasDisponibles);
    const tipos: IdPlanta[] = [];
    for (const tipo of elegidas) if (defPlanta(tipo) && !tipos.includes(tipo) && tipos.length < ranuras) tipos.push(tipo);
    this.mazo = tipos.map((tipo) => {
      const d = PLANTAS[tipo];
      const restante = d.recargaInicial ?? R.recargaInicial(d.recarga);
      return { tipo, sol: d.sol, recarga: d.recarga, restante, lista: restante <= 0, disponible: restante <= 0 && this.sol >= d.sol };
    });

    // Oleadas.
    this.oleadasTotal = this.repeticion && nivel.repeticion ? nivel.repeticion.oleadas : nivel.oleadas;
    this.banderas = this.repeticion && nivel.repeticion ? nivel.repeticion.banderas : nivel.banderas;
    this.plan = planificarOleadas(this);
    this.director = crearDirector(this);
    this.relojCielo = this.azar.rango(4.25, 7);

    // Lápidas (noche) y plantas que ya están al empezar.
    for (let i = 0; i < (nivel.lapidas ?? 0); i++) this.ponerLapidaAlAzar();
    if (!this.repeticion) for (const pi of nivel.plantasIniciales ?? []) this.crearPlanta(pi.tipo, pi.fila, pi.col, { silencio: true });
    for (const [fila, col] of nivel.materas ?? []) this.crearPlanta('maceta', fila, col, { silencio: true });
  }

  // ------------------------------------------------------------------------------------------------------------
  // Consultas

  /** Centro x de una columna. */
  xCol(col: number): number {
    return col * R.ANCHO_COL + R.ANCHO_COL / 2;
  }

  /** Centro y de una fila. */
  yFila(fila: number): number {
    return fila * this.altoFila + this.altoFila / 2;
  }

  /** Columna que contiene una x (puede salir del jardín). */
  colDeX(x: number): number {
    return Math.floor(x / R.ANCHO_COL);
  }

  filaDeY(y: number): number {
    return Math.floor(y / this.altoFila);
  }

  defPlanta(tipo: IdPlanta): DefPlanta {
    return PLANTAS[tipo];
  }

  /** Progreso de la barra (0..1): avanza con las oleadas y la cuenta hacia la siguiente. */
  get progreso(): number {
    const total = this.oleadasTotal;
    if (total <= 0) return 0;
    const d = this.director;
    if (d.siguiente >= total) return 1;
    const frac = d.aviso > 0 ? 1 : d.cuentaInicial > 0 ? Math.min(1, Math.max(0, 1 - d.cuenta / d.cuentaInicial)) : 0;
    return Math.min(1, (d.siguiente + (d.esperando ? 0 : frac)) / total);
  }

  /** Posiciones (0..1) de las banderas en la barra de progreso. */
  get posBanderas(): number[] {
    const out: number[] = [];
    this.plan.forEach((o, i) => { if (o.enorme) out.push((i + 1) / this.oleadasTotal); });
    return out;
  }

  /** Banderas ya levantadas (oleadas enormes que ya salieron). */
  get banderasAlcanzadas(): number {
    let n = 0;
    for (let i = 0; i < this.director.siguiente; i++) if (this.plan[i]?.enorme) n++;
    return n;
  }

  tarjeta(tipo: IdPlanta): Tarjeta | undefined {
    return this.mazo.find((t) => t.tipo === tipo);
  }

  /** Planta viva en una casilla (la de la capa pedida, o la de encima: principal, cubierta, base, temporal). */
  plantaEn(fila: number, col: number, capa?: Capa): Planta | undefined {
    if (capa) return this.plantas.find((p) => p.vida > 0 && p.fila === fila && p.col === col && p.capa === capa);
    for (const c of ORDEN_CAPAS) {
      const p = this.plantas.find((q) => q.vida > 0 && q.fila === fila && q.col === col && q.capa === c);
      if (p) return p;
    }
    return undefined;
  }

  /** Zombis vivos (no caídos) de una fila. */
  zombisEnFila(fila: number): Zombi[] {
    return this.zombis.filter((z) => z.vida > 0 && z.fila === fila);
  }

  /** Puede recibir guisantes o esporas: va por el suelo o nadando a flote. */
  alcanzableRecto(z: Zombi): boolean {
    return z.altura === 'suelo' || z.altura === 'agua';
  }

  /**
   * Primer zombi enemigo delante de una planta en su fila al que le puede pegar un tiro recto. `alcance` en px
   * medidos desde el centro de la planta (Seta desesporada: 280).
   */
  objetivoRecto(p: Planta, alcance = Infinity): Zombi | undefined {
    let mejor: Zombi | undefined;
    for (const z of this.zombis) {
      if (z.vida <= 0 || z.fila !== p.fila || z.hipnotizado || !this.alcanzableRecto(z)) continue;
      if (z.x >= R.X_ATACABLE || z.x + R.MEDIO_ZOMBI <= p.x || z.x - R.MEDIO_ZOMBI > p.x + alcance) continue;
      if (!mejor || z.x < mejor.x) mejor = z;
    }
    return mejor;
  }

  // ------------------------------------------------------------------------------------------------------------
  // Órdenes del jugador

  /** Arranca la partida después de la intro. En 1-5 primero hay que arrancar con la pala las plantas de Dave. */
  comenzar(): Resultado {
    if (this.estado !== 'intro') return no('estado');
    if (this.nivel.palearAntes && this.plantas.some((p) => p.vida > 0)) return no('faltaPalear');
    this.estado = 'jugando';
    this.emitir({ t: 'inicio' });
    return ok;
  }

  /** Si se podría sembrar ahí ahora (para la planta fantasma de la interfaz). */
  puedeSembrar(tipo: IdPlanta, fila: number, col: number): Resultado {
    if (this.estado !== 'jugando') return no('estado');
    if (this.cinta) return no('cinta');
    const d = defPlanta(tipo);
    const tarjeta = this.tarjeta(tipo);
    if (!d || !tarjeta) return no('tipo');
    if (tarjeta.restante > 0) return no('recarga');
    if (this.sol < d.sol) return no('sol');
    return this.validarCasilla(d, fila, col);
  }

  /** Siembra desde el banco: cobra el sol y empieza la recarga del sobre. */
  sembrar(tipo: IdPlanta, fila: number, col: number): Resultado {
    const r = this.puedeSembrar(tipo, fila, col);
    if (!r.ok) return r;
    const tarjeta = this.tarjeta(tipo)!;
    this.sol -= tarjeta.sol;
    tarjeta.restante = tarjeta.recarga;
    this.crearPlanta(tipo, fila, col);
    this.actualizarTarjetas();
    return ok;
  }

  /** Siembra un sobre de la cinta (gratis). Las nueces de la bolera salen rodando. */
  sembrarCinta(idItem: number, fila: number, col: number): Resultado {
    if (this.estado !== 'jugando') return no('estado');
    if (!this.cinta) return no('cinta');
    const i = this.cinta.findIndex((it) => it.id === idItem);
    if (i < 0) return no('tipo');
    const d = defPlanta(this.cinta[i].tipo);
    if (!d) return no('tipo');
    const r = this.validarCasilla(d, fila, col);
    if (!r.ok) return r;
    this.cinta.splice(i, 1);
    if (d.datos?.rodante) this.soltarRodante(d, fila, col);
    else this.crearPlanta(d.id, fila, col);
    return ok;
  }

  /** Arranca la planta de encima de la casilla (sin devolver sol, como en PvZ 1). */
  palear(fila: number, col: number, capa?: Capa): Resultado {
    if (!this.palaActiva) return no('sinPala');
    if (this.estado !== 'jugando' && this.estado !== 'intro') return no('estado');
    if (!this.dentro(fila, col)) return no('casilla');
    const p = this.plantaEn(fila, col, capa);
    if (!p) return no('sinPlanta');
    if (p.abono > 0) return no('brillando');
    this.quitarPlanta(p, 'pala');
    return ok;
  }

  /** Recoge un sol, una moneda o una hoja de abono. Devuelve false si ya no está (o el abono está lleno). */
  recoger(id: number): boolean {
    if (this.estado !== 'jugando') return false;
    let i = this.soles.findIndex((s) => s.id === id);
    if (i >= 0) {
      const s = this.soles[i];
      this.soles.splice(i, 1);
      this.sol = Math.min(R.SOL_MAX, this.sol + s.valor);
      this.emitir({ t: 'recogeSol', sol: s.id, x: s.x, y: s.y, valor: s.valor });
      this.actualizarTarjetas();
      return true;
    }
    i = this.monedas.findIndex((c) => c.id === id);
    if (i >= 0) {
      const c = this.monedas[i];
      this.monedas.splice(i, 1);
      this.dinero += c.valor;
      this.emitir({ t: 'recogeMoneda', moneda: c.id, tipo: c.tipo, valor: c.valor, x: c.x, y: c.y });
      return true;
    }
    i = this.abonosSueltos.findIndex((a) => a.id === id);
    if (i >= 0 && this.abonoCargas < this.abonoMax) {
      const a = this.abonosSueltos[i];
      this.abonosSueltos.splice(i, 1);
      this.abonoCargas++;
      this.emitir({ t: 'recogeAbono', abono: a.id, x: a.x, y: a.y, cargas: this.abonoCargas });
      return true;
    }
    return false;
  }

  /** Da abono a la planta de encima de la casilla: la cura, la hace invulnerable mientras brilla y activa su efecto. */
  usarAbono(fila: number, col: number): Resultado {
    if (!this.abonoActivo) return no('sinAbono');
    if (this.estado !== 'jugando') return no('estado');
    if (this.abonoCargas <= 0) return no('sinCargas');
    if (!this.dentro(fila, col)) return no('casilla');
    const p = this.plantaEn(fila, col, 'principal') ?? this.plantaEn(fila, col, 'cubierta') ?? this.plantaEn(fila, col, 'base');
    if (!p) return no('sinPlanta');
    if (p.abono > 0) return no('brillando');
    const c = COMPORTAMIENTO_PLANTAS[p.tipo];
    if (!c?.abono) return no('sinEfecto');
    // Propuesto: el abono despierta a una seta dormida (en PvZ 1 solo lo hace el Grano de café).
    const dormia = p.dormida;
    p.dormida = false;
    if (!c.abono(this, p)) {
      p.dormida = dormia;
      return no('sinEfecto');
    }
    if (dormia) this.ponerEstado(p, 'quieto');
    p.vida = p.vidaMax;
    p.abono = Math.max(p.abono, R.ABONO_BRILLO);
    this.abonoCargas--;
    this.emitir({ t: 'abono', planta: p.id, tipo: p.tipo, fila: p.fila, col: p.col });
    return ok;
  }

  // ------------------------------------------------------------------------------------------------------------
  // Paso

  /**
   * Avanza 1/60 s. No hace nada en la intro ni después del fin (el estado queda congelado, incluidos los eventos
   * del último paso). Devuelve si avanzó: la interfaz solo debe leer `eventos` cuando devuelve true.
   */
  paso(): boolean {
    if (this.estado !== 'jugando') return false;
    const dt = R.DT;
    this.enPaso = true;
    this.eventos = this.pendientes;
    this.pendientes = [];
    this.pasos++;
    this.t += dt;

    this.pasoSolCielo(dt);
    pasoOleadas(this, dt);
    // Sin el umbral, la suma de 1/60 deja restos de coma flotante y un sobre de 7,5 s no quedaría listo a los 7,5 s.
    for (const tj of this.mazo) tj.restante = tj.restante - dt > 1e-6 ? tj.restante - dt : 0;
    if (this.cinta) pasoCinta(this, dt);
    this.pasoPlantas(dt);
    this.compactar();
    this.pasoZombis(dt);
    this.compactar();
    if (this.estado === 'jugando') {
      this.pasoProyectiles(dt);
      this.pasoCortacespedes(dt);
      this.compactar();
      this.pasoRecogibles(dt);
      this.pasoCaidos(dt);
      for (const c of this.crateres) c.t -= dt;
      if (this.crateres.length) this.crateres = this.crateres.filter((c) => c.t > 0);
      this.actualizarTarjetas();
      this.comprobarVictoria();
    }
    this.enPaso = false;
    return true;
  }

  private pasoSolCielo(dt: number): void {
    if (!this.solCielo) return;
    this.relojCielo -= dt;
    if (this.relojCielo > 0) return;
    const alto = this.filas * this.altoFila;
    const x = this.azar.rango(100, 680);
    const yFinal = this.azar.rango(130, alto - 40);
    this.crearSol(x, -40, yFinal, R.SOL_CIELO, 'cielo');
    this.relojCielo = Math.min(9.5, 4.25 + 0.1 * this.solesCaidos) + this.azar.rango(0, 2.75);
    this.solesCaidos++;
  }

  private pasoPlantas(dt: number): void {
    for (const p of this.plantas) {
      if (p.vida <= 0) continue;
      p.tEstado += dt;
      if (p.golpe > 0) p.golpe = Math.max(0, p.golpe - dt);
      if (p.abono > 0) p.abono = Math.max(0, p.abono - dt);
      COMPORTAMIENTO_PLANTAS[p.tipo]?.paso?.(this, p, dt);
    }
  }

  private pasoZombis(dt: number): void {
    for (const z of this.zombis) {
      if (z.vida <= 0) continue;
      z.edad += dt;
      z.tEstado += dt;
      if (z.golpe > 0) z.golpe = Math.max(0, z.golpe - dt);
      if (z.lento > 0) z.lento = Math.max(0, z.lento - dt);
      if (z.congelado > 0) z.congelado = Math.max(0, z.congelado - dt);
      if (z.mantequilla > 0) z.mantequilla = Math.max(0, z.mantequilla - dt);
      if (z.sinCabeza) {
        this.danoDirecto(z, R.DRENAJE_SIN_CABEZA * dt);
        if (z.vida <= 0) continue;
      }
      const c = COMPORTAMIENTO_ZOMBIS[z.tipo];
      if (!c?.paso?.(this, z, dt)) this.moverZombi(z, dt);
      if (z.vida > 0) this.comprobarCasa(z);
      if (this.estado !== 'jugando') return;
    }
  }

  /** Caminar y morder: lo común a todos los zombis. */
  private moverZombi(z: Zombi, dt: number): void {
    if (z.congelado > 0 || z.mantequilla > 0) {
      z.mordiendo = 0;
      return;
    }
    const f = z.lento > 0 ? R.FACTOR_LENTO : 1;
    const def = defZombi(z.tipo);
    if (z.hipnotizado) {
      const enemigo = this.zombiEnBoca(z);
      if (enemigo && !z.sinCabeza) {
        this.morderZombi(z, enemigo, dt, f);
        return;
      }
      z.mordiendo = 0;
      if (z.estado === 'come') this.ponerEstado(z, 'camina');
      z.x += z.vel * f * dt;
      if (z.x > R.X_FUERA) this.matarZombi(z, 'fuera');
      return;
    }
    if (!z.sinCabeza && def?.muerde !== false && (z.altura === 'suelo' || z.altura === 'agua')) {
      const h = this.zombiEnBoca(z);
      if (h) {
        this.morderZombi(z, h, dt, f);
        return;
      }
      const p = this.plantaEnBoca(z);
      if (p) {
        this.morderPlanta(z, p, dt, f, def);
        return;
      }
    }
    z.mordiendo = 0;
    if (z.estado === 'come' || z.estado === 'quieto') this.ponerEstado(z, z.sinCabeza ? 'sincabeza' : 'camina');
    z.x -= z.vel * f * dt;
  }

  /** Planta que la boca del zombi alcanza (la de más adelante; en la casilla, primero la cubierta). */
  plantaEnBoca(z: Zombi): Planta | undefined {
    let mejor: Planta | undefined;
    let rango = 99;
    for (const p of this.plantas) {
      if (p.vida <= 0 || p.fila !== z.fila || p.capa === 'temporal') continue;
      if (p.x > z.x - R.BOCA_CERCA + R.MEDIO_PLANTA || p.x < z.x - R.BOCA_LEJOS - R.MEDIO_PLANTA) continue;
      if (!this.mordible(p)) continue;
      const r = ORDEN_MORDIDA.indexOf(p.capa);
      if (!mejor || p.x > mejor.x || (p.x === mejor.x && r < rango)) {
        mejor = p;
        rango = r;
      }
    }
    return mejor;
  }

  /** Los zombis la muerden y se detienen ante ella. */
  mordible(p: Planta): boolean {
    const d = PLANTAS[p.tipo];
    if (d.rastrera || d.mordible === false) return false;
    const c = COMPORTAMIENTO_PLANTAS[p.tipo];
    return c?.mordible ? c.mordible(this, p) : true;
  }

  /** Zombi del otro bando al alcance de la boca (hipnotizados contra normales). */
  private zombiEnBoca(z: Zombi): Zombi | undefined {
    const a = z.dir === -1 ? z.x - R.BOCA_LEJOS : z.x + R.BOCA_CERCA;
    const b = z.dir === -1 ? z.x - R.BOCA_CERCA : z.x + R.BOCA_LEJOS;
    for (const o of this.zombis) {
      if (o === z || o.vida <= 0 || o.fila !== z.fila || o.hipnotizado === z.hipnotizado || !this.alcanzableRecto(o)) continue;
      if (o.x + R.MEDIO_ZOMBI >= a && o.x - R.MEDIO_ZOMBI <= b) return o;
    }
    return undefined;
  }

  private morderPlanta(z: Zombi, p: Planta, dt: number, f: number, def: DefZombi | undefined): void {
    this.empezarMordida(z, p.id);
    if (this.contarMordida(z, dt)) this.emitir({ t: 'muerde', zombi: z.id, planta: p.id, fila: z.fila, x: z.x });
    this.danarPlanta(p, (def?.mordida ?? R.MORDIDA) * f * dt, z);
  }

  private morderZombi(z: Zombi, o: Zombi, dt: number, f: number): void {
    this.empezarMordida(z, o.id);
    if (this.contarMordida(z, dt)) this.emitir({ t: 'muerde', zombi: z.id, planta: 0, fila: z.fila, x: z.x });
    this.danarZombi(o, R.MORDIDA * f * dt, 'mordida', { deFrente: false, sinDestello: true });
  }

  private empezarMordida(z: Zombi, id: number): void {
    if (z.mordiendo !== id) z.datos.nam = 0;
    z.mordiendo = id;
    this.ponerEstado(z, 'come');
  }

  /** Cuenta el tiempo mordiendo y avisa en cada «ñam». */
  private contarMordida(z: Zombi, dt: number): boolean {
    const antes = z.datos.nam ?? 0;
    z.datos.nam = antes + dt;
    return antes === 0 || Math.floor(z.datos.nam / R.RITMO_MORDIDA) > Math.floor(antes / R.RITMO_MORDIDA);
  }

  /** Cortacésped y derrota cuando un zombi llega a la casa. */
  private comprobarCasa(z: Zombi): void {
    if (z.hipnotizado || z.altura === 'aire' || z.altura === 'bajo tierra') return;
    if (z.x < R.X_ARRANCA_CORTACESPED) {
      const cm = this.cortacespedes.find((c) => c.fila === z.fila);
      if (cm && cm.estado === 'listo') {
        cm.estado = 'corre';
        this.emitir({ t: 'cortacesped', fila: z.fila });
        return;
      }
      if (cm && cm.estado === 'corre') return;
    }
    if (z.x < R.X_CASA) this.perder(z.fila);
  }

  private pasoProyectiles(dt: number): void {
    for (const pr of this.proyectiles) {
      if (pr.dano <= 0) continue;
      if (pr.forma === 'recto') this.pasoRecto(pr, dt);
      else if (pr.forma === 'lanzado') this.pasoLanzado(pr, dt);
      else this.pasoRodante(pr, dt);
    }
    this.proyectiles = this.proyectiles.filter((p) => p.dano > 0);
  }

  private pasoRecto(pr: Proyectil, dt: number): void {
    const antes = pr.x;
    pr.x += pr.vx * dt;
    let blanco: Zombi | undefined;
    for (const z of this.zombis) {
      if (z.vida <= 0 || z.fila !== pr.fila || z.hipnotizado || !this.alcanzableRecto(z)) continue;
      if (z.x - R.MEDIO_ZOMBI > pr.x || z.x + R.MEDIO_ZOMBI < antes) continue;
      if (!blanco || z.x < blanco.x) blanco = z;
    }
    if (blanco) {
      this.impactar(pr, blanco, pr.tipoDano);
      pr.dano = 0;
      return;
    }
    if ((pr.xMax !== undefined && pr.x > pr.xMax) || pr.x > R.X_FUERA) {
      if (pr.xMax !== undefined && pr.x <= R.X_FUERA) this.emitir({ t: 'disipa', proyectil: pr.id, fila: pr.fila, x: pr.x });
      pr.dano = 0;
    }
  }

  private pasoLanzado(pr: Proyectil, dt: number): void {
    pr.tVuelo = (pr.tVuelo ?? 0) + dt;
    const vuelo = pr.vuelo ?? 1;
    const k = Math.min(1, pr.tVuelo / vuelo);
    const blanco = this.zombis.find((z) => z.id === pr.blanco && z.vida > 0);
    if (blanco) pr.x1 = blanco.x;
    const x0 = pr.x0 ?? pr.x;
    const x1 = pr.x1 ?? pr.x;
    pr.x = x0 + (x1 - x0) * k;
    pr.h = (pr.cima ?? 120) * 4 * k * (1 - k) + 40 * (1 - k);
    if (k < 1) return;
    let z = blanco && blanco.fila === pr.fila && blanco.altura !== 'bajo tierra' && blanco.altura !== 'bajo agua' ? blanco : undefined;
    if (!z) {
      for (const o of this.zombis) {
        if (o.vida <= 0 || o.fila !== pr.fila || o.hipnotizado || !this.alcanzableRecto(o)) continue;
        if (Math.abs(o.x - pr.x) <= R.MEDIO_ZOMBI) { z = o; break; }
      }
    }
    if (z) this.impactar(pr, z, 'lanzado');
    else this.emitir({ t: 'disipa', proyectil: pr.id, fila: pr.fila, x: pr.x });
    pr.dano = 0;
  }

  /** Nueces de la bolera: ruedan, rebotan en diagonal al golpear y en los bordes del jardín. */
  private pasoRodante(pr: Proyectil, dt: number): void {
    const min = this.filasActivas[0];
    const max = this.filasActivas[this.filasActivas.length - 1];
    pr.x += pr.vx * dt;
    let fy = pr.fy ?? pr.fila;
    const dirY = pr.dirY ?? 0;
    fy += (dirY * R.VEL_BOLOS_DIAGONAL * dt) / this.altoFila;
    if (fy <= min) {
      fy = min;
      if (dirY < 0) pr.dirY = 1;
    } else if (fy >= max) {
      fy = max;
      if (dirY > 0) pr.dirY = -1;
    }
    pr.fy = fy;
    pr.fila = Math.round(fy);
    pr.y = fy * this.altoFila + this.altoFila / 2;
    if (pr.x > R.X_FUERA) {
      pr.dano = 0;
      return;
    }
    let blanco: Zombi | undefined;
    for (const z of this.zombis) {
      if (z.vida <= 0 || z.fila !== pr.fila || z.hipnotizado || z.id === pr.ultimo || z.altura !== 'suelo' || z.estado === 'salta') continue;
      if (Math.abs(z.x - pr.x) > R.MEDIO_ZOMBI + R.MEDIO_PLANTA) continue;
      if (!blanco || z.x < blanco.x) blanco = z;
    }
    if (!blanco) return;
    if (pr.tipo === 'nuezexplosiva') {
      this.explotar(pr.fila, this.colDeX(pr.x), 1, pr.dano, 'nuezexplosiva', pr.x);
      pr.dano = 0;
      return;
    }
    // De frente el escudo para el golpe; rebotada (en diagonal) le da por el lado.
    this.impactar(pr, blanco, (pr.dirY ?? 0) === 0 ? 'recto' : 'lanzado');
    pr.golpes = (pr.golpes ?? 0) + 1;
    pr.ultimo = blanco.id;
    if (pr.tipo === 'nuezgigante') return;
    if (dirY === 0) pr.dirY = pr.fila <= min ? 1 : pr.fila >= max ? -1 : this.azar.siguiente() < 0.5 ? -1 : 1;
    else pr.dirY = pr.fila <= min ? 1 : pr.fila >= max ? -1 : -dirY;
    this.emitir({ t: 'rebote', proyectil: pr.id, fila: pr.fila, x: pr.x, golpes: pr.golpes });
    if (this.monedasActivas && pr.golpes >= 2) this.monedasPorRebote(pr.golpes, pr.x, pr.y);
  }

  /** Bolera: 2.º golpe 1 de plata, 3.º 2, 4.º 3, 5.º 1 de oro, 6.º 2 de oro, desde el 7.º un diamante. */
  private monedasPorRebote(golpes: number, x: number, y: number): void {
    const lista: Moneda['tipo'][] =
      golpes === 2 ? ['plata'] : golpes === 3 ? ['plata', 'plata'] : golpes === 4 ? ['plata', 'plata', 'plata']
        : golpes === 5 ? ['oro'] : golpes === 6 ? ['oro', 'oro'] : ['diamante'];
    for (const tipo of lista) this.crearMoneda(tipo, x, y);
  }

  private impactar(pr: Proyectil, z: Zombi, tipo: TipoDano): void {
    const g = this.danarZombi(z, pr.dano, tipo, { efecto: pr.efecto, efectoT: pr.efectoT });
    this.emitir({ t: 'impacto', proyectil: pr.id, tipo: pr.tipo, zombi: z.id, fila: z.fila, x: pr.x, dano: g.dano, metal: g.metal, escudo: g.capa === 'escudo' });
  }

  private pasoCortacespedes(dt: number): void {
    for (const cm of this.cortacespedes) {
      if (cm.estado !== 'corre') continue;
      cm.x += R.VEL_CORTACESPED * dt;
      for (const z of this.zombis) {
        if (z.vida <= 0 || z.fila !== cm.fila || z.altura === 'aire' || z.altura === 'bajo tierra') continue;
        if (z.x - R.MEDIO_ZOMBI <= cm.x + 30 && z.x + R.MEDIO_ZOMBI >= cm.x - 30) this.matarZombi(z, 'cortacesped');
      }
      if (cm.x > R.X_FUERA) cm.estado = 'usado';
    }
  }

  private pasoRecogibles(dt: number): void {
    for (const s of this.soles) {
      if (s.estado === 'cae') {
        s.y += R.VEL_SOL_CIELO * dt;
        if (s.y >= s.yFinal) {
          s.y = s.yFinal;
          s.estado = 'quieto';
        }
      } else if (s.estado === 'salta') {
        s.y = Math.min(s.yFinal, s.y + 120 * dt);
        if (s.y >= s.yFinal) s.estado = 'quieto';
      } else s.vida -= dt;
    }
    if (this.soles.length) this.soles = this.soles.filter((s) => s.vida > 0);
    for (const c of this.monedas) c.vida -= dt;
    if (this.monedas.length) this.monedas = this.monedas.filter((c) => c.vida > 0);
    for (const a of this.abonosSueltos) a.vida -= dt;
    if (this.abonosSueltos.length) this.abonosSueltos = this.abonosSueltos.filter((a) => a.vida > 0);
  }

  private pasoCaidos(dt: number): void {
    if (!this.caidos.length) return;
    for (const c of this.caidos) c.tCaida += dt;
    this.caidos = this.caidos.filter((c) => c.tCaida < c.duracion);
  }

  private compactar(): void {
    if (this.plantas.some((p) => p.vida <= 0)) this.plantas = this.plantas.filter((p) => p.vida > 0);
    if (this.zombis.some((z) => z.vida <= 0)) this.zombis = this.zombis.filter((z) => z.vida > 0);
  }

  private actualizarTarjetas(): void {
    for (const tj of this.mazo) {
      tj.lista = tj.restante <= 0;
      tj.disponible = tj.lista && this.sol >= tj.sol;
    }
  }

  private comprobarVictoria(): void {
    if (this.sinOleadas || this.director.siguiente < this.oleadasTotal || this.director.aviso > 0) return;
    if (this.zombis.some((z) => z.vida > 0 && !z.hipnotizado)) return;
    this.estado = 'gano';
    const u = this.ultimaMuerte ?? { x: 400, fila: this.filasActivas[Math.floor(this.filasActivas.length / 2)] ?? 0 };
    const pos = { x: Math.min(700, Math.max(40, u.x)), y: this.yFila(u.fila), fila: u.fila };
    const pr = this.nivel.premio;
    if (pr?.nota) this.premio = { tipo: 'nota', ...pos };
    else if (this.repeticion || !pr) {
      this.premio = { tipo: 'bolsa', valor: R.VALOR_MONEDA.bolsa, ...pos };
      this.dinero += R.VALOR_MONEDA.bolsa;
    } else if (pr.planta) this.premio = { tipo: 'planta', id: pr.planta, ...pos };
    else this.premio = { tipo: 'objeto', id: pr.objeto, ...pos };
    if (this.monedasActivas) this.dinero += R.PREMIO_CORTACESPED * this.cortacespedes.filter((c) => c.estado === 'listo').length;
    this.emitir({ t: 'premio', premio: this.premio });
    this.emitir({ t: 'fin', gano: true });
  }

  private perder(fila: number): void {
    if (this.estado !== 'jugando') return;
    this.estado = 'perdio';
    this.emitir({ t: 'fin', gano: false, fila });
  }

  // ------------------------------------------------------------------------------------------------------------
  // Herramientas para comportamientos, director y cinta

  nuevoId(): number {
    return ++this.ultimoId;
  }

  emitir(e: Evento): void {
    (this.enPaso ? this.eventos : this.pendientes).push(e);
  }

  ponerEstado(e: Planta | Zombi, estado: string): void {
    if (e.estado !== estado) {
      e.estado = estado;
      e.tEstado = 0;
    }
  }

  dentro(fila: number, col: number): boolean {
    return Number.isInteger(fila) && Number.isInteger(col) && fila >= 0 && fila < this.filas && col >= 0 && col < R.COLUMNAS;
  }

  /** Reglas de casilla: terreno, capas, lápidas, cráteres y línea roja. */
  validarCasilla(d: DefPlanta, fila: number, col: number): Resultado {
    if (!this.dentro(fila, col)) return no('casilla');
    if (this.nivel.lineaRoja !== undefined && col >= this.nivel.lineaRoja) return no('linea');
    const ter = this.terreno[fila][col];
    if (d.datos?.rodante) return ter === 'cesped' ? ok : no('terreno');
    if (this.lapidas.some((l) => l.fila === fila && l.col === col)) return no('lapida');
    if (this.crateres.some((c) => c.fila === fila && c.col === col)) return no('crater');
    if (ter === 'tierra') return no('terreno');
    const capa = d.capa ?? 'principal';
    const base = this.plantaEn(fila, col, 'base');
    const principal = this.plantaEn(fila, col, 'principal');
    switch (capa) {
      case 'base':
        if (base) return no('ocupada');
        if (ter === 'agua' ? !d.agua : d.agua === 'solo') return no('terreno');
        if (principal) return no('ocupada');
        return ok;
      case 'principal':
        if (d.mejoraDe) return principal?.tipo === d.mejoraDe ? ok : no('mejora');
        if (principal) return no('ocupada');
        break;
      case 'cubierta':
        if (this.plantaEn(fila, col, 'cubierta')) return no('ocupada');
        break;
      case 'temporal':
        if (!principal?.dormida || this.plantaEn(fila, col, 'temporal')) return no('sinPlanta');
        return ok;
    }
    if (ter === 'agua') return d.agua || base ? (d.agua === 'solo' && base ? no('ocupada') : ok) : no('terreno');
    if (ter === 'tejado') return base ? ok : no('base');
    return d.agua === 'solo' ? no('terreno') : ok;
  }

  /** Crea una planta sin cobrar (siembra validada, cinta, copias del abono, plantas iniciales). */
  crearPlanta(tipo: IdPlanta, fila: number, col: number, op: { silencio?: boolean } = {}): Planta {
    const d = PLANTAS[tipo];
    const capa = d.capa ?? 'principal';
    if (d.mejoraDe) {
      const vieja = this.plantaEn(fila, col, 'principal');
      if (vieja) vieja.vida = 0;
    }
    const dormida = !!d.nocturna && this.dia;
    const p: Planta = {
      id: this.nuevoId(), tipo, fila, col, capa, x: this.xCol(col), y: this.yFila(fila),
      vida: d.vida, vidaMax: d.vida, coraza: 0, estado: dormida ? 'dormida' : 'quieto', tEstado: 0, dormida,
      abono: 0, reloj: 0, nacio: this.t, golpe: 0, datos: {},
    };
    this.plantas.push(p);
    COMPORTAMIENTO_PLANTAS[tipo]?.iniciar?.(this, p);
    if (!op.silencio) this.emitir({ t: 'siembra', planta: p.id, tipo, fila, col });
    return p;
  }

  /** Quita una planta: comida por un zombi, muerta, arrancada con la pala o gastada (explosivas). */
  quitarPlanta(p: Planta, motivo: 'comida' | 'muere' | 'pala' | 'gastada', zombi?: Zombi | null): void {
    if (p.datos.quitada) return;
    p.datos.quitada = 1;
    p.vida = Math.min(p.vida, 0);
    if (motivo === 'pala') this.emitir({ t: 'pala', planta: p.id, tipo: p.tipo, fila: p.fila, col: p.col });
    else if (motivo === 'comida' && zombi) this.emitir({ t: 'plantaComida', planta: p.id, tipo: p.tipo, fila: p.fila, col: p.col, zombi: zombi.id });
    else if (motivo !== 'gastada') this.emitir({ t: 'plantaMuere', planta: p.id, tipo: p.tipo, fila: p.fila, col: p.col });
    if (motivo === 'comida' || motivo === 'muere') COMPORTAMIENTO_PLANTAS[p.tipo]?.alMorir?.(this, p);
    // Si muere la base, cae lo que tenía encima (la seta sobre el nenúfar se hunde).
    if (p.capa === 'base' && motivo !== 'pala') {
      for (const q of this.plantas) if (q.vida > 0 && q.fila === p.fila && q.col === p.col && q !== p) this.quitarPlanta(q, 'muere');
    }
  }

  /** Daño a una planta (los zombis muerden con esto). El abono la hace invulnerable mientras brilla. */
  danarPlanta(p: Planta, cantidad: number, origen: Zombi | null): number {
    if (p.vida <= 0 || p.abono > 0 || cantidad <= 0) return 0;
    let resto = cantidad;
    if (p.coraza > 0) {
      const c = Math.min(p.coraza, resto);
      p.coraza -= c;
      resto -= c;
    }
    p.vida -= resto;
    p.golpe = 0.12;
    COMPORTAMIENTO_PLANTAS[p.tipo]?.alDanar?.(this, p, cantidad, origen);
    if (p.vida <= 0) this.quitarPlanta(p, origen ? 'comida' : 'muere', origen);
    return cantidad;
  }

  /** Aparece un zombi en una fila (oleadas, minijuegos, pruebas). */
  aparecerZombi(tipo: IdZombi, fila: number, x?: number, op: { oleada?: number; brillante?: boolean } = {}): Zombi {
    const d = defZombi(tipo);
    if (!d) throw new Error(`Zombi desconocido: ${tipo}`);
    const variacion = 1 + this.azar.rango(-R.VARIACION_VELOCIDAD, R.VARIACION_VELOCIDAD);
    const altura: Altura = d.altura ?? (this.terreno[fila]?.[R.COLUMNAS - 1] === 'agua' ? 'agua' : 'suelo');
    const z: Zombi = {
      id: this.nuevoId(), tipo, fila, x: x ?? R.X_APARICION + this.azar.rango(0, R.AZAR_APARICION), altura,
      vida: d.vida, vidaMax: d.vida,
      casco: d.casco ? { nombre: d.casco.nombre, vida: d.casco.vida, max: d.casco.vida, metal: !!d.casco.metal } : null,
      escudo: d.escudo ? { nombre: d.escudo.nombre, vida: d.escudo.vida, max: d.escudo.vida, metal: !!d.escudo.metal } : null,
      vel: d.velocidad * variacion, estado: 'camina', tEstado: 0, dir: -1, lento: 0, congelado: 0, mantequilla: 0,
      hipnotizado: false, brillante: !!op.brillante, sinBrazo: false, sinCabeza: false, golpe: 0, mordiendo: 0,
      oleada: op.oleada ?? 0, edad: 0, datos: {},
    };
    this.zombis.push(z);
    COMPORTAMIENTO_ZOMBIS[tipo]?.iniciar?.(this, z);
    return z;
  }

  /**
   * Daño a un zombi con las reglas de PvZ: el escudo solo para el daño 'recto' de frente (sin pasar el sobrante);
   * el casco se gasta antes que el cuerpo (el sobrante pasa); perforante, explosión, fuego, hielo y aplastar dañan
   * el escudo y además todo lo demás. El brazo cae al bajar de 2/3 y la cabeza al bajar de 1/3.
   */
  danarZombi(
    z: Zombi, cantidad: number, tipo: TipoDano,
    op: { efecto?: 'lento' | 'mantequilla'; efectoT?: number; deFrente?: boolean; sinDestello?: boolean } = {},
  ): Golpe {
    if (z.vida <= 0 || cantidad <= 0) return NINGUNO;
    let resto = cantidad;
    let capa: Golpe['capa'] = null;
    let metal = false;
    const deFrente = op.deFrente ?? z.dir === -1;
    if (z.escudo && tipo !== 'lanzado' && tipo !== 'mordida') {
      if (tipo === 'recto') {
        if (deFrente) {
          z.escudo.vida -= resto;
          capa = 'escudo';
          metal = z.escudo.metal;
          resto = 0;
        }
      } else {
        z.escudo.vida -= resto;
        metal = z.escudo.metal;
      }
      if (z.escudo.vida <= 0) this.perderArmadura(z, 'escudo');
    }
    if (resto > 0 && z.casco) {
      const c = Math.min(z.casco.vida, resto);
      z.casco.vida -= c;
      resto -= c;
      capa = 'casco';
      metal = z.casco.metal;
      if (z.casco.vida <= 0) this.perderArmadura(z, 'casco');
    }
    if (resto > 0) {
      if (!capa) capa = 'cuerpo';
      this.danoDirecto(z, resto, tipo === 'explosion' ? 'ceniza' : tipo === 'aplastar' ? 'aplastado' : 'normal');
    }
    if (!op.sinDestello) z.golpe = 0.12;
    if (z.vida > 0) {
      if (op.efecto === 'lento' && capa !== 'escudo') z.lento = Math.max(z.lento, op.efectoT ?? 10);
      if (op.efecto === 'mantequilla' && capa !== 'escudo') z.mantequilla = Math.max(z.mantequilla, op.efectoT ?? 4);
      if (tipo === 'fuego') {
        z.lento = 0;
        z.congelado = 0;
      }
      COMPORTAMIENTO_ZOMBIS[z.tipo]?.alDanar?.(this, z, cantidad, tipo);
    }
    return { dano: cantidad, capa, metal, murio: z.vida <= 0 };
  }

  private perderArmadura(z: Zombi, cual: 'casco' | 'escudo'): void {
    const a = z[cual];
    if (!a) return;
    z[cual] = null;
    this.emitir({ t: 'pierdeArmadura', zombi: z.id, cual, nombre: a.nombre, fila: z.fila, x: z.x });
  }

  /** Daño al cuerpo (sin armaduras): umbrales de brazo y cabeza y muerte. */
  danoDirecto(z: Zombi, cantidad: number, causa: CausaMuerte = 'normal'): void {
    if (z.vida <= 0) return;
    z.vida -= cantidad;
    if (!z.sinBrazo && z.vida < (z.vidaMax * 2) / 3) {
      z.sinBrazo = true;
      this.emitir({ t: 'pierdeBrazo', zombi: z.id, fila: z.fila, x: z.x });
    }
    if (!z.sinCabeza && z.vida < z.vidaMax / 3) {
      z.sinCabeza = true;
      z.mordiendo = 0;
      this.emitir({ t: 'pierdeCabeza', zombi: z.id, fila: z.fila, x: z.x });
      if (z.vida > 0 && z.estado !== 'salta' && z.estado !== 'corre') this.ponerEstado(z, 'sincabeza');
    }
    if (z.vida <= 0) this.matarZombi(z, causa);
  }

  /** Muerte de un zombi: pasa a `caidos` para su animación y suelta abono o monedas. */
  matarZombi(z: Zombi, causa: CausaMuerte): void {
    if (z.datos.muerto) return;
    z.datos.muerto = 1;
    z.vida = Math.min(z.vida, 0);
    z.mordiendo = 0;
    const duracion = R.DURACION_MUERTE[causa];
    if (duracion > 0) {
      this.caidos.push({
        ...z, casco: z.casco && { ...z.casco }, escudo: z.escudo && { ...z.escudo }, datos: { ...z.datos },
        causa, tCaida: 0, duracion,
      });
    }
    this.emitir({ t: 'muere', zombi: z.id, tipo: z.tipo, causa, fila: z.fila, x: z.x });
    if (causa === 'ceniza') this.emitir({ t: 'ceniza', zombi: z.id, fila: z.fila, x: z.x });
    if (causa !== 'fuera') {
      this.zombisMuertos++;
      if (!z.hipnotizado) this.ultimaMuerte = { x: z.x, fila: z.fila };
      const y = this.yFila(z.fila);
      if (z.brillante) {
        const a: AbonoSuelto = { id: this.nuevoId(), x: z.x, y, vida: R.VIDA_ABONO_SUELTO };
        this.abonosSueltos.push(a);
        this.emitir({ t: 'abonoSuelto', abono: a.id, x: a.x, y: a.y });
      }
      if (this.monedasActivas) {
        const r = this.azar.siguiente();
        if (r < R.PROB_DIAMANTE) this.crearMoneda('diamante', z.x, y);
        else if (r < R.PROB_DIAMANTE + R.PROB_ORO) this.crearMoneda('oro', z.x, y);
        else if (r < R.PROB_DIAMANTE + R.PROB_ORO + R.PROB_PLATA) this.crearMoneda('plata', z.x, y);
      }
    }
    COMPORTAMIENTO_ZOMBIS[z.tipo]?.alMorir?.(this, z, causa);
  }

  crearMoneda(tipo: Moneda['tipo'], x: number, y: number): Moneda {
    const c: Moneda = { id: this.nuevoId(), tipo, valor: R.VALOR_MONEDA[tipo], x: x + this.azar.rango(-15, 15), y, vida: R.VIDA_MONEDA };
    this.monedas.push(c);
    this.emitir({ t: 'moneda', moneda: c.id, tipo, x: c.x, y: c.y });
    return c;
  }

  /** Sol nuevo. Del cielo cae desde `y` hasta `yFinal`; el de una planta salta y se posa en `yFinal`. */
  crearSol(x: number, y: number, yFinal: number, valor: number, origen: Sol['origen']): Sol {
    const s: Sol = { id: this.nuevoId(), x, y, yFinal, valor, origen, estado: origen === 'cielo' ? 'cae' : 'salta', vida: R.VIDA_SOL };
    this.soles.push(s);
    this.emitir({ t: 'sol', sol: s.id, x, y, valor, origen });
    return s;
  }

  /** Sol que produce una planta: sale de ella y cae a su lado. */
  solDePlanta(p: Planta, valor: number, origen: Sol['origen'] = 'planta'): Sol {
    return this.crearSol(p.x + this.azar.rango(-25, 25), p.y - 40, p.y + this.azar.rango(0, 25), valor, origen);
  }

  /** Lanza un proyectil recto desde la boca de una planta. */
  disparar(
    p: Planta,
    op: { tipo: string; dano: number; tipoDano?: TipoDano; efecto?: 'lento' | 'mantequilla'; efectoT?: number; xMax?: number; vx?: number; dy?: number },
  ): Proyectil {
    const pr: Proyectil = {
      id: this.nuevoId(), tipo: op.tipo, forma: 'recto', fila: p.fila, x: p.x + 25, y: p.y + (op.dy ?? 0), h: R.ALTURA_GUISANTE,
      vx: op.vx ?? R.VEL_GUISANTE, dano: op.dano, tipoDano: op.tipoDano ?? 'recto', efecto: op.efecto, efectoT: op.efectoT,
      origen: p.id, xMax: op.xMax,
    };
    this.proyectiles.push(pr);
    this.emitir({ t: 'disparo', planta: p.id, tipo: p.tipo, proyectil: pr.id, fila: p.fila, x: pr.x });
    return pr;
  }

  /** Lanza un proyectil en parábola hacia un zombi (coltapulta, lanzamaíz, melonpulta). */
  lanzar(p: Planta, blanco: Zombi, op: { tipo: string; dano: number; efecto?: 'lento' | 'mantequilla'; efectoT?: number; vuelo?: number; cima?: number }): Proyectil {
    const pr: Proyectil = {
      id: this.nuevoId(), tipo: op.tipo, forma: 'lanzado', fila: p.fila, x: p.x, y: p.y, h: 40, vx: 0, dano: op.dano,
      tipoDano: 'lanzado', efecto: op.efecto, efectoT: op.efectoT, origen: p.id, blanco: blanco.id, x0: p.x, x1: blanco.x,
      vuelo: op.vuelo ?? 1, tVuelo: 0, cima: op.cima ?? 120,
    };
    this.proyectiles.push(pr);
    this.emitir({ t: 'disparo', planta: p.id, tipo: p.tipo, proyectil: pr.id, fila: p.fila, x: pr.x });
    return pr;
  }

  private soltarRodante(d: DefPlanta, fila: number, col: number): void {
    const pr: Proyectil = {
      id: this.nuevoId(), tipo: d.id, forma: 'rodante', fila, x: this.xCol(col), y: this.yFila(fila), h: 0,
      vx: R.VEL_BOLOS, dano: d.datos?.dano ?? R.DANO_BOLOS, tipoDano: 'recto', origen: 0, fy: fila, dirY: 0, golpes: 0, ultimo: 0,
    };
    this.proyectiles.push(pr);
    this.emitir({ t: 'siembra', planta: pr.id, tipo: d.id, fila, col });
  }

  /**
   * Explosión centrada en una casilla: `radio` 1 = 3×3, 2 = 5×5, 0 = solo su fila (Patatapum usa su propio
   * alcance). Daña a todos los zombis enemigos (en el aire y bajo tierra también) y los que mueren quedan en ceniza.
   */
  explotar(fila: number, col: number, radio: number, dano: number, tipo: IdPlanta, x = this.xCol(col)): void {
    const ancho = radio * R.ANCHO_COL + R.ANCHO_COL / 2;
    for (const z of this.zombis) {
      if (z.vida <= 0 || z.hipnotizado || Math.abs(z.fila - fila) > radio) continue;
      if (z.x + R.MEDIO_ZOMBI < x - ancho || z.x - R.MEDIO_ZOMBI > x + ancho) continue;
      this.danarZombi(z, dano, 'explosion');
    }
    this.emitir({ t: 'explosion', tipo, fila, col, x, radio });
  }

  private ponerLapidaAlAzar(): void {
    for (let intento = 0; intento < 50; intento++) {
      const fila = this.azar.elegir(this.filasActivas);
      const col = 4 + this.azar.entero(5);
      if (fila === undefined) return;
      if (this.terreno[fila][col] !== 'cesped' || this.lapidas.some((l) => l.fila === fila && l.col === col)) continue;
      this.lapidas.push({ id: this.nuevoId(), fila, col, vida: 1 });
      return;
    }
  }
}
