"""Exporta las comidas y la decoración nuevas de la tienda de la casa (comidas.py y deco_nueva.py).

Uso: python3 exportar_tienda_casa.py <carpeta_salida> [claves separadas por coma]
     salida: <carpeta>/<clave>.glb y <carpeta>/iconos/<clave>.png
"""
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import comidas  # noqa: E402
import deco_nueva  # noqa: E402
import escena  # noqa: E402
import exportar_glb  # noqa: E402

PIEZAS = {**comidas.PIEZAS, **deco_nueva.PIEZAS}


def construir(key, coll):
    before = set(coll.objects)
    PIEZAS[key](coll)
    root = bpy.data.objects.new(key, None)
    clay.link(root, coll)
    for o in coll.objects:
        if o not in before and o is not root and o.parent is None:
            o.parent = root
    return root


def main(out, claves=None):
    t0 = time.time()
    exportar_glb.OUT = out
    os.makedirs(out, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 160, 160, 24)
    claves = claves or list(PIEZAS)
    fallas = []
    # Íconos primero (con los materiales completos); después se exporta (simplifica los materiales)
    exportar_glb.exportar_iconos_piezas(os.path.join(out, 'iconos'), {k: (lambda c, k=k: construir(k, c)) for k in claves})
    for key in claves:
        try:
            coll = clay.collection(f'Export {key}')
            root = construir(key, coll)
            exportar_glb.exportar(exportar_glb.arbol(root), os.path.join(out, f'{key}.glb'))
            coll.hide_render = coll.hide_viewport = True
        except Exception as e:  # una pieza que falla no detiene las demás
            import traceback
            traceback.print_exc()
            fallas.append(key)
            print('FALLA', key, e, flush=True)
    print('LISTO', round(time.time() - t0, 1), 's', 'fallas:', fallas, flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
