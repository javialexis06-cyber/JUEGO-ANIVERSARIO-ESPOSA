// La Carrera de las Tres Lunas, versión de la pareja: Javier y Laura corren entre los vecinos (con su muñeco de
// siempre) y dicen sus frases con su voz. Son frases de juego, ningún recuerdo. En la versión para amigos este archivo
// se cambia por src/amigos/sin_pareja/carreras.ts (sin nadie de la pareja).
import { NOMBRE_PAREJA } from '../nombres';
import type { Corredor } from './datos';
import type { Linea } from './frases';

/** ¿Javier y Laura están en la carrera? */
export const CON_PAREJA = true;

export const CORREDORES_PAREJA: Corredor[] = [
  { id: 'el', nombre: NOMBRE_PAREJA.el, voz: 'el', criatura: 'dragon', carro: 'carreta', color: '#3b6fb6', aspecto: { cuerpo: 'el' } },
  { id: 'ella', nombre: NOMBRE_PAREJA.ella, voz: 'ella', criatura: 'unicornio', carro: 'calesa', color: '#ff7aa8', aspecto: { cuerpo: 'ella' } },
];

const l = (quien: string, id: string, texto: string, d: string): Linea => ({ id: `${quien}.${id}`, quien, texto, d });

export const FRASES_PAREJA: Linea[] = [
  l('el', 'inicio', '¡Agárrate, que hoy gano yo!', '[playful, confident] ¡Agárrate, que hoy gano yo!'),
  l('el', 'adelanta', '¡Te pasé! ¡Chao!', '[teasing laugh] ¡Te pasé! ¡Chao!'),
  l('el', 'golpe', '¡Noo! ¡Mi dragón!', '[dramatic, whiny] ¡Noo! ¡Mi dragón!'),
  l('el', 'objeto', '¡Ahí te va, con amor!', '[mischievous] ¡Ahí te va, con amor!'),
  l('el', 'gana', '¡Campeón de las Tres Lunas!', '[triumphant shout] ¡Campeón de las Tres Lunas!'),
  l('ella', 'inicio', 'Prepárate para comer polvo.', '[confident, teasing] Prepárate para comer polvo.'),
  l('ella', 'adelanta', '¡Permiso, que voy de primera!', '[playful] ¡Permiso, que voy de primera!'),
  l('ella', 'golpe', '¡Ay! ¿Quién fue?', '[annoyed, surprised] ¡Ay! ¿Quién fue?'),
  l('ella', 'objeto', '¡Toma tu regalito!', '[mischievous giggle] ¡Toma tu regalito!'),
  l('ella', 'gana', '¡Gané! ¡Soy la mejor!', '[happy, proud] ¡Gané! ¡Soy la mejor!'),
];
