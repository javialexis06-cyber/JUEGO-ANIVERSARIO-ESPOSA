// Las líneas de las películas nuevas de la película de Astra (docs/en-obra/pelicula-de-astra.md, capítulo 10): las de
// Sangre y Ceniza (SC0-SC4 y el Misterio 3 de C04), la entrada de Fuatia en C11, las seis secundarias, el Altar del Lazo
// y la boda. Las lee también scripts/granja-v3/voces-cine.mjs. Los ids no se cambian: con ellos se busca la voz.
//
// Regla de amigos: en las de Sangre y Ceniza solo Javier y Laura dicen cosas de la pareja. Serena, el Conde, Nath'Gora,
// Vael'Thor y el narrador hablan sin nombrarlos, así su audio sirve igual en la versión de amigos (allá las líneas de
// la pareja se cambian por las de los sobrevivientes).
import type { LineaCine } from './cine-granja';
import { NOMBRE_PAREJA } from '../nombres';

const L = (id: string, quien: string, nombre: string, texto: string, d?: string, desde = 0.5): LineaCine => ({ id, quien, nombre, texto, d, desde });
const N = (id: string, texto: string, d?: string) => L(id, 'narrador', 'Narrador', texto, d);
const EL = (id: string, texto: string, d?: string) => L(id, 'el', NOMBRE_PAREJA.el, texto, d);
const ELLA = (id: string, texto: string, d?: string) => L(id, 'ella', NOMBRE_PAREJA.ella, texto, d);
const SERENA = (id: string, texto: string, d?: string) => L(id, 'canalizadora_lara', 'Serena', texto, d);
const ELIANA = (id: string, texto: string, d?: string) => L(id, 'canalizadora_aura', 'Eliana', texto, d);
const CELIA = (id: string, texto: string, d?: string) => L(id, 'celia', 'Celia', texto, d);
const AURA = (id: string, texto: string, d?: string) => L(id, 'aura', 'Aura', texto, d);
const LARA = (id: string, texto: string, d?: string) => L(id, 'lara', 'Lara', texto, d);
const FUATIA = (id: string, texto: string, d?: string) => L(id, 'fuatia', 'Fuatia', texto, d);
const CONDE = (id: string, texto: string, d?: string) => L(id, 'conde', 'El Conde Sangrevil', texto, d);
const NATH = (id: string, texto: string, d?: string) => L(id, 'nathgora', 'Nath’Gora', texto, d);
const VAEL = (id: string, texto: string, d?: string) => L(id, 'vaelthor', 'Vael’Thor', texto, d);

/** SC0 · La Noche Eterna (Sangre: la primera vez en el mapa de la Noche). */
export const LINEAS_SC0 = [
  N('SC0.N1', 'Hace once años, en Valdemora, el reino de la frontera, un conde tuvo miedo.', '[low, ominous, slow] Hace once años, en Valdemora, el reino de la frontera… un conde tuvo miedo.'),
  CONDE('SC0.C1', 'Treinta años gobernando… y cuando me muera, nadie se va a acordar de nada.', '[weak, coughing softly, bitter] Treinta años gobernando… [whispering] y cuando me muera, nadie se va a acordar de nada.'),
  NATH('SC0.NG1', 'Yo puedo darte lo que Lara no te dará: una noche que no se acaba. Solo ábreme una puerta.', '[cold, distant, whispering] Yo puedo darte lo que Lara no te dará… [slowly] una noche que no se acaba. Solo ábreme una puerta.'),
  CONDE('SC0.C2', '¿Y no moriré nunca?', '[hesitant, then greedy] ¿Y no moriré… nunca?'),
  NATH('SC0.NG2', 'Nunca.', '[cold, certain] Nunca.'),
  N('SC0.N2', 'El Conde bebió ceniza de estrella muerta. La luna se manchó de rojo… y sobre Valdemora cayó la Noche Eterna.', '[grave, slow] El Conde bebió ceniza de estrella muerta. [darker] La luna se manchó de rojo… y sobre Valdemora cayó la Noche Eterna.'),
  ELLA('SC0.E1', 'Panda… ¿esa no es la constelación que brilla encima de nuestra casa? Acaba de parpadear.', '[worried, soft] Panda… ¿esa no es la constelación que brilla encima de nuestra casa? [alarmed] Acaba de parpadear.'),
  EL('SC0.L1', 'La misma, esposa. Eso nunca había pasado.', '[serious, protective] La misma, esposa. Eso nunca había pasado.'),
  SERENA('SC0.S1', 'Quien escuche esto: soy Serena, la Santa de Lara. Las almas de Valdemora ya no llegan a la mano de mi señora. Necesito ayuda.', '[urgent but calm, echoing] Quien escuche esto: soy Serena, la Santa de Lara. [sad] Las almas de Valdemora ya no llegan a la mano de mi señora. [pleading] Necesito ayuda.'),
];

/** SC1 · Las Afueras (puerta del sector 1; granja P04). */
export const LINEAS_SC1 = [
  N('SC1.N1', 'En el fondo del pantano, la tierra estaba rajada como un plato viejo. De la raja subía una ceniza fría que no quemaba.'),
  SERENA('SC1.S1', 'Ven… toma mi mano.', '[very gentle, tender] Ven… toma mi mano.'),
  N('SC1.N2', 'La mano de Serena atravesó el alma como si fuera niebla.', '[quiet, sad] La mano de Serena atravesó el alma… como si fuera niebla.'),
  SERENA('SC1.S2', 'No me ve. La ceniza le tapa el camino. No se perdió: la taparon.', '[sad, quiet] No me ve. La ceniza le tapa el camino. [firm] No se perdió: la taparon.'),
  EL('SC1.L1', '¿Y esa raja de luz negra?', '[uneasy] ¿Y esa raja de luz negra?'),
  SERENA('SC1.S3', 'Es la grieta. No la abrió nadie de afuera: la abrieron desde adentro.', '[grave] Es la grieta. No la abrió nadie de afuera: [slowly] la abrieron desde adentro.'),
  ELLA('SC1.E1', 'Ay deos… el Conde.', '[realizing, worried] Ay deos… el Conde.'),
  SERENA('SC1.S4', 'Las Reliquias de Sangre la mantienen abierta. Cada una que saquen de Valdemora la cierra un poquito.'),
  EL('SC1.L2', 'Tranquila, pulga aventurera, que yo voy adelante.', '[brave, playful] Tranquila, pulga aventurera, que yo voy adelante.'),
  ELLA('SC1.E2', 'Tú vas adelante, mi niño… pero yo llevo el mapa.', '[teasing, warm] Tú vas adelante, mi niño… [laughs softly] pero yo llevo el mapa.'),
  SERENA('SC1.S5', 'Cuando oigan la campana, corran hacia la luz. Aura les manda un grifo.', '[encouraging] Cuando oigan la campana, corran hacia la luz. [warm] Aura les manda un grifo.'),
  N('SC1.N3', 'Esa noche, por primera vez, un grifo bajó por el haz dorado de Aura… y las almas rescatadas llegaron por fin a la mano de Lara.', '[uplifting, wonder] Esa noche, por primera vez, un grifo bajó por el haz dorado de Aura… [tender] y las almas rescatadas llegaron por fin a la mano de Lara.'),
];

/** SC2 · El fuego bajo la piedra (sector 2; granja P06). Misterio 1: por qué el escudo. */
export const LINEAS_SC2 = [
  N('SC2.N1', 'En lo más hondo de la mina, donde dormían los dragones de Celia, las paredes estaban talladas.', '[mysterious, hushed] En lo más hondo de la mina, donde dormían los dragones de Celia… las paredes estaban talladas.'),
  ELLA('SC2.E1', 'Mira, mor: son dibujos. Dos señoras y una niña chiquitica entre ellas.', '[curious, amazed] Mira, mor: son dibujos. [tender] Dos señoras y una niña chiquitica entre ellas.'),
  SERENA('SC2.S1', 'Aura y Lara, con Celia recién nacida. Y esta estrella negra… es Nath’Gora.', '[reverent] Aura y Lara, con Celia recién nacida. [darker] Y esta estrella negra… es Nath’Gora.'),
  N('SC2.N2', 'Hace mucho, antes del escudo, las dos hermanas vieron a Nath’Gora apagar el mundo de otro panteón, como quien sopla una vela.', '[solemn, slow] Hace mucho, antes del escudo, las dos hermanas vieron a Nath’Gora apagar el mundo de otro panteón… [whispering] como quien sopla una vela.'),
  AURA('SC2.A1', 'Lo apagó… así no más.', '[horrified, whispering] Lo apagó… así no más.'),
  LARA('SC2.LA1', 'Entonces nadie va a soplar esta luz.', '[calm but firm, protective] Entonces nadie va a soplar esta luz.'),
  SERENA('SC2.S2', 'Ese es el primer misterio: el escudo no se hizo por si acaso. Se hizo porque ya sabían quién venía.'),
  VAEL('SC2.V1', 'Qué historia tan tierna. Lástima que mis laberintos no tengan salida.', '[amused, velvety, mocking] Qué historia tan tierna. [sinister] Lástima que mis laberintos no tengan salida.'),
  EL('SC2.L1', '¿Y ese quién es?', '[suspicious] ¿Y ese quién es?'),
  SERENA('SC2.S3', 'Vael’Thor, el Ceramista de Sombras. Le hizo al Conde las catacumbas para atrapar a las almas camino a Senda.'),
  ELLA('SC2.E2', 'Pues sus laberintos tienen una falla: nosotros no nos perdemos si vamos de la mano.', '[defiant, smiling] Pues sus laberintos tienen una falla: [warm] nosotros no nos perdemos si vamos de la mano.'),
];

/** SC3 · El Santuario roto (sector 3; granja P08). Misterio 2: los otros panteones. */
export const LINEAS_SC3 = [
  N('SC3.N1', 'En la abadía en llamas, los monjes seguían rezando. Pero ya no le rezaban a Aura ni a Lara.', '[grave, unsettling] En la abadía en llamas, los monjes seguían rezando. [slowly] Pero ya no le rezaban a Aura ni a Lara.'),
  SERENA('SC3.S1', 'Rezan… pero a otro.', '[sad, whispering] Rezan… pero a otro.'),
  N('SC3.N2', 'Bajo el altar quemado había un cofre. Adentro, el manuscrito de las Santas.'),
  SERENA('SC3.S2', 'Lo escribieron las Santas que vinieron antes que yo: «Los otros panteones dejaron apagar la estrella que Nath’Gora cuidaba».', '[reverent, reading slowly] Lo escribieron las Santas que vinieron antes que yo: «Los otros panteones dejaron apagar la estrella que Nath’Gora cuidaba».'),
  EL('SC3.L1', 'O sea que Nath’Gora no nació malo… se quedó sin su estrella.', '[thoughtful] O sea que Nath’Gora no nació malo… se quedó sin su estrella.'),
  SERENA('SC3.S3', 'Y se vengó apagando sus mundos uno por uno. Vael’Thor encerró la esencia de esos dioses en geometrías oscuras.'),
  ELLA('SC3.E1', 'Las Reliquias de Sangre… ¿son pedazos de esas cárceles?', '[realizing, soft] Las Reliquias de Sangre… ¿son pedazos de esas cárceles?'),
  SERENA('SC3.S4', 'Escuchen.', '[whispering] Escuchen.'),
  N('SC3.N3', 'Al levantar la reliquia se oyó, muy lejos, la respiración de un dios dormido.', '[hushed, awed] Al levantar la reliquia se oyó, muy lejos… la respiración de un dios dormido.'),
  ELLA('SC3.E2', 'Qué tristeza. Una estrella apagada por un descuido, y un universo entero pagándolo.', '[sad, gentle] Qué tristeza. Una estrella apagada por un descuido… y un universo entero pagándolo.'),
  EL('SC3.L2', 'Por eso yo te cuido tanto, esposa. A las estrellas no se les descuida.', '[tender, a little proud] Por eso yo te cuido tanto, esposa. A las estrellas no se les descuida.'),
  ELLA('SC3.E3', 'Ay, mi niño. Tú y tus frases… shi, cuídame.', '[laughing softly, loving] Ay, mi niño. Tú y tus frases… [sweetly] shi, cuídame.'),
];

/** C04 · La copa: el Misterio 3 (el Lazo Primordial), antes de que Lara selle al Conde. */
export const LINEAS_C04_LAZO = [
  NATH('C04X.NG1', 'Dos almas pequeñas. Dos almas que se escogieron. Ustedes son lo que no me deja entrar.', '[cold, slow, furious underneath] Dos almas pequeñas. Dos almas que se escogieron. [hissing] Ustedes son lo que no me deja entrar.'),
  EL('C04X.L1', '¿Nosotros?', '[surprised] ¿Nosotros?'),
  SERENA('C04X.S1', 'El Lazo Primordial: el primer amor que nació en el Santuario. Dos almas que se escogieron y que juntan la pasión de Aura y la paz de Lara.', '[reverent, moved] El Lazo Primordial: el primer amor que nació en el Santuario. Dos almas que se escogieron… y que juntan la pasión de Aura y la paz de Lara.'),
  SERENA('C04X.S2', 'De ese lazo brilla la Constelación de los Amantes. Mientras brille, el escudo no se rompe.'),
  ELLA('C04X.E1', 'Por eso parpadeó la constelación… nos estaba buscando a nosotros.', '[realizing, emotional] Por eso parpadeó la constelación… nos estaba buscando a nosotros.'),
  NATH('C04X.NG2', 'He apagado estrellas más grandes que ustedes.', '[menacing, cold] He apagado estrellas más grandes que ustedes.'),
  EL('C04X.L2', 'Pues inténtalo. Pero primero vas a tener que soltarnos. Y eso no va a pasar.', '[defiant, steady] Pues inténtalo. Pero primero vas a tener que soltarnos. [firm] Y eso no va a pasar.'),
];

/** SC4 · El descenso (después de los créditos de Sangre y Ceniza). */
export const LINEAS_SC4 = [
  N('SC4.N1', 'Muy lejos, más allá del escudo, en el mar de estrellas de Astra…', '[hushed, distant] Muy lejos, más allá del escudo, en el mar de estrellas de Astra…'),
  NATH('SC4.NG1', 'Sellaron al Conde. Cerraron mi grieta. Qué cálido brilla ese lazo… Todavía no.', '[quiet, cold, patient] Sellaron al Conde. Cerraron mi grieta. [almost tender, envious] Qué cálido brilla ese lazo… [whispering] Todavía no.'),
];

/** C11 · El agua que escucha: la entrada de Fuatia (antes de su primera línea de C11). */
export const LINEAS_C11_FUATIA = [
  N('C11X.N1', 'Primero fue una brasa en el barro. Después el agua se levantó, la tierra respiró y el viento lo juntó todo.', '[wonder, building] Primero fue una brasa en el barro. Después el agua se levantó… la tierra respiró… [awed] y el viento lo juntó todo.'),
  FUATIA('C11X.F1', 'No se asusten. Ustedes llevan toda la mañana tocándome.', '[calm, kind, a little amused] No se asusten. Ustedes llevan toda la mañana tocándome.'),
];

/** Eliana · El brote que puede esperar (Fiesta del Despertar Dorado). */
export const LINEAS_ELIANA = [
  N('ELI.N1', 'Fiesta del Despertar Dorado. El pueblo olía a pan de miel y a fogata.', '[warm, festive] Fiesta del Despertar Dorado. El pueblo olía a pan de miel y a fogata.'),
  ELIANA('ELI.E1', '¡Faltan las cintas doradas, las coronas y el canto de las doce velas! El rito tiene que quedar perfecto.', '[excited, rushing, stressed] ¡Faltan las cintas doradas, las coronas y el canto de las doce velas! [anxious] El rito tiene que quedar perfecto.'),
  L('ELI.NI1', 'nina', 'Nina', 'Señora Eliana… mi tía y yo no hemos comido desde ayer. ¿El rito da comida?', '[shy, small voice] Señora Eliana… mi tía y yo no hemos comido desde ayer. [innocent] ¿El rito da comida?'),
  N('ELI.N2', 'Eliana miró su altar enorme. Y después miró a la niña.'),
  ELIANA('ELI.E2', 'No, Nina. El rito no da comida. Pero yo sí.', '[softly, realizing] No, Nina. El rito no da comida. [warm, decided] Pero yo sí.'),
  ELLA('ELI.LA1', 'Esa es la fiesta que me gusta.', '[smiling, warm] Esa es la fiesta que me gusta.'),
  EL('ELI.L1', 'Yo reparto el pan de miel, esposa. Tú cuidas que nadie se quede sin.', '[cheerful] Yo reparto el pan de miel, esposa. Tú cuidas que nadie se quede sin.'),
  AURA('ELI.A1', 'Ahí está mi fuego. No en las velas: en las manos.', '[warm, laughing softly] Ahí está mi fuego. No en las velas: [tender] en las manos.'),
  ELIANA('ELI.E3', '¿Mi señora? Pensé que le fallaba si el rito no era hermoso.', '[moved, surprised] ¿Mi señora? [vulnerable] Pensé que le fallaba si el rito no era hermoso.'),
  AURA('ELI.A2', 'Lo más hermoso que vi hoy fue un altar a medio hacer y una niña comiendo.', '[gentle, joyful] Lo más hermoso que vi hoy fue un altar a medio hacer… y una niña comiendo.'),
];

/** T03 · La cría que no quiere hablar (Fuatia). */
export const LINEAS_T03 = [
  N('T03.N1', 'En el corral había una cría de unicornio que no dejaba que nadie se le acercara.'),
  L('T03.M1', 'cuidadora', 'Mara', 'Desde que llegaron los curiosos no come. Se esconde detrás del bebedero.', '[worried, practical] Desde que llegaron los curiosos no come. Se esconde detrás del bebedero.'),
  ELLA('T03.E1', 'Pobrecita… tanta gente mirándola.', '[tender, sad] Pobrecita… tanta gente mirándola.'),
  EL('T03.L1', 'Ya entendí. Afuera todo el mundo, por favor. Gracias, gracias.', '[polite but firm, a bit funny] Ya entendí. Afuera todo el mundo, por favor. [hurried] Gracias, gracias.'),
  FUATIA('T03.F1', 'No la llamen. Si quiere acercarse, sabrá cómo.', '[calm, observant] No la llamen. Si quiere acercarse, sabrá cómo.'),
  N('T03.N2', 'Se sentaron lejos, en silencio, hasta que se puso el sol.'),
  ELLA('T03.E2', 'Panda… mira. Vino solita.', '[whispering, delighted] Panda… mira. [emotional] Vino solita.'),
  FUATIA('T03.F2', 'El cariño que se fuerza se rompe. El que se espera, se queda.', '[soft, wise] El cariño que se fuerza se rompe. El que se espera… se queda.'),
];

/** S08 · La ayuda que no llegó (secreto): cómo nació Nath'Gora, en papel animado. */
export const LINEAS_S08 = [
  N('S08.N1', 'Antes de Celia, antes del escudo, en un rincón frío de Astra, alguien cuidaba una estrella.', '[storytelling, gentle, slow] Antes de Celia, antes del escudo, en un rincón frío de Astra… alguien cuidaba una estrella.'),
  NATH('S08.NG1', 'Se está apagando. Les pido ayuda: materia de estrella, un poco de calor. Nada más.', '[desperate, younger, pleading] Se está apagando. Les pido ayuda: materia de estrella, un poco de calor. [begging] Nada más.'),
  N('S08.N2', 'El panteón le respondió con coronas, con himnos, con homenajes. Con todo… menos con ayuda.', '[bitter, slow] El panteón le respondió con coronas, con himnos, con homenajes. [pause] Con todo… menos con ayuda.'),
  NATH('S08.NG2', 'No quería una corona. Quería que no se muriera.', '[broken, whispering] No quería una corona. [voice cracking] Quería que no se muriera.'),
  N('S08.N3', 'La estrella se apagó en sus manos. Y el frío que quedó adentro de él nunca volvió a calentarse.', '[sad, quiet] La estrella se apagó en sus manos. Y el frío que quedó adentro de él… nunca volvió a calentarse.'),
  N('S08.N4', 'Así nació Nath’Gora. Su dolor fue verdadero. Lo que hizo con él no tiene excusa.', '[solemn, firm] Así nació Nath’Gora. Su dolor fue verdadero. [pause] Lo que hizo con él no tiene excusa.'),
];

/** Eneas · Lo que no vuelve idéntico (Verdia): aquí nace la idea de los ciclos. */
export const LINEAS_ENEAS = [
  N('ENE.N1', 'En el Rosal Eterno, Eneas podaba un rosal que no necesitaba poda.', '[gentle, a little amused] En el Rosal Eterno, Eneas podaba un rosal que no necesitaba poda.'),
  L('ENE.EN1', 'verdia_eneas', 'Eneas', 'Llevo décadas aquí. Y hace un tiempo… me dan ganas de volver a nacer.', '[hesitant, gentle old man] Llevo décadas aquí. Y hace un tiempo… [shy] me dan ganas de volver a nacer.'),
  ELLA('ENE.E1', '¿Y por qué lo dice como si fuera un pecado?', '[kind, curious] ¿Y por qué lo dice como si fuera un pecado?'),
  L('ENE.EN2', 'verdia_eneas', 'Eneas', 'Porque toda la vida cuidé a los míos. Irme otra vez se siente como abandonarlos.', '[sad, honest] Porque toda la vida cuidé a los míos. Irme otra vez se siente como abandonarlos.'),
  LARA('ENE.LA1', 'Nadie abandona por seguir su camino, Eneas. Cada ciclo te hace distinto… pero lo que uno ama de verdad sabe reconocerse. Vida tras vida.', '[serene, tender] Nadie abandona por seguir su camino, Eneas. Cada ciclo te hace distinto… [warm] pero lo que uno ama de verdad sabe reconocerse. [softly] Vida tras vida.'),
  EL('ENE.L1', '¿Vida tras vida? ¿Así de terco es el amor?', '[surprised, smiling] ¿Vida tras vida? [playful] ¿Así de terco es el amor?'),
  LARA('ENE.LA2', 'Así de terco.', '[smiling, tender] Así de terco.'),
  L('ENE.EN3', 'verdia_eneas', 'Eneas', 'No voy a decidir hoy.', '[relieved, calm] No voy a decidir hoy.'),
  LARA('ENE.LA3', 'No tienes que hacerlo. El rosal te espera, igual que yo.', '[gentle] No tienes que hacerlo. El rosal te espera… igual que yo.'),
];

/** Ofelia · La casa que dejé esperando (Senda). */
export const LINEAS_OFELIA = [
  N('OFE.N1', 'En Senda, Ofelia levantaba por fin las paredes de una casa que había dejado a medias en vida.'),
  L('OFE.O1', 'senda_ofelia', 'Ofelia', 'Les prometí a los Ruiz que la terminaba. Me fui por un contrato mejor. Les llovió adentro dos inviernos.', '[tired, honest, ashamed] Les prometí a los Ruiz que la terminaba. Me fui por un contrato mejor. [quiet] Les llovió adentro dos inviernos.'),
  EL('OFE.L1', '¿Y ellos ya la perdonaron?', '[gentle] ¿Y ellos ya la perdonaron?'),
  L('OFE.O2', 'senda_ofelia', 'Ofelia', 'No lo sé. Y no la estoy terminando para que me perdonen. La termino porque se las debía.', '[firm, sincere] No lo sé. Y no la estoy terminando para que me perdonen. [steady] La termino porque se las debía.'),
  ELLA('OFE.E1', 'Eso es reparar. Lo otro sería comprar.', '[thoughtful, warm] Eso es reparar. Lo otro sería comprar.'),
  N('OFE.N2', 'Puso la última teja. El camino de Senda se abrió en escalones de luz.', '[uplifting, wonder] Puso la última teja. El camino de Senda se abrió en escalones de luz.'),
  LARA('OFE.LA1', 'Ven, Ofelia. Ya no tienes que cargar con la casa.', '[warm, welcoming] Ven, Ofelia. Ya no tienes que cargar con la casa.'),
  L('OFE.O3', 'senda_ofelia', 'Ofelia', '¿Puedo… puedo mirarla una vez más?', '[voice breaking, relieved] ¿Puedo… puedo mirarla una vez más?'),
  LARA('OFE.LA2', 'Las veces que quieras.', '[tender] Las veces que quieras.'),
];

/** Serena · El nombre que no se pronuncia por otro. */
export const LINEAS_SERENA = [
  N('SER.N1', 'Esa noche, en una casa del Pueblo del Sol, una anciana se estaba despidiendo.', '[very soft, slow] Esa noche, en una casa del Pueblo del Sol, una anciana se estaba despidiendo.'),
  SERENA('SER.S1', 'No le voy a decir que no va a doler. Le voy a decir que no se va a ir sola.', '[soft, very gentle] No le voy a decir que no va a doler. [tender] Le voy a decir que no se va a ir sola.'),
  N('SER.N2', 'Serena se quedó. Sostuvo su mano hasta que la vela bajó.'),
  LARA('SER.LA1', 'Ya la tengo, Serena. Puedes soltar.', '[barely a whisper, tender] Ya la tengo, Serena. Puedes soltar.'),
  SERENA('SER.S2', 'Cuídela, mi señora. Le gustaba el café con canela.', '[crying quietly, smiling] Cuídela, mi señora. [soft laugh through tears] Le gustaba el café con canela.'),
  LARA('SER.LA2', 'Lo sé. Ya se lo están preparando.', '[warm, comforting] Lo sé. Ya se lo están preparando.'),
  N('SER.N3', 'Serena apagó la vela. No había resuelto el dolor de nadie: solo había acompañado. Y eso, a veces, es todo.', '[gentle, reflective] Serena apagó la vela. No había resuelto el dolor de nadie: solo había acompañado. [softly] Y eso, a veces, es todo.'),
];

/** El Altar del Lazo (la casa): la invitación a la boda. */
export const LINEAS_ALTAR = [
  N('ALT.N1', 'Una a una, las reliquias de la granja y de la Noche encontraron su lugar en el altar de la casa.', '[warm, wonder] Una a una, las reliquias de la granja y de la Noche encontraron su lugar en el altar de la casa.'),
  ELLA('ALT.E1', 'Panda… está brillando.', '[amazed, whispering] Panda… está brillando.'),
  EL('ALT.L1', 'Y el techo… mira el techo.', '[awed] Y el techo… mira el techo.'),
  N('ALT.N2', 'Sobre la casa se dibujaron dos manos entrelazadas.'),
  CELIA('ALT.C1', '¡Lo lograron! El escudo nunca había estado tan fuerte.', '[joyful, bright] ¡Lo lograron! El escudo nunca había estado tan fuerte.'),
  AURA('ALT.A1', 'Y ahora que salvaron el mundo… hay algo que todavía no han celebrado.', '[playful, teasing] Y ahora que salvaron el mundo… [knowing] hay algo que todavía no han celebrado.'),
  LARA('ALT.LA1', 'Los esperamos en Eterna, junto al río. Cuando caiga la tarde.', '[smiling, serene] Los esperamos en Eterna, junto al río. Cuando caiga la tarde.'),
  FUATIA('ALT.F1', 'Vayan bien vestidos. Los cuatro elementos van a estar mirando.', '[dry humor, kind] Vayan bien vestidos. Los cuatro elementos van a estar mirando.'),
];

/** «Siempre te elegiré»: la boda en Eterna. Sin votos; Lara oficia y Javier dice su frase al final, junto al río. */
export const LINEAS_BODA = [
  LARA('BOD.LA1', 'He tomado de la mano a cada alma de este mundo cuando terminó su tiempo. Y en cada ciclo, sin falta, los vi a ustedes dos buscarse.', '[serene, loving, slow] He tomado de la mano a cada alma de este mundo cuando terminó su tiempo. [tender] Y en cada ciclo, sin falta… los vi a ustedes dos buscarse.'),
  AURA('BOD.A1', 'Y cada vez que se encontraron, el fuego volvió a encenderse. No porque yo lo prendiera: porque ustedes lo eligieron.', '[warm, joyful] Y cada vez que se encontraron, el fuego volvió a encenderse. [tender] No porque yo lo prendiera: porque ustedes lo eligieron.'),
  CELIA('BOD.C1', 'Esta tierra nació de mis manos. Este lazo nació de las suyas.', '[sweet, moved] Esta tierra nació de mis manos. [softly] Este lazo nació de las suyas.'),
  FUATIA('BOD.F1', 'Lo que se elige libremente pesa más que cualquier juramento. Fuego, agua, tierra y aire: los cuatro son testigos.', '[calm, solemn, kind] Lo que se elige libremente pesa más que cualquier juramento. [slowly] Fuego, agua, tierra y aire: los cuatro son testigos.'),
  LARA('BOD.LA2', 'Entonces no les pido promesas. Ya se eligieron. Vayan juntos.', '[smiling, tender, final] Entonces no les pido promesas. Ya se eligieron. [warm] Vayan juntos.'),
  N('BOD.N1', 'Y la Constelación de los Amantes brilló entera sobre la casa. Desde esa noche, ninguna ceniza volvió a encontrar por dónde entrar.', '[uplifting, warm, slow] Y la Constelación de los Amantes brilló entera sobre la casa. [tender] Desde esa noche, ninguna ceniza volvió a encontrar por dónde entrar.'),
  EL('BOD.L1', 'Laura… sin importar cuántos ciclos pasen, cuántos universos o mundos visitemos, ni en qué planeta nos toque vivir… siempre te voy a elegir a ti.', '[soft, intimate, deeply loving, slow] Laura… sin importar cuántos ciclos pasen, cuántos universos o mundos visitemos, ni en qué planeta nos toque vivir… [whispering, sure] siempre te voy a elegir a ti.'),
  ELLA('BOD.E1', '¿Y mañana?', '[sleepy, happy, morning] ¿Y mañana?'),
  EL('BOD.L2', 'Miramos si brotó.', '[smiling, tender] Miramos si brotó.'),
];

/** El Conde con voz en Sangre y Ceniza (al aparecer y al cambiar de fase). */
export const LINEAS_JEFES = [
  CONDE('JEF.C1', 'Bienvenidos a mi casa. Aquí nadie se muere… y nadie se va.', '[mocking, rich, theatrical] Bienvenidos a mi casa. [sinister] Aquí nadie se muere… y nadie se va.'),
  CONDE('JEF.C2', '¡Esta noche es mía! ¡Mía para siempre!', '[furious, desperate, roaring] ¡Esta noche es mía! ¡Mía para siempre!'),
];

export const LINEAS_HISTORIA: LineaCine[] = [
  ...LINEAS_SC0, ...LINEAS_SC1, ...LINEAS_SC2, ...LINEAS_SC3, ...LINEAS_C04_LAZO, ...LINEAS_SC4, ...LINEAS_C11_FUATIA,
  ...LINEAS_ELIANA, ...LINEAS_T03, ...LINEAS_S08, ...LINEAS_ENEAS, ...LINEAS_OFELIA, ...LINEAS_SERENA,
  ...LINEAS_ALTAR, ...LINEAS_BODA, ...LINEAS_JEFES,
];
