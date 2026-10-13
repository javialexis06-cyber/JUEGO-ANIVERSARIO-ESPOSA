"""Nuestro Hogar · granja: cercas, portón, puerta del corral, comedero y pérgola.

- cerca_poste / cerca_tramo: la cerca del patio de cada refugio (vista.ts valla); el tramo va de x = 0 a 1 (el juego
  lo estira al largo de cada tramo y lo gira para los lados).
- valla_madera / valla_piedra / valla_floral: la valla que pone el jugador (un poste en el origen y el tramo de 0,9
  hacia +x); porton_cerrado y porton_abierto: el portón de 2 casillas (la hoja de 1,9 o abierta de par en par).
- puerta_ganado: la hoja de la puerta del corral (ganaderia-render.ts puertaGanadoVista), con la bisagra en el origen y
  la hoja hacia +x.
- comedero / comedero_heno: el comedero de madera del refugio (comederoVista), vacío o con heno.
- pergola_ancestral: la pérgola de cuatro postes con vigas y la enredadera florecida (centrada, 4 × 3).

Medidas de three.js. Cada pieza queda bajo un vacío «m_<clave>» en granja_cercas.glb.

Uso: blender -b -P granja_cercas.py -- <carpeta_salida> [claves]
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
from granja_muebles import mat, metal, piedra  # noqa: E402

POSTE = lambda: madera('cerca poste', '#E5C79A')  # noqa: E731
TRAMO = lambda: madera('cerca tramo', '#BD9466')  # noqa: E731
MADERA_V = lambda: madera('valla madera', '#CDA87E')  # noqa: E731
MADERA_OSC = lambda: madera('valla madera oscura', '#A98257')  # noqa: E731
PIEDRA_V = lambda: piedra('valla piedra', '#A4AAA0')  # noqa: E731
PIEDRA_OSC = lambda: piedra('valla piedra oscura', '#8E948A')  # noqa: E731
FLORAL = lambda: madera('valla floral', '#C4BC93')  # noqa: E731
HOJA = lambda: tela('cerca hoja', '#82A075')  # noqa: E731
HOJA_OSC = lambda: tela('cerca hoja oscura', '#6B8B60')  # noqa: E731
HIERRO = lambda: metal('cerca hierro', '#7A786A')  # noqa: E731


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
    o = clay.rbox(nombre, (0, 0, 0), (w / 2, d / 2, h / 2), coll, material, p=p, n=5, subsurf=0)
    return girar(en(o, centro), *rot)


def bola(coll, nombre, centro, radios, material, n=3, sub=1, rot=(0.0, 0.0, 0.0), shaper=None):
    o = clay.blob(nombre, (0, 0, 0), R(*radios), coll, material, n=n, subsurf=sub, shaper=shaper)
    return girar(en(o, centro), *rot)


def palo(coll, nombre, a, b, r, material, seg=8):
    return clay.sweep(nombre, [C(*a), C(*b)], r, coll=coll, material=material, segments=seg, samples=2, subsurf=0)


def flor(coll, nombre, centro, color, r=0.04):
    x, y, z = centro
    for k in range(5):
        a = k * 2 * math.pi / 5
        bola(coll, f'{nombre} petalo {k}', (x + math.cos(a) * r, y, z + math.sin(a) * r), (r * 0.7, r * 0.3, r * 0.7), tela('cerca petalo ' + color, color), n=2,
             sub=0)
    bola(coll, f'{nombre} centro', (x, y + 0.01, z), (r * 0.45, r * 0.35, r * 0.45), mat('cerca polen', '#F2C94C', 0.6), n=2, sub=0)


def poste_redondo(coll, nombre, x, alto, r, material, z=0.0):
    """Poste gordito con la punta redondeada y una muesca arriba."""
    o = clay.lathe(nombre, [(0.0, 0.0), (r * 1.08, 0.0), (r, 0.04), (r, alto - r * 0.9), (r * 0.7, alto - r * 0.25), (0.0, alto)], coll, material,
                   segments=10, subsurf=1)
    en(o, (x, 0, z))
    o2 = clay.lathe(nombre + ' anillo', [(r * 1.0, -0.012), (r * 1.12, 0.0), (r * 1.0, 0.012)], coll, MADERA_OSC(), segments=10, subsurf=0, cap_bottom=False,
                    cap_top=False)
    en(o2, (x, alto * 0.82, z))


# --------------------------------------------------------------------------- la cerca de los refugios


def m_cerca_poste(coll):
    poste_redondo(coll, 'poste', 0.0, 0.84, 0.055, POSTE())


def m_cerca_tramo(coll):
    for y in (0.32, 0.56):
        caja(coll, f'travesano {y}', (1.0, 0.08, 0.06), (0.5, y, 0), TRAMO(), p=14)
        for x in (0.08, 0.92):
            bola(coll, f'clavo {y}{x}', (x, y, 0.032), (0.012, 0.012, 0.006), HIERRO(), n=2, sub=0)


# --------------------------------------------------------------------------- las vallas del jugador


def _tramo_madera(coll, largo, material):
    for y in (0.6, 0.32):
        caja(coll, f'tabla {y}', (largo, 0.09, 0.08), (0.05 + largo / 2, y, 0), material, p=14)
        for x in (0.12, largo - 0.02):
            bola(coll, f'clavo {y}{x}', (x, y, 0.042), (0.013, 0.013, 0.006), HIERRO(), n=2, sub=0)


def m_valla_madera(coll):
    poste_redondo(coll, 'poste', 0.0, 0.94, 0.07, MADERA_V())
    _tramo_madera(coll, 0.9, MADERA_V())
    # Una veta oscura en cada tabla (madera de verdad)
    for y in (0.6, 0.32):
        caja(coll, f'veta {y}', (0.5, 0.012, 0.005), (0.45, y + 0.01, 0.041), MADERA_OSC(), p=14, sub=0)


def m_valla_piedra(coll):
    rng = np.random.default_rng(3)
    # El pilar de piedras apiladas con su tapa, y dos vigas de piedra labrada
    for k in range(4):
        r = 0.1 - k * 0.006
        bola(coll, f'piedra pilar {k}', (rng.uniform(-0.01, 0.01), 0.11 + k * 0.19, rng.uniform(-0.01, 0.01)), (r, 0.125, r * 0.95), PIEDRA_V() if k % 2 else PIEDRA_OSC(),
             n=3)
    caja(coll, 'tapa pilar', (0.22, 0.06, 0.22), (0, 0.9, 0), PIEDRA_OSC(), p=14)
    for y in (0.6, 0.32):
        caja(coll, f'viga {y}', (0.86, 0.1, 0.09), (0.5, y, 0), PIEDRA_V(), p=12)
    for k in range(3):
        bola(coll, f'musgo {k}', (0.2 + k * 0.28, 0.66, 0.02), (0.06, 0.02, 0.05), HOJA(), n=2, sub=0)
    bola(coll, 'piedrita pie', (0.35, 0.03, 0.08), (0.05, 0.03, 0.04), PIEDRA_OSC(), n=2, sub=0)


def m_valla_floral(coll):
    poste_redondo(coll, 'poste', 0.0, 0.94, 0.065, FLORAL())
    _tramo_madera(coll, 0.9, FLORAL())
    palo(coll, 'enredadera', (0.02, 0.15, 0.05), (0.02, 0.85, 0.05), 0.012, HOJA_OSC())
    for i in range(5):
        x = 0.1 + i * 0.18
        bola(coll, f'hoja {i}', (x, 0.7, 0.03), (0.05, 0.025, 0.04), HOJA() if i % 2 else HOJA_OSC(), n=2, rot=(0, i * 0.7, 0.3))
        flor(coll, f'flor {i}', (x + 0.06, 0.69, 0.05), '#D3A4A6' if i % 2 else '#EFE4BA', 0.035)
    for i in range(3):
        bola(coll, f'hoja poste {i}', (0.05, 0.3 + i * 0.22, 0.06), (0.04, 0.02, 0.03), HOJA(), n=2, rot=(0, 0, 0.5))


def _hoja_porton(coll, largo, abierto=False):
    """La hoja del portón: tablas verticales, travesaños y la cruz, con su argolla."""
    piezas = []
    antes = set(coll.objects)
    for i in range(7):
        caja(coll, f'tabla porton {i}', (largo / 7 - 0.02, 0.62, 0.06), (0.06 + (i + 0.5) * largo / 7, 0.48, 0), MADERA_V(), p=14)
    for y in (0.3, 0.68):
        caja(coll, f'travesano porton {y}', (largo, 0.08, 0.05), (0.06 + largo / 2, y, 0.05), MADERA_OSC(), p=14)
    ang = math.atan2(0.38, largo)
    caja(coll, 'cruz porton', (math.hypot(largo, 0.38), 0.07, 0.04), (0.06 + largo / 2, 0.49, 0.07), MADERA_OSC(), p=14, rot=(0, 0, ang))
    o = clay.lathe('argolla', [(0.035, -0.008), (0.045, 0.0), (0.035, 0.008)], coll, HIERRO(), segments=12, subsurf=0, cap_bottom=False, cap_top=False)
    en(o, (largo - 0.05, 0.5, 0.09))
    o.rotation_euler = (math.pi / 2, 0, 0)
    for y in (0.3, 0.68):
        caja(coll, f'bisagra {y}', (0.12, 0.05, 0.03), (0.1, y, 0.08), HIERRO(), p=14, sub=0)
    piezas = [o for o in coll.objects if o not in antes]
    if abierto:
        pivote = bpy.data.objects.new('hoja abierta', None)
        clay.link(pivote, coll)
        for o in piezas:
            o.parent = pivote
        pivote.rotation_euler = (0, 0, math.pi * 0.45)


def m_porton_cerrado(coll):
    poste_redondo(coll, 'poste', 0.0, 1.0, 0.08, MADERA_V())
    bola(coll, 'farolito', (0, 1.06, 0), (0.05, 0.05, 0.05), mat('cerca bolita', '#E3C77A', 0.5), n=2)
    _hoja_porton(coll, 1.85)


def m_porton_abierto(coll):
    poste_redondo(coll, 'poste', 0.0, 1.0, 0.08, MADERA_V())
    bola(coll, 'farolito', (0, 1.06, 0), (0.05, 0.05, 0.05), mat('cerca bolita', '#E3C77A', 0.5), n=2)
    _hoja_porton(coll, 1.85, abierto=True)


# --------------------------------------------------------------------------- corral y comedero


def m_puerta_ganado(coll):
    madera_p = madera('puerta corral', '#B98C5B')
    for i in range(5):
        caja(coll, f'tabla {i}', (0.17, 1.45, 0.1), (0.09 + i * 0.19, 0.8, 0), madera_p, p=14)
        bola(coll, f'punta {i}', (0.09 + i * 0.19, 1.53, 0), (0.085, 0.04, 0.05), madera_p, n=2)
    for y in (0.3, 1.25):
        caja(coll, f'banda {y}', (0.95, 0.1, 0.12), (0.475, y, 0.02), HIERRO(), p=14)
        for i in range(5):
            bola(coll, f'remache {y}{i}', (0.09 + i * 0.19, y, 0.085), (0.015, 0.015, 0.008), metal('cerca remache', '#C9C2AC'), n=2, sub=0)
    caja(coll, 'pestillo', (0.08, 0.15, 0.15), (0.8, 0.8, 0.13), HIERRO(), p=14)
    palo(coll, 'aldaba', (0.62, 0.8, 0.15), (0.84, 0.8, 0.15), 0.018, HIERRO())
    bola(coll, 'herradura', (0.475, 1.0, 0.07), (0.07, 0.07, 0.015), metal('cerca herradura', '#9AA4A2'), n=3, shaper=lambda v: v)


def _comedero(coll, con_heno):
    madera_c = madera('comedero', '#A7855F')
    caja(coll, 'fondo', (1.8, 0.12, 0.65), (0, 0.45, 0), madera_c, p=14)
    for z in (-0.32, 0.32):
        caja(coll, f'lado {z}', (1.9, 0.28, 0.08), (0, 0.58, z), madera_c, p=14)
    for x in (-0.92, 0.92):
        caja(coll, f'punta {x}', (0.08, 0.3, 0.72), (x, 0.58, 0), madera_c, p=14)
    for x in (-0.72, 0.72):
        for z in (-0.25, 0.25):
            caja(coll, f'pata {x}{z}', (0.1, 0.45, 0.1), (x, 0.23, z), madera_c, p=14, rot=(z * 0.4, 0, 0))
    for z in (-0.33, 0.33):
        caja(coll, f'borde {z}', (1.92, 0.04, 0.1), (0, 0.73, z), MADERA_OSC(), p=6)
    if con_heno:
        paja = mat('comedero heno', '#D6BF79', 0.95)
        bola(coll, 'heno', (0, 0.6, 0), (0.85, 0.1, 0.26), paja, n=6, shaper=lambda v: v * (1 + 0.08 * np.sin(v[:, 0] * 30) * np.cos(v[:, 1] * 20))[:, None])
        for i in range(14):
            a = i * 0.71
            palo(coll, f'brizna {i}', (-0.7 + (i % 7) * 0.23, 0.66, -0.15 + (i // 7) * 0.3), (-0.62 + (i % 7) * 0.23 + math.cos(a) * 0.05, 0.72, -0.12 + (i // 7) * 0.3),
                 0.008, mat('comedero heno oscuro', '#C2A95E', 0.95))


def m_comedero(coll):
    _comedero(coll, False)


def m_comedero_heno(coll):
    _comedero(coll, True)


# --------------------------------------------------------------------------- la pérgola


def m_pergola_ancestral(coll):
    rng = np.random.default_rng(11)
    poste = madera('pergola poste', '#795D46')
    viga = madera('pergola viga', '#9A7755')
    liston = madera('pergola liston', '#B0936A')
    base = piedra('pergola base', '#BAB99E')
    for x in (-1.7, 1.7):
        for z in (-1.15, 1.15):
            caja(coll, f'base {x}{z}', (0.36, 0.2, 0.36), (x, 0.1, z), base, p=12)
            caja(coll, f'poste {x}{z}', (0.2, 2.5, 0.2), (x, 1.4, z), poste, p=14)
            caja(coll, f'capitel {x}{z}', (0.28, 0.1, 0.28), (x, 2.58, z), poste, p=14)
    for z in (-1.2, 1.2):
        caja(coll, f'viga {z}', (4.1, 0.2, 0.17), (0, 2.53, z), viga, p=14)
        for s in (-1, 1):
            caja(coll, f'tornapunta {z}{s}', (0.5, 0.08, 0.08), (s * 1.5, 2.33, z), viga, p=14, rot=(0, 0, s * 0.7))
    for i in range(7):
        caja(coll, f'liston {i}', (0.13, 0.17, 2.95), (-1.8 + i * 0.6, 2.7, 0), liston, p=14)
    # La enredadera: hojas en racimos sobre los listones y flores
    hojas = [tela('pergola hoja', '#91AD70'), tela('pergola hoja oscura', '#7A9A5E')]
    for i in range(30):
        x, z = -1.85 + rng.uniform(0, 3.7), -1.35 + rng.uniform(0, 2.7)
        bola(coll, f'hoja {i}', (x, 2.84, z), (0.14, 0.05, 0.11), hojas[i % 2], n=3, rot=(0, rng.uniform(0, 6), 0))
        if i % 3 == 0:
            flor(coll, f'flor {i}', (x + 0.05, 2.9, z), '#DCB3BF' if i % 2 else '#EFE4BA', 0.05)
    for x in (-1.7, 1.7):
        for z in (-1.15, 1.15):
            pts = [C(x + 0.11 * math.cos(t * 2.5), 0.2 + t * 2.35, z + 0.11 * math.sin(t * 2.5)) for t in np.linspace(0, 1, 7)]
            clay.sweep(f'enredadera {x}{z}', pts, 0.02, coll=coll, material=hojas[1], segments=6, samples=3, subsurf=0)
            for k in range(4):
                t = 0.2 + k * 0.2
                bola(coll, f'hojita {x}{z}{k}', (x + 0.12 * math.cos(t * 2.5), 0.2 + t * 2.35, z + 0.12 * math.sin(t * 2.5)), (0.07, 0.035, 0.05), hojas[k % 2], n=2,
                     rot=(0, t * 3, 0.4))
    # Un banquito debajo
    caja(coll, 'banco', (1.4, 0.08, 0.4), (0, 0.45, -0.6), liston, p=14)
    for x in (-0.55, 0.55):
        caja(coll, f'pata banco {x}', (0.1, 0.42, 0.34), (x, 0.21, -0.6), poste, p=14)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Cercas granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_cercas.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
