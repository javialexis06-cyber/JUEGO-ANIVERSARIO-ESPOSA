"""Recetas de Fusión (PvZ Fusión 4.0.x, nombres de pvzfusion.wiki.gg) llevadas a Gardendless.

Cada fusión se forma plantando la planta B sobre la A (o al revés) con las EvolutionRecipes nativas. El resultado es
una planta nativa existente cuando la hay, o un tipo nuevo «basado en» la planta nativa que mejor reúne el efecto de
sus padres (aporta la clase y el dibujo), con propiedades combinadas: proyectil, vida, ritmo o daño. Fusión es un
juego cerrado: sus mecánicas exactas no se pueden extraer, así que cada efecto es una aproximación con piezas
nativas y así se documenta.
"""

# Padres por nombre corto → tipo nativo de Gardendless.
P = {'lanza': 'peashooter', 'girasol': 'sunflower', 'cereza': 'cherry_bomb', 'nuez': 'wallnut', 'patata': 'potatomine',
     'carnivora': 'chomper', 'desespora': 'puffshroom', 'solar': 'sunshroom', 'humo': 'fumeshroom', 'hipno': 'hypnoshroom',
     'miedica': 'scaredyshroom', 'hielo': 'glaciershroom', 'peta': 'doomshroom', 'nenufar': 'lilypad', 'aplasta': 'squash',
     'tripi': 'threepeater', 'zampalga': 'tanglekelp', 'jalapeno': 'jalapeno', 'pincho': 'spikeweed', 'antorcha': 'torchwood',
     'alta': 'tallnut', 'marseta': 'seashroom', 'planterna': 'plantern', 'cactus': 'cactus', 'trebol': 'blover', 'estrella': 'starfruit',
     'calabaza': 'pumpkin', 'magneto': 'magnetshroom', 'col': 'cabbagepult', 'maiz': 'kernelpult', 'ajo': 'garlic',
     'paraguas': 'umbrellaleaf', 'margarita': 'marigold', 'melon': 'melonpult', 'repe': 'repeater', 'ametra': 'gatling',
     'hielaguis': 'snowpea'}


def tirador(base='peashooter', bala='pea', intervalo=None, vida=None, **extra):
    props = {'PeaType': bala, 'PeaTypePlantfood': bala, **extra}
    if intervalo:
        props.update(ShootInterval=intervalo, ShootIntervalAdditional=round(intervalo / 9, 2))
    if vida:
        props.update(Toughness=vida)
    return base, props


def muro(base='wallnut', vida=4000, **extra):
    return base, {'Toughness': vida, 'ArmorToughness': vida, **extra}


def lanzador(base='cabbagepult', bala='cabbage', **extra):
    return base, {'CabbageType': bala, 'CabbageTypePlantfood': bala, **extra}


def igual(nativa):
    """La fusión da exactamente una planta nativa existente."""
    return nativa, None


# (nombre en Fusión, nombre en español, padre A, padre B, (base nativa, propiedades o None))
FUSIONES = [
    # Día
    ('Repeater', 'Repetidora', 'lanza', 'lanza', igual('repeater')),
    ('Sunshooter', 'Lanzasoles', 'lanza', 'girasol', ('shinevine', {'ProduceSunValue': 25, 'AttackDamage': 20})),
    ('Twin Sunflower', 'Girasol gemelo', 'girasol', 'girasol', igual('twinsunflower')),
    ('Cherry-shooter', 'Cerezatiradora', 'lanza', 'cereza', tirador(bala='pea_mega', intervalo=1.8)),
    ('Sun Bomb', 'Bomba solar', 'girasol', 'cereza', ('cherry_bomb', {'Damage': 1800, 'SunCost': 150})),
    ('Peanut', 'Manílanzador', 'lanza', 'nuez', igual('peanut')),
    ('Sun-nut', 'Nuez solar', 'girasol', 'nuez', ('solartomato', {'Toughness': 4000})),
    ('Cherry-nut', 'Nuez cereza', 'cereza', 'nuez', igual('explodeonut')),
    ('Giant Wall-nut', 'Nuez gigante', 'nuez', 'nuez', muro('tallnut', 12000)),
    ('Potato-shooter', 'Patatiradora', 'lanza', 'patata', tirador(bala='peanut', intervalo=1.35)),
    ('Sun Mine', 'Mina solar', 'girasol', 'patata', ('sunbean', {'Toughness': 300, 'SunPerHitpoint': 0.4})),
    ('Cherry Mine', 'Mina cereza', 'cereza', 'patata', ('primalpotatomine', {'Damage': 3600, 'ChargeTime': 10})),
    ('Mine-nut', 'Nuez minada', 'nuez', 'patata', muro('explodeonut', 4000, Damage=1800)),
    ('Chomp-shooter', 'Tiradora carnívora', 'lanza', 'carnivora', ('snappea', {'Toughness': 400})),
    ('Sun Chomper', 'Carnívora solar', 'girasol', 'carnivora', ('chomper', {'ChewTimePerZombie': 12})),
    ('Cherry Chomper', 'Carnívora cereza', 'cereza', 'carnivora', ('chomper', {'ChewTimePerZombie': 6, 'ChompFailDamage': 400})),
    ('Chomp-nut', 'Nuez carnívora', 'nuez', 'carnivora', ('chomper', {'Toughness': 4000})),
    ('Chomp-mine', 'Mina carnívora', 'patata', 'carnivora', ('chomper', {'ChewTimePerZombie': 8, 'Toughness': 600})),
    # Noche
    ('Pea-shroom', 'Seta lanzaguisantes', 'lanza', 'desespora', tirador(bala='puffshroom_spore2', intervalo=1.2)),
    ('Sunny-shroom', 'Seta soleada', 'girasol', 'solar', ('sunshroom', {'SunValue': 50})),
    ('Cherry Pop', 'Cereza explosiva', 'cereza', 'desespora', ('cherry_bomb', {'Damage': 1200, 'SunCost': 75, 'Cooldown': 20})),
    ('Mini Nut-shroom', 'Seta nuez', 'nuez', 'desespora', muro('wallnut', 2000)),
    ('Mine-shroom', 'Seta minada', 'patata', 'desespora', ('potatomine', {'ChargeTime': 8, 'Damage': 1200})),
    ('Nibble-shroom', 'Seta mordelona', 'carnivora', 'desespora', ('chomper', {'ChewTimePerZombie': 10, 'Toughness': 200})),
    ('Fume-nut', 'Nuez humeante', 'nuez', 'humo', ('fumeshroom', {'Toughness': 4000})),
    ('Hypno Pea', 'Guisante hipnótico', 'lanza', 'hipno', tirador('peashooter', 'pea_shadow', 1.5)),
    ('Hypno-nut', 'Nuez hipnótica', 'nuez', 'hipno', ('hypnoshroom', {'Toughness': 4000})),
    ('Hypno Chomper', 'Carnívora hipnótica', 'carnivora', 'hipno', ('chomper', {'ChewTimePerZombie': 4})),
    ('Snow Pea', 'Hielaguisantes', 'lanza', 'hielo', igual('snowpea')),
    ('Frozen Cherry', 'Cereza congelada', 'cereza', 'hielo', ('glaciershroom', {'FreezeDamage': 600})),
    ('Frost-nut', 'Nuez escarchada', 'nuez', 'hielo', muro('chardguard', 4000)),
    ('Ice Mine', 'Mina helada', 'patata', 'hielo', igual('iceburg')),
    ('Ice Chomper', 'Carnívora helada', 'carnivora', 'hielo', ('chomper', {'ChewTimePerZombie': 12, 'ImmuneToIceblock': True})),
    ('Doom Pea', 'Guisante fatal', 'lanza', 'peta', tirador(bala='pea_mega', intervalo=2.4)),
    ('Doomflower', 'Flor fatal', 'girasol', 'peta', ('twinsunflower', {'SunValue': 150, 'ProduceInterval': 40})),
    ('Black Cherry', 'Cereza negra', 'cereza', 'peta', ('doomshroom', {'Damage': 3600})),
    ('Doom-nut', 'Nuez fatal', 'nuez', 'peta', muro('explodeonut', 6000, Damage=2700)),
    ('Doom Mine', 'Mina fatal', 'patata', 'peta', ('primalpotatomine', {'Damage': 5400, 'ChargeTime': 15})),
    ('Doom Chomper', 'Carnívora fatal', 'carnivora', 'peta', ('chomper', {'ChompFailDamage': 1800, 'ChewTimePerZombie': 20})),
    # Piscina
    ('Sunflower Pad', 'Nenúfar girasol', 'girasol', 'nenufar', ('sunflower', {'Toughness': 600})),
    ('Nut Pad', 'Nenúfar nuez', 'nuez', 'nenufar', muro('wallnut', 5000)),
    ('Pea Squash', 'Aplastaflor tiradora', 'lanza', 'aplasta', ('squash', {'SmashDamage': 2400})),
    ('Cherry Squash', 'Aplastaflor cereza', 'cereza', 'aplasta', ('squash', {'SmashDamage': 3600})),
    ('Squash-nut', 'Nuez aplastadora', 'nuez', 'aplasta', ('squash', {'Toughness': 4000})),
    ('Potato Masher', 'Pisapapas', 'patata', 'aplasta', ('squash', {'SmashDamage': 2700, 'SmashTime': 0.6})),
    ('Jawbreaker', 'Rompemandíbulas', 'carnivora', 'aplasta', ('squash', {'SmashDamage': 3000})),
    ('Icy Squash', 'Aplastaflor helada', 'hielo', 'aplasta', ('squash', {'SmashDamage': 2400, 'ImmuneToIceblock': True})),
    ('Doom Squash', 'Aplastaflor fatal', 'peta', 'aplasta', ('squash', {'SmashDamage': 5400})),
    ('Multipeater', 'Multitiradora', 'lanza', 'tripi', tirador('threepeater', 'pea', 1.0)),
    ('Cherry-spreader', 'Tripitidora cereza', 'cereza', 'tripi', tirador('threepeater', 'pea_mega', 1.8)),
    ('Three-nuts', 'Tres nueces', 'nuez', 'tripi', tirador('threepeater', 'peanut', 1.35, vida=4000)),
    ('Fume Spreader', 'Tripitidora humeante', 'humo', 'tripi', tirador('threepeater', 'pea_goo', 1.35)),
    ('Doom-spreader', 'Tripitidora fatal', 'peta', 'tripi', tirador('threepeater', 'pea_mega', 2.4)),
    ('Tangle-nut', 'Nuez enredada', 'nuez', 'zampalga', muro('wallnut', 5000)),
    ('Doom Kelp', 'Zampalga fatal', 'peta', 'zampalga', ('tanglekelp', {'MaxDraggedZombieCount': 3})),
    ('Blaze Pea', 'Guisante llameante', 'lanza', 'jalapeno', igual('firepeashooter')),
    ('Sun Pepper', 'Pimiento solar', 'girasol', 'jalapeno', ('jalapeno', {'Damage': 1200, 'SunCost': 75})),
    ('Pepper Popper', 'Petapimiento', 'cereza', 'jalapeno', ('jalapeno', {'Damage': 3600})),
    ('Flame-nut', 'Nuez llameante', 'nuez', 'jalapeno', muro('hotdate', 4000)),
    ('Jalapeno Mine', 'Mina jalapeño', 'patata', 'jalapeno', ('primalpotatomine', {'Damage': 2700})),
    ('Doom Pepper', 'Pimiento fatal', 'peta', 'jalapeno', ('jalapeno', {'Damage': 5400, 'Duration': 8})),
    ('Scorched Threepeater', 'Tripitidora chamuscada', 'tripi', 'jalapeno', tirador('threepeater', 'pea_flame_yellow', 1.35)),
    ('Sunweed', 'Pinchohierba solar', 'girasol', 'pincho', ('spikeweed', {'Damage': 15})),
    ('Spike-nut', 'Nuez espinosa', 'nuez', 'pincho', muro('spikerock', 4000)),
    ('Iceweed', 'Hierba helada', 'hielo', 'pincho', igual('iceweed')),
    ('Spike-spreader', 'Tripitidora espinosa', 'tripi', 'pincho', tirador('threepeater', 'cactus', 1.35)),
    ('Scorchweed', 'Hierba ardiente', 'jalapeno', 'pincho', ('spikerock', {'Damage': 40})),
    ('Torchflower', 'Girasol antorcha', 'girasol', 'antorcha', ('torchwood', {'Toughness': 2500})),
    ('Nutwood', 'Nuez antorcha', 'nuez', 'antorcha', ('torchwood', {'Toughness': 6000})),
    ('Icewood', 'Antorcha helada', 'hielo', 'antorcha', ('torchwood', {'ImmuneToIceblock': True})),
    ('Doomwood', 'Antorcha fatal', 'peta', 'antorcha', ('torchwood', {'DamageScale': 3, 'DeathDamage': 1800})),
    ('Torchthree', 'Tripitidora antorcha', 'tripi', 'antorcha', tirador('threepeater', 'pea_flame_yellow', 1.2)),
    # Niebla
    ('Sea-nut', 'Nuez marina', 'nuez', 'marseta', muro('wallnut', 3000)),
    ('Beamshooter', 'Lanzarrayos', 'lanza', 'planterna', tirador('peashooter', 'electricpea', 1.8)),
    ('Illumi-nut', 'Nuez luminosa', 'nuez', 'planterna', muro('tallnut', 6000, FogLightRadius=120)),
    ('Triplantern', 'Tripitidora farol', 'tripi', 'planterna', tirador('threepeater', 'pea_flame_blue', 1.35)),
    ('Thorn-nut', 'Nuez de espinas', 'nuez', 'cactus', muro('spikerock', 4000)),
    ('Ice Cactus', 'Cactus helado', 'hielo', 'cactus', tirador('cactus', 'pea_snow', 1.35)),
    ('Doom Cactus', 'Cactus fatal', 'peta', 'cactus', tirador('cactus', 'pea_mega', 2.0)),
    ('Pea Drone', 'Dron lanzaguisantes', 'lanza', 'trebol', tirador('skyshooter', 'pea_sky', 1.35)),
    ('Sun Blover', 'Trébol solar', 'girasol', 'trebol', ('blover', {'BlowDuration': 4})),
    ('Float-nut', 'Nuez flotante', 'nuez', 'trebol', muro('wallnut', 4000)),
    ('Star Peashooter', 'Lanzaestrellas', 'lanza', 'estrella', tirador('starfruit', 'star', 1.0)),
    ('Sunfruit', 'Fruta solar', 'girasol', 'estrella', tirador('starfruit', 'pinkstar', 1.35)),
    ('Star-nut', 'Nuez estrella', 'nuez', 'estrella', tirador('starfruit', 'star', 1.35, vida=4000)),
    ('Cold Star', 'Estrella fría', 'hielo', 'estrella', tirador('starfruit', 'pea_snow', 1.35)),
    ('Death Star', 'Estrella fatal', 'peta', 'estrella', tirador('starfruit', 'shootingstar', 1.6)),
    ('Pumpkin Pod', 'Calabaza tiradora', 'lanza', 'calabaza', tirador('peapod', 'pea', 1.35, vida=4000)),
    ('Sunny Pumpkin', 'Calabaza soleada', 'girasol', 'calabaza', muro('pumpkin', 4000)),
    ('Nut Shell', 'Cáscara de nuez', 'nuez', 'calabaza', muro('pumpkin', 8000)),
    ('Freezer Pumpkin', 'Calabaza congeladora', 'hielo', 'calabaza', muro('pumpkin', 5000, ImmuneToIceblock=True)),
    ('Doom Pumpkin', 'Calabaza fatal', 'peta', 'calabaza', muro('pumpkin', 6000)),
    ('Spike Pumpkin', 'Calabaza espinosa', 'pincho', 'calabaza', muro('pumpkin', 5000)),
    ('Solar Magnet', 'Imán solar', 'girasol', 'magneto', ('magnetshroom', {'RestTime': 7})),
    ('Mag-nut', 'Nuez imán', 'nuez', 'magneto', ('magnetshroom', {'Toughness': 4000})),
    # Tejado y mejoradas
    ('Gatling Pea', 'Guisantralladora', 'repe', 'repe', igual('gatling')),
    ('Snow Repeater', 'Repetidora helada', 'repe', 'hielaguis', tirador('repeater', 'pea_snow', 1.35)),
    ('Gatling Snow Pea', 'Guisantralladora helada', 'ametra', 'hielaguis', tirador('gatling', 'pea_snow', 0.9)),
    ('Blaze Repeater', 'Repetidora llameante', 'repe', 'jalapeno', tirador('repeater', 'pea_flame_yellow', 1.35)),
    ('Blaze Gatling', 'Guisantralladora llameante', 'ametra', 'jalapeno', tirador('gatling', 'pea_flame_yellow', 0.9)),
    ('Poison Repeater', 'Repetidora venenosa', 'repe', 'humo', tirador('repeater', 'pea_goo', 1.35)),
    ('Gatling Poison', 'Guisantralladora venenosa', 'ametra', 'humo', tirador('gatling', 'pea_goo', 0.9)),
    ('Rebeamer', 'Repetidora de rayos', 'repe', 'planterna', tirador('repeater', 'electricpea', 1.8)),
    ('Gatling Doom', 'Guisantralladora fatal', 'ametra', 'peta', tirador('gatling', 'pea_mega', 1.5)),
    ('Salad-pult', 'Ensaladapulta', 'col', 'maiz', lanzador('kernelpult', 'corn', ChanceToButter=0.5)),
    ('Melon Cannon', 'Cañón de melón', 'melon', 'cereza', lanzador('melonpult', 'melon_pf')),
    ('Golden Melon-pult', 'Melonpulta dorada', 'melon', 'girasol', lanzador('wintermelon', 'winter_melon')),
    ('Golden Garlic', 'Ajo dorado', 'ajo', 'girasol', ('garlic', {'Toughness': 1800})),
    ('Golden Umbrella', 'Paraplanta dorada', 'paraguas', 'girasol', ('umbrellaleaf', {'Toughness': 1200})),
    ('Golden Cabbage-pult', 'Coltapulta dorada', 'col', 'girasol', lanzador('cabbagepult', 'cabbage_pf')),
    ('Golden Kernel-pult', 'Lanzamaíz dorado', 'maiz', 'girasol', lanzador('kernelpult', 'butter2', ChanceToButter=0.6)),
    ('Jugger-nut', 'Nuez colosal', 'alta', 'nuez', muro('tallnut', 16000)),
    ('Chomper Maw', 'Gran fauces', 'carnivora', 'carnivora', ('chomper', {'MaxContainZombieCount': 4, 'ChewTimePerZombie': 8})),
    ('Pumpkin Bunker', 'Búnker de calabaza', 'calabaza', 'calabaza', muro('pumpkin', 10000)),
    ('Infernowood', 'Antorcha infernal', 'antorcha', 'antorcha', ('torchwood', {'DamageScale': 3, 'Toughness': 4000})),
    ('Explode-o-shooter', 'Tiradora explosiva', 'repe', 'cereza', tirador('repeater', 'pea_mega', 1.6)),
    ('Charm-shroom', 'Seta encantadora', 'hipno', 'hipno', ('hypnoshroom', {'Toughness': 600})),
]
