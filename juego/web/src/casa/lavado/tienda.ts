// La tienda de poderes permanentes (el «PowerUp» del original): se paga con gotas doradas y sirve para todas las
// partidas. Cada rango cuesta más que el anterior y todo sube un 5 % por cada compra que se haya hecho (el original
// sube 10 %, pensado para cientos de horas: aquí se llega a los 30 minutos en unas 8-10 buenas partidas); se puede
// pedir el reembolso completo y repartir de nuevo.
import type { Stat } from './tipos';

export interface DefPoder {
  id: Stat;
  nombre: string;
  desc: string;
  /** Lo que suma cada rango (la vida es en porcentaje). */
  paso: number;
  max: number;
  precio: number;
  /** Ícono: el de la pasiva que hace lo mismo (o uno propio). */
  icono: string;
  /** El logro que lo abre (si no, está desde el principio). */
  logro?: string;
}

export const PODERES: DefPoder[] = [
  { id: 'poder', nombre: 'Poder', desc: '+5 % de daño por rango', paso: 0.05, max: 5, precio: 100, icono: 'jabonFuerte' },
  { id: 'armadura', nombre: 'Armadura', desc: '+1 de armadura por rango', paso: 1, max: 3, precio: 300, icono: 'gorro' },
  { id: 'vida', nombre: 'Vida máxima', desc: '+10 % de vida por rango', paso: 0.1, max: 3, precio: 100, icono: 'crema' },
  { id: 'recuperacion', nombre: 'Recuperación', desc: '+0,1 de vida por segundo por rango', paso: 0.1, max: 5, precio: 100, icono: 'cremaNoche' },
  { id: 'enfriamiento', nombre: 'Recarga', desc: 'Las armas se recargan 2,5 % más rápido por rango', paso: 0.025, max: 2, precio: 450, icono: 'relojArena' },
  { id: 'area', nombre: 'Área', desc: '+5 % de área por rango', paso: 0.05, max: 2, precio: 150, icono: 'lupa' },
  { id: 'velocidad', nombre: 'Velocidad', desc: '+10 % de velocidad de los proyectiles', paso: 0.1, max: 2, precio: 150, icono: 'liga' },
  { id: 'duracion', nombre: 'Duración', desc: '+15 % de duración por rango', paso: 0.15, max: 2, precio: 150, icono: 'sales' },
  { id: 'cantidad', nombre: 'Cantidad', desc: '+1 proyectil en todas las armas', paso: 1, max: 1, precio: 1500, icono: 'espejoDoble' },
  { id: 'movimiento', nombre: 'Movimiento', desc: '+5 % de velocidad al caminar por rango', paso: 0.05, max: 2, precio: 150, icono: 'pantuflas' },
  { id: 'iman', nombre: 'Imán', desc: '+25 % de radio para recoger por rango', paso: 0.25, max: 2, precio: 150, icono: 'iman' },
  { id: 'suerte', nombre: 'Suerte', desc: '+10 % de suerte por rango', paso: 0.1, max: 3, precio: 300, icono: 'trebol' },
  { id: 'crecimiento', nombre: 'Crecimiento', desc: '+3 % de experiencia por rango', paso: 0.03, max: 5, precio: 450, icono: 'corona' },
  { id: 'codicia', nombre: 'Codicia', desc: '+10 % de gotas doradas por rango', paso: 0.1, max: 5, precio: 100, icono: 'alcancia' },
  { id: 'maldicion', nombre: 'Maldición', desc: '+10 % de enemigos más duros y rápidos (y más premio)', paso: 0.1, max: 5, precio: 800, icono: 'espejoRoto' },
  { id: 'revivir', nombre: 'Revivir', desc: 'Revives una vez cuando te tumban', paso: 1, max: 1, precio: 2500, icono: 'curita' },
  { id: 'tirar', nombre: 'Volver a tirar', desc: '+2 para cambiar las cartas al subir de nivel', paso: 2, max: 5, precio: 500, icono: 'tirar' },
  { id: 'saltar', nombre: 'Saltar', desc: '+2 para dejar pasar una subida de nivel (y ganar experiencia)', paso: 2, max: 5, precio: 50, icono: 'saltar' },
  { id: 'vetar', nombre: 'Vetar', desc: '+1 para sacar una carta de la partida para siempre', paso: 1, max: 5, precio: 50, icono: 'vetar' },
  // Versión 2
  { id: 'omni', nombre: 'Omni', desc: '+2 % de daño, velocidad, duración y área por rango', paso: 0.02, max: 5, precio: 350, icono: 'cajitaMusica' },
  { id: 'encanto', nombre: 'Encanto', desc: '+10 % de mugrosos por rango (más experiencia y más gotas)', paso: 0.1, max: 5, precio: 300, icono: 'velaAromatica', logro: 'oro20000' },
  { id: 'desarmar', nombre: 'Desarmar', desc: 'El 3 % de los mugrosos sale sin dientes (no pegan), por rango', paso: 0.03, max: 5, precio: 400, icono: 'mascarilla', logro: 'evoMascarilla' },
  { id: 'conservar', nombre: 'Conservar', desc: '10 % de que volver a tirar, saltar o vetar no se gaste, por rango', paso: 0.1, max: 3, precio: 500, icono: 'bolsillo', logro: 'partidas50' },
];

export const PODER = Object.fromEntries(PODERES.map((p) => [p.id, p])) as Record<Stat, DefPoder>;

/** Cuánto cuesta el siguiente rango (sube con el rango y con todo lo comprado). */
export function precioPoder(id: Stat, compras: Partial<Record<Stat, number>>): number {
  const p = PODER[id];
  const rango = compras[id] ?? 0;
  const total = Object.values(compras).reduce((a, b) => a + (b ?? 0), 0);
  return Math.round(p.precio * (1 + rango) * (1 + 0.05 * total));
}
