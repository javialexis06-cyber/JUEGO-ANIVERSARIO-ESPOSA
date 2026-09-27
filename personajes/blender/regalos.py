"""Nuestro Hogar: regalos que se mandan (carta, flores, chocolates, cajita) y decoración comprable
(cuadros, osito, cactus, lámpara, florero, velas).

Todo se construye en el origen, frente hacia -y. Lo de piso, mesa y peluche con la base en z=0;
los cuadros centrados en z=0 con el respaldo en y=0 (se cuelgan en la pared).

Uso: python3 regalos.py carpeta [muestras]   → render de revisión de todas las piezas.
"""
import math
import os
import sys

import bpy
import numpy as np

import clay
import escena
import utileria
from tiendas import _mat

M = clay.material


def tela(nombre, color):
    return _mat(f'Tela | {nombre}', color, rough=0.95, fuzz=dict(scale=160, color=color, amount=0.35, strength=0.3, distance=0.002))


def laca(nombre, color, rough=0.35):
    return _mat(f'Laca | {nombre}', color, rough=rough, coat=0.3, coat_rough=0.15)


def papel(nombre, color):
    return _mat(f'Papel | {nombre}', color, rough=0.8)


def madera(nombre='marco', color='#C9956A'):
    return _mat(f'Madera | {nombre}', color, rough=0.6, wave=dict(scale=3.0, strength=0.15, axis='X', distortion=4.0))


def luz(nombre, color, fuerza=4.0):
    return _mat(f'Luz | {nombre}', color, rough=0.9, emission=color, emission_strength=fuerza)


def corazon_plano(name, c, s, coll, mat, grosor=0.35, eje='y'):
    """Corazón inflado (SDF) de tamaño s, aplanado en el eje dado."""
    import sdf
    lobes = [sdf.round_cone((sx * 0.078, 0, 0.3), (0, 0, 0.1), 0.1, 0.022) for sx in (-1, 1)]

    def f(P):
        Q = (P - np.array(c)) / s
        if eje == 'z':
            Q = Q[:, [0, 2, 1]]  # acostado: lóbulos hacia el fondo (+y), punta hacia el frente
        Q = Q + np.array([0, 0, 0.24])
        Q[:, 1] /= grosor
        return sdf.smin(lobes[0](Q), lobes[1](Q), 0.05) * s * grosor
    h = 0.24 * s
    if eje == 'z':
        bmin, bmax = (c[0] - h, c[1] - 0.22 * s, c[2] - 0.1 * s * grosor * 1.2), (c[0] + h, c[1] + 0.22 * s, c[2] + 0.1 * s * grosor * 1.2)
    else:
        bmin, bmax = (c[0] - h, c[1] - 0.1 * s * grosor * 1.2, c[2] - 0.22 * s), (c[0] + h, c[1] + 0.1 * s * grosor * 1.2, c[2] + 0.22 * s)
    return sdf.to_mesh(name, f, bmin, bmax, voxel=0.004 * max(s, 0.3), coll=coll, material=mat, decimate=0.5)


def lazo(coll, c, s, mat, eje_y=True):
    """Moño de cinta: dos orejas y un nudo."""
    for sx in (-1, 1):
        clay.blob('oreja moño', (c[0] + sx * 0.05 * s, c[1], c[2] + 0.025 * s), (0.055 * s, 0.022 * s, 0.035 * s), coll, mat, n=5,
                  shaper=lambda v, sx=sx: v + np.array([0, 0, 1]) * (v[:, 0:1] * sx) * 0.25)
        clay.sweep('punta moño', [(c[0] + sx * 0.01 * s, c[1], c[2]), (c[0] + sx * 0.04 * s, c[1] - 0.004, c[2] - 0.06 * s)], 0.014 * s, (1.4, 0.4), coll,
                   mat, segments=6, samples=3, caps=('round', 'flat'))
    clay.blob('nudo moño', c, (0.022 * s, 0.024 * s, 0.022 * s), coll, mat, n=5)


# ---------------------------------------------------------------------------
# Regalos
# ---------------------------------------------------------------------------

def regalo_carta(coll):
    """Sobre rosado con solapa, sello de corazón y la puntica de la carta asomada."""
    sobre = papel('sobre rosa', '#F7C6D2')
    clay.rbox('carta asomada', (0.02, 0.0, 0.2), (0.13, 0.006, 0.08), coll, papel('carta', '#FFF8EC'), p=8, n=4, subsurf=1)
    clay.rbox('sobre', (0, -0.01, 0.13), (0.17, 0.012, 0.11), coll, sobre, p=8, n=5)
    verts = [(-0.165, -0.024, 0.235), (0.165, -0.024, 0.235), (0.0, -0.03, 0.1)]
    solapa = clay.make_mesh_object('solapa sobre', verts, [(0, 2, 1)], coll, material=papel('solapa', '#F2AEC0'))
    clay.add_solidify(solapa, 0.006)
    corazon_plano('sello corazón', (0, -0.035, 0.105), 0.2, coll, laca('sello', '#E4566B'), grosor=0.3)


def regalo_flores(coll):
    """Ramo: cono de papel kraft, cinta con moño, rosas en espiral, margaritas y hojas."""
    kraft = papel('kraft', '#E6C49A')
    clay.lathe('cono ramo', [(0.0, 0.0), (0.03, 0.02), (0.11, 0.22), (0.17, 0.36), (0.175, 0.37)], coll, kraft, segments=10, cap_top=False)
    clay.add_solidify(coll.objects[-1], 0.006)
    clay.lathe('papel interior', [(0.12, 0.26), (0.19, 0.4), (0.2, 0.41)], coll, papel('papel seda', '#FBE4EC'), segments=9, cap_bottom=False,
               cap_top=False)
    clay.add_solidify(coll.objects[-1], 0.004)
    cinta = laca('cinta ramo', '#E4566B')
    clay.lathe('cinta ramo', [(0.078, 0.14), (0.085, 0.15), (0.088, 0.17), (0.081, 0.18)], coll, cinta, segments=16)
    lazo(coll, (0, -0.085, 0.16), 1.0, cinta)
    rng = np.random.default_rng(5)
    rosas = [(0.0, 0.0, 0.46), (-0.09, 0.03, 0.42), (0.09, 0.03, 0.43), (-0.04, -0.08, 0.41), (0.05, -0.07, 0.42)]
    colores = ['#E8506A', '#F39AB0', '#E8506A', '#F7C6D2', '#F39AB0']
    for k, (x, y, z) in enumerate(rosas):
        mat = laca(f'rosa {colores[k]}', colores[k], 0.5)
        clay.blob(f'rosa {k}', (x, y, z), (0.045, 0.045, 0.035), coll, mat, n=6)
        for j in range(5):
            a = 2 * math.pi * j / 5 + k
            clay.blob(f'pétalo rosa {k}{j}', (x + 0.035 * math.cos(a), y + 0.035 * math.sin(a), z - 0.006), (0.03, 0.03, 0.022), coll, mat, n=4)
        clay.sweep(f'espiral rosa {k}', [(x + 0.02 * math.cos(t) * (1 - t / 7), y + 0.02 * math.sin(t) * (1 - t / 7), z + 0.034) for t in np.linspace(0, 6, 8)],
                   0.004, (1, 1), coll, _mat('Trazo rosa oscuro', '#B83A52', rough=0.5), segments=4, samples=3)
    for k in range(4):
        a = k * 1.6 + 0.4
        c = np.array([0.12 * math.cos(a), 0.12 * math.sin(a), 0.39 + 0.02 * k])
        for j in range(8):
            b = 2 * math.pi * j / 8
            clay.blob(f'pétalo margarita {k}{j}', tuple(c + [0.022 * math.cos(b), 0.022 * math.sin(b), 0]), (0.018, 0.008, 0.005), coll,
                      papel('pétalo blanco', '#FFFFFF'), n=3, shaper=lambda v, b=b: v @ np.array([[math.cos(b), math.sin(b), 0],
                                                                                                   [-math.sin(b), math.cos(b), 0], [0, 0, 1]]))
        clay.blob(f'centro margarita {k}', tuple(c + [0, 0, 0.005]), (0.012, 0.012, 0.008), coll, laca('centro margarita', '#F7C948'), n=4)
    for k in range(6):
        a = k * 1.05 + rng.uniform(-0.2, 0.2)
        base = np.array([0.08 * math.cos(a), 0.08 * math.sin(a), 0.34])
        tip = base + np.array([0.12 * math.cos(a), 0.12 * math.sin(a), 0.1])
        clay.sweep(f'hoja ramo {k}', [base, (base + tip) / 2 + [0, 0, 0.03], tip], [0.006, 0.03, 0.003], (0.2, 1), coll, utileria.u('hoja'),
                   segments=6, samples=4, caps=('flat', 'point'), up=(math.cos(a), math.sin(a), 0.5))


def regalo_chocolates(coll):
    """Caja de corazón con tapa corrida, bombones con adornos y un moño."""
    caja = laca('caja chocolates', '#E4566B', 0.3)
    corazon_plano('caja corazón', (0, 0, 0.04), 1.1, coll, caja, grosor=0.4, eje='z')
    corazon_plano('fondo dorado', (0, 0, 0.068), 0.95, coll, laca('papel dorado', '#F2C66B', 0.25), grosor=0.12, eje='z')
    choco = laca('chocolate', '#6B3B24', 0.3)
    choco_b = laca('chocolate blanco', '#F4E6D0', 0.35)
    pos = [(-0.09, 0.02), (0.0, 0.02), (0.09, 0.02), (-0.05, -0.07), (0.05, -0.07), (0.0, -0.14), (-0.07, 0.1), (0.07, 0.1)]
    for k, (x, y) in enumerate(pos):
        mat = choco_b if k in (1, 5) else choco
        clay.blob(f'bombón {k}', (x, y, 0.09), (0.034, 0.034, 0.024), coll, mat, n=5, p=2.4)
        clay.sweep(f'adorno bombón {k}', [(x - 0.018, y, 0.113), (x - 0.006, y + 0.006, 0.117), (x + 0.006, y - 0.006, 0.117), (x + 0.018, y, 0.113)],
                   0.004, (1, 1), coll, choco if mat is choco_b else choco_b, segments=4, samples=3)
    # Tapa abierta, recostada detrás de la caja
    tapa = corazon_plano('tapa corazón', (0.0, 0.0, 0.0), 1.1, coll, caja, grosor=0.25)
    tapa.location = (0.0, 0.24, 0.2)
    tapa.rotation_euler = (math.radians(-18), 0, 0)
    lazo(coll, (0.0, 0.2, 0.3), 1.0, laca('cinta dorada', '#F2C66B', 0.25))


def regalo_cajita(coll):
    """Cajita de regalo con papel de puntos, cinta cruzada y moño grande."""
    papel_caja = laca('papel regalo', '#8BD0E8', 0.45)
    cinta = laca('cinta regalo', '#F39AB0', 0.35)
    clay.rbox('cajita', (0, 0, 0.1), (0.13, 0.13, 0.1), coll, papel_caja, p=7, n=6)
    clay.rbox('tapa cajita', (0, 0, 0.205), (0.142, 0.142, 0.03), coll, papel_caja, p=7, n=6)
    for k in range(10):
        a = k * 2.4
        x, z = 0.1 * math.cos(a) * (0.4 + 0.06 * k), 0.1 + 0.07 * math.sin(a * 1.3)
        if abs(x) > 0.025:
            clay.blob(f'punto regalo {k}', (x, -0.131, z), (0.013, 0.004, 0.013), coll, papel('puntos regalo', '#FFFFFF'), n=3)
    clay.rbox('cinta x', (0, 0, 0.12), (0.146, 0.026, 0.118), coll, cinta, p=7, n=5)
    clay.rbox('cinta y', (0, 0, 0.12), (0.026, 0.146, 0.118), coll, cinta, p=7, n=5)
    lazo(coll, (0, 0, 0.255), 1.6, cinta)


def deco_osito(coll):
    """Osito de peluche sentado, con hocico, orejas, patitas y corazón bordado."""
    pelo = tela('osito', '#C99A6B')
    claro = tela('osito claro', '#F1D6B3')
    ojo = laca('ojo osito', '#2B2422', 0.2)
    clay.blob('panza osito', (0, 0, 0.13), (0.12, 0.1, 0.13), coll, pelo, n=8)
    clay.blob('barriga osito', (0, -0.075, 0.12), (0.075, 0.035, 0.085), coll, claro, n=6)
    clay.blob('cabeza osito', (0, -0.01, 0.31), (0.1, 0.09, 0.09), coll, pelo, n=8)
    for sx in (-1, 1):
        clay.blob('oreja osito', (sx * 0.075, 0.0, 0.39), (0.035, 0.022, 0.035), coll, pelo, n=5)
        clay.blob('oreja dentro', (sx * 0.075, -0.018, 0.39), (0.02, 0.008, 0.02), coll, claro, n=4)
        clay.blob('ojo osito', (sx * 0.035, -0.088, 0.33), (0.012, 0.008, 0.014), coll, ojo, n=4)
        clay.sweep('brazo osito', [(sx * 0.1, -0.01, 0.2), (sx * 0.13, -0.05, 0.13), (sx * 0.1, -0.08, 0.09)], 0.035, (1, 1), coll, pelo,
                   segments=8, samples=4)
        clay.sweep('pierna osito', [(sx * 0.06, -0.03, 0.05), (sx * 0.08, -0.12, 0.04)], 0.045, (1, 1), coll, pelo, segments=8, samples=3)
        clay.blob('planta pata', (sx * 0.08, -0.165, 0.045), (0.032, 0.008, 0.032), coll, claro, n=4)
    clay.blob('hocico osito', (0, -0.085, 0.29), (0.045, 0.03, 0.032), coll, claro, n=5)
    clay.blob('nariz osito', (0, -0.112, 0.302), (0.015, 0.009, 0.011), coll, ojo, n=4)
    clay.sweep('boca osito', [(-0.015, -0.113, 0.275), (0, -0.115, 0.268), (0.015, -0.113, 0.275)], 0.003, (1, 1), coll, ojo, segments=4, samples=3)
    corazon_plano('corazón osito', (0.03, -0.108, 0.16), 0.2, coll, tela('corazón bordado', '#E4566B'), grosor=0.25)


# ---------------------------------------------------------------------------
# Cuadros (centrados en z=0, respaldo en y=0)
# ---------------------------------------------------------------------------

def _marco(coll, ancho, alto, color='#C9956A', fondo='#FFF8EC'):
    m = madera(f'marco {color}', color)
    g = 0.045
    for sz in (-1, 1):
        clay.rbox('marco horizontal', (0, -0.03, sz * (alto / 2 - g / 2)), (ancho / 2, 0.03, g / 2 + 0.005), coll, m, p=6, n=4)
    for sx in (-1, 1):
        clay.rbox('marco vertical', (sx * (ancho / 2 - g / 2), -0.03, 0), (g / 2 + 0.005, 0.03, alto / 2), coll, m, p=6, n=4)
    clay.rbox('lienzo', (0, -0.012, 0), (ancho / 2 - g, 0.01, alto / 2 - g), coll, papel(f'lienzo {fondo}', fondo), p=10, n=4, subsurf=1)
    return ancho / 2 - g, alto / 2 - g


def deco_cuadro_corazon(coll):
    """Cuadro con corazón grande, corazoncitos y la inicial de cada uno."""
    hx, hz = _marco(coll, 0.62, 0.52, '#E7B7C4', '#FFF1F4')
    corazon_plano('corazón cuadro', (0, -0.03, -0.02), 0.95, coll, laca('corazón cuadro', '#E4566B', 0.4), grosor=0.18)
    rng = np.random.default_rng(3)
    for k in range(7):
        x, z = rng.uniform(-hx + 0.04, hx - 0.04), rng.uniform(-hz + 0.04, hz - 0.04)
        if abs(x) < 0.16 and abs(z) < 0.14:
            continue
        corazon_plano(f'corazoncito {k}', (x, -0.026, z), 0.14, coll, laca('corazoncito', '#F39AB0', 0.4), grosor=0.2)


def deco_cuadro_paisaje(coll):
    """Montañas de Antioquia y Santander: dos cerros con nieve suave, sol, nubes y río."""
    hx, hz = _marco(coll, 0.72, 0.52, '#B98559', '#CFEAF7')
    y = -0.026
    for k, (cx, h, col) in enumerate(((-0.12, 0.3, '#7FB77E'), (0.13, 0.24, '#5FA05E'), (-0.26, 0.16, '#9CCB8F'))):
        pts = [(max(cx - 0.2, -hx), y - 0.002 * k, -hz), (cx, y - 0.002 * k, -hz + h), (min(cx + 0.2, hx), y - 0.002 * k, -hz)]
        o = clay.make_mesh_object(f'cerro {k}', pts, [(0, 2, 1)], coll, material=papel(f'cerro {col}', col))
        clay.add_solidify(o, 0.008)
    clay.blob('sol', (0.2, y, 0.1), (0.06, 0.008, 0.06), coll, laca('sol', '#F7C948', 0.4), n=6)
    for k, (x, z) in enumerate(((-0.18, 0.13), (0.05, 0.16))):
        for j in range(3):
            clay.blob(f'nube {k}{j}', (x + j * 0.035, y - 0.004, z + (0.012 if j == 1 else 0)), (0.03, 0.006, 0.02), coll, papel('nube', '#FFFFFF'), n=4)
    clay.sweep('río', [(-0.05, y - 0.012, -hz + 0.005), (0.02, y - 0.012, -hz + 0.05), (-0.01, y - 0.012, -hz + 0.1)], 0.02, (1, 0.2), coll,
               laca('río', '#8BC4E8', 0.2), segments=6, samples=4)


def deco_cuadro_foto(coll):
    """Marco blanco con esquinas doradas para una foto del álbum (la malla «foto» recibe la imagen en el juego)."""
    hx, hz = _marco(coll, 0.56, 0.46, '#F6F2EA', '#FFFFFF')
    for sx in (-1, 1):
        for sz in (-1, 1):
            clay.blob('esquina dorada', (sx * (hx + 0.02), -0.062, sz * (hz + 0.02)), (0.02, 0.006, 0.02), coll, laca('dorado', '#E5B85C', 0.25), n=4)
    w, h = hx - 0.025, hz - 0.025
    me = bpy.data.meshes.new('foto')
    me.from_pydata([(-w, -0.024, -h), (w, -0.024, -h), (w, -0.024, h), (-w, -0.024, h)], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name='UVMap')
    for i, (a, b) in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))):
        uv.data[i].uv = (a, b)
    o = bpy.data.objects.new('foto', me)
    clay.link(o, coll)
    clay.set_material(o, papel('foto', '#F2D0B8'))
    # Dibujito de relleno: dos figuritas y un corazón (hasta que se escoja una foto)
    corazon_plano('corazón foto', (0, -0.03, 0.08), 0.22, coll, laca('corazón foto', '#E4566B', 0.4), grosor=0.2)


# ---------------------------------------------------------------------------
# Piso y mesa
# ---------------------------------------------------------------------------

def deco_cactus(coll):
    """Cactus de brazos en matera de rayas, con espinitas y una flor rosada."""
    utileria.u('matera')
    clay.lathe('matera cactus', [(0.0, 0.0), (0.13, 0.0), (0.16, 0.24), (0.175, 0.25), (0.175, 0.28), (0.15, 0.285)], coll,
               laca('matera cactus', '#F2EBDD', 0.5), segments=28, cap_top=False)
    for z in (0.07, 0.15):
        clay.lathe('raya matera', [(0.137 + z * 0.12, z), (0.142 + z * 0.12, z + 0.012), (0.137 + z * 0.12, z + 0.024)], coll,
                   laca('raya matera', '#86CDBA', 0.5), segments=28, cap_bottom=False, cap_top=False)
    clay.lathe('tierra cactus', [(0.0, 0.26), (0.155, 0.26)], coll, utileria.u('tierra'), segments=28, cap_bottom=False)
    verde = _mat('Cactus | verde', '#6DB36A', rough=0.55, ribs=dict(scale=18, strength=0.25, axis='Z'))
    clay.sweep('tronco cactus', [(0, 0, 0.24), (0, 0, 0.5), (0, 0, 0.72)], [0.085, 0.09, 0.075], (1, 1), coll, verde, segments=12, samples=5,
               caps=('flat', 'round'))
    for sx, z0, h in ((-1, 0.4, 0.2), (1, 0.48, 0.14)):
        clay.sweep('brazo cactus', [(0, 0, z0), (sx * 0.13, 0, z0 + 0.02), (sx * 0.16, 0, z0 + 0.1), (sx * 0.16, 0, z0 + h + 0.08)], 0.045, (1, 1),
                   coll, verde, segments=10, samples=5, caps=('flat', 'round'))
    rng = np.random.default_rng(8)
    espina = papel('espina', '#FFF6D8')
    for k in range(26):
        a, z = rng.uniform(0, 2 * math.pi), rng.uniform(0.3, 0.7)
        clay.blob(f'espina {k}', (0.088 * math.cos(a), 0.088 * math.sin(a), z), (0.006, 0.006, 0.006), coll, espina, n=3, subsurf=0)
    for j in range(6):
        b = 2 * math.pi * j / 6
        clay.blob(f'pétalo cactus {j}', (0.03 * math.cos(b), 0.03 * math.sin(b), 0.8), (0.028, 0.028, 0.012), coll, utileria.u('flor'), n=4)
    clay.blob('centro flor cactus', (0, 0, 0.81), (0.016, 0.016, 0.01), coll, laca('centro flor', '#F7C948'), n=4)


def deco_lampara(coll):
    """Lámpara de pie con pantalla de tela plisada y bombillo cálido."""
    import casa
    casa.lampara_pie(coll, '#F6C7D2')


def deco_florero(coll):
    """Florero de cerámica con tulipanes y ramitas."""
    clay.lathe('florero', [(0.0, 0.0), (0.07, 0.0), (0.1, 0.08), (0.095, 0.16), (0.055, 0.24), (0.06, 0.27), (0.065, 0.28)], coll,
               laca('florero', '#9ED9C0', 0.25), segments=28, cap_top=False)
    colores = ('#F39AB0', '#F7C948', '#E8506A', '#C9B6EA', '#F39AB0')
    for k, col in enumerate(colores):
        a = 2 * math.pi * k / len(colores)
        tip = np.array([0.1 * math.cos(a), 0.1 * math.sin(a), 0.48 + 0.04 * (k % 2)])
        clay.sweep(f'tallo {k}', [(0.01 * math.cos(a), 0.01 * math.sin(a), 0.2), tip * [0.6, 0.6, 0.85], tip - [0, 0, 0.03]], 0.006, (1, 1), coll,
                   utileria.u('hoja oscura'), segments=5, samples=4)
        mat = laca(f'tulipán {col}', col, 0.45)
        for j in range(3):
            b = 2 * math.pi * j / 3 + a
            clay.blob(f'pétalo tulipán {k}{j}', tuple(tip + [0.016 * math.cos(b), 0.016 * math.sin(b), 0.01]), (0.024, 0.024, 0.04), coll, mat, n=4)
        clay.sweep(f'hoja tulipán {k}', [tip * [0.3, 0.3, 0.7], tip * [0.55, 0.55, 0.72] + [0, 0, 0.04], tip * [0.75, 0.75, 0.78]],
                   [0.004, 0.02, 0.003], (0.25, 1), coll, utileria.u('hoja'), segments=5, samples=4, caps=('flat', 'point'),
                   up=(math.cos(a), math.sin(a), 0.4))


def deco_velas(coll):
    """Tres velas de distinta altura en una bandejita, con llamas que brillan."""
    clay.lathe('bandeja velas', [(0.0, 0.0), (0.2, 0.0), (0.21, 0.02), (0.19, 0.025), (0.0, 0.02)], coll, laca('bandeja', '#E5B85C', 0.25), segments=32)
    cera = _mat('Vela | cera', '#FFF4E0', rough=0.5, sss=0.4)
    for k, (x, y, h, col) in enumerate(((-0.08, 0.02, 0.2, '#FFF4E0'), (0.06, 0.05, 0.14, '#F7C6D2'), (0.02, -0.08, 0.1, '#FFF4E0'))):
        mat = cera if col == '#FFF4E0' else _mat(f'Vela | {col}', col, rough=0.5, sss=0.4)
        o = clay.lathe(f'vela {k}', [(0.0, 0.02), (0.045, 0.02), (0.045, h), (0.038, h + 0.01), (0.0, h + 0.005)], coll, mat, segments=20)
        o.location = (x, y, 0)
        clay.blob(f'gota vela {k}', (x + 0.043, y - 0.01, h - 0.02), (0.01, 0.01, 0.025), coll, mat, n=4)
        clay.sweep(f'mecha {k}', [(x, y, h + 0.005), (x, y, h + 0.025)], 0.003, (1, 1), coll, laca('mecha', '#2B2422'), segments=4, samples=2)
        clay.blob(f'llama {k}', (x, y, h + 0.045), (0.014, 0.014, 0.028), coll, luz('llama', '#FFC24A', 8.0), n=5,
                  shaper=lambda v: v * np.where(v[:, 2:3] > 0, np.array([1 - 0.5, 1 - 0.5, 1.0]), 1.0))


PIEZAS = {
    'regalo_carta': regalo_carta, 'regalo_flores': regalo_flores, 'regalo_chocolates': regalo_chocolates, 'regalo_cajita': regalo_cajita,
    'deco_osito': deco_osito, 'deco_cuadro_corazon': deco_cuadro_corazon, 'deco_cuadro_paisaje': deco_cuadro_paisaje,
    'deco_cuadro_foto': deco_cuadro_foto, 'deco_cactus': deco_cactus, 'deco_lampara': deco_lampara, 'deco_florero': deco_florero,
    'deco_velas': deco_velas,
}
# Íconos de la tienda: además de estas piezas, los que ya existen (planta y globos)
CUADROS = ('deco_cuadro_corazon', 'deco_cuadro_paisaje', 'deco_cuadro_foto')


def build(key, coll, location=(0, 0, 0), rot=0.0, scale=1.0):
    before = set(coll.objects)
    PIEZAS[key](coll)
    root = bpy.data.objects.new(key, None)
    clay.link(root, coll)
    for o in coll.objects:
        if o not in before and o is not root and o.parent is None:
            o.parent = root
    root.location = location
    root.rotation_euler = (0, 0, rot)
    root.scale = (scale, scale, scale)
    return root


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    out = args[0]
    samples = int(args[1]) if len(args) > 1 else 32
    os.makedirs(out, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 1600, 900, samples)
    coll = clay.collection('Regalos')
    x = -2.6
    for k, key in enumerate(PIEZAS):
        fila = k // 6
        col = k % 6
        z = 0.35 if key in CUADROS else 0.0
        s = 0.55 if key == 'deco_lampara' else (1.6 if key.startswith('regalo') or key in ('deco_osito', 'deco_velas') else 1.0)
        build(key, coll, (-2.2 + col * 0.9, fila * 1.1, z), 0.0, s)
    escena.world_color(scene, '#FFFFFF', 0.9)
    escena.area_light('Luz', (-3, -5, 6), (0, 0.5, 0.3), 1500, 4.0, '#FFF3E6', coll)
    escena.area_light('Relleno', (4, -3, 3), (0, 0.5, 0.3), 500, 3.0, '#EAF2FF', coll)
    piso = clay.rbox('piso', (0, 0.5, -0.05), (4, 2.5, 0.05), coll, _mat('Piso revisión', '#F2E6DA', rough=0.8), p=8, n=4)
    cam = escena.camera('Cam', (0, -5.5, 3.2), (0, 0.55, 0.3), 40)
    scene.camera = cam
    scene.render.filepath = os.path.join(out, '19-regalos-deco.png')
    bpy.ops.render.render(write_still=True)
    print('LISTO', flush=True)
