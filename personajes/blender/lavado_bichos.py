"""Los mugrosos de «Lavarse la cara» (el Vampire Survivors del baño): gérmenes, puntos negros, grasa, granitos,
ácaros, caspa, bacterias, pelusas, virus, barritos, lagañas, mugre, mocos, sarro, pasta seca, hongos, cucarachas,
pelos, moho, jabón sucio, piojos, zancudos, pulgas, burbujas sucias, babosas, espinillas, los jefes y la Ducha
Helada. Todo en plastilina con fieltro (clay.py), con carita exagerada.

Cada bicho se arma con piezas en grupos para sacar cuatro cuadros del mismo modelo:
  0 normal · 1 paso (patas/alas/pelitos al otro lado) · 2 parpadeo · 3 golpe (ojos > < y boca abierta).

Uso (dibuja los PNG de cada cuadro):
  blender -b -P personajes/blender/lavado_bichos.py -- <carpeta_salida> [bicho1,bicho2,...]
Después scripts/lavado-atlas.py los junta en el atlas del juego.
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
# La cámara del sprite: de frente y un poco desde arriba (como la del juego, pero viendo bien la carita)
ELEVACION = math.radians(30)

# ----------------------------------------------------------------------------------------------------- Materiales
_mats = {}


def fieltro(color, pelusa=None, rough=0.78, sss=0.06, fuzz=0.5, escala=90, brillo=0.0):
    """Fieltro de plastilina con motas de fibra (el estilo de los personajes)."""
    clave = (color, pelusa, rough, sss, fuzz, escala, brillo)
    if clave in _mats:
        return _mats[clave]
    m = clay.material(f'Fieltro {color} {len(_mats)}', color, rough=rough, sss=sss, sss_radius=(1.0, 0.5, 0.35), sss_scale=0.05,
                      sheen=0.35, sheen_rough=0.5, coat=brillo, coat_rough=0.25,
                      fuzz=dict(scale=escala, color=pelusa or color, amount=fuzz, strength=0.35, dark=0.62))
    _mats[clave] = m
    return m


def brillante(color, rough=0.25, coat=0.6, sss=0.15, transmision=0.0):
    clave = ('b', color, rough, coat, sss, transmision)
    if clave in _mats:
        return _mats[clave]
    m = clay.material(f'Brillante {color} {len(_mats)}', color, rough=rough, coat=coat, coat_rough=0.08, sss=sss, sss_scale=0.05,
                      transmission=transmision, noise=dict(scale=40, strength=0.08, detail=3, distance=0.004))
    _mats[clave] = m
    return m


def plano(color, rough=0.4, emision=0.0):
    clave = ('p', color, rough, emision)
    if clave in _mats:
        return _mats[clave]
    m = clay.material(f'Plano {color} {len(_mats)}', color, rough=rough, coat=0.3, coat_rough=0.1,
                      emission=color if emision else None, emission_strength=emision)
    _mats[clave] = m
    return m


BLANCO_OJO = None
NEGRO = None
BRILLO = None
BOCA = None
LENGUA = None
DIENTE = None
ROSADO = None


def materiales_base():
    global BLANCO_OJO, NEGRO, BRILLO, BOCA, LENGUA, DIENTE, ROSADO
    BLANCO_OJO = plano('#FFFDF8', 0.3)
    NEGRO = plano('#1E1514', 0.15)
    BRILLO = plano('#FFFFFF', 0.1, emision=2.0)
    BOCA = plano('#4A1E25', 0.5)
    LENGUA = fieltro('#F07A8E', '#FFB3C0', rough=0.6, fuzz=0.3)
    DIENTE = plano('#FFFBF2', 0.35)
    ROSADO = fieltro('#F59AAE', '#FFC9D4', rough=0.7, fuzz=0.3)


# ----------------------------------------------------------------------------------------------------- El bicho
class Bicho:
    """Piezas de un bicho repartidas en grupos (para los cuatro cuadros)."""

    GRUPOS = ('base', 'abiertos', 'cerrados', 'golpe', 'boca', 'bocaGolpe', 'pasoA', 'pasoB')

    def __init__(self, nombre):
        self.nombre = nombre
        self.coll = clay.collection(f'Bicho {nombre}')
        self.g = {k: [] for k in self.GRUPOS}
        self.n = 0
        self.cuerpo = []
        self._surf = None

    def nom(self):
        self.n += 1
        return f'{self.nombre} {self.n}'

    def add(self, obj, grupo='base'):
        if obj is not None:
            self.g[grupo].append(obj)
        return obj

    def blob(self, centro, radios, mat, grupo='base', n=10, p=2.0, shaper=None, subsurf=1, cuerpo=False):
        o = clay.blob(self.nom(), centro, radios, self.coll, mat, n=n, p=p, shaper=shaper, subsurf=subsurf)
        if cuerpo:
            self.cuerpo.append(o)
            self._surf = None
        return self.add(o, grupo)

    def tubo(self, puntos, radio, mat, grupo='base', caps=('round', 'round'), segmentos=10, subsurf=1, perfil=(1.0, 1.0)):
        o = clay.sweep(self.nom(), [tuple(map(float, p)) for p in puntos], radius=radio, profile=perfil, coll=self.coll, material=mat,
                       segments=segmentos, samples=6, caps=caps, subsurf=subsurf)
        return self.add(o, grupo)

    def torno(self, perfil, mat, grupo='base', segmentos=28, subsurf=1):
        o = clay.lathe(self.nom(), perfil, self.coll, mat, segments=segmentos, subsurf=subsurf)
        return self.add(o, grupo)

    @property
    def surf(self):
        if self._surf is None:
            bpy.context.view_layer.update()
            self._surf = clay.Surface(self.cuerpo)
        return self._surf

    def frente(self, x, z, lift=0.0):
        """Punto de la superficie del cuerpo visto de frente (x, z) y su normal."""
        p, nrm = self.surf.front(x, z)
        if p is None:
            return np.array([x, -0.3, z]), np.array([0, -1.0, 0])
        return p + nrm * lift, nrm

    def trazo_frente(self, xz, lift):
        return [self.frente(x, z, lift)[0] for x, z in xz]

    def todos(self):
        return [o for k in self.GRUPOS for o in self.g[k]]


def orientado(b, radios, mat, punto, normal, grupo, n=8, lift=0.0, girar=0.0):
    """Un blob aplanado pegado a la superficie (construido en el origen y luego movido: la trampa conocida)."""
    o = clay.blob(b.nom(), (0, 0, 0), radios, b.coll, mat, n=n, subsurf=1)
    clay.orient_to(o, normal)
    if girar:
        o.rotation_mode = 'XYZ'
        o.rotation_euler.rotate_axis('Y', girar)
    o.location = Vector(punto) + Vector(normal) * lift
    return b.add(o, grupo)


# ----------------------------------------------------------------------------------------------------- Caritas
def ojos(b, x, z, r, sep=None, estilo='redondo', bravo=False, pupila=0.56, mirar=(0.0, -0.15), triste=False, uno=False, cejas=True,
         grosor_ceja=None, color_ceja='#1E1514'):
    """Dos ojos (o uno) con pupila, brillo, y sus versiones cerrada y de golpe."""
    sep = sep if sep is not None else r * 1.25
    xs = [x] if uno else [x - sep, x + sep]
    ceja = plano(color_ceja, 0.4) if color_ceja != '#1E1514' else NEGRO
    for i, ox in enumerate(xs):
        lado = -1 if (i == 0 and not uno) else 1
        p, nrm = b.frente(ox, z)
        alto = r * (1.18 if estilo != 'dormilon' else 0.7)
        orientado(b, (r, r * 0.42, alto), BLANCO_OJO, p, nrm, 'abiertos', lift=r * 0.12)
        pp = p + nrm * r * 0.42 + np.array([mirar[0] * r, 0, mirar[1] * r])
        if estilo == 'loco' and i == 1:
            pp = pp + np.array([r * 0.25, 0, r * 0.25])
        orientado(b, (r * pupila, r * 0.3, r * pupila * (1.12 if estilo != 'dormilon' else 0.8)), NEGRO, pp, nrm, 'abiertos', lift=r * 0.05)
        orientado(b, (r * 0.17, r * 0.12, r * 0.17), BRILLO, pp + np.array([-r * 0.18, 0, r * 0.26]), nrm, 'abiertos', lift=r * 0.28)
        orientado(b, (r * 0.08, r * 0.08, r * 0.08), BRILLO, pp + np.array([r * 0.2, 0, -r * 0.18]), nrm, 'abiertos', lift=r * 0.28)
        if estilo == 'dormilon':
            # Párpado a media asta
            orientado(b, (r * 1.04, r * 0.46, r * 0.42), fieltro('#B98A7A'), p + np.array([0, 0, r * 0.38]), nrm, 'abiertos', lift=r * 0.2)
        # Cerrado: una rayita curva
        arco = [(ox + r * t, z - r * 0.15 * (1 - t * t) * (1 if not triste else -1)) for t in np.linspace(-0.95, 0.95, 5)]
        b.tubo(b.trazo_frente(arco, r * 0.18), r * 0.12, NEGRO, 'cerrados')
        # Golpe: > <
        s = lado
        g1 = [(ox - s * r * 0.75, z + r * 0.55), (ox + s * r * 0.55, z), (ox - s * r * 0.75, z - r * 0.55)]
        b.tubo(b.trazo_frente(g1, r * 0.18), r * 0.13, NEGRO, 'golpe')
        if cejas and (bravo or triste):
            inc = 0.38 if bravo else -0.32
            c = [(ox - r * 0.85, z + alto * 1.15 + (-inc * r * lado)), (ox + r * 0.85, z + alto * 1.15 + (inc * r * lado))]
            gc = grosor_ceja or r * 0.2
            for grupo in ('abiertos', 'cerrados'):
                b.tubo(b.trazo_frente(c, r * 0.22), gc, ceja, grupo)
        # Cejas de susto en el golpe
        if cejas:
            c = [(ox - r * 0.8, z + alto * 1.25 - r * 0.2 * lado), (ox + r * 0.8, z + alto * 1.25 + r * 0.2 * lado)]
            b.tubo(b.trazo_frente(c, r * 0.22), grosor_ceja or r * 0.18, ceja, 'golpe')


def boca(b, x, z, w, estilo='sonrisa', grosor=None):
    """Boca normal (sonrisa, brava, colmillos, dientes, «o») y la de golpe (abierta con lengua)."""
    g = grosor or w * 0.13
    if estilo in ('sonrisa', 'brava', 'triste', 'ladeada'):
        k = {'sonrisa': 0.35, 'brava': -0.25, 'triste': -0.3, 'ladeada': 0.2}[estilo]
        pts = [(x + w * t, z - w * k * (1 - t * t) + (w * 0.15 * t if estilo == 'ladeada' else 0)) for t in np.linspace(-1, 1, 7)]
        b.tubo(b.trazo_frente(pts, g * 0.9), g, BOCA, 'boca')
    elif estilo in ('colmillos', 'dientes', 'grande'):
        p, nrm = b.frente(x, z)
        orientado(b, (w, w * 0.3, w * (0.55 if estilo != 'grande' else 0.75)), BOCA, p, nrm, 'boca', lift=w * 0.02)
        if estilo == 'colmillos':
            for s in (-1, 1):
                q, nq = b.frente(x + s * w * 0.5, z + w * 0.32)
                o = clay.blob(b.nom(), (0, 0, 0), (w * 0.17, w * 0.12, w * 0.3), b.coll, DIENTE, n=6, subsurf=1,
                              shaper=lambda v: v * np.array([1, 1, 1]) * (1 - 0.5 * (v[:, 2:3] < 0) * (np.abs(v[:, 2:3]))))
                clay.orient_to(o, nq)
                o.location = Vector(q + nq * w * 0.2 - np.array([0, 0, w * 0.18]))
                b.add(o, 'boca')
        elif estilo == 'dientes':
            for t in np.linspace(-0.6, 0.6, 4):
                q, nq = b.frente(x + w * t, z + w * 0.2)
                orientado(b, (w * 0.17, w * 0.12, w * 0.18), DIENTE, q, nq, 'boca', lift=w * 0.16)
        else:
            q, nq = b.frente(x, z - w * 0.25)
            orientado(b, (w * 0.55, w * 0.2, w * 0.3), LENGUA, q, nq, 'boca', lift=w * 0.12)
    elif estilo == 'o':
        p, nrm = b.frente(x, z)
        orientado(b, (w * 0.42, w * 0.2, w * 0.5), BOCA, p, nrm, 'boca', lift=w * 0.03)
    # Golpe: abierta con lengua
    p, nrm = b.frente(x, z - w * 0.05)
    orientado(b, (w * 0.75, w * 0.3, w * 0.62), BOCA, p, nrm, 'bocaGolpe', lift=w * 0.03)
    q, nq = b.frente(x, z - w * 0.35)
    orientado(b, (w * 0.45, w * 0.2, w * 0.25), LENGUA, q, nq, 'bocaGolpe', lift=w * 0.14)


def cachetes(b, x, z, sep, r, color='#F59AAE'):
    m = fieltro(color, '#FFC9D4', rough=0.7, fuzz=0.3)
    for s in (-1, 1):
        p, nrm = b.frente(x + s * sep, z)
        orientado(b, (r, r * 0.25, r * 0.62), m, p, nrm, 'base', lift=r * 0.02)


def manchas(b, puntos, r, color):
    m = fieltro(color, rough=0.7, fuzz=0.3)
    for (x, z, k) in puntos:
        p, nrm = b.frente(x, z)
        orientado(b, (r * k, r * 0.25 * k, r * k), m, p, nrm, 'base', lift=0.0)


def corona(b, centro, r, alto, color='#F2C14E', joyas=('#E86A8A', '#7DB7E8')):
    """Corona de rey (para los jefes)."""
    oro = clay.material('Oro corona', color, rough=0.25, metallic=0.75, coat=0.4,
                        noise=dict(scale=50, strength=0.15, detail=4, distance=0.004))
    cx, cy, cz = centro
    perfil = [(r * 0.98, 0), (r, alto * 0.08), (r * 1.02, alto * 0.45), (r * 0.98, alto * 0.5), (r * 0.94, alto * 0.08), (r * 0.9, 0.0)]
    o = clay.lathe(b.nom(), perfil, b.coll, oro, segments=32, subsurf=1, cap_bottom=False, cap_top=False)
    o.location = (cx, cy, cz)
    b.add(o)
    for k in range(6):
        a = k / 6 * TAU + math.pi / 2
        px, py = cx + math.cos(a) * r * 0.97, cy + math.sin(a) * r * 0.97
        pico = clay.blob(b.nom(), (0, 0, 0), (r * 0.18, r * 0.18, alto * 0.42), b.coll, oro, n=6, subsurf=1,
                         shaper=lambda v: v * np.array([1, 1, 1]) * (1 - 0.75 * np.clip(v[:, 2:3], 0, 1)))
        pico.location = (px, py, cz + alto * 0.62)
        b.add(pico)
        bola = clay.blob(b.nom(), (px, py, cz + alto * 1.05), (r * 0.09,) * 3, b.coll, oro, n=6, subsurf=1)
        b.add(bola)
        gema = clay.blob(b.nom(), (0, 0, 0), (r * 0.1, r * 0.06, r * 0.1), b.coll, brillante(joyas[k % 2]), n=6, subsurf=1)
        clay.orient_to(gema, (math.cos(a + 0.5), math.sin(a + 0.5), 0))
        gema.location = (cx + math.cos(a + 0.52) * r * 1.03, cy + math.sin(a + 0.52) * r * 1.03, cz + alto * 0.26)
        b.add(gema)


def patas(b, n, centro, rx, ry, z0, largo, grosor, mat, rodilla=0.35, abertura=1.0, frente=0.0):
    """Patitas a los lados (como de bicho), en dos posiciones para el paso."""
    cx, cy = centro[0], centro[1]
    por_lado = n // 2
    for s in (-1, 1):
        for k in range(por_lado):
            t = (k + 0.5) / por_lado
            ang = (t - 0.5) * 1.6 * abertura
            ax = cx + s * rx * 0.85 * math.cos(ang)
            ay = cy + ry * 0.85 * math.sin(ang) + frente
            for grupo, fase in (('pasoA', 1), ('pasoB', -1)):
                osc = fase * (1 if k % 2 == 0 else -1) * largo * 0.18
                pie = (ax + s * largo * 0.85, ay + math.sin(ang) * largo * 0.6 + osc, 0.0)
                rod = (ax + s * largo * 0.55, ay + math.sin(ang) * largo * 0.35 + osc * 0.5, z0 + largo * rodilla + (0.03 if (k + (fase > 0)) % 2 else 0))
                b.tubo([(ax, ay, z0), rod, pie], grosor, mat, grupo, segmentos=8, caps=('round', 'round'))
                b.blob(pie, (grosor * 1.5, grosor * 1.8, grosor * 1.1), mat, grupo, n=6)


def pelitos(b, n, centro, r, largo, grosor, mat, z_min=-0.2, bola=True, ondas=0.25, mat_bola=None):
    """Pelitos / cilios alrededor de la silueta (en dos posiciones)."""
    cx, cy, cz = centro
    for k in range(n):
        a = k / n * TAU
        el = z_min + (1 - z_min) * ((k * 0.618) % 1)
        d = np.array([math.cos(a) * math.sqrt(max(0, 1 - el * el)), math.sin(a) * math.sqrt(max(0, 1 - el * el)) * 0.6 + 0.2, el])
        d /= np.linalg.norm(d)
        base = np.array(centro) + d * r * 0.92
        for grupo, s in (('pasoA', 1), ('pasoB', -1)):
            lado = np.cross(d, [0, 0, 1]) if abs(d[2]) < 0.95 else np.array([1, 0, 0])
            lado = lado / (np.linalg.norm(lado) or 1)
            medio = base + d * largo * 0.55 + lado * largo * ondas * s
            punta = base + d * largo + lado * largo * ondas * 0.4 * -s
            b.tubo([base, medio, punta], grosor, mat, grupo, segmentos=6, caps=('round', 'point' if not bola else 'round'))
            if bola:
                b.blob(tuple(punta), (grosor * 1.7,) * 3, mat_bola or mat, grupo, n=6)


def antenas(b, base_pts, largo, grosor, mat, bola_mat=None, curva=0.3):
    for (x, y, z), s in zip(base_pts, (-1, 1)):
        for grupo, f in (('pasoA', 1), ('pasoB', -1)):
            p1 = (x + s * largo * 0.25, y - largo * 0.1, z + largo * 0.5)
            p2 = (x + s * largo * (0.45 + curva * 0.3 * f), y - largo * 0.25, z + largo * 0.95)
            b.tubo([(x, y, z), p1, p2], grosor, mat, grupo, segmentos=6)
            if bola_mat is not None:
                b.blob(p2, (grosor * 2.4,) * 3, bola_mat, grupo, n=6)


def alas(b, centro, tam, color='#DDEFFF', angulo=0.5, lado_x=0.3):
    """Alitas transparentes que aletean (arriba en un cuadro, abajo en el otro)."""
    m = clay.material('Ala', color, rough=0.12, transmission=0.7, coat=0.6, alpha=0.75,
                      noise=dict(scale=30, strength=0.05, detail=2, distance=0.003))
    m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
    for grupo, a in (('pasoA', angulo), ('pasoB', -angulo * 0.4)):
        for s in (-1, 1):
            o = clay.blob(b.nom(), (0, 0, 0), (tam, tam * 0.08, tam * 0.45), b.coll, m, n=8, subsurf=1)
            o.rotation_euler = (0, s * -a, s * 0.25)
            o.location = (centro[0] + s * (lado_x + tam * 0.75 * math.cos(a)), centro[1] + 0.1, centro[2] + tam * 0.6 * math.sin(a))
            b.add(o, grupo)


# ----------------------------------------------------------------------------------------------------- Los bichos
def b_germen(b):
    m = fieltro('#7CCF6B', '#C2F5A8', fuzz=0.6)
    b.blob((0, 0, 0.5), (0.46, 0.44, 0.44), m, cuerpo=True, n=12)
    pelitos(b, 18, (0, 0, 0.5), 0.46, 0.2, 0.035, m, z_min=-0.5, mat_bola=fieltro('#5DB54E', '#A6E78C'))
    manchas(b, [(-0.25, 0.32, 1), (0.3, 0.7, 0.7), (0.32, 0.3, 0.55)], 0.07, '#5DB54E')
    ojos(b, 0, 0.58, 0.12, sep=0.17, mirar=(0.0, -0.1))
    boca(b, 0, 0.36, 0.13, 'sonrisa')
    cachetes(b, 0, 0.44, 0.27, 0.06)


def b_punto_negro(b):
    m = fieltro('#3A2B2E', '#6B5458', fuzz=0.55, brillo=0.25)
    b.blob((0, 0, 0.42), (0.44, 0.4, 0.42), m, cuerpo=True, n=12, shaper=lambda v: v * (1 + 0.06 * np.sin(v[:, 0:1] * 9) * np.sin(v[:, 2:3] * 7)))
    # Puntitos de grasa en la piel negra
    manchas(b, [(-0.22, 0.62, 1), (0.15, 0.68, 0.8), (0.3, 0.45, 0.7), (-0.32, 0.25, 0.6)], 0.035, '#6B5458')
    ojos(b, 0, 0.5, 0.12, sep=0.16, bravo=True, mirar=(0.05, -0.15))
    boca(b, 0, 0.27, 0.12, 'brava')
    patas(b, 2, (0, 0), 0.22, 0.1, 0.12, 0.12, 0.05, m, rodilla=0.6, abertura=0.2)


def b_gota_grasa(b):
    m = brillante('#F7C948', rough=0.18, coat=0.9, sss=0.3)
    b.blob((0, 0, 0.42), (0.36, 0.34, 0.5), m, cuerpo=True, n=12,
           shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.55 * np.clip(v[:, 2], 0, 1) ** 1.5), v[:, 1] * (1 - 0.55 * np.clip(v[:, 2], 0, 1) ** 1.5), v[:, 2] * 1.0 + 0.25 * np.clip(v[:, 2], 0, 1) ** 2]))
    # Brillo de grasa
    b.blob((-0.13, -0.27, 0.6), (0.06, 0.03, 0.12), BRILLO, n=6)
    ojos(b, 0, 0.42, 0.105, sep=0.14, mirar=(0, -0.2))
    boca(b, 0, 0.24, 0.1, 'sonrisa')
    # Goticas que gotea (en el paso cambian)
    b.blob((0.25, -0.05, 0.08), (0.05, 0.05, 0.07), m, 'pasoA', n=6)
    b.blob((-0.22, 0.05, 0.12), (0.04, 0.04, 0.06), m, 'pasoB', n=6)


def b_acaro(b):
    m = fieltro('#C9B9A6', '#F2E7D8', fuzz=0.65)
    b.blob((0, 0.05, 0.33), (0.38, 0.4, 0.3), m, cuerpo=True, n=12)
    b.blob((0, -0.25, 0.4), (0.22, 0.2, 0.2), m, cuerpo=True, n=10)
    patas(b, 8, (0, 0.05), 0.36, 0.36, 0.25, 0.28, 0.035, fieltro('#A6927C', '#D9C8B4'), rodilla=0.8)
    pelitos(b, 10, (0, 0.05, 0.33), 0.36, 0.1, 0.012, fieltro('#8A7A68'), z_min=0.2, bola=False, ondas=0.1)
    ojos(b, 0, 0.47, 0.085, sep=0.1, bravo=True, mirar=(0, -0.1))
    boca(b, 0, 0.33, 0.08, 'colmillos')


def b_granito(b):
    m = fieltro('#F08A7C', '#FFC2B8', fuzz=0.45, sss=0.15)
    b.blob((0, 0, 0.36), (0.52, 0.46, 0.38), m, cuerpo=True, n=12)
    pus = brillante('#FFF6D8', rough=0.3, coat=0.5, sss=0.4)
    b.blob((0, 0.02, 0.72), (0.2, 0.2, 0.16), pus, n=10)
    b.blob((-0.06, -0.08, 0.8), (0.05, 0.03, 0.04), BRILLO, n=6)
    # Enrojecido alrededor
    b.blob((0, 0.02, 0.66), (0.29, 0.29, 0.07), fieltro('#E2584E', '#FF9A90'), n=10)
    ojos(b, 0, 0.42, 0.11, sep=0.18, bravo=False, mirar=(0, -0.15))
    boca(b, 0, 0.22, 0.13, 'sonrisa')
    cachetes(b, 0, 0.3, 0.33, 0.07, '#E2584E')
    patas(b, 2, (0, 0), 0.28, 0.1, 0.1, 0.1, 0.06, m, rodilla=0.5, abertura=0.2)


def b_caspa(b):
    m = fieltro('#F4F1EA', '#FFFFFF', fuzz=0.7, rough=0.85)
    # Copo plano con puntas, flotando
    b.blob((0, 0, 0.5), (0.42, 0.14, 0.38), m, cuerpo=True, n=12,
           shaper=lambda v: v * (1 + 0.18 * np.cos(np.arctan2(v[:, 2:3], v[:, 0:1]) * 6)))
    for k in range(6):
        a = k / 6 * TAU
        for grupo, s in (('pasoA', 1), ('pasoB', 1.15)):
            b.blob((math.cos(a) * 0.4 * s, 0.02, 0.5 + math.sin(a) * 0.36 * s), (0.06, 0.05, 0.06), m, grupo, n=6)
    ojos(b, 0, 0.55, 0.1, sep=0.14, mirar=(0, -0.1), estilo='dormilon')
    boca(b, 0, 0.36, 0.09, 'o')
    cachetes(b, 0, 0.45, 0.24, 0.05)


def b_bacteria(b):
    m = fieltro('#5AA6E0', '#A9D8FF', fuzz=0.55)
    # Bacilo acostado (cápsula) que se mueve como gusanito
    for grupo, curva in (('base', 0),):
        pass
    b.tubo([(-0.42, 0.05, 0.32), (-0.1, -0.02, 0.36), (0.2, 0.0, 0.34), (0.42, 0.06, 0.3)], 0.27, m, 'base', segmentos=16, subsurf=2)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    # Rayitas por dentro y flagelos
    for k, x in enumerate((-0.3, -0.05, 0.2)):
        p, nrm = b.frente(x, 0.5)
        orientado(b, (0.05, 0.02, 0.08), fieltro('#3D7FBD'), p, nrm, 'base')
    for grupo, s in (('pasoA', 1), ('pasoB', -1)):
        b.tubo([(0.55, 0.1, 0.3), (0.72, 0.12, 0.3 + 0.1 * s), (0.86, 0.12, 0.26 - 0.08 * s), (0.98, 0.12, 0.32)], 0.025, m, grupo, segmentos=6)
        b.tubo([(-0.55, 0.1, 0.3), (-0.72, 0.12, 0.3 - 0.1 * s), (-0.86, 0.12, 0.27 + 0.08 * s)], 0.025, m, grupo, segmentos=6)
    ojos(b, -0.18, 0.4, 0.1, sep=0.13, bravo=True, mirar=(-0.1, -0.1))
    boca(b, 0.12, 0.28, 0.1, 'dientes')


def b_pelusa(b):
    m = fieltro('#A9A4B2', '#E3E0EA', fuzz=0.85, escala=140)
    for (x, y, z, r) in [(0, 0, 0.42, 0.4), (-0.25, 0.05, 0.32, 0.25), (0.27, 0.05, 0.34, 0.24), (0.05, 0.08, 0.7, 0.24), (-0.18, 0.0, 0.6, 0.2), (0.22, 0.05, 0.6, 0.19)]:
        b.blob((x, y, z), (r, r * 0.9, r), m, cuerpo=True, n=10)
    pelitos(b, 26, (0, 0, 0.45), 0.42, 0.16, 0.012, fieltro('#8E899A'), z_min=-0.3, bola=False, ondas=0.4)
    ojos(b, 0, 0.47, 0.11, sep=0.15, mirar=(0, -0.1), triste=True)
    boca(b, 0, 0.29, 0.09, 'ladeada')


def b_virus(b):
    m = fieltro('#B56BD6', '#E4B8FF', fuzz=0.5)
    b.blob((0, 0, 0.45), (0.38, 0.36, 0.38), m, cuerpo=True, n=12)
    pin = fieltro('#F2B84E', '#FFE2A0')
    for k in range(14):
        a = k / 14 * TAU
        el = -0.5 + ((k * 0.618) % 1) * 1.3
        d = np.array([math.cos(a) * math.cos(el), math.sin(a) * math.cos(el) * 0.6 + 0.15, math.sin(el)])
        d /= np.linalg.norm(d)
        base = np.array((0, 0, 0.45)) + d * 0.34
        for grupo, s in (('pasoA', 1.0), ('pasoB', 1.12)):
            punta = base + d * 0.2 * s
            b.tubo([base, punta], 0.03, m, grupo, segmentos=6)
            b.blob(tuple(punta), (0.06, 0.06, 0.06), pin, grupo, n=6)
    ojos(b, 0, 0.5, 0.1, sep=0.14, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.32, 0.11, 'colmillos')


def b_barrito(b):
    m = fieltro('#E2463E', '#FF8C80', fuzz=0.45, sss=0.2)
    b.blob((0, 0, 0.4), (0.5, 0.45, 0.42), m, cuerpo=True, n=12, shaper=lambda v: v * (1 + 0.05 * np.sin(v[:, 1:2] * 8)))
    b.blob((0, 0.02, 0.8), (0.14, 0.14, 0.12), brillante('#FFF0C8', rough=0.3, sss=0.4), n=8)
    # Venitas de lo inflamado
    for k in range(4):
        a = -0.6 + k * 0.4
        pts = [(math.sin(a) * 0.2, math.cos(a) * 0.15 + 0.6), (math.sin(a) * 0.32, math.cos(a) * 0.2 + 0.5)]
        b.tubo(b.trazo_frente(pts, 0.005), 0.012, fieltro('#B52D2A'), 'base', segmentos=6)
    ojos(b, 0, 0.42, 0.12, sep=0.18, bravo=True, mirar=(0, -0.15), grosor_ceja=0.03)
    boca(b, 0, 0.22, 0.14, 'grande')
    patas(b, 2, (0, 0), 0.3, 0.1, 0.1, 0.1, 0.07, m, rodilla=0.5, abertura=0.2)


def b_lagana(b):
    m = brillante('#E9C46A', rough=0.4, coat=0.5, sss=0.35)
    b.blob((0, 0, 0.38), (0.48, 0.4, 0.38), m, cuerpo=True, n=12,
           shaper=lambda v: v * (1 + 0.1 * np.sin(v[:, 0:1] * 6 + 1) * np.cos(v[:, 2:3] * 5)))
    # Hilos pegajosos que gotean
    for grupo, s in (('pasoA', 1), ('pasoB', 0.6)):
        for x in (-0.3, 0.05, 0.32):
            b.tubo([(x, -0.1, 0.12), (x + 0.02, -0.12, 0.05 * s), (x, -0.13, 0.0)], 0.03, m, grupo, segmentos=6)
    ojos(b, 0, 0.47, 0.12, sep=0.16, estilo='dormilon', mirar=(0, -0.1))
    boca(b, 0, 0.26, 0.12, 'o')


def b_mugre(b):
    m = fieltro('#6B5A48', '#9C8770', fuzz=0.8, escala=60)
    for (x, y, z, r) in [(0, 0, 0.45, 0.48), (-0.32, 0.05, 0.33, 0.3), (0.34, 0.05, 0.35, 0.3), (0.0, 0.1, 0.82, 0.26), (-0.22, 0.08, 0.72, 0.22)]:
        b.blob((x, y, z), (r, r * 0.9, r), m, cuerpo=True, n=10, shaper=lambda v: v * (1 + 0.08 * np.sin(v[:, 0:1] * 11) * np.sin(v[:, 2:3] * 9)))
    # Basuritas pegadas: pelos, migas
    for (x, z, c) in [(-0.35, 0.55, '#D9C29C'), (0.3, 0.7, '#3E322A'), (0.38, 0.25, '#D9C29C')]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.05, 0.03, 0.04), fieltro(c), p, nrm, 'base', lift=0.01)
    b.tubo([(0.1, -0.35, 0.9), (0.3, -0.32, 1.0), (0.45, -0.3, 0.92)], 0.012, NEGRO, 'base', segmentos=5)
    ojos(b, 0, 0.5, 0.13, sep=0.18, bravo=True, mirar=(0, -0.15))
    boca(b, 0, 0.27, 0.16, 'dientes')
    patas(b, 2, (0, 0), 0.32, 0.1, 0.12, 0.12, 0.08, m, rodilla=0.5, abertura=0.2)


def b_moco(b):
    m = brillante('#8FCB52', rough=0.22, coat=0.9, sss=0.4)
    b.blob((0, 0, 0.4), (0.46, 0.4, 0.42), m, cuerpo=True, n=12,
           shaper=lambda v: np.column_stack([v[:, 0] * (1 + 0.15 * (v[:, 2] < -0.2)), v[:, 1], v[:, 2] * (1 - 0.15 * (v[:, 2] < 0))]))
    b.blob((-0.17, -0.3, 0.62), (0.08, 0.04, 0.12), BRILLO, n=6)
    for grupo, s in (('pasoA', 1), ('pasoB', -1)):
        b.blob((0.38 * s, -0.05, 0.08), (0.12, 0.12, 0.08), m, grupo, n=8)
        b.tubo([(0.32, -0.05, 0.78), (0.4 + 0.05 * s, -0.08, 0.95), (0.35, -0.1, 1.05)], 0.05, m, grupo, segmentos=8)
    ojos(b, 0, 0.5, 0.12, sep=0.16, mirar=(0.1, -0.1), estilo='loco')
    boca(b, 0, 0.27, 0.14, 'sonrisa')
    cachetes(b, 0, 0.36, 0.3, 0.06, '#5FA33A')


def b_sarro(b):
    m = fieltro('#E6CB7A', '#FFF0B8', fuzz=0.6, escala=70)
    # Costra con forma de muela
    b.blob((0, 0, 0.4), (0.42, 0.36, 0.38), m, cuerpo=True, n=12, p=2.6,
           shaper=lambda v: v * (1 + 0.12 * (np.abs(np.sin(v[:, 0:1] * 7)) * (v[:, 2:3] > 0.2))))
    for x in (-0.2, 0.0, 0.2):
        b.blob((x, 0.02, 0.76), (0.1, 0.1, 0.07), m, n=6)
    manchas(b, [(-0.25, 0.35, 1), (0.25, 0.55, 0.8)], 0.05, '#B89A4E')
    ojos(b, 0, 0.45, 0.1, sep=0.15, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.26, 0.11, 'brava')
    patas(b, 2, (0, 0), 0.24, 0.1, 0.1, 0.1, 0.05, m, rodilla=0.5, abertura=0.2)


def b_pasta_seca(b):
    blanco = fieltro('#F4FAFF', '#FFFFFF', fuzz=0.4)
    menta = fieltro('#68C9B9', '#A7EDE1', fuzz=0.4)
    rojo = fieltro('#E85D6A', '#FFA3AC', fuzz=0.4)
    # Gusanito de crema dental (rayitas de colores)
    for grupo, s in (('pasoA', 1), ('pasoB', -1)):
        pts = [(-0.45, 0.05, 0.12), (-0.22, 0.0, 0.2 + 0.04 * s), (0.0, -0.02, 0.28), (0.15, -0.04, 0.45), (0.1, -0.06, 0.62)]
        b.tubo(pts, 0.17, blanco, grupo, segmentos=14, subsurf=2)
        b.tubo([(x, y - 0.11, z + 0.05) for x, y, z in pts], 0.06, menta, grupo, segmentos=8)
        b.tubo([(x + 0.05, y - 0.08, z - 0.08) for x, y, z in pts], 0.05, rojo, grupo, segmentos=8)
    b.blob((0.08, -0.04, 0.62), (0.2, 0.18, 0.18), blanco, cuerpo=True, n=10)
    ojos(b, 0.08, 0.65, 0.085, sep=0.11, mirar=(0, -0.1))
    boca(b, 0.08, 0.53, 0.08, 'sonrisa')


def b_hongo(b):
    sombrero = fieltro('#C84B4B', '#FF8F8F', fuzz=0.45)
    pie = fieltro('#F2E6D0', '#FFFFFF', fuzz=0.5)
    b.blob((0, 0, 0.3), (0.26, 0.24, 0.3), pie, cuerpo=True, n=10)
    b.blob((0, 0.02, 0.66), (0.52, 0.48, 0.26), sombrero, n=12, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], -0.25)]))
    for (x, y, z) in [(-0.25, -0.28, 0.75), (0.2, -0.32, 0.7), (0.0, -0.18, 0.88), (0.38, -0.1, 0.66), (-0.4, -0.05, 0.64)]:
        b.blob((x, y, z), (0.07, 0.04, 0.06), pie, n=6)
    ojos(b, 0, 0.36, 0.085, sep=0.11, bravo=True, mirar=(0, -0.1))
    boca(b, 0, 0.2, 0.08, 'brava')
    patas(b, 2, (0, 0), 0.16, 0.1, 0.05, 0.08, 0.05, pie, rodilla=0.5, abertura=0.2)


def b_cucaracha(b):
    m = brillante('#6B3A22', rough=0.28, coat=0.8, sss=0.05)
    b.blob((0, 0.12, 0.3), (0.32, 0.5, 0.2), m, cuerpo=True, n=12)
    b.blob((0, -0.32, 0.34), (0.2, 0.16, 0.16), m, cuerpo=True, n=10)
    # Línea del ala
    b.tubo([(0, -0.15, 0.48), (0, 0.2, 0.5), (0, 0.55, 0.38)], 0.012, plano('#3A1E12'), 'base', segmentos=5)
    patas(b, 6, (0, 0.1), 0.3, 0.4, 0.2, 0.3, 0.025, plano('#3A1E12'), rodilla=0.9)
    antenas(b, [(-0.08, -0.42, 0.42), (0.08, -0.42, 0.42)], 0.5, 0.012, plano('#3A1E12'), curva=0.6)
    ojos(b, 0, 0.37, 0.07, sep=0.09, bravo=True, mirar=(0, -0.1))
    boca(b, 0, 0.27, 0.06, 'colmillos')


def b_pelo(b):
    m = fieltro('#2B2220', '#5A4844', fuzz=0.6)
    # Un pelo largo enrollado con carita en la punta
    for grupo, s in (('pasoA', 1), ('pasoB', -1)):
        pts = [(-0.5, 0.05, 0.05), (-0.3, 0.0, 0.22 + 0.05 * s), (0.0, 0.05, 0.12), (0.25, 0.0, 0.3 - 0.05 * s), (0.1, -0.05, 0.5), (-0.12, -0.05, 0.42), (-0.05, -0.08, 0.62)]
        b.tubo(pts, 0.045, m, grupo, segmentos=8)
    b.blob((-0.02, -0.06, 0.66), (0.17, 0.15, 0.16), m, cuerpo=True, n=10)
    ojos(b, -0.02, 0.69, 0.075, sep=0.09, bravo=True, mirar=(0, -0.1), color_ceja='#7A6A66')
    boca(b, -0.02, 0.58, 0.06, 'ladeada')


def b_moho(b):
    m = fieltro('#3E5A3A', '#86A96E', fuzz=0.9, escala=150)
    b.blob((0, 0, 0.38), (0.5, 0.42, 0.38), m, cuerpo=True, n=12, shaper=lambda v: v * (1 + 0.12 * np.sin(v[:, 0:1] * 8) * np.sin(v[:, 1:2] * 7)))
    esporas = fieltro('#C7D96E', '#EEF7B0')
    for grupo, s in (('pasoA', 1.0), ('pasoB', 1.1)):
        for k in range(9):
            a = k / 9 * math.pi + 0.15
            x, z = math.cos(a) * 0.4, 0.38 + math.sin(a) * 0.36
            b.tubo([(x, 0.05, z), (x * 1.18 * s, 0.05, z + 0.12 * s)], 0.018, m, grupo, segmentos=5)
            b.blob((x * 1.18 * s, 0.05, z + 0.12 * s), (0.04,) * 3, esporas, grupo, n=6)
    ojos(b, 0, 0.44, 0.11, sep=0.16, estilo='dormilon', mirar=(0, -0.12))
    boca(b, 0, 0.24, 0.13, 'triste')


def b_jabon_sucio(b):
    m = fieltro('#B8E0D2', '#E8FFF7', fuzz=0.35, rough=0.5, brillo=0.3)
    b.blob((0, 0, 0.32), (0.5, 0.36, 0.3), m, cuerpo=True, n=10, p=4.5, subsurf=2)
    # Rayitas negras y pelos pegados
    for k in range(5):
        x = -0.35 + k * 0.17
        pts = [(x, 0.5 + (k % 2) * 0.05), (x + 0.08, 0.42)]
        b.tubo(b.trazo_frente(pts, 0.003), 0.008, NEGRO, 'base', segmentos=5)
    b.tubo([(-0.4, -0.2, 0.62), (-0.1, -0.25, 0.66), (0.2, -0.22, 0.6), (0.5, -0.2, 0.64)], 0.01, NEGRO, 'base', segmentos=5)
    # Espuma sucia arriba
    esp = fieltro('#E8E2D2', '#FFFFFF', fuzz=0.6)
    for (x, z, r) in [(-0.2, 0.62, 0.1), (0.05, 0.64, 0.12), (0.28, 0.6, 0.09)]:
        b.blob((x, 0.0, z), (r, r, r * 0.8), esp, n=8)
    ojos(b, 0, 0.35, 0.11, sep=0.18, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.17, 0.14, 'dientes')


def b_piojo(b):
    m = fieltro('#B98C6A', '#E8C3A3', fuzz=0.55)
    b.blob((0, 0.08, 0.32), (0.3, 0.38, 0.26), m, cuerpo=True, n=12)
    b.blob((0, -0.26, 0.42), (0.2, 0.17, 0.18), m, cuerpo=True, n=10)
    for k in range(4):
        b.tubo([(-0.28, 0.0 + k * 0.12, 0.42), (0.28, 0.0 + k * 0.12, 0.42)], 0.012, fieltro('#8A6448'), 'base', segmentos=5)
    patas(b, 6, (0, 0.05), 0.28, 0.3, 0.2, 0.32, 0.035, fieltro('#8A6448'), rodilla=1.0)
    antenas(b, [(-0.08, -0.34, 0.54), (0.08, -0.34, 0.54)], 0.22, 0.015, fieltro('#8A6448'))
    ojos(b, 0, 0.46, 0.08, sep=0.1, bravo=True, mirar=(0, -0.1))
    boca(b, 0, 0.35, 0.07, 'colmillos')


def b_mosquito(b):
    m = fieltro('#4A4E5C', '#8A90A3', fuzz=0.5)
    b.blob((0, 0.15, 0.5), (0.14, 0.32, 0.14), m, cuerpo=True, n=10)
    b.blob((0, -0.16, 0.55), (0.18, 0.16, 0.17), m, cuerpo=True, n=10)
    for k in range(4):
        b.tubo([(-0.14, 0.05 + k * 0.1, 0.55), (0.14, 0.05 + k * 0.1, 0.55)], 0.012, fieltro('#E8E8E8'), 'base', segmentos=5)
    b.tubo([(0, -0.3, 0.5), (0, -0.48, 0.42), (0, -0.62, 0.3)], 0.014, NEGRO, 'base', segmentos=5)
    alas(b, (0, 0.05, 0.62), 0.32, angulo=0.6, lado_x=0.08)
    patas(b, 6, (0, 0.1), 0.12, 0.24, 0.45, 0.45, 0.012, NEGRO, rodilla=0.75)
    ojos(b, 0, 0.6, 0.075, sep=0.08, bravo=True, mirar=(0, -0.1))


def b_pulga(b):
    m = brillante('#7A3B1F', rough=0.35, coat=0.6, sss=0.05)
    b.blob((0, 0.05, 0.36), (0.26, 0.34, 0.3), m, cuerpo=True, n=12)
    for grupo, s in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            # Patas de atrás grandotas para brincar
            b.tubo([(lado * 0.2, 0.2, 0.3), (lado * 0.38, 0.32, 0.5 if s > 0 else 0.25), (lado * 0.42, 0.25, 0.0)], 0.04, m, grupo, segmentos=8)
    patas(b, 4, (0, -0.05), 0.22, 0.2, 0.2, 0.2, 0.025, m, rodilla=0.8)
    ojos(b, 0, 0.45, 0.085, sep=0.1, mirar=(0, -0.1))
    boca(b, 0, 0.33, 0.07, 'sonrisa')


def b_burbuja_sucia(b):
    vidrio = clay.material('Burbuja sucia', '#C9E8F2', rough=0.05, transmission=0.85, coat=1.0, coat_rough=0.02, ior=1.2,
                           noise=dict(scale=30, strength=0.03, detail=2, distance=0.003))
    b.blob((0, 0, 0.48), (0.44, 0.42, 0.44), vidrio, cuerpo=True, n=14)
    mugre = fieltro('#6B5A48', '#9C8770', fuzz=0.8)
    for (x, y, z, r) in [(-0.1, 0.05, 0.38, 0.12), (0.12, 0.1, 0.45, 0.1), (0.0, 0.0, 0.28, 0.09)]:
        b.blob((x, y, z), (r, r, r), mugre, n=8)
    b.blob((-0.18, -0.36, 0.7), (0.1, 0.03, 0.06), BRILLO, n=6)
    ojos(b, 0, 0.55, 0.11, sep=0.15, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.36, 0.1, 'brava')


def b_babosa(b):
    m = brillante('#C8A35E', rough=0.2, coat=0.9, sss=0.35)
    for grupo, s in (('pasoA', 1), ('pasoB', 0.92)):
        b.tubo([(0.5, 0.1, 0.1), (0.2 * s, 0.05, 0.16), (-0.1, 0.0, 0.25), (-0.25, -0.05, 0.42)], [0.12, 0.18, 0.2, 0.18], m, grupo, segmentos=14, subsurf=2)
    b.blob((-0.25, -0.06, 0.48), (0.2, 0.18, 0.2), m, cuerpo=True, n=10)
    for x in (-0.33, -0.17):
        b.tubo([(x, -0.1, 0.62), (x - 0.03, -0.14, 0.82)], 0.022, m, 'base', segmentos=6)
        b.blob((x - 0.03, -0.14, 0.84), (0.045,) * 3, m, 'base', n=6)
    ojos(b, -0.25, 0.52, 0.08, sep=0.09, estilo='dormilon', mirar=(0, -0.1))
    boca(b, -0.25, 0.38, 0.07, 'sonrisa')


def b_espinilla(b):
    m = fieltro('#F2A285', '#FFD0BC', fuzz=0.45, sss=0.15)
    b.blob((0, 0, 0.42), (0.42, 0.38, 0.42), m, cuerpo=True, n=12, shaper=lambda v: v * (1 + 0.25 * np.clip(v[:, 2:3] - 0.3, 0, 1)))
    b.blob((0, 0.02, 0.92), (0.13, 0.13, 0.12), brillante('#FFFFFF', rough=0.3, sss=0.4), n=8)
    ojos(b, 0, 0.45, 0.11, sep=0.16, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.27, 0.12, 'ladeada')
    cachetes(b, 0, 0.34, 0.28, 0.06)
    patas(b, 2, (0, 0), 0.26, 0.1, 0.1, 0.1, 0.06, m, rodilla=0.5, abertura=0.2)


# --------------------------------------------------------------------------------------- Jefes (más grandes, con corona)
def j_espinillon(b):
    b_granito(b)
    corona(b, (0, 0.04, 0.82), 0.22, 0.2)
    # Musculitos
    for s in (-1, 1):
        for grupo, a in (('pasoA', 0.4), ('pasoB', 0.1)):
            b.tubo([(s * 0.45, -0.05, 0.4), (s * 0.68, -0.1, 0.45 + a * 0.3), (s * 0.7, -0.15, 0.68 + a * 0.2)], 0.08, fieltro('#F08A7C', '#FFC2B8'), grupo, segmentos=10)
            b.blob((s * 0.7, -0.15, 0.72 + a * 0.2), (0.11, 0.1, 0.1), fieltro('#F08A7C', '#FFC2B8'), grupo, n=8)


def j_reina_caspa(b):
    b_caspa(b)
    corona(b, (0, 0.0, 0.86), 0.16, 0.16, color='#DDE6F2', joyas=('#7DB7E8', '#FFFFFF'))
    capa = fieltro('#7DB7E8', '#C8E6FF', fuzz=0.5)
    b.blob((0, 0.2, 0.42), (0.5, 0.08, 0.42), capa, n=10)


def j_gran_moco(b):
    b_moco(b)
    corona(b, (0, 0.0, 0.8), 0.2, 0.18)


def j_senor_lagana(b):
    b_lagana(b)
    gorro = fieltro('#5E7FC4', '#A4BFF0', fuzz=0.5)
    b.tubo([(0, 0.0, 0.7), (0.12, 0.02, 0.92), (0.32, 0.05, 1.02), (0.5, 0.05, 0.9)], [0.3, 0.2, 0.1, 0.05], gorro, 'base', segmentos=14)
    b.blob((0.52, 0.05, 0.86), (0.08,) * 3, fieltro('#FFFFFF'), n=8)


def j_barro_negro(b):
    b_mugre(b)
    cuerno = fieltro('#2B221C', '#5A4A3E')
    for s in (-1, 1):
        b.tubo([(s * 0.2, 0.05, 0.95), (s * 0.32, 0.0, 1.12), (s * 0.28, -0.05, 1.25)], [0.08, 0.05, 0.015], cuerno, 'base', segmentos=10)
    corona(b, (0, 0.08, 0.98), 0.2, 0.16, color='#8A7A68', joyas=('#3E322A', '#E2463E'))


def j_senor_sarro(b):
    b_sarro(b)
    sombrero = fieltro('#2E2A2A', '#5A5454', fuzz=0.4)
    b.torno([(0.0, 0.0), (0.34, 0.0), (0.34, 0.03), (0.2, 0.04), (0.2, 0.32), (0.0, 0.33)], sombrero)
    b.g['base'][-1].location = (0, 0.04, 0.78)
    b.tubo([(-0.25, -0.38, 0.33), (-0.1, -0.42, 0.37), (0, -0.42, 0.35), (0.1, -0.42, 0.37), (0.25, -0.38, 0.33)], 0.045, fieltro('#7A5A2E'), 'base', segmentos=10)


def j_dona_cucaracha(b):
    b_cucaracha(b)
    rulos = fieltro('#F59AAE', '#FFC9D4')
    for x in (-0.12, 0.0, 0.12):
        b.tubo([(x - 0.05, -0.32, 0.52), (x + 0.05, -0.32, 0.52)], 0.04, rulos, 'base', segmentos=10)
    delantal = fieltro('#FFFFFF', '#FFFFFF', fuzz=0.3)
    b.blob((0, -0.05, 0.38), (0.24, 0.06, 0.12), delantal, n=8)
    corona(b, (0, -0.3, 0.5), 0.13, 0.1)


def j_mota_pelo(b):
    b_pelusa(b)
    m = fieltro('#2B2220', '#5A4844')
    for k in range(10):
        a = k / 10 * TAU
        for grupo, s in (('pasoA', 1), ('pasoB', -1)):
            p0 = (math.cos(a) * 0.38, 0.05, 0.45 + math.sin(a) * 0.38)
            p1 = (math.cos(a) * 0.62, -0.02, 0.45 + math.sin(a) * 0.62 + 0.06 * s)
            p2 = (math.cos(a + 0.3 * s) * 0.78, -0.05, 0.45 + math.sin(a + 0.3 * s) * 0.74)
            b.tubo([p0, p1, p2], 0.014, m, grupo, segmentos=5)
    corona(b, (0, 0.06, 0.9), 0.17, 0.14)


def j_tapon(b):
    caucho = brillante('#3D3D46', rough=0.45, coat=0.4, sss=0.05)
    b.torno([(0.0, 0.0), (0.42, 0.0), (0.45, 0.06), (0.36, 0.5), (0.0, 0.52)], caucho, segmentos=32)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    metal = clay.material('Cadena', '#C9CED8', rough=0.2, metallic=0.9)
    for k in range(6):
        o = clay.blob(b.nom(), (0, 0, 0), (0.05, 0.015, 0.08), b.coll, metal, n=6, subsurf=1)
        o.rotation_euler = (0, (k % 2) * math.pi / 2, 0)
        o.location = (0.0 + math.sin(k * 0.4) * 0.05, 0.05, 0.6 + k * 0.1)
        b.add(o)
    b.blob((0, 0.05, 1.22), (0.1, 0.03, 0.1), metal, n=8)
    ojos(b, 0, 0.3, 0.11, sep=0.16, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.13, 0.13, 'colmillos')


def j_esponja_podrida(b):
    m = fieltro('#C9C25A', '#EAE59A', fuzz=0.5, escala=60)
    b.blob((0, 0, 0.38), (0.5, 0.34, 0.38), m, cuerpo=True, n=10, p=4.0, subsurf=2)
    hueco = fieltro('#8A8434')
    for (x, z, r) in [(-0.3, 0.55, 0.06), (0.25, 0.62, 0.05), (0.33, 0.25, 0.07), (-0.36, 0.2, 0.05), (0.05, 0.68, 0.04), (-0.12, 0.12, 0.04)]:
        p, nrm = b.frente(x, z)
        orientado(b, (r, r * 0.4, r), hueco, p, nrm, 'base')
    moho = fieltro('#4E6B3A', '#86A96E', fuzz=0.9)
    for (x, z) in [(-0.4, 0.66), (0.42, 0.45)]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.1, 0.05, 0.08), moho, p, nrm, 'base', lift=0.02)
    ojos(b, 0, 0.42, 0.12, sep=0.18, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.22, 0.15, 'dientes')
    corona(b, (0, 0.04, 0.74), 0.2, 0.16, color='#B0A84A', joyas=('#4E6B3A', '#8A8434'))


def j_pelo_desague(b):
    m = fieltro('#2B2220', '#5A4844', fuzz=0.7)
    b.blob((0, 0, 0.5), (0.45, 0.4, 0.48), m, cuerpo=True, n=12)
    for k in range(8):
        a = (k / 8) * math.pi + 0.15
        for grupo, s in (('pasoA', 1), ('pasoB', -1)):
            p0 = (math.cos(a) * 0.4, 0.05, 0.2)
            p1 = (math.cos(a) * 0.7, -0.05, 0.12 + 0.08 * s)
            p2 = (math.cos(a) * 0.9 + 0.08 * s, -0.1, 0.02)
            b.tubo([p0, p1, p2], [0.06, 0.04, 0.02], m, grupo, segmentos=8)
    ojos(b, 0, 0.58, 0.14, sep=0.18, bravo=True, mirar=(0, -0.15), color_ceja='#7A6A66')
    boca(b, 0, 0.32, 0.16, 'colmillos')
    corona(b, (0, 0.04, 0.95), 0.18, 0.15, color='#9AA3AE', joyas=('#2B2220', '#7DB7E8'))


def j_ducha_helada(b):
    metal = clay.material('Ducha metal', '#DDE8F2', rough=0.18, metallic=0.85, coat=0.6,
                          noise=dict(scale=40, strength=0.05, detail=2, distance=0.002))
    hielo = clay.material('Hielo', '#BFE6F5', rough=0.08, transmission=0.6, coat=1.0, coat_rough=0.03, sss=0.3, ior=1.31,
                          noise=dict(scale=25, strength=0.2, detail=4, distance=0.006))
    # Cabeza de ducha (disco grande) con tubo
    b.blob((0, 0, 0.6), (0.48, 0.3, 0.48), metal, cuerpo=True, n=14, shaper=lambda v: np.column_stack([v[:, 0], np.clip(v[:, 1], -0.55, 0.8), v[:, 2]]))
    b.tubo([(0, 0.25, 0.95), (0, 0.4, 1.2), (0, 0.4, 1.5)], 0.08, metal, 'base', segmentos=12)
    # Huequitos de la regadera y carámbanos
    for k in range(9):
        a = k / 9 * TAU
        p, nrm = b.frente(math.cos(a) * 0.28, 0.6 + math.sin(a) * 0.28)
        orientado(b, (0.03, 0.02, 0.03), NEGRO, p, nrm, 'base')
    for grupo, s in (('pasoA', 1.0), ('pasoB', 1.15)):
        for x in (-0.3, -0.1, 0.1, 0.3):
            o = clay.blob(b.nom(), (0, 0, 0), (0.05, 0.05, 0.2 * s), b.coll, hielo, n=6, subsurf=1,
                          shaper=lambda v: v * np.array([1, 1, 1]) * (1 - 0.8 * np.clip(-v[:, 2:3], 0, 1)))
            o.location = (x, -0.08, 0.12 - 0.05 * s)
            b.add(o, grupo)
    for (x, z, r) in [(-0.4, 0.95, 0.1), (0.38, 0.92, 0.08), (0.0, 1.08, 0.09)]:
        b.blob((x, 0.0, z), (r, r, r * 1.2), hielo, n=6)
    ojos(b, 0, 0.66, 0.13, sep=0.17, bravo=True, mirar=(0, -0.15))
    boca(b, 0, 0.42, 0.15, 'dientes')


# ----------------------------------------------------------------------------------------------------- La Ducha
def b_gota_dura(b):
    """Gota de agua dura: azulita, con pecas de cal y cara de terca."""
    m = brillante('#8FC8EE', rough=0.12, coat=0.9, sss=0.3, transmision=0.25)
    b.blob((0, 0, 0.4), (0.34, 0.32, 0.48), m, cuerpo=True, n=12,
           shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.6 * np.clip(v[:, 2] / 0.48, 0, 1) ** 1.6), v[:, 1] * (1 - 0.6 * np.clip(v[:, 2] / 0.48, 0, 1) ** 1.6),
                                             v[:, 2] + 0.14 * np.clip(v[:, 2] / 0.48, 0, 1) ** 2]))
    b.blob((-0.12, -0.26, 0.56), (0.05, 0.025, 0.1), BRILLO, n=6)
    manchas(b, [(-0.18, 0.26, 1), (0.2, 0.34, 0.8), (0.1, 0.16, 0.6)], 0.05, '#F2F4F0')
    ojos(b, 0, 0.42, 0.1, sep=0.13, bravo=True, mirar=(0, -0.15))
    boca(b, 0, 0.24, 0.09, 'brava')
    # Goticas que salpican (cambian con el paso)
    b.blob((0.3, -0.05, 0.1), (0.05, 0.05, 0.07), m, 'pasoA', n=6)
    b.blob((-0.3, 0.0, 0.14), (0.04, 0.04, 0.06), m, 'pasoB', n=6)


def b_mosquita_desague(b):
    """La mosquita del desagüe: peludita, gris, con alas en forma de corazón."""
    m = fieltro('#8E8A96', '#D2CEDB', fuzz=0.8, escala=140)
    b.blob((0, 0.08, 0.5), (0.22, 0.3, 0.2), m, cuerpo=True, n=10)
    b.blob((0, -0.18, 0.56), (0.2, 0.18, 0.19), m, cuerpo=True, n=10)
    mat_ala = clay.material('Ala mosquita', '#B8B2C6', rough=0.7, sheen=0.4, fuzz=dict(scale=160, color='#E6E2EE', amount=0.6, strength=0.3, dark=0.7))
    for grupo, a in (('pasoA', 0.5), ('pasoB', -0.15)):
        for s in (-1, 1):
            o = clay.blob(b.nom(), (0, 0, 0), (0.3, 0.04, 0.24), b.coll, mat_ala, n=8, subsurf=1,
                          shaper=lambda v: v * (1 + 0.25 * np.clip(v[:, 2:3] / 0.24, 0, 1) * np.abs(np.sin(v[:, 0:1] * 8))))
            o.rotation_euler = (0, s * -a, s * 0.2)
            o.location = (s * 0.32, 0.1, 0.62 + 0.12 * math.sin(a))
            b.add(o, grupo)
    antenas(b, [(-0.07, -0.3, 0.68), (0.07, -0.3, 0.68)], 0.25, 0.012, m, curva=0.4)
    patas(b, 6, (0, 0.05), 0.15, 0.24, 0.42, 0.42, 0.014, NEGRO, rodilla=0.75)
    ojos(b, 0, 0.6, 0.08, sep=0.09, mirar=(0, -0.1), estilo='dormilon')
    boca(b, 0, 0.47, 0.06, 'o')


def b_tapa_champu(b):
    """La tapita de champú que se perdió: rosada, con bisagra, y brinca."""
    m = brillante('#F28DB2', rough=0.25, coat=0.7, sss=0.1)
    b.torno([(0.0, 0.0), (0.34, 0.0), (0.36, 0.04), (0.34, 0.42), (0.28, 0.5), (0.0, 0.5)], m)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    # La boquilla y la bisagra
    b.blob((0, 0.05, 0.56), (0.12, 0.08, 0.06), brillante('#FFFFFF', rough=0.3), n=8)
    b.tubo([(-0.2, 0.3, 0.5), (0.2, 0.3, 0.5)], 0.035, brillante('#D9578E', rough=0.3), 'base', segmentos=8)
    for k in range(10):
        a = k / 10 * TAU
        b.tubo([(math.cos(a) * 0.35, math.sin(a) * 0.35, 0.08), (math.cos(a) * 0.35, math.sin(a) * 0.35, 0.38)], 0.012, brillante('#D9578E', 0.3), 'base', segmentos=4)
    for grupo, s in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(lado * 0.24, 0.0, 0.12), (lado * 0.36, -0.05, 0.08 + 0.06 * s), (lado * 0.4, -0.05, 0.0)], 0.035, m, grupo, segmentos=6)
    ojos(b, 0, 0.32, 0.1, sep=0.14, mirar=(0, -0.1))
    boca(b, 0, 0.16, 0.1, 'sonrisa')
    cachetes(b, 0, 0.22, 0.24, 0.05)


def b_hongo_pie(b):
    """El hongo del pie: amarillito, con esporas y cara de pocos amigos."""
    sombrero = fieltro('#F0B43C', '#FFDD90', fuzz=0.55)
    pie = fieltro('#F4EBD2', '#FFFFFF', fuzz=0.5)
    b.blob((0, 0, 0.3), (0.3, 0.27, 0.3), pie, cuerpo=True, n=10)
    b.blob((0, 0.06, 0.68), (0.48, 0.44, 0.22), sombrero, n=12, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], -0.17)]))
    for (x, y, z, r) in [(-0.22, -0.22, 0.78, 0.07), (0.18, -0.26, 0.74, 0.06), (0.0, -0.1, 0.88, 0.05), (0.32, -0.05, 0.72, 0.05)]:
        b.blob((x, y, z), (r, r * 0.5, r * 0.8), fieltro('#B9722A', '#D9A060'), n=6)
    # Arruguitas de debajo del sombrero
    for k in range(9):
        a = math.pi + k / 8 * math.pi
        b.tubo([(math.cos(a) * 0.2, math.sin(a) * 0.18 + 0.06, 0.56), (math.cos(a) * 0.42, math.sin(a) * 0.38 + 0.06, 0.54)], 0.012, fieltro('#C98A2E'), 'base', segmentos=4)
    espora = fieltro('#B9D06A', '#E6F2A8', fuzz=0.6)
    for grupo, s in (('pasoA', 0), ('pasoB', 0.08)):
        for (x, z) in [(-0.38, 0.92), (0.1, 1.02), (0.42, 0.86)]:
            b.blob((x, -0.05, z + s), (0.05, 0.05, 0.05), espora, grupo, n=6)
    ojos(b, 0, 0.36, 0.095, sep=0.12, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.19, 0.09, 'ladeada')
    cachetes(b, 0, 0.25, 0.2, 0.045)
    patas(b, 2, (0, 0), 0.18, 0.1, 0.05, 0.08, 0.055, pie, rodilla=0.5, abertura=0.2)


def b_espuma_sucia(b):
    """Una nube de espuma con mugre adentro que flota brava."""
    m = fieltro('#E4E6EA', '#FFFFFF', fuzz=0.75, rough=0.9, escala=120)
    for (x, y, z, r) in [(0, 0, 0.5, 0.36), (-0.3, 0.04, 0.42, 0.24), (0.3, 0.04, 0.44, 0.25), (-0.14, 0.06, 0.78, 0.22), (0.16, 0.05, 0.76, 0.2),
                         (0.0, 0.0, 0.24, 0.22)]:
        b.blob((x, y, z), (r, r * 0.9, r), m, cuerpo=True, n=10)
    mugre = fieltro('#8C7E6A', '#B8A890', fuzz=0.6)
    for (x, z, k) in [(-0.22, 0.62, 1), (0.25, 0.32, 0.8), (0.3, 0.68, 0.7), (-0.3, 0.3, 0.6)]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.06 * k, 0.02, 0.05 * k), mugre, p, nrm, 'base', lift=0.01)
    for grupo, s in (('pasoA', 1), ('pasoB', 1.2)):
        for (x, z, r) in [(-0.5, 0.75, 0.05), (0.52, 0.6, 0.06), (0.4, 0.95, 0.04)]:
            b.blob((x * s, -0.05, z), (r, r, r), brillante('#DDEEFF', rough=0.1, coat=1.0, transmision=0.5), grupo, n=6)
    ojos(b, 0, 0.52, 0.11, sep=0.15, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.33, 0.11, 'dientes')


def b_ciempies(b):
    """El ciempiés del sifón: cafecito, de muchos anillos y muchísimas patas."""
    m = brillante('#9A5A32', rough=0.35, coat=0.6, sss=0.05)
    anillo = brillante('#6E3C1E', rough=0.35, coat=0.5)
    segs = [(0.0, -0.32, 0.36, 0.22), (0.0, -0.06, 0.3, 0.2), (0.04, 0.18, 0.28, 0.19), (0.1, 0.4, 0.26, 0.17), (0.18, 0.6, 0.24, 0.15), (0.26, 0.78, 0.22, 0.12)]
    for i, (x, y, z, r) in enumerate(segs):
        b.blob((x, y, z), (r, r * 0.9, r * 0.85), m if i == 0 else (m if i % 2 else anillo), cuerpo=(i == 0), n=10)
        if i:
            for grupo, f in (('pasoA', 1), ('pasoB', -1)):
                for s in (-1, 1):
                    osc = f * (1 if i % 2 else -1) * 0.05
                    b.tubo([(x + s * r * 0.8, y, z - 0.05), (x + s * (r + 0.12), y + osc, z + 0.02), (x + s * (r + 0.2), y + osc * 1.5, 0.0)], 0.02, anillo, grupo, segmentos=5)
    antenas(b, [(-0.1, -0.48, 0.5), (0.1, -0.48, 0.5)], 0.42, 0.016, anillo, curva=0.5)
    for s in (-1, 1):
        b.tubo([(s * 0.12, -0.5, 0.26), (s * 0.08, -0.6, 0.2)], 0.02, plano('#3A1E12'), 'base', segmentos=4)
    ojos(b, 0, 0.42, 0.085, sep=0.1, bravo=True, mirar=(0, -0.1))
    boca(b, 0, 0.27, 0.08, 'colmillos')


def b_estropajo(b):
    """El estropajo mugroso: verde de un lado, amarillo del otro, y se lanza a raspar."""
    verde = fieltro('#4FA86A', '#8FD8A0', fuzz=0.9, rough=0.95, escala=200)
    amarillo = fieltro('#F2D35C', '#FFF0A8', fuzz=0.5, escala=60)
    b.blob((0, 0, 0.22), (0.5, 0.32, 0.18), amarillo, cuerpo=True, n=10, p=4.0, subsurf=2)
    b.blob((0, 0, 0.47), (0.5, 0.32, 0.1), verde, cuerpo=True, n=10, p=4.0, subsurf=2)
    for (x, z) in [(-0.3, 0.2), (0.28, 0.26), (0.0, 0.12), (0.38, 0.12)]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.05, 0.02, 0.04), fieltro('#B8992E'), p, nrm, 'base')
    mugre = fieltro('#6B5A44', '#9A8870', fuzz=0.6)
    for (x, y) in [(-0.3, 0.1), (0.25, -0.15), (0.05, 0.2)]:
        b.blob((x, y, 0.57), (0.08, 0.06, 0.03), mugre, n=6)
    for grupo, s in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(lado * 0.48, -0.05, 0.3), (lado * 0.62, -0.12, 0.38 + 0.08 * s), (lado * 0.66, -0.18, 0.5 + 0.06 * s)], 0.05, amarillo, grupo, segmentos=8)
            b.blob((lado * 0.66, -0.18, 0.52 + 0.06 * s), (0.07,) * 3, amarillo, grupo, n=6)
    ojos(b, 0, 0.3, 0.1, sep=0.15, bravo=True, mirar=(0, -0.12), grosor_ceja=0.025)
    boca(b, 0, 0.15, 0.12, 'dientes')


def b_cal(b):
    """La costra de cal de la regadera: una piedra blanca, rugosa y pesadísima."""
    m = fieltro('#E9E6DC', '#FFFFFF', fuzz=0.35, rough=0.95, escala=50)
    b.blob((0, 0, 0.42), (0.56, 0.48, 0.44), m, cuerpo=True, n=14,
           shaper=lambda v: v * (1 + 0.1 * np.sin(v[:, 0:1] * 13) * np.sin(v[:, 2:3] * 11) + 0.06 * np.sin(v[:, 1:2] * 17)))
    costra = fieltro('#CFC9B6', '#EDE8DA', fuzz=0.3)
    for (x, z, k) in [(-0.32, 0.65, 1), (0.3, 0.7, 0.9), (0.38, 0.3, 0.8), (-0.4, 0.25, 0.7), (0.0, 0.82, 0.8)]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.1 * k, 0.04, 0.08 * k), costra, p, nrm, 'base', lift=0.02)
    for (x, y, z) in [(-0.3, -0.25, 0.82), (0.35, -0.2, 0.8)]:
        b.blob((x, y, z), (0.05, 0.05, 0.07), brillante('#8FC8EE', rough=0.1, coat=1.0, transmision=0.3), n=6)
    ojos(b, 0, 0.46, 0.12, sep=0.18, bravo=True, mirar=(0, -0.15), grosor_ceja=0.035)
    boca(b, 0, 0.24, 0.15, 'brava')
    patas(b, 2, (0, 0), 0.34, 0.1, 0.1, 0.1, 0.08, m, rodilla=0.5, abertura=0.2)


def j_rey_hongo(b):
    b_hongo_pie(b)
    corona(b, (0, 0.06, 0.86), 0.2, 0.18)
    capa = fieltro('#7A3BA8', '#B98AD8', fuzz=0.5)
    b.blob((0, 0.22, 0.3), (0.38, 0.08, 0.3), capa, n=10)


def j_regadera_loca(b):
    """La regadera loca: la cabeza de la ducha, brava, escupiendo chorros."""
    metal = clay.material('Regadera metal', '#D6DEE8', rough=0.2, metallic=0.85, coat=0.5,
                          noise=dict(scale=40, strength=0.05, detail=2, distance=0.002))
    b.blob((0, 0, 0.6), (0.5, 0.28, 0.5), metal, cuerpo=True, n=14, shaper=lambda v: np.column_stack([v[:, 0], np.clip(v[:, 1], -0.5, 0.8), v[:, 2]]))
    b.tubo([(0, 0.22, 1.0), (0.1, 0.35, 1.25), (0.3, 0.4, 1.4)], 0.08, metal, 'base', segmentos=12)
    for k in range(12):
        a = k / 12 * TAU
        p, nrm = b.frente(math.cos(a) * 0.32, 0.6 + math.sin(a) * 0.32)
        orientado(b, (0.03, 0.02, 0.03), NEGRO, p, nrm, 'base')
    agua = brillante('#8FD3F2', rough=0.08, coat=1.0, transmision=0.5)
    for grupo, s in (('pasoA', 1.0), ('pasoB', 1.25)):
        for x in (-0.3, -0.1, 0.1, 0.3):
            b.tubo([(x, -0.2, 0.25), (x * 1.3, -0.3, 0.12 - 0.04 * s), (x * 1.6 * s, -0.35, -0.02)], 0.025, agua, grupo, segmentos=6)
    sarro = fieltro('#E9E6DC', '#FFFFFF', fuzz=0.3)
    for (x, z) in [(-0.38, 0.92), (0.4, 0.3)]:
        b.blob((x, -0.1, z), (0.08, 0.05, 0.06), sarro, n=6)
    ojos(b, 0, 0.68, 0.13, sep=0.18, bravo=True, mirar=(0, -0.15), estilo='loco')
    boca(b, 0, 0.44, 0.16, 'grande')
    corona(b, (0, 0.0, 1.08), 0.16, 0.14)


def j_cortina_mohosa(b):
    """La cortina mohosa: la cortina de la ducha llena de moho, con argollas y mal genio."""
    tela = fieltro('#9FD8D0', '#D2F2EE', fuzz=0.4)
    for grupo, s in (('pasoA', 1), ('pasoB', -1)):
        pts = []
        for k in range(9):
            t = k / 8
            pts.append((-0.6 + t * 1.2, 0.06 * math.sin(t * 14 + s), 0.55 + 0.05 * s * math.sin(t * 9)))
        for (x, y, z) in pts:
            b.blob((x, y, z), (0.09, 0.08, 0.55), tela, grupo, n=8)
    b.blob((0, -0.02, 0.6), (0.62, 0.06, 0.55), tela, cuerpo=True, n=10, p=3.0)
    moho = fieltro('#2E3A2A', '#5E7A52', fuzz=0.8)
    for (x, z, k) in [(-0.4, 0.2, 1.2), (0.35, 0.15, 1), (-0.1, 0.1, 0.9), (0.45, 0.6, 0.6), (-0.5, 0.75, 0.5)]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.1 * k, 0.03, 0.07 * k), moho, p, nrm, 'base', lift=0.01)
    metal = clay.material('Argolla', '#C9CED8', rough=0.2, metallic=0.9)
    b.tubo([(-0.75, 0.0, 1.2), (0.75, 0.0, 1.2)], 0.03, metal, 'base', segmentos=6)
    for k in range(7):
        x = -0.6 + k * 0.2
        o = clay.lathe(b.nom(), [(0.05, -0.012), (0.065, 0.0), (0.05, 0.012), (0.04, 0.0), (0.05, -0.012)], b.coll, metal, segments=16, subsurf=1,
                       cap_bottom=False, cap_top=False)
        o.rotation_euler = (math.pi / 2, 0, 0)
        o.location = (x, 0.0, 1.15)
        b.add(o)
    ojos(b, 0, 0.7, 0.13, sep=0.2, bravo=True, mirar=(0, -0.15))
    boca(b, 0, 0.46, 0.16, 'colmillos')
    corona(b, (0, 0.0, 1.24), 0.16, 0.14, color='#B8C9A6', joyas=('#2E3A2A', '#9FD8D0'))


def j_ciempies_gigante(b):
    b_ciempies(b)
    corona(b, (0, -0.32, 0.56), 0.16, 0.15)
    for s in (-1, 1):
        b.tubo([(s * 0.16, -0.46, 0.3), (s * 0.24, -0.62, 0.24), (s * 0.12, -0.72, 0.18)], [0.05, 0.035, 0.012], plano('#3A1E12'), 'base', segmentos=8)


# ----------------------------------------------------------------------------------------------------- La Jabonera
def b_pompa(b):
    """Pompita de jabón traviesa: transparente, tornasolada y con cara de picarona."""
    m = clay.material('Pompa', '#F3E6FF', rough=0.05, transmission=0.45, coat=1.0, coat_rough=0.02, ior=1.2, sss=0.2,
                      noise=dict(scale=12, strength=0.05, detail=2, distance=0.003))
    b.blob((0, 0, 0.48), (0.4, 0.38, 0.4), m, cuerpo=True, n=12)
    for (x, z, c, k) in [(-0.22, 0.62, '#F7A8D8', 1.2), (0.2, 0.28, '#A8E0F7', 1.1), (0.26, 0.66, '#F7E2A8', 0.9), (-0.28, 0.3, '#B8F2C8', 0.8),
                         (0.0, 0.78, '#C8B8F7', 0.9)]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.11 * k, 0.01, 0.07 * k), plano(c, 0.2, emision=0.6), p, nrm, 'base', lift=0.005)
    b.blob((-0.16, -0.3, 0.68), (0.07, 0.02, 0.05), BRILLO, n=6)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        b.blob((0.36 * s_, -0.05, 0.12), (0.06, 0.06, 0.06), m, grupo, n=6)
    ojos(b, 0, 0.5, 0.1, sep=0.13, mirar=(0.05, -0.1), estilo='loco')
    boca(b, 0, 0.32, 0.09, 'ladeada')


def b_cuchilla(b):
    """Cuchillita de afeitar: plateada, con su mango azul, y vuela que zumba."""
    metal = clay.material('Cuchilla', '#D9DEE6', rough=0.15, metallic=0.9, coat=0.4)
    b.blob((0, 0, 0.5), (0.46, 0.12, 0.2), metal, cuerpo=True, n=10, p=4.0, subsurf=2)
    for x in (-0.28, -0.1, 0.1, 0.28):
        b.tubo([(x, -0.11, 0.38), (x, -0.11, 0.62)], 0.012, plano('#8A93A0'), 'base', segmentos=4)
    b.tubo([(0, 0.05, 0.32), (0.02, 0.1, 0.08)], 0.07, brillante('#4A7DD6', rough=0.3), 'base', segmentos=10)
    for grupo, a in (('pasoA', 0.5), ('pasoB', -0.2)):
        for s_ in (-1, 1):
            o = clay.blob(b.nom(), (0, 0, 0), (0.22, 0.03, 0.1), b.coll, clay.material('Ala cuchilla', '#E6F2FF', rough=0.1, transmission=0.6, alpha=0.7), n=6, subsurf=1)
            o.rotation_euler = (0, s_ * -a, 0)
            o.location = (s_ * 0.5, 0.08, 0.66 + 0.1 * math.sin(a))
            b.add(o, grupo)
    ojos(b, 0, 0.52, 0.08, sep=0.11, bravo=True, mirar=(0, -0.1))
    boca(b, 0, 0.4, 0.06, 'brava')


def b_champu_derramado(b):
    """El champú derramado: un charquito rosado y baboso que se arrastra."""
    m = brillante('#F06BA8', rough=0.12, coat=0.9, sss=0.45)
    b.blob((0, 0, 0.26), (0.48, 0.42, 0.26), m, cuerpo=True, n=12, shaper=lambda v: v * (1 + 0.08 * np.sin(v[:, 0:1] * 9 + v[:, 1:2] * 5)))
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for (x, y) in [(-0.45, 0.1), (0.45, -0.05)]:
            b.blob((x + 0.05 * s_, y, 0.06), (0.12, 0.1, 0.05), m, grupo, n=6)
    for (x, z, r) in [(-0.2, 0.52, 0.06), (0.2, 0.5, 0.05), (0.0, 0.58, 0.04)]:
        b.blob((x, -0.05, z), (r, r, r), brillante('#FFE0F0', rough=0.05, coat=1.0, transmision=0.5), n=6)
    b.blob((-0.15, -0.3, 0.38), (0.06, 0.02, 0.04), BRILLO, n=6)
    ojos(b, 0, 0.32, 0.1, sep=0.14, mirar=(0, -0.15), estilo='dormilon')
    boca(b, 0, 0.16, 0.1, 'grande')


def b_algodon(b):
    """Motica de algodón: blanquita, esponjada y brincona."""
    m = fieltro('#FFFFFF', '#FFFFFF', fuzz=0.95, rough=0.95, escala=160)
    for (x, y, z, r) in [(0, 0, 0.4, 0.32), (-0.2, 0.04, 0.34, 0.22), (0.21, 0.03, 0.36, 0.21), (0.0, 0.06, 0.6, 0.2), (-0.12, 0.0, 0.18, 0.16), (0.13, 0.0, 0.18, 0.16)]:
        b.blob((x, y, z), (r, r * 0.9, r), m, cuerpo=True, n=10)
    pelitos(b, 18, (0, 0, 0.42), 0.36, 0.08, 0.01, fieltro('#F2F2F2'), z_min=-0.3, bola=False, ondas=0.5)
    ojos(b, 0, 0.44, 0.09, sep=0.12, mirar=(0, -0.1))
    boca(b, 0, 0.29, 0.08, 'sonrisa')
    cachetes(b, 0, 0.35, 0.2, 0.045)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.blob((lado * 0.18, -0.02, 0.03 + 0.04 * (s_ * lado > 0)), (0.06, 0.07, 0.04), m, grupo, n=6)


def b_frasco_vacio(b):
    """El frasco vacío: un tarrito de crema sin crema, que embiste de rabia."""
    m = brillante('#7FC4D8', rough=0.25, coat=0.7, sss=0.1)
    b.torno([(0.0, 0.0), (0.3, 0.0), (0.32, 0.04), (0.32, 0.52), (0.2, 0.62), (0.2, 0.7), (0.0, 0.7)], m)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    b.torno([(0.0, 0.0), (0.22, 0.0), (0.22, 0.12), (0.0, 0.12)], brillante('#F2F2F2', rough=0.3), )
    b.g['base'][-1].location = (0, 0, 0.68)
    p, nrm = b.frente(0, 0.3)
    orientado(b, (0.22, 0.02, 0.14), plano('#FFF6E8', 0.6), p, nrm, 'base', lift=0.005)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(lado * 0.2, 0.0, 0.08), (lado * 0.28, -0.05, 0.04 + 0.05 * s_ * lado), (lado * 0.3, -0.06, 0.0)], 0.04, m, grupo, segmentos=6)
    ojos(b, 0, 0.42, 0.09, sep=0.13, bravo=True, mirar=(0, -0.1))
    boca(b, 0, 0.18, 0.09, 'colmillos')


def b_hilacha(b):
    """Hilacha de la esponja vegetal: un nudito de fibras que flota de lado a lado."""
    m = fieltro('#E2C98F', '#F5E6BC', fuzz=0.85, escala=140)
    for k in range(10):
        a = k / 10 * TAU
        b.tubo([(math.cos(a) * 0.1, 0.0, 0.45 + math.sin(a) * 0.1), (math.cos(a + 1.2) * 0.38, 0.05, 0.45 + math.sin(a + 1.2) * 0.32),
                (math.cos(a + 2.0) * 0.3, 0.0, 0.45 + math.sin(a + 2.0) * 0.26)], 0.03, m, 'base', segmentos=6)
    b.blob((0, 0, 0.45), (0.24, 0.2, 0.24), m, cuerpo=True, n=10)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(lado * 0.3, 0.0, 0.5), (lado * 0.5, 0.0, 0.55 + 0.08 * s_), (lado * 0.62, 0.0, 0.48)], 0.02, m, grupo, segmentos=5)
    ojos(b, 0, 0.48, 0.085, sep=0.11, mirar=(0, -0.1), triste=True)
    boca(b, 0, 0.34, 0.07, 'o')


def b_moho_rosado(b):
    """El moho rosado de las esquinas de la ducha: blandito, gordo y difícil de quitar."""
    m = fieltro('#F2A0B4', '#FFD0DC', fuzz=0.75, escala=120)
    b.blob((0, 0, 0.42), (0.58, 0.5, 0.42), m, cuerpo=True, n=14, shaper=lambda v: v * (1 + 0.07 * np.sin(v[:, 0:1] * 11) * np.sin(v[:, 2:3] * 9)))
    oscuro = fieltro('#C9547A', '#E88AA8', fuzz=0.8)
    for (x, z, k) in [(-0.35, 0.65, 1), (0.32, 0.7, 0.9), (0.42, 0.28, 0.8), (-0.45, 0.25, 0.7), (0.0, 0.84, 0.8)]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.1 * k, 0.04, 0.08 * k), oscuro, p, nrm, 'base', lift=0.02)
    pelitos(b, 20, (0, 0, 0.45), 0.55, 0.1, 0.014, oscuro, z_min=-0.1, bola=True, ondas=0.3)
    ojos(b, 0, 0.48, 0.12, sep=0.18, bravo=True, mirar=(0, -0.15), grosor_ceja=0.03)
    boca(b, 0, 0.25, 0.15, 'dientes')
    patas(b, 2, (0, 0), 0.36, 0.1, 0.1, 0.1, 0.08, m, rodilla=0.5, abertura=0.2)


def j_don_frasco(b):
    """Don Frasco: el tarro de champú con dosificador, con bigote y mal genio."""
    m = brillante('#9C6BD6', rough=0.2, coat=0.8, sss=0.15)
    b.torno([(0.0, 0.0), (0.36, 0.0), (0.4, 0.05), (0.4, 0.8), (0.3, 0.92), (0.14, 0.95), (0.0, 0.96)], m)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    blanco = brillante('#F7F7F7', rough=0.3)
    b.torno([(0.0, 0.0), (0.12, 0.0), (0.12, 0.12), (0.0, 0.12)], blanco)
    b.g['base'][-1].location = (0, 0, 0.94)
    b.tubo([(0, 0, 1.06), (0, 0, 1.2), (0.25, -0.02, 1.22), (0.32, -0.05, 1.18)], 0.04, blanco, 'base', segmentos=8)
    p, nrm = b.frente(0, 0.42)
    orientado(b, (0.28, 0.02, 0.2), plano('#FFF6E8', 0.6), p, nrm, 'base', lift=0.005)
    bigote = fieltro('#3A2C25', '#6B5446', fuzz=0.5)
    for s_ in (-1, 1):
        b.tubo([(0, -0.42, 0.5), (s_ * 0.12, -0.43, 0.49), (s_ * 0.2, -0.41, 0.52)], [0.04, 0.035, 0.015], bigote, 'base', segmentos=8)
    ojos(b, 0, 0.66, 0.11, sep=0.16, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.4, 0.12, 'brava')
    corona(b, (0, 0.0, 1.0), 0.17, 0.14)


def j_reina_pompa(b):
    b_pompa(b)
    corona(b, (0, 0.0, 0.86), 0.17, 0.16, color='#F2C14E', joyas=('#F7A8D8', '#A8E0F7'))
    for (x, z, r) in [(-0.55, 0.8, 0.12), (0.58, 0.7, 0.1), (0.5, 1.05, 0.07), (-0.45, 1.1, 0.08)]:
        b.blob((x, 0.0, z), (r, r, r), clay.material('Pompa reina', '#F3E6FF', rough=0.05, transmission=0.45, coat=1.0, sss=0.2), n=8)


def j_senor_cuchillas(b):
    b_cuchilla(b)
    metal = clay.material('Cuchilla extra', '#D9DEE6', rough=0.15, metallic=0.9, coat=0.4)
    for dz in (0.22, -0.22):
        b.blob((0, 0.08, 0.5 + dz), (0.42, 0.06, 0.06), metal, n=8, p=4.0)
    corona(b, (0, 0.04, 0.74), 0.15, 0.13)


def j_pote_crema(b):
    """El Pote de Crema Gigante: un tarro rosado lleno de crema que se le sale por arriba."""
    m = brillante('#F2B6C6', rough=0.25, coat=0.6, sss=0.1)
    b.torno([(0.0, 0.0), (0.5, 0.0), (0.52, 0.05), (0.52, 0.5), (0.46, 0.56), (0.0, 0.56)], m)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    crema = fieltro('#FFF8F0', '#FFFFFF', fuzz=0.3, rough=0.6)
    for (x, y, z, r) in [(0, 0, 0.62, 0.42), (-0.2, 0.05, 0.75, 0.24), (0.18, 0.0, 0.78, 0.22), (0.02, 0.02, 0.92, 0.18), (0.05, 0.0, 1.05, 0.08)]:
        b.blob((x, y, z), (r, r, r * 0.7), crema, n=10)
    p, nrm = b.frente(0, 0.26)
    orientado(b, (0.3, 0.02, 0.12), plano('#FFFFFF', 0.6), p, nrm, 'base', lift=0.005)
    ojos(b, 0, 0.34, 0.12, sep=0.2, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.14, 0.14, 'grande')
    corona(b, (0, 0.04, 1.02), 0.16, 0.14)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(lado * 0.45, 0.0, 0.08), (lado * 0.6, -0.05, 0.05 + 0.06 * s_ * lado), (lado * 0.65, -0.06, 0.0)], 0.06, m, grupo, segmentos=6)


# ----------------------------------------------------------------------------------------------------- El Desagüe
def b_bolita_pelo(b):
    """Bolita de pelos del sifón: chiquita, negra y enredada; llegan de a montones."""
    m = fieltro('#2E2624', '#5E4E4A', fuzz=0.9, escala=160)
    b.blob((0, 0, 0.4), (0.3, 0.28, 0.3), m, cuerpo=True, n=10)
    for k in range(14):
        a = k / 14 * TAU
        for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
            p0 = (math.cos(a) * 0.26, 0.0, 0.4 + math.sin(a) * 0.26)
            p1 = (math.cos(a + 0.4 * s_) * 0.44, -0.02, 0.4 + math.sin(a + 0.4 * s_) * 0.42)
            b.tubo([p0, p1], 0.012, m, grupo, segmentos=4)
    ojos(b, 0, 0.44, 0.09, sep=0.11, bravo=True, mirar=(0, -0.1), color_ceja='#8A7A76')
    boca(b, 0, 0.3, 0.07, 'brava')


def b_grasa_sifon(b):
    """Grasa del sifón: negra, brillante y pegajosa."""
    m = brillante('#2B2A22', rough=0.12, coat=1.0, sss=0.1)
    b.blob((0, 0, 0.38), (0.42, 0.38, 0.4), m, cuerpo=True, n=12, shaper=lambda v: v * (1 + 0.07 * np.sin(v[:, 0:1] * 10) * np.sin(v[:, 2:3] * 8)))
    b.blob((-0.15, -0.3, 0.56), (0.07, 0.02, 0.1), BRILLO, n=6)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        b.blob((0.32 * s_, -0.05, 0.06), (0.08, 0.08, 0.06), m, grupo, n=6)
    ojos(b, 0, 0.44, 0.1, sep=0.14, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.26, 0.1, 'dientes')


def b_gusanito(b):
    """Gusanito rojo del desagüe: se estira y se encoge para avanzar."""
    m = fieltro('#D9473E', '#FF8A80', fuzz=0.35, sss=0.25)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        pts = [(-0.5, 0.1, 0.12), (-0.25, 0.0, 0.2 + 0.08 * s_), (0.0, 0.0, 0.14), (0.22, -0.05, 0.22 - 0.06 * s_), (0.36, -0.1, 0.3)]
        b.tubo(pts, [0.09, 0.11, 0.12, 0.12, 0.13], m, grupo, segmentos=12)
    b.blob((0.36, -0.12, 0.36), (0.16, 0.14, 0.15), m, cuerpo=True, n=10)
    ojos(b, 0.36, 0.42, 0.06, sep=0.07, mirar=(0, -0.1))
    boca(b, 0.36, 0.3, 0.05, 'sonrisa')


def b_burbuja_gas(b):
    """Burbuja de gas del caño: verdosa, hinchada y con mal olor."""
    m = clay.material('Burbuja gas', '#B8D88A', rough=0.08, transmission=0.4, coat=1.0, coat_rough=0.03, sss=0.3)
    b.blob((0, 0, 0.5), (0.4, 0.38, 0.4), m, cuerpo=True, n=12)
    vaho = fieltro('#9FBF6A', '#D2E8A8', fuzz=0.6)
    for grupo, s_ in (('pasoA', 1), ('pasoB', 1.2)):
        for (x, z, r) in [(-0.36, 0.9, 0.08), (0.3, 0.98, 0.07), (0.0, 1.06, 0.06)]:
            b.blob((x * s_, 0.0, z), (r, r, r), vaho, grupo, n=6)
    ojos(b, 0, 0.52, 0.1, sep=0.14, mirar=(0, -0.1), estilo='dormilon')
    boca(b, 0, 0.34, 0.1, 'o')


def b_sapito(b):
    """Sapito del caño: verde, cachetón y brincón."""
    m = fieltro('#5FA85A', '#9FD89A', fuzz=0.4, sss=0.15)
    panza = fieltro('#E8E2A8', '#FFF8C8', fuzz=0.3)
    b.blob((0, 0, 0.32), (0.42, 0.38, 0.3), m, cuerpo=True, n=12)
    b.blob((0, -0.18, 0.28), (0.28, 0.2, 0.2), panza, n=10)
    for s_ in (-1, 1):
        b.blob((s_ * 0.2, -0.05, 0.6), (0.14, 0.13, 0.13), m, n=10)
    for grupo, f_ in (('pasoA', 1), ('pasoB', -1)):
        for s_ in (-1, 1):
            b.tubo([(s_ * 0.35, 0.1, 0.18), (s_ * 0.52, 0.18, 0.12 + 0.12 * (f_ > 0)), (s_ * 0.56, 0.0, 0.0)], 0.06, m, grupo, segmentos=8)
    ojos(b, 0, 0.6, 0.1, sep=0.2, mirar=(0, -0.12))
    boca(b, 0, 0.34, 0.16, 'sonrisa')
    cachetes(b, 0, 0.4, 0.3, 0.06)


def b_rejillita(b):
    """La rejillita del desagüe que se soltó: redonda, de metal, con sus huecos, y camina."""
    metal = clay.material('Rejilla', '#B8C0CA', rough=0.25, metallic=0.85, coat=0.3)
    b.torno([(0.0, 0.0), (0.44, 0.0), (0.46, 0.05), (0.44, 0.1), (0.0, 0.1)], metal)
    o = b.g['base'][-1]
    o.rotation_euler = (math.pi / 2 - 0.25, 0, 0)
    o.location = (0, 0.0, 0.46)
    b.cuerpo.append(o)
    b._surf = None
    # (las ranuras abajo, para que no le tapen los ojos)
    for k in range(5):
        x = -0.2 + k * 0.1
        b.tubo([(x, -0.1, 0.18), (x, -0.1, 0.32)], 0.02, plano('#2A2A30'), 'base', segmentos=4)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(lado * 0.3, 0.05, 0.1), (lado * 0.38, 0.0, 0.05 + 0.05 * s_ * lado), (lado * 0.4, -0.02, 0.0)], 0.04, metal, grupo, segmentos=6)
    ojos(b, 0, 0.56, 0.09, sep=0.15, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.36, 0.1, 'brava')


def b_lodo(b):
    """El lodo del caño: una montaña café y pesadísima con cositas atrapadas."""
    m = fieltro('#5A4632', '#8A7058', fuzz=0.5, rough=0.9)
    b.blob((0, 0, 0.4), (0.6, 0.5, 0.42), m, cuerpo=True, n=14, shaper=lambda v: v * (1 + 0.08 * np.sin(v[:, 0:1] * 9) * np.sin(v[:, 2:3] * 7)))
    for (x, z, c) in [(-0.35, 0.62, '#F2C14E'), (0.38, 0.55, '#E86A8A'), (0.1, 0.8, '#7DB7E8')]:
        p, nrm = b.frente(x, z)
        orientado(b, (0.06, 0.03, 0.05), brillante(c, 0.3), p, nrm, 'base', lift=0.01)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for (x, y) in [(-0.55, 0.1), (0.55, -0.05)]:
            b.blob((x + 0.06 * s_, y, 0.06), (0.14, 0.12, 0.06), m, grupo, n=6)
    ojos(b, 0, 0.5, 0.13, sep=0.2, bravo=True, mirar=(0, -0.15), grosor_ceja=0.035)
    boca(b, 0, 0.26, 0.17, 'grande')


def j_rey_sapo(b):
    b_sapito(b)
    corona(b, (0, 0.0, 0.78), 0.18, 0.16)
    capa = fieltro('#7A3BA8', '#B98AD8', fuzz=0.5)
    b.blob((0, 0.3, 0.32), (0.4, 0.08, 0.28), capa, n=10)


def j_pulpo_desague(b):
    """El Pulpo del Desagüe: morado, con tentáculos de pelo enredado."""
    m = fieltro('#8A5AB8', '#C49AE8', fuzz=0.45, sss=0.15)
    b.blob((0, 0, 0.62), (0.42, 0.38, 0.44), m, cuerpo=True, n=12)
    pelo = fieltro('#2E2624', '#5E4E4A', fuzz=0.8)
    for k in range(8):
        a = (k / 8) * math.pi + 0.2
        for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
            p0 = (math.cos(a) * 0.32, 0.0, 0.3)
            p1 = (math.cos(a) * 0.6, -0.05, 0.16 + 0.08 * s_)
            p2 = (math.cos(a) * 0.82 + 0.08 * s_, -0.1, 0.02)
            b.tubo([p0, p1, p2], [0.07, 0.05, 0.02], m, grupo, segmentos=8)
            b.tubo([p1, (p1[0] + 0.08, p1[1], p1[2] - 0.1)], 0.012, pelo, grupo, segmentos=4)
    ojos(b, 0, 0.66, 0.13, sep=0.18, bravo=True, mirar=(0, -0.15))
    boca(b, 0, 0.42, 0.13, 'o')
    corona(b, (0, 0.0, 1.0), 0.17, 0.15)


def j_boca_sifon(b):
    """La Boca del Sifón: el tubo en U del lavamanos convertido en una bocota con dientes."""
    metal = clay.material('Sifon', '#C9CED8', rough=0.25, metallic=0.85, coat=0.4)
    pts = [(-0.4, 0.0, 1.0), (-0.4, 0.0, 0.4), (-0.3, 0.0, 0.18), (0.0, 0.0, 0.1), (0.3, 0.0, 0.18), (0.4, 0.0, 0.4), (0.4, 0.0, 0.7)]
    b.tubo(pts, 0.17, metal, 'base', segmentos=16)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    b.torno([(0.0, 0.0), (0.22, 0.0), (0.22, 0.06), (0.0, 0.06)], metal)
    b.g['base'][-1].location = (0.4, 0, 0.7)
    oscuro = plano('#1A1418', 0.6)
    b.blob((0.4, 0.0, 0.77), (0.15, 0.15, 0.02), oscuro, n=8)
    for k in range(6):
        a = k / 6 * TAU
        b.blob((0.4 + math.cos(a) * 0.15, math.sin(a) * 0.15, 0.8), (0.035, 0.035, 0.05), DIENTE, n=6)
    ojos(b, -0.05, 0.42, 0.12, sep=0.2, bravo=True, mirar=(0, -0.15))
    boca(b, 0.0, 0.22, 0.14, 'colmillos')
    corona(b, (-0.4, 0.0, 1.12), 0.16, 0.14)


def j_reina_grasa(b):
    b_grasa_sifon(b)
    corona(b, (0, 0.04, 0.78), 0.2, 0.18, color='#F2C14E', joyas=('#2B2A22', '#E86A8A'))
    for (x, z, r) in [(-0.5, 0.2, 0.1), (0.52, 0.15, 0.09), (0.0, -0.02, 0.08)]:
        b.blob((x, -0.1, z), (r, r, r * 0.6), brillante('#2B2A22', rough=0.12, coat=1.0), n=6)



# ----------------------------------------------------------------------------------------------------- La Matera de la ventana
def hojita(b, base, dir_, largo, ancho, mat, grupo='base', curva=0.35):
    """Una hoja de fieltro: un blob aplanado que sale de base hacia dir_ (construida en el origen y movida)."""
    d = np.array(dir_, dtype=float)
    d /= np.linalg.norm(d) or 1
    o = clay.blob(b.nom(), (0, 0, 0), (ancho, ancho * 0.22, largo * 0.5), b.coll, mat, n=8, subsurf=1,
                  shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.55 * np.clip(v[:, 2] / (largo * 0.5), 0, 1) ** 2),
                                                    v[:, 1] + curva * (v[:, 2] / (largo * 0.5)) ** 2 * ancho, v[:, 2]]))
    clay.orient_to(o, tuple(d))
    o.location = Vector(np.array(base) + d * largo * 0.5)
    b.add(o, grupo)
    # La vena del centro
    b.tubo([tuple(np.array(base) + d * largo * 0.1 - np.array([0, ancho * 0.25, 0])), tuple(np.array(base) + d * largo * 0.85 - np.array([0, ancho * 0.25, 0]))],
           ancho * 0.06, fieltro('#4E8A3A'), grupo, segmentos=4)
    return o


def b_brotecito(b):
    """Brotecito: una semillita gordita que acaba de echar dos hojas. No camina: espera a que pases."""
    m = fieltro('#9BCB5C', '#D4F09A', fuzz=0.45, sss=0.12)
    hoja = fieltro('#6DB04A', '#B8E68A', fuzz=0.4)
    b.blob((0, 0, 0.3), (0.32, 0.29, 0.3), m, cuerpo=True, n=12)
    b.tubo([(0, 0.02, 0.56), (0.0, 0.03, 0.7), (0.02, 0.03, 0.78)], 0.035, hoja, segmentos=6)
    for grupo, s_ in (('pasoA', 0.0), ('pasoB', 0.18)):
        hojita(b, (0.0, 0.03, 0.76), (-1, 0, 0.55 + s_), 0.34, 0.12, hoja, grupo)
        hojita(b, (0.0, 0.03, 0.76), (1, 0, 0.55 - s_), 0.34, 0.12, hoja, grupo)
    tierra = fieltro('#6B4A34', '#8A6A50', fuzz=0.6)
    for k in range(6):
        a = k / 6 * TAU
        b.blob((math.cos(a) * 0.3, math.sin(a) * 0.26, 0.02), (0.1, 0.08, 0.05), tierra, n=6)
    ojos(b, 0, 0.32, 0.085, sep=0.11, estilo='dormilon', mirar=(0, -0.1))
    boca(b, 0, 0.19, 0.07, 'sonrisa')
    cachetes(b, 0, 0.24, 0.19, 0.045)


def b_cactus(b):
    """Cactus de la ventana: redondo, con costillas, espinas y una flor rosada; bravo porque nadie lo abraza."""
    m = fieltro('#4F9A5A', '#8FD08A', fuzz=0.4, sss=0.08)
    b.blob((0, 0, 0.38), (0.36, 0.33, 0.38), m, cuerpo=True, n=14,
           shaper=lambda v: v * (1 + 0.06 * np.cos(np.arctan2(v[:, 1:2], v[:, 0:1]) * 8)))
    raya = fieltro('#3E7E48', '#6FB070', fuzz=0.3)
    for k in range(8):
        a = k / 8 * TAU + TAU / 16
        if math.sin(a) < -0.55:
            continue
        pts = [(math.cos(a) * 0.36 * math.sin(t), math.sin(a) * 0.33 * math.sin(t), 0.38 - 0.38 * math.cos(t)) for t in np.linspace(0.35, 2.8, 6)]
        b.tubo(pts, 0.012, raya, segmentos=4)
    espina = plano('#FFF6DA', 0.5)
    for k in range(26):
        a = k * 2.399
        z = 0.08 + (k * 0.618 % 1) * 0.6
        r = math.sqrt(max(0.0, 1 - ((z - 0.38) / 0.38) ** 2))
        d = np.array([math.cos(a) * r, math.sin(a) * r * 0.92, (z - 0.38) / 0.38 * 0.8])
        if d[1] < -0.55 and abs(d[0]) < 0.5 and 0.15 < z < 0.6:
            continue  # la carita sin espinas
        base = np.array([math.cos(a) * 0.36 * r, math.sin(a) * 0.33 * r, z])
        b.tubo([tuple(base), tuple(base + d / (np.linalg.norm(d) or 1) * 0.1)], 0.01, espina, segmentos=4, caps=('round', 'point'))
    flor = fieltro('#F27BA0', '#FFC2D4', fuzz=0.35)
    for grupo, s_ in (('pasoA', 0), ('pasoB', 0.3)):
        for k in range(6):
            a = k / 6 * TAU + s_
            o = clay.blob(b.nom(), (0, 0, 0), (0.07, 0.04, 0.03), b.coll, flor, n=6, subsurf=1)
            o.rotation_euler = (0.4 * math.sin(a), -0.4 * math.cos(a), a)
            o.location = (math.cos(a) * 0.07, math.sin(a) * 0.07 + 0.04, 0.78)
            b.add(o, grupo)
    b.blob((0, 0.04, 0.8), (0.04, 0.04, 0.03), fieltro('#F7D046', '#FFF0A0'), n=6)
    ojos(b, 0, 0.42, 0.095, sep=0.13, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.27, 0.09, 'brava')
    cachetes(b, 0, 0.33, 0.21, 0.045)


def b_atrapamoscas(b):
    """La atrapamoscas: una boca de planta con dientes verdes sobre un tallito. Quieta, pero muerde si te acercas."""
    tallo = fieltro('#5E9A44', '#9CD07A', fuzz=0.4)
    afuera = fieltro('#7DBA4E', '#B8E68A', fuzz=0.4, sss=0.1)
    adentro = fieltro('#D9475A', '#FF8A9A', fuzz=0.3)
    b.tubo([(0, 0.05, 0.0), (0.03, 0.04, 0.2), (0.0, 0.02, 0.36)], [0.06, 0.05, 0.05], tallo, segmentos=8)
    for s_ in (-1, 1):
        hojita(b, (0.0, 0.05, 0.04), (s_ * 1, 0.1, 0.25), 0.3, 0.1, tallo)
    # Cabeza: el lóbulo de arriba (con la carita) y el de abajo
    b.blob((0, 0, 0.6), (0.3, 0.26, 0.2), afuera, cuerpo=True, n=12)
    for grupo, ab in (('pasoA', 0.0), ('pasoB', 0.08)):
        b.blob((0, -0.02, 0.4 - ab), (0.28, 0.24, 0.12), afuera, grupo, n=12)
        b.blob((0, -0.05, 0.47 - ab * 0.5), (0.24, 0.2, 0.05 + ab * 0.6), adentro, grupo, n=10)
        for k in range(9):
            t = (k / 8 - 0.5) * 2.4
            x, y = math.sin(t) * 0.27, -math.cos(t) * 0.23
            b.tubo([(x, y, 0.5 - ab * 0.2), (x * 1.08, y * 1.1, 0.42 - ab)], 0.014, plano('#E8F5C8', 0.5), grupo, segmentos=4, caps=('round', 'point'))
            b.tubo([(x, y, 0.46), (x * 1.08, y * 1.1, 0.53)], 0.014, plano('#E8F5C8', 0.5), grupo, segmentos=4, caps=('round', 'point'))
    ojos(b, 0, 0.66, 0.085, sep=0.12, bravo=True, mirar=(0, -0.14))
    manchas(b, [(-0.2, 0.62, 1.0), (0.21, 0.6, 0.8)], 0.03, '#C94A5A')


def b_caracol(b):
    """Caracol de la matera: lento, babosito y con su casita de espiral a la espalda."""
    piel = fieltro('#E8C9A0', '#FFE8C8', fuzz=0.35, sss=0.2)
    concha = fieltro('#C97A4A', '#F2B080', fuzz=0.45)
    raya = fieltro('#8A4A2A', '#B8724A', fuzz=0.3)
    for grupo, s_ in (('pasoA', 0.0), ('pasoB', 0.05)):
        b.tubo([(-0.45, 0.05, 0.06), (-0.1 - s_, 0.0, 0.08), (0.25, -0.05, 0.12), (0.36, -0.1, 0.3)], [0.06, 0.1, 0.12, 0.13], piel, grupo, segmentos=10)
    b.blob((0.36, -0.12, 0.38), (0.14, 0.13, 0.14), piel, cuerpo=True, n=10)
    b.blob((-0.1, 0.06, 0.38), (0.3, 0.2, 0.3), concha, n=12)
    pts = []
    for k in range(40):
        t = k / 39
        a = t * 2.6 * TAU
        r = 0.27 * (1 - t * 0.85)
        pts.append((-0.1 + math.cos(a) * r, -0.15, 0.38 + math.sin(a) * r))
    b.tubo(pts, 0.025, raya, segmentos=6)
    antenas(b, [(0.32, -0.15, 0.48), (0.42, -0.15, 0.48)], 0.22, 0.018, piel, bola_mat=fieltro('#3A2A24'))
    ojos(b, 0.37, 0.4, 0.06, sep=0.07, mirar=(0, -0.1), estilo='dormilon')
    boca(b, 0.37, 0.3, 0.05, 'sonrisa')


def b_diente_leon(b):
    """Semillita de diente de león: un pompón blanco con carita que el viento trae flotando."""
    m = fieltro('#FFFDF4', '#FFFFFF', fuzz=0.9, escala=180)
    b.blob((0, 0, 0.42), (0.2, 0.18, 0.2), fieltro('#E8E0B8', '#FFF8D8', fuzz=0.5), cuerpo=True, n=10)
    pelitos(b, 34, (0, 0.04, 0.42), 0.2, 0.24, 0.011, m, z_min=-0.45, bola=True, ondas=0.1, mat_bola=fieltro('#FFFFFF', fuzz=0.9))
    # Un halo de pelusa detrás para que se vea esponjoso
    b.blob((0, 0.12, 0.46), (0.36, 0.06, 0.34), fieltro('#FFFDF4', '#FFFFFF', fuzz=1.0, escala=220), n=10)
    b.tubo([(0, 0.02, 0.22), (0.02, 0.03, 0.1), (0.0, 0.03, 0.0)], 0.014, fieltro('#B8C878'), segmentos=4)
    ojos(b, 0, 0.44, 0.06, sep=0.075, mirar=(0, -0.1))
    boca(b, 0, 0.35, 0.05, 'o')


def b_enredadera(b):
    """Enredadera: un nudo de bejucos con hojas, terca como ella sola; tapa el camino."""
    m = fieltro('#4C8A3A', '#86C26A', fuzz=0.45)
    hoja = fieltro('#62A84A', '#A8DC88', fuzz=0.4)
    b.blob((0, 0, 0.42), (0.36, 0.32, 0.36), fieltro('#3E7230', '#6AA050', fuzz=0.6), cuerpo=True, n=12)
    for k in range(7):
        a = k / 7 * TAU
        pts = [(math.cos(a + t) * (0.34 + 0.04 * math.sin(t * 3)), math.sin(a + t) * 0.3 * (0.6 if math.sin(a + t) < 0 else 1),
                0.42 + math.sin(t * 2 + k) * 0.3) for t in np.linspace(0, 2.4, 7)]
        b.tubo(pts, 0.035, m, segmentos=6)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for k in range(6):
            a = k / 6 * TAU + 0.3
            if math.sin(a) < -0.5 and abs(math.cos(a)) < 0.7:
                continue  # ninguna hoja encima de la cara
            base = (math.cos(a) * 0.34, math.sin(a) * 0.28 + 0.05, 0.42 + math.sin(a * 2) * 0.25)
            hojita(b, base, (math.cos(a + 0.3 * s_), math.sin(a) * 0.5 + 0.3, 0.4), 0.2, 0.08, hoja, grupo)
    ojos(b, 0, 0.46, 0.09, sep=0.13, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.3, 0.09, 'dientes')


def b_helecho(b):
    """Helecho de la ducha: frondoso y enorme, con carita escondida entre las hojas."""
    m = fieltro('#6FA85A', '#A8DC8A', fuzz=0.45, sss=0.1)
    hoja = fieltro('#58A04A', '#9AD87A', fuzz=0.4)
    b.blob((0, 0, 0.3), (0.34, 0.3, 0.3), m, cuerpo=True, n=12)
    for grupo, s_ in (('pasoA', 0), ('pasoB', 0.12)):
        for k in range(9):
            a = math.pi * (0.1 + 0.8 * k / 8)
            d = (math.cos(a) * 1.0, 0.25 + 0.2 * (k % 2), math.sin(a) * 0.9 + s_ * (1 if k % 2 else -1))
            base = (math.cos(a) * 0.2, 0.08, 0.42)
            dd = np.array(d) / np.linalg.norm(d)
            pts = [tuple(np.array(base) + dd * 0.65 * t + np.array([0, 0, -0.25 * t * t])) for t in np.linspace(0, 1, 5)]
            b.tubo(pts, 0.02, fieltro('#3E7E36'), grupo, segmentos=4)
            for q in range(1, 6):
                t = q / 6
                c = np.array(base) + dd * 0.65 * t + np.array([0, 0, -0.25 * t * t])
                for lado in (-1, 1):
                    lat = np.cross(dd, [0, 1, 0]) * lado
                    hojita(b, tuple(c), tuple(lat + dd * 0.4 + np.array([0, -0.2, 0.1])), 0.14 * (1 - t * 0.6), 0.045, hoja, grupo, curva=0.2)
    ojos(b, 0, 0.3, 0.09, sep=0.12, mirar=(0, -0.1))
    boca(b, 0, 0.17, 0.08, 'sonrisa')
    cachetes(b, 0, 0.22, 0.2, 0.05)


def j_don_cactus(b):
    b_cactus(b)
    corona(b, (0, 0.04, 0.76), 0.17, 0.16)
    for s_ in (-1, 1):
        for grupo, f_ in (('pasoA', 1), ('pasoB', -1)):
            b.tubo([(s_ * 0.3, 0.0, 0.42), (s_ * 0.48, -0.02, 0.46), (s_ * 0.52, -0.02, 0.62 + 0.06 * f_ * s_)], [0.09, 0.08, 0.08],
                   fieltro('#4F9A5A', '#8FD08A', fuzz=0.4), grupo, segmentos=8)


def j_atrapamoscas_gigante(b):
    b_atrapamoscas(b)
    corona(b, (0, 0.02, 0.76), 0.16, 0.15)


def j_matera_gigante(b):
    """La Matera Gigante: una matera de barro que camina, con un girasol enorme y bravo (la cara va en el girasol)."""
    barro = fieltro('#C8683E', '#E89A70', fuzz=0.35, rough=0.8)
    b.torno([(0.0, 0.0), (0.3, 0.0), (0.4, 0.42), (0.44, 0.44), (0.46, 0.52), (0.42, 0.54), (0.0, 0.54)], barro)
    tierra = fieltro('#5A3E2A', '#7A5A40', fuzz=0.6)
    b.blob((0, 0, 0.54), (0.4, 0.4, 0.04), tierra, n=10)
    # La franja pintada de la matera, con corazoncitos
    for k in range(7):
        a = math.pi * (1.15 + 0.7 * k / 6)
        b.blob((math.cos(a) * 0.36, math.sin(a) * 0.36, 0.26), (0.045, 0.02, 0.04), fieltro('#F2E2C8', '#FFFFFF', fuzz=0.3), n=6)
    tallo = fieltro('#5E9A44', '#9CD07A', fuzz=0.4)
    b.tubo([(0, 0.05, 0.54), (0.03, 0.06, 0.78), (0.0, 0.08, 0.98)], 0.06, tallo, segmentos=8)
    for s_ in (-1, 1):
        hojita(b, (0.0, 0.06, 0.72), (s_, -0.1, 0.45), 0.34, 0.12, tallo)
    petalo = fieltro('#F7C531', '#FFE68A', fuzz=0.35)
    petalo2 = fieltro('#F2A91E', '#FFD66A', fuzz=0.35)
    for grupo, s_ in (('pasoA', 0.0), ('pasoB', 0.12)):
        for k in range(13):
            a = k / 13 * TAU + s_
            o = clay.blob(b.nom(), (0, 0, 0), (0.16, 0.035, 0.065), b.coll, petalo if k % 2 else petalo2, n=8, subsurf=1,
                          shaper=lambda v: np.column_stack([v[:, 0], v[:, 1] - 0.03 * (v[:, 0] / 0.16) ** 2, v[:, 2] * (1 - 0.5 * np.clip(v[:, 0] / 0.16, 0, 1) ** 2)]))
            o.rotation_euler = (0, -a, 0)
            o.location = (math.cos(a) * 0.36, 0.08, 1.16 + math.sin(a) * 0.36)
            b.add(o, grupo)
    centro = fieltro('#6A4428', '#8A6040', fuzz=0.7, escala=150)
    b.blob((0, 0.04, 1.16), (0.25, 0.09, 0.25), centro, cuerpo=True, n=12)
    semilla = fieltro('#4A2E1A', '#6A4A30', fuzz=0.5)
    for k in range(18):
        a = k * 2.399
        r = 0.21 * math.sqrt((k + 0.5) / 18)
        x, z = math.cos(a) * r, 1.16 + math.sin(a) * r
        if abs(x) < 0.17 and 1.02 < z < 1.27:
            continue  # la carita sin semillas
        p_, n_ = b.frente(x, z)
        orientado(b, (0.018, 0.008, 0.018), semilla, p_, n_, 'base', lift=0.004)
    ojos(b, 0, 1.2, 0.07, sep=0.1, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 1.08, 0.07, 'colmillos')
    cachetes(b, 0, 1.12, 0.16, 0.035, color='#E8805A')
    corona(b, (0, 0.06, 1.52), 0.14, 0.14)
    for grupo, f_ in (('pasoA', 1), ('pasoB', -1)):
        for s_ in (-1, 1):
            b.tubo([(s_ * 0.18, 0.0, 0.08), (s_ * 0.22, -0.04 * f_ * s_, 0.03), (s_ * 0.24, -0.08 * f_ * s_, 0.0)], 0.06, barro, grupo, segmentos=6)
            b.blob((s_ * 0.24, -0.1 * f_ * s_, 0.02), (0.08, 0.1, 0.04), barro, grupo, n=6)


# ----------------------------------------------------------------------------------------------------- El Tobogán del desagüe
def b_patito_hule(b):
    """Patito de hule que bajó por el tobogán: amarillo, brillante y en manada."""
    m = brillante('#F7D046', rough=0.22, coat=0.7, sss=0.1)
    b.blob((0, 0.02, 0.22), (0.3, 0.24, 0.2), m, n=12, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], v[:, 2] + 0.35 * np.clip(-v[:, 0], 0, 1) ** 2]))
    b.blob((0.06, -0.02, 0.5), (0.2, 0.18, 0.18), m, cuerpo=True, n=12)
    b.blob((0.06, -0.21, 0.44), (0.09, 0.07, 0.035), brillante('#F29B38', rough=0.3, coat=0.5), 'boca', n=8)
    b.blob((0.06, -0.21, 0.42), (0.09, 0.08, 0.06), brillante('#F29B38', rough=0.3, coat=0.5), 'bocaGolpe', n=8)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            o = clay.blob(b.nom(), (0, 0, 0), (0.12, 0.05, 0.08), b.coll, m, n=8, subsurf=1)
            o.rotation_euler = (0, lado * (0.4 + 0.3 * s_), 0)
            o.location = (lado * 0.27, 0.04, 0.26 + 0.04 * s_)
            b.add(o, grupo)
    ojos(b, 0.06, 0.56, 0.06, sep=0.08, mirar=(0, -0.1))
    cachetes(b, 0.06, 0.48, 0.13, 0.035)


def b_chancleta(b):
    """Chancleta perdida en el tobogán: parada en el talón, quietica… y de pronto ¡se lanza de chancletazo!"""
    suela = fieltro('#5AA6E0', '#9FD0F7', fuzz=0.3)
    borde = fieltro('#FFFFFF', '#FFFFFF', fuzz=0.2)
    tira = fieltro('#F27BA0', '#FFB8CC', fuzz=0.3)
    forma = lambda v: np.column_stack([v[:, 0] * (0.82 + 0.3 * np.clip((v[:, 2] - 0.0) / 0.42, -1, 1) * 0.5), v[:, 1], v[:, 2]])
    b.blob((0, 0.04, 0.46), (0.25, 0.07, 0.44), borde, n=12, shaper=forma)
    b.blob((0, 0.0, 0.46), (0.23, 0.06, 0.42), suela, cuerpo=True, n=12, shaper=forma)
    # La tira en Y (de la puntera a los lados) y su botoncito
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(0.0, -0.08, 0.72), (lado * 0.1, -0.14, 0.62 + 0.02 * s_), (lado * 0.2, -0.07, 0.48)], 0.03, tira, grupo, segmentos=6)
        b.blob((0.0, -0.09, 0.73), (0.04, 0.03, 0.04), tira, grupo, n=6)
    ojos(b, 0, 0.42, 0.075, sep=0.1, bravo=True, mirar=(0, -0.1))
    boca(b, 0, 0.27, 0.07, 'dientes')
    cachetes(b, 0, 0.33, 0.15, 0.035)
    # Gotitas de agua alrededor (en el paso salpica)
    agua = clay.material('Gotas chancla', '#BFE6F7', rough=0.05, transmission=0.6, coat=1.0, coat_rough=0.03)
    for (x, z, r) in [(-0.3, 0.12, 0.03), (0.32, 0.18, 0.025), (0.28, 0.05, 0.02)]:
        b.blob((x, -0.05, z), (r, r, r * 1.3), agua, 'pasoB', n=6)


def j_pato_inflable(b):
    """El Pato Inflable Gigante: de piscina, brillante, con su válvula y su corona."""
    m = brillante('#F7D046', rough=0.15, coat=0.9, sss=0.05)
    b.blob((0, 0.04, 0.3), (0.5, 0.42, 0.3), m, n=14, shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], v[:, 2] + 0.4 * np.clip(-v[:, 0], 0, 1) ** 2]))
    # El hueco del flotador (por donde se mete uno)
    b.blob((0.08, 0.06, 0.58), (0.24, 0.2, 0.04), fieltro('#3A6A8A', '#5A8AAA', fuzz=0.2), n=10)
    b.tubo([(0.2, -0.06, 0.4), (0.18, -0.1, 0.65), (0.12, -0.12, 0.85)], [0.16, 0.14, 0.14], m, segmentos=12)
    b.blob((0.1, -0.14, 0.95), (0.24, 0.22, 0.22), m, cuerpo=True, n=12)
    b.blob((0.1, -0.36, 0.88), (0.13, 0.1, 0.05), brillante('#F29B38', rough=0.25, coat=0.6), 'boca', n=8)
    b.blob((0.1, -0.36, 0.86), (0.13, 0.1, 0.09), brillante('#F29B38', rough=0.25, coat=0.6), 'bocaGolpe', n=8)
    # Costuras del plástico y la válvula
    for k in range(5):
        a = math.pi * (0.1 + 0.8 * k / 4)
        b.tubo([(math.cos(a) * 0.48, math.sin(a) * 0.4 + 0.04, 0.3), (math.cos(a) * 0.3, math.sin(a) * 0.25 + 0.04, 0.55)], 0.008, plano('#E0B030', 0.3), segmentos=4)
    b.tubo([(-0.42, 0.1, 0.4), (-0.48, 0.12, 0.46)], 0.03, plano('#FFFFFF', 0.3), segmentos=6)
    b.blob((-0.1, -0.35, 0.36), (0.1, 0.02, 0.06), BRILLO, n=6)
    ojos(b, 0.1, 1.0, 0.075, sep=0.1, bravo=True, mirar=(0, -0.12))
    cachetes(b, 0.1, 0.92, 0.16, 0.04)
    corona(b, (0.1, -0.12, 1.12), 0.13, 0.13)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.blob((lado * 0.44, 0.0, 0.08 + 0.04 * s_ * lado), (0.12, 0.16, 0.04), brillante('#F29B38', rough=0.3, coat=0.5), grupo, n=8)


def j_dona_flotador(b):
    """La Dona Flotadora: un flotador rosado de dona con chispitas, que da vueltas y vueltas."""
    m = brillante('#F59AB5', rough=0.18, coat=0.85, sss=0.05)
    o = clay.lathe(b.nom(), [(0.18, 0.0), (0.3, -0.13), (0.45, -0.1), (0.52, 0.0), (0.45, 0.1), (0.3, 0.13), (0.18, 0.0)], b.coll, m, segments=36, subsurf=1,
                   cap_bottom=False, cap_top=False)
    o.rotation_euler = (math.pi / 2 - 0.35, 0, 0)
    o.location = (0, 0, 0.55)
    b.add(o)
    b.cuerpo.append(o)
    b._surf = None
    glaseado = brillante('#FFFFFF', rough=0.3, coat=0.5)
    colores = ['#7DB7E8', '#F7D046', '#7FCB5A', '#E86A8A', '#9C6BD6']
    for k in range(22):
        a = k * 2.399
        r = 0.27 + 0.18 * ((k * 0.618) % 1)
        x, z = math.cos(a) * r, 0.55 + math.sin(a) * r * 0.94
        if abs(x) < 0.3 and z > 0.72:
            continue  # la carita sin chispitas
        p_, n_ = b.frente(x, z)
        if p_ is None:
            continue
        o2 = clay.blob(b.nom(), (0, 0, 0), (0.035, 0.012, 0.012), b.coll, plano(colores[k % 5], 0.4), n=5, subsurf=1)
        clay.orient_to(o2, tuple(n_))
        o2.rotation_mode = 'XYZ'
        o2.rotation_euler.rotate_axis('Z', a)
        o2.location = Vector(p_ + n_ * 0.01)
        b.add(o2)
    ojos(b, 0, 0.95, 0.085, sep=0.14, bravo=True, mirar=(0, -0.12))
    boca(b, 0, 0.82, 0.075, 'colmillos')
    cachetes(b, 0, 0.86, 0.25, 0.04)
    corona(b, (0, 0.05, 1.04), 0.14, 0.13)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(lado * 0.4, -0.05, 0.25), (lado * 0.5, -0.08, 0.12 + 0.05 * s_ * lado), (lado * 0.48, -0.1, 0.0)], 0.05, m, grupo, segmentos=6)


# ----------------------------------------------------------------------------------------------------- El Laberinto de la cortina
def b_ratoncito(b, jefe=False):
    """Ratoncito de la cortina: gris, orejón y loco por los quesitos de jabón."""
    m = fieltro('#A9A4A8', '#D8D4D8', fuzz=0.6, escala=120)
    rosa = fieltro('#F2A7B8', '#FFD0DA', fuzz=0.3)
    b.blob((0, 0.06, 0.26), (0.32, 0.36, 0.26), m, n=12)
    b.blob((0, -0.16, 0.42), (0.26, 0.24, 0.24), m, cuerpo=True, n=12)
    b.blob((0, -0.36, 0.38), (0.07, 0.05, 0.06), rosa, n=8)
    for s_ in (-1, 1):
        b.blob((s_ * 0.24, -0.08, 0.66), (0.16, 0.04, 0.16), m, n=10)
        b.blob((s_ * 0.24, -0.1, 0.66), (0.11, 0.02, 0.11), rosa, n=8)
        for k in range(3):
            b.tubo([(s_ * 0.1, -0.38, 0.38 - k * 0.025), (s_ * 0.3, -0.42, 0.4 - k * 0.05)], 0.005, plano('#3A3236', 0.4), segmentos=4)
    for grupo, f_ in (('pasoA', 1), ('pasoB', -1)):
        b.tubo([(0.0, 0.38, 0.14), (0.18 * f_, 0.6, 0.2), (0.3 * f_, 0.62, 0.42), (0.22 * f_, 0.6, 0.55)], 0.022, rosa, grupo, segmentos=6)
        for s_ in (-1, 1):
            b.blob((s_ * 0.2, -0.12 + 0.05 * f_ * s_, 0.04), (0.07, 0.09, 0.04), rosa, grupo, n=6)
    ojos(b, 0, 0.5, 0.075, sep=0.1, bravo=jefe, mirar=(0, -0.12))
    boca(b, 0, 0.33, 0.05, 'dientes')
    cachetes(b, 0, 0.4, 0.17, 0.035)


def j_rey_raton(b):
    """El Rey Ratón: gordo, con capa, corona y un quesito de jabón mordido en la mano."""
    b_ratoncito(b, jefe=True)
    capa = fieltro('#7A3BA8', '#B98AD8', fuzz=0.5)
    b.blob((0, 0.26, 0.3), (0.36, 0.08, 0.28), capa, n=10)
    b.blob((0, -0.02, 0.5), (0.24, 0.12, 0.04), fieltro('#FFFFFF', '#FFFFFF', fuzz=0.8), n=8)
    corona(b, (0, -0.12, 0.66), 0.13, 0.12)
    queso = brillante('#F7D46A', rough=0.3, coat=0.5, sss=0.2)
    b.blob((0.34, -0.2, 0.3), (0.1, 0.06, 0.08), queso, n=8)
    for (x, z) in ((0.3, 0.32), (0.38, 0.28)):
        b.blob((x, -0.26, z), (0.02, 0.01, 0.02), plano('#D8A830', 0.4), n=5)


# ----------------------------------------------------------------------------------------------------- La Feria de las cremas
def b_pompita_crema(b, jefe=False):
    """Pompita de crema: un copito de crema batida en espiral, con su fresita de corona y alitas de merengue."""
    crema = fieltro('#FFF7EC', '#FFFFFF', fuzz=0.35, rough=0.7, escala=110)
    fresa = fieltro('#F48BA8', '#FFC2D2', fuzz=0.3, rough=0.6)
    # Tres pisos de crema (el de abajo es la cara) y la punta torcida
    b.blob((0, 0, 0.3), (0.36, 0.33, 0.26), crema, cuerpo=True, n=12, shaper=lambda v: v * (1 + 0.05 * np.sin(np.arctan2(v[:, 1:2], v[:, 0:1]) * 6)))
    b.blob((0.02, 0.02, 0.55), (0.25, 0.23, 0.17), crema, n=10, shaper=lambda v: v * (1 + 0.06 * np.sin(np.arctan2(v[:, 1:2], v[:, 0:1]) * 6 + 1)))
    b.blob((0.04, 0.03, 0.72), (0.14, 0.13, 0.11), crema, n=8)
    b.tubo([(0.04, 0.03, 0.8), (0.07, 0.02, 0.88), (0.0, 0.02, 0.93)], [0.07, 0.04, 0.012], crema, segmentos=8)
    # La rayita de fresa que da la vuelta
    for k in range(9):
        a = k / 9 * TAU
        r, z = (0.34, 0.42) if k % 2 else (0.24, 0.62)
        if abs(math.cos(a)) < 0.55 and math.sin(a) < 0:
            continue  # la carita limpia
        b.blob((math.cos(a) * r, math.sin(a) * r * 0.92, z), (0.05, 0.035, 0.03), fresa, n=6)
    # Chispitas de colores
    for k, c in enumerate(['#7DB7E8', '#F7D046', '#7FCB5A', '#E86A8A', '#9C6BD6', '#7DB7E8']):
        a = 0.7 + k * 1.05
        b.blob((math.cos(a) * 0.22, math.sin(a) * 0.2 + 0.05, 0.58 + 0.07 * math.sin(k * 2.1)), (0.03, 0.012, 0.012), plano(c, 0.4), n=5)
    if not jefe:
        # La fresita de corona
        b.blob((0.0, 0.03, 0.98), (0.07, 0.07, 0.08), brillante('#E4392B', rough=0.3, coat=0.6), n=8)
        for k in range(3):
            a = k / 3 * TAU
            b.blob((math.cos(a) * 0.04, 0.03 + math.sin(a) * 0.04, 1.05), (0.03, 0.03, 0.012), plano('#5FAE4A', 0.5), n=5)
    # Alitas de merengue que aletean
    alas(b, (0, 0.05, 0.42), 0.17, color='#FFF1F6', angulo=0.55, lado_x=0.26)
    ojos(b, 0, 0.33, 0.09, sep=0.13, mirar=(0.05, -0.1), estilo='loco')
    boca(b, 0, 0.17, 0.08, 'sonrisa')
    cachetes(b, 0, 0.24, 0.22, 0.04)


def b_tubito_crema(b):
    """Tubito de crema de manos: aplastadito, con su tapa y la colita doblada; brinca apretándose solo."""
    m = brillante('#8FD8C8', rough=0.3, coat=0.6, sss=0.1)
    blanco = brillante('#FFFDF8', rough=0.35, coat=0.4)
    b.blob((0, 0, 0.42), (0.26, 0.14, 0.34), m, cuerpo=True, n=12, p=2.6, shaper=lambda v: np.column_stack([v[:, 0] * (1 + 0.25 * np.clip(-v[:, 2], 0, 1)), v[:, 1] * (1 - 0.6 * np.clip(-v[:, 2], 0, 1)), v[:, 2]]))
    # La colita doblada (abajo) y la tapa (arriba)
    b.blob((0, 0, 0.07), (0.31, 0.04, 0.05), m, n=8, p=4.0)
    for x in np.linspace(-0.24, 0.24, 7):
        b.blob((x, -0.04, 0.07), (0.012, 0.008, 0.035), plano('#6AB8A8', 0.4), n=4)
    b.torno([(0.0, 0.0), (0.09, 0.0), (0.1, 0.02), (0.1, 0.12), (0.08, 0.14), (0.0, 0.14)], blanco)
    b.g['base'][-1].location = (0, 0, 0.73)
    for k in range(10):
        a = k / 10 * TAU
        b.blob((math.cos(a) * 0.1, math.sin(a) * 0.1, 0.8), (0.008, 0.008, 0.05), plano('#E6E0D8', 0.4), n=4)
    # La etiqueta con un corazón
    p, nrm = b.frente(0, 0.46)
    orientado(b, (0.19, 0.015, 0.12), blanco, p, nrm, 'base', lift=0.005)
    q, nq = b.frente(0.0, 0.5)
    orientado(b, (0.035, 0.01, 0.03), fieltro('#E86A8A', fuzz=0.2), q, nq, 'base', lift=0.02)
    # El chorrito de crema que se le sale al brincar
    crema = fieltro('#FFF7EC', '#FFFFFF', fuzz=0.3, rough=0.7)
    b.tubo([(0, 0, 0.88), (0.05, -0.02, 0.98), (0.0, -0.02, 1.04)], [0.05, 0.04, 0.015], crema, 'pasoB', segmentos=8)
    b.blob((0, 0, 0.9), (0.06, 0.06, 0.04), crema, 'pasoA', n=6)
    # Patitas y manitos
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.tubo([(lado * 0.24, 0.0, 0.42), (lado * 0.34, -0.04, 0.4 + 0.08 * s_), (lado * 0.38, -0.05, 0.46 + 0.1 * s_)], 0.03, m, grupo, segmentos=6)
            b.blob((lado * 0.39, -0.05, 0.47 + 0.1 * s_), (0.045,) * 3, blanco, grupo, n=6)
            b.blob((lado * 0.13, -0.03, 0.0 + 0.03 * (s_ * lado > 0)), (0.07, 0.09, 0.04), brillante('#E86A8A', rough=0.4), grupo, n=6)
    ojos(b, 0, 0.62, 0.075, sep=0.1, mirar=(0, -0.1))
    boca(b, 0, 0.32, 0.06, 'o')
    cachetes(b, 0, 0.36, 0.16, 0.035)


def b_nube_azucar(b):
    """Nube de algodón de azúcar: rosadita y esponjada, en su cucurucho de papel a rayas."""
    m = fieltro('#F7A8CE', '#FFD6EA', fuzz=1.0, rough=0.95, escala=170)
    m2 = fieltro('#C9B6F2', '#E8DEFF', fuzz=1.0, rough=0.95, escala=170)
    for (x, y, z, r, mm) in [(0, 0, 0.55, 0.34, m), (-0.26, 0.05, 0.5, 0.22, m), (0.27, 0.04, 0.52, 0.22, m2), (-0.12, 0.06, 0.8, 0.2, m2),
                              (0.15, 0.04, 0.82, 0.19, m), (0.0, 0.1, 0.36, 0.22, m)]:
        b.blob((x, y, z), (r, r * 0.9, r * 0.92), mm, cuerpo=True, n=10)
    pelitos(b, 22, (0, 0.02, 0.6), 0.42, 0.07, 0.012, fieltro('#FFD6EA'), z_min=-0.1, bola=False, ondas=0.6)
    # El cucurucho
    papel = fieltro('#FFFDF8', fuzz=0.15, rough=0.8)
    b.torno([(0.0, 0.0), (0.02, 0.0), (0.13, 0.28), (0.14, 0.3), (0.0, 0.3)], papel)
    b.g['base'][-1].location = (0, 0.05, 0.02)
    for k in range(3):
        z0 = 0.06 + k * 0.08
        b.torno([(0.03 + (z0 + 0.0) * 0.4, 0.0), (0.035 + (z0 + 0.03) * 0.4, 0.03), (0.03 + (z0 + 0.0) * 0.4 - 0.002, 0.0)], plano('#7DB7E8', 0.6))
        b.g['base'][-1].location = (0, 0.05, 0.02 + z0)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.blob((lado * 0.44, -0.02, 0.5 + 0.06 * s_ * lado), (0.08, 0.07, 0.07), m, grupo, n=8)
    ojos(b, 0, 0.58, 0.1, sep=0.14, mirar=(0, -0.12), estilo='dormilon')
    boca(b, 0, 0.42, 0.07, 'sonrisa')
    cachetes(b, 0, 0.48, 0.23, 0.045, color='#F06BA8')


def b_potecito(b):
    """Potecito de muestra: un pote chiquito de crema; la tapa es su boca y se lanza a morder."""
    m = brillante('#C9A4F2', rough=0.25, coat=0.7, sss=0.1)
    oro_ = clay.material('Oro potecito', '#F2C14E', rough=0.25, metallic=0.75, coat=0.4)
    b.torno([(0.0, 0.0), (0.3, 0.0), (0.33, 0.04), (0.34, 0.36), (0.3, 0.4), (0.0, 0.4)], m)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    crema = fieltro('#FFF7EC', '#FFFFFF', fuzz=0.3, rough=0.7)
    # La tapa: cerrada normalmente, abierta (con la crema adentro y dientes) en el golpe
    for grupo, abierta in (('boca', False), ('bocaGolpe', True)):
        o = clay.lathe(b.nom(), [(0.0, 0.0), (0.35, 0.0), (0.36, 0.02), (0.35, 0.1), (0.3, 0.12), (0.0, 0.12)], b.coll, oro_, segments=32, subsurf=1)
        if abierta:
            # (la bisagra queda atrás, en el borde del pote)
            o.rotation_euler = (math.radians(-62), 0, 0)
            o.location = (0, 0.17, 0.73)
            b.add(o, grupo)
            b.blob((0, 0, 0.42), (0.27, 0.25, 0.06), crema, grupo, n=10)
            for x in np.linspace(-0.2, 0.2, 5):
                b.blob((x, -0.27, 0.43), (0.035, 0.02, 0.04), DIENTE, grupo, n=5)
        else:
            o.location = (0, 0, 0.4)
            b.add(o, grupo)
            b.blob((0, 0, 0.53), (0.08, 0.08, 0.04), oro_, grupo, n=6)
    # La etiqueta con una flor
    p, nrm = b.frente(0, 0.16)
    orientado(b, (0.24, 0.015, 0.08), plano('#FFFDF8', 0.5), p, nrm, 'base', lift=0.005)
    for k in range(5):
        a = k / 5 * TAU
        q, nq = b.frente(math.cos(a) * 0.03, 0.16 + math.sin(a) * 0.03)
        orientado(b, (0.022, 0.008, 0.022), plano('#E86A8A', 0.5), q, nq, 'base', lift=0.012)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            b.blob((lado * 0.18, -0.06 + 0.04 * s_ * lado, 0.03), (0.07, 0.09, 0.04), fieltro('#7A5AB8', fuzz=0.3), grupo, n=6)
    ojos(b, 0, 0.29, 0.08, sep=0.12, bravo=True, mirar=(0, -0.12))


def b_mascarilla(b):
    """Mascarilla de barro: verde, cuarteada, con dos rodajas de pepino por ojos y los brazos estirados."""
    m = fieltro('#8FB96A', '#B8D99A', fuzz=0.35, rough=0.85, escala=70)
    oscuro = plano('#5E7E44', 0.7)
    b.blob((0, 0, 0.45), (0.42, 0.36, 0.45), m, cuerpo=True, n=14, shaper=lambda v: v * (1 + 0.05 * np.sin(v[:, 0:1] * 13) * np.sin(v[:, 2:3] * 11)))
    b.blob((0, 0.02, 0.92), (0.3, 0.28, 0.2), m, n=10)
    # Las grietas del barro seco
    for (x0, z0, x1, z1) in [(-0.3, 0.7, -0.15, 0.62), (-0.15, 0.62, -0.18, 0.5), (0.25, 0.28, 0.33, 0.18), (0.22, 0.75, 0.32, 0.66),
                             (-0.3, 0.25, -0.2, 0.18), (0.05, 0.05, 0.12, 0.14)]:
        b.tubo(b.trazo_frente([(x0, z0), ((x0 + x1) / 2 + 0.02, (z0 + z1) / 2), (x1, z1)], 0.01), 0.008, oscuro, 'base', segmentos=4)
    # La toalla en la cabeza (como turbante de spa)
    toalla = fieltro('#F7C6D8', '#FFE0EA', fuzz=0.7, escala=140)
    b.blob((0, 0.04, 1.08), (0.32, 0.3, 0.13), toalla, n=10)
    b.tubo([(-0.28, -0.02, 1.0), (0.0, -0.3, 1.12), (0.28, -0.02, 1.0)], 0.06, toalla, 'base', segmentos=10)
    b.blob((0.08, -0.06, 1.22), (0.13, 0.12, 0.08), toalla, n=8)
    # Rodajas de pepino subidas en la frente (como quien se las quitó de los ojos para ver a quién perseguir)
    pepino = fieltro('#C9E89A', '#E8F6C8', fuzz=0.2, rough=0.6)
    for s_ in (-1, 1):
        p, nrm = b.frente(s_ * 0.16, 0.84)
        orientado(b, (0.13, 0.025, 0.13), fieltro('#3E7A2E', fuzz=0.2), p, nrm, 'base', lift=0.01)
        orientado(b, (0.115, 0.03, 0.115), pepino, p, nrm, 'base', lift=0.02)
        for k in range(6):
            a = k / 6 * TAU
            orientado(b, (0.012, 0.01, 0.018), plano('#F6FBE8', 0.4), p + np.array([math.cos(a) * 0.06, 0, math.sin(a) * 0.06]), nrm, 'base', lift=0.045)
    ojos(b, 0, 0.62, 0.085, sep=0.12, mirar=(0, -0.12), estilo='dormilon')
    boca(b, 0, 0.36, 0.13, 'grande')
    # Los brazos estirados hacia adelante (como zombi) y los pies
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            z = 0.55 + 0.05 * s_ * lado
            b.tubo([(lado * 0.36, -0.05, 0.55), (lado * 0.4, -0.35, z), (lado * 0.36, -0.55, z + 0.03)], [0.09, 0.08, 0.07], m, grupo, segmentos=8)
            b.blob((lado * 0.35, -0.6, z + 0.03), (0.08, 0.07, 0.07), m, grupo, n=8)
            b.blob((lado * 0.2, -0.08 + 0.06 * s_ * lado, 0.04), (0.11, 0.14, 0.06), m, grupo, n=8)


def lamina(b, puntos, grosor, m, y=0.0, bisel=0.006, grupo='base'):
    """Una pieza plana (polígono `puntos` en x, z) con su grosor en y y un bisel suave."""
    import bmesh
    me = bpy.data.meshes.new(b.nom())
    bm = bmesh.new()
    fr = [bm.verts.new((x, y - grosor / 2, z)) for (x, z) in puntos]
    at = [bm.verts.new((x, y + grosor / 2, z)) for (x, z) in puntos]
    bm.faces.new(fr[::-1])
    bm.faces.new(at)
    for i in range(len(puntos)):
        j = (i + 1) % len(puntos)
        bm.faces.new((fr[i], fr[j], at[j], at[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(b.nom(), me)
    b.coll.objects.link(o)
    o.data.materials.append(m)
    bv = o.modifiers.new('bisel', 'BEVEL')
    bv.width = bisel
    bv.segments = 3
    return b.add(o, grupo)


def j_ruleta_loca(b):
    """La Ruleta Loca: la rueda de la feria se salió del eje; camina en dos patas con cara en el centro y corona."""
    cz = 0.72
    R = 0.58
    colores = ['#E4574B', '#F2C14E', '#5AB4F0', '#7FCB5A', '#E86A8A', '#9C6BD6', '#FF8A3D', '#68C9B9']
    # El disco blanco de fondo (mirando hacia -y)
    o = clay.lathe(b.nom(), [(0.0, -0.05), (R, -0.05), (R + 0.02, 0.0), (R, 0.05), (0.0, 0.05)], b.coll, brillante('#FFFDF8', rough=0.35), segments=48, subsurf=1)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (0, 0, cz)
    b.add(o)
    # Las casillas de colores (gajos planos, como la rueda del Ruletero)
    n_ = len(colores)
    for k, c in enumerate(colores):
        a0, a1 = k / n_ * TAU, (k + 1) / n_ * TAU
        pts = [(0.0, cz)] + [(math.cos(a0 + (a1 - a0) * t / 4) * (R - 0.02), cz + math.sin(a0 + (a1 - a0) * t / 4) * (R - 0.02)) for t in range(5)]
        lamina(b, pts, 0.03, brillante(c, rough=0.3, coat=0.6), y=-0.06)
        am = (a0 + a1) / 2
        b.blob((math.cos(am) * R * 0.66, -0.085, cz + math.sin(am) * R * 0.66), (0.04, 0.012, 0.04), plano('#FFFFFF' if k % 2 else '#FFF3B0', 0.4), n=5)
    # El aro dorado con bombillos
    oro_ = clay.material('Oro ruleta', '#F2C14E', rough=0.25, metallic=0.75, coat=0.4)
    aro = clay.lathe(b.nom(), [(R - 0.03, -0.06), (R + 0.06, -0.06), (R + 0.08, 0.0), (R + 0.06, 0.06), (R - 0.03, 0.06), (R - 0.05, 0.0), (R - 0.03, -0.06)],
                     b.coll, oro_, segments=56, subsurf=1, cap_bottom=False, cap_top=False)
    aro.rotation_euler = (math.pi / 2, 0, 0)
    aro.location = (0, 0, cz)
    b.add(aro)
    for k in range(16):
        a = k / 16 * TAU
        b.blob((math.cos(a) * (R + 0.02), -0.09, cz + math.sin(a) * (R + 0.02)), (0.035,) * 3,
               plano('#FFF3B0' if k % 2 else '#FFD1E0', 0.3, emision=1.6), 'pasoA' if k % 2 else 'pasoB', n=5)
        b.blob((math.cos(a) * (R + 0.02), -0.09, cz + math.sin(a) * (R + 0.02)), (0.03,) * 3, plano('#C9B27A', 0.4), 'pasoB' if k % 2 else 'pasoA', n=5)
    # La cara en el centro (el eje)
    b.blob((0, -0.12, cz), (0.22, 0.12, 0.22), brillante('#FFE7A3', rough=0.4, coat=0.4), cuerpo=True, n=12)
    ojos(b, 0, cz + 0.05, 0.065, sep=0.09, mirar=(0.1, -0.1), estilo='loco', bravo=True)
    boca(b, 0, cz - 0.1, 0.07, 'colmillos')
    # El piquito arriba (torcido) y la corona
    b.blob((0.12, -0.06, cz + R + 0.1), (0.06, 0.04, 0.1), brillante('#E4392B', rough=0.3), n=8)
    corona(b, (-0.05, -0.02, cz + R + 0.04), 0.15, 0.14)
    # Las patas (el soporte de madera que se volvió piernas) y los brazos
    madera = fieltro('#B07A4F', '#D8A878', fuzz=0.2, rough=0.7)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            f = s_ * lado
            b.tubo([(lado * 0.18, 0.06, cz - R + 0.05), (lado * 0.26, 0.0, 0.12 + 0.05 * f), (lado * 0.3, -0.02 - 0.05 * f, 0.04)], 0.05, madera, grupo, segmentos=8)
            b.blob((lado * 0.31, -0.06 - 0.05 * f, 0.04), (0.09, 0.12, 0.05), brillante('#E4574B', rough=0.4), grupo, n=8)
            b.tubo([(lado * (R + 0.04), -0.02, cz - 0.05), (lado * (R + 0.2), -0.1, cz + 0.08 * f), (lado * (R + 0.26), -0.12, cz + 0.2 + 0.06 * f)], 0.04, madera, grupo, segmentos=8)
            b.blob((lado * (R + 0.27), -0.12, cz + 0.24 + 0.06 * f), (0.06,) * 3, brillante('#FFFDF8', rough=0.4), grupo, n=6)


def j_payaso_tortazo(b):
    """El Payaso Tortazo: payaso de peluche con nariz de pompón, cuello de vuelos y una torta de crema en cada mano."""
    cuerpo = fieltro('#FFF4E2', '#FFFFFF', fuzz=0.45, escala=110)
    b.blob((0, 0.04, 0.36), (0.4, 0.34, 0.36), fieltro('#7DB7E8', '#BFE0FA', fuzz=0.5), n=12)
    # Botones de pompón en la barriga
    for k, c in enumerate(['#E4574B', '#F2C14E', '#7FCB5A']):
        b.blob((0, -0.32 + 0.03 * k, 0.48 - k * 0.14), (0.05,) * 3, fieltro(c, fuzz=0.8), n=6)
    # El cuello de vuelos (de colores)
    for k in range(14):
        a = k / 14 * TAU
        b.blob((math.cos(a) * 0.3, math.sin(a) * 0.26 + 0.02, 0.74), (0.12, 0.1, 0.06), fieltro(['#F7C948', '#E86A8A', '#68C9B9'][k % 3], fuzz=0.4), n=8)
    # La cabeza cuadradita con la cara pintada
    b.blob((0, 0, 1.0), (0.3, 0.27, 0.27), cuerpo, cuerpo=True, n=12, p=2.6)
    for s_ in (-1, 1):
        p, nrm = b.frente(s_ * 0.11, 1.07)
        orientado(b, (0.06, 0.01, 0.1), plano('#7DB7E8', 0.6), p, nrm, 'base', lift=0.005)
    ojos(b, 0, 1.06, 0.07, sep=0.11, bravo=True, mirar=(0, -0.12))
    p, nrm = b.frente(0, 0.88)
    orientado(b, (0.17, 0.02, 0.07), plano('#E4392B', 0.5), p, nrm, 'base', lift=0.004)
    boca(b, 0, 0.88, 0.12, 'sonrisa')
    # La nariz de pompón
    q, nq = b.frente(0, 0.98)
    b.blob(tuple(q + nq * 0.06), (0.075,) * 3, fieltro('#E4392B', '#FF7A6A', fuzz=0.9), n=8)
    # El pelo de colores a los lados y la corona encima
    pelo = fieltro('#FF8A3D', '#FFC08A', fuzz=1.0, escala=160)
    for s_ in (-1, 1):
        for (dx, dz, r) in ((0.3, 1.1, 0.12), (0.36, 0.98, 0.11), (0.26, 1.2, 0.09)):
            b.blob((s_ * dx, 0.04, dz), (r, r, r), pelo, n=8)
    corona(b, (0, 0.02, 1.22), 0.15, 0.14)
    # Las tortas de crema en las manos (y los zapatotes)
    plato = brillante('#E8B26A', rough=0.4)
    crema = fieltro('#FFF7EC', '#FFFFFF', fuzz=0.35, rough=0.7)
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            f = s_ * lado
            hz = 0.62 + 0.12 * f
            b.tubo([(lado * 0.34, 0.0, 0.55), (lado * 0.5, -0.06, 0.55 + 0.06 * f), (lado * 0.6, -0.1, hz)], 0.06, fieltro('#7DB7E8', fuzz=0.5), grupo, segmentos=8)
            b.blob((lado * 0.62, -0.1, hz), (0.07,) * 3, fieltro('#FFFFFF', fuzz=0.6), grupo, n=6)
            t = clay.lathe(b.nom(), [(0.0, 0.0), (0.16, 0.0), (0.18, 0.05), (0.15, 0.06), (0.0, 0.06)], b.coll, plato, segments=24, subsurf=1)
            t.location = (lado * 0.64, -0.12, hz + 0.05)
            b.add(t, grupo)
            b.blob((lado * 0.64, -0.12, hz + 0.13), (0.15, 0.15, 0.07), crema, grupo, n=8)
            b.blob((lado * 0.64, -0.14, hz + 0.21), (0.04, 0.04, 0.04), brillante('#E4392B', rough=0.3), grupo, n=6)
            b.blob((lado * 0.2, -0.1 - 0.06 * f, 0.05), (0.13, 0.22, 0.07), brillante('#E4574B', rough=0.35, coat=0.5), grupo, n=8)


def j_reina_cremas(b):
    """La Reina de las Cremas: un frasco de crema de lujo con corona, capa de seda, pestañas larguísimas y labios rojos."""
    m = brillante('#FCE4EC', rough=0.2, coat=0.9, sss=0.2)
    oro_ = clay.material('Oro reina cremas', '#F2C14E', rough=0.22, metallic=0.8, coat=0.4)
    b.torno([(0.0, 0.0), (0.4, 0.0), (0.44, 0.06), (0.46, 0.6), (0.42, 0.7), (0.0, 0.7)], m)
    b.cuerpo.append(b.g['base'][-1])
    b._surf = None
    # La tapa dorada y la crema que rebosa en espiral
    b.torno([(0.0, 0.0), (0.45, 0.0), (0.47, 0.03), (0.46, 0.1), (0.42, 0.12), (0.0, 0.12)], oro_)
    b.g['base'][-1].location = (0, 0, 0.68)
    crema = fieltro('#FFF7EC', '#FFFFFF', fuzz=0.3, rough=0.65)
    for (z, r) in ((0.86, 0.34), (0.98, 0.25), (1.08, 0.16)):
        b.blob((0, 0.02, z), (r, r * 0.95, 0.08), crema, n=10)
    # Capa de seda
    capa = fieltro('#9C3B6E', '#D86AA0', fuzz=0.35, rough=0.5)
    b.blob((0, 0.32, 0.45), (0.5, 0.1, 0.45), capa, n=12)
    b.tubo([(-0.44, 0.0, 0.66), (0.0, -0.46, 0.7), (0.44, 0.0, 0.66)], 0.05, fieltro('#FFFFFF', '#FFFFFF', fuzz=0.9), 'base', segmentos=12)
    # Un collar de perlas abajo
    for k in range(9):
        q, nq = b.frente(-0.32 + k * 0.08, 0.06)
        orientado(b, (0.025,) * 3, brillante('#FFFFFF', rough=0.15, coat=1.0), q, nq, 'base', lift=0.02)
    ojos(b, 0, 0.47, 0.11, sep=0.16, mirar=(0, -0.12), bravo=True)
    # Pestañas larguísimas
    for s_ in (-1, 1):
        for k in range(4):
            x0 = s_ * (0.16 + (k - 1.5) * 0.045)
            base, nrm = b.frente(x0, 0.6)
            for grupo in ('abiertos', 'golpe'):
                b.tubo([tuple(base + nrm * 0.03), tuple(base + nrm * 0.07 + np.array([s_ * 0.035 * (k - 1), 0, 0.06])),
                        tuple(base + nrm * 0.09 + np.array([s_ * 0.05 * (k - 1), 0, 0.1]))], [0.016, 0.012, 0.006], NEGRO, grupo, segmentos=5)
    # Los labios rojos (la boca de golpe es la de siempre: se arma y se le quita la boquita en «o»)
    boca(b, 0, 0.3, 0.08, 'o')
    for o in b.g['boca']:
        bpy.data.objects.remove(o, do_unlink=True)
    b.g['boca'] = []
    q, nq = b.frente(0, 0.3)
    for s_ in (-1, 1):
        orientado(b, (0.075, 0.035, 0.045), brillante('#D6234A', rough=0.2, coat=0.9), q + np.array([s_ * 0.05, 0, 0.016]), nq, 'boca', lift=0.025)
    orientado(b, (0.095, 0.035, 0.04), brillante('#D6234A', rough=0.2, coat=0.9), q - np.array([0, 0, 0.03]), nq, 'boca', lift=0.025)
    r_, nr = b.frente(0.17, 0.33)
    orientado(b, (0.018, 0.01, 0.018), NEGRO, r_, nr, 'base', lift=0.012)
    cachetes(b, 0, 0.36, 0.3, 0.05)
    corona(b, (0, 0.02, 1.1), 0.18, 0.18, joyas=('#E86A8A', '#7DD3E8'))
    # Manitos con guante y un espejito
    for grupo, s_ in (('pasoA', 1), ('pasoB', -1)):
        for lado in (-1, 1):
            f = s_ * lado
            b.tubo([(lado * 0.44, 0.0, 0.45), (lado * 0.58, -0.06, 0.4 + 0.06 * f), (lado * 0.64, -0.1, 0.5 + 0.08 * f)], 0.045, brillante('#FFFFFF', rough=0.4), grupo, segmentos=8)
            b.blob((lado * 0.65, -0.1, 0.52 + 0.08 * f), (0.06,) * 3, brillante('#FFFFFF', rough=0.4), grupo, n=6)
            b.blob((lado * 0.22, -0.06 + 0.05 * f, 0.03), (0.1, 0.14, 0.04), brillante('#9C3B6E', rough=0.35), grupo, n=8)


BICHOS = {
    'germen': b_germen, 'puntoNegro': b_punto_negro, 'gotaGrasa': b_gota_grasa, 'acaro': b_acaro, 'granito': b_granito, 'caspa': b_caspa,
    'bacteria': b_bacteria, 'pelusa': b_pelusa, 'virus': b_virus, 'barrito': b_barrito, 'lagana': b_lagana, 'mugre': b_mugre,
    'moco': b_moco, 'sarro': b_sarro, 'pastaSeca': b_pasta_seca, 'hongo': b_hongo, 'cucaracha': b_cucaracha, 'pelo': b_pelo,
    'moho': b_moho, 'jabonSucio': b_jabon_sucio, 'piojo': b_piojo, 'mosquito': b_mosquito, 'pulga': b_pulga,
    'burbujaSucia': b_burbuja_sucia, 'babosa': b_babosa, 'espinilla': b_espinilla,
    'espinillon': j_espinillon, 'reinaCaspa': j_reina_caspa, 'granMoco': j_gran_moco, 'senorLagana': j_senor_lagana,
    'barroNegro': j_barro_negro, 'senorSarro': j_senor_sarro, 'donaCucaracha': j_dona_cucaracha, 'motaPelo': j_mota_pelo,
    'tapon': j_tapon, 'esponjaPodrida': j_esponja_podrida, 'peloDesague': j_pelo_desague, 'duchaHelada': j_ducha_helada,
    # La Ducha
    'gotaDura': b_gota_dura, 'mosquitaDesague': b_mosquita_desague, 'tapaChampu': b_tapa_champu, 'hongoPie': b_hongo_pie,
    'espumaSucia': b_espuma_sucia, 'ciempies': b_ciempies, 'estropajo': b_estropajo, 'cal': b_cal,
    'reyHongo': j_rey_hongo, 'regaderaLoca': j_regadera_loca, 'cortinaMohosa': j_cortina_mohosa, 'ciempiesGigante': j_ciempies_gigante,
    # La Jabonera
    'pompa': b_pompa, 'cuchilla': b_cuchilla, 'champuDerramado': b_champu_derramado, 'algodon': b_algodon, 'frascoVacio': b_frasco_vacio,
    'hilacha': b_hilacha, 'mohoRosado': b_moho_rosado,
    'donFrasco': j_don_frasco, 'reinaPompa': j_reina_pompa, 'senorCuchillas': j_senor_cuchillas, 'poteCrema': j_pote_crema,
    # El Desagüe
    'bolitaPelo': b_bolita_pelo, 'grasaSifon': b_grasa_sifon, 'gusanito': b_gusanito, 'burbujaGas': b_burbuja_gas, 'sapito': b_sapito,
    'rejillita': b_rejillita, 'lodo': b_lodo,
    'reySapo': j_rey_sapo, 'pulpoDesague': j_pulpo_desague, 'bocaSifon': j_boca_sifon, 'reinaGrasa': j_reina_grasa,
    # La Matera de la ventana
    'brotecito': b_brotecito, 'cactus': b_cactus, 'atrapamoscas': b_atrapamoscas, 'caracol': b_caracol, 'dienteLeon': b_diente_leon,
    'enredadera': b_enredadera, 'helecho': b_helecho,
    'donCactus': j_don_cactus, 'atrapamoscasGigante': j_atrapamoscas_gigante, 'materaGigante': j_matera_gigante,
    # El Tobogán del desagüe
    'patitoHule': b_patito_hule, 'chancleta': b_chancleta, 'patoInflable': j_pato_inflable, 'donaFlotador': j_dona_flotador,
    # El Laberinto de la cortina
    'ratoncito': b_ratoncito, 'reyRaton': j_rey_raton,
    # La Feria de las cremas
    'pompitaCrema': b_pompita_crema, 'tubitoCrema': b_tubito_crema, 'nubeAzucar': b_nube_azucar, 'potecito': b_potecito, 'mascarilla': b_mascarilla,
    'ruletaLoca': j_ruleta_loca, 'payasoBloqueador': j_payaso_tortazo, 'reinaCremas': j_reina_cremas,
}
JEFES = {'espinillon', 'reinaCaspa', 'granMoco', 'senorLagana', 'barroNegro', 'senorSarro', 'donaCucaracha', 'motaPelo', 'tapon',
         'esponjaPodrida', 'peloDesague', 'duchaHelada', 'reyHongo', 'regaderaLoca', 'cortinaMohosa', 'ciempiesGigante',
         'donFrasco', 'reinaPompa', 'senorCuchillas', 'poteCrema', 'reySapo', 'pulpoDesague', 'bocaSifon', 'reinaGrasa',
         'donCactus', 'atrapamoscasGigante', 'materaGigante', 'patoInflable', 'donaFlotador', 'reyRaton',
         'ruletaLoca', 'payasoBloqueador', 'reinaCremas'}

CUADROS = [
    ('normal', {'base', 'abiertos', 'boca', 'pasoA'}),
    ('paso', {'base', 'abiertos', 'boca', 'pasoB'}),
    ('parpadeo', {'base', 'cerrados', 'boca', 'pasoA'}),
    ('golpe', {'base', 'golpe', 'bocaGolpe', 'pasoA'}),
]


# ----------------------------------------------------------------------------------------------------- Render
def estudio(scene):
    luces = clay.collection('Luces sprites')
    escena.area_light('Clave', (-2.6, -3.4, 4.2), (0, 0, 0.45), 520, 2.6, '#FFF1E2', luces)
    escena.area_light('Relleno', (3.2, -2.4, 1.8), (0, 0, 0.45), 170, 3.0, '#E4F0FF', luces)
    escena.area_light('Contraluz', (1.2, 3.2, 3.4), (0, 0, 0.6), 420, 2.0, '#FFE0EC', luces)
    escena.world_color(scene, '#FFFFFF', 0.55)
    try:
        scene.view_settings.look = os.environ.get('LOOK', 'AgX - Punchy')
    except TypeError:
        scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = float(os.environ.get('EXPOSICION', 0.35))


def camara_para(b, res):
    """Cámara ortográfica que encuadra todos los cuadros; devuelve el ancla (los pies) en la imagen."""
    scene = bpy.context.scene
    bpy.context.view_layer.update()
    d = Vector((0, -math.cos(ELEVACION), math.sin(ELEVACION)))
    arriba = Vector((0, math.sin(ELEVACION), math.cos(ELEVACION)))
    derecha = Vector((1, 0, 0))
    us, vs = [], []
    for o in b.todos():
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            us.append(p.dot(derecha))
            vs.append(p.dot(arriba))
    u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
    tam = max(u1 - u0, v1 - v0) * 1.06
    cu, cv = (u0 + u1) / 2, (v0 + v1) / 2
    centro = derecha * cu + arriba * cv
    cam = escena.camera(f'Cam {b.nombre}', tuple(centro + d * 12), tuple(centro), 50)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = tam
    cam.data.clip_end = 50
    scene.camera = cam
    scene.render.resolution_x = scene.render.resolution_y = res
    # Los pies (el origen) en la imagen: 0..1 desde la izquierda y desde arriba
    pu = (0 - cu) / tam + 0.5
    pv = 0.5 - (0 - cv) / tam
    return cam, pu, pv, tam


def renderizar(nombre, salida):
    scene = bpy.context.scene
    b = Bicho(nombre)
    BICHOS[nombre](b)
    jefe = nombre in JEFES
    res = 320 if jefe else 192
    cam, pu, pv, tam = camara_para(b, res)
    for cuadro, grupos in CUADROS:
        for k in Bicho.GRUPOS:
            for o in b.g[k]:
                o.hide_render = k not in grupos
        scene.render.filepath = os.path.join(salida, f'{nombre}_{cuadro}.png')
        bpy.ops.render.render(write_still=True)
    with open(os.path.join(salida, f'{nombre}.txt'), 'w') as f:
        f.write(f'{pu:.4f} {pv:.4f} {tam:.4f} {res}\n')
    # Se borra para no llenar la memoria
    for o in b.todos():
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    print('BICHO', nombre, flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    salida = args[0] if args else '/tmp/lavado_bichos'
    pedidos = args[1].split(',') if len(args) > 1 else list(BICHOS)
    os.makedirs(salida, exist_ok=True)
    scene = clay.reset_scene()
    escena.setup_render(scene, 192, 192, samples=int(os.environ.get('MUESTRAS', 36)), transparent=True)
    scene.cycles.max_bounces = 6
    scene.cycles.transmission_bounces = 6
    materiales_base()
    estudio(scene)
    for n in pedidos:
        renderizar(n, salida)
