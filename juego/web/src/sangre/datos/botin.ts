// Todo lo que se consigue en una expedición además de las armas: mejoras al subir de nivel (con rareza), objetos de
// la Forja con su contrapartida (como Brotato), equipo que cae de élites y cofres (como Halls of Torment), reliquias
// que cambian la partida (como Army of Ruin) y las bendiciones de los tres santos oscuros (como Death Must Die).
import type { Etiqueta, IdMineral, RanuraEquipo, Stat, Stats } from '../tipos';

// ------------------------------------------------------------------------------------------------- Mejoras
export interface DefMejora {
  id: string;
  nombre: string;
  stat?: Stat;
  etiqueta?: Etiqueta;
  /** Valor con rareza común (se multiplica por el peso de la rareza). */
  base: number;
  /** Cómo se escribe el valor: '%' fracción, 'n' número, 'e' entero. */
  fmt: '%' | 'n' | 'e';
  texto: string;
  glifo: string;
  /** Rareza mínima en la que sale. */
  desde?: number;
}

export const MEJORAS: DefMejora[] = [
  { id: 'vida', nombre: 'Corazón de piedra', stat: 'vida', base: 12, fmt: 'n', texto: 'de vida máxima', glifo: 'corazon' },
  { id: 'regen', nombre: 'Sangre caliente', stat: 'regen', base: 0.3, fmt: 'n', texto: 'de vida por segundo', glifo: 'gota' },
  { id: 'armadura', nombre: 'Cota de malla', stat: 'armadura', base: 1.5, fmt: 'n', texto: 'de armadura', glifo: 'armadura' },
  { id: 'esquiva', nombre: 'Paso de sombra', stat: 'esquiva', base: 0.03, fmt: '%', texto: 'de esquiva', glifo: 'sombra' },
  { id: 'velocidad', nombre: 'Botas de viaje', stat: 'velocidad', base: 0.05, fmt: '%', texto: 'de velocidad', glifo: 'bota' },
  { id: 'dano', nombre: 'Ira', stat: 'dano', base: 0.07, fmt: '%', texto: 'de daño', glifo: 'puno' },
  { id: 'cadencia', nombre: 'Pulso firme', stat: 'cadencia', base: 0.06, fmt: '%', texto: 'de velocidad de ataque', glifo: 'mano' },
  { id: 'area', nombre: 'Alcance de la sombra', stat: 'area', base: 0.07, fmt: '%', texto: 'de área', glifo: 'area' },
  { id: 'velProy', nombre: 'Plumas de halcón', stat: 'velProy', base: 0.1, fmt: '%', texto: 'de velocidad de proyectiles', glifo: 'pluma' },
  { id: 'duracion', nombre: 'Reloj de arena', stat: 'duracion', base: 0.08, fmt: '%', texto: 'de duración', glifo: 'reloj' },
  { id: 'critico', nombre: 'Ojo frío', stat: 'critico', base: 0.03, fmt: '%', texto: 'de crítico', glifo: 'ojo' },
  { id: 'danoCritico', nombre: 'Filo cruel', stat: 'danoCritico', base: 0.12, fmt: '%', texto: 'de daño crítico', glifo: 'diana' },
  { id: 'iman', nombre: 'Imán de almas', stat: 'iman', base: 0.15, fmt: '%', texto: 'de radio para recoger', glifo: 'iman' },
  { id: 'suerte', nombre: 'Trébol negro', stat: 'suerte', base: 4, fmt: 'n', texto: 'de suerte', glifo: 'trebol' },
  { id: 'experiencia', nombre: 'Sabiduría', stat: 'experiencia', base: 0.06, fmt: '%', texto: 'de experiencia', glifo: 'alma' },
  { id: 'oro', nombre: 'Codicia', stat: 'oro', base: 0.08, fmt: '%', texto: 'de oro', glifo: 'oro' },
  { id: 'excavar', nombre: 'Pico de hierro', stat: 'excavar', base: 0.15, fmt: '%', texto: 'de velocidad de excavar', glifo: 'pico' },
  { id: 'vetas', nombre: 'Olfato de minero', stat: 'vetas', base: 0.15, fmt: '%', texto: 'de lo que dan las vetas', glifo: 'hierro' },
  // (la potencia y el daño de estados solo pesan si alguna arma pone quema, veneno, sangrado o frío)
  { id: 'potencia', nombre: 'Mano de boticario', stat: 'potencia', base: 0.1, fmt: '%', texto: 'de potencia (cargas de quema, veneno, sangrado y frío)', glifo: 'frasco' },
  { id: 'estados', nombre: 'Saña', stat: 'estados', base: 0.1, fmt: '%', texto: 'de daño de los estados', glifo: 'gota' },
  { id: 'roboVida', nombre: 'Colmillo', stat: 'roboVida', base: 0.008, fmt: '%', texto: 'de robo de vida', glifo: 'colmillo' },
  { id: 'enfriamiento', nombre: 'Concentración', stat: 'enfriamiento', base: 0.05, fmt: '%', texto: 'menos de recarga de la habilidad', glifo: 'reloj' },
  { id: 'luz', nombre: 'Farol', stat: 'luz', base: 0.12, fmt: '%', texto: 'de luz', glifo: 'vela' },
  { id: 'espinas', nombre: 'Espinas', stat: 'espinas', base: 3, fmt: 'n', texto: 'de daño a quien te pegue', glifo: 'espina' },
  { id: 'danoElite', nombre: 'Matagigantes', stat: 'danoElite', base: 0.08, fmt: '%', texto: 'de daño a élites y jefes', glifo: 'calavera' },
  { id: 'alcance', nombre: 'Vista de águila', stat: 'alcance', base: 0.08, fmt: '%', texto: 'de alcance', glifo: 'ojo' },
  { id: 'curacion', nombre: 'Vendas', stat: 'curacion', base: 0.08, fmt: '%', texto: 'de curación', glifo: 'cruz' },
  { id: 'cantidad', nombre: 'Multiplicar', stat: 'cantidad', base: 0.34, fmt: 'e', texto: 'proyectil o golpe más en todas las armas', glifo: 'cantidad', desde: 3 },
  { id: 'e_fuego', nombre: 'Ascua', etiqueta: 'fuego', base: 0.1, fmt: '%', texto: 'de daño de fuego', glifo: 'llama' },
  { id: 'e_sagrado', nombre: 'Agua bendita', etiqueta: 'sagrado', base: 0.1, fmt: '%', texto: 'de daño sagrado', glifo: 'cruz' },
  { id: 'e_veneno', nombre: 'Belladona', etiqueta: 'veneno', base: 0.1, fmt: '%', texto: 'de daño de veneno', glifo: 'frasco' },
  { id: 'e_sangre', nombre: 'Sangría', etiqueta: 'sangre', base: 0.1, fmt: '%', texto: 'de daño de sangre', glifo: 'gota' },
  { id: 'e_sombra', nombre: 'Penumbra', etiqueta: 'sombra', base: 0.1, fmt: '%', texto: 'de daño de sombra', glifo: 'luna' },
  { id: 'e_hielo', nombre: 'Escarcha', etiqueta: 'hielo', base: 0.1, fmt: '%', texto: 'de daño de hielo', glifo: 'copo' },
  { id: 'e_fisico', nombre: 'Afilador', etiqueta: 'fisico', base: 0.08, fmt: '%', texto: 'de daño físico', glifo: 'espada' },
  { id: 'e_cuerpo', nombre: 'Brazo fuerte', etiqueta: 'cuerpo', base: 0.09, fmt: '%', texto: 'de daño cuerpo a cuerpo', glifo: 'puno' },
  { id: 'e_distancia', nombre: 'Buen pulso', etiqueta: 'distancia', base: 0.09, fmt: '%', texto: 'de daño a distancia', glifo: 'arco' },
  { id: 'e_area', nombre: 'Estruendo', etiqueta: 'area', base: 0.09, fmt: '%', texto: 'de daño en área', glifo: 'area' },
  { id: 'e_invocacion', nombre: 'Pacto', etiqueta: 'invocacion', base: 0.12, fmt: '%', texto: 'de daño de invocaciones', glifo: 'calavera' },
  { id: 'e_construccion', nombre: 'Planos', etiqueta: 'construccion', base: 0.12, fmt: '%', texto: 'de daño de construcciones', glifo: 'engranaje' },
  // (las de las sobrecargas malditas: solo salen con dos armas de la misma)
  { id: 'e_dos_manos', nombre: 'Ambidiestro', etiqueta: 'dos_manos', base: 0.14, fmt: '%', texto: 'de daño de las armas a dos manos', glifo: 'mano' },
  { id: 'e_cinto', nombre: 'Funda de cuero', etiqueta: 'cinto', base: 0.14, fmt: '%', texto: 'de daño de las armas de cinto', glifo: 'daga' },
  { id: 'e_consentida', nombre: 'Mimos de armero', etiqueta: 'consentida', base: 0.14, fmt: '%', texto: 'de daño de las consentidas', glifo: 'corazon' },
  { id: 'e_gorda', nombre: 'Pólvora doble', etiqueta: 'gorda', base: 0.14, fmt: '%', texto: 'de daño de las balas gordas', glifo: 'bomba' },
];
export const MEJORA: Record<string, DefMejora> = Object.fromEntries(MEJORAS.map((m) => [m.id, m]));

// ------------------------------------------------------------------------------------------------- Objetos (Forja)
export interface DefObjeto {
  id: string;
  nombre: string;
  desc: string;
  precio: number;
  rareza: number;
  mod?: Partial<Stats>;
  etq?: Partial<Record<Etiqueta, number>>;
  /** Efecto especial que la simulación revisa por nombre. */
  especial?: string;
  /** Evoluciona esta arma. */
  evoluciona?: string;
  glifo: string;
  /** Se puede tener varias veces. */
  repetible?: boolean;
}

export const OBJETOS: DefObjeto[] = [
  // Con contrapartida
  { id: 'cuerno_guerra', nombre: 'Cuerno de guerra', desc: '+25 % de daño, −12 % de velocidad.', precio: 34, rareza: 1, mod: { dano: 0.25, velocidad: -0.12 }, glifo: 'cuerno', repetible: true },
  { id: 'bolsa_maldita', nombre: 'Bolsa maldita', desc: '+40 % de oro, −10 de vida.', precio: 22, rareza: 0, mod: { oro: 0.4, vida: -10 }, glifo: 'oro', repetible: true },
  { id: 'botas_plomo', nombre: 'Botas de plomo', desc: '+5 de armadura, −15 % de velocidad.', precio: 26, rareza: 0, mod: { armadura: 5, velocidad: -0.15 }, glifo: 'bota', repetible: true },
  { id: 'colmillo_lobo', nombre: 'Colmillo de lobo', desc: '+3 % de robo de vida, −3 de armadura.', precio: 36, rareza: 1, mod: { roboVida: 0.03, armadura: -3 }, glifo: 'colmillo', repetible: true },
  { id: 'polvora_negra', nombre: 'Pólvora negra', desc: '+30 % de área, −10 % de velocidad de ataque.', precio: 32, rareza: 1, mod: { area: 0.3, cadencia: -0.1 }, glifo: 'bomba', repetible: true },
  { id: 'ojo_vidrio', nombre: 'Ojo de vidrio', desc: '+12 % de crítico, −20 % de alcance.', precio: 30, rareza: 1, mod: { critico: 0.12, alcance: -0.2 }, glifo: 'ojo', repetible: true },
  { id: 'cilicio', nombre: 'Cilicio', desc: '+20 % de velocidad de ataque, −0,5 de vida por segundo.', precio: 30, rareza: 1, mod: { cadencia: 0.2, regen: -0.5 }, glifo: 'espina', repetible: true },
  { id: 'vela_negra', nombre: 'Vela negra', desc: '+15 de suerte, −25 % de luz.', precio: 24, rareza: 0, mod: { suerte: 15, luz: -0.25 }, glifo: 'vela', repetible: true },
  { id: 'jarra_aguardiente', nombre: 'Jarra de aguardiente', desc: '+20 de vida, −8 % de daño.', precio: 18, rareza: 0, mod: { vida: 20, dano: -0.08 }, glifo: 'jarra', repetible: true },
  { id: 'pluma_fenix', nombre: 'Pluma de fénix', desc: '+1 de vida por segundo, −10 de vida.', precio: 40, rareza: 2, mod: { regen: 1, vida: -10 }, glifo: 'pluma', repetible: true },
  { id: 'reloj_roto', nombre: 'Reloj roto', desc: '+25 % de duración, −10 % de velocidad de proyectiles.', precio: 24, rareza: 0, mod: { duracion: 0.25, velProy: -0.1 }, glifo: 'reloj', repetible: true },
  { id: 'calavera_monje', nombre: 'Calavera de monje', desc: '+15 % de experiencia, −8 % de oro.', precio: 28, rareza: 1, mod: { experiencia: 0.15, oro: -0.08 }, glifo: 'calavera', repetible: true },
  { id: 'piedra_iman', nombre: 'Piedra imán', desc: '+50 % de radio para recoger.', precio: 20, rareza: 0, mod: { iman: 0.5 }, glifo: 'iman', repetible: true },
  { id: 'guantes_cuero', nombre: 'Guantes de cuero', desc: '+40 % de excavar.', precio: 18, rareza: 0, mod: { excavar: 0.4 }, glifo: 'mano', repetible: true },
  { id: 'veneno_aspid', nombre: 'Veneno de áspid', desc: '+25 % de daño de veneno, −5 de vida.', precio: 26, rareza: 1, etq: { veneno: 0.25 }, mod: { vida: -5 }, glifo: 'frasco', repetible: true },
  { id: 'aceite_santo', nombre: 'Aceite santo', desc: '+25 % de daño sagrado.', precio: 30, rareza: 1, etq: { sagrado: 0.25 }, glifo: 'cruz', repetible: true },
  { id: 'carbon_vivo', nombre: 'Carbón vivo', desc: '+25 % de daño de fuego, −1 de armadura.', precio: 28, rareza: 1, etq: { fuego: 0.25 }, mod: { armadura: -1 }, glifo: 'llama', repetible: true },
  { id: 'astilla_cruz', nombre: 'Astilla de la cruz', desc: '+20 % de daño a élites y jefes.', precio: 34, rareza: 1, mod: { danoElite: 0.2 }, glifo: 'cruz', repetible: true },
  { id: 'escarcha_eterna', nombre: 'Escarcha eterna', desc: '+25 % de daño de hielo, −5 % de velocidad.', precio: 26, rareza: 1, etq: { hielo: 0.25 }, mod: { velocidad: -0.05 }, glifo: 'copo', repetible: true },
  { id: 'cuchilla_curva', nombre: 'Cuchilla curva', desc: '+20 % de daño cuerpo a cuerpo, −10 % de daño a distancia.', precio: 28, rareza: 1, etq: { cuerpo: 0.2, distancia: -0.1 }, glifo: 'espada', repetible: true },
  { id: 'carcaj', nombre: 'Carcaj', desc: '+20 % de daño a distancia, −10 % de daño cuerpo a cuerpo.', precio: 28, rareza: 1, etq: { distancia: 0.2, cuerpo: -0.1 }, glifo: 'arco', repetible: true },
  { id: 'huesos_santo', nombre: 'Huesos de santo', desc: '+30 % de daño de invocaciones.', precio: 32, rareza: 1, etq: { invocacion: 0.3 }, glifo: 'hueso', repetible: true },
  { id: 'plano_maestro', nombre: 'Plano maestro', desc: '+30 % de daño de construcciones.', precio: 32, rareza: 1, etq: { construccion: 0.3 }, glifo: 'engranaje', repetible: true },
  { id: 'estuche_boticario', nombre: 'Estuche del boticario', desc: '+25 % de potencia, −5 % de daño.', precio: 30, rareza: 1, mod: { potencia: 0.25, dano: -0.05 }, glifo: 'frasco', repetible: true },
  { id: 'sal_amarga', nombre: 'Sal amarga', desc: '+30 % de daño de los estados, −8 % de velocidad de ataque.', precio: 30, rareza: 1, mod: { estados: 0.3, cadencia: -0.08 }, glifo: 'gota', repetible: true },
  // Especiales (sin repetir)
  { id: 'segunda_piel', nombre: 'Segunda piel', desc: 'Una vez por expedición, al caer te levantas con la mitad de la vida.', precio: 70, rareza: 3, especial: 'segunda_piel', glifo: 'corazon' },
  { id: 'saco_avaro', nombre: 'Saco del avaro', desc: 'Cada 100 de oro que tengas: +3 % de daño.', precio: 45, rareza: 2, especial: 'saco_avaro', glifo: 'oro' },
  { id: 'cadena_condenado', nombre: 'Cadena del condenado', desc: '+40 % de daño mientras estés por debajo de la mitad de la vida.', precio: 42, rareza: 2, especial: 'cadena_condenado', glifo: 'cadena' },
  { id: 'reliquia_peregrino', nombre: 'Bastón de peregrino', desc: '+3 % de daño por cada etapa superada.', precio: 40, rareza: 2, especial: 'peregrino', glifo: 'baston' },
  { id: 'pico_ancho', nombre: 'Pico ancho', desc: 'Al excavar también picas las paredes de los lados (a 60 %).', precio: 30, rareza: 1, mod: { excavar: 0.1 }, especial: 'pico_ancho', glifo: 'pico' },
  { id: 'cartuchos_minero', nombre: 'Cartuchos de minero', desc: 'Cada 6 paredes que rompes, la siguiente revienta: rompe la roca y las vetas alrededor y lastima a los cercanos.', precio: 38, rareza: 2, especial: 'cartuchos', glifo: 'bomba' },
  { id: 'lampara_minero', nombre: 'Lámpara de minero', desc: '+40 % de luz y las vetas dan 30 % más.', precio: 34, rareza: 1, mod: { luz: 0.4 }, especial: 'vetas', glifo: 'vela' },
  { id: 'dados_cargados', nombre: 'Dados cargados', desc: '+1 volver a tirar por etapa.', precio: 38, rareza: 2, especial: 'tirada', glifo: 'dado' },
  // Para evolucionar (salen solos cuando el arma pareja ya va alta)
  { id: 'corona_rota', nombre: 'Corona rota', desc: '+8 % de daño. Evoluciona la Espada larga.', precio: 55, rareza: 3, mod: { dano: 0.08 }, evoluciona: 'espada_larga', glifo: 'corona' },
  { id: 'espiga_dorada', nombre: 'Espiga dorada', desc: '+0,5 de vida por segundo. Evoluciona la Horca.', precio: 55, rareza: 3, mod: { regen: 0.5 }, evoluciona: 'horca', glifo: 'espiga' },
  { id: 'llave_maestra', nombre: 'Llave maestra', desc: '+10 % de velocidad. Evoluciona el Grillete.', precio: 55, rareza: 3, mod: { velocidad: 0.1 }, evoluciona: 'grillete', glifo: 'llave' },
  { id: 'escudo_torre', nombre: 'Escudo de torre', desc: '+4 de armadura. Evoluciona la Maza.', precio: 55, rareza: 3, mod: { armadura: 4 }, evoluciona: 'maza', glifo: 'escudo' },
  { id: 'mira_plata', nombre: 'Mira de plata', desc: '+8 % de crítico. Evoluciona la Ballesta.', precio: 55, rareza: 3, mod: { critico: 0.08 }, evoluciona: 'ballesta', glifo: 'diana' },
  { id: 'fuelle', nombre: 'Fuelle', desc: '+10 % de área. Evoluciona el Martillo.', precio: 55, rareza: 3, mod: { area: 0.1 }, evoluciona: 'martillo', glifo: 'fuelle' },
  { id: 'piedra_filosofal', nombre: 'Piedra filosofal', desc: '+15 % de duración. Evoluciona los Frascos ácidos.', precio: 55, rareza: 3, mod: { duracion: 0.15 }, evoluciona: 'frasco_acido', glifo: 'piedra' },
  { id: 'calavera_antigua', nombre: 'Calavera antigua', desc: '+20 % de invocaciones. Evoluciona la Pala.', precio: 55, rareza: 3, mod: { invocaciones: 0.2 }, evoluciona: 'pala', glifo: 'calavera' },
  { id: 'rosario', nombre: 'Rosario', desc: '+10 % de curación. Evoluciona el Incensario.', precio: 55, rareza: 3, mod: { curacion: 0.1 }, evoluciona: 'incensario', glifo: 'rosario' },
  { id: 'capucha_verdugo', nombre: 'Capucha del verdugo', desc: '+10 % de daño crítico. Evoluciona el Hacha de verdugo.', precio: 55, rareza: 3, mod: { danoCritico: 0.1 }, evoluciona: 'hacha_verdugo', glifo: 'capucha' },
  { id: 'ojo_cuervo', nombre: 'Ojo de cuervo', desc: '+10 de suerte. Evoluciona el Bastón de cuervos.', precio: 55, rareza: 3, mod: { suerte: 10 }, evoluciona: 'baston_cuervos', glifo: 'ojo' },
  { id: 'partitura_maldita', nombre: 'Partitura maldita', desc: '+8 % de velocidad de ataque. Evoluciona el Laúd.', precio: 55, rareza: 3, mod: { cadencia: 0.08 }, evoluciona: 'laud', glifo: 'nota' },
  { id: 'guante_ladron', nombre: 'Guante de ladrón', desc: '+10 % de oro. Evoluciona las Dagas.', precio: 55, rareza: 3, mod: { oro: 0.1 }, evoluciona: 'daga', glifo: 'mano' },
  { id: 'barril_polvora', nombre: 'Barril de pólvora', desc: '+10 % de daño en área. Evoluciona la Bomba.', precio: 55, rareza: 3, etq: { area: 0.1 }, evoluciona: 'bomba', glifo: 'barril' },
];
export const OBJETO: Record<string, DefObjeto> = Object.fromEntries(OBJETOS.map((o) => [o.id, o]));
/** Qué objeto evoluciona cada arma. */
export const PAREJA_EVOLUCION: Record<string, string> = Object.fromEntries(OBJETOS.filter((o) => o.evoluciona).map((o) => [o.evoluciona!, o.id]));

// ------------------------------------------------------------------------------------------------- Equipo
export interface DefEquipo {
  id: string;
  nombre: string;
  ranura: RanuraEquipo;
  rareza: number;
  mod: Partial<Stats>;
  etq?: Partial<Record<Etiqueta, number>>;
  especial?: string;
  desc: string;
}

const E = (id: string, nombre: string, ranura: RanuraEquipo, rareza: number, mod: Partial<Stats>, desc: string, extra: Partial<DefEquipo> = {}): DefEquipo =>
  ({ id, nombre, ranura, rareza, mod, desc, ...extra });

export const EQUIPOS: DefEquipo[] = [
  E('yelmo_oxidado', 'Yelmo oxidado', 'casco', 0, { armadura: 2 }, '+2 de armadura.'),
  E('capucha_monje', 'Capucha de monje', 'casco', 0, { experiencia: 0.08 }, '+8 % de experiencia.'),
  E('corona_espinas', 'Corona de espinas', 'casco', 1, { espinas: 8, dano: 0.05 }, '+8 de espinas y +5 % de daño.'),
  E('yelmo_cruzado', 'Yelmo de cruzado', 'casco', 2, { armadura: 4, vida: 15 }, '+4 de armadura y +15 de vida.'),
  E('mascara_peste', 'Máscara de la peste', 'casco', 2, { regen: 0.6, area: 0.06 }, '+0,6 de vida por segundo y +6 % de área.'),
  E('diadema_luna', 'Diadema de luna', 'casco', 3, { critico: 0.08, danoCritico: 0.2, luz: 0.2 }, '+8 % de crítico, +20 % de daño crítico y +20 % de luz.'),
  E('jubon', 'Jubón acolchado', 'armadura', 0, { vida: 15 }, '+15 de vida.'),
  E('cota_malla', 'Cota de malla', 'armadura', 0, { armadura: 3 }, '+3 de armadura.'),
  E('peto_sangre', 'Peto de sangre', 'armadura', 1, { vida: 20, roboVida: 0.02 }, '+20 de vida y +2 % de robo de vida.'),
  E('armadura_placas', 'Armadura de placas', 'armadura', 2, { armadura: 7, velocidad: -0.05 }, '+7 de armadura, −5 % de velocidad.'),
  E('sotana', 'Sotana bendita', 'armadura', 2, { curacion: 0.2, regen: 0.5 }, '+20 % de curación y +0,5 de vida por segundo.'),
  E('capa_murcielago', 'Capa de murciélago', 'armadura', 3, { esquiva: 0.12, velocidad: 0.08 }, '+12 % de esquiva y +8 % de velocidad.'),
  E('guantes_trabajo', 'Guantes de trabajo', 'guantes', 0, { excavar: 0.3 }, '+30 % de excavar.'),
  E('manoplas', 'Manoplas', 'guantes', 0, { dano: 0.06 }, '+6 % de daño.'),
  E('guantes_halconero', 'Guantes de halconero', 'guantes', 1, { cadencia: 0.08, velProy: 0.1 }, '+8 % de velocidad de ataque y +10 % de proyectiles.'),
  E('guanteletes', 'Guanteletes de hierro', 'guantes', 2, { dano: 0.1, armadura: 2 }, '+10 % de daño y +2 de armadura.'),
  E('garras', 'Garras de ghoul', 'guantes', 2, { critico: 0.07, roboVida: 0.015 }, '+7 % de crítico y +1,5 % de robo de vida.'),
  E('manos_verdugo', 'Manos del verdugo', 'guantes', 3, { dano: 0.15, danoElite: 0.15 }, '+15 % de daño y +15 % contra élites.'),
  E('botas_cuero', 'Botas de cuero', 'botas', 0, { velocidad: 0.06 }, '+6 % de velocidad.'),
  E('botas_minero', 'Botas de minero', 'botas', 0, { excavar: 0.2, armadura: 1 }, '+20 % de excavar y +1 de armadura.'),
  E('botas_peregrino', 'Botas de peregrino', 'botas', 1, { velocidad: 0.08, iman: 0.25 }, '+8 % de velocidad y +25 % para recoger.'),
  E('grebas', 'Grebas', 'botas', 2, { armadura: 3, vida: 10, velocidad: 0.03 }, '+3 de armadura, +10 de vida, +3 % de velocidad.'),
  E('botas_sombra', 'Botas de sombra', 'botas', 2, { esquiva: 0.08, velocidad: 0.06 }, '+8 % de esquiva y +6 % de velocidad.'),
  E('botas_siete', 'Botas de siete leguas', 'botas', 3, { velocidad: 0.18 }, '+18 % de velocidad.'),
  E('amuleto_hueso', 'Amuleto de hueso', 'amuleto', 0, { suerte: 6 }, '+6 de suerte.'),
  E('relicario', 'Relicario', 'amuleto', 0, { regen: 0.4 }, '+0,4 de vida por segundo.'),
  E('colgante_alma', 'Colgante de alma', 'amuleto', 1, { experiencia: 0.1, iman: 0.2 }, '+10 % de experiencia y +20 % para recoger.'),
  E('escapulario', 'Escapulario', 'amuleto', 2, { vida: 15, curacion: 0.15 }, '+15 de vida y +15 % de curación.'),
  E('ojo_vigilante', 'Ojo vigilante', 'amuleto', 2, { alcance: 0.15, critico: 0.05 }, '+15 % de alcance y +5 % de crítico.'),
  E('corazon_negro', 'Corazón negro', 'amuleto', 3, { dano: 0.12, vida: 20, enfriamiento: 0.1 }, '+12 % de daño, +20 de vida y −10 % de recarga.'),
  E('anillo_cobre', 'Anillo de cobre', 'anillo', 0, { oro: 0.12 }, '+12 % de oro.'),
  E('anillo_hierro', 'Anillo de hierro', 'anillo', 0, { armadura: 1, vida: 5 }, '+1 de armadura y +5 de vida.'),
  E('sello_obispo', 'Sello del obispo', 'anillo', 1, { area: 0.08, duracion: 0.08 }, '+8 % de área y de duración.'),
  E('anillo_sangre', 'Anillo de sangre', 'anillo', 2, { roboVida: 0.025, dano: 0.05 }, '+2,5 % de robo de vida y +5 % de daño.'),
  E('anillo_tiempo', 'Anillo del tiempo', 'anillo', 2, { enfriamiento: 0.15, cadencia: 0.06 }, '−15 % de recarga y +6 % de velocidad de ataque.'),
  E('anillo_conde', 'Anillo del Conde', 'anillo', 3, { cantidad: 1, dano: -0.05 }, '+1 proyectil o golpe en todas las armas, −5 % de daño.'),
];
export const EQUIPO: Record<string, DefEquipo> = Object.fromEntries(EQUIPOS.map((e) => [e.id, e]));

// ------------------------------------------------------------------------------------------------- Reliquias
export interface DefReliquia {
  id: string;
  nombre: string;
  desc: string;
  glifo: string;
  /** Sangre y Ceniza 2 (L6): solo sale cuando la cuenta la abrió con su proeza (logros.ts, HITOS_RELIQUIA). */
  hito?: boolean;
}

export const RELIQUIAS: DefReliquia[] = [
  { id: 'rebote', nombre: 'Esquirla de espejo', desc: 'Todos tus proyectiles rebotan una vez en las paredes.', glifo: 'espejo' },
  { id: 'cadaveres', nombre: 'Cadáver hinchado', desc: 'El 15 % de los muertos explota y daña a los de alrededor.', glifo: 'calavera' },
  { id: 'doble_filo', nombre: 'Doble filo', desc: '+1 golpe o proyectil en todas las armas, pero −25 % de daño.', glifo: 'cantidad' },
  { id: 'excavar_almas', nombre: 'Pico de las ánimas', desc: 'Romper una pared suelta un alma azul.', glifo: 'pico' },
  { id: 'rayo_10', nombre: 'Campana del juicio', desc: 'Cada 8 s cae un rayo sobre el enemigo más fuerte cercano.', glifo: 'rayo' },
  { id: 'iman_total', nombre: 'Gargantilla del ahorcado', desc: 'Al subir de nivel, atraes todas las almas del mapa.', glifo: 'iman' },
  { id: 'vampirismo', nombre: 'Cáliz del Conde', desc: 'Cada muerto te cura 0,5 de vida, pero no te curan las piernas de pollo.', glifo: 'caliz' },
  { id: 'fuego_muertos', nombre: 'Ceniza del mártir', desc: 'Los muertos dejan fuego en el piso.', glifo: 'llama' },
  { id: 'escudo_almas', nombre: 'Escudo de almas', desc: 'Cada 50 almas recogidas paras el siguiente golpe.', glifo: 'escudo' },
  { id: 'botin_doble', nombre: 'Cofre sin fondo', desc: 'Los cofres dan una opción más.', glifo: 'cofre' },
  { id: 'eclipse_propio', nombre: 'Luna de sangre', desc: '+30 % de daño de noche total (sin luz alrededor), −20 % de luz.', glifo: 'luna' },
  { id: 'cristal_sangre', nombre: 'Corazón de cristal', desc: 'La sangre cristalizada que recoges también te cura 3.', glifo: 'cristal' },
  { id: 'paso_fantasma', nombre: 'Paso fantasma', desc: 'Puedes atravesar a los enemigos sin que te empujen; +10 % de velocidad.', glifo: 'sombra' },
  { id: 'hierro_dano', nombre: 'Hierro del herrero', desc: '+1 % de daño por cada 5 de hierro negro en el bolsillo (hasta +40 %).', glifo: 'hierro' },
  { id: 'reloj_parado', nombre: 'Reloj parado', desc: 'Cuando caes por debajo del 25 % de vida, el tiempo se detiene 3 s (una vez por etapa).', glifo: 'reloj' },
  { id: 'ojo_tormenta', nombre: 'Ojo de la tormenta', desc: 'Los críticos lanzan una chispa que salta a otro enemigo.', glifo: 'rayo' },
  { id: 'llave_oro', nombre: 'Llave de oro', desc: 'Los cofres de reliquias se abren sin llave.', glifo: 'llave' },
  { id: 'sangre_fria', nombre: 'Sangre fría', desc: 'Los enemigos congelados o aturdidos reciben +40 % de daño.', glifo: 'copo' },
  // Sangre y Ceniza 2 (como los artefactos de Deep Rock): dos nuevas desde el comienzo y las demás se abren con proezas
  // de la cuenta
  { id: 'libro_rencores', nombre: 'Libro de rencores', desc: '+10 % de experiencia; cada golpe que recibes también te da experiencia.', glifo: 'libro' },
  { id: 'corazon_confitado', nombre: 'Corazón confitado', desc: 'Cada pierna de pollo que te comes te sube 3 de vida máxima.', glifo: 'corazon' },
  { id: 'herradura_vieja', nombre: 'Herradura vieja', desc: '+15 de suerte; al volver a tirar, esa tirada sale con 20 más.', glifo: 'trebol', hito: true },
  { id: 'bandolera', nombre: 'Bandolera', desc: '+50 % de velocidad de ataque, −15 % de velocidad.', glifo: 'cuchillos', hito: true },
  { id: 'grimorio_olvidado', nombre: 'Grimorio olvidado', desc: 'Al tomarlo, subes tres niveles de una.', glifo: 'libro', hito: true },
  { id: 'grasa_armadura', nombre: 'Grasa de armadura', desc: '+5 % de velocidad; mientras caminas, +10 % de esquiva.', glifo: 'armadura', hito: true },
  { id: 'tasajo', nombre: 'Tasajo y pan duro', desc: '+80 de vida máxima y +2 de vida por segundo.', glifo: 'pan', hito: true },
  { id: 'cinto_brasas', nombre: 'Cinto de brasas', desc: '+15 % de daño de fuego; cuando te pegan, un anillo de fuego (cada 3 s).', glifo: 'llama', hito: true },
  { id: 'cinto_escarcha', nombre: 'Cinto de escarcha', desc: '+15 % de daño de hielo; cuando te pegan, un anillo de frío que frena (cada 3 s).', glifo: 'copo', hito: true },
  { id: 'iman_gremio', nombre: 'Imán del gremio', desc: 'Cada 30 s atraes todas las almas del mapa.', glifo: 'iman', hito: true },
  { id: 'diario_difunto', nombre: 'Diario del difunto', desc: '+10 % de daño y de velocidad de ataque, +5 % de crítico y +15 % de daño crítico.', glifo: 'pergamino', hito: true },
  { id: 'bula_obispo', nombre: 'Bula del obispo', desc: 'La Forja te cobra 20 % menos.', glifo: 'pergamino', hito: true },
  { id: 'varita_zahori', nombre: 'Varita de zahorí', desc: 'A veces sale oro al picar roca.', glifo: 'baston', hito: true },
  { id: 'queso_podrido', nombre: 'Queso podrido', desc: 'Salen el doble de ratas del tesoro y ladrones de tumbas.', glifo: 'pan', hito: true },
  { id: 'botas_salto', nombre: 'Botas de salto', desc: 'Cuando te pegan, saltas lejos del golpe (cada 20 s).', glifo: 'bota', hito: true },
  { id: 'navaja_multiusos', nombre: 'Navaja multiusos', desc: '−25 % de velocidad de ataque, +5 % por cada etiqueta distinta de tus armas.', glifo: 'cuchillos', hito: true },
  { id: 'dado_tahur', nombre: 'Dado del tahúr', desc: '+2,5 % de daño por cada vez que vuelves a tirar en la expedición.', glifo: 'dado', hito: true },
  { id: 'pico_largo', nombre: 'Pico largo', desc: '+30 % de excavar y alcanzas la roca desde más lejos.', glifo: 'pico', hito: true },
  { id: 'hierro_salmuera', nombre: 'Hierro en salmuera', desc: '+2 % de daño y −0,5 % de velocidad por cada hierro negro en el bolsillo (hasta +60 %).', glifo: 'hierro', hito: true },
  { id: 'puntas_acero', nombre: 'Puntas de acero', desc: 'Tus proyectiles atraviesan a dos más.', glifo: 'diana', hito: true },
  { id: 'tripode', nombre: 'Trípode', desc: 'Quieto, +2 % de velocidad de ataque por segundo (hasta +30 %).', glifo: 'torreta', hito: true },
  { id: 'costra', nombre: 'Costra', desc: '+1 de armadura por cada 2 % de vida que te falta.', glifo: 'escudo', hito: true },
  { id: 'monoculo', nombre: 'Monóculo', desc: '+30 % de crítico y +100 % de daño crítico, −30 % de daño.', glifo: 'ojo', hito: true },
  { id: 'galleta_monje', nombre: 'Galleta de monje', desc: 'Al bajar a cada etapa te cura la mitad de la vida.', glifo: 'pan', hito: true },
  { id: 'cicatriz', nombre: 'Cicatriz', desc: '+1 % de daño por cada 1 % de vida que te falta.', glifo: 'espina', hito: true },
  { id: 'engranaje_relojero', nombre: 'Engranaje del relojero', desc: '+3 % de daño y de velocidad de ataque por cada sobrecarga de tus armas.', glifo: 'engranaje', hito: true },
];
export const RELIQUIA: Record<string, DefReliquia> = Object.fromEntries(RELIQUIAS.map((r) => [r.id, r]));

// ------------------------------------------------------------------------------------------------- Bendiciones
export type IdSanto = 'sangrio' | 'ceniza' | 'hueco';
export interface DefSanto {
  id: IdSanto;
  nombre: string;
  titulo: string;
  color: string;
  milagro: { id: string; nombre: string; desc: string };
}
export const SANTOS: Record<IdSanto, DefSanto> = {
  sangrio: {
    id: 'sangrio', nombre: 'San Sangrío', titulo: 'el que bebe', color: '#c0303a',
    milagro: { id: 'rio_carmesi', nombre: 'Río carmesí', desc: 'Cada 8 s, todos los enemigos que sangran revientan.' },
  },
  ceniza: {
    id: 'ceniza', nombre: 'Santa Ceniza', titulo: 'la que arde', color: '#ff8a2a',
    milagro: { id: 'lluvia_ceniza', nombre: 'Lluvia de ceniza', desc: 'Cada 3 s cae una brasa ardiente sobre un enemigo cercano.' },
  },
  hueco: {
    id: 'hueco', nombre: 'El Santo Hueco', titulo: 'el que no está', color: '#8fb8ff',
    milagro: { id: 'noche_hueca', nombre: 'Noche hueca', desc: 'Cada 10 s congela 2 s a todo lo que esté a 6 m.' },
  },
};

export interface DefBendicion {
  id: string;
  santo: IdSanto;
  nombre: string;
  desc: string;
  max: number;
  glifo: string;
}
export const BENDICIONES: DefBendicion[] = [
  { id: 'caliz', santo: 'sangrio', nombre: 'Cáliz', desc: '+2 % de robo de vida.', max: 3, glifo: 'caliz' },
  { id: 'herida_abierta', santo: 'sangrio', nombre: 'Herida abierta', desc: 'El 15 % de tus golpes hace sangrar.', max: 3, glifo: 'gota' },
  { id: 'banquete', santo: 'sangrio', nombre: 'Banquete', desc: 'Los muertos a veces sueltan una gota de sangre que cura.', max: 3, glifo: 'corazon' },
  { id: 'pacto_sangre', nombre: 'Pacto de sangre', santo: 'sangrio', desc: '+12 % de daño y −10 % de curación.', max: 3, glifo: 'puno' },
  { id: 'pira', santo: 'ceniza', nombre: 'Pira', desc: 'El 15 % de tus golpes quema.', max: 3, glifo: 'llama' },
  { id: 'ceniza_viento', santo: 'ceniza', nombre: 'Ceniza al viento', desc: 'Los quemados explotan al morir.', max: 3, glifo: 'bomba' },
  { id: 'brasero', santo: 'ceniza', nombre: 'Brasero', desc: 'Un aura de calor quema a los que se pegan.', max: 3, glifo: 'llama' },
  { id: 'fenix', santo: 'ceniza', nombre: 'Fénix', desc: 'Una vez por etapa, al caer, revives envuelto en llamas.', max: 1, glifo: 'pluma' },
  { id: 'escarcha', santo: 'hueco', nombre: 'Escarcha', desc: 'El 12 % de tus golpes frena mucho.', max: 3, glifo: 'copo' },
  { id: 'velo', santo: 'hueco', nombre: 'Velo', desc: '+6 % de esquiva.', max: 3, glifo: 'sombra' },
  { id: 'animas', santo: 'hueco', nombre: 'Ánimas', desc: 'Cada 40 muertos, un espíritu aliado pelea contigo un rato.', max: 3, glifo: 'alma' },
  { id: 'vacio', santo: 'hueco', nombre: 'Vacío', desc: 'Los enemigos frenados reciben +15 % de daño.', max: 3, glifo: 'luna' },
];
export const BENDICION: Record<string, DefBendicion> = Object.fromEntries(BENDICIONES.map((b) => [b.id, b]));

// ------------------------------------------------------------------------------------------------- Pozo de las Almas
/** Mejoras permanentes que se compran con ceniza y uno de los seis minerales (como el de Deep Rock). */
export interface DefPozo {
  id: string;
  nombre: string;
  desc: string;
  stat?: Stat;
  por: number;
  max: number;
  /** Precio en ceniza del primer nivel (sube con cada uno). */
  precio: number;
  /** El mineral que pide cada nivel (además de la ceniza). */
  mineral: IdMineral;
  glifo: string;
}
// (los ids de siempre se quedan: lo comprado antes de los minerales sigue igual)
export const POZO: DefPozo[] = [
  // Plata del velo: el cuerpo
  { id: 'vida', nombre: 'Carne dura', desc: '+6 de vida máxima', stat: 'vida', por: 6, max: 10, precio: 40, mineral: 'plata', glifo: 'corazon' },
  { id: 'armadura', nombre: 'Cuero viejo', desc: '+1 de armadura', stat: 'armadura', por: 1, max: 5, precio: 60, mineral: 'plata', glifo: 'armadura' },
  { id: 'regen', nombre: 'Aliento', desc: '+0,1 de vida por segundo', stat: 'regen', por: 0.1, max: 5, precio: 50, mineral: 'plata', glifo: 'gota' },
  // Chispa de Aura: el golpe
  { id: 'dano', nombre: 'Rencor', desc: '+3 % de daño', stat: 'dano', por: 0.03, max: 10, precio: 50, mineral: 'chispa', glifo: 'puno' },
  { id: 'cadencia', nombre: 'Pulso de Aura', desc: '+2 % de velocidad de ataque', stat: 'cadencia', por: 0.02, max: 5, precio: 55, mineral: 'chispa', glifo: 'mano' },
  { id: 'critico', nombre: 'Ojo de brasa', desc: '+2 % de crítico', stat: 'critico', por: 0.02, max: 5, precio: 55, mineral: 'chispa', glifo: 'ojo' },
  // Gema de dragón: la riqueza
  { id: 'oro', nombre: 'Bolsillos hondos', desc: '+5 % de oro', stat: 'oro', por: 0.05, max: 5, precio: 40, mineral: 'gema', glifo: 'oro' },
  { id: 'vetas', nombre: 'Ojo de minero', desc: '+10 % de lo que dan las vetas', stat: 'vetas', por: 0.1, max: 5, precio: 35, mineral: 'gema', glifo: 'hierro' },
  { id: 'excavar', nombre: 'Uñas de topo', desc: '+10 % de excavar', stat: 'excavar', por: 0.1, max: 5, precio: 30, mineral: 'gema', glifo: 'pico' },
  // Escarcha del alba: lo que se templa
  { id: 'enfriamiento', nombre: 'Temple', desc: '−3 % de recarga', stat: 'enfriamiento', por: 0.03, max: 5, precio: 55, mineral: 'escarcha', glifo: 'reloj' },
  { id: 'potencia', nombre: 'Agua del alba', desc: '+6 % de potencia (más cargas de quema, veneno, sangrado y frío)', stat: 'potencia', por: 0.06, max: 5, precio: 50, mineral: 'escarcha', glifo: 'frasco' },
  { id: 'estados', nombre: 'Escarcha amarga', desc: '+6 % de daño de los estados', stat: 'estados', por: 0.06, max: 5, precio: 50, mineral: 'escarcha', glifo: 'copo' },
  // Polvo de estrellas: alas
  { id: 'velocidad', nombre: 'Prisa', desc: '+2 % de velocidad', stat: 'velocidad', por: 0.02, max: 5, precio: 45, mineral: 'polvo', glifo: 'bota' },
  { id: 'iman', nombre: 'Atracción', desc: '+10 % para recoger', stat: 'iman', por: 0.1, max: 5, precio: 30, mineral: 'polvo', glifo: 'iman' },
  { id: 'experiencia', nombre: 'Memoria', desc: '+3 % de experiencia', stat: 'experiencia', por: 0.03, max: 5, precio: 55, mineral: 'polvo', glifo: 'alma' },
  // Esmeralda de Celia: la suerte
  { id: 'suerte', nombre: 'Buena estrella', desc: '+3 de suerte', stat: 'suerte', por: 3, max: 5, precio: 60, mineral: 'esmeralda', glifo: 'trebol' },
  { id: 'tiradas', nombre: 'Dados', desc: '+1 volver a tirar por expedición', por: 1, max: 3, precio: 80, mineral: 'esmeralda', glifo: 'dado' },
  { id: 'vetos', nombre: 'Tijeras', desc: '+1 descartar por expedición', por: 1, max: 3, precio: 80, mineral: 'esmeralda', glifo: 'tijeras' },
];
export const POZO_ID: Record<string, DefPozo> = Object.fromEntries(POZO.map((p) => [p.id, p]));
export const precioPozo = (p: DefPozo, nivel: number) => Math.round(p.precio * Math.pow(1.45, nivel));
