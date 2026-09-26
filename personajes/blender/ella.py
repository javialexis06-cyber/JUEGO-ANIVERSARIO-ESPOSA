"""Ella: cabello largo liso con raya al centro, camiseta beige acanalada, chaleco negro
con solapas y bolsillos, shorts negros, medias negras, tenis blancos y manilla dorada."""
import math

import numpy as np

import clay
import personaje
from clay import sph

NAME = 'Ella'

P = {
    'head_center': (0.0, 0.0, 1.63),
    'head_radii': (0.64, 0.55, 0.645),
    'head_p': 2.2,
    'jowl': 0.07,
    'face_flat': 0.16,
    'chin_flat': 0.1,
    'neck_top': 1.02,
    'neck_r': 0.13,
    'face': {
        'eye_x': 0.34, 'eye_z': 1.39, 'eye_r': (0.104, 0.126), 'eye_depth': 0.05, 'eye_sink': 0.016,
        'shine_offset': (0.03, 0.05), 'shine_r': 0.025,
        'brow': [(0.465, 1.625), (0.355, 1.695), (0.245, 1.678)], 'brow_r': [0.028, 0.038, 0.032],
        'blush': (0.455, 1.23), 'blush_r': (0.115, 0.076),
        'mouth': (0.09, 1.315, 0.078), 'mouth_r': 0.024,
    },
    'ear': {'z': 1.3, 'r': (0.08, 0.115, 0.165), 'out': 0.035, 'y': 0.06, 'yaw': 16},
}

B = {
    'torso_center': (0.0, 0.03, 0.78),
    'torso_radii': (0.33, 0.245, 0.205),
    'torso_p': 2.8,
    'hem_flare': 0.05,
    'shoulder_drop': 0.13,
    'arm': {'shoulder': (0.29, 0.03, 0.885), 'hand': (0.475, -0.04, 0.625), 'sleeve_r': 0.1, 'sleeve_len': 0.12,
            'arm_r': 0.064, 'hand_r': 0.1},
    'shoe': {'x': 0.175, 'y': -0.04, 'len': 0.44, 'width': 0.29, 'height': 0.19, 'sole_h': 0.062, 'laces': 2},
}


def materials():
    M = clay.material
    m = personaje.common_materials(NAME)
    m['hair'] = M(f'{NAME} | cabello', '#070708', rough=0.52, spec=0.22,
                  noise=dict(scale=90, strength=0.15, detail=8, distance=0.004),
                  strands=dict(scale=3.2, strength=0.5, distortion=0.5, distance=0.02))
    m['hair_cap'] = M(f'{NAME} | cabello base', '#070708', rough=0.52, spec=0.22,
                      noise=dict(scale=90, strength=0.15, detail=8, distance=0.004))
    m['brow'] = M(f'{NAME} | cejas', '#0C0A0A', rough=0.4, coat=0.2)
    m['shirt'] = M(f'{NAME} | camiseta beige', '#9E8A7B', rough=0.85, sheen=0.5, sheen_rough=0.35, sheen_tint='#E8DCCF',
                   ribs=dict(scale=140, strength=0.45, axis='X', distance=0.004),
                   noise=dict(scale=300, strength=0.2, distance=0.003))
    m['vest'] = M(f'{NAME} | chaleco negro', '#141313', rough=0.8, spec=0.3, sheen=0.15, sheen_rough=0.35, sheen_tint='#8A8683',
                  noise=dict(scale=240, strength=0.3, detail=6, distance=0.004))
    m['shorts'] = M(f'{NAME} | shorts negros', '#161515', rough=0.82, spec=0.3, sheen=0.15, sheen_tint='#8A8683',
                    noise=dict(scale=240, strength=0.3, detail=6, distance=0.004))
    m['sock'] = M(f'{NAME} | medias negras', '#151414', rough=0.85, spec=0.3, sheen=0.15, sheen_tint='#7F7B78',
                  ribs=dict(scale=160, strength=0.4, axis='X', distance=0.003))
    m['upper'] = M(f'{NAME} | tenis blancos', '#F1EEE8', rough=0.6, sheen=0.3, sheen_tint='#FFFFFF',
                   noise=dict(scale=180, strength=0.2, distance=0.003))
    m['sole'] = M(f'{NAME} | suela blanca', '#FAF8F3', rough=0.45, coat=0.15)
    m['lace'] = M(f'{NAME} | cordones', '#E4E0D9', rough=0.6)
    m['stitch_shoe'] = M(f'{NAME} | pespunte tenis', '#CFCAC2', rough=0.6)
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
    hairline = np.interp(a, [0, 12, 30, 50, 70, 90, 120, 180], [40, 38, 30, 16, 4, -6, -24, -48])
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
            ('marco', [('h', 2, 43, 0.0), ('h', 22, 37, 0.04), ('h', 46, 24, 0.06), ('h', 66, 6, 0.07), ('h', 82, -12, 0.07),
                       ('w', 0.75, 0.1, 1.08), ('w', 0.76, 0.12, 0.82), ('w', 0.71, 0.12, 0.6)], [0.13, 0.19, 0.21, 0.2, 0.19, 0.19, 0.18, 0.1]),
            ('lado 1', [('h', 3, 60, 0.0), ('h', 35, 50, 0.05), ('h', 66, 30, 0.07), ('h', 92, 4, 0.08),
                        ('w', 0.77, 0.26, 1.06), ('w', 0.78, 0.28, 0.78), ('w', 0.72, 0.27, 0.55)], [0.14, 0.2, 0.21, 0.21, 0.2, 0.19, 0.1]),
            ('lado 2', [('h', 5, 78, 0.0), ('h', 60, 62, 0.05), ('h', 100, 34, 0.07), ('h', 116, 4, 0.08),
                        ('w', 0.66, 0.44, 1.02), ('w', 0.67, 0.45, 0.74), ('w', 0.6, 0.42, 0.52)], [0.14, 0.2, 0.21, 0.21, 0.2, 0.19, 0.1]),
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


# --------------------------------------------------------------------------
# Ropa
# --------------------------------------------------------------------------

def vest(coll, mats, torso):
    """Chaleco sin mangas abierto al frente, con solapas y bolsillos con tapa."""
    c = np.array((0.0, 0.03, 0.75))
    R = np.array((0.352, 0.268, 0.25))
    v, f = clay.quad_sphere(24)
    v = clay.superellipsoid_dirs(v, 2.8)
    v = v * R
    v = personaje.torso_shaper({'torso_radii': R, 'hem_flare': 0.07, 'shoulder_drop': 0.13})(v)
    v = v + c
    keep = []
    for face in f:
        cen = v[list(face)].mean(axis=0)
        x, y, z = cen
        opening = np.interp(z, [0.5, 0.62, 0.74, 0.86, 0.96, 1.1], [0.07, 0.06, 0.075, 0.13, 0.2, 0.2])
        if y < 0 and abs(x) < opening:
            continue
        if z < 0.525:
            continue
        if z > 0.955 and abs(x) < 0.21:
            continue
        keep.append(face)
    # Suavizar los bordes (evitar escalones al borrar caras): llevar los vértices del
    # borde exactamente sobre la curva de la abertura y del dobladillo.
    edge_count = {}
    for face in keep:
        for i in range(len(face)):
            e = tuple(sorted((face[i], face[(i + 1) % len(face)])))
            edge_count[e] = edge_count.get(e, 0) + 1
    boundary = {i for e, n in edge_count.items() if n == 1 for i in e}
    for i in boundary:
        x, y, z = v[i]
        if z < 0.56:
            v[i][2] = 0.525
        elif y < 0 and z < 0.94 and abs(x) < 0.3:
            op = np.interp(z, [0.5, 0.62, 0.74, 0.86, 0.96, 1.1], [0.07, 0.06, 0.075, 0.13, 0.2, 0.2])
            v[i][0] = math.copysign(op, x)
    obj = clay.make_mesh_object(f'{NAME} | chaleco', v, keep, coll, material=mats['vest'])
    clay.add_solidify(obj, 0.022, 1.0)
    clay.add_subsurf(obj, 1, 2)
    objs = [obj]
    vs = clay.Surface(obj)
    for side, sx in (('izq', -1), ('der', 1)):
        # Solapa: tira plana apoyada sobre el chaleco, ancha arriba y en punta abajo
        edge = []
        widths = []
        for z, w in ((0.955, 0.075), (0.91, 0.08), (0.86, 0.07), (0.81, 0.05), (0.765, 0.03), (0.735, 0.012)):
            op = np.interp(z, [0.74, 0.86, 0.96], [0.075, 0.13, 0.2])
            loc, nrm = vs.front(sx * (op + w * 0.9), z)
            if loc is not None:
                edge.append(loc + nrm * 0.018)
                widths.append(w)
        objs.append(clay.sweep(f'{NAME} | solapa {side}', edge, widths, (0.22, 1.0), coll, mats['vest'],
                               segments=12, samples=6, up_fn=lambda q: vs.nearest(q)[1], caps=('round', 'round')))
        # Bolsillo con tapa
        loc, nrm = vs.front(sx * 0.2, 0.6)
        if loc is not None:
            flap = clay.blob(f'{NAME} | tapa bolsillo {side}', (0, 0, 0), (0.085, 0.012, 0.028), coll, mats['vest'], n=6, p=4, subsurf=2)
            flap.location = loc + nrm * 0.01
            clay.orient_to(flap, nrm)
            objs.append(flap)
    return objs


def shorts(coll, mats):
    objs = []
    hip = clay.blob(f'{NAME} | shorts cadera', (0, 0.03, 0.53), (0.33, 0.25, 0.1), coll, mats['shorts'], n=10, p=2.6, subsurf=2)
    objs.append(hip)
    for side, sx in (('izq', -1), ('der', 1)):
        leg = clay.sweep(f'{NAME} | pierna short {side}', [(sx * 0.165, 0.03, 0.55), (sx * 0.172, 0.025, 0.45), (sx * 0.178, 0.02, 0.38)],
                         [0.158, 0.16, 0.166], (1.0, 0.93), coll, mats['shorts'], segments=20, samples=4, caps=('round', 'flat'))
        objs.append(leg)
        cuff = clay.surface_ring(clay.Surface(leg), (sx * 0.178, 0.02), 0.395, 20, 0.004)
        objs.append(clay.sweep(f'{NAME} | dobladillo short {side}', cuff, 0.026, (1, 1), coll, mats['shorts'], segments=8, samples=3, closed=True))
    return objs


def legs(coll, mats):
    objs = []
    for side, sx in (('izq', -1), ('der', 1)):
        objs.append(clay.sweep(f'{NAME} | pierna {side}', [(sx * 0.175, 0.0, 0.44), (sx * 0.175, -0.02, 0.2)], [0.092, 0.088], (1, 1), coll,
                               mats['skin'], segments=16, samples=3, caps=('flat', 'flat')))
        sock = clay.sweep(f'{NAME} | media {side}', [(sx * 0.175, -0.02, 0.1), (sx * 0.175, -0.02, 0.27)], [0.098, 0.098], (1, 1), coll,
                          mats['sock'], segments=16, samples=3, caps=('flat', 'flat'))
        objs.append(sock)
        cuff = []
        for k in range(16):
            a = 2 * math.pi * k / 16
            cuff.append((sx * 0.175 + math.cos(a) * 0.1, -0.02 + math.sin(a) * 0.1, 0.268))
        objs.append(clay.sweep(f'{NAME} | puño media {side}', cuff, 0.018, (1, 1), coll, mats['sock'], segments=8, samples=3, closed=True))
    return objs


def build(coll=None):
    coll = coll or clay.collection(f'{NAME} | modelo')
    mats = materials()
    head = personaje.build_head(coll, P, mats, NAME)
    face, surf = personaje.build_face(coll, head, P, mats, NAME)
    ears = personaje.build_ears(coll, head, P, mats, NAME, surf)
    neck = personaje.build_neck(coll, P, mats, NAME)
    cap = hair_cap(coll, head, mats)
    hair_locks(coll, clay.Surface([head, cap]), mats)
    torso = personaje.build_torso(coll, B, mats['shirt'], NAME)
    tsurf = clay.Surface(torso)
    ring = []
    for k in range(20):
        a = 2 * math.pi * k / 20
        loc, nrm = tsurf.ray((math.cos(a) * 0.16, 0.03 + math.sin(a) * 0.145, 3.0), (0, 0, -1))
        ring.append(loc)
    clay.sweep(f'{NAME} | cuello camiseta', ring, 0.028, (1, 1), coll, mats['shirt'], segments=10, samples=3, closed=True)
    vest(coll, mats, torso)
    for side, sx in (('izq', -1), ('der', 1)):
        personaje.build_arm(coll, B, mats, NAME, side, sx, mats['shirt'], band_mat=mats['shirt'],
                            bracelet_mat=mats['gold'] if sx < 0 else None)
        personaje.build_sneaker(coll, B['shoe'], mats, NAME, side, sx)
    shorts(coll, mats)
    legs(coll, mats)
    return coll
