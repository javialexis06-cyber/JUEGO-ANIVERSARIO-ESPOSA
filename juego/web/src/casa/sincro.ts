// Sincronización de la pareja. Dos formas con la misma interfaz:
//  - «en línea» con Supabase: cada celular con su sesión anónima, datos compartidos y tiempo real;
//  - «local»: todo en este aparato (sirve sin internet y para probar con dos pestañas abiertas).
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from './servidor';
import {
  Casa, casaNueva, Evento, EstadoPersonaje, nuevoId, personajeNuevo, Recuerdo, Rol,
} from './modelo';

export type QueCambio = 'casa' | 'personaje' | 'recuerdos' | 'presencia';

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

/** Foto reducida (lado mayor 1280 px, JPEG) para que suba rápido y quepa en el celular. */
export async function reducirFoto(archivo: Blob, lado = 1280): Promise<Blob> {
  const bmp = await createImageBitmap(archivo);
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob((b) => ok(b!), 'image/jpeg', 0.82));
}
const aDataURL = (b: Blob) => new Promise<string>((ok) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.readAsDataURL(b);
});

class Base {
  personajes: Record<Rol, EstadoPersonaje> = { el: personajeNuevo(), ella: personajeNuevo() };
  casa: Casa = casaNueva();
  recuerdos: Recuerdo[] = [];
  eventos: Evento[] = [];
  enLinea: Record<Rol, boolean> = { el: false, ella: false };
  protected cambios: ((que: QueCambio, rol?: Rol) => void)[] = [];
  protected escuchas: ((e: Evento) => void)[] = [];
  alCambiar(cb: (que: QueCambio, rol?: Rol) => void) {
    this.cambios.push(cb);
  }
  alEvento(cb: (e: Evento) => void) {
    this.escuchas.push(cb);
  }
  protected avisar(que: QueCambio, rol?: Rol) {
    for (const cb of this.cambios) cb(que, rol);
  }
  protected recibido(e: Evento) {
    if (this.eventos.some((x) => x.id === e.id)) return;
    this.eventos = [e, ...this.eventos].slice(0, 40);
    for (const cb of this.escuchas) cb(e);
  }
}

// ---------------------------------------------------------------------------
// Local (un solo aparato; entre pestañas con BroadcastChannel)
// ---------------------------------------------------------------------------
const CLAVE_LOCAL = 'nuestro-hogar-local';
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

  constructor(public rol: Rol) {
    super();
    const d = leer<DatosLocales>(CLAVE_LOCAL);
    if (d) {
      this.casa = { ...casaNueva(), ...d.casa };
      this.personajes = d.personajes;
      this.recuerdos = d.recuerdos ?? [];
      this.eventos = d.eventos ?? [];
    }
    this.enLinea[rol] = true;
    try {
      this.canal = new BroadcastChannel('nuestro-hogar');
      this.canal.onmessage = (m) => this.mensaje(m.data);
      this.canal.postMessage({ tipo: 'hola', rol });
    } catch {
      this.canal = null;
    }
  }

  private mensaje(m: any) {
    if (m.tipo === 'hola' || m.tipo === 'aqui') {
      this.enLinea[m.rol as Rol] = true;
      if (m.tipo === 'hola') this.canal?.postMessage({ tipo: 'aqui', rol: this.rol });
      this.avisar('presencia');
    } else if (m.tipo === 'adios') {
      this.enLinea[m.rol as Rol] = false;
      this.avisar('presencia');
    } else if (m.tipo === 'datos') {
      const d = leer<DatosLocales>(CLAVE_LOCAL);
      if (!d) return;
      this.casa = { ...casaNueva(), ...d.casa };
      this.personajes = d.personajes;
      this.recuerdos = d.recuerdos ?? [];
      this.avisar(m.que, m.rolCambio);
    } else if (m.tipo === 'evento') {
      this.recibido(m.evento);
    }
  }

  /** Lee lo último guardado (la otra pestaña pudo cambiarlo), aplica solo este cambio y lo guarda. */
  private actualizar(que: QueCambio, cambio: (d: DatosLocales) => void, rol?: Rol) {
    const d: DatosLocales = leer<DatosLocales>(CLAVE_LOCAL) ?? {
      casa: this.casa, personajes: this.personajes, recuerdos: this.recuerdos, eventos: this.eventos,
    };
    d.casa = { ...casaNueva(), ...d.casa };
    d.personajes ??= this.personajes;
    d.recuerdos ??= [];
    d.eventos ??= [];
    cambio(d);
    d.eventos = d.eventos.slice(0, 40);
    if (!escribir(CLAVE_LOCAL, d)) throw new Error('No cabe más en este celular.');
    this.casa = d.casa;
    this.personajes = d.personajes;
    this.recuerdos = d.recuerdos;
    this.canal?.postMessage({ tipo: 'datos', que, rolCambio: rol });
    this.avisar(que, rol);
  }

  async cambiarCasa(fn: (c: Casa) => void) {
    this.actualizar('casa', (d) => fn(d.casa));
  }

  async guardarPersonaje(rol: Rol, e: EstadoPersonaje) {
    this.actualizar('personaje', (d) => (d.personajes[rol] = e), rol);
  }

  async enviar(tipo: Evento['tipo'], datos: Record<string, unknown> = {}) {
    const e: Evento = { id: nuevoId(), de: this.rol, tipo, datos, t: Date.now() };
    this.eventos = [e, ...this.eventos].slice(0, 40);
    this.actualizar('casa', (d) => (d.eventos = [e, ...d.eventos.filter((x) => x.id !== e.id)]));
    this.canal?.postMessage({ tipo: 'evento', evento: e });
  }

  async agregarRecuerdo(titulo: string, fecha: string, foto: Blob) {
    const r: Recuerdo = { id: nuevoId(), autor: this.rol, titulo, fecha, foto: await aDataURL(await reducirFoto(foto, 1024)), t: Date.now() };
    try {
      this.actualizar('recuerdos', (d) => (d.recuerdos = [r, ...d.recuerdos]));
    } catch {
      throw new Error('No cabe más en este celular. Conecten la casa en línea para guardar más fotos.');
    }
  }

  cerrar() {
    this.canal?.postMessage({ tipo: 'adios', rol: this.rol });
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

/** Configuración de Supabase: la del paquete (variables de compilación) o la escrita en Ajustes. */
export function configLinea(): ConfigLinea | null {
  // Lo escrito en Ajustes manda (sirve para cambiar de servidor sin otra APK)
  const propia = leer<ConfigLinea>(CLAVE_CONFIG);
  if (propia?.url && propia.clave) return propia;
  const url = SUPABASE_URL || ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '');
  const clave = SUPABASE_CLAVE_PUBLICA || ((import.meta.env.VITE_SUPABASE_KEY as string | undefined) ?? '');
  return url && clave ? { url, clave } : null;
}
export const guardarConfigLinea = (c: ConfigLinea | null) => (c ? escribir(CLAVE_CONFIG, c) : localStorage.removeItem(CLAVE_CONFIG));
export const sesionGuardada = () => leer<SesionLinea>(CLAVE_SESION);
export const olvidarSesion = () => {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    /* nada */
  }
};

async function cliente(cfg: ConfigLinea): Promise<SupabaseClient> {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(cfg.url, cfg.clave, { auth: { persistSession: true, autoRefreshToken: true } });
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    const { error } = await sb.auth.signInAnonymously();
    if (error) throw new Error(`No se pudo iniciar sesión: ${error.message}. ¿Están activadas las sesiones anónimas en Supabase?`);
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
    if (error) throw new Error(error.message);
    const fila = (data as { pareja: string; codigo: string }[])[0];
    const s = new SincroLinea(sb, { parejaId: fila.pareja, codigo: fila.codigo, rol });
    await s.iniciar(true);
    return s;
  }

  static async unirse(cfg: ConfigLinea, codigo: string, rol: Rol): Promise<SincroLinea> {
    const sb = await cliente(cfg);
    const { data, error } = await sb.rpc('unirse_pareja', { cod: codigo, mi_rol: rol });
    if (error) throw new Error(error.message.includes('no encontrado') ? 'Ese código no existe. Revísalo con tu pareja.' : error.message);
    const s = new SincroLinea(sb, { parejaId: data as string, codigo: codigo.trim().toUpperCase(), rol });
    await s.iniciar(false);
    return s;
  }

  static async reanudar(cfg: ConfigLinea, sesion: SesionLinea): Promise<SincroLinea> {
    const sb = await cliente(cfg);
    // Volver a unirse asegura la membresía si la sesión anónima cambió
    await sb.rpc('unirse_pareja', { cod: sesion.codigo, mi_rol: sesion.rol });
    const s = new SincroLinea(sb, sesion);
    await s.iniciar(false);
    return s;
  }

  private get id() {
    return this.sesion.parejaId;
  }

  private async iniciar(nueva: boolean) {
    escribir(CLAVE_SESION, this.sesion);
    const [p, per, ev, rec] = await Promise.all([
      this.sb.from('parejas').select('casa, version, codigo').eq('id', this.id).single(),
      this.sb.from('personajes').select('rol, estado').eq('pareja_id', this.id),
      this.sb.from('eventos').select('*').eq('pareja_id', this.id).order('creado', { ascending: false }).limit(40),
      this.sb.from('recuerdos').select('*').eq('pareja_id', this.id).order('creado', { ascending: false }),
    ]);
    if (p.error) throw new Error(p.error.message);
    this.casa = { ...casaNueva(), ...(p.data.casa as Casa) };
    this.version = p.data.version;
    if (nueva || !Object.keys(p.data.casa ?? {}).length) await this.cambiarCasa(() => {});
    for (const f of per.data ?? []) this.personajes[f.rol as Rol] = f.estado as EstadoPersonaje;
    for (const r of ['el', 'ella'] as Rol[]) if (!(per.data ?? []).some((f) => f.rol === r) && r === this.rol) await this.guardarPersonaje(r, personajeNuevo());
    this.eventos = (ev.data ?? []).map((f) => ({ id: String(f.id), de: f.de, tipo: f.tipo, datos: f.datos, t: Date.parse(f.creado) }));
    this.recuerdos = await this.conFotos(rec.data ?? []);
    this.suscribir();
  }

  private async conFotos(filas: any[]): Promise<Recuerdo[]> {
    const rutas = filas.map((f) => f.foto).filter(Boolean);
    const urls: Record<string, string> = {};
    if (rutas.length) {
      const { data } = await this.sb.storage.from('recuerdos').createSignedUrls(rutas, 60 * 60 * 24 * 7);
      for (const d of data ?? []) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
    }
    return filas.map((f) => ({ id: String(f.id), autor: f.autor, titulo: f.titulo, fecha: f.fecha ?? '', foto: urls[f.foto] ?? '', t: Date.parse(f.creado) }));
  }

  private suscribir() {
    const filtro = `pareja_id=eq.${this.id}`;
    this.canal = this.sb
      .channel(`pareja-${this.id}`, { config: { presence: { key: this.rol } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parejas', filter: `id=eq.${this.id}` }, (m: any) => {
        if (m.new?.version > this.version) {
          this.casa = { ...casaNueva(), ...m.new.casa };
          this.version = m.new.version;
          this.avisar('casa');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personajes', filter: filtro }, (m: any) => {
        if (!m.new?.rol) return;
        this.personajes[m.new.rol as Rol] = m.new.estado;
        this.avisar('personaje', m.new.rol);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos', filter: filtro }, (m: any) => {
        const f = m.new;
        if (f.de === this.rol) return;
        this.recibido({ id: String(f.id), de: f.de, tipo: f.tipo, datos: f.datos, t: Date.parse(f.creado) });
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
      if (error) throw new Error(error.message);
      if ((data as number) >= 0) {
        this.casa = copia;
        this.version = data as number;
        this.avisar('casa');
        return;
      }
      // Choque: el otro cambió la casa al mismo tiempo; se lee de nuevo y se vuelve a aplicar
      const { data: p } = await this.sb.from('parejas').select('casa, version').eq('id', this.id).single();
      if (p) {
        this.casa = { ...casaNueva(), ...(p.casa as Casa) };
        this.version = p.version;
      }
    }
    throw new Error('No se pudo guardar la casa. Revisa la conexión.');
  }

  async guardarPersonaje(rol: Rol, e: EstadoPersonaje) {
    this.personajes[rol] = e;
    this.avisar('personaje', rol);
    const { error } = await this.sb.from('personajes').upsert({ pareja_id: this.id, rol, estado: e, actualizado: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }

  async enviar(tipo: Evento['tipo'], datos: Record<string, unknown> = {}) {
    const { data, error } = await this.sb.from('eventos').insert({ pareja_id: this.id, de: this.rol, tipo, datos }).select().single();
    if (error) throw new Error(error.message);
    this.eventos = [{ id: String(data.id), de: this.rol, tipo, datos, t: Date.parse(data.creado) }, ...this.eventos].slice(0, 40);
  }

  async agregarRecuerdo(titulo: string, fecha: string, foto: Blob) {
    const ruta = `${this.id}/${nuevoId()}.jpg`;
    const { error: e1 } = await this.sb.storage.from('recuerdos').upload(ruta, await reducirFoto(foto), { contentType: 'image/jpeg' });
    if (e1) throw new Error(e1.message);
    const { data, error } = await this.sb.from('recuerdos').insert({ pareja_id: this.id, autor: this.rol, titulo, fecha: fecha || null, foto: ruta })
      .select().single();
    if (error) throw new Error(error.message);
    const [r] = await this.conFotos([data]);
    if (!this.recuerdos.some((x) => x.id === r.id)) this.recuerdos = [r, ...this.recuerdos];
    this.avisar('recuerdos');
  }

  cerrar() {
    if (this.canal) void this.sb.removeChannel(this.canal);
  }
}

export const nuevaSesionLocal = (rol: Rol) => new SincroLocal(rol);
export { leer, escribir };
