// Las presentaciones de cada lugar (docs/en-obra/pelicula-de-astra.md, capítulo 6 bis): la llegada a cada mundo
// (35-45 s, dos líneas) y la postal de cada lugar (12-20 s, una línea), siempre con el narrador. Las lee también
// scripts/granja-v3/voces-cine.mjs. El id de la postal es el id del lugar (astra-mundo-datos.ts) o del bioma de Sangre.
import type { LineaCine } from './cine-granja';
import { POSTALES_SANGRE } from '../sangre/datos/postales';

const N = (id: string, texto: string, d?: string): LineaCine => ({ id, quien: 'narrador', nombre: 'Narrador', texto, d, desde: 0.8 });

/** Llegada a cada mundo: dos líneas (qué es en el mito y quién vive ahí). */
export const LLEGADAS: Record<string, LineaCine[]> = {
  frontera: [
    N('LUG.frontera.1', 'Esta es la Frontera: el borde del escudo de Celia, donde de noche se ve el mar de estrellas.', '[grave, wonder] Esta es la Frontera: el borde del escudo de Celia… donde de noche se ve el mar de estrellas.'),
    N('LUG.frontera.2', 'A un lado, Vigilia cuida a los que escaparon. Al otro, Valdemora sigue bajo la Noche Eterna.', '[serious] A un lado, Vigilia cuida a los que escaparon. [darker] Al otro, Valdemora sigue bajo la Noche Eterna.'),
  ],
  verdia: [
    N('LUG.verdia.1', 'Esto es Verdia, el paraíso de las almas nobles.', '[warm, awed, gentle] Esto es Verdia… el paraíso de las almas nobles.'),
    N('LUG.verdia.2', 'Aquí nadie trabaja para siempre: se pasea, se canta, se discute por canciones… y cada uno decide si quedarse o volver a nacer.', '[warm, a little playful] Aquí nadie trabaja para siempre: se pasea, se canta, se discute por canciones… [tender] y cada uno decide si quedarse o volver a nacer.'),
  ],
  senda: [
    N('LUG.senda.1', 'Esto es Senda, el camino de la purificación.', '[calm, solemn] Esto es Senda, el camino de la purificación.'),
    N('LUG.senda.2', 'No es un castigo: es un lugar para reparar lo que se dejó roto. Cada visitante lleva un ancla para volver.', '[gentle, reassuring] No es un castigo: es un lugar para reparar lo que se dejó roto. Cada visitante lleva un ancla para volver.'),
  ],
  nox: [
    N('LUG.nox.1', 'Esto es Nox, la oscuridad fuera del ciclo.', '[low, ominous, slow] Esto es Nox… la oscuridad fuera del ciclo.'),
    N('LUG.nox.2', 'Nadie entra a sus celdas. El Bastión del Velo vigila desde el borde, con relevos y con derecho a irse.', '[serious, steady] Nadie entra a sus celdas. El Bastión del Velo vigila desde el borde, con relevos y con derecho a irse.'),
  ],
  cielo: [
    N('LUG.cielo.1', 'Esto es el cielo de Astra, encima del escudo.', '[wonder, expansive] Esto es el cielo de Astra, encima del escudo.'),
    N('LUG.cielo.2', 'Una estación, tres lunas y asteroides donde cada gota de agua y cada bocanada de aire se cuentan.', '[curious, warm] Una estación, tres lunas y asteroides donde cada gota de agua y cada bocanada de aire se cuentan.'),
  ],
  confluencia: [
    N('LUG.confluencia.1', 'Esto es Confluencia, donde el fuego, el agua, la tierra y el aire vuelven a cruzarse.', '[awed, flowing] Esto es Confluencia, donde el fuego, el agua, la tierra y el aire vuelven a cruzarse.'),
    N('LUG.confluencia.2', 'Fuatia no vive aquí. Pero aquí se nota cuando alguien hace trampa con lo que vuelve.', '[knowing, slightly ominous] Fuatia no vive aquí. Pero aquí se nota… cuando alguien hace trampa con lo que vuelve.'),
  ],
};

/** La postal de cada lugar: una línea. */
export const POSTALES: Record<string, LineaCine> = {
  pueblo_sol: N('LUG.pueblo_sol', 'El Pueblo del Sol: un cruce de oficios con mercado en la plaza, la posada, la escuela y los dos altares de las Santas.', '[warm, cheerful] El Pueblo del Sol: un cruce de oficios con mercado en la plaza, la posada, la escuela… y los dos altares de las Santas.'),
  cruce_valle: N('LUG.cruce_valle', 'El Cruce del Valle: donde se juntan todos los caminos de Celia. Desde aquí se sale a todas partes.'),
  puerto_lirios: N('LUG.puerto_lirios', 'El Puerto de los Lirios: embarcaderos, humedales y pescadores que discuten con los datos en la mano.', '[breezy, amused] El Puerto de los Lirios: embarcaderos, humedales y pescadores que discuten con los datos en la mano.'),
  brumaverde: N('LUG.brumaverde', 'Brumaverde: el bosque donde cada árbol que se corta se decide en consejo.', '[calm, misty] Brumaverde: el bosque donde cada árbol que se corta se decide en consejo.'),
  piedralumbre: N('LUG.piedralumbre', 'Piedralumbre: la mina que comparte su mineral con el Santuario… y guarda un accidente que nadie terminó de contar.', '[intrigued] Piedralumbre: la mina que comparte su mineral con el Santuario… [lower] y guarda un accidente que nadie terminó de contar.'),
  brasaviva: N('LUG.brasaviva', 'Brasaviva: hornos, baños calientes y artesanos que reparan las tazas en vez de botarlas.', '[warm, cozy] Brasaviva: hornos, baños calientes y artesanos que reparan las tazas en vez de botarlas.'),
  nieveclara: N('LUG.nieveclara', 'Nieveclara: auroras, ventiscas y un pueblo que reparte la luz entre personas y animales.', '[crisp, wonder] Nieveclara: auroras, ventiscas… y un pueblo que reparte la luz entre personas y animales.'),
  vigilia: N('LUG.vigilia', 'Vigilia de Ceniza: hospital, cocina y turnos de guardia. Aquí llegan los que escapan de la Noche.', '[serious, caring] Vigilia de Ceniza: hospital, cocina y turnos de guardia. Aquí llegan los que escapan de la Noche.'),
  rosal_eterno: N('LUG.rosal_eterno', 'El Rosal Eterno: paseos, rosas y té para estar juntos, aunque nadie tenga hambre.', '[gentle, serene] El Rosal Eterno: paseos, rosas y té para estar juntos… aunque nadie tenga hambre.'),
  jardines_eco: N('LUG.jardines_eco', 'Los Jardines del Eco: donde las abejas se enteran primero de las noticias, buenas y malas.', '[soft, a little whimsical] Los Jardines del Eco: donde las abejas se enteran primero de las noticias, buenas y malas.'),
  travesia: N('LUG.travesia', 'El Umbral de la Travesía: la entrada a Senda. Aquí se descansa antes de reparar.'),
  refugio_hilos: N('LUG.refugio_hilos', 'El Refugio de los Hilos: hilos tendidos entre las almas rescatadas y el camino de vuelta.', '[tender, hopeful] El Refugio de los Hilos: hilos tendidos entre las almas rescatadas y el camino de vuelta.'),
  bastion_velo: N('LUG.bastion_velo', 'El Bastión del Velo: la última guardia antes de Nox.', '[grave, quiet] El Bastión del Velo: la última guardia antes de Nox.'),
  estacion_celia: N('LUG.estacion_celia', 'La Estación sobre Celia: un hogar en órbita, con reservas contadas y ventanas al planeta.', '[wonder] La Estación sobre Celia: un hogar en órbita, con reservas contadas y ventanas al planeta.'),
  huerto_aurelia: N('LUG.huerto_aurelia', 'El Huerto de Aurelia: cultivos bajo la luna dorada, que hace crecer todo más rápido.', '[warm, bright] El Huerto de Aurelia: cultivos bajo la luna dorada, que hace crecer todo más rápido.'),
  vigia_nocturna: N('LUG.vigia_nocturna', 'La Vigía de Nocturna: la luna de ébano que alumbra el camino de las almas.', '[hushed, reverent] La Vigía de Nocturna: la luna de ébano que alumbra el camino de las almas.'),
  cantera_esmeralda: N('LUG.cantera_esmeralda', 'La Cantera de Esmeralda: la lunita de Celia, con sus mareas de maná y sus vetas brillantes.', '[playful, sparkling] La Cantera de Esmeralda: la lunita de Celia, con sus mareas de maná y sus vetas brillantes.'),
  campamento_fragmentos: N('LUG.campamento_fragmentos', 'El Campamento de los Fragmentos: latas, compost y gente que vive de lo que el cielo deja caer.', '[amused, warm] El Campamento de los Fragmentos: latas, compost y gente que vive de lo que el cielo deja caer.'),
  fragmentos_cobre: N('LUG.fragmentos_cobre', 'El Asteroide Cobrizo: cobre meteórico y centinelas que no quieren soltarlo.', '[tense] El Asteroide Cobrizo: cobre meteórico… y centinelas que no quieren soltarlo.'),
  fragmentos_cristal: N('LUG.fragmentos_cristal', 'El Asteroide Prisma: cristales que parten la luz en mil colores.', '[wonder, sparkling] El Asteroide Prisma: cristales que parten la luz en mil colores.'),
  ambarina: N('LUG.ambarina', 'Ambarina: un planeta que sobrevivió administrando cada gota de agua.', '[dry, respectful] Ambarina: un planeta que sobrevivió administrando cada gota de agua.'),
  iridalia: N('LUG.iridalia', 'Iridalia: un mundo que escucha a sus cristales y vota hasta de madrugada.', '[wonder, slightly amused] Iridalia: un mundo que escucha a sus cristales… y vota hasta de madrugada.'),
  borde_astra: N('LUG.borde_astra', 'El Borde de Astra: el último lugar con piso antes del mar de estrellas. Aquí se defiende el escudo.', '[epic, grave] El Borde de Astra: el último lugar con piso antes del mar de estrellas. [firm] Aquí se defiende el escudo.'),
  confluencia: N('LUG.confluencia', 'El Refugio de Confluencia: donde los cuatro retornos se cruzan… y alguien está haciendo trampa con ellos.', '[intrigued] El Refugio de Confluencia: donde los cuatro retornos se cruzan… [suspicious] y alguien está haciendo trampa con ellos.'),
  confluencia_fuego: N('LUG.confluencia_fuego', 'La Caldera del Rescoldo: el fuego que sabe cuándo detenerse.', '[warm, steady] La Caldera del Rescoldo: el fuego que sabe cuándo detenerse.'),
  confluencia_agua: N('LUG.confluencia_agua', 'El Mar de los Retornos: el agua que siempre vuelve a casa.', '[flowing, tender] El Mar de los Retornos: el agua que siempre vuelve a casa.'),
  confluencia_tierra: N('LUG.confluencia_tierra', 'La Terraza de las Raíces: la tierra que sostiene sin apretar.', '[grounded, calm] La Terraza de las Raíces: la tierra que sostiene sin apretar.'),
  confluencia_aire: N('LUG.confluencia_aire', 'La Altura de las Corrientes: el aire que no le obedece a nadie.', '[light, free] La Altura de las Corrientes: el aire que no le obedece a nadie.'),
  ...POSTALES_SANGRE,
};

export const LINEAS_LUGARES: LineaCine[] = [...Object.values(LLEGADAS).flat(), ...Object.values(POSTALES)];
