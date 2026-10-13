"""Nuestro Hogar · granja: los íconos de las herramientas, fotografiados de las piezas de granja_herramientas.py.

Las siete con calidad (azada, hacha, pico, guadaña, espada, caña y regadera) salen en las cinco calidades con los
mismos colores de herramientas3d.ts (`tono`): herr_<tipo>_<nivel>.png. El balde, las tijeras y la bolsita de semillas
salen una vez: obj_cubo_ordeno.png, obj_tijeras_esquila.png y herr_semillas.png. 160 × 160 con fondo transparente;
`juego/web/scripts/granja-v3/iconos-blender.mjs` los pasa a webp en public/modelos/granja-v3/iconos/.

Uso: blender -b -P granja_iconos_herramientas.py -- <carpeta_salida> [herramientas]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
from mathutils import Euler, Matrix, Vector  # noqa: E402

import clay  # noqa: E402
import escena  # noqa: E402
import granja_herramientas as gh  # noqa: E402

# Los mismos tonos de herramientas3d.ts: (color, metal, rugosidad, brillo, color del brillo)
TONOS = [
    {'metal': ('#8f938e', 0.5, 0.6), 'filo': ('#b9bcb6', 0.55, 0.45), 'mango': ('#b88a58', 0, 0.85), 'agarre': ('#8a6d4c', 0, 0.95),
     'adorno': ('#6f5a44', 0, 0.9)},
    {'metal': ('#c8743c', 0.8, 0.32), 'filo': ('#f0a873', 0.85, 0.22), 'mango': ('#9a6a40', 0, 0.75), 'agarre': ('#5f3f2a', 0, 0.85),
     'adorno': ('#e3a066', 0.8, 0.3)},
    {'metal': ('#b9c3c9', 0.85, 0.24), 'filo': ('#eef3f6', 0.9, 0.12), 'mango': ('#6e4a33', 0, 0.7), 'agarre': ('#3b2a22', 0, 0.8),
     'adorno': ('#8a949a', 0.85, 0.3)},
    {'metal': ('#3b4a92', 0.85, 0.2, 0.35, '#1e2c7a'), 'filo': ('#a9c2ff', 0.9, 0.1, 0.4, '#5b7cff'), 'mango': ('#3d2c4f', 0, 0.6),
     'agarre': ('#271b33', 0, 0.7), 'adorno': ('#f2c75a', 0.9, 0.25, 0.3, '#a27a1c')},
    {'metal': ('#3fc4dc', 0.2, 0.06, 0.45, '#0f8fb0'), 'filo': ('#a8f2ff', 0.2, 0.03, 0.6, '#5fe0f5'), 'mango': ('#e9d9b8', 0, 0.45),
     'agarre': ('#b99a6a', 0, 0.55), 'adorno': ('#f2c75a', 0.9, 0.22, 0.3, '#a27a1c')},
]
CON_CALIDAD = ['azada', 'hacha', 'pico', 'guadana', 'espada', 'cana', 'regadera']
SUELTAS = {'cubo': 'obj_cubo_ordeno', 'tijeras': 'obj_tijeras_esquila', 'semillas': 'herr_semillas'}
_mats = {}


def material_nivel(parte, nivel):
    clave = (parte, nivel)
    if clave not in _mats:
        t = TONOS[nivel][parte]
        color, metal, rugoso = t[:3]
        brillo, color_brillo = (t[3], t[4]) if len(t) > 3 else (0.0, None)
        _mats[clave] = clay.material(f'icono {parte} {nivel}', color, rough=rugoso, metallic=metal, coat=0.3 if metal else 0.0,
                                     emission=color_brillo, emission_strength=brillo * 2.5)
    return _mats[clave]


def postura(tipo):
    """Diagonal como en los íconos de antes: mango abajo a la izquierda, cabeza arriba a la derecha y la cara ancha a la
    cámara (que mira desde -y). El mango de las piezas va por +z de Blender."""
    giros = {'regadera': -math.pi / 2}
    for par in os.environ.get('GIROS', '').split(','):
        if ':' in par:
            giros[par.split(':')[0]] = float(par.split(':')[1])
    giro = giros.get(tipo, 0.0)
    inclina = 0.15 if tipo == 'regadera' else -0.75
    if tipo in SUELTAS:
        return Euler((0.3, 0, 0.45), 'XYZ').to_matrix().to_4x4()
    # three.js: g.rotation.y = giro; pivote.rotation = (0.25, 0.35, inclina) → en Blender (x, -z, y)
    adentro = Matrix.Rotation(giro, 4, 'Z')
    afuera = Matrix.Rotation(0.25, 4, 'X') @ Matrix.Rotation(0.35, 4, 'Z') @ Matrix.Rotation(-inclina, 4, 'Y')
    return afuera @ adentro


def foto(scene, coll, tipo, nivel, ruta):
    antes = set(coll.objects)
    gh.PIEZAS['h_' + tipo](coll)
    raiz = bpy.data.objects.new('raiz', None)
    clay.link(raiz, coll)
    nuevos = [o for o in coll.objects if o not in antes and o is not raiz]
    for o in nuevos:
        if o.parent is None:
            o.parent = raiz
        if nivel is not None:
            for slot in o.material_slots:
                nombre = (slot.material.name if slot.material else '').replace('Granja | h ', '')
                if nombre in TONOS[0]:
                    slot.material = material_nivel(nombre, nivel)
    raiz.matrix_world = postura(tipo)
    bpy.context.view_layer.update()
    us, vs = [], []
    for o in nuevos:
        if o.type != 'MESH':
            continue
        for c in o.bound_box:
            q = o.matrix_world @ Vector(c)
            us.append(q.x)
            vs.append(q.z)
    u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
    tam = max(u1 - u0, v1 - v0) * 1.1
    centro = Vector(((u0 + u1) / 2, 0, (v0 + v1) / 2))
    cam = escena.camera('cam icono', tuple(centro + Vector((0, -12, 0))), tuple(centro), 50)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = tam
    scene.camera = cam
    scene.render.filepath = ruta
    bpy.ops.render.render(write_still=True)
    for o in nuevos + [raiz, cam]:
        bpy.data.objects.remove(o, do_unlink=True)
    print('ICONO', os.path.basename(ruta), flush=True)


def main(salida, pedidos=None):
    os.makedirs(salida, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 160, 160, samples=int(os.environ.get('MUESTRAS', 32)), transparent=True)
    luces = clay.collection('Luces iconos')
    escena.area_light('Clave', (-2.4, -3.2, 4.0), (0, 0, 0), 420, 2.4, '#FFF1E2', luces)
    escena.area_light('Relleno', (3.0, -2.2, 1.8), (0, 0, 0), 150, 3.0, '#E4F0FF', luces)
    escena.area_light('Contraluz', (1.0, 3.0, 3.2), (0, 0, 0), 340, 2.0, '#FFE0EC', luces)
    escena.world_color(scene, '#FFFFFF', 0.45)
    try:
        scene.view_settings.look = 'AgX - Punchy'
    except TypeError:
        pass
    coll = clay.collection('Iconos herramientas')
    for tipo in pedidos or CON_CALIDAD + list(SUELTAS):
        if tipo in SUELTAS:
            foto(scene, coll, tipo, None, os.path.join(salida, SUELTAS[tipo] + '.png'))
        else:
            for nivel in ([int(os.environ['NIVEL'])] if os.environ.get('NIVEL') else range(5)):
                foto(scene, coll, tipo, nivel, os.path.join(salida, f'herr_{tipo}_{nivel}.png'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
