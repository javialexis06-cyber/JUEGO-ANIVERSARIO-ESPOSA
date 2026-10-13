"""Nuestro Hogar · granja: el patio de los refugios y lo que hay en él.

- patio_suelo: el caminito pisado de lajas y tierra desde la puerta, paja regada, el bebedero de piedra con agua y el
  comedero de tablas con paja (arte.ts patioRefugio, local x 0..4 × z 4..8); patio_maiz: los granitos de maíz de los
  gallineros.
- ampliacion_2 / ampliacion_3: las columnas y el letrero del refugio ampliado (construccion-render.ts detalleAmpliacion).
- incubadora y huevo_incubado (ganaderia-render.ts incubadoraVista): la caja de madera con heno, lámpara y techito;
  el huevo va aparte (el juego lo pone si hay uno y lo agranda si es grande).
- trufa (trufaVista) y nido / nido_huevo (huevosRefugio): el nido de paja y un huevo (el juego pone hasta tres y les
  cambia el color según la especie: material «patio huevo»).

Medidas de three.js. Cada pieza queda bajo un vacío «m_<clave>» en granja_patio.glb.

Uso: blender -b -P granja_patio.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import luz, madera, tela  # noqa: E402
from granja_muebles import mat, metal, piedra  # noqa: E402

TIERRA = lambda: mat('patio tierra', '#B08F68', 0.95)  # noqa: E731
TIERRA_CLARA = lambda: mat('patio tierra clara', '#C4A57C', 0.95)  # noqa: E731
PAJA = lambda: mat('patio paja', '#E3C77A', 0.9)  # noqa: E731
PAJA_OSC = lambda: mat('patio paja oscura', '#C9A95C', 0.9)  # noqa: E731
MADERA_P = lambda: madera('patio madera', '#8F6A4C')  # noqa: E731
PIEDRA_P = lambda: piedra('patio piedra', '#A9A596')  # noqa: E731
LAJA = lambda: piedra('patio laja', '#BDB7A8')  # noqa: E731
AGUA = lambda: mat('patio agua', '#7FBCD0', 0.08, coat=1.0)  # noqa: E731


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


def caja(coll, nombre, medidas, centro, material, p=12, rot=(0.0, 0.0, 0.0)):
    w, h, d = medidas
    o = clay.rbox(nombre, (0, 0, 0), (w / 2, d / 2, h / 2), coll, material, p=p, n=5, subsurf=0)
    return girar(en(o, centro), *rot)


def bola(coll, nombre, centro, radios, material, n=3, sub=1, rot=(0.0, 0.0, 0.0), shaper=None):
    o = clay.blob(nombre, (0, 0, 0), R(*radios), coll, material, n=n, subsurf=sub, shaper=shaper)
    return girar(en(o, centro), *rot)


def brizna(coll, nombre, a, b, material, r=0.012):
    return clay.sweep(nombre, [C(*a), C(*b)], r, coll=coll, material=material, segments=5, samples=2, subsurf=0)


def h(i, k):
    n = math.sin(i * 127.1 + k * 311.7) * 43758.5453
    return n - math.floor(n)


def m_patio_suelo(coll):
    # El caminito: lajas planas y redondeadas con tierra pisada alrededor
    for i in range(6):
        x, z = 2 + (h(i, 3) - 0.5) * 0.5, 4.3 + i * 0.55
        bola(coll, f'tierra camino {i}', (x, 0.008, z), (0.24 + h(i, 1) * 0.1, 0.006, 0.19 + h(i, 2) * 0.07), TIERRA() if i % 2 else TIERRA_CLARA(), n=4, sub=0)
        bola(coll, f'laja {i}', (x + 0.03, 0.02, z), (0.15 + h(i, 4) * 0.05, 0.02, 0.12 + h(i, 5) * 0.04), LAJA(), n=3, sub=1, rot=(0, h(i, 6) * 3, 0))
    for i in range(5):
        bola(coll, f'mancha {i}', (0.6 + h(i, 6) * 2.8, 0.006, 4.6 + h(i, 7) * 3), (0.25 + h(i, 4) * 0.2, 0.005, 0.2 + h(i, 5) * 0.15), TIERRA(), n=4, sub=0)
    # Paja regada
    for i in range(36):
        x, z, a = 0.4 + h(i, 8) * 3.2, 4.4 + h(i, 9) * 3.2, h(i, 10) * 6.3
        brizna(coll, f'paja {i}', (x, 0.02, z), (x + math.cos(a) * 0.18, 0.025, z + math.sin(a) * 0.18), PAJA() if i % 3 else PAJA_OSC())
    # El bebedero de piedra con agua y un patico de hojita flotando
    caja(coll, 'bebedero', (0.72, 0.22, 0.42), (0.7, 0.11, 7.3), PIEDRA_P(), p=8)
    caja(coll, 'agua', (0.58, 0.02, 0.28), (0.7, 0.2, 7.3), AGUA(), p=10)
    bola(coll, 'hojita agua', (0.82, 0.215, 7.27), (0.04, 0.005, 0.025), tela('patio hojita', '#82A075'), n=2, sub=0, rot=(0, 0.6, 0))
    for k in range(3):
        bola(coll, f'piedrita bebedero {k}', (0.3 + k * 0.4, 0.03, 7.55), (0.05, 0.03, 0.04), PIEDRA_P(), n=2, sub=0)
    # El comedero de tablas con paja
    caja(coll, 'comedero', (0.9, 0.2, 0.32), (3.2, 0.15, 7.25), MADERA_P(), p=10)
    for x in (2.78, 3.62):
        caja(coll, f'pata comedero {x}', (0.06, 0.3, 0.34), (x, 0.15, 7.25), MADERA_P(), p=10)
    bola(coll, 'paja comedero', (3.2, 0.26, 7.25), (0.4, 0.04, 0.13), PAJA(), n=4)
    for i in range(6):
        brizna(coll, f'paja comedero {i}', (2.85 + i * 0.13, 0.27, 7.15), (2.9 + i * 0.12, 0.31, 7.36), PAJA_OSC())


def m_patio_maiz(coll):
    maiz = mat('patio maiz', '#F2C94C', 0.6)
    for i in range(40):
        bola(coll, f'grano {i}', (0.8 + h(i, 11) * 2.4, 0.015, 5 + h(i, 12) * 2.4), (0.016, 0.011, 0.014), maiz, n=2, sub=0, rot=(0, h(i, 13) * 6, 0))


def _ampliacion(coll, nivel):
    pilar = piedra('ampliacion pilar', '#768D84')
    adorno = mat('ampliacion adorno', '#D5BE7E', 0.5)
    for x in (0.25, 3.75):
        caja(coll, f'pilar {x}', (0.2, 2.2, 0.13), (x, 1.1, 3.88), pilar, p=8)
        for y in (0.35, 1.9):
            caja(coll, f'anillo {x}{y}', (0.27, 0.08, 0.18), (x, y, 3.9), adorno, p=8)
        bola(coll, f'remate {x}', (x, 2.27, 3.88), (0.09, 0.07, 0.07), adorno, n=3)
    letrero = mat('ampliacion letrero oro', '#D2BE81', 0.4, metallic=0.4) if nivel == 3 else mat('ampliacion letrero', '#B0C7BC', 0.6)
    caja(coll, 'letrero', (1.4, 0.25, 0.08), (2, 2.23, 3.94), letrero, p=8)
    for s in (-1, 1):
        caja(coll, f'cadena {s}', (0.02, 0.18, 0.02), (2 + s * 0.6, 2.42, 3.94), metal('ampliacion cadena', '#6F7672'), p=10)
    for i in range(nivel):
        o = clay.lathe(f'estrella {i}', [(0.0, 0.0), (0.065, 0.0), (0.065, 0.02), (0.0, 0.025)], coll, mat('ampliacion estrella', '#5D7069', 0.5), segments=5,
                       subsurf=0)
        en(o, (2 - (nivel - 1) * 0.1 + i * 0.2, 2.23, 3.98))
        o.rotation_euler = (math.pi / 2, 0, 0)


def m_ampliacion_2(coll):
    _ampliacion(coll, 2)


def m_ampliacion_3(coll):
    _ampliacion(coll, 3)


def m_incubadora(coll):
    mad = madera('incubadora madera', '#94714C')
    met = metal('incubadora metal', '#B6B5A4')
    caja(coll, 'cajon', (1.3, 0.15, 0.95), (0, 0.5, 0), mad, p=10)
    for x in (-0.52, 0.52):
        for z in (-0.35, 0.35):
            caja(coll, f'pata {x}{z}', (0.12, 0.5, 0.12), (x, 0.26, z), mad, p=10)
    bola(coll, 'heno', (0, 0.6, 0), (0.5, 0.06, 0.33), mat('incubadora heno', '#D8BE76', 0.95), n=4, shaper=lambda v: v * (1 + 0.1 * np.sin(v[:, 0] * 25))[:, None])
    for x in (-0.58, 0.58):
        caja(coll, f'lado {x}', (0.08, 0.55, 0.88), (x, 0.82, 0), met, p=10)
        for k in range(3):
            caja(coll, f'rejilla {x}{k}', (0.09, 0.03, 0.7), (x, 0.65 + k * 0.15, 0), mad, p=10)
    caja(coll, 'techo', (1.36, 0.08, 1.0), (0, 1.12, 0), met, p=10)
    caja(coll, 'cresta', (1.36, 0.06, 0.12), (0, 1.18, 0), mad, p=10)
    palo = clay.sweep('cable', [C(0, 1.08, 0), C(0, 0.99, 0)], 0.012, coll=coll, material=met, segments=5, samples=2, subsurf=0)  # noqa: F841
    bola(coll, 'lampara', (0, 0.96, 0), (0.12, 0.1, 0.12), luz('incubadora lampara', '#FFDA91', 2.0), n=3)
    o = clay.lathe('pantalla', [(0.0, 0.0), (0.14, -0.06), (0.15, -0.07)], coll, met, segments=14, subsurf=0, cap_bottom=False, cap_top=False)
    en(o, (0, 1.07, 0))
    caja(coll, 'termometro', (0.08, 0.2, 0.03), (0.4, 0.82, 0.46), mat('incubadora termometro', '#F2EDE2', 0.4), p=10)
    bola(coll, 'mercurio', (0.4, 0.76, 0.48), (0.018, 0.018, 0.01), mat('incubadora mercurio', '#E05A4E', 0.3), n=2, sub=0)


def m_huevo_incubado(coll):
    o = clay.lathe('huevo', [(0.0, 0.0), (0.12, 0.03), (0.18, 0.14), (0.15, 0.27), (0.08, 0.34), (0.0, 0.36)], coll, mat('patio huevo', '#F4E7BF', 0.55),
                   segments=16, subsurf=1)
    # (en el origen: el juego lo sube a la cama de heno y lo estira si es grande)
    for k in range(3):
        bola(coll, f'pinta {k}', (math.cos(k * 2.1) * 0.15, 0.18 + k * 0.04, math.sin(k * 2.1) * 0.15), (0.025, 0.02, 0.01), mat('huevo pinta', '#D8C48E', 0.6), n=2, sub=0)


def m_trufa(coll):
    tierra_t = mat('trufa', '#8F7052', 0.95)
    for k, (x, y, z, r) in enumerate([(0, 0.15, 0, 0.18), (0.12, 0.12, 0.09, 0.13), (-0.08, 0.12, 0.12, 0.11)]):
        bola(coll, f'trufa {k}', (x, y, z), (r, r * 0.9, r), tierra_t, n=4,
             shaper=lambda v, k=k: v * (1 + 0.07 * np.sin(v[:, 0] * 30 + k) * np.sin(v[:, 1] * 30))[:, None])
    for k in range(6):
        a = k * 1.05
        bola(coll, f'tierrita {k}', (math.cos(a) * 0.27, 0.02, math.sin(a) * 0.25), (0.05, 0.02, 0.04), TIERRA(), n=2, sub=0)
    brizna(coll, 'raicita', (0.05, 0.3, 0.0), (0.12, 0.4, -0.04), mat('trufa raiz', '#6E5940', 0.9), r=0.008)


def m_nido(coll):
    for k in range(18):
        a = k * 2 * math.pi / 18
        brizna(coll, f'paja nido {k}', (math.cos(a) * 0.27, 0.06, math.sin(a) * 0.27), (math.cos(a + 0.7) * 0.29, 0.08, math.sin(a + 0.7) * 0.29),
               PAJA() if k % 2 else PAJA_OSC(), r=0.03)
    bola(coll, 'cama nido', (0, 0.035, 0), (0.24, 0.03, 0.24), PAJA_OSC(), n=4)
    for k in range(6):
        a = k * 1.1
        brizna(coll, f'pajita suelta {k}', (math.cos(a) * 0.35, 0.01, math.sin(a) * 0.35), (math.cos(a) * 0.45, 0.012, math.sin(a) * 0.42), PAJA(), r=0.008)


def m_nido_huevo(coll):
    o = clay.lathe('huevo', [(0.0, 0.0), (0.06, 0.015), (0.09, 0.07), (0.075, 0.13), (0.04, 0.165), (0.0, 0.175)], coll, mat('patio huevo', '#F1E2BD', 0.55),
                   segments=14, subsurf=1)
    en(o, (0, 0.035, 0))


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Patio granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_patio.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
