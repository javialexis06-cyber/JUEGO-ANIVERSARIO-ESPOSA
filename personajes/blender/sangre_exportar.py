"""Exporta las figuras de Sangre y Ceniza: enemigos, jefes, armas, proyectiles y cosas.

Uso: blender -b -P sangre_exportar.py -- <salida> <grupo> [ids separados por coma] [opciones]
  grupos: enemigos, jefes, armas, proyectiles, cosas
  sin ids: arma el grupo completo y escribe <salida>/sangre/<grupo>.glb y <salida>/sangre/<grupo>.json
  con ids: solo esos (para revisar); no escribe el GLB salvo con --glb
  --hoja <png>    hoja de contacto (cada figura desde el frente 3/4 y desde atrás)
  --sin-glb       no exporta
  --iconos <dir>  íconos de 128 px (webp, fondo transparente, luz dramática) de cada figura: <dir>/<id>.webp
"""
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import sangre_comun as sc  # noqa: E402


def registro(grupo):
    if grupo == 'enemigos':
        import importlib
        import sangre_enemigos as m
        for extra in ('sangre_enemigos2', 'sangre_enemigos3'):
            if os.path.exists(os.path.join(HERE, f'{extra}.py')):
                importlib.import_module(extra)
        return m.ENEMIGOS
    if grupo == 'jefes':
        import sangre_jefes as m
        return m.JEFES
    if grupo == 'armas':
        import sangre_armas as m
        return m.ARMAS
    if grupo == 'proyectiles':
        import sangre_armas as m
        return m.PROYECTILES
    if grupo == 'cosas':
        import sangre_cosas as m
        return m.COSAS
    raise SystemExit(f'grupo desconocido {grupo}')


def construir(reg, ids):
    figs = []
    t0 = time.time()
    for i in ids:
        coll = clay.collection(f'SG {i}')
        t = time.time()
        F = reg[i](coll)
        F.construir(coll)
        F.coll = coll
        figs.append(F)
        print(f'figura {F.nodo}: {F.tris} triángulos, alto {F.hi[2]:.2f} m, {time.time() - t:.1f} s ·',
              ', '.join(f'{n} {p.n_tris}' for n, p in F.piezas.items()), flush=True)
    print('construidas', len(figs), round(time.time() - t0, 1), 's', flush=True)
    return figs


def hoja(figs, path, angulos=(32, 205)):
    scene = bpy.context.scene
    sc.preparar_render(scene, 420, 20, transparente=False, fondo='#5A5550')
    tmp = os.path.join(os.path.dirname(path), '_hoja_tmp')
    os.makedirs(tmp, exist_ok=True)
    luces = clay.collection('SG luces hoja')
    raices = [f.root for f in figs]
    filas, etiquetas = [], []
    for F in figs:
        sc.solo_visible([F.root], raices)
        lo, hi = sc.caja_mundo(F.root)
        for o in list(luces.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        alto = float(max(hi - lo))
        sc.luces_neutras(luces, centro=tuple((lo + hi) / 2), escala=max(alto, 0.3))
        fila = []
        for k, az in enumerate(angulos):
            cam = sc.camara_figura(f'cam {F.nodo} {k}', lo, hi, az, 16)
            p = os.path.join(tmp, f'{F.nodo}_{k}.png')
            sc.render(scene, cam, p)
            bpy.data.objects.remove(cam, do_unlink=True)
            fila.append(p)
        filas.append(fila)
        etiquetas.append(f'{F.nodo}  {F.tris} tris  {hi[2]:.2f} m')
    for r in raices:
        for o in sc.arbol(r):
            o.hide_render = False
    sc.hoja_contacto(filas, path, etiquetas, tam=420)
    print('HOJA', path, flush=True)


def iconos(figs, carpeta, res=128):
    from PIL import Image
    scene = bpy.context.scene
    sc.preparar_render(scene, res * 2, 28, transparente=True)
    os.makedirs(carpeta, exist_ok=True)
    luces = clay.collection('SG luces iconos')
    raices = [f.root for f in figs]
    for F in figs:
        sc.solo_visible([F.root], raices)
        lo, hi = sc.caja_mundo(F.root)
        for o in list(luces.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        sc.luces_dramaticas(luces, centro=tuple((lo + hi) / 2), escala=max(float(max(hi - lo)), 0.3))
        az, el = F.extras.get('icono_vista', (28, 18))
        cam = sc.camara_figura(f'cam icono {F.nodo}', lo, hi, az, el, margen=1.08)
        png = os.path.join(carpeta, f'_{F.id}.png')
        sc.render(scene, cam, png)
        bpy.data.objects.remove(cam, do_unlink=True)
        Image.open(png).convert('RGBA').resize((res, res), Image.LANCZOS).save(os.path.join(carpeta, f'{F.extras.get("icono", F.id)}.webp'),
                                                                              'WEBP', quality=88, method=6)
        os.remove(png)
    for r in raices:
        for o in sc.arbol(r):
            o.hide_render = False
    print('ICONOS', len(figs), flush=True)


def main(args):
    out, grupo = args[0], args[1]
    ids = [a for a in (args[2].split(',') if len(args) > 2 and not args[2].startswith('--') else []) if a]
    opc = args[2:] if not ids else args[3:]
    reg = registro(grupo)
    todos = not ids
    ids = ids or list(reg)
    clay.reset_scene()
    figs = construir(reg, ids)
    if '--hoja' in opc:
        hoja(figs, opc[opc.index('--hoja') + 1])
    if '--iconos' in opc:
        iconos(figs, opc[opc.index('--iconos') + 1])
    if '--sin-glb' not in opc and (todos or '--glb' in opc):
        dest = os.path.join(out, 'sangre')
        os.makedirs(dest, exist_ok=True)
        nombre = grupo if todos else f'{grupo}_prueba'
        sc.exportar_glb([f.root for f in figs], os.path.join(dest, f'{nombre}.glb'))
        with open(os.path.join(dest, f'{nombre}.json'), 'w', encoding='utf-8') as fh:
            json.dump(sc.manifiesto(figs), fh, ensure_ascii=False, indent=1)
    print('LISTO', flush=True)


if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
