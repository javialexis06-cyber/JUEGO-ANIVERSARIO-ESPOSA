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
import numpy as np  # noqa: E402

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


# Los personajes chibi miden ~2.3 m en su escala de modelado; en la tienda se reducen
# para que queden a la altura de las vitrinas, como en Supermarket Mania.
PERSON_SCALE = 0.68


def person(coll, key, x, y, rot=0.0):
    if os.environ.get('SIN_GENTE'):  # pruebas rápidas de distribución
        return None
    src = source_collection(key)
    e = bpy.data.objects.new(f'{key} (inst)', None)
    e.instance_type = 'COLLECTION'
    e.instance_collection = src
    e.location = (x, y, 0)
    e.rotation_euler = (0, 0, rot)
    e.scale = (PERSON_SCALE,) * 3
    clay.link(e, coll)
    return e



def el_con_carrito(coll, U, cart_level, x, y, rot, dx, dy):
    """Él empujando el carrito; el desfase del carrito se escala con el personaje."""
    person(coll, 'el_carrito', x, y, rot)
    k = PERSON_SCALE
    U('carrito', lambda c: utileria.carrito(cart_level, c), x + dx * k, y + dy * k, rot, 1.3 * k)

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


def entrance(coll, x, y, level, torniquete=True):
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
    if level >= 2 and torniquete:
        utileria.build('torniquete', utileria.torniquete, coll, (x + 1.1, y, 0), math.pi / 2, 1.0)
    utileria.build('puesto canastas', utileria.puesto_canastas, coll, (x + 0.6, y - w / 2 - 0.7, 0), math.pi / 2, 1.0)
    sign_m = {1: 'amarillo', 2: 'menta', 3: 'coral', 4: 'lila'}[level]
    vitrinas.sign(coll, 'blanco', (x + 0.12, y, 2.75), (0.05, 0.9, 0.22), sign_m, dots=3)


def lamps(coll, W, D, level):
    """Lámparas colgantes (bombillos en la tiendita, campanas en las demás)."""
    lamp = vitrinas.m('luz')
    nx, ny = {1: (3, 2), 2: (4, 3), 3: (5, 3), 4: (6, 3)}[level]
    shade = {1: None, 2: 'menta', 3: 'amarillo', 4: 'coral'}[level]
    for ix in range(nx):
        for iy in range(ny):
            x = -W / 2 + W * (ix + 0.5) / nx
            y = -D / 2 + D * (iy + 0.5) / ny + 0.4
            clay.sweep('cable', [(x, y, 3.45), (x, y, 3.25)], 0.01, (1, 1), coll, vitrinas.m('negro'), segments=4, samples=2)
            if shade:
                clay.lathe('pantalla lámpara', [(0.05, 3.25), (0.3, 3.02), (0.31, 2.98)], coll, vitrinas.m(shade), segments=24,
                           cap_top=False).location = (x, y, 0)
                clay.blob('bombillo', (x, y, 3.05), (0.08, 0.08, 0.08), coll, lamp, n=5)
            else:
                clay.blob('bombillo', (x, y, 3.15), (0.09, 0.09, 0.11), coll, lamp, n=5)


# --------------------------------------------------------------------------
# Secciones: cada cosa tiene su sitio (tapete + letrero con ícono)
# --------------------------------------------------------------------------

# sección: (tipo de vitrina, ícono, color del tapete, color del letrero)
SECCIONES = {
    'frutas': ('frutas', 'manzana', '#C6E6AE', 'verde'),
    'abarrotes': ('estante', 'lata', '#F8DDB8', 'naranja empaque'),
    'lacteos': ('nevera', 'leche', '#C8E1F6', 'azul'),
    'carnes': ('vitrina', 'filete', '#F6C6BF', 'rojo'),
    'congelados': ('congelador', 'copo', '#DDD2F4', 'morado'),
    'panaderia': ('panaderia', 'pan', '#F8E6AE', 'amarillo'),
    'bebidas': ('bebidas', 'botella', '#C2E8EE', 'celeste'),
    'wafles': ('wafles', 'wafle', '#F9D0DE', 'rosa'),
    'arepas': ('arepas', 'arepa', '#FCE59C', 'pan tostado'),
    'caja': ('caja', None, '#E8E1D8', None),
}

# Huella de cada vitrina por nivel (x0, x1, y0, y1), medida en su sistema local.
HUELLA = {
    ('estante', 1): (-0.65, 0.65, -0.24, 0.24), ('estante', 2): (-0.75, 0.75, -0.31, 0.31), ('estante', 3): (-0.89, 0.89, -0.35, 0.36),
    ('frutas', 1): (-0.74, 0.74, -0.19, 0.19), ('frutas', 2): (-0.78, 0.78, -0.41, 0.45), ('frutas', 3): (-0.99, 1.22, -0.5, 0.55),
    ('nevera', 1): (-0.42, 0.42, -0.35, 0.4), ('nevera', 2): (-0.72, 0.72, -0.37, 0.43), ('nevera', 3): (-0.94, 0.94, -0.46, 0.56),
    ('vitrina', 1): (-0.5, 0.5, -0.33, 0.32), ('vitrina', 2): (-0.8, 0.8, -0.37, 0.36), ('vitrina', 3): (-0.97, 0.97, -0.52, 0.52),
    ('congelador', 1): (-0.45, 0.45, -0.33, 0.36), ('congelador', 2): (-0.7, 0.7, -0.39, 0.38), ('congelador', 3): (-0.97, 0.97, -0.52, 0.52),
    ('panaderia', 1): (-0.5, 0.5, -0.31, 0.31), ('panaderia', 2): (-0.74, 0.74, -0.32, 0.5), ('panaderia', 3): (-0.92, 0.92, -0.42, 1.05),
    ('bebidas', 1): (-0.46, 0.46, -0.26, 0.26), ('bebidas', 2): (-0.5, 0.5, -0.33, 0.41), ('bebidas', 3): (-0.92, 1.34, -0.46, 0.45),
    ('caja', 1): (-0.64, 0.64, -0.33, 0.33), ('caja', 2): (-0.85, 0.85, -0.36, 0.35), ('caja', 3): (-1.44, 1.0, -0.38, 0.38),
    ('wafles', 1): (-1.02, 0.5, -0.44, 0.84), ('wafles', 2): (-0.77, 0.77, -0.34, 0.34), ('wafles', 3): (-1.01, 1.01, -0.39, 1.05),
    ('arepas', 1): (-0.47, 0.98, -0.46, 0.82), ('arepas', 2): (-0.77, 0.77, -0.34, 0.34), ('arepas', 3): (-1.01, 1.01, -0.39, 1.05),
}

# Los letreros miran a la cámara del juego (que está al frente a la derecha)
SIGN_ROT = math.radians(38)
_MATS = {}


def _mat(name, hex_color, **kw):
    if name not in _MATS:
        _MATS[name] = M(name, hex_color, **kw)
    return _MATS[name]


def _group(coll, name, location, rot, build):
    """Construye piezas en el origen y las cuelga de un vacío (para moverlas y rotarlas juntas)."""
    before = set(coll.objects)
    build()
    root = bpy.data.objects.new(name, None)
    clay.link(root, coll)
    for o in coll.objects:
        if o not in before and o is not root and o.parent is None:
            o.parent = root
    root.location = location
    root.rotation_euler = (0, 0, rot)
    return root


def rug(coll, hex_color, x, y, hx, hy, rot=0.0, border=None):
    """Tapete de fieltro que marca el sitio de una sección."""
    mat = _mat(f'Tapete | {hex_color}', hex_color, rough=0.95,
               fuzz=dict(scale=140, color=hex_color, amount=0.3, strength=0.25, distance=0.002))

    def build():
        clay.rbox('tapete', (0, 0, 0.012), (hx, hy, 0.012), coll, mat, p=6, n=5)
        if border:
            clay.rbox('borde tapete', (0, 0, 0.006), (hx + 0.06, hy + 0.06, 0.006), coll, _mat(f'Borde | {border}', border, rough=0.9), p=6, n=5)
    return _group(coll, 'tapete sección', (x, y, 0), rot, build)


def hanging_sign(coll, x, y, section, z=2.75):
    """Letrero colgante con el ícono de la sección, mirando a la cámara."""
    _k, icon, _rug, col = SECCIONES[section]

    def build():
        clay.rbox('letrero sección', (0, 0, 0), (0.58, 0.04, 0.34), coll, prod.mat(col), p=5, n=5)
        clay.rbox('placa letrero', (0, -0.041, 0), (0.48, 0.01, 0.26), coll, prod.mat('crema'), p=5, n=5)
        before = set(coll.objects)
        prod._icono(coll, icon, -0.055, 0.0)
        for o in coll.objects:
            if o not in before:
                for v in o.data.vertices:
                    v.co.x *= 3.0
                    v.co.z *= 3.0
        for sx in (-1, 1):
            clay.sweep('cadena letrero', [(sx * 0.42, 0, 0.3), (sx * 0.42, 0, 3.45 - z)], 0.008, (1, 1), coll, vitrinas.m('acero'), segments=4, samples=2)
    return _group(coll, f'letrero {section}', (x, y, z), SIGN_ROT, build)


def slot(coll, section, x, y, rot=0.0, level=None, sign=True, sign_z=2.75):
    """Sitio de una sección: tapete + vitrina del nivel dado (o sitio libre por comprar si level es None)."""
    kind, _icon, rug_hex, _col = SECCIONES[section]
    x0, x1, y0, y1 = HUELLA[(kind, level or 2)]
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    c, s_ = math.cos(rot), math.sin(rot)
    wx, wy = x + cx * c - cy * s_, y + cx * s_ + cy * c
    hx, hy = (x1 - x0) / 2 + 0.25, (y1 - y0) / 2 + 0.3
    if level:
        rug(coll, rug_hex, wx, wy, hx, hy, rot)
        vitrinas.build(kind, level, coll, (x, y, 0), rot)
    else:
        empty_slot(coll, wx, wy, hx, hy, rot)
    if sign and section != 'caja':
        hanging_sign(coll, wx, wy, section, sign_z)


def empty_slot(coll, x, y, hx, hy, rot=0.0):
    """Sitio libre que se compra con monedas: tapete punteado y un botón «+» flotando."""
    def build():
        clay.rbox('sitio libre', (0, 0, 0.008), (hx, hy, 0.008), coll, _mat('Sitio libre', '#EFE8DE', rough=0.95), p=6, n=5)
        pts = [(-hx + 0.08, -hy + 0.08, 0.02), (hx - 0.08, -hy + 0.08, 0.02), (hx - 0.08, hy - 0.08, 0.02), (-hx + 0.08, hy - 0.08, 0.02)]
        clay.stitches('punteado sitio', pts, radius=0.018, dash=0.12, gap=0.08, coll=coll, material=_mat('Punteado', '#BDB2A4', rough=0.8),
                      samples=6, closed=True)
    _group(coll, 'sitio libre', (x, y, 0), rot, build)

    def badge():
        clay.sweep('poste botón', [(0, 0, 0.0), (0, 0, 0.75)], 0.018, (1, 1), coll, vitrinas.m('acero'), segments=6, samples=2)
        o = clay.lathe('botón +', [(0.0, -0.035), (0.22, -0.035), (0.24, 0.0), (0.22, 0.035), (0.0, 0.035)], coll,
                       _mat('Botón comprar', '#5CC57E', rough=0.35, coat=0.4), segments=28)
        o.rotation_euler = (math.pi / 2, 0, 0)
        o.location = (0, 0, 0.98)
        for half in ((0.13, 0.03, 0.035), (0.035, 0.03, 0.13)):
            clay.rbox('signo +', (0, -0.05, 0.98), half, coll, vitrinas.m('blanco'), p=4, n=4)
    _group(coll, 'botón comprar', (x, y, 0), SIGN_ROT, badge)


def gondolas(coll, x, y, n, level, section='abarrotes', sign=True):
    """Isla de góndolas espalda con espalda (n por lado), con su tapete y letrero."""
    x0, x1, y0, y1 = HUELLA[('estante', level)]
    w = x1 - x0
    d = y1 - y0
    xs = [x + (i - (n - 1) / 2) * (w + 0.05) for i in range(n)]
    rug(coll, SECCIONES[section][2], x, y + d / 2, n * (w + 0.05) / 2 + 0.25, d + 0.35)
    for xx in xs:
        vitrinas.build('estante', level, coll, (xx, y, 0), 0.0)
        vitrinas.build('estante', level, coll, (xx, y + d + 0.02, 0), math.pi)
    if sign:
        hanging_sign(coll, x, y + d / 2, section, 2.95 if level == 3 else 2.75)


def wall_shelf(coll, x0, x1, y, z, items, on_left=False, seed=0):
    """Repisa de pared con productos (decoración y surtido de reserva)."""
    L = abs(x1 - x0)
    c = (x0 + x1) / 2
    if on_left:
        vitrinas.box('repisa pared', (y, c, z), (0.16, L / 2, 0.025), coll, 'madera', p=10)
        for t in (0.1, 0.5, 0.9):
            vitrinas.box('ménsula', (y - 0.08, x0 + (x1 - x0) * t, z - 0.1), (0.06, 0.02, 0.08), coll, 'madera oscura', p=6)
    else:
        vitrinas.box('repisa pared', (c, y, z), (L / 2, 0.16, 0.025), coll, 'madera', p=10)
        for t in (0.1, 0.5, 0.9):
            vitrinas.box('ménsula', (x0 + (x1 - x0) * t, y + 0.08, z - 0.1), (0.02, 0.06, 0.08), coll, 'madera oscura', p=6)
    n = max(2, int(L / 0.32))
    for i in range(n):
        t = (i + 0.5) / n
        p = x0 + (x1 - x0) * t
        name = items[(i + seed) % len(items)]
        loc = (y, p, z + 0.025) if on_left else (p, y, z + 0.025)
        prod.instance(name, loc, (math.pi / 2 if on_left else 0.0) + 0.2 * ((i % 3) - 1), 0.85, coll)


def poster(coll, x, y, z, icon, color, on_left=False, size=0.5):
    """Afiche enmarcado en la pared con un producto en relieve."""
    def build():
        clay.rbox('marco afiche', (0, 0.0, 0), (size * 0.8, 0.03, size), coll, vitrinas.m('blanco'), p=6, n=5)
        clay.rbox('afiche', (0, -0.03, 0), (size * 0.68, 0.01, size * 0.86), coll, prod.mat(color), p=6, n=5)
        before = set(coll.objects)
        prod._icono(coll, icon, -0.05, 0.0)
        for o in coll.objects:
            if o not in before:
                for v in o.data.vertices:
                    v.co.x *= size * 4.5
                    v.co.z *= size * 4.5
    return _group(coll, 'afiche', (x, y, z), -math.pi / 2 if on_left else 0.0, build)


def garland(coll, a, b, sag=0.35, n=14, colors=('rojo', 'amarillo', 'azul', 'verde', 'rosa')):
    """Guirnalda de banderines entre dos puntos (fiesta de barrio)."""
    a, b = np.array(a, float), np.array(b, float)
    pts = []
    for k in range(9):
        t = k / 8
        p = a + (b - a) * t
        p[2] -= sag * 4 * t * (1 - t)
        pts.append(tuple(p))
    clay.sweep('cuerda banderines', pts, 0.008, (1, 1), coll, vitrinas.m('blanco'), segments=4, samples=3)
    d = (b - a) / np.linalg.norm(b - a)
    for k in range(n):
        t = (k + 0.5) / n
        p = a + (b - a) * t
        p[2] -= sag * 4 * t * (1 - t)
        w = 0.12
        v = [tuple(p - d * w), tuple(p + d * w), tuple(p + np.array([0, 0, -0.26]))]
        o = clay.make_mesh_object('banderín', v, [(0, 1, 2)], coll, material=prod.mat(colors[k % len(colors)]))
        clay.add_solidify(o, 0.01, 0.0)


def promo_island(coll, x, y, item, layers=3, color='coral', s=0.9):
    """Isla de oferta: tarima redonda con una pirámide de producto y letrero."""
    clay.lathe('tarima oferta', [(0.0, 0.0), (0.62, 0.0), (0.64, 0.18), (0.6, 0.2), (0.0, 0.2)], coll, vitrinas.m(color), segments=32).location = (x, y, 0)
    step = 0.26 * s
    z = 0.2
    for L in range(layers, 0, -1):
        for i in range(L):
            for j in range(L):
                prod.instance(item, (x + (i - (L - 1) / 2) * step, y + (j - (L - 1) / 2) * step, z), 0.3 * (i + j), s, coll)
        z += 0.2 * s
    utileria.build('letrero isla', utileria.letrero_oferta, coll, (x + 0.55, y - 0.45, 0), SIGN_ROT, 0.8)


def queue_posts(coll, x0, x1, y, color='rojo'):
    xs = np.linspace(x0, x1, 3)
    for x in xs:
        clay.lathe('base poste', [(0.0, 0.0), (0.14, 0.0), (0.15, 0.02), (0.0, 0.03)], coll, vitrinas.m('acero'), segments=20).location = (x, y, 0)
        clay.sweep('poste fila', [(x, y, 0.0), (x, y, 0.95)], 0.025, (1, 1), coll, vitrinas.m('acero'), segments=8, samples=2)
    for a, b in zip(xs[:-1], xs[1:]):
        m = (a + b) / 2
        clay.sweep('cinta fila', [(a, y, 0.9), (m, y, 0.8), (b, y, 0.9)], 0.02, (0.35, 1), coll, prod.mat(color), segments=6, samples=4)


def cart_corral(coll, x, y, n=3, rot=math.pi / 2):
    for k in range(n):
        utileria.build('carrito clientes', lambda c: utileria.carrito(1, c), coll, (x + k * 0.22 * math.cos(rot - math.pi / 2),
                                                                                    y + k * 0.22 * math.sin(rot - math.pi / 2), 0), rot, 0.8)


def pila_bodega(coll, x, y, seed=0):
    """Rincón de mercancía: costales de fique y cajas apiladas (decoración que llena la tienda)."""
    costal = _mat('Costal | fique', '#C9A774', rough=0.95, noise=dict(scale=60, strength=0.5, distance=0.004))
    rng = np.random.default_rng(seed)
    for k in range(3):
        cx, cy = x + (k - 1) * 0.5, y + rng.uniform(-0.1, 0.1)
        clay.blob('costal', (cx, cy, 0.3), (0.24, 0.2, 0.3), coll, costal, n=8,
                  shaper=lambda v: np.where(v[:, 2:3] > 0, v * np.array([0.8, 0.8, 1.0]), v))
        clay.sweep('amarre costal', [(cx - 0.1, cy, 0.56), (cx, cy - 0.02, 0.6), (cx + 0.1, cy, 0.56)], 0.02, (1, 1), coll, costal, segments=6, samples=3)
    names = [n for n, _, _ in prod.CAJAS]
    for k in range(4):
        prod.instance(names[(k + seed) % len(names)], (x + (k % 2) * 0.46 - 0.2, y + 0.55, 0.28 * (k // 2)), 0.15 * k, 1.0, coll)


def knee_walls(coll, W, D, color):
    """Muros bajos al frente y a la derecha para cerrar el diorama sin tapar la vista."""
    mat = _mat(f'Muro bajo | {color}', color, rough=0.8)
    clay.rbox('muro bajo frente', (0, -D / 2 - 0.1, 0.2), (W / 2 + 0.2, 0.1, 0.2), coll, mat, p=8, n=4)
    clay.rbox('muro bajo derecha', (W / 2 + 0.1, 0, 0.2), (0.1, D / 2 + 0.2, 0.2), coll, mat, p=8, n=4)


def clock(coll, x, y, z, on_left=False):
    utileria.build('reloj pared', utileria.reloj, coll, (x, y, z - 0.35), -math.pi / 2 if on_left else 0.0, 1.6)


# --------------------------------------------------------------------------
# Tiendas
# --------------------------------------------------------------------------

REPISA_ABARROTES = ['enlatado', 'arroz', 'cereal', 'galletas', 'papitas']
REPISA_BEBIDAS = ['gaseosa', 'jugo', 'agua']
REPISA_FRUTAS = ['caja frutas', 'caja frutas', 'caja bebidas']

# Nivel máximo al que se pueden mejorar las vitrinas en cada tienda
TOPE = {1: 2, 2: 2, 3: 3, 4: 3}


def S(section, back=None, left=None, at=None, rot=0.0, start=False, sign=True, sign_z=2.75):
    """Sitio de la distribución: contra la pared del fondo (x), la izquierda (y) o libre (x, y)."""
    return dict(section=section, back=back, left=left, at=at, rot=rot, start=start, sign=sign, sign_z=sign_z)


def G(x, y, n, start=0, sign=True):
    """Isla de góndolas de abarrotes (n por lado); 'start' góndolas vienen compradas al empezar."""
    return dict(gondola=True, x=x, y=y, n=n, start=start, sign=sign)


def Mq(name, x, y, rot=0.0):
    """Máquina de productos preparados (se compra; no viene al empezar)."""
    return dict(machine=name, x=x, y=y, rot=rot)


MAQUINAS = {'malteadas': utileria.maquina_malteadas, 'cafe': utileria.cafetera, 'jugos': utileria.exprimidor, 'pizza': utileria.horno_pizza}

TIENDAS = {
    1: dict(W=12.0, D=9.0, name='Tiendita de barrio', floor=('madera', '#D9A874', '#CF9C68', 0.5, '#B8845A'), wall='#F6D8C0', knee='#E9C9AE',
            windows=[(1.6, 1.9, 1.3, True)], stock=4.3, entr=-2.4,
            slots=[S('lacteos', back=-5.0, start=True), S('abarrotes', back=-3.4, start=True), S('abarrotes', back=-1.7, sign=False),
                   S('abarrotes', back=0.0, sign=False), S('bebidas', back=1.6),
                   S('frutas', left=1.2, start=True), S('panaderia', left=-0.6, sign_z=2.6),
                   G(0.9, 0.4, 1), S('congelados', at=(3.9, 1.0)), S('bebidas', at=(3.9, -1.9), sign=False),
                   S('caja', at=(-3.4, -2.9), start=True)]),
    2: dict(W=16.0, D=11.0, name='Minimercado', floor=('ajedrez', '#BFE6D8', '#F7F3EA', 4.0), wall='#F8E6A8', knee='#E8D59A',
            windows=[(-6.0, 2.55, 1.0, False)], stock=5.9, entr=-3.2,
            slots=[S('lacteos', back=-6.8, start=True), S('lacteos', back=-5.2, sign=False), S('bebidas', back=-3.6),
                   S('carnes', back=-1.9), S('abarrotes', back=-0.2, start=True), S('abarrotes', back=3.9, sign=False),
                   S('frutas', left=2.0, start=True), S('panaderia', left=-0.3),
                   G(-2.6, 1.2, 2),
                   S('congelados', at=(1.6, 1.4)), S('congelados', at=(3.2, 1.4), sign=False), S('wafles', at=(5.8, 0.6)),
                   G(1.4, -2.2, 2, sign=False), S('bebidas', at=(5.8, -2.6), sign=False),
                   S('caja', at=(-5.2, -4.0), start=True), S('caja', at=(-2.8, -4.0), sign=False)]),
    3: dict(W=20.0, D=14.0, name='Supermercado', floor=('baldosa', '#E8D4B4', '#E0C9A6', 0.8, '#CDB896'), wall='#BCDDEB', knee='#A6CDE0',
            windows=[(-7.6, 2.6, 1.0, False), (-4.4, 2.6, 1.0, False)], stock=7.0, entr=-4.3,
            slots=[S('lacteos', back=-8.6, start=True), S('lacteos', back=-6.6, sign=False), S('bebidas', back=-4.5, start=True),
                   S('abarrotes', back=-1.2, start=True), S('abarrotes', back=0.7, sign=False), S('abarrotes', back=2.6, sign=False),
                   S('frutas', left=2.8, start=True), S('frutas', left=0.0, sign=False),
                   G(-4.6, 2.2, 2), G(-4.6, -0.6, 2, sign=False),
                   S('carnes', at=(-0.4, 2.6)), S('congelados', at=(1.8, 2.6)), S('congelados', at=(-0.4, 0.2), sign=False),
                   S('panaderia', at=(5.6, 3.6)), S('wafles', at=(5.4, 0.8)), S('arepas', at=(5.2, -2.2)),
                   Mq('malteadas', 8.0, 3.8), Mq('cafe', 8.9, 1.6, -math.pi / 2),
                   G(1.8, -4.8, 2, sign=False), S('bebidas', at=(6.4, -5.2), sign=False), S('congelados', at=(8.6, -5.2), sign=False),
                   S('caja', at=(-7.6, -5.5), start=True), S('caja', at=(-5.4, -5.5), sign=False), S('caja', at=(-3.2, -5.5), sign=False)]),
    4: dict(W=24.0, D=17.0, name='Hipermercado', floor=('baldosa', '#DCD4C8', '#D2C9BB', 0.7, '#BFB5A6'), wall='#EFC3D0', knee='#E0AFBF',
            windows=[(-9.6, 2.6, 1.0, False), (-5.2, 2.6, 1.0, False)], stock=8.6, entr=-5.4,
            slots=[S('lacteos', back=-10.6, start=True), S('lacteos', back=-8.6, sign=False), S('bebidas', back=-6.4, start=True),
                   S('bebidas', back=-3.9, sign=False), S('abarrotes', back=-1.0, start=True), S('abarrotes', back=0.9, sign=False),
                   S('abarrotes', back=2.8, sign=False), S('abarrotes', back=4.7, sign=False),
                   S('frutas', left=4.2, start=True), S('frutas', left=1.6, sign=False), S('panaderia', left=-1.2),
                   G(-5.4, 3.0, 3), G(-5.4, 0.0, 3, sign=False),
                   S('carnes', at=(-0.4, 3.4), start=True), S('carnes', at=(1.8, 3.4), sign=False),
                   S('congelados', at=(-0.4, 0.6)), S('congelados', at=(1.8, 0.6), sign=False),
                   S('wafles', at=(6.2, 3.4), sign_z=3.1), S('arepas', at=(6.2, 0.2), sign_z=3.1),
                   Mq('malteadas', 9.8, 4.6), Mq('cafe', 10.4, 2.6, -math.pi / 2), Mq('jugos', 10.4, 0.8, -math.pi / 2),
                   Mq('pizza', 10.2, -1.4, -math.pi / 2),
                   G(4.4, -6.6, 3, sign=False), S('bebidas', at=(10.0, -6.8), sign=False), S('lacteos', at=(10.0, -4.4), sign=False),
                   S('caja', at=(-9.6, -6.8), start=True), S('caja', at=(-6.8, -6.8), start=True, sign=False),
                   S('caja', at=(-4.0, -6.8), sign=False), S('caja', at=(-1.2, -6.8), sign=False)]),
}


def _place(coll, spec, W, D, lvl):
    """Ubica un sitio según su anclaje; lvl=None deja el sitio libre (por comprar)."""
    kind = SECCIONES[spec['section']][0]
    y1 = HUELLA[(kind, lvl or 2)][3]
    if spec['back'] is not None:
        x, y, rot = spec['back'], D / 2 - 0.1 - y1, 0.0
    elif spec['left'] is not None:
        x, y, rot = -W / 2 + 0.1 + y1, spec['left'], math.pi / 2
    else:
        (x, y), rot = spec['at'], spec['rot']
    slot(coll, spec['section'], x, y, rot, lvl, spec['sign'], spec['sign_z'])


def _gondola_slots(coll, g, lvl_full, completa):
    """Isla de góndolas: completa = todas al tope; al empezar solo las compradas y el resto libres."""
    if completa:
        gondolas(coll, g['x'], g['y'], g['n'], lvl_full, sign=g['sign'])
        return
    x0, x1, y0, y1 = HUELLA[('estante', lvl_full)]
    w, d = x1 - x0, y1 - y0
    k = 0
    for i in range(g['n']):
        xx = g['x'] + (i - (g['n'] - 1) / 2) * (w + 0.05)
        for yy, rot in ((g['y'], 0.0), (g['y'] + d + 0.02, math.pi)):
            lvl = 1 if k < g['start'] else None
            slot(coll, 'abarrotes', xx, yy, rot, lvl, sign=False)
            k += 1


def _floor(spec):
    if spec[0] == 'ajedrez':
        return checker_material('Piso | ajedrez', spec[1], spec[2], spec[3])
    return tile_material(f'Piso | {spec[0]}', spec[1], spec[2], spec[3], spec[4])


def tienda(level, coll, estado='completa'):
    """Construye la tienda 'level' en su estado inicial ('inicio') o con todo comprado y mejorado ('completa')."""
    T = TIENDAS[level]
    W, D = T['W'], T['D']
    completa = estado == 'completa'
    tope = TOPE[level]
    U = lambda name, fn, x, y, r=0.0, s=1.0: utileria.build(name, fn, coll, (x, y, 0), r, s)
    shell(coll, W, D, _floor(T['floor']), T['wall'])
    knee_walls(coll, W, D, T['knee'])
    for x, z, h, awning in T['windows']:
        window(coll, x, D / 2 - 0.01, z, 2.4, h, awning=awning)
    stockroom(coll, T['stock'], D / 2, level if completa else 1)
    entrance(coll, -W / 2, T['entr'], level)
    lamps(coll, W, D, level)
    n_start = n_total = 0
    for spec in T['slots']:
        if spec.get('gondola'):
            _gondola_slots(coll, spec, tope, completa)
            n_total += 2 * spec['n']
            n_start += spec['start']
        elif spec.get('machine'):
            n_total += 1
            if completa:
                rug(coll, '#E8DCCF', spec['x'], spec['y'], 0.75, 0.6, spec['rot'])
                U(spec['machine'], MAQUINAS[spec['machine']], spec['x'], spec['y'], spec['rot'])
            else:
                empty_slot(coll, spec['x'], spec['y'], 0.75, 0.6, spec['rot'])
        else:
            n_total += 1
            n_start += spec['start']
            lvl = tope if completa else (1 if spec['start'] else None)
            _place(coll, spec, W, D, lvl)
    cx, cz = {1: (-0.2, 2.75), 2: (0.6, 3.0), 3: (-6.0, 3.0), 4: (-7.4, 3.0)}[level]
    pila_bodega(coll, W / 2 - 1.0, -D / 2 + 0.7, level)
    pila_bodega(coll, T['stock'] - 2.2, D / 2 - 1.1, level + 3)
    clock(coll, cx, D / 2 - 0.02, cz)
    U('planta', utileria.planta, -W / 2 + 0.6, -D / 2 + 0.5)
    if completa:
        decorar(coll, level, W, D, U)
        gente_completa(coll, level, U)
        titulo = (f"Nivel {level} · {T['name']} completa", f"{n_total} sitios comprados · vitrinas mejoradas hasta nivel {tope}")
    else:
        gente_inicio(coll, level, U, W, D)
        titulo = (f"Nivel {level} · {T['name']}: así empieza", f"{n_start} vitrinas de nivel 1 · {n_total - n_start} sitios por comprar (+)")
    return W, D, titulo


def decorar(coll, level, W, D, U):
    """Decoración de la tienda completa: repisas de pared, islas de oferta, afiches, guirnaldas y más."""
    fest = ('amarillo', 'azul', 'rojo') if level == 3 else ('rojo', 'amarillo', 'azul', 'verde', 'rosa')
    garland(coll, (-W / 2 + 0.05, D / 2 - 0.05, 3.2), (W / 2 - 0.2, D / 2 - 0.05, 3.2), n=int(W * 1.3), colors=fest)
    garland(coll, (-W / 2 + 0.05, -D / 2 + 0.3, 3.2), (-W / 2 + 0.05, D / 2 - 0.05, 3.2), n=int(D * 1.3), colors=fest)
    if level == 1:
        wall_shelf(coll, -4.2, -1.0, D / 2 - 0.16, 1.85, REPISA_ABARROTES)
        wall_shelf(coll, 2.8, 4.0, -W / 2 + 0.16, 1.7, REPISA_FRUTAS, on_left=True)
        queue_posts(coll, -2.4, -0.6, -2.6)
        promo_island(coll, 0.6, -2.4, 'naranja', 3, 'amarillo')
        poster(coll, -W / 2 + 0.05, -3.6, 1.9, 'pan', 'amarillo', on_left=True, size=0.4)
        poster(coll, 3.0, D / 2 - 0.02, 2.1, 'manzana', 'verde', size=0.4)
        U('planta', utileria.planta, 5.4, 3.6)
        U('caneca', utileria.caneca, 2.6, -3.9)
        for k in range(3):
            prod.instance('caja frutas', (-4.6 + k * 0.05, 0.3 + k * 0.45, 0.0), 0.3 * k, 1.0, coll)
    elif level == 2:
        wall_shelf(coll, -1.0, 4.6, D / 2 - 0.16, 2.35, REPISA_ABARROTES + REPISA_BEBIDAS)
        queue_posts(coll, -1.4, 0.8, -3.9)
        promo_island(coll, 3.6, -4.2, 'gaseosa', 3, 'celeste')
        cart_corral(coll, -7.2, -1.6)
        poster(coll, -W / 2 + 0.05, -4.6, 2.0, 'filete', 'rojo', on_left=True, size=0.4)
        U('globos', utileria.globos, -7.2, -4.6)
        U('planta', utileria.planta, 7.3, 4.6)
        U('letrero oferta', utileria.letrero_oferta, 7.2, -4.4, SIGN_ROT)
        U('caneca', utileria.caneca, 7.2, -1.6)
        U('parlante', utileria.parlante, 7.4, 2.6, -math.pi / 2)
    elif level == 3:
        wall_shelf(coll, -2.2, 4.6, D / 2 - 0.16, 2.6, REPISA_ABARROTES)
        wall_shelf(coll, -2.2, -1.2, -W / 2 + 0.16, 2.3, REPISA_FRUTAS, on_left=True)
        queue_posts(coll, -2.6, -0.8, -5.2)
        promo_island(coll, 1.4, -2.2, 'enlatado', 3, 'amarillo')
        promo_island(coll, -1.6, -2.6, 'manzana', 2, 'menta')
        cart_corral(coll, -9.2, -2.0, 4)
        poster(coll, -W / 2 + 0.05, -3.0, 2.1, 'leche', 'azul', on_left=True, size=0.45)
        poster(coll, 4.6, D / 2 - 0.02, 2.2, 'arepa', 'pan tostado', size=0.45)
        U('globos', utileria.globos, -9.2, -6.2)
        U('planta', utileria.planta, 9.3, -6.2)
        U('parlante', utileria.parlante, 9.3, 5.8, -math.pi / 2)
        U('caneca', utileria.caneca, 9.2, -3.8)
    else:
        wall_shelf(coll, -2.0, 5.8, D / 2 - 0.16, 2.7, REPISA_ABARROTES + REPISA_BEBIDAS)
        queue_posts(coll, 0.2, 1.8, -7.6)
        promo_island(coll, 2.6, -3.0, 'gaseosa', 3, 'celeste')
        promo_island(coll, -1.4, -3.4, 'enlatado', 3, 'amarillo')
        promo_island(coll, 6.4, -2.2, 'manzana', 3, 'menta')
        cart_corral(coll, -11.2, -2.6, 5)
        poster(coll, -W / 2 + 0.05, -3.2, 2.2, 'filete', 'rojo', on_left=True, size=0.5)
        for x, y in ((-11.2, -7.8), (11.3, -7.6)):
            U('globos', utileria.globos, x, y)
        U('planta', utileria.planta, 11.3, 7.4)
        U('parlante', utileria.parlante, 11.3, 6.4, -math.pi / 2)
        utileria.build('camara', utileria.camara, coll, (-11.6, 8.0, 2.4), -0.7, 1.5)
        U('caneca', utileria.caneca, 11.2, -4.6)


def gente_inicio(coll, level, U, W, D):
    """Al empezar: solo Él y Ella atendiendo y unos pocos clientes."""
    el_con_carrito(coll, U, 1, -W * 0.1, -D * 0.12, -0.4, 0.0, -0.65)
    person(coll, 'ella_reponer', {1: -3.4, 2: -0.2, 3: -1.2, 4: -1.0}[level], D / 2 - 1.4, math.pi - 0.8)
    # Clientes en pasillos libres (lejos de los sitios y de Él con el carrito)
    sitios = {1: [('abuelita', -2.6, 2.3, -0.4), ('mama', 1.0, -3.2, 0.3)],
              2: [('abuelita', -4.2, 3.4, -0.4), ('mama', 3.4, -3.8, 0.3), ('deportista', 4.2, 2.8, -0.8)],
              3: [('abuelita', -7.4, 4.9, -0.4), ('mama', -1.4, -3.4, 0.3), ('deportista', 3.6, -1.0, -0.8)],
              4: [('abuelita', -9.2, 6.4, -0.4), ('mama', -1.6, -4.6, 0.3), ('deportista', 3.6, -1.6, -0.8)]}
    for key, x, y, rot in sitios[level]:
        person(coll, key, x, y, rot)


def gente_completa(coll, level, U):
    if level == 1:
        U('basura', utileria.basura, 1.8, -2.4, 0, 1.6)
        el_con_carrito(coll, U, 2, 1.4, -1.6, -0.4, 0.0, -0.65)
        person(coll, 'ella_reponer', -3.4, 3.1, math.pi - 0.8)
        person(coll, 'abuelita', -1.6, 1.3, -0.6)
        person(coll, 'nino', 2.6, -3.0, 0.5)
        person(coll, 'mama', -4.6, -1.2, -1.0)
    elif level == 2:
        U('charco', utileria.charco, 0.2, -0.6, 0, 1.4)
        U('piso mojado', utileria.cono, 0.9, -0.9, SIGN_ROT, 1.1)
        el_con_carrito(coll, U, 2, -2.4, -1.3, -0.3, 0.15, -0.65)
        person(coll, 'ella_reponer', -0.2, 4.3, math.pi - 0.8)
        person(coll, 'mama', -6.2, 0.9, -1.2)
        person(coll, 'ejecutivo', 3.7, -2.9, -0.8)
        person(coll, 'adolescente', -0.4, 0.3, 0.6)
        person(coll, 'deportista', 4.2, -0.9, 0.4)
        person(coll, 'ladron', 2.4, 3.2, -2.4)
    elif level == 3:
        U('basura', utileria.basura, -2.6, 0.9, 0, 1.6)
        el_con_carrito(coll, U, 3, -1.8, -0.9, -0.2, 0.1, -0.65)
        person(coll, 'ella_reponer', 0.7, 5.6, math.pi - 0.8)
        person(coll, 'cajera', -7.6, -4.7, math.pi)
        person(coll, 'guardia', -8.8, -3.4, -1.2)
        person(coll, 'deportista', -8.2, 2.4, -1.4)
        person(coll, 'chef', -0.4, 1.4, 0.0)
        person(coll, 'turista', 3.8, -0.6, -0.3)
        person(coll, 'ladron', 3.4, 4.4, -2.4)
        person(coll, 'nina', 2.4, -4.0, 0.4)
        person(coll, 'abuelita', 6.8, -1.4, 0.5)
    else:
        U('charco', utileria.charco, 8.2, -2.6, 0, 1.4)
        el_con_carrito(coll, U, 3, -2.6, -1.6, -0.2, 0.1, -0.7)
        person(coll, 'ella_reponer', 0.9, 7.0, math.pi - 0.8)
        person(coll, 'cajera', -9.6, -6.0, math.pi)
        person(coll, 'cajera', -6.8, -6.0, math.pi)
        person(coll, 'reponedor', -5.4, 2.0, 0.3)
        person(coll, 'guardia', -10.8, -4.4, -1.2)
        person(coll, 'aseo', 8.6, -3.2, -0.5)
        U('trapero', utileria.trapero_balde, 9.2, -3.4, -0.5)
        person(coll, 'famoso', 0.8, -1.6, 0.2)
        for k, (x, y) in enumerate(((-0.4, -2.4), (1.8, -2.5), (0.2, -0.6))):
            person(coll, ['turista', 'mama', 'adolescente'][k], x, y, math.atan2(-1.6 - y, 0.8 - x) - math.pi / 2)
        person(coll, 'nina', -3.0, -4.4, 0.4)
        person(coll, 'chef', 6.0, -1.6, 0.4)
        person(coll, 'ejecutivo', -6.8, -5.8, math.pi)


def camera_for(W, D, name, aspect=4 / 3, wall_h=3.4):
    """Cámara ortográfica isométrica que encuadra el piso completo y las paredes del fondo."""
    az, elv = math.radians(-38), math.radians(38)
    dist = 60
    tgt = (0.0, 0.0, wall_h / 2)
    loc = (tgt[0] + dist * math.sin(-az) * math.cos(elv), tgt[1] - dist * math.cos(az) * math.cos(elv), tgt[2] + dist * math.sin(elv))
    cam = escena.camera(name, loc, tgt, 50)
    cam.data.type = 'ORTHO'
    horiz = W * math.cos(az) + D * math.sin(-az)
    vert = (W * math.sin(-az) + D * math.cos(az)) * math.sin(elv) + wall_h * math.cos(elv)
    cam.data.ortho_scale = max(horiz, vert * aspect) * 1.06
    cam.data.clip_end = 300
    return cam


def lights(scene, coll, W, D):
    escena.world_color(scene, '#F6ECE2', 0.7)
    k = max(W, D)
    escena.area_light('Luz | techo', (0, 0, 14), (0, 0, 0), 9000 * (k / 12) ** 0.9, k, '#FFF3E6', coll, shape='RECTANGLE', size_y=k)
    escena.area_light('Luz | ventana', (-0.3 * k, 0.8 * k, 8), (0, 0, 0), 3000 * k / 16, 8.0, '#FFE2C2', coll)
    escena.area_light('Luz | relleno', (0.9 * k, -0.8 * k, 8), (0, 0, 0), 2500 * k / 16, 10.0, '#E6F0FF', coll)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    OUT = args[0]
    LEVELS = [int(x) for x in args[1].split(',')]
    SAMPLES = int(args[2]) if len(args) > 2 else 64
    SCALE = int(args[3]) if len(args) > 3 else 100
    ESTADOS = args[4].split(',') if len(args) > 4 else ['inicio', 'completa']
    os.makedirs(OUT, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 1920, 1440, SAMPLES)
    scene.view_settings.look = 'AgX - Medium High Contrast'
    prod.build_all()
    colls = {}
    for lvl in LEVELS:
        for estado in ESTADOS:
            c = clay.collection(f'Tienda nivel {lvl} {estado}')
            t0 = time.time()
            W, D, title = tienda(lvl, c, estado)
            colls[(lvl, estado)] = (c, W, D, title)
            print('CONSTRUIDA', lvl, estado, round(time.time() - t0, 1), 's', flush=True)
    exclude_sources()
    # Las tiendas se ven de lejos: un nivel de subdivisión al renderizar basta y ahorra mucha memoria
    for o in bpy.data.objects:
        for mod in o.modifiers:
            if mod.type == 'SUBSURF':
                mod.render_levels = min(mod.render_levels, 1)
    for key in colls:
        lvl, estado = key
        for other, (c2, *_r) in colls.items():
            c2.hide_render = other != key
            c2.hide_viewport = other != key
        c, W, D, title = colls[key]
        lc = clay.collection(f'Luces nivel {lvl} {estado}')
        for l in list(bpy.data.collections):
            if l.name.startswith('Luces nivel') and l is not lc:
                l.hide_render = True
        lights(scene, lc, W, D)
        cam = camera_for(W, D, f'CAM tienda {lvl} {estado}')
        scene.camera = cam
        scene.render.resolution_x, scene.render.resolution_y = (1920, 1440) if lvl <= 2 else (2400, 1800)
        scene.render.resolution_percentage = SCALE
        path = os.path.join(OUT, f'15-tienda-nivel-{lvl}-{estado}.png')
        scene.render.filepath = path
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print('RENDER', lvl, estado, round(time.time() - t, 1), 's', flush=True)
        try:
            from PIL import Image, ImageDraw, ImageFont
            im = Image.open(path).convert('RGB')
            d = ImageDraw.Draw(im)
            fnt = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
            f1 = ImageFont.truetype(fnt, max(18, im.width // 45))
            f2 = ImageFont.truetype(fnt.replace('-Bold', ''), max(14, im.width // 75))
            main, sub = title
            tw = max(d.textlength(main, font=f1), d.textlength(sub, font=f2))
            d.rounded_rectangle((24, 20, 24 + tw + 30, 20 + f1.size + f2.size + 40), radius=14, fill=(255, 255, 255))
            d.text((39, 31), main, font=f1, fill=(90, 70, 60))
            d.text((39, 31 + f1.size + 12), sub, font=f2, fill=(120, 100, 90))
            im.save(path)
        except Exception as e:  # pragma: no cover
            print('sin título', e)
