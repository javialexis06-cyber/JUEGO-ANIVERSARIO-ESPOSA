"""Nuestro Hogar · El Escudo de las Hermanas: la ceniza de Nath'Gora (los enemigos), de fieltro y plastilina, con
caras exageradas y graciosas. Todos de pie en el origen, mirando al frente (-y en Blender = hacia la cámara).

  mota          bolita de ceniza peluda con ojos bravos y paticas
  sombra        sombra veloz: gota encapuchada que corre con los brazos para atrás
  golem         gólem de ceniza blindado: bloque de roca con placas de piedra y grietas de brasa
  polilla       polilla de ceniza (vuela); sus alas van aparte: polilla_ala (la izquierda; el juego la refleja)
  divisora      la brasa partida: una bola grande con tres motas pegadas que se sueltan al romperla
  jefe          la sombra de Nath'Gora: capa enorme, corona de estrella muerta, cara de máscara y garras

Un solo GLB: escudo_enemigos.glb.   Uso: blender -b -P escudo_enemigos.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import laca, luz, tela  # noqa: E402
from granja_muebles import bola, caja, piedra, tubo  # noqa: E402
from tiendas import _mat  # noqa: E402

CENIZA = lambda: tela('ceniza fieltro', '#6A6372')  # noqa: E731
CENIZA_OSC = lambda: tela('ceniza oscura', '#3E3846')  # noqa: E731
NEGRO = lambda: laca('pupila', '#151218', 0.3)  # noqa: E731
BLANCO = lambda: laca('ojo blanco', '#FBF8F2', 0.3)  # noqa: E731
BRASA = lambda: luz('brasa enemigo', '#FF7A2A', 3.5)  # noqa: E731
MORADO = lambda: luz('brasa morada', '#B05CFF', 3.0)  # noqa: E731


def ruido(semilla, amp=0.12, f=2.3):
    def s(v):
        n = 1 + amp * np.sin(v[:, 0] * f + semilla) * np.sin(v[:, 1] * f * 1.1 + semilla * 1.7) * np.sin(v[:, 2] * f * 0.9 + semilla * 0.6)
        return v * n[:, None]
    return s


def ojos(coll, nombre, x, y, z, r, bravo=0.35, brillo=None):
    """Dos ojos grandes de laca con pupila y ceja brava (o dos ojos que brillan si `brillo`)."""
    for s in (-1, 1):
        if brillo:
            bola(coll, f'{nombre} ojo {s}', (x + s * r * 1.15, y, z), (r, r * 0.4, r * 0.8), luz(f'ojo {brillo}', brillo, 5.0), n=3, sub=0)
            continue
        bola(coll, f'{nombre} ojo {s}', (x + s * r * 1.15, y, z), (r, r * 0.55, r * 1.05), BLANCO(), n=3)
        bola(coll, f'{nombre} pupila {s}', (x + s * r * 0.95, y - r * 0.45, z - r * 0.1), (r * 0.48, r * 0.2, r * 0.55), NEGRO(), n=2, sub=0)
        bola(coll, f'{nombre} brillo {s}', (x + s * r * 0.8, y - r * 0.6, z + r * 0.15), r * 0.14, BLANCO(), n=2, sub=0)
        o = clay.sweep(f'{nombre} ceja {s}', [(x + s * r * 0.3, y - r * 0.3, z + r * (1.05 - bravo)), (x + s * r * 1.9, y - r * 0.3, z + r * (1.05 + bravo))],
                       r * 0.18, coll=coll, material=NEGRO(), segments=6, samples=2, subsurf=0)
        del o


def boca(coll, nombre, x, y, z, ancho, abierta=False):
    if abierta:
        bola(coll, f'{nombre} boca', (x, y, z), (ancho * 0.5, ancho * 0.2, ancho * 0.32), laca('boca', '#3A1420'), n=3, sub=0)
        for s in (-1, 1):
            clay.sweep(f'{nombre} colmillo {s}', [(x + s * ancho * 0.22, y - ancho * 0.12, z + ancho * 0.25), (x + s * ancho * 0.2, y - ancho * 0.14, z + ancho * 0.05)],
                       [ancho * 0.07, 0.003], coll=coll, material=BLANCO(), segments=5, samples=2, caps=('flat', 'point'), subsurf=0)
    else:
        clay.sweep(f'{nombre} boca', [(x - ancho * 0.5, y, z + ancho * 0.08), (x, y - ancho * 0.05, z - ancho * 0.06), (x + ancho * 0.5, y, z + ancho * 0.08)],
                   ancho * 0.07, coll=coll, material=NEGRO(), segments=5, samples=3, subsurf=0)


def m_mota(coll):
    clay.blob('mota cuerpo', (0, 0, 0.36), (0.34, 0.32, 0.32), coll, CENIZA(), n=6, shaper=ruido(1, 0.08, 9), subsurf=1)
    for k in range(10):
        a = k * 2.4
        z = 0.2 + (k % 4) * 0.12
        bola(coll, f'mota pelo {k}', (math.cos(a) * 0.3, math.sin(a) * 0.28, z + 0.05), (0.09, 0.09, 0.07), CENIZA_OSC() if k % 2 else CENIZA(), n=2, sub=0)
    for k in range(5):
        a = k * 1.7 + 0.3
        bola(coll, f'mota chispa {k}', (math.cos(a) * 0.27, math.sin(a) * 0.25 + 0.05, 0.46 + (k % 3) * 0.08), 0.035, BRASA(), n=2, sub=0)
    ojos(coll, 'mota', 0, -0.27, 0.44, 0.09)
    boca(coll, 'mota', 0, -0.3, 0.27, 0.16, abierta=True)
    for s in (-1, 1):
        bola(coll, f'mota pata {s}', (s * 0.14, -0.04, 0.05), (0.09, 0.12, 0.06), CENIZA_OSC(), n=3)
    clay.sweep('mota copete', [(0, 0.0, 0.66), (0.05, 0.02, 0.8), (-0.02, 0.06, 0.88)], [0.06, 0.04, 0.01], coll=coll, material=CENIZA_OSC(), segments=6, samples=3,
               caps=('round', 'point'), subsurf=0)


def m_sombra(coll):
    oscura = tela('sombra fieltro', '#2E2840')
    # Cuerpo de gota inclinado hacia adelante (va corriendo)
    clay.sweep('sombra cuerpo', [(0, 0.25, 0.25), (0, 0.05, 0.6), (0, -0.05, 0.95), (0, 0.12, 1.2)], [0.26, 0.3, 0.26, 0.04], coll=coll, material=oscura,
               segments=10, samples=4, caps=('round', 'point'), subsurf=1)
    clay.sweep('sombra cola', [(0, 0.25, 0.3), (0, 0.55, 0.25), (0.08, 0.8, 0.35)], [0.16, 0.08, 0.01], coll=coll, material=oscura, segments=6, samples=3,
               caps=('round', 'point'), subsurf=0)
    # Capucha
    clay.blob('sombra capucha', (0, 0.0, 0.92), (0.27, 0.27, 0.25), coll, tela('capucha sombra', '#1E1A2A'), n=4, subsurf=1)
    bola(coll, 'sombra cara', (0, -0.18, 0.88), (0.19, 0.08, 0.15), laca('cara sombra', '#0E0B14'), n=3)
    for s in (-1, 1):
        bola(coll, f'sombra ojo {s}', (s * 0.08, -0.25, 0.9), (0.055, 0.02, 0.04), luz('ojo sombra', '#FFE14A', 6.0), n=2, sub=0)
        tubo(coll, f'sombra brazo {s}', [(s * 0.2, 0.0, 0.75), (s * 0.3, 0.2, 0.55), (s * 0.28, 0.42, 0.5)], 0.05, oscura, seg=5)
        tubo(coll, f'sombra pierna {s}', [(s * 0.1, 0.1, 0.35), (s * 0.12, -0.12 if s > 0 else 0.25, 0.12), (s * 0.12, -0.2 if s > 0 else 0.35, 0.03)], 0.06, oscura,
             seg=5)
    for k in range(4):
        bola(coll, f'sombra estela {k}', (0.05 * (k % 2), 0.6 + k * 0.15, 0.4 + k * 0.05), 0.06 - k * 0.012, MORADO(), n=2, sub=0)


def m_golem(coll):
    roca = piedra('golem roca', '#5A5360')
    placa = piedra('golem placa', '#9C96A6')
    clay.rbox('golem cuerpo', (0, 0, 0.8), (0.48, 0.38, 0.45), coll, roca, p=3.5, n=5, subsurf=1)
    clay.rbox('golem cabeza', (0, -0.08, 1.38), (0.24, 0.22, 0.2), coll, roca, p=3.5, n=4, subsurf=1)
    # Placas de armadura (escudo de piedra) en el pecho, hombros y casco
    clay.rbox('golem peto', (0, -0.36, 0.86), (0.36, 0.06, 0.3), coll, placa, p=4, n=4, subsurf=1)
    for s in (-1, 1):
        clay.blob(f'golem hombrera {s}', (s * 0.52, 0.0, 1.15), (0.26, 0.26, 0.17), coll, placa, n=4, subsurf=1)
        clay.rbox(f'golem brazo {s}', (s * 0.62, -0.05, 0.75), (0.15, 0.15, 0.3), coll, roca, p=3.5, n=3, subsurf=1)
        clay.blob(f'golem puño {s}', (s * 0.65, -0.12, 0.38), (0.22, 0.22, 0.2), coll, roca, n=4, shaper=ruido(s, 0.1, 6), subsurf=1)
        clay.rbox(f'golem pierna {s}', (s * 0.22, 0.0, 0.2), (0.16, 0.17, 0.2), coll, roca, p=3.5, n=3, subsurf=1)
    clay.rbox('golem casco', (0, -0.1, 1.55), (0.26, 0.24, 0.07), coll, placa, p=4, n=4, subsurf=1)
    # Grietas de brasa
    for k, (x, z) in enumerate(((-0.3, 0.55), (0.25, 0.6), (-0.1, 1.0), (0.38, 1.0), (-0.42, 0.95))):
        clay.sweep(f'golem grieta {k}', [(x, -0.4, z), (x + 0.06, -0.41, z - 0.1), (x + 0.02, -0.41, z - 0.2)], 0.02, coll=coll, material=BRASA(), segments=4,
                   samples=2, subsurf=0)
    bola(coll, 'golem nucleo', (0, -0.43, 0.88), (0.08, 0.03, 0.08), luz('núcleo golem', '#FF9A3A', 5.0), n=2, sub=0)
    for s in (-1, 1):
        bola(coll, f'golem ojo {s}', (s * 0.1, -0.3, 1.4), (0.06, 0.02, 0.035), BRASA(), n=2, sub=0)
        clay.sweep(f'golem ceja {s}', [(s * 0.03, -0.32, 1.48), (s * 0.19, -0.32, 1.44)], 0.03, coll=coll, material=placa, segments=4, samples=2, subsurf=0)


def m_polilla(coll):
    cuerpo = tela('polilla cuerpo', '#7A6F86')
    clay.blob('polilla torso', (0, 0, 0.0), (0.16, 0.24, 0.16), coll, cuerpo, n=4, shaper=ruido(2, 0.08, 12), subsurf=1)
    clay.blob('polilla abdomen', (0, 0.3, -0.05), (0.12, 0.2, 0.12), coll, tela('polilla abdomen', '#5E546B'), n=4, subsurf=1)
    for k in range(3):
        bola(coll, f'polilla raya {k}', (0, 0.22 + k * 0.1, -0.05), (0.125 - k * 0.015, 0.025, 0.125 - k * 0.015), CENIZA_OSC(), n=3, sub=0)
    clay.blob('polilla cabeza', (0, -0.27, 0.05), (0.13, 0.12, 0.12), coll, cuerpo, n=4, subsurf=1)
    for s in (-1, 1):
        bola(coll, f'polilla ojo {s}', (s * 0.07, -0.36, 0.08), (0.06, 0.04, 0.06), luz('ojo polilla', '#D7A8FF', 4.0), n=2, sub=0)
        clay.sweep(f'polilla antena {s}', [(s * 0.04, -0.33, 0.15), (s * 0.12, -0.42, 0.3), (s * 0.2, -0.4, 0.36)], 0.012, coll=coll, material=CENIZA_OSC(),
                   segments=4, samples=3, subsurf=0)
        bola(coll, f'polilla antena pluma {s}', (s * 0.2, -0.4, 0.36), (0.05, 0.02, 0.03), CENIZA(), n=2, sub=0)
    # El cuerpo vuela: el juego lo sube; aquí queda centrado en el origen
    for k in range(3):
        bola(coll, f'polilla polvo {k}', (0.05 * (k - 1), 0.5 + 0.08 * k, -0.08), 0.03, MORADO(), n=2, sub=0)


def m_polilla_ala(coll):
    """Ala izquierda (+x en el juego se refleja): fieltro con un ojo falso y borde oscuro."""
    v, f = [], []
    contorno = [(0.0, -0.1), (0.25, -0.32), (0.55, -0.3), (0.68, -0.05), (0.55, 0.15), (0.42, 0.35), (0.2, 0.32), (0.04, 0.12)]
    v.append((0.2, 0.0, 0.0))
    for x, y in contorno:
        v.append((x, y, 0.0))
    for k in range(len(contorno)):
        f.append((0, 1 + k, 1 + (k + 1) % len(contorno)))
    o = clay.make_mesh_object('polilla ala', v, f, coll, material=tela('ala polilla', '#9A8FA8'))
    clay.add_solidify(o, 0.025)
    clay.add_subsurf(o, 2, 2)
    bola(coll, 'polilla ala ojo', (0.38, -0.08, 0.02), (0.1, 0.1, 0.012), tela('ojo ala', '#5E546B'), n=3, sub=0)
    bola(coll, 'polilla ala ojo centro', (0.38, -0.08, 0.03), (0.05, 0.05, 0.012), luz('ojo ala', '#D7A8FF', 2.5), n=2, sub=0)
    bola(coll, 'polilla ala mancha', (0.3, 0.2, 0.02), (0.08, 0.06, 0.012), CENIZA_OSC(), n=2, sub=0)


def m_divisora(coll):
    clay.blob('divisora cuerpo', (0, 0, 0.55), (0.5, 0.46, 0.48), coll, piedra('divisora', '#4A3A3A'), n=6, shaper=ruido(5, 0.1, 5), subsurf=1)
    for k in range(9):
        a = k * 2.4
        clay.sweep(f'divisora grieta {k}', [(math.cos(a) * 0.48, math.sin(a) * 0.44, 0.35 + (k % 4) * 0.12), (math.cos(a + 0.3) * 0.49, math.sin(a + 0.3) * 0.45,
                                            0.45 + (k % 4) * 0.12)], 0.028, coll=coll, material=BRASA(), segments=4, samples=2, subsurf=0)
    # Las tres motas pegadas (se sueltan al romperla)
    for k, (x, y, z) in enumerate(((-0.38, -0.2, 0.85), (0.4, -0.15, 0.8), (0.0, 0.25, 1.0))):
        clay.blob(f'divisora mota {k}', (x, y, z), (0.17, 0.16, 0.16), coll, CENIZA(), n=4, shaper=ruido(k, 0.1, 10), subsurf=1)
        for s in (-1, 1):
            bola(coll, f'divisora mota ojo {k} {s}', (x + s * 0.05, y - 0.14, z + 0.03), (0.04, 0.02, 0.05), BLANCO(), n=2, sub=0)
            bola(coll, f'divisora mota pupila {k} {s}', (x + s * 0.05, y - 0.16, z + 0.02), (0.02, 0.01, 0.025), NEGRO(), n=2, sub=0)
    ojos(coll, 'divisora', 0, -0.42, 0.62, 0.12, bravo=0.45)
    boca(coll, 'divisora', 0, -0.45, 0.38, 0.28, abierta=True)
    for s in (-1, 1):
        bola(coll, f'divisora pata {s}', (s * 0.22, -0.05, 0.07), (0.13, 0.16, 0.08), piedra('divisora', '#4A3A3A'), n=3)


def m_jefe(coll):
    """La sombra de Nath'Gora: casi 3 m, capa de fieltro negro, máscara pálida y corona de estrella apagada."""
    capa = tela('capa nathgora', '#1A1622')
    capa2 = tela('capa nathgora borde', '#2E2840')
    clay.lathe('jefe capa', [(0.0, 0.0), (0.95, 0.0), (0.98, 0.08), (0.75, 0.9), (0.55, 1.7), (0.45, 2.1), (0.0, 2.2)], coll, capa, segments=14, subsurf=1)
    for k in range(10):
        a = k / 10 * math.tau
        clay.sweep(f'jefe pliegue {k}', [(math.cos(a) * 0.5, math.sin(a) * 0.5, 1.6), (math.cos(a) * 0.95, math.sin(a) * 0.95, 0.05)], [0.08, 0.13], coll=coll,
                   material=capa2, segments=5, samples=2, caps=('round', 'flat'), subsurf=0)
    for k in range(7):
        a = k / 7 * math.tau
        clay.sweep(f'jefe jirón {k}', [(math.cos(a) * 0.95, math.sin(a) * 0.95, 0.05), (math.cos(a + 0.2) * 1.15, math.sin(a + 0.2) * 1.15, 0.02)], [0.12, 0.01],
                   coll=coll, material=capa, segments=5, samples=2, caps=('flat', 'point'), subsurf=0)
    # Capucha y máscara
    clay.blob('jefe capucha', (0, 0.05, 2.35), (0.5, 0.48, 0.5), coll, capa, n=5, subsurf=1)
    clay.blob('jefe hueco', (0, -0.25, 2.3), (0.36, 0.2, 0.36), coll, laca('hueco capucha', '#07060A'), n=4, subsurf=1)
    clay.blob('jefe mascara', (0, -0.36, 2.28), (0.27, 0.1, 0.32), coll, laca('máscara nathgora', '#D8D4E0', 0.4), n=4, subsurf=1)
    for s in (-1, 1):
        bola(coll, f'jefe ojo {s}', (s * 0.11, -0.45, 2.33), (0.07, 0.02, 0.045), luz('ojo nathgora', '#BFE6FF', 7.0), n=2, sub=0)
        clay.sweep(f'jefe lágrima {s}', [(s * 0.11, -0.45, 2.27), (s * 0.12, -0.45, 2.1)], [0.02, 0.005], coll=coll, material=laca('grieta máscara', '#5A5468'),
                   segments=4, samples=2, caps=('flat', 'point'), subsurf=0)
    # Corona de estrella muerta: puntas de cristal negro con brillo frío
    for k in range(7):
        a = (k - 3) * 0.32
        l = 0.55 - abs(k - 3) * 0.08
        x, y = math.sin(a) * 0.38, math.cos(a) * 0.1
        clay.sweep(f'jefe corona {k}', [(x, y, 2.72), (x * 1.3, y, 2.72 + l)], [0.07, 0.005], coll=coll,
                   material=_mat('Escudo | cristal estrella muerta', '#2A2E44', rough=0.15, coat=0.6, emission='#6F8FD0', emission_strength=0.9),
                   segments=5, samples=2, caps=('flat', 'point'), subsurf=0)
    bola(coll, 'jefe estrella apagada', (0, -0.2, 3.25), 0.13, luz('estrella apagada', '#9FB8FF', 4.0), n=3)
    # Brazos largos con garras
    for s in (-1, 1):
        tubo(coll, f'jefe brazo {s}', [(s * 0.55, -0.05, 1.75), (s * 0.95, -0.3, 1.3), (s * 1.05, -0.55, 0.95)], 0.13, capa, seg=7)
        clay.blob(f'jefe mano {s}', (s * 1.06, -0.62, 0.85), (0.15, 0.14, 0.13), coll, laca('mano nathgora', '#3A3448'), n=4, subsurf=1)
        for j in range(4):
            b = (j - 1.5) * 0.35
            clay.sweep(f'jefe garra {s} {j}', [(s * 1.06 + math.sin(b) * 0.1, -0.7, 0.82), (s * 1.08 + math.sin(b) * 0.16, -0.82, 0.62)], [0.035, 0.004], coll=coll,
                       material=laca('garra', '#C9C4D6', 0.3), segments=4, samples=2, caps=('flat', 'point'), subsurf=0)
    # Ceniza que se le cae
    for k in range(12):
        a = k * 2.4
        bola(coll, f'jefe ceniza {k}', (math.cos(a) * 0.9, math.sin(a) * 0.9, 0.06 + (k % 3) * 0.04), 0.08, CENIZA_OSC(), n=2, sub=0)
    for k in range(6):
        a = k * 1.1
        bola(coll, f'jefe brasa {k}', (math.cos(a) * 0.7, math.sin(a) * 0.6 - 0.2, 0.5 + k * 0.22), 0.04, luz('brasa fría', '#9FB8FF', 4.0), n=2, sub=0)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Escudo enemigos')
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
    exportar_glb.exportar(objs, os.path.join(out, 'escudo_enemigos.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
