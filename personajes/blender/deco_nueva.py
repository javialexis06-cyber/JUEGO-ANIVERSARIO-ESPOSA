"""Nuestro Hogar: decoración nueva de la tienda de la casa.

Mismas reglas que regalos.py: todo en el origen con el frente hacia -y; lo de piso, mesa y peluche con la
base en z=0 y los cuadros centrados en z=0 con el respaldo en y=0 (se cuelgan en la pared).
Cada pieza se exporta a deco_<clave>.glb con su ícono.
"""
import math

import numpy as np

import clay
import utileria
from comidas import transparente
from regalos import _marco, corazon_plano, laca, luz, madera, papel, tela
from tiendas import _mat


def m(nombre, color, rough=0.5, **kw):
    return _mat(f'Deco | {nombre}', color, rough=rough, **kw)


def plano(coll, nombre, pts, y, material, grosor=0.006):
    """Polígono plano (x, z) sobre el lienzo de un cuadro, a la profundidad y."""
    verts = [(x, y, z) for x, z in pts]
    o = clay.make_mesh_object(nombre, verts, [tuple(range(len(pts)))], coll, material=material)
    clay.add_solidify(o, grosor)
    return o


def matera(coll, r=0.14, h=0.24, color='#F2EBDD', raya=None):
    clay.lathe('matera', [(0.0, 0.0), (r * 0.8, 0.0), (r, h), (r * 1.08, h + 0.01), (r * 1.08, h + 0.04), (r * 0.94, h + 0.045)], coll,
               laca(f'matera {color}', color, 0.5), segments=28, cap_top=False)
    if raya:
        clay.lathe('raya matera', [(r * 0.9 + 0.012, h * 0.45), (r * 0.9 + 0.018, h * 0.5), (r * 0.9 + 0.012, h * 0.55)], coll,
                   laca(f'raya {raya}', raya, 0.5), segments=28, cap_bottom=False, cap_top=False)
    clay.lathe('tierra', [(0.0, h - 0.01), (r * 0.97, h - 0.01)], coll, utileria.u('tierra'), segments=28, cap_bottom=False)
    return h


def hoja(coll, nombre, base, punta, ancho, material, curva=0.05):
    mid = (np.array(base) + np.array(punta)) / 2 + np.array([0, 0, curva])
    d = np.array(punta) - np.array(base)
    lado = np.cross(d, [0, 0, 1])
    if np.linalg.norm(lado) < 1e-6:
        lado = np.array([1.0, 0, 0])
    return clay.sweep(nombre, [base, mid, punta], [ancho * 0.2, ancho, ancho * 0.1], (1.0, 0.15), coll, material, segments=8, samples=5,
                      caps=('flat', 'point'), up=tuple(np.cross(lado, d) / (np.linalg.norm(np.cross(lado, d)) + 1e-9)))


def letras(coll, texto, x0, y, z, alto, material, radio=0.012):
    """Letras en mayúscula hechas con trazos (T, E, A, M, O, Y, U)."""
    w = alto * 0.6
    trazos = {
        'T': [[(0, 1), (1, 1)], [(0.5, 1), (0.5, 0)]],
        'E': [[(1, 1), (0, 1), (0, 0), (1, 0)], [(0, 0.5), (0.75, 0.5)]],
        'A': [[(0, 0), (0.5, 1), (1, 0)], [(0.22, 0.42), (0.78, 0.42)]],
        'M': [[(0, 0), (0, 1), (0.5, 0.45), (1, 1), (1, 0)]],
        'O': [[(0.5 + 0.5 * math.cos(a), 0.5 + 0.5 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 13)]],
        'U': [[(0, 1), (0, 0.3), (0.5, 0), (1, 0.3), (1, 1)]],
        'Y': [[(0, 1), (0.5, 0.5), (1, 1)], [(0.5, 0.5), (0.5, 0)]],
    }
    x = x0
    for k, ch in enumerate(texto):
        if ch == ' ':
            x += w * 0.7
            continue
        for j, t in enumerate(trazos[ch]):
            pts = [(x + px * w, y, z + (py - 0.5) * alto) for px, py in t]
            clay.sweep(f'letra {k} {j}', pts, radio, (1, 1), coll, material, segments=6, samples=2 if len(pts) < 6 else 4,
                       closed=ch == 'O', caps=('round', 'round'))
        x += w * 1.35
    return x


# ---------------------------------------------------------------------------
# Cuadros y pared
# ---------------------------------------------------------------------------

def deco_cuadro_atardecer(coll):
    hx, hz = _marco(coll, 0.72, 0.52, '#B98559', '#F7B267')
    y = -0.026
    plano(coll, 'cielo alto', [(-hx, 0.05), (hx, 0.05), (hx, hz), (-hx, hz)], y, papel('cielo naranja', '#F79D65'))
    clay.blob('sol', (0.0, y - 0.004, -0.02), (0.11, 0.006, 0.11), coll, laca('sol atardecer', '#FFD166', 0.4), n=6,
              shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], 0.0)]))
    plano(coll, 'mar', [(-hx, -hz), (hx, -hz), (hx, -0.02), (-hx, -0.02)], y - 0.008, papel('mar', '#3D7EA6'))
    for k, z in enumerate((-0.06, -0.1, -0.14)):
        clay.sweep(f'reflejo {k}', [(-0.08 + k * 0.02, y - 0.014, z), (0.08 - k * 0.02, y - 0.014, z)], 0.008, (1, 0.4), coll, laca('reflejo', '#FFD166', 0.3),
                   segments=4, samples=2)
    for k, x in enumerate((-0.22, 0.2)):
        clay.sweep(f'gaviota {k}', [(x - 0.03, y - 0.01, 0.15), (x, y - 0.01, 0.13), (x + 0.03, y - 0.01, 0.15)], 0.005, (1, 1), coll,
                   papel('gaviota', '#3A2A2A'), segments=4, samples=3)


def deco_cuadro_flores(coll):
    hx, hz = _marco(coll, 0.56, 0.66, '#F2EBDD', '#FDF6EE')
    y = -0.026
    clay.blob('jarrón pintado', (0, y - 0.004, -0.16), (0.09, 0.006, 0.12), coll, laca('jarrón pintado', '#86CDBA', 0.5), n=6)
    colores = ('#E8506A', '#F7C948', '#F39AB0', '#C9B6EA', '#F28C45')
    for k, (x, z) in enumerate(((-0.12, 0.08), (0.0, 0.16), (0.12, 0.08), (-0.06, 0.2), (0.07, 0.22))):
        clay.sweep(f'tallo pintado {k}', [(0, y - 0.006, -0.06), (x * 0.6, y - 0.006, z * 0.5), (x, y - 0.006, z)], 0.006, (1, 0.4), coll,
                   papel('tallo', '#5FA85A'), segments=4, samples=3)
        for j in range(5):
            a = 2 * math.pi * j / 5
            clay.blob(f'pétalo pintado {k}{j}', (x + 0.03 * math.cos(a), y - 0.01, z + 0.03 * math.sin(a)), (0.025, 0.004, 0.025), coll,
                      laca(f'flor {colores[k]}', colores[k], 0.5), n=4)
        clay.blob(f'centro pintado {k}', (x, y - 0.013, z), (0.016, 0.004, 0.016), coll, laca('centro', '#F7C948', 0.5), n=4)


def deco_cuadro_pareja(coll):
    """Dos muñequitos de la mano con un corazón encima (Él y Ella)."""
    hx, hz = _marco(coll, 0.62, 0.52, '#E7B7C4', '#FFF1F4')
    y = -0.026
    for sx, pelo_largo in ((-1, False), (1, True)):
        x = sx * 0.09
        clay.blob(f'cabeza muñeco {sx}', (x, y - 0.01, 0.02), (0.06, 0.008, 0.055), coll, laca('piel dibujo', '#F3B28A', 0.5), n=6)
        clay.blob(f'pelo muñeco {sx}', (x, y - 0.014, 0.055), (0.062, 0.006, 0.03), coll, laca('pelo dibujo', '#1E1D1D', 0.5), n=6)
        if pelo_largo:
            clay.blob('pelo largo muñeca', (x, y - 0.006, 0.0), (0.07, 0.004, 0.07), coll, laca('pelo dibujo', '#1E1D1D', 0.5), n=6)
        cuerpo = '#141313' if sx < 0 else '#9C8676'
        clay.blob(f'cuerpo muñeco {sx}', (x, y - 0.01, -0.1), (0.05, 0.008, 0.07), coll, laca(f'cuerpo {cuerpo}', cuerpo, 0.5), n=6)
    clay.sweep('manos', [(-0.05, y - 0.014, -0.1), (0.05, y - 0.014, -0.1)], 0.012, (1, 0.5), coll, laca('piel dibujo', '#F3B28A', 0.5), segments=6, samples=2)
    corazon_plano('corazón pareja', (0, y - 0.004, 0.15), 0.35, coll, laca('corazón', '#E4566B', 0.4), grosor=0.18)


def deco_cuadro_mapa(coll):
    """Mapa de Colombia simplificado con Medellín y Bucaramanga unidos por un camino de corazones."""
    hx, hz = _marco(coll, 0.6, 0.7, '#C9956A', '#DDEFF7')
    y = -0.026
    tierra = [(-0.1, 0.27), (0.08, 0.26), (0.16, 0.12), (0.2, 0.0), (0.16, -0.12), (0.1, -0.24), (0.0, -0.27), (-0.12, -0.2), (-0.18, -0.05),
              (-0.2, 0.1), (-0.16, 0.22)]
    plano(coll, 'colombia', tierra, y, papel('tierra mapa', '#A7D08C'))
    med, buc = (-0.08, 0.02), (0.07, 0.1)
    for k, (x, z) in enumerate((med, buc)):
        clay.blob(f'ciudad {k}', (x, y - 0.012, z), (0.022, 0.008, 0.022), coll, laca('ciudad', '#E4566B', 0.4), n=5)
    for k, t in enumerate(np.linspace(0.15, 0.85, 5)):
        x = med[0] + (buc[0] - med[0]) * t
        z = med[1] + (buc[1] - med[1]) * t + 0.05 * math.sin(t * math.pi)
        corazon_plano(f'camino {k}', (x, y - 0.012, z), 0.06, coll, laca('camino', '#E4566B', 0.4), grosor=0.2)
    corazon_plano('corazón mapa', (0.0, y - 0.01, 0.2), 0.22, coll, laca('corazón', '#E4566B', 0.4), grosor=0.2)


def deco_cuadro_noche(coll):
    hx, hz = _marco(coll, 0.62, 0.52, '#3A3354', '#26305A')
    y = -0.026
    clay.blob('luna', (0.14, y - 0.005, 0.09), (0.08, 0.006, 0.08), coll, luz('luna', '#FFF2C4', 0.8), n=6)
    clay.blob('sombra luna', (0.17, y - 0.009, 0.11), (0.07, 0.006, 0.07), coll, papel('cielo noche', '#26305A'), n=6)
    rng = np.random.default_rng(5)
    for k in range(9):
        x, z = rng.uniform(-hx + 0.04, hx - 0.04), rng.uniform(-hz + 0.04, hz - 0.04)
        if abs(x - 0.14) < 0.1 and abs(z - 0.09) < 0.1:
            continue
        r = rng.uniform(0.012, 0.025)
        clay.blob(f'estrella {k}', (x, y - 0.006, z), (r, 0.004, r), coll, luz('estrellita', '#FFE58A', 0.6), n=4)
    for k, x in enumerate(np.linspace(-hx, hx, 7)):
        clay.blob(f'cerro noche {k}', (x, y - 0.004, -hz + 0.02), (0.08, 0.004, 0.06), coll, papel('cerro noche', '#1B2340'), n=5)


def deco_cuadro_gato(coll):
    hx, hz = _marco(coll, 0.5, 0.56, '#F6F2EA', '#F9E3C8')
    y = -0.026
    g = papel('gato dibujo', '#F28C45')
    clay.blob('cara gato', (0, y - 0.008, -0.02), (0.14, 0.008, 0.12), coll, g, n=6)
    for sx in (-1, 1):
        o = clay.blob(f'oreja gato {sx}', (sx * 0.1, y - 0.006, 0.1), (0.05, 0.006, 0.06), coll, g, n=5,
                      shaper=lambda v: v * np.column_stack([1 - 0.7 * np.clip(v[:, 2] / 0.06, 0, 1), np.ones(len(v)), np.ones(len(v))]))
        del o
        clay.blob(f'ojo gato {sx}', (sx * 0.05, y - 0.014, 0.0), (0.02, 0.004, 0.025), coll, laca('ojo gato', '#2B2422', 0.3), n=4)
        for j, dz in enumerate((-0.03, -0.05)):
            clay.sweep(f'bigote gato {sx} {j}', [(sx * 0.07, y - 0.014, dz), (sx * 0.18, y - 0.014, dz + 0.01 * (j - 0.5))], 0.003, (1, 1), coll,
                       papel('bigote', '#2B2422'), segments=3, samples=2)
    clay.blob('nariz gato', (0, y - 0.015, -0.035), (0.015, 0.004, 0.012), coll, laca('nariz gato', '#F39AB0', 0.4), n=4)


def deco_reloj(coll):
    clay.lathe('aro reloj', [(0.18, 0.0), (0.2, 0.0), (0.2, 0.05), (0.18, 0.05)], coll, laca('aro reloj', '#F39AB0', 0.3), segments=40, cap_bottom=False,
               cap_top=False).rotation_euler = (math.radians(90), 0, 0)
    o = clay.lathe('cara reloj', [(0.0, 0.0), (0.185, 0.0), (0.185, 0.01), (0.0, 0.01)], coll, papel('cara reloj', '#FFFDF6'), segments=40)
    o.rotation_euler = (math.radians(90), 0, 0)
    o.location = (0, -0.01, 0)
    for k in range(12):
        a = 2 * math.pi * k / 12
        r = 0.018 if k % 3 == 0 else 0.009
        clay.blob(f'marca {k}', (math.cos(a) * 0.15, -0.025, math.sin(a) * 0.15), (r, 0.005, r), coll, laca('marca reloj', '#3D2B27', 0.4), n=4)
    clay.sweep('horario', [(0, -0.03, 0), (0.06, -0.03, 0.05)], 0.01, (1, 0.6), coll, laca('manecilla', '#3D2B27', 0.4), segments=6, samples=2)
    clay.sweep('minutero', [(0, -0.032, 0), (-0.02, -0.032, 0.12)], 0.007, (1, 0.6), coll, laca('manecilla', '#3D2B27', 0.4), segments=6, samples=2)
    clay.blob('centro reloj', (0, -0.035, 0), (0.014, 0.008, 0.014), coll, laca('centro reloj', '#E4566B', 0.3), n=4)


def deco_espejo(coll):
    marco = laca('marco espejo', '#E5B85C', 0.25)
    ring = [(math.cos(a) * 0.22, -0.03, math.sin(a) * 0.27) for a in np.linspace(0, 2 * math.pi, 28, endpoint=False)]
    clay.sweep('marco espejo', ring, 0.035, (1, 1), coll, marco, segments=10, samples=3, closed=True)
    clay.blob('espejo', (0, -0.02, 0), (0.2, 0.01, 0.25), coll, _mat('Deco | espejo', '#D9E7EF', rough=0.02, metallic=1.0), n=8)
    for k, a in enumerate(np.linspace(0, 2 * math.pi, 10, endpoint=False)):
        clay.blob(f'florcita espejo {k}', (math.cos(a) * 0.22, -0.06, math.sin(a) * 0.27), (0.02, 0.01, 0.02), coll, laca('florcita', '#F39AB0', 0.4), n=4)


def deco_guirnalda(coll):
    pts = [(x, -0.05, 0.1 - 0.12 * (1 - (x / 0.4) ** 2)) for x in np.linspace(-0.4, 0.4, 9)]
    clay.sweep('cable guirnalda', pts, 0.006, (1, 1), coll, laca('cable', '#3D2B27', 0.5), segments=4, samples=4)
    colores = ('#FFD166', '#F39AB0', '#8FD6B9', '#8EC5F0', '#FFD166', '#F28C45', '#C9B6EA', '#FFD166')
    for k, x in enumerate(np.linspace(-0.35, 0.35, 8)):
        z = 0.1 - 0.12 * (1 - (x / 0.4) ** 2) - 0.035
        clay.blob(f'bombillo {k}', (x, -0.05, z), (0.022, 0.022, 0.032), coll, luz(f'bombillo {colores[k]}', colores[k], 3.0), n=5)
    for sx in (-1, 1):
        clay.blob(f'chinche {sx}', (sx * 0.4, -0.02, 0.1), (0.018, 0.012, 0.018), coll, laca('chinche', '#E4566B', 0.3), n=4)


def deco_banderin(coll):
    pts = [(x, -0.04, 0.12 - 0.08 * (1 - (x / 0.4) ** 2)) for x in np.linspace(-0.4, 0.4, 9)]
    clay.sweep('cuerda banderín', pts, 0.005, (1, 1), coll, papel('cuerda', '#E6C49A'), segments=4, samples=4)
    colores = ('#E4566B', '#F7C948', '#8FD6B9', '#8EC5F0', '#F39AB0', '#C9B6EA', '#E4566B')
    for k, x in enumerate(np.linspace(-0.33, 0.33, 7)):
        z = 0.12 - 0.08 * (1 - (x / 0.4) ** 2)
        plano(coll, f'bandera {k}', [(x - 0.045, z), (x + 0.045, z), (x, z - 0.1)], -0.04, papel(f'bandera {colores[k]}', colores[k]), 0.004)
        corazon_plano(f'corazoncito bandera {k}', (x, -0.048, z - 0.035), 0.06, coll, papel('corazón bandera', '#FFFFFF'), grosor=0.2)


def deco_corona_flores(coll):
    ring = [(math.cos(a) * 0.2, -0.04, math.sin(a) * 0.2) for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)]
    clay.sweep('aro corona', ring, 0.03, (1, 1), coll, utileria.u('hoja oscura'), segments=8, samples=3, closed=True)
    rng = np.random.default_rng(3)
    for k, a in enumerate(np.linspace(0, 2 * math.pi, 16, endpoint=False)):
        c = np.array([math.cos(a) * 0.2, -0.06, math.sin(a) * 0.2])
        if k % 2:
            o = clay.blob(f'hoja corona {k}', (0, 0, 0), (0.05, 0.012, 0.025), coll, utileria.u('hoja'), n=4)
            o.rotation_euler = (0, -a + math.pi / 2, 0)
            o.location = tuple(c + rng.uniform(-0.02, 0.02, 3) * [1, 0, 1])
        else:
            col = ('#F39AB0', '#FFFFFF', '#F7C948', '#E8506A')[k // 2 % 4]
            for j in range(5):
                b = 2 * math.pi * j / 5
                clay.blob(f'pétalo corona {k}{j}', tuple(c + [0.022 * math.cos(b), -0.006, 0.022 * math.sin(b)]), (0.02, 0.008, 0.02), coll,
                          laca(f'flor {col}', col, 0.45), n=4)
    for sx in (-1, 1):
        clay.blob(f'moño corona {sx}', (sx * 0.05, -0.08, -0.2), (0.05, 0.015, 0.03), coll, laca('moño corona', '#E4566B', 0.35), n=5)


def deco_letrero_amor(coll):
    clay.rbox('tabla letrero', (0, -0.02, 0), (0.34, 0.02, 0.12), coll, madera('letrero', '#D9B07C'), p=6, n=4)
    x = letras(coll, 'TE AMO', -0.27, -0.048, 0.0, 0.12, laca('letras', '#E4566B', 0.35), radio=0.014)
    corazon_plano('corazón letrero', (x + 0.03, -0.05, 0.0), 0.12, coll, laca('corazón', '#E4566B', 0.35), grosor=0.2)
    clay.sweep('cordel letrero', [(-0.28, -0.02, 0.12), (0.0, -0.02, 0.24), (0.28, -0.02, 0.12)], 0.006, (1, 1), coll, papel('cordel', '#E6C49A'),
               segments=4, samples=4)


# ---------------------------------------------------------------------------
# Piso
# ---------------------------------------------------------------------------

def deco_monstera(coll):
    h = matera(coll, 0.17, 0.3, '#F2EBDD', '#86CDBA')
    verde = _mat('Deco | monstera', '#3E8E4E', rough=0.5, sss=0.2)
    for k, (a, alto, largo) in enumerate(((0.2, 0.55, 0.32), (1.6, 0.68, 0.36), (2.9, 0.5, 0.3), (4.3, 0.75, 0.34), (5.4, 0.6, 0.3), (0.9, 0.85, 0.3))):
        base = np.array([0, 0, h])
        tallo_fin = np.array([math.cos(a) * 0.15, math.sin(a) * 0.15, h + alto])
        clay.sweep(f'tallo monstera {k}', [base, (base + tallo_fin) / 2 + [0, 0, 0.05], tallo_fin], 0.012, (1, 1), coll, verde, segments=6, samples=4)
        punta = tallo_fin + np.array([math.cos(a) * largo, math.sin(a) * largo, -0.06])
        hoja(coll, f'hoja monstera {k}', tallo_fin, punta, 0.16, verde, curva=0.06)


def deco_girasoles(coll):
    h = matera(coll, 0.15, 0.26, '#D9825A')
    tallo = utileria.u('hoja oscura')
    for k, (dx, alto) in enumerate(((-0.08, 0.7), (0.05, 0.85), (0.12, 0.6))):
        base = np.array([dx * 0.5, 0, h])
        cab = np.array([dx, -0.04, h + alto])
        clay.sweep(f'tallo girasol {k}', [base, base + [0, 0, alto * 0.5], cab], 0.013, (1, 1), coll, tallo, segments=6, samples=4)
        for j in range(12):
            b = 2 * math.pi * j / 12
            o = clay.blob(f'pétalo girasol {k}{j}', (0, 0, 0), (0.045, 0.01, 0.022), coll, laca('pétalo girasol', '#F7C948', 0.5), n=4)
            o.rotation_euler = (0, -b, 0)
            o.location = tuple(cab + [0.07 * math.cos(b), -0.01, 0.07 * math.sin(b)])
        clay.blob(f'centro girasol {k}', tuple(cab + [0, -0.02, 0]), (0.05, 0.02, 0.05), coll, _mat('Deco | semillas', '#5A3A22', rough=0.8,
                                                                                                      noise=dict(scale=90, strength=0.5)), n=6)
        hoja(coll, f'hoja girasol {k}', base + [0, 0, alto * 0.45], base + [0.14 * (1 if k % 2 else -1), -0.02, alto * 0.5], 0.05, utileria.u('hoja'))


def deco_arbol_navidad(coll):
    clay.lathe('tronco', [(0.0, 0.0), (0.05, 0.0), (0.05, 0.16), (0.0, 0.16)], coll, madera('tronco', '#8A5A3C'), segments=12)
    verde = _mat('Deco | pino', '#2F7D4A', rough=0.7, noise=dict(scale=40, strength=0.3))
    for k, (z, r) in enumerate(((0.15, 0.36), (0.38, 0.29), (0.58, 0.21), (0.76, 0.13))):
        clay.lathe(f'capa pino {k}', [(0.0, z), (r, z), (r * 0.25, z + 0.3), (0.0, z + 0.3)], coll, verde, segments=12)
    colores = ('#E4566B', '#F7C948', '#8EC5F0', '#F39AB0')
    rng = np.random.default_rng(1)
    for k in range(14):
        z = rng.uniform(0.2, 0.85)
        r = 0.36 - (z - 0.15) * 0.34 - 0.02
        a = rng.uniform(0, 2 * math.pi)
        clay.blob(f'bola {k}', (math.cos(a) * r, math.sin(a) * r, z), (0.028, 0.028, 0.028), coll, laca(f'bola {colores[k % 4]}', colores[k % 4], 0.2), n=4)
    verts = [(0, 0, 0)]
    for j in range(10):
        a = math.pi / 2 + j * math.pi / 5
        rr = 0.09 if j % 2 == 0 else 0.04
        verts.append((math.cos(a) * rr, 0, math.sin(a) * rr))
    o = clay.make_mesh_object('estrella árbol', verts, [(0, 1 + j, 1 + (j + 1) % 10) for j in range(10)], coll, material=luz('estrella', '#FFD166', 2.0))
    clay.add_solidify(o, 0.03, offset=0.0)
    o.location = (0, 0, 1.12)


def deco_guitarra(coll):
    madera_g = madera('guitarra', '#D08C4A')
    clay.blob('caja baja', (0, 0.0, 0.32), (0.2, 0.07, 0.19), coll, madera_g, n=8)
    clay.blob('caja alta', (0, 0.0, 0.55), (0.15, 0.068, 0.14), coll, madera_g, n=8)
    clay.blob('boca', (0, -0.07, 0.47), (0.05, 0.005, 0.05), coll, laca('boca guitarra', '#2B1B12', 0.5), n=5)
    clay.rbox('puente', (0, -0.07, 0.3), (0.06, 0.008, 0.012), coll, laca('puente', '#3A2418', 0.4), p=6, n=3)
    clay.rbox('mástil', (0, -0.02, 0.9), (0.03, 0.02, 0.24), coll, madera('mástil', '#6B4632'), p=6, n=3)
    clay.rbox('clavijero', (0, -0.02, 1.18), (0.045, 0.02, 0.06), coll, madera('mástil', '#6B4632'), p=6, n=3)
    for k, x in enumerate(np.linspace(-0.018, 0.018, 4)):
        clay.sweep(f'cuerda {k}', [(x, -0.045, 0.3), (x, -0.045, 1.14)], 0.002, (1, 1), coll, _mat('Deco | cuerda', '#E8E4DC', rough=0.3, metallic=1.0),
                   segments=3, samples=2)
    clay.sweep('soporte', [(-0.15, 0.12, 0.0), (0, 0.08, 0.25), (0.15, 0.12, 0.0)], 0.015, (1, 1), coll, laca('soporte', '#2B2422', 0.4), segments=6, samples=3)


def deco_puf(coll):
    clay.blob('puf', (0, 0, 0.18), (0.3, 0.3, 0.18), coll, tela('puf', '#F39AB0'), n=10, p=2.6)
    for k in range(6):
        a = 2 * math.pi * k / 6
        clay.blob(f'botón puf {k}', (math.cos(a) * 0.16, math.sin(a) * 0.16, 0.34), (0.02, 0.02, 0.012), coll, tela('botón puf', '#E4566B'), n=4)
    clay.blob('botón centro', (0, 0, 0.36), (0.022, 0.022, 0.012), coll, tela('botón puf', '#E4566B'), n=4)


def deco_estanteria(coll):
    mad = madera('estante', '#C9956A')
    for sx in (-1, 1):
        clay.rbox(f'lado estante {sx}', (sx * 0.28, 0, 0.45), (0.02, 0.14, 0.45), coll, mad, p=6, n=3)
    for k, z in enumerate((0.02, 0.32, 0.62, 0.9)):
        clay.rbox(f'tabla estante {k}', (0, 0, z), (0.3, 0.14, 0.02), coll, mad, p=6, n=3)
    colores = ('#E4566B', '#8EC5F0', '#F7C948', '#8FD6B9', '#C9B6EA', '#F28C45', '#3B6FB6')
    rng = np.random.default_rng(4)
    for fila, z in enumerate((0.04, 0.34)):
        x = -0.25
        while x < 0.22:
            w = rng.uniform(0.03, 0.05)
            h = rng.uniform(0.16, 0.24)
            col = colores[int(rng.integers(0, len(colores)))]
            clay.rbox(f'libro {fila} {x:.2f}', (x + w / 2, 0.0, z + h / 2), (w / 2, 0.1, h / 2), coll, laca(f'libro {col}', col, 0.5), p=8, n=3)
            x += w + 0.004
    clay.blob('planta estante', (0.1, 0, 0.76), (0.1, 0.1, 0.1), coll, utileria.u('hoja'), n=6)
    clay.lathe('matera estante', [(0.0, 0.64), (0.06, 0.64), (0.07, 0.72), (0.0, 0.72)], coll, laca('matera estante', '#F2EBDD', 0.5), segments=16).location = (0.1, 0, 0)
    corazon_plano('corazón estante', (-0.12, 0.0, 0.76), 0.3, coll, laca('corazón', '#E4566B', 0.35), grosor=0.4)


def peluche(coll, nombre, color, claro, orejas='oso', escala=1.0, extras=None, ojo='#2B2422'):
    """Peluche sentado genérico (como el osito de regalos.py) con orejas de oso, conejo, gato, perro o ninguna."""
    s = escala
    pelo, cla, oj = tela(nombre, color), tela(f'{nombre} claro', claro), laca(f'ojo {nombre}', ojo, 0.2)
    clay.blob(f'panza {nombre}', (0, 0, 0.13 * s), (0.12 * s, 0.1 * s, 0.13 * s), coll, pelo, n=8)
    clay.blob(f'barriga {nombre}', (0, -0.075 * s, 0.12 * s), (0.075 * s, 0.035 * s, 0.085 * s), coll, cla, n=6)
    clay.blob(f'cabeza {nombre}', (0, -0.01 * s, 0.31 * s), (0.105 * s, 0.09 * s, 0.09 * s), coll, pelo, n=8)
    for sx in (-1, 1):
        if orejas == 'oso':
            clay.blob('oreja', (sx * 0.075 * s, 0.0, 0.39 * s), (0.035 * s, 0.022 * s, 0.035 * s), coll, pelo, n=5)
            clay.blob('oreja dentro', (sx * 0.075 * s, -0.018 * s, 0.39 * s), (0.02 * s, 0.008 * s, 0.02 * s), coll, cla, n=4)
        elif orejas == 'conejo':
            clay.sweep('oreja conejo', [(sx * 0.04 * s, 0, 0.37 * s), (sx * 0.06 * s, 0.01, 0.5 * s), (sx * 0.07 * s, 0.02, 0.6 * s)], [0.028 * s, 0.035 * s, 0.02 * s],
                       (1, 0.5), coll, pelo, segments=8, samples=4, up=(0, -1, 0))
        elif orejas == 'gato':
            clay.blob('oreja gato', (sx * 0.07 * s, 0.0, 0.39 * s), (0.04 * s, 0.018 * s, 0.045 * s), coll, pelo, n=5,
                      shaper=lambda v: v * np.column_stack([1 - 0.75 * np.clip(v[:, 2] / (0.045 * s), 0, 1), np.ones(len(v)), np.ones(len(v))]))
        elif orejas == 'perro':
            clay.blob('oreja perro', (sx * 0.1 * s, 0.0, 0.3 * s), (0.03 * s, 0.03 * s, 0.07 * s), coll, cla, n=5)
        clay.blob('ojo', (sx * 0.035 * s, -0.088 * s, 0.33 * s), (0.012 * s, 0.008 * s, 0.014 * s), coll, oj, n=4)
        clay.sweep('brazo', [(sx * 0.1 * s, -0.01 * s, 0.2 * s), (sx * 0.13 * s, -0.05 * s, 0.13 * s), (sx * 0.1 * s, -0.08 * s, 0.09 * s)], 0.035 * s, (1, 1),
                   coll, pelo, segments=8, samples=4)
        clay.sweep('pierna', [(sx * 0.06 * s, -0.03 * s, 0.05 * s), (sx * 0.08 * s, -0.12 * s, 0.04 * s)], 0.045 * s, (1, 1), coll, pelo, segments=8, samples=3)
        clay.blob('planta pata', (sx * 0.08 * s, -0.165 * s, 0.045 * s), (0.032 * s, 0.008 * s, 0.032 * s), coll, cla, n=4)
    clay.blob('hocico', (0, -0.085 * s, 0.29 * s), (0.045 * s, 0.03 * s, 0.032 * s), coll, cla, n=5)
    clay.blob('nariz', (0, -0.112 * s, 0.302 * s), (0.015 * s, 0.009 * s, 0.011 * s), coll, oj, n=4)
    if extras:
        extras(coll, s, pelo, cla, oj)


def deco_perro_grande(coll):
    peluche(coll, 'perro grande', '#E9D7B8', '#FFFFFF', 'perro', escala=2.4,
            extras=lambda c, s, p, cl, o: clay.blob('mancha', (0.05 * s, -0.05 * s, 0.33 * s), (0.04 * s, 0.04 * s, 0.035 * s), c, tela('mancha', '#8A5A3C'), n=5))


def deco_lampara_bola(coll):
    clay.lathe('base lámpara', [(0.0, 0.0), (0.15, 0.0), (0.15, 0.03), (0.0, 0.04)], coll, laca('base lámpara', '#E5B85C', 0.3), segments=24)
    clay.sweep('tubo lámpara', [(0, 0, 0.03), (0, 0, 0.8), (0.12, 0, 1.05), (0.25, 0, 1.08)], 0.015, (1, 1), coll, laca('tubo', '#E5B85C', 0.3),
               segments=6, samples=5, up=(0, -1, 0))
    clay.blob('bola lámpara', (0.28, 0, 0.98), (0.14, 0.14, 0.14), coll, luz('globo luz', '#FFF1C9', 2.0), n=8)


def deco_cojin_corazon(coll):
    o = corazon_plano('cojín corazón', (0, 0, 0), 1.3, coll, tela('cojín corazón', '#E4566B'), grosor=0.35)
    o.location = (0, 0, 0.3)


def deco_palma(coll):
    h = matera(coll, 0.14, 0.26, '#86CDBA')
    tronco = madera('palma', '#B98559')
    clay.sweep('tronco palma', [(0, 0, h), (0.02, 0, h + 0.3), (0, 0, h + 0.6)], [0.05, 0.04, 0.035], (1, 1), coll, tronco, segments=8, samples=4)
    for k in range(7):
        a = 2 * math.pi * k / 7
        base = np.array([0, 0, h + 0.6])
        hoja(coll, f'penca {k}', base, base + np.array([math.cos(a) * 0.4, math.sin(a) * 0.4, -0.1]), 0.07, utileria.u('hoja'), curva=0.12)


# ---------------------------------------------------------------------------
# Mesa
# ---------------------------------------------------------------------------

def deco_lampara_mesa(coll):
    clay.lathe('base lámpara mesa', [(0.0, 0.0), (0.09, 0.0), (0.1, 0.02), (0.05, 0.1), (0.03, 0.2), (0.0, 0.2)], coll, laca('base', '#86CDBA', 0.3), segments=24)
    clay.lathe('pantalla', [(0.07, 0.2), (0.14, 0.2), (0.09, 0.38), (0.07, 0.38)], coll, tela('pantalla', '#FFF1E4'), segments=24, cap_bottom=False,
               cap_top=False)
    clay.blob('bombillo mesa', (0, 0, 0.26), (0.04, 0.04, 0.05), coll, luz('bombillo', '#FFE7A8', 3.0), n=5)


def deco_pecera(coll):
    vidrio = transparente('vidrio pecera', '#DDF2FB', 0.28)
    clay.lathe('pecera', [(0.0, 0.0), (0.1, 0.0), (0.17, 0.12), (0.15, 0.25), (0.1, 0.28), (0.11, 0.29), (0.1, 0.3)], coll, vidrio, segments=32, cap_top=False)
    clay.lathe('agua', [(0.0, 0.02), (0.1, 0.02), (0.165, 0.12), (0.14, 0.22), (0.0, 0.22)], coll, transparente('agua', '#8FD3F2', 0.45), segments=32)
    rng = np.random.default_rng(2)
    for k in range(10):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0, 0.09)
        col = ('#F2EBDD', '#F39AB0', '#8FD6B9')[k % 3]
        clay.blob(f'piedrita {k}', (math.cos(a) * r, math.sin(a) * r, 0.035), (0.02, 0.018, 0.012), coll, laca(f'piedra {col}', col, 0.5), n=4)
    pez = laca('pez', '#F28C45', 0.3)
    clay.blob('pez', (0.02, -0.02, 0.13), (0.05, 0.025, 0.035), coll, pez, n=6)
    clay.blob('cola pez', (0.08, -0.02, 0.13), (0.02, 0.01, 0.035), coll, pez, n=4)
    clay.sweep('alga', [(-0.06, 0.03, 0.03), (-0.04, 0.03, 0.1), (-0.07, 0.03, 0.17)], 0.012, (1, 0.4), coll, utileria.u('hoja'), segments=4, samples=4)


def deco_tocadiscos(coll):
    clay.rbox('caja tocadiscos', (0, 0, 0.05), (0.2, 0.17, 0.05), coll, madera('tocadiscos', '#B98559'), p=6, n=4)
    clay.lathe('disco', [(0.0, 0.1), (0.14, 0.1), (0.14, 0.11), (0.0, 0.11)], coll, laca('disco', '#1E1D1D', 0.2), segments=36).location = (-0.03, 0, 0)
    clay.lathe('etiqueta disco', [(0.0, 0.111), (0.045, 0.111), (0.045, 0.114), (0.0, 0.114)], coll, papel('etiqueta', '#E4566B'), segments=24).location = (
        -0.03, 0, 0)
    clay.sweep('brazo', [(0.16, 0.12, 0.13), (0.14, 0.02, 0.13), (0.06, -0.04, 0.12)], 0.008, (1, 1), coll, _mat('Deco | metal', '#C9CCD2', rough=0.25,
                                                                                                          metallic=1.0), segments=6, samples=4)
    for k, x in enumerate((0.12, 0.16)):
        clay.blob(f'perilla {k}', (x, -0.15, 0.08), (0.015, 0.012, 0.015), coll, laca('perilla', '#F7C948', 0.3), n=4)


def deco_globo(coll):
    clay.lathe('base globo', [(0.0, 0.0), (0.08, 0.0), (0.06, 0.03), (0.015, 0.05), (0.0, 0.05)], coll, madera('base globo', '#8A5A3C'), segments=20)
    clay.sweep('eje globo', [(0.0, 0.0, 0.05), (0.0, -0.1, 0.13), (0.0, 0.0, 0.35), (0.0, 0.1, 0.13)], 0.01, (1, 1), coll,
               _mat('Deco | latón', '#E5B85C', rough=0.25, metallic=1.0), segments=6, samples=5)
    clay.blob('globo', (0, 0, 0.2), (0.12, 0.12, 0.12), coll, laca('mar globo', '#6FB7E0', 0.35), n=8)
    rng = np.random.default_rng(6)
    for k in range(8):
        u = rng.normal(size=3)
        u /= np.linalg.norm(u)
        clay.blob(f'continente {k}', tuple(np.array([0, 0, 0.2]) + u * 0.118), (0.05, 0.05, 0.02), coll, laca('tierra globo', '#8FCB6A', 0.4), n=4)


def deco_bonsai(coll):
    clay.rbox('matera bonsái', (0, 0, 0.04), (0.14, 0.09, 0.04), coll, laca('matera bonsái', '#3B6FB6', 0.3), p=5, n=4)
    tronco = madera('bonsái', '#6B4632')
    clay.sweep('tronco bonsái', [(0, 0, 0.07), (0.04, 0, 0.14), (-0.03, 0, 0.22), (0.02, 0, 0.3)], [0.03, 0.025, 0.02, 0.015], (1, 1), coll, tronco,
               segments=8, samples=4)
    for k, (x, z, r) in enumerate(((0.02, 0.33, 0.09), (-0.09, 0.26, 0.07), (0.1, 0.25, 0.07))):
        clay.blob(f'copa bonsái {k}', (x, 0, z), (r, r * 0.8, r * 0.6), coll, utileria.u('hoja oscura'), n=6)


def deco_suculentas(coll):
    for k, (x, col) in enumerate(((-0.12, '#F39AB0'), (0.0, '#F2EBDD'), (0.12, '#8EC5F0'))):
        o = clay.lathe(f'materita {k}', [(0.0, 0.0), (0.045, 0.0), (0.05, 0.08), (0.0, 0.08)], coll, laca(f'materita {col}', col, 0.4), segments=16)
        o.location = (x, 0, 0)
        verde = _mat(f'Deco | suculenta {k}', ('#7FB77E', '#9CCB8F', '#6DB36A')[k], rough=0.5, sss=0.2)
        for j in range(8):
            a = 2 * math.pi * j / 8 + k
            o = clay.blob(f'hoja suculenta {k}{j}', (0, 0, 0), (0.028, 0.016, 0.012), coll, verde, n=4)
            o.rotation_euler = (0, -0.5, a)
            o.location = (x + math.cos(a) * 0.028, math.sin(a) * 0.028, 0.1)
        clay.blob(f'centro suculenta {k}', (x, 0, 0.11), (0.018, 0.018, 0.018), coll, verde, n=4)


def deco_vela_frasco(coll):
    vidrio = transparente('vidrio frasco', '#F1E6DA', 0.35)
    clay.lathe('frasco vela', [(0.0, 0.0), (0.08, 0.0), (0.08, 0.16), (0.07, 0.17), (0.0, 0.17)], coll, vidrio, segments=24, cap_top=False)
    clay.lathe('cera frasco', [(0.0, 0.01), (0.075, 0.01), (0.075, 0.1), (0.0, 0.1)], coll, _mat('Deco | cera rosa', '#F7C6D2', rough=0.5, sss=0.4), segments=24)
    clay.blob('llama frasco', (0, 0, 0.13), (0.013, 0.013, 0.026), coll, luz('llama', '#FFC24A', 8.0), n=5)
    clay.rbox('etiqueta frasco', (0, -0.081, 0.07), (0.04, 0.004, 0.025), coll, papel('etiqueta vela', '#FFF8EC'), p=6, n=3)
    corazon_plano('corazón etiqueta', (0, -0.086, 0.07), 0.06, coll, laca('corazón', '#E4566B', 0.35), grosor=0.2)


def deco_portarretrato(coll):
    for k, (x, rot) in enumerate(((-0.08, 0.25), (0.08, -0.25))):
        clay.rbox(f'marco portarretrato {k}', (x, 0, 0.1), (0.07, 0.012, 0.09), coll, laca('marco portarretrato', '#F6F2EA', 0.3), p=6, n=4).rotation_euler = (
            math.radians(-10), 0, rot)
        corazon_plano(f'corazón portarretrato {k}', (x, -0.02, 0.1), 0.14, coll, laca('corazón', '#E4566B', 0.35), grosor=0.2)


def deco_despertador(coll):
    cuerpo = laca('despertador', '#E4566B', 0.3)
    o = clay.lathe('cuerpo despertador', [(0.0, 0.0), (0.1, 0.0), (0.1, 0.06), (0.0, 0.06)], coll, cuerpo, segments=28)
    o.rotation_euler = (math.radians(90), 0, 0)
    o.location = (0, 0.03, 0.12)
    cara = clay.lathe('cara despertador', [(0.0, 0.0), (0.085, 0.0), (0.085, 0.005), (0.0, 0.005)], coll, papel('cara', '#FFFDF6'), segments=28)
    cara.rotation_euler = (math.radians(90), 0, 0)
    cara.location = (0, -0.032, 0.12)
    for sx in (-1, 1):
        clay.blob(f'campana {sx}', (sx * 0.07, 0, 0.22), (0.045, 0.045, 0.035), coll, _mat('Deco | latón', '#E5B85C', rough=0.25, metallic=1.0), n=5)
        clay.sweep(f'pata {sx}', [(sx * 0.05, 0, 0.04), (sx * 0.08, -0.01, 0.0)], 0.01, (1, 1), coll, cuerpo, segments=5, samples=2)
    clay.sweep('agujas', [(0, -0.04, 0.12), (0.03, -0.04, 0.17), (0, -0.04, 0.12), (-0.04, -0.04, 0.13)], 0.005, (1, 1), coll, laca('agujas', '#2B2422', 0.4),
               segments=4, samples=2)


def deco_taza_corazon(coll):
    loza = laca('taza deco', '#FFFFFF', 0.3)
    clay.lathe('taza deco', [(0.0, 0.0), (0.06, 0.0), (0.07, 0.13), (0.064, 0.13), (0.054, 0.012), (0.0, 0.012)], coll, loza, segments=28, cap_top=False)
    clay.sweep('oreja taza deco', [(0.065, 0, 0.1), (0.11, 0, 0.09), (0.11, 0, 0.04), (0.063, 0, 0.03)], 0.012, (1, 1), coll, loza, segments=8, samples=4)
    corazon_plano('corazón taza', (0, -0.072, 0.065), 0.12, coll, laca('corazón', '#E4566B', 0.35), grosor=0.2)
    clay.lathe('café taza', [(0.0, 0.11), (0.062, 0.11)], coll, _mat('Deco | café', '#5A2E1C', rough=0.2, coat=0.4), segments=24, cap_bottom=False)
    for k in range(2):
        clay.sweep(f'vapor {k}', [(-0.02 + k * 0.03, 0, 0.15), (0.0 + k * 0.03, 0, 0.2), (-0.02 + k * 0.03, 0, 0.25)], 0.008, (1, 1), coll,
                   transparente('vapor', '#FFFFFF', 0.5, rough=0.9), segments=4, samples=4)


def deco_caja_musical(coll):
    clay.rbox('caja musical', (0, 0, 0.06), (0.12, 0.09, 0.06), coll, laca('caja musical', '#F39AB0', 0.3), p=6, n=4)
    clay.rbox('tapa musical', (0, 0.09, 0.19), (0.12, 0.01, 0.08), coll, laca('caja musical', '#F39AB0', 0.3), p=6, n=4).rotation_euler = (math.radians(-15), 0, 0)
    clay.rbox('espejo tapa', (0, 0.078, 0.19), (0.09, 0.004, 0.06), coll, _mat('Deco | espejo', '#D9E7EF', rough=0.02, metallic=1.0), p=6, n=3).rotation_euler = (
        math.radians(-15), 0, 0)
    clay.lathe('pedestal bailarina', [(0.0, 0.12), (0.03, 0.12), (0.03, 0.13), (0.0, 0.13)], coll, _mat('Deco | latón', '#E5B85C', rough=0.25, metallic=1.0),
               segments=16)
    clay.lathe('falda bailarina', [(0.0, 0.16), (0.05, 0.16), (0.01, 0.2), (0.0, 0.2)], coll, tela('tutú', '#FFFFFF'), segments=16)
    clay.blob('cuerpo bailarina', (0, 0, 0.2), (0.015, 0.012, 0.03), coll, laca('malla', '#F7C6D2', 0.3), n=4)
    clay.blob('cabeza bailarina', (0, 0, 0.245), (0.015, 0.015, 0.015), coll, laca('piel', '#F3B28A', 0.4), n=4)
    clay.sweep('pierna bailarina', [(0, 0, 0.16), (0, 0, 0.13)], 0.006, (1, 1), coll, laca('piel', '#F3B28A', 0.4), segments=4, samples=2)
    corazon_plano('corazón caja', (0, -0.092, 0.06), 0.1, coll, laca('dorado', '#E5B85C', 0.25), grosor=0.2)


def deco_bola_nieve(coll):
    clay.lathe('base bola', [(0.0, 0.0), (0.1, 0.0), (0.09, 0.06), (0.07, 0.07), (0.0, 0.07)], coll, madera('base bola', '#8A5A3C'), segments=28)
    clay.blob('bola nieve', (0, 0, 0.17), (0.11, 0.11, 0.11), coll, transparente('vidrio bola', '#EAF6FB', 0.25), n=8)
    clay.blob('nieve piso', (0, 0, 0.08), (0.08, 0.08, 0.02), coll, papel('nieve', '#FFFFFF'), n=6)
    clay.rbox('casita', (0, 0, 0.12), (0.035, 0.03, 0.03), coll, laca('casita', '#F39AB0', 0.4), p=6, n=3)
    clay.lathe('techo casita', [(0.0, 0.15), (0.045, 0.15), (0.0, 0.19)], coll, laca('techo', '#E4566B', 0.4), segments=4)
    clay.lathe('pinito', [(0.0, 0.09), (0.03, 0.09), (0.0, 0.18)], coll, _mat('Deco | pino', '#2F7D4A', rough=0.7), segments=10).location = (0.05, 0.03, 0)
    rng = np.random.default_rng(3)
    for k in range(12):
        u = rng.normal(size=3)
        u /= np.linalg.norm(u)
        clay.blob(f'copo {k}', tuple(np.array([0, 0, 0.17]) + u * rng.uniform(0.03, 0.09)), (0.006, 0.006, 0.006), coll, papel('nieve', '#FFFFFF'), n=3,
                  subsurf=0)


def deco_libros(coll):
    colores = ('#3B6FB6', '#E4566B', '#F7C948', '#8FD6B9')
    z = 0.0
    for k, (w, d, h) in enumerate(((0.2, 0.14, 0.04), (0.18, 0.13, 0.035), (0.19, 0.12, 0.045), (0.16, 0.11, 0.03))):
        o = clay.rbox(f'libro {k}', (0, 0, z + h / 2), (w / 2, d / 2, h / 2), coll, laca(f'libro {colores[k]}', colores[k], 0.5), p=8, n=3)
        o.rotation_euler = (0, 0, (k - 1.5) * 0.12)
        clay.rbox(f'hojas {k}', (0.004, 0, z + h / 2), (w / 2 - 0.004, d / 2 + 0.002, h / 2 - 0.006), coll, papel('hojas', '#FFF8EC'), p=8, n=3,
                  subsurf=0).rotation_euler = (0, 0, (k - 1.5) * 0.12)
        z += h
    clay.lathe('taza libros', [(0.0, z), (0.035, z), (0.04, z + 0.07), (0.0, z + 0.07)], coll, laca('taza libros', '#86CDBA', 0.3), segments=16)


def deco_radio(coll):
    clay.rbox('radio', (0, 0, 0.1), (0.18, 0.08, 0.1), coll, laca('radio', '#86CDBA', 0.3), p=5, n=4)
    clay.blob('parlante radio', (-0.07, -0.08, 0.1), (0.07, 0.01, 0.07), coll, tela('rejilla', '#F2EBDD'), n=6)
    clay.rbox('dial', (0.08, -0.08, 0.13), (0.06, 0.008, 0.025), coll, papel('dial', '#FFF8EC'), p=6, n=3)
    for k, x in enumerate((0.05, 0.11)):
        clay.blob(f'perilla radio {k}', (x, -0.085, 0.06), (0.018, 0.012, 0.018), coll, laca('perilla', '#F7C948', 0.3), n=4)
    clay.sweep('antena radio', [(0.12, 0.0, 0.2), (0.2, 0.02, 0.36)], 0.005, (1, 1), coll, _mat('Deco | metal', '#C9CCD2', rough=0.25, metallic=1.0),
               segments=4, samples=2)
    clay.sweep('asa radio', [(-0.12, 0, 0.2), (-0.08, 0, 0.26), (0.08, 0, 0.26), (0.12, 0, 0.2)], 0.012, (1, 1), coll, laca('asa', '#3D2B27', 0.4), segments=6,
               samples=4)


# ---------------------------------------------------------------------------
# Peluches (sofá y cama)
# ---------------------------------------------------------------------------

def deco_conejo_peluche(coll):
    peluche(coll, 'conejo', '#FAF6F2', '#F7C6D2', 'conejo')


def deco_gato_peluche(coll):
    peluche(coll, 'gato', '#9A9A9E', '#FFFFFF', 'gato',
            extras=lambda c, s, p, cl, o: clay.sweep('cola gato', [(0.1, 0.08, 0.06), (0.18, 0.1, 0.12), (0.16, 0.1, 0.24)], 0.025, (1, 1), c, p, segments=8,
                                                     samples=4))


def deco_dino_peluche(coll):
    def puas(c, s, p, cl, o):
        for k, z in enumerate((0.38, 0.3, 0.2, 0.1)):
            clay.blob(f'púa peluche {k}', (0, 0.1 - 0.02 * (k == 0), z), (0.012, 0.035, 0.035), c, tela('púas', '#F7A93B'), n=4)
        clay.sweep('cola dino', [(0, 0.08, 0.05), (0.05, 0.2, 0.03), (0.1, 0.28, 0.02)], [0.05, 0.035, 0.01], (1, 1), c, p, segments=8, samples=4)
    peluche(coll, 'dino', '#7DC47A', '#F4E6A9', None, extras=puas)


def deco_perro_peluche(coll):
    peluche(coll, 'perrito', '#D9B07C', '#FFF3E0', 'perro')


def deco_pinguino(coll):
    negro, blanco = tela('pingüino', '#2B2F3A'), tela('pingüino blanco', '#FFFFFF')
    clay.blob('cuerpo pingüino', (0, 0, 0.17), (0.13, 0.12, 0.17), coll, negro, n=8)
    clay.blob('panza pingüino', (0, -0.07, 0.15), (0.09, 0.06, 0.13), coll, blanco, n=7)
    for sx in (-1, 1):
        clay.blob('ojo', (sx * 0.04, -0.105, 0.27), (0.014, 0.008, 0.016), coll, laca('ojo', '#2B2422', 0.2), n=4)
        clay.blob('ala', (sx * 0.13, 0, 0.16), (0.03, 0.06, 0.1), coll, negro, n=5)
        clay.blob('pata', (sx * 0.05, -0.08, 0.01), (0.04, 0.05, 0.015), coll, tela('patas', '#F7A93B'), n=4)
    clay.blob('pico', (0, -0.13, 0.24), (0.03, 0.03, 0.018), coll, tela('pico', '#F7A93B'), n=4)
    clay.lathe('bufanda', [(0.1, 0.25), (0.115, 0.27), (0.1, 0.29)], coll, tela('bufanda', '#E4566B'), segments=20, cap_bottom=False, cap_top=False)


def deco_unicornio(coll):
    def cuerno(c, s, p, cl, o):
        clay.sweep('cuerno unicornio', [(0, -0.06, 0.39), (0, -0.07, 0.49)], 0.022, (1, 1), c, laca('cuerno', '#F7C948', 0.3), segments=8, samples=2,
                   caps=('flat', 'point'), up=(0, -1, 0))
        for k, col in enumerate(('#F39AB0', '#C9B6EA', '#8EC5F0')):
            clay.blob(f'crin {k}', (0.0, 0.05 - k * 0.02, 0.37 - k * 0.04), (0.03, 0.04, 0.03), c, tela(f'crin {col}', col), n=5)
    peluche(coll, 'unicornio', '#FFFFFF', '#F7C6D2', 'gato', extras=cuerno)


def deco_panda(coll):
    def manchas(c, s, p, cl, o):
        for sx in (-1, 1):
            clay.blob(f'mancha ojo {sx}', (sx * 0.035, -0.083, 0.33), (0.025, 0.008, 0.03), c, tela('panda negro', '#2B2422'), n=4)
    peluche(coll, 'panda', '#FFFFFF', '#2B2422', 'oso', extras=manchas, ojo='#FFFFFF')


def deco_elefante(coll):
    def trompa(c, s, p, cl, o):
        clay.sweep('trompa', [(0, -0.08, 0.3), (0, -0.14, 0.25), (0, -0.15, 0.18)], [0.035, 0.028, 0.022], (1, 1), c, p, segments=8, samples=4)
        for sx in (-1, 1):
            clay.blob(f'oreja elefante {sx}', (sx * 0.12, 0.0, 0.32), (0.02, 0.08, 0.08), c, tela('oreja elefante', '#F7C6D2'), n=5)
    peluche(coll, 'elefante', '#AEB7C8', '#E3E7EF', None, extras=trompa)


def deco_corazon_peluche(coll):
    o = corazon_plano('corazón peluche', (0, 0, 0), 0.55, coll, tela('corazón peluche', '#E4566B'), grosor=0.45)
    o.location = (0, 0, 0.14)
    for sx in (-1, 1):
        clay.blob(f'ojo corazón {sx}', (sx * 0.04, -0.07, 0.16), (0.012, 0.008, 0.015), coll, laca('ojo', '#2B2422', 0.2), n=4)
    clay.sweep('sonrisa corazón', [(-0.025, -0.075, 0.12), (0, -0.078, 0.11), (0.025, -0.075, 0.12)], 0.004, (1, 1), coll, laca('ojo', '#2B2422', 0.2),
               segments=4, samples=3)


PIEZAS = {
    # cuadro
    'deco_cuadro_atardecer': deco_cuadro_atardecer, 'deco_cuadro_flores': deco_cuadro_flores, 'deco_cuadro_pareja': deco_cuadro_pareja,
    'deco_cuadro_mapa': deco_cuadro_mapa, 'deco_cuadro_noche': deco_cuadro_noche, 'deco_cuadro_gato': deco_cuadro_gato, 'deco_reloj': deco_reloj,
    'deco_espejo': deco_espejo, 'deco_guirnalda': deco_guirnalda, 'deco_banderin': deco_banderin, 'deco_corona_flores': deco_corona_flores,
    'deco_letrero_amor': deco_letrero_amor,
    # piso
    'deco_monstera': deco_monstera, 'deco_girasoles': deco_girasoles, 'deco_arbol_navidad': deco_arbol_navidad, 'deco_guitarra': deco_guitarra,
    'deco_puf': deco_puf, 'deco_estanteria': deco_estanteria, 'deco_perro_grande': deco_perro_grande, 'deco_lampara_bola': deco_lampara_bola,
    'deco_cojin_corazon': deco_cojin_corazon, 'deco_palma': deco_palma,
    # mesa
    'deco_lampara_mesa': deco_lampara_mesa, 'deco_pecera': deco_pecera, 'deco_tocadiscos': deco_tocadiscos, 'deco_globo_terraqueo': deco_globo,
    'deco_bonsai': deco_bonsai, 'deco_suculentas': deco_suculentas, 'deco_vela_frasco': deco_vela_frasco, 'deco_portarretrato': deco_portarretrato,
    'deco_despertador': deco_despertador, 'deco_taza_corazon': deco_taza_corazon, 'deco_caja_musical': deco_caja_musical,
    'deco_bola_nieve': deco_bola_nieve, 'deco_libros': deco_libros, 'deco_radio': deco_radio,
    # peluche
    'deco_conejo_peluche': deco_conejo_peluche, 'deco_gato_peluche': deco_gato_peluche, 'deco_dino_peluche': deco_dino_peluche,
    'deco_perro_peluche': deco_perro_peluche, 'deco_pinguino': deco_pinguino, 'deco_unicornio': deco_unicornio, 'deco_panda': deco_panda,
    'deco_elefante': deco_elefante, 'deco_corazon_peluche': deco_corazon_peluche,
}
CUADROS = tuple(k for k in list(PIEZAS)[:12])
