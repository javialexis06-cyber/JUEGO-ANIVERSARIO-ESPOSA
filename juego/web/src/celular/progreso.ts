// El progreso de «Desaparecidos de Astra»: se guarda en el aparato (localStorage), caso por caso. Nada va a la casa:
// cada quien resuelve los casos en su teléfono.
import { guardarAparato, leerAparato } from '../sueltos/comun';
import type { Caso } from './tipos';

const CLAVE = 'celular-astra-v1';

export interface ProgresoCaso {
  /** Ya leyó el expediente y recibió el teléfono. */
  recibido: boolean;
  /** Candados abiertos ('bloqueo' y los de adentro). */
  abiertos: string[];
  /** Pistas anotadas en la libreta. */
  pistas: string[];
  /** Cosas ya vistas (para los avisos de «nuevo»). */
  vistos: string[];
  /** Cuántas ayudas destapó en cada etapa. */
  ayudas: Record<string, number>;
  /** Respuestas equivocadas al resolver. */
  errores: number;
  resuelto: boolean;
  estrellas: number;
  /** Pasos del tutorial que ya salieron. */
  tutorial: string[];
}

export interface Progreso {
  casos: Record<string, ProgresoCaso>;
  musica: boolean;
}

const nuevoCaso = (): ProgresoCaso => ({ recibido: false, abiertos: [], pistas: [], vistos: [], ayudas: {}, errores: 0, resuelto: false, estrellas: 0, tutorial: [] });

const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function normalizar(v: unknown): Progreso {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const casos: Record<string, ProgresoCaso> = {};
  const c0 = (o.casos && typeof o.casos === 'object' ? o.casos : {}) as Record<string, Record<string, unknown>>;
  for (const [id, c] of Object.entries(c0)) {
    if (!c || typeof c !== 'object') continue;
    const ayudas: Record<string, number> = {};
    for (const [k, n] of Object.entries((c.ayudas ?? {}) as Record<string, unknown>)) if (typeof n === 'number') ayudas[k] = Math.max(0, Math.min(5, n | 0));
    casos[id] = {
      recibido: !!c.recibido, abiertos: lista(c.abiertos), pistas: lista(c.pistas), vistos: lista(c.vistos), ayudas,
      errores: typeof c.errores === 'number' ? c.errores : 0, resuelto: !!c.resuelto,
      estrellas: typeof c.estrellas === 'number' ? Math.max(0, Math.min(3, c.estrellas)) : 0, tutorial: lista(c.tutorial),
    };
  }
  return { casos, musica: o.musica !== false };
}

export const progreso: Progreso = normalizar(leerAparato(CLAVE));
export let guardadoPendiente = false;

export function guardar(): boolean {
  const ok = guardarAparato(CLAVE, progreso);
  guardadoPendiente = !ok;
  return ok;
}

export function confirmarGuardado(): boolean { return !guardadoPendiente || guardar(); }

export function de(caso: Caso): ProgresoCaso {
  return (progreso.casos[caso.id] ??= nuevoCaso());
}

/** El caso se puede abrir si es el primero o si el anterior ya está resuelto. */
export function desbloqueado(casos: Caso[], i: number) {
  return i === 0 || !!progreso.casos[casos[i - 1].id]?.resuelto;
}

/** Las estrellas que se ganan: 3 menos los errores y las ayudas que dieron la respuesta (mínimo 1). */
export function estrellasDe(caso: Caso, p: ProgresoCaso) {
  const reveladas = caso.ayudas.filter((a) => (p.ayudas[a.etapa] ?? 0) >= a.textos.length).length;
  return Math.max(1, 3 - p.errores - reveladas);
}

export function reiniciar(caso: Caso) {
  const anterior = progreso.casos[caso.id];
  progreso.casos[caso.id] = nuevoCaso();
  if (guardar()) return true;
  // El teléfono abierto conserva la referencia al caso anterior si no se confirmó el reinicio.
  if (anterior) progreso.casos[caso.id] = anterior;
  else delete progreso.casos[caso.id];
  return false;
}
