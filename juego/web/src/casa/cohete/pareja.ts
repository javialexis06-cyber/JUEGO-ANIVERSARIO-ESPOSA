// Lo de la pareja en el retrete espacial: lo que dicen Javier y Laura en el vuelo (el picante de Él, la leche de Ella,
// «mi amor»…), el «¡Te pasé!» cuando uno supera el récord del otro, las palabras de las figuras de rollitos y el nombre
// de la galaxia del amor. La versión para amigos lo cambia por src/amigos/sin_pareja/cohete.ts (vite.config.ts).
import type { Rol } from '../modelo';
import type { IdPoder } from './datos';

/** Lo que va diciendo en el espacio (se sabía que algún día pasaría). */
export const FRASES: Record<Rol, string[]> = {
  el: [
    'No debí comerme ese picante…',
    'Siempre supe que algún día saldría como un cohete del baño.',
    '¡Houston, tenemos un problema… estomacal!',
    '¡Ni en un columpio volé tan alto!',
    '¿Esto cuenta como viaje espacial? Quiero el certificado.',
    'El ají no perdona.',
    '¡Mi amor, si me ves pasar por la ventana, saluda!',
    'La próxima vez pido el ají suavecito.',
    'Esto no estaba en el presupuesto del mes.',
    '¡Guárdame la cena, ya vuelvo! Creo.',
  ],
  ella: [
    '¡Sabía que la leche me iba a hacer esto!',
    'Intolerante a la lactosa… y ahora astronauta.',
    'Nunca más un vaso de leche. NUNCA.',
    '¿Alguien tiene papel higiénico en el espacio?',
    'Siempre supe que algún día saldría como un cohete del baño.',
    '¡Qué vista tan bonita… qué vergüenza tan grande!',
    'Si esto sale en las noticias, no me conoces.',
    'Ningún videojuego me preparó para esto.',
    'Del baño a la NASA en un solo jalón.',
    '¡Mi amor, esto es culpa de tu leche!',
  ],
};
export const FRASES_TRAMO: Record<Rol, string[]> = {
  el: [
    '¡Chao, barrio!',
    'Desde aquí la Tierra se ve chiquitica… como mi dignidad.',
    'La Luna… y yo sin una serenata preparada.',
    '¿Habrá baños en Marte? Pregunto por un amigo.',
    'Esto está más lleno que el metro de Medellín en hora pico.',
    'Parece un concierto con luces de colores. Qué nivel.',
    '¡Todo es rosado! Esto lo decoró mi amor, seguro.',
  ],
  ella: [
    '¡Chao, barrio! ¡Que nadie me vea!',
    'Desde aquí la Tierra se ve chiquitica… como mi paciencia.',
    '¿La Luna es de queso? Ni loca la pruebo: lactosa.',
    '¿Habrá baños en Marte? Ojalá con papel.',
    'Esto está más lleno que el metro de Medellín en hora pico.',
    '¡Qué colores tan bonitos! Parece un cuadro.',
    '¡Todo rosado! Así sí me gusta el espacio.',
  ],
};
export const FRASE_PODER: Record<IdPoder, Record<Rol, string>> = {
  escudo: { el: '¡Limpiecito y protegido!', ella: '¡Burbujita protectora!' },
  iman: { el: '¡Vengan, rollitos míos!', ella: '¡Vengan a mamá, rollitos!' },
  turbo: { el: '¡Los frijoles de mi suegra!', ella: '¡Esa bandeja paisa no perdona!' },
  lenta: { el: 'Todo va como Netflix con mal internet…', ella: 'Ay, qué paz… todo despacito.' },
  doble: { el: '¡Doble o nada!', ella: '¡Todo me sale doble!' },
  laser: { el: '¡Destapando el universo!', ella: '¡Desatascador láser, a la orden!' },
  mini: { el: '¡Mi retretico ayudante!', ella: '¡Un retretico bebé!' },
  hormiga: { el: '¡Me encogí como ropa en lavadora!', ella: '¡Quedé chiquitica!' },
  ambientador: { el: '¡Huele a lavanda! Ya era hora.', ella: '¡Aroma a lavanda, por fin!' },
  paca: { el: '¡Papel para todo el año!', ella: '¡Papel pa’ la casa entera!' },
};
/** Lo que dice al volver a volar sin bajarse. */
export const OTRA_VEZ: Record<Rol, string[]> = {
  el: ['¡Una más y ya!', 'Esta vez sí le gano a mi amor.', '¡Revancha, universo!', 'Ya le cogí el tiro a esto.'],
  ella: ['¡Una más y ya!', 'Ahora sí voy con toda.', '¡Revancha, universo!', 'Me quedé con ganas de más.'],
};

/** Cuando uno supera el récord del otro en pleno vuelo. */
export const PASO_PAREJA: Record<Rol, string> = { el: '¡Te pasé, mi amor! 😏', ella: '¡Chao, mi amor! Te dejé atrás 💅' };
/** Las palabras de tres figuras de rollitos (las iniciales y los «te amo»). */
export const PALABRAS_FIGURAS: [string, string, string] = ['J ♥ L', 'TE AMO', 'TQM'];
/** El último tramo del viaje. */
export const GALAXIA_PAREJA = 'La galaxia del amor';
