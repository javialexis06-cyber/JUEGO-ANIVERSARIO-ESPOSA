"""Empaca las piezas de Plantas contra Zombis (los PNG de pvz_sprites.py) en una hoja webp por personaje.

Uso: python3 personajes/blender/pvz_atlas.py <entrada> <salida>
     python3 personajes/blender/pvz_atlas.py --fondos <carpeta de pvz_fondos.py> <salida>
  entrada: juego/web/modelos-crudos/pvz (una carpeta por personaje con info.json y las piezas)
  salida:  juego/web/public/jardin/pvz

Cada pieza (y cada variante) se recorta a lo que tiene color y se acomoda en la hoja. Sale <id>.webp y <id>.json con,
por pieza: rect (x, y, w, h en px de la hoja), pos (esquina del recorte en el marco local, px de mundo), pivote, z,
padre y variantes; y del personaje: marco, ancla, puntos y escala (px de la hoja por px de mundo). También
indice.json con la lista de personajes. La sombra se suaviza en los bordes.
"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image

SEP = 2


def recortar(im):
    a = im.getchannel('A')
    caja = a.point(lambda v: 255 if v > 2 else 0).getbbox()
    if not caja:
        return None, (0, 0)
    x0, y0, x1, y1 = caja
    x0, y0 = max(0, x0 - 1), max(0, y0 - 1)
    x1, y1 = min(im.width, x1 + 1), min(im.height, y1 + 1)
    return im.crop((x0, y0, x1, y1)), (x0, y0)


def suavizar_sombra(im):
    """La sombra del suelo llega al borde del cuadro: se desvanece cerca de los bordes para que no se vea un corte."""
    a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]
    margen = max(6.0, 0.18 * min(w, h))
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)).astype(np.float32)
    f = np.clip(d / margen, 0, 1)
    a[..., 3] *= f * f * (3 - 2 * f)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def empacar(recortes, ancho_max=1024):
    """Estantes simples: de la más alta a la más baja."""
    orden = sorted(range(len(recortes)), key=lambda i: -recortes[i].height)
    pos = [None] * len(recortes)
    x = y = alto_estante = 0
    ancho = 0
    for i in orden:
        im = recortes[i]
        if x + im.width > ancho_max and x > 0:
            y += alto_estante + SEP
            x = alto_estante = 0
        pos[i] = (x, y)
        x += im.width + SEP
        ancho = max(ancho, x)
        alto_estante = max(alto_estante, im.height)
    return pos, ancho, y + alto_estante


def procesar(carpeta, salida):
    info = json.load(open(os.path.join(carpeta, 'info.json')))
    ppu = info['ppu']
    trabajos = []  # (pieza, variante|None, archivo)
    for p in info['piezas']:
        trabajos.append((p, None, p['archivo']))
        for v, arch in (p.get('estados') or {}).items():
            trabajos.append((p, v, arch))
    recortes, offsets = [], []
    for p, v, arch in trabajos:
        im = Image.open(os.path.join(carpeta, arch)).convert('RGBA')
        if p['id'] == 'sombra':
            im = suavizar_sombra(im)
        r, o = recortar(im)
        if r is None:
            r, o = Image.new('RGBA', (1, 1)), (0, 0)
        recortes.append(r)
        offsets.append(o)
    pos, W, H = empacar(recortes)
    hoja = Image.new('RGBA', (max(1, W), max(1, H)))
    for im, (x, y) in zip(recortes, pos):
        hoja.paste(im, (x, y))
    nombre = f"{info['id']}.webp"
    hoja.save(os.path.join(salida, nombre), 'WEBP', quality=90, method=6)
    piezas = {}
    for (p, v, _), im, (x, y), (ox, oy) in zip(trabajos, recortes, pos, offsets):
        datos = {'rect': [x, y, im.width, im.height], 'pos': [round(ox / ppu, 2), round(oy / ppu, 2)]}
        if v is None:
            piezas[p['id']] = {
                'id': p['id'], 'z': p['z'], 'padre': p.get('padre'), 'pivote': p['pivote'], **datos,
                **({'sinTinte': True} if p.get('sinTinte') else {}), 'estados': {},
            }
        else:
            piezas[p['id']]['estados'][v] = datos
    for q in piezas.values():
        if not q['estados']:
            del q['estados']
        if q['padre'] is None:
            del q['padre']
    out = {
        'id': info['id'], 'hoja': nombre, 'escala': ppu, 'ancho': info['ancho'], 'alto': info['alto'], 'ancla': info['ancla'],
        'puntos': info['puntos'], 'piezas': list(piezas.values()),
        **({'conservar': info['conservar']} if info.get('conservar') else {}),
    }
    with open(os.path.join(salida, f"{info['id']}.json"), 'w') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    print(f"{info['id']}: {len(recortes)} piezas en {W}x{H}", flush=True)
    return info['id']


def fondos(entrada, salida, calidad=82):
    """Los escenarios de pvz_fondos.py (dia_<variante>.png) pasan a fondo-dia-<variante>.webp."""
    for ruta in sorted(glob.glob(os.path.join(entrada, '*.png'))):
        nombre = 'fondo-' + os.path.basename(ruta)[:-4].replace('_', '-') + '.webp'
        Image.open(ruta).convert('RGB').save(os.path.join(salida, nombre), 'WEBP', quality=calidad, method=6)
        print(nombre, os.path.getsize(os.path.join(salida, nombre)) // 1024, 'KB', flush=True)


def main(entrada, salida):
    os.makedirs(salida, exist_ok=True)
    ids = []
    for carpeta in sorted(glob.glob(os.path.join(entrada, '*', 'info.json'))):
        ids.append(procesar(os.path.dirname(carpeta), salida))
    previos = []
    ruta = os.path.join(salida, 'indice.json')
    if os.path.exists(ruta):
        previos = json.load(open(ruta)).get('personajes', [])
    todos = sorted(set(previos) | set(ids))
    with open(ruta, 'w') as f:
        json.dump({'personajes': todos}, f, ensure_ascii=False)


if __name__ == '__main__':
    if sys.argv[1] == '--fondos':
        fondos(sys.argv[2], sys.argv[3])
    else:
        main(sys.argv[1], sys.argv[2])
