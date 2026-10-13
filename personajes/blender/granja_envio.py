"""Nuestro Hogar · granja: la caja de envíos y la casita de los compañeros con su cuenco.

envios-render.ts (cajaEnvioVista): el cajón de tablas con patas, herrajes, la etiqueta con su sello, la tapa aparte
(con la bisagra atrás, en su origen, para que el juego la abra) y la banderita (el juego la sube cuando hay carga).
compania-render.ts (hogarMascotaVista): la casita de madera con techo de tablas, el cojín, la cobijita, y el cuenco
de barro con huellitas pintadas y el agua aparte (sale solo si está lleno).

Medidas de three.js de esos archivos. Cada pieza queda bajo un vacío «m_<clave>» en granja_envio.glb.

Uso: blender -b -P granja_envio.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
from regalos import madera, tela  # noqa: E402
from granja_muebles import bola, caja, mat, metal, tubo  # noqa: E402

MAD = lambda: madera('envio madera', '#B18A5F')  # noqa: E731
MAD_CLARA = lambda: madera('envio madera clara', '#C79E70')  # noqa: E731
MAD_OSC = lambda: madera('envio madera oscura', '#6E5940')  # noqa: E731
HERRAJE = lambda: metal('envio herraje', '#6F7F7A')  # noqa: E731


def C(x, y, z):
    return (x, -z, y)


def H(w, h, d):
    return (w / 2, d / 2, h / 2)


def bloque(coll, nombre, medidas, centro, material, p=8, sub=1):
    return caja(coll, nombre, C(*centro), H(*medidas), material, p=p, sub=sub)


def girado(coll, nombre, medidas, centro, material, giro_z, p=8, sub=1):
    """Un bloque girado sobre el eje z de three.js (se construye en el origen y después se mueve: la trampa)."""
    o = caja(coll, nombre, (0, 0, 0), H(*medidas), material, p=p, sub=sub)
    o.location = C(*centro)
    o.rotation_euler = (0, -giro_z, 0)
    return o


def palo(coll, nombre, a, b, r, material, seg=6):
    return tubo(coll, nombre, [C(*a), C(*b)], r, material, seg=seg)


def m_envio_caja(coll):
    for x in (-0.36, 0.36):
        for z in (-0.32, 0.32):
            bloque(coll, f'pata {x}{z}', (0.13, 0.13, 0.13), (x, 0.08, z), MAD_OSC(), p=6)
    bloque(coll, 'fondo', (0.82, 0.08, 0.72), (0, 0.17, 0), MAD(), p=8)
    for fila in range(3):
        m = MAD_CLARA() if fila % 2 else MAD()
        for z in (-0.355, 0.355):
            bloque(coll, f'tabla z {fila}{z}', (0.86, 0.145, 0.05), (0, 0.29 + fila * 0.155, z), m, p=8)
        for x in (-0.42, 0.42):
            bloque(coll, f'tabla x {fila}{x}', (0.05, 0.145, 0.7), (x, 0.29 + fila * 0.155, 0), m, p=8)
    for x in (-0.28, 0.28):
        bloque(coll, f'zuncho {x}', (0.06, 0.5, 0.79), (x, 0.43, 0), HERRAJE(), p=8, sub=0)
        for y in (0.25, 0.59):
            bola(coll, f'remache {x}{y}', C(x, y, 0.4), (0.018, 0.012, 0.018), metal('envio remache', '#C9C2AC'), n=2, sub=0)
    # La etiqueta de envío con su sello de hojita
    bloque(coll, 'etiqueta', (0.32, 0.18, 0.02), (0, 0.45, 0.4), mat('envio etiqueta', '#F2E3B7', 0.7), p=8)
    for lado in (-1, 1):
        girado(coll, f'sello {lado}', (0.14, 0.014, 0.01), (lado * 0.05, 0.47, 0.413), mat('envio sello', '#78917C', 0.6), lado * 0.45, p=10, sub=0)
    bloque(coll, 'renglon', (0.2, 0.012, 0.006), (0, 0.41, 0.412), mat('envio tinta', '#8A7A62', 0.8), p=10, sub=0)
    # El palito de la banderita y una cuerda enrollada al lado
    palo(coll, 'asta', (0.47, 0.42, 0), (0.47, 0.83, 0), 0.014, HERRAJE())
    o = clay.lathe('rollo cuerda', [(0.06, -0.025), (0.08, 0.0), (0.06, 0.025)], coll, tela('envio cuerda', '#C9AE7A'), segments=14, subsurf=1,
                   cap_bottom=False, cap_top=False)
    o.location = C(-0.47, 0.32, 0.15)
    o.rotation_euler = (0, math.pi / 2, 0)


def m_envio_tapa(coll):
    """La tapa: origen en la bisagra de atrás; las tablas van hacia adelante (z de 0 a 0,78)."""
    for i in range(5):
        bloque(coll, f'tabla tapa {i}', (0.175, 0.075, 0.78), (-0.36 + i * 0.18, 0.03, 0.38), MAD_CLARA() if i % 2 else MAD(), p=8)
    for x in (-0.28, 0.28):
        bloque(coll, f'zuncho tapa {x}', (0.06, 0.016, 0.79), (x, 0.075, 0.38), HERRAJE(), p=8, sub=0)
    bloque(coll, 'agarradera', (0.2, 0.04, 0.05), (0, 0.06, 0.8), MAD_OSC(), p=8)
    for x in (-0.3, 0.3):
        palo(coll, f'bisagra {x}', (x - 0.06, 0.0, 0.0), (x + 0.06, 0.0, 0.0), 0.02, HERRAJE())


def m_envio_bandera(coll):
    """La banderita (el juego la sube cuando la caja tiene carga). Origen en el palito."""
    bloque(coll, 'bandera', (0.14, 0.1, 0.02), (0.07, 0, 0), tela('envio bandera', '#E86A5A'), p=6)
    bola(coll, 'estrellita', C(0.07, 0, 0.012), (0.025, 0.004, 0.025), mat('envio estrellita', '#F7D046', 0.5), n=2, sub=0)


def m_mascota_casita(coll):
    piso = mat('casita piso', '#B09A7D', 0.85)
    bloque(coll, 'base', (1.45, 0.12, 1.35), (0, 0.06, -0.08), piso, p=8)
    bloque(coll, 'cojin', (1.2, 0.14, 0.95), (0, 0.2, -0.1), tela('casita cojin', '#A2B69A'), p=4)
    for k in range(4):
        bola(coll, f'boton cojin {k}', C(-0.36 + k * 0.24, 0.27, -0.1), (0.025, 0.025, 0.012), tela('casita boton', '#7E9478'), n=2, sub=0)
    bloque(coll, 'cobijita', (0.5, 0.06, 0.38), (-0.27, 0.3, -0.36), tela('casita cobija', '#E8C9A0'), p=4)
    pared = MAD_CLARA()
    for x in (-0.7, 0.7):
        bloque(coll, f'pared {x}', (0.1, 0.52, 1.3), (x, 0.28, -0.08), pared, p=8)
    bloque(coll, 'pared fondo', (1.5, 0.5, 0.1), (0, 0.27, -0.72), pared, p=8)
    for x in (-0.72, 0.72):
        for z in (-0.73, 0.49):
            bloque(coll, f'poste {x}{z}', (0.08, 1.1, 0.08), (x, 0.55, z), MAD_OSC(), p=8)
    for s in (-1, 1):
        girado(coll, f'techo {s}', (0.95, 0.1, 1.62), (s * 0.37, 1.14, -0.08), mat('casita techo', '#92A7A2', 0.7), -s * 0.22, p=8)
        for i in range(8):
            girado(coll, f'teja {s} {i}', (0.95, 0.02, 0.05), (s * 0.37, 1.2, -0.79 + i * 0.2), mat('casita teja', '#C7D2BD', 0.7), -s * 0.22, p=10, sub=0)
    bloque(coll, 'cumbrera', (0.08, 0.08, 1.64), (0, 1.26, -0.08), MAD(), p=8)
    # El letrerito con la huella
    bloque(coll, 'letrero', (0.4, 0.16, 0.03), (0, 0.88, 0.5), MAD(), p=8)
    for k, (x, y, r) in enumerate(((0, 0.86, 0.03), (-0.045, 0.91, 0.014), (-0.015, 0.925, 0.014), (0.015, 0.925, 0.014), (0.045, 0.91, 0.014))):
        bola(coll, f'huella {k}', C(x, y, 0.517), (r, 0.004, r), mat('casita huella', '#6E5940', 0.8), n=2, sub=0)


def m_mascota_cuenco(coll):
    barro = mat('cuenco barro', '#C47F5A', 0.6)
    o = clay.lathe('cuenco', [(0.0, 0.0), (0.17, 0.0), (0.24, 0.1), (0.27, 0.12), (0.25, 0.14), (0.2, 0.06), (0.0, 0.06)], coll, barro, segments=24,
                   subsurf=1, cap_bottom=True, cap_top=True)
    o.location = (0, 0, 0)
    for k in range(4):
        a = k * math.pi / 2 + 0.4
        bola(coll, f'huellita {k}', (math.cos(a) * 0.235, math.sin(a) * 0.235, 0.09), (0.03, 0.03, 0.02), mat('cuenco huella', '#F2E3C7', 0.7), n=2, sub=0)


def m_mascota_agua(coll):
    o = clay.lathe('agua', [(0.0, 0.0), (0.2, 0.0)], coll, mat('cuenco agua', '#8DC6CC', 0.15), segments=24, subsurf=0, cap_bottom=False, cap_top=False)
    o.location = (0, 0, 0.115)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Envio granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_envio.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
