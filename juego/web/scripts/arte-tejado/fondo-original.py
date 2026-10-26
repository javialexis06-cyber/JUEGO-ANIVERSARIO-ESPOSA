"""Escenarios del tejado (día y noche del jefe) a partir de los fondos originales de PvZ 1.

Fuentes: background5.jpg y background6boss.jpg (1400×600) de la carpeta images/ del repositorio
ruslan831/PlantsVsZombies-decompilation. En PvZ 1 las cinco primeras columnas del tejado bajan en pendiente
(20 px por columna, Board::GridToPixelY); aquí la vista dibuja el tablero plano, así que cada columna de la
imagen se sube lo que baja su pendiente y las tejas quedan alineadas con las casillas. El resultado mide lo
mismo que el lienzo del Jardín (1100×650, tablero en x=165, y=156, casillas de 80×92) y se dibuja 1:1.
Uso: python3 scripts/arte-tejado/fondo-original.py CARPETA_IMAGES
"""
import pathlib
import sys

import numpy as np
from PIL import Image

ORIGEN = pathlib.Path(sys.argv[1])
DESTINO = pathlib.Path(__file__).resolve().parents[2] / 'public' / 'jardin' / 'pvz'
ANCHO, ALTO, TX, TY, ALTO_FILA = 1100, 650, 165, 156, 92
# Casillas de PvZ 1 en coordenadas del fondo: x = 260 + 80·col, y = 70 + 85·fila + pendiente(col); el borde
# dibujado de las tejas queda unos 14 px más abajo.
X0, Y0, FILA = 260, 84, 85  # 84: borde visible de la primera fila de tejas


def aplanar(fuente):
    img = np.asarray(Image.open(fuente).convert('RGB')).astype(np.float32)
    alto, ancho = img.shape[:2]
    X, Y = np.meshgrid(np.arange(ANCHO, dtype=np.float32), np.arange(ALTO, dtype=np.float32))
    xb = X - TX + X0
    pendiente = np.clip(20 * (5.5 - (xb - X0) / 80), 0, 110)
    yb = Y0 + (Y - TY) * FILA / ALTO_FILA + pendiente
    arriba = yb < 0
    xb = np.clip(xb, 0, ancho - 1.001)
    yb = np.clip(yb, 0, alto - 1.001)
    x0, y0 = np.floor(xb).astype(int), np.floor(yb).astype(int)
    fx, fy = (xb - x0)[..., None], (yb - y0)[..., None]
    a = img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx
    b = img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx
    salida = a * (1 - fy) + b * fy
    # Por encima del borde de la imagen sigue el cielo: color de la fila superior, muy suavizado, oscureciéndose
    # un poco hacia arriba (el reflejo duplicaba la antena y las flores).
    cielo = img[0]
    nucleo = np.ones(121, dtype=np.float32) / 121
    cielo = np.stack([np.convolve(np.pad(cielo[:, k], 60, mode='edge'), nucleo, mode='valid') for k in range(3)], 1)
    cielo_x = cielo[np.clip(xb.astype(int), 0, ancho - 1)]
    t = np.clip(-yb / 120, 0, 1)[..., None]
    salida = np.where(arriba[..., None], cielo_x * (1 - 0.12 * t), salida)
    return Image.fromarray(np.clip(salida, 0, 255).astype(np.uint8), 'RGB')


for nombre, archivo in (('fondo-tejado', 'background5.jpg'), ('fondo-tejado-noche', 'background6boss.jpg')):
    salida = DESTINO / (nombre + '.webp')
    aplanar(ORIGEN / archivo).save(salida, 'WEBP', quality=86, method=6)
    print('escrito', salida)
