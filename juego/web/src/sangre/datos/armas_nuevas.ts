// Sangre y Ceniza 2 (propuesta L2 y L3): las trece armas comunes nuevas (lo de Deep Rock Galactic: Survivor en versión
// de Valdemora: fuego en el piso, minas, torretas que se arman quieto, drones, el látigo hacia atrás, el rayo que rebota
// en las paredes, el lanzallamas y la escopeta), la evolución de cada arma que no tenía (con su objeto pareja, como en
// Vampire Survivors) y las uniones: dos armas altas que se vuelven una sola y liberan un espacio.
// Los ids no se cambian: van en lo que se guarda y en lo que se manda por la red.
import { F, type DefArma, type DefSobrecarga, type Etiqueta, type ParamsArma, type ParamsParcial } from '../tipos';

const BASE: ParamsArma = {
  dano: 10, cadencia: 1, cantidad: 1, area: 1, alcance: 6, vel: 12, perfora: 1, duracion: 0, rebotes: 0, empuje: 2, critico: 0,
  arco: 1.6, quema: 0, veneno: 0, sangrado: 0, lento: 0, aturde: 0, maldicion: 0, flags: 0,
};
const P = (p: Partial<ParamsArma>): ParamsArma => ({ ...BASE, ...p });
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

// ------------------------------------------------------------------------------------------------- Comunes nuevas
export const COMUNES_NUEVAS: DefArma[] = [
  {
    id: 'aceite_hirviendo', nombre: 'Aceite hirviendo', clase: 'comun', tipo: 'lanzado', apunta: 'denso', etiquetas: ['fuego', 'area'],
    base: P({ dano: 8, cadencia: 2.4, area: 1.8, alcance: 7.5, duracion: 4, quema: 3, flags: F.CHARCO }),
    desc: 'Una jarra de aceite que revienta sobre el montón y deja el piso ardiendo un buen rato.', modelo: 'cazo_aceite', proyectil: 'jarra_aceite', color: '#ff8a2a', glifo: 'llama',
    sobrecargas: [
      T('aceite_espeso', 'Aceite espeso', 'El charco dura el doble.', { por: { duracion: 2 } }),
      T('dos_jarras', 'Dos jarras', 'Lanza dos.', { mas: { cantidad: 1 } }),
      T('brea', 'Brea', 'El charco también frena.', { mas: { lento: 0.35 } }),
      T('aceite_lampara', 'Aceite de lámpara', 'Fuego sagrado: +30 % de daño.', { por: { dano: 1.3 }, etiqueta: 'sagrado' }),
      DM('jarras_lados', 'Jarras a los lados', 'otra jarra cae del otro lado'),
      GO('caldero_aceite', 'Caldero de aceite', 'todo el aceite en un solo charco enorme'),
    ],
  },
  {
    id: 'frasco_escarcha', nombre: 'Frasco de escarcha', clase: 'comun', tipo: 'lanzado', apunta: 'azar', etiquetas: ['hielo', 'area'],
    base: P({ dano: 12, cadencia: 2.2, area: 1.6, alcance: 8, lento: 0.35, duracion: 2, flags: F.DIVIDE | F.CHARCO }),
    desc: 'Revienta en esquirlas de hielo y deja el piso helado: los muertos se frenan.', modelo: 'frasco_escarcha', proyectil: 'frasco_hielo', color: '#9fe8ff', glifo: 'copo',
    sobrecargas: [
      T('escarcha_negra', 'Escarcha negra', 'Congela un instante a los que toca.', { flags: F.CONGELA }),
      T('dos_frascos_escarcha', 'Dos frascos', 'Lanza dos.', { mas: { cantidad: 1 } }),
      T('hielo_vivo', 'Hielo vivo', '+40 % de área.', { por: { area: 1.4 } }),
      T('sal_roca', 'Sal de roca', 'El hielo también envenena.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
      CI('frasquitos', 'Frasquitos de cinto', 'frascos chiquitos'),
      GO('garrafa_hielo', 'Garrafa de hielo', 'todos los frascos en uno solo, enorme'),
    ],
  },
  {
    id: 'humo_azufre', nombre: 'Humo de azufre', clase: 'comun', tipo: 'zona', apunta: 'pie', etiquetas: ['veneno', 'area'],
    base: P({ dano: 5, cadencia: 2.6, area: 2.2, alcance: 4, duracion: 3.5, veneno: 3 }),
    desc: 'Sueltas una nube de azufre donde estás parado: envenena a los que te vienen siguiendo.', modelo: 'bolsa_azufre', color: '#d8d04a', glifo: 'gota',
    sobrecargas: [
      T('azufre_denso', 'Azufre denso', 'La nube dura el doble.', { por: { duracion: 2 } }),
      T('nube_grande', 'Nube grande', '+40 % de área.', { por: { area: 1.4 } }),
      T('azufre_ardiente', 'Azufre ardiente', 'La nube también quema.', { mas: { quema: 3 }, etiqueta: 'fuego' }),
      T('humo_ciego', 'Humo ciego', 'Frena a los que entran.', { mas: { lento: 0.3 } }),
      DM('dos_nubes', 'Dos nubes', 'otra nube sale detrás de ti'),
      CO('azufre_infierno', 'Azufre del infierno', 'el humo del averno'),
    ],
  },
  {
    id: 'bomba_racimo', nombre: 'Bomba de racimo', clase: 'comun', tipo: 'lanzado', apunta: 'denso', etiquetas: ['fuego', 'area'],
    base: P({ dano: 16, cadencia: 3, area: 1.6, alcance: 8, empuje: 4, flags: F.EXPLOTA | F.EXCAVA | F.DIVIDE }),
    desc: 'Revienta y suelta bombitas que revientan otra vez (y rompen paredes).', modelo: 'racimo', proyectil: 'racimo', color: '#ff9a3a', glifo: 'bomba',
    sobrecargas: [
      T('racimo_grande', 'Racimo grande', '+30 % de área.', { por: { area: 1.3 } }),
      T('mecha_rapida', 'Mecha rápida', 'Revienta un 25 % más seguido.', { por: { cadencia: 0.75 } }),
      T('racimo_azufre', 'Racimo de azufre', 'Las bombitas envenenan.', { mas: { veneno: 4 }, etiqueta: 'veneno' }),
      T('racimo_minero', 'Racimo minero', 'Rompe las paredes blandas y las vetas.', { flags: F.EXCAVA | F.MINA }),
      GO('racimo_gordo', 'Racimo gordo', 'todo el racimo en una sola bomba enorme'),
      CI('petardos_feria', 'Petardos de feria', 'petardos chiquitos'),
    ],
  },
  {
    id: 'abrojos', nombre: 'Abrojos', clase: 'comun', tipo: 'trampa', apunta: 'cercano', etiquetas: ['fisico', 'construccion'],
    base: P({ dano: 6, cadencia: 1.6, cantidad: 3, area: 0.5, alcance: 6, duracion: 8, sangrado: 2, lento: 0.3, perfora: 99, empuje: 0 }),
    desc: 'Riegas abrojos a tu alrededor: pinchan, hacen sangrar y frenan a todos los que los pisan.', modelo: 'bolsa_abrojos', proyectil: 'abrojo', color: '#a8a0a0', glifo: 'espina',
    sobrecargas: [
      T('punado_grande', 'Puñado grande', 'Dos abrojos más.', { mas: { cantidad: 2 } }),
      T('abrojos_oxidados', 'Abrojos oxidados', 'Envenenan.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
      T('puas_largas', 'Púas largas', '+40 % de daño y duran 50 % más.', { por: { dano: 1.4, duracion: 1.5 } }),
      T('abrojos_plata', 'Abrojos de plata', 'Daño sagrado y +15 % de crítico.', { mas: { critico: 0.15 }, etiqueta: 'sagrado' }),
      DM('abrojos_atras', 'Abrojos para atrás', 'también riegas detrás de ti'),
      CO('abrojos_abuela', 'Los abrojos de la abuela', 'los que nunca fallan'),
    ],
  },
  {
    id: 'cepos', nombre: 'Cepos', clase: 'comun', tipo: 'trampa', apunta: 'cercano', etiquetas: ['fisico', 'construccion'],
    base: P({ dano: 55, cadencia: 2.8, area: 0.6, alcance: 7, duracion: 14, aturde: 1.2, empuje: 0 }),
    desc: 'Dejas un cepo en el piso: el primero que lo pisa queda atrapado y aturdido.', modelo: 'cepo', proyectil: 'cepo', color: '#8a8c92', glifo: 'cadena',
    sobrecargas: [
      T('dos_cepos', 'Dos cepos', 'Pone dos.', { mas: { cantidad: 1 } }),
      T('dientes_sierra', 'Dientes de sierra', 'Hace sangrar.', { mas: { sangrado: 5 }, etiqueta: 'sangre' }),
      T('cepo_reforzado', 'Cepo reforzado', '+50 % de daño y aturde más.', { por: { dano: 1.5 }, mas: { aturde: 0.6 } }),
      T('cepo_polvora', 'Cepo con pólvora', 'Revienta al cerrarse.', { flags: F.EXPLOTA, mas: { area: 1 } }),
      GO('cepo_oso', 'Cepo para osos', 'un cepo enorme que muerde fortísimo'),
      CI('cepitos', 'Cepitos de cinto', 'cepos de conejo'),
    ],
  },
  {
    id: 'ballesta_pie', nombre: 'Ballesta de pie', clase: 'comun', tipo: 'torreta', apunta: 'cercano', etiquetas: ['construccion', 'distancia'], quieto: true,
    base: P({ dano: 12, cadencia: 2, cantidad: 2, duracion: 14, alcance: 6 }),
    desc: 'Quédate quieto un momento y armas una ballesta de pie que dispara sola (hasta dos).', modelo: 'ballesta_pesada', color: '#d8d0c0', glifo: 'ballesta',
    sobrecargas: [
      T('virotes_fuego_pie', 'Virotes de fuego', 'Las ballestas queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
      T('tercera_ballesta', 'Tercera ballesta', 'Una ballesta más.', { mas: { cantidad: 1 } }),
      T('cuerda_encerada', 'Cuerda encerada', 'Duran el doble.', { por: { duracion: 2 } }),
      T('arco_acero', 'Arco de acero', '+40 % de daño.', { por: { dano: 1.4 } }),
      CO('ballesta_maestro', 'La ballesta del maestro', 'tu mejor obra'),
      GO('balista', 'Balista', 'una sola ballesta enorme que pega por todas'),
    ],
  },
  {
    id: 'cuervos_cazadores', nombre: 'Cuervos cazadores', clase: 'comun', tipo: 'orbita', apunta: 'cercano', etiquetas: ['sombra', 'invocacion'],
    base: P({ dano: 9, cadencia: 0.5, cantidad: 2, area: 1.8, vel: 3, flags: F.PERSIGUE }),
    desc: 'Dos cuervos vuelan a tu alrededor y se lanzan sobre los que se acercan.', modelo: 'guante_cetreria', proyectil: 'cuervo', color: '#7a5bb8', glifo: 'cuervo',
    sobrecargas: [
      T('bandada', 'Bandada', 'Un cuervo más.', { mas: { cantidad: 1 } }),
      T('picos_hierro', 'Picos de hierro', '+40 % de daño.', { por: { dano: 1.4 } }),
      T('cuervos_malditos', 'Cuervos malditos', 'Maldicen a los que pican.', { mas: { maldicion: 1 } }),
      T('vuelo_largo', 'Vuelo largo', 'Vuelan 40 % más lejos.', { por: { area: 1.4 } }),
      CI('cuervito', 'Cuervito de cinto', 'un cuervito que no se despega'),
      GO('cuervo_viejo', 'El cuervo viejo', 'un solo cuervo enorme'),
    ],
  },
  {
    id: 'murcielagos', nombre: 'Murciélagos guardianes', clase: 'comun', tipo: 'orbita', apunta: 'cercano', etiquetas: ['sangre', 'invocacion'],
    base: P({ dano: 7, cadencia: 0.4, cantidad: 3, area: 2.6, vel: 2.4, sangrado: 2 }),
    desc: 'Tres murciélagos dan vueltas lejos de ti y desangran a los que cruzan.', modelo: 'jaula', proyectil: 'murcielago', color: '#c8323a', glifo: 'murcielago',
    sobrecargas: [
      T('colonia', 'Colonia', 'Dos murciélagos más.', { mas: { cantidad: 2 } }),
      T('murcielagos_vampiro', 'Murciélagos vampiro', 'Desangran el doble.', { mas: { sangrado: 2 }, flags: F.SANGRA }),
      T('chillido', 'Chillido', 'Aturden un poquito.', { mas: { aturde: 0.2 } }),
      T('alas_sombra', 'Alas de sombra', 'Daño de sombra y +30 % de daño.', { por: { dano: 1.3 }, etiqueta: 'sombra' }),
      CO('reina_colonia', 'La reina de la colonia', 'la murciélaga más vieja'),
      GO('murcielago_gigante', 'Murciélago gigante', 'un solo murciélago enorme'),
    ],
  },
  {
    id: 'latigo_espinas', nombre: 'Látigo de espinas', clase: 'comun', tipo: 'latigo', apunta: 'atras', etiquetas: ['fisico', 'sangre'],
    base: P({ dano: 16, cadencia: 1.05, alcance: 4.4, area: 0.85, perfora: 99, sangrado: 3, empuje: 2 }),
    desc: 'Un latigazo hacia atrás: castiga a los que te persiguen y los hace sangrar.', modelo: 'latigo_espinas', color: '#7a8a4a', glifo: 'espina',
    sobrecargas: [
      T('dos_colas', 'Dos colas', 'Dos latigazos en abanico.', { mas: { cantidad: 1 } }),
      T('espinas_largas', 'Espinas largas', '+35 % de alcance.', { por: { alcance: 1.35 } }),
      T('zarza_venenosa', 'Zarza venenosa', 'Envenena.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
      T('rosal_cementerio', 'Rosal del cementerio', '+40 % de daño.', { por: { dano: 1.4 } }),
      DM('latigo_doble', 'Látigo de doble cola', 'también azota hacia adelante'),
      CO('latigo_capataz', 'El látigo del capataz', 'el látigo que todos temen'),
    ],
  },
  {
    id: 'rayo_sangre', nombre: 'Rayo de sangre', clase: 'comun', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['sangre', 'distancia'],
    base: P({ dano: 15, cadencia: 1.6, vel: 22, alcance: 11, perfora: 99, rebotes: 3, flags: F.REBOTA }),
    desc: 'Un rayo de sangre que atraviesa a todos y rebota en las paredes.', modelo: 'vara_sangre', proyectil: 'gota_sangre', color: '#ff3a4a', glifo: 'gota',
    sobrecargas: [
      T('sangre_espesa', 'Sangre espesa', 'Rebota tres veces más.', { mas: { rebotes: 3 } }),
      T('dos_rayos_sangre', 'Dos rayos', 'Lanza dos.', { mas: { cantidad: 1 } }),
      T('sangre_hierve', 'Sangre que hierve', 'Quema.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
      T('hemorragia', 'Hemorragia', 'Hace sangrar.', { mas: { sangrado: 4 } }),
      CI('varita_sangre', 'Varita de cinto', 'una varita'),
      GO('torrente', 'Torrente', 'un solo rayo enorme'),
    ],
  },
  {
    id: 'lanza_fuego', nombre: 'Lanza de fuego', clase: 'comun', tipo: 'cono', apunta: 'cercano', etiquetas: ['fuego', 'area'],
    base: P({ dano: 7.5, cadencia: 0.35, alcance: 3.8, arco: 0.75, quema: 2, empuje: 0.5, flags: F.GIRA }),
    desc: 'Un sifón de fuego griego que escupe llamas dando vueltas a tu alrededor.', modelo: 'sifon', color: '#ff7a2a', glifo: 'llama',
    sobrecargas: [
      T('boquilla_larga', 'Boquilla larga', '+35 % de alcance.', { por: { alcance: 1.35 } }),
      T('fuego_pegajoso', 'Fuego pegajoso', 'Deja el piso ardiendo.', { flags: F.CHARCO, mas: { duracion: 1.5 } }),
      T('llama_ancha', 'Llama ancha', '+40 % de ancho.', { por: { arco: 1.4 } }),
      T('llama_bendita', 'Llama bendita', 'Fuego sagrado y +25 % de daño.', { por: { dano: 1.25 }, etiqueta: 'sagrado' }),
      DM('sifon_doble', 'Sifón doble', 'escupe también hacia el otro lado'),
      CO('sifon_bizancio', 'El sifón de Bizancio', 'el arma secreta de los emperadores'),
    ],
  },
  {
    id: 'perdigonera', nombre: 'Perdigonera', clase: 'comun', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 7, cadencia: 1.5, cantidad: 6, vel: 20, alcance: 4.6, arco: 0.9, empuje: 4 }),
    desc: 'Seis perdigones en abanico: devastadora de cerca, inútil de lejos.', modelo: 'perdigonera', proyectil: 'perdigon', color: '#c8c0b0', glifo: 'trabuco',
    sobrecargas: [
      T('mas_perdigones', 'Más perdigones', 'Tres perdigones más.', { mas: { cantidad: 3 } }),
      T('canon_largo', 'Cañón largo', '+40 % de alcance.', { por: { alcance: 1.4 } }),
      T('perdigones_sal', 'Perdigones de sal', 'Frenan.', { mas: { lento: 0.3 } }),
      T('perdigones_plata', 'Perdigones de plata', 'Daño sagrado y +15 % de crítico.', { mas: { critico: 0.15 }, etiqueta: 'sagrado' }),
      DM('dos_canones', 'Dos cañones', 'dispara también hacia atrás'),
      GO('bala_canon', 'Bala de cañón', 'todos los perdigones en una bala enorme'),
    ],
  },
];

// ------------------------------------------------------------------------------------------------- Evoluciones nuevas
interface DefEvo {
  /** El arma de base, la evolución, su nombre, el objeto (o reliquia) pareja y lo que hace. */
  base: string;
  id: string;
  nombre: string;
  con: string;
  desc: string;
  color: string;
  por?: ParamsParcial;
  mas?: ParamsParcial;
  flags?: number;
  etiquetas?: Etiqueta[];
}
const E = (base: string, id: string, nombre: string, con: string, color: string, desc: string, o: Omit<DefEvo, 'base' | 'id' | 'nombre' | 'con' | 'desc' | 'color'> = {}): DefEvo =>
  ({ base, id, nombre, con, color, desc, ...o });

/** Las evoluciones de las armas que no tenían: pegan ~2,2 veces más, atacan un poco más seguido y suman lo suyo. */
const EVOS: DefEvo[] = [
  // Monarca
  E('cetro_hierro', 'cetro_emperador', 'Cetro del Emperador', 'cuerno_guerra', '#ffe08a', 'Cada golpe al piso retumba dos veces, llega lejísimos y aturde.', { flags: F.DOBLE, por: { area: 1.35 }, mas: { aturde: 0.3 }, etiquetas: ['sagrado'] }),
  E('estandarte', 'estandarte_eterno', 'Estandarte de la Casa Eterna', 'aceite_santo', '#ff7a4a', 'Un aura enorme de fuego sagrado que anima y cura a los tuyos.', { flags: F.CURA, por: { area: 1.5 }, mas: { quema: 3 }, etiquetas: ['fuego'] }),
  E('lanza_ceremonial', 'lanza_coronacion', 'Lanza de la Coronación', 'reliquia_peregrino', '#fff0b0', 'Tres estocadas larguísimas que atraviesan a todos y aturden.', { por: { alcance: 1.3 }, mas: { cantidad: 2, aturde: 0.3 }, etiquetas: ['sagrado'] }),
  // Campesino
  E('hoz', 'guadana_luna', 'Guadaña de la Luna', 'calavera_monje', '#c8d8ff', 'Un guadañazo que da la vuelta completa y remata a los débiles.', { flags: F.GIRA | F.EJECUTA, por: { area: 1.25 }, etiquetas: ['sombra'] }),
  E('antorcha', 'hoguera_pueblo', 'Hoguera del Pueblo', 'carbon_vivo', '#ff8a2a', 'Llamaradas adelante y atrás que dejan el piso ardiendo.', { flags: F.DETRAS | F.CHARCO, por: { alcance: 1.25 }, mas: { quema: 4, duracion: 2 } }),
  E('honda', 'honda_pastor', 'Honda del Pastor', 'ojo_vidrio', '#e8e0c8', 'Dos piedras que saltan de enemigo en enemigo y aturden.', { flags: F.SALTA, mas: { cantidad: 1, rebotes: 4, aturde: 0.25 } }),
  // Prisionero
  E('bola_hierro', 'bola_condenado', 'Bola del Condenado', 'botas_plomo', '#b0b4ba', 'Tres bolas que salen disparadas contra los que se acercan.', { flags: F.PERSIGUE, por: { area: 1.2 }, mas: { cantidad: 2 } }),
  E('punos', 'punos_motin', 'Puños del Motín', 'cadena_condenado', '#ff6a6a', 'Golpes en cruz tan rápidos que desangran a todos.', { flags: F.GIRA | F.DOBLE, por: { cadencia: 0.8 }, mas: { sangrado: 3 }, etiquetas: ['sangre'] }),
  E('pico_robado', 'pico_fuga', 'Pico de la Gran Fuga', 'pico_ancho', '#d8d0c0', 'Tres picos que van, cavan y vuelven atravesándolo todo.', { flags: F.EXCAVA, mas: { cantidad: 2 } }),
  // Caballero
  E('mangual', 'mangual_asedio', 'Mangual de Asedio', 'polvora_negra', '#c8ccd2', 'Dos bolas de púas enormes que tumban y aturden.', { por: { area: 1.3 }, mas: { cantidad: 1, aturde: 0.3, empuje: 4 } }),
  E('lanza_justa', 'lanza_campeon', 'Lanza del Campeón', 'cuchilla_curva', '#f0e2b8', 'Dos cargas que atraviesan la fila entera, empujan y aturden.', { por: { alcance: 1.4, empuje: 2 }, mas: { cantidad: 1, aturde: 0.6 } }),
  E('escudo_arrojadizo', 'escudo_muralla', 'Escudo de la Muralla', 'jarra_aguardiente', '#e0d8c8', 'Dos escudos que rebotan de enemigo en enemigo y vuelven.', { flags: F.SALTA, mas: { cantidad: 1, rebotes: 3 } }),
  // Cazador
  E('estacas', 'estacas_plata', 'Estacas de Plata', 'astilla_cruz', '#e8eef5', 'Estacas que atraviesan a todos y rematan a los malditos.', { flags: F.EJECUTA, mas: { perfora: 4, cantidad: 1 }, etiquetas: ['sagrado'] }),
  E('agua_bendita', 'agua_rio_santo', 'Agua del Río Santo', 'reloj_roto', '#9fe0ff', 'Frascos que dejan charcos benditos enormes que curan a los tuyos.', { flags: F.CHARCO | F.CURA, por: { area: 1.4 }, mas: { cantidad: 1, duracion: 2 } }),
  E('trabuco', 'trabuco_mayor', 'Trabuco del Cazador Mayor', 'carcaj', '#ffd38a', 'Un estallido ancho adelante y atrás que tumba a todos.', { flags: F.DETRAS, por: { alcance: 1.25, arco: 1.3, empuje: 1.5 } }),
  // Herrero
  E('torreta_ballesta', 'torreta_asedio', 'Torreta de Asedio', 'plano_maestro', '#ffb46a', 'Una torreta más que dispara virotes de fuego y dura el doble.', { por: { duracion: 2 }, mas: { cantidad: 1, quema: 5 }, etiquetas: ['fuego'] }),
  E('yunque', 'lluvia_yunques', 'Lluvia de Yunques', 'cuerno_guerra', '#b0b4ba', 'Caen tres yunques a la vez que hacen temblar la tierra.', { por: { area: 1.3 }, mas: { cantidad: 2, aturde: 0.4 } }),
  E('chispas', 'fragua_viva', 'Fragua Viva', 'carbon_vivo', '#ffc04a', 'Chispas que dan la vuelta entera y dejan brasas en el piso.', { flags: F.GIRA | F.CHARCO, mas: { quema: 4, duracion: 1.5 } }),
  // Alquimista
  E('fuego_griego', 'fuego_inextinguible', 'Fuego Inextinguible', 'sal_amarga', '#ff6a1a', 'Charcos de fuego que no se apagan y se parten en más charcos.', { flags: F.DIVIDE, por: { duracion: 2, area: 1.3 } }),
  E('frasco_helado', 'corazon_invierno', 'Corazón del Invierno', 'escarcha_eterna', '#bfeaff', 'Frascos que congelan todo lo que salpican.', { flags: F.CONGELA, por: { area: 1.35 }, mas: { cantidad: 1 } }),
  E('gas_venenoso', 'miasma', 'Miasma', 'veneno_aspid', '#9bd84a', 'Una nube enorme que envenena el doble y frena.', { por: { area: 1.4 }, mas: { veneno: 4, lento: 0.3 } }),
  // Sepulturero
  E('linterna_almas', 'farol_animas', 'Farol de las Ánimas', 'piedra_iman', '#8fe3ff', 'Cuatro faroles que giran lejos y maldicen a los que tocan.', { por: { area: 1.3 }, mas: { cantidad: 3, maldicion: 1 } }),
  E('huesos', 'osario_vivo', 'El Osario Vivo', 'huesos_santo', '#f0e8d0', 'Lluvia de huesos que revientan en astillas.', { flags: F.DIVIDE, mas: { cantidad: 2 } }),
  E('campana_funebre', 'campana_difuntos', 'Campana de Difuntos', 'vela_negra', '#c8b8ff', 'Cada campanada retumba dos veces y maldice a los que la oyen.', { flags: F.DOBLE, por: { area: 1.3 }, mas: { maldicion: 2 } }),
  // Inquisidor
  E('libro_oraciones', 'evangelio_fuego', 'Evangelio de Fuego', 'aceite_santo', '#ffb04a', 'Seis páginas en llamas giran a tu alrededor.', { mas: { cantidad: 3, quema: 4 }, etiquetas: ['fuego'] }),
  E('cruz_plata', 'cruz_peregrina', 'Cruz Peregrina', 'astilla_cruz', '#f4f8ff', 'Cruces que saltan de enemigo en enemigo antes de volver.', { flags: F.SALTA, mas: { cantidad: 1, rebotes: 3 } }),
  E('rayo_sagrado', 'juicio_celestial', 'Juicio Celestial', 'estuche_boticario', '#fff4a8', 'Un rayo que salta el doble de veces y aturde.', { por: { area: 1.3 }, mas: { cantidad: 4, aturde: 0.3 } }),
  // Verdugo
  E('ganchos', 'garfios_matadero', 'Garfios del Matadero', 'colmillo_lobo', '#c8504a', 'Tres garfios que arrastran a los enemigos hacia ti y los desangran.', { flags: F.ATRAE, mas: { cantidad: 2, sangrado: 4 }, etiquetas: ['sangre'] }),
  E('guillotina', 'la_viuda', 'La Viuda', 'cuchilla_curva', '#e8e8e8', 'Tres cuchillas que caen sobre los más fuertes y rematan a los débiles.', { flags: F.EJECUTA, por: { area: 1.3 }, mas: { cantidad: 2 } }),
  E('soga', 'soga_ahorcado', 'Soga del Ahorcado', 'cilicio', '#d8b888', 'Dos latigazos que atan a los cercanos al golpeado.', { flags: F.ENCADENA, mas: { cantidad: 1 } }),
  // Bruja
  E('vudu', 'muneca_condena', 'Muñeca de la Condena', 'sal_amarga', '#d07bff', 'La maldición salta a cuatro enemigos más y los deja malditos el doble.', { mas: { cantidad: 4, maldicion: 2 } }),
  E('caldero', 'caldero_tres_brujas', 'El Caldero de las Tres Brujas', 'veneno_aspid', '#8ae05a', 'Tres pantanos a la vez que envenenan, queman y frenan.', { mas: { cantidad: 2, quema: 3, lento: 0.2 }, etiquetas: ['fuego'] }),
  E('plumas_negras', 'plumas_augurio', 'Plumas del Augurio', 'vela_negra', '#9a7aff', 'Plumas que salen en espiral y buscan solas a su presa.', { flags: F.ESPIRAL | F.TELEDIRIGIDO, mas: { cantidad: 3 } }),
  // Juglar
  E('cuchillos_malabar', 'cuchillos_fortuna', 'Cuchillos de la Fortuna', 'dados_cargados', '#f0f4ff', 'Más cuchillos, que rebotan en las paredes y casi siempre son críticos.', { flags: F.REBOTA, mas: { cantidad: 2, rebotes: 2, critico: 0.25 } }),
  E('flauta', 'flauta_flautista', 'Flauta del Flautista', 'pluma_fenix', '#ffe08a', 'Notas en espiral que encantan a los muertos y los ponen de tu lado.', { flags: F.ESPIRAL | F.ENCANTA, mas: { cantidad: 3 } }),
  E('tambor_guerra', 'tambor_ultima_batalla', 'Tambor de la Última Batalla', 'reliquia_peregrino', '#f0c88a', 'Cada redoble retumba dos veces y aturde a todos alrededor.', { flags: F.DOBLE, por: { area: 1.35 }, mas: { aturde: 0.4 } }),
  // Comunes de siempre
  E('arco_largo', 'arco_montero', 'Arco del Montero Mayor', 'carcaj', '#f0e0b8', 'Una lluvia de flechas que atraviesan a todos.', { mas: { cantidad: 3, perfora: 4 } }),
  E('hacha_arrojadiza', 'hachas_lenador', 'Hachas del Leñador', 'guantes_cuero', '#e8d8c0', 'Tres hachas que revientan al caer y rompen las paredes.', { flags: F.EXPLOTA | F.EXCAVA, mas: { cantidad: 2 } }),
  E('carga_minera', 'barreno_mayor', 'Barreno Mayor', 'lampara_minero', '#ffc070', 'Tres cargas que revientan las vetas y todo lo que hay cerca.', { por: { area: 1.3 }, mas: { cantidad: 2 } }),
  E('sierra', 'sierras_molino', 'Las Sierras del Molino', 'saco_avaro', '#e0e4ea', 'Cinco hojas que salen disparadas contra los que se acercan y los desangran.', { flags: F.PERSIGUE, mas: { cantidad: 2, sangrado: 3 }, etiquetas: ['sangre'] }),
  E('ira_cielo', 'tormenta_dorada', 'Tormenta Dorada', 'bolsa_maldita', '#ffe07a', 'Cuatro rayos a la vez; los que mata sueltan más oro.', { flags: F.ORO, por: { area: 1.25 }, mas: { cantidad: 2 } }),
  // Comunes nuevas
  E('aceite_hirviendo', 'rio_brea', 'Río de Brea', 'reloj_roto', '#ff7a1a', 'Tres jarras que dejan ríos de brea ardiente: queman y frenan.', { por: { area: 1.3 }, mas: { cantidad: 2, lento: 0.35, duracion: 3 } }),
  E('frasco_escarcha', 'invierno_eterno', 'Invierno Eterno', 'escarcha_eterna', '#d8f4ff', 'Frascos que congelan a todo lo que salpican.', { flags: F.CONGELA, por: { area: 1.4 }, mas: { cantidad: 1 } }),
  E('humo_azufre', 'aliento_averno', 'Aliento del Averno', 'estuche_boticario', '#ffd04a', 'Una nube enorme que envenena, quema y frena.', { por: { area: 1.5, duracion: 1.5 }, mas: { quema: 3, lento: 0.25 }, etiquetas: ['fuego'] }),
  E('bomba_racimo', 'lluvia_polvora', 'Lluvia de Pólvora', 'cartuchos_minero', '#ffb05a', 'Tres racimos a la vez que lo revientan todo, paredes incluidas.', { flags: F.EXCAVA, por: { area: 1.25 }, mas: { cantidad: 2 } }),
  E('abrojos', 'campo_espinas', 'Campo de Espinas', 'guantes_cuero', '#c8c0b8', 'Un campo entero de abrojos que desangra a todo el que pase.', { por: { duracion: 1.5 }, mas: { cantidad: 4, sangrado: 3 } }),
  E('cepos', 'mandibula_hierro', 'Mandíbula de Hierro', 'botas_plomo', '#b8bcc4', 'Cepos que muerden y revientan, aturdiendo a todos alrededor.', { flags: F.EXPLOTA, mas: { cantidad: 1, area: 1.2, aturde: 0.6 } }),
  E('ballesta_pie', 'fortin', 'Fortín', 'plano_maestro', '#ffb46a', 'Quieto armas tres ballestas de fuego que disparan sin parar.', { por: { duracion: 1.6 }, mas: { cantidad: 1, quema: 4 }, etiquetas: ['fuego'] }),
  E('cuervos_cazadores', 'bandada_noche', 'La Bandada de la Noche', 'calavera_monje', '#9a7aff', 'Cinco cuervos malditos que no dejan a nadie en paz.', { por: { area: 1.2 }, mas: { cantidad: 3, maldicion: 1 } }),
  E('murcielagos', 'nube_vampiros', 'Nube de Vampiros', 'pluma_fenix', '#ff4a5a', 'Seis murciélagos que desangran a todos los que cruzan.', { flags: F.SANGRA, por: { area: 1.15 }, mas: { cantidad: 3, sangrado: 3 } }),
  E('latigo_espinas', 'zarza_maldita', 'La Zarza Maldita', 'cadena_condenado', '#9aaa5a', 'Latigazos de espinas a los dos lados que desangran sin piedad.', { flags: F.DETRAS, por: { alcance: 1.25 }, mas: { cantidad: 1, sangrado: 3 } }),
  E('rayo_sangre', 'rio_carmesi', 'Río Carmesí', 'colmillo_lobo', '#ff2a3a', 'Tres rayos de sangre que rebotan sin parar.', { mas: { cantidad: 2, rebotes: 3, sangrado: 3 } }),
  E('lanza_fuego', 'aliento_dragon', 'Aliento de Dragón', 'lampara_minero', '#ff9a2a', 'Dos chorros de fuego que dan vueltas y dejan el piso ardiendo.', { flags: F.DETRAS | F.CHARCO, por: { alcance: 1.3 }, mas: { quema: 3, duracion: 1.5 } }),
  E('perdigonera', 'canon_mano', 'Cañón de Mano', 'polvora_negra', '#e8d8b8', 'Ocho perdigones que revientan al pegar.', { flags: F.EXPLOTA, mas: { cantidad: 2 } }),
];

/** Crea las evoluciones nuevas (y le pone a cada arma de base su `evoluciona`). */
export function crearEvoluciones(armas: Record<string, DefArma>): DefArma[] {
  const r: DefArma[] = [];
  for (const e of EVOS) {
    const b = armas[e.base];
    if (!b || b.evoluciona) continue;
    const p: ParamsArma = { ...b.base };
    p.dano *= 2.2;
    p.cadencia *= 0.85;
    if (e.por) for (const [k, v] of Object.entries(e.por)) (p as unknown as Record<string, number>)[k] *= v as number;
    if (e.mas) for (const [k, v] of Object.entries(e.mas)) (p as unknown as Record<string, number>)[k] += v as number;
    p.flags |= e.flags ?? 0;
    r.push({
      id: e.id, nombre: e.nombre, clase: b.clase, tipo: b.tipo, apunta: b.apunta, etiquetas: [...new Set([...b.etiquetas, ...(e.etiquetas ?? [])])], base: p,
      desc: e.desc, modelo: b.modelo, proyectil: b.proyectil, color: e.color, glifo: b.glifo, evolucion: true, sobrecargas: [], quieto: b.quieto,
    });
    b.evoluciona = { con: e.con, a: e.id };
  }
  return r;
}

/** Objeto pareja de cada evolución nueva (para avisarlo en la descripción del objeto). */
export const PAREJAS_NUEVAS: [con: string, base: string][] = EVOS.map((e) => [e.con, e.base]);

// ------------------------------------------------------------------------------------------------- Uniones
// Como las uniones de Vampire Survivors: dos armas en el nivel 12 o más se vuelven una sola en un cofre (sin objeto), y
// el espacio de la segunda queda libre para otra arma.
export const UNIONES: DefArma[] = [
  {
    id: 'cruz_bautismal', nombre: 'Cruz Bautismal', clase: 'cazador', tipo: 'lanzado', apunta: 'azar', etiquetas: ['sagrado', 'area', 'distancia'], union: ['agua_bendita', 'cruz_plata'],
    base: P({ dano: 40, cadencia: 1.1, area: 2.6, alcance: 9, cantidad: 3, duracion: 4, flags: F.CHARCO | F.CURA | F.DIVIDE }),
    desc: 'Agua bendita + Cruz de plata: cruces que caen, revientan en agua bendita y curan a los tuyos.', modelo: 'cruz', proyectil: 'cruz', color: '#bfe8ff', glifo: 'cruz', evolucion: true, sobrecargas: [],
  },
  {
    id: 'lanzaestacas', nombre: 'Lanzaestacas', clase: 'cazador', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia', 'sagrado'], union: ['ballesta', 'estacas'],
    base: P({ dano: 36, cadencia: 0.5, vel: 26, alcance: 13, perfora: 99, cantidad: 3, flags: F.EJECUTA }),
    desc: 'Ballesta + Estacas: tres estacas que lo atraviesan todo y rematan a los débiles.', modelo: 'ballesta', proyectil: 'estaca', color: '#e8c890', glifo: 'ballesta', evolucion: true, sobrecargas: [],
  },
  {
    id: 'campana_osario', nombre: 'Campana del Osario', clase: 'sepulturero', tipo: 'onda', apunta: 'cercano', etiquetas: ['sombra', 'area', 'fisico'], union: ['campana_funebre', 'huesos'],
    base: P({ dano: 34, cadencia: 1.4, area: 4.6, maldicion: 2, aturde: 0.3, empuje: 6, flags: F.DOBLE }),
    desc: 'Campana fúnebre + Huesos: cada campanada lanza dos anillos de huesos que maldicen.', modelo: 'campana_mano', color: '#c8b8ff', glifo: 'campana', evolucion: true, sobrecargas: [],
  },
  {
    id: 'parlamento_cuervos', nombre: 'Parlamento de Cuervos', clase: 'bruja', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['sombra', 'distancia'], union: ['baston_cuervos', 'plumas_negras'],
    base: P({ dano: 20, cadencia: 0.5, vel: 13, cantidad: 6, alcance: 11, perfora: 3, maldicion: 1, flags: F.TELEDIRIGIDO | F.ESPIRAL }),
    desc: 'Bastón de cuervos + Plumas negras: una bandada en espiral que caza sola.', modelo: 'baston_cuervos', proyectil: 'pluma_cuervo', color: '#a87bff', glifo: 'cuervo', evolucion: true, sobrecargas: [],
  },
  {
    id: 'evangelio_tormenta', nombre: 'Evangelio de la Tormenta', clase: 'inquisidor', tipo: 'cadena', apunta: 'cercano', etiquetas: ['sagrado', 'area'], union: ['rayo_sagrado', 'libro_oraciones'],
    base: P({ dano: 30, cadencia: 0.9, cantidad: 10, area: 6, alcance: 9, aturde: 0.3 }),
    desc: 'Rayo sagrado + Libro de oraciones: un rayo que salta a diez enemigos y los aturde.', modelo: 'grimorio', color: '#fff4a8', glifo: 'libro', evolucion: true, sobrecargas: [],
  },
  {
    id: 'marcha_flautista', nombre: 'La Marcha del Flautista', clase: 'juglar', tipo: 'onda', apunta: 'cercano', etiquetas: ['sombra', 'area'], union: ['tambor_guerra', 'flauta'],
    base: P({ dano: 28, cadencia: 1.0, area: 4.8, aturde: 0.6, lento: 0.4, empuje: 3, flags: F.DOBLE }),
    desc: 'Tambor de guerra + Flauta encantada: una marcha que retumba dos veces, aturde y deja a todos lentos.', modelo: 'flauta', color: '#ffe08a', glifo: 'nota', evolucion: true, sobrecargas: [],
  },
  {
    id: 'horca_garfios', nombre: 'La Horca de Garfios', clase: 'verdugo', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia', 'sangre'], union: ['ganchos', 'soga'],
    base: P({ dano: 34, cadencia: 0.8, vel: 18, cantidad: 4, alcance: 9, perfora: 3, sangrado: 6, flags: F.ATRAE | F.EJECUTA }),
    desc: 'Ganchos + Soga: cuatro garfios que arrastran, desangran y rematan.', modelo: 'gancho', proyectil: 'gancho', color: '#c8504a', glifo: 'gancho', evolucion: true, sobrecargas: [],
  },
  {
    id: 'molino_hachas', nombre: 'Molino de Hachas', clase: 'comun', tipo: 'orbita', apunta: 'cercano', etiquetas: ['fisico', 'sangre'], union: ['hacha_arrojadiza', 'sierra'],
    base: P({ dano: 30, cadencia: 0.35, cantidad: 6, area: 2.2, vel: 4.5, sangrado: 3, empuje: 3, flags: F.PERSIGUE }),
    desc: 'Hacha arrojadiza + Hojas de sierra: seis hachas que giran y salen disparadas contra los que se acercan.', modelo: 'hacha', proyectil: 'hacha', color: '#e0d0c0', glifo: 'hacha', evolucion: true, sobrecargas: [],
  },
  {
    id: 'santa_barbara', nombre: 'Polvorín de Santa Bárbara', clase: 'comun', tipo: 'lanzado', apunta: 'denso', etiquetas: ['fuego', 'area'], union: ['bomba', 'carga_minera'],
    base: P({ dano: 60, cadencia: 1.5, area: 3.4, alcance: 9, cantidad: 3, empuje: 8, quema: 6, flags: F.EXPLOTA | F.EXCAVA | F.MINA | F.DIVIDE }),
    desc: 'Bomba + Carga minera: tres barriles que lo vuelan todo, vetas incluidas.', modelo: 'carga_minera', proyectil: 'bomba', color: '#ffc06a', glifo: 'bomba', evolucion: true, sobrecargas: [],
  },
  {
    id: 'peste_negra', nombre: 'La Peste Negra', clase: 'alquimista', tipo: 'aura', apunta: 'cercano', etiquetas: ['veneno', 'area'], union: ['gas_venenoso', 'frasco_acido'],
    base: P({ dano: 16, cadencia: 0.4, area: 4.2, veneno: 6, lento: 0.25 }),
    desc: 'Gas venenoso + Frascos ácidos: una nube de peste que te sigue, envenena y frena.', modelo: 'frasco', color: '#9bd84a', glifo: 'frasco', evolucion: true, sobrecargas: [],
  },
  {
    id: 'cadalso', nombre: 'El Cadalso', clase: 'verdugo', tipo: 'rayo', apunta: 'fuerte', etiquetas: ['fisico', 'sombra'], union: ['guillotina', 'hacha_verdugo'],
    base: P({ dano: 120, cadencia: 1.4, cantidad: 3, area: 1.8, alcance: 9, sangrado: 8, flags: F.EJECUTA }),
    desc: 'Guillotina + Hacha de verdugo: tres cuchillas sobre los más fuertes que rematan a los débiles.', modelo: 'hacha_verdugo', proyectil: 'guillotina', color: '#ff4a4a', glifo: 'hacha', evolucion: true, sobrecargas: [],
  },
  {
    id: 'fuego_escarcha', nombre: 'Fuego y Escarcha', clase: 'alquimista', tipo: 'lanzado', apunta: 'denso', etiquetas: ['fuego', 'hielo', 'area'], union: ['fuego_griego', 'frasco_helado'],
    base: P({ dano: 40, cadencia: 1.0, area: 2.6, alcance: 9, cantidad: 2, quema: 6, lento: 0.4, duracion: 3, flags: F.CHARCO | F.EXPLOTA | F.CONGELA }),
    desc: 'Fuego griego + Frasco helado: frascos que queman y congelan a la vez.', modelo: 'frasco', proyectil: 'frasco_fuego', color: '#ff9a6a', glifo: 'llama', evolucion: true, sobrecargas: [],
  },
  {
    id: 'campo_trampero', nombre: 'El Campo del Trampero', clase: 'comun', tipo: 'trampa', apunta: 'cercano', etiquetas: ['fisico', 'construccion'], union: ['cepos', 'abrojos'],
    base: P({ dano: 50, cadencia: 1.2, cantidad: 4, area: 1.2, alcance: 7, duracion: 14, aturde: 0.8, sangrado: 4, lento: 0.3, empuje: 0, flags: F.EXPLOTA }),
    desc: 'Cepos + Abrojos: cuatro cepos con pólvora que revientan, aturden y desangran.', modelo: 'cepo', proyectil: 'cepo', color: '#c8c0b0', glifo: 'cadena', evolucion: true, sobrecargas: [],
  },
  {
    id: 'noche_alada', nombre: 'La Noche Alada', clase: 'comun', tipo: 'orbita', apunta: 'cercano', etiquetas: ['sombra', 'sangre', 'invocacion'], union: ['cuervos_cazadores', 'murcielagos'],
    base: P({ dano: 26, cadencia: 0.35, cantidad: 7, area: 2.4, vel: 3.2, sangrado: 3, maldicion: 1, flags: F.PERSIGUE }),
    desc: 'Cuervos cazadores + Murciélagos guardianes: siete alas que giran, se lanzan y desangran.', modelo: 'jaula', proyectil: 'murcielago', color: '#c84aff', glifo: 'murcielago', evolucion: true, sobrecargas: [],
  },
];
