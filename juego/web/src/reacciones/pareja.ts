// Lo que dicen Él y Ella en sus globitos cuando juegan los dos: con sus apodos, sus chistes y sus guiños. La versión
// para amigos cambia este archivo por uno vacío (src/amigos/sin_pareja/reacciones.ts) y ahí solo salen las neutras
// de reacciones/frases.ts.
import type { Rol } from '../casa/modelo';
import type { Situacion } from './frases';

export const FRASES_PAREJA: Record<Situacion, Record<Rol, string[]>> | null = {
  presumir: {
    el: ['¿Viste eso, mi amor?', 'Aprende del maestro', 'Soy un genio, ¿no?', 'Esto es pura estrategia', 'Pan comido, ¿no?', '¿Viste eso, esposha?', 'Dico, ¿no? 😎'],
    ella: ['¿Quién es la reina? Yo', 'Mírame y aprende', 'Así se juega, bebé', 'Pura intuición, amor', 'Y ni me esforcé', 'Ay deoz, qué crack soy', 'Aprende, mi niño'],
  },
  bien: {
    el: ['¡Eso!', 'Nada mal, ¿eh?', 'Vamos bien', 'Uy, qué jugada', 'Yei :D', 'Shi, señor'],
    ella: ['¡Toma!', 'Obvio, soy yo', 'Así me gusta', '¡Eso, eso!', 'Shiii', 'Okis, eso estuvo bien'],
  },
  mal: {
    el: ['Eso no contaba…', 'Estaba calentando', 'Fue sin querer', 'Mmm… estrategia', 'Ay deos…', 'Eso no valió .c'],
    ella: ['Ay no…', 'No me mires así', 'Eso fue a propósito', 'Déjame tranquila', 'Ay deoz…', 'No vale :c'],
  },
  cero: {
    el: ['¿Cero? ¿En serio?', 'Nooo…', 'Me saboteaste', 'Esto es un complot', 'Me niego .c'],
    ella: ['¡¿Cero?!', 'Me quiero ir a casa', 'Esto está arreglado', 'Qué injusticia', 'Nop, nop, nop'],
  },
  celos: {
    el: ['Suerte de principiante', 'Eso fue suerte', '¿Hiciste trampa?', 'Te dejé ganar esa', 'Suerte de mimilona'],
    ella: ['¡Tramposo!', 'Ni tan bueno…', 'Seguro hiciste trampa', 'Disfrútalo mientras dure', 'Tramposo lanudo'],
  },
  burla: {
    el: ['Jajaja, qué pesar', '¿Y eso qué fue?', 'Tranquila, yo te enseño', 'Te explico despacito', 'Jajaja, ay esposa', 'Ay, mi cotita :v'],
    ella: ['Jijiji', 'Ay, pobrecito', '¿Quieres que te explique?', 'Ups…', 'Jajaja, ay mi bb', 'Pobre mi niño'],
  },
  captura: {
    el: ['¡Mío!', 'Gracias por el regalo', 'Esto me lo llevo', '¡Te comí!', 'Esto me lo llevo, cotita'],
    ella: ['¡Mía, mía, mía!', 'Gracias, mi amor', 'Me lo llevo', '¡Te comí!', 'Mío, mío, mi bb'],
  },
  capturado: {
    el: ['¡Oye! ¡Eso era mío!', '¡Devuélvemelo!', 'No puede ser…', 'Me robaste', '¡Esposha, devuélvemelo! .c'],
    ella: ['¡Ladrón!', '¡Devuélvemelo ya!', 'Me las vas a pagar', '¡¿Qué hiciste?!', '¡Ladrón lanudo!'],
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
    el: ['Suerte, suerte…', 'Vamos, dados', 'Esta va por ti', 'Va va…'],
    ella: ['Sóplale conmigo', 'Vamos, bebés', 'Denme algo bueno', 'Pera, pera… ahora sí'],
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
    el: ['Gracias, muy amable', 'Qué detallista', 'Jejeje…', 'Gracias, esposa :3'],
    ella: ['Gracias, mi amor', 'Qué lindo regalo', 'Jijiji…', 'Gracias, mi bb'],
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
    el: ['¿Hoy o mañana?', 'Juega, mi amor', 'Me estoy durmiendo', 'Dime esposa, ¿juegas o no? :v', '¿Hoy o mañana, mimilona?'],
    ella: ['¿Ya?', 'Juega ya, amor', 'Me aburro…', 'Bb, ¿ya?', 'Juega, mi niño'],
  },
  inicio: {
    el: ['¡Prepárate!', 'Hoy te gano', 'Suerte, mi amor', 'Prepárate, esposha', 'Ti amu, pero hoy te gano'],
    ella: ['Hoy no te salvas', 'Prepárate, bebé', 'Te voy a ganar', 'Hi baby, hoy pierdes', 'Okis, a jugar'],
  },
  ganar: {
    el: ['¡Soy el campeón!', 'Te lo dije', 'Esto se lo dedico a ti', 'Mi reina, te gané', '¡Yeiii! :D', 'Gané, pero te doy un betito de consolación'],
    ella: ['¡Soy la reina!', 'Te dije que ganaba', 'La mejor, obvio', 'Ríndete ante mí', '¡Yeiii! Ganó la cotita', 'Ríndete, mi niño'],
  },
  perder: {
    el: ['¡Noooo!', 'Esto está arreglado', 'Te dejé ganar…', 'La próxima es mía', 'Me niego .c', 'Pido betito de consolación'],
    ella: ['¡Noooo!', 'Hiciste trampa', 'No es justo', 'Esto no se queda así', 'No es justo :c', 'Exijo betitos de consolación'],
  },
  empate: {
    el: ['¡Empate!', 'Somos el equipo perfecto', 'Complemento perfecto', 'Complemento, como siempre'],
    ella: ['¡Empate!', 'Iguales, como siempre', 'Somos un equipo', 'Iguales, mi bb'],
  },
  otra: {
    el: ['¡Otra! ¡Revancha!', 'Una más', '¡Exijo revancha!', 'Otra y te doy betitos'],
    ella: ['¡Otra!', 'Revancha, ya', 'Una más, porfa', 'Otra, porfi 🥺'],
  },
  beso: {
    el: ['Para ti, mi reina', 'Muack', 'Te amo', 'Betito pa ti', 'Te amodoro'],
    ella: ['Muack', 'Para ti, amor', 'Te amo', 'Muak muak', 'Para mi niño'],
  },
  huir: {
    el: ['¡No juego más!', 'Me voy…', '¡Así no juego!', 'Me voy a dormir… mentiras'],
    ella: ['¡No quiero!', '¡Ya no juego!', 'Me voy, bye', 'Bye, me voy a dormir'],
  },
  sonrojo: {
    el: ['Ay, mi amor…', 'Jejeje', 'Yo también', 'Ay deos…', 'Uwu'],
    ella: ['Ayy…', 'Jijiji', 'Yo también te amo', 'Ay deoz 🙈', 'Shi 🥰'],
  },
};
