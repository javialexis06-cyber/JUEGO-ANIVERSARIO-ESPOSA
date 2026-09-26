"""Render rápido de iteración.

Uso:  python3 probar.py el frente,tres_cuartos 600 32 /ruta/salida
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

import clay  # noqa: E402
import escena  # noqa: E402

args = [a for a in sys.argv[sys.argv.index('--') + 1:]] if '--' in sys.argv else sys.argv[1:]
who = args[0] if args else 'el'
views = (args[1] if len(args) > 1 else 'frente').split(',')
res = int(args[2]) if len(args) > 2 else 600
samples = int(args[3]) if len(args) > 3 else 32
out = args[4] if len(args) > 4 else '/tmp'

scene = clay.reset_scene()
escena.setup_render(scene, res, res, samples)
escena.studio(scene, platform=False)

if who == 'el_cabeza':
    # Iteración rápida del cabello y el rostro: omite el cuerpo SDF
    import el
    el.shirt = el.arms = el.pants = el.shoes = lambda coll, mats: []
    c = el.build()
    who = 'el'
if who in ('el', 'pareja'):
    import el
    c = el.build()
if who in ('ella', 'pareja'):
    import ella
    c = ella.build()

VIEWS = {
    'frente': ((0, -7.6, 1.4), (0, 0, 1.27), 85),
    'cara': ((0, -5.0, 1.62), (0, 0, 1.58), 80),
    'cara_tq': ((3.0, -4.2, 1.9), (0, 0, 1.6), 80),
    'tres_cuartos': ((4.2, -6.3, 2.0), (0, 0, 1.27), 85),
    'tres_cuartos_izq': ((-4.2, -6.3, 2.0), (0, 0, 1.27), 85),
    'lado': ((7.6, 0, 1.4), (0, 0, 1.27), 85),
    'atras': ((2.0, 7.4, 2.0), (0, 0, 1.27), 85),
    'arriba': ((0, -5.2, 5.2), (0, 0, 1.5), 85),
    'cuerpo': ((0, -4.2, 0.75), (0, 0, 0.55), 85),
    'cuerpo_tq': ((2.4, -3.6, 0.95), (0, 0, 0.55), 85),
}
for v in views:
    loc, tgt, lens = VIEWS[v]
    cam = escena.camera(f'cam {v}', loc, tgt, lens)
    scene.camera = cam
    scene.render.filepath = os.path.join(out, f'{who}_{v}.png')
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDER', v, round(time.time() - t, 1), 's')
