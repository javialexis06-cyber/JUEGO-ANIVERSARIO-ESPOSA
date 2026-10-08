// Lo que cada uno va ganando en «Lavarse la cara» y se guarda en la casa compartida (así no se pierde al cambiar
// de celular): las gotas doradas, la tienda de poderes, los disfraces, los logros (que desbloquean disfraces,
// cartas, armas y escenarios), la colección y los récords. Este archivo no importa nada de la casa en tiempo de
// ejecución: modelo.ts lo usa para normalizar.
import { ARMAS, PASIVAS } from './armas';
import { CARTAS } from './cartas';
import { DISFRACES } from './disfraces';
import { ENEMIGOS } from './enemigos';
import { nivelMaestria, PREMIOS_MAESTRIA, puntosDePartida, type SubidaMaestria } from './maestria';
import { PODER } from './tienda';
import { cartaGuardada, disfrazGuardado } from './textos';
import type { IdArma, IdCarta, IdEnemigo, IdEscenario, IdPasiva, Rol, Stat } from './tipos';

export interface ProgresoLavado {
  /** Gotas doradas para gastar. */
  oro: number;
  /** Lo gastado en la tienda (para el reembolso). */
  gastado: number;
  poderes: Partial<Record<Stat, number>>;
  /** Disfraces comprados (los de logro se tienen por el logro). */
  comprados: string[];
  disfraz: string;
  logros: string[];
  /** La colección: lo que ya se ha tenido alguna vez. */
  armas: IdArma[];
  pasivas: IdPasiva[];
  /** Bestiario: cuántos de cada uno ha eliminado. */
  bestiario: Partial<Record<IdEnemigo, number>>;
  /** Lo más que ha aguantado en cada escenario (segundos). */
  mejor: Partial<Record<IdEscenario, number>>;
  /** Escenarios ganados (llegó a los 30:00). */
  ganados: IdEscenario[];
  mejorNivel: number;
  mejorBajas: number;
  partidas: number;
  eliminados: number;
  velitas: number;
  cofres: number;
  arepas: number;
  oroTotal: number;
  segundos: number;
  /** Opciones del menú. */
  apurado: boolean;
  escenario: IdEscenario;
  carta: IdCarta | '';
  /** Apuntar a mano (segundo dedo o mouse) en vez de que las armas busquen solas. */
  manual: boolean;
  /** Ya vio (o se saltó) el tutorial de la primera vez. */
  tutorial: boolean;
  /** Puntos de maestría de cada disfraz (ver maestria.ts). */
  maestria: Record<string, number>;
}

export function progresoNuevo(rol: Rol): ProgresoLavado {
  return {
    oro: 0, gastado: 0, poderes: {}, comprados: [], disfraz: rol === 'el' ? 'el_panda' : 'ella_pulga', logros: [], armas: [], pasivas: [],
    bestiario: {}, mejor: {}, ganados: [], mejorNivel: 0, mejorBajas: 0, partidas: 0, eliminados: 0, velitas: 0, cofres: 0, arepas: 0,
    oroTotal: 0, segundos: 0, apurado: false, escenario: 'cara', carta: '', manual: false, tutorial: false, maestria: {},
  };
}

const esObjeto = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v: unknown, max = 1e9) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);
const listaDe = <T extends string>(v: unknown, validos: readonly string[], max = 200): T[] =>
  Array.isArray(v) ? ([...new Set(v.filter((x) => typeof x === 'string' && validos.includes(x)))].slice(0, max) as T[]) : [];

const ESCENARIOS: IdEscenario[] = ['cara', 'lavamanos', 'banera'];

/** El progreso siempre con la forma esperada (venga de otra versión, dañado o de otro celular). */
export function normalizarProgresoLavado(x: unknown, rol: Rol): ProgresoLavado {
  const b = progresoNuevo(rol);
  if (!esObjeto(x)) return b;
  const poderes: Partial<Record<Stat, number>> = {};
  if (esObjeto(x.poderes)) for (const [k, v] of Object.entries(x.poderes)) if (k in PODER) {
    const n = entero(v, PODER[k as Stat].max);
    if (n) poderes[k as Stat] = n;
  }
  const bestiario: Partial<Record<IdEnemigo, number>> = {};
  if (esObjeto(x.bestiario)) for (const [k, v] of Object.entries(x.bestiario)) if (k in ENEMIGOS) {
    const n = entero(v);
    if (n) bestiario[k as IdEnemigo] = n;
  }
  const mejor: Partial<Record<IdEscenario, number>> = {};
  if (esObjeto(x.mejor)) for (const k of ESCENARIOS) if (typeof x.mejor[k] === 'number') mejor[k] = entero(x.mejor[k], 24 * 3600);
  const disfraces = DISFRACES.filter((d) => d.rol === rol).map((d) => d.id);
  const disfraz = disfrazGuardado(x.disfraz);
  const maestria: Record<string, number> = {};
  if (esObjeto(x.maestria)) for (const [k, v] of Object.entries(x.maestria)) {
    const id = disfrazGuardado(k);
    const n = entero(v, 1e6);
    if (typeof id === 'string' && disfraces.includes(id) && n) maestria[id] = Math.max(maestria[id] ?? 0, n);
  }
  return {
    oro: entero(x.oro),
    gastado: entero(x.gastado),
    poderes,
    comprados: listaDe(Array.isArray(x.comprados) ? x.comprados.map(disfrazGuardado) : x.comprados, disfraces),
    disfraz: typeof disfraz === 'string' && disfraces.includes(disfraz) ? disfraz : b.disfraz,
    logros: listaDe(x.logros, LOGROS.map((l) => l.id)),
    armas: listaDe(x.armas, Object.keys(ARMAS)),
    pasivas: listaDe(x.pasivas, Object.keys(PASIVAS)),
    bestiario,
    mejor,
    ganados: listaDe(x.ganados, ESCENARIOS),
    mejorNivel: entero(x.mejorNivel, 9999),
    mejorBajas: entero(x.mejorBajas),
    partidas: entero(x.partidas),
    eliminados: entero(x.eliminados),
    velitas: entero(x.velitas),
    cofres: entero(x.cofres),
    arepas: entero(x.arepas),
    oroTotal: entero(x.oroTotal),
    segundos: entero(x.segundos),
    apurado: !!x.apurado,
    escenario: ESCENARIOS.includes(x.escenario) ? x.escenario : 'cara',
    carta: cartaGuardada(x.carta),
    manual: !!x.manual,
    // (quien ya jugó antes no necesita el tutorial a la fuerza: lo puede ver desde el menú)
    tutorial: !!x.tutorial || entero(x.partidas) > 0,
    maestria,
  };
}

// ---------------------------------------------------------------------------------------------------- Partida
/** Cómo terminó una partida (lo arma el motor; aquí se usa para los logros y el progreso). */
export interface ResumenPartida {
  escenario: IdEscenario;
  segundos: number;
  gano: boolean;
  apurado: boolean;
  nivel: number;
  eliminados: number;
  oro: number;
  /** De esas gotas, las que se ganaron por aguantar. */
  jornal?: number;
  cofres: number;
  velitas: number;
  arepas: number;
  evoluciones: IdArma[];
  jefes: IdEnemigo[];
  armas: IdArma[];
  pasivas: IdPasiva[];
  bestiario: Partial<Record<IdEnemigo, number>>;
  disfraz: string;
  pareja: boolean;
  revivio: boolean;
  /** Se retiró por las buenas desde la pausa (no lo tumbaron). */
  retiro?: boolean;
  /** Daño de cada arma y cuánto tiempo la tuvo (para la pantalla final). */
  danos: { arma: IdArma; dano: number; desde: number; nivel: number }[];
}

// ---------------------------------------------------------------------------------------------------- Logros
export interface DefLogro {
  id: string;
  nombre: string;
  desc: string;
  /** Lo que se gana (texto para la pantalla final). */
  premio: string;
  cumple: (p: ProgresoLavado, r: ResumenPartida | null) => boolean;
}

const minutosEn = (p: ProgresoLavado, e?: IdEscenario) => Math.floor((e ? p.mejor[e] ?? 0 : Math.max(0, ...Object.values(p.mejor).map((v) => v ?? 0))) / 60);

export const LOGROS: DefLogro[] = [
  { id: 'sobrevivir5', nombre: 'Cinco minuticos', desc: 'Aguanta 5 minutos en cualquier escenario', premio: 'Disfraces: Perrito peludo y Guerrera del escudo · Carta «El comienzo»', cumple: (p) => minutosEn(p) >= 5 },
  { id: 'eliminar1000', nombre: 'Mil mugrosos', desc: 'Elimina 1.000 mugrosos en total', premio: 'Disfraces: Dentista del barrio y Bata y turbante · Carta «El golpe certero»', cumple: (p) => p.eliminados >= 1000 },
  { id: 'nivel20', nombre: 'Nivel 20', desc: 'Llega a nivel 20 en una partida', premio: 'Disfraces: Súper Jabón y Diva del perfume · Carta «El doble turno»', cumple: (p) => p.mejorNivel >= 20 },
  { id: 'evolucionar', nombre: '¡Evolucionó!', desc: 'Evoluciona cualquier arma', premio: 'Disfraces: Leñador del champú y Princesa del spa · Carta «Luces de feria»', cumple: (p) => p.armas.some((a) => !!ARMAS[a].de) },
  { id: 'cofres5', nombre: 'Cofres y más cofres', desc: 'Abre 5 cofres en total', premio: 'Disfraces: Bombero de la ducha y Sirena de la bañera · Carta «La alcancía de oro»', cumple: (p) => p.cofres >= 5 },
  { id: 'velitas50', nombre: 'Apaga velitas', desc: 'Rompe 50 velitas en total', premio: 'Disfraces: Barbero de vueltiao y Estilista del secador · Carta «Sol de playa»', cumple: (p) => p.velitas >= 50 },
  { id: 'sobrevivir10', nombre: 'Diez minutos', desc: 'Aguanta 10 minutos', premio: 'Arma: Patico morado · Carta «El silbato»', cumple: (p) => minutosEn(p) >= 10 },
  { id: 'cara15', nombre: 'Media lavada', desc: 'Aguanta 15 minutos en La Cara', premio: 'Escenario: El Lavamanos · Carta «El viaje largo»', cumple: (p) => minutosEn(p, 'cara') >= 15 },
  { id: 'lavamanos15', nombre: 'Porcelana brillante', desc: 'Aguanta 15 minutos en El Lavamanos', premio: 'Escenario: La Bañera · Carta «Fiesta de disfraces»', cumple: (p) => minutosEn(p, 'lavamanos') >= 15 },
  { id: 'ganarCara', nombre: '¡Carita de porcelana!', desc: 'Llega a los 30:00 en La Cara', premio: 'Disfraces: Astronauta del retrete y Ranita de la bañera · Modo Apurado · Carta «Rebote sin fin»', cumple: (p) => p.ganados.includes('cara') },
  { id: 'ganarLavamanos', nombre: 'Lavamanos reluciente', desc: 'Llega a los 30:00 en El Lavamanos', premio: 'Carta «El diamante»', cumple: (p) => p.ganados.includes('lavamanos') },
  { id: 'ganarBanera', nombre: 'Bañera de espuma', desc: 'Llega a los 30:00 en La Bañera', premio: 'Carta «Con lo justo»', cumple: (p) => p.ganados.includes('banera') },
  { id: 'espinillon', nombre: 'Adiós, Espinillón', desc: 'Vence al Espinillón', premio: 'Carta «El reloj quieto»', cumple: (p) => (p.bestiario.espinillon ?? 0) > 0 },
  { id: 'nivel40', nombre: 'Nivel 40', desc: 'Llega a nivel 40 en una partida', premio: 'Pasiva: Espejo roto · Carta «La rueda de la fortuna»', cumple: (p) => p.mejorNivel >= 40 },
  { id: 'eliminar10000', nombre: 'Diez mil', desc: 'Elimina 10.000 mugrosos en total', premio: 'Arma: Colonia · Carta «Las estrellas»', cumple: (p) => p.eliminados >= 10000 },
  { id: 'evoluciones3', nombre: 'Coleccionista', desc: 'Ten 3 armas evolucionadas distintas en la colección', premio: 'Arma: Toallita desmaquillante · Carta «La corona de hierro»', cumple: (p) => p.armas.filter((a) => !!ARMAS[a].de).length >= 3 },
  { id: 'arepas20', nombre: 'Barriga llena', desc: 'Cómete 20 arepas con queso en total', premio: 'Pasiva: Curita de corazón · Carta «La curita mágica»', cumple: (p) => p.arepas >= 20 },
  { id: 'veinticuatro', nombre: 'Maratón de lavado', desc: 'Juega 24 minutos en una sola partida', premio: 'Carta «La maratón»', cumple: (p, r) => !!r && r.segundos >= 24 * 60 },
];

export const LOGRO = Object.fromEntries(LOGROS.map((l) => [l.id, l])) as Record<string, DefLogro>;

/** Qué logro desbloquea cada carta. */
export const CARTA_LOGRO: Record<IdCarta, string> = {
  comienzo: 'sobrevivir5', certero: 'eliminar1000', dobleTurno: 'nivel20', lucesFeria: 'evolucionar', oroBrillante: 'cofres5',
  solPlaya: 'velitas50', silbato: 'sobrevivir10', viajeLargo: 'cara15', fiestaDisfraces: 'lavamanos15', reboteSinFin: 'ganarCara',
  diamante: 'ganarLavamanos', conLoJusto: 'ganarBanera', relojQuieto: 'espinillon', ruedaFortuna: 'nivel40', estrellas: 'eliminar10000',
  coronaHierro: 'evoluciones3', curitaMagica: 'arepas20', maraton: 'veinticuatro',
};
/** Las armas y pasivas secretas (no salen en las cartas hasta su logro). */
export const SECRETO_LOGRO: Partial<Record<IdArma | IdPasiva, string>> = {
  patoMorado: 'sobrevivir10', colonia: 'eliminar10000', toallita: 'evoluciones3', espejoRoto: 'nivel40', curita: 'arepas20',
};
export const ESCENARIO_LOGRO: Record<IdEscenario, string | null> = { cara: null, lavamanos: 'cara15', banera: 'lavamanos15' };

export const tieneLogro = (p: ProgresoLavado, id: string | null | undefined) => !id || p.logros.includes(id);
export const cartasDe = (p: ProgresoLavado) => (Object.keys(CARTAS) as IdCarta[]).filter((c) => tieneLogro(p, CARTA_LOGRO[c]));
export const escenarioAbierto = (p: ProgresoLavado, e: IdEscenario) => tieneLogro(p, ESCENARIO_LOGRO[e]);
export const apuradoAbierto = (p: ProgresoLavado) => tieneLogro(p, 'ganarCara');
export const disfrazAbierto = (p: ProgresoLavado, id: string) => {
  const d = DISFRACES.find((x) => x.id === id);
  return !!d && (!!d.inicial || p.comprados.includes(id) || tieneLogro(p, d.logro));
};
export const secretoAbierto = (p: ProgresoLavado, id: IdArma | IdPasiva) => tieneLogro(p, SECRETO_LOGRO[id]);

/** Suma una partida al progreso y devuelve los logros nuevos. No toca el oro gastado ni la tienda. */
export function sumarPartida(p: ProgresoLavado, r: ResumenPartida): string[] {
  p.partidas++;
  p.oro += r.oro;
  p.oroTotal += r.oro;
  p.eliminados += r.eliminados;
  p.velitas += r.velitas;
  p.cofres += r.cofres;
  p.arepas += r.arepas;
  p.segundos += Math.round(r.segundos);
  p.mejorNivel = Math.max(p.mejorNivel, r.nivel);
  p.mejorBajas = Math.max(p.mejorBajas, r.eliminados);
  p.mejor[r.escenario] = Math.max(p.mejor[r.escenario] ?? 0, Math.round(r.segundos));
  if (r.gano && !p.ganados.includes(r.escenario)) p.ganados.push(r.escenario);
  for (const a of r.armas) if (!p.armas.includes(a)) p.armas.push(a);
  for (const a of r.pasivas) if (!p.pasivas.includes(a)) p.pasivas.push(a);
  for (const [k, v] of Object.entries(r.bestiario) as [IdEnemigo, number][]) p.bestiario[k] = (p.bestiario[k] ?? 0) + v;
  const nuevos: string[] = [];
  for (const l of LOGROS) {
    if (p.logros.includes(l.id)) continue;
    if (l.cumple(p, r)) {
      p.logros.push(l.id);
      nuevos.push(l.id);
    }
  }
  return nuevos;
}

/** Suma los puntos de maestría del disfraz con que se jugó y paga las gotas de los niveles nuevos. */
export function sumarMaestria(p: ProgresoLavado, r: ResumenPartida): SubidaMaestria {
  const puntos = puntosDePartida(r);
  const total0 = p.maestria[r.disfraz] ?? 0;
  const antes = nivelMaestria(total0);
  const total = total0 + puntos;
  if (puntos) p.maestria[r.disfraz] = total;
  const despues = nivelMaestria(total);
  const premios = PREMIOS_MAESTRIA.filter((x) => x.nivel > antes && x.nivel <= despues);
  for (const x of premios) if (x.oro) p.oro += x.oro;
  return { disfraz: r.disfraz, puntos, antes, despues, total, premios };
}

/** Nivel de maestría de un disfraz. */
export const maestriaDe = (p: ProgresoLavado, disfraz: string) => nivelMaestria(p.maestria[disfraz] ?? 0);

/** Récord para el trofeo: los minutos que más ha aguantado en una partida (cualquier escenario). */
export const minutosRecord = (p: ProgresoLavado | undefined) => (p ? Math.floor(Math.max(0, ...Object.values(p.mejor).map((v) => v ?? 0)) / 60) : 0);
