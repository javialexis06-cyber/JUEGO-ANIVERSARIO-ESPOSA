"""Nuestro Hogar · granja: el invernadero por dentro.

huerto-render.ts (interiorInvernadero, riegoInvernadero): piso de baldosas de barro con el caminito de piedra, las dos
camas de cultivo de madera (el juego pone encima los surcos y las matas), la pared de vidrio del fondo con su murito de
ladrillo, las de los lados, el marco de la puerta con su letrero y el tapete, y lo que le da vida: el estante con
matas, la mesa de trasplantar, la regadera, los costales de abono, la manguera enrollada, la carretilla con tierra,
las matas colgadas de las vigas, los helechos de la entrada y el riego automático (tubo con aspersores y su llave).

Medidas de three.js (el cuarto es de 16 × 12, con el fondo en z = -5,9 y la puerta en z = 5,9). Cada pieza queda bajo
un vacío «m_<clave>» en granja_invernadero.glb.

Uso: blender -b -P granja_invernadero.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import madera, tela  # noqa: E402
from tiendas import _mat  # noqa: E402
from granja_muebles import _costal, bola, caja, cilindro, mat, metal, piedra, tubo  # noqa: E402

RNG = np.random.default_rng(83)
MAD = lambda: madera('inv madera', '#B48A5A')  # noqa: E731
MAD_OSC = lambda: madera('inv madera oscura', '#7A5E42')  # noqa: E731
BLANCO = lambda: mat('inv marco blanco', '#EFEBDF', 0.45)  # noqa: E731
TIERRA = lambda: mat('inv tierra', '#6E5038', 0.95)  # noqa: E731
BARRO = lambda: mat('inv terracota', '#C9714A', 0.8)  # noqa: E731
HOJAS = ['#4C8B45', '#5FA85A', '#3F7A3C', '#78B95E']


def C(x, y, z):
    """De three.js (x, y arriba, z al frente) a Blender (x, -z, y)."""
    return (x, -z, y)


def H(w, h, d):
    return (w / 2, d / 2, h / 2)


def bloque(coll, nombre, medidas, centro, material, p=8, sub=1):
    return caja(coll, nombre, C(*centro), H(*medidas), material, p=p, sub=sub)


def palo(coll, nombre, a, b, r, material, seg=6):
    return tubo(coll, nombre, [C(*a), C(*b)], r, material, seg=seg)


def vidrio_inv():
    v = _mat('Granja | vidrio invernadero', '#DDF2EA', rough=0.05, alpha=0.2)
    v.blend_method = 'BLEND'  # glTF lo exporta transparente solo si no es opaco
    return v


def hoja(coll, nombre, base, punta, ancho, color):
    """Una hoja de plastilina (gordita en el medio, en punta)."""
    mid = tuple((a + b) / 2 for a, b in zip(base, punta))
    mid = (mid[0], mid[1], mid[2] + 0.04)
    clay.sweep(nombre, [C(*base), C(*mid), C(*punta)], [ancho * 0.25, ancho, ancho * 0.1], profile=(1.0, 0.22), coll=coll,
               material=mat(f'inv hoja {color}', color, 0.55), segments=6, samples=4, caps=('flat', 'point'), subsurf=0)


def mata(coll, nombre, x, y, z, s=1.0, flor=None, colgante=False):
    """Una matica: un ramillete de hojas (y flores, si tiene); las colgantes caen hacia abajo."""
    n = 7 if not colgante else 9
    for k in range(n):
        a = k * 2 * math.pi / n + RNG.uniform(-0.2, 0.2)
        l = s * RNG.uniform(0.16, 0.26)
        if colgante:
            punta = (x + math.cos(a) * l * 0.9, y - l * RNG.uniform(0.8, 1.6), z + math.sin(a) * l * 0.9)
        else:
            punta = (x + math.cos(a) * l * 0.8, y + l * RNG.uniform(0.5, 1.0), z + math.sin(a) * l * 0.8)
        hoja(coll, f'{nombre} hoja {k}', (x, y, z), punta, 0.05 * s, HOJAS[k % len(HOJAS)])
    if flor:
        for k in range(3):
            a = k * 2.1 + 0.4
            bola(coll, f'{nombre} flor {k}', C(x + math.cos(a) * 0.08 * s, y + 0.14 * s, z + math.sin(a) * 0.08 * s), 0.035 * s,
                 mat(f'inv flor {flor}', flor, 0.5), n=3, sub=0)
            bola(coll, f'{nombre} centro {k}', C(x + math.cos(a) * 0.08 * s, y + 0.155 * s, z + math.sin(a) * 0.08 * s - 0.02 * s),
                 0.014 * s, mat('inv centro flor', '#F7D046', 0.5), n=2, sub=0)


def maceta(coll, nombre, x, y, z, r=0.1, h=0.12, planta=True, flor=None, color='#C9714A'):
    """Matera de barro con su borde, la tierra y la matica."""
    o = clay.lathe(f'{nombre} matera', [(r * 0.72, 0.0), (r, h * 0.85), (r * 1.1, h * 0.88), (r * 1.1, h), (r * 0.95, h)], coll,
                   mat(f'inv barro {color}', color, 0.8), segments=16, subsurf=1, cap_bottom=True, cap_top=False)
    o.location = C(x, y, z)
    o = clay.lathe(f'{nombre} tierra', [(0.0, 0.0), (r * 0.95, 0.0)], coll, TIERRA(), segments=16, subsurf=0, cap_bottom=False, cap_top=False)
    o.location = C(x, y + h * 0.9, z)
    if planta:
        mata(coll, nombre, x, y + h * 0.9, z, s=r / 0.1 * 0.9, flor=flor)


# ----------------------------------------------------------------------------------------------------- El cuarto
def m_inv_piso(coll):
    """Piso de baldosas de barro (16 × 12) con el caminito de piedras del medio, de la puerta al fondo."""
    bloque(coll, 'base piso', (16.0, 0.16, 12.0), (0, -0.09, 0), mat('inv junta', '#A88E6E', 0.9), p=10, sub=0)
    tonos = [mat('inv baldosa a', '#C98B62', 0.75), mat('inv baldosa b', '#BF7F57', 0.75), mat('inv baldosa c', '#D19A70', 0.75)]
    for i in range(16):
        for k in range(12):
            x, z = -7.5 + i, -5.5 + k
            if -1.0 < x < 1.0:
                continue
            bloque(coll, f'baldosa {i} {k}', (0.94, 0.03, 0.94), (x, -0.012, z), tonos[(i * 7 + k * 3) % 3], p=6, sub=0)
    # El caminito: lajas de piedra de distintos tamaños
    z = 5.6
    k = 0
    while z > -5.6:
        largo = RNG.uniform(0.55, 0.8)
        for lado in (-1, 1):
            ancho = RNG.uniform(0.75, 0.9)
            bloque(coll, f'laja {k} {lado}', (ancho, 0.04, largo * 0.92), (lado * 0.47 + RNG.uniform(-0.04, 0.04), -0.008, z - largo / 2),
                   piedra('inv laja', '#B9B2A4'), p=5, sub=1)
        z -= largo
        k += 1
    # Musguito entre las lajas
    for k in range(26):
        bola(coll, f'musgo {k}', C(RNG.uniform(-0.95, 0.95), 0.0, RNG.uniform(-5.5, 5.5)), (0.06, 0.06, 0.012), mat('inv musgo', '#7FA35A', 0.9),
             n=2, sub=0)


def m_inv_cama(coll):
    """Cama de cultivo de 3 × 6 (centrada): marco de tablas con postes de esquina y la tierra negrita adentro."""
    bloque(coll, 'tierra cama', (3.0, 0.03, 6.0), (0, 0.016, 0), TIERRA(), p=6, sub=0)
    for s in (-1, 1):
        bloque(coll, f'tabla larga {s}', (0.1, 0.16, 6.2), (s * 1.55, 0.05, 0), MAD(), p=10)
        bloque(coll, f'tabla corta {s}', (3.2, 0.16, 0.1), (0, 0.05, s * 3.05), MAD(), p=10)
        bloque(coll, f'canto largo {s}', (0.14, 0.03, 6.24), (s * 1.55, 0.14, 0), MAD_OSC(), p=10, sub=0)
        bloque(coll, f'canto corto {s}', (3.24, 0.03, 0.14), (0, 0.14, s * 3.05), MAD_OSC(), p=10, sub=0)
    for sx in (-1, 1):
        for sz in (-1, 1):
            bloque(coll, f'poste {sx}{sz}', (0.14, 0.22, 0.14), (sx * 1.55, 0.08, sz * 3.05), MAD_OSC(), p=8)
            bola(coll, f'remate {sx}{sz}', C(sx * 1.55, 0.21, sz * 3.05), (0.06, 0.06, 0.04), MAD(), n=2, sub=0)
    # Las estaquitas con su letrero (en la punta de adelante)
    for k, (x, color) in enumerate(((-0.9, '#E86A8A'), (0.0, '#F7D046'), (0.9, '#7DB7E8'))):
        palo(coll, f'estaca {k}', (x, 0.0, 3.25), (x, 0.32, 3.25), 0.012, MAD())
        bloque(coll, f'letrero {k}', (0.16, 0.1, 0.012), (x, 0.32, 3.26), mat('inv letrero', '#FFF8EA', 0.7), p=8, sub=0)
        bola(coll, f'dibujo {k}', C(x, 0.32, 3.268), (0.03, 0.004, 0.03), mat(f'inv dibujito {color}', color, 0.5), n=2, sub=0)


def _panel(coll, nombre, x0, x1, y0, y1, z, eje='x'):
    """Un vidrio con su marquito blanco (en el plano x–y a la altura z, o y–z en x = z si eje es 'z')."""
    v = vidrio_inv()
    w, h = abs(x1 - x0), y1 - y0
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if eje == 'x':
        bloque(coll, f'{nombre} vidrio', (w, h, 0.02), (cx, cy, z), v, p=12, sub=0)
    else:
        bloque(coll, f'{nombre} vidrio', (0.02, h, w), (z, cy, cx), v, p=12, sub=0)


def m_inv_pared_fondo(coll):
    """La pared del fondo: murito de ladrillo, marcos blancos con vidrios y un arco de hierro arriba."""
    z = -5.9
    ladrillo = [mat('inv ladrillo a', '#B5654A', 0.85), mat('inv ladrillo b', '#A85C43', 0.85), mat('inv ladrillo c', '#BF7155', 0.85)]
    bloque(coll, 'mortero fondo', (16.0, 0.42, 0.2), (0, 0.21, z), mat('inv mortero', '#D8CBB2', 0.9), p=10, sub=0)
    for fila in range(3):
        x = -8.0 + (0.17 if fila % 2 else 0.0)
        k = 0
        while x < 7.95:
            ancho = min(0.32, 8.0 - x)
            bloque(coll, f'ladrillo {fila} {k}', (ancho - 0.02, 0.12, 0.22), (x + ancho / 2, 0.07 + fila * 0.135, z), ladrillo[(fila + k) % 3], p=6, sub=0)
            x += ancho
            k += 1
    bloque(coll, 'remate murito', (16.1, 0.06, 0.28), (0, 0.44, z), piedra('inv remate', '#CFC6B4'), p=8)
    # Marcos: postes grandes, parales cada metro y travesaños
    for x in (-7.9, -4.0, 0.0, 4.0, 7.9):
        bloque(coll, f'poste {x}', (0.16, 3.2, 0.18), (x, 1.6, z), BLANCO(), p=8)
    for x in np.arange(-7.0, 7.5, 1.0):
        if abs(x) in (0.0, 4.0):
            continue
        bloque(coll, f'paral {x}', (0.06, 2.75, 0.08), (x, 1.84, z), BLANCO(), p=8, sub=0)
    for y in (1.6, 3.18):
        bloque(coll, f'travesaño {y}', (16.0, 0.1, 0.16), (0, y, z), BLANCO(), p=8)
    _panel(coll, 'fondo bajo', -7.9, 7.9, 0.47, 1.55, z + 0.02)
    _panel(coll, 'fondo alto', -7.9, 7.9, 1.65, 3.13, z + 0.02)
    # Adornos: un arco de hierro con espirales arriba, el termómetro y los ganchos con matas
    hierro = metal('inv hierro', '#3F4A44')
    for x0 in (-4.0, 0.0):
        pts = [C(x0 + t * 4.0, 3.23 + math.sin(t * math.pi) * 0.45, z) for t in np.linspace(0, 1, 9)]
        tubo(coll, f'arco {x0}', pts, 0.035, hierro, seg=6)
    for x0 in (-8.0, 4.0):
        pts = [C(x0 + t * 4.0, 3.23 + math.sin(t * math.pi) * 0.45, z) for t in np.linspace(0, 1, 9)]
        tubo(coll, f'arco lado {x0}', pts, 0.035, hierro, seg=6)
    bloque(coll, 'termometro', (0.12, 0.5, 0.03), (1.9, 1.15, z + 0.12), mat('inv termometro', '#FFF8EA', 0.6), p=8)
    palo(coll, 'mercurio', (1.9, 0.95, z + 0.14), (1.9, 1.32, z + 0.14), 0.012, mat('inv mercurio', '#E4574B', 0.4))
    bola(coll, 'bulbo', C(1.9, 0.94, z + 0.14), 0.025, mat('inv mercurio', '#E4574B', 0.4), n=3, sub=0)


def m_inv_pared_lado(coll):
    """Una pared de lado (12 de largo, a lo largo de z, en x = 0): murito de ladrillo y vidrios con marcos."""
    ladrillo = [mat('inv ladrillo a', '#B5654A', 0.85), mat('inv ladrillo b', '#A85C43', 0.85), mat('inv ladrillo c', '#BF7155', 0.85)]
    bloque(coll, 'mortero lado', (0.2, 0.42, 12.0), (0, 0.21, 0), mat('inv mortero', '#D8CBB2', 0.9), p=10, sub=0)
    for fila in range(3):
        z = -6.0 + (0.17 if fila % 2 else 0.0)
        k = 0
        while z < 5.95:
            largo = min(0.32, 6.0 - z)
            bloque(coll, f'ladrillo {fila} {k}', (0.22, 0.12, largo - 0.02), (0, 0.07 + fila * 0.135, z + largo / 2), ladrillo[(fila + k) % 3], p=6, sub=0)
            z += largo
            k += 1
    bloque(coll, 'remate murito', (0.28, 0.06, 12.1), (0, 0.44, 0), piedra('inv remate', '#CFC6B4'), p=8)
    for z in (-5.9, -3.0, 0.0, 3.0, 5.9):
        bloque(coll, f'poste {z}', (0.16, 2.6, 0.16), (0, 1.3, z), BLANCO(), p=8)
    for z in np.arange(-4.5, 5.0, 1.5):
        if abs(z) < 0.1 or abs(abs(z) - 3.0) < 0.1:
            continue
        bloque(coll, f'paral {z}', (0.07, 2.15, 0.06), (0, 1.53, z), BLANCO(), p=8, sub=0)
    for y in (1.5, 2.58):
        bloque(coll, f'travesaño {y}', (0.16, 0.09, 12.0), (0, y, 0), BLANCO(), p=8)
    _panel(coll, 'lado bajo', -5.9, 5.9, 0.47, 1.46, 0.0, eje='z')
    _panel(coll, 'lado alto', -5.9, 5.9, 1.55, 2.54, 0.0, eje='z')


def m_inv_puerta(coll):
    """El marco de la puerta (a lo ancho, en z = 0), con el letrero de hoja, dos faroles y el tapete de fibra."""
    for x in (-1.0, 1.0):
        bloque(coll, f'jamba {x}', (0.16, 2.7, 0.2), (x, 1.35, 0), BLANCO(), p=8)
    bloque(coll, 'dintel', (2.3, 0.18, 0.22), (0, 2.72, 0), BLANCO(), p=8)
    # El letrero colgado con su hojita
    bloque(coll, 'letrero', (1.1, 0.3, 0.05), (0, 3.02, 0), MAD(), p=8)
    palo(coll, 'cadenita a', (-0.4, 2.8, 0), (-0.4, 2.88, 0), 0.01, metal('inv cadena', '#9AA0A6'))
    palo(coll, 'cadenita b', (0.4, 2.8, 0), (0.4, 2.88, 0), 0.01, metal('inv cadena', '#9AA0A6'))
    for k in range(3):
        hoja(coll, f'hoja letrero {k}', (-0.3 + k * 0.3, 3.0, 0.03), (-0.2 + k * 0.3, 3.08, 0.04), 0.05, HOJAS[k])
    bloque(coll, 'letras', (0.6, 0.04, 0.01), (0.1, 2.95, 0.03), mat('inv letras', '#4E3A2A', 0.8), p=10, sub=0)
    for x in (-1.25, 1.25):
        bloque(coll, f'farol {x}', (0.14, 0.2, 0.14), (x, 2.2, 0.12), metal('inv hierro', '#3F4A44'), p=8)
        bloque(coll, f'luz farol {x}', (0.1, 0.14, 0.1), (x, 2.2, 0.12), mat('inv luz farol', '#FFE6A8', 0.4, emission='#FFE6A8', emission_strength=2.0),
               p=8, sub=0)
    # El tapete (adentro, delante de la puerta)
    bloque(coll, 'tapete', (1.8, 0.03, 1.1), (0, 0.016, -0.65), tela('inv tapete', '#C9A86E'), p=6)
    for k in range(5):
        bloque(coll, f'raya tapete {k}', (1.7, 0.006, 0.05), (0, 0.033, -1.1 + k * 0.22), tela('inv raya tapete', '#9C7A48'), p=12, sub=0)


# ----------------------------------------------------------------------------------------------------- Lo que le da vida
def m_inv_estante(coll):
    """Estante de tablas (1,6 de ancho) con tres pisos de materas, semilleros y una regadera chiquita."""
    for x in (-0.78, 0.78):
        for z in (-0.2, 0.2):
            bloque(coll, f'pata {x}{z}', (0.07, 1.6, 0.07), (x, 0.8, z), MAD_OSC(), p=8)
    for k, y in enumerate((0.3, 0.85, 1.4)):
        bloque(coll, f'tabla {k}', (1.66, 0.05, 0.5), (0, y, 0), MAD(), p=8)
    flores = ['#F06BA8', None, '#F7D046', None, '#C9A4F2', '#E4574B']
    for k, y in enumerate((0.33, 0.88, 1.43)):
        for i in range(3):
            x = -0.5 + i * 0.5 + RNG.uniform(-0.05, 0.05)
            maceta(coll, f'mat {k} {i}', x, y, RNG.uniform(-0.05, 0.05), r=RNG.uniform(0.08, 0.11), h=0.13, flor=flores[(k * 3 + i) % 6])
    # Un semillero en el piso de abajo
    bloque(coll, 'semillero', (0.6, 0.06, 0.3), (0.35, 0.06, 0.02), mat('inv semillero', '#3F6E8C', 0.6), p=8)
    for i in range(6):
        mata(coll, f'brote {i}', 0.15 + (i % 3) * 0.2, 0.09, -0.06 + (i // 3) * 0.16, s=0.35)


def m_inv_mesa(coll):
    """Mesa de trasplantar: tablero con su bandeja de tierra, materas apiladas, la palita y los sobres de semillas."""
    for x in (-0.65, 0.65):
        for z in (-0.28, 0.28):
            bloque(coll, f'pata {x}{z}', (0.08, 0.82, 0.08), (x, 0.41, z), MAD_OSC(), p=8)
    bloque(coll, 'tablero', (1.5, 0.06, 0.7), (0, 0.85, 0), MAD(), p=8)
    bloque(coll, 'repisa', (1.4, 0.04, 0.6), (0, 0.22, 0), MAD(), p=8)
    bloque(coll, 'bandeja', (0.6, 0.08, 0.42), (-0.35, 0.92, 0), mat('inv bandeja', '#5E7E8C', 0.6), p=8)
    bloque(coll, 'tierra bandeja', (0.54, 0.02, 0.36), (-0.35, 0.96, 0), TIERRA(), p=6, sub=0)
    # Materas vacías apiladas
    for k in range(3):
        o = clay.lathe(f'apilada {k}', [(0.07, 0.0), (0.1, 0.12), (0.11, 0.13)], coll, BARRO(), segments=14, subsurf=1, cap_bottom=True, cap_top=False)
        o.location = C(0.35, 0.88 + k * 0.05, 0.05)
    maceta(coll, 'mat mesa', 0.6, 0.88, -0.15, r=0.09, h=0.12, flor='#F06BA8')
    # La palita y los sobres
    palo(coll, 'mango palita', (-0.05, 0.9, 0.25), (0.2, 0.9, 0.2), 0.018, MAD_OSC())
    bloque(coll, 'pala', (0.14, 0.015, 0.09), (-0.12, 0.9, 0.27), metal('inv pala', '#A8AEB4'), p=6)
    for k, color in enumerate(('#E86A8A', '#7DB7E8', '#F7D046')):
        o = bloque(coll, f'sobre {k}', (0.12, 0.012, 0.16), (0.05 + k * 0.13, 0.89, -0.2), mat(f'inv sobre {color}', color, 0.6), p=8, sub=0)
        o.rotation_euler = (0, 0, RNG.uniform(-0.3, 0.3))
    _costal(coll, 'costal mesa', 0.3, 0.0, 0.45, '#D3BE95', abierto='#5A4130')
    for o in coll.objects:
        if o.name.startswith('costal mesa') and o.parent is None:
            o.location = (o.location[0], o.location[1], o.location[2] + 0.24)


def m_inv_regadera(coll):
    """Regadera de lata verde con su pico largo y la flor de agua."""
    verde = metal('inv regadera', '#6FA88F')
    o = clay.lathe('cuerpo regadera', [(0.0, 0.0), (0.16, 0.0), (0.17, 0.04), (0.16, 0.3), (0.12, 0.34), (0.0, 0.34)], coll, verde, segments=20,
                   subsurf=1)
    o.location = C(0, 0, 0)
    tubo(coll, 'pico', [C(0.12, 0.08, 0), C(0.32, 0.22, 0), C(0.42, 0.34, 0)], 0.025, verde, seg=8)
    o = clay.lathe('flor regadera', [(0.0, 0.0), (0.05, 0.0), (0.06, 0.03), (0.0, 0.03)], coll, metal('inv flor regadera', '#C9D3DA'), segments=12,
                   subsurf=1)
    o.location = C(0.43, 0.34, 0)
    o.rotation_euler = (0, math.radians(40), 0)
    tubo(coll, 'asa', [C(-0.14, 0.12, 0), C(-0.2, 0.32, 0), C(-0.05, 0.42, 0), C(0.06, 0.34, 0)], 0.02, verde, seg=6)


def m_inv_costales(coll):
    """Costales de abono y de semillas (uno abierto)."""
    _costal(coll, 'abono a', -0.3, 0.0, 1.0, '#8A6A44', abierto='#4E3A2A')
    _costal(coll, 'semilla b', 0.3, 0.05, 0.9, '#D8C49C')
    _costal(coll, 'semilla c', 0.0, 0.45, 0.85, '#CDB68C', abierto='#E8C35A')


def m_inv_manguera(coll):
    """El carrete de la manguera: ruedas, manija y la manguera verde enrollada."""
    rojo = metal('inv carrete', '#C9563F')
    for x in (-0.22, 0.22):
        o = clay.lathe(f'rueda {x}', [(0.0, -0.015), (0.28, -0.015), (0.3, 0.0), (0.28, 0.015), (0.0, 0.015)], coll, rojo, segments=24, subsurf=1)
        o.location = C(x, 0.32, 0)
        o.rotation_euler = (0, math.pi / 2, 0)
    palo(coll, 'eje', (-0.25, 0.32, 0), (0.25, 0.32, 0), 0.04, rojo)
    verde = mat('inv manguera', '#4FA05A', 0.4)
    for k in range(6):
        o = clay.lathe(f'vuelta {k}', [(0.16 + (k % 3) * 0.03, -0.02), (0.18 + (k % 3) * 0.03, 0.0), (0.16 + (k % 3) * 0.03, 0.02)], coll, verde, segments=20,
                       subsurf=1, cap_bottom=False, cap_top=False)
        o.location = C(-0.16 + k * 0.064, 0.32, 0)
        o.rotation_euler = (0, math.pi / 2, 0)
    tubo(coll, 'punta manguera', [C(0.2, 0.15, 0.1), C(0.4, 0.03, 0.3), C(0.7, 0.03, 0.35), C(0.85, 0.03, 0.2)], 0.025, verde, seg=6)
    palo(coll, 'manija', (0.0, 0.62, 0), (0.0, 0.9, 0), 0.025, rojo)
    palo(coll, 'agarre', (-0.18, 0.9, 0), (0.18, 0.9, 0), 0.03, MAD_OSC())
    for x in (-0.25, 0.25):
        palo(coll, f'pata {x}', (x, 0.32, 0), (x, 0.0, 0.2), 0.025, rojo)


def m_inv_carretilla(coll):
    """Carretilla de lata con tierra y una matica que va de viaje."""
    lata = metal('inv carretilla', '#5E8CB0')
    o = clay.lathe('platon', [(0.0, 0.0), (0.32, 0.0), (0.42, 0.22), (0.44, 0.24), (0.0, 0.24)], coll, lata, segments=24, subsurf=1, cap_top=False)
    o.location = C(0, 0.3, 0)
    o.scale = (1.0, 1.35, 1.0)
    bola(coll, 'tierra', C(0, 0.5, 0), (0.38, 0.5, 0.06), TIERRA(), n=4)
    mata(coll, 'viajera', 0.05, 0.53, 0.1, s=0.9, flor='#F06BA8')
    o = clay.lathe('rueda', [(0.0, -0.04), (0.14, -0.04), (0.16, 0.0), (0.14, 0.04), (0.0, 0.04)], coll, mat('inv rueda', '#3D3D46', 0.7), segments=20,
                   subsurf=1)
    o.location = C(0, 0.16, -0.6)
    o.rotation_euler = (0, math.pi / 2, 0)
    for x in (-0.22, 0.22):
        palo(coll, f'brazo {x}', (x * 0.5, 0.24, -0.55), (x, 0.42, 0.75), 0.025, MAD_OSC())
        palo(coll, f'pata {x}', (x * 0.9, 0.3, 0.3), (x * 0.9, 0.0, 0.32), 0.022, MAD_OSC())
        bola(coll, f'mango {x}', C(x, 0.42, 0.8), (0.03, 0.03, 0.07), mat('inv mango', '#3D3D46', 0.7), n=2, sub=0)


def m_inv_colgante(coll):
    """Una matera colgada (con sus cadenitas) y la mata que se riega para abajo. El gancho queda en y = 0."""
    cadena = metal('inv cadena', '#9AA0A6')
    for k in range(3):
        a = k * 2 * math.pi / 3
        palo(coll, f'cadena {k}', (0, 0, 0), (math.cos(a) * 0.12, -0.42, math.sin(a) * 0.12), 0.008, cadena, seg=4)
    o = clay.lathe('canasta', [(0.0, 0.0), (0.08, 0.0), (0.14, 0.1), (0.15, 0.13), (0.0, 0.13)], coll, tela('inv canasta', '#C9A06E'), segments=16,
                   subsurf=1, cap_top=False)
    o.location = C(0, -0.55, 0)
    mata(coll, 'colgante', 0, -0.43, 0, s=1.2, flor='#F06BA8', colgante=True)


def m_inv_helecho(coll):
    """Helecho grande en matera de barro con rayas, para los lados de la puerta."""
    clay.lathe('matera helecho', [(0, 0), (0.16, 0), (0.22, 0.36), (0.25, 0.38), (0.25, 0.44), (0.0, 0.44)], coll, BARRO(), segments=20, subsurf=1)
    clay.lathe('raya helecho', [(0.2, 0.2), (0.215, 0.23), (0.205, 0.26)], coll, mat('inv raya', '#F2EBDD', 0.7), segments=20, subsurf=0,
               cap_bottom=False, cap_top=False)
    for k in range(11):
        a = k * 2 * math.pi / 11
        l = 0.45 + 0.15 * (k % 3)
        base = (math.cos(a) * 0.05, 0.42, math.sin(a) * 0.05)
        punta = (math.cos(a) * l * 0.85, 0.42 + l * 0.35, math.sin(a) * l * 0.85)
        hoja(coll, f'fronda {k}', base, punta, 0.09, HOJAS[k % 4])


def m_inv_riego(coll):
    """El riego automático de una cama (6 de largo, centrado): tubo con tres aspersores y la llavecita roja."""
    cobre = metal('inv cobre', '#B87A4B')
    palo(coll, 'tubo', (0, 0.08, -3.0), (0, 0.08, 3.15), 0.035, cobre, seg=8)
    for z in (-2.5, -0.5, 1.5):
        palo(coll, f'tubito {z}', (0, 0.08, z), (0, 0.28, z), 0.02, cobre, seg=6)
        o = clay.lathe(f'aspersor {z}', [(0.0, 0.0), (0.05, 0.0), (0.06, 0.04), (0.03, 0.07), (0.0, 0.07)], coll, metal('inv aspersor', '#C9D3DA'),
                       segments=12, subsurf=1)
        o.location = C(0, 0.27, z)
        for k in range(3):
            a = k * 2 * math.pi / 3
            bola(coll, f'gotica {z} {k}', C(math.cos(a) * 0.12, 0.33, z + math.sin(a) * 0.12), (0.018, 0.018, 0.024),
                 mat('inv gota', '#8FD3F2', 0.1), n=2, sub=0)
    o = clay.lathe('llave rueda', [(0.0, -0.015), (0.08, -0.015), (0.09, 0.0), (0.08, 0.015), (0.0, 0.015)], coll, metal('inv llave', '#E4574B'),
                   segments=14, subsurf=1)
    o.location = C(0, 0.22, 3.15)
    palo(coll, 'vastago', (0, 0.08, 3.15), (0, 0.22, 3.15), 0.018, cobre, seg=6)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Invernadero granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_invernadero.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
