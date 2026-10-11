"""Nuestro Hogar · granja: el paisaje de las regiones de Astra (lo que rodea cada pueblo, por instancias).

Piezas livianas (pocas caras, sin subdivisión), base en z=0; el juego las reparte alrededor de la zona caminable:

  barca, poste_amarre                          Puerto de los Lirios (con el muelle, los juncos y el agua)
  arbol_niebla, hongo_gigante                  Brumaverde
  basalto, charco_lava, roca_volcanica         Brasaviva
  pino_nevado, roca_nevada                     Nieveclara
  atalaya, empalizada                          Vigilia
  cerezo, arco_rosas, rosal                    Verdia (Rosal Eterno y Jardines del Eco)
  pilar_hilos                                  Senda (la Travesía y el Refugio de los Hilos)
  cristal_oscuro, poste_cadena                 Nox (Bastión del Velo)
  roca_lunar, crater, antena, panel_solar,     la órbita, las lunas, los asteroides y los planetas
  invernadero_cupula
  pilar_elemental                              la Confluencia (el «cristal» lo tiñe el juego por elemento)

Un solo GLB: granja_astra_paisaje.glb.

Uso: blender -b -P granja_astra_paisaje.py -- <carpeta_salida> [claves]
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
from granja_festivales import flor  # noqa: E402
from granja_monte import grumo, tronco  # noqa: E402

RNG = np.random.default_rng(91)
NIEVE = lambda: mat('nieve', '#F4F7FA', 0.7)  # noqa: E731


def m_barca(coll):
    """Barquita de remos con su banca, dos remos adentro y una cuerda."""
    perfil = [(0.0, -1.3), (0.35, -1.2), (0.62, -0.6), (0.68, 0.0), (0.62, 0.6), (0.4, 1.15), (0.0, 1.35)]
    verts, caras = [], []
    n = len(perfil)
    for i, (r, y) in enumerate(perfil):
        for k in range(9):
            a = math.pi * k / 8
            verts.append((-math.cos(a) * r, y, 0.45 - math.sin(a) * r * 0.7))
    for i in range(n - 1):
        for k in range(8):
            a, b = i * 9 + k, i * 9 + k + 1
            caras.append((a, b, b + 9, a + 9))
    o = clay.make_mesh_object('casco barca', verts, caras, coll, material=madera('barca', '#4F79A8'))
    clay.add_solidify(o, 0.05)
    o.data.shade_smooth()
    tubo(coll, 'borda barca', [(-math.cos(0) * r, y, 0.45) for r, y in perfil] + [(math.cos(0) * r, y, 0.45) for r, y in reversed(perfil)], 0.04,
         madera('borda', '#F2EFE6'), seg=6)
    caja(coll, 'banca barca', (0, 0.1, 0.32), (0.6, 0.15, 0.03), madera('banca', '#C9956A'), p=8, sub=0)
    for s in (-1, 1):
        o = caja(coll, f'remo barca {s}', (0, 0, 0), (0.03, 0.9, 0.025), madera('remo', '#C9956A'), p=10, sub=0)
        o.location = (s * 0.3, -0.1, 0.25)
        o.rotation_euler = (0, 0, s * 0.12)
    clay.lathe('rollo cuerda barca', [(0.06, -0.03), (0.12, -0.03), (0.12, 0.03), (0.06, 0.03)], coll, mat('cuerda', '#E2C9A0', 0.85), segments=10,
               subsurf=0).location = (0, -0.8, 0.12)


def m_poste_amarre(coll):
    clay.lathe('poste amarre', [(0.0, 0.0), (0.15, 0.0), (0.14, 1.0), (0.17, 1.05), (0.0, 1.1)], coll, madera('pilote', '#7A5236'), segments=10, subsurf=0)
    for k in range(3):
        clay.lathe(f'vuelta cuerda {k}', [(0.15, -0.025), (0.18, 0.0), (0.15, 0.025)], coll, mat('cuerda', '#E2C9A0', 0.85), segments=10, subsurf=0, cap_bottom=False,
                   cap_top=False).location = (0, 0, 0.7 + k * 0.06)
    bola(coll, 'gaviota', (0, 0, 1.2), (0.12, 0.18, 0.09), tela('gaviota', '#F6F2EA'), n=3)
    bola(coll, 'cabeza gaviota', (0, -0.15, 1.3), 0.07, tela('gaviota', '#F6F2EA'), n=3)
    bola(coll, 'pico gaviota', (0, -0.23, 1.29), (0.02, 0.05, 0.02), mat('pico', '#F2C94C'), n=2, sub=0)
    for s in (-1, 1):
        bola(coll, f'ala gaviota {s}', (s * 0.11, 0.02, 1.22), (0.04, 0.15, 0.06), tela('ala gaviota', '#B9C2CC'), n=2, sub=0)


def m_arbol_niebla(coll):
    """Árbol gigante del bosque de niebla: tronco grueso con raíces que se arquean, musgo y copa ancha (≈7 m)."""
    clay.lathe('tronco niebla', [(0.0, 0.0), (0.95, 0.0), (0.7, 0.4), (0.55, 2.0), (0.48, 4.0), (0.35, 5.2), (0.0, 5.3)], coll, madera('corteza niebla', '#6B4E3A'),
               segments=10, subsurf=0)
    for k in range(6):
        a = k * math.pi / 3 + 0.3
        clay.sweep(f'raíz niebla {k}', [(math.cos(a) * 0.4, math.sin(a) * 0.4, 1.1), (math.cos(a) * 1.2, math.sin(a) * 1.2, 0.8), (math.cos(a) * 1.8, math.sin(a) * 1.8, 0.0)],
                   [0.32, 0.22, 0.12], coll=coll, material=madera('corteza niebla', '#6B4E3A'), segments=6, samples=3, caps=('flat', 'round'), subsurf=0)
    for k, (a, l, z) in enumerate(((0.4, 1.8, 3.8), (2.5, 1.6, 4.2), (4.4, 1.7, 4.0))):
        clay.sweep(f'rama niebla {k}', [(0, 0, z - 0.4), (math.cos(a) * l * 0.6, math.sin(a) * l * 0.6, z + 0.2), (math.cos(a) * l, math.sin(a) * l, z + 0.9)],
                   [0.22, 0.14, 0.07], coll=coll, material=madera('corteza niebla', '#6B4E3A'), segments=5, samples=2, caps=('flat', 'round'), subsurf=0)
    copas = [(0, 0, 6.0, 2.2), (1.5, -0.6, 5.3, 1.5), (-1.5, 0.4, 5.4, 1.6), (0.3, 1.5, 5.2, 1.4), (-0.4, -1.4, 5.5, 1.4), (0.2, 0.2, 7.0, 1.4)]
    for k, (x, y, z, r) in enumerate(copas):
        grumo(coll, f'copa niebla {k}', (x, y, z), (r, r, r * 0.8), (tela('copa niebla', '#4E7A45'), tela('copa niebla clara', '#6B9A55'))[k % 2], k * 1.9)
    for k in range(5):
        grumo(coll, f'musgo tronco {k}', (math.cos(k * 1.3) * 0.55, math.sin(k * 1.3) * 0.55, 0.8 + k * 0.7), (0.3, 0.3, 0.22), tela('musgo', '#8DB45E'), k)
    for k in range(4):
        tubo(coll, f'liana {k}', [(math.cos(k * 1.6) * 1.6, math.sin(k * 1.6) * 1.6, 5.0), (math.cos(k * 1.6) * 1.7, math.sin(k * 1.6) * 1.7, 3.6 - k * 0.3)], 0.04,
             tela('liana', '#6B9A55'), seg=4)


def m_hongo_gigante(coll):
    clay.lathe('pie hongo gigante', [(0.0, 0.0), (0.4, 0.0), (0.3, 0.3), (0.26, 1.4), (0.32, 1.55), (0.0, 1.6)], coll, mat('pie hongo', '#F0E6D2', 0.7), segments=12,
               subsurf=0)
    clay.lathe('sombrero hongo gigante', [(0.0, 1.45), (1.1, 1.45), (1.15, 1.55), (0.9, 1.95), (0.45, 2.15), (0.0, 2.2)], coll, laca('hongo azul', '#5A9BD5', 0.45),
               segments=16, subsurf=0)
    for k in range(7):
        a = k * 0.9
        rr = 0.35 + 0.35 * (k % 3) / 2
        bola(coll, f'punto hongo {k}', (math.cos(a) * rr, math.sin(a) * rr, 2.0 + 0.15 * (1 - rr)), (0.1, 0.1, 0.04), luz('punto hongo', '#DDF4FF', 1.2), n=2, sub=0)
    for k in range(3):
        a = k * 2.1
        clay.lathe(f'hongo chico {k}', [(0.0, 0.0), (0.08, 0.0), (0.07, 0.3), (0.0, 0.32)], coll, mat('pie hongo', '#F0E6D2', 0.7), segments=8,
                   subsurf=0).location = (math.cos(a) * 0.7, math.sin(a) * 0.7, 0)
        bola(coll, f'sombrero chico {k}', (math.cos(a) * 0.7, math.sin(a) * 0.7, 0.32), (0.2, 0.2, 0.1), laca('hongo azul', '#5A9BD5', 0.45), n=3, sub=0)


def m_basalto(coll):
    """Racimo de columnas hexagonales de basalto con vetas encendidas."""
    for k in range(8):
        a = k * 2.4
        r = 0.0 if k == 0 else 0.5 + 0.25 * (k % 3)
        h = 2.6 - r * 1.6 + 0.4 * ((k * 3) % 4) / 3
        x, y = math.cos(a) * r, math.sin(a) * r
        clay.lathe(f'columna {k}', [(0.0, 0.0), (0.32, 0.0), (0.32, h), (0.0, h)], coll, piedra('basalto', ('#3E3A3C', '#4A4547')[k % 2]), segments=6,
                   subsurf=0).location = (x, y, 0)
        if k % 3 == 0:
            caja(coll, f'veta {k}', (x + 0.3, y, h * 0.45), (0.03, 0.08, h * 0.3), luz('veta lava', '#FF7A2E', 2.0), p=10, sub=0)


def m_charco_lava(coll):
    """Charco de lava bajito con su borde de roca (no estorba)."""
    o = clay.lathe('lava', [(0.0, 0.02), (1.1, 0.02), (1.15, 0.0)], coll, luz('lava', '#FF6A2A', 2.2), segments=20, subsurf=0)
    o.scale = (1, 0.7, 1)
    for k in range(12):
        a = k * math.pi / 6
        clay.blob(f'borde lava {k}', (math.cos(a) * 1.2, math.sin(a) * 0.82, 0.06), (0.24, 0.2, 0.12), coll, piedra('basalto', '#3E3A3C'), n=3, subsurf=0)
    for k in range(4):
        bola(coll, f'burbuja {k}', (math.cos(k * 1.7) * 0.5, math.sin(k * 1.7) * 0.3, 0.04), 0.08, luz('burbuja lava', '#FFC75A', 3.0), n=2, sub=0)


def m_roca_volcanica(coll):
    clay.blob('roca volcánica', (0, 0, 0.7), (1.1, 0.9, 0.8), coll, piedra('volcánica', '#4A4040'), n=4, subsurf=0, p=2.4)
    clay.blob('roca volcánica b', (0.7, -0.4, 0.35), (0.5, 0.45, 0.4), coll, piedra('volcánica b', '#5A4E4A'), n=3, subsurf=0)
    caja(coll, 'grieta', (0.0, -0.85, 0.55), (0.3, 0.02, 0.04), luz('veta lava', '#FF7A2E', 2.0), p=10, sub=0)


def m_pino_nevado(coll):
    tronco(coll, 'tronco pino nevado', 1.4, 0.22, 0.11, raices=3)
    for i in range(4):
        r = 1.4 - i * 0.31
        z0 = 1.0 + i * 0.7
        clay.lathe(f'piso pino nevado {i}', [(0.0, z0), (r * 0.98, z0), (r, z0 + 0.06), (r * 0.55, z0 + 0.6), (r * 0.12, z0 + 1.18), (0.0, z0 + 1.26)], coll,
                   tela('pino nevado', ('#3F6B5D', '#4E7F6A')[i % 2]), segments=10, subsurf=0)
        clay.lathe(f'nieve pino {i}', [(0.0, z0 + 0.5), (r * 0.6, z0 + 0.5), (r * 0.62, z0 + 0.58), (r * 0.3, z0 + 0.95), (0.0, z0 + 1.15)], coll, NIEVE(), segments=10,
                   subsurf=0)
    bola(coll, 'punta nieve', (0, 0, 4.3), (0.14, 0.14, 0.18), NIEVE(), n=2, sub=0)
    bola(coll, 'nieve pie', (0, 0, 0.0), (1.2, 1.2, 0.18), NIEVE(), n=3, sub=0)


def m_roca_nevada(coll):
    clay.blob('roca nevada', (0, 0, 0.6), (0.95, 0.8, 0.7), coll, piedra('roca nevada', '#8A939C'), n=4, subsurf=0, p=2.2)
    clay.blob('nieve roca', (0, 0, 1.15), (0.85, 0.72, 0.25), coll, NIEVE(), n=4, subsurf=0)
    bola(coll, 'nieve pie roca', (0.4, -0.5, 0.02), (0.6, 0.45, 0.14), NIEVE(), n=3, sub=0)


def m_atalaya(coll):
    """Torre de vigía de madera con plataforma, techito, estandarte y escalera (≈6,5 m)."""
    m = madera('atalaya', '#6B4A3A')
    for sx in (-1, 1):
        for sy in (-1, 1):
            tubo(coll, f'pata atalaya {sx}{sy}', [(sx * 1.1, sy * 1.1, 0), (sx * 0.85, sy * 0.85, 4.2)], 0.1, m, seg=6)
    for z in (1.4, 2.8):
        for s in (-1, 1):
            caja(coll, f'travesaño x {z}{s}', (0, s * (1.1 - z * 0.06), z), (1.1 - z * 0.06, 0.05, 0.05), m, p=10, sub=0)
            caja(coll, f'travesaño y {z}{s}', (s * (1.1 - z * 0.06), 0, z), (0.05, 1.1 - z * 0.06, 0.05), m, p=10, sub=0)
    caja(coll, 'plataforma', (0, 0, 4.25), (1.2, 1.2, 0.08), madera('plataforma', '#8A6A4A'), p=8)
    for s in (-1, 1):
        caja(coll, f'baranda x {s}', (0, s * 1.15, 4.75), (1.2, 0.05, 0.42), madera('baranda', '#7A5A44'), p=8)
        caja(coll, f'baranda y {s}', (s * 1.15, 0, 4.75), (0.05, 1.2, 0.42), madera('baranda', '#7A5A44'), p=8)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cilindro(coll, f'poste techito {sx}{sy}', (sx * 1.1, sy * 1.1, 4.3), 0.05, 1.3, m, seg=6)
    clay.lathe('techito atalaya', [(0.0, 0.0), (1.75, 0.0), (1.5, 0.15), (0.0, 1.1)], coll, laca('techo vino', '#7A2A32', 0.5), segments=4, subsurf=0).location = (0, 0, 5.55)
    cilindro(coll, 'asta atalaya', (0, 0, 6.6), 0.03, 0.9, m, seg=6)
    caja(coll, 'banderín atalaya', (0.3, 0, 7.25), (0.3, 0.01, 0.16), tela('estandarte', '#6B2A32'), p=8, sub=0)
    for k in range(10):
        caja(coll, f'peldaño {k}', (0, -1.2 - k * 0.02, 0.35 + k * 0.4), (0.35, 0.04, 0.03), m, p=10, sub=0)
    for s in (-1, 1):
        tubo(coll, f'larguero escalera {s}', [(s * 0.35, -1.2, 0), (s * 0.35, -1.42, 4.2)], 0.035, m, seg=4)
    clay.blob('fuego atalaya', (0, 0, 4.55), (0.18, 0.18, 0.28), coll, luz('llama', '#FFB347', 4.0), n=3, p=1.6)
    clay.lathe('brasero', [(0.0, 0.0), (0.2, 0.0), (0.28, 0.2), (0.0, 0.18)], coll, metal('brasero', '#3E4A57'), segments=10, subsurf=0).location = (0, 0, 4.33)


def m_empalizada(coll):
    """Tramo de empalizada de 3 m (a lo largo de x) con estacas de punta y travesaño."""
    for k in range(10):
        x = -1.35 + k * 0.3
        h = 1.6 + 0.2 * ((k * 3) % 3) / 2
        clay.lathe(f'estaca {k}', [(0.0, 0.0), (0.14, 0.0), (0.14, h), (0.0, h + 0.32)], coll, madera('estaca', ('#7A5A44', '#6B4A3A')[k % 2]), segments=7,
                   subsurf=0).location = (x, 0, 0)
    for z in (0.5, 1.25):
        caja(coll, f'travesaño {z}', (0, 0.15, z), (1.5, 0.04, 0.07), madera('travesaño', '#5A3E30'), p=10, sub=0)


def m_cerezo(coll):
    """Árbol de flores pastel de Verdia (≈4,5 m), con pétalos en el suelo."""
    tronco(coll, 'tronco cerezo', 2.2, 0.24, 0.14)
    for k, (a, l, z) in enumerate(((0.6, 0.9, 1.9), (2.8, 0.8, 2.05), (4.6, 0.8, 2.2))):
        clay.sweep(f'rama cerezo {k}', [(0, 0, z - 0.3), (math.cos(a) * l * 0.6, math.sin(a) * l * 0.6, z), (math.cos(a) * l, math.sin(a) * l, z + 0.4)],
                   [0.08, 0.05, 0.03], coll=coll, material=madera('corteza monte', '#7A5338'), segments=5, samples=2, caps=('flat', 'round'), subsurf=0)
    copas = [(0, 0, 2.95, 1.3), (0.8, -0.3, 2.65, 0.9), (-0.75, 0.25, 2.7, 0.95), (0.15, 0.8, 2.6, 0.85), (-0.2, -0.2, 3.65, 0.85)]
    for k, (x, y, z, r) in enumerate(copas):
        grumo(coll, f'copa cerezo {k}', (x, y, z), (r, r, r * 0.88), (tela('copa cerezo', '#F4B6C8'), tela('copa cerezo clara', '#FAD3DF'))[k % 2], k * 1.7)
    for k in range(9):
        a = k * 0.8
        bola(coll, f'pétalo {k}', (math.cos(a) * (0.6 + k * 0.12), math.sin(a) * (0.6 + k * 0.12), 0.01), (0.06, 0.04, 0.006), tela('pétalo', '#F7C6D9'), n=2, sub=0)
    for k in range(3):
        clay.blob(f'luz alma {k}', (math.cos(k * 2.1) * 1.1, math.sin(k * 2.1) * 1.1, 2.0 + k * 0.3), (0.08, 0.08, 0.08), coll, luz('alma', '#FFF1D6', 2.4), n=3, p=2.0)


def m_arco_rosas(coll):
    """Arco de jardín blanco cubierto de rosas (paso de 1,8 m)."""
    blanco = laca('marco blanco', '#FBF6F0', 0.5)
    for s in (-1, 1):
        for y in (-0.2, 0.2):
            cilindro(coll, f'poste arco {s}{y}', (s * 0.95, y, 0), 0.05, 2.0, blanco, seg=8)
    pts = [(-0.95, 0, 2.0), (-0.7, 0, 2.55), (0, 0, 2.8), (0.7, 0, 2.55), (0.95, 0, 2.0)]
    for y in (-0.2, 0.2):
        tubo(coll, f'arco {y}', [(x, y, z) for x, _, z in pts], 0.05, blanco, seg=6)
    for k in range(14):
        t = k / 13
        a = math.pi * t
        x, z = -math.cos(a) * 0.95, 2.0 + math.sin(a) * 0.8 if 0.15 < t < 0.85 else 2.0
        if t <= 0.15 or t >= 0.85:
            x, z = (-0.95 if t <= 0.15 else 0.95), 0.4 + (t if t <= 0.15 else 1 - t) * 10
        grumo(coll, f'hojas arco {k}', (x, 0, z), (0.24, 0.3, 0.2), (tela('musgo', '#6E9A4A'), tela('musgo claro', '#8DB45E'))[k % 2], k)
        if k % 2 == 0:
            flor(coll, f'rosa arco {k}', (x, -0.28, z + 0.05), 0.1, ('#E58FA6', '#F6F1E6', '#F2A5C0')[k % 3], centro='#F2C94C', cara='y')


def m_rosal(coll):
    for k in range(5):
        a = k * 1.25
        grumo(coll, f'rosal {k}', (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.35 + (k % 2) * 0.15), (0.35, 0.35, 0.3), (tela('musgo', '#6E9A4A'), tela('musgo claro', '#8DB45E'))[k % 2], k)
    for k in range(8):
        a = k * 0.8
        flor(coll, f'rosa {k}', (math.cos(a) * 0.45, math.sin(a) * 0.45, 0.55 + (k % 3) * 0.12), 0.09, ('#E58FA6', '#F6F1E6', '#F2A5C0', '#C9A8E0')[k % 4],
             centro='#F2C94C')


def m_pilar_hilos(coll):
    """Pilar de piedra lila con cristal en la punta e hilos con farolitos colgando (≈3,5 m)."""
    clay.lathe('pilar', [(0.0, 0.0), (0.5, 0.0), (0.42, 0.3), (0.32, 2.6), (0.4, 2.8), (0.0, 2.85)], coll, piedra('pilar senda', '#B8A5CC'), segments=8, subsurf=0)
    for k in range(4):
        caja(coll, f'runa {k}', (math.cos(k * math.pi / 2) * 0.36, math.sin(k * math.pi / 2) * 0.36, 1.3 + k * 0.3), (0.06, 0.06, 0.12), luz('runa', '#E8D8FF', 1.4),
             p=10, sub=0)
    o = clay.lathe('cristal pilar', [(0.0, 0.0), (0.18, 0.0), (0.2, 0.5), (0.0, 0.85)], coll, luz('cristal senda', '#C9A8FF', 1.4), segments=6, subsurf=0)
    o.location = (0, 0, 2.85)
    for k in range(3):
        a = k * 2.1
        tubo(coll, f'hilo pilar {k}', [(0, 0, 2.7), (math.cos(a) * 0.9, math.sin(a) * 0.9, 2.2), (math.cos(a) * 1.4, math.sin(a) * 1.4, 1.7)], 0.012, mat('hilo', '#E8DCF0', 0.6),
             seg=3)
        clay.blob(f'farolito hilo {k}', (math.cos(a) * 1.4, math.sin(a) * 1.4, 1.55), (0.09, 0.09, 0.12), coll, luz('farolillo', '#FFE8C2', 2.0), n=3, p=2.0)


def m_cristal_oscuro(coll):
    """Racimo de cristales de Nox, oscuros por fuera y con brillo violeta (≈2,5 m)."""
    for i in range(7):
        a = i * 2 * math.pi / 7 + 0.2
        h = 1.2 + ((i * 5) % 4) * 0.4
        r = 0.25 + 0.05 * (i % 2)
        o = clay.lathe(f'cristal nox {i}', [(0.0, 0.0), (r, 0.0), (r * 1.05, h * 0.72), (0.0, h)], coll,
                       (mat('cristal nox oscuro', '#2C2A4E', 0.2), luz('cristal nox', '#9A7AE0', 1.2))[i % 2], segments=6, subsurf=0)
        d = 0.0 if i == 0 else 0.4
        o.location = (math.cos(a) * d, math.sin(a) * d, 0)
        o.rotation_euler = (math.sin(a) * 0.4 * (i > 0), -math.cos(a) * 0.4 * (i > 0), i * 0.6)
    for k in range(5):
        a = k * 1.3
        clay.blob(f'roca nox {k}', (math.cos(a) * 0.6, math.sin(a) * 0.55, 0.08), (0.26, 0.22, 0.14), coll, piedra('roca nox', '#3A3856'), n=3, subsurf=0)


def m_poste_cadena(coll):
    """Poste de contención con cadena hacia +x (los postes se ponen cada 2,5 m)."""
    acero = metal('acero nox', '#7D82A7')
    clay.lathe('poste nox', [(0.0, 0.0), (0.16, 0.0), (0.12, 0.15), (0.1, 1.2), (0.14, 1.28), (0.0, 1.35)], coll, acero, segments=8, subsurf=0)
    bola(coll, 'sello poste', (0, 0, 1.42), 0.09, luz('sello', '#9A7AE0', 1.4), n=2)
    for k in range(8):
        t = (k + 0.5) / 8
        z = 1.05 - 0.35 * math.sin(t * math.pi)
        o = clay.lathe(f'eslabón {k}', [(0.05, -0.012), (0.075, 0.0), (0.05, 0.012)], coll, metal('cadena', '#5D5A58'), segments=8, subsurf=0, cap_bottom=False,
                       cap_top=False)
        o.location = (0.15 + t * 2.2, 0, z)
        o.rotation_euler = (math.pi / 2 * (k % 2), 0, 0)
        o.scale = (1.4, 1, 1)


def m_roca_lunar(coll):
    clay.blob('roca lunar', (0, 0, 0.45), (0.85, 0.7, 0.55), coll, piedra('lunar', '#A9A7B0'), n=4, subsurf=0, p=2.3)
    clay.blob('roca lunar b', (0.6, -0.3, 0.22), (0.4, 0.35, 0.3), coll, piedra('lunar b', '#8E8C96'), n=3, subsurf=0)
    for k in range(3):
        o = clay.lathe(f'hoyito {k}', [(0.0, 0.0), (0.1, 0.0), (0.12, 0.02)], coll, piedra('lunar oscura', '#76747E'), segments=10, subsurf=0)
        o.location = (-0.3 + k * 0.3, -0.62, 0.45 + (k % 2) * 0.15)
        o.rotation_euler = (math.pi / 2 + 0.3, 0, 0)


def m_crater(coll):
    """Cráter bajito (anillo de borde, no estorba)."""
    clay.lathe('borde cráter', [(0.8, 0.0), (1.05, 0.16), (1.35, 0.05), (1.5, 0.0)], coll, piedra('lunar', '#A9A7B0'), segments=20, subsurf=0, cap_bottom=False,
               cap_top=False)
    clay.lathe('fondo cráter', [(0.0, -0.01), (0.82, -0.01), (0.85, 0.0)], coll, piedra('lunar oscura', '#86848E'), segments=20, subsurf=0)


def m_antena(coll):
    gris = metal('estructura', '#9AA3AD')
    for k in range(3):
        a = k * 2 * math.pi / 3
        tubo(coll, f'pata antena {k}', [(0, 0, 1.6), (math.cos(a) * 0.7, math.sin(a) * 0.7, 0)], 0.05, gris, seg=5)
    cilindro(coll, 'mástil', (0, 0, 1.4), 0.07, 1.2, gris, seg=8)
    o = clay.lathe('plato', [(0.0, 0.0), (0.3, 0.03), (0.8, 0.22), (1.0, 0.42), (0.95, 0.43), (0.0, 0.08)], coll, laca('plato', '#F2F4F7', 0.35), segments=20, subsurf=0)
    o.location = (0, 0, 2.6)
    o.rotation_euler = (0.7, 0, 0.6)
    bola(coll, 'luz antena', (0, 0, 2.75), 0.08, luz('luz roja', '#FF5A4A', 3.0), n=2)


def m_panel_solar(coll):
    gris = metal('estructura', '#9AA3AD')
    cilindro(coll, 'pie panel', (0, 0, 0), 0.07, 1.1, gris, seg=8)
    o = caja(coll, 'panel', (0, 0, 0), (1.1, 0.7, 0.04), laca('panel solar', '#2C3E66', 0.25), p=10, sub=0)
    o.location = (0, 0, 1.25)
    o.rotation_euler = (-0.5, 0, 0)
    for k in range(5):
        o = caja(coll, f'celda {k}', (-0.88 + k * 0.44, 0, 0.045), (0.012, 0.68, 0.01), gris, p=10, sub=0)
        o.location = (0, 0, 1.25)
        o.rotation_euler = (-0.5, 0, 0)
    o = caja(coll, 'marco panel', (0, 0, -0.02), (1.14, 0.74, 0.02), gris, p=10, sub=0)
    o.location = (0, 0, 1.25)
    o.rotation_euler = (-0.5, 0, 0)


def m_invernadero_cupula(coll):
    """Cúpula de vidrio con plantas y su anillo de metal (≈3 m de diámetro)."""
    gris = metal('estructura', '#9AA3AD')
    clay.lathe('base cúpula', [(0.0, 0.0), (1.55, 0.0), (1.55, 0.3), (0.0, 0.3)], coll, gris, segments=20, subsurf=0)
    clay.lathe('cúpula vidrio', [(0.0, 0.3), (1.5, 0.3), (1.4, 0.95), (1.05, 1.45), (0.55, 1.72), (0.0, 1.8)], coll, mat('cúpula vidrio', '#BFE3EC', 0.08, coat=0.8),
               segments=20, subsurf=0)
    for k in range(6):
        a = k * math.pi / 3
        tubo(coll, f'nervio cúpula {k}', [(math.cos(a) * 1.52, math.sin(a) * 1.52, 0.3), (math.cos(a) * 1.12, math.sin(a) * 1.12, 1.42), (0, 0, 1.82)], 0.03, gris, seg=4)
    for k in range(5):
        a = k * 1.3
        grumo(coll, f'planta cúpula {k}', (math.cos(a) * 0.7, math.sin(a) * 0.7, 0.65), (0.35, 0.35, 0.4), (tela('musgo', '#6E9A4A'), tela('musgo claro', '#8DB45E'))[k % 2], k)
    flor(coll, 'flor cúpula', (0, 0, 0.9), 0.15, '#F7D55A', centro='#E58B58')


def m_pilar_elemental(coll):
    """Pilar de piedra antigua con un cristal flotante («cristal», teñido por elemento) y anillos."""
    clay.lathe('pilar elemental', [(0.0, 0.0), (0.7, 0.0), (0.55, 0.35), (0.42, 2.2), (0.6, 2.4), (0.0, 2.45)], coll, piedra('pilar antiguo', '#C9BFA8'), segments=8,
               subsurf=0)
    for k in range(3):
        clay.lathe(f'anillo {k}', [(0.44, -0.04), (0.5, 0.0), (0.44, 0.04)], coll, metal('dorado', '#E5C574'), segments=10, subsurf=0, cap_bottom=False,
                   cap_top=False).location = (0, 0, 0.7 + k * 0.6)
    o = clay.lathe('cristal elemental', [(0.0, 0.0), (0.28, 0.25), (0.3, 0.55), (0.0, 1.1)], coll, mat('cristal', '#FFFFFF', 0.15), segments=6, subsurf=0)
    o.location = (0, 0, 2.75)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Astra paisaje')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_astra_paisaje.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
