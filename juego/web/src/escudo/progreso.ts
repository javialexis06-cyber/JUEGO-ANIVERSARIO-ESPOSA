// El progreso del Escudo, guardado en el aparato (localStorage): estrellas por nivel, la mejor oleada del infinito y
// las escenas vistas. Y el recibo de la misión P23 para la granja (`escudo-mision-P23`, ver docs/sistemas/escudo.md).
import { NIVELES } from './datos';

export interface Progreso {
  v: 1;
  /** Mejores estrellas por nivel (0 = no ganado). */
  estrellas: Record<string, number>;
  /** Mejor oleada aguantada en el infinito. */
  infinito: number;
  inicioVisto: boolean;
  finalVisto: boolean;
  /** Oleada de la tarjeta de bienvenida que ya se explicó (los consejos salen una vez). */
  consejos: string[];
  velocidad: 1 | 2;
}

const CLAVE = 'escudo-progreso';
const CLAVE_AMIGO = 'amigo-escudo-progreso';
export const CLAVE_MISION = 'escudo-mision-P23';

function clave(amigo: boolean) {
  return amigo ? CLAVE_AMIGO : CLAVE;
}

/** Lee y normaliza (lo dañado o desconocido se descarta sin romper). */
export function leerProgreso(amigo: boolean): Progreso {
  let x: Partial<Progreso> | null = null;
  try { x = JSON.parse(localStorage.getItem(clave(amigo)) ?? 'null'); } catch { x = null; }
  const ids = new Set(NIVELES.map((n) => n.id));
  const estrellas: Record<string, number> = {};
  if (x && typeof x.estrellas === 'object' && x.estrellas) {
    for (const [k, v] of Object.entries(x.estrellas)) if (ids.has(k) && Number.isInteger(v) && v >= 0 && v <= 3) estrellas[k] = v;
  }
  return {
    v: 1, estrellas,
    infinito: Number.isInteger(x?.infinito) && x!.infinito! >= 0 ? x!.infinito! : 0,
    inicioVisto: !!x?.inicioVisto, finalVisto: !!x?.finalVisto,
    consejos: Array.isArray(x?.consejos) ? x!.consejos!.filter((c) => typeof c === 'string').slice(0, 50) : [],
    velocidad: x?.velocidad === 2 ? 2 : 1,
  };
}

export function guardarProgreso(amigo: boolean, p: Progreso): boolean {
  try { localStorage.setItem(clave(amigo), JSON.stringify(p)); return true; } catch { return false; }
}

/** ¿Se puede jugar este nivel? (el primero siempre; los demás al ganar el anterior). */
export function desbloqueado(p: Progreso, i: number) {
  return i === 0 || (p.estrellas[NIVELES[i - 1].id] ?? 0) > 0;
}

export function totalEstrellas(p: Progreso) {
  return Object.values(p.estrellas).reduce((a, b) => a + b, 0);
}

/** La granja lee esto para dar por cumplida la batalla de P23. */
export function guardarMision(estrellas: number, fecha = Date.now()): boolean {
  try {
    localStorage.setItem(CLAVE_MISION, JSON.stringify({ v: 1, mision: 'P23', ganada: true, estrellas, fecha }));
    return true;
  } catch { return false; }
}

/** Una escritura fallida sigue pendiente, incluido el recibo de P23, hasta poder confirmarla. */
export class GuardadoEscudo {
  private progresoPendiente = false;
  private mision: { estrellas: number; fecha: number } | null = null;

  constructor(private amigo: boolean, private progreso: Progreso) {}

  get pendiente() { return this.progresoPendiente || this.mision !== null; }

  registrarMision(estrellas: number) {
    this.mision ??= { estrellas, fecha: Date.now() };
  }

  guardar(): boolean {
    this.progresoPendiente = !guardarProgreso(this.amigo, this.progreso);
    if (this.mision && guardarMision(this.mision.estrellas, this.mision.fecha)) this.mision = null;
    return !this.pendiente;
  }

  confirmar(): boolean { return !this.pendiente || this.guardar(); }
}
