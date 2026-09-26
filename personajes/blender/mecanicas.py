"""Hojas que explican las mecánicas de la estantería del juego.

16a · Cómo se vacía una vitrina: llena, a medias, casi vacía (aviso amarillo) y vacía
      (aviso rojo + cliente esperando con su globo de pensamiento).
16b · Cómo se repone: bodega con las cajas por sección, Él carga la caja en el carrito,
      camina por el pasillo y Ella rellena la vitrina.

Uso: python3 mecanicas.py <carpeta_salida> [muestras] [escala%]
"""
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402
from mathutils import Vector  # noqa: E402

import clay  # noqa: E402
import escena  # noqa: E402
import productos as prod  # noqa: E402
import tiendas  # noqa: E402
import utileria  # noqa: E402
import vitrinas  # noqa: E402

M = clay.material


def _mat(name, color, **kw):
    return bpy.data.materials.get(name) or M(name, color, **kw)


def estudio(scene, floor='#EFE3D6'):
    coll = clay.collection('Estudio mecánicas')
    clay.make_mesh_object('piso', [(-300, -300, 0), (300, -300, 0), (300, 300, 0), (-300, 300, 0)], [(0, 1, 2, 3)], coll,
                          material=_mat('Mecánicas | piso', floor, rough=0.8))
    escena.world_color(scene, '#F4EAE0', 0.55)
    escena.area_light('Luz | clave', (-6, -8, 10), (0, 0, 0), 2800, 9.0, '#FFF1E2', coll)
    escena.area_light('Luz | relleno', (8, -6, 5), (0, 0, 0), 1000, 9.0, '#EAF2FF', coll)
    escena.area_light('Luz | contraluz', (0, 8, 8), (0, 0, 0), 1200, 9.0, '#FFE6CC', coll)


def instancias(coll):
    return sum(1 for o in coll.objects if o.type == 'EMPTY' and o.instance_type == 'COLLECTION')


def barra_inventario(coll, x, y, z, frac):
    """Barra de inventario flotando sobre la vitrina (verde, amarilla o roja)."""
    color = '#5CC57E' if frac > 0.5 else ('#F7C62F' if frac > 0.2 else '#E5534B')
    clay.rbox('fondo barra', (x, y, z), (0.46, 0.03, 0.075), coll, _mat('Barra | fondo', '#FFFFFF', rough=0.5), p=4, n=5)
    clay.rbox('marco barra', (x, y + 0.01, z), (0.49, 0.025, 0.1), coll, _mat('Barra | marco', '#6B5A50', rough=0.5), p=4, n=5)
    if frac > 0:
        w = 0.42 * frac
        clay.rbox('nivel barra', (x - 0.42 + w, y - 0.03, z), (w, 0.012, 0.052), coll, _mat(f'Barra | {color}', color, rough=0.4, coat=0.3),
                  p=4, n=5)


def alerta(coll, x, y, z, tipo, producto=None):
    """Aviso flotante: '!' amarillo (queda poco) o rojo con el producto que falta (vacío)."""
    color = '#F7C62F' if tipo == 'poco' else '#E5534B'
    disc = clay.lathe('aviso', [(0.0, -0.04), (0.2, -0.04), (0.22, 0.0), (0.2, 0.04), (0.0, 0.04)], coll,
                      _mat(f'Aviso | {color}', color, rough=0.35, coat=0.4), segments=28)
    disc.rotation_euler = (math.pi / 2, 0, 0)
    disc.location = (x, y, z)
    blanco = _mat('Aviso | blanco', '#FFFFFF', rough=0.4)
    clay.rbox('signo !', (x, y - 0.05, z + 0.035), (0.026, 0.02, 0.085), coll, blanco, p=3, n=4)
    clay.blob('punto !', (x, y - 0.05, z - 0.105), (0.03, 0.02, 0.03), coll, blanco, n=4)
    clay.blob('pico aviso', (x, y, z - 0.23), (0.06, 0.035, 0.07), coll, _mat(f'Aviso | {color}', color, rough=0.35, coat=0.4), n=4,
              shaper=lambda v: v * (1 - 0.6 * (v[:, 2:3] < 0) * (-v[:, 2:3] / 0.07)))
    if producto:
        clay.blob('burbuja producto', (x + 0.42, y + 0.02, z), (0.2, 0.06, 0.18), coll, _mat('Aviso | burbuja', '#FFFFFF', rough=0.5, sss=0.2), n=8)
        prod.instance(producto, (x + 0.42, y - 0.08, z - 0.12), 0.0, 1.1, coll)


def sobre_cabeza(coll, fn, x, y, z, s=1.0):
    return utileria.build('sobre cabeza', fn, coll, (x, y, z), 0.0, s)


def render(scene, cam, path, w, h, labels, title):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.filepath = path
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDER', os.path.basename(path), round(time.time() - t, 1), 's', flush=True)
    from PIL import Image, ImageDraw, ImageFont
    im = Image.open(path).convert('RGB')
    d = ImageDraw.Draw(im)
    W, H = im.size
    fb = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    f = ImageFont.truetype(fb, max(14, W // 90))
    for text, pos in labels:
        co = world_to_camera_view(scene, cam, Vector(pos))
        x, y = co.x * W, (1 - co.y) * H
        lines = text.split('\n')
        tw = max(d.textlength(t_, font=f) for t_ in lines)
        lh = int(f.size * 1.25)
        d.rounded_rectangle((x - tw / 2 - 8, y - 6, x + tw / 2 + 8, y + lh * len(lines) + 2), radius=10, fill=(255, 255, 255))
        for i, t_ in enumerate(lines):
            d.text((x - d.textlength(t_, font=f) / 2, y + i * lh), t_, font=f, fill=(70, 60, 55))
    ft = ImageFont.truetype(fb, max(18, W // 48))
    tw = d.textlength(title, font=ft)
    d.rounded_rectangle((24, 20, 24 + tw + 30, 20 + ft.size + 24), radius=14, fill=(255, 255, 255))
    d.text((39, 31), title, font=ft, fill=(90, 70, 60))
    im.save(path)


def hoja_estados(scene, out):
    """16a: la misma góndola de abarrotes (nivel 2) llena, a medias, casi vacía y vacía."""
    coll = clay.collection('Hoja estados')
    estados = [(1.0, 'Llena'), (0.55, 'A medias'), (0.2, 'Casi vacía'), (0.0, 'Vacía')]
    xs = [-5.4, -1.8, 1.8, 5.4]
    labels = []
    total = None
    for (frac, nombre), x in zip(estados, xs):
        vitrinas.LLENADO = frac
        before = instancias(coll)
        vitrinas.build('estante', 2, coll, (x, 0, 0), 0.0)
        n = instancias(coll) - before
        total = total or n
        barra_inventario(coll, x, -0.1, 2.05, n / total)
        if nombre == 'Casi vacía':
            alerta(coll, x, -0.1, 2.55, 'poco')
            extra = '\naviso amarillo:\n¡reponer pronto!'
        elif nombre == 'Vacía':
            alerta(coll, x, -0.1, 2.55, 'vacio', 'arroz')
            extra = '\naviso rojo y\nclientes esperando'
        elif nombre == 'Llena':
            extra = '\nrecién repuesta'
        else:
            extra = '\nlos clientes se\nllevan producto'
        labels.append((f'{nombre} · {n}/{total}{extra}', (x, -0.9, -0.02)))
    vitrinas.LLENADO = 1.0
    # Cliente feliz tomando producto de la góndola llena
    tiendas.person(coll, 'abuelita', -4.3, -0.95, 0.5)
    sobre_cabeza(coll, lambda c: utileria.carita(c, 'feliz'), -4.3, -0.95, 1.62, 0.8)
    prod.instance('enlatado', (-4.75, -0.6, 1.0), 0.3, 1.0, coll)
    clay.sweep('trayecto producto', [(-5.2, -0.35, 0.95), (-4.95, -0.55, 1.15), (-4.6, -0.8, 0.95)], 0.012, (1, 1), coll,
               _mat('Trayecto', '#FFFFFF', rough=0.5), segments=5, samples=4)
    # Cliente esperando frente a la góndola vacía: globo con lo que busca y paciencia bajando
    tiendas.person(coll, 'ejecutivo', 6.6, -1.0, -0.4)
    sobre_cabeza(coll, lambda c: utileria.globo_pensamiento(c, 'arroz'), 7.0, -1.0, 1.35, 0.9)
    sobre_cabeza(coll, lambda c: utileria.carita(c, 'enojada'), 6.3, -1.0, 1.75, 0.6)
    tiendas.exclude_sources()
    cam = escena.camera('CAM estados', (0.4, -16.5, 6.6), (0.4, 0.0, 1.1), 40)
    render(scene, cam, os.path.join(out, '16a-estados-vitrina.png'), 2400, 1100, labels,
           'Cómo se vacía una vitrina (y cómo avisa)')
    coll.hide_render = True
    coll.hide_viewport = True


def hoja_reponer(scene, out):
    """16b: bodega → carrito → pasillo → vitrina repuesta."""
    coll = clay.collection('Hoja reponer')
    U = lambda name, fn, x, y, r=0.0, s=1.0: utileria.build(name, fn, coll, (x, y, 0), r, s)
    pared = _mat('Reponer | pared', '#F6D8C0', rough=0.9)
    clay.rbox('pared', (0, 2.1, 1.4), (7.6, 0.1, 1.4), coll, pared, p=10, n=4)
    tiendas.stockroom(coll, -5.6, 2.0, 3)
    for k, (dx, dy) in enumerate(((0.0, 0.0), (0.45, 0.1), (0.2, 0.05))):
        prod.instance('caja abarrotes', (-3.2 + dx, 1.2 + dy, 0.28 * (k == 2)), 0.2 * k, 1.0, coll)
    # 1-2: Él carga la caja de abarrotes en el carrito dentro de la bodega
    tiendas.el_con_carrito(coll, U, 2, -3.6, 0.2, -0.15, 0.1, -0.65)
    # 3: camino del pasillo hasta la vitrina (cola de acciones)
    pts = [(-2.8, -0.9, 0.02), (-1.0, -1.2, 0.02), (1.0, -1.0, 0.02), (2.6, -0.5, 0.02)]
    clay.stitches('camino', pts, radius=0.03, dash=0.16, gap=0.12, coll=coll, material=_mat('Camino', '#EE7A68', rough=0.6), samples=10)
    punta = clay.make_mesh_object('flecha camino', [(2.9, -0.35, 0.02), (2.55, -0.25, 0.02), (2.65, -0.7, 0.02)], [(0, 1, 2)], coll,
                                  material=_mat('Camino', '#EE7A68', rough=0.6))
    clay.add_solidify(punta, 0.02, 0.0)
    for k, (x, y) in enumerate(((-3.0, -0.6), (4.1, -0.7))):
        clay.lathe(f'marca cola {k}', [(0.0, 0.0), (0.22, 0.0), (0.23, 0.02), (0.0, 0.025)], coll, _mat('Marca cola', '#5CC57E', rough=0.4),
                   segments=24).location = (x, y, 0)
    # 4: Ella rellena la góndola con la caja abierta
    vitrinas.LLENADO = 0.45
    vitrinas.build('estante', 2, coll, (4.1, 1.35, 0), 0.0)
    vitrinas.LLENADO = 1.0
    tiendas.person(coll, 'ella_reponer', 4.1, 0.55, math.pi - 0.5)
    prod.instance('caja abarrotes', (3.05, 0.6, 0.0), 0.3, 1.0, coll)
    prod.instance('enlatado', (3.6, 0.85, 1.25), 0.0, 1.0, coll)
    for k, (x, z) in enumerate(((3.2, 1.9), (4.9, 2.0), (4.4, 2.3))):
        sobre_cabeza(coll, utileria.estrella, x, 1.0, z, 0.45)
    barra_inventario(coll, 4.1, 1.0, 2.35, 0.45)
    tiendas.exclude_sources()
    labels = [('1 · Tocas la vitrina vacía:\nqueda en la cola de acciones', (4.1, -1.05, -0.02)),
              ('2 · Él va a la bodega y carga\nla caja de esa sección', (-3.8, -1.25, -0.02)),
              ('3 · Camina por el pasillo\ncon el carrito', (-0.2, -1.65, -0.02)),
              ('4 · Rellena la vitrina:\nla barra vuelve a verde', (4.1, 2.9, 2.6)),
              ('Bodega: una caja\npor sección', (-4.4, 1.2, 2.85))]
    cam = escena.camera('CAM reponer', (-0.4, -15.0, 6.4), (-0.4, 0.4, 1.0), 40)
    render(scene, cam, os.path.join(out, '16b-como-se-repone.png'), 2400, 1100, labels, 'Cómo se repone una vitrina')
    coll.hide_render = True
    coll.hide_viewport = True


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    OUT = args[0]
    SAMPLES = int(args[1]) if len(args) > 1 else 64
    SCALE = int(args[2]) if len(args) > 2 else 100
    HOJAS = args[3].split(',') if len(args) > 3 else ['estados', 'reponer']
    os.makedirs(OUT, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 2400, 1100, SAMPLES)
    scene.render.resolution_percentage = SCALE
    scene.view_settings.look = 'AgX - Medium High Contrast'
    estudio(scene)
    prod.build_all()
    if 'estados' in HOJAS:
        hoja_estados(scene, OUT)
    if 'reponer' in HOJAS:
        hoja_reponer(scene, OUT)
