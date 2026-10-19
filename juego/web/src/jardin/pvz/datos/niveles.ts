// Índice de niveles de la aventura. Completa lo que depende del orden: las plantas disponibles (la inicial más los
// premios de los niveles anteriores), las ranuras y si hay pantalla de selección (más plantas que ranuras).
import { RANURAS_INICIALES } from '../motor/reglas';
import type { DefNivel, IdPlanta } from '../tipos';
import { AREAS_DATOS } from './areas';

/** Planta con la que se empieza la aventura. */
export const PLANTA_INICIAL: IdPlanta = 'lanzaguisantes';

function completar(): DefNivel[] {
  const base = AREAS_DATOS.flatMap((a) => a.niveles).sort((a, b) => a.mundo - b.mundo || a.numero - b.numero);
  const ganadas: IdPlanta[] = [PLANTA_INICIAL];
  return base.map((n) => {
    const plantasDisponibles = n.plantasDisponibles ?? [...ganadas];
    const ranuras = n.ranuras ?? RANURAS_INICIALES;
    const seleccion = n.seleccion ?? (!n.cinta && plantasDisponibles.length > ranuras);
    if (n.premio?.planta && !ganadas.includes(n.premio.planta)) ganadas.push(n.premio.planta);
    return { ...n, plantasDisponibles, ranuras, seleccion };
  });
}

/** Niveles en orden de juego. */
export const NIVELES: readonly DefNivel[] = completar();

export const NIVEL: Record<string, DefNivel> = Object.create(null);
for (const n of NIVELES) NIVEL[n.id] = n;

export function nivelPorId(id: string): DefNivel | undefined {
  return Object.hasOwn(NIVEL, id) ? NIVEL[id] : undefined;
}

/** Posición en la aventura (0…) o −1. */
export function ordenNivel(id: string): number {
  return NIVELES.findIndex((n) => n.id === id);
}

/** Nivel que sigue (undefined al final de lo construido). */
export function siguienteNivel(id: string): DefNivel | undefined {
  const i = ordenNivel(id);
  return i >= 0 ? NIVELES[i + 1] : undefined;
}

/** Plantas ganadas al terminar un nivel (incluida la inicial). */
export function plantasTras(id: string): IdPlanta[] {
  const i = ordenNivel(id);
  const out: IdPlanta[] = [PLANTA_INICIAL];
  for (let k = 0; k <= i; k++) {
    const p = NIVELES[k].premio?.planta;
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}
