// Un día de juego: reloj, llegada de clientes, problemas, ayudantes, estadísticas, toques y las 3 estrellas.
import * as THREE from 'three';
import { Ayudante, TipoAyudante } from './ayudantes';
import {
  AYUDAS, CANASTAS_INICIO, CLIENTES, PROBLEMAS, TipoCliente, UNIDADES_MAX,
} from './balance';
import { Cliente } from './cliente';
import { Jugador, NuevaTarea } from './jugador';
import { aTres, Mundo } from './mundo';
import { P } from './navegacion';
import { CanastaSuelta, Ladron, Mugre, Nina, Perseguible } from './problemas';
import { cargar, cargarAnimado, copia, liberarEsqueletos, Productos } from './recursos';
import * as sonido from './sonido';
import { liberarPropios, Tienda, TiendaDato, Vitrina } from './tienda';

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
  jugador!: Jugador;
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
  stats: Stats = {
    ventas: 0, propinas: 0, bonos: 0, perdidos: 0, atendidos: 0, felices: 0, esperas: [], vaciaMax: 0, basuraMax: 0,
    robos: 0, atrapados: 0, calmadas: 0, resbalones: 0, combos: 0,
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
  private cafeHasta = -1;
  private musicaHasta = -1;
  private raycaster = new THREE.Raycaster();
  private problemasX: number;

  constructor(public mundo: Mundo, public nivel: NivelDato, private productos: Productos, private tiendaDato: TiendaDato,
    private sitios: Record<number, number>, private escalas: Record<string, number>, public mejoras: Record<string, number>,
    public legendario = false) {
    this.problemasX = legendario ? nivel.legendario?.problemas_x ?? 1.5 : 1;
    if (mejoras.canastas) this.canastas += 3;
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
    if (i === 0) return this.jugador.estaCobrando || !!this.cajera?.cobrando;
    return this.ayudantes.some((a) => a.tipo === 'cajera' && a.numCaja === i && a.cobrando);
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

  async preparar() {
    this.tienda = new Tienda(this.tiendaDato, this.productos);
    await this.tienda.montar(this.sitios, this.mejoras);
    this.filas = this.tienda.cajas.map(() => []);
    this.mundo.escena.add(this.tienda.grupo);
    this.mundo.encuadrar(this.tiendaDato.W, this.tiendaDato.D);
    const esc = this.tiendaDato.escala_personas;
    this.jugador = new Jugador({ x: this.tienda.bodega.x - 1.2, y: this.tienda.bodega.y - 1.2 }, esc, this);
    await this.jugador.preparar(this.productos);
    this.mundo.escena.add(this.jugador.grupo);
    this.problemas = this.nivel.problemas;
    this.planear();
    // Precarga de lo que va a aparecer, para que nada se congele al entrar
    const tipos = new Set(this.llegadas.map((l) => l.tipo));
    for (const t of tipos) await cargarAnimado(`${t}.glb`);
    if (this.programados.some((p) => p.que === 'ladron')) await cargarAnimado('ladron.glb');
    if (this.programados.some((p) => p.que === 'nina')) await cargarAnimado('nina.glb');
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
      a.empezar();
    }
    sonido.campana();
    if (this.nivel.noticia && !this.legendario) this.avisar(`Diario del Barrio: ${this.nivel.noticia.titular}`);
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
    const gran = nv.evento === 'Gran día';
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
    const max = (d <= 1 ? 1 : d < 8 ? 2 : d < 20 ? 3 : 4) + (this.nivel.tienda - 1);
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
      obj = copia(await cargar(tipo === 'charco' ? 'charco.glb' : 'basura.glb'));
      obj.scale.setScalar(tipo === 'charco' ? 1.3 : 1.6);
      obj.rotation.y = Math.random() * Math.PI * 2;
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
    this.mugres.splice(i, 1);
    sonido.limpio();
  }

  mugreCerca(p: P, r: number) {
    return this.mugres.some((m) => m.tipo !== 'charco' && Math.hypot(m.pos.x - p.x, m.pos.y - p.y) < r);
  }
  charcoEn(p: P, r: number) {
    return this.mugres.find((m) => m.tipo === 'charco' && Math.hypot(m.pos.x - p.x, m.pos.y - p.y) < r) ?? null;
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

  cobrar(c: Cliente) {
    const r = c.pagar();
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
  }

  alReponer(v: Vitrina) {
    sonido.repuesto();
    this.eventos.push({ t: this.tiempo, tipo: 'repuesto', data: { id: v.dato.id } });
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
    this.eventos.push({ t: this.tiempo, tipo: 'pop', texto: '¡Corazón escondido!', pos: { ...this.corazon.pos }, data: { clase: 'corazon' } });
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

  private tarea(t: NuevaTarea, codigo: string): string {
    const j = this.jugador;
    if (j.tiene(t)) return j.cancelar(t) ? 'cancelada' : 'ya';
    return j.agregar(t) ? codigo : 'ya';
  }

  /** Toque en la pantalla: agrega (o cancela) la acción correspondiente en la fila de Él. */
  tocar(x: number, y: number): string | null {
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
      if (mejor.tipo === 'mugre') {
        const m = mejor.ref as Mugre;
        if (m.reservado === 'aseo') return 'aseo';
        return this.tarea({ tipo: 'mugre', mugre: m }, m.tipo);
      }
      if (mejor.tipo === 'canasta') return this.tarea({ tipo: 'canasta', canasta: mejor.ref as CanastaSuelta }, 'canasta');
      return this.tarea({ tipo: 'atrapar', objetivo: mejor.ref as Perseguible }, mejor.tipo);
    }
    // 2) Vitrinas y caja: por rayo
    const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.mundo.camara);
    const golpes = this.raycaster.intersectObjects(this.tienda.grupo.children, true);
    for (const g of golpes) {
      const v = this.tienda.porGrupo(g.object);
      if (!v) continue;
      if (!v.nivel) return null;
      if (v.seccion === 'caja') return this.cajera || v !== this.tienda.caja.vitrina ? 'cajera' : this.tarea({ tipo: 'caja' }, 'caja');
      if (v.stock < v.capacidad || this.jugador.vaAReponer(v)) return this.tarea({ tipo: 'reponer', vitrina: v }, 'reponer');
      return 'llena';
    }
    return null;
  }

  reponerSeccion(v: Vitrina) {
    return this.jugador.agregar({ tipo: 'reponer', vitrina: v });
  }

  update(dt: number) {
    if (this.terminado) return;
    this.tiempo += dt;
    if (!this.cerrado) {
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
    this.jugador.update(dt);
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
      case 'ventas': return s.ventas >= m;
      case 'propinas': return s.propinas >= m;
      case 'perdidos': return s.perdidos <= m;
      case 'espera_caja': return esperaProm <= m;
      case 'sin_vacias': return s.vaciaMax <= m;
      case 'limpieza': return s.basuraMax <= m;
      case 'robos': return s.robos === 0;
      case 'equipo': {
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
      case 'ventas': return `${s.ventas}/${m}`;
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
    const personas = [this.jugador.grupo, ...this.clientes.map((c) => c.grupo), ...this.ladrones.map((l) => l.grupo), ...this.ninas.map((n) => n.grupo),
      ...this.ayudantes.map((a) => a.grupo)];
    this.mundo.escena.remove(this.tienda.grupo, ...personas, ...this.mugres.map((b) => b.obj), ...this.canastasSueltas.map((c) => c.obj));
    liberarEsqueletos(...personas);
  }
}
