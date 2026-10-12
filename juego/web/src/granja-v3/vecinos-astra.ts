// La ropa de los 118 residentes nuevos de Astra (los de las regiones fuera del Pueblo del Sol), con el mismo peluche
// de Javier y Laura y el clóset de los amigos. Cada región tiene su paleta (el puerto en azules y amarillo de
// impermeable, Brumaverde en musgo, Piedralumbre en ocre y gris de mina, Brasaviva en terracota, Nieveclara en lana
// clara, Vigilia en vino y cuero, Verdia en pastel con flores, Senda en lila, Nox en azul de noche y la órbita en blanco
// y turquesa) y cada quien lleva lo de su oficio y su edad. Solo es arte: los IDs son los de `astra.ts`.
//
// Cada fila: [cuerpo, piel (0-5), pelo, peinado, cabeza, cara, arriba, abajo, pies, espalda, pose de descanso, escala]
// Las prendas van como «modelo#color#color2» (`valorPieza`); el peinado sin color toma el del pelo.
export type FilaAstra = [
  'el' | 'ella', number, string, string, string, string, string, string, string, string, string?, number?,
];

export const VECINOS_ASTRA: Record<string, FilaAstra> = {
  // Puerto de los Lirios: impermeables amarillos, rayas marineras, botas de lluvia
  lirios_bastian: ['el', 2, '#4a3226', 'pelo_lado', 'sombrero_pescador#e3d2a8', 'barba#4a3226', 'camiseta_rayas#2f5fa8#f6f2ea', 'overol#6b8aa8', 'botas_lluvia#2f5fa8', '', 'jarras'],
  lirios_olga: ['ella', 1, '#8a8580', 'pelo_mono_bajo', 'panoleta#2f6fa8#ffffff', 'gafas_redondas#3d2b27', 'delantal#f6f2ea#2f6fa8', 'falda_larga#3e5a7a', 'botas_lluvia#3e4248', '', 'contar_a'],
  lirios_maite: ['ella', 2, '#2e2522', 'pelo_cola', 'gorra#3fa0a0#ffffff', '', 'chaqueta#3fa0a0', 'overol#4f79a8', 'botas_lluvia#f6cf5a', '', 'pensando'],
  lirios_julian: ['el', 0, '#e6e1da', 'pelo_calvo', 'gorro_lana#1e3a5f', 'barba#e6e1da', 'sueter#1e3a5f', 'pantalon#3e4248', 'botas#3b2a22', '', 'brazos_cruzados'],
  lirios_belen: ['ella', 3, '#3b2a22', 'pelo_trenzas', 'sombrero_paja#e8c77a', '', 'blusa#e4f0f7#2f6fa8', 'falda#2f6fa8', 'sandalias#a8774f', 'mochila#c9a46a', 'frotar_manos_a'],
  lirios_teo: ['el', 1, '#3b2a22', 'pelo_rizos', 'gorra#f6cf5a#2f5fa8', '', 'chaqueta#f6cf5a', 'bermuda#2f5fa8', 'botas_lluvia#2f5fa8', 'carriel#6b4632', 'reloj'],
  lirios_dalia: ['ella', 2, '#5a3a28', 'pelo_ondas', 'sombrero_paja#d9c38a', '', 'camisa#9fcb6a', 'overol#5f7a8a', 'botas_lluvia#5f8a4a', '', 'inclinado'],
  lirios_tina: ['ella', 1, '#4a3226', 'pelo_colitas', 'sombrero_pescador#f6cf5a', '', 'camiseta_rayas#e4566b#ffffff', 'short#2f5fa8', 'botas_lluvia#f6cf5a', '', 'reposo', 0.55],

  // Brumaverde: bosque de niebla, musgo, lana gruesa y botas de barro
  bruma_silvana: ['ella', 0, '#c9c3ba', 'pelo_mono', 'sombrero_vaquero#6b5a3a', '', 'chaleco#5f7a45', 'pantalon#6b5a3a', 'botas#3b2a22', 'mochila#7a6a4a', 'brazos_cruzados'],
  bruma_felix: ['el', 4, '#7a4a2a', 'pelo_rizos', 'gorro_lana#8a5a3c', 'gafas_redondas#3d2b27', 'delantal#c9b38a#5a3a28', 'pantalon#4e6a45', 'botas#5a3a28', '', 'pensando_b'],
  bruma_amira: ['ella', 3, '#2b2422', 'pelo_mono_bajo', 'sombrero_paja#f3ead8', '', 'blusa#f6cf5a#ffffff', 'falda_larga#8a7a4a', 'botas#6b4a33', '', 'reposo'],
  bruma_roque: ['el', 2, '#3b2a22', 'pelo_copete', 'panoleta#6b8a5a#f2e2c4', 'bigote#3b2a22', 'camisa_cuadros#4e7a45#f6efe2', 'overol#6b5a3a', 'botas#3b2a22', '', 'jarras'],
  bruma_elio: ['el', 1, '#a45a2a', 'pelo_lado', 'sombrero_vaquero#a8774f', '', 'chaleco#9fcb6a', 'pantalon#7a6a4a', 'botas#6b4a33', 'carriel#7a5134', 'reposo'],
  bruma_zaira: ['ella', 2, '#4a2a3a', 'pelo_trenzas', 'flor_pelo#c9a3e0', '', 'chaqueta#6b8a5a', 'falda_larga#5f4a6a', 'sandalias#a8774f', 'mochila#8a7a4a', 'frotar_manos_a'],
  bruma_ada: ['ella', 4, '#b0532f', 'pelo_cola', 'gorra#5f8a4a#f2e2c4', '', 'camiseta#9fcb6a', 'overol#6b5a3a', 'botas_lluvia#5f8a4a', '', 'senalar_a'],
  bruma_benicio: ['el', 3, '#e6e1da', 'pelo_calvo', 'boina#4e6a45', 'barba#e6e1da', 'ruana#6b8a5a#f2e2c4', 'pantalon#5a4a3a', 'zapatos#3b2a22', '', 'contar_a'],

  // Piedralumbre: la mina, cascos con lámpara, ocre, gris y cuero
  piedra_eloy: ['el', 1, '#5a5550', 'pelo_rapado', 'casco_minero#f0b323', 'bigote#5a5550', 'chaleco#e08a2a', 'pantalon#4a4f55', 'botas#3b2a22', '', 'brazos_cruzados'],
  piedra_ursula: ['ella', 0, '#3b2a22', 'pelo_corto', 'casco_minero#f6f2ea', 'gafas_redondas#7a625a', 'chaqueta#a8774f', 'pantalon#5a6670', 'botas#5a3a28', 'mochila#7a6a4a', 'pensando'],
  piedra_gonzalo: ['el', 3, '#9a948c', 'pelo_lado', 'gorro_lana#5a5a5a', 'barba#9a948c', 'delantal#5a4a3a#2b2422', 'pantalon#3e4248', 'botas#2b2422', '', 'reposo'],
  piedra_petra: ['ella', 2, '#2e2522', 'pelo_flequillo', 'diadema_mono#c9a3e0', 'gafas_redondas#c9a14a', 'blusa#e8dccb#8a6fb0', 'falda#5a6670', 'zapatos#5a3a28', '', 'contar_a'],
  piedra_santiago: ['el', 2, '#2b2422', 'pelo_copete', 'panoleta#7a2a2a#e8dccb', '', 'chaqueta_cuero#5a3a28', 'pantalon#3e4248', 'botas#2b2422', '', 'musculo'],
  piedra_mireya: ['ella', 1, '#6b3a22', 'pelo_cola', 'gorra#e08a2a#3e4248', '', 'camiseta#e08a2a', 'overol#4a5a6a', 'botas#3b2a22', 'mochila#5a6670', 'jarras'],
  piedra_hugo: ['el', 0, '#7a4a2a', 'pelo_rizos', 'casco_minero#e4574b', 'gafas_redondas#3d2b27', 'chaqueta#f0b323', 'pantalon#4a4f55', 'botas#3b2a22', '', 'reposo'],
  piedra_ciro: ['el', 3, '#2b2422', 'pelo_rapado', 'gorro_chef#f6f2ea', 'bigote#2b2422', 'delantal#f6f2ea#a8774f', 'pantalon#5a4a3a', 'zapatos#2b2422', '', 'frotar_manos_a'],

  // Brasaviva: volcán, terracota, pañoletas y delantales de horno
  brasa_tarek: ['el', 3, '#1f1a18', 'pelo_rizos', 'sombrero_vaquero#8a3a2a', 'barba#1f1a18', 'camisa#e8dccb', 'pantalon#6b3a2a', 'botas_vaqueras#5a2a1a', '', 'jarras'],
  brasa_sol: ['ella', 2, '#2b2422', 'pelo_mono', 'panoleta#e4574b#f6cf5a', '', 'delantal#d9855a#6b3a2a', 'falda#8a3a2a', 'sandalias#a8774f', '', 'presumir_a'],
  brasa_nadia: ['ella', 1, '#5a2a1a', 'pelo_ondas', 'sombrero_vueltiao#f3ead8#2b2422', '', 'blusa#f6cf5a#e4574b', 'pantalon#8a5a3c', 'botas#6b3a2a', '', 'reposo'],
  brasa_ramiro: ['el', 2, '#4a3226', 'pelo_lado', '', 'gafas_sol#2b2422', 'delantal#5a4a3a#e4574b', 'pantalon#3e4248', 'botas#3b2a22', '', 'pensando'],
  brasa_idalia: ['ella', 3, '#2b2422', 'pelo_trenzas', 'capucha_dragon#c4553f', '', 'chaqueta_cuero#8a3a2a', 'pantalon#5a3a28', 'botas#3b2a22', 'capa#6b2a22', 'brazos_cruzados'],
  brasa_dante: ['el', 1, '#3b2a22', 'pelo_copete', 'gorra#e4574b#2b2422', 'gafas_sol#2b2422', 'chaleco#8a5a3c', 'short#5a3a28', 'botas#3b2a22', 'mochila#c4553f', 'senalar_a'],
  brasa_rufina: ['ella', 3, '#d8d2ca', 'pelo_mono_bajo', 'flor_pelo#f4a7b9', '', 'vestido#e4574b#f6cf5a', '', 'sandalias#a8774f', '', 'frotar_manos_a'],
  brasa_yago: ['el', 2, '#2b2422', 'pelo_rizos', 'gorra#f6cf5a#e4574b', '', 'camiseta#e4574b', 'short#5a3a28', 'tenis#ffffff', '', 'reposo', 0.6],

  // Nieveclara: lana clara, gorros de lana, ruanas y botas
  nieve_eira: ['ella', 4, '#e8d8b0', 'pelo_trenzas', 'gorro_lana#9ccbef', '', 'sueter#f6f2ea', 'pantalon#6b8aa8', 'botas#7a5134', '', 'reposo'],
  nieve_anselmo: ['el', 0, '#f2efe8', 'pelo_calvo', 'gorro_lana#8a5a3c', 'barba#f2efe8', 'ruana#c9d6e3#4f79a8', 'pantalon#6b6458', 'botas#5a3a28', '', 'pensando'],
  nieve_luz: ['ella', 1, '#f0d48a', 'pelo_colitas', 'gorro_lana#f6cf5a', '', 'chaqueta#f9e6a8', 'falda#9ccbef', 'botas#c9b38a', '', 'risita_a'],
  nieve_quirina: ['ella', 2, '#3b2a22', 'pelo_cola', 'sombrero_pescador#c9d6e3', '', 'chaqueta#2f6fa8', 'pantalon#3e4248', 'botas_lluvia#c9d6e3', '', 'brazos_cruzados'],
  nieve_severo: ['el', 4, '#bdb6ac', 'pelo_lado', 'boina#4f79a8', 'gafas_redondas#3d2b27', 'saco_corbata#6b7a8a#c4553f', 'pantalon#4a4f55', 'zapatos#3b2a22', '', 'senalar_arriba'],
  nieve_milena: ['ella', 0, '#2e2522', 'pelo_mono', 'gorro_lana#9fcbd6', 'gafas_redondas#5a6670', 'sueter#cde3e8', 'falda_larga#5f7a8a', 'botas#6b4a33', '', 'brazos_cruzados'],
  nieve_otto: ['el', 1, '#a45a2a', 'pelo_copete', 'gorro_lana#e4574b', 'barba#a45a2a', 'chaqueta#e4574b', 'pantalon#3e4248', 'botas#3b2a22', 'mochila#e08a2a', 'jarras'],
  nieve_celeste: ['ella', 4, '#c9b6ea', 'pelo_ondas', 'capucha_oveja#ffffff', '', 'sueter#e8f0fa', 'falda#9ccbef', 'botas#e8e2da', 'alas_angel#ffffff', 'reposo'],

  // Vigilia: frontera, cuero, vino oscuro y capas
  vigilia_aldan: ['el', 2, '#3b2a22', 'pelo_rapado', '', 'barba#3b2a22', 'chaqueta_cuero#5a2a2a', 'pantalon#3a2f2a', 'botas#2b2422', 'capa#6b2a32', 'brazos_cruzados'],
  vigilia_noemi: ['ella', 1, '#2b2422', 'pelo_mono', '', 'gafas_redondas#5a2a2a', 'bata_medico#f7f5ef', 'pantalon#7d6a6a', 'zapatos#5a3a28', '', 'pensando'],
  vigilia_ulises: ['el', 0, '#6b4a2a', 'pelo_lado', 'sombrero_vaquero#7a5a3a', 'gafas_redondas#3d2b27', 'chaleco#a78b6d', 'pantalon#5a4a3a', 'botas#3b2a22', 'carriel#6b4632', 'contar_a'],
  vigilia_kael: ['el', 4, '#1f1d2e', 'pelo_largo_el', '', 'gafas_estrella#c9b6ea', 'chaqueta#3a3256', 'pantalon#2c2a3e', 'botas#2c2a3e', 'capa#5d4f8a', 'senalar_arriba'],
  vigilia_azucena: ['ella', 3, '#5a2a1a', 'pelo_trenzas', 'sombrero_vaquero#a78b6d', '', 'chaqueta_cuero#7a4a2a', 'pantalon#5a3a28', 'botas_vaqueras#3b2a22', 'alas_dragon#a78b6d', 'jarras'],
  vigilia_telmo: ['el', 1, '#4a3226', 'pelo_rizos', 'gorra#6b2a32#e8dccb', '', 'saco_corbatin#a78b7d#6b2a32', 'pantalon#3a2f2a', 'zapatos#2b2422', 'carriel#6b4632', 'reloj'],

  // Rosal Eterno (Verdia): las almas cuidadoras, en pastel y con flores
  verdia_amaranta: ['ella', 0, '#e6d8e0', 'pelo_mono_bajo', 'sombrero_paja#f4d7e2', '', 'vestido#f4b6c2#ffffff', '', 'sandalias#e8c77a', '', 'reposo'],
  verdia_nilo: ['el', 2, '#bdb6ac', 'pelo_lado', 'sombrero_paja#e8dccb', '', 'chaleco#a8cda0', 'pantalon#c9d6c4', 'sandalias#a8774f', 'mochila#a8cda0', 'reverencia'],
  verdia_isadora: ['ella', 3, '#3b2a22', 'pelo_rizado', 'flor_pelo#ffffff', '', 'vestido_puntos#a8cda0#ffffff', '', 'sandalias#a8774f', '', 'pensando'],
  verdia_berenice: ['ella', 4, '#d8d2ca', 'pelo_mono', '', 'gafas_redondas#a8774f', 'sueter#e8dcf0', 'falda_larga#b8a5cc', 'zapatos#7a625a', '', 'contar_a'],
  verdia_lucio: ['el', 1, '#9a948c', 'pelo_calvo', 'gorro_chef#ffffff', 'bigote#9a948c', 'delantal#f6f2ea#a8cda0', 'pantalon#9a8a7a', 'zapatos#6b4a33', '', 'frotar_manos_a'],
  verdia_sarai: ['ella', 2, '#4a2a3a', 'pelo_flequillo', 'boina#f4a7b9', '', 'blusa#ffffff#f4a7b9', 'overol#c9a3e0', 'tenis#ffffff', '', 'presumir_a'],
  verdia_eneas: ['el', 0, '#f2efe8', 'pelo_calvo', '', 'barba#f2efe8', 'sueter#d9e8d0', 'pantalon#a8a090', 'pantuflas_oso#c9b38a', '', 'reposo'],
  verdia_yara: ['ella', 5, '#2b2422', 'pelo_afro', 'flor_pelo#f7d55a', '', 'vestido_princesa#f9e0b8#ffffff', '', 'sandalias#e8c77a', '', 'beso_volado_a'],
  verdia_tobias: ['el', 3, '#9a948c', 'pelo_lado', 'sombrero_pescador#d9e8d0', 'bigote#9a948c', 'chaleco#a8cda0', 'bermuda#8fb7c9', 'sandalias#a8774f', '', 'pensando'],
  verdia_celino: ['el', 1, '#5a3a28', 'pelo_copete', 'panoleta#a8cda0#ffffff', '', 'camisa_cuadros#c9e0b8#ffffff', 'overol#b8a58a', 'botas#7a5134', '', 'jarras'],
  verdia_aina: ['ella', 1, '#f2efe8', 'pelo_mono', 'flor_pelo#c9a3e0', 'gafas_redondas#c9a14a', 'ruana#e8dcf0#f4b6c2', 'falda_larga#a8a0b8', 'zapatos#7a625a', '', 'reposo'],
  verdia_dimas: ['el', 2, '#3b2a22', 'pelo_rizos', 'sombrero_paja#e8dccb', '', 'chaleco#c9b38a', 'pantalon#a8cda0', 'sandalias#a8774f', 'carriel#a8774f', 'contar_a'],

  // Jardines del Eco (Verdia): coro, velas y semillas sagradas
  eco_sora: ['ella', 0, '#2e2522', 'pelo_corto', 'tiara#f6e2a8', '', 'vestido#e8dcf0#ffffff', '', 'zapatos#c9a3e0', '', 'senalar_arriba'],
  eco_esteban: ['el', 1, '#f2efe8', 'pelo_calvo', '', 'gafas_redondas#7a625a', 'saco_corbatin#c9b6a0#a8cda0', 'pantalon#8a7a6a', 'zapatos#5a3a28', '', 'pensando'],
  eco_violeta: ['ella', 2, '#8a8580', 'pelo_ondas', 'capucha_unicornio#f6f2ea', '', 'blusa#e8dcf0#c9a3e0', 'falda_larga#c9a3e0', 'botas#a8774f', '', 'reposo'],
  eco_nazario: ['el', 3, '#d8d2ca', 'pelo_lado', 'sombrero_paja#d9c38a', 'barba#d8d2ca', 'ruana#a8cda0#f6f2ea', 'pantalon#8a7a5a', 'sandalias#a8774f', '', 'brazos_cruzados'],
  eco_basilia: ['ella', 1, '#f2efe8', 'pelo_mono_bajo', 'panoleta#f6e2a8#c9a3e0', '', 'delantal#f9efe0#c9a3e0', 'falda_larga#b8a5cc', 'zapatos#7a625a', '', 'frotar_manos_a'],
  eco_oriel: ['el', 4, '#c98a4a', 'pelo_rizos', 'flor_pelo#f4a7b9', '', 'sueter_corazones#f4d7e2', 'pantalon#b8a5cc', 'tenis#ffffff', '', 'risita_a'],

  // La Travesía (Senda): viajeros, guías y almas en purificación, en lila y gris pluma
  senda_iria: ['ella', 2, '#3b2a22', 'pelo_cola', 'sombrero_vaquero#8a7aa8', '', 'chaleco#b8a5cc', 'pantalon#5a4f6a', 'botas#3b2a22', 'mochila#8a7aa8', 'senalar_a'],
  senda_mateo: ['el', 1, '#4a3226', 'pelo_lado', 'panoleta#5d4f8a#e8dccb', 'barba#4a3226', 'camisa_cuadros#8a7aa8#f6efe2', 'overol#5a4f6a', 'botas#3b2a22', '', 'jarras'],
  senda_nora: ['ella', 0, '#1f1d2e', 'pelo_flequillo', '', 'gafas_redondas#5d4f8a', 'saco_corbata#b8a5cc#5d4f8a', 'falda#5a4f6a', 'zapatos#3a2f4a', '', 'contar_a'],
  senda_fabian: ['el', 2, '#2b2422', 'pelo_rapado', 'gorra#8a7aa8#e8dccb', '', 'chaleco#9a8a6a', 'pantalon#5a4f6a', 'botas#3b2a22', 'mochila#7a6a4a', 'brazos_cruzados'],
  senda_leire: ['ella', 4, '#a45a2a', 'pelo_ondas', 'flor_pelo#c9a3e0', '', 'sueter#e8dcf0', 'falda_larga#8a7aa8', 'zapatos#6b4a33', '', 'frotar_manos_a'],
  senda_anwar: ['el', 3, '#2b2422', 'pelo_largo_el', '', 'barba#2b2422', 'ruana#5d4f8a#c9b6ea', 'pantalon#3a2f4a', 'sandalias#7a5134', '', 'reverencia'],
  senda_ofelia: ['ella', 1, '#5a3a28', 'pelo_mono', 'panoleta#c9b6ea#ffffff', '', 'camisa#e8dcf0', 'overol#a8a0b8', 'botas#8a7a6a', 'capa#c9b6ea', 'triste'],
  senda_pablo: ['el', 0, '#7a6a5a', 'pelo_lado', '', '', 'sueter#c9c3d6', 'pantalon#8a8098', 'zapatos#5a4f6a', 'capa#b8a5cc', 'pensando_b'],

  // Refugio de los Hilos (Senda): anclas, cuerdas y rutas verdaderas
  hilos_tecla: ['ella', 0, '#2e2522', 'pelo_corto', '', 'gafas_redondas#3a2f4a', 'chaqueta#5d4f8a', 'pantalon#3a2f4a', 'botas#2c2a3e', 'mochila#5d4f8a', 'pensando'],
  hilos_hector: ['el', 2, '#3b2a22', 'pelo_copete', 'panoleta#3a2f5c#c9b6ea', 'bigote#3b2a22', 'delantal#7a6a8a#3a2f4a', 'pantalon#3e4248', 'botas#2b2422', '', 'frotar_manos_a'],
  hilos_asha: ['ella', 3, '#1f1a18', 'pelo_trenzas', 'gorro_lana#c9a3e0', '', 'chaleco#8a7aa8', 'pantalon#3a2f4a', 'botas#3b2a22', 'mochila#c9a3e0', 'jarras'],
  hilos_elian: ['el', 4, '#6b5a4a', 'pelo_rizos', '', '', 'sueter#b8b2c8', 'pantalon#8a8098', 'tenis#e8e2f0', 'capa#d6d0e4', 'encogerse'],

  // Bastión del Velo (Nox): contención, azul de noche y acero
  nox_dorian: ['el', 1, '#2b2422', 'pelo_rapado', '', 'barba#2b2422', 'chaqueta_cuero#2c3566', 'pantalon#1e2236', 'botas#1e1d1d', 'capa#3a3f6b', 'brazos_cruzados'],
  nox_salma: ['ella', 3, '#2b2422', 'pelo_mono', 'panoleta#7d82a7#ffffff', '', 'bata_medico#e8ecf5', 'pantalon#5a5f80', 'zapatos#2c2a3e', '', 'reposo'],
  nox_viggo: ['el', 0, '#c9a46a', 'pelo_colita', '', 'gafas_redondas#5a6670', 'delantal#4a5070#2c3566', 'pantalon#2c2a3e', 'botas#1e1d1d', '', 'pensando'],
  nox_mirta: ['ella', 1, '#5a3a28', 'pelo_mono_bajo', '', 'gafas_redondas#2c3566', 'saco_corbata#5a5f80#c9b6ea', 'falda#2c3566', 'zapatos#1e1d1d', '', 'contar_a'],
  nox_inigo: ['el', 2, '#3b2a22', 'pelo_lado', 'gorro_lana#2c3566', '', 'chaqueta#3a3f6b', 'pantalon#1e2236', 'botas#1e1d1d', 'capa#2c3566', 'jarras'],
  nox_tamara: ['ella', 4, '#e8d8b0', 'pelo_cola', 'gorra#7d82a7#f6cf5a', '', 'chaqueta#f6cf5a', 'pantalon#2c3566', 'botas#1e1d1d', 'mochila#7d82a7', 'reloj'],

  // Estación Celia: la órbita, trajes blancos y turquesa
  orbita_helena: ['ella', 1, '#3b2a22', 'pelo_mono', '', '', 'traje_astronauta#f2f4f7#2f8f9a', 'pantalon#e8ecf2', 'botas#5a6670', '', 'brazos_cruzados'],
  orbita_dexo: ['el', 2, '#2b2422', 'pelo_copete', 'gorra#2f8f9a#ffffff', 'gafas_sol#2b2422', 'chaqueta_cuero#6b4a33', 'pantalon#4a5a6a', 'botas#2b2422', '', 'pulgares_a'],
  orbita_tessa: ['ella', 0, '#b0532f', 'pelo_colitas', '', 'gafas_redondas#2f8f9a', 'bata_medico#f2f4f7', 'jogger#5a7a8a', 'tenis#ffffff', '', 'pensando'],
  orbita_boris: ['el', 0, '#bdb6ac', 'pelo_calvo', '', 'bigote#bdb6ac', 'traje_astronauta#e8ecf2#e08a2a', 'pantalon#e8ecf2', 'botas#5a6670', '', 'jarras'],
  orbita_valentina: ['ella', 2, '#2e2522', 'pelo_cola', 'gorra#7fae55#ffffff', '', 'camiseta#8db9ca', 'overol#7fae55', 'tenis#ffffff', '', 'reposo'],
  orbita_ivo: ['el', 4, '#1f1d2e', 'pelo_rizos', '', 'gafas_redondas#3d2b27', 'buzo#8db9ca', 'jogger#4a5a6a', 'tenis#ffffff', 'mochila#2f8f9a', 'senalar_arriba'],
  orbita_said: ['el', 3, '#2b2422', 'pelo_lado', '', 'barba#2b2422', 'bata_medico#f2f4f7', 'pantalon#5a7a8a', 'zapatos#2b2422', '', 'reposo'],
  orbita_rita: ['ella', 1, '#6b3a22', 'pelo_flequillo', 'gorra#e08a2a#2f8f9a', '', 'chaleco#e08a2a', 'pantalon#4a5a6a', 'botas#3b2a22', '', 'contar_a'],

  // Huerto Aurelia: cúpulas solares, dorados y verdes de invernadero
  aurelia_aitana: ['ella', 1, '#5a3a28', 'pelo_ondas', 'sombrero_paja#f6cf5a', 'gafas_sol#c9a14a', 'blusa#f9e6a8#7fae55', 'overol#7fae55', 'botas_lluvia#f6cf5a', '', 'presumir_a'],
  aurelia_oscar: ['el', 2, '#3b2a22', 'pelo_rapado', 'casco_minero#f6cf5a', 'bigote#3b2a22', 'traje_astronauta#f2f4f7#f6cf5a', 'pantalon#e8ecf2', 'botas#5a6670', '', 'jarras'],
  aurelia_kiara: ['ella', 3, '#2b2422', 'pelo_rizado', 'antenas_abeja#2b2422', '', 'camiseta#f6cf5a', 'falda#7fae55', 'tenis#ffffff', 'alas_abeja#ffffff', 'risita_a'],
  aurelia_saul: ['el', 1, '#7a4a2a', 'pelo_lado', 'gorro_chef#ffffff', '', 'chaqueta_chef#ffffff#f6cf5a', 'pantalon#5a4a3a', 'zapatos#2b2422', '', 'frotar_manos_a'],

  // Vigía Nocturna: noche, plata y estrellas
  nocturna_matea: ['ella', 2, '#1f1d2e', 'pelo_cola', 'gorro_lana#2c3566', 'gafas_estrella#c9d6e3', 'chaqueta#2c3566', 'pantalon#1e2236', 'botas#2c2a3e', 'capa#1e2550', 'senalar_arriba'],
  nocturna_elvira: ['ella', 0, '#3a2f4a', 'pelo_trenzas', 'orejas_conejo#e8e2f0', '', 'sueter#5d4f8a', 'falda_larga#2c3566', 'botas#2c2a3e', '', 'reposo'],
  nocturna_gaspar: ['el', 1, '#c9c3ba', 'pelo_lado', 'sombrero_copa#2c2a3e', 'gafas_redondas#c9d6e3', 'saco_corbatin#3a3f6b#c9d6e3', 'pantalon#1e2236', 'zapatos#1e1d1d', '', 'contar_a'],
  nocturna_naim: ['el', 3, '#1f1a18', 'pelo_rizos', '', '', 'ruana#2c3566#c9b6ea', 'pantalon#3a3256', 'botas#2c2a3e', 'carriel#5a4a6a', 'pensando'],

  // Cantera Esmeralda: la luna minera, verde esmeralda y gris luna
  esmeralda_olmo: ['el', 2, '#3b2a22', 'pelo_copete', 'casco_minero#2f8f68', 'barba#3b2a22', 'traje_astronauta#e8ecf2#2f8f68', 'pantalon#e8ecf2', 'botas#5a6670', '', 'presumir_a'],
  esmeralda_indira: ['ella', 3, '#2b2422', 'pelo_mono', '', 'gafas_redondas#2f8f68', 'chaqueta#2f8f68', 'jogger#4a5a5a', 'botas#3b2a22', '', 'pensando'],
  esmeralda_duna: ['ella', 0, '#c98a4a', 'pelo_colitas', 'gorra#7fae55#f2e2c4', '', 'traje_astronauta#f2f4f7#7fae55', 'pantalon#e8ecf2', 'botas#7a8a6a', '', 'reposo'],
  esmeralda_raimundo: ['el', 1, '#bdb6ac', 'pelo_lado', 'casco_minero#e4574b', 'bigote#bdb6ac', 'chaleco#e08a2a', 'pantalon#4a5a5a', 'botas#3b2a22', '', 'reloj'],

  // Campamento de los Fragmentos: asteroides, cobre y chatarra
  fragmentos_axel: ['el', 0, '#e8d8b0', 'pelo_mohicano', '', '', 'traje_astronauta#e8ecf2#c4753f', 'pantalon#e8ecf2', 'botas#5a6670', '', 'musculo'],
  fragmentos_pia: ['ella', 2, '#3b2a22', 'pelo_corto', '', 'gafas_estrella#c9a3e0', 'chaqueta#c9a3e0', 'overol#5a6670', 'botas#3b2a22', 'mochila#c4753f', 'presumir_a'],
  fragmentos_lazaro: ['el', 3, '#5a5550', 'pelo_rapado', 'gorra#c4753f#3e4248', 'barba#5a5550', 'chaleco#7a5a3a', 'overol#5a5f66', 'botas#2b2422', 'mochila#7a6a4a', 'contar_a'],
  fragmentos_uma: ['ella', 1, '#2b2422', 'pelo_cola', '', '', 'traje_astronauta#f2f4f7#e4574b', 'pantalon#e8ecf2', 'botas#5a6670', '', 'jarras'],

  // Ambarina: planeta de arena, ámbar y titanio
  ambar_zora: ['ella', 3, '#2b2422', 'pelo_trenzas', 'panoleta#e0a050#f6f2ea', '', 'blusa#f3e0b8#c4753f', 'pantalon#a8774f', 'botas#6b4a33', '', 'brazos_cruzados'],
  ambar_nestor: ['el', 2, '#5a5550', 'pelo_calvo', '', 'gafas_sol#2b2422', 'delantal#7a5a3a#3e4248', 'pantalon#5a4a3a', 'botas#2b2422', '', 'jarras'],
  ambar_alina: ['ella', 1, '#a45a2a', 'pelo_ondas', 'sombrero_paja#e0a050', '', 'blusa#f6cf5a#a8774f', 'falda#c4753f', 'sandalias#a8774f', '', 'reposo'],
  ambar_baltasar: ['el', 3, '#2b2422', 'pelo_rizos', 'casco_minero#e0a050', 'barba#2b2422', 'traje_astronauta#f2e8d8#e0a050', 'pantalon#f2e8d8', 'botas#6b4a33', '', 'pulgares_a'],
  ambar_samira: ['ella', 5, '#1f1a18', 'pelo_afro', 'panoleta#c4753f#f6cf5a', 'gafas_sol#2b2422', 'chaqueta#e0a050', 'pantalon#7a5a3a', 'botas#5a3a28', '', 'senalar_a'],
  ambar_kenzo: ['el', 0, '#1f1d2e', 'pelo_lado', 'sombrero_vaquero#c9a46a', '', 'chaleco#c9a46a', 'bermuda#7a5a3a', 'botas#5a3a28', 'mochila#a8774f', 'pensando'],

  // Iridalia: bosque violeta y cristal que suena
  iris_calista: ['ella', 2, '#4a2a3a', 'pelo_mono', 'tiara#c9b6ea', '', 'vestido#8a6fb0#e8dcf0', '', 'zapatos#5d4f8a', 'capa#6b4f9a', 'reverencia'],
  iris_orin: ['el', 1, '#c98a4a', 'pelo_largo_el', 'boina#8a6fb0', '', 'camisa#e8dcf0', 'pantalon#5d4f8a', 'zapatos#3a2f4a', '', 'risita_a'],
  iris_liora: ['ella', 0, '#6b3a5a', 'pelo_rizado', 'flor_pelo#c9a3e0', '', 'blusa#e8dcf0#8a6fb0', 'overol#6b8a5a', 'botas#5a3a28', '', 'inclinado'],
  iris_edda: ['ella', 3, '#2b2422', 'pelo_cola', 'sombrero_vaquero#6b5a7a', 'gafas_redondas#5d4f8a', 'chaleco#8a7a6a', 'pantalon#4a4152', 'botas#3b2a22', 'mochila#6b5a7a', 'pensando'],
  iris_mauro: ['el', 2, '#3b2a22', 'pelo_copete', 'gorro_lana#6b4f9a', 'barba#3b2a22', 'chaqueta#4a3a6a', 'pantalon#3a2f4a', 'botas#2b2422', 'carriel#5a4a3a', 'senalar_a'],
  iris_yuna: ['ella', 4, '#1f1d2e', 'pelo_flequillo', 'flor_pelo#f4a7b9', '', 'sueter#c9b6ea', 'falda#6b8a5a', 'zapatos#5a3a28', 'mochila#8a6fb0', 'contar_a'],
};
