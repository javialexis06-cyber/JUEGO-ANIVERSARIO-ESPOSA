"""Nuestro Hogar · granja: los monstruos de las aventuras (escenas-aventura.ts figura).

Once bichitos de plastilina y fieltro con caras exageradas: la gelatina musgosa, el escarabajo de cobre, el murciélago
de cristal, el guardián de piedra, el ascua errante, el velo nocturno, el centinela orbital y los cuatro constructos de
práctica (fuego, agua, tierra y aire). Las patas, brazos y alas que el juego mueve van cada una bajo un vacío
«miembro_<k>» puesto en su bisagra (el juego las mece en x; las alas del murciélago en z). Medidas de three.js: la base
en el piso y la cara mirando hacia +z. Cada bicho queda bajo un vacío «m_mon_<tipo>» en granja_monstruos.glb.

Uso: blender -b -P granja_monstruos.py -- <carpeta_salida> [claves]
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

OJO = lambda: mat('mon ojo', '#FBF7EA', 0.3, coat=0.5)  # noqa: E731
PUPILA = lambda: mat('mon pupila', '#2E2A3F', 0.2, coat=0.8)  # noqa: E731
BRILLO = lambda: mat('mon brillo', '#FFFFFF', 0.1)  # noqa: E731
BOCA = lambda: mat('mon boca', '#4A2F3A', 0.6)  # noqa: E731
CACHETE = lambda: mat('mon cachete', '#F29AA8', 0.8)  # noqa: E731
DIENTE = lambda: mat('mon diente', '#FFF8EC', 0.4)  # noqa: E731


def C(x, y, z):
    return (x, -z, y)


def R(rx, ry, rz):
    """Radios de three.js (ancho, alto, fondo) a los de Blender."""
    return (rx, rz, ry)


def bola(coll, nombre, c, r, material, n=5, sub=1, shaper=None):
    return clay.blob(nombre, C(*c), R(*r), coll, material, n=n, subsurf=sub, shaper=shaper)


def caja(coll, nombre, c, medidas, material, p=6, sub=1):
    w, h, d = medidas
    return clay.rbox(nombre, C(*c), (w / 2, d / 2, h / 2), coll, material, p=p, n=3, subsurf=sub)


def tubo(coll, nombre, pts, r, material, seg=8):
    return clay.sweep(nombre, [C(*p) for p in pts], r, coll=coll, material=material, segments=seg, samples=4, subsurf=0)


def girar(o, rx=0.0, ry=0.0, rz=0.0):
    """Rotación de three.js (el objeto se construyó en el origen y se mueve con location)."""
    o.rotation_euler = (rx, -rz, ry)
    return o


def en(o, c):
    o.location = C(*c)
    return o


def grupo(coll, nombre, pivote, construir, rot=(0.0, 0.0, 0.0)):
    """Construye las piezas alrededor del origen y las cuelga de un vacío puesto en la bisagra."""
    antes = set(coll.objects)
    construir()
    vacio = bpy.data.objects.new(nombre, None)
    clay.link(vacio, coll)
    for o in coll.objects:
        if o not in antes and o is not vacio and o.parent is None:
            o.parent = vacio
    vacio.location = C(*pivote)
    girar(vacio, *rot)
    return vacio


def ojos(coll, y, z, sep, r=0.075, mirar=0.0, bravo=False, color_pupila=None):
    pup = color_pupila or PUPILA()
    for s in (-1, 1):
        x = s * sep
        bola(coll, f'ojo {s}', (x, y, z), (r, r * 1.15, r * 0.55), OJO(), n=4)
        bola(coll, f'pupila {s}', (x + mirar * r * 0.3, y - r * 0.12, z + r * 0.42), (r * 0.58, r * 0.7, r * 0.28), pup, n=3)
        bola(coll, f'brillo ojo {s}', (x - r * 0.18, y + r * 0.22, z + r * 0.62), (r * 0.2, r * 0.22, r * 0.1), BRILLO(), n=2, sub=0)
        if bravo:
            o = caja(coll, f'ceja {s}', (0, 0, 0), (r * 1.5, r * 0.32, r * 0.3), BOCA(), p=4, sub=0)
            en(girar(o, 0, 0, s * -0.42), (x, y + r * 1.25, z + r * 0.3))


def boca(coll, y, z, ancho, curva=0.03, abierta=False):
    pts = [(-ancho, y + curva, z), (0, y - curva, z + 0.01), (ancho, y + curva, z)]
    tubo(coll, 'boca', pts, 0.014, BOCA(), seg=6)
    if abierta:
        bola(coll, 'boca abierta', (0, y - curva * 1.6, z - 0.005), (ancho * 0.55, ancho * 0.4, 0.02), BOCA(), n=3, sub=0)


def colmillos(coll, y, z, sep=0.035, largo=0.05):
    for s in (-1, 1):
        o = clay.lathe(f'colmillo {s}', [(0.0, 0.0), (0.018, 0.0), (0.0, largo)], coll, DIENTE(), segments=8, subsurf=0)
        en(o, (s * sep, y + 0.005, z))
        o.rotation_euler = (math.pi, 0, 0)


def cachetes(coll, y, z, sep, r=0.05):
    for s in (-1, 1):
        bola(coll, f'cachete {s}', (s * sep, y, z), (r, r * 0.6, r * 0.25), CACHETE(), n=3, sub=0)


def ondita(v, f=6.0, a=0.05, fase=0.0):
    ang = np.arctan2(v[:, 1], v[:, 0])
    v[:, 0] *= 1 + a * np.sin(ang * f + fase)
    v[:, 1] *= 1 + a * np.sin(ang * f + fase)
    return v


# --------------------------------------------------------------------------- los bichos


def m_mon_gelatina(coll):
    gel = mat('mon gelatina', '#88B993', 0.15, coat=0.9, sss=0.25)
    musgo = tela('mon musgo', '#6E9A5C')

    def forma(v):
        z = v[:, 2]
        aplasta = np.where(z < 0, 0.75, 1.0)
        v[:, 2] = z * aplasta
        return ondita(v, 5, 0.035)
    bola(coll, 'cuerpo gelatina', (0, 0.42, 0), (0.5, 0.44, 0.45), gel, n=10, shaper=forma)
    bola(coll, 'corazon gelatina', (0.05, 0.36, -0.05), (0.2, 0.16, 0.18), mat('mon gelatina dentro', '#B4DDB2', 0.3, coat=0.5), n=4)
    # El gorrito de musgo con su florecita y unas burbujas adentro
    bola(coll, 'musgo', (-0.08, 0.78, -0.06), (0.3, 0.1, 0.27), musgo, n=6, shaper=lambda v: ondita(v, 9, 0.12))
    for k in range(6):
        a = k * 1.05
        bola(coll, f'mota musgo {k}', (-0.08 + math.cos(a) * 0.22, 0.8, -0.06 + math.sin(a) * 0.19), (0.06, 0.05, 0.06), musgo, n=3, sub=0)
    tubo(coll, 'tallo flor', [(0.05, 0.82, -0.02), (0.08, 0.95, 0.0), (0.12, 1.02, 0.02)], 0.012, mat('mon tallo', '#5D8A4A', 0.6))
    for k in range(5):
        a = k * 2 * math.pi / 5
        bola(coll, f'petalo {k}', (0.12 + math.cos(a) * 0.04, 1.03, 0.02 + math.sin(a) * 0.04), (0.035, 0.012, 0.035), mat('mon petalo', '#F3D9E8', 0.7), n=3, sub=0)
    bola(coll, 'centro flor', (0.12, 1.04, 0.02), (0.02, 0.015, 0.02), mat('mon polen', '#F2C24E', 0.6), n=2, sub=0)
    for k, (x, y, z, r) in enumerate([(-0.25, 0.3, 0.2, 0.04), (0.26, 0.5, 0.15, 0.03), (0.18, 0.22, 0.28, 0.025)]):
        bola(coll, f'burbuja {k}', (x, y, z), (r, r, r), mat('mon burbuja', '#E8F6E4', 0.1, coat=1.0), n=3, sub=0)
    ojos(coll, 0.46, 0.38, 0.15, r=0.085)
    boca(coll, 0.32, 0.43, 0.07, 0.025, abierta=True)
    cachetes(coll, 0.36, 0.4, 0.25)
    for k, x in enumerate((-0.3, 0.3)):
        grupo(coll, f'miembro_{k}', (x, 0.1, 0.18), lambda: bola(coll, 'patita gelatina', (0, 0, 0), (0.19, 0.1, 0.22), gel, n=5))


def m_mon_escarabajo(coll):
    cobre = mat('mon cobre', '#C48E6B', 0.3, metallic=0.6, coat=0.6)
    cobre_osc = mat('mon cobre oscuro', '#8E5E45', 0.35, metallic=0.5, coat=0.4)
    pata = mat('mon pata escarabajo', '#70566D', 0.5)
    bola(coll, 'barriga', (0, 0.26, -0.02), (0.38, 0.16, 0.48), pata, n=6)
    for s in (-1, 1):
        bola(coll, f'ala {s}', (s * 0.2, 0.4, -0.05), (0.24, 0.24, 0.52), cobre, n=8)
        for k in range(3):
            bola(coll, f'puntico {s}{k}', (s * (0.22 + (k % 2) * 0.05), 0.58 - k * 0.07, -0.25 + k * 0.2), (0.045, 0.02, 0.045), cobre_osc, n=2, sub=0)
    tubo(coll, 'raya', [(0, 0.66, 0.38), (0, 0.66, 0.0), (0, 0.6, -0.45)], 0.018, cobre_osc)
    bola(coll, 'cabeza', (0, 0.32, 0.46), (0.28, 0.24, 0.24), mat('mon cabeza escarabajo', '#9C755C', 0.5, coat=0.3), n=6)
    ojos(coll, 0.4, 0.66, 0.12, r=0.07, bravo=True)
    boca(coll, 0.26, 0.69, 0.05, -0.012)
    for s in (-1, 1):
        o = clay.lathe(f'pinza {s}', [(0.0, 0.0), (0.035, 0.0), (0.03, 0.12), (0.0, 0.17)], coll, mat('mon pinza', '#E4BC86', 0.4), segments=8, subsurf=1)
        en(o, (s * 0.1, 0.2, 0.62))
        o.rotation_euler = (math.pi / 2, 0, -s * 0.4)
        tubo(coll, f'antena {s}', [(s * 0.08, 0.5, 0.56), (s * 0.15, 0.68, 0.62), (s * 0.24, 0.76, 0.58)], 0.012, pata)
        bola(coll, f'bolita antena {s}', (s * 0.24, 0.76, 0.58), (0.035, 0.035, 0.035), mat('mon pinza', '#E4BC86', 0.4), n=2, sub=0)
    k = 0
    for s in (-1, 1):
        for z in (-0.25, 0.0, 0.25):
            def p(s=s):
                tubo(coll, 'pata', [(0, 0, 0), (s * 0.16, 0.06, 0), (s * 0.3, -0.14, 0)], 0.035, pata)
                bola(coll, 'pie', (s * 0.3, -0.15, 0), (0.05, 0.03, 0.06), pata, n=2, sub=0)
            grupo(coll, f'miembro_{k}', (s * 0.3, 0.22, z), p)
            k += 1


def m_mon_murcielago(coll):
    pelo = tela('mon murcielago', '#A4A5D4')
    membrana = mat('mon membrana', '#8C87B5', 0.7, sss=0.2)
    hueso = mat('mon dedo ala', '#6E6A98', 0.6)
    cristal = mat('mon cristal murcielago', '#D8E4FF', 0.08, coat=1.0, emission='#BFD3FF', emission_strength=0.6)
    bola(coll, 'cuerpo murcielago', (0, 0.68, 0), (0.27, 0.33, 0.25), pelo, n=8)
    bola(coll, 'pecho', (0, 0.6, 0.12), (0.17, 0.19, 0.12), tela('mon pecho murcielago', '#CFCFEA'), n=5)
    for s in (-1, 1):
        o = clay.lathe(f'oreja {s}', [(0.0, 0.0), (0.09, 0.0), (0.08, 0.12), (0.0, 0.27)], coll, pelo, segments=10, subsurf=1)
        o.scale = (1, 0.5, 1)
        en(o, (s * 0.15, 0.9, 0.0))
        o.rotation_euler = (0, s * 0.3, 0)
        bola(coll, f'oreja dentro {s}', (s * 0.155, 1.0, 0.04), (0.04, 0.08, 0.015), CACHETE(), n=3, sub=0)
        bola(coll, f'patita {s}', (s * 0.09, 0.36, 0.02), (0.05, 0.05, 0.05), hueso, n=2, sub=0)
    # El cristal que le sale de la cabeza
    for k, (x, ax, alto) in enumerate([(0.0, 0.0, 0.22), (0.07, 0.4, 0.13), (-0.07, -0.4, 0.12)]):
        o = clay.lathe(f'cristal {k}', [(0.0, 0.0), (0.04, 0.0), (0.04, alto * 0.7), (0.0, alto)], coll, cristal, segments=6, subsurf=0)
        en(o, (x, 0.96, -0.05))
        o.rotation_euler = (0, ax, 0)
    ojos(coll, 0.76, 0.2, 0.095, r=0.07)
    boca(coll, 0.64, 0.245, 0.05, 0.02)
    colmillos(coll, 0.625, 0.24)
    cachetes(coll, 0.66, 0.22, 0.17, 0.04)
    for k, s in enumerate((-1, 1)):
        def ala(s=s):
            # La membrana con tres dedos (hacia afuera en x)
            def festones(v):
                # el borde de abajo con tres ondas, como un ala de murciélago
                z = v[:, 2]
                v[:, 2] = np.where(z < 0, z * (0.55 + 0.45 * np.abs(np.cos(v[:, 0] * 4.4))), z)
                return v
            bola(coll, 'membrana', (s * 0.3, -0.04, -0.04), (0.32, 0.22, 0.04), membrana, n=7, shaper=festones)
            for d, (dx, dy) in enumerate([(0.6, 0.12), (0.5, -0.12), (0.3, -0.22)]):
                tubo(coll, f'dedo {d}', [(0, 0.02, -0.02), (s * dx * 0.5, dy * 0.3 + 0.08, -0.01), (s * dx, dy, -0.02)], 0.017, hueso)
            bola(coll, 'garrita', (s * 0.6, 0.13, -0.02), (0.03, 0.03, 0.03), hueso, n=2, sub=0)
        grupo(coll, f'miembro_{k}', (s * 0.17, 0.76, 0), ala)


def m_mon_guardian(coll):
    roca = piedra('mon guardian', '#92977C')
    roca_clara = piedra('mon guardian cabeza', '#A8AC8D')
    roca_osc = piedra('mon guardian pies', '#666F64')
    musgo = tela('mon musgo guardian', '#65836B')
    gema = mat('mon gema guardian', '#B9D79B', 0.1, coat=1.0, emission='#B9E39B', emission_strength=1.2)
    caja(coll, 'tronco', (0, 0.66, 0), (0.7, 0.72, 0.52), roca, p=4)
    caja(coll, 'cabeza', (0, 1.2, 0.02), (0.64, 0.42, 0.5), roca_clara, p=4)
    for k in range(4):
        bola(coll, f'grieta {k}', (-0.2 + k * 0.13, 0.5 + (k % 2) * 0.22, 0.265), (0.045, 0.012, 0.01), mat('mon grieta', '#4F5248', 0.9), n=2, sub=0)
    bola(coll, 'musgo cabeza', (-0.12, 1.42, -0.02), (0.26, 0.06, 0.22), musgo, n=5, shaper=lambda v: ondita(v, 8, 0.15))
    bola(coll, 'musgo hombro', (0.24, 1.0, -0.1), (0.14, 0.05, 0.14), musgo, n=4, shaper=lambda v: ondita(v, 7, 0.15))
    tubo(coll, 'hierbita', [(-0.08, 1.45, 0.0), (-0.1, 1.55, 0.02), (-0.06, 1.62, 0.04)], 0.012, mat('mon hierba', '#7FA65E', 0.6))
    # La gema del pecho con su engaste
    o = clay.lathe('gema pecho', [(0.0, 0.0), (0.1, 0.0), (0.1, 0.06), (0.0, 0.12)], coll, gema, segments=6, subsurf=0)
    en(o, (0, 0.72, 0.24))
    o.rotation_euler = (math.pi / 2, 0, 0)
    caja(coll, 'engaste', (0, 0.72, 0.255), (0.28, 0.28, 0.04), roca_osc, p=4)
    ojos(coll, 1.24, 0.27, 0.15, r=0.075, bravo=True)
    boca(coll, 1.07, 0.275, 0.09, -0.015)
    for s in (-1, 1):
        caja(coll, f'pie {s}', (s * 0.2, 0.15, 0.02), (0.26, 0.3, 0.34), roca_osc, p=4)

    for k, s in enumerate((-1, 1)):
        def brazo(s=s):
            caja(coll, 'hombro', (0, 0, 0), (0.3, 0.24, 0.32), roca_clara, p=4)
            caja(coll, 'brazo', (0, -0.3, 0.01), (0.26, 0.42, 0.3), roca, p=4)
            bola(coll, 'puno', (0, -0.55, 0.02), (0.17, 0.14, 0.17), roca_osc, n=4)
        grupo(coll, f'miembro_{k}', (s * 0.5, 0.86, 0.01), brazo)


def m_mon_ascua(coll):
    fuego = mat('mon ascua', '#E89A68', 0.4, emission='#F07A3C', emission_strength=0.8, sss=0.3)
    nucleo = luz('mon ascua nucleo', '#F8CF89', 1.6)
    chispa = luz('mon chispa', '#FFD27A', 3.0)

    def gota(v):
        z = v[:, 2]
        afila = np.clip(1 - np.maximum(z, 0) * 0.85, 0.18, 1)
        v[:, 0] *= afila
        v[:, 1] *= afila
        return v
    bola(coll, 'llama', (0, 0.66, 0), (0.3, 0.46, 0.3), fuego, n=9, shaper=gota)
    bola(coll, 'nucleo', (0, 0.62, 0.08), (0.19, 0.28, 0.2), nucleo, n=6, shaper=gota)
    for k, (x, ang) in enumerate([(-0.15, 0.5), (0.14, -0.45)]):
        o = clay.blob(f'lengua {k}', (0, 0, 0), R(0.09, 0.2, 0.09), coll, fuego, n=5, shaper=gota)
        en(girar(o, 0, 0, ang), (x, 0.98, -0.03))
    for k in range(5):
        a = k * 1.3
        bola(coll, f'chispa {k}', (math.cos(a) * 0.38, 0.4 + k * 0.17, math.sin(a) * 0.3), (0.025, 0.025, 0.025), chispa, n=2, sub=0)
    ojos(coll, 0.74, 0.28, 0.09, r=0.065, bravo=True)
    boca(coll, 0.6, 0.31, 0.06, 0.03, abierta=True)
    # La brasa del piso donde se apoya
    bola(coll, 'brasa', (0, 0.06, 0), (0.24, 0.06, 0.24), mat('mon brasa', '#5A3A35', 0.8, emission='#D2542E', emission_strength=0.4), n=5,
         shaper=lambda v: ondita(v, 7, 0.15))
    for k, s in enumerate((-1, 1)):
        grupo(coll, f'miembro_{k}', (s * 0.3, 0.64, 0),
              lambda s=s: bola(coll, 'manito llama', (s * 0.04, -0.03, 0), (0.12, 0.17, 0.12), mat('mon ascua mano', '#D48069', 0.5, emission='#E06A44',
                                                                                                    emission_strength=0.5), n=5, shaper=gota))


def m_mon_sombra(coll):
    velo = tela('mon velo', '#9B8EAF')
    velo_osc = tela('mon velo oscuro', '#776D96')
    cara = mat('mon cara sombra', '#3B3352', 0.8)
    luz_ojo = luz('mon ojo sombra', '#F4E9FF', 2.5)
    halo = mat('mon halo', '#D7BEE9', 0.3, emission='#E6D0F7', emission_strength=1.0)

    def capa(v):
        z = v[:, 2]
        ang = np.arctan2(v[:, 1], v[:, 0])
        abajo = np.clip(-z, 0, 1)
        v[:, 0] *= 1 + abajo * (0.35 + 0.1 * np.sin(ang * 7))
        v[:, 1] *= 1 + abajo * (0.35 + 0.1 * np.sin(ang * 7))
        v[:, 2] = np.where(z < 0, z * (1 + 0.15 * np.sin(ang * 7)), z)
        return v
    bola(coll, 'velo', (0, 0.7, 0), (0.36, 0.5, 0.33), velo, n=10, shaper=capa)
    bola(coll, 'capucha', (0, 0.95, -0.04), (0.33, 0.3, 0.3), velo_osc, n=7)
    bola(coll, 'hueco cara', (0, 0.9, 0.24), (0.23, 0.2, 0.09), cara, n=5)
    for s in (-1, 1):
        bola(coll, f'ojo sombra {s}', (s * 0.09, 0.93, 0.32), (0.06, 0.08, 0.025), luz_ojo, n=3, sub=0)
        bola(coll, f'pupila sombra {s}', (s * 0.09, 0.91, 0.34), (0.025, 0.04, 0.01), PUPILA(), n=2, sub=0)
    boca(coll, 0.81, 0.33, 0.045, 0.02)
    cachetes(coll, 0.84, 0.32, 0.15, 0.035)
    o = clay.lathe('punta capucha', [(0.0, 0.0), (0.09, 0.0), (0.0, 0.24)], coll, velo_osc, segments=10, subsurf=1)
    en(o, (0, 1.18, -0.12))
    o.rotation_euler = (-0.6, 0, 0)
    o = clay.lathe('halo', [(0.24, 0.0), (0.27, -0.03), (0.3, 0.0), (0.27, 0.03), (0.24, 0.0)], coll, halo, segments=28, subsurf=1, cap_bottom=False,
                   cap_top=False)
    en(o, (0, 1.33, -0.05))
    for k in range(4):
        a = k * 1.6 + 0.4
        bola(coll, f'estrellita {k}', (math.cos(a) * 0.42, 0.5 + k * 0.18, math.sin(a) * 0.32), (0.025, 0.025, 0.025), luz_ojo, n=2, sub=0)
    for k, x in enumerate((-0.21, 0.0, 0.21)):
        grupo(coll, f'miembro_{k}', (x, 0.36, 0.04),
              lambda: bola(coll, 'jiron', (0, -0.11, 0), (0.12, 0.22, 0.14), velo_osc, n=5, shaper=lambda v: ondita(v, 5, 0.12)))


def m_mon_centinela(coll):
    casco = mat('mon centinela', '#89B4C0', 0.3, coat=0.7)
    gris = mat('mon centinela gris', '#B9C2CA', 0.35, metallic=0.3, coat=0.4)
    visor = mat('mon visor', '#3E4D66', 0.15, coat=1.0)
    ojo = luz('mon ojo centinela', '#DEF4DA', 2.5)
    anillo = mat('mon anillo', '#86D2E2', 0.2, emission='#86D2E2', emission_strength=0.8)
    caja(coll, 'cuerpo centinela', (0, 0.8, 0), (0.64, 0.56, 0.5), casco, p=3)
    caja(coll, 'visor', (0, 0.86, 0.24), (0.48, 0.17, 0.06), visor, p=3)
    bola(coll, 'ojo grande', (0, 0.86, 0.275), (0.08, 0.06, 0.03), ojo, n=3, sub=0)
    bola(coll, 'brillo visor', (-0.15, 0.9, 0.28), (0.04, 0.02, 0.01), BRILLO(), n=2, sub=0)
    boca(coll, 0.68, 0.255, 0.07, 0.015)
    cachetes(coll, 0.72, 0.252, 0.2, 0.04)
    bola(coll, 'faldon', (0, 0.48, 0), (0.24, 0.1, 0.22), gris, n=5)
    o = clay.lathe('punta abajo', [(0.0, 0.0), (0.12, 0.08), (0.14, 0.14)], coll, gris, segments=12, subsurf=1)
    en(o, (0, 0.28, 0))
    tubo(coll, 'antena', [(0, 1.08, 0), (0, 1.25, 0)], 0.02, gris)
    bola(coll, 'foco antena', (0, 1.3, 0), (0.07, 0.07, 0.07), luz('mon foco', '#E8C779', 2.0), n=3)
    for s in (-1, 1):
        bola(coll, f'propulsor {s}', (s * 0.2, 0.42, 0), (0.11, 0.06, 0.11), luz('mon propulsor', '#99DBE0', 1.5), n=3)
    for k in range(3):
        a = k * 2.1
        bola(coll, f'satelite {k}', (math.cos(a) * 0.46, 0.34, math.sin(a) * 0.4), (0.045, 0.045, 0.045), anillo, n=2, sub=0)
    o = clay.lathe('anillo orbita', [(0.41, -0.02), (0.45, -0.02), (0.45, 0.02), (0.41, 0.02), (0.41, -0.02)], coll, anillo, segments=32, subsurf=0, cap_bottom=False, cap_top=False)
    en(o, (0, 0.33, 0))
    for k, s in enumerate((-1, 1)):
        def brazo(s=s):
            caja(coll, 'brazo centinela', (s * 0.02, -0.08, 0), (0.17, 0.36, 0.2), gris, p=3)
            bola(coll, 'luz brazo', (s * 0.1, -0.05, 0), (0.02, 0.05, 0.05), anillo, n=2, sub=0)
        grupo(coll, f'miembro_{k}', (s * 0.41, 0.78, 0), brazo)


def _patas_constructo(coll, material, pie):
    for k, s in enumerate((-1, 1)):
        def pata(s=s):
            caja(coll, 'pierna', (0, -0.1, 0), (0.1, 0.22, 0.1), material, p=4)
            caja(coll, 'zapato', (0, -0.23, 0.04), (0.17, 0.08, 0.24), pie, p=4)
        grupo(coll, f'miembro_{k}', (s * 0.18, 0.3, 0), pata)


def m_mon_constructo_fuego(coll):
    hierro = metal('mon caldera', '#7A6E68')
    rojo = mat('mon caldera roja', '#E89A68', 0.35, coat=0.5)
    cobre = metal('mon caldera cobre', '#C98758')
    llama = luz('mon caldera llama', '#FFB45C', 2.5)
    o = clay.lathe('caldera', [(0.0, 0.0), (0.3, 0.0), (0.34, 0.1), (0.34, 0.5), (0.28, 0.58), (0.0, 0.6)], coll, rojo, segments=24, subsurf=1)
    en(o, (0, 0.28, 0))
    for y in (0.36, 0.78):
        o = clay.lathe(f'aro caldera {y}', [(0.35, -0.025), (0.36, 0.0), (0.35, 0.025)], coll, cobre, segments=24, subsurf=0)
        en(o, (0, y, 0))
    caja(coll, 'ventana fuego', (0, 0.5, 0.31), (0.24, 0.16, 0.06), hierro, p=4)
    bola(coll, 'fuego dentro', (0, 0.5, 0.335), (0.09, 0.06, 0.02), llama, n=3, sub=0)
    for k in range(3):
        caja(coll, f'reja {k}', (-0.07 + k * 0.07, 0.5, 0.345), (0.015, 0.15, 0.015), hierro, p=4, sub=0)
    o = clay.lathe('chimenea', [(0.08, 0.0), (0.07, 0.28), (0.11, 0.34), (0.1, 0.38)], coll, hierro, segments=12, subsurf=1, cap_top=False)
    en(o, (0.12, 0.86, -0.08))
    for k in range(3):
        bola(coll, f'humo {k}', (0.14 + k * 0.05, 1.32 + k * 0.12, -0.08), (0.07 + k * 0.02,) * 3, mat('mon humo', '#E6E1DC', 0.9), n=3)
    o = clay.lathe('manometro', [(0.0, 0.0), (0.08, 0.0), (0.08, 0.03), (0.0, 0.035)], coll, cobre, segments=16, subsurf=0)
    en(o, (-0.16, 0.82, 0.25))
    o.rotation_euler = (math.pi / 2 - 0.5, 0, 0)
    ojos(coll, 0.7, 0.33, 0.1, r=0.06)
    boca(coll, 0.62, 0.34, 0.04, 0.012)
    _patas_constructo(coll, hierro, rojo)


def m_mon_constructo_agua(coll):
    azul = mat('mon bomba', '#749CB5', 0.35, coat=0.5)
    metal_b = metal('mon bomba metal', '#AEB8BE')
    agua = mat('mon bomba agua', '#8DCFE3', 0.05, coat=1.0)
    caja(coll, 'base bomba', (0, 0.42, 0), (0.56, 0.28, 0.46), azul, p=4)
    o = clay.lathe('cupula', [(0.0, 0.0), (0.24, 0.0), (0.26, 0.12), (0.2, 0.3), (0.0, 0.36)], coll, agua, segments=20, subsurf=1)
    en(o, (0, 0.56, 0))
    bola(coll, 'agua dentro', (0, 0.68, 0), (0.18, 0.1, 0.18), mat('mon bomba agua honda', '#4E9BC0', 0.1, coat=0.8), n=4)
    for k in range(3):
        bola(coll, f'burbujita {k}', (-0.07 + k * 0.07, 0.75 + k * 0.03, 0.08), (0.025,) * 3, BRILLO(), n=2, sub=0)
    o = clay.lathe('aro cupula', [(0.26, -0.02), (0.28, 0.0), (0.26, 0.02)], coll, metal_b, segments=20, subsurf=0)
    en(o, (0, 0.57, 0))
    tubo(coll, 'palanca', [(0.28, 0.5, 0), (0.42, 0.66, 0), (0.42, 0.86, 0)], 0.022, metal_b)
    bola(coll, 'pomo', (0.42, 0.88, 0), (0.05,) * 3, mat('mon pomo', '#E86A5A', 0.4), n=3)
    tubo(coll, 'manguera', [(-0.28, 0.45, 0), (-0.42, 0.42, 0.08), (-0.44, 0.24, 0.2), (-0.3, 0.12, 0.3)], 0.035, mat('mon manguera', '#5E8C6E', 0.6), seg=10)
    bola(coll, 'gota', (-0.28, 0.06, 0.32), (0.03, 0.04, 0.03), agua, n=2, sub=0)
    ojos(coll, 0.44, 0.235, 0.12, r=0.06)
    boca(coll, 0.36, 0.24, 0.05, 0.02)
    cachetes(coll, 0.38, 0.237, 0.2, 0.035)
    _patas_constructo(coll, metal_b, azul)


def m_mon_constructo_tierra(coll):
    roca = piedra('mon soporte', '#92977C')
    mad = madera('mon soporte madera', '#9C7350')
    hierro = metal('mon soporte hierro', '#6F7672')
    caja(coll, 'bloque', (0, 0.66, 0), (0.6, 0.5, 0.5), roca, p=4)
    bola(coll, 'musgo bloque', (0.12, 0.92, -0.05), (0.2, 0.05, 0.18), tela('mon musgo soporte', '#6E9A5C'), n=4, shaper=lambda v: ondita(v, 8, 0.15))
    for z in (-0.18, 0.18):
        caja(coll, f'viga {z}', (0, 0.38, z), (0.7, 0.08, 0.08), mad, p=6)
    for s in (-1, 1):
        caja(coll, f'abrazadera {s}', (s * 0.31, 0.66, 0), (0.04, 0.52, 0.52), hierro, p=6, sub=0)
        bola(coll, f'perno {s}', (s * 0.335, 0.66, 0), (0.035,) * 3, hierro, n=2, sub=0)
    tubo(coll, 'manivela', [(0.34, 0.66, 0), (0.45, 0.66, 0), (0.45, 0.8, 0.06)], 0.022, hierro)
    bola(coll, 'mango manivela', (0.45, 0.84, 0.07), (0.035, 0.06, 0.035), mad, n=3)
    ojos(coll, 0.72, 0.255, 0.13, r=0.065, bravo=True)
    boca(coll, 0.56, 0.26, 0.06, -0.012)
    for k, s in enumerate((-1, 1)):
        def pata(s=s):
            caja(coll, 'zanco', (0, -0.14, 0), (0.1, 0.3, 0.1), mad, p=6)
            bola(coll, 'rueda', (0, -0.28, 0.0), (0.04, 0.09, 0.09), hierro, n=4)
        grupo(coll, f'miembro_{k}', (s * 0.22, 0.34, 0), pata)


def m_mon_constructo_aire(coll):
    gris = mat('mon turbina', '#BABDCD', 0.3, coat=0.5)
    metal_t = metal('mon turbina metal', '#8D949C')
    aspa = mat('mon aspa', '#F2F0EA', 0.4)
    o = clay.lathe('cuerpo turbina', [(0.0, 0.0), (0.22, 0.0), (0.3, 0.15), (0.3, 0.4), (0.22, 0.55), (0.0, 0.58)], coll, gris, segments=20, subsurf=1)
    en(o, (0, 0.3, 0))
    for y in (0.48, 0.68):
        o = clay.lathe(f'rejilla {y}', [(0.305, -0.015), (0.315, 0.0), (0.305, 0.015)], coll, metal_t, segments=20, subsurf=0)
        en(o, (0, y, 0))
    tubo(coll, 'eje', [(0, 0.86, 0), (0, 1.0, 0)], 0.03, metal_t)
    for k in range(4):
        o = caja(coll, f'aspa {k}', (0, 0, 0), (0.42, 0.02, 0.1), aspa, p=4)
        en(girar(o, 0.25, k * math.pi / 2, 0), (math.cos(k * math.pi / 2) * 0.22, 1.0, -math.sin(k * math.pi / 2) * 0.22))
    bola(coll, 'buje', (0, 1.02, 0), (0.06, 0.04, 0.06), mat('mon buje', '#E86A5A', 0.4), n=3)
    for k in range(3):
        a = k * 1.4 + 0.3
        tubo(coll, f'viento {k}', [(math.cos(a) * 0.4, 0.5 + k * 0.15, math.sin(a) * 0.36), (math.cos(a + 0.5) * 0.44, 0.55 + k * 0.15, math.sin(a + 0.5) * 0.4)],
             0.012, mat('mon viento', '#E3F1F7', 0.5))
    ojos(coll, 0.62, 0.29, 0.11, r=0.06)
    boca(coll, 0.52, 0.29, 0.05, 0.02)
    cachetes(coll, 0.55, 0.285, 0.19, 0.035)
    for k, s in enumerate((-1, 1)):
        def aleta(s=s):
            o = caja(coll, 'aleta', (0, 0, 0), (0.2, 0.26, 0.05), gris, p=4)
            en(girar(o, 0, 0, s * 0.3), (s * 0.08, -0.06, 0))
        grupo(coll, f'miembro_{k}', (s * 0.3, 0.6, 0), aleta)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Monstruos granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_monstruos.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
