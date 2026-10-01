"""Retrete espacial: los retretes de la tienda del retrete, los poderes, el rollito dorado, la basura espacial
(satélite, inodoro viejo, chancla, lata), el ovni, el avión, el pájaro, el mini-retrete ayudante y los íconos de
las mejoras.

Todo se construye en el origen con el frente hacia -y (como la casa). Los retretes tienen el asiento a 0.445 m (la
misma altura que el inodoro del baño) y el tanque atrás (+y). Lo que vuela hacia la nave (avión, pájaro) mira
hacia -x. Se exporta con cohete_exportar.py.
"""
import math

import numpy as np

import clay
from casa import estrella_plana, porcelana
from regalos import corazon_plano, laca, luz, madera, papel, tela
from tiendas import _mat

M = clay.material


# ---------------------------------------------------------------------------
# Materiales
# ---------------------------------------------------------------------------

def m(nombre, color, **kw):
    return _mat(f'Cohete | {nombre}', color, **kw)


def cromo():
    return m('cromo', '#DCE0E6', rough=0.12, metallic=1.0)


def oro(nombre='oro'):
    return m(nombre, '#F5C246', rough=0.18, metallic=1.0, coat=0.3, coat_rough=0.05)


def diamante():
    return m('diamante', '#EAF8FF', rough=0.02, coat=1.0, coat_rough=0.0, spec=1.0)


def vidrio(nombre='vidrio', color='#CFEFFF', alfa=0.3):
    mt = m(nombre, color, rough=0.04, coat=0.8, alpha=alfa)
    try:
        mt.surface_render_method = 'BLENDED'
    except AttributeError:
        mt.blend_method = 'BLEND'
    return mt


def rgb(k, color):
    return m(f'rgb {k}', color, rough=0.4, emission=color, emission_strength=3.5)


def plastico(nombre, color, rough=0.32):
    return m(f'plastico {nombre}', color, rough=rough, coat=0.4, coat_rough=0.1)


def peluche(nombre, color):
    return _mat(f'Tela | peluche {nombre}', color, rough=0.95, sheen=0.7, sheen_rough=0.4,
                fuzz=dict(scale=110, color=color, amount=0.7, strength=0.7, distance=0.005))


# ---------------------------------------------------------------------------
# Piezas que se repiten
# ---------------------------------------------------------------------------

def colocar(o, loc, rot=(0, 0, 0)):
    """Mueve y gira una pieza construida en el origen (si se gira ya movida, gira alrededor del centro de la escena)."""
    o.location = loc
    o.rotation_euler = rot
    return o


def agrupar(coll, nombre, objs):
    """Cuelga piezas de un vacío en el origen (para girarlas juntas)."""
    import bpy
    g = bpy.data.objects.new(nombre, None)
    clay.link(g, coll)
    for o in objs:
        o.parent = g
    return g

def aro_z(nombre, c, rx, ry, tubo, coll, mat, prof=(1, 1), n=28):
    """Aro acostado (en el plano xy) de radios rx, ry a la altura c[2]."""
    pts = [(c[0] + rx * math.cos(a), c[1] + ry * math.sin(a), c[2]) for a in np.linspace(0, 2 * math.pi, n, endpoint=False)]
    return clay.sweep(nombre, pts, tubo, prof, coll, mat, segments=8, samples=3, closed=True, up=(0, 0, 1))


def aro_y(nombre, c, r, tubo, coll, mat, n=24):
    """Aro de frente (en el plano xz)."""
    pts = [(c[0] + r * math.cos(a), c[1], c[2] + r * math.sin(a)) for a in np.linspace(0, 2 * math.pi, n, endpoint=False)]
    return clay.sweep(nombre, pts, tubo, (1, 1), coll, mat, segments=8, samples=3, closed=True, up=(0, 1, 0))


def gema(nombre, c, r, coll, mat, alto=1.0):
    """Diamante tallado (facetas de verdad: sin suavizar)."""
    o = clay.lathe(nombre, [(0.0, -r * 0.95 * alto), (r, 0.0), (r * 0.62, r * 0.42 * alto), (0.0, r * 0.45 * alto)], coll, mat, segments=8, subsurf=0)
    o.location = c
    for p in o.data.polygons:
        p.use_smooth = False
    return o


def rollo_papel(nombre, c, coll, mat, r=0.06, h=0.1, hueco=0.022, eje='z', tira=True, mat_tubo=None):
    """Rollo de papel higiénico (con su tubito de cartón y una tira colgando)."""
    perfil = [(hueco, -h / 2), (r - 0.008, -h / 2), (r, -h / 2 + 0.008), (r, h / 2 - 0.008), (r - 0.008, h / 2), (hueco, h / 2)]
    o = clay.lathe(nombre, perfil, coll, mat, segments=28, cap_bottom=False, cap_top=False)
    t = clay.lathe(f'{nombre} tubo', [(hueco, -h / 2 - 0.002), (hueco, h / 2 + 0.002), (hueco - 0.004, h / 2 + 0.002), (hueco - 0.004, -h / 2 - 0.002)], coll,
                   mat_tubo or papel('cartón', '#C9A27A'), segments=20, cap_bottom=False, cap_top=False)
    piezas = [o, t]
    if tira:
        s = clay.sweep(f'{nombre} tira', [(0, -r, h * 0.35), (0, -r - 0.012, -h * 0.1), (0, -r - 0.02, -h * 0.9), (0.006, -r - 0.012, -h * 1.5)], 0.03,
                       (0.15, 1.0), coll, mat, segments=6, samples=4, up=(1, 0, 0), caps=('flat', 'flat'))
        piezas.append(s)
    for p in piezas:
        if eje == 'x':
            p.rotation_euler = (0, math.pi / 2, 0)
        elif eje == 'y':
            p.rotation_euler = (math.pi / 2, 0, 0)
        p.location = c
    return piezas


def inodoro_base(coll, cuerpo, asiento=None, tanque=None, tapa_tanque=None, palanca=None, con_tanque=True, con_tapa=True, tapa=None):
    """El inodoro de la casa con más detalle: pie, taza, asiento, tapa levantada, tanque y palanca."""
    clay.lathe('pie inodoro', [(0.135, 0.0), (0.16, 0.012), (0.155, 0.03), (0.125, 0.07), (0.118, 0.2), (0.2, 0.355), (0.0, 0.375)], coll, cuerpo, segments=32)
    clay.blob('taza', (0, -0.05, 0.39), (0.22, 0.27, 0.06), coll, cuerpo, n=12)
    clay.blob('agua taza', (0, -0.06, 0.435), (0.15, 0.19, 0.008), coll, m('agua', '#9FD9F2', rough=0.05, coat=1.0), n=8)
    aro_z('asiento', (0, -0.05, 0.445), 0.19, 0.235, 0.032, coll, asiento or cuerpo, prof=(0.6, 1.5))
    for sx in (-1, 1):
        clay.blob('bisagra', (sx * 0.09, 0.15, 0.455), (0.025, 0.02, 0.014), coll, palanca or cromo(), n=5)
    if con_tapa:
        t = clay.rbox('tapa', (0, 0, 0), (0.19, 0.011, 0.215), coll, tapa or asiento or cuerpo, p=2.6, n=8)
        t.location = (0, 0.112, 0.66)
        t.rotation_euler = (math.radians(-8), 0, 0)
    if con_tanque:
        clay.rbox('tanque', (0, 0.22, 0.64), (0.22, 0.1, 0.2), coll, tanque or cuerpo, p=6, n=6)
        clay.rbox('tapa tanque', (0, 0.22, 0.852), (0.235, 0.115, 0.022), coll, tapa_tanque or tanque or cuerpo, p=6, n=5)
        pal = palanca or cromo()
        clay.blob('placa palanca', (-0.17, 0.117, 0.77), (0.03, 0.01, 0.03), coll, pal, n=5)
        clay.sweep('palanca', [(-0.17, 0.11, 0.77), (-0.22, 0.1, 0.765), (-0.27, 0.1, 0.75)], 0.011, (1, 1), coll, pal, segments=8, samples=3)
        clay.blob('perilla palanca', (-0.275, 0.1, 0.748), (0.018, 0.016, 0.016), coll, pal, n=5)


# ---------------------------------------------------------------------------
# Retretes de la tienda
# ---------------------------------------------------------------------------

def retrete_porcelana(coll):
    """El del baño de la casa, con el forro peludo de la tapa y del asiento (como en las casas de la abuela)."""
    p = porcelana()
    felpa = peluche('forro', '#8FC8EE')
    inodoro_base(coll, p, asiento=felpa, tapa=felpa)
    clay.rbox('forro tapa tanque', (0, 0.22, 0.87), (0.255, 0.135, 0.035), coll, felpa, p=4, n=7)
    for k in range(12):
        a = 2 * math.pi * k / 12
        clay.blob(f'pompón forro {k}', (0.255 * 1.02 * math.cos(a) * 0.98, 0.22 + 0.135 * math.sin(a), 0.845), (0.022, 0.022, 0.02), coll, felpa, n=4)
    # El portarrollos con su rollo al lado del tanque
    c = cromo()
    clay.sweep('brazo portarrollos', [(0.24, 0.2, 0.62), (0.31, 0.2, 0.62), (0.31, 0.12, 0.62)], 0.008, (1, 1), coll, c, segments=6, samples=3)
    rollo_papel('rollo casa', (0.31, 0.12, 0.62), coll, papel('papel', '#FBFBF6'), r=0.055, h=0.1, eje='x')


def retrete_madera(coll):
    """Letrina de finca: cajón de tablas con su hueco, tabla de espaldar con corazón, balde y tusa de repuesto."""
    mad = madera('tabla letrina', '#B98552')
    osc = madera('tabla oscura', '#8A5C34')
    clavo = m('clavo', '#8E8E96', rough=0.4, metallic=0.7)
    clay.rbox('cajón letrina', (0, -0.03, 0.21), (0.27, 0.28, 0.21), coll, mad, p=8, n=5)
    for k in range(6):
        x = -0.225 + k * 0.09
        clay.rbox(f'junta tabla {k}', (x, -0.312, 0.21), (0.004, 0.006, 0.2), coll, osc, p=6, n=3)
        for z in (0.06, 0.36):
            clay.blob(f'clavo {k} {z}', (x + 0.03, -0.316, z), (0.008, 0.005, 0.008), coll, clavo, n=3)
    clay.rbox('tapa letrina', (0, -0.04, 0.435), (0.29, 0.3, 0.018), coll, osc, p=8, n=5)
    clay.blob('hueco letrina', (0, -0.08, 0.452), (0.11, 0.14, 0.004), coll, m('hueco', '#1E1410', rough=1.0), n=6)
    aro_z('borde hueco', (0, -0.08, 0.452), 0.12, 0.15, 0.012, coll, mad, prof=(0.8, 1.2), n=20)
    # Espaldar con corazón calado
    clay.rbox('espaldar', (0, 0.27, 0.72), (0.28, 0.025, 0.3), coll, mad, p=8, n=5)
    for k in range(3):
        clay.rbox(f'junta espaldar {k}', (-0.14 + k * 0.14, 0.245, 0.72), (0.004, 0.004, 0.29), coll, osc, p=6, n=3)
    corazon_plano('corazón calado', (0, 0.242, 0.8), 0.32, coll, m('hueco', '#1E1410', rough=1.0), grosor=0.12)
    # Balde con agua al lado y la tusa colgando de una pita
    clay.lathe('balde', [(0.0, 0.0), (0.09, 0.0), (0.11, 0.2), (0.118, 0.205), (0.112, 0.21)], coll, plastico('balde', '#3E8ED8'), segments=24, cap_top=False)
    clay.lathe('agua balde', [(0.0, 0.18), (0.106, 0.18)], coll, m('agua', '#9FD9F2', rough=0.05, coat=1.0), segments=24, cap_bottom=False)
    for o in list(coll.objects)[-2:]:
        o.location = (0.4, 0.05, 0)
    clay.sweep('asa balde', [(0.29, 0.05, 0.2), (0.4, 0.0, 0.3), (0.51, 0.05, 0.2)], 0.005, (1, 1), coll, clavo, segments=5, samples=4)
    clay.sweep('pita', [(-0.2, 0.25, 0.98), (-0.25, 0.22, 0.9), (-0.3, 0.21, 0.8)], 0.004, (1, 1), coll, m('pita', '#D9C7A0'), segments=5, samples=3)
    clay.blob('tusa', (-0.3, 0.2, 0.71), (0.035, 0.035, 0.1), coll, m('tusa', '#C99A5A', rough=0.9), n=8)
    rng = np.random.default_rng(3)
    for k in range(18):
        a, z = rng.uniform(0, 2 * math.pi), rng.uniform(0.64, 0.79)
        clay.blob(f'grano tusa {k}', (-0.3 + 0.033 * math.cos(a), 0.2 + 0.033 * math.sin(a), z), (0.012, 0.012, 0.012), coll, m('grano tusa', '#E8C27A'), n=3)
    # Periódico doblado sobre el cajón
    per = [clay.rbox('periódico', (0, 0, 0), (0.08, 0.06, 0.008), coll, papel('periódico', '#E6E2D8'), p=8, n=4)]
    for k in range(3):
        per.append(clay.rbox(f'renglón {k}', (-0.01, -0.03 + k * 0.025, 0.01), (0.05, 0.004, 0.002), coll, m('tinta', '#55524E'), p=6, n=3))
    colocar(agrupar(coll, 'periódico doblado', per), (0.18, -0.24, 0.462), (0, 0, 0.3))


def retrete_portatil(coll):
    """Baño portátil de concierto: azul, con la pared de atrás alta, rejillas, el letrero de «ocupado» y la lunita."""
    azul = plastico('portátil', '#2F7DE1')
    azul2 = plastico('portátil claro', '#5AA0F0')
    blanco = plastico('portátil blanco', '#F4F6F8')
    clay.rbox('cajón portátil', (0, 0.0, 0.215), (0.27, 0.3, 0.215), coll, azul, p=6, n=6)
    clay.rbox('tapa cajón', (0, -0.02, 0.43), (0.25, 0.27, 0.02), coll, blanco, p=6, n=5)
    aro_z('asiento portátil', (0, -0.06, 0.448), 0.17, 0.2, 0.026, coll, m('negro', '#2A2A30', rough=0.5), prof=(0.6, 1.3))
    clay.blob('hueco portátil', (0, -0.06, 0.452), (0.12, 0.15, 0.004), coll, m('hueco', '#1E1410', rough=1.0), n=6)
    # Pared de atrás, alta, con el techito redondo
    clay.rbox('pared portátil', (0, 0.33, 0.95), (0.4, 0.04, 0.95), coll, azul, p=6, n=6)
    clay.blob('techo portátil', (0, 0.2, 1.92), (0.46, 0.24, 0.08), coll, blanco, n=10, p=2.4)
    for k in range(5):
        clay.rbox(f'costilla {k}', (-0.32 + k * 0.16, 0.285, 0.95), (0.022, 0.012, 0.9), coll, azul2, p=4, n=4)
    for k in range(4):
        clay.rbox(f'rejilla {k}', (0, 0.282, 1.62 + k * 0.05), (0.24, 0.006, 0.01), coll, m('rejilla', '#1B4F9A', rough=0.6), p=6, n=3)
    # La lunita en la pared
    pts = [(0.06 * math.cos(a), 0.28, 1.3 + 0.1 * math.sin(a)) for a in np.linspace(-1.9, 1.9, 9)]
    clay.sweep('luna', pts, [0.015, 0.03, 0.04, 0.03, 0.015], (1, 0.5), coll, plastico('luna', '#FFE27A'), segments=8, samples=3, up=(0, 1, 0))
    # Paredes de los lados (cortadas para que se vea el personaje)
    for sx in (-1, 1):
        clay.rbox(f'lado {sx}', (sx * 0.4, 0.17, 0.95), (0.03, 0.17, 0.95), coll, azul, p=6, n=6)
    clay.rbox('letrero ocupado', (0.432, 0.1, 1.05), (0.006, 0.06, 0.025), coll, m('rojo ocupado', '#E4574B', emission='#E4574B', emission_strength=1.5), p=6, n=3)
    clay.sweep('brazo rollo', [(-0.37, 0.22, 0.8), (-0.3, 0.22, 0.8)], 0.008, (1, 1), coll, cromo(), segments=6, samples=2)
    rollo_papel('rollo portátil', (-0.3, 0.16, 0.8), coll, papel('papel', '#FBFBF6'), r=0.05, eje='x')


def retrete_chiva(coll):
    """Retrete chiva: pintado como chiva de pueblo, con parrilla, maletas, racimo de plátanos y gallina."""
    amarillo = laca('chiva amarillo', '#F7C948', 0.3)
    rojo = laca('chiva rojo', '#E23B3B', 0.3)
    azul = laca('chiva azul', '#2456C9', 0.3)
    verde = laca('chiva verde', '#36A852', 0.3)
    inodoro_base(coll, amarillo, asiento=rojo, tanque=amarillo, tapa_tanque=rojo, palanca=cromo(), tapa=azul)
    # Franjas de colores alrededor del tanque y del pie
    for k, (z, col) in enumerate(((0.5, rojo), (0.56, azul), (0.62, verde), (0.71, rojo), (0.77, azul))):
        clay.rbox(f'franja tanque {k}', (0, 0.22, z), (0.226, 0.106, 0.014), coll, col, p=8, n=4)
    for k, (z, col) in enumerate(((0.06, rojo), (0.14, azul), (0.22, verde))):
        clay.lathe(f'franja pie {k}', [(0.135, z - 0.015), (0.137, z), (0.135, z + 0.015)], coll, col, segments=32, cap_bottom=False, cap_top=False)
    # Rombitos pintados en el frente de la taza
    for k in range(5):
        x = -0.16 + k * 0.08
        colocar(clay.rbox(f'rombo {k}', (0, 0, 0), (0.022, 0.008, 0.022), coll, (rojo, azul, verde)[k % 3], p=4, n=3), (x, -0.305, 0.37), (0, math.pi / 4, 0))
    # Farolas al frente del tanque
    for sx in (-1, 1):
        clay.lathe(f'aro farola {sx}', [(0.0, 0.0), (0.04, 0.0), (0.045, 0.02), (0.0, 0.02)], coll, cromo(), segments=16).location = (sx * 0.15, 0.11, 0.82)
        f = clay.lathe(f'farola {sx}', [(0.0, 0.0), (0.033, 0.0), (0.0, 0.016)], coll, luz('farola chiva', '#FFF2B0', 3.0), segments=16)
        f.location = (sx * 0.15, 0.106, 0.82)
        for o in list(coll.objects)[-2:]:
            o.rotation_euler = (math.pi / 2, 0, 0)
    # Parrilla con el trasteo
    neg = m('parrilla', '#2A2A30', rough=0.4, metallic=0.6)
    for sy in (-1, 1):
        clay.sweep(f'riel parrilla {sy}', [(-0.25, 0.22 + sy * 0.12, 0.9), (0.25, 0.22 + sy * 0.12, 0.9)], 0.008, (1, 1), coll, neg, segments=6, samples=2)
    for sx in (-1, 0, 1):
        clay.sweep(f'travesaño {sx}', [(sx * 0.24, 0.1, 0.9), (sx * 0.24, 0.34, 0.9)], 0.007, (1, 1), coll, neg, segments=6, samples=2)
        for sy in (-1, 1):
            clay.sweep(f'pata parrilla {sx}{sy}', [(sx * 0.24, 0.22 + sy * 0.12, 0.87), (sx * 0.24, 0.22 + sy * 0.12, 0.9)], 0.007, (1, 1), coll, neg, segments=6, samples=2)
    clay.rbox('maleta', (-0.13, 0.22, 0.96), (0.08, 0.06, 0.055), coll, m('maleta', '#8A4B2A', rough=0.6), p=4, n=5)
    clay.rbox('correa maleta', (-0.13, 0.22, 0.96), (0.082, 0.012, 0.057), coll, m('correa', '#3A2418', rough=0.6), p=4, n=4)
    clay.blob('costal', (0.02, 0.24, 0.97), (0.08, 0.07, 0.07), coll, tela('costal', '#D8C08A'), n=8)
    clay.blob('amarre costal', (0.02, 0.24, 1.035), (0.03, 0.03, 0.015), coll, m('pita', '#D9C7A0'), n=4)
    for k in range(5):
        a = -0.6 + k * 0.3
        clay.sweep(f'plátano {k}', [(0.14, 0.22, 0.93), (0.14 + 0.06 * math.sin(a), 0.22 + 0.06 * math.cos(a), 0.97), (0.15 + 0.1 * math.sin(a), 0.22 + 0.1 * math.cos(a), 1.02)],
                   [0.018, 0.02, 0.012], (1, 1), coll, m('plátano', '#B8C94A', rough=0.6), segments=8, samples=4)
    # La gallina encima del costal
    clay.blob('gallina', (0.0, 0.24, 1.08), (0.045, 0.055, 0.04), coll, tela('gallina', '#FBFBF6'), n=7)
    clay.blob('cabeza gallina', (0.0, 0.2, 1.12), (0.022, 0.022, 0.024), coll, tela('gallina', '#FBFBF6'), n=5)
    clay.blob('cresta', (0.0, 0.2, 1.145), (0.006, 0.015, 0.012), coll, laca('cresta', '#E23B3B'), n=4)
    clay.blob('pico gallina', (0.0, 0.177, 1.118), (0.007, 0.012, 0.006), coll, laca('pico', '#F2A23A'), n=4)
    for sx in (-1, 1):
        clay.blob(f'ojo gallina {sx}', (sx * 0.012, 0.183, 1.127), (0.004, 0.003, 0.004), coll, m('negro', '#2A2A30', rough=0.5), n=3)
    clay.blob('cola gallina', (0.0, 0.29, 1.1), (0.012, 0.025, 0.03), coll, tela('gallina', '#FBFBF6'), n=5)
    # Ruedas de adorno a los lados
    for sx in (-1, 1):
        clay.lathe(f'llanta {sx}', [(0.0, -0.02), (0.07, -0.02), (0.075, 0.0), (0.07, 0.02), (0.0, 0.02)], coll, m('llanta', '#2A2A30', rough=0.7), segments=20)
        clay.lathe(f'rin {sx}', [(0.0, -0.022), (0.035, -0.022), (0.035, 0.022), (0.0, 0.022)], coll, rojo, segments=16)
        for o in list(coll.objects)[-2:]:
            o.rotation_euler = (0, math.pi / 2, 0)
            o.location = (sx * 0.19, -0.12, 0.075)


def retrete_nave(coll):
    """Nave espacial: cromado, con el tanque vuelto cohete (ventanilla, punta roja y antena) y tres aletas."""
    c = cromo()
    blanco = laca('nave blanco', '#F4F6FA', 0.25)
    rojo = laca('nave rojo', '#E4574B', 0.25)
    azul = laca('nave azul', '#2F6FD6', 0.25)
    inodoro_base(coll, c, asiento=rojo, con_tanque=False, tapa=blanco)
    # El cohete del tanque
    clay.lathe('cuerpo cohete', [(0.0, 0.42), (0.13, 0.43), (0.165, 0.55), (0.17, 0.8), (0.15, 0.95), (0.1, 1.05), (0.04, 1.11), (0.0, 1.12)], coll, blanco,
               segments=32).location = (0, 0.24, 0)
    clay.lathe('punta cohete', [(0.1, 1.05), (0.045, 1.11), (0.0, 1.13), (0.0, 1.05)], coll, rojo, segments=24).location = (0, 0.24, 0)
    for k, z in enumerate((0.58, 0.88)):
        clay.lathe(f'banda cohete {k}', [(0.168, z - 0.018), (0.176, z), (0.168, z + 0.018)], coll, (azul, rojo)[k], segments=32, cap_bottom=False,
                   cap_top=False).location = (0, 0.24, 0)
    aro_y('aro ventanilla', (0, 0.08, 0.74), 0.065, 0.014, coll, c)
    clay.blob('ventanilla', (0, 0.076, 0.74), (0.058, 0.012, 0.058), coll, luz('ventanilla', '#7FD8FF', 1.2), n=7)
    clay.blob('brillo ventanilla', (-0.02, 0.066, 0.76), (0.015, 0.004, 0.01), coll, luz('brillo', '#FFFFFF', 3.0), n=4)
    for k in range(8):
        a = 2 * math.pi * k / 8
        clay.blob(f'remache {k}', (0.08 * math.cos(a), 0.072, 0.74 + 0.08 * math.sin(a)), (0.007, 0.004, 0.007), coll, c, n=3)
    clay.sweep('antena', [(0, 0.24, 1.12), (0, 0.24, 1.28)], 0.007, (1, 1), coll, c, segments=6, samples=2)
    clay.blob('luz antena', (0, 0.24, 1.3), (0.025, 0.025, 0.025), coll, luz('luz antena', '#FF5A5A', 4.0), n=6)
    # Aletas rojas alrededor del pie
    for k, a in enumerate((math.pi * 0.25, math.pi * 0.75, math.pi * 1.5)):
        al = clay.blob(f'aleta {k}', (0, 0, 0), (0.035, 0.12, 0.16), coll, rojo, n=8,
                       shaper=lambda v: np.column_stack([v[:, 0], v[:, 1] + np.maximum(0, -v[:, 2]) * 0.6, v[:, 2]]))
        al.location = (0.2 * math.cos(a), 0.2 * math.sin(a), 0.14)
        al.rotation_euler = (0, 0, a + math.pi / 2)
    for k in range(3):
        clay.lathe(f'tobera {k}', [(0.05, 0.0), (0.075, -0.06), (0.07, -0.065), (0.04, -0.005)], coll, m('tobera', '#5A5E66', rough=0.3, metallic=0.9),
                   segments=20, cap_bottom=False, cap_top=False).location = (0.09 * math.cos(k * 2.1), 0.09 * math.sin(k * 2.1), 0.0)


def retrete_princesa(coll):
    """Rosadito, con la tapa del tanque en corazón, tiara, moños y aros dorados."""
    rosa = laca('princesa', '#F7B6CF', 0.22)
    blanco = peluche('princesa', '#FFF4FA')
    o = oro()
    inodoro_base(coll, rosa, asiento=blanco, tanque=rosa, tapa_tanque=rosa, palanca=o, tapa=blanco)
    for k, z in enumerate((0.02, 0.36)):
        clay.lathe(f'aro dorado {k}', [(0.16 if k == 0 else 0.2, z - 0.01), (0.168 if k == 0 else 0.208, z), (0.16 if k == 0 else 0.2, z + 0.01)], coll, o,
                   segments=32, cap_bottom=False, cap_top=False)
    corazon_plano('corazón tanque', (0, 0.2, 0.98), 0.62, coll, laca('corazón princesa', '#F2649A', 0.2), grosor=0.3)
    # Tiara encima del corazón
    aro_z('aro tiara', (0, 0.2, 1.09), 0.09, 0.05, 0.007, coll, o, n=20)
    for k in range(5):
        a = math.pi * (0.15 + 0.175 * k)
        x, y = 0.09 * math.cos(a), 0.2 - 0.05 * math.sin(a)
        h = 0.07 if k == 2 else 0.045
        clay.sweep(f'pico tiara {k}', [(x, y, 1.09), (x, y, 1.09 + h)], 0.014, (1, 0.4), coll, o, segments=6, samples=2, caps=('flat', 'point'))
        gema(f'gema tiara {k}', (x, y - 0.01, 1.105), 0.012, coll, m('gema rosada', '#FF6FA8', rough=0.05, coat=1.0))
    # Moños a los lados del tanque
    for sx in (-1, 1):
        x = sx * 0.235
        for lado in (-1, 1):
            colocar(clay.blob(f'lazo {sx}{lado}', (0, 0, 0), (0.02, 0.045, 0.032), coll, laca('moño', '#E8396E', 0.3), n=6), (x + sx * 0.012, 0.22 + lado * 0.05, 0.72), (lado * 0.4, 0, 0))
        clay.blob(f'nudo {sx}', (x + sx * 0.02, 0.22, 0.72), (0.02, 0.022, 0.022), coll, laca('moño', '#E8396E', 0.3), n=5)
    # Corazoncitos en el pie
    for k in range(3):
        a = -math.pi / 2 + (k - 1) * 0.6
        corazon_plano(f'corazón pie {k}', (0.14 * math.cos(a), 0.14 * math.sin(a) - 0.005, 0.2), 0.1, coll, laca('corazón princesa', '#F2649A', 0.2), grosor=0.3)


def retrete_gamer(coll):
    """Negro mate con tiras RGB, portavasos con gaseosa y audífonos colgando del tanque."""
    negro = m('gamer negro', '#25262E', rough=0.45, coat=0.3)
    gris = m('gamer gris', '#3A3C48', rough=0.4)
    inodoro_base(coll, negro, asiento=gris, tanque=negro, tapa_tanque=gris, palanca=rgb(1, '#FF3FA4'), tapa=gris)
    aro_z('tira rgb asiento', (0, -0.05, 0.425), 0.205, 0.25, 0.008, coll, rgb(2, '#3FD5FF'))
    clay.lathe('tira rgb pie', [(0.12, 0.09), (0.127, 0.1), (0.12, 0.11)], coll, rgb(3, '#7CFF6B'), segments=32, cap_bottom=False, cap_top=False)
    for k, (z, col) in enumerate(((0.47, '#FF3FA4'), (0.83, '#3FD5FF'))):
        clay.rbox(f'tira rgb tanque {k}', (0, 0.22, z), (0.228, 0.108, 0.006), coll, rgb(4 + k, col), p=8, n=3)
    # Logo: un control en el frente del tanque
    clay.rbox('control', (0, 0.115, 0.66), (0.075, 0.012, 0.04), coll, gris, p=3, n=5)
    for sx in (-1, 1):
        clay.blob(f'agarre {sx}', (sx * 0.06, 0.113, 0.635), (0.03, 0.012, 0.035), coll, gris, n=5)
    for k, (dx, dz, col) in enumerate(((0.035, 0.012, '#FF5A5A'), (0.05, -0.004, '#3FD5FF'), (0.02, -0.004, '#7CFF6B'), (0.035, -0.02, '#FFD23F'))):
        clay.blob(f'botón {k}', (dx, 0.1, 0.66 + dz), (0.007, 0.004, 0.007), coll, rgb(6 + k, col), n=3)
    clay.rbox('cruceta', (-0.035, 0.1, 0.66), (0.018, 0.004, 0.006), coll, negro, p=6, n=3)
    clay.rbox('cruceta 2', (-0.035, 0.1, 0.66), (0.006, 0.004, 0.018), coll, negro, p=6, n=3)
    # Audífonos sobre el tanque
    clay.sweep('diadema audífonos', [(-0.17, 0.22, 0.88), (-0.12, 0.22, 1.0), (0.0, 0.22, 1.04), (0.12, 0.22, 1.0), (0.17, 0.22, 0.88)], 0.014, (1, 0.6), coll, gris,
               segments=8, samples=4, up=(0, 1, 0))
    for sx in (-1, 1):
        clay.blob(f'copa audífono {sx}', (sx * 0.17, 0.22, 0.89), (0.03, 0.06, 0.06), coll, negro, n=6)
        clay.blob(f'luz audífono {sx}', (sx * 0.202, 0.22, 0.89), (0.006, 0.035, 0.035), coll, rgb(10, '#B65CFF'), n=5)
    # Portavasos con gaseosa
    clay.sweep('brazo portavasos', [(0.22, 0.2, 0.55), (0.3, 0.12, 0.55)], 0.01, (1, 1), coll, gris, segments=6, samples=2)
    clay.lathe('portavasos', [(0.0, 0.0), (0.045, 0.0), (0.05, 0.05), (0.044, 0.05), (0.04, 0.006), (0.0, 0.006)], coll, gris, segments=20).location = (0.33, 0.1, 0.52)
    clay.lathe('lata', [(0.0, 0.0), (0.036, 0.0), (0.038, 0.01), (0.038, 0.11), (0.03, 0.125), (0.0, 0.125)], coll, laca('lata gaseosa', '#E4374B', 0.25), segments=20).location = (0.33, 0.1, 0.53)
    clay.sweep('pitillo', [(0.33, 0.1, 0.64), (0.335, 0.1, 0.72), (0.31, 0.1, 0.76)], 0.006, (1, 1), coll, rgb(11, '#7CFF6B'), segments=6, samples=3)


def retrete_trono(coll):
    """Trono dorado: oro, cojín de terciopelo, espaldar alto con corona y brazos con garras de león."""
    o = oro()
    terciopelo = tela('terciopelo trono', '#B3203A')
    inodoro_base(coll, o, asiento=o, con_tanque=False, con_tapa=False, palanca=o)
    aro_z('cojín asiento', (0, -0.05, 0.47), 0.17, 0.215, 0.035, coll, terciopelo, prof=(1.0, 1.4))
    # Espaldar
    clay.rbox('espaldar trono', (0, 0.27, 0.95), (0.3, 0.05, 0.5), coll, o, p=5, n=6)
    clay.rbox('terciopelo espaldar', (0, 0.215, 0.95), (0.24, 0.012, 0.42), coll, terciopelo, p=5, n=6)
    for k in range(3):
        for j in range(4):
            clay.blob(f'botón capitoné {k}{j}', (-0.14 + k * 0.14, 0.2, 0.65 + j * 0.18), (0.014, 0.008, 0.014), coll, o, n=4)
    clay.blob('remate trono', (0, 0.27, 1.47), (0.2, 0.06, 0.08), coll, o, n=8)
    # Corona encima
    aro_z('aro corona trono', (0, 0.27, 1.56), 0.11, 0.08, 0.015, coll, o, n=24)
    for k in range(6):
        a = 2 * math.pi * k / 6
        x, y = 0.11 * math.cos(a), 0.27 + 0.08 * math.sin(a)
        clay.sweep(f'pico corona {k}', [(x, y, 1.56), (x, y, 1.66)], 0.03, (1, 0.4), coll, o, segments=6, samples=2, caps=('flat', 'point'), up=(math.cos(a), math.sin(a), 0))
        clay.blob(f'perla corona {k}', (x, y, 1.675), (0.014, 0.014, 0.014), coll, m('perla', '#FFF8EE', rough=0.2, coat=0.8), n=4)
    gema('rubí corona', (0, 0.18, 1.58), 0.028, coll, m('rubí', '#D3123A', rough=0.05, coat=1.0))
    # Brazos con garra de león
    for sx in (-1, 1):
        clay.rbox(f'brazo trono {sx}', (sx * 0.29, 0.02, 0.62), (0.04, 0.24, 0.035), coll, o, p=4, n=6)
        clay.rbox(f'pata brazo {sx}', (sx * 0.29, 0.12, 0.4), (0.03, 0.03, 0.2), coll, o, p=4, n=5)
        clay.blob(f'garra {sx}', (sx * 0.29, -0.23, 0.6), (0.05, 0.05, 0.05), coll, o, n=6)
        for k in range(3):
            clay.blob(f'dedo garra {sx}{k}', (sx * 0.29 + (k - 1) * 0.025, -0.27, 0.58), (0.014, 0.022, 0.014), coll, o, n=4)


def retrete_diamantes(coll):
    """Oro con diamantes incrustados y un diamante enorme encima del tanque."""
    o = oro()
    d = diamante()
    inodoro_base(coll, o, asiento=m('nácar', '#FFF8F0', rough=0.15, coat=1.0), tanque=o, tapa_tanque=o, palanca=o, tapa=m('nácar', '#FFF8F0', rough=0.15, coat=1.0))
    # Filas de diamantes en el frente del tanque
    for fila, z in enumerate((0.5, 0.58, 0.66, 0.74)):
        for k in range(7):
            x = -0.18 + k * 0.06 + (0.03 if fila % 2 else 0)
            if abs(x) > 0.2:
                continue
            g = gema(f'diamante tanque {fila}{k}', (x, 0.112, z), 0.018, coll, d)
            g.rotation_euler = (math.pi / 2, 0, 0)
    for k in range(14):
        a = 2 * math.pi * k / 14
        g = gema(f'diamante pie {k}', (0.15 * math.cos(a), 0.15 * math.sin(a), 0.16), 0.016, coll, d)
        g.rotation_euler = (math.pi / 2, 0, a - math.pi / 2)
    for k in range(18):
        a = 2 * math.pi * k / 18
        gema(f'diamante asiento {k}', (0.19 * math.cos(a), -0.05 + 0.235 * math.sin(a), 0.475), 0.012, coll, d)
    gema('diamante grande', (0, 0.22, 0.96), 0.09, coll, d, alto=1.2)
    aro_z('engaste', (0, 0.22, 0.88), 0.07, 0.07, 0.012, coll, o, n=20)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        clay.sweep(f'garra engaste {k}', [(0.07 * math.cos(a), 0.22 + 0.07 * math.sin(a), 0.875), (0.085 * math.cos(a), 0.22 + 0.085 * math.sin(a), 0.95)], 0.008,
                   (1, 1), coll, o, segments=6, samples=2)


RETRETES = {
    'porcelana': retrete_porcelana, 'madera': retrete_madera, 'portatil': retrete_portatil, 'chiva': retrete_chiva, 'nave': retrete_nave,
    'princesa': retrete_princesa, 'gamer': retrete_gamer, 'trono': retrete_trono, 'diamantes': retrete_diamantes,
}


# ---------------------------------------------------------------------------
# El rollito dorado y los poderes
# ---------------------------------------------------------------------------

def rollito(coll):
    o = oro('oro rollito')
    rollo_papel('rollito', (0, 0, 0), coll, o, r=0.11, h=0.15, hueco=0.035, eje='y', mat_tubo=m('tubo dorado', '#C98A00', rough=0.4, metallic=0.6))


def poder_escudo(coll):
    """Jabón de baño con espuma y burbujitas."""
    clay.rbox('jabón', (0, 0, 0.09), (0.16, 0.1, 0.07), coll, laca('jabón', '#8FE3C8', 0.25), p=3, n=8)
    clay.rbox('sello jabón', (0, -0.1, 0.09), (0.09, 0.006, 0.035), coll, laca('jabón claro', '#C8F5E6', 0.25), p=3, n=5)
    rng = np.random.default_rng(5)
    for k in range(9):
        x, y = rng.uniform(-0.12, 0.12), rng.uniform(-0.07, 0.07)
        s = rng.uniform(0.025, 0.05)
        clay.blob(f'espuma {k}', (x, y, 0.16 + s * 0.4), (s, s, s * 0.8), coll, m('espuma', '#FFFFFF', rough=0.6), n=5)
    for k, (x, z, r) in enumerate(((-0.08, 0.3, 0.05), (0.07, 0.36, 0.035), (0.0, 0.45, 0.07), (0.12, 0.25, 0.03))):
        clay.blob(f'burbuja {k}', (x, 0, z), (r, r, r), coll, vidrio('burbuja', '#D6F4FF', 0.35), n=8)
        clay.blob(f'brillo burbuja {k}', (x - r * 0.35, -r * 0.6, z + r * 0.35), (r * 0.25, r * 0.12, r * 0.15), coll, luz('brillo', '#FFFFFF', 2.0), n=3)


def iman(coll, nombre='imán'):
    """Imán de herradura rojo con las puntas plateadas (la U se abre hacia +x)."""
    rojo = laca('imán rojo', '#E4374B', 0.25)
    pts = [(0.12, -0.09, 0), (-0.02, -0.09, 0), (-0.11, -0.06, 0), (-0.13, 0, 0), (-0.11, 0.06, 0), (-0.02, 0.09, 0), (0.12, 0.09, 0)]
    clay.sweep(nombre, pts, 0.045, (1, 1.1), coll, rojo, segments=10, samples=5, caps=('flat', 'flat'), up=(0, 0, 1))
    for sy in (-1, 1):
        clay.rbox(f'punta {nombre} {sy}', (0.15, sy * 0.09, 0), (0.035, 0.047, 0.05), coll, cromo(), p=4, n=5)
    for k in range(3):
        clay.sweep(f'chispa {nombre} {k}', [(0.2, -0.05 + k * 0.05, 0.0), (0.24, -0.06 + k * 0.06, 0.02), (0.27, -0.05 + k * 0.05, -0.01)], 0.006, (1, 1), coll,
                   luz('chispa imán', '#7FC8FF', 3.0), segments=5, samples=3)


def poder_iman(coll):
    iman(coll)
    for o in coll.objects:
        o.rotation_euler = (math.pi / 2, 0, 0)
        o.location = (0, 0, 0.15)


def poder_turbo(coll):
    """Lata de frijoles (con su etiqueta y frijolitos pintados) echando gas verde."""
    lata = m('lata', '#C9CCD2', rough=0.25, metallic=0.9)
    clay.lathe('lata frijoles', [(0.0, 0.0), (0.085, 0.0), (0.09, 0.012), (0.09, 0.2), (0.085, 0.215), (0.0, 0.215)], coll, lata, segments=28)
    for z in (0.03, 0.06, 0.15, 0.18):
        clay.lathe(f'anillo lata {z}', [(0.09, z - 0.004), (0.093, z), (0.09, z + 0.004)], coll, lata, segments=28, cap_bottom=False, cap_top=False)
    clay.lathe('etiqueta', [(0.0915, 0.07), (0.0915, 0.14)], coll, papel('etiqueta frijoles', '#8A3B1E'), segments=28, cap_bottom=False, cap_top=False)
    clay.lathe('franja etiqueta', [(0.0925, 0.098), (0.0925, 0.112)], coll, papel('franja etiqueta', '#F7C948'), segments=28, cap_bottom=False, cap_top=False)
    rng = np.random.default_rng(2)
    for k in range(6):
        a = -math.pi / 2 + (k - 2.5) * 0.28
        colocar(clay.blob(f'frijol pintado {k}', (0, 0, 0), (0.006, 0.012, 0.008), coll, laca('frijol', '#6B2A1E', 0.3), n=4),
                (0.095 * math.cos(a), 0.095 * math.sin(a), 0.085 + (k % 2) * 0.04), (0, 0, a))
    clay.lathe('tapa abierta', [(0.0, 0.0), (0.086, 0.0), (0.086, 0.006), (0.0, 0.006)], coll, lata, segments=24)
    t = list(coll.objects)[-1]
    t.location = (0.06, 0.03, 0.27)
    t.rotation_euler = (0.3, -0.9, 0)
    # Frijoles que se salen y el gas verde
    for k in range(5):
        colocar(clay.blob(f'frijol {k}', (0, 0, 0), (0.022, 0.014, 0.014), coll, laca('frijol', '#6B2A1E', 0.3), n=5),
                (rng.uniform(-0.05, 0.05), rng.uniform(-0.05, 0.05), 0.22 + rng.uniform(0, 0.02)), (0, 0, rng.uniform(0, 3)))
    for k, (x, z, r) in enumerate(((-0.04, 0.3, 0.06), (0.04, 0.36, 0.07), (-0.02, 0.45, 0.08), (0.06, 0.5, 0.05))):
        clay.blob(f'gas {k}', (x, 0, z), (r, r * 0.9, r * 0.85), coll, m('gas', '#B5E08A', rough=0.9), n=6)


def poder_lenta(coll):
    """Reloj de arena con marco de madera."""
    mad = madera('reloj arena', '#A8703F')
    for z in (0.0, 0.4):
        clay.rbox(f'tapa reloj {z}', (0, 0, z + 0.015), (0.12, 0.12, 0.018), coll, mad, p=4, n=5)
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.5
        clay.sweep(f'columna {k}', [(0.1 * math.cos(a), 0.1 * math.sin(a), 0.03), (0.1 * math.cos(a), 0.1 * math.sin(a), 0.4)], 0.012, (1, 1), coll, mad, segments=6, samples=2)
    clay.lathe('vidrio reloj', [(0.02, 0.03), (0.08, 0.05), (0.085, 0.13), (0.03, 0.2), (0.015, 0.215), (0.03, 0.23), (0.085, 0.3), (0.08, 0.38), (0.02, 0.4)], coll,
               vidrio('vidrio reloj', '#E0F4FF', 0.28), segments=24, cap_bottom=False, cap_top=False)
    clay.lathe('arena abajo', [(0.0, 0.035), (0.075, 0.05), (0.07, 0.09), (0.0, 0.12)], coll, m('arena', '#F2C14E', rough=0.8), segments=20)
    clay.lathe('arena arriba', [(0.0, 0.25), (0.05, 0.27), (0.07, 0.31), (0.0, 0.31)], coll, m('arena', '#F2C14E', rough=0.8), segments=20)
    clay.sweep('chorrito', [(0, 0, 0.12), (0, 0, 0.26)], 0.004, (1, 1), coll, m('arena', '#F2C14E', rough=0.8), segments=5, samples=2)


def poder_doble(coll):
    """Medalla dorada con un «×2» en relieve."""
    o = oro()
    clay.lathe('medalla', [(0.0, -0.03), (0.17, -0.03), (0.19, 0.0), (0.17, 0.03), (0.0, 0.03)], coll, o, segments=36)
    list(coll.objects)[-1].rotation_euler = (math.pi / 2, 0, 0)
    aro_y('borde medalla', (0, -0.03, 0), 0.15, 0.012, coll, laca('borde medalla', '#C98A00', 0.3))
    letra = laca('letra medalla', '#FFF2A8', 0.2)
    clay.sweep('equis 1', [(-0.12, -0.045, -0.05), (-0.04, -0.045, 0.05)], 0.018, (1, 1), coll, letra, segments=8, samples=2)
    clay.sweep('equis 2', [(-0.12, -0.045, 0.05), (-0.04, -0.045, -0.05)], 0.018, (1, 1), coll, letra, segments=8, samples=2)
    clay.sweep('dos', [(0.0, -0.045, 0.05), (0.04, -0.045, 0.085), (0.09, -0.045, 0.06), (0.08, -0.045, 0.0), (0.01, -0.045, -0.07), (0.1, -0.045, -0.07)],
               0.018, (1, 1), coll, letra, segments=8, samples=4, up=(0, 1, 0))
    for k in range(2):
        clay.sweep(f'cinta {k}', [(0.0, 0.0, -0.17), ((k - 0.5) * 0.12, 0.0, -0.3)], 0.03, (1.4, 0.3), coll, laca('cinta medalla', '#E4374B' if k else '#2456C9', 0.3),
                   segments=6, samples=2, caps=('flat', 'flat'), up=(0, 1, 0))


def desatascador(coll, nombre='desatascador', brillo=True):
    """Desatascador de palo con la copa roja (apuntando hacia +x)."""
    clay.sweep(f'palo {nombre}', [(-0.3, 0, 0), (0.08, 0, 0)], 0.02, (1, 1), coll, madera('palo desatascador', '#C9956A'), segments=10, samples=2)
    clay.lathe(f'copa {nombre}', [(0.0, 0.0), (0.03, 0.0), (0.06, 0.03), (0.085, 0.08), (0.08, 0.1), (0.0, 0.1)], coll, laca('copa desatascador', '#D93A3A', 0.35),
               segments=24)
    c = list(coll.objects)[-1]
    c.rotation_euler = (0, math.pi / 2, 0)
    c.location = (0.07, 0, 0)
    if brillo:
        clay.blob(f'láser {nombre}', (0.2, 0, 0), (0.035, 0.035, 0.035), coll, luz('láser', '#FF4FA3', 4.0), n=6)
        aro_y(f'aro láser {nombre}', (0.17, 0, 0), 0.07, 0.008, coll, cromo())
    clay.blob(f'tapa palo {nombre}', (-0.31, 0, 0), (0.025, 0.025, 0.025), coll, laca('tapa palo', '#2456C9'), n=5)


def poder_laser(coll):
    antes = set(coll.objects)
    desatascador(coll)
    colocar(agrupar(coll, 'desatascador inclinado', [o for o in coll.objects if o not in antes and o.parent is None]), (0, 0, 0), (0, -0.8, 0))


def mini_retrete(coll, helice=True):
    """El mini-retrete ayudante: un inodorito con hélice en la cabeza."""
    import bpy
    antes = set(coll.objects)
    inodoro_base(coll, porcelana(), asiento=laca('mini asiento', '#8FE3C8', 0.3), tapa=laca('mini asiento', '#8FE3C8', 0.3))
    for sx in (-1, 1):
        clay.blob(f'ojo mini {sx}', (sx * 0.07, 0.115, 0.68), (0.03, 0.012, 0.04), coll, m('negro', '#2A2A30', rough=0.5), n=5)
        clay.blob(f'brillo ojo mini {sx}', (sx * 0.07 - 0.01, 0.105, 0.695), (0.01, 0.005, 0.012), coll, luz('brillo', '#FFFFFF', 2.0), n=3)
    clay.sweep('sonrisa mini', [(-0.05, 0.11, 0.6), (0.0, 0.106, 0.58), (0.05, 0.11, 0.6)], 0.008, (1, 1), coll, m('negro', '#2A2A30', rough=0.5), segments=6, samples=3)
    if helice:
        clay.sweep('eje hélice', [(0, 0.22, 0.87), (0, 0.22, 0.97)], 0.012, (1, 1), coll, cromo(), segments=6, samples=2)
        piezas = []
        piezas.append(clay.blob('centro hélice', (0, 0, 0), (0.03, 0.03, 0.02), coll, laca('hélice centro', '#FFD23F'), n=5))
        for k in range(3):
            a = 2 * math.pi * k / 3
            b = clay.blob(f'aspa {k}', (0.13, 0, 0), (0.12, 0.035, 0.008), coll, laca('aspa', '#E4574B' if k % 2 else '#2456C9'), n=6)
            piezas.append(colocar(agrupar(coll, f'giro aspa {k}', [b]), (0, 0, 0), (0, 0, a)))
            b.rotation_euler = (0.25, 0, 0)
        h = bpy.data.objects.new('helice', None)
        clay.link(h, coll)
        h.location = (0, 0.22, 0.98)
        for p in piezas:
            p.parent = h
    nuevos = [o for o in coll.objects if o not in antes]
    return nuevos


def poder_mini(coll):
    mini_retrete(coll)


def ayudante(coll):
    mini_retrete(coll)


def poder_hormiga(coll):
    """Pastilla encogedora: cápsula rosada y blanca con destellos."""
    for k, (col, z) in enumerate((('#F7A8D8', 0.06), ('#FFFFFF', -0.06))):
        clay.blob(f'mitad cápsula {k}', (0, 0, z), (0.07, 0.07, 0.11), coll, laca(f'cápsula {k}', col, 0.2), n=10,
                  shaper=(lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], -0.4 * 0.11)])) if k == 0 else
                  (lambda v: np.column_stack([v[:, 0], v[:, 1], np.minimum(v[:, 2], 0.4 * 0.11)])))
    for o in list(coll.objects)[-2:]:
        o.rotation_euler = (0, 0.8, 0)
        o.location = (0, 0, 0.12)
    for k, (x, z) in enumerate(((0.14, 0.24), (-0.12, 0.04), (0.1, 0.0))):
        estrella_plana(f'destello {k}', (x, -0.02, z), 0.035, coll, luz('destello', '#FFE27A', 3.0), grosor=0.01)


def poder_ambientador(coll):
    """Spray de lavanda con su florecita."""
    lila = laca('ambientador', '#B79BF2', 0.25)
    clay.lathe('lata spray', [(0.0, 0.0), (0.07, 0.0), (0.075, 0.015), (0.075, 0.28), (0.06, 0.32), (0.035, 0.335), (0.0, 0.335)], coll, lila, segments=28)
    clay.lathe('franja spray', [(0.0765, 0.1), (0.0765, 0.2)], coll, papel('etiqueta spray', '#FFFFFF'), segments=28, cap_bottom=False, cap_top=False)
    clay.lathe('botón spray', [(0.0, 0.33), (0.03, 0.33), (0.03, 0.37), (0.0, 0.37)], coll, plastico('botón spray', '#FFFFFF'), segments=16)
    clay.sweep('boquilla', [(0.0, -0.02, 0.355), (0.0, -0.045, 0.355)], 0.007, (1, 1), coll, plastico('boquilla', '#FFFFFF'), segments=6, samples=2)
    for k in range(6):
        a = 2 * math.pi * k / 6
        clay.blob(f'pétalo lavanda {k}', (0.025 * math.cos(a), -0.08, 0.15 + 0.025 * math.sin(a)), (0.016, 0.004, 0.016), coll, laca('flor lavanda', '#8C5BD6'), n=4)
    clay.blob('centro flor', (0, -0.082, 0.15), (0.01, 0.004, 0.01), coll, laca('centro flor', '#FFD23F'), n=3)
    for k, (x, z, r) in enumerate(((0.0, 0.42, 0.04), (-0.05, 0.47, 0.05), (0.03, 0.52, 0.04))):
        clay.blob(f'aroma {k}', (x, -0.06, z), (r, r * 0.7, r), coll, m('aroma', '#E3D6FF', rough=0.9), n=5)


def poder_paca(coll):
    """Paca de 12 rollos envuelta en plástico, con su cinta para cargarla."""
    blanco = papel('papel', '#FBFBF6')
    for k in range(12):
        i, j = k % 4, k // 4
        rollo_papel(f'rollo paca {k}', (-0.165 + i * 0.11, 0.0, 0.06 + j * 0.115), coll, blanco, r=0.053, h=0.1, hueco=0.018, eje='y', tira=False)
    clay.rbox('plástico paca', (0, 0, 0.18), (0.235, 0.065, 0.185), coll, vidrio('plástico paca', '#EAF4FF', 0.25), p=4, n=6)
    clay.rbox('etiqueta paca', (0, -0.068, 0.2), (0.12, 0.004, 0.07), coll, papel('etiqueta paca', '#5AA0F0'), p=4, n=4)
    clay.blob('nube etiqueta', (0, -0.073, 0.21), (0.05, 0.003, 0.03), coll, papel('nube etiqueta', '#FFFFFF'), n=5)
    clay.sweep('asa paca', [(-0.08, 0.0, 0.36), (-0.06, 0.0, 0.44), (0.06, 0.0, 0.44), (0.08, 0.0, 0.36)], 0.012, (1.6, 0.4), coll, plastico('asa paca', '#E4574B'),
               segments=6, samples=4, up=(0, 1, 0))


PODERES = {
    'poder_escudo': poder_escudo, 'poder_iman': poder_iman, 'poder_turbo': poder_turbo, 'poder_lenta': poder_lenta, 'poder_doble': poder_doble,
    'poder_laser': poder_laser, 'poder_mini': poder_mini, 'poder_hormiga': poder_hormiga, 'poder_ambientador': poder_ambientador, 'poder_paca': poder_paca,
}


# ---------------------------------------------------------------------------
# Lo que va pegado al retrete (imán y cañón desatascador)
# ---------------------------------------------------------------------------

def iman_nave(coll):
    iman(coll, 'imán nave')


def canon_nave(coll):
    """Cañón desatascador: el desatascador montado en una abrazadera con su luz de carga."""
    desatascador(coll, 'cañón')
    for o in coll.objects:
        o.location = (o.location[0] + 0.12, o.location[1], o.location[2])
    clay.rbox('abrazadera', (-0.05, 0, 0), (0.05, 0.04, 0.045), coll, cromo(), p=4, n=5)
    clay.blob('foco carga', (-0.05, -0.045, 0.02), (0.014, 0.008, 0.014), coll, luz('foco carga', '#7CFF6B', 3.0), n=4)


# ---------------------------------------------------------------------------
# Obstáculos
# ---------------------------------------------------------------------------

def obst_satelite(coll):
    """Satélite: cuerpo forrado en lámina dorada, dos alas de paneles solares, antena de plato y antenitas."""
    lamina = m('lámina dorada', '#E8B54A', rough=0.35, metallic=0.85)
    clay.rbox('cuerpo satélite', (0, 0, 0), (0.32, 0.3, 0.36), coll, lamina, p=5, n=6)
    rng = np.random.default_rng(4)
    for k in range(10):
        colocar(clay.blob(f'arruga {k}', (0, 0, 0), (0.06, 0.012, 0.03), coll, lamina, n=4), (rng.uniform(-0.3, 0.3), -0.3, rng.uniform(-0.32, 0.32)), (0, rng.uniform(0, 3), 0))
    clay.rbox('banda satélite', (0, 0, 0.0), (0.335, 0.315, 0.04), coll, m('banda satélite', '#E6E8EC', rough=0.3, metallic=0.6), p=6, n=4)
    panel = m('panel solar', '#1E3E8A', rough=0.2, metallic=0.4, coat=0.8)
    linea = m('linea panel', '#C9D2E6', rough=0.3, metallic=0.8)
    for sx in (-1, 1):
        clay.sweep(f'brazo panel {sx}', [(sx * 0.32, 0, 0), (sx * 0.55, 0, 0)], 0.025, (1, 1), coll, linea, segments=6, samples=2)
        for k in range(3):
            x = sx * (0.75 + k * 0.42)
            clay.rbox(f'panel {sx}{k}', (x, 0, 0), (0.2, 0.012, 0.3), coll, panel, p=8, n=4)
            for j in range(4):
                clay.rbox(f'rayita {sx}{k}{j}', (x, -0.014, -0.225 + j * 0.15), (0.2, 0.003, 0.004), coll, linea, p=8, n=3)
            clay.rbox(f'rayita v {sx}{k}', (x, -0.014, 0), (0.004, 0.003, 0.3), coll, linea, p=8, n=3)
    clay.lathe('plato antena', [(0.0, 0.0), (0.12, 0.04), (0.2, 0.1), (0.21, 0.11), (0.0, 0.03)], coll, m('plato', '#F2F2F4', rough=0.3), segments=24)
    p = list(coll.objects)[-1]
    p.location = (0, -0.35, 0.36)
    p.rotation_euler = (math.radians(110), 0, 0)
    clay.sweep('receptor', [(0, -0.4, 0.4), (0, -0.52, 0.5)], 0.01, (1, 1), coll, linea, segments=5, samples=2)
    clay.blob('luz satélite', (0.25, -0.3, 0.3), (0.025, 0.025, 0.025), coll, luz('luz satélite', '#FF5A5A', 4.0), n=5)
    for k in range(2):
        clay.sweep(f'antenita {k}', [(-0.2 + k * 0.4, 0.1, 0.36), (-0.25 + k * 0.5, 0.15, 0.62)], 0.006, (1, 1), coll, linea, segments=5, samples=2)


def obst_inodoro(coll):
    """Un inodoro viejo y amarillento, rajado, con la tapa abierta y una mosca."""
    viejo = m('porcelana vieja', '#E8DDB5', rough=0.4, coat=0.2)
    inodoro_base(coll, viejo, asiento=m('asiento viejo', '#BFA77A', rough=0.5), tapa=m('asiento viejo', '#BFA77A', rough=0.5),
                 palanca=m('palanca oxidada', '#9A6A3E', rough=0.6, metallic=0.6))
    raja = m('raja', '#5A4A30', rough=0.9)
    clay.sweep('raja 1', [(-0.1, 0.115, 0.75), (-0.05, 0.113, 0.68), (-0.08, 0.112, 0.6), (-0.02, 0.112, 0.52)], 0.005, (1, 1), coll, raja, segments=4, samples=3)
    clay.sweep('raja 2', [(0.08, -0.2, 0.38), (0.12, -0.18, 0.3), (0.1, -0.15, 0.22)], 0.005, (1, 1), coll, raja, segments=4, samples=3)
    clay.blob('mancha', (0.12, 0.115, 0.55), (0.04, 0.005, 0.03), coll, m('mancha', '#B8A070', rough=0.9), n=4)
    for k, (x, y, z) in enumerate(((0.1, -0.2, 0.62), (-0.15, -0.1, 0.7))):
        clay.blob(f'mosca {k}', (x, y, z), (0.018, 0.014, 0.012), coll, m('mosca', '#2A2A30', rough=0.5), n=4)
        for sx in (-1, 1):
            clay.blob(f'ala mosca {k}{sx}', (x + sx * 0.015, y + 0.01, z + 0.012), (0.015, 0.008, 0.003), coll, vidrio('ala mosca', '#DDE8F0', 0.5), n=4)


def obst_chancla(coll):
    """La chancla voladora (de la mamá): suela azul con tiras amarillas y su florecita."""
    suela = m('suela chancla', '#2F7DE1', rough=0.55)
    clay.blob('suela', (0, 0, 0), (0.13, 0.3, 0.03), coll, suela, n=10,
              shaper=lambda v: np.column_stack([v[:, 0] * (1.0 - 0.18 * np.clip(-v[:, 1] / 0.3, 0, 1)) - 0.02 * np.sin(v[:, 1] * 6), v[:, 1], v[:, 2]]))
    clay.blob('plantilla', (0, 0, 0.026), (0.115, 0.28, 0.008), coll, m('plantilla chancla', '#F7C948', rough=0.6), n=10,
              shaper=lambda v: np.column_stack([v[:, 0] * (1.0 - 0.18 * np.clip(-v[:, 1] / 0.3, 0, 1)) - 0.02 * np.sin(v[:, 1] * 6), v[:, 1], v[:, 2]]))
    tira = m('tira chancla', '#FFFFFF', rough=0.5)
    for sx in (-1, 1):
        clay.sweep(f'tira {sx}', [(0.0, -0.17, 0.035), (sx * 0.05, -0.06, 0.09), (sx * 0.11, 0.05, 0.03)], 0.016, (1.4, 0.7), coll, tira, segments=8, samples=4)
    clay.blob('nudo tira', (0, -0.17, 0.045), (0.02, 0.02, 0.015), coll, tira, n=5)
    for k in range(5):
        a = 2 * math.pi * k / 5
        clay.blob(f'pétalo chancla {k}', (0.022 * math.cos(a), -0.06 + 0.022 * math.sin(a), 0.1), (0.016, 0.016, 0.006), coll, laca('flor chancla', '#E8396E'), n=4)


def obst_lata(coll):
    """Lata de gaseosa medio estripada."""
    rojo = laca('lata roja', '#D9283A', 0.25)
    clay.lathe('lata vieja', [(0.0, 0.0), (0.06, 0.0), (0.066, 0.015), (0.066, 0.2), (0.052, 0.225), (0.0, 0.225)], coll, rojo, segments=24)
    lata = list(coll.objects)[-1]
    for v in lata.data.vertices:
        if 0.07 < v.co.z < 0.15:
            v.co.x *= 0.82 + 0.15 * math.sin(math.atan2(v.co.y, v.co.x) * 3)
    clay.lathe('ola lata', [(0.0665, 0.09), (0.0665, 0.12)], coll, laca('ola lata', '#FFFFFF', 0.3), segments=24, cap_bottom=False, cap_top=False)
    clay.lathe('tapa lata', [(0.0, 0.223), (0.05, 0.223), (0.05, 0.228), (0.0, 0.228)], coll, m('aluminio', '#C9CCD2', rough=0.25, metallic=0.9), segments=20)
    clay.blob('anillo lata', (0.015, 0.0, 0.232), (0.02, 0.012, 0.004), coll, m('aluminio', '#C9CCD2', rough=0.25, metallic=0.9), n=4)


def obst_ovni(coll):
    """Platillo volador cromado con su domo de vidrio, un marcianito adentro y luces alrededor."""
    c = cromo()
    clay.lathe('platillo', [(0.0, -0.08), (0.25, -0.1), (0.62, -0.03), (0.66, 0.0), (0.6, 0.04), (0.3, 0.1), (0.0, 0.11)], coll, c, segments=40)
    clay.lathe('panza', [(0.0, -0.17), (0.18, -0.14), (0.26, -0.09), (0.0, -0.09)], coll, m('panza ovni', '#5A5E66', rough=0.3, metallic=0.8), segments=28)
    clay.blob('rayo tractor', (0, 0, -0.18), (0.12, 0.12, 0.02), coll, luz('rayo ovni', '#9CFFB0', 3.0), n=6)
    for k in range(10):
        a = 2 * math.pi * k / 10
        col = ('#FF5A5A', '#FFD23F', '#5AD7FF')[k % 3]
        clay.blob(f'luz ovni {k}', (0.6 * math.cos(a), 0.6 * math.sin(a), 0.0), (0.035, 0.035, 0.03), coll, luz(f'luz ovni {col}', col, 4.0), n=5)
    # Marcianito
    verde = laca('marciano', '#7CD957', 0.35)
    clay.blob('cuerpo marciano', (0, 0, 0.16), (0.08, 0.07, 0.07), coll, verde, n=7)
    clay.blob('cabeza marciano', (0, 0, 0.29), (0.11, 0.1, 0.09), coll, verde, n=8)
    for sx in (-1, 1):
        colocar(clay.blob(f'ojo marciano {sx}', (0, 0, 0), (0.035, 0.015, 0.045), coll, m('ojo marciano', '#15151A', rough=0.1, coat=1.0), n=5), (sx * 0.045, -0.085, 0.3), (0, sx * 0.4, 0))
        clay.blob(f'brillo ojo {sx}', (sx * 0.045 - 0.012, -0.1, 0.32), (0.01, 0.004, 0.012), coll, luz('brillo', '#FFFFFF', 2.0), n=3)
        clay.sweep(f'antena marciano {sx}', [(sx * 0.04, 0, 0.37), (sx * 0.07, 0, 0.44)], 0.006, (1, 1), coll, verde, segments=5, samples=2)
        clay.blob(f'bolita antena {sx}', (sx * 0.07, 0, 0.45), (0.016, 0.016, 0.016), coll, luz('antena marciano', '#FFE27A', 3.0), n=4)
    clay.lathe('domo ovni', [(0.24, 0.1), (0.24, 0.16), (0.2, 0.32), (0.1, 0.42), (0.0, 0.44)], coll, vidrio('domo ovni', '#BFF0FF', 0.25), segments=32, cap_bottom=False)


def obst_avion(coll):
    """Avión de pasajeros de caricatura, mirando hacia -x."""
    blanco = laca('avión', '#F6F7FA', 0.25)
    azul = laca('avión azul', '#2F6FD6', 0.25)
    vent = m('ventanilla avión', '#2A3A5A', rough=0.1, coat=1.0)
    clay.sweep('fuselaje', [(-1.0, 0, 0.0), (-0.7, 0, 0.02), (0.5, 0, 0.02), (1.05, 0, 0.1)], [0.08, 0.2, 0.2, 0.06], (1, 1), coll, blanco, segments=16, samples=6,
               caps=('round', 'round'))
    clay.sweep('franja avión', [(-0.75, -0.002, -0.06), (0.6, -0.002, -0.05)], 0.035, (1, 0.25), coll, azul, segments=8, samples=2, up=(0, 0, 1))
    for k in range(9):
        clay.blob(f'ventanilla {k}', (-0.55 + k * 0.13, -0.198, 0.06), (0.025, 0.008, 0.032), coll, vent, n=4)
    clay.blob('cabina', (-0.92, -0.06, 0.07), (0.07, 0.05, 0.035), coll, vent, n=5)
    clay.blob('cabina 2', (-0.92, 0.06, 0.07), (0.07, 0.05, 0.035), coll, vent, n=5)
    # Alas (hacia el frente y hacia atrás de la pantalla) y motores
    for sy in (-1, 1):
        a = clay.blob(f'ala {sy}', (0, 0, 0), (0.22, 0.65, 0.025), coll, blanco, n=8,
                      shaper=lambda v: np.column_stack([v[:, 0] + np.abs(v[:, 1]) * 0.45, v[:, 1], v[:, 2]]))
        a.location = (0.05, sy * 0.55, -0.06)
        clay.lathe(f'motor {sy}', [(0.0, -0.13), (0.06, -0.13), (0.075, -0.05), (0.07, 0.12), (0.0, 0.12)], coll, m('motor avión', '#C9CCD2', rough=0.3, metallic=0.7),
                   segments=20)
        mo = list(coll.objects)[-1]
        mo.rotation_euler = (0, -math.pi / 2, 0)
        mo.location = (0.02, sy * 0.45, -0.15)
    cola = clay.blob('timón', (0, 0, 0), (0.18, 0.025, 0.24), coll, azul, n=8, shaper=lambda v: np.column_stack([v[:, 0] + np.maximum(v[:, 2], 0) * 0.7, v[:, 1], v[:, 2]]))
    cola.location = (0.95, 0, 0.3)
    for sy in (-1, 1):
        e = clay.blob(f'estabilizador {sy}', (0, 0, 0), (0.12, 0.22, 0.018), coll, blanco, n=6, shaper=lambda v: np.column_stack([v[:, 0] + np.abs(v[:, 1]) * 0.4, v[:, 1], v[:, 2]]))
        e.location = (0.95, sy * 0.2, 0.12)


def obst_pajaro(coll):
    """Pajarito redondo (mirando hacia -x) con las alas abiertas."""
    cuerpo = laca('pájaro', '#5AA0F0', 0.4)
    clay.blob('cuerpo pájaro', (0, 0, 0), (0.16, 0.12, 0.12), coll, cuerpo, n=8)
    clay.blob('panza pájaro', (-0.04, 0, -0.04), (0.11, 0.1, 0.08), coll, laca('panza pájaro', '#FFF2D6', 0.4), n=7)
    clay.blob('pico', (-0.17, 0, 0.01), (0.05, 0.025, 0.02), coll, laca('pico pájaro', '#F7A23A', 0.3), n=5)
    for sy in (-1, 1):
        clay.blob(f'ojo pájaro {sy}', (-0.1, sy * 0.08, 0.05), (0.022, 0.012, 0.025), coll, m('negro', '#2A2A30', rough=0.5), n=4)
        a = clay.blob(f'ala pájaro {sy}', (0, 0, 0), (0.1, 0.16, 0.02), coll, laca('ala pájaro', '#3E7FD0', 0.4), n=6)
        a.location = (0.02, sy * 0.15, 0.06)
        a.rotation_euler = (sy * 0.5, 0, 0)
    colocar(clay.blob('cola pájaro', (0, 0, 0), (0.07, 0.06, 0.015), coll, laca('ala pájaro', '#3E7FD0', 0.4), n=5), (0.17, 0, 0.04), (0, -0.4, 0))


COSAS = {
    'rollito': rollito, 'iman_nave': iman_nave, 'canon_nave': canon_nave, 'ayudante': ayudante,
    'obst_satelite': obst_satelite, 'obst_inodoro': obst_inodoro, 'obst_chancla': obst_chancla, 'obst_lata': obst_lata, 'obst_ovni': obst_ovni,
    'obst_avion': obst_avion, 'obst_pajaro': obst_pajaro,
}
COSAS.update(PODERES)


# ---------------------------------------------------------------------------
# Íconos de las mejoras (solo ícono, no van en el juego)
# ---------------------------------------------------------------------------

def icono_revivir(coll):
    """Corazón con alitas (segunda oportunidad)."""
    corazon_plano('corazón revivir', (0, 0, 0.2), 0.9, coll, laca('corazón revivir', '#F2385F', 0.25), grosor=0.45)
    for sx in (-1, 1):
        for k in range(3):
            colocar(clay.blob(f'pluma {sx}{k}', (0, 0, 0), (0.09 - k * 0.015, 0.012, 0.03), coll, tela('ala', '#FFFFFF'), n=5), (sx * (0.24 + k * 0.05), 0.02, 0.27 - k * 0.04),
                    (0, sx * (0.5 + k * 0.25), 0))


def icono_suerte(coll):
    """Trébol de cuatro hojas."""
    verde = laca('trébol', '#3FAE5A', 0.3)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        # La punta del corazón queda en el centro del trébol y los lóbulos hacia afuera
        corazon_plano(f'hoja trébol {k}', (0, 0, 0.056), 0.4, coll, verde, grosor=0.3)
        colocar(list(coll.objects)[-1], (0, 0, 0.25), (0, math.pi / 2 - a, 0))
    clay.sweep('tallo trébol', [(0, 0, 0.22), (0.03, 0, 0.1), (0.08, 0, 0.0)], 0.012, (1, 1), coll, verde, segments=6, samples=3)


def icono_triple(coll):
    """Tres rollos apilados (papel triple hoja)."""
    blanco = papel('papel', '#FBFBF6')
    for k, (x, z) in enumerate(((-0.07, 0.06), (0.07, 0.06), (0.0, 0.18))):
        rollo_papel(f'rollo triple {k}', (x, 0, z), coll, blanco, r=0.06, h=0.12, eje='y', tira=k == 2)
    for k, z in enumerate((0.235,)):
        clay.blob('moño triple', (0, -0.02, z + 0.02), (0.04, 0.02, 0.025), coll, laca('moño', '#E8396E', 0.3), n=5)


def icono_aero(coll):
    """El inodoro con alerón y líneas de viento."""
    inodoro_base(coll, porcelana(), asiento=laca('aero', '#2F6FD6', 0.3), tapa=laca('aero', '#2F6FD6', 0.3))
    clay.rbox('alerón', (0, 0.32, 0.95), (0.3, 0.06, 0.012), coll, laca('alerón', '#E4574B', 0.3), p=6, n=4)
    for sx in (-1, 1):
        clay.rbox(f'pata alerón {sx}', (sx * 0.2, 0.3, 0.9), (0.012, 0.03, 0.05), coll, laca('alerón', '#E4574B', 0.3), p=6, n=4)
    for k in range(3):
        clay.sweep(f'viento {k}', [(0.3, -0.3, 0.3 + k * 0.2), (0.45, -0.2, 0.32 + k * 0.2), (0.6, -0.1, 0.3 + k * 0.2)], 0.012, (1, 1), coll, luz('viento', '#9FD3F2', 1.5),
                   segments=5, samples=3)


def icono_burbuja_inicio(coll):
    """El retrete dentro de una burbuja de jabón."""
    inodoro_base(coll, porcelana(), asiento=laca('burbuja asiento', '#8FE3C8', 0.3), tapa=laca('burbuja asiento', '#8FE3C8', 0.3))
    clay.blob('burbuja grande', (0, 0, 0.48), (0.55, 0.55, 0.55), coll, vidrio('burbuja', '#D6F4FF', 0.22), n=12)
    clay.blob('brillo burbuja', (-0.22, -0.38, 0.72), (0.1, 0.03, 0.06), coll, luz('brillo', '#FFFFFF', 2.0), n=4)


ICONOS = {'icono_revivir': icono_revivir, 'icono_suerte': icono_suerte, 'icono_triple': icono_triple, 'icono_aero': icono_aero,
          'icono_burbuja_inicio': icono_burbuja_inicio}
