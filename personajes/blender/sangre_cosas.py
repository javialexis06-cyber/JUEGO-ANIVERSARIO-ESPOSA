"""Cosas de Sangre y Ceniza (cosas.glb): recogibles, cofres, objetivos de la misión y construcciones.

Cada una es un vacío `c_<id>` con la pieza `cuerpo` y, si algo se mueve, `extra_*` con su pivote (la tapa del
cofre en la bisagra, el badajo de la campana, las ruedas de la carreta, el arco de la torreta, las quijadas de la
trampa). Marcas: `luz` / `llama` (dónde va una luz), `punta` (de donde sale el virote de la torreta).
El prisionero encadenado y la guardia real vienen por piezas como los enemigos (cuerpo, cabeza, brazos, piernas)
para que caminen detrás del jugador; el poste y las cadenas del prisionero van en `extra_poste` (se esconden al
liberarlo).
"""
import math

import numpy as np

import sangre_comun as sc
import sangre_formas as sf
import sdf
from sangre_comun import P_
from sangre_enemigos import LADOS, mano_garra, ojos

COSAS = {}


def cosa(id_):
    def deco(fn):
        COSAS[id_] = fn
        return fn
    return deco


def nueva(id_, voxel=0.01, suelo=True, **extras):
    F = sc.Figura(id_, 'c', voxel=voxel, suelo=suelo)
    F.extras.update(extras)
    return F


def madera(s=0, color='#5C3F26', eje='z'):
    return P_(color, 'madera', color2='#352214', semilla=s, eje=eje)


def hierro(s=0, color='#4E5056'):
    return P_(color, 'hierro', semilla=s)


def oro(s=0):
    return P_('#B08A3A', 'oro', semilla=s)


def piedra(s=0, color='#6A6660', musgo=0.5):
    return P_(color, 'piedra', semilla=s, musgo=musgo)


def brillo(nombre, color):
    return P_(color, 'brillo', mat=f'brillo_{nombre}')


def tablas(pz, c, half, eje_tabla, n, pt, sem=0, hueco=0.006):
    """Caja hecha de tablas (separadas por una rendija) a lo largo de eje_tabla (0=x, 1=y, 2=z)."""
    c = np.asarray(c, float)
    h = np.asarray(half, float)
    paso = 2 * h[eje_tabla] / n
    for i in range(n):
        cc = c.copy()
        cc[eje_tabla] = c[eje_tabla] - h[eje_tabla] + paso * (i + 0.5)
        hh = h.copy()
        hh[eje_tabla] = paso / 2 - hueco
        pz.caja(cc, hh, min(0.008, hh.min() * 0.5), pt, 0.0)


# ---------------------------------------------------------------------------
# Recogibles
# ---------------------------------------------------------------------------

def _alma(id_, color, nombre_brillo):
    F = nueva(id_, voxel=0.006, suelo=False, flota=1)
    c = F.pieza('cuerpo', (0, 0, 0.35), tris=260)
    c.malla(sc.bolita('nucleo', (0, 0, 0.35), 0.05, coll_ref[0], n=2, sub=1), brillo(nombre_brillo, color))
    c.malla(sc.bolita('halo', (0, 0, 0.35), 0.075, coll_ref[0], n=2, sub=0), P_(color, 'vidrio', mat='espectro'))
    for k in range(3):
        a = 2 * math.pi * k / 3
        pts = [np.array([math.cos(a + t * 2.4) * 0.04 * (1 - t * 0.5), math.sin(a + t * 2.4) * 0.04 * (1 - t * 0.5), 0.32 - t * 0.2]) for t in np.linspace(0, 1, 6)]
        c.malla(sc.tubo(f'estela {k}', pts, [0.016, 0.012, 0.009, 0.006, 0.003, 0.001], coll_ref[0], segmentos=4, muestras=2, tapas=('flat', 'point')),
                brillo(nombre_brillo, color))
    F.marca('luz', (0, 0, 0.35))
    return F


coll_ref = [None]


@cosa('alma_azul')
def alma_azul(coll):
    coll_ref[0] = coll
    return _alma('alma_azul', '#5ED8FF', 'azul')


@cosa('alma_verde')
def alma_verde(coll):
    coll_ref[0] = coll
    return _alma('alma_verde', '#7CFF4A', 'verde')


@cosa('alma_roja')
def alma_roja(coll):
    coll_ref[0] = coll
    return _alma('alma_roja', '#FF2A1A', 'rojo')


@cosa('oro')
def oro_monedas(coll):
    F = nueva('oro', voxel=0.005)
    c = F.pieza('cuerpo', (0, 0, 0), tris=600)
    rng = np.random.default_rng(2)
    for k in range(9):
        a = rng.uniform(0, 2 * math.pi)
        r = rng.uniform(0, 0.06) if k > 2 else 0.0
        z = 0.008 + (0.012 * k if k < 4 else rng.uniform(0, 0.02))
        o = sc.torno(f'moneda {k}', [(0.0, 0.0), (0.03, 0.0), (0.031, 0.006), (0.0, 0.007)], coll, segmentos=10,
                     centro=(math.cos(a) * r, math.sin(a) * r, z), eje=(rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), 1))
        c.malla(o, oro(k))
    F.marca('luz', (0, 0, 0.05))
    return F


@cosa('hierro_negro')
def hierro_negro(coll):
    F = nueva('hierro_negro', voxel=0.006)
    c = F.pieza('cuerpo', (0, 0, 0), tris=500)
    roca = sc.sdf_ruido(sdf.round_box((0, 0, 0.07), (0.1, 0.08, 0.07), 0.04, rot=sc.rot('z', 25)), 0.012, 14, 3)
    c.sdf(roca, (-0.18, -0.18, -0.03), (0.18, 0.18, 0.18), P_('#2A2A30', 'piedra', semilla=1, var=1.2))
    for k in range(5):
        a = k * 1.3
        p0 = np.array([math.cos(a) * 0.05, math.sin(a) * 0.05, 0.1])
        c.malla(sc.punta(f'veta {k}', p0, p0 + np.array([math.cos(a) * 0.07, math.sin(a) * 0.07, 0.04]), 0.026, coll, seg=4), P_('#B8BCC8', 'hierro', semilla=k, var=0.3))
    return F


@cosa('sangre_cristal')
def sangre_cristal(coll):
    F = nueva('sangre_cristal', voxel=0.006)
    c = F.pieza('cuerpo', (0, 0, 0), tris=400)
    c.sdf(sc.sdf_ruido(sdf.ellipsoid((0, 0, 0.015), (0.08, 0.07, 0.03)), 0.008, 20, 1), (-0.12, -0.12, -0.03), (0.12, 0.12, 0.06), piedra(2, '#3A3030', 0))
    for k, (a, h, r) in enumerate(((0, 0.2, 0.035), (1.6, 0.13, 0.025), (3.0, 0.15, 0.028), (4.4, 0.1, 0.02), (5.5, 0.12, 0.022))):
        b = np.array([math.cos(a) * 0.03 * (k > 0), math.sin(a) * 0.03 * (k > 0), 0.02])
        d = np.array([math.cos(a) * 0.35 * (k > 0), math.sin(a) * 0.35 * (k > 0), 1.0])
        c.malla(sc.punta(f'cristal {k}', b, b + d / np.linalg.norm(d) * h, r, coll, seg=6, medio=0.95), brillo('rojo', '#FF2A1A'))
    F.marca('luz', (0, 0, 0.1))
    return F


@cosa('pierna_pollo')
def pierna_pollo(coll):
    F = nueva('pierna_pollo', voxel=0.005)
    c = F.pieza('cuerpo', (0, 0, 0), tris=500)
    c.sdf(sc.sdf_ruido(sdf.round_cone((0, -0.04, 0.05), (0, 0.06, 0.045), 0.055, 0.03), 0.004, 40, 2), (-0.1, -0.12, -0.02), (0.1, 0.12, 0.12),
          P_('#8A4A1E', 'cuero', semilla=1, var=1.3))
    c.cono((0, 0.07, 0.045), (0, 0.13, 0.045), 0.014, 0.012, P_('#E6DAC0', 'hueso', semilla=2), 0.0)
    for s in (-1, 1):
        c.bola((s * 0.012, 0.135, 0.045), 0.016, P_('#E6DAC0', 'hueso', semilla=3), 0.005)
    return F


# ---------------------------------------------------------------------------
# Cofres y llave
# ---------------------------------------------------------------------------

def _cofre(F, coll, ancho=0.26, fondo=0.18, alto=0.17, madera_pt=None, metal=None, adornos=None, cerradura=None):
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    md = madera_pt or madera(1, '#5A3A22', eje='x')
    mt = metal or hierro(2)
    tablas(c, (0, 0, alto / 2), (ancho, fondo, alto / 2), 2, 3, md)
    for x in (-ancho * 0.8, 0.0, ancho * 0.8):
        c.caja((x, 0, alto / 2), (0.018, fondo + 0.008, alto / 2 + 0.006), 0.004, mt, 0.0)
    for s in (-1, 1):
        for t in (-1, 1):
            c.caja((s * (ancho - 0.01), t * (fondo - 0.01), alto / 2), (0.022, 0.022, alto / 2 + 0.008), 0.006, mt, 0.0)
    lock = np.array([0, fondo + 0.012, alto - 0.03])
    if cerradura is None:
        c.caja(lock, (0.035, 0.012, 0.04), 0.006, mt, 0.0)
        c.malla(sc.bolita('ojo cerradura', lock + np.array([0, 0.012, 0]), (0.006, 0.003, 0.012), coll, n=1), P_('#100C0A', 'liso'))
    else:
        cerradura(c, lock)
    # tapa (pieza aparte con la bisagra atrás)
    piv = np.array([0, -fondo, alto])
    t = F.pieza('extra_tapa', tuple(piv), tris=900)
    perfil = sdf.intersect(sdf.round_cone((-ancho, 0, alto), (ancho, 0, alto), fondo + 0.005, fondo + 0.005), sdf.plane((0, 0, alto), (0, 0, -1)))
    t.sdf(sf.intersect(perfil, sdf.round_box((0, 0, alto + 0.05), (ancho + 0.002, fondo + 0.1, 0.2), 0.01)), (-ancho - 0.05, -fondo - 0.05, alto - 0.02),
          (ancho + 0.05, fondo + 0.05, alto + fondo + 0.05), md)
    for x in (-ancho * 0.8, 0.0, ancho * 0.8):
        arco = [(x, math.cos(a) * (fondo + 0.012), alto + math.sin(a) * (fondo + 0.012)) for a in np.linspace(0, math.pi, 9)]
        t.malla(sc.tubo(f'fleje tapa {x:.2f}', arco, 0.012, coll, segmentos=4, muestras=1, perfil=(1.6, 0.6)), mt)
    if adornos:
        adornos(c, t)
    return c, t


@cosa('cofre')
def cofre(coll):
    F = nueva('cofre', voxel=0.008)
    _cofre(F, coll)
    F.marca('luz', (0, 0, 0.2))
    return F


@cosa('cofre_reliquia')
def cofre_reliquia(coll):
    F = nueva('cofre_reliquia', voxel=0.008)

    def cerradura(c, lock):
        c.bola(lock + np.array([0, 0.01, 0.0]), (0.045, 0.02, 0.05), oro(5), 0.0)
        for s in (-1, 1):
            c.malla(sc.bolita(f'cuenca cerradura {s}', lock + np.array([s * 0.016, 0.03, 0.01]), 0.009, coll, n=1), brillo('rojo', '#FF2A1A'))

    def adornos(c, t):
        for s in (-1, 1):
            for z in (0.03, 0.17):
                c.malla(sc.bolita(f'esquinero {s} {z}', (s * 0.29, 0.2, z), 0.022, coll, n=2), oro(6))
        t.malla(sc.tubo('sello sangre', [(-0.28, 0.0, 0.205), (0.28, 0.0, 0.205)], 0.006, coll, segmentos=4, muestras=1), brillo('rojo', '#FF2A1A'))
        for k in range(3):
            t.malla(sc.bolita(f'gema tapa {k}', ((k - 1) * 0.15, 0.13, 0.33), 0.018, coll, n=2), brillo('rojo', '#C0141A'))
    _cofre(F, coll, ancho=0.3, fondo=0.2, alto=0.2, madera_pt=madera(3, '#3A1A1A', eje='x'), metal=oro(4), adornos=adornos, cerradura=cerradura)
    F.marca('luz', (0, 0, 0.25))
    return F


@cosa('llave')
def llave(coll):
    F = nueva('llave', voxel=0.004, suelo=False, flota=1)
    c = F.pieza('cuerpo', (0, 0, 0.3), tris=500)
    c.trazo([(0, -0.02, 0.3), (0, 0.12, 0.3)], 0.009, hierro(1, '#6A6A70'), 0.0)
    c.caja((0, 0.11, 0.28), (0.006, 0.012, 0.022), 0.003, hierro(2, '#6A6A70'), 0.0)
    c.caja((0, 0.085, 0.285), (0.006, 0.01, 0.016), 0.003, hierro(2, '#6A6A70'), 0.0)
    c.bola((0, -0.05, 0.3), (0.012, 0.035, 0.035), hueso_pt(3), 0.0)
    for s in (-1, 1):
        c.malla(sc.bolita(f'cuenca {s}', (0.012, -0.055, 0.31 + 0.0 * s) + np.array([0, s * 0.012, 0]), 0.007, coll, n=1), brillo('rojo', '#FF2A1A'))
    F.marca('luz', (0, 0, 0.3))
    return F


def hueso_pt(s=0):
    return P_('#D3C6A2', 'hueso', semilla=s)


# ---------------------------------------------------------------------------
# Objetivos grandes
# ---------------------------------------------------------------------------

@cosa('campana_extraccion')
def campana_extraccion(coll):
    """La Campana de Extracción: campana de bronce gigante que baja colgada de cadenas, con runas que se encienden."""
    F = nueva('campana_extraccion', voxel=0.025)
    F.alcance_ao = 0.6
    bronce = P_('#8A6A3A', 'oro', semilla=1, var=1.2)
    c = F.pieza('cuerpo', (0, 0, 0), tris=2600)
    perfil = [(1.05, 0.0), (1.08, 0.06), (0.98, 0.18), (0.82, 0.45), (0.74, 0.8), (0.72, 1.15), (0.66, 1.4), (0.45, 1.58), (0.0, 1.62)]
    c.malla(sc.torno('campana', perfil, coll, segmentos=28), bronce)
    interior = [(0.0, 1.5), (0.6, 1.36), (0.66, 1.1), (0.68, 0.8), (0.75, 0.45), (0.9, 0.18), (1.0, 0.04)]
    c.malla(sc.torno('dentro campana', interior, coll, segmentos=28), P_('#2A1E14', 'oro', semilla=2))
    for z, r in ((0.12, 1.0), (1.2, 0.72)):
        sf.cuerda_anillo(c, f'moldura {z}', [(math.cos(a) * (r + 0.02), math.sin(a) * (r + 0.02), z) for a in np.linspace(0, 2 * math.pi, 30, endpoint=False)],
                         0.035, bronce, coll)
    for k in range(12):
        a = 2 * math.pi * k / 12
        u = np.array([math.cos(a), math.sin(a), 0])
        p = u * 0.97 + np.array([0, 0, 0.26])
        c.malla(sc.tubo(f'runa {k}', [p, p + np.array([0, 0, 0.12]), p + np.array([0, 0, 0.12]) + np.cross([0, 0, 1], u) * 0.05], 0.018, coll, segmentos=4,
                        muestras=1), brillo('rojo', '#FF2A1A'))
    c.cono((0, 0, 1.6), (0, 0, 1.78), 0.18, 0.14, hierro(3), 0.0)
    sf.cuerda_anillo(c, 'argolla', [(math.cos(a) * 0.16, 0, 1.88 + math.sin(a) * 0.12) for a in np.linspace(0, 2 * math.pi, 14, endpoint=False)], 0.04,
                     hierro(4), coll)
    e = F.pieza('extra_cadenas', (0, 0, 2.0), tris=900)
    for s in (-1, 1):
        for k in range(10):
            p = np.array([s * 0.08, 0, 2.0 + 0.16 * k])
            e.malla(sc.bolita(f'eslabon {s} {k}', p, (0.035, 0.035 if k % 2 else 0.012, 0.07), coll, n=1, sub=1), hierro(5 + k % 2))
    b = F.pieza('extra_badajo', (0, 0, 1.5), tris=300)
    b.trazo([(0, 0, 1.5), (0, 0, 0.45)], 0.04, hierro(7), 0.0)
    b.bola((0, 0, 0.38), 0.12, hierro(8), 0.0)
    F.marca('luz', (0, 0, 0.6))
    return F


@cosa('altar_sangre')
def altar_sangre(coll):
    F = nueva('altar_sangre', voxel=0.016)
    c = F.pieza('cuerpo', (0, 0, 0), tris=3200)
    base = sf.union(sdf.round_box((0, 0, 0.12), (0.6, 0.42, 0.12), 0.03), sdf.round_box((0, 0, 0.42), (0.45, 0.3, 0.2), 0.03),
                    sdf.round_box((0, 0, 0.66), (0.55, 0.38, 0.05), 0.02))
    base = sf.restar(base, sdf.ellipsoid((0, 0, 0.72), (0.3, 0.2, 0.06)), 0.02)
    c.sdf(sc.sdf_ruido(base, 0.012, 9, 1), (-0.75, -0.55, -0.05), (0.75, 0.55, 0.8), piedra(1, '#5A5450', 0.6))
    c.sdf(sdf.ellipsoid((0, 0, 0.68), (0.28, 0.18, 0.02)), (-0.4, -0.3, 0.6), (0.4, 0.3, 0.76), P_('#5A0A0A', 'sangre', mat='sangre'), 0.0)
    for k in range(7):
        a = k * 0.9
        p = np.array([math.cos(a) * 0.44, math.sin(a) * 0.3, 0.71])
        c.trazo([p, p + np.array([0, 0, -0.08 - 0.06 * (k % 3)])], [0.02, 0.012], P_('#5A0A0A', 'sangre', mat='sangre'), 0.01)
    # cristal de sangre clavado encima
    for k, (d, h) in enumerate((((0, 0, 1), 0.55), ((0.4, 0.2, 1), 0.3), ((-0.35, -0.1, 1), 0.32), ((0.1, -0.4, 1), 0.25))):
        d = np.array(d) / np.linalg.norm(d)
        b = np.array([0, 0, 0.68]) + d * 0.02
        c.malla(sc.punta(f'cristal {k}', b, b + d * h, 0.09 - 0.015 * k, coll, seg=6, medio=0.9), brillo('rojo', '#FF2A1A'))
    # velas derretidas y calaveras en las esquinas
    for k, (x, y) in enumerate(((-0.5, 0.32), (0.5, 0.33), (-0.48, -0.3), (0.5, -0.31), (0.0, 0.36))):
        hgt = 0.12 + 0.06 * (k % 3)
        c.cono((x, y, 0.24), (x, y, 0.24 + hgt), 0.035, 0.03, P_('#D8CCAA', 'cera', semilla=k), 0.0)
        for q in range(3):
            a = q * 2.1
            c.trazo([(x + math.cos(a) * 0.03, y + math.sin(a) * 0.03, 0.22 + hgt), (x + math.cos(a) * 0.04, y + math.sin(a) * 0.04, 0.26)], [0.012, 0.016],
                    P_('#D8CCAA', 'cera', semilla=k + 5), 0.01)
        c.malla(sc.punta(f'llama {k}', (x, y, 0.25 + hgt), (x, y, 0.32 + hgt), 0.018, coll, seg=5), brillo('ambar', '#FFAA33'))
    for k, (x, y) in enumerate(((-0.35, 0.4), (0.3, -0.42))):
        p = np.array([x, y, 0.3])
        c.bola(p, (0.07, 0.075, 0.065), hueso_pt(k), 0.0)
        for s in (-1, 1):
            c.malla(sc.bolita(f'cuenca {k} {s}', p + np.array([s * 0.025, 0.06 * np.sign(y), 0.01]), 0.014, coll, n=1), P_('#100C0A', 'liso'))
    F.marca('luz', (0, 0, 1.0))
    return F


@cosa('carreta')
def carreta(coll):
    F = nueva('carreta', voxel=0.016, carril=1)
    c = F.pieza('cuerpo', (0, 0, 0), tris=2400)
    md = madera(1, '#5A3E26', eje='y')
    c.caja((0, 0, 0.38), (0.36, 0.55, 0.03), 0.01, md, 0.0)
    for s in (-1, 1):
        tablas(c, (s * 0.35, 0, 0.55), (0.025, 0.55, 0.16), 2, 3, md)
        tablas(c, (0, s * 0.54, 0.55), (0.36, 0.025, 0.16), 2, 3, md)
    for x in (-0.36, 0.36):
        for y in (-0.55, 0.55):
            c.caja((x, y, 0.5), (0.03, 0.03, 0.2), 0.008, hierro(2), 0.0)
    for z in (0.44, 0.66):
        for s in (-1, 1):
            c.caja((s * 0.38, 0, z), (0.008, 0.56, 0.015), 0.004, hierro(3), 0.0)
    c.caja((0, 0, 0.28), (0.06, 0.55, 0.05), 0.01, md, 0.0)
    # carga: el relicario con cristales de sangre
    c.caja((0, -0.05, 0.53), (0.24, 0.3, 0.12), 0.02, madera(4, '#3A1A1A', eje='x'), 0.0)
    for k in range(5):
        a = k * 1.25
        b = np.array([math.cos(a) * 0.12, -0.05 + math.sin(a) * 0.18, 0.62])
        c.malla(sc.punta(f'cristal carga {k}', b, b + np.array([math.cos(a) * 0.05, math.sin(a) * 0.05, 0.22 + 0.05 * (k % 2)]), 0.05, coll, seg=6, medio=0.9),
                brillo('rojo', '#FF2A1A'))
    c.trazo([(0, 0.58, 0.3), (0, 0.8, 0.32), (-0.08, 0.85, 0.32), (0.08, 0.85, 0.32)], 0.025, hierro(5), 0.0)
    F.marca('luz', (0, -0.05, 0.8))
    for k, (y, nombre) in enumerate(((0.38, 'extra_rueda_del'), (-0.38, 'extra_rueda_tras'))):
        w = F.pieza(nombre, (0, y, 0.2), tris=600)
        w.cono((-0.42, y, 0.2), (0.42, y, 0.2), 0.025, 0.025, hierro(6), 0.0)
        for s in (-1, 1):
            rueda = sc.torno(f'rueda {nombre} {s}', [(0.0, -0.03), (0.19, -0.03), (0.2, -0.015), (0.2, 0.015), (0.19, 0.03), (0.0, 0.03)], coll, segmentos=16,
                             centro=(s * 0.4, y, 0.2), eje=(1, 0, 0))
            w.malla(rueda, hierro(7 + k, '#3E3E44'))
            w.malla(sc.torno(f'pestaña {nombre} {s}', [(0.0, -0.008), (0.23, -0.008), (0.23, 0.008), (0.0, 0.008)], coll, segmentos=16,
                             centro=(s * (0.4 + 0.035), y, 0.2), eje=(1, 0, 0)), hierro(9))
    return F


def _bipedo(F, coll, piel, ropa, ropa2, pelo, ojo_pt, alto=1.0, botas_pt=None, cabeza_extra=None, tris=(900, 700, 300, 260)):
    """Personita por piezas (para el prisionero y la guardia): torso con túnica, cabeza cuadradita, brazos y piernas."""
    k = alto
    c = F.pieza('cuerpo', (0, 0, 0.44 * k), tris=tris[0])
    torso = sf.union(sdf.round_cone((0, 0, 0.46 * k), (0, 0.02, 0.72 * k), 0.15 * k, 0.17 * k), sdf.ellipsoid((0, 0.02, 0.75 * k), (0.21 * k, 0.13 * k, 0.07 * k)),
                     k=0.05)
    c.sdf(torso, (-0.35 * k, -0.3 * k, 0.3 * k), (0.35 * k, 0.3 * k, 0.9 * k), ropa)
    c.sdf(sf.cortar(sdf.round_cone((0, 0, 0.5 * k), (0, 0, 0.36 * k), 0.17 * k, 0.21 * k), (0, 0, 0.38 * k), (0, 0, 1), 0.03, 14, 3, 0.02), (-0.35 * k, -0.35 * k, 0.25 * k),
          (0.35 * k, 0.35 * k, 0.6 * k), ropa2)
    h = F.pieza('cabeza', (0, 0.03, 0.8 * k), tris=tris[1])
    hc = np.array([0, 0.05, 0.93 * k])
    cab = sdf.round_box(hc, (0.14 * k, 0.12 * k, 0.13 * k), 0.08 * k)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.05, 0.12, 0.0]) * k, np.array([0.03, 0.02, 0.025]) * k), 0.008)
    h.sdf(cab, hc - 0.3, hc + 0.3, piel)
    ojos(h, [hc + np.array([-0.05, 0.11, 0.0]) * k, hc + np.array([0.05, 0.11, 0.0]) * k], 0.016 * k, ojo_pt, coll)
    if pelo is not None:
        h.sdf(sf.intersect(sf.cascaron(cab, 0.02), sdf.plane(hc + np.array([0, 0, 0.04]), (0, 0, -1))), hc - 0.3, hc + 0.3, pelo)
    if cabeza_extra:
        cabeza_extra(h, hc)
    for lado, s in LADOS:
        hom = np.array([s * 0.2, 0.02, 0.76]) * k
        a = F.pieza(f'brazo_{lado}', hom, tris=tris[2])
        codo, mun = np.array([s * 0.24, 0.1, 0.58]) * k, np.array([s * 0.22, 0.22, 0.5]) * k
        a.trazo([hom, codo, mun], [0.06 * k, 0.05 * k, 0.045 * k], ropa, 0.0)
        a.bola(mun + (mun - codo) * 0.35, 0.045 * k, piel, 0.0)
        cad = np.array([s * 0.08, 0.0, 0.42]) * k
        p = F.pieza(f'pierna_{lado}', cad, tris=tris[3])
        tob = np.array([s * 0.09, 0.0, 0.08]) * k
        p.cono(cad, tob, 0.07 * k, 0.055 * k, ropa2, 0.0)
        pie = tob + np.array([0, 0.04, -0.045]) * k
        p.bola(pie, np.array([0.055, 0.09, 0.04]) * k, botas_pt or piel, 0.02)
    return torso


@cosa('prisionero_cadenas')
def prisionero_cadenas(coll):
    F = nueva('prisionero_cadenas', voxel=0.01, sigue=1)
    piel = P_('#B8A08A', 'carne', color2='#7A5A5A', sangre=0.2)
    costal = P_('#7A6A4C', 'tela', barro=0.9, semilla=1)
    costal2 = P_('#5C4E38', 'tela', semilla=2)
    pelo = P_('#2E2620', 'pelo', semilla=3)
    ojo = P_('#E8DCC0', 'brillo', mat='brillo_blanco')
    hi = hierro(4, '#5A5C62')
    _bipedo(F, coll, piel, costal, costal2, pelo, ojo, alto=1.0)
    for lado, s in LADOS:
        a = F.piezas[f'brazo_{lado}']
        mun = np.array([s * 0.22, 0.22, 0.5])
        sf.cuerda_anillo(a, f'grillete {lado}', [mun + np.array([math.cos(t) * 0.06, 0.0, math.sin(t) * 0.06]) for t in np.linspace(0, 2 * math.pi, 10, endpoint=False)],
                         0.016, hi, coll)
    e = F.pieza('extra_poste', (0, -0.3, 0), tris=1100)
    e.trazo([(0, -0.3, 0.0), (0, -0.3, 1.3)], 0.07, madera(5, '#4A3220'), 0.0)
    e.caja((0, -0.3, 1.32), (0.09, 0.09, 0.04), 0.02, madera(6, '#3A2618'), 0.0)
    e.bola((0, -0.24, 0.85), (0.04, 0.03, 0.04), hi, 0.0)
    for s in (-1, 1):
        for k in range(7):
            t = k / 6
            p = np.array([0, -0.24, 0.85]) * (1 - t) + np.array([s * 0.22, 0.2, 0.5]) * t + np.array([0, 0, -0.08 * math.sin(math.pi * t)])
            e.malla(sc.bolita(f'eslabon poste {s} {k}', p, (0.014, 0.022 if k % 2 else 0.01, 0.022), coll, n=1, sub=1), hi)
    return F


@cosa('guardia_real')
def guardia_real(coll):
    """Caballero de la Guardia Real del monarca (aliado): tabardo azul y oro, yelmo con penacho."""
    F = nueva('guardia_real', voxel=0.01, aliado=1)
    placa = hierro(1, '#8A8C92')
    azul = P_('#1E3466', 'tela', semilla=2)
    oro_pt = oro(3)
    pluma = P_('#8A1414', 'tela', semilla=4)
    ojo = P_('#FFD36B', 'brillo', mat='brillo_oro')

    def yelmo(h, hc):
        y = sf.restar(sdf.round_box(hc, (0.16, 0.15, 0.15), 0.1), sdf.round_box(hc + np.array([0, 0.17, 0.0]), (0.1, 0.05, 0.012), 0.004))
        h.sdf(y, hc - 0.3, hc + 0.3, placa)
        h.malla(sc.tubo('penacho', [hc + np.array([0, -0.05, 0.15]), hc + np.array([0, -0.12, 0.24]), hc + np.array([0, -0.22, 0.2])], [0.03, 0.04, 0.01], coll,
                        segmentos=5, muestras=2, tapas=('flat', 'point')), pluma)
    torso = _bipedo(F, coll, placa, placa, azul, None, ojo, alto=1.0, botas_pt=placa, cabeza_extra=yelmo)
    c = F.piezas['cuerpo']
    tab = sf.intersect(sf.cascaron(torso, 0.012), sdf.round_box((0, 0.2, 0.55), (0.12, 0.2, 0.25), 0.02))
    c.sdf(tab, (-0.3, 0.0, 0.25), (0.3, 0.4, 0.9), azul)
    p, n = sf.hacia(torso, (0, 0.02, 0.62), (0, 1, 0), 0.02)
    if p is not None:
        c.bola(p, (0.05, 0.015, 0.05), oro_pt, 0.0)
    a = F.piezas['brazo_der']
    g = np.array([0.22, 0.3, 0.47])
    a.trazo([g + np.array([0, 0, -0.05]), g + np.array([0, 0.05, 0.5])], 0.012, hierro(5, '#9A9CA2'), 0.0)
    a.trazo([g + np.array([-0.06, 0.0, 0.0]), g + np.array([0.06, 0.0, 0.0])], 0.012, oro_pt, 0.0)
    a2 = F.piezas['brazo_izq']
    a2.sdf(sdf.round_box((-0.3, 0.2, 0.55), (0.02, 0.12, 0.15), 0.03), (-0.4, 0.0, 0.3), (-0.2, 0.4, 0.8), azul)
    a2.malla(sc.bolita('emblema escudo', (-0.325, 0.2, 0.58), (0.008, 0.04, 0.04), coll, n=2), oro_pt)
    return F


@cosa('pozo_almas')
def pozo_almas(coll):
    F = nueva('pozo_almas', voxel=0.02)
    c = F.pieza('cuerpo', (0, 0, 0), tris=3000)
    aro = sf.restar(sdf.round_cone((0, 0, 0.0), (0, 0, 0.55), 0.75, 0.72), sdf.round_cone((0, 0, -0.1), (0, 0, 0.7), 0.55, 0.55))
    c.sdf(sc.sdf_ruido(aro, 0.02, 7, 1), (-0.95, -0.95, -0.1), (0.95, 0.95, 0.75), piedra(1, '#5A5650', 0.8))
    for k in range(14):
        a = 2 * math.pi * k / 14
        c.caja((math.cos(a) * 0.65, math.sin(a) * 0.65, 0.58), (0.09, 0.14, 0.04), 0.02, piedra(2 + k, '#6A6660', 0.6), 0.0, rot=sc.rot('z', math.degrees(a)))
    c.malla(sc.torno('superficie almas', [(0.0, 0.32), (0.56, 0.3)], coll, segmentos=20), P_('#2A6A7A', 'vidrio', mat='espectro'))
    for k in range(6):
        a = 2 * math.pi * k / 6
        p = np.array([math.cos(a) * 0.3, math.sin(a) * 0.3, 0.4 + 0.1 * (k % 2)])
        c.malla(sc.bolita(f'alma {k}', p, 0.05, coll, n=2), brillo('azul', '#5ED8FF'))
    for s in (-1, 1):
        c.trazo([(s * 0.72, 0, 0.5), (s * 0.72, 0, 1.6)], 0.06, madera(3, '#4A3220'), 0.0)
    c.trazo([(-0.85, 0, 1.55), (0.85, 0, 1.55)], 0.05, madera(4, '#4A3220'), 0.0)
    for s in (-1, 1):
        c.caja((0, s * 0.35, 1.78), (0.95, 0.42, 0.025), 0.01, madera(5, '#3A2618'), 0.0, rot=sc.rot('x', s * 32))
    c.trazo([(0.72, 0, 1.2), (0.88, 0, 1.2), (0.88, 0.12, 1.12)], 0.025, hierro(6), 0.0)
    for k in range(6):
        c.malla(sc.bolita(f'cadena pozo {k}', (0, 0, 1.5 - 0.1 * k), (0.012, 0.012 if k % 2 else 0.004, 0.035), coll, n=1, sub=1), hierro(7))
    c.cono((0, 0, 0.82), (0, 0, 0.95), 0.1, 0.12, madera(8, '#4A3220', eje='z'), 0.0)
    F.marca('luz', (0, 0, 0.6))
    return F


@cosa('forja')
def forja(coll):
    F = nueva('forja', voxel=0.02)
    c = F.pieza('cuerpo', (0, 0, 0), tris=3600)
    hogar = sf.restar(sdf.round_box((0, 0, 0.4), (0.6, 0.45, 0.4), 0.04), sdf.round_box((0, 0.1, 0.78), (0.42, 0.3, 0.1), 0.03))
    c.sdf(sc.sdf_ruido(hogar, 0.015, 8, 1), (-0.8, -0.65, -0.05), (0.8, 0.65, 0.95), piedra(1, '#4E4842', 0.2))
    c.sdf(sc.sdf_ruido(sdf.round_box((0, 0.1, 0.72), (0.4, 0.28, 0.05), 0.03), 0.02, 12, 3), (-0.5, -0.3, 0.6), (0.5, 0.5, 0.85), brillo('fuego', '#FF6A1A'))
    for k in range(8):
        a = k * 0.8
        c.malla(sc.punta(f'llama forja {k}', (math.cos(a) * 0.2, 0.1 + math.sin(a) * 0.12, 0.76), (math.cos(a) * 0.22, 0.1 + math.sin(a) * 0.14, 0.95 + 0.06 * (k % 3)),
                         0.05, coll, seg=5), brillo('ambar', '#FFAA33'))
    camp = sf.restar(sdf.round_cone((0, -0.05, 1.3), (0, -0.05, 2.2), 0.55, 0.18), sdf.round_cone((0, -0.05, 1.25), (0, -0.05, 2.25), 0.5, 0.13))
    c.sdf(camp, (-0.7, -0.7, 1.2), (0.7, 0.6, 2.3), hierro(2, '#3A3A3E'))
    for s in (-1, 1):
        c.trazo([(s * 0.5, -0.35, 0.8), (s * 0.48, -0.3, 1.32)], 0.04, hierro(3, '#3A3A3E'), 0.0)
    # yunque al frente y fuelle al lado
    y = np.array([0.0, 0.85, 0.0])
    c.caja(y + np.array([0, 0, 0.18]), (0.14, 0.14, 0.18), 0.02, madera(4, '#3A2618'), 0.0)
    yun = sf.union(sdf.round_box(y + np.array([0, 0, 0.42]), (0.28, 0.1, 0.06), 0.02), sdf.round_box(y + np.array([0, 0, 0.36]), (0.1, 0.07, 0.06), 0.02),
                   sdf.round_cone(y + np.array([0.26, 0, 0.44]), y + np.array([0.42, 0, 0.45]), 0.06, 0.01), k=0.03)
    c.sdf(yun, y - np.array([0.5, 0.3, 0]), y + np.array([0.6, 0.3, 0.6]), hierro(5, '#3E4046'))
    f = np.array([-0.85, 0.0, 0.5])
    c.sdf(sdf.round_box(f, (0.1, 0.25, 0.15), 0.08), f - 0.4, f + 0.4, P_('#4A3020', 'cuero', semilla=6))
    for s in (-1, 1):
        c.caja(f + np.array([0, 0, s * 0.15]), (0.12, 0.27, 0.015), 0.006, madera(7), 0.0)
    c.trazo([f + np.array([0.0, 0.25, 0.0]), f + np.array([0.25, 0.25, 0.1])], 0.03, madera(8), 0.0)
    # herramientas colgadas
    for k in range(3):
        x = -0.3 + 0.3 * k
        c.trazo([(x, -0.5, 1.15), (x, -0.5, 0.85)], 0.015, madera(9 + k), 0.0)
        c.caja((x, -0.5, 1.15), (0.06, 0.02, 0.03), 0.01, hierro(10 + k), 0.0)
    F.marca('llama', (0, 0.1, 0.9))
    return F


@cosa('torreta_ballesta')
def torreta_ballesta(coll):
    F = nueva('torreta_ballesta', voxel=0.012, construccion=1)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1200)
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.5
        c.trazo([(0, 0, 0.55), (math.cos(a) * 0.35, math.sin(a) * 0.35, 0.0)], 0.03, madera(k, '#5A3E26'), 0.0)
        c.caja((math.cos(a) * 0.35, math.sin(a) * 0.35, 0.02), (0.05, 0.05, 0.02), 0.01, hierro(3 + k), 0.0)
    c.cono((0, 0, 0.5), (0, 0, 0.6), 0.07, 0.07, hierro(6), 0.0)
    for s in (-1, 1):
        sf.cuerda_anillo(c, f'amarre {s}', [(math.cos(t) * 0.075, math.sin(t) * 0.075, 0.5 + 0.03 * s) for t in np.linspace(0, 2 * math.pi, 10, endpoint=False)],
                         0.008, P_('#8A7450', 'cuero', semilla=7), coll)
    e = F.pieza('extra_arco', (0, 0, 0.62), tris=1300)
    md = madera(8, '#4E3420', eje='y')
    e.caja((0, 0.05, 0.66), (0.04, 0.4, 0.035), 0.012, md, 0.0)
    arco = [(-0.42, 0.32, 0.68), (-0.22, 0.42, 0.68), (0, 0.44, 0.68), (0.22, 0.42, 0.68), (0.42, 0.32, 0.68)]
    e.trazo(arco, [0.012, 0.02, 0.026, 0.02, 0.012], hierro(9, '#5A5C62'), 0.0)
    e.malla(sc.tubo('cuerda', [arco[0], (0, 0.0, 0.7), arco[-1]], 0.005, coll, segmentos=3, muestras=1), P_('#C9B88A', 'cuero'))
    e.malla(sc.tubo('virote', [(0, 0.0, 0.71), (0, 0.5, 0.71)], 0.01, coll, segmentos=4, muestras=1), md)
    sf.diente(e, 'punta virote', (0, 0.5, 0.71), (0, 0.6, 0.71), 0.02, hierro(10), coll)
    e.trazo([(0, -0.3, 0.66), (0.0, -0.4, 0.6), (0.06, -0.42, 0.6)], 0.012, hierro(11), 0.0)
    F.marca('punta', (0, 0.62, 0.71))
    return F


@cosa('trampa')
def trampa(coll):
    F = nueva('trampa', voxel=0.006, construccion=1)
    c = F.pieza('cuerpo', (0, 0, 0), tris=500)
    hi = hierro(1, '#5A5C62')
    c.caja((0, 0, 0.015), (0.06, 0.06, 0.012), 0.005, hi, 0.0)
    c.trazo([(-0.24, 0, 0.02), (0.24, 0, 0.02)], 0.012, hi, 0.0)
    for k in range(4):
        c.malla(sc.bolita(f'eslabon {k}', (0.26 + 0.03 * k, 0.0, 0.012), (0.018, 0.008, 0.008 if k % 2 else 0.003), coll, n=1, sub=1), hi)
    for s, nombre in ((-1, 'extra_quijada_a'), (1, 'extra_quijada_b')):
        q = F.pieza(nombre, (0, 0, 0.02), tris=500)
        arco = [(math.cos(a) * 0.2, s * math.sin(a) * 0.2, 0.02) for a in np.linspace(0, math.pi, 9)]
        q.trazo(arco, 0.011, hi, 0.0)
        for k in range(7):
            a = math.pi * (k + 1) / 8
            b = np.array([math.cos(a) * 0.2, s * math.sin(a) * 0.2, 0.02])
            sf.diente(q, f'diente {k}', b, b + np.array([0, 0, 0.05]), 0.012, hi, coll)
    return F


@cosa('tumba_abierta')
def tumba_abierta(coll):
    F = nueva('tumba_abierta', voxel=0.016)
    c = F.pieza('cuerpo', (0, 0, 0), tris=2600)
    tierra = P_('#3A2C20', 'piedra', semilla=1, musgo=0.3, var=1.3)
    mont = sf.restar(sdf.round_box((0, 0, 0.0), (0.45, 0.8, 0.12), 0.1), sdf.round_box((0, 0, 0.05), (0.3, 0.62, 0.3), 0.04))
    c.sdf(sc.sdf_ruido(mont, 0.02, 9, 2), (-0.7, -1.0, -0.2), (0.7, 1.0, 0.3), tierra)
    c.sdf(sc.sdf_ruido(sdf.ellipsoid((0.5, 0.3, 0.05), (0.25, 0.35, 0.15)), 0.02, 9, 3), (0.15, -0.2, -0.1), (0.85, 0.75, 0.3), tierra)
    c.caja((0, 0, -0.02), (0.3, 0.62, 0.02), 0.01, P_('#0E0A08', 'liso'), 0.0)
    lp = sf.restar(sdf.round_box((0, -0.85, 0.42), (0.28, 0.07, 0.4), 0.06), sdf.round_box((0.15, -0.85, 0.85), (0.2, 0.2, 0.1), 0.0, rot=sc.rot('y', 30)))
    c.sdf(sc.sdf_ruido(lp, 0.01, 14, 4), (-0.4, -1.0, -0.05), (0.4, -0.7, 0.9), piedra(5, '#5A5650', 0.8))
    c.caja((-0.55, 0.1, 0.12), (0.2, 0.55, 0.025), 0.01, madera(6, '#3A2618', eje='y'), 0.0, rot=sc.rot('y', 35))
    # mano esquelética que sale del hueco
    m = np.array([0.1, 0.25, 0.0])
    c.trazo([m, m + np.array([0, 0, 0.18])], [0.018, 0.015], hueso_pt(7), 0.0)
    mano_garra(c, m + np.array([0, 0, 0.18]), (0.0, 0.2, 1.0), hueso_pt(8), P_('#2A2420', 'liso'), coll, 'mano tumba', tam=1.2, abajo=(0, 1, 0))
    return F


@cosa('totem_maleficio')
def totem_maleficio(coll):
    F = nueva('totem_maleficio', voxel=0.012, construccion=1)
    c = F.pieza('cuerpo', (0, 0, 0), tris=2400)
    md = madera(1, '#3A2A22')
    c.trazo([(0, 0, 0.0), (0.03, 0.0, 0.6), (-0.02, 0.01, 1.2), (0.0, 0.0, 1.4)], [0.07, 0.06, 0.05, 0.04], md, 0.0)
    c.sdf(sc.sdf_ruido(sdf.ellipsoid((0, 0, 0.03), (0.22, 0.22, 0.06)), 0.02, 8, 1), (-0.35, -0.35, -0.05), (0.35, 0.35, 0.12), piedra(2, '#3A3430', 0.6))
    for s in (-1, 1):
        sf.cuerno(c, f'cuerna {s}', [(0, 0, 1.3), (s * 0.12, 0.02, 1.42), (s * 0.25, 0.0, 1.55), (s * 0.3, -0.03, 1.7)], 0.03, hueso_pt(3), coll)
        sf.cuerno(c, f'rama cuerna {s}', [(s * 0.2, 0.01, 1.5), (s * 0.18, 0.06, 1.62)], 0.018, hueso_pt(4), coll)
    cr = np.array([0, 0.06, 1.28])
    c.bola(cr, (0.09, 0.1, 0.085), hueso_pt(5), 0.0)
    ojos(c, [cr + np.array([-0.035, 0.085, 0.01]), cr + np.array([0.035, 0.085, 0.01])], 0.02, brillo('violeta', '#C46BFF'), coll)
    for k in range(4):
        z = 0.4 + 0.18 * k
        c.malla(sc.tubo(f'runa {k}', [(-0.04, 0.06, z), (0.0, 0.07, z + 0.06), (0.04, 0.06, z)], 0.012, coll, segmentos=4, muestras=1), brillo('violeta', '#C46BFF'))
    for k in range(6):
        a = 2 * math.pi * k / 6
        b = np.array([math.cos(a) * 0.05, math.sin(a) * 0.05, 1.12])
        e = b + np.array([math.cos(a) * 0.05, math.sin(a) * 0.05, -0.2 - 0.05 * (k % 2)])
        c.malla(sc.tubo(f'hilo {k}', [b, e], 0.004, coll, segmentos=3, muestras=1), P_('#7A1210', 'tela'))
        if k % 2:
            c.malla(sf.pluma(f'pluma {k}', e, e + np.array([0, 0, -0.12]), 0.035, coll, normal=(math.cos(a), math.sin(a), 0)), P_('#18151C', 'pelo'))
        else:
            c.bola(e, (0.02, 0.015, 0.03), hueso_pt(6 + k), 0.0)
    F.marca('luz', (0, 0.1, 1.3))
    return F


# --- extras de los objetivos ------------------------------------------------------

@cosa('huevo_dragon')
def huevo_dragon(coll):
    F = nueva('huevo_dragon', voxel=0.01)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1200)
    f = sdf.ellipsoid((0, 0, 0.26), (0.18, 0.18, 0.26))
    c.sdf(sc.sdf_ruido(f, 0.01, 10, 1), (-0.25, -0.25, -0.02), (0.25, 0.25, 0.56), piedra(1, '#5A5450', 0.5))
    for k in range(10):
        a = k * 0.63
        p, n = sf.hacia(f, (0, 0, 0.26), (math.cos(a), math.sin(a), -0.6 + 0.15 * k))
        if p is not None:
            c.malla(sc.punta(f'escama {k}', p - n * 0.01, p + n * 0.03 + np.array([0, 0, -0.03]), 0.04, coll, seg=4), piedra(2 + k, '#4A4440', 0.3))
    pts = []
    for k in range(8):
        a = k * 0.7
        p, n = sf.hacia(f, (0, 0, 0.26), (math.cos(a) * 1.0, math.sin(a) * 1.0, 0.8 - k * 0.2))
        if p is not None:
            pts.append(p + n * 0.004)
    if len(pts) > 2:
        c.malla(sc.tubo('grieta', pts, 0.01, coll, segmentos=4, muestras=2), brillo('fuego', '#FF6A1A'))
    F.marca('luz', (0, 0, 0.3))
    return F


@cosa('frasco_alquimia')
def frasco_alquimia(coll):
    F = nueva('frasco_alquimia', voxel=0.008)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1100)
    c.sdf(sf.union(sdf.ellipsoid((0, 0, 0.16), (0.14, 0.14, 0.14)), sdf.round_cone((0, 0, 0.26), (0, 0, 0.42), 0.04, 0.035), k=0.03), (-0.2, -0.2, 0.0),
          (0.2, 0.2, 0.46), P_('#6FA88A', 'vidrio', mat='espectro'))
    c.sdf(sf.restar(sdf.ellipsoid((0, 0, 0.15), (0.12, 0.12, 0.12)), sdf.plane((0, 0, 0.18), (0, 0, -1))), (-0.18, -0.18, 0.0), (0.18, 0.18, 0.2), brillo('verde', '#7CFF4A'))
    c.cono((0, 0, 0.41), (0, 0, 0.46), 0.04, 0.045, madera(3, '#8A6A44'), 0.0)
    c.malla(sc.torno('soporte', [(0.0, 0.0), (0.16, 0.0), (0.16, 0.03), (0.0, 0.03)], coll, segmentos=12), hierro(4))
    for k in range(3):
        a = 2 * math.pi * k / 3
        c.trazo([(math.cos(a) * 0.15, math.sin(a) * 0.15, 0.02), (math.cos(a) * 0.13, math.sin(a) * 0.13, 0.12)], 0.01, hierro(5), 0.0)
    for k in range(4):
        c.malla(sc.bolita(f'burbuja {k}', (0.03 * math.cos(k * 2), 0.03 * math.sin(k * 2), 0.48 + 0.05 * k), 0.012 + 0.004 * k, coll, n=1, sub=1),
                P_('#7CFF4A', 'vidrio', mat='espectro'))
    F.marca('luz', (0, 0, 0.2))
    return F


@cosa('espiga')
def espiga(coll):
    F = nueva('espiga', voxel=0.006)
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    for k in range(7):
        a = 2 * math.pi * k / 7
        b = np.array([math.cos(a) * 0.02, math.sin(a) * 0.02, 0.0])
        top = b + np.array([math.cos(a) * 0.08, math.sin(a) * 0.08, 0.38 + 0.04 * (k % 3)])
        c.malla(sc.tubo(f'tallo {k}', [b, (b + top) / 2, top], 0.005, coll, segmentos=3, muestras=1), P_('#8A7A3A', 'madera', color2='#6A5A28'))
        for q in range(5):
            p = top + (top - b) / np.linalg.norm(top - b) * (0.01 + 0.018 * q)
            c.malla(sc.bolita(f'grano {k} {q}', p, (0.008, 0.008, 0.014), coll, n=1, sub=1), brillo('oro', '#FFD36B'))
    c.trazo([(0, 0, 0.1), (0, 0, 0.14)], 0.035, P_('#8A7450', 'cuero'), 0.0)
    F.marca('luz', (0, 0, 0.42))
    return F


@cosa('plataforma')
def plataforma(coll):
    F = nueva('plataforma', voxel=0.016, construccion=1)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1400)
    tablas(c, (0, 0, 0.42), (0.55, 0.55, 0.03), 0, 6, madera(1, '#6A4A2C', eje='y'))
    for x in (-0.48, 0.48):
        for y in (-0.48, 0.48):
            c.trazo([(x, y, 0.0), (x, y, 0.4)], 0.04, madera(2, '#4A3220'), 0.0)
    for s in (-1, 1):
        c.trazo([(s * 0.48, -0.48, 0.05), (s * 0.48, 0.48, 0.35)], 0.022, madera(3, '#4A3220'), 0.0)
        c.trazo([(-0.48, s * 0.48, 0.35), (0.48, s * 0.48, 0.05)], 0.022, madera(4, '#4A3220'), 0.0)
    return F


@cosa('bengala')
def bengala(coll):
    F = nueva('bengala', voxel=0.005)
    c = F.pieza('cuerpo', (0, 0, 0), tris=400)
    c.cono((0, 0, 0.0), (0, 0, 0.2), 0.018, 0.018, P_('#7A1414', 'cuero', semilla=1), 0.0)
    c.cono((0, 0, 0.2), (0, 0, 0.23), 0.016, 0.012, P_('#2A2420', 'liso'), 0.0)
    c.malla(sc.punta('chispa', (0, 0, 0.22), (0, 0, 0.3), 0.025, coll, seg=5), brillo('rojo', '#FF2A1A'))
    F.marca('luz', (0, 0, 0.26))
    return F


# ---------------------------------------------------------------------------
# Lo que pide el juego con su propio nombre
# ---------------------------------------------------------------------------

@cosa('santuario')
def santuario(coll):
    """Santuario de los tres santos oscuros (las bendiciones): nicho de piedra con una santa encapuchada, velas y runas."""
    F = nueva('santuario', voxel=0.018)
    c = F.pieza('cuerpo', (0, 0, 0), tris=3400)
    base = sf.union(sdf.round_box((0, 0, 0.1), (0.55, 0.4, 0.1), 0.03), sdf.round_box((0, -0.05, 0.85), (0.42, 0.3, 0.75), 0.04), k=0.02)
    nicho = sf.union(sdf.round_box((0, 0.2, 0.85), (0.28, 0.3, 0.5), 0.02), sdf.round_cone((0, 0.2, 1.3), (0, 0.2, 1.31), 0.28, 0.28), k=0.0)
    arco = sf.restar(sf.union(base, sdf.round_cone((0, -0.05, 1.55), (0, -0.05, 1.56), 0.42, 0.42)), nicho)
    c.sdf(sc.sdf_ruido(arco, 0.012, 9, 1), (-0.7, -0.6, -0.05), (0.7, 0.5, 2.05), piedra(1, '#5A5652', 0.7))
    # la santa encapuchada (estatua) con las manos juntas
    st = sf.union(sdf.round_cone((0, 0.05, 0.25), (0, 0.05, 0.95), 0.2, 0.13), sdf.ellipsoid((0, 0.06, 1.08), (0.13, 0.13, 0.15)), k=0.05)
    st = sf.restar(st, sdf.ellipsoid((0, 0.18, 1.06), (0.08, 0.06, 0.09)), 0.02)
    c.sdf(st, (-0.3, -0.25, 0.15), (0.3, 0.35, 1.3), piedra(2, '#6E6A64', 0.4))
    c.bola((0, 0.17, 0.75), (0.06, 0.05, 0.08), piedra(3, '#6E6A64', 0.2), 0.02)
    ojos(c, [(-0.035, 0.14, 1.07), (0.035, 0.14, 1.07)], 0.018, brillo('violeta', '#C46BFF'), coll)
    for k, (x, y) in enumerate(((-0.42, 0.3), (0.42, 0.3), (-0.3, 0.38), (0.32, 0.36))):
        h = 0.1 + 0.05 * (k % 2)
        c.cono((x, y, 0.2), (x, y, 0.2 + h), 0.03, 0.026, P_('#D8CCAA', 'cera', semilla=k), 0.0)
        c.malla(sc.punta(f'llama {k}', (x, y, 0.21 + h), (x, y, 0.27 + h), 0.016, coll, seg=5), brillo('ambar', '#FFAA33'))
    # círculo de runas en el piso
    for k in range(12):
        a = 2 * math.pi * k / 12
        p = np.array([math.cos(a) * 0.75, 0.35 + math.sin(a) * 0.55, 0.01])
        c.malla(sc.tubo(f'runa piso {k}', [p, p + np.array([math.cos(a + 1.6) * 0.08, math.sin(a + 1.6) * 0.06, 0])], 0.012, coll, segmentos=4, muestras=1),
                brillo('violeta', '#C46BFF'))
    F.marca('luz', (0, 0.3, 1.0))
    return F


@cosa('cofre_maldito')
def cofre_maldito(coll):
    F = nueva('cofre_maldito', voxel=0.008)

    def cerradura(c, lock):
        c.bola(lock + np.array([0, 0.012, 0.0]), (0.04, 0.02, 0.045), hueso_pt(5), 0.0)
        c.malla(sc.bolita('ojo maldito', lock + np.array([0, 0.035, 0.005]), (0.022, 0.01, 0.016), coll, n=2), brillo('violeta', '#C46BFF'))

    def adornos(c, t):
        for k, z in enumerate((0.06, 0.13)):
            ring = [(math.cos(a) * 0.32, math.sin(a) * 0.235, z + 0.02 * math.sin(a * 2)) for a in np.linspace(0, 2 * math.pi, 18, endpoint=False)]
            sf.cuerda_anillo(c, f'cadena cofre {k}', ring, 0.014, hierro(7 + k, '#3A3C42'), coll)
        t.malla(sc.tubo('grieta tapa', [(-0.28, 0.05, 0.36), (-0.1, 0.12, 0.38), (0.05, 0.08, 0.39), (0.25, 0.14, 0.36)], 0.008, coll, segmentos=4, muestras=1),
                brillo('violeta', '#C46BFF'))
    _cofre(F, coll, ancho=0.3, fondo=0.21, alto=0.2, madera_pt=madera(3, '#2A2228', eje='x'), metal=hierro(4, '#3A3C42'), adornos=adornos, cerradura=cerradura)
    F.marca('luz', (0, 0, 0.25))
    return F


@cosa('aliado_ballestero')
def aliado_ballestero(coll):
    """Ballestero aliado: capacete de hierro, gambesón y ballesta en las manos."""
    F = nueva('aliado_ballestero', voxel=0.01, aliado=1)
    piel = P_('#C8A88A', 'carne', color2='#8A6A5A')
    gambeson = P_('#6A5A3A', 'tela', semilla=2)
    pantalon = P_('#3A3434', 'tela', semilla=3, barro=0.6)
    acero = hierro(4, '#8A8C92')
    ojo = P_('#FFD36B', 'brillo', mat='brillo_oro')

    def capacete(h, hc):
        h.malla(sc.torno('capacete', [(0.0, 0.17), (0.12, 0.165), (0.16, 0.12), (0.17, 0.04), (0.26, 0.0), (0.27, -0.015), (0.0, -0.01)], coll, segmentos=18,
                         centro=tuple(hc + np.array([0, 0, 0.08])), eje=(0, 0, 1)), acero)
    _bipedo(F, coll, piel, gambeson, pantalon, P_('#3A2A20', 'pelo'), ojo, alto=1.0, botas_pt=P_('#2A1C14', 'cuero'), cabeza_extra=capacete)
    a = F.piezas['brazo_der']
    md = madera(5, '#4E3420', eje='y')
    b = np.array([0.15, 0.3, 0.55])
    a.caja(b + np.array([0, 0.08, 0]), (0.025, 0.2, 0.025), 0.01, md, 0.0)
    a.trazo([b + np.array([-0.2, 0.22, 0.02]), b + np.array([0, 0.27, 0.02]), b + np.array([0.2, 0.22, 0.02])], [0.008, 0.012, 0.008], acero, 0.0)
    a.malla(sc.tubo('cuerda ballesta', [b + np.array([-0.2, 0.22, 0.03]), b + np.array([0, 0.1, 0.03]), b + np.array([0.2, 0.22, 0.03])], 0.003, coll,
                    segmentos=3, muestras=1), P_('#C9B88A', 'cuero'))
    return F


# alias: el juego busca estos nombres (comparten la malla con la cosa original)
COSAS.update({'prisionero': 'prisionero_cadenas', 'campana': 'campana_extraccion', 'torreta': 'torreta_ballesta', 'totem': 'totem_maleficio',
              'aliado_caballero': 'guardia_real'})
