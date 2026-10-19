"""Plantas contra Zombis: La Semilla Madre · escenarios renderizados en Blender.

El patio de día: la casa a la izquierda con su porche, el césped de 9 × 5 casillas con franjas, la cerca blanca y
los arbustos al fondo, la acera y la calle a la derecha. La cámara ortográfica cae exactamente sobre la cuadrícula
del juego (arte/geometria.ts): la fila f ocupa en pantalla de y = 80 + 100 f a 180 + 100 f y la columna c de x = 80 c a
80 c + 80 (px de mundo). El render cubre el mundo de x = -260 a 1200 y de y = 0 a 600.

Uso: python3.11 personajes/blender/pvz_fondos.py <salida> [variantes...]
Variantes del día: todas (5 filas con pasto), tres (filas 1–3, como el 1-2 y el 1-3) y una (fila 2, como el 1-1);
las filas sin pasto son de tierra. Salen <salida>/dia_<variante>.png.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import clay  # noqa: E402

ELEV = 34.0
SEN, COS = math.sin(math.radians(ELEV)), math.cos(math.radians(ELEV))
PX = float(os.environ.get('PX_FONDO', '2.4'))   # px del render por px de mundo
X_MIN, X_MAX, ALTO = -260, 1200, 600
COL = 0.8                      # ancho de columna en unidades (80 px)
FILA = 1.0 / SEN               # profundidad de una fila en el suelo para que en pantalla mida 100 px
Y_FRENTE = 0.0                 # borde de adelante del césped (pantalla y = 580)
MUESTRAS = int(os.environ.get('MUESTRAS', '48'))


def mat(nombre, color, rough=0.6, **kw):
    return clay.material(f'Fondo | {nombre}', color, rough=rough, **kw)


def _sock(lista, ident):
    return next(k for k in lista if k.identifier == ident)


def mat_pasto(nombre, c1, c2, escala=14.0):
    """Pasto: manchas suaves entre dos verdes, hebras finas (alargadas en la profundidad, como hojitas paradas vistas
    desde arriba) que aclaran y oscurecen, y relieve de esas hebras."""
    m = bpy.data.materials.new(f'Fondo | {nombre}')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.85
    coord = nt.nodes.new('ShaderNodeTexCoord')
    ruido = nt.nodes.new('ShaderNodeTexNoise')
    ruido.inputs['Scale'].default_value = escala
    ruido.inputs['Detail'].default_value = 6
    nt.links.new(coord.outputs['Object'], ruido.inputs['Vector'])
    rampa = nt.nodes.new('ShaderNodeValToRGB')
    rampa.color_ramp.elements[0].position = 0.35
    rampa.color_ramp.elements[0].color = clay.rgb(c1)
    rampa.color_ramp.elements[1].position = 0.75
    rampa.color_ramp.elements[1].color = clay.rgb(c2)
    nt.links.new(ruido.outputs['Fac'], rampa.inputs['Fac'])
    mapa = nt.nodes.new('ShaderNodeMapping')
    mapa.inputs['Scale'].default_value = (1.0, 0.22, 1.0)
    nt.links.new(coord.outputs['Object'], mapa.inputs['Vector'])
    hebras = nt.nodes.new('ShaderNodeTexNoise')
    hebras.inputs['Scale'].default_value = 150
    hebras.inputs['Detail'].default_value = 3
    hebras.inputs['Roughness'].default_value = 0.6
    nt.links.new(mapa.outputs['Vector'], hebras.inputs['Vector'])
    luz = nt.nodes.new('ShaderNodeValToRGB')
    e = luz.color_ramp.elements
    e[0].position, e[0].color = 0.3, (0.18, 0.18, 0.18, 1)
    e[1].position, e[1].color = 0.72, (0.8, 0.8, 0.8, 1)
    nt.links.new(hebras.outputs['Fac'], luz.inputs['Fac'])
    mezcla = nt.nodes.new('ShaderNodeMix')
    mezcla.data_type = 'RGBA'
    mezcla.blend_type = 'OVERLAY'
    _sock(mezcla.inputs, 'Factor_Float').default_value = 0.7
    nt.links.new(rampa.outputs['Color'], _sock(mezcla.inputs, 'A_Color'))
    nt.links.new(luz.outputs['Color'], _sock(mezcla.inputs, 'B_Color'))
    nt.links.new(_sock(mezcla.outputs, 'Result_Color'), bsdf.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.45
    bump.inputs['Distance'].default_value = 0.015
    nt.links.new(hebras.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return m


def y_suelo(fila):
    """Profundidad (Y) del centro de una fila del juego (0 = la de arriba)."""
    return Y_FRENTE + (4.5 - fila) * FILA


def caja(nombre, centro, medio, material, coll, bisel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=2, location=centro)
    o = bpy.context.active_object
    o.name = nombre
    o.scale = medio
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bisel:
        m = o.modifiers.new('bisel', 'BEVEL')
        m.width = bisel
        m.segments = 3
    o.data.materials.append(material)
    clay.link(o, coll)
    return o


def preparar():
    scene = clay.reset_scene()
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = MUESTRAS
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
    scene.cycles.max_bounces = 5
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('Cielo')
    scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes.get('Background')
    bg.inputs['Color'].default_value = clay.rgb('#BFE3FF')
    bg.inputs['Strength'].default_value = 1.15
    return scene


def sol():
    data = bpy.data.lights.new('sol', 'SUN')
    data.energy = 2.4
    data.angle = math.radians(14)
    data.color = clay.rgb('#FFF4DE')[:3]
    o = bpy.data.objects.new('sol', data)
    clay.link(o, clay.collection('Luces'))
    o.rotation_euler = (math.radians(28), math.radians(-18), math.radians(-20))


def camara(scene):
    d = Vector((0.0, -COS, SEN))  # desde adelante y arriba
    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', cam_data)
    clay.link(cam, clay.collection('Camara'))
    ancho = (X_MAX - X_MIN) / 100
    alto = ALTO / 100
    cam_data.ortho_scale = max(ancho, alto)
    # Punto del suelo que cae en el centro de la pantalla (x = 470, y = 300): y_pantalla = 580 - Y·SEN·100.
    cx = (X_MIN + X_MAX) / 200
    y_centro = (580 - 300) / (SEN * 100)
    centro = Vector((cx, y_centro, 0.0))
    cam.location = centro + d * 30
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (-d).to_track_quat('-Z', 'Y')
    cam_data.clip_start = 0.1
    cam_data.clip_end = 200
    scene.camera = cam
    scene.render.resolution_x = round((X_MAX - X_MIN) * PX)
    scene.render.resolution_y = round(ALTO * PX)
    scene.render.resolution_percentage = 100


def tono(hexa, f):
    """Aclara (f > 1) u oscurece (f < 1) un color hexadecimal."""
    r, g, b = (int(hexa[i:i + 2], 16) for i in (1, 3, 5))
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(c * f))) for c in (r, g, b))


def mata(nombre, coll, x, y, z, alto, verdes, n=5, abre=0.5, grosor=0.011):
    """Mata de hojas de pasto: n hojitas curvas que salen de un punto."""
    for j in range(n):
        a = j * 2.39996 + x * 7.0
        dx, dy = math.cos(a) * abre * alto, math.sin(a) * abre * alto * 0.6
        h = alto * (0.7 + 0.3 * ((j * 5) % 3) / 2)
        o = clay.sweep(f'{nombre} {j}', [(x, y, z), (x + dx * 0.4, y + dy * 0.4, z + h * 0.6), (x + dx, y + dy, z + h)], [grosor, grosor * 0.8, grosor * 0.15],
                       (1.0, 0.45), coll, verdes[j % len(verdes)], segments=5, samples=3, caps=('flat', 'point'), up=(0, -1, 0))
        o.visible_shadow = False


def margarita(nombre, coll, x, y, z, r, petalo, centro, tallo=None, alto=0.0):
    if alto and tallo:
        clay.sweep(f'{nombre} tallo', [(x, y, z), (x + 0.005, y, z + alto)], 0.006, (1, 1), coll, tallo, segments=5, samples=2, caps=('flat', 'flat'))
    for j in range(7):
        a = j * 2 * math.pi / 7
        clay.blob(f'{nombre} pétalo {j}', (x + math.cos(a) * r * 0.75, y + math.sin(a) * r * 0.5, z + alto + 0.004), (r * 0.42, r * 0.22, r * 0.12), coll, petalo,
                  n=5, subsurf=1).rotation_euler = (0, 0, 0)
    clay.blob(f'{nombre} centro', (x, y, z + alto + 0.012), (r * 0.36, r * 0.3, r * 0.2), coll, centro, n=6, subsurf=1)


def tulipan(nombre, coll, x, y, z, alto, color, tallo, hoja_m):
    clay.sweep(f'{nombre} tallo', [(x, y, z), (x + 0.01, y, z + alto * 0.6), (x, y, z + alto)], 0.009, (1, 1), coll, tallo, segments=6, samples=3,
               caps=('flat', 'flat'))
    for s_ in (-1, 1):
        clay.sweep(f'{nombre} hoja {s_}', [(x, y, z), (x + s_ * 0.03, y - 0.01, z + alto * 0.35), (x + s_ * 0.05, y - 0.02, z + alto * 0.55)],
                   [0.02, 0.022, 0.003], (1.0, 0.3), coll, hoja_m, segments=6, samples=3, caps=('flat', 'point'), up=(0, -1, 0))
    clay.blob(f'{nombre} flor', (x, y, z + alto + 0.035), (0.035, 0.032, 0.048), coll, color, n=8, subsurf=2)
    for j in range(3):
        a = j * 2 * math.pi / 3 + 0.5
        clay.blob(f'{nombre} punta {j}', (x + math.cos(a) * 0.022, y + math.sin(a) * 0.02, z + alto + 0.075), (0.014, 0.012, 0.022), coll, color, n=6,
                  subsurf=1)


def cesped(coll, filas_con_pasto):
    """Césped en ajedrez con matas, tréboles y florecitas; las filas sin pasto son tierra arada con terrones y piedritas.
    Al frente, un borde de tierra con piedras."""
    rnd = random.Random(11)
    claros = [mat_pasto('pasto claro', '#80D646', '#70C83A'), mat_pasto('pasto claro b', '#7AD042', '#6BC236'),
              mat_pasto('pasto claro c', '#86D84C', '#74CA3C')]
    oscuros = [mat_pasto('pasto oscuro', '#5EB330', '#52A52A'), mat_pasto('pasto oscuro b', '#5AAE2E', '#4F9F28'),
               mat_pasto('pasto oscuro c', '#62B734', '#55A82C')]
    tierra = mat('tierra', '#8B5A2B', rough=0.95, noise=dict(scale=60, strength=0.5, distance=0.02))
    tierra_osc = mat('tierra oscura', '#6A4320', rough=0.95, noise=dict(scale=40, strength=0.4, distance=0.02))
    surco = mat('surco', '#5E3A1A', rough=0.95)
    piedra = [mat('piedra', '#A7A196', rough=0.7, noise=dict(scale=50, strength=0.4, distance=0.01)), mat('piedra b', '#8E887E', rough=0.7)]
    caja('base tierra', (COL * 4.5, y_suelo(2), -0.08), (COL * 4.6 + 0.3, FILA * 2.6, 0.08), tierra_osc, coll, bisel=0)
    for f in range(5):
        y = y_suelo(f)
        if f not in filas_con_pasto:
            caja(f'tierra {f}', (COL * 4.5, y, -0.01), (COL * 4.5, FILA * 0.48, 0.03), tierra, coll, bisel=0.03)
            for k in range(4):
                o = clay.sweep(f'surco {f} {k}', [(0.05, y - FILA * 0.3 + k * FILA * 0.2, 0.024), (7.15, y - FILA * 0.3 + k * FILA * 0.2, 0.024)], 0.02,
                               (1.0, 0.3), coll, surco, segments=6, samples=2, caps=('flat', 'flat'), up=(0, 0, 1))
            for k in range(26):
                x = rnd.uniform(0.1, 7.1)
                clay.blob(f'terrón {f} {k}', (x, y + rnd.uniform(-0.4, 0.4) * FILA, 0.03), (rnd.uniform(0.04, 0.08), 0.05, 0.03), coll, tierra_osc, n=6,
                          subsurf=1)
            for k in range(8):
                x = rnd.uniform(0.1, 7.1)
                clay.blob(f'piedrita {f} {k}', (x, y + rnd.uniform(-0.4, 0.4) * FILA, 0.03), (0.025, 0.02, 0.015), coll, piedra[k % 2], n=6, subsurf=1)
            continue
        for c in range(9):
            par = (c + f) % 2 == 0
            m = (claros if par else oscuros)[(c * 7 + f * 3) % 3]
            caja(f'casilla {f} {c}', (c * COL + COL / 2, y, 0.0), (COL / 2, FILA / 2, 0.035), m, coll, bisel=0)
    # Matas, tréboles y florecitas sueltas (pequeñas: no deben confundirse con las plantas del juego).
    verdes = [mat('mata', '#5AAE2C', rough=0.8), mat('mata clara', '#8AD24E', rough=0.8), mat('mata oscura', '#47952A', rough=0.8)]
    trebol = mat('trébol', '#3E8E25', rough=0.7)
    blanca = mat('margarita', '#FFFFFF', rough=0.5)
    amarilla = mat('centro flor', '#FFC928', rough=0.5)
    for k in range(120):
        f = rnd.choice(filas_con_pasto)
        x = rnd.uniform(0.06, 7.14)
        y = y_suelo(f) + rnd.uniform(-0.47, 0.47) * FILA
        r = rnd.random()
        if r < 0.72:
            mata(f'mata {k}', coll, x, y, 0.035, rnd.uniform(0.06, 0.1), verdes, n=rnd.choice((4, 5, 6)), grosor=0.013)
        elif r < 0.86:
            for j in range(3):
                a = j * 2.1 + k
                clay.blob(f'trébol {k} {j}', (x + math.cos(a) * 0.016, y + math.sin(a) * 0.016, 0.04), (0.016, 0.014, 0.006), coll, trebol, n=5, subsurf=1)
        else:
            margarita(f'florecita {k}', coll, x, y, 0.035, 0.022, blanca, amarilla)
    # Borde de tierra con piedras al frente del césped.
    caja('borde frente', (3.6, -0.2, 0.0), (3.65, 0.2, 0.03), tierra_osc, coll, bisel=0.02)
    for k in range(34):
        x = 0.05 + k * 0.215 + rnd.uniform(-0.03, 0.03)
        clay.blob(f'piedra borde {k}', (x, -0.12, 0.04), (rnd.uniform(0.07, 0.1), 0.06, 0.04), coll, piedra[k % 2], n=8, subsurf=2, p=2.4)


def cerca(coll):
    """Cerca de estacas blancas con postes gruesos de remate redondo, travesaños, rosales y flores al pie."""
    rnd = random.Random(5)
    blancos = [mat('cerca', '#F8F4EA', rough=0.5, coat=0.2), mat('cerca b', '#F1ECDF', rough=0.55, coat=0.15)]
    poste_m = mat('poste', '#FFFFFF', rough=0.45, coat=0.25)
    y = y_suelo(0) + FILA * 0.62
    k = -1
    x = -0.2
    while x < 7.9:
        if k % 7 == 0:
            caja(f'poste {k}', (x, y, 0.48), (0.08, 0.06, 0.48), poste_m, coll, bisel=0.02)
            caja(f'poste tapa {k}', (x, y, 0.98), (0.1, 0.08, 0.025), poste_m, coll, bisel=0.015)
            clay.blob(f'poste bola {k}', (x, y, 1.06), (0.065, 0.065, 0.065), coll, poste_m, n=8, subsurf=2)
            x += 0.2
        else:
            alto = 0.4 + rnd.uniform(-0.015, 0.015)
            caja(f'tabla {k}', (x, y, alto), (0.1, 0.025, alto), blancos[k % 2], coll, bisel=0.015)
            clay.lathe(f'punta {k}', [(0.0, 0.0), (0.1, 0.0), (0.0, 0.11)], coll, blancos[k % 2], segments=4).location = (x, y, alto * 2)
            x += 0.28
        k += 1
    for z in (0.22, 0.62):
        caja(f'travesaño {z}', (3.85, y + 0.05, z), (4.1, 0.02, 0.045), blancos[1], coll, bisel=0.01)
    # Al pie de la cerca: tulipanes, margaritas y matas; y dos rosales que trepan.
    tallo = mat('tallo flor', '#3F8A24', rough=0.6)
    hoja_m = mat('hoja flor', '#4E9E2C', rough=0.6)
    colores = [mat('tulipán rojo', '#E8434A', rough=0.4, coat=0.2), mat('tulipán amarillo', '#FFC93A', rough=0.4, coat=0.2),
               mat('tulipán rosado', '#FF8FB8', rough=0.4, coat=0.2), mat('tulipán morado', '#A86BE0', rough=0.4, coat=0.2)]
    blanca = mat('margarita', '#FFFFFF', rough=0.5)
    amarilla = mat('centro flor', '#FFC928', rough=0.5)
    verdes = [mat('mata', '#4C9A26', rough=0.8), mat('mata clara', '#6CBF38', rough=0.8)]
    yp = y - 0.12
    for k in range(40):
        x = 0.05 + k * 0.18 + rnd.uniform(-0.04, 0.04)
        r = rnd.random()
        if r < 0.45:
            tulipan(f'tulipán {k}', coll, x, yp, 0.03, rnd.uniform(0.14, 0.22), colores[k % 4], tallo, hoja_m)
        elif r < 0.7:
            margarita(f'margarita {k}', coll, x, yp, 0.03, 0.03, blanca, amarilla, tallo, rnd.uniform(0.08, 0.15))
        else:
            mata(f'mata cerca {k}', coll, x, yp, 0.03, rnd.uniform(0.08, 0.14), verdes, n=6)
    rosa = mat('rosa', '#E5395B', rough=0.4, coat=0.2)
    hojas_r = mat('rosal', '#3A7F24', rough=0.8, noise=dict(scale=40, strength=0.5, distance=0.02))
    for cx in (1.3, 5.6):
        for j in range(16):
            a = rnd.uniform(0, math.tau)
            px, pz = cx + rnd.uniform(-0.45, 0.45), rnd.uniform(0.15, 0.85)
            clay.blob(f'rosal {cx} {j}', (px, y - 0.06, pz), (rnd.uniform(0.07, 0.11), 0.05, rnd.uniform(0.06, 0.09)), coll, hojas_r, n=8, subsurf=2)
            if j % 3 == 0:
                clay.blob(f'rosa {cx} {j}', (px + 0.02, y - 0.1, pz + 0.02), (0.035, 0.03, 0.035), coll, rosa, n=8, subsurf=2)


def arbustos(coll):
    """Fondo: seto, árboles frondosos y arbustos con flores al otro lado de la calle."""
    rnd = random.Random(3)
    hojas = [mat('arbusto', '#3F8F2A', rough=0.85, noise=dict(scale=25, strength=0.6, distance=0.05)),
             mat('arbusto claro', '#56A832', rough=0.85, noise=dict(scale=25, strength=0.6, distance=0.05)),
             mat('arbusto oscuro', '#2F7522', rough=0.85, noise=dict(scale=25, strength=0.6, distance=0.05))]
    flor = [mat('flor arbusto', '#FF9EC4', rough=0.5), mat('flor arbusto b', '#FFFFFF', rough=0.5)]
    y = y_suelo(0) + FILA * 0.95
    for k in range(34):
        x = -0.6 + k * 0.38
        r = 0.32 + rnd.uniform(0, 0.14)
        clay.blob(f'arbusto {k}', (x, y + (k % 3) * 0.2, r * 0.8), (r, r * 0.8, r), coll, hojas[k % 3], n=10, subsurf=2)
        if k > 20 and k % 2 == 0:
            for j in range(4):
                clay.blob(f'flor arbusto {k} {j}', (x + rnd.uniform(-0.2, 0.2), y - r * 0.6, r * 0.8 + rnd.uniform(-0.15, 0.25)), (0.03, 0.02, 0.03), coll,
                          flor[j % 2], n=6, subsurf=1)
    tronco = mat('tronco', '#7A5230', rough=0.8, noise=dict(scale=30, strength=0.6, distance=0.02))
    copas = [mat('copa', '#2F7A2A', rough=0.85, noise=dict(scale=12, strength=0.7, distance=0.08)),
             mat('copa clara', '#3F9433', rough=0.85, noise=dict(scale=12, strength=0.7, distance=0.08))]
    for k, x in enumerate((-1.0, 1.6, 4.4, 7.4, 9.0, 10.6, 12.0)):
        yy = y + 2.5 + (k % 2) * 1.2
        clay.sweep(f'tronco {k}', [(x, yy, 0.0), (x + 0.05, yy, 0.9), (x - 0.03, yy, 1.7)], [0.16, 0.12, 0.1], (1, 1), coll, tronco, segments=8,
                   samples=3)
        for j in range(6):
            a = j * 1.05 + k
            clay.blob(f'copa {k} {j}', (x + math.cos(a) * 0.55, yy + math.sin(a) * 0.3, 2.1 + (j % 3) * 0.25), (0.65, 0.55, 0.55), coll, copas[j % 2],
                      n=10, subsurf=2)


def casa(coll):
    """La casa de Dave: fachada de tablas con zócalo de piedra, ventanas con contraventanas, cortinas y jardineras,
    puerta roja con tablero, ventanita y tejadito, alero con canal; el porche de tablas donde esperan los cortacéspedes."""
    rnd = random.Random(9)
    paredes = [mat('pared casa', '#F3E7C8', rough=0.7), mat('pared casa b', '#EEE0BD', rough=0.7)]
    linea = mat('línea pared', '#CDBB93', rough=0.8)
    blanco = mat('marco', '#FFFFFF', rough=0.4, coat=0.2)
    madera = [mat('madera porche', '#A0703F', rough=0.75, noise=dict(scale=90, strength=0.25, distance=0.01)),
              mat('madera porche b', '#94653A', rough=0.75, noise=dict(scale=90, strength=0.25, distance=0.01)),
              mat('madera porche c', '#AB7A47', rough=0.75, noise=dict(scale=90, strength=0.25, distance=0.01))]
    madera_osc = mat('madera junta', '#5E3B1E', rough=0.8)
    clavo = mat('clavo', '#4A4A4A', rough=0.4, metallic=0.8)
    techo = mat('techo', '#7B3B2A', rough=0.6)
    tejas = [mat('teja', '#8E4632', rough=0.6), mat('teja b', '#7E3C2A', rough=0.6)]
    vidrio = mat('ventana', '#9FD6F2', rough=0.05, coat=0.8)
    cortina = mat('cortina', '#F7A6B8', rough=0.8, sheen=0.4, wave=dict(scale=18, strength=0.6, axis='X', distortion=0.5))
    contra = mat('contraventana', '#3E7B6F', rough=0.6, coat=0.2, ribs=dict(scale=55, strength=0.6, axis='Z'))
    puerta = mat('puerta', '#B0472E', rough=0.45, coat=0.3)
    puerta_osc = mat('puerta tablero', '#92381F', rough=0.5, coat=0.2)
    dorado = mat('pomo', '#E7C14B', rough=0.2, metallic=1.0)
    piedras = [mat('zócalo', '#B9A98E', rough=0.9, noise=dict(scale=40, strength=0.4, distance=0.01)), mat('zócalo b', '#A39478', rough=0.9),
               mat('zócalo c', '#C7B89C', rough=0.9)]
    maceta_m = mat('maceta', '#C2643A', rough=0.7)
    tierra_m = mat('tierra maceta', '#5E3A1A', rough=0.95)
    hojas_m = [mat('mata casa', '#3F8F2A', rough=0.85), mat('mata casa b', '#55A535', rough=0.85)]
    flores = [mat('flor roja casa', '#E5484D', rough=0.5), mat('flor amarilla casa', '#F6C445', rough=0.5), mat('flor morada casa', '#A56BD8', rough=0.5)]
    x0, x1 = -2.9, -1.0
    xm = (x0 + x1) / 2
    yf = -0.42   # frente de la fachada
    caja('pared', (xm, -0.25, 3.4), ((x1 - x0) / 2, 0.15, 3.6), paredes[0], coll, bisel=0.02)
    # Tablas horizontales (siding) con su sombra abajo.
    for k in range(26):
        z = 0.62 + k * 0.255
        caja(f'tabla pared {k}', (xm, yf + 0.012, z + 0.12), ((x1 - x0) / 2, 0.012, 0.125), paredes[k % 2], coll, bisel=0.004).rotation_euler = (
            math.radians(-4), 0, 0)
        caja(f'línea pared {k}', (xm, yf + 0.0, z), ((x1 - x0) / 2, 0.006, 0.008), linea, coll, bisel=0)
    for xx in (x0 + 0.05, x1 - 0.04):
        caja(f'esquinero {xx}', (xx, yf - 0.01, 3.4), (0.06, 0.03, 3.6), blanco, coll, bisel=0.015)
    # Zócalo de piedras.
    for k in range(9):
        for j in range(2):
            xx = x0 + 0.12 + k * 0.22 + (j % 2) * 0.1
            if xx > x1 - 0.05:
                continue
            clay.rbox(f'piedra zócalo {k} {j}', (xx, yf - 0.02, 0.14 + j * 0.24), (0.1, 0.03, 0.1), coll, piedras[(k + j) % 3], p=3.5, n=6, subsurf=2)
    # Ventanas: vidrio, cortinas, marco con cruz, contraventanas de tablillas y jardinera con flores.
    cx = -2.45
    for z in (1.85, 4.45):
        caja(f'vidrio {z}', (cx, yf - 0.0, z), (0.27, 0.01, 0.46), vidrio, coll, bisel=0.005)
        for s_ in (-1, 1):
            clay.sweep(f'cortina {z} {s_}', [(cx + s_ * 0.2, yf - 0.02, z + 0.44), (cx + s_ * 0.17, yf - 0.02, z + 0.1), (cx + s_ * 0.22, yf - 0.02, z - 0.42)],
                       [0.05, 0.07, 0.08], (1.0, 0.3), coll, cortina, segments=8, samples=5, caps=('flat', 'flat'), up=(0, -1, 0))
            caja(f'marco lado {z} {s_}', (cx + s_ * 0.3, yf - 0.03, z), (0.04, 0.03, 0.52), blanco, coll, bisel=0.012)
            caja(f'marco tope {z} {s_}', (cx, yf - 0.03, z + s_ * 0.5), (0.34, 0.03, 0.04), blanco, coll, bisel=0.012)
            caja(f'contraventana {z} {s_}', (cx + s_ * 0.44, yf - 0.035, z), (0.095, 0.02, 0.5), contra, coll, bisel=0.012)
        caja(f'parteluz {z}', (cx, yf - 0.035, z), (0.018, 0.02, 0.46), blanco, coll, bisel=0.005)
        caja(f'travesaño {z}', (cx, yf - 0.035, z), (0.27, 0.02, 0.018), blanco, coll, bisel=0.005)
        caja(f'repisa {z}', (cx, yf - 0.07, z - 0.55), (0.4, 0.06, 0.03), blanco, coll, bisel=0.012)
        caja(f'jardinera {z}', (cx, yf - 0.12, z - 0.67), (0.36, 0.08, 0.09), madera[1], coll, bisel=0.02)
        for j in range(7):
            xx = cx - 0.3 + j * 0.1
            clay.blob(f'hojas jardinera {z} {j}', (xx, yf - 0.16, z - 0.55), (0.07, 0.05, 0.06), coll, hojas_m[j % 2], n=8, subsurf=1)
            if j % 2 == 0:
                clay.blob(f'flor jardinera {z} {j}', (xx, yf - 0.2, z - 0.51), (0.035, 0.025, 0.035), coll, flores[j % 3], n=6, subsurf=1)
    # Puerta: tablero en relieve, ventanita, pomo; arriba un tejadito inclinado con tejas y ménsulas.
    px = -1.5
    caja('marco puerta', (px, yf - 0.02, 1.4), (0.38, 0.03, 1.04), blanco, coll, bisel=0.015)
    caja('puerta', (px, yf - 0.04, 1.36), (0.3, 0.02, 0.97), puerta, coll, bisel=0.02)
    for j, (zz, h) in enumerate(((0.75, 0.3), (1.55, 0.2))):
        for s_ in (-1, 1):
            clay.rbox(f'tablero {j} {s_}', (px + s_ * 0.13, yf - 0.065, zz), (0.095, 0.012, h), coll, puerta_osc, p=5, n=5, subsurf=1)
    clay.rbox('ventanita', (px, yf - 0.065, 1.98), (0.2, 0.01, 0.13), coll, vidrio, p=5, n=5, subsurf=1)
    clay.blob('pomo', (px + 0.21, yf - 0.09, 1.25), (0.04, 0.032, 0.04), coll, dorado, n=6, subsurf=1)
    # Tejadito: losa inclinada (atrás arriba) con tres hileras de tejas, borde blanco al frente y dos ménsulas.
    Zt, D = 3.0, 0.42
    pend = math.radians(22)
    t = caja('tejadito', (px, yf - D / 2, Zt - D / 2 * math.tan(pend)), (0.52, D / 2 / math.cos(pend), 0.025), techo, coll, bisel=0.012)
    t.rotation_euler = (pend, 0, 0)
    for f in range(3):
        d = D * (0.2 + f * 0.3)
        caja(f'hilera tejas {f}', (px, yf - d, Zt - d * math.tan(pend) + 0.035), (0.53, 0.075, 0.016), tejas[f % 2], coll,
             bisel=0.012).rotation_euler = (pend, 0, 0)
    caja('fascia', (px, yf - D - 0.01, Zt - D * math.tan(pend) - 0.01), (0.54, 0.015, 0.045), blanco, coll, bisel=0.01)
    for s_ in (-1, 1):
        clay.sweep(f'ménsula {s_}', [(px + s_ * 0.44, yf - 0.02, Zt - 0.38), (px + s_ * 0.44, yf - D * 0.45, Zt - D * 0.45 * math.tan(pend) - 0.12),
                                     (px + s_ * 0.44, yf - D * 0.85, Zt - D * 0.85 * math.tan(pend) - 0.03)], 0.022, (0.7, 1.0), coll, blanco,
                   segments=6, samples=4, caps=('flat', 'flat'))
    # Alero de arriba con canal.
    caja('alero', (xm + 0.1, -0.6, 7.0), ((x1 - x0) / 2 + 0.3, 0.45, 0.12), techo, coll, bisel=0.03)
    caja('canal', (xm + 0.1, -1.06, 6.86), ((x1 - x0) / 2 + 0.3, 0.05, 0.05), mat('canal', '#D7D2C8', rough=0.4, metallic=0.4), coll, bisel=0.02)
    for k in range(10):
        caja(f'teja {k}', (x0 + 0.1 + k * 0.2, -1.07, 6.95), (0.09, 0.03, 0.1), tejas[k % 2], coll, bisel=0.02)
    # Matas con flores al pie de la fachada y una matera junto a la puerta.
    for k in range(5):
        x = x0 + 0.2 + k * 0.3
        if x > -2.0:
            continue
        clay.blob(f'mata casa {k}', (x, yf - 0.1, 0.3), (0.16, 0.12, 0.16), coll, hojas_m[k % 2], n=8, subsurf=1)
        clay.blob(f'flor casa {k}', (x, yf - 0.2, 0.42), (0.05, 0.04, 0.05), coll, flores[k % 3], n=6, subsurf=1)
    mx = -1.1
    clay.lathe('matera', [(0.07, 0.0), (0.1, 0.24), (0.115, 0.26), (0.11, 0.29)], coll, maceta_m, segments=24).location = (mx, yf - 0.2, 0.0)
    clay.blob('tierra matera', (mx, yf - 0.2, 0.275), (0.095, 0.095, 0.015), coll, tierra_m, n=6, subsurf=1)
    for j in range(7):
        a = j * 0.9
        clay.sweep(f'helecho {j}', [(mx, yf - 0.2, 0.28), (mx + math.cos(a) * 0.08, yf - 0.2 + math.sin(a) * 0.04, 0.42),
                                    (mx + math.cos(a) * 0.17, yf - 0.2 + math.sin(a) * 0.08, 0.4)], [0.03, 0.035, 0.004], (1.0, 0.3), coll,
                   hojas_m[j % 2], segments=6, samples=4, caps=('flat', 'point'), up=(0, 0, 1))
    # Porche: tablas a lo ancho (franjas en pantalla), de tonos distintos y con clavos en las puntas.
    y0, y1 = -0.4, y_suelo(0) + FILA * 0.7
    xp0, xp1 = x1, -0.02
    caja('piso porche', ((xp0 + xp1) / 2, (y0 + y1) / 2, -0.02), ((xp1 - xp0) / 2, (y1 - y0) / 2, 0.03), madera_osc, coll, bisel=0)
    ancho_t = 0.19
    k = 0
    yy = y0
    while yy < y1:
        # Algunas tablas van en dos pedazos (junta a lo largo).
        corte = xp0 + (xp1 - xp0) * rnd.uniform(0.3, 0.7) if k % 3 == 1 else None
        tramos = [(xp0, corte), (corte, xp1)] if corte else [(xp0, xp1)]
        for i, (a0, a1) in enumerate(tramos):
            caja(f'tabla porche {k} {i}', ((a0 + a1) / 2, yy + ancho_t / 2, 0.03), ((a1 - a0) / 2 - 0.006, ancho_t / 2 - 0.01, 0.03),
                 madera[rnd.randrange(3)], coll, bisel=0.012)
            for xx in (a0 + 0.05, a1 - 0.05):
                for dy in (-0.045, 0.045):
                    o = clay.blob(f'clavo {k} {i} {xx} {dy}', (xx, yy + ancho_t / 2 + dy, 0.062), (0.007, 0.007, 0.003), coll, clavo, n=4, subsurf=1)
                    o.visible_shadow = False
        yy += ancho_t
        k += 1
    caja('viga porche', (-0.03, (y0 + y1) / 2, 0.05), (0.035, (y1 - y0) / 2, 0.05), madera_osc, coll, bisel=0.012)


def calle(coll):
    """A la derecha: borde de ladrillo, acera de losas con grietas y yerbas, bordillo, cuneta con rejilla, la calle con
    parches, tapa de alcantarilla y rayas; al fondo, el buzón, un poste de luz y la acera de enfrente."""
    rnd = random.Random(21)
    losas = [mat('acera', '#BDB7AA', rough=0.85, noise=dict(scale=30, strength=0.25, distance=0.01)),
             mat('acera b', '#B3AD9F', rough=0.85, noise=dict(scale=30, strength=0.25, distance=0.01)),
             mat('acera c', '#C4BEB2', rough=0.85, noise=dict(scale=30, strength=0.25, distance=0.01))]
    junta = mat('junta acera', '#8F897E', rough=0.9)
    grieta = mat('grieta', '#6E695F', rough=0.9)
    borde = mat('bordillo', '#B3AEA3', rough=0.8, noise=dict(scale=40, strength=0.3, distance=0.01))
    cuneta = mat('cuneta', '#9C978C', rough=0.9)
    asfalto = mat('asfalto', '#55565A', rough=0.95, noise=dict(scale=80, strength=0.35, distance=0.012))
    parche = mat('parche asfalto', '#4C4D51', rough=0.95, noise=dict(scale=90, strength=0.3, distance=0.01))
    linea = mat('línea', '#F2D24A', rough=0.6)
    hierro = mat('hierro', '#3B3A38', rough=0.5, metallic=0.7, noise=dict(scale=120, strength=0.4, distance=0.005))
    verdes = [mat('yerba', '#5DA530', rough=0.8), mat('yerba b', '#77BC3C', rough=0.8)]
    xa0, xa1 = 7.3, 8.6
    yb, ya = -0.4, y_suelo(0) + FILA * 1.2
    caja('base acera', ((xa0 + xa1) / 2, (yb + ya) / 2, -0.01), ((xa1 - xa0) / 2, (ya - yb) / 2, 0.03), junta, coll, bisel=0)
    # Losas: dos de ancho, con juntas y algunas con grieta o yerbas.
    alto_losa = FILA * 0.62
    j = 0
    yy = yb
    while yy < ya:
        for i in range(2):
            cx = xa0 + (i + 0.5) * (xa1 - xa0) / 2
            caja(f'losa {j} {i}', (cx, yy + alto_losa / 2, 0.025), ((xa1 - xa0) / 4 - 0.015, alto_losa / 2 - 0.015, 0.025), losas[rnd.randrange(3)], coll,
                 bisel=0.012)
            if rnd.random() < 0.22:
                gx, gy = cx + rnd.uniform(-0.2, 0.2), yy + rnd.uniform(0.15, alto_losa - 0.15)
                pts = [(gx + rnd.uniform(-0.04, 0.04) + k * 0.06, gy + rnd.uniform(-0.05, 0.05) + k * 0.03, 0.052) for k in range(4)]
                o = clay.sweep(f'grieta {j} {i}', pts, [0.006, 0.008, 0.006, 0.002], (1.0, 0.3), coll, grieta, segments=4, samples=3, caps=('point', 'point'))
                o.visible_shadow = False
            if rnd.random() < 0.3:
                mata(f'yerba acera {j} {i}', coll, xa0 + i * (xa1 - xa0) / 2 + rnd.uniform(0.05, 0.6), yy + 0.01, 0.03, 0.05, verdes, n=4)
        j += 1
        yy += alto_losa
    caja('bordillo', (xa1 + 0.07, (yb + ya) / 2, 0.035), (0.07, (ya - yb) / 2, 0.065), borde, coll, bisel=0.03)
    caja('cuneta', (xa1 + 0.3, (yb + ya) / 2, -0.015), (0.16, (ya - yb) / 2, 0.02), cuneta, coll, bisel=0.01)
    caja('rejilla', (xa1 + 0.3, y_suelo(3), 0.006), (0.13, 0.3, 0.008), hierro, coll, bisel=0.005)
    for k in range(7):
        caja(f'barra rejilla {k}', (xa1 + 0.2 + k * 0.034, y_suelo(3), 0.018), (0.007, 0.28, 0.008), mat('rendija', '#151413', rough=0.9), coll, bisel=0)
    xc0 = xa1 + 0.46
    caja('calle', (xc0 + 2.0, (yb + ya + 1.5) / 2, -0.04), (2.0, (ya + 1.5 - yb) / 2, 0.04), asfalto, coll, bisel=0)
    for k in range(4):
        cx, cy = xc0 + rnd.uniform(0.3, 3.2), y_suelo(rnd.randrange(5)) + rnd.uniform(-0.5, 0.5)
        clay.blob(f'parche {k}', (cx, cy, 0.0), (rnd.uniform(0.2, 0.42), rnd.uniform(0.14, 0.3), 0.004), coll, parche, n=8, subsurf=2, p=2.6)
    for k in range(9):
        caja(f'raya {k}', (xc0 + 1.95, y_suelo(0) + FILA * 1.1 - k * FILA * 0.9, 0.005), (0.05, FILA * 0.25, 0.005), linea, coll, bisel=0)
    # Tapa de alcantarilla con relieve de rejilla.
    tapa = clay.lathe('tapa', [(0.0, 0.0), (0.3, 0.0), (0.31, 0.012), (0.0, 0.012)], coll, hierro, segments=40)
    tapa.location = (xc0 + 1.0, y_suelo(1) + 0.2, 0.0)
    for k in range(5):
        caja(f'relieve tapa {k}', (xc0 + 1.0, y_suelo(1) + 0.2 - 0.2 + k * 0.1, 0.016), (0.24 - abs(k - 2) * 0.05, 0.012, 0.006), hierro, coll, bisel=0.003)
    # Fondo: buzón y poste de luz en la acera, acera de enfrente con su seto.
    ym = y_suelo(0) + FILA * 0.85
    yb_ = y_suelo(0) + FILA * 0.5
    caja('poste buzón', (8.0, yb_, 0.3), (0.03, 0.03, 0.3), mat('poste buzón', '#6B4A2E', rough=0.7), coll, bisel=0.01)
    buzon = mat('buzón', '#3D6FB6', rough=0.35, coat=0.4)
    clay.rbox('buzón', (8.0, yb_, 0.64), (0.09, 0.14, 0.07), coll, buzon, p=3.0, n=6, subsurf=2)
    clay.blob('buzón techo', (8.0, yb_, 0.69), (0.09, 0.14, 0.055), coll, buzon, n=8, subsurf=2)
    caja('bandera buzón', (8.1, yb_ + 0.04, 0.73), (0.01, 0.018, 0.06), mat('bandera buzón', '#E5393B', rough=0.4), coll, bisel=0.005)
    caja('acera enfrente', (xc0 + 3.0, ym + 1.6, 0.025), (2.6, 0.9, 0.04), losas[0], coll, bisel=0.02)


VARIANTES = {'todas': [0, 1, 2, 3, 4], 'tres': [1, 2, 3], 'una': [2]}


def main(salida, variantes=None):
    os.makedirs(salida, exist_ok=True)
    for v in variantes or list(VARIANTES):
        scene = preparar()
        coll = clay.collection('Patio')
        cesped(coll, VARIANTES[v])
        cerca(coll)
        arbustos(coll)
        casa(coll)
        calle(coll)
        sol()
        camara(scene)
        recorte = os.environ.get('RECORTE')   # x0,x1,y0,y1 en px de mundo: solo esa zona (para revisar de cerca)
        if recorte:
            x0, x1, y0, y1 = (float(q) for q in recorte.split(','))
            scene.render.use_border = True
            scene.render.use_crop_to_border = True
            scene.render.border_min_x = (x0 - X_MIN) / (X_MAX - X_MIN)
            scene.render.border_max_x = (x1 - X_MIN) / (X_MAX - X_MIN)
            scene.render.border_min_y = 1 - y1 / ALTO
            scene.render.border_max_y = 1 - y0 / ALTO
        scene.render.filepath = os.path.join(salida, f'dia_{v}{"_recorte" if recorte else ""}.png')
        bpy.ops.render.render(write_still=True)
        print('fondo', v, 'listo', flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1:] or None)
