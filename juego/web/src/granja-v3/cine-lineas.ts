// Las líneas habladas de las películas de la granja (las lee también scripts/granja-v3/voces-cine.mjs, sin navegador).
// `texto` es lo que sale en el subtítulo; `d`, cómo se dice (las acotaciones en inglés entre corchetes las actúa
// ElevenLabs y no las lee). Los ids no se cambian: con ellos se busca la voz.
import type { LineaCine } from './cine-granja';

const linea = (id: string, quien: string, nombre: string, texto: string, d: string, desde = 0.5): LineaCine => ({ id, quien, nombre, texto, d, desde });

/** El prólogo: el narrador, Aura, Lara y Celia. */
export const LINEAS_PROLOGO = {
  narrador1: linea('PRO.N1', 'narrador', 'Narrador', 'En el silencio de Astra, un corazón de luz despertó… y de él nació un mundo. Y con el mundo, Celia.',
    '[softly, with wonder] En el silencio de Astra… un corazón de luz despertó… [awed] y de él nació un mundo. [tenderly] Y con el mundo, Celia.', 1.6),
  aura: linea('PRO.AURA', 'aura', 'Aura', 'Mírala, hermana… tan pequeña, y Astra tan llena de sombras.',
    '[tenderly, protective] Mírala, hermana… tan pequeña… [worried, softly] y Astra tan llena de sombras.', 3.4),
  lara: linea('PRO.LARA', 'lara', 'Lara', 'Entonces la cuidaremos juntas. Nada la tocará sin su permiso.',
    '[calm, serene, warm] Entonces la cuidaremos juntas. [gentle but firm] Nada la tocará sin su permiso.', 3.4),
  narrador2: linea('PRO.N2', 'narrador', 'Narrador', 'Así nació el Santuario: un escudo invisible, tejido con el fuego de una y la calma de la otra.',
    '[solemn, majestic] Así nació el Santuario: [softly] un escudo invisible, tejido con el fuego de una… y la calma de la otra.', 1.2),
  narrador3: linea('PRO.N3', 'narrador', 'Narrador', 'Mucho tiempo después, dos corazones llegaron al valle.',
    '[warm, gentle smile] Mucho tiempo después… dos corazones llegaron al valle.', 1.8),
  celia1: linea('PRO.C1', 'celia', 'Celia', 'Por fin llegan. Soy Celia. Esta tierra nació de mis manos… y hoy se la confío a ustedes dos.',
    '[joyful, relieved] Por fin llegan. [warmly] Soy Celia. Esta tierra nació de mis manos… [tenderly] y hoy se la confío a ustedes dos.'),
  celia2: linea('PRO.C2', 'celia', 'Celia', 'Mientras yo dormía, la maleza cubrió la granja. Pero debajo, la tierra sigue viva, esperándolos.',
    '[a little sad] Mientras yo dormía, la maleza cubrió la granja. [hopeful] Pero debajo, la tierra sigue viva… esperándolos.'),
  celia3: linea('PRO.C3', 'celia', 'Celia', 'Siembren, rieguen, cuiden a los animales. Cada brote que nazca me devolverá un poquito de fuerza.',
    '[encouraging, bright] Siembren, rieguen, cuiden a los animales. [softly, grateful] Cada brote que nazca me devolverá un poquito de fuerza.'),
  celia4: linea('PRO.C4', 'celia', 'Celia', 'En el Pueblo del Sol hay quienes los esperan. Revisen el buzón: una carta les mostrará el camino.',
    '[playful, warm] En el Pueblo del Sol hay quienes los esperan. [gently] Revisen el buzón: una carta les mostrará el camino.'),
  celia5: linea('PRO.C5', 'celia', 'Celia', 'Aura enciende cada mañana y Lara cuida cada noche. Yo estaré en cada brote. Bienvenidos a casa.',
    '[serene, loving] Aura enciende cada mañana y Lara cuida cada noche. [whispering, tender] Yo estaré en cada brote. [warmly, smiling] Bienvenidos a casa.'),
};

/** Todas las líneas de todas las películas (para el script de voces). */
export const LINEAS_CINE: LineaCine[] = [...Object.values(LINEAS_PROLOGO)];
