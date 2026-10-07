// Los logros: los que desbloquean clases (como los personajes de Vampire Survivors y Brotato), biomas y armas
// comunes, y los que solo dan ceniza y orgullo. Se revisan al terminar cada expedición con lo que hizo el jugador.
import { ARMAS } from './datos/armas';
import { CLASES } from './datos/clases';
import type { Expedicion } from './expedicion';
import type { Jugador } from './sim/jugador';
import { CLASES_ORDEN, BIOMAS_ORDEN, type IdBioma, type IdClase } from './tipos';
import { nivelMaestria, type ProgresoSangre } from './progreso';

export interface DatosLogro {
  p: ProgresoSangre;
  exp: Expedicion;
  j: Jugador;
  exito: boolean;
  jugadores: number;
}

export interface DefLogro {
  id: string;
  nombre: string;
  desc: string;
  glifo: string;
  ceniza: number;
  /** Lo que desbloquea (texto para mostrar). */
  premio?: string;
  hecho: (d: DatosLogro) => boolean;
  /** Avance para la lista (0-1). */
  avance?: (p: ProgresoSangre) => number;
}

const evoluciono = (j: Jugador) => j.armas.some((a) => !!ARMAS[a.id]?.evolucion);
const c = (p: ProgresoSangre) => p.cifras;

export const LOGROS: DefLogro[] = [
  // ---- Los que abren clases
  { id: 'primera_expedicion', nombre: 'Primera sangre', desc: 'Llega a la campana de extracción por primera vez.', glifo: 'campana', ceniza: 20, premio: 'Desbloquea al Caballero',
    hecho: (d) => d.exp.resultados.some((r) => r.fin.exito && r.fin.extraidos.includes(d.j.i)) },
  { id: 'nivel_20', nombre: 'Curtido', desc: 'Llega al nivel 20 en una expedición.', glifo: 'alma', ceniza: 30, premio: 'Desbloquea al Cazador de vampiros',
    hecho: (d) => d.j.nivel >= 20, avance: (p) => Math.min(1, c(p).nivelMax / 20) },
  { id: 'excavador', nombre: 'Topo', desc: 'Excava 600 bloques de roca (en total).', glifo: 'pico', ceniza: 30, premio: 'Desbloquea al Herrero',
    hecho: (d) => c(d.p).excavadas >= 600, avance: (p) => Math.min(1, c(p).excavadas / 600) },
  { id: 'frascos', nombre: 'Coleccionista de frascos', desc: 'Recoge 12 frascos de alquimia (en total).', glifo: 'frasco', ceniza: 30, premio: 'Desbloquea al Alquimista',
    hecho: (d) => c(d.p).frascos >= 12, avance: (p) => Math.min(1, c(p).frascos / 12) },
  { id: 'mil_muertos', nombre: 'Mil muertos', desc: 'Acaba con 1 000 enemigos en una sola expedición.', glifo: 'calavera', ceniza: 40, premio: 'Desbloquea al Sepulturero',
    hecho: (d) => d.j.resumen.muertes >= 1000 },
  { id: 'altares', nombre: 'Rompealtares', desc: 'Destruye 20 altares de sangre (en total).', glifo: 'altar', ceniza: 30, premio: 'Desbloquea al Inquisidor',
    hecho: (d) => c(d.p).altares >= 20, avance: (p) => Math.min(1, c(p).altares / 20) },
  { id: 'cazador_elites', nombre: 'Cazador de élites', desc: 'Acaba con 40 élites (en total).', glifo: 'corona', ceniza: 40, premio: 'Desbloquea al Verdugo',
    hecho: (d) => c(d.p).elites >= 40, avance: (p) => Math.min(1, c(p).elites / 40) },
  { id: 'bendiciones', nombre: 'Devoto', desc: 'Recibe 10 bendiciones de los santos oscuros (en total).', glifo: 'vela', ceniza: 30, premio: 'Desbloquea a la Bruja',
    hecho: (d) => c(d.p).bendiciones >= 10, avance: (p) => Math.min(1, c(p).bendiciones / 10) },
  { id: 'prisioneros', nombre: 'Libertador', desc: 'Libera 12 prisioneros (en total).', glifo: 'cadena', ceniza: 30, premio: 'Desbloquea al Juglar',
    hecho: (d) => c(d.p).prisioneros >= 12, avance: (p) => Math.min(1, c(p).prisioneros / 12) },
  // ---- Biomas
  { id: 'gana_cementerio', nombre: 'Bajo la tierra', desc: 'Gana una expedición en el Cementerio Hundido.', glifo: 'lapida', ceniza: 50, premio: 'Desbloquea Las Minas de Sangre',
    hecho: (d) => d.exito && d.exp.cfg.bioma === 'cementerio' },
  { id: 'gana_catacumbas', nombre: 'Silencio en las criptas', desc: 'Gana una expedición en Las Catacumbas.', glifo: 'calavera', ceniza: 50, premio: 'Desbloquea La Abadía en Llamas',
    hecho: (d) => d.exito && d.exp.cfg.bioma === 'catacumbas' },
  { id: 'gana_minas', nombre: 'Veta roja', desc: 'Gana una expedición en Las Minas de Sangre.', glifo: 'cristal', ceniza: 60, premio: 'Desbloquea El Castillo del Conde (con la Abadía)',
    hecho: (d) => d.exito && d.exp.cfg.bioma === 'minas' },
  { id: 'gana_abadia', nombre: 'Ceniza y vitral', desc: 'Gana una expedición en La Abadía en Llamas.', glifo: 'cruz', ceniza: 60, premio: 'Desbloquea El Castillo del Conde (con las Minas)',
    hecho: (d) => d.exito && d.exp.cfg.bioma === 'abadia' },
  { id: 'gana_castillo', nombre: 'Amanecer', desc: 'Derrota al Conde Sangrevil en su castillo.', glifo: 'sol', ceniza: 120, premio: 'Desbloquea el arco largo y la ira del cielo',
    hecho: (d) => d.exito && d.exp.cfg.bioma === 'castillo' },
  // ---- Armas comunes
  { id: 'primer_jefe', nombre: 'Matagigantes', desc: 'Derrota a tu primer jefe.', glifo: 'corona', ceniza: 40, premio: 'Desbloquea la sierra',
    hecho: (d) => d.exito },
  // ---- Modo infinito
  { id: 'infinito_8', nombre: 'Sin fondo', desc: 'Llega a la etapa 8 en el modo infinito.', glifo: 'calavera', ceniza: 80,
    hecho: (d) => !!d.exp.cfg.infinito && d.exp.etapa >= 8, avance: (p) => Math.min(1, c(p).infinitoMax / 8) },
  { id: 'infinito_16', nombre: 'La noche eterna', desc: 'Llega a la etapa 16 en el modo infinito.', glifo: 'luna', ceniza: 200,
    hecho: (d) => !!d.exp.cfg.infinito && d.exp.etapa >= 16, avance: (p) => Math.min(1, c(p).infinitoMax / 16) },
  // ---- Solo gloria
  { id: 'peligro3', nombre: 'Sin miedo', desc: 'Gana una expedición en peligro 3 o más.', glifo: 'calavera', ceniza: 80, hecho: (d) => d.exito && d.exp.cfg.peligro >= 3 },
  { id: 'peligro5', nombre: 'Noche sin fin', desc: 'Gana una expedición en peligro 5.', glifo: 'luna', ceniza: 200, hecho: (d) => d.exito && d.exp.cfg.peligro >= 5 },
  { id: 'mutado', nombre: 'Masoquista', desc: 'Gana con 3 mutadores o más.', glifo: 'gota', ceniza: 100, hecho: (d) => d.exito && d.exp.cfg.mutadores.length >= 3 },
  { id: 'intacto', nombre: 'Sin un rasguño', desc: 'Gana una expedición sin caer ni una vez.', glifo: 'escudo', ceniza: 80, hecho: (d) => d.exito && d.j.resumen.caidas === 0 },
  { id: 'evolucion', nombre: 'Forjado en sangre', desc: 'Evoluciona un arma.', glifo: 'yunque', ceniza: 40, hecho: (d) => evoluciono(d.j) },
  { id: 'tres_sobrecargas', nombre: 'Al rojo vivo', desc: 'Ponle las tres sobrecargas a un arma.', glifo: 'llama', ceniza: 40, hecho: (d) => d.j.armas.some((a) => a.sobrecargas.length >= 3) },
  { id: 'arsenal_lleno', nombre: 'Armado hasta los dientes', desc: 'Lleva cuatro armas a la vez.', glifo: 'espada', ceniza: 20, hecho: (d) => d.j.armas.length >= 4 },
  { id: 'nivel_35', nombre: 'Leyenda de la noche', desc: 'Llega al nivel 35 en una expedición.', glifo: 'alma', ceniza: 80, hecho: (d) => d.j.nivel >= 35 },
  { id: 'rico', nombre: 'Bolsillos llenos', desc: 'Junta 600 de oro en una expedición.', glifo: 'oro', ceniza: 40, hecho: (d) => d.j.resumen.oro >= 600 },
  { id: 'reliquias', nombre: 'Relicario', desc: 'Lleva tres reliquias en una expedición.', glifo: 'caliz', ceniza: 60, hecho: (d) => d.j.reliquias.length >= 3 },
  { id: 'ejecutor', nombre: 'Sin piedad', desc: 'Ejecuta 300 enemigos en una expedición.', glifo: 'hacha', ceniza: 40, hecho: (d) => d.j.resumen.ejecuciones >= 300 },
  { id: 'levantador', nombre: 'Nadie se queda', desc: 'Levanta a 10 compañeros caídos (en total).', glifo: 'mano', ceniza: 50, hecho: (d) => c(d.p).levantados >= 10, avance: (p) => Math.min(1, c(p).levantados / 10) },
  { id: 'en_grupo', nombre: 'Hermandad', desc: 'Termina una expedición con alguien más.', glifo: 'mano', ceniza: 30, hecho: (d) => d.jugadores >= 2 },
  { id: 'cuatro', nombre: 'La compañía completa', desc: 'Gana una expedición siendo cuatro.', glifo: 'mano', ceniza: 100, hecho: (d) => d.exito && d.jugadores >= 4 },
  { id: 'veterano', nombre: 'Veterano', desc: 'Sube una clase a maestría 5.', glifo: 'amuleto', ceniza: 60, hecho: (d) => Object.values(d.p.maestria).some((x) => nivelMaestria(x ?? 0).nivel >= 5) },
  { id: 'todas_clases', nombre: 'Mil caras', desc: 'Sube 6 clases distintas a maestría 1.', glifo: 'corona', ceniza: 120,
    hecho: (d) => CLASES_ORDEN.filter((k) => nivelMaestria(d.p.maestria[k] ?? 0).nivel >= 1).length >= 6 },
  { id: 'mil_excavadas', nombre: 'Ni la roca me para', desc: 'Excava 3 000 bloques (en total).', glifo: 'pico', ceniza: 80, hecho: (d) => c(d.p).excavadas >= 3000, avance: (p) => Math.min(1, c(p).excavadas / 3000) },
  { id: 'diez_mil', nombre: 'Marea de huesos', desc: 'Acaba con 20 000 enemigos (en total).', glifo: 'calavera', ceniza: 100, hecho: (d) => c(d.p).muertes >= 20000, avance: (p) => Math.min(1, c(p).muertes / 20000) },
];

export const LOGRO: Record<string, DefLogro> = Object.fromEntries(LOGROS.map((l) => [l.id, l]));

/** Qué clase abre cada logro. */
export const CLASE_DE_LOGRO: Record<string, IdClase> = Object.fromEntries(
  CLASES_ORDEN.filter((k) => CLASES[k].logro).map((k) => [CLASES[k].logro!, k]),
);

/** Revisa los logros nuevos, aplica sus premios y devuelve los que se ganaron ahora. */
export function revisarLogros(d: DatosLogro): DefLogro[] {
  const nuevos: DefLogro[] = [];
  for (const l of LOGROS) {
    if (d.p.logros.includes(l.id)) continue;
    let ok = false;
    try {
      ok = l.hecho(d);
    } catch {
      ok = false;
    }
    if (!ok) continue;
    d.p.logros.push(l.id);
    d.p.ceniza += l.ceniza;
    d.p.cenizaTotal += l.ceniza;
    nuevos.push(l);
  }
  aplicarDesbloqueos(d.p);
  return nuevos;
}

/** Clases, biomas y armas que tocan según los logros (idempotente). */
export function aplicarDesbloqueos(p: ProgresoSangre) {
  for (const id of p.logros) {
    const k = CLASE_DE_LOGRO[id];
    if (k && !p.clases.includes(k)) p.clases.push(k);
  }
  const b = (x: IdBioma) => {
    if (!p.biomas.includes(x)) p.biomas.push(x);
  };
  if (p.logros.includes('gana_cementerio')) b('minas');
  if (p.logros.includes('gana_catacumbas')) b('abadia');
  if (p.logros.includes('gana_minas') && p.logros.includes('gana_abadia')) b('castillo');
  p.biomas.sort((a, c2) => BIOMAS_ORDEN.indexOf(a) - BIOMAS_ORDEN.indexOf(c2));
  const arma = (x: string) => {
    if (!p.comunes.includes(x)) p.comunes.push(x);
  };
  if (p.logros.includes('primer_jefe')) arma('sierra');
  if (p.logros.includes('gana_castillo')) {
    arma('arco_largo');
    arma('ira_cielo');
  }
}
