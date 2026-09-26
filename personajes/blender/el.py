"""Él: cabello de mechones de plastilina, camiseta negra de punto, pantalón turquesa
holgado y tenis negros de suela blanca.

El cuerpo se modela con campos de distancia (sdf.py): torso, mangas, brazos, manos y
pantalón se funden con uniones suaves, como una figura de plastilina hecha a mano.
"""
import math

import numpy as np

import clay
import personaje
import sdf
from clay import sph

NAME = 'El'

P = {
    'head_center': (0.0, 0.0, 1.53),
    'head_radii': (0.71, 0.57, 0.655),
    'head_p': 2.6,
    'jowl': 0.2,
    'jowl_band': (0.25, -0.45, -0.72, -1.0),
    'top_narrow': 0.05,
    'face_flat': 0.12,
    'chin_flat': 0.14,
    'neck_top': 0.92,
    'neck_r': 0.15,
    'face': {
        'eye_x': 0.36, 'eye_z': 1.39, 'eye_r': (0.113, 0.137), 'eye_depth': 0.05, 'eye_sink': 0.016,
        'shine_offset': (0.03, 0.05), 'shine_r': 0.026,
        'brow': [(0.47, 1.655), (0.385, 1.715), (0.29, 1.705)], 'brow_r': [0.04, 0.05, 0.043],
        'blush': (0.475, 1.235), 'blush_r': (0.12, 0.08),
        'mouth': (0.085, 1.31, 0.09), 'mouth_r': 0.028,
    },
    'ear': {'z': 1.33, 'r': (0.105, 0.145, 0.19), 'out': 0.055, 'y': 0.03, 'yaw': 6},
}

# Proporciones del cuerpo (usadas también por el esqueleto)
SLEEVE_DIR = np.array([math.sin(math.radians(40)), 0.03, -math.cos(math.radians(40))])
ARM_DIR = np.array([math.sin(math.radians(35)), 0.08, -math.cos(math.radians(35))])
JOINT = np.array([0.26, 0.04, 0.8])

B = {
    'pelvis_z': 0.47,
    'leg_top': 0.42,
    'ankle_z': 0.15,
    'arm': {'shoulder': tuple(JOINT), 'hand': (0.44, 0.065, 0.54), 'hand_r': 0.12},
    'shoe': {'x': 0.2},
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
    hairline = np.interp(a, [0, 25, 45, 62, 80, 100, 130, 180], [40, 39, 33, 24, 18, 8, -18, -36])
    s = clay.smoothstep(hairline - 6, hairline + 6, el)
    thick = 0.07 + 0.2 * clay.smoothstep(5, 65, el) + 0.04 * clay.smoothstep(90, 180, a) + 0.07 * clay.smoothstep(0, 30, el) * clay.smoothstep(40, 90, a)
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

    L = 0.66  # grosor relativo del lóbulo (ancho = 2 * radio)
    # Lóbulos tipo "coma": raíz ancha pegada al casquete y punta redondeada que se levanta.
    locks = [
        # Nuca
        ('nuca 1', [(180, 40, 0.0), (180, 10, 0.05), (179, -20, 0.04)], [0.2, 0.22, 0.1]),
        ('nuca 2', [(150, 40, 0.0), (152, 10, 0.05), (154, -18, 0.04)], [0.19, 0.21, 0.1]),
        ('nuca 3', [(-150, 40, 0.0), (-152, 10, 0.05), (-154, -18, 0.04)], [0.19, 0.21, 0.1]),
        ('nuca 4', [(125, 40, 0.0), (125, 16, 0.05), (126, -6, 0.04)], [0.18, 0.2, 0.09]),
        ('nuca 5', [(-125, 40, 0.0), (-125, 16, 0.05), (-126, -6, 0.04)], [0.18, 0.2, 0.09]),
        # Lados: cubren la sien, abultados hacia fuera, y terminan arriba de la oreja
        ('lado der 1', [(118, 56, 0.0), (102, 38, 0.11), (95, 22, 0.11)], [0.19, 0.22, 0.12]),
        ('lado der 2', [(92, 62, 0.03), (82, 46, 0.11), (75, 32, 0.1)], [0.18, 0.21, 0.11]),
        ('lado izq 1', [(-118, 56, 0.0), (-102, 38, 0.12), (-95, 20, 0.12)], [0.19, 0.22, 0.12]),
        ('lado izq 2', [(-94, 62, 0.03), (-84, 46, 0.12), (-77, 32, 0.1)], [0.18, 0.21, 0.11]),
        # Coronilla: lóbulos grandes y redondos (silueta abultada, sin picos)
        ('copete centro', [(165, 62, 0.0), (180, 86, 0.09), (0, 80, 0.13), (-15, 70, 0.14)], [0.2, 0.25, 0.23, 0.12]),
        ('copete izq', [(-150, 55, 0.0), (-115, 74, 0.09), (-82, 68, 0.13)], [0.2, 0.24, 0.12]),
        ('copete der', [(150, 55, 0.0), (112, 74, 0.09), (72, 70, 0.13)], [0.2, 0.24, 0.12]),
        ('copete punta der', [(128, 46, 0.02), (100, 58, 0.09), (86, 62, 0.15)], [0.17, 0.2, 0.09]),
        ('copete atras', [(-170, 58, 0.0), (160, 78, 0.1), (130, 70, 0.13)], [0.19, 0.23, 0.11]),
        # Flequillo: tres lóbulos gordos que barren hacia la derecha, con puntas romas
        ('flequillo 0', [(-86, 62, 0.02), (-72, 47, 0.08), (-60, 34, 0.07)], [0.18, 0.21, 0.12]),
        ('flequillo 1', [(-58, 68, 0.02), (-36, 49, 0.09), (-12, 36, 0.07)], [0.19, 0.24, 0.13]),
        ('flequillo 2', [(-26, 74, 0.04), (0, 52, 0.1), (26, 37, 0.08)], [0.2, 0.25, 0.13]),
        ('flequillo 3', [(10, 76, 0.05), (36, 55, 0.1), (60, 40, 0.09)], [0.19, 0.24, 0.12]),
    ]
    objs = []
    radial = lambda p: np.array(p) - hc
    for name, path, radii in locks:
        pts = [hp(a, e, l) for a, e, l in path]
        o = clay.sweep(f'{NAME} | mechon {name}', pts, radii, (L, 1.0), coll, mats['hair'], segments=18, samples=10,
                       caps=('round', 'round'), up_fn=radial, flat_bottom=0.55)
        objs.append(o)
    return objs


# --------------------------------------------------------------------------
# Cuerpo (SDF)
# --------------------------------------------------------------------------

def shirt(coll, mats):
    """Camiseta de punto: torso trapezoidal suave, mangas cortas con abertura,
    escote redondo, dobladillos con pespunte y pliegues suaves en las axilas."""
    torso = sdf.taper_x(sdf.round_box((0, 0.03, 0.7), (0.32, 0.22, 0.205), 0.15), 0.7, 0.75)
    parts = [torso]
    sleeves = []
    holes = []
    ends = {}
    for sx in (-1, 1):
        d = SLEEVE_DIR * np.array([sx, 1, 1])
        a = JOINT * np.array([sx, 1, 1]) - d * 0.05
        b = JOINT * np.array([sx, 1, 1]) + d * 0.2
        cone = sdf.round_cone(a, b, 0.125, 0.13)
        cut = sdf.plane(b, d)
        sleeves.append(lambda P, cone=cone, cut=cut: sdf.smax(cone(P), cut(P), 0.012))
        holes.append(sdf.round_cone(b - d * 0.03, b + d * 0.2, 0.113, 0.113))
        ends[sx] = (b, d)
    body0 = sdf.union(*parts, k=0.07)
    body = lambda P: sdf.smin(sdf.smin(body0(P), sleeves[0](P), 0.035), sleeves[1](P), 0.035)
    neck = sdf.ellipsoid((0, 0.025, 0.93), (0.2, 0.165, 0.11))

    def base(P):
        dd = body(P)
        for h in holes:
            dd = sdf.smax(dd, -h(P), 0.01)
        dd = sdf.smax(dd, -neck(P), 0.03)
        dd = sdf.smax(dd, 0.5 - P[:, 2], 0.015)
        return dd

    # Pliegues: surcos suaves en diagonal desde las axilas
    folds = []
    for sx in (-1, 1):
        for pts2 in ([(sx * 0.29, 0.79), (sx * 0.265, 0.75), (sx * 0.24, 0.72)],):
            pts = sdf.front_points(base, pts2)
            if len(pts) >= 2:
                folds.append(sdf.stroke(pts, [0.003, 0.007, 0.003]))

    def final(P):
        dd = base(P)
        for fo in folds:
            dd = sdf.smax(dd, -fo(P), 0.03)
        return dd

    obj = sdf.to_mesh(f'{NAME} | torso camiseta', final, (-0.66, -0.32, 0.46), (0.66, 0.38, 1.0), 0.0045, coll, mats['shirt'], smooth=2)
    objs = [obj]
    # Cuello acanalado sobre el borde del escote
    ring = []
    for k in range(28):
        a = 2 * math.pi * k / 28
        o = np.array([[math.cos(a) * 0.175, 0.025 + math.sin(a) * 0.145, 1.2]])
        p, hit = sdf.trace(final, o, (0, 0, -1), max_dist=0.6)
        if hit[0]:
            ring.append(p[0] + np.array([0, 0, 0.004]))
    objs.append(clay.sweep(f'{NAME} | cuello camiseta', ring, 0.026, (1, 1), coll, mats['rib'], segments=10, samples=3, closed=True))
    ring2 = []
    for k in range(40):
        a = 2 * math.pi * k / 40
        o = np.array([[math.cos(a) * 0.212, 0.025 + math.sin(a) * 0.18, 1.2]])
        p, hit = sdf.trace(final, o, (0, 0, -1), max_dist=0.6)
        if hit[0]:
            ring2.append(p[0] + np.array([0, 0, 0.003]))
    if len(ring2) > 10:
        clay.stitches(f'{NAME} | pespunte camiseta cuello', ring2, 0.0045, 0.022, 0.014, coll, mats['thread_dark'], closed=True)
    # Dobladillo inferior + pespunte
    hem = sdf.ring_points(final, (0, 0.03, 0.515), (0, 0, 1), 0.8, 36)
    objs.append(clay.sweep(f'{NAME} | ribete camiseta', hem, 0.02, (1, 0.8), coll, mats['shirt'], segments=8, samples=3, closed=True))
    st2 = sdf.ring_points(final, (0, 0.03, 0.555), (0, 0, 1), 0.8, 48, lift=0.002)
    clay.stitches(f'{NAME} | pespunte camiseta bajo', st2, 0.0045, 0.022, 0.014, coll, mats['thread_dark'], closed=True)
    # Ribete y pespunte de las mangas
    for sx, side in ((-1, 'izq'), (1, 'der')):
        b, d = ends[sx]
        r1 = sdf.ring_points(final, b - d * 0.012, d, 0.3, 28)
        objs.append(clay.sweep(f'{NAME} | ribete manga {side}', r1, 0.017, (1, 1), coll, mats['shirt'], segments=8, samples=3, closed=True))
        r2 = sdf.ring_points(final, b - d * 0.05, d, 0.3, 36, lift=0.002)
        clay.stitches(f'{NAME} | pespunte camiseta manga {side}', r2, 0.004, 0.02, 0.013, coll, mats['thread_dark'], closed=True)
    return objs


def arms(coll, mats):
    """Brazos rechonchos con la mano de manopla fundida (sin esferas separadas)."""
    objs = []
    for sx, side in ((-1, 'izq'), (1, 'der')):
        s = np.array([sx, 1, 1])
        d = ARM_DIR * s
        start = JOINT * s + np.array([sx * 0.0, 0, 0.0])
        wrist = start + d * 0.255
        hand_c = start + d * 0.315
        arm = sdf.round_cone(start, wrist, 0.105, 0.1)
        hand = sdf.ellipsoid(hand_c, (0.122, 0.115, 0.13))
        thumb = sdf.capsule(hand_c + np.array([-sx * 0.05, -0.07, 0.05]), hand_c + np.array([-sx * 0.078, -0.095, 0.005]), 0.036)
        f = sdf.union(arm, hand, k=0.06)
        f = sdf.union(f, thumb, k=0.03)
        # Leve pliegue de muñeca
        wr = sdf.capsule(wrist + d * 0.01 + np.array([-sx * 0.1, -0.12, 0]), wrist + d * 0.01 + np.array([-sx * 0.1, 0.12, 0]), 0.004)
        lo = np.minimum(start, hand_c) - 0.16
        hi = np.maximum(start, hand_c) + 0.16
        o = sdf.to_mesh(f'{NAME} | brazo {side}', f, lo, hi, 0.004, coll, mats['skin'], smooth=2)
        objs.append(o)
    return objs


def pants(coll, mats):
    """Pantalón holgado y corto: piernas abombadas, bolsillos delanteros, bragueta
    y pliegues de tela, con pespuntes."""
    hip = sdf.round_box((0, 0.03, 0.43), (0.35, 0.22, 0.11), 0.1)
    parts = [hip]
    for sx in (-1, 1):
        parts.append(sdf.round_cone((sx * 0.19, 0.03, 0.4), (sx * 0.205, 0.005, 0.21), 0.185, 0.198))
        parts.append(sdf.ellipsoid((sx * 0.205, 0.0, 0.225), (0.214, 0.205, 0.12)))
    body = sdf.union(*parts, k=0.07)
    crotch = sdf.round_box((0, 0.03, 0.1), (0.008, 0.4, 0.2), 0.008)

    def base(P):
        dd = body(P)
        dd = sdf.smax(dd, -crotch(P), 0.07)
        dd = sdf.smax(dd, 0.125 - P[:, 2], 0.035)
        dd = sdf.smax(dd, P[:, 2] - 0.56, 0.01)
        return dd

    grooves = []
    pocket_curves = {}
    for sx in (-1, 1):
        pk = sdf.front_points(base, [(sx * 0.2, 0.53), (sx * 0.235, 0.47), (sx * 0.29, 0.43), (sx * 0.345, 0.415)])
        pocket_curves[sx] = pk
        if len(pk) >= 3:
            grooves.append((sdf.stroke(pk, 0.011), 0.012))
        fold = sdf.front_points(base, [(sx * 0.03, 0.31), (sx * 0.085, 0.265), (sx * 0.13, 0.245)])
        if len(fold) >= 3:
            grooves.append((sdf.stroke(fold, [0.004, 0.012, 0.004]), 0.02))
        knee = sdf.front_points(base, [(sx * 0.12, 0.2), (sx * 0.2, 0.185), (sx * 0.28, 0.2)])
        if len(knee) >= 3:
            grooves.append((sdf.stroke(knee, [0.003, 0.009, 0.003]), 0.02))
    fly = sdf.front_points(base, [(0.0, 0.53), (0.0, 0.4), (0.0, 0.33)])
    grooves.append((sdf.stroke(fly, 0.007), 0.01))

    def final(P):
        dd = base(P)
        for g, k in grooves:
            dd = sdf.smax(dd, -g(P), k)
        return dd

    obj = sdf.to_mesh(f'{NAME} | pantalon', final, (-0.46, -0.28, 0.09), (0.46, 0.34, 0.58), 0.0045, coll, mats['pants'], smooth=2)
    objs = [obj]
    # Pespuntes: paralelos a los bolsillos, en la bragueta y en los bajos
    for sx in (-1, 1):
        pk = sdf.front_points(final, [(sx * 0.23, 0.53), (sx * 0.26, 0.48), (sx * 0.305, 0.448), (sx * 0.35, 0.438)], lift=0.002)
        if len(pk) >= 3:
            objs.append(clay.stitches(f'{NAME} | pespunte pantalon bolsillo {"izq" if sx < 0 else "der"}', pk, 0.0045, 0.02, 0.013, coll, mats['stitch']))
    fl = sdf.front_points(final, [(0.035, 0.53), (0.035, 0.4), (0.012, 0.36)], lift=0.002)
    objs.append(clay.stitches(f'{NAME} | pespunte pantalon bragueta', fl, 0.0045, 0.02, 0.013, coll, mats['stitch']))
    return objs


def shoes(coll, mats):
    """Tenis bajos y redondeados: capellada negra acolchada, suela blanca gruesa con
    línea negra de piso y un reborde curvo sobre el empeine."""
    objs = []
    for sx, side in ((-1, 'izq'), (1, 'der')):
        x = sx * 0.2
        upper0 = sdf.union(sdf.ellipsoid((x, -0.03, 0.11), (0.172, 0.25, 0.12)),
                           sdf.ellipsoid((x, -0.13, 0.085), (0.168, 0.17, 0.085)), k=0.06)
        opening = sdf.ellipsoid((x, 0.03, 0.235), (0.125, 0.15, 0.07))

        def up_base(P, upper0=upper0, opening=opening):
            dd = upper0(P)
            dd = sdf.smax(dd, -opening(P), 0.03)
            dd = sdf.smax(dd, 0.055 - P[:, 2], 0.01)
            return dd
        # Reborde curvo sobre el empeine
        ridge_pts = []
        for t in np.linspace(-1, 1, 7):
            o = np.array([[x + t * 0.13, -0.12 - 0.04 * (1 - t * t), 0.6]])
            p, hit = sdf.trace(up_base, o, (0, 0, -1), max_dist=1.0)
            if hit[0]:
                ridge_pts.append(p[0])
        ridge = sdf.stroke(ridge_pts, 0.02) if len(ridge_pts) >= 3 else None

        def upper(P, up_base=up_base, ridge=ridge):
            dd = up_base(P)
            if ridge is not None:
                dd = sdf.smin(dd, ridge(P), 0.015)
            return dd
        objs.append(sdf.to_mesh(f'{NAME} | tenis {side}', upper, (x - 0.24, -0.34, 0.03), (x + 0.24, 0.3, 0.3), 0.004, coll, mats['upper'], smooth=2))
        sole = sdf.ellipse_cylinder_z((x, -0.04, 0), 0.19, 0.29, 0.012, 0.075, 0.028)
        objs.append(sdf.to_mesh(f'{NAME} | suela {side}', sole, (x - 0.23, -0.36, -0.01), (x + 0.23, 0.28, 0.1), 0.004, coll, mats['sole'], smooth=1))
        out = sdf.ellipse_cylinder_z((x, -0.04, 0), 0.186, 0.286, 0.0, 0.02, 0.009)
        objs.append(sdf.to_mesh(f'{NAME} | suela piso {side}', out, (x - 0.23, -0.36, -0.01), (x + 0.23, 0.28, 0.04), 0.004, coll, mats['outsole'], smooth=1))
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
    shirt(coll, mats)
    arms(coll, mats)
    pants(coll, mats)
    shoes(coll, mats)
    return coll
