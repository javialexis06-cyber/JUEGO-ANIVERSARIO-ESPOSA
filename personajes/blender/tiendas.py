"""Los 4 niveles de supermercado como dioramas en vista isométrica de juego.

Nivel 1 · Tiendita de barrio   · Nivel 2 · Minimercado
Nivel 3 · Supermercado         · Nivel 4 · Hipermercado

Cada tienda usa las vitrinas del nivel correspondiente, su almacén, entrada con
canastas, cajas registradoras, decoración, problemas del día (derrames, basura) y
personajes (Él, Ella, clientes y ayudantes) instanciados desde colecciones fuente.

Uso: python3 tiendas.py <carpeta_salida> <1,2,3,4> [muestras] [escala%]
"""
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import escena  # noqa: E402
import productos as prod  # noqa: E402
import utileria  # noqa: E402
import vitrinas  # noqa: E402
from vitrinas import box  # noqa: E402

M = clay.material


def tile_material(name, c1, c2, scale=1.2, mortar='#F4EFE7'):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexBrick')
    tex.offset = 0.0
    tex.inputs['Color1'].default_value = clay.rgb(c1)
    tex.inputs['Color2'].default_value = clay.rgb(c2)
    tex.inputs['Mortar'].default_value = clay.rgb(mortar)
    tex.inputs['Scale'].default_value = scale
    tex.inputs['Mortar Size'].default_value = 0.012
    tex.inputs['Brick Width'].default_value = 1.0
    tex.inputs['Row Height'].default_value = 1.0
    tex.inputs['Color1'].default_value = clay.rgb(c1)
    coord = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(coord.outputs['Object'], tex.inputs['Vector'])
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.3
    nt.links.new(tex.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = 0.35
    bsdf.inputs['Coat Weight'].default_value = 0.2
    return m


def checker_material(name, c1, c2, scale=6.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexChecker')
    tex.inputs['Color1'].default_value = clay.rgb(c1)
    tex.inputs['Color2'].default_value = clay.rgb(c2)
    tex.inputs['Scale'].default_value = scale
    coord = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(coord.outputs['Object'], tex.inputs['Vector'])
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.35
    bsdf.inputs['Coat Weight'].default_value = 0.25
    return m


# --------------------------------------------------------------------------
# Personajes fuente (se construyen una vez y se instancian)
# --------------------------------------------------------------------------

SOURCES = {}


def source_collection(key):
    """Construye una sola vez al personaje en una colección excluida y la reutiliza."""
    if key in SOURCES:
        return SOURCES[key]
    import cuerpo
    import poses
    import rig
    root = clay.collection('Fuentes personajes')
    coll = bpy.data.collections.new(f'Fuente | {key}')
    root.children.link(coll)
    if key in ('el', 'ella', 'el_carrito', 'ella_reponer'):
        import el
        import ella
        mod = el if key.startswith('el') and not key.startswith('ella') else ella
        cuerpo.VOX = 1.35
        mod.build(coll)
        objs = list(coll.objects)
        extra = {'cabello_largo.L': (-0.7, 0.2, 1.35), 'cabello_largo.R': (0.7, 0.2, 1.35)} if mod is ella else None
        arm = rig.build_armature(f'{mod.NAME} {key}', rig.bone_layout(mod.P, mod.B, extra), coll)
        rig.skin(arm, objs, long_hair=mod is ella, hair_split_z=1.25 if mod is ella else None, pants_split_z=0.52 if mod is ella else 0.44)
        pose = {'el_carrito': 'carrito', 'ella_reponer': 'reponer'}.get(key, 'reposo')
        poses.apply_pose(arm, pose)
    else:
        import clientes
        cuerpo.VOX = 1.5
        clientes.build(key, coll)
    SOURCES[key] = coll
    return coll


def exclude_sources():
    def walk(lc):
        for ch in lc.children:
            if ch.collection.name.startswith('Fuente | ') or ch.collection.name.startswith('Producto | '):
                ch.exclude = True
            walk(ch)
    walk(bpy.context.view_layer.layer_collection)


def person(coll, key, x, y, rot=0.0):
    src = source_collection(key)
    e = bpy.data.objects.new(f'{key} (inst)', None)
    e.instance_type = 'COLLECTION'
    e.instance_collection = src
    e.location = (x, y, 0)
    e.rotation_euler = (0, 0, rot)
    clay.link(e, coll)
    return e


# --------------------------------------------------------------------------
# Arquitectura
# --------------------------------------------------------------------------

def shell(coll, W, D, floor_mat, wall_color, trim='#F6F2EA', wall_h=3.4):
    """Piso y dos paredes (fondo y lado izquierdo); el frente y la derecha quedan abiertos."""
    floor = clay.make_mesh_object('piso', [(-W / 2, -D / 2, 0), (W / 2, -D / 2, 0), (W / 2, D / 2, 0), (-W / 2, D / 2, 0)], [(0, 1, 2, 3)], coll,
                                  smooth=False, material=floor_mat)
    clay.add_solidify(floor, 0.15, -1.0)
    wall = M(f'Pared | {wall_color}', wall_color, rough=0.9, noise=dict(scale=5, strength=0.04, distance=0.04))
    trim_m = M(f'Zócalo | {trim}', trim, rough=0.5)
    b = clay.rbox('pared fondo', (0, D / 2 + 0.1, wall_h / 2), (W / 2 + 0.2, 0.1, wall_h / 2), coll, wall, p=10, n=4, subsurf=1)
    l = clay.rbox('pared izquierda', (-W / 2 - 0.1, 0, wall_h / 2), (0.1, D / 2 + 0.2, wall_h / 2), coll, wall, p=10, n=4, subsurf=1)
    clay.rbox('zócalo fondo', (0, D / 2 - 0.02, 0.1), (W / 2, 0.04, 0.1), coll, trim_m, p=8, n=4)
    clay.rbox('zócalo izquierdo', (-W / 2 + 0.02, 0, 0.1), (0.04, D / 2, 0.1), coll, trim_m, p=8, n=4)
    clay.rbox('cornisa fondo', (0, D / 2 - 0.02, wall_h - 0.08), (W / 2, 0.06, 0.08), coll, trim_m, p=8, n=4)
    clay.rbox('cornisa izquierda', (-W / 2 + 0.02, 0, wall_h - 0.08), (0.06, D / 2, 0.08), coll, trim_m, p=8, n=4)
    return wall


def window(coll, x, y, z, w, h, on_left=False, awning=None):
    glass = M('Ventana | luz', '#FFF5E6', rough=1.0, emission='#FFF0DC', emission_strength=2.5)
    frame = M('Ventana | marco', '#FFFFFF', rough=0.5)
    if on_left:
        clay.rbox('vidrio', (x, y, z), (0.02, w / 2, h / 2), coll, glass, p=10, n=4)
        clay.rbox('marco', (x + 0.02, y, z), (0.03, w / 2 + 0.06, h / 2 + 0.06), coll, frame, p=10, n=4)
        clay.rbox('parteluz', (x + 0.05, y, z), (0.03, 0.04, h / 2), coll, frame, p=10, n=4)
    else:
        clay.rbox('vidrio', (x, y, z), (w / 2, 0.02, h / 2), coll, glass, p=10, n=4)
        clay.rbox('marco', (x, y - 0.02, z), (w / 2 + 0.06, 0.03, h / 2 + 0.06), coll, frame, p=10, n=4)
        clay.rbox('parteluz', (x, y - 0.05, z), (0.04, 0.03, h / 2), coll, frame, p=10, n=4)
    if awning and not on_left:
        for k in range(8):
            xx = x - w / 2 + (k + 0.5) * w / 8
            vitrinas.box('toldo', (xx, y - 0.35, z + h / 2 + 0.2), (w / 16, 0.35, 0.02), coll, 'toldo rojo' if k % 2 == 0 else 'blanco', p=6, n=4)


def door(coll, x, y, w=1.1, h=2.2, color='#E4564F', on_left=False, label=None):
    mat = M(f'Puerta | {color}', color, rough=0.45, coat=0.2)
    if on_left:
        clay.rbox('puerta', (x + 0.03, y, h / 2), (0.05, w / 2, h / 2), coll, mat, p=8, n=5)
        clay.sweep('manija', [(x + 0.1, y + w * 0.3, 1.1), (x + 0.1, y + w * 0.3 - 0.2, 1.1)], 0.025, (1, 1), coll, vitrinas.m('acero'), segments=8, samples=2)
    else:
        clay.rbox('puerta', (x, y - 0.03, h / 2), (w / 2, 0.05, h / 2), coll, mat, p=8, n=5)
        clay.rbox('ventanilla', (x, y - 0.09, h * 0.72), (w * 0.25, 0.01, h * 0.12), coll, vitrinas.m('vidrio'), p=8, n=4)
        clay.sweep('manija', [(x + w * 0.3, y - 0.1, 1.1), (x + w * 0.3, y - 0.1, 0.9)], 0.025, (1, 1), coll, vitrinas.m('acero'), segments=8, samples=2)
    if label:
        vitrinas.sign(coll, 'blanco', (x, y - 0.1, h + 0.25) if not on_left else (x + 0.1, y, h + 0.25), (0.45, 0.03, 0.12), label)


def stockroom(coll, x, y, level):
    """Almacén en la esquina del fondo: puerta + estantería con cajas (crece con el nivel)."""
    door(coll, x, y, 1.1, 2.2, '#E4564F', label='coral')
    nshelves = {1: 0, 2: 1, 3: 2, 4: 2}[level]
    for s in range(nshelves):
        sx = x + 1.2 + s * 1.3
        for z in (0.05, 0.75, 1.45):
            vitrinas.box('estantería almacén', (sx, y - 0.4, z), (0.55, 0.3, 0.03), coll, 'acero', p=10)
        for sxx in (-1, 1):
            clay.sweep('paral', [(sx + sxx * 0.55, y - 0.65, 0.0), (sx + sxx * 0.55, y - 0.65, 1.6)], 0.025, (1, 1), coll, vitrinas.m('acero'),
                       segments=6, samples=2)
        for k, z in enumerate((0.08, 0.78, 1.48)):
            for j in range(2):
                prod.instance(prod.CAJAS[(k * 2 + j + s) % len(prod.CAJAS)][0], (sx - 0.25 + j * 0.5, y - 0.4, z), 0.1 * j, 0.9, coll)
    # cajas sueltas junto a la puerta
    for k in range(3 if level == 1 else 2):
        prod.instance(prod.CAJAS[k][0], (x - 0.9, y - 0.4 - k * 0.1, 0.0 + (0.28 if k == 2 else 0)), 0.2 * k, 1.0, coll)
    if level >= 3:
        utileria.build('carretilla', utileria.carretilla, coll, (x - 1.2, y - 1.0, 0), 0.4, 1.0)
    if level >= 4:
        vitrinas.box('banda almacén', (x + 0.4, y - 1.4, 0.45), (0.9, 0.25, 0.05), coll, 'negro', p=8)
        vitrinas.box('base banda', (x + 0.4, y - 1.4, 0.2), (0.9, 0.25, 0.2), coll, 'acero', p=8)
        prod.instance('caja frutas', (x + 0.1, y - 1.4, 0.5), 0.1, 0.9, coll)
        prod.instance('caja bebidas', (x + 0.8, y - 1.4, 0.5), -0.1, 0.9, coll)


def entrance(coll, x, y, level):
    """Entrada en la pared izquierda: puerta de vidrio, torniquetes y puesto de canastas."""
    glass = vitrinas.m('vidrio')
    frame = vitrinas.m('acero') if level >= 2 else vitrinas.m('madera oscura')
    w = 1.6 if level >= 2 else 1.1
    clay.rbox('hueco entrada', (x - 0.02, y, 1.15), (0.06, w / 2, 1.15), coll, M('Entrada | exterior', '#CDEBDD', rough=1.0, emission='#E3F6EC',
                                                                                    emission_strength=1.2), p=10, n=4)
    for s in (-1, 1):
        clay.rbox('hoja puerta', (x + 0.05, y + s * w / 4, 1.1), (0.02, w / 4 - 0.02, 1.1), coll, glass, p=10, n=4)
        clay.rbox('marco puerta', (x + 0.05, y + s * w / 2, 1.15), (0.05, 0.05, 1.15), coll, frame, p=10, n=4)
    clay.rbox('dintel', (x + 0.05, y, 2.35), (0.06, w / 2 + 0.05, 0.08), coll, frame, p=10, n=4)
    if level >= 2:
        utileria.build('torniquete', utileria.torniquete, coll, (x + 1.1, y, 0), math.pi / 2, 1.0)
    utileria.build('puesto canastas', utileria.puesto_canastas, coll, (x + 0.6, y - w / 2 - 0.7, 0), math.pi / 2, 1.0)
    sign_m = {1: 'amarillo', 2: 'menta', 3: 'coral', 4: 'lila'}[level]
    vitrinas.sign(coll, 'blanco', (x + 0.12, y, 2.75), (0.05, 0.9, 0.22), sign_m, dots=3)


def lamps(coll, W, D, level):
    if level < 3:
        return
    lamp = vitrinas.m('luz')
    for ix in range(-1, 2):
        for iy in range(-1, 2):
            x, y = ix * W / 3.2, iy * D / 3.2
            clay.sweep('cable', [(x, y, 4.6), (x, y, 3.6)], 0.01, (1, 1), coll, vitrinas.m('negro'), segments=4, samples=2)
            clay.lathe('pantalla lámpara', [(0.05, 3.6), (0.35, 3.35), (0.36, 3.3)], coll,
                       vitrinas.m('menta' if level == 3 else 'amarillo'), segments=24, cap_top=False).location = (x, y, 0)
            clay.blob('bombillo', (x, y, 3.4), (0.1, 0.1, 0.1), coll, lamp, n=5)


def section_sign(coll, x, y, text_mat):
    clay.sweep('cadena', [(x, y, 4.6), (x, y, 3.2)], 0.008, (1, 1), coll, vitrinas.m('acero'), segments=4, samples=2)
    vitrinas.sign(coll, 'blanco', (x, y, 3.1), (0.5, 0.03, 0.15), text_mat)


# --------------------------------------------------------------------------
# Tiendas
# --------------------------------------------------------------------------

def tienda(level, coll):
    V = lambda kind, lvl, x, y, r=0.0: vitrinas.build(kind, lvl, coll, (x, y, 0), r)
    U = lambda name, fn, x, y, r=0.0, s=1.0: utileria.build(name, fn, coll, (x, y, 0), r, s)
    if level == 1:
        W, D = 10.0, 8.0
        shell(coll, W, D, tile_material('Piso | madera', '#D9A874', '#CF9C68', 0.6, '#B8845A'), '#F6D8C0')
        window(coll, 1.0, D / 2 - 0.01, 1.8, 2.6, 1.4, awning=True)
        stockroom(coll, 3.2, D / 2, 1)
        entrance(coll, -W / 2, -1.5, 1)
        V('caja', 1, -3.0, -2.6, 0.0)
        V('estante', 1, -2.6, 2.9)
        V('estante', 1, -0.6, 2.9)
        V('nevera', 1, -4.4, 2.5, math.pi / 2)
        V('frutas', 1, 0.5, 0.0)
        V('panaderia', 1, 2.8, -0.6)
        U('planta', utileria.planta, -4.3, -3.4)
        U('basura', utileria.basura, 1.6, -2.2, 0, 1.6)
        person(coll, 'el_carrito', -1.2, -0.8, -0.4)
        U('carrito', lambda c: utileria.carrito(1, c), -1.2, -1.45, -0.4, 1.3)
        person(coll, 'ella_reponer', -1.6, 2.0, math.pi)
        person(coll, 'abuelita', 1.4, 1.2, -0.6)
        person(coll, 'nino', 2.0, -2.0, 0.5)
        return W, D, 'Nivel 1 · Tiendita de barrio'
    if level == 2:
        W, D = 14.0, 10.0
        shell(coll, W, D, checker_material('Piso | ajedrez menta', '#BFE6D8', '#F7F3EA', 5.0), '#F8E6A8')
        window(coll, -1.5, D / 2 - 0.01, 1.9, 3.0, 1.5)
        window(coll, 2.5, D / 2 - 0.01, 1.9, 2.0, 1.5)
        stockroom(coll, 4.2, D / 2, 2)
        entrance(coll, -W / 2, -2.2, 2)
        V('caja', 2, -4.3, -3.6)
        for i, x in enumerate((-3.0, -0.8, 1.4)):
            V('estante', 2, x, 3.9)
        V('nevera', 2, -6.3, 2.8, math.pi / 2)
        V('bebidas', 1, -6.4, 0.6, math.pi / 2)
        V('frutas', 2, -1.6, 0.4)
        V('congelador', 1, 1.4, 0.4)
        V('panaderia', 2, 4.4, -0.8, -math.pi / 2)
        V('wafles', 1, 3.4, -3.6)
        U('planta', utileria.planta, -6.3, -4.4)
        U('letrero oferta', utileria.letrero_oferta, -2.8, -2.4, -0.3)
        U('charco', utileria.charco, 0.8, -1.8, 0, 1.4)
        U('piso mojado', utileria.cono, 1.5, -2.2, 0, 1.2)
        U('caneca', utileria.caneca, 5.8, 2.0)
        person(coll, 'el_carrito', -3.2, 1.5, -0.3)
        U('carrito', lambda c: utileria.carrito(2, c), -3.05, 0.85, -0.3, 1.3)
        person(coll, 'ella', -4.3, -2.6, math.pi)
        person(coll, 'mama', -1.0, 2.2, 0.3)
        person(coll, 'ejecutivo', 2.8, -1.4, -0.8)
        person(coll, 'adolescente', 1.2, 2.3, 0.6)
        return W, D, 'Nivel 2 · Minimercado'
    if level == 3:
        W, D = 18.0, 13.0
        shell(coll, W, D, tile_material('Piso | baldosa crema', '#F3E7D3', '#EDDFC8', 0.9, '#DCCDB5'), '#CFE8F2')
        for x in (-4.0, 0.0, 4.0):
            window(coll, x, D / 2 - 0.01, 2.0, 2.4, 1.6)
        stockroom(coll, 5.8, D / 2, 3)
        entrance(coll, -W / 2, -3.0, 3)
        lamps(coll, W, D, 3)
        V('caja', 2, -6.0, -4.8)
        V('caja', 2, -3.2, -4.8)
        for x in (-4.4, -1.6, 1.2):
            V('estante', 3, x, 5.2)
        V('nevera', 3, -8.3, 3.3, math.pi / 2)
        V('bebidas', 2, -8.4, 0.9, math.pi / 2)
        V('frutas', 3, -2.6, 1.2)
        V('vitrina', 2, 1.4, 1.2)
        V('congelador', 2, 4.4, 1.2)
        V('panaderia', 2, 7.8, -1.0, -math.pi / 2)
        V('wafles', 2, 2.2, -4.9)
        V('arepas', 1, 5.6, -4.9)
        U('malteadas', utileria.maquina_malteadas, 7.8, 2.6, -math.pi / 2)
        U('cafe', utileria.cafetera, 4.0, -2.6)
        section_sign(coll, -2.6, 1.2, 'verde' if False else 'menta')
        section_sign(coll, 1.4, 1.2, 'celeste')
        U('planta', utileria.planta, -8.3, -5.8)
        U('planta', utileria.planta, 8.2, -5.6)
        U('parlante', utileria.parlante, 8.3, 5.4, -math.pi / 2)
        U('basura', utileria.basura, 0.0, -2.8, 0, 1.6)
        person(coll, 'el_carrito', -4.4, 3.1, -0.2)
        U('carrito', lambda c: utileria.carrito(2, c), -4.3, 2.45, -0.2, 1.3)
        person(coll, 'ella_reponer', 1.6, 3.4, math.pi)
        person(coll, 'cajera', -6.0, -3.9, math.pi)
        person(coll, 'guardia', -7.4, -2.4, -1.2)
        person(coll, 'deportista', -2.3, -0.8, 0.2)
        person(coll, 'chef', 1.8, -0.8, 0.0)
        person(coll, 'turista', 4.6, -0.8, -0.3)
        person(coll, 'ladron', 5.8, 3.6, -2.4)
        person(coll, 'nina', -0.5, -3.0, 0.4)
        return W, D, 'Nivel 3 · Supermercado'
    W, D = 22.0, 16.0
    shell(coll, W, D, tile_material('Piso | baldosa gris', '#EDEAE4', '#E4E0D8', 0.8, '#D2CCC2'), '#F6D7E0')
    for x in (-6.0, -1.5, 3.0):
        window(coll, x, D / 2 - 0.01, 2.0, 3.0, 1.7)
    stockroom(coll, 6.8, D / 2, 4)
    entrance(coll, -W / 2, -4.0, 4)
    lamps(coll, W, D, 4)
    for x in (-8.0, -5.2, -2.4):
        V('caja', 3, x, -6.6)
    for x in (-6.5, -3.3, -0.1, 3.1):
        V('estante', 3, x, 6.6)
    V('nevera', 3, -10.2, 4.8, math.pi / 2)
    V('nevera', 3, -10.2, 1.9, math.pi / 2)
    V('bebidas', 3, -10.3, -0.8, math.pi / 2)
    V('frutas', 3, -5.0, 2.0)
    V('vitrina', 3, -0.6, 2.0)
    V('congelador', 3, 3.6, 2.0)
    V('estante', 3, -5.0, -1.4, math.pi)
    V('estante', 3, -0.6, -1.4, math.pi)
    V('panaderia', 3, 9.6, -1.2, -math.pi / 2)
    V('wafles', 3, 4.4, -6.5)
    V('arepas', 3, 8.7, -6.5)
    U('horno pizza', utileria.horno_pizza, 9.4, 2.4, -math.pi / 2)
    U('malteadas', utileria.maquina_malteadas, 5.6, -3.4)
    U('cafe', utileria.cafetera, 7.4, -3.4)
    U('jugos', utileria.exprimidor, 3.8, -3.4)
    for x, mt in ((-5.0, 'menta'), (-0.6, 'celeste'), (3.6, 'lila')):
        section_sign(coll, x, 2.0, mt)
    U('globos', utileria.globos, -10.2, -6.8)
    U('globos', utileria.globos, 10.2, -6.6)
    U('planta', utileria.planta, -10.2, -3.4)
    U('parlante', utileria.parlante, 10.3, 6.9, -math.pi / 2)
    utileria.build('camara', utileria.camara, coll, (-10.6, 7.6, 2.2), -0.7, 1.5)
    U('charco', utileria.charco, 1.4, -4.4, 0, 1.4)
    person(coll, 'el_carrito', -3.3, 4.6, -0.2)
    U('carrito', lambda c: utileria.carrito(3, c), -3.2, 3.9, -0.2, 1.3)
    person(coll, 'ella_reponer', -0.3, 4.9, math.pi)
    person(coll, 'cajera', -8.0, -5.6, math.pi)
    person(coll, 'reponedor', 6.5, 4.3, math.pi)
    person(coll, 'guardia', -9.2, -3.2, -1.2)
    person(coll, 'aseo', 1.8, -5.0, -0.5)
    U('trapero', utileria.trapero_balde, 2.4, -5.3, -0.5)
    person(coll, 'famoso', 1.0, -1.0 - 1.9, 0.0)
    for k, (x, y, r) in enumerate(((-0.8, -3.6, 0.8), (2.6, -2.6, -0.7), (-1.4, -2.4, 1.2))):
        person(coll, ('mama', 'turista', 'deportista')[k], x, y, r)
    person(coll, 'abuelita', -5.4, 0.2, 0.3)
    person(coll, 'ejecutivo', 3.6, 0.1, -0.4)
    person(coll, 'nino', -6.8, -3.2, 0.6)
    return W, D, 'Nivel 4 · Hipermercado'


def camera_for(W, D, name):
    az, elv = math.radians(-38), math.radians(38)
    dist = 60
    tgt = (0.0, 0.0, 0.9)
    loc = (tgt[0] + dist * math.sin(-az) * math.cos(elv), tgt[1] - dist * math.cos(az) * math.cos(elv), tgt[2] + dist * math.sin(elv))
    cam = escena.camera(name, loc, tgt, 50)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = (W * math.cos(-az) + D * math.sin(-az)) * 1.08
    cam.data.clip_end = 300
    return cam


def lights(scene, coll, W, D):
    escena.world_color(scene, '#F6ECE2', 0.7)
    escena.area_light('Luz | techo', (0, 0, 14), (0, 0, 0), 9000, max(W, D), '#FFF3E6', coll, shape='RECTANGLE', size_y=max(W, D))
    escena.area_light('Luz | ventana', (-4, 12, 8), (0, 0, 0), 3000, 8.0, '#FFE2C2', coll)
    escena.area_light('Luz | relleno', (14, -12, 8), (0, 0, 0), 2500, 10.0, '#E6F0FF', coll)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    OUT = args[0]
    LEVELS = [int(x) for x in args[1].split(',')]
    SAMPLES = int(args[2]) if len(args) > 2 else 64
    SCALE = int(args[3]) if len(args) > 3 else 100
    os.makedirs(OUT, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 1920, 1200, SAMPLES)
    scene.view_settings.look = 'AgX - Medium High Contrast'
    prod.build_all()
    colls = {}
    for lvl in LEVELS:
        c = clay.collection(f'Tienda nivel {lvl}')
        t0 = time.time()
        W, D, title = tienda(lvl, c)
        colls[lvl] = (c, W, D, title)
        print('CONSTRUIDA', lvl, round(time.time() - t0, 1), 's', flush=True)
    exclude_sources()
    for lvl in LEVELS:
        for other, (c2, *_r) in colls.items():
            c2.hide_render = other != lvl
            c2.hide_viewport = other != lvl
        c, W, D, title = colls[lvl]
        lc = clay.collection(f'Luces nivel {lvl}')
        for l in list(bpy.data.collections):
            if l.name.startswith('Luces nivel') and l is not lc:
                l.hide_render = True
        lights(scene, lc, W, D)
        cam = camera_for(W, D, f'CAM tienda {lvl}')
        scene.camera = cam
        scene.render.resolution_percentage = SCALE
        path = os.path.join(OUT, f'15-tienda-nivel-{lvl}.png')
        scene.render.filepath = path
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print('RENDER', lvl, round(time.time() - t, 1), 's', flush=True)
        try:
            from PIL import Image, ImageDraw, ImageFont
            im = Image.open(path).convert('RGB')
            d = ImageDraw.Draw(im)
            f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', max(18, im.width // 45))
            tw = d.textlength(title, font=f)
            d.rounded_rectangle((24, 20, 24 + tw + 30, 20 + f.size + 24), radius=14, fill=(255, 255, 255))
            d.text((39, 31), title, font=f, fill=(90, 70, 60))
            im.save(path)
        except Exception as e:  # pragma: no cover
            print('sin título', e)
