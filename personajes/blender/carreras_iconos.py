"""Nuestro Hogar · La Carrera de las Tres Lunas: íconos de los objetos y hoja de revisión de las piezas.

  blender -b -P carreras_iconos.py -- iconos <carpeta>         → <carpeta>/<objeto>.webp (128 px, fondo transparente)
  blender -b -P carreras_iconos.py -- revisar <png> [claves]   → hoja de contacto de las piezas de carreras_cosas.py

Los íconos salen de los mismos modelos del juego (carreras_cosas.py) con una luz suave y un halo del color del objeto.
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
import sangre_comun as sc  # noqa: E402
from carreras_cosas import PIEZAS  # noqa: E402
from carreras_comun import raiz_pieza  # noqa: E402

# objeto del juego → (pieza, color del halo, giro z en grados)
ICONOS = {
    'chispa': ('obj_chispa', '#FFB43A', 0), 'semilla': ('obj_semilla', '#7CC459', -25), 'velo': ('obj_velo', '#9B7BD8', -15),
    'ceniza': ('obj_ceniza', '#8FB4FF', -20), 'pluma': ('obj_pluma', '#F2C14E', -10), 'lluvia': ('obj_nube', '#6FB5F0', -15),
    'lucero': ('obj_lucero', '#FFE27A', -20), 'brasa': ('obj_brasa', '#FF7A2A', -20),
}


def camara(lo, hi, azimut, elev, margen, coll):
    import escena
    c = (np.asarray(lo) + np.asarray(hi)) / 2
    a, e = math.radians(azimut), math.radians(elev)
    d = np.array([math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)])
    cam = escena.camera('cam', tuple(c + d * 12), tuple(c), 50, coll)
    cam.data.type = 'ORTHO'
    ext = np.asarray(hi) - np.asarray(lo)
    cam.data.ortho_scale = float(max(ext)) * margen
    cam.data.clip_end = 60
    return cam


def construir(claves):
    clay.reset_scene()
    coll = clay.collection('Carreras')
    return {k: raiz_pieza(coll, k, PIEZAS[k]) for k in claves}


def halo(png, color, res=128):
    from PIL import Image, ImageDraw, ImageFilter
    im = Image.open(png).convert('RGBA')
    W = im.size[0]
    h = color.lstrip('#')
    rgb = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    capa = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    r = W * 0.36
    d.ellipse((W / 2 - r, W / 2 - r, W / 2 + r, W / 2 + r), fill=rgb + (120,))
    capa = capa.filter(ImageFilter.GaussianBlur(W * 0.1))
    capa.alpha_composite(im)
    return capa.resize((res, res), Image.LANCZOS)


def iconos(out):
    from PIL import Image
    os.makedirs(out, exist_ok=True)
    piezas = construir(sorted({v[0] for v in ICONOS.values()}))
    scene = bpy.context.scene
    sc.preparar_render(scene, 256, 24, transparente=True)
    luces = clay.collection('luces')
    tmp = os.path.join(out, '_tmp')
    os.makedirs(tmp, exist_ok=True)
    hechos = []
    for i, (pieza, color, giro) in ICONOS.items():
        r = piezas[pieza]
        sc.solo_visible([r], list(piezas.values()))
        r.rotation_euler = (0, 0, math.radians(giro))
        lo, hi = sc.caja_mundo(r)
        for o in list(luces.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        c = (lo + hi) / 2
        sc.luces_neutras(luces, centro=tuple(c), escala=max(float(max(hi - lo)), 0.3))
        cam = camara(lo, hi, 20, 18, 1.25, luces)
        png = os.path.join(tmp, f'{i}.png')
        sc.render(scene, cam, png)
        halo(png, color).save(os.path.join(out, f'{i}.webp'), 'WEBP', quality=90, method=6)
        hechos.append(os.path.join(out, f'{i}.webp'))
        print('icono', i, flush=True)
    # «Tres chispas»: la chispa repetida en triángulo
    base = Image.open(os.path.join(out, 'chispa.webp')).convert('RGBA')
    T = 128
    lienzo = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    chica = base.resize((80, 80), Image.LANCZOS)
    for x, y in ((24, 2), (2, 46), (46, 46)):
        lienzo.alpha_composite(chica, (x, y))
    lienzo.save(os.path.join(out, 'tres.webp'), 'WEBP', quality=90, method=6)
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
    sc.hoja_contacto([[*hechos, os.path.join(out, 'tres.webp')]], os.path.join(out, '..', '_hoja_iconos.png'), ['iconos'], 128)


def revisar(png, claves=None):
    claves = claves or list(PIEZAS)
    piezas = construir(claves)
    scene = bpy.context.scene
    sc.preparar_render(scene, 320, 16, transparente=False, fondo='#3A3634')
    luces = clay.collection('luces')
    tmp = os.path.join(os.path.dirname(png), '_rev')
    os.makedirs(tmp, exist_ok=True)
    filas = []
    for k, r in piezas.items():
        sc.solo_visible([r], list(piezas.values()))
        lo, hi = sc.caja_mundo(r)
        fila = []
        for j, az in enumerate((35, 150)):
            for o in list(luces.objects):
                bpy.data.objects.remove(o, do_unlink=True)
            c = (lo + hi) / 2
            sc.luces_neutras(luces, centro=tuple(c), escala=max(float(max(hi - lo)), 0.4))
            cam = camara(lo, hi, az, 22, 1.2, luces)
            p = os.path.join(tmp, f'{k}_{j}.png')
            sc.render(scene, cam, p)
            fila.append(p)
        filas.append(fila)
        print('render', k, flush=True)
    # dos piezas por fila (cuatro imágenes)
    pares = [filas[i] + (filas[i + 1] if i + 1 < len(filas) else []) for i in range(0, len(filas), 2)]
    nombres = list(piezas)
    etiquetas = [' / '.join(nombres[i:i + 2]) for i in range(0, len(nombres), 2)]
    sc.hoja_contacto(pares, png, etiquetas, 300)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    if args[0] == 'iconos':
        iconos(args[1])
    else:
        revisar(args[1], args[2].split(',') if len(args) > 2 else None)
