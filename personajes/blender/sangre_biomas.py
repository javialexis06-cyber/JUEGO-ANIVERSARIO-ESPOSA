"""Exporta los biomas de Sangre y Ceniza: un GLB por bioma con todas sus piezas (piso_*, pared_*, veta_*, deco_*,
luz_*), cada una colgada de un vacío con su nombre en el origen. También escribe un JSON con las medidas y los
triángulos de cada pieza (para revisar el peso).

Uso: blender -b -P sangre_biomas.py -- <carpeta_salida> <biomas: cementerio,catacumbas,minas,abadia,castillo> [piezas]
     salida: <carpeta>/bioma_<id>.glb y <carpeta>/bioma_<id>.json
     piezas: nombres separados por coma o un prefijo con * (p. ej. 'pared_*,piso_a') para exportar solo esas.
"""
import fnmatch
import importlib
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import sangre_biomas_base as B  # noqa: E402

BIOMAS = ['cementerio', 'catacumbas', 'minas', 'abadia', 'castillo']


def exportar_bioma(bioma, out, filtro):
    clay.reset_scene()
    mod = importlib.import_module(f'sangre_biomas_{bioma}')
    coll = clay.collection(f'Bioma {bioma}')
    raices, info = [], {}
    for nombre, fn in mod.PIEZAS.items():
        if filtro and not any(fnmatch.fnmatch(nombre, f) for f in filtro):
            continue
        t0 = time.time()
        p = fn()
        p.nombre = nombre
        raiz = p.construir(coll)
        raices.append(raiz)
        dims = [round(float(x), 3) for x in raiz.children[0].dimensions] if raiz.children else []
        info[nombre] = dict(tris=p.tris(), medidas=dims, **{k: v for k, v in p.extras.items()})
        print(f'  {nombre:28s} {p.tris():6d} tris  {time.time() - t0:5.1f} s', flush=True)
    ruta = os.path.join(out, f'bioma_{bioma}.glb')
    B.exportar(raices, ruta)
    with open(os.path.join(out, f'bioma_{bioma}.json'), 'w') as fh:
        json.dump(info, fh, ensure_ascii=False, indent=1)


def main(out, biomas, filtro):
    os.makedirs(out, exist_ok=True)
    for b in biomas:
        t0 = time.time()
        print('BIOMA', b, flush=True)
        exportar_bioma(b, out, filtro)
        print('LISTO', b, round(time.time() - t0, 1), 's', flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else BIOMAS, args[2].split(',') if len(args) > 2 else None)
