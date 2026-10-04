// Nuestro Hogar: datos de la pareja y reglas de las necesidades (se calculan con el reloj real).
import { normalizarProgreso, type ProgresoCocina, RECETAS, type RecetaId } from './cocina/tipos';
import { normalizarCohete, type ProgresoCohete } from './cohete/datos';
import { normalizarProgresoLavado, type ProgresoLavado } from './lavado/progreso';
export type Rol = 'el' | 'ella';
export type Cuarto = 'sala' | 'cocina' | 'bano' | 'cuarto' | 'juegos' | 'trofeos' | 'cuna' | 'cuarto_el' | 'cuarto_ella' | 'patio';
export type Necesidad = 'hambre' | 'energia' | 'higiene' | 'carino';

export const NECESIDADES: Necesidad[] = ['hambre', 'energia', 'higiene', 'carino'];
export const NOMBRE_NECESIDAD: Record<Necesidad, string> = { hambre: 'Comida', energia: 'Energía', higiene: 'Higiene', carino: 'Cariño' };
export const CUARTOS: Cuarto[] = ['sala', 'cocina', 'bano', 'cuarto', 'patio', 'juegos', 'trofeos', 'cuna', 'cuarto_el', 'cuarto_ella'];
export const NOMBRE_CUARTO: Record<Cuarto, string> = {
  sala: 'Sala', cocina: 'Cocina', bano: 'Baño', cuarto: 'Cuarto', juegos: 'Juegos', trofeos: 'Trofeos', cuna: 'Bebé', cuarto_el: 'Cuarto de Él',
  cuarto_ella: 'Cuarto de Ella', patio: 'Patio',
};
/** Con los que empieza la casa; los demás se construyen con monedas en «Ampliar la casa». */
export const CUARTOS_BASE: Cuarto[] = ['sala', 'cocina', 'bano', 'cuarto', 'patio', 'juegos'];
export const PRECIO_CUARTO: Partial<Record<Cuarto, number>> = { trofeos: 50, cuarto_el: 80, cuarto_ella: 80, cuna: 150 };
/** Los cuartos propios: solo su dueño los decora y les pinta las paredes. */
export const DUENO: Partial<Record<Cuarto, Rol>> = { cuarto_el: 'el', cuarto_ella: 'ella' };
export const tieneCuarto = (c: Pick<Casa, 'ampliaciones'>, k: Cuarto) => CUARTOS_BASE.includes(k) || !!c.ampliaciones?.includes(k);
export const NOMBRE_ROL: Record<Rol, string> = { el: 'Él', ella: 'Ella' };
export const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');

/** Puntos que se pierden por hora (despierto). Dormido: la energía sube y la comida baja a la mitad. */
export const DESGASTE: Record<Necesidad, number> = { hambre: 8, energia: 6, higiene: 4, carino: 5 };
export const RECUPERA_DURMIENDO = 16; // energía por hora

/** Dónde va cada prenda en el personaje. */
export type Ranura = 'pelo' | 'cabeza' | 'cara' | 'arriba' | 'abajo' | 'pies' | 'espalda' | 'cola';
export const RANURAS: Ranura[] = ['pelo', 'cabeza', 'cara', 'arriba', 'abajo', 'pies', 'espalda', 'cola'];
export const NOMBRE_RANURA: Record<Ranura, string> = {
  pelo: 'Peinado', cabeza: 'Cabeza', cara: 'Cara', arriba: 'Arriba', abajo: 'Abajo', pies: 'Zapatos', espalda: 'Espalda', cola: 'Cola',
};
/** Lo que tiene puesto (id de la prenda por ranura); sin prenda se ve la ropa de fábrica. */
export type Ropa = Partial<Record<Ranura, string>>;

/** Lo que se ve haciendo al personaje (también en el celular del otro). */
export type Accion = 'comer' | 'banar' | 'lavar' | 'sofa' | 'tv' | 'nevera' | 'closet' | 'saludo' | 'pensar' | 'inodoro' | 'cocinar'
  /** Usar un mueble de los cuartos nuevos (el item dice cuál: arcade, mesa, cuna, mecedora, tocador…). */
  | 'usar';

export interface Actividad {
  tipo: 'nada' | 'dormir';
  desde: number;
  /** Animación corta en curso (comer, bañarse, ver tele...) hasta `hasta`. */
  accion?: Accion;
  hasta?: number;
  /** Comida o regalo que tiene en la mano. */
  item?: string;
  /** Libre en el cuarto: hasta dónde caminó (tocando el piso). El otro celular lo ve caminar hasta ahí. */
  pos?: { x: number; y: number };
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
  /** Ropa puesta y tinte del pelo (cada uno se viste en su celular; el otro lo ve igual). */
  ropa?: Ropa;
  colorPelo?: string;
  /** Desde cuándo tiene ganas de ir al baño (leche para Ella, picante para Él): el retrete sale volando. */
  apuro?: number;
}

export function personajeNuevo(ahora = Date.now()): EstadoPersonaje {
  return { hambre: 80, energia: 90, higiene: 85, carino: 70, t: ahora, cuarto: 'sala', actividad: { tipo: 'nada', desde: ahora }, visto: ahora };
}

const limitar = (v: number) => Math.max(0, Math.min(100, v));
const numero = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const esObjeto = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const esRol = (v: unknown): v is Rol => v === 'el' || v === 'ella';

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
  if (esObjeto(e.ropa)) {
    const ropa: Ropa = {};
    for (const k of RANURAS) {
      const v = (e.ropa as Record<string, unknown>)[k];
      if (typeof v === 'string' && /^[a-z0-9_]{1,40}$/.test(v)) ropa[k] = v;
    }
    if (Object.keys(ropa).length) r.ropa = ropa;
  }
  if (typeof e.colorPelo === 'string' && /^#[0-9a-f]{6}$/i.test(e.colorPelo)) r.colorPelo = e.colorPelo;
  if (typeof e.apuro === 'number' && Number.isFinite(e.apuro)) r.apuro = e.apuro;
  const a = e.actividad;
  if (esObjeto(a) && (a.tipo === 'nada' || a.tipo === 'dormir')) {
    r.actividad = { tipo: a.tipo, desde: numero(a.desde, t) };
    if (typeof a.accion === 'string') r.actividad.accion = a.accion as Accion;
    if (typeof a.hasta === 'number' && Number.isFinite(a.hasta)) r.actividad.hasta = a.hasta;
    if (typeof a.item === 'string') r.actividad.item = a.item;
    const pos = a.pos as Record<string, unknown> | undefined;
    if (esObjeto(pos) && typeof pos.x === 'number' && typeof pos.y === 'number' && Math.abs(pos.x) < 30 && Math.abs(pos.y) < 30) r.actividad.pos = { x: pos.x, y: pos.y };
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

/** Mensaje de voz que uno le deja al otro (suena como una llamada y queda en el buzón). */
export interface NotaVoz {
  id: string;
  de: Rol;
  para: Rol;
  /** Dónde está el audio: data URL (sin internet) o ruta en el almacenamiento de la casa (en línea). */
  ref: string;
  /** Segundos. */
  dur: number;
  t: number;
  oida: boolean;
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
  voces: NotaVoz[];
  aniversario: string;
  /** Registro de caricias, abrazos y besos del día (para los premios de cariño). */
  diario: Record<string, number>;
  /** Récords del retrete espacial: los segundos que más ha durado cada uno esquivando asteroides. */
  retrete?: Partial<Record<Rol, number>>;
  /** El retrete espacial de cada uno: rollitos, mejoras, retretes/estelas/cascos, misiones y récords (metros). */
  cohete?: Partial<Record<Rol, ProgresoCohete>>;
  /** Cuándo descubrió cada uno el retrete espacial (después de eso puede volar cada vez que se sienta en el inodoro). */
  coheteVisto?: Partial<Record<Rol, number>>;
  /** Récords de lavarse la cara: los gérmenes que más ha eliminado cada uno en una lavada. */
  lavado?: Partial<Record<Rol, number>>;
  /** Lavarse la cara: lo de cada uno (gotas doradas, tienda de poderes, disfraces, logros, colección y récords). */
  lavadoProgreso?: Partial<Record<Rol, ProgresoLavado>>;
  /** Cuartos construidos con «Ampliar la casa» (además de los de siempre). */
  ampliaciones?: Cuarto[];
  /** La bebé que trajo la cigüeña. */
  bebe?: { nombre: string; desde: number };
  /** Lo mejor de cada uno en los minijuegos (para los trofeos): estrellas del súper, puertas abiertas, partidas ganadas. */
  logros?: Partial<Record<Rol, Logros>>;
  /** Color de las paredes de los cuartos propios. */
  pintura?: Partial<Record<Cuarto, string>>;
  /** El perrito del patio (de los dos). */
  perro?: Perrito;
  /** La cocina de chef: el progreso de cada uno en cada restaurante (día, rango, propinas y mejoras). */
  cocina?: Partial<Record<Rol, Partial<Record<RecetaId, ProgresoCocina>>>>;
}

// ---------------------------------------------------------------------------
// El perrito del patio: necesidades como las de ellos (con el reloj real), nivel y popós en la grama
// ---------------------------------------------------------------------------
export type NecesidadPerro = 'hambre' | 'energia' | 'higiene' | 'alegria';
export const NECESIDADES_PERRO: NecesidadPerro[] = ['hambre', 'energia', 'higiene', 'alegria'];
export type AccionPerro = 'comer' | 'premio' | 'banar' | 'dormir' | 'despertar';

export interface Perrito {
  nombre: string;
  pelaje: string;
  hembra: boolean;
  desde: number;
  hambre: number;
  energia: number;
  higiene: number;
  alegria: number;
  /** Momento de los valores guardados. */
  t: number;
  xp: number;
  /** Dormido en su casita desde… */
  dormido?: number;
  /** Lo último que le hicieron (así el otro celular también lo ve comer, bañarse o irse a dormir). */
  accion?: { tipo: AccionPerro; desde: number; de: Rol };
  /** Popós en la grama (x, y) y cuándo le toca la próxima (un rato después de comer). */
  popos: [number, number][];
  popoEn?: number;
}

/** Lo que baja por hora; dormido la energía sube y el hambre baja a la mitad. Cada popó ensucia y aburre. */
const DESGASTE_PERRO: Record<NecesidadPerro, number> = { hambre: 6, energia: 4, higiene: 3, alegria: 5 };
const RECUPERA_PERRO = 20;

export function perritoNuevo(nombre: string, pelaje: string, hembra: boolean, ahora = Date.now()): Perrito {
  return { nombre, pelaje, hembra, desde: ahora, hambre: 70, energia: 90, higiene: 80, alegria: 85, t: ahora, xp: 0, popos: [] };
}

export function perroAlDia(p: Perrito, ahora = Date.now()): Perrito {
  const h = Math.max(0, (ahora - p.t) / 3600000);
  const dormido = !!p.dormido;
  const n = p.popos.length;
  return {
    ...p,
    hambre: limitar(p.hambre - DESGASTE_PERRO.hambre * h * (dormido ? 0.5 : 1)),
    energia: limitar(dormido ? p.energia + RECUPERA_PERRO * h : p.energia - DESGASTE_PERRO.energia * h),
    higiene: limitar(p.higiene - (DESGASTE_PERRO.higiene + 2 * n) * h),
    alegria: limitar(p.alegria - (DESGASTE_PERRO.alegria + n) * h * (dormido ? 0.4 : 1)),
    t: ahora,
  };
}

/** Nivel del perrito (sube con los cuidados): 2 a los 20 puntos, 3 a los 80, 4 a los 180… */
export const nivelPerro = (xp: number) => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 20));
export const xpDeNivel = (n: number) => 20 * (n - 1) ** 2;

function normalizarPerro(p: any): Perrito | null {
  if (!esObjeto(p) || typeof p.nombre !== 'string' || !p.nombre.trim()) return null;
  const ahora = Date.now();
  const r: Perrito = {
    nombre: p.nombre.trim().slice(0, 24),
    pelaje: typeof p.pelaje === 'string' && /^[a-z]{1,20}$/.test(p.pelaje) ? p.pelaje : 'caramelo',
    hembra: !!p.hembra,
    desde: numero(p.desde, ahora),
    hambre: limitar(numero(p.hambre, 70)),
    energia: limitar(numero(p.energia, 90)),
    higiene: limitar(numero(p.higiene, 80)),
    alegria: limitar(numero(p.alegria, 85)),
    t: numero(p.t, ahora),
    xp: Math.max(0, Math.min(1e6, Math.floor(numero(p.xp, 0)))),
    popos: Array.isArray(p.popos)
      ? p.popos.filter((q: unknown) => Array.isArray(q) && q.length === 2 && q.every((v) => typeof v === 'number' && Number.isFinite(v))).slice(0, 5)
      : [],
  };
  if (typeof p.dormido === 'number' && Number.isFinite(p.dormido)) r.dormido = p.dormido;
  if (typeof p.popoEn === 'number' && Number.isFinite(p.popoEn)) r.popoEn = p.popoEn;
  const a = p.accion;
  if (esObjeto(a) && ['comer', 'premio', 'banar', 'dormir', 'despertar'].includes(a.tipo) && (a.de === 'el' || a.de === 'ella')) {
    r.accion = { tipo: a.tipo, desde: numero(a.desde, 0), de: a.de };
  }
  return r;
}

export interface Logros {
  super: number;
  puertas: number;
  mesa: number;
}
const LOGROS: (keyof Logros)[] = ['super', 'puertas', 'mesa'];

export function casaNueva(): Casa {
  return {
    monedas: 40,
    inventario: { pan: 2, manzana: 2, galletas: 1 },
    deco: {},
    notas: [],
    fechas: [],
    regalos: [],
    voces: [],
    aniversario: '',
    diario: {},
  };
}

/** Todos los campos de la casa que esta versión conoce y normaliza (los demás vienen de una versión más nueva y se
 *  conservan). Al agregar un campo a `Casa`, TypeScript obliga a ponerlo aquí también. */
const CAMPOS_CASA = {
  monedas: 1, inventario: 1, deco: 1, notas: 1, fechas: 1, regalos: 1, voces: 1, aniversario: 1, diario: 1, retrete: 1, lavado: 1,
  ampliaciones: 1, bebe: 1, logros: 1, pintura: 1, perro: 1, cocina: 1, lavadoProgreso: 1, cohete: 1, coheteVisto: 1,
} satisfies Record<keyof Casa, 1>;

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
  // Campos que trae una versión más nueva de la app (el otro celular ya actualizó y este no): se conservan tal cual,
  // si no, cada guardado de este celular se los borraría al otro
  const nuevos = Object.fromEntries(Object.entries(c).filter(([k]) => !(k in CAMPOS_CASA)));
  return {
    ...nuevos,
    monedas: Math.max(0, Math.floor(numero(c.monedas, base.monedas))),
    inventario: esObjeto(c.inventario) ? cantidades(c.inventario) : base.inventario,
    deco: textos(c.deco),
    // (quién, cuándo y el mensaje también se revisan: un dato raro de otra versión no rompe las hojas que los pintan)
    notas: lista<Nota>(c.notas, (n) => typeof n.texto === 'string' && typeof n.id === 'string').map((n) => ({
      ...n, de: n.de === 'ella' ? 'ella' : 'el', color: colorSeguro(n.color), t: numero(n.t, 0),
    })),
    fechas: lista<FechaEspecial>(c.fechas, (f) => typeof f.fecha === 'string' && typeof f.nombre === 'string').map((f) => ({
      ...f, id: typeof f.id === 'string' && f.id ? f.id : `f${f.fecha}${f.nombre.length}`, cadaAno: !!f.cadaAno,
    })),
    regalos: lista<RegaloRecibido>(c.regalos, (g) => typeof g.id === 'string' && typeof g.item === 'string' && esRol(g.de) && esRol(g.para)).map((g) => ({
      ...g, mensaje: typeof g.mensaje === 'string' ? g.mensaje : '',
      t: numero(g.t, 0), abierto: !!g.abierto,
    })),
    voces: lista<NotaVoz>(c.voces, (v) => typeof v.id === 'string' && typeof v.ref === 'string' && (v.de === 'el' || v.de === 'ella') && (v.para === 'el' || v.para === 'ella'))
      .map((v) => ({ ...v, dur: Math.max(0, Math.min(60, numero(v.dur, 0))), t: numero(v.t, 0), oida: !!v.oida })),
    aniversario: typeof c.aniversario === 'string' ? c.aniversario : '',
    diario: cantidades(c.diario),
    ...(esObjeto(c.retrete)
      ? {
          retrete: Object.fromEntries(
            (['el', 'ella'] as Rol[]).filter((r) => typeof c.retrete[r] === 'number' && Number.isFinite(c.retrete[r])).map((r) => [r, Math.max(0, Math.min(3600, c.retrete[r]))]),
          ),
        }
      : {}),
    ...(esObjeto(c.cohete)
      ? { cohete: Object.fromEntries((['el', 'ella'] as Rol[]).filter((r) => esObjeto(c.cohete[r])).map((r) => [r, normalizarCohete(c.cohete[r])])) }
      : {}),
    ...(esObjeto(c.coheteVisto)
      ? {
          coheteVisto: Object.fromEntries(
            (['el', 'ella'] as Rol[]).filter((r) => typeof c.coheteVisto[r] === 'number' && Number.isFinite(c.coheteVisto[r]) && c.coheteVisto[r] > 0).map((r) => [r, Math.floor(c.coheteVisto[r])]),
          ),
        }
      : {}),
    ...(esObjeto(c.lavado)
      ? {
          lavado: Object.fromEntries(
            (['el', 'ella'] as Rol[]).filter((r) => typeof c.lavado[r] === 'number' && Number.isFinite(c.lavado[r])).map((r) => [r, Math.max(0, Math.min(99999, Math.round(c.lavado[r])))]),
          ),
        }
      : {}),
    ...(esObjeto(c.lavadoProgreso)
      ? {
          lavadoProgreso: Object.fromEntries(
            (['el', 'ella'] as Rol[]).filter((r) => esObjeto(c.lavadoProgreso[r])).map((r) => [r, normalizarProgresoLavado(c.lavadoProgreso[r], r)]),
          ),
        }
      : {}),
    ...(Array.isArray(c.ampliaciones)
      ? { ampliaciones: CUARTOS.filter((k) => !CUARTOS_BASE.includes(k) && (c.ampliaciones as unknown[]).includes(k)) }
      : {}),
    ...(esObjeto(c.bebe) && typeof c.bebe.nombre === 'string' && c.bebe.nombre.trim()
      ? { bebe: { nombre: c.bebe.nombre.trim().slice(0, 30), desde: numero(c.bebe.desde, 0) } }
      : {}),
    ...(esObjeto(c.logros)
      ? {
          logros: Object.fromEntries(
            (['el', 'ella'] as Rol[])
              .filter((r) => esObjeto(c.logros[r]))
              .map((r) => [r, Object.fromEntries(LOGROS.map((k) => [k, Math.max(0, Math.min(100000, Math.floor(numero(c.logros[r][k], 0))))])) as unknown as Logros]),
          ),
        }
      : {}),
    ...(esObjeto(c.pintura)
      ? { pintura: Object.fromEntries(Object.entries(c.pintura).filter(([k, v]) => k in DUENO && typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v))) }
      : {}),
    ...(normalizarPerro(c.perro) ? { perro: normalizarPerro(c.perro)! } : {}),
    ...(esObjeto(c.cocina)
      ? {
          cocina: Object.fromEntries(
            (['el', 'ella'] as Rol[])
              .filter((r) => esObjeto(c.cocina[r]))
              .map((r) => [r, Object.fromEntries(RECETAS.filter((k) => esObjeto(c.cocina[r][k])).map((k) => [k, normalizarProgreso(c.cocina[r][k])]))]),
          ),
        }
      : {}),
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
  tipo: 'caricia' | 'abrazo' | 'beso' | 'regalo' | 'nota' | 'comida' | 'saludo' | 'voz' | 'juego' | 'nalgada'
    /** Pide ayuda desde el baño (ratón, cucarachas, se tapó…) y la pareja llega a rescatarlo. */
    | 'auxilio' | 'rescate';
  datos: Record<string, unknown>;
  t: number;
  /** Ya lo recibió y aplicó quien lo recibe (el cariño sube en su celular, no en el de quien lo manda). */
  visto?: boolean;
}

/** Evento confiable (datos siempre es un objeto). */
const TIPOS_EVENTO: Evento['tipo'][] = ['caricia', 'abrazo', 'beso', 'regalo', 'nota', 'comida', 'saludo', 'voz', 'juego', 'nalgada', 'auxilio', 'rescate'];
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
