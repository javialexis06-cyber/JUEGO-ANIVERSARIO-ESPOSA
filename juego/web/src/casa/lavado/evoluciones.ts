// Las recetas de evolución de «Lavarse la cara» y cómo va cada una para un jugador: qué arma, qué pide (una pasiva,
// u otra arma en las uniones), en qué se convierte y qué le falta. Lo usan el panel de la pausa («Mochila» y
// «Evoluciones») y la colección del menú. La regla es la del motor (`evolucionPosible`): el arma en su nivel máximo,
// lo que pide en la mochila y abrir un cofre después del minuto 10.
import { ARMAS, PASIVAS, maxNivelArma, pasivasDeEvo } from './armas';
import type { IdArma, IdPasiva } from './tipos';

export interface Receta {
  /** Las armas que se juntan (una, o dos en las uniones). */
  de: IdArma[];
  /** Las pasivas que pide (la de siempre, o la de más de algunas uniones). */
  pasivas: IdPasiva[];
  a: IdArma;
}

/** Todas las recetas, en el orden de las armas (las uniones, una sola vez). */
export const RECETAS: Receta[] = (() => {
  const l: Receta[] = [];
  for (const def of Object.values(ARMAS)) {
    const evo = def.evo;
    if (!evo || l.some((r) => r.a === evo.a)) continue;
    const de = evo.arma ? [def.id, evo.arma] : [def.id];
    l.push({ de, pasivas: pasivasDeEvo(def), a: evo.a });
  }
  return l;
})();

/** La receta en la que entra un arma (o null si no evoluciona). La del doble copito es la que lo vuelve triple, no
 *  la que lo hizo. */
export const recetaDeArma = (id: IdArma) => RECETAS.find((r) => r.de[0] === id) ?? RECETAS.find((r) => r.de.includes(id)) ?? null;
/** Las recetas que piden una pasiva. */
export const recetasDePasiva = (id: IdPasiva) => RECETAS.filter((r) => r.pasivas.includes(id));

export const MINUTO_EVOLUCION = 10;

/** Lo que el panel necesita saber del jugador (sirve el Jugador del motor tal cual). */
export interface Mochila {
  armas: { id: IdArma; nivel: number }[];
  pasivas: Map<IdPasiva, number>;
}

export type Paso = { tipo: 'arma' | 'pasiva'; id: IdArma | IdPasiva; tiene: boolean; nivel: number; max: number; listo: boolean };

export interface EstadoReceta {
  receta: Receta;
  pasos: Paso[];
  /** Ya tiene la evolución. */
  hecha: boolean;
  /** Tiene todo: falta abrir un cofre (después del minuto 10). */
  lista: boolean;
  /** Cuántos pasos tiene listos (para ordenar: las más cerca primero). */
  avance: number;
  /** Qué falta, en palabras. */
  falta: string;
}

export function estadoReceta(r: Receta, m: Mochila, t: number): EstadoReceta {
  const hecha = m.armas.some((a) => a.id === r.a);
  const pasos: Paso[] = [
    ...r.de.map((id): Paso => {
      const a = m.armas.find((x) => x.id === id);
      const max = maxNivelArma(id);
      return { tipo: 'arma', id, tiene: !!a, nivel: a?.nivel ?? 0, max, listo: !!a && a.nivel >= max };
    }),
    ...r.pasivas.map((id): Paso => {
      const n = m.pasivas.get(id) ?? 0;
      return { tipo: 'pasiva', id, tiene: n > 0, nivel: n, max: PASIVAS[id].max, listo: n > 0 };
    }),
  ];
  const lista = !hecha && pasos.every((p) => p.listo);
  const avance = pasos.filter((p) => p.listo).length + pasos.filter((p) => p.tiene && !p.listo).length * 0.5;
  let falta = '';
  if (hecha) falta = '¡Ya la tienes!';
  else if (lista) falta = t >= MINUTO_EVOLUCION * 60 ? '¡Lista! Abre un cofre para evolucionar' : `¡Lista! Abre un cofre después del minuto ${MINUTO_EVOLUCION}`;
  else {
    const partes: string[] = [];
    for (const p of pasos) {
      const nombre = p.tipo === 'arma' ? ARMAS[p.id as IdArma].nombre : PASIVAS[p.id as IdPasiva].nombre;
      if (!p.tiene) partes.push(p.tipo === 'arma' ? `conseguir ${nombre}` : PASIVAS[p.id as IdPasiva].escondida ? `encontrar ${nombre} (está escondido)` : `conseguir ${nombre} (con un nivel basta)`);
      else if (!p.listo) partes.push(`subir ${nombre} al nivel ${p.max} (va en ${p.nivel})`);
    }
    falta = `Falta ${partes.join(' y ')}`;
  }
  return { receta: r, pasos, hecha, lista, avance, falta };
}
