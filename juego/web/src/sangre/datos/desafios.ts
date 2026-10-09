// Los desafíos de Sangre y Ceniza 2 (H, lo de Deep Rock Galactic: Survivor en versión de Valdemora):
//  - Contrato del día y de la semana: la misma expedición para los dos (sale de la fecha), con mutadores fijos; se
//    guarda hasta dónde llegó cada uno y se puede comparar con el otro.
//  - Pruebas de maestría: de un arma (3 etapas, solo esa arma: +12 % de daño para siempre), de una clase (5 etapas sin
//    curación) y de un bioma (10 etapas con jefe en la 5 y en la 10). Dan puntos de maestría.
//  - Expediciones anómalas: reglas raras que se pagan con un punto de maestría y dan el doble de ceniza.
import { Azar } from '../../casa/lavado/azar';
import type { IdAnomalia, IdBioma, IdMutador } from '../tipos';

export interface DefAnomalia {
  id: IdAnomalia;
  nombre: string;
  desc: string;
  glifo: string;
}

export const ANOMALIAS: DefAnomalia[] = [
  { id: 'aprendiz', nombre: 'Aprendiz sangriento', desc: 'Subes de nivel el doble de rápido, pero los muertos pegan el doble.', glifo: 'libro' },
  { id: 'mineria', nombre: 'Solo minería', desc: 'Los muertos no sueltan almas: las almas salen de la roca que rompes, y las vetas dan el triple.', glifo: 'pico' },
  { id: 'locura', nombre: 'Locura de mutadores', desc: 'Cinco mutadores malos al azar.', glifo: 'luna' },
  { id: 'pies_plomo', nombre: 'Pies de plomo', desc: 'Caminas a la mitad, pero pegas 60 % más y tienes 3 de armadura.', glifo: 'bota' },
  { id: 'un_golpe', nombre: 'Un golpe y adiós', desc: 'Tienes la décima parte de la vida.', glifo: 'corazon' },
  { id: 'antigua', nombre: 'A la antigua', desc: 'Sin las mejoras del Pozo ni el equipo.', glifo: 'pergamino' },
];
export const ANOMALIA: Record<IdAnomalia, DefAnomalia> = Object.fromEntries(ANOMALIAS.map((a) => [a.id, a])) as Record<IdAnomalia, DefAnomalia>;

/** Lo que cuesta una anomalía (puntos de maestría) y lo que pagan las pruebas al ganarlas. */
export const COSTO_ANOMALIA = 1;
export const PUNTOS_PRUEBA = { arma: 1, clase: 2, bioma: 3 } as const;
export const CENIZA_PRUEBA = { arma: 120, clase: 300, bioma: 500 } as const;
/** Etapas de cada prueba. */
export const ETAPAS_PRUEBA = { arma: 3, clase: 5, bioma: 10 } as const;

/** Mutadores malos (para los contratos y la Locura). */
export const MUTADORES_MALOS: IdMutador[] = ['sangrienta', 'sin_antorchas', 'elites_dobles', 'plaga', 'roca_dura', 'eclipse', 'enjambres', 'velocidad', 'conde_fantasma',
  'oxido', 'campana_borracha', 'escasez', 'hambruna', 'tercos', 'acorazados', 'hinchados', 'barro', 'marea', 'guardian_furioso', 'tinieblas', 'sin_suministros'];
export const MUTADORES_BUENOS: IdMutador[] = ['aurelia', 'esmeralda', 'nocturna', 'cosecha', 'bendita', 'mercado', 'relicaria'];

export interface DefContrato {
  id: string;
  tipo: 'dia' | 'semana';
  nombre: string;
  bioma: IdBioma;
  peligro: number;
  mutadores: IdMutador[];
  semilla: number;
  /** Ceniza y puntos la primera vez que se gana. */
  ceniza: number;
  puntos: number;
}

const BIOMAS_CONTRATO: IdBioma[] = ['cementerio', 'catacumbas', 'minas', 'abadia', 'castillo'];

/** La fecha en Colombia (UTC−5, sin horario de verano): los dos ven el mismo contrato el mismo día. */
function enColombia(ahora: number) {
  return new Date(ahora - 5 * 3600_000);
}

const dos = (n: number) => String(n).padStart(2, '0');

function hash(s: string) {
  let h = 2166136261;
  for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619);
  return h >>> 0;
}

/** El contrato de hoy o de esta semana (sale de la fecha: el mismo para todos). */
export function contrato(tipo: 'dia' | 'semana', ahora = Date.now()): DefContrato {
  const d = enColombia(ahora);
  let id: string;
  if (tipo === 'dia') id = `dia:${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
  else {
    // Semana ISO (de lunes a domingo)
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dia = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - dia);
    const inicio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const semana = Math.ceil(((t.getTime() - inicio.getTime()) / 86400_000 + 1) / 7);
    id = `semana:${t.getUTCFullYear()}-${dos(semana)}`;
  }
  const az = new Azar(hash(id));
  const malos = [...MUTADORES_MALOS];
  const mutadores: IdMutador[] = [];
  for (let k = 0; k < (tipo === 'dia' ? 2 : 3); k++) mutadores.push(malos.splice(Math.floor(az.n() * malos.length), 1)[0]);
  mutadores.push(az.uno(MUTADORES_BUENOS));
  const bioma = az.uno(BIOMAS_CONTRATO);
  return {
    id, tipo, nombre: tipo === 'dia' ? 'Contrato del día' : 'Contrato de la semana', bioma, peligro: tipo === 'dia' ? 3 : 4, mutadores,
    semilla: hash(id + ':semilla') % 1_000_000, ceniza: tipo === 'dia' ? 150 : 400, puntos: tipo === 'dia' ? 1 : 2,
  };
}

/** Cinco mutadores malos al azar (la Locura de mutadores). */
export function locura(semilla: number): IdMutador[] {
  const az = new Azar(semilla * 13 + 7);
  const malos = [...MUTADORES_MALOS];
  return Array.from({ length: 5 }, () => malos.splice(Math.floor(az.n() * malos.length), 1)[0]);
}
