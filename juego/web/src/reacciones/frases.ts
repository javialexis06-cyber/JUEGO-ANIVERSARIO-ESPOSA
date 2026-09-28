// Lo que dicen los muñequitos en sus globitos: cortito, con picardía y con guiños a su historia.
import type { Rol } from '../casa/modelo';

export type Situacion =
  | 'presumir' | 'bien' | 'mal' | 'cero' | 'celos' | 'burla' | 'captura' | 'capturado' | 'extra' | 'extra_otro'
  | 'lanzar' | 'suerte' | 'suerte_otro' | 'casi' | 'alivio' | 'regalo' | 'regalado' | 'adelante' | 'atras'
  | 'pensar' | 'impaciente' | 'inicio' | 'ganar' | 'perder' | 'empate' | 'otra' | 'beso' | 'sonrojo' | 'huir';

const FRASES: Record<Situacion, Record<Rol, string[]>> = {
  presumir: {
    el: ['¿Viste eso, mi amor?', 'Aprende del maestro', 'Soy un genio, ¿no?', 'Esto es matemática pura', 'Como en el ICFES: fácil'],
    ella: ['¿Quién es la reina? Yo', 'Mírame y aprende', 'Así se juega, bebé', 'Pura psicología, amor', 'Y ni me esforcé'],
  },
  bien: {
    el: ['¡Eso!', 'Nada mal, ¿eh?', 'Vamos bien', 'Uy, qué jugada'],
    ella: ['¡Toma!', 'Obvio, soy yo', 'Así me gusta', '¡Eso, eso!'],
  },
  mal: {
    el: ['Eso no contaba…', 'Estaba calentando', 'Fue sin querer', 'Mmm… estrategia'],
    ella: ['Ay no…', 'No me mires así', 'Eso fue a propósito', 'Déjame tranquila'],
  },
  cero: {
    el: ['¿Cero? ¿En serio?', 'Nooo…', 'Me saboteaste', 'Esto es un complot'],
    ella: ['¡¿Cero?!', 'Me quiero ir a casa', 'Esto está arreglado', 'Qué injusticia'],
  },
  celos: {
    el: ['Suerte de principiante', 'Eso fue suerte', '¿Hiciste trampa?', 'Te dejé ganar esa'],
    ella: ['¡Tramposo!', 'Ni tan bueno…', 'Seguro hiciste trampa', 'Disfrútalo mientras dure'],
  },
  burla: {
    el: ['Jajaja, qué pesar', '¿Y eso qué fue?', 'Tranquila, yo te enseño', 'Te explico como en el ICFES'],
    ella: ['Jijiji', 'Ay, pobrecito', '¿Te ayudo como en artística?', 'Ups…'],
  },
  captura: {
    el: ['¡Mío!', 'Gracias por el regalo', 'Esto me lo llevo', '¡Te comí!'],
    ella: ['¡Mía, mía, mía!', 'Gracias, mi amor', 'Me lo llevo', '¡Te comí!'],
  },
  capturado: {
    el: ['¡Oye! ¡Eso era mío!', '¡Devuélvemelo!', 'No puede ser…', 'Me robaste'],
    ella: ['¡Ladrón!', '¡Devuélvemelo ya!', 'Me las vas a pagar', '¡¿Qué hiciste?!'],
  },
  extra: {
    el: ['¡Otra vez yo!', 'Y sigo, y sigo…', 'Todavía no acabo'],
    ella: ['¡Me toca otra vez!', 'Espera, que sigo yo', 'Y va de nuevo'],
  },
  extra_otro: {
    el: ['¿Otra vez tú?', 'Ya, suelta el tablero', 'Me aburro…'],
    ella: ['¿Y yo cuándo?', 'Ya, déjame jugar', 'Qué afán…'],
  },
  lanzar: {
    el: ['Suerte, suerte…', 'Vamos, dados', 'Esta va por ti'],
    ella: ['Sóplale conmigo', 'Vamos, bebés', 'Denme algo bueno'],
  },
  suerte: {
    el: ['Por favor, por favor', 'Tú puedes, dado', 'Una sola vez…'],
    ella: ['Porfa, porfa, porfa', 'Diosito, ayúdame', 'Sale, sale, sale…'],
  },
  suerte_otro: {
    el: ['Que no, que no…', 'Falla, falla…'],
    ella: ['Que no le salga…', 'Falla, falla, falla'],
  },
  casi: {
    el: ['¡Casi!', 'Faltó poquito', 'Tan cerca…'],
    ella: ['¡Uy, casi!', 'Por un pelito', 'Casi, casi…'],
  },
  alivio: {
    el: ['Uf… me salvé', 'Qué susto', 'Uy, por poquito'],
    ella: ['Uf… qué susto', 'Me salvé', 'Casi me da algo'],
  },
  regalo: {
    el: ['Ups… eso no', 'Error de cálculo', 'No vi eso…'],
    ella: ['Ay, no vi eso', 'Ups…', 'Eso no estaba en el plan'],
  },
  regalado: {
    el: ['Gracias, muy amable', 'Qué detallista', 'Jejeje…'],
    ella: ['Gracias, mi amor', 'Qué lindo regalo', 'Jijiji…'],
  },
  adelante: {
    el: ['¡Voy ganando!', 'Mira el marcador', 'Ya te pasé'],
    ella: ['¡Voy adelante!', 'Mira quién va ganando', 'Te pasé, bebé'],
  },
  atras: {
    el: ['Todavía no acaba', 'Ya te alcanzo', 'Esto se remonta'],
    ella: ['Ya te alcanzo', 'Esto no se queda así', 'Todavía falta'],
  },
  pensar: {
    el: ['Déjame pensar…', 'Mmm…', 'Calculando…'],
    ella: ['Mmm…', 'Déjame ver…', 'Estoy pensando'],
  },
  impaciente: {
    el: ['¿Hoy o mañana?', 'Juega, mi amor', 'Me estoy durmiendo'],
    ella: ['¿Ya?', 'Juega ya, amor', 'Me aburro…'],
  },
  inicio: {
    el: ['¡Prepárate!', 'Hoy te gano', 'Suerte, mi amor'],
    ella: ['Hoy no te salvas', 'Prepárate, bebé', 'Te voy a ganar'],
  },
  ganar: {
    el: ['¡Soy el campeón!', 'Te lo dije', 'Esto se lo dedico a ti', 'Mi reina, te gané'],
    ella: ['¡Soy la reina!', 'Te dije que ganaba', 'La mejor, obvio', 'Ríndete ante mí'],
  },
  perder: {
    el: ['¡Noooo!', 'Esto está arreglado', 'Te dejé ganar…', 'La próxima es mía'],
    ella: ['¡Noooo!', 'Hiciste trampa', 'No es justo', 'Esto no se queda así'],
  },
  empate: {
    el: ['¡Empate!', 'Somos el equipo perfecto', 'Complemento perfecto'],
    ella: ['¡Empate!', 'Iguales, como siempre', 'Somos un equipo'],
  },
  otra: {
    el: ['¡Otra! ¡Revancha!', 'Una más', '¡Exijo revancha!'],
    ella: ['¡Otra!', 'Revancha, ya', 'Una más, porfa'],
  },
  beso: {
    el: ['Para ti, mi reina', 'Muack', 'Te amo'],
    ella: ['Muack', 'Para ti, amor', 'Te amo'],
  },
  huir: {
    el: ['¡No juego más!', 'Me voy…', '¡Así no juego!'],
    ella: ['¡No quiero!', '¡Ya no juego!', 'Me voy, bye'],
  },
  sonrojo: {
    el: ['Ay, mi amor…', 'Jejeje', 'Yo también'],
    ella: ['Ayy…', 'Jijiji', 'Yo también te amo'],
  },
};

const ultimas = new Map<string, number>();

/** Una frase para la situación, sin repetir la última. */
export function frase(s: Situacion, rol: Rol): string {
  const lista = FRASES[s][rol];
  const clave = `${s}-${rol}`;
  let i = Math.floor(Math.random() * lista.length);
  if (lista.length > 1 && i === ultimas.get(clave)) i = (i + 1) % lista.length;
  ultimas.set(clave, i);
  return lista[i];
}
