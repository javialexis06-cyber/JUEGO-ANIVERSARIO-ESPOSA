// Guardar la bajada del modo infinito a mitad de partida (I): al salir de la Forja, solo cuando se juega solo. Si el
// celular cierra el juego (o se acaba la batería), se sigue desde la etapa siguiente con todo lo que se llevaba.
import { Azar } from '../casa/lavado/azar';
import { ARMAS } from './datos/armas';
import type { Expedicion } from './expedicion';
import { ArmaJ } from './sim/jugador';
import type { ConfigExpedicion, PerfilJugador } from './tipos';

const CLAVE = 'sangre-bajada';
/** Lo del jugador que no se guarda (se rehace al empezar la etapa o viene del perfil). */
const SIN_COPIAR = new Set(['perfil', 'armas', 'x', 'y', 'vx', 'vy', 'pideTomar', 'remoto', 'mx', 'my', 'pideHabilidad', 'usa', 'excavando']);

export interface BajadaGuardada {
  v: 1;
  cfg: ConfigExpedicion;
  perfiles: PerfilJugador[];
  /** La última etapa superada (se sigue con la siguiente). */
  etapa: number;
  plan: Expedicion['plan'];
  resultados: Expedicion['resultados'];
  tiempo: number;
  renovadas: [number, number][];
  J: Record<string, unknown>[];
  t: number;
}

type ArmaGuardada = { id: string; nivel: number; xp: number; sobrecargas: string[]; danoTotal: number; pedidas: number };

export function guardarBajada(exp: Expedicion, perfiles: PerfilJugador[]) {
  try {
    const J = exp.J.map((j) => {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(j)) if (!SIN_COPIAR.has(k)) o[k] = v;
      o.armas = j.armas.map((a): ArmaGuardada => ({ id: a.id, nivel: a.nivel, xp: a.xp, sobrecargas: a.sobrecargas, danoTotal: a.danoTotal, pedidas: a.pedidas }));
      return o;
    });
    const datos: BajadaGuardada = {
      v: 1, cfg: exp.cfg, perfiles, etapa: exp.etapa, plan: exp.plan, resultados: exp.resultados, tiempo: exp.tiempo, renovadas: [...exp.renovadas], J,
      t: Date.now(),
    };
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // (sin espacio o sin permiso: esta vez no se guarda)
  }
}

/** La bajada guardada (o null si no hay o no sirve). */
export function leerBajada(): BajadaGuardada | null {
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as BajadaGuardada | null;
    if (!x || x.v !== 1 || !x.cfg?.infinito || !Array.isArray(x.perfiles) || x.perfiles.length !== 1 || !Array.isArray(x.J) || x.J.length !== 1) return null;
    if (!Number.isFinite(x.etapa) || x.etapa < 1 || !Array.isArray(x.plan) || !Array.isArray(x.resultados)) return null;
    return x;
  } catch {
    return null;
  }
}

export function borrarBajada() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // (nada)
  }
}

/** Pone en una expedición recién creada (con la misma configuración y perfiles) lo que se guardó. */
export function restaurarBajada(exp: Expedicion, d: BajadaGuardada) {
  exp.etapa = d.etapa;
  exp.plan = d.plan;
  exp.resultados = d.resultados;
  exp.tiempo = d.tiempo;
  exp.renovadas = new Map(d.renovadas);
  exp.az = new Azar((d.cfg.semilla + d.etapa * 7919) >>> 0);
  exp.J.forEach((j, i) => {
    const o = d.J[i];
    if (!o) return;
    const { armas, ...resto } = o as { armas?: ArmaGuardada[] };
    Object.assign(j, resto);
    const lista = (armas ?? []).filter((a) => ARMAS[a.id]).map((a) => Object.assign(new ArmaJ(a.id), {
      nivel: a.nivel, xp: a.xp, sobrecargas: [...a.sobrecargas], danoTotal: a.danoTotal, pedidas: a.pedidas,
    }));
    if (lista.length) j.armas = lista;
    j.recalcular();
  });
}
