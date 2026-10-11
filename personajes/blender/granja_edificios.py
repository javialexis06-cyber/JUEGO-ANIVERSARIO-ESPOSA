"""Nuestro Hogar · granja: los edificios del Pueblo del Sol (locales y viviendas), con las medidas de pueblo.ts.

Cada pieza es un edificio entero de ancho × fondo (el juego lo pone en el centro de su huella) con la paleta de su
oficio: zócalo de piedra, paredes de pañete con entramado de madera, puerta con su arco de vidrio y farolito, ventanas
con postigos y jardineras, techo de tejas en escama, frontón con ojo de buey y chimenea. El letrero con el nombre lo
sigue pintando el juego encima de la puerta (por eso esa franja de la fachada queda libre).

Claves: edificio_<oficio>_<ancho>x<fondo>  (las viviendas usan la paleta del oficio que les asigna pueblo.ts)
Coordenadas: origen en el centro de la huella, base en z=0, fachada (puerta) hacia -y.

Uso: blender -b -P granja_edificios.py -- <carpeta_salida> [claves]
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
from granja_muebles import bola, caja, cilindro, mat, metal, piedra, tubo  # noqa: E402
from granja_festivales import flor  # noqa: E402

RNG = np.random.default_rng(31)
# Paletas de pueblo.ts: [pared, techo, detalle]
PALETAS = {
    'semillas': ('#EDC38F', '#A56548', '#809958'), 'animales': ('#D7BF93', '#699C91', '#A95E4D'),
    'carpinteria': ('#CAA77C', '#656F50', '#976B42'), 'herreria': ('#B5B2A2', '#637E8B', '#525766'),
    'clinica': ('#E8E5C8', '#78A492', '#92ADA4'), 'posada': ('#EAD6B0', '#8F6976', '#977346'),
    'archivo': ('#D8C7A8', '#7D8399', '#699181'),
}
EDIFICIOS = [('semillas', 8, 7), ('animales', 7, 6), ('carpinteria', 9, 7), ('herreria', 7, 7), ('clinica', 7, 6), ('posada', 10, 8),
             ('archivo', 9, 7), ('clinica', 7, 7), ('archivo', 7, 7), ('animales', 7, 7), ('carpinteria', 7, 7), ('posada', 7, 7)]
VIGA = lambda: madera('viga', '#674A39')  # noqa: E731
CREMA = lambda: mat('crema', '#F0DABC', 0.8)  # noqa: E731
VIDRIO = lambda: mat('vidrio ventana', '#9EBCC0', 0.15, coat=0.6)  # noqa: E731
PIEDRA_ZOC = lambda: piedra('zócalo', '#ADA793')  # noqa: E731


def malla(nombre, verts, caras, coll, material):
    o = clay.make_mesh_object(nombre, verts, caras, coll, material=material)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    o.data.shade_smooth()
    return o


def cubo(coll, nombre, c, half, material, bisel=0.035):
    """Bloque recto con las aristas apenas redondeadas (paredes y zócalos: un bloque blando se infla en tamaños grandes)."""
    x, y, z = c
    hx, hy, hz = half
    verts = [(x + sx * hx, y + sy * hy, z + sz * hz) for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    caras = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]
    o = malla(nombre, verts, caras, coll, material)
    clay.add_bevel(o, width=bisel, segments=2)
    for pol in o.data.polygons:
        pol.use_smooth = False
    return o


def tira_tejas(coll, nombre, largo, ancho, material, paso=0.36, bulto=0.09, grosor=0.06):
    """Fila de tejas en escama: losa de largo (eje y) × ancho (eje x, de 0 a ancho) con el borde de abajo ondulado."""
    n = max(4, int(largo / paso)) * 6
    ys = np.linspace(-largo / 2, largo / 2, n + 1)
    fase = (ys + largo / 2) / paso
    borde = ancho + bulto * np.sqrt(np.clip(1 - (2 * (fase % 1) - 1) ** 2, 0, 1))
    verts, caras = [], []
    for z in (0.0, -grosor):
        for y in ys:
            verts.append((0.0, y, z))
        for y, b in zip(ys, borde):
            verts.append((b, y, z))
    m = n + 1
    arriba, abajo = 0, 2 * m  # cara superior: filas 0 (borde alto) y 1 (borde bajo); cara inferior: filas 2 y 3
    for i in range(n):
        caras.append((arriba + i, arriba + i + 1, arriba + m + i + 1, arriba + m + i))
        caras.append((abajo + m + i, abajo + m + i + 1, abajo + i + 1, abajo + i))
        caras.append((arriba + m + i, arriba + m + i + 1, abajo + m + i + 1, abajo + m + i))
        caras.append((abajo + i, abajo + i + 1, arriba + i + 1, arriba + i))
    caras.append((arriba, arriba + m, abajo + m, abajo))
    caras.append((arriba + n, abajo + n, abajo + m + n, arriba + m + n))
    o = malla(nombre, verts, caras, coll, material)
    for pol in o.data.polygons:  # plano: suavizado se arrugaba entre la cara de arriba y el canto
        pol.use_smooth = False
    return o


def ventana(coll, nombre, x, z, y, ancho, detalle, cara='frente', jardinera=True):
    """Ventana con marco, vidrio, cruz, alféizar, postigos con tablillas y jardinera con flores.
    cara='frente': en la fachada (y = pared, sale hacia -y); cara='lado': en el costado +x (x = pared)."""
    def P(u, v, w):  # u: a lo largo de la pared, v: hacia afuera, w: altura
        return (x + u, y - v, w) if cara == 'frente' else (x + v, y + u, w)

    def H(hu, hv, hw):
        return (hu, hv, hw) if cara == 'frente' else (hv, hu, hw)

    caja(coll, f'{nombre} marco', P(0, 0.06, z), H((ancho + 0.24) / 2, 0.075, 0.78), VIGA(), p=8)
    caja(coll, f'{nombre} vidrio', P(0, 0.14, z), H(ancho / 2, 0.02, 0.65), VIDRIO(), p=12, sub=0)
    caja(coll, f'{nombre} parteluz', P(0, 0.17, z), H(0.04, 0.03, 0.65), CREMA(), p=10, sub=0)
    caja(coll, f'{nombre} travesaño', P(0, 0.17, z + 0.12), H(ancho / 2, 0.03, 0.035), CREMA(), p=10, sub=0)
    for k in (-1, 1):
        caja(coll, f'{nombre} brillo {k}', P(k * ancho * 0.22, 0.165, z + 0.38), H(0.05, 0.004, 0.14), mat('brillo vidrio', '#DDF0F2', 0.1), p=12, sub=0)
    caja(coll, f'{nombre} alféizar', P(0, 0.2, z - 0.8), H((ancho + 0.4) / 2, 0.18, 0.07), PIEDRA_ZOC(), p=6)
    for s in (-1, 1):
        u = s * (ancho / 2 + 0.28)
        caja(coll, f'{nombre} postigo {s}', P(u, 0.08, z), H(0.17, 0.05, 0.71), laca(f'detalle {detalle}', detalle, 0.5), p=8)
        for k in range(5):
            caja(coll, f'{nombre} tablilla {s}{k}', P(u, 0.135, z - 0.5 + k * 0.25), H(0.14, 0.012, 0.02), VIGA(), p=12, sub=0)
        bola(coll, f'{nombre} bisagra {s}', P(u - s * 0.15, 0.13, z + 0.4), 0.025, metal('bisagra', '#3E4A57'), n=2, sub=0)
    if jardinera:
        caja(coll, f'{nombre} jardinera', P(0, 0.3, z - 0.95), H((ancho + 0.1) / 2, 0.13, 0.11), madera('jardinera', '#8A5A3B'), p=8)
        for k in range(int(ancho / 0.22)):
            u = -ancho / 2 + 0.11 + k * 0.22
            bola(coll, f'{nombre} mata {k}', P(u, 0.3, z - 0.8), H(0.1, 0.09, 0.07), mat('hoja', ('#5FA85A', '#4C8B45')[k % 2], 0.55), n=3)
            if k % 2 == 0:
                c = ('#E58FA6', '#F2C94C', '#F6F1E6', '#C9A8E0')[(k // 2) % 4]
                flor(coll, f'{nombre} flor {k}', P(u, 0.4, z - 0.72), 0.05, c, centro='#F2C94C', cara='y' if cara == 'frente' else 'z')


def edificio(coll, oficio, w, d):
    pared, techo, detalle = PALETAS[oficio]
    h = 4.65 if oficio == 'posada' else 3.7
    fy = -d / 2  # fachada
    m_pared = mat(f'pared {pared}', pared, 0.85, noise=dict(scale=18, strength=0.25, distance=0.004))
    m_techo = laca(f'techo {techo}', techo, 0.55)
    m_techo2 = laca(f'techo claro {techo}', '#' + ''.join(f'{min(255, int(int(techo[i:i + 2], 16) * 1.08)):02X}' for i in (1, 3, 5)), 0.55)
    m_detalle = laca(f'detalle {detalle}', detalle, 0.5)
    # Zócalo de piedra y paredes
    cubo(coll, 'zócalo', (0, 0, 0.21), ((w + 0.32) / 2, (d + 0.3) / 2, 0.21), PIEDRA_ZOC(), bisel=0.06)
    for k in range(int(w / 0.55)):
        x = -w / 2 + 0.3 + k * 0.55
        caja(coll, f'piedra zócalo {k}', (x, fy - 0.16, 0.2 + (k % 2) * 0.04), (0.24, 0.03, 0.12 - (k % 3) * 0.015),
             piedra(f'piedra {k % 3}', ('#B7B09A', '#9C968C', '#C6BEA8')[k % 3]), p=4)
    cubo(coll, 'paredes', (0, 0, (h + 0.3) / 2), (w / 2, d / 2, (h - 0.3) / 2), m_pared, bisel=0.05)
    # Entramado: esquinas, viga de arriba, franja de abajo y riostras en la fachada y el costado +x
    for x in (-w / 2 + 0.06, w / 2 - 0.06):
        caja(coll, f'esquinero {x}', (x, fy - 0.04, h / 2), (0.1, 0.11, h / 2), VIGA(), p=8)
    for y in (fy + 0.06, d / 2 - 0.06):
        caja(coll, f'esquinero lado {y}', (w / 2 + 0.04, y, h / 2), (0.11, 0.1, h / 2), VIGA(), p=8)
    caja(coll, 'viga alta', (0, fy - 0.07, h - 0.1), ((w + 0.12) / 2, 0.13, 0.11), VIGA(), p=8)
    caja(coll, 'franja', (0, fy - 0.07, 0.72), ((w + 0.12) / 2, 0.125, 0.12), m_detalle, p=8)
    caja(coll, 'viga alta lado', (w / 2 + 0.07, 0, h - 0.1), (0.13, d / 2, 0.11), VIGA(), p=8)
    caja(coll, 'franja lado', (w / 2 + 0.07, 0, 0.72), (0.125, d / 2, 0.12), m_detalle, p=8)
    # Cruz de San Andrés en el costado, entre las dos ventanas
    for s in (-1, 1):
        o = caja(coll, f'riostra {s}', (0, 0, 0), (0.06, 0.05, 0.85), VIGA(), p=10, sub=0)
        o.location = (w / 2 + 0.05, 0, 2.0)
        o.rotation_euler = (s * 0.62, 0, 0)
    # Puerta con arco de vidrio, perilla, farolito y escalones
    caja(coll, 'marco puerta', (0, fy - 0.05, 1.58), (0.8, 0.1, 1.3), VIGA(), p=8)
    caja(coll, 'puerta', (0, fy - 0.18, 1.45), (0.64, 0.075, 1.04), m_detalle, p=8)
    for k in range(4):
        caja(coll, f'tabla puerta {k}', (-0.48 + k * 0.32, fy - 0.26, 1.42), (0.018, 0.02, 0.98), VIGA(), p=12, sub=0)
    caja(coll, 'travesaño puerta', (0, fy - 0.26, 1.1), (0.6, 0.02, 0.04), VIGA(), p=12, sub=0)
    o = clay.lathe('arco puerta', [(0.0, -0.05), (0.58, -0.05), (0.58, 0.05), (0.0, 0.05)], coll, VIDRIO(), segments=24, subsurf=0)
    o.location = (0, fy - 0.2, 2.5)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.scale = (1, 0.55, 1)
    for k in range(3):
        a = math.pi * (k + 1) / 4
        t = caja(coll, f'rayo arco {k}', (0, 0, 0), (0.018, 0.02, 0.28), CREMA(), p=12, sub=0)
        t.location = (math.cos(a) * 0.29, fy - 0.27, 2.5 + math.sin(a) * 0.17)
        t.rotation_euler = (0, math.pi / 2 - a, 0)
    bola(coll, 'perilla', (0.42, fy - 0.3, 1.42), 0.07, metal('dorado', '#E5C574'), n=3)
    caja(coll, 'escalón', (0, fy - 0.52, 0.12), (1.125, 0.55, 0.1), PIEDRA_ZOC(), p=6)
    caja(coll, 'escalón bajo', (0, fy - 1.05, 0.055), (1.275, 0.325, 0.05), PIEDRA_ZOC(), p=6)
    caja(coll, 'tapete puerta', (0, fy - 0.55, 0.235), (0.5, 0.28, 0.012), tela(f'tapete {detalle}', detalle), p=6)
    # Ventanas del frente (y las de arriba en la posada) y del costado
    ancho = 1.55 if w > 8 else 1.2
    for s in (-1, 1):
        ventana(coll, f'ventana {s}', s * w * 0.3, 2.0, fy - 0.0, ancho, detalle)
    if oficio == 'posada':
        for k in (-1, 0, 1):
            ventana(coll, f'ventana alta {k}', k * (2.8 if w >= 9 else w * 0.3), 3.78, fy, 1.0, detalle, jardinera=False)
        caja(coll, 'balcón', (0, fy - 0.2, 2.7), ((w + 0.25) / 2, 0.2, 0.1), madera('balcón', '#B98E62'), p=8)
        for k in range(int(w / 0.4)):
            caja(coll, f'balaustre {k}', (-w / 2 + 0.2 + k * 0.4, fy - 0.36, 2.92), (0.03, 0.03, 0.15), madera('balcón', '#B98E62'), p=10, sub=0)
        caja(coll, 'baranda', (0, fy - 0.36, 3.08), ((w + 0.2) / 2, 0.04, 0.03), madera('balcón', '#B98E62'), p=10, sub=0)
    for j in range(2):
        y = -(1.55 + j * (d - 3) - d / 2)
        ventana(coll, f'ventana lado {j}', w / 2, 2.0, y, 1.0, detalle, cara='lado')
    # Techo de tejas en escama: dos aguas, la cumbrera a lo largo del fondo (y)
    pico, vuelo = 1.7, 0.38
    span = math.hypot(w / 2 + vuelo, pico)
    pend = math.atan2(pico, w / 2 + vuelo)
    largo = d + 0.85
    filas = 6
    for s in (-1, 1):
        base = cubo(coll, f'tablado {s}', (0, 0, 0), (span / 2, largo / 2, 0.06), m_techo)
        base.location = (s * (w / 2 + vuelo) / 2, 0, h + pico / 2 - 0.02)
        base.rotation_euler = (0, s * pend, 0)
        baja = np.array((s * math.cos(pend), 0.0, -math.sin(pend)))
        normal = np.array((s * math.sin(pend), 0.0, math.cos(pend)))
        for r in range(filas):
            # Cada fila arranca más abajo de la pendiente y queda encima de la siguiente (sus escamas la tapan)
            o = tira_tejas(coll, f'tejas {s}{r}', largo, span / filas + 0.1, (m_techo, m_techo2)[r % 2], paso=0.36, bulto=0.1)
            o.location = tuple(np.array((0.0, 0.0, h + pico)) + baja * (r * span / filas) + normal * (0.07 + (filas - r) * 0.014))
            o.rotation_euler = (0, pend, 0) if s > 0 else (0, pend, math.pi)
    o = clay.lathe('cumbrera', [(0.0, -largo / 2 - 0.05), (0.19, -largo / 2 - 0.05), (0.19, largo / 2 + 0.05), (0.0, largo / 2 + 0.05)], coll,
                   laca(f'cumbrera {techo}', techo, 0.6), segments=12, subsurf=1)
    o.location = (0, 0, h + pico + 0.06)
    o.rotation_euler = (math.pi / 2, 0, 0)
    # Frontones (adelante y atrás) con su viga, tablas de borde y ojo de buey
    for fy2, nom in ((fy - 0.025, 'frente'), (d / 2 + 0.025, 'atrás')):
        verts = [(-w / 2, fy2, h), (w / 2, fy2, h), (0, fy2, h + pico)]
        malla(f'frontón {nom}', verts + [(v[0], v[1] + (0.05 if nom == 'frente' else -0.05), v[2]) for v in verts],
              [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)], coll, CREMA())
        if nom == 'atrás' or oficio == 'posada':
            caja(coll, f'viga frontón {nom}', (0, fy2 - (0.06 if nom == 'frente' else -0.06), h + pico * 0.45), (0.08, 0.065, pico * 0.45), VIGA(), p=10,
                 sub=0)
        for s in (-1, 1):
            pts = [(s * (w / 2 + vuelo + 0.05), fy2 - (0.42 if nom == 'frente' else -0.42), h - 0.06),
                   (0, fy2 - (0.42 if nom == 'frente' else -0.42), h + pico + 0.06)]
            tubo(coll, f'tabla borde {nom}{s}', pts, 0.07, VIGA(), seg=6)
    if oficio != 'posada':
        o = clay.lathe('ojo de buey', [(0.0, -0.04), (0.26, -0.04), (0.26, 0.04), (0.0, 0.04)], coll, VIDRIO(), segments=20, subsurf=0)
        o.location = (0, fy - 0.1, h + 0.62)
        o.rotation_euler = (math.pi / 2, 0, 0)
        a = clay.lathe('aro ojo de buey', [(0.25, -0.06), (0.32, 0.0), (0.25, 0.06)], coll, VIGA(), segments=20, subsurf=0, cap_bottom=False,
                       cap_top=False)
        a.location = (0, fy - 0.12, h + 0.62)
        for k in range(2):
            caja(coll, f'cruz ojo {k}', (0, fy - 0.15, h + 0.62), (0.26, 0.02, 0.025) if k else (0.025, 0.02, 0.26), VIGA(), p=12, sub=0)
        a.rotation_euler = (math.pi / 2, 0, 0)
    # Chimenea de piedra con su sombrerete (la de la herrería, oscura)
    if oficio != 'animales':
        cx, cy = w * 0.3, d / 2 - d * 0.33
        roca = piedra('chimenea oscura', '#827E72') if oficio == 'herreria' else piedra('chimenea', '#E6D8B8')
        cubo(coll, 'chimenea', (cx, cy, h + 0.55), (0.45, 0.525, 1.35), roca, bisel=0.06)
        for k in range(8):
            caja(coll, f'ladrillo chimenea {k}', (cx + (0.2 if k % 2 else -0.2), cy - 0.54, h + 0.9 + k * 0.17), (0.17, 0.02, 0.06),
                 piedra('ladrillo', '#B5A58E' if oficio != 'herreria' else '#6E6A60'), p=6, sub=0)
        caja(coll, 'sombrerete', (cx, cy, h + 1.97), (0.57, 0.6, 0.115), piedra('chimenea oscura', '#827E72'), p=6)
        caja(coll, 'boca chimenea', (cx, cy, h + 2.1), (0.3, 0.32, 0.04), mat('hollín', '#2B2422', 0.95), p=8, sub=0)


def altar(coll, diosa):
    """Altar de Aura (vida, despertar: llama de luz y girasoles) o de Lara (calma: luna, lirios, rosas y velas).
    Huella de 4,6 × 4,7 centrada en el origen, con la puerta de columnas hacia el frente (-y) como en pueblo.ts."""
    aura = diosa == 'aura'
    col = '#D5B66A' if aura else '#9591AC'
    piedra_altar = piedra(f'altar {diosa}', '#E6D5B1' if aura else '#C1BBCA')
    columna = piedra(f'columna {diosa}', col)
    cubo(coll, 'base altar', (0, 0, 0.08), (2.3, 2.35, 0.08), PIEDRA_ZOC(), bisel=0.05)
    cubo(coll, 'tarima altar', (0, 0, 0.24), (1.65, 1.7, 0.09), piedra_altar, bisel=0.05)
    for k in range(3):
        cubo(coll, f'escalón altar {k}', (0, -1.75 - k * 0.18, 0.2 - k * 0.06), (0.6, 0.12, 0.06), piedra_altar, bisel=0.03)
    # Puerta de dos columnas con su dintel
    for sx in (-1, 1):
        x, y = sx * 1.2, 0.65
        clay.lathe(f'columna {sx}', [(0.0, 0.22), (0.28, 0.22), (0.26, 0.36), (0.19, 0.42), (0.17, 2.55), (0.22, 2.62), (0.0, 2.64)], coll, columna,
                   segments=16, subsurf=1).location = (x, y, 0)
        for z in (0.7, 1.4, 2.1):
            clay.lathe(f'anillo columna {sx}{z}', [(0.17, -0.03), (0.2, 0.0), (0.17, 0.03)], coll, metal('oro', '#E8C66A'), segments=16, subsurf=0,
                       cap_bottom=False, cap_top=False).location = (x, y, z)
        bola(coll, f'remate columna {sx}', (x, y, 2.86), (0.27, 0.27, 0.22), columna, n=4)
    cubo(coll, 'dintel', (0, 0.65, 2.77), (1.53, 0.19, 0.1), columna, bisel=0.04)
    cubo(coll, 'dintel alto', (0, 0.65, 2.96), (1.6, 0.22, 0.075), piedra(f'dintel {diosa}', '#E5CD83' if aura else '#AAA3BB'), bisel=0.04)
    o = clay.lathe('medallón dintel', [(0.0, -0.04), (0.28, -0.04), (0.3, 0.0), (0.28, 0.04), (0.0, 0.04)], coll, metal('oro', '#E8C66A'), segments=24,
                   subsurf=1)
    o.location = (0, 0.42, 2.86)
    o.rotation_euler = (math.pi / 2, 0, 0)
    if aura:
        for k in range(8):
            a = k * math.pi / 4
            bola(coll, f'rayo medallón {k}', (math.cos(a) * 0.38, 0.4, 2.86 + math.sin(a) * 0.38), (0.06, 0.03, 0.06), metal('oro', '#E8C66A'), n=2)
    else:
        bola(coll, 'luna medallón', (0.06, 0.37, 2.88), (0.18, 0.03, 0.18), mat('luna', '#F6F1E6', 0.4), n=4)
        bola(coll, 'sombra luna', (0.14, 0.35, 2.92), (0.16, 0.03, 0.16), metal('oro', '#E8C66A'), n=4)
    # Pedestal y lo sagrado de cada una
    clay.lathe('pedestal', [(0.0, 0.32), (0.7, 0.32), (0.66, 0.42), (0.58, 0.5), (0.56, 0.9), (0.62, 0.96), (0.0, 0.96)], coll, columna, segments=24,
               subsurf=1)
    clay.lathe('mesa pedestal', [(0.0, 0.96), (0.86, 0.96), (0.88, 1.03), (0.84, 1.09), (0.0, 1.09)], coll, mat('crema', '#F0DABC', 0.8), segments=28,
               subsurf=1)
    if aura:
        clay.blob('llama de aura', (0, 0, 1.62), (0.24, 0.24, 0.55), coll, luz('llama aura', '#F2C14E', 2.2), n=5, p=1.6)
        clay.blob('llama de aura media', (0.06, -0.08, 1.5), (0.16, 0.16, 0.38), coll, luz('llama aura media', '#E58B58', 2.6), n=4, p=1.6)
        clay.blob('llama de aura clara', (-0.02, -0.12, 1.4), (0.1, 0.1, 0.22), coll, luz('llama aura clara', '#FFF1B1', 3.0), n=4, p=1.6)
        for k in range(6):
            a = k * math.pi / 3
            hoja = tela('brote', '#8FD06A')
            o = bola(coll, f'brote {k}', (0, 0, 0.16), (0.07, 0.03, 0.16), hoja, n=3)
            o.location = (math.cos(a) * 0.5, math.sin(a) * 0.5, 1.09)
            o.rotation_euler = (0, 0.5, a)
    else:
        o = clay.lathe('aro de lara', [(0.36, -0.035), (0.4, 0.0), (0.36, 0.035)], coll, mat('aro lara', '#DDD5E9', 0.3), segments=32, subsurf=1,
                       cap_bottom=False, cap_top=False)
        o.location = (0, 0, 1.57)
        o.rotation_euler = (math.pi / 2, 0, 0)
        bola(coll, 'perla de lara', (0, 0, 1.57), 0.16, luz('perla lara', '#C9A8FF', 1.4), n=4)
        for k in range(5):
            a = k * 2 * math.pi / 5 + 0.3
            h = 0.14 + 0.06 * (k % 3)
            cilindro(coll, f'vela lara {k}', (math.cos(a) * 0.62, math.sin(a) * 0.62, 1.09), 0.045, h, mat('cera', '#F6F1E6', 0.6), seg=10)
            clay.blob(f'llama vela lara {k}', (math.cos(a) * 0.62, math.sin(a) * 0.62, 1.09 + h + 0.05), (0.025, 0.025, 0.05), coll,
                      luz('llama', '#FFB347', 4.0), n=3, p=1.6)
    # Corona de flores alrededor (sin tapar la entrada del frente)
    for k in range(14):
        a = k * 2 * math.pi / 14
        x, y = math.cos(a) * 1.6, math.sin(a) * 1.6
        if y < -0.9 and abs(x) < 0.75:
            continue
        tubo(coll, f'tallo {k}', [(x, y, 0.33), (x, y, 0.62)], 0.02, mat('tallo', '#5FA85A', 0.6), seg=4)
        for j in range(3):
            bola(coll, f'hoja flor {k}{j}', (x + math.cos(j * 2.1) * 0.08, y + math.sin(j * 2.1) * 0.08, 0.4), (0.07, 0.07, 0.035), mat('hoja', '#5FA85A', 0.55), n=2)
        if aura:
            for j in range(10):
                b = j * 2 * math.pi / 10
                bola(coll, f'pétalo girasol {k}{j}', (x + math.cos(b) * 0.1, y - 0.02, 0.7 + math.sin(b) * 0.1), (0.05, 0.015, 0.03),
                     tela('girasol', '#F2C14E'), n=2)
            bola(coll, f'centro girasol {k}', (x, y - 0.04, 0.7), (0.065, 0.025, 0.065), tela('centro girasol', '#7A5034'), n=3)
        elif k % 2:
            for j in range(5):
                b = j * 2 * math.pi / 5
                o = bola(coll, f'pétalo lirio {k}{j}', (0, 0, 0.07), (0.035, 0.02, 0.09), tela('lirio', '#F6F1E6'), n=2)
                o.location = (x, y, 0.62)
                o.rotation_euler = (0.6 * math.cos(b), 0.6 * math.sin(b), 0)
            bola(coll, f'estambre lirio {k}', (x, y, 0.68), 0.025, tela('estambre', '#F2C94C'), n=2)
        else:
            bola(coll, f'rosa {k}', (x, y, 0.68), (0.08, 0.08, 0.07), tela('rosa', '#8E3B5E'), n=3)
            bola(coll, f'rosa centro {k}', (x, y - 0.02, 0.73), (0.04, 0.04, 0.04), tela('rosa clara', '#B5577E'), n=2)


PIEZAS = {f'edificio_{o}_{w}x{d}': (lambda o=o, w=w, d=d: (lambda coll: edificio(coll, o, w, d)))() for o, w, d in EDIFICIOS}
PIEZAS['altar_aura'] = lambda coll: altar(coll, 'aura')
PIEZAS['altar_lara'] = lambda coll: altar(coll, 'lara')


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Edificios granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_edificios.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
