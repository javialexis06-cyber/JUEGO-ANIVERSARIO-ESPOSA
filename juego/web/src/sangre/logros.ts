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
    hecho: (d) => d.exito && !d.exp.cfg.contrato && d.exp.cfg.bioma === 'cementerio' },
  { id: 'gana_catacumbas', nombre: 'Silencio en las criptas', desc: 'Gana una expedición en Las Catacumbas.', glifo: 'calavera', ceniza: 50, premio: 'Desbloquea La Abadía en Llamas',
    hecho: (d) => d.exito && !d.exp.cfg.contrato && d.exp.cfg.bioma === 'catacumbas' },
  { id: 'gana_minas', nombre: 'Veta roja', desc: 'Gana una expedición en Las Minas de Sangre.', glifo: 'cristal', ceniza: 60, premio: 'Desbloquea El Castillo del Conde (con la Abadía)',
    hecho: (d) => d.exito && !d.exp.cfg.contrato && d.exp.cfg.bioma === 'minas' },
  { id: 'gana_abadia', nombre: 'Ceniza y vitral', desc: 'Gana una expedición en La Abadía en Llamas.', glifo: 'cruz', ceniza: 60, premio: 'Desbloquea El Castillo del Conde (con las Minas)',
    hecho: (d) => d.exito && !d.exp.cfg.contrato && d.exp.cfg.bioma === 'abadia' },
  { id: 'gana_castillo', nombre: 'Amanecer', desc: 'Derrota al Conde Sangrevil en su castillo.', glifo: 'sol', ceniza: 120, premio: 'Desbloquea el arco largo y la ira del cielo',
    hecho: (d) => d.exito && !d.exp.cfg.contrato && d.exp.cfg.bioma === 'castillo' },
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
  { id: 'anomalo', nombre: 'Lo nunca visto', desc: 'Gana una expedición anómala.', glifo: 'dado', ceniza: 80, hecho: (d) => d.exito && !!d.exp.cfg.anomalia },
  { id: 'contrato', nombre: 'Trato hecho', desc: 'Gana un contrato del día o de la semana.', glifo: 'pergamino', ceniza: 60, hecho: (d) => d.exito && !!d.exp.cfg.contrato },
  { id: 'union', nombre: 'Dos en uno', desc: 'Une dos armas en una sola.', glifo: 'cadena', ceniza: 60, hecho: (d) => d.j.armas.some((a) => !!ARMAS[a.id]?.union) },
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

// ------------------------------------------------------------------------------------------------- Reliquias por hitos
// Sangre y Ceniza 2 (L6, como los artefactos de Deep Rock): las reliquias nuevas solo salen en los cofres cuando la
// cuenta cumplió su proeza (algunas, desde el comienzo). Se revisan al terminar cada expedición, con lo que midió el
// jugador en ella (`j.resumen`) y las cifras de la cuenta (`p.cifras`, ya sumadas).
export interface DefHito {
  desc: string;
  hecho: (d: DatosLogro) => boolean;
  /** Para la barra de avance (0-1), si se puede medir de a poquitos en la cuenta. */
  avance?: (p: ProgresoSangre) => number;
}
const r = (d: DatosLogro) => d.j.resumen;
const bits = (n: number) => {
  let k = 0;
  for (; n; n &= n - 1) k++;
  return k;
};
export const HITOS_RELIQUIA: Record<string, DefHito> = {
  herradura_vieja: { desc: 'Vuelve a tirar 5 veces en una expedición.', hecho: (d) => (r(d).tiradas ?? 0) >= 5 },
  bandolera: { desc: 'Llega a +75 % de velocidad de ataque.', hecho: (d) => (r(d).cadMax ?? 0) >= 0.75 },
  grimorio_olvidado: { desc: 'Llega al nivel 50 en una expedición.', hecho: (d) => d.j.nivel >= 50 },
  grasa_armadura: { desc: 'Esquiva 100 golpes en una expedición.', hecho: (d) => (r(d).esquivas ?? 0) >= 100 },
  tasajo: { desc: 'Llega a 300 de vida máxima.', hecho: (d) => (r(d).vidaMax ?? 0) >= 300 },
  cinto_brasas: { desc: 'Haz 250 000 de daño de fuego en una expedición.', hecho: (d) => (r(d).danoFuego ?? 0) >= 250_000 },
  cinto_escarcha: { desc: 'Haz 100 000 de daño de hielo en una expedición.', hecho: (d) => (r(d).danoHielo ?? 0) >= 100_000 },
  iman_gremio: { desc: 'Recoge 2 000 almas en una expedición.', hecho: (d) => r(d).almas >= 2000 },
  diario_difunto: { desc: 'Pierde 3 expediciones.', hecho: (d) => d.p.cifras.expediciones - d.p.cifras.victorias >= 3,
    avance: (p) => Math.min(1, (p.cifras.expediciones - p.cifras.victorias) / 3) },
  bula_obispo: { desc: 'Gasta 2 500 de oro en la Forja (en total).', hecho: (d) => d.p.cifras.oroGastado >= 2500, avance: (p) => Math.min(1, p.cifras.oroGastado / 2500) },
  varita_zahori: { desc: 'Junta 250 de oro en una expedición.', hecho: (d) => r(d).oro >= 250 },
  queso_podrido: { desc: 'Tumba 3 bichos del botín en una expedición.', hecho: (d) => (r(d).botin ?? 0) >= 3 },
  botas_salto: { desc: 'Excava 200 rocas en una expedición.', hecho: (d) => r(d).excavadas >= 200 },
  navaja_multiusos: { desc: 'Haz 5 tipos de daño en una expedición (físico, fuego, sagrado, veneno, sangre, sombra, hielo).', hecho: (d) => bits(r(d).tipos ?? 0) >= 5 },
  dado_tahur: { desc: 'Gasta 8 000 de oro en la Forja (en total).', hecho: (d) => d.p.cifras.oroGastado >= 8000, avance: (p) => Math.min(1, p.cifras.oroGastado / 8000) },
  pico_largo: { desc: 'Excava 3 000 rocas (en total).', hecho: (d) => d.p.cifras.excavadas >= 3000, avance: (p) => Math.min(1, p.cifras.excavadas / 3000) },
  hierro_salmuera: { desc: 'Haz 1 337 de daño de un solo golpe.', hecho: (d) => (r(d).golpeMax ?? 0) >= 1337 },
  puntas_acero: { desc: 'Dispara 50 000 proyectiles (en total).', hecho: (d) => d.p.cifras.proyectiles >= 50_000, avance: (p) => Math.min(1, p.cifras.proyectiles / 50_000) },
  tripode: { desc: 'Tumba 300 muertos sin moverte en una expedición.', hecho: (d) => (r(d).quietoMuertes ?? 0) >= 300 },
  costra: { desc: 'Llega a 30 de armadura.', hecho: (d) => (r(d).armMax ?? 0) >= 30 },
  monoculo: { desc: 'Llega a 50 % de crítico.', hecho: (d) => (r(d).critMax ?? 0) >= 0.5 },
  galleta_monje: { desc: 'Cúrate 1 500 de vida en una expedición.', hecho: (d) => (r(d).curado ?? 0) >= 1500 },
  cicatriz: { desc: 'Mata a un jefe con menos de 30 de vida.', hecho: (d) => (r(d).cicatriz ?? 0) > 0 },
  engranaje_relojero: { desc: 'Lleva 8 sobrecargas a la vez en una expedición.', hecho: (d) => d.j.armas.reduce((n, a) => n + a.sobrecargas.length, 0) >= 8 },
};

/** Las reliquias que se abrieron en esta expedición (y las de siempre, la primera vez). */
export function revisarReliquias(d: DatosLogro): string[] {
  const nuevas: string[] = [];
  for (const [id, h] of Object.entries(HITOS_RELIQUIA)) {
    if (d.p.reliquias.includes(id)) continue;
    let ok = false;
    try {
      ok = h.hecho(d);
    } catch {
      ok = false;
    }
    if (!ok) continue;
    d.p.reliquias.push(id);
    nuevas.push(id);
  }
  return nuevas;
}
