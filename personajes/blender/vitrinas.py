"""Vitrinas y muebles del supermercado, cada uno en 3 niveles de mejora.

Nivel 1: sencillo y pequeño (poca capacidad).
Nivel 2: más grande y ordenado (más capacidad, más atractivo).
Nivel 3: de lujo, iluminado y con letrero (máxima capacidad y paciencia extra).

Todas las piezas se construyen en el origen: base en z=0, frente hacia -Y.
Escala de referencia: los personajes miden ~2.5 unidades.
"""
import math

import numpy as np

import clay
import productos as prod

_M = {}


def m(key):
    if not _M:
        M = clay.material
        _M.update({
            'madera': M('Mueble | madera clara', '#E0B487', rough=0.7, wave=dict(scale=3, strength=0.15, axis='X', distortion=6, rotation=(0, 0, 0.1))),
            'madera oscura': M('Mueble | madera oscura', '#B07A4F', rough=0.7, wave=dict(scale=3, strength=0.15, axis='X', distortion=6)),
            'menta': M('Mueble | menta', '#86CDBA', rough=0.45, coat=0.2),
            'blanco': M('Mueble | blanco esmalte', '#F6F2EA', rough=0.4, coat=0.2),
            'acero': M('Mueble | acero', '#C5CBD2', rough=0.3, metallic=0.7),
            'amarillo': M('Mueble | amarillo mantequilla', '#F5CF5F', rough=0.5, coat=0.15),
            'celeste': M('Mueble | celeste', '#86C3EC', rough=0.45, coat=0.2),
            'coral': M('Mueble | coral', '#EE7A68', rough=0.45, coat=0.2),
            'rosa': M('Mueble | rosa', '#F3A9BA', rough=0.5),
            'lila': M('Mueble | lila', '#B9A2E3', rough=0.5),
            'negro': M('Mueble | negro goma', '#2A2929', rough=0.6),
            'vidrio': M('Mueble | vidrio', '#CFE6F0', rough=0.05, alpha=0.07),
            'luz': M('Mueble | luz calida', '#FFF4DA', rough=0.5, emission='#FFF0CF', emission_strength=4.0),
            'luz fria': M('Mueble | luz fria', '#EAF8FF', rough=0.5, emission='#E4F6FF', emission_strength=1.6),
            'hielo': M('Mueble | hielo', '#DDF1F8', rough=0.25, sss=0.3, coat=0.4),
            'pizarra': M('Mueble | pizarra', '#3D4A44', rough=0.8),
            'tiza': M('Mueble | tiza', '#F3F1EA', rough=0.9),
            'mimbre': M('Mueble | mimbre', '#D2A15F', rough=0.8, wave=dict(scale=14, strength=0.5, axis='Z', distortion=1.5)),
            'toldo rojo': M('Mueble | toldo rojo', '#E8615A', rough=0.7),
            'pantalla': M('Mueble | pantalla', '#7FD3F5', rough=0.2, emission='#9FE0FF', emission_strength=1.5),
            'luz roja': M('Mueble | luz roja', '#FF6B5E', rough=0.4, emission='#FF5A4A', emission_strength=2.5),
            'crema tecla': M('Mueble | tecla crema', '#F4EBDC', rough=0.45),
            'azul bandera': M('Mueble | azul bandera', '#2E5AAC', rough=0.5, coat=0.15),
            'rojo bandera': M('Mueble | rojo bandera', '#D8343A', rough=0.5, coat=0.15),
            'brasa': M('Mueble | brasa', '#FF7A3D', rough=0.6, emission='#FF5A1F', emission_strength=1.8),
            'chocolate': M('Mueble | chocolate', '#6B3E2A', rough=0.3, coat=0.4),
        })
    return _M[key]


def box(name, c, half, coll, mk, p=8.0, n=6):
    return clay.rbox(name, c, half, coll, m(mk), p=p, n=n)


def fill_row(coll, name, x0, x1, y, z, count, scale=1.0, rot=0.0, jitter=0.0, rng=None):
    rng = rng or np.random.default_rng(1)
    for i in range(count):
        t = 0.5 if count == 1 else i / (count - 1)
        x = x0 + (x1 - x0) * t + (rng.uniform(-jitter, jitter) if jitter else 0)
        prod.instance(name, (x, y, z), rot + (rng.uniform(-0.3, 0.3) if jitter else 0), scale, coll)


def fill_grid(coll, name, x0, x1, y0, y1, z, nx, ny, scale=1.0, jitter=0.02, seed=1):
    rng = np.random.default_rng(seed)
    for j in range(ny):
        y = y0 + (y1 - y0) * (0.5 if ny == 1 else j / (ny - 1))
        fill_row(coll, name, x0, x1, y, z, nx, scale, 0.0, jitter, rng)


def cabinet(coll, W, D, H, body, inner='blanco', t=0.035, light=True, y0=0.05):
    """Gabinete hueco (fondo, costados, techo y piso) para neveras y enfriadores."""
    box('fondo', (0, y0 + D - t, H / 2), (W, t, H / 2), coll, body, p=8)
    box('panel interior', (0, y0 + D - 2 * t - 0.005, H / 2), (W - t * 2, 0.006, H / 2 - t * 2), coll, inner, p=8)
    for sx in (-1, 1):
        box('costado', (sx * (W - t), y0, H / 2), (t, D, H / 2), coll, body, p=8)
    box('techo', (0, y0, H - t), (W, D, t), coll, body, p=8)
    box('piso', (0, y0, 0.08), (W, D, 0.08), coll, body, p=8)
    if light:
        box('luz interior', (0, y0 - 0.05, H - 2 * t - 0.01), (W - 0.1, D - 0.1, 0.008), coll, 'luz fria', p=6)


def chest(coll, W, D, H, body, floor_z):
    """Baúl hueco (congeladores): paredes, piso de hielo a floor_z y borde superior."""
    t = 0.04
    for sx in (-1, 1):
        box('pared', (sx * (W - t), 0, H / 2), (t, D, H / 2), coll, body, p=8)
    for sy in (-1, 1):
        box('pared', (0, sy * (D - t), H / 2), (W, t, H / 2), coll, body, p=8)
    box('cuerpo bajo', (0, 0, floor_z / 2), (W, D, floor_z / 2), coll, body, p=8)
    box('hielo', (0, 0, floor_z), (W - t * 2, D - t * 2, 0.02), coll, 'hielo', p=8)


def price_tags(coll, x0, x1, y, z, n, color):
    for i in range(n):
        x = x0 + (x1 - x0) * (0.5 if n == 1 else i / (n - 1))
        box('etiqueta precio', (x, y, z), (0.05, 0.006, 0.025), coll, color, p=5, n=4)


def sign(coll, text_color, center, half, mk='coral', dots=3):
    """Letrero de plastilina: placa redondeada con puntitos decorativos."""
    box('letrero', center, half, coll, mk, p=4, n=6)
    for i in range(dots):
        x = center[0] + (i - (dots - 1) / 2) * half[0] * 0.5
        clay.blob('adorno letrero', (x, center[1] - half[1] - 0.004, center[2]), (half[2] * 0.3, 0.006, half[2] * 0.3), coll, m(text_color), n=4)


# --------------------------------------------------------------------------
# Estante de abarrotes
# --------------------------------------------------------------------------

def estante(level, coll):
    if level == 1:
        W, H, D = 0.62, 1.0, 0.24
        for sx in (-1, 1):
            box('lateral', (sx * W, 0, H / 2), (0.035, D, H / 2), coll, 'madera', p=10)
        box('fondo', (0, D - 0.02, H / 2), (W, 0.02, H / 2), coll, 'madera oscura', p=10)
        for z in (0.04, 0.5, 0.96):
            box('repisa', (0, 0, z), (W, D, 0.03), coll, 'madera', p=10)
        fill_row(coll, 'cereal', -0.45, 0.45, 0.02, 0.53, 4, 0.8)
        fill_row(coll, 'enlatado', -0.48, 0.48, -0.05, 0.07, 6, 0.9)
    elif level == 2:
        W, H, D = 0.72, 1.45, 0.3
        box('base', (0, 0, 0.07), (W, D, 0.07), coll, 'blanco', p=8)
        box('panel', (0, D - 0.03, H / 2 + 0.07), (W, 0.03, H / 2), coll, 'menta', p=10)
        for sx in (-1, 1):
            box('costado', (sx * W, 0, H / 2 + 0.07), (0.03, D, H / 2), coll, 'menta', p=10)
        for i, z in enumerate((0.15, 0.6, 1.05)):
            box('repisa', (0, -0.02, z), (W - 0.02, D - 0.03, 0.022), coll, 'acero', p=10)
            price_tags(coll, -0.55, 0.55, -D - 0.005, z - 0.005, 4, 'amarillo')
        fill_row(coll, 'enlatado', -0.58, 0.58, -0.05, 0.172, 7, 0.95)
        fill_row(coll, 'arroz', -0.52, 0.52, -0.05, 0.622, 5, 0.9)
        fill_row(coll, 'cereal', -0.5, 0.5, 0.0, 1.072, 4, 0.8)
        sign(coll, 'blanco', (0, D - 0.03, H + 0.2), (0.5, 0.04, 0.1), 'coral')
    else:
        W, H, D = 0.85, 1.8, 0.34
        box('base', (0, 0, 0.08), (W, D, 0.08), coll, 'madera oscura', p=8)
        box('panel', (0, D - 0.03, H / 2 + 0.08), (W, 0.03, H / 2), coll, 'blanco', p=10)
        for sx in (-1, 1):
            box('costado', (sx * W, 0, H / 2 + 0.08), (0.035, D, H / 2), coll, 'madera', p=10)
        for z in (0.17, 0.58, 0.99, 1.4):
            box('repisa', (0, -0.02, z), (W - 0.02, D - 0.03, 0.022), coll, 'madera', p=10)
            box('luz repisa', (0, D - 0.08, z + 0.35), (W - 0.06, 0.01, 0.008), coll, 'luz', p=6)
            price_tags(coll, -0.65, 0.65, -D - 0.005, z - 0.005, 5, 'coral')
        fill_row(coll, 'enlatado', -0.7, 0.7, -0.08, 0.192, 9, 0.95)
        fill_row(coll, 'arroz', -0.66, 0.66, -0.06, 0.602, 6, 0.9)
        fill_row(coll, 'galletas', -0.66, 0.66, -0.08, 1.012, 7, 0.85)
        fill_row(coll, 'cereal', -0.62, 0.62, 0.0, 1.422, 5, 0.8)
        # Cabecera redondeada con luz y letrero
        box('cabecera', (0, D - 0.05, H + 0.2), (W + 0.04, 0.07, 0.14), coll, 'menta', p=4)
        box('tira de luz', (0, D - 0.125, H + 0.2), (W - 0.1, 0.008, 0.04), coll, 'luz', p=5)
        sign(coll, 'blanco', (0, D - 0.13, H + 0.2), (0.35, 0.02, 0.07), 'coral')


# --------------------------------------------------------------------------
# Frutas y verduras
# --------------------------------------------------------------------------

def guacal(coll, center, half, mk='madera', fruit=None, count=(3, 2), scale=1.0, tilt=0.0):
    cx, cy, cz = center
    hx, hy, hz = half
    box('fondo guacal', (cx, cy, cz + 0.02), (hx, hy, 0.02), coll, mk, p=10)
    for sx in (-1, 1):
        box('lado guacal', (cx + sx * hx, cy, cz + hz), (0.02, hy, hz), coll, mk, p=10)
    for sy in (-1, 1):
        for zz in (0.3, 0.75):
            box('tabla guacal', (cx, cy + sy * hy, cz + hz * 2 * zz), (hx, 0.018, hz * 0.28), coll, mk, p=10)
    if fruit:
        nx, ny = count
        fill_grid(coll, fruit, cx - hx * 0.7, cx + hx * 0.7, cy - hy * 0.6, cy + hy * 0.6, cz + hz * 0.9, nx, ny, scale, 0.015)
        fill_grid(coll, fruit, cx - hx * 0.5, cx + hx * 0.5, cy - hy * 0.3, cy + hy * 0.3, cz + hz * 0.9 + 0.1 * scale, max(nx - 1, 1), max(ny - 1, 1), scale, 0.015, seed=7)


def frutas(level, coll):
    if level == 1:
        for i, (x, f) in enumerate(((-0.5, 'manzana'), (0.0, 'naranja'), (0.5, 'tomate'))):
            guacal(coll, (x, 0, 0), (0.22, 0.17, 0.12), 'madera', f, (3, 2), 0.95)
    elif level == 2:
        box('base', (0, 0.05, 0.2), (0.78, 0.4, 0.2), coll, 'amarillo', p=6)
        for i, (x, f) in enumerate(((-0.4, 'manzana'), (0.4, 'naranja'))):
            guacal(coll, (x, -0.2, 0.4), (0.34, 0.18, 0.1), 'amarillo', f, (4, 2), 1.0)
        box('escalon', (0, 0.25, 0.55), (0.78, 0.2, 0.15), coll, 'amarillo', p=6)
        for i, (x, f) in enumerate(((-0.4, 'brocoli'), (0.4, 'tomate'))):
            guacal(coll, (x, 0.25, 0.7), (0.34, 0.16, 0.1), 'amarillo', f, (3, 2), 0.95)
        price_tags(coll, -0.6, 0.6, -0.4, 0.3, 2, 'coral')
    else:
        box('base', (0, 0.05, 0.22), (0.95, 0.46, 0.22), coll, 'madera', p=6)
        for i, (x, f) in enumerate(((-0.6, 'manzana'), (0.0, 'naranja'), (0.6, 'uvas'))):
            guacal(coll, (x, -0.24, 0.44), (0.27, 0.18, 0.1), 'madera', f, (3, 2), 0.95)
        box('escalon', (0, 0.26, 0.6), (0.95, 0.22, 0.16), coll, 'madera', p=6)
        for i, (x, f) in enumerate(((-0.6, 'brocoli'), (0.0, 'pina'), (0.6, 'zanahoria'))):
            guacal(coll, (x, 0.26, 0.76), (0.27, 0.17, 0.1), 'madera', f, (3 if f != 'pina' else 2, 2 if f != 'pina' else 1), 0.9)
        # Toldo de rayas y postes
        for sx in (-1, 1):
            clay.sweep('poste', [(sx * 0.95, 0.45, 0.0), (sx * 0.95, 0.45, 2.0)], 0.03, (1, 1), coll, m('madera oscura'), segments=10, samples=2)
        for k in range(8):
            x = -0.95 + k * 0.2714 + 0.1357
            box('franja toldo', (x, 0.05, 2.0), (0.136, 0.5, 0.025), coll, 'toldo rojo' if k % 2 == 0 else 'blanco', p=6, n=4)
            clay.blob('festón', (x, -0.45, 1.95), (0.13, 0.03, 0.07), coll, m('toldo rojo' if k % 2 == 0 else 'blanco'), n=5)
        # Pizarra de precios y bananos colgando
        box('pizarra', (-0.95, -0.3, 1.2), (0.03, 0.2, 0.26), coll, 'pizarra', p=6)
        for k in range(3):
            box('tiza', (-0.985, -0.3, 1.3 - k * 0.1), (0.004, 0.13, 0.012), coll, 'tiza', p=6, n=4)
        prod.instance('banano', (0.5, 0.35, 1.45), 0.0, 1.1, coll)
        prod.instance('banano', (0.2, 0.35, 1.5), 0.6, 1.1, coll)


# --------------------------------------------------------------------------
# Nevera de lácteos
# --------------------------------------------------------------------------

def nevera(level, coll):
    if level == 1:
        W, H, D = 0.42, 1.35, 0.35
        cabinet(coll, W, D, H, 'blanco', 'celeste')
        box('puerta vidrio', (0, -D + 0.07, 0.72), (W - 0.04, 0.012, 0.55), coll, 'vidrio', p=8)
        clay.sweep('manija', [(W - 0.08, -D + 0.02, 0.95), (W - 0.08, -D + 0.02, 0.55)], 0.018, (1, 1), coll, m('acero'), segments=8, samples=2)
        for z in (0.3, 0.72):
            box('repisa', (0, 0.02, z), (W - 0.08, D - 0.08, 0.012), coll, 'acero', p=10)
        fill_row(coll, 'leche', -0.22, 0.22, -0.05, 0.315, 3, 0.8)
        fill_row(coll, 'yogur', -0.24, 0.24, -0.05, 0.735, 4, 0.85)
        box('logo', (0, -D + 0.03, 1.2), (0.12, 0.006, 0.04), coll, 'coral', p=5)
    elif level == 2:
        W, H, D = 0.72, 1.75, 0.38
        cabinet(coll, W, D, H, 'acero', 'blanco')
        box('corona', (0, -D + 0.07, H - 0.05), (W, 0.02, 0.07), coll, 'celeste', p=6)
        for sx in (-1, 1):
            box('puerta vidrio', (sx * W / 2, -D + 0.07, 0.86), (W / 2 - 0.03, 0.012, 0.72), coll, 'vidrio', p=8)
            clay.sweep('manija', [(sx * 0.06, -D + 0.03, 1.1), (sx * 0.06, -D + 0.03, 0.7)], 0.02, (1, 1), coll, m('acero'), segments=8, samples=2)
        for i, z in enumerate((0.2, 0.62, 1.04, 1.4)):
            box('repisa', (0, 0.02, z), (W - 0.08, D - 0.08, 0.012), coll, 'acero', p=10)
        fill_row(coll, 'leche', -0.52, 0.52, -0.08, 0.215, 5, 0.85)
        fill_row(coll, 'yogur', -0.55, 0.55, -0.08, 0.635, 7, 0.9)
        fill_row(coll, 'queso', -0.45, 0.45, -0.05, 1.055, 3, 0.8)
        fill_row(coll, 'huevos', -0.35, 0.35, -0.05, 1.415, 3, 0.75)
    else:
        W, H, D = 0.9, 1.6, 0.48
        box('base', (0, 0.02, 0.18), (W, D, 0.18), coll, 'celeste', p=6)
        box('fondo', (0, D - 0.06, 0.85), (W, 0.06, 0.85), coll, 'celeste', p=8)
        for sx in (-1, 1):
            box('costado', (sx * W, 0.1, 0.85), (0.03, D - 0.08, 0.85), coll, 'blanco', p=8)
        steps = ((0.4, -0.2), (0.75, 0.0), (1.1, 0.18))
        names = (('leche', 6, 0.85), ('yogur', 8, 0.9), ('queso', 4, 0.8))
        for (z, y), (nm, cnt, sc) in zip(steps, names):
            box('repisa', (0, y, z), (W - 0.04, 0.16, 0.015), coll, 'acero', p=10)
            box('luz repisa', (0, y - 0.16, z - 0.03), (W - 0.06, 0.008, 0.01), coll, 'luz fria', p=6)
            fill_row(coll, nm, -W + 0.18, W - 0.18, y - 0.03, z + 0.015, cnt, sc)
        fill_row(coll, 'huevos', -0.55, 0.55, -0.3, 0.36, 3, 0.8)
        box('dosel', (0, 0.1, H + 0.08), (W + 0.04, D - 0.02, 0.08), coll, 'blanco', p=6)
        box('tira de luz', (0, -D + 0.1, H + 0.02), (W - 0.1, 0.01, 0.012), coll, 'luz fria', p=6)
        sign(coll, 'blanco', (0, -D + 0.08, H + 0.08), (0.4, 0.02, 0.06), 'celeste')


# --------------------------------------------------------------------------
# Vitrina refrigerada (carnes, pescado, quesos)
# --------------------------------------------------------------------------

def _curved_glass(coll, W, y0, z0, h, r=0.3, name='vidrio curvo'):
    pts = []
    for t in np.linspace(0, 1, 9):
        a = t * math.pi / 2
        pts.append((0, y0 + r * (1 - math.cos(a)) * 0.9 - r * 0.9, z0 + h * math.sin(a)))
    verts, faces = [], []
    for sx in (-1, 1):
        pass
    for i, (_, y, z) in enumerate(pts):
        verts.append((-W, y, z))
        verts.append((W, y, z))
    for i in range(len(pts) - 1):
        faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    o = clay.make_mesh_object(name, verts, faces, coll, material=m('vidrio'))
    clay.add_solidify(o, 0.012, 0.0)
    return o


def vitrina_refrigerada(level, coll):
    if level == 1:
        W = 0.5
        box('base', (0, 0, 0.35), (W, 0.32, 0.35), coll, 'celeste', p=6)
        box('franja', (0, -0.318, 0.55), (W - 0.06, 0.012, 0.035), coll, 'coral', p=6)
        box('bandeja', (0, -0.05, 0.72), (W - 0.04, 0.24, 0.02), coll, 'hielo', p=6)
        _curved_glass(coll, W - 0.02, -0.05, 0.72, 0.35, 0.28)
        box('techo', (0, 0.15, 1.06), (W, 0.14, 0.015), coll, 'acero', p=8)
        fill_row(coll, 'salchichas', -0.28, 0.28, -0.08, 0.74, 2, 0.9)
        fill_row(coll, 'queso', -0.28, 0.28, 0.12, 0.74, 2, 0.75)
    elif level == 2:
        W = 0.8
        box('base', (0, 0, 0.36), (W, 0.36, 0.36), coll, 'celeste', p=6)
        box('franja', (0, -0.358, 0.58), (W - 0.07, 0.012, 0.04), coll, 'coral', p=6)
        box('bandeja', (0, -0.05, 0.74), (W - 0.04, 0.28, 0.025), coll, 'hielo', p=6)
        _curved_glass(coll, W - 0.02, -0.08, 0.74, 0.4, 0.32)
        box('techo', (0, 0.16, 1.14), (W, 0.16, 0.015), coll, 'acero', p=8)
        box('luz', (0, 0.1, 1.12), (W - 0.1, 0.05, 0.008), coll, 'luz fria', p=6)
        fill_row(coll, 'pescado', -0.45, 0.45, -0.12, 0.765, 3, 0.85)
        fill_row(coll, 'pollo', -0.4, 0.4, 0.14, 0.765, 3, 0.75)
        price_tags(coll, -0.5, 0.5, -0.33, 0.8, 3, 'amarillo')
    else:
        W = 0.95
        box('base', (0, 0, 0.38), (W, 0.5, 0.38), coll, 'madera', p=6)
        box('zocalo', (0, 0, 0.05), (W + 0.02, 0.52, 0.05), coll, 'madera oscura', p=6)
        box('bandeja', (0, 0, 0.78), (W - 0.04, 0.44, 0.025), coll, 'hielo', p=6)
        _curved_glass(coll, W - 0.02, -0.14, 0.78, 0.42, 0.34, 'vidrio frente')
        g = _curved_glass(coll, W - 0.02, -0.14, 0.78, 0.42, 0.34, 'vidrio atras')
        g.rotation_euler = (0, 0, math.pi)
        box('techo', (0, 0, 1.22), (W, 0.2, 0.02), coll, 'acero', p=8)
        box('luz', (0, 0, 1.2), (W - 0.1, 0.12, 0.008), coll, 'luz fria', p=6)
        fill_row(coll, 'pescado', -0.6, 0.6, -0.25, 0.81, 4, 0.85)
        fill_row(coll, 'pollo', -0.55, 0.55, 0.0, 0.81, 4, 0.75)
        fill_row(coll, 'salchichas', -0.55, 0.55, 0.26, 0.81, 4, 0.85)
        # Balanza y letrero colgante
        box('balanza', (W - 0.2, 0.3, 1.26), (0.12, 0.1, 0.04), coll, 'blanco', p=5)
        box('pantalla balanza', (W - 0.2, 0.2, 1.3), (0.08, 0.01, 0.025), coll, 'pantalla', p=5)
        for sx in (-1, 1):
            clay.sweep('cadena', [(sx * 0.35, 0, 1.22), (sx * 0.35, 0, 1.75)], 0.008, (1, 1), coll, m('acero'), segments=6, samples=2)
        sign(coll, 'blanco', (0, 0, 1.8), (0.45, 0.03, 0.1), 'celeste')


# --------------------------------------------------------------------------
# Congelador
# --------------------------------------------------------------------------

def congelador(level, coll):
    if level == 1:
        W, D = 0.45, 0.32
        chest(coll, W, D, 0.72, 'blanco', 0.45)
        box('tapa abierta', (0, D + 0.02, 0.98), (W, 0.02, 0.3), coll, 'blanco', p=6)
        fill_grid(coll, 'helado', -0.26, 0.26, -0.14, 0.14, 0.47, 3, 2, 0.8)
        box('logo', (0, -D - 0.005, 0.4), (0.14, 0.006, 0.05), coll, 'rosa', p=5)
    elif level == 2:
        W, D = 0.7, 0.38
        chest(coll, W, D, 0.76, 'celeste', 0.48)
        box('franja', (0, -D - 0.004, 0.5), (W - 0.05, 0.008, 0.05), coll, 'blanco', p=6)
        fill_grid(coll, 'helado', -0.5, 0.5, -0.18, 0.18, 0.5, 5, 2, 0.8, seed=3)
        for sy in (-1, 1):
            box('tapa vidrio', (0, sy * D * 0.5, 0.78), (W - 0.02, D * 0.5 - 0.01, 0.01), coll, 'vidrio', p=8)
    else:
        W, D = 0.95, 0.5
        chest(coll, W, D, 0.76, 'lila', 0.5)
        box('zocalo', (0, 0, 0.04), (W + 0.02, D + 0.02, 0.04), coll, 'blanco', p=6)
        fill_grid(coll, 'helado', -0.75, 0.75, -0.28, 0.28, 0.52, 6, 3, 0.8, seed=5)
        box('divisor', (0, 0, 0.64), (0.015, D - 0.06, 0.12), coll, 'acero', p=8)
        for sx in (-1, 1):
            box('tapa vidrio', (sx * W * 0.5, 0, 0.8), (W * 0.5 - 0.02, D - 0.02, 0.01), coll, 'vidrio', p=8)
        box('luz', (0, -D - 0.005, 0.66), (W - 0.05, 0.006, 0.02), coll, 'luz fria', p=6)
        clay.sweep('mástil', [(0, 0, 0.9), (0, 0, 1.55)], 0.02, (1, 1), coll, m('acero'), segments=8, samples=2)
        prod.instance('helado', (0, -0.02, 1.55), 0.0, 2.2, coll)


# --------------------------------------------------------------------------
# Panadería
# --------------------------------------------------------------------------

def panaderia(level, coll):
    if level == 1:
        box('mesa', (0, 0, 0.5), (0.5, 0.3, 0.03), coll, 'madera', p=8)
        for sx in (-1, 1):
            for sy in (-1, 1):
                clay.sweep('pata', [(sx * 0.42, sy * 0.22, 0), (sx * 0.42, sy * 0.22, 0.48)], 0.03, (1, 1), coll, m('madera oscura'), segments=8, samples=2)
        clay.lathe('canasto', [(0.22, 0.53), (0.3, 0.7), (0.31, 0.72)], coll, m('mimbre'), segments=28, cap_top=False)
        fill_grid(coll, 'pan', -0.1, 0.1, -0.07, 0.07, 0.56, 2, 2, 0.7, seed=2)
        fill_row(coll, 'croissant', -0.09, 0.09, 0.0, 0.68, 2, 0.75)
    elif level == 2:
        W, H = 0.7, 1.5
        for sx in (-1, 1):
            box('lateral', (sx * W, 0, H / 2), (0.035, 0.32, H / 2), coll, 'madera', p=10)
        box('fondo', (0, 0.3, H / 2), (W, 0.02, H / 2), coll, 'madera oscura', p=10)
        for i, (z, nm) in enumerate(((0.25, 'pan'), (0.65, 'croissant'), (1.05, 'pan'))):
            s = box('repisa', (0, -0.02, z), (W - 0.03, 0.3, 0.02), coll, 'madera', p=10)
            s.rotation_euler = (math.radians(-12), 0, 0)
            for x in np.linspace(-0.45, 0.45, 3):
                clay.lathe('canastita', [(0.15, z + 0.02), (0.19, z + 0.12)], coll, m('mimbre'), segments=20, cap_top=False).location.x = x
                # Cada producto va dentro de su canastita
                if nm == 'pan':
                    prod.instance('pan', (x, 0.0, z + 0.05), 0.15, 0.72, coll)
                else:
                    for dx in (-0.055, 0.055):
                        prod.instance('croissant', (x + dx, 0.0, z + 0.05), 1.57, 0.6, coll)
        sign(coll, 'blanco', (0, 0.3, H + 0.15), (0.45, 0.03, 0.1), 'amarillo')
    else:
        W = 0.9
        box('mostrador', (0, 0, 0.42), (W, 0.4, 0.42), coll, 'rosa', p=6)
        box('tapa', (0, 0, 0.86), (W + 0.03, 0.43, 0.03), coll, 'blanco', p=8)
        box('vidrio frente', (0, -0.32, 0.72), (W - 0.04, 0.012, 0.28), coll, 'vidrio', p=8)
        for z in (0.5, 0.88):
            box('repisa', (0, 0.0, z), (W - 0.06, 0.3, 0.012), coll, 'blanco', p=10)
        fill_row(coll, 'torta', -0.5, 0.5, 0.0, 0.51, 3, 0.8)
        fill_row(coll, 'croissant', -0.5, 0.5, 0.0, 0.9, 4, 0.8)
        box('luz', (0, 0.0, 0.84), (W - 0.1, 0.25, 0.008), coll, 'luz', p=6)
        # Horno de pan detrás
        box('horno', (0.2, 0.75, 0.9), (0.45, 0.3, 0.9), coll, 'blanco', p=5)
        box('boca horno', (0.2, 0.44, 1.05), (0.3, 0.02, 0.2), coll, 'negro', p=6)
        box('brasa', (0.2, 0.43, 0.95), (0.25, 0.01, 0.04), coll, 'luz', p=6)
        sign(coll, 'blanco', (0.2, 0.44, 1.55), (0.35, 0.02, 0.09), 'rosa')


# --------------------------------------------------------------------------
# Zonas especiales: wafles y arepas (se reponen igual que la panadería)
# --------------------------------------------------------------------------

def _rueda(coll, x, y, r=0.09):
    w = clay.lathe('rueda', [(0.0, -0.03), (r, -0.03), (r + 0.01, 0.0), (r, 0.03), (0.0, 0.03)], coll, m('negro'), segments=20)
    w.rotation_euler = (0, math.pi / 2, 0)
    w.location = (x, y, r + 0.005)


def _parasol(coll, x, y, z0, h, r, color, trim='blanco'):
    clay.sweep('palo parasol', [(x, y, z0), (x, y, z0 + h)], 0.018, (1, 1), coll, m('acero'), segments=6, samples=2)
    top = clay.lathe('parasol', [(r, 0.0), (r * 0.6, 0.12), (0.0, 0.2)], coll, m(color), segments=24)
    top.location = (x, y, z0 + h - 0.12)
    for k in range(16):
        a = k * math.pi / 8
        clay.blob('festón parasol', (x + r * 0.96 * math.cos(a), y + r * 0.96 * math.sin(a), z0 + h - 0.15), (0.11, 0.11, 0.05), coll,
                  m(color if k % 2 else trim), n=5)


def _toldo(coll, W, y0, depth, z, colors, widths=None):
    """Toldo a rayas de ancho 2W: franjas con festones al frente."""
    widths = widths or [1] * 8
    total = sum(widths)
    x = -W
    for k, wk in enumerate(widths):
        w = 2 * W * wk / total
        col = colors[k % len(colors)]
        box('franja toldo', (x + w / 2, y0, z), (w / 2 + 0.012, depth, 0.025), coll, col, p=14, n=4)
        clay.blob('festón', (x + w / 2, y0 - depth, z - 0.05), (w / 2 * 0.95, 0.03, 0.07), coll, m(col), n=5)
        x += w


def _waflera(coll, c, body, s=1.0, angle=-70):
    """Wafflera abierta: base, placa inferior con wafle y tapa con placa cuadriculada."""
    x, y, z = c
    box('base wafflera', (x, y, z + 0.03 * s), (0.13 * s, 0.13 * s, 0.03 * s), coll, body, p=5)
    box('placa wafflera', (x, y, z + 0.066 * s), (0.105 * s, 0.105 * s, 0.008 * s), coll, 'negro', p=4)
    clay.rbox('wafle en placa', (x, y, z + 0.078 * s), (0.085 * s, 0.085 * s, 0.01 * s), coll, prod.mat('wafle'), p=4)
    lid = box('tapa wafflera', (0, 0, 0), (0.13 * s, 0.13 * s, 0.03 * s), coll, body, p=5)
    a = math.radians(angle)
    vy, vz = -0.13 * s, 0.03 * s
    lid.location = (x, y + 0.13 * s + vy * math.cos(a) - vz * math.sin(a), z + 0.06 * s + vy * math.sin(a) + vz * math.cos(a))
    lid.rotation_euler = (a, 0, 0)
    parts = [box('placa tapa', (0, 0, -0.032 * s), (0.105 * s, 0.105 * s, 0.006 * s), coll, 'negro', p=4),
             clay.blob('manija wafflera', (0, -0.15 * s, 0.0), (0.045 * s, 0.022 * s, 0.016 * s), coll, m('negro'), n=4)]
    for i in range(4):
        for j in range(4):
            parts.append(box('cuadro placa', ((i - 1.5) * 0.048 * s, (j - 1.5) * 0.048 * s, -0.039 * s), (0.017 * s, 0.017 * s, 0.003 * s), coll,
                             'acero', p=4, n=4))
    for o in parts:
        o.parent = lid


def _bowl(coll, x, y, z, fill, r=0.065):
    b = clay.lathe('tazón', [(0.0, 0.0), (r * 0.7, 0.0), (r, 0.05), (r * 0.95, 0.055)], coll, m('blanco'), segments=20, cap_top=False)
    b.location = (x, y, z)
    if fill == 'fresas':
        for k in range(5):
            a = k * 1.3
            clay.blob('fresa tazón', (x + 0.03 * math.cos(a), y + 0.03 * math.sin(a), z + 0.05), (0.02, 0.018, 0.018), coll, prod.mat('fresa'), n=4)
    else:
        mat = prod.mat('crema batida') if fill == 'crema' else m('chocolate')
        clay.blob('relleno tazón', (x, y, z + 0.045), (r * 0.85, r * 0.85, 0.02), coll, mat, n=6)


def _frasco(coll, x, y, z, mk, cap='blanco'):
    b = clay.lathe('frasco salsa', [(0.0, 0.0), (0.03, 0.0), (0.032, 0.12), (0.012, 0.16), (0.004, 0.19)], coll, m(mk), segments=16)
    b.location = (x, y, z)
    clay.blob('tapa frasco', (x, y, z + 0.14), (0.02, 0.02, 0.012), coll, m(cap), n=4)


def _kiosco(coll, body, back, awning, sign_color, awning_widths=None):
    """Kiosco de nivel 3: mostrador con vitrina al frente, mesón de trabajo atrás y toldo."""
    W = 0.95
    box('mostrador', (0, 0, 0.42), (W, 0.36, 0.42), coll, body, p=6)
    box('tapa', (0, 0, 0.86), (W + 0.03, 0.39, 0.03), coll, 'blanco', p=8)
    box('vidrio frente', (0, -0.3, 1.07), (W - 0.04, 0.012, 0.18), coll, 'vidrio', p=8)
    box('vidrio techo', (0, -0.16, 1.26), (W - 0.04, 0.15, 0.01), coll, 'vidrio', p=8)
    box('meson', (0, 0.78, 0.45), (W, 0.22, 0.45), coll, back, p=6)
    box('tapa meson', (0, 0.78, 0.915), (W + 0.02, 0.24, 0.025), coll, 'acero', p=8)
    for sx in (-1, 1):
        clay.sweep('poste toldo', [(sx * W, 1.0, 0.0), (sx * W, 1.0, 2.05)], 0.025, (1, 1), coll, m('acero'), segments=8, samples=2)
    _toldo(coll, W + 0.05, 0.6, 0.45, 2.08, awning, awning_widths)
    sign(coll, 'blanco', (0, 0.12, 2.3), (0.5, 0.03, 0.12), sign_color)
    return W


def wafles(level, coll):
    if level == 1:
        box('carrito', (0, 0, 0.44), (0.45, 0.28, 0.36), coll, 'rosa', p=6)
        box('tapa', (0, 0, 0.82), (0.48, 0.3, 0.025), coll, 'blanco', p=8)
        box('franja', (0, -0.285, 0.5), (0.4, 0.012, 0.035), coll, 'blanco', p=6)
        for sx in (-1, 1):
            _rueda(coll, sx * 0.47, -0.12)
        _waflera(coll, (0.2, 0.02, 0.845), 'blanco')
        for k in range(2):
            prod.instance('wafle', (-0.2, -0.04, 0.845 + k * 0.045), 0.3 * k, 0.85, coll)
        _parasol(coll, -0.38, 0.2, 0.845, 0.95, 0.55, 'rosa')
    elif level == 2:
        box('barra', (0, 0, 0.45), (0.75, 0.32, 0.45), coll, 'blanco', p=6)
        for k in range(3):
            box('franja', (0, -0.31, 0.2 + k * 0.2), (0.68, 0.012, 0.04), coll, 'rosa', p=6)
        box('tapa', (0, 0, 0.92), (0.77, 0.34, 0.03), coll, 'madera', p=8)
        for x in (0.15, 0.5):
            _waflera(coll, (x, 0.12, 0.95), 'rosa', 0.95)
        for x, f in ((-0.58, 'fresas'), (-0.42, 'crema'), (-0.26, 'chocolate')):
            _bowl(coll, x, 0.14, 0.95, f)
        fill_row(coll, 'wafle', -0.55, 0.5, -0.19, 0.95, 4, 0.75)
        for sx in (-1, 1):
            clay.sweep('poste letrero', [(sx * 0.5, 0.3, 0.95), (sx * 0.5, 0.3, 1.62)], 0.015, (1, 1), coll, m('acero'), segments=6, samples=2)
        sign(coll, 'blanco', (0, 0.3, 1.72), (0.55, 0.03, 0.11), 'rosa')
    else:
        _kiosco(coll, 'rosa', 'blanco', ['rosa', 'blanco'], 'rosa')
        fill_row(coll, 'wafle', -0.7, 0.7, -0.14, 0.89, 4, 0.75)
        for x in (-0.55, 0.0, 0.55):
            _waflera(coll, (x, 0.78, 0.94), 'rosa', 0.95)
        for k, mk in enumerate(('chocolate', 'rojo bandera', 'amarillo')):
            _frasco(coll, 0.62 + k * 0.1, 0.18, 0.89, mk)
        for k, f in enumerate(('fresas', 'crema')):
            _bowl(coll, -0.75 + k * 0.15, 0.18, 0.89, f, 0.055)


def arepas(level, coll):
    flag = ['amarillo', 'amarillo', 'azul bandera', 'rojo bandera']
    if level == 1:
        box('carrito', (0, 0, 0.42), (0.42, 0.26, 0.34), coll, 'amarillo', p=6)
        box('franja azul', (0, -0.255, 0.3), (0.38, 0.012, 0.04), coll, 'azul bandera', p=6)
        box('franja roja', (0, -0.255, 0.2), (0.38, 0.012, 0.04), coll, 'rojo bandera', p=6)
        for sx in (-1, 1):
            _rueda(coll, sx * 0.44, -0.1)
        box('asador', (0, 0, 0.82), (0.36, 0.22, 0.06), coll, 'negro', p=6)
        box('brasas', (0, 0, 0.865), (0.3, 0.17, 0.012), coll, 'brasa', p=6)
        for k in range(7):
            y = -0.18 + k * 0.06
            clay.sweep('reja', [(-0.34, y, 0.885), (0.34, y, 0.885)], 0.008, (1, 1), coll, m('acero'), segments=6, samples=2)
        fill_row(coll, 'arepa', -0.22, 0.22, 0.0, 0.892, 3, 0.8)
        _parasol(coll, 0.34, 0.18, 0.88, 0.95, 0.55, 'amarillo', 'azul bandera')
    elif level == 2:
        box('mostrador', (0, 0, 0.45), (0.75, 0.32, 0.45), coll, 'blanco', p=6)
        for k, (z, h, mk) in enumerate(((0.52, 0.08, 'amarillo'), (0.38, 0.04, 'azul bandera'), (0.28, 0.04, 'rojo bandera'))):
            box('franja bandera', (0, -0.31, z), (0.68, 0.012, h), coll, mk, p=6)
        box('tapa', (0, 0, 0.92), (0.77, 0.34, 0.03), coll, 'madera', p=8)
        box('plancha', (0.2, 0.05, 0.965), (0.42, 0.22, 0.02), coll, 'acero', p=8)
        box('borde plancha', (0.2, 0.26, 1.0), (0.42, 0.012, 0.04), coll, 'negro', p=8)
        fill_grid(coll, 'arepa', -0.05, 0.45, -0.07, 0.15, 0.985, 3, 2, 0.75, seed=4)
        clay.lathe('canasto arepas', [(0.12, 0.0), (0.16, 0.1), (0.165, 0.11)], coll, m('mimbre'), segments=24, cap_top=False).location = (-0.5, 0.0, 0.95)
        for k in range(3):
            prod.instance('arepa', (-0.5, 0.0, 0.96 + k * 0.035), k * 0.7, 0.75, coll)
        clay.rbox('bloque queso', (-0.5, -0.22, 1.0), (0.09, 0.06, 0.05), coll, prod.mat('queso blanco'), p=4)
        clay.rbox('mantequilla', (-0.3, -0.2, 0.975), (0.05, 0.04, 0.025), coll, prod.mat('mantequilla'), p=4)
        for sx in (-1, 1):
            clay.sweep('poste letrero', [(sx * 0.5, 0.3, 0.95), (sx * 0.5, 0.3, 1.62)], 0.015, (1, 1), coll, m('acero'), segments=6, samples=2)
        sign(coll, 'blanco', (0, 0.3, 1.72), (0.55, 0.03, 0.11), 'amarillo')
    else:
        _kiosco(coll, 'amarillo', 'blanco', ['amarillo', 'azul bandera', 'rojo bandera'], 'azul bandera', [2, 1, 1, 2, 1, 1])
        fill_row(coll, 'arepa', -0.7, 0.7, -0.14, 0.89, 5, 0.75)
        for x in (-0.45, 0.45):
            box('plancha', (x, 0.78, 0.95), (0.4, 0.18, 0.015), coll, 'negro', p=8)
            fill_row(coll, 'arepa', x - 0.22, x + 0.22, 0.78, 0.965, 3, 0.7)
        clay.rbox('bloque queso', (-0.75, 0.15, 0.94), (0.08, 0.06, 0.05), coll, prod.mat('queso blanco'), p=4)
        clay.rbox('mantequilla', (0.75, 0.15, 0.915), (0.05, 0.04, 0.025), coll, prod.mat('mantequilla'), p=4)


# --------------------------------------------------------------------------
# Bebidas
# --------------------------------------------------------------------------

def bebidas(level, coll):
    if level == 1:
        for sx in (-1, 1):
            clay.sweep('alambre', [(sx * 0.45, -0.2, 0), (sx * 0.45, -0.2, 0.9), (sx * 0.45, 0.2, 0.9), (sx * 0.45, 0.2, 0)], 0.015, (1, 1), coll, m('acero'),
                       segments=6, samples=2)
        for z in (0.1, 0.5):
            box('canasta alambre', (0, 0, z), (0.45, 0.2, 0.02), coll, 'acero', p=10)
        fill_row(coll, 'agua', -0.36, 0.36, -0.02, 0.12, 5, 0.9)
        fill_row(coll, 'gaseosa', -0.36, 0.36, -0.02, 0.52, 5, 0.9)
    elif level == 2:
        W, H, D = 0.5, 1.7, 0.36
        cabinet(coll, W, D, H, 'coral', 'blanco')
        box('puerta vidrio', (0, -D + 0.07, 0.86), (W - 0.04, 0.012, 0.72), coll, 'vidrio', p=8)
        box('cabecera', (0, -D + 0.05, H - 0.07), (W, 0.02, 0.08), coll, 'blanco', p=6)
        for z, nm in ((0.22, 'agua'), (0.62, 'gaseosa'), (1.02, 'jugo'), (1.38, 'gaseosa')):
            box('repisa', (0, 0.02, z), (W - 0.08, D - 0.08, 0.012), coll, 'acero', p=10)
            fill_row(coll, nm, -0.3, 0.3, -0.05, z + 0.012, 4, 0.85)
    else:
        W, H, D = 0.9, 1.8, 0.4
        cabinet(coll, W, D, H, 'acero', 'blanco')
        for sx in (-1, 1):
            box('puerta vidrio', (sx * W / 2, -D + 0.07, 0.9), (W / 2 - 0.03, 0.012, 0.76), coll, 'vidrio', p=8)
        for z, nm, n in ((0.22, 'agua', 7), (0.62, 'gaseosa', 7), (1.02, 'jugo', 8), (1.4, 'gaseosa', 7)):
            box('repisa', (0, 0.02, z), (W - 0.08, D - 0.08, 0.012), coll, 'acero', p=10)
            fill_row(coll, nm, -0.7, 0.7, -0.06, z + 0.012, n, 0.85)
        box('cabecera', (0, -D, H + 0.1), (W + 0.02, 0.05, 0.12), coll, 'coral', p=5)
        box('luz', (0, -D - 0.05, H + 0.1), (W - 0.12, 0.006, 0.04), coll, 'luz', p=5)
        # Dispensador de jugos al lado
        box('dispensador', (W + 0.24, -0.05, 0.55), (0.2, 0.28, 0.55), coll, 'blanco', p=5)
        for k, col in enumerate(('naranja', 'rosa')):
            clay.lathe(f'tanque {k}', [(0.08, 0.0), (0.08, 0.32)], coll, clay.material(f'Mueble | jugo {k}', '#F59B3A' if k == 0 else '#F4A7C0', rough=0.2,
                                                                                    sss=0.3, coat=0.5), segments=20).location = (W + 0.15 + k * 0.18, -0.1, 1.1)


# --------------------------------------------------------------------------
# Caja registradora
# --------------------------------------------------------------------------

def _registradora(coll, c, body, s=1.0):
    """Registradora de juguete: cajón, cuerpo, teclado inclinado con teclas y visor."""
    x, y, z = c
    box('cajon', (x, y, z + 0.045 * s), (0.19 * s, 0.17 * s, 0.045 * s), coll, body, p=5)
    box('frente cajon', (x, y - 0.168 * s, z + 0.045 * s), (0.15 * s, 0.006, 0.028 * s), coll, 'blanco', p=5)
    clay.blob('perilla cajon', (x, y - 0.18 * s, z + 0.045 * s), (0.018 * s, 0.012, 0.018 * s), coll, m('acero'), n=4)
    box('cuerpo registradora', (x, y + 0.05 * s, z + 0.15 * s), (0.17 * s, 0.1 * s, 0.07 * s), coll, body, p=5)
    tec = box('teclado', (0, 0, 0), (0.15 * s, 0.075 * s, 0.022 * s), coll, 'blanco', p=5)
    tec.location = (x, y - 0.09 * s, z + 0.14 * s)
    tec.rotation_euler = (0.5, 0, 0)
    colors = ['coral', 'amarillo', 'celeste', 'menta']
    for r in range(3):
        for k in range(4):
            key = clay.rbox('tecla', ((k - 1.5) * 0.068 * s, (r - 1) * 0.045 * s, 0.024 * s),
                            (0.024 * s, 0.017 * s, 0.012 * s), coll, m(colors[k] if r == 0 else 'crema tecla'), p=4, n=4)
            key.parent = tec
    clay.sweep('cuello visor', [(x, y + 0.1 * s, z + 0.2 * s), (x, y + 0.1 * s, z + 0.3 * s)], 0.02 * s, (1, 1), coll, m('acero'), segments=8, samples=2)
    box('visor', (x, y + 0.1 * s, z + 0.33 * s), (0.1 * s, 0.035 * s, 0.045 * s), coll, body, p=5)
    box('pantalla visor', (x, y + 0.064 * s, z + 0.33 * s), (0.08 * s, 0.004, 0.03 * s), coll, 'pantalla', p=5)


def _frasco_dulces(coll, c, s=1.0):
    x, y, z = c
    rng = np.random.default_rng(4)
    cols = ['coral', 'amarillo', 'menta', 'lila', 'rosa', 'celeste']
    for i in range(14):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0, 0.05 * s)
        clay.blob('dulce', (x + r * math.cos(a), y + r * math.sin(a), z + 0.03 * s + (i // 5) * 0.035 * s),
                  (0.022 * s, 0.022 * s, 0.018 * s), coll, m(cols[i % len(cols)]), n=4)
    j = clay.lathe('frasco dulces', [(0.075 * s, 0.0), (0.085 * s, 0.1 * s), (0.06 * s, 0.15 * s), (0.055 * s, 0.17 * s)], coll, m('vidrio'), segments=20)
    j.location = (x, y, z)
    box('tapa frasco', (x, y, z + 0.18 * s), (0.06 * s, 0.06 * s, 0.018 * s), coll, 'coral', p=3)


def caja_registradora(level, coll):
    if level == 1:
        box('mostrador', (0, 0, 0.45), (0.6, 0.3, 0.45), coll, 'madera', p=6)
        box('tapa', (0, 0, 0.91), (0.64, 0.33, 0.025), coll, 'madera oscura', p=8)
        _registradora(coll, (0.22, 0.02, 0.935), 'coral', 1.0)
        _frasco_dulces(coll, (-0.35, -0.02, 0.935), 1.0)
    elif level == 2:
        box('mostrador', (0, 0, 0.45), (0.85, 0.35, 0.45), coll, 'blanco', p=6)
        for k in range(3):
            box('franja roja', (0, -0.345, 0.2 + k * 0.22), (0.78, 0.012, 0.045), coll, 'coral', p=6)
        box('banda', (-0.25, 0, 0.93), (0.55, 0.22, 0.03), coll, 'negro', p=8)
        for sx in (-1, 1):
            box('baranda', (-0.25, sx * 0.25, 0.96), (0.55, 0.02, 0.04), coll, 'acero', p=8)
        _registradora(coll, (0.55, 0.05, 0.9), 'celeste', 1.1)
        for k in range(3):
            box('bolsas', (0.55, -0.25 + 0.0, 0.93 + k * 0.03), (0.13, 0.07, 0.014), coll, 'amarillo', p=4)
    else:
        box('mostrador', (0, 0, 0.45), (1.0, 0.38, 0.45), coll, 'menta', p=6)
        box('zocalo luz', (0, -0.36, 0.14), (0.88, 0.008, 0.018), coll, 'luz fria', p=6)
        box('banda', (-0.3, 0, 0.93), (0.62, 0.24, 0.03), coll, 'negro', p=8)
        for sx in (-1, 1):
            box('baranda', (-0.3, sx * 0.27, 0.96), (0.62, 0.02, 0.04), coll, 'acero', p=8)
        box('escaner', (0.45, 0, 0.93), (0.14, 0.2, 0.03), coll, 'acero', p=8)
        box('luz escaner', (0.45, 0, 0.962), (0.1, 0.15, 0.006), coll, 'luz roja', p=6)
        # Monitor sobre soporte, mirando al cliente
        clay.sweep('soporte monitor', [(0.8, 0.2, 0.9), (0.8, 0.2, 1.18)], 0.025, (1, 1), coll, m('acero'), segments=8, samples=2)
        box('monitor', (0.8, 0.18, 1.3), (0.17, 0.035, 0.13), coll, 'blanco', p=5)
        box('pantalla', (0.8, 0.142, 1.3), (0.14, 0.006, 0.1), coll, 'pantalla', p=5)
        clay.sweep('soporte datafono', [(0.8, -0.22, 0.9), (0.8, -0.22, 1.02)], 0.015, (1, 1), coll, m('acero'), segments=8, samples=2)
        box('datafono', (0.8, -0.22, 1.06), (0.06, 0.09, 0.03), coll, 'negro', p=5)
        box('pantalla datafono', (0.8, -0.25, 1.09), (0.04, 0.035, 0.004), coll, 'pantalla', p=5)
        clay.sweep('poste número', [(-0.95, 0.3, 0.9), (-0.95, 0.3, 2.0)], 0.025, (1, 1), coll, m('acero'), segments=8, samples=2)
        box('número', (-0.95, 0.3, 2.1), (0.14, 0.06, 0.14), coll, 'coral', p=4)
        box('luz número', (-0.95, 0.235, 2.1), (0.08, 0.006, 0.08), coll, 'luz', p=5)
        # Exhibidor abierto de dulces junto a la caja
        for sx in (-1, 1):
            box('lateral exhibidor', (-1.25 + sx * 0.17, 0, 0.55), (0.02, 0.18, 0.55), coll, 'blanco', p=8)
        box('fondo exhibidor', (-1.25, 0.16, 0.55), (0.17, 0.02, 0.55), coll, 'blanco', p=8)
        for z in (0.06, 0.4, 0.74, 1.08):
            box('repisa exhibidor', (-1.25, 0, z), (0.17, 0.17, 0.015), coll, 'coral', p=8)
        for z in (0.08, 0.42, 0.76):
            fill_row(coll, 'galletas', -1.33, -1.17, -0.02, z, 2, 0.45)
        _frasco_dulces(coll, (-1.25, -0.02, 1.095), 0.8)


TIPOS = [
    ('estante', 'Estante de abarrotes', estante),
    ('frutas', 'Frutas y verduras', frutas),
    ('nevera', 'Nevera de lácteos', nevera),
    ('vitrina', 'Vitrina refrigerada', vitrina_refrigerada),
    ('congelador', 'Congelador', congelador),
    ('panaderia', 'Panadería', panaderia),
    ('bebidas', 'Bebidas', bebidas),
    ('caja', 'Caja registradora', caja_registradora),
    ('wafles', 'Zona especial: wafles', wafles),
    ('arepas', 'Zona especial: arepas', arepas),
]


def build(kind, level, coll, location=(0, 0, 0), rotation_z=0.0):
    """Construye una vitrina y la agrupa bajo un vacío para poder moverla."""
    import bpy
    fn = {k: f for k, _, f in TIPOS}[kind]
    before = set(coll.objects)
    fn(level, coll)
    new = [o for o in coll.objects if o not in before]
    root = bpy.data.objects.new(f'Vitrina | {kind} N{level}', None)
    clay.link(root, coll)
    for o in new:
        if o.parent is None:
            o.parent = root
    root.location = location
    root.rotation_euler = (0, 0, rotation_z)
    return root
