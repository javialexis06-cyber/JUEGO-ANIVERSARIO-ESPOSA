// El mapa de la Noche (Sangre y Ceniza 2, G; como el mapa de sectores de Deep Rock, pero con la historia del mito de
// Astra, docs/mitologia.md): Valdemora en cuatro sectores. Cada lugar es una expedición en un bioma con tres metas
// (terminarla y dos retos de ese lugar o de una clase); al terminar todos los lugares de un sector se abre su Puerta
// (una expedición fija con una luna buena y dos mutadores malos) y, al cruzarla, una escena corta cuenta la historia.
// Aquí no hay nada de la pareja: los textos de las escenas van en historia_pareja.ts (con su versión para amigos).
import type { DatosLogro } from '../logros';
import type { IdBioma, IdClase, IdMutador } from '../tipos';

export type IdSector = 'afueras' | 'subsuelo' | 'santuario' | 'corte';
export type IdEscena = 'prologo' | IdSector;

export interface DefReto {
  id: string;
  desc: string;
  hecho: (d: DatosLogro) => boolean;
}

export interface DefLugar {
  id: string;
  nombre: string;
  sector: IdSector;
  bioma: IdBioma;
  peligro: number;
  /** Los dos retos (la primera meta siempre es terminar la expedición). */
  retos: [DefReto, DefReto];
  /** La Puerta del sector: misión fija con sus mutadores (una luna buena y dos malos). */
  puerta?: boolean;
  mutadores?: IdMutador[];
  /** Qué dice el lugar en el mapa. */
  lema: string;
  /** El arma común que se gana la primera vez que se termina. */
  premio?: string;
}

export interface DefSector {
  id: IdSector;
  nombre: string;
  numero: string;
  desc: string;
  color: string;
  glifo: string;
  /** Ceniza por cada meta cumplida en este sector. */
  ceniza: number;
}

export const SECTORES: DefSector[] = [
  { id: 'afueras', nombre: 'Las Afueras', numero: 'I', desc: 'El cementerio hundido al pie de Valdemora, donde la niebla es ceniza.', color: '#6a7a6a', glifo: 'lapida', ceniza: 30 },
  { id: 'subsuelo', nombre: 'El Subsuelo', numero: 'II', desc: 'Los laberintos de Vael’Thor y la mina de los dragones de Celia.', color: '#9a5a3a', glifo: 'pico', ceniza: 45 },
  { id: 'santuario', nombre: 'El Santuario', numero: 'III', desc: 'La abadía de Aura y Lara, donde ahora se le reza a otro.', color: '#c86a2a', glifo: 'campana', ceniza: 60 },
  { id: 'corte', nombre: 'La Corte del Conde', numero: 'IV', desc: 'El castillo donde el Conde Sangrevil guarda la grieta.', color: '#8a1a2a', glifo: 'castillo', ceniza: 80 },
];
export const SECTOR: Record<IdSector, DefSector> = Object.fromEntries(SECTORES.map((s) => [s.id, s])) as Record<IdSector, DefSector>;

// ------------------------------------------------------------------------------------------------- Retos
const r = (id: string, desc: string, hecho: (d: DatosLogro) => boolean): DefReto => ({ id, desc, hecho });
const gana = (d: DatosLogro) => d.exito;
const conClase = (c: IdClase, nombre: string, extra?: string) => r(`clase_${c}`, `Gana con ${nombre}${extra ? ` ${extra}` : ''}.`, (d) => gana(d) && d.j.clase === c);
const muertos = (n: number) => r(`muertos_${n}`, `Acaba con ${n.toLocaleString('es-CO')} muertos.`, (d) => d.j.resumen.muertes >= n);
const elites = (n: number) => r(`elites_${n}`, `Tumba ${n} élites.`, (d) => d.j.resumen.elites >= n);
const minerales = (n: number) => r(`minerales_${n}`, `Trae ${n} minerales a casa.`, (d) => d.j.mineralesSeguro.reduce((a, b) => a + b, 0) >= n);
const botin = (n: number) => r(`botin_${n}`, `Atrapa ${n} bichos del botín.`, (d) => (d.j.resumen.botin ?? 0) >= n);
const sinCaer = r('sin_caer', 'Gana sin caer ni una vez.', (d) => gana(d) && d.j.resumen.caidas === 0);
const nivel = (n: number) => r(`nivel_${n}`, `Llega al nivel ${n}.`, (d) => d.j.nivel >= n);
const excavar = (n: number) => r(`excavar_${n}`, `Excava ${n} bloques de roca.`, (d) => d.j.resumen.excavadas >= n);
const prisioneros = (n: number) => r(`prisioneros_${n}`, `Libera ${n} prisioneros.`, (d) => d.j.resumen.prisioneros >= n);
const bendiciones = (n: number) => r(`bendiciones_${n}`, `Recibe ${n} bendiciones.`, (d) => d.j.resumen.bendiciones >= n);
const altares = (n: number) => r(`altares_${n}`, `Destruye ${n} altares de sangre.`, (d) => d.j.resumen.altares >= n);
const dano = (n: number) => r(`dano_${n}`, `Haz ${(n / 1e6).toLocaleString('es-CO')} millones de daño.`, (d) => d.j.resumen.dano >= n);
const oro = (n: number) => r(`oro_${n}`, `Junta ${n.toLocaleString('es-CO')} de oro.`, (d) => d.j.resumen.oro >= n);
const levantados = (n: number) => r(`levantados_${n}`, `Levanta ${n} veces a un compañero o a un muerto propio.`, (d) => d.j.resumen.levantados >= n);

export const LUGARES: DefLugar[] = [
  // ----------------------------------------------------------------------------------------- I. Las Afueras
  { id: 'reja', premio: 'humo_azufre', nombre: 'La reja del cementerio', sector: 'afueras', bioma: 'cementerio', peligro: 1, lema: 'Donde empieza la Noche.', retos: [muertos(1000), minerales(15)] },
  { id: 'lapidas', premio: 'latigo_espinas', nombre: 'Las lápidas torcidas', sector: 'afueras', bioma: 'cementerio', peligro: 2, lema: 'Los nombres ya no se leen.', retos: [sinCaer, botin(3)] },
  { id: 'mausoleo', premio: 'cuervos_cazadores', nombre: 'El mausoleo sin dueño', sector: 'afueras', bioma: 'cementerio', peligro: 2, lema: 'Alguien abrió la tumba desde adentro.', retos: [conClase('sepulturero', 'el Sepulturero'), nivel(35)] },
  { id: 'puerta_afueras', premio: 'murcielagos', nombre: 'La grieta del pantano', sector: 'afueras', bioma: 'cementerio', peligro: 2, puerta: true, mutadores: ['nocturna', 'sangrienta', 'sin_antorchas'], lema: 'La Santa de Lara espera al otro lado.', retos: [elites(30), sinCaer] },
  // ----------------------------------------------------------------------------------------- II. El Subsuelo
  { id: 'osarios', premio: 'cepos', nombre: 'Los osarios', sector: 'subsuelo', bioma: 'catacumbas', peligro: 2, lema: 'Huesos que sostienen el techo.', retos: [elites(40), excavar(400)] },
  { id: 'mina_dragones', premio: 'bomba_racimo', nombre: 'La mina de los dragones', sector: 'subsuelo', bioma: 'minas', peligro: 2, lema: 'Donde Celia guardaba sus gemas.', retos: [minerales(30), oro(1500)] },
  { id: 'laberinto', premio: 'rayo_sangre', nombre: 'El laberinto de Vael’Thor', sector: 'subsuelo', bioma: 'catacumbas', peligro: 3, lema: 'Ningún pasillo lleva a donde dice.', retos: [prisioneros(8), conClase('bruja', 'la Bruja')] },
  { id: 'nido_gusano', premio: 'lanza_fuego', nombre: 'El nido del gusano', sector: 'subsuelo', bioma: 'minas', peligro: 3, lema: 'Lo que echó a los dragones sigue abajo.', retos: [sinCaer, nivel(40)] },
  { id: 'puerta_subsuelo', premio: 'ballesta_pie', nombre: 'El corazón de la mina', sector: 'subsuelo', bioma: 'minas', peligro: 3, puerta: true, mutadores: ['esmeralda', 'roca_dura', 'enjambres'], lema: 'Allá abajo late algo viejo.', retos: [minerales(40), botin(4)] },
  // ----------------------------------------------------------------------------------------- III. El Santuario
  { id: 'vitrales', premio: 'frasco_escarcha', nombre: 'Los vitrales rotos', sector: 'santuario', bioma: 'abadia', peligro: 3, lema: 'Las diosas en pedazos por el piso.', retos: [altares(10), bendiciones(6)] },
  { id: 'coro', nombre: 'El coro sin voz', sector: 'santuario', bioma: 'abadia', peligro: 3, lema: 'Rezan, pero a otro.', retos: [conClase('inquisidor', 'el Inquisidor'), elites(60)] },
  { id: 'campanario', nombre: 'El campanario', sector: 'santuario', bioma: 'abadia', peligro: 3, lema: 'La campana llama a quien no debe.', retos: [sinCaer, dano(2_000_000)] },
  { id: 'puerta_santuario', nombre: 'El manuscrito de las Santas', sector: 'santuario', bioma: 'abadia', peligro: 3, puerta: true, mutadores: ['aurelia', 'plaga', 'elites_dobles'], lema: 'Lo que las Santas escondieron.', retos: [levantados(3), nivel(45)] },
  // ----------------------------------------------------------------------------------------- IV. La Corte del Conde
  { id: 'murallas', nombre: 'Las murallas', sector: 'corte', bioma: 'castillo', peligro: 3, lema: 'Nadie ha entrado. Nadie ha salido.', retos: [muertos(10000), conClase('cazador', 'el Cazador de vampiros')] },
  { id: 'espejos', nombre: 'La galería de los espejos', sector: 'corte', bioma: 'castillo', peligro: 4, lema: 'Las ilusiones de Vael’Thor.', retos: [sinCaer, nivel(45)] },
  { id: 'cripta_conde', nombre: 'La cripta del Conde', sector: 'corte', bioma: 'castillo', peligro: 4, lema: 'Donde bebió la ceniza.', retos: [minerales(40), botin(5)] },
  { id: 'puerta_corte', nombre: 'La grieta del Conde', sector: 'corte', bioma: 'castillo', peligro: 4, puerta: true, mutadores: ['nocturna', 'sangrienta', 'velocidad'], lema: 'El final de la Noche Eterna.', retos: [sinCaer, elites(80)] },
];
export const LUGAR: Record<string, DefLugar> = Object.fromEntries(LUGARES.map((l) => [l.id, l]));

/** Las metas de un lugar: «fin» (terminarlo) y los dos retos. Se guardan como «lugar:meta». */
export const metasDe = (l: DefLugar) => ['fin', l.retos[0].id, l.retos[1].id];
export const claveMeta = (lugar: string, meta: string) => `${lugar}:${meta}`;

/** ¿Está abierto el sector? (el primero siempre; los demás, al cruzar la Puerta del anterior) */
export function sectorAbierto(metas: string[], s: IdSector) {
  const k = SECTORES.findIndex((x) => x.id === s);
  if (k <= 0) return true;
  return metas.includes(claveMeta(`puerta_${SECTORES[k - 1].id}`, 'fin'));
}

/** ¿Está abierto el lugar? (su sector abierto; la Puerta, cuando todos los lugares del sector están terminados) */
export function lugarAbierto(metas: string[], l: DefLugar) {
  if (!sectorAbierto(metas, l.sector)) return false;
  if (!l.puerta) return true;
  return LUGARES.filter((x) => x.sector === l.sector && !x.puerta).every((x) => metas.includes(claveMeta(x.id, 'fin')));
}

/** Las metas que se cumplieron en esta expedición (las que todavía no estaban). */
export function metasNuevas(metas: string[], l: DefLugar, d: DatosLogro): string[] {
  const r: string[] = [];
  if (d.exito && !metas.includes(claveMeta(l.id, 'fin'))) r.push(claveMeta(l.id, 'fin'));
  for (const reto of l.retos) if (!metas.includes(claveMeta(l.id, reto.id)) && reto.hecho(d)) r.push(claveMeta(l.id, reto.id));
  return r;
}
