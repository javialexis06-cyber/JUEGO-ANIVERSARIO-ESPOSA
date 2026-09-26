"""Hojas de catálogo: productos y vitrinas por nivel, con etiquetas.

Uso: python3 catalogo.py <carpeta_salida> <hoja1,hoja2,...> [muestras] [escala%]
Hojas: productos, vitrinas (una imagen por tipo de vitrina con sus 3 niveles)
"""
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402
from mathutils import Vector  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

import clay  # noqa: E402
import escena  # noqa: E402
import productos as prod  # noqa: E402
import vitrinas  # noqa: E402

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
OUT = args[0]
SHEETS = args[1].split(',')
SAMPLES = int(args[2]) if len(args) > 2 else 64
SCALE = int(args[3]) if len(args) > 3 else 100
os.makedirs(OUT, exist_ok=True)

FONT_PATHS = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']


def font(size):
    for p in FONT_PATHS:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def studio(scene, floor='#F3E6DA'):
    coll = clay.collection('Estudio catálogo')
    clay.make_mesh_object('piso', [(-60, -60, 0), (60, -60, 0), (60, 60, 0), (-60, 60, 0)], [(0, 1, 2, 3)], coll,
                          material=clay.material('Catálogo | piso', floor, rough=0.8))
    escena.world_color(scene, '#F4EAE0', 0.55)
    escena.area_light('Luz | clave', (-6, -8, 10), (0, 0, 0), 2600, 8.0, '#FFF1E2', coll)
    escena.area_light('Luz | relleno', (8, -6, 5), (0, 0, 0), 900, 8.0, '#EAF2FF', coll)
    escena.area_light('Luz | contraluz', (0, 8, 8), (0, 0, 0), 1200, 8.0, '#FFE6CC', coll)
    return coll


def render(scene, cam, name, w, h, labels=(), title=None):
    scene.camera = cam
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = SCALE
    scene.cycles.samples = SAMPLES
    path = os.path.join(OUT, name + '.png')
    scene.render.filepath = path
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDER', name, round(time.time() - t, 1), 's', flush=True)
    if labels:
        im = Image.open(path).convert('RGB')
        d = ImageDraw.Draw(im)
        W, H = im.size
        f = font(max(12, int(W / 80)))
        for text, pos in labels:
            co = world_to_camera_view(scene, cam, Vector(pos))
            x, y = co.x * W, (1 - co.y) * H
            tw = d.textlength(text, font=f)
            pad = 6
            d.rounded_rectangle((x - tw / 2 - pad, y - pad, x + tw / 2 + pad, y + f.size + pad), radius=10, fill=(255, 255, 255))
            d.text((x - tw / 2, y), text, font=f, fill=(70, 60, 55))
        if title:
            ft = font(max(16, int(W / 45)))
            tw = d.textlength(title, font=ft)
            d.rounded_rectangle((24, 20, 24 + tw + 28, 20 + ft.size + 22), radius=14, fill=(255, 255, 255))
            d.text((38, 30), title, font=ft, fill=(90, 70, 60))
        im.save(path)
    return path


def hide_sources():
    """Excluye de la capa de vista las colecciones originales: las instancias sí se renderizan."""
    def walk(lc):
        for ch in lc.children:
            if ch.collection.name.startswith('Producto | '):
                ch.exclude = True
            walk(ch)
    walk(bpy.context.view_layer.layer_collection)


def hoja_productos(scene):
    hide_sources()
    coll = clay.collection('Hoja productos')
    names = [n for n, _ in prod.CATALOGO] + [n for n, _ in prod.CAJAS]
    cols = 8
    sp = 0.85
    labels = []
    for i, n in enumerate(names):
        r, cidx = divmod(i, cols)
        x = (cidx - (cols - 1) / 2) * sp
        y = r * sp * 1.05
        s = 1.7 if not n.startswith('caja') else 1.2
        prod.instance(n, (x, y, 0), -0.35, s, coll)
        labels.append((n.replace('caja ', 'caja ').replace('pina', 'piña').replace('brocoli', 'brócoli').replace('lacteos', 'lácteos')
                        .replace('panaderia', 'panadería').replace('cafe', 'café'), (x, y - 0.26, -0.02)))
    rows = (len(names) + cols - 1) // cols
    cy = (rows - 1) * sp * 1.05 / 2
    cam = escena.camera('CAM productos', (0.0, cy - 6.6, 5.6), (0.0, cy + 0.05, 0.1), 42)
    render(scene, cam, '10-productos', 2000, 1500, labels, 'Productos del supermercado')
    coll.hide_render = True
    coll.hide_viewport = True


def hoja_vitrinas(scene, kinds=None):
    hide_sources()
    out = []
    for kind, title, fn in vitrinas.TIPOS:
        if kinds and kind not in kinds:
            continue
        coll = clay.collection(f'Hoja {kind}')
        labels = []
        for lvl in (1, 2, 3):
            x = (lvl - 2) * 2.7
            vitrinas.build(kind, lvl, coll, (x, 0, 0), 0.0)
            labels.append((f'Nivel {lvl}', (x, -0.95, 0.0)))
        cam = escena.camera(f'CAM {kind}', (1.2, -8.6, 4.0), (0.0, 0.0, 0.8), 38)
        out.append(render(scene, cam, f'11-vitrina-{kind}', 1800, 800, labels, title))
        coll.hide_render = True
        coll.hide_viewport = True
    return out


def _grid_sheet(scene, name, title, items, cols, sp, cam_dist, cam_h, lens, size, builder, label_dy=-0.6, scale=1.0):
    coll = clay.collection(f'Hoja {name}')
    labels = []
    rows = (len(items) + cols - 1) // cols
    for i, (label, fn) in enumerate(items):
        r, cidx = divmod(i, cols)
        n_in_row = min(cols, len(items) - r * cols)
        x = (cidx - (n_in_row - 1) / 2) * sp
        y = r * sp * 1.1
        builder(label, fn, coll, (x, y, 0), -0.3, scale)
        labels.append((label, (x, y + label_dy, -0.02)))
    cy = (rows - 1) * sp * 1.1 / 2
    cam = escena.camera(f'CAM {name}', (0.0, cy - cam_dist, cam_h), (0.0, cy + 0.2, 0.35), lens)
    render(scene, cam, name, size[0], size[1], labels, title)
    coll.hide_render = True
    coll.hide_viewport = True


def _row_sheet(scene, name, title, items, sp, builder, size=(2000, 800), elev=0.42, label_dy=-0.62):
    """Una fila de objetos (cada uno con su escala), cámara ajustada al ancho."""
    coll = clay.collection(f'Hoja {name}')
    labels = []
    n = len(items)
    for i, (label, fn, s) in enumerate(items):
        x = (i - (n - 1) / 2) * sp
        builder(label, fn, coll, (x, 0, 0), -0.35, s)
        labels.append((label, (x, label_dy, -0.02)))
    width = n * sp
    dist = width / 0.95 + 0.6
    cam = escena.camera(f'CAM {name}', (0.0, -dist, dist * elev + 0.6), (0.0, 0.0, 0.45), 40)
    render(scene, cam, name, size[0], size[1], labels, title)
    coll.hide_render = True
    coll.hide_viewport = True


def hoja_utileria(scene):
    import utileria
    hide_sources()
    P = dict(utileria.PIEZAS)
    I = dict(utileria.ICONOS)
    b = utileria.build
    _row_sheet(scene, '12a-carritos', 'Carrito de reposición · niveles 1, 2 y 3',
               [('Nivel 1 · 5 reposiciones', P['Carrito N1'], 1.4), ('Nivel 2 · 7 reposiciones', P['Carrito N2'], 1.4),
                ('Nivel 3 · eléctrico', P['Carrito N3'], 1.4)], 2.3, b)
    _row_sheet(scene, '12b-compras-entrada', 'Compras, entrada y reparto',
               [('Canasta', P['Canasta'], 2.2), ('Puesto', P['Puesto de canastas'], 1.3), ('Torniquete', P['Torniquete de entrada'], 1.0),
                ('Carretilla', P['Carretilla de reparto'], 0.95), ('Bolsa', P['Bolsa de compras'], 2.2), ('Dinero', P['Dinero'], 3.0)], 1.5, b)
    _row_sheet(scene, '12c-limpieza', 'Limpieza y problemas del día',
               [('Trapero y balde', P['Trapero y balde'], 1.1), ('Derrame', P['Charco'], 1.5), ('Basura', P['Basura'], 3.5),
                ('Caneca', P['Caneca de reciclaje'], 1.1), ('Piso mojado', P['Piso mojado'], 1.5)], 1.55, b)
    _row_sheet(scene, '12d-decoracion', 'Decoración y seguridad (más paciencia)',
               [('Planta', P['Planta'], 1.3), ('Globos', P['Globos'], 1.0), ('Música', P['Parlante'], 1.3),
                ('Oferta', P['Letrero de oferta'], 1.3), ('Cámara', P['Cámara'], 3.5)], 1.55, b)
    _row_sheet(scene, '12e-maquinas', 'Máquinas de productos preparados',
               [('Malteadas', P['Máquina de malteadas'], 1.0), ('Café', P['Cafetera'], 1.0), ('Horno de pizza', P['Horno de pizza'], 0.9),
                ('Jugos naturales', P['Exprimidor'], 1.0)], 1.9, b)
    _row_sheet(scene, '13-iconos', 'Íconos 3D de la interfaz',
               [(k.replace('Paciencia: ', ''), I[k], 2.4 if k == 'Estrella' else 1.6) for k in I], 1.0, b, size=(2200, 700), elev=0.2, label_dy=-0.35)


scene = clay.reset_scene()
escena.setup_render(scene, 1600, 900, SAMPLES)
scene.view_settings.look = 'AgX - Medium High Contrast'
studio(scene)
prod.build_all()
if 'productos' in SHEETS:
    hoja_productos(scene)
kinds = [s.split(':', 1)[1] for s in SHEETS if s.startswith('vitrinas:')]
if 'vitrinas' in SHEETS or kinds:
    hoja_vitrinas(scene, kinds or None)
if 'utileria' in SHEETS:
    hoja_utileria(scene)
