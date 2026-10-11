"""Nuestro Hogar · granja: las máquinas de producción (la parte fija; lo que se mueve lo sigue animando el juego).

Cada pieza reemplaza el grupo «fijo» de figura() en escenas-produccion.ts con las mismas medidas (≈1 m, base en z=0,
frente hacia -y, que en three.js mira a la cámara). Los rotores, rodillos, brocas, manivelas, engranajes y el brillo de
los portales siguen siendo del juego, en los mismos sitios.

Uso: blender -b -P granja_maquinas.py -- <carpeta_salida> [claves]
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
from granja_muebles import bola, caja, cilindro, mat, metal, piedra, tubo, vidrio  # noqa: E402

RNG = np.random.default_rng(53)
MAD = lambda: madera('máquina', '#B7885B')  # noqa: E731
OSC = lambda: madera('máquina oscura', '#6E5542')  # noqa: E731
COBRE = lambda: metal('cobre', '#BD8962')  # noqa: E731
HIERRO = lambda: metal('hierro máquina', '#647D81')  # noqa: E731
CLARO = lambda: mat('claro máquina', '#C8D4C2', 0.5)  # noqa: E731
ORO = lambda: metal('oro máquina', '#D6BD80')  # noqa: E731


def C(x, y, z):
    """De three.js (x, y arriba, z al frente) a Blender (x, -z, y)."""
    return (x, -z, y)


def H(w, h, d):
    """Medidas completas de three.js (ancho, alto, fondo) a medias de Blender."""
    return (w / 2, d / 2, h / 2)


def bloque(coll, nombre, medidas, centro, material, p=8, sub=1):
    return caja(coll, nombre, C(*centro), H(*medidas), material, p=p, sub=sub)


def cil(coll, nombre, r, alto, centro, material, seg=14, r2=None):
    """Cilindro vertical centrado como en three.js (centro a media altura)."""
    x, y, z = centro
    return cilindro(coll, nombre, C(x, y - alto / 2, z), r, alto, material, seg=seg, r2=r2)


def remaches(coll, nombre, xs, y, z, material=None):
    for k, x in enumerate(xs):
        bola(coll, f'{nombre} {k}', C(x, y, z), 0.022, material or ORO(), n=2, sub=0)


# ---------------------------------------------------------------- cofres

def _cofre(coll, tono):
    m_metal = COBRE() if tono == 'cobre' else HIERRO()
    bloque(coll, 'cofre cuerpo', (0.83, 0.48, 0.62), (0, 0.3, 0), MAD(), p=8)
    for k in range(3):
        bloque(coll, f'cofre tabla {k}', (0.8, 0.012, 0.015), (0, 0.13 + k * 0.12, 0.316), OSC(), p=12, sub=0)
    o = clay.lathe('cofre tapa', [(0.0, -0.44), (0.33, -0.44), (0.33, 0.44), (0.0, 0.44)], coll, madera('tapa cofre', '#C9A06E'), segments=16, subsurf=1)
    o.location = C(0, 0.54, 0)
    o.rotation_euler = (0, math.pi / 2, 0)
    o.scale = (0.45, 1.0, 1)
    for x in (-0.31, 0.31):
        bloque(coll, f'cofre fleje {x}', (0.07, 0.55, 0.65), (x, 0.35, 0), m_metal, p=10)
        o = clay.lathe(f'cofre fleje tapa {x}', [(0.0, -0.035), (0.34, -0.035), (0.34, 0.035), (0.0, 0.035)], coll, m_metal, segments=16, subsurf=0)
        o.location = C(x, 0.54, 0)
        o.rotation_euler = (0, math.pi / 2, 0)
        o.scale = (0.47, 1.0, 1)
        remaches(coll, f'remache cofre {x}', [x], 0.42, 0.33)
    bloque(coll, 'cerradura', (0.16, 0.2, 0.06), (0, 0.5, 0.345), ORO(), p=8)
    bloque(coll, 'ojo cerradura', (0.035, 0.06, 0.02), (0, 0.49, 0.378), mat('hollín', '#2B2422', 0.9), p=12, sub=0)
    for s in (-1, 1):
        o = clay.lathe(f'asa cofre {s}', [(0.06, -0.012), (0.075, 0.0), (0.06, 0.012)], coll, m_metal, segments=12, subsurf=0, cap_bottom=False, cap_top=False)
        o.location = C(s * 0.43, 0.38, 0)
        o.rotation_euler = (0, math.pi / 2, 0)


def m_cofre_cobre(coll):
    _cofre(coll, 'cobre')


def m_cofre_hierro(coll):
    _cofre(coll, 'hierro')


# ---------------------------------------------------------------- portales

def _portal(coll, color):
    piedra_p = piedra('portal', '#A1A397')
    bloque(coll, 'portal base', (1.86, 0.14, 0.87), (0, 0.07, 0), piedra('portal base', '#8B9585'), p=8)
    for k in range(5):
        bloque(coll, f'portal escalón {k}', (0.34, 0.05, 0.2), (-0.7 + k * 0.35, 0.165, 0.33), piedra('portal base', '#8B9585'), p=6)
    for x in (-0.76, 0.76):
        bloque(coll, f'pilar {x}', (0.28, 1.85, 0.43), (x, 0.98, 0), piedra_p, p=10)
        for y in (0.5, 0.94, 1.37):
            bloque(coll, f'anillo pilar {x}{y}', (0.31, 0.065, 0.46), (x, y, 0), ORO(), p=10)
        for k in range(3):
            bola(coll, f'runa {x}{k}', C(x, 0.72 + k * 0.22, 0.22), (0.035, 0.012, 0.05), luz(f'runa {color}', color, 1.2), n=2, sub=0)
        clay.blob(f'gema portal {x}', C(x, 1.57, 0.26), (0.12, 0.12, 0.16), coll, luz(f'gema {color}', color, 1.4), n=3, subsurf=0, p=1.2)
        for k in range(4):
            a = k * math.pi / 2
            bola(coll, f'hiedra pilar {x}{k}', C(x + math.cos(a) * 0.16, 0.25 + k * 0.08, math.sin(a) * 0.23), (0.07, 0.05, 0.06), mat('hoja', '#5FA85A', 0.55), n=2, sub=0)
    o = clay.lathe('arco portal', [(0.62, -0.08), (0.92, -0.08), (0.92, 0.08), (0.62, 0.08), (0.62, -0.08)], coll, piedra('arco portal', '#AFB4A3'),
                   segments=32, subsurf=1, cap_bottom=False, cap_top=False)
    o.location = C(0, 1.6, 0)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.scale = (1, 0.54, 1)
    clay.blob('clave arco', C(0, 2.1, 0.08), (0.12, 0.08, 0.14), coll, ORO(), n=3, subsurf=1)


def m_portal_verdia(coll):
    _portal(coll, '#97D398')


def m_portal_senda(coll):
    _portal(coll, '#C5B9E1')


def m_portal_otro(coll):
    _portal(coll, '#AA97CE')


# ---------------------------------------------------------------- nave, aspersor, recuperadora

def m_nave_exploradora(coll):
    bloque(coll, 'plataforma nave', (2.65, 0.09, 2.65), (0, 0.045, 0), piedra('plataforma', '#87948B'), p=10)
    for x in (-1.12, 1.12):
        for z in (-1.12, 1.12):
            bloque(coll, f'luz plataforma {x}{z}', (0.3, 0.02, 0.12), (x, 0.1, z), luz('luz plataforma', '#FFD88A', 1.4), p=10, sub=0)
    clay.blob('casco nave', C(0, 0.8, 0), (0.78, 1.13, 0.49), coll, laca('casco nave', '#C8D4C2', 0.3), n=6, subsurf=1)
    clay.blob('cabina nave', C(0, 1.13, 0.18), (0.51, 0.61, 0.24), coll, vidrio('cabina', '#759DA8'), n=5, subsurf=1)
    for k in range(6):
        a = k * math.pi / 3
        bola(coll, f'remache casco {k}', C(math.cos(a) * 0.7, 0.85, math.sin(a) * 1.0), 0.03, ORO(), n=2, sub=0)
    for x in (-1, 1):
        o = bloque(coll, f'ala {x}', (0.63, 0.13, 1.1), (0, 0, 0), COBRE(), p=8)
        o.location = C(x * 0.83, 0.59, -0.07)
        o.rotation_euler = (0, -x * 0.13, 0)
        o = cil(coll, f'motor {x}', 0.22, 0.51, (0, 0, 0), HIERRO(), seg=12)
        o.location = C(x * 0.74, 0.68 - 0.255, -0.48)
        o.rotation_euler = (math.pi / 2, 0, 0)
        bola(coll, f'tobera {x}', C(x * 0.74, 0.68, -0.76), (0.16, 0.06, 0.16), luz('tobera', '#A3DFE3', 1.6), n=3, sub=0)
        bloque(coll, f'pata nave {x}', (0.12, 0.39, 0.13), (x * 0.55, 0.29, 0.63), HIERRO(), p=10)
        bloque(coll, f'pata nave atrás {x}', (0.12, 0.39, 0.13), (x * 0.55, 0.29, -0.63), HIERRO(), p=10)
    bloque(coll, 'aleta nave', (0.09, 0.55, 0.64), (0, 1.22, -0.83), COBRE(), p=8)
    cil(coll, 'eje rotor', 0.08, 0.3, (0, 1.5, -0.35), HIERRO(), seg=10)


def _aspersor(coll, tono):
    m = COBRE() if tono == 'cobre' else HIERRO()
    cil(coll, 'base aspersor', 0.22, 0.14, (0, 0.09, 0), m, seg=16, r2=0.18)
    cil(coll, 'tubo aspersor', 0.065, 0.53, (0, 0.36, 0), m, seg=10)
    for k in range(3):
        cil(coll, f'anillo aspersor {k}', 0.08, 0.03, (0, 0.2 + k * 0.15, 0), ORO(), seg=10)
    cil(coll, 'llave aspersor', 0.04, 0.12, (0.12, 0.22, 0), m, seg=8).rotation_euler = (0, math.pi / 2, 0)
    for k in range(6):
        a = k * 1.05
        bola(coll, f'pasto aspersor {k}', C(math.cos(a) * 0.26, 0.04, math.sin(a) * 0.26), (0.08, 0.08, 0.05), mat('hoja', '#5FA85A', 0.55), n=2, sub=0)


def m_aspersor_cobre(coll):
    _aspersor(coll, 'cobre')


def m_aspersor_hierro(coll):
    _aspersor(coll, 'hierro')


def _recuperadora(coll, tono):
    bloque(coll, 'recuperadora cuerpo', (0.86, 0.55, 0.74), (0, 0.3, 0), laca(f'recuperadora {tono}', tono, 0.45), p=8)
    bloque(coll, 'recuperadora tapa', (0.9, 0.08, 0.78), (0, 0.6, 0), OSC(), p=8)
    o = clay.lathe('tolva recuperadora', [(0.24, -0.17), (0.44, 0.17), (0.4, 0.17), (0.2, -0.15)], coll, metal('tolva', '#9AA3AB'), segments=4, subsurf=0,
                   cap_bottom=False, cap_top=False)
    o.location = C(0, 0.82, 0)
    o.rotation_euler = (0, 0, math.pi / 4)
    o = bloque(coll, 'rampa recuperadora', (0.4, 0.05, 0.36), (0, 0, 0), HIERRO(), p=10)
    o.location = C(0, 0.16, 0.5)
    o.rotation_euler = (-0.4, 0, 0)
    for k, col in enumerate(('#C8743C', '#B7C0C6', '#B7885B')):
        bola(coll, f'resto {k}', C(-0.1 + k * 0.1, 0.12, 0.62), (0.06, 0.06, 0.05), laca(f'resto {col}', col, 0.4), n=2, sub=0)
    o = clay.lathe('signo reciclar', [(0.105, -0.012), (0.13, 0.0), (0.105, 0.012)], coll, laca('signo', '#7FC77A', 0.4), segments=16, subsurf=0,
                   cap_bottom=False, cap_top=False)
    o.location = C(0, 0.36, 0.375)
    o.rotation_euler = (math.pi / 2, 0, 0)
    for s in (-1, 1):
        bloque(coll, f'patita {s}', (0.12, 0.06, 0.7), (s * 0.36, 0.02, 0), OSC(), p=8)
    remaches(coll, 'remache recuperadora', (-0.36, 0.36), 0.5, 0.375)


def m_recuperadora_cobre(coll):
    _recuperadora(coll, '#C38A5C')


def m_recuperadora_hierro(coll):
    _recuperadora(coll, '#8E9AA3')


def m_recuperadora_astral(coll):
    _recuperadora(coll, '#8D78C9')
    clay.blob('gema astral', C(0.32, 0.75, 0.3), (0.1, 0.1, 0.13), coll, luz('gema astral', '#C9A8FF', 1.2), n=3, subsurf=0, p=1.2)


# ---------------------------------------------------------------- hornos y fundición

def m_alto_horno(coll):
    bloque(coll, 'base horno alto', (0.95, 0.16, 0.95), (0, 0.08, 0), piedra('base horno', '#7B6F66'), p=8)
    for y in range(4):
        r = 0.42 - y * 0.04
        cil(coll, f'piso ladrillo {y}', r, 0.3, (0, 0.31 + y * 0.3, 0), piedra(f'ladrillo {y % 2}', '#A8574A' if y % 2 else '#B9644F'), seg=10)
        for k in range(10):
            a = k * 2 * math.pi / 10 + y * 0.3
            bloque(coll, f'junta {y}{k}', (0.012, 0.28, 0.02), (math.cos(a) * r, 0.31 + y * 0.3, math.sin(a) * r), mat('junta', '#E6D8B8', 0.8), p=12, sub=0)
    bloque(coll, 'boca horno alto', (0.36, 0.3, 0.05), (0, 0.42, 0.38), mat('hollín', '#2B2422', 0.9), p=8)
    bloque(coll, 'fuego horno alto', (0.28, 0.2, 0.06), (0, 0.38, 0.4), luz('fuego', '#F2A24E', 3.0), p=8, sub=0)
    cil(coll, 'chimenea horno alto', 0.12, 0.6, (0.22, 1.6, -0.14), HIERRO(), seg=10)
    cil(coll, 'boca chimenea', 0.15, 0.06, (0.22, 1.92, -0.14), HIERRO(), seg=10)
    for y in (0.6, 1.05):
        o = clay.lathe(f'cincho {y}', [(0.42, -0.02), (0.46, 0.0), (0.42, 0.02)], coll, HIERRO(), segments=16, subsurf=0, cap_bottom=False, cap_top=False)
        o.location = C(0, y, 0)


def m_trituradora(coll):
    bloque(coll, 'trituradora cuerpo', (0.84, 0.5, 0.7), (0, 0.27, 0), HIERRO(), p=8)
    bloque(coll, 'trituradora tapa', (0.62, 0.08, 0.5), (0, 0.55, 0), OSC(), p=8)
    o = clay.lathe('tolva trituradora', [(0.22, -0.18), (0.42, 0.18), (0.38, 0.18), (0.18, -0.16)], coll, metal('tolva', '#9AA3AB'), segments=4, subsurf=0,
                   cap_bottom=False, cap_top=False)
    o.location = C(0, 0.82, 0)
    o.rotation_euler = (0, 0, math.pi / 4)
    bloque(coll, 'bandeja trituradora', (0.4, 0.05, 0.3), (0, 0.12, 0.45), COBRE(), p=8)
    for k in range(4):
        bola(coll, f'grava {k}', C(-0.12 + k * 0.08, 0.17, 0.45), (0.04, 0.04, 0.03), piedra('grava', '#9C968C'), n=2, sub=0)
    remaches(coll, 'remache trituradora', (-0.36, -0.12, 0.12, 0.36), 0.45, 0.355)
    for s in (-1, 1):
        bloque(coll, f'pata trituradora {s}', (0.1, 0.06, 0.66), (s * 0.36, 0.02, 0), OSC(), p=8)


def m_taladro_vapor(coll):
    for x, z in ((-0.4, -0.4), (0.4, -0.4), (-0.4, 0.4), (0.4, 0.4)):
        o = bloque(coll, f'pata taladro {x}{z}', (0.08, 1.5, 0.08), (0, 0, 0), HIERRO(), p=10)
        o.location = C(x * 0.8, 0.75, z * 0.8)
        o.rotation_euler = (-z * 0.12, x * 0.12, 0)
    bloque(coll, 'corona taladro', (0.7, 0.08, 0.7), (0, 1.45, 0), HIERRO(), p=8)
    cil(coll, 'caldera', 0.26, 0.5, (0.3, 0.3, 0.25), COBRE(), seg=14)
    bola(coll, 'domo caldera', C(0.3, 0.56, 0.25), (0.26, 0.26, 0.16), COBRE(), n=4)
    cil(coll, 'tubo vapor', 0.05, 0.4, (0.3, 0.85, 0.25), HIERRO(), seg=8)
    bola(coll, 'manómetro', C(0.3, 0.38, 0.52), (0.07, 0.02, 0.07), mat('esfera', '#F6F1E6', 0.5), n=3, sub=0)
    bloque(coll, 'base taladro', (0.5, 0.05, 0.5), (0, 0.03, 0), madera('base', '#6B5A4C'), p=8)
    for k in range(5):
        bola(coll, f'tierra taladro {k}', C(math.cos(k * 1.3) * 0.32, 0.04, math.sin(k * 1.3) * 0.32), (0.08, 0.08, 0.04), mat('tierra', '#7A5A3E', 0.95), n=2, sub=0)


def m_ensambladora(coll):
    bloque(coll, 'ensambladora mesa', (0.9, 0.5, 0.6), (0, 0.27, 0), HIERRO(), p=8)
    bloque(coll, 'cinta', (0.92, 0.06, 0.34), (0, 0.55, 0.08), OSC(), p=8)
    for k in range(5):
        bloque(coll, f'tablilla cinta {k}', (0.04, 0.065, 0.32), (-0.36 + k * 0.18, 0.56, 0.08), metal('cinta', '#5A5F66'), p=12, sub=0)
    bloque(coll, 'poste brazo', (0.1, 0.6, 0.1), (0.32, 0.85, -0.18), HIERRO(), p=10)
    for k, col in enumerate(('#C8743C', '#B7C0C6')):
        bloque(coll, f'pieza cinta {k}', (0.1, 0.07, 0.1), (-0.25 + k * 0.3, 0.62, 0.08), laca(f'pieza {col}', col, 0.4), p=8)
    bloque(coll, 'tablero ensambladora', (0.3, 0.2, 0.02), (0.2, 0.32, 0.31), CLARO(), p=10)
    for k in range(3):
        bola(coll, f'botón {k}', C(0.12 + k * 0.08, 0.32, 0.325), 0.02, laca(f'botón {k}', ('#E4566B', '#F2C94C', '#7FB069')[k], 0.3), n=2, sub=0)


def _horno(coll, tipo):
    bloque(coll, 'base horno', (0.83, 0.17, 0.79), (0, 0.09, 0), piedra('base horno', '#8A9188'), p=8)
    cuerpo = HIERRO() if tipo == 'fundidora' else piedra('horno', '#A2A598')
    bloque(coll, 'cuerpo horno', (0.75, 0.65, 0.68), (0, 0.49, 0), cuerpo, p=8)
    if tipo != 'fundidora':
        for i in range(4):
            for j in range(3):
                bola(coll, f'piedra horno {i}{j}', C(-0.26 + j * 0.26 + (0.13 if i % 2 else 0), 0.25 + i * 0.15, 0.345), (0.1, 0.02, 0.06),
                     piedra(f'piedra {(i + j) % 2}', ('#B3AA9E', '#958B80')[(i + j) % 2]), n=2, sub=0)
    bloque(coll, 'boca horno', (0.42, 0.3, 0.04), (0, 0.4, 0.36), mat('hollín', '#2B2422', 0.9), p=8)
    bloque(coll, 'fuego horno', (0.32, 0.17, 0.043), (0, 0.34, 0.385), luz('fuego', '#F2A24E', 3.0), p=8, sub=0)
    for x in (-0.13, 0, 0.13):
        bloque(coll, f'reja {x}', (0.035, 0.27, 0.06), (x, 0.41, 0.405), HIERRO(), p=12, sub=0)
    bloque(coll, 'techo horno', (0.87, 0.12, 0.8), (0, 0.86, 0), HIERRO(), p=8)
    cil(coll, 'chimenea horno', 0.13, 0.54, (-0.22, 1.15, -0.13), HIERRO(), seg=10)
    cil(coll, 'sombrero chimenea', 0.17, 0.05, (-0.22, 1.44, -0.13), HIERRO(), seg=10)
    if tipo == 'forja':
        bloque(coll, 'yunque forja', (0.48, 0.11, 0.38), (0.05, 1.0, 0), metal('yunque', '#536271'), p=6)
        bloque(coll, 'cintura yunque', (0.21, 0.17, 0.24), (0.05, 0.94, 0), metal('yunque', '#536271'), p=6)
        bloque(coll, 'herradura', (0.14, 0.02, 0.1), (0.1, 1.07, 0.05), luz('hierro caliente', '#FF8A3D', 2.0), p=4)
    if tipo == 'fundidora':
        o = clay.lathe('crisol', [(0.0, 0.0), (0.1, 0.0), (0.13, 0.12), (0.0, 0.12)], coll, metal('crisol', '#8D949C'), segments=12, subsurf=0)
        o.location = C(0.22, 0.92, 0.15)
        bola(coll, 'metal fundido', C(0.22, 1.04, 0.15), (0.1, 0.1, 0.02), luz('metal fundido', '#FFB347', 3.0), n=3, sub=0)


def m_horno(coll):
    _horno(coll, 'horno')


def m_fundidora(coll):
    _horno(coll, 'fundidora')


def m_forja(coll):
    _horno(coll, 'forja')


# ---------------------------------------------------------------- mesas: banco de trabajo, cocina, telar

def _mesa(coll, tipo):
    for x in (-0.33, 0.33):
        for z in (-0.27, 0.27):
            bloque(coll, f'pata mesa {x}{z}', (0.09, 0.61, 0.09), (x, 0.32, z), OSC(), p=10)
    bloque(coll, 'tablero mesa', (0.88, 0.12, 0.74), (0, 0.66, 0), MAD(), p=8)
    bloque(coll, 'repisa mesa', (0.7, 0.08, 0.54), (0, 0.2, 0), MAD(), p=8)
    if tipo == 'cocina':
        bloque(coll, 'plancha', (0.74, 0.07, 0.62), (0, 0.755, 0), HIERRO(), p=8)
        for x in (-0.19, 0.19):
            cil(coll, f'hornilla {x}', 0.13, 0.03, (x, 0.802, 0), OSC(), seg=14)
            clay.lathe(f'olla {x}', [(0.0, 0.0), (0.105, 0.0), (0.11, 0.15), (0.12, 0.17), (0.0, 0.16)], coll, COBRE(), segments=14, subsurf=1).location = C(x, 0.815, 0)
            bola(coll, f'tapa olla {x}', C(x, 0.99, 0), (0.1, 0.1, 0.03), COBRE(), n=3, sub=0)
        bloque(coll, 'salpicadero', (0.74, 0.25, 0.09), (0, 0.82, -0.29), CLARO(), p=8)
        for k in range(3):
            o = cil(coll, f'cucharón {k}', 0.012, 0.22, (-0.2 + k * 0.2, 0.86, -0.24), OSC(), seg=6)
            bola(coll, f'cuchara {k}', C(-0.2 + k * 0.2, 0.74, -0.24), (0.035, 0.02, 0.03), COBRE(), n=2, sub=0)
        for k in range(3):
            frutas = ('#E4566B', '#F2C94C', '#7FB069')
            bola(coll, f'verdura repisa {k}', C(-0.2 + k * 0.2, 0.29, 0.05), 0.06, laca(f'verdura {k}', frutas[k], 0.4), n=2, sub=0)
    elif tipo == 'telar':
        for x in (-0.3, 0.3):
            bloque(coll, f'marco telar {x}', (0.08, 0.68, 0.09), (x, 0.98, 0), OSC(), p=10)
        bloque(coll, 'travesaño telar', (0.69, 0.09, 0.1), (0, 1.33, 0), MAD(), p=8)
        bloque(coll, 'tela', (0.55, 0.47, 0.025), (0, 1.02, 0.045), tela('tela telar', '#EEE0BE'), p=10, sub=0)
        for i in range(9):
            bloque(coll, f'hilo {i}', (0.012, 0.46, 0.03), (-0.25 + i * 0.06, 1.02, 0.065), tela(f'hilo {i % 2}', '#B99077' if i % 2 else '#8DABB4'), p=12, sub=0)
        for k in range(3):
            o = clay.lathe(f'ovillo {k}', [(0.0, 0.0), (0.06, 0.02), (0.07, 0.07), (0.0, 0.1)], coll, tela(f'ovillo {k}', ('#E58FA6', '#8EC5F0', '#F2C94C')[k]),
                           segments=10, subsurf=1)
            o.location = C(-0.2 + k * 0.2, 0.24, 0.1)
    else:
        bloque(coll, 'tabla banco', (0.32, 0.06, 0.36), (-0.19, 0.76, -0.04), CLARO(), p=8)
        bloque(coll, 'prensa banco', (0.08, 0.09, 0.34), (0.18, 0.81, 0.03), HIERRO(), p=8)
        bloque(coll, 'mango banco', (0.11, 0.07, 0.23), (0.18, 0.8, 0.19), MAD(), p=8)
        o = bloque(coll, 'martillo banco', (0.24, 0.03, 0.03), (0, 0, 0), MAD(), p=10)
        o.location = C(-0.2, 0.8, 0.2)
        o.rotation_euler = (0, 0, 0.4)
        bloque(coll, 'caja herramientas', (0.3, 0.14, 0.2), (0.15, 0.31, 0), laca('caja herramientas', '#C9563F', 0.4), p=8)


def m_banco_trabajo(coll):
    _mesa(coll, 'banco')


def m_cocina(coll):
    _mesa(coll, 'cocina')


def m_telar(coll):
    _mesa(coll, 'telar')


# ---------------------------------------------------------------- barriles y molino

def _barril(coll, tipo):
    clay.lathe('barril', [(0.0, 0.06), (0.3, 0.06), (0.35, 0.4), (0.3, 0.74), (0.0, 0.74)], coll, MAD(), segments=18, subsurf=1)
    for y in (0.15, 0.4, 0.65):
        r = 0.3 + 0.05 * (1 - abs(y - 0.4) / 0.34)
        o = clay.lathe(f'cincho barril {y}', [(r, -0.022), (r + 0.015, 0.0), (r, 0.022)], coll, HIERRO(), segments=18, subsurf=0, cap_bottom=False, cap_top=False)
        o.location = C(0, y, 0)
    cil(coll, 'tapa barril', 0.31, 0.05, (0, 0.77, 0), madera('tapa', '#CBA270'), seg=18)
    for s in (-1, 1):
        bloque(coll, f'cuña barril {s}', (0.12, 0.08, 0.5), (s * 0.24, 0.04, 0), OSC(), p=8)
    if tipo == 'prensa':
        for x in (-0.39, 0.39):
            bloque(coll, f'marco prensa {x}', (0.07, 1.09, 0.13), (x, 0.58, 0), OSC(), p=10)
        bloque(coll, 'travesaño prensa', (0.89, 0.09, 0.18), (0, 1.1, 0), OSC(), p=8)
        cil(coll, 'tornillo prensa', 0.045, 0.39, (0, 0.99, 0), HIERRO(), seg=8)
        for k in range(5):
            cil(coll, f'rosca {k}', 0.06, 0.015, (0, 0.84 + k * 0.07, 0), HIERRO(), seg=8)
        for k in range(4):
            bola(coll, f'uva prensa {k}', C(-0.12 + k * 0.08, 0.82, 0.12), 0.04, laca('uva', '#6B3F7A', 0.3), n=2, sub=0)
    else:
        cil(coll, 'airlock', 0.07, 0.14, (0, 0.88, 0), ORO(), seg=10)
        bola(coll, 'burbuja', C(0, 0.98, 0), 0.04, vidrio('burbuja', '#DDF0F2'), n=2, sub=0)
        bloque(coll, 'grifo', (0.07, 0.08, 0.14), (0, 0.31, 0.39), HIERRO(), p=8)
        bola(coll, 'gota grifo', C(0, 0.24, 0.44), (0.02, 0.02, 0.03), luz('gota', '#F2C94C', 0.6), n=2, sub=0)


def m_fermentador(coll):
    _barril(coll, 'fermentador')


def m_prensa(coll):
    _barril(coll, 'prensa')


def m_molino_artesanal(coll):
    bloque(coll, 'molino base', (0.64, 0.42, 0.59), (0, 0.27, 0), MAD(), p=8)
    for k in range(3):
        bloque(coll, f'molino tabla {k}', (0.62, 0.012, 0.012), (0, 0.13 + k * 0.12, 0.3), OSC(), p=12, sub=0)
    cil(coll, 'piedra molino', 0.35, 0.11, (0, 0.54, 0), piedra('molino', '#B5B6A7'), seg=20)
    for k in range(8):
        a = k * math.pi / 4
        bloque(coll, f'estría {k}', (0.3, 0.012, 0.02), (math.cos(a) * 0.16, 0.6, math.sin(a) * 0.16), piedra('estría', '#8E8F82'), p=12, sub=0)
    cil(coll, 'eje molino', 0.12, 0.25, (0, 0.69, 0), HIERRO(), seg=10)
    bloque(coll, 'boca molino', (0.21, 0.16, 0.22), (0, 0.32, 0.38), OSC(), p=8)
    o = clay.lathe('costalito', [(0.0, 0.0), (0.1, 0.0), (0.11, 0.12), (0.06, 0.18), (0.0, 0.18)], coll, tela('costal', '#D8C49C'), segments=10, subsurf=1)
    o.location = C(0, 0.0, 0.5)
    bola(coll, 'harina', C(0, 0.19, 0.5), (0.07, 0.07, 0.03), mat('harina', '#F6F1E6', 0.9), n=2, sub=0)


def m_maquina(coll):
    """La máquina genérica (lo que no tiene figura propia): caja de hierro con tapa, chimenea y pilotos."""
    bloque(coll, 'maquina cuerpo', (0.74, 0.69, 0.67), (0, 0.42, 0), HIERRO(), p=8)
    bloque(coll, 'maquina tapa', (0.61, 0.08, 0.57), (0, 0.8, 0), CLARO(), p=8)
    cil(coll, 'maquina chimenea', 0.11, 0.23, (-0.22, 0.94, -0.12), HIERRO(), seg=10)
    remaches(coll, 'remache maquina', (-0.32, 0.32), 0.7, 0.34)
    for k in range(2):
        bola(coll, f'piloto maquina {k}', C(0.25 - k * 0.08, 0.72, 0.34), 0.025, luz(f'piloto {k}', ('#7FC77A', '#F2C94C')[k], 1.5), n=2, sub=0)
    for s in (-1, 1):
        bloque(coll, f'pata maquina {s}', (0.12, 0.08, 0.6), (s * 0.3, 0.04, 0), OSC(), p=8)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Máquinas granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_maquinas.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
