"""Junta los cuadros de los mugrosos (personajes/blender/lavado_bichos.py) y los objetos (lavado_objetos.py) en los
atlas del juego: public/lavado/bichos.webp + bichos.json y public/lavado/objetos.webp + objetos.json.
También arma una hoja de contacto para revisar a ojo.

Uso: python3 scripts/lavado-atlas.py <carpeta_bichos | +carpeta_nuevos | -> <carpeta_objetos> [hoja.png]
Con «+carpeta» se suman (o se reemplazan) solo esos bichos a los que ya están en el atlas del juego, sin tener que
volver a dibujar todos.
"""
import json
import os
import shutil
import sys
import tempfile

from PIL import Image, ImageDraw

CUADROS = ['normal', 'paso', 'parpadeo', 'golpe']
JEFES = {'espinillon', 'reinaCaspa', 'granMoco', 'senorLagana', 'barroNegro', 'senorSarro', 'donaCucaracha', 'motaPelo', 'tapon',
         'esponjaPodrida', 'peloDesague', 'duchaHelada', 'reyHongo', 'regaderaLoca', 'cortinaMohosa', 'ciempiesGigante',
         'donFrasco', 'reinaPompa', 'senorCuchillas', 'poteCrema', 'reySapo', 'pulpoDesague', 'bocaSifon', 'reinaGrasa',
         'donCactus', 'atrapamoscasGigante', 'materaGigante', 'patoInflable', 'donaFlotador', 'reyRaton'}
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'lavado')


def leer_meta(carpeta, nombre):
    with open(os.path.join(carpeta, f'{nombre}.txt')) as f:
        pu, pv, tam, res = f.read().split()
    return float(pu), float(pv), float(tam)


def atlas_bichos(carpeta):
    nombres = sorted({f.rsplit('_', 1)[0] for f in os.listdir(carpeta) if f.endswith('_normal.png')})
    comunes = [n for n in nombres if n not in JEFES]
    jefes = [n for n in nombres if n in JEFES]
    ANCHO = 2048
    # (los jefes en 160: con los escenarios de la ducha ya no caben todos en 192)
    C1, C2 = 128, 160
    por1, por2 = ANCHO // C1, ANCHO // C2
    filas1 = -(-len(comunes) * 4 // por1)
    filas2 = -(-len(jefes) * 4 // por2)
    alto = filas1 * C1 + filas2 * C2
    # (WebGL 2 no necesita potencias de dos: solo un múltiplo de 32)
    alto = -(-alto // 32) * 32
    img = Image.new('RGBA', (ANCHO, alto), (0, 0, 0, 0))
    datos = {'ancho': ANCHO, 'alto': alto, 'bichos': {}}
    k = 0
    for n in comunes:
        pu, pv, tam = leer_meta(carpeta, n)
        rects = []
        for c in CUADROS:
            x, y = (k % por1) * C1, (k // por1) * C1
            im = Image.open(os.path.join(carpeta, f'{n}_{c}.png')).convert('RGBA').resize((C1, C1), Image.LANCZOS)
            img.paste(im, (x, y))
            rects.append([x, y, C1, C1])
            k += 1
        datos['bichos'][n] = {'cuadros': rects, 'ancla': [round(pu, 4), round(pv, 4)], 'lado': round(tam, 4)}
    y0 = filas1 * C1
    k = 0
    for n in jefes:
        pu, pv, tam = leer_meta(carpeta, n)
        rects = []
        for c in CUADROS:
            x, y = (k % por2) * C2, y0 + (k // por2) * C2
            im = Image.open(os.path.join(carpeta, f'{n}_{c}.png')).convert('RGBA').resize((C2, C2), Image.LANCZOS)
            img.paste(im, (x, y))
            rects.append([x, y, C2, C2])
            k += 1
        datos['bichos'][n] = {'cuadros': rects, 'ancla': [round(pu, 4), round(pv, 4)], 'lado': round(tam, 4)}
    return img, datos


def extraer_bichos(destino):
    """Saca los cuadros de cada bicho del atlas que ya tiene el juego (como si fueran los PNG recién dibujados)."""
    with open(os.path.join(SALIDA, 'bichos.json')) as f:
        d = json.load(f)
    img = Image.open(os.path.join(SALIDA, 'bichos.webp')).convert('RGBA')
    for n, b in d['bichos'].items():
        for c, (x, y, w, h) in zip(CUADROS, b['cuadros']):
            img.crop((x, y, x + w, y + h)).save(os.path.join(destino, f'{n}_{c}.png'))
        with open(os.path.join(destino, f'{n}.txt'), 'w') as f:
            f.write(f"{b['ancla'][0]} {b['ancla'][1]} {b['lado']} {b['cuadros'][0][2]}\n")


def atlas_objetos(carpeta):
    """Objetos del piso, proyectiles e íconos (un cuadro cada uno, 128 px)."""
    nombres = sorted(f[:-4] for f in os.listdir(carpeta) if f.endswith('.png'))
    C = 128
    ANCHO = 2048
    por = ANCHO // C
    filas = -(-len(nombres) // por)
    alto = 1 << (max(1, filas * C) - 1).bit_length()
    img = Image.new('RGBA', (ANCHO, alto), (0, 0, 0, 0))
    datos = {'ancho': ANCHO, 'alto': alto, 'objetos': {}}
    for k, n in enumerate(nombres):
        x, y = (k % por) * C, (k // por) * C
        im = Image.open(os.path.join(carpeta, f'{n}.png')).convert('RGBA').resize((C, C), Image.LANCZOS)
        img.paste(im, (x, y))
        datos['objetos'][n] = [x, y, C, C]
    return img, datos


def hoja(img, cel, ruta):
    """Hoja de contacto sobre un fondo de piel (para ver bordes y tamaños)."""
    fondo = Image.new('RGBA', img.size, (246, 207, 179, 255))
    d = ImageDraw.Draw(fondo)
    for y in range(0, img.size[1], cel):
        d.line([(0, y), (img.size[0], y)], fill=(220, 180, 150, 255))
    fondo.alpha_composite(img)
    fondo.convert('RGB').save(ruta)


if __name__ == '__main__':
    os.makedirs(SALIDA, exist_ok=True)
    bichos, objetos = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ''
    # (con «-» en vez de la carpeta de los bichos, solo se rehace el atlas de los objetos)
    datos = {'ancho': 0, 'alto': 0, 'bichos': {}}
    if bichos.startswith('+'):
        tmp = tempfile.mkdtemp(prefix='bichos_')
        extraer_bichos(tmp)
        for f in os.listdir(bichos[1:]):
            shutil.copy(os.path.join(bichos[1:], f), tmp)
        bichos = tmp
    if bichos != '-':
        img, datos = atlas_bichos(bichos)
        img.save(os.path.join(SALIDA, 'bichos.webp'), 'WEBP', quality=88, method=6)
        with open(os.path.join(SALIDA, 'bichos.json'), 'w') as f:
            json.dump(datos, f, separators=(',', ':'))
        if len(sys.argv) > 3:
            hoja(img, 128, sys.argv[3])
    if objetos and os.path.isdir(objetos):
        img2, datos2 = atlas_objetos(objetos)
        img2.save(os.path.join(SALIDA, 'objetos.webp'), 'WEBP', quality=90, method=6)
        with open(os.path.join(SALIDA, 'objetos.json'), 'w') as f:
            json.dump(datos2, f, separators=(',', ':'))
        if len(sys.argv) > 3:
            hoja(img2, 128, sys.argv[3].replace('.png', '_objetos.png'))
    print('ATLAS listo', datos['ancho'], datos['alto'], len(datos['bichos']))
