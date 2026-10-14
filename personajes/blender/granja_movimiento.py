"""Nuestro Hogar · granja: las piezas que se mueven en las máquinas (escenas-produccion.ts, `moviles`).

Cada pieza está hecha alrededor de su bisagra (el origen), así el juego la sigue girando o bombeando igual:
- mov_nave_rotor: el rotor de la nave (dos aspas cruzadas con su buje); gira en y.
- mov_aspersor_cobre / mov_aspersor_hierro: el brazo del aspersor con sus dos boquillas; gira en y.
- mov_rodillo: el rodillo dentado de la trituradora y las recuperadoras, a lo largo de x; gira en x.
- mov_fuelle: el fuelle de cuero del alto horno (el juego lo estira en y).
- mov_broca: la broca en espiral del taladro de vapor; gira en y.
- mov_brazo: el brazo mecánico de la ensambladora (hacia -x, con su pinza); se mece en y.
- mov_engranaje: engranaje parado de radio 1 en el plano xy (el juego lo escala); gira en z.
- mov_volante: el volante de la prensa, de radio 1 y parado en el plano xy (el juego lo acuesta); gira en y.
- mov_manivela: la manivela del molino (brazo hacia +x con su mango); gira en y.
- mov_rueda: la rueda de radio 1 parada en el plano xy (recicladora); gira en z.

Medidas de three.js. Cada pieza queda bajo un vacío «m_<clave>» en granja_movimiento.glb.

Uso: blender -b -P granja_movimiento.py -- <carpeta_salida> [claves]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
from regalos import madera, tela  # noqa: E402
from granja_muebles import mat, metal  # noqa: E402

ORO = lambda: metal('mov oro', '#D6BD80')  # noqa: E731
METAL = lambda: metal('mov metal', '#647D81')  # noqa: E731
COBRE = lambda: metal('mov cobre', '#BD8962')  # noqa: E731
CLARO = lambda: mat('mov claro', '#C8D4C2', 0.5)  # noqa: E731
OSCURO = lambda: mat('mov oscuro', '#5B6168', 0.5, metallic=0.4)  # noqa: E731
MADERA_M = lambda: madera('mov madera', '#B7885B')  # noqa: E731


def C(x, y, z):
    return (x, -z, y)


def R(rx, ry, rz):
    return (rx, rz, ry)


def girar(o, rx=0.0, ry=0.0, rz=0.0):
    o.rotation_euler = (rx, -rz, ry)
    return o


def en(o, c):
    o.location = C(*c)
    return o


def caja(coll, nombre, medidas, centro, material, p=12, rot=(0.0, 0.0, 0.0)):
    w, h, d = medidas
    o = clay.rbox(nombre, (0, 0, 0), (w / 2, d / 2, h / 2), coll, material, p=p, n=5, subsurf=0)
    return girar(en(o, centro), *rot)


def bola(coll, nombre, centro, radios, material, n=3, sub=1):
    o = clay.blob(nombre, (0, 0, 0), R(*radios), coll, material, n=n, subsurf=sub)
    return en(o, centro)


def tubo(coll, nombre, a, b, r, material, seg=10):
    return clay.sweep(nombre, [C(*a), C(*b)], r, coll=coll, material=material, segments=seg, samples=2, subsurf=0)


def disco(coll, nombre, radio, grueso, material, eje='y', seg=24, r_int=0.0):
    """Disco (o anillo si r_int > 0) con su eje en y (acostado) o en z (parado en el plano xy)."""
    perfil = [(r_int, -grueso / 2), (radio, -grueso / 2), (radio, grueso / 2), (r_int, grueso / 2)]
    if r_int:
        perfil.append((r_int, -grueso / 2))
    o = clay.lathe(nombre, perfil, coll, material, segments=seg, subsurf=0, cap_bottom=not r_int, cap_top=not r_int)
    if eje == 'z':
        o.rotation_euler = (math.pi / 2, 0, 0)
    return o


def m_mov_nave_rotor(coll):
    disco(coll, 'buje', 0.13, 0.12, METAL())
    bola(coll, 'tapa buje', (0, 0.08, 0), (0.08, 0.05, 0.08), ORO())
    for k, r in enumerate((0, math.pi / 2)):
        for s in (-1, 1):
            o = clay.blob(f'aspa {k}{s}', (0, 0, 0), R(0.38, 0.025, 0.07), coll, ORO(), n=4, subsurf=1)
            en(o, (s * 0.42 * math.cos(r), 0.08, -s * 0.42 * math.sin(r)))
            o.rotation_euler = (0, 0, r)
            bola(coll, f'punta aspa {k}{s}', (s * 0.8 * math.cos(r), 0.08, -s * 0.8 * math.sin(r)), (0.035, 0.03, 0.035), mat('mov punta', '#E86A5A', 0.4), n=2, sub=0)


def _aspersor(coll, cuerpo):
    disco(coll, 'base brazo', 0.08, 0.08, cuerpo)
    tubo(coll, 'brazo', (-0.34, 0, 0), (0.34, 0, 0), 0.035, cuerpo)
    for s in (-1, 1):
        tubo(coll, f'codo {s}', (s * 0.32, 0, 0), (s * 0.32, 0.0, s * 0.1), 0.03, cuerpo)
        o = clay.lathe(f'boquilla {s}', [(0.0, 0.0), (0.03, 0.0), (0.045, 0.06), (0.0, 0.065)], coll, CLARO(), segments=10, subsurf=0)
        en(o, (s * 0.32, 0, s * 0.1))
        o.rotation_euler = (s * math.pi / 2, 0, 0)
        for k in range(3):
            bola(coll, f'gota {s}{k}', (s * 0.32, 0.02 * k, s * (0.2 + k * 0.06)), (0.015, 0.02, 0.015), mat('mov gota', '#8DCFE3', 0.1, coat=1.0), n=2, sub=0)
    bola(coll, 'tuerca', (0, 0.05, 0), (0.05, 0.035, 0.05), CLARO(), n=2)


def m_mov_aspersor_cobre(coll):
    _aspersor(coll, COBRE())


def m_mov_aspersor_hierro(coll):
    _aspersor(coll, METAL())


def m_mov_rodillo(coll):
    o = clay.lathe('rodillo', [(0.0, -0.24), (0.1, -0.24), (0.1, 0.24), (0.0, 0.24)], coll, OSCURO(), segments=18, subsurf=0)
    o.rotation_euler = (0, math.pi / 2, 0)
    for k in range(8):
        a = k * 2 * math.pi / 8
        caja(coll, f'diente {k}', (0.46, 0.04, 0.05), (0, math.sin(a) * 0.11, math.cos(a) * 0.11), CLARO(), rot=(a, 0, 0))
    for s in (-1, 1):
        o = disco(coll, f'tapa {s}', 0.12, 0.03, METAL())
        o.rotation_euler = (0, math.pi / 2, 0)
        o.location = C(s * 0.25, 0, 0)


def m_mov_fuelle(coll):
    caja(coll, 'tabla abajo', (0.2, 0.04, 0.36), (0, 0, 0), MADERA_M())
    caja(coll, 'tabla arriba', (0.2, 0.04, 0.36), (0, 0.14, 0), MADERA_M())
    for k in range(3):
        caja(coll, f'pliegue {k}', (0.18 - abs(k - 1) * 0.02, 0.04, 0.32), (0, 0.035 + k * 0.035, 0), tela('mov cuero', '#8A5A3A'), p=6)
    tubo(coll, 'boquilla fuelle', (0, 0.06, 0.18), (0, 0.06, 0.3), 0.02, METAL())
    tubo(coll, 'asa', (0, 0.16, -0.12), (0, 0.16, -0.24), 0.015, MADERA_M())


def m_mov_broca(coll):
    tubo(coll, 'eje broca', (0, -0.6, 0), (0, 0.6, 0), 0.05, mat('mov broca', '#C9CDD2', 0.3, metallic=0.7))
    pts = [C(math.cos(t * 0.6) * 0.1, -0.55 + t * 0.045, math.sin(t * 0.6) * 0.1) for t in range(0, 22)]
    clay.sweep('espiral', pts, 0.022, coll=coll, material=mat('mov espiral', '#9AA3AB', 0.3, metallic=0.7), segments=6, samples=3, subsurf=0)
    o = clay.lathe('punta broca', [(0.0, 0.0), (0.06, 0.0), (0.0, -0.12)], coll, ORO(), segments=8, subsurf=0)
    en(o, (0, -0.6, 0))
    disco(coll, 'collar', 0.09, 0.06, COBRE()).location = C(0, 0.5, 0)


def m_mov_brazo(coll):
    bola(coll, 'hombro', (0, 0, 0), (0.07, 0.07, 0.07), METAL(), n=3)
    tubo(coll, 'brazo', (0, 0, 0), (-0.42, 0, 0), 0.035, COBRE())
    bola(coll, 'codo', (-0.44, 0, 0), (0.05, 0.05, 0.05), METAL(), n=3)
    tubo(coll, 'muneca', (-0.44, 0, 0), (-0.44, -0.12, 0), 0.025, CLARO())
    for s in (-1, 1):
        caja(coll, f'dedo {s}', (0.025, 0.09, 0.025), (-0.44 + s * 0.035, -0.17, 0), CLARO(), rot=(0, 0, s * 0.25))
    bola(coll, 'luz brazo', (-0.2, 0.04, 0.03), (0.02, 0.02, 0.01), mat('mov luz', '#9CE6A0', 0.3), n=2, sub=0)


def _dientes(coll, nombre, radio, grueso, n, material, eje):
    for k in range(n):
        a = k * 2 * math.pi / n
        if eje == 'y':
            caja(coll, f'{nombre} {k}', (0.16, grueso, 0.14), (math.cos(a) * radio, 0, math.sin(a) * radio), material, rot=(0, -a, 0))
        else:
            caja(coll, f'{nombre} {k}', (0.16, 0.14, grueso), (math.cos(a) * radio, math.sin(a) * radio, 0), material, rot=(0, 0, a))


def m_mov_engranaje(coll):
    disco(coll, 'rueda engranaje', 0.85, 0.22, ORO(), eje='z', r_int=0.3)
    _dientes(coll, 'diente', 0.92, 0.22, 10, ORO(), 'z')
    disco(coll, 'centro engranaje', 0.32, 0.26, METAL(), eje='z')
    for k in range(4):
        a = k * math.pi / 2
        caja(coll, f'radio {k}', (0.6, 0.1, 0.12), (math.cos(a) * 0.55, math.sin(a) * 0.55, 0), ORO(), rot=(0, 0, a))


def m_mov_volante(coll):
    disco(coll, 'aro volante', 1.0, 0.2, COBRE(), eje='z', r_int=0.8)
    disco(coll, 'centro volante', 0.22, 0.25, METAL(), eje='z')
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        caja(coll, f'rayo {k}', (0.75, 0.1, 0.1), (math.cos(a) * 0.48, math.sin(a) * 0.48, 0), COBRE(), rot=(0, 0, a))
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        bola(coll, f'empunadura {k}', (math.cos(a) * 1.0, math.sin(a) * 1.0, 0), (0.12, 0.12, 0.12), MADERA_M(), n=2)


def m_mov_manivela(coll):
    caja(coll, 'brazo manivela', (0.6, 0.06, 0.08), (0.2, 0, 0), MADERA_M())
    disco(coll, 'eje', 0.06, 0.1, METAL())
    o = clay.lathe('mango', [(0.0, 0.0), (0.045, 0.0), (0.05, 0.08), (0.04, 0.17), (0.0, 0.18)], coll, mat('mov mango', '#6E5542', 0.6), segments=10, subsurf=1)
    en(o, (0.44, 0.02, 0))


def m_mov_rueda(coll):
    disco(coll, 'llanta', 1.0, 0.5, OSCURO(), eje='z', r_int=0.72)
    _dientes(coll, 'taco', 1.05, 0.5, 12, OSCURO(), 'z')
    disco(coll, 'rin', 0.74, 0.35, COBRE(), eje='z', r_int=0.55)
    disco(coll, 'buje rueda', 0.25, 0.55, METAL(), eje='z')
    for k in range(5):
        a = k * 2 * math.pi / 5
        caja(coll, f'rayo rueda {k}', (0.45, 0.12, 0.2), (math.cos(a) * 0.42, math.sin(a) * 0.42, 0), COBRE(), rot=(0, 0, a))
    for k in range(3):
        a = k * 2 * math.pi / 3 + 0.5
        o = clay.lathe(f'flecha {k}', [(0.0, 0.0), (0.08, 0.0), (0.0, 0.18)], coll, mat('mov reciclar', '#7FC77A', 0.5), segments=3, subsurf=0)
        o.location = C(math.cos(a) * 0.15, math.sin(a) * 0.15, 0.3)
        o.rotation_euler = (math.pi / 2, 0, a)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Movimiento granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_movimiento.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
