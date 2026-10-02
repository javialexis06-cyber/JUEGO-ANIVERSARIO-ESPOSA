"""Empaca los recortes de la cocina de chef (los PNG de cocina_sprites.py / cocina_fondos.py) en hojas webp para el juego.

Uso: python3.12 personajes/blender/cocina_atlas.py <entrada> <salida>
  entrada: la carpeta con <clave>.png y <clave>.json (juego/web/modelos-crudos/cocina)
  salida:  juego/web/public/cocina

Cada recorte se recorta a lo que tiene color (alfa > 0), se reduce si se pide (`escala` en su json) y se acomoda en
hojas de 2048 px. Sale `hojas.json` con, por clave: hoja, x, y, w, h, el ancla y los puntos ya en px del recorte,
ppm (px por metro) y lo demás del json. Los fondos (`fondo_*`, opacos y grandes) van aparte en webp sueltos.
"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

LADO = 2048
SEP = 2


def recortar(im):
    a = im.getchannel('A')
    caja = a.point(lambda v: 255 if v > 1 else 0).getbbox()
    if not caja:
        return im, (0, 0)
    x0, y0, x1, y1 = caja
    x0, y0 = max(0, x0 - 1), max(0, y0 - 1)
    x1, y1 = min(im.width, x1 + 1), min(im.height, y1 + 1)
    return im.crop((x0, y0, x1, y1)), (x0, y0)


def difuminar_sombra(im, clave):
    """La sombra del render llega hasta el borde del cuadro y se ve como un rectángulo: se desvanece cerca de los bordes.
    Solo toca lo que es sombra (oscuro y medio transparente); el objeto queda igual."""
    if clave.startswith('rejilla'):
        return im  # piezas que se repiten pegadas: el borde es el objeto
    a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]
    lum = a[..., :3].mean(-1)
    margen = max(6.0, 0.22 * min(w, h))
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)).astype(np.float32)
    f = np.clip(d / margen, 0, 1)
    f = f * f * (3 - 2 * f)
    peso = np.clip((60 - lum) / 30, 0, 1) * np.clip((235 - a[..., 3]) / 60, 0, 1)
    a[..., 3] *= 1 - peso * (1 - f)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


VIDRIO = ('vaso_', 'vasofresa_', 'vasofrappe_', 'licuadora_jarra', 'wafflera_tapa', 'jarra_')


def limpiar_vidrio(im, clave):
    """El vidrio sale del render con granito (el alfa del vidrio transparente no pasa por el quitarruido) y sobre un
    fondo claro se ve sucio: se suaviza lo medio transparente y se aclara un poco, como vidrio limpio."""
    if not clave.startswith(VIDRIO):
        return im
    a = np.asarray(im).astype(np.float32) / 255
    alfa = a[..., 3:4]
    pre = np.concatenate([a[..., :3] * alfa, alfa], axis=-1)
    canales = [Image.fromarray((pre[..., i] * 255).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)) for i in range(4)]
    suave = np.stack([np.asarray(c).astype(np.float32) / 255 for c in canales], axis=-1)
    # Solo en lo medio transparente (el logo, los bordes gruesos y lo de adentro quedan nítidos)
    peso = np.clip((0.92 - alfa) / 0.25, 0, 1)
    pre = pre * (1 - peso) + suave * peso
    al = pre[..., 3:4]
    rgb = np.where(al > 1e-4, pre[..., :3] / np.maximum(al, 1e-4), 0)
    rgb = rgb + (1 - rgb) * 0.4 * peso
    out = np.concatenate([rgb, al], axis=-1)
    return Image.fromarray((out * 255).clip(0, 255).astype(np.uint8), 'RGBA')


def empacar(piezas):
    """Estantes: de la más alta a la más bajita, llenando filas de izquierda a derecha."""
    piezas = sorted(piezas, key=lambda p: (-p['im'].height, -p['im'].width))
    hojas = []
    for p in piezas:
        w, h = p['im'].width + SEP, p['im'].height + SEP
        puesto = False
        for hi, hoja in enumerate(hojas):
            for fila in hoja['filas']:
                if fila['h'] >= h and fila['x'] + w <= LADO:
                    p['hoja'], p['x'], p['y'] = hi, fila['x'], fila['y']
                    fila['x'] += w
                    puesto = True
                    break
            if puesto:
                break
            if hoja['y'] + h <= LADO:
                fila = {'x': w, 'y': hoja['y'], 'h': h}
                hoja['filas'].append(fila)
                p['hoja'], p['x'], p['y'] = hi, 0, hoja['y']
                hoja['y'] += h
                puesto = True
                break
        if not puesto:
            hojas.append({'filas': [{'x': w, 'y': 0, 'h': h}], 'y': h})
            p['hoja'], p['x'], p['y'] = len(hojas) - 1, 0, 0
    return len(hojas)


def main():
    entrada, salida = sys.argv[1], sys.argv[2]
    os.makedirs(salida, exist_ok=True)
    piezas = []
    fondos = {}
    for png in sorted(glob.glob(os.path.join(entrada, '*.png'))):
        clave = os.path.splitext(os.path.basename(png))[0]
        js = os.path.join(entrada, f'{clave}.json')
        info = json.load(open(js)) if os.path.exists(js) else {}
        im = Image.open(png).convert('RGBA')
        if clave.startswith('fondo_'):
            # Los fondos: webp suelto (con alfa si lo trae, como el mostrador)
            con_alfa = im.getchannel('A').getextrema()[0] < 255
            ruta = os.path.join(salida, f'{clave}.webp')
            (im if con_alfa else im.convert('RGB')).save(ruta, 'WEBP', quality=86, method=6)
            fondos[clave] = {'w': im.width, 'h': im.height, **info}
            print(f'{clave}: {im.width}x{im.height} {os.path.getsize(ruta) // 1024} KB')
            continue
        esc = info.pop('escala', 1.0)
        im = limpiar_vidrio(difuminar_sombra(im, clave), clave)
        if esc != 1.0:
            im = im.resize((max(1, round(im.width * esc)), max(1, round(im.height * esc))), Image.LANCZOS)
        im, (ox, oy) = recortar(im)
        ax, ay = info.pop('ancla', [0, 0])
        info['ax'] = round(ax * esc - ox, 2)
        info['ay'] = round(ay * esc - oy, 2)
        if 'ppm' in info:
            info['ppm'] = round(info['ppm'] * esc, 3)
        if 'puntos' in info:
            info['puntos'] = {k: [round(v[0] * esc - ox, 2), round(v[1] * esc - oy, 2)] for k, v in info['puntos'].items()}
        piezas.append({'clave': clave, 'im': im, 'info': info})
    n = empacar(piezas)
    hojas = [Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0)) for _ in range(n)]
    for p in piezas:
        hojas[p['hoja']].paste(p['im'], (p['x'], p['y']))
    datos = {'hojas': [], 'recortes': {}, 'fondos': fondos}
    for i, h in enumerate(hojas):
        caja = h.getbbox() or (0, 0, 1, 1)
        alto = min(LADO, caja[3] + 2)
        h = h.crop((0, 0, LADO, alto))
        ruta = os.path.join(salida, f'hoja{i}.webp')
        h.save(ruta, 'WEBP', quality=88, method=6, alpha_quality=92)
        datos['hojas'].append({'archivo': f'hoja{i}.webp', 'w': LADO, 'h': alto})
        print(f'hoja{i}.webp: {LADO}x{alto} {os.path.getsize(ruta) // 1024} KB')
    for p in piezas:
        datos['recortes'][p['clave']] = {'h': p['hoja'], 'x': p['x'], 'y': p['y'], 'w': p['im'].width, 'a': p['im'].height, **p['info']}
    with open(os.path.join(salida, 'hojas.json'), 'w') as f:
        json.dump(datos, f, separators=(',', ':'))
    print(f'{len(piezas)} recortes en {n} hojas')


if __name__ == '__main__':
    main()
