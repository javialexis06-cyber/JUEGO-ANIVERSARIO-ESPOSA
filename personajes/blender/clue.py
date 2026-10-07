"""¿Quién fue?: el Clue de la casona en fieltro y plastilina, renderizado en Cycles.

Uso: python3.11 personajes/blender/clue.py <salida> [partes...] [--rapido]
  tablero      tablero.png: la casona completa vista desde arriba (80 px por casilla, cuadra exacto con el SVG del juego)
  sospechosos  s_<id>.png: los seis sospechosos de cuerpo entero (fondo transparente), con el generador de los clientes
  armas        a_<id>.png: las seis armas (fondo transparente)
  --rapido     mitad de resolución y pocas muestras (para revisar la composición)
Al final pasa todo a webp en juego/web/public/modelos/clue/.

Las medidas del tablero son las de juego/web/src/mesa/clue/tablero.ts: 24 × 16 casillas, nueve cuartos, el sótano
del centro, puertas y pasadizos. Si se cambian allá, se cambian aquí. En el juego encima van, en SVG, los nombres de
los cuartos, las casillas a donde se puede ir, las fichas y las cartas boca abajo; por eso los muebles se quedan en la
parte de arriba de cada cuarto y la de abajo queda libre (ahí se paran las figuritas).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import casa  # noqa: E402
import clay  # noqa: E402
import clientes  # noqa: E402
import tiendas  # noqa: E402
from casa import laca, luz, madera, tela  # noqa: E402
from tiendas import _group, _mat  # noqa: E402

M = clay.material
RAPIDO = '--rapido' in sys.argv

# ---------------------------------------------------------------------------
# La casona (igual que tablero.ts)
# ---------------------------------------------------------------------------
S = 0.6  # metros por casilla
ANCHO, ALTO = 24, 16
MARCO = 0.75  # casillas de marco alrededor (el viewBox del SVG va de -0.75 a 24.75)
PX = 80  # píxeles por casilla en el render final
CUARTOS = {
    'cocina': dict(x=0, y=0, w=6, h=4, puertas=[(4, 4), (6, 2)], pasadizo='izq'),
    'salon': dict(x=8, y=0, w=8, h=4, puertas=[(7, 2), (9, 4), (14, 4), (16, 2)]),
    'patio': dict(x=18, y=0, w=6, h=3, puertas=[(17, 1), (20, 3)], pasadizo='der'),
    'juegos': dict(x=18, y=4, w=6, h=3, puertas=[(17, 5), (21, 7)]),
    'biblioteca': dict(x=18, y=8, w=6, h=3, puertas=[(17, 9), (20, 11)]),
    'estudio': dict(x=18, y=12, w=6, h=4, puertas=[(17, 13)], pasadizo='der'),
    'comedor': dict(x=0, y=6, w=6, h=4, puertas=[(2, 5), (6, 7), (3, 10)]),
    'salatv': dict(x=0, y=12, w=6, h=4, puertas=[(3, 11), (6, 13)], pasadizo='izq'),
    'recibidor': dict(x=8, y=12, w=8, h=4, puertas=[(10, 11), (13, 11), (7, 14), (16, 14)]),
}
SOTANO = dict(x=9, y=6, w=6, h=4)
INICIO = {'el': (7, 15), 'ella': (16, 15)}


def dentro(r, x, y):
    return r['x'] <= x < r['x'] + r['w'] and r['y'] <= y < r['y'] + r['h']


def pasillo(x, y):
    if x < 0 or y < 0 or x >= ANCHO or y >= ALTO or dentro(SOTANO, x, y):
        return False
    return not any(dentro(c, x, y) for c in CUARTOS.values())


def B(cx, cy, z=0.0):
    """Casilla (x a la derecha, y hacia abajo, como en el SVG) a metros de Blender (x a la derecha, y hacia arriba)."""
    return (cx * S, -cy * S, z)


class Cuarto:
    """Ayuda para poner cosas dentro de un cuarto con coordenadas de casilla relativas a su esquina de arriba."""

    def __init__(self, coll, clave):
        self.coll = coll
        self.c = CUARTOS.get(clave, SOTANO)
        self.w, self.h = self.c['w'], self.c['h']

    def p(self, cx, cy, z=0.0):
        return B(self.c['x'] + cx, self.c['y'] + cy, z)

    def pon(self, nombre, fn, cx, cy, rot=0.0, esc=1.0, z=0.0):
        r = _group(self.coll, nombre, self.p(cx, cy, z), rot, lambda: fn(self.coll))
        r.scale = (esc, esc, esc)
        return r


# ---------------------------------------------------------------------------
# Piezas que se leen bien desde arriba
# ---------------------------------------------------------------------------

def caja(nombre, c, medio, coll, mat, p=8, n=4, subsurf=1):
    return clay.rbox(nombre, c, medio, coll, mat, p=p, n=n, subsurf=subsurf)


def losa(nombre, c, medio, coll, mat, bisel=0.012):
    """Caja de esquinas vivas con un bisel chiquito (baldosas, lozas): plana, no de cojín."""
    hx, hy, hz = medio
    v = [(c[0] + sx * hx, c[1] + sy * hy, c[2] + sz * hz) for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    caras = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]
    o = clay.make_mesh_object(nombre, v, caras, coll, smooth=False, material=mat)
    clay.add_bevel(o, bisel, 2)
    return o


def placa(nombre, pts, z, coll, mat, grosor=0.02, bisel=0.01):
    """Prisma a partir de un contorno (metros) con el borde redondeado: el piano, las alfombras raras, el sobre."""
    n = len(pts)
    verts = [(x, y, z) for x, y in pts] + [(x, y, z + grosor) for x, y in pts]
    caras = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    for k in range(n):
        caras.append((k, (k + 1) % n, n + (k + 1) % n, n + k))
    o = clay.make_mesh_object(nombre, verts, caras, coll, smooth=False, material=mat)
    if bisel:
        clay.add_bevel(o, bisel, 3)
    return o


def mata(coll, r=0.32, maceta='#E08A5F', hojas='#5FA35A', flor=None, seed=0):
    """Mata en maceta vista desde arriba: la boca de la maceta, la tierra y un ramillete de hojas en estrella."""
    rng = np.random.default_rng(seed)
    clay.lathe('maceta', [(0.0, 0.0), (r * 0.62, 0.0), (r * 0.8, r * 0.9), (r * 0.86, r * 0.95), (r * 0.8, r)], coll,
               laca(f'maceta {maceta}', maceta, 0.5), segments=24, cap_top=False)
    clay.lathe('tierra', [(0.0, r * 0.9), (r * 0.78, r * 0.9)], coll, _mat('Tierra', '#5B3A29', rough=0.95, noise=dict(scale=40, strength=0.3)),
               segments=24)
    k_hojas = 9
    for k in range(k_hojas):
        a = k / k_hojas * math.tau + rng.uniform(-0.2, 0.2)
        largo = r * rng.uniform(1.0, 1.35)
        c = (math.cos(a) * largo * 0.55, math.sin(a) * largo * 0.55, r * 1.05 + 0.04 * (k % 3))
        o = clay.blob('hoja mata', c, (largo * 0.5, largo * 0.2, 0.025), coll,
                      tela(f'hoja {hojas}', hojas if k % 2 else casa_aclarar(hojas, 0.18)), n=6)
        o.rotation_euler = (0, 0, a)
    if flor:
        for k in range(5):
            a = k / 5 * math.tau + 0.3
            clay.blob('flor mata', (math.cos(a) * r * 0.45, math.sin(a) * r * 0.45, r * 1.2), (0.05, 0.05, 0.03), coll,
                      laca(f'flor {flor}', flor, 0.5), n=5)


def nueva_escena():
    """Escena vacía (y sin los materiales guardados de la escena anterior, que ya no existen)."""
    clay.reset_scene()
    tiendas._MATS.clear()


def casa_aclarar(hexc, k):
    return clientes.lighten(hexc, k)


def alfombra(coll, hx, hy, color, borde, dibujo=None, flecos='#F2E6C9', redonda=False):
    """Alfombra de fieltro con borde, un dibujo en el centro y flecos en los extremos."""
    t = tela(f'alfombra {color}', color)
    b = tela(f'borde alfombra {borde}', borde)
    if redonda:
        clay.lathe('alfombra redonda', [(0.0, 0.0), (hx, 0.0), (hx, 0.018), (0.0, 0.018)], coll, b, segments=48)
        clay.lathe('centro alfombra redonda', [(0.0, 0.0), (hx * 0.86, 0.0), (hx * 0.86, 0.024), (0.0, 0.024)], coll, t, segments=48)
        if dibujo:
            # Rosa de los vientos: estrella de ocho puntas (las cuatro grandes y las cuatro chiquitas) y un aro
            d = tela(f'dibujo {dibujo}', dibujo)
            d2 = tela(f'dibujo claro {dibujo}', clientes.lighten(dibujo, 0.45))
            for capa, (r1, r0, giro, mat, z) in enumerate(((hx * 0.5, hx * 0.1, math.pi / 4, d2, 0.024), (hx * 0.72, hx * 0.13, 0.0, d, 0.03))):
                pts = []
                for k in range(8):
                    a = giro + k / 8 * math.tau
                    r = r1 if k % 2 == 0 else r0
                    pts.append((r * math.cos(a), r * math.sin(a)))
                placa('estrella alfombra', pts, z, coll, mat, grosor=0.008, bisel=0.003)
            clay.sweep('aro alfombra', [(hx * 0.6 * math.cos(a), hx * 0.6 * math.sin(a), 0.03) for a in np.linspace(0, math.tau, 25)[:-1]], 0.012, (1, 1), coll, d,
                       segments=4, samples=3, closed=True, subsurf=0)
            clay.lathe('centro estrella', [(0.0, 0.0), (hx * 0.09, 0.0), (hx * 0.09, 0.045), (0.0, 0.045)], coll, laca('centro rosa vientos', '#C2354A', 0.4), segments=24)
            for k in range(4):
                a = k / 4 * math.tau
                clay.blob('punto cardinal', (hx * 0.8 * math.cos(a), hx * 0.8 * math.sin(a), 0.03), (0.03, 0.03, 0.008), coll, d, n=5, subsurf=0)
        return
    caja('alfombra borde', (0, 0, 0.009), (hx, hy, 0.009), coll, b, p=10, n=4)
    caja('alfombra', (0, 0, 0.014), (hx - 0.07, hy - 0.07, 0.01), coll, t, p=10, n=4)
    clay.stitches('costura alfombra', [(-hx + 0.11, -hy + 0.11, 0.026), (hx - 0.11, -hy + 0.11, 0.026), (hx - 0.11, hy - 0.11, 0.026),
                                       (-hx + 0.11, hy - 0.11, 0.026)], 0.006, coll=coll, material=tela(f'hilo {borde}', borde), closed=True)
    if dibujo:
        d = tela(f'dibujo {dibujo}', dibujo)
        o = caja('rombo alfombra', (0, 0, 0.026), (min(hx, hy) * 0.42, min(hx, hy) * 0.42, 0.006), coll, d, p=6, n=4)
        o.rotation_euler = (0, 0, math.pi / 4)
        for sx in (-1, 1):
            caja('franja alfombra', (sx * (hx - 0.25), 0, 0.024), (0.04, hy - 0.2, 0.005), coll, d, p=6, n=4)
    for sx in (-1, 1):
        for k in range(int(hy * 2 / 0.06)):
            y = -hy + 0.04 + k * 0.06
            clay.sweep('fleco', [(sx * hx, y, 0.01), (sx * (hx + 0.07), y, 0.005)], 0.008, (1, 1), coll, tela(f'fleco {flecos}', flecos), segments=4,
                       samples=2, subsurf=0)


def libros_de_pie(coll, x0, x1, y, alto, seed=0, prof=0.2):
    """Libros parados en fila (desde arriba se ven los lomos de colores)."""
    rng = np.random.default_rng(seed)
    colores = ('#C2354A', '#4F8FE0', '#F2C94C', '#5AA94C', '#8A4FC2', '#E08A5F', '#3B69A8', '#F2A5B8', '#2F8F68', '#7A2E3B')
    x = x0
    while x < x1 - 0.03:
        ancho = rng.uniform(0.025, 0.05)
        h = alto * rng.uniform(0.7, 1.0)
        col = colores[rng.integers(len(colores))]
        caja('libro', (x + ancho, y, h / 2), (ancho, prof / 2 * rng.uniform(0.8, 1.0), h / 2), coll, laca(f'libro {col}', col, 0.6), p=8, n=3, subsurf=0)
        x += ancho * 2 + 0.006


def librero(coll, largo=1.6, prof=0.36, alto=0.9, seed=0):
    """Librero abierto por arriba: marco de madera, divisiones y libros parados (los lomos se ven desde arriba)."""
    mad = madera('librero', '#8A5A3B')
    caja('fondo librero', (0, prof / 2 - 0.02, alto / 2), (largo / 2, 0.02, alto / 2), coll, mad, p=10, n=4)
    for s in (-1, 1):
        caja('lado librero', (s * (largo / 2 - 0.02), 0, alto / 2), (0.025, prof / 2, alto / 2), coll, mad, p=10, n=4)
    caja('frente librero', (0, -prof / 2 + 0.015, 0.1), (largo / 2, 0.015, 0.1), coll, mad, p=10, n=4)
    n = max(2, int(largo / 0.55))
    for k in range(1, n):
        x = -largo / 2 + k * largo / n
        caja('división librero', (x, 0, alto / 2), (0.018, prof / 2, alto / 2), coll, mad, p=10, n=4)
    for k in range(n):
        xa = -largo / 2 + k * largo / n + 0.04
        xb = -largo / 2 + (k + 1) * largo / n - 0.03
        if (k + seed) % 3 == 2:
            # Unos libros acostados con un adorno encima
            for j in range(3):
                col = ('#F2C94C', '#C2354A', '#4F8FE0')[j]
                caja('libro acostado', ((xa + xb) / 2, 0, 0.1 + 0.035 + j * 0.05), ((xb - xa) / 2 * (0.9 - j * 0.1), prof / 2 * 0.75, 0.024), coll,
                     laca(f'libro {col}', col, 0.6), p=8, n=3, subsurf=0)
            clay.blob('adorno librero', ((xa + xb) / 2, 0, 0.32), (0.05, 0.05, 0.05), coll, laca('adorno', '#E3B54A', 0.3), n=6)
        else:
            libros_de_pie(coll, xa, xb, 0.0, alto * 0.95, seed=seed * 7 + k, prof=prof * 0.8)


def silla(coll, color='#C2354A'):
    casa.silla(coll, color)


def plato(coll, x, y, z, r=0.11, comida=None):
    p = casa.porcelana()
    clay.lathe('plato', [(0.0, z), (r * 0.7, z), (r, z + 0.018), (r * 1.02, z + 0.022)], coll, p, segments=28, cap_top=False).location = (x, y, 0)
    if comida == 'arepa':
        clay.lathe('arepa', [(0.0, z + 0.01), (r * 0.6, z + 0.012), (r * 0.62, z + 0.03), (0.0, z + 0.04)], coll,
                   _mat('Arepa', '#F2D27A', rough=0.7, noise=dict(scale=30, strength=0.4)), segments=20).location = (x, y, 0)
        for k in range(4):
            clay.blob('quemadito', (x + r * 0.3 * math.cos(k * 1.7), y + r * 0.3 * math.sin(k * 1.7), z + 0.04), (0.012, 0.01, 0.004), coll,
                      _mat('Quemado arepa', '#B9773F', rough=0.8), n=4, subsurf=0)
    elif comida == 'bandeja':
        clay.blob('arroz', (x - r * 0.3, y + r * 0.2, z + 0.03), (r * 0.32, r * 0.26, 0.025), coll, _mat('Arroz', '#FBF6EC', rough=0.8,
                  noise=dict(scale=60, strength=0.5)), n=6)
        clay.blob('fríjoles', (x + r * 0.3, y + r * 0.2, z + 0.03), (r * 0.3, r * 0.25, 0.025), coll, _mat('Fríjol', '#7A2E2E', rough=0.6,
                  noise=dict(scale=50, strength=0.5)), n=6)
        clay.blob('huevo', (x, y - r * 0.3, z + 0.03), (r * 0.3, r * 0.26, 0.015), coll, _mat('Clara', '#FFFFFF', rough=0.4), n=6)
        clay.blob('yema', (x, y - r * 0.3, z + 0.045), (r * 0.12, r * 0.12, 0.012), coll, _mat('Yema', '#F7B733', rough=0.3, coat=0.4), n=5)
        clay.blob('aguacate plato', (x - r * 0.45, y - r * 0.35, z + 0.03), (r * 0.18, r * 0.12, 0.015), coll, _mat('Aguacate', '#9CCB5A',
                  rough=0.5), n=5)
    elif comida == 'torta':
        clay.lathe('tajada', [(0.0, z + 0.01), (r * 0.5, z + 0.01), (r * 0.5, z + 0.06), (0.0, z + 0.06)], coll, _mat('Torta', '#F7D6A8', rough=0.7),
                   segments=3).location = (x, y, 0)


def vaso(coll, x, y, z, color='#F2A65A'):
    clay.lathe('vaso', [(0.0, z), (0.035, z), (0.04, z + 0.11), (0.0, z + 0.1)], coll, laca(f'jugo {color}', color, 0.2), segments=16).location = (x, y, 0)


def vela(coll, x, y, z):
    clay.lathe('vela', [(0.0, z), (0.025, z), (0.025, z + 0.12), (0.0, z + 0.12)], coll, laca('vela', '#FFF4DE', 0.6), segments=12).location = (x, y, 0)
    clay.blob('llama', (x, y, z + 0.15), (0.015, 0.015, 0.03), coll, luz('llama', '#FFC86B', 6.0), n=5, subsurf=0)


def globos(coll, colores=('#E4574B', '#F2C94C', '#4F8FE0', '#F2A5B8', '#5AA94C'), seed=0):
    rng = np.random.default_rng(seed)
    for k, col in enumerate(colores):
        a = k / len(colores) * math.tau + rng.uniform(-0.3, 0.3)
        c = (math.cos(a) * 0.16, math.sin(a) * 0.16, 1.5 + rng.uniform(-0.1, 0.15))
        clay.blob('globo', c, (0.16, 0.16, 0.19), coll, M(f'globo {col}', col, rough=0.2, coat=0.8, coat_rough=0.05), n=8)
        clay.blob('brillo globo', (c[0] - 0.05, c[1] + 0.05, c[2] + 0.14), (0.04, 0.03, 0.02), coll, _mat('Brillo globo', '#FFFFFF', rough=0.1), n=4)
        clay.sweep('cuerda globo', [c, (c[0] * 0.3, c[1] * 0.3, 0.8), (0, 0, 0.05)], 0.004, (1, 1), coll, laca('cuerda', '#F7F5F0'), segments=4, samples=4,
                   subsurf=0)
    clay.blob('pesa globos', (0, 0, 0.04), (0.06, 0.06, 0.05), coll, laca('pesa', '#E3B54A', 0.3), n=6)


def trampilla(coll):
    """La tapa del pasadizo secreto: madera con argolla de bronce, un poco levantada (se ve la oscuridad)."""
    mad = madera('trampilla', '#7A4A2A')
    caja('hueco trampilla', (0, 0, 0.004), (0.25, 0.25, 0.004), coll, _mat('Oscuridad', '#120A08', rough=1.0), p=8, n=4)
    o = caja('tapa trampilla', (0, 0.02, 0.03), (0.24, 0.24, 0.02), coll, mad, p=10, n=4)
    o.rotation_euler = (math.radians(8), 0, 0)
    for k in (-1, 0, 1):
        caja('tabla trampilla', (k * 0.16, 0.02, 0.055), (0.07, 0.23, 0.004), coll, madera('tabla trampilla', '#8A5A3B'), p=8, n=3, subsurf=0)
    for s in (-1, 1):
        caja('bisagra', (s * 0.15, 0.24, 0.05), (0.04, 0.02, 0.012), coll, laca('hierro', '#3A3A3A', 0.4), p=6, n=3, subsurf=0)
    clay.sweep('argolla', [(0.07 * math.cos(a), -0.1 + 0.07 * math.sin(a), 0.07) for a in np.linspace(0, math.tau, 13)], 0.012, (1, 1), coll,
               laca('bronce', '#C99A3B', 0.25), segments=6, samples=3, closed=True)


# ---------------------------------------------------------------------------
# Muebles de cada cuarto
# ---------------------------------------------------------------------------

def piano(coll):
    """Piano de cola negro visto desde arriba: la tapa abierta, el teclado, la banca y la partitura."""
    negro = M('Piano laca', '#1A1717', rough=0.12, coat=0.9, coat_rough=0.04)
    pts = []
    for a in np.linspace(0, math.pi, 14):
        pts.append((0.7 - 0.7 * math.cos(a) * 0.98, 0.25 + 0.55 * math.sin(a) ** 0.8))
    contorno = [(-0.05, -0.55), (1.45, -0.55), (1.45, 0.05)] + [(1.4 - 0.75 * t, 0.05 + 0.55 * math.sin(t * math.pi / 2)) for t in np.linspace(0, 1, 8)][1:] + \
        [(0.55 - 0.6 * t, 0.62 - 0.1 * t * t) for t in np.linspace(0, 1, 6)][1:] + [(-0.05, 0.3)]
    placa('cuerpo piano', contorno, 0.55, coll, negro, grosor=0.32, bisel=0.03)
    # Tapa levantada (un poco inclinada, se ven las cuerdas doradas adentro)
    for k in range(9):
        y = -0.4 + k * 0.1
        clay.sweep('cuerda piano', [(0.1, y, 0.86), (1.3, y + 0.05, 0.86)], 0.006, (1, 1), coll, laca('cuerda piano', '#D9A94E', 0.2), segments=4, samples=2,
                   subsurf=0)
    # Teclado a la izquierda
    caja('teclado base', (-0.16, -0.12, 0.8), (0.12, 0.42, 0.03), coll, negro, p=8, n=4)
    for k in range(18):
        y = -0.5 + k * 0.045
        caja('tecla', (-0.17, y, 0.84), (0.09, 0.019, 0.012), coll, laca('tecla', '#FBF8F0', 0.3), p=6, n=3, subsurf=0)
        if k % 7 not in (2, 6):
            caja('tecla negra', (-0.13, y + 0.022, 0.86), (0.05, 0.011, 0.012), coll, negro, p=6, n=3, subsurf=0)
    caja('atril', (0.0, -0.12, 0.98), (0.02, 0.32, 0.12), coll, negro, p=8, n=4)
    caja('partitura', (-0.03, -0.12, 1.06), (0.008, 0.18, 0.1), coll, laca('papel', '#FFFFFF', 0.6), p=6, n=3, subsurf=0)
    # Banca acolchada
    caja('banca piano', (-0.55, -0.12, 0.45), (0.16, 0.32, 0.05), coll, tela('banca piano', '#7A2E3B'), p=5, n=5)
    for sy in (-1, 1):
        caja('pata banca', (-0.55, -0.12 + sy * 0.26, 0.2), (0.12, 0.03, 0.2), coll, negro, p=8, n=4)


def pista_baile(coll, nx=4, ny=3):
    colores = ('#E4574B', '#F2C94C', '#4F8FE0', '#F2A5B8', '#5AA94C', '#8A4FC2')
    for i in range(nx):
        for j in range(ny):
            col = colores[(i * 2 + j * 3) % len(colores)]
            caja('baldosa luz', ((i - (nx - 1) / 2) * 0.3, (j - (ny - 1) / 2) * 0.3, 0.012), (0.14, 0.14, 0.012), coll,
                 M(f'luz pista {col}', col, rough=0.3, emission=col, emission_strength=1.2), p=10, n=4)


def bola_disco(coll):
    espejo = M('Espejo disco', '#DDE3EA', rough=0.08, metallic=1.0, noise=dict(scale=26, strength=0.9, detail=0, distance=0.02))
    clay.blob('bola disco', (0, 0, 1.6), (0.24, 0.24, 0.24), coll, espejo, n=12)
    clay.sweep('cadena disco', [(0, 0, 1.84), (0, 0, 2.3)], 0.01, (1, 1), coll, laca('cadena', '#9A9A9A', 0.3), segments=4, samples=2, subsurf=0)
    for k in range(6):
        a = k / 6 * math.tau
        clay.blob('destello', (math.cos(a) * 0.5, math.sin(a) * 0.5, 0.03), (0.06, 0.06, 0.004), coll, luz('destello', '#FFFFFF', 2.0), n=4, subsurf=0)


def tornamesa(coll):
    caja('mesa dj', (0, 0, 0.42), (0.55, 0.26, 0.42), coll, laca('mesa dj', '#2E2A4F', 0.4), p=8, n=4)
    for s in (-1, 1):
        clay.lathe('disco', [(0.0, 0.85), (0.15, 0.85), (0.15, 0.87), (0.0, 0.87)], coll, laca('vinilo', '#111111', 0.15), segments=32).location = (s * 0.3, 0, 0)
        clay.lathe('etiqueta disco', [(0.0, 0.87), (0.05, 0.87), (0.05, 0.875), (0.0, 0.875)], coll,
                   laca('etiqueta ' + ('rosa' if s < 0 else 'azul'), '#F2A5B8' if s < 0 else '#4F8FE0', 0.4), segments=20).location = (s * 0.3, 0, 0)
        clay.sweep('brazo tocadiscos', [(s * 0.3 + 0.13, 0.13, 0.9), (s * 0.3 + 0.04, 0.0, 0.89)], 0.008, (1, 1), coll, laca('plata', '#C9CCD1', 0.2),
                   segments=4, samples=2, subsurf=0)
    caja('mezclador', (0, -0.02, 0.87), (0.1, 0.18, 0.03), coll, laca('mezclador', '#3A3939', 0.3), p=8, n=4)
    for k in range(4):
        clay.blob('perilla dj', (-0.05 + (k % 2) * 0.1, -0.1 + (k // 2) * 0.12, 0.91), (0.02, 0.02, 0.015), coll,
                  luz('perilla', ('#FF6B5A', '#8FD3E8', '#F7D774', '#9ED9C0')[k], 2.0), n=4, subsurf=0)
    for s in (-1, 1):
        caja('parlante', (s * 0.75, 0.05, 0.5), (0.17, 0.17, 0.5), coll, laca('parlante', '#2B2A2A', 0.4), p=8, n=4)
        clay.lathe('cono parlante', [(0.0, 1.0), (0.12, 1.0), (0.1, 1.02), (0.0, 1.0)], coll, laca('cono', '#4A4A52', 0.4), segments=20).location = (s * 0.75, 0.05, 0)


def mesa_torta(coll):
    caja('mesa torta', (0, 0, 0.7), (0.42, 0.3, 0.03), coll, tela('mantel torta', '#FFF4DE'), p=8, n=4)
    caja('falda mantel', (0, 0, 0.4), (0.4, 0.28, 0.3), coll, tela('falda mantel', '#F2A5B8'), p=8, n=4)
    rosa = _mat('Torta rosada', '#F7B6C7', rough=0.6, noise=dict(scale=20, strength=0.2))
    crema = _mat('Crema', '#FFF8EE', rough=0.5)
    for k, (r, z0, z1) in enumerate(((0.22, 0.73, 0.85), (0.16, 0.85, 0.95), (0.1, 0.95, 1.03))):
        clay.lathe('piso torta', [(0.0, z0), (r, z0), (r, z1), (0.0, z1)], coll, rosa if k % 2 == 0 else crema, segments=32)
        for j in range(10):
            a = j / 10 * math.tau
            clay.blob('copito', (r * math.cos(a), r * math.sin(a), z1), (0.022, 0.022, 0.018), coll, crema, n=4, subsurf=0)
    for j in range(5):
        a = j / 5 * math.tau
        clay.blob('fresa torta', (0.06 * math.cos(a), 0.06 * math.sin(a), 1.05), (0.02, 0.02, 0.022), coll, laca('fresa', '#E4574B', 0.4), n=5)
    vela(coll, 0, 0, 1.03)
    for k in range(4):
        plato(coll, -0.3 + k * 0.2, -0.2, 0.73, r=0.06, comida='torta' if k % 2 else None)


def billar(coll):
    """Mesa de billar: marco de madera, paño verde, troneras, bolas de colores y dos tacos."""
    mad = madera('billar', '#7A4A2A')
    caja('marco billar', (0, 0, 0.72), (0.62, 0.36, 0.06), coll, mad, p=10, n=5)
    caja('paño billar', (0, 0, 0.775), (0.53, 0.27, 0.01), coll, tela('paño', '#2F8F5B'), p=10, n=4)
    for sx in (-1, 0, 1):
        for sy in (-1, 1):
            clay.lathe('tronera', [(0.0, 0.78), (0.04, 0.78), (0.04, 0.786), (0.0, 0.786)], coll, _mat('Tronera', '#1A1210', rough=0.9),
                       segments=16).location = (sx * 0.53, sy * 0.27, 0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            caja('pata billar', (sx * 0.52, sy * 0.28, 0.35), (0.06, 0.06, 0.35), coll, mad, p=8, n=4)
    bolas = (('#FFFFFF', -0.32, 0.0), ('#F2C94C', 0.18, 0.0), ('#4F8FE0', 0.24, 0.035), ('#E4574B', 0.24, -0.035), ('#8A4FC2', 0.3, 0.07),
             ('#E08A5F', 0.3, 0.0), ('#2F8F5B', 0.3, -0.07), ('#7A2E3B', 0.36, 0.035), ('#111111', 0.36, -0.035))
    for col, x, y in bolas:
        clay.blob('bola billar', (x, y, 0.8), (0.026, 0.026, 0.026), coll, M(f'bola {col}', col, rough=0.15, coat=0.8), n=6, subsurf=0)
    for k in range(2):
        clay.sweep('taco', [(-0.75 + k * 0.05, -0.42 + k * 0.84, 0.8), (0.1 + k * 0.4, -0.3 + k * 0.6, 0.8)], 0.012, (1, 1), coll,
                   madera('taco', '#D9A876'), segments=6, samples=2, subsurf=0)
    caja('triángulo', (0.5, 0.42, 0.79), (0.08, 0.07, 0.01), coll, mad, p=4, n=3)


def consola_juegos(coll):
    caja('mueble consola', (0, 0, 0.2), (0.5, 0.2, 0.2), coll, laca('mueble consola', '#F7F3EA', 0.4), p=8, n=4)
    caja('tele juegos', (0, 0.08, 0.7), (0.48, 0.03, 0.3), coll, laca('negro tv', '#1E1C1C', 0.3), p=8, n=4)
    caja('pantalla juegos', (0, 0.045, 0.7), (0.44, 0.005, 0.26), coll, luz('pantalla juegos', '#8FD3E8', 1.0), p=8, n=3)
    caja('consola', (-0.25, -0.05, 0.42), (0.12, 0.08, 0.02), coll, laca('consola', '#FFFFFF', 0.3), p=8, n=3)
    for s in (-1, 1):
        o = clay.blob('control juegos', (s * 0.35, -0.55, 0.05), (0.08, 0.05, 0.025), coll, laca('control ' + ('rojo' if s < 0 else 'azul'),
                      '#E4574B' if s < 0 else '#4F8FE0', 0.3), n=6)
        o.rotation_euler = (0, 0, s * 0.4)
        clay.sweep('cable control', [(s * 0.35, -0.5, 0.03), (s * 0.2, -0.3, 0.01), (-0.25, -0.12, 0.42)], 0.006, (1, 1), coll, laca('cable', '#2B2A2A'),
                   segments=4, samples=5, subsurf=0)


def baul_juguetes(coll):
    caja('baúl', (0, 0, 0.22), (0.3, 0.2, 0.22), coll, laca('baúl', '#4F8FE0', 0.4), p=8, n=4)
    caja('borde baúl', (0, 0, 0.45), (0.31, 0.21, 0.02), coll, laca('borde baúl', '#F2C94C', 0.4), p=8, n=4)
    clay.blob('pelota', (-0.12, 0.0, 0.52), (0.09, 0.09, 0.09), coll, laca('pelota', '#E4574B', 0.3), n=8)
    clay.blob('osito', (0.1, 0.02, 0.52), (0.08, 0.07, 0.09), coll, tela('osito', '#C98B5A'), n=8)
    for s in (-1, 1):
        clay.blob('oreja osito', (0.1 + s * 0.06, 0.02, 0.6), (0.03, 0.02, 0.03), coll, tela('osito', '#C98B5A'), n=5)
    caja('bloque', (0.0, -0.1, 0.5), (0.04, 0.04, 0.04), coll, laca('bloque', '#5AA94C', 0.4), p=6, n=3)


def escritorio(coll):
    mad = madera('escritorio estudio', '#6B4226')
    caja('tablero escritorio', (0, 0, 0.74), (0.75, 0.34, 0.03), coll, mad, p=10, n=4)
    for s in (-1, 1):
        caja('cajonera', (s * 0.55, 0, 0.36), (0.18, 0.32, 0.36), coll, mad, p=8, n=4)
    caja('carpeta', (-0.15, -0.06, 0.78), (0.3, 0.2, 0.006), coll, tela('carpeta', '#2F8F5B'), p=8, n=3)
    caja('computador', (0.32, 0.12, 0.79), (0.22, 0.15, 0.01), coll, laca('portátil', '#C9CCD1', 0.25), p=8, n=3)
    o = caja('pantalla portátil', (0.32, 0.27, 0.92), (0.22, 0.008, 0.14), coll, laca('portátil', '#C9CCD1', 0.25), p=8, n=3)
    o.rotation_euler = (math.radians(-15), 0, 0)
    caja('teclado portátil', (0.32, 0.09, 0.8), (0.18, 0.08, 0.004), coll, laca('teclas', '#3A3A48', 0.4), p=6, n=3, subsurf=0)
    for k in range(4):
        o = caja('papel', (-0.25 + k * 0.05, -0.08 + k * 0.03, 0.792 + k * 0.004), (0.1, 0.14, 0.002), coll, laca('papel', '#FFFFFF', 0.6), p=6, n=3,
                 subsurf=0)
        o.rotation_euler = (0, 0, -0.3 + k * 0.2)
    clay.lathe('taza', [(0.0, 0.77), (0.04, 0.77), (0.045, 0.85), (0.0, 0.84)], coll, laca('taza', '#E4574B', 0.3), segments=16).location = (-0.55, 0.1, 0)
    clay.lathe('tinto', [(0.0, 0.84), (0.04, 0.84), (0.0, 0.841)], coll, _mat('Tinto', '#3B2014', rough=0.1, coat=0.8), segments=16).location = (-0.55, 0.1, 0)
    # Lámpara de escritorio verde de banquero
    clay.lathe('base lámpara', [(0.0, 0.77), (0.07, 0.77), (0.06, 0.8), (0.0, 0.8)], coll, laca('bronce', '#C99A3B', 0.25), segments=16).location = (-0.6, -0.2, 0)
    clay.blob('pantalla banquero', (-0.6, -0.15, 1.05), (0.16, 0.07, 0.05), coll, M('Vidrio verde', '#2F8F5B', rough=0.15, coat=0.8), n=8)
    clay.blob('luz banquero', (-0.6, -0.15, 1.0), (0.12, 0.05, 0.02), coll, luz('banquero', '#FFE9A8', 3.0), n=6, subsurf=0)
    # Lupa y libreta del detective
    caja('libreta', (0.05, -0.22, 0.79), (0.07, 0.1, 0.008), coll, laca('libreta', '#7A2E3B', 0.5), p=6, n=3)
    clay.sweep('lupa aro', [(-0.12 + 0.05 * math.cos(a), -0.22 + 0.05 * math.sin(a), 0.795) for a in np.linspace(0, math.tau, 13)], 0.01, (1, 1), coll,
               laca('bronce', '#C99A3B', 0.25), segments=6, samples=3, closed=True)
    clay.sweep('lupa mango', [(-0.16, -0.26, 0.795), (-0.25, -0.33, 0.795)], 0.014, (1, 1), coll, madera('mango', '#5B3A29'), segments=6, samples=2)


def silla_oficina(coll):
    cuero = M('Cuero', '#7A2E3B', rough=0.45, coat=0.3, noise=dict(scale=30, strength=0.2))
    caja('asiento oficina', (0, 0, 0.5), (0.24, 0.24, 0.06), coll, cuero, p=5, n=5)
    caja('espaldar oficina', (0, 0.22, 0.85), (0.24, 0.06, 0.3), coll, cuero, p=5, n=5)
    for k in range(5):
        a = k / 5 * math.tau
        clay.sweep('pata oficina', [(0, 0, 0.12), (0.3 * math.cos(a), 0.3 * math.sin(a), 0.06)], 0.02, (1, 1), coll, laca('negro', '#2B2A2A'), segments=6,
                   samples=2, subsurf=0)
        clay.blob('rueda', (0.3 * math.cos(a), 0.3 * math.sin(a), 0.04), (0.03, 0.03, 0.03), coll, laca('negro', '#2B2A2A'), n=5, subsurf=0)


def caja_fuerte(coll):
    acero = M('Caja fuerte', '#4A5560', rough=0.35, metallic=0.6, coat=0.3)
    caja('caja fuerte', (0, 0, 0.35), (0.25, 0.25, 0.35), coll, acero, p=10, n=5)
    clay.lathe('perilla fuerte', [(0.0, 0.0), (0.07, 0.0), (0.07, 0.03), (0.0, 0.03)], coll, laca('bronce', '#C99A3B', 0.25), segments=20).location = (0, 0, 0.7)
    for k in range(8):
        a = k / 8 * math.tau
        caja('marca fuerte', (0.09 * math.cos(a), 0.09 * math.sin(a), 0.705), (0.008, 0.008, 0.004), coll, laca('blanco', '#FFFFFF'), p=4, n=3, subsurf=0)
    caja('fajo billetes', (-0.12, 0.12, 0.72), (0.06, 0.03, 0.02), coll, laca('billete', '#9ED9A0', 0.6), p=6, n=3)


def archivador(coll):
    caja('archivador', (0, 0, 0.55), (0.22, 0.3, 0.55), coll, laca('archivador', '#9A9FA8', 0.35), p=10, n=4)
    for k in range(3):
        caja('carpeta archivador', (-0.1 + k * 0.08, 0.0, 1.13), (0.035, 0.2, 0.03), coll, laca(f'carpeta {k}', ('#F2C94C', '#E4574B', '#4F8FE0')[k], 0.5),
             p=6, n=3)


def mesa_comedor(coll, largo=1.9, ancho=0.62):
    mad = madera('mesa larga', '#8A5A3B')
    caja('mesa larga', (0, 0, 0.74), (largo / 2, ancho / 2, 0.035), coll, mad, p=12, n=4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            caja('pata mesa larga', (sx * (largo / 2 - 0.08), sy * (ancho / 2 - 0.08), 0.37), (0.04, 0.04, 0.37), coll, mad, p=8, n=4)
    caja('camino mesa', (0, 0, 0.78), (largo / 2 - 0.1, 0.12, 0.004), coll, tela('camino mesa', '#F2C94C'), p=8, n=3)
    n = 3
    for k in range(n):
        x = -largo / 2 + (k + 0.5) * largo / n
        for sy in (-1, 1):
            plato(coll, x, sy * 0.19, 0.775, r=0.1, comida=('arepa', 'bandeja', 'arepa')[k] if sy < 0 else ('bandeja', 'arepa', 'bandeja')[k])
            vaso(coll, x + 0.14, sy * 0.2, 0.775, ('#F2A65A', '#E4574B', '#F7F5F0')[(k + (sy > 0)) % 3])
            clay.sweep('cubierto', [(x - 0.14, sy * 0.24, 0.78), (x - 0.14, sy * 0.13, 0.78)], 0.006, (1, 1), coll, laca('plata', '#C9CCD1', 0.2), segments=4,
                       samples=2, subsurf=0)
    # Candelabro y florero en el centro
    clay.lathe('florero comedor', [(0.0, 0.78), (0.06, 0.78), (0.08, 0.86), (0.04, 0.95), (0.05, 0.98)], coll, laca('florero', '#4F8FE0', 0.2), segments=20,
               cap_top=False)
    for k in range(7):
        a = k / 7 * math.tau
        clay.blob('flor comedor', (0.07 * math.cos(a), 0.07 * math.sin(a), 1.02 + 0.03 * (k % 2)), (0.04, 0.04, 0.03), coll,
                  laca('flor comedor ' + str(k % 3), ('#F2A5B8', '#FFFFFF', '#E4574B')[k % 3], 0.5), n=5)
    for s in (-1, 1):
        vela(coll, s * 0.35, 0.0, 0.78)
        vela(coll, s * 0.45, 0.0, 0.78)


def aparador(coll, largo=1.3):
    mad = madera('aparador', '#6B4226')
    caja('aparador', (0, 0, 0.45), (largo / 2, 0.22, 0.45), coll, mad, p=10, n=4)
    caja('cubierta aparador', (0, 0, 0.91), (largo / 2 + 0.02, 0.24, 0.02), coll, madera('cubierta aparador', '#8A5A3B'), p=10, n=4)
    for k in range(3):
        plato(coll, -largo / 2 + 0.2 + k * 0.12, 0.08, 0.93 + k * 0.025, r=0.1)
    clay.lathe('jarra', [(0.0, 0.93), (0.06, 0.93), (0.07, 1.05), (0.04, 1.15), (0.05, 1.18)], coll, laca('jarra', '#F7F5F0', 0.2), segments=20,
               cap_top=False).location = (0.15, 0.0, 0)
    clay.lathe('frutero', [(0.0, 0.93), (0.08, 0.93), (0.16, 0.99), (0.17, 1.0)], coll, laca('frutero', '#F2C94C', 0.3), segments=24, cap_top=False).location = (
        largo / 2 - 0.25, 0, 0)
    for k, col in enumerate(('#E4574B', '#F2A65A', '#9CCB5A', '#E4574B', '#F7D774')):
        a = k / 5 * math.tau
        clay.blob('fruta', (largo / 2 - 0.25 + 0.07 * math.cos(a), 0.07 * math.sin(a), 1.0), (0.04, 0.04, 0.04), coll, laca(f'fruta {col}', col, 0.4), n=6)


def sofa_grande(coll, color='#4F8FE0', cojines=('#F2C94C', '#F2A5B8')):
    t = tela(f'sofá grande {color}', color)
    caja('base sofá', (0, 0, 0.28), (1.0, 0.42, 0.16), coll, t, p=5, n=6, subsurf=2)
    caja('espaldar sofá', (0, 0.32, 0.6), (1.0, 0.12, 0.28), coll, t, p=5, n=6, subsurf=2)
    for s in (-1, 1):
        caja('brazo sofá', (s * 0.93, 0, 0.5), (0.12, 0.42, 0.22), coll, t, p=5, n=6, subsurf=2)
    for k in range(3):
        caja('cojín sofá', (-0.55 + k * 0.55, -0.06, 0.5), (0.27, 0.32, 0.08), coll, t, p=4, n=6, subsurf=2)
    for k, col in enumerate(cojines):
        o = clay.blob('cojín decorativo', (-0.6 + k * 1.2, 0.16, 0.7), (0.17, 0.07, 0.16), coll, tela(f'cojín {col}', col), n=8, p=3.0)
        o.rotation_euler = (0.5, 0, 0.3 - k * 0.6)
    o = caja('cobija', (0.4, -0.05, 0.6), (0.3, 0.25, 0.03), coll, tela('cobija', '#F2E6C9'), p=4, n=5, subsurf=2)
    o.rotation_euler = (0, 0, 0.2)


def mesa_tv(coll):
    mad = madera('mesa tv', '#C98B5A')
    caja('mesa centro tv', (0, 0, 0.36), (0.42, 0.24, 0.03), coll, mad, p=10, n=4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            caja('pata mesa tv', (sx * 0.36, sy * 0.18, 0.18), (0.025, 0.025, 0.18), coll, mad, p=6, n=4)
    clay.lathe('tazón crispetas', [(0.0, 0.39), (0.06, 0.39), (0.14, 0.47), (0.15, 0.48)], coll, laca('tazón', '#E4574B', 0.3), segments=24,
               cap_top=False).location = (-0.18, 0.02, 0)
    rng = np.random.default_rng(3)
    for k in range(16):
        a, r = rng.uniform(0, math.tau), rng.uniform(0, 0.11)
        clay.blob('crispeta', (-0.18 + r * math.cos(a), 0.02 + r * math.sin(a), 0.47 + rng.uniform(0, 0.03)), (0.022, 0.02, 0.018), coll,
                  _mat('Crispeta', '#FFF4D6', rough=0.8), n=4, subsurf=0)
    for k in range(2):
        clay.lathe('gaseosa', [(0.0, 0.39), (0.03, 0.39), (0.03, 0.5), (0.0, 0.5)], coll, laca('lata ' + str(k), ('#E4574B', '#5AA94C')[k], 0.25),
                   segments=14).location = (0.15 + k * 0.1, 0.06 - k * 0.1, 0)


def mueble_tv(coll):
    mad = madera('mueble tele', '#B98559')
    caja('mueble tele', (0, 0, 0.25), (0.75, 0.2, 0.25), coll, mad, p=10, n=4)
    caja('tele grande', (0, 0.08, 0.85), (0.6, 0.03, 0.34), coll, laca('negro tv', '#1E1C1C', 0.3), p=8, n=4)
    caja('pantalla grande', (0, 0.045, 0.85), (0.56, 0.005, 0.3), coll, luz('pantalla grande', '#B7E3F5', 0.9), p=8, n=3)
    for s in (-1, 1):
        clay.lathe('parlante tv', [(0.0, 0.5), (0.06, 0.5), (0.06, 0.8), (0.0, 0.8)], coll, laca('parlante', '#2B2A2A', 0.4), segments=16).location = (
            s * 0.62, -0.02, 0)
    caja('cajita control', (-0.3, -0.05, 0.51), (0.07, 0.05, 0.01), coll, laca('decodificador', '#3A3939', 0.3), p=6, n=3)


def lampara_pie(coll, color='#F7E3B5'):
    casa.lampara_pie(coll, color)


def mesita_te(coll):
    mad = madera('mesita té', '#8A5A3B')
    clay.lathe('mesita redonda', [(0.0, 0.55), (0.25, 0.55), (0.26, 0.58), (0.0, 0.58)], coll, mad, segments=32)
    clay.lathe('pata mesita', [(0.18, 0.0), (0.04, 0.05), (0.03, 0.55)], coll, mad, segments=16, cap_top=False)
    clay.lathe('tetera', [(0.0, 0.58), (0.07, 0.58), (0.09, 0.64), (0.07, 0.7), (0.02, 0.72), (0.0, 0.73)], coll, laca('tetera', '#F7F5F0', 0.2),
               segments=20).location = (0.06, 0.04, 0)
    clay.sweep('pico tetera', [(0.14, 0.04, 0.64), (0.2, 0.06, 0.69)], 0.012, (1, 1), coll, laca('tetera', '#F7F5F0', 0.2), segments=6, samples=2)
    clay.lathe('pocillo té', [(0.0, 0.58), (0.035, 0.58), (0.04, 0.62), (0.0, 0.61)], coll, laca('pocillo', '#F2A5B8', 0.2), segments=14).location = (-0.1, -0.08, 0)


def globo_terraqueo(coll):
    mad = madera('globo', '#8A5A3B')
    clay.lathe('base globo', [(0.0, 0.0), (0.16, 0.0), (0.04, 0.08), (0.03, 0.6)], coll, mad, segments=16, cap_top=False)
    clay.blob('globo terráqueo', (0, 0, 0.82), (0.2, 0.2, 0.2), coll, M('Mar', '#4F8FE0', rough=0.3, coat=0.5), n=10)
    rng = np.random.default_rng(5)
    for k in range(6):
        a, b = rng.uniform(0, math.tau), rng.uniform(-0.7, 0.9)
        c = (0.19 * math.cos(b) * math.cos(a), 0.19 * math.cos(b) * math.sin(a), 0.82 + 0.19 * math.sin(b))
        clay.blob('continente', c, (0.06, 0.05, 0.03), coll, _mat('Tierra mapa', '#9CCB5A', rough=0.6), n=5, subsurf=0)
    clay.sweep('meridiano', [(0.23 * math.cos(a), 0, 0.82 + 0.23 * math.sin(a)) for a in np.linspace(-1.6, 1.6, 9)], 0.01, (1, 1), coll,
               laca('bronce', '#C99A3B', 0.25), segments=4, samples=3)


def pila_libros(coll, n=5, seed=0):
    rng = np.random.default_rng(seed)
    z = 0.0
    for k in range(n):
        col = ('#C2354A', '#4F8FE0', '#F2C94C', '#5AA94C', '#8A4FC2', '#7A2E3B')[(k + seed) % 6]
        o = caja('libro pila', (0, 0, z + 0.025), (0.16 - k * 0.008, 0.11, 0.025), coll, laca(f'libro {col}', col, 0.6), p=8, n=3, subsurf=0)
        o.rotation_euler = (0, 0, rng.uniform(-0.3, 0.3))
        z += 0.05


def escalera_libros(coll):
    mad = madera('escalera', '#C98B5A')
    for s in (-1, 1):
        clay.sweep('larguero', [(s * 0.18, 0.0, 0.0), (s * 0.18, 0.5, 1.2)], 0.025, (1, 1), coll, mad, segments=6, samples=2)
    for k in range(5):
        t = (k + 0.5) / 5
        clay.sweep('peldaño', [(-0.18, 0.5 * t, 1.2 * t), (0.18, 0.5 * t, 1.2 * t)], 0.02, (1, 1), coll, mad, segments=6, samples=2)


def fuente(coll):
    piedra = _mat('Piedra fuente', '#D8CFC2', rough=0.8, noise=dict(scale=12, strength=0.4))
    agua = M('Agua fuente', '#7EC8EA', rough=0.05, coat=1.0, transmission=0.3, noise=dict(scale=6, strength=0.25, distance=0.02))
    clay.lathe('pileta', [(0.0, 0.0), (0.5, 0.0), (0.52, 0.3), (0.46, 0.32), (0.44, 0.06), (0.0, 0.06)], coll, piedra, segments=40)
    clay.lathe('agua pileta', [(0.0, 0.22), (0.45, 0.22)], coll, agua, segments=40)
    clay.lathe('columna fuente', [(0.1, 0.06), (0.07, 0.4), (0.18, 0.55), (0.2, 0.58), (0.15, 0.6), (0.0, 0.6)], coll, piedra, segments=24)
    clay.lathe('agua arriba', [(0.0, 0.58), (0.16, 0.58)], coll, agua, segments=24)
    clay.blob('chorrito', (0, 0, 0.7), (0.035, 0.035, 0.12), coll, M('Chorro', '#CFEFFF', rough=0.05, coat=1.0, transmission=0.4), n=6)
    for k in range(3):
        a = k * 2.1
        clay.blob('nenúfar', (0.3 * math.cos(a), 0.3 * math.sin(a), 0.225), (0.07, 0.07, 0.006), coll, tela('nenúfar', '#5FA35A'), n=6, subsurf=0)
        clay.blob('flor nenúfar', (0.3 * math.cos(a) + 0.02, 0.3 * math.sin(a), 0.24), (0.025, 0.025, 0.02), coll, laca('flor nenúfar', '#F2A5B8', 0.4), n=5)
    for k in range(2):
        clay.blob('pez', (0.18 * math.cos(k * 3), 0.18 * math.sin(k * 3), 0.2), (0.05, 0.02, 0.015), coll, laca('pez', '#F2A65A', 0.3), n=5)


def hamaca(coll, largo=1.6):
    """Hamaca de rayas colombiana entre dos palos."""
    mad = madera('palo hamaca', '#8A5A3B')
    for s in (-1, 1):
        clay.lathe('palo hamaca', [(0.06, 0.0), (0.05, 1.2), (0.0, 1.22)], coll, mad, segments=12).location = (s * largo / 2, 0, 0)
    franjas = ('#E4574B', '#F2C94C', '#4F8FE0', '#5AA94C', '#F2A5B8', '#8A4FC2')
    n = 6
    for k in range(n):
        y = -0.22 + (k + 0.5) * 0.44 / n
        pts = [(x, y * (1 - abs(x) / (largo / 2) * 0.8), 0.95 - 0.45 * (1 - (2 * x / largo) ** 2)) for x in np.linspace(-largo / 2 + 0.05, largo / 2 - 0.05, 9)]
        clay.sweep('franja hamaca', pts, 0.04, (1.0, 0.35), coll, tela(f'hamaca {franjas[k]}', franjas[k]), segments=6, samples=4)
    clay.blob('cojín hamaca', (-0.35, 0, 0.6), (0.16, 0.12, 0.06), coll, tela('cojín hamaca', '#FFF4DE'), n=6)


def enano(coll):
    clay.blob('cuerpo enano', (0, 0, 0.15), (0.1, 0.09, 0.15), coll, laca('enano azul', '#4F8FE0', 0.4), n=8)
    clay.blob('barba', (0, -0.06, 0.25), (0.08, 0.05, 0.08), coll, tela('barba', '#FFFFFF'), n=6)
    clay.blob('cara enano', (0, -0.04, 0.33), (0.06, 0.05, 0.05), coll, laca('piel enano', '#F2C6A6', 0.4), n=6)
    clay.lathe('gorro enano', [(0.08, 0.34), (0.0, 0.58)], coll, laca('gorro enano', '#E4574B', 0.4), segments=16)


def manguera(coll):
    verde = laca('manguera', '#5AA94C', 0.35)
    pts = [(0.18 * (1 - t * 0.35) * math.cos(t * math.tau * 3), 0.18 * (1 - t * 0.35) * math.sin(t * math.tau * 3), 0.03 + t * 0.03) for t in np.linspace(0, 1, 37)]
    pts += [(0.3, -0.1, 0.02), (0.5, -0.2, 0.02)]
    clay.sweep('manguera', pts, 0.022, (1, 1), coll, verde, segments=6, samples=2, subsurf=0)
    clay.lathe('boquilla', [(0.0, 0.0), (0.03, 0.0), (0.02, 0.1), (0.0, 0.1)], coll, laca('boquilla', '#F2C94C', 0.3), segments=12).rotation_euler = (0, math.pi / 2, -0.4)
    coll.objects[-1].location = (0.5, -0.2, 0.03)


def regadera(coll):
    lata = laca('regadera', '#4F8FE0', 0.3)
    clay.lathe('regadera', [(0.0, 0.0), (0.1, 0.0), (0.1, 0.18), (0.0, 0.2)], coll, lata, segments=20)
    clay.sweep('pico regadera', [(0.08, 0, 0.05), (0.25, 0, 0.2)], 0.018, (1, 1), coll, lata, segments=6, samples=2)
    clay.sweep('asa regadera', [(-0.06, 0, 0.18), (0.0, 0, 0.3), (0.06, 0, 0.18)], 0.012, (1, 1), coll, lata, segments=6, samples=3)


def cantero(coll, largo=1.2, seed=0):
    """Cantero de madera con tierra y flores (desde arriba: el marco y las flores de colores)."""
    mad = madera('cantero', '#9C6B43')
    caja('cantero', (0, 0, 0.12), (largo / 2, 0.16, 0.12), coll, mad, p=10, n=4)
    caja('tierra cantero', (0, 0, 0.23), (largo / 2 - 0.04, 0.12, 0.01), coll, _mat('Tierra', '#5B3A29', rough=0.95, noise=dict(scale=40, strength=0.3)), p=6, n=3)
    _group(coll, 'flores cantero', (0, 0, 0.23), math.pi / 2, lambda: casa.flores(coll, n=max(5, int(largo * 9)), largo=largo - 0.15, seed=seed))


def perchero(coll):
    mad = madera('perchero', '#6B4226')
    clay.lathe('base perchero', [(0.0, 0.0), (0.2, 0.0), (0.18, 0.04), (0.03, 0.06), (0.03, 1.7), (0.0, 1.72)], coll, mad, segments=20)
    for k in range(4):
        a = k / 4 * math.tau + 0.4
        clay.sweep('gancho', [(0.0, 0.0, 1.62), (0.13 * math.cos(a), 0.13 * math.sin(a), 1.7)], 0.015, (1, 1), coll, mad, segments=6, samples=2)
    clay.lathe('sombrero perchero', [(0.0, 1.72), (0.2, 1.72), (0.2, 1.74), (0.11, 1.75), (0.1, 1.86), (0.0, 1.87)], coll, tela('sombrero', '#3A2A22'),
               segments=24).location = (0.06, 0.06, 0)
    clay.blob('bufanda', (-0.1, -0.05, 1.5), (0.06, 0.04, 0.2), coll, tela('bufanda', '#E4574B'), n=6)


def paraguero(coll):
    clay.lathe('paragüero', [(0.0, 0.0), (0.12, 0.0), (0.13, 0.5), (0.11, 0.52), (0.0, 0.05)], coll, laca('paragüero', '#2F8F68', 0.3), segments=20,
               cap_top=False)
    for k, col in enumerate(('#E4574B', '#F2C94C', '#4F8FE0')):
        a = k * 2.1
        clay.sweep('paraguas', [(0.04 * math.cos(a), 0.04 * math.sin(a), 0.1), (0.07 * math.cos(a), 0.07 * math.sin(a), 0.8)], 0.035, (1, 1), coll,
                   tela(f'paraguas {col}', col), segments=8, samples=2)
        clay.sweep('mango paraguas', [(0.07 * math.cos(a), 0.07 * math.sin(a), 0.8), (0.07 * math.cos(a) + 0.04, 0.07 * math.sin(a), 0.9)], 0.012, (1, 1), coll,
                   madera('mango', '#5B3A29'), segments=6, samples=2)


def consola_entrada(coll):
    mad = madera('consola entrada', '#6B4226')
    caja('consola entrada', (0, 0, 0.78), (0.6, 0.18, 0.03), coll, mad, p=10, n=4)
    for s in (-1, 1):
        caja('pata consola', (s * 0.55, 0, 0.39), (0.03, 0.14, 0.39), coll, mad, p=8, n=4)
    clay.lathe('florero entrada', [(0.0, 0.81), (0.07, 0.81), (0.1, 0.92), (0.05, 1.08), (0.06, 1.12)], coll, laca('florero entrada', '#F7F5F0', 0.2),
               segments=20, cap_top=False).location = (-0.3, 0, 0)
    for k in range(9):
        a = k / 9 * math.tau
        clay.blob('girasol', (-0.3 + 0.11 * math.cos(a), 0.11 * math.sin(a), 1.2 + 0.04 * (k % 3)), (0.05, 0.05, 0.02), coll, laca('girasol', '#F7C948', 0.5),
                  n=5)
        clay.blob('centro girasol', (-0.3 + 0.11 * math.cos(a), 0.11 * math.sin(a), 1.22 + 0.04 * (k % 3)), (0.02, 0.02, 0.012), coll,
                  laca('centro girasol', '#5B3A29', 0.6), n=4, subsurf=0)
    caja('bandeja llaves', (0.2, 0, 0.82), (0.12, 0.08, 0.01), coll, laca('bandeja', '#C99A3B', 0.25), p=8, n=3)
    for k in range(3):
        clay.blob('llave', (0.15 + k * 0.05, 0.01 * k, 0.84), (0.025, 0.012, 0.006), coll, laca('llave', '#E3B54A', 0.25), n=4, subsurf=0)
    caja('correo', (0.42, 0.02, 0.82), (0.08, 0.06, 0.01), coll, laca('sobre carta', '#FFF4DE', 0.6), p=6, n=3)


def banca_entrada(coll):
    mad = madera('banca entrada', '#8A5A3B')
    caja('banca', (0, 0, 0.42), (0.55, 0.18, 0.04), coll, mad, p=8, n=4)
    caja('cojín banca', (0, 0, 0.48), (0.5, 0.15, 0.03), coll, tela('cojín banca', '#C2354A'), p=4, n=5)
    for s in (-1, 1):
        caja('pata banca', (s * 0.48, 0, 0.2), (0.04, 0.14, 0.2), coll, mad, p=8, n=4)
    for k, col in enumerate(('#3A2A22', '#C2354A')):
        clay.blob('zapato', (-0.2 + k * 0.12, -0.32, 0.04), (0.05, 0.11, 0.04), coll, laca(f'zapato {col}', col, 0.4), n=6)


def nevera(coll):
    casa.nevera(coll, '#BFE6D8')
    clay.lathe('frutero nevera', [(0.0, 1.95), (0.1, 1.95), (0.17, 2.02)], coll, laca('frutero', '#F2C94C', 0.3), segments=20, cap_top=False)
    for k, col in enumerate(('#E4574B', '#F2A65A', '#F7D774')):
        clay.blob('fruta nevera', (0.07 * math.cos(k * 2.1), 0.07 * math.sin(k * 2.1), 2.03), (0.045, 0.045, 0.045), coll, laca(f'fruta {col}', col, 0.4), n=6)


def meson_cocina(coll, largo=2.2):
    casa.meson(coll, largo)
    xs = -largo / 2 + 0.55
    # Olla en un fogón y paila con arepas en otro
    acero = laca('acero olla', '#C9CCD1', 0.25)
    clay.lathe('olla fogón', [(0.0, 0.97), (0.13, 0.97), (0.13, 1.12), (0.14, 1.13)], coll, acero, segments=24, cap_top=False).location = (xs - 0.16, 0.1, 0)
    clay.lathe('caldo', [(0.0, 1.08), (0.125, 1.08)], coll, _mat('Sancocho', '#E8B44A', rough=0.2, coat=0.6), segments=24).location = (xs - 0.16, 0.1, 0)
    for k in range(5):
        clay.blob('papa', (xs - 0.16 + 0.06 * math.cos(k * 1.3), 0.1 + 0.06 * math.sin(k * 1.3), 1.09), (0.03, 0.025, 0.015), coll,
                  _mat('Papa', '#F2E2A0', rough=0.6), n=4, subsurf=0)
    clay.lathe('paila', [(0.0, 0.97), (0.14, 0.97), (0.15, 1.01)], coll, laca('paila', '#2B2A2A', 0.3), segments=24, cap_top=False).location = (xs + 0.16, -0.12, 0)
    clay.sweep('mango paila', [(xs + 0.3, -0.12, 1.0), (xs + 0.52, -0.2, 1.0)], 0.02, (1, 1), coll, laca('paila', '#2B2A2A', 0.3), segments=6, samples=2)
    for k in range(3):
        clay.lathe('arepa paila', [(0.0, 0.98), (0.05, 0.985), (0.05, 1.0), (0.0, 1.01)], coll, _mat('Arepa', '#F2D27A', rough=0.7, noise=dict(scale=30, strength=0.4)),
                   segments=16).location = (xs + 0.16 + 0.06 * math.cos(k * 2.1), -0.12 + 0.06 * math.sin(k * 2.1), 0)
    # Tabla de picar con tomate y cebolla
    mad = madera('tabla picar', '#D9A876')
    caja('tabla picar', (0.2, -0.05, 0.945), (0.18, 0.12, 0.012), coll, mad, p=8, n=3)
    for k in range(3):
        clay.blob('tomate', (0.12 + k * 0.06, -0.06, 0.97), (0.03, 0.03, 0.012), coll, laca('tomate', '#E4574B', 0.4), n=5, subsurf=0)
    clay.blob('cebolla', (0.3, -0.02, 0.98), (0.04, 0.04, 0.035), coll, laca('cebolla', '#F2E6F0', 0.4), n=6)


def canasta_frutas(coll):
    clay.lathe('canasta', [(0.0, 0.0), (0.15, 0.0), (0.2, 0.16), (0.21, 0.17)], coll, _mat('Mimbre', '#C99A5B', rough=0.8,
               ribs=dict(scale=40, strength=0.5, axis='Z')), segments=24, cap_top=False)
    rng = np.random.default_rng(2)
    for k in range(9):
        a, r = rng.uniform(0, math.tau), rng.uniform(0, 0.12)
        col = ('#E4574B', '#F2A65A', '#9CCB5A', '#F7D774', '#8A4FC2')[k % 5]
        clay.blob('fruta canasta', (r * math.cos(a), r * math.sin(a), 0.16 + rng.uniform(0, 0.04)), (0.045, 0.045, 0.045), coll, laca(f'fruta {col}', col, 0.4), n=6)
    clay.blob('banano', (0.05, -0.04, 0.22), (0.12, 0.03, 0.025), coll, laca('banano', '#F7D774', 0.4), n=6)


def caneca(coll):
    clay.lathe('caneca', [(0.0, 0.0), (0.12, 0.0), (0.14, 0.42), (0.0, 0.42)], coll, laca('caneca', '#5AA94C', 0.35), segments=20)
    clay.blob('pedal', (0, -0.14, 0.03), (0.05, 0.03, 0.015), coll, laca('pedal', '#2B2A2A'), n=4, subsurf=0)


def papelera(coll):
    clay.lathe('papelera', [(0.0, 0.0), (0.1, 0.0), (0.13, 0.32), (0.0, 0.3)], coll, _mat('Mimbre', '#C99A5B', rough=0.8,
               ribs=dict(scale=40, strength=0.5, axis='Z')), segments=20, cap_top=False)
    papel = laca('papel arrugado', '#FFFFFF', 0.7)
    for k, (x, y, z) in enumerate(((0.0, 0.02, 0.3), (0.05, -0.04, 0.28), (-0.05, -0.02, 0.29), (0.2, -0.15, 0.04), (-0.18, -0.2, 0.04))):
        clay.blob('bola papel', (x, y, z), (0.045, 0.045, 0.04), coll, papel, n=6, shaper=lambda v, k=k: v * (1 + 0.15 * np.sin(v[:, 0:1] * 40 + k)))


def juguetes_piso(coll):
    clay.blob('pelota piso', (0, 0, 0.1), (0.1, 0.1, 0.1), coll, laca('pelota rayas', '#F2C94C', 0.3), n=8)
    for k in range(3):
        clay.sweep('raya pelota', [(0.1 * math.cos(a) * math.cos(k * 1.05), 0.1 * math.sin(a), 0.1 + 0.1 * math.cos(a) * math.sin(k * 1.05)) for a in np.linspace(0, math.tau, 13)],
                   0.008, (1, 1), coll, laca('raya pelota', '#E4574B', 0.3), segments=4, samples=3, closed=True, subsurf=0)
    caja('carrito', (0.3, -0.1, 0.05), (0.1, 0.06, 0.035), coll, laca('carrito', '#4F8FE0', 0.3), p=6, n=4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.blob('rueda carrito', (0.3 + sx * 0.06, -0.1 + sy * 0.065, 0.02), (0.022, 0.012, 0.022), coll, laca('rueda', '#2B2A2A', 0.4), n=5, subsurf=0)
    for k in range(4):
        caja('ficha lego', (-0.2 + k * 0.07, 0.15 - (k % 2) * 0.06, 0.025), (0.03, 0.03, 0.025), coll,
             laca('lego ' + str(k), ('#E4574B', '#5AA94C', '#F2C94C', '#4F8FE0')[k], 0.35), p=8, n=3, subsurf=0)


def cama_gato(coll):
    clay.lathe('cama gato', [(0.0, 0.0), (0.22, 0.0), (0.26, 0.08), (0.22, 0.12), (0.16, 0.06), (0.0, 0.05)], coll, tela('cama gato', '#8A4FC2'), segments=28)
    clay.lathe('plato gato', [(0.0, 0.0), (0.07, 0.0), (0.08, 0.04), (0.0, 0.03)], coll, laca('plato gato', '#F2A5B8', 0.3), segments=16).location = (0.32, -0.1, 0)
    for k in range(5):
        clay.blob('croqueta', (0.32 + 0.03 * math.cos(k * 1.3), -0.1 + 0.03 * math.sin(k * 1.3), 0.04), (0.015, 0.015, 0.01), coll,
                  _mat('Croqueta', '#9C6B43', rough=0.8), n=4, subsurf=0)


def gato(coll):
    """El gato de la casona, dormido hecho una bola."""
    pelo = tela('gato', '#F2A65A')
    clay.blob('cuerpo gato', (0, 0, 0.09), (0.16, 0.13, 0.09), coll, pelo, n=8)
    clay.blob('cabeza gato', (0.1, -0.07, 0.13), (0.08, 0.07, 0.065), coll, pelo, n=8)
    for s in (-1, 1):
        clay.lathe('oreja gato', [(0.03, 0.0), (0.0, 0.05)], coll, pelo, segments=8).location = (0.1 + s * 0.045, -0.06, 0.17)
    clay.sweep('cola gato', [(-0.14, 0.04, 0.05), (-0.12, -0.12, 0.04), (0.02, -0.17, 0.04)], 0.03, (1, 1), coll, pelo, segments=6, samples=4)
    for k in range(3):
        clay.sweep('raya gato', [(-0.06 + k * 0.05, -0.12, 0.15), (-0.05 + k * 0.05, 0.12, 0.15)], 0.012, (1, 1), coll, tela('rayas gato', '#C9773A'),
                   segments=4, samples=2, subsurf=0)


# ---------------------------------------------------------------------------
# Cuartos
# ---------------------------------------------------------------------------
PISOS = {
    'cocina': ('ajedrez', '#F7F3EA', '#BFE6D8', 3.33),
    'salon': ('tablas', '#D49A62', '#C98B55', 1.6, '#9C6B43'),
    'patio': ('grama', '#8FCB6A'),
    'juegos': ('tablas', '#B98559', '#AE7A4F', 1.6, '#8A5A3B'),
    'biblioteca': ('alfombra', '#7A3B52'),
    'estudio': ('tablas', '#8A5A3B', '#7E5034', 1.6, '#5B3A29'),
    'comedor': ('tablas', '#C98B5A', '#BD7F4F', 1.6, '#8A5A3B'),
    'salatv': ('alfombra', '#E7D3B5'),
    'recibidor': ('ajedrez', '#F4EFE6', '#3D2B27', 3.33),
}
PAREDES = {
    'cocina': '#BFE6D8', 'salon': '#F2A5B8', 'patio': '#9C6B43', 'juegos': '#C9B6EA', 'biblioteca': '#7A3B52',
    'estudio': '#3B69A8', 'comedor': '#F2C94C', 'salatv': '#9FC2E8', 'recibidor': '#E3B54A',
}


def material_piso(clave):
    spec = PISOS[clave]
    if spec[0] == 'ajedrez':
        return tiendas.checker_material(f'Piso clue | {clave}', spec[1], spec[2], spec[3])
    if spec[0] == 'tablas':
        return casa.tablas_material(f'Piso clue | {clave}', spec[1], spec[2], spec[3], spec[4])
    if spec[0] == 'grama':
        return M('Grama clue', spec[1], rough=0.9, fuzz=dict(scale=90, color='#A8DB86', amount=0.7, strength=0.6, distance=0.004, dark=0.7),
                 noise=dict(scale=5, strength=0.2))
    return M(f'Alfombra clue | {clave}', spec[1], rough=0.95, fuzz=dict(scale=120, color=clientes.lighten(spec[1], 0.2), amount=0.5, strength=0.4, distance=0.003))


def lado_puerta(c, px, py):
    if py == c['y'] + c['h']:
        return 'abajo'
    if py == c['y'] - 1:
        return 'arriba'
    if px == c['x'] - 1:
        return 'izq'
    return 'der'


def paredes(coll, clave, c, alto=0.3, grosor=0.12):
    """Muros bajos alrededor del cuarto (con el hueco de cada puerta), la puerta abierta y el tapete de afuera."""
    muro = M(f'Muro clue | {clave}', PAREDES[clave], rough=0.85, fuzz=dict(scale=120, color=clientes.lighten(PAREDES[clave], 0.25), amount=0.4,
             strength=0.3, distance=0.003))
    remate = _mat(f'Remate muro {clave}', clientes.lighten(PAREDES[clave], 0.45), rough=0.6, coat=0.2)
    x0, y0, x1, y1 = c['x'] * S, -c['y'] * S, (c['x'] + c['w']) * S, -(c['y'] + c['h']) * S
    huecos = {'arriba': [], 'abajo': [], 'izq': [], 'der': []}
    for px, py in c['puertas']:
        lado = lado_puerta(c, px, py)
        huecos[lado].append((px if lado in ('arriba', 'abajo') else py))

    def tramo(a, b, fijo, horizontal):
        if b - a < 0.02:
            return
        if horizontal:
            caja('muro', ((a + b) / 2, fijo, alto / 2), ((b - a) / 2 + grosor / 2, grosor / 2, alto / 2), coll, muro, p=10, n=4)
            caja('remate', ((a + b) / 2, fijo, alto + 0.01), ((b - a) / 2 + grosor / 2, grosor / 2 - 0.025, 0.012), coll, remate, p=10, n=3)
        else:
            caja('muro', (fijo, (a + b) / 2, alto / 2), (grosor / 2, (b - a) / 2 + grosor / 2, alto / 2), coll, muro, p=10, n=4)
            caja('remate', (fijo, (a + b) / 2, alto + 0.01), (grosor / 2 - 0.025, (b - a) / 2 + grosor / 2, 0.012), coll, remate, p=10, n=3)

    for lado, fijo, horizontal, a0, a1 in (('arriba', y0, True, x0, x1), ('abajo', y1, True, x0, x1), ('izq', x0, False, y1, y0), ('der', x1, False, y1, y0)):
        cortes = []
        for k in huecos[lado]:
            if horizontal:
                cortes.append((k * S + 0.06, (k + 1) * S - 0.06))
            else:
                cortes.append((-(k + 1) * S + 0.06, -k * S - 0.06))
        cortes.sort()
        a = a0
        for ca, cb in cortes:
            tramo(a, ca, fijo, horizontal)
            a = cb
        tramo(a, a1, fijo, horizontal)
    # Puertas abiertas (la hoja contra la pared, por dentro) y tapetes afuera
    hoja = madera('puerta clue', '#9C6B43')
    for px, py in c['puertas']:
        lado = lado_puerta(c, px, py)
        cx, cy = B(px + 0.5, py + 0.5)[:2]
        tapete = tela('tapete puerta', '#B8574A')
        caja('tapete puerta', (cx, cy, 0.03), (0.22, 0.22, 0.012), coll, tapete, p=6, n=4)
        clay.stitches('costura tapete', [(cx - 0.17, cy - 0.17, 0.045), (cx + 0.17, cy - 0.17, 0.045), (cx + 0.17, cy + 0.17, 0.045), (cx - 0.17, cy + 0.17, 0.045)],
                      0.006, coll=coll, material=tela('hilo tapete', '#F6CF5A'), closed=True)
        # La hoja abierta 90° hacia dentro del cuarto, pegada a un lado del hueco
        if lado in ('arriba', 'abajo'):
            yy = y0 if lado == 'arriba' else y1
            dentro_y = -1 if lado == 'arriba' else 1
            caja('hoja puerta', (px * S + 0.08, yy + dentro_y * 0.24, 0.35), (0.025, 0.22, 0.35), coll, hoja, p=8, n=4)
            clay.blob('pomo', (px * S + 0.12, yy + dentro_y * 0.4, 0.4), (0.025, 0.025, 0.025), coll, laca('bronce', '#C99A3B', 0.25), n=5, subsurf=0)
        else:
            xx = x0 if lado == 'izq' else x1
            dentro_x = 1 if lado == 'izq' else -1
            caja('hoja puerta', (xx + dentro_x * 0.24, -py * S - 0.08, 0.35), (0.22, 0.025, 0.35), coll, hoja, p=8, n=4)
            clay.blob('pomo', (xx + dentro_x * 0.4, -py * S - 0.12, 0.4), (0.025, 0.025, 0.025), coll, laca('bronce', '#C99A3B', 0.25), n=5, subsurf=0)


def piso_cuarto(coll, clave, c):
    x0, y0, x1, y1 = c['x'] * S, -c['y'] * S, (c['x'] + c['w']) * S, -(c['y'] + c['h']) * S
    v = [(x0, y1, 0.0), (x1, y1, 0.0), (x1, y0, 0.0), (x0, y0, 0.0)]
    o = clay.make_mesh_object(f'piso {clave}', v, [(0, 1, 2, 3)], coll, smooth=False, material=material_piso(clave))
    return o


def amoblar(coll, clave):
    q = Cuarto(coll, clave)
    w, h = q.w, q.h
    if clave == 'cocina':
        q.pon('trampilla', trampilla, 0.55, 0.6)
        q.pon('mesón', lambda c: meson_cocina(c, 2.0), 2.95, 0.55, esc=0.95)
        q.pon('nevera', nevera, 5.25, 0.75, esc=0.8)
        q.pon('canasta', canasta_frutas, 0.6, 1.7, esc=0.9)
        q.pon('caneca', caneca, 5.4, 1.75, esc=0.9)
        q.pon('tapete cocina', lambda c: alfombra(c, 0.75, 0.22, '#F2A5B8', '#E4574B', flecos='#FFFFFF'), 2.9, 1.65)
        q.pon('gato', gato, 4.4, 1.55, rot=0.6)
        q.pon('mata cocina', lambda c: mata(c, 0.18, '#F2C94C', '#5AA94C', flor='#E4574B', seed=1), 0.5, 3.45)
        q.pon('tapete entrada cocina', lambda c: alfombra(c, 0.5, 0.3, '#4F8FE0', '#F2C94C'), 2.6, 3.0)
        q.pon('cama gato', cama_gato, 5.3, 3.4)
    elif clave == 'salon':
        q.pon('piano', piano, 1.3, 1.05, rot=0.0, esc=0.95)
        q.pon('pista', lambda c: pista_baile(c, 5, 3), 4.0, 2.6)
        q.pon('bola disco', bola_disco, 4.0, 1.0)
        q.pon('dj', tornamesa, 4.1, 0.4, esc=0.85)
        q.pon('torta', mesa_torta, 6.75, 0.65, esc=0.95)
        q.pon('globos izq', lambda c: globos(c, seed=1), 0.45, 0.4, esc=0.9)
        q.pon('globos der', lambda c: globos(c, ('#8A4FC2', '#F2C94C', '#E4574B', '#4F8FE0'), seed=2), 7.55, 0.4, esc=0.9)
        q.pon('globos medio', lambda c: globos(c, ('#F2A5B8', '#5AA94C', '#F2C94C'), seed=3), 5.6, 0.35, esc=0.75)
        q.pon('mata salón', lambda c: mata(c, 0.26, '#F7F5F0', '#2F8F5B', seed=4), 7.5, 3.5)
        q.pon('mata salón 2', lambda c: mata(c, 0.26, '#F7F5F0', '#2F8F5B', seed=5), 0.5, 3.5)
        for k in range(10):
            x = 0.8 + k * 0.7
            q.pon('confeti', lambda c, k=k: [clay.blob('confeti', (0.1 * math.cos(j * 2.4 + k), 0.12 * math.sin(j * 1.7 + k), 0.004), (0.02, 0.012, 0.003), c,
                                                       laca('confeti ' + str((j + k) % 5), ('#E4574B', '#F2C94C', '#4F8FE0', '#F2A5B8', '#5AA94C')[(j + k) % 5], 0.4), n=4,
                                                       subsurf=0) for j in range(6)], x, 2.0 + 0.25 * math.sin(k * 1.9))
    elif clave == 'patio':
        q.pon('trampilla', trampilla, w - 0.55, 0.6)
        q.pon('fuente', fuente, 1.45, 0.95, esc=0.85)
        q.pon('hamaca', lambda c: hamaca(c, 1.55), 3.55, 0.6)
        q.pon('cantero', lambda c: cantero(c, 1.0, seed=2), 0.95, 2.7)
        q.pon('enano', enano, 0.4, 2.0, rot=0.3)
        q.pon('manguera', manguera, 4.95, 1.75)
        q.pon('regadera', regadera, 2.55, 1.55, rot=-0.6)
        q.pon('mata patio', lambda c: mata(c, 0.24, '#E08A5F', '#5FA35A', flor='#F2587A', seed=6), 5.45, 2.45)
        q.pon('arbustos', casa.arbustos, 2.6, 0.35, esc=0.8)
        for k, (x, y) in enumerate(((0.1, 1.5), (0.45, 1.15), (0.85, 1.75), (1.4, 2.1), (2.1, 2.35), (2.6, 2.7))):
            q.pon('piedra', lambda c, k=k: clay.blob('piedra camino', (0, 0, 0.02), (0.13, 0.1, 0.025), c, _mat('Piedra', '#CFC7BD', rough=0.8,
                                                      noise=dict(scale=20, strength=0.3)), n=6), x, y, rot=k * 0.7)
    elif clave == 'juegos':
        q.pon('arcade', casa.arcade, 0.7, 0.55, esc=0.75)
        q.pon('billar', billar, 2.9, 1.05, esc=0.85)
        q.pon('consola', consola_juegos, 5.0, 0.35, esc=0.8)
        q.pon('puf', lambda c: casa.puf(c, '#F2A5B8'), 4.4, 1.35, esc=0.8)
        q.pon('puf 2', lambda c: casa.puf(c, '#9FC2E8'), 5.5, 1.35, esc=0.8)
        q.pon('baúl', baul_juguetes, 1.6, 0.45, esc=0.7)
        q.pon('juguetes', juguetes_piso, 5.2, 2.55, esc=0.9)
    elif clave == 'biblioteca':
        q.pon('librero', lambda c: librero(c, 2.2, seed=1), 2.0, 0.32)
        q.pon('librero 2', lambda c: librero(c, 1.2, seed=4), 5.0, 0.32)
        q.pon('sillón', lambda c: casa.sillon(c, '#7A2E3B', '#F2C94C'), 4.5, 1.45, rot=math.pi * 0.15, esc=0.65)
        q.pon('lámpara', lambda c: lampara_pie(c, '#F7E3B5'), 5.55, 1.2, esc=0.7)
        q.pon('mesita té', mesita_te, 3.5, 1.45, esc=0.75)
        q.pon('globo', globo_terraqueo, 0.5, 1.2, esc=0.7)
        q.pon('pila libros', lambda c: pila_libros(c, 5, 1), 1.25, 1.35)
        q.pon('pila libros 2', lambda c: pila_libros(c, 3, 3), 5.55, 2.6)
        q.pon('escalera', escalera_libros, 1.9, 1.0, rot=math.pi, esc=0.6)
        q.pon('pila libros 3', lambda c: pila_libros(c, 4, 5), 0.4, 2.6)
    elif clave == 'estudio':
        q.pon('trampilla', trampilla, w - 0.55, 0.6)
        q.pon('alfombra estudio', lambda c: alfombra(c, 1.3, 0.75, '#2A4F9E', '#F0D488', dibujo='#F0D488'), 3.0, 2.3)
        q.pon('escritorio', escritorio, 2.9, 0.75, esc=0.9)
        q.pon('silla oficina', silla_oficina, 2.9, 1.45, rot=math.pi, esc=0.8)
        q.pon('librero estudio', lambda c: librero(c, 1.1, seed=7), 0.95, 0.32)
        q.pon('caja fuerte', caja_fuerte, 0.5, 1.4, esc=0.75)
        q.pon('archivador', archivador, 4.5, 0.45, esc=0.8)
        q.pon('mata estudio', lambda c: mata(c, 0.25, '#3D2B27', '#2F8F5B', seed=8), 0.5, 3.45)
        q.pon('papelera', papelera, 5.45, 3.4)
    elif clave == 'comedor':
        q.pon('alfombra comedor', lambda c: alfombra(c, 1.5, 0.8, '#C2354A', '#F2C94C', dibujo='#F2C94C'), 3.0, 1.55)
        q.pon('mesa comedor', lambda c: mesa_comedor(c, 2.3, 0.7), 3.0, 1.45)
        for k in range(3):
            x = 3.0 + (k - 1) * 1.28
            q.pon('silla', lambda c: silla(c, '#F2A5B8'), x, 0.75, rot=math.pi, esc=0.9)
            q.pon('silla', lambda c: silla(c, '#F2A5B8'), x, 2.15, esc=0.9)
        q.pon('silla cabecera', lambda c: silla(c, '#C2354A'), 0.7, 1.45, rot=-math.pi / 2, esc=0.9)
        q.pon('silla cabecera 2', lambda c: silla(c, '#C2354A'), 5.3, 1.45, rot=math.pi / 2, esc=0.9)
        q.pon('aparador', lambda c: aparador(c, 1.4), 3.0, 0.25, esc=0.9)
        q.pon('mata comedor', lambda c: mata(c, 0.22, '#E08A5F', '#5FA35A', seed=9), 0.45, 0.45)
        q.pon('mata comedor 2', lambda c: mata(c, 0.22, '#E08A5F', '#5FA35A', seed=10), 5.55, 0.45)
        q.pon('mata comedor 3', lambda c: mata(c, 0.2, '#F2C94C', '#5AA94C', flor='#F2A5B8', seed=14), 0.45, 3.5)
        q.pon('mata comedor 4', lambda c: mata(c, 0.2, '#F2C94C', '#5AA94C', flor='#F2A5B8', seed=15), 5.55, 3.5)
    elif clave == 'salatv':
        q.pon('trampilla', trampilla, 0.55, 0.6)
        q.pon('alfombra tv', lambda c: alfombra(c, 1.2, 0.7, '#F2C94C', '#9C6B43', dibujo='#E08A5F'), 3.1, 1.6)
        q.pon('mueble tv', mueble_tv, 3.1, 0.3, esc=0.85)
        q.pon('mesa tv', mesa_tv, 3.1, 1.1, esc=0.9)
        q.pon('sofá', sofa_grande, 3.1, 2.05, rot=math.pi, esc=0.8)
        q.pon('lámpara tv', lambda c: lampara_pie(c, '#F2A5B8'), 5.45, 1.6, esc=0.7)
        q.pon('puf tv', lambda c: casa.puf(c, '#5AA94C'), 1.1, 1.7, esc=0.75)
        q.pon('mata tv', lambda c: mata(c, 0.24, '#F7F5F0', '#2F8F5B', seed=11), 5.45, 0.5)
        q.pon('gato tv', gato, 4.6, 2.05, rot=2.4, esc=0.9)
        q.pon('mata tv 2', lambda c: mata(c, 0.22, '#E08A5F', '#2F8F5B', seed=16), 0.45, 3.5)
        q.pon('juguetes tv', juguetes_piso, 4.9, 3.5, esc=0.9)
    elif clave == 'recibidor':
        q.pon('alfombra entrada', lambda c: alfombra(c, 1.05, 1.05, '#C2354A', '#F2C94C', dibujo='#F2C94C', redonda=True), 4.0, 2.5)
        q.pon('consola entrada', consola_entrada, 4.0, 0.35, esc=0.9)
        q.pon('perchero', perchero, 0.55, 0.55, esc=0.8)
        q.pon('paragüero', paraguero, 1.25, 0.5, esc=0.8)
        q.pon('banca entrada', banca_entrada, 6.3, 0.45, esc=0.85)
        q.pon('mata recibidor', lambda c: mata(c, 0.3, '#F7F5F0', '#2F8F5B', flor='#F7C948', seed=12), 7.45, 3.45)
        q.pon('mata recibidor 2', lambda c: mata(c, 0.3, '#F7F5F0', '#2F8F5B', flor='#F7C948', seed=13), 0.55, 3.45)
        q.pon('mesa redonda', lambda c: casa.mesa_centro(c), 2.3, 1.2, esc=0.6)


def sotano(coll):
    """El sótano del centro: piedra, la escalera, la silueta de tiza de Don Cuervo, el sobre lacrado y velas."""
    c = SOTANO
    piedra = [_mat(f'Piedra sótano {k}', col, rough=0.85, noise=dict(scale=8, strength=0.35)) for k, col in enumerate(('#5A5160', '#504858', '#625868'))]
    for j in range(c['h'] * 2):
        for i in range(c['w'] * 2):
            cx, cy = B(c['x'] + (i + 0.5) / 2, c['y'] + (j + 0.5) / 2)[:2]
            losa('loza sótano', (cx, cy, 0.0), (S / 4 - 0.01, S / 4 - 0.01, 0.025), coll, piedra[(i * 7 + j * 3) % 3], bisel=0.012)
    caja('fondo sótano', B(c['x'] + c['w'] / 2, c['y'] + c['h'] / 2, -0.03), (c['w'] * S / 2, c['h'] * S / 2, 0.02), coll, _mat('Junta sótano', '#2E2832'), p=4, n=3,
         subsurf=0)
    q = Cuarto(coll, 'sotano')
    # Escalera que sube (los escalones más altos arriba a la izquierda)
    mad = [madera(f'escalón {k}', col) for k, col in enumerate(('#C9A27C', '#B98F68', '#A87E58', '#966D49', '#845D3C'))]
    for k in range(5):
        caja('escalón', q.p(0.95, 0.5 + k * 0.62, 0.5 - k * 0.1), (0.42, 0.17, 0.05), coll, mad[k], p=8, n=4)
    for s in (-1, 1):
        clay.sweep('baranda', [q.p(0.95 + s * 0.78, 0.35, 0.9), q.p(0.95 + s * 0.78, 3.2, 0.4)], 0.025, (1, 1), coll, madera('baranda', '#6B4226'), segments=6,
                   samples=2)
    # Silueta de tiza de Don Cuervo (con su chichón)
    tiza = _mat('Tiza', '#FFFFFF', rough=0.9)

    def contorno(pts, cerrado=True):
        clay.sweep('tiza', [q.p(x, y, 0.035) for x, y in pts], 0.012, (1, 1), coll, tiza, segments=4, samples=3, subsurf=0, closed=cerrado)
    contorno([(4.25 + 0.75 * math.cos(a), 2.75 + 0.42 * math.sin(a)) for a in np.linspace(0, math.tau, 19)[:-1]])
    contorno([(3.2 + 0.28 * math.cos(a), 2.55 + 0.28 * math.sin(a)) for a in np.linspace(0, math.tau, 13)[:-1]])
    contorno([(2.95, 2.5), (2.7, 2.6), (2.95, 2.68)], False)
    contorno([(3.15 + 0.12 * math.cos(a), 2.2 + 0.12 * math.sin(a)) for a in np.linspace(0, math.tau, 10)[:-1]])
    contorno([(4.9, 2.9), (5.4, 3.25)], False)
    contorno([(4.9, 2.55), (5.45, 2.3)], False)
    contorno([(4.0, 3.15), (3.9, 3.55)], False)
    contorno([(4.45, 3.15), (4.6, 3.55)], False)
    for k in range(3):
        clay.sweep('estrellita tiza', [q.p(3.0 + 0.2 * k, 1.9 - 0.06 * (k % 2), 0.035), q.p(3.08 + 0.2 * k, 1.82, 0.035)], 0.01, (1, 1), coll, tiza, segments=4,
                   samples=2, subsurf=0)
    # El sobre lacrado encima de un cajón
    q.pon('cajón', lambda c: caja('cajón sobre', (0, 0, 0.18), (0.32, 0.24, 0.18), c, madera('cajón', '#9C6B43'), p=10, n=4), 3.25, 1.05)
    for k in range(3):
        caja('tabla cajón', q.p(3.25, 0.7 + k * 0.33, 0.365), (0.31, 0.06, 0.006), coll, madera('tabla cajón', '#B07F52'), p=6, n=3, subsurf=0)
    papel = _mat('Sobre', '#F4E2BD', rough=0.7, noise=dict(scale=40, strength=0.15))
    sobre = q.p(3.25, 1.05, 0.37)
    o = placa('sobre', [(-0.24, -0.16), (0.24, -0.16), (0.24, 0.16), (-0.24, 0.16)], 0.0, coll, papel, grosor=0.02, bisel=0.006)
    o.location = sobre
    o.rotation_euler = (0, 0, -0.12)
    o = placa('solapa sobre', [(-0.24, 0.16), (0.24, 0.16), (0.0, -0.04)], 0.02, coll, _mat('Solapa sobre', '#EAD2A0', rough=0.7), grosor=0.006, bisel=0.003)
    o.location = sobre
    o.rotation_euler = (0, 0, -0.12)
    clay.lathe('lacre', [(0.0, 0.0), (0.06, 0.0), (0.065, 0.015), (0.0, 0.02)], coll, M('Lacre', '#C2354A', rough=0.3, coat=0.6, noise=dict(scale=30, strength=0.3)),
               segments=20).location = (sobre[0], sobre[1] - 0.005, sobre[2] + 0.022)
    # Velas, barril, telarañas y la linterna del detective
    for x, y in ((2.45, 0.55), (4.1, 0.55), (5.6, 0.5)):
        q.pon('vela sótano', lambda c: vela(c, 0, 0, 0.0), x, y, esc=1.3)
    q.pon('barril', lambda c: clay.lathe('barril', [(0.0, 0.0), (0.22, 0.0), (0.26, 0.25), (0.22, 0.5), (0.0, 0.5)], c,
                                         madera('barril', '#8A5A3B'), segments=24), 5.5, 1.3)
    bx, by, _ = q.p(5.5, 1.3)
    for k in range(3):
        z = 0.08 + k * 0.17
        r = 0.22 + 0.04 * math.sin(math.pi * z / 0.5)
        clay.lathe('aro barril', [(r + 0.005, z - 0.02), (r + 0.012, z), (r + 0.005, z + 0.02)], coll, laca('aro', '#3A3A3A', 0.4), segments=24,
                   cap_bottom=False, cap_top=False).location = (bx, by, 0)
    clay.lathe('tapa barril', [(0.0, 0.5), (0.2, 0.5), (0.2, 0.51), (0.0, 0.51)], coll, madera('tapa barril', '#9C6B43'), segments=24).location = (bx, by, 0)
    # Telarañas en las esquinas (menos en la de la escalera)
    tela_arana = _mat('Telaraña', '#EDEDED', rough=0.9)
    for cx, cy in ((6.0, 0.0), (6.0, 4.0), (0.0, 4.0)):
        dx, dy = (1 if cx == 0 else -1), (1 if cy == 0 else -1)
        rayos = [(cx + dx * 0.75 * math.cos(a), cy + dy * 0.75 * math.sin(a)) for a in np.linspace(0, math.pi / 2, 5)]
        for x, y in rayos:
            clay.sweep('hilo araña', [q.p(cx, cy, 0.06), q.p(x, y, 0.06)], 0.004, (1, 1), coll, tela_arana, segments=3, samples=2, subsurf=0)
        for f in (0.35, 0.6):
            clay.sweep('vuelta araña', [q.p(cx + (x - cx) * f, cy + (y - cy) * f, 0.06) for x, y in rayos], 0.003, (1, 1), coll, tela_arana, segments=3,
                       samples=3, subsurf=0)

    def linterna(c):
        o = clay.lathe('linterna', [(0.0, 0.0), (0.035, 0.0), (0.035, 0.18), (0.05, 0.22), (0.0, 0.22)], c, laca('linterna', '#E4574B', 0.3), segments=14)
        o.rotation_euler = (math.pi / 2, 0, 0)
        o.location = (0, 0, 0.05)
        clay.blob('luz linterna', (0, 0.24, 0.05), (0.04, 0.01, 0.04), c, luz('linterna', '#FFF1C2', 5.0), n=5, subsurf=0)
        clay.blob('haz linterna', (0, 0.62, 0.003), (0.18, 0.36, 0.002), c, M('Haz', '#FFF1C2', rough=0.9, emission='#FFF1C2', emission_strength=0.6, alpha=0.5), n=8)
    q.pon('linterna', linterna, 1.95, 3.45, rot=-1.9)


def pasillos(coll):
    # Baldosa a cuadros crema y caramelo, cada una con su tonito (como de barro cocido) y vetas suaves
    claros = [M(f'Baldosa clara {k}', col, rough=0.45, coat=0.2, noise=dict(scale=9, strength=0.12, distance=0.004))
              for k, col in enumerate(('#F4E6C8', '#F1E1C0', '#F6EAD0'))]
    oscuros = [M(f'Baldosa oscura {k}', col, rough=0.45, coat=0.2, noise=dict(scale=9, strength=0.12, distance=0.004))
               for k, col in enumerate(('#D9B98A', '#D4B283', '#DEBF92'))]
    for y in range(ALTO):
        for x in range(ANCHO):
            if pasillo(x, y):
                mats = claros if (x + y) % 2 else oscuros
                losa('baldosa', B(x + 0.5, y + 0.5, 0.0), (S / 2 - 0.012, S / 2 - 0.012, 0.02), coll, mats[(x * 7 + y * 13) % 3], bisel=0.014)
    # Junta de las baldosas y el marco de madera alrededor
    caja('junta', B(ANCHO / 2, ALTO / 2, -0.03), (ANCHO * S / 2 + 0.05, ALTO * S / 2 + 0.05, 0.02), coll, _mat('Junta', '#A88B66', rough=0.9), p=4, n=3,
         subsurf=0)
    marco = madera('marco tablero', '#6B4226')
    moldura = madera('moldura tablero', '#8A5A34')
    m = MARCO * S
    W, H = ANCHO * S, ALTO * S
    for (cx, cy, hx, hy) in ((W / 2, m / 2 - 0.0, W / 2 + m, m / 2), (W / 2, -H - m / 2, W / 2 + m, m / 2), (-m / 2, -H / 2, m / 2, H / 2 + m),
                             (W + m / 2, -H / 2, m / 2, H / 2 + m)):
        caja('marco', (cx, cy, 0.04), (hx, hy, 0.09), coll, marco, p=10, n=4, subsurf=1)
    for (cx, cy, hx, hy) in ((W / 2, 0.04, W / 2 + 0.06, 0.04), (W / 2, -H - 0.04, W / 2 + 0.06, 0.04), (-0.04, -H / 2, 0.04, H / 2 + 0.06),
                             (W + 0.04, -H / 2, 0.04, H / 2 + 0.06)):
        caja('moldura', (cx, cy, 0.1), (hx, hy, 0.04), coll, moldura, p=10, n=4, subsurf=1)
    oro = M('Bronce marco', '#D9A94E', rough=0.25, metallic=0.9)
    for sx, sy in ((-m / 2, m / 2), (W + m / 2, m / 2), (-m / 2, -H - m / 2), (W + m / 2, -H - m / 2)):
        clay.blob('esquinero', (sx, sy, 0.14), (0.14, 0.14, 0.04), coll, oro, n=8)
        clay.blob('lupa esquinero', (sx, sy, 0.18), (0.06, 0.06, 0.02), coll, M('Vidrio lupa', '#CFE2F7', rough=0.05, coat=1.0), n=6)


def tablero(salida):
    nueva_escena()
    scene = bpy.context.scene
    coll = clay.collection('Casona')
    pasillos(coll)
    sotano(clay.collection('Sótano', coll))
    for clave, c in CUARTOS.items():
        cc = clay.collection(clave, coll)
        piso_cuarto(cc, clave, c)
        paredes(cc, clave, c)
        amoblar(cc, clave)
    # Cámara cenital ortográfica que cubre exactamente el viewBox del juego
    ancho_m = (ANCHO + 2 * MARCO) * S
    cam_data = bpy.data.cameras.new('Cámara tablero')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = ancho_m
    cam_data.clip_start = 0.1
    cam_data.clip_end = 50
    cam = bpy.data.objects.new('Cámara tablero', cam_data)
    clay.link(cam, coll)
    cam.location = (ANCHO * S / 2, -ALTO * S / 2, 20)
    scene.camera = cam
    # Luz: sol desde arriba a la izquierda (sombras suaves hacia abajo a la derecha) y cielo cálido
    sol = bpy.data.lights.new('Sol', 'SUN')
    sol.energy = 3.6
    sol.angle = math.radians(12)
    sol.color = clay.rgb('#FFF3E2')[:3]
    o = bpy.data.objects.new('Sol', sol)
    clay.link(o, coll)
    o.rotation_euler = (math.radians(-32), math.radians(-18), 0.0)
    escala = 0.5 if RAPIDO else 1.0
    preparar(scene, int((ANCHO + 2 * MARCO) * PX * escala), int((ALTO + 2 * MARCO) * PX * escala), 24 if RAPIDO else 160)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    scene.render.filepath = os.path.join(salida, 'tablero.png')
    bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------------------
# Sospechosos (el generador de los clientes del súper) y armas
# ---------------------------------------------------------------------------
SOSPECHOSOS = {
    'fresa': dict(base='f', label='Señorita Fresa', hair='melena', hair_color='#6B2A1E', skin='#F2C6A6', top='#E4574B', sleeves='cortas', bottom='#E4574B',
                  lower='falda', shoes='#C2354A', socks='#FFFFFF', accs=['gafas_sol', 'estrellitas'], acc_color='#F7D774', acc2_color='#3A1A1A', mouth='u'),
    'maracuya': dict(base='m', label='Coronel Maracuyá', hat='guardia', hair='corto', hair_color='#3A2A22', top='#F2B632', sleeves='largas', bottom='#7A5A2A',
                     shoes='#2B2A2A', accs=['bigote', 'placa', 'baston'], acc_color='#C2354A', acc2_color='#6B5A1E', brow_tilt=14, mouth='recta'),
    'arepa': dict(base='f', label='Doña Arepa', hat='chef', hair='moño', hair_color='#8A8580', skin='#E8B48C', top='#F7F5F0', sleeves='largas', bottom='#F7F5F0',
                  lower='falda', shoes='#7A5646', accs=['delantal', 'gafas'], acc_color='#F7D774', mouth='o'),
    'aguacate': dict(base='m', label='Don Aguacate', hat='sombrero', hair='corto', hair_color='#4A3020', skin='#C68B5E', top='#5AA94C', sleeves='cortas',
                     bottom='#6B4A2B', shoes='#5A3A28', accs=['canasta'], acc_color='#E4574B', acc2_color='#E7C98B', mouth='u'),
    'arandano': dict(base='f', label='Señora Arándano', hair='moño', hair_color='#2A2240', skin='#F2C6A6', top='#4F8FE0', sleeves='largas', bottom='#2E5FA8',
                     lower='falda', shoes='#2E3A6B', accs=['gafas', 'bolso'], acc_color='#F7F5F0', acc2_color='#2B2A2A', mouth='u', brow_tilt=8),
    'mora': dict(base='m', label='Profe Mora', hair='despeinado', hair_color='#E8E4F0', skin='#E8B48C', top='#8A4FC2', sleeves='largas', bottom='#4A3A5A',
                 shoes='#2B2A2A', accs=['gafas', 'corbata'], acc_color='#C9B6EA', mouth='o', brow_tilt=-8),
}


def extras_sospechoso(clave, coll):
    """Detallitos que el generador no trae: las perlas de la Señora Arándano, la corona de la Señorita Fresa..."""
    if clave == 'arandano':
        perla = M('Perla', '#FBF6EE', rough=0.15, coat=1.0, sheen=0.3)
        for k in range(15):
            a = math.pi * (0.12 + 0.76 * k / 14)
            clay.blob('perla', (0.3 * math.cos(a), 0.03 - 0.3 * math.sin(a), 0.9 - 0.07 * math.sin(a)), (0.034, 0.034, 0.034), coll, perla, n=6, subsurf=0)
    if clave == 'fresa':
        # Corona de reina de telenovela apoyada sobre el pelo (se mide dónde quedó la coronilla)
        bpy.context.view_layer.update()
        tope = max((o.matrix_world @ Vector(v)).z for o in coll.objects if o.type == 'MESH' for v in o.bound_box)
        z = tope - 0.2
        oro = M('Corona', '#F2C94C', rough=0.2, metallic=0.9, coat=0.4)
        r = 0.34
        clay.lathe('aro corona', [(r, z), (r + 0.02, z + 0.12), (r - 0.01, z + 0.14), (r - 0.04, z + 0.02)], coll, oro, segments=36, cap_bottom=False,
                   cap_top=False)
        for k in range(8):
            a = k / 8 * math.tau + math.pi / 2
            clay.lathe('pico corona', [(0.07, 0.0), (0.0, 0.24)], coll, oro, segments=10).location = (r * math.cos(a), r * math.sin(a), z + 0.12)
            clay.blob('perlita corona', (r * math.cos(a), r * math.sin(a), z + 0.38), (0.03, 0.03, 0.03), coll, M('Perla', '#FBF6EE', rough=0.15, coat=1.0), n=5,
                      subsurf=0)
        clay.blob('rubí', (0, -r - 0.02, z + 0.07), (0.06, 0.025, 0.055), coll, M('Rubí', '#E4574B', rough=0.1, coat=1.0), n=6)


def preparar(scene, ancho, alto, muestras, transparente=False):
    import cocina_fondos
    cocina_fondos.preparar(scene, ancho, alto, muestras, transparente)


def encuadrar(objetos, cam, margen=1.08):
    """Ajusta la cámara ortográfica para que quepan los objetos (en el plano de la cámara)."""
    bpy.context.view_layer.update()
    inv = cam.matrix_world.inverted()
    pts = []
    for o in objetos:
        if o.type != 'MESH':
            continue
        for v in o.bound_box:
            pts.append(inv @ (o.matrix_world @ Vector(v)))
    xs, ys = [p.x for p in pts], [p.y for p in pts]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    r = bpy.context.scene.render
    aspecto = r.resolution_x / r.resolution_y
    # ortho_scale mide el lado más largo de la imagen
    cam.data.ortho_scale = (max(w, h * aspecto) if aspecto >= 1 else max(h, w / aspecto)) * margen
    cam.location = cam.matrix_world @ Vector((cx, cy, 0))


def estudio_ficha(coll, elev=14, azim=-22):
    cam_data = bpy.data.cameras.new('Cámara ficha')
    cam_data.type = 'ORTHO'
    cam = bpy.data.objects.new('Cámara ficha', cam_data)
    clay.link(cam, coll)
    d = 30
    e, a = math.radians(elev), math.radians(azim)
    cam.location = (d * math.cos(e) * math.sin(a), -d * math.cos(e) * math.cos(a), d * math.sin(e) + 0.8)
    cam.rotation_euler = (math.pi / 2 - e, 0, a)
    bpy.context.scene.camera = cam
    import cocina_fondos
    cocina_fondos.luz_area('Clave', (-3, -4, 5), (0, 0, 0.8), 900, 3, '#FFF1E2', coll)
    cocina_fondos.luz_area('Relleno', (4, -3, 2), (0, 0, 0.8), 300, 4, '#E2EEFF', coll)
    cocina_fondos.luz_area('Contra', (1, 4, 4), (0, 0, 1), 500, 2, '#FFFFFF', coll)
    return cam


def sospechosos(salida, claves=None):
    for clave, spec in SOSPECHOSOS.items():
        if claves and clave not in claves:
            continue
        nueva_escena()
        scene = bpy.context.scene
        clientes.SPECS[f'clue_{clave}'] = spec
        coll = clay.collection(f'Sospechoso {clave}')
        root = clientes.build(f'clue_{clave}', coll)
        extras_sospechoso(clave, coll)
        preparar(scene, 300 if not RAPIDO else 150, 400 if not RAPIDO else 200, 24 if RAPIDO else 128, transparente=True)
        cam = estudio_ficha(coll)
        encuadrar([o for o in coll.objects], cam)
        scene.render.filepath = os.path.join(salida, f's_{clave}.png')
        bpy.ops.render.render(write_still=True)
        del root


def arma_chancla(coll):
    suela = M('Suela chancla', '#4F8FE0', rough=0.6, noise=dict(scale=40, strength=0.2))
    borde = M('Borde chancla', '#F7F5F0', rough=0.6)
    # Contorno de pie: dedos anchos adelante, cintura y talón redondo
    pts = []
    for a in np.linspace(0, math.tau, 40)[:-1]:
        y = math.sin(a)
        ancho = 0.15 + 0.045 * y - 0.035 * math.exp(-((y + 0.15) / 0.25) ** 2)
        pts.append((ancho * math.cos(a) / max(0.35, abs(math.cos(a))) ** 0.15 * 0.95, 0.4 * y + 0.03))
    placa('suela chancla', pts, 0.0, coll, borde, grosor=0.035, bisel=0.012)
    pts2 = [(x * 0.93, y * 0.95) for x, y in pts]
    placa('plantilla chancla', pts2, 0.035, coll, suela, grosor=0.01, bisel=0.004)
    tira = M('Tira chancla', '#F2C94C', rough=0.4, coat=0.3)
    for s in (-1, 1):
        clay.sweep('tira chancla', [(0.0, 0.22, 0.05), (s * 0.06, 0.1, 0.12), (s * 0.15, -0.02, 0.05)], 0.022, (1.4, 0.6), coll, tira, segments=6, samples=5)
    clay.blob('botón chancla', (0.0, 0.22, 0.06), (0.025, 0.025, 0.02), coll, tira, n=5)


def arma_rodillo(coll):
    mad = madera('rodillo', '#D9A876')
    clay.lathe('rodillo', [(0.0, -0.3), (0.09, -0.3), (0.1, -0.28), (0.1, 0.28), (0.09, 0.3), (0.0, 0.3)], coll, mad, segments=28).rotation_euler = (0, math.pi / 2, 0)
    for s in (-1, 1):
        o = clay.lathe('mango rodillo', [(0.0, 0.0), (0.03, 0.0), (0.045, 0.06), (0.045, 0.14), (0.03, 0.17), (0.0, 0.17)], coll, madera('mango rodillo', '#B07F52'),
                       segments=16)
        o.rotation_euler = (0, s * math.pi / 2, 0)
        o.location = (s * 0.3, 0, 0)
    clay.blob('harina', (0.05, -0.02, 0.1), (0.08, 0.05, 0.01), coll, _mat('Harina', '#FFFFFF', rough=0.95), n=5)


def arma_olla(coll):
    acero = M('Olla exprés', '#C9CCD1', rough=0.22, metallic=0.85, coat=0.4)
    negro = laca('baquelita', '#2B2A2A', 0.35)
    clay.lathe('olla exprés', [(0.0, 0.0), (0.24, 0.0), (0.26, 0.03), (0.26, 0.28), (0.27, 0.3)], coll, acero, segments=36, cap_top=False)
    clay.lathe('tapa olla', [(0.27, 0.3), (0.26, 0.33), (0.12, 0.38), (0.0, 0.39)], coll, acero, segments=36)
    clay.lathe('válvula', [(0.0, 0.38), (0.04, 0.38), (0.035, 0.45), (0.05, 0.47), (0.0, 0.48)], coll, negro, segments=16)
    clay.sweep('mango olla', [(0.26, 0, 0.33), (0.55, 0, 0.34)], 0.035, (1.2, 0.8), coll, negro, segments=8, samples=2)
    clay.sweep('mango tapa', [(-0.12, 0, 0.38), (-0.48, 0, 0.36)], 0.032, (1.2, 0.8), coll, negro, segments=8, samples=2)
    for k in range(3):
        clay.blob('vapor', (0.03 * k, 0.0, 0.56 + k * 0.1), (0.06 + 0.02 * k, 0.05, 0.045), coll, M('Vapor', '#FFFFFF', rough=0.9, alpha=0.6), n=6)


def arma_control(coll):
    negro = M('Control tele', '#2B2A2A', rough=0.4, coat=0.3)
    caja('control', (0, 0, 0.03), (0.07, 0.24, 0.03), coll, negro, p=6, n=5)
    clay.blob('botón rojo', (0, 0.18, 0.065), (0.022, 0.022, 0.01), coll, laca('botón rojo', '#E4574B', 0.3), n=5)
    for j in range(4):
        for i in range(3):
            clay.blob('botón', (-0.035 + i * 0.035, 0.08 - j * 0.045, 0.062), (0.012, 0.012, 0.008), coll, laca('botón gris', '#C9CCD1', 0.4), n=4, subsurf=0)
    clay.blob('cruceta', (0, -0.14, 0.064), (0.035, 0.035, 0.01), coll, laca('cruceta', '#4F8FE0', 0.3), n=6)


def arma_escoba(coll):
    """Escoba de paja de las de antes, ladeada (así cabe gordita en la ficha): palo rojo, abanico de paja y amarres."""
    def armar():
        clay.sweep('palo escoba', [(0, 0, 0.3), (0, 0, 1.05)], 0.04, (1, 1), coll, laca('palo escoba', '#E4574B', 0.35), segments=10, samples=2)
        clay.blob('punta palo', (0, 0, 1.06), (0.045, 0.045, 0.03), coll, laca('punta palo', '#F2C94C', 0.35), n=6)
        paja = M('Paja escoba', '#E7C98B', rough=0.85, fuzz=dict(scale=120, color='#F4DCA6', amount=0.5, strength=0.3, distance=0.003))
        paja2 = M('Paja escoba oscura', '#CFA96A', rough=0.85)
        # El cuello amarrado y el abanico de pajas que se abre hacia abajo
        clay.blob('cuello escoba', (0, 0, 0.3), (0.09, 0.07, 0.08), coll, paja, n=8)
        for k in range(23):
            t = k / 22 - 0.5
            clay.sweep('paja', [(t * 0.16, 0.0, 0.32), (t * 0.36, 0.01 * math.sin(k * 3), 0.16), (t * 0.56, 0.015 * math.cos(k * 5), -0.06)], 0.022, (1.0, 0.7),
                       coll, paja if k % 3 else paja2, segments=5, samples=3)
        for k in range(2):
            z = 0.26 - k * 0.07
            w = 0.1 + k * 0.06
            clay.sweep('amarre', [(-w, 0.03, z), (0, 0.06, z), (w, 0.03, z)], 0.016, (1, 1), coll, laca('amarre', '#4F8FE0', 0.4), segments=6, samples=3)
    _group(coll, 'escoba', (0, 0, 0), 0.0, armar).rotation_euler = (0, math.radians(32), 0)


def arma_matera(coll):
    clay.lathe('matera', [(0.0, 0.0), (0.13, 0.0), (0.18, 0.28), (0.2, 0.3), (0.2, 0.34), (0.17, 0.34)], coll, laca('barro', '#C96F45', 0.6), segments=28)
    clay.lathe('tierra matera', [(0.0, 0.31), (0.17, 0.31)], coll, _mat('Tierra', '#5B3A29', rough=0.95, noise=dict(scale=40, strength=0.3)), segments=24)
    for k in range(7):
        a = k / 7 * math.tau
        o = clay.blob('hoja matera', (0.1 * math.cos(a), 0.1 * math.sin(a), 0.42 + 0.05 * (k % 2)), (0.12, 0.05, 0.02), coll, tela('hoja matera', '#5AA94C'), n=6)
        o.rotation_euler = (0.5 * math.sin(a), -0.5 * math.cos(a), a)
    clay.sweep('tallo matera', [(0, 0, 0.3), (0.02, 0, 0.62)], 0.012, (1, 1), coll, _mat('Tallo', '#5FA35A', rough=0.7), segments=4, samples=2)
    for k in range(5):
        a = k / 5 * math.tau
        clay.blob('pétalo matera', (0.02 + 0.05 * math.cos(a), 0.05 * math.sin(a), 0.65), (0.045, 0.045, 0.02), coll, laca('pétalo', '#F2A5B8', 0.4), n=5)
    clay.blob('centro matera', (0.02, 0, 0.67), (0.025, 0.025, 0.02), coll, laca('centro', '#F7C948', 0.4), n=4)
    # La grieta de cuando «se cayó sola del balcón», pegadita a la superficie y mirando a la cámara
    def sobre_matera(a, z, da=0.0):
        r = 0.13 + 0.05 * z / 0.28 + 0.004
        return (r * math.cos(a + da), r * math.sin(a + da), z)
    a0 = math.radians(-75)
    clay.sweep('grieta', [sobre_matera(a0, 0.27), sobre_matera(a0, 0.2, 0.12), sobre_matera(a0, 0.14, -0.05), sobre_matera(a0, 0.07, 0.1)], 0.007, (1, 1), coll,
               _mat('Grieta', '#5B3A29'), segments=4, samples=3, subsurf=0)


ARMAS = {'chancla': (arma_chancla, 40, -30), 'rodillo': (arma_rodillo, 28, -20), 'olla': (arma_olla, 22, -25), 'control': (arma_control, 50, -35),
         'escoba': (arma_escoba, 12, -25), 'matera': (arma_matera, 16, -25)}


def armas(salida, claves=None):
    for clave, (fn, elev, azim) in ARMAS.items():
        if claves and clave not in claves:
            continue
        nueva_escena()
        scene = bpy.context.scene
        coll = clay.collection(f'Arma {clave}')
        fn(coll)
        preparar(scene, 300 if not RAPIDO else 150, 300 if not RAPIDO else 150, 24 if RAPIDO else 128, transparente=True)
        cam = estudio_ficha(coll, elev, azim)
        encuadrar([o for o in coll.objects], cam, 1.12)
        scene.render.filepath = os.path.join(salida, f'a_{clave}.png')
        bpy.ops.render.render(write_still=True)


def a_webp(salida):
    """Pasa los PNG a webp en public/modelos/clue/ (el tablero sin transparencia; las fichas con ella)."""
    from PIL import Image
    destino = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'juego', 'web', 'public', 'modelos', 'clue')
    os.makedirs(destino, exist_ok=True)
    for f in sorted(os.listdir(salida)):
        if not f.endswith('.png') or not (f == 'tablero.png' or f.startswith(('s_', 'a_'))):
            continue
        im = Image.open(os.path.join(salida, f))
        if f == 'tablero.png':
            im.convert('RGB').save(os.path.join(destino, 'tablero.webp'), 'WEBP', quality=84, method=6)
        else:
            im = im.crop(im.getbbox()) if im.mode == 'RGBA' and im.getbbox() else im
            im.save(os.path.join(destino, f[:-4] + '.webp'), 'WEBP', quality=88, method=6)
        print('webp', f)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--' in sys.argv:
        args = [a for a in sys.argv[sys.argv.index('--') + 1:] if not a.startswith('--')]
    salida = os.path.abspath(args[0] if args else 'modelos-crudos/clue')
    partes = args[1:] or ['tablero', 'sospechosos', 'armas']
    os.makedirs(salida, exist_ok=True)
    for p in partes:
        nombre, _, cuales = p.partition(':')
        cuales = cuales.split(',') if cuales else None
        if nombre == 'tablero':
            tablero(salida)
        elif nombre == 'sospechosos':
            sospechosos(salida, cuales)
        elif nombre == 'armas':
            armas(salida, cuales)
    if not RAPIDO:
        a_webp(salida)
