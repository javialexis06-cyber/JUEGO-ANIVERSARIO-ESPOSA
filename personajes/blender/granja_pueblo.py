"""Nuestro Hogar · granja: utilería del Pueblo del Sol (lo que estaba hecho con figuras sueltas en pueblo.ts).

Cada pieza conserva las medidas de la versión de arcilla para no cambiar alturas, huellas ni caminos:

  fuente          la fuente de la plaza (repisa de piedra en z=0,46 entre r 1,97 y 2,23; agua de abajo a 0,645 con
                  r 1,78; tacita de arriba con agua a 1,612 y r 0,84): el agua animada la sigue poniendo el juego
  banco           banco de 2,1 m (asiento a 0,63, respaldo hacia +y)
  farol           farol de 2,9 m con su vidrio que alumbra
  jardinera       módulo de 1 × 1 m de tierra con flores; jardinera_borde: 1 m de bordillo de piedra (a lo largo de x)
  valla_tramo     1,5 m de valla (poste en x=0, travesaños hasta x=1,5); valla_poste: el poste suelto del final
  arbol_a/arbol_b árboles de 3,5 m (el juego los escala a la altura de cada uno)
  rueda_molino    rueda de 1,68 m de radio que gira sobre el eje x (centro en el origen)
  vaca, gallina   los animales del corral
  bebedero, rollo_heno, piedra_borde, letrero_entrada

Medidas del juego, en el origen, base en z=0, frente hacia -y (en three.js mira a la cámara). Un solo GLB
(granja_pueblo.glb) con un vacío «m_<clave>» por pieza, como granja_muebles.py.

Uso: blender -b -P granja_pueblo.py -- <carpeta_salida> [claves]
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
from granja_muebles import CHOCO, MAD, OSC, bola, caja, cilindro, mat, metal, piedra, tubo, vidrio  # noqa: E402
from granja_festivales import calabaza, flor, hoja_plana  # noqa: E402

RNG = np.random.default_rng(23)
PIEDRA = lambda: piedra('pueblo', '#ADA793')  # noqa: E731
PIEDRA_CLARA = lambda: piedra('pueblo clara', '#CFC5AB')  # noqa: E731
PIEDRA_CREMA = lambda: piedra('pueblo crema', '#E6D8B8')  # noqa: E731
HIERRO = lambda: metal('hierro', '#3E4A57')  # noqa: E731
HOJA = lambda: tela('copa', '#7FA65A')  # noqa: E731
HOJA_CLARA = lambda: tela('copa clara', '#A9C46E')  # noqa: E731
HOJA_OSC = lambda: tela('copa oscura', '#5E8A47')  # noqa: E731
TIERRA = lambda: mat('tierra', '#7A5A3E', 0.95)  # noqa: E731
PAJA = lambda: mat('paja', '#E2C26A', 0.9, noise=dict(scale=60, strength=0.6, distance=0.006))  # noqa: E731
FLORES = ('#E58FA6', '#F2C94C', '#C9A8E0', '#F28C45', '#F6F1E6', '#8EC5F0')


# ---------------------------------------------------------------- fuente

def m_fuente(coll):
    """Fuente del Pueblo del Sol: pila de piedra con repisa, columna con anillos, tacita y un sol con cara arriba."""
    perfil = [(0.0, 0.13), (2.17, 0.13), (2.25, 0.2), (2.26, 0.4), (2.21, 0.46), (1.99, 0.46), (1.97, 0.5), (1.97, 0.66), (1.93, 0.71),
              (1.85, 0.71), (1.81, 0.67), (1.79, 0.36), (0.0, 0.36)]
    clay.lathe('pila', perfil, coll, PIEDRA_CREMA(), segments=56, subsurf=1)
    # Lajas redondeadas alrededor de la pila (se ve hecha a mano)
    for k in range(28):
        a = k * 2 * math.pi / 28 + (0.06 if k % 2 else 0)
        o = caja(coll, f'laja {k}', (0, 0, 0), (0.24, 0.05, 0.13), (PIEDRA, PIEDRA_CLARA)[k % 2](), p=4, sub=1)
        o.location = (math.cos(a) * 2.25, math.sin(a) * 2.25, 0.29)
        o.rotation_euler = (0, 0, a + math.pi / 2)
    # Musgo y matitas al pie
    for k in range(18):
        a = RNG.uniform(0, 2 * math.pi)
        bola(coll, f'musgo {k}', (math.cos(a) * 2.3, math.sin(a) * 2.3, 0.16), (0.12, 0.1, 0.06), (HOJA, HOJA_OSC)[k % 2](), n=3)
    # Columna con anillos
    clay.lathe('columna', [(0.0, 0.36), (0.52, 0.36), (0.5, 0.48), (0.42, 0.56), (0.4, 1.2), (0.46, 1.3), (0.34, 1.42), (0.0, 1.42)], coll,
               PIEDRA_CREMA(), segments=32, subsurf=1)
    for z in (0.62, 0.92, 1.18):
        clay.lathe(f'anillo {z}', [(0.4, -0.035), (0.45, 0.0), (0.4, 0.035)], coll, PIEDRA(), segments=32, subsurf=0, cap_bottom=False,
                   cap_top=False).location = (0, 0, z)
    # Tacita de arriba
    clay.lathe('tacita', [(0.0, 1.4), (0.3, 1.4), (0.7, 1.46), (0.95, 1.56), (1.0, 1.64), (0.94, 1.67), (0.88, 1.64), (0.86, 1.58), (0.0, 1.58)],
               coll, PIEDRA_CREMA(), segments=40, subsurf=1)
    for k in range(8):
        a = k * math.pi / 4
        bola(coll, f'gota tacita {k}', (math.cos(a) * 0.99, math.sin(a) * 0.99, 1.53), (0.07, 0.07, 0.09), PIEDRA_CREMA(), n=3)
    clay.lathe('columna alta', [(0.0, 1.58), (0.27, 1.58), (0.22, 1.7), (0.2, 2.05), (0.26, 2.12), (0.0, 2.14)], coll, PIEDRA_CREMA(),
               segments=24, subsurf=1)
    # El sol del pueblo, con su cara
    sol = laca('sol fuente', '#F2C14E', 0.35)
    bola(coll, 'sol', (0, 0, 2.42), (0.3, 0.22, 0.3), sol, n=5)
    for k in range(12):
        a = k * 2 * math.pi / 12
        o = clay.lathe(f'rayo sol {k}', [(0.07, 0.0), (0.0, 0.17)], coll, laca('rayo fuente', '#E8892F', 0.4), segments=8, subsurf=0)
        o.location = (math.cos(a) * 0.33, 0, 2.42 + math.sin(a) * 0.33)
        o.rotation_euler = (0, math.pi / 2 - a, 0)
    for s in (-1, 1):
        bola(coll, f'sol ojo {s}', (s * 0.1, -0.2, 2.47), (0.035, 0.02, 0.045), mat('ojo', '#3A2A20', 0.4), n=3)
        bola(coll, f'sol cachete {s}', (s * 0.17, -0.18, 2.37), (0.05, 0.015, 0.035), tela('cachete', '#F4A7B9'), n=3)
    tubo(coll, 'sol sonrisa', [(-0.09, -0.215, 2.36), (0, -0.225, 2.32), (0.09, -0.215, 2.36)], 0.014, mat('ojo', '#3A2A20', 0.4), seg=4)
    # Ranitas de fieltro en el borde, mirando el agua
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        x, y = math.cos(a) * 1.89, math.sin(a) * 1.89
        rana = tela('rana', '#7FB069')
        bola(coll, f'rana cuerpo {k}', (x, y, 0.79), (0.1, 0.1, 0.08), rana, n=4)
        for s in (-1, 1):
            ox, oy = -math.sin(a) * s * 0.055, math.cos(a) * s * 0.055
            bola(coll, f'rana ojo {k}{s}', (x + ox - math.cos(a) * 0.04, y + oy - math.sin(a) * 0.04, 0.88), 0.035, rana, n=3)
            bola(coll, f'rana pupila {k}{s}', (x + ox - math.cos(a) * 0.07, y + oy - math.sin(a) * 0.07, 0.89), 0.016, mat('ojo', '#3A2A20', 0.4), n=2)
        bola(coll, f'rana panza {k}', (x - math.cos(a) * 0.06, y - math.sin(a) * 0.06, 0.76), (0.06, 0.06, 0.04), tela('panza rana', '#D8E8A8'), n=3)


# ---------------------------------------------------------------- banco y farol

def m_banco(coll):
    for k in range(4):
        caja(coll, f'tabla asiento {k}', (0, -0.22 + k * 0.15, 0.64), (1.05, 0.065, 0.035), MAD(), p=8)
    for k in range(3):
        o = caja(coll, f'tabla respaldo {k}', (0, 0, 0), (1.05, 0.03, 0.065), MAD(), p=8)
        o.location = (0, 0.3, 0.86 + k * 0.16)
        o.rotation_euler = (-0.15, 0, 0)
    for s in (-1, 1):
        x = s * 0.8
        tubo(coll, f'pata del {s}', [(x, -0.26, 0.0), (x, -0.25, 0.3), (x, -0.22, 0.62)], 0.035, HIERRO(), seg=8)
        tubo(coll, f'pata tras {s}', [(x, 0.24, 0.0), (x, 0.27, 0.5), (x, 0.33, 1.18)], 0.035, HIERRO(), seg=8)
        tubo(coll, f'brazo {s}', [(x, 0.3, 0.86), (x, 0.0, 0.84), (x, -0.25, 0.84), (x, -0.3, 0.76), (x, -0.25, 0.68)], 0.03, HIERRO(), seg=8)
        tubo(coll, f'travesaño {s}', [(x, -0.25, 0.6), (x, 0.26, 0.6)], 0.025, HIERRO(), seg=6)
        tubo(coll, f'rulo {s}', [(x, -0.18, 0.25), (x, -0.1, 0.36), (x, 0.0, 0.3), (x, -0.05, 0.22), (x, -0.12, 0.27)], 0.016, HIERRO(), seg=6)
        for y in (-0.25, 0.25):
            cilindro(coll, f'pie {s}{y}', (x, y, 0.0), 0.05, 0.03, HIERRO(), seg=10)
    bola(coll, 'cojín banco', (0.45, -0.02, 0.72), (0.2, 0.18, 0.06), tela('cojín banco', '#E58FA6'), n=4)


def m_farol(coll):
    cilindro(coll, 'farol base', (0, 0, 0), 0.24, 0.12, PIEDRA(), seg=16, r2=0.2, sub=1)
    clay.lathe('farol pie', [(0.0, 0.1), (0.15, 0.1), (0.13, 0.2), (0.09, 0.32), (0.07, 0.36), (0.0, 0.36)], coll, HIERRO(), segments=14, subsurf=1)
    cilindro(coll, 'farol poste', (0, 0, 0.34), 0.06, 1.95, HIERRO(), seg=12, r2=0.05)
    for z in (0.9, 2.1):
        clay.lathe(f'farol anillo {z}', [(0.06, -0.03), (0.085, 0), (0.06, 0.03)], coll, metal('dorado', '#C9A44C'), segments=12, subsurf=0,
                   cap_bottom=False, cap_top=False).location = (0, 0, z)
    clay.lathe('farol copa', [(0.05, 2.28), (0.2, 2.33), (0.22, 2.36), (0.0, 2.37)], coll, HIERRO(), segments=16, subsurf=0)
    # Linterna de cuatro vidrios que alumbran
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        caja(coll, f'farol arista {k}', (math.cos(a) * 0.2, math.sin(a) * 0.2, 2.62), (0.018, 0.018, 0.26), HIERRO(), p=10, sub=0)
    caja(coll, 'farol vidrio', (0, 0, 2.62), (0.16, 0.16, 0.24), luz('farol', '#FFE2A0', 1.4), p=8, sub=0)
    clay.lathe('farol techo', [(0.0, 2.86), (0.3, 2.86), (0.31, 2.9), (0.12, 3.02), (0.04, 3.1), (0.0, 3.12)], coll, HIERRO(), segments=4,
               subsurf=0).rotation_euler = (0, 0, math.pi / 4)
    bola(coll, 'farol remate', (0, 0, 3.16), 0.045, metal('dorado', '#C9A44C'), n=3)
    for k in range(5):
        a = k * 1.3
        bola(coll, f'farol mata {k}', (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.13), (0.08, 0.08, 0.06), (HOJA, HOJA_OSC)[k % 2](), n=3)
    flor(coll, 'farol flor', (0.12, -0.17, 0.2), 0.04, '#E58FA6', centro='#F2C94C')


# ---------------------------------------------------------------- jardineras

def m_jardinera(coll):
    """1 × 1 m de tierra con matas y flores (se repite para llenar cada jardinera)."""
    caja(coll, 'tierra jardinera', (0, 0, 0.14), (0.5, 0.5, 0.04), TIERRA(), p=6, sub=0)
    for k in range(4):
        x, y = -0.25 + (k % 2) * 0.5 + RNG.uniform(-0.06, 0.06), -0.25 + (k // 2) * 0.5 + RNG.uniform(-0.06, 0.06)
        for j in range(4):
            a = j * 1.6 + k
            bola(coll, f'mata {k}{j}', (x + math.cos(a) * 0.09, y + math.sin(a) * 0.09, 0.27), (0.13, 0.13, 0.1), (HOJA, HOJA_CLARA, HOJA_OSC)[(j + k) % 3](),
                 n=3)
        col = FLORES[(k * 2 + int(RNG.integers(0, 6))) % len(FLORES)]
        for j in range(3):
            a = j * 2.1 + k * 0.7
            flor(coll, f'flor {k}{j}', (x + math.cos(a) * 0.09, y + math.sin(a) * 0.09, 0.39 + 0.03 * j), 0.05, col, centro='#F2C94C')


def m_jardinera_borde(coll):
    """1 m de bordillo de piedras redondeadas, a lo largo de x desde x=-0,5 hasta 0,5."""
    for k in range(3):
        o = caja(coll, f'bordillo {k}', (0, 0, 0), (0.16, 0.1, 0.1), (PIEDRA, PIEDRA_CLARA)[k % 2](), p=4, sub=1)
        o.location = (-0.33 + k * 0.33, 0, 0.1)
        o.rotation_euler = (0, 0, RNG.uniform(-0.08, 0.08))


# ---------------------------------------------------------------- vallas

def m_valla_tramo(coll):
    """Poste en x=0 y dos travesaños hasta x=1,5 (el juego los estira para que encajen)."""
    _poste_valla(coll, 0.0)
    for k, z in enumerate((0.42, 0.86)):
        caja(coll, f'travesaño {k}', (0.75, 0, z), (0.76, 0.05, 0.055), MAD(), p=8)
        for j in range(3):
            caja(coll, f'clavo {k}{j}', (0.03 + j * 0.0, -0.06, z), (0.015, 0.01, 0.015), metal('clavo', '#6B6F78'), p=10, sub=0)


def _poste_valla(coll, x):
    caja(coll, f'poste valla {x}', (x, 0, 0.58), (0.09, 0.09, 0.58), MAD(), p=8)
    bola(coll, f'remate valla {x}', (x, 0, 1.19), (0.11, 0.11, 0.08), OSC(), n=4)


def m_valla_poste(coll):
    _poste_valla(coll, 0.0)


# ---------------------------------------------------------------- árboles

def _arbol(coll, variante):
    corteza = madera('corteza', '#79523C')
    clay.lathe('tronco', [(0.0, 0.0), (0.34, 0.0), (0.24, 0.12), (0.2, 0.5), (0.17, 1.9), (0.13, 2.4), (0.0, 2.45)], coll, corteza, segments=12,
               subsurf=1)
    for k in range(4):
        a = k * math.pi / 2 + 0.4
        tubo(coll, f'raíz {k}', [(math.cos(a) * 0.12, math.sin(a) * 0.12, 0.25), (math.cos(a) * 0.32, math.sin(a) * 0.32, 0.05),
                                 (math.cos(a) * 0.42, math.sin(a) * 0.42, 0.0)], [0.09, 0.06, 0.03], corteza, seg=6)
    for k, (a, l) in enumerate(((0.5, 0.6), (2.6, 0.55), (4.3, 0.5))):
        tubo(coll, f'rama {k}', [(0, 0, 1.6 + k * 0.15), (math.cos(a) * l * 0.6, math.sin(a) * l * 0.6, 2.0 + k * 0.1), (math.cos(a) * l, math.sin(a) * l, 2.3)],
             [0.08, 0.05, 0.03], corteza, seg=6)
    if variante == 'a':
        nubes = [(0.0, 0.0, 3.0, 0.95), (0.6, 0.2, 2.65, 0.75), (-0.55, 0.3, 2.7, 0.7), (0.1, -0.55, 2.7, 0.72), (-0.2, 0.55, 3.35, 0.6),
                 (0.35, -0.2, 3.55, 0.55), (-0.45, -0.35, 3.25, 0.6)]
        for k, (x, y, z, r) in enumerate(nubes):
            bola(coll, f'copa {k}', (x, y, z), (r, r * 0.95, r * 0.82), (HOJA, HOJA_CLARA, HOJA_OSC)[k % 3](), n=5)
        for k in range(9):
            a, z = RNG.uniform(0, 2 * math.pi), RNG.uniform(2.6, 3.4)
            r = 0.95 + 0.05 * math.sin(z * 3)
            bola(coll, f'manzana {k}', (math.cos(a) * r, math.sin(a) * r * 0.9 - 0.15, z), 0.07, laca('manzana', '#D9453D', 0.35), n=3)
    else:
        nubes = [(0.0, 0.0, 2.55, 0.85), (0.1, 0.05, 3.15, 0.7), (0.0, 0.0, 3.7, 0.5), (0.5, -0.2, 2.5, 0.55), (-0.5, 0.2, 2.6, 0.55)]
        for k, (x, y, z, r) in enumerate(nubes):
            bola(coll, f'copa {k}', (x, y, z), (r, r, r * 0.8), (HOJA_OSC, HOJA, HOJA_CLARA)[k % 3](), n=5)
        for k in range(12):
            a, z = RNG.uniform(0, 2 * math.pi), RNG.uniform(2.3, 3.6)
            r = 0.8 - (z - 2.3) * 0.25
            flor(coll, f'flor árbol {k}', (math.cos(a) * r, math.sin(a) * r, z), 0.06, ('#F6F1E6', '#F4A7B9')[k % 2], centro='#F2C94C', cara='z')
    for k in range(6):
        a = k * 1.1
        bola(coll, f'pasto pie {k}', (math.cos(a) * 0.38, math.sin(a) * 0.38, 0.05), (0.12, 0.1, 0.07), (HOJA, HOJA_OSC)[k % 2](), n=3)


def m_arbol_a(coll):
    _arbol(coll, 'a')


def m_arbol_b(coll):
    _arbol(coll, 'b')


# ---------------------------------------------------------------- rueda del molino

def m_rueda_molino(coll):
    """Rueda de agua de 1,68 m de radio; gira sobre el eje x (el juego la anima)."""
    for s in (-1, 1):
        o = clay.lathe(f'aro rueda {s}', [(1.56, -0.06), (1.74, -0.06), (1.76, 0.0), (1.74, 0.06), (1.56, 0.06), (1.54, 0.0)], coll, OSC(),
                       segments=40, subsurf=1, cap_bottom=False, cap_top=False)
        o.location = (s * 0.29, 0, 0)
        o.rotation_euler = (0, math.pi / 2, 0)
        for k in range(12):
            a = k * 2 * math.pi / 12
            t = caja(coll, f'rayo rueda {s}{k}', (0, 0, 0), (0.035, 0.035, 0.8), MAD(), p=10, sub=0)
            t.location = (s * 0.29, math.cos(a) * 0.8, math.sin(a) * 0.8)
            t.rotation_euler = (a - math.pi / 2, 0, 0)
    for k in range(12):
        a = k * 2 * math.pi / 12
        p = caja(coll, f'paleta {k}', (0, 0, 0), (0.36, 0.12, 0.3), MAD(), p=8, sub=1)
        p.location = (0, math.cos(a) * 1.62, math.sin(a) * 1.62)
        p.rotation_euler = (a, 0, 0)
    o = clay.lathe('eje rueda', [(0.0, -0.45), (0.19, -0.45), (0.19, 0.45), (0.0, 0.45)], coll, metal('eje', '#536271'), segments=14, subsurf=0)
    o.rotation_euler = (0, math.pi / 2, 0)
    for s in (-1, 1):
        o = clay.lathe(f'cubo rueda {s}', [(0.0, -0.08), (0.3, -0.08), (0.32, 0.0), (0.3, 0.08), (0.0, 0.08)], coll, OSC(), segments=16, subsurf=1)
        o.location = (s * 0.29, 0, 0)
        o.rotation_euler = (0, math.pi / 2, 0)


# ---------------------------------------------------------------- animales del corral

def m_vaca(coll):
    blanca, cafe = tela('vaca', '#F8EAD3'), tela('mancha vaca', '#79523C')
    bola(coll, 'vaca cuerpo', (0, 0, 1.0), (0.62, 0.94, 0.5), blanca, n=6)
    for k, (x, y, z, r) in enumerate(((0.45, 0.2, 1.15, 0.28), (-0.4, -0.35, 1.2, 0.25), (0.2, -0.6, 0.95, 0.22), (-0.3, 0.55, 1.05, 0.2))):
        bola(coll, f'mancha {k}', (x * 1.02, y, z), (r * 0.5, r, r * 0.8), cafe, n=4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bola(coll, f'pata {sx}{sy}', (sx * 0.38, sy * 0.6, 0.35), (0.12, 0.12, 0.34), blanca, n=4)
            bola(coll, f'pezuña {sx}{sy}', (sx * 0.38, sy * 0.6, 0.06), (0.12, 0.12, 0.06), mat('pezuña', '#4B413B', 0.6), n=3)
    bola(coll, 'ubre', (0, 0.3, 0.55), (0.18, 0.16, 0.1), tela('ubre', '#F4B8B0'), n=3)
    bola(coll, 'vaca cabeza', (0, -0.95, 1.38), (0.4, 0.4, 0.42), blanca, n=5)
    bola(coll, 'vaca hocico', (0, -1.25, 1.2), (0.33, 0.2, 0.2), tela('hocico', '#D6A396'), n=4)
    for s in (-1, 1):
        bola(coll, f'vaca fosa {s}', (s * 0.11, -1.43, 1.22), (0.035, 0.02, 0.03), mat('ojo', '#4B413B', 0.5), n=2)
        bola(coll, f'vaca ojo {s}', (s * 0.17, -1.28, 1.5), (0.06, 0.03, 0.075), mat('ojo', '#3A2A20', 0.4), n=3)
        bola(coll, f'vaca brillo {s}', (s * 0.15, -1.31, 1.53), 0.018, luz('brillo ojo', '#FFFFFF', 0.6), n=2, sub=0)
        bola(coll, f'vaca oreja {s}', (s * 0.43, -0.85, 1.62), (0.23, 0.1, 0.12), cafe, n=3)
        o = clay.lathe(f'vaca cacho {s}', [(0.065, 0.0), (0.05, 0.18), (0.0, 0.3)], coll, mat('cacho', '#E8D8B0', 0.5), segments=10, subsurf=1)
        o.location = (s * 0.24, -0.82, 1.75)
        o.rotation_euler = (0, s * 0.35, 0)
        bola(coll, f'vaca cachete {s}', (s * 0.25, -1.22, 1.32), (0.07, 0.02, 0.045), tela('cachete', '#F4A7B9'), n=3)
    tubo(coll, 'vaca cola', [(0, 0.92, 1.25), (0.05, 1.05, 1.0), (0.08, 1.02, 0.7)], 0.03, blanca, seg=6)
    bola(coll, 'vaca borla', (0.08, 1.02, 0.66), (0.06, 0.06, 0.09), cafe, n=3)
    clay.lathe('cencerro', [(0.0, 0.0), (0.08, 0.0), (0.06, 0.13), (0.0, 0.14)], coll, metal('cencerro', '#C9A44C'), segments=10,
               subsurf=0).location = (0, -1.05, 0.95)
    tubo(coll, 'collar', [(-0.25, -0.85, 1.15), (0, -1.08, 1.08), (0.25, -0.85, 1.15)], 0.03, tela('collar', '#C9563F'), seg=5)


def m_gallina(coll):
    crema, roja = tela('gallina', '#F0DABC'), tela('cresta', '#C9563F')
    bola(coll, 'gallina cuerpo', (0, 0.05, 0.46), (0.29, 0.36, 0.31), crema, n=5)
    bola(coll, 'gallina cola', (0, 0.33, 0.66), (0.2, 0.16, 0.2), crema, n=4)
    bola(coll, 'gallina cabeza', (0, -0.18, 0.76), (0.2, 0.2, 0.22), crema, n=4)
    o = clay.lathe('gallina pico', [(0.06, 0.0), (0.0, 0.14)], coll, laca('pico', '#E8A93B', 0.4), segments=8, subsurf=0)
    o.location = (0, -0.36, 0.72)
    o.rotation_euler = (math.pi / 2, 0, 0)
    for k in range(3):
        bola(coll, f'cresta {k}', (0, -0.2 + k * 0.07, 0.98 - abs(k - 1) * 0.03), (0.04, 0.05, 0.06), roja, n=3)
    bola(coll, 'barbilla', (0, -0.34, 0.62), (0.04, 0.03, 0.06), roja, n=3)
    for s in (-1, 1):
        bola(coll, f'gallina ojo {s}', (s * 0.11, -0.33, 0.8), (0.03, 0.02, 0.035), mat('ojo', '#3A2A20', 0.4), n=2)
        bola(coll, f'ala {s}', (s * 0.27, 0.08, 0.5), (0.08, 0.22, 0.16), tela('ala', '#E3C9A4'), n=3)
        tubo(coll, f'gallina pata {s}', [(s * 0.1, 0.0, 0.2), (s * 0.1, -0.02, 0.0)], 0.022, laca('pico', '#E8A93B', 0.4), seg=5)
        for k in (-1, 0, 1):
            tubo(coll, f'dedo {s}{k}', [(s * 0.1, -0.02, 0.01), (s * 0.1 + k * 0.05, -0.1, 0.01)], 0.012, laca('pico', '#E8A93B', 0.4), seg=4)


# ---------------------------------------------------------------- lo demás

def m_bebedero(coll):
    caja(coll, 'bebedero', (0, 0, 0.25), (0.9, 0.33, 0.2), MAD(), p=8)
    for k in range(3):
        caja(coll, f'bebedero tabla {k}', (0, -0.34, 0.12 + k * 0.13), (0.92, 0.012, 0.05), OSC(), p=10, sub=0)
    caja(coll, 'bebedero agua', (0, 0, 0.42), (0.8, 0.24, 0.02), vidrio('agua bebedero', '#89ADB4'), p=10, sub=0)
    for s in (-1, 1):
        caja(coll, f'bebedero pata {s}', (s * 0.75, 0, 0.05), (0.08, 0.36, 0.05), OSC(), p=8, sub=0)


def m_rollo_heno(coll):
    o = clay.lathe('rollo', [(0.0, -0.4), (0.46, -0.4), (0.5, -0.33), (0.5, 0.33), (0.46, 0.4), (0.0, 0.4)], coll, PAJA(), segments=24, subsurf=1)
    o.location = (0, 0, 0.5)
    o.rotation_euler = (0, math.pi / 2, 0)
    for s in (-1, 1):
        for r in (0.15, 0.3):
            c = clay.lathe(f'espiral {s}{r}', [(r - 0.012, 0.0), (r + 0.012, 0.0)], coll, mat('paja oscura', '#C9A24E', 0.9), segments=20, subsurf=0,
                           cap_bottom=False, cap_top=False)
            c.location = (s * 0.405, 0, 0.5)
            c.rotation_euler = (0, math.pi / 2, 0)
    for x in (-0.18, 0.18):
        c = clay.lathe(f'amarre {x}', [(0.5, -0.02), (0.515, 0.0), (0.5, 0.02)], coll, mat('cabuya', '#8A6A44', 0.8), segments=24, subsurf=0,
                       cap_bottom=False, cap_top=False)
        c.location = (x, 0, 0.5)
        c.rotation_euler = (0, math.pi / 2, 0)


def m_piedra_borde(coll):
    clay.blob('piedra', (0, 0, 0.18), (0.55, 0.39, 0.27), coll, PIEDRA(), n=5, p=2.2)
    bola(coll, 'musgo piedra', (0.15, -0.1, 0.4), (0.22, 0.16, 0.06), HOJA_OSC(), n=3)


def m_letrero_entrada(coll):
    corteza = madera('poste letrero', '#79523C')
    cilindro(coll, 'letrero poste', (0, 0, 0), 0.13, 2.55, corteza, seg=12, r2=0.11)
    bola(coll, 'letrero remate', (0, 0, 2.6), (0.15, 0.15, 0.1), OSC(), n=4)
    # Tabla de arriba con el sol del pueblo, tabla de abajo en forma de flecha
    caja(coll, 'tabla sol', (0, -0.12, 2.17), (1.1, 0.06, 0.24), madera('tabla letrero', '#B98E62'), p=6)
    caja(coll, 'tabla sol borde', (0, -0.1, 2.17), (1.15, 0.05, 0.28), OSC(), p=6)
    bola(coll, 'letrero sol', (-0.75, -0.19, 2.17), (0.14, 0.03, 0.14), laca('sol fuente', '#F2C14E', 0.35), n=4)
    for k in range(8):
        a = k * math.pi / 4
        bola(coll, f'letrero rayo {k}', (-0.75 + math.cos(a) * 0.2, -0.19, 2.17 + math.sin(a) * 0.2), (0.04, 0.02, 0.04), laca('rayo fuente', '#E8892F', 0.4), n=3)
    for k in range(4):
        caja(coll, f'letrero renglón {k}', (-0.3 + k * 0.3, -0.19, 2.17), (0.11, 0.01, 0.025), mat('tinta', '#5A3E2B', 0.7), p=12, sub=0)
    o = caja(coll, 'tabla flecha', (0, 0, 0), (0.75, 0.06, 0.2), madera('tabla letrero', '#B98E62'), p=6)
    o.location = (0.1, -0.12, 1.58)
    o.rotation_euler = (0, 0.09, 0)
    punta = clay.lathe('punta flecha', [(0.0, 0.0), (0.26, 0.0), (0.0, 0.32)], coll, madera('tabla letrero', '#B98E62'), segments=3, subsurf=0)
    punta.location = (0.85, -0.12, 1.645)
    punta.rotation_euler = (math.pi / 2, -math.pi / 2 + 0.09, 0)
    punta.scale = (1, 1, 0.25)
    for k in range(3):
        caja(coll, f'flecha renglón {k}', (-0.35 + k * 0.3, -0.19, 1.58 + k * 0.025), (0.1, 0.01, 0.022), mat('tinta', '#5A3E2B', 0.7), p=12, sub=0)
    for k in range(6):
        a = k * 1.05
        bola(coll, f'letrero mata {k}', (math.cos(a) * 0.25, math.sin(a) * 0.25, 0.08), (0.12, 0.1, 0.08), (HOJA, HOJA_OSC)[k % 2](), n=3)
    flor(coll, 'letrero flor a', (0.2, -0.2, 0.2), 0.05, '#F2C94C', centro='#E8892F')
    flor(coll, 'letrero flor b', (-0.18, -0.25, 0.16), 0.045, '#E58FA6', centro='#F2C94C')
    calabaza(coll, 'letrero calabacita', (0.35, 0.15, 0.0), 0.1)
    hoja_plana(coll, 'letrero hoja', (0.0, -0.13, 1.82), 0.12, '#5FA85A', ang=1.2)


# ---------------------------------------------------------------- utilería de cada edificio (frente hacia -y)

def _caja_fruta(coll, nombre, x, y, fruta=None):
    caja(coll, f'{nombre} cuerpo', (x, y, 0.29), (0.47, 0.34, 0.27), MAD(), p=8)
    for s in (-1, 1):
        for k in range(3):
            caja(coll, f'{nombre} tabla {s}{k}', (x, y + s * 0.36, 0.13 + k * 0.18), (0.49, 0.015, 0.03), OSC(), p=10, sub=0)
    caja(coll, f'{nombre} sello', (x, y - 0.37, 0.3), (0.12, 0.008, 0.08), mat('sello caja', '#C9563F', 0.7), p=10, sub=0)
    if fruta:
        for k in range(9):
            bola(coll, f'{nombre} fruta {k}', (x - 0.3 + (k % 3) * 0.3 + RNG.uniform(-0.03, 0.03), y - 0.2 + (k // 3) * 0.2, 0.62 + (k % 2) * 0.03), 0.12,
                 laca(f'fruta {fruta}', fruta, 0.4), n=3)
            if k % 3 == 1:
                hoja_plana(coll, f'{nombre} hojita {k}', (x - 0.3 + (k % 3) * 0.3, y - 0.2 + (k // 3) * 0.2 - 0.08, 0.72), 0.07, '#5FA85A', ang=0.8)


def _puesto_mercado(coll, toldo, frutas):
    """Toldo de rayas sobre dos cajas de fruta, delante de la fachada del mercado."""
    t = caja(coll, 'toldo', (0, 0, 0), (1.28, 0.83, 0.07), tela(f'toldo {toldo}', toldo), p=10, sub=1)
    t.location = (0, 0, 2.7)
    t.rotation_euler = (0.12, 0, 0)
    for k in range(5):
        caja(coll, f'raya toldo {k}', (-1.04 + k * 0.52, 0, 0.075), (0.12, 0.83, 0.008), tela('raya toldo', '#F0DABC'), p=12, sub=0).parent = t
    for k in range(12):
        bola(coll, f'festón {k}', (-1.18 + k * 0.215, -0.84, 2.53), (0.11, 0.03, 0.1), tela(f'toldo {toldo}', toldo) if k % 2 else tela('raya toldo', '#F0DABC'), n=3)
    for sx in (-1, 1):
        cilindro(coll, f'poste toldo {sx}', (sx * 1.16, -0.7, 0), 0.06, 2.55, OSC(), seg=10)
        bola(coll, f'remate toldo {sx}', (sx * 1.16, -0.7, 2.6), 0.07, laca('remate', '#E8C66A', 0.4), n=3)
    for k, (x, fruta) in enumerate(((-0.51, frutas[0]), (0.51, frutas[1]))):
        _caja_fruta(coll, f'caja mercado {k}', x, -0.07, fruta)
    caja(coll, 'pizarrita', (0.0, -0.45, 0.62), (0.22, 0.02, 0.17), mat('pizarra', '#3E4A45', 0.8), p=8)
    for k in range(3):
        caja(coll, f'tiza {k}', (-0.06 + k * 0.06, -0.475, 0.66 - k * 0.05), (0.05, 0.004, 0.008), mat('tiza', '#F6F1E6', 0.7), p=12, sub=0)


def m_puesto_mercado_verde(coll):
    _puesto_mercado(coll, '#899F69', ('#DF9360', '#D9BC68'))


def m_puesto_mercado_mostaza(coll):
    _puesto_mercado(coll, '#D4AA68', ('#879D5C', '#BE7471'))


def m_troncos_pila(coll):
    """Pila de troncos de la carpintería (a lo largo de y, 2,2 m)."""
    corteza = madera('corteza', '#79523C')
    filas = ((-0.87, -0.29, 0.29, 0.87), (-0.58, 0.0, 0.58), (-0.29, 0.29))
    for r, xs in enumerate(filas):
        for k, x in enumerate(xs):
            o = clay.lathe(f'tronco {r}{k}', [(0.0, -1.1), (0.24, -1.1), (0.25, -1.05), (0.255, 0.0), (0.25, 1.05), (0.24, 1.1), (0.0, 1.1)], coll, corteza,
                           segments=14, subsurf=1)
            o.location = (x, 0, 0.28 + r * 0.44)
            o.rotation_euler = (math.pi / 2, 0, 0)
            for j, rr in enumerate((0.2, 0.13, 0.06)):
                c = clay.lathe(f'anillo tronco {r}{k}{j}', [(rr - 0.012, 0.0), (rr + 0.012, 0.0)], coll, madera('corte', '#D9B07A' if j % 2 == 0 else '#B98E62'),
                               segments=14, subsurf=0, cap_bottom=False, cap_top=False)
                c.location = (x, -1.105, 0.28 + r * 0.44)
                c.rotation_euler = (math.pi / 2, 0, 0)
            cilindro(coll, f'cara tronco {r}{k}', (x, -1.1, 0.28 + r * 0.44), 0.235, 0.004, madera('corte', '#D9B07A'), seg=14).rotation_euler = (math.pi / 2, 0, 0)
    for s in (-1, 1):
        caja(coll, f'cuña {s}', (s * 1.12, 0, 0.12), (0.08, 0.5, 0.12), OSC(), p=8)


def m_banco_taller(coll):
    caja(coll, 'tablero taller', (0, 0, 1.07), (1.4, 0.62, 0.12), MAD(), p=8)
    for s in (-1, 1):
        caja(coll, f'pata taller {s}', (s * 1.14, 0, 0.48), (0.08, 0.54, 0.48), OSC(), p=8)
    caja(coll, 'travesaño taller', (0, 0, 0.3), (1.1, 0.05, 0.05), OSC(), p=10, sub=0)
    caja(coll, 'tabla encima', (0, 0, 1.24), (0.92, 0.19, 0.045), madera('tabla clara', '#F0DABC'), p=10)
    o = caja(coll, 'serrucho', (0, 0, 0), (0.42, 0.13, 0.006), metal('serrucho', '#B7C0C6'), p=12, sub=0)
    o.location = (0.05, -0.1, 1.32)
    o.rotation_euler = (0, 0, 0.3)
    m = caja(coll, 'mango serrucho', (0, 0, 0), (0.08, 0.06, 0.03), laca('mango', '#C9563F', 0.4), p=8)
    m.location = (0.46, 0.04, 1.33)
    m.rotation_euler = (0, 0, 0.3)
    for k in range(6):
        bola(coll, f'viruta {k}', (RNG.uniform(-1.0, 1.0), RNG.uniform(-0.45, 0.45), 1.2), (0.05, 0.03, 0.02), madera('viruta', '#E3C08A'), n=2)
    tubo(coll, 'martillo mango', [(-0.9, 0.2, 1.21), (-0.6, 0.3, 1.21)], 0.025, MAD(), seg=6)
    caja(coll, 'martillo cabeza', (-0.92, 0.19, 1.24), (0.04, 0.09, 0.05), metal('martillo', '#536271'), p=8)
    for k in range(4):
        cilindro(coll, f'tarro clavos {k}', (0.95 + (k % 2) * 0.12, 0.3 - (k // 2) * 0.12, 1.19), 0.05, 0.1, metal('tarro', '#8D949C'), seg=10)


def m_barril_taller(coll):
    clay.lathe('barril', [(0.0, 0.0), (0.4, 0.0), (0.47, 0.55), (0.4, 1.15), (0.0, 1.15)], coll, madera('barril', '#B98E62'), segments=20, subsurf=1)
    for z in (0.18, 0.55, 0.95):
        r = 0.4 + 0.07 * (1 - abs(z - 0.55) / 0.55)
        clay.lathe(f'zuncho {z}', [(r, -0.025), (r + 0.015, 0.0), (r, 0.025)], coll, metal('zuncho', '#536271'), segments=20, subsurf=0,
                   cap_bottom=False, cap_top=False).location = (0, 0, z)
    cilindro(coll, 'tapa barril', (0, 0, 1.13), 0.43, 0.06, madera('tapa', '#79523C'), seg=20)


def m_fragua_patio(coll):
    """Fragua de piedra (1,8 × 1,42) con la boca al frente; el fuego animado lo pone el juego delante."""
    rocas = piedra('fragua', '#827E72')
    caja(coll, 'fragua cuerpo', (0, 0, 0.81), (0.9, 0.71, 0.81), rocas, p=6)
    for i in range(5):
        for j in range(5):
            x = -0.72 + j * 0.36 + (0.18 if i % 2 else 0)
            z = 0.18 + i * 0.32
            if abs(x) < 0.5 and z < 1.2 or abs(x) > 0.85:
                continue
            bola(coll, f'piedra fragua {i}{j}', (x, -0.72, z), (0.16, 0.05, 0.13), piedra(f'piedra {(i + j) % 3}', ('#958B80', '#7B6F66', '#A39A8E')[(i + j) % 3]), n=3)
    caja(coll, 'boca fragua', (0, -0.7, 0.75), (0.5, 0.04, 0.4), mat('hollín', '#2B2422', 0.95), p=8, sub=0)
    for k in range(7):
        bola(coll, f'brasa {k}', (-0.35 + k * 0.12, -0.62, 0.42 + (k % 2) * 0.04), (0.08, 0.06, 0.05), luz('brasa', ('#FF8A3D', '#FFB347')[k % 2], 3.0), n=3)
    clay.lathe('campana fragua', [(0.95, 0.0), (0.6, 0.45), (0.3, 0.6), (0.3, 0.62)], coll, metal('campana fragua', '#4A4F57'), segments=4,
               subsurf=0).location = (0, 0, 1.62)
    bpy.data.objects['campana fragua'].rotation_euler = (0, 0, math.pi / 4)
    cilindro(coll, 'chimenea fragua', (0, 0, 2.2), 0.25, 1.0, metal('campana fragua', '#4A4F57'), seg=12)
    clay.lathe('fuelle', [(0.0, 0.0), (0.25, 0.05), (0.28, 0.15), (0.2, 0.3), (0.0, 0.32)], coll, tela('fuelle', '#8A5A3B'), segments=12,
               subsurf=1).location = (1.15, -0.2, 0.55)
    bpy.data.objects['fuelle'].rotation_euler = (0, math.pi / 2, 0)
    tubo(coll, 'pico fuelle', [(1.0, -0.2, 0.7), (0.9, -0.2, 0.7)], 0.04, metal('pico', '#536271'), seg=6)
    for k in range(3):
        tubo(coll, f'tenaza {k}', [(-0.95, -0.4 + k * 0.08, 1.3), (-1.0, -0.42 + k * 0.08, 0.6)], 0.018, metal('tenaza', '#3E4A57'), seg=5)


def m_yunque_patio(coll):
    clay.lathe('tocón yunque', [(0.0, 0.0), (0.52, 0.0), (0.47, 0.1), (0.46, 0.72), (0.0, 0.8)], coll, madera('corteza', '#79523C'), segments=16,
               subsurf=1)
    cilindro(coll, 'corte tocón', (0, 0, 0.79), 0.44, 0.015, madera('corte', '#D9B07A'), seg=16)
    caja(coll, 'yunque base', (0, 0, 0.92), (0.27, 0.22, 0.13), metal('yunque', '#536271'), p=6)
    caja(coll, 'yunque cintura', (0, 0, 1.06), (0.17, 0.14, 0.06), metal('yunque', '#536271'), p=6)
    caja(coll, 'yunque cara', (0.1, 0, 1.19), (0.62, 0.2, 0.08), metal('yunque', '#536271'), p=6)
    clay.lathe('yunque cuerno', [(0.0, 0.0), (0.12, 0.0), (0.0, 0.36)], coll, metal('yunque', '#536271'), segments=12, subsurf=1).location = (-0.5, 0, 1.19)
    bpy.data.objects['yunque cuerno'].rotation_euler = (0, -math.pi / 2, 0)
    tubo(coll, 'mazo mango', [(0.35, -0.05, 1.3), (0.6, -0.12, 1.75)], 0.03, MAD(), seg=6)
    m = caja(coll, 'mazo cabeza', (0, 0, 0), (0.13, 0.07, 0.07), metal('mazo', '#3E4A57'), p=6)
    m.location = (0.62, -0.12, 1.79)
    m.rotation_euler = (0, -0.5, 0)
    caja(coll, 'herradura', (0.25, 0.05, 1.29), (0.08, 0.07, 0.012), luz('hierro caliente', '#FF8A3D', 2.0), p=4)


def m_piedras_mineral(coll):
    for k in range(6):
        x, y = RNG.uniform(-0.45, 0.45), RNG.uniform(-0.5, 0.5)
        col = ('#98AFA9', '#AE9279', '#B7C0C6')[k % 3]
        clay.blob(f'mineral {k}', (x, y, 0.17), (0.24, 0.2, 0.19), coll, piedra(f'mineral {col}', col), n=4, p=2.4)
        for j in range(2):
            bola(coll, f'veta {k}{j}', (x + RNG.uniform(-0.1, 0.1), y - 0.17, 0.2 + j * 0.06), (0.04, 0.02, 0.03),
                 laca('veta', ('#C8743C', '#F2C14A', '#B48CFF')[k % 3], 0.2), n=2)


def m_emblema_clinica(coll):
    """Medallón de la clínica (frente hacia -y, centro en z=0) con su cruz verde y hojitas."""
    o = clay.lathe('medallón', [(0.0, -0.06), (0.44, -0.06), (0.48, 0.0), (0.44, 0.06), (0.0, 0.06)], coll, madera('medallón', '#DFE8D3'),
                   segments=28, subsurf=1)
    o.rotation_euler = (math.pi / 2, 0, 0)
    a = clay.lathe('aro medallón', [(0.45, -0.07), (0.5, 0.0), (0.45, 0.07)], coll, metal('aro', '#C9A44C'), segments=28, subsurf=0, cap_bottom=False,
                   cap_top=False)
    a.rotation_euler = (math.pi / 2, 0, 0)
    verde = laca('cruz', '#819E87', 0.35)
    caja(coll, 'cruz v', (0, -0.08, 0), (0.07, 0.04, 0.27), verde, p=6)
    caja(coll, 'cruz h', (0, -0.08, 0), (0.27, 0.04, 0.07), verde, p=6)
    for s in (-1, 1):
        hoja_plana(coll, f'hoja medallón {s}', (s * 0.3, -0.07, -0.42), 0.18, '#7FB069', ang=-s * 1.0)


def m_maceta_grande(coll):
    """Matera grande con matas y flores; la matera lleva el material «maceta» para teñirla."""
    clay.lathe('maceta', [(0.0, 0.0), (0.27, 0.0), (0.39, 0.45), (0.42, 0.48), (0.42, 0.56), (0.0, 0.54)], coll, laca('maceta', '#C59679', 0.6),
               segments=18, subsurf=1)
    clay.lathe('raya maceta', [(0.35, 0.28), (0.37, 0.31), (0.355, 0.34)], coll, mat('raya maceta', '#F2EBDD', 0.7), segments=18, subsurf=0,
               cap_bottom=False, cap_top=False)
    bola(coll, 'tierra maceta', (0, 0, 0.53), (0.38, 0.38, 0.05), TIERRA(), n=3)
    for k in range(6):
        a = k * 1.05
        bola(coll, f'mata maceta {k}', (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.72), (0.2, 0.2, 0.16), (HOJA, HOJA_CLARA, HOJA_OSC)[k % 3](), n=3)
    for k in range(5):
        a = k * 1.3 + 0.4
        flor(coll, f'flor maceta {k}', (math.cos(a) * 0.22, math.sin(a) * 0.22 - 0.05, 0.9), 0.07, FLORES[k % len(FLORES)], centro='#F2C94C')


def m_maceta_puerta(coll):
    clay.lathe('maceta', [(0.0, 0.0), (0.2, 0.0), (0.29, 0.34), (0.31, 0.37), (0.31, 0.42), (0.0, 0.4)], coll, laca('maceta', '#C59679', 0.6),
               segments=16, subsurf=1)
    bola(coll, 'tierra maceta', (0, 0, 0.4), (0.28, 0.28, 0.04), TIERRA(), n=3)
    for k in range(5):
        a = k * 1.25
        bola(coll, f'mata puerta {k}', (math.cos(a) * 0.14, math.sin(a) * 0.14, 0.55), (0.15, 0.15, 0.12), (HOJA, HOJA_OSC)[k % 2](), n=3)
    for k in range(4):
        a = k * 1.6 + 0.3
        flor(coll, f'flor puerta {k}', (math.cos(a) * 0.15, math.sin(a) * 0.15 - 0.04, 0.68), 0.055, ('#E58FA6', '#F2C94C')[k % 2], centro='#F6F1E6')


def m_tablon(coll):
    """Tablón de anuncios del archivo con tres hojas clavadas (frente hacia -y)."""
    corteza = madera('poste letrero', '#79523C')
    for s in (-1, 1):
        cilindro(coll, f'poste tablón {s}', (s * 0.85, 0, 0), 0.08, 2.25, corteza, seg=10)
        bola(coll, f'remate tablón {s}', (s * 0.85, 0, 2.28), 0.09, OSC(), n=3)
    caja(coll, 'tablón', (0, 0, 1.65), (1.1, 0.08, 0.65), madera('tablón', '#8A5A3B'), p=6)
    caja(coll, 'tablón marco', (0, 0.01, 1.65), (1.16, 0.07, 0.7), OSC(), p=6)
    for s in (-1, 1):
        t = caja(coll, f'tejadito {s}', (0, 0, 0), (1.3, 0.2, 0.04), laca('tejado', '#7D8399', 0.5), p=10)
        t.location = (0, s * 0.17, 2.38)
        t.rotation_euler = (s * 0.45, 0, 0)
    for k, col in enumerate(('#EDDFB6', '#DDC7A3', '#F6F1E6', '#F4D6C8')):
        x = -0.75 + k * 0.5
        o = caja(coll, f'hoja tablón {k}', (0, 0, 0), (0.18, 0.006, 0.24), mat(f'hoja {col}', col, 0.8), p=12, sub=0)
        o.location = (x, -0.09, 1.66 + (0.05 if k % 2 else -0.04))
        o.rotation_euler = (0, (k - 1.5) * 0.06, 0)
        bola(coll, f'chinche {k}', (x, -0.1, 1.86 + (0.05 if k % 2 else -0.04)), 0.025, laca('chinche', ('#E4566B', '#3B6FB6')[k % 2], 0.3), n=2)
        for j in range(3):
            caja(coll, f'renglón {k}{j}', (x, -0.097, 1.72 - j * 0.07 + (0.05 if k % 2 else -0.04)), (0.12, 0.002, 0.008), mat('tinta', '#5A3E2B', 0.7), p=12, sub=0)
    for k in range(4):
        a = k * 1.5
        bola(coll, f'mata tablón {k}', (math.cos(a) * 0.3, math.sin(a) * 0.2, 0.07), (0.12, 0.1, 0.08), (HOJA, HOJA_OSC)[k % 2](), n=3)


def m_caja(coll):
    _caja_fruta(coll, 'caja', 0, 0)
    for k in range(3):
        o = caja(coll, f'rollo papel {k}', (0, 0, 0), (0.05, 0.05, 0.28), mat('papel', '#EDDFB6', 0.8), p=6)
        o.location = (-0.2 + k * 0.18, 0.0, 0.64)
        o.rotation_euler = (0, math.pi / 2, 0.2 * k)


def m_mesa_posada(coll):
    cilindro(coll, 'mesa pata', (0, 0, 0), 0.1, 0.92, MAD(), seg=12)
    cilindro(coll, 'mesa pie', (0, 0, 0), 0.4, 0.05, OSC(), seg=16)
    clay.lathe('mesa tablero', [(0.0, 0.89), (0.8, 0.89), (0.83, 0.93), (0.8, 0.98), (0.0, 0.98)], coll, madera('mesa posada', '#B98E62'), segments=28,
               subsurf=1)
    clay.lathe('mantelito', [(0.0, 0.985), (0.5, 0.985), (0.0, 0.99)], coll, tela('mantelito', '#F0DABC'), segments=20, subsurf=0)
    for s in (-1, 1):
        cilindro(coll, f'taburete pata {s}', (s * 1.05, 0, 0), 0.08, 0.46, OSC(), seg=10)
        clay.lathe(f'taburete asiento {s}', [(0.0, 0.45), (0.26, 0.45), (0.28, 0.5), (0.26, 0.57), (0.0, 0.57)], coll, madera('mesa posada', '#B98E62'),
                   segments=18, subsurf=1).location = (s * 1.05, 0, 0)
        bola(coll, f'cojín taburete {s}', (s * 1.05, 0, 0.6), (0.22, 0.22, 0.04), tela('cojín posada', '#8F6976'), n=4)
    clay.lathe('jarra', [(0.0, 0.0), (0.14, 0.0), (0.16, 0.15), (0.11, 0.28), (0.13, 0.32), (0.0, 0.31)], coll, laca('jarra', '#F0DABC', 0.3),
               segments=16, subsurf=1).location = (0.15, 0.1, 0.99)
    tubo(coll, 'asa jarra', [(0.29, 0.1, 1.24), (0.38, 0.1, 1.17), (0.3, 0.1, 1.08)], 0.02, laca('jarra', '#F0DABC', 0.3), seg=6)
    for k, (x, y) in enumerate(((-0.35, -0.2), (-0.2, 0.3))):
        clay.lathe(f'taza {k}', [(0.0, 0.0), (0.07, 0.0), (0.08, 0.12), (0.0, 0.11)], coll, laca('taza', '#8EC5F0', 0.3), segments=12, subsurf=1).location = (x, y, 0.99)
    clay.lathe('pan posada', [(0.0, 0.0), (0.16, 0.0), (0.15, 0.06), (0.0, 0.1)], coll, laca('pan', '#C98A4A', 0.6), segments=14, subsurf=1).location = (0.4, -0.3, 0.99)


PIEZAS = {k[2:]: v for k, v in globals().items() if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Pueblo granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_pueblo.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
