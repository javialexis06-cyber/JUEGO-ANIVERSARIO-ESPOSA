// Las doce clases: cada una con su arsenal, su mecánica (lo que la hace jugar distinto), su habilidad activa, tres
// especializaciones y sus «dones» (mejoras que solo le salen a esa clase al subir de nivel). Los números de las
// mecánicas viven en sim/mecanicas.ts; aquí van los textos y lo que se ve en las pantallas.
import type { Etiqueta, IdClase, Stats } from '../tipos';

export interface DefSpec {
  id: string;
  nombre: string;
  desc: string;
  /** Estadísticas que cambia de entrada. */
  mod?: Partial<Stats>;
}

export interface DefDon {
  id: string;
  nombre: string;
  /** Lo que hace cada nivel. */
  desc: string;
  max: number;
  glifo: string;
}

export interface DefClase {
  id: IdClase;
  nombre: { el: string; ella: string };
  lema: string;
  desc: string;
  mecanica: { nombre: string; desc: string };
  habilidad: { nombre: string; desc: string; recarga: number; glifo: string };
  /** Vida base y estadísticas de la clase. */
  vida: number;
  base: Partial<Stats>;
  /** Su arsenal: el primero es el arma con la que empieza. */
  arsenal: [string, string, string, string];
  specs: [DefSpec, DefSpec, DefSpec];
  dones: DefDon[];
  /** Colores del traje de reemplazo (mientras llega el traje modelado): principal, detalle, metal. */
  colores: [string, string, string];
  glifo: string;
  /** Logro que la desbloquea (null = desde el comienzo). */
  logro: string | null;
  /** Dificultad para el que empieza (1-3). */
  dificultad: number;
}

export const CLASES: Record<IdClase, DefClase> = {
  monarca: {
    id: 'monarca', nombre: { el: 'Monarca', ella: 'Monarca' }, lema: 'Un rey sin corona no deja de mandar.',
    desc: 'Pelea en primera fila con la espada y el oro que recoge se vuelve una guardia de caballeros que lo siguen.',
    mecanica: { nombre: 'Guardia Real', desc: 'Cada 30 de oro recogido llega un caballero que pelea a tu lado (hasta 3).' },
    habilidad: { nombre: 'Grito de guerra', desc: '8 s: +30 % de daño y +20 % de velocidad para ti, tus aliados y tus caballeros; los muertos cercanos huyen.', recarga: 24, glifo: 'grito' },
    vida: 110, base: { armadura: 2 },
    arsenal: ['espada_larga', 'cetro_hierro', 'estandarte', 'lanza_ceremonial'],
    specs: [
      { id: 'tirano', nombre: 'Tirano', desc: 'Los caballeros cuestan 20 de oro y llegan de a dos (hasta 5), pero solo duran 25 s. El grito asusta el doble de lejos.' },
      { id: 'rey_guerrero', nombre: 'Rey guerrero', desc: 'Sin caballeros: cada 40 de oro te da +3 % de daño hasta el final. +20 % de área cuerpo a cuerpo y el grito te cura.', mod: { area: 0.2 } },
      { id: 'mecenas', nombre: 'Mecenas', desc: 'El oro vale +30 % para todo el grupo, la Forja te cobra 20 % menos y tus caballeros son ballesteros.' },
    ],
    dones: [
      { id: 'leva', nombre: 'Leva forzosa', desc: '+1 caballero máximo.', max: 3, glifo: 'yelmo' },
      { id: 'armadura_guardia', nombre: 'Armadura de la guardia', desc: 'Tus caballeros tienen +40 % de vida y daño.', max: 3, glifo: 'escudo' },
      { id: 'corona_hierro', nombre: 'Corona de hierro', desc: '+6 % de daño por cada caballero vivo.', max: 2, glifo: 'corona' },
      { id: 'tesoro_real', nombre: 'Tesoro real', desc: '+15 % de oro.', max: 3, glifo: 'oro' },
      { id: 'juramento', nombre: 'Juramento', desc: 'Cuando un caballero mata, te cura 1 de vida.', max: 2, glifo: 'corazon' },
      { id: 'decreto', nombre: 'Decreto', desc: 'Los enemigos a 3 m de ti hacen 10 % menos de daño.', max: 3, glifo: 'pergamino' },
      { id: 'voz_mando', nombre: 'Voz de mando', desc: 'El grito dura 3 s más y recarga 15 % más rápido.', max: 2, glifo: 'grito' },
    ],
    colores: ['#4b2a5e', '#c9a24a', '#b8b2a6'], glifo: 'corona', logro: null, dificultad: 1,
  },
  campesino: {
    id: 'campesino', nombre: { el: 'Campesino', ella: 'Campesina' }, lema: 'La tierra no se rinde, y yo tampoco.',
    desc: 'Excava el doble de rápido, saca más de las vetas y las almas que recoge hacen brotar espigas que curan.',
    mecanica: { nombre: 'Tierra y cosecha', desc: 'Excavas el doble y las vetas te dan +50 %. Cada 20 almas brota una espiga: al pisarla madura te cura.' },
    habilidad: { nombre: 'Guadañazo', desc: 'Un giro de guadaña alrededor que corta y empuja a todos.', recarga: 11, glifo: 'guadana' },
    vida: 100, base: { velocidad: 0.05 },
    arsenal: ['horca', 'hoz', 'antorcha', 'honda'],
    specs: [
      { id: 'segador', nombre: 'Segador', desc: 'Cada muerto del guadañazo le quita 0,5 s a la recarga; las espigas maduras revientan en paja cortante.' },
      { id: 'minero', nombre: 'Minero', desc: 'Excavas el triple; al romper roca salen esquirlas contra los enemigos y las vetas dan el doble de hierro.' },
      { id: 'piromano', nombre: 'Pirómano', desc: 'Llevas una antorcha: +40 % de luz y todos tus golpes queman. Las espigas son pacas que arden.', mod: { luz: 0.4 } },
    ],
    dones: [
      { id: 'abono', nombre: 'Abono', desc: 'Las espigas brotan con 5 almas menos.', max: 2, glifo: 'espiga' },
      { id: 'pan_casero', nombre: 'Pan casero', desc: 'Las espigas curan 4 % más.', max: 3, glifo: 'pan' },
      { id: 'manos_callosas', nombre: 'Manos callosas', desc: '+25 % de velocidad de excavar.', max: 3, glifo: 'pico' },
      { id: 'aire_libre', nombre: 'Aire libre', desc: 'Romper una pared te da +12 % de velocidad por 3 s.', max: 2, glifo: 'bota' },
      { id: 'trilla', nombre: 'Trilla', desc: 'El guadañazo hace +30 % de daño y área.', max: 3, glifo: 'guadana' },
      { id: 'buena_cosecha', nombre: 'Buena cosecha', desc: 'Las vetas dan +20 % de hierro, sangre y oro.', max: 3, glifo: 'hierro' },
      { id: 'piel_curtida', nombre: 'Piel curtida', desc: '+2 de armadura.', max: 3, glifo: 'escudo' },
    ],
    colores: ['#6b5232', '#a88a58', '#8a8070'], glifo: 'horca', logro: null, dificultad: 1,
  },
  prisionero: {
    id: 'prisionero', nombre: { el: 'Prisionero', ella: 'Prisionera' }, lema: 'Rompí las cadenas. Ahora son mías.',
    desc: 'Mientras menos vida tiene, más duro pega. Roba vida con cada golpe y jala a la horda con su cadena.',
    mecanica: { nombre: 'Furia', desc: '+1 % de daño por cada 1 % de vida que te falta (hasta +75 %). Robas 3 % del daño como vida.' },
    habilidad: { nombre: 'Tirón de cadena', desc: 'Jala hacia ti a todos los enemigos cercanos y los aturde.', recarga: 14, glifo: 'cadena' },
    vida: 90, base: { velocidad: 0.1, roboVida: 0.03 },
    arsenal: ['grillete', 'bola_hierro', 'punos', 'pico_robado'],
    specs: [
      { id: 'gladiador', nombre: 'Gladiador', desc: 'Cada muerto te da Ovación (+1 % de daño, hasta 30; se apaga si dejas de matar). El tirón hace que te persigan a ti.' },
      { id: 'fugitivo', nombre: 'Fugitivo', desc: '+20 % de velocidad y 15 % de esquiva. El tirón se vuelve un salto que deja grilletes clavados en el piso.', mod: { velocidad: 0.2, esquiva: 0.15 } },
      { id: 'martir', nombre: 'Mártir', desc: 'Al recibir daño suelta una nova de sangre. Tu robo de vida también cura a los aliados cercanos y la furia te da armadura.' },
    ],
    dones: [
      { id: 'rabia', nombre: 'Rabia', desc: 'La furia llega a +25 % más de daño.', max: 2, glifo: 'puno' },
      { id: 'sed_sangre', nombre: 'Sed de sangre', desc: '+2 % de robo de vida.', max: 3, glifo: 'gota' },
      { id: 'cadenas_rotas', nombre: 'Cadenas rotas', desc: '+10 % de velocidad.', max: 2, glifo: 'bota' },
      { id: 'ultimo_aliento', nombre: 'Último aliento', desc: 'Una vez por etapa, al caer, te levantas con 30 % de vida.', max: 1, glifo: 'calavera' },
      { id: 'grilletes_pesados', nombre: 'Grilletes pesados', desc: '+10 % de daño cuerpo a cuerpo y +15 % de empuje.', max: 3, glifo: 'cadena' },
      { id: 'piel_dura', nombre: 'Piel dura', desc: '+12 de vida máxima.', max: 3, glifo: 'corazon' },
      { id: 'tiron_brutal', nombre: 'Tirón brutal', desc: 'El tirón hace +100 % de daño y recarga 2 s antes.', max: 2, glifo: 'cadena' },
    ],
    colores: ['#5d5a55', '#8a7a64', '#6e737a'], glifo: 'cadena', logro: null, dificultad: 2,
  },
  caballero: {
    id: 'caballero', nombre: { el: 'Caballero', ella: 'Caballera' }, lema: 'Detrás de mi escudo nadie cae.',
    desc: 'Lento y acorazado. Su escudo se carga y para un golpe entero; embiste a través de la horda.',
    mecanica: { nombre: 'Bloqueo', desc: 'El escudo se carga en 6 s y para un golpe completo. Mucha armadura.' },
    habilidad: { nombre: 'Embestida', desc: 'Carga con el escudo hacia donde caminas: daña, empuja y no te tocan.', recarga: 9, glifo: 'escudo' },
    vida: 130, base: { armadura: 6, velocidad: -0.08 },
    arsenal: ['maza', 'mangual', 'lanza_justa', 'escudo_arrojadizo'],
    specs: [
      { id: 'bastion', nombre: 'Bastión', desc: 'El escudo guarda dos cargas y cada bloqueo suelta una onda que empuja.' },
      { id: 'cruzado', nombre: 'Cruzado', desc: '+25 % de daño sagrado; bloquear te cura 8 % y la embestida deja luz sagrada en el piso.' },
      { id: 'caballero_negro', nombre: 'Caballero negro', desc: 'Sin escudo: +35 % de daño y 4 % de robo de vida. La embestida deja una estela de sombra.', mod: { dano: 0.35, roboVida: 0.04 } },
    ],
    dones: [
      { id: 'escudo_rapido', nombre: 'Escudo templado', desc: 'El escudo se carga 1 s antes.', max: 3, glifo: 'escudo' },
      { id: 'placas', nombre: 'Placas', desc: '+3 de armadura.', max: 3, glifo: 'armadura' },
      { id: 'contraataque', nombre: 'Contraataque', desc: 'Al bloquear lanzas un tajo alrededor.', max: 2, glifo: 'espada' },
      { id: 'juramento_hierro', nombre: 'Juramento de hierro', desc: '+15 de vida máxima.', max: 3, glifo: 'corazon' },
      { id: 'galope', nombre: 'Galope', desc: 'La embestida llega 2 m más lejos y recarga 2 s antes.', max: 2, glifo: 'bota' },
      { id: 'fe', nombre: 'Fe', desc: '+10 % de curación y +0,3 de vida por segundo.', max: 3, glifo: 'cruz' },
    ],
    colores: ['#5a5f68', '#7a2a2a', '#c8c4bc'], glifo: 'escudo', logro: 'primera_expedicion', dificultad: 1,
  },
  cazador: {
    id: 'cazador', nombre: { el: 'Cazador de vampiros', ella: 'Cazadora de vampiros' }, lema: 'Plata, fresno y paciencia.',
    desc: 'A distancia y en movimiento: marca a sus presas para rematarlas con críticos y se escapa con el garfio.',
    mecanica: { nombre: 'Marcas', desc: 'Tus golpes a distancia marcan 5 s: los marcados te dan +30 % de crítico. Matar a un marcado acelera tus disparos.' },
    habilidad: { nombre: 'Garfio', desc: 'Te lanzas hacia la pared más cercana en la dirección en que caminas; al llegar aturdes alrededor.', recarga: 6, glifo: 'garfio' },
    vida: 85, base: { critico: 0.1, velocidad: 0.05 },
    arsenal: ['ballesta', 'estacas', 'agua_bendita', 'trabuco'],
    specs: [
      { id: 'francotirador', nombre: 'Francotirador', desc: '+40 % de alcance y +50 % de daño crítico; tus proyectiles atraviesan a uno más. Un poco más lento.', mod: { alcance: 0.4, danoCritico: 0.5, velocidad: -0.1 } },
      { id: 'estacas_spec', nombre: 'Maestro de estacas', desc: 'Los élites marcados reciben +40 % de daño y los vampiros mueren con un crítico.' },
      { id: 'agua_spec', nombre: 'Agua bendita', desc: 'Las marcas se contagian al morir, +30 % de daño sagrado y el garfio deja un charco bendito.' },
    ],
    dones: [
      { id: 'ojo_cazador', nombre: 'Ojo de cazador', desc: '+8 % de crítico.', max: 3, glifo: 'ojo' },
      { id: 'plata', nombre: 'Plata pura', desc: '+20 % de daño crítico.', max: 3, glifo: 'estaca' },
      { id: 'marca_profunda', nombre: 'Marca profunda', desc: 'Las marcas duran 3 s más y dan +10 % de crítico.', max: 2, glifo: 'diana' },
      { id: 'pies_ligeros', nombre: 'Pies ligeros', desc: '+8 % de velocidad.', max: 2, glifo: 'bota' },
      { id: 'garfio_rapido', nombre: 'Garfio rápido', desc: 'El garfio recarga 1,5 s antes.', max: 2, glifo: 'garfio' },
      { id: 'caza_mayor', nombre: 'Caza mayor', desc: '+20 % de daño contra élites y jefes.', max: 3, glifo: 'calavera' },
    ],
    colores: ['#3a3430', '#7a1f1f', '#a8a8a8'], glifo: 'ballesta', logro: 'nivel_20', dificultad: 2,
  },
  herrero: {
    id: 'herrero', nombre: { el: 'Herrero', ella: 'Herrera' }, lema: 'Lo que se rompe, se forja otra vez.',
    desc: 'Convierte el hierro negro en torretas y trampas. Pelea desde su pequeño fuerte.',
    mecanica: { nombre: 'Construir', desc: 'Cada 6 de hierro negro que recoges arma una trampa de púas cerca de ti.' },
    habilidad: { nombre: 'Torreta', desc: 'Arma una torreta de ballesta que dispara sola (hasta 2 a la vez).', recarga: 16, glifo: 'torreta' },
    vida: 115, base: { armadura: 3, excavar: 0.3 },
    arsenal: ['martillo', 'torreta_ballesta', 'yunque', 'chispas'],
    specs: [
      { id: 'ingeniero', nombre: 'Ingeniero', desc: 'Hasta 4 torretas a la vez y disparan 40 % más rápido.' },
      { id: 'armero', nombre: 'Armero', desc: 'Cada 8 de hierro sube de nivel un arma tuya; +20 % de daño cuerpo a cuerpo.' },
      { id: 'trampero', nombre: 'Trampero', desc: 'Dejas una trampa de oso al caminar (hasta 8) y la habilidad pone cuatro alrededor.' },
    ],
    dones: [
      { id: 'engranajes', nombre: 'Engranajes', desc: 'Torretas y trampas +25 % de daño.', max: 3, glifo: 'engranaje' },
      { id: 'remaches', nombre: 'Remaches', desc: 'Las torretas duran 8 s más.', max: 2, glifo: 'torreta' },
      { id: 'fragua', nombre: 'Fragua', desc: '+15 % de daño de fuego y de construcciones.', max: 3, glifo: 'llama' },
      { id: 'yelmo_forjado', nombre: 'Yelmo forjado', desc: '+2 de armadura.', max: 3, glifo: 'yelmo' },
      { id: 'martillo_pesado', nombre: 'Martillo pesado', desc: '+12 % de área.', max: 3, glifo: 'martillo' },
      { id: 'chatarra', nombre: 'Chatarra', desc: 'Las trampas se arman con 4 de hierro en vez de 6.', max: 1, glifo: 'hierro' },
    ],
    colores: ['#4a3a2e', '#8a5a2a', '#9a9a9a'], glifo: 'martillo', logro: 'excavador', dificultad: 2,
  },
  alquimista: {
    id: 'alquimista', nombre: { el: 'Alquimista', ella: 'Alquimista' }, lema: 'Todo es veneno. Solo cambia la dosis.',
    desc: 'Lanza pociones y las mezcla: dos sustancias distintas en el mismo muerto provocan reacciones.',
    mecanica: { nombre: 'Mezclas', desc: 'Ácido + fuego = explosión; hielo + fuego = vapor que aturde; veneno + hielo = cristales que duplican el próximo golpe.' },
    habilidad: { nombre: 'Bomba de humo', desc: 'Una nube que confunde y frena a los enemigos; te vuelves invisible un momento.', recarga: 15, glifo: 'nube' },
    vida: 90, base: { area: 0.1, duracion: 0.15 },
    arsenal: ['frasco_acido', 'fuego_griego', 'frasco_helado', 'gas_venenoso'],
    specs: [
      { id: 'envenenador', nombre: 'Envenenador', desc: 'El veneno es doble y se contagia a los cercanos cuando el enemigo muere.' },
      { id: 'explosivista', nombre: 'Explosivista', desc: 'Explosiones 30 % más grandes que rompen las paredes blandas; las reacciones explotan el doble.', mod: { area: 0.1 } },
      { id: 'transmutador', nombre: 'Transmutador', desc: 'El 5 % de los muertos se vuelve oro puro; +1 % de daño por cada 25 de oro (hasta +40 %).' },
    ],
    dones: [
      { id: 'catalizador', nombre: 'Catalizador', desc: 'Las reacciones hacen +30 % de daño.', max: 3, glifo: 'frasco' },
      { id: 'frascos_reforzados', nombre: 'Frascos reforzados', desc: '+10 % de área.', max: 3, glifo: 'frasco' },
      { id: 'destilado', nombre: 'Destilado', desc: '+15 % de duración.', max: 3, glifo: 'reloj' },
      { id: 'mano_firme', nombre: 'Mano firme', desc: '+10 % de velocidad de ataque.', max: 3, glifo: 'mano' },
      { id: 'antidoto', nombre: 'Antídoto', desc: '+0,4 de vida por segundo.', max: 2, glifo: 'corazon' },
      { id: 'humo_espeso', nombre: 'Humo espeso', desc: 'La bomba de humo dura 2 s más y recarga 2 s antes.', max: 2, glifo: 'nube' },
    ],
    colores: ['#2e4a3a', '#6a8a3a', '#b0a070'], glifo: 'frasco', logro: 'frascos', dificultad: 3,
  },
  sepulturero: {
    id: 'sepulturero', nombre: { el: 'Sepulturero', ella: 'Sepulturera' }, lema: 'Los muertos me deben un favor.',
    desc: 'Excava como nadie y levanta a los que mata como esqueletos que pelean de su lado.',
    mecanica: { nombre: 'Levantar a los muertos', desc: 'El 12 % de los que matas se levanta como esqueleto aliado por 20 s (hasta 6).' },
    habilidad: { nombre: 'Abrir tumba', desc: 'Seis esqueletos guerreros salen de la tierra a pelear por ti.', recarga: 24, glifo: 'tumba' },
    vida: 100, base: { excavar: 0.5 },
    arsenal: ['pala', 'linterna_almas', 'huesos', 'campana_funebre'],
    specs: [
      { id: 'nigromante', nombre: 'Nigromante', desc: 'Hasta 10 esqueletos, se levanta el 18 % y explotan al morir.' },
      { id: 'ladron_tumbas', nombre: 'Ladrón de tumbas', desc: 'Al romper paredes a veces sale oro o un cofre; +20 de suerte y abrir tumba suelta oro.', mod: { suerte: 20 } },
      { id: 'exorcista', nombre: 'Exorcista', desc: 'En vez de esqueletos, espíritus que atraviesan las paredes; +25 % de daño contra los muertos.' },
    ],
    dones: [
      { id: 'huesos_fuertes', nombre: 'Huesos fuertes', desc: 'Tus esqueletos tienen +30 % de vida y daño.', max: 3, glifo: 'hueso' },
      { id: 'legion', nombre: 'Legión', desc: '+2 esqueletos máximos.', max: 2, glifo: 'calavera' },
      { id: 'descanso', nombre: 'Descanso eterno', desc: 'Los esqueletos duran 6 s más.', max: 2, glifo: 'reloj' },
      { id: 'pala_rapida', nombre: 'Pala rápida', desc: '+30 % de velocidad de excavar.', max: 2, glifo: 'pala' },
      { id: 'frio_tumba', nombre: 'Frío de la tumba', desc: '+15 % de daño de sombra.', max: 3, glifo: 'alma' },
      { id: 'velatorio', nombre: 'Velatorio', desc: '+10 % de experiencia.', max: 2, glifo: 'vela' },
    ],
    colores: ['#2a2a2e', '#5a4a3a', '#8a8a80'], glifo: 'pala', logro: 'mil_muertos', dificultad: 2,
  },
  inquisidor: {
    id: 'inquisidor', nombre: { el: 'Inquisidor', ella: 'Inquisidora' }, lema: 'La luz no pide permiso.',
    desc: 'Un aura sagrada quema a los muertos y cura a los aliados: brilla en grupo.',
    mecanica: { nombre: 'Aura sagrada', desc: 'A tu alrededor los aliados se curan 1 % por segundo y los muertos se queman. Cada muerto en el aura te da fervor (+1 % de daño, hasta 20).' },
    habilidad: { nombre: 'Rayo de luz', desc: 'Una columna de luz cae sobre el montón: daño sagrado enorme y cura a los aliados.', recarga: 13, glifo: 'rayo' },
    vida: 105, base: { regen: 0.5 },
    arsenal: ['incensario', 'libro_oraciones', 'cruz_plata', 'rayo_sagrado'],
    specs: [
      { id: 'juez', nombre: 'Juez', desc: 'Cada 6 s juzgas al enemigo más fuerte cercano: recibe el doble de daño. El rayo cae siempre sobre los élites.' },
      { id: 'sanador', nombre: 'Sanador', desc: 'El aura cura el triple y es 30 % más grande; levantas a los caídos el doble de rápido.' },
      { id: 'fanatico', nombre: 'Fanático', desc: 'El aura hace 2,5 veces el daño pero te quita 1 de vida por segundo; +8 % de daño por cada 10 % de vida perdida.' },
    ],
    dones: [
      { id: 'devocion', nombre: 'Devoción', desc: 'El aura es 20 % más grande.', max: 3, glifo: 'sol' },
      { id: 'penitencia', nombre: 'Penitencia', desc: '+25 % de daño sagrado.', max: 3, glifo: 'cruz' },
      { id: 'vigilia', nombre: 'Vigilia', desc: '+0,5 de vida por segundo.', max: 3, glifo: 'vela' },
      { id: 'martillo_herejes', nombre: 'Martillo de herejes', desc: '+15 % de daño contra élites y jefes.', max: 2, glifo: 'martillo' },
      { id: 'fervor_ardiente', nombre: 'Fervor ardiente', desc: 'El fervor llega 10 más alto.', max: 2, glifo: 'llama' },
      { id: 'luz_divina', nombre: 'Luz divina', desc: 'El rayo recarga 2 s antes y hace +30 % de daño.', max: 2, glifo: 'rayo' },
    ],
    colores: ['#5a1a1a', '#d8c8a0', '#c8a040'], glifo: 'cruz', logro: 'altares', dificultad: 1,
  },
  verdugo: {
    id: 'verdugo', nombre: { el: 'Verdugo', ella: 'Verdugo' }, lema: 'Nadie se salva de su sentencia.',
    desc: 'Golpes lentos y brutales que rematan a los heridos. Alrededor suyo los muertos sienten miedo.',
    mecanica: { nombre: 'Ejecución', desc: 'Los enemigos con menos de 15 % de vida mueren al recibir tu golpe (los élites con 8 %). Los cercanos a veces huyen de miedo.' },
    habilidad: { nombre: 'Tajo de ejecución', desc: 'Un tajo enorme en línea: remata a todo lo que quede con menos de 35 %.', recarga: 12, glifo: 'hacha' },
    vida: 120, base: { dano: 0.15, cadencia: -0.1 },
    arsenal: ['hacha_verdugo', 'ganchos', 'guillotina', 'soga'],
    specs: [
      { id: 'carnicero', nombre: 'Carnicero', desc: 'El sangrado es doble y las ejecuciones revientan en sangre que hace sangrar a los cercanos.' },
      { id: 'inquisidor_hacha', nombre: 'Inquisidor del hacha', desc: 'Todos tus golpes queman y las ejecuciones dejan el piso ardiendo.' },
      { id: 'sombra', nombre: 'Sombra', desc: 'Después de ejecutar te vuelves invisible 1,5 s con +50 % de crítico; +10 % de velocidad.', mod: { velocidad: 0.1 } },
    ],
    dones: [
      { id: 'umbral', nombre: 'Umbral', desc: 'Ejecutas con 3 % más de vida.', max: 3, glifo: 'calavera' },
      { id: 'terror', nombre: 'Terror', desc: 'El miedo llega 1 m más lejos y es más seguido.', max: 2, glifo: 'ojo' },
      { id: 'filo', nombre: 'Filo', desc: '+10 % de daño cuerpo a cuerpo.', max: 3, glifo: 'hacha' },
      { id: 'trofeos', nombre: 'Trofeos', desc: '+1 % de daño por cada 10 ejecuciones (hasta +30 %).', max: 1, glifo: 'calavera' },
      { id: 'capucha', nombre: 'Capucha negra', desc: '+15 de vida máxima.', max: 3, glifo: 'capucha' },
      { id: 'incansable', nombre: 'Incansable', desc: 'Cada ejecución le quita 0,5 s a la recarga del tajo.', max: 1, glifo: 'reloj' },
    ],
    colores: ['#1e1a1a', '#5a1414', '#7a7470'], glifo: 'hacha', logro: 'cazador_elites', dificultad: 2,
  },
  bruja: {
    id: 'bruja', nombre: { el: 'Brujo', ella: 'Bruja' }, lema: 'Cada maldición vuelve tres veces.',
    desc: 'Acumula maldiciones que hacen que los enemigos reciban más daño hasta estallar. La acompañan sus cuervos.',
    mecanica: { nombre: 'Maldición', desc: 'Cada golpe tuyo maldice (+4 % de daño recibido por acumulación, hasta 10). A las 10, el enemigo queda condenado y estalla. Dos cuervos te acompañan.' },
    habilidad: { nombre: 'Tótem de maleficio', desc: 'Un tótem que maldice y frena a todos los que se acerquen.', recarga: 18, glifo: 'totem' },
    vida: 85, base: { duracion: 0.1, suerte: 10 },
    arsenal: ['baston_cuervos', 'vudu', 'caldero', 'plumas_negras'],
    specs: [
      { id: 'cuervera', nombre: 'Cuervera', desc: 'Tres cuervos más, y los cuervos te traen las almas y el oro cercanos.' },
      { id: 'sangre_spec', nombre: 'Hechicera de sangre', desc: 'Tus golpes a malditos roban 4 % de vida; cada 5 s lanzas una lanza de sangre que te cuesta un poco de vida.' },
      { id: 'pantanosa', nombre: 'Pantanosa', desc: 'Cada condena deja un pantano que frena y envenena; +30 % de daño de veneno.' },
    ],
    dones: [
      { id: 'maleficio', nombre: 'Maleficio', desc: 'Cada acumulación de maldición vale 2 % más.', max: 3, glifo: 'ojo' },
      { id: 'mas_cuervos', nombre: 'Más cuervos', desc: '+1 cuervo familiar.', max: 3, glifo: 'cuervo' },
      { id: 'condena_mayor', nombre: 'Condena mayor', desc: 'La condena hace +50 % de daño.', max: 2, glifo: 'calavera' },
      { id: 'ojos_noche', nombre: 'Ojos de la noche', desc: '+10 de suerte y +15 % de luz.', max: 2, glifo: 'luna' },
      { id: 'escoba', nombre: 'Escoba', desc: '+8 % de velocidad.', max: 2, glifo: 'escoba' },
      { id: 'brebaje', nombre: 'Brebaje', desc: '+10 de vida y +0,3 de vida por segundo.', max: 2, glifo: 'caldero' },
    ],
    colores: ['#2a1e34', '#5a3a6a', '#7a8a5a'], glifo: 'cuervo', logro: 'bendiciones', dificultad: 3,
  },
  juglar: {
    id: 'juglar', nombre: { el: 'Juglar', ella: 'Juglaresa' }, lema: 'Hasta la muerte baila si la música es buena.',
    desc: 'Toca canciones que cambian solas y mejoran a todo el grupo; sus acordes aturden a los muertos.',
    mecanica: { nombre: 'Canciones', desc: 'Cada 10 s cambia la canción: Marcha (+15 % velocidad), Balada (cura) y Furia (+20 % daño), para ti y los aliados cercanos. Al cambiar, un acorde aturde alrededor.' },
    habilidad: { nombre: 'Balada de guerra', desc: '8 s: todos los aliados atacan 40 % más rápido y los muertos cercanos quedan aturdidos.', recarga: 22, glifo: 'laud' },
    vida: 95, base: { velocidad: 0.08, cadencia: 0.1 },
    arsenal: ['laud', 'cuchillos_malabar', 'flauta', 'tambor_guerra'],
    specs: [
      { id: 'bardo', nombre: 'Bardo', desc: 'Las canciones valen 50 % más y llegan el doble de lejos.' },
      { id: 'arlequin', nombre: 'Arlequín', desc: 'Los acordes confunden: los muertos se pegan entre ellos. +15 % de esquiva.', mod: { esquiva: 0.15 } },
      { id: 'trovador', nombre: 'Trovador sombrío', desc: 'Tus canciones dañan a los muertos cercanos y las almas que recoges valen 20 % más.', mod: { experiencia: 0.2 } },
    ],
    dones: [
      { id: 'estribillo', nombre: 'Estribillo', desc: 'Las canciones valen 20 % más.', max: 3, glifo: 'nota' },
      { id: 'virtuoso', nombre: 'Virtuoso', desc: '+10 % de velocidad de ataque.', max: 3, glifo: 'mano' },
      { id: 'publico', nombre: 'Público', desc: '+10 % de experiencia.', max: 2, glifo: 'alma' },
      { id: 'pies_danzarines', nombre: 'Pies danzarines', desc: '+8 % de velocidad y +5 % de esquiva.', max: 2, glifo: 'bota' },
      { id: 'afinado', nombre: 'Afinado', desc: '+15 % de área.', max: 3, glifo: 'laud' },
      { id: 'gira', nombre: 'Gira', desc: 'La balada recarga 3 s antes.', max: 2, glifo: 'reloj' },
    ],
    colores: ['#5a2a3a', '#c8a050', '#3a3a5a'], glifo: 'laud', logro: 'prisioneros', dificultad: 2,
  },
};

export const nombreClase = (c: IdClase, cuerpo: 'el' | 'ella') => CLASES[c].nombre[cuerpo];

/** Sangre y Ceniza 2 (como las subclases de Deep Rock): cada especialización suma a lo que se encuentra en la expedición
 *  todas las armas de una etiqueta, de cualquier clase y las comunes (Pirómano: todas las de fuego). */
export const ABRE_SPEC: Record<string, Etiqueta[]> = {
  tirano: ['invocacion'], rey_guerrero: ['cuerpo'], mecenas: ['distancia'],
  segador: ['cuerpo'], minero: ['area'], piromano: ['fuego'],
  gladiador: ['cuerpo'], fugitivo: ['construccion'], martir: ['sangre'],
  bastion: ['area'], cruzado: ['sagrado'], caballero_negro: ['sombra'],
  francotirador: ['distancia'], estacas_spec: ['sangre'], agua_spec: ['sagrado'],
  ingeniero: ['construccion'], armero: ['fisico'], trampero: ['veneno', 'hielo'],
  envenenador: ['veneno'], explosivista: ['fuego'], transmutador: ['hielo', 'sombra'],
  nigromante: ['invocacion'], ladron_tumbas: ['distancia'], exorcista: ['sagrado'],
  juez: ['area'], sanador: ['sagrado'], fanatico: ['fuego'],
  carnicero: ['sangre'], inquisidor_hacha: ['fuego'], sombra: ['sombra'],
  cuervera: ['invocacion'], sangre_spec: ['sangre'], pantanosa: ['veneno'],
  bardo: ['area'], arlequin: ['distancia'], trovador: ['sombra'],
};

/** Cómo se nombran las armas de cada etiqueta («todas las armas de fuego»). */
export const ARMAS_DE: Partial<Record<Etiqueta, string>> = {
  fisico: 'físicas', fuego: 'de fuego', sagrado: 'sagradas', veneno: 'de veneno', sangre: 'de sangre', sombra: 'de sombra', hielo: 'de hielo',
  cuerpo: 'cuerpo a cuerpo', distancia: 'a distancia', area: 'de área', invocacion: 'de invocación', construccion: 'de construcción',
};

/** El texto de lo que abre una especialización. */
export const textoAbre = (spec: string) => {
  const e = ABRE_SPEC[spec];
  return e?.length ? `Encuentras también todas las armas ${e.map((x) => ARMAS_DE[x]).join(' y ')}.` : '';
};
