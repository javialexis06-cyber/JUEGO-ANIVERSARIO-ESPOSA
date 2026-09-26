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
# Limpieza y problemas
# --------------------------------------------------------------------------

def trapero_balde(coll):
    clay.lathe('balde', [(0.17, 0.0), (0.21, 0.32), (0.22, 0.33)], coll, m('amarillo'), segments=28, cap_top=False)
    clay.lathe('agua balde', [(0.2, 0.26), (0.0, 0.26)], coll, u('charco'), segments=28, cap_bottom=False)
    for sx in (-1, 1):
        wheel(coll, (sx * 0.16, -0.1, 0.03), 0.03, 0.02)
    clay.sweep('palo', [(0.12, -0.05, 0.05), (0.2, 0.05, 1.5)], 0.02, (1, 1), coll, m('madera'), segments=8, samples=2)
    for k in range(10):
        a = 2 * math.pi * k / 10
        clay.sweep(f'fleco {k}', [(0.12, -0.05, 0.1), (0.12 + math.cos(a) * 0.07, -0.05 + math.sin(a) * 0.07, 0.0)], [0.02, 0.014], (1, 1), coll, u('fleco'),
                   segments=6, samples=2)


def charco(coll):
    pts = []
    for k in range(14):
        a = 2 * math.pi * k / 14
        r = 0.3 + 0.07 * math.sin(3 * a) + 0.04 * math.cos(5 * a)
        pts.append((math.cos(a) * r, math.sin(a) * r * 0.75, 0.004))
    verts = [(0, 0, 0.012)] + pts
    faces = [(0, i + 1, (i + 1) % len(pts) + 1) for i in range(len(pts))]
    o = clay.make_mesh_object('charco', verts, faces, coll, material=u('charco'))
    clay.add_subsurf(o, 2, 3)
    for k, (x, y) in enumerate(((0.35, 0.1), (-0.3, -0.18), (0.1, 0.3))):
        clay.blob(f'gota {k}', (x, y, 0.006), (0.04, 0.03, 0.006), coll, u('charco'), n=4)


def basura(coll):
    clay.blob('papel arrugado', (0, 0, 0.06), (0.07, 0.07, 0.06), coll, u('papel'), n=6,
              shaper=lambda v: v * (1 + 0.15 * np.sin(v[:, 0] * 60) * np.cos(v[:, 1] * 50))[:, None])
    pts = [(0.15, -0.02, 0.01), (0.2, -0.05, 0.02), (0.25, -0.02, 0.01)]
    for k, dy in enumerate((-0.04, 0.0, 0.04)):
        clay.sweep(f'cáscara {k}', [(0.15, dy * 0.3, 0.02), (0.22, dy, 0.012), (0.28, dy * 1.4, 0.006)], [0.02, 0.025, 0.008], (0.35, 1), coll,
                   prod.mat('amarillo banano'), segments=6, samples=3, up=(0, 0, 1))


def caneca(coll):
    clay.lathe('caneca', [(0.24, 0.0), (0.28, 0.75)], coll, u('azul caneca'), segments=32)
    clay.lathe('tapa', [(0.3, 0.75), (0.3, 0.8), (0.22, 0.86), (0.0, 0.88)], coll, u('azul caneca'), segments=32)
    for k in range(3):
        a = 2 * math.pi * k / 3 - math.pi / 2
        clay.sweep(f'flecha reciclaje {k}', [(math.cos(a) * 0.08, -0.285, 0.4 + math.sin(a) * 0.08),
                                             (math.cos(a + 1.8) * 0.08, -0.285, 0.4 + math.sin(a + 1.8) * 0.08)], 0.016, (1, 1), coll, u('verde'),
                   segments=6, samples=3)


def cono(coll):
    """Aviso de piso mojado: caballete amarillo con triángulo y signo de admiración."""
    th, hh = 0.2, 0.3
    for sy, rot in ((-1, -th), (1, th)):
        panel = box('aviso piso mojado', (0, 0, 0), (0.17, 0.014, hh), coll, 'amarillo', p=5)
        panel.location = (0, sy * hh * math.sin(th), 0.02 + hh * math.cos(th))
        panel.rotation_euler = (rot, 0, 0)
        yf = sy * 0.018
        tri = [(-0.12, yf, -0.06), (0.12, yf, -0.06), (0.0, yf, 0.17)]
        parts = [clay.sweep('triángulo aviso', tri, 0.013, (1, 1), coll, u('trazo'), segments=6, samples=2, closed=True),
                 clay.blob('admiración', (0, yf, 0.06), (0.017, 0.006, 0.05), coll, u('trazo'), n=4),
                 clay.blob('punto admiración', (0, yf, -0.02), (0.016, 0.006, 0.016), coll, u('trazo'), n=4)]
        for o in parts:
            o.parent = panel
    box('bisagra aviso', (0, 0, 0.02 + 2 * hh * math.cos(th)), (0.16, 0.025, 0.02), coll, 'amarillo', p=5)
    clay.sweep('asa aviso', [(-0.06, 0, 0.64), (-0.05, 0, 0.7), (0.05, 0, 0.7), (0.06, 0, 0.64)], 0.012, (1, 1), coll, u('trazo'), segments=6, samples=4)


# --------------------------------------------------------------------------
# Decoración y seguridad
# --------------------------------------------------------------------------

def planta(coll):
    clay.lathe('matera', [(0.14, 0.0), (0.2, 0.32), (0.22, 0.34)], coll, u('matera'), segments=28, cap_top=True)
    rng = np.random.default_rng(4)
    for k in range(12):
        a = rng.uniform(0, 2 * math.pi)
        L = rng.uniform(0.3, 0.55)
        base = np.array([0, 0, 0.32])
        tip = base + np.array([math.cos(a) * L * 0.6, math.sin(a) * L * 0.6, L])
        clay.sweep(f'hoja {k}', [base, (base + tip) / 2 + [0, 0, 0.08], tip], [0.01, 0.07, 0.005], (0.2, 1), coll, u('hoja'), segments=6, samples=4,
                   caps=('flat', 'point'), up=(math.cos(a), math.sin(a), 0.3))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.4
        clay.blob(f'flor {k}', (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.62), (0.04, 0.04, 0.03), coll, u('flor'), n=5)


def globos(coll):
    for k, (x, y, z, key) in enumerate(((0, 0, 1.3, 'globo rosa'), (0.2, 0.05, 1.2, 'globo menta'), (-0.18, 0.02, 1.18, 'globo lila'))):
        clay.blob(f'globo {k}', (x, y, z), (0.13, 0.13, 0.16), coll, u(key), n=8)
        clay.sweep(f'hilo {k}', [(x, y, z - 0.16), (x * 0.5, y, z - 0.6), (0, 0, 0.08)], 0.004, (1, 1), coll, u('hilo'), segments=4, samples=4)
    box('pesita', (0, 0, 0.05), (0.06, 0.06, 0.05), coll, 'coral', p=4)


def parlante(coll):
    box('parlante', (0, 0, 0.35), (0.18, 0.15, 0.35), coll, 'negro', p=5)
    for z, r in ((0.5, 0.11), (0.22, 0.07)):
        cone = clay.lathe('cono parlante', [(r, 0), (r * 0.3, -0.03)], coll, u('gris oscuro'), segments=24)
        cone.rotation_euler = (math.pi / 2, 0, 0)
        cone.location = (0, -0.15, z)
        ring = [(r * math.cos(a), -0.155, z + r * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 16, endpoint=False)]
        clay.sweep('aro parlante', ring, 0.012, (1, 1), coll, m('acero'), segments=6, samples=3, closed=True)
        clay.blob('centro parlante', (0, -0.13, z), (r * 0.28, 0.02, r * 0.28), coll, m('acero'), n=4)
    for k, (x, z) in enumerate(((0.28, 0.75), (0.38, 0.9), (0.25, 1.0))):
        clay.sweep(f'nota {k}', [(x, -0.1, z), (x, -0.1, z + 0.12)], 0.01, (1, 1), coll, u('trazo'), segments=6, samples=2)
        clay.blob(f'cabeza nota {k}', (x - 0.03, -0.1, z), (0.035, 0.02, 0.028), coll, u('trazo'), n=4)


def letrero_oferta(coll):
    for sx in (-1, 1):
        clay.sweep('pata', [(sx * 0.2, 0.1, 0.0), (sx * 0.15, 0.0, 0.8)], 0.02, (1, 1), coll, m('madera oscura'), segments=6, samples=2)
    box('tablero', (0, -0.02, 0.65), (0.26, 0.03, 0.3), coll, 'pizarra', p=6)
    box('marco', (0, 0.0, 0.65), (0.29, 0.02, 0.33), coll, 'madera', p=6)
    clay.blob('estrella oferta', (0, -0.06, 0.78), (0.1, 0.01, 0.1), coll, u('estrella'), n=5)
    for k in range(2):
        box('tiza', (0, -0.055, 0.6 - k * 0.1), (0.18 - k * 0.05, 0.004, 0.015), coll, 'tiza', p=6, n=4)


def camara(coll):
    """Cámara de seguridad con soporte de pared (base en z=0; en la tienda se sube a la pared)."""
    box('placa pared', (0, 0.16, 0.2), (0.07, 0.015, 0.1), coll, 'blanco', p=5)
    clay.sweep('brazo', [(0, 0.15, 0.24), (0, 0.06, 0.29), (0, -0.01, 0.25)], 0.022, (1, 1), coll, m('acero'), segments=8, samples=4)
    box('cuerpo', (0, -0.06, 0.17), (0.08, 0.15, 0.07), coll, 'blanco', p=4)
    box('visera', (0, -0.1, 0.245), (0.095, 0.14, 0.012), coll, 'blanco', p=6)
    lente = clay.lathe('lente', [(0.055, 0), (0.045, 0.035)], coll, m('negro'), segments=20)
    lente.rotation_euler = (math.pi / 2, 0, 0)
    lente.location = (0, -0.2, 0.17)
    clay.blob('brillo lente', (0.015, -0.237, 0.185), (0.012, 0.004, 0.012), coll, m('blanco'), n=4)
    clay.blob('luz roja', (0.055, -0.2, 0.22), (0.012, 0.012, 0.012), coll, u('rojo'), n=4)


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
