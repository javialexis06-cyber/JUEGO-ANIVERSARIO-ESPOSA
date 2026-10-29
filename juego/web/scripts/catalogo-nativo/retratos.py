"""Arma las hojas de retratos del catálogo nativo a partir de las capturas de capturar-gardendless.mjs
(cada unidad sobre negro y sobre blanco, para calcular el alfa exacto).

Uso: python3 scripts/catalogo-nativo/retratos.py CAPTURAS_PLANTAS CAPTURAS_ZOMBIS
Escribe public/jardin/pvz/retratos-nativos-{plantas,zombis}.webp y retratos-nativos.json (celda de cada id).
Las capturas son del arte de Gardendless (PopCap/EA), igual que el motor que ya carga el juego.
"""
import json
import pathlib
import sys

import numpy as np
from PIL import Image

AQUI = pathlib.Path(__file__).resolve().parent
WEB = AQUI.parents[1]
catalogo = json.loads((WEB / 'public/jardin/motores/pvz2/catalogo-nativo.json').read_text())
COLUMNAS = 16


def con_alfa(carpeta, nombre):
    negro, blanco = carpeta / f'{nombre}-negro.png', carpeta / f'{nombre}-blanco.png'
    if not negro.exists() or not blanco.exists():
        return None
    n = np.asarray(Image.open(negro).convert('RGB')).astype(float)
    b = np.asarray(Image.open(blanco).convert('RGB')).astype(float)
    alfa = np.clip(1 - (b - n).mean(2) / 255, 0, 1)
    color = np.where(alfa[..., None] > 0.003, n / np.maximum(alfa[..., None], 1e-3), 0)
    img = Image.fromarray(np.dstack([np.clip(color, 0, 255), alfa * 255]).astype(np.uint8), 'RGBA')
    caja = img.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
    return img.crop(caja) if caja else None


def hoja(carpeta, unidades, prefijo, sufijo, ancho, alto, destino):
    filas = (len(unidades) + COLUMNAS - 1) // COLUMNAS
    salida = Image.new('RGBA', (COLUMNAS * ancho, filas * alto), (0, 0, 0, 0))
    indice, faltan = {}, []
    for i, u in enumerate(unidades):
        img = con_alfa(carpeta, f'{prefijo}_{u["res"]}{sufijo}')
        if img is None:
            faltan.append(u['id'])
            continue
        e = min((ancho - 6) / img.width, (alto - 6) / img.height)
        img = img.resize((max(1, round(img.width * e)), max(1, round(img.height * e))), Image.LANCZOS)
        x, y = (i % COLUMNAS) * ancho, (i // COLUMNAS) * alto
        salida.alpha_composite(img, (x + (ancho - img.width) // 2, y + alto - 3 - img.height))
        indice[u['id']] = i
    salida.save(WEB / 'public/jardin/pvz' / destino, 'WEBP', quality=88, alpha_quality=90, method=6)
    return indice, faltan


plantas, faltan_p = hoja(pathlib.Path(sys.argv[1]), catalogo['plantas'], 'plants', 'DIS', 128, 128, 'retratos-nativos-plantas.webp')
zombis, faltan_z = hoja(pathlib.Path(sys.argv[2]), catalogo['zombis'], 'zombies', 'ZOMBIE', 128, 160, 'retratos-nativos-zombis.webp')
indice = {'columnas': COLUMNAS, 'plantas': {'celda': [128, 128], 'ids': plantas}, 'zombis': {'celda': [128, 160], 'ids': zombis}}
(WEB / 'public/jardin/pvz/retratos-nativos.json').write_text(json.dumps(indice, separators=(',', ':')) + '\n')
print(f'{len(plantas)} plantas y {len(zombis)} zombis con retrato')
if faltan_p or faltan_z:
    print('Sin captura:', ', '.join(faltan_p + faltan_z))
