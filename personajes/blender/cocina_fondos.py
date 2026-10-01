"""Nuestro Hogar · cocina de chef: los fondos de los tres restaurantes, renderizados en Cycles.

Uso: python3.11 personajes/blender/cocina_fondos.py <salida> [claves...]

Por restaurante (wafles, fresas, frappes):
  fondo_sala_<r>       el comedor donde llegan los invitados (opaco)
  fondo_mostrador_<r>  el mostrador de adelante (con transparencia: va encima de los invitados de la fila)
  fondo_cocina_<r>     la pared de la cocina profesional detrás de las estaciones (azulejos, repisas, ventana)
  fondo_meson_<r>      el mesón donde se trabaja (la cubierta y el frente)
Cada uno sale con su json (puntos: dónde quedó la pizarra del menú, etc., en px de la imagen).
"""
import json
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import clay  # noqa: E402

M = clay.material
RNG = np.random.default_rng

TEMAS = {
    'wafles': dict(pared='#F6D3A2', papel='#F2C589', acento='#E0793A', oscuro='#7A3E1C', piso=('#F3E2C6', '#D99A5B'), madera='#B9773F',
                   meson_top='madera', frente='#E0793A', azulejo='#FFFFFF', banda='#E0793A', lampara='#E0793A'),
    'fresas': dict(pared='#FBD6DE', papel='#F6BFCB', acento='#E2475D', oscuro='#7A1F33', piso=('#FFF4F4', '#F2B9C4'), madera='#E8C6A0',
                   meson_top='marmol', frente='#F49AAC', azulejo='#FFFFFF', banda='#E2475D', lampara='#FFFFFF'),
    'frappes': dict(pared='#CFEDE6', papel='#B4E1D7', acento='#2F9E8F', oscuro='#174A43', piso=('#EEF6F2', '#9FCFC4'), madera='#9C6B44',
                    meson_top='terrazo', frente='#2F9E8F', azulejo='#E9F7F3', banda='#2F9E8F', lampara='#1E3B37'),
}


def caja(nombre, centro, medio, coll, mat, p=8, n=4, subsurf=1):
    return clay.rbox(nombre, centro, medio, coll, mat, p=p, n=n, subsurf=subsurf)


def plano(nombre, verts, coll, mat):
    return clay.make_mesh_object(nombre, verts, [(0, 1, 2, 3)], coll, smooth=False, material=mat)


def preparar(scene, ancho, alto, muestras, transparente=False):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = muestras
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.03
    try:
        scene.cycles.denoiser = 'OPENIMAGEDENOISE'
        scene.cycles.use_denoising = True
    except TypeError:
        scene.cycles.use_denoising = False
        scene.cycles.samples = muestras * 4
    scene.cycles.max_bounces = 6
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transmission_bounces = 4
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.blur_glossy = 1.0
    scene.render.resolution_x, scene.render.resolution_y = ancho, alto
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparente
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA' if transparente else 'RGB'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Punchy'
    w = bpy.data.worlds.new('Mundo')
    scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = clay.rgb('#FFF1E2')
    bg.inputs['Strength'].default_value = 0.35


def camara(nombre, pos, mira, lente=28, coll=None):
    data = bpy.data.cameras.new(nombre)
    data.lens = lente
    data.clip_start = 0.05
    data.clip_end = 100
    cam = bpy.data.objects.new(nombre, data)
    clay.link(cam, coll)
    cam.location = pos
    d = Vector(mira) - Vector(pos)
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = d.to_track_quat('-Z', 'Y')
    bpy.context.scene.camera = cam
    return cam


def luz_area(nombre, pos, mira, energia, tam, color='#FFFFFF', coll=None, forma='DISK', tam_y=None):
    data = bpy.data.lights.new(nombre, 'AREA')
    data.energy = energia
    data.shape = forma
    data.size = tam
    if tam_y:
        data.size_y = tam_y
    data.color = clay.rgb(color)[:3]
    o = bpy.data.objects.new(nombre, data)
    clay.link(o, coll)
    o.location = pos
    d = Vector(mira) - Vector(pos)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('-Z', 'Y')
    return o


def luz_punto(nombre, pos, energia, color='#FFD9A8', radio=0.08, coll=None):
    data = bpy.data.lights.new(nombre, 'POINT')
    data.energy = energia
    data.shadow_soft_size = radio
    data.color = clay.rgb(color)[:3]
    o = bpy.data.objects.new(nombre, data)
    clay.link(o, coll)
    o.location = pos
    return o


def proyectar(cam, punto, ancho, alto):
    from bpy_extras.object_utils import world_to_camera_view
    v = world_to_camera_view(bpy.context.scene, cam, Vector(punto))
    return [round(v.x * ancho, 1), round((1 - v.y) * alto, 1)]


# ---------------------------------------------------------------------------
# Utilería que llena las repisas
# ---------------------------------------------------------------------------

def frasco(coll, x, y, z, r, h, contenido, tapa, rng):
    vidrio = M('vidrio frasco', '#F4FBFF', rough=0.04, transmission=1.0, ior=1.45)
    clay.lathe('frasco', [(0, 0), (r * 0.95, 0), (r, 0.01), (r, h * 0.9), (r * 0.8, h), (0, h)], coll, vidrio, segments=24).location = (x, y, z)
    clay.lathe('contenido', [(0, 0.005), (r * 0.93, 0.005), (r * 0.93, h * rng.uniform(0.45, 0.8)), (0, h * 0.6)], coll,
               M(f'contenido {contenido}', contenido, rough=0.7), segments=24).location = (x, y, z)
    clay.lathe('tapa', [(0, h), (r * 0.85, h), (r * 0.88, h + 0.025), (0, h + 0.03)], coll, M(f'tapa {tapa}', tapa, rough=0.35, coat=0.4),
               segments=24).location = (x, y, z)


def olla(coll, x, y, z, r, color, mango=True):
    cobre = M(f'olla {color}', color, rough=0.25, metallic=1.0)
    clay.lathe('olla', [(0, 0), (r * 0.9, 0), (r, r * 0.1), (r, r * 0.7), (r * 1.04, r * 0.72), (r * 0.97, r * 0.72), (r * 0.95, r * 0.12), (0, r * 0.1)], coll,
               cobre, segments=32, cap_top=False).location = (x, y, z)
    if mango:
        clay.sweep('mango olla', [(x + r, y, z + r * 0.6), (x + r * 1.6, y, z + r * 0.68), (x + r * 2.1, y, z + r * 0.75)], r * 0.08, (1, 1), coll,
                   M('mango negro', '#202020', rough=0.4), segments=8)


def sarten_colgado(coll, x, y, z, r, color):
    m = M(f'sartén {color}', color, rough=0.3, metallic=1.0)
    o = clay.lathe('sartén', [(0, 0), (r, 0), (r * 1.05, r * 0.25), (r * 1.0, r * 0.25), (r * 0.95, r * 0.03), (0, r * 0.03)], coll, m, segments=32)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (x, y, z)
    clay.sweep('mango sartén', [(x, y - 0.01, z + r), (x, y - 0.01, z + r * 2.2)], r * 0.09, (1, 1), coll, M('mango negro', '#202020', rough=0.4),
               segments=8)
    clay.sweep('gancho', [(x, y + 0.01, z + r * 2.2), (x, y + 0.02, z + r * 2.6)], 0.004, (1, 1), coll, M('gancho', '#9AA3A8', rough=0.3, metallic=1),
               segments=6)


def planta(coll, x, y, z, tam, rng, maceta='#E9E2D8'):
    hoja = M('hoja planta', '#4F9A4C', rough=0.5, sss=0.2, sss_radius=(0.3, 1, 0.3))
    clay.lathe('maceta', [(0, 0), (tam * 0.35, 0), (tam * 0.45, tam * 0.55), (tam * 0.48, tam * 0.6), (0, tam * 0.58)], coll,
               M(f'maceta {maceta}', maceta, rough=0.6), segments=24).location = (x, y, z)
    for k in range(11):
        a = rng.uniform(0, 2 * math.pi)
        inc = rng.uniform(0.3, 1.0)
        L = tam * rng.uniform(0.6, 1.1)
        base = np.array([x, y, z + tam * 0.55])
        tip = base + np.array([math.cos(a) * inc * L * 0.6, math.sin(a) * inc * L * 0.6, L * (1 - inc * 0.4)])
        clay.sweep('hoja', [base, (base + tip) / 2 + np.array([0, 0, L * 0.12]), tip], [tam * 0.02, tam * 0.12, tam * 0.01], (0.18, 1.0), coll, hoja,
                   segments=6, samples=4, caps=('flat', 'point'), up=(math.cos(a), math.sin(a), 0.4))


def cuadro(coll, x, y, z, w, h, color, marco='#7A4A2A', rot_x=math.pi / 2):
    caja('marco', (x, y, z), (w / 2 + 0.03, 0.02, h / 2 + 0.03), coll, M(f'marco {marco}', marco, rough=0.5), p=6)
    caja('lámina', (x, y - 0.021, z), (w / 2, 0.003, h / 2), coll, M(f'lámina {color}', color, rough=0.7), p=8, subsurf=0)


# ---------------------------------------------------------------------------
# El comedor (sala de pedidos)
# ---------------------------------------------------------------------------

def construir_sala(coll, tema, receta):
    T = TEMAS[tema]
    rng = RNG(len(receta) * 7)
    fondo_y = 5.2
    ancho = 16.0
    pared = M('pared', T['pared'], rough=0.9, noise=dict(scale=8, strength=0.05, distance=0.03))
    papel = M('papel colgadura', T['papel'], rough=0.85, wave=dict(scale=7, strength=0.0, axis='X', distortion=0))
    madera = M('madera', T['madera'], rough=0.55, wave=dict(scale=4, strength=0.12, axis='Z', distortion=5))
    # Piso de baldosas en damero
    c1, c2 = T['piso']
    piso_a, piso_b = M('piso a', c1, rough=0.35, coat=0.3), M('piso b', c2, rough=0.35, coat=0.3)
    plano('piso', [(-ancho / 2, -2, 0), (ancho / 2, -2, 0), (ancho / 2, fondo_y, 0), (-ancho / 2, fondo_y, 0)], coll, piso_a)
    t = 0.6
    for i in range(int(ancho / t)):
        for j in range(int((fondo_y + 2) / t)):
            if (i + j) % 2:
                x0, y0 = -ancho / 2 + i * t, -2 + j * t
                plano('baldosa', [(x0, y0, 0.001), (x0 + t, y0, 0.001), (x0 + t, y0 + t, 0.001), (x0, y0 + t, 0.001)], coll, piso_b)
    # Pared del fondo: friso de madera abajo, papel con rayas arriba, cornisa
    plano('pared', [(-ancho / 2, fondo_y, 0), (ancho / 2, fondo_y, 0), (ancho / 2, fondo_y, 4.2), (-ancho / 2, fondo_y, 4.2)], coll, pared)
    for k in range(int(ancho / 0.36)):
        x = -ancho / 2 + k * 0.36
        plano('raya', [(x, fondo_y - 0.002, 1.1), (x + 0.15, fondo_y - 0.002, 1.1), (x + 0.15, fondo_y - 0.002, 4.2), (x, fondo_y - 0.002, 4.2)], coll, papel)
    caja('friso', (0, fondo_y - 0.03, 0.55), (ancho / 2, 0.03, 0.55), coll, madera, p=10, subsurf=0)
    for k in range(int(ancho / 0.9)):
        x = -ancho / 2 + 0.45 + k * 0.9
        caja('panel', (x, fondo_y - 0.065, 0.55), (0.36, 0.01, 0.4), coll, M('panel madera', T['madera'], rough=0.45), p=5, subsurf=1)
    caja('moldura', (0, fondo_y - 0.07, 1.12), (ancho / 2, 0.05, 0.035), coll, M('moldura', '#FFF6EA', rough=0.4), p=6, subsurf=0)
    caja('cornisa', (0, fondo_y - 0.06, 4.0), (ancho / 2, 0.08, 0.06), coll, M('moldura', '#FFF6EA', rough=0.4), p=6, subsurf=0)
    caja('zócalo', (0, fondo_y - 0.07, 0.05), (ancho / 2, 0.05, 0.05), coll, M('zócalo', T['oscuro'], rough=0.5), p=6, subsurf=0)
    # Ventanas con luz de día y cortinas
    cielo = M('cielo', '#DDF2FF', rough=1.0, emission='#E8F6FF', emission_strength=3.0)
    for vx in (-4.6, 4.2):
        plano('vidrio ventana', [(vx - 0.85, fondo_y - 0.01, 1.4), (vx + 0.85, fondo_y - 0.01, 1.4), (vx + 0.85, fondo_y - 0.01, 3.2),
                                 (vx - 0.85, fondo_y - 0.01, 3.2)], coll, cielo)
        marco = M('marco ventana', '#FFFFFF', rough=0.4)
        for x in (vx - 0.85, vx, vx + 0.85):
            caja('parteluz', (x, fondo_y - 0.04, 2.3), (0.04, 0.04, 0.95), coll, marco, p=6, subsurf=0)
        for z in (1.4, 2.3, 3.2):
            caja('travesaño', (vx, fondo_y - 0.04, z), (0.9, 0.04, 0.04), coll, marco, p=6, subsurf=0)
        caja('repisa ventana', (vx, fondo_y - 0.12, 1.36), (1.0, 0.12, 0.03), coll, marco, p=6, subsurf=0)
        planta(coll, vx - 0.5, fondo_y - 0.15, 1.39, 0.35, rng)
        planta(coll, vx + 0.5, fondo_y - 0.15, 1.39, 0.3, rng, maceta=T['acento'])
        tela = M('cortina', T['acento'], rough=0.9, ribs=dict(scale=30, strength=0.5, axis='X', distance=0.02))
        for s in (-1, 1):
            clay.blob('cortina', (vx + s * 1.05, fondo_y - 0.15, 2.4), (0.22, 0.06, 1.0), coll, tela, n=8,
                      shaper=lambda v: v + np.column_stack([np.sin(v[:, 2] * 3) * 0.04, np.zeros(len(v)), np.zeros(len(v))]))
        caja('barra cortina', (vx, fondo_y - 0.15, 3.42), (1.35, 0.02, 0.02), coll, M('barra', '#C9A24A', rough=0.3, metallic=1), p=4, subsurf=0)
    # La pizarra del menú (en blanco: el juego escribe encima)
    caja('marco pizarra', (0, fondo_y - 0.05, 2.65), (1.35, 0.04, 0.72), coll, madera, p=8)
    caja('pizarra', (0, fondo_y - 0.095, 2.65), (1.22, 0.01, 0.6), coll, M('pizarra', '#2F3B36', rough=0.85, noise=dict(scale=40, strength=0.1)), p=10,
         subsurf=0)
    for k in range(5):
        clay.blob('tiza', (-0.6 + k * 0.08, fondo_y - 0.12, 2.0), (0.025, 0.008, 0.008), coll, M('tiza', ['#FFFFFF', '#FFD3E0', '#FFE7A0', '#BDE7FF', '#C8F2C0'][k], rough=0.9),
                  n=4)
    caja('repisita tiza', (0, fondo_y - 0.11, 1.97), (1.2, 0.03, 0.012), coll, madera, p=6, subsurf=0)
    pizarra = [(-1.22, fondo_y - 0.1, 3.25), (1.22, fondo_y - 0.1, 2.05)]
    # Cuadros y repisas con cosas
    cuadro(coll, -2.4, fondo_y - 0.02, 2.7, 0.7, 0.5, T['acento'])
    cuadro(coll, 2.35, fondo_y - 0.02, 2.75, 0.55, 0.7, T['papel'])
    cuadro(coll, -2.25, fondo_y - 0.02, 1.85, 0.4, 0.4, '#FFF4E0')
    for rx in (-6.6, 6.6):
        caja('repisa', (rx, fondo_y - 0.15, 2.0), (0.7, 0.15, 0.025), coll, madera, p=6, subsurf=0)
        for k in range(4):
            frasco(coll, rx - 0.5 + k * 0.33, fondo_y - 0.15, 2.025, 0.08, 0.22, ['#F3DEA6', '#E2304A', '#6B4228', '#F6F1E7'][k], T['acento'], rng)
    # Lámparas colgantes con luz cálida
    for lx in (-3.3, 0.0, 3.3):
        clay.sweep('cable', [(lx, fondo_y - 1.2, 4.2), (lx, fondo_y - 1.2, 3.55)], 0.006, (1, 1), coll, M('cable', '#222222', rough=0.5), segments=6)
        clay.lathe('pantalla', [(0.0, 3.55), (0.05, 3.55), (0.3, 3.25), (0.29, 3.24), (0.04, 3.53), (0.0, 3.53)], coll,
                   M('pantalla', T['lampara'], rough=0.3, coat=0.5), segments=32).location = (lx, fondo_y - 1.2, 0)
        clay.blob('bombillo', (lx, fondo_y - 1.2, 3.3), (0.06, 0.06, 0.06), coll, M('bombillo', '#FFF2D0', rough=0.2, emission='#FFE2A8', emission_strength=25), n=6)
        luz_punto('lámpara', (lx, fondo_y - 1.2, 3.2), 120, '#FFD9A8', 0.1, coll)
    # Mesitas y sillas de la zona de espera (izquierda) y la puerta (derecha)
    for k, mx in enumerate((-5.4, -3.6, -1.8)):
        my = fondo_y - 1.4 - (k % 2) * 0.3
        clay.lathe('mesa', [(0, 0), (0.25, 0), (0.08, 0.05), (0.04, 0.7), (0.38, 0.72), (0.4, 0.75), (0, 0.76)], coll,
                   M('mesa', '#FFF6EA', rough=0.3, coat=0.4), segments=32).location = (mx, my, 0)
        clay.blob('mantel', (mx, my, 0.765), (0.42, 0.42, 0.01), coll, M('mantel', T['acento'], rough=0.8), n=8)
        clay.blob('florero', (mx, my, 0.83), (0.04, 0.04, 0.07), coll, M('florero', '#FFFFFF', rough=0.2, coat=0.6), n=6)
        for f in range(3):
            clay.blob('flor', (mx - 0.03 + f * 0.03, my, 0.95 + f % 2 * 0.03), (0.03, 0.03, 0.03), coll, M('flor', ['#FF8FB8', '#FFD23F', '#FF6B6B'][f], rough=0.6), n=5)
        for s in (-1, 1):
            sx = mx + s * 0.55
            caja('asiento', (sx, my, 0.45), (0.2, 0.2, 0.03), coll, madera, p=5)
            caja('espaldar', (sx + s * 0.18, my, 0.75), (0.03, 0.2, 0.28), coll, madera, p=5)
            for dx in (-0.16, 0.16):
                for dy in (-0.16, 0.16):
                    caja('pata', (sx + dx, my + dy, 0.22), (0.018, 0.018, 0.22), coll, madera, p=4, subsurf=0)
    caja('marco puerta', (6.4, fondo_y - 0.05, 1.3), (0.75, 0.06, 1.35), coll, M('marco puerta', T['oscuro'], rough=0.5), p=8)
    caja('puerta', (6.4, fondo_y - 0.08, 1.25), (0.62, 0.03, 1.25), coll, madera, p=8)
    plano('vidrio puerta', [(6.0, fondo_y - 0.12, 1.4), (6.8, fondo_y - 0.12, 1.4), (6.8, fondo_y - 0.12, 2.3), (6.0, fondo_y - 0.12, 2.3)], coll, cielo)
    clay.blob('perilla', (5.92, fondo_y - 0.13, 1.2), (0.04, 0.04, 0.04), coll, M('perilla', '#E8B23A', rough=0.2, metallic=1), n=5)
    caja('letrero abierto', (6.4, fondo_y - 0.14, 2.6), (0.42, 0.01, 0.12), coll, M('abierto', '#FFFFFF', rough=0.4), p=6)
    caja('letrero rojo', (6.4, fondo_y - 0.15, 2.6), (0.36, 0.01, 0.07), coll, M('abierto rojo', T['acento'], rough=0.4, emission=T['acento'], emission_strength=1.2),
         p=6)
    planta(coll, -7.2, fondo_y - 0.6, 0, 1.1, rng)
    planta(coll, 7.4, fondo_y - 0.8, 0, 1.0, rng, maceta=T['acento'])
    # Luces
    luz_area('ventana izq', (-4.6, fondo_y - 0.6, 2.3), (-4.6, 0, 1.0), 900, 1.8, '#EAF4FF', coll, 'RECTANGLE', 1.8)
    luz_area('ventana der', (4.2, fondo_y - 0.6, 2.3), (4.2, 0, 1.0), 900, 1.8, '#EAF4FF', coll, 'RECTANGLE', 1.8)
    luz_area('relleno', (0, -3.0, 3.0), (0, fondo_y, 1.5), 1600, 6.0, '#FFF0DE', coll)
    luz_area('cenital', (0, 2.0, 4.6), (0, 2.0, 0), 500, 5.0, '#FFF6EA', coll)
    return {'pizarra': pizarra}


def construir_mostrador(coll, tema):
    """El mostrador de adelante: cubierta de piedra o madera, frente con paneles del color de la casa y una vitrinita."""
    T = TEMAS[tema]
    ancho = 16.0
    frente = M('frente mostrador', T['frente'], rough=0.35, coat=0.6, coat_rough=0.1)
    if T['meson_top'] == 'madera':
        top = M('cubierta', '#C68A52', rough=0.4, coat=0.5, wave=dict(scale=3, strength=0.12, axis='X', distortion=6))
    elif T['meson_top'] == 'marmol':
        top = M('cubierta', '#F8F6F4', rough=0.15, coat=0.8, wave=dict(scale=1.6, strength=0.05, axis='X', distortion=12))
    else:
        top = M('cubierta', '#EEF2EF', rough=0.25, coat=0.6, noise=dict(scale=60, strength=0.2))
    caja('cubierta', (0, 0.3, 1.0), (ancho / 2, 0.42, 0.04), coll, top, p=10, n=5, subsurf=1)
    caja('cuerpo', (0, 0.32, 0.5), (ancho / 2 - 0.05, 0.36, 0.5), coll, frente, p=10, subsurf=0)
    moldura = M('moldura mostrador', '#FFF6EA', rough=0.35, coat=0.4)
    for k in range(int(ancho / 1.1)):
        x = -ancho / 2 + 0.55 + k * 1.1
        caja('panel', (x, -0.045, 0.52), (0.44, 0.012, 0.32), coll, M('panel frente', T['frente'], rough=0.3, coat=0.6), p=5, subsurf=1)
        caja('filo panel', (x, -0.04, 0.52), (0.47, 0.008, 0.35), coll, moldura, p=5, subsurf=1)
    caja('zócalo', (0, -0.02, 0.05), (ancho / 2, 0.03, 0.05), coll, M('zócalo', T['oscuro'], rough=0.5), p=6, subsurf=0)
    caja('borde dorado', (0, -0.12, 0.955), (ancho / 2, 0.012, 0.012), coll, M('borde dorado', '#D9A84A', rough=0.25, metallic=1), p=4, subsurf=0)
    luz_area('clave', (-3, -4, 3.5), (0, 0.3, 0.6), 1800, 5, '#FFF2E2', coll)
    luz_area('relleno', (4, -3, 1.5), (0, 0.3, 0.6), 500, 4, '#EEF4FF', coll)
    luz_area('arriba', (0, 0.3, 4), (0, 0.3, 0), 600, 8, '#FFFFFF', coll)
    return {}


# ---------------------------------------------------------------------------
# La cocina (detrás de las estaciones) y el mesón
# ---------------------------------------------------------------------------

def construir_cocina(coll, tema):
    T = TEMAS[tema]
    rng = RNG(3 + len(tema))
    ancho = 14.0
    fondo_y = 1.4
    # Pared de azulejos tipo metro con boquilla, y una banda de color
    boquilla = M('boquilla', '#D9D4CC', rough=0.9)
    plano('pared base', [(-ancho / 2, fondo_y + 0.01, 0.9), (ancho / 2, fondo_y + 0.01, 0.9), (ancho / 2, fondo_y + 0.01, 4.0), (-ancho / 2, fondo_y + 0.01, 4.0)],
          coll, boquilla)
    azulejo = M('azulejo', T['azulejo'], rough=0.12, coat=0.8, coat_rough=0.05)
    banda = M('azulejo banda', T['banda'], rough=0.12, coat=0.8, coat_rough=0.05)
    aw, ah = 0.3, 0.15
    filas = int(2.6 / ah)
    for j in range(filas):
        z = 0.9 + j * ah
        off = (j % 2) * aw / 2
        mat = banda if j in (7, 8) else azulejo
        for i in range(int(ancho / aw) + 2):
            x = -ancho / 2 - aw + i * aw + off
            caja('azulejo', (x + aw / 2, fondo_y, z + ah / 2), (aw / 2 - 0.006, 0.012, ah / 2 - 0.006), coll, mat, p=5, n=3, subsurf=1)
    plano('pared alta', [(-ancho / 2, fondo_y, 3.5), (ancho / 2, fondo_y, 3.5), (ancho / 2, fondo_y, 5), (-ancho / 2, fondo_y, 5)], coll,
          M('pared alta', T['pared'], rough=0.9))
    # Repisas de madera con frascos, ollas y matas
    madera = M('repisa madera', T['madera'], rough=0.5, wave=dict(scale=4, strength=0.1, axis='X', distortion=5))
    for rx, rz in ((-4.6, 2.45), (4.6, 2.45), (-4.6, 3.15), (4.6, 3.15)):
        caja('repisa', (rx, fondo_y - 0.14, rz), (1.25, 0.14, 0.025), coll, madera, p=6, subsurf=0)
        for s in (-1, 1):
            caja('escuadra', (rx + s * 1.0, fondo_y - 0.06, rz - 0.08), (0.02, 0.06, 0.08), coll, M('escuadra', '#3A3A3A', rough=0.4, metallic=0.6), p=4, subsurf=0)
        for k in range(5):
            x = rx - 1.0 + k * 0.5
            if (k + int(rz * 10)) % 3 == 0:
                olla(coll, x, fondo_y - 0.14, rz + 0.025, 0.12, rng.choice(['#C77B4A', '#D9DEE2', '#B87333']))
            elif (k + int(rz * 10)) % 3 == 1:
                frasco(coll, x, fondo_y - 0.14, rz + 0.025, 0.08, 0.24, rng.choice(['#F3DEA6', '#E2304A', '#6B4228', '#F6F1E7', '#8C5A33']), T['acento'], rng)
            else:
                planta(coll, x, fondo_y - 0.14, rz + 0.025, 0.28, rng, maceta=rng.choice(['#FFFFFF', T['acento'], '#E9E2D8']))
    # Barra de utensilios con sartenes colgando
    caja('barra utensilios', (0, fondo_y - 0.06, 2.85), (2.2, 0.015, 0.015), coll, M('barra', '#B9C0C5', rough=0.25, metallic=1), p=4, subsurf=0)
    for k, x in enumerate(np.linspace(-1.9, 1.9, 6)):
        if k % 2:
            sarten_colgado(coll, x, fondo_y - 0.08, 2.25, 0.16, ['#C77B4A', '#2A2A2C', '#D9DEE2'][k % 3])
        else:
            clay.sweep('utensilio', [(x, fondo_y - 0.07, 2.85), (x, fondo_y - 0.07, 2.5)], 0.008, (1, 1), coll, M('utensilio', '#D9DEE2', rough=0.25, metallic=1),
                       segments=6)
            clay.blob('cabeza utensilio', (x, fondo_y - 0.075, 2.45), (0.05, 0.012, 0.07), coll, M('utensilio', '#D9DEE2', rough=0.25, metallic=1), n=5)
    # Ventanita alta con luz
    cielo = M('cielo cocina', '#E3F4FF', rough=1.0, emission='#E8F6FF', emission_strength=2.5)
    plano('ventana', [(-0.7, fondo_y - 0.005, 3.55), (0.7, fondo_y - 0.005, 3.55), (0.7, fondo_y - 0.005, 4.3), (-0.7, fondo_y - 0.005, 4.3)], coll, cielo)
    for x in (-0.7, 0, 0.7):
        caja('marco v', (x, fondo_y - 0.03, 3.925), (0.03, 0.03, 0.4), coll, M('marco blanco', '#FFFFFF', rough=0.4), p=4, subsurf=0)
    # Letrero con el ícono del restaurante
    caja('letrero', (0, fondo_y - 0.05, 3.2), (0.75, 0.03, 0.22), coll, M('letrero', T['oscuro'], rough=0.4), p=6)
    caja('letrero borde', (0, fondo_y - 0.07, 3.2), (0.7, 0.01, 0.17), coll, M('letrero claro', T['acento'], rough=0.3, emission=T['acento'], emission_strength=0.6), p=6)
    # Luces de cocina
    for lx in (-3.0, 3.0):
        clay.lathe('lámpara', [(0.0, 4.2), (0.04, 4.2), (0.22, 3.98), (0.0, 3.99)], coll, M('lámpara cocina', '#2A2A2C', rough=0.4, metallic=0.5),
                   segments=24).location = (lx, fondo_y - 0.9, 0)
        luz_punto('foco', (lx, fondo_y - 0.9, 3.9), 160, '#FFE0B0', 0.1, coll)
    luz_area('ventana', (0, fondo_y - 0.8, 3.9), (0, 0, 2.0), 300, 1.4, '#EAF4FF', coll)
    luz_area('relleno', (0, -5, 2.8), (0, fondo_y, 2.2), 2600, 8, '#FFF2E2', coll)
    return {}


def construir_meson(coll, tema):
    """El mesón de trabajo: cubierta (acero, madera o mármol) y el frente con cajones y tiradores."""
    T = TEMAS[tema]
    ancho = 14.0
    if tema == 'wafles':
        top = M('cubierta meson', '#C9CED2', rough=0.28, metallic=1.0, ribs=dict(scale=900, strength=0.05, axis='X', distance=0.0003))
    elif tema == 'fresas':
        top = M('cubierta meson', '#F6F4F2', rough=0.12, coat=0.8, wave=dict(scale=1.4, strength=0.04, axis='X', distortion=14))
    else:
        top = M('cubierta meson', '#F0EDE6', rough=0.3, coat=0.5, noise=dict(scale=90, strength=0.25))
    caja('cubierta', (0, 0.6, 0.92), (ancho / 2, 0.62, 0.035), coll, top, p=12, n=5, subsurf=1)
    frente = M('frente meson', T['frente'] if tema != 'wafles' else '#B9C0C5', rough=0.35, coat=0.5, metallic=0.0 if tema != 'wafles' else 0.9)
    caja('frente', (0, 0.62, 0.45), (ancho / 2, 0.6, 0.45), coll, frente, p=12, subsurf=0)
    tirador = M('tirador', '#E2E6E9', rough=0.2, metallic=1)
    for k in range(int(ancho / 1.0)):
        x = -ancho / 2 + 0.5 + k * 1.0
        caja('cajón', (x, -0.0, 0.68), (0.46, 0.015, 0.17), coll, M('cajón', T['frente'] if tema != 'wafles' else '#C8CED2', rough=0.3, coat=0.5,
                                                                  metallic=0.0 if tema != 'wafles' else 0.9), p=6)
        caja('puerta', (x, -0.0, 0.28), (0.46, 0.015, 0.2), coll, M('puerta meson', T['frente'] if tema != 'wafles' else '#C8CED2', rough=0.3, coat=0.5,
                                                                    metallic=0.0 if tema != 'wafles' else 0.9), p=6)
        clay.sweep('tirador', [(x - 0.12, -0.03, 0.68), (x + 0.12, -0.03, 0.68)], 0.011, (1, 1), coll, tirador, segments=8)
        clay.sweep('tirador', [(x - 0.12, -0.03, 0.42), (x + 0.12, -0.03, 0.42)], 0.011, (1, 1), coll, tirador, segments=8)
    caja('canto', (0, -0.03, 0.885), (ancho / 2, 0.02, 0.012), coll, M('canto', T['acento'], rough=0.3), p=4, subsurf=0)
    luz_area('clave', (-3, -3.5, 3.2), (0, 0.4, 0.8), 1500, 5, '#FFF2E2', coll)
    luz_area('arriba', (0, 0.6, 3.5), (0, 0.6, 0), 900, 8, '#FFFFFF', coll)
    luz_area('relleno', (4, -2, 1.2), (0, 0.4, 0.6), 400, 4, '#EEF4FF', coll)
    return {}


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

def render(clave, construir, cam_pos, cam_mira, lente, ancho, alto, muestras, salida, transparente=False):
    scene = clay.reset_scene()
    preparar(scene, ancho, alto, muestras, transparente)
    coll = clay.collection('Escena')
    datos = construir(coll) or {}
    cam = camara('cam', cam_pos, cam_mira, lente, clay.collection('Camara'))
    bpy.context.view_layer.update()
    info = {}
    if 'pizarra' in datos:
        a, b = datos['pizarra']
        info['puntos'] = {'pizarra_a': proyectar(cam, a, ancho, alto), 'pizarra_b': proyectar(cam, b, ancho, alto)}
    scene.render.filepath = os.path.join(salida, f'{clave}.png')
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    with open(os.path.join(salida, f'{clave}.json'), 'w') as f:
        json.dump(info, f)
    print(f'{clave}: {ancho}x{alto} en {time.time() - t0:.1f} s', flush=True)


def catalogo():
    L = []
    for r in TEMAS:
        L.append((f'fondo_sala_{r}', lambda c, r=r: construir_sala(c, r, r), (0, -1.2, 1.55), (0, 5.2, 1.75), 24, 1800, 820, 64, False))
        L.append((f'fondo_mostrador_{r}', lambda c, r=r: construir_mostrador(c, r), (0, -3.2, 1.75), (0, 0.3, 0.6), 30, 1800, 340, 48, True))
        L.append((f'fondo_cocina_{r}', lambda c, r=r: construir_cocina(c, r), (0, -4.2, 2.1), (0, 1.4, 2.45), 30, 1800, 700, 64, False))
        L.append((f'fondo_meson_{r}', lambda c, r=r: construir_meson(c, r), (0, -2.8, 2.2), (0, 0.4, 0.55), 30, 1800, 420, 48, True))
    return L


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    salida = os.path.abspath(argv[0] if argv else 'juego/web/modelos-crudos/cocina')
    os.makedirs(salida, exist_ok=True)
    pedidas = argv[1:]
    for clave, f, pos, mira, lente, w, h, muestras, transp in catalogo():
        if pedidas and not any(clave == q or (q.endswith('*') and clave.startswith(q[:-1])) for q in pedidas):
            continue
        try:
            render(clave, f, pos, mira, lente, w, h, muestras, salida, transp)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f'{clave}: FALLÓ {e}', flush=True)


if __name__ == '__main__':
    main()
