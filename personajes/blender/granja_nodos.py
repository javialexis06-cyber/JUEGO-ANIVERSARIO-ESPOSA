"""Nuestro Hogar · granja: los nodos de las minas y aventuras (escenas-aventura.ts rocaNodo).

Tres rocas redonditas de plastilina con grietas y piedritas al pie (el juego escoge una por nodo), las pepitas de la
veta (para los metales, el carbón y las geodas) y el racimo de cristales (para las gemas). Las pepitas y los cristales
salen blancos: el juego los pinta con el color de cada mineral. Medidas de three.js (la roca mide ~1 de ancho). Cada
pieza queda bajo un vacío «m_<clave>» en granja_nodos.glb.

Uso: blender -b -P granja_nodos.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from granja_muebles import bola, mat, piedra, tubo  # noqa: E402

ROCA = lambda: piedra('nodo roca', '#8C847C')  # noqa: E731
ROCA_CLARA = lambda: piedra('nodo roca clara', '#A39A90')  # noqa: E731
GRIETA = lambda: mat('nodo grieta', '#4F4842', 0.95)  # noqa: E731


def C(x, y, z):
    return (x, -z, y)


def _roca(coll, semilla, lobulos):
    rng = np.random.default_rng(semilla)
    for k, ((x, y, z), r) in enumerate(lobulos):
        def forma(v, s=k):
            q = np.random.default_rng(semilla * 31 + s)
            v[:, 0] *= 1 + 0.06 * np.sin(v[:, 2] * 5 + q.uniform(0, 6))
            v[:, 1] *= 1 + 0.06 * np.sin(v[:, 0] * 4 + q.uniform(0, 6))
            return v
        clay.blob(f'lobulo {semilla} {k}', C(x, y, z), (r[0], r[2], r[1]), coll, ROCA() if k else ROCA_CLARA(), n=10, shaper=forma)
    # Grietas pintadas en la cara de adelante y arriba
    for k in range(3):
        a = rng.uniform(-0.6, 0.6)
        x0, y0 = rng.uniform(-0.2, 0.2), rng.uniform(0.25, 0.5)
        pts = [C(x0, y0, 0.42), C(x0 + math.sin(a) * 0.08, y0 - 0.08, 0.45), C(x0 + math.sin(a) * 0.05 + 0.04, y0 - 0.17, 0.44)]
        tubo(coll, f'grieta {semilla} {k}', pts, 0.012, GRIETA(), seg=4)
    # Piedritas al pie
    for k in range(5):
        a = rng.uniform(0, 2 * math.pi)
        d = rng.uniform(0.5, 0.65)
        bola(coll, f'piedrita {semilla} {k}', C(math.cos(a) * d, 0.04, math.sin(a) * d * 0.9), (0.07, 0.07, 0.05), ROCA_CLARA(), n=3, sub=0)


def m_nodo_roca_a(coll):
    _roca(coll, 1, [((0, 0.32, 0), (0.52, 0.36, 0.46)), ((0.3, 0.22, 0.18), (0.3, 0.24, 0.28)), ((-0.32, 0.18, -0.1), (0.26, 0.2, 0.26))])


def m_nodo_roca_b(coll):
    _roca(coll, 2, [((0, 0.36, 0), (0.46, 0.4, 0.44)), ((-0.28, 0.2, 0.2), (0.28, 0.22, 0.26)), ((0.34, 0.16, -0.16), (0.24, 0.18, 0.24)),
                    ((0.05, 0.62, -0.05), (0.22, 0.14, 0.2))])


def m_nodo_roca_c(coll):
    _roca(coll, 3, [((0.05, 0.28, 0), (0.56, 0.3, 0.48)), ((-0.25, 0.42, -0.08), (0.3, 0.26, 0.3)), ((0.32, 0.18, 0.24), (0.22, 0.18, 0.22))])


def m_nodo_pepitas(coll):
    """Pepitas redondeadas incrustadas en la roca (blancas: el juego les pone el color del mineral)."""
    veta = mat('nodo veta', '#FFFFFF', 0.35)
    rng = np.random.default_rng(9)
    for k in range(7):
        a = k * 2.399
        x, z = math.sin(a) * 0.36, math.cos(a) * 0.32
        y = 0.3 + (k % 3) * 0.12
        r = rng.uniform(0.08, 0.13)
        bola(coll, f'pepita {k}', C(x, y, z), (r, r * 0.85, r * 0.9), veta, n=2, sub=1)
        bola(coll, f'brillo pepita {k}', C(x - r * 0.3, y + r * 0.5, z + r * 0.4), (r * 0.25, r * 0.12, r * 0.18), mat('nodo brillo', '#FFFFFF', 0.1), n=2,
             sub=0)


def _cristal(coll, nombre, x, z, alto, r, inclinar, material):
    o = clay.lathe(nombre, [(0.0, 0.0), (r, 0.0), (r, alto * 0.75), (r * 0.55, alto * 0.9), (0.0, alto)], coll, material, segments=6, subsurf=0)
    o.location = C(x, 0.12, z)
    o.rotation_euler = (inclinar[0], inclinar[1], 0)


def m_nodo_cristales(coll):
    """Racimo de cristales de seis caras saliendo de la roca (blancos: el juego los pinta y los hace brillar)."""
    cr = mat('nodo cristal', '#FFFFFF', 0.15, coat=0.8)
    for k, (x, z, alto, r, ix, iy) in enumerate([(0.0, 0.05, 0.95, 0.12, 0.0, 0.0), (0.22, 0.1, 0.7, 0.1, 0.2, 0.35), (-0.24, 0.12, 0.75, 0.1, -0.15, -0.4),
                                                 (0.12, -0.2, 0.55, 0.08, -0.35, 0.2), (-0.1, 0.32, 0.5, 0.08, 0.4, -0.1)]):
        _cristal(coll, f'cristal {k}', x, z, alto, r, (ix, iy), cr)
    for k in range(4):
        a = k * 1.7
        _cristal(coll, f'cristalito {k}', math.cos(a) * 0.45, math.sin(a) * 0.38, 0.28, 0.05, (math.sin(a) * 0.5, math.cos(a) * 0.5), cr)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Nodos granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_nodos.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
