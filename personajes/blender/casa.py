"""Nuestro Hogar: la casa de Él y Ella en cuatro cuartos tipo diorama (sala, cocina, baño y cuarto).

Mismo lenguaje de plastilina que las tiendas: piso con baldosas o tablas, dos paredes (fondo e izquierda),
muros bajos al frente y a la derecha, muebles redondeados y telas con pelusa.
Cada cuarto guarda sus puntos de acción (dónde se sientan, comen, se bañan, duermen...) y los sitios
donde va la decoración que se compra en el juego.

Coordenadas: x a la derecha, y hacia el fondo, z arriba. Todo lo que mira a la cámara mira hacia -y.
"""
import math
import os
import sys

import bpy

import clay
import escena
import productos as prod
import tiendas
import utileria
from tiendas import _group, _mat

M = clay.material

# Tamaño de cada cuarto (m). Los personajes van a la misma escala que en las tiendas (0.68).
W, D, ALTO = 5.4, 4.2, 3.0
IZQ = math.pi / 2  # rotación para lo que va contra la pared izquierda (mira hacia +x)

CUARTOS = {
    'sala': dict(nombre='Sala', piso=('tablas', '#E2B98E', '#D8AD80', 0.9, '#C89A6E'), pared='#F6D8C0', muro='#E9C9AE'),
    'cocina': dict(nombre='Cocina', piso=('ajedrez', '#F7F3EA', '#BFE6D8', 2.4), pared='#D9EFE4', muro='#C4E2D4'),
    'bano': dict(nombre='Baño', piso=('baldosa', '#DCEFF7', '#CFE6F1', 1.6, '#FFFFFF'), pared='#CFE6F4', muro='#B9D9EC'),
    'cuarto': dict(nombre='Cuarto', piso=('tablas', '#D7B08A', '#CCA37C', 0.9, '#B98C63'), pared='#EBDDF3', muro='#DCC8EA'),
}


def tela(nombre, color):
    return _mat(f'Tela | {nombre}', color, rough=0.95, fuzz=dict(scale=160, color=color, amount=0.35, strength=0.3, distance=0.002))


def madera(nombre='madera clara', color='#D9A876'):
    return _mat(f'Madera | {nombre}', color, rough=0.6, wave=dict(scale=3.0, strength=0.15, axis='X', distortion=4.0))


def laca(nombre, color, rough=0.35):
    return _mat(f'Laca | {nombre}', color, rough=rough, coat=0.3, coat_rough=0.15)


def porcelana():
    return _mat('Porcelana', '#FBFBF8', rough=0.12, coat=0.6, coat_rough=0.05)


def luz(nombre, color='#FFF1D6', fuerza=3.0):
    return _mat(f'Luz | {nombre}', color, rough=0.9, emission=color, emission_strength=fuerza)


def tablas_material(name, c1, c2, scale=0.9, mortar='#C89A6E'):
    """Piso de tablas: ladrillos alargados y trabados (la textura de ladrillo de Blender)."""
    m = tiendas.tile_material(name, c1, c2, scale, mortar)
    tex = next(n for n in m.node_tree.nodes if n.type == 'TEX_BRICK')
    tex.offset = 0.5
    tex.inputs['Brick Width'].default_value = 1.0
    tex.inputs['Row Height'].default_value = 0.22
    return m


def piso(spec):
    if spec[0] == 'tablas':
        return tablas_material(f'Piso | tablas {spec[1]}', spec[1], spec[2], spec[3], spec[4])
    return tiendas._floor(spec)


# ---------------------------------------------------------------------------
# Sala
# ---------------------------------------------------------------------------

def sofa(coll, color='#E88C7D', cojines='#F7D774'):
    t = tela(f'sofá {color}', color)
    c = tela(f'cojín {cojines}', cojines)
    pata = madera('patas', '#8A5A3B')
    clay.rbox('base sofá', (0, 0, 0.3), (1.2, 0.45, 0.18), coll, t, p=5, n=6)
    clay.rbox('espaldar sofá', (0, 0.33, 0.72), (1.2, 0.14, 0.34), coll, t, p=5, n=6)
    for s in (-1, 1):
        clay.rbox('brazo sofá', (s * 1.12, 0, 0.52), (0.14, 0.45, 0.26), coll, t, p=5, n=6)
        clay.rbox('cojín asiento', (s * 0.5, -0.06, 0.56), (0.5, 0.38, 0.09), coll, t, p=4, n=6)
        clay.blob('cojín espalda', (s * 0.5, 0.2, 0.85), (0.44, 0.1, 0.24), coll, t, n=8, p=3.2)
        for sy in (-1, 1):
            clay.lathe('pata sofá', [(0.05, 0.0), (0.045, 0.12), (0.04, 0.13)], coll, pata, segments=12)
            coll.objects[-1].location = (s * 1.15, sy * 0.38, 0)
    # Cojín decorativo (el que se puede cambiar con la decoración)
    clay.blob('cojín decorativo', (-0.75, 0.12, 0.78), (0.2, 0.08, 0.2), coll, c, n=8, p=3.0)


def mesa_centro(coll):
    mad = madera()
    clay.rbox('tabla mesa centro', (0, 0, 0.4), (0.55, 0.32, 0.035), coll, mad, p=6, n=5)
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.sweep('pata mesa', [(sx * 0.46, sy * 0.24, 0.0), (sx * 0.47, sy * 0.25, 0.38)], 0.03, (1, 1), coll, mad, segments=8, samples=2)
    clay.rbox('libro', (-0.2, 0.05, 0.46), (0.16, 0.11, 0.025), coll, laca('libro azul', '#7FA8D9'), p=6, n=4)
    clay.rbox('libro 2', (-0.18, 0.04, 0.505), (0.13, 0.09, 0.02), coll, laca('libro rosa', '#F2A5B8'), p=6, n=4)
    clay.lathe('pocillo', [(0.0, 0.44), (0.05, 0.44), (0.055, 0.52), (0.05, 0.53), (0.0, 0.52)], coll, laca('pocillo', '#F7D774'), segments=16)
    coll.objects[-1].location = (0.25, -0.05, 0)


def televisor(coll):
    mueble = madera('mueble tv', '#B98559')
    clay.rbox('mueble tv', (0, 0, 0.28), (0.8, 0.25, 0.26), coll, mueble, p=6, n=5)
    for s in (-1, 1):
        clay.rbox('puerta mueble', (s * 0.4, -0.25, 0.28), (0.36, 0.01, 0.2), coll, madera('puerta mueble', '#C9956A'), p=6, n=4)
        clay.blob('perilla', (s * 0.1, -0.27, 0.28), (0.025, 0.02, 0.025), coll, laca('perilla', '#F2E6C9'), n=5)
    clay.rbox('base tv', (0, 0, 0.58), (0.18, 0.1, 0.03), coll, laca('negro tv', '#2B2A2A'), p=6, n=4)
    clay.rbox('marco tv', (0, 0, 1.0), (0.66, 0.05, 0.38), coll, laca('negro tv', '#2B2A2A'), p=8, n=5)
    clay.rbox('pantalla tv', (0, -0.05, 1.0), (0.6, 0.01, 0.32), coll, luz('pantalla', '#8FC7E8', 1.2), p=8, n=4)


def lampara_pie(coll, color='#F7E3B5'):
    base = laca('lámpara metal', '#C9A15C', 0.3)
    clay.lathe('base lámpara', [(0.0, 0.0), (0.18, 0.0), (0.18, 0.04), (0.04, 0.06), (0.0, 0.06)], coll, base, segments=24)
    clay.sweep('vara lámpara', [(0, 0, 0.05), (0, 0, 1.45)], 0.02, (1, 1), coll, base, segments=8, samples=2)
    clay.lathe('pantalla lámpara', [(0.26, 1.35), (0.16, 1.7), (0.15, 1.71)], coll, tela('pantalla', color), segments=28, cap_bottom=False,
               cap_top=False)
    clay.blob('bombillo', (0, 0, 1.45), (0.07, 0.07, 0.08), coll, luz('bombillo'), n=6)


def cortina(coll, ancho, alto, color):
    """Cortina de tela con tres pliegues anchos que se abren un poco abajo."""
    t = tela(f'cortina {color}', color)
    n = 3
    for k in range(n):
        x = -ancho / 2 + (k + 0.5) * ancho / n
        clay.sweep('pliegue cortina', [(x, 0, alto), (x * 1.05, -0.02, alto * 0.5), (x * 1.15, -0.03, 0.0)], ancho / n * 0.6,
                   (1.0, 0.35), coll, t, segments=10, samples=5, caps=('flat', 'round'))
    clay.sweep('barra cortina', [(-ancho / 2 - 0.1, 0.03, alto + 0.06), (ancho / 2 + 0.1, 0.03, alto + 0.06)], 0.02, (1, 1), coll,
               laca('barra', '#C9A15C'), segments=8, samples=2)


def ventana_con_cortinas(coll, x, y, z, w, h, color, on_left=False):
    tiendas.window(coll, x, y, z, w, h, on_left=on_left)

    def build():
        for s in (-1, 1):
            def uno(s=s):
                cortina(coll, w * 0.32, h + 0.25, color)
            g = _group(coll, 'cortina', (s * (w / 2 + 0.05), -0.08, z - h / 2 - 0.2), 0.0, uno)
            del g
    _group(coll, 'cortinas', (x + (0.02 if on_left else 0), y, 0), IZQ if on_left else 0.0, build)


# ---------------------------------------------------------------------------
# Cocina
# ---------------------------------------------------------------------------

def meson(coll, largo=3.2):
    gab = laca('gabinete', '#FFFFFF', 0.45)
    top = _mat('Mesón mármol', '#F4EFE8', rough=0.25, coat=0.4, coat_rough=0.1, noise=dict(scale=8, strength=0.05, distance=0.01))
    manija = laca('manija', '#C9A15C', 0.3)
    clay.rbox('gabinetes', (0, 0, 0.45), (largo / 2, 0.3, 0.43), coll, gab, p=8, n=5)
    n = int(largo / 0.8)
    for k in range(n):
        x = -largo / 2 + (k + 0.5) * largo / n
        clay.rbox('puerta gabinete', (x, -0.3, 0.42), (largo / n / 2 - 0.04, 0.012, 0.34), coll, laca('puerta gabinete', '#F3F0EA', 0.45), p=8, n=4)
        clay.sweep('manija gabinete', [(x - 0.08, -0.33, 0.7), (x + 0.08, -0.33, 0.7)], 0.012, (1, 1), coll, manija, segments=6, samples=2)
    clay.rbox('mesón', (0, 0, 0.9), (largo / 2 + 0.03, 0.33, 0.035), coll, top, p=8, n=5)
    # Estufa de cuatro fogones y horno
    xs = -largo / 2 + 0.55
    clay.rbox('estufa', (xs, -0.02, 0.94), (0.36, 0.28, 0.015), coll, laca('estufa', '#2E2D2D', 0.3), p=8, n=4)
    for dx in (-0.16, 0.16):
        for dy in (-0.12, 0.12):
            clay.sweep('fogón', [(xs + dx + 0.07 * math.cos(a), dy - 0.02 + 0.07 * math.sin(a), 0.96) for a in
                                 [i * math.pi / 6 for i in range(12)]], 0.012, (1, 1), coll, laca('fogón', '#8A8A8A', 0.4), segments=6,
                        samples=3, closed=True)
    clay.rbox('puerta horno', (xs, -0.31, 0.45), (0.32, 0.015, 0.3), coll, laca('horno', '#3A3939', 0.3), p=8, n=4)
    clay.rbox('vidrio horno', (xs, -0.33, 0.48), (0.22, 0.008, 0.15), coll, luz('horno', '#F2A65A', 0.8), p=8, n=4)
    # Lavaplatos con grifo
    xl = largo / 2 - 0.8
    clay.rbox('lavaplatos', (xl, -0.02, 0.9), (0.3, 0.22, 0.05), coll, laca('acero', '#C9CCD1', 0.25), p=8, n=4)
    clay.sweep('grifo', [(xl, 0.2, 0.93), (xl, 0.2, 1.18), (xl, 0.08, 1.22), (xl, 0.02, 1.12)], 0.02, (1, 1), coll,
               laca('acero', '#C9CCD1', 0.25), segments=8, samples=5)
    # Alacena de arriba
    clay.rbox('alacena', (0.35, 0.12, 1.95), (largo / 2 - 0.45, 0.2, 0.38), coll, laca('alacena', '#F7F3EA', 0.45), p=8, n=5)
    for k in range(3):
        x = 0.35 - (largo / 2 - 0.45) + (k + 0.5) * (largo - 0.9) / 3
        clay.sweep('manija alacena', [(x, -0.1, 1.72), (x, -0.1, 1.84)], 0.012, (1, 1), coll, manija, segments=6, samples=2)
    # Frascos y una matica en el mesón
    for k, col in enumerate(('#F2A65A', '#E88C7D', '#9ED9C0')):
        clay.lathe('frasco', [(0.0, 0.92), (0.06, 0.92), (0.065, 1.1), (0.04, 1.14), (0.0, 1.14)], coll, laca(f'frasco {col}', col, 0.2),
                   segments=14)
        coll.objects[-1].location = (0.1 + k * 0.16, 0.18, 0)


def nevera(coll, color='#A9D8C8'):
    cuerpo = laca(f'nevera {color}', color, 0.3)
    clay.rbox('nevera', (0, 0, 0.98), (0.45, 0.38, 0.97), coll, cuerpo, p=8, n=6)
    clay.rbox('línea nevera', (0, -0.385, 1.3), (0.43, 0.006, 0.012), coll, laca('línea', '#7FB9A6', 0.3), p=6, n=3)
    for z0, z1 in ((1.4, 1.7), (0.55, 1.15)):
        clay.sweep('manija nevera', [(0.34, -0.42, z0), (0.34, -0.42, z1)], 0.022, (1, 1), coll, laca('manija', '#F7F3EA', 0.3), segments=8,
                   samples=2)
    # Imanes de colores (las notas del juego se pegan aquí)
    for k, (x, z, col) in enumerate(((-0.25, 1.8, '#F2A65A'), (-0.05, 1.62, '#E5566A'), (0.12, 1.85, '#7FA8D9'))):
        clay.blob('imán', (x, -0.4, z), (0.035, 0.02, 0.035), coll, laca(f'imán {col}', col, 0.3), n=5)


def silla(coll, color='#F2A5B8'):
    mad = madera('silla', '#D9A876')
    clay.rbox('asiento silla', (0, 0, 0.46), (0.22, 0.22, 0.04), coll, tela(f'asiento {color}', color), p=5, n=5)
    clay.rbox('espaldar silla', (0, 0.2, 0.8), (0.2, 0.03, 0.2), coll, mad, p=6, n=5)
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.sweep('pata silla', [(sx * 0.17, sy * 0.17, 0.0), (sx * 0.17, sy * 0.17, 0.44)], 0.022, (1, 1), coll, mad, segments=6, samples=2)
        clay.sweep('palo espaldar', [(sx * 0.17, 0.2, 0.44), (sx * 0.17, 0.2, 0.62)], 0.02, (1, 1), coll, mad, segments=6, samples=2)


def mesa_comedor(coll):
    mad = madera()
    clay.lathe('tabla comedor', [(0.0, 0.7), (0.62, 0.7), (0.64, 0.72), (0.62, 0.75), (0.0, 0.75)], coll, mad, segments=40)
    clay.lathe('pedestal comedor', [(0.3, 0.0), (0.32, 0.03), (0.1, 0.08), (0.07, 0.4), (0.12, 0.7)], coll, mad, segments=24, cap_top=False)
    # Frutero con frutas del súper
    clay.lathe('frutero', [(0.0, 0.76), (0.1, 0.76), (0.2, 0.84), (0.21, 0.86)], coll, laca('frutero', '#F7D774', 0.3), segments=24,
               cap_top=False)
    for k, (n, dx, dy) in enumerate((('manzana', -0.06, 0.02), ('naranja', 0.07, 0.03), ('banano', 0.0, -0.05))):
        prod.instance(n, (dx, dy, 0.8), 0.4 * k, 0.8, coll)


# ---------------------------------------------------------------------------
# Baño
# ---------------------------------------------------------------------------

def tina(coll):
    p = porcelana()
    clay.rbox('tina', (0, 0, 0.36), (0.95, 0.52, 0.3), coll, p, p=5, n=7)
    clay.rbox('agua tina', (0, 0, 0.6), (0.85, 0.42, 0.02), coll, _mat('Agua jabonosa', '#BDE4F4', rough=0.1, coat=0.8, coat_rough=0.05),
              p=6, n=6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.blob('pata tina', (sx * 0.78, sy * 0.38, 0.05), (0.07, 0.07, 0.07), coll, laca('patas tina', '#C9A15C', 0.3), n=6)
    clay.sweep('grifo tina', [(0.9, 0.25, 0.62), (0.9, 0.25, 0.85), (0.8, 0.25, 0.9)], 0.025, (1, 1), coll, laca('acero', '#C9CCD1', 0.25),
               segments=8, samples=4)
    # Espuma en el borde y un patito
    for k in range(7):
        a = k / 7 * math.tau
        clay.blob('espuma', (0.72 * math.cos(a) * 0.95, 0.35 * math.sin(a), 0.63), (0.1, 0.08, 0.06), coll,
                  _mat('Espuma', '#FFFFFF', rough=0.7), n=6)
    patito(coll, (-0.55, -0.43, 0.68))


def patito(coll, pos):
    am = laca('patito', '#FFD84A', 0.35)
    x, y, z = pos
    clay.blob('patito cuerpo', (x, y, z + 0.05), (0.09, 0.07, 0.06), coll, am, n=7)
    clay.blob('patito cabeza', (x + 0.05, y - 0.01, z + 0.13), (0.045, 0.045, 0.045), coll, am, n=7)
    clay.blob('patito pico', (x + 0.1, y - 0.02, z + 0.12), (0.03, 0.02, 0.012), coll, laca('pico', '#F28C28', 0.35), n=5)


def lavamanos(coll):
    p = porcelana()
    clay.lathe('pedestal lavamanos', [(0.14, 0.0), (0.1, 0.1), (0.08, 0.6), (0.12, 0.72)], coll, p, segments=24, cap_top=False)
    clay.blob('poceta', (0, 0, 0.8), (0.34, 0.26, 0.1), coll, p, n=8, p=3.0)
    clay.sweep('grifo lavamanos', [(0, 0.2, 0.86), (0, 0.2, 0.98), (0, 0.1, 1.0)], 0.018, (1, 1), coll, laca('acero', '#C9CCD1', 0.25),
               segments=8, samples=4)
    # Espejo redondeado con marco
    clay.rbox('marco espejo', (0, 0.26, 1.55), (0.34, 0.03, 0.42), coll, laca('marco espejo', '#F2A5B8', 0.35), p=4, n=6)
    clay.rbox('espejo', (0, 0.23, 1.55), (0.29, 0.01, 0.37), coll, _mat('Espejo', '#DDEAF2', rough=0.05, metallic=0.9), p=4, n=6)
    clay.rbox('jabonera', (0.22, 0.12, 0.9), (0.06, 0.04, 0.02), coll, laca('jabón', '#9ED9C0', 0.3), p=5, n=4)


def inodoro(coll):
    p = porcelana()
    clay.lathe('base inodoro', [(0.13, 0.0), (0.12, 0.2), (0.2, 0.38), (0.0, 0.4)], coll, p, segments=24)
    clay.blob('taza', (0, -0.05, 0.4), (0.22, 0.26, 0.05), coll, p, n=8)
    clay.rbox('tanque', (0, 0.22, 0.62), (0.22, 0.1, 0.22), coll, p, p=6, n=5)
    clay.blob('botón', (0, 0.22, 0.85), (0.04, 0.04, 0.015), coll, laca('acero', '#C9CCD1', 0.25), n=5)


def toallero(coll, colores=('#F2A5B8', '#9ED9C0')):
    clay.sweep('barra toallero', [(-0.5, 0.0, 1.3), (0.5, 0.0, 1.3)], 0.02, (1, 1), coll, laca('acero', '#C9CCD1', 0.25), segments=8, samples=2)
    for k, col in enumerate(colores):
        clay.rbox('toalla', (-0.22 + k * 0.45, -0.03, 1.02), (0.18, 0.025, 0.3), coll, tela(f'toalla {col}', col), p=4, n=6)


# ---------------------------------------------------------------------------
# Cuarto
# ---------------------------------------------------------------------------

def cama(coll, cobija='#C9B6EA', cabecera='#F2A5B8'):
    mad = madera('cama', '#C9956A')
    clay.rbox('base cama', (0, 0, 0.22), (1.12, 1.18, 0.16), coll, mad, p=6, n=6)
    clay.rbox('colchón', (0, -0.02, 0.45), (1.07, 1.12, 0.12), coll, tela('colchón', '#FBF8F2'), p=5, n=6)
    clay.rbox('cobija', (0, -0.38, 0.55), (1.1, 0.78, 0.06), coll, tela(f'cobija {cobija}', cobija), p=4, n=7)
    clay.rbox('doblez cobija', (0, 0.36, 0.59), (1.08, 0.08, 0.05), coll, tela('sábana', '#FFFFFF'), p=4, n=6)
    for s in (-1, 1):
        clay.blob('almohada', (s * 0.5, 0.8, 0.66), (0.4, 0.2, 0.1), coll, tela('almohada', '#FFFFFF'), n=8, p=3.0)
    clay.rbox('cabecera', (0, 1.2, 0.8), (1.15, 0.07, 0.55), coll, tela(f'cabecera {cabecera}', cabecera), p=4, n=7)
    for k in range(5):
        clay.blob('botón cabecera', (-0.8 + k * 0.4, 1.12, 0.95), (0.03, 0.02, 0.03), coll, tela('botón', '#E88C9C'), n=5)


def mesita(coll, lampara=True):
    mad = madera('mesita', '#C9956A')
    clay.rbox('mesita', (0, 0, 0.28), (0.26, 0.22, 0.27), coll, mad, p=6, n=5)
    clay.rbox('cajón mesita', (0, -0.22, 0.38), (0.21, 0.01, 0.08), coll, madera('cajón', '#D9A876'), p=6, n=4)
    clay.blob('perilla mesita', (0, -0.24, 0.38), (0.025, 0.02, 0.025), coll, laca('perilla', '#F2E6C9'), n=5)
    if lampara:
        clay.lathe('base lamparita', [(0.0, 0.55), (0.09, 0.55), (0.06, 0.62), (0.03, 0.8), (0.0, 0.8)], coll, laca('lamparita', '#9ED9C0', 0.3),
                   segments=18)
        clay.lathe('pantalla lamparita', [(0.16, 0.78), (0.1, 0.98), (0.09, 0.99)], coll, tela('pantalla lamparita', '#FFF1D6'), segments=20,
                   cap_bottom=False, cap_top=False)
        clay.blob('bombillo lamparita', (0, 0, 0.84), (0.04, 0.04, 0.04), coll, luz('lamparita'), n=5)


def closet(coll):
    """Clóset de madera con dos puertas de rombos, cajones abajo y una caja de sombreros encima."""
    mad = madera('clóset', '#C9956A')
    clara = madera('puerta clóset', '#D9A876')
    clay.rbox('clóset', (0, 0, 0.95), (0.7, 0.3, 0.92), coll, mad, p=10, n=5)
    for s in (-1, 1):
        clay.rbox('puerta clóset', (s * 0.345, -0.3, 1.15), (0.32, 0.015, 0.62), coll, clara, p=10, n=4)
        clay.rbox('rombo puerta', (s * 0.345, -0.318, 1.15), (0.16, 0.006, 0.32), coll, laca('rombo', '#F2E6C9', 0.5), p=1.2, n=4)
        clay.sweep('manija clóset', [(s * 0.06, -0.34, 1.05), (s * 0.06, -0.34, 1.3)], 0.015, (1, 1), coll, laca('manija', '#C9A15C', 0.3),
                   segments=6, samples=2)
        clay.rbox('cajón clóset', (s * 0.345, -0.3, 0.3), (0.32, 0.015, 0.18), coll, clara, p=10, n=4)
        clay.blob('perilla cajón', (s * 0.345, -0.33, 0.3), (0.03, 0.02, 0.03), coll, laca('perilla', '#F2E6C9'), n=5)
    clay.rbox('caja sombreros', (-0.3, 0.0, 1.97), (0.22, 0.18, 0.1), coll, laca('caja rosa', '#F2A5B8', 0.5), p=5, n=5)
    clay.rbox('caja sombreros 2', (0.25, 0.02, 1.95), (0.18, 0.15, 0.08), coll, laca('caja menta', '#9ED9C0', 0.5), p=5, n=5)


# ---------------------------------------------------------------------------
# Cuartos completos
# ---------------------------------------------------------------------------

def _cascaron(coll, key):
    """Piso, paredes más planas que las de las tiendas (el cuarto es chico) y muros bajos."""
    c = CUARTOS[key]
    floor = clay.make_mesh_object('piso', [(-W / 2, -D / 2, 0), (W / 2, -D / 2, 0), (W / 2, D / 2, 0), (-W / 2, D / 2, 0)], [(0, 1, 2, 3)], coll,
                                  smooth=False, material=piso(c['piso']))
    clay.add_solidify(floor, 0.15, -1.0)
    pared = M(f'Pared | {c["pared"]}', c['pared'], rough=0.9, noise=dict(scale=5, strength=0.04, distance=0.04))
    borde = M('Zócalo casa', '#FBF7F1', rough=0.5)
    clay.rbox('pared fondo', (0, D / 2 + 0.1, ALTO / 2), (W / 2 + 0.2, 0.1, ALTO / 2), coll, pared, p=24, n=4, subsurf=1)
    clay.rbox('pared izquierda', (-W / 2 - 0.1, 0, ALTO / 2), (0.1, D / 2 + 0.2, ALTO / 2), coll, pared, p=24, n=4, subsurf=1)
    for nombre, cen, half in (('zócalo fondo', (0, D / 2 - 0.02, 0.08), (W / 2, 0.03, 0.08)),
                              ('zócalo izquierdo', (-W / 2 + 0.02, 0, 0.08), (0.03, D / 2, 0.08)),
                              ('cornisa fondo', (0, D / 2 - 0.02, ALTO - 0.06), (W / 2, 0.05, 0.06)),
                              ('cornisa izquierda', (-W / 2 + 0.02, 0, ALTO - 0.06), (0.05, D / 2, 0.06))):
        clay.rbox(nombre, cen, half, coll, borde, p=12, n=4)
    muro = M(f'Muro bajo | {c["muro"]}', c['muro'], rough=0.8)
    clay.rbox('muro bajo frente', (0, -D / 2 - 0.1, 0.18), (W / 2 + 0.2, 0.1, 0.18), coll, muro, p=16, n=4)
    clay.rbox('muro bajo derecha', (W / 2 + 0.1, 0, 0.18), (0.1, D / 2 + 0.2, 0.18), coll, muro, p=16, n=4)


def puerta_interior(coll, x, color='#F2E6C9'):
    tiendas.door(coll, x, D / 2, 1.0, 2.1, color)


def _poner(coll, nombre, fn, x, y, rot=0.0):
    return _group(coll, nombre, (x, y, 0), rot, lambda: fn(coll))


def repisa_libros(coll):
    mad = madera('repisa', '#C9956A')
    colores = ('#7FA8D9', '#F2A5B8', '#9ED9C0', '#F7D774', '#E88C7D', '#C9B6EA')
    for z in (1.2, 1.7):
        clay.rbox('repisa', (0, 0, z), (0.6, 0.14, 0.025), coll, mad, p=8, n=4)
        x = -0.52
        for k in range(7):
            ancho = 0.05 + 0.02 * ((k * 7 + int(z * 10)) % 3)
            alto = 0.16 + 0.05 * ((k * 5 + int(z * 10)) % 3)
            clay.rbox('libro repisa', (x + ancho, -0.01, z + 0.025 + alto / 2), (ancho, 0.1, alto / 2), coll,
                      laca(f'libro {colores[(k + int(z * 10)) % 6]}', colores[(k + int(z * 10)) % 6], 0.5), p=8, n=4)
            x += ancho * 2 + 0.02
    clay.lathe('matica repisa', [(0.0, 1.73), (0.06, 1.73), (0.07, 1.84), (0.0, 1.84)], coll, laca('matera repisa', '#E88C7D', 0.4), segments=16)
    coll.objects[-1].location = (0.45, -0.02, 0)
    for k in range(5):
        a = k / 5 * math.tau
        clay.blob('hoja repisa', (0.45 + 0.07 * math.cos(a), -0.02 + 0.05 * math.sin(a), 1.9), (0.05, 0.03, 0.08), coll,
                  _mat('Hoja', '#6FBF8F', rough=0.6), n=5)


def repisa_banio(coll):
    mad = madera('repisa baño', '#F2E6C9')
    clay.rbox('repisa baño', (0, 0, 1.3), (0.45, 0.12, 0.025), coll, mad, p=8, n=4)
    for k, (col, alto) in enumerate((('#F2A5B8', 0.22), ('#9ED9C0', 0.18), ('#F7D774', 0.26), ('#C9B6EA', 0.16))):
        x = -0.33 + k * 0.22
        clay.lathe('frasco baño', [(0.0, 1.33), (0.06, 1.33), (0.065, 1.33 + alto), (0.03, 1.36 + alto), (0.0, 1.36 + alto)], coll,
                   laca(f'frasco baño {col}', col, 0.2), segments=14)
        coll.objects[-1].location = (x, 0, 0)


def sala(coll):
    _cascaron(coll, 'sala')
    ventana_con_cortinas(coll, 0.3, D / 2 - 0.01, 1.75, 2.0, 1.1, '#F7E3B5')
    _poner(coll, 'sofá', sofa, 0.3, D / 2 - 0.55)
    tiendas.rug(coll, '#F2C9A8', 0.3, 0.3, 1.1, 0.72, border='#E8B48C')
    _poner(coll, 'mesa de centro', mesa_centro, 0.3, 0.35)
    _poner(coll, 'televisor', televisor, -W / 2 + 0.3, 0.2, IZQ)
    tiendas.door(coll, -W / 2, -1.3, 1.0, 2.1, '#E88C7D', on_left=True)
    _poner(coll, 'repisa', repisa_libros, -1.8, D / 2 - 0.15)
    tiendas.clock(coll, 2.2, D / 2 - 0.02, 2.6)
    puerta_interior(coll, 2.2)


def cocina(coll):
    _cascaron(coll, 'cocina')
    _poner(coll, 'mesón', lambda c: meson(c, 3.0), -1.1, D / 2 - 0.35)
    _poner(coll, 'nevera', nevera, 1.15, D / 2 - 0.45)
    _poner(coll, 'mesa comedor', mesa_comedor, 0.6, -0.5)
    _poner(coll, 'silla', silla, -0.25, -0.5, IZQ)
    _poner(coll, 'silla', silla, 1.45, -0.5, -IZQ)
    ventana_con_cortinas(coll, -W / 2 + 0.01, -0.4, 1.7, 1.4, 1.0, '#F2A5B8', on_left=True)
    puerta_interior(coll, 2.2)


def bano(coll):
    _cascaron(coll, 'bano')
    _poner(coll, 'tina', tina, 0.55, D / 2 - 0.6)
    _poner(coll, 'lavamanos', lavamanos, -W / 2 + 0.35, 0.1, IZQ)
    _poner(coll, 'inodoro', inodoro, -1.55, D / 2 - 0.35)
    _poner(coll, 'toallero', toallero, -0.5, D / 2 - 0.02)
    _poner(coll, 'repisa baño', repisa_banio, 0.55, D / 2 - 0.12)
    tiendas.rug(coll, '#F2A5B8', 0.55, 0.65, 0.7, 0.35, border='#E88C9C')
    tiendas.rug(coll, '#9ED9C0', -2.1, 0.1, 0.35, 0.5, border='#7FC4AA')
    puerta_interior(coll, 2.25)


def dormitorio(coll):
    _cascaron(coll, 'cuarto')
    _poner(coll, 'cama', cama, 0.1, D / 2 - 1.3)
    _poner(coll, 'mesita', mesita, -1.35, D / 2 - 0.3)
    _poner(coll, 'mesita', mesita, 1.55, D / 2 - 0.3)
    _poner(coll, 'clóset', closet, -W / 2 + 0.35, -0.8, IZQ)
    ventana_con_cortinas(coll, -W / 2 + 0.01, 1.05, 1.75, 1.1, 1.0, '#C9B6EA', on_left=True)
    tiendas.rug(coll, '#DCC8EA', 0.1, -1.05, 1.1, 0.55, border='#C9B6EA')
    puerta_interior(coll, 2.3)


CONSTRUIR = {'sala': sala, 'cocina': cocina, 'bano': bano, 'cuarto': dormitorio}

# Puntos de acción (x, y, rot en grados; rot 0 = mirando a la cámara) y sitios de decoración comprables.
# Un cuarto elemento opcional es el acceso: los pasos (x, y) para llegar sin atravesar el mueble (se sale por los
# mismos pasos al revés). La puerta de cada cuarto es la de su «entrada»: por ahí se sale y se entra al cambiar de cuarto.
PUNTOS = {
    'sala': {
        'entrada': (-2.1, -1.3, 90), 'centro_izq': (-0.6, -0.95, 0), 'centro_der': (0.8, -0.95, 0),
        # Sentados en el cojín (no en el borde): se llega por detrás de la mesa de centro, de lado
        'sofa_izq': (-0.2, 1.45, 0, [(-1.2, 0.88), (-0.2, 0.88)]), 'sofa_der': (0.8, 1.45, 0, [(1.8, 0.88), (0.8, 0.88)]),
        'tv': (-1.3, 0.2, -90),
    },
    'cocina': {
        'entrada': (2.2, 1.35, 0), 'comer_izq': (-0.2, -0.5, 90, [(-0.22, -1.2)]), 'comer_der': (1.4, -0.5, -90, [(1.42, -1.2)]),
        'nevera': (1.15, 1.0, 180), 'estufa': (-1.95, 1.15, 180), 'centro_izq': (-1.9, -0.8, 0), 'centro_der': (-0.6, -1.3, 0),
    },
    'bano': {
        'entrada': (2.25, 1.35, 0), 'tina': (0.55, 1.45, 0, [(0.55, 0.6)]), 'espejo': (-1.75, 0.1, -90), 'inodoro': (-1.55, 1.7, 0, [(-1.55, 0.95)]), 'centro_izq': (-0.9, -0.8, 0),
        'centro_der': (0.5, -0.9, 0),
    },
    'cuarto': {
        'entrada': (2.3, 1.35, 0), 'cama_izq': (-0.4, 0.62, 0, [(-1.42, 0.62)]), 'cama_der': (0.6, 0.62, 0, [(1.62, 0.62)]),
        'centro_izq': (-0.7, -1.3, 0), 'centro_der': (0.7, -1.35, 0), 'closet': (-1.55, -0.8, -90),
    },
}
SITIOS_DECO = {
    'sala': [
        dict(id='sala_cuadro', tipo='cuadro', x=-W / 2 + 0.03, y=1.2, z=1.75, rot=90),
        dict(id='sala_planta', tipo='piso', x=-2.35, y=1.7, z=0, rot=0),
        dict(id='sala_lampara', tipo='piso', x=1.95, y=1.65, z=0, rot=0),
        dict(id='sala_peluche', tipo='peluche', x=1.05, y=1.55, z=0.62, rot=0),
        dict(id='sala_mesa', tipo='mesa', x=0.5, y=0.3, z=0.44, rot=0),
    ],
    'cocina': [
        dict(id='cocina_cuadro', tipo='cuadro', x=-W / 2 + 0.03, y=1.1, z=1.85, rot=90),
        dict(id='cocina_planta', tipo='piso', x=2.35, y=-1.7, z=0, rot=0),
        dict(id='cocina_mesa', tipo='mesa', x=0.35, y=-0.3, z=0.76, rot=0),
    ],
    'bano': [
        dict(id='bano_cuadro', tipo='cuadro', x=-W / 2 + 0.03, y=1.3, z=1.85, rot=90),
        dict(id='bano_planta', tipo='piso', x=-2.35, y=-1.7, z=0, rot=0),
    ],
    'cuarto': [
        dict(id='cuarto_cuadro', tipo='cuadro', x=0.1, y=D / 2 - 0.03, z=2.2, rot=0),
        dict(id='cuarto_peluche', tipo='peluche', x=0.75, y=1.65, z=0.7, rot=0),
        dict(id='cuarto_planta', tipo='piso', x=2.35, y=-1.7, z=0, rot=0),
        dict(id='cuarto_lampara', tipo='piso', x=2.35, y=0.2, z=0, rot=0),
    ],
}
# Dónde se pegan las notas (en la nevera) y dónde aparecen los regalos recibidos
NOTAS = dict(cuarto='cocina', x=1.15, y=D / 2 - 0.84, z=1.35, ancho=0.7, alto=0.9)


def construir(key):
    coll = clay.collection(f'Casa | {key}')
    CONSTRUIR[key](coll)
    return coll


if __name__ == '__main__':
    # Render de revisión de cada cuarto: python3 casa.py carpeta [cuartos] [muestras]
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    out = args[0]
    keys = args[1].split(',') if len(args) > 1 else list(CUARTOS)
    samples = int(args[2]) if len(args) > 2 else 48
    os.makedirs(out, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 1440, 1080, samples)
    prod.build_all()
    tiendas.exclude_sources()
    colls = {key: construir(key) for key in keys}
    luces = clay.collection('Luces casa')
    tiendas.lights(scene, luces, W, D)
    scene.camera = tiendas.camera_for(W, D, 'Cámara casa', aspect=4 / 3, wall_h=ALTO)
    for key in keys:
        for k, c in colls.items():
            c.hide_render = k != key
        scene.render.filepath = os.path.join(out, f'18-casa-{key}.png')
        bpy.ops.render.render(write_still=True)
        print('CUARTO', key, flush=True)
