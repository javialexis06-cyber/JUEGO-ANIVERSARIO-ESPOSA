// Javier y Laura en el Torneo del Despertar Dorado: sus muñecos de siempre, su estilo de pelea y lo que dicen (con sus
// voces clonadas, en public/audio/peleas/pareja/). Son frases de juego, con sus apodos y palabras del chat, sin ningún
// recuerdo (docs/la-pareja.md, «Quién cuenta qué»). La versión para amigos cambia este archivo por
// src/amigos/sin_pareja/peleas.ts (vacío): ahí el luchador de cada quien es su propio muñeco.
import { normales, proyectil, rafaga, voladora } from './golpes';
import type { DefLuchador, Frase } from './tipos';

const f = (id: string, t: string, d: string): Frase => ({ id, t, d });

const JAVIER: DefLuchador = {
  id: 'el', nombre: 'Javier', titulo: 'El Panda del Valle', estilo: 'Equilibrado: corazones voladores y un abrazo de oso', color: '#4f8fe0', cuerpo: 'el', aspecto: null,
  vida: 1300, velocidad: 3.3, salto: 13, peso: 1.0, aguante: 430,
  golpes: { ...normales({}), especial: proyectil('Muak volador', 'corazon', { dano: 60, vel: 8 }), super: rafaga('Abrazo de oso', 'corazon', 305) },
  poses: { entrada: 'musculo', victoria: ['celebrar', 'trofeo'], derrota: 'triste' }, voz: 'el',
  frases: {
    entrada: [
      f('el.entrada1', '¡Vamos con toda, que esta fiesta es mía!', '[excited, confident] ¡Vamos con toda, que esta fiesta es mía!'),
      f('el.entrada2', 'Calienten, que llegó el panda.', '[playful, cocky] Calienten, que llegó el panda.'),
    ],
    especial: [f('el.especial', '¡Muak volador!', '[playful shout] ¡Muak volador!')],
    super: [f('el.super', '¡Abrazo de oso!', '[big joyful shout] ¡Abrazo de oso!')],
    victoria: [
      f('el.victoria1', '¡Te la dedico, esposa!', '[proud, loving] ¡Te la dedico, esposa!'),
      f('el.victoria2', '¡Yei! ¡Ganamos!', '[happy, cheering] ¡Yei! ¡Ganamos!'),
    ],
    derrota: [f('el.derrota', 'Ay deoz… me ganaron limpio.', '[dramatic sigh, laughing] Ay deoz… me ganaron limpio.')],
    gana: f('presentador.gana_el', '¡Gana Javier!', '[announcer, excited] ¡Gana Javier!'),
    contra: { ella: f('el.contra_ella', '¿Contra ti, esposa? Bueno… pero suavecito.', '[nervous laugh, tender] ¿Contra ti, esposa? Bueno… pero suavecito.') },
  },
};

const LAURA: DefLuchador = {
  id: 'ella', nombre: 'Laura', titulo: 'La Mejor Guerrera de Dios', estilo: 'Rápida: doble salto, patadas voladoras y combos largos', color: '#ff7aa8', cuerpo: 'ella', aspecto: null,
  vida: 1200, velocidad: 3.75, salto: 13.4, peso: 1.1, aguante: 380, dobleSalto: true,
  golpes: { ...normales({ fuerza: 0.93, lentitud: -1 }), especial: voladora('Patada voladora', 'estrella'), super: rafaga('Furia de guerrera', 'estrella', 315) },
  poses: { entrada: 'presumir_a', victoria: ['baile_a', 'celebrar'], derrota: 'puchero' }, voz: 'ella',
  frases: {
    entrada: [
      f('ella.entrada1', '¡Prepárate, que vengo con toda!', '[fierce, playful] ¡Prepárate, que vengo con toda!'),
      f('ella.entrada2', '¿Bailamos? Yo dirijo.', '[teasing, confident] ¿Bailamos? Yo dirijo.'),
    ],
    especial: [f('ella.especial', '¡Patada voladora!', '[energetic shout] ¡Patada voladora!')],
    super: [f('ella.super', '¡Furia de guerrera!', '[fierce battle cry] ¡Furia de guerrera!')],
    victoria: [
      f('ella.victoria1', '¡Sip! La mejor guerrera de Dios.', '[proud, laughing] ¡Sip! La mejor guerrera de Dios.'),
      f('ella.victoria2', 'Muak… y ganaste nada.', '[playful, teasing] Muak… y ganaste nada.'),
    ],
    derrota: [f('ella.derrota', 'Nop, esa no contaba.', '[pouting, playful] Nop, esa no contaba.')],
    gana: f('presentador.gana_ella', '¡Gana Laura!', '[announcer, excited] ¡Gana Laura!'),
    contra: { el: f('ella.contra_el', 'Hi baby… hoy no te dejo ganar.', '[sweet, then fierce] Hi baby… hoy no te dejo ganar.') },
  },
};

export const PAREJA_LUCHADORES: DefLuchador[] = [JAVIER, LAURA];
/** El orden de la pantalla de selección en la versión de la pareja. */
export const ORDEN_PAREJA = ['el', 'ella', 'eliana', 'serena', 'tarek', 'otto', 'conde', 'vaelthor'];
