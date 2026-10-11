"""Nuestro Hogar · granja: decoración de los cuatro festivales del Pueblo del Sol.

Encuentro de las Semillas (primavera), Ronda de la Fuente (verano), Mesa de la Cosecha (otoño) y Velada de los
Recuerdos (invierno). Cada festival tiene seis piezas con su tema:

  poste_<tema>   poste de 3,2 m con cintas en espiral y remate; la tira se amarra a la argolla (z = 2,95)
  tira_<tema>    tramo de 2 m de la guirnalda (de x=0 a x=2, cordel en z=0): banderines, farolillos, hojas o bombillos
  arco_<tema>    arco de bienvenida sobre la calle (de x=-2,1 a x=2,1) con el emblema del festival
  centro_<tema>  lo principal: puesto de semillas, tarima de la ronda, mesa de la cosecha o árbol de los recuerdos
  extra_<tema>   rincón de adorno: carretilla con plántulas, cojines y tambores, espantapájaros, muñeco de nieve
  borde_<tema>   corona para la repisa de piedra de la fuente (radio 2,09 alrededor del origen)

Medidas del juego, en el origen, con la base en z=0 y el frente hacia -y (en three.js mira a la cámara). Se exporta en
UN solo GLB (granja_festivales.glb) con un vacío «m_<clave>» por pieza, igual que granja_muebles.py.

Uso: blender -b -P granja_festivales.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bmesh  # noqa: E402
import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import laca, luz, madera, tela  # noqa: E402
from granja_muebles import CHOCO, MAD, OSC, bola, caja, cilindro, frasco, mat, metal, piedra, tubo, vidrio, _costal  # noqa: E402

RNG = np.random.default_rng(11)
TEMAS = {
    'primavera': ('#F07FA6', '#F5C842', '#5DBF8E', '#A58BE0', '#FFF4E0'),
    'verano': ('#F28C45', '#F7C948', '#4FC1C6', '#E4566B', '#FFF4E0'),
    'otono': ('#D9682B', '#B5432F', '#E0A93B', '#8A5A3B', '#7FA04A'),
    'invierno': ('#3B6FB6', '#F2F4F8', '#E8C66A', '#A3443A', '#7FB0D9'),
}
HOJA = lambda: mat('hoja', '#5FA85A', 0.55)  # noqa: E731
HOJA_OSC = lambda: mat('hoja oscura', '#3F7A3C', 0.6)  # noqa: E731
PAJA = lambda: mat('paja', '#E2C26A', 0.9, noise=dict(scale=60, strength=0.6, distance=0.006))  # noqa: E731
PINO = lambda: tela('pino', '#2F6B45')  # noqa: E731
BOMBILLOS = ('#FFE7A8', '#FFC857', '#FF8A6B', '#9CC8FF', '#9BE39A')


# ---------------------------------------------------------------- ayudas

def malla(nombre, verts, caras, coll, material, sub=1):
    o = clay.make_mesh_object(nombre, verts, caras, coll, material=material)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    o.data.shade_smooth()
    if sub:
        clay.add_subsurf(o, sub, sub + 1)
    return o


def triangulo(coll, nombre, c, w, largo, material, t=0.012, inflado=0.022, giro=0.0):
    """Banderín de fieltro: triángulo inflado que cuelga del cordel (borde de arriba en c)."""
    x, y, z = c
    pts = []
    for s in (-1, 1):
        pts += [(-w / 2, s * t, 0.0), (w / 2, s * t, 0.0), (0.0, s * t, -largo), (0.0, s * (t + inflado), -largo * 0.36)]
    caras = [(0, 1, 3), (1, 2, 3), (2, 0, 3), (4, 7, 5), (5, 7, 6), (6, 7, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 4, 0)]
    # Sin subdivisión: con tan pocos vértices lo encogería a la mitad; el centro inflado ya lo hace ver acolchado
    o = malla(nombre, pts, caras, coll, material, sub=0)
    o.location = (x, y, z)
    o.rotation_euler = (0, giro, 0)
    return o


def estrella(coll, nombre, c, r, material, t=0.03, puntas=5):
    """Estrella acolchada mirando hacia -y."""
    x, y, z = c
    pts = []
    for s in (-1, 1):
        for k in range(puntas * 2):
            a = math.pi / 2 + k * math.pi / puntas
            rr = r if k % 2 == 0 else r * 0.46
            pts.append((math.cos(a) * rr, s * t, math.sin(a) * rr))
        pts.append((0.0, s * t * 2.4, 0.0))
    n = puntas * 2
    caras = []
    for k in range(n):
        caras.append((k, (k + 1) % n, n))
        caras.append((n + 1 + (k + 1) % n, n + 1 + k, 2 * n + 1))
        caras.append((k, n + 1 + k, n + 1 + (k + 1) % n, (k + 1) % n))
    o = malla(nombre, pts, caras, coll, material, sub=0)
    o.location = (x, y, z)
    return o


def flor(coll, nombre, c, r, color, centro='#F7D774', cara='z'):
    """Flor de fieltro de cinco pétalos; cara='z' mira arriba, cara='y' mira al frente."""
    x, y, z = c
    for k in range(5):
        a = k * 2 * math.pi / 5 + 0.3
        if cara == 'z':
            p, rr = (x + math.cos(a) * r * 0.9, y + math.sin(a) * r * 0.9, z), (r * 0.72, r * 0.72, r * 0.3)
        else:
            p, rr = (x + math.cos(a) * r * 0.9, y, z + math.sin(a) * r * 0.9), (r * 0.72, r * 0.3, r * 0.72)
        bola(coll, f'{nombre} pétalo {k}', p, rr, tela(f'pétalo {color}', color), n=3)
    off = (0, -r * 0.25, 0) if cara == 'y' else (0, 0, r * 0.25)
    bola(coll, f'{nombre} botón', (x + off[0], y + off[1], z + off[2]), r * 0.5, laca(f'botón {centro}', centro, 0.4), n=3)


def hoja_plana(coll, nombre, c, largo, color, ang=0.0, cara='y'):
    """Hoja de fieltro con su nervio: una gota aplanada, inclinada ang radianes."""
    x, y, z = c
    if cara == 'y':
        o = bola(coll, nombre, (0, 0, largo / 2), (largo * 0.32, largo * 0.07, largo * 0.5), tela(f'hoja {color}', color), n=4)
        o.location = (x, y, z)
        o.rotation_euler = (0, ang, 0)
    else:
        o = bola(coll, nombre, (largo / 2, 0, 0), (largo * 0.5, largo * 0.32, largo * 0.07), tela(f'hoja {color}', color), n=4)
        o.location = (x, y, z)
        o.rotation_euler = (0, 0, ang)
    return o


def hoja_otono(coll, nombre, c, r, color, colgada=False):
    """Hoja de arce de fieltro mirando al frente: tres lóbulos y su palito (colgada: el palito arriba)."""
    x, y, z = c
    v = -1 if colgada else 1
    m = tela(f'hoja otoño {color}', color)
    bola(coll, f'{nombre} centro', (x, y, z), (r * 0.55, r * 0.12, r * 0.7), m, n=4)
    for s in (-1, 1):
        o = bola(coll, f'{nombre} lóbulo {s}', (0, 0, 0), (r * 0.5, r * 0.11, r * 0.36), m, n=4)
        o.location = (x + s * r * 0.45, y + 0.004, z + v * r * 0.12)
        o.rotation_euler = (0, -s * v * 0.6, 0)
    tubo(coll, f'{nombre} palito', [(x, y - 0.01, z - v * r * 0.55), (x + r * 0.08, y - 0.01, z - v * r * 0.95)], r * 0.06,
         mat('palito', '#6B4430', 0.7), seg=4)


def calabaza(coll, nombre, c, r, color='#E8892F', tallo='#6B7D3A'):
    def gajos(v):
        a = np.arctan2(v[:, 1], v[:, 0])
        f = 1 + 0.08 * np.cos(a * 8)
        v[:, 0] *= f
        v[:, 1] *= f
        return v
    x, y, z = c
    clay.blob(nombre, (x, y, z + r * 0.75), (r, r, r * 0.75), coll, laca(f'calabaza {color}', color, 0.5), n=8, shaper=gajos)
    tubo(coll, f'{nombre} tallo', [(x, y, z + r * 1.35), (x + r * 0.12, y, z + r * 1.62)], r * 0.12, mat(f'tallo {tallo}', tallo, 0.6), seg=6)


def bombillo(coll, nombre, c, color, fuerza=3.0, grande=False):
    x, y, z = c
    k = float(grande) if grande else 1.0
    k = 1.5 if grande is True else k
    cilindro(coll, f'{nombre} socket', (x, y, z - 0.045 * k), 0.022 * k, 0.05 * k, mat('socket', '#2E4A3A', 0.5), seg=8)
    bola(coll, nombre, (x, y, z - 0.085 * k), (0.04 * k, 0.04 * k, 0.055 * k), luz(f'bombillo {color}', color, fuerza), n=3)


def farolillo(coll, nombre, c, r, color, fuerza=0.7):
    """Farolillo de papel con costillas, tapas oscuras y un hilito."""
    def costillas(v):
        a = np.arctan2(v[:, 1], v[:, 0])
        f = 1 + 0.05 * np.cos(a * 12)
        v[:, 0] *= f
        v[:, 1] *= f
        return v
    x, y, z = c
    clay.blob(nombre, (x, y, z), (r, r, r * 1.12), coll, luz(f'farolillo {color}', color, fuerza), n=6, shaper=costillas)
    for s in (-1, 1):
        cilindro(coll, f'{nombre} tapa {s}', (x, y, z + s * r * 1.05 - (0.04 if s > 0 else 0)), r * 0.45, 0.04, mat('tapa farol', '#3A302A', 0.5), seg=12)
    tubo(coll, f'{nombre} hilo', [(x, y, z + r * 1.1), (x, y, z + r * 1.1 + 0.08)], 0.006, mat('cordel', '#E9DCC0', 0.8), seg=4)
    tubo(coll, f'{nombre} borla', [(x, y, z - r * 1.1), (x, y, z - r * 1.1 - 0.1)], 0.012, tela(f'borla {color}', color), seg=5)


def muestrear(pts, n):
    """n puntos repartidos por igual a lo largo de una polilínea."""
    pts = [np.array(p, float) for p in pts]
    largos = [np.linalg.norm(b - a) for a, b in zip(pts, pts[1:])]
    total = sum(largos)
    out = []
    for i in range(n):
        d = total * (i + 0.5) / n
        for a, b, l in zip(pts, pts[1:], largos):
            if d <= l:
                out.append(tuple(a + (b - a) * d / l))
                break
            d -= l
    return out


def caja_regalo(coll, nombre, c, h, color, cinta):
    x, y, z = c
    caja(coll, nombre, (x, y, z + h[2]), h, laca(f'regalo {color}', color, 0.45), p=8)
    caja(coll, f'{nombre} cinta a', (x, y, z + h[2]), (h[0] + 0.005, 0.03, h[2] + 0.005), laca(f'cinta {cinta}', cinta, 0.35), p=10, sub=0)
    caja(coll, f'{nombre} cinta b', (x, y, z + h[2]), (0.03, h[1] + 0.005, h[2] + 0.005), laca(f'cinta {cinta}', cinta, 0.35), p=10, sub=0)
    for s in (-1, 1):
        o = bola(coll, f'{nombre} moño {s}', (0, 0, 0), (0.07, 0.03, 0.045), laca(f'cinta {cinta}', cinta, 0.35), n=3)
        o.location = (x + s * 0.055, y, z + h[2] * 2 + 0.035)
        o.rotation_euler = (0, s * 0.5, 0)


def paca(coll, nombre, c, giro=0.0):
    x, y, z = c
    o = caja(coll, nombre, (0, 0, 0.25), (0.5, 0.32, 0.25), PAJA(), p=5)
    o.location = (x, y, z)
    o.rotation_euler = (0, 0, giro)
    for s in (-1, 1):
        b = caja(coll, f'{nombre} amarre {s}', (s * 0.25, 0, 0.25), (0.015, 0.33, 0.26), mat('cabuya', '#8A6A44', 0.8), p=10, sub=0)
        b.parent = o
    for k in range(10):
        a = RNG.uniform(0, 2 * math.pi)
        p = tubo(coll, f'{nombre} brizna {k}', [(0, 0, 0), (0.06 * math.cos(a), 0.06 * math.sin(a), 0.08)], 0.008, PAJA(), seg=3)
        p.location = (RNG.uniform(-0.45, 0.45), RNG.uniform(-0.3, 0.3), 0.48)
        p.parent = o
    return o


def mazorca(coll, nombre, c, ang=0.0):
    x, y, z = c
    o = bola(coll, nombre, (0, 0, 0.13), (0.045, 0.045, 0.13), laca('maíz', '#F2C94C', 0.6), n=4)
    o.location = (x, y, z)
    o.rotation_euler = (ang, 0.2, 0)
    for s in (-1, 1):
        h = bola(coll, f'{nombre} capacho {s}', (s * 0.04, 0, 0.08), (0.03, 0.02, 0.12), mat('capacho', '#D8C49C', 0.8), n=3)
        h.parent = o
        h.rotation_euler = (0, s * 0.35, 0)
    return o


# ---------------------------------------------------------------- postes

def _remate(coll, tema, c):
    x, y, z = c
    a, b, cc, d, e = TEMAS[tema]
    if tema == 'primavera':
        for k in range(4):
            hoja_plana(coll, f'remate hoja {k}', (x, y + 0.02, z - 0.06), 0.18, '#5FA85A', ang=-1.2 + k * 0.8)
        flor(coll, 'remate flor', (x, y - 0.04, z + 0.08), 0.13, a, centro=b, cara='y')
    elif tema == 'verano':
        bola(coll, 'remate sol', (x, y, z + 0.08), (0.13, 0.08, 0.13), laca('sol', '#F7C948', 0.35), n=4)
        for k in range(10):
            ang = k * 2 * math.pi / 10
            o = clay.lathe(f'rayo {k}', [(0.035, 0.0), (0.0, 0.12)], coll, laca('rayo', '#F28C45', 0.4), segments=8, subsurf=0)
            o.location = (x + math.cos(ang) * 0.15, y, z + 0.08 + math.sin(ang) * 0.15)
            o.rotation_euler = (0, math.pi / 2 - ang, 0)
        for s in (-1, 1):
            bola(coll, f'sol ojo {s}', (x + s * 0.045, y - 0.075, z + 0.1), 0.016, mat('ojo', '#3A2A20', 0.4), n=3)
        tubo(coll, 'sol sonrisa', [(x - 0.05, y - 0.078, z + 0.055), (x, y - 0.082, z + 0.035), (x + 0.05, y - 0.078, z + 0.055)], 0.008,
             mat('ojo', '#3A2A20', 0.4), seg=4)
    elif tema == 'otono':
        for k, col in enumerate((a, cc, b)):
            o = bola(coll, f'remate hoja {k}', (0, 0, 0.13), (0.09, 0.025, 0.14), tela(f'hoja otoño {col}', col), n=4)
            o.location = (x, y, z)
            o.rotation_euler = (0, -0.8 + k * 0.8, 0)
        bola(coll, 'bellota', (x, y - 0.05, z + 0.03), (0.06, 0.06, 0.075), laca('bellota', '#B07A45', 0.45), n=4)
        bola(coll, 'bellota gorro', (x, y - 0.05, z + 0.09), (0.068, 0.068, 0.04), mat('gorro bellota', '#7A5034', 0.9), n=4)
    else:
        estrella(coll, 'remate estrella', (x, y, z + 0.12), 0.2, luz('estrella', '#FFD45A', 1.6))


def _poste(coll, tema):
    a, b, c, d, e = TEMAS[tema]
    cilindro(coll, 'poste base', (0, 0, 0), 0.26, 0.16, piedra('base poste', '#A39A8E'), seg=16, r2=0.21, sub=1)
    for k in range(8):
        ang = k * 0.8
        bola(coll, f'poste mata {k}', (math.cos(ang) * 0.2, math.sin(ang) * 0.2, 0.17), (0.09, 0.09, 0.07), HOJA() if k % 2 else HOJA_OSC(), n=3)
    if tema == 'primavera':
        for k in range(3):
            flor(coll, f'poste florcita {k}', (math.cos(k * 2.1 + 0.5) * 0.2, math.sin(k * 2.1 + 0.5) * 0.2, 0.25), 0.045, (a, d, e)[k], centro=b)
    cilindro(coll, 'poste palo', (0, 0, 0.12), 0.085, 3.0, MAD(), seg=14, r2=0.07)
    for j, col in enumerate((a, b)):
        pts = [(math.cos(t * 16 + j * math.pi) * 0.088, math.sin(t * 16 + j * math.pi) * 0.088, 0.4 + t * 2.4) for t in np.linspace(0, 1, 48)]
        clay.sweep(f'poste cinta {j}', pts, 0.032, profile=(1.0, 0.3), coll=coll, material=tela(f'cinta {col}', col), segments=6, samples=2,
                   caps=('flat', 'flat'), subsurf=0)
    clay.lathe('poste argolla', [(0.09, -0.025), (0.115, 0.0), (0.09, 0.025)], coll, metal('argolla', '#C9A44C'), segments=14, subsurf=0,
               cap_bottom=False, cap_top=False).location = (0, 0, 2.95)
    for k, col in enumerate((a, b, c)):
        ang = k * 2.1 + 0.4
        pts = [(math.cos(ang) * (0.06 + t * 0.16), math.sin(ang) * (0.06 + t * 0.16), 3.06 - t * 0.85 + 0.04 * math.sin(t * 9)) for t in
               np.linspace(0, 1, 9)]
        clay.sweep(f'serpentina {k}', pts, 0.03, profile=(1.0, 0.22), coll=coll, material=tela(f'cinta {col}', col), segments=6, samples=3,
                   caps=('flat', 'point'), subsurf=0)
    antes = set(coll.objects)
    _remate(coll, tema, (0, 0, 0))
    raiz = bpy.data.objects.new('remate', None)
    clay.link(raiz, coll)
    for x in coll.objects:
        if x not in antes and x is not raiz and x.parent is None:
            x.parent = raiz
    raiz.location = (0, 0, 3.12)
    raiz.scale = (1.5, 1.5, 1.5)


def m_poste_primavera(coll):
    _poste(coll, 'primavera')


def m_poste_verano(coll):
    _poste(coll, 'verano')


def m_poste_otono(coll):
    _poste(coll, 'otono')


def m_poste_invierno(coll):
    _poste(coll, 'invierno')


# ---------------------------------------------------------------- tiras de la guirnalda (2 m)

def _tira(coll, tema):
    cols = TEMAS[tema]
    tubo(coll, 'cordel', [(0, 0, 0), (1, 0, 0), (2, 0, 0)], 0.018, mat('cordel', '#E9DCC0', 0.8), seg=6)
    if tema == 'primavera':
        for k in range(4):
            x = 0.25 + k * 0.5
            col = cols[k % 4]
            triangulo(coll, f'banderín {k}', (x, 0, -0.015), 0.46, 0.62, tela(f'banderín {col}', col), t=0.016, inflado=0.03,
                      giro=RNG.uniform(-0.06, 0.06))
            if k % 2 == 0:
                flor(coll, f'florcita {k}', (x, -0.055, -0.21), 0.07, cols[4], centro=cols[1], cara='y')
            else:
                bola(coll, f'lunar {k}', (x, -0.05, -0.2), (0.07, 0.012, 0.07), tela('lunar', cols[4]), n=3)
    elif tema == 'verano':
        for k in range(3):
            x = 0.34 + k * 0.66
            tubo(coll, f'colgante {k}', [(x, 0, 0), (x, 0, -0.07)], 0.006, mat('cordel', '#E9DCC0', 0.8), seg=4)
            farolillo(coll, f'farolillo {k}', (x, 0, -0.36), 0.23, (cols[0], cols[3], cols[2])[k])
        triangulo(coll, 'banderín fin', (1.99, 0, -0.015), 0.34, 0.44, tela(f'banderín {cols[1]}', cols[1]))
        triangulo(coll, 'banderín medio a', (0.67, 0, -0.015), 0.34, 0.44, tela(f'banderín {cols[2]}', cols[2]))
        triangulo(coll, 'banderín medio b', (1.33, 0, -0.015), 0.34, 0.44, tela(f'banderín {cols[0]}', cols[0]))
    elif tema == 'otono':
        for k in range(5):
            x = 0.2 + k * 0.4
            col = (cols[0], cols[2], cols[1], cols[4])[k % 4]
            tubo(coll, f'colgante {k}', [(x, 0, 0), (x, 0, -0.05)], 0.008, mat('cordel', '#E9DCC0', 0.8), seg=4)
            hoja_otono(coll, f'hoja {k}', (x, 0, -0.31), 0.25, col, colgada=True)
            if k % 3 == 1:
                bola(coll, f'bellota {k}', (x + 0.13, 0, -0.08), (0.03, 0.03, 0.038), laca('bellota', '#B07A45', 0.45), n=3)
                bola(coll, f'bellota gorro {k}', (x + 0.13, 0, -0.05), (0.034, 0.034, 0.02), mat('gorro bellota', '#7A5034', 0.9), n=3)
    else:
        for k in range(8):
            x = 0.125 + k * 0.25
            if k in (2, 6):
                continue
            bombillo(coll, f'bombillo {k}', (x, 0, -0.01 - (0.05 if k % 2 else 0)), BOMBILLOS[k % len(BOMBILLOS)], grande=2.2)
        for k, x in enumerate((0.625, 1.625)):
            tubo(coll, f'hilo estrella {k}', [(x, 0, 0), (x, 0, -0.16)], 0.007, mat('cordel', '#E9DCC0', 0.8), seg=4)
            estrella(coll, f'estrellita {k}', (x, 0, -0.34), 0.19, tela('estrella blanca', '#F2F4F8'), t=0.026)


def m_tira_primavera(coll):
    _tira(coll, 'primavera')


def m_tira_verano(coll):
    _tira(coll, 'verano')


def m_tira_otono(coll):
    _tira(coll, 'otono')


def m_tira_invierno(coll):
    _tira(coll, 'invierno')


# ---------------------------------------------------------------- arcos

def _icono(coll, tema, c):
    x, y, z = c
    if tema == 'primavera':
        tubo(coll, 'icono tallo', [(x, y, z - 0.25), (x, y, z - 0.05), (x + 0.02, y, z + 0.1)], 0.025, HOJA(), seg=6)
        for s in (-1, 1):
            o = bola(coll, f'icono hoja {s}', (0, 0, 0), (0.15, 0.04, 0.07), HOJA(), n=4)
            o.location = (x + s * 0.13, y, z + 0.1)
            o.rotation_euler = (0, -s * 0.5, 0)
        bola(coll, 'icono semilla', (x, y, z - 0.28), (0.09, 0.06, 0.06), laca('semilla', '#A9744A', 0.5), n=4)
    elif tema == 'verano':
        clay.lathe('icono campana', [(0.0, 0.3), (0.06, 0.29), (0.1, 0.22), (0.12, 0.1), (0.17, 0.02), (0.18, 0.0)], coll,
                   metal('campana', '#E8C66A'), segments=20, subsurf=1).location = (x, y - 0.05, z - 0.18)
        bola(coll, 'icono badajo', (x, y - 0.05, z - 0.2), 0.045, metal('campana oscura', '#B08A3A'), n=3)
        for s in (-1, 1):
            o = bola(coll, f'icono lazo {s}', (0, 0, 0), (0.09, 0.03, 0.05), laca('lazo', '#E4566B', 0.4), n=3)
            o.location = (x + s * 0.08, y - 0.06, z + 0.17)
            o.rotation_euler = (0, s * 0.4, 0)
    elif tema == 'otono':
        calabaza(coll, 'icono calabaza', (x, y - 0.06, z - 0.22), 0.2)
        hoja_plana(coll, 'icono hoja', (x + 0.06, y - 0.08, z + 0.07), 0.14, '#7FA04A', ang=-0.9)
    else:
        cilindro(coll, 'icono vela', (x, y - 0.05, z - 0.28), 0.075, 0.3, mat('cera', '#F6F1E6', 0.6), seg=14)
        clay.blob('icono llama', (x, y - 0.05, z + 0.12), (0.05, 0.04, 0.1), coll, luz('llama', '#FFB347', 4.0), n=4, p=1.6)
        clay.blob('icono llama clara', (x, y - 0.08, z + 0.1), (0.025, 0.02, 0.05), coll, luz('llama clara', '#FFE9A8', 5.0), n=3)
        for s in (-1, 1):
            o = bola(coll, f'icono acebo {s}', (0, 0, 0), (0.08, 0.025, 0.04), HOJA_OSC(), n=3)
            o.location = (x + s * 0.1, y - 0.06, z - 0.28)
            o.rotation_euler = (0, s * 0.4, 0)
        for k in range(3):
            bola(coll, f'icono baya {k}', (x - 0.03 + k * 0.03, y - 0.09, z - 0.25), 0.025, laca('baya', '#C9302C', 0.3), n=3)


def _arco(coll, tema):
    a, b, c, d, e = TEMAS[tema]
    for sx in (-1, 1):
        x = sx * 2.1
        caja(coll, f'arco base {sx}', (x, 0, 0.12), (0.22, 0.22, 0.12), piedra('base arco', '#A39A8E'), p=6)
        caja(coll, f'arco poste {sx}', (x, 0, 1.6), (0.1, 0.1, 1.5), MAD(), p=8)
        caja(coll, f'arco capitel {sx}', (x, 0, 3.08), (0.14, 0.14, 0.06), OSC(), p=6)
    viga = [(-2.25, 0, 3.0), (-1.3, 0, 3.45), (0, 0, 3.62), (1.3, 0, 3.45), (2.25, 0, 3.0)]
    tubo(coll, 'arco viga', viga, 0.11, OSC(), seg=10)
    tubo(coll, 'arco viga clara', [(p[0] * 0.97, p[1] - 0.03, p[2] - 0.17) for p in viga], 0.05, MAD(), seg=8)
    disco = clay.lathe('emblema', [(0, -0.04), (0.42, -0.04), (0.46, 0), (0.42, 0.04), (0, 0.04)], coll, madera('emblema', '#F2E3C4'),
                       segments=28, subsurf=1)
    disco.location = (0, -0.12, 3.3)
    disco.rotation_euler = (math.pi / 2, 0, 0)
    aro = clay.lathe('emblema aro', [(0.43, -0.055), (0.49, 0), (0.43, 0.055)], coll, laca(f'aro {a}', a, 0.4), segments=28, subsurf=0,
                     cap_bottom=False, cap_top=False)
    aro.location = (0, -0.12, 3.3)
    aro.rotation_euler = (math.pi / 2, 0, 0)
    _icono(coll, tema, (0, -0.18, 3.32))
    puntos = muestrear(viga, 26)
    if tema == 'primavera':
        for k, (x, y, z) in enumerate(puntos):
            if abs(x) < 0.5:
                continue
            hoja_plana(coll, f'arco hoja {k}', (x, -0.1, z + 0.02), 0.16, ('#5FA85A', '#7FB069')[k % 2], ang=1.4 * (1 if k % 2 else -1))
            flor(coll, f'arco flor {k}', (x, -0.13, z + 0.05), 0.07 + 0.02 * (k % 3), (a, d, e, b)[k % 4], centro=(b, e)[k % 2], cara='y')
        for sx in (-1, 1):
            for k in range(9):
                t = k / 8
                ang = t * 9 + (0 if sx > 0 else 1.5)
                p = (sx * 2.1 + math.cos(ang) * 0.13, math.sin(ang) * 0.13 - 0.02, 0.35 + t * 2.6)
                hoja_plana(coll, f'enredadera {sx}{k}', p, 0.12, '#5FA85A', ang=ang)
                if k % 3 == 1:
                    flor(coll, f'enredadera flor {sx}{k}', (p[0], p[1] - 0.06, p[2]), 0.06, (a, d)[k % 2], centro=b, cara='y')
    elif tema == 'verano':
        for k, x in enumerate((-1.55, -0.85, 0.85, 1.55)):
            z = 3.0 + (3.62 - 3.0) * (1 - (abs(x) / 2.25) ** 2)
            tubo(coll, f'arco cuelga {k}', [(x, 0, z - 0.08), (x, 0, z - 0.3)], 0.006, mat('cordel', '#E9DCC0', 0.8), seg=4)
            farolillo(coll, f'arco farolillo {k}', (x, 0, z - 0.48), 0.14, (a, c, d, b)[k])
        for sx in (-1, 1):
            pts = [(sx * 2.1 + math.cos(t * 18) * 0.12, math.sin(t * 18) * 0.12, 0.3 + t * 2.7) for t in np.linspace(0, 1, 50)]
            clay.sweep(f'arco cinta {sx}', pts, 0.03, profile=(1.0, 0.3), coll=coll, material=tela(f'cinta {c}', c), segments=6, samples=2,
                       caps=('flat', 'flat'), subsurf=0)
        for k, (x, y, z) in enumerate(puntos):
            if abs(x) < 0.55:
                continue
            triangulo(coll, f'arco banderín {k}', (x, -0.12, z - 0.06), 0.14, 0.2, tela(f'banderín {(a, b, c, d)[k % 4]}', (a, b, c, d)[k % 4]))
    elif tema == 'otono':
        for k, (x, y, z) in enumerate(puntos):
            if abs(x) < 0.5:
                continue
            o = bola(coll, f'arco hoja {k}', (0, 0, 0.09), (0.09, 0.025, 0.13), tela(f'hoja otoño {(a, b, c, e)[k % 4]}', (a, b, c, e)[k % 4]), n=4)
            o.location = (x, -0.11, z - 0.02)
            o.rotation_euler = (0, RNG.uniform(-1.4, 1.4), 0)
        for sx in (-1, 1):
            calabaza(coll, f'arco calabaza {sx}', (sx * 2.55, -0.2, 0), 0.24)
            calabaza(coll, f'arco calabacita {sx}', (sx * 1.75, -0.35, 0), 0.14, '#F2A33A')
            paca(coll, f'arco paca {sx}', (sx * 2.65, 0.45, 0), giro=0.3 * sx)
            for k in range(3):
                mazorca(coll, f'arco mazorca {sx}{k}', (sx * 2.1 + (k - 1) * 0.07, -0.13, 1.9), ang=0.25 * (k - 1))
            tubo(coll, f'arco amarre {sx}', [(sx * 2.1 - 0.12, -0.13, 2.1), (sx * 2.1 + 0.12, -0.13, 2.1)], 0.015, mat('cabuya', '#8A6A44', 0.8), seg=4)
    else:
        for k, (x, y, z) in enumerate(muestrear(viga, 60)):
            for j in range(2):
                bola(coll, f'guirnalda {k}{j}', (x + RNG.uniform(-0.05, 0.05), -0.08 + RNG.uniform(-0.04, 0.04), z + RNG.uniform(-0.04, 0.06)),
                     (0.09, 0.07, 0.07), PINO(), n=3)
            if k % 4 == 0 and abs(x) > 0.5:
                bombillo(coll, f'arco bombillo {k}', (x, -0.17, z - 0.02), BOMBILLOS[(k // 4) % len(BOMBILLOS)])
        for sx in (-1, 1):
            for k in range(26):
                t = k / 25
                ang = t * 12
                bola(coll, f'guirnalda poste {sx}{k}', (sx * 2.1 + math.cos(ang) * 0.13, math.sin(ang) * 0.13, 0.4 + t * 2.6), (0.08, 0.08, 0.07),
                     PINO(), n=3)
            for s in (-1, 1):
                o = bola(coll, f'moño {sx}{s}', (0, 0, 0), (0.1, 0.035, 0.06), laca('moño', d, 0.35), n=3)
                o.location = (sx * 2.1 + s * 0.08, -0.16, 2.95)
                o.rotation_euler = (0, s * 0.5, 0)
            for s in (-1, 1):
                tubo(coll, f'moño cola {sx}{s}', [(sx * 2.1, -0.16, 2.92), (sx * 2.1 + s * 0.06, -0.17, 2.75), (sx * 2.1 + s * 0.1, -0.16, 2.6)], 0.022,
                     laca('moño', d, 0.35), seg=5)
        estrella(coll, 'arco estrella', (0, -0.05, 3.95), 0.18, luz('estrella', '#FFD45A', 1.6))


def m_arco_primavera(coll):
    _arco(coll, 'primavera')


def m_arco_verano(coll):
    _arco(coll, 'verano')


def m_arco_otono(coll):
    _arco(coll, 'otono')


def m_arco_invierno(coll):
    _arco(coll, 'invierno')


# ---------------------------------------------------------------- lo principal de cada festival

def maceta(coll, nombre, c, r, flor_color=None, centro='#F7D774'):
    x, y, z = c
    clay.lathe(nombre, [(0, 0), (r * 0.75, 0), (r, r * 1.3), (r * 1.1, r * 1.35), (r * 1.1, r * 1.55), (0, r * 1.5)], coll,
               mat('terracota', '#C9714A', 0.8), segments=14, subsurf=1).location = (x, y, z)
    bola(coll, f'{nombre} tierra', (x, y, z + r * 1.48), (r * 0.95, r * 0.95, r * 0.15), mat('tierra', '#5A3E2B', 0.95), n=3)
    for k in range(4):
        a = k * 1.7
        bola(coll, f'{nombre} hoja {k}', (x + math.cos(a) * r * 0.45, y + math.sin(a) * r * 0.45, z + r * 1.75), (r * 0.42, r * 0.42, r * 0.3),
             HOJA() if k % 2 else HOJA_OSC(), n=3)
    if flor_color:
        flor(coll, f'{nombre} flor', (x, y - r * 0.2, z + r * 2.15), r * 0.55, flor_color, centro=centro, cara='y')


def brote(coll, nombre, c, s=1.0):
    x, y, z = c
    tubo(coll, f'{nombre} tallo', [(x, y, z), (x, y, z + 0.08 * s)], 0.008 * s, HOJA(), seg=4)
    for t in (-1, 1):
        o = bola(coll, f'{nombre} hojita {t}', (0, 0, 0), (0.035 * s, 0.012 * s, 0.018 * s), HOJA(), n=3)
        o.location = (x + t * 0.03 * s, y, z + 0.09 * s)
        o.rotation_euler = (0, -t * 0.5, 0)


def m_centro_primavera(coll):
    """Puesto del Encuentro de las Semillas: mostrador con toldo de rayas, sobres, materas y plántulas."""
    a, b, c, d, e = TEMAS['primavera']
    caja(coll, 'puesto cuerpo', (0, 0.05, 0.5), (1.2, 0.45, 0.48), MAD(), p=10)
    for k in range(4):
        caja(coll, f'puesto tabla {k}', (-0.9 + k * 0.6, -0.42, 0.5), (0.27, 0.03, 0.4), OSC(), p=8)
        flor(coll, f'puesto flor {k}', (-0.9 + k * 0.6, -0.47, 0.55), 0.07, (a, d, c, b)[k], centro=(b, e, b, e)[k], cara='y')
    caja(coll, 'puesto cubierta', (0, 0, 1.02), (1.32, 0.55, 0.05), CHOCO(), p=6)
    for sx in (-1, 1):
        for sy, alto in ((-1, 2.05), (1, 2.35)):
            caja(coll, f'puesto poste {sx}{sy}', (sx * 1.25, sy * 0.5, alto / 2), (0.05, 0.05, alto / 2), OSC(), p=10)
    n = 8
    ancho = 2.8 / n
    largo = math.hypot(1.4, 0.4)
    incl = math.atan2(0.4, 1.4)
    toldo = caja(coll, 'toldo', (0, 0, 0), (1.42, largo / 2, 0.03), tela(f'toldo {e}', e), p=10, sub=1)
    toldo.location = (0, -0.15, 2.2)
    toldo.rotation_euler = (incl, 0, 0)
    for k in range(0, n, 2):
        caja(coll, f'toldo raya {k}', (-1.4 + ancho * (k + 0.5), 0, 0.028), (ancho / 2, largo / 2 - 0.01, 0.006), tela(f'toldo {a}', a), p=12,
             sub=0).parent = toldo
    for k in range(14):
        x = -1.3 + k * 0.2
        bola(coll, f'festón {k}', (x, -0.8, 1.98), (0.1, 0.02, 0.09), tela(f'toldo {(a, e)[k % 2]}', (a, e)[k % 2]), n=3)
    caja(coll, 'letrero puesto', (0, 0.52, 2.62), (0.6, 0.04, 0.22), madera('letrero', '#F2E3C4'), p=6)
    caja(coll, 'letrero marco', (0, 0.55, 2.62), (0.66, 0.03, 0.27), OSC(), p=6)
    _icono(coll, 'primavera', (0, 0.46, 2.66))
    # Sobres de semillas en tres cajones
    for j, x0 in enumerate((-0.95, -0.35, 0.25)):
        for s in (-1, 1):
            caja(coll, f'cajón sobres {j} {s}', (x0 + s * 0.24, 0, 1.13), (0.015, 0.2, 0.07), MAD(), p=10, sub=0)
        caja(coll, f'cajón sobres {j} frente', (x0, -0.2, 1.13), (0.25, 0.015, 0.07), MAD(), p=10, sub=0)
        for k in range(5):
            col = (a, b, c, d, '#F28C45', '#8EC5F0')[(j * 2 + k) % 6]
            o = caja(coll, f'sobre {j}{k}', (0, 0, 0.11), (0.075, 0.012, 0.11), mat(f'sobre {col}', col, 0.7), p=12, sub=0)
            o.location = (x0 - 0.18 + k * 0.09, -0.1 + k * 0.03, 1.08)
            o.rotation_euler = (-0.35, 0, 0.05 * (k - 2))
            bola(coll, f'sobre dibujo {j}{k}', (0, -0.014, 0.12), (0.035, 0.004, 0.035), mat('dibujo', '#F6F1E6', 0.7), n=3, sub=0).parent = o
    for k, x in enumerate((0.75, 1.0, 1.2)):
        maceta(coll, f'puesto maceta {k}', (x, 0.1 - k * 0.12, 1.07), 0.07 + 0.01 * k, (a, d, e)[k], centro=b)
    frasco(coll, 'frasco semillas', 0.82, -0.3, 1.07, 0.07, 0.2, '#A9744A')
    # Bandeja de plántulas y costales al frente
    caja(coll, 'bandeja plántulas', (1.0, -0.95, 0.12), (0.4, 0.28, 0.1), MAD(), p=8)
    for i in range(4):
        for j in range(3):
            x, y = 0.72 + i * 0.19, -1.13 + j * 0.18
            bola(coll, f'tierrita {i}{j}', (x, y, 0.22), (0.07, 0.07, 0.02), mat('tierra', '#5A3E2B', 0.95), n=3)
            brote(coll, f'plántula {i}{j}', (x, y, 0.23), 1.0)
    _costal(coll, 'costal semillas a', -1.0, -0.85, 0.75, '#D8C49C', abierto='#E8C35A')
    _costal(coll, 'costal semillas b', -0.55, -1.0, 0.65, '#CDB68C', abierto='#A9744A')
    for k in range(5):
        bola(coll, f'semilla suelta {k}', (-0.7 + RNG.uniform(-0.25, 0.25), -1.25 + RNG.uniform(-0.1, 0.1), 0.01), 0.02,
             laca('semilla', '#A9744A', 0.5), n=2)


def m_centro_verano(coll):
    """Tarima de la Ronda de la Fuente: tambor, campana en su marco, atril y farolillos encima."""
    a, b, c, d, e = TEMAS['verano']
    clay.lathe('tarima', [(0, 0), (1.62, 0), (1.66, 0.04), (1.66, 0.26), (1.6, 0.3), (0, 0.3)], coll, OSC(), segments=36, subsurf=1)
    for k in range(10):
        x = -1.44 + k * 0.32
        largo = 2 * math.sqrt(max(1.55 ** 2 - x ** 2, 0.04)) - 0.08
        caja(coll, f'tabla tarima {k}', (x, 0, 0.31), (0.15, largo / 2, 0.02), MAD(), p=10, sub=0)
    for k in range(2):
        caja(coll, f'escalón {k}', (0, -1.72 - k * 0.22, 0.2 - k * 0.1), (0.5, 0.14, 0.1 - k * 0.0), MAD(), p=8)
    for k in range(18):
        ang = -math.pi / 2 + (k - 8.5) * 0.17
        t = triangulo(coll, f'tarima banderín {k}', (math.cos(ang) * 1.66, math.sin(ang) * 1.66 - 0.01, 0.27), 0.16, 0.18,
                      tela(f'banderín {(a, b, c, d)[k % 4]}', (a, b, c, d)[k % 4]))
        t.rotation_euler = (0, 0, ang + math.pi / 2)
    # Tambor
    tx, ty = -0.65, 0.3
    clay.lathe('tambor', [(0, 0), (0.36, 0), (0.4, 0.28), (0.36, 0.56), (0, 0.56)], coll, laca('tambor', d, 0.4), segments=24,
               subsurf=1).location = (tx, ty, 0.32)
    cilindro(coll, 'parche', (tx, ty, 0.88), 0.37, 0.03, mat('parche', '#F3E6CA', 0.7), seg=24)
    for z in (0.33, 0.86):
        clay.lathe(f'aro tambor {z}', [(0.37, -0.025), (0.4, 0), (0.37, 0.025)], coll, metal('aro', '#E8C66A'), segments=24, subsurf=0,
                   cap_bottom=False, cap_top=False).location = (tx, ty, z)
    for k in range(12):
        a0, a1 = k * math.pi / 6, (k + 0.5) * math.pi / 6
        tubo(coll, f'cuerda tambor {k}', [(tx + math.cos(a0) * 0.39, ty + math.sin(a0) * 0.39, 0.38),
                                         (tx + math.cos(a1) * 0.41, ty + math.sin(a1) * 0.41, 0.6),
                                         (tx + math.cos(a0 + math.pi / 6) * 0.39, ty + math.sin(a0 + math.pi / 6) * 0.39, 0.82)], 0.01,
             mat('cuerda', '#F2E3C4', 0.8), seg=4)
    for s in (-1, 1):
        o = tubo(coll, f'baqueta {s}', [(0, 0, 0), (0, 0, 0.4)], 0.015, MAD(), seg=6)
        o.location = (tx + 0.15 * s, ty - 0.1, 0.9)
        o.rotation_euler = (1.2, 0, 0.4 * s)
        bola(coll, f'baqueta punta {s}', (0, 0, 0.42), 0.035, tela('punta', '#F3E6CA'), n=3).parent = o
    # Campana en su marco
    cx, cy = 0.7, 0.45
    for s in (-1, 1):
        caja(coll, f'marco campana {s}', (cx + s * 0.38, cy, 1.05), (0.05, 0.05, 0.75), OSC(), p=8)
    caja(coll, 'travesaño campana', (cx, cy, 1.82), (0.48, 0.06, 0.06), CHOCO(), p=6)
    tubo(coll, 'cuerda campana', [(cx, cy, 1.78), (cx, cy, 1.55)], 0.012, mat('cuerda', '#F2E3C4', 0.8), seg=4)
    clay.lathe('campana', [(0.0, 0.3), (0.08, 0.29), (0.13, 0.22), (0.15, 0.1), (0.21, 0.02), (0.22, 0.0)], coll, metal('campana', '#E8C66A'),
               segments=24, subsurf=1).location = (cx, cy, 1.24)
    bola(coll, 'badajo', (cx, cy, 1.2), 0.05, metal('campana oscura', '#B08A3A'), n=3)
    tubo(coll, 'cuerda badajo', [(cx, cy, 1.2), (cx + 0.05, cy - 0.1, 0.75), (cx + 0.02, cy - 0.15, 0.55)], 0.01, tela('borla', d), seg=4)
    # Atril con partitura
    caja(coll, 'atril pata', (0.05, -0.45, 0.75), (0.025, 0.025, 0.45), metal('atril', '#3A302A'), p=10, sub=0)
    o = caja(coll, 'atril tabla', (0, 0, 0), (0.28, 0.02, 0.2), metal('atril', '#3A302A'), p=10, sub=0)
    o.location = (0.05, -0.45, 1.25)
    o.rotation_euler = (-0.5, 0, 0)
    p = caja(coll, 'partitura', (0, -0.025, 0.02), (0.24, 0.006, 0.17), mat('papel', '#F6F1E6', 0.8), p=12, sub=0)
    p.parent = o
    for k in range(5):
        caja(coll, f'pentagrama {k}', (0, -0.033, -0.08 + k * 0.045), (0.21, 0.002, 0.003), mat('tinta', '#3A302A', 0.6), p=12, sub=0).parent = o
        bola(coll, f'nota {k}', (-0.15 + k * 0.07, -0.035, -0.06 + (k * 37 % 5) * 0.03), (0.015, 0.004, 0.012), mat('tinta', '#3A302A', 0.6),
             n=2, sub=0).parent = o
    # Cojines para sentarse
    for k, (x, y) in enumerate(((-1.15, -0.55), (-0.85, -0.95), (0.95, -0.85), (1.2, -0.35))):
        clay.blob(f'cojín {k}', (x, y, 0.38), (0.22, 0.22, 0.07), coll, tela(f'cojín {(c, a, b, d)[k]}', (c, a, b, d)[k]), n=6, p=3.0)
        bola(coll, f'cojín botón {k}', (x, y, 0.45), 0.025, tela('botón cojín', e), n=3)
    # Postes atrás con farolillos que cruzan por encima
    for s in (-1, 1):
        caja(coll, f'poste farolillos {s}', (s * 1.35, 0.95, 1.4), (0.05, 0.05, 1.2), OSC(), p=10)
        bola(coll, f'poste farolillos remate {s}', (s * 1.35, 0.95, 2.66), 0.07, laca('remate', b, 0.4), n=3)
    cuerda = [(-1.35, 0.95, 2.45), (-0.7, 0.95, 2.2), (0, 0.95, 2.12), (0.7, 0.95, 2.2), (1.35, 0.95, 2.45)]
    tubo(coll, 'cuerda farolillos', cuerda, 0.008, mat('cordel', '#E9DCC0', 0.8), seg=4)
    for k, (x, y, z) in enumerate(muestrear(cuerda, 5)):
        farolillo(coll, f'tarima farolillo {k}', (x, y, z - 0.28), 0.12, (a, c, d, b, a)[k])


def m_centro_otono(coll):
    """Mesa de la Cosecha: mantel con camino, calabazas, canasta de manzanas, maíz, pan, pastel, mermeladas y uvas."""
    a, b, c, d, e = TEMAS['otono']
    caja(coll, 'mesa tablero', (0, 0, 0.8), (1.6, 0.5, 0.05), MAD(), p=8)
    for sx in (-1, 1):
        for sy in (-1, 1):
            caja(coll, f'mesa pata {sx}{sy}', (sx * 1.48, sy * 0.4, 0.4), (0.05, 0.05, 0.4), OSC(), p=10)
    caja(coll, 'mantel', (0, 0, 0.865), (1.66, 0.56, 0.015), tela('mantel', '#F3E6CA'), p=10)
    caja(coll, 'mantel caída', (0, -0.56, 0.7), (1.66, 0.015, 0.17), tela('mantel', '#F3E6CA'), p=10)
    for k in range(17):
        bola(coll, f'mantel festón {k}', (-1.6 + k * 0.2, -0.575, 0.53), (0.1, 0.012, 0.05), tela('mantel', '#F3E6CA'), n=3)
    caja(coll, 'camino mesa', (0, 0, 0.885), (1.7, 0.2, 0.01), tela('camino', a), p=10, sub=0)
    for s in (-1, 1):
        caja(coll, f'camino cae {s}', (s * 1.71, 0, 0.75), (0.012, 0.2, 0.14), tela('camino', a), p=10, sub=0)
    calabaza(coll, 'calabaza grande', (-1.1, 0.12, 0.89), 0.27)
    calabaza(coll, 'calabaza mediana', (-0.62, -0.18, 0.89), 0.16, '#F2A33A')
    calabaza(coll, 'calabaza blanca', (1.25, 0.15, 0.89), 0.2, '#F2E8D5')
    calabaza(coll, 'calabaza verde', (1.42, -0.25, 0.89), 0.11, '#7FA04A', tallo='#8A5A3B')
    # Canasta de manzanas
    clay.lathe('canasta', [(0, 0), (0.2, 0), (0.26, 0.18), (0.28, 0.2)], coll, mat('mimbre', '#B98A52', 0.85,
               noise=dict(scale=40, strength=0.5, distance=0.004)), segments=20, subsurf=1, cap_top=False).location = (0.0, 0.1, 0.89)
    tubo(coll, 'asa canasta', [(-0.25, 0.1, 1.08), (0, 0.1, 1.4), (0.25, 0.1, 1.08)], 0.02, mat('mimbre oscuro', '#8A6238', 0.8), seg=6)
    for k in range(8):
        ang = k * 2.4
        r = 0.07 + 0.11 * (k % 3) / 2
        bola(coll, f'manzana {k}', (math.cos(ang) * r, 0.1 + math.sin(ang) * r, 1.1 + (0.05 if k < 3 else 0)), 0.07,
             laca('manzana', '#D9453D' if k % 3 else '#F2A33A', 0.35), n=4)
    for k in range(4):
        mazorca(coll, f'mazorca mesa {k}', (0.55 + k * 0.07, 0.25, 0.9), ang=-1.2)
    # Pan, pastel, mermeladas y uvas
    bola(coll, 'pan', (-0.22, -0.25, 0.97), (0.2, 0.11, 0.09), laca('pan', '#C98A4A', 0.6), n=5)
    for k in range(3):
        bola(coll, f'corte pan {k}', (-0.32 + k * 0.1, -0.25, 1.05), (0.012, 0.08, 0.012), mat('miga', '#F2D9A8', 0.8), n=2)
    clay.lathe('plato pastel', [(0, 0), (0.22, 0), (0.24, 0.02)], coll, laca('plato', '#F6F1E6', 0.3), segments=20, subsurf=0).location = (0.4, -0.22, 0.89)
    clay.lathe('pastel', [(0, 0), (0.18, 0), (0.19, 0.06), (0.0, 0.07)], coll, laca('masa', '#D99A55', 0.6), segments=20,
               subsurf=1).location = (0.4, -0.22, 0.9)
    for k in range(6):
        tubo(coll, f'enrejado {k}', [(0.4 - 0.16 + k * 0.064, -0.36, 0.975), (0.4 - 0.16 + k * 0.064, -0.08, 0.975)], 0.012,
             laca('masa', '#E8B070', 0.6), seg=4)
    frasco(coll, 'mermelada a', 0.92, -0.28, 0.89, 0.06, 0.16, '#B5432F')
    frasco(coll, 'mermelada b', 1.06, -0.33, 0.89, 0.06, 0.16, '#E0A93B')
    for k, (x, y, z) in enumerate([(i * 0.05 - j * 0.025, 0, -j * 0.05) for j in range(4) for i in range(4 - j)]):
        bola(coll, f'uva {k}', (-1.38 + x, -0.25 + RNG.uniform(-0.02, 0.02), 1.12 + z), 0.03, laca('uva', '#6B3F7A', 0.3), n=3)
    hoja_plana(coll, 'hoja uvas', (-1.34, -0.27, 1.12), 0.1, '#7FA04A', ang=1.0)
    # Escarapela de premio
    flor(coll, 'escarapela', (0, -0.6, 0.7), 0.1, '#3B6FB6', centro='#E8C66A', cara='y')
    for s in (-1, 1):
        caja(coll, f'escarapela cola {s}', (s * 0.04, -0.59, 0.53), (0.03, 0.006, 0.09), tela('escarapela', '#3B6FB6'), p=10, sub=0)
    # Pacas a los lados
    for sx in (-1, 1):
        paca(coll, f'paca mesa {sx}', (sx * 2.15, 0.05, 0), giro=0.1 * sx)
    calabaza(coll, 'calabaza paca', (-2.15, 0.05, 0.5), 0.2)
    for k in range(5):
        mazorca(coll, f'mazorca paca {k}', (2.0 + k * 0.07, 0.05, 0.5), ang=-1.3 + 0.1 * k)
    for k, col in enumerate((a, c, b, e)):
        o = bola(coll, f'hoja suelta {k}', (0, 0, 0), (0.08, 0.06, 0.012), tela(f'hoja otoño {col}', col), n=3)
        o.location = (-1.6 + k * 1.1 + RNG.uniform(-0.2, 0.2), -0.85 + RNG.uniform(-0.15, 0.15), 0.01)
        o.rotation_euler = (0, 0, RNG.uniform(0, 3))


def m_centro_invierno(coll):
    """Árbol de la Velada de los Recuerdos: pino de fieltro con bombillos, bolas, marcos de recuerdos y regalos."""
    a, b, c, d, e = TEMAS['invierno']
    clay.lathe('balde árbol', [(0, 0), (0.38, 0), (0.45, 0.45), (0.47, 0.47), (0.0, 0.47)], coll, madera('balde', '#A97445'), segments=20,
               subsurf=1)
    for z in (0.1, 0.36):
        clay.lathe(f'zuncho {z}', [(0.4 + z * 0.15, -0.02), (0.43 + z * 0.15, 0), (0.4 + z * 0.15, 0.02)], coll, metal('zuncho', '#6B6F78'),
                   segments=20, subsurf=0, cap_bottom=False, cap_top=False).location = (0, 0, z)
    cilindro(coll, 'tronco', (0, 0, 0.45), 0.1, 0.35, madera('corteza', '#7A5034'), seg=10)
    pisos = [(1.15, 0.7), (0.95, 1.2), (0.75, 1.68), (0.55, 2.12), (0.33, 2.52)]
    for k, (r, z) in enumerate(pisos):
        clay.lathe(f'piso pino {k}', [(r * 0.1, 0.0), (r, 0.0), (r * 0.98, 0.06), (r * 0.55, 0.42), (r * 0.12, 0.85), (0.0, 0.88)], coll,
                   PINO(), segments=28, subsurf=1).location = (0, 0, z)
        for j in range(14):
            ang = j * 2 * math.pi / 14 + k * 0.3
            bola(coll, f'rama {k}{j}', (math.cos(ang) * r * 0.97, math.sin(ang) * r * 0.97, z + 0.03), (r * 0.17, r * 0.17, 0.07), PINO(), n=3)

    def sobre_cono(ang, z, salir=0.04):
        for r, z0 in pisos:
            if z0 - 0.01 <= z <= z0 + 0.85:
                t = (z - z0) / 0.85
                rr = r * (1 - t * 0.88) + salir
                return (math.cos(ang) * rr, math.sin(ang) * rr, z)
        return None
    colores = (a, b, c, d, e)
    for k in range(42):
        ang = -math.pi / 2 + RNG.uniform(-1.5, 1.5) if k % 3 else RNG.uniform(0, 2 * math.pi)
        z = 0.85 + RNG.uniform(0, 2.2)
        p = sobre_cono(ang, z, 0.06)
        if p:
            bola(coll, f'esfera {k}', p, 0.085, laca(f'esfera {colores[k % 5]}', colores[k % 5], 0.2), n=4)
            bola(coll, f'esfera brillo {k}', (p[0] - 0.02, p[1] - 0.04, p[2] + 0.025), 0.016, luz('brillo', '#FFFFFF', 1.0), n=2, sub=0)
    hilo = []
    for k in range(70):
        t = k / 69
        ang = t * 2 * math.pi * 4.2
        z = 0.78 + t * 2.3
        p = sobre_cono(ang, z, 0.03)
        if p:
            hilo.append(p)
            if k % 2 == 0:
                bola(coll, f'luz árbol {k}', p, 0.05, luz(f'bombillo {BOMBILLOS[k // 2 % len(BOMBILLOS)]}', BOMBILLOS[k // 2 % len(BOMBILLOS)], 3.0), n=3)
    tubo(coll, 'hilo luces', hilo, 0.006, mat('socket', '#2E4A3A', 0.5), seg=4)
    estrella(coll, 'estrella árbol', (0, 0, 3.55), 0.26, luz('estrella', '#FFD45A', 1.8), t=0.04)
    # Marcos de recuerdos colgados al frente
    for k, (ang, z) in enumerate(((-1.9, 1.1), (-1.25, 1.55), (-1.75, 2.0), (-1.1, 0.95), (-1.5, 2.45))):
        p = sobre_cono(ang, z, 0.07)
        if not p:
            continue
        o = caja(coll, f'marco recuerdo {k}', (0, 0, 0), (0.13, 0.02, 0.16), madera('marco dorado', '#C8A15A'), p=8, sub=0)
        o.location = p
        o.rotation_euler = (0.25, 0, ang + math.pi / 2)
        caja(coll, f'foto recuerdo {k}', (0, -0.021, 0), (0.1, 0.004, 0.125), luz(f'foto {k}', ('#F6D7A7', '#CDE8F2', '#F4C6D0', '#D7E8C3', '#E8DDF4')[k], 0.6),
             p=12, sub=0).parent = o
        caja(coll, f'cinta recuerdo {k}', (0, 0, 0.2), (0.015, 0.006, 0.045), laca('moño', d, 0.35), p=12, sub=0).parent = o
    # Regalos y farolitos alrededor
    caja_regalo(coll, 'regalo a', (-0.75, -0.55, 0), (0.2, 0.18, 0.14), d, c)
    caja_regalo(coll, 'regalo b', (-0.42, -0.78, 0), (0.15, 0.15, 0.1), a, b)
    caja_regalo(coll, 'regalo c', (0.65, -0.6, 0), (0.17, 0.2, 0.16), '#7FB069', d)
    caja_regalo(coll, 'regalo d', (0.95, -0.25, 0), (0.12, 0.12, 0.09), b, d)
    for k, (x, y) in enumerate(((-1.25, -0.4), (1.3, -0.75))):
        cilindro(coll, f'farolito base {k}', (x, y, 0), 0.12, 0.05, metal('farol', '#3A302A'), seg=12)
        clay.lathe(f'farolito vidrio {k}', [(0.09, 0), (0.1, 0.22), (0.0, 0.22)], coll, vidrio('farol', '#F6E7C9'), segments=12,
                   subsurf=0).location = (x, y, 0.05)
        cilindro(coll, f'farolito vela {k}', (x, y, 0.05), 0.035, 0.1, mat('cera', '#F6F1E6', 0.6), seg=10)
        clay.blob(f'farolito llama {k}', (x, y, 0.2), (0.025, 0.025, 0.05), coll, luz('llama', '#FFB347', 4.0), n=3, p=1.6)
        clay.lathe(f'farolito techo {k}', [(0.13, 0), (0.0, 0.1)], coll, metal('farol', '#3A302A'), segments=12, subsurf=0).location = (x, y, 0.27)
        clay.lathe(f'farolito asa {k}', [(0.045, -0.012), (0.06, 0), (0.045, 0.012)], coll, metal('farol', '#3A302A'), segments=10, subsurf=0,
                   cap_bottom=False, cap_top=False).location = (x, y, 0.42)


# ---------------------------------------------------------------- rincones de adorno

def m_extra_primavera(coll):
    """Carretilla con plántulas, regadera y materas con flores."""
    a, b, c, d, e = TEMAS['primavera']
    o = clay.lathe('rueda', [(0.0, -0.04), (0.2, -0.04), (0.22, 0.0), (0.2, 0.04), (0.0, 0.04)], coll, madera('rueda', '#8A5A3B'), segments=20,
                   subsurf=1)
    o.location = (0.62, 0, 0.22)
    o.rotation_euler = (math.pi / 2, 0, 0)
    clay.lathe('rueda eje', [(0.03, -0.06), (0.03, 0.06)], coll, metal('eje', '#6B6F78'), segments=8, subsurf=0).location = (0.62, 0, 0.22)
    bpy.data.objects['rueda eje'].rotation_euler = (math.pi / 2, 0, 0)
    caja(coll, 'cajón carretilla', (0.05, 0, 0.5), (0.48, 0.32, 0.14), laca('carretilla', '#7FB069', 0.5), p=6)
    caja(coll, 'tierra carretilla', (0.05, 0, 0.62), (0.44, 0.28, 0.03), mat('tierra', '#5A3E2B', 0.95), p=6, sub=0)
    for s in (-1, 1):
        tubo(coll, f'manija {s}', [(0.5, s * 0.22, 0.38), (-0.2, s * 0.24, 0.4), (-0.75, s * 0.26, 0.55)], 0.025, MAD(), seg=6)
        bola(coll, f'puño {s}', (-0.8, s * 0.26, 0.57), (0.06, 0.035, 0.035), tela('puño', d), n=3)
        caja(coll, f'pata carretilla {s}', (-0.35, s * 0.22, 0.17), (0.025, 0.025, 0.17), MAD(), p=10, sub=0)
    for i in range(4):
        for j in range(3):
            brote(coll, f'carretilla brote {i}{j}', (-0.28 + i * 0.22, -0.18 + j * 0.18, 0.64), 1.3)
    clay.lathe('regadera', [(0, 0), (0.14, 0), (0.15, 0.22), (0.12, 0.25), (0.0, 0.25)], coll, metal('regadera', '#8FB8C9'), segments=18,
               subsurf=1).location = (-0.85, -0.45, 0)
    tubo(coll, 'pico regadera', [(-0.72, -0.45, 0.06), (-0.55, -0.45, 0.2), (-0.45, -0.45, 0.32)], 0.025, metal('regadera', '#8FB8C9'), seg=8)
    clay.lathe('flor regadera', [(0.0, 0.0), (0.05, 0.02), (0.05, 0.03)], coll, metal('regadera', '#8FB8C9'), segments=12,
               subsurf=0).location = (-0.44, -0.45, 0.32)
    tubo(coll, 'asa regadera', [(-0.95, -0.45, 0.22), (-0.88, -0.45, 0.38), (-0.75, -0.45, 0.24)], 0.018, metal('regadera', '#8FB8C9'), seg=6)
    for k, (x, y, r, col) in enumerate(((0.85, -0.55, 0.12, a), (1.15, -0.25, 0.1, d), (1.05, 0.2, 0.13, b), (-0.55, 0.45, 0.11, e))):
        maceta(coll, f'maceta suelta {k}', (x, y, 0), r, col, centro=(b, e, '#F28C45', b)[k])


def m_extra_verano(coll):
    """Cojines, dos tamborcitos, un cajón de naranjas y un farol en su palo."""
    a, b, c, d, e = TEMAS['verano']
    for k, (x, y, z, col) in enumerate(((-0.5, 0.1, 0.07, c), (-0.15, -0.3, 0.07, a), (-0.4, -0.15, 0.2, d), (0.25, 0.2, 0.07, b))):
        clay.blob(f'cojín {k}', (x, y, z), (0.24, 0.24, 0.075), coll, tela(f'cojín {col}', col), n=6, p=3.0)
        bola(coll, f'cojín botón {k}', (x, y, z + 0.07), 0.025, tela('botón cojín', e), n=3)
        for s in (-1, 1):
            for t in (-1, 1):
                bola(coll, f'cojín borla {k}{s}{t}', (x + s * 0.24, y + t * 0.24, z), 0.03, tela(f'borla {col}', e), n=2)
    for k, (x, y, h, col) in enumerate(((0.75, -0.25, 0.32, d), (1.0, -0.05, 0.26, a))):
        clay.lathe(f'tamborcito {k}', [(0, 0), (0.1, 0), (0.12, h * 0.6), (0.15, h), (0, h)], coll, laca(f'tamborcito {col}', col, 0.4),
                   segments=18, subsurf=1).location = (x, y, 0)
        cilindro(coll, f'tamborcito parche {k}', (x, y, h), 0.15, 0.02, mat('parche', '#F3E6CA', 0.7), seg=18)
        for j in range(6):
            ang = j * math.pi / 3
            tubo(coll, f'tamborcito cuerda {k}{j}', [(x + math.cos(ang) * 0.11, y + math.sin(ang) * 0.11, 0.04),
                                                   (x + math.cos(ang + 0.5) * 0.15, y + math.sin(ang + 0.5) * 0.15, h - 0.02)], 0.007,
                 mat('cuerda', '#F2E3C4', 0.8), seg=3)
    caja(coll, 'cajón naranjas', (0.6, 0.55, 0.15), (0.32, 0.22, 0.15), MAD(), p=8)
    for k in range(3):
        caja(coll, f'cajón tabla {k}', (0.6, 0.32, 0.05 + k * 0.1), (0.33, 0.012, 0.035), OSC(), p=10, sub=0)
    for k in range(10):
        bola(coll, f'naranja {k}', (0.36 + (k % 5) * 0.12, 0.48 + (k // 5) * 0.14, 0.33 + (k % 2) * 0.02), 0.065, laca('naranja', '#F28C45', 0.4), n=3)
    caja(coll, 'palo farol', (-0.95, 0.4, 0.8), (0.04, 0.04, 0.8), OSC(), p=10)
    tubo(coll, 'brazo farol', [(-0.95, 0.4, 1.55), (-0.75, 0.4, 1.6), (-0.65, 0.4, 1.55)], 0.02, OSC(), seg=5)
    farolillo(coll, 'farol palo', (-0.65, 0.4, 1.3), 0.15, a)


def m_extra_otono(coll):
    """Espantapájaros de trapo sobre pacas, calabazas y un atado de cañas de maíz."""
    a, b, c, d, e = TEMAS['otono']
    paca(coll, 'paca abajo', (0, 0, 0))
    paca(coll, 'paca arriba', (0.1, 0.05, 0.5), giro=0.25)
    sx, sy = -0.75, 0.25
    caja(coll, 'espanta palo', (sx, sy, 0.95), (0.035, 0.035, 0.95), MAD(), p=10)
    caja(coll, 'espanta travesaño', (sx, sy, 1.45), (0.5, 0.03, 0.03), MAD(), p=10)
    clay.blob('espanta camisa', (sx, sy, 1.3), (0.26, 0.17, 0.3), coll, tela('camisa cuadros', '#B5432F'), n=6, p=2.4)
    for k in range(3):
        caja(coll, f'cuadro camisa {k}', (sx, sy - 0.17, 1.15 + k * 0.13), (0.24, 0.006, 0.012), tela('raya camisa', '#7A2E22'), p=12, sub=0)
    for s in (-1, 1):
        clay.blob(f'espanta manga {s}', (sx + s * 0.35, sy, 1.45), (0.18, 0.1, 0.09), coll, tela('camisa cuadros', '#B5432F'), n=4)
        for k in range(4):
            tubo(coll, f'paja mano {s}{k}', [(sx + s * 0.5, sy, 1.45), (sx + s * 0.62, sy + (k - 1.5) * 0.03, 1.4 - k * 0.02)], 0.012, PAJA(), seg=3)
    clay.blob('espanta cabeza', (sx, sy, 1.78), (0.17, 0.15, 0.17), coll, tela('costal', '#D8C49C'), n=6)
    for s in (-1, 1):
        bola(coll, f'espanta ojo {s}', (sx + s * 0.06, sy - 0.14, 1.82), (0.028, 0.012, 0.028), mat('botón ojo', '#3A2A20', 0.4), n=3)
    clay.stitches('espanta sonrisa', [(sx - 0.07, sy - 0.15, 1.73), (sx, sy - 0.16, 1.7), (sx + 0.07, sy - 0.15, 1.73)], coll=coll,
                  material=mat('hilo', '#3A2A20', 0.6))
    bola(coll, 'espanta nariz', (sx, sy - 0.16, 1.77), (0.03, 0.025, 0.025), laca('nariz', '#F28C45', 0.5), n=3)
    clay.lathe('sombrero ala', [(0.0, 0.0), (0.3, 0.0), (0.31, 0.02), (0.0, 0.03)], coll, PAJA(), segments=20, subsurf=1).location = (sx, sy, 1.9)
    clay.lathe('sombrero copa', [(0.15, 0.0), (0.14, 0.12), (0.0, 0.14)], coll, PAJA(), segments=16, subsurf=1).location = (sx, sy, 1.92)
    clay.lathe('sombrero cinta', [(0.152, 0.0), (0.15, 0.04)], coll, tela('cinta sombrero', d), segments=16, subsurf=0, cap_bottom=False,
               cap_top=False).location = (sx, sy, 1.93)
    calabaza(coll, 'calabaza paca', (0.2, 0.0, 1.0), 0.18)
    calabaza(coll, 'calabaza suelo a', (0.75, -0.35, 0), 0.24)
    calabaza(coll, 'calabaza suelo b', (0.45, -0.55, 0), 0.13, '#F2A33A')
    calabaza(coll, 'calabaza suelo c', (-0.35, -0.5, 0), 0.15, '#F2E8D5')
    for k in range(9):
        ang = k * 2 * math.pi / 9
        p0 = (0.85 + math.cos(ang) * 0.08, 0.45 + math.sin(ang) * 0.08, 0)
        p1 = (0.85 + math.cos(ang) * 0.02, 0.45 + math.sin(ang) * 0.02, 0.7)
        p2 = (0.85 + math.cos(ang) * 0.16, 0.45 + math.sin(ang) * 0.16, 1.35)
        clay.sweep(f'caña {k}', [p0, p1, p2], [0.03, 0.02, 0.008], profile=(1.0, 0.5), coll=coll, material=PAJA(), segments=5, samples=3,
                   caps=('flat', 'point'), subsurf=0)
    tubo(coll, 'amarre cañas', [(0.79, 0.45, 0.65), (0.85, 0.39, 0.66), (0.91, 0.45, 0.65), (0.85, 0.51, 0.64), (0.79, 0.45, 0.65)], 0.014,
         mat('cabuya', '#8A6A44', 0.8), seg=4)
    for k, col in enumerate((a, b, c, a, e)):
        o = bola(coll, f'hoja suelo {k}', (0, 0, 0), (0.08, 0.06, 0.012), tela(f'hoja otoño {col}', col), n=3)
        o.location = (RNG.uniform(-0.9, 0.9), RNG.uniform(-0.8, -0.4), 0.01)
        o.rotation_euler = (0, 0, RNG.uniform(0, 3))


def m_extra_invierno(coll):
    """Muñeco de nieve de fieltro con bufanda y sombrero, farol de vela y regalos."""
    a, b, c, d, e = TEMAS['invierno']
    nieve = tela('nieve', '#F7F9FC')
    for k, (r, z) in enumerate(((0.36, 0.3), (0.27, 0.78), (0.2, 1.15))):
        bola(coll, f'muñeco bola {k}', (0, 0, z), (r, r * 0.95, r * 0.9), nieve, n=6)
    for k in range(3):
        bola(coll, f'muñeco botón {k}', (0, -0.26 + k * 0.01, 0.66 + k * 0.12), 0.03, mat('carbón', '#2B2422', 0.6), n=3)
    for s in (-1, 1):
        bola(coll, f'muñeco ojo {s}', (s * 0.07, -0.17, 1.2), 0.025, mat('carbón', '#2B2422', 0.6), n=3)
        bola(coll, f'muñeco cachete {s}', (s * 0.12, -0.15, 1.12), (0.035, 0.01, 0.025), tela('cachete', '#F4A7B9'), n=3)
        tubo(coll, f'muñeco brazo {s}', [(s * 0.22, 0, 0.85), (s * 0.45, -0.02, 1.0), (s * 0.58, 0, 1.12)], 0.02, madera('rama', '#7A5034'), seg=4)
        tubo(coll, f'muñeco dedito {s}', [(s * 0.5, -0.01, 1.04), (s * 0.58, -0.01, 1.0)], 0.012, madera('rama', '#7A5034'), seg=4)
    o = clay.lathe('muñeco nariz', [(0.0, 0.0), (0.035, 0.0), (0.0, 0.16)], coll, laca('zanahoria', '#F28C45', 0.5), segments=10, subsurf=0)
    o.location = (0, -0.18, 1.15)
    o.rotation_euler = (math.pi / 2 + 0.15, 0, 0)
    for k in range(4):
        bola(coll, f'muñeco sonrisa {k}', ((k - 1.5) * 0.04, -0.18 + abs(k - 1.5) * 0.01, 1.08 + abs(k - 1.5) * 0.015), 0.015,
             mat('carbón', '#2B2422', 0.6), n=2)
    clay.lathe('bufanda', [(0.2, -0.05), (0.24, 0.0), (0.2, 0.05)], coll, tela('bufanda', d), segments=20, subsurf=1, cap_bottom=False,
               cap_top=False).location = (0, 0, 0.97)
    clay.sweep('bufanda cola', [(0.12, -0.18, 0.97), (0.16, -0.24, 0.8), (0.15, -0.26, 0.65)], 0.05, profile=(1.0, 0.3), coll=coll,
               material=tela('bufanda', d), segments=6, samples=3, caps=('flat', 'flat'), subsurf=0)
    for k in range(3):
        caja(coll, f'bufanda raya {k}', (0.155, -0.255, 0.78 - k * 0.05), (0.05, 0.004, 0.01), tela('raya bufanda', b), p=12, sub=0)
    clay.lathe('sombrero ala', [(0.0, 0.0), (0.22, 0.0), (0.22, 0.025), (0.0, 0.03)], coll, tela('sombrero', '#2E3A4A'), segments=20,
               subsurf=1).location = (0, 0, 1.31)
    clay.lathe('sombrero copa', [(0.14, 0.0), (0.14, 0.22), (0.0, 0.23)], coll, tela('sombrero', '#2E3A4A'), segments=16, subsurf=1).location = (0, 0, 1.32)
    clay.lathe('sombrero cinta', [(0.143, 0.0), (0.143, 0.05)], coll, tela('cinta sombrero', a), segments=16, subsurf=0, cap_bottom=False,
               cap_top=False).location = (0, 0, 1.34)
    flor(coll, 'flor sombrero', (0.1, -0.1, 1.38), 0.04, b, centro=c, cara='y')
    for k, (x, y) in enumerate(((-0.3, -0.12), (0.28, -0.18), (0.05, -0.34), (-0.2, 0.25))):
        bola(coll, f'nieve suelo {k}', (x, y, 0.03), (0.15, 0.12, 0.08), nieve, n=4)
    caja(coll, 'farol palo', (0.75, 0.3, 0.7), (0.035, 0.035, 0.7), metal('farol', '#3A302A'), p=10, sub=0)
    cilindro(coll, 'farol base', (0.75, 0.3, 1.38), 0.11, 0.04, metal('farol', '#3A302A'), seg=12)
    clay.lathe('farol vidrio', [(0.08, 0), (0.09, 0.22), (0.0, 0.22)], coll, vidrio('farol', '#F6E7C9'), segments=12, subsurf=0).location = (0.75, 0.3, 1.42)
    cilindro(coll, 'farol vela', (0.75, 0.3, 1.42), 0.03, 0.09, mat('cera', '#F6F1E6', 0.6), seg=10)
    clay.blob('farol llama', (0.75, 0.3, 1.56), (0.022, 0.022, 0.045), coll, luz('llama', '#FFB347', 4.0), n=3, p=1.6)
    clay.lathe('farol techo', [(0.12, 0), (0.0, 0.1)], coll, metal('farol', '#3A302A'), segments=12, subsurf=0).location = (0.75, 0.3, 1.64)
    caja_regalo(coll, 'regalo muñeco a', (-0.65, -0.3, 0), (0.15, 0.15, 0.12), a, c)
    caja_regalo(coll, 'regalo muñeco b', (-0.85, 0.05, 0), (0.12, 0.1, 0.09), d, b)


# ---------------------------------------------------------------- corona para la repisa de la fuente

def _borde(coll, tema):
    a, b, c, d, e = TEMAS[tema]
    R = 2.09
    n = 14
    for k in range(n):
        ang = k * 2 * math.pi / n
        x, y = math.cos(ang) * R, math.sin(ang) * R
        if tema == 'primavera':
            if k % 2 == 0:
                maceta(coll, f'borde maceta {k}', (x, y, 0), 0.1, (a, d, b, e)[k // 2 % 4], centro=(b, e)[k % 4 // 2])
            else:
                for j in range(3):
                    brote(coll, f'borde brote {k}{j}', (x + (j - 1) * 0.07, y, 0), 2.1)
        elif tema == 'verano':
            if k % 2 == 0:
                clay.lathe(f'borde frasco {k}', [(0, 0), (0.085, 0), (0.095, 0.17), (0.075, 0.2)], coll, vidrio('frasco vela', '#F6E7C9'),
                           segments=12, subsurf=0).location = (x, y, 0)
                cilindro(coll, f'borde vela {k}', (x, y, 0), 0.05, 0.09, mat('cera', '#F6F1E6', 0.6), seg=10)
                clay.blob(f'borde llama {k}', (x, y, 0.14), (0.03, 0.03, 0.055), coll, luz('llama', '#FFB347', 4.0), n=3, p=1.6)
                tubo(coll, f'borde lazo {k}', [(x - 0.09, y, 0.15), (x + 0.09, y, 0.15)], 0.016, tela(f'cinta {(a, c, d)[k // 2 % 3]}', (a, c, d)[k // 2 % 3]),
                     seg=4)
            else:
                def ondas(v):
                    a2 = np.arctan2(v[:, 1], v[:, 0])
                    f = 1 + 0.12 * np.cos(a2 * 9)
                    v[:, 0] *= f
                    v[:, 1] *= f
                    return v
                o = clay.blob(f'borde concha {k}', (0, 0, 0.045), (0.11, 0.09, 0.045), coll, laca('concha', ('#F6D7C3', '#F4A7B9')[k % 4 // 2], 0.4), n=5,
                              shaper=ondas)
                o.location = (x, y, 0)
                o.rotation_euler = (0, 0, ang)
        elif tema == 'otono':
            if k % 2 == 0:
                calabaza(coll, f'borde calabaza {k}', (x, y, 0), 0.11 + 0.02 * (k % 3), (a, '#F2E8D5', '#F2A33A', '#7FA04A')[k // 2 % 4])
            else:
                o = bola(coll, f'borde hoja {k}', (0, 0, 0), (0.12, 0.09, 0.016), tela(f'hoja otoño {(a, b, c)[k % 3]}', (a, b, c)[k % 3]), n=3)
                o.location = (x, y, 0.015)
                o.rotation_euler = (0, 0, ang + 0.6)
                bola(coll, f'borde bellota {k}', (x, y, 0.06), (0.045, 0.045, 0.055), laca('bellota', '#B07A45', 0.45), n=3)
        else:
            if k % 2 == 0:
                h = 0.18 + 0.07 * (k // 2 % 3)
                cilindro(coll, f'borde vela {k}', (x, y, 0), 0.06, h, mat('cera', '#F6F1E6', 0.6), seg=10)
                clay.blob(f'borde llama {k}', (x, y, h + 0.06), (0.032, 0.032, 0.065), coll, luz('llama', '#FFB347', 4.0), n=3, p=1.6)
            else:
                for j in range(3):
                    o = bola(coll, f'borde ramita {k}{j}', (0, 0, 0), (0.12, 0.05, 0.045), PINO(), n=3)
                    o.location = (x, y, 0.035)
                    o.rotation_euler = (0, 0, ang + j * 1.0)
                for j in range(3):
                    bola(coll, f'borde baya {k}{j}', (x + (j - 1) * 0.03, y, 0.08), 0.026, laca('baya', '#C9302C', 0.3), n=2)


def m_borde_primavera(coll):
    _borde(coll, 'primavera')


def m_borde_verano(coll):
    _borde(coll, 'verano')


def m_borde_otono(coll):
    _borde(coll, 'otono')


def m_borde_invierno(coll):
    _borde(coll, 'invierno')


PIEZAS = {k[2:]: v for k, v in globals().items() if k.startswith('m_') and callable(v)}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Festivales granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_festivales.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
