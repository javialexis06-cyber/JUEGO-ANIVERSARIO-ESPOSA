"""Nuestro Hogar · granja: muebles para los interiores (locales del pueblo, viviendas, dormitorios y cabaña).

Todo en medidas del juego (metros de la granja), en el origen, con la base en z=0 y el frente hacia -y (en three.js
queda mirando a la cámara). Se exporta en UN solo GLB (granja_muebles.glb) con un vacío «m_<clave>» por pieza: el
juego lo carga una vez y copia cada mueble compartiendo geometría y materiales.

Uso: blender -b -P granja_muebles.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import laca, luz, madera, tela  # noqa: E402
from tiendas import _mat  # noqa: E402

RNG = np.random.default_rng(7)


def mat(nombre, color, rough=0.6, **kw):
    return _mat(f'Granja | {nombre}', color, rough=rough, **kw)


def metal(nombre, color='#8D949C'):
    return _mat(f'Granja | metal {nombre}', color, rough=0.35, metallic=0.8)


def piedra(nombre, color='#9C968C'):
    return _mat(f'Granja | piedra {nombre}', color, rough=0.9, noise=dict(scale=12, strength=0.4, distance=0.01))


def vidrio(nombre, color):
    return _mat(f'Granja | vidrio {nombre}', color, rough=0.1, coat=0.6)


MAD = lambda: madera('granja clara', '#C9956A')  # noqa: E731
OSC = lambda: madera('granja oscura', '#8A5A3B')  # noqa: E731
CHOCO = lambda: madera('granja chocolate', '#6B4430')  # noqa: E731
COLORES = ('#E4566B', '#8EC5F0', '#F7C948', '#8FD6B9', '#C9B6EA', '#F28C45', '#3B6FB6', '#7FB069', '#D9A066')


def caja(coll, nombre, c, half, material, p=8.0, sub=1, n=3):
    return clay.rbox(nombre, c, half, coll, material, p=p, n=n, subsurf=sub)


def bola(coll, nombre, c, r, material, n=4, sub=1):
    if not isinstance(r, (tuple, list)):
        r = (r, r, r)
    return clay.blob(nombre, c, r, coll, material, n=n, subsurf=sub)


def cilindro(coll, nombre, c, r, h, material, seg=16, sub=0, r2=None):
    o = clay.lathe(nombre, [(r, 0.0), (r2 if r2 is not None else r, h)], coll, material, segments=seg, subsurf=sub)
    o.location = c
    return o


def tubo(coll, nombre, pts, r, material, seg=8, caps=('round', 'round')):
    return clay.sweep(nombre, pts, r, coll=coll, material=material, segments=seg, samples=4, caps=caps, subsurf=0)


def patas(coll, nombre, w, d, h, r, material, ins=0.06):
    for sx in (-1, 1):
        for sy in (-1, 1):
            caja(coll, f'{nombre} pata {sx}{sy}', (sx * (w - ins), sy * (d - ins), h / 2), (r, r, h / 2), material, p=10, sub=0)


def frasco(coll, nombre, x, y, z, r, h, contenido, tapa='#C9956A'):
    clay.lathe(nombre, [(0, 0), (r, 0), (r * 1.05, h * 0.8), (r * 0.7, h * 0.92), (r * 0.7, h)], coll, vidrio('frasco', '#DDEFF2'),
               segments=12, subsurf=0).location = (x, y, z)
    cilindro(coll, f'{nombre} contenido', (x, y, z + 0.005), r * 0.9, h * 0.65, mat(f'contenido {contenido}', contenido), seg=10)
    cilindro(coll, f'{nombre} tapa', (x, y, z + h), r * 0.78, h * 0.12, madera('tapa', tapa), seg=10)


def libro(coll, nombre, x, y, z, w, h, d, color, inclinado=0.0):
    o = caja(coll, nombre, (0, 0, h / 2), (w / 2, d / 2, h / 2), laca(f'libro {color}', color, 0.6), p=12, sub=0)
    o.location = (x, y, z)
    o.rotation_euler = (0, inclinado, 0)
    caja(coll, f'{nombre} lomo', (0, -d / 2, h * 0.75), (w / 2 + 0.002, 0.004, h * 0.04), mat('lomo dorado', '#E8C66A', 0.4), p=12,
         sub=0).parent = o
    return o


def fila_libros(coll, nombre, x0, x1, y, z, hmin, hmax, d=0.22):
    x = x0
    k = 0
    while x < x1 - 0.05:
        w = float(RNG.uniform(0.045, 0.085))
        h = float(RNG.uniform(hmin, hmax))
        col = COLORES[int(RNG.integers(0, len(COLORES)))]
        incl = 0.25 if RNG.random() < 0.08 and x + w + 0.1 < x1 else 0.0
        libro(coll, f'{nombre} {k}', x + w / 2 + (h * 0.12 if incl else 0), y, z, w, h, d, col, incl)
        x += w + 0.006 + (h * 0.25 if incl else 0)
        k += 1


def mueble_estantes(coll, nombre, w, d, h, niveles, material=None):
    material = material or OSC()
    for sx in (-1, 1):
        caja(coll, f'{nombre} lado {sx}', (sx * (w / 2 - 0.04), 0, h / 2), (0.04, d / 2, h / 2), material, p=10)
    caja(coll, f'{nombre} fondo', (0, d / 2 - 0.02, h / 2), (w / 2 - 0.04, 0.02, h / 2), material, p=12, sub=0)
    caja(coll, f'{nombre} corona', (0, -0.02, h + 0.05), (w / 2 + 0.06, d / 2 + 0.05, 0.06), material, p=6)
    caja(coll, f'{nombre} zócalo', (0, -0.01, 0.06), (w / 2, d / 2, 0.06), material, p=10)
    zs = [0.12 + (h - 0.25) * i / niveles for i in range(niveles + 1)]
    for i, z in enumerate(zs[1:-1]):
        caja(coll, f'{nombre} tabla {i}', (0, -0.01, z), (w / 2 - 0.05, d / 2 - 0.02, 0.025), MAD(), p=10, sub=0)
    return zs


# ---------------------------------------------------------------- comunes

def m_mostrador(coll):
    w = 2.3
    caja(coll, 'mostrador cuerpo', (0, 0.05, 0.52), (w, 0.38, 0.5), OSC(), p=10)
    for k in range(5):
        x = -w + 0.46 + k * (2 * w - 0.92) / 4
        caja(coll, f'mostrador panel {k}', (x, -0.34, 0.5), (0.36, 0.03, 0.3), MAD(), p=6)
        caja(coll, f'mostrador moldura {k}', (x, -0.37, 0.5), (0.28, 0.02, 0.22), OSC(), p=6, sub=0)
    caja(coll, 'mostrador cubierta', (0, 0, 1.06), (w + 0.12, 0.5, 0.06), CHOCO(), p=6)
    caja(coll, 'mostrador zócalo', (0, 0.0, 0.06), (w + 0.04, 0.42, 0.06), CHOCO(), p=10, sub=0)
    # Caja registradora
    caja(coll, 'registradora', (1.35, 0.1, 1.25), (0.26, 0.2, 0.14), laca('registradora', '#3E7C6B', 0.4), p=6)
    caja(coll, 'registradora pantalla', (1.35, 0.22, 1.47), (0.16, 0.05, 0.09), laca('registradora', '#3E7C6B', 0.4), p=6)
    caja(coll, 'registradora letrero', (1.35, 0.19, 1.47), (0.12, 0.012, 0.055), luz('cifras', '#FFE7A8', 1.0), p=6, sub=0)
    for i in range(3):
        for j in range(4):
            bola(coll, f'tecla {i}{j}', (1.2 + j * 0.1, -0.02 + i * 0.07, 1.4 + i * 0.03), (0.03, 0.025, 0.018), laca('tecla', '#F2EBDD', 0.4),
                 n=3)
    caja(coll, 'cajón registradora', (1.35, -0.12, 1.13), (0.24, 0.03, 0.05), metal('cajón', '#C9A44C'), p=6)
    # Campanita, frasco de dulces y libro de cuentas
    clay.lathe('campanita', [(0.0, 0.0), (0.08, 0.0), (0.075, 0.03), (0.05, 0.08), (0.0, 0.1)], coll, metal('campana', '#E8C66A'),
               segments=16, subsurf=1).location = (0.3, -0.25, 1.12)
    bola(coll, 'botón campanita', (0.3, -0.25, 1.23), 0.018, metal('campana', '#E8C66A'), n=3)
    frasco(coll, 'frasco dulces', -0.6, -0.1, 1.12, 0.11, 0.26, '#E4566B')
    for k in range(6):
        bola(coll, f'dulce {k}', (-0.6 + math.cos(k) * 0.05, -0.1 + math.sin(k) * 0.05, 1.32), 0.025, laca('dulce', COLORES[k], 0.3), n=3)
    caja(coll, 'libro cuentas', (-1.5, -0.05, 1.135), (0.2, 0.14, 0.015), laca('cuentas', '#A3443A', 0.5), p=10)
    caja(coll, 'hojas cuentas', (-1.5, -0.05, 1.155), (0.19, 0.13, 0.008), mat('papel', '#F2EBDD', 0.8), p=10, sub=0)
    tubo(coll, 'pluma', [(-1.38, -0.12, 1.17), (-1.3, -0.05, 1.22), (-1.2, 0.03, 1.3)], 0.008, mat('pluma', '#F6F1E6', 0.7))


def m_estante_mercado(coll):
    w, d, h = 1.4, 0.55, 2.4
    zs = mueble_estantes(coll, 'estante', w, d, h, 4)
    for i, z in enumerate(zs[:-1]):
        x = -w / 2 + 0.14
        k = 0
        while x < w / 2 - 0.14:
            t = int(RNG.integers(0, 3))
            col = COLORES[int(RNG.integers(0, len(COLORES)))]
            zz = z + 0.03
            if t == 0:
                frasco(coll, f'frasco {i}{k}', x, -0.02, zz, 0.07, 0.24, col)
                x += 0.17
            elif t == 1:
                caja(coll, f'paquete {i}{k}', (x + 0.04, -0.02, zz + 0.14), (0.08, 0.12, 0.14), laca(f'paquete {col}', col, 0.6), p=10)
                caja(coll, f'etiqueta {i}{k}', (x + 0.04, -0.143, zz + 0.16), (0.055, 0.004, 0.05), mat('etiqueta', '#F6F1E6', 0.8), p=10,
                     sub=0)
                x += 0.2
            else:
                clay.lathe(f'botella {i}{k}', [(0, 0), (0.05, 0), (0.055, 0.18), (0.02, 0.26), (0.018, 0.32)], coll,
                           vidrio(f'botella {col}', col), segments=10, subsurf=0).location = (x, -0.02, zz)
                x += 0.13
            k += 1
    # Letrero de madera arriba
    caja(coll, 'letrero estante', (0, -0.33, h - 0.05), (0.4, 0.02, 0.1), MAD(), p=6)


def m_ventana(coll):
    """Ventana para la pared del fondo (respaldo en y=0, centrada en z=0) con cortinas, alféizar y matas."""
    caja(coll, 'marco ventana', (0, 0, 0), (0.62, 0.05, 0.52), OSC(), p=8)
    caja(coll, 'vidrio ventana', (0, -0.04, 0), (0.54, 0.01, 0.45), luz('cielo ventana', '#CDE8F2', 0.9), p=12, sub=0)
    caja(coll, 'cruz v', (0, -0.06, 0), (0.025, 0.02, 0.45), MAD(), p=10, sub=0)
    caja(coll, 'cruz h', (0, -0.06, 0), (0.54, 0.02, 0.025), MAD(), p=10, sub=0)
    caja(coll, 'alféizar', (0, -0.12, -0.55), (0.72, 0.13, 0.04), MAD(), p=8)
    for sx in (-1, 1):
        pts = [(sx * (0.5 + 0.08 * math.sin(t * 6)), -0.1, 0.62 - t * 1.2) for t in np.linspace(0, 1, 6)]
        clay.sweep(f'cortina {sx}', pts, 0.08, profile=(1.0, 0.35), coll=coll, material=tela('cortina', '#F3D9A4'), segments=10,
                   samples=4, caps=('flat', 'round'), subsurf=0)
        tubo(coll, f'lazo cortina {sx}', [(sx * 0.42, -0.16, -0.05), (sx * 0.52, -0.2, -0.08), (sx * 0.62, -0.16, -0.05)], 0.02,
             tela('lazo', '#C9563F'))
    tubo(coll, 'barra cortina', [(-0.78, -0.1, 0.64), (0.78, -0.1, 0.64)], 0.018, CHOCO())
    for k, x in enumerate((-0.4, 0.0, 0.4)):
        cilindro(coll, f'matera ventana {k}', (x, -0.13, -0.51), 0.07, 0.12, mat('terracota', '#C9714A', 0.8), seg=12, r2=0.09)
        for j in range(5):
            a = j * 1.3
            bola(coll, f'hoja ventana {k}{j}', (x + math.cos(a) * 0.05, -0.13 + math.sin(a) * 0.05, -0.33 + j * 0.02), (0.06, 0.06, 0.05),
                 mat('hoja', '#5FA85A', 0.55), n=3)
        bola(coll, f'flor ventana {k}', (x, -0.15, -0.25), 0.04, laca('flor', ['#F48FB1', '#F7C948', '#C9B6EA'][k], 0.5), n=3)


def m_lampara(coll):
    """Lámpara colgante: el bombillo queda en z=0 y el cable sube 1 m."""
    tubo(coll, 'cable lámpara', [(0, 0, 0.12), (0, 0, 1.1)], 0.01, mat('cable', '#3A302A', 0.6))
    clay.lathe('pantalla lámpara', [(0.04, 0.2), (0.07, 0.17), (0.22, 0.04), (0.26, 0.0), (0.25, -0.01)], coll,
               laca('pantalla lámpara', '#C9563F', 0.4), segments=20, subsurf=1, cap_bottom=False, cap_top=True)
    clay.lathe('aro lámpara', [(0.25, -0.02), (0.27, 0.0), (0.25, 0.02)], coll, metal('aro', '#E8C66A'), segments=20, subsurf=0,
               cap_bottom=False, cap_top=False)
    bola(coll, 'bombillo', (0, 0, 0.02), 0.08, luz('bombillo', '#FFE2A0', 4.0), n=4)


def m_tapete(coll):
    clay.blob('tapete', (0, 0, 0.012), (1.2, 0.75, 0.012), coll, tela('tapete', '#B5553F'), n=8, p=5.0, subsurf=1)
    clay.blob('tapete centro', (0, 0, 0.022), (0.95, 0.55, 0.012), coll, tela('tapete centro', '#E3B45A'), n=8, p=5.0, subsurf=1)
    clay.blob('tapete rombo', (0, 0, 0.03), (0.45, 0.3, 0.01), coll, tela('tapete rombo', '#3E7C6B'), n=6, p=1.2, subsurf=1)
    for sx in (-1, 1):
        for k in range(10):
            tubo(coll, f'fleco {sx}{k}', [(sx * 1.2, -0.65 + k * 0.145, 0.01), (sx * 1.3, -0.65 + k * 0.145, 0.005)], 0.012,
                 tela('fleco', '#F2E3C4'), seg=5)


def m_planta(coll):
    clay.lathe('matera grande', [(0, 0), (0.18, 0), (0.24, 0.42), (0.27, 0.44), (0.27, 0.5), (0.0, 0.5)], coll,
               mat('terracota', '#C9714A', 0.8), segments=20, subsurf=1)
    clay.lathe('raya matera', [(0.22, 0.24), (0.235, 0.27), (0.225, 0.3)], coll, mat('raya', '#F2EBDD', 0.7), segments=20, subsurf=0,
               cap_bottom=False, cap_top=False)
    for k in range(9):
        a = k * 2 * math.pi / 9
        l = 0.5 + 0.2 * (k % 3)
        base = (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.48)
        punta = (math.cos(a) * l * 0.7, math.sin(a) * l * 0.7, 0.55 + l)
        mid = ((base[0] + punta[0]) / 2, (base[1] + punta[1]) / 2, punta[2] + 0.1)
        clay.sweep(f'hoja grande {k}', [base, mid, punta], [0.02, 0.1, 0.01], profile=(1.0, 0.18), coll=coll,
                   material=mat('hoja grande', ['#4C8B45', '#5FA85A', '#3F7A3C'][k % 3], 0.55), segments=8, samples=5,
                   caps=('flat', 'point'), subsurf=0)


def m_cuadro(coll):
    caja(coll, 'marco cuadro', (0, 0, 0), (0.42, 0.03, 0.32), madera('marco dorado', '#C8A15A'), p=8)
    caja(coll, 'lienzo cielo', (0, -0.03, 0.08), (0.36, 0.006, 0.18), mat('cielo', '#A8D4EA', 0.8), p=12, sub=0)
    caja(coll, 'lienzo prado', (0, -0.03, -0.17), (0.36, 0.006, 0.09), mat('prado', '#86B85A', 0.8), p=12, sub=0)
    for k, (x, r) in enumerate(((-0.18, 0.14), (0.1, 0.2), (0.3, 0.1))):
        bola(coll, f'monte cuadro {k}', (x, -0.035, -0.08), (r, 0.006, r * 0.7), mat('monte', '#6E9A55', 0.8), n=4)
    bola(coll, 'sol cuadro', (0.22, -0.036, 0.15), (0.05, 0.006, 0.05), mat('sol', '#F7C948', 0.6), n=4)


# ---------------------------------------------------------------- tienda de semillas

def m_exhibidor_semillas(coll):
    for sx in (-1, 1):
        caja(coll, f'lado exhibidor {sx}', (sx * 0.62, 0, 0.8), (0.04, 0.25, 0.8), OSC(), p=10)
    caja(coll, 'copete exhibidor', (0, 0, 1.68), (0.7, 0.28, 0.08), MAD(), p=6)
    caja(coll, 'letrero semillas', (0, -0.29, 1.68), (0.45, 0.02, 0.06), laca('letrero', '#7FB069', 0.5), p=6)
    for f in range(5):
        z = 0.2 + f * 0.3
        caja(coll, f'repisa {f}', (0, -0.05, z), (0.6, 0.2, 0.02), MAD(), p=10, sub=0)
        for k in range(6):
            col = COLORES[(f * 2 + k) % len(COLORES)]
            o = caja(coll, f'sobre {f}{k}', (0, 0, 0.11), (0.075, 0.012, 0.11), mat(f'sobre {col}', col, 0.7), p=12, sub=0)
            o.location = (-0.5 + k * 0.2, -0.12, z)
            o.rotation_euler = (-0.25, 0, 0)
            b = bola(coll, f'dibujo {f}{k}', (0, -0.014, 0.12), (0.035, 0.004, 0.035), mat('dibujo', '#F6F1E6', 0.7), n=3, sub=0)
            b.parent = o
            bola(coll, f'fruta {f}{k}', (0, -0.018, 0.12), (0.02, 0.003, 0.02), laca(f'fruta {k}', COLORES[(k + 3) % 9], 0.5), n=3,
                 sub=0).parent = o


def _costal(coll, nombre, x, y, s, color, abierto=None):
    def forma(v):
        z = v[:, 2]
        k = np.clip((z + 1) / 2, 0, 1)
        f = 1.0 + 0.15 * np.sin(k * math.pi) - 0.35 * np.clip(k - 0.7, 0, 1) / 0.3
        v[:, 0] *= f
        v[:, 1] *= f
        v[:, 2] = np.where(z < -0.6, -0.6 - (z + 0.6) * 0.3, z)
        return v
    clay.blob(nombre, (x, y, 0.32 * s), (0.28 * s, 0.24 * s, 0.38 * s), coll, tela(f'costal {color}', color), n=8, shaper=forma)
    if abierto:
        bola(coll, f'{nombre} grano', (x, y, 0.62 * s), (0.17 * s, 0.15 * s, 0.05 * s), mat(f'grano {abierto}', abierto, 0.8), n=4)
        clay.lathe(f'{nombre} boca', [(0.19 * s, 0.56 * s), (0.22 * s, 0.62 * s), (0.2 * s, 0.66 * s)], coll, tela(f'costal {color}', color),
                   segments=16, subsurf=1, cap_bottom=False, cap_top=False).location = (x, y, 0)
    else:
        clay.lathe(f'{nombre} amarre', [(0.07 * s, 0.6 * s), (0.08 * s, 0.63 * s), (0.07 * s, 0.66 * s)], coll, tela('cabuya', '#8A6A44'),
                   segments=12, subsurf=0, cap_bottom=False, cap_top=False).location = (x, y, 0)
        bola(coll, f'{nombre} copete', (x, y, 0.72 * s), (0.08 * s, 0.07 * s, 0.07 * s), tela(f'costal {color}', color), n=4)
    caja(coll, f'{nombre} etiqueta', (x, y - 0.25 * s, 0.35 * s), (0.1 * s, 0.01, 0.07 * s), mat('etiqueta costal', '#C9563F', 0.7), p=8,
         sub=0)


def m_costales(coll):
    _costal(coll, 'costal a', -0.3, 0, 1.0, '#D8C49C', abierto='#E8C35A')
    _costal(coll, 'costal b', 0.3, 0.05, 0.9, '#CDB68C', abierto='#A9744A')
    _costal(coll, 'costal c', 0.0, 0.45, 1.05, '#D3BE95')


def m_canasta_frutas(coll):
    clay.lathe('canasta', [(0, 0), (0.22, 0), (0.28, 0.2), (0.3, 0.22)], coll, mat('mimbre', '#B98A52', 0.85,
               noise=dict(scale=40, strength=0.5, distance=0.004)), segments=20, subsurf=1, cap_top=False)
    clay.lathe('borde canasta', [(0.29, 0.2), (0.32, 0.22), (0.29, 0.24)], coll, mat('mimbre oscuro', '#8A6238', 0.8), segments=20,
               subsurf=0, cap_bottom=False, cap_top=False)
    for k in range(4):
        z = 0.04 + k * 0.045
        clay.lathe(f'tejido {k}', [(0.225 + k * 0.016, z - 0.008), (0.235 + k * 0.016, z), (0.225 + k * 0.016, z + 0.008)], coll,
                   mat('mimbre oscuro', '#8A6238', 0.8), segments=20, subsurf=0, cap_bottom=False, cap_top=False)
    for k in range(9):
        a = k * 2.4
        r = 0.08 + 0.12 * (k % 3) / 2
        x, y = math.cos(a) * r, math.sin(a) * r
        bola(coll, f'manzana {k}', (x, y, 0.24 + (0.06 if k < 3 else 0)), 0.075, laca('manzana', '#D9453D' if k % 3 else '#F2A33A', 0.35),
             n=4)
        tubo(coll, f'palito {k}', [(x, y, 0.31 + (0.06 if k < 3 else 0)), (x + 0.01, y, 0.34 + (0.06 if k < 3 else 0))], 0.008,
             mat('palito', '#6B4430', 0.7), seg=4)


def m_cajon_verduras(coll):
    for sy in (-1, 1):
        for k in range(3):
            caja(coll, f'tabla cajón {sy}{k}', (0, sy * 0.25, 0.06 + k * 0.1), (0.4, 0.015, 0.04), MAD(), p=10, sub=0)
    for sx in (-1, 1):
        for k in range(3):
            caja(coll, f'tabla lado {sx}{k}', (sx * 0.4, 0, 0.06 + k * 0.1), (0.015, 0.25, 0.04), MAD(), p=10, sub=0)
    caja(coll, 'fondo cajón', (0, 0, 0.03), (0.38, 0.23, 0.02), OSC(), p=10, sub=0)
    for k in range(6):
        x, y = -0.25 + (k % 3) * 0.25, -0.1 + (k // 3) * 0.2
        if k % 2:
            bola(coll, f'repollo {k}', (x, y, 0.27), 0.12, mat('repollo', '#8CC46A', 0.6), n=5)
        else:
            for j in range(3):
                o = clay.lathe(f'zanahoria {k}{j}', [(0.0, 0.0), (0.03, 0.04), (0.035, 0.2), (0.0, 0.22)], coll,
                               laca('zanahoria', '#F28C45', 0.5), segments=10, subsurf=0)
                o.location = (x - 0.05 + j * 0.05, y, 0.12)
                o.rotation_euler = (0.4 * (j - 1), 0.3, 0)
                bola(coll, f'rama {k}{j}', (x - 0.05 + j * 0.05, y - 0.08 * (j - 1), 0.36), (0.03, 0.03, 0.06), mat('rama', '#5FA85A', 0.6),
                     n=3)


def m_calabazas(coll):
    def gajos(v):
        a = np.arctan2(v[:, 1], v[:, 0])
        f = 1 + 0.08 * np.cos(a * 8)
        v[:, 0] *= f
        v[:, 1] *= f
        return v
    for k, (x, y, r) in enumerate(((-0.2, 0, 0.24), (0.22, 0.05, 0.19), (0.02, 0.3, 0.16))):
        clay.blob(f'calabaza {k}', (x, y, r * 0.75), (r, r, r * 0.75), coll, laca('calabaza', '#E8892F', 0.5), n=8, shaper=gajos)
        tubo(coll, f'tallo {k}', [(x, y, r * 1.4), (x + 0.03, y, r * 1.6)], 0.025, mat('tallo', '#6B7D3A', 0.6), seg=6)


# ---------------------------------------------------------------- herrería

def m_yunque(coll):
    clay.lathe('tronco yunque', [(0, 0), (0.3, 0), (0.28, 0.45), (0.0, 0.45)], coll, madera('tronco', '#8A5A3B'), segments=18, subsurf=1)
    clay.lathe('anillos tronco', [(0.0, 0.452), (0.24, 0.452)], coll, madera('corte', '#D9B07C'), segments=18, subsurf=0,
               cap_bottom=False)
    hierro = metal('yunque', '#4E5258')
    caja(coll, 'yunque base', (0, 0, 0.53), (0.18, 0.14, 0.08), hierro, p=6)
    caja(coll, 'yunque cintura', (0, 0, 0.64), (0.1, 0.09, 0.06), hierro, p=6)
    caja(coll, 'yunque cara', (0.04, 0, 0.75), (0.3, 0.12, 0.07), hierro, p=6)
    clay.sweep('yunque cuerno', [(-0.24, 0, 0.75), (-0.38, 0, 0.77), (-0.5, 0, 0.8)], [0.07, 0.04, 0.008], coll=coll, material=hierro,
               segments=10, samples=4, caps=('flat', 'point'), subsurf=0)
    caja(coll, 'yunque brillo', (0.06, 0, 0.82), (0.24, 0.1, 0.006), metal('pulido', '#B8BCC2'), p=8, sub=0)
    # Martillo encima
    caja(coll, 'martillo cabeza', (0.15, -0.04, 0.87), (0.04, 0.09, 0.04), hierro, p=6)
    tubo(coll, 'martillo mango', [(0.15, -0.04, 0.87), (0.4, 0.1, 0.86)], 0.018, OSC())


def m_fragua(coll):
    ladrillo = piedra('ladrillo', '#9A5B45')
    caja(coll, 'fragua base', (0, 0, 0.42), (0.75, 0.55, 0.42), piedra('fragua', '#7B6F66'), p=6, sub=1)
    for i in range(4):
        for j in range(6):
            off = 0.12 if i % 2 else 0
            x = -0.62 + j * 0.25 + off
            if x > 0.66:
                continue
            caja(coll, f'ladrillo {i}{j}', (x, -0.56, 0.12 + i * 0.2), (0.11, 0.02, 0.085), ladrillo, p=6, sub=0)
    caja(coll, 'fragua borde', (0, 0, 0.86), (0.8, 0.6, 0.05), piedra('borde', '#5E5852'), p=6)
    caja(coll, 'brasas', (0, -0.05, 0.9), (0.5, 0.35, 0.03), luz('brasas', '#FF6A1A', 2.5), p=6, sub=0)
    for k in range(14):
        bola(coll, f'carbón {k}', (float(RNG.uniform(-0.45, 0.45)), float(RNG.uniform(-0.35, 0.25)), 0.93), 0.05,
             luz('carbón', '#FF9A3A', 3.0) if k % 3 else mat('carbón', '#2B2422', 0.8), n=3)
    clay.lathe('campana fragua', [(0.75, 1.6), (0.7, 1.62), (0.25, 2.1), (0.22, 2.2), (0.22, 2.9)], coll, piedra('campana', '#6E6660'),
               segments=4, subsurf=0, cap_bottom=False).rotation_euler = (0, 0, math.pi / 4)
    for sx in (-1, 1):
        caja(coll, f'poste campana {sx}', (sx * 0.7, 0.45, 1.25), (0.06, 0.06, 0.4), CHOCO(), p=10)
    # Fuelle
    clay.blob('fuelle', (0.95, -0.1, 0.55), (0.18, 0.25, 0.07), coll, mat('cuero', '#8A4A2E', 0.7), n=6, p=2.5)
    for sz in (-1, 1):
        caja(coll, f'tapa fuelle {sz}', (0.95, -0.1, 0.55 + sz * 0.07), (0.17, 0.26, 0.015), MAD(), p=8, sub=0)
    tubo(coll, 'boquilla fuelle', [(0.95, 0.15, 0.55), (0.82, 0.25, 0.6)], 0.03, metal('boquilla', '#B08D57'))
    # Tenazas apoyadas
    for s in (-1, 1):
        tubo(coll, f'tenaza {s}', [(-0.85, -0.3, 0.05), (-0.82 + s * 0.02, -0.3, 0.6), (-0.8 + s * 0.04, -0.32, 0.95)], 0.012,
             metal('tenaza', '#3A3A3E'))


def m_barril(coll):
    perfil = [(0.0, 0.0), (0.27, 0.0), (0.31, 0.15), (0.33, 0.35), (0.31, 0.55), (0.27, 0.7), (0.0, 0.7)]
    clay.lathe('barril', perfil, coll, madera('barril', '#A0703F'), segments=16, subsurf=1)
    for z, r in ((0.12, 0.305), (0.58, 0.305)):
        clay.lathe(f'aro {z}', [(r, z - 0.025), (r + 0.012, z), (r, z + 0.025)], coll, metal('aro barril', '#5D5A58'), segments=20,
                   subsurf=0, cap_bottom=False, cap_top=False)
    clay.lathe('tapa barril', [(0.0, 0.705), (0.25, 0.705)], coll, madera('tapa barril', '#8A5A3B'), segments=16, subsurf=0,
               cap_bottom=False)


def m_barril_agua(coll):
    m_barril(coll)
    clay.lathe('agua barril', [(0.0, 0.66), (0.25, 0.66)], coll, vidrio('agua', '#5C8FA3'), segments=16, subsurf=0, cap_bottom=False)
    tubo(coll, 'cucharón', [(0.1, 0.0, 0.68), (0.2, 0.05, 0.9), (0.28, 0.08, 1.0)], 0.012, MAD())


def m_panoplia(coll):
    """Tablero de herramientas colgado (respaldo en y=0, centrado en z=0)."""
    caja(coll, 'tablero', (0, 0, 0), (0.8, 0.03, 0.55), OSC(), p=8)
    for k in range(5):
        caja(coll, f'listón {k}', (0, -0.035, -0.45 + k * 0.22), (0.78, 0.008, 0.012), CHOCO(), p=10, sub=0)
    hierro = metal('herramienta', '#5A5E66')
    for k, x in enumerate((-0.6, -0.3, 0.0, 0.3, 0.6)):
        bola(coll, f'gancho {k}', (x, -0.05, 0.38), 0.02, metal('gancho', '#B08D57'), n=3)
        if k % 2 == 0:
            tubo(coll, f'mango {k}', [(x, -0.07, 0.35), (x, -0.07, -0.25)], 0.022, MAD())
            caja(coll, f'cabeza {k}', (x, -0.07, -0.3), (0.12, 0.04, 0.05), hierro, p=6)
        else:
            for s in (-1, 1):
                tubo(coll, f'tenaza {k}{s}', [(x, -0.07, 0.35), (x + s * 0.04, -0.07, -0.05), (x + s * 0.02, -0.07, -0.35)], 0.012, hierro)
    o = clay.sweep('herradura', [(math.cos(a) * 0.1, -0.06, 0.18 + math.sin(a) * 0.1) for a in np.linspace(-0.3, math.pi + 0.3, 8)],
                   0.018, profile=(1.0, 0.6), coll=coll, material=hierro, segments=6, samples=3, subsurf=0)
    o.location = (0.15, 0, -0.1)


def m_estante_armas(coll):
    for sx in (-1, 1):
        caja(coll, f'poste armas {sx}', (sx * 0.6, 0, 0.75), (0.05, 0.05, 0.75), OSC(), p=8)
    for z in (0.35, 1.2):
        caja(coll, f'travesaño {z}', (0, 0, z), (0.65, 0.07, 0.03), MAD(), p=8, sub=0)
    hoja = metal('hoja espada', '#C9CDD2')
    for k, x in enumerate((-0.4, -0.13, 0.13, 0.4)):
        clay.sweep(f'espada {k}', [(x, 0, 0.4), (x, 0, 1.1), (x, 0, 1.45)], [0.04, 0.035, 0.005], profile=(1.0, 0.2), coll=coll,
                   material=hoja, segments=8, samples=3, caps=('flat', 'point'), subsurf=0)
        caja(coll, f'guarda {k}', (x, 0, 0.4), (0.09, 0.025, 0.02), metal('guarda', '#C8A15A'), p=6, sub=0)
        tubo(coll, f'empuñadura {k}', [(x, 0, 0.4), (x, 0, 0.2)], 0.02, mat('cuero', '#8A4A2E', 0.7))
        bola(coll, f'pomo {k}', (x, 0, 0.18), 0.03, metal('guarda', '#C8A15A'), n=3)


# ---------------------------------------------------------------- carpintería

def m_banco_carpintero(coll):
    caja(coll, 'banco cubierta', (0, 0, 0.88), (0.95, 0.38, 0.06), madera('banco', '#C69A6B'), p=8)
    for sx in (-1, 1):
        caja(coll, f'banco pata {sx}', (sx * 0.8, 0, 0.42), (0.07, 0.3, 0.42), OSC(), p=10)
    caja(coll, 'banco travesaño', (0, 0, 0.2), (0.8, 0.05, 0.04), OSC(), p=10, sub=0)
    caja(coll, 'banco repisa', (0, 0, 0.3), (0.75, 0.3, 0.02), MAD(), p=10, sub=0)
    for k in range(3):
        caja(coll, f'tabla repisa {k}', (-0.3 + k * 0.05, 0, 0.34 + k * 0.03), (0.4, 0.1, 0.012), MAD(), p=10, sub=0)
    # Prensa
    caja(coll, 'prensa', (0.9, -0.38, 0.84), (0.1, 0.04, 0.08), MAD(), p=8)
    tubo(coll, 'tornillo prensa', [(0.9, -0.42, 0.84), (0.9, -0.6, 0.84)], 0.015, metal('tornillo'))
    tubo(coll, 'manija prensa', [(0.82, -0.6, 0.84), (0.98, -0.6, 0.84)], 0.012, MAD())
    # Serrucho, cepillo, martillo y tabla a medio cortar
    caja(coll, 'tabla en corte', (-0.2, 0, 0.96), (0.5, 0.12, 0.02), madera('tabla', '#DDB487'), p=10, sub=0)
    o = caja(coll, 'serrucho hoja', (0, 0, 0), (0.22, 0.002, 0.06), metal('serrucho', '#C9CDD2'), p=12, sub=0)
    o.location = (0.25, -0.05, 1.04)
    o.rotation_euler = (0, 0.2, 0.1)
    caja(coll, 'serrucho mango', (0.5, -0.04, 1.08), (0.06, 0.02, 0.05), mat('mango rojo', '#A3443A', 0.5), p=8)
    caja(coll, 'cepillo', (0.6, 0.15, 0.97), (0.12, 0.04, 0.04), MAD(), p=6)
    bola(coll, 'perilla cepillo', (0.68, 0.15, 1.03), 0.025, OSC(), n=3)
    for k in range(10):
        a0 = float(RNG.uniform(0, 6))
        x, y = float(RNG.uniform(-0.7, 0.7)), float(RNG.uniform(-0.3, 0.3))
        pts = [(x + math.cos(a0 + t * 4) * 0.03 * (1 + t), y + math.sin(a0 + t * 4) * 0.03 * (1 + t), 0.95 + t * 0.02) for t in
               np.linspace(0, 1, 5)]
        clay.sweep(f'viruta {k}', pts, 0.008, profile=(1.0, 0.3), coll=coll, material=mat('viruta', '#E8C99A', 0.7), segments=4,
                   samples=3, caps=('flat', 'flat'), subsurf=0)
    for k in range(12):
        bola(coll, f'aserrín {k}', (float(RNG.uniform(-0.9, 0.9)), float(RNG.uniform(-0.5, 0.2)), 0.005), (0.05, 0.05, 0.006),
             mat('aserrín', '#E3C79A', 0.9), n=3, sub=0)


def m_pila_tablas(coll):
    for k in range(7):
        col = ('#C69A6B', '#B88C5E', '#D3A777')[k % 3]
        caja(coll, f'tabla pila {k}', (float(RNG.uniform(-0.04, 0.04)), (k % 2) * 0.03, 0.05 + k * 0.085), (1.1, 0.16, 0.035),
             madera(f'tabla {col}', col), p=10, sub=0)
    for sx in (-1, 1):
        caja(coll, f'calzo {sx}', (sx * 0.8, 0, 0.02), (0.06, 0.2, 0.02), OSC(), p=10, sub=0)


def m_troncos(coll):
    for k, (x, z) in enumerate(((-0.28, 0.17), (0.0, 0.17), (0.28, 0.17), (-0.14, 0.45), (0.14, 0.45), (0.0, 0.72))):
        o = clay.lathe(f'tronco {k}', [(0.0, -0.6), (0.15, -0.6), (0.16, 0.0), (0.15, 0.6), (0.0, 0.6)], coll,
                       madera('corteza', '#7A5034'), segments=12, subsurf=0)
        o.location = (x, 0, z)
        o.rotation_euler = (math.pi / 2, 0, 0)
        c = clay.lathe(f'corte {k}', [(0.0, 0.0), (0.135, 0.0)], coll, madera('corte', '#D9B07C'), segments=12, subsurf=0,
                       cap_bottom=False)
        c.location = (x, -0.603, z)
        c.rotation_euler = (math.pi / 2, 0, 0)


def m_silla(coll):
    caja(coll, 'silla asiento', (0, 0, 0.45), (0.22, 0.22, 0.03), MAD(), p=8)
    patas(coll, 'silla', 0.22, 0.22, 0.44, 0.022, OSC(), ins=0.03)
    for sx in (-1, 1):
        caja(coll, f'silla poste {sx}', (sx * 0.19, 0.19, 0.75), (0.022, 0.022, 0.3), OSC(), p=10, sub=0)
    for k in range(3):
        caja(coll, f'silla travesaño {k}', (0, 0.19, 0.62 + k * 0.13), (0.19, 0.015, 0.035), MAD(), p=10, sub=0)
    clay.blob('cojín silla', (0, -0.01, 0.5), (0.19, 0.19, 0.035), coll, tela('cojín', '#C9563F'), n=5, p=3.0)


# ---------------------------------------------------------------- tienda de animales

def m_paca_heno(coll):
    paja = mat('heno', '#E3C77A', 0.95, noise=dict(scale=30, strength=0.7, distance=0.012))
    caja(coll, 'paca', (0, 0, 0.24), (0.42, 0.28, 0.24), paja, p=5, sub=1, n=4)
    for x in (-0.18, 0.18):
        for (a, b) in (((x, -0.29, 0.0), (x, -0.29, 0.49)), ((x, -0.29, 0.49), (x, 0.29, 0.49))):
            tubo(coll, f'cuerda {x} {a[1]}{b[1]}', [a, b], 0.012, mat('cabuya', '#8A6A44', 0.8), seg=5)
    for k in range(16):
        x, y = float(RNG.uniform(-0.4, 0.4)), float(RNG.uniform(-0.27, 0.27))
        a = float(RNG.uniform(0, 6))
        tubo(coll, f'pajita {k}', [(x, y, 0.48), (x + math.cos(a) * 0.12, y + math.sin(a) * 0.12, 0.5 + float(RNG.uniform(0, 0.05)))],
             0.006, mat('pajita', '#F0D88E', 0.8), seg=4)


def m_montura(coll):
    caja(coll, 'caballete', (0, 0, 0.6), (0.45, 0.06, 0.04), MAD(), p=8)
    for sx in (-1, 1):
        for sy in (-1, 1):
            tubo(coll, f'pata caballete {sx}{sy}', [(sx * 0.38, 0, 0.6), (sx * 0.42, sy * 0.25, 0.0)], 0.025, OSC())
    clay.blob('montura', (0, 0, 0.7), (0.32, 0.3, 0.1), coll, mat('cuero', '#8A4A2E', 0.55), n=6, p=2.2)
    clay.blob('silla montura', (0.04, 0, 0.8), (0.18, 0.18, 0.05), coll, mat('cuero oscuro', '#5E3220', 0.55), n=5)
    bola(coll, 'cabeza montura', (-0.24, 0, 0.84), (0.05, 0.05, 0.07), mat('cuero oscuro', '#5E3220', 0.55), n=4)
    for sy in (-1, 1):
        tubo(coll, f'correa {sy}', [(0.0, sy * 0.28, 0.66), (0.0, sy * 0.32, 0.35)], 0.012, mat('correa', '#3A2A20', 0.6))
        clay.lathe(f'estribo {sy}', [(0.05, -0.015), (0.06, 0.0), (0.05, 0.015)], coll, metal('estribo', '#B08D57'), segments=12,
                   subsurf=0, cap_bottom=False, cap_top=False).location = (0, sy * 0.32, 0.32)
    clay.blob('manta montura', (0, 0, 0.64), (0.36, 0.34, 0.03), coll, tela('manta', '#3E7C6B'), n=6, p=3.0)


def m_comedero(coll):
    for sx in (-1, 1):
        caja(coll, f'lado comedero {sx}', (sx * 0.55, 0, 0.18), (0.03, 0.2, 0.18), OSC(), p=8)
    for sy in (-1, 1):
        o = caja(coll, f'tabla comedero {sy}', (0, 0, 0), (0.53, 0.02, 0.12), MAD(), p=10, sub=0)
        o.location = (0, sy * 0.13, 0.22)
        o.rotation_euler = (sy * 0.4, 0, 0)
    bola(coll, 'grano comedero', (0, 0, 0.26), (0.5, 0.1, 0.04), mat('grano', '#E8C35A', 0.8), n=4)


# ---------------------------------------------------------------- clínica

def m_vitrina_frascos(coll):
    w, d, h = 1.2, 0.45, 2.1
    blanco = laca('vitrina', '#EDE6D6', 0.5)
    for sx in (-1, 1):
        caja(coll, f'vitrina lado {sx}', (sx * (w / 2 - 0.03), 0, h / 2), (0.03, d / 2, h / 2), blanco, p=10)
    caja(coll, 'vitrina fondo', (0, d / 2 - 0.02, h / 2), (w / 2, 0.02, h / 2), laca('fondo vitrina', '#BFD9CF', 0.6), p=12, sub=0)
    caja(coll, 'vitrina corona', (0, 0, h + 0.04), (w / 2 + 0.05, d / 2 + 0.04, 0.05), blanco, p=6)
    # Cajoncitos abajo
    caja(coll, 'cajonera', (0, 0, 0.4), (w / 2 - 0.03, d / 2, 0.4), blanco, p=10)
    for i in range(3):
        for j in range(4):
            x, z = -0.42 + j * 0.28, 0.15 + i * 0.25
            caja(coll, f'cajoncito {i}{j}', (x, -d / 2, z), (0.12, 0.01, 0.1), laca('cajoncito', '#DCCFB6', 0.5), p=8, sub=0)
            bola(coll, f'perilla {i}{j}', (x, -d / 2 - 0.02, z), 0.015, metal('perilla', '#C8A15A'), n=3, sub=0)
    for f in range(3):
        z = 0.85 + f * 0.4
        caja(coll, f'vitrina repisa {f}', (0, 0, z), (w / 2 - 0.05, d / 2 - 0.03, 0.015), blanco, p=10, sub=0)
        for k in range(6):
            col = ('#9FD6E6', '#F4A7B9', '#BFE39A', '#F7D55A', '#C9B6EA', '#F28C45')[(f + k) % 6]
            x = -0.45 + k * 0.18
            if (f + k) % 2:
                clay.lathe(f'botella {f}{k}', [(0, 0), (0.05, 0), (0.06, 0.12), (0.025, 0.2), (0.02, 0.26)], coll,
                           vidrio(f'medicina {col}', col), segments=10, subsurf=0).location = (x, 0, z + 0.015)
                cilindro(coll, f'corcho {f}{k}', (x, 0, z + 0.27), 0.022, 0.04, mat('corcho', '#B98A52', 0.8), seg=8)
            else:
                frasco(coll, f'tarro {f}{k}', x, 0, z + 0.015, 0.06, 0.18, col)
    for sx in (-1, 0, 1):
        caja(coll, f'marco puerta {sx}', (sx * (w / 2 - 0.05), -d / 2 - 0.01, 1.45), (0.025, 0.01, 0.62), blanco, p=10, sub=0)


def m_camilla(coll):
    caja(coll, 'camilla marco', (0, 0, 0.55), (0.45, 1.0, 0.05), metal('camilla', '#C9CDD2'), p=8)
    patas(coll, 'camilla', 0.45, 1.0, 0.55, 0.025, metal('camilla', '#C9CDD2'), ins=0.05)
    clay.blob('colchón camilla', (0, 0, 0.66), (0.43, 0.98, 0.07), coll, tela('colchón', '#F3F6EE'), n=6, p=4.0)
    clay.blob('almohada camilla', (0, 0.72, 0.76), (0.32, 0.16, 0.06), coll, tela('almohada', '#FFFFFF'), n=5, p=3.0)
    clay.blob('cobija doblada', (0, -0.6, 0.76), (0.4, 0.22, 0.05), coll, tela('cobija clínica', '#9FC9B5'), n=5, p=4.0)
    clay.stitches('costura cobija', [(-0.38, -0.81, 0.79), (0.38, -0.81, 0.79)], coll=coll, material=tela('costura', '#FFFFFF'))
    caja(coll, 'mesita', (0.75, 0.6, 0.45), (0.2, 0.2, 0.02), metal('camilla', '#C9CDD2'), p=8, sub=0)
    tubo(coll, 'poste mesita', [(0.75, 0.6, 0.0), (0.75, 0.6, 0.45)], 0.02, metal('camilla', '#C9CDD2'))
    frasco(coll, 'frasco mesita', 0.7, 0.55, 0.47, 0.05, 0.14, '#F4A7B9')
    caja(coll, 'vendas', (0.82, 0.65, 0.5), (0.05, 0.05, 0.04), tela('venda', '#FFFFFF'), p=4)


def m_biombo(coll):
    for k in range(3):
        a = (k - 1) * 0.35
        x = (k - 1) * 0.48
        y = abs(k - 1) * 0.12
        o = caja(coll, f'marco biombo {k}', (0, 0, 0.85), (0.24, 0.025, 0.85), MAD(), p=8)
        o.location = (x, y, 0)
        o.rotation_euler = (0, 0, a)
        t = caja(coll, f'tela biombo {k}', (0, -0.01, 0.9), (0.2, 0.03, 0.72), tela('biombo', '#CFE0D0'), p=6)
        t.parent = o
        f = bola(coll, f'flor biombo {k}', (0, -0.045, 1.1), (0.07, 0.01, 0.07), tela('flor biombo', '#F4A7B9'), n=4)
        f.parent = o


def m_botiquin(coll):
    caja(coll, 'botiquín', (0, 0, 0), (0.22, 0.08, 0.17), laca('botiquín', '#FFFFFF', 0.4), p=6)
    caja(coll, 'cruz h', (0, -0.085, 0), (0.1, 0.01, 0.035), laca('cruz', '#D9453D', 0.4), p=8, sub=0)
    caja(coll, 'cruz v', (0, -0.085, 0), (0.035, 0.01, 0.1), laca('cruz', '#D9453D', 0.4), p=8, sub=0)


# ---------------------------------------------------------------- posada

def m_mesa_taberna(coll):
    clay.lathe('mesa redonda', [(0, 0.76), (0.62, 0.76), (0.64, 0.8), (0.62, 0.84), (0, 0.84)], coll, madera('mesa', '#A97445'),
               segments=24, subsurf=1)
    clay.lathe('pie mesa', [(0.3, 0.0), (0.32, 0.04), (0.08, 0.1), (0.07, 0.6), (0.14, 0.76)], coll, OSC(), segments=16, subsurf=1,
               cap_top=False)
    for k in range(3):
        a = k * 2.2 + 0.3
        x, y = math.cos(a) * 0.35, math.sin(a) * 0.35
        clay.lathe(f'jarra {k}', [(0, 0), (0.06, 0), (0.065, 0.16), (0.06, 0.17)], coll, madera('jarra', '#8A5A3B'), segments=12,
                   subsurf=0, cap_top=False).location = (x, y, 0.84)
        clay.lathe(f'espuma {k}', [(0.0, 0.16), (0.062, 0.16), (0.05, 0.19), (0.0, 0.2)], coll, mat('espuma', '#FFF6E0', 0.5), segments=12,
                   subsurf=1).location = (x, y, 0.84)
        clay.lathe(f'aro jarra {k}', [(0.066, 0.05), (0.07, 0.06), (0.066, 0.07)], coll, metal('aro jarra', '#5D5A58'), segments=12,
                   subsurf=0, cap_bottom=False, cap_top=False).location = (x, y, 0.84)
        tubo(coll, f'asa {k}', [(x + math.cos(a) * 0.06, y + math.sin(a) * 0.06, 0.97), (x + math.cos(a) * 0.12, y + math.sin(a) * 0.12, 0.93),
                                (x + math.cos(a) * 0.06, y + math.sin(a) * 0.06, 0.88)], 0.012, madera('jarra', '#8A5A3B'))
    clay.lathe('plato', [(0, 0.845), (0.16, 0.845), (0.18, 0.865)], coll, laca('plato', '#F2EBDD', 0.4), segments=16, subsurf=0,
               cap_top=False)
    bola(coll, 'pan', (0.02, 0.0, 0.9), (0.11, 0.07, 0.05), mat('pan', '#C98A45', 0.6), n=4)
    bola(coll, 'queso', (-0.09, 0.05, 0.89), (0.05, 0.04, 0.035), mat('queso', '#F2C14E', 0.5), n=3)
    clay.lathe('vela mesa', [(0, 0), (0.03, 0), (0.03, 0.12), (0, 0.12)], coll, mat('cera', '#F3EAD8', 0.6), segments=10,
               subsurf=0).location = (-0.2, -0.25, 0.84)
    bola(coll, 'llama mesa', (-0.2, -0.25, 0.99), (0.018, 0.018, 0.035), luz('llama', '#FFC86A', 5.0), n=3)


def m_taburete(coll):
    clay.lathe('taburete', [(0, 0.5), (0.2, 0.5), (0.22, 0.53), (0.2, 0.56), (0, 0.56)], coll, MAD(), segments=16, subsurf=1)
    for k in range(3):
        a = k * 2 * math.pi / 3
        tubo(coll, f'pata taburete {k}', [(math.cos(a) * 0.1, math.sin(a) * 0.1, 0.5), (math.cos(a) * 0.18, math.sin(a) * 0.18, 0.0)],
             0.025, OSC())
    clay.lathe('aro taburete', [(0.14, 0.18), (0.15, 0.2), (0.14, 0.22)], coll, OSC(), segments=12, subsurf=0, cap_bottom=False,
               cap_top=False)


def m_barril_grande(coll):
    for sx in (-1, 1):
        caja(coll, f'soporte {sx}', (sx * 0.35, 0, 0.18), (0.05, 0.35, 0.18), OSC(), p=8)
    perfil = [(0.0, -0.45), (0.33, -0.45), (0.38, -0.2), (0.4, 0.0), (0.38, 0.2), (0.33, 0.45), (0.0, 0.45)]
    o = clay.lathe('barril grande', perfil, coll, madera('barril', '#A0703F'), segments=18, subsurf=1)
    o.location = (0, 0, 0.62)
    o.rotation_euler = (0, math.pi / 2, 0)
    for x in (-0.3, 0.3):
        a = clay.lathe(f'aro grande {x}', [(0.36, -0.025), (0.375, 0.0), (0.36, 0.025)], coll, metal('aro barril', '#5D5A58'), segments=20,
                       subsurf=0, cap_bottom=False, cap_top=False)
        a.location = (x, 0, 0.62)
        a.rotation_euler = (0, math.pi / 2, 0)
    o = clay.lathe('tapa grande', [(0.0, 0.0), (0.32, 0.0)], coll, madera('tapa barril', '#8A5A3B'), segments=18, subsurf=0,
                   cap_bottom=False)
    o.location = (0, -0.452, 0.62)
    o.rotation_euler = (math.pi / 2, 0, 0)
    tubo(coll, 'grifo', [(0, -0.45, 0.45), (0, -0.55, 0.45), (0, -0.56, 0.38)], 0.025, metal('grifo', '#C8A15A'))
    caja(coll, 'llave grifo', (0, -0.52, 0.5), (0.04, 0.01, 0.02), metal('grifo', '#C8A15A'), p=6, sub=0)


def m_estante_botellas(coll):
    w, d, h = 1.4, 0.4, 1.9
    zs = mueble_estantes(coll, 'botellero', w, d, h, 3)
    for i, z in enumerate(zs[:-1]):
        for k in range(8):
            col = ('#4C8B45', '#8A3A3A', '#C8A15A', '#3B6FB6')[(i + k) % 4]
            x = -0.55 + k * 0.155
            clay.lathe(f'botella bar {i}{k}', [(0, 0), (0.055, 0), (0.06, 0.2), (0.025, 0.28), (0.02, 0.36)], coll,
                       vidrio(f'bar {col}', col), segments=10, subsurf=0).location = (x, 0, z + 0.03)
            caja(coll, f'etiqueta bar {i}{k}', (x, -0.06, z + 0.13), (0.035, 0.004, 0.04), mat('etiqueta', '#F6F1E6', 0.8), p=10, sub=0)


def m_chimenea(coll):
    """Chimenea de piedra para la pared del fondo (respaldo en y=0)."""
    rocas = piedra('chimenea', '#A39A8E')
    caja(coll, 'chimenea cuerpo', (0, 0.25, 1.4), (0.85, 0.25, 1.4), rocas, p=6)
    for i in range(9):
        for j in range(5):
            x = -0.68 + j * 0.34 + (0.17 if i % 2 else 0)
            z = 0.15 + i * 0.3
            if abs(x) < 0.5 and z < 1.0 or abs(x) > 0.8:
                continue
            bola(coll, f'piedra {i}{j}', (x, -0.02, z), (0.15, 0.05, 0.12), piedra(f'piedra {(i + j) % 3}', ('#B3AA9E', '#958B80', '#C2BAAE')[(i + j) % 3]),
                 n=3)
    caja(coll, 'hogar', (0, -0.01, 0.48), (0.45, 0.04, 0.42), mat('hollín', '#2B2422', 0.95), p=8, sub=0)
    clay.lathe('arco', [(0.45, -0.04), (0.5, 0.0), (0.45, 0.04)], coll, rocas, segments=24, subsurf=0, cap_bottom=False,
               cap_top=False).location = (0, -0.05, 0.9)
    caja(coll, 'repisa chimenea', (0, -0.12, 1.12), (0.95, 0.16, 0.06), CHOCO(), p=6)
    caja(coll, 'piso chimenea', (0, -0.3, 0.03), (0.9, 0.32, 0.03), piedra('piso', '#7B6F66'), p=6)
    for k, x in enumerate((-0.2, 0.0, 0.2)):
        o = clay.lathe(f'leño {k}', [(0.0, -0.25), (0.06, -0.25), (0.065, 0.0), (0.06, 0.25), (0.0, 0.25)], coll, madera('corteza', '#7A5034'),
                       segments=10, subsurf=0)
        o.location = (x * 0.5, -0.15, 0.12 + (0.08 if k == 1 else 0))
        o.rotation_euler = (0, math.pi / 2, 0.5 * (k - 1))
    for k in range(5):
        x = -0.2 + k * 0.1
        clay.blob(f'llama {k}', (x, -0.15, 0.32 + (k % 2) * 0.06), (0.07, 0.05, 0.16 + (k % 2) * 0.06), coll,
                  luz('fuego', '#FF8A3D', 4.0), n=4, p=1.6)
        clay.blob(f'llama clara {k}', (x, -0.18, 0.28), (0.04, 0.03, 0.09), coll, luz('fuego claro', '#FFE08A', 5.0), n=3)
    # Encima: reloj, frascos y una matica
    caja(coll, 'reloj repisa', (0, -0.12, 1.32), (0.12, 0.06, 0.14), madera('reloj', '#A97445'), p=6)
    clay.lathe('esfera reloj', [(0.0, 0.0), (0.08, 0.0)], coll, mat('esfera', '#F6F1E6', 0.6), segments=16, subsurf=0,
               cap_bottom=False).location = (0, -0.185, 1.34)
    bpy.data.objects['esfera reloj'].rotation_euler = (math.pi / 2, 0, 0)
    frasco(coll, 'frasco repisa', -0.6, -0.12, 1.18, 0.06, 0.18, '#F4A7B9')
    clay.lathe('jarrón repisa', [(0, 0), (0.06, 0), (0.08, 0.1), (0.04, 0.2), (0.05, 0.24)], coll, laca('jarrón', '#3B6FB6', 0.4),
               segments=12, subsurf=1).location = (0.6, -0.12, 1.18)
    for k in range(4):
        bola(coll, f'flor jarrón {k}', (0.6 + math.cos(k * 1.6) * 0.05, -0.12 + math.sin(k * 1.6) * 0.05, 1.47), 0.04,
             laca('flor jarrón', ('#F48FB1', '#F7C948')[k % 2], 0.5), n=3)


# ---------------------------------------------------------------- archivo

def m_biblioteca(coll):
    w, d, h = 1.3, 0.4, 2.3
    zs = mueble_estantes(coll, 'biblioteca', w, d, h, 5, material=CHOCO())
    for i, z in enumerate(zs[:-1]):
        fila_libros(coll, f'libro {i}', -w / 2 + 0.08, w / 2 - 0.08, -0.02, z + 0.025, 0.24, 0.33)
    for sx in (-1, 1):
        tubo(coll, f'riel escalera {sx}', [(0.4 + sx * 0.12, -0.45, 0.0), (0.4 + sx * 0.12, -0.3, 1.6)], 0.02, MAD())
    for k in range(5):
        z = 0.25 + k * 0.3
        t = z / 1.6
        tubo(coll, f'peldaño {k}', [(0.28, -0.45 + t * 0.15, z), (0.52, -0.45 + t * 0.15, z)], 0.018, MAD())


def m_escritorio(coll):
    caja(coll, 'escritorio cubierta', (0, 0, 0.78), (0.75, 0.4, 0.04), CHOCO(), p=8)
    for sx in (-1, 1):
        caja(coll, f'cajonera {sx}', (sx * 0.52, 0, 0.38), (0.2, 0.36, 0.38), OSC(), p=10)
        for k in range(3):
            caja(coll, f'cajón esc {sx}{k}', (sx * 0.52, -0.365, 0.15 + k * 0.24), (0.17, 0.01, 0.09), MAD(), p=8, sub=0)
            bola(coll, f'tirador {sx}{k}', (sx * 0.52, -0.385, 0.15 + k * 0.24), 0.015, metal('tirador', '#C8A15A'), n=3, sub=0)
    # Libro abierto, tintero, pluma, vela y pergaminos
    for s in (-1, 1):
        o = caja(coll, f'página {s}', (s * 0.13, 0, 0), (0.13, 0.17, 0.01), mat('página', '#F6EEDB', 0.8), p=10, sub=0)
        o.location = (-0.1, -0.05, 0.83)
        o.rotation_euler = (0, -s * 0.12, 0)
    caja(coll, 'tapa libro abierto', (-0.1, -0.05, 0.822), (0.28, 0.18, 0.006), laca('tapa', '#7A3A3A', 0.5), p=10, sub=0)
    clay.lathe('tintero', [(0, 0), (0.05, 0), (0.05, 0.05), (0.025, 0.07), (0.025, 0.08)], coll, vidrio('tinta', '#2C3E66'), segments=12,
               subsurf=0).location = (0.35, 0.15, 0.82)
    clay.sweep('pluma escritorio', [(0.35, 0.15, 0.86), (0.4, 0.2, 1.0), (0.45, 0.25, 1.12)], [0.005, 0.03, 0.005],
               profile=(1.0, 0.2), coll=coll, material=mat('pluma', '#F6F1E6', 0.7), segments=6, samples=4, subsurf=0)
    clay.lathe('candelero', [(0, 0), (0.07, 0), (0.07, 0.015), (0.02, 0.03), (0.02, 0.07), (0.035, 0.08)], coll, metal('candelero', '#C8A15A'),
               segments=12, subsurf=0).location = (-0.55, 0.15, 0.82)
    clay.lathe('vela', [(0, 0), (0.025, 0), (0.025, 0.16), (0, 0.16)], coll, mat('cera', '#F3EAD8', 0.6), segments=10,
               subsurf=0).location = (-0.55, 0.15, 0.9)
    bola(coll, 'llama vela', (-0.55, 0.15, 1.1), (0.016, 0.016, 0.032), luz('llama', '#FFC86A', 5.0), n=3)
    for k in range(3):
        o = clay.lathe(f'pergamino {k}', [(0.0, -0.15), (0.035, -0.15), (0.035, 0.15), (0.0, 0.15)], coll, mat('pergamino', '#EFE2C8', 0.8),
                       segments=10, subsurf=0)
        o.location = (0.4 - k * 0.04, -0.2 + k * 0.08, 0.86)
        o.rotation_euler = (0, math.pi / 2, 0.3 * k)
        clay.lathe(f'cinta {k}', [(0.037, -0.015), (0.04, 0.0), (0.037, 0.015)], coll, tela('cinta', '#C9563F'), segments=10, subsurf=0,
                   cap_bottom=False, cap_top=False).parent = o


def m_globo(coll):
    clay.lathe('base globo', [(0, 0), (0.18, 0), (0.18, 0.03), (0.04, 0.08), (0.03, 0.5), (0.0, 0.5)], coll, CHOCO(), segments=16, subsurf=1)
    bola(coll, 'globo', (0, 0, 0.78), 0.25, laca('mar', '#6FA3C7', 0.35), n=6)
    for k in range(5):
        a, e = k * 1.3, 0.4 * math.sin(k * 2.1)
        c = (math.cos(a) * math.cos(e) * 0.24, math.sin(a) * math.cos(e) * 0.24, 0.78 + math.sin(e) * 0.24)
        bola(coll, f'continente {k}', c, (0.09, 0.09, 0.07), laca('tierra globo', '#8FC46A', 0.5), n=3)
    clay.sweep('meridiano', [(math.sin(a) * 0.28, 0, 0.78 + math.cos(a) * 0.28) for a in np.linspace(-2.6, 2.6, 9)], 0.012, coll=coll,
               material=metal('meridiano', '#C8A15A'), segments=6, samples=3, subsurf=0)


# ---------------------------------------------------------------- altares

def m_altar(coll):
    caja(coll, 'altar base', (0, 0, 0.3), (0.7, 0.35, 0.3), piedra('altar', '#CFC6B8'), p=6)
    caja(coll, 'altar escalón', (0, -0.1, 0.05), (0.85, 0.5, 0.05), piedra('escalón', '#B3AA9E'), p=6)
    caja(coll, 'altar losa', (0, 0, 0.63), (0.78, 0.4, 0.04), piedra('losa', '#E2DACB'), p=6)
    clay.blob('mantel altar', (0, -0.05, 0.66), (0.6, 0.36, 0.015), coll, tela('mantel altar', '#F3EAD8'), n=6, p=5)
    caja(coll, 'caída mantel', (0, -0.4, 0.5), (0.3, 0.012, 0.16), tela('caída', '#C9563F'), p=8)
    for k in range(7):
        x = -0.55 + k * 0.18
        h = 0.12 + 0.08 * ((k * 7) % 3)
        clay.lathe(f'vela altar {k}', [(0, 0), (0.03, 0), (0.03, h), (0, h)], coll, mat('cera', '#F3EAD8', 0.6), segments=10,
                   subsurf=0).location = (x, 0.15, 0.67)
        bola(coll, f'llama altar {k}', (x, 0.15, 0.67 + h + 0.03), (0.016, 0.016, 0.03), luz('llama', '#FFC86A', 5.0), n=3)
    clay.lathe('cuenco', [(0, 0), (0.08, 0), (0.14, 0.08), (0.13, 0.09)], coll, metal('cuenco', '#C8A15A'), segments=16, subsurf=0,
               cap_top=False).location = (0, -0.1, 0.67)
    for k in range(5):
        bola(coll, f'pétalo {k}', (math.cos(k * 1.3) * 0.07, -0.1 + math.sin(k * 1.3) * 0.07, 0.75), (0.04, 0.03, 0.012),
             laca('pétalo', ('#F48FB1', '#F7C948')[k % 2], 0.5), n=3)


def _cristales(coll, nombre, color, brillo):
    for k in range(7):
        a = k * 0.9
        l = 0.25 + 0.2 * ((k * 5) % 3) / 2
        inc = 0.35 if k else 0.0
        base = (math.cos(a) * 0.06 * (k > 0), math.sin(a) * 0.06 * (k > 0), 0.0)
        punta = (base[0] + math.cos(a) * math.sin(inc) * l, base[1] + math.sin(a) * math.sin(inc) * l, math.cos(inc) * l + (0.15 if not k else 0))
        clay.sweep(f'{nombre} {k}', [base, punta], [0.06 if not k else 0.04, 0.005], profile=(1.0, 1.0), coll=coll,
                   material=_mat(f'Granja | cristal {color}', color, rough=0.1, coat=0.5, emission=brillo, emission_strength=0.6),
                   segments=6, samples=2, caps=('flat', 'point'), subsurf=0)
    clay.blob(f'{nombre} roca', (0, 0, 0.02), (0.16, 0.14, 0.06), coll, piedra('base cristal', '#6E6660'), n=4)


def m_cristales_aura(coll):
    _cristales(coll, 'cristal aura', '#F2C14E', '#C08A20')


def m_cristales_lara(coll):
    _cristales(coll, 'cristal lara', '#B48CFF', '#7A5AC9')


def m_jarron_flores(coll):
    clay.lathe('jarrón', [(0, 0), (0.1, 0), (0.15, 0.15), (0.07, 0.35), (0.09, 0.42)], coll, laca('jarrón', '#F2EBDD', 0.4), segments=16,
               subsurf=1)
    for k in range(7):
        a = k * 0.9
        tip = (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.7 + (k % 3) * 0.06)
        tubo(coll, f'tallo flor {k}', [(0, 0, 0.35), tip], 0.008, mat('tallo', '#4C8B45', 0.6), seg=4)
        col = ('#F48FB1', '#F7C948', '#C9B6EA', '#FFFFFF')[k % 4]
        for p in range(5):
            b = p * 2 * math.pi / 5
            bola(coll, f'pétalo {k}{p}', (tip[0] + math.cos(b) * 0.03, tip[1] + math.sin(b) * 0.03, tip[2]), (0.03, 0.03, 0.012),
                 laca(f'flor {col}', col, 0.5), n=3, sub=0)
        bola(coll, f'centro flor {k}', (tip[0], tip[1], tip[2] + 0.01), 0.018, laca('centro', '#E8A13A', 0.5), n=3, sub=0)


# ---------------------------------------------------------------- viviendas y dormitorios

def m_cama(coll):
    caja(coll, 'cama marco', (0, 0, 0.22), (0.62, 1.0, 0.12), MAD(), p=8)
    patas(coll, 'cama', 0.62, 1.0, 0.18, 0.05, OSC(), ins=0.05)
    caja(coll, 'cabecera', (0, 1.0, 0.65), (0.66, 0.06, 0.55), OSC(), p=8)
    for k in range(4):
        caja(coll, f'barrote {k}', (-0.42 + k * 0.28, 0.95, 0.75), (0.1, 0.02, 0.32), MAD(), p=8, sub=0)
    caja(coll, 'piecera', (0, -1.0, 0.4), (0.64, 0.05, 0.3), OSC(), p=8)
    clay.blob('colchón', (0, 0.0, 0.42), (0.58, 0.96, 0.1), coll, tela('colchón', '#F6F1E6'), n=6, p=4.0)
    clay.blob('cobija', (0, -0.25, 0.5), (0.62, 0.72, 0.07), coll, tela('cobija', '#E4566B'), n=6, p=4.0)
    for i in range(3):
        for j in range(3):
            if (i + j) % 2:
                caja(coll, f'retazo {i}{j}', (-0.4 + j * 0.4, -0.7 + i * 0.4, 0.575), (0.17, 0.17, 0.008), tela('retazo', '#F7C948'), p=8, sub=0)
    clay.stitches('costura cobija', [(-0.6, 0.45, 0.56), (0.6, 0.45, 0.56)], coll=coll, material=tela('costura', '#FFFFFF'))
    clay.blob('doblez', (0, 0.42, 0.54), (0.62, 0.08, 0.05), coll, tela('sábana', '#FFFFFF'), n=5, p=3.0)
    for sx in (-1, 1):
        clay.blob(f'almohada {sx}', (sx * 0.27, 0.72, 0.56), (0.24, 0.15, 0.07), coll, tela('almohada', '#FFFFFF'), n=5, p=3.0)
    clay.blob('peluche cama', (0.3, 0.5, 0.6), (0.08, 0.07, 0.09), coll, tela('osito', '#C98A45'), n=4)


def m_mesa_noche(coll):
    caja(coll, 'mesa noche', (0, 0, 0.3), (0.22, 0.2, 0.3), MAD(), p=8)
    caja(coll, 'cajón noche', (0, -0.205, 0.42), (0.18, 0.01, 0.08), OSC(), p=8, sub=0)
    bola(coll, 'tirador noche', (0, -0.22, 0.42), 0.018, metal('tirador', '#C8A15A'), n=3, sub=0)
    clay.lathe('pie lámpara', [(0.0, 0.6), (0.08, 0.6), (0.05, 0.68), (0.025, 0.8), (0.0, 0.8)], coll, laca('pie lámpara', '#86CDBA', 0.3),
               segments=16, subsurf=0)
    clay.lathe('pantalla noche', [(0.07, 0.8), (0.13, 0.8), (0.09, 0.96), (0.06, 0.96)], coll, tela('pantalla', '#FFF1E4'), segments=16,
               subsurf=0, cap_bottom=False, cap_top=False)
    bola(coll, 'bombillo noche', (0, 0, 0.86), 0.04, luz('bombillo', '#FFE7A8', 3.0), n=3)
    libro(coll, 'libro noche', 0.08, 0.05, 0.6, 0.15, 0.03, 0.11, '#3B6FB6')


def m_armario(coll):
    caja(coll, 'armario', (0, 0, 1.0), (0.6, 0.3, 1.0), MAD(), p=10)
    caja(coll, 'corona armario', (0, -0.02, 2.04), (0.66, 0.34, 0.06), OSC(), p=6)
    caja(coll, 'zócalo armario', (0, -0.01, 0.06), (0.62, 0.31, 0.06), OSC(), p=10, sub=0)
    for sx in (-1, 1):
        caja(coll, f'puerta {sx}', (sx * 0.29, -0.31, 1.1), (0.27, 0.015, 0.82), madera('puerta armario', '#B88C5E'), p=8)
        caja(coll, f'panel {sx}', (sx * 0.29, -0.33, 1.35), (0.19, 0.01, 0.4), MAD(), p=6, sub=0)
        caja(coll, f'panel bajo {sx}', (sx * 0.29, -0.33, 0.55), (0.19, 0.01, 0.2), MAD(), p=6, sub=0)
        bola(coll, f'perilla armario {sx}', (sx * 0.06, -0.35, 1.05), 0.025, metal('tirador', '#C8A15A'), n=3, sub=0)
    caja(coll, 'cajón armario', (0, -0.31, 0.2), (0.56, 0.015, 0.08), madera('puerta armario', '#B88C5E'), p=8, sub=0)
    caja(coll, 'caja sombrero', (-0.2, 0, 2.2), (0.18, 0.18, 0.1), laca('sombrerera', '#C9B6EA', 0.5), p=6)


def m_sillon(coll):
    tapiz = tela('sillón', '#6FA3C7')
    clay.blob('sillón base', (0, 0, 0.28), (0.45, 0.4, 0.2), coll, tapiz, n=6, p=4.0)
    clay.blob('sillón cojín', (0, -0.05, 0.5), (0.36, 0.33, 0.08), coll, tela('cojín sillón', '#8EC5F0'), n=6, p=4.0)
    clay.blob('sillón respaldo', (0, 0.32, 0.72), (0.42, 0.1, 0.35), coll, tapiz, n=6, p=3.0)
    for sx in (-1, 1):
        clay.blob(f'brazo {sx}', (sx * 0.42, 0, 0.55), (0.09, 0.38, 0.13), coll, tapiz, n=5, p=3.0)
        clay.stitches(f'costura brazo {sx}', [(sx * 0.42, -0.36, 0.68), (sx * 0.42, 0.36, 0.68)], coll=coll, material=tela('costura', '#FFFFFF'))
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.lathe(f'pata sillón {sx}{sy}', [(0.03, 0.0), (0.04, 0.1)], coll, OSC(), segments=8, subsurf=0).location = (sx * 0.38, sy * 0.33, 0)
    clay.blob('cojín decorativo', (0.22, 0.18, 0.66), (0.14, 0.06, 0.13), coll, tela('cojín deco', '#F7C948'), n=5, p=3.0)
    clay.blob('manta sillón', (-0.42, -0.05, 0.62), (0.1, 0.3, 0.06), coll, tela('manta', '#E4566B'), n=5, p=3.0)


def m_mesa_comedor(coll):
    caja(coll, 'mesa comedor', (0, 0, 0.78), (0.8, 0.5, 0.04), MAD(), p=8)
    patas(coll, 'mesa comedor', 0.8, 0.5, 0.76, 0.04, OSC(), ins=0.08)
    clay.blob('mantel', (0, 0, 0.83), (0.82, 0.3, 0.008), coll, tela('mantel', '#F3EAD8'), n=6, p=6)
    for k in range(3):
        x = -0.5 + k * 0.5
        clay.lathe(f'plato comedor {k}', [(0, 0), (0.12, 0), (0.15, 0.02)], coll, laca('plato', '#F2EBDD', 0.4), segments=14, subsurf=0,
                   cap_top=False).location = (x, -0.25 if k % 2 else 0.25, 0.835)
    clay.lathe('olla mesa', [(0, 0), (0.15, 0), (0.17, 0.14), (0.15, 0.16)], coll, laca('olla', '#C9563F', 0.4), segments=16, subsurf=0,
               cap_top=False).location = (0, 0, 0.84)
    bola(coll, 'sopa', (0, 0, 0.96), (0.14, 0.14, 0.02), mat('sopa', '#E8B45A', 0.4), n=4)
    clay.lathe('jarra agua', [(0, 0), (0.06, 0), (0.07, 0.12), (0.05, 0.2), (0.06, 0.22)], coll, vidrio('jarra', '#CDE8F2'), segments=12,
               subsurf=0).location = (0.55, 0.0, 0.84)


def m_cocina(coll):
    caja(coll, 'mesón', (0, 0, 0.45), (0.9, 0.32, 0.45), laca('mesón', '#E9DFC9', 0.5), p=10)
    caja(coll, 'mesón cubierta', (0, -0.02, 0.92), (0.95, 0.36, 0.04), MAD(), p=8)
    for k in range(3):
        caja(coll, f'puerta mesón {k}', (-0.6 + k * 0.6, -0.33, 0.45), (0.26, 0.01, 0.34), laca('puerta mesón', '#86CDBA', 0.5), p=8)
        bola(coll, f'tirador mesón {k}', (-0.6 + k * 0.6 + 0.18, -0.35, 0.55), 0.02, metal('tirador', '#C8A15A'), n=3, sub=0)
    # Estufa de leña a un lado
    caja(coll, 'estufa', (1.35, 0, 0.42), (0.38, 0.32, 0.42), metal('estufa', '#3A3A3E'), p=8)
    caja(coll, 'puerta estufa', (1.35, -0.33, 0.35), (0.2, 0.01, 0.15), metal('puerta estufa', '#2B2422'), p=8, sub=0)
    caja(coll, 'brillo estufa', (1.35, -0.34, 0.35), (0.12, 0.008, 0.06), luz('brasas', '#FF6A1A', 2.0), p=8, sub=0)
    tubo(coll, 'tubo estufa', [(1.45, 0.15, 0.84), (1.45, 0.15, 2.4)], 0.07, metal('estufa', '#3A3A3E'))
    clay.lathe('olla estufa', [(0, 0), (0.14, 0), (0.15, 0.18), (0.14, 0.19)], coll, metal('olla', '#B8BCC2'), segments=16, subsurf=0,
               cap_top=False).location = (1.25, 0, 0.84)
    clay.lathe('tapa olla', [(0, 0.19), (0.15, 0.19), (0.03, 0.24), (0.0, 0.25)], coll, metal('olla', '#B8BCC2'), segments=16,
               subsurf=0).location = (1.25, 0, 0.84)
    # Tabla, cuchillo, verduras y frascos
    caja(coll, 'tabla picar', (-0.4, -0.05, 0.965), (0.22, 0.14, 0.012), madera('tabla', '#DDB487'), p=8, sub=0)
    bola(coll, 'tomate', (-0.45, -0.05, 1.01), 0.04, laca('tomate', '#D9453D', 0.35), n=3)
    bola(coll, 'cebolla', (-0.33, 0.0, 1.01), 0.04, laca('cebolla', '#C9B6EA', 0.4), n=3)
    for k in range(3):
        frasco(coll, f'especia {k}', 0.2 + k * 0.15, 0.2, 0.96, 0.05, 0.15, ('#C9563F', '#E8C35A', '#5FA85A')[k])
    for k in range(3):
        bola(coll, f'gancho {k}', (-0.6 + k * 0.3, 0.3, 1.5), 0.015, metal('gancho', '#B08D57'), n=3, sub=0)
        tubo(coll, f'cucharón {k}', [(-0.6 + k * 0.3, 0.28, 1.5), (-0.6 + k * 0.3, 0.27, 1.15)], 0.012, MAD())
        bola(coll, f'cuchara {k}', (-0.6 + k * 0.3, 0.27, 1.12), (0.04, 0.02, 0.05), MAD(), n=3)


def m_baul(coll):
    caja(coll, 'baúl', (0, 0, 0.22), (0.45, 0.28, 0.22), madera('baúl', '#A97445'), p=8)
    clay.blob('tapa baúl', (0, 0, 0.44), (0.46, 0.29, 0.1), coll, madera('baúl', '#A97445'), n=5, p=3.0)
    for x in (-0.3, 0.3):
        caja(coll, f'fleje {x}', (x, 0, 0.3), (0.03, 0.3, 0.26), metal('fleje', '#5D5A58'), p=8, sub=0)
    caja(coll, 'cerradura', (0, -0.29, 0.38), (0.05, 0.015, 0.06), metal('cerradura', '#C8A15A'), p=6, sub=0)


# ---------------------------------------------------------------- cascarón de los cuartos (módulos de 1 m)

def m_piso_modulo(coll):
    """Un metro cuadrado de piso de tablas (centrado en el origen, la cara de arriba en z=0)."""
    tonos = ('#C99A6A', '#BE8E5F', '#D2A574', '#C49463', '#CCA06E')
    for k in range(5):
        y = -0.4 + k * 0.2
        dz = 0.004 * ((k * 3) % 2)
        caja(coll, f'tabla piso {k}', (0, y, -0.03 + dz), (0.498, 0.097, 0.03), madera(f'piso {k}', tonos[k]), p=14, sub=1, n=3)
        for sx in (-1, 1):
            bola(coll, f'clavo {k}{sx}', (sx * 0.44, y, dz + 0.001), (0.012, 0.012, 0.004), mat('clavo', '#6B5A4A', 0.5), n=2, sub=0)
        if k % 2:
            caja(coll, f'junta {k}', (0.1 if k == 1 else -0.25, y, dz + 0.0005), (0.004, 0.096, 0.002), mat('junta', '#8A6242', 0.8), p=12, sub=0)


def m_pared_modulo(coll):
    """Un metro de pared (x de -0.5 a 0.5) con la cara hacia -y en y=0: zócalo de tablas, moldura, colgadura de rayas
    y cornisa. El papel lleva el material «papel pared» para teñirlo por local."""
    caja(coll, 'muro', (0, 0.1, 1.45), (0.5, 0.1, 1.45), mat('muro', '#CDB894', 0.9), p=14, sub=0)
    caja(coll, 'papel pared', (0, -0.005, 1.92), (0.5, 0.01, 0.98), _mat('Granja | papel pared', '#E8D5B0', rough=0.9), p=14, sub=0)
    for k in range(4):
        caja(coll, f'raya papel {k}', (-0.375 + k * 0.25, -0.017, 1.92), (0.035, 0.004, 0.98), _mat('Granja | raya papel', '#F3E6CA', rough=0.9),
             p=14, sub=0)
        for j in range(4):
            bola(coll, f'florcita {k}{j}', (-0.25 + k * 0.25, -0.02, 1.2 + j * 0.45 + (k % 2) * 0.2), (0.025, 0.004, 0.025),
                 _mat('Granja | flor papel', '#D9A88A', rough=0.9), n=2, sub=0)
    for k in range(5):
        caja(coll, f'tabla zócalo {k}', (-0.4 + k * 0.2, -0.02, 0.48), (0.097, 0.02, 0.46), madera(f'zócalo {k % 2}', ('#A9784C', '#9E6F45')[k % 2]),
             p=14, sub=1)
    caja(coll, 'moldura', (0, -0.05, 0.95), (0.5, 0.04, 0.035), CHOCO(), p=8, sub=1)
    caja(coll, 'rodapié', (0, -0.045, 0.05), (0.5, 0.035, 0.05), CHOCO(), p=10, sub=0)
    caja(coll, 'cornisa', (0, -0.05, 2.86), (0.5, 0.06, 0.05), CHOCO(), p=8, sub=1)


def m_poste(coll):
    caja(coll, 'poste', (0, 0, 1.45), (0.1, 0.1, 1.45), CHOCO(), p=10, sub=1)
    for z in (0.15, 2.75):
        caja(coll, f'collar poste {z}', (0, 0, z), (0.12, 0.12, 0.05), OSC(), p=8, sub=0)


def m_viga(coll):
    """Viga del techo de 1 m (a lo largo de x), con la cara de abajo en z=0."""
    caja(coll, 'viga', (0, 0, 0.1), (0.5, 0.09, 0.1), CHOCO(), p=10, sub=1)


def m_marco_puerta(coll):
    """Marco de la puerta de salida (hueco de 1.8 m), visto desde dentro."""
    for sx in (-1, 1):
        caja(coll, f'jamba {sx}', (sx * 1.0, 0, 1.3), (0.1, 0.12, 1.3), CHOCO(), p=10, sub=1)
    caja(coll, 'dintel', (0, 0, 2.62), (1.12, 0.14, 0.1), CHOCO(), p=8, sub=1)
    caja(coll, 'tapete puerta', (0, -0.6, 0.012), (0.7, 0.4, 0.012), tela('tapete puerta', '#8A6A44'), p=8, sub=1)
    for k in range(4):
        caja(coll, f'raya tapete {k}', (0, -0.9 + k * 0.2, 0.026), (0.62, 0.025, 0.004), tela('raya tapete', '#C9A46A'), p=10, sub=0)


def m_puerta(coll):
    """Puerta de un cuarto (respaldo en y=0, base en z=0). La hoja lleva el material «puerta» para teñirla."""
    for sx in (-1, 1):
        caja(coll, f'jamba puerta {sx}', (sx * 0.78, 0, 1.2), (0.07, 0.08, 1.2), CHOCO(), p=10, sub=1)
    caja(coll, 'dintel puerta', (0, 0, 2.42), (0.86, 0.09, 0.08), CHOCO(), p=8, sub=1)
    hoja = _mat('Granja | puerta', '#C9A87A', rough=0.6, coat=0.2)
    caja(coll, 'hoja puerta', (0, -0.02, 1.15), (0.7, 0.04, 1.15), hoja, p=12, sub=1)
    for k in range(2):
        for j in range(2):
            caja(coll, f'tablero puerta {k}{j}', (-0.33 + j * 0.66, -0.065, 0.55 + k * 1.05), (0.24, 0.012, 0.38), hoja, p=6, sub=1)
            caja(coll, f'filo tablero {k}{j}', (-0.33 + j * 0.66, -0.06, 0.55 + k * 1.05), (0.27, 0.008, 0.41), OSC(), p=8, sub=0)
    bola(coll, 'pomo puerta', (0.55, -0.1, 1.1), 0.045, metal('pomo', '#E8C66A'), n=3)
    caja(coll, 'placa pomo', (0.55, -0.065, 1.1), (0.03, 0.006, 0.08), metal('pomo', '#E8C66A'), p=8, sub=0)
    caja(coll, 'letrerito', (0, -0.075, 1.85), (0.18, 0.01, 0.07), madera('letrerito', '#F2E3C4'), p=6, sub=1)
    for k in range(5):
        bola(coll, f'corona hoja {k}', (-0.2 + k * 0.1, -0.09, 2.05 + 0.04 * math.sin(k)), (0.04, 0.02, 0.03), mat('hoja', '#5FA85A', 0.55), n=2)


# ---------------------------------------------------------------- gremio de aventureros

PAPELES = ('#F6EEDC', '#F2E3C4', '#EDE0F0', '#E6F0E4', '#F7E6D6')


def _papel(coll, nombre, x, y, z, w, h, rot, k, renglones=3):
    o = caja(coll, nombre, (0, 0, 0), (w, 0.008, h), mat(f'papel {k % 5}', PAPELES[k % 5], 0.9), p=10, sub=0)
    o.location = (x, y, z)
    o.rotation_euler = (0, rot, 0)
    bola(coll, f'{nombre} chinche', (x, y - 0.02, z + h * 0.8), 0.022, laca('chinche', ('#E4566B', '#F2C94C', '#3B6FB6')[k % 3], 0.4), n=2, sub=0)
    for j in range(renglones):
        caja(coll, f'{nombre} renglón {j}', (x, y - 0.012, z + h * 0.35 - j * h * 0.3), (w * 0.7, 0.002, 0.008), mat('tinta', '#6E5A48', 0.9), p=12,
             sub=0)


def m_tablon_misiones(coll):
    """Tablón grande de expediciones (de pared): marco con techito, avisos clavados, un «se busca» y un mapa."""
    w, h = 1.25, 0.8
    for sx in (-1, 1):
        caja(coll, f'poste tablón {sx}', (sx * (w + 0.06), 0, 1.05), (0.07, 0.06, 1.05), CHOCO(), p=8)
    caja(coll, 'tablero', (0, 0, 1.45), (w, 0.04, h), madera('corcho', '#B98A5E'), p=10)
    caja(coll, 'marco alto', (0, -0.03, 1.45 + h + 0.04), (w + 0.12, 0.06, 0.05), OSC(), p=8)
    caja(coll, 'marco bajo', (0, -0.03, 1.45 - h - 0.04), (w + 0.12, 0.06, 0.05), OSC(), p=8)
    caja(coll, 'techito', (0, -0.12, 2.42), (w + 0.25, 0.22, 0.05), laca('techito', '#8E3B3B', 0.5), p=6)
    caja(coll, 'letrero tablón', (0, -0.08, 2.18), (0.5, 0.025, 0.1), madera('letrero', '#F2E3C4'), p=6)
    for k in range(5):
        caja(coll, f'letra {k}', (-0.32 + k * 0.16, -0.11, 2.18), (0.045, 0.004, 0.05), mat('tinta', '#6E5A48', 0.9), p=12, sub=0)
    sitios = ((-0.95, 1.85, 0.06), (-0.55, 1.95, -0.05), (-0.95, 1.2, -0.08), (-0.5, 1.15, 0.05), (0.15, 0.95, -0.04), (0.6, 0.95, 0.07),
              (1.0, 1.15, -0.06), (1.0, 1.85, 0.04))
    for k, (x, z, r) in enumerate(sitios):
        _papel(coll, f'aviso {k}', x, -0.06, z, 0.17, 0.21, r, k)
    # Se busca: con una carita de monstruo
    _papel(coll, 'se busca', -0.05, -0.06, 1.75, 0.22, 0.3, 0.03, 1, renglones=1)
    bola(coll, 'monstruo', (-0.05, -0.08, 1.8), (0.11, 0.01, 0.09), tela('monstruo', '#7FB069'), n=3, sub=0)
    for sx in (-1, 1):
        bola(coll, f'ojo monstruo {sx}', (-0.05 + sx * 0.04, -0.092, 1.82), 0.018, mat('ojo', '#2B2422', 0.5), n=2, sub=0)
    # Mapa del valle con su ruta punteada
    o = caja(coll, 'mapa', (0, 0, 0), (0.32, 0.008, 0.22), mat('mapa', '#E9D9AE', 0.9), p=10, sub=0)
    o.location = (0.55, -0.06, 1.7)
    for k, (x, z, c) in enumerate(((0.38, 1.78, '#7FB069'), (0.6, 1.62, '#7FB069'), (0.72, 1.8, '#8EC5F0'))):
        bola(coll, f'mancha mapa {k}', (x, -0.07, z), (0.07, 0.004, 0.045), mat(f'mapa {c}', c, 0.9), n=2, sub=0)
    for k in range(6):
        bola(coll, f'ruta {k}', (0.36 + k * 0.07, -0.072, 1.62 + 0.05 * math.sin(k)), 0.011, laca('ruta', '#C0392B', 0.5), n=2, sub=0)
    caja(coll, 'equis', (0.75, -0.074, 1.63), (0.035, 0.003, 0.008), laca('ruta', '#C0392B', 0.5), p=12, sub=0)
    # Daga clavando un aviso y farolito colgado al lado
    tubo(coll, 'daga', [(0.95, -0.08, 1.95), (0.95, -0.2, 2.0)], 0.012, metal('acero', '#C7CED6'), seg=5)
    caja(coll, 'mango daga', (0.95, -0.24, 2.01), (0.02, 0.05, 0.02), madera('mango', '#5A3A28'), p=8, sub=0)


def m_mesa_mapas(coll):
    """Mesa de planear expediciones: mapa grande extendido, brújula, velas, catalejo y libreta."""
    caja(coll, 'tablero mesa', (0, 0, 0.78), (0.95, 0.6, 0.05), OSC(), p=6)
    patas(coll, 'mesa mapas', 0.85, 0.5, 0.76, 0.06, CHOCO())
    caja(coll, 'travesaño', (0, 0, 0.22), (0.8, 0.04, 0.03), CHOCO(), p=10, sub=0)
    caja(coll, 'mapa grande', (0, 0, 0.835), (0.72, 0.46, 0.006), mat('mapa', '#E9D9AE', 0.9), p=12, sub=0)
    for k, (x, y, r, c) in enumerate(((-0.35, 0.1, 0.18, '#7FB069'), (0.2, -0.15, 0.22, '#7FB069'), (0.35, 0.2, 0.14, '#8EC5F0'),
                                      (-0.2, -0.25, 0.1, '#C9B6EA'))):
        bola(coll, f'mancha {k}', (x, y, 0.842), (r, r * 0.7, 0.004), mat(f'mapa {c}', c, 0.9), n=2, sub=0)
    for k in range(9):
        bola(coll, f'ruta {k}', (-0.5 + k * 0.11, -0.05 + 0.12 * math.sin(k * 0.9), 0.845), 0.012, laca('ruta', '#C0392B', 0.5), n=2, sub=0)
    for sx in (-1, 1):  # pisapapeles en las esquinas
        bola(coll, f'piedra {sx}', (sx * 0.66, 0.4, 0.86), (0.06, 0.05, 0.035), piedra('pisapapeles'), n=3)
    clay.lathe('brújula', [(0.0, 0.0), (0.1, 0.0), (0.1, 0.03), (0.0, 0.035)], coll, metal('oro', '#E8C66A'), segments=20,
               subsurf=0).location = (0.5, -0.3, 0.84)
    caja(coll, 'aguja brújula', (0.5, -0.3, 0.878), (0.008, 0.07, 0.004), laca('aguja', '#C0392B', 0.4), p=12, sub=0)
    for k, (x, y) in enumerate(((-0.75, -0.42), (0.78, 0.45))):
        cilindro(coll, f'vela {k}', (x, y, 0.83), 0.035, 0.16 - k * 0.04, mat('cera', '#F6F1E6', 0.6), seg=10)
        clay.blob(f'llama vela {k}', (x, y, 0.83 + 0.16 - k * 0.04 + 0.04), (0.02, 0.02, 0.04), coll, luz('llama', '#FFB347', 4.0), n=3, p=1.6)
    tubo(coll, 'catalejo', [(-0.45, 0.42, 0.87), (0.05, 0.5, 0.9)], 0.04, metal('oro', '#E8C66A'), seg=10)
    tubo(coll, 'catalejo fino', [(0.05, 0.5, 0.9), (0.2, 0.53, 0.91)], 0.028, metal('oro', '#E8C66A'), seg=10)
    caja(coll, 'libreta', (-0.55, -0.3, 0.85), (0.12, 0.16, 0.02), laca('libreta', '#3E5C76', 0.6), p=8, sub=0)
    tubo(coll, 'pluma', [(-0.48, -0.25, 0.87), (-0.3, -0.1, 0.95)], 0.012, mat('pluma', '#F6F1E6', 0.6), seg=5)


def m_armadura(coll):
    """Armadura de peluche en su soporte: yelmo con penacho, peto, hombreras, faldón y escudo apoyado."""
    acero = metal('acero', '#B9C2CC')
    oro = metal('oro', '#E8C66A')
    caja(coll, 'base soporte', (0, 0, 0.05), (0.35, 0.3, 0.05), CHOCO(), p=8)
    tubo(coll, 'palo soporte', [(0, 0, 0.1), (0, 0, 1.4)], 0.035, CHOCO(), seg=6)
    bola(coll, 'peto', (0, 0, 1.05), (0.3, 0.22, 0.34), acero, n=4)
    caja(coll, 'cinturón', (0, -0.01, 0.74), (0.3, 0.22, 0.05), madera('cuero', '#6B4430'), p=6)
    bola(coll, 'hebilla', (0, -0.23, 0.74), (0.05, 0.02, 0.04), oro, n=2, sub=0)
    for k in range(4):
        a = (k - 1.5) * 0.45
        caja(coll, f'faldón {k}', (math.sin(a) * 0.22, -math.cos(a) * 0.17, 0.57), (0.09, 0.03, 0.14), acero, p=6).rotation_euler = (0, 0, a)
    for sx in (-1, 1):
        bola(coll, f'hombrera {sx}', (sx * 0.33, 0, 1.3), (0.15, 0.16, 0.1), acero, n=3)
        bola(coll, f'remache hombrera {sx}', (sx * 0.36, -0.12, 1.33), 0.025, oro, n=2, sub=0)
    caja(coll, 'cruz peto', (0, -0.21, 1.08), (0.03, 0.02, 0.18), oro, p=8, sub=0)
    caja(coll, 'cruz peto h', (0, -0.21, 1.14), (0.12, 0.02, 0.03), oro, p=8, sub=0)
    bola(coll, 'yelmo', (0, 0, 1.6), (0.2, 0.2, 0.22), acero, n=4)
    caja(coll, 'visera', (0, -0.18, 1.6), (0.14, 0.04, 0.03), mat('rendija', '#2B2422', 0.8), p=8, sub=0)
    for k in range(5):
        bola(coll, f'penacho {k}', (0, 0.02 - k * 0.0, 1.83 + 0.02 * math.sin(k)), (0.05, 0.08 + k * 0.01, 0.06), tela('penacho', '#C0392B'), n=2)
    o = clay.lathe('escudo', [(0.0, 0.0), (0.26, 0.0), (0.26, 0.04), (0.2, 0.07), (0.0, 0.08)], coll, laca('escudo', '#3E5C76', 0.45), segments=24,
                   subsurf=1)
    o.location = (0.42, -0.2, 0.32)
    o.rotation_euler = (math.pi / 2 - 0.2, 0, -0.3)
    bola(coll, 'umbo escudo', (0.4, -0.29, 0.34), (0.06, 0.04, 0.06), oro, n=2)


def m_cofre_tesoro(coll):
    """Cofre abierto con monedas, gemas y un collar asomando."""
    oro = metal('oro', '#E8C66A')
    caja(coll, 'cofre', (0, 0, 0.24), (0.42, 0.28, 0.22), madera('cofre', '#9A6A44'), p=6)
    for x in (-0.3, 0.3):
        caja(coll, f'fleje {x}', (x, 0, 0.24), (0.04, 0.29, 0.23), metal('hierro', '#3E3A38'), p=8, sub=0)
    o = caja(coll, 'tapa', (0, 0, 0), (0.42, 0.06, 0.2), madera('cofre', '#9A6A44'), p=6)
    o.location = (0, 0.32, 0.62)
    o.rotation_euler = (0.25, 0, 0)
    bola(coll, 'cerradura', (0, -0.29, 0.38), (0.05, 0.02, 0.06), oro, n=2, sub=0)
    for k in range(26):
        x, y = float(RNG.uniform(-0.34, 0.34)), float(RNG.uniform(-0.2, 0.2))
        cilindro(coll, f'moneda {k}', (x, y, 0.44 + float(RNG.uniform(0, 0.08)) - (abs(x) + abs(y)) * 0.1), 0.045, 0.012, oro, seg=12)
    for k, c in enumerate(('#E4566B', '#8EC5F0', '#7FB069', '#C9B6EA')):
        bola(coll, f'gema {k}', (-0.25 + k * 0.17, 0.05 - (k % 2) * 0.1, 0.52), 0.04, vidrio(f'gema {c}', c), n=3)
    for k in range(7):
        bola(coll, f'collar {k}', (0.3 + k * 0.03, -0.27 - k * 0.012, 0.44 - k * 0.05), 0.018, mat('perla', '#F6F1E6', 0.3), n=2, sub=0)
    for k in range(5):  # monedas regadas
        cilindro(coll, f'moneda suelo {k}', (float(RNG.uniform(-0.6, 0.6)), float(RNG.uniform(-0.55, -0.35)), 0.0), 0.045, 0.012, oro, seg=12)


def m_escudos_pared(coll):
    """Dos escudos de pared con hachas cruzadas (respaldo en y=0, centro a 1.9 m)."""
    for k, (x, c) in enumerate(((-0.45, '#3E5C76'), (0.45, '#8E3B3B'))):
        o = clay.lathe(f'escudo {k}', [(0.0, 0.0), (0.3, 0.0), (0.3, 0.04), (0.24, 0.08), (0.0, 0.09)], coll, laca(f'escudo {c}', c, 0.45),
                       segments=24, subsurf=1)
        o.location = (x, -0.02, 1.9)
        o.rotation_euler = (math.pi / 2, 0, 0)
        bola(coll, f'umbo {k}', (x, -0.12, 1.9), (0.07, 0.04, 0.07), metal('oro', '#E8C66A'), n=2)
        for j in range(6):
            t = j * math.pi / 3
            bola(coll, f'remache {k}{j}', (x + math.cos(t) * 0.22, -0.1, 1.9 + math.sin(t) * 0.22), 0.02, metal('oro', '#E8C66A'), n=2, sub=0)
    for s in (-1, 1):
        o = caja(coll, f'asta hacha {s}', (0, 0, 0), (0.025, 0.025, 0.55), madera('asta', '#8A5A3B'), p=8, sub=0)
        o.location = (0, -0.04, 1.75)
        o.rotation_euler = (0, s * 0.6, 0)
        bola(coll, f'hoja hacha {s}', (s * 0.3, -0.04, 2.18), (0.13, 0.025, 0.1), metal('acero', '#C7CED6'), n=3)


def m_estandarte_pared(coll):
    """Estandarte largo de tela azul con la estrella del gremio (respaldo en y=0)."""
    oro = metal('oro', '#E8C66A')
    tubo(coll, 'barra', [(-0.45, -0.06, 2.6), (0.45, -0.06, 2.6)], 0.025, oro, seg=6)
    caja(coll, 'paño', (0, -0.06, 1.85), (0.36, 0.02, 0.72), tela('estandarte', '#3E5C76'), p=8)
    for s in (-1, 1):
        o = caja(coll, f'punta {s}', (0, 0, 0), (0.26, 0.019, 0.09), tela('estandarte', '#3E5C76'), p=8)
        o.location = (s * 0.18, -0.06, 1.1)
        o.rotation_euler = (0, s * 0.45, 0)
        caja(coll, f'ribete {s}', (s * 0.34, -0.085, 1.85), (0.02, 0.01, 0.72), oro, p=10, sub=0)
    bola(coll, 'estrella', (0, -0.09, 1.95), (0.1, 0.015, 0.1), oro, n=3, sub=0)
    for k in range(5):
        a = math.pi / 2 + k * 2 * math.pi / 5
        o = bola(coll, f'rayo {k}', (0, 0, 0), (0.045, 0.012, 0.15), oro, n=2, sub=0)
        o.location = (math.cos(a) * 0.12, -0.09, 1.95 + math.sin(a) * 0.12)
        o.rotation_euler = (0, math.pi / 2 - a, 0)


# ---------------------------------------------------------------- museo

def m_vitrina_museo(coll):
    """Vitrina de exposición: pedestal de madera con molduras, campana de vidrio y placa dorada al frente. El objeto
    lo pone el juego encima (a 1.02 m)."""
    caja(coll, 'pedestal', (0, 0, 0.48), (0.36, 0.36, 0.44), OSC(), p=8)
    caja(coll, 'zócalo pedestal', (0, 0, 0.06), (0.42, 0.42, 0.06), CHOCO(), p=8)
    caja(coll, 'tapa pedestal', (0, 0, 0.96), (0.42, 0.42, 0.04), CHOCO(), p=8)
    for k in range(4):
        a = k * math.pi / 2
        caja(coll, f'panel pedestal {k}', (math.sin(a) * 0.365, -math.cos(a) * 0.365, 0.5), (0.24, 0.012, 0.3), MAD(), p=8).rotation_euler = (0, 0, a)
    caja(coll, 'cojín', (0, 0, 1.02), (0.28, 0.28, 0.03), tela('terciopelo', '#8E3B5E'), p=6)
    v = _mat('Granja | vidrio vitrina', '#E6F3F5', rough=0.05, alpha=0.22)
    v.blend_method = 'BLEND'  # glTF lo exporta transparente solo si no es opaco
    for sx in (-1, 1):
        caja(coll, f'vidrio x {sx}', (sx * 0.38, 0, 1.38), (0.008, 0.38, 0.38), v, p=12, sub=0)
        caja(coll, f'vidrio y {sx}', (0, sx * 0.38, 1.38), (0.38, 0.008, 0.38), v, p=12, sub=0)
    caja(coll, 'vidrio tapa', (0, 0, 1.765), (0.38, 0.38, 0.008), v, p=12, sub=0)
    oro = metal('oro', '#E8C66A')
    for sx in (-1, 1):
        for sy in (-1, 1):
            caja(coll, f'canto {sx}{sy}', (sx * 0.38, sy * 0.38, 1.38), (0.014, 0.014, 0.39), oro, p=10, sub=0)
    for z in (1.0, 1.77):
        for sx in (-1, 1):
            caja(coll, f'filo x {z}{sx}', (sx * 0.38, 0, z), (0.014, 0.39, 0.014), oro, p=10, sub=0)
            caja(coll, f'filo y {z}{sx}', (0, sx * 0.38, z), (0.39, 0.014, 0.014), oro, p=10, sub=0)
    caja(coll, 'placa', (0, -0.38, 0.75), (0.17, 0.012, 0.07), oro, p=8, sub=0)
    caja(coll, 'placa letras', (0, -0.395, 0.75), (0.12, 0.003, 0.012), mat('tinta', '#6E5A48', 0.9), p=12, sub=0)


def m_pedestal_museo(coll):
    """Columna corta de mármol con capitel, para estatuas o piezas grandes (el juego pone la pieza a 1.1 m)."""
    marmol = mat('mármol', '#F2ECDF', 0.35, coat=0.3)
    clay.lathe('pedestal', [(0.0, 0.0), (0.34, 0.0), (0.34, 0.1), (0.26, 0.16), (0.22, 0.24), (0.2, 0.92), (0.26, 0.98), (0.32, 1.04),
                            (0.32, 1.1), (0.0, 1.1)], coll, marmol, segments=24, subsurf=1)
    for k in range(8):
        a = k * math.pi / 4
        tubo(coll, f'estría {k}', [(math.cos(a) * 0.215, math.sin(a) * 0.215, 0.28), (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.9)], 0.014,
             mat('estría mármol', '#E2DACB', 0.4), seg=4)
    caja(coll, 'placa', (0, -0.22, 0.6), (0.12, 0.008, 0.05), metal('oro', '#E8C66A'), p=8, sub=0)


def m_cordon_museo(coll):
    """Dos postes dorados con un cordón de terciopelo colgando entre ellos (1.6 m de ancho)."""
    oro = metal('oro', '#E8C66A')
    for sx in (-1, 1):
        clay.lathe(f'poste {sx}', [(0.0, 0.0), (0.16, 0.0), (0.15, 0.04), (0.04, 0.08), (0.03, 0.85), (0.06, 0.9), (0.0, 0.98)], coll, oro,
                   segments=16, subsurf=1).location = (sx * 0.8, 0, 0)
    pts = [(-0.78 + k * 1.56 / 8, 0, 0.88 - 0.22 * math.sin(math.pi * k / 8)) for k in range(9)]
    tubo(coll, 'cordón', pts, 0.03, tela('terciopelo', '#8E3B5E'), seg=8)


def m_fosil(coll):
    """Fósil del valle: un dragoncito de huesos sobre su base, con placa (pieza de exposición grande)."""
    hueso = mat('hueso', '#EFE3C8', 0.75)
    caja(coll, 'base fósil', (0, 0, 0.12), (0.7, 0.32, 0.12), piedra('base fósil', '#B7AE98'), p=6)
    caja(coll, 'placa', (0, -0.33, 0.12), (0.18, 0.01, 0.06), metal('oro', '#E8C66A'), p=8, sub=0)
    for sx in (-0.3, 0.25):
        tubo(coll, f'varilla {sx}', [(sx, 0, 0.24), (sx, 0, 0.62)], 0.015, metal('hierro', '#3E3A38'), seg=5)
    columna = [(-0.6 + k * 0.1, 0, 0.66 + 0.12 * math.sin(k * 0.45)) for k in range(12)]
    for k, (x, y, z) in enumerate(columna):
        bola(coll, f'vértebra {k}', (x, y, z), (0.045, 0.045 - k * 0.002, 0.05), hueso, n=2)
        if 2 <= k <= 7:
            for sy in (-1, 1):
                tubo(coll, f'costilla {k}{sy}', [(x, 0, z), (x + 0.02, sy * 0.1, z - 0.08), (x + 0.04, sy * 0.08, z - 0.2)], 0.012, hueso, seg=4)
    cx, cy, cz = columna[-1]
    bola(coll, 'cráneo', (cx + 0.12, 0, cz + 0.08), (0.13, 0.09, 0.09), hueso, n=3)
    bola(coll, 'hocico', (cx + 0.24, 0, cz + 0.05), (0.08, 0.06, 0.05), hueso, n=3)
    for sy in (-1, 1):
        bola(coll, f'cuenca {sy}', (cx + 0.15, sy * 0.07, cz + 0.11), 0.03, mat('cuenca', '#5A4A3A', 0.9), n=2, sub=0)
        tubo(coll, f'cuerno {sy}', [(cx + 0.08, sy * 0.05, cz + 0.15), (cx + 0.02, sy * 0.08, cz + 0.27)], 0.015, hueso, seg=4)
    for k, x in enumerate((-0.25, 0.15)):
        for sy in (-1, 1):
            tubo(coll, f'pata {k}{sy}', [(x, sy * 0.05, 0.62), (x + 0.04, sy * 0.1, 0.42), (x, sy * 0.1, 0.25)], 0.018, hueso, seg=4)


def m_banco_museo(coll):
    """Banco tapizado para mirar las vitrinas."""
    caja(coll, 'asiento', (0, 0, 0.42), (0.7, 0.24, 0.07), tela('terciopelo', '#8E3B5E'), p=6)
    for k in range(4):
        bola(coll, f'botón {k}', (-0.5 + k * 0.33, 0, 0.495), 0.018, metal('oro', '#E8C66A'), n=2, sub=0)
    patas(coll, 'banco museo', 0.62, 0.18, 0.36, 0.035, CHOCO())


def m_placa_pared(coll):
    """Cartela enmarcada de pared con texto (respaldo en y=0; el juego la pone a 1.6 m)."""
    caja(coll, 'marco', (0, -0.02, 0), (0.42, 0.02, 0.3), metal('oro', '#E8C66A'), p=8, sub=0)
    caja(coll, 'cartela', (0, -0.04, 0), (0.36, 0.01, 0.24), mat('cartela', '#F6EEDC', 0.9), p=10, sub=0)
    caja(coll, 'título', (0, -0.05, 0.14), (0.22, 0.003, 0.025), laca('título', '#8E3B5E', 0.6), p=12, sub=0)
    for j in range(5):
        caja(coll, f'renglón {j}', (0, -0.05, 0.05 - j * 0.055), (0.28 - (j % 2) * 0.05, 0.003, 0.009), mat('tinta', '#6E5A48', 0.9), p=12, sub=0)



# ---------------------------------------------------------------- piezas del museo comunitario (van sobre el cojín de la vitrina)

def m_pieza_fanal_portuario(coll):
    """Fanal de los primeros muelles: farol de puerto de latón con un vidrio roto."""
    laton = metal('latón', '#C9A44C')
    cilindro(coll, 'base fanal', (0, 0, 0), 0.11, 0.04, laton, seg=16)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        tubo(coll, f'varilla fanal {k}', [(math.cos(a) * 0.09, math.sin(a) * 0.09, 0.04), (math.cos(a) * 0.09, math.sin(a) * 0.09, 0.3)], 0.012, laton,
             seg=5)
    for k in range(3):
        a = k * math.pi / 2
        o = caja(coll, f'vidrio fanal {k}', (0, 0, 0), (0.065, 0.004, 0.12), vidrio('fanal', '#F3E4B0'), p=12, sub=0)
        o.location = (math.cos(a) * 0.085, math.sin(a) * 0.085, 0.17)
        o.rotation_euler = (0, 0, a + math.pi / 2)
    o = caja(coll, 'vidrio roto', (0, 0, 0), (0.04, 0.004, 0.05), vidrio('fanal', '#F3E4B0'), p=12, sub=0)  # solo queda un pedazo
    o.location = (0.02, -0.085, 0.24)
    o.rotation_euler = (0, 0.4, 0)
    clay.blob('llama fanal', (0, 0, 0.14), (0.03, 0.03, 0.06), coll, luz('llama', '#FFB347', 3.0), n=3, p=1.6)
    clay.lathe('techo fanal', [(0.0, 0.0), (0.13, 0.0), (0.06, 0.08), (0.0, 0.1)], coll, laton, segments=16, subsurf=1).location = (0, 0, 0.3)
    clay.lathe('aro fanal', [(0.03, -0.012), (0.045, 0.0), (0.03, 0.012)], coll, laton, segments=12, subsurf=0, cap_bottom=False,
               cap_top=False).location = (0, 0, 0.44)


def m_pieza_vasija_riego(coll):
    """Vasija de riego remendada: barro con tres parches de reparación y su cordel."""
    clay.lathe('vasija', [(0.0, 0.0), (0.09, 0.0), (0.15, 0.08), (0.16, 0.16), (0.12, 0.25), (0.07, 0.29), (0.085, 0.33), (0.0, 0.33)], coll,
               mat('barro', '#C8794B', 0.85), segments=24, subsurf=1)
    for k, (a, z, c) in enumerate(((-1.6, 0.14, '#8EC5F0'), (-1.0, 0.22, '#F2C94C'), (-2.1, 0.08, '#7FB069'))):
        o = caja(coll, f'parche {k}', (0, 0, 0), (0.045, 0.006, 0.035), tela(f'parche {c}', c), p=8, sub=1)
        o.location = (math.cos(a) * 0.155, math.sin(a) * 0.155, z)
        o.rotation_euler = (0, 0, a + math.pi / 2)
        for j in range(3):
            caja(coll, f'puntada {k}{j}', (0, 0, 0), (0.003, 0.004, 0.012), mat('hilo', '#F6F1E6', 0.8), p=12, sub=0).location = (
                math.cos(a) * 0.162 + (j - 1) * 0.02 * math.sin(a), math.sin(a) * 0.162 - (j - 1) * 0.02 * math.cos(a), z + 0.035)
    clay.lathe('cordel', [(0.13, -0.008), (0.14, 0.0), (0.13, 0.008)], coll, tela('cordel', '#B98A5E'), segments=24, subsurf=0, cap_bottom=False,
               cap_top=False).location = (0, 0, 0.24)


def m_pieza_campana_turno(coll):
    """Campana de cambio de turno: bronce colgada de un marco de madera."""
    for sx in (-1, 1):
        caja(coll, f'pata campana {sx}', (sx * 0.13, 0, 0.18), (0.02, 0.03, 0.18), OSC(), p=8, sub=0)
    caja(coll, 'travesaño campana', (0, 0, 0.37), (0.16, 0.035, 0.025), OSC(), p=8, sub=0)
    caja(coll, 'base campana', (0, 0, 0.015), (0.17, 0.08, 0.015), CHOCO(), p=8, sub=0)
    clay.lathe('campana', [(0.0, 0.0), (0.1, 0.0), (0.095, 0.02), (0.07, 0.1), (0.06, 0.17), (0.0, 0.19)], coll, metal('bronce', '#B9823F'),
               segments=20, subsurf=1).location = (0, 0, 0.14)
    bola(coll, 'badajo', (0, 0, 0.13), 0.025, metal('hierro', '#3E3A38'), n=2)
    tubo(coll, 'cuerda campana', [(0.0, 0.0, 0.14), (0.05, -0.03, 0.05)], 0.008, tela('cordel', '#B98A5E'), seg=4)


def m_pieza_placa_taller(coll):
    """Placa de un taller cerrado: tabla con el nombre del dueño y seis plaquitas de aprendices."""
    o = caja(coll, 'placa', (0, 0, 0), (0.17, 0.02, 0.13), madera('placa', '#9A6A44'), p=8, sub=1)
    o.location = (0, 0.04, 0.15)
    o.rotation_euler = (-0.25, 0, 0)
    caja(coll, 'atril', (0, 0.08, 0.06), (0.06, 0.04, 0.06), OSC(), p=8, sub=0)
    t = caja(coll, 'nombre dueño', (0, 0, 0), (0.12, 0.004, 0.02), metal('latón', '#C9A44C'), p=12, sub=0)
    t.location = (0, 0.013 + 0.08 * 0.25, 0.23)
    t.rotation_euler = (-0.25, 0, 0)
    for k in range(6):
        t = caja(coll, f'aprendiz {k}', (0, 0, 0), (0.05, 0.004, 0.012), metal('cobre', '#C27C4E'), p=12, sub=0)
        z = 0.18 - (k // 2) * 0.045
        t.location = (-0.065 + (k % 2) * 0.13, 0.013 + (z - 0.15) * 0.25, z)
        t.rotation_euler = (-0.25, 0, 0)


def m_pieza_aguja_camino(coll):
    """Aguja de orientación: brújula de bolsillo abierta con su cadena y marcas de permiso en la tapa."""
    oro = metal('latón', '#C9A44C')
    cilindro(coll, 'caja brújula', (0, 0, 0), 0.12, 0.04, oro, seg=24)
    cilindro(coll, 'esfera', (0, 0, 0.04), 0.1, 0.004, mat('esfera', '#F6EEDC', 0.6), seg=24)
    o = caja(coll, 'aguja norte', (0, 0, 0), (0.012, 0.05, 0.004), laca('aguja', '#C0392B', 0.4), p=12, sub=0)
    o.location = (0.015, 0.035, 0.05)
    o.rotation_euler = (0, 0, -0.4)
    o = caja(coll, 'aguja sur', (0, 0, 0), (0.012, 0.05, 0.004), metal('acero', '#C7CED6'), p=12, sub=0)
    o.location = (-0.015, -0.035, 0.05)
    o.rotation_euler = (0, 0, -0.4)
    o = clay.lathe('tapa', [(0.0, 0.0), (0.12, 0.0), (0.12, 0.02), (0.0, 0.025)], coll, oro, segments=24, subsurf=0)
    o.location = (0, 0.12, 0.05)
    o.rotation_euler = (-1.9, 0, 0)
    for k in range(3):
        bola(coll, f'marca permiso {k}', (-0.04 + k * 0.04, 0.17, 0.12), 0.012, laca('marca', ('#7FB069', '#8EC5F0', '#F2C94C')[k], 0.5), n=2, sub=0)
    for k in range(6):
        bola(coll, f'cadena {k}', (0.12 + k * 0.025, -0.03 - k * 0.02, 0.01), (0.012, 0.008, 0.006), oro, n=2, sub=0)


def m_pieza_azulejo_cuenca(coll):
    """Azulejo de la cuenca compartida: baldosa en atril con cuatro colores, uno por acuerdo."""
    caja(coll, 'atril azulejo', (0, 0.07, 0.05), (0.06, 0.05, 0.05), OSC(), p=8, sub=0)
    colores = ('#3B6FB6', '#7FB069', '#F2C94C', '#E4566B')
    for k in range(4):
        o = caja(coll, f'cuarto {k}', (0, 0, 0), (0.07, 0.012, 0.07), laca(f'azulejo {colores[k]}', colores[k], 0.25), p=10, sub=1)
        z = 0.27 - (k // 2) * 0.15
        o.location = (-0.075 + (k % 2) * 0.15, 0.025 + (z - 0.2) * 0.2, z)
        o.rotation_euler = (-0.2, 0, 0)
    o = caja(coll, 'marco azulejo', (0, 0, 0), (0.16, 0.008, 0.16), mat('crema', '#F0DABC', 0.8), p=10, sub=0)
    o.location = (0, 0.045, 0.2)
    o.rotation_euler = (-0.2, 0, 0)
    for k in range(4):  # olitas pintadas
        z = 0.27 - (k // 2) * 0.15
        bola(coll, f'ola {k}', (-0.075 + (k % 2) * 0.15, 0.009 + (z - 0.2) * 0.2, z), (0.04, 0.004, 0.012),
             mat('esmalte', '#F6F1E6', 0.3), n=2, sub=0)


PIEZAS = {k[2:]: v for k, v in globals().items() if k.startswith('m_') and callable(v)}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Muebles granja')
    raices = []
    for clave in claves or PIEZAS:
        antes = set(coll.objects)
        PIEZAS[clave](coll)
        raiz = bpy.data.objects.new(f'm_{clave}', None)
        clay.link(raiz, coll)
        for o in coll.objects:
            if o not in antes and o is not raiz and o.parent is None:
                o.parent = raiz
        raices.append(raiz)
        print('pieza', clave, flush=True)
    import exportar_glb
    objs = []
    for r in raices:
        objs.extend(exportar_glb.arbol(r))
    exportar_glb.exportar(objs, os.path.join(out, 'granja_muebles.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
