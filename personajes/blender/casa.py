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
import perro
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
    # Ampliación: se compran (menos el de juegos) y se van sumando a la casa
    'juegos': dict(nombre='Juegos', piso=('tablas', '#E7C9A0', '#DDBB90', 0.9, '#C9A06E'), pared='#DCD6F7', muro='#C7BFEF'),
    'trofeos': dict(nombre='Trofeos', piso=('tablas', '#B98B62', '#AE7F57', 0.9, '#8F6545'), pared='#FBE3C4', muro='#F0CFA2'),
    'cuna': dict(nombre='Bebé', piso=('tablas', '#EBD3AE', '#E2C79F', 0.9, '#CFAE82'), pared='#FFF1D2', muro='#F6DEB0'),
    'cuarto_el': dict(nombre='Cuarto de Él', piso=('tablas', '#C9A27C', '#BF9670', 0.9, '#A57C58'), pared='#D3E5F2', muro='#BBD4E8'),
    'cuarto_ella': dict(nombre='Cuarto de Ella', piso=('tablas', '#E3C4A0', '#D9B893', 0.9, '#C4A07A'), pared='#F8DCE6', muro='#F0C6D5'),
    # Afuera: el patio del perrito (el piso es grama y las paredes son la fachada y la cerca)
    'patio': dict(nombre='Patio', piso=('tablas', '#9BD27A', '#8CC96A', 0.9, '#7FB85F'), pared='#F6D8C0', muro='#E9C9AE'),
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


# ---------------------------------------------------------------------------
# Ampliación: cuarto de juegos, sala de trofeos, cuarto del bebé y el cuarto de cada uno
# ---------------------------------------------------------------------------

def oro():
    return _mat('Oro casa', '#F5C246', rough=0.26, metallic=0.85, coat=0.3, coat_rough=0.1)


def estrella_plana(nombre, c, r, coll, mat, grosor=0.02, adentro=0.46, plano='xz'):
    """Estrella de cinco puntas recortada: de frente a la cámara (plano xz) o acostada (plano xy)."""
    x, y, z = c
    vs = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        rr = r if k % 2 == 0 else r * adentro
        vs.append((x + rr * math.cos(a), y, z + rr * math.sin(a)) if plano == 'xz' else (x + rr * math.cos(a), y + rr * math.sin(a), z))
    vs.append((x, y, z))
    o = clay.make_mesh_object(nombre, vs, [(k, (k + 1) % 10, 10) for k in range(10)], coll, smooth=False, material=mat)
    clay.add_solidify(o, grosor, 0.0)
    return o


def aro_frente(nombre, c, rx, rz, tubo, coll, mat, n=16):
    """Aro de frente a la cámara (marco redondo de un espejo, un cero)."""
    x, y, z = c
    pts = [(x + rx * math.cos(a), y, z + rz * math.sin(a)) for a in [k * math.tau / n for k in range(n)]]
    return clay.sweep(nombre, pts, tubo, (1, 1), coll, mat, segments=8, samples=3, closed=True, up=(0, 1, 0))


def puf(coll, color='#F2A5B8'):
    """Puf de tela (se sientan en él como en una silla)."""
    t = tela(f'puf {color}', color)
    clay.blob('puf', (0, 0, 0.2), (0.3, 0.3, 0.21), coll, t, n=10, p=2.4)
    clay.blob('cojín puf', (0, 0, 0.4), (0.24, 0.24, 0.07), coll, t, n=8, p=2.2)
    clay.blob('botón puf', (0, 0, 0.47), (0.03, 0.03, 0.012), coll, tela(f'botón puf {color}', '#FFFFFF'), n=5)


def sillon(coll, color='#9FC2E8', cojin='#F7D774'):
    """Sillón de una persona con las mismas alturas del sofá de la sala (se sientan igual)."""
    t = tela(f'sillón {color}', color)
    pata = madera('patas', '#8A5A3B')
    clay.rbox('base sillón', (0, 0, 0.3), (0.52, 0.45, 0.18), coll, t, p=5, n=6)
    clay.rbox('espaldar sillón', (0, 0.33, 0.72), (0.52, 0.14, 0.34), coll, t, p=5, n=6)
    for s in (-1, 1):
        clay.rbox('brazo sillón', (s * 0.46, 0, 0.52), (0.13, 0.45, 0.26), coll, t, p=5, n=6)
        for sy in (-1, 1):
            clay.lathe('pata sillón', [(0.05, 0.0), (0.045, 0.12), (0.04, 0.13)], coll, pata, segments=12).location = (s * 0.45, sy * 0.38, 0)
    clay.rbox('cojín sillón', (0, -0.06, 0.56), (0.36, 0.38, 0.09), coll, t, p=4, n=6)
    clay.blob('cojín espalda sillón', (0, 0.2, 0.85), (0.32, 0.1, 0.24), coll, t, n=8, p=3.2)
    clay.blob('cojín decorativo', (0.2, 0.12, 0.78), (0.16, 0.07, 0.16), coll, tela(f'cojín {cojin}', cojin), n=8, p=3.0)


# ----- Cuarto de juegos -----

def arcade(coll):
    """Máquina de arcade de Súper Manía: mueble coral, pantalla prendida, palanca y botones."""
    coral = laca('arcade', '#E4574B', 0.35)
    oscuro = laca('arcade oscuro', '#2E2A4F', 0.4)
    amarillo = laca('arcade amarillo', '#F7D774', 0.35)
    for s in (-1, 1):
        clay.rbox('lado arcade', (s * 0.39, 0, 0.96), (0.04, 0.36, 0.96), coll, coral, p=8, n=5)
    clay.rbox('cuerpo arcade', (0, 0.06, 0.95), (0.36, 0.3, 0.94), coll, oscuro, p=8, n=5)
    clay.rbox('frente arcade', (0, -0.29, 0.42), (0.36, 0.05, 0.4), coll, amarillo, p=8, n=5)
    for s in (-1, 1):
        clay.rbox('ranura moneda', (s * 0.12, -0.35, 0.52), (0.05, 0.012, 0.07), coll, laca('ranura', '#C9A15C', 0.3), p=6, n=4)
        clay.rbox('luz moneda', (s * 0.12, -0.35, 0.38), (0.03, 0.012, 0.015), coll, luz('moneda', '#FF6B5A', 2.5), p=6, n=3)
    # Tablero con palanca y botones
    clay.rbox('tablero arcade', (0, -0.4, 0.88), (0.4, 0.15, 0.04), coll, coral, p=8, n=5)
    clay.sweep('palanca', [(-0.18, -0.43, 0.9), (-0.18, -0.43, 1.02)], 0.012, (1, 1), coll, oscuro, segments=6, samples=2)
    clay.blob('bola palanca', (-0.18, -0.43, 1.04), (0.035, 0.035, 0.035), coll, laca('bola palanca', '#E4574B', 0.25), n=6)
    for k, col in enumerate(('#F7C948', '#4A90D9', '#4FB477')):
        clay.blob('botón arcade', (0.02 + k * 0.1, -0.44, 0.925), (0.03, 0.03, 0.014), coll, laca(f'botón {col}', col, 0.25), n=6)
    # Pantalla (el juego le pinta el Súper encima) con su marco
    clay.rbox('marco pantalla arcade', (0, -0.24, 1.36), (0.33, 0.02, 0.28), coll, laca('negro arcade', '#1E1B33', 0.3), p=8, n=4)
    clay.rbox('pantalla arcade', (0, -0.26, 1.36), (0.28, 0.01, 0.23), coll, luz('pantalla arcade', '#8FD3E8', 1.2), p=8, n=4)
    # Marquesina iluminada con una estrella
    clay.rbox('marquesina', (0, -0.18, 1.8), (0.38, 0.12, 0.11), coll, luz('marquesina', '#FF9BB8', 1.6), p=8, n=5)
    estrella_plana('estrella marquesina', (0, -0.31, 1.8), 0.08, coll, luz('estrella', '#FFE38A', 3.0), grosor=0.02)
    for s in (-1, 1):
        clay.blob('bombillo marquesina', (s * 0.26, -0.31, 1.8), (0.03, 0.02, 0.03), coll, luz('bombillo arcade', '#FFF1D6', 4.0), n=5)


def puerta_cien(coll):
    """La puerta 100 de Cien Puertas: marco con bombillitos, puerta morada con el «100» dorado y su perilla."""
    marco = madera('marco cien', '#8A5A3B')
    o = oro()
    for s in (-1, 1):
        clay.rbox('jamba cien', (s * 0.53, 0, 1.02), (0.07, 0.1, 1.02), coll, marco, p=8, n=5)
    clay.rbox('dintel cien', (0, 0, 2.08), (0.6, 0.11, 0.08), coll, marco, p=8, n=5)
    arco = [(0.56 * math.cos(a), -0.02, 2.16 + 0.3 * math.sin(a)) for a in [k * math.pi / 10 for k in range(11)]]
    clay.sweep('arco cien', arco, 0.045, (1, 1), coll, marco, segments=8, samples=4, up=(0, 1, 0))
    for k in range(1, 10, 2):
        a = k * math.pi / 10
        clay.blob('bombillo cien', (0.56 * math.cos(a), -0.08, 2.16 + 0.3 * math.sin(a)), (0.035, 0.035, 0.035), coll,
                  luz('bombillo cien', '#FFE9A8', 4.0), n=5)
    clay.rbox('hoja cien', (0, -0.03, 1.0), (0.46, 0.04, 0.98), coll, laca('puerta cien', '#8E6FD1', 0.4), p=8, n=5)
    claro = laca('tablero cien', '#A98BE3', 0.4)
    clay.rbox('tablero bajo cien', (0, -0.075, 0.5), (0.34, 0.01, 0.3), coll, claro, p=8, n=4)
    clay.rbox('tablero alto cien', (0, -0.075, 1.45), (0.34, 0.01, 0.38), coll, claro, p=8, n=4)
    # «100» en relieve dorado
    y, z, h = -0.1, 1.45, 0.34
    clay.sweep('uno cien', [(-0.27, y, z + 0.08), (-0.2, y, z + h / 2), (-0.2, y, z - h / 2)], 0.028, (1, 1), coll, o, segments=8,
               samples=4, up=(0, 1, 0))
    for dx in (0.0, 0.2):
        aro_frente('cero cien', (dx, y, z), 0.075, h / 2 * 0.95, 0.028, coll, o, n=14)
    clay.blob('perilla cien', (0.34, -0.11, 0.95), (0.045, 0.04, 0.045), coll, o, n=6)
    clay.rbox('ojo cerradura', (0.34, -0.08, 0.84), (0.012, 0.01, 0.025), coll, laca('negro', '#2B2A2A'), p=4, n=3)


def mesa_juegos(coll):
    """Mesa redonda con el parchís servido: las cuatro casas, sus fichas y dos dados."""
    mad = madera('mesa juegos', '#C9956A')
    clay.lathe('tabla mesa juegos', [(0.0, 0.66), (0.6, 0.66), (0.62, 0.68), (0.6, 0.71), (0.0, 0.71)], coll, mad, segments=40)
    clay.lathe('pedestal mesa juegos', [(0.3, 0.0), (0.32, 0.03), (0.1, 0.08), (0.07, 0.4), (0.12, 0.66)], coll, mad, segments=24,
               cap_top=False)
    clay.rbox('tablero parchís', (0, 0, 0.722), (0.3, 0.3, 0.012), coll, laca('tablero', '#FFF6E6', 0.4), p=8, n=4)
    cols = ('#E4574B', '#F7C948', '#4FB477', '#4A90D9')
    for k, (sx, sy) in enumerate(((-1, 1), (1, 1), (1, -1), (-1, -1))):
        clay.rbox('casa parchís', (sx * 0.19, sy * 0.19, 0.736), (0.1, 0.1, 0.004), coll, laca(f'casa {cols[k]}', cols[k], 0.4), p=8, n=4)
        clay.lathe('ficha', [(0.0, 0.74), (0.035, 0.74), (0.03, 0.76), (0.015, 0.79), (0.025, 0.81), (0.0, 0.83)], coll,
                   laca(f'ficha {cols[k]}', cols[k], 0.25), segments=16).location = (sx * 0.19, sy * 0.19, 0)
    for k in range(4):
        a = k * math.pi / 2
        clay.rbox('camino parchís', (0.12 * math.cos(a), 0.12 * math.sin(a), 0.736),
                  (0.04 + 0.05 * abs(math.cos(a)), 0.04 + 0.05 * abs(math.sin(a)), 0.003), coll, laca('camino', '#F2E6C9', 0.4), p=8, n=4)
    clay.rbox('centro parchís', (0, 0, 0.737), (0.06, 0.06, 0.004), coll, laca('centro', '#C9B6EA', 0.4), p=8, n=4)
    utileria._dado(coll, 'mesa uno', (0.44, -0.18, 0.745), (0, 0, 20), 0.07, utileria._mat_reaccion('punto rosa'))
    utileria._dado(coll, 'mesa dos', (0.36, -0.33, 0.745), (0, 0, -15), 0.07, utileria._mat_reaccion('punto turquesa'))


def cohete_retrete(coll):
    """El retrete espacial en miniatura: el inodoro con aletas y fuego, sobre su plataforma de lanzamiento."""
    clay.lathe('plataforma cohete', [(0.0, 0.0), (0.42, 0.0), (0.42, 0.07), (0.36, 0.1), (0.0, 0.1)], coll, laca('plataforma', '#9AA5B1', 0.4),
               segments=32)
    for k in range(6):
        a = k / 6 * math.tau
        clay.blob('humo cohete', (0.3 * math.cos(a), 0.3 * math.sin(a), 0.14), (0.1, 0.1, 0.07), coll, _mat('Humo', '#FFFFFF', rough=0.8), n=6)
    clay.lathe('fuego cohete', [(0.0, 0.1), (0.07, 0.14), (0.13, 0.24), (0.11, 0.3), (0.0, 0.31)], coll, luz('fuego', '#FF9A3C', 3.0),
               segments=20)
    clay.lathe('fuego adentro', [(0.0, 0.16), (0.05, 0.2), (0.08, 0.27), (0.0, 0.33)], coll, luz('fuego amarillo', '#FFE36A', 4.0), segments=16)
    g = _group(coll, 'inodoro cohete', (0, 0, 0.3), 0.0, lambda: inodoro(coll))
    g.scale = (0.72, 0.72, 0.72)
    rojo = laca('aleta', '#E4574B', 0.3)
    for a in (math.pi * 0.25, math.pi * 0.75, math.pi * 1.5):
        clay.blob('aleta', (0.19 * math.cos(a), 0.19 * math.sin(a), 0.42), (0.03 + 0.06 * abs(math.cos(a)), 0.03 + 0.06 * abs(math.sin(a)), 0.14),
                  coll, rojo, n=6)
    clay.sweep('antena', [(0, 0.17, 0.92), (0, 0.17, 1.1)], 0.01, (1, 1), coll, laca('acero', '#C9CCD1', 0.25), segments=6, samples=2)
    estrella_plana('estrella antena', (0, 0.17, 1.14), 0.06, coll, luz('estrella', '#FFE38A', 3.0), grosor=0.015)


def juegos(coll):
    _cascaron(coll, 'juegos')
    _poner(coll, 'arcade', arcade, -1.75, D / 2 - 0.45)
    _poner(coll, 'la puerta 100', puerta_cien, -0.35, D / 2 - 0.12)
    tiendas.rug(coll, '#BFD9F2', 0.55, -0.35, 1.5, 0.85, border='#9FC2E8')
    _poner(coll, 'mesa de juegos', mesa_juegos, 0.55, -0.35)
    _poner(coll, 'puf', lambda c: puf(c, '#F2A5B8'), -0.5, -0.35)
    _poner(coll, 'puf', lambda c: puf(c, '#9ED9C0'), 1.6, -0.35)
    _poner(coll, 'retrete cohete', cohete_retrete, -2.2, 0.4)
    tiendas.garland(coll, (-2.65, D / 2 - 0.06, 2.7), (1.55, D / 2 - 0.06, 2.7), sag=0.3, n=16)
    puerta_interior(coll, 2.2)


# ----- Sala de trofeos -----

def marmol():
    return _mat('Mármol trofeos', '#FFF6EA', rough=0.3, coat=0.4, coat_rough=0.1)


def pedestal(coll, color, emblema):
    """Columna de mármol con cojín de terciopelo; al frente la placa del juego con su emblema."""
    o = oro()
    clay.lathe('pedestal', [(0.0, 0.0), (0.3, 0.0), (0.3, 0.08), (0.24, 0.12), (0.19, 0.2), (0.18, 0.84), (0.23, 0.9), (0.27, 0.96), (0.27, 1.0),
                            (0.0, 1.0)], coll, marmol(), segments=32)
    for z in (0.22, 0.86):
        clay.lathe('aro pedestal', [(0.19, z - 0.02), (0.205, z), (0.19, z + 0.02)], coll, o, segments=32, cap_bottom=False, cap_top=False)
    clay.rbox('cojín pedestal', (0, 0, 1.04), (0.2, 0.2, 0.045), coll, tela('terciopelo', '#C83E4D'), p=4, n=6)
    clay.rbox('placa pedestal', (0, -0.19, 0.58), (0.13, 0.014, 0.12), coll, laca(f'placa {color}', color, 0.3), p=6, n=4)
    y = -0.215
    if emblema == 'super':
        estrella_plana('emblema súper', (0, y, 0.58), 0.08, coll, laca('estrella emblema', '#F7C948', 0.3), grosor=0.02)
    elif emblema == 'puertas':
        clay.rbox('emblema puerta', (0, y, 0.58), (0.05, 0.01, 0.085), coll, laca('puerta cien', '#8E6FD1', 0.4), p=8, n=4)
        clay.blob('emblema perilla', (0.03, y - 0.015, 0.57), (0.012, 0.01, 0.012), coll, o, n=4)
    elif emblema == 'mesa':
        clay.rbox('emblema dado', (0, y - 0.02, 0.58), (0.045, 0.02, 0.045), coll, utileria._mat_reaccion('crema'), p=5, n=4)
        for dx, dz in ((-1, -1), (-1, 1), (0, 0), (1, -1), (1, 1)):
            clay.blob('punto emblema', (dx * 0.022, y - 0.042, 0.58 + dz * 0.022), (0.009, 0.004, 0.009), coll, utileria._mat_reaccion('punto rosa'), n=4)
    else:
        clay.lathe('emblema cohete', [(0.0, 0.5), (0.03, 0.51), (0.035, 0.58), (0.02, 0.65), (0.0, 0.67)], coll, laca('cohete', '#FFFFFF', 0.3),
                   segments=14).location = (0, y - 0.02, 0)
        clay.lathe('fuego emblema', [(0.0, 0.46), (0.025, 0.49), (0.0, 0.51)], coll, luz('fuego', '#FF9A3C', 3.0), segments=10).location = (0, y - 0.02, 0)


def podio(coll):
    """Podio redondo de tres escalones para la copa del amor (el trofeo de los trofeos)."""
    o = oro()
    clay.lathe('podio', [(0.0, 0.0), (0.62, 0.0), (0.62, 0.14), (0.58, 0.16), (0.46, 0.16), (0.46, 0.3), (0.42, 0.32), (0.3, 0.32), (0.3, 0.46),
                         (0.0, 0.46)], coll, marmol(), segments=40)
    for r, z in ((0.625, 0.07), (0.465, 0.23), (0.305, 0.39)):
        clay.lathe('aro podio', [(r - 0.005, z - 0.02), (r + 0.012, z), (r - 0.005, z + 0.02)], coll, o, segments=40, cap_bottom=False, cap_top=False)
    clay.lathe('cojín podio', [(0.0, 0.46), (0.25, 0.46), (0.27, 0.49), (0.24, 0.52), (0.0, 0.52)], coll, tela('terciopelo', '#C83E4D'), segments=32)
    for k in range(10):
        a = k / 10 * math.tau + 0.2
        clay.blob('gema podio', (0.47 * math.cos(a), 0.47 * math.sin(a), 0.23), (0.035, 0.035, 0.035), coll, utileria._mat_reaccion('gema'), n=5)


def vitrina_medallas(coll):
    """Vitrina abierta de madera con fondo de terciopelo azul y medallas colgadas."""
    mad = madera('vitrina', '#9C6B45')
    clay.rbox('fondo vitrina', (0, 0.17, 1.02), (0.56, 0.03, 0.98), coll, tela('fondo vitrina', '#2E4A7A'), p=8, n=4)
    for s in (-1, 1):
        clay.rbox('lado vitrina', (s * 0.53, 0, 1.02), (0.035, 0.2, 1.02), coll, mad, p=8, n=4)
    clay.rbox('techo vitrina', (0, 0, 2.02), (0.58, 0.21, 0.04), coll, mad, p=8, n=4)
    clay.rbox('base vitrina', (0, 0, 0.14), (0.56, 0.2, 0.14), coll, mad, p=8, n=4)
    colores = {'oro': ('#F5C246', 0.85), 'plata': ('#D9DEE6', 0.9), 'bronce': ('#C98A4B', 0.8)}
    cintas = ('#E4574B', '#4A90D9', '#4FB477')
    for f, z in enumerate((0.55, 1.1, 1.65)):
        clay.rbox('repisa vitrina', (0, 0, z - 0.22), (0.5, 0.18, 0.02), coll, mad, p=8, n=4)
        for k, x in enumerate((-0.3, 0.0, 0.3)):
            tipo = ('oro', 'plata', 'bronce')[(k + f) % 3]
            col, met = colores[tipo]
            cinta = laca(f'cinta {cintas[(k + f) % 3]}', cintas[(k + f) % 3], 0.5)
            for s in (-1, 1):
                clay.sweep('cinta medalla', [(x + s * 0.06, 0.14, z + 0.22), (x + s * 0.01, 0.13, z + 0.06)], 0.018, (1.4, 0.4), coll, cinta,
                           segments=6, samples=2)
            clay.blob('medalla', (x, 0.12, z), (0.07, 0.015, 0.07), coll, _mat(f'Medalla {tipo}', col, rough=0.25, metallic=met), n=8)
            estrella_plana('estrella medalla', (x, 0.1, z), 0.035, coll, _mat(f'Medalla {tipo}', col, rough=0.25, metallic=met), grosor=0.01)


def aplique(coll):
    """Lamparita de pared que alumbra un pedestal."""
    clay.rbox('soporte aplique', (0, 0.02, 0), (0.03, 0.03, 0.08), coll, oro(), p=6, n=4)
    clay.lathe('pantalla aplique', [(0.05, -0.02), (0.1, 0.09), (0.095, 0.1)], coll, tela('pantalla aplique', '#FFF1D6'), segments=18,
               cap_bottom=False, cap_top=False).location = (0, -0.08, 0)
    clay.blob('bombillo aplique', (0, -0.08, 0.02), (0.04, 0.04, 0.04), coll, luz('aplique'), n=5)


TROFEOS_X = {'super': -2.0, 'puertas': -0.95, 'mesa': 0.1, 'retrete': 1.15}
TROFEOS_Y = D / 2 - 0.55
PODIO = (-0.6, -0.45)


def trofeos(coll):
    _cascaron(coll, 'trofeos')
    tiendas.rug(coll, '#C83E4D', 0.0, 0.72, 2.3, 0.26, border='#F5C246')
    colores = {'super': '#E4574B', 'puertas': '#8E6FD1', 'mesa': '#4FB477', 'retrete': '#4A90D9'}
    for k, x in TROFEOS_X.items():
        _poner(coll, f'pedestal {k}', lambda c, k=k: pedestal(c, colores[k], k), x, TROFEOS_Y)
        _group(coll, 'aplique', (x, D / 2 - 0.02, 2.35), 0.0, lambda: aplique(coll))
    _poner(coll, 'podio', podio, *PODIO)
    _poner(coll, 'vitrina', vitrina_medallas, -W / 2 + 0.25, -0.9, IZQ)
    tiendas.garland(coll, (-2.65, D / 2 - 0.06, 2.75), (1.55, D / 2 - 0.06, 2.75), sag=0.25, n=14,
                    colors=('amarillo', 'rojo', 'amarillo', 'rosa'))
    puerta_interior(coll, 2.2)


# ----- Cuarto del bebé -----

def cuna(coll):
    """Cuna de barrotes blancos con colchón, cobijita, almohadita y un móvil de estrellas encima."""
    blanco = laca('cuna', '#FFFDF8', 0.4)
    menta = laca('cabecera cuna', '#BFE3D8', 0.4)
    L, A = 0.66, 0.34
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.sweep('poste cuna', [(sx * L, sy * A, 0.0), (sx * L, sy * A, 1.02)], 0.035, (1, 1), coll, blanco, segments=8, samples=2,
                       up=(0, 1, 0))
            clay.blob('bolita poste', (sx * L, sy * A, 1.05), (0.045, 0.045, 0.045), coll, blanco, n=6)
    for z in (0.4, 0.98):
        for sy in (-1, 1):
            clay.sweep('baranda cuna', [(-L, sy * A, z), (L, sy * A, z)], 0.025, (1, 1), coll, blanco, segments=8, samples=2)
        for sx in (-1, 1):
            clay.sweep('baranda cuna', [(sx * L, -A, z), (sx * L, A, z)], 0.025, (1, 1), coll, blanco, segments=8, samples=2)
    for sy in (-1, 1):
        for k in range(1, 12):
            x = -L + k * 2 * L / 12
            clay.sweep('barrote', [(x, sy * A, 0.4), (x, sy * A, 0.98)], 0.014, (1, 1), coll, blanco, segments=6, samples=2, up=(0, 1, 0))
    for sx in (-1, 1):
        clay.rbox('cabecera cuna', (sx * L, 0, 0.72), (0.025, A - 0.02, 0.28), coll, menta, p=4, n=6)
    clay.rbox('colchón cuna', (0, 0, 0.48), (L - 0.04, A - 0.03, 0.07), coll, tela('colchón cuna', '#DDEFF7'), p=5, n=6)
    clay.rbox('cobija cuna', (0.18, 0, 0.56), (0.4, A - 0.05, 0.025), coll, tela('cobija cuna', '#F7C6D3'), p=4, n=6)
    clay.blob('almohada cuna', (-0.42, 0, 0.58), (0.14, 0.2, 0.05), coll, tela('almohada', '#FFFFFF'), n=8, p=3.0)
    # Móvil: el palo sale de la esquina de atrás y cuelgan estrellas, una luna y un corazón
    palo = madera('palo móvil', '#E8C39E')
    clay.sweep('palo móvil', [(-L, A, 1.0), (-L, A, 1.72), (-L + 0.15, A * 0.6, 1.82), (-0.05, 0.0, 1.8)], 0.018, (1, 1), coll, palo,
               segments=6, samples=5)
    brazos = [(0.2, 0.0), (-0.2, 0.0), (0.0, 0.2), (0.0, -0.2)]
    clay.sweep('cruz móvil', [(-0.25, 0, 1.76), (0.25, 0, 1.76)], 0.01, (1, 1), coll, palo, segments=6, samples=2)
    clay.sweep('cruz móvil', [(0, -0.25, 1.76), (0, 0.25, 1.76)], 0.01, (1, 1), coll, palo, segments=6, samples=2)
    colores = ('#FFE38A', '#9ED9C0', '#F7A8BE', '#C9B6EA')
    for k, (x, y) in enumerate(brazos):
        z = 1.5 + 0.06 * (k % 2)
        clay.sweep('hilo móvil', [(x, y, 1.76), (x, y, z + 0.07)], 0.003, (1, 1), coll, _mat('Hilo', '#FFFFFF', rough=0.8), segments=4, samples=2)
        estrella_plana('estrella móvil', (x, y, z), 0.07, coll, laca(f'móvil {colores[k]}', colores[k], 0.4), grosor=0.025)


def mecedora(coll, color='#F7C6D3'):
    """Mecedora de madera con patas curvas y cojines (mira hacia -y)."""
    mad = madera('mecedora', '#C9956A')
    for sx in (-1, 1):
        clay.sweep('balancín', [(sx * 0.25, -0.42, 0.1), (sx * 0.25, -0.2, 0.03), (sx * 0.25, 0.05, 0.02), (sx * 0.25, 0.3, 0.05),
                                (sx * 0.25, 0.45, 0.12)], 0.03, (1, 1), coll, mad, segments=8, samples=5)
        for sy in (-1, 1):
            clay.sweep('pata mecedora', [(sx * 0.25, sy * 0.2, 0.03), (sx * 0.25, sy * 0.2, 0.44)], 0.025, (1, 1), coll, mad, segments=6, samples=2)
        clay.sweep('poste espaldar', [(sx * 0.25, 0.22, 0.44), (sx * 0.26, 0.3, 1.12)], 0.028, (1, 1), coll, mad, segments=6, samples=2)
        clay.sweep('brazo mecedora', [(sx * 0.28, 0.24, 0.72), (sx * 0.29, -0.05, 0.72), (sx * 0.28, -0.22, 0.66)], 0.03, (1, 1), coll, mad,
                   segments=6, samples=4)
        clay.sweep('apoyo brazo', [(sx * 0.28, -0.2, 0.44), (sx * 0.28, -0.22, 0.66)], 0.02, (1, 1), coll, mad, segments=6, samples=2)
    clay.rbox('asiento mecedora', (0, 0, 0.45), (0.28, 0.25, 0.03), coll, mad, p=6, n=5)
    clay.rbox('cojín mecedora', (0, -0.01, 0.5), (0.25, 0.23, 0.04), coll, tela(f'cojín {color}', color), p=4, n=6)
    clay.sweep('travesaño espaldar', [(-0.27, 0.31, 1.12), (0.0, 0.33, 1.16), (0.27, 0.31, 1.12)], 0.035, (1, 1), coll, mad, segments=6, samples=4)
    for k in range(4):
        x = -0.15 + k * 0.1
        clay.sweep('palito espaldar', [(x, 0.24, 0.48), (x, 0.31, 1.1)], 0.014, (1, 1), coll, mad, segments=6, samples=2)
    clay.blob('cojín espalda mecedora', (0, 0.22, 0.78), (0.22, 0.06, 0.2), coll, tela(f'cojín {color}', color), n=8, p=3.0)


def comoda_bebe(coll):
    """Cómoda blanca con cajones de colores y el cambiador encima (pañales y talco)."""
    blanco = laca('cómoda', '#FFFDF8', 0.4)
    clay.rbox('cómoda', (0, 0, 0.45), (0.5, 0.25, 0.44), coll, blanco, p=8, n=5)
    for k, col in enumerate(('#F7C6D3', '#BFE3D8', '#FFE38A')):
        z = 0.2 + k * 0.26
        clay.rbox('cajón cómoda', (0, -0.25, z), (0.44, 0.012, 0.1), coll, laca(f'cajón {col}', col, 0.4), p=8, n=4)
        clay.blob('perilla cómoda', (0, -0.275, z), (0.03, 0.02, 0.03), coll, laca('perilla', '#F2E6C9'), n=5)
    clay.rbox('cambiador', (-0.08, 0, 0.93), (0.36, 0.22, 0.045), coll, tela('cambiador', '#9ED9C0'), p=4, n=6)
    for s in (-1, 1):
        clay.rbox('borde cambiador', (-0.08 + s * 0.34, 0, 0.99), (0.03, 0.22, 0.04), coll, tela('cambiador', '#9ED9C0'), p=4, n=6)
    for k in range(3):
        clay.rbox('pañal', (0.38, -0.05, 0.93 + k * 0.05), (0.08, 0.09, 0.022), coll, tela('pañal', '#FFFFFF'), p=4, n=5)
    clay.lathe('talco', [(0.0, 0.89), (0.045, 0.89), (0.045, 1.04), (0.02, 1.08), (0.0, 1.09)], coll, laca('talco', '#C9E6F7', 0.3),
               segments=16).location = (0.38, 0.12, 0)


def juguetes(coll):
    """Cubos de colores (uno encima de otro), una pelota y la torre de aros."""
    for k, (x, y, z, col) in enumerate(((0.0, 0.0, 0.09, '#E4574B'), (0.2, 0.05, 0.09, '#4A90D9'), (0.08, 0.02, 0.27, '#F7C948'),
                                        (-0.18, -0.12, 0.09, '#4FB477'))):
        clay.rbox('cubo', (x, y, z), (0.09, 0.09, 0.09), coll, laca(f'cubo {col}', col, 0.4), p=5, n=5)
        clay.rbox('letra cubo', (x, y - 0.092, z), (0.045, 0.004, 0.05), coll, laca('letra', '#FFFFFF', 0.4), p=3, n=4)
    clay.blob('pelota', (0.55, -0.1, 0.12), (0.12, 0.12, 0.12), coll, laca('pelota', '#F7A8BE', 0.3), n=10)
    clay.sweep('franja pelota', [(0.55 + 0.121 * math.cos(a), -0.1 + 0.121 * math.sin(a), 0.12) for a in [k * math.tau / 12 for k in range(12)]],
               0.02, (1, 1), coll, laca('franja', '#FFFFFF', 0.3), segments=6, samples=3, closed=True)
    clay.lathe('base aros', [(0.0, 0.0), (0.1, 0.0), (0.1, 0.04), (0.0, 0.04)], coll, madera('aros', '#E8C39E'), segments=16).location = (-0.45, 0.25, 0)
    clay.sweep('palo aros', [(-0.45, 0.25, 0.04), (-0.45, 0.25, 0.36)], 0.015, (1, 1), coll, madera('aros', '#E8C39E'), segments=6, samples=2)
    for k, col in enumerate(('#E4574B', '#F7C948', '#4FB477', '#4A90D9')):
        r = 0.09 - k * 0.015
        clay.lathe('aro juguete', [(0.02, 0.05 + k * 0.065), (r, 0.06 + k * 0.065), (r, 0.1 + k * 0.065), (0.02, 0.11 + k * 0.065)], coll,
                   laca(f'aro {col}', col, 0.3), segments=18, cap_bottom=False, cap_top=False).location = (-0.45, 0.25, 0)


def cuna_cuarto(coll):
    _cascaron(coll, 'cuna')
    ventana_con_cortinas(coll, -W / 2 + 0.01, 1.2, 1.75, 1.0, 1.0, '#BFE3D8', on_left=True)
    _poner(coll, 'cuna', cuna, -0.5, D / 2 - 0.6)
    _poner(coll, 'cómoda', comoda_bebe, 1.05, D / 2 - 0.3)
    tiendas.rug(coll, '#CDE8F6', 0.2, -0.55, 1.2, 0.8, border='#A9D4EE')
    _poner(coll, 'mecedora', mecedora, -1.85, -0.3, IZQ)
    _poner(coll, 'juguetes', juguetes, 0.9, -1.0, 0.3)
    for k, (x, z, r) in enumerate(((-1.05, 2.45, 0.1), (-0.5, 2.62, 0.13), (0.05, 2.4, 0.09), (0.55, 2.58, 0.07))):
        estrella_plana('estrella pared', (x, D / 2 - 0.015, z), r, coll, luz('estrella pared', '#FFE38A', 1.4), grosor=0.015)
    puerta_interior(coll, 2.2)


# ----- El cuarto de cada uno -----

def escritorio(coll, color='#B98559', cajones=True):
    """Escritorio de madera con cajonera a un lado (mira hacia -y)."""
    mad = madera(f'escritorio {color}', color)
    clay.rbox('tabla escritorio', (0, 0, 0.74), (0.75, 0.3, 0.03), coll, mad, p=8, n=5)
    if cajones:
        clay.rbox('cajonera', (-0.52, 0, 0.36), (0.2, 0.27, 0.35), coll, mad, p=8, n=5)
        for k in range(3):
            z = 0.16 + k * 0.22
            clay.rbox('cajón escritorio', (-0.52, -0.27, z), (0.17, 0.012, 0.08), coll, madera('cajón', '#D9A876'), p=8, n=4)
            clay.blob('perilla escritorio', (-0.52, -0.29, z), (0.025, 0.02, 0.025), coll, laca('perilla', '#F2E6C9'), n=5)
    else:
        for sy in (-1, 1):
            clay.sweep('pata escritorio', [(-0.68, sy * 0.24, 0.0), (-0.68, sy * 0.24, 0.72)], 0.03, (1, 1), coll, mad, segments=8, samples=2)
    for sy in (-1, 1):
        clay.sweep('pata escritorio', [(0.68, sy * 0.24, 0.0), (0.68, sy * 0.24, 0.72)], 0.03, (1, 1), coll, mad, segments=8, samples=2)


def computador(coll):
    """Pantalla prendida, teclado, mouse, audífonos y un pocillo (encima de un escritorio)."""
    negro = laca('pc', '#2B2A33', 0.35)
    clay.lathe('base monitor', [(0.0, 0.77), (0.14, 0.77), (0.12, 0.79), (0.0, 0.8)], coll, negro, segments=20).location = (0.05, 0.12, 0)
    clay.sweep('cuello monitor', [(0.05, 0.14, 0.79), (0.05, 0.16, 0.95)], 0.025, (1, 1), coll, negro, segments=6, samples=2)
    clay.rbox('monitor', (0.05, 0.12, 1.12), (0.4, 0.03, 0.24), coll, negro, p=8, n=5)
    clay.rbox('pantalla pc', (0.05, 0.09, 1.12), (0.36, 0.01, 0.2), coll, luz('pantalla pc', '#9FD3F2', 1.2), p=8, n=4)
    clay.rbox('teclado', (0.05, -0.12, 0.78), (0.26, 0.08, 0.012), coll, laca('teclado', '#3A3A48', 0.4), p=8, n=4)
    for f in range(3):
        clay.rbox('teclas', (0.05, -0.165 + f * 0.045, 0.795), (0.23, 0.016, 0.006), coll, laca('tecla', '#EDEBF2', 0.4), p=8, n=4, subsurf=1)
    clay.blob('mouse', (0.43, -0.12, 0.785), (0.04, 0.06, 0.02), coll, laca('mouse', '#EDEBF2', 0.3), n=6)
    clay.sweep('diadema audífonos', [(-0.42 + 0.1 * math.cos(a), 0.0, 0.78 + 0.1 * math.sin(a)) for a in [k * math.pi / 8 for k in range(9)]],
               0.014, (1, 1), coll, negro, segments=6, samples=3, up=(0, 1, 0))
    for s in (-1, 1):
        clay.blob('audífono', (-0.42 + s * 0.1, 0.0, 0.8), (0.035, 0.045, 0.045), coll, laca('audífono', '#E4574B', 0.3), n=6)
    clay.lathe('pocillo pc', [(0.0, 0.77), (0.05, 0.77), (0.055, 0.87), (0.05, 0.88), (0.0, 0.87)], coll, laca('pocillo azul', '#7FA8D9', 0.3),
               segments=16).location = (0.55, 0.12, 0)


def silla_gamer(coll):
    """Silla gamer azul con franjas rojas, ruedas y brazos (mira hacia -y)."""
    azul = tela('silla gamer', '#2E4A7A')
    rojo = tela('franja gamer', '#E4574B')
    negro = laca('base gamer', '#2B2A33', 0.35)
    for k in range(5):
        a = k / 5 * math.tau + 0.3
        clay.sweep('pata gamer', [(0, 0, 0.12), (0.28 * math.cos(a), 0.28 * math.sin(a), 0.07)], 0.025, (1, 1), coll, negro, segments=6, samples=2)
        clay.blob('rueda gamer', (0.3 * math.cos(a), 0.3 * math.sin(a), 0.04), (0.035, 0.035, 0.035), coll, negro, n=5)
    clay.sweep('pistón gamer', [(0, 0, 0.12), (0, 0, 0.42)], 0.035, (1, 1), coll, negro, segments=8, samples=2)
    clay.rbox('asiento gamer', (0, -0.02, 0.46), (0.26, 0.25, 0.05), coll, azul, p=4, n=6)
    clay.rbox('espaldar gamer', (0, 0.24, 0.86), (0.24, 0.06, 0.36), coll, azul, p=4, n=6)
    for s in (-1, 1):
        clay.rbox('franja gamer', (s * 0.13, 0.18, 0.86), (0.035, 0.012, 0.3), coll, rojo, p=4, n=5)
        clay.sweep('brazo gamer', [(s * 0.27, 0.12, 0.48), (s * 0.27, 0.1, 0.66), (s * 0.27, -0.12, 0.66)], 0.022, (1, 1), coll, negro, segments=6,
                   samples=4)
    clay.blob('cojín cabeza gamer', (0, 0.18, 1.12), (0.12, 0.04, 0.06), coll, rojo, n=6)


def balon(coll):
    """Balón de fútbol blanco con parches negros."""
    clay.blob('balón', (0, 0, 0.11), (0.11, 0.11, 0.11), coll, laca('balón', '#FFFFFF', 0.4), n=10)
    for k in range(7):
        a, e = k * 2.39996, math.acos(1 - 2 * (k + 0.5) / 7)
        d = (math.sin(e) * math.cos(a), math.sin(e) * math.sin(a), math.cos(e))
        clay.blob('parche balón', (0.108 * d[0], 0.108 * d[1], 0.11 + 0.108 * d[2]), (0.035, 0.035, 0.035), coll, laca('parche', '#2B2A33', 0.4), n=5)


def cuarto_el(coll):
    _cascaron(coll, 'cuarto_el')
    ventana_con_cortinas(coll, -W / 2 + 0.01, 0.3, 1.9, 1.1, 0.9, '#9FC2E8', on_left=True)

    def puesto(c):
        escritorio(c, '#B98559')
        computador(c)
    _poner(coll, 'escritorio', puesto, -W / 2 + 0.33, 0.3, IZQ)
    _poner(coll, 'silla gamer', silla_gamer, -1.78, 0.3, -IZQ)
    _poner(coll, 'repisa', repisa_libros, -0.6, D / 2 - 0.15)
    _poner(coll, 'sillón', lambda c: sillon(c, '#7FA8D9', '#F7D774'), 0.55, D / 2 - 0.55)
    _poner(coll, 'mesita', lambda c: mesita(c, lampara=False), 1.4, D / 2 - 0.3)
    tiendas.rug(coll, '#BFD9F2', 0.2, -0.45, 1.3, 0.8, border='#9FC2E8')
    _poner(coll, 'balón', balon, -0.1, -1.35)
    puerta_interior(coll, 2.2)


def tocador(coll):
    """Tocador blanco y rosado con espejo redondo de bombillitos, perfumes, labial y joyero."""
    blanco = laca('tocador', '#FFFDF8', 0.4)
    rosa = laca('cajón tocador', '#F7C6D3', 0.4)
    o = oro()
    clay.rbox('tabla tocador', (0, 0, 0.76), (0.6, 0.25, 0.03), coll, blanco, p=8, n=5)
    for s in (-1, 1):
        clay.rbox('cajonera tocador', (s * 0.44, 0, 0.37), (0.15, 0.23, 0.36), coll, blanco, p=8, n=5)
        for k in range(2):
            z = 0.22 + k * 0.3
            clay.rbox('cajón tocador', (s * 0.44, -0.23, z), (0.12, 0.012, 0.11), coll, rosa, p=8, n=4)
            clay.blob('perilla tocador', (s * 0.44, -0.25, z), (0.022, 0.018, 0.022), coll, o, n=5)
    clay.rbox('cajón centro', (0, -0.23, 0.68), (0.28, 0.012, 0.05), coll, rosa, p=8, n=4)
    # Espejo redondo con su marco dorado y bombillitos alrededor
    clay.blob('espejo tocador', (0, 0.17, 1.42), (0.36, 0.012, 0.36), coll, _mat('Espejo', '#DDEAF2', rough=0.05, metallic=0.9), n=10)
    aro_frente('marco espejo tocador', (0, 0.15, 1.42), 0.37, 0.37, 0.035, coll, o, n=24)
    for k in range(12):
        a = k / 12 * math.tau
        clay.blob('bombillo tocador', (0.45 * math.cos(a), 0.14, 1.42 + 0.45 * math.sin(a)), (0.035, 0.03, 0.035), coll,
                  luz('bombillo tocador', '#FFF4DA', 3.5), n=5)
    clay.sweep('soporte espejo', [(0, 0.17, 0.79), (0, 0.17, 1.05)], 0.03, (1, 1), coll, o, segments=6, samples=2)
    for k, (x, col, alto) in enumerate(((-0.4, '#F7A8BE', 0.14), (-0.3, '#C9B6EA', 0.1), (-0.22, '#9ED9C0', 0.12))):
        clay.lathe('perfume', [(0.0, 0.79), (0.04, 0.79), (0.045, 0.79 + alto), (0.015, 0.8 + alto), (0.0, 0.8 + alto)], coll,
                   laca(f'perfume {col}', col, 0.15), segments=14).location = (x, -0.02, 0)
        clay.blob('tapa perfume', (x, -0.02, 0.83 + alto), (0.02, 0.02, 0.025), coll, o, n=5)
    clay.lathe('labial', [(0.0, 0.79), (0.018, 0.79), (0.018, 0.86), (0.012, 0.87), (0.006, 0.9), (0.0, 0.9)], coll,
               laca('labial', '#E4566B', 0.3), segments=12).location = (0.28, -0.1, 0)
    clay.rbox('joyero', (0.42, -0.02, 0.83), (0.1, 0.07, 0.045), coll, laca('joyero', '#F2A5B8', 0.3), p=5, n=5)
    clay.rbox('tapa joyero', (0.42, -0.02, 0.885), (0.105, 0.075, 0.012), coll, o, p=5, n=4)


def taburete(coll, color='#F2A5B8'):
    """Banquito redondo acolchado (se sientan como en una silla)."""
    o = oro()
    for k in range(3):
        a = k / 3 * math.tau + 0.5
        clay.sweep('pata taburete', [(0.14 * math.cos(a), 0.14 * math.sin(a), 0.0), (0.1 * math.cos(a), 0.1 * math.sin(a), 0.42)], 0.018, (1, 1),
                   coll, o, segments=6, samples=2)
    clay.lathe('taburete', [(0.0, 0.4), (0.2, 0.4), (0.22, 0.45), (0.19, 0.5), (0.0, 0.51)], coll, tela(f'taburete {color}', color), segments=24)


def estudio(coll):
    """Escritorio de estudio de Ella (psicología): libros, un cerebrito rosado, cuaderno y lámpara."""
    escritorio(coll, '#E8C39E', cajones=False)
    colores = ('#C9B6EA', '#F7A8BE', '#9ED9C0', '#7FA8D9')
    for k, col in enumerate(colores):
        clay.rbox('libro estudio', (-0.5, 0.05, 0.795 + k * 0.05), (0.14 - k * 0.01, 0.1, 0.022), coll, laca(f'libro {col}', col, 0.5), p=8, n=4)
    rosa = _mat('Cerebro', '#F4A7B9', rough=0.5, coat=0.3)
    for s in (-1, 1):
        clay.blob('cerebro', (-0.05 + s * 0.055, 0.1, 0.87), (0.07, 0.09, 0.07), coll, rosa, n=8, p=1.8)
    for k in range(4):
        clay.sweep('pliegue cerebro', [(-0.15 + k * 0.06, 0.02, 0.86), (-0.14 + k * 0.06, 0.06, 0.93), (-0.15 + k * 0.06, 0.14, 0.9)], 0.008, (1, 1),
                   coll, _mat('Pliegue cerebro', '#E58AA2', rough=0.5), segments=5, samples=3)
    clay.lathe('base cerebro', [(0.0, 0.77), (0.07, 0.77), (0.06, 0.8), (0.0, 0.8)], coll, madera('base', '#8A5A3B'), segments=16).location = (-0.05, 0.1, 0)
    clay.rbox('cuaderno', (0.22, -0.1, 0.78), (0.14, 0.1, 0.012), coll, laca('cuaderno', '#FFE38A', 0.5), p=6, n=4)
    clay.sweep('lápiz', [(0.12, -0.18, 0.795), (0.34, -0.12, 0.795)], 0.008, (1, 1), coll, laca('lápiz', '#F28C28', 0.4), segments=6, samples=2)
    clay.lathe('lámpara estudio', [(0.0, 0.77), (0.08, 0.77), (0.07, 0.79), (0.0, 0.8)], coll, laca('lámpara', '#F2A5B8', 0.3), segments=18).location = (0.55, 0.12, 0)
    clay.sweep('brazo lámpara', [(0.55, 0.12, 0.79), (0.52, 0.14, 1.1), (0.42, 0.08, 1.18)], 0.015, (1, 1), coll, laca('lámpara', '#F2A5B8', 0.3),
               segments=6, samples=4)
    clay.lathe('pantalla estudio', [(0.1, 1.06), (0.05, 1.18), (0.0, 1.19)], coll, laca('lámpara', '#F2A5B8', 0.3), segments=18,
               cap_bottom=False).location = (0.4, 0.07, 0)
    clay.blob('bombillo estudio', (0.4, 0.07, 1.09), (0.035, 0.035, 0.035), coll, luz('estudio'), n=5)


def cuarto_ella(coll):
    _cascaron(coll, 'cuarto_ella')
    ventana_con_cortinas(coll, -W / 2 + 0.01, -0.6, 1.9, 1.1, 0.9, '#F7C6D3', on_left=True)
    _poner(coll, 'tocador', tocador, -1.3, D / 2 - 0.3)
    _poner(coll, 'taburete', taburete, -1.3, 1.15)
    _poner(coll, 'estudio', estudio, -W / 2 + 0.33, -0.6, IZQ)
    _poner(coll, 'silla', lambda c: silla(c, '#F7C6D3'), -1.83, -0.6, -IZQ)
    _poner(coll, 'repisa', repisa_libros, 0.55, D / 2 - 0.15)
    _poner(coll, 'sillón', lambda c: sillon(c, '#F2A5B8', '#FFFFFF'), 0.55, D / 2 - 0.55)
    tiendas.rug(coll, '#F7D3DE', 0.3, -0.5, 1.3, 0.8, border='#F2A5B8')
    puerta_interior(coll, 2.2)


# ----- El patio (afuera: grama, cerca de madera y la fachada de la casa) -----

def _cascaron_patio(coll):
    """Grama con relieve, la fachada de la casa al fondo (con alero de tejas), cerca de madera alta a la izquierda y
    cerquita blanca al frente y a la derecha."""
    grama = _mat('Grama', '#9BD27A', rough=0.95, fuzz=dict(scale=90, color='#8CC96A', amount=0.45, strength=0.4, distance=0.003))
    floor = clay.make_mesh_object('piso', [(-W / 2, -D / 2, 0), (W / 2, -D / 2, 0), (W / 2, D / 2, 0), (-W / 2, D / 2, 0)], [(0, 1, 2, 3)], coll,
                                  smooth=False, material=grama)
    clay.add_solidify(floor, 0.15, -1.0)
    fachada = M('Pared | fachada patio', '#F6D8C0', rough=0.9, noise=dict(scale=5, strength=0.04, distance=0.04))
    clay.rbox('pared fondo', (0, D / 2 + 0.1, ALTO / 2), (W / 2 + 0.2, 0.1, ALTO / 2), coll, fachada, p=24, n=4, subsurf=1)
    borde = M('Zócalo casa', '#FBF7F1', rough=0.5)
    clay.rbox('zócalo fondo', (0, D / 2 - 0.02, 0.1), (W / 2, 0.03, 0.1), coll, borde, p=12, n=4)
    teja = laca('teja', '#C96F5C', 0.55)
    clay.rbox('muro alero', (0, D / 2 - 0.15, ALTO - 0.05), (W / 2 + 0.2, 0.28, 0.06), coll, teja, p=12, n=4)
    for k in range(14):
        x = -W / 2 + (k + 0.5) * W / 14
        clay.blob('muro teja', (x, D / 2 - 0.42, ALTO - 0.08), (0.2, 0.05, 0.05), coll, teja, n=4)
    tabla = madera('cerca', '#C08A5B')
    # Cerca de tablas a la izquierda, con dos travesaños
    y = -D / 2
    k = 0
    while y < D / 2:
        alto = 1.25 + 0.06 * (k % 2)
        clay.rbox('muro tabla', (-W / 2 - 0.05, y + 0.1, alto / 2), (0.03, 0.095, alto / 2), coll, tabla, p=6, n=4, subsurf=1)
        clay.blob('muro punta', (-W / 2 - 0.05, y + 0.1, alto), (0.03, 0.095, 0.05), coll, tabla, n=4)
        y += 0.21
        k += 1
    for z in (0.35, 0.95):
        clay.rbox('muro travesaño', (-W / 2 + 0.0, 0, z), (0.025, D / 2, 0.04), coll, madera('travesaño', '#A87447'), p=6, n=4, subsurf=1)
    # Cerquita blanca al frente y a la derecha
    blanca = laca('cerquita', '#FFFDF8', 0.5)
    for lado in ('frente', 'derecha'):
        largo = W if lado == 'frente' else D
        n = int(largo / 0.24)
        for k in range(n + 1):
            t = -largo / 2 + k * largo / n
            pos = (t, -D / 2 - 0.05, 0.22) if lado == 'frente' else (W / 2 + 0.05, t, 0.22)
            clay.rbox('muro estaca', pos, (0.03, 0.03, 0.22), coll, blanca, p=6, n=4, subsurf=1)
            clay.blob('muro punta estaca', (pos[0], pos[1], 0.45), (0.03, 0.03, 0.03), coll, blanca, n=4)
        for z in (0.14, 0.32):
            if lado == 'frente':
                clay.rbox('muro riel', (0, -D / 2 - 0.05, z), (W / 2, 0.018, 0.025), coll, blanca, p=6, n=4, subsurf=1)
            else:
                clay.rbox('muro riel', (W / 2 + 0.05, 0, z), (0.018, D / 2, 0.025), coll, blanca, p=6, n=4, subsurf=1)


def casita_perro(coll):
    """Casita del perro: paredes rojas, techo de dos aguas, puerta en arco, letrero para su nombre y un cojín adentro."""
    roja = laca('casita perro', '#E4574B', 0.45)
    blanco = laca('marco casita', '#FFFDF8', 0.45)
    techo = laca('techo casita', '#5B4A6B', 0.5)
    for s in (-1, 1):
        clay.rbox('pared casita', (s * 0.4, 0, 0.42), (0.03, 0.38, 0.42), coll, roja, p=6, n=4)
    clay.rbox('fondo casita', (0, 0.36, 0.42), (0.4, 0.03, 0.42), coll, roja, p=6, n=4)
    for s in (-1, 1):
        clay.rbox('frente casita', (s * 0.3, -0.37, 0.42), (0.11, 0.03, 0.42), coll, roja, p=6, n=4)
    clay.rbox('dintel casita', (0, -0.37, 0.76), (0.2, 0.03, 0.08), coll, roja, p=6, n=4)
    # Arco de la puerta (borde blanco) y los frontones del techo
    arco = [(0.2 * math.cos(a), -0.4, 0.5 + 0.2 * math.sin(a)) for a in [k * math.pi / 10 for k in range(11)]]
    clay.sweep('arco casita', [(0.2, -0.4, 0.0)] + arco + [(-0.2, -0.4, 0.0)], 0.022, (1, 1), coll, blanco, segments=6, samples=3, up=(0, 1, 0))
    for yy in (-0.37, 0.36):
        o = clay.make_mesh_object('frontón casita', [(-0.43, yy, 0.84), (0.43, yy, 0.84), (0.0, yy, 1.16)], [(0, 1, 2)], coll, smooth=False,
                                  material=roja)
        clay.add_solidify(o, 0.05, 0.0)
    for s in (-1, 1):
        o = clay.make_mesh_object('techo casita', [(0.0, -0.48, 1.2), (0.0, 0.47, 1.2), (s * 0.55, 0.47, 0.78), (s * 0.55, -0.48, 0.78)],
                                  [(0, 1, 2, 3)], coll, smooth=False, material=techo)
        clay.add_solidify(o, 0.05, 0.0)
    clay.sweep('cumbrera', [(0, -0.5, 1.22), (0, 0.49, 1.22)], 0.03, (1, 1), coll, blanco, segments=6, samples=2)
    clay.rbox('letrero casita', (0, -0.41, 0.93), (0.19, 0.012, 0.055), coll, laca('letrero casita', '#FFF6E6', 0.5), p=6, n=4)
    # Huesito de adorno sobre el letrero
    hueso = laca('hueso', '#FFFDF8', 0.4)
    clay.sweep('hueso casita', [(-0.07, -0.42, 1.03), (0.07, -0.42, 1.03)], 0.014, (1, 1), coll, hueso, segments=6, samples=2)
    for sx in (-1, 1):
        for sz in (-1, 1):
            clay.blob('punta hueso', (sx * 0.075, -0.42, 1.03 + sz * 0.012), (0.016, 0.012, 0.016), coll, hueso, n=4)
    clay.blob('cojín casita', (0, 0.05, 0.07), (0.3, 0.26, 0.06), coll, tela('cojín casita', '#9ED9C0'), n=8, p=2.4)
    clay.rbox('piso casita', (0, 0, 0.02), (0.4, 0.37, 0.02), coll, madera('piso casita', '#C9956A'), p=6, n=4)


def platos_perro(coll):
    """Tapete con el plato de cuido (el juego lo llena) y el de agua."""
    tiendas.rug(coll, '#F2A5B8', 0, 0, 0.36, 0.2, border='#E88C9C')
    for x, col, nombre in ((-0.16, '#E4574B', 'plato cuido'), (0.16, '#4A90D9', 'plato agua')):
        clay.lathe(nombre, [(0.0, 0.03), (0.1, 0.03), (0.13, 0.1), (0.12, 0.11), (0.09, 0.05), (0.0, 0.05)], coll, laca(nombre, col, 0.3),
                   segments=24).location = (x, 0, 0)

    def cuido():
        for k in range(14):
            a, r = k * 2.4, 0.07 * math.sqrt((k + 0.5) / 14)
            clay.blob('croqueta', (r * math.cos(a), r * math.sin(a), 0.085 + 0.012 * (k % 3)), (0.018, 0.018, 0.012), coll,
                      laca('croqueta', '#9C6B45', 0.6), n=4, subsurf=0)
    _group(coll, 'cuido', (-0.16, 0, 0), 0.0, cuido)
    clay.lathe('agua', [(0.0, 0.09), (0.095, 0.09), (0.0, 0.09)], coll, _mat('Agua jabonosa', '#BDE4F4', rough=0.1, coat=0.8, coat_rough=0.05),
               segments=24).location = (0.16, 0, 0)


def tina_perro(coll):
    """Tina de lata para bañar al perro, con espuma (el juego la muestra al bañarlo) y el patito."""
    lata = _mat('Lata tina', '#B8C2CC', rough=0.35, metallic=0.7)
    clay.lathe('tina perro', [(0.0, 0.0), (0.36, 0.0), (0.42, 0.3), (0.44, 0.32), (0.41, 0.33), (0.37, 0.05), (0.0, 0.05)], coll, lata, segments=36)
    for s in (-1, 1):
        clay.sweep('asa tina', [(s * 0.42, -0.08, 0.22), (s * 0.5, 0, 0.24), (s * 0.42, 0.08, 0.22)], 0.018, (1, 1), coll, lata, segments=6, samples=3)
    clay.lathe('agua tina perro', [(0.0, 0.24), (0.395, 0.24), (0.0, 0.24)], coll, _mat('Agua jabonosa', '#BDE4F4', rough=0.1, coat=0.8, coat_rough=0.05),
               segments=36)

    def espuma():
        for k in range(10):
            a = k / 10 * math.tau
            clay.blob('espuma perro', (0.33 * math.cos(a), 0.33 * math.sin(a), 0.28), (0.1, 0.09, 0.06), coll, _mat('Espuma', '#FFFFFF', rough=0.7), n=5)
    _group(coll, 'espuma tina', (0, 0, 0), 0.0, espuma)
    patito(coll, (0.52, -0.2, 0.0))


def arbol(coll):
    """Tronco del árbol de mango (la copa y el columpio van aparte: por debajo de la copa se camina)."""
    clay.sweep('tronco', [(0, 0, 0), (0.03, 0.02, 0.8), (-0.02, 0.0, 1.5)], [0.16, 0.12, 0.1], (1, 1), coll, madera('tronco', '#8A5A3B'), segments=10,
               samples=5)


def copa(coll):
    """Copa redonda con mangos y la rama del columpio."""
    tronco = madera('tronco', '#8A5A3B')
    clay.sweep('rama', [(0.0, 0.0, 1.35), (0.35, -0.05, 1.7), (0.6, -0.05, 1.8)], [0.07, 0.05, 0.04], (1, 1), coll, tronco, segments=8, samples=4)
    hojas = [('#7CC46A', (0, 0, 2.05), (0.6, 0.55, 0.45)), ('#6BB45B', (0.45, -0.1, 1.85), (0.42, 0.4, 0.35)), ('#8FD27A', (-0.35, 0.1, 1.9), (0.42, 0.4, 0.36)),
             ('#76BE64', (0.1, -0.3, 2.35), (0.4, 0.35, 0.3)), ('#84CB70', (0.05, 0.3, 2.3), (0.38, 0.34, 0.3))]
    for k, (col, c, r) in enumerate(hojas):
        clay.blob('copa árbol', c, r, coll, tela(f'hojas {col}', col), n=10)
    for k, (x, y, z) in enumerate(((0.3, -0.42, 1.85), (-0.2, -0.4, 2.0), (0.55, -0.3, 1.65), (0.0, -0.5, 2.25))):
        clay.blob('mango', (x, y, z), (0.05, 0.045, 0.06), coll, laca('mango', '#F7B538', 0.4), n=6)


def columpio(coll):
    """Columpio de llanta colgado de la rama."""
    for dy in (-0.03, 0.03):
        clay.sweep('lazo columpio', [(0.55, dy, 1.78), (0.55, dy, 0.75)], 0.008, (1, 1), coll, _mat('Lazo', '#E8D9B5', rough=0.9), segments=4, samples=2)
    llanta = clay.lathe('llanta', [(0.1, -0.06), (0.17, -0.07), (0.2, 0.0), (0.17, 0.07), (0.1, 0.06), (0.08, 0.0)], coll,
                        laca('llanta', '#3A3939', 0.6), segments=24, cap_bottom=False, cap_top=False)
    llanta.rotation_euler = (math.pi / 2, 0, 0)
    llanta.location = (0.55, 0, 0.6)


def banca(coll):
    """Banca de jardín con tablas de madera y patas de hierro (se sientan igual que en una silla)."""
    mad = madera('banca', '#C9956A')
    hierro = laca('hierro banca', '#3A3A48', 0.4)
    for k in range(3):
        clay.rbox('tabla banca', (0, -0.14 + k * 0.1, 0.44), (0.62, 0.045, 0.02), coll, mad, p=6, n=4)
    for k in range(2):
        clay.rbox('respaldo banca', (0, 0.2, 0.64 + k * 0.14), (0.62, 0.018, 0.05), coll, mad, p=6, n=4)
    for s in (-1, 1):
        clay.sweep('pata banca', [(s * 0.55, -0.18, 0.0), (s * 0.56, -0.15, 0.42), (s * 0.56, 0.18, 0.42), (s * 0.56, 0.22, 0.85)], 0.02, (1, 1),
                   coll, hierro, segments=6, samples=4)
        clay.sweep('pata banca', [(s * 0.55, 0.18, 0.0), (s * 0.56, 0.15, 0.42)], 0.02, (1, 1), coll, hierro, segments=6, samples=2)
        clay.sweep('brazo banca', [(s * 0.56, 0.2, 0.62), (s * 0.58, -0.1, 0.62), (s * 0.56, -0.18, 0.5)], 0.02, (1, 1), coll, hierro, segments=6,
                   samples=4)


def flores(coll, n=14, largo=1.1, seed=0):
    """Una fila de flores de colores con sus tallos y hojitas."""
    colores = ('#F2587A', '#F7C948', '#C9B6EA', '#FF9A5A', '#FFFFFF', '#F7A8BE')
    for k in range(n):
        y = -largo / 2 + k * largo / (n - 1)
        x = 0.06 * math.sin(k * 2.3 + seed)
        alto = 0.22 + 0.08 * ((k * 7 + seed) % 3)
        clay.sweep('tallo flor', [(x, y, 0.0), (x + 0.01, y, alto)], 0.008, (1, 1), coll, _mat('Tallo', '#5FA35A', rough=0.7), segments=4, samples=2,
                   subsurf=0)
        clay.blob('hojita', (x + 0.03, y, alto * 0.45), (0.035, 0.015, 0.012), coll, _mat('Hoja', '#6FBF8F', rough=0.6), n=4, subsurf=0)
        col = colores[(k + seed) % len(colores)]
        for p in range(5):
            a = p / 5 * math.tau
            clay.blob('pétalo', (x + 0.03 * math.cos(a), y + 0.03 * math.sin(a), alto + 0.01), (0.024, 0.024, 0.01), coll, laca(f'pétalo {col}', col, 0.5),
                      n=4, subsurf=0)
        clay.blob('centro flor', (x, y, alto + 0.02), (0.016, 0.016, 0.012), coll, laca('centro flor', '#F7C948', 0.5), n=4, subsurf=0)


def arbustos(coll):
    for c, r, col in (((0, 0, 0.22), (0.32, 0.28, 0.24), '#6BB45B'), ((0.3, 0.15, 0.18), (0.24, 0.22, 0.2), '#7CC46A'),
                      ((-0.25, 0.2, 0.16), (0.22, 0.2, 0.18), '#84CB70')):
        clay.blob('arbusto', c, r, coll, tela(f'hojas {col}', col), n=8)
    for k in range(5):
        a = k * 1.3
        clay.blob('florcita arbusto', (0.25 * math.cos(a), -0.2 + 0.1 * math.sin(a), 0.3 + 0.05 * (k % 2)), (0.03, 0.03, 0.025), coll,
                  laca('florcita', '#F2587A', 0.5), n=4)


def piedras(coll):
    """Caminito de piedras desde la puerta hasta la grama."""
    for k, (x, y) in enumerate(((2.2, 1.0), (1.95, 0.55), (1.6, 0.15), (1.2, -0.2), (0.75, -0.45))):
        clay.blob('tapete piedra', (x, y, 0.015), (0.2 - 0.01 * (k % 2), 0.15, 0.02), coll, _mat('Piedra', '#CFC7BD', rough=0.8), n=6)


def luces_patio(coll, a, b, n=12):
    """Guirnalda de bombillos calientes entre dos puntos."""
    pts = []
    for k in range(9):
        t = k / 8
        pts.append(tuple(a[i] + (b[i] - a[i]) * t - (0.3 * 4 * t * (1 - t) if i == 2 else 0) for i in range(3)))
    clay.sweep('cable luces', pts, 0.006, (1, 1), coll, laca('cable', '#3A3A48', 0.5), segments=4, samples=3)
    for k in range(n):
        t = (k + 0.5) / n
        p = [a[i] + (b[i] - a[i]) * t - (0.3 * 4 * t * (1 - t) if i == 2 else 0) for i in range(3)]
        clay.blob('bombillo patio', (p[0], p[1], p[2] - 0.05), (0.03, 0.03, 0.04), coll, luz('bombillo patio', '#FFE9A8', 3.5), n=5)


def patio(coll):
    _cascaron_patio(coll)
    ventana_con_cortinas(coll, 0.1, D / 2 - 0.01, 1.75, 1.3, 0.95, '#F7E3B5')
    clay.rbox('matera ventana', (0.1, D / 2 - 0.12, 1.2), (0.62, 0.1, 0.07), coll, madera('matera', '#C08A5B'), p=6, n=4)
    _group(coll, 'flores ventana', (0.1, D / 2 - 0.12, 1.25), IZQ, lambda: flores(coll, 10, 1.1, 3))
    puerta_interior(coll, 2.2, '#9ED9C0')
    tiendas.clock(coll, 1.35, D / 2 - 0.02, 2.55)
    _poner(coll, 'casita', casita_perro, -1.9, D / 2 - 0.62)
    _poner(coll, 'platos', platos_perro, -0.95, D / 2 - 0.45)
    _poner(coll, 'banca', banca, 0.1, D / 2 - 0.45)
    _poner(coll, 'tina', tina_perro, 1.05, D / 2 - 0.7)
    _poner(coll, 'árbol', arbol, -2.25, -0.2)
    _poner(coll, 'copa árbol', copa, -2.25, -0.2)
    _poner(coll, 'columpio', columpio, -2.25, -0.2)
    _group(coll, 'flores', (-2.45, -1.35, 0), 0.0, lambda: flores(coll, 12, 1.1, 0))
    _poner(coll, 'arbustos', arbustos, 2.2, -1.65)
    piedras(coll)
    luces_patio(coll, (-2.2, -0.2, 2.5), (1.6, D / 2 - 0.3, 2.8))

# ----- La cigüeña y la bebé (piezas sueltas: el juego las pone y las anima) -----

def bebe(coll):
    """La bebé envuelta en su cobijita rosada, dormidita (origen abajo al centro, de pie; el juego la acuesta)."""
    piel = _mat('Piel bebé', '#F6CDB0', rough=0.6)
    manta = tela('manta bebé', '#F7C6D3')
    clay.blob('manta bebé', (0, 0, 0.13), (0.11, 0.1, 0.14), coll, manta, n=10, p=2.2)
    clay.sweep('doblez manta', [(-0.1, -0.08, 0.2), (0.0, -0.1, 0.13), (0.1, -0.08, 0.06)], 0.025, (1.0, 0.5), coll, tela('doblez', '#FBD9E2'),
               segments=8, samples=4)
    clay.blob('capucha', (0, 0.02, 0.27), (0.1, 0.09, 0.095), coll, manta, n=8)
    clay.blob('cabeza bebé', (0, -0.02, 0.27), (0.075, 0.07, 0.072), coll, piel, n=10)
    oscuro = _mat('Ojos bebé', '#4A3228', rough=0.5)
    for s in (-1, 1):
        clay.sweep('ojito', [(s * 0.028 - 0.013, -0.083, 0.279), (s * 0.028, -0.088, 0.272), (s * 0.028 + 0.013, -0.083, 0.279)], 0.0045, (1, 1),
                   coll, oscuro, segments=5, samples=3)
        clay.blob('cachete', (s * 0.046, -0.076, 0.254), (0.017, 0.006, 0.012), coll, _mat('Cachete bebé', '#F29CB0', rough=0.6), n=5)
    clay.blob('boquita', (0, -0.087, 0.247), (0.009, 0.005, 0.006), coll, _mat('Boquita', '#E0707F', rough=0.5), n=5)
    clay.sweep('rulito', [(-0.01, -0.07, 0.33), (0.01, -0.08, 0.345), (0.02, -0.075, 0.33), (0.008, -0.07, 0.325)], 0.008, (1, 1), coll,
               _mat('Pelo bebé', '#6B4A35', rough=0.7), segments=5, samples=3)
    clay.blob('moño', (0.06, -0.02, 0.35), (0.04, 0.025, 0.025), coll, laca('moño', '#E4566B', 0.3), n=6)
    clay.blob('moño', (0.1, -0.02, 0.35), (0.035, 0.022, 0.022), coll, laca('moño', '#E4566B', 0.3), n=6)


def ciguena(coll):
    """Cigüeña volando hacia +x con su gorrita de cartero y la bebé colgando del pico en un pañuelo.
    Las alas cuelgan de vacíos en los hombros (el juego las bate)."""
    plumas = tela('plumas', '#FFFFFF')
    negro = tela('plumas negras', '#2B2A33')
    naranja = laca('pico', '#F28C28', 0.35)
    clay.blob('cuerpo cigüeña', (0, 0, 0), (0.24, 0.13, 0.13), coll, plumas, n=10)
    clay.sweep('cuello cigüeña', [(0.18, 0, 0.04), (0.28, 0, 0.14), (0.36, 0, 0.19)], 0.05, (1, 1), coll, plumas, segments=8, samples=4)
    clay.blob('cabeza cigüeña', (0.39, 0, 0.21), (0.075, 0.065, 0.065), coll, plumas, n=8)
    for s in (-1, 1):
        clay.blob('ojo cigüeña', (0.42, s * 0.055, 0.235), (0.013, 0.01, 0.015), coll, laca('ojo', '#2B2A33', 0.3), n=5)
    clay.sweep('pico cigüeña', [(0.44, 0, 0.2), (0.56, 0, 0.18), (0.68, 0, 0.15)], [0.028, 0.02, 0.01], (1, 1), coll, naranja, segments=8, samples=4,
               caps=('round', 'point'))
    clay.blob('gorra', (0.38, 0, 0.28), (0.07, 0.068, 0.03), coll, laca('gorra', '#4A6FA5', 0.4), n=8)
    clay.blob('visera', (0.45, 0, 0.27), (0.04, 0.05, 0.008), coll, laca('gorra', '#4A6FA5', 0.4), n=6)
    clay.blob('cola cigüeña', (-0.26, 0, 0.02), (0.1, 0.08, 0.03), coll, negro, n=6)
    for s in (-1, 1):
        clay.sweep('pata cigüeña', [(-0.08, s * 0.04, -0.1), (-0.25, s * 0.04, -0.14), (-0.42, s * 0.04, -0.15)], 0.012, (1, 1), coll, naranja,
                   segments=6, samples=3)

        def ala(s=s):
            clay.blob('ala', (0.0, s * 0.3, 0.0), (0.16, 0.32, 0.03), coll, plumas, n=8)
            clay.blob('punta ala', (-0.04, s * 0.52, 0.0), (0.12, 0.14, 0.026), coll, negro, n=6)
        _group(coll, 'ala der' if s < 0 else 'ala izq', (0.02, s * 0.1, 0.07), 0.0, ala)
    # El pañuelo con la bebé: cuelga del pico
    tela_p = tela('pañuelo', '#FFFFFF')
    for dy in (-0.03, 0.03):
        clay.sweep('nudo pañuelo', [(0.6, dy, 0.16), (0.6, dy * 2, 0.02), (0.6, dy * 2.5, -0.08)], 0.018, (1, 1), coll, tela_p, segments=6, samples=4)
    clay.blob('pañuelo', (0.6, 0, -0.2), (0.13, 0.12, 0.12), coll, tela_p, n=10, p=2.2)
    clay.blob('cabeza en pañuelo', (0.6, -0.08, -0.13), (0.06, 0.055, 0.058), coll, _mat('Piel bebé', '#F6CDB0', rough=0.6), n=8)
    clay.blob('gorrito', (0.6, -0.06, -0.08), (0.06, 0.05, 0.03), coll, tela('manta bebé', '#F7C6D3'), n=6)


PIEZAS = {'bebe': bebe, 'ciguena': ciguena, 'perro': perro.perro}


CONSTRUIR = {'sala': sala, 'cocina': cocina, 'bano': bano, 'cuarto': dormitorio, 'juegos': juegos, 'trofeos': trofeos,
             'cuna': cuna_cuarto, 'cuarto_el': cuarto_el, 'cuarto_ella': cuarto_ella, 'patio': patio}

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
    'juegos': {
        'entrada': (2.2, 1.35, 0), 'centro_izq': (-1.0, -1.35, 0), 'centro_der': (0.6, -1.55, 0),
        'arcade': (-1.75, 0.85, 180), 'cien': (-0.35, 1.3, 180), 'cohete': (-1.4, 0.4, -90),
        # Sentados en los pufs, mirando al parchís
        'mesa_izq': (-0.5, -0.35, 90, [(-0.5, -1.1)]), 'mesa_der': (1.6, -0.35, -90, [(1.6, -1.1)]),
    },
    'trofeos': {
        'entrada': (2.2, 1.35, 0), 'centro_izq': (-1.7, -1.4, 0), 'centro_der': (0.9, -1.3, 0),
        **{f'ver_{k}': (x, 0.88, 180) for k, x in TROFEOS_X.items()}, 'ver_amor': (PODIO[0], PODIO[1] - 0.95, 180),
    },
    'cuna': {
        'entrada': (2.2, 1.35, 0), 'centro_izq': (-0.9, -1.4, 0), 'centro_der': (0.6, -1.55, 0),
        'cuna_izq': (-0.8, 0.82, 180), 'cuna_der': (-0.2, 0.82, 180), 'comoda': (1.05, 1.12, 180),
        'mecedora': (-1.8, -0.3, 90, [(-1.1, -0.3)]),
    },
    'cuarto_el': {
        'entrada': (2.2, 1.35, 0), 'centro_izq': (-0.8, -1.35, 0), 'centro_der': (0.9, -1.4, 0),
        'escritorio': (-1.78, 0.3, -90, [(-1.78, -0.42)]), 'sillon': (0.55, 1.45, 0, [(0.55, 0.8)]),
    },
    'cuarto_ella': {
        'entrada': (2.2, 1.35, 0), 'centro_izq': (-0.5, -1.4, 0), 'centro_der': (1.0, -1.45, 0),
        'tocador': (-1.3, 1.15, 180, [(-1.3, 0.55)]), 'estudiar': (-1.83, -0.6, -90, [(-1.83, -1.3)]),
        'sillon': (0.55, 1.45, 0, [(0.55, 0.8)]),
    },
    'patio': {
        'entrada': (2.2, 1.35, 0), 'centro_izq': (-0.7, -1.3, 0), 'centro_der': (0.9, -1.35, 0),
        # En la banca, debajo de la ventana (como en el sofá: por delante y de lado)
        'banca_izq': (-0.2, 1.52, 0, [(-0.2, 0.95)]), 'banca_der': (0.4, 1.52, 0, [(0.4, 0.95)]),
        # Los sitios del perrito
        'perro_casita': (-1.9, 0.78, 0), 'perro_dormir': (-1.9, 1.5, 0), 'perro_plato': (-1.11, 1.25, 180), 'perro_agua': (-0.79, 1.25, 180),
        'perro_tina': (1.05, D / 2 - 0.7, 0), 'perro_juego': (0.2, -0.55, 0),
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
    'juegos': [
        dict(id='juegos_cuadro', tipo='cuadro', x=-W / 2 + 0.03, y=-0.9, z=1.8, rot=90),
        dict(id='juegos_cuadro2', tipo='cuadro', x=0.95, y=D / 2 - 0.03, z=1.95, rot=0),
        dict(id='juegos_peluche', tipo='peluche', x=-1.75, y=1.72, z=1.92, rot=0),
        dict(id='juegos_planta', tipo='piso', x=2.35, y=-1.7, z=0, rot=0),
        dict(id='juegos_lampara', tipo='piso', x=-2.35, y=-1.7, z=0, rot=0),
    ],
    'trofeos': [
        dict(id='trofeos_cuadro', tipo='cuadro', x=-0.42, y=D / 2 - 0.03, z=2.05, rot=0),
        dict(id='trofeos_cuadro2', tipo='cuadro', x=0.62, y=D / 2 - 0.03, z=2.05, rot=0),
        dict(id='trofeos_planta', tipo='piso', x=2.35, y=-1.7, z=0, rot=0),
        dict(id='trofeos_planta2', tipo='piso', x=-2.3, y=-1.85, z=0, rot=0),
    ],
    'cuna': [
        dict(id='cuna_cuadro', tipo='cuadro', x=-W / 2 + 0.03, y=-0.3, z=1.9, rot=90),
        dict(id='cuna_cuadro2', tipo='cuadro', x=1.05, y=D / 2 - 0.03, z=1.95, rot=0),
        dict(id='cuna_peluche', tipo='peluche', x=1.3, y=1.72, z=0.98, rot=0),
        dict(id='cuna_planta', tipo='piso', x=2.35, y=-1.7, z=0, rot=0),
        dict(id='cuna_lampara', tipo='piso', x=-2.35, y=-1.75, z=0, rot=0),
    ],
    # Los cuartos propios: cada uno decora el suyo (hartos sitios para dejarlo a su gusto)
    'cuarto_el': [
        dict(id='el_cuadro', tipo='cuadro', x=-1.85, y=D / 2 - 0.03, z=1.85, rot=0),
        dict(id='el_cuadro2', tipo='cuadro', x=0.55, y=D / 2 - 0.03, z=1.9, rot=0),
        dict(id='el_cuadro3', tipo='cuadro', x=-W / 2 + 0.03, y=-1.2, z=1.75, rot=90),
        dict(id='el_mesa', tipo='mesa', x=-2.4, y=0.88, z=0.77, rot=90),
        dict(id='el_mesa2', tipo='mesa', x=1.4, y=1.8, z=0.56, rot=0),
        dict(id='el_peluche', tipo='peluche', x=0.85, y=1.55, z=0.62, rot=0),
        dict(id='el_planta', tipo='piso', x=2.35, y=-1.7, z=0, rot=0),
        dict(id='el_lampara', tipo='piso', x=-2.35, y=-1.7, z=0, rot=0),
        dict(id='el_piso3', tipo='piso', x=-0.1, y=1.7, z=0, rot=0),
    ],
    'cuarto_ella': [
        dict(id='ella_cuadro', tipo='cuadro', x=-W / 2 + 0.03, y=1.2, z=1.75, rot=90),
        dict(id='ella_cuadro2', tipo='cuadro', x=1.35, y=D / 2 - 0.03, z=2.3, rot=0),
        dict(id='ella_cuadro3', tipo='cuadro', x=0.55, y=D / 2 - 0.03, z=2.35, rot=0),
        dict(id='ella_mesa', tipo='mesa', x=-0.85, y=1.85, z=0.79, rot=0),
        dict(id='ella_mesa2', tipo='mesa', x=-2.4, y=-1.05, z=0.77, rot=90),
        dict(id='ella_peluche', tipo='peluche', x=0.85, y=1.55, z=0.62, rot=0),
        dict(id='ella_planta', tipo='piso', x=2.35, y=-1.7, z=0, rot=0),
        dict(id='ella_lampara', tipo='piso', x=-2.35, y=-1.75, z=0, rot=0),
        dict(id='ella_piso3', tipo='piso', x=1.45, y=1.65, z=0, rot=0),
    ],
}
SITIOS_DECO['patio'] = [
    dict(id='patio_planta', tipo='piso', x=1.55, y=-1.8, z=0, rot=0),
    dict(id='patio_planta2', tipo='piso', x=2.35, y=-0.35, z=0, rot=0),
    dict(id='patio_planta3', tipo='piso', x=-0.3, y=-1.8, z=0, rot=0),
]
# Marcas: dónde pone el juego lo que aparece solo (los trofeos ganados, la bebé en la cuna, por dónde entra la cigüeña)
MARCAS = {
    'trofeos': {**{k: dict(x=x, y=TROFEOS_Y, z=1.085) for k, x in TROFEOS_X.items()}, 'amor': dict(x=PODIO[0], y=PODIO[1], z=0.52)},
    'cuna': {'bebe': dict(x=-0.72, y=D / 2 - 0.6, z=0.585), 'ventana': dict(x=-W / 2 + 0.2, y=1.2, z=1.75)},
    'patio': {'tina': dict(x=1.05, y=D / 2 - 0.7, z=0.24), 'cuido': dict(x=-1.11, y=D / 2 - 0.45, z=0.09), 'dormir': dict(x=-1.9, y=D / 2 - 0.62, z=0.1)},
}
# Dónde se pegan las notas (en la nevera) y dónde aparecen los regalos recibidos
NOTAS = dict(cuarto='cocina', x=1.15, y=D / 2 - 0.84, z=1.35, ancho=0.7, alto=0.9)


AMPLIACION = {'juegos', 'trofeos', 'cuna', 'cuarto_el', 'cuarto_ella', 'patio'}
# El perrito se ve de cerca (modo mascota): no se le baja el suavizado
SIN_ALIGERAR = {'perro'}


def aligerar(coll):
    """Las piezas chiquitas no necesitan tanta subdivisión: el cuarto pesa menos en el celular."""
    for o in coll.objects:
        if o.type == 'MESH' and max(o.dimensions) < 0.4:
            for m in o.modifiers:
                if m.type == 'SUBSURF':
                    # (los puntitos de los dados y los botones ni se notan sin suavizar)
                    m.levels = 0 if max(o.dimensions) < 0.08 else min(m.levels, 1)


def construir(key):
    coll = clay.collection(f'Casa | {key}')
    CONSTRUIR[key](coll)
    if key in AMPLIACION:
        aligerar(coll)
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
