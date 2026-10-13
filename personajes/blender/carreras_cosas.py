"""Nuestro Hogar · La Carrera de las Tres Lunas: carros, criaturas nuevas, cajas de objetos, objetos, podio y copa.

Todo en el estilo del juego (madera, fieltro, laca y plastilina, formas redondas), mirando hacia -y (en three.js hacia
+z) y con la base en z=0. Un solo GLB (carreras_cosas.glb) con un vacío «m_<clave>» por pieza.

Carros (`carro_<estilo>`): el cuerpo junto por material; cada rueda cuelga de su vacío («rueda_ti», «rueda_td»,
«rueda_di», «rueda_dd», con el eje en x) para que el juego la gire; vacíos «asiento» (donde se sienta el muñeco),
«enganche» (el yugo donde va la criatura) y «escape» (de donde salen las chispas del turbo). Lo que dice «tinte» en el
material lo pinta el juego con el color del corredor.

Criaturas nuevas (`criatura_<id>`): el torso junto, y la cabeza, la cola y las cuatro patas cuelgan de su vacío en la
articulación («cabeza», «cola», «pata_di», «pata_dd», «pata_ti», «pata_td») para que el juego las anime al galope.

Uso: blender -b -P carreras_cosas.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from carreras_comun import (AURELIA, ESMERALDA, NOCTURNA, bola, caja, cilindro, disco, emblema, grupo, laca, luz, madera,  # noqa: E402
                            marca, media_luna, oro, raiz_pieza, tela, texto, tubo, unir_por_material)

RNG = np.random.default_rng(11)
MAD = lambda: madera('carro clara', '#C9955F')  # noqa: E731
OSC = lambda: madera('carro oscura', '#7E5236')  # noqa: E731
TINTE = lambda: tela('tinte carro', '#E4566B')  # noqa: E731
TINTE2 = lambda: tela('tinte carro claro', '#F49AA8')  # noqa: E731
CREMA = lambda: tela('cojin crema', '#FFF1D6')  # noqa: E731
HIERRO = lambda: laca('hierro carro', '#4A4650', 0.45)  # noqa: E731


# ------------------------------------------------------------------------------------------------ ruedas

def _rueda(coll, r, ancho, rayos=6):
    """Rueda de madera con llanta de fieltro gordita, cubo de latón y rayos; eje en x, centrada en el origen."""
    llanta = []
    for k in range(25):
        a = k / 24 * math.tau
        llanta.append((0, math.cos(a) * r * 0.86, math.sin(a) * r * 0.86))
    clay.sweep('llanta rueda', llanta, r * 0.16, (ancho / (r * 0.32), 1.0), coll, tela('llanta fieltro', '#3E3440'), segments=10, samples=2,
               closed=True, caps=(None, None), up=(1, 0, 0), subsurf=0)
    aro = []
    for k in range(25):
        a = k / 24 * math.tau
        aro.append((0, math.cos(a) * r * 0.68, math.sin(a) * r * 0.68))
    clay.sweep('aro rueda', aro, r * 0.06, (1.4, 1.0), coll, MAD(), segments=6, samples=2, closed=True, caps=(None, None), up=(1, 0, 0), subsurf=0)
    for k in range(rayos):
        a = k / rayos * math.tau
        tubo(coll, 'rayo rueda', [(0, math.cos(a) * r * 0.15, math.sin(a) * r * 0.15), (0, math.cos(a) * r * 0.66, math.sin(a) * r * 0.66)],
             r * 0.045, MAD(), seg=6)
    bola(coll, 'cubo rueda', (0, 0, 0), (ancho * 0.75, r * 0.2, r * 0.2), oro(), n=3, sub=1)
    for s in (-1, 1):
        bola(coll, 'tapa cubo', (s * ancho * 0.62, 0, 0), (0.03, r * 0.1, r * 0.1), laca('remache', '#B07A2E', 0.3), n=3, sub=0)


def ruedas(coll, padre, delante, atras):
    """Cuatro ruedas: (x, y, r) adelante y atrás. Cada una con su vacío para girar."""
    for nombre, (x, y, r), lado in (('rueda_di', delante, -1), ('rueda_dd', delante, 1), ('rueda_ti', atras, -1), ('rueda_td', atras, 1)):
        g = grupo(coll, nombre, (lado * x, y, r), lambda r=r: _rueda(coll, r, 0.14 + r * 0.12))
        g.parent = padre
        g.location = (lado * x, y, r)


def varas(coll, y0, z0, ancho=0.34):
    """Las varas de madera hasta el yugo acolchado donde va la criatura."""
    for s in (-1, 1):
        tubo(coll, 'vara', [(s * ancho, y0, z0), (s * (ancho + 0.03), y0 - 0.6, z0 + 0.08), (s * (ancho + 0.06), -1.95, z0 + 0.16)], 0.04, MAD(), seg=6)
        bola(coll, 'punta vara', (s * (ancho + 0.06), -1.97, z0 + 0.16), 0.055, oro(), n=3, sub=0)
    tubo(coll, 'yugo', [(-ancho - 0.06, -1.9, z0 + 0.16), (0, -1.88, z0 + 0.22), (ancho + 0.06, -1.9, z0 + 0.16)], 0.05, OSC(), seg=8)
    for s in (-1, 0, 1):
        bola(coll, 'cojin yugo', (s * 0.24, -1.88, z0 + 0.2), (0.1, 0.07, 0.07), TINTE(), n=3, sub=1)
    # Las riendas (cuerdas de fieltro) del yugo al asiento
    for s in (-1, 1):
        tubo(coll, 'rienda', [(s * 0.2, -1.88, z0 + 0.25), (s * 0.18, -1.2, z0 + 0.25), (s * 0.15, -0.45, z0 + 0.45)], 0.014, tela('rienda', '#7A4A2A'), seg=4)


def banderin(coll, x, y, z0, alto=1.25):
    """Asta con banderín de fieltro del color del corredor y una estrellita dorada en la punta."""
    cilindro(coll, 'asta', (x, y, z0), 0.03, alto, OSC(), seg=6)
    bola(coll, 'punta asta', (x, y, z0 + alto + 0.03), 0.06, oro(), n=3, sub=0)
    pts = [(x, y + 0.02, z0 + alto - 0.05), (x, y + 0.35, z0 + alto - 0.15), (x, y + 0.62, z0 + alto - 0.24)]
    clay.sweep('banderin', pts, [0.2, 0.14, 0.02], (0.14, 1.0), coll, TINTE(), segments=6, samples=4, up=(1, 0, 0), subsurf=0)
    pts2 = [(x, y + 0.02, z0 + alto - 0.36), (x, y + 0.3, z0 + alto - 0.4), (x, y + 0.5, z0 + alto - 0.44)]
    clay.sweep('banderin 2', pts2, [0.1, 0.07, 0.01], (0.14, 1.0), coll, tela('banderin crema', '#FFF1D6'), segments=6, samples=4, up=(1, 0, 0), subsurf=0)


def farol(coll, x, y, z):
    """Farolito de latón con su luz cálida."""
    cilindro(coll, 'base farol', (x, y, z), 0.07, 0.03, oro(), seg=8)
    bola(coll, 'vidrio farol', (x, y, z + 0.12), (0.06, 0.06, 0.09), luz('farol', '#FFD27A', 3.0), n=3, sub=1)
    for k in range(4):
        a = k / 4 * math.tau + math.pi / 4
        cilindro(coll, 'varilla farol', (x + math.cos(a) * 0.065, y + math.sin(a) * 0.065, z), 0.009, 0.24, HIERRO(), seg=4)
    bola(coll, 'tapa farol', (x, y, z + 0.25), (0.08, 0.08, 0.04), oro(), n=3, sub=0)


def colita_marcas(coll, padre, asiento, enganche, escape):
    for n, p in (('asiento', asiento), ('enganche', enganche), ('escape', escape)):
        marca(coll, n, p, padre)


# ------------------------------------------------------------------------------------------------ carros

def m_carro_carreta(coll):
    """La carreta clásica: tablones de madera, borde acolchado del color del corredor, cojín crema, emblema adelante."""
    raiz = bpy.data.objects.new('cuerpo carreta', None)
    clay.link(raiz, coll)

    def cuerpo():
        caja(coll, 'piso carreta', (0, 0.0, 0.42), (0.58, 0.88, 0.07), OSC(), p=5, sub=1)
        for s in (-1, 1):
            caja(coll, 'lado carreta', (s * 0.58, 0.0, 0.66), (0.06, 0.86, 0.2), MAD(), p=6, sub=1)
            for z in (0.58, 0.74):
                caja(coll, 'tablon', (s * 0.645, 0.0, z), (0.012, 0.84, 0.012), OSC(), p=4, sub=0)
            caja(coll, 'borde acolchado', (s * 0.58, 0.0, 0.88), (0.09, 0.9, 0.055), TINTE(), p=4, sub=1)
            for y in (-0.7, 0.0, 0.7):
                bola(coll, 'clavo', (s * 0.65, y, 0.66), 0.03, oro(), n=2, sub=0)
        caja(coll, 'frente carreta', (0, -0.86, 0.68), (0.55, 0.06, 0.22), MAD(), p=6, sub=1)
        caja(coll, 'borde frente', (0, -0.86, 0.92), (0.6, 0.09, 0.05), TINTE(), p=4, sub=1)
        caja(coll, 'atras carreta', (0, 0.84, 0.7), (0.55, 0.06, 0.24), MAD(), p=6, sub=1)
        caja(coll, 'borde atras', (0, 0.84, 0.96), (0.6, 0.09, 0.05), TINTE(), p=4, sub=1)
        # Cojín y espaldar
        bola(coll, 'cojin', (0, 0.22, 0.6), (0.44, 0.38, 0.12), CREMA(), n=4, sub=1)
        caja(coll, 'espaldar', (0, 0.66, 0.98), (0.46, 0.1, 0.3), TINTE2(), p=4, sub=1)
        for x in (-0.25, 0, 0.25):
            bola(coll, 'boton espaldar', (x, 0.55, 1.0), 0.03, oro(), n=2, sub=0)
        emblema(coll, (0, -0.93, 0.68), 0.17)
        # Guardabarros de fieltro sobre las ruedas de atrás
        for s in (-1, 1):
            arco = [(s * 0.74, 0.45 + math.cos(a) * 0.5, 0.42 + math.sin(a) * 0.5) for a in np.linspace(0.15, math.pi - 0.15, 7)]
            clay.sweep('guardabarros', arco, 0.05, (2.4, 0.6), coll, TINTE(), segments=6, samples=3, up=(1, 0, 0), subsurf=0)
        varas(coll, -0.86, 0.5)
        banderin(coll, 0.48, 0.84, 0.95)
        farol(coll, -0.48, 0.84, 0.96)
        # Un baúl con el equipaje atrás
        caja(coll, 'baul', (0, 1.08, 0.62), (0.32, 0.18, 0.16), OSC(), p=5, sub=1)
        caja(coll, 'cinta baul', (0, 1.08, 0.62), (0.34, 0.03, 0.17), oro(), p=4, sub=0)
    g = grupo(coll, 'carreta', (0, 0, 0), cuerpo)
    g.parent = raiz
    ruedas(coll, raiz, (0.6, -0.55, 0.32), (0.7, 0.45, 0.42))
    colita_marcas(coll, raiz, (0, 0.22, 0.64), (0, -1.95, 0.7), (0, 1.2, 0.5))


def _tina(coll, nombre, perfil, escala_y, material, seg=24):
    o = clay.lathe(nombre, perfil, coll, material, segments=seg, subsurf=1, cap_top=False, cap_bottom=False)
    o.scale = (1, escala_y, 1)
    bpy.context.view_layer.update()
    clay.apply_modifiers(o)
    o.data.transform(o.matrix_basis)
    o.matrix_basis.identity()
    return o


def m_carro_calesa(coll):
    """Calesa cubierta: tina ovalada de laca con capota de fieltro (como las de los paseos del pueblo), molduras doradas."""
    raiz = bpy.data.objects.new('cuerpo calesa', None)
    clay.link(raiz, coll)

    def cuerpo():
        _tina(coll, 'tina calesa', [(0.0, 0.32), (0.5, 0.34), (0.62, 0.5), (0.64, 0.72), (0.6, 0.86)], 1.42, laca('tinte calesa', '#E4566B', 0.35))
        o = clay.lathe('moldura calesa', [(0.6, 0.84), (0.66, 0.86), (0.66, 0.92), (0.6, 0.94)], coll, oro(), segments=24, subsurf=0, cap_top=False, cap_bottom=False)
        o.scale = (1, 1.42, 1)
        bola(coll, 'cojin', (0, 0.18, 0.56), (0.46, 0.4, 0.12), CREMA(), n=4, sub=1)
        # Capota: medio tubo de fieltro detrás del asiento, con sus costillas
        cap = tela('tinte capota', '#F49AA8')
        verts, caras = [], []
        na, ny = 12, 5
        for j in range(ny):
            y = 0.35 + 0.55 * j / (ny - 1)
            esc = 1.0 - 0.15 * (j / (ny - 1)) ** 2
            for i in range(na + 1):
                a = math.pi * i / na
                verts.append((math.cos(a) * 0.66 * esc, y, 0.88 + math.sin(a) * 0.62 * esc))
        for j in range(ny - 1):
            for i in range(na):
                a0, a1 = j * (na + 1) + i, j * (na + 1) + i + 1
                caras.append((a0, a1, a1 + na + 1, a0 + na + 1))
        o = clay.make_mesh_object('capota', verts, caras, coll, material=cap)
        clay.add_solidify(o, 0.04)
        clay.add_subsurf(o, 1, 2)
        for y in (0.35, 0.9):
            arco = [(math.cos(a) * 0.68, y, 0.88 + math.sin(a) * 0.64) for a in np.linspace(0, math.pi, 9)]
            clay.sweep('costilla capota', arco, 0.03, (1, 1), coll, oro(), segments=6, samples=3, subsurf=0)
        emblema(coll, (0, -0.92, 0.66), 0.2)
        varas(coll, -0.86, 0.52)
        farol(coll, 0.55, -0.7, 0.92)
        farol(coll, -0.55, -0.7, 0.92)
        banderin(coll, 0.0, 0.95, 1.5, alto=0.8)
        for s in (-1, 1):
            tubo(coll, 'estribo', [(s * 0.62, -0.3, 0.36), (s * 0.78, -0.3, 0.3), (s * 0.78, 0.2, 0.3), (s * 0.62, 0.2, 0.36)], 0.025, HIERRO(), seg=5)
    g = grupo(coll, 'calesa', (0, 0, 0), cuerpo)
    g.parent = raiz
    ruedas(coll, raiz, (0.66, -0.6, 0.34), (0.74, 0.5, 0.46))
    colita_marcas(coll, raiz, (0, 0.18, 0.6), (0, -1.95, 0.72), (0, 1.1, 0.5))


def m_carro_cesta(coll):
    """Carro de mimbre: una canasta gordita tejida en dos tonos, con aro acolchado, flores y una canastica de pan."""
    raiz = bpy.data.objects.new('cuerpo cesta', None)
    clay.link(raiz, coll)

    def cuerpo():
        claro, oscuro = madera('mimbre claro', '#E2B877'), madera('mimbre oscuro', '#B98A4E')
        alturas = np.linspace(0.32, 0.92, 9)
        for k in range(len(alturas) - 1):
            z0, z1 = alturas[k], alturas[k + 1]
            r0 = 0.48 + 0.18 * math.sin(math.pi * (z0 - 0.3) / 0.7)
            r1 = 0.48 + 0.18 * math.sin(math.pi * (z1 - 0.3) / 0.7)
            perfil = [(r0, z0), (r0 + 0.035, (z0 + z1) / 2), (r1, z1)]
            if k == 0:
                perfil = [(0.0, z0)] + perfil
            _tina(coll, 'mimbre', perfil, 1.38, claro if k % 2 else oscuro, seg=28)
        aro = [(math.cos(a) * 0.6, math.sin(a) * 0.6 * 1.38, 0.93) for a in np.linspace(0, math.tau, 29)[:-1]]
        clay.sweep('aro cesta', aro, 0.075, (1, 1), coll, TINTE(), segments=8, samples=2, closed=True, caps=(None, None), subsurf=0)
        for k in range(10):
            a = k / 10 * math.tau
            bola(coll, 'flor cesta', (math.cos(a) * 0.62, math.sin(a) * 0.62 * 1.38, 0.98), 0.055,
                 tela(f'flor cesta {k % 3}', ('#FFFFFF', '#F7C948', '#C9B6EA')[k % 3]), n=3, sub=0)
            bola(coll, 'centro flor', (math.cos(a) * 0.62, math.sin(a) * 0.62 * 1.38, 1.02), 0.025, laca('centro flor', '#F2A12E'), n=2, sub=0)
        bola(coll, 'cojin', (0, 0.15, 0.62), (0.44, 0.4, 0.12), CREMA(), n=4, sub=1)
        caja(coll, 'espaldar', (0, 0.6, 0.98), (0.4, 0.09, 0.26), TINTE2(), p=4, sub=1)
        emblema(coll, (0, -0.86, 0.66), 0.18)
        varas(coll, -0.8, 0.5)
        # Canastica de pan atrás
        caja(coll, 'canastica', (0.3, 0.88, 1.0), (0.14, 0.1, 0.07), madera('mimbre oscuro', '#B98A4E'), p=4, sub=1)
        for k in range(3):
            bola(coll, 'pan', (0.22 + k * 0.08, 0.88, 1.08), (0.05, 0.09, 0.04), laca('pan dorado', '#D9A066', 0.5), n=3, sub=0)
        banderin(coll, -0.35, 0.85, 0.95)
    g = grupo(coll, 'cesta', (0, 0, 0), cuerpo)
    g.parent = raiz
    ruedas(coll, raiz, (0.62, -0.55, 0.32), (0.74, 0.45, 0.45))
    colita_marcas(coll, raiz, (0, 0.15, 0.66), (0, -1.95, 0.7), (0, 1.0, 0.5))


def m_carro_calabaza(coll):
    """La calabaza de la cosecha: media calabaza naranja con gajos, rizo de tallo y hojas, cojines del color del corredor."""
    raiz = bpy.data.objects.new('cuerpo calabaza', None)
    clay.link(raiz, coll)

    def cuerpo():
        naranja = laca('calabaza', '#F28C3A', 0.45)
        # Perfil de calabaza abierta arriba, con gajos (ondas en el radio)
        o = clay.lathe('calabaza', [(0.0, 0.3), (0.45, 0.32), (0.68, 0.48), (0.72, 0.68), (0.62, 0.9)], coll, naranja, segments=48, subsurf=0, cap_top=False)
        me = o.data
        for v in me.vertices:
            x, y, z = v.co
            a = math.atan2(y, x)
            r = math.hypot(x, y)
            k = 1 + 0.07 * math.cos(a * 10)
            v.co = (x * k, y * k * 1.3, z)
        clay.add_subsurf(o, 1, 2)
        o2 = clay.lathe('borde calabaza', [(0.58, 0.88), (0.66, 0.9), (0.66, 0.96), (0.58, 0.97)], coll, laca('borde calabaza', '#D96E26', 0.4), segments=40, subsurf=0, cap_top=False, cap_bottom=False)
        o2.scale = (1, 1.3, 1)
        bola(coll, 'cojin', (0, 0.18, 0.6), (0.46, 0.4, 0.13), TINTE(), n=4, sub=1)
        caja(coll, 'espaldar', (0, 0.66, 0.98), (0.42, 0.1, 0.28), TINTE2(), p=4, sub=1)
        # Tallo en rizo y hojas atrás
        tallo = [(0, 0.86, 0.9), (0.02, 0.98, 1.12), (0.1, 1.05, 1.32), (0.22, 0.98, 1.4), (0.24, 0.86, 1.32)]
        clay.sweep('tallo calabaza', tallo, [0.08, 0.06, 0.045, 0.035, 0.02], (1, 1), coll, tela('tallo calabaza', '#5E8A3A'), segments=8, samples=4, subsurf=0)
        for s in (-1, 1):
            bola(coll, 'hoja calabaza', (s * 0.32, 0.92, 0.96), (0.22, 0.16, 0.035), tela('hoja calabaza', '#6FA850'), n=3, sub=1)
        emblema(coll, (0, -0.94, 0.66), 0.17)
        varas(coll, -0.86, 0.5)
        farol(coll, 0.52, 0.8, 0.95)
    g = grupo(coll, 'calabaza', (0, 0, 0), cuerpo)
    g.parent = raiz
    ruedas(coll, raiz, (0.62, -0.58, 0.32), (0.76, 0.48, 0.44))
    colita_marcas(coll, raiz, (0, 0.18, 0.66), (0, -1.95, 0.7), (0, 1.15, 0.5))


# ------------------------------------------------------------------------------------------------ criaturas nuevas

def _ojo(coll, x, y, z, r, mirar=-1):
    bola(coll, 'ojo', (x, y, z), (r, r * 0.45, r * 1.2), laca('ojo criatura', '#231B26', 0.15), n=3, sub=1)
    bola(coll, 'brillo ojo', (x - r * 0.3, y + mirar * r * 0.42, z + r * 0.45), (r * 0.32, r * 0.12, r * 0.36), luz('brillo ojo', '#FFFFFF', 2.0), n=2, sub=0)
    bola(coll, 'brillo chico', (x + r * 0.35, y + mirar * r * 0.42, z - r * 0.35), (r * 0.14, r * 0.06, r * 0.14), luz('brillo ojo', '#FFFFFF', 2.0), n=2, sub=0)


def _pata(coll, largo, r, piel, pie):
    tubo(coll, 'pata', [(0, 0, 0), (0, -0.02, -largo * 0.55), (0, 0.0, -largo)], r, piel, seg=8)
    bola(coll, 'pie', (0, -0.04, -largo - r * 0.25), (r * 1.15, r * 1.35, r * 0.75), pie, n=3, sub=1)


def m_criatura_zorro(coll):
    """El zorro de Brasaviva: peluche naranja brasa con panza crema, medias chocolate y la cola que termina en llama."""
    raiz = bpy.data.objects.new('criatura zorro', None)
    clay.link(raiz, coll)
    piel = tela('zorro pelaje', '#E8653C')
    crema = tela('zorro crema', '#FFE9CF')
    media = tela('zorro medias', '#5A3428')

    def torso():
        bola(coll, 'torso zorro', (0, 0, 0.62), (0.34, 0.56, 0.32), piel, n=5, sub=1)
        bola(coll, 'panza zorro', (0, -0.08, 0.5), (0.25, 0.42, 0.2), crema, n=4, sub=1)
        bola(coll, 'pecho zorro', (0, -0.42, 0.66), (0.24, 0.16, 0.24), crema, n=4, sub=1)
        # Arnés de fieltro con cascabel
        arnes = [(math.cos(a) * 0.36, -0.3, 0.62 + math.sin(a) * 0.34) for a in np.linspace(0, math.tau, 17)[:-1]]
        clay.sweep('arnes', arnes, 0.035, (1.5, 1), coll, tela('arnes rojo', '#B5313A'), segments=6, samples=2, closed=True, caps=(None, None), subsurf=0)
        bola(coll, 'cascabel', (0, -0.62, 0.48), 0.07, oro(), n=3, sub=1)
    g = grupo(coll, 'torso', (0, 0, 0), torso)
    g.parent = raiz

    def cabeza():
        bola(coll, 'cabeza zorro', (0, 0, 0.1), (0.33, 0.3, 0.29), piel, n=5, sub=1)
        bola(coll, 'cachetes zorro', (0, -0.12, 0.0), (0.3, 0.2, 0.17), crema, n=4, sub=1)
        bola(coll, 'hocico zorro', (0, -0.3, -0.01), (0.13, 0.18, 0.1), crema, n=4, sub=1)
        bola(coll, 'nariz zorro', (0, -0.47, 0.03), (0.06, 0.04, 0.045), laca('nariz', '#2B2230', 0.2), n=3, sub=1)
        for s in (-1, 1):
            _ojo(coll, s * 0.13, -0.25, 0.14, 0.055)
            bola(coll, 'rubor zorro', (s * 0.21, -0.2, 0.02), (0.05, 0.02, 0.035), tela('rubor criatura', '#F58A8A'), n=2, sub=0)
            oreja = [(s * 0.16, 0.02, 0.3), (s * 0.22, 0.04, 0.48), (s * 0.26, 0.06, 0.62)]
            clay.sweep('oreja zorro', oreja, [0.11, 0.07, 0.01], (1, 0.5), coll, piel, segments=8, samples=4, up=(0, 1, 0), subsurf=1)
            punta = [(s * 0.235, 0.05, 0.52), (s * 0.26, 0.06, 0.63)]
            clay.sweep('punta oreja', punta, [0.05, 0.01], (1, 0.55), coll, media, segments=6, samples=3, up=(0, 1, 0), subsurf=0)
            bola(coll, 'dentro oreja', (s * 0.2, -0.02, 0.43), (0.05, 0.02, 0.08), tela('dentro oreja', '#FFC9B0'), n=2, sub=0)
        # Un mechón de pelo en la frente
        clay.sweep('mechon zorro', [(0, -0.2, 0.32), (0.04, -0.3, 0.36), (0.09, -0.35, 0.32)], [0.05, 0.035, 0.01], (1, 0.6), coll, piel, segments=6, samples=3, subsurf=0)
    g = grupo(coll, 'cabeza', (0, -0.62, 0.86), cabeza)
    g.parent = raiz

    def cola():
        pts = [(0, 0, 0), (0, 0.3, 0.15), (0, 0.52, 0.42), (0, 0.6, 0.72)]
        clay.sweep('cola zorro', pts, [0.1, 0.2, 0.22, 0.12], (1, 1), coll, piel, segments=10, samples=4, subsurf=1)
        bola(coll, 'punta cola', (0, 0.6, 0.78), (0.15, 0.15, 0.18), crema, n=4, sub=1)
        bola(coll, 'llama cola', (0, 0.6, 0.92), (0.1, 0.1, 0.16), luz('llama zorro', '#FFB43A', 3.5), n=3, sub=1)
        bola(coll, 'llama cola 2', (0, 0.62, 1.04), (0.05, 0.05, 0.09), luz('llama zorro clara', '#FFE27A', 4.0), n=2, sub=0)
    g = grupo(coll, 'cola', (0, 0.5, 0.72), cola)
    g.parent = raiz
    for nombre, x, y in (('pata_di', -0.18, -0.34), ('pata_dd', 0.18, -0.34), ('pata_ti', -0.18, 0.36), ('pata_td', 0.18, 0.36)):
        g = grupo(coll, nombre, (x, y, 0.48), lambda: _pata(coll, 0.4, 0.085, piel, media))
        g.parent = raiz


def m_criatura_carnero(coll):
    """El carnero de Nieveclara: lana de nube (bolitas de felpa), cara gris, cuernos en espiral y bufanda tejida."""
    raiz = bpy.data.objects.new('criatura carnero', None)
    clay.link(raiz, coll)
    lana = tela('carnero lana', '#FBF6EE')
    lana2 = tela('carnero lana sombra', '#EDE3D6')
    cara = tela('carnero cara', '#6E6470')
    cuerno = laca('carnero cuerno', '#D8BE8E', 0.4)
    casco = laca('carnero casco', '#3B3340', 0.35)

    def torso():
        bola(coll, 'torso carnero', (0, 0, 0.64), (0.4, 0.58, 0.36), lana, n=5, sub=1)
        for k in range(26):
            a, b = RNG.uniform(0, math.tau), RNG.uniform(-0.5, 0.95)
            x, y, z = math.cos(a) * 0.38 * math.cos(b), RNG.uniform(-0.5, 0.5), 0.64 + math.sin(b) * 0.36
            bola(coll, 'bolita lana', (x, y, z), RNG.uniform(0.1, 0.15), lana if k % 3 else lana2, n=3, sub=1)
        # Bufanda tejida de rayas
        buf = [(math.cos(a) * 0.32, -0.46 + math.sin(a) * 0.05, 0.78 + math.sin(a) * 0.2) for a in np.linspace(0, math.tau, 13)[:-1]]
        clay.sweep('bufanda', buf, 0.07, (1, 1), coll, tela('bufanda roja', '#C73E4A'), segments=8, samples=2, closed=True, caps=(None, None), subsurf=0)
        clay.sweep('punta bufanda', [(0.2, -0.55, 0.7), (0.26, -0.6, 0.5), (0.3, -0.58, 0.32)], [0.07, 0.065, 0.06], (1.4, 0.5), coll,
                   tela('bufanda crema', '#FFF1D6'), segments=6, samples=3, subsurf=0)
    g = grupo(coll, 'torso', (0, 0, 0), torso)
    g.parent = raiz

    def cabeza():
        bola(coll, 'cabeza carnero', (0, -0.05, 0.02), (0.22, 0.28, 0.24), cara, n=5, sub=1)
        bola(coll, 'hocico carnero', (0, -0.3, -0.06), (0.15, 0.12, 0.12), tela('carnero hocico', '#8A7E8C'), n=4, sub=1)
        bola(coll, 'nariz carnero', (0, -0.41, -0.02), (0.05, 0.03, 0.03), laca('nariz', '#2B2230', 0.2), n=3, sub=1)
        for k in range(7):
            a = k / 7 * math.pi
            bola(coll, 'copete lana', (math.cos(a) * 0.17, -0.08 + math.sin(a) * 0.04, 0.24 + math.sin(a) * 0.05), 0.09, lana, n=3, sub=1)
        for s in (-1, 1):
            _ojo(coll, s * 0.11, -0.25, 0.06, 0.05)
            bola(coll, 'rubor carnero', (s * 0.17, -0.22, -0.06), (0.045, 0.02, 0.03), tela('rubor criatura', '#F58A8A'), n=2, sub=0)
            bola(coll, 'oreja carnero', (s * 0.27, 0.0, 0.02), (0.14, 0.06, 0.05), cara, n=3, sub=1)
            # Cuerno en espiral
            pts = []
            for k in range(14):
                t = k / 13
                a = t * math.pi * 1.7
                rr = 0.16 * (1 - t * 0.55)
                pts.append((s * (0.18 + 0.1 * t), 0.06 + math.cos(a) * rr - 0.0, 0.14 + math.sin(a) * rr))
            clay.sweep('cuerno carnero', pts, [0.075 * (1 - k / 16) for k in range(14)], (1, 1), coll, cuerno, segments=8, samples=2, subsurf=0)
    g = grupo(coll, 'cabeza', (0, -0.62, 0.9), cabeza)
    g.parent = raiz

    def cola():
        bola(coll, 'cola carnero', (0, 0.08, 0.0), (0.13, 0.12, 0.12), lana, n=3, sub=1)
    g = grupo(coll, 'cola', (0, 0.56, 0.74), cola)
    g.parent = raiz
    for nombre, x, y in (('pata_di', -0.2, -0.32), ('pata_dd', 0.2, -0.32), ('pata_ti', -0.2, 0.34), ('pata_td', 0.2, 0.34)):
        g = grupo(coll, nombre, (x, y, 0.46), lambda: _pata(coll, 0.38, 0.08, cara, casco))
        g.parent = raiz


def m_criatura_cria(coll):
    """La cría de unicornio de la granja (granja_cria.py), en una pieza para el galope a saltitos."""
    from granja_cria import m_cria_unicornio
    raiz = bpy.data.objects.new('criatura cria', None)
    clay.link(raiz, coll)
    g = grupo(coll, 'cuerpo cria', (0, 0, 0), lambda: m_cria_unicornio(coll))
    g.parent = raiz


# ------------------------------------------------------------------------------------------------ caja de objetos

def m_caja_objetos(coll):
    """La caja de objetos: un cojín cuadrado de felpa con costuras doradas y el emblema de las tres lunas en cada cara."""
    raiz = bpy.data.objects.new('caja objetos', None)
    clay.link(raiz, coll)

    def cuerpo():
        caja(coll, 'cojin caja', (0, 0, 0), (0.48, 0.48, 0.48), tela('caja lila', '#B79BE8'), p=6, sub=1, n=5)
        # Costuras doradas en las 12 aristas
        for ax in range(3):
            for s1 in (-1, 1):
                for s2 in (-1, 1):
                    a, b = [(i) for i in range(3) if i != ax]
                    p0, p1 = [0, 0, 0], [0, 0, 0]
                    p0[ax], p1[ax] = -0.34, 0.34
                    p0[a] = p1[a] = s1 * 0.43
                    p0[b] = p1[b] = s2 * 0.43
                    tubo(coll, 'costura caja', [tuple(p0), tuple(p1)], 0.022, oro(), seg=5)
        for eje, lado in (('y', -1), ('y', 1), ('x', -1), ('x', 1), ('z', -1), ('z', 1)):
            c = {'y': (0, lado * 0.47, 0), 'x': (lado * 0.47, 0, 0), 'z': (0, 0, lado * 0.47)}[eje]
            emblema(coll, c, 0.27, eje=eje, lado=lado)
        for k in range(8):
            sx, sy, sz = (k & 1) * 2 - 1, (k >> 1 & 1) * 2 - 1, (k >> 2 & 1) * 2 - 1
            bola(coll, 'borla caja', (sx * 0.43, sy * 0.43, sz * 0.43), 0.06, laca('borla', AURELIA, 0.3), n=2, sub=0)
    g = grupo(coll, 'caja', (0, 0, 0), cuerpo)
    g.parent = raiz


# ------------------------------------------------------------------------------------------------ objetos

def m_obj_chispa(coll):
    """Chispa de Aura: estrella de fieltro dorada-naranja de cuatro puntas, con corazón de luz."""
    raiz = bpy.data.objects.new('chispa', None)
    clay.link(raiz, coll)

    def cuerpo():
        for k in range(4):
            a = k / 4 * math.tau
            pts = [(0, 0, 0), (math.cos(a) * 0.25, 0, math.sin(a) * 0.25), (math.cos(a) * 0.48, 0, math.sin(a) * 0.48)]
            clay.sweep('punta chispa', pts, [0.17, 0.09, 0.01], (1, 0.5), coll, laca('chispa oro', '#FFB43A', 0.3), segments=8, samples=3, up=(0, 1, 0), subsurf=0)
        for k in range(4):
            a = k / 4 * math.tau + math.pi / 4
            pts = [(0, 0, 0), (math.cos(a) * 0.3, 0, math.sin(a) * 0.3)]
            clay.sweep('punta chica', pts, [0.08, 0.01], (1, 0.5), coll, laca('chispa clara', '#FFE27A', 0.3), segments=6, samples=3, up=(0, 1, 0), subsurf=0)
        bola(coll, 'corazon chispa', (0, 0, 0), (0.15, 0.1, 0.15), luz('chispa luz', '#FFF2B0', 4.0), n=3, sub=1)
    g = grupo(coll, 'chispa', (0, 0, 0.5), cuerpo)
    g.parent = raiz


def m_obj_semilla(coll):
    """Semilla de Celia: frijol gordito con un brote verde de dos hojas."""
    raiz = bpy.data.objects.new('semilla', None)
    clay.link(raiz, coll)

    def cuerpo():
        bola(coll, 'semilla', (0, 0, 0), (0.3, 0.22, 0.24), laca('semilla', '#9A6A3E', 0.45), n=4, sub=1)
        bola(coll, 'franja semilla', (0, -0.14, 0.05), (0.22, 0.1, 0.16), laca('semilla clara', '#C79A62', 0.45), n=3, sub=1)
        tubo(coll, 'brote', [(0, 0, 0.2), (0.03, 0, 0.36), (0, 0, 0.48)], 0.03, tela('brote', '#5FA84A'), seg=6)
        for s in (-1, 1):
            bola(coll, 'hoja brote', (s * 0.12, 0, 0.5), (0.13, 0.05, 0.06), tela('hoja brote', '#7CC459'), n=3, sub=1)
    g = grupo(coll, 'semilla', (0, 0, 0.5), cuerpo)
    g.parent = raiz


def m_obj_enredadera(coll):
    """La enredadera que brota de la semilla en la pista: un nudo de bejucos con hojas y florecitas (1,8 m)."""
    raiz = bpy.data.objects.new('enredadera', None)
    clay.link(raiz, coll)

    def cuerpo():
        verde = tela('bejuco', '#4E8A3A')
        for k in range(7):
            a = k / 7 * math.tau
            pts = [(math.cos(a) * 0.15, math.sin(a) * 0.15, 0.05)]
            for j in range(1, 5):
                rr = 0.15 + j * 0.18
                aa = a + j * 0.7
                pts.append((math.cos(aa) * rr, math.sin(aa) * rr, 0.08 + math.sin(j * 1.3 + k) * 0.25 + (0.45 if j == 2 else 0.1)))
            clay.sweep('bejuco', pts, [0.07, 0.06, 0.05, 0.04, 0.02], (1, 1), coll, verde, segments=6, samples=3, subsurf=0)
            for j, p in enumerate(pts[1:]):
                bola(coll, 'hoja bejuco', p, (0.12, 0.07, 0.04), tela('hoja bejuco', ('#6FA850', '#8CC45E')[j % 2]), n=3, sub=0)
            bola(coll, 'flor bejuco', pts[-1], 0.06, tela(f'flor bejuco {k % 3}', ('#F7A1C4', '#FFFFFF', '#F7C948')[k % 3]), n=3, sub=0)
        bola(coll, 'nudo', (0, 0, 0.18), (0.3, 0.3, 0.2), tela('bejuco', '#4E8A3A'), n=3, sub=1)
        bola(coll, 'semilla rota', (0.1, 0.05, 0.3), (0.16, 0.12, 0.1), laca('semilla', '#9A6A3E', 0.45), n=3, sub=0)
    g = grupo(coll, 'enredadera', (0, 0, 0), cuerpo)
    g.parent = raiz


def m_obj_velo(coll):
    """Velo de Lara: tela oscura que ondea, con estrellitas de plata bordadas."""
    raiz = bpy.data.objects.new('velo', None)
    clay.link(raiz, coll)

    def cuerpo():
        verts, caras = [], []
        n = 10
        for j in range(n + 1):
            for i in range(n + 1):
                u, v = i / n - 0.5, j / n
                verts.append((u * 0.8 * (1 - v * 0.25), math.sin(u * 5 + v * 3) * 0.08 + v * 0.05, 0.9 - v * 0.85 + math.cos(u * 3.2) * 0.05))
        for j in range(n):
            for i in range(n):
                a = j * (n + 1) + i
                caras.append((a, a + 1, a + n + 2, a + n + 1))
        o = clay.make_mesh_object('velo', verts, caras, coll, material=tela('velo lara', '#3A2C55'))
        clay.add_solidify(o, 0.025)
        clay.add_subsurf(o, 1, 2)
        bola(coll, 'broche velo', (0, -0.02, 0.92), 0.07, laca('plata', '#DCE3F0', 0.25), n=3, sub=1)
        for k in range(9):
            u, v = RNG.uniform(-0.3, 0.3), RNG.uniform(0.15, 0.85)
            bola(coll, 'estrella velo', (u * 0.8, -0.06 + math.sin(u * 5 + v * 3) * 0.08, 0.9 - v * 0.85), 0.03, luz('estrella plata', '#E8EEFF', 2.5), n=2, sub=0)
    g = grupo(coll, 'velo', (0, 0, 0.1), cuerpo)
    g.parent = raiz


def m_obj_ceniza(coll):
    """Ceniza de Nath'Gora: la urnita gris con brasas frías (el ícono)."""
    raiz = bpy.data.objects.new('urna ceniza', None)
    clay.link(raiz, coll)

    def cuerpo():
        clay.lathe('urna', [(0.0, 0.0), (0.18, 0.0), (0.26, 0.15), (0.24, 0.38), (0.14, 0.48), (0.16, 0.55)], coll, laca('urna gris', '#6B6670', 0.5), segments=16, subsurf=1)
        bola(coll, 'ceniza urna', (0, 0, 0.55), (0.15, 0.15, 0.06), tela('ceniza', '#9A96A0'), n=3, sub=1)
        for k in range(5):
            a = k / 5 * math.tau
            bola(coll, 'brasa fria', (math.cos(a) * 0.08, math.sin(a) * 0.08, 0.6), 0.03, luz('brasa fria', '#8FB4FF', 3.0), n=2, sub=0)
        for k in range(3):
            bola(coll, 'humo', (0.05 * k, 0, 0.75 + k * 0.14), 0.09 - k * 0.015, tela('humo ceniza', '#B8B4C0'), n=3, sub=1)
    g = grupo(coll, 'urna', (0, 0, 0.2), cuerpo)
    g.parent = raiz


def m_obj_charco(coll):
    """El charco de ceniza en la pista (resbaloso): mancha gris con brasas frías y volutas (2 m)."""
    raiz = bpy.data.objects.new('charco ceniza', None)
    clay.link(raiz, coll)

    def cuerpo():
        def forma(v):
            a = np.arctan2(v[:, 1], v[:, 0])
            k = 1 + 0.12 * np.sin(a * 5) + 0.06 * np.cos(a * 3)
            v[:, 0] *= k
            v[:, 1] *= k
            return v
        clay.blob('charco', (0, 0, 0.03), (0.95, 0.95, 0.04), coll, tela('ceniza charco', '#4A4652'), n=6, shaper=forma, subsurf=1)
        clay.blob('charco claro', (0.1, 0.05, 0.05), (0.55, 0.5, 0.035), coll, tela('ceniza', '#9A96A0'), n=5, shaper=forma, subsurf=1)
        for k in range(10):
            a, r = RNG.uniform(0, math.tau), RNG.uniform(0.1, 0.75)
            bola(coll, 'brasa charco', (math.cos(a) * r, math.sin(a) * r, 0.07), 0.04, luz('brasa fria', '#8FB4FF', 3.0), n=2, sub=0)
        for k in range(3):
            a = k / 3 * math.tau
            bola(coll, 'voluta', (math.cos(a) * 0.4, math.sin(a) * 0.4, 0.25 + k * 0.1), (0.14, 0.14, 0.11), tela('humo ceniza', '#B8B4C0'), n=3, sub=1)
    g = grupo(coll, 'charco', (0, 0, 0), cuerpo)
    g.parent = raiz


def m_obj_pluma(coll):
    """Pluma de grifo: dorada, curva, con el cañón crema y la punta canela."""
    raiz = bpy.data.objects.new('pluma', None)
    clay.link(raiz, coll)

    def cuerpo():
        pts = [(0, 0, -0.45), (0.04, 0, -0.1), (0.1, 0, 0.2), (0.06, 0, 0.45)]
        clay.sweep('pluma', pts, [0.02, 0.17, 0.16, 0.02], (1, 0.18), coll, tela('pluma dorada', '#F2C14E'), segments=8, samples=5, up=(0, 1, 0), subsurf=1)
        clay.sweep('punta pluma', [(0.09, 0, 0.25), (0.08, 0, 0.36), (0.06, 0, 0.46)], [0.12, 0.08, 0.01], (1, 0.2), coll, tela('pluma canela', '#C9844A'),
                   segments=6, samples=4, up=(0, 1, 0), subsurf=0)
        tubo(coll, 'canon pluma', [(0, -0.02, -0.5), (0.05, -0.02, 0.0), (0.08, -0.02, 0.42)], 0.018, laca('canon', '#FFF1D6', 0.3), seg=5)
        for k in range(4):
            z = -0.2 + k * 0.15
            bola(coll, 'brillo pluma', (0.15, -0.03, z), 0.02, luz('estrella oro', '#FFF2B0', 3.0), n=2, sub=0)
    g = grupo(coll, 'pluma', (0, 0, 0.6), cuerpo, rot=(0, 0.35, 0))
    g.parent = raiz


def m_obj_nube(coll):
    """Lluvia de Celia: nube gordita de felpa con gotas azules colgando y una carita dormida."""
    raiz = bpy.data.objects.new('nube', None)
    clay.link(raiz, coll)

    def cuerpo():
        nube = tela('nube', '#F2F4FA')
        for x, y, z, r in ((0, 0, 0, 0.38), (-0.38, 0.02, -0.08, 0.28), (0.38, 0.02, -0.06, 0.3), (-0.18, 0.05, 0.22, 0.26), (0.2, 0.04, 0.2, 0.28), (0, 0.15, 0.1, 0.3)):
            bola(coll, 'nube', (x, y, z), (r, r * 0.85, r * 0.9), nube, n=4, sub=1)
        bola(coll, 'base nube', (0, 0, -0.18), (0.62, 0.3, 0.14), tela('nube sombra', '#D3DAEA'), n=4, sub=1)
        for s in (-1, 1):
            tubo(coll, 'ojo dormido', [(s * 0.17, -0.35, 0.02), (s * 0.12, -0.37, -0.02), (s * 0.07, -0.35, 0.02)], 0.015, laca('nariz', '#2B2230', 0.2), seg=4)
            bola(coll, 'rubor nube', (s * 0.22, -0.32, -0.07), (0.05, 0.02, 0.03), tela('rubor criatura', '#F58A8A'), n=2, sub=0)
        for k in range(7):
            x = -0.45 + k * 0.15
            z = -0.38 - (k % 3) * 0.12
            bola(coll, 'gota', (x, 0, z), (0.045, 0.045, 0.07), laca('gota', '#6FB5F0', 0.15), n=3, sub=1)
    g = grupo(coll, 'nube', (0, 0, 0.7), cuerpo)
    g.parent = raiz


def m_obj_lucero(coll):
    """Lucero de Aurelia: la lunita dorada con alitas de fieltro que persigue al de adelante."""
    raiz = bpy.data.objects.new('lucero', None)
    clay.link(raiz, coll)

    def cuerpo():
        bola(coll, 'lucero', (0, 0, 0), 0.3, laca('lucero oro', AURELIA, 0.25), n=4, sub=1)
        for k in range(6):
            a = k / 6 * math.tau
            bola(coll, 'crater', (math.cos(a) * 0.2, -0.2, math.sin(a) * 0.15), 0.05, laca('crater', '#D9A43A', 0.3), n=2, sub=0)
        for s in (-1, 1):
            _ojo(coll, s * 0.1, -0.27, 0.05, 0.04)
            ala = [(s * 0.25, 0.05, 0.05), (s * 0.45, 0.1, 0.2), (s * 0.55, 0.12, 0.3)]
            clay.sweep('ala lucero', ala, [0.1, 0.12, 0.02], (1, 0.25), coll, tela('ala blanca', '#FFFFFF'), segments=6, samples=4, up=(0, 1, 0), subsurf=0)
        aro = [(math.cos(a) * 0.42, math.sin(a) * 0.42 * 0.3, math.sin(a) * 0.1) for a in np.linspace(0, math.tau, 21)[:-1]]
        clay.sweep('anillo lucero', aro, 0.025, (1, 1), coll, luz('anillo lucero', '#FFE9A8', 3.0), segments=5, samples=2, closed=True, caps=(None, None), subsurf=0)
    g = grupo(coll, 'lucero', (0, 0, 0.6), cuerpo)
    g.parent = raiz


def m_obj_brasa(coll):
    """Brasa de dragón: bola de fuego de fieltro con mechones de llama."""
    raiz = bpy.data.objects.new('brasa', None)
    clay.link(raiz, coll)

    def cuerpo():
        bola(coll, 'brasa', (0, 0, 0), 0.3, luz('brasa naranja', '#FF7A2A', 2.5), n=4, sub=1)
        bola(coll, 'nucleo brasa', (0, -0.12, 0.02), 0.18, luz('brasa clara', '#FFE27A', 4.0), n=3, sub=1)
        for k in range(7):
            a = k / 7 * math.tau
            pts = [(math.cos(a) * 0.2, 0.1, math.sin(a) * 0.2), (math.cos(a) * 0.3, 0.35, math.sin(a) * 0.3 + 0.05), (math.cos(a) * 0.22, 0.6, math.sin(a) * 0.22 + 0.1)]
            clay.sweep('llama brasa', pts, [0.12, 0.08, 0.01], (1, 1), coll, luz('llama roja', '#E8402A', 2.5), segments=6, samples=3, subsurf=0)
        for s in (-1, 1):
            _ojo(coll, s * 0.1, -0.27, 0.06, 0.04)
    g = grupo(coll, 'brasa', (0, 0, 0.6), cuerpo)
    g.parent = raiz


def m_turbo_flecha(coll):
    """La flecha de turbo en el piso (las chispas de Aura): chevrones de fieltro dorado y naranja que brillan."""
    raiz = bpy.data.objects.new('turbo', None)
    clay.link(raiz, coll)

    def cuerpo():
        caja(coll, 'tapete turbo', (0, 0, 0.03), (1.6, 2.2, 0.03), tela('tapete turbo', '#7A3E8E'), p=4, sub=0)
        for k in range(3):
            y = -1.2 + k * 1.1
            for s in (-1, 1):
                pts = [(s * 1.1, y + 0.55, 0.07), (0, y - 0.25, 0.07)]
                tubo(coll, 'chevron', pts, 0.16, luz('turbo oro', ('#FFB43A', '#FFD27A', '#FFE9A8')[k], 3.0), seg=6)
        for s in (-1, 1):
            tubo(coll, 'costura turbo', [(s * 1.5, -2.1, 0.07), (s * 1.5, 2.1, 0.07)], 0.04, oro(), seg=4)
    g = grupo(coll, 'turbo', (0, 0, 0), cuerpo)
    g.parent = raiz


def m_rampa(coll):
    """Rampa de salto: tablones de madera curvados con franjas de fieltro y banderines (4 m de ancho)."""
    raiz = bpy.data.objects.new('rampa', None)
    clay.link(raiz, coll)

    def cuerpo():
        n = 6
        for k in range(n):
            y0 = 1.6 - k * 3.2 / n
            y1 = y0 - 3.2 / n
            z0 = 0.05 + 1.1 * ((k) / n) ** 1.6
            z1 = 0.05 + 1.1 * ((k + 1) / n) ** 1.6
            verts = [(-2.1, y0, z0), (2.1, y0, z0), (2.1, y1, z1), (-2.1, y1, z1), (-2.1, y0, 0), (2.1, y0, 0), (2.1, y1, 0), (-2.1, y1, 0)]
            caras = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 3, 7, 4), (1, 5, 6, 2), (3, 2, 6, 7), (0, 4, 5, 1)]
            clay.make_mesh_object('tablon rampa', verts, caras, coll, smooth=False, material=MAD() if k % 2 else OSC())
        for s in (-1, 1):
            tubo(coll, 'franja rampa', [(s * 1.4, 1.6, 0.08), (s * 1.4, 0.0, 0.42), (s * 1.4, -1.6, 1.18)], 0.09, tela('franja rampa', '#F7C948'), seg=5)
            tubo(coll, 'baranda rampa', [(s * 2.15, 1.6, 0.15), (s * 2.15, -1.6, 1.25)], 0.08, tela('tinte franja', '#E4566B'), seg=6)
            cilindro(coll, 'poste rampa', (s * 2.15, -1.6, 0), 0.07, 1.6, OSC(), seg=6)
            pts = [(s * 2.15, -1.6, 1.55), (s * 2.15, -1.25, 1.45), (s * 2.15, -0.95, 1.36)]
            clay.sweep('banderin rampa', pts, [0.18, 0.12, 0.01], (0.12, 1), coll, tela('banderin rampa', '#4FBF7A'), segments=5, samples=3, up=(1, 0, 0), subsurf=0)
    g = grupo(coll, 'rampa', (0, 0, 0), cuerpo)
    g.parent = raiz


# ------------------------------------------------------------------------------------------------ podio y copa

def m_podio(coll):
    """El podio de las Tres Lunas: tres escalones de madera con tapete de fieltro y su número, un arco de fieltro con las
    tres lunas, guirnaldas de banderines, faroles y flores (8 m de ancho)."""
    raiz = bpy.data.objects.new('podio', None)
    clay.link(raiz, coll)

    def cuerpo():
        for x, alto, color, num in ((0, 1.2, '#F2C14E', '1'), (-1.9, 0.85, '#DCE3F0', '2'), (1.9, 0.6, '#E0A060', '3')):
            caja(coll, 'escalon', (x, 0, alto / 2), (0.9, 0.85, alto / 2), MAD(), p=6, sub=1)
            caja(coll, 'tapete escalon', (x, 0, alto + 0.03), (0.92, 0.87, 0.05), tela(f'tapete podio {num}', color), p=5, sub=1)
            for k in range(3):
                caja(coll, 'tabla escalon', (x, -0.86, 0.15 + k * alto / 3), (0.88, 0.012, 0.015), OSC(), p=4, sub=0)
            disco(coll, 'parche numero', (x, -0.87, alto * 0.55), 0.36, 0.04, tela('parche crema', '#FFF3DA'))
            texto(coll, f'numero {num}', num, (x, -0.92, alto * 0.55), 0.48, laca(f'numero {num}', '#7A3E2A' if num != '1' else '#B5313A', 0.3), grosor=0.04)
        # Arco de fieltro con las lunas
        for s in (-1, 1):
            cilindro(coll, 'columna arco', (s * 3.6, 0.9, 0), 0.2, 4.4, MAD(), seg=12)
            for k in range(6):
                bola(coll, 'anillo columna', (s * 3.6, 0.9, 0.4 + k * 0.75), (0.24, 0.24, 0.07), tela('tinte anillo', '#B79BE8' if k % 2 else '#F7C948'), n=3, sub=0)
            farol(coll, s * 3.6, 0.9, 4.4)
        arco = [(math.cos(a) * 3.6, 0.9, 4.4 + math.sin(a) * 1.4) for a in np.linspace(0, math.pi, 15)]
        clay.sweep('arco', arco, 0.22, (1, 1), coll, tela('arco lila', '#7A5BB8'), segments=10, samples=3, subsurf=0)
        emblema(coll, (0, 0.82, 5.3), 0.9)
        # Guirnalda de banderines
        for fila, z0 in ((0, 3.5), (1, 2.6)):
            pts = [(-3.6 + 7.2 * k / 12, 0.85, z0 - math.sin(math.pi * k / 12) * 0.6) for k in range(13)]
            tubo(coll, 'cuerda', pts, 0.015, tela('cuerda', '#7A4A2A'), seg=4)
            for k in range(12):
                x, _, z = pts[k]
                x2, _, z2 = pts[k + 1]
                cx, cz = (x + x2) / 2, (z + z2) / 2
                verts = [(x + 0.05, 0.83, z), (x2 - 0.05, 0.83, z2), (cx, 0.83, cz - 0.42)]
                o = clay.make_mesh_object('banderin', verts, [(0, 1, 2)], coll, material=tela(f'banderin {k % 4}', ('#E4566B', '#F7C948', '#8FD6B9', '#8EC5F0')[k % 4]))
                clay.add_solidify(o, 0.02)
        # Flores y cojines al pie
        for k in range(14):
            x = -3.2 + k * 0.5
            bola(coll, 'mata', (x, -1.05, 0.15), (0.24, 0.2, 0.18), tela('mata', '#5E9A44'), n=3, sub=1)
            bola(coll, 'flor', (x + 0.05, -1.15, 0.3), 0.07, tela(f'flor podio {k % 3}', ('#F7A1C4', '#FFFFFF', '#F7C948')[k % 3]), n=2, sub=0)
        caja(coll, 'tarima', (0, 0.2, 0.04), (4.0, 1.5, 0.05), tela('tarima', '#C73E4A'), p=5, sub=0)
    g = grupo(coll, 'podio', (0, 0, 0), cuerpo)
    g.parent = raiz
    for n, p in (('puesto_1', (0, -0.1, 1.25)), ('puesto_2', (-1.9, -0.1, 0.9)), ('puesto_3', (1.9, -0.1, 0.65))):
        marca(coll, n, p, raiz)


def m_copa(coll):
    """La copa de las Tres Lunas: oro, asas en rizo y las tres lunas encima."""
    raiz = bpy.data.objects.new('copa', None)
    clay.link(raiz, coll)

    def cuerpo():
        clay.lathe('copa', [(0.0, 0.0), (0.2, 0.0), (0.2, 0.05), (0.08, 0.1), (0.05, 0.25), (0.08, 0.3), (0.24, 0.42), (0.26, 0.62), (0.22, 0.64)], coll,
                   oro(), segments=20, subsurf=1)
        for s in (-1, 1):
            tubo(coll, 'asa', [(s * 0.24, 0, 0.6), (s * 0.38, 0, 0.6), (s * 0.36, 0, 0.45), (s * 0.24, 0, 0.42)], 0.025, oro(), seg=6)
        bola(coll, 'aurelia copa', (-0.1, 0, 0.78), 0.09, laca('luna aurelia', AURELIA, 0.3), n=3, sub=1)
        media_luna(coll, 'nocturna copa', (0.1, 0, 0.8), 0.08, laca('luna nocturna', NOCTURNA, 0.3), grosor=0.05)
        bola(coll, 'esmeralda copa', (0, 0, 0.7), 0.05, laca('luna esmeralda', ESMERALDA, 0.3), n=3, sub=1)
        disco(coll, 'placa copa', (0, -0.24, 0.5), 0.07, 0.02, laca('placa', '#B5313A', 0.3))
    g = grupo(coll, 'copa', (0, 0, 0), cuerpo)
    g.parent = raiz


def m_garaje(coll):
    """El tapete del garaje (menú): un tapete redondo de fieltro con costura dorada y el emblema, cajas de objetos a
    los lados, un banderín, un barril de herramientas y flores."""
    raiz = bpy.data.objects.new('garaje', None)
    clay.link(raiz, coll)

    def cuerpo():
        clay.lathe('tapete garaje', [(0.0, 0.0), (3.4, 0.0), (3.45, 0.06), (3.3, 0.1), (0.0, 0.1)], coll, tela('tapete garaje', '#7A5BB8'), segments=48, subsurf=0)
        clay.lathe('borde garaje', [(3.3, 0.06), (3.6, 0.05), (3.6, 0.12), (3.3, 0.12)], coll, tela('borde garaje', '#F2C14E'), segments=48, subsurf=0, cap_top=False, cap_bottom=False)
        ring = [(math.cos(a) * 3.0, math.sin(a) * 3.0, 0.11) for a in np.linspace(0, math.tau, 49)[:-1]]
        clay.stitches('costura garaje', ring, 0.025, 0.12, 0.08, coll, oro(), closed=True)
        for k in range(16):
            a = k / 16 * math.tau
            bola(coll, 'borla garaje', (math.cos(a) * 3.55, math.sin(a) * 3.55, 0.12), 0.08, tela(f'borla {k % 2}', ('#E4566B', '#FFF3DA')[k % 2]), n=2, sub=0)
        # Barril de herramientas y un banderín atrás
        clay.lathe('barril', [(0.0, 0.0), (0.42, 0.0), (0.5, 0.45), (0.42, 0.9), (0.0, 0.9)], coll, MAD(), segments=14, subsurf=1)
        o = coll.objects[-1]
        o.location = (2.6, 2.0, 0.1)
        for z in (0.2, 0.7):
            r = clay.lathe('aro barril', [(0.46, z), (0.48, z + 0.04), (0.46, z + 0.08)], coll, HIERRO(), segments=14, subsurf=0, cap_top=False, cap_bottom=False)
            r.location = (2.6, 2.0, 0.1)
        for k in range(3):
            tubo(coll, 'herramienta', [(2.5 + k * 0.1, 2.0, 0.9), (2.45 + k * 0.12, 2.0, 1.5)], 0.03, OSC(), seg=4)
        banderin(coll, -2.7, 2.1, 0.1, alto=1.8)
        for k in range(6):
            a = 2.3 + k * 0.3
            bola(coll, 'flor garaje', (math.cos(a) * 3.1, math.sin(a) * 3.1, 0.25), 0.12, tela(f'flor cesta {k % 3}', ('#FFFFFF', '#F7C948', '#C9B6EA')[k % 3]), n=2, sub=0)
            bola(coll, 'mata garaje', (math.cos(a) * 3.15, math.sin(a) * 3.15, 0.12), (0.2, 0.2, 0.14), tela('mata', '#5E9A44'), n=2, sub=0)
    g = grupo(coll, 'garaje', (0, 0, 0), cuerpo)
    g.parent = raiz


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Carreras')
    raices = []
    for clave in claves or PIEZAS:
        r = raiz_pieza(coll, clave, PIEZAS[clave])
        raices.append(r)
        print('pieza', clave, flush=True)
    from carreras_comun import exportar
    exportar(raices, os.path.join(out, 'carreras_cosas.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
