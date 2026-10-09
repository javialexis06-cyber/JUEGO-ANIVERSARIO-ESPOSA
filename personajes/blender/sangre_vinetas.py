"""Ilustraciones de los menús de Sangre y Ceniza (public/sangre/vinetas/<id>.webp, fondo transparente con halo): el
Pozo de las Almas y los tres juegos del refugio (el barril con calaveras, la mesa de la taberna, la campana). Y los
sprites de los juegos del refugio (spr_*.webp, sin halo, vistos desde arriba): el barril, la calavera, el pilar de
piedra, la campanita que cae y los seis lados del dado de hueso.

Uso: blender -b -P sangre_vinetas.py -- <carpeta_salida> [ids separados por coma]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import sangre_comun as sc  # noqa: E402
from sangre_iconos import halo  # noqa: E402

# id: (grupo, figura, color del halo, giro en z, elevación de la cámara). Las cosas miran a −Y (hacia la cámara del
# juego): la cámara de la viñeta va de ese lado (azimut 180).
VINETAS = {
    'pozo': ('cosas', 'pozo_almas', '#5ed8ff', -20, 30),
    'barril': ('cosas', 'barril_refugio', '#ff9a3a', 15, 20),
    'taberna': ('cosas', 'mesa_taberna', '#ffc06a', 20, 32),
    'campana': ('cosas', 'campana_extraccion', '#ffe08a', 25, 14),
}
# sprites: (grupo, figura, giro (x, y, z) en grados, elevación de la cámara, resolución)
SPRITES = {
    'spr_barril': ('cosas', 'barril_suelto', (0, 0, 0), 62, 160),
    'spr_calavera': ('cosas', 'calavera_suelta', (0, 0, 0), 30, 128),
    'spr_pilar': ('cosas', 'pilar_piedra', (0, 0, 20), 62, 160),
    'spr_campana': ('cosas', 'campanita_plata', (0, 0, 15), 12, 160),
}
# El dado con cada número arriba (1 arriba, 6 abajo, 2 atrás, 5 adelante, 3 a la derecha, 4 a la izquierda)
GIRO_DADO = {1: (0, 0, 0), 2: (90, 0, 0), 3: (0, -90, 0), 4: (0, 90, 0), 5: (-90, 0, 0), 6: (180, 0, 0)}
for _n, _g in GIRO_DADO.items():
    # (casi desde arriba: que solo se lea la cara de arriba)
    SPRITES[f'dado{_n}'] = ('cosas', 'dado_hueso', _g, 80, 96)


def luces_frente(luces, c, k):
    """Las luces dramáticas de siempre, pero del lado de −Y, donde está la cámara: la cálida de frente y el contraluz
    rojo detrás."""
    import escena
    escena.area_light('SG v clave', (c[0] - 2.2 * k, c[1] - 2.6 * k, c[2] + 2.6 * k), tuple(c), 240 * k * k, 1.6 * k, '#FFE6C8', luces)
    escena.area_light('SG v relleno', (c[0] + 2.8 * k, c[1] - 2.0 * k, c[2] + 0.6 * k), tuple(c), 80 * k * k, 2.5 * k, '#9FC0FF', luces)
    escena.area_light('SG v contra', (c[0] + 2.0 * k, c[1] + 2.6 * k, c[2] + 1.8 * k), tuple(c), 300 * k * k, 1.2 * k, '#FF6A3A', luces)


def main(out, ids=None):
    import sangre_exportar
    clay.reset_scene()
    scene = bpy.context.scene
    sc.preparar_render(scene, 512, 48, transparente=True)
    scene.view_settings.look = 'AgX - High Contrast'
    os.makedirs(out, exist_ok=True)
    todo = {**VINETAS, **SPRITES}
    ids = ids or list(todo)
    figs = {}
    for g in {todo[i][0] for i in ids}:
        fs = sorted({todo[i][1] for i in ids if todo[i][0] == g})
        for F in sangre_exportar.construir(sangre_exportar.registro(g), fs):
            figs[(g, F.id)] = F
    raices = [F.root for F in figs.values()]
    luces = clay.collection('SG luces viñetas')
    tmp = os.path.join(out, '_tmp')
    os.makedirs(tmp, exist_ok=True)
    from PIL import Image
    for i in ids:
        sprite = i in SPRITES
        if sprite:
            g, f, giro, elev, res = SPRITES[i]
            color = None
        else:
            g, f, color, gz, elev = VINETAS[i]
            giro, res = (0, 0, gz), 512
        F = figs[(g, f)]
        sc.solo_visible([F.root], raices)
        F.root.rotation_mode = 'XYZ'
        F.root.rotation_euler = tuple(math.radians(v) for v in giro)
        lo, hi = sc.caja_mundo(F.root)
        for o in list(luces.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        c = (lo + hi) / 2
        luces_frente(luces, c, max(float(max(hi - lo)), 0.3))
        scene.render.resolution_x = scene.render.resolution_y = 512 if not sprite else max(256, res * 2)
        cam = sc.camara_figura(f'cam viñeta {i}', lo, hi, 180, elev, margen=1.06 if sprite else 1.1)
        png = os.path.join(tmp, f'{i}.png')
        sc.render(scene, cam, png)
        bpy.data.objects.remove(cam, do_unlink=True)
        F.root.rotation_euler = (0, 0, 0)
        if sprite:
            im = Image.open(png).convert('RGBA').resize((res, res), Image.LANCZOS)
            im.save(os.path.join(out, f'{i}.webp'), 'WEBP', quality=90, method=6)
        else:
            halo(png, color, False, res=320).save(os.path.join(out, f'{i}.webp'), 'WEBP', quality=88, method=6)
        print('viñeta', i, flush=True)
    import shutil
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
