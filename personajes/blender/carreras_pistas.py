"""Nuestro Hogar · La Carrera de las Tres Lunas: las cuatro pistas, por regiones de Astra.

  valle    Camino del Pueblo del Sol (el valle de Celia): pradera, trigales, girasoles, el molino, las casitas del
           pueblo, el río con su puente de tablas y las gradas con el público.
  brasa    Hornos de Brasaviva: basalto, ríos de lava a la orilla (caerse es volver a empezar el tramo), hornos con la
           boca encendida, cristales de brasa y el volcán al fondo.
  nieve    Pista de Nieveclara: pinos nevados, muñecos de nieve, cabañas, arcos de hielo y el lago congelado (resbala).
  cielo    Anillos de las Tres Lunas (el cielo de Astra): una cinta de fieltro azul que flota entre nubes, con Aurelia,
           Nocturna y Esmeralda enormes, islas flotantes, la Estación y anillos de turbo. Sin baranda: se puede caer.

Cada pista sale de una curva cerrada (puntos de control → Catmull-Rom → una muestra por metro). Con la MISMA curva se
arman la pista en 3D (GLB: carreras_<id>.glb, todo junto por material y por trozos de 120 m) y el JSON que lee el juego
(carreras_<id>.json: centro, ancho, orilla y qué hay en cada metro, cajas de objetos, turbos, rampas, anillos).

Uso: blender -b -P carreras_pistas.py -- <carpeta_salida> [ids] [--plano]
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bmesh  # noqa: E402
import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
import carreras_cosas as cc  # noqa: E402
from carreras_comun import (AURELIA, ESMERALDA, NOCTURNA, bola, caja, cilindro, emblema, laca, luz, madera, media_luna,  # noqa: E402
                            oro, tela, texto, tubo)

# Banderas por muestra (el juego las lee igual)
HIELO, CAIDA, LAVA, PUENTE = 1, 2, 4, 8

PISTAS = {
    'valle': dict(
        puntos=[(0, -80, 0.4), (50, -85, 0.4), (95, -75, 0.6), (125, -45, 1.2), (130, -5, 2.2), (112, 30, 3.4), (80, 45, 3.8), (55, 40, 3.0),
                (35, 55, 2.2), (30, 85, 1.4), (5, 105, 0.9), (-35, 100, 0.7), (-60, 75, 0.7), (-65, 40, 1.6), (-90, 20, 2.6), (-110, -10, 2.2),
                (-100, -50, 1.0), (-60, -75, 0.5)],
        ancho=7.5, hombro=4.5, cajas=(0.13, 0.37, 0.62, 0.86), turbos=((0.27, 0), (0.55, -3), (0.78, 3)), rampas=(0.45,),
    ),
    'brasa': dict(
        puntos=[(0, -70, 0.6), (60, -72, 0.6), (100, -55, 1.2), (112, -20, 2.4), (88, 6, 4.2), (52, 10, 5.6), (30, 35, 6.4), (45, 70, 5.8),
                (20, 100, 4.2), (-25, 96, 3.0), (-45, 66, 2.0), (-30, 36, 1.6), (-60, 15, 1.2), (-95, 10, 1.0), (-112, -25, 1.0), (-88, -60, 0.6),
                (-40, -72, 0.6)],
        ancho=7.0, hombro=4.0, cajas=(0.12, 0.36, 0.6, 0.84), turbos=((0.22, 2), (0.5, -2), (0.74, 0)), rampas=(0.31, 0.68),
        lava=((0.18, 0.3), (0.52, 0.64), (0.88, 0.95)),
    ),
    'nieve': dict(
        puntos=[(0, -60, 0.4), (55, -65, 0.4), (95, -40, 1.2), (102, 0, 3.0), (76, 30, 4.6), (92, 66, 5.6), (60, 96, 5.0), (15, 90, 3.0),
                (-5, 60, 1.2), (-30, 40, 0.5), (-70, 55, 0.5), (-102, 30, 1.0), (-96, -15, 1.0), (-60, -50, 0.5)],
        ancho=7.5, hombro=4.5, cajas=(0.14, 0.38, 0.6, 0.85), turbos=((0.3, 0), (0.52, 3), (0.92, -2)), rampas=(0.42,),
        hielo=((0.6, 0.76),),
    ),
    'cielo': dict(
        puntos=[(0, -70, 10), (60, -70, 10), (105, -50, 12.5), (120, -10, 16), (95, 25, 20), (55, 20, 22), (30, 45, 22), (40, 85, 18),
                (0, 110, 14), (-45, 95, 12), (-55, 55, 10.5), (-30, 25, 9), (-70, 5, 8), (-110, -10, 9), (-105, -50, 10), (-55, -72, 10)],
        ancho=7.0, hombro=1.6, cajas=(0.12, 0.35, 0.58, 0.83), turbos=((0.25, 0), (0.7, 2)), rampas=(0.48,), anillos=(0.08, 0.2, 0.4, 0.63, 0.77, 0.94),
    ),
}

TEMAS = {
    'valle': dict(camino='#D8B07A', camino2='#C99A62', hombro='#8CC461', suelo='#7DB857', talud='#9A7048', piano=('#E4566B', '#FFF3DA'), costura='#FFF3DA'),
    'brasa': dict(camino='#5C4A48', camino2='#4A3C3B', hombro='#3A302F', suelo='#2E2626', talud='#3A2E2C', piano=('#F28C3A', '#2B2230'), costura='#FFB43A'),
    'nieve': dict(camino='#E8EEF6', camino2='#D2DCEA', hombro='#FFFFFF', suelo='#F4F7FB', talud='#C9D6E6', piano=('#4A7FC9', '#FFFFFF'), costura='#8EC5F0'),
    'cielo': dict(camino='#2E3A78', camino2='#24306A', hombro='#3B2E6E', suelo=None, talud='#1E2450', piano=('#F2C14E', '#7A5BB8'), costura='#F2C14E'),
}

PASO = 1.0
TROZO = 250.0


# ------------------------------------------------------------------------------------------------ la curva

def muestrear(puntos):
    pts, _ = clay.catmull_rom(puntos, samples=60, closed=True, alpha=0.5)
    D = np.vstack([pts, pts[:1]])
    seg = np.linalg.norm(np.diff(D, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    L = cum[-1]
    m = int(round(L / PASO))
    s = np.linspace(0, L, m, endpoint=False)
    P = np.array([np.interp(s, cum, D[:, k]) for k in range(3)]).T
    T = np.roll(P, -1, 0) - np.roll(P, 1, 0)
    T[:, 2] = 0
    T /= np.linalg.norm(T, axis=1)[:, None]
    N = np.stack([-T[:, 1], T[:, 0], np.zeros(len(T))], 1)
    # curvatura con signo (+ = gira a la izquierda)
    ang = np.arctan2(T[:, 1], T[:, 0])
    d = np.angle(np.exp(1j * (np.roll(ang, -3) - np.roll(ang, 3)))) / 6
    return P, T, N, d, L


def rango(frac, n):
    a, b = frac
    return [i % n for i in range(int(a * n), int(b * n))]


# ------------------------------------------------------------------------------------------------ lotes (instancias horneadas)

class Lote:
    """Junta triángulos por (material, trozo de 120 m): pocas mallas, y las de lejos se recortan solas en el juego."""

    def __init__(self):
        self.buf = {}
        self.mats = {}

    def tri(self, mat, V, F, trozo=None):
        V = np.asarray(V, float)
        F = np.asarray(F, int)
        if not len(F):
            return
        if trozo is None:
            c = V.mean(0)
            trozo = (int(math.floor(c[0] / TROZO)), int(math.floor(c[1] / TROZO)))
        k = (mat.name, trozo)
        self.mats[mat.name] = mat
        b = self.buf.setdefault(k, [[], [], 0])
        b[0].append(V)
        b[1].append(F + b[2])
        b[2] += len(V)

    def quads(self, mat, V, Q, trozo=None):
        Q = np.asarray(Q, int)
        F = np.concatenate([Q[:, [0, 1, 2]], Q[:, [0, 2, 3]]])
        self.tri(mat, V, F, trozo)

    def poner(self, proto, pos, rot=0.0, esc=1.0, trozo=None):
        c, s = math.cos(rot), math.sin(rot)
        R = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
        e = np.asarray(esc if isinstance(esc, (tuple, list)) else (esc, esc, esc), float)
        if trozo is None:
            trozo = (int(math.floor(pos[0] / TROZO)), int(math.floor(pos[1] / TROZO)))
        for mat, V, F in proto:
            self.tri(mat, (V * e) @ R.T + np.asarray(pos), F, trozo)

    def crear(self, coll, nombre):
        objs = []
        for (mn, trozo), (Vs, Fs, _) in sorted(self.buf.items()):
            V = np.concatenate(Vs)
            F = np.concatenate(Fs)
            me = bpy.data.meshes.new(f'{nombre} {mn}')
            me.from_pydata(V.tolist(), [], F.tolist())
            me.update()
            me.shade_smooth()
            o = bpy.data.objects.new(f'{nombre} {mn} {trozo[0]} {trozo[1]}', me)
            clay.link(o, coll)
            o.data.materials.append(self.mats[mn])
            objs.append(o)
        return objs


def proto(construir):
    """Construye una pieza en el origen y la vuelve triángulos por material (para ponerla muchas veces)."""
    coll = clay.collection('_proto')
    antes = set(coll.objects)
    construir(coll)
    out = []
    for o in [o for o in coll.objects if o not in antes]:
        if o.type != 'MESH':
            bpy.data.objects.remove(o, do_unlink=True)
            continue
        clay.apply_modifiers(o)
        bpy.context.view_layer.update()
        me = o.data
        me.transform(o.matrix_world)
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.triangulate(bm, faces=bm.faces)
        V = np.array([v.co[:] for v in bm.verts])
        F = np.array([[v.index for v in f.verts] for f in bm.faces]) if bm.faces else np.zeros((0, 3), int)
        bm.free()
        mat = me.materials[0] if me.materials else None
        if mat is not None and len(F):
            out.append((mat, V, F))
        bpy.data.objects.remove(o, do_unlink=True)
    return out


def proto_obj(obj_fn):
    return proto(lambda coll: obj_fn(coll))


# ------------------------------------------------------------------------------------------------ utilería de paisaje

def arbol(coll, tono=0, alto=1.0):
    verdes = (('#5E9A44', '#79B556'), ('#4E8A3A', '#6FA850'), ('#7FB069', '#9CC77A'))[tono % 3]
    tubo(coll, 'tronco', [(0, 0, 0), (0.05, 0, 1.4 * alto), (0, 0.05, 2.2 * alto)], 0.28, madera('tronco', '#8A5A3B'), seg=7)
    for (x, y, z, r, k) in ((0, 0, 2.8, 1.5, 0), (0.9, 0.3, 2.3, 1.0, 1), (-0.8, -0.4, 2.4, 1.05, 1), (0.2, -0.6, 3.6, 0.95, 0)):
        bola(coll, 'copa', (x, y, z * alto), (r, r, r * 0.9), tela(f'copa {verdes[k]}', verdes[k]), n=3, sub=1)


def arbusto(coll, tono=0):
    c = ('#5E9A44', '#6FA850', '#4E8A3A')[tono % 3]
    for x, y, r in ((0, 0, 0.7), (0.6, 0.2, 0.5), (-0.5, 0.3, 0.55)):
        bola(coll, 'arbusto', (x, y, r * 0.7), (r, r, r * 0.8), tela(f'arbusto {c}', c), n=3, sub=0)
    for k in range(4):
        a = k * 1.7
        bola(coll, 'florecita', (math.cos(a) * 0.55, math.sin(a) * 0.55, 0.75), 0.11, tela(f'flor {k % 3}', ('#F7A1C4', '#FFFFFF', '#F7C948')[k % 3]), n=2, sub=0)


def roca(coll, color='#9C968C', esc=1.0):
    bola(coll, 'roca', (0, 0, 0.35 * esc), (0.9 * esc, 0.7 * esc, 0.6 * esc), laca(f'roca {color}', color, 0.8), n=3, sub=1)
    bola(coll, 'roca chica', (0.7 * esc, 0.4 * esc, 0.2 * esc), (0.4 * esc, 0.35 * esc, 0.3 * esc), laca(f'roca {color}', color, 0.8), n=2, sub=1)


def flores(coll):
    for k in range(9):
        a, r = k * 2.4, 0.3 + (k % 3) * 0.35
        x, y = math.cos(a) * r, math.sin(a) * r
        tubo(coll, 'tallo', [(x, y, 0), (x, y, 0.35)], 0.025, tela('tallo', '#4E7A3A'), seg=4)
        bola(coll, 'flor', (x, y, 0.4), (0.12, 0.12, 0.07), tela(f'flor {k % 4}', ('#F7A1C4', '#FFFFFF', '#F7C948', '#C9B6EA')[k % 4]), n=2, sub=0)


def girasol(coll):
    tubo(coll, 'tallo girasol', [(0, 0, 0), (0.05, 0, 1.2), (0, -0.1, 1.8)], 0.06, tela('tallo', '#4E7A3A'), seg=5)
    for s in (-1, 1):
        bola(coll, 'hoja girasol', (s * 0.25, 0, 0.8), (0.25, 0.08, 0.12), tela('hoja girasol', '#5E9A44'), n=2, sub=0)
    for k in range(10):
        a = k / 10 * math.tau
        bola(coll, 'petalo', (math.cos(a) * 0.32, -0.12, 1.85 + math.sin(a) * 0.32), (0.13, 0.04, 0.08), tela('petalo girasol', '#F7C948'), n=2, sub=0)
    bola(coll, 'centro girasol', (0, -0.14, 1.85), (0.2, 0.07, 0.2), tela('centro girasol', '#6B4430'), n=3, sub=0)


def trigal(coll):
    """Parcela de trigo: un colchón dorado con espigas."""
    caja(coll, 'trigal', (0, 0, 0.35), (5, 3, 0.35), tela('trigo', '#E8C25A'), p=4, sub=0, n=3)
    for i in range(10):
        for j in range(6):
            x, y = -4.5 + i, -2.5 + j
            bola(coll, 'espiga', (x, y, 0.8), (0.12, 0.12, 0.25), tela('espiga', '#F2D27A'), n=2, sub=0)


def paca(coll):
    cilindro(coll, 'paca', (0, 0, 0), 0.7, 1.3, tela('heno', '#E2C26A'), seg=12)
    o = coll.objects[-1]
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (0, 0.65, 0.7)
    for y in (-0.3, 0.3):
        clay.lathe('cinta paca', [(0.71, -0.03), (0.71, 0.03)], coll, tela('cuerda', '#7A4A2A'), segments=12, subsurf=0, cap_top=False, cap_bottom=False)
        o = coll.objects[-1]
        o.rotation_euler = (math.pi / 2, 0, 0)
        o.location = (0, y, 0.7)


def casa(coll, color='#F4E3C6', techo='#C2553E'):
    caja(coll, 'muros', (0, 0, 1.6), (2.6, 2.2, 1.6), tela(f'muro {color}', color), p=6, sub=1)
    verts = [(-3.0, -2.6, 3.1), (3.0, -2.6, 3.1), (3.0, 2.6, 3.1), (-3.0, 2.6, 3.1), (0, -2.6, 5.2), (0, 2.6, 5.2)]
    o = clay.make_mesh_object('techo', verts, [(0, 1, 4), (3, 5, 2), (0, 4, 5, 3), (1, 2, 5, 4)], coll, smooth=False, material=tela(f'techo {techo}', techo))
    clay.add_solidify(o, 0.25)
    caja(coll, 'puerta', (0, -2.25, 1.0), (0.55, 0.08, 1.0), madera('puerta casa', '#8A5A3B'), p=6, sub=0)
    for x in (-1.6, 1.6):
        caja(coll, 'ventana', (x, -2.25, 1.9), (0.5, 0.06, 0.5), luz('ventana', '#FFE2A0', 1.2), p=6, sub=0)
        caja(coll, 'marco', (x, -2.28, 1.35), (0.65, 0.1, 0.08), madera('marco casa', '#C9955F'), p=4, sub=0)
        for k in range(3):
            bola(coll, 'flor maceta', (x - 0.35 + k * 0.35, -2.4, 1.48), 0.12, tela(f'flor {k % 3}', ('#F7A1C4', '#FFFFFF', '#F7C948')[k % 3]), n=2, sub=0)
    caja(coll, 'chimenea', (1.6, 1.0, 5.0), (0.35, 0.35, 0.9), laca('ladrillo', '#B5603E', 0.7), p=6, sub=0)


def molino(coll):
    clay.lathe('torre molino', [(0.0, 0.0), (2.4, 0.0), (1.7, 7.5), (0.0, 7.5)], coll, tela('molino', '#F4E3C6'), segments=12, subsurf=0)
    clay.lathe('techo molino', [(0.0, 7.4), (2.0, 7.4), (0.0, 9.8)], coll, tela('techo molino', '#C2553E'), segments=12, subsurf=0)
    for k in range(4):
        a = k / 4 * math.tau + 0.3
        p0 = (0, -2.1, 7.0)
        p1 = (math.cos(a) * 6, -2.3, 7.0 + math.sin(a) * 6)
        tubo(coll, 'aspa', [p0, p1], 0.15, madera('aspa', '#8A5A3B'), seg=5)
        mx, mz = (p0[0] + p1[0]) * 0.6, (p0[2] + p1[2]) * 0.6 + 7.0 * 0.4
        o = caja(coll, 'vela aspa', (0, 0, 0), (0.7, 0.05, 2.0), tela('vela molino', '#FFF8EC'), p=4, sub=0)
        o.rotation_euler = (0, -a + math.pi / 2, 0)
        o.location = (math.cos(a) * 3.6, -2.35, 7.0 + math.sin(a) * 3.6)
    bola(coll, 'eje molino', (0, -2.2, 7.0), 0.4, oro(), n=3, sub=0)
    caja(coll, 'puerta molino', (0, -2.2, 1.0), (0.6, 0.1, 1.0), madera('puerta casa', '#8A5A3B'), p=6, sub=0)


def gradas(coll):
    """Gradas de madera con el público (bolitas de felpa de colores con cara) y banderines."""
    for k in range(4):
        caja(coll, 'grada', (0, k * 1.0, 0.4 + k * 0.6), (9, 0.5, 0.4 + k * 0.6), madera('grada', '#C9955F' if k % 2 else '#A87A4E'), p=6, sub=0)
    rng = np.random.default_rng(5)
    colores = ('#E4566B', '#8EC5F0', '#F7C948', '#8FD6B9', '#C9B6EA', '#F28C45', '#FFFFFF')
    pieles = ('#F2C9A8', '#D9A57E', '#A86F4C', '#FFE0C8')
    for k in range(4):
        for i in range(16):
            x = -8.4 + i * 1.12 + rng.uniform(-0.15, 0.15)
            y, z = k * 1.0, 0.8 + k * 1.2
            bola(coll, 'cuerpo publico', (x, y, z + 0.35), (0.33, 0.28, 0.38), tela(f'publico {colores[(i + k) % 7]}', colores[(i + k * 3) % 7]), n=2, sub=0)
            bola(coll, 'cabeza publico', (x, y - 0.05, z + 0.95), (0.3, 0.27, 0.28), tela(f'piel {pieles[(i * 3 + k) % 4]}', pieles[(i * 3 + k) % 4]), n=2, sub=0)
            if (i + k) % 3 == 0:
                tubo(coll, 'bracito', [(x + 0.2, y, z + 0.6), (x + 0.4, y - 0.1, z + 1.3)], 0.08, tela(f'publico {colores[(i + k) % 7]}', colores[(i + k * 3) % 7]), seg=4)
    caja(coll, 'techo gradas', (0, 2.2, 5.6), (9.5, 2.2, 0.15), tela('toldo', '#E4566B'), p=6, sub=0)
    for x in (-9, 9):
        cilindro(coll, 'poste gradas', (x, 3.6, 0), 0.15, 5.6, madera('poste', '#7E5236'), seg=6)
    for k in range(10):
        x = -9 + k * 2
        o = clay.make_mesh_object('banderin toldo', [(x, 0.0, 5.45), (x + 2, 0.0, 5.45), (x + 1, 0.0, 4.8)], [(0, 1, 2)], coll,
                                  material=tela(f'banderin {k % 4}', ('#E4566B', '#F7C948', '#8FD6B9', '#8EC5F0')[k % 4]))


def farol_poste(coll, color='#FFD27A'):
    cilindro(coll, 'poste farol', (0, 0, 0), 0.1, 3.2, madera('poste', '#7E5236'), seg=6)
    tubo(coll, 'brazo farol', [(0, 0, 3.0), (0.5, 0, 3.2)], 0.05, madera('poste', '#7E5236'), seg=4)
    bola(coll, 'farol', (0.5, 0, 2.9), (0.2, 0.2, 0.28), luz(f'farol {color}', color, 3.0), n=3, sub=0)
    bola(coll, 'tapa farol', (0.5, 0, 3.15), (0.24, 0.24, 0.08), oro(), n=2, sub=0)


def horno(coll):
    clay.lathe('horno', [(0.0, 0.0), (2.6, 0.0), (2.4, 1.6), (1.4, 3.2), (0.0, 3.5)], coll, laca('barro horno', '#9A5A3E', 0.8), segments=14, subsurf=1)
    bola(coll, 'boca horno', (0, -2.2, 0.9), (0.9, 0.5, 0.75), luz('boca horno', '#FF8A2A', 4.0), n=3, sub=0)
    caja(coll, 'arco boca', (0, -2.3, 1.75), (1.1, 0.25, 0.2), laca('ladrillo', '#B5603E', 0.7), p=4, sub=0)
    cilindro(coll, 'chimenea horno', (0.8, 0.6, 3.0), 0.35, 2.4, laca('ladrillo', '#B5603E', 0.7), seg=8)
    for k in range(3):
        bola(coll, 'humo', (0.8 + k * 0.2, 0.6, 5.8 + k * 0.9), 0.5 + k * 0.15, tela('humo', '#8A8490'), n=2, sub=0)
    for k in range(5):
        caja(coll, 'leño', (-1.8 + k * 0.3, -2.6, 0.15), (0.12, 0.6, 0.12), madera('leño', '#6B4430'), p=4, sub=0)


def cristal_brasa(coll):
    for k in range(5):
        a = k * 1.3
        h = 1.2 + (k % 3) * 0.7
        clay.lathe('cristal', [(0.0, 0.0), (0.3, 0.0), (0.3, h), (0.0, h + 0.5)], coll, luz('cristal brasa', ('#FF5A3A', '#FF9A3A')[k % 2], 2.5), segments=6, subsurf=0)
        o = coll.objects[-1]
        o.rotation_euler = (math.cos(a) * 0.4, math.sin(a) * 0.4, a)
        o.location = (math.cos(a) * 0.4, math.sin(a) * 0.4, 0)
    bola(coll, 'base cristal', (0, 0, 0.2), (0.9, 0.9, 0.4), laca('basalto', '#2B2226', 0.8), n=2, sub=1)


def volcan(coll):
    clay.lathe('volcan', [(0.0, 0.0), (60, 0.0), (35, 25), (14, 48), (10, 50)], coll, laca('volcan', '#3A2C2A', 0.9), segments=18, subsurf=0, cap_top=False)
    clay.lathe('lava volcan', [(0.0, 47), (11, 47), (0, 48)], coll, luz('lava', '#FF6A1A', 4.0), segments=18, subsurf=0)
    for k in range(6):
        a = k / 6 * math.tau
        pts = [(math.cos(a) * 11, math.sin(a) * 11, 48), (math.cos(a) * 25, math.sin(a) * 25, 24), (math.cos(a) * 40, math.sin(a) * 40, 6)]
        tubo(coll, 'rio lava volcan', pts, 1.4, luz('lava', '#FF6A1A', 4.0), seg=5)
    for k in range(4):
        bola(coll, 'humo volcan', (k * 2, 0, 56 + k * 6), 6 + k * 1.5, tela('humo', '#8A8490'), n=2, sub=0)


def pino(coll, alto=1.0):
    cilindro(coll, 'tronco pino', (0, 0, 0), 0.3, 1.2 * alto, madera('tronco', '#6B4430'), seg=6)
    for k in range(4):
        z = (1.0 + k * 1.2) * alto
        r = (2.2 - k * 0.45) * alto
        clay.lathe('ramas pino', [(0.0, z), (r, z), (0.0, z + 1.8 * alto)], coll, tela('pino', '#3E7A5A'), segments=10, subsurf=0)
        clay.lathe('nieve pino', [(0.0, z + 0.9 * alto), (r * 0.52, z + 0.9 * alto), (0.0, z + 1.85 * alto)], coll, tela('nieve', '#FFFFFF'), segments=10, subsurf=0)


def muneco_nieve(coll):
    for z, r in ((0.7, 0.8), (1.8, 0.6), (2.7, 0.45)):
        bola(coll, 'nieve muneco', (0, 0, z), r, tela('nieve', '#FFFFFF'), n=3, sub=1)
    bola(coll, 'nariz zanahoria', (0, -0.55, 2.7), (0.08, 0.3, 0.08), tela('zanahoria', '#F28C3A'), n=2, sub=0)
    for s in (-1, 1):
        bola(coll, 'ojo carbon', (s * 0.16, -0.4, 2.85), 0.06, laca('carbon', '#231B26', 0.3), n=2, sub=0)
        tubo(coll, 'brazo rama', [(s * 0.5, 0, 1.9), (s * 1.2, 0, 2.4)], 0.05, madera('leño', '#6B4430'), seg=4)
    clay.lathe('gorro', [(0.0, 3.0), (0.42, 3.0), (0.0, 3.8)], coll, tela('gorro rojo', '#C73E4A'), segments=10, subsurf=0)
    bola(coll, 'pompon', (0, 0, 3.85), 0.14, tela('nieve', '#FFFFFF'), n=2, sub=0)
    clay.lathe('bufanda muneco', [(0.5, 2.15), (0.62, 2.25), (0.5, 2.35)], coll, tela('bufanda', '#4A7FC9'), segments=12, subsurf=0, cap_top=False, cap_bottom=False)


def cabana_nieve(coll):
    caja(coll, 'troncos cabana', (0, 0, 1.4), (2.4, 2.0, 1.4), madera('troncos', '#9A6A3E'), p=6, sub=0)
    for k in range(5):
        caja(coll, 'tronco linea', (0, -2.05, 0.3 + k * 0.55), (2.4, 0.05, 0.05), madera('tronco', '#6B4430'), p=4, sub=0)
    verts = [(-2.9, -2.5, 2.7), (2.9, -2.5, 2.7), (2.9, 2.5, 2.7), (-2.9, 2.5, 2.7), (0, -2.5, 4.8), (0, 2.5, 4.8)]
    o = clay.make_mesh_object('techo nevado', verts, [(0, 1, 4), (3, 5, 2), (0, 4, 5, 3), (1, 2, 5, 4)], coll, smooth=False, material=tela('nieve', '#FFFFFF'))
    clay.add_solidify(o, 0.4)
    caja(coll, 'puerta', (0, -2.05, 0.9), (0.5, 0.08, 0.9), madera('puerta casa', '#8A5A3B'), p=6, sub=0)
    caja(coll, 'ventana', (1.4, -2.05, 1.6), (0.45, 0.06, 0.45), luz('ventana', '#FFE2A0', 1.5), p=6, sub=0)


def cristal_hielo(coll):
    for k in range(4):
        a = k * 1.6
        h = 1.4 + (k % 2) * 1.2
        clay.lathe('hielo', [(0.0, 0.0), (0.35, 0.0), (0.35, h), (0.0, h + 0.6)], coll, laca('hielo', '#BFE6FF', 0.1), segments=6, subsurf=0)
        o = coll.objects[-1]
        o.rotation_euler = (math.cos(a) * 0.35, math.sin(a) * 0.35, a)
        o.location = (math.cos(a) * 0.3, math.sin(a) * 0.3, 0)


def montana(coll, nieve=True, color='#8A9AB8'):
    clay.lathe('montana', [(0.0, 0.0), (40, 0.0), (22, 22), (6, 38), (0.0, 42)], coll, laca(f'montana {color}', color, 0.9), segments=9, subsurf=0)
    if nieve:
        clay.lathe('cumbre', [(0.0, 28), (14.5, 28), (6.2, 38.2), (0.0, 42.3)], coll, tela('nieve', '#FFFFFF'), segments=9, subsurf=0)


def nube(coll, color='#F2F4FA'):
    for x, y, z, r in ((0, 0, 0, 3), (3, 0.5, -0.5, 2.3), (-3, 0.3, -0.4, 2.4), (1.2, -1, 1.2, 2.2), (-1.4, 1.2, 1.0, 2.1)):
        bola(coll, 'nube', (x, y, z), (r, r * 0.9, r * 0.75), tela(f'nube {color}', color), n=3, sub=0)


def isla(coll):
    clay.lathe('isla roca', [(0.0, -9.0), (2.5, -6.0), (6.5, -1.5), (7.0, 0.0), (0.0, 0.0)], coll, laca('roca isla', '#8A7A6E', 0.9), segments=12, subsurf=0)
    bola(coll, 'pasto isla', (0, 0, 0.2), (7.2, 7.2, 0.6), tela('pasto', '#7DB857'), n=3, sub=0)
    arbol(coll, 1, 1.0)
    for k in range(4):
        a = k * 1.6
        bola(coll, 'flor isla', (math.cos(a) * 4, math.sin(a) * 4, 0.8), 0.3, tela(f'flor {k % 3}', ('#F7A1C4', '#FFFFFF', '#F7C948')[k % 3]), n=2, sub=0)


def luna(coll, color, r, crater):
    bola(coll, 'luna', (0, 0, 0), r, laca(f'luna {color}', color, 0.5), n=5, sub=1)
    rng = np.random.default_rng(int(r * 10))
    for k in range(10):
        a, b = rng.uniform(0, math.tau), rng.uniform(-1.2, 1.2)
        p = np.array([math.cos(a) * math.cos(b), math.sin(a) * math.cos(b), math.sin(b)]) * r * 0.97
        bola(coll, 'crater', tuple(p), r * rng.uniform(0.08, 0.16), laca(f'crater {crater}', crater, 0.6), n=2, sub=0)


def estacion(coll):
    cilindro(coll, 'nucleo estacion', (0, 0, -4), 3.0, 8, laca('estacion', '#E8EEF6', 0.3), seg=14)
    lista = [(math.cos(a) * 12, math.sin(a) * 12, 0) for a in np.linspace(0, math.tau, 25)[:-1]]
    clay.sweep('anillo estacion', lista, 1.2, (1, 1), coll, laca('estacion', '#E8EEF6', 0.3), segments=8, samples=2, closed=True, caps=(None, None), subsurf=0)
    for k in range(4):
        a = k / 4 * math.tau
        tubo(coll, 'radio estacion', [(0, 0, 0), (math.cos(a) * 12, math.sin(a) * 12, 0)], 0.5, oro(), seg=6)
        caja(coll, 'panel solar', (math.cos(a) * 18, math.sin(a) * 18, 0), (3, 1.2, 0.1), laca('panel', '#3B5FA8', 0.2), p=6, sub=0)
    for k in range(12):
        a = k / 12 * math.tau
        bola(coll, 'ventanita', (math.cos(a) * 12.9, math.sin(a) * 12.9, 0), 0.35, luz('ventana', '#FFE2A0', 2.5), n=2, sub=0)
    bola(coll, 'cupula', (0, 0, 4.2), (3, 3, 2), laca('vidrio cupula', '#8EC5F0', 0.1), n=3, sub=0)


def asteroide(coll):
    bola(coll, 'asteroide', (0, 0, 0), (2.2, 1.7, 1.5), laca('asteroide', '#7A6E66', 0.9), n=3, sub=1)
    for k in range(3):
        bola(coll, 'crater', (math.cos(k * 2) * 1.6, math.sin(k * 2) * 1.2, 0.6), 0.4, laca('crater asteroide', '#5A5048', 0.9), n=2, sub=0)


def anillo_turbo(coll, r):
    lista = [(math.cos(a) * r, 0, math.sin(a) * r) for a in np.linspace(0, math.tau, 33)[:-1]]
    clay.sweep('anillo turbo', lista, 0.45, (1, 1), coll, luz('anillo turbo', '#FFD27A', 3.5), segments=8, samples=2, closed=True, caps=(None, None), up=(0, 1, 0), subsurf=0)
    for k in range(8):
        a = k / 8 * math.tau
        bola(coll, 'estrella anillo', (math.cos(a) * r, 0, math.sin(a) * r), 0.7, luz('estrella anillo', '#FFF2B0', 4.0), n=2, sub=0)


def arco_hielo(coll, ancho):
    pts = [(math.cos(a) * ancho, 0, math.sin(a) * ancho * 0.8) for a in np.linspace(0, math.pi, 11)]
    clay.sweep('arco hielo', pts, 0.9, (1, 1), coll, laca('hielo', '#BFE6FF', 0.1), segments=8, samples=3, subsurf=0)
    for k in range(9):
        a = math.pi * (k + 0.5) / 9
        bola(coll, 'carambano', (math.cos(a) * ancho, 0, math.sin(a) * ancho * 0.8 - 1.1), (0.25, 0.25, 0.6), laca('hielo', '#BFE6FF', 0.1), n=2, sub=0)


def arco_meta(coll, ancho, tema):
    """El arco de salida y meta: dos postes acolchados, la tela a cuadros, las tres lunas y banderines."""
    piano = TEMAS[tema]['piano']
    for s in (-1, 1):
        cilindro(coll, 'poste meta', (s * ancho, 0, 0), 0.55, 7.5, madera('poste meta', '#C9955F'), seg=12)
        for k in range(5):
            bola(coll, 'anillo poste', (s * ancho, 0, 0.8 + k * 1.5), (0.65, 0.65, 0.18), tela(f'anillo {piano[k % 2]}', piano[k % 2]), n=3, sub=0)
        bola(coll, 'perilla meta', (s * ancho, 0, 7.8), 0.6, oro(), n=3, sub=1)
    # Tela a cuadros
    n = int(ancho * 2 / 0.9)
    for i in range(n):
        for j in range(3):
            x0 = -ancho + i * 2 * ancho / n
            caja(coll, 'cuadro meta', (x0 + ancho / n, 0, 6.0 + j * 0.6), (ancho / n, 0.12, 0.3),
                 tela('cuadro negro', '#2B2230') if (i + j) % 2 else tela('cuadro blanco', '#FFFFFF'), p=4, sub=0)
    emblema(coll, (0, -0.2, 8.6), 1.4)
    emblema(coll, (0, 0.2, 8.6), 1.4, lado=1)


def piano_meta(lote, P, N, hw, mats):
    """La línea de salida a cuadros en el piso."""
    p, n = P[0], N[0]
    t = np.array([n[1], -n[0], 0.0])
    cols = 14
    for i in range(cols):
        for j in range(2):
            a = -hw + i * 2 * hw / cols
            b = a + 2 * hw / cols
            c0, c1 = -0.8 + j * 0.8, j * 0.8
            V = [p + n * a + t * c0, p + n * b + t * c0, p + n * b + t * c1, p + n * a + t * c1]
            V = [v + np.array([0, 0, 0.035]) for v in V]
            lote.quads(mats[(i + j) % 2], V, [(0, 3, 2, 1)])


# ------------------------------------------------------------------------------------------------ la pista

def construir(pid, plano=None):
    cfg = PISTAS[pid]
    tema = TEMAS[pid]
    P, T, N, curv, L = muestrear(cfg['puntos'])
    n = len(P)
    hw = np.full(n, cfg['ancho'])
    hombro = np.full(n, cfg['hombro'])
    flags = np.zeros(n, int)
    for fr in cfg.get('hielo', ()):
        for i in rango(fr, n):
            flags[i] |= HIELO
    for fr in cfg.get('lava', ()):
        for i in rango(fr, n):
            flags[i] |= LAVA
            hombro[i] = 2.0
    if pid == 'cielo':
        flags |= CAIDA
        # baranda solo en las curvas cerradas
        for i in range(n):
            if abs(curv[i]) > 0.03:
                for k in range(-12, 13):
                    flags[(i + k) % n] &= ~CAIDA
    puente = []
    if pid == 'valle':
        puente = rango((0.52, 0.565), n)
        for i in puente:
            flags[i] |= PUENTE

    lote = Lote()
    M = dict(
        camino=tela(f'camino {pid}', tema['camino']), camino2=tela(f'camino claro {pid}', tema['camino2']),
        hombro=tela(f'orilla {pid}', tema['hombro']), talud=tela(f'talud {pid}', tema['talud']),
        piano0=tela(f'piano {tema["piano"][0]}', tema['piano'][0]), piano1=tela(f'piano {tema["piano"][1]}', tema['piano'][1]),
        costura=tela(f'costura {tema["costura"]}', tema['costura']), hielo=laca('hielo pista', '#CFEFFF', 0.08),
        tabla=madera('tablas puente', '#B5835A'), tabla2=madera('tablas puente oscuras', '#8A5A3B'), lava=luz('lava', '#FF6A1A', 4.0),
    )
    up = np.array([0, 0, 1.0])

    def borde(i, d, dz=0.0):
        return P[i] + N[i] * d + up * dz

    # --- el camino: franjas de 6 m que alternan dos tonos (o hielo / tablas)
    for i in range(n):
        j = (i + 1) % n
        if flags[i] & PUENTE:
            m = M['tabla'] if (i // 1) % 2 else M['tabla2']
        elif flags[i] & HIELO:
            m = M['hielo']
        else:
            m = M['camino'] if (i // 6) % 2 else M['camino2']
        V = [borde(i, hw[i]), borde(i, -hw[i]), borde(j, -hw[j]), borde(j, hw[j])]
        lote.quads(m, V, [(0, 1, 2, 3)])
        # pianos (en las curvas) o la costura de la orilla
        for s in (-1, 1):
            ca = abs(curv[i]) > 0.012 and not flags[i] & PUENTE
            a0, a1 = hw[i] - 0.25, hw[i] + 1.1
            if ca:
                mp = M['piano0'] if (i // 2) % 2 else M['piano1']
                V = [borde(i, s * a0, 0.04), borde(i, s * a1, 0.08), borde(j, s * a1, 0.08), borde(j, s * a0, 0.04)]
                lote.quads(mp, V, [(0, 1, 2, 3)] if s > 0 else [(0, 3, 2, 1)])
            elif i % 3 != 0:
                V = [borde(i, s * (hw[i] - 0.5), 0.025), borde(i, s * (hw[i] - 0.3), 0.025), borde(j, s * (hw[j] - 0.3), 0.025), borde(j, s * (hw[j] - 0.5), 0.025)]
                lote.quads(M['costura'], V, [(0, 1, 2, 3)] if s > 0 else [(0, 3, 2, 1)])
        # costura del centro (puntadas)
        if i % 4 < 2 and not flags[i] & PUENTE:
            V = [borde(i, 0.15, 0.02), borde(i, -0.15, 0.02), borde(j, -0.15, 0.02), borde(j, 0.15, 0.02)]
            lote.quads(M['costura'], V, [(0, 1, 2, 3)])
        # orilla (hombro) y talud hacia abajo
        for s in (-1, 1):
            ext = hw[i] + hombro[i]
            extj = hw[j] + hombro[j]
            if not flags[i] & PUENTE:
                V = [borde(i, s * hw[i], -0.02), borde(i, s * ext, -0.04), borde(j, s * extj, -0.04), borde(j, s * hw[j], -0.02)]
                lote.quads(M['hombro'], V, [(0, 1, 2, 3)] if s > 0 else [(0, 3, 2, 1)])
            bajo = -2.5 if pid == 'cielo' else -0.6
            if pid == 'cielo':
                V = [borde(i, s * ext, -0.04), borde(i, s * (ext - 0.6), bajo - P[i][2] * 0 - 1.6), borde(j, s * (extj - 0.6), bajo - 1.6), borde(j, s * extj, -0.04)]
            elif flags[i] & PUENTE:
                continue
            else:
                V = [borde(i, s * ext, -0.04), borde(i, s * (ext + 2.0), -P[i][2] - 0.4), borde(j, s * (extj + 2.0), -P[j][2] - 0.4), borde(j, s * extj, -0.04)]
            lote.quads(M['talud'], V, [(0, 1, 2, 3)] if s > 0 else [(0, 3, 2, 1)])
        if pid == 'cielo':
            # panza de la cinta (para que se vea gruesa desde abajo)
            ext, extj = hw[i] + hombro[i] - 0.6, hw[j] + hombro[j] - 0.6
            V = [borde(i, ext, -4.1), borde(i, -ext, -4.1), borde(j, -extj, -4.1), borde(j, extj, -4.1)]
            lote.quads(M['talud'], V, [(0, 3, 2, 1)])
    piano_meta(lote, P, N, hw[0], (tela('cuadro negro', '#2B2230'), tela('cuadro blanco', '#FFFFFF')))

    # --- lava al lado del camino (brasa)
    if pid == 'brasa':
        for i in range(n):
            if not flags[i] & LAVA:
                continue
            j = (i + 1) % n
            for s in (-1, 1):
                ext = hw[i] + hombro[i]
                extj = hw[j] + hombro[j]
                V = [borde(i, s * (ext + 0.1), -0.55), borde(i, s * (ext + 14), -0.55), borde(j, s * (extj + 14), -0.55), borde(j, s * (extj + 0.1), -0.55)]
                lote.quads(M['lava'], V, [(0, 1, 2, 3)] if s > 0 else [(0, 3, 2, 1)])

    # --- barandas, cercas y muros
    protos = {}

    def P_(k, fn):
        if k not in protos:
            protos[k] = proto(fn)
        return protos[k]

    if pid == 'valle':
        poste = P_('poste', lambda c: (cilindro(c, 'poste cerca', (0, 0, 0), 0.13, 1.1, madera('cerca', '#A87A4E'), seg=6),
                                       bola(c, 'punta poste', (0, 0, 1.12), 0.15, tela('punta', '#E4566B'), n=2, sub=0)))
    elif pid == 'brasa':
        poste = P_('poste', lambda c: roca(c, '#3A2E2E', 0.9))
    elif pid == 'nieve':
        poste = P_('poste', lambda c: (bola(c, 'banco nieve', (0, 0, 0.3), (1.2, 0.9, 0.7), tela('nieve', '#FFFFFF'), n=2, sub=1),
                                       cilindro(c, 'baston', (0, 0, 0), 0.1, 1.6, tela('baston rojo', '#C73E4A'), seg=6)))
    else:
        poste = P_('poste', lambda c: (cilindro(c, 'poste cielo', (0, 0, 0), 0.12, 1.2, oro(), seg=6),
                                       bola(c, 'luz poste', (0, 0, 1.3), 0.22, luz('estrella oro', '#FFF2B0', 3.5), n=2, sub=0)))
    riel = tela('riel', {'valle': '#A87A4E', 'brasa': '#5A4A48', 'nieve': '#C73E4A', 'cielo': '#F2C14E'}[pid])
    for s in (-1, 1):
        tramo = []
        for i in range(n + 1):
            k = i % n
            con_muro = not (flags[k] & (CAIDA | LAVA))
            if con_muro:
                tramo.append(k)
            if (not con_muro or i == n) and len(tramo) > 1:
                pts = [tuple(borde(q, s * (hw[q] + hombro[q] + 0.2), 0.75 if pid != 'brasa' else 0.6)) for q in tramo[::2]]
                if pid in ('valle', 'nieve', 'cielo') and len(pts) > 2:
                    for z in ((0.45, 0.85) if pid == 'valle' else (0.9,)):
                        ptsz = [(x, y, zz - 0.75 + z) for x, y, zz in pts]
                        o = clay.sweep('riel', ptsz, 0.08 if pid != 'cielo' else 0.1, (1, 1), None, riel, segments=6, samples=1, subsurf=0)
                        V = np.array([v.co[:] for v in o.data.vertices])
                        F = np.array([list(p.vertices) for p in o.data.polygons if len(p.vertices) == 4])
                        Ft = np.array([list(p.vertices) for p in o.data.polygons if len(p.vertices) == 3]).reshape(-1, 3)
                        for a in range(0, len(F), 600):
                            sub = F[a:a + 600]
                            lote.quads(riel, V, sub)
                        if len(Ft):
                            lote.tri(riel, V, Ft)
                        bpy.data.objects.remove(o, do_unlink=True)
                if pid == 'brasa':
                    for q in tramo[::3]:
                        lote.poner(poste, borde(q, s * (hw[q] + hombro[q] + 0.6), -0.1), RNG.uniform(0, math.tau), RNG.uniform(0.8, 1.2))
                else:
                    for q in tramo[::4 if pid != 'nieve' else 6]:
                        lote.poner(poste, borde(q, s * (hw[q] + hombro[q] + 0.2), -0.05), 0)
                tramo = []
            elif not con_muro:
                tramo = []

    # --- el puente del valle: pilares y el río
    if pid == 'valle' and puente:
        pil = P_('pilar', lambda c: cilindro(c, 'pilar puente', (0, 0, -1.5), 0.45, 1.6, madera('pilar', '#7E5236'), seg=8))
        for i in puente[::4]:
            for s in (-1, 1):
                lote.poner(pil, borde(i, s * (hw[i] + hombro[i] - 0.5), -P[i][2] * 0.0), 0, (1, 1, max(1.0, P[i][2])))
        mid = puente[len(puente) // 2]
        rio = tela('rio', '#5FA8E0')
        orilla = tela('orilla rio', '#B9A37A')
        d = np.array([T[mid][1], -T[mid][0], 0]) if False else N[mid]
        cen = P[mid] * np.array([1, 1, 0])
        tv = T[mid]
        for k in range(-60, 60):
            a = cen + N[mid] * k * 2.0 + tv * math.sin(k * 0.25) * 3
            b = cen + N[mid] * (k + 1) * 2.0 + tv * math.sin((k + 1) * 0.25) * 3
            for w, m, z in ((7, orilla, 0.03), (5, rio, 0.06)):
                V = [a + tv * w + up * z, a - tv * w + up * z, b - tv * w + up * z, b + tv * w + up * z]
                lote.quads(m, V, [(0, 1, 2, 3)] if k % 1 == 0 else [(0, 3, 2, 1)])

    # --- suelo
    if tema['suelo']:
        suelo = tela(f'suelo {pid}', tema['suelo'])
        R = 420
        for gx in range(-R, R, 60):
            for gy in range(-R, R, 60):
                V = [(gx, gy, 0), (gx + 60, gy, 0), (gx + 60, gy + 60, 0), (gx, gy + 60, 0)]
                lote.quads(suelo, V, [(0, 1, 2, 3)], trozo=(99, 99))

    # --- paisaje: se reparte lejos del camino
    centro2 = P[:, :2]
    libre_min = hw + hombro + 3.0

    def libre(x, y, margen=0.0):
        d = np.hypot(centro2[:, 0] - x, centro2[:, 1] - y)
        return bool(np.all(d > libre_min + margen))

    def repartir(pr, cuantos, d0, d1, margen=1.5, esc=(0.8, 1.2), zf=None, lados=(-1, 1), seg=None):
        hechos = 0
        intentos = 0
        while hechos < cuantos and intentos < cuantos * 30:
            intentos += 1
            i = int(RNG.integers(0, n)) if seg is None else int(RNG.integers(int(seg[0] * n), int(seg[1] * n))) % n
            s = lados[int(RNG.integers(0, len(lados)))]
            d = RNG.uniform(d0, d1) + hw[i] + hombro[i]
            p = P[i] + N[i] * s * d
            if not libre(p[0], p[1], margen):
                continue
            z = 0.0 if zf is None else zf(i, p)
            lote.poner(pr, (p[0], p[1], z), RNG.uniform(0, math.tau), RNG.uniform(*esc))
            hechos += 1

    def anillo_lejos(pr, cuantos, r0, r1, z=0.0, esc=(0.8, 1.3)):
        for k in range(cuantos):
            a = k / cuantos * math.tau + RNG.uniform(-0.2, 0.2)
            r = RNG.uniform(r0, r1)
            lote.poner(pr, (math.cos(a) * r, math.sin(a) * r + 10, z if not callable(z) else z()), RNG.uniform(0, math.tau), RNG.uniform(*esc), trozo=(99, 99))

    extra = {}
    if pid == 'valle':
        prs = [P_(f'arbol{k}', lambda c, k=k: arbol(c, k)) for k in range(3)]
        for pr in prs:
            repartir(pr, 55, 2, 45, 2.5)
        repartir(P_('arbusto', lambda c: arbusto(c)), 70, 0.5, 20, 1.0)
        repartir(P_('flores', flores), 90, 0.2, 25, 0.5)
        repartir(P_('girasol', girasol), 60, 1, 14, 0.5)
        repartir(P_('trigal', trigal), 14, 8, 40, 6, esc=(0.9, 1.1))
        repartir(P_('paca', paca), 22, 2, 25, 1.5)
        repartir(P_('roca', lambda c: roca(c)), 30, 1, 35, 1.0)
        repartir(P_('farol', farol_poste), 40, 0.6, 1.2, 0.0, esc=(1, 1))
        casas = [P_(f'casa{k}', lambda c, k=k: casa(c, ('#F4E3C6', '#FBE3A0', '#F7D0C8', '#DCEBD8')[k], ('#C2553E', '#7A5BB8', '#3B6FB6', '#C2553E')[k])) for k in range(4)]
        for k, pr in enumerate(casas):
            repartir(pr, 4, 8, 30, 5, esc=(0.9, 1.1))
        repartir(P_('molino', molino), 2, 20, 45, 9, esc=(1, 1))
        anillo_lejos(P_('montana_v', lambda c: montana(c, False, '#7FAF6A')), 18, 260, 330, esc=(0.9, 1.6))
        anillo_lejos(P_('arbol_lejos', lambda c: arbol(c, 1, 1.6)), 60, 170, 240, esc=(1.2, 1.8))
    elif pid == 'brasa':
        repartir(P_('roca_b', lambda c: roca(c, '#3A2E2E', 1.6)), 90, 1, 45, 1.5, esc=(0.7, 1.8))
        repartir(P_('cristal', cristal_brasa), 45, 1, 30, 1.5)
        repartir(P_('horno', horno), 12, 6, 30, 5, esc=(0.9, 1.1))
        repartir(P_('farol_b', lambda c: farol_poste(c, '#FF9A3A')), 34, 0.6, 1.2, 0.0, esc=(1, 1))
        lote.poner(P_('volcan', volcan), (-20, 230, 0), 0, 1.0)
        anillo_lejos(P_('montana_b', lambda c: montana(c, False, '#3A2C2A')), 16, 250, 330, esc=(0.8, 1.5))
        # ríos de lava sueltos en el paisaje
        for k in range(10):
            i = int(RNG.integers(0, n))
            p = P[i] + N[i] * RNG.choice([-1, 1]) * (hw[i] + hombro[i] + RNG.uniform(14, 30))
            if libre(p[0], p[1], 6):
                lote.poner(P_('charco_lava', lambda c: bola(c, 'charco lava', (0, 0, -0.3), (6, 3.5, 0.5), luz('lava', '#FF6A1A', 4.0), n=3, sub=0)), (p[0], p[1], 0), RNG.uniform(0, 6))
    elif pid == 'nieve':
        for k in range(2):
            repartir(P_(f'pino{k}', lambda c, k=k: pino(c, 1.0 + 0.3 * k)), 90, 1.5, 45, 2.0)
        repartir(P_('muneco', muneco_nieve), 16, 1, 12, 1.0, esc=(0.9, 1.1))
        repartir(P_('cabana', cabana_nieve), 10, 8, 30, 5, esc=(0.9, 1.1))
        repartir(P_('hielo_c', cristal_hielo), 40, 1, 25, 1.0)
        repartir(P_('banco', lambda c: bola(c, 'monticulo nieve', (0, 0, 0), (2.5, 2, 1.0), tela('nieve', '#FFFFFF'), n=3, sub=1)), 60, 1, 40, 1)
        repartir(P_('farol_n', lambda c: farol_poste(c, '#FFE2A0')), 36, 0.6, 1.2, 0.0, esc=(1, 1))
        anillo_lejos(P_('montana_n', lambda c: montana(c, True, '#8A9AB8')), 18, 240, 320, esc=(1.0, 1.8))
        # el lago congelado bajo el tramo de hielo
        for fr in PISTAS['nieve']['hielo']:
            for i in rango(fr, n)[::3]:
                for s in (-1, 1):
                    p = P[i] + N[i] * s * (hw[i] + hombro[i] + 6)
                    lote.poner(P_('lago', lambda c: bola(c, 'lago', (0, 0, 0.0), (8, 8, 0.08), laca('lago hielo', '#BFE6FF', 0.08), n=3, sub=0)), (p[0], p[1], 0.02), 0)
        # arcos de hielo sobre el camino
        for fr in (0.08, 0.33, 0.66):
            i = int(fr * n)
            ang = math.atan2(N[i][1], N[i][0])
            lote.poner(P_(f'arco{i}', lambda c: arco_hielo(c, hw[i] + hombro[i] + 0.5)), tuple(P[i]), ang)
    else:
        repartir(P_('nube_b', lambda c: nube(c)), 60, 6, 70, 4, esc=(1.2, 2.6), zf=lambda i, p: P[i][2] - RNG.uniform(8, 22))
        repartir(P_('nube_r', lambda c: nube(c, '#F7D8E8')), 30, 6, 70, 4, esc=(1.0, 2.2), zf=lambda i, p: P[i][2] - RNG.uniform(6, 18))
        repartir(P_('isla', isla), 12, 16, 60, 10, esc=(0.8, 1.3), zf=lambda i, p: P[i][2] + RNG.uniform(-6, 8))
        repartir(P_('asteroide', asteroide), 40, 8, 70, 4, esc=(0.6, 2.2), zf=lambda i, p: P[i][2] + RNG.uniform(-4, 18))
        # mar de nubes abajo
        mar = P_('mar', lambda c: nube(c, '#E8ECF8'))
        for gx in range(-300, 300, 28):
            for gy in range(-300, 300, 28):
                lote.poner(mar, (gx + RNG.uniform(-8, 8), gy + RNG.uniform(-8, 8), -26 + RNG.uniform(-3, 3)), RNG.uniform(0, 6), RNG.uniform(2.2, 3.4), trozo=(99, 99))
        lote.poner(P_('aurelia', lambda c: luna(c, AURELIA, 40, '#D9A43A')), (-230, 260, 80), 0, 1.0)
        lote.poner(P_('nocturna', lambda c: luna(c, NOCTURNA, 30, '#2B2038')), (260, 210, 60), 0, 1.0)
        lote.poner(P_('esmeralda', lambda c: luna(c, ESMERALDA, 18, '#3A9A60')), (40, 320, 110), 0, 1.0)
        lote.poner(P_('celia', lambda c: luna(c, '#5FA8E0', 160, '#7DB857')), (0, 0, -260), 0, 1.0)
        lote.poner(P_('estacion', estacion), (180, -150, 30), 0.4, 1.0)
        for fr in cfg['anillos']:
            i = int(fr * n)
            ang = math.atan2(N[i][1], N[i][0])
            lote.poner(P_('anillo', lambda c: anillo_turbo(c, 6.5)), tuple(P[i] + up * 1.0), ang)
        extra['anillos'] = [int(fr * n) for fr in cfg['anillos']]

    # --- arco de meta, turbos y rampas (los modelos de carreras_cosas puestos en su sitio)
    ang0 = math.atan2(N[0][1], N[0][0])
    lote.poner(P_('meta', lambda c: arco_meta(c, hw[0] + hombro[0] + 0.8, pid)), tuple(P[0] + up * -0.05), ang0)
    if pid == 'valle':
        g = P_('gradas', gradas)
        i = n - 30
        lote.poner(g, tuple(P[i] + N[i] * (hw[i] + hombro[i] + 6.5) - up * P[i][2] * 0), math.atan2(-N[i][1], -N[i][0]) - math.pi / 2 + math.pi / 2 - math.pi / 2)
    turbo = P_('turbo', lambda c: cc.m_turbo_flecha(c))
    rampa = P_('rampa', lambda c: cc.m_rampa(c))
    turbos, rampas = [], []
    for fr, lat in cfg['turbos']:
        i = int(fr * n)
        ang = math.atan2(T[i][1], T[i][0]) - math.pi / 2 + math.pi
        lote.poner(turbo, tuple(P[i] + N[i] * lat), ang)
        turbos.append([i, lat])
    for fr in cfg['rampas']:
        i = int(fr * n)
        ang = math.atan2(T[i][1], T[i][0]) - math.pi / 2 + math.pi
        lote.poner(rampa, tuple(P[i] - up * 0.02), ang, (1.0, 1, 1))
        rampas.append([i, 0, 2.1])
    cajas = [int(fr * n) for fr in cfg['cajas']]

    coll = clay.collection(f'Pista {pid}')
    objs = lote.crear(coll, pid)
    raiz = bpy.data.objects.new(f'pista_{pid}', None)
    clay.link(raiz, coll)
    for o in objs:
        o.parent = raiz

    # --- JSON del juego (coordenadas de three.js: x, y=z, z=-y)
    datos = dict(
        id=pid, largo=round(float(L), 1), n=n,
        m=[[round(float(P[i][0]), 2), round(float(P[i][2]), 2), round(float(-P[i][1]), 2), round(float(hw[i]), 2), round(float(hombro[i]), 2), int(flags[i])] for i in range(n)],
        cajas=cajas, turbos=turbos, rampas=rampas, **extra,
    )
    if plano:
        dibujar_plano(P, N, hw, hombro, flags, datos, plano)
    print(pid, 'largo', round(L), 'm,', n, 'muestras,', len(objs), 'mallas,', len(lote.mats), 'materiales', flush=True)
    return raiz, datos


def dibujar_plano(P, N, hw, hombro, flags, datos, ruta):
    from PIL import Image, ImageDraw
    W = 900
    lo, hi = P[:, :2].min(0) - 30, P[:, :2].max(0) + 30
    esc = W / max(hi - lo)
    im = Image.new('RGB', (W, W), (40, 60, 40))
    d = ImageDraw.Draw(im)
    f = lambda p: ((p[0] - lo[0]) * esc, W - (p[1] - lo[1]) * esc)  # noqa: E731
    for i in range(len(P)):
        for s in (-1, 1):
            d.point(f(P[i] + N[i] * s * (hw[i] + hombro[i])), fill=(200, 80, 80) if flags[i] & (CAIDA | LAVA) else (220, 220, 220))
        d.point(f(P[i]), fill=(120, 200, 255) if flags[i] & HIELO else (255, 220, 120))
    for i in datos['cajas']:
        x, y = f(P[i])
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(190, 150, 240))
    for i, _ in datos['turbos']:
        x, y = f(P[i])
        d.rectangle((x - 3, y - 3, x + 3, y + 3), fill=(255, 160, 40))
    for i, *_ in datos['rampas']:
        x, y = f(P[i])
        d.rectangle((x - 4, y - 4, x + 4, y + 4), fill=(180, 120, 70))
    x, y = f(P[0])
    d.ellipse((x - 6, y - 6, x + 6, y + 6), outline=(255, 255, 255), width=2)
    d.text((10, 10), f"{datos['id']} {datos['largo']} m", fill=(255, 255, 255))
    im.save(ruta)


RNG = np.random.default_rng(21)


def main(out, ids=None, plano=False):
    os.makedirs(out, exist_ok=True)
    for pid in ids or PISTAS:
        global RNG
        RNG = np.random.default_rng(21 + len(pid))
        clay.reset_scene()
        import tiendas
        tiendas._MATS.clear()
        raiz, datos = construir(pid, os.path.join(out, f'_plano_{pid}.png') if plano else None)
        with open(os.path.join(out, f'carreras_{pid}.json'), 'w') as fh:
            json.dump(datos, fh, separators=(',', ':'))
        from carreras_comun import exportar
        exportar([raiz], os.path.join(out, f'carreras_{pid}.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    plano = '--plano' in args
    args = [a for a in args if a != '--plano']
    main(args[0], args[1].split(',') if len(args) > 1 else None, plano)
