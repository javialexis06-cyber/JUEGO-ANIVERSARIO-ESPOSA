"""Construye la pareja completa (modelos + esqueletos + escenarios) y guarda el .blend.

Uso desde Blender:   blender -b -P construir.py -- [ruta_salida.blend]
Uso con el módulo bpy: python3 construir.py [ruta_salida.blend]
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import el  # noqa: E402
import ella  # noqa: E402
import escena  # noqa: E402
import rig  # noqa: E402

SEPARACION = 0.85  # las raíces quedan en X = -0.85 (Él) y X = +0.85 (Ella)


def build_character(module, x_offset, extra_bones=None, long_hair=False, hair_split_z=None, pants_split_z=0.44):
    coll = clay.collection(f'{module.NAME} | personaje')
    module.build(coll)
    objs = list(coll.objects)
    layout = rig.bone_layout(module.P, module.B, extra_bones)
    arm = rig.build_armature(module.NAME, layout, coll)
    rig.skin(arm, objs, long_hair=long_hair, hair_split_z=hair_split_z, pants_split_z=pants_split_z)
    arm.location.x = x_offset
    return arm, coll


def main(out_path):
    scene = clay.reset_scene()
    escena.setup_render(scene, 1280, 900, 128)
    el_rig, el_coll = build_character(el, -SEPARACION)
    ella_rig, ella_coll = build_character(
        ella, SEPARACION,
        extra_bones={'cabello_largo.L': (-0.7, 0.2, 1.35), 'cabello_largo.R': (0.7, 0.2, 1.35)},
        long_hair=True, hair_split_z=1.25, pants_split_z=0.52)
    sala = escena.warm_room(scene)
    estudio = escena.studio(scene)
    estudio.hide_render = True
    estudio.hide_viewport = True
    cam = escena.camera('CAMARA | pareja', (0.0, -9.0, 1.9), (0.0, 0.0, 1.25), 60, dof=4.0)
    scene.camera = cam
    bpy.ops.wm.save_as_mainfile(filepath=out_path, compress=True)
    print('GUARDADO', out_path)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    out = args[0] if args else os.path.join(HERE, '..', 'modelos', 'pareja-claude.blend')
    main(os.path.abspath(out))
