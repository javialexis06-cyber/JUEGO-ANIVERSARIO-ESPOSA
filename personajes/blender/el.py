"""Él: cabello de mechones de plastilina, camiseta negra de punto, pantalón turquesa
holgado y tenis negros de suela blanca.

El cuerpo se modela con campos de distancia (sdf.py): torso, mangas, brazos, manos y
pantalón se funden con uniones suaves, como una figura de plastilina hecha a mano.
"""
import math

import numpy as np

import clay
import cuerpo
import personaje
import sdf
from clay import sph

NAME = 'El'

P = {
    'head_center': (0.0, 0.0, 1.54),
    'head_radii': (0.67, 0.56, 0.645),
    'head_p': 3.3,
    'jowl': 0.0,
    'face_flat': 0.08,
    'chin_flat': 0.0,
    'neck_top': 0.92,
    'neck_r': 0.15,
    'face': {
        'eye_x': 0.35, 'eye_z': 1.4, 'eye_r': (0.113, 0.137), 'eye_depth': 0.05, 'eye_sink': 0.016,
        'shine_offset': (0.03, 0.05), 'shine_r': 0.026,
        'brow': [(0.46, 1.665), (0.375, 1.725), (0.28, 1.715)], 'brow_r': [0.04, 0.05, 0.043],
        'blush': (0.47, 1.245), 'blush_r': (0.12, 0.08),
        'mouth': (0.098, 1.312, 0.066), 'mouth_r': 0.028,
    },
    'ear': {'z': 1.34, 'r': (0.105, 0.145, 0.19), 'out': 0.055, 'y': 0.03, 'yaw': 6},
}

# Proporciones del cuerpo (usadas también por el esqueleto)
SLEEVE_DIR = np.array([math.sin(math.radians(40)), 0.03, -math.cos(math.radians(40))])
ARM_DIR = np.array([math.sin(math.radians(35)), 0.08, -math.cos(math.radians(35))])
JOINT = np.array([0.32, 0.04, 0.79])

B = {
    'pelvis_z': 0.47,
    'leg_top': 0.42,
    'ankle_z': 0.15,
    'arm': {'shoulder': tuple(JOINT), 'hand': (0.5, 0.065, 0.53), 'hand_r': 0.135},
    'shoe': {'x': 0.235},
}


def materials():
    M = clay.material
    m = personaje.common_materials(NAME)
    m['hair'] = M(f'{NAME} | cabello', '#0A0909', rough=0.78, spec=0.25, sheen=0.25, sheen_rough=0.4, sheen_tint='#6E6966',
                  noise=dict(scale=14, strength=0.12, detail=3, distance=0.012),
                  fuzz=dict(scale=130, color='#3A3634', amount=0.8, strength=0.6, distance=0.004))
    m['brow'] = M(f'{NAME} | cejas', '#0C0A0A', rough=0.4, coat=0.2)
    m['shirt'] = M(f'{NAME} | camiseta negra', '#141313', rough=0.88, spec=0.3, sheen=0.3, sheen_rough=0.3, sheen_tint='#8E8A86',
                   ribs=dict(scale=38, strength=0.35, axis='X', distance=0.003),
                   fuzz=dict(scale=150, color='#4E4A48', amount=0.8, strength=0.45, distance=0.003))
    m['rib'] = M(f'{NAME} | resorte camiseta', '#181717', rough=0.88, spec=0.3, sheen=0.3, sheen_tint='#8E8A86',
                 ribs=dict(scale=22, strength=0.6, axis='X', distance=0.004),
                 fuzz=dict(scale=150, color='#4E4A48', amount=0.7, strength=0.35, distance=0.003))
    m['thread_dark'] = M(f'{NAME} | hilo camiseta', '#2C2A29', rough=0.7)
    m['pants'] = M(f'{NAME} | pantalon turquesa', '#0C7590', rough=0.9, spec=0.3, sheen=0.35, sheen_rough=0.3, sheen_tint='#9FD6E0',
                   noise=dict(scale=40, strength=0.12, detail=3, distance=0.01),
                   fuzz=dict(scale=150, color='#3FA6BD', amount=0.6, strength=0.7, distance=0.004))
    m['stitch'] = M(f'{NAME} | pespunte pantalon', '#0A6378', rough=0.7)
    m['upper'] = M(f'{NAME} | tenis lona negra', '#191818', rough=0.75, spec=0.3, sheen=0.25, sheen_tint='#9A9794',
                   fuzz=dict(scale=150, color='#45413F', amount=0.8, strength=0.45, distance=0.003))
    m['sole'] = M(f'{NAME} | suela blanca', '#F4F1EA', rough=0.45, coat=0.15)
    m['outsole'] = M(f'{NAME} | piso de suela', '#1A1919', rough=0.6)
    return m


# --------------------------------------------------------------------------
# Cabello
# --------------------------------------------------------------------------

def hair_cap(coll, head, mats):
    """Casquete que envuelve la cabeza y se 'mete' en la piel en la línea del cabello."""
    hc = np.array(P['head_center'])
    v, f = clay.quad_sphere(18)
    v = clay.superellipsoid_dirs(v, P['head_p'])
    v = v * np.array(P['head_radii'])
    v = personaje.head_shaper(P)(v)
    u = v / np.linalg.norm(v, axis=1)[:, None]
    az = np.degrees(np.arctan2(u[:, 0], -u[:, 1]))  # 0 al frente
    el = np.degrees(np.arcsin(np.clip(u[:, 2], -1, 1)))
    # Línea del cabello según el azimut: alta en la frente, baja en sienes y nuca.
    a = np.abs(az)
    hairline = np.interp(a, [0, 25, 45, 62, 80, 100, 130, 180], [36, 36, 30, 20, 12, -2, -24, -38])
    s = clay.smoothstep(hairline - 6, hairline + 6, el)
    thick = 0.06 + 0.15 * clay.smoothstep(5, 65, el) + 0.04 * clay.smoothstep(90, 180, a) + 0.05 * clay.smoothstep(0, 30, el) * clay.smoothstep(40, 90, a)
    scale = 1 + (thick * s - 0.02 * (1 - s)) / np.linalg.norm(v, axis=1)
    v = v * scale[:, None] + hc
    obj = clay.make_mesh_object(f'{NAME} | cabello base', v, f, coll, material=mats['hair'])
    clay.add_subsurf(obj, 1, 2)
    return obj


def hair_locks(coll, surf, mats):
    hc = np.array(P['head_center'])

    def hp(az, el, lift=0.0):
        loc, nrm = surf.radial(hc, sph(az, el), lift)
        return loc

    L = 0.62  # grosor relativo del mechón (ancho = 2 * radio)
    locks = [
        # (nombre, [(azimut, elevación, altura sobre el casquete)...], radios)
        # Nuca: mechones que caen hacia abajo
        ('nuca 1', [(180, 45, 0.0), (180, 15, 0.03), (179, -8, 0.04), (178, -30, 0.03)], [0.18, 0.22, 0.19, 0.05]),
        ('nuca 2', [(150, 45, 0.0), (152, 15, 0.03), (154, -8, 0.04), (156, -28, 0.03)], [0.17, 0.21, 0.18, 0.05]),
        ('nuca 3', [(-150, 45, 0.0), (-152, 15, 0.03), (-154, -8, 0.04), (-156, -28, 0.03)], [0.17, 0.21, 0.18, 0.05]),
        ('nuca 4', [(122, 45, 0.0), (122, 18, 0.03), (123, -4, 0.04), (124, -22, 0.03)], [0.16, 0.2, 0.17, 0.05]),
        ('nuca 5', [(-122, 45, 0.0), (-122, 18, 0.03), (-123, -4, 0.04), (-124, -22, 0.03)], [0.16, 0.2, 0.17, 0.05]),
        # Lados: puntas hacia abajo sobre las sienes
        ('lado der 1', [(125, 58, 0.02), (104, 36, 0.05), (95, 16, 0.06), (92, 0, 0.05)], [0.16, 0.2, 0.17, 0.06]),
        ('lado der 2', [(88, 68, 0.03), (81, 48, 0.07), (76, 32, 0.08), (73, 20, 0.07)], [0.15, 0.19, 0.16, 0.06]),
        ('lado izq 1', [(-125, 58, 0.02), (-104, 36, 0.05), (-95, 14, 0.06), (-92, -2, 0.05)], [0.16, 0.2, 0.17, 0.06]),
        ('lado izq 2', [(-90, 68, 0.03), (-82, 48, 0.07), (-77, 33, 0.08), (-73, 22, 0.07)], [0.15, 0.19, 0.16, 0.06]),
        # Coronilla: lóbulos redondos con volumen hacia arriba y a la derecha
        ('copete 1', [(-160, 60, 0.02), (-120, 82, 0.08), (30, 86, 0.14), (64, 70, 0.22)], [0.18, 0.24, 0.22, 0.06]),
        ('copete 2', [(165, 55, 0.02), (130, 76, 0.08), (98, 72, 0.13), (86, 57, 0.2)], [0.18, 0.23, 0.2, 0.06]),
        ('copete 3', [(-175, 55, 0.02), (-150, 78, 0.09), (-75, 84, 0.16), (-40, 74, 0.24)], [0.18, 0.23, 0.21, 0.06]),
        ('copete 4', [(-135, 50, 0.02), (-120, 70, 0.08), (-95, 76, 0.13), (-80, 68, 0.2)], [0.16, 0.21, 0.19, 0.05]),
        ('copete 5', [(150, 62, 0.04), (170, 84, 0.1), (10, 88, 0.13), (28, 80, 0.14)], [0.16, 0.21, 0.19, 0.07]),
        # Flequillo: barre de izquierda a derecha sobre la frente
        ('flequillo 0', [(-88, 74, 0.03), (-68, 55, 0.08), (-54, 40, 0.09), (-46, 29, 0.07)], [0.16, 0.21, 0.18, 0.06]),
        ('flequillo 1', [(-62, 82, 0.05), (-39, 56, 0.1), (-11, 39, 0.11), (15, 32, 0.09)], [0.17, 0.23, 0.2, 0.05]),
        ('flequillo 2', [(-18, 86, 0.07), (4, 61, 0.12), (32, 45, 0.13), (52, 38, 0.11)], [0.17, 0.23, 0.2, 0.05]),
        ('flequillo 3', [(30, 86, 0.08), (50, 65, 0.13), (68, 48, 0.13), (78, 34, 0.1)], [0.16, 0.22, 0.19, 0.05]),
    ]
    objs = []
    radial = lambda p: np.array(p) - hc
    for name, path, radii in locks:
        pts = [hp(a, e, l) for a, e, l in path]
        o = clay.sweep(f'{NAME} | mechon {name}', pts, radii, (L, 1.0), coll, mats['hair'], segments=16, samples=8,
                       caps=('round', 'round'), up_fn=radial, flat_bottom=0.6)
        objs.append(o)
    return objs


# --------------------------------------------------------------------------
# Cuerpo (SDF, ver cuerpo.py)
# --------------------------------------------------------------------------

D = {
    'joint': tuple(JOINT), 'sleeve_deg': 40, 'arm_deg': 35,
    'torso': {'c': (0, 0.03, 0.7), 'half': (0.39, 0.27, 0.205), 'r': 0.18, 'taper': 0.6,
              'belly': ((0, -0.05, 0.64), (0.34, 0.25, 0.2)), 'bottom': 0.5},
    'sleeve': {'len': 0.2, 'r': (0.145, 0.15), 'hole': 0.13},
    'neck_hole': ((0, 0.025, 0.93), (0.2, 0.165, 0.11)),
    'shirt_bounds': ((-0.78, -0.4, 0.46), (0.78, 0.42, 1.0)),
    'arm': {'r': (0.12, 0.115), 'hand': (0.135, 0.13, 0.145), 'wrist_t': 0.255, 'hand_t': 0.315, 'dy': 0.08},
    'pants': {'hip_c': (0, 0.03, 0.43), 'hip_half': (0.41, 0.27, 0.11), 'hip_r': 0.1,
              'leg_top': (0.215, 0.03, 0.4), 'leg_bot': (0.232, 0.005, 0.21), 'leg_r': (0.21, 0.222),
              'bulge': ((0.232, 0.0, 0.225), (0.238, 0.225, 0.12)), 'crotch_z': 0.3,
              'bottom': 0.125, 'top': 0.56, 'pockets': True, 'folds': True, 'knee': True, 'fly': True,
              'bounds': ((-0.54, -0.32, 0.09), (0.54, 0.38, 0.58))},
    'shoe': {'x': 0.235},
}


def shirt(coll, mats):
    """Camiseta de punto: torso trapezoidal con barriguita, mangas con abertura,
    cuello acanalado y dobladillos con pespunte."""
    return cuerpo.shirt(coll, mats, NAME, D)[0]


def arms(coll, mats):
    """Brazos rechonchos con la mano de manopla fundida."""
    return cuerpo.arms(coll, mats, NAME, D)


def pants(coll, mats):
    """Pantalón holgado: perneras abombadas, bolsillos, bragueta y pliegues."""
    return cuerpo.pants(coll, mats, NAME, D)


def shoes(coll, mats):
    """Tenis negros redondeados con suela blanca gruesa y reborde en el empeine."""
    return cuerpo.shoes(coll, mats, NAME, D)


def build(coll=None):
    coll = coll or clay.collection(f'{NAME} | modelo')
    mats = materials()
    head = personaje.build_head(coll, P, mats, NAME)
    face, surf = personaje.build_face(coll, head, P, mats, NAME)
    personaje.build_ears(coll, head, P, mats, NAME, surf)
    personaje.build_neck(coll, P, mats, NAME)
    cap = hair_cap(coll, head, mats)
    hair_locks(coll, clay.Surface([head, cap]), mats)
    shirt(coll, mats)
    arms(coll, mats)
    pants(coll, mats)
    shoes(coll, mats)
    return coll
