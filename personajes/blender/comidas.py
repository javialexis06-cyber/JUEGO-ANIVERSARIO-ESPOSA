"""Nuestro Hogar: comidas nuevas de la tienda de la casa (colombianas, rápidas, dulces y bebidas).

Todo en el origen con la base en z=0 y el frente hacia -y, al tamaño de los productos del súper (0,2 a 0,4 m):
el personaje las sostiene en la mano al comer. Cada pieza se exporta a comida_<clave>.glb con su ícono.
"""
import math

import numpy as np

import clay
from regalos import corazon_plano, laca, papel
from tiendas import _mat


def mat(nombre, color, rough=0.55, **kw):
    return _mat(f'Comida | {nombre}', color, rough=rough, **kw)


def transparente(nombre, color, alpha=0.35, rough=0.08):
    """Vidrio liviano: semitransparente (sin refracción, que en el celular pesa mucho)."""
    mt = _mat(f'Comida | {nombre}', color, rough=rough, coat=0.8, alpha=alpha)
    try:
        mt.surface_render_method = 'BLENDED'
    except AttributeError:
        mt.blend_method = 'BLEND'
    return mt


def masa(nombre, color):
    return mat(nombre, color, rough=0.72, noise=dict(scale=30, strength=0.2, distance=0.006))


def plato(coll, r=0.2, color='#FFFFFF', z=0.0):
    clay.lathe('plato', [(0.0, z), (r * 0.7, z), (r, z + 0.025), (r * 1.02, z + 0.03), (r * 0.72, z + 0.012), (0.0, z + 0.012)], coll,
               laca(f'plato {color}', color, 0.25), segments=40)
    return z + 0.014


def tazon(coll, r=0.15, h=0.12, color='#F4EBDD', borde='#86CDBA'):
    clay.lathe('tazón', [(0.0, 0.0), (r * 0.55, 0.0), (r * 0.9, h * 0.5), (r, h), (r * 0.94, h), (r * 0.84, h * 0.55), (0.0, 0.02)], coll,
               laca(f'tazón {color}', color, 0.3), segments=36, cap_top=False)
    clay.lathe('borde tazón', [(r * 0.99, h * 0.9), (r * 1.01, h * 0.95), (r * 0.99, h * 1.0)], coll, laca(f'borde {borde}', borde, 0.3), segments=36,
               cap_bottom=False, cap_top=False)
    return h


def vaso(coll, r=0.07, h=0.26, liquido='#F7E36B', lleno=0.82):
    vidrio = transparente('vidrio', '#EAF6FB')
    clay.lathe('vaso', [(0.0, 0.0), (r * 0.9, 0.0), (r, h), (r * 0.94, h), (r * 0.84, 0.02), (0.0, 0.02)], coll, vidrio, segments=32, cap_top=False)
    clay.lathe('bebida', [(0.0, 0.02), (r * 0.84, 0.02), (r * 0.92, h * lleno), (0.0, h * lleno)], coll, mat(f'bebida {liquido}', liquido, 0.2, coat=0.4),
               segments=32)
    return h * lleno


def pitillo(coll, base, arriba, color='#F39AB0'):
    clay.sweep('pitillo', [base, arriba], 0.01, (1, 1), coll, laca(f'pitillo {color}', color, 0.3), segments=8, samples=2)


def chispas(coll, centro, radio, z, n=14, semilla=1, colores=('#F39AB0', '#8FD6B9', '#F7C948', '#8EC5F0', '#FFFFFF')):
    rng = np.random.default_rng(semilla)
    for k in range(n):
        a, r = rng.uniform(0, 2 * math.pi), radio * math.sqrt(rng.uniform(0.1, 1))
        c = (centro[0] + math.cos(a) * r, centro[1] + math.sin(a) * r, z)
        col = colores[k % len(colores)]
        o = clay.blob(f'chispa {k}', c, (0.012, 0.004, 0.004), coll, laca(f'chispa {col}', col, 0.3), n=3, subsurf=0)
        o.rotation_euler = (0, 0, rng.uniform(0, math.pi))


# ---------------------------------------------------------------------------
# Colombianas
# ---------------------------------------------------------------------------

def comida_empanada(coll):
    m = masa('empanada', '#E8A94A')
    clay.blob('empanada', (0, 0, 0.05), (0.17, 0.1, 0.05), coll, m, n=10,
              shaper=lambda v: np.column_stack([v[:, 0], v[:, 1] + 0.35 * v[:, 0] ** 2 / 0.17 - 0.02, v[:, 2] * (1 - 0.4 * (v[:, 1] > 0))]))
    for k, a in enumerate(np.linspace(-1.2, 1.2, 9)):
        x, y = 0.17 * math.sin(a), 0.06 - 0.06 * math.cos(a) + 0.03
        clay.blob(f'repulgue {k}', (x, y + 0.02, 0.035), (0.028, 0.022, 0.02), coll, m, n=4)
    clay.blob('ají', (0.2, -0.08, 0.02), (0.05, 0.04, 0.02), coll, mat('ají', '#6FB64E', 0.4, coat=0.4), n=5)


def comida_bunuelos(coll):
    papel_b = papel('servilleta', '#FFF8EC')
    clay.rbox('servilleta', (0, 0, 0.005), (0.19, 0.15, 0.005), coll, papel_b, p=6, n=4, subsurf=1)
    m = masa('buñuelo', '#D98E3A')
    for k, (x, y, z) in enumerate(((-0.07, -0.02, 0.07), (0.07, 0.0, 0.07), (0.0, 0.07, 0.07), (0.0, -0.01, 0.17))):
        clay.blob(f'buñuelo {k}', (x, y, z), (0.07, 0.07, 0.066), coll, m, n=7)


def comida_pandebono(coll):
    m = masa('pandebono', '#EBB45E')
    for k, (x, y) in enumerate(((-0.08, 0.0), (0.08, 0.02), (0.0, 0.09))):
        o = clay.lathe(f'pandebono {k}', [(0.0, 0.0), (0.06, 0.0), (0.085, 0.04), (0.07, 0.07), (0.035, 0.075), (0.0, 0.06)], coll, m, segments=24)
        o.location = (x, y, 0)
    plato(coll, 0.2)


def comida_arepa_queso(coll):
    z = plato(coll, 0.2)
    clay.lathe('arepa', [(0.0, z), (0.13, z), (0.145, z + 0.02), (0.135, z + 0.04), (0.0, z + 0.042)], coll, masa('arepa', '#F1C56E'), segments=32)
    clay.blob('queso derretido', (0.01, 0.0, z + 0.05), (0.1, 0.09, 0.018), coll, mat('queso', '#F9E7A6', 0.3, coat=0.3), n=8,
              shaper=lambda v: v + np.array([0, 0, -1]) * (np.abs(np.sin(v[:, 0:1] * 40)) * 0.004))
    clay.rbox('mantequilla', (-0.03, 0.02, z + 0.07), (0.025, 0.02, 0.012), coll, mat('mantequilla', '#FFE58A', 0.35), p=5, n=3)


def comida_bandeja_paisa(coll):
    z = plato(coll, 0.24, '#FFFFFF')
    clay.blob('arroz', (-0.08, 0.06, z + 0.03), (0.08, 0.07, 0.045), coll, mat('arroz', '#F8F4EA', 0.8, noise=dict(scale=90, strength=0.3)), n=8)
    clay.blob('fríjoles', (0.07, 0.08, z + 0.02), (0.08, 0.06, 0.03), coll, mat('fríjoles', '#6A2E22', 0.35, coat=0.4), n=7)
    clay.blob('clara', (0.02, -0.08, z + 0.01), (0.09, 0.08, 0.01), coll, mat('clara', '#FFFFFF', 0.4), n=8)
    clay.blob('yema', (0.02, -0.08, z + 0.025), (0.03, 0.03, 0.02), coll, mat('yema', '#F7B32B', 0.25, coat=0.5), n=6)
    clay.blob('chicharrón', (-0.12, -0.06, z + 0.03), (0.07, 0.035, 0.03), coll, mat('chicharrón', '#B8672E', 0.5, ribs=dict(scale=40, strength=0.4, axis='X')),
              n=6)
    clay.blob('aguacate', (0.15, -0.02, z + 0.02), (0.05, 0.03, 0.02), coll, mat('aguacate', '#A7C957', 0.4), n=6)
    clay.blob('maduro', (0.13, -0.11, z + 0.02), (0.07, 0.025, 0.018), coll, mat('maduro', '#D9892F', 0.4, coat=0.3), n=6)
    clay.blob('chorizo', (-0.02, 0.14, z + 0.025), (0.05, 0.025, 0.025), coll, mat('chorizo', '#A0342B', 0.35, coat=0.3), n=6)


def comida_ajiaco(coll):
    h = tazon(coll, 0.16, 0.12, '#E9C98F', '#C9956A')
    clay.lathe('caldo', [(0.0, h * 0.8), (0.145, h * 0.8)], coll, mat('ajiaco', '#E7C24A', 0.3, coat=0.5), segments=36, cap_bottom=False)
    clay.blob('crema', (0.02, 0.02, h * 0.85), (0.05, 0.05, 0.015), coll, mat('crema', '#FFFDF5', 0.4), n=6)
    clay.blob('mazorca ajiaco', (-0.06, -0.04, h * 0.85), (0.05, 0.03, 0.03), coll, mat('mazorca', '#F7D04A', 0.4, noise=dict(scale=60, strength=0.4)), n=6)
    for k in range(5):
        clay.blob(f'alcaparra {k}', (0.05 - k * 0.02, -0.05 + k * 0.02, h * 0.85), (0.01, 0.01, 0.008), coll, mat('alcaparra', '#5E7A3A', 0.4), n=3)
    clay.blob('guasca', (0.06, 0.06, h * 0.85), (0.03, 0.02, 0.006), coll, mat('guasca', '#4E8A3A', 0.5), n=4)


def comida_tamal(coll):
    hoja = mat('hoja de plátano', '#4E9A45', 0.5, coat=0.3)
    clay.rbox('tamal', (0, 0, 0.06), (0.14, 0.1, 0.06), coll, hoja, p=3.5, n=6)
    clay.blob('doblez tamal', (0, -0.1, 0.1), (0.13, 0.02, 0.03), coll, hoja, n=5)
    for x in (-0.06, 0.06):
        clay.sweep('pita', [(x, -0.11, 0.0), (x, -0.11, 0.12), (x, 0.11, 0.12), (x, 0.11, 0.0)], 0.006, (1, 1), coll, papel('pita', '#E6C49A'),
                   segments=5, samples=3)
    clay.blob('masa asomada', (0.0, -0.105, 0.05), (0.06, 0.01, 0.02), coll, masa('masa tamal', '#F1B84A'), n=4)


def comida_obleas(coll):
    ob = masa('oblea', '#F5E6C4')
    for k, z in enumerate((0.0, 0.03)):
        clay.lathe(f'oblea {k}', [(0.0, z), (0.15, z), (0.15, z + 0.01), (0.0, z + 0.01)], coll, ob, segments=36)
    clay.lathe('arequipe', [(0.0, 0.01), (0.14, 0.01), (0.145, 0.02), (0.14, 0.03), (0.0, 0.03)], coll, mat('arequipe', '#A0612E', 0.3, coat=0.5),
               segments=36)
    clay.blob('gota arequipe', (0.13, -0.05, 0.015), (0.02, 0.02, 0.025), coll, mat('arequipe', '#A0612E', 0.3, coat=0.5), n=4)


def comida_cholado(coll):
    h = vaso(coll, 0.09, 0.26, '#F28C9A', 0.7)
    for k, (col, dx) in enumerate((('#F28C9A', -0.03), ('#8FD6B9', 0.02), ('#F7C948', 0.0))):
        clay.blob(f'hielo {k}', (dx, 0.0, h + 0.03 + k * 0.02), (0.07, 0.07, 0.04), coll, mat(f'raspado {col}', col, 0.6), n=6)
    clay.blob('fresa cholado', (0.03, -0.02, h + 0.1), (0.03, 0.03, 0.035), coll, mat('fresa', '#E43D4F', 0.35, coat=0.4), n=5)
    clay.blob('banano cholado', (-0.04, 0.03, h + 0.09), (0.03, 0.02, 0.02), coll, mat('banano', '#F7E08A', 0.4), n=4)
    clay.blob('leche condensada', (0, 0, h + 0.11), (0.05, 0.05, 0.012), coll, mat('leche condensada', '#FFF6DE', 0.2, coat=0.6), n=5)
    pitillo(coll, (0.02, 0.02, 0.1), (0.05, 0.04, h + 0.2))


def comida_mango_biche(coll):
    papel_v = papel('vaso papel', '#FFFFFF')
    clay.lathe('vaso mango', [(0.0, 0.0), (0.06, 0.0), (0.085, 0.18), (0.0, 0.18)], coll, papel_v, segments=28, cap_top=False)
    rng = np.random.default_rng(4)
    for k in range(7):
        a = 2 * math.pi * k / 7
        base = np.array([math.cos(a) * 0.035, math.sin(a) * 0.035, 0.1])
        tip = base + np.array([math.cos(a) * 0.03, math.sin(a) * 0.03, 0.15 + rng.uniform(0, 0.05)])
        clay.sweep(f'mango {k}', [base, tip], 0.018, (1, 0.7), coll, mat('mango biche', '#B7D65A', 0.4), segments=4, samples=2, caps=('flat', 'flat'))
    clay.blob('limón', (0.07, -0.04, 0.2), (0.03, 0.02, 0.03), coll, mat('limón', '#7BC043', 0.35, coat=0.3), n=5)
    chispas(coll, (0, 0), 0.05, 0.26, n=10, colores=('#FFFFFF', '#E43D4F'))


def comida_mazorca(coll):
    """Mazorca asada con granos, hojas abiertas y mantequilla."""
    grano = mat('grano', '#F7D04A', 0.35, coat=0.3)
    clay.sweep('tusa', [(0, 0, 0.03), (0, 0, 0.2)], [0.055, 0.045], (1, 1), coll, mat('tusa', '#E8B93A', 0.5), segments=10, samples=3)
    for fila in range(9):
        z = 0.045 + fila * 0.02
        r = 0.058 - fila * 0.0012
        for k in range(10):
            a = 2 * math.pi * (k + 0.5 * (fila % 2)) / 10
            clay.blob(f'grano {fila} {k}', (math.cos(a) * r, math.sin(a) * r, z), (0.014, 0.014, 0.012), coll, grano, n=3, subsurf=0)
    hojas = mat('amero', '#C7D98A', 0.6)
    for k, a in enumerate((0.3, 2.4, 4.3)):
        base = np.array([math.cos(a) * 0.05, math.sin(a) * 0.05, 0.03])
        clay.sweep(f'amero {k}', [base, base + np.array([math.cos(a) * 0.08, math.sin(a) * 0.08, -0.01]), base + np.array([math.cos(a) * 0.14, math.sin(a) * 0.14,
                                                                                                                    -0.02])],
                   [0.04, 0.035, 0.005], (1, 0.15), coll, hojas, segments=6, samples=4, caps=('flat', 'point'), up=(0, 0, 1))
    clay.blob('mantequilla mazorca', (0.0, -0.05, 0.19), (0.035, 0.02, 0.012), coll, mat('mantequilla', '#FFE58A', 0.35), n=5)


def comida_churros(coll):
    clay.lathe('cono churros', [(0.0, 0.0), (0.03, 0.0), (0.1, 0.16), (0.0, 0.16)], coll, papel('cono churros', '#F28C9A'), segments=24, cap_top=False)
    m = mat('churro', '#C9823E', 0.6, ribs=dict(scale=60, strength=0.5, axis='Z'))
    for k, a in enumerate((-0.25, 0.05, 0.3)):
        base = np.array([math.sin(a) * 0.03, 0, 0.08])
        clay.sweep(f'churro {k}', [base, base + np.array([math.sin(a) * 0.12, -0.01, 0.2])], 0.022, (1, 1), coll, m, segments=8, samples=2)
    chispas(coll, (0, 0), 0.06, 0.2, n=12, colores=('#FFFFFF',))


def comida_arroz_leche(coll):
    h = tazon(coll, 0.13, 0.1, '#F4EBDD', '#F39AB0')
    clay.lathe('arroz con leche', [(0.0, h * 0.85), (0.12, h * 0.85)], coll, mat('arroz con leche', '#FBF1DC', 0.5, noise=dict(scale=70, strength=0.3)),
               segments=32, cap_bottom=False)
    clay.sweep('canela', [(-0.08, -0.03, h * 0.9), (0.07, 0.03, h * 1.05)], 0.012, (1, 1), coll, mat('canela', '#8A4B2A', 0.6), segments=6, samples=2)
    chispas(coll, (0, 0), 0.08, h * 0.87, n=10, colores=('#8A4B2A',))


# ---------------------------------------------------------------------------
# Rápidas
# ---------------------------------------------------------------------------

def comida_perro(coll):
    pan = masa('pan perro', '#E5A95B')
    for s in (-1, 1):
        clay.blob(f'pan perro {s}', (0, s * 0.045, 0.05), (0.19, 0.045, 0.05), coll, pan, n=8)
    clay.blob('salchicha', (0, 0, 0.08), (0.21, 0.035, 0.035), coll, mat('salchicha', '#C0543A', 0.35, coat=0.4), n=8)
    for k, (col, dy) in enumerate((('#F7C948', -0.01), ('#E4566B', 0.012))):
        pts = [(x, dy + 0.012 * math.sin(x * 60), 0.115) for x in np.linspace(-0.17, 0.17, 11)]
        clay.sweep(f'salsa {k}', pts, 0.009, (1, 1), coll, mat(f'salsa {col}', col, 0.25, coat=0.5), segments=5, samples=3)
    for k in range(10):
        clay.blob(f'papita {k}', (-0.15 + k * 0.033, 0.0, 0.125), (0.012, 0.004, 0.004), coll, mat('papita', '#F7D06B', 0.4), n=3, subsurf=0)


def comida_hamburguesa(coll):
    pan = masa('pan hamburguesa', '#D9924A')
    clay.lathe('pan abajo', [(0.0, 0.0), (0.13, 0.0), (0.145, 0.03), (0.0, 0.04)], coll, pan, segments=32)
    clay.lathe('carne', [(0.0, 0.04), (0.15, 0.04), (0.155, 0.065), (0.0, 0.07)], coll, mat('carne', '#6B3B24', 0.6, noise=dict(scale=50, strength=0.4)),
               segments=32)
    clay.blob('queso', (0, 0, 0.075), (0.16, 0.16, 0.008), coll, mat('queso', '#F7C948', 0.35), n=6, p=4)
    clay.blob('lechuga', (0, 0, 0.085), (0.16, 0.16, 0.012), coll, mat('lechuga', '#7CC05A', 0.5), n=8,
              shaper=lambda v: v + np.array([0, 0, 1]) * np.sin(np.arctan2(v[:, 1:2], v[:, 0:1]) * 9) * 0.006)
    clay.lathe('tomate', [(0.0, 0.095), (0.13, 0.095), (0.13, 0.11), (0.0, 0.11)], coll, mat('tomate', '#E4463B', 0.3, coat=0.4), segments=28)
    clay.lathe('pan arriba', [(0.0, 0.11), (0.15, 0.11), (0.145, 0.15), (0.1, 0.2), (0.0, 0.215)], coll, pan, segments=32)
    for k in range(12):
        a = k * 2.4
        r = 0.04 + 0.006 * k
        clay.blob(f'ajonjolí {k}', (math.cos(a) * r, math.sin(a) * r, 0.2 - r * 0.35), (0.009, 0.005, 0.004), coll, mat('ajonjolí', '#FFF6DE', 0.5), n=3,
                  subsurf=0)


def comida_salchipapa(coll):
    caja = papel('caja salchipapa', '#E4566B')
    clay.rbox('caja salchipapa', (0, 0, 0.05), (0.13, 0.1, 0.05), coll, caja, p=8, n=4)
    rng = np.random.default_rng(3)
    for k in range(22):
        x, y = rng.uniform(-0.1, 0.1), rng.uniform(-0.07, 0.07)
        o = clay.rbox(f'papa {k}', (x, y, 0.11 + rng.uniform(0, 0.03)), (0.07, 0.012, 0.012), coll, mat('papa frita', '#F7D06B', 0.5), p=6, n=3, subsurf=0)
        o.rotation_euler = (0, rng.uniform(-0.3, 0.3), rng.uniform(0, math.pi))
    for k in range(6):
        x, y = rng.uniform(-0.08, 0.08), rng.uniform(-0.05, 0.05)
        clay.lathe(f'rodaja salchicha {k}', [(0.0, 0.0), (0.025, 0.0), (0.025, 0.014), (0.0, 0.014)], coll, mat('salchicha', '#C0543A', 0.35, coat=0.4),
                   segments=14).location = (x, y, 0.15)
    pts = [(x, 0.02 * math.sin(x * 50), 0.17) for x in np.linspace(-0.09, 0.09, 9)]
    clay.sweep('salsa rosada', pts, 0.01, (1, 1), coll, mat('salsa rosada', '#F2A28A', 0.25, coat=0.5), segments=5, samples=3)


def comida_sushi(coll):
    clay.rbox('tabla sushi', (0, 0, 0.015), (0.2, 0.1, 0.015), coll, _mat('Comida | tabla', '#C9956A', rough=0.6), p=8, n=4)
    for k, x in enumerate((-0.13, -0.045, 0.045, 0.13)):
        o = clay.lathe(f'nori {k}', [(0.0, 0.0), (0.04, 0.0), (0.04, 0.05), (0.0, 0.05)], coll, mat('nori', '#1E3A2A', 0.5), segments=20)
        o.location = (x, 0, 0.03)
        o2 = clay.lathe(f'arroz sushi {k}', [(0.0, 0.0), (0.033, 0.0), (0.033, 0.052), (0.0, 0.052)], coll, mat('arroz', '#F8F4EA', 0.8), segments=20)
        o2.location = (x, 0, 0.03)
        col = ('#F28C6B', '#E4566B', '#8FD6B9', '#F28C6B')[k]
        o3 = clay.lathe(f'centro sushi {k}', [(0.0, 0.0), (0.014, 0.0), (0.014, 0.054), (0.0, 0.054)], coll, mat(f'relleno {col}', col, 0.4), segments=12)
        o3.location = (x, 0, 0.03)
    clay.blob('wasabi', (0.16, 0.07, 0.04), (0.02, 0.02, 0.015), coll, mat('wasabi', '#9BCB5A', 0.5), n=4)


def comida_tacos(coll):
    tort = masa('tortilla', '#F2CD7A')
    for k, x in enumerate((-0.08, 0.08)):
        o = clay.blob(f'tortilla {k}', (0, 0, 0.0), (0.13, 0.012, 0.1), coll, tort, n=8,
                      shaper=lambda v: np.column_stack([v[:, 0], v[:, 1] + (v[:, 2] ** 2) * 2.2, np.maximum(v[:, 2], -0.01) + 0.1]))
        o.location = (x, 0, 0.0)
        o.rotation_euler = (0, 0, math.radians(90))
        for j, (col, dz) in enumerate((('#7A3E2A', 0.08), ('#7CC05A', 0.12), ('#E4463B', 0.13), ('#F7F4EA', 0.14))):
            clay.blob(f'relleno taco {k} {j}', (x, 0, dz), (0.025, 0.1, 0.02), coll, mat(f'relleno taco {col}', col, 0.5), n=5)


# ---------------------------------------------------------------------------
# Dulces
# ---------------------------------------------------------------------------

def comida_fresas_crema(coll):
    vidrio = transparente('vidrio', '#EAF6FB')
    clay.lathe('copa', [(0.0, 0.0), (0.06, 0.0), (0.02, 0.03), (0.02, 0.07), (0.11, 0.12), (0.12, 0.2), (0.11, 0.2), (0.0, 0.1)], coll, vidrio, segments=32,
               cap_top=False)
    fresa = mat('fresa', '#E43D4F', 0.35, coat=0.4)
    for k in range(6):
        a = 2 * math.pi * k / 6
        clay.blob(f'fresa {k}', (math.cos(a) * 0.06, math.sin(a) * 0.06, 0.15), (0.035, 0.035, 0.04), coll, fresa, n=5)
    clay.lathe('crema', [(0.0, 0.2), (0.09, 0.2), (0.07, 0.24), (0.04, 0.27), (0.0, 0.3)], coll, mat('crema', '#FFFDF5', 0.4), segments=24)
    clay.blob('fresa arriba', (0, 0, 0.31), (0.035, 0.035, 0.04), coll, fresa, n=5)
    clay.blob('hojita fresa', (0, 0, 0.35), (0.025, 0.025, 0.008), coll, mat('hojita', '#5FA85A', 0.5), n=4)


def comida_brownie(coll):
    z = plato(coll, 0.17, '#FFF1F4')
    clay.rbox('brownie', (0, 0, z + 0.04), (0.1, 0.08, 0.04), coll, mat('brownie', '#4A2A1C', 0.6, noise=dict(scale=40, strength=0.3)), p=6, n=5)
    for k, (x, y) in enumerate(((-0.05, -0.02), (0.03, 0.03), (0.06, -0.04))):
        clay.blob(f'nuez {k}', (x, y, z + 0.085), (0.018, 0.014, 0.01), coll, mat('nuez', '#B98559', 0.5), n=4)
    clay.blob('helado', (0.0, 0.0, z + 0.12), (0.06, 0.06, 0.05), coll, mat('helado vainilla', '#FFF3D6', 0.5), n=6)


def comida_dona(coll):
    m = masa('dona', '#D99A55')
    clay.lathe('dona', [(0.04, 0.03), (0.07, 0.0), (0.13, 0.01), (0.15, 0.04), (0.13, 0.075), (0.07, 0.08), (0.04, 0.05)], coll, m, segments=36,
               cap_bottom=False, cap_top=False)
    clay.lathe('glaseado', [(0.045, 0.06), (0.07, 0.083), (0.13, 0.078), (0.148, 0.055), (0.14, 0.05)], coll, mat('glaseado rosa', '#F39AB0', 0.3, coat=0.5),
               segments=36, cap_bottom=False, cap_top=False)
    rng = np.random.default_rng(2)
    for k in range(18):
        a = rng.uniform(0, 2 * math.pi)
        r = rng.uniform(0.06, 0.13)
        col = ('#FFFFFF', '#8FD6B9', '#F7C948', '#8EC5F0')[k % 4]
        o = clay.blob(f'grajea {k}', (math.cos(a) * r, math.sin(a) * r, 0.085), (0.012, 0.004, 0.004), coll, laca(f'grajea {col}', col, 0.3), n=3, subsurf=0)
        o.rotation_euler = (0, 0, rng.uniform(0, math.pi))


def comida_cupcake(coll):
    clay.lathe('capacillo', [(0.0, 0.0), (0.07, 0.0), (0.095, 0.1), (0.0, 0.1)], coll, papel('capacillo', '#8FD6B9'), segments=20, cap_top=False)
    clay.lathe('ponqué', [(0.0, 0.08), (0.1, 0.1), (0.09, 0.13), (0.0, 0.14)], coll, masa('ponqué', '#E5B06A'), segments=28)
    crema = mat('crema cupcake', '#F7C6D2', 0.4)
    for k in range(3):
        r = 0.09 - k * 0.025
        clay.lathe(f'remolino {k}', [(0.0, 0.12 + k * 0.05), (r, 0.12 + k * 0.05), (r * 0.9, 0.17 + k * 0.05), (0.0, 0.18 + k * 0.05)], coll, crema, segments=24)
    clay.blob('cereza', (0, 0, 0.29), (0.03, 0.03, 0.03), coll, mat('cereza', '#D62839', 0.2, coat=0.6), n=5)
    chispas(coll, (0, 0), 0.07, 0.2, n=10)


def comida_flan(coll):
    z = plato(coll, 0.17)
    clay.lathe('flan', [(0.0, z), (0.11, z), (0.085, z + 0.1), (0.0, z + 0.1)], coll, mat('flan', '#F5C96A', 0.25, coat=0.5, sss=0.2), segments=32)
    clay.lathe('caramelo', [(0.0, z + 0.1), (0.086, z + 0.1), (0.09, z + 0.095), (0.0, z + 0.105)], coll, mat('caramelo', '#9C4A16', 0.15, coat=0.7),
               segments=32)
    clay.blob('charco caramelo', (0, 0, z + 0.004), (0.14, 0.14, 0.006), coll, mat('caramelo', '#9C4A16', 0.15, coat=0.7), n=6)


def comida_galletas_corazon(coll):
    z = plato(coll, 0.18, '#FFF1F4')
    m = masa('galleta', '#E8B06A')
    glas = mat('glaseado rojo', '#E4566B', 0.3, coat=0.4)
    for k, (x, y, r) in enumerate(((-0.07, -0.02, 0.2), (0.07, 0.0, -0.2), (0.0, 0.07, 0.1))):
        o = corazon_plano(f'galleta {k}', (0, 0, 0), 0.5, coll, m, grosor=0.2, eje='z')
        o.location = (x, y, z + 0.015)
        o.rotation_euler = (0, 0, r)
        g = corazon_plano(f'glaseado {k}', (0, 0, 0), 0.4, coll, glas, grosor=0.1, eje='z')
        g.location = (x, y, z + 0.028)
        g.rotation_euler = (0, 0, r)


# ---------------------------------------------------------------------------
# Bebidas y frutas
# ---------------------------------------------------------------------------

def taza(coll, color='#F6F2EA', h=0.14, r=0.075):
    loza = laca(f'taza {color}', color, 0.3)
    clay.lathe('taza', [(0.0, 0.0), (r * 0.85, 0.0), (r, h), (r * 0.9, h), (r * 0.78, 0.02), (0.0, 0.02)], coll, loza, segments=32, cap_top=False)
    clay.sweep('oreja taza', [(r * 0.95, 0, h * 0.8), (r + 0.05, 0, h * 0.7), (r + 0.05, 0, h * 0.3), (r * 0.9, 0, h * 0.25)], 0.013, (1, 1), coll, loza,
               segments=8, samples=4)
    return h


def comida_chocolate(coll):
    h = taza(coll, '#E4566B')
    clay.lathe('chocolate', [(0.0, h * 0.85), (0.068, h * 0.85)], coll, mat('chocolate caliente', '#5A2E1C', 0.25, coat=0.4), segments=28, cap_bottom=False)
    for k, (x, y) in enumerate(((-0.02, 0.01), (0.025, -0.01), (0.0, 0.035))):
        clay.rbox(f'masmelo {k}', (x, y, h * 0.9), (0.018, 0.018, 0.016), coll, mat('masmelo', '#FFF4F7', 0.6), p=4, n=4)
    clay.rbox('queso', (0.12, -0.06, 0.02), (0.035, 0.03, 0.02), coll, mat('queso campesino', '#FBF6E6', 0.6), p=5, n=4)


def comida_te(coll):
    clay.lathe('platico', [(0.0, 0.0), (0.12, 0.0), (0.13, 0.015), (0.0, 0.01)], coll, laca('platico', '#F6F2EA', 0.3), segments=32)
    h = taza(coll, '#C9E7DA', 0.11, 0.07)
    clay.lathe('té', [(0.0, h * 0.8), (0.062, h * 0.8)], coll, mat('té', '#B8742E', 0.15, coat=0.6), segments=28, cap_bottom=False)
    clay.sweep('hilo té', [(0.04, 0.0, h * 0.8), (0.08, -0.02, h + 0.02), (0.1, -0.05, h - 0.04)], 0.003, (1, 1), coll, papel('hilo', '#FFFFFF'),
               segments=4, samples=3)
    clay.rbox('etiqueta té', (0.1, -0.055, h - 0.07), (0.018, 0.004, 0.022), coll, papel('etiqueta', '#F7C948'), p=6, n=3)


def comida_limonada(coll):
    h = vaso(coll, 0.07, 0.24, '#F2F0A0', 0.85)
    clay.lathe('rodaja limón', [(0.0, 0.0), (0.045, 0.0), (0.045, 0.012), (0.0, 0.012)], coll, mat('rodaja limón', '#C5E063', 0.3), segments=20).location = (0.06, 0, 0.23)
    ctx_hielo = transparente('hielo', '#EAF6FB', 0.6)
    for k in range(3):
        clay.rbox(f'hielo {k}', (-0.02 + k * 0.02, 0.01 * k, h - 0.02), (0.02, 0.02, 0.02), coll, ctx_hielo, p=5, n=3)
    pitillo(coll, (0.0, 0.02, 0.05), (0.04, 0.04, 0.34), '#8FD6B9')


def comida_malteada(coll):
    h = vaso(coll, 0.08, 0.26, '#F7B6C9', 0.9)
    clay.lathe('crema malteada', [(0.0, h), (0.085, h), (0.06, h + 0.05), (0.03, h + 0.08), (0.0, h + 0.1)], coll, mat('crema', '#FFFDF5', 0.4), segments=24)
    clay.blob('cereza malteada', (0, 0, h + 0.12), (0.03, 0.03, 0.03), coll, mat('cereza', '#D62839', 0.2, coat=0.6), n=5)
    pitillo(coll, (0.01, 0.02, 0.06), (0.06, 0.05, h + 0.2), '#F39AB0')
    chispas(coll, (0, 0), 0.05, h + 0.07, n=10)


def comida_palomitas(coll):
    rayas = papel('caja palomitas', '#FFFFFF')
    clay.lathe('caja palomitas', [(0.0, 0.0), (0.08, 0.0), (0.11, 0.22), (0.0, 0.22)], coll, rayas, segments=8, cap_top=False)
    for k in range(4):
        a = 2 * math.pi * k / 4 + math.pi / 8
        clay.sweep(f'raya palomitas {k}', [(math.cos(a) * 0.078, math.sin(a) * 0.078, 0.005), (math.cos(a) * 0.106, math.sin(a) * 0.106, 0.215)], 0.03,
                   (1, 0.12), coll, papel('raya roja', '#E4566B'), segments=6, samples=2, caps=('flat', 'flat'), up=(math.cos(a), math.sin(a), 0))
    rng = np.random.default_rng(7)
    for k in range(26):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0, 0.09)
        clay.blob(f'palomita {k}', (math.cos(a) * r, math.sin(a) * r, 0.23 + rng.uniform(0, 0.07)), (0.028, 0.026, 0.024), coll, mat('palomita', '#FFF3CF', 0.6),
                  n=4, shaper=lambda v: v * (1 + 0.25 * np.sin(v[:, 0:1] * 90) * np.sin(v[:, 2:3] * 90)))


def comida_sandia(coll):
    """Tajada de sandía parada: media luna con corteza, franja blanca y pepas."""
    corta = lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], 0.0)])
    clay.blob('corteza sandía', (0, 0, 0), (0.2, 0.04, 0.2), coll, mat('sandía corteza', '#3F9D4A', 0.4, coat=0.3), n=10, shaper=corta)
    clay.blob('blanco sandía', (0, -0.004, 0.0), (0.186, 0.044, 0.186), coll, mat('sandía blanco', '#F4F1D8', 0.4), n=10, shaper=corta)
    clay.blob('tajada sandía', (0, -0.008, 0.0), (0.172, 0.048, 0.172), coll, mat('sandía', '#F2545B', 0.35, coat=0.3), n=10, shaper=corta)
    for k, (x, z) in enumerate(((-0.08, 0.06), (-0.03, 0.1), (0.03, 0.11), (0.08, 0.07), (0.0, 0.05), (-0.05, 0.03), (0.05, 0.03))):
        clay.blob(f'pepa {k}', (x, -0.055, z), (0.009, 0.004, 0.013), coll, mat('pepa', '#2B2422', 0.3), n=3)


def comida_ensalada_frutas(coll):
    h = tazon(coll, 0.14, 0.1, '#FFFFFF', '#F39AB0')
    rng = np.random.default_rng(9)
    cols = ['#E43D4F', '#F7C948', '#8FD6B9', '#F28C45', '#B7D65A', '#A05BB8']
    for k in range(18):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0, 0.1)
        col = cols[k % len(cols)]
        clay.rbox(f'fruta {k}', (math.cos(a) * r, math.sin(a) * r, h * 0.85 + rng.uniform(0, 0.03)), (0.02, 0.02, 0.02), coll, mat(f'fruta {col}', col, 0.35,
                                                                                                                               coat=0.3), p=4, n=3)
    clay.blob('crema frutas', (0, 0, h + 0.03), (0.06, 0.06, 0.03), coll, mat('crema', '#FFFDF5', 0.4), n=6)
    clay.rbox('queso rallado', (0.01, 0.01, h + 0.06), (0.03, 0.03, 0.006), coll, mat('queso', '#F9E7A6', 0.4), p=4, n=3)


# ---------------------------------------------------------------------------
# Platos de chef (solo salen de la cocina de chef): más grandes y más adornados que los de la tienda
# ---------------------------------------------------------------------------

def wafle_redondo(coll, z, r=0.13, h=0.035, color='#D9963F', nombre='wafle'):
    """Un wafle belga redondo con su cuadrícula levantada encima; devuelve la altura de arriba."""
    clay.lathe(nombre, [(0.0, z), (r * 0.96, z), (r, z + h * 0.3), (r, z + h * 0.8), (r * 0.95, z + h), (0.0, z + h)], coll,
               masa(f'{nombre} {color}', color), segments=36)
    rejilla = masa(f'rejilla {color}', clay_aclarar(color, 0.18))
    paso = 2 * r / 5
    for i in range(1, 5):
        c = -r + paso * i
        largo = math.sqrt(max(0.0, r * r - c * c)) * 0.94
        clay.rbox(f'{nombre} barra x {i}', (c, 0, z + h + 0.004), (0.006, largo, 0.006), coll, rejilla, p=4, n=2)
        clay.rbox(f'{nombre} barra y {i}', (0, c, z + h + 0.004), (largo, 0.006, 0.006), coll, rejilla, p=4, n=2)
    return z + h + 0.008


def clay_aclarar(color, t):
    c = [int(color[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(v + (255 - v) * t):02X}' for v in c)


def chantilly_espiral(coll, centro, r, z, pisos=4, color='#FFFDF5', nombre='chantilly'):
    """Crema de manga: anillos que se van cerrando hacia arriba con su puntica."""
    crema = mat(f'{nombre} {color}', color, 0.4)
    for k in range(pisos):
        rk = r * (1 - k / (pisos + 0.6))
        clay.blob(f'{nombre} {k}', (centro[0], centro[1], z + k * r * 0.42), (rk, rk, r * 0.34), coll, crema, n=6)
    clay.blob(f'{nombre} punta', (centro[0] + r * 0.06, centro[1], z + pisos * r * 0.42 + r * 0.08), (r * 0.18, r * 0.18, r * 0.28), coll, crema, n=4)
    return z + pisos * r * 0.42 + r * 0.3


def chorrito(coll, puntos, color, nombre='salsa', r=0.006):
    clay.sweep(nombre, puntos, r, (1, 0.6), coll, mat(f'{nombre} {color}', color, 0.2, coat=0.7), segments=6, samples=6)


def media_fresa(coll, c, rot, nombre):
    fresa = mat('fresa chef', '#E23A4E', 0.35, coat=0.4)
    o = clay.blob(nombre, c, (0.022, 0.012, 0.03), coll, fresa, n=5)
    o.rotation_euler = (0.3, 0, rot)
    clay.blob(f'{nombre} corazón', (c[0], c[1], c[2] + 0.012), (0.015, 0.004, 0.02), coll, mat('fresa por dentro', '#FFC9CF', 0.4), n=4).rotation_euler = (0.3, 0, rot)


def comida_wafle_chef(coll):
    z = plato(coll, 0.2, '#FFFFFF')
    z = wafle_redondo(coll, z, 0.14, 0.036, '#D48C38', 'wafle abajo')
    z = wafle_redondo(coll, z, 0.13, 0.036, '#DB9A45', 'wafle arriba')
    # Mantequilla derritiéndose, fresas alrededor, una bola de helado y crema
    clay.rbox('mantequilla', (0.0, 0.0, z + 0.012), (0.028, 0.024, 0.012), coll, mat('mantequilla', '#FBE37A', 0.3, coat=0.5), p=6, n=4)
    for k in range(5):
        a = 2 * math.pi * k / 5 + 0.3
        media_fresa(coll, (math.cos(a) * 0.085, math.sin(a) * 0.085, z + 0.015), a, f'fresa wafle {k}')
    clay.blob('helado wafle', (0.03, -0.02, z + 0.045), (0.042, 0.042, 0.038), coll, mat('helado vainilla', '#FFF2CC', 0.45), n=6)
    chantilly_espiral(coll, (-0.035, 0.03), 0.03, z + 0.01, 3, nombre='crema wafle')
    for k in range(3):
        clay.blob(f'arándano {k}', (-0.07 + k * 0.03, -0.07, z + 0.015), (0.011, 0.011, 0.011), coll, mat('arándano', '#3A4AA8', 0.3, coat=0.4), n=4)
    # Miel en zigzag
    pts = []
    for k in range(9):
        t = k / 8
        pts.append((-0.1 + t * 0.2, (0.06 if k % 2 else -0.06) * (1 - abs(t - 0.5)), z + 0.03))
    chorrito(coll, pts, '#E9A21F', 'miel')
    clay.blob('menta wafle', (0.03, -0.02, z + 0.088), (0.02, 0.008, 0.012), coll, mat('menta', '#4FAE4A', 0.5), n=4)


def comida_fresas_chef(coll):
    vidrio = transparente('vaso fresas', '#FFEFF3', 0.3)
    clay.lathe('vaso fresas', [(0.0, 0.0), (0.075, 0.0), (0.105, 0.24), (0.1, 0.24), (0.07, 0.012), (0.0, 0.012)], coll, vidrio, segments=32, cap_top=False)
    clay.lathe('borde vaso fresas', [(0.1, 0.235), (0.11, 0.24), (0.1, 0.245)], coll, laca('borde fresas', '#E2475D', 0.3), segments=32, cap_top=False,
               cap_bottom=False)
    crema = mat('crema fresas', '#FFFBF3', 0.45)
    rng = np.random.default_rng(4)
    # Capas: fresas picadas y crema
    for capa, (z0, n) in enumerate([(0.03, 6), (0.1, 7), (0.17, 8)]):
        for k in range(n):
            a = rng.uniform(0, 2 * math.pi)
            r = rng.uniform(0.02, 0.06 + z0 * 0.12)
            media_fresa(coll, (math.cos(a) * r, math.sin(a) * r, z0 + rng.uniform(0, 0.02)), a, f'fresa capa {capa} {k}')
        clay.lathe(f'crema capa {capa}', [(0.0, z0 + 0.03), (0.075 + z0 * 0.12, z0 + 0.03), (0.078 + z0 * 0.12, z0 + 0.05), (0.0, z0 + 0.05)], coll, crema,
                   segments=24)
    z = chantilly_espiral(coll, (0, 0), 0.07, 0.24, 3, nombre='crema fresas')
    fresa = mat('fresa chef', '#E23A4E', 0.35, coat=0.4)
    clay.blob('fresa entera', (0.0, 0.0, z + 0.02), (0.028, 0.028, 0.036), coll, fresa, n=5)
    clay.blob('hojas fresa', (0.0, 0.0, z + 0.056), (0.022, 0.022, 0.006), coll, mat('hojita', '#5FA85A', 0.5), n=4)
    for k in range(10):
        a = rng.uniform(0, 2 * math.pi)
        o = clay.rbox(f'queso {k}', (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.3 + rng.uniform(0, 0.02)), (0.012, 0.003, 0.003), coll,
                      mat('queso rallado', '#F9E08A', 0.4), p=3, n=2)
        o.rotation_euler = (0, 0, a)
    chorrito(coll, [(-0.06, 0.02, 0.29), (-0.02, -0.03, 0.31), (0.02, 0.03, 0.31), (0.06, -0.02, 0.29)], '#F2DFB0', 'leche condensada')
    o = clay.rbox('barquillo', (0.022, 0.0, 0.345), (0.008, 0.008, 0.06), coll, mat('barquillo', '#E0A860', 0.5), p=5, n=3)
    o.rotation_euler = (0, 0.3, 0)


def comida_frape_chef(coll):
    vidrio = transparente('vaso frappé', '#EAF6FB', 0.3)
    clay.lathe('vaso frappé', [(0.0, 0.0), (0.055, 0.0), (0.08, 0.3), (0.075, 0.3), (0.05, 0.012), (0.0, 0.012)], coll, vidrio, segments=32, cap_top=False)
    clay.lathe('frappé', [(0.0, 0.012), (0.05, 0.012), (0.074, 0.28), (0.0, 0.28)], coll, mat('frappé café', '#8A5536', 0.5, noise=dict(scale=20, strength=0.15)),
               segments=32)
    z = chantilly_espiral(coll, (0, 0), 0.07, 0.29, 4, nombre='crema frappé')
    pts = []
    for k in range(10):
        a = k * 1.3
        pts.append((math.cos(a) * 0.05 * (1 - k / 14), math.sin(a) * 0.05 * (1 - k / 14), 0.31 + k * 0.009))
    chorrito(coll, pts, '#C9822E', 'caramelo')
    clay.blob('cereza frappé', (0.0, 0.0, z + 0.02), (0.022, 0.022, 0.022), coll, mat('cereza', '#D62839', 0.2, coat=0.6), n=5)
    clay.sweep('palito cereza', [(0.0, 0.0, z + 0.04), (0.01, 0.0, z + 0.07)], 0.003, (1, 1), coll, mat('palito', '#4B7A2A', 0.5), segments=6, samples=2)
    chispas(coll, (0, 0), 0.05, 0.33, n=12, semilla=7)
    pitillo(coll, (0.01, 0.02, 0.05), (0.05, 0.05, 0.46), '#E8434F')


PIEZAS = {
    'comida_empanada': comida_empanada, 'comida_bunuelos': comida_bunuelos, 'comida_pandebono': comida_pandebono,
    'comida_arepa_queso': comida_arepa_queso, 'comida_bandeja_paisa': comida_bandeja_paisa, 'comida_ajiaco': comida_ajiaco,
    'comida_tamal': comida_tamal, 'comida_obleas': comida_obleas, 'comida_cholado': comida_cholado, 'comida_mango_biche': comida_mango_biche,
    'comida_mazorca': comida_mazorca, 'comida_churros': comida_churros, 'comida_arroz_leche': comida_arroz_leche,
    'comida_perro': comida_perro, 'comida_hamburguesa': comida_hamburguesa, 'comida_salchipapa': comida_salchipapa, 'comida_sushi': comida_sushi,
    'comida_tacos': comida_tacos, 'comida_fresas_crema': comida_fresas_crema, 'comida_brownie': comida_brownie, 'comida_dona': comida_dona,
    'comida_cupcake': comida_cupcake, 'comida_flan': comida_flan, 'comida_galletas_corazon': comida_galletas_corazon,
    'comida_chocolate': comida_chocolate, 'comida_te': comida_te, 'comida_limonada': comida_limonada, 'comida_malteada': comida_malteada,
    'comida_palomitas': comida_palomitas, 'comida_sandia': comida_sandia, 'comida_ensalada_frutas': comida_ensalada_frutas,
    'comida_wafle_chef': comida_wafle_chef, 'comida_fresas_chef': comida_fresas_chef, 'comida_frape_chef': comida_frape_chef,
}
