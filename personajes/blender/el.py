"""Él: cabello de mechones de plastilina, camiseta negra, pantalón turquesa y tenis negros."""
import math

import numpy as np

import clay
import personaje
from clay import sph

NAME = 'El'

P = {
    'head_center': (0.0, 0.0, 1.56),
    'head_radii': (0.665, 0.56, 0.66),
    'head_p': 2.25,
    'jowl': 0.075,
    'face_flat': 0.16,
    'chin_flat': 0.1,
    'neck_top': 0.95,
    'neck_r': 0.14,
    'face': {
        'eye_x': 0.355, 'eye_z': 1.32, 'eye_r': (0.104, 0.126), 'eye_depth': 0.05, 'eye_sink': 0.016,
        'shine_offset': (0.03, 0.05), 'shine_r': 0.025,
        'brow': [(0.49, 1.555), (0.375, 1.628), (0.255, 1.612)], 'brow_r': [0.03, 0.04, 0.034],
        'blush': (0.47, 1.16), 'blush_r': (0.118, 0.078),
        'mouth': (0.088, 1.24, 0.078), 'mouth_r': 0.024,
    },
    'ear': {'z': 1.235, 'r': (0.085, 0.12, 0.175), 'out': 0.04, 'y': 0.06, 'yaw': 16},
}

B = {
    'torso_center': (0.0, 0.03, 0.69),
    'torso_radii': (0.385, 0.275, 0.225),
    'torso_p': 2.9,
    'hem_flare': 0.06,
    'shoulder_drop': 0.13,
    'arm': {'shoulder': (0.33, 0.03, 0.8), 'hand': (0.505, -0.03, 0.585), 'sleeve_r': 0.11, 'sleeve_len': 0.13,
            'arm_r': 0.068, 'hand_r': 0.105},
    'shoe': {'x': 0.19, 'y': -0.05, 'len': 0.48, 'width': 0.31, 'height': 0.2, 'sole_h': 0.065, 'laces': 2},
}


def materials():
    M = clay.material
    m = personaje.common_materials(NAME)
    m['hair'] = M(f'{NAME} | cabello', '#070708', rough=0.55, spec=0.22,
                  noise=dict(scale=70, strength=0.3, detail=10, distance=0.006))
    m['brow'] = M(f'{NAME} | cejas', '#0C0A0A', rough=0.4, coat=0.2)
    m['shirt'] = M(f'{NAME} | camiseta negra', '#161515', rough=0.85, spec=0.3, sheen=0.15, sheen_rough=0.35, sheen_tint='#8E8A86',
                   noise=dict(scale=260, strength=0.35, detail=6, distance=0.004))
    m['rib'] = M(f'{NAME} | resorte camiseta', '#1A1919', rough=0.85, spec=0.3, sheen=0.15, sheen_tint='#8E8A86',
                 ribs=dict(scale=90, strength=0.5, axis='X', distance=0.004))
    m['pants'] = M(f'{NAME} | pantalon turquesa', '#0F7089', rough=0.8, sheen=0.45, sheen_rough=0.4, sheen_tint='#BFE8EE',
                   noise=dict(scale=220, strength=0.35, detail=6, distance=0.004))
    m['stitch'] = M(f'{NAME} | pespunte', '#6CC3D1', rough=0.6)
    m['upper'] = M(f'{NAME} | tenis lona negra', '#1C1B1B', rough=0.7, spec=0.3, sheen=0.15, sheen_tint='#9A9794',
                   noise=dict(scale=180, strength=0.3, distance=0.004))
    m['sole'] = M(f'{NAME} | suela blanca', '#F4F1EA', rough=0.45, coat=0.15)
    m['stitch_shoe'] = M(f'{NAME} | pespunte tenis', '#5A5754', rough=0.6)
    m['lace'] = M(f'{NAME} | cordones', '#1F1E1E', rough=0.6)
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
    hairline = np.interp(a, [0, 25, 45, 62, 80, 100, 130, 180], [34, 34, 24, 8, 2, -8, -26, -38])
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
        ('lado der 1', [(125, 58, 0.02), (100, 34, 0.05), (90, 10, 0.06), (86, -10, 0.05)], [0.16, 0.2, 0.17, 0.05]),
        ('lado der 2', [(85, 68, 0.03), (77, 45, 0.07), (70, 26, 0.08), (67, 10, 0.07)], [0.15, 0.19, 0.16, 0.05]),
        ('lado izq 1', [(-125, 58, 0.02), (-100, 34, 0.05), (-90, 8, 0.06), (-87, -12, 0.05)], [0.16, 0.2, 0.17, 0.05]),
        ('lado izq 2', [(-88, 68, 0.03), (-78, 45, 0.07), (-70, 26, 0.08), (-64, 10, 0.07)], [0.15, 0.19, 0.16, 0.05]),
        # Coronilla: lóbulos redondos con volumen hacia arriba y a la derecha
        ('copete 1', [(-160, 60, 0.02), (-120, 82, 0.08), (30, 86, 0.14), (64, 70, 0.22)], [0.18, 0.24, 0.22, 0.06]),
        ('copete 2', [(165, 55, 0.02), (130, 76, 0.08), (98, 72, 0.13), (86, 57, 0.2)], [0.18, 0.23, 0.2, 0.06]),
        ('copete 3', [(-175, 55, 0.02), (-150, 78, 0.09), (-75, 84, 0.16), (-40, 74, 0.24)], [0.18, 0.23, 0.21, 0.06]),
        ('copete 4', [(-135, 50, 0.02), (-120, 70, 0.08), (-95, 76, 0.13), (-80, 68, 0.2)], [0.16, 0.21, 0.19, 0.05]),
        ('copete 5', [(150, 62, 0.04), (170, 84, 0.1), (10, 88, 0.13), (28, 80, 0.14)], [0.16, 0.21, 0.19, 0.07]),
        # Flequillo: barre de izquierda a derecha sobre la frente
        ('flequillo 0', [(-88, 74, 0.03), (-66, 53, 0.08), (-51, 35, 0.09), (-43, 21, 0.07)], [0.16, 0.21, 0.18, 0.05]),
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
# Pantalón
# --------------------------------------------------------------------------

def pants(coll, mats):
    objs = []
    hip = clay.blob(f'{NAME} | pantalon cadera', (0, 0.03, 0.41), (0.37, 0.265, 0.12), coll, mats['pants'], n=10, p=2.6, subsurf=2)
    objs.append(hip)
    legs = []
    for side, sx in (('izq', -1), ('der', 1)):
        leg = clay.sweep(f'{NAME} | pernera {side}', [(sx * 0.18, 0.03, 0.44), (sx * 0.185, 0.02, 0.28), (sx * 0.19, -0.005, 0.13)],
                         [0.17, 0.172, 0.178], (1.0, 0.93), coll, mats['pants'], segments=20, samples=5, caps=('round', 'flat'))
        legs.append(leg)
        objs.append(leg)
    surf = clay.Surface([hip] + legs)
    for side, sx in (('izq', -1), ('der', 1)):
        cuff = clay.surface_ring(clay.Surface(legs[0 if sx < 0 else 1]), (sx * 0.19, -0.005), 0.15, 20, 0.004)
        objs.append(clay.sweep(f'{NAME} | dobladillo {side}', cuff, 0.024, (1, 1), coll, mats['pants'], segments=8, samples=3, closed=True))
        # Bolsillo delantero: curva desde el dobladillo de la camiseta hacia la costura lateral
        pk = clay.front_stroke(surf, ((sx * 0.2, 0.47), (sx * 0.25, 0.41), (sx * 0.3, 0.378), (sx * 0.34, 0.372)), 0.003)
        objs.append(clay.sweep(f'{NAME} | bolsillo {side}', pk, 0.008, (0.6, 1), coll, mats['stitch'], segments=6, samples=6, up=(0, -1, 0)))
    fly = clay.front_stroke(surf, ((0.0, 0.47), (0.0, 0.38), (0.04, 0.35), (0.075, 0.37), (0.075, 0.47)), 0.003)
    objs.append(clay.sweep(f'{NAME} | costura bragueta', fly, 0.007, (0.6, 1), coll, mats['stitch'], segments=6, samples=5, up=(0, -1, 0)))
    return objs


def build(coll=None, offset=(0, 0, 0)):
    coll = coll or clay.collection(f'{NAME} | modelo')
    mats = materials()
    head = personaje.build_head(coll, P, mats, NAME)
    face, surf = personaje.build_face(coll, head, P, mats, NAME)
    ears = personaje.build_ears(coll, head, P, mats, NAME, surf)
    neck = personaje.build_neck(coll, P, mats, NAME)
    cap = hair_cap(coll, head, mats)
    locks = hair_locks(coll, clay.Surface([head, cap]), mats)
    torso = personaje.build_torso(coll, B, mats['shirt'], NAME)
    tsurf = clay.Surface(torso)
    # Cuello redondo acanalado apoyado sobre los hombros
    ring = []
    for k in range(20):
        a = 2 * math.pi * k / 20
        loc, nrm = tsurf.ray((math.cos(a) * 0.175, 0.03 + math.sin(a) * 0.155, 3.0), (0, 0, -1))
        ring.append(loc)
    clay.sweep(f'{NAME} | cuello camiseta', ring, 0.034, (1, 1), coll, mats['rib'], segments=10, samples=3, closed=True)
    hem = clay.surface_ring(tsurf, (0, 0.03), 0.5, 28, -0.004)
    clay.sweep(f'{NAME} | dobladillo camiseta', hem, 0.03, (1, 0.8), coll, mats['shirt'], segments=10, samples=3, closed=True)
    for side, sx in (('izq', -1), ('der', 1)):
        personaje.build_arm(coll, B, mats, NAME, side, sx, mats['shirt'], band_mat=mats['rib'])
        personaje.build_sneaker(coll, B['shoe'], mats, NAME, side, sx)
    pants(coll, mats)
    return coll
