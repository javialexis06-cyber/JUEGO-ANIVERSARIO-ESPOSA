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


@cosa('rosa_velo')
def rosa_velo(coll):
    """Rosa del velo (secundario): las rosas que crecen por donde pasa Lara, ennegrecidas por la ceniza; el corazón
    todavía brilla rojo."""
    F = nueva('rosa_velo', voxel=0.005)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1500)
    tallo = P_('#2A3A22', 'madera', color2='#18220F', eje='z')
    hoja = P_('#24301C', 'tela', semilla=2)
    petalo = P_('#1C1418', 'tela', semilla=3, var=0.6)
    centro = brillo('rojo', '#FF2A2A')
    pts = [(0, 0, 0.0), (0.02, 0.01, 0.12), (-0.01, 0.0, 0.24), (0.0, 0.0, 0.32)]
    c.trazo(pts, [0.012, 0.01, 0.009, 0.008], tallo, 0.0)
    for k, z in enumerate((0.08, 0.17, 0.25)):
        a = k * 2.3
        b = np.array([0.0, 0.0, z])
        sf.diente(c, f'espina {k}', b, b + np.array([math.cos(a) * 0.025, math.sin(a) * 0.025, 0.01]), 0.005, tallo, coll)
        e = b + np.array([math.cos(a + 1) * 0.09, math.sin(a + 1) * 0.09, 0.03])
        c.malla(sf.pluma(f'hoja {k}', b, e, 0.035, coll, normal=(math.cos(a + 2.6), math.sin(a + 2.6), 0.6), dientes=5), hoja)
    flor = np.array([0.0, 0.0, 0.36])
    c.bola(flor, (0.03, 0.03, 0.03), centro, 0.0)
    for capa, (n, r, alto, abre) in enumerate(((5, 0.04, 0.05, 0.3), (6, 0.058, 0.045, 0.7), (7, 0.075, 0.035, 1.1))):
        for k in range(n):
            a = 2 * math.pi * k / n + capa * 0.5
            base = flor + np.array([math.cos(a) * 0.012, math.sin(a) * 0.012, -0.02])
            punta = flor + np.array([math.cos(a) * r, math.sin(a) * r, alto - 0.02 * abre])
            c.malla(sf.pluma(f'petalo {capa} {k}', base, punta, 0.045 + 0.01 * capa, coll, normal=(-math.sin(a) * 0.3, math.cos(a) * 0.3, 1), grosor=0.003),
                    petalo)
    for k in range(4):
        a = k * 1.6
        c.bola((math.cos(a) * 0.06, math.sin(a) * 0.05, 0.0), (0.04, 0.03, 0.012), P_('#4A4644', 'piedra', semilla=10 + k, musgo=0.0), 0.0)
    F.marca('luz', (0, 0, 0.36))
    return F


@cosa('pluma_grifo')
def pluma_grifo(coll):
    """Pluma de grifo (secundario): una pluma dorada de Aura que se le cayó a un grifo de la frontera, clavada en el
    piso y brillando."""
    F = nueva('pluma_grifo', voxel=0.005, flota=1)
    c = F.pieza('cuerpo', (0, 0, 0.2), tris=900)
    raiz, punta = np.array([0.0, 0.0, 0.02]), np.array([0.05, 0.02, 0.5])
    c.malla(sf.pluma('pluma', raiz, punta, 0.11, coll, normal=(0.2, -1, 0.1), grosor=0.006, dientes=9), P_('#E0B04A', 'oro', semilla=1))
    c.trazo([raiz - np.array([0, 0, 0.04]), punta], [0.006, 0.003], P_('#F0D488', 'oro', semilla=2), 0.0)
    for k in range(5):
        t = 0.3 + 0.12 * k
        b = raiz + (punta - raiz) * t
        c.malla(sc.bolita(f'chispa {k}', b + np.array([0.04 * math.sin(k * 2), -0.03, 0.0]), 0.008, coll, n=1, sub=1), brillo('oro', '#FFD36B'))
    F.marca('luz', (0.03, 0, 0.3))
    return F


@cosa('hongo_tumba')
def hongo_tumba(coll):
    """Hongo de tumba (secundario): un racimo de hongos pálidos que brillan verde, crecidos en un hueso viejo."""
    F = nueva('hongo_tumba', voxel=0.005)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    sf.hueso_largo(c, np.array([-0.12, -0.02, 0.025]), np.array([0.12, 0.03, 0.025]), 0.02, hueso_pt(1))
    pie = P_('#CFC6A8', 'cera', semilla=2)
    som = P_('#7A8A5A', 'tela', semilla=3)
    for k, (x, y, h, r) in enumerate(((0.0, 0.0, 0.16, 0.06), (-0.07, 0.04, 0.11, 0.045), (0.06, -0.04, 0.09, 0.04), (0.09, 0.05, 0.07, 0.03),
                                      (-0.04, -0.06, 0.06, 0.028))):
        b = np.array([x, y, 0.03])
        c.cono(b, b + np.array([0.0, 0.0, h]), r * 0.35, r * 0.28, pie, 0.004)
        sombrero = sf.restar(sdf.ellipsoid(b + np.array([0, 0, h]), (r, r, r * 0.6)), sdf.plane(b + np.array([0, 0, h - r * 0.05]), (0, 0, 1)), 0.0)
        c.sdf(sc.sdf_ruido(sombrero, 0.003, 40, k), b + np.array([-r - 0.02, -r - 0.02, h - 0.05]), b + np.array([r + 0.02, r + 0.02, h + r]), som)
        for q in range(4):
            a = q * 1.6 + k
            c.malla(sc.bolita(f'punto {k} {q}', b + np.array([math.cos(a) * r * 0.5, math.sin(a) * r * 0.5, h + r * 0.45]), r * 0.12, coll, n=1, sub=1),
                    brillo('verde', '#7CFF4A'))
    F.marca('luz', (0, 0, 0.12))
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


def _unit(v):
    v = np.asarray(v, float)
    return v / (np.linalg.norm(v) or 1)


def _eslabones(c, nombre, pts, alambre, coll, pt, largo=0.075):
    """Cadena de eslabones de verdad a lo largo de una polilínea (uno de canto y otro de plano, alternados)."""
    pts = [np.asarray(p, float) for p in pts]
    seg = []
    for a, b in zip(pts[:-1], pts[1:]):
        n = max(1, int(round(np.linalg.norm(b - a) / largo)))
        for k in range(n):
            seg.append((a + (b - a) * k / n, a + (b - a) * (k + 1) / n))
    for k, (a, b) in enumerate(seg):
        d = _unit(b - a)
        lat = _unit(np.cross(d, [0.3, 0.2, 1.0]))
        if k % 2:
            lat = _unit(np.cross(d, lat))
        L = np.linalg.norm(b - a) * 0.66
        cc = (a + b) / 2
        ring = [cc + d * math.cos(t) * L + lat * math.sin(t) * L * 0.62 for t in np.linspace(0, 2 * math.pi, 8, endpoint=False)]
        c.malla(sc.clay.sweep(f'{nombre} {k}', ring, alambre, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), pt)


def _sepulcro(F, coll, abierto):
    """Sepulcro de la etapa final: sarcófago de piedra sobre una grada, sellado con cadenas y runas de ceniza (las de
    Nath'Gora), con un caballero tallado en la tapa. Cerrado guarda a un custodio; abierto, la tapa partida queda
    corrida (un pedazo de lado sobre el borde y el otro recostado atrás), las cadenas rotas y brasa en el hueco."""
    c = F.pieza('cuerpo', (0, 0, 0), tris=7600)
    pd = piedra(1, '#5E5A55', 0.55)
    pd_osc = piedra(2, '#45413D', 0.7)
    pd_clara = piedra(8, '#A39C90', 0.25)
    runa = brillo('rojo', '#FF3A1A')
    hc = hierro(3, '#3A3C42')
    # grada de dos escalones, gastada, con una esquina mordida
    grada = sf.union(sdf.round_box((0, 0, 0.05), (0.98, 0.58, 0.05), 0.02), sdf.round_box((0, 0, 0.13), (0.9, 0.5, 0.04), 0.02), k=0.0)
    grada = sf.restar(grada, sdf.round_box((0.86, -0.56, 0.14), (0.14, 0.09, 0.08), 0.02, sc.rot('z', 30)))
    c.sdf(sc.sdf_ruido(grada, 0.008, 12, 1), (-1.1, -0.7, -0.02), (1.1, 0.7, 0.2), pd_osc)
    # el cajón: zócalo, moldura de arriba, el nicho de la cara de adelante y una esquina descascarada
    caja = sf.union(sdf.round_box((0, 0, 0.42), (0.78, 0.38, 0.26), 0.03), sdf.round_box((0, 0, 0.19), (0.82, 0.42, 0.04), 0.015),
                    sdf.round_box((0, 0, 0.66), (0.8, 0.4, 0.025), 0.012), k=0.0)
    caja = sf.restar(caja, sdf.round_box((0, -0.4, 0.42), (0.6, 0.04, 0.15), 0.02))
    for sx in (-1, 1):
        caja = sf.restar(caja, sdf.round_box((sx * 0.79, 0, 0.42), (0.04, 0.26, 0.13), 0.02))
    if abierto:
        caja = sf.restar(caja, sdf.round_box((0, 0, 0.64), (0.68, 0.28, 0.2), 0.02))
    caja = sf.restar(caja, sdf.round_box((-0.79, -0.39, 0.64), (0.09, 0.07, 0.1), 0.01, sc.rot('z', 35)))
    c.sdf(sc.sdf_ruido(caja, 0.007, 16, 2), (-0.9, -0.5, 0.12), (0.9, 0.5, 0.72), pd)
    # relieve del frente: calavera con alas de murciélago entre dos columnitas torcidas
    c.bola((0, -0.395, 0.45), (0.075, 0.035, 0.08), hueso_pt(3), 0.0)
    c.caja((0, -0.41, 0.38), (0.04, 0.02, 0.022), 0.01, hueso_pt(4), 0.0)
    ojos(c, [(-0.028, -0.43, 0.46), (0.028, -0.43, 0.46)], 0.017, runa, coll)
    for sx in (-1, 1):
        ala = [(sx * 0.09, -0.4, 0.47), (sx * 0.25, -0.4, 0.53), (sx * 0.42, -0.4, 0.47), (sx * 0.55, -0.4, 0.37)]
        c.trazo(ala, [0.024, 0.02, 0.015, 0.008], pd_clara, 0.01)
        for k in range(4):
            b = np.array([sx * (0.16 + 0.11 * k), -0.4, 0.51 - 0.025 * k])
            c.trazo([b, b + np.array([sx * 0.03, 0, -0.11 + 0.01 * k])], [0.012, 0.004], pd_clara, 0.005)
        col = [(sx * 0.7 + 0.012 * math.sin(t * 9), -0.41, 0.22 + 0.42 * t) for t in np.linspace(0, 1, 9)]
        c.trazo(col, [0.038, 0.032, 0.036, 0.03, 0.035, 0.03, 0.034, 0.03, 0.036], pd_osc, 0.0)
        c.caja((sx * 0.7, -0.41, 0.645), (0.05, 0.03, 0.02), 0.008, pd_osc, 0.0)
    # runas de ceniza en el zócalo y en los paneles de los costados
    for k in range(7):
        x = -0.6 + 0.2 * k
        pts = [(x - 0.035, -0.425, 0.25), (x, -0.425, 0.29), (x + 0.035, -0.425, 0.25)] if k % 2 else [(x, -0.425, 0.23), (x, -0.425, 0.3), (x + 0.03, -0.425, 0.27)]
        c.malla(sc.tubo(f'runa frente {k}', pts, 0.008, coll, segmentos=4, muestras=1), runa)
    for sx in (-1, 1):
        for k in range(3):
            y = -0.16 + 0.16 * k
            c.malla(sc.tubo(f'runa lado {sx} {k}', [(sx * 0.755, y - 0.035, 0.36), (sx * 0.755, y, 0.46), (sx * 0.755, y + 0.035, 0.36), (sx * 0.755, y - 0.02, 0.4)],
                            0.008, coll, segmentos=4, muestras=1), runa)
    if not abierto:
        # tapa a dos aguas, con su borde tallado y grietas por donde se asoma la brasa
        tapa = sf.union(sdf.round_box((0, 0, 0.72), (0.84, 0.44, 0.04), 0.015), sdf.round_box((0, 0, 0.775), (0.78, 0.37, 0.03), 0.02), k=0.02)
        for sy in (-1, 1):
            tapa = sf.restar(tapa, sdf.round_box((0, sy * 0.405, 0.72), (0.8, 0.008, 0.012), 0.004))
        c.sdf(sc.sdf_ruido(tapa, 0.006, 14, 6), (-0.95, -0.55, 0.65), (0.95, 0.55, 0.85), pd)
        for k, pts in enumerate((((0.55, -0.37, 0.8), (0.62, -0.25, 0.805), (0.58, -0.12, 0.806), (0.66, -0.02, 0.805)),
                                 ((-0.7, 0.1, 0.8), (-0.62, 0.2, 0.806), (-0.66, 0.33, 0.8)))):
            c.malla(sc.tubo(f'grieta tapa {k}', pts, 0.007, coll, segmentos=4, muestras=1), brillo('fuego', '#FF6A1A'))
        # el caballero tendido: yelmo, hombros, manos juntas sobre la espada y los pies
        z0 = 0.82
        cuerpo_ef = sf.union(sdf.round_cone((-0.38, 0, z0 + 0.06), (0.42, 0, z0 + 0.04), 0.16, 0.1), sdf.round_box((-0.34, 0, z0 + 0.07), (0.07, 0.21, 0.06), 0.04),
                             k=0.05)
        c.sdf(sc.sdf_ruido(cuerpo_ef, 0.005, 20, 7), (-0.6, -0.3, z0 - 0.05), (0.6, 0.3, z0 + 0.22), pd_clara)
        yelmo = sf.restar(sdf.ellipsoid((-0.56, 0, z0 + 0.07), (0.1, 0.1, 0.085)), sdf.round_box((-0.64, 0, z0 + 0.11), (0.05, 0.06, 0.012), 0.004))
        c.sdf(sc.sdf_ruido(yelmo, 0.004, 24, 8), (-0.7, -0.15, z0 - 0.04), (-0.44, 0.15, z0 + 0.18), pd_clara)
        c.trazo([(-0.66, 0, z0 + 0.13), (-0.46, 0, z0 + 0.17)], [0.012, 0.02], pd_clara, 0.01)
        for sy in (-1, 1):
            c.bola((0.5, sy * 0.06, z0 + 0.04), (0.07, 0.045, 0.05), pd_clara, 0.01)
            c.trazo([(-0.3, sy * 0.16, z0 + 0.09), (-0.12, sy * 0.1, z0 + 0.13), (-0.05, sy * 0.03, z0 + 0.15)], [0.04, 0.035, 0.03], pd_clara, 0.02)
        hoja = [(-0.08, 0, z0 + 0.16), (0.45, 0, z0 + 0.12)]
        c.trazo(hoja, [0.03, 0.012], hierro(9, '#6A6C72'), 0.0)
        c.caja((-0.08, 0, z0 + 0.17), (0.02, 0.11, 0.016), 0.006, hierro(10, '#6A6C72'), 0.0)
        c.bola((-0.13, 0, z0 + 0.17), (0.03, 0.03, 0.03), runa, 0.0)
        c.bola((-0.05, 0, z0 + 0.19), (0.05, 0.07, 0.03), pd_clara, 0.01)
        # dos cadenas de eslabones que abrazan la tapa y bajan por el frente hasta el candado
        for k, x in enumerate((-0.44, 0.4)):
            camino = [(x, -0.5, 0.18), (x, -0.47, 0.66), (x, -0.4, 0.86), (x + 0.02, 0.0, 0.92), (x, 0.4, 0.86), (x, 0.47, 0.66), (x, 0.5, 0.18)]
            _eslabones(c, f'cadena sello {k}', camino, 0.011, coll, hierro(20 + k, '#3A3C42'))
            c.trazo([(x, -0.5, 0.17), (x, -0.62, 0.17), (x, -0.64, 0.04)], 0.02, hc, 0.0)
        cand = np.array([0.0, -0.49, 0.56])
        _eslabones(c, 'cadena candado', [(-0.44, -0.48, 0.6), cand + np.array([-0.04, 0, 0.06]), cand + np.array([0.04, 0, 0.06]), (0.4, -0.48, 0.6)], 0.009, coll,
                   hierro(24, '#3A3C42'), largo=0.065)
        c.caja(cand, (0.06, 0.03, 0.065), 0.015, hierro(12, '#4A4C52'), 0.0)
        c.trazo([cand + np.array([-0.035, 0, 0.05]), cand + np.array([-0.035, 0, 0.1]), cand + np.array([0.035, 0, 0.1]), cand + np.array([0.035, 0, 0.05])], 0.009, hc, 0.0)
        c.malla(sc.bolita('ojo candado', cand + np.array([0, -0.035, 0.0]), (0.018, 0.008, 0.018), coll, n=2), runa)
        sf.remaches(c, 'remaches candado', [(cand + np.array([sx * 0.045, -0.032, sz * 0.045]), np.array([0, -1, 0])) for sx in (-1, 1) for sz in (-1, 1)],
                    0.008, hierro(13, '#6A6C72'), coll)
    else:
        def mover(f, d):
            return lambda P: f(P - np.asarray(d, float))
        # un pedazo de tapa quedó de lado sobre el borde derecho, inclinado hasta la grada
        t1 = sdf.round_box((0.0, 0.0, 0.0), (0.42, 0.42, 0.04), 0.015, sc.rot('y', 22) @ sc.rot('z', 10))
        c.sdf(sc.sdf_ruido(sf.cortar(mover(t1, (0.62, 0.05, 0.6)), (0.25, 0.05, 0.6), (1, 0.15, 0), 0.03, 20, 8), 0.006, 14, 9), (0.1, -0.6, 0.25),
              (1.15, 0.65, 0.95), pd)
        # y el otro, con medio caballero tallado, recostado contra la espalda
        t2 = sdf.round_box((0.0, 0.0, 0.0), (0.4, 0.4, 0.04), 0.015, sc.rot('x', 64) @ sc.rot('z', -6))
        c.sdf(sc.sdf_ruido(sf.cortar(mover(t2, (-0.42, 0.56, 0.44)), (-0.08, 0.56, 0.44), (-1, 0, 0.1), 0.03, 20, 10), 0.006, 14, 11), (-0.95, 0.05, 0.1),
              (0.05, 1.05, 0.85), pd)
        c.sdf(sc.sdf_ruido(mover(sdf.ellipsoid((0, 0, 0), (0.09, 0.05, 0.09)), (-0.55, 0.52, 0.62)), 0.004, 24, 12), (-0.7, 0.4, 0.5), (-0.4, 0.65, 0.75), pd_clara)
        # el hueco: ceniza, huesos y brasa viva (de ahí salió el custodio)
        c.sdf(sc.sdf_ruido(sdf.round_box((0, 0, 0.56), (0.66, 0.26, 0.03), 0.02), 0.014, 10, 12), (-0.75, -0.35, 0.48), (0.75, 0.35, 0.65),
              P_('#2A1E18', 'piedra', semilla=13, musgo=0.0))
        rng = np.random.default_rng(5)
        for k in range(22):
            x, y = rng.uniform(-0.6, 0.6), rng.uniform(-0.22, 0.22)
            r = rng.uniform(0.035, 0.07)
            c.malla(sc.bolita(f'brasa {k}', (x, y, 0.6), (r, r * 0.9, r * 0.55), coll, n=2, sub=1), brillo('fuego', '#FF6A1A'))
        for k in range(5):
            b = np.array([rng.uniform(-0.5, 0.5), rng.uniform(-0.18, 0.18), 0.62])
            sf.hueso_largo(c, b, b + np.array([rng.uniform(-0.15, 0.15), rng.uniform(-0.08, 0.08), 0.02]), 0.014, hueso_pt(30 + k))
        c.bola((0.3, 0.05, 0.64), (0.07, 0.06, 0.065), hueso_pt(36), 0.0)
        # cadenas reventadas: los cabos cuelgan del frente y quedan regados en la grada
        for k, x in enumerate((-0.44, 0.4)):
            _eslabones(c, f'cabo {k}', [(x, -0.5, 0.18), (x, -0.47, 0.5), (x + 0.04, -0.5, 0.62)], 0.011, coll, hierro(20 + k, '#3A3C42'))
            c.trazo([(x, -0.5, 0.17), (x, -0.62, 0.17), (x, -0.64, 0.04)], 0.02, hc, 0.0)
        for k, (x, y, a) in enumerate(((-0.95, -0.4, 20), (0.7, -0.62, -30), (-0.3, 0.62, 170))):
            pts = [(x + 0.07 * j * math.cos(math.radians(a + 25 * math.sin(j))), y + 0.07 * j * math.sin(math.radians(a + 25 * math.sin(j))), 0.12) for j in range(7)]
            _eslabones(c, f'cadena rota {k}', pts, 0.011, coll, hierro(25 + k, '#3A3C42'))
        c.caja((0.25, -0.66, 0.11), (0.06, 0.03, 0.065), 0.015, hierro(12, '#4A4C52'), 0.0, rot=sc.rot('y', 70))
    # velas negras en las cuatro esquinas de la grada, con cera chorreada
    for k, (x, y) in enumerate(((-0.86, -0.46), (0.86, -0.46), (-0.86, 0.46), (0.86, 0.46))):
        h = 0.12 + 0.06 * (k % 2)
        c.cono((x, y, 0.18), (x, y, 0.18 + h), 0.035, 0.03, P_('#2A2426', 'cera', semilla=20 + k), 0.0)
        c.bola((x + 0.02, y, 0.19), (0.05, 0.045, 0.012), P_('#2A2426', 'cera', semilla=30 + k), 0.01)
        c.trazo([(x + 0.03, y - 0.02, 0.18 + h * 0.8), (x + 0.036, y - 0.024, 0.18 + h * 0.4)], [0.008, 0.004], P_('#2A2426', 'cera', semilla=40 + k), 0.005)
        c.malla(sc.punta(f'llama sepulcro {k}', (x, y, 0.19 + h), (x, y, 0.27 + h), 0.018, coll, seg=5), brillo('rojo', '#FF3A1A'))
    # montoncitos de ceniza y piedritas alrededor
    for k in range(7):
        a = 0.6 + k * 0.9
        c.bola((math.cos(a) * 1.02, math.sin(a) * 0.64, 0.0), (0.12, 0.08, 0.035), P_('#4A4644', 'piedra', semilla=40 + k, musgo=0.0), 0.0, ruido_amp=0.01)
        c.bola((math.cos(a + 0.4) * 1.05, math.sin(a + 0.4) * 0.68, 0.02), (0.035, 0.03, 0.025), pd_osc, 0.0, ruido_amp=0.005)
    F.marca('luz', (0, 0, 0.95 if not abierto else 0.65))
    return F


@cosa('sepulcro')
def sepulcro(coll):
    return _sepulcro(nueva('sepulcro', voxel=0.014), coll, False)


@cosa('sepulcro_abierto')
def sepulcro_abierto(coll):
    return _sepulcro(nueva('sepulcro_abierto', voxel=0.014), coll, True)


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


# ------------------------------------------------------------------------------------------------- Minerales
# Los seis minerales del Pozo (nombres del mito de Astra): se excavan de vetas sueltas y se llevan a casa.
# `c_veta_<id>` es el racimo de cristales que sale de la cara de una pared (crece hacia +Y, que el juego gira hacia lo
# abierto); `c_mineral_<id>` es el pedazo suelto que se recoge.
MINERALES = {
    # id: (cristal, brillo, nombre del brillo, cuerpo metálico)
    'plata': ('#C9D3E8', '#C4DAFF', 'plata', True),
    'chispa': ('#E0782A', '#FFAA33', 'ambar', False),
    'gema': ('#4A1A6E', '#C46BFF', 'violeta', False),
    'escarcha': ('#BFEFFF', '#8AF0FF', 'hielo', False),
    'polvo': ('#F2D9B0', '#FFE6B8', 'estrella', False),
    'esmeralda': ('#1E8A4E', '#3AFF8A', 'esmeralda', False),
}


def _cristal_pt(id_, k):
    col, bri, nom, metal = MINERALES[id_]
    if metal:
        return P_(col, 'hierro', semilla=k, var=0.4) if k % 3 else brillo(nom, bri)
    return brillo(nom, bri) if k % 2 == 0 else P_(col, 'vidrio', mat='espectro')


def _racimo(c, coll, id_, base, eje, n, largo, grosor, sem=0):
    """Racimo de cristales de seis caras que salen de `base` alrededor de `eje` (abiertos en abanico)."""
    eje = _unit(eje)
    u = _unit(np.cross(eje, [0.31, 0.17, 0.93] if abs(eje[2]) < 0.9 else [1, 0, 0]))
    w = np.cross(eje, u)
    rng = np.random.default_rng(sem)
    for k in range(n):
        a = 2 * math.pi * k / n + rng.uniform(-0.4, 0.4)
        abre = 0.25 + 0.55 * rng.uniform() * (k > 0)
        d = _unit(eje + (u * math.cos(a) + w * math.sin(a)) * abre)
        L = largo * (1.0 if k == 0 else rng.uniform(0.45, 0.85))
        r = grosor * (1.0 if k == 0 else rng.uniform(0.5, 0.8))
        b = np.asarray(base, float) + (u * math.cos(a) + w * math.sin(a)) * grosor * 0.6 * (k > 0)
        c.malla(sc.punta(f'cristal {sem} {k}', b - d * r * 0.4, b + d * L, r, coll, seg=6, medio=0.8), _cristal_pt(id_, k + sem))


def _veta_mineral(id_, coll):
    F = nueva(f'veta_{id_}', voxel=0.01)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1900)
    col = MINERALES[id_][0]
    # tres racimos grandes sobre la cara de la pared (y ≈ 0.45, metidos en la roca), a distintas alturas, y vetitas del
    # color del mineral regadas por la cara
    for k, (x, z, n, L, g) in enumerate(((-0.2, 0.4, 6, 0.6, 0.11), (0.22, 0.78, 5, 0.5, 0.095), (-0.04, 1.12, 5, 0.42, 0.085))):
        base = np.array([x, 0.5, z])
        c.bola(base, (0.15, 0.05, 0.13), piedra(20 + k, '#3A3632', 0.0), 0.0, ruido_amp=0.01)
        # (inclinados hacia arriba: desde la cámara se ven las puntas, no solo el canto)
        _racimo(c, coll, id_, base, (x * 0.8, 1.0, 0.75), n, L, g, sem=k * 7 + len(id_))
    # Y un racimo grande encima de la pared: es lo que más se ve desde arriba
    _racimo(c, coll, id_, np.array([0.0, 0.25, 1.42]), (0.0, 0.35, 1.0), 7, 0.5, 0.11, sem=40 + len(id_))
    for k in range(8):
        a = k * 1.1
        c.bola((math.cos(a) * 0.36, 0.47, 0.25 + 0.12 * k), (0.035, 0.02, 0.035), _cristal_pt(id_, 2 * k), 0.0)
    F.marca('luz', (0, 0.6, 0.7))
    return F


def _mineral_suelto(id_, coll):
    F = nueva(f'mineral_{id_}', voxel=0.005)
    c = F.pieza('cuerpo', (0, 0, 0), tris=700)
    c.sdf(sc.sdf_ruido(sdf.ellipsoid((0, 0, 0.03), (0.08, 0.065, 0.04)), 0.008, 20, 3), (-0.12, -0.12, -0.02), (0.12, 0.12, 0.09), piedra(40, '#3A3632', 0.0))
    _racimo(c, coll, id_, np.array([0.0, 0.0, 0.05]), (0, 0, 1), 6, 0.17, 0.04, sem=len(id_) * 3)
    F.marca('luz', (0, 0, 0.1))
    return F


for _id in MINERALES:
    COSAS[f'veta_{_id}'] = (lambda i: lambda coll: _veta_mineral(i, coll))(_id)
    COSAS[f'mineral_{_id}'] = (lambda i: lambda coll: _mineral_suelto(i, coll))(_id)


# ------------------------------------------------------------------------------------------------- Cofre de suministros
def _hexataud(lo_z, hi_z, esc=1.0, off=(0.0, 0.0)):
    """El contorno de un ataúd (angosto en los pies, ancho en los hombros) como sdf de prisma."""
    pts = [(-0.17, -0.6), (0.17, -0.6), (0.27, 0.22), (0.2, 0.6), (-0.2, 0.6), (-0.27, 0.22)]
    pts = [(x * esc + off[0], y * esc + off[1]) for x, y in pts]
    f = sdf.plane((0, 0, hi_z), (0, 0, 1))
    f = sf.intersect(f, sdf.plane((0, 0, lo_z), (0, 0, -1)))
    for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
        n = np.array([y1 - y0, -(x1 - x0), 0.0])
        n /= np.linalg.norm(n)
        f = sf.intersect(f, sdf.plane((x0, y0, 0), tuple(n)))
    return f


def _ataud(F, coll, abierto):
    """El ataúd de suministros que las Santas bajan con cadenas cuando se despeja el círculo: madera negra con flejes,
    la campanita dorada de las Santas en la tapa y lacres rojos. Abierto, la tapa queda tirada a un lado y adentro brilla
    la reliquia entre la paja."""
    # (cerrado lleva las cuatro cadenas largas: si el tope es chico, la simplificación se come la caja)
    c = F.pieza('cuerpo', (0, 0, 0), tris=4600 if abierto else 9500)
    md = madera(11, '#3A281A', eje='y')
    mt = hierro(12, '#4A4A50')
    dorado = oro(13)
    lacre = P_('#8A1418', 'cera', semilla=14)
    caja = sf.restar(_hexataud(0.04, 0.44), _hexataud(0.1, 0.6, 0.86)) if abierto else _hexataud(0.04, 0.44)
    c.sdf(sc.sdf_ruido(caja, 0.004, 30, 2), (-0.32, -0.66, 0.0), (0.32, 0.66, 0.5), md)
    # Flejes de hierro y remaches
    for y in (-0.42, -0.05, 0.38):
        ancho = 0.2 + (0.27 - 0.2) * (1 - abs(y - 0.22) / 0.8)
        c.caja((0, y, 0.24), (ancho + 0.015, 0.025, 0.205), 0.004, mt, 0.0)
        for s in (-1, 1):
            c.malla(sc.bolita(f'remache {y} {s}', (s * (ancho + 0.018), y, 0.36), 0.012, coll, n=1), mt)
    # Asas de argolla a los lados
    for s in (-1, 1):
        for y in (-0.3, 0.2):
            sf.cuerda_anillo(c, f'asa {s} {y}', [(s * (0.28 + 0.02 + 0.03 * (1 + math.cos(a)) / 2), y + 0.05 * math.sin(a), 0.22 + 0.04 * math.cos(a))
                                                for a in np.linspace(0, 2 * math.pi, 10, endpoint=False)], 0.008, mt, coll)
    # Paja que se sale por las rendijas
    rng = np.random.default_rng(5)
    for k in range(10):
        b = np.array([rng.uniform(-0.2, 0.2), rng.uniform(-0.45, 0.45), 0.44 if abierto else 0.43])
        d = np.array([rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(0.2, 0.8)])
        c.trazo([b, b + d / np.linalg.norm(d) * 0.09], 0.004, P_('#C8A050', 'tela', semilla=20 + k), 0.0)
    if not abierto:
        tapa = _hexataud(0.44, 0.5, 1.04)
        c.sdf(sc.sdf_ruido(tapa, 0.003, 30, 4), (-0.32, -0.66, 0.4), (0.32, 0.66, 0.56), madera(15, '#2E2016', eje='y'))
        # La campanita de las Santas en la tapa, con su cruz de flejes dorados
        c.caja((0, 0.05, 0.505), (0.02, 0.42, 0.006), 0.003, dorado, 0.0)
        c.caja((0, 0.22, 0.505), (0.17, 0.02, 0.006), 0.003, dorado, 0.0)
        c.malla(sc.torno('campanita', [(0.0, 0.0), (0.075, 0.0), (0.07, 0.015), (0.05, 0.06), (0.042, 0.1), (0.02, 0.115), (0.0, 0.118)], coll, segmentos=14,
                         centro=(0, 0.22, 0.508)), dorado)
        for s in (-1, 1):
            c.bola((s * 0.12, -0.3, 0.505), (0.035, 0.035, 0.01), lacre, 0.0)
            c.malla(sc.bolita(f'sello {s}', (s * 0.12, -0.3, 0.516), (0.018, 0.018, 0.004), coll, n=1), brillo('rojo', '#C0141A'))
        # Cadenas de las cuatro esquinas que suben a la argolla (bajó del cielo colgada de ellas)
        arriba = np.array([0.0, 0.0, 2.6])
        for k, (x, y) in enumerate(((-0.17, -0.55), (0.17, -0.55), (-0.19, 0.55), (0.19, 0.55))):
            _eslabones(c, f'cadena {k}', [(x, y, 0.5), arriba], 0.01, coll, hierro(30 + k), largo=0.12)
        sf.cuerda_anillo(c, 'argolla', [(math.cos(a) * 0.09, 0, 2.66 + math.sin(a) * 0.07) for a in np.linspace(0, 2 * math.pi, 12, endpoint=False)], 0.02,
                         mt, coll)
    else:
        # La tapa tirada al lado, de canto contra el piso
        tapa = _hexataud(0.0, 0.06, 1.04, off=(0.62, 0.08))
        c.sdf(sc.sdf_ruido(tapa, 0.003, 30, 6), (0.3, -0.62, -0.02), (0.95, 0.75, 0.1), madera(15, '#2E2016', eje='y'))
        c.malla(sc.torno('campanita caida', [(0.0, 0.0), (0.075, 0.0), (0.07, 0.015), (0.05, 0.06), (0.042, 0.1), (0.02, 0.115), (0.0, 0.118)], coll,
                         segmentos=14, centro=(0.62, 0.3, 0.06)), dorado)
        # Adentro: paja y la reliquia que brilla
        c.sdf(sc.sdf_ruido(sdf.ellipsoid((0, 0, 0.18), (0.2, 0.5, 0.1)), 0.02, 18, 7), (-0.25, -0.58, 0.05), (0.25, 0.58, 0.32), P_('#B89048', 'tela', semilla=40))
        c.bola((0, 0.05, 0.33), 0.07, brillo('violeta', '#C46BFF'), 0.0)
        for k in range(6):
            a = k * 1.05
            c.malla(sc.punta(f'rayo reliquia {k}', (math.cos(a) * 0.04, 0.05 + math.sin(a) * 0.04, 0.33), (math.cos(a) * 0.12, 0.05 + math.sin(a) * 0.12, 0.4),
                             0.012, coll, seg=4), brillo('violeta', '#C46BFF'))
        # Cadenas rotas tiradas
        for k, (x, y) in enumerate(((-0.4, -0.5), (0.0, 0.75), (-0.45, 0.4))):
            _eslabones(c, f'cadena rota {k}', [(x, y, 0.02), (x + 0.25, y + 0.1, 0.02), (x + 0.4, y - 0.1, 0.03)], 0.009, coll, hierro(30 + k), largo=0.09)
    F.marca('luz', (0, 0, 0.5))
    return F


@cosa('ataud_suministros')
def ataud_suministros(coll):
    return _ataud(nueva('ataud_suministros', voxel=0.008), coll, False)


@cosa('ataud_abierto')
def ataud_abierto(coll):
    return _ataud(nueva('ataud_abierto', voxel=0.008), coll, True)


# ------------------------------------------------------------------------------------------------- Reglas de los biomas
@cosa('veta_grisu')
def veta_grisu(coll):
    """Bolsa de grisú de las minas (va sobre la cara de una pared blanda, crece hacia +Y): ampollas de gas verde que
    brillan, grietas que soplan y la cruz de aviso que rayaron los mineros."""
    F = nueva('veta_grisu', voxel=0.01)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    gas = brillo('verde', '#7CFF4A')
    for k, (x, z, r) in enumerate(((-0.15, 0.45, 0.16), (0.18, 0.7, 0.13), (-0.05, 0.95, 0.12), (0.25, 0.35, 0.1), (-0.28, 0.8, 0.1))):
        c.bola((x, 0.52, z), (r, r * 0.6, r), P_('#5A6A3A', 'cera', semilla=50 + k), 0.0, ruido_amp=0.006)
        c.bola((x, 0.52 + r * 0.5, z), (r * 0.45, r * 0.2, r * 0.45), gas, 0.0)
    # Ampollas encima de la pared (lo que se ve desde arriba) y el gas que sale
    for k, (x, y, r) in enumerate(((-0.15, 0.1, 0.17), (0.2, 0.25, 0.13), (0.05, -0.15, 0.12))):
        c.bola((x, y, 1.45), (r, r, r * 0.7), P_('#5A6A3A', 'cera', semilla=55 + k), 0.0, ruido_amp=0.006)
        c.bola((x, y, 1.45 + r * 0.55), (r * 0.5, r * 0.5, r * 0.25), gas, 0.0)
    for k in range(4):
        a = k * 1.4
        pts = [(math.cos(a) * 0.1 + 0.05 * q * math.sin(k + q), 0.5, 0.6 + math.sin(a) * 0.1 + 0.12 * q) for q in range(4)]
        c.malla(sc.tubo(f'grieta {k}', pts, 0.012, coll, segmentos=4, muestras=1), gas)
    # La cruz de aviso, rayada con cal
    cal = P_('#E8E0C8', 'cera', semilla=60)
    c.trazo([(-0.12, 0.5, 1.2), (0.12, 0.5, 1.0)], 0.015, cal, 0.0)
    c.trazo([(0.12, 0.5, 1.2), (-0.12, 0.5, 1.0)], 0.015, cal, 0.0)
    F.marca('luz', (0, 0.6, 0.6))
    return F


@cosa('columna_hueso')
def columna_hueso(coll):
    """Columna de hueso de las catacumbas: calaveras apiladas y fémures amarrados que sostienen el techo. Si se rompe,
    se viene todo abajo."""
    F = nueva('columna_hueso', voxel=0.012)
    c = F.pieza('cuerpo', (0, 0, 0), tris=4200)
    piedra_b = piedra(70, '#5A5244', 0.2)
    # (basa y capitel cuadrados de piedra; el fuste, un cilindro recto)
    c.caja((0, 0, 0.09), (0.44, 0.44, 0.09), 0.025, piedra_b, 0.0)
    c.caja((0, 0, 0.21), (0.38, 0.38, 0.04), 0.015, piedra_b, 0.0)
    c.caja((0, 0, 1.66), (0.38, 0.38, 0.04), 0.015, piedra_b, 0.0)
    c.caja((0, 0, 1.78), (0.46, 0.46, 0.08), 0.025, piedra_b, 0.0)
    c.sdf(sdf.capped_cylinder((0, 0, 0.2), (0, 0, 1.68), 0.29) if hasattr(sdf, 'capped_cylinder') else sdf.round_box((0, 0, 0.94), (0.27, 0.27, 0.74), 0.06),
          (-0.36, -0.36, 0.15), (0.36, 0.36, 1.72), P_('#3A332A', 'piedra', semilla=71, musgo=0.1))
    # Anillos de calaveras alrededor del fuste
    n_anillo = 7
    for fila, z in enumerate((0.38, 0.72, 1.06, 1.4)):
        for k in range(n_anillo):
            a = 2 * math.pi * k / n_anillo + fila * 0.45
            u = np.array([math.cos(a), math.sin(a), 0.0])
            p = u * 0.31 + np.array([0, 0, z])
            c.bola(p, (0.1, 0.1, 0.11), hueso_pt(fila * 10 + k), 0.0, ruido_amp=0.004)
            for s in (-1, 1):
                o = p + u * 0.085 + np.cross([0, 0, 1], u) * 0.04 * s + np.array([0, 0, 0.015])
                c.bola(o, (0.026, 0.026, 0.03), P_('#16120E', 'liso'), 0.0)
            c.bola(p + u * 0.09 - np.array([0, 0, 0.05]), (0.022, 0.015, 0.02), P_('#16120E', 'liso'), 0.0)
        # Fémures cruzados entre fila y fila
        if fila < 3:
            for k in range(n_anillo):
                a = 2 * math.pi * (k + 0.5) / n_anillo + fila * 0.45
                u = np.array([math.cos(a), math.sin(a), 0.0])
                w = np.cross([0, 0, 1], u)
                b = u * 0.33 + np.array([0, 0, z + 0.17])
                sf.hueso_largo(c, b - w * 0.09 - np.array([0, 0, 0.08]), b + w * 0.09 + np.array([0, 0, 0.08]), 0.018, hueso_pt(40 + k))
    # Grietas que avisan que no aguanta mucho
    for k in range(3):
        a = k * 2.1
        pts = [(math.cos(a) * 0.43, math.sin(a) * 0.43, 1.66 + 0.04 * q) for q in range(3)]
        c.malla(sc.tubo(f'grieta {k}', [(p[0] + 0.03 * q, p[1], p[2]) for q, p in enumerate(pts)], 0.01, coll, segmentos=4, muestras=1), P_('#0A0806', 'liso'))
    F.marca('luz', (0, 0, 1.0))
    return F


@cosa('pinchos_placa')
def pinchos_placa(coll):
    """Trampa de pinchos del castillo: la reja del piso (1 × 1 m) con sus agujeros y los bordes de hierro."""
    F = nueva('pinchos_placa', voxel=0.006)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1200)
    mt = hierro(80, '#3A3A40')
    c.caja((0, 0, 0.015), (0.46, 0.46, 0.015), 0.006, mt, 0.0)
    for k in range(4):
        x = -0.36 + 0.24 * k
        for q in range(4):
            y = -0.36 + 0.24 * q
            c.bola((x, y, 0.032), (0.035, 0.035, 0.006), P_('#0A0808', 'liso'), 0.0)
    for s in (-1, 1):
        c.caja((s * 0.47, 0, 0.02), (0.02, 0.48, 0.022), 0.005, hierro(81, '#5A4A3A'), 0.0)
        c.caja((0, s * 0.47, 0.02), (0.48, 0.02, 0.022), 0.005, hierro(81, '#5A4A3A'), 0.0)
    # Manchas de sangre vieja
    for k in range(3):
        c.bola((0.2 * math.cos(k * 2), 0.2 * math.sin(k * 2), 0.03), (0.08, 0.06, 0.004), P_('#4A0E10', 'liso'), 0.0)
    return F


@cosa('pinchos_puas')
def pinchos_puas(coll):
    """Las púas de la trampa (suben por los agujeros de la reja)."""
    F = nueva('pinchos_puas', voxel=0.006)
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    for k in range(4):
        x = -0.36 + 0.24 * k
        for q in range(4):
            y = -0.36 + 0.24 * q
            c.malla(sc.punta(f'pua {k} {q}', (x, y, -0.05), (x, y, 0.42), 0.032, coll, seg=4, medio=0.5), hierro(82 + k, '#7A7A84'))
    return F


# ------------------------------------------------------------------------------------------------- Sangre y Ceniza 2
# Los objetivos nuevos (Exorcismo, Cosecha de sangre, La Cría, La Procesión) y los secundarios (mercurio, campanitas).
# Lo que mira a la cámara va hacia -Y.

def _velas(c, coll, pts, z0=0.0, sem=0):
    """Velas derretidas con su llama (en los puntos (x, y) a la altura z0)."""
    for k, (x, y) in enumerate(pts):
        hgt = 0.1 + 0.05 * ((k + sem) % 3)
        c.cono((x, y, z0), (x, y, z0 + hgt), 0.032, 0.027, P_('#D8CCAA', 'cera', semilla=k + sem), 0.0)
        c.trazo([(x + 0.022, y, z0 + hgt), (x + 0.032, y - 0.01, z0 + 0.03)], [0.01, 0.014], P_('#D8CCAA', 'cera', semilla=k + sem + 5), 0.008)
        c.malla(sc.punta(f'llama {sem} {k}', (x, y, z0 + hgt + 0.005), (x, y, z0 + hgt + 0.075), 0.017, coll, seg=5), brillo('ambar', '#FFAA33'))


def _calaverita(c, coll, p, r, mira, sem, pt=None):
    """Calavera chiquita en el piso, mirando hacia `mira` (en el plano)."""
    p = np.asarray(p, float)
    m = _unit(np.array([mira[0], mira[1], 0.0]))
    lat = np.cross([0, 0, 1], m)
    c.bola(p, (r, r, r * 0.92), pt or hueso_pt(sem), 0.0, ruido_amp=0.003)
    c.bola(p + m * r * 0.5 - np.array([0, 0, r * 0.55]), (r * 0.6, r * 0.5, r * 0.35), pt or hueso_pt(sem + 1), 0.0)
    for s in (-1, 1):
        c.malla(sc.bolita(f'cuenca {sem} {s}', p + m * r * 0.82 + lat * s * r * 0.38 + np.array([0, 0, r * 0.05]), r * 0.26, coll, n=1, sub=1), P_('#100C0A', 'liso'))


def _perfil_campana(esc):
    return [(r * esc, z * esc) for r, z in ((1.05, 0.0), (1.08, 0.06), (0.98, 0.18), (0.82, 0.45), (0.74, 0.8), (0.72, 1.15), (0.66, 1.4), (0.45, 1.58), (0.0, 1.62))]


def _radio_en(perfil, z):
    """Radio de un perfil de torno (r, z) a la altura z (interpolado)."""
    for (r0, z0), (r1, z1) in zip(perfil, perfil[1:]):
        if z0 <= z <= z1 and z1 > z0:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return perfil[-1][0]


@cosa('campana_exorcismo')
def campana_exorcismo(coll):
    """Campana embrujada (Exorcismo): una campana de iglesia verdosa colgada de un yugo de madera vieja, envuelta en
    cadenas, con trapos negros y la cara del espanto que vive adentro asomada en el bronce (las grietas brillan
    violeta). Abajo, el círculo de sal con velas y calaveras que dejaron los que intentaron antes."""
    F = nueva('campana_exorcismo', voxel=0.013)
    F.alcance_ao = 0.5
    c = F.pieza('cuerpo', (0, 0, 0), tris=7500)
    md = madera(90, '#4A3424')
    mdx = madera(91, '#4A3424', eje='x')
    # Bases de piedra, postes, travesaño y tornapuntas
    for s in (-1, 1):
        c.sdf(sc.sdf_ruido(sdf.round_box((s * 0.74, 0, 0.11), (0.18, 0.2, 0.11), 0.03), 0.01, 10, 92 + s), (s * 0.74 - 0.25, -0.27, -0.02), (s * 0.74 + 0.25, 0.27, 0.27),
              piedra(92 + s, '#5A5650', 0.6))
        c.caja((s * 0.74, 0, 1.08), (0.075, 0.085, 0.92), 0.015, md, 0.0)
        c.trazo([(s * 0.74, 0, 1.45), (s * 0.42, 0, 1.96)], 0.04, md, 0.0)
        for z in (0.5, 1.3, 1.85):
            c.malla(sc.bolita(f'clavo {s} {z}', (s * 0.74, -0.09, z), 0.016, coll, n=1), hierro(93))
    c.caja((0, 0, 2.03), (0.95, 0.11, 0.08), 0.015, mdx, 0.0)
    c.caja((0, 0, 2.13), (0.98, 0.13, 0.025), 0.01, madera(94, '#3A281A', eje='x'), 0.0)
    # El yugo y la campana
    c.caja((0, 0, 1.9), (0.18, 0.09, 0.07), 0.02, madera(95, '#3A281A', eje='x'), 0.0)
    for s in (-1, 1):
        c.caja((s * 0.14, 0, 1.97), (0.025, 0.1, 0.06), 0.008, hierro(96), 0.0)
    esc, z0 = 0.44, 1.1
    perfil = _perfil_campana(esc)
    bronce = P_('#5E6E52', 'oro', semilla=97, mat='base')
    c.malla(sc.torno('campana', perfil, coll, segmentos=26, centro=(0, 0, z0)), bronce)
    c.malla(sc.torno('dentro campana', [(0.0, 0.62), (0.27, 0.56), (0.3, 0.4), (0.33, 0.2), (0.4, 0.08), (0.44, 0.015)], coll, segmentos=26,
                     centro=(0, 0, z0)), P_('#1A1420', 'liso'))
    verdin = P_('#7FA88A', 'cera', semilla=98)
    for z, extra in ((0.05, 0.02), (0.53, 0.015)):
        r = _radio_en(perfil, z) + extra
        sf.cuerda_anillo(c, f'moldura {z}', [(math.cos(a) * r, math.sin(a) * r, z0 + z) for a in np.linspace(0, 2 * math.pi, 28, endpoint=False)], 0.016,
                         verdin, coll)
    # La cara del espanto en el frente: ojos y boca que brillan violeta (exagerados, de susto)
    vio = brillo('violeta', '#C46BFF')
    for s in (-1, 1):
        a = -math.pi / 2 + s * 0.32
        z = 0.42
        r = _radio_en(perfil, z)
        p = np.array([math.cos(a) * r, math.sin(a) * r, z0 + z])
        c.bola(p, (0.06, 0.03, 0.075 + 0.015 * s), vio, 0.0)
        c.bola(p + np.array([0, -0.02, 0.005]), (0.022, 0.012, 0.022), P_('#1A0A24', 'liso'), 0.0)
        # cejas de bronce caídas (cara de lamento)
        c.trazo([p + np.array([-s * 0.06, -0.01, 0.06]), p + np.array([s * 0.07, -0.01, 0.1])], 0.014, verdin, 0.0)
    r = _radio_en(perfil, 0.22)
    boca = np.array([0, -r, z0 + 0.22])
    c.bola(boca, (0.07, 0.03, 0.09), vio, 0.0)
    c.bola(boca + np.array([0, -0.018, -0.01]), (0.045, 0.012, 0.06), P_('#1A0A24', 'liso'), 0.0)
    # Grietas violeta por el bronce
    for k in range(5):
        a = 0.6 + k * 1.15
        pts = []
        for q in range(5):
            z = 0.58 - q * 0.12
            aa = a + 0.08 * ((q % 2) * 2 - 1)
            rr = _radio_en(perfil, z) + 0.004
            pts.append((math.cos(aa) * rr, math.sin(aa) * rr, z0 + z))
        c.malla(sc.tubo(f'grieta {k}', pts, 0.009, coll, segmentos=4, muestras=1), vio)
    # Badajo que asoma por debajo
    c.trazo([(0, 0, z0 + 0.6), (0, 0, z0 - 0.08)], 0.025, hierro(99), 0.0)
    c.bola((0, 0, z0 - 0.13), 0.065, hierro(100), 0.0)
    # Cadenas que la envuelven (en espiral) y el candado
    pts = [(math.cos(t) * (_radio_en(perfil, 0.12 + t * 0.045) + 0.03), math.sin(t) * (_radio_en(perfil, 0.12 + t * 0.045) + 0.03), z0 + 0.12 + t * 0.045)
           for t in np.linspace(0.3, 9.5, 46)]
    _eslabones(c, 'cadena espiral', pts, 0.008, coll, hierro(101, '#3A3A40'), largo=0.06)
    cand = np.array([0.16, -_radio_en(perfil, 0.33) - 0.06, z0 + 0.3])
    c.caja(cand, (0.04, 0.02, 0.045), 0.01, hierro(102, '#5A4A3A'), 0.0)
    sf.cuerda_anillo(c, 'arco candado', [cand + np.array([math.cos(a) * 0.028, 0, 0.045 + math.sin(a) * 0.035]) for a in np.linspace(0, math.pi, 8)], 0.007,
                     hierro(103), coll)
    # Trapos negros que cuelgan del travesaño, rasgados
    for k, x in enumerate((-0.55, -0.32, 0.36, 0.6)):
        b = np.array([x, -0.12, 1.98])
        e = b + np.array([0.04 * (k % 2), -0.02, -0.55 - 0.15 * (k % 2)])
        c.malla(sf.pluma(f'trapo {k}', b, e, 0.1, coll, normal=(0, -1, 0), grosor=0.006, dientes=4), P_('#1C1618', 'tela', semilla=104 + k))
    # Ectoplasma que gotea del borde y el charco del piso
    for k in range(6):
        a = k * 1.05 + 0.3
        rr = perfil[1][0] - 0.01
        p = np.array([math.cos(a) * rr, math.sin(a) * rr, z0 + 0.01])
        c.trazo([p, p + np.array([0, 0, -0.07 - 0.05 * (k % 3)])], [0.02, 0.008], P_('#B07AE0', 'vidrio', mat='espectro'), 0.0)
    c.sdf(sc.sdf_ruido(sdf.ellipsoid((0, 0, 0.0), (0.5, 0.42, 0.025)), 0.02, 6, 105), (-0.6, -0.55, -0.03), (0.6, 0.55, 0.05),
          P_('#B07AE0', 'vidrio', mat='espectro'))
    # El círculo de sal (con cortes: ya se rompió) y lo que dejaron los de antes
    sal = P_('#E8E2D2', 'cera', semilla=106)
    for k in range(4):
        a0 = k * math.pi / 2 + 0.25
        pts = [(math.cos(a) * 1.0, math.sin(a) * 0.95, 0.012) for a in np.linspace(a0, a0 + 1.2, 9)]
        c.malla(sc.tubo(f'sal {k}', pts, 0.016, coll, segmentos=4, muestras=1), sal)
    _velas(c, coll, [(-0.95, -0.35), (-0.55, -0.82), (0.6, -0.8), (0.98, -0.25), (-0.85, 0.5)], 0.0, sem=107)
    _calaverita(c, coll, (0.32, -0.78, 0.07), 0.075, (-0.2, -1), 110)
    _calaverita(c, coll, (-0.98, 0.05, 0.065), 0.065, (0.3, -1), 112)
    c.trazo([(0.45, -0.95, 0.02), (0.75, -0.72, 0.02)], 0.012, P_('#2A1E14', 'cuero', semilla=114), 0.0)   # el rosario tirado
    for k in range(7):
        c.malla(sc.bolita(f'cuenta {k}', (0.45 + 0.05 * k, -0.95 + 0.038 * k, 0.03), 0.014, coll, n=1), P_('#3A2A1E', 'madera', semilla=115))
    F.marca('luz', (0, -0.2, z0 + 0.4))
    return F


@cosa('caliz_sangre')
def caliz_sangre(coll):
    """El Cáliz de Sangre (Cosecha): un cáliz dorado enorme sobre un pedestal de piedra con runas, lleno de sangre que
    burbujea y se derrama por el borde. Ahí se llevan los cristales."""
    F = nueva('caliz_sangre', voxel=0.012)
    F.alcance_ao = 0.5
    c = F.pieza('cuerpo', (0, 0, 0), tris=7000)
    base = sf.union(sdf.round_box((0, 0, 0.08), (0.62, 0.62, 0.08), 0.03), sdf.round_box((0, 0, 0.33), (0.42, 0.42, 0.18), 0.03),
                    sdf.round_box((0, 0, 0.54), (0.52, 0.52, 0.04), 0.02))
    c.sdf(sc.sdf_ruido(base, 0.008, 9, 120), (-0.7, -0.7, -0.02), (0.7, 0.7, 0.6), piedra(120, '#4E4844', 0.35))
    # Runas rojas en las cuatro caras del pedestal
    rojo = brillo('rojo', '#FF2A1A')
    for cara in range(4):
        a = cara * math.pi / 2
        u = np.array([math.cos(a), math.sin(a), 0.0])
        w = np.cross([0, 0, 1], u)
        p = u * 0.425 + np.array([0, 0, 0.33])
        c.trazo([p + w * -0.08 + np.array([0, 0, 0.1]), p + np.array([0, 0, -0.1]), p + w * 0.08 + np.array([0, 0, 0.1])], 0.013, rojo, 0.0)
        c.trazo([p + w * -0.05 + np.array([0, 0, 0.0]), p + w * 0.05], 0.011, rojo, 0.0)
        # (sangre que chorrea por la cara)
        q = u * 0.43 + w * 0.2 + np.array([0, 0, 0.5])
        c.trazo([q, q + np.array([0, 0, -0.14 - 0.03 * cara])], [0.022, 0.01], P_('#5A0A0A', 'sangre', mat='sangre'), 0.0)
    # El cáliz
    dorado = P_('#C09040', 'oro', semilla=121, mat='base')
    dorado2 = P_('#A07830', 'oro', semilla=122, mat='base')
    z0 = 0.58
    perfil = [(0.0, 0.0), (0.3, 0.0), (0.31, 0.03), (0.26, 0.07), (0.12, 0.13), (0.065, 0.24), (0.06, 0.34), (0.09, 0.38), (0.11, 0.42), (0.09, 0.46),
              (0.065, 0.5), (0.08, 0.58), (0.18, 0.64), (0.29, 0.74), (0.36, 0.86), (0.385, 0.93), (0.36, 0.935), (0.34, 0.9), (0.0, 0.86)]
    c.malla(sc.torno('caliz', perfil, coll, segmentos=30, centro=(0, 0, z0)), dorado)
    c.bola((0, 0, z0 + 0.895), (0.345, 0.345, 0.02), P_('#6A0A0E', 'sangre', mat='sangre'), 0.0)
    sf.cuerda_anillo(c, 'moldura copa', [(math.cos(a) * 0.335, math.sin(a) * 0.335, z0 + 0.82) for a in np.linspace(0, 2 * math.pi, 30, endpoint=False)], 0.016,
                     dorado2, coll)
    sf.cuerda_anillo(c, 'moldura pie', [(math.cos(a) * 0.27, math.sin(a) * 0.27, z0 + 0.06) for a in np.linspace(0, 2 * math.pi, 26, endpoint=False)], 0.015,
                     dorado2, coll)
    # Piedras rojas engastadas en la copa y en el nudo
    for k in range(8):
        a = 2 * math.pi * k / 8 + 0.2
        p = np.array([math.cos(a) * 0.305, math.sin(a) * 0.305, z0 + 0.74])
        c.bola(p, (0.045, 0.045, 0.045), dorado2, 0.0)
        c.malla(sc.bolita(f'gema {k}', p + _unit(np.array([math.cos(a), math.sin(a), 0.3])) * 0.03, 0.032, coll, n=2), rojo if k % 2 == 0 else P_('#8A0E14', 'vidrio', mat='espectro'))
    for k in range(6):
        a = 2 * math.pi * k / 6
        c.malla(sc.bolita(f'gema nudo {k}', (math.cos(a) * 0.11, math.sin(a) * 0.11, z0 + 0.42), 0.022, coll, n=1, sub=1), rojo)
    # Sangre que se derrama por el borde y burbujas
    for k in range(7):
        a = 0.4 + k * 0.9
        p = np.array([math.cos(a) * 0.39, math.sin(a) * 0.39, z0 + 0.92])
        largo = 0.08 + 0.07 * (k % 3)
        c.trazo([p, p + np.array([math.cos(a) * 0.02, math.sin(a) * 0.02, -0.05]), p + np.array([math.cos(a) * 0.01, math.sin(a) * 0.01, -0.05 - largo])],
                [0.022, 0.018, 0.01], P_('#6A0A0E', 'sangre', mat='sangre'), 0.0)
    for k in range(5):
        a = k * 1.3
        c.malla(sc.bolita(f'burbuja {k}', (math.cos(a) * 0.15 * (k % 3) / 2, math.sin(a) * 0.15 * (k % 3) / 2, z0 + 0.92), 0.02 + 0.008 * (k % 2), coll, n=1,
                          sub=1), rojo)
    # Velas en las esquinas del pedestal
    _velas(c, coll, [(-0.44, -0.44), (0.44, -0.44), (0.44, 0.44), (-0.44, 0.44)], 0.58, sem=124)
    F.marca('luz', (0, 0, z0 + 1.0))
    return F


@cosa('cristal_sangre')
def cristal_sangre(coll):
    """Cristal de sangre (Cosecha): un racimo de cristales rojos que laten, pegado a un pedazo de roca negra. Al tocarlo,
    sale flotando detrás de quien lo tomó."""
    F = nueva('cristal_sangre', voxel=0.007)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1800)
    c.sdf(sc.sdf_ruido(sdf.ellipsoid((0, 0, 0.06), (0.17, 0.14, 0.085)), 0.012, 14, 130), (-0.23, -0.2, -0.03), (0.23, 0.2, 0.17), piedra(130, '#2E2826', 0.0))
    rojo = brillo('rojo', '#FF2A1A')
    vidrio = P_('#8A0E14', 'vidrio', mat='espectro')
    for k, (d, h, r) in enumerate((((0, 0, 1), 0.55, 0.085), ((0.55, 0.15, 1), 0.34, 0.06), ((-0.5, 0.1, 1), 0.38, 0.062), ((0.1, -0.55, 1), 0.3, 0.052),
                                   ((-0.2, 0.55, 1), 0.26, 0.046), ((0.6, -0.45, 0.8), 0.2, 0.04), ((-0.55, -0.4, 0.9), 0.22, 0.04))):
        d = _unit(d)
        b = np.array([0, 0, 0.1]) + np.array([d[0], d[1], 0]) * 0.06
        c.malla(sc.punta(f'cristal {k}', b - d * r * 0.4, b + d * h, r, coll, seg=6, medio=0.8), rojo if k % 2 == 0 else vidrio)
    # Venas rojas en la roca
    for k in range(5):
        a = k * 1.25
        c.trazo([(math.cos(a) * 0.12, math.sin(a) * 0.1, 0.1), (math.cos(a + 0.4) * 0.17, math.sin(a + 0.4) * 0.14, 0.03)], 0.01, rojo, 0.0)
    F.marca('luz', (0, 0, 0.3))
    return F


@cosa('huevo_gargola')
def huevo_gargola(coll):
    """Huevo de gárgola (La Cría): un huevo de piedra con escamas, cuernitos y una grieta que brilla, por donde la cría
    ya está mirando con sus dos ojitos."""
    F = nueva('huevo_gargola', voxel=0.007)
    c = F.pieza('cuerpo', (0, 0, 0), tris=2400)
    centro = (0, 0, 0.27)
    f = sdf.ellipsoid(centro, (0.2, 0.2, 0.27))
    c.sdf(sc.sdf_ruido(f, 0.007, 12, 140), (-0.26, -0.26, -0.02), (0.26, 0.26, 0.58), piedra(140, '#7A7A84', 0.3))
    escama = piedra(141, '#64646E', 0.15)
    for fila, dz in enumerate((0.75, 0.35, -0.05, -0.45)):
        for k in range(9):
            a = 2 * math.pi * k / 9 + fila * 0.35
            if fila in (1, 2) and abs(((a + math.pi / 2 + math.pi) % (2 * math.pi)) - math.pi) < 0.6:
                continue   # (el frente queda libre para la grieta)
            p, n = sf.hacia(f, centro, (math.cos(a), math.sin(a), dz))
            if p is not None:
                c.malla(sc.punta(f'escama {fila} {k}', p - n * 0.012, p + n * 0.022 + np.array([0, 0, -0.04]), 0.045, coll, seg=4), escama)
    # Cuernitos arriba
    for s in (-1, 1):
        p, n = sf.hacia(f, centro, (s * 0.35, 0.1, 1))
        if p is not None:
            sf.cuerno(c, f'cuernito {s}', [p - n * 0.01, p + n * 0.05 + np.array([s * 0.02, 0, 0.02]), p + n * 0.08 + np.array([s * 0.05, 0.02, 0.0])], 0.022,
                      escama, coll)
    # La grieta del frente (zigzag) con la luz de adentro y los ojitos de la cría
    ambar = brillo('fuego', '#FF8A2A')
    pts = []
    for q, (ax, dz) in enumerate(((-0.55, 0.55), (-0.25, 0.4), (-0.42, 0.2), (-0.1, 0.05), (-0.3, -0.12), (0.0, -0.25))):
        p, n = sf.hacia(f, centro, (ax * 0.5 + 0.05 * q, -1, dz))
        if p is not None:
            pts.append(p + n * 0.003)
    if len(pts) > 2:
        c.malla(sc.tubo('grieta', pts, 0.011, coll, segmentos=4, muestras=1), ambar)
    ramal = []
    for ax, dz in ((0.35, 0.15), (0.5, -0.05), (0.32, -0.2)):
        p, n = sf.hacia(f, centro, (ax, -1, dz))
        if p is not None:
            ramal.append(p + n * 0.003)
    if len(ramal) > 1 and len(pts) > 2:
        c.malla(sc.tubo('grieta ramal', [pts[2]] + ramal, 0.008, coll, segmentos=4, muestras=1), ambar)
    hueco_c, hueco_n = sf.hacia(f, centro, (0.12, -1, 0.28))
    if hueco_c is not None:
        c.bola(hueco_c - hueco_n * 0.005, (0.085, 0.03, 0.05), P_('#1A0C06', 'liso'), 0.0)
        for s in (-1, 1):
            o = hueco_c + np.array([s * 0.032, -0.012, 0.005])
            c.malla(sc.bolita(f'ojito {s}', o, 0.02, coll, n=2), brillo('oro', '#FFD36B'))
            c.malla(sc.bolita(f'pupila {s}', o + np.array([0, -0.016, 0.0]), (0.006, 0.004, 0.012), coll, n=1), P_('#1A0C06', 'liso'))
    # Musgo y polvo de piedra a los pies
    for k in range(5):
        a = k * 1.3
        c.bola((math.cos(a) * 0.17, math.sin(a) * 0.17, 0.015), (0.05, 0.04, 0.02), piedra(150 + k, '#5A5A60', 0.8), 0.0)
    F.marca('luz', (0, -0.15, 0.3))
    return F


@cosa('osario')
def osario(coll):
    """El nido de la Madre de Piedra (La Cría): un anillo de piedras de catedral, calaveras y fémures, con paja y
    cáscaras rotas adentro; el fondo brilla donde se dejan los huevos. Atrás, una gárgola de piedra vigila con las alas
    abiertas y los ojos encendidos."""
    F = nueva('osario', voxel=0.015)
    F.alcance_ao = 0.5
    c = F.pieza('cuerpo', (0, 0, 0), tris=9000)
    rng = np.random.default_rng(160)
    # El anillo de piedras (dos hileras)
    for fila, (R, z, n, tam) in enumerate(((1.05, 0.12, 15, 0.2), (1.0, 0.33, 12, 0.15))):
        for k in range(n):
            a = 2 * math.pi * k / n + fila * 0.2
            p = np.array([math.cos(a) * R, math.sin(a) * R * 0.95, z])
            t = tam * rng.uniform(0.85, 1.2)
            c.bola(p, (t * 1.2, t, t * 0.85), piedra(161 + k + fila * 20, '#6A665E', 0.45), 0.0, ruido_amp=0.02)
    # Calaveras metidas entre las piedras y fémures cruzados
    for k in range(9):
        a = 2 * math.pi * k / 9 + 0.17
        p = np.array([math.cos(a) * 0.98, math.sin(a) * 0.93, 0.47])
        _calaverita(c, coll, p, 0.075, (math.cos(a), math.sin(a)), 180 + k)
    for k in range(7):
        a = 2 * math.pi * k / 7 + 0.5
        u = np.array([math.cos(a), math.sin(a), 0.0])
        w = np.cross([0, 0, 1], u)
        b = u * 1.12 + np.array([0, 0, 0.3])
        sf.hueso_largo(c, b - w * 0.16 - np.array([0, 0, 0.1]), b + w * 0.16 + np.array([0, 0, 0.1]), 0.02, hueso_pt(200 + k))
    # La paja del nido y el fondo que brilla
    c.sdf(sc.sdf_ruido(sf.restar(sdf.ellipsoid((0, 0, 0.08), (0.95, 0.9, 0.2)), sdf.ellipsoid((0, 0, 0.26), (0.7, 0.65, 0.2)), 0.05), 0.02, 14, 210),
          (-1.0, -1.0, -0.05), (1.0, 1.0, 0.3), P_('#8A6A3A', 'tela', semilla=211))
    for k in range(40):
        a = rng.uniform(0, 2 * math.pi)
        r = rng.uniform(0.35, 0.9)
        b = np.array([math.cos(a) * r, math.sin(a) * r * 0.95, 0.12 + 0.08 * (r > 0.6)])
        d = _unit(np.array([rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(0.0, 0.5)]))
        c.trazo([b, b + d * rng.uniform(0.1, 0.2)], 0.007, P_('#B8904A' if k % 3 else '#6A4A2A', 'tela', semilla=212 + k % 5), 0.0)
    c.sdf(sdf.ellipsoid((0, 0, 0.1), (0.45, 0.42, 0.04)), (-0.5, -0.5, 0.0), (0.5, 0.5, 0.16), brillo('fuego', '#FF8A2A'), 0.0)
    # Cáscaras de huevos ya nacidos
    for k, (x, y, rot) in enumerate(((-0.42, -0.25, 0.4), (0.35, 0.3, 2.0), (0.5, -0.38, 4.0), (-0.3, 0.45, 5.2))):
        p = np.array([x, y, 0.2])
        cas = sf.restar(sdf.ellipsoid(p, (0.1, 0.1, 0.13)), sdf.ellipsoid(p, (0.085, 0.085, 0.115)), 0.0)
        cas = sf.restar(cas, sdf.plane(p + np.array([0, 0, 0.01 * (k % 2)]), (math.cos(rot) * 0.4, math.sin(rot) * 0.4, 1)), 0.0)
        c.sdf(cas, p - 0.16, p + 0.16, piedra(220 + k, '#7A7A84', 0.0))
    # La gárgola vigía (atrás, en +Y), sin cabeza, con las alas abiertas sobre un pilar
    g = np.array([0.0, 1.1, 0.0])
    c.sdf(sc.sdf_ruido(sdf.round_box(g + np.array([0, 0, 0.35]), (0.26, 0.22, 0.35), 0.03), 0.01, 10, 230), g - np.array([0.35, 0.3, 0.02]),
          g + np.array([0.35, 0.3, 0.75]), piedra(230, '#5A5650', 0.6))
    cuerpo_g = sf.union(sdf.ellipsoid(g + np.array([0, -0.02, 0.98]), (0.24, 0.2, 0.26)), sdf.round_cone(g + np.array([0, 0, 0.72]), g + np.array([0, -0.02, 0.9]),
                                                                                                       0.18, 0.2), k=0.06)
    c.sdf(sc.sdf_ruido(cuerpo_g, 0.01, 12, 231), g - np.array([0.4, 0.35, -0.6]), g + np.array([0.4, 0.35, 1.3]), piedra(231, '#6E6C66', 0.5))
    # La cabeza: hocico, cuernos hacia atrás, colmillos y los ojos que brillan como el fondo del nido
    hc = g + np.array([0, -0.12, 1.36])
    cab = sf.union(sdf.ellipsoid(hc, (0.15, 0.14, 0.13)), sdf.round_cone(hc + np.array([0, -0.06, -0.03]), hc + np.array([0, -0.2, -0.07]), 0.1, 0.065),
                   sdf.ellipsoid(hc + np.array([0, -0.09, 0.06]), (0.15, 0.06, 0.035)), k=0.04)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.065, -0.13, 0.03]), (0.035, 0.03, 0.025)), 0.01)
    c.sdf(sc.sdf_ruido(cab, 0.006, 20, 232), hc - 0.35, hc + 0.35, piedra(232, '#6E6C66', 0.5))
    for s in (-1, 1):
        c.malla(sc.bolita(f'ojo vigia {s}', hc + np.array([s * 0.065, -0.125, 0.03]), 0.024, coll, n=2), brillo('fuego', '#FF8A2A'))
        sf.cuerno(c, f'cuerno vigia {s}', [hc + np.array([s * 0.08, 0.0, 0.09]), hc + np.array([s * 0.16, 0.08, 0.2]), hc + np.array([s * 0.17, 0.22, 0.18]),
                                          hc + np.array([s * 0.13, 0.3, 0.08])], 0.04, piedra(240, '#5A5852', 0.2), coll)
        c.sdf(sdf.round_cone(hc + np.array([s * 0.13, 0.0, 0.03]), hc + np.array([s * 0.25, 0.04, 0.08]), 0.035, 0.006), hc - 0.4, hc + 0.4,
              piedra(232, '#6E6C66', 0.5), 0.01)
        sf.diente(c, f'colmillo vigia {s}', hc + np.array([s * 0.04, -0.24, -0.1]), hc + np.array([s * 0.04, -0.245, -0.16]), 0.014, piedra(241, '#9A968C', 0.0),
                  coll)
    for s in (-1, 1):
        piv = g + np.array([s * 0.14, 0.05, 1.08])
        cod = piv + np.array([s * 0.35, 0.05, 0.3])
        c.trazo([piv, cod], [0.05, 0.035], piedra(233, '#6E6C66', 0.4), 0.0)
        puntas = [cod + np.array([s * 0.42, 0.0, 0.08]), cod + np.array([s * 0.45, 0.05, -0.25]), cod + np.array([s * 0.25, 0.05, -0.55])]
        for j, q in enumerate(puntas):
            c.trazo([cod, (cod + q) / 2 + np.array([0, 0, 0.03]), q], [0.03, 0.022, 0.01], piedra(234 + j, '#5A5852', 0.3), 0.0)
        borde = [piv + np.array([0, 0, -0.2]), puntas[2], puntas[1], puntas[0]]
        c.malla(sf.poligono(f'membrana {s}', borde + [cod], 0.014, coll), piedra(237, '#4E4C48', 0.2))
        mano = g + np.array([s * 0.2, -0.2, 0.75])
        c.trazo([g + np.array([s * 0.2, -0.05, 1.05]), mano], [0.06, 0.045], piedra(238, '#6E6C66', 0.4), 0.0)
        for q in range(3):
            b = mano + np.array([s * 0.02 * (q - 1), -0.03, 0])
            sf.diente(c, f'garra vigia {s} {q}', b, b + np.array([0.01 * (q - 1), -0.06, -0.06]), 0.016, piedra(239, '#5A5852', 0.0), coll)
    F.marca('luz', (0, 0, 0.4))
    return F


def _tejado(c, centro, largo, ancho, alto, pt, eje='x'):
    """Tejado a dos aguas (prisma): la cumbrera a lo largo de `eje`, alero en centro[2] y cumbrera a centro[2] + alto."""
    cx, cy, cz = centro
    f = sdf.plane((cx, cy, cz), (0, 0, -1))
    if eje == 'x':
        n = _unit(np.array([0.0, alto, ancho]))
        f = sf.intersect(f, sdf.plane((cx, cy + ancho, cz), tuple(n)))
        f = sf.intersect(f, sdf.plane((cx, cy - ancho, cz), (0.0, -n[1], n[2])))
        f = sf.intersect(f, sdf.plane((cx + largo, cy, cz), (1, 0, 0)))
        f = sf.intersect(f, sdf.plane((cx - largo, cy, cz), (-1, 0, 0)))
        lo, hi = (cx - largo - 0.05, cy - ancho - 0.05, cz - 0.05), (cx + largo + 0.05, cy + ancho + 0.05, cz + alto + 0.05)
    else:
        n = _unit(np.array([alto, 0.0, ancho]))
        f = sf.intersect(f, sdf.plane((cx + ancho, cy, cz), tuple(n)))
        f = sf.intersect(f, sdf.plane((cx - ancho, cy, cz), (-n[0], 0.0, n[2])))
        f = sf.intersect(f, sdf.plane((cx, cy + largo, cz), (0, 1, 0)))
        f = sf.intersect(f, sdf.plane((cx, cy - largo, cz), (0, -1, 0)))
        lo, hi = (cx - ancho - 0.05, cy - largo - 0.05, cz - 0.05), (cx + ancho + 0.05, cy + largo + 0.05, cz + alto + 0.05)
    c.sdf(f, lo, hi, pt)
    return f


def _relicario(F, coll, abierto):
    """El Relicario de la Procesión: una capilla de oro chiquita sobre andas (las varas para cargarla), con paneles de
    terciopelo morado y ventanitas góticas por donde se ve brillar lo que lleva adentro. Cerrado va sellado con cadenas
    y lacres; abierto, el tejado queda tirado al lado y la luz sale por arriba."""
    c = F.pieza('cuerpo', (0, 0, 0), tris=7000 if abierto else 8000)
    dorado = P_('#C09040', 'oro', semilla=240, mat='base')
    dorado2 = P_('#9A7230', 'oro', semilla=241, mat='base')
    terciopelo = P_('#4A1A5A', 'tela', semilla=242)
    vio = brillo('violeta', '#C46BFF')
    lx, ly, z0, z1 = 0.46, 0.3, 0.2, 0.68
    # Las andas: dos varas largas de madera con remates dorados
    for s in (-1, 1):
        c.trazo([(-0.95, s * (ly + 0.08), 0.3), (0.95, s * (ly + 0.08), 0.3)], 0.032, madera(243, '#5A3A22', eje='x'), 0.0)
        for e in (-1, 1):
            c.bola((e * 0.97, s * (ly + 0.08), 0.3), 0.045, dorado, 0.0)
            c.caja((e * (lx - 0.02), s * (ly + 0.04), 0.3), (0.03, 0.05, 0.03), 0.01, dorado2, 0.0)
    # Patas de garra doradas
    for x in (-1, 1):
        for y in (-1, 1):
            c.bola((x * (lx - 0.06), y * (ly - 0.05), 0.1), (0.06, 0.06, 0.1), dorado, 0.0)
            c.bola((x * (lx - 0.06), y * (ly - 0.05), 0.03), (0.075, 0.075, 0.035), dorado2, 0.0)
    # La caja: terciopelo con marco de oro
    caja = sdf.round_box((0, 0, (z0 + z1) / 2), (lx, ly, (z1 - z0) / 2), 0.015)
    if abierto:
        caja = sf.restar(caja, sdf.round_box((0, 0, z1), (lx - 0.05, ly - 0.05, (z1 - z0) / 2), 0.01), 0.0)
    c.sdf(caja, (-lx - 0.05, -ly - 0.05, z0 - 0.05), (lx + 0.05, ly + 0.05, z1 + 0.05), terciopelo)
    c.caja((0, 0, z0 + 0.02), (lx + 0.03, ly + 0.03, 0.03), 0.01, dorado, 0.0)
    c.caja((0, 0, z1 - 0.01), (lx + 0.025, ly + 0.025, 0.022), 0.008, dorado, 0.0)
    # Columnitas en las esquinas con pináculos
    for x in (-1, 1):
        for y in (-1, 1):
            p = np.array([x * lx, y * ly, 0.0])
            c.cono(p + np.array([0, 0, z0]), p + np.array([0, 0, z1 + 0.02]), 0.035, 0.03, dorado, 0.0)
            c.cono(p + np.array([0, 0, z1 + 0.02]), p + np.array([0, 0, z1 + 0.24]), 0.04, 0.0, dorado2, 0.0)
            c.malla(sc.bolita(f'perla {x} {y}', p + np.array([0, 0, z1 + 0.25]), 0.018, coll, n=1, sub=1), brillo('blanco', '#FFF4DA'))
    # Ventanitas góticas (tres por lado largo, una por lado corto) con la luz de adentro
    def ventana(p, normal, ancho, alto):
        p = np.asarray(p, float)
        normal = np.asarray(normal, float)
        lat = np.cross([0, 0, 1], normal)
        c.caja(p, np.abs(lat) * ancho + np.abs(normal) * 0.008 + np.array([0, 0, alto]), 0.004, vio, 0.0)
        c.bola(p + np.array([0, 0, alto]), np.abs(lat) * ancho + np.abs(normal) * 0.008 + np.array([0, 0, ancho * 1.3]), vio, 0.0)
        c.caja(p + normal * 0.006, np.abs(normal) * 0.01 + np.array([0, 0, alto + ancho]) + np.abs(lat) * 0.008, 0.003, dorado2, 0.0)
        for s in (-1, 1):
            c.trazo([p + lat * s * (ancho + 0.012) + normal * 0.008 - np.array([0, 0, alto]),
                     p + lat * s * (ancho + 0.012) + normal * 0.008 + np.array([0, 0, alto]),
                     p + normal * 0.008 + np.array([0, 0, alto + ancho * 1.6])], 0.008, dorado, 0.0)
    if True:
        zc = (z0 + z1) / 2 - 0.02
        for x in (-0.28, 0.0, 0.28):
            for s in (-1, 1):
                ventana((x, s * (ly + 0.002), zc), (0, s, 0), 0.055, 0.1)
        for s in (-1, 1):
            ventana((s * (lx + 0.002), 0, zc), (s, 0, 0), 0.06, 0.1)
    # El tejado
    teja = P_('#8A6A30', 'oro', semilla=244, mat='base')
    if not abierto:
        _tejado(c, (0, 0, z1 + 0.01), lx + 0.05, ly + 0.07, 0.3, teja, 'x')
        for k in range(7):
            x = -lx + 0.06 + k * (2 * lx - 0.12) / 6
            for s in (-1, 1):
                c.trazo([(x, s * (ly + 0.06), z1 + 0.02), (x, 0, z1 + 0.315)], 0.009, dorado2, 0.0)
        c.trazo([(-lx - 0.05, 0, z1 + 0.32), (lx + 0.05, 0, z1 + 0.32)], 0.02, dorado, 0.0)
        for k in range(5):
            x = -0.36 + k * 0.18
            c.malla(sc.punta(f'cresteria {k}', (x, 0, z1 + 0.32), (x, 0, z1 + 0.42 + 0.03 * (k % 2)), 0.025, coll, seg=4), dorado)
        # La estrella de las Santas en la punta del frente y del fondo
        for s in (-1, 1):
            p = np.array([s * (lx + 0.07), 0, z1 + 0.24])
            for k in range(6):
                a = 2 * math.pi * k / 6
                c.malla(sc.punta(f'estrella {s} {k}', p, p + np.array([0, math.cos(a) * 0.09, math.sin(a) * 0.09]), 0.022, coll, seg=4), dorado)
            c.malla(sc.bolita(f'estrella centro {s}', p, 0.03, coll, n=1, sub=1), vio)
        # Sellado: cadenas en cruz sobre el tejado, el candado y los lacres con cintas
        mt = hierro(245, '#3A3A40')
        for x in (-0.22, 0.22):
            _eslabones(c, f'cadena {x}', [(x, -ly - 0.04, z0 + 0.05), (x, -ly - 0.08, z1 + 0.02), (x, 0, z1 + 0.34), (x, ly + 0.08, z1 + 0.02),
                                          (x, ly + 0.04, z0 + 0.05)], 0.008, coll, mt, largo=0.055)
        cand = np.array([0.0, -ly - 0.05, z1 - 0.12])
        c.caja(cand, (0.05, 0.025, 0.055), 0.012, hierro(246, '#5A4A3A'), 0.0)
        sf.cuerda_anillo(c, 'arco candado', [cand + np.array([math.cos(a) * 0.035, 0, 0.055 + math.sin(a) * 0.045]) for a in np.linspace(0, math.pi, 8)], 0.008,
                         mt, coll)
        for k, x in enumerate((-0.36, 0.36)):
            p = np.array([x, -ly - 0.025, z1 - 0.1])
            c.bola(p, (0.045, 0.015, 0.045), P_('#8A1418', 'cera', semilla=247 + k), 0.0)
            c.malla(sc.bolita(f'sello {k}', p + np.array([0, -0.012, 0]), (0.022, 0.006, 0.022), coll, n=1), brillo('rojo', '#C0141A'))
            for q in (-1, 1):
                c.malla(sf.pluma(f'cinta {k} {q}', p + np.array([0, -0.01, -0.03]), p + np.array([q * 0.04, -0.02, -0.2]), 0.035, coll, normal=(0, -1, 0),
                                 grosor=0.004), P_('#8A1418', 'tela', semilla=249 + k))
    else:
        # El tejado tirado al lado (+X), sobre el piso
        _tejado(c, (lx + 0.62, -0.05, 0.0), ly + 0.07, lx + 0.05, 0.3, teja, 'y')
        c.trazo([(lx + 0.62, -0.05 - ly - 0.07, 0.31), (lx + 0.62, -0.05 + ly + 0.07, 0.31)], 0.02, dorado, 0.0)
        # Adentro: el cojín y la luz que sale
        c.bola((0, 0, z0 + 0.1), (lx - 0.07, ly - 0.07, 0.07), P_('#6A2A7A', 'tela', semilla=250), 0.0)
        c.bola((0, 0, z0 + 0.2), 0.07, vio, 0.0)
        for k in range(9):
            a = k * 2 * math.pi / 9
            b = np.array([math.cos(a) * 0.08, math.sin(a) * 0.06, z0 + 0.22])
            c.malla(sc.punta(f'rayo {k}', b, b + np.array([math.cos(a) * 0.15, math.sin(a) * 0.1, 0.45 + 0.15 * (k % 3)]), 0.03, coll, seg=4), vio)
        # Las cadenas rotas en el piso
        mt = hierro(245, '#3A3A40')
        for k, (x, y) in enumerate(((-0.5, -0.55), (0.1, -0.6), (-0.7, 0.45))):
            _eslabones(c, f'cadena rota {k}', [(x, y, 0.02), (x + 0.25, y + 0.08, 0.02), (x + 0.42, y - 0.06, 0.03)], 0.008, coll, mt, largo=0.055)
    F.marca('luz', (0, 0, z1 + 0.2))
    return F


@cosa('relicario')
def relicario(coll):
    return _relicario(nueva('relicario', voxel=0.009), coll, False)


@cosa('relicario_abierto')
def relicario_abierto(coll):
    return _relicario(nueva('relicario_abierto', voxel=0.009), coll, True)


@cosa('gota_mercurio')
def gota_mercurio(coll):
    """Gota de mercurio (secundario): un charquito de plata viva, redondo y con dos ojitos asustados, con gotitas que se
    le escapan. Se escurre cuando alguien se acerca."""
    F = nueva('gota_mercurio', voxel=0.004)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1100)
    plata = P_('#B4BECC', 'cera', semilla=260)
    f = sf.union(sdf.ellipsoid((0, 0, 0.045), (0.085, 0.075, 0.05)), sdf.ellipsoid((0.07, 0.05, 0.015), (0.03, 0.028, 0.02)),
                 sdf.ellipsoid((-0.075, 0.03, 0.012), (0.025, 0.022, 0.016)), k=0.03)
    c.sdf(f, (-0.13, -0.12, -0.01), (0.13, 0.12, 0.11), plata)
    for k, (x, y, r) in enumerate(((0.13, -0.04, 0.016), (-0.12, -0.06, 0.012), (0.02, 0.12, 0.014))):
        c.bola((x, y, r * 0.8), (r, r, r * 0.8), plata, 0.0)
    # Los brillos de la superficie (reflejos)
    for k, (x, y, z, r) in enumerate(((-0.025, -0.03, 0.088, 0.018), (0.03, -0.045, 0.075, 0.009), (0.075, 0.04, 0.03, 0.007))):
        c.malla(sc.bolita(f'reflejo {k}', (x, y, z), (r, r * 0.8, r * 0.4), coll, n=1, sub=1), brillo('blanco', '#FFF4DA'))
    # Ojitos asustados
    for s in (-1, 1):
        o = np.array([s * 0.025, -0.06, 0.06])
        c.malla(sc.bolita(f'ojo {s}', o, (0.012, 0.008, 0.016), coll, n=1, sub=1), P_('#14161C', 'liso'))
        c.malla(sc.bolita(f'brillo ojo {s}', o + np.array([s * 0.003, -0.007, 0.006]), 0.004, coll, n=1), brillo('blanco', '#FFF4DA'))
        c.trazo([o + np.array([-s * 0.012, -0.004, 0.022]), o + np.array([s * 0.008, -0.004, 0.03])], 0.003, P_('#14161C', 'liso'), 0.0)
    c.malla(sc.bolita('boca', (0.0, -0.067, 0.035), (0.01, 0.005, 0.008), coll, n=1), P_('#14161C', 'liso'))
    F.marca('luz', (0, 0, 0.06))
    return F


@cosa('campanita_plata')
def campanita_plata(coll):
    """Campanita de plata de las Santas (secundario): de mano, con mango de madera, lazo rojo y la estrellita grabada.
    Está tirada entre la maleza y suena cuando pasas cerca."""
    F = nueva('campanita_plata', voxel=0.004)
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    plata = P_('#C8CED8', 'cera', semilla=270)
    perfil = [(r * 0.075, z * 0.075) for r, z in ((1.05, 0.0), (1.08, 0.06), (0.98, 0.18), (0.82, 0.45), (0.74, 0.8), (0.72, 1.15), (0.66, 1.4), (0.45, 1.58), (0.0, 1.62))]
    c.malla(sc.torno('campanita', perfil, coll, segmentos=18, centro=(0, 0, 0.02)), plata)
    c.malla(sc.torno('dentro', [(0.0, 0.1), (0.05, 0.09), (0.06, 0.04), (0.075, 0.003)], coll, segmentos=18, centro=(0, 0, 0.02)), P_('#3A3E48', 'liso'))
    c.bola((0, -0.02, 0.012), 0.016, P_('#8A8E98', 'cera', semilla=271), 0.0)   # el badajo asomado
    sf.cuerda_anillo(c, 'filo', [(math.cos(a) * 0.081, math.sin(a) * 0.081, 0.025) for a in np.linspace(0, 2 * math.pi, 20, endpoint=False)], 0.005,
                     P_('#E8ECF2', 'cera', semilla=272), coll)
    # Mango de madera con perilla dorada
    c.cono((0, 0, 0.135), (0, 0, 0.22), 0.016, 0.02, madera(273, '#6A4426'), 0.0)
    c.bola((0, 0, 0.235), 0.024, P_('#C09040', 'oro', semilla=274, mat='base'), 0.0)
    # Lazo rojo amarrado al mango
    rojo = P_('#A8141C', 'tela', semilla=275)
    b = np.array([0, -0.018, 0.15])
    c.bola(b, (0.016, 0.01, 0.014), rojo, 0.0)
    for s in (-1, 1):
        c.malla(sf.pluma(f'oreja lazo {s}', b, b + np.array([s * 0.05, -0.005, 0.02]), 0.035, coll, normal=(0, -1, 0.2), grosor=0.004), rojo)
        c.malla(sf.pluma(f'cola lazo {s}', b, b + np.array([s * 0.025, -0.012, -0.06]), 0.022, coll, normal=(0, -1, 0), grosor=0.003), rojo)
    # La estrellita grabada en el frente
    p = np.array([0, -_radio_en(perfil, 0.06) - 0.004, 0.08])
    for k in range(6):
        a = 2 * math.pi * k / 6
        c.malla(sc.punta(f'estrellita {k}', p, p + np.array([math.cos(a) * 0.018, 0, math.sin(a) * 0.018]), 0.004, coll, seg=3), brillo('plata', '#C4DAFF'))
    # Brillitos de que suena
    for k in range(4):
        a = 0.6 + k * 1.6
        c.malla(sc.bolita(f'destello {k}', (math.cos(a) * 0.13, math.sin(a) * 0.1, 0.12 + 0.03 * k), 0.008, coll, n=1, sub=1), brillo('plata', '#C4DAFF'))
    F.marca('luz', (0, 0, 0.08))
    return F


# ------------------------------------------------------------------------------------------------- Familiares (L7)
# Compañeros chiquitos que siguen al jugador (por piezas, como los enemigos: miran hacia +Y y aletean o caminan).
# El cuervo y el perro de huesos usan los modelos de los enemigos; estos cinco son nuevos.

def _ojo_tierno(pz, coll, c, r, iris, nombre, mira=(0, 1, 0)):
    """Ojo grande y tierno: blanco, iris de color, pupila y el brillito."""
    c = np.asarray(c, float)
    m = _unit(np.asarray(mira, float))
    pz.malla(sc.bolita(f'{nombre} blanco', c, r, coll, n=2), P_('#F4F0E6', 'liso'))
    pz.malla(sc.bolita(f'{nombre} iris', c + m * r * 0.55, (r * 0.62, r * 0.4, r * 0.62) if abs(m[1]) > 0.5 else r * 0.6, coll, n=2), iris)
    pz.malla(sc.bolita(f'{nombre} pupila', c + m * r * 0.82, r * 0.32, coll, n=1), P_('#0E0A08', 'liso'))
    pz.malla(sc.bolita(f'{nombre} brillo', c + m * r * 0.9 + np.array([r * 0.25, 0, r * 0.3]), r * 0.13, coll, n=1), brillo('blanco', '#FFF4DA'))


@cosa('familiar_linterna')
def familiar_linterna(coll):
    """Linterna de ánimas: un farol de hierro que flota solo, con un alma azul adentro que sonríe, y dos llamitas a
    los lados que hacen de alas."""
    F = nueva('familiar_linterna', voxel=0.006, suelo=False, flota=1)
    c = F.pieza('cuerpo', (0, 0, 0.25), tris=2600)
    mt = hierro(300, '#3A3A42')
    azul = brillo('azul', '#5ED8FF')
    # Base, techo de cono con su argolla y los cuatro barrotes
    c.malla(sc.torno('base', [(0.0, 0.0), (0.1, 0.0), (0.11, 0.02), (0.09, 0.04), (0.0, 0.045)], coll, segmentos=16, centro=(0, 0, 0.06)), mt)
    c.malla(sc.torno('techo', [(0.0, 0.0), (0.12, 0.0), (0.12, 0.015), (0.06, 0.09), (0.02, 0.12), (0.0, 0.125)], coll, segmentos=16, centro=(0, 0, 0.31)), mt)
    sf.cuerda_anillo(c, 'argolla', [(math.cos(a) * 0.035, 0, 0.47 + math.sin(a) * 0.03) for a in np.linspace(0, 2 * math.pi, 10, endpoint=False)], 0.008, mt, coll)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        c.trazo([(math.cos(a) * 0.09, math.sin(a) * 0.09, 0.1), (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.31)], 0.01, mt, 0.0)
    c.malla(sc.bolita('vidrio', (0, 0, 0.205), (0.085, 0.085, 0.1), coll, n=2), P_('#8AD8FF', 'vidrio', mat='espectro'))
    # El alma: una llama azul con carita
    c.malla(sc.punta('alma', (0, 0, 0.13), (0, 0, 0.3), 0.06, coll, seg=8, medio=0.45), azul)
    for s in (-1, 1):
        c.malla(sc.bolita(f'ojo alma {s}', (s * 0.018, 0.045, 0.2), (0.008, 0.005, 0.012), coll, n=1), P_('#0A1A2A', 'liso'))
    c.trazo([(-0.014, 0.05, 0.178), (0.0, 0.053, 0.172), (0.014, 0.05, 0.178)], 0.003, P_('#0A1A2A', 'liso'), 0.0)
    F.marca('luz', (0, 0, 0.2))
    for lado, s in LADOS:
        w = F.pieza(f'ala_{lado}', (s * 0.1, 0, 0.22), tris=300)
        for q in range(3):
            w.malla(sc.punta(f'llamita {lado} {q}', (s * 0.1, 0, 0.21 - 0.03 * q), (s * (0.22 - 0.03 * q), -0.03, 0.26 - 0.05 * q), 0.03 - 0.006 * q, coll, seg=5),
                    azul if q == 0 else P_('#8AD8FF', 'vidrio', mat='espectro'))
    return F


@cosa('familiar_sapo')
def familiar_sapo(coll):
    """Sapo de la bruja: gordito, verde con verrugas, ojos saltones y su sombrerito de bruja ladeado."""
    F = nueva('familiar_sapo', voxel=0.006)
    piel = P_('#5E8A3A', 'carne', color2='#3A5A22', semilla=310)
    panza = P_('#C8C88A', 'carne', color2='#A8A86A', semilla=311)
    c = F.pieza('cuerpo', (0, 0, 0.1), tris=3000)
    cuerpo = sf.union(sdf.ellipsoid((0, 0, 0.11), (0.16, 0.15, 0.1)), sdf.ellipsoid((0, 0.07, 0.15), (0.13, 0.1, 0.08)), k=0.05)
    c.sdf(sc.sdf_ruido(cuerpo, 0.004, 25, 310), (-0.22, -0.2, 0.0), (0.22, 0.22, 0.26), piel)
    c.bola((0, 0.09, 0.08), (0.11, 0.07, 0.06), panza, 0.0)
    rng = np.random.default_rng(310)
    for k in range(14):
        d = np.array([rng.uniform(-1, 1), rng.uniform(-1, 0.6), rng.uniform(0.2, 1)])
        p, n = sf.hacia(cuerpo, (0, 0.02, 0.12), d)
        if p is not None:
            c.malla(sc.bolita(f'verruga {k}', p + n * 0.004, 0.012 + 0.006 * (k % 3), coll, n=1), P_('#4A6A2A', 'carne', semilla=320 + k))
    # Ojos saltones arriba y la bocota
    for s in (-1, 1):
        c.bola((s * 0.07, 0.08, 0.22), 0.045, piel, 0.0)
        _ojo_tierno(c, coll, (s * 0.07, 0.1, 0.235), 0.035, P_('#E0B020', 'liso'), f'ojo sapo {s}', mira=(s * 0.2, 1, 0.2))
    c.trazo([(-0.11, 0.135, 0.12), (-0.05, 0.16, 0.105), (0.0, 0.165, 0.103), (0.05, 0.16, 0.105), (0.11, 0.135, 0.12)], 0.006, P_('#2A1A14', 'liso'), 0.0)
    for s in (-1, 1):
        c.bola((s * 0.09, 0.14, 0.13), (0.02, 0.012, 0.015), P_('#D88A8A', 'carne', semilla=330), 0.0)   # cachetes
        c.trazo([(s * 0.1, 0.1, 0.05), (s * 0.13, 0.17, 0.015)], [0.025, 0.02], piel, 0.0)   # patitas de adelante
        c.bola((s * 0.135, 0.19, 0.012), (0.03, 0.025, 0.01), piel, 0.0)
    # El sombrerito de bruja, ladeado
    sombrero = [(0.0, 0.0), (0.11, 0.0), (0.11, 0.008), (0.05, 0.012), (0.045, 0.06), (0.03, 0.12), (0.012, 0.17), (0.0, 0.18)]
    c.malla(sc.torno('sombrero', sombrero, coll, segmentos=18, centro=(0.02, -0.01, 0.235), eje=(0.25, -0.15, 1)), P_('#3A1A4A', 'tela', semilla=331))
    sf.cuerda_anillo(c, 'cinta sombrero', [(0.02 + math.cos(a) * 0.05, -0.01 + math.sin(a) * 0.05, 0.255 + 0.01 * math.cos(a)) for a in np.linspace(0, 2 * math.pi, 14, endpoint=False)],
                     0.008, P_('#C09040', 'oro', semilla=332, mat='base'), coll)
    for lado, s in LADOS:
        p = F.pieza(f'pierna_{lado}', (s * 0.12, -0.06, 0.07), tris=500)
        p.trazo([(s * 0.12, -0.06, 0.07), (s * 0.17, -0.02, 0.05), (s * 0.15, -0.1, 0.02)], [0.04, 0.03, 0.025], piel, 0.0)
        p.bola((s * 0.16, -0.06, 0.012), (0.04, 0.05, 0.012), piel, 0.0)
    return F


@cosa('familiar_salamandra')
def familiar_salamandra(coll):
    """Salamandra: lagartijita de fuego, naranja con manchas negras y brasas que brillan en el lomo."""
    F = nueva('familiar_salamandra', voxel=0.005)
    piel = P_('#E07A2A', 'carne', color2='#B04A1A', semilla=340)
    mancha = P_('#2A1A14', 'liso')
    brasa = brillo('fuego', '#FF6A1A')
    c = F.pieza('cuerpo', (0, 0, 0.06), tris=2400)
    lomo = [np.array([0, y, 0.07 + 0.015 * math.sin(y * 9)]) for y in np.linspace(-0.12, 0.16, 6)]
    c.trazo(lomo, [0.05, 0.065, 0.07, 0.068, 0.06, 0.05], piel, 0.0)
    for k, y in enumerate((-0.08, -0.02, 0.04, 0.1)):
        for s in (-1, 1):
            c.bola((s * 0.035, y, 0.115), (0.016, 0.02, 0.008), mancha if (k + s) % 2 else brasa, 0.0)
    for k, (s, y) in enumerate(((-1, 0.1), (1, 0.1), (-1, -0.07), (1, -0.07))):
        b = np.array([s * 0.05, y, 0.06])
        c.trazo([b, b + np.array([s * 0.06, 0.02, -0.03]), b + np.array([s * 0.07, 0.04, -0.055])], [0.022, 0.018, 0.015], piel, 0.0)
        for q in range(3):
            c.trazo([b + np.array([s * 0.07, 0.04, -0.055]), b + np.array([s * (0.07 + 0.015 * (q - 1)), 0.07, -0.058])], 0.006, piel, 0.0)
    h = F.pieza('cabeza', (0, 0.17, 0.08), tris=1400)
    h.sdf(sf.union(sdf.ellipsoid((0, 0.22, 0.09), (0.07, 0.07, 0.05)), sdf.ellipsoid((0, 0.27, 0.08), (0.05, 0.04, 0.035)), k=0.03), (-0.1, 0.13, 0.02), (0.1, 0.33, 0.16), piel)
    for s in (-1, 1):
        _ojo_tierno(h, coll, (s * 0.04, 0.24, 0.125), 0.024, P_('#FFD36B', 'liso'), f'ojo sala {s}', mira=(s * 0.3, 1, 0.3))
    h.trazo([(-0.03, 0.305, 0.07), (0.0, 0.312, 0.068), (0.03, 0.305, 0.07)], 0.004, mancha, 0.0)
    k_ = F.pieza('cola', (0, -0.13, 0.07), tris=700)
    cola = [np.array([0.04 * math.sin(t * 5), -0.13 - t * 0.28, 0.07 - t * 0.04 + 0.04 * t * t]) for t in np.linspace(0, 1, 7)]
    k_.trazo(cola, list(np.linspace(0.045, 0.012, 7)), piel, 0.0)
    e = cola[-1]
    for q in range(3):
        k_.malla(sc.punta(f'llama cola {q}', e, e + np.array([0.02 * (q - 1), -0.02, 0.07 + 0.02 * (q == 1)]), 0.018, coll, seg=5), brasa)
    F.marca('luz', (0, 0, 0.12))
    return F


@cosa('familiar_lechuza')
def familiar_lechuza(coll):
    """Lechuza de escarcha: bolita de plumas blancas y azules, ojos enormes de hielo, orejitas y escarcha en la cabeza."""
    F = nueva('familiar_lechuza', voxel=0.006, suelo=False, flota=1)
    pluma_b = P_('#E8F0F8', 'tela', semilla=350)
    pluma_a = P_('#8AB0D8', 'tela', semilla=351)
    hielo = brillo('hielo', '#8AF0FF')
    c = F.pieza('cuerpo', (0, 0, 0.2), tris=2800)
    cuerpo = sf.union(sdf.ellipsoid((0, 0, 0.17), (0.14, 0.12, 0.15)), sdf.ellipsoid((0, 0.02, 0.3), (0.13, 0.11, 0.1)), k=0.06)
    c.sdf(sc.sdf_ruido(cuerpo, 0.004, 30, 350), (-0.2, -0.17, 0.0), (0.2, 0.17, 0.42), pluma_b)
    # Pecho moteado y el disco de la cara
    for k in range(10):
        a = -0.6 + (k % 5) * 0.3
        z = 0.12 + 0.05 * (k // 5)
        p, n = sf.hacia(cuerpo, (0, 0, z), (math.sin(a), 1, 0))
        if p is not None:
            c.malla(sc.punta(f'mota {k}', p - n * 0.003, p + n * 0.004 + np.array([0, 0, -0.02]), 0.012, coll, seg=3), pluma_a)
    c.bola((0, 0.1, 0.3), (0.11, 0.03, 0.08), P_('#F8FAFC', 'tela', semilla=352), 0.0)
    for s in (-1, 1):
        _ojo_tierno(c, coll, (s * 0.05, 0.115, 0.31), 0.04, hielo, f'ojo lechuza {s}')
        sf.cuerno(c, f'oreja {s}', [(s * 0.08, 0.02, 0.38), (s * 0.11, 0.0, 0.43), (s * 0.12, -0.01, 0.46)], 0.025, pluma_a, coll)
    c.malla(sc.punta('pico', (0, 0.125, 0.29), (0, 0.15, 0.255), 0.016, coll, seg=4), P_('#C8A040', 'liso'))
    # Escarcha en la cabeza y las patitas
    for k in range(4):
        a = -0.6 + k * 0.4
        b = np.array([math.sin(a) * 0.06, -0.01, 0.39])
        c.malla(sc.punta(f'escarcha {k}', b, b + np.array([math.sin(a) * 0.03, 0.0, 0.04 + 0.01 * (k % 2)]), 0.012, coll, seg=4), hielo)
    for s in (-1, 1):
        for q in range(3):
            b = np.array([s * 0.05, 0.03, 0.03])
            c.trazo([b, b + np.array([s * 0.01 * (q - 1), 0.03, -0.025])], 0.007, P_('#C8A040', 'liso'), 0.0)
    for lado, s in LADOS:
        w = F.pieza(f'ala_{lado}', (s * 0.12, -0.01, 0.24), tris=600)
        for q in range(4):
            b = np.array([s * 0.12, -0.01, 0.24 - q * 0.015])
            e = b + np.array([s * (0.16 - 0.025 * q), -0.03, -0.06 - 0.03 * q])
            w.malla(sf.pluma(f'remera {lado} {q}', b, e, 0.05, coll, normal=(0, -1, 0.2), grosor=0.006), pluma_b if q % 2 else pluma_a)
    F.marca('luz', (0, 0.12, 0.31))
    return F


@cosa('familiar_campanita')
def familiar_campanita(coll):
    """Campanita de plata: la campanita de las Santas con alitas de plumas blancas, lazo rojo y carita."""
    F = nueva('familiar_campanita', voxel=0.005, suelo=False, flota=1)
    plata = P_('#C8CED8', 'cera', semilla=360)
    c = F.pieza('cuerpo', (0, 0, 0.15), tris=1800)
    perfil = [(r * 0.09, z * 0.09) for r, z in ((1.05, 0.0), (1.08, 0.06), (0.98, 0.18), (0.82, 0.45), (0.74, 0.8), (0.72, 1.15), (0.66, 1.4), (0.45, 1.58), (0.0, 1.62))]
    c.malla(sc.torno('campanita', perfil, coll, segmentos=20, centro=(0, 0, 0.06)), plata)
    c.malla(sc.torno('dentro', [(0.0, 0.12), (0.06, 0.1), (0.07, 0.05), (0.09, 0.004)], coll, segmentos=20, centro=(0, 0, 0.06)), P_('#3A3E48', 'liso'))
    c.bola((0, 0, 0.045), 0.022, P_('#8A8E98', 'cera', semilla=361), 0.0)
    sf.cuerda_anillo(c, 'filo', [(math.cos(a) * 0.098, math.sin(a) * 0.098, 0.066) for a in np.linspace(0, 2 * math.pi, 20, endpoint=False)], 0.006,
                     P_('#E8ECF2', 'cera', semilla=362), coll)
    c.malla(sc.torno('asa', [(0.0, 0.0), (0.02, 0.0), (0.025, 0.02), (0.02, 0.04), (0.0, 0.045)], coll, segmentos=12, centro=(0, 0, 0.205)), P_('#C09040', 'oro', semilla=363, mat='base'))
    # La carita en el frente (+Y) y el lazo
    for s in (-1, 1):
        c.malla(sc.bolita(f'ojo {s}', (s * 0.025, 0.07, 0.14), (0.008, 0.005, 0.012), coll, n=1), P_('#14161C', 'liso'))
        c.bola((s * 0.045, 0.065, 0.12), (0.012, 0.005, 0.008), P_('#E8A0A8', 'cera', semilla=364), 0.0)
    c.trazo([(-0.012, 0.073, 0.115), (0.0, 0.076, 0.11), (0.012, 0.073, 0.115)], 0.0025, P_('#14161C', 'liso'), 0.0)
    rojo = P_('#A8141C', 'tela', semilla=365)
    b = np.array([0, 0.03, 0.2])
    c.bola(b, (0.014, 0.01, 0.012), rojo, 0.0)
    for s in (-1, 1):
        c.malla(sf.pluma(f'oreja lazo {s}', b, b + np.array([s * 0.045, 0.01, 0.015]), 0.03, coll, normal=(0, 1, 0.2), grosor=0.004), rojo)
    for lado, s in LADOS:
        w = F.pieza(f'ala_{lado}', (s * 0.06, -0.01, 0.17), tris=400)
        for q in range(3):
            base = np.array([s * 0.06, -0.01, 0.17])
            e = base + np.array([s * (0.12 - 0.025 * q), -0.02, 0.05 - 0.035 * q])
            w.malla(sf.pluma(f'pluma {lado} {q}', base, e, 0.04, coll, normal=(0, -1, 0.3), grosor=0.004), P_('#F4F4F8', 'tela', semilla=366 + q))
    F.marca('luz', (0, 0, 0.12))
    return F
