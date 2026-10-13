"""Nuestro Hogar · granja: las herramientas en la mano (herramientas3d.ts).

Azada, hacha, pico, guadaña, regadera, caña y espada, con la misma convención de herramientas3d.ts: el mango a lo largo
de +y, de y = -0,53 (la punta de abajo) a y ≈ 0,13, y la cabeza arriba (así no cambian la mano ni el golpe). Las
partes llevan materiales con nombre fijo («h metal», «h filo», «h mango», «h agarre», «h adorno»): el juego los cambia
por los de la calidad (Básica, Cobre, Hierro, Acero estelar y Cristal de Celia). Además, las de una sola calidad:
el balde de ordeñar, las tijeras de esquilar y la bolsita de semillas, con sus colores. Medidas de three.js. Cada pieza
queda bajo un vacío «m_<clave>» en granja_herramientas.glb.

Uso: blender -b -P granja_herramientas.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
from regalos import tela  # noqa: E402
from granja_muebles import bola, caja, mat, tubo  # noqa: E402

METAL = lambda: mat('h metal', '#9AA4A2', 0.4)  # noqa: E731
FILO = lambda: mat('h filo', '#D9E2E0', 0.3)  # noqa: E731
MANGO = lambda: mat('h mango', '#926B45', 0.75)  # noqa: E731
AGARRE = lambda: mat('h agarre', '#5F4330', 0.85)  # noqa: E731
ADORNO = lambda: mat('h adorno', '#C9A15A', 0.4)  # noqa: E731


def C(x, y, z):
    return (x, -z, y)


def H(w, h, d):
    return (w / 2, d / 2, h / 2)


def bloque(coll, nombre, medidas, centro, material, p=6, sub=1, giro=0.0):
    o = caja(coll, nombre, (0, 0, 0), H(*medidas), material, p=p, sub=sub)
    o.location = C(*centro)
    o.rotation_euler = (0, -giro, 0)
    return o


def palo(coll, nombre, a, b, r, material, seg=8):
    return tubo(coll, nombre, [C(*a), C(*b)], r, material, seg=seg)


def mango(coll, largo=0.66, arriba=0.13, r=0.03):
    """El mango gordito con su agarre de cuero enrollado, la puntera redonda y el anillo de arriba."""
    abajo = arriba - largo
    palo(coll, 'mango', (0, abajo + 0.02, 0), (0, arriba, 0), r, MANGO(), seg=10)
    bola(coll, 'puntera', C(0, abajo, 0), (r * 1.25,) * 3, ADORNO(), n=3)
    for k in range(5):
        o = clay.lathe(f'agarre {k}', [(r * 1.05, -0.012), (r * 1.22, 0.0), (r * 1.05, 0.012)], coll, AGARRE(), segments=12, subsurf=1,
                       cap_bottom=False, cap_top=False)
        o.location = C(0, -0.27 + k * 0.03, 0)
    o = clay.lathe('anillo', [(r * 1.1, -0.015), (r * 1.35, 0.0), (r * 1.1, 0.015)], coll, ADORNO(), segments=12, subsurf=1, cap_bottom=False,
                   cap_top=False)
    o.location = C(0, arriba - 0.03, 0)


def m_h_azada(coll):
    mango(coll)
    bloque(coll, 'cuello', (0.07, 0.07, 0.07), (0, 0.15, 0.02), METAL(), p=5)
    bloque(coll, 'hoja azada', (0.27, 0.05, 0.2), (0, 0.15, 0.13), METAL(), p=7)
    bloque(coll, 'filo azada', (0.27, 0.03, 0.03), (0, 0.15, 0.235), FILO(), p=8)
    for x in (-0.08, 0.08):
        bola(coll, f'remache {x}', C(x, 0.18, 0.1), (0.016, 0.016, 0.01), ADORNO(), n=2, sub=0)


def m_h_hacha(coll):
    mango(coll)
    bloque(coll, 'ojo hacha', (0.09, 0.12, 0.08), (0.0, 0.12, 0), METAL(), p=5)
    # La cabeza: una cuña gordita con el filo curvo
    bloque(coll, 'cuna hacha', (0.2, 0.17, 0.06), (0.12, 0.12, 0), METAL(), p=4)
    o = clay.lathe('filo hacha', [(0.0, -0.035), (0.14, -0.03), (0.15, 0.0), (0.14, 0.03), (0.0, 0.035)], coll, FILO(), segments=20, subsurf=1)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = C(0.13, 0.12, 0)
    o.scale = (1.0, 0.25, 1.0)
    bloque(coll, 'nuca hacha', (0.06, 0.09, 0.07), (-0.07, 0.12, 0), ADORNO(), p=5)


def m_h_pico(coll):
    mango(coll)
    bloque(coll, 'ojo pico', (0.09, 0.1, 0.08), (0, 0.15, 0), METAL(), p=5)
    for s in (-1, 1):
        pts = [C(s * 0.04, 0.15, 0), C(s * 0.16, 0.14, 0), C(s * 0.25, 0.1, 0), C(s * 0.29, 0.05, 0)]
        clay.sweep(f'punta pico {s}', pts, [0.04, 0.034, 0.022, 0.006], profile=(1.0, 0.8), coll=coll, material=METAL(), segments=8, samples=4,
                   caps=('round', 'point'), subsurf=0)
    bola(coll, 'brillo pico', C(-0.25, 0.08, 0), (0.014, 0.014, 0.014), FILO(), n=2, sub=0)


def m_h_guadana(coll):
    mango(coll, largo=0.7)
    bloque(coll, 'abrazadera', (0.08, 0.06, 0.07), (0, 0.13, 0), ADORNO(), p=5)
    pts = [C(0.02, 0.14, 0), C(0.16, 0.2, 0), C(0.3, 0.16, 0), C(0.38, 0.06, 0)]
    clay.sweep('hoja guadana', pts, [0.045, 0.05, 0.035, 0.006], profile=(1.0, 0.22), coll=coll, material=METAL(), segments=8, samples=6,
               caps=('round', 'point'), subsurf=1)
    pts = [C(0.03, 0.115, 0), C(0.16, 0.17, 0), C(0.29, 0.135, 0), C(0.36, 0.05, 0)]
    clay.sweep('filo guadana', pts, [0.012, 0.014, 0.01, 0.003], profile=(1.0, 0.3), coll=coll, material=FILO(), segments=6, samples=6,
               caps=('round', 'point'), subsurf=0)
    palo(coll, 'manija', (0, -0.14, 0), (0.08, -0.12, 0.02), 0.016, MANGO())


def m_h_espada(coll):
    # La empuñadura (lo que la mano agarra) y la hoja hacia arriba
    palo(coll, 'empunadura', (0, -0.3, 0), (0, -0.14, 0), 0.03, AGARRE())
    bola(coll, 'pomo', C(0, -0.32, 0), (0.04,) * 3, ADORNO(), n=3)
    bloque(coll, 'guarda', (0.22, 0.04, 0.06), (0, -0.12, 0), ADORNO(), p=5)
    for s in (-1, 1):
        bola(coll, f'remate guarda {s}', C(s * 0.115, -0.12, 0), (0.025,) * 3, ADORNO(), n=3)
    hoja = clay.lathe('hoja', [(0.0, 0.0), (0.042, 0.0), (0.04, 0.42), (0.0, 0.52)], coll, METAL(), segments=4, subsurf=1)
    hoja.location = C(0, -0.1, 0)
    hoja.scale = (1.0, 0.32, 1.0)
    palo(coll, 'canal', (0, -0.08, 0.016), (0, 0.3, 0.016), 0.008, FILO(), seg=4)
    bola(coll, 'gema espada', C(0, -0.12, 0.03), (0.018, 0.012, 0.018), FILO(), n=2, sub=0)


def m_h_cana(coll):
    palo(coll, 'vara', (0, -0.5, 0), (0, 1.1, 0), 0.016, MANGO(), seg=6)
    palo(coll, 'puntita', (0, 1.1, 0), (0, 1.2, 0), 0.008, FILO(), seg=4)
    o = clay.lathe('carrete', [(0.0, -0.035), (0.06, -0.035), (0.065, 0.0), (0.06, 0.035), (0.0, 0.035)], coll, METAL(), segments=16, subsurf=1)
    o.rotation_euler = (0, math.pi / 2, 0)
    o.location = C(0.05, -0.15, 0)
    palo(coll, 'manivela', (0.09, -0.15, 0), (0.12, -0.2, 0), 0.008, ADORNO(), seg=4)
    for k in range(4):
        o = clay.lathe(f'anilla {k}', [(0.018, -0.004), (0.024, 0.0), (0.018, 0.004)], coll, ADORNO(), segments=10, subsurf=0, cap_bottom=False,
                       cap_top=False)
        o.location = C(0.02, 0.1 + k * 0.28, 0)
        o.rotation_euler = (0, math.pi / 2, 0)
    palo(coll, 'agarre cana', (0, -0.45, 0), (0, -0.22, 0), 0.024, AGARRE())
    # El hilo y el corcho rojo y blanco
    palo(coll, 'hilo', (0, 1.2, 0), (0.06, 0.85, 0.02), 0.003, mat('h hilo', '#F2EBDD', 0.6), seg=3)
    bola(coll, 'corcho rojo', C(0.06, 0.83, 0.02), (0.03, 0.025, 0.03), mat('h corcho rojo', '#E4574B', 0.5), n=3)
    bola(coll, 'corcho blanco', C(0.06, 0.8, 0.02), (0.028, 0.02, 0.028), mat('h corcho blanco', '#FFF8EA', 0.5), n=3)


def m_h_regadera(coll):
    """Regadera redonda (la mano la agarra por el asa de arriba): cuerpo, pico largo con su flor y el asa."""
    o = clay.lathe('cuerpo regadera', [(0.0, 0.0), (0.13, 0.0), (0.17, 0.08), (0.165, 0.2), (0.12, 0.26), (0.0, 0.27)], coll, METAL(), segments=20,
                   subsurf=1)
    o.location = C(0, -0.32, 0)
    tubo(coll, 'pico regadera', [C(0, -0.25, 0.12), C(0, -0.14, 0.26), C(0, -0.08, 0.36)], 0.025, METAL(), seg=8)
    o = clay.lathe('flor regadera', [(0.0, 0.0), (0.05, 0.0), (0.06, 0.03), (0.0, 0.035)], coll, FILO(), segments=12, subsurf=1)
    o.location = C(0, -0.08, 0.37)
    o.rotation_euler = (math.radians(-60), 0, 0)
    tubo(coll, 'asa regadera', [C(0, -0.08, -0.1), C(0, 0.02, -0.03), C(0, 0.02, 0.05), C(0, -0.06, 0.1)], 0.022, ADORNO(), seg=6)
    o = clay.lathe('aro regadera', [(0.165, -0.012), (0.18, 0.0), (0.165, 0.012)], coll, ADORNO(), segments=20, subsurf=1, cap_bottom=False,
                   cap_top=False)
    o.location = C(0, -0.18, 0)
    for k in range(3):
        a = k * 2.1
        bola(coll, f'gota regadera {k}', C(math.cos(a) * 0.03, -0.12 - k * 0.03, 0.42 + k * 0.02), (0.012, 0.016, 0.012), mat('h agua', '#8FD3F2', 0.1),
             n=2, sub=0)


def m_h_cubo(coll):
    lata = mat('h balde', '#ABB5B4', 0.45)
    o = clay.lathe('balde', [(0.0, 0.0), (0.12, 0.0), (0.16, 0.24), (0.17, 0.25), (0.15, 0.25), (0.11, 0.02), (0.0, 0.02)], coll, lata, segments=20,
                   subsurf=1)
    o.location = C(0, -0.27, 0)
    for z in (0.06, 0.16):
        o = clay.lathe(f'aro balde {z}', [(0.13 + z * 0.15, -0.008), (0.14 + z * 0.15, 0.0), (0.13 + z * 0.15, 0.008)], coll, mat('h aro', '#8B9694', 0.4),
                       segments=20, subsurf=0, cap_bottom=False, cap_top=False)
        o.location = C(0, -0.27 + z, 0)
    tubo(coll, 'asa balde', [C(-0.16, -0.04, 0), C(-0.1, 0.06, 0), C(0.1, 0.06, 0), C(0.16, -0.04, 0)], 0.012, mat('h aro', '#8B9694', 0.4), seg=6)
    o = clay.lathe('leche', [(0.0, 0.0), (0.14, 0.0)], coll, mat('h leche', '#FFFBF0', 0.3), segments=20, subsurf=0, cap_bottom=False, cap_top=False)
    o.location = C(0, -0.05, 0)


def m_h_tijeras(coll):
    hoja = mat('h tijera', '#C8D5D1', 0.3)
    for s in (-1, 1):
        o = bloque(coll, f'hoja tijera {s}', (0.05, 0.34, 0.02), (s * 0.03, 0.02, 0), hoja, p=4, giro=s * 0.12)
        o = clay.lathe(f'ojo tijera {s}', [(0.04, -0.012), (0.055, 0.0), (0.04, 0.012)], coll, mat('h ojo tijera', '#AE8F61', 0.6), segments=14, subsurf=1,
                       cap_bottom=False, cap_top=False)
        o.location = C(s * 0.06, -0.22, 0)
        o.rotation_euler = (math.pi / 2, 0, 0)
    bola(coll, 'tornillo', C(0, -0.12, 0.012), (0.02, 0.01, 0.02), mat('h tornillo', '#8B9694', 0.4), n=2, sub=0)
    bola(coll, 'mechón', C(0.0, 0.2, 0.02), (0.05, 0.04, 0.04), tela('h lana', '#F4EEE2'), n=4)


def m_h_semillas(coll):
    bolsa = tela('h bolsa semillas', '#C4A67A')
    bola(coll, 'bolsita', C(0, -0.15, 0), (0.13, 0.12, 0.17), bolsa, n=8)
    o = clay.lathe('amarre', [(0.05, -0.012), (0.06, 0.0), (0.05, 0.012)], coll, tela('h cabuya', '#8A6A44'), segments=12, subsurf=0, cap_bottom=False,
                   cap_top=False)
    o.location = C(0, -0.01, 0)
    bola(coll, 'copete bolsa', C(0, 0.03, 0), (0.06, 0.05, 0.05), bolsa, n=4)
    bola(coll, 'etiqueta hoja', C(0, -0.14, 0.12), (0.05, 0.012, 0.04), mat('h hojita', '#7FB069', 0.6), n=2, sub=0)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Herramientas granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_herramientas.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
