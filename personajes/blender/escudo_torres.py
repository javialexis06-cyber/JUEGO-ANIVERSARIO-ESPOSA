"""Nuestro Hogar · El Escudo de las Hermanas: las torres de los defensores del Borde (y lo que disparan).

Cada torre se arma en el juego con tres capas: la base según el nivel (base_1 de madera, base_2 de piedra, base_3 de
piedra con oro), el cuerpo de la torre encima (su base en z = 0 queda sobre la base) y, si ya escogió su rama final,
el adorno de esa rama. Lo que se mueve (la llama de Aura, la luna de Lara, los orbes de Fuatia) va en piezas aparte.
Las criaturas (dragón, grifo y unicornio) son las de la granja (public/modelos/granja-v3/*.glb): aquí van su nido, su
percha y su fuente.

  base_1, base_2, base_3
  aura_altar, aura_llama, aura_a (Sol del Alba), aura_b (Lluvia de chispas)
  lara_altar, lara_luna, lara_a (Velo del Ocaso), lara_b (Rosal de la Calma)
  dragon_nido, dragon_a (Jade ancestral), dragon_b (Fuego de la mina)
  grifo_percha, grifo_a (Garra de tormenta), grifo_b (Vigía de la frontera)
  unicornio_fuente, unicornio_a (Luz plateada), unicornio_b (Lágrimas de alegría)
  fuatia_pilar, fuatia_fuego, fuatia_agua, fuatia_tierra, fuatia_aire, fuatia_a (La Balanza), fuatia_b (Los Cuatro Núcleos)
  bola_fuego, pluma, orbe_luz, estrella, meteoro

Un solo GLB: escudo_torres.glb.   Uso: blender -b -P escudo_torres.py -- <carpeta_salida> [claves]
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
from granja_muebles import bola, caja, cilindro, metal, piedra, tubo  # noqa: E402
from tiendas import _mat  # noqa: E402

RNG = np.random.default_rng(77)
MAD = lambda: madera('torre madera', '#B07A50')  # noqa: E731
MAD_OSC = lambda: madera('torre madera oscura', '#7A4E33')  # noqa: E731
PIEDRA = lambda: piedra('torre piedra', '#CFC5B4')  # noqa: E731
PIEDRA_OSC = lambda: piedra('torre piedra oscura', '#9C9384')  # noqa: E731
ORO = lambda: metal('torre oro', '#E2B04A')  # noqa: E731
PLATA = lambda: metal('torre plata', '#D6DCE6')  # noqa: E731


def cristal(nombre, color, brillo, fuerza=0.9):
    return _mat(f'Escudo | cristal {nombre}', color, rough=0.12, coat=0.6, emission=brillo, emission_strength=fuerza)


def ruido(semilla, amp=0.12, f=2.3):
    def s(v):
        n = 1 + amp * np.sin(v[:, 0] * f + semilla) * np.sin(v[:, 1] * f * 1.1 + semilla * 1.7) * np.sin(v[:, 2] * f * 0.9 + semilla * 0.6)
        return v * n[:, None]
    return s


def anillo(coll, nombre, r0, r1, z, h, material, seg=24):
    return clay.lathe(nombre, [(r0, z), (r1, z), (r1, z + h), (r0, z + h)], coll, material, segments=seg, subsurf=0)


# ---------------------------------------------------------------------------------------------------- las bases

def m_base_1(coll):
    """Nivel 1: tarima redonda de tablas sobre cuatro piedras."""
    for k in range(4):
        a = k / 4 * math.tau + math.pi / 4
        clay.blob(f'base1 piedra {k}', (math.cos(a) * 0.55, math.sin(a) * 0.55, 0.1), (0.2, 0.18, 0.12), coll, PIEDRA_OSC(), n=4, shaper=ruido(k, 0.15, 6),
                  subsurf=1)
    for k in range(6):
        x = -0.6 + k * 0.24
        w = math.sqrt(max(0.0, 0.72 ** 2 - x ** 2))
        caja(coll, f'base1 tabla {k}', (x, 0, 0.27), (0.11, w, 0.05), MAD() if k % 2 else MAD_OSC(), p=10)
    for y in (-0.35, 0.35):
        caja(coll, f'base1 travesaño {y}', (0, y, 0.2), (0.7, 0.05, 0.04), MAD_OSC(), p=8, sub=0)
    for k in range(6):
        bola(coll, f'base1 clavo {k}', (-0.6 + k * 0.24, -0.35, 0.33), 0.022, metal('clavo', '#6E6660'), n=2, sub=0)


def m_base_2(coll):
    """Nivel 2: tambor de piedra con un aro de madera."""
    clay.lathe('base2 tambor', [(0, 0), (0.78, 0), (0.8, 0.08), (0.72, 0.42), (0.74, 0.48), (0, 0.48)], coll, PIEDRA(), segments=24, subsurf=1)
    anillo(coll, 'base2 aro', 0.74, 0.8, 0.3, 0.1, MAD())
    for k in range(10):
        a = k / 10 * math.tau
        caja(coll, f'base2 bloque {k}', (math.cos(a) * 0.79, math.sin(a) * 0.79, 0.14), (0.05, 0.12, 0.1), PIEDRA_OSC(), p=6, sub=0).rotation_euler = (0, 0, a)


def m_base_3(coll):
    """Nivel 3: tambor de piedra clara con aros de oro y gemas que brillan."""
    clay.lathe('base3 tambor', [(0, 0), (0.86, 0), (0.88, 0.1), (0.78, 0.5), (0.82, 0.58), (0, 0.58)], coll, piedra('torre piedra clara', '#E6DED0'), segments=28,
               subsurf=1)
    anillo(coll, 'base3 aro', 0.8, 0.88, 0.08, 0.06, ORO(), seg=28)
    anillo(coll, 'base3 aro arriba', 0.8, 0.86, 0.5, 0.06, ORO(), seg=28)
    for k in range(6):
        a = k / 6 * math.tau
        bola(coll, f'base3 gema {k}', (math.cos(a) * 0.82, math.sin(a) * 0.82, 0.3), (0.07, 0.07, 0.09), cristal('gema base', '#8FD3FF', '#4FA8E8', 1.4), n=3)
        caja(coll, f'base3 engaste {k}', (math.cos(a) * 0.8, math.sin(a) * 0.8, 0.3), (0.05, 0.1, 0.12), ORO(), p=6, sub=0).rotation_euler = (0, 0, a)


# ---------------------------------------------------------------------------------------------------- Aura

def m_aura_altar(coll):
    """El altar de Aura: piedra dorada con soles tallados, un cuenco de bronce arriba y velas alrededor."""
    oro_claro = piedra('altar aura', '#F0D9A8')
    clay.lathe('aura cuerpo', [(0, 0), (0.55, 0), (0.48, 0.15), (0.38, 0.8), (0.46, 0.9), (0.46, 1.0), (0, 1.0)], coll, oro_claro, segments=8, subsurf=1)
    for k in range(4):
        a = k / 4 * math.tau
        x, y = math.cos(a) * 0.45, math.sin(a) * 0.45
        bola(coll, f'aura sol tallado {k}', (x, y, 0.5), (0.12, 0.12, 0.12), laca('sol tallado', '#F2A93B'), n=3)
        for j in range(6):
            b = j / 6 * math.tau
            bola(coll, f'aura rayo {k} {j}', (x + math.cos(a) * 0.02 + math.cos(b) * 0.17 * abs(math.sin(a)) , y + math.sin(b) * 0.17 * abs(math.cos(a)) + math.sin(a) * 0.02,
                                             0.5 + math.sin(b) * 0.17), 0.035, ORO(), n=2, sub=0)
    clay.lathe('aura cuenco', [(0.0, 1.0), (0.2, 1.0), (0.42, 1.15), (0.46, 1.25), (0.4, 1.23)], coll, metal('bronce aura', '#C88A3A'), segments=18, subsurf=1,
               cap_top=False)
    for k in range(6):
        a = k / 6 * math.tau
        x, y = math.cos(a) * 0.62, math.sin(a) * 0.62
        cilindro(coll, f'aura vela {k}', (x, y, 0.0), 0.05, 0.22 + 0.06 * (k % 2), laca('vela aura', '#FFF6E0'), seg=8)
        bola(coll, f'aura llamita {k}', (x, y, 0.3 + 0.06 * (k % 2)), (0.03, 0.03, 0.06), luz('llamita', '#FFC66A', 5.0), n=2, sub=0)
    caja(coll, 'aura paño', (0, -0.42, 0.75), (0.22, 0.03, 0.2), tela('paño aura', '#E8892B'), p=6)
    bola(coll, 'aura paño sol', (0, -0.46, 0.78), (0.08, 0.02, 0.08), laca('sol paño', '#FFE08A'), n=2, sub=0)


def m_aura_llama(coll):
    """El fuego de Aura que flota sobre el cuenco (se anima en el juego)."""
    for k, (h, r, c) in enumerate(((0.75, 0.32, '#FF9A2A'), (0.6, 0.24, '#FFC04A'), (0.42, 0.15, '#FFF0B0'))):
        clay.sweep(f'aura fuego {k}', [(0, 0, 0.0), (0.03 * k, 0.0, h * 0.45), (0.0, 0.0, h)], [r, r * 0.7, 0.01], coll=coll,
                   material=luz(f'fuego aura {k}', c, 3.5 + k * 1.5), segments=10, samples=4, caps=('round', 'point'), subsurf=0)
    for k in range(5):
        a = k / 5 * math.tau
        clay.sweep(f'aura lengua {k}', [(math.cos(a) * 0.2, math.sin(a) * 0.2, 0.05), (math.cos(a) * 0.26, math.sin(a) * 0.26, 0.3), (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.5)],
                   [0.09, 0.06, 0.005], coll=coll, material=luz('fuego aura 0', '#FF9A2A', 3.5), segments=6, samples=3, caps=('round', 'point'), subsurf=0)


def m_aura_a(coll):
    """Sol del Alba: un disco de sol grande de oro detrás del altar, con rayos largos."""
    bola(coll, 'aura a disco', (0, 0.55, 1.6), (0.42, 0.06, 0.42), ORO(), n=4)
    bola(coll, 'aura a centro', (0, 0.48, 1.6), (0.26, 0.04, 0.26), luz('sol alba', '#FFD36B', 3.0), n=3)
    for k in range(12):
        a = k / 12 * math.tau
        l = 0.85 if k % 2 == 0 else 0.68
        clay.sweep(f'aura a rayo {k}', [(math.cos(a) * 0.42, 0.55, 1.6 + math.sin(a) * 0.42), (math.cos(a) * l, 0.55, 1.6 + math.sin(a) * l)], [0.07, 0.01],
                   coll=coll, material=ORO(), segments=5, samples=2, caps=('flat', 'point'), subsurf=0)
    tubo(coll, 'aura a soporte', [(0, 0.55, 0.9), (0, 0.55, 1.2)], 0.06, ORO(), seg=6)


def m_aura_b(coll):
    """Lluvia de chispas: tres braseritos alrededor del altar."""
    for k in range(3):
        a = k / 3 * math.tau + 0.5
        x, y = math.cos(a) * 0.68, math.sin(a) * 0.68
        cilindro(coll, f'aura b pata {k}', (x, y, 0.0), 0.04, 0.55, metal('bronce aura', '#C88A3A'), seg=6)
        clay.lathe(f'aura b cuenco {k}', [(0.0, 0.0), (0.06, 0.0), (0.16, 0.1), (0.15, 0.12)], coll, metal('bronce aura', '#C88A3A'), segments=10, subsurf=0,
                   cap_top=False).location = (x, y, 0.55)
        clay.sweep(f'aura b llama {k}', [(x, y, 0.62), (x, y, 0.85)], [0.1, 0.01], coll=coll, material=luz('fuego aura 1', '#FFC04A', 5.0), segments=8, samples=2,
                   caps=('round', 'point'), subsurf=0)


# ---------------------------------------------------------------------------------------------------- Lara

def m_lara_altar(coll):
    """El altar de Lara: un obelisco suave de piedra morada con un velo de tela, rosas y velas moradas."""
    morada = piedra('altar lara', '#5A4A7E')
    clay.lathe('lara cuerpo', [(0, 0), (0.5, 0), (0.42, 0.12), (0.3, 1.2), (0.12, 1.55), (0, 1.6)], coll, morada, segments=6, subsurf=1)
    # Velo de tela que cae sobre los hombros del obelisco
    for k in range(6):
        a = k / 6 * math.tau + 0.2
        tubo(coll, f'lara velo {k}', [(math.cos(a) * 0.15, math.sin(a) * 0.15, 1.45), (math.cos(a) * 0.36, math.sin(a) * 0.36, 1.0),
                                      (math.cos(a) * 0.45, math.sin(a) * 0.45, 0.55)], 0.06, tela('velo lara', '#2A2238'), seg=6)
    clay.blob('lara velo cima', (0, 0, 1.45), (0.2, 0.2, 0.14), coll, tela('velo lara', '#2A2238'), n=4, subsurf=1)
    for k in range(5):
        a = k / 5 * math.tau
        x, y = math.cos(a) * 0.6, math.sin(a) * 0.6
        cilindro(coll, f'lara vela {k}', (x, y, 0.0), 0.045, 0.18 + 0.05 * (k % 3), laca('vela lara', '#C9B6EA'), seg=8)
        bola(coll, f'lara llamita {k}', (x, y, 0.25 + 0.05 * (k % 3)), (0.028, 0.028, 0.055), luz('llamita lara', '#E3D4FF', 5.0), n=2, sub=0)
    for k in range(4):
        a = k / 4 * math.tau + 0.6
        bola(coll, f'lara rosa {k}', (math.cos(a) * 0.38, math.sin(a) * 0.38, 0.12), (0.08, 0.08, 0.06), tela('rosa lara', '#9C6FD6'), n=3)
    caja(coll, 'lara placa', (0, -0.38, 0.6), (0.14, 0.03, 0.14), ORO(), p=6, sub=0)
    clay.sweep('lara placa luna', [(0.06 * math.cos(t), -0.42, 0.6 + 0.09 * math.sin(t)) for t in np.linspace(-2.1, 2.1, 6)], 0.025, coll=coll,
               material=luz('luna placa', '#E9E4F5', 2.0), segments=6, samples=2, subsurf=0)


def m_lara_luna(coll):
    """La luna de Lara que flota encima (farol de luz plateada)."""
    clay.sweep('lara luna', [(0.24 * math.cos(t), 0, 0.32 * math.sin(t)) for t in np.linspace(-2.3, 2.3, 9)], [0.03, 0.11, 0.03], coll=coll,
               material=luz('luna lara', '#E9E4F5', 3.0), segments=10, samples=3, subsurf=0)
    for k in range(3):
        bola(coll, f'lara luna estrella {k}', (-0.08 + 0.1 * k, 0.0, 0.42 - 0.1 * (k % 2)), 0.035, luz('estrellita lara', '#FFFFFF', 4.0), n=2, sub=0)


def m_lara_a(coll):
    """Velo del Ocaso: un arco de madera oscura con un velo largo que cae a los lados."""
    arco = [(-0.7, 0, 0.0), (-0.72, 0, 1.4), (-0.4, 0, 2.1), (0, 0, 2.25), (0.4, 0, 2.1), (0.72, 0, 1.4), (0.7, 0, 0.0)]
    clay.sweep('lara a arco', arco, 0.07, coll=coll, material=MAD_OSC(), segments=8, samples=4, caps=('flat', 'flat'), subsurf=0)
    for s in (-1, 1):
        tubo(coll, f'lara a velo {s}', [(s * 0.45, -0.05, 2.1), (s * 0.78, -0.12, 1.4), (s * 0.82, -0.1, 0.4)], 0.09, tela('velo ocaso', '#3A2F5C'), seg=6)
    for k in range(7):
        t = k / 6
        x = -0.6 + 1.2 * t
        bola(coll, f'lara a estrella {k}', (x, -0.06, 2.0 + 0.2 * math.sin(t * math.pi)), 0.04, luz('estrellita lara', '#FFFFFF', 4.0), n=2, sub=0)


def m_lara_b(coll):
    """Rosal de la Calma: un aro de rosales morados alrededor del altar."""
    hojas = tela('rosal hojas', '#3F6B4E')
    for k in range(5):
        a = k / 5 * math.tau + 0.3
        x, y = math.cos(a) * 0.68, math.sin(a) * 0.68
        clay.blob(f'lara b mata {k}', (x, y, 0.2), (0.22, 0.22, 0.2), coll, hojas, n=4, shaper=ruido(k, 0.18, 6), subsurf=1)
        for j in range(3):
            b = j * 2.1 + k
            bola(coll, f'lara b rosa {k} {j}', (x + math.cos(b) * 0.15, y + math.sin(b) * 0.15, 0.3 + 0.05 * j), (0.07, 0.07, 0.05),
                 tela('rosa lara' if j % 2 else 'rosa lara clara', '#9C6FD6' if j % 2 else '#C9B6EA'), n=3)


# ---------------------------------------------------------------------------------------------------- dragón

def m_dragon_nido(coll):
    """El nido del dragón: rocas de la mina, paja tejida, gemas oscuras y un huevo."""
    for k in range(9):
        a = k / 9 * math.tau
        clay.blob(f'dragon roca {k}', (math.cos(a) * 0.62, math.sin(a) * 0.62, 0.16), (0.24, 0.2, 0.2), coll, piedra('roca mina', '#6E625A'), n=4,
                  shaper=ruido(k, 0.2, 5), subsurf=1)
    clay.lathe('dragon paja', [(0.0, 0.08), (0.5, 0.08), (0.58, 0.24), (0.45, 0.22), (0.0, 0.16)], coll, tela('paja nido', '#D9B26A'), segments=18, subsurf=1)
    for k in range(10):
        a = k / 10 * math.tau
        tubo(coll, f'dragon ramita {k}', [(math.cos(a) * 0.4, math.sin(a) * 0.4, 0.22), (math.cos(a + 0.5) * 0.58, math.sin(a + 0.5) * 0.58, 0.28)], 0.02,
             MAD_OSC(), seg=4)
    for k in range(4):
        a = k / 4 * math.tau + 0.4
        bola(coll, f'dragon gema {k}', (math.cos(a) * 0.68, math.sin(a) * 0.68, 0.38), (0.07, 0.07, 0.1), cristal('gema oscura', '#3B8A5A', '#1F6A3A', 1.2), n=3)
    clay.blob('dragon huevo', (0.42, -0.3, 0.3), (0.12, 0.12, 0.16), coll, laca('huevo dragón', '#7FC8A0'), n=4, subsurf=1)
    for k in range(4):
        bola(coll, f'dragon huevo mancha {k}', (0.42 + math.cos(k * 1.6) * 0.1, -0.3 + math.sin(k * 1.6) * 0.1 - 0.02, 0.3 + (k % 2) * 0.06), 0.03,
             laca('mancha huevo', '#3B8A5A'), n=2, sub=0)


def m_dragon_a(coll):
    """Jade ancestral: agujas de cristal de jade alrededor del nido."""
    jade = cristal('jade', '#5FD39A', '#2FA86A', 1.3)
    for k in range(5):
        a = k / 5 * math.tau + 0.2
        x, y = math.cos(a) * 0.75, math.sin(a) * 0.75
        l = 0.55 + 0.2 * (k % 2)
        clay.sweep(f'dragon a aguja {k}', [(x, y, 0.0), (x * 1.08, y * 1.08, l)], [0.11, 0.01], coll=coll, material=jade, segments=6, samples=2,
                   caps=('flat', 'point'), subsurf=0)


def m_dragon_b(coll):
    """Fuego de la mina: una carretilla de mineral y charcos de lava."""
    caja(coll, 'dragon b carro', (0.65, 0.3, 0.25), (0.22, 0.16, 0.12), MAD_OSC(), p=8)
    for s in (-1, 1):
        clay.lathe(f'dragon b rueda {s}', [(0, -0.03), (0.09, -0.03), (0.09, 0.03), (0, 0.03)], coll, metal('rueda', '#4A4A4A'), segments=12,
                   subsurf=0).location = (0.65 + s * 0.14, 0.13, 0.1)
    for k in range(5):
        bola(coll, f'dragon b mineral {k}', (0.55 + (k % 3) * 0.1, 0.25 + (k // 3) * 0.1, 0.4), 0.07, luz('mineral', '#FF7A2A', 2.0), n=2, sub=0)
    for k in range(2):
        a = 3.6 + k * 1.1
        clay.blob(f'dragon b lava {k}', (math.cos(a) * 0.7, math.sin(a) * 0.7, 0.02), (0.22, 0.17, 0.02), coll, luz('lava', '#FF5A1A', 3.0), n=4, subsurf=1)


# ---------------------------------------------------------------------------------------------------- grifo

def m_grifo_percha(coll):
    """La percha del grifo: torre de madera de 2 m con escalera, plataforma de nido y banderines dorados."""
    for k in range(4):
        a = k / 4 * math.tau + math.pi / 4
        tubo(coll, f'grifo pata {k}', [(math.cos(a) * 0.55, math.sin(a) * 0.55, 0.0), (math.cos(a) * 0.4, math.sin(a) * 0.4, 1.0),
                                       (math.cos(a) * 0.36, math.sin(a) * 0.36, 1.75)], 0.07, MAD(), seg=6)
    for z in (0.5, 1.1):
        for k in range(4):
            a0, a1 = k / 4 * math.tau + math.pi / 4, (k + 1) / 4 * math.tau + math.pi / 4
            r = 0.55 - z * 0.12
            tubo(coll, f'grifo cruz {z} {k}', [(math.cos(a0) * r, math.sin(a0) * r, z), (math.cos(a1) * r, math.sin(a1) * r, z + 0.3)], 0.035, MAD_OSC(), seg=4)
    clay.lathe('grifo plataforma', [(0, 1.72), (0.62, 1.72), (0.64, 1.82), (0, 1.82)], coll, MAD(), segments=16, subsurf=0)
    clay.lathe('grifo nido', [(0.3, 1.8), (0.58, 1.8), (0.62, 1.95), (0.5, 1.93), (0.35, 1.85)], coll, tela('paja percha', '#D9B26A'), segments=16, subsurf=1)
    for k in range(5):
        a = k / 5 * math.tau
        tubo(coll, f'grifo baranda {k}', [(math.cos(a) * 0.6, math.sin(a) * 0.6, 1.82), (math.cos(a) * 0.6, math.sin(a) * 0.6, 2.05)], 0.025, MAD_OSC(), seg=4)
        c = ('#FFC64A', '#E8892B', '#FFF0B0')[k % 3]
        caja(coll, f'grifo banderín {k}', (math.cos(a + 0.3) * 0.64, math.sin(a + 0.3) * 0.64, 1.62), (0.06, 0.012, 0.1), tela(f'banderín {c}', c), p=4, sub=0
             ).rotation_euler = (0, 0, a + 0.3 + math.pi / 2)
    # escalera
    for s in (-1, 1):
        tubo(coll, f'grifo escalera {s}', [(s * 0.14, -0.62, 0.0), (s * 0.14, -0.5, 1.72)], 0.025, MAD_OSC(), seg=4)
    for k in range(7):
        z = 0.2 + k * 0.22
        tubo(coll, f'grifo peldaño {k}', [(-0.14, -0.62 + z * 0.07, z), (0.14, -0.62 + z * 0.07, z)], 0.02, MAD(), seg=4)
    for k in range(4):
        bola(coll, f'grifo pluma {k}', (math.cos(k * 1.6) * 0.45, math.sin(k * 1.6) * 0.45, 1.9), (0.08, 0.02, 0.03), tela('pluma dorada', '#F2C94C'), n=2, sub=0)


def m_grifo_a(coll):
    """Garra de tormenta: dos pararrayos de cobre con la punta encendida."""
    for s in (-1, 1):
        cilindro(coll, f'grifo a vara {s}', (s * 0.5, 0.35, 1.8), 0.03, 1.0, metal('cobre', '#C2703E'), seg=6)
        bola(coll, f'grifo a punta {s}', (s * 0.5, 0.35, 2.85), 0.08, luz('rayo', '#9FE3FF', 5.0), n=2, sub=0)
        for k in range(3):
            clay.lathe(f'grifo a aro {s} {k}', [(0.04, 0), (0.07, 0), (0.07, 0.03), (0.04, 0.03)], coll, metal('cobre', '#C2703E'), segments=8,
                       subsurf=0).location = (s * 0.5, 0.35, 2.2 + k * 0.18)


def m_grifo_b(coll):
    """Vigía de la frontera: un asta alta con bandera de Aura y un catalejo."""
    cilindro(coll, 'grifo b asta', (-0.45, 0.4, 1.8), 0.035, 1.6, MAD_OSC(), seg=6)
    caja(coll, 'grifo b bandera', (-0.2, 0.4, 3.1), (0.24, 0.015, 0.16), tela('bandera vigía', '#E8892B'), p=5, sub=0)
    bola(coll, 'grifo b sol', (-0.2, 0.38, 3.1), (0.07, 0.02, 0.07), laca('sol bandera', '#FFE08A'), n=2, sub=0)
    o = clay.lathe('grifo b catalejo', [(0, 0), (0.05, 0), (0.06, 0.4), (0.07, 0.42), (0, 0.42)], coll, ORO(), segments=10, subsurf=0)
    o.location = (0.4, -0.35, 2.0)
    o.rotation_euler = (-1.2, 0, 0.5)


# ---------------------------------------------------------------------------------------------------- unicornio

def m_unicornio_fuente(coll):
    """La fuente del unicornio: pileta redonda de piedra clara con agua plateada, flores y un pedestal."""
    clara = piedra('fuente', '#ECE6DC')
    clay.lathe('fuente pileta', [(0, 0), (0.72, 0), (0.74, 0.3), (0.64, 0.32), (0.62, 0.12), (0, 0.12)], coll, clara, segments=24, subsurf=1)
    clay.lathe('fuente agua', [(0, 0.2), (0.63, 0.2), (0.63, 0.24), (0, 0.24)], coll, _mat('Escudo | agua plateada', '#BFE6FF', rough=0.05, coat=0.8,
                                                                                         emission='#9FD6FF', emission_strength=0.6), segments=24, subsurf=0)
    for k in range(8):
        a = k / 8 * math.tau
        bola(coll, f'fuente flor {k}', (math.cos(a) * 0.74, math.sin(a) * 0.74, 0.33), (0.06, 0.06, 0.04), tela('flor fuente', ('#F6C8FF', '#FFFFFF')[k % 2]), n=2,
             sub=0)
    for k in range(5):
        a = k / 5 * math.tau
        bola(coll, f'fuente brillo {k}', (math.cos(a) * 0.35, math.sin(a) * 0.35, 0.26), 0.03, luz('brillo agua', '#FFFFFF', 3.0), n=2, sub=0)


def m_unicornio_a(coll):
    """Luz plateada: un arco de plata con una media luna y estrellas colgando."""
    arco = [(-0.75, 0.35, 0.2), (-0.7, 0.35, 1.6), (0, 0.35, 2.4), (0.7, 0.35, 1.6), (0.75, 0.35, 0.2)]
    clay.sweep('unicornio a arco', arco, 0.05, coll=coll, material=PLATA(), segments=8, samples=4, caps=('flat', 'flat'), subsurf=0)
    for k in range(5):
        t = k / 4
        x = -0.55 + 1.1 * t
        z = 1.9 + 0.35 * math.sin(t * math.pi) - 0.25
        tubo(coll, f'unicornio a hilo {k}', [(x, 0.35, z + 0.3), (x, 0.35, z)], 0.006, PLATA(), seg=3)
        bola(coll, f'unicornio a estrella {k}', (x, 0.35, z - 0.04), 0.05, luz('estrella plateada', '#E8F4FF', 4.0), n=2, sub=0)


def m_unicornio_b(coll):
    """Lágrimas de alegría: tres surtidores en forma de gota alrededor de la pileta."""
    for k in range(3):
        a = k / 3 * math.tau + 0.8
        x, y = math.cos(a) * 0.82, math.sin(a) * 0.82
        clay.lathe(f'unicornio b pie {k}', [(0, 0), (0.14, 0), (0.1, 0.35), (0, 0.38)], coll, PLATA(), segments=10, subsurf=0).location = (x, y, 0)
        clay.blob(f'unicornio b gota {k}', (x, y, 0.55), (0.11, 0.11, 0.16), coll, cristal('gota', '#BFE6FF', '#7FC8FF', 1.6), n=4, subsurf=1,
                  shaper=lambda v: v * (1 - 0.35 * np.clip(v[:, 2:3] / 0.16, 0, 1)))


# ---------------------------------------------------------------------------------------------------- Fuatia

def m_fuatia_pilar(coll):
    """El pilar de Fuatia: columna de cuatro piedras (una por elemento) con una corona de cuatro engastes."""
    colores = ('#E8892B', '#4FA8E8', '#7E9B4E', '#D6E4EE')
    for k, c in enumerate(colores):
        a = k / 4 * math.tau
        clay.blob(f'fuatia piedra {k}', (math.cos(a) * 0.18, math.sin(a) * 0.18, 0.25 + k * 0.32), (0.32, 0.32, 0.18), coll, piedra(f'fuatia {c}', c), n=4,
                  shaper=ruido(k, 0.12, 4), subsurf=1)
    clay.lathe('fuatia tallo', [(0, 0), (0.22, 0), (0.18, 1.4), (0, 1.45)], coll, PIEDRA_OSC(), segments=10, subsurf=1)
    anillo(coll, 'fuatia corona', 0.24, 0.34, 1.42, 0.07, ORO(), seg=20)
    for k in range(4):
        a = k / 4 * math.tau + math.pi / 4
        tubo(coll, f'fuatia brazo {k}', [(math.cos(a) * 0.3, math.sin(a) * 0.3, 1.45), (math.cos(a) * 0.4, math.sin(a) * 0.4, 1.7)], 0.03, ORO(), seg=5)
        bola(coll, f'fuatia engaste {k}', (math.cos(a) * 0.4, math.sin(a) * 0.4, 1.72), (0.05, 0.05, 0.03), ORO(), n=2, sub=0)
    for k in range(8):
        a = k / 8 * math.tau
        bola(coll, f'fuatia runa {k}', (math.cos(a) * 0.5, math.sin(a) * 0.5, 0.03), (0.07, 0.07, 0.015), luz(f'runa fuatia {k % 4}', colores[k % 4], 2.0), n=2, sub=0)


def m_fuatia_fuego(coll):
    for k, (h, r, c) in enumerate(((0.36, 0.17, '#FF8A2A'), (0.26, 0.11, '#FFD27A'))):
        clay.sweep(f'orbe fuego {k}', [(0, 0, -0.15), (0, 0, -0.15 + h * 0.5), (0, 0, -0.15 + h)], [r, r * 0.7, 0.01], coll=coll,
                   material=luz(f'orbe fuego {k}', c, 4.0 + k), segments=10, samples=3, caps=('round', 'point'), subsurf=0)


def m_fuatia_agua(coll):
    clay.blob('orbe agua', (0, 0, 0), (0.15, 0.15, 0.2), coll, cristal('agua orbe', '#8FD3FF', '#3F98E0', 1.6), n=4, subsurf=1,
              shaper=lambda v: v * (1 - 0.4 * np.clip(v[:, 2:3] / 0.2, 0, 1)))
    anillo(coll, 'orbe agua aro', 0.2, 0.24, -0.02, 0.03, cristal('agua aro', '#CFEFFF', '#7FC8FF', 1.2))


def m_fuatia_tierra(coll):
    clay.blob('orbe tierra', (0, 0, 0), (0.17, 0.15, 0.15), coll, piedra('orbe tierra', '#8A6A4A'), n=3, shaper=ruido(4, 0.2, 8), subsurf=1)
    for k in range(3):
        a = k * 2.1
        bola(coll, f'orbe tierra hoja {k}', (math.cos(a) * 0.08, math.sin(a) * 0.08, 0.15), (0.08, 0.03, 0.03), tela('hoja orbe', '#7FB069'), n=2, sub=0)
    bola(coll, 'orbe tierra gema', (0, -0.14, 0.03), 0.04, cristal('gema tierra', '#B8E07A', '#7FB040', 1.5), n=2, sub=0)


def m_fuatia_aire(coll):
    m = luz('orbe aire', '#E8F6FF', 2.5)
    for k in range(3):
        pts = [((0.16 - 0.04 * k) * math.cos(t + k * 2.1), (0.16 - 0.04 * k) * math.sin(t + k * 2.1), -0.1 + 0.06 * k + 0.05 * t) for t in np.linspace(0, 4.4, 8)]
        clay.sweep(f'orbe aire {k}', pts, [0.035, 0.025, 0.008], coll=coll, material=m, segments=6, samples=3, caps=('round', 'point'), subsurf=0)


def m_fuatia_a(coll):
    """La Balanza: una balanza de oro sobre el pilar (los cuatro platillos en equilibrio)."""
    cilindro(coll, 'balanza poste', (0, 0, 1.75), 0.03, 0.55, ORO(), seg=8)
    tubo(coll, 'balanza brazo', [(-0.55, 0, 2.25), (0.55, 0, 2.25)], 0.03, ORO(), seg=6)
    tubo(coll, 'balanza brazo 2', [(0, -0.55, 2.2), (0, 0.55, 2.2)], 0.03, ORO(), seg=6)
    for x, y in ((-0.55, 0), (0.55, 0), (0, -0.55), (0, 0.55)):
        for k in range(3):
            a = k / 3 * math.tau
            tubo(coll, f'balanza hilo {x} {y} {k}', [(x, y, 2.22), (x + math.cos(a) * 0.1, y + math.sin(a) * 0.1, 1.98)], 0.006, ORO(), seg=3)
        clay.lathe(f'balanza plato {x} {y}', [(0, 0), (0.12, 0.02), (0.13, 0.05), (0.11, 0.045)], coll, ORO(), segments=12, subsurf=0).location = (x, y, 1.95)


def m_fuatia_b(coll):
    """Los Cuatro Núcleos: un círculo de runas de los cuatro colores en el suelo, con cuatro mojones."""
    colores = ('#E8892B', '#4FA8E8', '#7E9B4E', '#D6E4EE')
    for k, c in enumerate(colores):
        a = k / 4 * math.tau
        x, y = math.cos(a) * 0.82, math.sin(a) * 0.82
        clay.blob(f'nucleo mojón {k}', (x, y, 0.18), (0.13, 0.13, 0.2), coll, piedra(f'fuatia {c}', c), n=4, shaper=ruido(k + 2, 0.12, 6), subsurf=1)
        bola(coll, f'nucleo luz {k}', (x, y, 0.42), 0.07, luz(f'runa fuatia {k}', c, 3.0), n=2, sub=0)


# ---------------------------------------------------------------------------------------------------- proyectiles y luz

def m_bola_fuego(coll):
    bola(coll, 'bola fuego centro', (0, 0, 0), 0.16, luz('bola fuego', '#FFF0B0', 6.0), n=3)
    bola(coll, 'bola fuego capa', (0, 0.02, 0), (0.22, 0.24, 0.22), luz('fuego aura 0', '#FF9A2A', 3.5), n=3, sub=0)
    for k in range(4):
        a = k / 4 * math.tau
        clay.sweep(f'bola fuego cola {k}', [(math.cos(a) * 0.1, 0.1, math.sin(a) * 0.1), (math.cos(a) * 0.05, 0.42, math.sin(a) * 0.05)], [0.1, 0.01], coll=coll,
                   material=luz('fuego aura 1', '#FFC04A', 5.0), segments=6, samples=2, caps=('round', 'point'), subsurf=0)


def m_pluma(coll):
    clay.blob('pluma', (0, 0, 0), (0.06, 0.26, 0.015), coll, tela('pluma dorada', '#F2C94C'), n=4, subsurf=1)
    tubo(coll, 'pluma cañón', [(0, -0.3, 0), (0, 0.26, 0)], 0.008, laca('cañón', '#FFF6DC'), seg=4)
    bola(coll, 'pluma brillo', (0, -0.22, 0), 0.04, luz('brillo pluma', '#FFE9A8', 4.0), n=2, sub=0)


def m_orbe_luz(coll):
    bola(coll, 'orbe luz', (0, 0, 0), 0.12, luz('orbe plateado', '#F0F6FF', 5.0), n=3)
    bola(coll, 'orbe luz capa', (0, 0, 0), 0.17, cristal('orbe capa', '#CFE6FF', '#9FC8FF', 1.0), n=3, sub=0)


def m_estrella(coll):
    """La luz de estrellas (la moneda): una estrellita gordita de cinco puntas."""
    pts = []
    for k in range(10):
        a = k / 10 * math.tau + math.pi / 2
        r = 0.2 if k % 2 == 0 else 0.09
        pts.append((math.cos(a) * r, math.sin(a) * r))
    v = [(0, 0, 0.06), (0, 0, -0.06)] + [(x, y, 0) for x, y in pts]
    f = []
    for k in range(10):
        a, b = 2 + k, 2 + (k + 1) % 10
        f.append((0, a, b))
        f.append((1, b, a))
    o = clay.make_mesh_object('estrella', v, f, coll, material=luz('estrella moneda', '#FFE08A', 4.0))
    clay.add_subsurf(o, 1, 2)
    o.rotation_euler = (math.pi / 2, 0, 0)


def m_meteoro(coll):
    """La brasa grande que llama Eliana (Santa de Aura)."""
    clay.blob('meteoro roca', (0, 0, 0), (0.45, 0.42, 0.45), coll, piedra('meteoro', '#5A3A2A'), n=5, shaper=ruido(3, 0.18, 5), subsurf=1)
    for k in range(7):
        a = k * 2.4
        bola(coll, f'meteoro grieta {k}', (math.cos(a) * 0.38, math.sin(a) * 0.36, (k % 3 - 1) * 0.25), (0.12, 0.12, 0.05), luz('grieta meteoro', '#FF8A2A', 4.0),
             n=2, sub=0)
    clay.sweep('meteoro cola', [(0, 0.3, 0.2), (0, 1.0, 0.7), (0, 1.6, 1.2)], [0.42, 0.25, 0.01], coll=coll, material=luz('fuego aura 0', '#FF9A2A', 3.5),
               segments=8, samples=3, caps=('round', 'point'), subsurf=0)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Escudo torres')
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
    exportar_glb.exportar(objs, os.path.join(out, 'escudo_torres.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
