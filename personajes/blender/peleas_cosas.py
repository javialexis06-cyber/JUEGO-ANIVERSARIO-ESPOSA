"""Nuestro Hogar · El Torneo del Despertar Dorado (peleas): las cosas que vuelan en la pelea, de fieltro, laca y
plastilina, centradas en el origen (lo que vuela, con el centro en el origen y avanzando hacia +x):

  corazon      el «muak volador» de Javier: corazón de fieltro rosado con brillo y alitas
  chispa       la chispa del alba de Eliana: estrella dorada de puntas redondas con un sol adentro
  estrella     estrella fugaz (el retador) y lo de Laura: estrella amarilla con cola de chispitas
  lirio        un lirio del ocaso (la lluvia de Serena): flor lila de seis pétalos
  murcielago   un murcielaguito de fieltro (el banquete del Conde)
  porcelana    un pedazo de porcelana con grieta dorada (el laberinto de Vael'Thor)
  jarron       el jarrón de sombras de Vael'Thor (trampa, base en z=0)
  bola_nieve   bola de nieve (lo de Otto)
  llama        llamita de fuego (el dragón)
  ola          la avalancha de Otto: una ola de nieve con bloques de hielo (base en z=0, avanza a +x)

Un solo GLB (peleas/cosas.glb), un vacío «m_<clave>» por cosa. Uso: blender -b -P peleas_cosas.py -- <carpeta>
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import corazon_plano, laca, luz, tela  # noqa: E402
from granja_muebles import bola, caja, mat, tubo  # noqa: E402
import granja_festivales as fest  # noqa: E402

RNG = np.random.default_rng(5)


def m_corazon(coll):
    corazon_plano('corazón', (0, 0, -0.18), 0.42, coll, tela('corazón muak', '#FF5A8A'), grosor=0.42, eje='y')
    bola(coll, 'brillo corazón', (-0.1, -0.12, 0.08), (0.07, 0.03, 0.05), laca('brillo corazón', '#FFFFFF', 0.2), n=3, sub=0)
    for s in (-1, 1):
        o = clay.blob(f'alita {s}', (-0.05, s * 0.18, 0.12), (0.16, 0.04, 0.09), coll, tela('alita', '#FFF4F8'), n=3, subsurf=0)
        o.rotation_euler = (s * 0.5, 0, 0)


def _estrella(coll, nombre, r, material, grosor=0.12, puntas=5):
    fest.estrella(coll, nombre, (0, 0, 0), r, material, t=grosor, puntas=puntas)


def m_chispa(coll):
    _estrella(coll, 'chispa del alba', 0.34, laca('chispa dorada', '#FFD24A', 0.25), 0.14, puntas=8)
    bola(coll, 'centro chispa', (0, -0.06, 0), 0.13, luz('centro chispa', '#FFF4B0', 5.0), n=3, sub=0)


def m_estrella(coll):
    _estrella(coll, 'estrella fugaz', 0.3, laca('estrella fugaz', '#FFE066', 0.25), 0.14)
    for s in (-1, 1):
        bola(coll, f'ojo estrella {s}', (s * 0.06, -0.08, 0.03), (0.025, 0.012, 0.035), laca('ojo estrella', '#4A2716'), n=2, sub=0)
    for k in range(5):
        bola(coll, f'cola estrella {k}', (-0.35 - k * 0.15, 0, (RNG.random() - 0.5) * 0.12), 0.08 - k * 0.012, luz('cola estrella', '#FFF0A0', 3.0), n=2, sub=0)


def m_lirio(coll):
    lila = tela('pétalo lirio', '#C9A8FF')
    for k in range(6):
        a = k / 6 * math.tau
        o = clay.blob(f'pétalo {k}', (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.0), (0.2, 0.08, 0.035), coll, lila, n=3, subsurf=0)
        o.rotation_euler = (0, 0.4, a)
    bola(coll, 'centro lirio', (0, 0, 0.04), 0.07, tela('centro lirio', '#FFE08A'), n=3, sub=0)
    tubo(coll, 'tallo lirio', [(0, 0, -0.02), (0.05, 0.02, -0.3)], 0.018, tela('tallo lirio', '#6FA850'), seg=5)


def m_murcielago(coll):
    negro = tela('murciélago', '#2A1A2E')
    bola(coll, 'cuerpo murciélago', (0, 0, 0), (0.14, 0.12, 0.13), negro, n=4, sub=0)
    for s in (-1, 1):
        bola(coll, f'oreja {s}', (s * 0.07, 0, 0.14), (0.04, 0.03, 0.06), negro, n=2, sub=0)
        bola(coll, f'ojo {s}', (s * 0.05, -0.11, 0.03), (0.03, 0.015, 0.035), luz('ojo murciélago', '#FF4A5A', 3.0), n=2, sub=0)
        for k in range(3):
            o = clay.blob(f'ala {s} {k}', (s * (0.18 + k * 0.1), 0.0, 0.03 - k * 0.025), (0.08, 0.02, 0.07), coll, tela('ala murciélago', '#3D2440'), n=3, subsurf=0)
            o.rotation_euler = (0, s * 0.3, 0)
    bola(coll, 'colmillo', (0, -0.12, -0.04), (0.012, 0.01, 0.02), laca('colmillo', '#FFFFFF'), n=2, sub=0)


def m_porcelana(coll):
    blanco = laca('porcelana', '#F4EFE6', 0.2)
    caja(coll, 'pedazo porcelana', (0, 0, 0), (0.22, 0.05, 0.3), blanco, p=4, sub=0).rotation_euler = (0, 0.3, 0.2)
    tubo(coll, 'grieta dorada', [(-0.1, -0.06, 0.2), (0.02, -0.07, 0.02), (-0.05, -0.07, -0.12), (0.08, -0.07, -0.25)], 0.012, laca('grieta oro', '#E0C46A', 0.2), seg=4)
    bola(coll, 'ojo sombra', (0.04, -0.06, 0.08), (0.04, 0.01, 0.05), luz('ojo sombra', '#B07CFF', 3.0), n=2, sub=0)


def m_jarron(coll):
    o = clay.lathe('jarrón', [(0.0, 0.0), (0.14, 0.0), (0.24, 0.12), (0.27, 0.3), (0.16, 0.5), (0.1, 0.56), (0.14, 0.62), (0.0, 0.62)], coll, laca('jarrón porcelana', '#F4EFE6', 0.2), segments=18, subsurf=1)
    for k in range(6):
        a = k / 6 * math.tau
        tubo(coll, f'adorno jarrón {k}', [(math.cos(a) * 0.27, math.sin(a) * 0.27, 0.22), (math.cos(a + 0.4) * 0.27, math.sin(a + 0.4) * 0.27, 0.36)], 0.02, laca('adorno morado', '#6B3A9A', 0.3), seg=4)
    tubo(coll, 'grieta jarrón', [(0.1, -0.25, 0.45), (0.0, -0.27, 0.3), (0.08, -0.26, 0.15)], 0.012, laca('grieta oro', '#E0C46A', 0.2), seg=4)
    bola(coll, 'sombra jarrón', (0, 0, 0.6), (0.1, 0.1, 0.06), luz('sombra jarrón', '#9A5AD8', 3.0), n=3, sub=0)
    del o


def m_bola_nieve(coll):
    bola(coll, 'bola nieve', (0, 0, 0), 0.28, mat('bola nieve', '#F4F8FC', 0.7), n=4, sub=0)
    for k in range(5):
        a = k * 1.3
        bola(coll, f'grumo nieve {k}', (math.cos(a) * 0.22, math.sin(a) * 0.22 - 0.05, math.sin(a * 2) * 0.12), 0.1, mat('bola nieve', '#F4F8FC', 0.7), n=2, sub=0)


def m_llama(coll):
    def gota(v):
        z = v[:, 2]
        k = np.clip((z + 1) / 2, 0, 1)
        v = v.copy()
        v[:, 0] *= 1 - k * 0.7
        v[:, 1] *= 1 - k * 0.7
        return v
    for i, (r, c, f) in enumerate([(0.26, '#FF7A2A', 4.0), (0.18, '#FFB347', 6.0), (0.1, '#FFF0A0', 8.0)]):
        clay.blob(f'llamita {i}', (0, -i * 0.03, 0.0), (r, r, r * 1.6), coll, luz(f'llamita {i}', c, f), n=3, subsurf=0, shaper=gota)


def m_ola(coll):
    """La avalancha: una ola de nieve que rompe hacia +x, con bloques de hielo y copos."""
    nieve = mat('ola nieve', '#F4F8FC', 0.7)
    for k in range(12):
        x = -0.9 + k * 0.16
        h = 0.3 + math.sin(k / 11 * math.pi) * 0.9
        bola(coll, f'ola {k}', (x, (RNG.random() - 0.5) * 0.4, h * 0.5), (0.35, 0.45, h * 0.55), nieve, n=3, sub=0)
    bola(coll, 'cresta', (0.55, 0, 1.05), (0.38, 0.42, 0.22), nieve, n=3, sub=0)
    for k in range(5):
        caja(coll, f'bloque hielo {k}', (-0.6 + k * 0.32, -0.35 + (k % 2) * 0.6, 0.15 + (k % 3) * 0.2), (0.12, 0.12, 0.12), mat('bloque hielo', '#BFE4F7', 0.1, coat=0.8), p=4, sub=0).rotation_euler = (k, k * 0.7, k * 0.3)
    for k in range(4):
        bola(coll, f'ojo ola {k}', (0.75, -0.42 + k * 0.0, 0.85), 0.0001, nieve, n=1, sub=0)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v)}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Cosas peleas')
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
    import exportar_glb
    objs = []
    for r in raices:
        objs.extend(exportar_glb.arbol(r))
    exportar_glb.exportar(objs, os.path.join(out, 'cosas.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
