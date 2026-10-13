"""Nuestro Hogar · granja: el refugio de los animales por fuera (arte.ts crearRefugio).

El mismo refugio de 4 × 4 con la puerta hacia +z, en piezas: el cuerpo (cimiento de piedras redondas, paredes con
tablas y juntas, postes de esquina, marco de la puerta con su umbral, ventanas con cruz y jardinera con matas, farol,
pacas de heno y costal), el techo de tejas gorditas con caballete y aleros, la veleta (gallito o flecha), la placa del
frontón con la carita de cada especie (13) y los adornos de clima y especie (nidales con rampa, percha del grifo,
cristales, enredadera, halo con nubes). Las partes que cambian de color con el clima y la especie llevan materiales con
nombre fijo («ref muro», «ref techo», «ref madera», «ref oscuro», «ref borde», «ref piedra», «ref vidrio», «ref
metal»): el juego les pone los colores de siempre. Medidas de three.js. Cada pieza queda bajo un vacío «m_<clave>» en
granja_refugios.glb.

Uso: blender -b -P granja_refugios.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import luz, tela  # noqa: E402
from granja_muebles import mat  # noqa: E402

MURO = lambda: mat('ref muro', '#E0CAA1', 0.85)  # noqa: E731
TECHO = lambda: mat('ref techo', '#C65B45', 0.7)  # noqa: E731
MADERA = lambda: mat('ref madera', '#916C50', 0.75)  # noqa: E731
OSCURO = lambda: mat('ref oscuro', '#635443', 0.8)  # noqa: E731
BORDE = lambda: mat('ref borde', '#EEDFBC', 0.7)  # noqa: E731
PIEDRA = lambda: mat('ref piedra', '#B8B6A1', 0.9)  # noqa: E731
VIDRIO = lambda: mat('ref vidrio', '#A5C5C2', 0.15)  # noqa: E731
METAL = lambda: mat('ref metal', '#B5A26E', 0.35)  # noqa: E731
HOJA = lambda: tela('ref hoja', '#7FA65E')  # noqa: E731
HOJA_OSC = lambda: tela('ref hoja oscura', '#5F8A4C')  # noqa: E731
PAJA = lambda: mat('ref paja', '#E3C77A', 0.9)  # noqa: E731
PAJA_OSC = lambda: mat('ref paja oscura', '#C9A95C', 0.9)  # noqa: E731
COSTAL = lambda: tela('ref costal', '#D8C49C')  # noqa: E731
HIERRO = lambda: mat('ref hierro', '#5D5A55', 0.45, metallic=0.6)  # noqa: E731
CANTO = [lambda: mat('ref canto a', '#A9A596', 0.9), lambda: mat('ref canto b', '#BDB8A6', 0.9), lambda: mat('ref canto c', '#979383', 0.9)]
OJO = lambda: mat('ref ojo', '#2E2A3F', 0.2, coat=0.8)  # noqa: E731
BRILLO = lambda: mat('ref brillo', '#FFFFFF', 0.1)  # noqa: E731
CACHETE = lambda: mat('ref cachete', '#F29AA8', 0.8)  # noqa: E731


def C(x, y, z):
    return (x, -z, y)


def R(rx, ry, rz):
    return (rx, rz, ry)


def girar(o, rx=0.0, ry=0.0, rz=0.0):
    o.rotation_euler = (rx, -rz, ry)
    return o


def en(o, c):
    o.location = C(*c)
    return o


def caja(coll, nombre, medidas, centro, material, p=6, sub=1, rot=(0.0, 0.0, 0.0)):
    w, h, d = medidas
    o = clay.rbox(nombre, (0, 0, 0), (w / 2, d / 2, h / 2), coll, material, p=p, n=3, subsurf=sub)
    return girar(en(o, centro), *rot)


def bola(coll, nombre, centro, radios, material, n=4, sub=1, shaper=None, rot=(0.0, 0.0, 0.0)):
    o = clay.blob(nombre, (0, 0, 0), R(*radios), coll, material, n=n, subsurf=sub, shaper=shaper)
    return girar(en(o, centro), *rot)


def palo(coll, nombre, a, b, r, material, seg=8):
    return clay.sweep(nombre, [C(*a), C(*b)], r, coll=coll, material=material, segments=seg, samples=2, subsurf=0)


def cristal(coll, nombre, centro, largo, ancho, material, rot=(0.0, 0.0, 0.0)):
    o = clay.lathe(nombre, [(0.0, 0.0), (ancho, 0.0), (ancho * 0.62, largo * 0.69), (0.0, largo)], coll, material, segments=5, subsurf=0)
    return girar(en(o, centro), *rot)


def hoja(coll, nombre, centro, tam, material, giro=0.0):
    return bola(coll, nombre, centro, (tam * 0.24, tam * 0.5, tam * 0.08), material, n=3, rot=(0.35, 0, giro))


# --------------------------------------------------------------------------- el cuerpo


def m_refe_cuerpo(coll):
    rng = np.random.default_rng(4)
    caja(coll, 'piso', (3.88, 0.17, 3.9), (0, 0.075, 0), PIEDRA(), p=5)
    # Paredes con tablas: cada pared es un bloque y encima las juntas de las tablas (salen un pelito)
    muro = MURO()
    caja(coll, 'pared izq', (0.16, 1.9, 3.55), (-1.72, 1.08, 0), muro, p=5)
    caja(coll, 'pared der', (0.16, 1.9, 3.55), (1.72, 1.08, 0), muro, p=5)
    caja(coll, 'pared fondo', (3.45, 1.9, 0.16), (0, 1.08, -1.72), muro, p=5)
    for s in (-1, 1):
        caja(coll, f'frente {s}', (1.07, 1.9, 0.16), (s * 1.16, 1.08, 1.72), muro, p=5)
        caja(coll, f'jamba {s}', (0.14, 2.0, 0.2), (s * 0.64, 1.12, 1.77), MADERA(), p=5)
    madera = MADERA()
    for i in range(7):
        y = 0.3 + i * 0.25
        for s in (-1, 1):
            caja(coll, f'junta lado {i}{s}', (0.03, 0.03, 3.38), (s * 1.812, y, 0), madera, p=6, sub=0)
            caja(coll, f'junta frente {i}{s}', (1.04, 0.03, 0.03), (s * 1.16, y, 1.811), madera, p=6, sub=0)
        caja(coll, f'junta fondo {i}', (3.38, 0.03, 0.03), (0, y, -1.811), madera, p=6, sub=0)
    caja(coll, 'dintel', (1.41, 0.17, 0.23), (0, 2.0, 1.77), MADERA(), p=5)
    caja(coll, 'umbral', (1.4, 0.13, 0.66), (0, 0.12, 1.94), OSCURO(), p=5)
    for x in (-1.76, 1.76):
        for z in (-1.76, 1.76):
            caja(coll, f'poste {x}{z}', (0.19, 2.09, 0.19), (x, 1.09, z), MADERA(), p=5)
    # Los dos frontones (triángulo con su borde)
    for z in (-1.75, 1.75):
        pts = [(-1.73, 1.99), (1.73, 1.99), (0.0, 2.91)]
        me = bpy.data.meshes.new('fronton')
        verts = []
        for (x, y) in pts:
            verts.append(C(x, y, z - 0.05))
        for (x, y) in pts:
            verts.append(C(x, y, z + 0.05))
        me.from_pydata(verts, [], [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
        import bmesh
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
        o = bpy.data.objects.new(f'fronton {z}', me)
        clay.link(o, coll)
        o.data.materials.append(muro)
    # Ventanas con su marco, el vidrio, la cruz y la jardinera con matas
    for s in (-1, 1):
        x = s * 1.18
        caja(coll, f'marco ventana {s}', (0.72, 0.69, 0.09), (x, 1.33, 1.83), OSCURO(), p=5)
        caja(coll, f'vidrio {s}', (0.56, 0.52, 0.06), (x, 1.33, 1.875), VIDRIO(), p=6, sub=0)
        bola(coll, f'reflejo {s}', (x - 0.13, 1.45, 1.91), (0.07, 0.1, 0.01), BRILLO(), n=2, sub=0, rot=(0, 0, -0.5))
        caja(coll, f'cruz v {s}', (0.05, 0.57, 0.05), (x, 1.33, 1.92), BORDE(), p=6, sub=0)
        caja(coll, f'cruz h {s}', (0.62, 0.05, 0.05), (x, 1.33, 1.92), BORDE(), p=6, sub=0)
        caja(coll, f'repisa {s}', (0.8, 0.05, 0.12), (x, 0.99, 1.88), BORDE(), p=6)
        caja(coll, f'jardinera {s}', (0.85, 0.22, 0.3), (x, 0.87, 1.98), MADERA(), p=5)
        caja(coll, f'tierra jardinera {s}', (0.76, 0.045, 0.23), (x, 0.99, 1.98), OSCURO(), p=6, sub=0)
        for i in range(5):
            hoja(coll, f'mata {s}{i}', (x + (i - 2) * 0.15, 1.1, 1.98 + (i % 2) * 0.04), 0.26, HOJA() if i % 2 else HOJA_OSC(), (i - 2) * 0.35)
        for i in range(2):
            bola(coll, f'florcita {s}{i}', (x + (i * 2 - 1) * 0.12, 1.2, 2.04), (0.035, 0.035, 0.02), mat('ref flor', '#F3B6C3', 0.7), n=2, sub=0)
    # Cimiento de piedras redondas
    k = 0
    for (x0, z0, dx, dz, n) in [(-1.8, -1.84, 1, 0, 10), (-1.84, -1.8, 0, 1, 10), (1.84, -1.8, 0, 1, 10), (-1.8, 1.84, 1, 0, 3), (1.8, 1.84, -1, 0, 3)]:
        for i in range(n):
            t = i * 0.37
            r = 0.1 + (i % 3) * 0.015
            bola(coll, f'canto {k}', (x0 + dx * t, 0.12, z0 + dz * t), (r, 0.06 + rng.uniform(0, 0.015), r * 0.8), CANTO[i % 3](), n=3, sub=1)
            k += 1
    # Farol junto a la puerta
    caja(coll, 'brazo farol', (0.05, 0.05, 0.16), (0.82, 1.78, 1.88), HIERRO(), p=6, sub=0)
    caja(coll, 'farol', (0.16, 0.2, 0.16), (0.82, 1.55, 1.98), HIERRO(), p=5)
    caja(coll, 'luz farol', (0.12, 0.15, 0.17), (0.82, 1.55, 1.98), luz('ref luz', '#FFB347', 3.0), p=6, sub=0)
    caja(coll, 'tapa farol', (0.2, 0.04, 0.2), (0.82, 1.67, 1.98), HIERRO(), p=6)
    # Heno y costal en la esquina de enfrente
    for i, (x, y, z, r) in enumerate([(-1.55, 0.27, 2.25, 0.2), (-1.05, 0.27, 2.3, -0.1), (-1.32, 0.7, 2.27, 0.05)]):
        caja(coll, f'paca {i}', (0.52, 0.4, 0.36), (x, y, z), PAJA(), p=4, rot=(0, r, 0))
        for cuerda in (-0.12, 0.12):
            caja(coll, f'cuerda paca {i}{cuerda}', (0.035, 0.41, 0.37), (x + cuerda * math.cos(r), y, z - cuerda * math.sin(r)), PAJA_OSC(), p=6, sub=0, rot=(0, r, 0))
        for j in range(3):
            palo(coll, f'brizna {i}{j}', (x - 0.2 + j * 0.2, y + 0.2, z + 0.1), (x - 0.24 + j * 0.2, y + 0.3, z + 0.16), 0.008, PAJA_OSC())
    bola(coll, 'costal', (1.5, 0.3, 2.25), (0.22, 0.3, 0.18), COSTAL(), n=5)
    bola(coll, 'boca costal', (1.5, 0.6, 2.25), (0.13, 0.08, 0.12), COSTAL(), n=3)
    palo(coll, 'amarre costal', (1.38, 0.55, 2.25), (1.62, 0.55, 2.25), 0.02, PAJA_OSC())
    for j in range(4):
        bola(coll, f'grano {j}', (1.35 + j * 0.09, 0.03, 2.47 + (j % 2) * 0.05), (0.02, 0.015, 0.02), mat('ref grano', '#F2C94C', 0.6), n=2, sub=0)


def m_refe_techo(coll):
    techo = TECHO()
    for s in (-1, 1):
        caja(coll, f'faldon {s}', (2.16, 0.14, 4.1), (s * 0.91, 2.48, 0), techo, p=4, rot=(0, 0, -s * 0.478))
        for row in range(4):
            for col in range(9):
                x = s * (0.26 + row * 0.47)
                y = 3.07 - abs(x) * 0.518
                caja(coll, f'teja {s}{row}{col}', (0.51, 0.085, 0.45), (x, y, -1.8 + col * 0.45 + (row % 2) * 0.07), techo, p=3, rot=(0, 0, -s * 0.478))
        palo(coll, f'alero {s}', (0, 2.99, 2.08), (s * 1.93, 2.0, 2.08), 0.065, BORDE())
        palo(coll, f'alero atras {s}', (0, 2.99, -2.08), (s * 1.93, 2.0, -2.08), 0.065, BORDE())
    palo(coll, 'caballete', (0, 2.99, -2.06), (0, 2.99, 2.1), 0.085, BORDE())
    for z in (-2.08, 2.1):
        bola(coll, f'remate {z}', (0, 3.0, z), (0.1, 0.1, 0.1), BORDE(), n=3)


def m_refe_veleta_gallo(coll):
    hierro = HIERRO()
    palo(coll, 'mastil', (0, 3.0, -1.2), (0, 3.75, -1.2), 0.03, hierro)
    palo(coll, 'cruz x', (-0.32, 3.55, -1.2), (0.32, 3.55, -1.2), 0.018, hierro)
    palo(coll, 'cruz z', (0, 3.55, -1.52), (0, 3.55, -0.88), 0.018, hierro)
    bola(coll, 'gallito cuerpo', (0, 3.84, -1.2), (0.16, 0.1, 0.04), hierro, n=3)
    bola(coll, 'gallito cabeza', (0.13, 3.94, -1.2), (0.06, 0.07, 0.035), hierro, n=3)
    bola(coll, 'gallito cresta', (0.13, 4.02, -1.2), (0.04, 0.03, 0.02), mat('ref cresta', '#C65B45', 0.5), n=2, sub=0)
    for k in range(3):
        bola(coll, f'cola {k}', (-0.15 - k * 0.03, 3.9 + k * 0.04, -1.2), (0.06, 0.03, 0.02), hierro, n=2, sub=0, rot=(0, 0, 0.6 + k * 0.2))


def m_refe_veleta_flecha(coll):
    hierro = HIERRO()
    palo(coll, 'mastil', (0, 3.0, -1.2), (0, 3.75, -1.2), 0.03, hierro)
    palo(coll, 'cruz x', (-0.32, 3.55, -1.2), (0.32, 3.55, -1.2), 0.018, hierro)
    palo(coll, 'cruz z', (0, 3.55, -1.52), (0, 3.55, -0.88), 0.018, hierro)
    palo(coll, 'flecha', (-0.26, 3.75, -1.2), (0.2, 3.75, -1.2), 0.018, hierro)
    o = clay.lathe('punta', [(0.0, 0.0), (0.06, 0.0), (0.0, 0.18)], coll, hierro, segments=4, subsurf=0)
    en(o, (0.2, 3.75, -1.2))
    o.rotation_euler = (0, math.pi / 2, 0)
    caja(coll, 'pluma', (0.12, 0.12, 0.015), (-0.28, 3.75, -1.2), hierro, p=6, sub=0, rot=(0, 0, 0.785))
    bola(coll, 'bolita', (0, 3.78, -1.2), (0.035, 0.035, 0.035), METAL(), n=2, sub=0)


def m_refe_nidales(coll):
    """Los nidales con techito y paja asomando (gallinas y patos), y la puertica con su rampa."""
    caja(coll, 'caja nidales', (0.42, 0.55, 1.6), (1.98, 0.95, -0.3), MADERA(), p=5)
    caja(coll, 'techo nidales', (0.56, 0.08, 1.7), (2.02, 1.27, -0.3), TECHO(), p=5, rot=(0, 0, -0.35))
    for i in range(3):
        caja(coll, f'hueco {i}', (0.04, 0.36, 0.42), (2.2, 0.95, -0.82 + i * 0.52), OSCURO(), p=6, sub=0)
        bola(coll, f'paja nido {i}', (2.21, 0.82, -0.82 + i * 0.52), (0.05, 0.05, 0.18), PAJA(), n=3, shaper=lambda v: v * (1 + 0.15 * np.sin(v[:, 1] * 40))[:, None])
        if i == 1:
            bola(coll, 'huevito', (2.23, 0.9, -0.3), (0.05, 0.065, 0.05), mat('ref huevo', '#F4E9D2', 0.5), n=3)
    caja(coll, 'puertica', (0.08, 0.4, 0.36), (-1.83, 0.62, 0.6), OSCURO(), p=5)
    caja(coll, 'rampa', (0.9, 0.05, 0.34), (-2.12, 0.3, 0.6), MADERA(), p=5, rot=(0, 0, 0.55))
    for k in range(4):
        caja(coll, f'travesano {k}', (0.04, 0.04, 0.34), (-2.42 + k * 0.2, 0.15 + k * 0.11, 0.6), OSCURO(), p=6, sub=0, rot=(0, 0, 0.55))


def m_refe_percha(coll):
    caja(coll, 'percha', (2.3, 0.1, 0.18), (0, 1.16, 2.06), MADERA(), p=5)
    for s in (-1, 1):
        caja(coll, f'mensula {s}', (0.08, 0.25, 0.08), (s * 1.0, 1.04, 2.0), MADERA(), p=5, rot=(0.5, 0, 0))
    for k in range(3):
        bola(coll, f'pluma percha {k}', (-0.6 + k * 0.5, 1.13, 2.17), (0.03, 0.09, 0.01), mat('ref pluma', '#E9D3A0', 0.7), n=2, sub=0, rot=(0, 0, 0.6 - k * 0.5))


def m_refe_cristales_lado(coll):
    """Cristales al pie de las paredes (volcánico, mineral y polar: el juego les pone el color del clima)."""
    for s in (-1, 1):
        for i in range(3):
            cristal(coll, f'cristal {s}{i}', (s * 1.78, 0.12, -1.5 + i * 1.48), 0.26 + (i % 2) * 0.13, 0.13, METAL(), rot=(0, i, -s * 0.3))
            cristal(coll, f'cristalito {s}{i}', (s * 1.84, 0.1, -1.3 + i * 1.48), 0.14, 0.07, METAL(), rot=(0.3, i, -s * 0.6))


def m_refe_cristales_techo(coll):
    for i in range(5):
        cristal(coll, f'cristal techo {i}', (0, 2.98, -1.6 + i * 0.72), 0.18 + (i % 2) * 0.07, 0.1, METAL(), rot=(0, i * 0.7, 0))


def m_refe_enredadera(coll):
    for s in (-1, 1):
        palo(coll, f'tallo {s}', (s * 1.65, 0.2, 1.87), (s * 1.62, 1.9, 1.9), 0.015, HOJA_OSC())
        for i in range(7):
            hoja(coll, f'hoja enredadera {s}{i}', (s * (1.6 + (i % 2) * 0.1), 0.38 + i * 0.25, 1.9), 0.29, HOJA() if i % 2 else HOJA_OSC(), s * (0.5 + (i % 2) * 0.3))
        for i in range(2):
            bola(coll, f'flor enredadera {s}{i}', (s * 1.66, 0.8 + i * 0.6, 1.95), (0.04, 0.04, 0.02), mat('ref flor azul', '#A9C7EE', 0.7), n=2, sub=0)


def m_refe_halo(coll):
    o = clay.lathe('halo', [(0.21, 0.0), (0.24, -0.025), (0.27, 0.0), (0.24, 0.025), (0.21, 0.0)], coll, METAL(), segments=28, subsurf=1, cap_bottom=False,
                   cap_top=False)
    en(o, (0, 3.26, 0.05))
    for i in range(5):
        bola(coll, f'nube {i}', ((i - 2) * 0.22, 3.0 + math.sin(i) * 0.015, 0.05), (0.18, 0.08, 0.12), BORDE(), n=4)


# --------------------------------------------------------------------------- las caritas del frontón


def _placa(coll):
    bola(coll, 'placa', (0, 2.41, 1.9), (0.27, 0.2, 0.04), BORDE(), n=4)


def _ojos(coll, y, z, sep, r=0.022):
    for s in (-1, 1):
        bola(coll, f'ojo {s}', (s * sep, y, z), (r, r * 1.2, r * 0.5), OJO(), n=2, sub=0)
        bola(coll, f'brillo {s}', (s * sep - r * 0.3, y + r * 0.4, z + r * 0.4), (r * 0.35, r * 0.35, r * 0.2), BRILLO(), n=2, sub=0)


def _cachetes(coll, y, z, sep):
    for s in (-1, 1):
        bola(coll, f'cachete {s}', (s * sep, y, z), (0.022, 0.014, 0.008), CACHETE(), n=2, sub=0)


def _cabeza(coll, color, r=(0.15, 0.13, 0.06), y=2.41):
    bola(coll, 'cabeza', (0, y, 1.95), r, tela('ref cara ' + color, color), n=5)
    return 1.95 + r[2]


def m_refe_emb_gallina(coll):
    _placa(coll)
    z = _cabeza(coll, '#FBF7EC')
    for i in range(3):
        bola(coll, f'cresta {i}', ((i - 1) * 0.045, 2.55 + (i % 2) * 0.02, 1.97), (0.035, 0.045, 0.03), tela('ref cresta tela', '#D9473C'), n=3)
    o = clay.lathe('pico', [(0.0, 0.0), (0.03, 0.0), (0.0, 0.06)], coll, mat('ref pico', '#F2B33D', 0.5), segments=8, subsurf=0)
    en(o, (0, 2.38, z - 0.01))
    o.rotation_euler = (math.pi / 2, 0, 0)
    bola(coll, 'barbilla', (0, 2.32, z - 0.02), (0.022, 0.03, 0.015), tela('ref cresta tela', '#D9473C'), n=2, sub=0)
    _ojos(coll, 2.43, z - 0.005, 0.06)
    _cachetes(coll, 2.38, z - 0.01, 0.1)


def m_refe_emb_pato(coll):
    _placa(coll)
    z = _cabeza(coll, '#F4E9C9')
    bola(coll, 'pico pato', (0, 2.36, z + 0.005), (0.07, 0.025, 0.04), mat('ref pico pato', '#F2A23D', 0.5), n=3)
    bola(coll, 'copete', (0, 2.55, 1.96), (0.03, 0.05, 0.02), tela('ref copete', '#F4E9C9'), n=2, rot=(0, 0, 0.4))
    _ojos(coll, 2.44, z - 0.01, 0.065)
    _cachetes(coll, 2.39, z - 0.015, 0.1)


def m_refe_emb_vaca(coll):
    _placa(coll)
    z = _cabeza(coll, '#FBF7EC')
    bola(coll, 'mancha', (0.07, 2.47, z - 0.01), (0.05, 0.04, 0.01), tela('ref mancha', '#3B3532'), n=2, sub=0)
    bola(coll, 'hocico', (0, 2.34, z), (0.09, 0.05, 0.03), tela('ref hocico', '#F3B6C0'), n=3)
    for s in (-1, 1):
        bola(coll, f'fosa {s}', (s * 0.03, 2.34, z + 0.03), (0.01, 0.012, 0.005), OJO(), n=2, sub=0)
        o = clay.lathe(f'cuerno {s}', [(0.0, 0.0), (0.022, 0.0), (0.0, 0.08)], coll, mat('ref cuerno', '#EADBB8', 0.5), segments=8, subsurf=0)
        en(o, (s * 0.12, 2.52, 1.95))
        o.rotation_euler = (0, s * 0.7, 0)
        bola(coll, f'oreja {s}', (s * 0.17, 2.46, 1.95), (0.05, 0.025, 0.015), tela('ref cara #FBF7EC', '#FBF7EC'), n=2, rot=(0, 0, s * 0.3))
    _ojos(coll, 2.44, z - 0.015, 0.065)


def m_refe_emb_cerdito(coll):
    _placa(coll)
    z = _cabeza(coll, '#F2B7B5')
    bola(coll, 'trompa', (0, 2.37, z + 0.005), (0.055, 0.04, 0.03), tela('ref trompa', '#E99A9A'), n=3)
    for s in (-1, 1):
        bola(coll, f'hueco {s}', (s * 0.018, 2.37, z + 0.035), (0.01, 0.014, 0.005), mat('ref hueco', '#8C4F55', 0.8), n=2, sub=0)
        bola(coll, f'oreja {s}', (s * 0.11, 2.53, 1.96), (0.04, 0.04, 0.015), tela('ref cara #F2B7B5', '#F2B7B5'), n=2, rot=(0, 0, s * -0.5))
    _ojos(coll, 2.45, z - 0.012, 0.06)
    _cachetes(coll, 2.4, z - 0.01, 0.1)


def m_refe_emb_oveja(coll):
    _placa(coll)
    for i in range(7):
        a = i * 2 * math.pi / 7
        bola(coll, f'lana {i}', (math.sin(a) * 0.13, 2.43 + math.cos(a) * 0.1, 1.95), (0.06, 0.06, 0.04), tela('ref lana', '#FBF7F0'), n=3)
    z = 1.95 + 0.05
    bola(coll, 'carita', (0, 2.39, z - 0.02), (0.075, 0.085, 0.04), tela('ref cara oveja', '#5A4E48'), n=4)
    _ojos(coll, 2.41, z + 0.015, 0.035, 0.018)
    _cachetes(coll, 2.37, z + 0.012, 0.05)


def m_refe_emb_cabra(coll):
    _placa(coll)
    z = _cabeza(coll, '#E6D4B4', (0.13, 0.14, 0.06))
    for s in (-1, 1):
        palo(coll, f'cuerno {s}', (s * 0.05, 2.53, 1.95), (s * 0.12, 2.62, 1.92), 0.016, mat('ref cuerno cabra', '#9C8A6E', 0.6))
        bola(coll, f'oreja {s}', (s * 0.15, 2.44, 1.95), (0.05, 0.02, 0.015), tela('ref cara #E6D4B4', '#E6D4B4'), n=2, rot=(0, 0, s * 0.2))
    bola(coll, 'barba', (0, 2.26, z - 0.02), (0.025, 0.05, 0.015), tela('ref barba', '#C9B798'), n=2)
    bola(coll, 'hocico cabra', (0, 2.35, z - 0.005), (0.05, 0.035, 0.02), tela('ref hocico cabra', '#D8C3A1'), n=2)
    _ojos(coll, 2.44, z - 0.012, 0.055)


def m_refe_emb_conejo(coll):
    _placa(coll)
    z = _cabeza(coll, '#F3EDE4', (0.13, 0.12, 0.06), 2.38)
    for s in (-1, 1):
        bola(coll, f'oreja {s}', (s * 0.05, 2.56, 1.95), (0.035, 0.11, 0.02), tela('ref cara #F3EDE4', '#F3EDE4'), n=3, rot=(0, 0, -s * 0.25))
        bola(coll, f'oreja dentro {s}', (s * 0.052, 2.56, 1.97), (0.018, 0.08, 0.008), CACHETE(), n=2, sub=0, rot=(0, 0, -s * 0.25))
    bola(coll, 'naricita', (0, 2.36, z + 0.005), (0.016, 0.012, 0.008), CACHETE(), n=2, sub=0)
    _ojos(coll, 2.4, z - 0.012, 0.055)
    _cachetes(coll, 2.35, z - 0.012, 0.09)


def m_refe_emb_caballo(coll):
    _placa(coll)
    bola(coll, 'cara larga', (0, 2.4, 1.95), (0.1, 0.16, 0.06), tela('ref caballo', '#9A6B4C'), n=5)
    bola(coll, 'hocico caballo', (0, 2.29, 1.99), (0.075, 0.05, 0.035), tela('ref hocico caballo', '#C99B7A'), n=3)
    for s in (-1, 1):
        bola(coll, f'oreja {s}', (s * 0.07, 2.57, 1.95), (0.025, 0.05, 0.015), tela('ref caballo', '#9A6B4C'), n=2, rot=(0, 0, -s * 0.3))
    for k in range(4):
        bola(coll, f'crin {k}', (0.02 - k * 0.012, 2.55 - k * 0.04, 1.99), (0.03, 0.035, 0.02), tela('ref crin', '#4E3A2E'), n=2)
    _ojos(coll, 2.43, 2.005, 0.05)


def m_refe_emb_avestruz(coll):
    _placa(coll)
    palo(coll, 'cuello', (0, 2.28, 1.95), (0, 2.45, 1.96), 0.03, tela('ref cuello avestruz', '#E9C9B5'))
    bola(coll, 'cabecita', (0, 2.49, 1.97), (0.07, 0.06, 0.05), tela('ref cuello avestruz', '#E9C9B5'), n=4)
    bola(coll, 'plumas', (0, 2.27, 1.95), (0.14, 0.06, 0.04), tela('ref plumas avestruz', '#4B4448'), n=4)
    bola(coll, 'pico avestruz', (0, 2.47, 2.02), (0.035, 0.015, 0.025), mat('ref pico avestruz', '#E8A86A', 0.5), n=2)
    _ojos(coll, 2.5, 2.015, 0.03, 0.017)


def m_refe_emb_dinosaurio(coll):
    _placa(coll)
    z = _cabeza(coll, '#8EBF7A', (0.15, 0.12, 0.06))
    for k in range(3):
        cristal(coll, f'cresta {k}', ((k - 1) * 0.07, 2.52 - abs(k - 1) * 0.02, 1.94), 0.07, 0.025, tela('ref cresta dino', '#E9A85A'), rot=(0, 0, -(k - 1) * 0.3))
    boca_pts = [C(-0.07, 2.37, z), C(0, 2.35, z + 0.01), C(0.07, 2.37, z)]
    clay.sweep('sonrisa', boca_pts, 0.008, coll=coll, material=OJO(), segments=6, samples=3, subsurf=0)
    _ojos(coll, 2.44, z - 0.012, 0.065)
    _cachetes(coll, 2.39, z - 0.012, 0.1)


def m_refe_emb_unicornio(coll):
    _placa(coll)
    z = _cabeza(coll, '#FBF7F4', (0.13, 0.13, 0.06))
    o = clay.lathe('cuerno', [(0.0, 0.0), (0.025, 0.0), (0.0, 0.13)], coll, mat('ref cuerno oro', '#F2C75A', 0.3, metallic=0.6), segments=10, subsurf=0)
    en(o, (0, 2.52, 1.96))
    for k in range(4):
        bola(coll, f'melena {k}', (-0.11 + k * 0.03, 2.52 - k * 0.04, 1.97), (0.035, 0.04, 0.02), tela('ref melena', ['#F3B6C3', '#C9B6EA', '#A9C7EE', '#F3B6C3'][k]), n=2)
    _ojos(coll, 2.42, z - 0.012, 0.055)
    _cachetes(coll, 2.37, z - 0.012, 0.09)


def m_refe_emb_dragon(coll):
    _placa(coll)
    z = _cabeza(coll, '#A68BC4', (0.14, 0.12, 0.06))
    for s in (-1, 1):
        cristal(coll, f'cuerno {s}', (s * 0.08, 2.5, 1.95), 0.1, 0.02, mat('ref cuerno dragon', '#F2E3B7', 0.5), rot=(0, 0, -s * 0.4))
        bola(coll, f'fosa {s}', (s * 0.025, 2.37, z + 0.002), (0.01, 0.008, 0.005), OJO(), n=2, sub=0)
    _ojos(coll, 2.44, z - 0.012, 0.06)
    _cachetes(coll, 2.39, z - 0.012, 0.1)


def m_refe_emb_grifo(coll):
    _placa(coll)
    z = _cabeza(coll, '#F0E3C4', (0.13, 0.13, 0.06))
    o = clay.lathe('pico grifo', [(0.0, 0.0), (0.035, 0.0), (0.0, 0.08)], coll, mat('ref pico grifo', '#E8B04A', 0.4), segments=8, subsurf=0)
    en(o, (0, 2.38, z - 0.01))
    o.rotation_euler = (math.pi / 2 + 0.4, 0, 0)
    for s in (-1, 1):
        bola(coll, f'penacho {s}', (s * 0.1, 2.53, 1.95), (0.03, 0.06, 0.015), tela('ref penacho', '#C0954F'), n=2, rot=(0, 0, -s * 0.5))
    _ojos(coll, 2.44, z - 0.012, 0.06)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Refugios granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_refugios.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
