"""Nuestro Hogar · granja: el monte (árboles y sotobosque de los bordes, los bosques y el lago).

Van por instancias (cientos de copias), así que cada pieza es liviana: pocas caras, sin subdivisión, y los colores
de la copa en materiales «copa…» / «pino…» que el juego tiñe por copia (las de los troncos, «corteza»).

  roble          árbol de copa redonda (≈4,3 m)       pino          pino de cuatro pisos (≈4,4 m)
  helecho        siete frondas                       mata          matorral bajito con florecitas
  hongo          dos hongos de sombrero rojo         tronco_caido  tronco con musgo, corte y hongos

Medidas del juego, base en z=0 (el juego las escala por copia). Un solo GLB: granja_monte.glb.

Uso: blender -b -P granja_monte.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import laca, madera, tela  # noqa: E402
from granja_muebles import bola, mat  # noqa: E402

RNG = np.random.default_rng(41)
CORTEZA = lambda: madera('corteza monte', '#7A5338')  # noqa: E731
COPA = lambda: tela('copa monte', '#5A8840')  # noqa: E731
COPA_CLARA = lambda: tela('copa monte clara', '#7FA852')  # noqa: E731
PINO = lambda: tela('pino monte', '#3F6B3D')  # noqa: E731
PINO_CLARO = lambda: tela('pino monte claro', '#5E8F4C')  # noqa: E731


def grumo(coll, nombre, c, r, material, semilla):
    """Esfera de pocas caras con bultos (copa de árbol de juego)."""
    def bultos(v):
        n = 1 + 0.12 * np.sin(v[:, 0] * 3.1 + semilla) * np.sin(v[:, 1] * 2.7 + semilla * 1.3) * np.sin(v[:, 2] * 3.3 + semilla * 0.7)
        return v * n[:, None]
    return clay.blob(nombre, c, r, coll, material, n=3, subsurf=0, shaper=bultos)


def tronco(coll, nombre, alto, r0, r1, raices=4):
    clay.lathe(nombre, [(0.0, 0.0), (r0 * 1.35, 0.0), (r0, 0.18), (r0 * 0.9, alto * 0.5), (r1, alto), (0.0, alto + 0.02)], coll, CORTEZA(),
               segments=8, subsurf=0)
    for k in range(raices):
        a = k * 2 * math.pi / raices + 0.4
        clay.sweep(f'{nombre} raíz {k}', [(math.cos(a) * r0 * 0.5, math.sin(a) * r0 * 0.5, 0.22), (math.cos(a) * r0 * 1.4, math.sin(a) * r0 * 1.4, 0.04)],
                   [r0 * 0.35, r0 * 0.15], coll=coll, material=CORTEZA(), segments=5, samples=2, caps=('flat', 'round'), subsurf=0)


def m_roble(coll):
    tronco(coll, 'tronco roble', 2.4, 0.3, 0.18)
    for k, (a, l, z) in enumerate(((0.6, 0.65, 1.9), (2.8, 0.6, 2.05), (4.6, 0.55, 2.2))):
        clay.sweep(f'rama roble {k}', [(0, 0, z - 0.3), (math.cos(a) * l * 0.6, math.sin(a) * l * 0.6, z), (math.cos(a) * l, math.sin(a) * l, z + 0.35)],
                   [0.09, 0.06, 0.03], coll=coll, material=CORTEZA(), segments=5, samples=2, caps=('flat', 'round'), subsurf=0)
    copas = [(0, 0, 2.95, 1.25), (0.75, -0.3, 2.6, 0.85), (-0.7, 0.2, 2.65, 0.9), (0.15, 0.75, 2.55, 0.85), (-0.2, -0.15, 3.6, 0.85), (0.5, 0.4, 3.3, 0.7)]
    for k, (x, y, z, r) in enumerate(copas):
        grumo(coll, f'copa roble {k}', (x, y, z), (r, r, r * 0.9), (COPA, COPA_CLARA)[k % 2](), k * 1.7)


def m_pino(coll):
    tronco(coll, 'tronco pino', 1.5, 0.24, 0.12, raices=3)
    for i in range(4):
        r = 1.45 - i * 0.32
        z0 = 1.05 + i * 0.72
        perfil = [(0.0, z0), (r * 0.98, z0), (r, z0 + 0.06), (r * 0.55, z0 + 0.62), (r * 0.12, z0 + 1.22), (0.0, z0 + 1.3)]
        o = clay.lathe(f'piso pino {i}', perfil, coll, (PINO, PINO_CLARO)[i % 2](), segments=10, subsurf=0)
        # Borde ondulado de cada piso
        me = o.data
        for v in me.vertices:
            if v.co.z < z0 + 0.08 and math.hypot(v.co.x, v.co.y) > r * 0.5:
                a = math.atan2(v.co.y, v.co.x)
                v.co.z += 0.1 * math.sin(a * 5 + i)
    bola(coll, 'punta pino', (0, 0, 4.4), (0.12, 0.12, 0.18), PINO_CLARO(), n=2, sub=0)


def m_helecho(coll):
    for k in range(7):
        a = k * 2 * math.pi / 7
        pts = [(math.cos(a) * 0.04, math.sin(a) * 0.04, 0.02), (math.cos(a) * 0.25, math.sin(a) * 0.25, 0.4), (math.cos(a) * 0.5, math.sin(a) * 0.5, 0.42)]
        clay.sweep(f'fronda {k}', pts, [0.03, 0.09, 0.01], profile=(1.0, 0.12), coll=coll, material=(COPA, COPA_CLARA)[k % 2](), segments=4, samples=3,
                   caps=('flat', 'point'), subsurf=0, up=(0, 0, 1))


def m_mata(coll):
    for k, (x, y, r) in enumerate(((-0.3, 0.0, 0.42), (0.3, 0.05, 0.38), (0.0, 0.18, 0.4))):
        grumo(coll, f'mata {k}', (x, y, 0.24), (r, r, r * 0.78), (COPA, COPA_CLARA)[k % 2](), k * 2.3)
    for k in range(5):
        a = k * 1.3
        bola(coll, f'florcita mata {k}', (math.cos(a) * 0.35, math.sin(a) * 0.3 - 0.1, 0.5 + 0.05 * (k % 2)), 0.05,
             laca('florcita monte', ('#F6F1E6', '#F2C94C')[k % 2], 0.5), n=2, sub=0)


def _hongo(coll, nombre, x, y, s):
    clay.lathe(f'{nombre} pie', [(0.0, 0.0), (0.05 * s, 0.0), (0.035 * s, 0.16 * s), (0.0, 0.17 * s)], coll, mat('pie hongo', '#F2E8D5', 0.7), segments=6,
               subsurf=0).location = (x, y, 0)
    clay.lathe(f'{nombre} sombrero', [(0.0, 0.13 * s), (0.12 * s, 0.13 * s), (0.11 * s, 0.19 * s), (0.06 * s, 0.25 * s), (0.0, 0.26 * s)], coll,
               laca('sombrero hongo', '#D2543F', 0.4), segments=10, subsurf=0).location = (x, y, 0)
    for k in range(4):
        a = k * 1.6
        bola(coll, f'{nombre} pinta {k}', (x + math.cos(a) * 0.06 * s, y + math.sin(a) * 0.06 * s, 0.225 * s), 0.018 * s, mat('pinta hongo', '#FFF6E8', 0.6), n=2,
             sub=0)


def m_hongo(coll):
    _hongo(coll, 'hongo', 0, 0, 1.0)
    _hongo(coll, 'hongito', 0.12, 0.06, 0.7)


def m_tronco_caido(coll):
    o = clay.lathe('tronco caído', [(0.0, -1.3), (0.33, -1.3), (0.36, -1.0), (0.34, 0.0), (0.32, 1.3), (0.0, 1.3)], coll, CORTEZA(), segments=10, subsurf=0)
    o.location = (0, 0, 0.3)
    o.rotation_euler = (0, math.pi / 2, 0)
    for j, r in enumerate((0.26, 0.15)):
        c = clay.lathe(f'anillo corte {j}', [(r - 0.015, 0.0), (r + 0.015, 0.0)], coll, madera('corte monte', '#D8B98E' if j == 0 else '#B98E62'),
                       segments=10, subsurf=0, cap_bottom=False, cap_top=False)
        c.location = (1.31, 0, 0.3)
        c.rotation_euler = (0, math.pi / 2, 0)
    c = clay.lathe('cara corte', [(0.0, 0.0), (0.31, 0.0)], coll, madera('corte monte', '#D8B98E'), segments=10, subsurf=0, cap_bottom=False)
    c.location = (1.305, 0, 0.3)
    c.rotation_euler = (0, math.pi / 2, 0)
    grumo(coll, 'musgo tronco', (-0.3, 0, 0.6), (0.7, 0.32, 0.16), COPA(), 3)
    _hongo(coll, 'hongo tronco', 0.6, -0.3, 0.8)
    _hongo(coll, 'hongito tronco', 0.75, -0.25, 0.55)


# ---------------------------------------------------------------- salidas de la granja

def m_arco_salida(coll):
    """Arco de las salidas: postes a ±1,6 m, viga a 2,75 y tablero de 2,4 × 0,6 colgado a 2,22 (el juego le pinta el
    nombre del destino en las dos caras, a ±0,045 del centro)."""
    from granja_muebles import caja, cilindro, metal, piedra, tubo
    from regalos import luz
    from granja_festivales import flor
    for s in (-1.6, 1.6):
        clay.blob(f'piedra arco {s}', (s, 0, 0.12), (0.34, 0.32, 0.16), coll, piedra('piedra arco', '#A9A596'), n=4, subsurf=1)
        clay.lathe(f'poste arco {s}', [(0.0, 0.0), (0.17, 0.0), (0.15, 0.3), (0.13, 2.7), (0.15, 2.8), (0.0, 2.82)], coll, madera('poste arco', '#8A6242'),
                   segments=10, subsurf=1).location = (s, 0, 0.12)
        for z in (0.9, 1.6):
            clay.lathe(f'cuerda poste {s}{z}', [(0.14, -0.03), (0.165, 0.0), (0.14, 0.03)], coll, mat('cabuya', '#C9A86A', 0.85), segments=10, subsurf=0,
                       cap_bottom=False, cap_top=False).location = (s, 0, z)
        # Farolito colgado del poste
        caja(coll, f'brazo farol {s}', (s, 0.2 * 0 - 0.12, 2.3), (0.025, 0.12, 0.025), metal('farol', '#3E4A57'), p=10, sub=0)
        caja(coll, f'farol {s}', (s, -0.24, 2.08), (0.09, 0.09, 0.12), luz('farol arco', '#FFD88A', 1.6), p=8, sub=0)
        clay.lathe(f'techo farol {s}', [(0.13, 0.0), (0.0, 0.1)], coll, metal('farol', '#3E4A57'), segments=4, subsurf=0).location = (s, -0.24, 2.2)
        for k in range(5):
            a = k * 1.3
            bola(coll, f'mata arco {s}{k}', (s + math.cos(a) * 0.32, -0.15 + math.sin(a) * 0.25, 0.14), (0.12, 0.1, 0.08), COPA() if k % 2 else COPA_CLARA(), n=3)
        for k in range(4):
            flor(coll, f'flor arco {s}{k}', (s + (k - 1.5) * 0.14, -0.38 - (k % 2) * 0.1, 0.22), 0.06, ('#F4A7B9', '#F7D55A', '#FFFFFF', '#C9A3E0')[k], centro='#F2C94C')
    caja(coll, 'viga arco', (0, 0, 2.86), (1.98, 0.14, 0.12), madera('viga arco', '#6B4A33'), p=8)
    for s in (-1, 1):
        o = caja(coll, f'tornapunta {s}', (0, 0, 0), (0.05, 0.05, 0.36), madera('viga arco', '#6B4A33'), p=10, sub=0)
        o.location = (s * 1.38, 0, 2.6)
        o.rotation_euler = (0, -s * 0.75, 0)
    for s in (-0.9, 0.9):
        for k in range(4):
            clay.lathe(f'eslabón {s}{k}', [(0.025, -0.012), (0.035, 0.0), (0.025, 0.012)], coll, metal('cadena', '#5D5A58'), segments=8, subsurf=0,
                       cap_bottom=False, cap_top=False).location = (s, 0, 2.55 + k * 0.07)
    caja(coll, 'tablero arco', (0, 0, 2.22), (1.22, 0.035, 0.32), madera('tablero arco', '#D9B98A'), p=24, sub=0)
    caja(coll, 'marco tablero', (0, 0, 2.22), (1.27, 0.03, 0.36), madera('poste arco', '#8A6242'), p=24, sub=0)
    tubo(coll, 'hiedra viga', [(-1.9, -0.15, 2.8), (-1.2, -0.17, 2.72), (-0.4, -0.16, 2.8), (0.5, -0.16, 2.74), (1.3, -0.17, 2.8), (1.9, -0.15, 2.72)], 0.015,
         mat('tallo', '#5FA85A', 0.6), seg=4)
    for k in range(14):
        x = -1.85 + k * 0.28
        bola(coll, f'hoja hiedra {k}', (x, -0.17, 2.76 + 0.05 * math.sin(k * 1.7)), (0.08, 0.025, 0.06), COPA() if k % 2 else COPA_CLARA(), n=2, sub=0)


def m_senal_salida(coll):
    """Letrerito de flecha junto a cada salida (sin texto)."""
    from granja_muebles import caja
    clay.lathe('poste señal', [(0.0, 0.0), (0.07, 0.0), (0.05, 1.05), (0.0, 1.08)], coll, madera('poste arco', '#9D805E'), segments=8, subsurf=0)
    caja(coll, 'tabla señal', (0.05, -0.05, 0.9), (0.32, 0.03, 0.13), madera('tablero arco', '#C6AE82'), p=8)
    o = clay.lathe('punta señal', [(0.0, 0.0), (0.16, 0.0), (0.0, 0.2)], coll, madera('tablero arco', '#C6AE82'), segments=3, subsurf=0)
    o.location = (0.37, -0.05, 0.9)
    o.rotation_euler = (math.pi / 2, -math.pi / 2, 0)
    o.scale = (1, 1, 0.2)
    caja(coll, 'flecha pintada', (0.1, -0.085, 0.9), (0.18, 0.004, 0.025), laca('flecha', '#6D815D', 0.5), p=12, sub=0)
    for k in range(3):
        bola(coll, f'mata señal {k}', (math.cos(k * 2.1) * 0.15, math.sin(k * 2.1) * 0.12, 0.06), (0.1, 0.08, 0.07), COPA() if k % 2 else COPA_CLARA(), n=2, sub=0)


# ---------------------------------------------------------------- adelantos de cada zona (más allá de los arcos)

def m_boca_mina(coll):
    """Boca de la mina: marco de troncos con su travesaño, hueco oscuro, farolito y letrerito con pico y pala."""
    from granja_muebles import caja, metal, piedra
    from regalos import luz
    caja(coll, 'hueco mina', (0, 0.4, 1.5), (1.6, 0.4, 1.5), mat('hueco', '#1A1714', 0.95), p=6, sub=0)
    for s in (-1, 1):
        clay.lathe(f'puntal {s}', [(0.0, 0.0), (0.2, 0.0), (0.18, 3.4), (0.0, 3.42)], coll, madera('puntal', '#7A5236'), segments=10, subsurf=1).location = (s * 1.8, -0.1, 0)
        clay.blob(f'piedra puntal {s}', (s * 1.8, -0.1, 0.12), (0.4, 0.38, 0.18), coll, piedra('piedra mina', '#8A837B'), n=4, subsurf=1)
    o = clay.lathe('travesaño mina', [(0.0, -2.2), (0.24, -2.2), (0.24, 2.2), (0.0, 2.2)], coll, madera('travesaño', '#6B4A33'), segments=10, subsurf=1)
    o.location = (0, -0.15, 3.42)
    o.rotation_euler = (0, math.pi / 2, 0)
    for s in (-1, 1):
        t = caja(coll, f'tornapunta mina {s}', (0, 0, 0), (0.08, 0.08, 0.5), madera('puntal', '#7A5236'), p=10, sub=0)
        t.location = (s * 1.45, -0.15, 3.05)
        t.rotation_euler = (0, -s * 0.75, 0)
    caja(coll, 'letrero mina', (0, -0.42, 3.42), (0.6, 0.04, 0.24), madera('tablero arco', '#D9B98A'), p=12)
    for s in (-1, 1):
        o = caja(coll, f'mango herramienta {s}', (0, 0, 0), (0.02, 0.012, 0.2), madera('poste arco', '#8A6242'), p=10, sub=0)
        o.location = (s * 0.12, -0.47, 3.42)
        o.rotation_euler = (0, s * 0.7, 0)
    caja(coll, 'pico letrero', (-0.04, -0.48, 3.56), (0.16, 0.012, 0.03), metal('pico', '#8D949C'), p=10, sub=0)
    caja(coll, 'farol mina brazo', (1.8, -0.35, 2.75), (0.03, 0.25, 0.03), metal('farol', '#3E4A57'), p=10, sub=0)
    caja(coll, 'farol mina', (1.8, -0.6, 2.55), (0.12, 0.12, 0.16), luz('farol mina', '#FFD88A', 1.8), p=8, sub=0)
    for k in range(9):
        a = RNG.uniform(0, math.pi)
        clay.blob(f'roca boca {k}', (math.cos(a) * 2.5, 0.5 + RNG.uniform(0, 0.4), math.sin(a) * 2.2 + 0.6), (0.55, 0.45, 0.45), coll,
                  piedra(f'roca {k % 3}', ('#8A837B', '#9A938A', '#7B746C')[k % 3]), n=3, subsurf=0)


def m_vagoneta(coll):
    from granja_muebles import caja, metal
    caja(coll, 'caja vagoneta', (0, 0, 0.55), (0.5, 0.65, 0.3), madera('vagoneta', '#7A5A3E'), p=8)
    for k in range(3):
        caja(coll, f'zuncho vagoneta {k}', (0, -0.45 + k * 0.45, 0.55), (0.52, 0.03, 0.31), metal('zuncho', '#536271'), p=10, sub=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            o = clay.lathe(f'rueda vagoneta {sx}{sy}', [(0.0, -0.04), (0.16, -0.04), (0.17, 0.0), (0.16, 0.04), (0.0, 0.04)], coll, metal('rueda', '#3E4A57'),
                           segments=12, subsurf=0)
            o.location = (sx * 0.45, sy * 0.42, 0.18)
            o.rotation_euler = (0, math.pi / 2, 0)
    for k, col in enumerate(('#C8743C', '#B7C0C6', '#F2C14A', '#9B938A', '#B48CFF', '#C8743C')):
        clay.blob(f'mineral vagoneta {k}', (-0.25 + (k % 2) * 0.5 + RNG.uniform(-0.05, 0.05), -0.35 + (k // 2) * 0.35, 0.9), (0.2, 0.18, 0.15), coll,
                  laca(f'mineral {col}', col, 0.3), n=3, subsurf=0)


def m_riel(coll):
    """Tramo de vía de 0,8 m a lo largo de y: un durmiente y dos rieles."""
    from granja_muebles import caja, metal
    caja(coll, 'durmiente', (0, 0, 0.05), (0.65, 0.11, 0.05), madera('durmiente', '#6B4A33'), p=8)
    for s in (-0.45, 0.45):
        caja(coll, f'riel {s}', (s, 0, 0.13), (0.035, 0.42, 0.04), metal('riel', '#5D6168'), p=10, sub=0)


def m_roca_grande(coll):
    from granja_muebles import piedra
    clay.blob('roca grande', (0, 0, 0.75), (1.0, 0.9, 0.85), coll, piedra('roca grande', '#8A837B'), n=4, subsurf=0, p=2.2)
    clay.blob('roca grande b', (0.55, -0.35, 0.4), (0.5, 0.45, 0.45), coll, piedra('roca grande b', '#9A938A'), n=3, subsurf=0)
    grumo(coll, 'musgo roca', (-0.2, 0.1, 1.45), (0.5, 0.45, 0.14), COPA(), 5)


def m_muelle(coll):
    """Muelle de tablas de 1,2 m de ancho y 3 m de largo hacia +y (entra al agua), con pilotes y una cuerda."""
    from granja_muebles import caja
    for k in range(7):
        caja(coll, f'tabla muelle {k}', (0, -0.2 + k * 0.48, 0.22), (0.62, 0.22, 0.045), madera('muelle', '#A07850'), p=8)
    for s in (-0.55, 0.55):
        for k in range(3):
            clay.lathe(f'pilote {s}{k}', [(0.0, -0.3), (0.08, -0.3), (0.08, 0.55), (0.0, 0.57)], coll, madera('pilote', '#7A5236'), segments=8,
                       subsurf=0).location = (s, 0.3 + k * 1.15, 0)
    clay.lathe('rollo cuerda', [(0.06, -0.04), (0.14, -0.04), (0.14, 0.04), (0.06, 0.04)], coll, mat('cuerda', '#E2C9A0', 0.85), segments=12,
               subsurf=0).location = (0.35, 2.4, 0.3)
    clay.lathe('balde muelle', [(0.0, 0.0), (0.12, 0.0), (0.15, 0.22), (0.0, 0.2)], coll, laca('balde', '#4FC1C6', 0.4), segments=12, subsurf=0).location = (-0.35, 1.2, 0.27)


def m_juncos(coll):
    for k in range(7):
        a = k * 0.9
        x, y = math.cos(a) * 0.15, math.sin(a) * 0.12
        h = 0.7 + 0.25 * ((k * 3) % 4) / 3
        clay.sweep(f'junco {k}', [(x, y, 0), (x * 1.6, y * 1.6, h * 0.6), (x * 2.2, y * 2.2, h)], [0.025, 0.015, 0.005], coll=coll,
                   material=(COPA, COPA_CLARA)[k % 2](), segments=4, samples=2, caps=('flat', 'point'), subsurf=0)
        if k % 2 == 0:
            clay.lathe(f'espiga {k}', [(0.0, 0.0), (0.035, 0.02), (0.035, 0.16), (0.0, 0.18)], coll, mat('espiga', '#6B4329', 0.8), segments=6,
                       subsurf=0).location = (x * 2.0, y * 2.0, h * 0.82)


def m_piedra_orilla(coll):
    from granja_muebles import piedra
    for k, (x, y, r) in enumerate(((0, 0, 0.32), (0.35, 0.1, 0.22), (-0.25, 0.2, 0.18))):
        clay.blob(f'piedra orilla {k}', (x, y, r * 0.55), (r, r * 0.85, r * 0.6), coll, piedra(f'orilla {k}', ('#A9A596', '#9C968C', '#BDB7A8')[k]), n=3, subsurf=0)


# ---------------------------------------------------------------- la cueva de la mina

def m_entibado(coll):
    """Entibado contra la pared de la cueva: dos puntales (±1,1 m), travesaño a 2,75 y farol a 2,35 (frente -y)."""
    from granja_muebles import caja, metal
    from regalos import luz
    for s in (-1, 1):
        clay.lathe(f'puntal entibado {s}', [(0.0, 0.0), (0.16, 0.0), (0.14, 2.7), (0.0, 2.72)], coll, madera('puntal', '#7A5236'), segments=8,
                   subsurf=0).location = (s * 1.1, 0, 0)
        clay.blob(f'cuña entibado {s}', (s * 1.1, -0.05, 0.08), (0.24, 0.22, 0.1), coll, mat('piedra cueva', '#6D6258', 0.95), n=3, subsurf=0)
    o = clay.lathe('travesaño entibado', [(0.0, -1.35), (0.17, -1.35), (0.17, 1.35), (0.0, 1.35)], coll, madera('travesaño', '#6B4A33'), segments=8, subsurf=0)
    o.location = (0, 0, 2.78)
    o.rotation_euler = (0, math.pi / 2, 0)
    for s in (-1, 1):
        t = caja(coll, f'tornapunta entibado {s}', (0, 0, 0), (0.06, 0.06, 0.38), madera('puntal', '#7A5236'), p=10, sub=0)
        t.location = (s * 0.82, 0, 2.48)
        t.rotation_euler = (0, -s * 0.75, 0)
    caja(coll, 'gancho farol', (0, -0.12, 2.6), (0.02, 0.12, 0.02), metal('farol', '#3E4A57'), p=10, sub=0)
    caja(coll, 'farol entibado', (0, -0.22, 2.35), (0.11, 0.11, 0.15), luz('farol mina', '#FFD88A', 1.8), p=8, sub=0)
    clay.lathe('techo farol entibado', [(0.16, 0.0), (0.0, 0.12)], coll, metal('farol', '#3E4A57'), segments=4, subsurf=0).location = (0, -0.22, 2.5)
    o = caja(coll, 'pico apoyado', (0, 0, 0), (0.025, 0.025, 0.6), madera('poste arco', '#8A6242'), p=10, sub=0)
    o.location = (0.75, -0.25, 0.6)
    o.rotation_euler = (0.25, 0, 0)


def m_marco_tunel(coll):
    """Marco de la salida de la cueva: puntales a ±2,1 m y viga de 4,8 m a 3,05."""
    from granja_muebles import caja
    for s in (-1, 1):
        clay.lathe(f'puntal túnel {s}', [(0.0, 0.0), (0.18, 0.0), (0.16, 3.0), (0.0, 3.02)], coll, madera('puntal', '#7A5236'), segments=8, subsurf=0).location = (s * 2.1, 0, 0)
    o = clay.lathe('viga túnel', [(0.0, -2.4), (0.2, -2.4), (0.2, 2.4), (0.0, 2.4)], coll, madera('travesaño', '#6B4A33'), segments=8, subsurf=0)
    o.location = (0, 0, 3.08)
    o.rotation_euler = (0, math.pi / 2, 0)
    caja(coll, 'letrero salida', (0, -0.24, 3.08), (0.45, 0.03, 0.16), madera('tablero arco', '#D9B98A'), p=12)
    o = clay.lathe('flecha salida', [(0.0, 0.0), (0.1, 0.0), (0.0, 0.14)], coll, laca('flecha', '#6D815D', 0.5), segments=3, subsurf=0)
    o.location = (0, -0.28, 3.02)
    o.scale = (1, 0.3, 1)


def m_cristales(coll):
    """Racimo de siete cristales (material «cristal» que el juego tiñe y hace brillar según el piso)."""
    for i in range(7):
        a = i * 2 * math.pi / 7 + RNG.uniform(-0.3, 0.3)
        h = 0.9 + RNG.uniform(0, 1.5)
        r = 0.24 + RNG.uniform(0, 0.1)
        o = clay.lathe(f'cristal {i}', [(0.0, 0.0), (r, 0.0), (r * 1.05, h * 0.7), (0.0, h)], coll, mat('cristal', '#FFFFFF', 0.15), segments=6, subsurf=0)
        o.location = (math.cos(a) * 0.35 * (i > 0), math.sin(a) * 0.35 * (i > 0), 0)
        o.rotation_euler = (math.sin(a) * 0.35 * (i > 0), -math.cos(a) * 0.35 * (i > 0), RNG.uniform(0, 1))
    for k in range(5):
        a = k * 1.3
        clay.blob(f'roca cristal {k}', (math.cos(a) * 0.5, math.sin(a) * 0.45, 0.08), (0.22, 0.2, 0.12), coll, mat('piedra cueva', '#6D6258', 0.95), n=3, subsurf=0)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Monte granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_monte.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
