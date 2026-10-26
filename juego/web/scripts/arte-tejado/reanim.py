"""Dibuja un cuadro de una animación .reanim de PvZ 1 (pistas con x, y, kx, ky, sx, sy, f, i) como RGBA.

Los valores de cada cuadro heredan los del anterior; f=-1 oculta la pista. La matriz de cada pieza sigue
ReanimatorTransform de la reconstrucción técnica de PC: m00=cos(kx)·sx, m10=-sin(kx)·sx,
m01=sin(ky)·sy, m11=cos(ky)·sy, con kx y ky en grados negados. Uso como módulo: dibujar(ruta, 'anim_idle').
"""
import math
import pathlib
import re

import numpy as np
from PIL import Image


def leer(ruta):
    texto = pathlib.Path(ruta).read_text(errors='replace')
    pistas = []
    for nombre, cuerpo in re.findall(r'<track>\s*<name>(.*?)</name>(.*?)</track>', texto, re.S):
        cuadros, previo = [], dict(x=0.0, y=0.0, kx=0.0, ky=0.0, sx=1.0, sy=1.0, f=0, i=None)
        for t in re.findall(r'<t>(.*?)</t>', cuerpo, re.S):
            actual = dict(previo)
            for clave, valor in re.findall(r'<(\w+)>(.*?)</\1>', t):
                if clave in ('x', 'y', 'kx', 'ky', 'sx', 'sy'):
                    actual[clave] = float(valor)
                elif clave == 'f':
                    actual['f'] = int(valor)
                elif clave == 'i':
                    actual['i'] = valor
            cuadros.append(actual)
            previo = actual
        pistas.append((nombre, cuadros))
    return pistas


def rango(pistas, animacion):
    for nombre, cuadros in pistas:
        if nombre == animacion:
            visibles = [k for k, c in enumerate(cuadros) if c['f'] != -1]
            return visibles[0], visibles[-1]
    raise KeyError(animacion)


def dibujar_cuadro(ruta, pistas, cuadro, escala=1.0, lienzo=2400, ocultar=()):
    """Dibuja el cuadro absoluto `cuadro` con el origen en el centro de un lienzo fijo (sin recortar)."""
    ruta = pathlib.Path(ruta)
    pistas = pistas or leer(ruta)
    archivos = {p.stem.lower(): p for p in ruta.parent.glob('*.png')}
    # Formato de PopCap: color en .jpg y alfa en un .png con el mismo nombre terminado en «_».
    for jpg in ruta.parent.glob('*.jpg'):
        archivos.setdefault(jpg.stem.lower(), jpg)
    salida = Image.new('RGBA', (lienzo, lienzo), (0, 0, 0, 0))
    faltan = set()
    origen = lienzo / 2
    for nombre, cuadros in pistas:
        c = cuadros[min(cuadro, len(cuadros) - 1)]
        # Las pistas de control (anim_idle…) no tienen imagen; anim_head1 y similares sí son piezas.
        if c['f'] == -1 or not c['i'] or any(o in nombre.lower() for o in ocultar):
            continue
        clave = c['i'].lower().replace('image_reanim_', '')
        if clave not in archivos:
            faltan.add(clave)
            continue
        pieza = Image.open(archivos[clave]).convert('RGBA')
        mascara = archivos.get(clave + '_')
        if archivos[clave].suffix == '.jpg' and mascara:
            pieza.putalpha(Image.open(mascara).convert('L').resize(pieza.size))
        kx, ky = -math.radians(c['kx']), -math.radians(c['ky'])
        m00, m10 = math.cos(kx) * c['sx'], -math.sin(kx) * c['sx']
        m01, m11 = math.sin(ky) * c['sy'], math.cos(ky) * c['sy']
        directa = np.array([[m00 * escala, m01 * escala, c['x'] * escala + origen],
                            [m10 * escala, m11 * escala, c['y'] * escala + origen], [0, 0, 1]])
        inversa = np.linalg.inv(directa)
        capa = pieza.transform((lienzo, lienzo), Image.AFFINE, tuple(inversa[:2].ravel()), Image.BICUBIC)
        salida.alpha_composite(capa)
    if faltan:
        print('piezas sin imagen:', ', '.join(sorted(faltan)))
    return salida


def dibujar(ruta, animacion='anim_idle', desfase=0, escala=2.0, lienzo=600, ocultar=()):
    pistas = leer(ruta)
    salida = dibujar_cuadro(ruta, pistas, rango(pistas, animacion)[0] + desfase, escala, lienzo, ocultar)
    return salida.crop(salida.getbbox())


if __name__ == '__main__':
    import sys
    dibujar(sys.argv[1], *(sys.argv[3:4] or ['anim_idle'])).save(sys.argv[2])
