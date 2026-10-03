"""Las cosas de «Lavarse la cara»: las armas (toalla, varita de burbujas, cepillo de dientes, champú, peinilla,
esponja, secador, espuma, botellitas, jabón, bombillo, toallita, paticos, ranitas, ducha, hilo dental, perfume y
colonia) con sus evoluciones, las pasivas (jabón extra fuerte, gorro de baño, cremas, reloj de arena, espejo de
aumento, liga del pelo, sales, espejo doble, pantuflas, imán, trébol, corona de espuma, alcancía, espejo roto y
curita), lo que cae al piso (arepa, balde de agua fría, hielo, aspiradora, gotas doradas, ají, cofre, gotitas de
experiencia) y las velitas que se rompen. Todo en plastilina, de frente hacia -y y con la base en z = 0.

Uso:
  blender -b -P personajes/blender/lavado_objetos.py -- iconos <carpeta> [clave1,clave2,...]   → PNG de 160 px
  blender -b -P personajes/blender/lavado_objetos.py -- accesorios <archivo.glb>              → los accesorios de los disfraces
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import clay  # noqa: E402
import escena  # noqa: E402

TAU = math.pi * 2
_mats = {}


def M(color, rough=0.55, fuzz=0.0, coat=0.0, metal=0.0, sss=0.0, emision=0.0, transmision=0.0, ruido=0.08, pelusa=None):
    clave = (color, rough, fuzz, coat, metal, sss, emision, transmision, ruido, pelusa)
    if clave in _mats:
        return _mats[clave]
    kw = {}
    if fuzz:
        kw['fuzz'] = dict(scale=120, color=pelusa or color, amount=fuzz, strength=0.3, dark=0.65)
    elif ruido:
        kw['noise'] = dict(scale=45, strength=ruido, detail=4, distance=0.003)
    m = clay.material(f'Obj {color} {len(_mats)}', color, rough=rough, coat=coat, coat_rough=0.12, metallic=metal, sss=sss, sss_scale=0.04,
                      emission=color if emision else None, emission_strength=emision, transmission=transmision, ior=1.33, **kw)
    _mats[clave] = m
    return m


def tela(color, pelusa=None):
    return M(color, rough=0.9, fuzz=0.45, pelusa=pelusa)


def vidrio(color='#D8F1FF'):
    return M(color, rough=0.05, coat=1.0, transmision=0.85, ruido=0.0)


def oro():
    return M('#F2C14E', rough=0.22, metal=0.85, coat=0.4)


def plata():
    return M('#D6DCE4', rough=0.2, metal=0.9, coat=0.3)


BRILLO = None


class Pieza:
    """Lo que va creando una función (para encuadrarlo y borrarlo después)."""

    def __init__(self, nombre):
        self.nombre = nombre
        self.coll = clay.collection(f'Obj {nombre}')
        self.objs = []
        self.n = 0

    def nom(self):
        self.n += 1
        return f'{self.nombre} {self.n}'

    def add(self, o):
        if o is not None:
            self.objs.append(o)
        return o

    def blob(self, c, r, m, n=10, p=2.0, shaper=None, subsurf=1):
        return self.add(clay.blob(self.nom(), c, r, self.coll, m, n=n, p=p, shaper=shaper, subsurf=subsurf))

    def caja(self, c, half, m, p=6.0):
        return self.add(clay.rbox(self.nom(), c, half, self.coll, m, p=p, n=6, subsurf=2))

    def tubo(self, pts, r, m, caps=('round', 'round'), seg=10, perfil=(1.0, 1.0), subsurf=1):
        return self.add(clay.sweep(self.nom(), [tuple(map(float, p)) for p in pts], radius=r, profile=perfil, coll=self.coll, material=m,
                                   segments=seg, samples=6, caps=caps, subsurf=subsurf))

    def torno(self, perfil, m, z=0.0, x=0.0, y=0.0, seg=32, tapas=(True, True)):
        o = clay.lathe(self.nom(), perfil, self.coll, m, segments=seg, subsurf=1, cap_bottom=tapas[0], cap_top=tapas[1])
        o.location = (x, y, z)
        return self.add(o)

    def girar(self, objs, rx=0.0, ry=0.0, rz=0.0, pivote=(0, 0, 0)):
        """Gira piezas alrededor de un pivote (aplicando la transformación, sin la trampa del origen)."""
        from mathutils import Euler, Matrix
        bpy.context.view_layer.update()
        R = Euler((rx, ry, rz), 'XYZ').to_matrix().to_4x4()
        T = Matrix.Translation(Vector(pivote))
        for o in objs:
            o.matrix_world = T @ R @ T.inverted() @ o.matrix_world
        return objs

    def desde(self, k):
        return self.objs[k:]


def corazon(p, c, s, m, grosor=0.4):
    """Corazón inflado de plastilina (dos esferas y una punta) mirando hacia -y."""
    cx, cy, cz = c
    for sx in (-1, 1):
        p.blob((cx + sx * s * 0.27, cy, cz + s * 0.12), (s * 0.32, s * grosor * 0.5, s * 0.3), m, n=8)
    p.blob((cx, cy, cz - s * 0.12), (s * 0.36, s * grosor * 0.48, s * 0.36), m, n=8,
           shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.6 * np.clip(-v[:, 2], 0, 1)), v[:, 1], v[:, 2] * 1.25]))


def estrella(p, c, s, m, puntas=5, grosor=0.3):
    for k in range(puntas):
        a = k / puntas * TAU + math.pi / 2
        p.tubo([c, (c[0] + math.cos(a) * s, c[1], c[2] + math.sin(a) * s)], [s * 0.3, s * 0.06], m, caps=('round', 'round'), seg=8, perfil=(1.0, grosor * 1.6))


def burbuja(p, c, r):
    p.blob(c, (r, r, r), vidrio('#E8F6FF'), n=10)
    p.blob((c[0] - r * 0.35, c[1] - r * 0.8, c[2] + r * 0.4), (r * 0.18, r * 0.06, r * 0.12), BRILLO, n=6)


def gotas(p, centro, n, r, color='#8FD3F2', abanico=0.6):
    m = M(color, rough=0.1, coat=1.0, transmision=0.5, ruido=0.0)
    for k in range(n):
        a = (k / max(1, n - 1) - 0.5) * abanico * 2
        x, z = centro[0] + math.sin(a) * r * 3, centro[2] + math.cos(a) * r * 2
        p.blob((x, centro[1], z), (r, r, r * 1.3), m, n=6,
               shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.6 * np.clip(v[:, 2], 0, 1)), v[:, 1] * (1 - 0.6 * np.clip(v[:, 2], 0, 1)), v[:, 2]]))


def destellos(p, puntos, s=0.05, color='#FFF3B0'):
    m = M(color, rough=0.3, emision=3.0, ruido=0.0)
    for (x, y, z) in puntos:
        estrella(p, (x, y, z), s, m, puntas=4, grosor=0.25)


def vapor(p, puntos, r=0.07):
    m = M('#FFFFFF', rough=0.9, fuzz=0.5, pelusa='#F2F2F2')
    for (x, y, z) in puntos:
        for k in range(3):
            p.blob((x + (k - 1) * r * 0.8, y, z + abs(k - 1) * -r * 0.3), (r, r * 0.8, r * 0.85), m, n=6)


# ----------------------------------------------------------------------------------------------------- Armas
def toalla(p, color='#F39AB0', raya='#FFFFFF', caliente=False):
    """Toalla ondeando en pleno toallazo: tela rectangular doblada en ola, rayas y flecos."""
    m = tela(color, '#FFD1DC' if not caliente else '#FFB0A0')
    r = tela(raya)

    def ola(v, fase=0.0):
        x = v[:, 0]
        return np.column_stack([x, v[:, 1] + 0.1 * np.sin(x * 5.0 + fase), v[:, 2] + 0.12 * np.sin(x * 3.2 + 0.6)])
    k = len(p.objs)
    p.blob((0, 0, 0.42), (0.5, 0.045, 0.2), m, n=14, p=5.0, shaper=ola, subsurf=2)
    for x0 in (0.3, 0.38):
        p.blob((x0, -0.012, 0.42), (0.022, 0.05, 0.205), r, n=8, p=5.0,
               shaper=lambda v, x0=x0: np.column_stack([v[:, 0], v[:, 1] + 0.1 * np.sin((v[:, 0] + x0) * 5.0), v[:, 2] + 0.12 * np.sin((v[:, 0] + x0) * 3.2 + 0.6)]))
    # Flecos al final
    yb = 0.1 * math.sin(0.5 * 5.0)
    zb = 0.42 + 0.12 * math.sin(0.5 * 3.2 + 0.6)
    for j in range(7):
        z = zb - 0.17 + j * 0.057
        p.tubo([(0.49, yb, z), (0.56, yb - 0.01, z + 0.01 * (j - 3)), (0.6, yb, z + 0.02 * (j - 3))], 0.011, m, seg=5)
    p.girar(p.desde(k), ry=-0.35, pivote=(0, 0, 0.42))
    if caliente:
        vapor(p, [(0.1, -0.1, 0.78), (-0.25, -0.1, 0.68), (0.4, -0.1, 0.86)], 0.06)
        gotas(p, (0.0, -0.08, 0.08), 3, 0.035, '#FF7A5C')
    else:
        gotas(p, (0.05, -0.08, 0.06), 3, 0.035)


def varita(p, dorada=False):
    m = M('#F2C14E', rough=0.25, metal=0.7, coat=0.4) if dorada else M('#F39AB0', rough=0.45, coat=0.3)
    p.tubo([(-0.25, 0, 0.0), (0.0, 0, 0.32), (0.08, 0, 0.42)], 0.03, m, seg=8)
    aro = M('#7DB7E8', rough=0.3, coat=0.5) if not dorada else oro()
    o = clay.lathe(p.nom(), [(0.13, -0.025), (0.16, 0.0), (0.13, 0.025), (0.1, 0.0), (0.13, -0.025)], p.coll, aro, segments=28, subsurf=1,
                   cap_bottom=False, cap_top=False)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (0.18, 0, 0.56)
    p.add(o)
    burbuja(p, (0.35, -0.05, 0.75), 0.11)
    burbuja(p, (0.12, -0.05, 0.86), 0.07)
    if dorada:
        for (x, z, r) in [(0.48, 0.55, 0.06), (-0.05, 0.75, 0.05), (0.45, 0.95, 0.08), (0.25, 1.02, 0.05)]:
            burbuja(p, (x, -0.05, z), r)
        destellos(p, [(0.0, -0.1, 0.55), (0.55, -0.1, 0.75)])


def cepillo(p, color='#5AA6E0', dorado=False):
    m = oro() if dorado else M(color, rough=0.3, coat=0.5)
    k0 = len(p.objs)
    p.tubo([(-0.45, 0, 0.05), (0.0, 0, 0.1), (0.28, 0, 0.14), (0.42, 0, 0.17)], [0.055, 0.06, 0.045, 0.05], m, perfil=(1.0, 0.7), seg=12)
    p.caja((0.36, 0, 0.19), (0.11, 0.05, 0.025), m)
    cerdas = M('#FFFFFF', rough=0.6)
    cerdas2 = M('#68C9B9', rough=0.6)
    for i in range(5):
        for j in range(2):
            x = 0.28 + i * 0.04
            p.blob((x, -0.02 + j * 0.04, 0.26), (0.018, 0.016, 0.06), cerdas if (i + j) % 2 else cerdas2, n=5)
    # Pegote de crema dental
    p.tubo([(0.27, 0, 0.3), (0.33, -0.01, 0.32), (0.4, 0.0, 0.31), (0.45, 0.0, 0.33)], 0.028, M('#F4FAFF', 0.5), seg=8)
    p.tubo([(0.28, -0.02, 0.31), (0.4, -0.02, 0.32)], 0.012, M('#E85D6A', 0.5), seg=6)
    p.girar(p.desde(k0), ry=-0.5, pivote=(0, 0, 0.15))


def mil_cerdas(p):
    k = len(p.objs)
    cepillo(p, dorado=True)
    p.girar(p.desde(k), ry=-0.4, pivote=(-0.4, 0, 0.05))
    k = len(p.objs)
    cepillo(p, '#E85D6A')
    k2 = len(p.objs)
    cepillo(p, '#7FB069')
    p.girar(p.objs[k2:], ry=0.35, pivote=(-0.4, 0, 0.05))
    destellos(p, [(0.4, -0.1, 0.65), (0.1, -0.1, 0.5)])


def champu(p, color='#E58BB5', remolino=False):
    m = M(color, rough=0.25, coat=0.6, sss=0.1)
    p.torno([(0.0, 0.0), (0.16, 0.0), (0.18, 0.04), (0.18, 0.42), (0.14, 0.5), (0.07, 0.54), (0.0, 0.55)], m)
    tapa = M('#FFFFFF', rough=0.3, coat=0.5)
    p.torno([(0.0, 0.0), (0.08, 0.0), (0.08, 0.1), (0.06, 0.12), (0.0, 0.12)], tapa, z=0.53)
    p.tubo([(0.0, 0, 0.64), (0.08, -0.02, 0.66), (0.14, -0.02, 0.62)], 0.02, tapa, seg=6)
    etiqueta = M('#FFF6E8', rough=0.6)
    o = clay.lathe(p.nom(), [(0.183, 0.14), (0.183, 0.34)], p.coll, etiqueta, segments=32, subsurf=0, cap_bottom=False, cap_top=False)
    p.add(o)
    corazon(p, (0, -0.19, 0.26), 0.12, M('#E4574B', 0.4), 0.2)
    # Espuma saliendo
    esp = M('#FFFFFF', rough=0.85, fuzz=0.4)
    for (x, z, r) in [(0.16, 0.66, 0.05), (0.21, 0.7, 0.04), (0.12, 0.72, 0.035)]:
        p.blob((x, -0.02, z), (r, r, r), esp, n=6)
    if remolino:
        for k in range(10):
            a = k * 0.62
            rr = 0.22 + k * 0.035
            p.blob((math.cos(a) * rr, -0.1, 0.3 + math.sin(a) * rr), (0.045, 0.04, 0.04), esp, n=6)


def remolino(p):
    for k, (c, a) in enumerate([('#E58BB5', 0.0), ('#7DB7E8', 2.1), ('#7FB069', 4.2)]):
        i = len(p.objs)
        champu(p, c)
        objs = p.desde(i)
        for o in objs:
            o.scale = (0.6, 0.6, 0.6)
            o.location = Vector(o.location) * 0.6
        bpy.context.view_layer.update()
        p.girar(objs, ry=a + 0.6, pivote=(0, 0, 0.18))
        for o in objs:
            o.location.x += math.cos(a) * 0.28
            o.location.z += math.sin(a) * 0.28 + 0.3
    esp = M('#FFFFFF', rough=0.85, fuzz=0.4)
    for k in range(16):
        a = k * 0.5
        rr = 0.08 + k * 0.03
        p.blob((math.cos(a) * rr, -0.15, 0.48 + math.sin(a) * rr), (0.035, 0.03, 0.03), esp, n=6)


def peinilla(p, color='#E4574B', dorada=False):
    m = oro() if dorada else M(color, rough=0.3, coat=0.5)
    p.caja((0, 0, 0.42), (0.42, 0.03, 0.06), m)
    for k in range(17):
        x = -0.38 + k * 0.045
        p.caja((x, 0, 0.3 - (0.02 if k < 5 else 0)), (0.012, 0.022, 0.08 if k >= 5 else 0.06), m, p=4.0)
    if dorada:
        destellos(p, [(0.3, -0.1, 0.6), (-0.3, -0.1, 0.55), (0.0, -0.1, 0.65)])


def esponja(p, eterna=False):
    am = M('#F7D774', rough=0.8, fuzz=0.6, pelusa='#FFF0B0')
    ve = M('#6CC68A', rough=0.9, fuzz=0.6, pelusa='#A6E8B8')
    p.caja((0, 0, 0.2), (0.32, 0.18, 0.15), am, p=5.0)
    p.caja((0, 0, 0.4), (0.32, 0.18, 0.06), ve, p=5.0)
    hueco = M('#C9A43E', rough=0.9)
    for (x, z) in [(-0.2, 0.22), (0.05, 0.12), (0.2, 0.26), (-0.05, 0.27), (0.25, 0.1), (-0.25, 0.1)]:
        p.blob((x, -0.18, z), (0.025, 0.012, 0.025), hueco, n=5)
    if eterna:
        o = clay.lathe(p.nom(), [(0.44, -0.02), (0.48, 0.0), (0.44, 0.02), (0.4, 0.0), (0.44, -0.02)], p.coll, oro(), segments=36, subsurf=1,
                       cap_bottom=False, cap_top=False)
        o.location = (0, 0, 0.62)
        o.rotation_euler = (0.25, 0, 0)
        p.add(o)
        destellos(p, [(0.4, -0.2, 0.4), (-0.4, -0.2, 0.5)])


def secador(p, color='#9C8CE0', infernal=False):
    m = M('#D9534F' if infernal else color, rough=0.3, coat=0.6)
    # Cuerpo (cilindro acostado) y boquilla
    p.tubo([(-0.25, 0, 0.55), (0.05, 0, 0.55), (0.3, 0, 0.55)], [0.17, 0.16, 0.1], m, caps=('round', 'flat'), seg=18)
    p.tubo([(0.3, 0, 0.55), (0.4, 0, 0.55)], 0.1, M('#3E3A3A', 0.4), caps=('flat', 'flat'), seg=16)
    # Mango
    p.tubo([(-0.08, 0, 0.45), (-0.12, 0, 0.25), (-0.15, 0, 0.05)], 0.07, m, seg=12)
    p.blob((-0.08, -0.07, 0.3), (0.03, 0.02, 0.04), M('#FFFFFF', 0.4), n=5)
    # Rejilla de atrás
    for k in range(3):
        p.tubo([(-0.4, -0.08 + k * 0.08, 0.45), (-0.4, -0.08 + k * 0.08, 0.65)], 0.01, M('#3E3A3A', 0.4), seg=5)
    # Cable
    p.tubo([(-0.15, 0, 0.02), (-0.3, -0.05, 0.0), (-0.42, 0.0, 0.06)], 0.015, M('#3E3A3A', 0.5), seg=6)
    if infernal:
        fuego = M('#FF8A3D', rough=0.5, emision=4.0, ruido=0.0)
        fuego2 = M('#FFD45C', rough=0.5, emision=5.0, ruido=0.0)
        for (x, z, r, f) in [(0.52, 0.55, 0.1, fuego), (0.65, 0.58, 0.08, fuego), (0.6, 0.5, 0.06, fuego2), (0.75, 0.6, 0.05, fuego2)]:
            p.blob((x, 0, z), (r, r * 0.8, r), f, n=6)
    else:
        vapor(p, [(0.56, -0.02, 0.58)], 0.05)


def espuma(p, devoradora=False):
    m = M('#FFFFFF', rough=0.85, fuzz=0.45, pelusa='#F4F8FF')
    for (x, z, r) in [(0, 0.3, 0.26), (-0.25, 0.22, 0.18), (0.26, 0.22, 0.19), (-0.12, 0.48, 0.17), (0.14, 0.5, 0.16), (0.0, 0.12, 0.2)]:
        p.blob((x, 0, z), (r, r * 0.9, r), m, n=10)
    for (x, z, r) in [(-0.38, 0.5, 0.06), (0.4, 0.55, 0.05), (0.3, 0.72, 0.04)]:
        burbuja(p, (x, -0.05, z), r)
    if devoradora:
        p.blob((0, -0.24, 0.28), (0.16, 0.06, 0.09), M('#4A1E25', 0.5), n=8)
        for k in range(5):
            p.blob((-0.12 + k * 0.06, -0.27, 0.35), (0.022, 0.015, 0.035), M('#FFFBF2', 0.35), n=5)
        for s in (-1, 1):
            p.blob((s * 0.08, -0.25, 0.45), (0.04, 0.02, 0.05), M('#1E1514', 0.2), n=5)


def botella_agua(p, inundacion=False):
    v = vidrio('#BFE6F5')
    p.torno([(0.0, 0.0), (0.13, 0.0), (0.14, 0.03), (0.14, 0.3), (0.1, 0.4), (0.06, 0.45), (0.06, 0.5), (0.0, 0.5)], v)
    agua = M('#5AB4E0', rough=0.1, coat=1.0, transmision=0.5, ruido=0.0)
    p.torno([(0.0, 0.02), (0.125, 0.02), (0.125, 0.26), (0.0, 0.26)], agua)
    p.torno([(0.0, 0.0), (0.07, 0.0), (0.07, 0.08), (0.0, 0.08)], M('#7DB7E8', 0.35, coat=0.4), z=0.48)
    corazon(p, (0, -0.15, 0.2), 0.08, M('#FFFFFF', 0.4), 0.2)
    if inundacion:
        ola = M('#5AB4E0', rough=0.15, coat=0.8, sss=0.2)
        p.tubo([(-0.45, -0.05, 0.05), (-0.25, -0.08, 0.2), (0.0, -0.1, 0.12), (0.25, -0.08, 0.22), (0.45, -0.05, 0.06)], 0.07, ola, seg=12)
        gotas(p, (0.0, -0.2, 0.42), 5, 0.035)
    else:
        gotas(p, (0.0, -0.15, 0.0), 3, 0.03)


def jabon(p, color='#F59AAE', explosivo=False):
    m = M(color, rough=0.35, coat=0.6, sss=0.25)
    p.caja((0, 0, 0.16), (0.3, 0.2, 0.15), m, p=3.0)
    corazon(p, (0, -0.205, 0.17), 0.12, M('#FFFFFF', 0.4), 0.2)
    for (x, z, r) in [(-0.2, 0.36, 0.06), (0.05, 0.42, 0.08), (0.22, 0.35, 0.05), (0.3, 0.48, 0.04)]:
        burbuja(p, (x, -0.02, z), r)
    if explosivo:
        p.tubo([(0.0, 0.0, 0.3), (0.05, 0.0, 0.42), (0.12, 0.0, 0.48)], 0.015, M('#3E322A', 0.6), seg=6)
        estrella(p, (0.14, -0.02, 0.5), 0.08, M('#FFD45C', 0.4, emision=5.0, ruido=0.0), puntas=6)


def bombillo(p, tormenta=False):
    v = M('#FFF3B0', rough=0.15, coat=0.8, emision=2.5 if tormenta else 1.2, ruido=0.0)
    p.blob((0, 0, 0.5), (0.24, 0.24, 0.26), v, n=12, shaper=lambda x: np.column_stack([x[:, 0] * (1 - 0.35 * np.clip(-x[:, 2], 0, 1)), x[:, 1] * (1 - 0.35 * np.clip(-x[:, 2], 0, 1)), x[:, 2]]))
    rosca = plata()
    for k in range(4):
        p.torno([(0.0, 0.0), (0.12, 0.0), (0.13, 0.02), (0.12, 0.04), (0.0, 0.04)], rosca, z=0.12 + k * 0.045)
    p.torno([(0.0, 0.0), (0.06, 0.0), (0.0, 0.06)], M('#3E3A3A', 0.4), z=0.06)
    # Filamento
    p.tubo([(-0.06, -0.02, 0.38), (-0.03, -0.02, 0.5), (0.0, -0.02, 0.44), (0.03, -0.02, 0.5), (0.06, -0.02, 0.38)], 0.008, M('#FF8A3D', 0.4, emision=6.0, ruido=0.0), seg=5)
    rayo = M('#FFE04A', rough=0.4, emision=4.0, ruido=0.0)
    for s in (-1, 1):
        p.tubo([(s * 0.3, -0.05, 0.75), (s * 0.38, -0.05, 0.62), (s * 0.32, -0.05, 0.6), (s * 0.42, -0.05, 0.45)], 0.02, rayo, seg=6, caps=('round', 'point'))
    if tormenta:
        nube = M('#9AA3AE', rough=0.9, fuzz=0.4)
        for (x, z, r) in [(-0.15, 0.95, 0.14), (0.05, 1.0, 0.16), (0.22, 0.93, 0.12)]:
            p.blob((x, 0.05, z), (r, r * 0.8, r * 0.8), nube, n=8)


def toallita(p):
    m = tela('#FFFFFF', '#F2F2F2')
    p.blob((0, 0, 0.3), (0.3, 0.03, 0.3), m, n=8, p=4.0, shaper=lambda v: v + np.array([0, 1, 0]) * 0.06 * np.sin(v[:, 0:1] * 6) * np.sin(v[:, 2:3] * 5))
    estrella(p, (0, -0.06, 0.3), 0.14, M('#F2A5B8', 0.5), puntas=5)
    # Un poquito de maquillaje en la esquina
    p.blob((0.18, -0.04, 0.12), (0.08, 0.01, 0.05), M('#E4A0B4', 0.7), n=6)
    destellos(p, [(-0.25, -0.1, 0.55), (0.3, -0.1, 0.5)])


def luna_de_miel(p):
    m = M('#FFE9A8', rough=0.4, emision=0.8)
    # Media luna: esfera menos esfera (con dos blobs, el segundo «de fondo»)
    k = len(p.objs)
    p.blob((0, 0, 0.42), (0.32, 0.12, 0.32), m, n=12, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], v[:, 2]]))
    p.objs[k].modifiers.new('Hueco', 'BOOLEAN')
    hueco = clay.blob(p.nom(), (0.17, -0.02, 0.5), (0.27, 0.3, 0.27), p.coll, m, n=10, subsurf=1)
    p.objs[k].modifiers['Hueco'].object = hueco
    p.objs[k].modifiers['Hueco'].operation = 'DIFFERENCE'
    hueco.hide_render = True
    hueco.hide_viewport = True
    corazon(p, (0.16, -0.05, 0.45), 0.16, M('#E86A8A', 0.35, coat=0.4), 0.35)
    destellos(p, [(-0.35, -0.1, 0.75), (0.35, -0.1, 0.18), (-0.1, -0.1, 0.05)])


def pato(p, color='#F7D046', pico='#F29B38'):
    m = M(color, rough=0.25, coat=0.7, sss=0.1)
    p.blob((0, 0.02, 0.18), (0.3, 0.22, 0.17), m, n=12, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], v[:, 2] + 0.3 * np.clip(v[:, 0], 0, 1) ** 2]))
    p.blob((-0.12, 0, 0.42), (0.16, 0.15, 0.15), m, n=10)
    p.blob((-0.28, -0.02, 0.4), (0.08, 0.06, 0.035), M(pico, rough=0.35, coat=0.5), n=8)
    p.blob((-0.2, -0.12, 0.46), (0.025, 0.012, 0.03), M('#1E1514', 0.2), n=5)
    p.blob((-0.08, -0.13, 0.47), (0.025, 0.012, 0.03), M('#1E1514', 0.2), n=5)
    p.blob((0.05, -0.2, 0.22), (0.12, 0.03, 0.08), M(color, rough=0.3, coat=0.6), n=6)
    p.blob((-0.13, -0.14, 0.39), (0.03, 0.01, 0.02), M('#F59AAE', 0.6), n=5)


def patos_enamorados(p):
    k = len(p.objs)
    pato(p)
    for o in p.desde(k):
        o.location.x -= 0.25
    k = len(p.objs)
    pato(p, '#9C6BD6', '#F29B38')
    p.girar(p.desde(k), rz=math.pi)
    for o in p.desde(k):
        o.location.x += 0.25
    corazon(p, (0, -0.05, 0.75), 0.18, M('#E86A8A', 0.35, coat=0.4), 0.35)


def rana(p, glotona=False):
    m = M('#7FCB5A', rough=0.3, coat=0.6, sss=0.15)
    s = 1.25 if glotona else 1.0
    p.blob((0, 0, 0.2 * s), (0.3 * s, 0.24 * s, 0.2 * s), m, n=12)
    for x in (-0.13, 0.13):
        p.blob((x * s, -0.05, 0.38 * s), (0.08 * s,) * 3, m, n=8)
        p.blob((x * s, -0.12 * s, 0.4 * s), (0.045 * s, 0.02, 0.05 * s), M('#FFFDF8', 0.3), n=6)
        p.blob((x * s, -0.14 * s, 0.4 * s), (0.025 * s, 0.012, 0.03 * s), M('#1E1514', 0.2), n=5)
    p.tubo([(-0.12 * s, -0.22 * s, 0.22 * s), (0, -0.25 * s, 0.18 * s), (0.12 * s, -0.22 * s, 0.22 * s)], 0.012, M('#3E6A2A', 0.5), seg=5)
    for sx in (-1, 1):
        p.blob((sx * 0.25 * s, -0.12, 0.05), (0.09 * s, 0.1 * s, 0.04), m, n=6)
    p.blob((0, -0.18 * s, 0.12 * s), (0.18 * s, 0.05, 0.08 * s), M('#E8F5C8', 0.5), n=8)
    if glotona:
        o = len(p.objs)
        from_c = (0, 0.0, 0.48 * s)
        corona_simple(p, from_c, 0.13, 0.1)
        for (x, z) in [(0.38, 0.05), (0.45, 0.15), (-0.4, 0.08)]:
            gota_dorada(p, (x, -0.05, z), 0.06)


def corona_simple(p, c, r, alto, m=None):
    m = m or oro()
    p.torno([(r, 0), (r * 1.02, alto * 0.45), (r * 0.9, alto * 0.45), (r * 0.88, 0)], m, x=c[0], y=c[1], z=c[2], seg=24, tapas=(False, False))
    for k in range(5):
        a = k / 5 * TAU + math.pi / 2
        p.blob((c[0] + math.cos(a) * r, c[1] + math.sin(a) * r, c[2] + alto * 0.62), (r * 0.16, r * 0.16, alto * 0.3), m, n=6,
               shaper=lambda v: v * (1 - 0.7 * np.clip(v[:, 2:3], 0, 1)))
        p.blob((c[0] + math.cos(a) * r, c[1] + math.sin(a) * r, c[2] + alto * 0.95), (r * 0.09,) * 3, m, n=5)


def ducha(p, diluvio=False):
    metal = plata()
    p.tubo([(0.3, 0.05, 0.95), (0.3, 0.05, 1.1), (0.1, 0.05, 1.15), (-0.05, 0.05, 1.02)], 0.035, metal, seg=10)
    p.torno([(0.0, 0.0), (0.2, 0.0), (0.21, 0.03), (0.12, 0.12), (0.0, 0.13)], metal, x=-0.05, z=0.82)
    for k in range(7):
        a = k / 7 * TAU
        p.blob((-0.05 + math.cos(a) * 0.12, math.sin(a) * 0.12, 0.81), (0.015,) * 3, M('#3E3A3A', 0.4), n=5)
    agua = M('#8FD3F2', rough=0.1, coat=1.0, transmision=0.5, ruido=0.0)
    n = 9 if diluvio else 5
    for k in range(n):
        x = -0.05 + (k / (n - 1) - 0.5) * (0.5 if diluvio else 0.26)
        for j in range(4 if diluvio else 3):
            z = 0.7 - j * 0.2 - (k % 2) * 0.08
            p.blob((x * (1 + j * 0.25), -0.02, z), (0.025, 0.025, 0.05), agua, n=5)
    if diluvio:
        p.tubo([(-0.45, -0.05, 0.05), (-0.2, -0.08, 0.12), (0.1, -0.08, 0.06), (0.4, -0.05, 0.12)], 0.06, M('#5AB4E0', 0.15, coat=0.8), seg=10)


def hilo(p, seda=False):
    caja = M('#FFFFFF' if not seda else '#F2C14E', rough=0.3, coat=0.5, metal=0.6 if seda else 0.0)
    p.caja((0, 0, 0.18), (0.18, 0.1, 0.18), caja, p=3.5)
    p.caja((0, 0, 0.38), (0.19, 0.11, 0.04), M('#68C9B9', 0.35, coat=0.4), p=3.5)
    hilo_m = M('#FFFFFF' if not seda else '#FFE9A8', rough=0.5, emision=0.0 if not seda else 1.5, ruido=0.0)
    p.tubo([(0.12, -0.05, 0.4), (0.3, -0.1, 0.55), (0.42, -0.1, 0.45), (0.5, -0.05, 0.62), (0.62, -0.05, 0.5)], 0.008, hilo_m, seg=5)
    if seda:
        destellos(p, [(0.5, -0.12, 0.7), (-0.2, -0.12, 0.55)])


def perfume(p, color='#F2A5B8', tapa='#F2C14E', alto=0.42, corazon_forma=False):
    v = M(color, rough=0.08, coat=1.0, transmision=0.55, ruido=0.0)
    if corazon_forma:
        corazon(p, (0, 0, 0.28), 0.42, v, 0.5)
    else:
        p.caja((0, 0, alto / 2), (0.16, 0.1, alto / 2), v, p=3.2)
        # El perfume adentro (se ve por el vidrio, también en el celular)
        p.caja((0, 0, alto * 0.4), (0.12, 0.07, alto * 0.33), M(color, rough=0.2, coat=0.6, sss=0.3, ruido=0.0), p=3.2)
        # Facetas
        p.caja((0, -0.105, alto / 2), (0.1, 0.01, alto * 0.32), M('#FFFFFF', 0.05, coat=1.0, transmision=0.3, ruido=0.0), p=3.0)
    z = (0.55 if corazon_forma else alto)
    p.torno([(0.0, 0.0), (0.05, 0.0), (0.05, 0.05), (0.0, 0.05)], oro(), z=z)
    p.blob((0, 0, z + 0.12), (0.09, 0.09, 0.08), M(tapa, rough=0.25, metal=0.6 if tapa == '#F2C14E' else 0.0, coat=0.5), n=10, p=3.0)
    # Nubecita de perfume
    nube = M('#F2D7F2', rough=0.9, fuzz=0.4)
    for (x, z2, r) in [(0.25, z + 0.1, 0.05), (0.33, z + 0.14, 0.04), (0.4, z + 0.1, 0.03)]:
        p.blob((x, -0.05, z2), (r, r, r), nube, n=6)


# ----------------------------------------------------------------------------------------------------- Pasivas
def jabon_fuerte(p):
    jabon(p, '#7DB7E8')
    # Bracito sacando músculo
    m = M('#7DB7E8', rough=0.35, coat=0.5)
    p.tubo([(0.28, 0, 0.2), (0.45, 0, 0.28), (0.45, 0, 0.45)], 0.05, m, seg=10)
    p.blob((0.43, 0, 0.35), (0.075, 0.06, 0.065), m, n=8)
    p.blob((0.45, 0, 0.5), (0.06,) * 3, m, n=8)


def gorro_bano(p):
    m = M('#F2A5B8', rough=0.45, coat=0.3, sss=0.1)
    p.blob((0, 0, 0.12), (0.34, 0.3, 0.3), m, n=12, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], -0.1)]))
    vuelo = M('#FFFFFF', rough=0.6)
    for k in range(18):
        a = k / 18 * TAU
        p.blob((math.cos(a) * 0.35, math.sin(a) * 0.31, 0.1), (0.05, 0.05, 0.035), vuelo, n=5)
    for (x, y, z) in [(-0.15, -0.25, 0.3), (0.12, -0.24, 0.35), (0.0, -0.2, 0.42), (0.2, -0.18, 0.22)]:
        p.blob((x, y, z), (0.03, 0.01, 0.03), M('#FFFFFF', 0.5), n=5)


def frasco_crema(p, color='#F7C6D2', tapa='#E86A8A', simbolo='corazon'):
    p.torno([(0.0, 0.0), (0.22, 0.0), (0.24, 0.03), (0.24, 0.22), (0.0, 0.22)], M('#FFFFFF', 0.3, coat=0.6))
    p.torno([(0.0, 0.0), (0.25, 0.0), (0.26, 0.04), (0.25, 0.1), (0.0, 0.1)], M(tapa, rough=0.3, coat=0.5), z=0.22)
    p.torno([(0.0, 0.0), (0.18, 0.0), (0.0, 0.06)], M(color, rough=0.8, fuzz=0.3), z=0.32)
    if simbolo == 'corazon':
        corazon(p, (0, -0.245, 0.12), 0.12, M(tapa, 0.35), 0.15)
    else:
        luna = M('#FFE9A8', rough=0.4, emision=0.6)
        p.blob((0, -0.25, 0.12), (0.06, 0.01, 0.06), luna, n=8)
        for (x, z) in [(0.1, 0.17), (-0.1, 0.08)]:
            estrella(p, (x, -0.25, z), 0.03, luna, puntas=4)


def reloj_arena(p):
    madera = M('#C9956A', rough=0.6, ruido=0.15)
    for z in (0.0, 0.62):
        p.caja((0, 0, z + 0.03), (0.22, 0.22, 0.03), madera)
    for (x, y) in [(-0.18, -0.18), (0.18, -0.18), (-0.18, 0.18), (0.18, 0.18)]:
        p.tubo([(x, y, 0.05), (x, y, 0.62)], 0.018, madera, seg=8)
    v = vidrio()
    p.torno([(0.0, 0.06), (0.14, 0.08), (0.12, 0.22), (0.02, 0.33), (0.12, 0.44), (0.14, 0.58), (0.0, 0.6)], v)
    arena = M('#F2C14E', rough=0.8, fuzz=0.3)
    p.torno([(0.0, 0.08), (0.12, 0.09), (0.0, 0.2)], arena)
    p.torno([(0.0, 0.44), (0.1, 0.48), (0.12, 0.54), (0.0, 0.55)], arena)
    p.tubo([(0, 0, 0.32), (0, 0, 0.1)], 0.006, arena, seg=5)


def lupa(p):
    p.tubo([(0.0, 0, 0.0), (0.0, 0, 0.3)], 0.04, M('#F2A5B8', 0.35, coat=0.4), seg=10)
    o = clay.lathe(p.nom(), [(0.24, -0.04), (0.28, 0.0), (0.24, 0.04), (0.2, 0.0), (0.24, -0.04)], p.coll, oro(), segments=36, subsurf=1,
                   cap_bottom=False, cap_top=False)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (0, 0, 0.56)
    p.add(o)
    p.blob((0, 0, 0.56), (0.22, 0.02, 0.22), M('#DDEFFF', rough=0.02, metal=0.9, coat=1.0, ruido=0.0), n=10)
    p.blob((-0.08, -0.03, 0.64), (0.05, 0.005, 0.03), BRILLO, n=5)


def liga(p):
    m = M('#9C6BD6', rough=0.9, fuzz=0.5)
    o = clay.lathe(p.nom(), [(0.2, -0.06), (0.27, -0.02), (0.29, 0.02), (0.25, 0.07), (0.18, 0.05), (0.15, 0.0), (0.2, -0.06)], p.coll, m,
                   segments=40, subsurf=1, cap_bottom=False, cap_top=False)
    o.rotation_euler = (1.1, 0, 0)
    o.location = (0, 0, 0.3)
    p.add(o)
    for k in range(10):
        a = k / 10 * TAU
        p.blob((math.cos(a) * 0.24, math.sin(a) * 0.24 * math.cos(1.1), 0.3 + math.sin(a) * 0.24 * math.sin(1.1)), (0.05, 0.05, 0.04), m, n=6)


def sales(p):
    v = vidrio('#E8F6FF')
    p.torno([(0.0, 0.0), (0.2, 0.0), (0.22, 0.04), (0.22, 0.42), (0.16, 0.48), (0.0, 0.48)], v)
    for k, c in enumerate(['#F2A5B8', '#B8A6F0', '#8FD3F2', '#FFFFFF']):
        for j in range(5):
            a = j * 1.3 + k
            p.blob((math.cos(a) * 0.12, math.sin(a) * 0.12, 0.06 + k * 0.08 + j * 0.01), (0.04, 0.04, 0.035), M(c, rough=0.3, coat=0.5), n=5, p=3.0)
    p.torno([(0.0, 0.0), (0.18, 0.0), (0.18, 0.08), (0.0, 0.08)], M('#C9956A', 0.6, ruido=0.15), z=0.48)
    corazon(p, (0, -0.225, 0.22), 0.1, M('#E86A8A', 0.35), 0.15)


def espejo_mano(p, color='#F2A5B8', x=0.0, roto=False):
    m = M(color, rough=0.35, coat=0.5)
    p.tubo([(x, 0, 0.0), (x, 0, 0.28)], 0.035, m, seg=10)
    o = clay.lathe(p.nom(), [(0.18, -0.035), (0.21, 0.0), (0.18, 0.035), (0.15, 0.0), (0.18, -0.035)], p.coll, m, segments=32, subsurf=1,
                   cap_bottom=False, cap_top=False)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (x, 0, 0.48)
    p.add(o)
    vid = M('#DDEFFF', rough=0.02, metal=0.9, coat=1.0, ruido=0.0)
    p.blob((x, 0, 0.48), (0.17, 0.02, 0.17), vid, n=10)
    if roto:
        for (a, b) in [((x - 0.12, 0.6), (x + 0.02, 0.46)), ((x + 0.02, 0.46), (x + 0.12, 0.56)), ((x + 0.02, 0.46), (x - 0.05, 0.34))]:
            p.tubo([(a[0], -0.03, a[1]), (b[0], -0.03, b[1])], 0.007, M('#3E3A3A', 0.4), seg=5)
    else:
        p.blob((x - 0.06, -0.03, 0.56), (0.04, 0.005, 0.025), BRILLO, n=5)


def espejo_doble(p):
    k = len(p.objs)
    espejo_mano(p, '#F2A5B8', -0.18)
    p.girar(p.desde(k), ry=-0.25, pivote=(-0.18, 0, 0))
    k = len(p.objs)
    espejo_mano(p, '#7DB7E8', 0.18)
    p.girar(p.desde(k), ry=0.25, pivote=(0.18, 0, 0))


def pantuflas(p):
    m = M('#F7C6D2', rough=0.9, fuzz=0.6, pelusa='#FFE4EC')
    for x in (-0.16, 0.16):
        p.blob((x, -0.05, 0.08), (0.12, 0.24, 0.09), m, n=10)
        p.blob((x, -0.2, 0.12), (0.1, 0.08, 0.07), M('#FFFFFF', 0.9, fuzz=0.5), n=8)
        # Alitas
        for s in (-1, 1):
            if (x < 0 and s > 0) or (x > 0 and s < 0):
                continue
            p.blob((x + s * 0.14, 0.05, 0.2), (0.12, 0.03, 0.07), M('#FFFFFF', 0.6, fuzz=0.3), n=8,
                   shaper=lambda v, s=s: v + np.array([0, 0, 1]) * (v[:, 0:1] * s) * 0.4)


def iman(p):
    rojo = M('#E4574B', rough=0.3, coat=0.5)
    p.tubo([(-0.2, 0, 0.1), (-0.2, 0, 0.42), (-0.12, 0, 0.6), (0.0, 0, 0.64), (0.12, 0, 0.6), (0.2, 0, 0.42), (0.2, 0, 0.1)], 0.08, rojo, seg=14,
           caps=('flat', 'flat'))
    for x in (-0.2, 0.2):
        p.tubo([(x, 0, 0.0), (x, 0, 0.1)], 0.08, plata(), seg=14, caps=('flat', 'flat'))
    gotas(p, (0.0, -0.1, -0.1), 3, 0.035)
    destellos(p, [(-0.35, -0.1, 0.1), (0.35, -0.1, 0.1)], 0.04)


def trebol(p, s=1.0):
    m = M('#5DB54E', rough=0.45, coat=0.3, sss=0.1)
    for k in range(4):
        a = k / 4 * TAU + math.pi / 4
        corazon(p, (math.cos(a) * 0.15 * s, -0.0, 0.45 * s + math.sin(a) * 0.15 * s), 0.22 * s, m, 0.25)
    p.tubo([(0, 0, 0.45 * s), (0.05 * s, 0, 0.2 * s), (0.12 * s, 0, 0.0)], 0.025 * s, m, seg=8)


def corona_espuma(p):
    corona_simple(p, (0, 0, 0.05), 0.24, 0.3)
    esp = M('#FFFFFF', rough=0.85, fuzz=0.45)
    for k in range(9):
        a = k / 9 * TAU
        p.blob((math.cos(a) * 0.24, math.sin(a) * 0.24, 0.06), (0.07, 0.07, 0.06), esp, n=6)
    for (x, z, r) in [(0.0, 0.42, 0.06), (-0.2, 0.4, 0.04), (0.22, 0.45, 0.05)]:
        burbuja(p, (x, -0.1, z), r)


def alcancia(p):
    m = M('#F59AAE', rough=0.35, coat=0.5, sss=0.1)
    p.blob((0, 0, 0.3), (0.32, 0.24, 0.24), m, n=12)
    p.blob((-0.3, -0.02, 0.32), (0.07, 0.08, 0.07), m, n=8)
    p.blob((-0.36, -0.02, 0.32), (0.015, 0.03, 0.025), M('#C8667E', 0.5), n=5)
    for (x, y) in [(-0.18, -0.14), (0.18, -0.14), (-0.18, 0.14), (0.18, 0.14)]:
        p.blob((x, y, 0.07), (0.06, 0.06, 0.07), m, n=6)
    for s in (-1, 1):
        p.blob((-0.18, s * 0.12, 0.5), (0.05, 0.03, 0.06), m, n=6)
    p.blob((-0.22, -0.2, 0.38), (0.02, 0.01, 0.025), M('#1E1514', 0.2), n=5)
    p.caja((0.05, 0, 0.54), (0.08, 0.015, 0.01), M('#3E3A3A', 0.4))
    gota_dorada(p, (0.05, 0, 0.66), 0.06)


def curita(p):
    m = M('#F2C9A4', rough=0.6, ruido=0.1)
    corazon(p, (0, 0, 0.35), 0.55, m, 0.12)
    p.caja((0, -0.04, 0.32), (0.11, 0.02, 0.09), M('#FFFFFF', 0.7, fuzz=0.2), p=3.0)
    for (x, z) in [(-0.2, 0.42), (0.2, 0.42), (-0.12, 0.2), (0.12, 0.2)]:
        p.blob((x, -0.045, z), (0.012, 0.005, 0.012), M('#D8A882', 0.6), n=5)
    corazon(p, (0, -0.07, 0.32), 0.1, M('#E86A8A', 0.35), 0.2)


# ----------------------------------------------------------------------------------------------------- Tienda
def dado(p):
    m = M('#FFFFFF', rough=0.3, coat=0.5)
    p.caja((0, 0, 0.25), (0.22, 0.22, 0.22), m, p=6.0)
    pun = M('#E4574B', 0.3)
    for (x, z) in [(-0.1, 0.35), (0.0, 0.25), (0.1, 0.15)]:
        p.blob((x, -0.225, z), (0.035, 0.01, 0.035), pun, n=5)
    for (x, y) in [(-0.1, -0.1), (0.1, 0.1), (-0.1, 0.1), (0.1, -0.1)]:
        p.blob((x, y, 0.475), (0.035, 0.035, 0.01), pun, n=5)
    p.girar(p.objs[-8:], rz=0.4)


def flecha(p):
    m = M('#68C9B9', rough=0.35, coat=0.4)
    pts = [(-0.3, 0, 0.15), (-0.25, 0, 0.45), (0.0, 0, 0.6), (0.25, 0, 0.45)]
    p.tubo(pts, 0.06, m, seg=12)
    p.blob((0.3, 0, 0.38), (0.12, 0.06, 0.12), m, n=8, shaper=lambda v: v * (1 - 0.7 * np.clip(-v[:, 0:1] - v[:, 2:3], 0, 1)))


def tachar(p):
    m = M('#E4574B', rough=0.35, coat=0.4)
    o = clay.lathe(p.nom(), [(0.28, -0.04), (0.32, 0.0), (0.28, 0.04), (0.24, 0.0), (0.28, -0.04)], p.coll, m, segments=36, subsurf=1,
                   cap_bottom=False, cap_top=False)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (0, 0, 0.35)
    p.add(o)
    p.tubo([(-0.2, 0, 0.55), (0.2, 0, 0.15)], 0.04, m, seg=10)


# ----------------------------------------------------------------------------------------------------- Del piso
def gota_dorada(p, c=(0, 0, 0.0), r=0.2):
    m = M('#F2C14E', rough=0.18, metal=0.75, coat=0.6, ruido=0.0)
    p.blob((c[0], c[1], c[2] + r * 1.1), (r, r * 0.7, r * 1.2), m, n=10,
           shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.75 * np.clip(v[:, 2], 0, 1) ** 1.3), v[:, 1] * (1 - 0.75 * np.clip(v[:, 2], 0, 1) ** 1.3), v[:, 2] + 0.25 * np.clip(v[:, 2], 0, 1) ** 2]))
    p.blob((c[0] - r * 0.3, c[1] - r * 0.7, c[2] + r * 1.0), (r * 0.15, r * 0.05, r * 0.25), BRILLO, n=5)


def moneda(p):
    gota_dorada(p, (0, 0, 0.05), 0.22)
    destellos(p, [(0.25, -0.15, 0.6)], 0.05)


def bolsa(p):
    m = tela('#C9956A', '#E8C9A8')
    p.blob((0, 0, 0.25), (0.28, 0.24, 0.26), m, n=12, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], v[:, 2] - 0.15 * np.clip(-v[:, 2], 0, 1)]))
    p.tubo([(-0.12, 0, 0.5), (0.0, -0.02, 0.48), (0.12, 0, 0.5)], 0.04, M('#8A5A3C', 0.6), seg=8)
    for (x, z) in [(-0.08, 0.55), (0.08, 0.56), (0.0, 0.6)]:
        gota_dorada(p, (x, 0.0, z), 0.07)
    p.blob((0, -0.24, 0.24), (0.07, 0.01, 0.07), M('#F2C14E', 0.3, metal=0.6), n=6)


def frasco_oro(p):
    v = vidrio()
    p.torno([(0.0, 0.0), (0.2, 0.0), (0.22, 0.04), (0.22, 0.42), (0.14, 0.5), (0.14, 0.55), (0.0, 0.55)], v)
    for k in range(12):
        a = k * 1.7
        gota_dorada(p, (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.03 + (k // 4) * 0.12), 0.06)
    p.torno([(0.0, 0.0), (0.16, 0.0), (0.16, 0.06), (0.0, 0.06)], M('#E86A8A', 0.35), z=0.55)


def arepa(p):
    m = M('#F2D49B', rough=0.75, fuzz=0.35, pelusa='#FFF0C8')
    p.blob((0, 0, 0.12), (0.34, 0.34, 0.11), m, n=12, p=2.4)
    tostado = M('#C9955A', rough=0.8)
    for (x, y) in [(-0.15, -0.1), (0.12, 0.08), (0.05, -0.18), (-0.08, 0.15), (0.2, -0.05)]:
        p.blob((x, y, 0.225), (0.05, 0.04, 0.012), tostado, n=5)
    queso = M('#FFF8E0', rough=0.5, sss=0.3)
    p.blob((0.02, -0.02, 0.24), (0.2, 0.18, 0.04), queso, n=10, shaper=lambda v: v + np.array([0, 0, 1]) * 0.03 * np.sin(v[:, 0:1] * 9))
    p.tubo([(0.18, -0.12, 0.24), (0.24, -0.2, 0.17), (0.23, -0.26, 0.08)], 0.025, queso, seg=6)
    vapor(p, [(0.0, 0.0, 0.42)], 0.04)


def balde(p):
    m = M('#5AA6E0', rough=0.35, coat=0.4)
    p.torno([(0.0, 0.0), (0.18, 0.0), (0.24, 0.32), (0.26, 0.34), (0.22, 0.34), (0.2, 0.06), (0.0, 0.06)], m)
    p.tubo([(-0.24, 0, 0.32), (0.0, 0, 0.55), (0.24, 0, 0.32)], 0.012, plata(), seg=6)
    agua = M('#8FD3F2', rough=0.1, coat=1.0, sss=0.2, ruido=0.0)
    p.blob((0, 0, 0.33), (0.21, 0.21, 0.03), agua, n=10)
    for (x, z, r) in [(-0.15, 0.45, 0.06), (0.1, 0.5, 0.05), (0.2, 0.42, 0.04), (0.0, 0.6, 0.05), (-0.25, 0.55, 0.035)]:
        p.blob((x, -0.05, z), (r, r, r * 1.2), agua, n=6)


def cubo_hielo(p):
    m = M('#BFE6F5', rough=0.05, coat=1.0, transmision=0.6, sss=0.3, ruido=0.0)
    p.caja((0, 0, 0.22), (0.2, 0.2, 0.2), m, p=5.0)
    p.blob((-0.08, -0.205, 0.3), (0.05, 0.01, 0.03), BRILLO, n=5)
    for (x, z) in [(-0.3, 0.45), (0.3, 0.5), (0.25, 0.1)]:
        estrella(p, (x, -0.1, z), 0.06, M('#E8F6FF', 0.3, emision=1.5, ruido=0.0), puntas=6)


def aspiradora(p):
    m = M('#9C8CE0', rough=0.3, coat=0.5)
    p.blob((0.05, 0, 0.18), (0.26, 0.18, 0.17), m, n=10, p=3.0)
    for x in (-0.12, 0.2):
        p.tubo([(x, -0.19, 0.06), (x, 0.19, 0.06)], 0.05, M('#3E3A3A', 0.5), seg=10, caps=('flat', 'flat'))
    p.tubo([(-0.18, 0, 0.2), (-0.32, 0, 0.35), (-0.3, 0, 0.6)], 0.04, M('#3E3A3A', 0.5), seg=10)
    p.caja((-0.3, 0, 0.66), (0.1, 0.04, 0.03), m)
    p.blob((0.12, -0.17, 0.25), (0.05, 0.01, 0.05), M('#FFFFFF', 0.4), n=5)
    # Remolino de gotitas
    for k in range(5):
        a = k * 0.9
        p.blob((0.3 + math.cos(a) * 0.12, -0.05, 0.5 + math.sin(a) * 0.1), (0.03, 0.03, 0.04), M('#6CC6F5', 0.15, coat=0.8), n=5)


def aji(p):
    m = M('#E4392B', rough=0.2, coat=0.8, sss=0.15)
    p.tubo([(-0.2, 0, 0.45), (0.0, 0, 0.35), (0.12, 0, 0.18), (0.08, 0, 0.0)], [0.11, 0.11, 0.07, 0.01], m, seg=14, caps=('round', 'point'))
    p.tubo([(-0.22, 0, 0.5), (-0.28, 0, 0.6), (-0.22, 0, 0.66)], 0.025, M('#5DB54E', 0.4), seg=8)
    p.blob((-0.2, 0, 0.52), (0.08, 0.08, 0.035), M('#5DB54E', 0.4), n=8)
    p.blob((-0.1, -0.1, 0.42), (0.03, 0.01, 0.05), BRILLO, n=5)
    fuego = M('#FF8A3D', rough=0.5, emision=4.0, ruido=0.0)
    for (x, z, r) in [(0.22, 0.2, 0.05), (0.3, 0.3, 0.04)]:
        p.blob((x, -0.05, z), (r, r, r * 1.3), fuego, n=6)


def cofre(p, abierto=False):
    madera = M('#B5703A', rough=0.55, ruido=0.2)
    oro_m = oro()
    p.caja((0, 0, 0.18), (0.32, 0.22, 0.18), madera, p=8.0)
    for x in (-0.24, 0.24):
        p.caja((x, 0, 0.18), (0.035, 0.225, 0.185), oro_m, p=8.0)
    k = len(p.objs)
    tapa = p.blob((0, 0, 0.36), (0.32, 0.22, 0.14), madera, n=10, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], 0)]))
    for x in (-0.24, 0.24):
        p.blob((x, 0, 0.36), (0.035, 0.225, 0.145), oro_m, n=8, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], 0)]))
    p.caja((0, -0.23, 0.33), (0.06, 0.02, 0.07), oro_m, p=4.0)
    corazon(p, (0, -0.255, 0.33), 0.08, M('#E86A8A', 0.35, coat=0.5), 0.2)
    if abierto:
        p.girar(p.desde(k), rx=-1.2, pivote=(0, 0.22, 0.36))
        luz = M('#FFE9A8', rough=0.5, emision=6.0, ruido=0.0)
        p.blob((0, 0, 0.37), (0.28, 0.18, 0.04), luz, n=8)
        for (x, z) in [(-0.1, 0.45), (0.1, 0.5), (0.0, 0.58)]:
            gota_dorada(p, (x, 0.0, z), 0.06)


def gema(p, color, r=0.18):
    m = M(color, rough=0.05, coat=1.0, transmision=0.45, sss=0.2, ruido=0.0)
    p.blob((0, 0, r * 1.1), (r, r * 0.75, r * 1.25), m, n=10,
           shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.8 * np.clip(v[:, 2], 0, 1) ** 1.4), v[:, 1] * (1 - 0.8 * np.clip(v[:, 2], 0, 1) ** 1.4), v[:, 2] + 0.3 * np.clip(v[:, 2], 0, 1) ** 2]))
    p.blob((-r * 0.3, -r * 0.72, r * 1.05), (r * 0.15, r * 0.04, r * 0.28), BRILLO, n=5)


def velita(p):
    """Velita aromática en vasito (La Cara)."""
    v = vidrio('#FFE0EC')
    p.torno([(0.0, 0.0), (0.17, 0.0), (0.18, 0.02), (0.18, 0.3), (0.16, 0.3), (0.15, 0.02), (0.0, 0.02)], v)
    p.torno([(0.0, 0.0), (0.155, 0.0), (0.155, 0.22), (0.0, 0.22)], M('#F7C6D2', 0.6, sss=0.3), z=0.02)
    p.tubo([(0, 0, 0.24), (0.005, 0, 0.3)], 0.008, M('#3E322A', 0.6), seg=5)
    fuego = M('#FFB347', rough=0.5, emision=8.0, ruido=0.0)
    p.blob((0, 0, 0.36), (0.035, 0.035, 0.07), fuego, n=8, shaper=lambda x: x * (1 - 0.6 * np.clip(x[:, 2:3], 0, 1)))
    p.blob((0, -0.18, 0.13), (0.06, 0.01, 0.06), M('#E86A8A', 0.4), n=6)


def vaso_cepillos(p):
    """El vaso de los cepillos (El Lavamanos)."""
    p.torno([(0.0, 0.0), (0.15, 0.0), (0.17, 0.32), (0.15, 0.32), (0.13, 0.03), (0.0, 0.03)], M('#7DB7E8', 0.3, coat=0.5))
    for k, c in enumerate(['#E85D6A', '#68C9B9', '#F7D046']):
        x = (k - 1) * 0.06
        p.tubo([(x, 0, 0.05), (x * 1.6, 0, 0.5)], 0.018, M(c, 0.3, coat=0.5), seg=6)
        p.caja((x * 1.65, 0, 0.53), (0.02, 0.03, 0.05), M('#FFFFFF', 0.6), p=4.0)
    p.blob((0, -0.16, 0.16), (0.05, 0.01, 0.05), M('#FFFFFF', 0.4), n=6)


def vela_flotante(p):
    """Vela flotante con flor (La Bañera)."""
    p.torno([(0.0, 0.0), (0.2, 0.0), (0.22, 0.04), (0.22, 0.14), (0.0, 0.14)], M('#FFF6E8', 0.55, sss=0.3))
    for k in range(6):
        a = k / 6 * TAU
        p.blob((math.cos(a) * 0.24, math.sin(a) * 0.24, 0.05), (0.09, 0.05, 0.03), M('#F2A5B8', 0.6, sss=0.2), n=6)
    p.tubo([(0, 0, 0.14), (0.005, 0, 0.2)], 0.008, M('#3E322A', 0.6), seg=5)
    fuego = M('#FFB347', rough=0.5, emision=8.0, ruido=0.0)
    p.blob((0, 0, 0.26), (0.035, 0.035, 0.07), fuego, n=8, shaper=lambda x: x * (1 - 0.6 * np.clip(x[:, 2:3], 0, 1)))


# ----------------------------------------------------------------------------------------------------- Accesorios (disfraces)
def turbante(p):
    m = tela('#F7C6D2', '#FFE4EC')
    p.blob((0, 0.02, 0.18), (0.42, 0.42, 0.26), m, n=12)
    for k in range(4):
        a = k * 0.8
        p.tubo([(-0.4, 0.0, 0.06 + k * 0.08), (0.0, -0.44 + k * 0.03, 0.12 + k * 0.08), (0.4, 0.0, 0.08 + k * 0.08)], 0.06, m, perfil=(1.5, 0.6), seg=10)
    p.blob((0.05, -0.05, 0.48), (0.17, 0.15, 0.12), m, n=8)


def casco_burbuja(p):
    p.blob((0, 0, 0.0), (0.62, 0.62, 0.6), vidrio('#E8F6FF'), n=16)
    p.torno([(0.0, 0.0), (0.5, 0.0), (0.52, 0.06), (0.5, 0.1), (0.0, 0.1)], plata(), z=-0.55)
    p.tubo([(0.3, 0.2, 0.45), (0.38, 0.25, 0.72)], 0.012, plata(), seg=5)
    bombillo_chico = M('#FFF3B0', rough=0.15, emision=2.0, ruido=0.0)
    p.blob((0.38, 0.25, 0.76), (0.05,) * 3, bombillo_chico, n=8)


def casco_bombero(p):
    m = M('#E4392B', rough=0.3, coat=0.6)
    p.blob((0, 0.0, 0.1), (0.46, 0.46, 0.36), m, n=12, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], -0.15)]))
    p.blob((0, 0.12, 0.0), (0.56, 0.62, 0.05), m, n=10)
    p.tubo([(0, -0.4, 0.35), (0, 0.0, 0.48), (0, 0.4, 0.35)], 0.04, M('#C42A1F', 0.3, coat=0.5), seg=8)
    p.caja((0, -0.44, 0.18), (0.12, 0.02, 0.1), oro(), p=4.0)


def manguera(p):
    m = M('#7FB069', rough=0.4, coat=0.4)
    for k in range(3):
        o = clay.lathe(p.nom(), [(0.22 + k * 0.04, -0.03), (0.26 + k * 0.04, 0.0), (0.22 + k * 0.04, 0.03), (0.18 + k * 0.04, 0.0), (0.22 + k * 0.04, -0.03)], p.coll, m,
                       segments=28, subsurf=1, cap_bottom=False, cap_top=False)
        o.rotation_euler = (math.pi / 2, 0, 0)
        o.location = (0, 0.02 * k, 0)
        p.add(o)
    p.caja((0, -0.06, -0.3), (0.05, 0.05, 0.08), plata(), p=4.0)


def espejo_frente(p):
    p.tubo([(-0.42, 0, 0.0), (0.0, -0.44, 0.0), (0.42, 0, 0.0)], 0.03, M('#3E3A3A', 0.5), seg=8)
    p.blob((0, -0.47, 0.06), (0.12, 0.02, 0.12), M('#DDEFFF', rough=0.02, metal=0.9, coat=1.0, ruido=0.0), n=10)
    p.torno([(0.13, 0.0), (0.13, 0.03)], plata(), seg=24, tapas=(False, False))
    p.objs[-1].rotation_euler = (math.pi / 2, 0, 0)
    p.objs[-1].location = (0, -0.45, 0.06)


def rulos(p):
    colores = ['#F59AAE', '#7DB7E8', '#F7D046', '#B8A6F0']
    for k, (x, y, z) in enumerate([(-0.25, -0.1, 0.25), (0.0, -0.18, 0.32), (0.25, -0.1, 0.25), (-0.12, 0.15, 0.36), (0.14, 0.12, 0.36)]):
        p.tubo([(x - 0.08, y, z), (x + 0.08, y, z)], 0.055, M(colores[k % 4], 0.4, coat=0.3), seg=10, caps=('flat', 'flat'))


def escudo(p):
    m = M('#E86A8A', rough=0.3, coat=0.5)
    corazon(p, (0, 0, 0.0), 0.7, m, 0.18)
    corazon(p, (0, -0.07, 0.0), 0.42, oro(), 0.12)


def toalla_hombro(p):
    m = tela('#FFFFFF', '#F2F2F2')
    p.tubo([(-0.25, -0.15, -0.3), (-0.2, -0.05, 0.0), (0.0, 0.05, 0.12), (0.2, 0.05, 0.0), (0.25, 0.15, -0.35)], 0.05, m, perfil=(2.4, 0.4), seg=12)
    for d in (-0.18, 0.18):
        p.tubo([(d * 1.35, 0.15 * (1 if d > 0 else -1) - 0.01, -0.28), (d * 1.4, 0.15 * (1 if d > 0 else -1) - 0.01, -0.33)], 0.052, tela('#7DB7E8'),
               perfil=(2.4, 0.45), seg=10)


def espuma_cabeza(p):
    m = M('#FFFFFF', rough=0.85, fuzz=0.45)
    for (x, y, z, r) in [(0, 0, 0.0, 0.2), (-0.18, 0.05, -0.04, 0.14), (0.18, 0.03, -0.03, 0.15), (0.05, -0.1, 0.06, 0.12), (-0.05, 0.12, 0.08, 0.12)]:
        p.blob((x, y, z), (r, r, r * 0.8), m, n=8)
    burbuja(p, (0.25, -0.1, 0.2), 0.06)


# Las piezas de la cara y del pelo se modelan ya en su sitio, en medidas de la cabeza del muñeco (el hueso «cabeza»
# en el origen; en el juego: x a la derecha, y arriba, z hacia adelante). H() las pasa a Blender (z arriba, -y adelante).
def H(x, y, z):
    return (x, -z, y)


def frente_cara(x, extra=0.0):
    """Qué tan adelante queda la cara a esa altura de x (la cabeza es un cubito redondeado)."""
    return 0.53 * (1 - np.clip(np.abs(x) / 0.68, 0, 0.999) ** 4) ** 0.25 + extra


def antifaz_heroe(p):
    """Antifaz de superhéroe (rojo, con los huecos para los ojos), pegadito a la cara del Súper Jabón."""
    import sdf

    def f(P):
        x, y, z = P[:, 0], P[:, 2], -P[:, 1]

        def elipse(cx, cy, rx, ry):
            return (np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) - 1) * min(rx, ry)
        ojos = np.minimum(elipse(-0.33, 0.5, 0.31, 0.24), elipse(0.33, 0.5, 0.31, 0.24))
        puente = np.maximum(np.abs(x) - 0.16, np.abs(y - 0.55) - 0.09)
        alas = np.minimum(elipse(-0.56, 0.62, 0.16, 0.09), elipse(0.56, 0.62, 0.16, 0.09))
        forma = sdf.smin(sdf.smin(ojos, puente, 0.05), alas, 0.06)
        huecos = np.minimum(elipse(-0.34, 0.49, 0.13, 0.155), elipse(0.34, 0.49, 0.13, 0.155))
        plano = np.maximum(forma, -huecos)
        capa = np.abs(z - frente_cara(x, 0.022)) - 0.02
        return sdf.smax(plano, capa, 0.012)
    p.add(sdf.to_mesh(p.nom(), f, (-0.78, -0.68, 0.2), (0.78, -0.25, 0.82), voxel=0.006, coll=p.coll, material=M('#E4392B', rough=0.45, coat=0.4)))
    # Los nudos y las colitas de atrás
    m = tela('#E4392B', '#FF8A80')
    for sx in (-1, 1):
        p.tubo([H(sx * 0.62, 0.6, 0.25), H(sx * 0.7, 0.62, -0.05), H(sx * 0.66, 0.6, -0.3)], 0.03, m, perfil=(1.6, 0.5), seg=8)
    p.blob(H(0, 0.62, -0.62), (0.07, 0.06, 0.06), m, n=8)
    for sx in (-1, 1):
        p.tubo([H(0, 0.62, -0.62), H(sx * 0.12, 0.45, -0.68), H(sx * 0.18, 0.3, -0.66)], [0.035, 0.02], m, perfil=(1.8, 0.5), seg=8)


def bigote_grueso(p, color='#3A2C25', rizado=False):
    """Bigote de verdad (el del clóset casi no se ve en el juego): frondoso de leñador o de manubrio de barbero."""
    import sdf
    m = M(color, rough=0.85, fuzz=0.5, pelusa='#6B5446')
    lados = []
    for sx in (-1, 1):
        if rizado:
            pts = [(0.0, 0.47), (0.1, 0.455), (0.19, 0.43), (0.25, 0.42), (0.28, 0.46), (0.255, 0.49)]
            rad = [0.04, 0.038, 0.03, 0.022, 0.016, 0.012]
        else:
            pts = [(0.0, 0.475), (0.09, 0.47), (0.17, 0.44), (0.23, 0.39), (0.25, 0.35)]
            rad = [0.058, 0.06, 0.052, 0.04, 0.026]
        puntos = [H(sx * x, y, frente_cara(x, 0.02)) for x, y in pts]
        lados.append(sdf.stroke(puntos, rad, samples=6))
    f = sdf.union(*lados, k=0.03)
    p.add(sdf.to_mesh(p.nom(), f, (-0.36, -0.68, 0.25), (0.36, -0.4, 0.58), voxel=0.005, coll=p.coll, material=m))


def rulos_cabeza(p):
    """Rulos de colores enrollados en el pelo de la estilista (arriba, atrás y a los lados), con sus pinzas."""
    colores = ['#F59AAE', '#7DB7E8', '#F7D046', '#B8A6F0', '#8ED8B0']
    # (punto del pelo en medidas de la cabeza, eje del rulo)
    sitios = [
        ((0.0, 1.5, 0.14), 'x'), ((0.0, 1.47, -0.22), 'x'), ((0.0, 1.3, -0.56), 'x'),
        ((-0.38, 1.41, 0.04), 'x'), ((0.38, 1.41, 0.04), 'x'), ((-0.36, 1.33, -0.38), 'x'), ((0.36, 1.33, -0.38), 'x'),
        ((-0.83, 1.08, -0.12), 'z'), ((0.83, 1.08, -0.12), 'z'), ((-0.81, 0.84, -0.34), 'z'), ((0.81, 0.84, -0.34), 'z'),
    ]
    rejilla = M('#FFFFFF', rough=0.4, coat=0.3)
    for k, ((x, y, z), eje) in enumerate(sitios):
        m = M(colores[k % len(colores)], 0.4, coat=0.35)
        largo = 0.15
        if eje == 'x':
            a, b = H(x - largo, y, z), H(x + largo, y, z)
        else:
            a, b = H(x, y, z + largo), H(x, y, z - largo)
        p.tubo([a, b], 0.09, m, seg=12, caps=('flat', 'flat'))
        # Los huequitos del rulo (aros más claros) y la pinza que lo sostiene
        for t in (0.25, 0.75):
            c = tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
            if eje == 'x':
                p.tubo([(c[0] - 0.012, c[1], c[2]), (c[0] + 0.012, c[1], c[2])], 0.095, rejilla, seg=12, caps=('flat', 'flat'))
            else:
                p.tubo([(c[0], c[1] - 0.012, c[2]), (c[0], c[1] + 0.012, c[2])], 0.095, rejilla, seg=12, caps=('flat', 'flat'))


def corona_guerrera(p):
    """Corona de la mejor guerrera de Dios: dorada, con corazones y perlitas, bien puesta encima del pelo."""
    k0 = len(p.objs)
    m = oro()
    r, alto = 0.36, 0.36
    p.torno([(r, 0), (r * 1.04, alto * 0.42), (r * 0.92, alto * 0.42), (r * 0.9, 0)], m, seg=28, tapas=(False, False))
    for k in range(7):
        a = k / 7 * TAU + math.pi / 2
        x, y = math.cos(a) * r, math.sin(a) * r
        p.blob((x, y, alto * 0.62), (r * 0.15, r * 0.15, alto * 0.34), m, n=6, shaper=lambda v: v * (1 - 0.7 * np.clip(v[:, 2:3], 0, 1)))
        p.blob((x * 1.02, y * 1.02, alto * 1.0), (0.032,) * 3, M('#FFF6E8', rough=0.2, coat=1.0), n=6)
    rubi = M('#E4395F', rough=0.12, coat=1.0)
    corazon(p, (0, -r * 1.02, alto * 0.24), 0.13, rubi, 0.5)
    for sx in (-1, 1):
        a = math.pi / 2 + sx * 0.9
        p.blob((math.cos(a) * r * 1.03, -abs(math.sin(a)) * r * 1.03, alto * 0.22), (0.035, 0.02, 0.035), M('#7DB7E8', rough=0.12, coat=1.0), n=6)
    p.girar(p.desde(k0), rx=-0.18)
    for o in p.desde(k0):
        o.location = (o.location[0], o.location[1] + 0.06, o.location[2] + 1.38)
    bpy.context.view_layer.update()


def toalla_mano(p):
    """La toalla mojada enrollada, colgando de la mano lista para el toallazo (el arma del panda)."""
    m = tela('#F39AB0', '#FFD1DC')
    r = tela('#FFFFFF')
    # (cuelga hacia afuera del cuerpo y un poquito adelante: la mano izquierda queda a -x)
    pts = [(0.0, -0.05, 0.16), (-0.03, -0.1, -0.02), (-0.1, -0.14, -0.2), (-0.2, -0.16, -0.33), (-0.33, -0.14, -0.4), (-0.44, -0.1, -0.37)]
    p.tubo(pts, [0.065, 0.07, 0.065, 0.06, 0.055, 0.05], m, perfil=(1.3, 0.85), seg=12)
    # Rayas blancas de la toalla, enrolladas
    for (x, y, z) in [(-0.07, -0.125, -0.12), (-0.15, -0.155, -0.27), (-0.26, -0.155, -0.37)]:
        p.blob((x, y, z), (0.055, 0.078, 0.028), r, n=8)
    # Flecos y gotas
    for j in range(5):
        p.tubo([(-0.44, -0.1, -0.4 + j * 0.02), (-0.51, -0.1 + (j - 2) * 0.012, -0.42 + j * 0.025)], 0.011, m, seg=5)
    gotas(p, (-0.36, -0.16, -0.6), 3, 0.03)
    gotas(p, (-0.12, -0.18, -0.42), 2, 0.025)


# ----------------------------------------------------------------------------------------------------- Catálogo
ICONOS = {
    # Armas
    'toalla': lambda p: toalla(p), 'toallazo': lambda p: toalla(p, '#E4392B', '#FFD45C', caliente=True),
    'burbujas': lambda p: varita(p), 'burbujero': lambda p: varita(p, dorada=True),
    'cepillo': lambda p: cepillo(p), 'milCerdas': mil_cerdas,
    'champu': lambda p: champu(p), 'remolino': remolino,
    'peinilla': lambda p: peinilla(p), 'peinillaOro': lambda p: peinilla(p, dorada=True),
    'esponjas': lambda p: esponja(p), 'esponjasEternas': lambda p: esponja(p, eterna=True),
    'secador': lambda p: secador(p), 'secadorInfernal': lambda p: secador(p, infernal=True),
    'espuma': lambda p: espuma(p), 'espumaDevoradora': lambda p: espuma(p, devoradora=True),
    'botellas': lambda p: botella_agua(p), 'inundacion': lambda p: botella_agua(p, inundacion=True),
    'jabon': lambda p: jabon(p), 'jabonExplosivo': lambda p: jabon(p, '#FF8A3D', explosivo=True),
    'bombillo': lambda p: bombillo(p), 'tormenta': lambda p: bombillo(p, tormenta=True),
    'toallita': toallita, 'lunaDeMiel': luna_de_miel,
    'patoAmarillo': lambda p: pato(p), 'patoMorado': lambda p: pato(p, '#9C6BD6', '#F29B38'), 'patosEnamorados': patos_enamorados,
    'ranitas': lambda p: rana(p), 'ranaGlotona': lambda p: rana(p, glotona=True),
    'ducha': lambda p: ducha(p), 'diluvio': lambda p: ducha(p, diluvio=True),
    'hilo': lambda p: hilo(p), 'hiloSeda': lambda p: hilo(p, seda=True),
    'perfume': lambda p: perfume(p), 'colonia': lambda p: perfume(p, '#7DB7E8', '#3E5A98', alto=0.55),
    'perfumeAmor': lambda p: perfume(p, '#E86A8A', '#F2C14E', corazon_forma=True),
    # Pasivas
    'jabonFuerte': jabon_fuerte, 'gorro': gorro_bano, 'crema': lambda p: frasco_crema(p),
    'cremaNoche': lambda p: frasco_crema(p, '#C9B6EA', '#5E4FA8', 'luna'), 'relojArena': reloj_arena, 'lupa': lupa, 'liga': liga,
    'sales': sales, 'espejoDoble': espejo_doble, 'pantuflas': pantuflas, 'iman': iman, 'trebol': lambda p: trebol(p),
    'corona': corona_espuma, 'alcancia': alcancia, 'espejoRoto': lambda p: espejo_mano(p, '#6B5A48', roto=True), 'curita': curita,
    # Tienda
    'tirar': dado, 'saltar': flecha, 'vetar': tachar,
    # Del piso
    'arepa': arepa, 'ola': balde, 'hielo': cubo_hielo, 'aspiradora': aspiradora, 'moneda': moneda, 'bolsa': bolsa, 'frasco': frasco_oro,
    'trebolito': lambda p: trebol(p, 0.7), 'aji': aji, 'cofre': lambda p: cofre(p), 'cofreAbierto': lambda p: cofre(p, abierto=True),
    'gemaAzul': lambda p: gema(p, '#5AB4F0'), 'gemaVerde': lambda p: gema(p, '#5DCB7A'), 'gemaRoja': lambda p: gema(p, '#F0566B'),
    'gemaGrande': lambda p: gema(p, '#FF3D6A', 0.24),
    'velita': velita, 'vasoCepillos': vaso_cepillos, 'velaFlotante': vela_flotante,
}

ACCESORIOS = {
    'toalla_hombro': toalla_hombro, 'espuma_cabeza': espuma_cabeza, 'cepillo_mano': lambda p: cepillo(p), 'espejo_frente': espejo_frente,
    'jabon_pecho': lambda p: jabon(p), 'champu_mano': lambda p: champu(p), 'casco_burbuja': casco_burbuja, 'casco_bombero': casco_bombero,
    'manguera': manguera, 'hilo_mano': lambda p: hilo(p), 'varita_mano': lambda p: varita(p), 'escudo': escudo,
    'perfume_mano': lambda p: perfume(p, '#D6336C'), 'turbante': turbante, 'patico_mano': lambda p: pato(p), 'ranita_cabeza': lambda p: rana(p),
    'esponja_mano': lambda p: esponja(p), 'secador_mano': lambda p: secador(p), 'rulos': rulos,
    'antifaz_heroe': antifaz_heroe, 'bigote_lenador': lambda p: bigote_grueso(p), 'bigote_barbero': lambda p: bigote_grueso(p, '#2E2420', rizado=True),
    'rulos_cabeza': rulos_cabeza, 'corona_guerrera': corona_guerrera, 'toalla_mano': toalla_mano,
}


def preparar(scene):
    global BRILLO
    BRILLO = M('#FFFFFF', rough=0.1, emision=2.5, ruido=0.0)
    luces = clay.collection('Luces objetos')
    escena.area_light('Clave', (-2.4, -3.2, 4.0), (0, 0, 0.3), 480, 2.4, '#FFF1E2', luces)
    escena.area_light('Relleno', (3.0, -2.2, 1.8), (0, 0, 0.3), 160, 3.0, '#E4F0FF', luces)
    escena.area_light('Contraluz', (1.0, 3.0, 3.2), (0, 0, 0.5), 380, 2.0, '#FFE0EC', luces)
    escena.world_color(scene, '#FFFFFF', 0.4)
    try:
        scene.view_settings.look = 'AgX - Punchy'
    except TypeError:
        scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = float(os.environ.get('EXPOSICION', -0.15))


def iconos(salida, pedidos):
    scene = bpy.context.scene
    os.makedirs(salida, exist_ok=True)
    elev = math.radians(26)
    for n in pedidos:
        p = Pieza(n)
        ICONOS[n](p)
        objs = [o for o in p.objs if not o.hide_render]
        # 3/4: girado un poquito
        p.girar(objs, rz=-0.38)
        bpy.context.view_layer.update()
        d = Vector((0, -math.cos(elev), math.sin(elev)))
        arriba = Vector((0, math.sin(elev), math.cos(elev)))
        derecha = Vector((1, 0, 0))
        us, vs = [], []
        for o in objs:
            for c in o.bound_box:
                q = o.matrix_world @ Vector(c)
                us.append(q.dot(derecha))
                vs.append(q.dot(arriba))
        u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
        tam = max(u1 - u0, v1 - v0) * 1.12
        centro = derecha * (u0 + u1) / 2 + arriba * (v0 + v1) / 2
        cam = escena.camera(f'Cam {n}', tuple(centro + d * 12), tuple(centro), 50)
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = tam
        scene.camera = cam
        scene.render.filepath = os.path.join(salida, f'{n}.png')
        bpy.ops.render.render(write_still=True)
        for o in list(p.coll.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.objects.remove(cam, do_unlink=True)
        print('ICONO', n, flush=True)


def accesorios(ruta):
    """Exporta los accesorios de los disfraces a un GLB (cada uno como un nodo raíz con su nombre)."""
    raices = []
    for n, fn in ACCESORIOS.items():
        p = Pieza(n)
        fn(p)
        objs = [o for o in p.objs if not o.hide_render]
        for o in objs:
            if o.modifiers:
                clay.apply_modifiers(o)
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
        j = bpy.context.view_layer.objects.active
        j.name = n
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        raices.append(j)
        for o in list(p.coll.objects):
            if o not in raices:
                bpy.data.objects.remove(o, do_unlink=True)
    # Materiales sencillos para el juego: color base, rugosidad y metal (sin nodos de relieve)
    for o in raices:
        for slot in o.material_slots:
            m = slot.material
            if not m or not m.node_tree:
                continue
            b = next((x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED'), None)
            if b is None:
                continue
            for l in list(m.node_tree.links):
                if l.to_node == b and l.to_socket.name in ('Base Color', 'Normal'):
                    m.node_tree.links.remove(l)
    bpy.ops.object.select_all(action='DESELECT')
    for o in raices:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=ruta, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
    print('ACCESORIOS', len(raices), flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    modo = args[0] if args else 'iconos'
    scene = clay.reset_scene()
    escena.setup_render(scene, 160, 160, samples=int(os.environ.get('MUESTRAS', 24)), transparent=True)
    scene.cycles.transmission_bounces = 6
    preparar(scene)
    if modo == 'iconos':
        salida = args[1] if len(args) > 1 else '/tmp/lavado_iconos'
        pedidos = args[2].split(',') if len(args) > 2 else list(ICONOS)
        iconos(salida, pedidos)
    else:
        accesorios(args[1] if len(args) > 1 else '/tmp/accesorios.glb')
