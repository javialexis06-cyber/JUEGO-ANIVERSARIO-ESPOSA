"""Arma la hoja de plantas del tejado (4×2 celdas de 444 px) con el arte original de las plantas.

Siete plantas salen de Gardendless (PvZ2), capturadas con `capturar-gardendless.mjs` sobre fondo negro y blanco
para obtener el alfa exacto; el grano de café sale del sprite de PvZ 1 del repositorio de pvzm.net, porque
Gardendless no lo tiene. Uso:
  python3 scripts/arte-tejado/montar-plantas.py CAPTURAS CoffeeBean.gif
CAPTURAS contiene <Id>DIS-negro.png y <Id>DIS-blanco.png. Escribe public/jardin/pvz/plantas-tejado.png;
después `python3 scripts/jardin-webp.py --borrar-png` la pasa a WebP con alfa sin pérdida.
"""
import pathlib
import sys

import numpy as np
from PIL import Image, ImageFilter

CAPTURAS, CAFE = pathlib.Path(sys.argv[1]), sys.argv[2]
DESTINO = pathlib.Path(__file__).resolve().parents[2] / 'public' / 'jardin' / 'pvz' / 'plantas-tejado.png'
CELDA, MARGEN = 444, 14
# Mismo orden que ARTE_PLANTAS (grupo tejado) en src/jardin/pvz/arte/catalogo.ts.
ORDEN = ['CabbagePult', 'FloawerPot', 'KernelPult', None, 'Garlic', 'UmbrellaLeaf', 'MariGold', 'MelonPult']


def con_alfa(id_):
    negro = np.asarray(Image.open(CAPTURAS / f'{id_}DIS-negro.png').convert('RGB')).astype(float)
    blanco = np.asarray(Image.open(CAPTURAS / f'{id_}DIS-blanco.png').convert('RGB')).astype(float)
    alfa = np.clip(1 - (blanco - negro).mean(2) / 255, 0, 1)
    color = np.where(alfa[..., None] > 0.003, negro / np.maximum(alfa[..., None], 1e-3), 0)
    img = Image.fromarray(np.dstack([np.clip(color, 0, 255), alfa * 255]).astype(np.uint8), 'RGBA')
    return img.crop(img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())


def cafe():
    gif = Image.open(CAFE)
    gif.seek(0)
    img = gif.convert('RGBA')
    img = img.crop(img.getbbox())
    # Sprite de 37×46: se amplía con suavizado para que el escalón de píxeles no se note en la hoja.
    img = img.resize((img.width * 8, img.height * 8), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
    return img


hoja = Image.new('RGBA', (CELDA * 4, CELDA * 2), (0, 0, 0, 0))
for i, id_ in enumerate(ORDEN):
    img = con_alfa(id_) if id_ else cafe()
    lado = CELDA - 2 * MARGEN
    escala = min(lado / img.width, lado / img.height)
    img = img.resize((round(img.width * escala), round(img.height * escala)), Image.LANCZOS)
    x = (i % 4) * CELDA + (CELDA - img.width) // 2
    y = (i // 4) * CELDA + CELDA - MARGEN - img.height
    hoja.alpha_composite(img, (x, y))
hoja.save(DESTINO)
print('escrita', DESTINO, hoja.size)
