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


BICHOS = {
    'germen': b_germen, 'puntoNegro': b_punto_negro, 'gotaGrasa': b_gota_grasa, 'acaro': b_acaro, 'granito': b_granito, 'caspa': b_caspa,
    'bacteria': b_bacteria, 'pelusa': b_pelusa, 'virus': b_virus, 'barrito': b_barrito, 'lagana': b_lagana, 'mugre': b_mugre,
    'moco': b_moco, 'sarro': b_sarro, 'pastaSeca': b_pasta_seca, 'hongo': b_hongo, 'cucaracha': b_cucaracha, 'pelo': b_pelo,
    'moho': b_moho, 'jabonSucio': b_jabon_sucio, 'piojo': b_piojo, 'mosquito': b_mosquito, 'pulga': b_pulga,
    'burbujaSucia': b_burbuja_sucia, 'babosa': b_babosa, 'espinilla': b_espinilla,
    'espinillon': j_espinillon, 'reinaCaspa': j_reina_caspa, 'granMoco': j_gran_moco, 'senorLagana': j_senor_lagana,
    'barroNegro': j_barro_negro, 'senorSarro': j_senor_sarro, 'donaCucaracha': j_dona_cucaracha, 'motaPelo': j_mota_pelo,
    'tapon': j_tapon, 'esponjaPodrida': j_esponja_podrida, 'peloDesague': j_pelo_desague, 'duchaHelada': j_ducha_helada,
}
JEFES = {'espinillon', 'reinaCaspa', 'granMoco', 'senorLagana', 'barroNegro', 'senorSarro', 'donaCucaracha', 'motaPelo', 'tapon',
         'esponjaPodrida', 'peloDesague', 'duchaHelada'}

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
