// Piezas de comportamiento que comparten varias áreas: disparadores en línea recta y ráfagas del abono.
import type { MotorPvZ } from '../motor/motor';
import { ANCHO_COL } from '../motor/reglas';
import type { ComportamientoPlanta, Planta, TipoDano } from '../tipos';

/** Número de los datos de la planta (DefPlanta.datos) con un valor por defecto. */
export function dato(m: MotorPvZ, p: Planta, clave: string, porDefecto: number): number {
  return m.defPlanta(p.tipo).datos?.[clave] ?? porDefecto;
}

export interface OpcionesTirador {
  /** Tipo del proyectil para la vista ('guisante', 'guisanteHielo', 'espora'…). */
  proyectil: string;
  tipoDano?: TipoDano;
  efecto?: 'lento' | 'mantequilla';
  /** Proyectil de la ráfaga del abono (por defecto el mismo). */
  proyectilRafaga?: string;
}

/** Alcance en px desde el centro de la planta: `casillas` por delante de la suya (Infinity si no hay dato). */
export function alcanceTirador(m: MotorPvZ, p: Planta): number {
  const casillas = dato(m, p, 'alcance', 0);
  return casillas > 0 ? ANCHO_COL / 2 + casillas * ANCHO_COL : Infinity;
}

/** Dispara un proyectil recto con los datos de la planta. */
export function disparoDe(m: MotorPvZ, p: Planta, op: OpcionesTirador, tipo = op.proyectil, dano = dato(m, p, 'dano', 20)): void {
  const alcance = alcanceTirador(m, p);
  m.disparar(p, {
    tipo, dano, tipoDano: op.tipoDano ?? 'recto', efecto: op.efecto, efectoT: op.efecto ? dato(m, p, 'lento', 10) : undefined,
    xMax: Number.isFinite(alcance) ? p.x + alcance : undefined,
  });
}

/**
 * Empieza una ráfaga del abono: `n` proyectiles repartidos en `t` segundos, haya o no zombis (como en PvZ 2).
 * La planta brilla (invulnerable) mientras dura.
 */
export function empezarRafaga(p: Planta, n: number, t: number, extraBrillo = 0): void {
  p.datos.rafaga = n;
  p.datos.rafagaDt = t / n;
  p.datos.rafagaReloj = 0;
  p.abono = Math.max(p.abono, t + extraBrillo);
}

/** Avanza la ráfaga; devuelve true mientras dure (la planta no hace su ataque normal). */
export function pasoRafaga(m: MotorPvZ, p: Planta, dt: number, disparar: () => void): boolean {
  if (!(p.datos.rafaga > 0)) return false;
  p.datos.rafagaReloj -= dt;
  while (p.datos.rafagaReloj <= 0 && p.datos.rafaga > 0) {
    disparar();
    p.datos.rafaga--;
    p.datos.rafagaReloj += p.datos.rafagaDt;
  }
  m.ponerEstado(p, 'ataca');
  return true;
}

/**
 * Disparador en línea recta de PvZ: cada `intervalo` (1,5 s menos un azar de hasta 0,14 s) mira si hay un zombi
 * en su fila, delante y a su alcance; si lo hay, dispara (`disparos` seguidos separados `separacion` s). Si duerme,
 * no hace nada. El abono de cada planta se arma aparte con `empezarRafaga`.
 */
export function crearTirador(op: OpcionesTirador, extra: Partial<ComportamientoPlanta> = {}): ComportamientoPlanta {
  return {
    iniciar(m, p) {
      p.reloj = m.azar.rango(0, dato(m, p, 'intervalo', 1.5));
      extra.iniciar?.(m, p);
    },
    paso(m, p, dt) {
      if (p.dormida) {
        m.ponerEstado(p, 'dormida');
        return;
      }
      if (extra.paso) {
        extra.paso(m, p, dt);
        if (p.datos.ocupada) return;
      }
      if (pasoRafaga(m, p, dt, () => disparoDe(m, p, op, op.proyectilRafaga ?? op.proyectil))) return;
      if (p.datos.pendientes > 0) {
        p.datos.tPendiente -= dt;
        if (p.datos.tPendiente <= 0) {
          disparoDe(m, p, op);
          p.datos.pendientes--;
          p.datos.tPendiente = dato(m, p, 'separacion', 0.2);
        }
      }
      p.reloj -= dt;
      if (p.reloj <= 0) {
        p.reloj += dato(m, p, 'intervalo', 1.5) - m.azar.rango(0, 0.14);
        if (p.reloj < 0) p.reloj = 0;
        if (m.objetivoRecto(p, alcanceTirador(m, p))) {
          disparoDe(m, p, op);
          p.datos.pendientes = dato(m, p, 'disparos', 1) - 1;
          p.datos.tPendiente = dato(m, p, 'separacion', 0.2);
          p.estado = 'ataca';
          p.tEstado = 0;
        }
      }
      if (p.estado !== 'quieto' && p.tEstado > 0.6) m.ponerEstado(p, 'quieto');
    },
    abono: extra.abono,
    alDanar: extra.alDanar,
    alMorir: extra.alMorir,
    mordible: extra.mordible,
  };
}
