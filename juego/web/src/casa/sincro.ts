// Sincronización de la pareja. Dos formas con la misma interfaz:
//  - «en línea» con Supabase: cada celular con su sesión anónima, datos compartidos y tiempo real;
//  - «local»: todo en este aparato (sirve sin internet y para probar con dos pestañas abiertas).
// Cada personaje lo escribe solo su dueño: los mimos viajan como eventos y los aplica quien los recibe
// (así un abrazo nunca pisa lo que el otro estaba haciendo en ese momento).
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from './servidor';
import {
  Casa, casaNueva, Evento, EstadoPersonaje, normalizarCasa, normalizarEvento, normalizarPersonaje, nuevoId, personajeNuevo, Recuerdo,
  Rol,
} from './modelo';

export type QueCambio = 'casa' | 'personaje' | 'recuerdos' | 'presencia' | 'eventos';

export interface Sincro {
  modo: 'local' | 'linea';
  rol: Rol;
  codigo: string;
  casa: Casa;
  personajes: Record<Rol, EstadoPersonaje>;
  recuerdos: Recuerdo[];
  eventos: Evento[];
  enLinea: Record<Rol, boolean>;
  alCambiar(cb: (que: QueCambio, rol?: Rol) => void): void;
  alEvento(cb: (e: Evento) => void): void;
  cambiarCasa(fn: (c: Casa) => void): Promise<void>;
  guardarPersonaje(rol: Rol, e: EstadoPersonaje): Promise<void>;
  enviar(tipo: Evento['tipo'], datos?: Record<string, unknown>): Promise<void>;
  /** Marca como recibidos los eventos que este celular ya aplicó. */
  marcarVistos(ids: string[]): Promise<void>;
  /** Vuelve a leer todo (al volver a la app: lo que pasó mientras estaba en segundo plano). */
  refrescar(): Promise<void>;
  agregarRecuerdo(titulo: string, fecha: string, foto: Blob): Promise<void>;
  cerrar(): void;
}

const leer = <T,>(k: string): T | null => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};
const escribir = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};

/** Foto reducida (lado mayor `lado` px, JPEG) para que suba rápido y quepa en el celular. */
export async function reducirFoto(archivo: Blob, lado = 1280, calidad = 0.82): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(archivo);
  } catch {
    throw new Error('Ese archivo no es una foto que se pueda abrir.');
  }
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo preparar la foto.'))), 'image/jpeg', calidad));
}
const aDataURL = (b: Blob) =>
  new Promise<string>((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => mal(new Error('No se pudo leer la foto.'));
    r.readAsDataURL(b);
  });

const personajesNormales = (p: unknown): Record<Rol, EstadoPersonaje> => {
  const o = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
  return { el: normalizarPersonaje(o.el), ella: normalizarPersonaje(o.ella) };
};
const eventosNormales = (l: unknown): Evento[] => (Array.isArray(l) ? l.map(normalizarEvento).filter((e): e is Evento => !!e) : []);

class Base {
  personajes: Record<Rol, EstadoPersonaje> = { el: personajeNuevo(), ella: personajeNuevo() };
  casa: Casa = casaNueva();
  recuerdos: Recuerdo[] = [];
  eventos: Evento[] = [];
  enLinea: Record<Rol, boolean> = { el: false, ella: false };
  protected cambios: ((que: QueCambio, rol?: Rol) => void)[] = [];
  protected escuchas: ((e: Evento) => void)[] = [];
  /** Eventos que ya se entregaron a la app (para no repetir una coreografía). */
  protected despachados = new Set<string>();
  alCambiar(cb: (que: QueCambio, rol?: Rol) => void) {
    this.cambios.push(cb);
  }
  alEvento(cb: (e: Evento) => void) {
    this.escuchas.push(cb);
  }
  protected avisar(que: QueCambio, rol?: Rol) {
    for (const cb of this.cambios) {
      try {
        cb(que, rol);
      } catch (e) {
        console.error(e);
      }
    }
  }
  protected recibido(e: Evento) {
    if (this.despachados.has(e.id)) return;
    this.despachados.add(e.id);
    if (!this.eventos.some((x) => x.id === e.id)) this.eventos = [e, ...this.eventos].slice(0, 40);
    for (const cb of this.escuchas) {
      try {
        cb(e);
      } catch (err) {
        console.error(err);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Local (un solo aparato; entre pestañas con BroadcastChannel)
// ---------------------------------------------------------------------------
const CLAVE_LOCAL = 'nuestro-hogar-local';
/** Fotos que caben en el celular sin internet (el almacenamiento del navegador es pequeño). */
export const MAX_FOTOS_LOCAL = 20;
interface DatosLocales {
  casa: Casa;
  personajes: Record<Rol, EstadoPersonaje>;
  recuerdos: Recuerdo[];
  eventos: Evento[];
}

export class SincroLocal extends Base implements Sincro {
  modo = 'local' as const;
  codigo = 'LOCAL';
  private canal: BroadcastChannel | null = null;
  private alSalir = () => this.canal?.postMessage({ tipo: 'adios', rol: this.rol });

  constructor(public rol: Rol) {
    super();
    const d = this.leerDatos();
    if (d) this.tomar(d);
    for (const e of this.eventos) this.despachados.add(e.id);
    this.enLinea[rol] = true;
    try {
      this.canal = new BroadcastChannel('nuestro-hogar');
      this.canal.onmessage = (m) => this.mensaje(m.data);
      this.canal.postMessage({ tipo: 'hola', rol });
      addEventListener('pagehide', this.alSalir);
    } catch {
      this.canal = null;
    }
  }

  private leerDatos(): DatosLocales | null {
    const d = leer<Partial<DatosLocales>>(CLAVE_LOCAL);
    if (!d || typeof d !== 'object') return null;
    return {
      casa: normalizarCasa(d.casa),
      personajes: personajesNormales(d.personajes),
      recuerdos: Array.isArray(d.recuerdos) ? d.recuerdos.filter((r) => r && typeof r.foto === 'string') : [],
      eventos: eventosNormales(d.eventos),
    };
  }

  private tomar(d: DatosLocales) {
    this.casa = d.casa;
    this.personajes = d.personajes;
    this.recuerdos = d.recuerdos;
    this.eventos = d.eventos;
  }

  private mensaje(m: any) {
    if (!m || typeof m !== 'object') return;
    if ((m.tipo === 'hola' || m.tipo === 'aqui') && (m.rol === 'el' || m.rol === 'ella')) {
      this.enLinea[m.rol as Rol] = true;
      if (m.tipo === 'hola') this.canal?.postMessage({ tipo: 'aqui', rol: this.rol });
      this.avisar('presencia');
    } else if (m.tipo === 'adios' && (m.rol === 'el' || m.rol === 'ella') && m.rol !== this.rol) {
      this.enLinea[m.rol as Rol] = false;
      this.avisar('presencia');
    } else if (m.tipo === 'datos') {
      const d = this.leerDatos();
      if (!d) return;
      this.tomar(d);
      this.avisar(m.que, m.rolCambio);
    } else if (m.tipo === 'evento') {
      const e = normalizarEvento(m.evento);
      if (e && e.de !== this.rol) this.recibido(e);
    }
  }

  /** Lee lo último guardado (la otra pestaña pudo cambiarlo), aplica solo este cambio y lo guarda. */
  private actualizar(que: QueCambio, cambio: (d: DatosLocales) => void, rol?: Rol) {
    const d: DatosLocales = this.leerDatos() ?? { casa: this.casa, personajes: this.personajes, recuerdos: this.recuerdos, eventos: this.eventos };
    cambio(d);
    d.eventos = d.eventos.slice(0, 40);
    if (!escribir(CLAVE_LOCAL, d)) throw new Error('No cabe más en este celular.');
    this.tomar(d);
    this.canal?.postMessage({ tipo: 'datos', que, rolCambio: rol });
    this.avisar(que, rol);
  }

  async cambiarCasa(fn: (c: Casa) => void) {
    this.actualizar('casa', (d) => fn(d.casa));
  }

  async guardarPersonaje(rol: Rol, e: EstadoPersonaje) {
    this.actualizar('personaje', (d) => (d.personajes[rol] = normalizarPersonaje(e)), rol);
  }

  async enviar(tipo: Evento['tipo'], datos: Record<string, unknown> = {}) {
    const e: Evento = { id: nuevoId(), de: this.rol, tipo, datos, t: Date.now(), visto: false };
    this.despachados.add(e.id);
    this.actualizar('eventos', (d) => (d.eventos = [e, ...d.eventos.filter((x) => x.id !== e.id)]));
    this.canal?.postMessage({ tipo: 'evento', evento: e });
  }

  async marcarVistos(ids: string[]) {
    if (!ids.length) return;
    this.actualizar('eventos', (d) => {
      for (const e of d.eventos) if (ids.includes(e.id)) e.visto = true;
    });
  }

  async refrescar() {
    const d = this.leerDatos();
    if (!d) return;
    this.tomar(d);
    this.avisar('casa');
    this.avisar('personaje');
  }

  async agregarRecuerdo(titulo: string, fecha: string, foto: Blob) {
    if (this.recuerdos.length >= MAX_FOTOS_LOCAL) {
      throw new Error(`Sin internet caben ${MAX_FOTOS_LOCAL} fotos. Conecten la casa en línea para guardar más.`);
    }
    const r: Recuerdo = { id: nuevoId(), autor: this.rol, titulo, fecha, foto: await aDataURL(await reducirFoto(foto, 900, 0.74)), t: Date.now() };
    try {
      this.actualizar('recuerdos', (d) => (d.recuerdos = [r, ...d.recuerdos]));
    } catch {
      throw new Error('No cabe más en este celular. Conecten la casa en línea para guardar más fotos.');
    }
  }

  cerrar() {
    this.alSalir();
    removeEventListener('pagehide', this.alSalir);
    this.canal?.close();
  }
}

// ---------------------------------------------------------------------------
// En línea (Supabase)
// ---------------------------------------------------------------------------
export interface ConfigLinea {
  url: string;
  clave: string;
}
export interface SesionLinea {
  parejaId: string;
  codigo: string;
  rol: Rol;
}
const CLAVE_SESION = 'nuestro-hogar-sesion';
const CLAVE_CONFIG = 'nuestro-hogar-supabase';

/** Configuración de Supabase: la escrita en Ajustes, la del código (servidor.ts) o la de compilación. */
export function configLinea(): ConfigLinea | null {
  // Lo escrito en Ajustes manda (sirve para cambiar de servidor sin otra APK)
  const propia = leer<ConfigLinea>(CLAVE_CONFIG);
  if (propia && typeof propia.url === 'string' && typeof propia.clave === 'string' && propia.url && propia.clave) return propia;
  const url = SUPABASE_URL || ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '');
  const clave = SUPABASE_CLAVE_PUBLICA || ((import.meta.env.VITE_SUPABASE_KEY as string | undefined) ?? '');
  return url && clave ? { url, clave } : null;
}
export const guardarConfigLinea = (c: ConfigLinea | null) => {
  try {
    if (c) localStorage.setItem(CLAVE_CONFIG, JSON.stringify(c));
    else localStorage.removeItem(CLAVE_CONFIG);
  } catch {
    /* sin almacenamiento */
  }
};
export const sesionGuardada = (): SesionLinea | null => {
  const s = leer<SesionLinea>(CLAVE_SESION);
  return s && typeof s.parejaId === 'string' && typeof s.codigo === 'string' && (s.rol === 'el' || s.rol === 'ella') ? s : null;
};
export const olvidarSesion = () => {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    /* nada */
  }
};

/** El personaje ya lo tiene otro celular: la app pregunta antes de quedarse con él. */
export class PersonajeOcupado extends Error {
  constructor() {
    super('Ese personaje ya está en otro celular.');
  }
}

/** Mensajes del servidor en palabras de la casa. */
function mensaje(error: { message?: string } | null | undefined, porDefecto: string) {
  const m = error?.message ?? '';
  if (/failed to fetch|network|fetch/i.test(m)) return 'Sin conexión con el servidor. Revisa el internet.';
  if (/no encontrado/i.test(m)) return 'Ese código no existe. Revísalo con tu pareja.';
  if (/anonymous/i.test(m)) return 'Faltan activar las sesiones anónimas en Supabase (Authentication → Sign In / Providers).';
  if (/does not exist|could not find the function/i.test(m)) return 'Falta correr supabase/esquema.sql en el SQL Editor de Supabase.';
  return m || porDefecto;
}

async function cliente(cfg: ConfigLinea): Promise<SupabaseClient> {
  // En las pruebas automáticas se usa un servidor de mentiras con las mismas reglas (scripts/probar-linea.mjs)
  const deMentiras = (globalThis as { __crearSupabase?: typeof import('@supabase/supabase-js').createClient }).__crearSupabase;
  const createClient = deMentiras ?? (await import('@supabase/supabase-js')).createClient;
  const sb = createClient(cfg.url, cfg.clave, { auth: { persistSession: true, autoRefreshToken: true } });
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    const { error } = await sb.auth.signInAnonymously();
    if (error) throw new Error(`No se pudo iniciar sesión: ${mensaje(error, 'error desconocido')}`);
  }
  return sb;
}

export class SincroLinea extends Base implements Sincro {
  modo = 'linea' as const;
  private version = 0;
  private canal: RealtimeChannel | null = null;

  private constructor(private sb: SupabaseClient, private sesion: SesionLinea) {
    super();
  }
  get rol() {
    return this.sesion.rol;
  }
  get codigo() {
    return this.sesion.codigo;
  }

  static async crear(cfg: ConfigLinea, rol: Rol): Promise<SincroLinea> {
    const sb = await cliente(cfg);
    const { data, error } = await sb.rpc('crear_pareja', { mi_rol: rol });
    if (error) throw new Error(mensaje(error, 'No se pudo crear la casa.'));
    const fila = (data as { pareja: string; codigo: string }[] | null)?.[0];
    if (!fila) throw new Error('El servidor no devolvió la casa nueva.');
    const s = new SincroLinea(sb, { parejaId: fila.pareja, codigo: fila.codigo, rol });
    await s.iniciar(true);
    return s;
  }

  static async unirse(cfg: ConfigLinea, codigo: string, rol: Rol, reemplazar = false): Promise<SincroLinea> {
    const sb = await cliente(cfg);
    const cod = codigo.trim().toUpperCase();
    const { data, error } = await sb.rpc('unirse_pareja', { cod, mi_rol: rol, reemplazar });
    if (error && /ocupado/i.test(error.message)) throw new PersonajeOcupado();
    if (error) throw new Error(mensaje(error, 'No se pudo entrar con ese código.'));
    const s = new SincroLinea(sb, { parejaId: data as string, codigo: cod, rol });
    await s.iniciar(false);
    return s;
  }

  static async reanudar(cfg: ConfigLinea, sesion: SesionLinea): Promise<SincroLinea> {
    const sb = await cliente(cfg);
    // Volver a unirse asegura la membresía si la sesión anónima cambió (reinstalación, datos borrados)
    // (es el mismo celular que ya estaba en la casa: si su sesión cambió, se queda con su personaje)
    const { error } = await sb.rpc('unirse_pareja', { cod: sesion.codigo, mi_rol: sesion.rol, reemplazar: true });
    if (error) throw new Error(mensaje(error, 'No se pudo volver a entrar a la casa.'));
    const s = new SincroLinea(sb, sesion);
    await s.iniciar(false);
    return s;
  }

  private get id() {
    return this.sesion.parejaId;
  }

  private async leerTodo() {
    const [p, per, ev, rec] = await Promise.all([
      this.sb.from('parejas').select('casa, version, codigo').eq('id', this.id).single(),
      this.sb.from('personajes').select('rol, estado').eq('pareja_id', this.id),
      this.sb.from('eventos').select('*').eq('pareja_id', this.id).order('creado', { ascending: false }).limit(40),
      this.sb.from('recuerdos').select('*').eq('pareja_id', this.id).order('creado', { ascending: false }),
    ]);
    if (p.error) throw new Error(mensaje(p.error, 'No se pudo leer la casa.'));
    this.casa = normalizarCasa(p.data.casa);
    this.version = Number(p.data.version) || 0;
    for (const f of per.data ?? []) if (f.rol === 'el' || f.rol === 'ella') this.personajes[f.rol as Rol] = normalizarPersonaje(f.estado);
    if (!ev.error) {
      const vistosAqui = new Set(this.eventos.filter((e) => e.visto).map((e) => e.id));
      this.eventos = eventosNormales(ev.data).map((e) => (vistosAqui.has(e.id) ? { ...e, visto: true } : e));
    }
    if (!rec.error) this.recuerdos = await this.conFotos(rec.data ?? []);
    return { casaVacia: !p.data.casa || !Object.keys(p.data.casa).length, sinPersonaje: !(per.data ?? []).some((f) => f.rol === this.rol) };
  }

  private async iniciar(nueva: boolean) {
    escribir(CLAVE_SESION, this.sesion);
    const { casaVacia, sinPersonaje } = await this.leerTodo();
    // Lo que ya había no se vuelve a presentar como si acabara de llegar
    for (const e of this.eventos) this.despachados.add(e.id);
    if (nueva || casaVacia) await this.cambiarCasa(() => {});
    if (sinPersonaje) await this.guardarPersonaje(this.rol, personajeNuevo());
    this.suscribir();
  }

  async refrescar() {
    await this.leerTodo();
    for (const e of this.eventos) this.despachados.add(e.id);
    this.avisar('casa');
    this.avisar('personaje');
    this.avisar('recuerdos');
  }

  private async conFotos(filas: any[]): Promise<Recuerdo[]> {
    const rutas = filas.map((f) => f.foto).filter((x) => typeof x === 'string' && x);
    const urls: Record<string, string> = {};
    if (rutas.length) {
      const { data } = await this.sb.storage.from('recuerdos').createSignedUrls(rutas, 60 * 60 * 24 * 7);
      for (const d of data ?? []) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
    }
    return filas.map((f) => ({
      id: String(f.id), autor: f.autor === 'ella' ? 'ella' : 'el', titulo: String(f.titulo ?? ''), fecha: f.fecha ?? '', foto: urls[f.foto] ?? '',
      t: Date.parse(f.creado) || Date.now(),
    }));
  }

  private suscribir() {
    const filtro = `pareja_id=eq.${this.id}`;
    this.canal = this.sb
      .channel(`pareja-${this.id}`, { config: { presence: { key: this.rol } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parejas', filter: `id=eq.${this.id}` }, (m: any) => {
        if (Number(m.new?.version) > this.version) {
          this.casa = normalizarCasa(m.new.casa);
          this.version = Number(m.new.version);
          this.avisar('casa');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personajes', filter: filtro }, (m: any) => {
        const rol = m.new?.rol;
        if (rol !== 'el' && rol !== 'ella') return;
        const nuevo = normalizarPersonaje(m.new.estado);
        // Un eco atrasado de un guardado anterior no debe deshacer el último (llegan en orden, pero el propio va adelante)
        if (nuevo.t < this.personajes[rol as Rol].t) return;
        this.personajes[rol as Rol] = nuevo;
        this.avisar('personaje', rol);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos', filter: filtro }, (m: any) => {
        const e = normalizarEvento(m.new);
        if (!e || e.de === this.rol) return;
        this.recibido(e);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'recuerdos', filter: filtro }, async (m: any) => {
        const [r] = await this.conFotos([m.new]);
        if (!this.recuerdos.some((x) => x.id === r.id)) this.recuerdos = [r, ...this.recuerdos];
        this.avisar('recuerdos');
      })
      .on('presence', { event: 'sync' }, () => {
        const estado = this.canal!.presenceState();
        this.enLinea = { el: !!estado.el?.length, ella: !!estado.ella?.length };
        this.avisar('presencia');
      })
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') void this.canal!.track({ rol: this.rol, t: Date.now() });
      });
  }

  async cambiarCasa(fn: (c: Casa) => void) {
    for (let intento = 0; intento < 6; intento++) {
      const copia: Casa = JSON.parse(JSON.stringify(this.casa));
      fn(copia);
      const { data, error } = await this.sb.rpc('guardar_casa', { p: this.id, nueva: copia, version_leida: this.version });
      if (error) throw new Error(mensaje(error, 'No se pudo guardar la casa.'));
      if (Number(data) >= 0) {
        this.casa = copia;
        this.version = Number(data);
        this.avisar('casa');
        return;
      }
      // Choque: el otro cambió la casa al mismo tiempo; se lee de nuevo y se vuelve a aplicar
      const { data: p, error: e2 } = await this.sb.from('parejas').select('casa, version').eq('id', this.id).single();
      if (e2) throw new Error(mensaje(e2, 'No se pudo guardar la casa.'));
      if (p) {
        this.casa = normalizarCasa(p.casa);
        this.version = Number(p.version) || 0;
      }
    }
    throw new Error('No se pudo guardar la casa. Revisa la conexión.');
  }

  async guardarPersonaje(rol: Rol, e: EstadoPersonaje) {
    const n = normalizarPersonaje(e);
    this.personajes[rol] = n;
    this.avisar('personaje', rol);
    const { error } = await this.sb.from('personajes').upsert({ pareja_id: this.id, rol, estado: n, actualizado: new Date().toISOString() });
    if (error) throw new Error(mensaje(error, 'No se pudo guardar.'));
  }

  async enviar(tipo: Evento['tipo'], datos: Record<string, unknown> = {}) {
    const { data, error } = await this.sb.from('eventos').insert({ pareja_id: this.id, de: this.rol, tipo, datos }).select().single();
    if (error) throw new Error(mensaje(error, 'No se pudo enviar.'));
    const e = normalizarEvento(data);
    if (e) {
      this.despachados.add(e.id);
      this.eventos = [e, ...this.eventos.filter((x) => x.id !== e.id)].slice(0, 40);
    }
  }

  async marcarVistos(ids: string[]) {
    if (!ids.length) return;
    for (const e of this.eventos) if (ids.includes(e.id)) e.visto = true;
    const numeros = ids.map(Number).filter(Number.isFinite);
    if (!numeros.length) return;
    const { error } = await this.sb.from('eventos').update({ visto: true }).in('id', numeros);
    if (error) throw new Error(mensaje(error, 'No se pudo marcar como visto.'));
  }

  async agregarRecuerdo(titulo: string, fecha: string, foto: Blob) {
    const ruta = `${this.id}/${nuevoId()}.jpg`;
    const { error: e1 } = await this.sb.storage.from('recuerdos').upload(ruta, await reducirFoto(foto), { contentType: 'image/jpeg' });
    if (e1) throw new Error(mensaje(e1, 'No se pudo subir la foto.'));
    const { data, error } = await this.sb.from('recuerdos').insert({ pareja_id: this.id, autor: this.rol, titulo, fecha: fecha || null, foto: ruta })
      .select().single();
    if (error) throw new Error(mensaje(error, 'No se pudo guardar el recuerdo.'));
    const [r] = await this.conFotos([data]);
    if (!this.recuerdos.some((x) => x.id === r.id)) this.recuerdos = [r, ...this.recuerdos];
    this.avisar('recuerdos');
  }

  cerrar() {
    if (this.canal) void this.sb.removeChannel(this.canal);
  }
}

export { leer, escribir };
