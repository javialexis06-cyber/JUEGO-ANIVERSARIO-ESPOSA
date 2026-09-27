// Un día de juego: reloj, llegada de clientes, estadísticas, basura, toques y las 3 estrellas.
import * as THREE from 'three';
import { Cliente, TipoCliente } from './cliente';
import { Jugador } from './jugador';
import { aTres, Mundo } from './mundo';
import { P } from './navegacion';
import { cargar, cargarAnimado, copia, Productos } from './recursos';
import { Tienda, TiendaDato, Vitrina } from './tienda';

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
}

export const textoDe = (t: Estrella['texto']) => (typeof t === 'string' ? t : t.solitario);
export const metaDe = (m: Estrella['meta']) => (typeof m === 'number' ? m : m.solitario);

export interface Stats {
  ventas: number;
  propinas: number;
  perdidos: number;
  atendidos: number;
  felices: number;
  esperas: number[];
  vaciaMax: number;
  basuraMax: number;
}

export interface Resultado {
  estrellas: boolean[];
  stats: Stats;
  ganancia: number;
}

export interface Basura {
  id: number;
  pos: P;
  tiempo: number;
  obj: THREE.Object3D;
}

const ESCALAS: Record<string, number> = { abuelita: 1, mama: 1, adolescente: 1 };

export class Juego {
  tienda!: Tienda;
  jugador!: Jugador;
  clientes: Cliente[] = [];
  fila: Cliente[] = [];
  basuras: Basura[] = [];
  tiempo = 0;
  terminado = false;
  stats: Stats = { ventas: 0, propinas: 0, perdidos: 0, atendidos: 0, felices: 0, esperas: [], vaciaMax: 0, basuraMax: 0 };
  problemas: string[] = [];
  eventos: { t: number; tipo: string; data?: any }[] = [];
  private llegadas: number[] = [];
  private creados = 0;
  private sigBasura = 1;
  private raycaster = new THREE.Raycaster();
  alTerminar: ((r: Resultado) => void) | null = null;
  velocidad = 1;

  constructor(public mundo: Mundo, public nivel: NivelDato, private productos: Productos, private tiendaDato: TiendaDato,
    private sitios: Record<number, number>, private escalas: Record<string, number>) {}

  async preparar() {
    this.tienda = new Tienda(this.tiendaDato, this.productos);
    await this.tienda.montar(this.sitios);
    this.mundo.escena.add(this.tienda.grupo);
    this.mundo.encuadrar(this.tiendaDato.W, this.tiendaDato.D);
    const esc = this.tiendaDato.escala_personas;
    this.jugador = new Jugador({ x: this.tienda.bodega.x - 1.2, y: this.tienda.bodega.y - 1.2 }, esc, this);
    await this.jugador.preparar(this.productos);
    this.mundo.escena.add(this.jugador.grupo);
    this.problemas = this.nivel.problemas;
    // Horario de llegadas: repartidas en el 80 % del día con algo de azar
    const n = this.nivel.clientes.solitario;
    const ventana = this.nivel.duracion_s * 0.8;
    for (let i = 0; i < n; i++) this.llegadas.push(4 + (ventana * (i + Math.random() * 0.8)) / n);
    // Precarga de clientes para que no se congele al entrar el primero
    for (const t of this.tiposDisponibles()) await cargarAnimado(`${t}.glb`);
    await cargar('basura.glb');
  }

  tiposDisponibles(): TipoCliente[] {
    const t: TipoCliente[] = ['abuelita', 'mama'];
    // El adolescente llega cuando aparece la basura (día 6 de la tiendita)
    if (this.nivel.problemas.includes('basura')) t.push('adolescente');
    return t;
  }

  /** Largo de la lista de compras: de 1 a `max` productos (juego/datos/generar_niveles.py usa la misma regla para las metas). */
  private tamanoLista(): number {
    const d = this.nivel.dia;
    const max = (d <= 1 ? 1 : d < 8 ? 2 : d < 20 ? 3 : 4) + (this.nivel.tienda - 1);
    return 1 + Math.floor(Math.random() * max);
  }

  private async nuevoCliente() {
    const tipos = this.tiposDisponibles();
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const e = this.tienda.entrada;
    const c = new Cliente(tipo, { x: e.x - 1.2, y: e.y }, this.tiendaDato.escala_personas * (this.escalas[tipo] ?? ESCALAS[tipo]),
      this.nivel.paciencia, this);
    const opciones = this.tienda.enVenta;
    const k = Math.min(this.tamanoLista(), opciones.length);
    const elegidas = [...opciones].sort(() => Math.random() - 0.5).slice(0, k);
    c.lista = elegidas.map((v) => ({ vitrina: v, producto: v.productos[Math.floor(Math.random() * v.productos.length)] }));
    await c.preparar();
    this.clientes.push(c);
    this.mundo.escena.add(c.grupo);
    c.empezar();
  }

  async nuevaBasura(pos: P) {
    const obj = copia(await cargar('basura.glb'));
    obj.position.copy(aTres(pos.x, pos.y));
    obj.scale.setScalar(1.6);
    const b: Basura = { id: this.sigBasura++, pos, tiempo: 0, obj };
    obj.traverse((o) => (o.userData = { ...o.userData, tipo: 'basura', id: b.id }));
    this.basuras.push(b);
    this.mundo.escena.add(obj);
  }

  recogerBasura(id: number) {
    const i = this.basuras.findIndex((b) => b.id === id);
    if (i < 0) return;
    this.mundo.escena.remove(this.basuras[i].obj);
    this.basuras.splice(i, 1);
  }

  cobrar(c: Cliente) {
    const r = c.pagar();
    this.stats.ventas += r.monto;
    this.stats.propinas += r.propina;
    this.stats.atendidos++;
    if (r.feliz) this.stats.felices++;
    this.stats.esperas.push(r.espera);
    this.eventos.push({ t: this.tiempo, tipo: 'cobro', data: { monto: r.monto, propina: r.propina } });
  }

  clientePerdido(c: Cliente) {
    this.stats.perdidos++;
    this.eventos.push({ t: this.tiempo, tipo: 'perdido', data: { id: c.id } });
  }

  alReponer(v: Vitrina) {
    this.eventos.push({ t: this.tiempo, tipo: 'repuesto', data: { id: v.dato.id } });
  }

  /** Toque en la pantalla: agrega la acción correspondiente a la fila de Él. */
  tocar(x: number, y: number): string | null {
    const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.mundo.camara);
    const golpes = this.raycaster.intersectObjects(this.mundo.escena.children, true);
    for (const g of golpes) {
      let o: THREE.Object3D | null = g.object;
      while (o && !o.userData?.tipo) o = o.parent;
      if (!o) continue;
      if (o.userData.tipo === 'basura') {
        const b = this.basuras.find((x) => x.id === o!.userData.id);
        if (b) return this.jugador.agregar({ tipo: 'basura', basura: b }) ? 'basura' : null;
      }
      if (o.userData.tipo === 'sitio') {
        const v = this.tienda.porGrupo(o);
        if (!v || !v.nivel) return null;
        if (v.seccion === 'caja') return this.jugador.agregar({ tipo: 'caja' }) ? 'caja' : null;
        if (v.stock < v.capacidad) return this.jugador.agregar({ tipo: 'reponer', vitrina: v }) ? 'reponer' : null;
        return 'llena';
      }
    }
    return null;
  }

  reponerSeccion(v: Vitrina) {
    return this.jugador.agregar({ tipo: 'reponer', vitrina: v });
  }

  update(dtReal: number) {
    if (this.terminado) return;
    const dt = Math.min(dtReal, 0.1) * this.velocidad;
    this.tiempo += dt;
    while (this.creados < this.llegadas.length && this.tiempo >= this.llegadas[this.creados]) {
      this.creados++;
      void this.nuevoCliente();
    }
    this.jugador.update(dt);
    for (const c of this.clientes) c.update(dt);
    for (const c of this.clientes.filter((c) => c.estado === 'fuera')) this.mundo.escena.remove(c.grupo);
    this.clientes = this.clientes.filter((c) => c.estado !== 'fuera');
    for (const v of this.tienda.enVenta) {
      if (v.stock === 0) {
        v.tiempoVacia += dt;
        this.stats.vaciaMax = Math.max(this.stats.vaciaMax, v.tiempoVacia);
      } else v.tiempoVacia = 0;
    }
    for (const b of this.basuras) {
      b.tiempo += dt;
      this.stats.basuraMax = Math.max(this.stats.basuraMax, b.tiempo);
    }
    const acabo = this.tiempo >= this.nivel.duracion_s && this.creados >= this.llegadas.length && this.clientes.length === 0;
    const forzado = this.tiempo >= this.nivel.duracion_s + 60;
    if (acabo || forzado) this.finalizar();
  }

  get restante() {
    return Math.max(0, this.nivel.duracion_s - this.tiempo);
  }

  /** ¿Se está cumpliendo el objetivo k? (para los íconos en vivo). */
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
      case 'robos': return true;
      case 'equipo': return final ? (s.atendidos ? (100 * s.felices) / (s.atendidos + s.perdidos) >= m : false) : true;
      case 'preparados': return false;
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
      case 'equipo': {
        const tot = s.atendidos + s.perdidos;
        return `${tot ? Math.round((100 * s.felices) / tot) : 100}/${m} %`;
      }
      default: return '';
    }
  }

  private finalizar() {
    this.terminado = true;
    const estrellas = this.nivel.estrellas.map((e) => this.cumple(e, true));
    this.alTerminar?.({ estrellas, stats: this.stats, ganancia: this.stats.ventas + this.stats.propinas });
  }

  destruir() {
    this.mundo.escena.remove(this.tienda.grupo, this.jugador.grupo, ...this.clientes.map((c) => c.grupo), ...this.basuras.map((b) => b.obj));
  }
}
