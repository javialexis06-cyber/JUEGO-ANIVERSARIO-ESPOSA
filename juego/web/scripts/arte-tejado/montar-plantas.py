"""Arma la hoja de plantas del tejado (4×2 celdas de 444 px) con el arte original de las plantas.

Siete plantas salen de Gardendless (PvZ2), capturadas con `capturar-gardendless.mjs` sobre fondo negro y blanco
para obtener el alfa exacto; el grano de café, que Gardendless no tiene, se arma con reanim.py desde
Coffeebean.reanim y sus piezas de PvZ 1 (repositorio ruslan831/PlantsVsZombies-decompilation). Uso:
  python3 scripts/arte-tejado/montar-plantas.py CAPTURAS ruta/reanim/Coffeebean.reanim
CAPTURAS contiene <Id>DIS-negro.png y <Id>DIS-blanco.png. Escribe public/jardin/pvz/plantas-tejado.png;
después `python3 scripts/jardin-webp.py --borrar-png` la pasa a WebP con alfa sin pérdida.
"""
import pathlib
import sys

import numpy as np
from PIL import Image

from reanim import dibujar

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
    # Resolución nativa de las piezas (en el juego se dibujan a la mitad).
    return dibujar(CAFE, 'anim_idle', escala=2.0)


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
