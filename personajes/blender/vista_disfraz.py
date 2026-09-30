"""Vista previa de un disfraz completo puesto (para revisar el detalle antes de exportar).

Uso: python3 vista_disfraz.py <salida.png> <el|ella> <prenda1[:variante],prenda2,...> [ancho]
     escribe <salida>-frente.png y <salida>-atras.png con el personaje de cuerpo entero.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import escena  # noqa: E402
import ropa  # noqa: E402


def main(out, rol, claves, ancho=640):
    ropa.cargar_modulos()
    scene = clay.reset_scene()
    escena.setup_render(scene, ancho, ancho, 24)
    ropa.preparar_iconos(scene)
    scene.render.resolution_x = scene.render.resolution_y = ancho
    ctx = ropa.Ctx(rol)
    ocultas = []
    for pedido in claves:
        # «clave:variante» pinta la prenda con los colores de otra variante (p. ej. enterizo_stitch:enterizo_angel)
        clave, _, variante = pedido.partition(':')
        objs = ropa.construir(ctx, clave)
        info = ropa.PRENDAS[clave]
        if variante:
            ctx.m.recolorear(next(c for v, _, c in info['variantes'] if v == variante))
        ocultas += ropa.partes_ocultas(ctx, info['ranura'], info['oculta'])
        print('prenda', clave, len(objs), 'piezas', sum(len(o.data.polygons) for o in objs), 'caras', flush=True)
    for o in ocultas:
        o.hide_render = True
    for nombre, (x, y, z) in (('frente', (1.3, -3.6, 1.9)), ('atras', (-1.3, 3.6, 1.9))):
        cam = escena.camera(f'Cam vista {nombre}', (x, y, z), (0.12 if x > 0 else -0.12, 0, 1.25), 50)
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = 3.4
        scene.camera = cam
        scene.render.filepath = f'{out}-{nombre}.png'
        bpy.ops.render.render(write_still=True)
    print('LISTO', flush=True)


if __name__ == '__main__':
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(a[0], a[1], a[2].split(','), int(a[3]) if len(a) > 3 else 640)
