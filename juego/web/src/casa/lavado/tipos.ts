// Tipos que comparten el motor, los datos, el dibujo y la interfaz de «Lavarse la cara» (el Vampire Survivors del
// baño). Nada de aquí toca el DOM ni three.js: el motor corre igualito en el celular y en las pruebas de Node.

/** Las estadísticas del personaje (como las del original). Las de porcentaje van como bono: 0.1 = +10 %. */
export type Stat =
  | 'vida' // vida máxima (absoluta)
  | 'recuperacion' // vida por segundo
  | 'armadura' // se resta a cada golpe
  | 'movimiento' // bono de velocidad al caminar
  | 'poder' // bono de daño
  | 'area' // bono de tamaño de los ataques
  | 'velocidad' // bono de velocidad de los proyectiles
  | 'duracion' // bono de duración de los efectos
  | 'cantidad' // proyectiles extra
  | 'enfriamiento' // reducción de la recarga (0.08 = 8 % menos)
  | 'suerte'
  | 'crecimiento' // bono de experiencia
  | 'codicia' // bono de gotas doradas
  | 'maldicion' // enemigos más rápidos, con más vida y más seguido
  | 'iman' // bono del radio para recoger
  | 'revivir'
  | 'tirar' // «volver a tirar» las cartas al subir de nivel
  | 'saltar'
  | 'vetar';

export type Stats = Record<Stat, number>;

export const STATS: Stat[] = [
  'vida', 'recuperacion', 'armadura', 'movimiento', 'poder', 'area', 'velocidad', 'duracion', 'cantidad', 'enfriamiento', 'suerte',
  'crecimiento', 'codicia', 'maldicion', 'iman', 'revivir', 'tirar', 'saltar', 'vetar',
];

export const statsVacios = (): Stats => ({
  vida: 0, recuperacion: 0, armadura: 0, movimiento: 0, poder: 0, area: 0, velocidad: 0, duracion: 0, cantidad: 0, enfriamiento: 0,
  suerte: 0, crecimiento: 0, codicia: 0, maldicion: 0, iman: 0, revivir: 0, tirar: 0, saltar: 0, vetar: 0,
});

export type Rol = 'el' | 'ella';

export type IdArma =
  | 'toalla' | 'burbujas' | 'cepillo' | 'champu' | 'peinilla' | 'esponjas' | 'secador' | 'espuma' | 'botellas' | 'jabon' | 'bombillo'
  | 'toallita' | 'patoAmarillo' | 'patoMorado' | 'ranitas' | 'ducha' | 'hilo' | 'perfume' | 'colonia'
  // Las de la versión 2 (las que faltaban del original)
  | 'chancletas' | 'maquina' | 'copito' | 'plancha' | 'vaporizador' | 'mariposas' | 'pistolaAgua' | 'brillantina' | 'cubitos'
  | 'cepilloEspalda' | 'mascarilla' | 'piedraPomez' | 'lucesLED' | 'letrasEspuma'
  | 'cortina' | 'neceser' | 'bolsillo' | 'pececitos' | 'confeti' | 'hueso' | 'bombaBano' | 'barquito' | 'talco' | 'bolitasGel'
  // Evolucionadas
  | 'toallazo' | 'burbujero' | 'milCerdas' | 'remolino' | 'peinillaOro' | 'esponjasEternas' | 'secadorInfernal' | 'espumaDevoradora'
  | 'inundacion' | 'jabonExplosivo' | 'tormenta' | 'lunaDeMiel' | 'patosEnamorados' | 'ranaGlotona' | 'diluvio' | 'hiloSeda' | 'perfumeAmor'
  | 'pisoton' | 'afeitada' | 'dobleCopito' | 'tripleCopito' | 'planchaDiva' | 'sauna' | 'mariposario' | 'hidrolavadora' | 'lluviaBrillantina'
  | 'granizada' | 'cepilloCeleste' | 'spa' | 'piedrasCalientes' | 'camerino' | 'abecedario'
  | 'cortinaTerciopelo' | 'neceserLujo' | 'peceraInfinita';

export type IdPasiva =
  | 'jabonFuerte' | 'gorro' | 'crema' | 'cremaNoche' | 'relojArena' | 'lupa' | 'liga' | 'sales' | 'espejoDoble' | 'pantuflas' | 'iman'
  | 'trebol' | 'corona' | 'alcancia' | 'espejoRoto' | 'curita'
  // Versión 2 (los anillos y los aretes no salen en las cartas: se encuentran escondidos en los escenarios)
  | 'cajitaMusica' | 'anilloPlata' | 'anilloOro' | 'aretIzq' | 'aretDer' | 'bataGruesa' | 'velaAromatica';

export type IdEnemigo =
  // La Cara
  | 'germen' | 'puntoNegro' | 'gotaGrasa' | 'acaro' | 'granito' | 'caspa' | 'bacteria' | 'pelusa' | 'virus' | 'barrito' | 'lagana' | 'mugre'
  | 'moco'
  // El Lavamanos
  | 'sarro' | 'pastaSeca' | 'hongo' | 'cucaracha' | 'pelo' | 'moho' | 'jabonSucio'
  // La Bañera
  | 'piojo' | 'mosquito' | 'pulga' | 'burbujaSucia' | 'babosa' | 'espinilla'
  // Jefes
  | 'espinillon' | 'reinaCaspa' | 'granMoco' | 'senorLagana' | 'barroNegro' | 'senorSarro' | 'donaCucaracha' | 'motaPelo' | 'tapon'
  | 'esponjaPodrida' | 'peloDesague'
  // La Parca del baño
  | 'duchaHelada';

export type IdEscenario = 'cara' | 'lavamanos' | 'banera';

export type IdObjeto =
  | 'arepa' // vida (el pollo del original)
  | 'ola' // limpia la pantalla (el rosario)
  | 'hielo' // congela a todos (el reloj)
  | 'aspiradora' // jala todas las gotitas
  | 'moneda' | 'bolsa' | 'frasco' // gotas doradas: 1, 10 y 25
  | 'trebolito' // +10 % de suerte en la partida
  | 'aji' // escupe fuego un rato (el ají de Él)
  | 'cofre'
  | 'tesoro'; // un anillo o un arete escondido (calidad = cuál, en ESCONDIDAS)

export type IdCarta =
  | 'oroBrillante' | 'certero' | 'silbato' | 'comienzo' | 'maraton' | 'dobleTurno' | 'curitaMagica' | 'relojQuieto' | 'ruedaFortuna'
  | 'solPlaya' | 'lucesFeria' | 'viajeLargo' | 'fiestaDisfraces' | 'coronaHierro' | 'estrellas' | 'conLoJusto' | 'diamante' | 'reboteSinFin';

export type IdPoder = Stat;

/** Lo que el motor le cuenta al dibujo y al sonido (sin crear objetos por cuadro: se reutilizan). */
export type TipoEfecto =
  | 'golpe' // a, b = x, y; c = daño; d = 1 si crítico
  | 'muere' // x, y; c = tipo de enemigo (índice); d = escala
  | 'latigo' // x, y; c = dirección (±1); d = ancho; e = alto; f = arma (0 toalla, 1 toallazo)
  | 'rayo' // x, y; c = radio; f = 1 si es de la tormenta
  | 'charco' // x, y; c = radio
  | 'limpiar' // pantallazo (toallita / ola)
  | 'explosion' // x, y; c = radio; f = tipo (0 jabón, 1 fuego, 2 corazón)
  | 'gema' // recogió gotita
  | 'moneda'
  | 'curar' // x, y; c = cuánto
  | 'nivel'
  | 'cofre'
  | 'herido' // el jugador c recibió daño d
  | 'revive' // el jugador c revivió
  | 'cae' // el jugador c quedó como burbujita
  | 'levanta' // el jugador c se levantó
  | 'congela'
  | 'jefe' // c = tipo
  | 'aviso' // texto en `t`
  | 'romper' // luz rota en x, y
  | 'evolucion' // c = jugador
  | 'columna' // x, y; c = ancho; d = alto; f = 1 diluvio
  | 'haz' // x, y; c = ángulo; d = largo; f = 1 hilo de seda
  | 'fuego' // aliento del ají x, y, c = ángulo
  | 'tajo' // planchazo: x, y; c = radio; d = ángulo; f = 0 plancha, 1 de diva, 2 remate, 3 contraataque
  | 'lanza' // cepillo de espalda que cae: x, y; c = radio; d = segundos que tarda en caer; f = 1 celestial
  | 'luces' // rayita del espejo LED: x, y; c = largo; d = grosor; e = 1 vertical; f = color
  | 'escudo' // la cortina atajó un golpe: x, y; c = jugador; d = cargas que le quedan; f = 1 de terciopelo
  | 'cohete'; // fuego artificial de confeti subiendo: x, y (de dónde sale); c, d = adónde va; e = segundos

export interface Efecto {
  tipo: TipoEfecto;
  x: number;
  y: number;
  c: number;
  d: number;
  e: number;
  f: number;
  t: string;
}
