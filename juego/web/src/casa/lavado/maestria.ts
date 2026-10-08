// La maestría de cada disfraz (como la de las clases de Deep Rock Galactic: Survivor): cada partida le suma puntos
// al disfraz con que se jugó (por aguantar, limpiar, evolucionar armas, tumbar jefes y ganar) y cada nivel trae su
// premio: gotas doradas o un bono que tiene SOLO ese disfraz. Son diez niveles; el 5 le pone marco de plata al
// retrato y el 10, marco de oro. Este archivo no importa nada de la casa ni del motor (lo usan el progreso, el motor,
// el menú y la pantalla final).
import type { Rol, Stat } from './tipos';

/** Puntos que hay que juntar (en total) para cada nivel: del 1 al 10. */
export const NIVELES_MAESTRIA = [10, 25, 45, 70, 100, 140, 190, 250, 320, 400];
export const MAESTRIA_MAX = NIVELES_MAESTRIA.length;

export interface PremioMaestria {
  nivel: number;
  /** Lo que dice la lista del menú y la pantalla final. */
  texto: string;
  /** Cortico, para la rejilla del menú. */
  corto: string;
  oro?: number;
  /** Bono para siempre, solo con este disfraz (la vida es en porcentaje, como en la tienda). */
  stat?: Stat;
  paso?: number;
  marco?: 'plata' | 'oro';
}

export const PREMIOS_MAESTRIA: PremioMaestria[] = [
  { nivel: 1, texto: '100 gotas doradas', corto: '100', oro: 100 },
  { nivel: 2, texto: '+5 % de experiencia con este disfraz', corto: '+5 % exp.', stat: 'crecimiento', paso: 0.05 },
  { nivel: 3, texto: '200 gotas doradas', corto: '200', oro: 200 },
  { nivel: 4, texto: '+5 % de daño con este disfraz', corto: '+5 % daño', stat: 'poder', paso: 0.05 },
  { nivel: 5, texto: '+1 para volver a tirar con este disfraz y marco de plata', corto: '+1 tirar', stat: 'tirar', paso: 1, marco: 'plata' },
  { nivel: 6, texto: '300 gotas doradas', corto: '300', oro: 300 },
  { nivel: 7, texto: '+5 % de área con este disfraz', corto: '+5 % área', stat: 'area', paso: 0.05 },
  { nivel: 8, texto: '+10 % de vida con este disfraz', corto: '+10 % vida', stat: 'vida', paso: 0.1 },
  { nivel: 9, texto: '500 gotas doradas', corto: '500', oro: 500 },
  { nivel: 10, texto: '+1 de armadura con este disfraz y marco de oro', corto: '+1 armadura', stat: 'armadura', paso: 1, marco: 'oro' },
];

/** Lo que se necesita de una partida para sumar puntos (es parte del resumen de la partida). */
export interface PartidaMaestria {
  segundos: number;
  eliminados: number;
  gano: boolean;
  evoluciones: readonly unknown[];
  jefes: readonly unknown[];
}

/** Los puntos de una partida: 1 por minuto aguantado, 1 por cada 500 mugrosos, 1 por arma evolucionada, 1 por jefe
 *  y 5 por llegar a los 30:00. Una partida de 15 minutos da unos 22; una ganada, unos 55. */
export function puntosDePartida(r: PartidaMaestria): number {
  const n = Math.floor(r.segundos / 60) + Math.floor(r.eliminados / 500) + r.evoluciones.length + r.jefes.length + (r.gano ? 5 : 0);
  return Math.max(0, Math.min(200, n));
}

export function nivelMaestria(puntos: number): number {
  let n = 0;
  while (n < MAESTRIA_MAX && puntos >= NIVELES_MAESTRIA[n]) n++;
  return n;
}

/** Para la barrita: en qué nivel va, desde cuántos puntos y hasta cuántos (en el último, la barra queda llena). */
export function barraMaestria(puntos: number) {
  const nivel = nivelMaestria(puntos);
  const desde = nivel ? NIVELES_MAESTRIA[nivel - 1] : 0;
  const hasta = NIVELES_MAESTRIA[Math.min(nivel, MAESTRIA_MAX - 1)];
  const parte = nivel >= MAESTRIA_MAX ? 1 : Math.max(0, Math.min(1, (puntos - desde) / (hasta - desde)));
  return { nivel, desde, hasta, parte, faltan: nivel >= MAESTRIA_MAX ? 0 : hasta - puntos };
}

/** Los bonos que trae el nivel de maestría (para el motor). */
export function bonosMaestria(nivel: number): { stats: Partial<Record<Stat, number>>; vidaPct: number } {
  const stats: Partial<Record<Stat, number>> = {};
  let vidaPct = 0;
  for (const p of PREMIOS_MAESTRIA) {
    if (p.nivel > nivel || !p.stat || !p.paso) continue;
    if (p.stat === 'vida') vidaPct += p.paso;
    else stats[p.stat] = (stats[p.stat] ?? 0) + p.paso;
  }
  return { stats, vidaPct };
}

export const marcoDe = (nivel: number): '' | 'plata' | 'oro' => (nivel >= 10 ? 'oro' : nivel >= 5 ? 'plata' : '');

/** Cómo se le dice según el nivel (Maestro o Maestra según de quién es el disfraz). */
export function tituloMaestria(nivel: number, rol: Rol): string {
  if (nivel >= MAESTRIA_MAX) return rol === 'el' ? 'Maestro' : 'Maestra';
  if (nivel >= 5) return rol === 'el' ? 'Experto' : 'Experta';
  if (nivel >= 1) return 'Aprendiz';
  return 'Sin estrenar';
}

/** Lo que pasó con la maestría en una partida (para la pantalla final). */
export interface SubidaMaestria {
  disfraz: string;
  puntos: number;
  antes: number;
  despues: number;
  /** Puntos que tiene ahora (para la barrita). */
  total: number;
  premios: PremioMaestria[];
}
