/** Reloj real en milisegundos, independiente del reloj acelerado del mundo. Sin muerte animal. */
export const HORA = 3_600_000;
export const AVISO_CUIDADOS_MS = 24 * HORA;
export const LIMITE_CUIDADOS_MS = 48 * HORA;
export const HUMEDAD_CULTIVO_MS = 48 * HORA;
export type ComfortMethod = 'acariciar' | 'musica' | 'cuento' | 'cepillar';
export type AnimalCare = {
  lastFedAt: number;
  lastLovedAt: number;
  lastEvaluatedAt: number;
  illnessSince: number | null;
  depressionSince: number | null;
  lastComfortMethod: ComfortMethod | null;
};
export type CropCare = {
  plantedAt: number;
  lastWateredAt: number | null;
  lastEvaluatedAt: number;
  /** Puntos de crecimiento por jornada; nombres conservados para compatibilidad del guardado. */
  grownMs: number;
  growthMs: number;
  status: 'creciendo' | 'maduro' | 'arruinado';
  maturedAt: number | null;
  ruinedAt: number | null;
};

function tiempo(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('El reloj requiere un timestamp finito no negativo.');
  return value;
}

function reloj(now: number, previous: number): number {
  // Cambiar el reloj hacia atrás nunca resta edad ni recupera recursos.
  return Math.max(tiempo(now), tiempo(previous));
}

function validarAnimal(state: AnimalCare): void {
  tiempo(state.lastFedAt); tiempo(state.lastLovedAt); tiempo(state.lastEvaluatedAt);
  if (state.lastFedAt > state.lastEvaluatedAt || state.lastLovedAt > state.lastEvaluatedAt) throw new RangeError('Fechas de cuidado incoherentes.');
  if (state.illnessSince !== null) tiempo(state.illnessSince);
  if (state.depressionSince !== null) tiempo(state.depressionSince);
}

export function crearCuidado(now: number): AnimalCare {
  tiempo(now);
  return { lastFedAt: now, lastLovedAt: now, lastEvaluatedAt: now, illnessSince: null, depressionSince: null, lastComfortMethod: null };
}

/** Conserva enfermedad y depresión hasta una atención médica explícita. */
export function reconciliarAnimal(state: AnimalCare, now: number): AnimalCare {
  validarAnimal(state);
  const at = reloj(now, state.lastEvaluatedAt);
  return {
    ...state,
    lastEvaluatedAt: at,
    illnessSince: state.illnessSince ?? (at - state.lastFedAt >= LIMITE_CUIDADOS_MS ? state.lastFedAt + LIMITE_CUIDADOS_MS : null),
    depressionSince: state.depressionSince ?? (at - state.lastLovedAt >= LIMITE_CUIDADOS_MS ? state.lastLovedAt + LIMITE_CUIDADOS_MS : null),
  };
}

export function estadoAnimal(state: AnimalCare, now: number) {
  const s = reconciliarAnimal(state, now);
  const horasSinComida = (s.lastEvaluatedAt - s.lastFedAt) / HORA;
  const horasSinCarino = (s.lastEvaluatedAt - s.lastLovedAt) / HORA;
  const hambriento = horasSinComida >= 24, triste = horasSinCarino >= 24;
  const enfermo = s.illnessSince !== null, deprimido = s.depressionSince !== null;
  return {
    estado: (enfermo || deprimido ? 'enfermo' : hambriento || triste ? 'necesita_atencion' : 'sano') as 'sano' | 'necesita_atencion' | 'enfermo',
    hambriento, triste, enfermo, deprimido,
    puedeProducir: !enfermo && !deprimido && !hambriento,
    horasSinComida, horasSinCarino,
  };
}

export function alimentar(state: AnimalCare, now: number): AnimalCare {
  const s = reconciliarAnimal(state, now);
  return { ...s, lastFedAt: s.lastEvaluatedAt };
}

export function consentir(state: AnimalCare, method: ComfortMethod, now: number): AnimalCare {
  if (!['acariciar', 'musica', 'cuento', 'cepillar'].includes(method)) throw new TypeError('Método de cariño desconocido.');
  const s = reconciliarAnimal(state, now);
  return { ...s, lastLovedAt: s.lastEvaluatedAt, lastComfortMethod: method };
}

/** Atención veterinaria completa: el motor valida antes el precio y la disponibilidad del médico. */
export function curar(state: AnimalCare, now: number): AnimalCare {
  const s = reconciliarAnimal(state, now);
  return { ...s, illnessSince: null, depressionSince: null, lastFedAt: s.lastEvaluatedAt, lastLovedAt: s.lastEvaluatedAt };
}

function validarCultivo(state: CropCare): void {
  tiempo(state.plantedAt); tiempo(state.lastEvaluatedAt); tiempo(state.grownMs);
  if (!Number.isFinite(state.growthMs) || state.growthMs <= 0) throw new RangeError('El tiempo de crecimiento debe ser positivo.');
  if (state.lastWateredAt !== null) tiempo(state.lastWateredAt);
  if (state.lastEvaluatedAt < state.plantedAt || (state.lastWateredAt !== null && (state.lastWateredAt < state.plantedAt || state.lastWateredAt > state.lastEvaluatedAt))) {
    throw new RangeError('Fechas de cultivo incoherentes.');
  }
  if (!['creciendo', 'maduro', 'arruinado'].includes(state.status)) throw new TypeError('Estado de cultivo desconocido.');
}

/** La siembra empieza seca salvo que el llamador haya realizado y cobrado también el riego. */
export function crearCultivo(growthMs: number, now: number, regado = false): CropCare {
  tiempo(now);
  const state: CropCare = { plantedAt: now, lastWateredAt: regado ? now : null, lastEvaluatedAt: now, grownMs: 0, growthMs, status: 'creciendo', maturedAt: null, ruinedAt: null };
  validarCultivo(state);
  return state;
}

/** El reloj real solo evalúa sequía; el progreso pertenece a la jornada de juego. */
export function reconciliarCultivo(state: CropCare, now: number): CropCare {
  validarCultivo(state);
  const at = reloj(now, state.lastEvaluatedAt);
  if (state.status !== 'creciendo') return { ...state, lastEvaluatedAt: at };
  const dryAt = (state.lastWateredAt ?? state.plantedAt) + HUMEDAD_CULTIVO_MS;
  if (at >= dryAt) return { ...state, lastEvaluatedAt: at, status: 'arruinado', ruinedAt: dryAt };
  return { ...state, lastEvaluatedAt: at };
}

/** Un paso lógico al cerrar el día. El motor exige también riego en esta jornada. */
export function avanzarCultivoDia(state: CropCare, paso: number, now: number): CropCare {
  if (!Number.isFinite(paso) || paso <= 0) throw new RangeError('El paso de crecimiento debe ser positivo.');
  const s = reconciliarCultivo(state, now);
  if (s.status !== 'creciendo' || s.lastWateredAt === null) return s;
  const grownMs = Math.min(s.growthMs, s.grownMs + paso);
  return grownMs === s.growthMs
    ? { ...s, grownMs, status: 'maduro', maturedAt: s.lastEvaluatedAt }
    : { ...s, grownMs };
}

export function regarCultivo(state: CropCare, now: number): CropCare {
  const s = reconciliarCultivo(state, now);
  return s.status === 'creciendo' ? { ...s, lastWateredAt: s.lastEvaluatedAt } : s;
}

export function estadoCultivo(state: CropCare, now: number) {
  const s = reconciliarCultivo(state, now);
  return {
    status: s.status,
    progreso: Math.min(1, s.grownMs / s.growthMs),
    necesitaAgua: s.status === 'creciendo' && (s.lastWateredAt === null || s.lastEvaluatedAt - s.lastWateredAt >= AVISO_CUIDADOS_MS),
    horasHastaSequia: s.status === 'creciendo' ? Math.max(0, ((s.lastWateredAt ?? s.plantedAt) + HUMEDAD_CULTIVO_MS - s.lastEvaluatedAt) / HORA) : null,
  };
}
