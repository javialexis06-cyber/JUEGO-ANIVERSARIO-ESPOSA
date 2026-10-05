// Salas de juego de hasta 4 (Javier, Laura y amigos), cada uno en su celular o computador, conectados con un código
// corto. Implementa el contrato de `tipos.ts` (cómo se usa: docs/salas.md).
//
// Por debajo es un canal de Supabase Realtime (`sala-<CÓDIGO>`, difusión + presencia) con la clave publicable y sin
// sesión de la casa: los amigos no tienen casa y nada de esto toca los datos de la pareja. Para las pruebas hay un
// modo local entre pestañas (`?salas=local`, BroadcastChannel; `&red=mala` pierde y demora mensajes) y el mismo
// Supabase de mentiras de las otras pruebas (`globalThis.__crearSupabase`).
//
// Encima del canal:
// - El anfitrión (puesto 0, quien creó la sala) es el dueño de la lista: recibe las entradas, reparte los puestos,
//   rechaza al quinto («la sala está llena») y a quien llega con la partida empezada, y manda la lista cuando cambia.
// - Mensajes fiables numerados por destinatario, con confirmación acumulada y reenvío (llegan una vez y en orden);
//   los `rapido` van sin garantía (las fotos del anfitrión, el joystick).
// - Latido cada segundo: si alguien no se oye en 3,5 s (o avisa que se fue a segundo plano) sale `alCorte`; si no
//   vuelve en un minuto, se da por ido. Si el que se va es el anfitrión, la sala se acaba (`alFin`).
import * as fondo from '../segundo_plano';
import { NOMBRE_ROL } from '../casa/modelo';
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from '../casa/servidor';
import { aspectoDe, idAparato, limpiarNombre, perfilAmigo } from './perfil';
import { normalizarDetalles } from './prendas';
import type { ApiSalas, JugadorSala, OpcionesSala, Sala } from './tipos';

/** Letras y números que no se confunden al dictarlos (sin I, L, O, 0 ni 1). */
export const LETRAS_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LARGO_CODIGO = 5;
/** Color de cada puesto (anillos, nombres, flechas): rosa, azul, mostaza, menta. */
export const COLOR_PUESTO = ['#ff7aa8', '#4fb3ff', '#ffc24d', '#6fd39a'];

const CORTE_MS = 3500;
/** Sin oírlo tanto tiempo, se da por ido (un celular que perdió la señal un rato todavía alcanza a volver). */
const IDO_MS = 60_000;
const LATIDO_MS = 1000;
const REENVIO_MS = 450;

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const MODO_LOCAL = params.get('salas') === 'local';
let local = MODO_LOCAL;
/**
 * Salas entre pestañas del mismo navegador (sin internet): la casa local de prueba de Javier y Laura las usa. Con
 * `?salas=local` en la dirección quedan así siempre.
 */
export function usarSalasLocales(si: boolean) {
  local = si || MODO_LOCAL;
}
const RED_MALA = params.get('red') === 'mala';

export function codigoNuevo(): string {
  const b = crypto.getRandomValues(new Uint8Array(LARGO_CODIGO));
  return Array.from(b, (x) => LETRAS_CODIGO[x % LETRAS_CODIGO.length]).join('');
}

/** Lo que alguien escribió → un código válido (mayúsculas, sin espacios; la O se lee como 0 no existe: se quita). */
export function normalizarCodigo(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').split('').filter((c) => LETRAS_CODIGO.includes(c)).join('').slice(0, LARGO_CODIGO);
}

// ---------------------------------------------------------------------------------------------------- Quién soy
function rolDeLaCasa(): 'el' | 'ella' | null {
  const r = params.get('rol');
  if (r === 'el' || r === 'ella') return r;
  for (const k of ['nuestro-hogar-sesion', 'nuestro-hogar-modo']) {
    try {
      const v = JSON.parse(localStorage.getItem(k) ?? 'null') as { rol?: string } | null;
      if (v?.rol === 'el' || v?.rol === 'ella') return v.rol;
    } catch {
      /* nada */
    }
  }
  return null;
}

export function yoMismo(): JugadorSala {
  const amigo = perfilAmigo();
  if (amigo?.activo) return { id: amigo.id, nombre: amigo.nombre, tipo: 'amigo', aspecto: aspectoDe(amigo), puesto: 0 };
  const rol = rolDeLaCasa() ?? 'el';
  return { id: `${rol}-${idAparato()}`, nombre: NOMBRE_ROL[rol], tipo: rol, aspecto: { cuerpo: rol }, puesto: 0 };
}

/**
 * Un jugador que llegó por la red, limpio: nombre corto sin etiquetas, tipo y cuerpo conocidos, colores de verdad y
 * solo prendas que existen (lo que manda un aparato ajeno se pinta en HTML, en SVG y carga modelos).
 */
export function jugadorSeguro(j: JugadorSala): JugadorSala {
  const a = (j?.aspecto ?? {}) as Partial<JugadorSala['aspecto']>;
  const cuerpo = a.cuerpo === 'ella' ? 'ella' : 'el';
  const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : undefined);
  const tipo = j?.tipo === 'el' || j?.tipo === 'ella' ? j.tipo : 'amigo';
  return {
    ...j,
    id: String(j?.id ?? '').slice(0, 40),
    nombre: limpiarNombre(String(j?.nombre ?? '')) || 'Amigo',
    tipo,
    aspecto: { cuerpo, ...(hex(a.piel) ? { piel: hex(a.piel) } : {}), ...(hex(a.pelo) ? { pelo: hex(a.pelo) } : {}), detalles: normalizarDetalles(a.detalles, cuerpo) },
    puesto: Number.isInteger(j?.puesto) ? j.puesto : -1,
  };
}

// ---------------------------------------------------------------------------------------------------- Lo que viaja
type Cable =
  | { k: 'r'; de: string; s: string; t: string; d: unknown; a?: string }
  | { k: 'f'; de: string; s: string; t: string; d: unknown; n: Record<string, number> }
  | { k: 'ok'; de: string; s: string; para: string; ps: string; hasta: number }
  | { k: 'entrar'; de: string; s: string; j: JugadorSala; juego: string }
  | { k: 'lista'; de: string; s: string; v: number; js: JugadorSala[]; dv: Record<string, number>; cerrada: boolean; max: number; juego: string }
  | { k: 'no'; de: string; s: string; para: string; motivo: 'llena' | 'cerrada' | 'juego'; juego?: string }
  | { k: 'l'; de: string; s: string; fondo?: boolean }
  | { k: 'adios'; de: string; s: string };

interface Transporte {
  conectar(): Promise<void>;
  enviar(m: Cable): void;
  alRecibir: (m: Cable) => void;
  /** Ids que están en el canal ahora (presencia). */
  presentes(): string[];
  cerrar(): void;
}

/** Entre pestañas del mismo navegador (pruebas y la casa local de prueba). */
class TransporteLocal implements Transporte {
  alRecibir: (m: Cable) => void = () => undefined;
  private bc: BroadcastChannel;
  private vistos = new Map<string, number>();
  private latido = 0;
  constructor(nombre: string, private yo: string) {
    this.bc = new BroadcastChannel(`salas-${nombre}`);
  }
  async conectar() {
    this.bc.onmessage = (e) => {
      const m = e.data as Cable | { k: 'pres'; de: string };
      this.vistos.set(m.de, Date.now());
      if (m.k === 'pres') return;
      if (RED_MALA) {
        if (Math.random() < 0.08) return;
        setTimeout(() => this.alRecibir(m), 20 + Math.random() * 260);
        return;
      }
      this.alRecibir(m);
    };
    const pres = () => this.bc.postMessage({ k: 'pres', de: this.yo });
    pres();
    this.latido = window.setInterval(pres, 1000);
    await new Promise((r) => setTimeout(r, 60));
  }
  enviar(m: Cable) {
    try {
      this.bc.postMessage(m);
    } catch {
      /* cerrado */
    }
  }
  presentes() {
    const ahora = Date.now();
    return [...this.vistos].filter(([, t]) => ahora - t < 3500).map(([id]) => id);
  }
  cerrar() {
    clearInterval(this.latido);
    this.bc.close();
  }
}

type ClienteSb = import('@supabase/supabase-js').SupabaseClient;
type CanalSb = import('@supabase/supabase-js').RealtimeChannel;
let clienteSb: Promise<ClienteSb> | null = null;

/** Un cliente aparte del de la casa: sin sesión guardada, solo la clave publicable. */
function cliente(): Promise<ClienteSb> {
  clienteSb ??= (async () => {
    let url = SUPABASE_URL, clave = SUPABASE_CLAVE_PUBLICA;
    try {
      const propia = JSON.parse(localStorage.getItem('nuestro-hogar-supabase') ?? 'null') as { url?: string; clave?: string } | null;
      if (propia?.url && propia.clave) ({ url, clave } = propia as { url: string; clave: string });
    } catch {
      /* la de siempre */
    }
    const deMentiras = (globalThis as { __crearSupabase?: typeof import('@supabase/supabase-js').createClient }).__crearSupabase;
    const crear = deMentiras ?? (await import('@supabase/supabase-js')).createClient;
    return crear(url, clave, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'salas-sin-sesion' } });
  })();
  clienteSb.catch(() => (clienteSb = null));
  return clienteSb;
}

class TransporteSupabase implements Transporte {
  alRecibir: (m: Cable) => void = () => undefined;
  private canal: CanalSb | null = null;
  constructor(private nombre: string, private yo: string) {}
  async conectar() {
    const sb = await cliente();
    await new Promise<void>((ok, mal) => {
      let hecho = false;
      const fin = (e?: Error) => {
        if (hecho) return;
        hecho = true;
        if (e) mal(e);
        else ok();
      };
      this.canal = sb
        .channel(`sala-${this.nombre}`, { config: { broadcast: { self: false, ack: false }, presence: { key: this.yo } } })
        .on('broadcast', { event: 'm' }, ({ payload }) => this.alRecibir(payload as Cable))
        .subscribe((estado) => {
          if (estado === 'SUBSCRIBED') {
            void this.canal?.track({ id: this.yo, t: Date.now() });
            fin();
          } else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') fin(new Error('No hay conexión con el servidor de las salas. Revisa el internet.'));
        });
      setTimeout(() => fin(new Error('El servidor de las salas no responde. Revisa el internet e intenta otra vez.')), 12000);
    });
  }
  enviar(m: Cable) {
    void this.canal?.send({ type: 'broadcast', event: 'm', payload: m }).catch(() => undefined);
  }
  presentes() {
    try {
      return Object.keys(this.canal?.presenceState() ?? {});
    } catch {
      return [];
    }
  }
  cerrar() {
    const c = this.canal;
    this.canal = null;
    void (c as unknown as { untrack?: () => Promise<unknown> } | null)?.untrack?.()?.catch(() => undefined);
    void c?.unsubscribe();
  }
}

const transporte = (codigo: string, yo: string): Transporte => (local ? new TransporteLocal(codigo, yo) : new TransporteSupabase(codigo, yo));

// ---------------------------------------------------------------------------------------------------- La sala
interface Pendiente {
  /** El mismo mensaje a varios lleva la misma marca (para reenviarlo en una sola difusión). */
  u: number;
  n: number;
  t: string;
  d: unknown;
  enviado: number;
}
interface Entrada {
  esperado: number;
  guardados: Map<number, { t: string; d: unknown }>;
}

type Manejador = (datos: unknown, de: JugadorSala) => void;

class SalaReal implements Sala {
  readonly codigo: string;
  readonly juego: string;
  yo: JugadorSala;
  max: number;
  cerrada = false;
  private lista: JugadorSala[] = [];
  private v = 0;
  /** Versión de los datos de cada jugador (los más nuevos ganan). */
  private dv = new Map<string, number>();
  private readonly s = Math.random().toString(36).slice(2, 10);
  private t: Transporte;
  private manejadores = new Map<string, Set<Manejador>>();
  private cambios = new Set<(j: JugadorSala[]) => void>();
  private cortes = new Set<(cortado: boolean, quien: JugadorSala) => void>();
  private fines = new Set<(motivo: 'anfitrion' | 'fuera' | 'error', texto: string) => void>();
  /** Lo último que se oyó de cada uno, su sesión y si avisó que se fue al fondo. */
  private oido = new Map<string, number>();
  private sesiones = new Map<string, string>();
  private enFondo = new Set<string>();
  private cortados = new Set<string>();
  private sig = new Map<string, number>();
  private pend = new Map<string, Pendiente[]>();
  private entradas = new Map<string, Entrada>();
  private okPend = new Map<string, number>();
  private tOk = 0;
  private marca = 0;
  private ultimoEnvio = 0;
  private reloj = 0;
  private acabada = false;
  private quitarFondo: (() => void)[] = [];
  /** Para unirse: lo que contesta el anfitrión. */
  alEntrar: ((r: { ok: true } | { ok: false; motivo: 'llena' | 'cerrada' | 'juego'; juego?: string }) => void) | null = null;

  constructor(codigo: string, juego: string, yo: JugadorSala, max: number, anfitrion: boolean) {
    this.codigo = codigo;
    this.juego = juego;
    this.yo = { ...yo, puesto: anfitrion ? 0 : -1 };
    this.max = Math.max(2, Math.min(4, max));
    this.t = transporte(codigo, yo.id);
    this.t.alRecibir = (m) => this.recibir(m);
    if (anfitrion) {
      this.lista = [this.yo];
      this.v = 1;
    }
  }

  async conectar() {
    await this.t.conectar();
    this.reloj = window.setInterval(() => this.revisar(), 250);
    this.quitarFondo.push(
      fondo.alPausar(() => this.cable({ k: 'l', de: this.yo.id, s: this.s, fondo: true })),
      fondo.alReanudar(() => {
        // (mientras estuve afuera no oí a nadie: no es culpa de ellos, se les da otro rato)
        const ahora = performance.now();
        for (const j of this.lista) this.oido.set(j.id, ahora);
        this.cable({ k: 'l', de: this.yo.id, s: this.s });
        this.reenviar(true);
      }),
    );
    addEventListener('pagehide', this.alCerrarPagina);
  }

  private alCerrarPagina = () => this.cable({ k: 'adios', de: this.yo.id, s: this.s });

  // ------------------------------------------------------------------ Lo de afuera
  get jugadores(): JugadorSala[] {
    return [...this.lista].sort((a, b) => a.puesto - b.puesto);
  }
  get soyAnfitrion() {
    return this.yo.puesto === 0;
  }
  get hayAmigos() {
    return this.lista.some((j) => j.tipo === 'amigo') || this.yo.tipo === 'amigo';
  }
  conectado(id: string) {
    return id === this.yo.id || (!this.cortados.has(id) && this.lista.some((j) => j.id === id));
  }

  mandar(tipo: string, datos: unknown, o: { a?: string; rapido?: boolean } = {}) {
    if (this.acabada) return;
    if (o.rapido) {
      this.cable({ k: 'r', de: this.yo.id, s: this.s, t: tipo, d: datos, ...(o.a ? { a: o.a } : {}) });
      return;
    }
    const destinos = o.a ? [o.a] : this.lista.filter((j) => j.id !== this.yo.id).map((j) => j.id);
    if (!destinos.length) return;
    const n: Record<string, number> = {};
    const ahora = performance.now();
    const u = ++this.marca;
    for (const id of destinos) {
      const k = this.sig.get(id) ?? 1;
      this.sig.set(id, k + 1);
      n[id] = k;
      const l = this.pend.get(id) ?? [];
      l.push({ u, n: k, t: tipo, d: datos, enviado: ahora });
      // (si alguien no contesta en mucho rato, no se le guarda todo para siempre)
      if (l.length > 400) l.splice(0, l.length - 400);
      this.pend.set(id, l);
    }
    this.cable({ k: 'f', de: this.yo.id, s: this.s, t: tipo, d: datos, n });
  }

  al(tipo: string, fn: Manejador) {
    const l = this.manejadores.get(tipo) ?? new Set();
    l.add(fn);
    this.manejadores.set(tipo, l);
    return () => void l.delete(fn);
  }
  alCambiar(fn: (j: JugadorSala[]) => void) {
    this.cambios.add(fn);
    return () => void this.cambios.delete(fn);
  }
  alCorte(fn: (cortado: boolean, quien: JugadorSala) => void) {
    this.cortes.add(fn);
    return () => void this.cortes.delete(fn);
  }
  alFin(fn: (motivo: 'anfitrion' | 'fuera' | 'error', texto: string) => void) {
    this.fines.add(fn);
    return () => void this.fines.delete(fn);
  }

  ponerDatos(datos: Record<string, unknown>) {
    this.yo = { ...this.yo, datos: { ...(this.yo.datos ?? {}), ...datos } };
    const v = (this.dv.get(this.yo.id) ?? 0) + 1;
    this.dv.set(this.yo.id, v);
    this.lista = this.lista.map((j) => (j.id === this.yo.id ? { ...j, datos: this.yo.datos } : j));
    this.mandar('_d', { d: this.yo.datos, v });
    if (this.soyAnfitrion) this.publicarLista();
    this.avisarCambio();
  }

  cerrarEntrada(cerrada: boolean) {
    if (!this.soyAnfitrion || this.cerrada === cerrada) return;
    this.cerrada = cerrada;
    this.publicarLista();
  }

  salir() {
    if (this.acabada) return;
    // (el adiós va tres veces: si la red se come uno, los demás no se quedan esperando un minuto)
    const adios = () => this.t.enviar({ k: 'adios', de: this.yo.id, s: this.s });
    adios();
    setTimeout(adios, 150);
    setTimeout(adios, 400);
    this.terminar();
  }

  // ------------------------------------------------------------------ Por dentro
  private cable(m: Cable) {
    this.ultimoEnvio = performance.now();
    this.t.enviar(m);
  }

  private avisarCambio() {
    const j = this.jugadores;
    for (const fn of [...this.cambios]) {
      try {
        fn(j);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private quien(id: string): JugadorSala {
    return this.lista.find((j) => j.id === id) ?? { id, nombre: '¿?', tipo: 'amigo', aspecto: { cuerpo: 'el' }, puesto: -1 };
  }

  private publicarLista() {
    if (!this.soyAnfitrion) return;
    this.v++;
    const dv: Record<string, number> = {};
    for (const j of this.lista) dv[j.id] = this.dv.get(j.id) ?? 0;
    this.cable({ k: 'lista', de: this.yo.id, s: this.s, v: this.v, js: this.lista, dv, cerrada: this.cerrada, max: this.max, juego: this.juego });
  }

  private recibir(m: Cable) {
    if (this.acabada || !m || m.de === this.yo.id) return;
    // Alguien volvió con otra sesión (recargó): se empieza de cero con él
    const antes = this.sesiones.get(m.de);
    if (antes !== m.s) {
      this.sesiones.set(m.de, m.s);
      if (antes !== undefined) {
        this.sig.delete(m.de);
        this.pend.delete(m.de);
      }
    }
    this.oido.set(m.de, performance.now());
    if (m.k !== 'l' || !m.fondo) this.enFondo.delete(m.de);
    if (this.cortados.has(m.de) && !this.enFondo.has(m.de)) {
      this.cortados.delete(m.de);
      this.avisarCorte(false, m.de);
    }
    switch (m.k) {
      case 'r':
        if (!m.a || m.a === this.yo.id) this.entregar(m.t, m.d, m.de);
        break;
      case 'f':
        this.fiable(m);
        break;
      case 'ok':
        if (m.para === this.yo.id && m.ps === this.s) {
          const l = this.pend.get(m.de);
          if (l) this.pend.set(m.de, l.filter((p) => p.n > m.hasta));
        }
        break;
      case 'l':
        if (m.fondo) {
          this.enFondo.add(m.de);
          if (!this.cortados.has(m.de) && this.lista.some((j) => j.id === m.de)) {
            this.cortados.add(m.de);
            this.avisarCorte(true, m.de);
          }
        }
        break;
      case 'adios':
        this.seFue(m.de, 'adios');
        break;
      case 'entrar':
        this.pideEntrar(m);
        break;
      case 'lista':
        this.llegaLista(m);
        break;
      case 'no':
        if (m.para === this.yo.id) this.alEntrar?.({ ok: false, motivo: m.motivo, juego: m.juego });
        break;
    }
  }

  private fiable(m: Extract<Cable, { k: 'f' }>) {
    const n = m.n[this.yo.id];
    if (n === undefined) return;
    const clave = `${m.de}/${m.s}`;
    let e = this.entradas.get(clave);
    if (!e) {
      e = { esperado: 1, guardados: new Map() };
      this.entradas.set(clave, e);
    }
    if (n >= e.esperado && !e.guardados.has(n) && e.guardados.size < 600) e.guardados.set(n, { t: m.t, d: m.d });
    while (e.guardados.has(e.esperado)) {
      const x = e.guardados.get(e.esperado)!;
      e.guardados.delete(e.esperado);
      e.esperado++;
      this.entregar(x.t, x.d, m.de);
    }
    this.okPend.set(clave, e.esperado - 1);
  }

  private entregar(tipo: string, d: unknown, de: string) {
    if (tipo === '_d') {
      const x = d as { d: Record<string, unknown>; v: number };
      if ((this.dv.get(de) ?? 0) >= x.v) return;
      this.dv.set(de, x.v);
      this.lista = this.lista.map((j) => (j.id === de ? { ...j, datos: x.d } : j));
      if (this.soyAnfitrion) this.publicarLista();
      this.avisarCambio();
      return;
    }
    const l = this.manejadores.get(tipo);
    if (!l?.size) return;
    const quien = this.quien(de);
    for (const fn of [...l]) {
      try {
        fn(d, quien);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private pideEntrar(m: Extract<Cable, { k: 'entrar' }>) {
    if (!this.soyAnfitrion) return;
    m = { ...m, j: { ...jugadorSeguro(m.j), id: m.de } };
    const no = (motivo: 'llena' | 'cerrada' | 'juego') => this.cable({ k: 'no', de: this.yo.id, s: this.s, para: m.de, motivo, juego: this.juego });
    if (m.juego !== this.juego) return no('juego');
    const ya = this.lista.find((j) => j.id === m.de);
    if (ya) {
      // Volvió (se le había cortado o recargó): mismo puesto
      this.lista = this.lista.map((j) => (j.id === m.de ? { ...m.j, puesto: ya.puesto, datos: m.j.datos ?? ya.datos } : j));
      this.publicarLista();
      this.avisarCambio();
      return;
    }
    if (this.cerrada) return no('cerrada');
    if (this.lista.length >= this.max) return no('llena');
    const ocupados = new Set(this.lista.map((j) => j.puesto));
    let puesto = 1;
    while (ocupados.has(puesto)) puesto++;
    this.lista = [...this.lista, { ...m.j, puesto }];
    this.dv.set(m.de, 0);
    this.publicarLista();
    this.avisarCambio();
  }

  private llegaLista(m: Extract<Cable, { k: 'lista' }>) {
    if (this.soyAnfitrion || m.v <= this.v) return;
    m = { ...m, js: (Array.isArray(m.js) ? m.js : []).map((j) => (j.id === this.yo.id ? j : jugadorSeguro(j))) };
    const anfitrion = m.js.find((j) => j.puesto === 0);
    if (!anfitrion || anfitrion.id !== m.de) return;
    this.v = m.v;
    this.cerrada = m.cerrada;
    this.max = m.max;
    const mio = m.js.find((j) => j.id === this.yo.id);
    if (!mio) {
      // Todavía no me ha aceptado (o me sacó)
      if (this.yo.puesto >= 0) {
        this.lista = m.js;
        this.fin('fuera', 'Te quedaste por fuera de la sala.');
      }
      return;
    }
    // Los datos más nuevos de cada uno ganan (la lista pudo salir antes de que el anfitrión los recibiera)
    this.lista = m.js.map((j) => {
      const viejo = this.lista.find((x) => x.id === j.id);
      if (j.id === this.yo.id) return { ...j, datos: this.yo.datos };
      if (viejo && (this.dv.get(j.id) ?? 0) > (m.dv[j.id] ?? 0)) return { ...j, datos: viejo.datos };
      this.dv.set(j.id, Math.max(this.dv.get(j.id) ?? 0, m.dv[j.id] ?? 0));
      return j;
    });
    const nuevo = this.yo.puesto < 0;
    this.yo = { ...this.yo, puesto: mio.puesto };
    for (const j of this.lista) if (!this.oido.has(j.id)) this.oido.set(j.id, performance.now());
    if (nuevo) this.alEntrar?.({ ok: true });
    // (el anfitrión repite la lista de vez en cuando: si no cambió nada, no se molesta a nadie)
    const clave = JSON.stringify([this.lista, this.cerrada]);
    if (clave === this.claveLista && !nuevo) return;
    this.claveLista = clave;
    this.avisarCambio();
  }

  private seFue(id: string, por: 'adios' | 'corte') {
    const j = this.lista.find((x) => x.id === id);
    this.pend.delete(id);
    if (!j) return;
    if (j.puesto === 0 && !this.soyAnfitrion) {
      this.fin('anfitrion', por === 'adios' ? `${j.nombre} cerró la sala.` : `Se perdió la conexión con ${j.nombre}, que tenía la sala.`);
      return;
    }
    if (this.soyAnfitrion) {
      this.lista = this.lista.filter((x) => x.id !== id);
      this.cortados.delete(id);
      this.publicarLista();
      this.avisarCambio();
    }
  }

  /** Cada cuarto de segundo: cortes, latido, confirmaciones y reenvíos. */
  private revisar() {
    if (this.acabada) return;
    const ahora = performance.now();
    if (fondo.enPausa()) return;
    for (const j of this.lista) {
      if (j.id === this.yo.id) continue;
      const oido = this.oido.get(j.id) ?? ahora;
      if (!this.oido.has(j.id)) this.oido.set(j.id, ahora);
      const sin = ahora - oido;
      if ((sin > CORTE_MS || this.enFondo.has(j.id)) && !this.cortados.has(j.id)) {
        this.cortados.add(j.id);
        this.avisarCorte(true, j.id);
      }
      // (si avisó que se fue al fondo, se le espera más: contestar un mensaje no es irse)
      if (sin > (this.enFondo.has(j.id) ? IDO_MS * 4 : IDO_MS)) this.seFue(j.id, 'corte');
    }
    if (ahora - this.ultimoEnvio > LATIDO_MS) this.cable({ k: 'l', de: this.yo.id, s: this.s });
    // El anfitrión repite la lista de vez en cuando (por si alguien se perdió la última)
    if (this.soyAnfitrion && ahora - this.tLista > 2500 && this.lista.length > 1) {
      this.tLista = ahora;
      this.publicarLista();
    }
    if (ahora - this.tOk > 80 && this.okPend.size) {
      this.tOk = ahora;
      for (const [clave, hasta] of this.okPend) {
        const [de, ps] = clave.split('/');
        this.cable({ k: 'ok', de: this.yo.id, s: this.s, para: de, ps, hasta });
      }
      this.okPend.clear();
    }
    this.reenviar(false);
  }
  private tLista = 0;
  private claveLista = '';

  /** Lo que no han confirmado se vuelve a mandar (juntando destinatarios del mismo mensaje). */
  private reenviar(ya: boolean) {
    const ahora = performance.now();
    const presentes = new Set(this.lista.map((j) => j.id));
    const grupos = new Map<number, { t: string; d: unknown; n: Record<string, number> }>();
    for (const [id, l] of this.pend) {
      if (!presentes.has(id)) {
        this.pend.delete(id);
        continue;
      }
      if (this.cortados.has(id) && !ya) continue;
      let k = 0;
      for (const p of l) {
        if (!ya && ahora - p.enviado < REENVIO_MS) continue;
        if (k++ >= 12) break;
        p.enviado = ahora;
        // (el mismo mensaje a varios: una sola difusión con el número de cada uno)
        const g = grupos.get(p.u);
        if (g) g.n[id] = p.n;
        else grupos.set(p.u, { t: p.t, d: p.d, n: { [id]: p.n } });
      }
    }
    for (const g of grupos.values()) this.cable({ k: 'f', de: this.yo.id, s: this.s, t: g.t, d: g.d, n: g.n });
  }

  private avisarCorte(cortado: boolean, id: string) {
    const q = this.quien(id);
    for (const fn of [...this.cortes]) {
      try {
        fn(cortado, q);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private fin(motivo: 'anfitrion' | 'fuera' | 'error', texto: string) {
    if (this.acabada) return;
    this.terminar();
    if (!this.fines.size) {
      avisoSuelto(texto);
      return;
    }
    for (const fn of [...this.fines]) {
      try {
        fn(motivo, texto);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private terminar() {
    this.acabada = true;
    clearInterval(this.reloj);
    for (const q of this.quitarFondo) q();
    this.quitarFondo = [];
    removeEventListener('pagehide', this.alCerrarPagina);
    // (un respiro para que alcance a salir el «adiós»)
    setTimeout(() => this.t.cerrar(), 700);
  }

  /** Para unirse: le pide la entrada al anfitrión (se repite hasta que conteste). */
  pedirEntrar() {
    this.cable({ k: 'entrar', de: this.yo.id, s: this.s, j: this.yo, juego: this.juego });
  }

  /** Para crear: ¿ya hay alguien usando este código? */
  ocupado() {
    return this.t.presentes().some((id) => id !== this.yo.id);
  }
}

/** Si nadie maneja el final de la sala, un aviso sencillo (estilo de la casa). */
function avisoSuelto(texto: string) {
  if (typeof document === 'undefined') return;
  const d = document.createElement('div');
  d.className = 'sala-aviso-suelto';
  d.textContent = texto;
  Object.assign(d.style, {
    position: 'fixed', left: '50%', top: '16px', transform: 'translateX(-50%)', zIndex: '99', padding: '10px 18px', borderRadius: '14px',
    background: 'rgba(40,24,30,.88)', color: '#fff', font: '700 14px system-ui, sans-serif', boxShadow: '0 6px 20px rgba(0,0,0,.3)',
  } as Partial<CSSStyleDeclaration>);
  document.body.append(d);
  setTimeout(() => d.remove(), 4200);
}

function yoCon(o?: OpcionesSala['yo']): JugadorSala {
  const base = yoMismo();
  return { ...base, ...(o ?? {}), aspecto: { ...base.aspecto, ...(o?.aspecto ?? {}) }, puesto: 0 };
}

export async function crearSala(o: OpcionesSala): Promise<Sala> {
  const yo = yoCon(o.yo);
  for (let intento = 0; intento < 5; intento++) {
    const s = new SalaReal(codigoNuevo(), o.juego, yo, o.max ?? 4, true);
    await s.conectar();
    // Un momentico para ver si el código ya lo está usando alguien (casi nunca pasa)
    await new Promise((r) => setTimeout(r, local ? 1200 : 900));
    if (!s.ocupado()) return s;
    s.salir();
  }
  throw new Error('No se pudo abrir una sala ahora. Intenta otra vez.');
}

export async function unirseSala(codigo: string, juego: string, yo?: OpcionesSala['yo']): Promise<Sala> {
  const cod = normalizarCodigo(codigo);
  if (cod.length !== LARGO_CODIGO) throw new Error(`El código tiene ${LARGO_CODIGO} letras y números (sin I, L, O, 0 ni 1).`);
  const s = new SalaReal(cod, juego, yoCon(yo), 4, false);
  await s.conectar();
  const r = await new Promise<{ ok: true } | { ok: false; motivo: 'llena' | 'cerrada' | 'juego' } | null>((ok) => {
    let repetir = 0;
    const listo = (x: { ok: true } | { ok: false; motivo: 'llena' | 'cerrada' | 'juego' } | null) => {
      clearInterval(repetir);
      clearTimeout(limite);
      ok(x);
    };
    s.alEntrar = listo;
    s.pedirEntrar();
    repetir = window.setInterval(() => s.pedirEntrar(), 800);
    const limite = setTimeout(() => listo(null), 12000);
  });
  s.alEntrar = null;
  if (r?.ok) return s;
  s.salir();
  if (!r) throw new Error('No encontramos esa sala. Revisa el código (y que quien la creó siga adentro).');
  throw new Error(r.motivo === 'llena' ? 'La sala está llena (ya son 4).' : r.motivo === 'cerrada' ? 'Esa partida ya empezó: espera a que vuelvan a la sala.' : 'Ese código es de otro juego.');
}

export const salas: ApiSalas = { crearSala, unirseSala, yoMismo };

/**
 * ¿De qué juego es esta sala? (para «Unirme con un código» de la sala de juegos de amigos, que no sabe a qué juego
 * va). Pregunta sin entrar: el anfitrión contesta con el nombre del juego. null si no la encuentra.
 */
export async function averiguarJuego(codigo: string): Promise<string | null> {
  const cod = normalizarCodigo(codigo);
  if (cod.length !== LARGO_CODIGO) return null;
  const s = new SalaReal(cod, '¿?', yoCon(), 4, false);
  await s.conectar();
  const r = await new Promise<string | null>((ok) => {
    let repetir = 0;
    const listo = (x: string | null) => {
      clearInterval(repetir);
      clearTimeout(limite);
      ok(x);
    };
    s.alEntrar = (x) => listo(!x.ok && x.juego ? x.juego : null);
    s.pedirEntrar();
    repetir = window.setInterval(() => s.pedirEntrar(), 800);
    const limite = setTimeout(() => listo(null), 10000);
  });
  s.alEntrar = null;
  s.salir();
  return r;
}
