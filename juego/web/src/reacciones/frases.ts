// Lo que dicen los muñequitos en sus globitos: cortito, con picardía y con guiños a su historia (las de la pareja
// viven en reacciones/pareja.ts; la versión para amigos no las trae). Con amigos (modo neutro, src/neutro.ts) hablan
// como parceros: nada de «mi amor», «bebé», besos ni chistes de la pareja.
import type { Rol } from '../casa/modelo';
import { esNeutro } from '../neutro';
import { FRASES_PAREJA } from './pareja';

export type Situacion =
  | 'presumir' | 'bien' | 'mal' | 'cero' | 'celos' | 'burla' | 'captura' | 'capturado' | 'extra' | 'extra_otro'
  | 'lanzar' | 'suerte' | 'suerte_otro' | 'casi' | 'alivio' | 'regalo' | 'regalado' | 'adelante' | 'atras'
  | 'pensar' | 'impaciente' | 'inicio' | 'ganar' | 'perder' | 'empate' | 'otra' | 'beso' | 'sonrojo' | 'huir';

/** Con amigos: las mismas situaciones, con picardía de parceros y sin nada romántico (sirven para cualquiera). */
const NEUTRAS: Record<Situacion, string[]> = {
  presumir: ['¿Vieron eso?', 'Aprendan del maestro', 'Soy un genio, ¿no?', 'Puro cálculo', 'Y ni me esforcé', 'Así se juega, parce'],
  bien: ['¡Eso!', 'Nada mal, ¿eh?', 'Vamos bien', 'Uy, qué jugada', '¡Toma!'],
  mal: ['Eso no contaba…', 'Estaba calentando', 'Fue sin querer', 'Mmm… estrategia', 'No me miren así'],
  cero: ['¿Cero? ¿En serio?', 'Nooo…', 'Esto está arreglado', 'Qué injusticia', 'Me saboteaste'],
  celos: ['Suerte de principiante', 'Eso fue pura suerte', '¿Hiciste trampa?', 'Disfrútalo mientras dure', 'Ni tan bueno…'],
  burla: ['Jajaja, qué pesar', '¿Y eso qué fue?', 'Tranquilo, yo te enseño', 'Ay, pobrecito', 'Ups…'],
  captura: ['¡Mío!', 'Gracias por el regalo', 'Esto me lo llevo', '¡Te comí!', '¡Mía, mía, mía!'],
  capturado: ['¡Oye! ¡Eso era mío!', '¡Devuélvemelo!', 'No puede ser…', '¡Ladrón!', 'Me las vas a pagar'],
  extra: ['¡Otra vez yo!', 'Y sigo, y sigo…', 'Todavía no acabo', 'Y va de nuevo'],
  extra_otro: ['¿Otra vez tú?', 'Ya, suelta el tablero', '¿Y yo cuándo?', 'Qué afán…'],
  lanzar: ['Suerte, suerte…', 'Vamos, dados', 'Denme algo bueno', 'Sóplale conmigo'],
  suerte: ['Por favor, por favor', 'Tú puedes, dado', 'Sale, sale, sale…', 'Una sola vez…'],
  suerte_otro: ['Que no, que no…', 'Falla, falla…', 'Que no le salga…'],
  casi: ['¡Casi!', 'Faltó poquito', 'Tan cerca…', 'Por un pelito'],
  alivio: ['Uf… me salvé', 'Qué susto', 'Casi me da algo'],
  regalo: ['Ups… eso no', 'Error de cálculo', 'No vi eso…', 'Eso no estaba en el plan'],
  regalado: ['Gracias, muy amable', 'Qué detallista', 'Jejeje…', 'Qué buen regalo'],
  adelante: ['¡Voy ganando!', 'Mira el marcador', 'Ya te pasé', 'Mira quién va ganando'],
  atras: ['Todavía no acaba', 'Ya te alcanzo', 'Esto se remonta', 'Esto no se queda así'],
  pensar: ['Déjame pensar…', 'Mmm…', 'Calculando…', 'Déjame ver…'],
  impaciente: ['¿Hoy o mañana?', 'Juega ya, parce', 'Me estoy durmiendo', '¿Ya?'],
  inicio: ['¡Prepárate!', 'Hoy te gano', 'Hoy no te salvas', 'Que gane el mejor'],
  ganar: ['¡Soy el campeón!', 'Te lo dije', 'El mejor, obvio', '¡Invicto!'],
  perder: ['¡Noooo!', 'Esto está arreglado', 'La próxima es mía', 'No es justo'],
  empate: ['¡Empate!', 'Iguales, como siempre', '¡Qué partidazo!'],
  otra: ['¡Otra! ¡Revancha!', 'Una más', '¡Exijo revancha!'],
  beso: ['¡Gracias, gracias!', '¡Así se hace!', '¡Bien jugado!'],
  huir: ['¡No juego más!', 'Me voy…', '¡Así no juego!'],
  sonrojo: ['Jejeje', 'Ay, qué pena', '¡Gracias!'],
};

const ultimas = new Map<string, number>();

/** Una frase para la situación, sin repetir la última (con amigos, una de las neutras). */
export function frase(s: Situacion, rol: Rol): string {
  const neutro = esNeutro();
  const lista = neutro || !FRASES_PAREJA ? NEUTRAS[s] : FRASES_PAREJA[s][rol];
  const clave = `${s}-${neutro || !FRASES_PAREJA ? 'n' : rol}`;
  let i = Math.floor(Math.random() * lista.length);
  if (lista.length > 1 && i === ultimas.get(clave)) i = (i + 1) % lista.length;
  ultimas.set(clave, i);
  return lista[i];
}
