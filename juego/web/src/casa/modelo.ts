// Nuestro Hogar: datos de la pareja y reglas de las necesidades (se calculan con el reloj real).
export type Rol = 'el' | 'ella';
export type Cuarto = 'sala' | 'cocina' | 'bano' | 'cuarto';
export type Necesidad = 'hambre' | 'energia' | 'higiene' | 'carino';

export const NECESIDADES: Necesidad[] = ['hambre', 'energia', 'higiene', 'carino'];
export const NOMBRE_NECESIDAD: Record<Necesidad, string> = { hambre: 'Comida', energia: 'Energía', higiene: 'Higiene', carino: 'Cariño' };
export const CUARTOS: Cuarto[] = ['sala', 'cocina', 'bano', 'cuarto'];
export const NOMBRE_CUARTO: Record<Cuarto, string> = { sala: 'Sala', cocina: 'Cocina', bano: 'Baño', cuarto: 'Cuarto' };
export const NOMBRE_ROL: Record<Rol, string> = { el: 'Él', ella: 'Ella' };
export const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');

/** Puntos que se pierden por hora (despierto). Dormido: la energía sube y la comida baja a la mitad. */
export const DESGASTE: Record<Necesidad, number> = { hambre: 8, energia: 6, higiene: 4, carino: 5 };
export const RECUPERA_DURMIENDO = 16; // energía por hora

/** Lo que se ve haciendo al personaje (también en el celular del otro). */
export type Accion = 'comer' | 'banar' | 'lavar' | 'sofa' | 'tv' | 'nevera' | 'closet' | 'saludo' | 'pensar';

export interface Actividad {
  tipo: 'nada' | 'dormir';
  desde: number;
  /** Animación corta en curso (comer, bañarse, ver tele...) hasta `hasta`. */
  accion?: Accion;
  hasta?: number;
  /** Comida o regalo que tiene en la mano. */
  item?: string;
}

/** Estado de un personaje tal como se guarda (valores en el instante `t`). */
export interface EstadoPersonaje {
  hambre: number;
  energia: number;
  higiene: number;
  carino: number;
  t: number;
  cuarto: Cuarto;
  actividad: Actividad;
  /** Última vez que abrió la app (para el «en línea» y el bono diario). */
  visto: number;
  bonoDia?: string;
}

export function personajeNuevo(ahora = Date.now()): EstadoPersonaje {
  return { hambre: 80, energia: 90, higiene: 85, carino: 70, t: ahora, cuarto: 'sala', actividad: { tipo: 'nada', desde: ahora }, visto: ahora };
}

const limitar = (v: number) => Math.max(0, Math.min(100, v));
const numero = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const esObjeto = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Estado de un personaje confiable aunque venga dañado o incompleto (almacenamiento viejo, otra versión, servidor). */
export function normalizarPersonaje(e: unknown, ahora = Date.now()): EstadoPersonaje {
  const base = personajeNuevo(ahora);
  if (!esObjeto(e)) return base;
  const t = numero(e.t, ahora);
  const r: EstadoPersonaje = {
    hambre: limitar(numero(e.hambre, base.hambre)),
    energia: limitar(numero(e.energia, base.energia)),
    higiene: limitar(numero(e.higiene, base.higiene)),
    carino: limitar(numero(e.carino, base.carino)),
    t,
    cuarto: (CUARTOS as string[]).includes(e.cuarto) ? e.cuarto : 'sala',
    actividad: { tipo: 'nada', desde: t },
    visto: numero(e.visto, t),
  };
  if (typeof e.bonoDia === 'string') r.bonoDia = e.bonoDia;
  const a = e.actividad;
  if (esObjeto(a) && (a.tipo === 'nada' || a.tipo === 'dormir')) {
    r.actividad = { tipo: a.tipo, desde: numero(a.desde, t) };
    if (typeof a.accion === 'string') r.actividad.accion = a.accion as Accion;
    if (typeof a.hasta === 'number' && Number.isFinite(a.hasta)) r.actividad.hasta = a.hasta;
    if (typeof a.item === 'string') r.actividad.item = a.item;
  }
  return r;
}

/** Color seguro para una nota (solo #rrggbb). */
export const colorSeguro = (c: unknown, d = '#FFE58A') => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : d);

/** Valores de ahora, aplicando el desgaste desde la última vez que se guardaron. */
export function alDia(e: EstadoPersonaje, ahora = Date.now()): EstadoPersonaje {
  const horas = Math.max(0, (ahora - e.t) / 3600000);
  const dormido = e.actividad.tipo === 'dormir';
  return {
    ...e,
    hambre: limitar(e.hambre - DESGASTE.hambre * horas * (dormido ? 0.5 : 1)),
    energia: limitar(dormido ? e.energia + RECUPERA_DURMIENDO * horas : e.energia - DESGASTE.energia * horas),
    higiene: limitar(e.higiene - DESGASTE.higiene * horas * (dormido ? 0.5 : 1)),
    carino: limitar(e.carino - DESGASTE.carino * horas),
    t: ahora,
  };
}

export function sumar(e: EstadoPersonaje, cambios: Partial<Record<Necesidad, number>>, ahora = Date.now()): EstadoPersonaje {
  const a = alDia(e, ahora);
  for (const [k, v] of Object.entries(cambios) as [Necesidad, number][]) a[k] = limitar(a[k] + v);
  return a;
}

/** El ánimo que se ve en la cara: lo decide la necesidad más baja. */
export function animo(e: EstadoPersonaje): 'feliz' | 'normal' | 'triste' {
  const min = Math.min(e.hambre, e.energia, e.higiene, e.carino);
  return min >= 60 ? 'feliz' : min >= 30 ? 'normal' : 'triste';
}

export interface Nota {
  id: string;
  de: Rol;
  texto: string;
  color: string;
  t: number;
}

export interface FechaEspecial {
  id: string;
  nombre: string;
  /** AAAA-MM-DD. Si `cadaAno`, se celebra cada año en ese día y mes. */
  fecha: string;
  cadaAno: boolean;
}

export interface RegaloRecibido {
  id: string;
  item: string;
  de: Rol;
  para: Rol;
  mensaje: string;
  t: number;
  abierto: boolean;
}

/** La casa compartida (una sola para los dos). */
export interface Casa {
  monedas: number;
  inventario: Record<string, number>;
  /** sitio de decoración → objeto puesto (o `foto:<id>` para un cuadro con una foto del álbum). */
  deco: Record<string, string>;
  notas: Nota[];
  fechas: FechaEspecial[];
  regalos: RegaloRecibido[];
  aniversario: string;
  /** Registro de caricias, abrazos y besos del día (para los premios de cariño). */
  diario: Record<string, number>;
}

export function casaNueva(): Casa {
  return {
    monedas: 120,
    inventario: { pan: 2, manzana: 2, galletas: 1 },
    deco: {},
    notas: [],
    fechas: [],
    regalos: [],
    aniversario: '',
    diario: {},
  };
}

/** La casa compartida siempre con la forma esperada (y sin valores imposibles como monedas negativas). */
export function normalizarCasa(c: unknown): Casa {
  const base = casaNueva();
  if (!esObjeto(c)) return base;
  const cantidades = (o: unknown) => {
    const r: Record<string, number> = {};
    if (esObjeto(o)) for (const [k, v] of Object.entries(o)) if (typeof v === 'number' && Number.isFinite(v)) r[k] = Math.max(0, Math.floor(v));
    return r;
  };
  const textos = (o: unknown) => {
    const r: Record<string, string> = {};
    if (esObjeto(o)) for (const [k, v] of Object.entries(o)) if (typeof v === 'string') r[k] = v;
    return r;
  };
  const lista = <T,>(v: unknown, ok: (x: any) => boolean): T[] => (Array.isArray(v) ? (v.filter((x) => esObjeto(x) && ok(x)) as T[]) : []);
  return {
    monedas: Math.max(0, Math.floor(numero(c.monedas, base.monedas))),
    inventario: esObjeto(c.inventario) ? cantidades(c.inventario) : base.inventario,
    deco: textos(c.deco),
    notas: lista<Nota>(c.notas, (n) => typeof n.texto === 'string' && typeof n.id === 'string').map((n) => ({ ...n, color: colorSeguro(n.color) })),
    fechas: lista<FechaEspecial>(c.fechas, (f) => typeof f.fecha === 'string' && typeof f.nombre === 'string'),
    regalos: lista<RegaloRecibido>(c.regalos, (g) => typeof g.id === 'string' && typeof g.item === 'string'),
    aniversario: typeof c.aniversario === 'string' ? c.aniversario : '',
    diario: cantidades(c.diario),
  };
}

export interface Recuerdo {
  id: string;
  autor: Rol;
  titulo: string;
  fecha: string;
  /** Foto: data URL (modo local) o URL firmada (en línea). */
  foto: string;
  t: number;
}

/** Lo que uno le manda al otro (y queda en el historial). */
export interface Evento {
  id: string;
  de: Rol;
  tipo: 'caricia' | 'abrazo' | 'beso' | 'regalo' | 'nota' | 'comida' | 'saludo';
  datos: Record<string, unknown>;
  t: number;
  /** Ya lo recibió y aplicó quien lo recibe (el cariño sube en su celular, no en el de quien lo manda). */
  visto?: boolean;
}

/** Evento confiable (datos siempre es un objeto). */
const TIPOS_EVENTO: Evento['tipo'][] = ['caricia', 'abrazo', 'beso', 'regalo', 'nota', 'comida', 'saludo'];
export function normalizarEvento(f: any): Evento | null {
  if (!esObjeto(f) || (f.de !== 'el' && f.de !== 'ella') || !TIPOS_EVENTO.includes(f.tipo)) return null;
  return {
    id: String(f.id),
    de: f.de,
    tipo: f.tipo,
    datos: esObjeto(f.datos) ? f.datos : {},
    t: typeof f.creado === 'string' ? Date.parse(f.creado) || Date.now() : numero(f.t, Date.now()),
    visto: !!f.visto,
  };
}

export const hoy = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Días que faltan para la próxima vez de una fecha (0 = hoy). */
export function diasPara(fecha: string, cadaAno: boolean, desde = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return null;
  const base = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  let f = new Date(cadaAno ? base.getFullYear() : +m[1], +m[2] - 1, +m[3]);
  if (cadaAno && f < base) f = new Date(base.getFullYear() + 1, +m[2] - 1, +m[3]);
  return Math.round((f.getTime() - base.getTime()) / 86400000);
}

export const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
