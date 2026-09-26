"""Ella: cabello largo liso con raya al centro, camiseta beige de punto, chaleco negro
sin mangas con solapas y bolsillos, shorts negros, medias negras, tenis blancos con
cordones y manilla dorada.

Usa el mismo sistema aprobado en Él: cabeza cuadradita redondeada, cuerpo gordito
modelado con SDF (cuerpo.py) y texturas de fieltro/felpa.
"""
import math

import numpy as np

import clay
import cuerpo
import personaje
from clay import sph

NAME = 'Ella'

P = {
    'head_center': (0.0, 0.0, 1.62),
    'head_radii': (0.66, 0.56, 0.645),
    'head_p': 3.3,
    'jowl': 0.0,
    'face_flat': 0.08,
    'chin_flat': 0.0,
    'neck_top': 1.0,
    'neck_r': 0.14,
    'face': {
        'eye_x': 0.345, 'eye_z': 1.48, 'eye_r': (0.113, 0.137), 'eye_depth': 0.05, 'eye_sink': 0.016,
        'shine_offset': (0.03, 0.05), 'shine_r': 0.026,
        'brow': [(0.455, 1.745), (0.37, 1.805), (0.275, 1.795)], 'brow_r': [0.034, 0.043, 0.037],
        'blush': (0.465, 1.325), 'blush_r': (0.12, 0.08),
        'mouth': (0.095, 1.392, 0.064), 'mouth_r': 0.027,
    },
    'ear': {'z': 1.42, 'r': (0.1, 0.14, 0.185), 'out': 0.05, 'y': 0.03, 'yaw': 6},
}

JOINT = np.array([0.31, 0.04, 0.87])

D = {
    'joint': tuple(JOINT), 'sleeve_deg': 40, 'arm_deg': 33,
    'torso': {'c': (0, 0.03, 0.78), 'half': (0.37, 0.26, 0.2), 'r': 0.17, 'taper': 0.6,
              'belly': ((0, -0.04, 0.72), (0.32, 0.24, 0.19)), 'bottom': 0.58},
    'sleeve': {'len': 0.19, 'r': (0.14, 0.145), 'hole': 0.125},
    'neck_hole': ((0, 0.025, 1.01), (0.19, 0.16, 0.11)),
    'collar_r': (0.165, 0.138),
    'shirt_hem': False,
    'shirt_bounds': ((-0.76, -0.4, 0.54), (0.76, 0.42, 1.08)),
    'vest': {'c': (0, 0.03, 0.76), 'half': (0.395, 0.285, 0.25), 'r': 0.2, 'taper': 0.55,
             'belly': ((0, -0.055, 0.7), (0.34, 0.262, 0.2)), 'armhole': 0.158,
             'neck': ((0, 0.02, 1.03), (0.23, 0.2, 0.13)),
             'opening': [(0.5, 0.05), (0.62, 0.05), (0.72, 0.07), (0.84, 0.13), (0.94, 0.19), (1.1, 0.22)],
             'open_y': -0.02, 'bottom': 0.5,
             'lapel': [(0.985, 0.075), (0.95, 0.08), (0.9, 0.07), (0.85, 0.05), (0.8, 0.03), (0.765, 0.012)],
             'pocket': (0.25, 0.6),
             'bounds': ((-0.82, -0.44, 0.46), (0.82, 0.46, 1.08))},
    'arm': {'r': (0.112, 0.108), 'hand': (0.128, 0.123, 0.138), 'wrist_t': 0.245, 'hand_t': 0.305, 'dy': 0.08},
    'pants': {'hip_c': (0, 0.03, 0.53), 'hip_half': (0.39, 0.265, 0.1), 'hip_r': 0.09,
              'leg_top': (0.205, 0.03, 0.5), 'leg_bot': (0.215, 0.01, 0.4), 'leg_r': (0.2, 0.205),
              'crotch_z': 0.47, 'bottom': 0.37, 'bottom_k': 0.02, 'top': 0.62,
              'pockets': False, 'folds': True, 'knee': False, 'fly': False, 'cuffs': True,
              'bounds': ((-0.5, -0.32, 0.33), (0.5, 0.36, 0.64))},
    'legs': {'x': 0.2, 'y': 0.0, 'top': 0.46, 'ankle': 0.2, 'r': (0.1, 0.095), 'sock_top': 0.29, 'sock_r': 0.1},
    'shoe': {'x': 0.215, 'scale': 0.95, 'laces': True},
}

# Datos que usa el esqueleto (rig.py)
B = {
    'pelvis_z': 0.55,
    'leg_top': 0.5,
    'ankle_z': 0.15,
    'arm': {'shoulder': tuple(JOINT), 'hand': (0.476, 0.065, 0.614), 'hand_r': 0.128},
    'shoe': {'x': 0.215},
}


def materials():
    M = clay.material
    m = personaje.common_materials(NAME)
    m['hair'] = M(f'{NAME} | cabello', '#0A0909', rough=0.72, spec=0.25, sheen=0.25, sheen_rough=0.4, sheen_tint='#6E6966',
                  strands=dict(scale=3.2, strength=0.35, distortion=0.5, distance=0.02),
                  fuzz=dict(scale=130, color='#3A3634', amount=0.8, strength=0.5, distance=0.004))
    m['hair_cap'] = M(f'{NAME} | cabello base', '#0A0909', rough=0.72, spec=0.25, sheen=0.25, sheen_rough=0.4, sheen_tint='#6E6966',
                      noise=dict(scale=14, strength=0.1, detail=3, distance=0.012),
                      fuzz=dict(scale=130, color='#3A3634', amount=0.8, strength=0.5, distance=0.004))
    m['brow'] = M(f'{NAME} | cejas', '#0C0A0A', rough=0.4, coat=0.2)
    m['shirt'] = M(f'{NAME} | camiseta beige', '#9C8676', rough=0.88, spec=0.3, sheen=0.3, sheen_rough=0.3, sheen_tint='#E8DCCF',
                   ribs=dict(scale=38, strength=0.4, axis='X', distance=0.003),
                   fuzz=dict(scale=150, color='#C4B2A4', amount=0.6, strength=0.3, distance=0.003))
    m['rib'] = M(f'{NAME} | resorte camiseta', '#94806F', rough=0.88, spec=0.3, sheen=0.3, sheen_tint='#E8DCCF',
                 ribs=dict(scale=22, strength=0.6, axis='X', distance=0.004),
                 fuzz=dict(scale=150, color='#C4B2A4', amount=0.5, strength=0.25, distance=0.003))
    m['thread_dark'] = M(f'{NAME} | hilo', '#6E5E52', rough=0.7)
    m['vest'] = M(f'{NAME} | chaleco negro', '#151414', rough=0.88, spec=0.3, sheen=0.3, sheen_rough=0.3, sheen_tint='#8E8A86',
                  fuzz=dict(scale=150, color='#4A4644', amount=0.8, strength=0.45, distance=0.003))
    m['pants'] = M(f'{NAME} | shorts negros', '#181717', rough=0.88, spec=0.3, sheen=0.3, sheen_rough=0.3, sheen_tint='#8E8A86',
                   fuzz=dict(scale=150, color='#4A4644', amount=0.8, strength=0.5, distance=0.003))
    m['stitch'] = M(f'{NAME} | pespunte shorts', '#3A3634', rough=0.7)
    m['sock'] = M(f'{NAME} | medias negras', '#161515', rough=0.88, spec=0.3, sheen=0.3, sheen_tint='#7F7B78',
                  ribs=dict(scale=45, strength=0.5, axis='X', distance=0.003),
                  fuzz=dict(scale=150, color='#45413F', amount=0.6, strength=0.3, distance=0.003))
    m['upper'] = M(f'{NAME} | tenis blancos', '#EFEBE4', rough=0.8, spec=0.3, sheen=0.25, sheen_tint='#FFFFFF',
                   fuzz=dict(scale=150, color='#D6D0C6', amount=0.6, strength=0.35, distance=0.003))
    m['sole'] = M(f'{NAME} | suela blanca', '#FAF8F3', rough=0.45, coat=0.15)
    m['outsole'] = M(f'{NAME} | piso de suela', '#CFCAC2', rough=0.6)
    m['lace'] = M(f'{NAME} | cordones', '#F6F3EE', rough=0.7)
    m['gold'] = M(f'{NAME} | manilla dorada', '#D9A94E', rough=0.22, metallic=1.0)
    return m


# --------------------------------------------------------------------------
# Cabello largo con raya al centro
# --------------------------------------------------------------------------

def hair_cap(coll, head, mats):
    hc = np.array(P['head_center'])
    v, f = clay.quad_sphere(20)
    v = clay.superellipsoid_dirs(v, P['head_p'])
    v = v * np.array(P['head_radii'])
    v = personaje.head_shaper(P)(v)
    u = v / np.linalg.norm(v, axis=1)[:, None]
    az = np.degrees(np.arctan2(u[:, 0], -u[:, 1]))
    el = np.degrees(np.arcsin(np.clip(u[:, 2], -1, 1)))
    a = np.abs(az)
    hairline = np.interp(a, [0, 12, 30, 50, 70, 90, 120, 180], [54, 50, 40, 26, 12, 0, -24, -48])
    s = clay.smoothstep(hairline - 5, hairline + 5, el)
    thick = 0.05 + 0.09 * clay.smoothstep(10, 70, el)
    # Surco de la raya al centro (plano x≈0, en la mitad superior)
    part = np.exp(-(v[:, 0] / 0.05) ** 2) * clay.smoothstep(30, 55, el)
    thick = thick * (1 - 0.75 * part)
    scale = 1 + (thick * s - 0.02 * (1 - s)) / np.linalg.norm(v, axis=1)
    v = v * scale[:, None] + hc
    obj = clay.make_mesh_object(f'{NAME} | cabello base', v, f, coll, material=mats['hair_cap'])
    clay.add_subsurf(obj, 1, 2)
    return obj


def hair_locks(coll, surf, mats):
    hc = np.array(P['head_center'])

    def hp(az, el, lift=0.0):
        loc, nrm = surf.radial(hc, sph(az, el), lift)
        return loc

    L = 0.42
    objs = []
    for side, sx in (('izq', -1), ('der', 1)):
        locks = [
            # Mechón que enmarca la cara: de la raya a la sien, detrás de la oreja y hasta la cintura.
            ('marco', [('h', 2, 56, 0.0), ('h', 24, 50, 0.04), ('h', 48, 37, 0.06), ('h', 72, 22, 0.07), ('h', 100, 8, 0.07),
                       ('w', 0.72, 0.3, 1.12), ('w', 0.76, 0.3, 0.82), ('w', 0.72, 0.28, 0.6)], [0.13, 0.19, 0.21, 0.2, 0.19, 0.19, 0.18, 0.1]),
            ('lado 1', [('h', 3, 66, 0.0), ('h', 35, 58, 0.05), ('h', 70, 40, 0.07), ('h', 110, 14, 0.08),
                        ('w', 0.72, 0.42, 1.06), ('w', 0.76, 0.42, 0.78), ('w', 0.7, 0.4, 0.55)], [0.14, 0.2, 0.21, 0.21, 0.2, 0.19, 0.1]),
            ('lado 2', [('h', 5, 78, 0.0), ('h', 60, 62, 0.05), ('h', 104, 34, 0.07), ('h', 124, 4, 0.08),
                        ('w', 0.62, 0.52, 1.02), ('w', 0.67, 0.45, 0.74), ('w', 0.6, 0.42, 0.52)], [0.14, 0.2, 0.21, 0.21, 0.2, 0.19, 0.1]),
            ('atras 1', [('h', 174, 80, 0.0), ('h', 145, 56, 0.05), ('h', 140, 22, 0.07), ('h', 141, -12, 0.07),
                         ('w', 0.44, 0.6, 0.98), ('w', 0.45, 0.6, 0.7), ('w', 0.4, 0.55, 0.5)], [0.15, 0.21, 0.22, 0.21, 0.2, 0.19, 0.1]),
            ('atras 2', [('h', 176, 60, 0.0), ('h', 170, 30, 0.05), ('h', 168, 0, 0.07), ('h', 167, -26, 0.07),
                         ('w', 0.16, 0.66, 0.98), ('w', 0.17, 0.64, 0.7), ('w', 0.15, 0.58, 0.49)], [0.15, 0.21, 0.22, 0.21, 0.2, 0.19, 0.1]),
        ]
        for name, path, radii in locks:
            pts = []
            for p in path:
                if p[0] == 'h':
                    pts.append(hp(sx * p[1], p[2], p[3]))
                else:
                    pts.append(np.array([sx * p[1], p[2], p[3]]))

            def up_fn(q, sx=sx):
                q = np.array(q)
                if q[2] > hc[2] - 0.35:
                    return q - hc
                # Parte colgante: la cara ancha del mechón mira hacia fuera del cuerpo
                d = np.array([q[0], q[1] - 0.2, 0.0])
                return d
            o = clay.sweep(f'{NAME} | mechon {name} {side}', pts, radii, (L, 1.0), coll, mats['hair'], segments=16, samples=7,
                           caps=('round', 'round'), up_fn=up_fn, flat_bottom=0.6)
            objs.append(o)
    return objs


def build(coll=None):
    coll = coll or clay.collection(f'{NAME} | modelo')
    mats = materials()
    head = personaje.build_head(coll, P, mats, NAME)
    face, surf = personaje.build_face(coll, head, P, mats, NAME)
    personaje.build_ears(coll, head, P, mats, NAME, surf)
    personaje.build_neck(coll, P, mats, NAME)
    cap = hair_cap(coll, head, mats)
    hair_locks(coll, clay.Surface([head, cap]), mats)
    cuerpo.shirt(coll, mats, NAME, D)
    cuerpo.vest(coll, mats, NAME, D)
    cuerpo.arms(coll, mats, NAME, D, bracelet_side='izq')
    cuerpo.pants(coll, mats, NAME, D)
    cuerpo.legs(coll, mats, NAME, D)
    cuerpo.shoes(coll, mats, NAME, D)
    return coll
