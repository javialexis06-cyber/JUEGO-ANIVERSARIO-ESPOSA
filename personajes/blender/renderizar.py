"""Renders de presentación a partir de pareja-claude.blend.

Uso: python3 renderizar.py <archivo.blend> <carpeta_salida> <toma1,toma2,...> [muestras] [escala%]
Tomas disponibles: ver SHOTS al final del archivo.
"""
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import escena  # noqa: E402
import poses  # noqa: E402

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
BLEND, OUT, SHOT_LIST = args[0], args[1], args[2].split(',')
SAMPLES = int(args[3]) if len(args) > 3 else 128
SCALE = int(args[4]) if len(args) > 4 else 100

bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
os.makedirs(OUT, exist_ok=True)

EL = bpy.data.objects['El | RIG']
ELLA = bpy.data.objects['Ella | RIG']
X_EL, X_ELLA = EL.location.x, ELLA.location.x


def show_collection(name, visible):
    c = bpy.data.collections.get(name)
    if c:
        c.hide_render = not visible
        c.hide_viewport = not visible


def set_world(kind):
    if kind == 'sala':
        escena.world_color(scene, '#F5E3D5', 0.32)
        scene.view_settings.look = 'AgX - Medium High Contrast'
    else:
        escena.world_color(scene, '#E8E2DA', 0.35)
        scene.view_settings.look = 'AgX - Base Contrast'


def set_expression(prefix, happy):
    for o in bpy.data.objects:
        if not o.name.startswith(prefix + ' |'):
            continue
        n = o.name
        if 'ojo feliz' in n:
            o.hide_render = not happy
            o.hide_viewport = not happy
        elif ('| ojo ' in n or '| destello' in n):
            o.hide_render = happy
            o.hide_viewport = happy


def reset():
    for r, x in ((EL, X_EL), (ELLA, X_ELLA)):
        r.location = (x, 0, 0)
        r.rotation_euler = (0, 0, 0)
        poses.apply_pose(r, 'reposo')
    set_expression('El', False)
    set_expression('Ella', False)
    for c in ('El | personaje', 'Ella | personaje'):
        show_collection(c, True)
    for o in bpy.data.objects:
        if o.name.startswith('Carrito'):
            o.hide_render = True


def render(name, cam_loc, target, lens, width, height, dof=None):
    cam = escena.camera(f'CAM {name}', cam_loc, target, lens, dof=dof)
    scene.camera = cam
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = SCALE
    scene.cycles.samples = SAMPLES
    scene.render.filepath = os.path.join(OUT, name + '.png')
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDER', name, round(time.time() - t, 1), 's', flush=True)


def room(on=True):
    show_collection('Sala', on)
    show_collection('Estudio', not on)
    set_world('sala' if on else 'estudio')


# ---------------------------------------------------------------------------
# Tomas
# ---------------------------------------------------------------------------

def sala_pareja():
    room(True)
    render('01-pareja-sala', (0.5, -7.9, 1.9), (0.0, 0.0, 1.22), 55, 1280, 900, dof=2.8)


def sala_el():
    room(True)
    show_collection('Ella | personaje', False)
    EL.location.x = 0
    render('02-el-sala', (0.25, -6.7, 1.55), (0.0, 0.0, 1.27), 70, 1254, 1254, dof=2.2)


def sala_el_tq():
    room(True)
    show_collection('Ella | personaje', False)
    EL.location.x = 0
    render('02b-el-sala-tres-cuartos', (2.6, -6.3, 1.7), (0.0, 0.0, 1.27), 70, 1254, 1254, dof=2.2)


def sala_ella():
    room(True)
    show_collection('El | personaje', False)
    ELLA.location.x = 0
    render('03-ella-sala', (0.25, -6.7, 1.55), (0.0, 0.0, 1.27), 70, 1254, 1254, dof=2.2)


def estudio_pareja():
    room(False)
    render('04-pareja-estudio', (0.0, -9.6, 2.4), (0.0, 0.0, 1.22), 55, 1280, 900)


def pareja_feliz():
    room(True)
    set_expression('El', True)
    set_expression('Ella', True)
    poses.apply_pose(EL, 'feliz')
    poses.apply_pose(ELLA, 'saludo')
    render('05-pareja-feliz', (0.5, -7.9, 1.9), (0.0, 0.0, 1.25), 55, 1280, 900, dof=2.8)


def caras():
    room(False)
    render('06-cara-el', (X_EL + 0.0, -4.6, 1.62), (X_EL, 0, 1.6), 85, 1000, 1000)
    render('07-cara-ella', (X_ELLA + 0.0, -4.6, 1.66), (X_ELLA, 0, 1.64), 85, 1000, 1000)


def giro():
    room(False)
    show_collection('Ella | personaje', False)
    for who, r in (('el', EL), ('ella', ELLA)):
        show_collection('El | personaje', who == 'el')
        show_collection('Ella | personaje', who == 'ella')
        r.location.x = 0
        for k, ang in enumerate((0, 45, 90, 180)):
            r.rotation_euler.z = math.radians(ang)
            render(f'giro-{who}-{k}', (0.0, -8.2, 1.7), (0.0, 0.0, 1.25), 70, 700, 900)
        r.rotation_euler.z = 0
        r.location.x = X_EL if who == 'el' else X_ELLA


def giro_el():
    room(False)
    show_collection('Ella | personaje', False)
    EL.location.x = 0
    for k, ang in ((0, 0), (1, 90), (2, 180), (3, 270)):
        EL.rotation_euler.z = math.radians(ang)
        render(f'giro-el-{k}', (0.0, -8.2, 1.7), (0.0, 0.0, 1.25), 70, 700, 900)
    EL.rotation_euler.z = 0


def poses_juego():
    room(False)
    show_collection('Ella | personaje', False)
    EL.location.x = 0
    for pose_name in ('saludo', 'carrito', 'reponer', 'caminar', 'feliz'):
        poses.apply_pose(EL, pose_name)
        render(f'pose-el-{pose_name}', (3.6, -7.2, 2.0), (0.0, 0.0, 1.25), 60, 800, 800)
    poses.apply_pose(EL, 'reposo')


SHOTS = {
    'sala_pareja': sala_pareja, 'sala_el': sala_el, 'sala_el_tq': sala_el_tq, 'sala_ella': sala_ella, 'estudio_pareja': estudio_pareja,
    'pareja_feliz': pareja_feliz, 'caras': caras, 'giro': giro, 'giro_el': giro_el, 'poses': poses_juego,
}

for shot in SHOT_LIST:
    reset()
    SHOTS[shot]()
