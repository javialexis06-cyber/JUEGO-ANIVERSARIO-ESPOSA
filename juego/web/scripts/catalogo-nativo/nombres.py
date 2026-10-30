"""Nombres en español (Colombia) de las plantas y zombis nativos de Gardendless (PvZ 2).

Se conservan los nombres ya usados en el Jardín para las 32 plantas existentes y las sustituciones aprobadas
(Pirata espadachín, Cabezaladrillo, Breakdancer, Flor de hielo). El resto traduce el nombre del almanaque nativo.
"""

PLANTAS = {
    'peashooter': 'Lanzaguisantes', 'sunflower': 'Girasol', 'wallnut': 'Nuez', 'cherry_bomb': 'Petacereza',
    'repeater': 'Repetidora', 'potatomine': 'Patatapum', 'snowpea': 'Hielaguisantes', 'chomper': 'Planta carnívora',
    'hypnoshroom': 'Hipnoseta', 'icebloom': 'Flor de hielo', 'cactus': 'Cactus', 'blover': 'Trébolador',
    'plantern': 'Planterna', 'puffshroom': 'Seta desesporada', 'sunshroom': 'Seta solar', 'fumeshroom': 'Humoseta',
    'gravebuster': 'Comepiedras', 'lilypad': 'Nenúfar', 'seashroom': 'Marseta', 'tanglekelp': 'Zampalga',
    'threepeater': 'Tripitidora', 'squash': 'Aplastaflor', 'tallnut': 'Nuez alta', 'splitpea': 'Bipetidora',
    'starfruit': 'Frustrella', 'pumpkin': 'Calabaza', 'torchwood': 'Plantorcha', 'spikeweed': 'Pinchohierba',
    'jalapeno': 'Jalapeño', 'magnetshroom': 'Magnetoseta', 'scaredyshroom': 'Seta miedica', 'doomshroom': 'Petaseta',
    'cabbagepult': 'Coltapulta', 'floawerPot': 'Maceta', 'kernelpult': 'Lanzamaíz', 'garlic': 'Ajo',
    'umbrellaleaf': 'Paraplanta', 'marigold': 'Margarita', 'melonpult': 'Melonpulta', 'wintermelon': 'Melón congelado',
    'twinsunflower': 'Girasol gemelo', 'gatling': 'Guisantralladora', 'spikerock': 'Pinchorroca', 'gloomshroom': 'Melancoseta',
    'glaciershroom': 'Seta congelada', 'imitater': 'Imitadora', 'megagatling': 'Mega guisantralladora',
    'inferno': 'Infierno', 'zoybeanpod': 'Vaina de zoyabean', 'goldbloom': 'Flor de oro',
    'shootingstarfruit': 'Frustrella fugaz', 'pinkstarfruit': 'Frustrella ángel', 'homingthistle': 'Cardo rastreador',
    'xshot': 'Rotobaga', 'primalpeashooter': 'Lanzaguisantes primigenio', 'slingpea': 'Honda de guisantes',
    'darkmatterdragonfruit': 'Pitahaya de materia oscura', 'asparagus': 'Espárrago a reacción',
    'firepeashooter': 'Lanzaguisantes de fuego', 'pvine': 'Guisantera', 'bonkchoy': 'Bok choy boxeador',
    'wasabiwhip': 'Látigo de wasabi', 'iceburg': 'Lechuga iceberg', 'bloomerang': 'Bumerflor', 'bambooshoot': 'Brote de bambú',
    'stickybombrice': 'Arroz bomba pegajoso', 'turkeypult': 'Pavopulta', 'bloominghearts': 'Corazón florido',
    'shrinkingviolet': 'Violeta encogedora', 'solarsage': 'Salvia solar', 'lychee': 'Lichi', 'atombomb': 'Granada atómica',
    'poisonpeashooter': 'Lanzaguisantes viscoso', 'snappea': 'Guisante mordedor', 'shadowpeashooter': 'Lanzaguisantes sombrío',
    'seashooter': 'Lanzaguisantes marino', 'shinevine': 'Enredadera brillante', 'primalsunflower': 'Girasol primigenio',
    'mirrornut': 'Nuez espejo', 'pineapple': 'Piñagirona', 'murkadamia': 'Nuez de macadamia sombría', 'dragonbruit': 'Dragonfruta',
    'moonflower': 'Flor lunar', 'grimrose': 'Rosa siniestra', 'nightshade': 'Belladona', 'dusklobber': 'Lanzador del ocaso',
    'lightningreed': 'Junco relámpago', 'witchhazel': 'Avellano de bruja', 'anthurium': 'Amperio', 'snowdrop': 'Campanilla de nieve',
    'meteorflower': 'Flor meteoro', 'springbean': 'Frijol saltarín', 'cantaloupe': 'Cantalupulta', 'iceweed': 'Hierba helada',
    'primalwallnut': 'Nuez primigenia', 'buttercup': 'Botón de oro', 'banana': 'Lanzaplátanos', 'bamboozle': 'Bambú engañoso',
    'gumnut': 'Nuez de goma', 'aloe': 'Aloe', 'hollyknight': 'Caballero de acebo', 'missiletoe': 'Muérdago misil',
    'loquat': 'Nisperonado', 'noctarine': 'Nectarina nocturna', 'reinforcemint': 'Menta refuerzo',
    'enlightenmint': 'Menta iluminada', 'wintermint': 'Menta invernal', 'spearmint': 'Menta punzante', 'armamint': 'Menta armada',
    'containmint': 'Menta contenedora', 'filamint': 'Menta eléctrica', 'appeasemint': 'Menta tiradora', 'bombardmint': 'Menta bombardera',
    'enforcemint': 'Menta luchadora', 'concealmint': 'Menta sombría', 'ailmint': 'Menta venenosa', 'enchantmint': 'Menta encantadora',
    'peppermint': 'Menta picante', 'cranjelly': 'Gelatina de arándano', 'chillypepper': 'Pimiento helado', 'perfumeshroom': 'Seta perfumada',
    'gloomvine': 'Enredadera melancólica', 'vamporcini': 'Vamporcini', 'primalpotatomine': 'Patatapum primigenio',
    'powerlily': 'Lirio de poder', 'firegourd': 'Calabacín de fuego', 'coconutcannon': 'Cañón de coco', 'peapod': 'Vaina de guisantes',
    'snapdragon': 'Boca de dragón', 'coldsnapdragon': 'Boca de dragón helada', 'chilibean': 'Frijol picante',
    'hurrikale': 'Huracol', 'stallia': 'Estalia', 'electricpeashooter': 'Lanzaguisantes eléctrico', 'magnifyinggrass': 'Hierba lupa',
    'celerystalker': 'Apio acechador', 'sapfling': 'Lanzasavia', 'parsnip': 'Chirivía', 'explodeonut': 'Nuez explosiva',
    'grapeshot': 'Uva metralla', 'bulbkekengi': 'Brillokengi', 'peach': 'Durazno celestial', 'jackolantern': 'Calabaza farolito',
    'pyrevine': 'Enredadera ígnea', 'dandelion': 'Diente de león', 'chardguard': 'Acelga guardiana', 'electriccurrant': 'Grosella eléctrica',
    'escaperoot': 'Raíz de escape', 'shadowshroom': 'Seta de sombra', 'turnip': 'Rábano resistente', 'empea': 'Durazno EMP',
    'citron': 'Cidra', 'laser_bean': 'Frijol láser', 'solartomato': 'Tomate solar', 'holonut': 'Nuez infinita', 'powerplant': 'Nabo de baldosa',
    'applemortar': 'Mortero de manzana', 'redstinger': 'Aguijón rojo', 'skyshooter': 'Lanzaguisantes aéreo', 'sunbean': 'Frijol solar',
    'moonbean': 'Frijol lunar', 'peanut': 'Manílanzador', 'bowlingbulb': 'Bulbo de bolos', 'guacodile': 'Guacodilo',
    'ghostpepper': 'Pimiento fantasma', 'sweetpotato': 'Batata', 'pepperpult': 'Pimientopulta', 'hotdate': 'Dátil ardiente',
    'hotpotato': 'Papa caliente', 'stunion': 'Cebolla aturdidora', 'goldleaf': 'Hoja dorada', 'akee': 'A.K.E.E.', 'endurian': 'Endurián',
    'toadstool': 'Hongo sapo', 'lavaguava': 'Guayaba de lava', 'phatbeet': 'Remolacha bajista', 'strawburst': 'Fresa estallido',
    'thymewarp': 'Tomillo del tiempo', 'peacommando': 'Guisante comando', 'caulipower': 'Coliflor psíquica',
    'electricblueberry': 'Arándano eléctrico', 'lotorpedo': 'Lotorpedo', 'sporeshroom': 'Seta de esporas',
    'blastberry': 'Enredadera de bayas explosivas', 'intensivecarrot': 'Zanahoria intensiva',
}

# Las que no se plantan como unidad (pociones, proyectiles de bolos, estados o colores de otras plantas).
EXCLUIDAS = {'empty', 'zombiepotion_speed', 'zombiepotion_toughness', 'zombiepotion_invisibility', 'tool_projectile_bowling_tallnut',
             'powerplant_alpha', 'powerplant_beta', 'powerplant_gamma', 'powerplant_delta', 'powerplant_epsilon',
             'marigold_red', 'marigold_orange', 'marigold_yellow', 'marigold_green', 'marigold_blue', 'marigold_pink', 'marigold_purple',
             'phatbeet_rhythm', 'dragonbabybruit'}

# Nombres de zombis por patrón de mundo; los que no siguen el patrón van en ZOMBIS.
MUNDOS_ZOMBI = {
    'tutorial': ('Zombi', ''), 'mummy': ('Momia', ''), 'pirate': ('Zombi pirata', ''), 'cowboy': ('Zombi vaquero', ''),
    'kongfu': ('Zombi de kung-fu', ''), 'monk': ('Zombi monje', ''), 'abbot': ('Zombi abad', ''), 'future': ('Zombi del futuro', ''),
    'dark': ('Zombi campesino', ''), 'beach': ('Zombi copetón', ''), 'beach_fem': ('Zombi en bikini', ''), 'iceage': ('Zombi cavernícola', ''),
    'lostcity': ('Zombi aventurero', ''), 'sky': ('Zombi piloto', ''), 'eighties': ('Zombi neón', ''), 'dino': ('Zombi jurásico', ''),
}
SUFIJOS = {'': '', '_armor1': ' con cono', '_armor2': ' con cubeta', '_armor3': ' blindado', '_flag': ' abanderado', '_flag_veteran': ' de reunión'}

ZOMBIS = {
    'tutorial': 'Zombi', 'tutorial_armor1': 'Caracono', 'tutorial_armor2': 'Caracubo', 'tutorial_armor4': 'Cabezaladrillo',
    'tutorial_flag': 'Zombi abanderado', 'tutorial_flag_veteran': 'Zombi de reunión', 'tutorial_imp': 'Diablillo',
    'tutorial_gargantuar': 'Gargantúa', 'supernova_gargantuar': 'Gargantúa supernova', 'duckytube': 'Zombi flotador',
    'vase_gargantuar': 'Gargantúa de jarrón', 'bobsled_team': 'Equipo de trineo', 'bobsled': 'Zombi del trineo',
    'modern_balloon': 'Zombi globo', 'newspaper_veteran': 'Zombi de edición dominical', 'modern_allstar': 'Zombi futbolista',
    'modern_superfanimp': 'Diablillo superfán', 'zomboni': 'Zomboni', 'catapult': 'Zombi catapulta',
    'mummy_armor4': 'Momia cabeza de pirámide', 'ra': 'Zombi Ra', 'camel_onehump': 'Zombis camello', 'explorer': 'Zombi explorador',
    'explorer_veteran': 'Zombi con linterna', 'tomb_raiser': 'Zombi levantatumbas', 'pharaoh': 'Zombi faraón',
    'egypt_imp': 'Diablillo momia', 'egypt_gargantuar': 'Gargantúa momificado', 'zombossmech_egypt': 'Zombot esfinge',
    'pirate_armor4': 'Pirata cabeza de barril', 'swashbuckler': 'Pirata espadachín', 'seagull': 'Zombi gaviota',
    'pelican': 'Zombi pelícano', 'barrelroller': 'Zombi rodabarriles', 'cannon': 'Cañón de diablillos', 'pirate_captain': 'Capitán pirata',
    'pirate_captain_parrot': 'Loro zombi', 'pirate_imp': 'Diablillo pirata', 'pirate_gargantuar': 'Gargantúa pirata',
    'zombossmech_pirate': 'Zombot pasarela', 'cowboy_armor4': 'Vaquero cabeza de carreta', 'prospector': 'Zombi buscador de oro',
    'piano': 'Zombi pianista', 'poncho': 'Zombi con poncho', 'chicken_farmer': 'Zombi arreador de pollos', 'chicken': 'Pollo zombi',
    'west_bull': 'Toro mecánico', 'west_bull_veteran': 'Leyenda del rodeo', 'west_bullrider': 'Diablillo jinete de toro',
    'cowboy_gargantuar': 'Gargantúa del oeste', 'zombossmech_cowboy': 'Zombot carreta de guerra',
    'kongfu_armor2': 'Zombi de kung-fu con tetera', 'kongfu_armor4': 'Zombi de kung-fu con incensario', 'kongfu_hammer': 'Zombi del martillo',
    'kongfu_torch': 'Zombi expedicionario', 'abbot_torch': 'Abad de la antorcha', 'abbot_fan': 'Abad del abanico',
    'abbot_3section_staff': 'Abad del bastón de tres secciones', 'treasureyeti': 'Yeti del tesoro', 'abbot_chi': 'Abad del qigong',
    'kongfu_drink': 'Zombi bebedor', 'kongfu_bronze_strong': 'Bronce de la fuerza', 'kongfu_bronze_chi': 'Bronce del qigong',
    'kongfu_bronze_hook': 'Bronce del gancho', 'kongfu_boss_explode': 'Demonio de la dinamita', 'kongfu_boss_blade': 'Héroe de la espada',
    'kongfu_boss_chi': 'Maestro del qigong', 'monk_drink': 'Monje bebedor', 'monk_drink_veteran': 'Monje del cántaro',
    'kongfu_bomb': 'Zombi bomba', 'kongfu_gong': 'Zombi del gong', 'kongfu_chi': 'Zombi qigong', 'kongfu_rocket_imp': 'Diablillo cohete',
    'monk_imp': 'Diablillo monje', 'abbot_imp': 'Diablillo abad', 'monk_armor2': 'Monje con tetera', 'monk_armor4': 'Monje con incensario',
    'monk_blade': 'Monje de la espada', 'monk_nunchaku': 'Monje del nunchaku', 'monk_torch': 'Monje de la antorcha',
    'abbot_armor2': 'Abad con tetera', 'abbot_armor4': 'Abad con incensario', 'future_armor4': 'Zombi cabeza holográfica',
    'future_flag_veteran': 'Robo-zombi de reunión', 'future_jetpack': 'Zombi con mochila cohete', 'future_jetpack_disco': 'Zombi disco con mochila cohete',
    'future_jetpack_veteran': 'Zombi astronauta', 'future_protector': 'Zombi escudo de fuerza', 'mech_cone': 'Robo-caracono',
    'football_mech': 'Mecha-futbolista', 'disco_mech': 'Disco-trón 3000', 'future_imp': 'Diablillo bichobot',
    'future_gargantuar': 'Gargantúa prime', 'zombossmech_future': 'Zombot del mañana', 'dark_armor3': 'Zombi caballero',
    'dark_armor4': 'Zombi cabeza de torreta', 'dark_juggler': 'Zombi bufón', 'dark_wizard': 'Zombi hechicero',
    'dark_wizard_veteran': 'Gran encantador', 'dark_king': 'Rey zombi', 'dark_king_veteran': 'Rey Arturo zombi',
    'dark_imp_dragon': 'Diablillo dragón', 'dark_imp': 'Diablillo monje oscuro', 'dark_gargantuar': 'Gargantúa medieval',
    'zombossmech_dark': 'Zombot dragón oscuro', 'beach_armor4': 'Copetón cabeza de cangrejo', 'beach_fem_armor1': 'Bikini con cono',
    'beach_fem_armor2': 'Bikini con cubeta', 'beach_fem_armor4': 'Bikini cabeza de cangrejo', 'beach_snorkel': 'Zombi buceador',
    'beach_surfer': 'Zombi surfista', 'beach_surfer_veteran': 'Zombi surfista a motor', 'beach_octopus': 'Zombi pulpo',
    'sky_dronemaker': 'Ingeniero de drones', 'beach_fisherman': 'Zombi pescador', 'beach_imp': 'Diablillo sirena',
    'beach_gargantuar': 'Gargantúa de las profundidades', 'zombossmech_beach': 'Zombot submarino tiburón',
    'iceage_armor3': 'Zombi cabeza de hielo', 'iceage_armor4': 'Zombi cabeza de mamut', 'iceage_hunter': 'Zombi cazador',
    'iceage_hunter_veteran': 'Líder cazador', 'iceage_dodo': 'Zombi jinete de dodo', 'iceage_troglobite': 'Troglobita',
    'iceage_troglobite_veteran': 'Jefe troglobita', 'iceage_weaselhoarder': 'Acaparador de comadrejas', 'iceage_weasel': 'Comadreja helada',
    'iceage_imp': 'Diablillo yeti', 'iceage_gargantuar': 'Gargantúa perezoso', 'zombossmech_iceage': 'Zombot colmillos 10 000 a. C.',
    'lostcity_armor4': 'Aventurero cabeza de carpa', 'lostcity_lostpilot': 'Zombi piloto perdido', 'lostcity_lostpilot_veteran': 'Piloto de rescate',
    'lostcity_excavator': 'Zombi excavador', 'lostcity_jane': 'Zombi de la sombrilla', 'lostcity_bug': 'Zombi bicho',
    'lostcity_relichunter': 'Cazarreliquias', 'lostcity_impporter': 'Zombi porteador de diablillos', 'lostcity_crystalskull': 'Zombi calavera turquesa',
    'lostcity_imp': 'Diablillo de la ciudad perdida', 'lostcity_gargantuar': 'Gargantúa porteador', 'zombossmech_lostcity': 'Zombot góndola aerostática',
    'sky_electric': 'Zombi de la pistola de rayos', 'sky_imp': 'Diablillo paracaidista', 'sky_twin': 'Avión de doble cabina',
    'sky_arbiterx': 'Árbitro modelo X', 'sky_gargantuar': 'Gargantúa aerotransportado', 'zombossmech_sky': 'Zombot buitre de guerra',
    'sky_battleplane': 'Zombi avión de combate', 'eighties_armor4': 'Zombi neón con reflector', 'eighties_punk': 'Zombi punk',
    'eighties_punk_veteran': 'Punk zorrillo', 'eighties_skunk': 'Zorrillo zombi', 'eighties_glitter': 'Zombi brillantina',
    'eighties_mc': 'MC Zom-B', 'eighties_breakdancer': 'Breakdancer', 'eighties_arcade': 'Zombi de las maquinitas', 'eighties_8bit': 'Zombi de 8 bits',
    'eighties_boombox': 'Zombi de la grabadora', 'eighties_imp': 'Diablillo punk', 'eighties_gargantuar': 'Gargantúa metalero',
    'zombossmech_eighties': 'Zombot trituradora por etapas', 'dino_armor3': 'Zombi cabeza de fósil', 'dino_armor4': 'Zombi cabeza de ámbar',
    'dino_bully': 'Matón jurásico', 'dino_bully_veteran': 'Rompepiedras jurásico', 'dino_imp': 'Diablillo jurásico',
    'dino_gargantuar': 'Gargantúa jurásico', 'zombossmech_dino': 'Zombot dinotrónico',
}
EXCLUIDOS_ZOMBI = {'empty', 'newspaper'}


def nombre_zombi(i, en):
    if i in ZOMBIS:
        return ZOMBIS[i]
    for base in sorted(MUNDOS_ZOMBI, key=len, reverse=True):
        if i.startswith(base):
            resto = i[len(base):]
            if resto in SUFIJOS:
                return MUNDOS_ZOMBI[base][0] + SUFIJOS[resto]
    return en or i
