"""Utilería del juego: carritos (3 niveles), canastas, entrada, reparto, limpieza,
dinero, decoración, máquinas y los íconos 3D de la interfaz.

Todo se construye en el origen (base en z=0, frente hacia -Y).
"""
import math

import bpy
import numpy as np

import clay
import productos as prod
from vitrinas import box, m

_U = {}


def u(key):
    if not _U:
        M = clay.material
        _U.update({
            'amarillo carrito': M('Util | amarillo carrito', '#F6C542', rough=0.4, coat=0.3),
            'rojo canasta': M('Util | rojo canasta', '#E4564F', rough=0.4, coat=0.25),
            'azul caneca': M('Util | azul caneca', '#3F8FD2', rough=0.45, coat=0.2),
            'verde': M('Util | verde', '#5CC57E', rough=0.45, coat=0.2),
            'rojo': M('Util | rojo', '#E55B52', rough=0.45, coat=0.2),
            'charco': M('Util | charco', '#8FD3F2', rough=0.03, coat=1.0, transmission=0.2, ior=1.33),
            'papel': M('Util | papel', '#F2EEE4', rough=0.8),
            'bolsa papel': M('Util | bolsa papel', '#D9B07C', rough=0.85),
            'oro': M('Util | oro', '#F2C14E', rough=0.25, metallic=1.0),
            'billete': M('Util | billete', '#8FD19E', rough=0.7),
            'globo rosa': M('Util | globo rosa', '#F59BB6', rough=0.15, coat=0.6, sss=0.2),
            'globo menta': M('Util | globo menta', '#8BDDC8', rough=0.15, coat=0.6, sss=0.2),
            'globo lila': M('Util | globo lila', '#BFA6EE', rough=0.15, coat=0.6, sss=0.2),
            'hilo': M('Util | hilo', '#FFFFFF', rough=0.5),
            'matera': M('Util | matera terracota', '#D9825A', rough=0.7),
            'hoja': M('Util | hoja', '#5FA85A', rough=0.55, sss=0.2),
            'flor': M('Util | flor', '#F48FB1', rough=0.5),
            'gris oscuro': M('Util | gris oscuro', '#4A4847', rough=0.5),
            'burbuja': M('Util | burbuja', '#E6F2FF', rough=0.45, sss=0.2),
            'carita feliz': M('Util | carita feliz', '#7FD37F', rough=0.35, coat=0.3),
            'carita media': M('Util | carita media', '#F7CF4E', rough=0.35, coat=0.3),
            'carita enojada': M('Util | carita enojada', '#EE6A5E', rough=0.35, coat=0.3),
            'trazo': M('Util | trazo', '#2B2422', rough=0.4),
            'estrella': M('Util | estrella', '#FFC21A', rough=0.3, coat=0.4, emission='#FFB300', emission_strength=0.12),
            'corazon': M('Util | corazón', '#F2536E', rough=0.3, coat=0.5),
            'reloj': M('Util | reloj', '#9ED8F2', rough=0.35, coat=0.3),
            'fleco': M('Util | fleco trapero', '#F4F1EA', rough=0.9, noise=dict(scale=40, strength=0.6, distance=0.01)),
            'amarillo aviso': M('Util | amarillo aviso', '#F9C823', rough=0.4, coat=0.3),
            'amarillo oscuro': M('Util | amarillo oscuro', '#D99A12', rough=0.45, coat=0.2),
            'agua jabon': M('Util | agua jabón', '#8ECFEA', rough=0.05, coat=0.8, sss=0.2),
            'espuma': M('Util | espuma', '#FFFFFF', rough=0.4, sss=0.3),
            'charco claro': M('Util | charco claro', '#A9DDF3', rough=0.02, coat=1.0),
            'papel sombra': M('Util | papel sombra', '#D8D2C4', rough=0.8),
            'mal olor': M('Util | mal olor', '#8CC34A', rough=0.5, sss=0.2),
            'azul oscuro': M('Util | azul oscuro', '#2C6FB0', rough=0.45, coat=0.2),
            'gris claro': M('Util | gris claro', '#B8BCC2', rough=0.4, coat=0.2),
            'matera oscura': M('Util | matera oscura', '#B9653F', rough=0.7),
            'matera clara': M('Util | matera clara', '#F6E3C8', rough=0.6),
            'tierra': M('Util | tierra', '#5E3F2A', rough=0.95, noise=dict(scale=60, strength=0.5, distance=0.004)),
            'piedra': M('Util | piedrita', '#D8D1C6', rough=0.7),
            'hoja oscura': M('Util | hoja oscura', '#3F8A48', rough=0.55, sss=0.2),
            'nervio': M('Util | nervio hoja', '#A6D88F', rough=0.5),
            'globo amarillo': M('Util | globo amarillo', '#FBD86A', rough=0.15, coat=0.6, sss=0.2),
            'rejilla': M('Util | rejilla parlante', '#2F2D2C', rough=0.85, noise=dict(scale=220, strength=0.8, distance=0.002)),
            'tiza roja': M('Util | tiza roja', '#F29A90', rough=0.95),
            'tiza verde': M('Util | tiza verde', '#A8DDA0', rough=0.95),
            'tiza amarilla': M('Util | tiza amarilla', '#F8E28A', rough=0.95),
        })
    return _U[key]


def _group(name, coll, fn, location=(0, 0, 0), rotation_z=0.0, scale=1.0):
    before = set(coll.objects)
    fn(coll)
    new = [o for o in coll.objects if o not in before]
    root = bpy.data.objects.new(name, None)
    clay.link(root, coll)
    for o in new:
        if o.parent is None:
            o.parent = root
    root.location = location
    root.rotation_euler = (0, 0, rotation_z)
    root.scale = (scale, scale, scale)
    return root


def wheel(coll, c, r=0.05, w=0.03):
    o = clay.lathe('rueda', [(r * 0.6, -w), (r, -w * 0.6), (r, w * 0.6), (r * 0.6, w)], coll, m('negro'), segments=18)
    o.location = c
    o.rotation_euler = (0, math.pi / 2, 0)
    return o


def wire_basket(coll, c, half, mat_key='amarillo carrito', slats=6):
    """Canasta de rejilla: fondo, marco superior y barrotes."""
    cx, cy, cz = c
    hx, hy, hz = half
    box('fondo canasta', (cx, cy, cz), (hx, hy, 0.015), coll, 'amarillo' if mat_key == 'amarillo carrito' else 'coral', p=10)
    ring = [(cx - hx, cy - hy, cz + hz * 2), (cx + hx, cy - hy, cz + hz * 2), (cx + hx, cy + hy, cz + hz * 2), (cx - hx, cy + hy, cz + hz * 2)]
    clay.sweep('marco canasta', ring, 0.022, (1, 1), coll, u(mat_key), segments=8, samples=4, closed=True)
    for i in range(slats + 1):
        t = -1 + 2 * i / slats
        for sy in (-1, 1):
            clay.sweep('barrote', [(cx + t * hx, cy + sy * hy, cz), (cx + t * hx, cy + sy * hy, cz + hz * 2)], 0.011, (1, 1), coll, u(mat_key), segments=6, samples=2)
    for i in range(1, 4):
        t = -1 + 2 * i / 4
        for sx in (-1, 1):
            clay.sweep('barrote', [(cx + sx * hx, cy + t * hy, cz), (cx + sx * hx, cy + t * hy, cz + hz * 2)], 0.011, (1, 1), coll, u(mat_key), segments=6, samples=2)


# --------------------------------------------------------------------------
# Carrito de reposición (3 niveles)
# --------------------------------------------------------------------------

def carrito(level, coll):
    if level == 1:
        wire_basket(coll, (0, 0, 0.35), (0.3, 0.22, 0.14))
        for sx in (-1, 1):
            for sy in (-1, 1):
                clay.sweep('pata', [(sx * 0.26, sy * 0.18, 0.06), (sx * 0.28, sy * 0.2, 0.35)], 0.02, (1, 1), coll, u('amarillo carrito'), segments=6, samples=2)
                wheel(coll, (sx * 0.26, sy * 0.18, 0.05))
        clay.sweep('manija', [(-0.3, 0.22, 0.63), (-0.3, 0.3, 0.85), (0.3, 0.3, 0.85), (0.3, 0.22, 0.63)], 0.022, (1, 1), coll, u('amarillo carrito'),
                   segments=8, samples=4)
        prod.instance('caja frutas', (-0.12, 0, 0.37), 0.1, 0.6, coll)
        prod.instance('caja lacteos', (0.14, 0.02, 0.37), -0.1, 0.6, coll)
    elif level == 2:
        wire_basket(coll, (0, 0, 0.42), (0.38, 0.26, 0.16))
        box('bandeja baja', (0, 0, 0.14), (0.36, 0.24, 0.02), coll, 'amarillo', p=10)
        for sx in (-1, 1):
            for sy in (-1, 1):
                clay.sweep('pata', [(sx * 0.34, sy * 0.22, 0.06), (sx * 0.36, sy * 0.24, 0.42)], 0.022, (1, 1), coll, u('amarillo carrito'), segments=6, samples=2)
                wheel(coll, (sx * 0.34, sy * 0.22, 0.055), 0.055)
        clay.sweep('manija', [(-0.38, 0.26, 0.74), (-0.38, 0.36, 0.95), (0.38, 0.36, 0.95), (0.38, 0.26, 0.74)], 0.025, (1, 1), coll, u('amarillo carrito'),
                   segments=8, samples=4)
        box('agarre', (0, 0.36, 0.95), (0.3, 0.035, 0.035), coll, 'coral', p=4)
        for k, (x, n) in enumerate(((-0.2, 'caja frutas'), (0.05, 'caja bebidas'), (0.22, 'caja abarrotes'))):
            prod.instance(n, (x, 0, 0.44), 0.1 * k, 0.55, coll)
        prod.instance('caja congelados', (0, 0, 0.16), 0.2, 0.7, coll)
    else:
        # Carrito eléctrico: plataforma con motor, canasta grande, luz y banderín
        box('plataforma', (0, 0, 0.18), (0.45, 0.32, 0.06), coll, 'menta', p=6)
        box('motor', (0, 0.28, 0.35), (0.2, 0.1, 0.16), coll, 'blanco', p=5)
        box('luz motor', (0, 0.175, 0.4), (0.08, 0.008, 0.04), coll, 'luz', p=5)
        wire_basket(coll, (0, -0.06, 0.26), (0.42, 0.24, 0.18), 'amarillo carrito')
        for sx in (-1, 1):
            for sy in (-1, 1):
                wheel(coll, (sx * 0.4, sy * 0.26, 0.07), 0.07, 0.04)
        clay.sweep('manubrio', [(0, 0.34, 0.5), (0, 0.4, 0.95)], 0.025, (1, 1), coll, m('acero'), segments=8, samples=2)
        clay.sweep('manija', [(-0.22, 0.4, 0.95), (0.22, 0.4, 0.95)], 0.028, (1, 1), coll, m('negro'), segments=8, samples=2)
        clay.sweep('asta', [(0.4, 0.3, 0.5), (0.4, 0.3, 1.18)], 0.012, (1, 1), coll, m('acero'), segments=6, samples=2)
        clay.sweep('banderín', [(0.4, 0.3, 1.16), (0.52, 0.3, 1.11), (0.4, 0.3, 1.04)], [0.03, 0.02, 0.03], (0.2, 1), coll, u('rojo'), segments=6, samples=3,
                   up=(0, 1, 0))
        for k, (x, n) in enumerate(((-0.25, 'caja frutas'), (0.0, 'caja lacteos'), (0.25, 'caja bebidas'))):
            prod.instance(n, (x, -0.06, 0.28), 0.1 * k, 0.6, coll)
        prod.instance('caja panaderia', (-0.12, -0.06, 0.45), 0.3, 0.55, coll)
        prod.instance('caja carnes', (0.14, -0.04, 0.45), -0.2, 0.55, coll)


# --------------------------------------------------------------------------
# Compras y entrada
# --------------------------------------------------------------------------

def canasta(coll):
    wire_basket(coll, (0, 0, 0.02), (0.2, 0.14, 0.09), 'rojo canasta', 5)
    clay.sweep('asa', [(-0.18, 0, 0.2), (-0.12, 0, 0.36), (0.12, 0, 0.36), (0.18, 0, 0.2)], 0.018, (1, 1), coll, u('rojo canasta'), segments=8, samples=4)


def puesto_canastas(coll):
    box('base puesto', (0, 0, 0.03), (0.28, 0.2, 0.03), coll, 'acero', p=8)
    for k in range(5):
        before = set(coll.objects)
        canasta(coll)
        for o in [o for o in coll.objects if o not in before]:
            o.location.z += 0.06 + k * 0.07
    box('letrero canastas', (0, 0.22, 0.8), (0.2, 0.02, 0.1), coll, 'coral', p=5)
    clay.sweep('poste', [(0, 0.22, 0.03), (0, 0.22, 0.72)], 0.018, (1, 1), coll, m('acero'), segments=6, samples=2)


def torniquete(coll):
    for sx in (-1, 1):
        box('pilar', (sx * 0.35, 0, 0.45), (0.06, 0.22, 0.45), coll, 'acero', p=6)
        clay.sweep('brazo', [(sx * 0.3, 0, 0.7), (0, 0, 0.72)], 0.022, (1, 1), coll, m('acero'), segments=8, samples=2)
    box('letrero entrar', (-0.35, -0.23, 0.98), (0.12, 0.02, 0.12), coll, 'blanco', p=4)
    clay.sweep('flecha verde', [(-0.35, -0.255, 0.9), (-0.35, -0.255, 1.05)], 0.022, (1, 1), coll, u('verde'), segments=6, samples=2)
    clay.blob('punta flecha', (-0.35, -0.255, 1.06), (0.05, 0.01, 0.04), coll, u('verde'), n=4)
    box('letrero salir', (0.35, -0.23, 0.98), (0.12, 0.02, 0.12), coll, 'blanco', p=4)
    clay.sweep('flecha roja', [(0.35, -0.255, 1.06), (0.35, -0.255, 0.9)], 0.022, (1, 1), coll, u('rojo'), segments=6, samples=2)
    clay.blob('punta flecha', (0.35, -0.255, 0.88), (0.05, 0.01, 0.04), coll, u('rojo'), n=4)


def carretilla(coll):
    box('pala', (0, -0.1, 0.03), (0.22, 0.12, 0.02), coll, 'acero', p=8)
    for sx in (-1, 1):
        clay.sweep('larguero', [(sx * 0.2, 0.02, 0.03), (sx * 0.2, 0.12, 1.2)], 0.022, (1, 1), coll, u('rojo'), segments=8, samples=2)
        wheel(coll, (sx * 0.24, 0.06, 0.08), 0.08, 0.04)
    clay.sweep('agarre', [(-0.2, 0.12, 1.2), (0.2, 0.12, 1.2)], 0.025, (1, 1), coll, m('negro'), segments=8, samples=2)
    for k, n in enumerate(('caja bebidas', 'caja abarrotes', 'caja frutas')):
        prod.instance(n, (0, -0.06 + k * 0.03, 0.05 + k * 0.27), 0.1 * (k - 1), 0.75, coll)


def bolsa_compras(coll):
    b = box('bolsa', (0, 0, 0.2), (0.14, 0.09, 0.2), coll, 'madera', p=4)
    clay.set_material(b, u('bolsa papel'))
    prod.instance('pan', (0.02, 0.0, 0.3), 1.2, 0.8, coll).rotation_euler = (0.6, 0, 1.2)
    prod.instance('leche', (-0.06, 0.02, 0.28), 0.0, 0.6, coll)
    prod.instance('zanahoria', (0.07, 0.03, 0.32), 0.0, 0.7, coll)


def dinero(coll):
    for k in range(5):
        clay.lathe(f'moneda {k}', [(0.07, k * 0.022), (0.075, k * 0.022 + 0.011), (0.07, k * 0.022 + 0.02)], coll, u('oro'), segments=24).location.x = -0.12
    for k in range(3):
        b = box(f'billete {k}', (0.12, 0.0, 0.01 + k * 0.012), (0.14, 0.07, 0.005), coll, 'amarillo', p=8)
        clay.set_material(b, u('billete'))
        b.rotation_euler = (0, 0, 0.15 * k)


# --------------------------------------------------------------------------
# Limpieza y problemas (y ayudas de modelado compartidas)
# --------------------------------------------------------------------------

def _nuevos(coll, fn):
    """Ejecuta fn y devuelve los objetos que creó en coll."""
    before = set(coll.objects)
    fn()
    return [o for o in coll.objects if o not in before]


def _ring(name, c, r, axis, tube, coll, mat, n=20):
    """Aro (toro) de radio r alrededor del eje 'z' o 'y' centrado en c."""
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        if axis == 'z':
            pts.append((c[0] + r * math.cos(a), c[1] + r * math.sin(a), c[2]))
        else:
            pts.append((c[0] + r * math.cos(a), c[1], c[2] + r * math.sin(a)))
    return clay.sweep(name, pts, tube, (1, 1), coll, mat, segments=6, samples=3, closed=True)


def _rueda_giratoria(coll, x, y, r=0.035):
    clay.blob('soporte rueda', (x, y, 2 * r + 0.012), (0.022, 0.022, 0.014), coll, m('acero'), n=4)
    for sx in (-1, 1):
        clay.sweep('horquilla', [(x + sx * 0.018, y, 2 * r + 0.008), (x + sx * 0.018, y - 0.012, r)], 0.006, (1, 1), coll, m('acero'), segments=5, samples=2)
    wheel(coll, (x, y - 0.012, r), r, 0.014)


def trapero_balde(coll):
    """Balde de aseo con ruedas, escurridor de palanca, agua jabonosa y trapero de flecos."""
    box('base balde', (0, 0, 0.075), (0.25, 0.2, 0.025), coll, 'acero', p=6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            _rueda_giratoria(coll, sx * 0.2, sy * 0.15)
    clay.lathe('balde', [(0.0, 0.1), (0.17, 0.1), (0.2, 0.44), (0.226, 0.455), (0.21, 0.462)], coll, u('amarillo aviso'), segments=32, cap_top=False)
    for z, r in ((0.2, 0.184), (0.33, 0.198)):
        _ring('aro balde', (0, 0, z), r, 'z', 0.01, coll, u('amarillo oscuro'), n=28)
    clay.lathe('agua jabonosa', [(0.0, 0.4), (0.2, 0.4)], coll, u('agua jabon'), segments=32, cap_bottom=False)
    rng = np.random.default_rng(7)
    for k in range(9):
        a, rr = rng.uniform(0, 2 * math.pi), rng.uniform(0.02, 0.15)
        s = rng.uniform(0.015, 0.04)
        clay.blob(f'espuma {k}', (rr * math.cos(a), rr * math.sin(a) - 0.02, 0.405 + s * 0.5), (s, s, s * 0.8), coll, u('espuma'), n=5)
    # Asa de alambre con agarradera
    clay.sweep('asa balde', [(-0.225, 0.0, 0.44), (-0.18, -0.03, 0.6), (0.18, -0.03, 0.6), (0.225, 0.0, 0.44)], 0.008, (1, 1), coll, m('acero'),
               segments=6, samples=5)
    clay.sweep('agarradera', [(-0.07, -0.03, 0.61), (0.07, -0.03, 0.61)], 0.02, (1, 1), coll, m('negro'), segments=8, samples=2)
    # Escurridor atrás con palanca
    clay.rbox('escurridor', (0, 0.15, 0.53), (0.13, 0.07, 0.08), coll, u('gris claro'), p=4)
    for k in range(4):
        box('rejilla escurridor', (-0.075 + k * 0.05, 0.08, 0.53), (0.012, 0.006, 0.06), coll, 'negro', p=4, n=4)
    clay.sweep('palanca', [(0.1, 0.16, 0.6), (0.14, 0.2, 0.85), (0.16, 0.22, 1.0)], 0.014, (1, 1), coll, m('acero'), segments=6, samples=4)
    clay.sweep('mango palanca', [(0.155, 0.22, 0.98), (0.17, 0.225, 1.08)], 0.024, (1, 1), coll, m('negro'), segments=8, samples=2)
    # Trapero: palo, agarre y flecos que asoman del agua
    clay.sweep('palo trapero', [(-0.06, -0.02, 0.36), (-0.14, 0.12, 1.1), (-0.18, 0.18, 1.52)], 0.018, (1, 1), coll, m('madera'), segments=8, samples=3)
    clay.sweep('agarre trapero', [(-0.172, 0.17, 1.44), (-0.185, 0.19, 1.58)], 0.026, (1, 1), coll, m('celeste'), segments=8, samples=2)
    clay.blob('tapa palo', (-0.186, 0.19, 1.6), (0.028, 0.028, 0.02), coll, m('celeste'), n=4)
    for k in range(14):
        a = 2 * math.pi * k / 14
        p0 = (-0.06 + 0.02 * math.cos(a), -0.02 + 0.02 * math.sin(a), 0.38)
        p1 = (-0.06 + 0.1 * math.cos(a), -0.02 + 0.09 * math.sin(a), 0.43 + 0.03 * math.sin(3 * a))
        p2 = (-0.06 + 0.14 * math.cos(a + 0.3), -0.02 + 0.12 * math.sin(a + 0.3), 0.405)
        clay.sweep(f'fleco {k}', [p0, p1, p2], [0.016, 0.014, 0.01], (1, 1), coll, u('fleco'), segments=6, samples=3)
    # Etiqueta con gota
    clay.rbox('etiqueta balde', (0, -0.205, 0.27), (0.07, 0.01, 0.055), coll, m('blanco'), p=4, n=4).rotation_euler = (-0.08, 0, 0)
    clay.blob('gota etiqueta', (0, -0.218, 0.262), (0.022, 0.006, 0.03), coll, m('celeste'), n=5,
              shaper=lambda v: np.where(v[:, 2:3] > 0, v * np.array([0.45, 1, 1.25]), v))


def charco(coll):
    """Derrame: charco brillante con ondas y salpicaduras junto a la botella volcada."""
    pts = []
    for k in range(20):
        a = 2 * math.pi * k / 20
        r = 0.3 + 0.07 * math.sin(3 * a) + 0.04 * math.cos(5 * a) + 0.02 * math.sin(9 * a)
        pts.append((math.cos(a) * r, math.sin(a) * r * 0.75, 0.004))
    verts = [(0, 0, 0.014)] + pts
    faces = [(0, i + 1, (i + 1) % len(pts) + 1) for i in range(len(pts))]
    o = clay.make_mesh_object('charco', verts, faces, coll, material=u('charco'))
    clay.add_subsurf(o, 2, 3)
    inner = clay.make_mesh_object('charco claro', [(x * 0.62 + 0.03, y * 0.62 - 0.02, 0.018) for x, y, _ in [(0, 0, 0)] + pts],
                                  faces, coll, material=u('charco claro'))
    clay.add_subsurf(inner, 2, 3)
    for k, r in enumerate((0.07, 0.13)):
        pts_r = [(0.03 + r * math.cos(a), -0.02 + r * 0.75 * math.sin(a), 0.021) for a in np.linspace(0, 2 * math.pi, 18, endpoint=False)]
        clay.sweep(f'onda {k}', pts_r, 0.005, (0.35, 1), coll, u('espuma'), segments=5, samples=3, closed=True, up=(0, 0, 1))
    for k, (x, y, z, s) in enumerate(((0.38, 0.12, 0.006, 0.04), (-0.34, -0.2, 0.006, 0.035), (0.12, 0.33, 0.006, 0.03),
                                      (0.3, -0.26, 0.05, 0.018), (0.2, -0.3, 0.09, 0.013), (0.36, -0.18, 0.12, 0.011))):
        clay.blob(f'gota {k}', (x, y, z), (s, s * 0.8, s * (0.3 if z < 0.01 else 1.0)), coll, u('charco'), n=5)
    clay.blob('brillo charco', (-0.1, 0.08, 0.02), (0.06, 0.02, 0.003), coll, u('espuma'), n=4)
    b = prod.instance('agua', (-0.36, 0.2, 0.06), 0.0, 1.0, coll)
    b.rotation_euler = (math.pi / 2, 0, -2.3)


def basura(coll):
    """Basura en el piso: papel arrugado, cáscara de banano, lata aplastada, envoltura y mal olor."""
    clay.blob('papel arrugado', (0, 0, 0.06), (0.07, 0.07, 0.06), coll, u('papel'), n=8,
              shaper=lambda v: v * (1 + 0.16 * np.sin(v[:, 0] * 70) * np.cos(v[:, 1] * 60) + 0.08 * np.sin(v[:, 2] * 90))[:, None])
    for k in range(3):
        a = k * 2.1
        clay.sweep(f'pliegue {k}', [(0.05 * math.cos(a), 0.05 * math.sin(a), 0.1), (0.07 * math.cos(a + 0.5), 0.07 * math.sin(a + 0.5), 0.05)],
                   0.006, (0.4, 1), coll, u('papel sombra'), segments=5, samples=2)
    # Cáscara de banano: tallo y tres gajos abiertos y curvos
    cx, cy = 0.2, 0.02
    clay.sweep('tallo cáscara', [(cx, cy, 0.035), (cx - 0.02, cy + 0.01, 0.07)], [0.014, 0.01], (1, 1), coll, prod.mat('cafe tallo'), segments=6, samples=2)
    for k in range(3):
        a = -0.6 + k * 1.3
        d = np.array([math.cos(a), math.sin(a)])
        p = [(cx + d[0] * t, cy + d[1] * t, 0.03 + 0.025 * math.sin(t * 20)) for t in (0.0, 0.05, 0.1, 0.14)]
        clay.sweep(f'gajo cáscara {k}', p, [0.02, 0.028, 0.022, 0.008], (0.3, 1), coll, prod.mat('amarillo banano'), segments=6, samples=4, up=(0, 0, 1))
        tip = p[-1]
        clay.blob(f'punta gajo {k}', (tip[0], tip[1], tip[2]), (0.012, 0.012, 0.005), coll, prod.mat('cafe tallo'), n=3)
    # Lata aplastada tendida
    lata = clay.lathe('lata aplastada', [(0.0, -0.05), (0.035, -0.05), (0.04, -0.045), (0.036, 0.0), (0.041, 0.045), (0.035, 0.05), (0.0, 0.05)], coll,
                      prod.mat('rojo'), segments=16)
    lata.location = (-0.12, 0.14, 0.03)
    lata.rotation_euler = (math.pi / 2, 0, 0.7)
    lata.scale = (1, 0.7, 1)
    # Envoltura de dulce con puntas torcidas
    clay.blob('envoltura', (-0.14, -0.1, 0.02), (0.04, 0.025, 0.018), coll, m('rosa'), n=5)
    for sx in (-1, 1):
        clay.blob('punta envoltura', (-0.14 + sx * 0.055, -0.1, 0.02), (0.02, 0.022, 0.012), coll, m('rosa'), n=4)
    for k in range(5):
        clay.blob(f'migaja {k}', (0.05 * k - 0.08, -0.2 + 0.02 * (k % 2), 0.006), (0.01, 0.009, 0.006), coll, prod.mat('galleta'), n=3)
    # Rayitas de mal olor
    for k, x in enumerate((-0.04, 0.04, 0.12)):
        pts = [(x + 0.03 * math.sin(t * 40 + k), 0.0, 0.15 + t + 0.02 * k) for t in np.linspace(0, 0.13, 7)]
        clay.sweep(f'mal olor {k}', pts, [0.006, 0.01, 0.011, 0.011, 0.009, 0.007, 0.004], (1, 1), coll, u('mal olor'), segments=5, samples=3)


def caneca(coll):
    """Caneca de reciclaje: tapa vaivén, pedal, ruedas, costillas y símbolo de reciclaje."""
    clay.lathe('caneca', [(0.0, 0.03), (0.23, 0.03), (0.24, 0.06), (0.28, 0.74), (0.29, 0.76)], coll, u('azul caneca'), segments=36, cap_top=False)
    for k in range(10):
        a = 2 * math.pi * (k + 0.5) / 10
        if abs(math.sin(a) + 1) < 0.35:
            continue  # sin costilla detrás del símbolo
        r0, r1 = 0.245, 0.283
        clay.sweep(f'costilla {k}', [(r0 * math.cos(a), r0 * math.sin(a), 0.1), (r1 * math.cos(a), r1 * math.sin(a), 0.7)], 0.012, (1, 1), coll,
                   u('azul oscuro'), segments=5, samples=2)
    clay.lathe('tapa', [(0.0, 0.76), (0.305, 0.76), (0.305, 0.8), (0.24, 0.87), (0.0, 0.89)], coll, u('azul oscuro'), segments=36)
    box('boca vaivén', (0, -0.18, 0.86), (0.12, 0.03, 0.035), coll, 'negro', p=4)
    box('tapa vaivén', (0, -0.19, 0.87), (0.11, 0.02, 0.03), coll, 'celeste', p=4).rotation_euler = (-0.5, 0, 0)
    box('pedal', (0, -0.3, 0.04), (0.08, 0.06, 0.018), coll, 'negro', p=4)
    for sx in (-1, 1):
        wheel(coll, (sx * 0.2, 0.2, 0.05), 0.05, 0.02)
    # Símbolo de reciclaje: tres flechas que se persiguen, con punta
    cz, R = 0.42, 0.085
    for k in range(3):
        a0 = math.pi / 2 + k * 2 * math.pi / 3 + 0.25
        arc = [(R * math.cos(a0 + t), -0.29, cz + R * math.sin(a0 + t)) for t in np.linspace(0, 1.45, 5)]
        clay.sweep(f'flecha reciclaje {k}', arc, 0.017, (1, 0.6), coll, u('verde'), segments=6, samples=3, up=(0, -1, 0))
        a1 = a0 + 1.6
        tip = (R * math.cos(a1), -0.292, cz + R * math.sin(a1))
        t_dir = (-math.sin(a1), math.cos(a1))
        n_dir = (math.cos(a1), math.sin(a1))
        v = [(tip[0] + t_dir[0] * 0.035, tip[1], tip[2] + t_dir[1] * 0.035),
             (tip[0] - t_dir[0] * 0.01 + n_dir[0] * 0.035, tip[1], tip[2] - t_dir[1] * 0.01 + n_dir[1] * 0.035),
             (tip[0] - t_dir[0] * 0.01 - n_dir[0] * 0.035, tip[1], tip[2] - t_dir[1] * 0.01 - n_dir[1] * 0.035)]
        head = clay.make_mesh_object(f'punta flecha {k}', v, [(0, 1, 2)], coll, material=u('verde'))
        clay.add_solidify(head, 0.02, 0.0)
    clay.rbox('etiqueta caneca', (0, -0.283, 0.62), (0.1, 0.008, 0.03), coll, m('blanco'), p=4, n=4)


def cono(coll):
    """Aviso de piso mojado: caballete amarillo con muñequito resbalando, franjas y patas de goma."""
    th, hh = 0.2, 0.32
    for sy, rot in ((-1, -th), (1, th)):
        panel = box('aviso piso mojado', (0, 0, 0), (0.18, 0.016, hh), coll, 'amarillo', p=5)
        panel.material_slots[0].material = u('amarillo aviso')
        panel.location = (0, sy * hh * math.sin(th), 0.03 + hh * math.cos(th))
        panel.rotation_euler = (rot, 0, 0)
        yf = sy * 0.02
        parts = []
        tri = [(-0.13, yf, 0.0), (0.13, yf, 0.0), (0.0, yf, 0.23)]
        parts.append(clay.sweep('triángulo aviso', tri, 0.013, (1, 1), coll, u('trazo'), segments=6, samples=2, closed=True))
        # Muñequito resbalando dentro del triángulo
        parts.append(clay.blob('cabeza muñequito', (0.025, yf, 0.15), (0.018, 0.006, 0.018), coll, u('trazo'), n=4))
        for a, b_, r in (((0.018, 0.13), (-0.01, 0.07), 0.009), ((-0.01, 0.07), (-0.05, 0.03), 0.008), ((-0.01, 0.07), (0.04, 0.035), 0.008),
                         ((0.012, 0.115), (0.06, 0.1), 0.007), ((0.012, 0.115), (-0.04, 0.12), 0.007)):
            parts.append(clay.sweep('trazo muñequito', [(a[0], yf, a[1]), (b_[0], yf, b_[1])], r, (1, 1), coll, u('trazo'), segments=5, samples=2))
        for k in range(3):
            parts.append(clay.sweep('gota piso', [(-0.07 + k * 0.05, yf, 0.018), (-0.05 + k * 0.05, yf, 0.018)], 0.006, (1, 1), coll, u('trazo'),
                                    segments=5, samples=2))
        # Barras de texto y franjas de advertencia
        for k, w in enumerate((0.12, 0.09)):
            parts.append(box('texto aviso', (0, yf, -0.07 - k * 0.045), (w, 0.005, 0.014), coll, 'negro', p=4, n=4))
        for k in range(5):
            f = clay.rbox('franja advertencia', (0, 0, 0), (0.018, 0.005, 0.04), coll, u('trazo'), p=4, n=4)
            f.location = (-0.13 + k * 0.065, yf, -0.25)
            f.rotation_euler = (0, 0.6, 0)
            parts.append(f)
        for o in parts:
            o.parent = panel
        for sx in (-1, 1):
            foot = clay.blob('pata goma', (sx * 0.15, sy * (2 * hh * math.sin(th) - 0.01), 0.02), (0.035, 0.03, 0.02), coll, m('negro'), n=4)
            del foot
    box('bisagra aviso', (0, 0, 0.03 + 2 * hh * math.cos(th)), (0.17, 0.026, 0.022), coll, 'amarillo', p=5).material_slots[0].material = u('amarillo oscuro')
    clay.sweep('asa aviso', [(-0.07, 0, 0.66), (-0.06, 0, 0.74), (0.06, 0, 0.74), (0.07, 0, 0.66)], 0.013, (1, 1), coll, u('trazo'), segments=6, samples=4)


# --------------------------------------------------------------------------
# Decoración y seguridad
# --------------------------------------------------------------------------

def planta(coll):
    """Planta en matera pintada: plato, tierra con piedritas, hojas con nervio y flores de cinco pétalos."""
    clay.lathe('plato matera', [(0.0, 0.0), (0.2, 0.0), (0.22, 0.03), (0.2, 0.035), (0.0, 0.03)], coll, u('matera oscura'), segments=32)
    clay.lathe('matera', [(0.0, 0.03), (0.14, 0.03), (0.19, 0.3), (0.215, 0.31), (0.225, 0.36), (0.2, 0.37)], coll, u('matera'), segments=32,
               cap_top=False)
    for k in range(10):
        a = 2 * math.pi * k / 10
        clay.blob(f'punto matera {k}', (0.19 * math.cos(a), 0.19 * math.sin(a), 0.2), (0.022, 0.022, 0.022), coll, u('matera clara'), n=4)
    clay.lathe('tierra', [(0.0, 0.33), (0.2, 0.33)], coll, u('tierra'), segments=32, cap_bottom=False)
    rng = np.random.default_rng(11)
    for k in range(6):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0.05, 0.17)
        clay.blob(f'piedrita {k}', (r * math.cos(a), r * math.sin(a), 0.338), (0.018, 0.014, 0.01), coll, u('piedra'), n=3)
    for k in range(11):
        a = k * 2.4 + rng.uniform(-0.2, 0.2)
        L = rng.uniform(0.32, 0.55)
        base = np.array([0, 0, 0.34])
        mid = base + np.array([math.cos(a) * L * 0.25, math.sin(a) * L * 0.25, L * 0.75])
        tip = base + np.array([math.cos(a) * L * 0.62, math.sin(a) * L * 0.62, L * 0.95])
        mat = u('hoja') if k % 3 else u('hoja oscura')
        clay.sweep(f'hoja {k}', [base, mid, tip], [0.012, 0.075, 0.006], (0.18, 1), coll, mat, segments=6, samples=5,
                   caps=('flat', 'point'), up=(math.cos(a), math.sin(a), 0.4))
        clay.sweep(f'nervio {k}', [base + (mid - base) * 0.3 + [0, 0, 0.005], mid + [0, 0, 0.012], tip * 0.97 + base * 0.03], 0.004, (1, 1), coll,
                   u('nervio'), segments=4, samples=4)
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.5
        c = np.array([math.cos(a) * 0.12, math.sin(a) * 0.12, 0.68 + 0.05 * k])
        clay.sweep(f'tallo flor {k}', [(0, 0, 0.36), c - [0, 0, 0.02]], 0.007, (1, 1), coll, u('hoja oscura'), segments=4, samples=2)
        for j in range(5):
            b = 2 * math.pi * j / 5
            clay.blob(f'pétalo {k}{j}', (c[0] + 0.032 * math.cos(b), c[1] + 0.032 * math.sin(b), c[2]), (0.03, 0.03, 0.012), coll, u('flor'), n=4)
        clay.blob(f'centro flor {k}', tuple(c + [0, 0, 0.008]), (0.018, 0.018, 0.012), coll, u('estrella'), n=4)


def globos(coll):
    """Racimo de globos con nudos, brillos, un globo corazón, cintas rizadas y pesita de regalo."""
    pear = lambda v: v * np.where(v[:, 2:3] < 0, np.array([0.82, 0.82, 1.0]), 1.0)
    specs = ((0.0, 0.0, 1.42, 'globo rosa'), (0.22, 0.06, 1.3, 'globo menta'), (-0.2, 0.03, 1.28, 'globo lila'), (0.08, -0.08, 1.12, 'globo amarillo'))
    for k, (x, y, z, key) in enumerate(specs):
        clay.blob(f'globo {k}', (x, y, z), (0.13, 0.13, 0.16), coll, u(key), n=10, shaper=pear)
        clay.blob(f'nudo {k}', (x, y, z - 0.168), (0.02, 0.02, 0.016), coll, u(key), n=4)
        clay.blob(f'brillo globo {k}', (x - 0.05, y - 0.1, z + 0.06), (0.025, 0.012, 0.04), coll, u('espuma'), n=4)
        pts = [(x, y, z - 0.18)] + [(x * (1 - t) + 0.03 * math.sin(t * 14 + k), y * (1 - t) + 0.03 * math.cos(t * 14 + k), (z - 0.18) * (1 - t) + 0.14 * t)
                                     for t in np.linspace(0.08, 1, 12)]
        clay.sweep(f'cinta {k}', pts, 0.005, (0.35, 1), coll, u(key), segments=4, samples=3)
    # Globo corazón (el de la pareja)
    objs = _nuevos(coll, lambda: corazon(coll))
    for o in objs:
        o.scale = (0.75, 0.75, 0.75)
        o.location = (-0.02, 0.1, 1.38)
    clay.sweep('cinta corazón', [(-0.02, 0.1, 1.41), (0.0, 0.05, 0.8), (0.0, 0.0, 0.14)], 0.004, (1, 1), coll, u('hilo'), segments=4, samples=4)
    # Pesita en forma de regalo
    box('regalo', (0, 0, 0.065), (0.07, 0.07, 0.065), coll, 'coral', p=5)
    box('cinta regalo x', (0, 0, 0.066), (0.075, 0.016, 0.068), coll, 'amarillo', p=5)
    box('cinta regalo y', (0, 0, 0.066), (0.016, 0.075, 0.068), coll, 'amarillo', p=5)
    for sx in (-1, 1):
        clay.blob('moño regalo', (sx * 0.025, 0, 0.14), (0.028, 0.012, 0.018), coll, m('amarillo'), n=4)


def parlante(coll):
    """Parlante de madera con rejilla, dos conos, tweeter, perillas, luz y notas musicales de colores."""
    box('caja parlante', (0, 0, 0.4), (0.2, 0.16, 0.36), coll, 'madera oscura', p=6)
    box('frente parlante', (0, -0.158, 0.37), (0.17, 0.008, 0.3), coll, 'negro', p=6).material_slots[0].material = u('rejilla')
    for sx in (-1, 1):
        box('pata parlante', (sx * 0.14, 0, 0.02), (0.03, 0.12, 0.02), coll, 'negro', p=4)
    for z, r in ((0.5, 0.115), (0.22, 0.07)):
        cone = clay.lathe('cono parlante', [(r, 0), (r * 0.35, -0.035), (0.0, -0.03)], coll, u('gris oscuro'), segments=24)
        cone.rotation_euler = (math.pi / 2, 0, 0)
        cone.location = (0, -0.165, z)
        _ring('aro parlante', (0, -0.168, z), r, 'y', 0.013, coll, m('acero'), n=22)
        clay.blob('centro parlante', (0, -0.14, z), (r * 0.3, 0.022, r * 0.3), coll, m('acero'), n=5)
    clay.blob('tweeter', (0.1, -0.165, 0.64), (0.03, 0.015, 0.03), coll, m('acero'), n=5)
    box('barra perillas', (0, -0.02, 0.765), (0.17, 0.12, 0.012), coll, 'negro', p=6)
    for k, x in enumerate((-0.1, -0.03, 0.04)):
        clay.lathe(f'perilla {k}', [(0.0, 0.0), (0.022, 0.0), (0.02, 0.03), (0.0, 0.032)], coll, m('blanco' if k else 'coral'), segments=14).location = \
            (x, -0.06, 0.777)
    clay.blob('luz encendido', (0.12, -0.06, 0.785), (0.012, 0.012, 0.01), coll, m('pantalla'), n=4)
    clay.sweep('manija parlante', [(-0.1, 0, 0.76), (-0.08, 0, 0.84), (0.08, 0, 0.84), (0.1, 0, 0.76)], 0.016, (1, 1), coll, m('negro'), segments=6, samples=4)
    notes = ((0.3, 0.72, 'rosa', 1), (0.42, 0.94, 'menta', 2), (0.27, 1.08, 'lila', 1), (0.46, 1.2, 'amarillo', 1))
    for k, (x, z, col, kind) in enumerate(notes):
        if kind == 2:
            for dx in (0.0, 0.09):
                clay.sweep(f'plica {k}', [(x + dx, -0.1, z + dx * 0.3), (x + dx, -0.1, z + 0.14 + dx * 0.3)], 0.009, (1, 1), coll, m(col), segments=5, samples=2)
                clay.blob(f'cabeza nota {k}', (x + dx - 0.028, -0.1, z + dx * 0.3), (0.032, 0.018, 0.025), coll, m(col), n=4)
            clay.sweep(f'barra nota {k}', [(x, -0.1, z + 0.14), (x + 0.09, -0.1, z + 0.167)], 0.014, (0.5, 1), coll, m(col), segments=5, samples=2)
        else:
            clay.sweep(f'plica {k}', [(x, -0.1, z), (x, -0.1, z + 0.13)], 0.009, (1, 1), coll, m(col), segments=5, samples=2)
            clay.blob(f'cabeza nota {k}', (x - 0.028, -0.1, z), (0.032, 0.018, 0.025), coll, m(col), n=4)
            clay.sweep(f'bandera nota {k}', [(x, -0.1, z + 0.13), (x + 0.04, -0.1, z + 0.09), (x + 0.03, -0.1, z + 0.06)], 0.008, (1, 1), coll, m(col),
                       segments=5, samples=3)


def letrero_oferta(coll):
    """Pizarra de oferta en caballete: estallido rojo con %, dibujos de tiza y bandeja de tizas."""
    for sx in (-1, 1):
        clay.sweep('pata', [(sx * 0.24, -0.08, 0.0), (sx * 0.2, 0.0, 0.92)], 0.022, (1, 1), coll, m('madera oscura'), segments=6, samples=2)
    clay.sweep('pata trasera', [(0, 0.28, 0.0), (0, 0.02, 0.9)], 0.02, (1, 1), coll, m('madera oscura'), segments=6, samples=2)
    box('marco', (0, 0.0, 0.62), (0.3, 0.025, 0.36), coll, 'madera', p=6)
    box('tablero', (0, -0.02, 0.62), (0.26, 0.02, 0.32), coll, 'pizarra', p=6)
    box('bandeja tizas', (0, -0.06, 0.28), (0.26, 0.04, 0.012), coll, 'madera', p=6)
    for k, (x, col) in enumerate(((-0.12, 'tiza'), (-0.05, 'rosa'), (0.06, 'amarillo'))):
        clay.sweep(f'tiza {k}', [(x, -0.065, 0.3), (x + 0.05, -0.07, 0.3)], 0.009, (1, 1), coll, m(col), segments=5, samples=2)
    # Estallido de oferta
    pts = []
    for k in range(24):
        a = 2 * math.pi * k / 24
        r = 0.12 if k % 2 == 0 else 0.09
        pts.append((0.02 + r * math.cos(a), -0.045, 0.78 + r * math.sin(a)))
    burst = clay.make_mesh_object('estallido oferta', [(0.02, -0.045, 0.78)] + pts, [(0, i + 1, (i + 1) % 24 + 1) for i in range(24)], coll,
                                  material=u('rojo'))
    clay.add_solidify(burst, 0.012, 0.0)
    for dx, dz in ((-0.03, 0.03), (0.07, -0.03)):
        _ring('porcentaje', (0.02 + dx, -0.06, 0.78 + dz), 0.018, 'y', 0.007, coll, m('blanco'), n=12)
    clay.sweep('barra porcentaje', [(0.08, -0.06, 0.84), (-0.04, -0.06, 0.72)], 0.008, (1, 1), coll, m('blanco'), segments=5, samples=2)
    # Dibujos de tiza: manzana, líneas de texto y precio encerrado
    _ring('manzana tiza', (-0.16, -0.045, 0.58), 0.045, 'y', 0.006, coll, u('tiza roja'), n=16)
    clay.blob('hoja tiza', (-0.14, -0.045, 0.64), (0.02, 0.004, 0.01), coll, u('tiza verde'), n=3)
    for k, w in enumerate((0.14, 0.1)):
        clay.sweep(f'texto tiza {k}', [(-0.08, -0.045, 0.6 - k * 0.07), (-0.08 + w * 2, -0.045, 0.6 - k * 0.07)], 0.008, (1, 1), coll, m('tiza'),
                   segments=5, samples=2)
    _ring('precio tiza', (0.14, -0.045, 0.42), 0.055, 'y', 0.006, coll, u('tiza amarilla'), n=16)
    clay.sweep('cifra tiza', [(0.12, -0.045, 0.4), (0.14, -0.045, 0.45), (0.16, -0.045, 0.4)], 0.007, (1, 1), coll, u('tiza amarilla'), segments=5, samples=3)
    for sx in (-1, 1):
        clay.blob('esquinero', (sx * 0.28, -0.03, 0.96), (0.03, 0.012, 0.03), coll, m('coral'), n=4)


def camara(coll):
    """Cámara de seguridad con soporte, cable, visera, aros de lente, luces infrarrojas y letrero de zona vigilada."""
    box('placa pared', (0, 0.17, 0.22), (0.075, 0.015, 0.11), coll, 'blanco', p=5)
    for sx in (-1, 1):
        for sz in (-1, 1):
            clay.blob('tornillo', (sx * 0.05, 0.155, 0.22 + sz * 0.08), (0.01, 0.005, 0.01), coll, m('acero'), n=3)
    clay.sweep('brazo', [(0, 0.16, 0.26), (0, 0.07, 0.31), (0, -0.0, 0.27)], 0.024, (1, 1), coll, m('acero'), segments=8, samples=4)
    clay.blob('rótula', (0, -0.005, 0.262), (0.035, 0.035, 0.035), coll, m('acero'), n=5)
    clay.sweep('cable', [(0.04, 0.16, 0.14), (0.07, 0.1, 0.1), (0.06, 0.0, 0.14), (0.03, -0.04, 0.16)], 0.008, (1, 1), coll, m('negro'), segments=5, samples=4)
    body = box('cuerpo', (0, -0.08, 0.19), (0.085, 0.16, 0.075), coll, 'blanco', p=4)
    del body
    box('visera', (0, -0.12, 0.27), (0.1, 0.16, 0.012), coll, 'blanco', p=6)
    for k in range(3):
        box('ranura', (0, -0.02 - k * 0.05, 0.284), (0.07, 0.008, 0.004), coll, 'acero', p=4, n=4)
    lente = clay.lathe('lente', [(0.06, 0), (0.055, 0.02), (0.045, 0.04)], coll, m('negro'), segments=24)
    lente.rotation_euler = (math.pi / 2, 0, 0)
    lente.location = (0, -0.235, 0.19)
    _ring('aro lente', (0, -0.245, 0.19), 0.058, 'y', 0.007, coll, m('acero'), n=20)
    _ring('aro lente interior', (0, -0.27, 0.19), 0.036, 'y', 0.005, coll, u('azul oscuro'), n=16)
    for k in range(8):
        a = 2 * math.pi * k / 8
        clay.blob(f'led ir {k}', (0.047 * math.cos(a), -0.262, 0.19 + 0.047 * math.sin(a)), (0.006, 0.004, 0.006), coll, m('luz roja'), n=3)
    clay.blob('brillo lente', (0.012, -0.277, 0.2), (0.012, 0.004, 0.012), coll, m('blanco'), n=4)
    clay.blob('luz estado', (0.06, -0.23, 0.245), (0.012, 0.012, 0.012), coll, m('luz roja'), n=4)
    # Letrero «zona vigilada» debajo
    box('letrero vigilado', (-0.22, 0.17, 0.2), (0.1, 0.012, 0.07), coll, 'amarillo', p=5).material_slots[0].material = u('amarillo aviso')
    box('icono cámara', (-0.21, 0.155, 0.21), (0.035, 0.006, 0.02), coll, 'negro', p=4)
    clay.blob('lente icono', (-0.255, 0.155, 0.21), (0.012, 0.006, 0.012), coll, m('negro'), n=3)
    box('texto vigilado', (-0.22, 0.155, 0.16), (0.07, 0.005, 0.009), coll, 'negro', p=4, n=4)


# --------------------------------------------------------------------------
# Máquinas especiales
# --------------------------------------------------------------------------

def _mueble(coll, W, D, body, top='blanco', doors='blanco'):
    """Mueble de mostrador de 0.9 m con tapa y dos puertas con manijas."""
    box('mueble', (0, 0, 0.45), (W, D, 0.45), coll, body, p=6)
    box('tapa mueble', (0, 0, 0.92), (W + 0.02, D + 0.02, 0.03), coll, top, p=8)
    for sx in (-1, 1):
        box('puerta mueble', (sx * W * 0.47, -D - 0.004, 0.44), (W * 0.42, 0.012, 0.34), coll, doors, p=6)
        clay.blob('manija mueble', (sx * W * 0.12, -D - 0.025, 0.6), (0.014, 0.014, 0.05), coll, m('acero'), n=4)


def maquina_malteadas(coll):
    _mueble(coll, 0.42, 0.28, 'rosa')
    for k, x in enumerate((-0.2, 0.2)):
        box(f'base batidora {k}', (x, 0.04, 0.98), (0.08, 0.11, 0.03), coll, 'menta', p=5)
        box(f'columna batidora {k}', (x, 0.11, 1.17), (0.05, 0.04, 0.2), coll, 'menta', p=5)
        box(f'cabezal batidora {k}', (x, 0.01, 1.38), (0.065, 0.14, 0.065), coll, 'menta', p=4)
        clay.sweep(f'vástago {k}', [(x, -0.07, 1.32), (x, -0.07, 1.1)], 0.009, (1, 1), coll, m('acero'), segments=6, samples=2)
        vaso = clay.lathe(f'vaso metálico {k}', [(0.045, 0.0), (0.062, 0.17)], coll, m('acero'), segments=20, cap_top=False)
        vaso.location = (x, -0.07, 1.01)
        batido = clay.lathe(f'batido {k}', [(0.043, 0.005), (0.058, 0.14)], coll, prod.mat('helado'), segments=20)
        batido.location = (x, -0.07, 1.01)
    prod.instance('malteada', (0.0, -0.16, 0.95), 0, 0.9, coll)
    box('letrero malteadas', (0, 0.25, 1.62), (0.2, 0.025, 0.08), coll, 'rosa', p=4)
    for k in range(3):
        clay.blob(f'adorno letrero {k}', ((k - 1) * 0.1, 0.22, 1.62), (0.025, 0.008, 0.025), coll, m('blanco'), n=4)
    clay.sweep('poste letrero', [(0, 0.25, 0.95), (0, 0.25, 1.54)], 0.015, (1, 1), coll, m('acero'), segments=6, samples=2)


def cafetera(coll):
    _mueble(coll, 0.5, 0.3, 'madera oscura', top='blanco', doors='madera')
    box('máquina café', (0, 0.08, 1.16), (0.3, 0.18, 0.2), coll, 'coral', p=4)
    box('calientatazas', (0, 0.08, 1.37), (0.26, 0.15, 0.015), coll, 'acero', p=8)
    for k, x in enumerate((-0.14, 0.0, 0.14)):
        t = clay.lathe(f'taza arriba {k}', [(0.03, 0.0), (0.04, 0.05)], coll, m('blanco'), segments=16, cap_top=False)
        t.location = (x, 0.1, 1.385)
    clay.blob('manómetro', (0, -0.1, 1.27), (0.045, 0.012, 0.045), coll, m('blanco'), n=5)
    clay.blob('aguja', (0.012, -0.114, 1.28), (0.022, 0.003, 0.005), coll, u('trazo'), n=3)
    box('bandeja goteo', (0, -0.17, 0.97), (0.26, 0.08, 0.02), coll, 'acero', p=8)
    for sx in (-1, 1):
        x = sx * 0.13
        clay.blob('grupo', (x, -0.11, 1.08), (0.055, 0.045, 0.035), coll, m('acero'), n=5)
        clay.blob('portafiltro', (x, -0.13, 1.04), (0.045, 0.04, 0.02), coll, m('acero'), n=5)
        clay.sweep('mango portafiltro', [(x, -0.15, 1.04), (x + sx * 0.03, -0.3, 1.035)], 0.017, (1, 1), coll, m('negro'), segments=8, samples=2)
        prod.instance('cafe', (x, -0.15, 0.99), 0, 0.55, coll)
    clay.sweep('vaporizador', [(0.27, -0.08, 1.14), (0.29, -0.13, 1.05), (0.29, -0.15, 0.99)], 0.01, (1, 1), coll, m('acero'), segments=6, samples=3)
    # Plato de croissants y vasos para llevar a los lados
    clay.lathe('plato', [(0.1, 0.0), (0.11, 0.015)], coll, m('blanco'), segments=20).location = (-0.42, -0.1, 0.95)
    for k in range(3):
        prod.instance('croissant', (-0.45 + k * 0.035, -0.12 + (k % 2) * 0.05, 0.965), 0.4 * k, 0.5, coll)
    for k in range(3):
        prod.instance('cafe', (0.42, -0.12, 0.95 + k * 0.035), 0, 0.6, coll)


def horno_pizza(coll):
    lad = clay.material('Util | ladrillo', '#D07A55', rough=0.8, noise=dict(scale=18, strength=0.4, distance=0.01))
    box('base horno', (0, 0, 0.4), (0.56, 0.5, 0.4), coll, 'blanco', p=6)
    box('leñera', (0, -0.5, 0.36), (0.3, 0.02, 0.18), coll, 'negro', p=4)
    for k, (x, z) in enumerate(((-0.14, 0.26), (0.0, 0.26), (0.14, 0.26), (-0.07, 0.38), (0.07, 0.38))):
        clay.sweep(f'leño {k}', [(x, -0.47, z), (x, -0.56, z)], 0.055, (1, 1), coll, m('madera oscura'), segments=8, samples=2)
    clay.lathe('cúpula', [(0.52, 0.8), (0.52, 0.95), (0.46, 1.15), (0.32, 1.3), (0.0, 1.37)], coll, lad, segments=36)
    ch = clay.lathe('chimenea', [(0.07, 1.2), (0.07, 1.55), (0.09, 1.56), (0.09, 1.62)], coll, lad, segments=16, cap_top=False)
    ch.location = (0, 0.22, 0)
    box('boca', (0, -0.46, 0.99), (0.22, 0.08, 0.13), coll, 'negro', p=3)
    box('fuego', (0, -0.44, 0.9), (0.16, 0.03, 0.04), coll, 'luz', p=5)
    arch = [(0.26 * math.cos(a), -0.52, 0.86 + 0.24 * math.sin(a)) for a in np.linspace(0, math.pi, 12)]
    clay.sweep('arco boca', arch, 0.035, (1, 1), coll, m('blanco'), segments=8, samples=3)
    box('repisa', (0, -0.62, 0.82), (0.42, 0.12, 0.025), coll, 'madera', p=8)
    prod.instance('pizza', (-0.12, -0.62, 0.845), 0, 0.8, coll)
    box('pala', (0.24, -0.64, 0.855), (0.12, 0.1, 0.008), coll, 'madera', p=6)
    clay.sweep('mango pala', [(0.24, -0.54, 0.86), (0.28, -0.1, 0.87)], 0.014, (1, 1), coll, m('madera oscura'), segments=6, samples=2)


def exprimidor(coll):
    _mueble(coll, 0.45, 0.3, 'amarillo', top='blanco', doors='blanco')
    # Rodaja de naranja pintada al frente
    clay.blob('rodaja', (0, -0.33, 0.44), (0.2, 0.012, 0.2), coll, prod.mat('naranja'), n=6)
    clay.blob('rodaja pulpa', (0, -0.342, 0.44), (0.165, 0.008, 0.165), coll, prod.mat('naranja empaque'), n=6)
    for k in range(6):
        a = k * math.pi / 3
        clay.sweep(f'gajo {k}', [(0, -0.352, 0.44), (0.15 * math.cos(a), -0.352, 0.44 + 0.15 * math.sin(a))], 0.008, (1, 1), coll, m('blanco'),
                   segments=6, samples=2)
    # Dispensador de jugo
    box('base dispensador', (0.2, 0.04, 0.99), (0.12, 0.12, 0.04), coll, 'blanco', p=5)
    tank = clay.lathe('tanque', [(0.1, 0.0), (0.11, 0.34)], coll, m('vidrio'), segments=24, cap_top=False)
    tank.location = (0.2, 0.04, 1.03)
    juice = clay.lathe('jugo tanque', [(0.093, 0.01), (0.102, 0.26)], coll, prod.mat('naranja empaque'), segments=24)
    juice.location = (0.2, 0.04, 1.03)
    lid = clay.lathe('tapa tanque', [(0.115, 0.0), (0.08, 0.04), (0.0, 0.05)], coll, m('blanco'), segments=24)
    lid.location = (0.2, 0.04, 1.37)
    box('llave', (0.2, -0.09, 1.02), (0.02, 0.03, 0.02), coll, 'coral', p=4)
    # Exprimidor eléctrico y naranjas
    ex = clay.lathe('exprimidor', [(0.1, 0.0), (0.11, 0.08), (0.12, 0.1), (0.07, 0.1), (0.0, 0.2)], coll, m('blanco'), segments=24)
    ex.location = (-0.2, 0.06, 0.95)
    for k in range(3):
        prod.instance('naranja', (-0.32 + k * 0.12, -0.18, 0.95), 0, 0.5, coll)
    prod.instance('jugo', (0.02, -0.12, 0.95), 0, 0.8, coll)


# --------------------------------------------------------------------------
# Íconos 3D de la interfaz
# --------------------------------------------------------------------------

def globo_pensamiento(coll, producto='leche'):
    clay.blob('nube', (0, 0, 0.5), (0.3, 0.1, 0.22), coll, u('burbuja'), n=8,
              shaper=lambda v: v * (1 + 0.12 * np.cos(np.arctan2(v[:, 2], v[:, 0]) * 6))[:, None])
    for k, (x, z, r) in enumerate(((-0.12, 0.2, 0.05), (-0.2, 0.1, 0.03))):
        clay.blob(f'bolita {k}', (x, 0, z), (r, r, r), coll, u('burbuja'), n=5)
    prod.instance(producto, (0, -0.12, 0.38), 0, 0.9, coll)


def carita(coll, tipo='feliz'):
    key = {'feliz': 'carita feliz', 'media': 'carita media', 'enojada': 'carita enojada'}[tipo]
    clay.blob('carita', (0, 0, 0.2), (0.18, 0.06, 0.18), coll, u(key), n=8)
    for sx in (-1, 1):
        clay.blob('ojo', (sx * 0.06, -0.058, 0.24), (0.018, 0.008, 0.026), coll, u('trazo'), n=4)
    if tipo == 'feliz':
        pts = [(-0.07, -0.058, 0.16), (0, -0.062, 0.12), (0.07, -0.058, 0.16)]
    elif tipo == 'media':
        pts = [(-0.06, -0.06, 0.14), (0, -0.062, 0.14), (0.06, -0.06, 0.14)]
    else:
        pts = [(-0.07, -0.058, 0.12), (0, -0.062, 0.155), (0.07, -0.058, 0.12)]
        for sx in (-1, 1):
            clay.sweep('ceja', [(sx * 0.1, -0.055, 0.31), (sx * 0.03, -0.058, 0.28)], 0.012, (1, 1), coll, u('trazo'), segments=6, samples=2)
    clay.sweep('boca', pts, 0.014, (1, 1), coll, u('trazo'), segments=6, samples=4)


def moneda(coll):
    o = clay.lathe('moneda', [(0.16, -0.02), (0.18, 0.0), (0.16, 0.02)], coll, u('oro'), segments=32)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location.z = 0.2
    clay.blob('signo', (0, -0.025, 0.2), (0.05, 0.01, 0.08), coll, clay.material('Util | oro oscuro', '#C9962E', rough=0.3, metallic=1.0), n=4)


def estrella(coll):
    pts = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        r = 0.2 if k % 2 == 0 else 0.09
        pts.append((math.cos(a) * r, 0, 0.22 + math.sin(a) * r))
    verts = [(0, -0.05, 0.22), (0, 0.05, 0.22)] + pts
    faces = []
    for k in range(10):
        a, b = k + 2, (k + 1) % 10 + 2
        faces.append((0, a, b))
        faces.append((1, b, a))
    o = clay.make_mesh_object('estrella', verts, faces, coll, material=u('estrella'))
    clay.add_subsurf(o, 2, 3)


def corazon(coll):
    """Corazón inflado: dos conos redondeados fundidos (SDF), aplanado de frente."""
    import sdf
    lobes = [sdf.round_cone((sx * 0.078, 0, 0.3), (0, 0, 0.1), 0.1, 0.022) for sx in (-1, 1)]

    def f(P):
        Q = P.copy()
        Q[:, 1] *= 1.8
        return sdf.smin(lobes[0](Q), lobes[1](Q), 0.05)
    sdf.to_mesh('corazón', f, (-0.21, -0.08, 0.04), (0.21, 0.08, 0.44), voxel=0.005, coll=coll, material=u('corazon'), decimate=0.5)
    clay.blob('brillo corazón', (-0.09, -0.052, 0.34), (0.03, 0.008, 0.022), coll, m('blanco'), n=4)


def reloj(coll):
    o = clay.lathe('reloj', [(0.17, -0.03), (0.18, 0.0), (0.17, 0.03)], coll, u('reloj'), segments=32)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location.z = 0.22
    c = clay.lathe('esfera', [(0.14, 0.031), (0.0, 0.033)], coll, m('blanco'), segments=32)
    c.rotation_euler = (math.pi / 2, 0, 0)
    c.location.z = 0.22
    clay.sweep('aguja 1', [(0, -0.04, 0.22), (0, -0.04, 0.32)], 0.01, (1, 1), coll, u('trazo'), segments=6, samples=2)
    clay.sweep('aguja 2', [(0, -0.04, 0.22), (0.07, -0.04, 0.22)], 0.01, (1, 1), coll, u('trazo'), segments=6, samples=2)



# --------------------------------------------------------------------------
# Reacciones de los muñequitos (docs/reacciones.md): se cuelgan de un hueso en el juego.
# Origen en el punto donde se agarra (la corona: el centro de la base); Z arriba (Y en el GLB).
# --------------------------------------------------------------------------

def _mat_reaccion(clave):
    M = clay.material
    tabla = {
        'oro': lambda: M('Reacción | oro', '#F5C246', rough=0.26, metallic=0.85, coat=0.3, coat_rough=0.1),
        'oro oscuro': lambda: M('Reacción | oro oscuro', '#D9982A', rough=0.3, metallic=0.85),
        'rosa': lambda: M('Reacción | rosa', '#F2587A', rough=0.25, coat=0.6, coat_rough=0.05),
        'gema': lambda: M('Reacción | gema rosa', '#FF7FA8', rough=0.08, coat=1.0, coat_rough=0.02, spec=0.8, sss=0.2),
        'brillo': lambda: M('Reacción | brillo', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=1.2),
        'madera': lambda: M('Reacción | madera', '#8A5A3C', rough=0.55, coat=0.2),
        'palo': lambda: M('Reacción | palo', '#C9956A', rough=0.6),
        'tela': lambda: M('Reacción | tela blanca', '#FBF8F2', rough=0.9, fuzz=dict(scale=160, color='#FFFFFF', amount=0.3, strength=0.25, distance=0.002)),
        'tela rosa': lambda: M('Reacción | tela rosa', '#F7A8BE', rough=0.85),
        'crema': lambda: M('Reacción | dado crema', '#FFF3DC', rough=0.35, coat=0.35, coat_rough=0.1),
        'punto rosa': lambda: M('Reacción | punto rosa', '#E4566B', rough=0.3, coat=0.4),
        'punto turquesa': lambda: M('Reacción | punto turquesa', '#1F9BB0', rough=0.3, coat=0.4),
    }
    return tabla[clave]()


def _corazon(name, c, s, coll, mat, grosor=0.45):
    """Corazón inflado de frente (-Y), tamaño s (ancho ≈ 0,42·s)."""
    import sdf
    lobes = [sdf.round_cone((sx * 0.078, 0, 0.3), (0, 0, 0.1), 0.1, 0.022) for sx in (-1, 1)]
    c = np.array(c, float)

    def f(P):
        Q = (P - c) / s + np.array([0, 0, 0.24])
        Q[:, 1] /= grosor
        return sdf.smin(lobes[0](Q), lobes[1](Q), 0.05) * s * grosor
    h = 0.24 * s
    return sdf.to_mesh(name, f, c - np.array([h, 0.12 * s * grosor, 0.22 * s]), c + np.array([h, 0.12 * s * grosor, 0.22 * s]),
                       voxel=0.004 * max(s, 0.3), coll=coll, material=mat, decimate=0.5)


def reaccion_trofeo(coll):
    """Copa dorada con asas, corazón rosado al frente y peana de madera; se agarra del tallo (origen)."""
    oro = _mat_reaccion('oro')
    perfil = [(0.0, -0.04), (0.035, -0.04), (0.032, 0.02), (0.045, 0.05), (0.07, 0.07), (0.12, 0.1), (0.165, 0.16), (0.185, 0.25),
              (0.19, 0.33), (0.2, 0.355), (0.185, 0.37), (0.165, 0.355), (0.155, 0.27), (0.12, 0.17), (0.0, 0.14)]
    clay.lathe('copa', perfil, coll, oro, segments=40, cap_bottom=False, cap_top=False)
    clay.lathe('nudo tallo', [(0.0, -0.02), (0.05, -0.02), (0.06, 0.0), (0.05, 0.02), (0.0, 0.02)], coll, _mat_reaccion('oro oscuro'), segments=24)
    for sx in (-1, 1):
        clay.sweep('asa copa', [(sx * 0.17, 0, 0.31), (sx * 0.27, 0, 0.3), (sx * 0.28, 0, 0.21), (sx * 0.2, 0, 0.15), (sx * 0.15, 0, 0.16)],
                   0.022, (1, 1), coll, oro, segments=10, samples=6)
    clay.lathe('pie copa', [(0.0, -0.08), (0.1, -0.08), (0.115, -0.07), (0.1, -0.05), (0.04, -0.035), (0.0, -0.035)], coll, oro, segments=36)
    clay.rbox('peana', (0, 0, -0.15), (0.14, 0.14, 0.07), coll, _mat_reaccion('madera'), p=6, n=6)
    clay.rbox('placa peana', (0, -0.14, -0.15), (0.08, 0.008, 0.035), coll, oro, p=8, n=4, subsurf=1)
    _corazon('corazón copa', (0, -0.19, 0.245), 0.36, coll, _mat_reaccion('rosa'))
    clay.blob('brillo copa', (-0.12, -0.13, 0.29), (0.018, 0.008, 0.045), coll, _mat_reaccion('brillo'), n=4)
    clay.blob('brillo corazón copa', (-0.04, -0.225, 0.29), (0.014, 0.006, 0.01), coll, _mat_reaccion('brillo'), n=4)


def reaccion_corona(coll):
    """Corona dorada de cinco puntas con bolitas y gemas rosadas; origen en el centro de la base."""
    import sdf
    R, alto = 0.27, 0.11
    puntas = []
    for k in range(5):
        a = math.pi / 2 + 2 * math.pi * k / 5 + math.pi  # una punta al frente (-Y)
        d = np.array([math.cos(a), math.sin(a), 0])
        puntas.append((d * R * 0.97 + np.array([0, 0, alto * 0.6]), d * R * 1.07 + np.array([0, 0, alto + 0.13])))

    def f(P):
        r = np.sqrt(P[:, 0] ** 2 + P[:, 1] ** 2)
        banda = np.maximum(np.maximum(r - R - 0.018, R - 0.022 - r), np.abs(P[:, 2] - alto / 2) - alto / 2) - 0.008
        dd = banda
        for a, b in puntas:
            dd = sdf.smin(dd, sdf.round_cone(a, b, 0.058, 0.016)(P) + 0.0 * r, 0.03)
        # la corona es hueca por dentro
        return np.maximum(dd, (R - 0.03) - r)
    sdf.to_mesh('corona', f, (-0.34, -0.34, -0.03), (0.34, 0.34, 0.3), voxel=0.005, coll=coll, material=_mat_reaccion('oro'), decimate=0.5)
    for k, (a, b) in enumerate(puntas):
        clay.blob(f'bolita corona {k}', b + np.array([0, 0, 0.02]), (0.03, 0.03, 0.03), coll, _mat_reaccion('oro'), n=5)
        ang = math.atan2(a[1], a[0])
        d = np.array([math.cos(ang), math.sin(ang), 0])
        g = clay.blob(f'gema corona {k}', (0, 0, 0), (0.046, 0.02, 0.052), coll, _mat_reaccion('gema'), n=5)
        g.location = d * (R + 0.028) + np.array([0, 0, alto * 0.5])
        g.rotation_euler = (0, 0, ang + math.pi / 2)
    for k in range(5):
        ang = math.pi / 2 + 2 * math.pi * (k + 0.5) / 5 + math.pi
        d = np.array([math.cos(ang), math.sin(ang), 0])
        g = clay.blob(f'gemita corona {k}', (0, 0, 0), (0.02, 0.012, 0.02), coll, _mat_reaccion('gema'), n=4)
        g.location = d * (R + 0.022) + np.array([0, 0, alto * 0.5])
        g.rotation_euler = (0, 0, ang + math.pi / 2)


def reaccion_bandera(coll):
    """Bandera blanca de rendirse: palito con bolita y tela ondeando hacia +X; se agarra abajo del palito (origen)."""
    clay.sweep('palito bandera', [(0, 0, -0.18), (0, 0, 0.98)], 0.022, (1, 1), coll, _mat_reaccion('palo'), segments=10, samples=2)
    clay.blob('bolita bandera', (0, 0, 1.0), (0.04, 0.04, 0.04), coll, _mat_reaccion('oro'), n=5)
    W, H, nu, nv = 0.5, 0.34, 18, 10
    verts, faces = [], []
    for i in range(nu):
        u = i / (nu - 1)
        for j in range(nv):
            v = j / (nv - 1)
            x = 0.02 + u * W * (1 - 0.06 * math.sin(v * math.pi))
            z = 0.94 - v * H - u * 0.05 * math.sin(v * math.pi * 0.5)
            y = 0.045 * math.sin(u * math.pi * 2.2 + v * 0.8) * u ** 0.7
            verts.append((x, y, z))
    for i in range(nu - 1):
        for j in range(nv - 1):
            a = i * nv + j
            faces.append((a, a + nv, a + nv + 1, a + 1))
    tela = clay.make_mesh_object('tela bandera', verts, faces, coll, material=_mat_reaccion('tela'))
    clay.add_solidify(tela, 0.012, 0.0)
    clay.add_subsurf(tela, 1, 2)
    for z in (0.93, 0.62):
        clay.sweep('amarre bandera', [(0.0, -0.028, z), (0.028, 0, z), (0.0, 0.028, z), (-0.028, 0, z)], 0.008, (1, 1), coll,
                   _mat_reaccion('tela'), segments=6, samples=4, closed=True)


def reaccion_panuelo(coll):
    """Pañuelo blanco con borde rosado y corazoncito, colgando de una punta (origen = donde se agarra)."""
    S, n = 0.36, 14
    verts, faces = [], []
    for i in range(n):
        u = i / (n - 1)
        for j in range(n):
            v = j / (n - 1)
            x = (u - v) * S / math.sqrt(2)
            z = -(u + v) * S / math.sqrt(2)
            junto = 1 - 0.75 * math.exp(-(u + v) * 4.0)  # recogido cerca de los dedos
            x *= junto
            y = 0.035 * math.sin((u - v) * math.pi * 1.6) * (u + v) + 0.02 * math.sin((u + v) * 5.0)
            verts.append((x, y, z + 0.02))
    for i in range(n - 1):
        for j in range(n - 1):
            a = i * n + j
            faces.append((a, a + n, a + n + 1, a + 1))
    tela = clay.make_mesh_object('pañuelo', verts, faces, coll, material=_mat_reaccion('tela'))
    clay.add_solidify(tela, 0.01, 0.0)
    clay.add_subsurf(tela, 1, 2)
    idx = lambda i, j: verts[i * n + j]
    bordes = [[idx(i, 0) for i in range(n)], [idx(n - 1, j) for j in range(n)], [idx(i, n - 1) for i in range(n)], [idx(0, j) for j in range(n)]]
    for k, b in enumerate(bordes):
        clay.sweep(f'borde pañuelo {k}', b[1:], 0.011, (1, 1), coll, _mat_reaccion('tela rosa'), segments=8, samples=3)
    fondo = idx(n - 1, n - 1)
    _corazon('corazón pañuelo', (fondo[0], fondo[1] - 0.02, fondo[2] + 0.1), 0.2, coll, _mat_reaccion('rosa'))
    clay.blob('nudo pañuelo', (0, 0, 0.0), (0.035, 0.03, 0.045), coll, _mat_reaccion('tela'), n=5)


def _dado(coll, nombre, c, rot, lado, mat_punto):
    """Dado crema redondeado con puntos de color (las caras opuestas suman 7)."""
    h = lado / 2
    caja = clay.rbox(f'dado {nombre}', (0, 0, 0), (h, h, h), coll, _mat_reaccion('crema'), p=5.0, n=6)
    patrones = {1: [(0, 0)], 2: [(-1, -1), (1, 1)], 3: [(-1, -1), (0, 0), (1, 1)], 4: [(-1, -1), (-1, 1), (1, -1), (1, 1)],
                5: [(-1, -1), (-1, 1), (0, 0), (1, -1), (1, 1)], 6: [(-1, -1), (-1, 0), (-1, 1), (1, -1), (1, 0), (1, 1)]}
    caras = {1: ((0, -1, 0), (1, 0, 0), (0, 0, 1)), 6: ((0, 1, 0), (1, 0, 0), (0, 0, 1)), 2: ((1, 0, 0), (0, 1, 0), (0, 0, 1)),
             5: ((-1, 0, 0), (0, 1, 0), (0, 0, 1)), 3: ((0, 0, 1), (1, 0, 0), (0, 1, 0)), 4: ((0, 0, -1), (1, 0, 0), (0, 1, 0))}
    piezas = [caja]
    for num, (nrm, e1, e2) in caras.items():
        nrm, e1, e2 = np.array(nrm, float), np.array(e1, float), np.array(e2, float)
        for a, b in patrones[num]:
            p = nrm * (h * 0.985) + (e1 * a + e2 * b) * h * 0.5
            r = h * (0.26 if num == 1 else 0.19)
            s = np.abs(nrm) * 0.5 + (1 - np.abs(nrm))
            punto = clay.blob(f'punto dado {nombre}', (0, 0, 0), tuple(r * s), coll, mat_punto, n=4)
            punto.location = tuple(p)
            punto.parent = caja
    caja.location = c
    caja.rotation_euler = tuple(math.radians(x) for x in rot)
    return caja


def reaccion_dados(coll):
    """Dos dados crema (puntos rosados y turquesa) juntos, como en las manos; origen entre los dos."""
    _dado(coll, 'rosa', (-0.105, 0.0, 0.0), (8, 12, 22), 0.19, _mat_reaccion('punto rosa'))
    _dado(coll, 'turquesa', (0.105, 0.015, 0.035), (-14, 30, -12), 0.19, _mat_reaccion('punto turquesa'))


REACCIONES = {'reaccion_trofeo': reaccion_trofeo, 'reaccion_corona': reaccion_corona, 'reaccion_bandera': reaccion_bandera,
              'reaccion_panuelo': reaccion_panuelo, 'reaccion_dados': reaccion_dados}


PIEZAS = [
    ('Carrito N1', lambda c: carrito(1, c)), ('Carrito N2', lambda c: carrito(2, c)), ('Carrito N3', lambda c: carrito(3, c)),
    ('Canasta', canasta), ('Puesto de canastas', puesto_canastas), ('Torniquete de entrada', torniquete),
    ('Carretilla de reparto', carretilla), ('Bolsa de compras', bolsa_compras), ('Dinero', dinero),
    ('Trapero y balde', trapero_balde), ('Charco', charco), ('Basura', basura), ('Caneca de reciclaje', caneca), ('Piso mojado', cono),
    ('Planta', planta), ('Globos', globos), ('Parlante', parlante), ('Letrero de oferta', letrero_oferta), ('Cámara', camara),
    ('Máquina de malteadas', maquina_malteadas), ('Cafetera', cafetera), ('Horno de pizza', horno_pizza), ('Exprimidor', exprimidor),
]
ICONOS = [
    ('Globo de pensamiento', globo_pensamiento), ('Paciencia: feliz', lambda c: carita(c, 'feliz')),
    ('Paciencia: normal', lambda c: carita(c, 'media')), ('Paciencia: enojado', lambda c: carita(c, 'enojada')),
    ('Moneda', moneda), ('Estrella', estrella), ('Corazón en equipo', corazon), ('Reloj del día', reloj),
]


def build(name, fn, coll, location=(0, 0, 0), rotation_z=0.0, scale=1.0):
    return _group(f'Utilería | {name}', coll, fn, location, rotation_z, scale)
