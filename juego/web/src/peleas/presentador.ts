// Lo que dice el presentador del torneo (con voz en public/audio/peleas/comun/). Es de todos: también lo oyen los amigos.
import type { Frase } from './tipos';

const f = (id: string, t: string, d: string): Frase => ({ id: `presentador.${id}`, t, d });

export const PRESENTADOR = {
  bienvenida: f('bienvenida', '¡Bienvenidos al Torneo del Despertar Dorado!', '[enthusiastic stadium announcer] ¡Bienvenidos al Torneo del Despertar Dorado!'),
  elige: f('elige', '¡Elige a tu luchador!', '[energetic announcer] ¡Elige a tu luchador!'),
  ronda1: f('ronda1', '¡Ronda uno!', '[announcer, building hype] ¡Ronda uno!'),
  ronda2: f('ronda2', '¡Ronda dos!', '[announcer, building hype] ¡Ronda dos!'),
  ronda3: f('ronda3', '¡Ronda tres!', '[announcer, building hype] ¡Ronda tres!'),
  final: f('final', '¡Ronda final!', '[announcer, intense] ¡Ronda final!'),
  pelea: f('pelea', '¡A pelear!', '[announcer, shouting with energy] ¡A pelear!'),
  ko: f('ko', '¡K.O.!', '[announcer, explosive shout] ¡Ca-O!'),
  tiempo: f('tiempo', '¡Se acabó el tiempo!', '[announcer, urgent] ¡Se acabó el tiempo!'),
  empate: f('empate', '¡Empate!', '[announcer, surprised] ¡Empate!'),
  doble: f('doble', '¡Doble K.O.!', '[announcer, astonished] ¡Doble ca-o!'),
  perfecto: f('perfecto', '¡Victoria perfecta!', '[announcer, amazed] ¡Victoria perfecta!'),
  siguiente: f('siguiente', '¡Que pase el siguiente rival!', '[announcer, hyped] ¡Que pase el siguiente rival!'),
  ultimo: f('ultimo', '¡La pelea final del torneo!', '[announcer, dramatic] ¡La pelea final del torneo!'),
  campeon: f('campeon', '¡Tenemos campeón del Despertar Dorado!', '[announcer, triumphant] ¡Tenemos campeón del Despertar Dorado!'),
  combo: f('combo', '¡Qué combo!', '[announcer, impressed] ¡Qué combo!'),
};

export const FRASES_PRESENTADOR: Frase[] = Object.values(PRESENTADOR);
