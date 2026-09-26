"""Productos del supermercado en estilo plastilina.

Cada producto se construye en su propia colección (origen en la base, frente hacia -Y)
para poder instanciarlo muchas veces en vitrinas y tiendas sin duplicar geometría.
Escala: los personajes miden ~2.5 unidades; los productos son un poco grandes a
propósito, como juguetes, para que se lean bien en la vista del juego.
"""
import math

import bpy
import numpy as np

import clay

_MATS = {}


def mat(key):
    if not _MATS:
        M = clay.material
        soft = dict(rough=0.55, sss=0.12, sss_scale=0.03)
        fz = lambda c: dict(scale=150, color=c, amount=0.35, strength=0.2, distance=0.002)
        _MATS.update({
            'rojo manzana': M('Prod | rojo manzana', '#D8343A', **soft, noise=dict(scale=12, strength=0.05, distance=0.01)),
            'verde hoja': M('Prod | verde hoja', '#57A548', **soft),
            'cafe tallo': M('Prod | cafe tallo', '#6B4A2F', rough=0.7),
            'amarillo banano': M('Prod | amarillo banano', '#F4CF3C', **soft),
            'naranja': M('Prod | naranja', '#F58A1F', rough=0.6, sss=0.1, noise=dict(scale=90, strength=0.25, distance=0.003)),
            'pina': M('Prod | pina', '#E0A032', rough=0.6, wave=dict(scale=9, strength=0.6, axis='Z', distortion=0.0, rotation=(0.6, 0, 0.8))),
            'uva': M('Prod | uva', '#6E3F8F', rough=0.35, sss=0.2, coat=0.3),
            'tomate': M('Prod | tomate', '#E23B2E', rough=0.35, sss=0.15, coat=0.3),
            'brocoli': M('Prod | brocoli', '#3E8E41', rough=0.8, noise=dict(scale=45, strength=0.6, distance=0.01)),
            'zanahoria': M('Prod | zanahoria', '#F2842A', rough=0.6, ribs=dict(scale=18, strength=0.3, axis='Z')),
            'blanco': M('Prod | blanco carton', '#F7F4EE', rough=0.6),
            'azul': M('Prod | azul etiqueta', '#3E8FD8', rough=0.6),
            'celeste': M('Prod | celeste', '#9BD3F0', rough=0.5),
            'queso': M('Prod | queso', '#F6C84C', rough=0.6, sss=0.15),
            'rosa': M('Prod | rosa etiqueta', '#F2A0B8', rough=0.6),
            'aluminio': M('Prod | aluminio', '#C9CDD2', rough=0.3, metallic=0.8),
            'huevo': M('Prod | huevo', '#F3E2C8', rough=0.5, sss=0.1),
            'carton gris': M('Prod | carton huevos', '#CFC7B8', rough=0.9, noise=dict(scale=60, strength=0.2, distance=0.004)),
            'pollo': M('Prod | pollo dorado', '#D98B3A', rough=0.45, coat=0.4, noise=dict(scale=25, strength=0.2, distance=0.006)),
            'bandeja': M('Prod | bandeja', '#F2EEE6', rough=0.4),
            'pescado': M('Prod | pescado', '#8FB3C9', rough=0.3, coat=0.5),
            'pescado vientre': M('Prod | pescado vientre', '#E7EEF2', rough=0.3, coat=0.5),
            'salchicha': M('Prod | salchicha', '#C0573F', rough=0.4, coat=0.3),
            'pan': M('Prod | pan', '#D69A55', rough=0.7, noise=dict(scale=30, strength=0.2, distance=0.006)),
            'pan claro': M('Prod | pan corte', '#F1D3A0', rough=0.8),
            'torta': M('Prod | torta', '#F7E9E1', rough=0.5),
            'fresa': M('Prod | fresa', '#E2344A', rough=0.35, coat=0.3),
            'chocolate': M('Prod | chocolate', '#6B3E2A', rough=0.4),
            'amarillo': M('Prod | amarillo empaque', '#F7D24A', rough=0.55),
            'rojo': M('Prod | rojo empaque', '#E14B4B', rough=0.55),
            'verde': M('Prod | verde empaque', '#5DBB7A', rough=0.55),
            'morado': M('Prod | morado empaque', '#8C6BC8', rough=0.55),
            'naranja empaque': M('Prod | naranja empaque', '#F59B3A', rough=0.55),
            'crema': M('Prod | crema empaque', '#FFF3DA', rough=0.55),
            'agua': M('Prod | agua', '#9ED8F2', rough=0.15, coat=0.6, sss=0.3),
            'tapa': M('Prod | tapa', '#3B6FB5', rough=0.4),
            'helado': M('Prod | helado fresa', '#F7B4C6', rough=0.6, sss=0.2),
            'helado vainilla': M('Prod | helado vainilla', '#FBEFD2', rough=0.6, sss=0.2),
            'galleta': M('Prod | galleta', '#C98E4E', rough=0.8, noise=dict(scale=40, strength=0.3, distance=0.004)),
            'cafe': M('Prod | cafe bebida', '#5A3825', rough=0.3),
            'queso pizza': M('Prod | queso pizza', '#F8D46A', rough=0.5, sss=0.2),
            'salsa': M('Prod | salsa', '#D8472F', rough=0.4),
            'caja carton': M('Prod | caja carton', '#D9A96B', rough=0.85, fuzz=fz('#E8C08A')),
            'cinta': M('Prod | cinta', '#C28D52', rough=0.6),
            'pan tostado': M('Prod | pan tostado', '#B8773A', rough=0.55, coat=0.25, noise=dict(scale=30, strength=0.25, distance=0.006)),
            'pan brillo': M('Prod | pan brillo', '#D99545', rough=0.4, coat=0.5, noise=dict(scale=30, strength=0.15, distance=0.004)),
            'harina': M('Prod | harina', '#FBF6EC', rough=0.9),
            'pan corte': M('Prod | pan corte dorado', '#EDBE72', rough=0.7),
            'filete': M('Prod | filete', '#C8453F', rough=0.45, coat=0.3),
            'grasa': M('Prod | grasa', '#F6E3D0', rough=0.5),
            'grasa oscura': M('Prod | borde filete', '#8E2A26', rough=0.5),
            'filete claro': M('Prod | vetas filete', '#F2A3A0', rough=0.5),
            'wafle': M('Prod | wafle', '#E3A955', rough=0.55, sss=0.1, noise=dict(scale=40, strength=0.15, distance=0.004)),
            'wafle oscuro': M('Prod | wafle hueco', '#B8762F', rough=0.6),
            'crema batida': M('Prod | crema batida', '#FFFBF2', rough=0.5, sss=0.2),
            'miel': M('Prod | miel', '#D98A1F', rough=0.15, coat=0.8, sss=0.3),
            'arepa': M('Prod | arepa', '#EBC47C', rough=0.75, noise=dict(scale=35, strength=0.3, distance=0.004)),
            'arepa tostado': M('Prod | arepa tostada', '#9C642C', rough=0.7),
            'queso blanco': M('Prod | queso blanco', '#FBF7EE', rough=0.55, sss=0.15),
            'mantequilla': M('Prod | mantequilla', '#F9DC6E', rough=0.35, coat=0.4),
        })
    return _MATS[key]


def _coll(name):
    root = clay.collection('Productos')
    c = bpy.data.collections.get(f'Producto | {name}')
    if c is None:
        c = bpy.data.collections.new(f'Producto | {name}')
        root.children.link(c)
    return c


# --------------------------------------------------------------------------
# Frutas y verduras
# --------------------------------------------------------------------------

def manzana(c):
    clay.blob('manzana', (0, 0, 0.09), (0.1, 0.1, 0.09), c, mat('rojo manzana'), n=10,
              shaper=lambda v: v * np.stack([1 - 0.08 * (v[:, 2] < 0), 1 - 0.08 * (v[:, 2] < 0), np.ones(len(v))], 1))
    clay.sweep('tallo', [(0, 0, 0.16), (0.005, 0, 0.2), (0.015, 0, 0.23)], 0.008, (1, 1), c, mat('cafe tallo'), segments=6, samples=3)
    clay.sweep('hoja', [(0.01, 0, 0.21), (0.05, 0.0, 0.235), (0.09, 0, 0.22)], [0.005, 0.025, 0.002], (0.25, 1), c, mat('verde hoja'),
               segments=8, samples=4, caps=('round', 'point'), up=(0, 0, 1))


def banano(c):
    for k, (dx, rot) in enumerate(((-0.03, -0.25), (0.0, 0.0), (0.03, 0.25))):
        pts = []
        for t in np.linspace(0, 1, 5):
            a = -0.9 + 1.8 * t
            pts.append((dx + math.sin(rot) * 0.2 * (t - 0.5), 0.25 * math.sin(a) * 0.9, 0.05 + 0.12 * (1 - math.cos(a)) + k * 0.012))
        clay.sweep(f'banano {k}', pts, [0.012, 0.032, 0.036, 0.03, 0.01], (1, 0.9), c, mat('amarillo banano'), segments=6, samples=5)
        clay.blob(f'punta {k}', pts[-1], (0.012, 0.012, 0.012), c, mat('cafe tallo'), n=4)


def naranja(c):
    clay.blob('naranja', (0, 0, 0.1), (0.1, 0.1, 0.095), c, mat('naranja'), n=10)
    clay.blob('botón', (0, 0, 0.195), (0.018, 0.018, 0.008), c, mat('verde hoja'), n=4)


def pina(c):
    clay.blob('piña', (0, 0, 0.16), (0.1, 0.1, 0.16), c, mat('pina'), n=10)
    for k in range(9):
        a = 2 * math.pi * k / 9
        h = 0.14 + 0.05 * (k % 2)
        clay.sweep(f'corona {k}', [(0, 0, 0.3), (math.cos(a) * 0.03, math.sin(a) * 0.03, 0.3 + h * 0.5), (math.cos(a) * 0.06, math.sin(a) * 0.06, 0.3 + h)],
                   [0.02, 0.018, 0.002], (0.3, 1), c, mat('verde hoja'), segments=6, samples=4, caps=('round', 'point'),
                   up=(math.cos(a + 1.57), math.sin(a + 1.57), 0))


def uvas(c):
    rng = np.random.default_rng(3)
    k = 0
    for row, (z, n, r) in enumerate(((0.2, 5, 0.085), (0.15, 5, 0.07), (0.1, 4, 0.05), (0.055, 2, 0.028), (0.25, 3, 0.05))):
        for i in range(n):
            a = 2 * math.pi * i / n + row
            clay.blob(f'uva {k}', (math.cos(a) * r, math.sin(a) * r, z), (0.033, 0.033, 0.035), c, mat('uva'), n=6)
            k += 1
    clay.sweep('rama', [(0, 0, 0.26), (0.01, 0, 0.3), (0.03, 0, 0.32)], 0.008, (1, 1), c, mat('cafe tallo'), segments=6, samples=3)


def tomate(c):
    clay.blob('tomate', (0, 0, 0.08), (0.1, 0.1, 0.08), c, mat('tomate'), n=10)
    for k in range(5):
        a = 2 * math.pi * k / 5
        clay.sweep(f'cáliz {k}', [(0, 0, 0.162), (math.cos(a) * 0.045, math.sin(a) * 0.045, 0.158)], [0.012, 0.002], (0.4, 1), c, mat('verde hoja'),
                   segments=6, samples=3, caps=('round', 'point'), up=(0, 0, 1))


def brocoli(c):
    clay.sweep('tronco', [(0, 0, 0.0), (0, 0, 0.12)], [0.035, 0.045], (1, 1), c, mat('verde hoja'), segments=10, samples=3, caps=('flat', 'round'))
    for k, (x, y, z, r) in enumerate(((0, 0, 0.19, 0.075), (0.07, 0, 0.16, 0.058), (-0.07, 0.01, 0.16, 0.058), (0.02, 0.065, 0.16, 0.055),
                                      (-0.02, -0.065, 0.16, 0.055))):
        clay.blob(f'florete {k}', (x, y, z), (r, r, r * 0.85), c, mat('brocoli'), n=8)


def zanahoria(c):
    clay.sweep('zanahoria', [(0, 0, 0.26), (0.0, 0, 0.14), (0.0, 0, 0.0)], [0.045, 0.035, 0.004], (1, 1), c, mat('zanahoria'), segments=12, samples=5,
               caps=('round', 'point'))
    for k in range(4):
        a = 2 * math.pi * k / 4
        clay.sweep(f'hojas {k}', [(0, 0, 0.26), (math.cos(a) * 0.03, math.sin(a) * 0.03, 0.34), (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.4)],
                   [0.012, 0.01, 0.002], (0.4, 1), c, mat('verde hoja'), segments=6, samples=3, caps=('round', 'point'))


# --------------------------------------------------------------------------
# Lácteos y refrigerados
# --------------------------------------------------------------------------

def leche(c):
    clay.rbox('cartón', (0, 0, 0.15), (0.07, 0.07, 0.15), c, mat('blanco'), p=7)
    clay.rbox('etiqueta', (0, -0.001, 0.13), (0.072, 0.072, 0.06), c, mat('azul'), p=7)
    # techo a dos aguas
    verts = [(-0.068, -0.068, 0.29), (0.068, -0.068, 0.29), (0.068, 0.068, 0.29), (-0.068, 0.068, 0.29), (-0.068, 0, 0.37), (0.068, 0, 0.37)]
    faces = [(0, 1, 5, 4), (3, 4, 5, 2), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    o = clay.make_mesh_object('techo', verts, faces, c, smooth=False, material=mat('blanco'))
    clay.add_bevel(o, 0.01, 2)
    clay.rbox('cresta', (0, 0, 0.375), (0.07, 0.01, 0.015), c, mat('blanco'), p=6)
    clay.blob('gota', (0, -0.073, 0.14), (0.03, 0.006, 0.035), c, mat('blanco'), n=5)


def queso(c):
    verts = [(-0.12, -0.08, 0), (0.12, -0.08, 0), (0.12, 0.08, 0), (-0.12, 0.08, 0), (-0.12, -0.08, 0.12), (-0.12, 0.08, 0.12)]
    faces = [(0, 1, 2, 3), (0, 4, 1), (3, 2, 5), (0, 3, 5, 4), (1, 4, 5, 2)]
    o = clay.make_mesh_object('cuña', verts, faces, c, smooth=False, material=mat('queso'))
    clay.add_bevel(o, 0.015, 3)
    for k, (x, y, z, r) in enumerate(((-0.05, -0.081, 0.05, 0.018), (0.03, -0.081, 0.03, 0.013), (-0.08, -0.081, 0.09, 0.012), (-0.121, 0.02, 0.06, 0.02))):
        clay.blob(f'hueco {k}', (x, y, z), (r, 0.006, r), c, mat('naranja empaque'), n=4)


def yogur(c):
    clay.lathe('vaso', [(0.055, 0), (0.065, 0.14), (0.07, 0.15)], c, mat('rosa'), segments=24)
    clay.lathe('tapa', [(0.072, 0.148), (0.072, 0.158)], c, mat('aluminio'), segments=24)
    clay.blob('fresa etiqueta', (0, -0.062, 0.07), (0.025, 0.006, 0.028), c, mat('fresa'), n=5)


def huevos(c):
    clay.rbox('cartón', (0, 0, 0.035), (0.14, 0.1, 0.035), c, mat('carton gris'), p=5)
    k = 0
    for i in range(3):
        for j in range(2):
            clay.blob(f'huevo {k}', (-0.09 + i * 0.09, -0.045 + j * 0.09, 0.09), (0.035, 0.035, 0.045), c, mat('huevo'), n=6)
            k += 1


def pollo(c):
    clay.rbox('bandeja', (0, 0, 0.015), (0.16, 0.12, 0.015), c, mat('bandeja'), p=4)
    clay.blob('cuerpo', (0, 0, 0.085), (0.12, 0.09, 0.07), c, mat('pollo'), n=8)
    for sx in (-1, 1):
        clay.sweep(f'muslo {sx}', [(sx * 0.06, -0.05, 0.08), (sx * 0.1, -0.1, 0.07), (sx * 0.11, -0.13, 0.06)], [0.05, 0.04, 0.02], (1, 1), c, mat('pollo'),
                   segments=8, samples=4)
        clay.blob(f'hueso {sx}', (sx * 0.112, -0.14, 0.06), (0.016, 0.016, 0.016), c, mat('bandeja'), n=4)


def pescado(c):
    clay.rbox('bandeja', (0, 0, 0.012), (0.18, 0.08, 0.012), c, mat('bandeja'), p=4)
    pts = [(-0.14, 0, 0.05), (-0.05, 0, 0.055), (0.05, 0, 0.05), (0.12, 0, 0.045)]
    clay.sweep('pescado', pts, [0.03, 0.05, 0.04, 0.012], (1.0, 0.55), c, mat('pescado'), segments=12, samples=5, up=(0, 0, 1))
    clay.sweep('cola', [(0.12, 0, 0.045), (0.17, 0, 0.05)], [0.01, 0.04], (1, 0.15), c, mat('pescado'), segments=8, samples=3, up=(0, 0, 1), caps=('round', 'flat'))
    clay.blob('ojo', (-0.12, -0.024, 0.06), (0.008, 0.004, 0.008), c, mat('chocolate'), n=4)


def salchichas(c):
    for k in range(3):
        clay.sweep(f'salchicha {k}', [(-0.12 + k * 0.012, -0.03 + k * 0.03, 0.03 + k * 0.012), (0.0, -0.035 + k * 0.03, 0.035 + k * 0.012),
                                      (0.12 - k * 0.012, -0.03 + k * 0.03, 0.03 + k * 0.012)],
                   0.028, (1, 1), c, mat('salchicha'), segments=10, samples=4)


# --------------------------------------------------------------------------
# Panadería
# --------------------------------------------------------------------------

def pan(c):
    """Hogaza: miga dorada, corteza tostada encima, cortes abiertos y harina espolvoreada."""
    flat = lambda v: np.where(v[:, 2:3] < 0, v * np.array([1, 1, 0.4]), v)
    clay.blob('pan', (0, 0, 0.03), (0.17, 0.08, 0.07), c, mat('pan'), n=10, shaper=flat)
    clay.blob('corteza', (0, 0, 0.036), (0.162, 0.074, 0.072), c, mat('pan tostado'), n=10, shaper=flat)
    top = lambda x, y: 0.036 + 0.072 * math.sqrt(max(0.0, 1 - (x / 0.162) ** 2 - (y / 0.074) ** 2))
    for k in range(4):
        x0 = -0.105 + k * 0.07
        pts = [(x0 - 0.022 + t * 0.044, -0.045 + t * 0.09) for t in (0.0, 0.5, 1.0)]
        clay.sweep(f'corte {k}', [(x, y, top(x, y) + 0.003) for x, y in pts], [0.007, 0.012, 0.007], (0.5, 1), c, mat('pan corte'),
                   segments=6, samples=3, up=(0, 0, 1))
    rng = np.random.default_rng(3)
    for k in range(8):
        x, y = rng.uniform(-0.12, 0.12), rng.uniform(-0.045, 0.045)
        clay.blob(f'harina {k}', (x, y, top(x, y) + 0.001), (0.005, 0.005, 0.0015), c, mat('harina'), n=3)


def croissant(c):
    """Medialuna: rollos atravesados a lo largo de una curva, más gordos al centro y con puntas."""
    Rc, n = 0.1, 7
    for k in range(n):
        t = -1.15 + 2.3 * k / (n - 1)
        f = 1 - 0.6 * (t / 1.15) ** 2
        x, y = Rc * math.sin(t), -Rc * math.cos(t) + Rc * 0.55
        o = clay.blob(f'rollo {k}', (0, 0, 0), (0.024 + 0.012 * f, 0.034 + 0.03 * f, 0.026 + 0.03 * f), c,
                      mat('pan brillo' if k % 2 == 0 else 'pan tostado'), n=8)
        o.location = (x, y, 0.026 + 0.028 * f)
        o.rotation_euler = (0, 0, t)
    for sgn in (-1, 1):
        t = sgn * 1.45
        o = clay.blob('punta', (0, 0, 0), (0.03, 0.016, 0.014), c, mat('pan brillo'), n=6)
        o.location = (Rc * math.sin(t), -Rc * math.cos(t) + Rc * 0.55, 0.016)
        o.rotation_euler = (0, 0, t)


def wafle(c):
    """Wafle en plato: cuadrícula de huecos, crema, fresas y miel."""
    clay.lathe('plato', [(0.0, 0.0), (0.15, 0.0), (0.16, 0.012), (0.15, 0.016), (0.0, 0.014)], c, mat('bandeja'), segments=32)
    clay.rbox('wafle', (0, 0, 0.04), (0.105, 0.105, 0.022), c, mat('wafle'), p=4)
    for i in range(4):
        for j in range(4):
            clay.rbox(f'hueco {i}{j}', (-0.075 + i * 0.05, -0.075 + j * 0.05, 0.059), (0.017, 0.017, 0.005), c, mat('wafle oscuro'), p=4, n=4)
    for k, r in enumerate((0.035, 0.026, 0.016)):
        clay.blob(f'crema {k}', (0.045, 0.04, 0.07 + k * 0.022), (r, r, r * 0.7), c, mat('crema batida'), n=6)
    for k, (x, y) in enumerate(((-0.05, 0.05), (0.06, -0.045))):
        clay.blob(f'fresa {k}', (x, y, 0.078), (0.022, 0.018, 0.02), c, mat('fresa'), n=6)
        clay.blob(f'hojita fresa {k}', (x - 0.018, y, 0.08), (0.006, 0.014, 0.006), c, mat('verde hoja'), n=4)
    clay.sweep('miel', [(-0.08, -0.06, 0.066), (-0.03, -0.02, 0.068), (-0.06, 0.02, 0.068), (0.0, 0.05, 0.068), (0.05, -0.01, 0.068)], 0.007,
               (0.5, 1), c, mat('miel'), segments=6, samples=5, up=(0, 0, 1))


def arepa(c):
    """Arepa asada: disco dorado con marcas cruzadas de parrilla, puntos tostados y mantequilla derritiéndose."""
    clay.lathe('arepa', [(0.0, 0.0), (0.1, 0.0), (0.108, 0.018), (0.1, 0.036), (0.0, 0.039)], c, mat('arepa'), segments=32)
    for d in (1, -1):
        for k in range(3):
            # Recta a 45° desplazada; se recorta al círculo de radio 0.082
            o = (k - 1) * 0.04
            h = math.sqrt(max(0.0, 0.082 ** 2 - o ** 2))
            u, v = np.array([1.0, d * 1.0]) / math.sqrt(2), np.array([-d * 1.0, 1.0]) / math.sqrt(2)
            a, b = v * o - u * h, v * o + u * h
            clay.sweep(f'marca {d} {k}', [(a[0], a[1], 0.0395), (b[0], b[1], 0.0395)], 0.0055, (0.25, 1), c, mat('arepa tostado'),
                       segments=6, samples=2, up=(0, 0, 1))
    rng = np.random.default_rng(5)
    for k in range(8):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0.02, 0.085)
        clay.blob(f'tostado {k}', (r * math.cos(a), r * math.sin(a), 0.038), (0.012, 0.009, 0.003), c, mat('arepa tostado'), n=3)
    clay.rbox('mantequilla', (0.01, -0.005, 0.047), (0.026, 0.022, 0.009), c, mat('mantequilla'), p=3.5)
    clay.blob('mantequilla derretida', (0.016, -0.012, 0.041), (0.04, 0.034, 0.003), c, mat('mantequilla'), n=5)


def torta(c):
    clay.lathe('base', [(0.16, 0), (0.165, 0.005), (0.165, 0.13), (0.16, 0.135)], c, mat('torta'), segments=32)
    clay.lathe('plato', [(0.2, -0.005), (0.21, 0.0), (0.2, 0.01)], c, mat('bandeja'), segments=32)
    for k in range(10):
        a = 2 * math.pi * k / 10
        clay.sweep(f'gota {k}', [(math.cos(a) * 0.162, math.sin(a) * 0.162, 0.135), (math.cos(a) * 0.168, math.sin(a) * 0.168, 0.09 + 0.02 * (k % 2))],
                   [0.02, 0.012], (1, 1), c, mat('rosa'), segments=8, samples=3)
    clay.lathe('glaseado', [(0.163, 0.13), (0.16, 0.145), (0.0, 0.148)], c, mat('rosa'), segments=32)
    for k in range(6):
        a = 2 * math.pi * k / 6
        clay.blob(f'fresa {k}', (math.cos(a) * 0.11, math.sin(a) * 0.11, 0.165), (0.022, 0.022, 0.026), c, mat('fresa'), n=5)
    # corazón de aniversario
    clay.blob('corazón izq', (-0.018, 0, 0.2), (0.025, 0.012, 0.025), c, mat('fresa'), n=5)
    clay.blob('corazón der', (0.018, 0, 0.2), (0.025, 0.012, 0.025), c, mat('fresa'), n=5)
    clay.sweep('corazón punta', [(-0.03, 0, 0.19), (0, 0, 0.158), (0.03, 0, 0.19)], [0.018, 0.006, 0.018], (0.5, 1), c, mat('fresa'),
               segments=6, samples=3, up=(0, -1, 0))


# --------------------------------------------------------------------------
# Abarrotes, bebidas, congelados y snacks
# --------------------------------------------------------------------------

def cereal(c):
    clay.rbox('caja', (0, 0, 0.19), (0.12, 0.045, 0.19), c, mat('amarillo'), p=8)
    clay.blob('tazón', (0, -0.046, 0.12), (0.07, 0.006, 0.05), c, mat('azul'), n=5)
    for k, (x, z) in enumerate(((-0.03, 0.18), (0.02, 0.2), (0.05, 0.17))):
        clay.blob(f'aro {k}', (x, -0.05, z), (0.018, 0.006, 0.018), c, mat('naranja empaque'), n=4)
    clay.rbox('franja', (0, -0.001, 0.32), (0.122, 0.046, 0.035), c, mat('rojo'), p=8)


def enlatado(c):
    clay.lathe('lata', [(0.06, 0), (0.065, 0.008), (0.065, 0.14), (0.06, 0.148)], c, mat('aluminio'), segments=24)
    clay.lathe('etiqueta', [(0.067, 0.025), (0.067, 0.123)], c, mat('verde'), segments=24, cap_bottom=False, cap_top=False)


def arroz(c):
    clay.rbox('bolsa', (0, 0, 0.12), (0.1, 0.05, 0.12), c, mat('crema'), p=3.2)
    clay.rbox('etiqueta', (0, -0.035, 0.12), (0.07, 0.02, 0.05), c, mat('verde'), p=4)


def gaseosa(c):
    prof = [(0.05, 0), (0.055, 0.02), (0.055, 0.17), (0.045, 0.22), (0.022, 0.26), (0.02, 0.28)]
    clay.lathe('botella', prof, c, mat('rojo'), segments=24)
    clay.lathe('etiqueta', [(0.058, 0.07), (0.058, 0.15)], c, mat('crema'), segments=24, cap_bottom=False, cap_top=False)
    clay.lathe('tapa', [(0.024, 0.275), (0.024, 0.305)], c, mat('crema'), segments=16)


def jugo(c):
    clay.rbox('caja', (0, 0, 0.12), (0.06, 0.04, 0.12), c, mat('naranja empaque'), p=7)
    clay.blob('naranja etiqueta', (0, -0.042, 0.11), (0.035, 0.006, 0.035), c, mat('naranja'), n=5)
    clay.sweep('pitillo', [(0.03, 0, 0.23), (0.035, 0, 0.3), (0.05, 0, 0.32)], 0.007, (1, 1), c, mat('blanco'), segments=6, samples=3)


def agua(c):
    prof = [(0.045, 0), (0.05, 0.02), (0.05, 0.2), (0.035, 0.25), (0.018, 0.27), (0.018, 0.28)]
    clay.lathe('botella', prof, c, mat('agua'), segments=24)
    clay.lathe('etiqueta', [(0.053, 0.08), (0.053, 0.14)], c, mat('azul'), segments=24, cap_bottom=False, cap_top=False)
    clay.lathe('tapa', [(0.021, 0.275), (0.021, 0.3)], c, mat('tapa'), segments=16)


def helado(c):
    clay.lathe('pote', [(0.075, 0), (0.09, 0.12)], c, mat('crema'), segments=28, cap_top=False)
    clay.lathe('tapa', [(0.092, 0.115), (0.095, 0.13), (0.0, 0.135)], c, mat('rosa'), segments=28)
    clay.blob('bola', (0, -0.085, 0.06), (0.03, 0.008, 0.03), c, mat('helado'), n=5)


def papitas(c):
    clay.rbox('bolsa', (0, 0, 0.13), (0.1, 0.04, 0.13), c, mat('amarillo'), p=3.0)
    clay.rbox('sello', (0, 0, 0.255), (0.1, 0.035, 0.012), c, mat('rojo'), p=6)
    for k, (x, z) in enumerate(((-0.03, 0.12), (0.03, 0.13))):
        clay.blob(f'papa {k}', (x, -0.038, z), (0.03, 0.006, 0.022), c, mat('naranja empaque'), n=4)


def galletas(c):
    for k in range(4):
        clay.lathe(f'galleta {k}', [(0.06, k * 0.022), (0.065, k * 0.022 + 0.01), (0.06, k * 0.022 + 0.02)], c, mat('galleta'), segments=20)
        for j in range(3):
            a = 2 * math.pi * j / 3 + k
            clay.blob(f'chip {k}{j}', (math.cos(a) * 0.035, math.sin(a) * 0.035, k * 0.022 + 0.021), (0.01, 0.01, 0.005), c, mat('chocolate'), n=3)


# --------------------------------------------------------------------------
# Preparados en la tienda
# --------------------------------------------------------------------------

def malteada(c):
    clay.lathe('vaso', [(0.045, 0), (0.06, 0.2)], c, mat('agua'), segments=24, cap_top=False)
    clay.lathe('batido', [(0.044, 0.005), (0.057, 0.18)], c, mat('helado'), segments=24)
    clay.blob('crema', (0, 0, 0.2), (0.058, 0.058, 0.04), c, mat('helado vainilla'), n=8)
    clay.blob('cereza', (0, 0, 0.25), (0.02, 0.02, 0.02), c, mat('fresa'), n=5)
    clay.sweep('pitillo', [(0.02, 0, 0.1), (0.03, 0, 0.3), (0.06, 0, 0.33)], 0.008, (1, 1), c, mat('rojo'), segments=6, samples=3)


def cafe(c):
    clay.lathe('vaso', [(0.045, 0), (0.058, 0.16)], c, mat('crema'), segments=24, cap_top=False)
    clay.lathe('manga', [(0.052, 0.05), (0.056, 0.11)], c, mat('caja carton'), segments=24, cap_bottom=False, cap_top=False)
    clay.lathe('tapa', [(0.06, 0.155), (0.06, 0.17), (0.035, 0.18), (0.0, 0.18)], c, mat('chocolate'), segments=24)


def pizza(c):
    clay.lathe('masa', [(0.18, 0), (0.19, 0.012), (0.185, 0.025), (0.16, 0.028), (0.0, 0.028)], c, mat('pan'), segments=36)
    clay.lathe('queso', [(0.16, 0.027), (0.0, 0.032)], c, mat('queso pizza'), segments=36)
    rng = np.random.default_rng(5)
    for k in range(7):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0.04, 0.12)
        clay.blob(f'pepperoni {k}', (math.cos(a) * r, math.sin(a) * r, 0.036), (0.025, 0.025, 0.006), c, mat('salsa'), n=4)


def _icono(c, kind, y, z):
    """Ícono en relieve (plano XZ, mirando a -Y) para el frente de las cajas."""
    b = lambda n, cx, cz, r, mk, dy=0.0: clay.blob(n, (cx, y - dy, cz), r, c, mat(mk), n=5)
    if kind == 'filete':
        f = lambda v: v * (1 + 0.18 * np.sin(np.arctan2(v[:, 2], v[:, 0]) * 2 + 0.6))[:, None]
        clay.blob('filete borde', (0.0, y, z), (0.07, 0.008, 0.05), c, mat('grasa oscura'), n=6, shaper=f)
        clay.blob('filete', (-0.002, y - 0.004, z - 0.002), (0.062, 0.011, 0.043), c, mat('filete'), n=6, shaper=f)
        clay.blob('hueso', (0.03, y - 0.012, z + 0.012), (0.015, 0.008, 0.015), c, mat('blanco'), n=5)
        for k, (dx, dz) in enumerate(((-0.03, 0.008), (-0.008, -0.018), (0.012, 0.02))):
            clay.sweep(f'vetas {k}', [(dx - 0.014, y - 0.015, z + dz), (dx + 0.014, y - 0.015, z + dz + 0.008)], 0.004, (1, 0.5), c,
                       mat('filete claro'), segments=5, samples=2, up=(0, -1, 0))
    elif kind == 'pan':
        b('pan', 0.0, z, (0.07, 0.011, 0.036), 'pan')
        b('corteza', 0.0, z + 0.006, (0.066, 0.012, 0.03), 'pan tostado', 0.002)
        for k in range(3):
            x0 = -0.035 + k * 0.035
            clay.sweep(f'corte {k}', [(x0 - 0.008, y - 0.016, z - 0.012), (x0 + 0.008, y - 0.016, z + 0.018)], 0.005, (1, 0.5), c, mat('pan claro'),
                       segments=5, samples=2, up=(0, -1, 0))
    elif kind == 'leche':
        b('botella', 0.0, z - 0.008, (0.03, 0.01, 0.042), 'blanco')
        b('cuello', 0.0, z + 0.04, (0.016, 0.009, 0.014), 'blanco')
        b('tapa', 0.0, z + 0.055, (0.017, 0.01, 0.007), 'azul', 0.002)
        b('etiqueta', 0.0, z - 0.012, (0.031, 0.008, 0.013), 'azul', 0.004)
    elif kind == 'manzana':
        b('manzana', 0.0, z - 0.005, (0.045, 0.012, 0.042), 'rojo manzana')
        clay.sweep('tallo', [(0.0, y - 0.01, z + 0.03), (0.004, y - 0.01, z + 0.05)], 0.004, (1, 1), c, mat('cafe tallo'), segments=5, samples=2)
        b('hoja', 0.018, z + 0.045, (0.017, 0.007, 0.008), 'verde hoja', 0.004)
    elif kind == 'lata':
        clay.rbox('lata', (0.0, y, z), (0.032, 0.01, 0.042), c, mat('naranja empaque'), p=3, n=5)
        for dz in (-0.042, 0.042):
            clay.rbox('borde lata', (0.0, y - 0.002, z + dz), (0.033, 0.01, 0.006), c, mat('aluminio'), p=3, n=4)
        b('logo lata', 0.0, z, (0.016, 0.006, 0.016), 'blanco', 0.008)
    elif kind == 'botella':
        b('botella', 0.0, z - 0.012, (0.026, 0.01, 0.04), 'agua')
        b('hombro', 0.0, z + 0.024, (0.018, 0.009, 0.014), 'agua')
        b('tapa', 0.0, z + 0.045, (0.01, 0.009, 0.008), 'rojo', 0.002)
        b('etiqueta', 0.0, z - 0.01, (0.027, 0.007, 0.012), 'rojo', 0.004)
    elif kind == 'copo':
        for k in range(3):
            a = k * math.pi / 3
            dx, dz = 0.048 * math.cos(a), 0.048 * math.sin(a)
            clay.sweep(f'brazo {k}', [(-dx, y - 0.006, z - dz), (dx, y - 0.006, z + dz)], 0.006, (1, 1), c, mat('blanco'), segments=6, samples=2)
            for sgn in (-1, 1):
                ex, ez = sgn * dx * 0.62, sgn * dz * 0.62
                for t in (-1, 1):
                    bx = ex + sgn * 0.016 * math.cos(a + t * 0.9)
                    bz = ez + sgn * 0.016 * math.sin(a + t * 0.9)
                    clay.sweep(f'rama {k}', [(ex, y - 0.006, z + ez), (bx, y - 0.006, z + bz)], 0.004, (1, 1), c, mat('blanco'), segments=5, samples=2)
    elif kind == 'wafle':
        clay.rbox('wafle', (0.0, y, z), (0.045, 0.01, 0.045), c, mat('wafle'), p=4, n=5)
        for i in range(3):
            for j in range(3):
                clay.rbox('hueco', (-0.028 + i * 0.028, y - 0.008, z - 0.028 + j * 0.028), (0.01, 0.006, 0.01), c, mat('wafle oscuro'), p=4, n=4)
    elif kind == 'arepa':
        b('arepa', 0.0, z, (0.047, 0.01, 0.047), 'arepa')
        for k in range(3):
            o = (k - 1) * 0.02
            h = 0.026 - abs(o) * 0.45
            clay.sweep(f'marca {k}', [(-h + o, y - 0.011, z - h - o), (h + o, y - 0.011, z + h - o)], 0.004, (1, 0.5), c,
                       mat('arepa tostado'), segments=5, samples=2, up=(0, -1, 0))


def caja(c, color='rojo', icon=None):
    """Caja de reposición del almacén: cinta, placa del color de su sección y el ícono de lo que trae."""
    clay.rbox('caja', (0, 0, 0.14), (0.2, 0.15, 0.14), c, mat('caja carton'), p=8)
    clay.rbox('cinta', (0, 0, 0.28), (0.035, 0.152, 0.005), c, mat('cinta'), p=8)
    clay.rbox('placa', (0, -0.151, 0.14), (0.125, 0.006, 0.1), c, mat(color), p=5, n=5)
    clay.rbox('placa clara', (0, -0.156, 0.14), (0.108, 0.005, 0.083), c, mat('crema'), p=5, n=5)
    if icon:
        before = set(c.objects)
        _icono(c, icon, -0.168, 0.14)
        for o in c.objects:
            if o not in before:
                for v in o.data.vertices:
                    v.co.x *= 1.35
                    v.co.z = 0.14 + (v.co.z - 0.14) * 1.35
    else:
        clay.blob('etiqueta', (0, -0.161, 0.14), (0.05, 0.004, 0.04), c, mat(color), n=5)


CATALOGO = [
    ('manzana', manzana), ('banano', banano), ('naranja', naranja), ('pina', pina), ('uvas', uvas),
    ('tomate', tomate), ('brocoli', brocoli), ('zanahoria', zanahoria),
    ('leche', leche), ('queso', queso), ('yogur', yogur), ('huevos', huevos),
    ('pollo', pollo), ('pescado', pescado), ('salchichas', salchichas),
    ('pan', pan), ('croissant', croissant), ('torta', torta),
    ('cereal', cereal), ('enlatado', enlatado), ('arroz', arroz),
    ('gaseosa', gaseosa), ('jugo', jugo), ('agua', agua),
    ('helado', helado), ('papitas', papitas), ('galletas', galletas),
    ('malteada', malteada), ('cafe', cafe), ('pizza', pizza), ('wafle', wafle), ('arepa', arepa),
]
CAJAS = [('caja frutas', 'verde', 'manzana'), ('caja lacteos', 'azul', 'leche'), ('caja carnes', 'rojo', 'filete'),
         ('caja panaderia', 'amarillo', 'pan'), ('caja abarrotes', 'naranja empaque', 'lata'), ('caja bebidas', 'celeste', 'botella'),
         ('caja congelados', 'morado', 'copo'), ('caja wafles', 'rosa', 'wafle'), ('caja arepas', 'pan tostado', 'arepa')]


def build_all():
    """Construye todos los productos, cada uno en su colección (oculta para instanciar)."""
    out = {}
    for name, fn in CATALOGO:
        c = _coll(name)
        fn(c)
        out[name] = c
    for name, color, icon in CAJAS:
        c = _coll(name)
        caja(c, color, icon)
        out[name] = c
    return out


def instance(name, location, rotation_z=0.0, scale=1.0, coll=None):
    """Crea una copia instanciada de un producto (liviana)."""
    src = bpy.data.collections[f'Producto | {name}']
    e = bpy.data.objects.new(f'{name} (inst)', None)
    e.instance_type = 'COLLECTION'
    e.instance_collection = src
    e.location = location
    e.rotation_euler = (0, 0, rotation_z)
    e.scale = (scale, scale, scale)
    clay.link(e, coll)
    return e
