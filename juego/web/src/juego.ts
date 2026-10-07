// Un día de juego: reloj, llegada de clientes, problemas, ayudantes, estadísticas, toques, choques en pareja y las 3 estrellas.
import * as THREE from 'three';
import { Ayudante, TipoAyudante } from './ayudantes';
import {
  AYUDAS, CANASTAS_INICIO, CHOQUE, CLIENTES, COMBO, PROBLEMAS, stockInicial, TipoCliente, UNIDADES_MAX,
} from './balance';
import { Cliente } from './cliente';
import { InfoJugador, Jugador, NuevaTarea } from './jugador';
import { aTres, Mundo } from './mundo';
import { P } from './navegacion';
import { CanastaSuelta, Ladron, Mugre, Nina, Perseguible } from './problemas';
import { cargar, cargarAnimado, copia, liberarEsqueletos, Productos } from './recursos';
import { esNeutro } from './neutro';
import * as sonido from './sonido';
import { liberarPropios, Tienda, TiendaDato, Vitrina } from './tienda';
import { NOMBRE_PAREJA } from './nombres';

export interface Estrella {
  numero: number;
  clave: string;
  texto: string | { solitario: string; pareja: string };
  meta: number | { solitario: number; pareja: number };
}
export interface NivelDato {
  numero: number;
  tienda: number;
  dia: number;
  evento: string | null;
  descripcion_evento?: string | null;
  novedad: string | null;
  duracion_s: number;
  paciencia: number;
  clientes: { solitario: number; pareja: number };
  /** Cuántos productos puede llevar un cliente (se sortea de 1 a este número). */
  lista_max?: number;
  /** Día dentro del tamaño del local (1 a 25). */
  dia_tienda?: number;
  problemas: string[];
  estrellas: Estrella[];
  noticia?: {
    id: string;
    titular: string;
    texto: string;
    efectos: { tipos?: Record<string, number>; preferir?: string[]; unidades_extra?: number; basura_x?: number; propina_extra?: number; velocidad_x?: number };
  } | null;
  legendario?: {
    clientes: { solitario: number; pareja: number };
    paciencia: number;
    problemas_x: number;
    luna: { ventas: { solitario: number }; perdidos_max: { solitario: number }; texto: { solitario: string } };
  };
}

export const textoDe = (t: Estrella['texto']) => (typeof t === 'string' ? t : t.solitario);
export const metaDe = (m: Estrella['meta']) => (typeof m === 'number' ? m : m.solitario);

export interface Stats {
  ventas: number;
  propinas: number;
  bonos: number;
  perdidos: number;
  atendidos: number;
  felices: number;
  esperas: number[];
  vaciaMax: number;
  basuraMax: number;
  robos: number;
  atrapados: number;
  calmadas: number;
  resbalones: number;
  combos: number;
  /** En pareja: combos en equipo, choques y estantes tumbados. */
  combosPareja: number;
  choques: number;
  tumbados: number;
}

export interface Resultado {
  estrellas: boolean[];
  stats: Stats;
  ganancia: number;
  luna: boolean | null;
  corazon: boolean;
}

/** Algo que se puede tocar en el piso o en la tienda (para elegir por cercanía en la pantalla). */
export interface Tocable {
  tipo: 'mugre' | 'canasta' | 'ladron' | 'nina';
  pos: P;
  alto: number;
  ref: Mugre | CanastaSuelta | Ladron | Nina;
}

export interface Evento {
  t: number;
  tipo: string;
  texto?: string;
  pos?: P;
  data?: any;
}

type Programado = { t: number; que: 'ladron' | 'nina' | 'famoso' | 'derrame' };

export class Juego {
  tienda!: Tienda;
  /** Él (y Ella, si juegan los dos en el mismo celular). */
  jugadores: Jugador[] = [];
  clientes: Cliente[] = [];
  /** Una fila por caja (la 0 es la de Él y la cajera). */
  filas: Cliente[][] = [[]];
  mugres: Mugre[] = [];
  canastasSueltas: CanastaSuelta[] = [];
  canastas = CANASTAS_INICIO;
  ladrones: Ladron[] = [];
  ninas: Nina[] = [];
  ayudantes: Ayudante[] = [];
  tiempo = 0;
  terminado = false;
  /** Con el tutorial el reloj del día se queda quieto (no llegan clientes ni problemas solos). */
  congelado = false;
  stats: Stats = {
    ventas: 0, propinas: 0, bonos: 0, perdidos: 0, atendidos: 0, felices: 0, esperas: [], vaciaMax: 0, basuraMax: 0,
    robos: 0, atrapados: 0, calmadas: 0, resbalones: 0, combos: 0, combosPareja: 0, choques: 0, tumbados: 0,
  };
  problemas: string[] = [];
  eventos: Evento[] = [];
  /** Corazón escondido: aparece un rato en un punto del piso. */
  corazon: { pos: P; desde: number; hasta: number; tomado: boolean } | null = null;
  alTerminar: ((r: Resultado) => void) | null = null;
  private llegadas: { t: number; tipo: TipoCliente }[] = [];
  private creados = 0;
  private programados: Programado[] = [];
  private sigMugre = 1;
  cafeHasta = -1;
  musicaHasta = -1;
  private raycaster = new THREE.Raycaster();
  private problemasX: number;

  /**
   * `pareja`: Él y Ella (en el mismo celular o en línea). `equipo`: los de una sala (de 2 a 4, cada uno con su id,
   * nombre, color y muñeco); si viene, manda sobre `pareja`.
   */
  constructor(public mundo: Mundo, public nivel: NivelDato, private productos: Productos, private tiendaDato: TiendaDato,
    private sitios: Record<number, number>, private escalas: Record<string, number>, public mejoras: Record<string, number>,
    public legendario = false, public pareja = false, private equipo: InfoJugador[] | null = null) {
    this.problemasX = legendario ? nivel.legendario?.problemas_x ?? 1.5 : 1;
    if (mejoras.canastas) this.canastas += 3;
    if (equipo?.length) this.pareja = equipo.length > 1;
  }

  /** El primer personaje (Él): el del joystick de la izquierda. */
  get jugador() {
    return this.jugadores[0];
  }

  get cafeActivo() {
    return this.tiempo < this.cafeHasta;
  }
  get pacienciaCongelada() {
    return this.tiempo < this.musicaHasta;
  }
  /** Adornos comprados (cada uno alivia la paciencia). */
  get adornos() {
    return ['planta', 'parlante', 'globos'].filter((k) => this.mejoras[k]).length;
  }
  /** La fila de la caja principal. */
  get fila() {
    return this.filas[0];
  }
  get cajera() {
    return this.ayudantes.find((a) => a.tipo === 'cajera' && a.numCaja === 0) ?? null;
  }
  get alguienCobra() {
    return this.cobrandoEn(0);
  }
  /** ¿Alguien está cobrando en la caja i? */
  cobrandoEn(i: number) {
    if (i === 0) return this.jugadores.some((p) => p.estaCobrando) || !!this.cajera?.cobrando;
    return this.ayudantes.some((a) => a.tipo === 'cajera' && a.numCaja === i && a.cobrando);
  }
  /** ¿El otro personaje ya está cobrando en la caja? (en la caja cobra uno a la vez). */
  otroCobrando(yo: Jugador) {
    return this.jugadores.some((p) => p !== yo && p.estaCobrando);
  }
  /** ¿Alguno de los dos va a reponer esta vitrina? */
  vaAReponer(v: Vitrina) {
    return this.jugadores.some((p) => p.vaAReponer(v));
  }

  get cerrado() {
    return this.tiempo >= this.nivel.duracion_s;
  }
  get dia() {
    return this.nivel.dia;
  }
  /** Efectos de la noticia del día (Diario del Barrio). */
  get efectos() {
    return this.nivel.noticia?.efectos ?? {};
  }

  /** `espejo`: el celular invitado en línea arma la misma tienda pero no simula (le llega la foto del anfitrión). */
  async preparar(espejo = false) {
    this.tienda = new Tienda(this.tiendaDato, this.productos);
    // Jugando no salen los botones verdes de «por comprar» (esos son para las mejoras entre días)
    await this.tienda.montar(this.sitios, this.mejoras, false);
    this.filas = this.tienda.cajas.map(() => []);
    // Los estantes arrancan a medio llenar (unos más vacíos que otros): hay que ir a la bodega desde el principio
    const f = stockInicial(this.dia, this.nivel.evento, this.legendario);
    this.tienda.enVenta.forEach((v, i) => {
      const k = f * (0.7 + ((i * 0.37) % 0.6));
      v.ponerStock(Math.max(1, Math.min(v.capacidad, Math.round(v.capacidad * k))));
    });
    this.mundo.escena.add(this.tienda.grupo);
    this.mundo.encuadrar(this.tiendaDato.W, this.tiendaDato.D);
    const esc = this.tiendaDato.escala_personas;
    const b = this.tienda.bodega;
    // Arrancan junto a la bodega (Él y Ella en sus puestos de siempre; en una sala, hasta cuatro en dos filas)
    const quienes: InfoJugador[] = this.equipo?.length
      ? this.equipo.slice(0, 4)
      : [{ id: 'el', cuerpo: 'el', nombre: NOMBRE_PAREJA.el }, ...(this.pareja ? [{ id: 'ella', cuerpo: 'ella', nombre: NOMBRE_PAREJA.ella } as InfoJugador] : [])];
    const puestos: P[] = [{ x: b.x - 1.2, y: b.y - 1.2 }, { x: b.x - 2.4, y: b.y - 1.0 }, { x: b.x - 1.3, y: b.y - 2.3 }, { x: b.x - 2.5, y: b.y - 2.1 }];
    for (let i = 0; i < quienes.length; i++) {
      const q = quienes[i];
      let pos = puestos[i];
      const [ci, cj] = this.tienda.nav.aCelda(pos);
      if (!this.tienda.nav.esLibre(ci, cj)) pos = this.puntoLibre(b);
      const p = new Jugador(pos, esc * (this.escalas[q.cuerpo] ?? 1), this, q.cuerpo, this.equipo?.length ? q : undefined);
      await p.preparar(this.productos);
      this.jugadores.push(p);
      this.mundo.escena.add(p.grupo);
    }
    this.problemas = this.nivel.problemas;
    if (!espejo) this.planear();
    // Precarga de lo que va a aparecer, para que nada se congele al entrar
    const tipos = espejo
      ? new Set([...(Object.keys(CLIENTES) as TipoCliente[]).filter((t) => CLIENTES[t].desde <= this.dia), ...(this.problemas.includes('famoso') ? ['famoso' as const] : [])])
      : new Set(this.llegadas.map((l) => l.tipo));
    for (const t of tipos) await cargarAnimado(`${t}.glb`);
    if (espejo ? this.problemas.includes('ladron') : this.programados.some((p) => p.que === 'ladron')) await cargarAnimado('ladron.glb');
    if (espejo ? this.problemas.includes('nina_traviesa') : this.programados.some((p) => p.que === 'nina')) await cargarAnimado('nina.glb');
    for (const m of ['basura.glb', 'charco.glb', 'canasta.glb']) await cargar(m).catch(() => null);
    // Ayudantes contratados (la segunda caja trae su propio cajero)
    const m = this.mejoras;
    const contratados: [TipoAyudante, number][] = [];
    if (m.cajera) contratados.push(['cajera', 0]);
    if (m.caja2 && this.tienda.cajas[1]) contratados.push(['cajera', 1]);
    if (m.reponedor) contratados.push(['reponedor', 0]);
    if (m.reponedor2) contratados.push(['reponedor', 1]);
    if (m.aseo) contratados.push(['aseo', 0]);
    if (m.guardia) contratados.push(['guardia', 0]);
    for (const [tipo, k] of contratados) {
      const inicio = tipo === 'reponedor' || tipo === 'aseo' ? { x: this.tienda.bodega.x - 0.6 - k * 0.7, y: this.tienda.bodega.y - 1.6 } : { x: this.tienda.entrada.x + 1.2 + k * 0.8, y: this.tienda.entrada.y + 0.5 };
      const a = new Ayudante(tipo, inicio, esc * (this.escalas[tipo] ?? 1), this, tipo === 'cajera' ? k : 0);
      await a.preparar(this.productos);
      this.ayudantes.push(a);
      this.mundo.escena.add(a.grupo);
      if (!espejo) a.empezar();
    }
    sonido.campana();
    if (espejo) return;
    if (this.nivel.noticia && !this.legendario) this.avisar(`Diario del Barrio: ${this.nivel.noticia.titular}`);
    else if (this.dia > 1) this.avisar('¡Llegó el camión! Los estantes están a medio llenar');
  }

  /** Horario del día: clientes, eventos y problemas. */
  private planear() {
    const nv = this.nivel;
    const dur = nv.duracion_s;
    const n = nv.clientes.solitario;
    const ventana = dur * 0.8;
    const disponibles = (Object.keys(CLIENTES) as TipoCliente[]).filter((t) => CLIENTES[t].desde <= nv.dia);
    // La noticia del día puede traer más de un tipo de cliente (mamás, adolescentes…)
    const pesoTipo = (t: TipoCliente) => this.efectos.tipos?.[t] ?? 1;
    const azar = (xs: TipoCliente[]) => {
      let r = Math.random() * xs.reduce((a, t) => a + pesoTipo(t), 0);
      for (const t of xs) if ((r -= pesoTipo(t)) <= 0) return t;
      return xs[xs.length - 1];
    };
    for (let i = 0; i < n; i++) {
      let t: number;
      if (nv.evento === 'Hora pico') {
        // Tres oleadas de clientes
        const ola = [0.12, 0.45, 0.78][i % 3];
        t = 4 + ventana * Math.min(0.98, Math.max(0, ola + (Math.random() - 0.5) * 0.12));
      } else t = 4 + (ventana * (i + Math.random() * 0.8)) / n;
      this.llegadas.push({ t, tipo: azar(disponibles) });
    }
    const hay = (p: string) => nv.problemas.includes(p);
    const gran = nv.evento === 'Gran día' || nv.evento === 'Gran final';
    const cuantos = (base: number) => Math.max(1, Math.round((base + (gran ? 1 : 0)) * this.problemasX));
    if (hay('famoso')) this.llegadas.push({ t: dur * (0.35 + Math.random() * 0.2), tipo: 'famoso' });
    this.llegadas.sort((a, b) => a.t - b.t);
    if (hay('ladron')) for (let i = 0; i < cuantos(1); i++) this.programados.push({ t: dur * (0.2 + Math.random() * 0.55), que: 'ladron' });
    if (hay('nina_traviesa')) for (let i = 0; i < cuantos(1); i++) this.programados.push({ t: dur * (0.25 + Math.random() * 0.55), que: 'nina' });
    if (hay('derrames')) {
      const cada = PROBLEMAS.derrameCada / (nv.evento === 'Día lluvioso' ? 2 : 1) / this.problemasX;
      for (let t = 15 + Math.random() * 10; t < dur; t += cada * (0.7 + Math.random() * 0.6)) this.programados.push({ t, que: 'derrame' });
    }
    this.programados.sort((a, b) => a.t - b.t);
    const tc = dur * (0.3 + Math.random() * 0.4);
    this.corazon = { pos: this.puntoLibre(), desde: tc, hasta: tc + 9, tomado: false };
  }

  /** Un punto caminable al azar (para charcos y el corazón). */
  private puntoLibre(cercaDe?: P): P {
    const nav = this.tienda.nav;
    for (let k = 0; k < 60; k++) {
      const p = cercaDe
        ? { x: cercaDe.x + (Math.random() - 0.3) * 2.2, y: cercaDe.y + (Math.random() - 0.5) * 1.6 }
        : { x: (Math.random() - 0.5) * (this.tiendaDato.W - 2.4), y: (Math.random() - 0.5) * (this.tiendaDato.D - 2.4) };
      const [i, j] = nav.aCelda(p);
      if (nav.esLibre(i, j) && nav.esLibre(i + 1, j) && nav.esLibre(i - 1, j) && nav.esLibre(i, j + 1) && nav.esLibre(i, j - 1)) return p;
    }
    return { ...this.tienda.entrada, x: this.tienda.entrada.x + 1.5 };
  }

  private listaPara(tipo: TipoCliente) {
    const opciones = this.tienda.enVenta;
    const d = this.nivel.dia;
    const max = this.nivel.lista_max ?? (d <= 1 ? 1 : d < 8 ? 2 : d < 20 ? 3 : 4);
    const k = Math.min(tipo === 'famoso' ? 3 : 1 + Math.floor(Math.random() * max), opciones.length);
    const prefiere = CLIENTES[tipo].prefiere;
    const hoy = this.efectos.preferir ?? [];
    const pesos = opciones.map((v) => (prefiere.includes(v.seccion) ? 3 : 1) * (hoy.includes(v.seccion) ? 3 : 1));
    const elegidas: Vitrina[] = [];
    const disponibles = [...opciones];
    for (let i = 0; i < k && disponibles.length; i++) {
      const total = disponibles.reduce((a, v) => a + pesos[opciones.indexOf(v)], 0);
      let r = Math.random() * total;
      let idx = 0;
      for (; idx < disponibles.length - 1; idx++) {
        r -= pesos[opciones.indexOf(disponibles[idx])];
        if (r <= 0) break;
      }
      elegidas.push(disponibles.splice(idx, 1)[0]);
    }
    const extra = this.nivel.evento === 'Día de ofertas' ? 1 : 0;
    const quincena = this.efectos.unidades_extra ?? 0;
    return elegidas.map((v) => ({
      vitrina: v,
      producto: v.productos[Math.floor(Math.random() * v.productos.length)],
      cantidad: Math.min(3, 1 + Math.floor(Math.random() * UNIDADES_MAX(d)) + (Math.random() < 0.5 ? extra : 0) + quincena),
      tomadas: 0,
    }));
  }

  /** Ya se salió del día: lo que termine de cargar después no debe aparecer en la tienda del menú. */
  private destruido = false;

  /** Un cliente ya (el tutorial lo trae para practicar el cobro). */
  traerCliente(tipo: TipoCliente) {
    void this.nuevoCliente(tipo);
  }

  private async nuevoCliente(tipo: TipoCliente) {
    const e = this.tienda.entrada;
    const c = new Cliente(tipo, { x: e.x - 1.2, y: e.y }, this.tiendaDato.escala_personas * (this.escalas[tipo] ?? 1), this.nivel.paciencia, this);
    c.lista = this.listaPara(tipo);
    c.velocidad *= this.efectos.velocidad_x ?? 1;
    await c.preparar();
    if (this.destruido) return;
    this.clientes.push(c);
    this.mundo.escena.add(c.grupo);
    c.empezar();
    if (tipo === 'famoso') {
      this.avisar('¡Llegó el famoso! Todos se quedan mirándolo');
      sonido.campana();
      for (const o of this.clientes) if (o !== c && o.estado !== 'saliendo') {
        o.pausa = PROBLEMAS.famosoMirar;
        o.mirarA(c.pos);
      }
    }
  }

  private async nuevoLadron() {
    const e = this.tienda.entrada;
    const l = new Ladron({ x: e.x - 1.2, y: e.y }, this.tiendaDato.escala_personas * (this.escalas.ladron ?? 1), this, !!this.mejoras.camara);
    await l.preparar();
    if (this.destruido) return;
    this.ladrones.push(l);
    this.mundo.escena.add(l.grupo);
    l.empezar();
    if (this.mejoras.camara) this.avisar('La cámara vio entrar a un ladrón');
  }

  private async nuevaNina() {
    const e = this.tienda.entrada;
    const n = new Nina({ x: e.x - 1.2, y: e.y }, this.tiendaDato.escala_personas * (this.escalas.nina ?? 1), this);
    await n.preparar();
    if (this.destruido) return;
    this.ninas.push(n);
    this.mundo.escena.add(n.grupo);
    n.empezar();
  }

  /** Tamaño de un personaje en esta tienda (sin tipo: el de la gente en general). */
  escalaDe(tipo?: string) {
    return this.tiendaDato.escala_personas * (tipo ? this.escalas[tipo] ?? 1 : 1);
  }

  async nuevaMugre(tipo: Mugre['tipo'], pos: P, vitrina?: Vitrina, unidades?: number) {
    let obj: THREE.Object3D;
    if (tipo === 'caidos' && vitrina) {
      // Los mismos productos de la vitrina, tirados en el piso
      obj = new THREE.Group();
      const prod = vitrina.productos[0];
      for (let i = 0; i < Math.min(3, unidades ?? 1); i++) {
        const p = this.productos.crear(prod);
        if (!p) continue;
        p.position.set((i - 1) * 0.16, 0.05, (Math.random() - 0.5) * 0.15);
        p.rotation.set(Math.PI / 2, Math.random() * Math.PI, 0);
        p.scale.setScalar(0.9);
        obj.add(p);
      }
    } else {
      obj = copia(await cargar(tipo === 'basura' ? 'basura.glb' : 'charco.glb'));
      obj.scale.setScalar(tipo === 'basura' ? 1.6 : tipo === 'sucio' ? 1.55 : 1.3);
      obj.rotation.y = Math.random() * Math.PI * 2;
      // Mugre del piso (de un estante tumbado o un carrito regado): el mismo charco, color barro
      if (tipo === 'sucio')
        obj.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          const mat = (m.material as THREE.MeshStandardMaterial).clone();
          mat.color.set('#8a6446');
          m.material = mat;
          m.userData.materialPropio = true;
        });
    }
    obj.position.copy(aTres(pos.x, pos.y));
    const m: Mugre = { id: this.sigMugre++, tipo, pos, tiempo: 0, obj, vitrina, unidades, producto: vitrina?.productos[0] };
    if (this.destruido) return m;
    this.mugres.push(m);
    this.mundo.escena.add(obj);
    return m;
  }

  quitarMugre(m: Mugre) {
    const i = this.mugres.indexOf(m);
    if (i < 0) return;
    this.mundo.escena.remove(m.obj);
    m.obj.traverse((o) => {
      if (o.userData.materialPropio) ((o as THREE.Mesh).material as THREE.Material).dispose();
    });
    this.mugres.splice(i, 1);
    sonido.limpio();
  }

  mugreCerca(p: P, r: number) {
    return this.mugres.some((m) => m.tipo !== 'charco' && Math.hypot(m.pos.x - p.x, m.pos.y - p.y) < r);
  }
  /** Charco (o mugre húmeda) donde alguien se puede resbalar. */
  charcoEn(p: P, r: number) {
    return this.mugres.find((m) => (m.tipo === 'charco' || m.tipo === 'sucio') && Math.hypot(m.pos.x - p.x, m.pos.y - p.y) < r) ?? null;
  }

  resbalon(c: Cliente) {
    this.stats.resbalones++;
    sonido.resbalon();
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: '¡Uy!', pos: { ...c.pos }, data: { clase: 'mal' } });
  }

  async canastaTirada(pos: P) {
    const obj = copia(await cargar('canasta.glb'));
    obj.position.copy(aTres(pos.x, pos.y));
    obj.rotation.set(0, Math.random() * Math.PI * 2, 0.35);
    obj.scale.setScalar(0.85 * this.tiendaDato.escala_personas / 0.68);
    const c: CanastaSuelta = { id: this.sigMugre++, pos, obj };
    if (this.destruido) return;
    this.canastasSueltas.push(c);
    this.mundo.escena.add(obj);
  }

  quitarCanasta(c: CanastaSuelta) {
    const i = this.canastasSueltas.indexOf(c);
    if (i < 0) return;
    this.mundo.escena.remove(c.obj);
    this.canastasSueltas.splice(i, 1);
  }

  cobrar(c: Cliente, quien?: Jugador) {
    const r = c.pagar();
    if (quien) this.trabajoHecho(quien, c.pos);
    this.stats.ventas += r.monto;
    this.stats.propinas += r.propina;
    this.stats.atendidos++;
    if (r.feliz) this.stats.felices++;
    this.stats.esperas.push(r.espera);
    sonido.caja();
    this.eventos.push({ t: this.tiempo, tipo: 'cobro', data: { monto: r.monto, propina: r.propina } });
  }

  bono(monto: number, texto: string, pos: P, n: number) {
    if (monto <= 0) return;
    this.stats.bonos += monto;
    this.stats.combos++;
    sonido.combo(n);
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: `${texto} +${monto}`, pos: { ...pos }, data: { clase: 'combo' } });
  }

  clientePerdido(c: Cliente) {
    this.stats.perdidos++;
    this.eventos.push({ t: this.tiempo, tipo: 'perdido', data: { id: c.id } });
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: '¡Me voy!', pos: { ...c.pos }, data: { clase: 'mal' } });
  }

  alReponer(v: Vitrina, quien?: Jugador) {
    sonido.repuesto();
    this.eventos.push({ t: this.tiempo, tipo: 'repuesto', data: { id: v.dato.id } });
    if (quien) this.trabajoHecho(quien, v.centro());
  }

  private ultimoTrabajo: { id: string; t: number } | null = null;
  /** En pareja (o en equipo): si dos terminan algo útil casi al mismo tiempo (uno repone y el otro cobra…), es combo. */
  trabajoHecho(quien: Jugador, pos: P) {
    if (!this.pareja) return;
    const u = this.ultimoTrabajo;
    if (u && u.id !== quien.id && this.tiempo - u.t <= COMBO.parejaVentana) {
      this.ultimoTrabajo = null;
      this.stats.combosPareja++;
      this.stats.bonos += COMBO.pareja;
      sonido.corazon();
      this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: `¡Combo ${this.textoEquipo}! +${COMBO.pareja}`, pos: { ...pos }, data: { clase: 'corazon' } });
      return;
    }
    this.ultimoTrabajo = { id: quien.id, t: this.tiempo };
  }

  /** Se juega en una sala (de 2 a 4, cada uno con su nombre y su color). */
  get enSala() {
    return !!this.equipo?.length;
  }

  /** «en pareja» entre Él y Ella; «en equipo» con amigos (modo neutro) o de a tres o cuatro. */
  get textoEquipo() {
    return esNeutro() || this.jugadores.length > 2 ? 'en equipo' : 'en pareja';
  }

  // ---------- Choques entre Él y Ella (o entre todos los de la sala) ----------

  /** Cada par de jugadores: si se chocaron de frente (y rápido) salen volando; si no, apenas se apartan. */
  private choques() {
    const js = this.jugadores;
    for (let i = 0; i < js.length; i++) for (let k = i + 1; k < js.length; k++) this.choquePar(js[i], js[k]);
  }

  /** Revisa si estos dos se chocaron de frente (y rápido); si no, apenas se apartan para no quedar uno encima del otro. */
  private choquePar(a: Jugador, b: Jugador) {
    if (a.atontado || b.atontado) return;
    const dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y;
    const d = Math.hypot(dx, dy);
    if (d >= CHOQUE.radio * 2 || d < 1e-4) return;
    const n = { x: dx / d, y: dy / d };
    const va = a.vel.x * n.x + a.vel.y * n.y; // Él hacia Ella
    const vb = -(b.vel.x * n.x + b.vel.y * n.y); // Ella hacia Él
    const deFrente = va > CHOQUE.acercandose && vb > CHOQUE.acercandose;
    if (deFrente && a.puedeChocar && b.puedeChocar && (a.manejado || b.manejado)) return this.choque(a, b, n);
    // Se apartan: solo se mueve el que va caminando con el joystick
    const falta = CHOQUE.radio * 2 - d;
    const mover = (p: Jugador, s: number) => {
      const q = { x: p.pos.x + n.x * s, y: p.pos.y + n.y * s };
      const [i, j] = this.tienda.nav.aCelda(q);
      if (this.tienda.nav.esLibre(i, j)) {
        p.pos = q;
        p.sincronizar();
      }
    };
    const ma = a.manejado || (!a.haciendo && !a.estaCobrando), mb = b.manejado || (!b.haciendo && !b.estaCobrando);
    if (ma && mb) {
      mover(a, -falta / 2);
      mover(b, falta / 2);
    } else if (ma) mover(a, -falta);
    else if (mb) mover(b, falta);
  }

  private choque(a: Jugador, b: Jugador, n: P) {
    this.stats.choques++;
    a.chocar({ x: -n.x, y: -n.y });
    b.chocar(n);
    const medio = { x: (a.pos.x + b.pos.x) / 2, y: (a.pos.y + b.pos.y) / 2 };
    sonido.nota(190, 0.16, 0, 'square', 0.07, 80);
    sonido.nota(1400, 0.08, 0.05, 'triangle', 0.05, 2200);
    sonido.nota(1700, 0.08, 0.14, 'triangle', 0.04, 2600);
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: '¡Pum!', pos: medio, data: { clase: 'choque' } });
    // Con el carrito lleno (o casi), se riega todo y ensucia el piso
    for (const p of [a, b]) {
      if (p.carga <= 0 || p.carga < CHOQUE.cargaLlena * p.capacidadCarrito) continue;
      p.regarCarrito();
      void this.nuevaMugre('sucio', this.puntoCerca(p.pos));
      this.eventos.push({ t: this.tiempo + 0.01, tipo: 'pop', texto: 'Se regó el carrito', pos: { ...p.pos }, data: { clase: 'mal' } });
    }
  }

  /** Alguien salió empujado contra un mueble: si es un estante, se tumba. */
  golpeContra(p: Jugador, donde: P) {
    const v = this.tienda.enVenta.find((x) => {
      const [x0, y0, x1, y1] = x.rect();
      const m = 0.45;
      return donde.x > x0 - m && donde.x < x1 + m && donde.y > y0 - m && donde.y < y1 + m;
    });
    if (v) this.tumbarVitrina(v);
    else sonido.nota(160, 0.1, 0, 'square', 0.05, 90);
  }

  /** Estante tumbado: se vacía, los productos quedan en el piso y queda mugre por trapear. */
  tumbarVitrina(v: Vitrina) {
    if (v.tumbada) return;
    const n = v.stock;
    v.tumbar();
    v.ponerStock(0);
    this.stats.tumbados++;
    this.vitrinaVacia(v);
    sonido.resbalon();
    sonido.nota(120, 0.35, 0.05, 'sawtooth', 0.05, 60);
    const f = v.frente();
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: '¡Se cayó el estante!', pos: v.centro(), data: { clase: 'mal' } });
    void this.nuevaMugre('sucio', this.puntoCerca({ x: f.x + 0.35, y: f.y }));
    if (n > 0) void this.nuevaMugre('caidos', { x: f.x - 0.35, y: f.y - 0.1 }, v, Math.min(3, n));
  }

  /** Un punto libre del piso cerca de otro (para dejar mugre donde se pueda trapear). */
  private puntoCerca(p: P): P {
    const nav = this.tienda.nav;
    const [i, j] = nav.cercana(p);
    return nav.aPunto(i, j);
  }

  vitrinaVacia(v: Vitrina) {
    sonido.vacia();
    this.eventos.push({ t: this.tiempo, tipo: 'vacia', data: { id: v.dato.id } });
  }

  robo(valor: number) {
    this.stats.robos++;
    this.avisar(`El ladrón se escapó con ${valor} monedas en productos`);
    sonido.enojo();
  }

  ladronAtrapado(l: Ladron) {
    this.stats.atrapados++;
    this.stats.bonos += 5;
    sonido.atrapado();
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: '¡Atrapado! +5', pos: { ...l.pos }, data: { clase: 'combo' } });
  }

  ninaCalmada(n: Nina) {
    this.stats.calmadas++;
    sonido.atrapado();
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: 'Ya se calmó', pos: { ...n.pos }, data: { clase: 'bien' } });
  }

  avisar(texto: string) {
    this.eventos.push({ t: this.tiempo, tipo: 'aviso', texto });
  }

  /** El personaje más cercano a un punto (a quien le llega un toque en pareja). */
  masCercano(p: P): Jugador {
    return this.jugadores.reduce((a, b) => (Math.hypot(b.pos.x - p.x, b.pos.y - p.y) < Math.hypot(a.pos.x - p.x, a.pos.y - p.y) ? b : a));
  }

  perseguibles(): Perseguible[] {
    return [...this.ladrones, ...this.ninas].filter((o) => o.activo);
  }

  /** Ayudas de un solo uso (el botón de la barra de abajo). */
  usarAyuda(id: string): boolean {
    const a = AYUDAS.find((x) => x.id === id);
    if (!a || this.terminado) return false;
    if (id === 'cafe') this.cafeHasta = this.tiempo + a.duracion;
    else if (id === 'musica') this.musicaHasta = this.tiempo + a.duracion;
    else if (id === 'limpieza') {
      for (const m of [...this.mugres]) {
        if (m.tipo === 'caidos' && m.vitrina) m.vitrina.ponerStock(m.vitrina.stock + (m.unidades ?? 1));
        this.quitarMugre(m);
      }
      for (const c of [...this.canastasSueltas]) {
        this.quitarCanasta(c);
        this.canastas++;
      }
    }
    sonido.combo(3);
    this.avisar(`${a.nombre}: ${a.texto.toLowerCase()}`);
    return true;
  }

  tomarCorazon() {
    if (!this.corazon || this.corazon.tomado) return;
    this.corazon.tomado = true;
    sonido.corazon();
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: esNeutro() ? '¡Trébol de la suerte!' : '¡Corazón escondido!', pos: { ...this.corazon.pos }, data: { clase: 'corazon' } });
  }

  get corazonVisible() {
    const c = this.corazon;
    return !!c && !c.tomado && this.tiempo >= c.desde && this.tiempo <= c.hasta;
  }

  tocables(): Tocable[] {
    const t: Tocable[] = [];
    for (const m of this.mugres) t.push({ tipo: 'mugre', pos: m.pos, alto: 0.1, ref: m });
    for (const c of this.canastasSueltas) t.push({ tipo: 'canasta', pos: c.pos, alto: 0.2, ref: c });
    const alto = 1.4 * this.tiendaDato.escala_personas;
    for (const l of this.ladrones) if (l.activo && l.visible) t.push({ tipo: 'ladron', pos: l.pos, alto, ref: l });
    for (const n of this.ninas) if (n.activo) t.push({ tipo: 'nina', pos: n.pos, alto: alto * 0.7, ref: n });
    return t;
  }

  /** Agrega (o cancela, si ya estaba) una acción en la fila de quien esté más cerca de ella (o de `quien`, en línea:
   *  cada uno toca en su celular para su personaje y no le quita las cosas al otro). */
  private tarea(t: NuevaTarea, codigo: string, donde: P, quien?: Jugador): string {
    if (quien) {
      if (quien.tiene(t)) return quien.cancelar(t) ? 'cancelada' : 'ya';
      if (this.jugadores.some((p) => p.tiene(t))) return 'otro';
      return quien.agregar(t) ? codigo : 'ya';
    }
    const ya = this.jugadores.find((p) => p.tiene(t));
    if (ya) return ya.cancelar(t) ? 'cancelada' : 'ya';
    const libres = this.jugadores.filter((p) => !p.atontado);
    const j = libres.length ? libres.reduce((a, b) => (Math.hypot(b.pos.x - donde.x, b.pos.y - donde.y) < Math.hypot(a.pos.x - donde.x, a.pos.y - donde.y) ? b : a)) : this.jugador;
    return j.agregar(t) ? codigo : 'ya';
  }

  /** Toque en la pantalla: agrega (o cancela) la acción correspondiente en la fila de Él (o de Ella, si está más cerca). */
  tocar(x: number, y: number, quien?: Jugador): string | null {
    const o = this.objetivoDeToque(x, y);
    return o && typeof o === 'object' ? this.tarea(o.t, o.codigo, o.donde, quien) : o;
  }

  /** En línea: lo que tocó el otro en su celular, para su personaje. */
  asignar(t: NuevaTarea, quien: Jugador): string {
    return this.tarea(t, t.tipo, quien.pos, quien);
  }

  /** Qué se tocó: la acción que corresponde (o un aviso: «llena», «cajera», «aseo»…). */
  objetivoDeToque(x: number, y: number): { t: NuevaTarea; codigo: string; donde: P } | string | null {
    // 1) Lo pequeño que está en el piso o lo que corre: se elige por cercanía en la pantalla
    let mejor: Tocable | null = null;
    let dmin = 46;
    for (const t of this.tocables()) {
      for (const z of [0, t.alto]) {
        const s = this.mundo.aPantalla(aTres(t.pos.x, t.pos.y, z));
        const d = Math.hypot(s.x - x, s.y - y);
        if (d < dmin) {
          dmin = d;
          mejor = t;
        }
      }
    }
    if (mejor) {
      const donde = mejor.pos;
      if (mejor.tipo === 'mugre') {
        const m = mejor.ref as Mugre;
        if (m.reservado === 'aseo') return 'aseo';
        return { t: { tipo: 'mugre', mugre: m }, codigo: m.tipo, donde };
      }
      if (mejor.tipo === 'canasta') return { t: { tipo: 'canasta', canasta: mejor.ref as CanastaSuelta }, codigo: 'canasta', donde };
      return { t: { tipo: 'atrapar', objetivo: mejor.ref as Perseguible }, codigo: mejor.tipo, donde };
    }
    // 2) Vitrinas y caja: por rayo
    const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.mundo.camara);
    const golpes = this.raycaster.intersectObjects(this.tienda.grupo.children, true);
    for (const g of golpes) {
      if (this.tienda.esLavadero(g.object)) return { t: { tipo: 'lavar' }, codigo: 'lavar', donde: this.tienda.lavadero };
      const v = this.tienda.porGrupo(g.object);
      if (!v) continue;
      if (!v.nivel) return null;
      if (v.seccion === 'caja') {
        if (this.cajera || v !== this.tienda.caja.vitrina) return 'cajera';
        return { t: { tipo: 'caja' }, codigo: 'caja', donde: this.tienda.caja.puestoCajero() };
      }
      if (v.stock < v.capacidad || this.vaAReponer(v)) return { t: { tipo: 'reponer', vitrina: v }, codigo: 'reponer', donde: v.frente() };
      return 'llena';
    }
    return null;
  }

  reponerSeccion(v: Vitrina, quien?: Jugador) {
    if (this.vaAReponer(v)) return false;
    return this.tarea({ tipo: 'reponer', vitrina: v }, 'reponer', v.frente(), quien) === 'reponer';
  }

  update(dt: number) {
    if (this.terminado) return;
    if (!this.congelado) this.tiempo += dt;
    if (this.congelado) {
      // (con el tutorial no llega nadie solo)
    } else if (!this.cerrado) {
      while (this.creados < this.llegadas.length && this.tiempo >= this.llegadas[this.creados].t) void this.nuevoCliente(this.llegadas[this.creados++].tipo);
      while (this.programados.length && this.tiempo >= this.programados[0].t) {
        const p = this.programados.shift()!;
        if (p.que === 'ladron') void this.nuevoLadron();
        else if (p.que === 'nina') void this.nuevaNina();
        else if (p.que === 'derrame') {
          const lluvia = this.nivel.evento === 'Día lluvioso' && Math.random() < 0.5;
          void this.nuevaMugre('charco', this.puntoLibre(lluvia ? { x: this.tienda.entrada.x + 1.3, y: this.tienda.entrada.y } : undefined));
        }
      }
    } else {
      this.creados = this.llegadas.length;
      // Cerrado: los que esperaban canasta en la puerta se van sin contar como perdidos
      for (const c of this.clientes) if (c.esperandoCanasta) c.salir(false);
    }
    for (const p of this.jugadores) p.update(dt);
    this.choques();
    this.tienda.animar(dt);
    for (const c of this.clientes) c.update(dt);
    for (const l of this.ladrones) l.update(dt);
    for (const n of this.ninas) n.update(dt);
    for (const a of this.ayudantes) a.update(dt);
    const fuera = <T extends { estado: string; grupo: THREE.Object3D }>(xs: T[]) => {
      for (const x of xs.filter((x) => x.estado === 'fuera')) {
        this.mundo.escena.remove(x.grupo);
        liberarEsqueletos(x.grupo);
      }
      return xs.filter((x) => x.estado !== 'fuera');
    };
    this.clientes = fuera(this.clientes);
    this.ladrones = fuera(this.ladrones);
    this.ninas = fuera(this.ninas);
    for (const v of this.tienda.enVenta) {
      if (v.stock === 0) {
        v.tiempoVacia += dt;
        this.stats.vaciaMax = Math.max(this.stats.vaciaMax, v.tiempoVacia);
      } else v.tiempoVacia = 0;
    }
    for (const m of this.mugres) {
      m.tiempo += dt;
      this.stats.basuraMax = Math.max(this.stats.basuraMax, m.tiempo);
    }
    const quedan = this.clientes.length + this.ladrones.length + this.ninas.length;
    const acabo = this.cerrado && this.creados >= this.llegadas.length && quedan === 0;
    const forzado = this.tiempo >= this.nivel.duracion_s + 40;
    if (acabo || forzado) this.finalizar();
  }

  get restante() {
    return Math.max(0, this.nivel.duracion_s - this.tiempo);
  }
  get ganancia() {
    return this.stats.ventas + this.stats.propinas + this.stats.bonos;
  }

  /** ¿Se está cumpliendo el objetivo? (para los íconos en vivo). */
  cumple(e: Estrella, final = false): boolean {
    const s = this.stats;
    const m = metaDe(e.meta);
    const esperaProm = s.esperas.length ? s.esperas.reduce((a, b) => a + b, 0) / s.esperas.length : 0;
    switch (e.clave) {
      case 'ventas':
      case 'experta': return s.ventas >= m;
      case 'propinas': return s.propinas >= m;
      case 'perdidos': return s.perdidos <= m;
      case 'espera_caja': return esperaProm <= m;
      case 'sin_vacias': return s.vaciaMax <= m;
      case 'limpieza': return s.basuraMax <= m;
      case 'robos': return s.robos === 0;
      case 'equipo': {
        // En pareja son combos en equipo; solo, el % de clientes felices
        if (this.pareja) return s.combosPareja >= m;
        const tot = s.atendidos + s.perdidos;
        return final ? tot > 0 && (100 * s.felices) / tot >= m : tot === 0 || (100 * s.felices) / tot >= m;
      }
      default: return false;
    }
  }

  progreso(e: Estrella): string {
    const s = this.stats;
    const m = metaDe(e.meta);
    switch (e.clave) {
      case 'ventas':
      case 'experta': return `${s.ventas}/${m}`;
      case 'propinas': return `${s.propinas}/${m}`;
      case 'perdidos': return `${s.perdidos}/${m} máx`;
      case 'espera_caja': {
        const p = s.esperas.length ? s.esperas.reduce((a, b) => a + b, 0) / s.esperas.length : 0;
        return `${p.toFixed(0)}/${m} s`;
      }
      case 'sin_vacias': return `${s.vaciaMax.toFixed(0)}/${m} s`;
      case 'limpieza': return `${s.basuraMax.toFixed(0)}/${m} s`;
      case 'robos': return s.robos ? `${s.robos} robo${s.robos > 1 ? 's' : ''}` : 'Sin robos';
      case 'equipo': {
        if (this.pareja) return `${s.combosPareja}/${m} combos`;
        const tot = s.atendidos + s.perdidos;
        return `${tot ? Math.round((100 * s.felices) / tot) : 100}/${m} %`;
      }
      default: return '';
    }
  }

  /** Meta legendaria (Luna): ventas mínimas y máximo de clientes perdidos. */
  get metaLuna() {
    const l = this.nivel.legendario?.luna;
    return l ? { ventas: l.ventas.solitario, perdidos: l.perdidos_max.solitario, texto: l.texto.solitario } : null;
  }

  private finalizar() {
    this.terminado = true;
    const estrellas = this.nivel.estrellas.map((e) => this.cumple(e, true));
    const ml = this.metaLuna;
    const luna = this.legendario && ml ? this.stats.ventas >= ml.ventas && this.stats.perdidos <= ml.perdidos : null;
    sonido.fin(estrellas[0]);
    this.alTerminar?.({ estrellas, stats: this.stats, ganancia: this.ganancia, luna, corazon: !!this.corazon?.tomado });
  }

  destruir() {
    this.destruido = true;
    liberarPropios(this.tienda.grupo);
    const personas = [...this.jugadores.map((p) => p.grupo), ...this.clientes.map((c) => c.grupo), ...this.ladrones.map((l) => l.grupo), ...this.ninas.map((n) => n.grupo),
      ...this.ayudantes.map((a) => a.grupo)];
    this.mundo.escena.remove(this.tienda.grupo, ...personas, ...this.mugres.map((b) => b.obj), ...this.canastasSueltas.map((c) => c.obj));
    liberarEsqueletos(...personas);
    for (const p of this.jugadores) for (const m of p.propios) m.dispose();
  }
}
