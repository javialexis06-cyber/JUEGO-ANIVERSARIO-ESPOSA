"""Nuestro Hogar · El Escudo de las Hermanas: el kit del Borde de Astra (las plataformas de roca sobre el mar de
estrellas donde se defiende el escudo en la misión P23). Estilo del juego: roca de plastilina, musgo de fieltro,
madera, cristales de laca; todo redondeado. El juego reparte las piezas según el mapa de cada nivel.

  isla_a, isla_b, isla_c      trozos de plataforma (≈4,4 × 4,4 m) con musgo de luz, piedritas y raíces colgando
  isla_borde                  trozo de orilla: más roca colgando hacia el abismo
  losa_1 … losa_4             las piedras del camino de la ceniza (se ponen en fila a lo largo de cada ruta)
  zocalo                      el sitio para construir: círculo de piedra con runas doradas y su borde de madera
  portal                      la grieta por donde entra la ceniza (anillo de roca negra con brasas moradas)
  ancla_escudo                el ancla del escudo de luz: dos pilares de cristal con el sol de Aura y la luna de Lara
  cristal_azul, cristal_dorado, cristal_morado     racimos de cristal
  roca_lunar_1, roca_lunar_2  rocas redondas con cráteres
  farol_estrella              poste de madera con un farol de estrella
  estandarte_aura, estandarte_lara                 banderas de fieltro de las Hermanas
  arbol_estelar               árbol de tronco blanco con copa de hojas que brillan
  hongos_luz                  matica de hongos que brillan
  columna_rota, arco_roto     ruinas de las Santas de antes
  rosal_lara                  rosal morado de Lara
  brasero_aura                brasero de bronce con fuego de Aura
  provisiones                 cajas, barriles y costales de los defensores
  tienda_campana              tienda de lona del campamento
  banco_madera                banco con una manta
  telescopio                  el telescopio de los vigías
  flores_estrella             matas de flores pequeñas que brillan

Un solo GLB: escudo_mapa.glb.   Uso: blender -b -P escudo_mapa.py -- <carpeta_salida> [claves]
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
from granja_muebles import bola, caja, cilindro, mat, metal, piedra, tubo  # noqa: E402
from tiendas import _mat  # noqa: E402

RNG = np.random.default_rng(2323)

ROCA = lambda: piedra('roca borde', '#7E7690')  # noqa: E731
ROCA_OSC = lambda: piedra('roca borde oscura', '#544C66')  # noqa: E731
ROCA_CLARA = lambda: piedra('roca borde clara', '#A79FB8')  # noqa: E731
MUSGO = lambda: tela('musgo estelar', '#5E8F86')  # noqa: E731
MUSGO_CLARO = lambda: tela('musgo estelar claro', '#7DB3A3')  # noqa: E731
MAD = lambda: madera('madera escudo', '#B07A50')  # noqa: E731
MAD_OSC = lambda: madera('madera escudo oscura', '#7A4E33')  # noqa: E731
ORO = lambda: metal('oro escudo', '#E2B04A')  # noqa: E731


def cristal(nombre, color, brillo, fuerza=0.8):
    return _mat(f'Escudo | cristal {nombre}', color, rough=0.12, coat=0.6, emission=brillo, emission_strength=fuerza)


def ruido(semilla, amp=0.12, f=2.3):
    def s(v):
        n = 1 + amp * np.sin(v[:, 0] * f + semilla) * np.sin(v[:, 1] * f * 1.1 + semilla * 1.7) * np.sin(v[:, 2] * f * 0.9 + semilla * 0.6)
        return v * n[:, None]
    return s


def racimo(coll, nombre, x, y, color, brillo, n=5, alto=0.6, base=True):
    """Racimo de cristales de punta (laca brillante) sobre una piedrita."""
    m = cristal(nombre, color, brillo)
    for k in range(n):
        a = k * 2.4 + RNG.random() * 0.5
        inc = 0.0 if k == 0 else 0.3 + RNG.random() * 0.25
        l = alto * (1.0 if k == 0 else 0.5 + RNG.random() * 0.35)
        bx, by = x + (math.cos(a) * 0.07 if k else 0), y + (math.sin(a) * 0.07 if k else 0)
        punta = (bx + math.cos(a) * math.sin(inc) * l, by + math.sin(a) * math.sin(inc) * l, math.cos(inc) * l)
        clay.sweep(f'{nombre} {k}', [(bx, by, 0.0), punta], [alto * 0.13 if k == 0 else alto * 0.09, alto * 0.012], coll=coll, material=m,
                   segments=6, samples=2, caps=('flat', 'point'), subsurf=0)
    if base:
        bola(coll, f'{nombre} piedra', (x, y, 0.03), (alto * 0.3, alto * 0.26, alto * 0.1), ROCA_OSC(), n=3, sub=0)


def isla(coll, nombre, semilla, orilla=False):
    """Trozo de plataforma: tapa plana de roca con musgo de fieltro encima y roca colgando hacia el abismo."""
    rng = np.random.default_rng(semilla)
    # Cuerpo de roca: superelipsoide aplanada arriba (la cara de arriba queda en z = 0)
    def forma(v):
        v = ruido(semilla, 0.08, 1.7)(v)
        abajo = v[:, 2] < 0
        v[abajo, 2] *= 1.0 + 0.5 * (np.sin(v[abajo, 0] * 2.1 + semilla) * 0.5 + 0.5)
        v[:, 2] = np.minimum(v[:, 2], -0.02)
        return v
    clay.blob(f'{nombre} roca', (0, 0, -0.55), (2.35, 2.35, 0.95 if not orilla else 1.25), coll, ROCA(), n=10, p=3.2, shaper=forma, subsurf=1)
    # Tapa de musgo (fieltro) un poquito más pequeña, con bultos suaves
    clay.blob(f'{nombre} musgo', (0, 0, -0.04), (2.22, 2.22, 0.07), coll, MUSGO(), n=10, p=3.6, shaper=ruido(semilla + 3, 0.05, 2.5), subsurf=1)
    # Rocas colgando (estalactitas redondeadas)
    for k in range(7 if orilla else 4):
        a = rng.random() * math.tau
        r = 1.0 + rng.random() * 1.0
        x, y = math.cos(a) * r, math.sin(a) * r
        l = 0.6 + rng.random() * (1.4 if orilla else 0.7)
        clay.sweep(f'{nombre} cuelga {k}', [(x, y, -0.9), (x * 0.95, y * 0.95, -0.9 - l)], [0.32 + rng.random() * 0.15, 0.05], coll=coll,
                   material=ROCA_OSC(), segments=7, samples=2, caps=('flat', 'point'), subsurf=0)
    # Piedritas y matas de musgo claro encima (que no se vea vacío)
    for k in range(5):
        x, y = (rng.random() - 0.5) * 3.6, (rng.random() - 0.5) * 3.6
        bola(coll, f'{nombre} piedrita {k}', (x, y, 0.03), (0.14 + rng.random() * 0.1, 0.12 + rng.random() * 0.08, 0.07), ROCA_CLARA(), n=3, sub=0)
    for k in range(6):
        x, y = (rng.random() - 0.5) * 3.8, (rng.random() - 0.5) * 3.8
        bola(coll, f'{nombre} mata {k}', (x, y, 0.02), (0.22 + rng.random() * 0.15, 0.2 + rng.random() * 0.12, 0.08), MUSGO_CLARO(), n=3, sub=0)
    # Raíces que asoman por el borde
    for k in range(3):
        a = rng.random() * math.tau
        x, y = math.cos(a) * 2.15, math.sin(a) * 2.15
        tubo(coll, f'{nombre} raíz {k}', [(x * 0.9, y * 0.9, -0.02), (x * 1.04, y * 1.04, -0.3), (x * 1.02, y * 1.02, -0.8)], 0.05, MAD_OSC(), seg=5)


def m_isla_a(coll):
    isla(coll, 'isla a', 11)


def m_isla_b(coll):
    isla(coll, 'isla b', 23)
    racimo(coll, 'cristal isla b', 1.2, -0.9, '#8FD3FF', '#4FA8E8', n=4, alto=0.45)


def m_isla_c(coll):
    isla(coll, 'isla c', 37)
    for k in range(4):
        a = k * 1.7
        bola(coll, f'flor isla c {k}', (math.cos(a) * 1.1 - 0.4, math.sin(a) * 0.9 + 0.5, 0.06), 0.05, luz('flor isla', '#FFE9A8', 2.0), n=2, sub=0)


def m_isla_borde(coll):
    isla(coll, 'isla borde', 51, orilla=True)


def losa(coll, nombre, semilla, color):
    rng = np.random.default_rng(semilla)
    clay.blob(nombre, (0, 0, 0.0), (0.26 + rng.random() * 0.05, 0.22 + rng.random() * 0.05, 0.07), coll, piedra(f'losa {color}', color),
              n=4, p=2.6, shaper=ruido(semilla, 0.1, 6), subsurf=1)


def m_losa_1(coll):
    losa(coll, 'losa 1', 1, '#C9B9A0')


def m_losa_2(coll):
    losa(coll, 'losa 2', 2, '#B8A78F')


def m_losa_3(coll):
    losa(coll, 'losa 3', 3, '#D6C7AE')


def m_losa_4(coll):
    losa(coll, 'losa 4', 4, '#A89A86')


def m_zocalo(coll):
    """Sitio de construcción: plataforma redonda de piedra con borde de madera y runas doradas que brillan."""
    clay.lathe('zocalo base', [(0.0, 0.0), (0.82, 0.0), (0.86, 0.06), (0.8, 0.14), (0.0, 0.14)], coll, ROCA_CLARA(), segments=28, subsurf=1)
    clay.lathe('zocalo aro', [(0.84, 0.04), (0.92, 0.04), (0.92, 0.12), (0.84, 0.12)], coll, MAD(), segments=28, subsurf=1)
    for k in range(8):
        a = k / 8 * math.tau
        caja(coll, f'zocalo clavo {k}', (math.cos(a) * 0.88, math.sin(a) * 0.88, 0.13), (0.04, 0.04, 0.02), ORO(), p=6, sub=0)
        bola(coll, f'zocalo runa {k}', (math.cos(a + 0.39) * 0.62, math.sin(a + 0.39) * 0.62, 0.145), (0.05, 0.05, 0.012),
             luz('runa zocalo', '#FFD98A', 2.5), n=2, sub=0)
    clay.lathe('zocalo centro', [(0.0, 0.14), (0.36, 0.14), (0.36, 0.155), (0.0, 0.155)], coll, piedra('centro zocalo', '#CFC3AE'), segments=24, subsurf=0)


def m_portal(coll):
    """La grieta de la ceniza: un anillo de roca negra torcida con brasas moradas y ceniza amontonada."""
    negra = piedra('roca ceniza', '#2E2836')
    for k in range(9):
        a0, a1 = k / 9 * math.tau, (k + 0.8) / 9 * math.tau
        r = 1.25
        pts = [(math.cos(a0) * r, 0.0, 1.35 + math.sin(a0) * r), (math.cos((a0 + a1) / 2) * r * 1.05, 0.05, 1.35 + math.sin((a0 + a1) / 2) * r * 1.05),
               (math.cos(a1) * r, 0.0, 1.35 + math.sin(a1) * r)]
        if min(p[2] for p in pts) < 0.05:
            continue
        clay.sweep(f'portal piedra {k}', pts, [0.28, 0.34, 0.26], coll=coll, material=negra, segments=7, samples=3, subsurf=1)
    for s in (-1, 1):
        clay.blob(f'portal pie {s}', (s * 1.15, 0, 0.3), (0.5, 0.45, 0.45), coll, negra, n=5, shaper=ruido(s * 3, 0.15, 3), subsurf=1)
    brasa = luz('brasa ceniza', '#B05CFF', 3.0)
    for k in range(10):
        a = k / 10 * math.tau
        bola(coll, f'portal brasa {k}', (math.cos(a) * 1.25, -0.25, 1.35 + math.sin(a) * 1.25), 0.07 + 0.03 * (k % 3), brasa, n=2, sub=0)
    for k in range(6):
        x = (RNG.random() - 0.5) * 2.6
        clay.blob(f'portal ceniza {k}', (x, (RNG.random() - 0.5) * 1.2, 0.0), (0.4, 0.3, 0.12), coll, tela('ceniza', '#4A4452'), n=4, subsurf=1)
    racimo(coll, 'portal cristal', -1.5, 0.4, '#5C3A7A', '#7A3FB0', n=4, alto=0.7)
    racimo(coll, 'portal cristal 2', 1.6, -0.3, '#5C3A7A', '#7A3FB0', n=3, alto=0.5)


def m_ancla_escudo(coll):
    """El ancla del escudo de luz: dos pilares de cristal en marcos de madera y oro; uno con el sol de Aura y otro con
    la luna de Lara. Entre los dos, el juego tiende la cortina de luz."""
    for s, (color, brillo) in ((-1, ('#FFE0A0', '#F2B84A')), (1, ('#D9C8FF', '#9C7FE8'))):
        x = s * 1.6
        clay.lathe(f'ancla base {s}', [(0, 0), (0.75, 0), (0.7, 0.3), (0.5, 0.42), (0, 0.42)], coll, ROCA_CLARA(), segments=16, subsurf=1).location = (x, 0, 0)
        clay.sweep(f'ancla cristal {s}', [(x, 0, 0.4), (x, 0, 2.2), (x, 0, 3.4)], [0.32, 0.36, 0.04], coll=coll, material=cristal(f'ancla {s}', color, brillo, 1.6),
                   segments=6, samples=3, caps=('flat', 'point'), subsurf=0)
        for k in range(4):
            a = k / 4 * math.tau + math.pi / 4
            tubo(coll, f'ancla marco {s} {k}', [(x + math.cos(a) * 0.48, math.sin(a) * 0.48, 0.4), (x + math.cos(a) * 0.5, math.sin(a) * 0.5, 1.9),
                                                (x + math.cos(a) * 0.2, math.sin(a) * 0.2, 2.9)], 0.06, MAD(), seg=6)
        clay.lathe(f'ancla aro {s}', [(0.48, 1.0), (0.58, 1.0), (0.58, 1.12), (0.48, 1.12)], coll, ORO(), segments=20, subsurf=0).location = (x, 0, 0)
        clay.lathe(f'ancla aro2 {s}', [(0.46, 1.8), (0.55, 1.8), (0.55, 1.9), (0.46, 1.9)], coll, ORO(), segments=20, subsurf=0).location = (x, 0, 0)
        if s < 0:  # el sol de Aura
            bola(coll, 'ancla sol', (x, -0.62, 1.5), (0.26, 0.06, 0.26), luz('sol aura', '#FFC64A', 3.0), n=3)
            for k in range(8):
                a = k / 8 * math.tau
                bola(coll, f'ancla rayo {k}', (x + math.cos(a) * 0.38, -0.62, 1.5 + math.sin(a) * 0.38), (0.07, 0.03, 0.07), ORO(), n=2, sub=0)
        else:  # la luna de Lara
            clay.sweep('ancla luna', [(x + 0.2 * math.cos(t), -0.62, 1.5 + 0.28 * math.sin(t)) for t in np.linspace(-2.2, 2.2, 7)], 0.08, coll=coll,
                       material=luz('luna lara', '#D9CCFF', 2.6), segments=8, samples=3, subsurf=0)
            for k in range(3):
                bola(coll, f'ancla estrella {k}', (x - 0.12 + k * 0.1, -0.62, 1.86 + (k % 2) * 0.08), 0.04, luz('estrellita', '#FFFFFF', 3.0), n=2, sub=0)
    # Piso entre los dos: losas claras con un sendero de oro
    for k in range(5):
        caja(coll, f'ancla losa {k}', (-1.0 + k * 0.5, 0, 0.04), (0.22, 0.6, 0.04), ROCA_CLARA(), p=5, sub=0)
    caja(coll, 'ancla sendero', (0, 0, 0.085), (1.1, 0.06, 0.008), ORO(), p=6, sub=0)


def m_cristal_azul(coll):
    racimo(coll, 'cristal azul', 0, 0, '#8FD3FF', '#4FA8E8', n=6, alto=0.9)
    racimo(coll, 'cristal azul chico', 0.35, 0.2, '#B8E4FF', '#6FC0F0', n=3, alto=0.45, base=False)


def m_cristal_dorado(coll):
    racimo(coll, 'cristal dorado', 0, 0, '#FFD98A', '#E8A93A', n=6, alto=0.8)
    racimo(coll, 'cristal dorado chico', -0.3, 0.25, '#FFE7B0', '#F0BC55', n=3, alto=0.4, base=False)


def m_cristal_morado(coll):
    racimo(coll, 'cristal morado', 0, 0, '#C9A8FF', '#8A5AE0', n=6, alto=0.85)
    racimo(coll, 'cristal morado chico', 0.3, -0.25, '#DCC8FF', '#9F7AEA', n=3, alto=0.4, base=False)


def roca_lunar(coll, nombre, semilla, r):
    clay.blob(nombre, (0, 0, r * 0.55), (r, r * 0.9, r * 0.7), coll, ROCA_CLARA(), n=6, shaper=ruido(semilla, 0.12, 2.0), subsurf=1)
    for k in range(3):
        a = semilla + k * 2.1
        bola(coll, f'{nombre} crater {k}', (math.cos(a) * r * 0.5, math.sin(a) * r * 0.45 - r * 0.3, r * (0.85 + 0.2 * (k % 2))), (r * 0.22, r * 0.18, r * 0.06),
             ROCA(), n=2, sub=0)
    bola(coll, f'{nombre} musgo', (r * 0.2, r * 0.1, r * 1.15), (r * 0.45, r * 0.4, r * 0.12), MUSGO_CLARO(), n=3, sub=0)


def m_roca_lunar_1(coll):
    roca_lunar(coll, 'roca lunar 1', 3, 0.55)


def m_roca_lunar_2(coll):
    roca_lunar(coll, 'roca lunar 2', 7, 0.8)
    roca_lunar_chica = clay.blob('roca lunar 2 chica', (0.85, 0.3, 0.2), (0.3, 0.26, 0.22), coll, ROCA_CLARA(), n=4, shaper=ruido(9, 0.1, 3), subsurf=1)
    return roca_lunar_chica


def m_farol_estrella(coll):
    cilindro(coll, 'farol poste', (0, 0, 0), 0.07, 2.2, MAD_OSC(), seg=8)
    tubo(coll, 'farol brazo', [(0, 0, 2.1), (0, -0.25, 2.25), (0, -0.45, 2.2)], 0.04, MAD_OSC(), seg=6)
    clay.lathe('farol techo', [(0.0, 0.32), (0.2, 0.2), (0.17, 0.17), (0.0, 0.2)], coll, ORO(), segments=10, subsurf=0).location = (0, -0.45, 1.85)
    clay.lathe('farol vidrio', [(0.0, 0.0), (0.14, 0.02), (0.15, 0.17), (0.0, 0.2)], coll, cristal('farol', '#FFF3C8', '#FFD27A', 2.5), segments=10,
               subsurf=0).location = (0, -0.45, 1.83)
    bola(coll, 'farol estrella', (0, -0.45, 1.93), 0.07, luz('estrella farol', '#FFFFFF', 5.0), n=2, sub=0)
    clay.lathe('farol pie', [(0, 0), (0.22, 0), (0.18, 0.12), (0.08, 0.2), (0, 0.2)], coll, ROCA_CLARA(), segments=10, subsurf=1)


def estandarte(coll, nombre, tela_color, borde, emblema):
    cilindro(coll, f'{nombre} asta', (0, 0, 0), 0.05, 2.6, MAD(), seg=8)
    bola(coll, f'{nombre} punta', (0, 0, 2.66), 0.08, ORO(), n=3)
    tubo(coll, f'{nombre} travesaño', [(-0.45, 0, 2.45), (0.45, 0, 2.45)], 0.03, MAD(), seg=6)
    # Bandera de fieltro con la punta en V y una curva suave de viento
    v, f = [], []
    filas, cols = 6, 5
    for i in range(filas + 1):
        for j in range(cols + 1):
            u, w = j / cols, i / filas
            x = -0.42 + 0.84 * u
            z = 2.42 - 1.4 * w - (0.25 * (1 - abs(u - 0.5) * 2) if i == filas else 0)
            y = -0.06 * math.sin(u * math.pi) * (0.5 + w)
            v.append((x, y, z))
    for i in range(filas):
        for j in range(cols):
            a = i * (cols + 1) + j
            f.append((a, a + 1, a + cols + 2, a + cols + 1))
    o = clay.make_mesh_object(f'{nombre} tela', v, f, coll, material=tela(f'{nombre} tela', tela_color))
    clay.add_solidify(o, 0.03)
    clay.add_subsurf(o, 1, 2)
    tubo(coll, f'{nombre} borde', [(-0.42, -0.04, 2.42), (-0.42, -0.04, 1.02), (0.0, -0.04, 0.77), (0.42, -0.04, 1.02), (0.42, -0.04, 2.42)], 0.025,
         tela(f'{nombre} borde', borde), seg=5)
    emblema(coll, nombre)


def emblema_sol(coll, nombre):
    bola(coll, f'{nombre} sol', (0, -0.12, 1.75), (0.17, 0.04, 0.17), laca('sol bordado', '#FFC64A'), n=3)
    for k in range(8):
        a = k / 8 * math.tau
        bola(coll, f'{nombre} rayo {k}', (math.cos(a) * 0.26, -0.11, 1.75 + math.sin(a) * 0.26), (0.05, 0.02, 0.05), laca('rayo bordado', '#FFE08A'), n=2, sub=0)


def emblema_luna(coll, nombre):
    clay.sweep(f'{nombre} luna', [(0.12 * math.cos(t), -0.12, 1.75 + 0.2 * math.sin(t)) for t in np.linspace(-2.1, 2.1, 7)], 0.06, coll=coll,
               material=laca('luna bordada', '#E9E4F5'), segments=8, samples=3, subsurf=0)
    for k, (x, z) in enumerate(((-0.18, 1.98), (0.2, 1.6), (-0.22, 1.55))):
        bola(coll, f'{nombre} estrella {k}', (x, -0.11, z), 0.035, laca('estrella bordada', '#FFFFFF'), n=2, sub=0)


def m_estandarte_aura(coll):
    estandarte(coll, 'estandarte aura', '#E8892B', '#FFD36B', emblema_sol)


def m_estandarte_lara(coll):
    estandarte(coll, 'estandarte lara', '#3A2F5C', '#C9B6EA', emblema_luna)


def m_arbol_estelar(coll):
    blanco = madera('tronco estelar', '#E8E0D4')
    clay.lathe('arbol estelar tronco', [(0.0, 0.0), (0.32, 0.0), (0.2, 0.25), (0.15, 1.2), (0.11, 2.0), (0.0, 2.05)], coll, blanco, segments=8, subsurf=1)
    for k, (a, l, z) in enumerate(((0.4, 0.8, 1.5), (2.5, 0.7, 1.7), (4.4, 0.75, 1.85))):
        tubo(coll, f'arbol estelar rama {k}', [(0, 0, z - 0.2), (math.cos(a) * l * 0.6, math.sin(a) * l * 0.6, z + 0.1), (math.cos(a) * l, math.sin(a) * l, z + 0.45)],
             0.06, blanco, seg=6)
    hoja = tela('hojas estelares', '#7FC8D8')
    hoja2 = tela('hojas estelares claras', '#A8E2EA')
    for k, (x, y, z, r) in enumerate(((0, 0, 2.45, 0.85), (0.6, 0.3, 2.2, 0.55), (-0.55, 0.35, 2.25, 0.6), (0.1, -0.55, 2.3, 0.55), (-0.2, 0.1, 2.95, 0.5))):
        clay.blob(f'arbol estelar copa {k}', (x, y, z), (r, r, r * 0.8), coll, hoja if k % 2 == 0 else hoja2, n=4, shaper=ruido(k * 5, 0.12, 3), subsurf=1)
    for k in range(10):
        a = k * 2.3
        r = 0.7 + (k % 3) * 0.15
        bola(coll, f'arbol estelar fruto {k}', (math.cos(a) * r, math.sin(a) * r, 2.1 + (k % 4) * 0.25), 0.06, luz('fruto estelar', '#FFF0B0', 3.5), n=2, sub=0)


def m_hongos_luz(coll):
    for k, (x, y, h, r, c) in enumerate(((0, 0, 0.5, 0.28, '#8FD3FF'), (0.32, 0.12, 0.32, 0.18, '#C9A8FF'), (-0.25, 0.2, 0.25, 0.15, '#8FD3FF'),
                                         (0.1, -0.3, 0.2, 0.12, '#FFD98A'))):
        cilindro(coll, f'hongo pie {k}', (x, y, 0), r * 0.32, h, laca('pie hongo', '#F2EDE0'), seg=8)
        clay.blob(f'hongo sombrero {k}', (x, y, h), (r, r, r * 0.55), coll, _mat(f'Escudo | hongo {c}', c, rough=0.4, emission=c, emission_strength=0.9),
                  n=4, subsurf=1)
        for j in range(3):
            a = j * 2.1 + k
            bola(coll, f'hongo punto {k} {j}', (x + math.cos(a) * r * 0.55, y + math.sin(a) * r * 0.55, h + r * 0.35), r * 0.12, luz('punto hongo', '#FFFFFF', 2.0), n=2, sub=0)


def m_columna_rota(coll):
    clay.lathe('columna base', [(0, 0), (0.48, 0), (0.48, 0.18), (0.38, 0.24), (0, 0.24)], coll, ROCA_CLARA(), segments=12, subsurf=1)
    o = clay.lathe('columna fuste', [(0, 0.24), (0.3, 0.24), (0.28, 1.5), (0.0, 1.62)], coll, piedra('columna', '#D8CFC0'), segments=12, subsurf=1)
    o.rotation_euler = (0.06, 0.04, 0)
    for k in range(3):
        a = k * 2.0
        clay.blob(f'columna trozo {k}', (math.cos(a) * 0.75, math.sin(a) * 0.75, 0.14), (0.2, 0.16, 0.14), coll, piedra('columna', '#D8CFC0'), n=4,
                  shaper=ruido(k, 0.2, 5), subsurf=1)
    tubo(coll, 'columna hiedra', [(0.28, -0.05, 0.3), (0.2, -0.26, 0.7), (-0.15, -0.26, 1.0), (-0.28, 0.0, 1.35)], 0.035, tela('hiedra', '#4E8A6E'), seg=5)
    for k in range(6):
        bola(coll, f'columna hoja {k}', (0.28 - k * 0.1, -0.27, 0.35 + k * 0.17), (0.07, 0.03, 0.05), tela('hoja hiedra', '#6FA88A'), n=2, sub=0)


def m_arco_roto(coll):
    pie = piedra('arco', '#CFC5B4')
    for s in (-1, 1):
        caja(coll, f'arco pilar {s}', (s * 1.1, 0, 0.9), (0.26, 0.26, 0.9), pie, p=5)
    # Medio arco (el otro lado se cayó)
    pts = [(-1.1, 0, 1.8), (-0.75, 0, 2.35), (-0.15, 0, 2.6), (0.35, 0, 2.5)]
    clay.sweep('arco curva', pts, 0.24, coll=coll, material=pie, segments=6, samples=4, caps=('round', 'flat'), subsurf=1)
    for k in range(4):
        clay.blob(f'arco piedra caida {k}', (0.6 + k * 0.35, 0.4 - k * 0.2, 0.15), (0.22, 0.18, 0.15), coll, pie, n=4, shaper=ruido(k + 7, 0.2, 5), subsurf=1)
    racimo(coll, 'arco cristal', -1.5, 0.3, '#FFD98A', '#E8A93A', n=3, alto=0.4)
    bola(coll, 'arco runa', (-1.1, -0.27, 1.2), (0.12, 0.02, 0.12), luz('runa arco', '#FFD98A', 2.4), n=2, sub=0)


def m_rosal_lara(coll):
    hojas = tela('rosal hojas', '#3F6B4E')
    clay.blob('rosal mata', (0, 0, 0.42), (0.6, 0.5, 0.42), coll, hojas, n=5, shaper=ruido(4, 0.15, 4), subsurf=1)
    clay.blob('rosal mata 2', (0.45, 0.2, 0.3), (0.35, 0.3, 0.3), coll, hojas, n=4, shaper=ruido(6, 0.15, 4), subsurf=1)
    rosa = tela('rosa lara', '#9C6FD6')
    rosa2 = tela('rosa lara clara', '#C9B6EA')
    for k in range(11):
        a = k * 2.4
        r = 0.45 + (k % 3) * 0.08
        z = 0.45 + 0.3 * math.sin(k * 1.7)
        x, y = math.cos(a) * r, math.sin(a) * r * 0.85
        clay.blob(f'rosa {k}', (x, y, z), (0.09, 0.09, 0.07), coll, rosa if k % 3 else rosa2, n=3, shaper=ruido(k, 0.25, 30), subsurf=1)
        bola(coll, f'rosa centro {k}', (x, y, z + 0.05), 0.03, tela('centro rosa', '#6B4AA0'), n=2, sub=0)


def m_brasero_aura(coll):
    bronce = metal('bronce brasero', '#C08A4A')
    for k in range(3):
        a = k / 3 * math.tau
        tubo(coll, f'brasero pata {k}', [(math.cos(a) * 0.35, math.sin(a) * 0.35, 0.0), (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.55), (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.8)],
             0.035, bronce, seg=6)
    clay.lathe('brasero cuenco', [(0.0, 0.7), (0.2, 0.7), (0.42, 0.88), (0.45, 0.98), (0.4, 0.96)], coll, bronce, segments=16, subsurf=1, cap_top=False)
    for k in range(5):
        bola(coll, f'brasero carbon {k}', (math.cos(k * 1.3) * 0.18, math.sin(k * 1.3) * 0.18, 0.93), 0.1, luz('carbón', '#FF7A2A', 2.5), n=2, sub=0)
    for k, (h, r) in enumerate(((0.55, 0.2), (0.4, 0.14), (0.3, 0.1))):
        clay.sweep(f'brasero llama {k}', [(0.05 * k, 0.03 * k, 0.95), (0.03 * k, 0.0, 0.95 + h * 0.5), (0, 0, 0.95 + h)], [r, r * 0.6, 0.01], coll=coll,
                   material=luz('llama aura', ('#FFB040', '#FFD27A', '#FFF0B0')[k], 4.0 + k), segments=8, samples=3, caps=('round', 'point'), subsurf=0)


def m_provisiones(coll):
    caja(coll, 'caja 1', (0, 0, 0.3), (0.32, 0.3, 0.3), MAD(), p=10)
    caja(coll, 'caja 2', (0.6, 0.1, 0.24), (0.26, 0.26, 0.24), MAD(), p=10)
    caja(coll, 'caja 3', (0.2, 0.05, 0.78), (0.24, 0.22, 0.18), MAD_OSC(), p=10)
    for c, (x, y, z, h) in enumerate(((0, -0.31, 0.3, 0.3), (0.6, -0.17, 0.24, 0.24))):
        caja(coll, f'caja tira {c}', (x, y, z), (h + 0.02, 0.02, 0.04), MAD_OSC(), p=8, sub=0)
        bola(coll, f'caja sello {c}', (x, y - 0.03, z + 0.12), (0.07, 0.02, 0.07), luz('sello caja', '#FFD98A', 1.5), n=2, sub=0)
    clay.lathe('barril', [(0.0, 0.0), (0.24, 0.0), (0.29, 0.3), (0.24, 0.6), (0.0, 0.6)], coll, MAD(), segments=14, subsurf=1).location = (-0.65, 0.2, 0)
    for z in (0.1, 0.5):
        clay.lathe(f'barril aro {z}', [(0.25, z), (0.27, z), (0.27, z + 0.05), (0.25, z + 0.05)], coll, metal('aro', '#6E6660'), segments=14,
                   subsurf=0).location = (-0.65, 0.2, 0)
    for k in range(2):
        clay.blob(f'costal {k}', (-0.25 + k * 0.45, -0.55, 0.25), (0.26, 0.2, 0.26), coll, tela('costal', '#D9C59A'), n=5, p=2.4, subsurf=1)
        bola(coll, f'costal nudo {k}', (-0.25 + k * 0.45, -0.55, 0.52), (0.08, 0.08, 0.06), tela('cuerda', '#A8875A'), n=2, sub=0)


def m_tienda_campana(coll):
    lona = tela('lona tienda', '#E9DDC4')
    raya = tela('raya tienda', '#C9563F')
    v = [(-1.2, -1.0, 0.0), (1.2, -1.0, 0.0), (0.0, -1.0, 1.7), (-1.2, 1.0, 0.0), (1.2, 1.0, 0.0), (0.0, 1.0, 1.7)]
    o = clay.make_mesh_object('tienda lona', v, [(0, 2, 5, 3), (1, 4, 5, 2)], coll, material=lona)
    clay.add_solidify(o, 0.04)
    clay.add_subsurf(o, 1, 2)
    for y in (-0.5, 0.0, 0.5):
        tubo(coll, f'tienda raya {y}', [(-1.18, y, 0.02), (0.0, y, 1.72), (1.18, y, 0.02)], 0.03, raya, seg=5)
    # Puerta: dos solapas abiertas
    for s in (-1, 1):
        tubo(coll, f'tienda solapa {s}', [(0, -1.02, 1.6), (s * 0.45, -1.15, 0.8), (s * 0.7, -1.1, 0.05)], 0.06, lona, seg=6)
    cilindro(coll, 'tienda palo', (0, -1.0, 0), 0.04, 1.85, MAD_OSC(), seg=6)
    bola(coll, 'tienda bandera', (0.12, -1.0, 1.9), (0.12, 0.02, 0.07), tela('banderín', '#FFC64A'), n=2, sub=0)
    caja(coll, 'tienda manta', (0, -0.3, 0.05), (0.5, 0.35, 0.04), tela('manta', '#8E6FC9'), p=6)


def m_banco_madera(coll):
    caja(coll, 'banco asiento', (0, 0, 0.42), (0.7, 0.18, 0.04), MAD(), p=10)
    for x in (-0.55, 0.55):
        caja(coll, f'banco pata {x}', (x, 0, 0.2), (0.05, 0.15, 0.2), MAD_OSC(), p=8, sub=0)
    clay.blob('banco manta', (0.2, 0.0, 0.48), (0.35, 0.2, 0.04), coll, tela('manta banco', '#D9604E'), n=5, p=2.6, subsurf=1)
    clay.lathe('banco taza', [(0, 0), (0.05, 0), (0.06, 0.09), (0.0, 0.09)], coll, laca('taza', '#8FD3FF'), segments=10, subsurf=0).location = (-0.45, 0, 0.46)


def m_telescopio(coll):
    for k in range(3):
        a = k / 3 * math.tau
        tubo(coll, f'telescopio pata {k}', [(math.cos(a) * 0.45, math.sin(a) * 0.45, 0.0), (0, 0, 1.15)], 0.03, MAD(), seg=5)
    o = clay.lathe('telescopio tubo', [(0.0, 0.0), (0.09, 0.0), (0.12, 0.9), (0.15, 0.95), (0.0, 0.95)], coll, laca('tubo telescopio', '#3B6FB6'), segments=12,
                   subsurf=0)
    o.location = (0, 0.3, 0.95)
    o.rotation_euler = (-1.0, 0, 0)
    for z in (0.3, 0.6):
        aro = clay.lathe(f'telescopio aro {z}', [(0.1, z), (0.13, z), (0.13, z + 0.05), (0.1, z + 0.05)], coll, ORO(), segments=12, subsurf=0)
        aro.location = (0, 0.3, 0.95)
        aro.rotation_euler = (-1.0, 0, 0)


def m_flores_estrella(coll):
    for k in range(9):
        a = k * 2.4
        r = 0.15 + (k % 4) * 0.12
        x, y = math.cos(a) * r, math.sin(a) * r
        tubo(coll, f'flor tallo {k}', [(x, y, 0), (x * 1.1, y * 1.1, 0.22 + (k % 3) * 0.06)], 0.012, tela('tallo flor', '#4E8A6E'), seg=4)
        c = ('#FFE9A8', '#C9E8FF', '#F6C8FF')[k % 3]
        bola(coll, f'flor {k}', (x * 1.1, y * 1.1, 0.24 + (k % 3) * 0.06), (0.05, 0.05, 0.025), luz(f'flor estrella {c}', c, 2.2), n=2, sub=0)
    clay.blob('flores hojas', (0, 0, 0.04), (0.45, 0.4, 0.06), coll, MUSGO_CLARO(), n=4, shaper=ruido(2, 0.2, 5), subsurf=1)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Escudo mapa')
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
    exportar_glb.exportar(objs, os.path.join(out, 'escudo_mapa.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
