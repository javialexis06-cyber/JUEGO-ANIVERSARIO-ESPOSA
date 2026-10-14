// El Escudo de las Hermanas: lo que se dice (narrador, las Santas Eliana y Serena, y Nath'Gora). Estas líneas son del
// mito y las oyen también los amigos; lo que nombra a la pareja vive en pareja.ts (con su versión vacía para amigos).
// `d` es cómo se le pide a ElevenLabs (etiquetas de actuación en inglés entre corchetes); `texto` es lo que se lee.
// Las voces las hace scripts/escudo/voces.mjs y quedan en public/audio/escudo/ (las de la pareja en escudo-pareja/).

export type Hablante = 'narrador' | 'eliana' | 'serena' | 'nathgora' | 'el' | 'ella';
export interface Linea { id: string; quien: Hablante; texto: string; d?: string }

export const NOMBRES: Record<Hablante, string> = {
  narrador: '', eliana: 'Eliana, Santa de Aura', serena: 'Serena, Santa de Lara', nathgora: 'Nath’Gora', el: '', ella: '',
};

const L = (id: string, quien: Hablante, texto: string, d?: string): Linea => ({ id, quien, texto, d });

/** Las líneas comunes, por id. */
export const LINEAS: Record<string, Linea> = Object.fromEntries([
  // La escena del principio (la campaña empieza)
  L('IN1', 'narrador', 'En el Borde de Astra, donde el mundo de Celia toca el mar de estrellas, las Hermanas tendieron un escudo de luz.',
    '[calm, storyteller] En el Borde de Astra, donde el mundo de Celia toca el mar de estrellas... las Hermanas tendieron un escudo de luz.'),
  L('IN2', 'nathgora', 'Su escudo es una promesa. Y todas las promesas se apagan.', '[low, cold, slow] Su escudo es una promesa. [pause] Y todas las promesas se apagan.'),
  L('IN3', 'eliana', '¡La ceniza viene por las rutas viejas! Que cada altar tenga su fuego.', '[determined, warm] ¡La ceniza viene por las rutas viejas! Que cada altar tenga su fuego.'),
  L('IN4', 'serena', 'Y que ninguna alma se quede sola en el camino. Lara las espera.', '[soft, serene] Y que ninguna alma se quede sola en el camino. Lara las espera.'),
  L('IN6', 'eliana', 'Construyan en los círculos de piedra. Nosotras cuidamos el cielo.', '[encouraging] Construyan en los círculos de piedra. Nosotras cuidamos el cielo.'),
  // La escena del final (gana la batalla de P23)
  L('FI1', 'nathgora', 'Me cierran el paso… Mi estrella sigue apagada, y nadie vino a buscarla.', '[hurt, bitter, slow] Me cierran el paso... [sighs] Mi estrella sigue apagada, y nadie vino a buscarla.'),
  L('FI2', 'serena', 'Tu pérdida merece ser nombrada. Pero este mundo no es tu reemplazo.', '[gentle but firm] Tu pérdida merece ser nombrada. Pero este mundo no es tu reemplazo.'),
  L('FI3', 'eliana', 'Las rutas cerraron. El escudo aguanta.', '[relieved, proud] Las rutas cerraron. El escudo aguanta.'),
  L('FI4', 'narrador', 'Nath’Gora volvió al abismo. No por miedo: porque ya nadie le abría la puerta.',
    '[calm, reflective] Nath Gora volvió al abismo. No por miedo... porque ya nadie le abría la puerta.'),
  // En la batalla
  L('EH1', 'eliana', '¡Fuego del Alba!', '[shouting, fierce] ¡Fuego del Alba!'),
  L('EH2', 'eliana', '¡Aura, préstame tu brasa!', '[calling out, passionate] ¡Aura, préstame tu brasa!'),
  L('SH1', 'serena', 'Descansen. El velo los sostiene.', '[whispering, soothing] Descansen. El velo los sostiene.'),
  L('SH2', 'serena', 'Lara, cúbrelos con tu velo.', '[praying softly] Lara, cúbrelos con tu velo.'),
  L('NJ1', 'nathgora', 'Abran paso. Vengo por mi estrella.', '[menacing, deep, slow] Abran paso. Vengo por mi estrella.'),
  L('NJ2', 'nathgora', '¿Creen que la luz dura para siempre?', '[mocking, cold] ¿Creen que la luz dura para siempre?'),
  L('NJ3', 'nathgora', 'Silencio.', '[whispering, cold] Silencio.'),
  L('BU1', 'narrador', 'La última oleada. Aguanten.', '[tense, low] La última oleada. Aguanten.'),
  L('BE1', 'eliana', '¡El escudo se agrieta! ¡Refuércenlo!', '[urgent, alarmed] ¡El escudo se agrieta! ¡Refuércenlo!'),
  L('BV1', 'narrador', 'El Borde sigue en pie.', '[warm, satisfied] El Borde sigue en pie.'),
  L('BD1', 'serena', 'El escudo cedió… Respiremos, y volvamos a intentarlo.', '[sad, then gentle] El escudo cedió... [breathes] Respiremos, y volvamos a intentarlo.'),
  // La entrada de cada nivel (la dice el narrador)
  L('NV1', 'narrador', 'Aquí las Santas miraban las estrellas. Hoy la ceniza viene por el camino viejo.'),
  L('NV2', 'narrador', 'Las ruinas de las Santas de antes. Por encima vuelan las polillas de ceniza.'),
  L('NV3', 'narrador', 'Dos grietas a la vez. El unicornio de Celia vino a sostener la luz.'),
  L('NV4', 'narrador', 'Donde Lara deja descansar a las almas. Fuatia trajo sus cuatro elementos.'),
  L('NV5', 'narrador', 'El paso angosto sobre el abismo. Si la ceniza cruza aquí, llega al escudo.'),
  L('NV6', 'narrador', 'La última autorización. Nath’Gora en persona viene por el escudo.', '[grave, tense] La última autorización. Nath Gora en persona viene por el escudo.'),
  L('NV7', 'narrador', 'La ceniza no se acaba. ¿Hasta qué oleada aguanta el escudo?'),
].map((l) => [l.id, l]));

/** La línea de entrada de cada nivel. */
export const VOZ_NIVEL: Record<string, string> = { mirador: 'NV1', arcos: 'NV2', cantera: 'NV3', rosal: 'NV4', puente: 'NV5', grieta: 'NV6', infinito: 'NV7' };
