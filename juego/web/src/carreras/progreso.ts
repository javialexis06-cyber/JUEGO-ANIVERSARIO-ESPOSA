// Infinity representa un tiempo todavía no logrado; JSON lo guarda como null. Las claves antiguas se conservan.
import { guardarAparato, leerAparato } from '../sueltos/comun';
import type { Dificultad, IdPista } from './datos';

export interface RecordCarrera { mejor: number; vuelta: number; fantasma?: number[] }
export interface ProgresoCarreras {
  records: Partial<Record<IdPista, RecordCarrera>>;
  copas: Partial<Record<Dificultad, number>>;
  campeonatos: Record<string, number>;
  retos: Record<string, number>;
}
const clave = (amigo: boolean) => amigo ? 'amigo-carreras-progreso' : 'carreras-progreso';
const tiempo = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : Infinity;

export function normalizarProgreso(v: unknown): ProgresoCarreras {
  const p = (v && typeof v === 'object' ? v : {}) as Partial<ProgresoCarreras>;
  const records = Object.fromEntries(Object.entries(p.records ?? {}).filter(([, r]) => r && typeof r === 'object').map(([id, r]) => [id, {
    ...r, mejor: tiempo(r.mejor), vuelta: tiempo(r.vuelta),
    fantasma: Array.isArray(r.fantasma) && r.fantasma.length % 4 === 0 && r.fantasma.every(Number.isFinite) ? r.fantasma : undefined,
  }]));
  const copas = Object.fromEntries(Object.entries(p.copas ?? {}).filter(([, n]) => typeof n === 'number' && Number.isFinite(n) && n >= 0).map(([id, n]) => [id, Math.floor(n)]));
  const contadores = (v: unknown) => Object.fromEntries(Object.entries(v && typeof v === 'object' ? v : {}).filter(([k,n]) => k.length <= 100 && typeof n === 'number' && Number.isFinite(n) && n >= 0).map(([k,n]) => [k,Math.floor(n as number)]));
  const campeonatos = p.campeonatos ? contadores(p.campeonatos) : Object.fromEntries(Object.entries(copas).map(([d,n]) => [`clasica:${d}`,n]));
  return { records, copas, campeonatos, retos: contadores(p.retos) };
}
export function leerProgreso(amigo: boolean) { return normalizarProgreso(leerAparato(clave(amigo))); }

/** Mantiene el resultado pendiente hasta confirmar la escritura de la copia actual. */
export class GuardadoCarreras {
  pendiente = false;
  constructor(private amigo: boolean, readonly progreso = leerProgreso(amigo)) {}
  guardar(): boolean { const ok = guardarAparato(clave(this.amigo), this.progreso); this.pendiente = !ok; return ok; }
  confirmar(): boolean { return !this.pendiente || this.guardar(); }
}
