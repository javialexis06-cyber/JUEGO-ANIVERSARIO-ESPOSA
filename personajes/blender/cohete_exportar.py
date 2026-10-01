"""Exporta las piezas del retrete espacial (cohete_piezas.py): cohete_retretes.glb y cohete_cosas.glb (cada pieza
colgada de un vacío con su nombre: retrete_<id>, poder_<id>, rollito, obst_<tipo>…) y sus íconos para la tienda.

Uso: blender -b -P cohete_exportar.py -- <carpeta_salida> [grupos: retretes,cosas,iconos] [claves separadas por coma]
     salida: <carpeta>/cohete_retretes.glb, <carpeta>/cohete_cosas.glb y <carpeta>/iconos/cohete_<clave>.png
"""
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import cohete_piezas as cp  # noqa: E402
import escena  # noqa: E402
import exportar_glb  # noqa: E402

RETRETES = {f'retrete_{k}': f for k, f in cp.RETRETES.items()}
COSAS = dict(cp.COSAS)
# Íconos de la tienda: los retretes, los poderes, el rollito y los de las mejoras
ICONOS = {**RETRETES, **cp.PODERES, 'rollito': cp.COSAS['rollito'], **cp.ICONOS}


def construir(key, fn, coll):
    before = set(coll.objects)
    fn(coll)
    root = bpy.data.objects.new(key, None)
    clay.link(root, coll)
    for o in coll.objects:
        if o not in before and o is not root and o.parent is None:
            o.parent = root
    return root


def aligerar(root):
    """Para el celular: suavizado de un solo nivel y las piezas del mismo material juntas en una sola malla
    (una llamada de dibujo por material en vez de una por tornillo)."""
    objs = exportar_glb.arbol(root)
    for o in objs:
        if o.type != 'MESH':
            continue
        for md in o.modifiers:
            if md.type == 'SUBSURF':
                md.levels = min(md.levels, 1)
                md.render_levels = min(md.render_levels, 1)
    grupos = {}
    for o in objs:
        if o.type != 'MESH' or len(o.material_slots) != 1 or o.material_slots[0].material is None:
            continue
        grupos.setdefault((o.material_slots[0].material.name, o.parent), []).append(o)
    for g in grupos.values():
        if len(g) > 1:
            clay.join(g, g[0].name)


def exportar_grupo(piezas, path):
    coll = clay.collection(f'Export {os.path.basename(path)}')
    objs = []
    for key, fn in piezas.items():
        root = construir(key, fn, coll)
        aligerar(root)
        objs += exportar_glb.arbol(root)
    exportar_glb.exportar(objs, path)
    coll.hide_render = coll.hide_viewport = True


def main(out, grupos, claves):
    t0 = time.time()
    os.makedirs(out, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 160, 160, 24)
    if 'iconos' in grupos:
        # Íconos primero (con los materiales completos); después se exporta (simplifica los materiales)
        piezas = {k: f for k, f in ICONOS.items() if not claves or k in claves}
        exportar_glb.exportar_iconos_piezas(os.path.join(out, 'iconos'), {f'cohete_{k}': (lambda c, k=k, f=f: construir(k, f, c)) for k, f in piezas.items()})
    if 'retretes' in grupos:
        exportar_grupo(RETRETES, os.path.join(out, 'cohete_retretes.glb'))
    if 'cosas' in grupos:
        exportar_grupo(COSAS, os.path.join(out, 'cohete_cosas.glb'))
    print('LISTO', round(time.time() - t0, 1), 's', flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], (args[1] if len(args) > 1 else 'retretes,cosas,iconos').split(','), args[2].split(',') if len(args) > 2 else None)
