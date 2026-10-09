// Una expedición: cinco etapas en el mismo bioma (la última con los sepulcros y el jefe) y la Forja entre etapas. No dibuja nada:
// la usan la pantalla de juego, el anfitrión de una partida en grupo y las pruebas del bot en Node.
import { Azar } from '../casa/lavado/azar';
import { ARMAS, MAX_ARMAS, MAX_SOBRECARGAS, NIVEL_EVOLUCION, NIVEL_MAX_ARMA } from './datos/armas';
import { EQUIPOS, MEJORAS, OBJETO, OBJETOS, PAREJA_EVOLUCION, descPieza, nombrePieza, pieza, piezaNueva } from './datos/botin';
import { ETAPAS, MUTADORES, PELIGROS } from './datos/mundo';
import { Sim, type FinEtapa } from './sim/sim';
import { ArmaJ, Jugador } from './sim/jugador';
import { BIT_ETQ } from './sim/jugador';
import { NIVELES_ENTRENAR, aplicar, armasPorEtiqueta, descObjeto, describir, eleccionSobrecarga, encolarSobrecarga, encontrables, tirarRareza } from './sim/opciones';
import type { ConfigExpedicion, IdBioma, IdObjetivo, IdSecundario, Opcion, PerfilJugador, Rareza } from './tipos';

export interface ResultadoEtapa {
  etapa: number;
  fin: FinEtapa;
  objetivo: IdObjetivo;
  segundos: number;
}

/** Los tres mostradores de la Forja. */
export type Mostrador = 'armero' | 'etiquetas' | 'personaje';
/** Lo que se paga de más (o de menos) por rareza: las mejoras con oro y el entrenamiento con hierro (que rinde más). */
const PRECIO_RAREZA = [1, 1.6, 2.4, 3.4, 4.8];
const DESCUENTO_RAREZA = [1, 0.9, 0.85, 0.8, 0.75];

export interface OfertaForja {
  id: string;
  tipo: 'arma' | 'objeto' | 'equipo' | 'curar' | 'mejora';
  mostrador?: Mostrador;
  /** Con qué se paga (oro si no dice). */
  pago?: 'oro' | 'hierro';
  /** La mejora que se compra (entrenar un arma, una estadística o una etiqueta). */
  op?: Opcion;
  ref: string;
  nombre: string;
  desc: string;
  precio: number;
  rareza: Rareza;
  glifo: string;
  vendida?: boolean;
  /** Guardada para la próxima visita (no se renueva). */
  guardada?: boolean;
}

export interface EstadoForja {
  ofertas: OfertaForja[];
  renovaciones: number;
  sangreUsada: Record<number, boolean>;
  listo: boolean;
}

const PRECIOS_RENOVAR = [5, 7, 10, 14, 20, 28, 39, 55, 77, 108, 151, 211];
const OBJETIVOS_LISTA: IdObjetivo[] = ['hierro', 'altares', 'prisioneros', 'carreta', 'campana', 'elite', 'exorcismo', 'cosecha'];
const SECUNDARIOS_LISTA: IdSecundario[] = ['huevos', 'frascos', 'cofres', 'rosas', 'plumas', 'hongos', 'mercurio', 'campanitas'];

export class Expedicion {
  cfg: ConfigExpedicion;
  J: Jugador[];
  etapa = 0;
  sim: Sim | null = null;
  fase: 'etapa' | 'forja' | 'fin' = 'etapa';
  resultados: ResultadoEtapa[] = [];
  plan: { objetivo: IdObjetivo; secundario: IdSecundario }[] = [];
  forja = new Map<number, EstadoForja>();
  /** Cuántas veces renovó la Forja cada jugador en la expedición (el precio sube). */
  renovadas = new Map<number, number>();
  /** Cuántas veces se curó cada jugador en la Forja (el precio sube). */
  curadas = new Map<number, number>();
  exito = false;
  az: Azar;
  /** Segundos totales jugados. */
  tiempo = 0;

  constructor(cfg: ConfigExpedicion, perfiles: PerfilJugador[]) {
    this.cfg = cfg;
    this.az = new Azar(cfg.semilla);
    this.J = perfiles.map((p, i) => new Jugador(i, p));
    // Prueba del arma: se baja solo con ella
    if (cfg.armaUnica && ARMAS[cfg.armaUnica])
      for (const j of this.J) {
        // (sola contra la Noche: arranca en el nivel 4 y pega 60 % más, ver multOtras)
        const a = new ArmaJ(cfg.armaUnica);
        a.nivel = 4;
        j.armas = [a];
        j.armaUnica = cfg.armaUnica;
      }
    // Plan de objetivos: sin repetir el principal seguido
    const obj = [...OBJETIVOS_LISTA];
    for (let k = 0; k < this.total; k++) {
      const disponibles = obj.filter((o) => !this.plan.some((p) => p.objetivo === o));
      const o = this.az.uno(disponibles.length ? disponibles : obj);
      this.plan.push({ objetivo: o, secundario: this.az.uno(SECUNDARIOS_LISTA) });
    }
    if (cfg.tutorial) this.plan = [{ objetivo: 'hierro', secundario: 'huevos' }];
    // Las misiones: el mismo objetivo en sus tres etapas
    if (cfg.mision) for (const p of this.plan) p.objetivo = cfg.mision === 'procesion' ? 'carreta' : 'cria';
  }

  /** Cuántas etapas tiene (cinco; las pruebas de maestría, 3, 5 o 10). */
  get total() {
    return this.cfg.tutorial ? 1 : Math.max(1, this.cfg.etapas ?? (this.cfg.mision ? 3 : ETAPAS));
  }

  get ultima() {
    // (el modo infinito no tiene última: se acaba al caer)
    if (this.cfg.infinito && !this.cfg.tutorial) return false;
    return this.etapa >= this.total;
  }

  /** ¿Esta etapa termina con jefe? (la última, con los sepulcros; en el modo infinito, cada cinco; en la prueba del
   *  bioma, la 5 y la 10) */
  esFinal(etapa = this.etapa) {
    if (this.cfg.infinito) return etapa % ETAPAS === 0;
    return this.cfg.jefesEn ? this.cfg.jefesEn.includes(etapa) : etapa >= this.total;
  }

  /** El bioma de la etapa (en el modo infinito cambia cada cinco, por los biomas que trae la rotación). */
  biomaDe(etapa = this.etapa): IdBioma {
    const r = this.cfg.infinito && this.cfg.rotacion?.length ? this.cfg.rotacion : null;
    return r ? r[Math.floor((etapa - 1) / ETAPAS) % r.length] : this.cfg.bioma;
  }

  /** La capa de abajo en el modo infinito: desde la sexta etapa, los enemigos del bioma anterior se mezclan con los
   *  del nuevo (las catacumbas debajo del cementerio, las minas debajo de las catacumbas…). */
  capaDe(etapa = this.etapa): IdBioma | undefined {
    if (!this.cfg.infinito || etapa <= ETAPAS) return undefined;
    const antes = this.biomaDe(etapa - ETAPAS);
    return antes !== this.biomaDe(etapa) ? antes : undefined;
  }

  /** Arranca la etapa siguiente. */
  iniciarEtapa(): Sim {
    this.etapa++;
    // Modo infinito: el plan se alarga solo (sin repetir el objetivo de la etapa anterior)
    while (this.cfg.infinito && this.plan.length < this.etapa) {
      const antes = this.plan[this.plan.length - 1]?.objetivo;
      this.plan.push({ objetivo: this.az.uno(OBJETIVOS_LISTA.filter((o) => o !== antes)), secundario: this.az.uno(SECUNDARIOS_LISTA) });
    }
    const p = this.plan[this.etapa - 1] ?? this.plan[this.plan.length - 1];
    this.sim = new Sim({ exp: this.cfg, etapa: this.etapa, objetivo: p.objetivo, secundario: p.secundario, final: this.esFinal(), bioma: this.biomaDe(), capa: this.capaDe() }, this.J);
    if (this.cfg.tutorial) {
      this.sim.sinHorda = true;
      this.sim.sinReloj = true;
    }
    this.fase = 'etapa';
    return this.sim;
  }

  /** Terminó la etapa (extracción o derrota): pasa a la Forja, al final o a la derrota. */
  terminarEtapa() {
    const s = this.sim;
    if (!s || !s.fin) return;
    this.tiempo += s.t;
    this.resultados.push({ etapa: this.etapa, fin: s.fin, objetivo: s.obj.tipo, segundos: s.t });
    // Premio del secundario y del objetivo
    if (s.fin.exito) {
      for (const j of this.J) {
        if (j.estado !== 3) continue;
        if (s.fin.objetivo) j.oroSeguro += 10 + 5 * this.etapa;
        // (el secundario paga por la parte hecha, sea de 2 cofres o de 12 hongos)
        const sec = s.sec.meta > 0 ? Math.min(1, s.fin.secundario / s.sec.meta) : 0;
        j.oroSeguro += Math.round(sec * 40 * (1 + 0.2 * (this.etapa - 1)));
        j.sangreSeguro += Math.round(sec * 10);
        j.oroSeguro += s.fin.prisioneros * 12;
      }
    }
    if (!s.fin.exito) {
      this.fase = 'fin';
      this.exito = false;
    } else if (this.ultima) {
      this.fase = 'fin';
      this.exito = true;
    } else {
      this.fase = 'forja';
      this.forja.clear();
      for (const j of this.J) this.forja.set(j.i, { ofertas: this.ofertasNuevas(j), renovaciones: 0, sangreUsada: {}, listo: false });
    }
    // Lo pendiente de escoger no pasa a la Forja (se aplica lo primero de cada cosa)
    for (const j of this.J) j.cola = j.cola.filter((e) => e.motivo === 'sobrecarga');
  }

  // ----------------------------------------------------------------------------------------------- Forja
  descuento(j: Jugador) {
    return (j.clase === 'monarca' && j.spec === 2 ? 0.8 : 1) * (j.tiene('bula_obispo') ? 0.8 : 1) * (this.cfg.mutadores.includes('mercado') ? 0.75 : 1);
  }

  /** Las ofertas de los tres mostradores de la Forja (como la tienda de Deep Rock): el armero (entrenar armas con
   *  hierro negro y armas nuevas con oro), etiquetas y objetos (mejoras de etiqueta con oro, por la regla de las dos
   *  armas, y los objetos con contrapartida) y el personaje (mejoras de estadística y equipo con oro). Las mejoras
   *  salen con rareza y cuestan según ella. Las guardadas con el candado se quedan. */
  ofertasNuevas(j: Jugador, guardadas: OfertaForja[] = []): OfertaForja[] {
    const r: OfertaForja[] = [...guardadas];
    const e = this.etapa;
    const d = this.descuento(j);
    const usados = new Set(r.map((o) => o.ref));
    const cuantas = (m: Mostrador) => r.filter((o) => o.mostrador === m).length;
    const sube = 1 + 0.12 * (e - 1);
    // --- El armero: entrenar dos armas (hierro negro; las raras rinden más por cada hierro) y un arma nueva (oro)
    const entrenables = j.armas.map((a, k) => ({ a, k })).filter(({ a }) => a.nivel < NIVEL_MAX_ARMA && !usados.has(`entrenar:${a.id}`));
    while (cuantas('armero') < 2 && entrenables.length) {
      const { a, k } = entrenables.splice(Math.floor(this.az.n() * entrenables.length), 1)[0];
      const rz = tirarRareza(this.az, j.st.suerte);
      const op = describir(j, 'arma', a.id, rz, k);
      if (!op) continue;
      const niveles = Math.min(NIVELES_ENTRENAR[rz], NIVEL_MAX_ARMA - a.nivel);
      usados.add(`entrenar:${a.id}`);
      r.push({
        id: `t${r.length}${a.id}`, tipo: 'mejora', mostrador: 'armero', pago: 'hierro', ref: `entrenar:${a.id}`, nombre: op.nombre, desc: op.desc, op,
        precio: Math.max(1, Math.round((5 + 3 * a.nivel) * niveles * DESCUENTO_RAREZA[rz] * sube)), rareza: rz, glifo: op.glifo,
      });
    }
    if (j.armas.length < MAX_ARMAS && cuantas('armero') < 3) {
      const libres = encontrables(j).filter((id) => !j.tieneArma(id) && !ARMAS[id]?.evolucion && !usados.has(id));
      if (libres.length) {
        const id = this.az.uno(libres);
        const a = ARMAS[id];
        usados.add(id);
        r.push({ id: `a${r.length}${id}`, tipo: 'arma', mostrador: 'armero', ref: id, nombre: a.nombre, desc: a.desc, precio: Math.round((26 + 12 * e) * d), rareza: 1, glifo: a.glifo });
      }
    }
    // --- Etiquetas y objetos: hasta tres mejoras de etiqueta (solo de las que llevan dos armas) y objetos hasta cuatro
    const porEtq = armasPorEtiqueta(j);
    const etqs = MEJORAS.filter((m) => m.etiqueta && (porEtq.get(BIT_ETQ[m.etiqueta]) ?? 0) >= 2 && !usados.has(`mejora:${m.id}`));
    while (cuantas('etiquetas') < 3 && etqs.length) {
      const m = etqs.splice(Math.floor(this.az.n() * etqs.length), 1)[0];
      const rz = tirarRareza(this.az, j.st.suerte);
      const op = describir(j, 'stat', m.id, rz);
      if (!op) continue;
      usados.add(`mejora:${m.id}`);
      r.push({ id: `g${r.length}${m.id}`, tipo: 'mejora', mostrador: 'etiquetas', ref: `mejora:${m.id}`, nombre: op.nombre, desc: op.desc, op, precio: this.precioMejora(rz, d), rareza: rz, glifo: op.glifo });
    }
    for (let intentos = 0; cuantas('etiquetas') < 4 && intentos < 20; intentos++) {
      // (los que evolucionan algo tuyo salen más cuando el arma ya va alta)
      const evoluciones = j.armas.filter((a) => a.def.evoluciona && a.nivel >= NIVEL_EVOLUCION - 6 && !j.objeto(a.def.evoluciona.con)).map((a) => a.def.evoluciona!.con);
      const lista = OBJETOS.filter((o) => (!o.evoluciona || evoluciones.includes(o.id)) && (o.repetible || !j.objeto(o.id)) && !usados.has(o.id));
      if (!lista.length) break;
      const o = this.az.pesado(lista, (x) => (x.evoluciona || evoluciones.includes(x.id) ? 3 : x.rareza >= 3 ? 0.4 : x.rareza === 2 ? 0.8 : 1.3))!;
      usados.add(o.id);
      r.push({ id: `o${r.length}${o.id}`, tipo: 'objeto', mostrador: 'etiquetas', ref: o.id, nombre: o.nombre, desc: descObjeto(o, j), precio: Math.round(o.precio * (1 + 0.22 * (e - 1)) * d), rareza: Math.min(4, o.rareza) as Rareza, glifo: o.glifo });
    }
    // --- El personaje: dos mejoras de estadística (con rareza) y una pieza de equipo
    const stats = MEJORAS.filter((m) => !m.etiqueta && m.id !== 'cantidad' && m.id !== 'potencia' && m.id !== 'estados' && !usados.has(`mejora:${m.id}`));
    while (cuantas('personaje') < 2 && stats.length) {
      const m = stats.splice(Math.floor(this.az.n() * stats.length), 1)[0];
      const rz = tirarRareza(this.az, j.st.suerte);
      const op = describir(j, 'stat', m.id, rz);
      if (!op) continue;
      usados.add(`mejora:${m.id}`);
      r.push({ id: `p${r.length}${m.id}`, tipo: 'mejora', mostrador: 'personaje', ref: `mejora:${m.id}`, nombre: op.nombre, desc: op.desc, op, precio: this.precioMejora(rz, d), rareza: rz, glifo: op.glifo });
    }
    if (cuantas('personaje') < 3) {
      const lista = EQUIPOS.filter((q) => q.rareza <= Math.min(3, e) && pieza(j.equipo[q.ranura])?.def.id !== q.id && !usados.has(q.id));
      if (lista.length) {
        const q = this.az.uno(lista);
        usados.add(q.id);
        // (la calidad sube un poco con las etapas; la pieza cuesta más mientras mejor sea)
        const t2 = this.az.n();
        const calidad = t2 < 0.04 + 0.02 * e ? 3 : t2 < 0.14 + 0.04 * e ? 2 : t2 < 0.42 + 0.04 * e ? 1 : 0;
        const p = pieza(piezaNueva(this.az, q.id, calidad))!;
        r.push({ id: `e${r.length}${q.id}`, tipo: 'equipo', mostrador: 'personaje', ref: p.clave, nombre: nombrePieza(p), desc: descPieza(p), precio: Math.round((18 + 14 * q.rareza) * (1 + 0.4 * calidad) * (1 + 0.15 * e) * d), rareza: calidad as Rareza, glifo: q.ranura });
      }
    }
    return r;
  }

  /** Lo que cuesta una mejora de estadística o de etiqueta (oro), según su rareza. */
  precioMejora(rz: Rareza, d: number) {
    return Math.round((12 + 5 * this.etapa) * PRECIO_RAREZA[rz] * d);
  }

  /** Curar la mitad de la vida: el precio sube cada vez que se usa en la expedición. */
  precioCurar(j: Jugador) {
    return Math.round((18 + 5 * this.etapa) * 1.5 ** (this.curadas.get(j.i) ?? 0) * this.descuento(j));
  }
  curarForja(j: Jugador): string | null {
    if (j.hp >= j.hpMax) return 'Ya tienes la vida llena.';
    const p = this.precioCurar(j);
    if (j.oroSeguro < p) return 'No alcanza el oro.';
    j.oroSeguro -= p;
    j.resumen.oroGastado = (j.resumen.oroGastado ?? 0) + p;
    j.hp = Math.min(j.hpMax, j.hp + j.hpMax * 0.5);
    this.curadas.set(j.i, (this.curadas.get(j.i) ?? 0) + 1);
    return null;
  }

  /** Oro, hierro y sangre que tiene a salvo para gastar. */
  bolsa(j: Jugador) {
    return { oro: Math.floor(j.oroSeguro), hierro: Math.floor(j.hierroSeguro), sangre: Math.floor(j.sangreSeguro) };
  }

  comprar(j: Jugador, idOferta: string): string | null {
    const f = this.forja.get(j.i);
    const o = f?.ofertas.find((x) => x.id === idOferta);
    if (!f || !o || o.vendida) return 'Ya no está.';
    const hierro = o.pago === 'hierro';
    if (hierro ? j.hierroSeguro < o.precio : j.oroSeguro < o.precio) return hierro ? 'Falta hierro negro.' : 'No alcanza el oro.';
    switch (o.tipo) {
      case 'mejora': {
        // (entrenar un arma, una estadística o una etiqueta: lo mismo que la carta de subir de nivel)
        const op = o.op;
        if (!op) return 'Ya no está.';
        if (op.tipo === 'arma' && (!j.armas[op.ranura ?? -1] || j.armas[op.ranura!].id !== op.id)) return 'Esa arma ya no está.';
        if (!this.sim) return 'Ahora no se puede.';
        aplicar(this.sim, j, op);
        break;
      }
      case 'arma':
        if (j.armas.length >= MAX_ARMAS) return 'Ya tienes cuatro armas.';
        j.armas.push(new ArmaJ(o.ref));
        break;
      case 'objeto':
        j.objetos.push(o.ref);
        j.recalcular();
        break;
      case 'equipo': {
        const p = pieza(o.ref);
        if (!p) return 'Ya no está.';
        j.equipo[p.def.ranura] = p.clave;
        j.recalcular();
        break;
      }
      case 'curar':
        j.hp = Math.min(j.hpMax, j.hp + j.hpMax * 0.5);
        break;
    }
    if (hierro) j.hierroSeguro -= o.precio;
    else {
      j.oroSeguro -= o.precio;
      j.resumen.oroGastado = (j.resumen.oroGastado ?? 0) + o.precio;
    }
    o.vendida = true;
    return null;
  }

  /** Renovar sube de precio en toda la expedición, como volver a tirar en Deep Rock (5, 7, 10, 14, 20, 28…). */
  precioRenovar(j: Jugador) {
    return PRECIOS_RENOVAR[Math.min(PRECIOS_RENOVAR.length - 1, this.renovadas.get(j.i) ?? 0)];
  }

  renovar(j: Jugador): string | null {
    const f = this.forja.get(j.i);
    if (!f) return null;
    const p = this.precioRenovar(j);
    if (j.oroSeguro < p) return 'No alcanza el oro.';
    j.oroSeguro -= p;
    j.resumen.oroGastado = (j.resumen.oroGastado ?? 0) + p;
    f.renovaciones++;
    this.renovadas.set(j.i, (this.renovadas.get(j.i) ?? 0) + 1);
    f.ofertas = this.ofertasNuevas(j, f.ofertas.filter((o) => o.guardada && !o.vendida));
    return null;
  }

  guardar(j: Jugador, idOferta: string) {
    const o = this.forja.get(j.i)?.ofertas.find((x) => x.id === idOferta);
    if (o) o.guardada = !o.guardada;
  }

  /** Yunque: hierro negro → un nivel de arma. */
  precioYunque(j: Jugador, ranura: number) {
    const a = j.armas[ranura];
    return a ? Math.round((5 + 3 * a.nivel) * (1 + 0.12 * (this.etapa - 1))) : 0;
  }
  yunque(j: Jugador, ranura: number): string | null {
    const a = j.armas[ranura];
    if (!a) return null;
    if (a.nivel >= NIVEL_MAX_ARMA) return 'Ya está al máximo.';
    const p = this.precioYunque(j, ranura);
    if (j.hierroSeguro < p) return 'Falta hierro negro.';
    j.hierroSeguro -= p;
    a.nivel++;
    a.xp = 0;
    a.sucio = true;
    if (a.debeSobrecarga && this.sim) encolarSobrecarga(this.sim, j, ranura);
    return null;
  }

  /** Altar de sangre: sangre cristalizada → una sobrecarga antes de tiempo (una por arma y visita). */
  precioSangre(j: Jugador, ranura: number) {
    const a = j.armas[ranura];
    return a ? Math.round((8 + 8 * a.sobrecargas.length) * (1 + 0.12 * (this.etapa - 1))) : 0;
  }
  altarSangre(j: Jugador, ranura: number): string | null {
    const a = j.armas[ranura];
    const f = this.forja.get(j.i);
    if (!a || !f) return null;
    if (f.sangreUsada[ranura]) return 'El altar ya bendijo esta arma en esta visita.';
    if (a.sobrecargas.length >= Math.min(MAX_SOBRECARGAS, a.def.sobrecargas.length)) return 'No le quedan sobrecargas.';
    const e = eleccionSobrecarga(this.az, a, ranura, '(altar de sangre)');
    if (!e) return 'No le quedan sobrecargas.';
    const p = this.precioSangre(j, ranura);
    if (j.sangreSeguro < p) return 'Falta sangre cristalizada.';
    j.sangreSeguro -= p;
    f.sangreUsada[ranura] = true;
    j.cola.push(e);
    a.pedidas = Math.max(a.pedidas, a.sobrecargas.length + 1);
    return null;
  }

  /** Vender un objeto (la mitad de lo que vale). */
  vender(j: Jugador, idObjeto: string): string | null {
    const k = j.objetos.indexOf(idObjeto);
    if (k < 0) return null;
    j.objetos.splice(k, 1);
    j.oroSeguro += Math.round((OBJETO[idObjeto]?.precio ?? 10) * 0.5);
    j.recalcular();
    return null;
  }

  // ----------------------------------------------------------------------------------------------- Final
  /** Recompensa de ceniza (moneda permanente) y maestría de cada jugador al terminar. */
  recompensa(j: Jugador) {
    const pel = PELIGROS[Math.max(0, Math.min(4, this.cfg.peligro - 1))];
    const mut = 1 + this.cfg.mutadores.reduce((s, m) => s + MUTADORES[m].recompensa, 0);
    const etapas = this.resultados.filter((r) => r.fin.exito && r.fin.extraidos.includes(j.i)).length;
    const objetivos = this.resultados.filter((r) => r.fin.objetivo).length;
    const base = 12 * etapas + 8 * objetivos + j.resumen.muertes / 60 + j.resumen.elites * 1.5 + (this.exito ? 40 : 0);
    // (las anómalas dan el doble de ceniza)
    const ceniza = Math.round(base * pel.recompensa * mut * (this.cfg.tutorial ? 0.3 : 1) * (this.cfg.anomalia ? 2 : 1));
    const maestria = Math.round((60 * etapas + 25 * objetivos + j.resumen.muertes / 12 + (this.exito ? 150 : 0)) * pel.recompensa * mut);
    return { ceniza, maestria, etapas, objetivos };
  }

  /** Lo que se puede ofrecer al Pozo de las Almas al final (el equipo que lleva puesto). */
  ofrendas(j: Jugador) {
    return Object.values(j.equipo).filter((x): x is string => !!pieza(x));
  }
}

export { PAREJA_EVOLUCION, OBJETO };
