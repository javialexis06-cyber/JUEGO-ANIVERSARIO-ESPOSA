"""Nuestro Hogar · granja: la cría de unicornio de «La cría que no quiere hablar» (T03, docs/en-obra/pelicula-de-astra.md).

  cria_unicornio   potrillo de peluche: cabeza grande y redonda, cuerpo gordito, patas cortas con cascos lila,
                   ojos enormes, cachetes rosados, crin y cola de colores pastel y un cuernito nacarado que apenas
                   está brotando (con su espiral)

Mira hacia -y (en el juego, hacia la cámara). Un solo GLB: granja_cria.glb.
Uso: blender -b -P granja_cria.py -- <carpeta_salida>
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
from regalos import laca, luz, tela  # noqa: E402

PASTEL = ('#F6A9C8', '#C7B2F0', '#A8E3CF', '#A9D3F5', '#FBE3A0')


def m_cria_unicornio(coll):
    pelo = tela('pelaje cría', '#FBF5F1')
    claro = tela('pelaje cría claro', '#FFFFFF')
    hocico = tela('hocico cría', '#F7DDE6')
    casco = laca('casco cría', '#B9A6E0', 0.35)
    ojo = laca('ojo cría', '#2B2230', 0.15)
    brillo = luz('brillo ojo cría', '#FFFFFF', 2.0)
    cachete = tela('cachete cría', '#F5A3BC')
    cuerno = laca('cuerno cría', '#F7E6B0', 0.25)
    # Cuerpo gordito y la panza más clara
    clay.blob('cuerpo cría', (0, 0.06, 0.4), (0.26, 0.34, 0.23), coll, pelo, n=10)
    clay.blob('panza cría', (0, 0.02, 0.3), (0.19, 0.26, 0.12), coll, claro, n=8)
    # Patas cortas y gruesas con sus cascos
    for sx in (-1, 1):
        for sy, inc in ((-1, -0.03), (1, 0.03)):
            x, y = sx * 0.14, 0.06 + sy * 0.2
            clay.sweep('pata cría', [(x, y, 0.36), (x * 1.05, y + inc, 0.2), (x * 1.08, y + inc, 0.09)], [0.09, 0.08, 0.078], (1, 1), coll, pelo,
                       segments=10, samples=4)
            clay.blob('casco cría', (x * 1.08, y + inc, 0.05), (0.075, 0.075, 0.055), coll, casco, n=6)
    # Cuello y cabeza grande (la cría es casi toda cabeza)
    clay.sweep('cuello cría', [(0, -0.2, 0.56), (0, -0.28, 0.7), (0, -0.33, 0.8)], [0.13, 0.12, 0.12], (1, 1), coll, pelo, segments=10, samples=4)
    clay.blob('cabeza cría', (0, -0.37, 0.92), (0.21, 0.2, 0.19), coll, pelo, n=10)
    clay.blob('hocico cría', (0, -0.54, 0.85), (0.13, 0.1, 0.095), coll, hocico, n=8)
    for sx in (-1, 1):
        clay.blob('narina cría', (sx * 0.045, -0.635, 0.87), (0.016, 0.008, 0.012), coll, laca('narina cría', '#C98AA0', 0.4), n=4)
        # Ojos enormes con su brillo y los cachetes
        clay.blob('ojo cría', (sx * 0.1, -0.53, 0.97), (0.05, 0.022, 0.062), coll, ojo, n=6)
        clay.blob('brillo ojo cría', (sx * 0.1 - 0.015, -0.553, 0.995), (0.015, 0.006, 0.017), coll, brillo, n=4)
        clay.blob('brillo chico cría', (sx * 0.1 + 0.018, -0.552, 0.95), (0.008, 0.004, 0.008), coll, brillo, n=3)
        clay.blob('pestaña cría', (sx * 0.135, -0.52, 1.03), (0.03, 0.01, 0.01), coll, ojo, n=3)
        clay.blob('cachete cría', (sx * 0.15, -0.5, 0.87), (0.04, 0.012, 0.028), coll, cachete, n=4)
        # Orejas en punta, con el dentro rosado
        clay.sweep('oreja cría', [(sx * 0.12, -0.32, 1.05), (sx * 0.15, -0.31, 1.14), (sx * 0.16, -0.3, 1.21)], [0.05, 0.035, 0.008], (1, 0.55), coll, pelo,
                   segments=8, samples=4, caps=('round', 'point'), up=(0, -1, 0))
        clay.blob('oreja dentro cría', (sx * 0.135, -0.345, 1.11), (0.022, 0.006, 0.04), coll, hocico, n=4)
    # El cuernito que apenas brota, con su espiral
    clay.lathe('cuerno cría', [(0.0, 0.0), (0.045, 0.0), (0.03, 0.07), (0.012, 0.13), (0.0, 0.15)], coll, cuerno, segments=16).location = (0, -0.43, 1.06)
    espiral = [(math.cos(t * 7) * (0.045 - t * 0.032), -0.43 + math.sin(t * 7) * (0.045 - t * 0.032), 1.065 + t * 0.12) for t in [i / 24 for i in range(25)]]
    clay.sweep('espiral cuerno cría', espiral, 0.006, (1, 1), coll, laca('nácar cría', '#FFF6DE', 0.2), segments=5, samples=2)
    # La crin: mechones de colores desde la frente hasta la cruz, y el copete sobre la frente
    for k in range(9):
        t = k / 8
        y = -0.42 + t * 0.4
        z = 1.08 - t * 0.5
        col = tela(f'crin cría {k % 5}', PASTEL[k % 5])
        clay.blob(f'mechón crin {k}', (0.02 * (-1) ** k, y + 0.02, z), (0.085 - t * 0.02, 0.07, 0.08), coll, col, n=6)
    for k, x in enumerate((-0.05, 0.0, 0.05)):
        clay.sweep(f'copete cría {k}', [(x, -0.47, 1.08), (x * 1.6, -0.55, 1.07), (x * 2, -0.58, 1.01)], [0.035, 0.03, 0.012], (1, 0.7), coll,
                   tela(f'crin cría {k}', PASTEL[k]), segments=8, samples=4, caps=('round', 'point'))
    # La cola: tres mechones que se abren
    for k, (dx, col) in enumerate(((-0.05, PASTEL[0]), (0.0, PASTEL[1]), (0.05, PASTEL[2]))):
        clay.sweep(f'cola cría {k}', [(0, 0.38, 0.49), (dx, 0.5, 0.46), (dx * 2, 0.56, 0.32), (dx * 2.4, 0.52, 0.18)], [0.05, 0.05, 0.04, 0.012], (1, 0.8), coll,
                   tela(f'crin cría {k}', col), segments=8, samples=5, caps=('round', 'point'))
    # Una estrellita en el anca, la marca de Celia
    for s in (-1, 1):
        for k in range(5):
            a = k / 5 * math.tau + math.pi / 2
            clay.blob('estrella anca cría', (s * 0.245, 0.2 + math.cos(a) * 0.035, 0.46 + math.sin(a) * 0.035), (0.008, 0.024, 0.024), coll,
                      laca('estrella cría', '#F2C94C', 0.3), n=3)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Cría')
    raices = []
    for clave in claves or PIEZAS:
        antes = set(coll.objects)
        PIEZAS[clave](coll)
        raiz = bpy.data.objects.new(f'm_{clave}', None)
        clay.link(raiz, coll)
        for o in coll.objects:
            if o not in antes and o is not raiz and o.parent is None:
                o.parent = raiz
        raices.append(raiz)
    import exportar_glb
    objs = []
    for r in raices:
        objs.extend(exportar_glb.arbol(r))
    exportar_glb.exportar(objs, os.path.join(out, 'granja_cria.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
