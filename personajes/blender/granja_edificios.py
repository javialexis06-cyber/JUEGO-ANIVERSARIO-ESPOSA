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


def techo_tejas(coll, w, d, h, techo, m_techo, m_techo2, pico=1.7, vuelo=0.38):
    """Techo de tejas en escama a dos aguas, con la cumbrera a lo largo del fondo (y)."""
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
    return pico, vuelo


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
    pico, vuelo = techo_tejas(coll, w, d, h, techo, m_techo, m_techo2)
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


def _claro(color, f=1.08):
    return '#' + ''.join(f'{max(0, min(255, int(int(color[i:i + 2], 16) * f))):02X}' for i in (1, 3, 5))


def fronton(coll, nombre, y, w, h, pico, material, hacia=-1):
    """Triángulo del frontón en la cara y (hacia=-1: fachada, sale hacia -y)."""
    verts = [(-w / 2, y, h), (w / 2, y, h), (0, y, h + pico)]
    malla(nombre, verts + [(v[0], v[1] - hacia * 0.05, v[2]) for v in verts],
          [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)], coll, material)


def antorcha(coll, nombre, x, y, z):
    """Antorcha de pared: soporte de hierro, copa y llama de tres capas (y = pared, sale hacia -y)."""
    hierro = metal('hierro', '#3E3A38')
    caja(coll, f'{nombre} placa', (x, y - 0.03, z), (0.07, 0.03, 0.14), hierro, p=6, sub=0)
    tubo(coll, f'{nombre} brazo', [(x, y - 0.04, z - 0.05), (x, y - 0.2, z + 0.02), (x, y - 0.26, z + 0.18)], 0.025, hierro, seg=6)
    clay.lathe(f'{nombre} copa', [(0.0, 0.0), (0.05, 0.0), (0.1, 0.12), (0.11, 0.16), (0.0, 0.16)], coll, hierro, segments=12,
               subsurf=0).location = (x, y - 0.26, z + 0.16)
    clay.blob(f'{nombre} llama', (x, y - 0.26, z + 0.42), (0.09, 0.09, 0.2), coll, luz('llama antorcha', '#F2A33A', 3.0), n=4, p=1.6)
    clay.blob(f'{nombre} llama clara', (x, y - 0.28, z + 0.36), (0.05, 0.05, 0.11), coll, luz('llama clara', '#FFE9A8', 3.5), n=3, p=1.6)


def estandarte(coll, nombre, x, y, z, alto, color, emblema='#E8C66A', hacia=-1):
    """Estandarte de tela colgado de una barra que sale de la pared, con el borde en punta y una estrella."""
    oro = metal('oro', '#E8C66A')
    tela_e = tela(f'estandarte {color}', color)
    tubo(coll, f'{nombre} barra', [(x - 0.42, y + hacia * 0.12, z), (x + 0.42, y + hacia * 0.12, z)], 0.025, oro, seg=6)
    for s in (-1, 1):
        bola(coll, f'{nombre} remate {s}', (x + s * 0.45, y + hacia * 0.12, z), 0.045, oro, n=2, sub=0)
    caja(coll, f'{nombre} paño', (x, y + hacia * 0.14, z - alto / 2), (0.34, 0.025, alto / 2), tela_e, p=8, sub=1)
    for s in (-1, 1):  # la punta: dos cuñas
        o = caja(coll, f'{nombre} punta {s}', (0, 0, 0), (0.25, 0.024, 0.09), tela_e, p=8, sub=1)
        o.location = (x + s * 0.17, y + hacia * 0.14, z - alto - 0.03)
        o.rotation_euler = (0, s * 0.45, 0)
    for s in (-1, 1):
        caja(coll, f'{nombre} ribete {s}', (x + s * 0.33, y + hacia * 0.17, z - alto / 2), (0.022, 0.012, alto / 2), oro, p=10, sub=0)
    caja(coll, f'{nombre} ribete alto', (x, y + hacia * 0.17, z - 0.08), (0.34, 0.012, 0.022), oro, p=10, sub=0)
    # Estrella de cinco puntas
    cy = y + hacia * 0.175
    bola(coll, f'{nombre} estrella', (x, cy, z - alto * 0.45), (0.07, 0.015, 0.07), mat('emblema', emblema, 0.4), n=3, sub=0)
    for k in range(5):
        a = math.pi / 2 + k * 2 * math.pi / 5
        o = bola(coll, f'{nombre} rayo {k}', (0, 0, 0), (0.035, 0.012, 0.11), mat('emblema', emblema, 0.4), n=2, sub=0)
        o.location = (x + math.cos(a) * 0.09, cy, z - alto * 0.45 + math.sin(a) * 0.09)
        o.rotation_euler = (0, math.pi / 2 - a, 0)


def escudo_espadas(coll, nombre, x, y, z, r=0.42, color='#3E5C76'):
    """Escudo redondo con dos espadas cruzadas detrás (emblema del gremio), mirando al frente (-y)."""
    acero = metal('acero', '#C7CED6')
    oro = metal('oro', '#E8C66A')
    for s in (-1, 1):
        o = caja(coll, f'{nombre} hoja {s}', (0, 0, 0), (0.045, 0.02, r * 1.35), acero, p=10, sub=0)
        o.location = (x, y + 0.02, z)
        o.rotation_euler = (0, s * 0.75, 0)
        a = s * 0.75
        gx, gz = x - math.sin(a) * r * 1.35, z - math.cos(a) * r * 1.35
        o = caja(coll, f'{nombre} guarda {s}', (0, 0, 0), (0.16, 0.03, 0.03), oro, p=8, sub=0)
        o.location = (gx, y + 0.0, gz)
        o.rotation_euler = (0, a, 0)
        o = caja(coll, f'{nombre} mango {s}', (0, 0, 0), (0.03, 0.03, 0.12), madera('mango', '#5A3A28'), p=8, sub=0)
        o.location = (gx - math.sin(a) * 0.14, y, gz - math.cos(a) * 0.14)
        o.rotation_euler = (0, a, 0)
        bola(coll, f'{nombre} pomo {s}', (gx - math.sin(a) * 0.28, y, gz - math.cos(a) * 0.28), 0.045, oro, n=2, sub=0)
    o = clay.lathe(f'{nombre} disco', [(0.0, 0.0), (r, 0.0), (r, 0.06), (r * 0.8, 0.11), (0.0, 0.13)], coll, laca(f'escudo {color}', color, 0.45),
                   segments=28, subsurf=1)
    o.location = (x, y - 0.03, z)
    o.rotation_euler = (math.pi / 2, 0, 0)
    a = clay.lathe(f'{nombre} aro', [(r - 0.03, -0.035), (r + 0.03, 0.0), (r - 0.03, 0.035)], coll, oro, segments=28, subsurf=0, cap_bottom=False,
                   cap_top=False)
    a.location = (x, y - 0.06, z)
    a.rotation_euler = (math.pi / 2, 0, 0)
    bola(coll, f'{nombre} umbo', (x, y - 0.17, z), (0.11, 0.06, 0.11), oro, n=3)
    for k in range(8):
        t = k * math.pi / 4
        bola(coll, f'{nombre} remache {k}', (x + math.cos(t) * r * 0.78, y - 0.12, z + math.sin(t) * r * 0.78), 0.025, oro, n=2, sub=0)


def gremio(coll, w=9, d=7):
    """Gremio de aventureros: piso bajo de sillares, alto de entramado, techo vino tinto, torre redonda atrás con
    banderín, puerta doble de arco con clavos, estandartes, antorchas, escudo con espadas y el tablón afuera."""
    fy = -d / 2
    h = 3.9
    techo = '#8E3B3B'
    azul = '#3E5C76'
    m_sillar = piedra('sillar gremio', '#C9BFA6')
    m_pared = mat('pared gremio', '#E8D6B0', 0.85, noise=dict(scale=18, strength=0.25, distance=0.004))
    m_techo = laca(f'techo {techo}', techo, 0.55)
    m_techo2 = laca(f'techo claro {techo}', _claro(techo), 0.55)
    m_azul = laca(f'detalle {azul}', azul, 0.5)
    hierro = metal('hierro', '#3E3A38')
    cubo(coll, 'zócalo', (0, 0, 0.21), ((w + 0.32) / 2, (d + 0.3) / 2, 0.21), PIEDRA_ZOC(), bisel=0.06)
    cubo(coll, 'piso bajo', (0, 0, 1.0), (w / 2, d / 2, 0.82), m_sillar, bisel=0.05)
    cubo(coll, 'piso alto', (0, 0, (h + 1.8) / 2), (w / 2 - 0.02, d / 2 - 0.02, (h - 1.8) / 2), m_pared, bisel=0.05)
    # Sillares sueltos en la fachada y el costado (hileras trabadas)
    tonos = ('#D3C9B0', '#BDB399', '#C9BFA6', '#B3A98F')
    for fila in range(4):
        z = 0.5 + fila * 0.33
        desfase = 0.3 if fila % 2 else 0.0
        x = -w / 2 + 0.1 + desfase
        k = 0
        while x < w / 2 - 0.3:
            largo = 0.55 + 0.12 * ((fila * 7 + k * 3) % 3)
            if not (abs(x + largo / 2) < 1.05):  # el hueco de la puerta
                caja(coll, f'sillar {fila} {k}', (x + largo / 2, fy - 0.03, z), (largo / 2 - 0.03, 0.035, 0.14),
                     piedra(f'sillar {k % 4}', tonos[(fila + k) % 4]), p=5, sub=0)
            x += largo
            k += 1
        y = -d / 2 + 0.1 + desfase
        k = 0
        while y < d / 2 - 0.3:
            largo = 0.6 + 0.1 * ((fila + k) % 3)
            caja(coll, f'sillar lado {fila} {k}', (w / 2 + 0.03, y + largo / 2, z), (0.035, largo / 2 - 0.03, 0.14),
                 piedra(f'sillar {k % 4}', tonos[(fila + k + 1) % 4]), p=5, sub=0)
            y += largo
            k += 1
    # Cornisa entre pisos y entramado del piso alto
    caja(coll, 'cornisa', (0, fy - 0.08, 1.86), ((w + 0.2) / 2, 0.14, 0.09), VIGA(), p=8)
    caja(coll, 'cornisa lado', (w / 2 + 0.08, 0, 1.86), (0.14, d / 2 + 0.05, 0.09), VIGA(), p=8)
    caja(coll, 'viga alta', (0, fy - 0.07, h - 0.1), ((w + 0.12) / 2, 0.13, 0.11), VIGA(), p=8)
    caja(coll, 'viga alta lado', (w / 2 + 0.07, 0, h - 0.1), (0.13, d / 2, 0.11), VIGA(), p=8)
    for x in (-w / 2 + 0.06, w / 2 - 0.06, -w * 0.18, w * 0.18):
        caja(coll, f'pie derecho {x:.2f}', (x, fy - 0.05, (h + 1.9) / 2), (0.09, 0.09, (h - 1.9) / 2), VIGA(), p=8)
    for y in (fy + 0.06, d / 2 - 0.06, 0.0):
        caja(coll, f'pie derecho lado {y:.2f}', (w / 2 + 0.05, y, (h + 1.9) / 2), (0.09, 0.09, (h - 1.9) / 2), VIGA(), p=8)
    for s in (-1, 1):  # riostras en los paños de los lados de la fachada
        for x0 in (-w * 0.34, w * 0.34):
            o = caja(coll, f'riostra {x0:.1f} {s}', (0, 0, 0), (0.05, 0.05, 0.85), VIGA(), p=10, sub=0)
            o.location = (x0, fy - 0.06, (h + 1.9) / 2)
            o.rotation_euler = (0, s * 0.85, 0)
    # Puerta doble de arco con clavos y herrajes
    caja(coll, 'jamba puerta', (0, fy - 0.06, 1.25), (0.98, 0.12, 1.05), m_sillar, p=6)
    o = clay.lathe('arco piedra', [(0.0, -0.12), (0.98, -0.12), (0.98, 0.12), (0.0, 0.12)], coll, m_sillar, segments=24, subsurf=0)
    o.location = (0, fy - 0.06, 2.3)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.scale = (1, 0.5, 1)
    for k in range(7):  # dovelas
        a = math.pi * (k + 0.5) / 7
        t = caja(coll, f'dovela {k}', (0, 0, 0), (0.1, 0.06, 0.16), piedra('dovela', '#D9CFB7'), p=6, sub=0)
        t.location = (math.cos(a) * 0.9, fy - 0.17, 2.3 + math.sin(a) * 0.45)
        t.rotation_euler = (0, math.pi / 2 - a, 0)
    m_puerta = madera('puerta gremio', '#6B4430')
    for s in (-1, 1):
        caja(coll, f'hoja {s}', (s * 0.39, fy - 0.2, 1.22), (0.37, 0.06, 1.0), m_puerta, p=8)
        for k in range(3):
            caja(coll, f'tabla hoja {s}{k}', (s * (0.13 + k * 0.25), fy - 0.27, 1.22), (0.012, 0.015, 0.97), VIGA(), p=12, sub=0)
        for zz in (0.55, 1.75):
            caja(coll, f'herraje {s}{zz}', (s * 0.39, fy - 0.28, zz), (0.34, 0.012, 0.04), hierro, p=10, sub=0)
            for k in range(4):
                bola(coll, f'clavo {s}{zz}{k}', (s * (0.1 + k * 0.19), fy - 0.3, zz), 0.022, hierro, n=2, sub=0)
        clay.lathe(f'aldaba {s}', [(0.07, -0.012), (0.085, 0.0), (0.07, 0.012)], coll, metal('oro', '#E8C66A'), segments=14, subsurf=0,
                   cap_bottom=False, cap_top=False).location = (s * 0.16, fy - 0.31, 1.25)
    o = clay.lathe('tímpano', [(0.0, -0.05), (0.76, -0.05), (0.76, 0.05), (0.0, 0.05)], coll, m_puerta, segments=24, subsurf=0)
    o.location = (0, fy - 0.2, 2.22)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.scale = (1, 0.42, 1)
    caja(coll, 'escalón', (0, fy - 0.52, 0.12), (1.3, 0.55, 0.1), PIEDRA_ZOC(), p=6)
    caja(coll, 'escalón bajo', (0, fy - 1.05, 0.055), (1.45, 0.325, 0.05), PIEDRA_ZOC(), p=6)
    caja(coll, 'tapete puerta', (0, fy - 0.55, 0.235), (0.6, 0.3, 0.012), tela('tapete gremio', azul), p=6)
    # Antorchas y estandartes a los lados de la puerta
    for s in (-1, 1):
        antorcha(coll, f'antorcha {s}', s * 1.35, fy - 0.04, 1.75)
        estandarte(coll, f'estandarte {s}', s * 2.15, fy - 0.03, 3.62, 1.35, azul)
    # Ventanas: dos abajo (con rejas) y dos arriba con jardinera
    for s in (-1, 1):
        ventana(coll, f'ventana alta {s}', s * w * 0.34, 2.78, fy - 0.02, 0.95, azul, jardinera=False)
        x = s * w * 0.34
        caja(coll, f'ventana baja {s} marco', (x, fy - 0.06, 1.08), (0.5, 0.075, 0.42), VIGA(), p=8)
        caja(coll, f'ventana baja {s} vidrio', (x, fy - 0.13, 1.08), (0.4, 0.02, 0.33), VIDRIO(), p=12, sub=0)
        for k in range(4):
            tubo(coll, f'reja {s}{k}', [(x - 0.3 + k * 0.2, fy - 0.17, 0.74), (x - 0.3 + k * 0.2, fy - 0.17, 1.42)], 0.016, hierro, seg=5)
        caja(coll, f'ventana baja {s} alféizar', (x, fy - 0.18, 0.64), (0.56, 0.14, 0.05), PIEDRA_ZOC(), p=6)
    for j in range(2):
        y = -(1.55 + j * (d - 3) - d / 2)
        ventana(coll, f'ventana lado {j}', w / 2, 2.85, y, 0.95, azul, cara='lado', jardinera=False)
    # Techo, frontones y escudo con espadas en el frontón del frente
    pico, vuelo = techo_tejas(coll, w, d, h, techo, m_techo, m_techo2, pico=1.9)
    for y2, nom, hacia in ((fy - 0.025, 'frente', -1), (d / 2 + 0.025, 'atrás', 1)):
        fronton(coll, f'frontón {nom}', y2, w, h, pico, CREMA(), hacia)
        for s in (-1, 1):
            pts = [(s * (w / 2 + vuelo + 0.05), y2 + hacia * 0.42, h - 0.06), (0, y2 + hacia * 0.42, h + pico + 0.06)]
            tubo(coll, f'tabla borde {nom}{s}', pts, 0.07, VIGA(), seg=6)
    for s in (-1, 1):
        o = caja(coll, f'viga frontón {s}', (0, 0, 0), (0.06, 0.05, pico * 0.55), VIGA(), p=10, sub=0)
        o.location = (s * w * 0.17, fy - 0.08, h + pico * 0.3)
        o.rotation_euler = (0, -s * 0.9, 0)
    escudo_espadas(coll, 'escudo', 0, fy - 0.1, h + 0.75, 0.46, azul)
    # Torre redonda atrás a la izquierda: se asoma por encima del techo con su banderín
    tx, ty = -w / 2 + 1.0, d / 2 - 1.0
    torre = piedra('torre gremio', '#CDC3AA')
    clay.lathe('torre', [(0.0, 0.0), (1.12, 0.0), (1.1, 0.4), (1.0, 0.5), (1.0, 6.0), (0.0, 6.0)], coll, torre, segments=28,
               subsurf=0).location = (tx, ty, 0)
    for k in range(9):  # hiladas de piedra
        clay.lathe(f'hilada torre {k}', [(1.0, -0.03), (1.035, 0.0), (1.0, 0.03)], coll, piedra('hilada', '#B3A98F'), segments=28, subsurf=0,
                   cap_bottom=False, cap_top=False).location = (tx, ty, 2.0 + k * 0.45)
    clay.lathe('cornisa torre', [(0.95, 0.0), (1.22, 0.0), (1.25, 0.12), (1.22, 0.24), (0.95, 0.24)], coll, VIGA(), segments=28,
               subsurf=0).location = (tx, ty, 6.0)
    clay.lathe('techo torre', [(0.0, 0.0), (1.38, 0.0), (1.3, 0.12), (0.9, 0.7), (0.4, 1.45), (0.08, 2.05), (0.0, 2.15)], coll, m_techo, segments=28,
               subsurf=1).location = (tx, ty, 6.2)
    for k in range(12):  # escamas del cono
        a = k * math.pi / 6
        bola(coll, f'teja torre {k}', (tx + math.cos(a) * 1.2, ty + math.sin(a) * 1.2, 6.3), (0.22, 0.22, 0.09), m_techo2, n=2, sub=0)
    for k in range(3):  # ventanas aspilleras hacia el frente
        a = -math.pi / 2 + (k - 1) * 0.55
        o = caja(coll, f'aspillera {k}', (0, 0, 0), (0.09, 0.05, 0.32), mat('hueco', '#2E2622', 0.9), p=8, sub=0)
        o.location = (tx + math.cos(a) * 1.0, ty + math.sin(a) * 1.0, 4.9)
        o.rotation_euler = (0, 0, a + math.pi / 2)
    tubo(coll, 'asta', [(tx, ty, 8.2), (tx, ty, 9.3)], 0.03, metal('oro', '#E8C66A'), seg=6)
    bola(coll, 'remate asta', (tx, ty, 9.33), 0.06, metal('oro', '#E8C66A'), n=2)
    verts = [(tx, ty, 9.2), (tx + 0.95, ty - 0.1, 9.0), (tx + 0.75, ty - 0.08, 8.92), (tx + 0.95, ty - 0.12, 8.8), (tx, ty, 8.68)]
    malla('banderín', verts + [(x, y - 0.03, z) for x, y, z in verts], [(0, 1, 2, 4), (2, 3, 4), (5, 9, 7, 6), (7, 9, 8)] +
          [(i, (i + 1) % 5, 5 + (i + 1) % 5, 5 + i) for i in range(5)], coll, tela('banderín', azul))
    # Chimenea a la derecha
    cx, cy = w * 0.28, d / 2 - d * 0.33
    cubo(coll, 'chimenea', (cx, cy, h + 0.7), (0.42, 0.5, 1.45), piedra('chimenea', '#B9AE98'), bisel=0.06)
    caja(coll, 'sombrerete', (cx, cy, h + 2.22), (0.54, 0.58, 0.11), piedra('chimenea oscura', '#827E72'), p=6)
    caja(coll, 'boca chimenea', (cx, cy, h + 2.35), (0.28, 0.3, 0.04), mat('hollín', '#2B2422', 0.95), p=8, sub=0)
    # Afuera: tablón de misiones a la derecha y armero con barriles a la izquierda
    bx = 3.05
    for s in (-1, 1):
        caja(coll, f'poste tablón {s}', (bx + s * 0.75, fy - 0.75, 0.95), (0.06, 0.06, 0.95), VIGA(), p=8)
    caja(coll, 'tablón', (bx, fy - 0.75, 1.32), (0.72, 0.05, 0.5), madera('tablón', '#A8784F'), p=8)
    caja(coll, 'tejadillo tablón', (bx, fy - 0.8, 1.95), (0.9, 0.22, 0.05), m_techo, p=6)
    papeles = ('#F6EEDC', '#F2E3C4', '#EDE0F0', '#E6F0E4', '#F6EEDC')
    for k, (px, pz, rot) in enumerate(((-0.45, 1.5, 0.08), (-0.1, 1.45, -0.05), (0.3, 1.52, 0.1), (-0.35, 1.08, -0.08), (0.15, 1.1, 0.04),
                                         (0.5, 1.05, -0.1))):
        o = caja(coll, f'papel {k}', (0, 0, 0), (0.15, 0.008, 0.19), mat(f'papel {k % 5}', papeles[k % 5], 0.9), p=10, sub=0)
        o.location = (bx + px, fy - 0.81, pz)
        o.rotation_euler = (0, rot, 0)
        bola(coll, f'chinche {k}', (bx + px, fy - 0.83, pz + 0.15), 0.022, laca('chinche', ('#E4566B', '#F2C94C', '#3B6FB6')[k % 3], 0.4), n=2, sub=0)
        for j in range(3):
            caja(coll, f'renglón {k}{j}', (bx + px, fy - 0.822, pz + 0.06 - j * 0.06), (0.1, 0.002, 0.008), mat('tinta', '#6E5A48', 0.9), p=12, sub=0)
    ax = -3.1
    caja(coll, 'armero base', (ax, fy - 0.7, 0.12), (0.62, 0.2, 0.1), VIGA(), p=8)
    caja(coll, 'armero barra', (ax, fy - 0.62, 1.2), (0.66, 0.05, 0.05), VIGA(), p=8)
    for s in (-1, 1):
        caja(coll, f'armero lado {s}', (ax + s * 0.62, fy - 0.66, 0.65), (0.05, 0.05, 0.62), VIGA(), p=8)
    for k in range(4):
        x = ax - 0.42 + k * 0.28
        tubo(coll, f'lanza {k}', [(x, fy - 0.72, 0.2), (x, fy - 0.6, 1.75)], 0.022, madera('asta', '#8A5A3B'), seg=5)
        bola(coll, f'punta lanza {k}', (x, fy - 0.6, 1.85), (0.04, 0.02, 0.11), metal('acero', '#C7CED6'), n=2, sub=0)
    for k, (x, y) in enumerate(((-3.95, fy - 0.55), (-3.55, fy - 1.05))):
        clay.lathe(f'barril {k}', [(0.0, 0.0), (0.26, 0.0), (0.31, 0.3), (0.26, 0.6), (0.0, 0.6)], coll, madera('barril', '#9A6A44'), segments=16,
                   subsurf=1).location = (x, y, 0.0)
        for zz in (0.1, 0.5):
            clay.lathe(f'aro barril {k}{zz}', [(0.285, -0.02), (0.3, 0.0), (0.285, 0.02)], coll, hierro, segments=16, subsurf=0, cap_bottom=False,
                       cap_top=False).location = (x, y, zz)


def museo(coll, w=9, d=7):
    """Museo del Valle: pórtico de cuatro columnas con frontón y medallón, cuerpo de piedra clara con ventanas de
    arco, cúpula verde cobre con linterna dorada, escalinata, estandartes de exposición y matas podadas."""
    fy = -d / 2
    cuerpo_y = -1.75  # fachada del cuerpo (detrás del pórtico)
    h = 3.5
    m_piedra = mat('piedra museo', '#EFE4CC', 0.8, noise=dict(scale=14, strength=0.3, distance=0.004))
    m_columna = mat('columna museo', '#F7F1E3', 0.6)
    m_cupula = laca('cúpula cobre', '#6FA59A', 0.5)
    m_cupula2 = laca('cúpula cobre claro', '#83B8AC', 0.5)
    oro = metal('oro', '#E8C66A')
    granate = '#8E3B5E'
    # Basamento y cuerpo
    cubo(coll, 'basamento', (0, 0, 0.22), ((w + 0.3) / 2, (d + 0.3) / 2, 0.22), PIEDRA_ZOC(), bisel=0.06)
    largo_cuerpo = d / 2 - cuerpo_y
    cubo(coll, 'cuerpo', (0, (d / 2 + cuerpo_y) / 2, (h + 0.44) / 2), (w / 2, largo_cuerpo / 2, (h - 0.44) / 2), m_piedra, bisel=0.05)
    for k in range(7):  # juntas horizontales de los sillares
        caja(coll, f'junta {k}', (0, cuerpo_y - 0.02, 0.8 + k * 0.42), (w / 2, 0.012, 0.012), mat('junta', '#DCCFB4', 0.9), p=12, sub=0)
        caja(coll, f'junta lado {k}', (w / 2 + 0.02, (d / 2 + cuerpo_y) / 2, 0.8 + k * 0.42), (0.012, largo_cuerpo / 2, 0.012),
             mat('junta', '#DCCFB4', 0.9), p=12, sub=0)
    for x in (-w / 2 + 0.15, w / 2 - 0.15):  # pilastras de esquina
        caja(coll, f'pilastra {x:.1f}', (x, cuerpo_y - 0.06, (h + 0.44) / 2), (0.2, 0.08, (h - 0.44) / 2), m_columna, p=8)
    cubo(coll, 'cornisa cuerpo', (0, (d / 2 + cuerpo_y) / 2, h + 0.08), ((w + 0.25) / 2, largo_cuerpo / 2 + 0.12, 0.12), m_columna)
    # Puerta grande de dos hojas con montante de arco y ventanas de arco
    cubo(coll, 'marco puerta', (0, cuerpo_y - 0.06, 1.45), (0.85, 0.1, 1.05), m_columna)
    for s in (-1, 1):
        caja(coll, f'hoja {s}', (s * 0.34, cuerpo_y - 0.16, 1.4), (0.32, 0.05, 0.95), laca('puerta museo', '#3F6E68', 0.45), p=8)
        for k in range(2):
            caja(coll, f'cuarterón {s}{k}', (s * 0.34, cuerpo_y - 0.22, 1.0 + k * 0.8), (0.22, 0.012, 0.3), laca('puerta museo claro', '#4E847D', 0.45),
                 p=8, sub=1)
        bola(coll, f'tirador {s}', (s * 0.09, cuerpo_y - 0.25, 1.42), (0.03, 0.03, 0.08), oro, n=2)
    o = clay.lathe('montante', [(0.0, -0.04), (0.7, -0.04), (0.7, 0.04), (0.0, 0.04)], coll, VIDRIO(), segments=24, subsurf=0)
    o.location = (0, cuerpo_y - 0.14, 2.42)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.scale = (1, 0.5, 1)
    for k in range(5):
        a = math.pi * (k + 1) / 6
        t = caja(coll, f'rayo montante {k}', (0, 0, 0), (0.016, 0.02, 0.17), oro, p=12, sub=0)
        t.location = (math.cos(a) * 0.36, cuerpo_y - 0.19, 2.42 + math.sin(a) * 0.18)
        t.rotation_euler = (0, math.pi / 2 - a, 0)

    def ventana_arco(nombre, x, y, z, cara='frente'):
        P = (lambda u, v, ww: (x + u, y - v, ww)) if cara == 'frente' else (lambda u, v, ww: (x + v, y + u, ww))
        H = (lambda a, b, c: (a, b, c)) if cara == 'frente' else (lambda a, b, c: (b, a, c))
        caja(coll, f'{nombre} marco', P(0, 0.05, z), H(0.48, 0.07, 0.62), m_columna, p=8)
        caja(coll, f'{nombre} vidrio', P(0, 0.11, z), H(0.37, 0.02, 0.52), VIDRIO(), p=12, sub=0)
        o = clay.lathe(f'{nombre} arco', [(0.0, -0.06), (0.48, -0.06), (0.48, 0.06), (0.0, 0.06)], coll, m_columna, segments=20, subsurf=0)
        o.location = P(0, 0.05, z + 0.62)
        o.rotation_euler = (math.pi / 2, 0, 0) if cara == 'frente' else (math.pi / 2, 0, math.pi / 2)
        o = clay.lathe(f'{nombre} vidrio arco', [(0.0, -0.02), (0.37, -0.02), (0.37, 0.02), (0.0, 0.02)], coll, VIDRIO(), segments=20, subsurf=0)
        o.location = P(0, 0.12, z + 0.62)
        o.rotation_euler = (math.pi / 2, 0, 0) if cara == 'frente' else (math.pi / 2, 0, math.pi / 2)
        caja(coll, f'{nombre} parteluz', P(0, 0.14, z + 0.2), H(0.025, 0.02, 0.75), oro, p=12, sub=0)
        caja(coll, f'{nombre} travesaño', P(0, 0.14, z), H(0.37, 0.02, 0.02), oro, p=12, sub=0)
        caja(coll, f'{nombre} alféizar', P(0, 0.16, z - 0.62), H(0.56, 0.12, 0.05), PIEDRA_ZOC(), p=6)
        caja(coll, f'{nombre} clave', P(0, 0.08, z + 1.13), H(0.09, 0.06, 0.12), oro, p=6)

    for s in (-1, 1):
        ventana_arco(f'ventana {s}', s * 2.35, cuerpo_y - 0.0, 1.75)
    for j, y in enumerate((-0.6, 1.9)):
        ventana_arco(f'ventana lado {j}', w / 2, y, 1.75, cara='lado')
    # Pórtico: losa, escalinata, cuatro columnas, arquitrabe (el letrero del juego va encima) y frontón
    cubo(coll, 'losa pórtico', (0, (cuerpo_y + fy) / 2 - 0.05, 0.47), (w / 2 - 0.3, (cuerpo_y - fy) / 2 + 0.1, 0.05), PIEDRA_ZOC(), bisel=0.03)
    for k in range(3):
        cubo(coll, f'escalón {k}', (0, fy - 0.1 - k * 0.3, 0.36 - k * 0.13), (2.2 + k * 0.15, 0.17, 0.065), PIEDRA_ZOC(), bisel=0.03)
    cy_col = fy + 0.3
    for k, x in enumerate((-3.3, -1.15, 1.15, 3.3)):
        clay.lathe(f'columna {k}', [(0.0, 0.0), (0.34, 0.0), (0.34, 0.12), (0.27, 0.2), (0.24, 0.3), (0.21, 2.55), (0.27, 2.62), (0.34, 2.7),
                                     (0.34, 2.78), (0.0, 2.78)], coll, m_columna, segments=20, subsurf=1).location = (x, cy_col, 0.5)
        for j in range(8):  # estrías
            a = j * math.pi / 4
            tubo(coll, f'estría {k}{j}', [(x + math.cos(a) * 0.235, cy_col + math.sin(a) * 0.235, 0.85),
                                           (x + math.cos(a) * 0.205, cy_col + math.sin(a) * 0.205, 2.95)], 0.018,
                 mat('estría', '#E6DCC6', 0.7), seg=4)
        clay.lathe(f'anillo dorado {k}', [(0.22, -0.025), (0.25, 0.0), (0.22, 0.025)], coll, oro, segments=20, subsurf=0, cap_bottom=False,
                   cap_top=False).location = (x, cy_col, 3.0)
    cubo(coll, 'arquitrabe', (0, fy + 0.15, 3.48), ((w - 0.4) / 2, 0.3, 0.2), m_columna)
    cubo(coll, 'friso', (0, fy + 0.12, 3.82), ((w - 0.3) / 2, 0.32, 0.14), m_piedra)
    for k in range(13):  # dentículos
        caja(coll, f'dentículo {k}', (-w / 2 + 0.55 + k * 0.66, fy - 0.2, 3.98), (0.1, 0.05, 0.06), m_columna, p=8, sub=0)
    cubo(coll, 'cornisa pórtico', (0, fy + 0.1, 4.03), ((w - 0.1) / 2, 0.36, 0.06), m_columna)
    cubo(coll, 'techo pórtico', (0, (cuerpo_y + fy) / 2, h + 0.15), ((w - 0.4) / 2, (cuerpo_y - fy) / 2 + 0.05, 0.08), m_columna)
    pico = 1.15
    fronton(coll, 'frontón', fy - 0.22, w - 0.2, 4.08, pico, m_columna)
    for s in (-1, 1):
        o = cubo(coll, f'cornisa frontón {s}', (0, 0, 0), (math.hypot(w / 2, pico) / 2 + 0.1, 0.38, 0.06), m_columna)
        o.location = (s * (w - 0.2) / 4, fy + 0.08, 4.1 + pico / 2)
        o.rotation_euler = (0, s * math.atan2(pico, (w - 0.2) / 2), 0)
    o = clay.lathe('medallón', [(0.0, -0.04), (0.36, -0.04), (0.38, 0.0), (0.36, 0.04), (0.0, 0.04)], coll, oro, segments=28, subsurf=1)
    o.location = (0, fy - 0.3, 4.5)
    o.rotation_euler = (math.pi / 2, 0, 0)
    bola(coll, 'estrella medallón', (0, fy - 0.36, 4.5), (0.12, 0.03, 0.12), laca('medallón centro', granate, 0.4), n=3)
    for k in range(10):  # laureles alrededor
        a = math.pi * 0.15 + k * math.pi * 0.7 / 9
        for s in (-1, 1):
            o = bola(coll, f'laurel {k}{s}', (0, 0, 0), (0.055, 0.015, 0.1), mat('laurel', '#5FA85A', 0.5), n=2, sub=0)
            o.location = (s * math.cos(a) * 0.55, fy - 0.3, 4.38 - math.sin(a - math.pi * 0.5) * 0.0 + math.sin(a) * 0.12 - 0.1)
            o.rotation_euler = (0, s * (a - math.pi / 2), 0)
    # Techo bajo a cuatro aguas y cúpula con linterna
    for s in (-1, 1):
        o = cubo(coll, f'techo lado {s}', (0, 0, 0), (w / 4 + 0.2, largo_cuerpo / 2 + 0.1, 0.07), m_cupula)
        o.location = (s * w / 4, (d / 2 + cuerpo_y) / 2, h + 0.48)
        o.rotation_euler = (0, s * 0.22, 0)
    ccx, ccy = 0, (d / 2 + cuerpo_y) / 2 + 0.2
    clay.lathe('tambor', [(0.0, 0.0), (1.55, 0.0), (1.55, 0.95), (1.62, 1.0), (1.62, 1.12), (0.0, 1.12)], coll, m_piedra, segments=32,
               subsurf=0).location = (ccx, ccy, h + 0.4)
    for k in range(10):
        a = k * math.pi / 5
        o = caja(coll, f'ventanita tambor {k}', (0, 0, 0), (0.12, 0.04, 0.26), VIDRIO(), p=10, sub=0)
        o.location = (ccx + math.cos(a) * 1.56, ccy + math.sin(a) * 1.56, h + 0.85)
        o.rotation_euler = (0, 0, a + math.pi / 2)
        caja(coll, f'pilarcito tambor {k}', (0, 0, 0), (0.05, 0.05, 0.4), m_columna, p=8, sub=0).location = (
            ccx + math.cos(a + math.pi / 10) * 1.58, ccy + math.sin(a + math.pi / 10) * 1.58, h + 0.85)
    perfil = [(1.6 * math.cos(t), 1.6 * math.sin(t) * 0.92) for t in np.linspace(0, math.pi / 2, 12)]
    clay.lathe('cúpula', [(0.0, 0.0)] + perfil, coll, m_cupula, segments=36, subsurf=1).location = (ccx, ccy, h + 1.52)
    for k in range(12):  # nervios dorados
        a = k * math.pi / 6
        pts = [(ccx + math.cos(a) * 1.62 * math.cos(t), ccy + math.sin(a) * 1.62 * math.cos(t), h + 1.52 + 1.62 * math.sin(t) * 0.92)
               for t in np.linspace(0.02, 1.3, 7)]
        tubo(coll, f'nervio {k}', pts, 0.035, m_cupula2, seg=5)
    clay.lathe('linterna', [(0.0, 0.0), (0.38, 0.0), (0.38, 0.55), (0.46, 0.6), (0.3, 0.85), (0.08, 1.05), (0.0, 1.1)], coll, oro, segments=20,
               subsurf=1).location = (ccx, ccy, h + 2.95)
    for k in range(6):
        a = k * math.pi / 3
        caja(coll, f'ventana linterna {k}', (0, 0, 0), (0.08, 0.02, 0.17), luz('linterna', '#FFE7A8', 1.2), p=10, sub=0).location = (
            ccx + math.cos(a) * 0.385, ccy + math.sin(a) * 0.385, h + 3.22)
    tubo(coll, 'aguja', [(ccx, ccy, h + 4.0), (ccx, ccy, h + 4.45)], 0.025, oro, seg=6)
    bola(coll, 'bola aguja', (ccx, ccy, h + 4.5), 0.08, oro, n=2)
    # Estandartes de exposición entre las columnas de los extremos y matas podadas a los lados de la escalinata
    for s in (-1, 1):
        estandarte(coll, f'estandarte {s}', s * 2.25, fy + 0.36, 3.3, 1.5, granate)
        x = s * 3.95
        caja(coll, f'matera {s}', (x, fy - 0.35, 0.3), (0.32, 0.32, 0.3), PIEDRA_ZOC(), p=6)
        caja(coll, f'borde matera {s}', (x, fy - 0.35, 0.62), (0.36, 0.36, 0.04), m_columna, p=6, sub=0)
        bola(coll, f'mata podada {s}', (x, fy - 0.35, 1.0), (0.36, 0.36, 0.38), tela('mata podada', '#5C9A55'), n=4)
        bola(coll, f'mata podada alta {s}', (x, fy - 0.35, 1.55), (0.24, 0.24, 0.26), tela('mata podada', '#5C9A55'), n=4)
        for k in range(5):
            a = k * 2 * math.pi / 5
            flor(coll, f'flor mata {s}{k}', (x + math.cos(a) * 0.3, fy - 0.35 + math.sin(a) * 0.3, 1.12), 0.045, ('#E58FA6', '#F2C94C')[k % 2],
                 centro='#F6F1E6')


PIEZAS['edificio_gremio_9x7'] = lambda coll: gremio(coll)
PIEZAS['edificio_museo_9x7'] = lambda coll: museo(coll)


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
