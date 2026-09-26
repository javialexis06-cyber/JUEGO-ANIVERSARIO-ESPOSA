"""Iluminación, cámaras y escenarios de presentación."""
import math

import bpy
import numpy as np
from mathutils import Vector

import clay


def setup_render(scene, width=1000, height=1000, samples=96, transparent=False):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transparent_max_bounces = 4
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.blur_glossy = 1.0
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparent
    scene.render.image_settings.file_format = 'PNG'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Base Contrast'
    scene.view_settings.exposure = 0.0
    scene.render.fps = 24


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = d.to_track_quat('-Z', 'Y')


def camera(name, location, target, lens=70, coll=None, dof=None):
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = lens
    cam_data.clip_start = 0.05
    cam_data.clip_end = 200
    cam = bpy.data.objects.new(name, cam_data)
    clay.link(cam, coll)
    cam.location = location
    look_at(cam, target)
    if dof:
        cam_data.dof.use_dof = True
        cam_data.dof.focus_distance = (Vector(target) - Vector(location)).length
        cam_data.dof.aperture_fstop = dof
    return cam


def area_light(name, location, target, energy, size=2.0, color='#FFFFFF', coll=None, shape='DISK', size_y=None, spread=180):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = shape
    data.size = size
    if size_y is not None:
        data.size_y = size_y
    data.color = clay.rgb(color)[:3]
    data.spread = math.radians(spread)
    obj = bpy.data.objects.new(name, data)
    clay.link(obj, coll)
    obj.location = location
    look_at(obj, target)
    return obj


def world_color(scene, color='#EDE3D8', strength=0.6):
    world = bpy.data.worlds.new('Mundo') if scene.world is None else scene.world
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = clay.rgb(color)
    bg.inputs['Strength'].default_value = strength


def studio(scene, coll=None, floor_color='#E9E1D6', wall_color='#D9D2C8', platform=True):
    """Estudio neutro con fondo curvo y peana, para comparar con los renders previos."""
    coll = coll or clay.collection('Estudio')
    # Fondo curvo (ciclorama)
    verts, faces = [], []
    W, D, H, R = 30.0, 14.0, 14.0, 4.0
    prof = []
    for i in range(12):
        prof.append((-D + i * (D - R) / 11.0, 0.0))
    for i in range(1, 16):
        a = i / 15 * math.pi / 2
        prof.append(((0 - R) + R * math.sin(a), R - R * math.cos(a)))
    for i in range(1, 12):
        prof.append((0.0, R + i * (H - R) / 11.0))
    for xi, x in enumerate(np.linspace(-W / 2, W / 2, 2)):
        for (y, z) in prof:
            verts.append((x, y + 7.0, z))
    n = len(prof)
    for j in range(n - 1):
        faces.append((j, j + 1, n + j + 1, n + j))
    cyc = clay.make_mesh_object('Estudio | ciclorama', verts, faces, coll)
    grad = clay.material('Estudio | fondo', wall_color, rough=0.9)
    clay.set_material(cyc, grad)
    if platform:
        base = clay.blob('Estudio | peana', (0, 0, -0.07), (2.6, 1.55, 0.07), coll,
                         clay.material('Estudio | peana marfil', '#EFEBE4', rough=0.55, coat=0.2, coat_rough=0.3),
                         n=16, p=6.0, subsurf=2)
        base.modifiers[0].levels = 2
    world_color(scene, '#E8E2DA', 0.35)
    key = area_light('Luz | clave', (-4.0, -5.5, 6.5), (0, 0, 1.3), 900, 4.0, '#FFF1E0', coll)
    fill = area_light('Luz | relleno', (5.0, -4.0, 3.0), (0, 0, 1.3), 280, 5.0, '#E6F0FF', coll)
    rim = area_light('Luz | contraluz', (1.5, 5.0, 5.5), (0, 0, 1.5), 650, 3.0, '#FFE8D0', coll)
    top = area_light('Luz | cenital', (0, -1.0, 8.0), (0, 0, 0), 250, 6.0, '#FFFFFF', coll)
    return coll


def warm_room(scene, coll=None):
    """Sala cálida inspirada en las imágenes de referencia: ventana luminosa a la
    izquierda, arco turquesa a la derecha, planta, estante con plantita y libros y un
    puf tejido; la cámara la desenfoca para que los personajes resalten."""
    coll = coll or clay.collection('Sala')
    M = clay.material
    wall = M('Sala | pared melocoton', '#F4C9AC', rough=0.95, noise=dict(scale=6, strength=0.04, distance=0.05))
    floor_m = M('Sala | piso crema', '#EFCFB3', rough=0.45, coat=0.15, coat_rough=0.35)
    teal = M('Sala | arco turquesa', '#86BFC6', rough=0.9)
    pot = M('Sala | maceta', '#F3EEE7', rough=0.5)
    leaf = M('Sala | hojas', '#5C9A58', rough=0.55, sss=0.2, sss_radius=(0.4, 1.0, 0.3))
    pouf = M('Sala | puf', '#E4C39E', rough=0.95, noise=dict(scale=120, strength=0.35, distance=0.02))
    shelf_m = M('Sala | estante', '#F6EFE6', rough=0.6)
    book1 = M('Sala | libro rosa', '#E6AE98', rough=0.7)
    book2 = M('Sala | libro crema', '#F1DAB2', rough=0.7)
    win = M('Sala | vidrio luz', '#FFF6EA', rough=1.0, emission='#FFF1DE', emission_strength=5.0)

    back_y = 6.0
    clay.make_mesh_object('Sala | piso', [(-25, -25, 0), (25, -25, 0), (25, 25, 0), (-25, 25, 0)], [(0, 1, 2, 3)], coll, material=floor_m)
    clay.make_mesh_object('Sala | pared fondo', [(-25, back_y, 0), (25, back_y, 0), (25, back_y, 14), (-25, back_y, 14)], [(0, 3, 2, 1)], coll, material=wall)
    # Zócalo suave
    clay.blob('Sala | zocalo', (0, back_y - 0.05, 0.12), (25, 0.06, 0.12), coll, shelf_m, n=4, p=6, subsurf=1)
    # Ventana en la pared del fondo (izquierda) con marco blanco y parteluces
    wx0, wx1, wz0, wz1 = -6.2, -2.4, 1.2, 6.0
    clay.make_mesh_object('Sala | ventana', [(wx0, back_y - 0.01, wz0), (wx1, back_y - 0.01, wz0), (wx1, back_y - 0.01, wz1), (wx0, back_y - 0.01, wz1)],
                          [(0, 3, 2, 1)], coll, material=win)
    for x in (wx0, (wx0 + wx1) / 2, wx1):
        clay.blob('Sala | parteluz', (x, back_y - 0.06, (wz0 + wz1) / 2), (0.08, 0.06, (wz1 - wz0) / 2 + 0.08), coll, shelf_m, n=4, p=6)
    for z in (wz0, (wz0 + wz1) / 2, wz1):
        clay.blob('Sala | travesano', ((wx0 + wx1) / 2, back_y - 0.06, z), ((wx1 - wx0) / 2 + 0.08, 0.06, 0.08), coll, shelf_m, n=4, p=6)
    # Arco turquesa (derecha)
    cx, w, h = 3.3, 2.5, 3.2
    pts = [(cx + w / 2 * math.cos(math.pi * i / 24), back_y - 0.02, h + w / 2 * math.sin(math.pi * i / 24)) for i in range(25)]
    verts = [(cx + w / 2, back_y - 0.02, 0)] + pts + [(cx - w / 2, back_y - 0.02, 0)]
    clay.make_mesh_object('Sala | arco', verts, [tuple(reversed(range(len(verts))))], coll, smooth=False, material=teal)
    # Planta grande en maceta (izquierda)
    px, py = -3.0, 3.2

    def pot_shape(v):
        k = 1 - 0.14 * np.clip(-v[:, 2] / 0.7, 0, 1)
        return v * np.stack([k, k, np.ones(len(v))], 1)
    clay.blob('Sala | maceta', (px, py, 0.72), (0.7, 0.7, 0.72), coll, pot, n=10, p=3.5, shaper=pot_shape)
    rng = np.random.default_rng(7)
    for i in range(18):
        ang = rng.uniform(0, 2 * math.pi)
        tilt = rng.uniform(0.35, 1.0)
        length = rng.uniform(1.1, 2.1)
        base = np.array([px, py, 1.35])
        tip = base + np.array([math.cos(ang) * tilt * length * 0.7, math.sin(ang) * tilt * length * 0.7, length])
        mid = (base + tip) / 2 + np.array([0, 0, 0.25])
        clay.sweep('Sala | tallo', [base, mid, tip], 0.02, (1, 1), coll, leaf, samples=5, segments=6, subsurf=0)
        d = (tip - mid) / np.linalg.norm(tip - mid)
        leaf_end = tip + d * 0.55
        clay.sweep('Sala | hoja', [tip - d * 0.02, tip + d * 0.25, leaf_end], [0.12, 0.26, 0.02], (0.14, 1.0), coll, leaf, samples=6,
                   caps=('round', 'point'), up=(math.cos(ang), math.sin(ang), 0.3))
    # Estante con plantita y libros (derecha)
    sx0 = 6.0
    clay.blob('Sala | repisa', (sx0, back_y - 0.45, 1.1), (1.2, 0.45, 1.1), coll, shelf_m, n=6, p=8, subsurf=1)
    clay.blob('Sala | maceta chica', (sx0 - 0.4, back_y - 0.45, 2.45), (0.3, 0.3, 0.26), coll, pot, n=8, p=3)
    for i in range(8):
        ang = i / 8 * 2 * math.pi
        base = np.array([sx0 - 0.4, back_y - 0.45, 2.62])
        tip = base + np.array([math.cos(ang) * 0.38, math.sin(ang) * 0.38, 0.45])
        clay.sweep('Sala | hojita', [base, (base + tip) / 2 + [0, 0, 0.1], tip], [0.02, 0.11, 0.0], (0.25, 1.0), coll, leaf, samples=5,
                   caps=('flat', 'point'), up=(math.cos(ang), math.sin(ang), 0.5))
    clay.blob('Sala | libro', (sx0 + 0.45, back_y - 0.45, 2.55), (0.1, 0.35, 0.36), coll, book1, n=4, p=8)
    clay.blob('Sala | libro', (sx0 + 0.67, back_y - 0.45, 2.5), (0.1, 0.35, 0.31), coll, book2, n=4, p=8)
    # Puf tejido
    clay.blob('Sala | puf', (4.6, 2.6, 0.55), (1.05, 1.05, 0.58), coll, pouf, n=12, p=2.6)

    world_color(scene, '#F5E3D5', 0.32)
    sun = bpy.data.lights.new('Sol | ventana', 'SUN')
    sun.energy = 3.6
    sun.angle = math.radians(8)
    sun.color = clay.rgb('#FFE0BD')[:3]
    so = bpy.data.objects.new('Sol | ventana', sun)
    clay.link(so, coll)
    so.location = (-8, 6, 8)
    look_at(so, (1.5, -1.5, 0))
    area_light('Luz | ventana suave', (-4.3, back_y - 0.6, 3.6), (0, 0, 1.3), 1900, 4.0, '#FFE6CC', coll, shape='RECTANGLE', size_y=4.8)
    area_light('Luz | clave calida', (-4.5, -4.0, 4.5), (0, 0, 1.4), 900, 3.5, '#FFEAD6', coll)
    area_light('Luz | relleno frontal', (1.2, -8.0, 3.0), (0, 0, 1.4), 600, 5.0, '#FFF3E8', coll)
    area_light('Luz | relleno lateral', (6.0, -3.0, 2.5), (0, 0, 1.4), 220, 4.0, '#EAF2FF', coll)
    return coll
