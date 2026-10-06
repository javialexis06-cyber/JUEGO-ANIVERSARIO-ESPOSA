// Lo que se lee en «Lavarse la cara», según quién juega. Los datos del juego (cartas, disfraces, logros, mugrosos,
// avisos) vienen en su versión para todos; cuando juegan Javier y Laura sin amigos, aquí se les pone encima lo
// personal de `pareja.ts` (los recuerdos de las cartas de amor, los apodos, Yanbal, «¡Levántate, mi amor!»…). Con
// un amigo en la sala (o en la versión para amigos, que ni compila `pareja.ts`) queda la versión para todos. Los
// efectos del juego son los mismos; solo cambia lo que se lee. Todo texto que se pinte pasa por aquí:
// `cartaVista`, `disfrazVisto`, `logroVisto`, `enemigoVisto`, `personalizar` y `FRASES`.
import { CARTAS, type DefCarta } from './cartas';
import type { DefDisfraz } from './disfraces';
import type { DefEnemigo } from './enemigos';
import { PAREJA, type TextosPareja } from './pareja';
import type { DefLogro } from './progreso';
import type { IdCarta } from './tipos';

/** Lo personal (null en la versión para amigos, donde `pareja.ts` se cambia por uno vacío). */
const P: TextosPareja | null = PAREJA ?? null;

let neutro = !P;
/** Lo prende el juego cuando juega un amigo o hay amigos en la sala (y lo apaga al volver a jugar a solas). */
export function ponerNeutro(si: boolean) {
  neutro = si || !P;
}
export const esNeutro = () => neutro;
/** ¿Esta versión trae lo de la pareja? (false en la versión para amigos). */
export const hayPareja = () => !!P;

export function cartaVista(id: IdCarta): DefCarta {
  const c = CARTAS[id];
  const n = !neutro && P ? P.cartas[id] : null;
  return n ? { ...c, nombre: n.nombre, frase: n.frase, efecto: n.efecto ?? c.efecto } : c;
}

export function disfrazVisto(d: DefDisfraz): DefDisfraz {
  const n = !neutro && P ? P.disfraces[d.id] : null;
  return n ? { ...d, ...n } : d;
}

/** Los premios de los logros nombran cartas y disfraces: con la pareja, con sus nombres de verdad. */
export function logroVisto(l: DefLogro): DefLogro {
  const n = !neutro && P ? P.logros[l.id] : null;
  return n ? { ...l, ...n } : l;
}

export function enemigoVisto<T extends DefEnemigo>(e: T): T {
  const d = !neutro && P ? P.enemigos[e.id] : null;
  return d ? { ...e, desc: d } : e;
}

/** Lo que dice el juego en voz alta (avisos del motor y de los escenarios): con la pareja, a su manera. */
export function personalizar(t: string): string {
  if (neutro || !P || !t) return t;
  let r = t;
  for (const [de, a] of P.avisos) r = typeof de === 'string' ? r.split(de).join(a) : r.replace(de, a);
  return r;
}

/** Las frases que dependen de quién juega. */
export const FRASES = {
  levanta: (quien: string, aMi: boolean) =>
    !neutro && P ? (aMi ? P.frases.levantaAMi : P.frases.levanta) : aMi ? '¡Te levantaron! A seguir ✨' : `¡Arriba, ${quien}! A seguir lavando ✨`,
  revive: () => (!neutro && P ? P.frases.revive : '¡A seguir! Te volviste a parar ✨'),
  cayo: (quien: string) => `¡${quien} cayó! Quédate a su ladito para levantarle`,
  tituloCartas: () => (!neutro && P ? P.frases.tituloCartas : 'Cartas mágicas'),
  sinCarta: () => (!neutro && P ? P.frases.sinCarta : 'Sin carta mágica'),
  iconoCarta: () => (!neutro && P ? P.frases.iconoCarta : '🃏'),
  cartaPerdida: () => (!neutro && P ? P.frases.cartaPerdida : '🃏 Una carta mágica perdida'),
  leyendoCarta: () => (!neutro && P ? P.frases.leyendoCarta : 'escogiendo una carta mágica'),
  iconoPareja: () => P?.frases.iconoPareja ?? '👥',
};

/** La carta guardada con su nombre de hoy ('' si no existe): las partidas viejas traen los nombres de antes. */
export function cartaGuardada(v: unknown): IdCarta | '' {
  if (typeof v !== 'string' || !v) return '';
  if (v in CARTAS) return v as IdCarta;
  return P?.cartasViejas[v] ?? '';
}

/** El disfraz guardado con su nombre de hoy. */
export const disfrazGuardado = (v: unknown): unknown => (typeof v === 'string' ? P?.disfracesViejos[v] ?? v : v);
