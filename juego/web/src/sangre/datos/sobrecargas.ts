// Las sobrecargas nuevas de Sangre y Ceniza 2 (lo de Deep Rock Galactic: Survivor): cada arma pasa de 3 a 6.
// Las 3 de antes más una nueva son las **templadas** (en los niveles 6 y 12 se escoge 1 de 3); las 2 **malditas** salen
// en el nivel 18 (1 de 2): muy fuertes con su contra, y traen una de las cuatro etiquetas especiales:
//   A dos manos (Akimbo): también ataca hacia atrás, pegando un poco menos.
//   De cinto (Sidearm): esta arma pega menos pero más seguido, y las demás +20 %.
//   La consentida (The Favourite): esta arma +100 %, las demás −30 %.
//   Bala gorda (Thick Boy): todos los proyectiles en uno solo enorme (en las armas sin proyectiles, un golpe enorme y
//   más lento).
// Con dos armas de la misma etiqueta especial salen sus mejoras al subir de nivel (como cualquier etiqueta).
// Los ids no se cambian: van en lo que se manda por la red.
import { F, type DefSobrecarga } from '../tipos';

type Sc = Omit<DefSobrecarga, 'id' | 'nombre' | 'desc'>;
const T = (id: string, nombre: string, desc: string, o: Sc): DefSobrecarga => ({ id, nombre, desc, ...o });
const DM = (id: string, nombre: string, desc: string): DefSobrecarga =>
  ({ id, nombre, desc: `A dos manos: ${desc} (−15 % de daño).`, flags: F.DETRAS, por: { dano: 0.85 }, etiqueta: 'dos_manos', maldita: true });
const CI = (id: string, nombre: string, desc: string): DefSobrecarga =>
  ({ id, nombre, desc: `De cinto: ${desc}: pega 40 % menos y 30 % más seguido; tus otras armas, +20 % de daño.`, por: { dano: 0.6, cadencia: 0.7 }, etiqueta: 'cinto', maldita: true });
const CO = (id: string, nombre: string, desc: string): DefSobrecarga =>
  ({ id, nombre, desc: `La consentida: ${desc}: +100 % de daño; tus otras armas, −30 %.`, por: { dano: 2 }, etiqueta: 'consentida', maldita: true });
const GO = (id: string, nombre: string, desc: string): DefSobrecarga =>
  ({ id, nombre, desc: `Bala gorda: ${desc}.`, etiqueta: 'gorda', maldita: true });

/** Por arma: [templada nueva, maldita, maldita]. */
export const SOBRECARGAS_NUEVAS: Record<string, DefSobrecarga[]> = {
  // ----------------------------------------------------------------------------------------- Monarca
  espada_larga: [
    T('filo_plata', 'Filo de plata', 'Daño sagrado y +15 % de crítico.', { mas: { critico: 0.15 }, etiqueta: 'sagrado' }),
    CO('espada_linaje', 'Espada del linaje', 'la espada de tu casa'),
    GO('mandoble', 'Mandoble', 'un solo tajo enorme: +50 % de área y +40 % de daño, pero más lento'),
  ],
  cetro_hierro: [
    T('cetro_escarcha', 'Cetro de escarcha', 'El anillo es de hielo y frena mucho.', { mas: { lento: 0.4 }, etiqueta: 'hielo' }),
    GO('gran_decreto', 'Gran decreto', 'un anillo enorme y lento que pega 40 % más'),
    CO('cetro_dinastia', 'Cetro de la dinastía', 'el cetro de los reyes'),
  ],
  estandarte: [
    T('estandarte_fuego', 'Estandarte en llamas', 'El aura quema a los que se acercan.', { mas: { quema: 3 }, etiqueta: 'fuego' }),
    CI('banderin', 'Banderín de cinto', 'un banderín que se lleva al cinto'),
    GO('pendon_gigante', 'Pendón gigante', 'el aura crece 50 % y pega 40 % más, pero late más despacio'),
  ],
  lanza_ceremonial: [
    T('punta_envenenada', 'Punta envenenada', 'La estocada envenena.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
    DM('lanza_doble', 'Lanza de dos puntas', 'la estocada sale también hacia atrás'),
    CO('lanza_heredada', 'Lanza heredada', 'la lanza de la coronación'),
  ],
  // ----------------------------------------------------------------------------------------- Campesino
  horca: [
    T('horca_estiercol', 'Horca de estiércol', 'Lo que pincha se envenena.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
    DM('horca_doble', 'Horca de doble mango', 'pincha adelante y atrás'),
    GO('bieldo_gigante', 'Bieldo gigante', 'una estocada enorme y lenta que pega 40 % más'),
  ],
  hoz: [
    T('hoz_luna', 'Hoz de luna', 'Daño de sombra y +10 % de crítico.', { mas: { critico: 0.1 }, etiqueta: 'sombra' }),
    DM('dos_hoces', 'Dos hoces', 'siega adelante y atrás'),
    CI('hoz_cinto', 'Hocino de cinto', 'una hoz chiquita'),
  ],
  antorcha: [
    T('llama_azul', 'Llama azul', 'Fuego frío: también frena.', { mas: { lento: 0.25 }, etiqueta: 'hielo' }),
    DM('dos_antorchas', 'Dos antorchas', 'una llamarada adelante y otra atrás'),
    CO('antorcha_eterna', 'Antorcha eterna', 'la llama que nunca se apaga'),
  ],
  honda: [
    T('bala_plomo', 'Bala de plomo', 'Atraviesa a dos más y pega 10 % más.', { mas: { perfora: 2 }, por: { dano: 1.1 } }),
    GO('piedra_molino', 'Piedra de molino', 'todas las piedras en una sola, enorme'),
    CI('honda_cinto', 'Honda de cinto', 'una honda de bolsillo'),
  ],
  // ----------------------------------------------------------------------------------------- Prisionero
  grillete: [
    T('grillete_oxido', 'Grillete oxidado', 'El óxido envenena.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
    GO('ancla_galeote', 'Ancla de galeote', 'un latigazo enorme y lento que pega 40 % más'),
    CO('grillete_viejo', 'El grillete de siempre', 'el grillete que te acompañó en la celda'),
  ],
  bola_hierro: [
    T('bola_rojo', 'Bola al rojo', 'Quema a los que golpea.', { mas: { quema: 5 }, etiqueta: 'fuego' }),
    GO('bola_demoledora', 'Bola demoledora', 'una sola bola enorme'),
    CI('bola_cinto', 'Bolita de cinto', 'una bola chiquita y rápida'),
  ],
  punos: [
    T('punos_helados', 'Puños helados', 'Cada golpe frena.', { mas: { lento: 0.3 }, etiqueta: 'hielo' }),
    DM('puno_codazo', 'Puño y codazo', 'también golpea hacia atrás'),
    CO('rabia_preso', 'Rabia del preso', 'los puños que rompieron las cadenas'),
  ],
  pico_robado: [
    T('pico_plata', 'Pico de plata', 'Daño sagrado y +10 % de crítico.', { mas: { critico: 0.1 }, etiqueta: 'sagrado' }),
    DM('picos_gemelos', 'Picos gemelos', 'lanza otro pico hacia atrás'),
    GO('pico_gigante', 'Pico de gigante', 'todos los picos en uno solo, enorme'),
  ],
  // ----------------------------------------------------------------------------------------- Caballero
  maza: [
    T('maza_escarcha', 'Maza de escarcha', 'Cada golpe frena mucho.', { mas: { lento: 0.35 }, etiqueta: 'hielo' }),
    CO('maza_ancestral', 'Maza ancestral', 'la maza de tu orden'),
    GO('maza_asedio', 'Maza de asedio', 'un golpe enorme y lento que pega 40 % más'),
  ],
  mangual: [
    T('mangual_puas', 'Mangual de púas', 'Hace sangrar.', { mas: { sangrado: 3 }, etiqueta: 'sangre' }),
    GO('bola_asedio', 'Bola de asedio', 'una sola cabeza enorme'),
    CI('mangual_cinto', 'Mangual de cinto', 'un mangual liviano'),
  ],
  lanza_justa: [
    T('lanza_bendita', 'Lanza bendita', 'Daño sagrado y +10 % de crítico.', { mas: { critico: 0.1 }, etiqueta: 'sagrado' }),
    DM('carga_doble', 'Lanza de doble punta', 'carga adelante y atrás'),
    CO('lanza_campeon', 'Lanza del campeón', 'la lanza de los torneos ganados'),
  ],
  escudo_arrojadizo: [
    T('escudo_puas', 'Escudo de púas', 'Hace sangrar.', { mas: { sangrado: 3 }, etiqueta: 'sangre' }),
    DM('escudo_espalda', 'Escudo a la espalda', 'lanza otro escudo hacia atrás'),
    GO('escudo_paves', 'Pavés', 'todos los escudos en uno solo, enorme'),
  ],
  // ----------------------------------------------------------------------------------------- Cazador
  ballesta: [
    T('virote_envenenado', 'Virote envenenado', 'Los virotes envenenan.', { mas: { veneno: 4 }, etiqueta: 'veneno' }),
    DM('ballestas_gemelas', 'Ballestas gemelas', 'dispara también hacia atrás'),
    GO('virote_asedio', 'Virote de asedio', 'todos los virotes en uno solo, enorme'),
  ],
  estacas: [
    T('estacas_encendidas', 'Estacas encendidas', 'Las estacas queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
    GO('estaca_mayor', 'Estaca mayor', 'todas las estacas en una sola, enorme'),
    CI('estacas_cinto', 'Estacas de cinto', 'estacas cortas'),
  ],
  agua_bendita: [
    T('agua_helada', 'Agua helada', 'El charco frena mucho.', { mas: { lento: 0.4 }, etiqueta: 'hielo' }),
    GO('pila_entera', 'La pila entera', 'todos los frascos en uno solo, enorme'),
    CO('agua_rio_santo', 'Agua del río santo', 'el agua más bendita que hay'),
  ],
  trabuco: [
    T('cartucho_sal', 'Cartucho de sal', 'Aturde un momento.', { mas: { aturde: 0.35 } }),
    DM('dos_trabucos', 'Dos trabucos', 'dispara también hacia atrás'),
    GO('bala_canon', 'Bala de cañón', 'un disparo enorme y lento que pega 40 % más'),
  ],
  // ----------------------------------------------------------------------------------------- Herrero
  martillo: [
    T('martillo_rojo', 'Martillo al rojo', 'El martillazo quema.', { mas: { quema: 5 }, etiqueta: 'fuego' }),
    GO('martillo_mayor', 'Martillo de la forja mayor', 'un martillazo enorme y lento que pega 40 % más'),
    CO('martillo_padre', 'El martillo del padre', 'el martillo con que aprendiste'),
  ],
  torreta_ballesta: [
    T('virotes_escarcha', 'Virotes de escarcha', 'La torreta frena.', { mas: { lento: 0.35 }, etiqueta: 'hielo' }),
    GO('balista', 'Balista', 'un solo virote enorme'),
    CI('torreta_portatil', 'Torreta portátil', 'una torreta chiquita'),
  ],
  yunque: [
    T('yunque_escarcha', 'Yunque de escarcha', 'Al caer frena a los de alrededor.', { mas: { lento: 0.4 }, etiqueta: 'hielo' }),
    GO('yunque_catedral', 'Yunque de catedral', 'todos los yunques en uno solo, enorme'),
    CO('yunque_familia', 'El yunque de la familia', 'el yunque que heredaste'),
  ],
  chispas: [
    T('chispas_azufre', 'Chispas de azufre', 'Las chispas envenenan.', { mas: { veneno: 2 }, etiqueta: 'veneno' }),
    DM('fuelle_doble', 'Fuelle doble', 'echa chispas también hacia atrás'),
    CI('chispero', 'Chispero de cinto', 'un chispero de bolsillo'),
  ],
  // ----------------------------------------------------------------------------------------- Alquimista
  frasco_acido: [
    T('acido_hirviente', 'Ácido hirviente', 'El ácido también quema.', { mas: { quema: 3 }, etiqueta: 'fuego' }),
    GO('damajuana', 'Damajuana', 'todos los frascos en uno solo, enorme'),
    CI('frasquitos', 'Frasquitos de cinto', 'frascos chiquitos'),
  ],
  fuego_griego: [
    T('fuego_negro', 'Fuego negro', 'Daño de sombra y maldice.', { mas: { maldicion: 1 }, etiqueta: 'sombra' }),
    GO('tonel_griego', 'Tonel de fuego griego', 'todos los frascos en uno solo, enorme'),
    CO('receta_secreta', 'La receta secreta', 'la fórmula que nadie más conoce'),
  ],
  frasco_helado: [
    T('hielo_eterno', 'Hielo eterno', 'El frío dura 50 % más.', { por: { duracion: 1.5 }, mas: { lento: 0.1 } }),
    DM('manos_heladas', 'Dos manos heladas', 'lanza otro frasco hacia atrás'),
    GO('frasco_glaciar', 'Frasco glaciar', 'todos los frascos en uno solo, enorme'),
  ],
  gas_venenoso: [
    T('gas_inflamable', 'Gas inflamable', 'El gas también quema.', { mas: { quema: 2 }, etiqueta: 'fuego' }),
    GO('nube_peste', 'Nube de peste', 'una nube enorme que late más despacio y pega 40 % más'),
    CO('formula_maestra', 'Fórmula maestra', 'tu mejor veneno'),
  ],
  // ----------------------------------------------------------------------------------------- Sepulturero
  pala: [
    T('cal_viva', 'Pala de cal viva', 'La tierra quema como veneno.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
    DM('palada_vuelta', 'Palada de vuelta', 'también golpea hacia atrás'),
    CO('pala_abuelo', 'La pala del abuelo', 'la pala de toda la vida'),
  ],
  linterna_almas: [
    T('animas_ardientes', 'Ánimas ardientes', 'Las almas queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
    GO('alma_mayor', 'Alma mayor', 'todas las almas en una sola, enorme'),
    CI('farolito', 'Farolito de cinto', 'una linterna chiquita'),
  ],
  huesos: [
    T('huesos_podridos', 'Huesos podridos', 'Los huesos envenenan.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
    DM('huesos_atras', 'Huesos por la espalda', 'tira huesos también hacia atrás'),
    GO('calavera_rodante', 'Calavera rodante', 'todos los huesos en una calavera enorme'),
  ],
  campana_funebre: [
    T('campana_escarcha', 'Campana de escarcha', 'El tañido frena mucho.', { mas: { lento: 0.4 }, etiqueta: 'hielo' }),
    GO('campanon', 'Campanón', 'un tañido enorme y lento que pega 40 % más'),
    CO('campana_mayor', 'La campana mayor', 'la campana de la torre'),
  ],
  // ----------------------------------------------------------------------------------------- Inquisidor
  incensario: [
    T('incienso_negro', 'Incienso negro', 'Daño de sombra y maldice.', { mas: { maldicion: 1 }, etiqueta: 'sombra' }),
    GO('botafumeiro', 'Botafumeiro', 'el humo crece 50 % y pega 40 % más, pero late más despacio'),
    CI('incensario_cinto', 'Incensario de cinto', 'un incensario chiquito'),
  ],
  libro_oraciones: [
    T('paginas_escarcha', 'Páginas escarchadas', 'Las páginas frenan.', { mas: { lento: 0.35 }, etiqueta: 'hielo' }),
    GO('libro_mayor', 'Libro mayor', 'todas las páginas en una sola, enorme'),
    CO('libro_horas', 'Libro de horas', 'tu libro de oraciones de siempre'),
  ],
  cruz_plata: [
    T('cruz_hierro', 'Cruz de hierro', 'Aturde un momento.', { mas: { aturde: 0.3 }, por: { dano: 1.1 } }),
    DM('cruz_dos_brazos', 'Cruz de dos brazos', 'lanza otra cruz hacia atrás'),
    GO('cruz_procesion', 'Cruz de procesión', 'todas las cruces en una sola, enorme'),
  ],
  rayo_sagrado: [
    T('fuego_cielo', 'Fuego del cielo', 'El rayo también quema.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
    GO('un_rayo', 'Un solo rayo', 'todos los saltos en un rayo enorme'),
    CO('el_elegido', 'El elegido', 'la luz que te escogió'),
  ],
  // ----------------------------------------------------------------------------------------- Verdugo
  hacha_verdugo: [
    T('hacha_escarcha', 'Hacha de escarcha', 'Cada tajo frena mucho.', { mas: { lento: 0.35 }, etiqueta: 'hielo' }),
    DM('dos_hachas_verdugo', 'Dos hachas', 'también corta hacia atrás'),
    CO('hacha_oficio', 'Hacha del oficio', 'el hacha de tu cadalso'),
  ],
  ganchos: [
    T('gancho_infecto', 'Gancho infecto', 'Los ganchos envenenan.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
    DM('ganchos_espalda', 'Ganchos a la espalda', 'lanza ganchos también hacia atrás'),
    CI('gancho_cinto', 'Gancho de cinto', 'un gancho chiquito'),
  ],
  guillotina: [
    T('cuchilla_rojo', 'Cuchilla al rojo', 'La cuchilla quema.', { mas: { quema: 6 }, etiqueta: 'fuego' }),
    GO('gran_cadalso', 'Gran cadalso', 'todas las cuchillas en una sola, enorme'),
    CO('la_de_la_plaza', 'La de la plaza', 'la guillotina de la plaza mayor'),
  ],
  soga: [
    T('soga_espinas', 'Soga de espinas', 'Hace sangrar.', { mas: { sangrado: 3 }, etiqueta: 'sangre' }),
    DM('dos_sogas', 'Dos sogas', 'azota también hacia atrás'),
    CI('soga_cinto', 'Soga de cinto', 'una soga corta'),
  ],
  // ----------------------------------------------------------------------------------------- Bruja
  baston_cuervos: [
    T('cuervos_ceniza', 'Cuervos de ceniza', 'Los cuervos queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
    GO('cuervo_rey', 'El cuervo rey', 'todos los cuervos en uno solo, enorme'),
    CI('varita_cinto', 'Varita de cinto', 'una varita chiquita'),
  ],
  vudu: [
    T('alfiler_rojo', 'Alfiler al rojo', 'El dolor también quema.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
    GO('muneco_grande', 'Muñeco grande', 'todos los saltos en un dolor enorme'),
    CO('muneco_favorito', 'El muñeco favorito', 'el muñeco que cosiste primero'),
  ],
  caldero: [
    T('caldero_hirviendo', 'Caldero hirviendo', 'El charco también quema.', { mas: { quema: 3 }, etiqueta: 'fuego' }),
    GO('caldero_comunal', 'Caldero comunal', 'un charco enorme que pega 40 % más, pero sale más despacio'),
    CO('caldero_abuela', 'El caldero de la abuela', 'el caldero de tu linaje'),
  ],
  plumas_negras: [
    T('plumas_escarcha', 'Plumas de escarcha', 'Las plumas frenan.', { mas: { lento: 0.3 }, etiqueta: 'hielo' }),
    DM('plumas_remolino', 'Plumas en remolino', 'lanza plumas también hacia atrás'),
    GO('pluma_negra_mayor', 'Pluma negra mayor', 'todas las plumas en una sola, enorme'),
  ],
  // ----------------------------------------------------------------------------------------- Juglar
  laud: [
    T('cuerdas_fuego', 'Cuerdas de fuego', 'La música quema.', { mas: { quema: 3 }, etiqueta: 'fuego' }),
    DM('duo', 'Dúo', 'toca también hacia atrás'),
    CO('laud_estrella', 'El laúd estrella', 'el laúd de las grandes noches'),
  ],
  cuchillos_malabar: [
    T('cuchillos_envenenados', 'Cuchillos envenenados', 'Los cuchillos envenenan.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
    GO('cuchillo_feria', 'Cuchillo de feria', 'todos los cuchillos en uno solo, enorme'),
    CI('cuchillos_cinto', 'Cuchillos de cinto', 'cuchillos chiquitos'),
  ],
  flauta: [
    T('nota_helada', 'Nota helada', 'Las notas frenan.', { mas: { lento: 0.35 }, etiqueta: 'hielo' }),
    GO('nota_grave', 'Nota grave', 'todas las notas en una sola, enorme'),
    CO('flauta_magica', 'La flauta mágica', 'la flauta que encanta a cualquiera'),
  ],
  tambor_guerra: [
    T('parche_fuego', 'Parche de fuego', 'El redoble quema.', { mas: { quema: 3 }, etiqueta: 'fuego' }),
    GO('timbal', 'Timbal', 'un golpe enorme y lento que pega 40 % más'),
    CI('tamboril', 'Tamboril de cinto', 'un tambor chiquito'),
  ],
  // ----------------------------------------------------------------------------------------- Comunes
  daga: [
    T('daga_sangria', 'Daga de sangría', 'Las dagas hacen sangrar.', { mas: { sangrado: 3 }, etiqueta: 'sangre' }),
    DM('dagas_espalda', 'Dagas por la espalda', 'lanza dagas también hacia atrás'),
    CI('daga_bota', 'Daga de bota', 'una daga escondida'),
  ],
  arco_largo: [
    T('flecha_escarcha', 'Flecha de escarcha', 'Las flechas frenan.', { mas: { lento: 0.35 }, etiqueta: 'hielo' }),
    GO('flecha_balista', 'Flecha de balista', 'todas las flechas en una sola, enorme'),
    CO('arco_tejo', 'Arco de tejo viejo', 'el arco que nunca falla'),
  ],
  hacha_arrojadiza: [
    T('hacha_ardiente', 'Hacha ardiente', 'Las hachas queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
    DM('hachas_lados', 'Hachas a los dos lados', 'lanza otra hacha hacia atrás'),
    GO('hacha_lenador', 'Hacha de leñador', 'todas las hachas en una sola, enorme'),
  ],
  bomba: [
    T('bomba_azufre', 'Bomba de azufre', 'La explosión envenena.', { mas: { veneno: 4 }, etiqueta: 'veneno' }),
    GO('la_bomba_gorda', 'La bomba gorda', 'todas las bombas en una sola, enorme'),
    CI('granadas', 'Granadas de cinto', 'granadas de mano'),
  ],
  carga_minera: [
    T('carga_grisu', 'Carga de grisú', 'La explosión es 25 % más grande.', { por: { area: 1.25 } }),
    GO('carga_maestra', 'Carga maestra', 'todas las cargas en una sola, enorme'),
    CI('petardos', 'Petardos de cinto', 'petardos chiquitos'),
  ],
  sierra: [
    T('sierra_rojo', 'Sierra al rojo', 'Las hojas queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
    GO('sierra_aserradero', 'Sierra de aserradero', 'todas las hojas en una sola, enorme'),
    CO('sierra_taller', 'La sierra del taller', 'la sierra de tu taller'),
  ],
  ira_cielo: [
    T('granizo', 'Granizo', 'Los rayos frenan.', { mas: { lento: 0.35 }, etiqueta: 'hielo' }),
    GO('un_solo_trueno', 'Un solo trueno', 'todos los rayos en uno solo, enorme'),
    CO('colera_divina', 'Cólera divina', 'la ira de los cielos'),
  ],
};
