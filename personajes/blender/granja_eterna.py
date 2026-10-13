"""Nuestro Hogar · granja: Eterna, la casa boutique de Sopetrán donde es la boda de la película de Astra
(docs/en-obra/pelicula-de-astra.md, capítulo 4). Hecha en el estilo del juego (madera, fieltro, laca, formas redondas)
a partir de cómo se ve el lugar de verdad:

  pabellon           el salón blanco de techo plano con vigas negras, un tragaluz con enredaderas y lucecitas
  cabana_a           las cabañas en A con frente de madera y techo gris oscuro
  piscina            la piscina con su jacuzzi redondo y dos asoleadoras
  arbol_grande       el árbol enorme de tronco claro, ramas abiertas y musgo
  mesa_larga         la mesa de la fiesta: mantel blanco, velas altas, calas y rosas blancas, platos
  arco_boda          el arco de rosas blancas de la ceremonia
  deck_rio           el muelle de madera junto al río, con baranda
  fogata_piedras     el círculo de piedras con leños (el fuego lo pone el juego)
  guirnalda          una cuerda de bombillos entre dos postes
  platanillo         la planta tropical de hojas grandes con flores rojas
  silla_boda         la silla blanca de los invitados, con su lazo
  vela_camino        las velas altas del camino

Un solo GLB: granja_eterna.glb.  Uso: blender -b -P granja_eterna.py -- <carpeta_salida> [claves]
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
from granja_muebles import bola, caja, cilindro, mat, piedra, tubo  # noqa: E402
from granja_festivales import flor  # noqa: E402
from granja_monte import grumo, tronco  # noqa: E402

RNG = np.random.default_rng(1025)
BLANCO = lambda: laca('blanco eterna', '#FAF7F1', 0.45)  # noqa: E731
NEGRO = lambda: laca('viga negra', '#22201F', 0.5)  # noqa: E731
HOJA = lambda k=0: (tela('hoja tropical', '#4E8A3E'), tela('hoja tropical clara', '#6FA850'))[k % 2]  # noqa: E731


def m_pabellon(coll):
    """Salón abierto de 8 × 6 m: piso claro, columnas negras delgadas, techo plano blanco con un tragaluz cuadrado del
    que cuelgan enredaderas, y lucecitas en el techo."""
    caja(coll, 'piso pabellon', (0, 0, 0.08), (4.2, 3.2, 0.08), mat('piso claro', '#E9E2D6', 0.8), p=6, sub=0)
    for x in (-3.9, -1.3, 1.3, 3.9):
        for y in (-2.9, 2.9):
            caja(coll, f'columna {x} {y}', (x, y, 1.55), (0.07, 0.07, 1.45), NEGRO(), p=10, sub=0)
    # Techo: cuatro losas alrededor del tragaluz, con el borde negro
    for c, h in (((0, -2.05, 3.08), (4.3, 1.15, 0.1)), ((0, 2.05, 3.08), (4.3, 1.15, 0.1)), ((-2.65, 0, 3.08), (1.65, 0.9, 0.1)), ((2.65, 0, 3.08), (1.65, 0.9, 0.1))):
        caja(coll, f'techo {c[0]} {c[1]}', c, h, BLANCO(), p=8, sub=0)
    for y in (-3.2, 3.2):
        caja(coll, f'canto techo {y}', (0, y, 3.08), (4.35, 0.06, 0.12), NEGRO(), p=10, sub=0)
    for x in (-4.3, 4.3):
        caja(coll, f'canto techo x {x}', (x, 0, 3.08), (0.06, 3.25, 0.12), NEGRO(), p=10, sub=0)
    for x in (-1.0, 1.0):
        caja(coll, f'viga tragaluz {x}', (x, 0, 3.0), (0.06, 0.95, 0.06), NEGRO(), p=10, sub=0)
    # Enredaderas que cuelgan del tragaluz
    for k in range(12):
        a = k / 12 * math.tau
        x, y = math.cos(a) * 1.0, math.sin(a) * 0.85
        largo = 0.5 + RNG.random() * 0.9
        tubo(coll, f'enredadera {k}', [(x, y, 2.98), (x * 0.96, y * 0.96, 2.98 - largo * 0.5), (x * 0.93, y * 0.93, 2.98 - largo)], 0.018, tela('tallo', '#4E7A3A'), seg=5)
        for j in range(3):
            bola(coll, f'hoja enredadera {k} {j}', (x * 0.95, y * 0.95, 2.95 - largo * (j + 0.6) / 3), (0.07, 0.04, 0.05), HOJA(k + j), n=2, sub=0)
    # Lucecitas en el techo
    for x in (-3, -1.6, 1.6, 3):
        for y in (-2.2, -1.2, 1.2, 2.2):
            bola(coll, f'luz techo {x} {y}', (x, y, 2.96), 0.05, luz('luz techo', '#FFE9B8', 3.0), n=2, sub=0)


def m_cabana_a(coll):
    """Cabaña en A (≈3,4 m de alto): frente de madera con ventana redonda y puerta, techo gris oscuro hasta el piso."""
    gris = mat('techo cabaña', '#3E4246', 0.8)
    for s in (-1, 1):
        o = caja(coll, f'techo cabaña {s}', (0, 0, 0), (0.08, 2.2, 1.95), gris, p=6, sub=0)
        o.location = (s * 0.95, 0, 1.65)
        o.rotation_euler = (0, -s * 0.53, 0)
    # Frente triangular de madera
    verts = [(-1.85, -2.1, 0.0), (1.85, -2.1, 0.0), (0.0, -2.1, 3.35), (-1.85, -2.0, 0.0), (1.85, -2.0, 0.0), (0.0, -2.0, 3.35)]
    caras = [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    clay.make_mesh_object('frente cabaña', verts, caras, coll, material=madera('frente cabaña', '#C98A55'))
    for k in range(7):
        caja(coll, f'tabla frente {k}', (-1.5 + k * 0.5, -2.13, 0.9), (0.012, 0.01, 0.9 - abs(k - 3) * 0.2), madera('junta', '#9A6638'), p=10, sub=0)
    caja(coll, 'puerta cabaña', (0, -2.15, 0.95), (0.42, 0.04, 0.95), madera('puerta cabaña', '#7A4E2E'), p=8, sub=0)
    bola(coll, 'pomo cabaña', (0.3, -2.2, 0.95), 0.04, mat('latón', '#D9B45A', 0.3), n=2, sub=0)
    clay.lathe('ventana redonda', [(0.0, -0.03), (0.32, -0.03), (0.32, 0.03), (0.0, 0.03)], coll, luz('vidrio cabaña', '#FFE3A8', 1.6), segments=18,
               subsurf=0).location = (0, -2.16, 2.3)
    bpy.context.view_layer.objects.active = None
    caja(coll, 'escalón cabaña', (0, -2.4, 0.08), (0.7, 0.3, 0.08), madera('escalón', '#A8774F'), p=8, sub=0)
    for s in (-1, 1):
        clay.blob(f'matera cabaña {s}', (s * 1.2, -2.35, 0.2), (0.22, 0.22, 0.2), coll, laca('matera', '#F2EFE6'), n=3, p=2.0)
        grumo(coll, f'planta matera {s}', (s * 1.2, -2.35, 0.48), (0.25, 0.25, 0.25), HOJA(s), s)


def m_piscina(coll):
    """Piscina de 6 × 3 m con borde blanco, agua azul clara y un jacuzzi redondo; dos asoleadoras blancas."""
    for c, h in (((0, -1.62, 0.08), (3.2, 0.14, 0.08)), ((0, 1.62, 0.08), (3.2, 0.14, 0.08)), ((-3.12, 0, 0.08), (0.14, 1.62, 0.08)), ((3.12, 0, 0.08), (0.14, 1.62, 0.08))):
        caja(coll, f'borde piscina {c[0]} {c[1]}', c, h, BLANCO(), p=8, sub=0)
    caja(coll, 'agua piscina', (0, 0, 0.05), (3.0, 1.5, 0.02), mat('agua piscina', '#5FC4D9', 0.1, emission='#2A8FA8', emission_strength=0.25), p=6, sub=0)
    clay.lathe('borde jacuzzi', [(0.95, 0.0), (1.12, 0.0), (1.12, 0.28), (0.95, 0.28)], coll, BLANCO(), segments=24, subsurf=0).location = (4.4, 0.4, 0)
    clay.lathe('agua jacuzzi', [(0.0, 0.2), (0.96, 0.2), (0.96, 0.22), (0.0, 0.22)], coll, mat('agua jacuzzi', '#7AD4E4', 0.1), segments=24, subsurf=0).location = (4.4, 0.4, 0)
    for k, x in enumerate((-1.4, 0.8)):
        caja(coll, f'asoleadora {k}', (x, -2.6, 0.32), (0.32, 0.9, 0.06), BLANCO(), p=8)
        o = caja(coll, f'espaldar asoleadora {k}', (0, 0, 0), (0.32, 0.35, 0.05), BLANCO(), p=8)
        o.location = (x, -1.9, 0.55)
        o.rotation_euler = (0.9, 0, 0)
        caja(coll, f'cojín asoleadora {k}', (x, -2.65, 0.4), (0.28, 0.78, 0.04), tela('cojín', '#E8DCC8'), p=6)
        for sy in (-0.7, 0.7):
            cilindro(coll, f'pata asoleadora {k} {sy}', (x, -2.6 + sy, 0.0), 0.04, 0.26, NEGRO(), seg=6)


def m_arbol_grande(coll):
    """El árbol enorme (≈9 m): tronco claro y grueso, ramas abiertas como brazos, musgo colgando y una copa ancha."""
    tronco(coll, 'tronco grande', 3.6, 0.75, 0.38, raices=6)
    for k in range(6):
        a = k / 6 * math.tau + 0.3
        l = 2.4 + (k % 2) * 0.8
        z = 3.2 + (k % 3) * 0.35
        clay.sweep(f'rama grande {k}', [(0, 0, z - 0.6), (math.cos(a) * l * 0.5, math.sin(a) * l * 0.5, z + 0.4), (math.cos(a) * l, math.sin(a) * l, z + 1.3)],
                   [0.32, 0.2, 0.12], coll=coll, material=madera('corteza clara', '#B9A68E'), segments=7, samples=3, caps=('flat', 'round'), subsurf=0)
        grumo(coll, f'copa grande {k}', (math.cos(a) * l, math.sin(a) * l, z + 1.9), (1.9, 1.9, 1.3), HOJA(k), k * 2.3)
        for j in range(3):
            tubo(coll, f'musgo {k} {j}', [(math.cos(a) * l * (0.4 + j * 0.2), math.sin(a) * l * (0.4 + j * 0.2), z + 0.5), (math.cos(a) * l * (0.4 + j * 0.2), math.sin(a) * l * (0.4 + j * 0.2), z - 0.4)],
                 0.05, tela('musgo colgante', '#8FA86A'), seg=5)
    grumo(coll, 'copa grande centro', (0, 0, 6.6), (2.4, 2.4, 1.6), HOJA(1), 9.1)


def m_mesa_larga(coll):
    """La mesa de la fiesta (4 m): mantel blanco hasta el piso, velas altas, calas y rosas blancas, platos y copas."""
    caja(coll, 'mantel', (0, 0, 0.42), (2.0, 0.5, 0.42), tela('mantel', '#FBF8F2'), p=6)
    caja(coll, 'tabla mesa', (0, 0, 0.86), (2.02, 0.52, 0.03), tela('mantel', '#FBF8F2'), p=8, sub=0)
    for k in range(9):
        x = -1.8 + k * 0.45
        if k % 2 == 0:
            cilindro(coll, f'vela alta {k}', (x, 0, 0.89), 0.035, 0.5, laca('vela', '#FFFDF6'), seg=10)
            bola(coll, f'llama {k}', (x, 0, 1.42), (0.025, 0.025, 0.05), luz('llama', '#FFC66A', 6.0), n=2, sub=0)
        else:
            clay.lathe(f'florero {k}', [(0.0, 0.0), (0.07, 0.0), (0.05, 0.18), (0.06, 0.24), (0.0, 0.24)], coll, mat('vidrio', '#E6F2F0', 0.1), segments=12,
                       subsurf=0).location = (x, 0, 0.89)
            for j in range(3):
                flor(coll, f'rosa blanca {k} {j}', (x + (j - 1) * 0.07, 0.03 * j, 1.18 + j * 0.03), 0.07, '#FBF6EE', centro='#F2E6C0')
            tubo(coll, f'cala {k}', [(x, 0.05, 0.95), (x + 0.04, 0.06, 1.3)], 0.012, tela('tallo', '#4E7A3A'), seg=5)
            bola(coll, f'flor cala {k}', (x + 0.05, 0.06, 1.34), (0.05, 0.035, 0.08), laca('cala', '#FFFFFF'), n=2, sub=0)
    for k in range(8):
        for s in (-1, 1):
            x = -1.75 + k * 0.5
            clay.lathe(f'plato {k} {s}', [(0.0, 0.0), (0.16, 0.0), (0.18, 0.02), (0.0, 0.02)], coll, laca('plato', '#FFFFFF'), segments=14, subsurf=0).location = (x, s * 0.33, 0.895)
            clay.lathe(f'copa {k} {s}', [(0.0, 0.0), (0.04, 0.0), (0.008, 0.02), (0.008, 0.09), (0.04, 0.12), (0.045, 0.18), (0.0, 0.18)], coll, mat('vidrio', '#E6F2F0', 0.1),
                       segments=10, subsurf=0).location = (x + 0.18, s * 0.28, 0.89)


def m_arco_boda(coll):
    """El arco de la ceremonia: estructura blanca de 2,4 m cubierta de rosas blancas y hojas."""
    for s in (-1, 1):
        cilindro(coll, f'poste boda {s}', (s * 1.15, 0, 0.0), 0.06, 2.4, BLANCO(), seg=10)
    pts = [(-1.15, 0, 2.4), (-0.85, 0, 2.95), (0, 0, 3.25), (0.85, 0, 2.95), (1.15, 0, 2.4)]
    tubo(coll, 'arco boda', pts, 0.06, BLANCO(), seg=8)
    for k in range(34):
        t = k / 33
        if t < 0.3:
            x, z = -1.15, 0.2 + t / 0.3 * 2.2
        elif t > 0.7:
            x, z = 1.15, 0.2 + (1 - t) / 0.3 * 2.2
        else:
            a = math.pi * (t - 0.3) / 0.4
            x, z = -math.cos(a) * 1.15, 2.4 + math.sin(a) * 0.85
        if k % 3 == 0:
            grumo(coll, f'hojas boda {k}', (x, 0, z), (0.22, 0.26, 0.2), HOJA(k), k)
        flor(coll, f'rosa boda {k}', (x + (RNG.random() - 0.5) * 0.12, -0.2, z), 0.11 + RNG.random() * 0.04, ('#FFFFFF', '#FBF3EA', '#F6EEE8')[k % 3], centro='#F0E2C2', cara='y')


def m_deck_rio(coll):
    """Muelle de tablas (5 × 3 m) sobre pilotes, con baranda de madera por tres lados."""
    for k in range(17):
        caja(coll, f'tabla deck {k}', (-2.4 + k * 0.3, 0, 0.3), (0.13, 1.5, 0.04), madera('tabla deck', ('#B98A5E', '#A8774F')[k % 2]), p=8, sub=0)
    for x in (-2.3, 0, 2.3):
        for y in (-1.4, 1.4):
            cilindro(coll, f'pilote deck {x} {y}', (x, y, -0.24), 0.1, 0.5, madera('pilote', '#7A5236'), seg=8)
    for x in (-2.45, 2.45):
        caja(coll, f'baranda lado {x}', (x, 0, 0.85), (0.04, 1.5, 0.04), madera('baranda', '#8A5E3C'), p=8, sub=0)
        for y in (-1.4, 0, 1.4):
            caja(coll, f'balaustre {x} {y}', (x, y, 0.6), (0.04, 0.04, 0.27), madera('baranda', '#8A5E3C'), p=8, sub=0)
    caja(coll, 'baranda fondo', (0, 1.5, 0.85), (2.45, 0.04, 0.04), madera('baranda', '#8A5E3C'), p=8, sub=0)


def m_fogata_piedras(coll):
    """Círculo de piedras redondas con tres leños cruzados."""
    for k in range(11):
        a = k / 11 * math.tau
        clay.blob(f'piedra fogata {k}', (math.cos(a) * 0.62, math.sin(a) * 0.62, 0.1), (0.17, 0.15, 0.13), coll, piedra('piedra fogata', '#8E8A84'), n=3, p=2.2)
    # Los leños, parados en tipi sobre las brasas
    for k in range(4):
        a = k / 4 * math.tau + 0.4
        tubo(coll, f'leño {k}', [(math.cos(a) * 0.45, math.sin(a) * 0.45, 0.07), (math.cos(a) * 0.04, math.sin(a) * 0.04, 0.55)], 0.06, madera('leño', '#6B4A33'), seg=8)
    bola(coll, 'brasas', (0, 0, 0.08), (0.3, 0.3, 0.06), luz('brasas', '#FF7A2A', 3.0), n=2, sub=0)


def m_guirnalda(coll):
    """Cuerda de bombillos colgando entre dos postes negros (6 m)."""
    for x in (-3, 3):
        cilindro(coll, f'poste guirnalda {x}', (x, 0, 0.0), 0.05, 3.0, NEGRO(), seg=8)
    pts = [(-3 + 6 * k / 10, 0, 2.9 - math.sin(math.pi * k / 10) * 0.6) for k in range(11)]
    tubo(coll, 'cuerda guirnalda', pts, 0.012, NEGRO(), seg=4)
    for k in range(1, 10):
        x, _, z = pts[k]
        bola(coll, f'bombillo {k}', (x, 0, z - 0.08), (0.05, 0.05, 0.07), luz('bombillo', '#FFE2A0', 4.0), n=2, sub=0)


def m_platanillo(coll):
    """Platanillo (heliconia): tallos, hojas largas como remos y flores rojas en zigzag."""
    for k in range(5):
        a = k * 1.3
        r = 0.25 + (k % 2) * 0.15
        tubo(coll, f'tallo platanillo {k}', [(math.cos(a) * 0.1, math.sin(a) * 0.1, 0), (math.cos(a) * r, math.sin(a) * r, 1.0 + k * 0.12)], 0.035, tela('tallo', '#4E7A3A'), seg=5)
        bola(coll, f'hoja platanillo {k}', (math.cos(a) * (r + 0.25), math.sin(a) * (r + 0.25), 1.15 + k * 0.12), (0.12, 0.45, 0.04), HOJA(k), n=3)
    for j in range(5):
        bola(coll, f'flor platanillo {j}', (0.05 * (-1) ** j, 0.0, 0.9 + j * 0.13), (0.06, 0.13, 0.04), laca('flor platanillo', ('#E2462E', '#F2A12E')[j % 2]), n=2, sub=0)


def m_silla_boda(coll):
    """Silla blanca de invitado con un lazo de cinta en el espaldar."""
    caja(coll, 'asiento silla', (0, 0, 0.45), (0.22, 0.22, 0.03), BLANCO(), p=8)
    for x in (-0.19, 0.19):
        for y in (-0.19, 0.19):
            cilindro(coll, f'pata silla {x} {y}', (x, y, 0.0), 0.02, 0.45, BLANCO(), seg=6)
    for x in (-0.19, 0.19):
        cilindro(coll, f'espaldar silla {x}', (x, 0.19, 0.47), 0.02, 0.55, BLANCO(), seg=6)
    caja(coll, 'travesaño silla', (0, 0.19, 0.95), (0.2, 0.02, 0.05), BLANCO(), p=8)
    for s in (-1, 1):
        bola(coll, f'lazo silla {s}', (s * 0.07, 0.22, 0.8), (0.07, 0.02, 0.04), tela('cinta', '#F4E3C6'), n=2, sub=0)
    bola(coll, 'nudo lazo', (0, 0.22, 0.8), 0.025, tela('cinta', '#F4E3C6'), n=2, sub=0)


def m_vela_camino(coll):
    """Vela alta del camino en su farol de vidrio."""
    clay.lathe('base vela camino', [(0.0, 0.0), (0.12, 0.0), (0.12, 0.05), (0.0, 0.05)], coll, NEGRO(), segments=10, subsurf=0)
    cilindro(coll, 'vela camino', (0, 0, 0.05), 0.05, 0.3, laca('vela', '#FFFDF6'), seg=10)
    bola(coll, 'llama camino', (0, 0, 0.39), (0.03, 0.03, 0.06), luz('llama', '#FFC66A', 6.0), n=2, sub=0)
    # Farolito abierto: cuatro varillas negras y un aro arriba (el vidrio no deja ver la llama)
    for k in range(4):
        a = k / 4 * math.tau + math.pi / 4
        cilindro(coll, f'varilla farol {k}', (math.cos(a) * 0.105, math.sin(a) * 0.105, 0.05), 0.008, 0.45, NEGRO(), seg=5)
    clay.lathe('aro farol', [(0.09, 0.48), (0.12, 0.48), (0.12, 0.51), (0.09, 0.51)], coll, NEGRO(), segments=12, subsurf=0)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Eterna')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_eterna.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
