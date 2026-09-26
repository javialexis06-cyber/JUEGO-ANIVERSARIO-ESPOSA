"""Cuerpo paramétrico estilo plastilina (SDF): camiseta, chaleco, brazos, pantalón,
shorts, piernas con medias y tenis.

Lo usan Él, Ella, los clientes y los ayudantes. Cada personaje pasa un diccionario D
con sus medidas; así todos comparten el mismo lenguaje de formas (cuerpo gordito,
uniones suaves, dobladillos con pespunte) con proporciones y ropa propias.
"""
import math

import numpy as np

import clay
import sdf


def _dir(deg, dy=0.0):
    return np.array([math.sin(math.radians(deg)), dy, -math.cos(math.radians(deg))])


# --------------------------------------------------------------------------
# Camiseta
# --------------------------------------------------------------------------

def shirt_sdf(D):
    """SDF de la camiseta (torso + barriga + mangas con abertura + escote)."""
    T = D['torso']
    joint = np.array(D['joint'])
    sdir = _dir(D['sleeve_deg'], 0.03)
    torso = sdf.taper_x(sdf.round_box(T['c'], T['half'], T['r']), T['c'][2], T['taper'])
    parts = [torso]
    if T.get('belly'):
        parts.append(sdf.ellipsoid(*T['belly']))
    S = D.get('sleeve')
    sleeves, holes, ends = [], [], {}
    if S:
        for sx in (-1, 1):
            d = sdir * np.array([sx, 1, 1])
            a = joint * np.array([sx, 1, 1]) - d * 0.05
            b = joint * np.array([sx, 1, 1]) + d * S['len']
            cone = sdf.round_cone(a, b, S['r'][0], S['r'][1])
            cut = sdf.plane(b, d)
            sleeves.append(lambda P, cone=cone, cut=cut: sdf.smax(cone(P), cut(P), 0.012))
            holes.append(sdf.round_cone(b - d * 0.03, b + d * 0.2, S['hole'], S['hole']))
            ends[sx] = (b, d)
    body0 = sdf.union(*parts, k=0.07)

    def body(P):
        dd = body0(P)
        for s in sleeves:
            dd = sdf.smin(dd, s(P), 0.035)
        return dd
    neck = sdf.ellipsoid(D['neck_hole'][0], D['neck_hole'][1])
    bottom = T['bottom']

    def base(P):
        dd = body(P)
        for h in holes:
            dd = sdf.smax(dd, -h(P), 0.01)
        dd = sdf.smax(dd, -neck(P), 0.03)
        dd = sdf.smax(dd, bottom - P[:, 2], 0.015)
        return dd
    return base, ends


def shirt(coll, mats, name, D):
    """Camiseta de punto con cuello acanalado, dobladillos y pespuntes."""
    base, ends = shirt_sdf(D)
    T = D['torso']
    folds = []
    fz = T['c'][2]
    for sx in (-1, 1):
        pts = sdf.front_points(base, [(sx * T['half'][0] * 0.74, fz + 0.09), (sx * T['half'][0] * 0.68, fz + 0.05), (sx * T['half'][0] * 0.62, fz + 0.02)])
        if len(pts) >= 3:
            folds.append(sdf.stroke(pts, [0.003, 0.007, 0.003]))

    def final(P):
        dd = base(P)
        for fo in folds:
            dd = sdf.smax(dd, -fo(P), 0.03)
        return dd
    lo, hi = D['shirt_bounds']
    objs = [sdf.to_mesh(f'{name} | torso camiseta', final, lo, hi, 0.0045, coll, mats['shirt'], smooth=2)]
    nc = np.array(D['neck_hole'][0])
    cr = D.get('collar_r', (0.175, 0.145))
    ring = []
    for k in range(28):
        a = 2 * math.pi * k / 28
        o = np.array([[nc[0] + math.cos(a) * cr[0], nc[1] + math.sin(a) * cr[1], 1.6]])
        p, hit = sdf.trace(final, o, (0, 0, -1), max_dist=1.0)
        if hit[0]:
            ring.append(p[0] + np.array([0, 0, 0.004]))
    if len(ring) > 10:
        objs.append(clay.sweep(f'{name} | cuello camiseta', ring, 0.026, (1, 1), coll, mats['rib'], segments=10, samples=3, closed=True))
    ring2 = []
    for k in range(40):
        a = 2 * math.pi * k / 40
        o = np.array([[nc[0] + math.cos(a) * (cr[0] + 0.037), nc[1] + math.sin(a) * (cr[1] + 0.035), 1.6]])
        p, hit = sdf.trace(final, o, (0, 0, -1), max_dist=1.0)
        if hit[0]:
            ring2.append(p[0] + np.array([0, 0, 0.003]))
    if len(ring2) > 10:
        clay.stitches(f'{name} | pespunte camiseta cuello', ring2, 0.0045, 0.022, 0.014, coll, mats['thread_dark'], closed=True)
    hz = T['bottom']
    if D.get('shirt_hem', True):
        hem = sdf.ring_points(final, (0, T['c'][1], hz + 0.015), (0, 0, 1), 0.9, 36)
        objs.append(clay.sweep(f'{name} | ribete camiseta', hem, 0.02, (1, 0.8), coll, mats['shirt'], segments=8, samples=3, closed=True))
        st2 = sdf.ring_points(final, (0, T['c'][1], hz + 0.055), (0, 0, 1), 0.9, 48, lift=0.002)
        clay.stitches(f'{name} | pespunte camiseta bajo', st2, 0.0045, 0.022, 0.014, coll, mats['thread_dark'], closed=True)
    for sx, side in ((-1, 'izq'), (1, 'der')):
        if sx not in ends:
            continue
        b, d = ends[sx]
        r1 = sdf.ring_points(final, b - d * 0.012, d, 0.3, 28)
        objs.append(clay.sweep(f'{name} | ribete manga {side}', r1, 0.017, (1, 1), coll, mats['shirt'], segments=8, samples=3, closed=True))
        r2 = sdf.ring_points(final, b - d * 0.05, d, 0.3, 36, lift=0.002)
        clay.stitches(f'{name} | pespunte camiseta manga {side}', r2, 0.004, 0.02, 0.013, coll, mats['thread_dark'], closed=True)
    return objs, final


# --------------------------------------------------------------------------
# Chaleco sin mangas (abierto al frente, con solapas y bolsillos)
# --------------------------------------------------------------------------

def vest(coll, mats, name, D):
    V = D['vest']
    joint = np.array(D['joint'])
    sdir = _dir(D['sleeve_deg'], 0.03)
    outer = sdf.taper_x(sdf.round_box(V['c'], V['half'], V['r']), V['c'][2], V['taper'])
    belly = sdf.ellipsoid(V['belly'][0], V['belly'][1]) if V.get('belly') else None
    armholes = []
    for sx in (-1, 1):
        d = sdir * np.array([sx, 1, 1])
        j = joint * np.array([sx, 1, 1])
        armholes.append(sdf.round_cone(j - d * 0.08, j + d * 0.5, V['armhole'], V['armhole']))
    neck = sdf.ellipsoid(V['neck'][0], V['neck'][1])
    zs, ws = zip(*V['opening'])

    def opening(P):
        w = np.interp(P[:, 2], zs, ws)
        return np.maximum(np.abs(P[:, 0]) - w, P[:, 1] - V.get('open_y', -0.02))

    def base(P):
        dd = outer(P)
        if belly is not None:
            dd = sdf.smin(dd, belly(P), 0.07)
        for h in armholes:
            dd = sdf.smax(dd, -h(P), 0.02)
        dd = sdf.smax(dd, -neck(P), 0.03)
        dd = sdf.smax(dd, -opening(P), 0.012)
        dd = sdf.smax(dd, V['bottom'] - P[:, 2], 0.012)
        return dd
    lo, hi = V['bounds']
    objs = [sdf.to_mesh(f'{name} | chaleco', base, lo, hi, 0.0045, coll, mats['vest'], smooth=2)]
    # Solapas: tiras planas que siguen el borde de la abertura, anchas arriba y en punta abajo
    for sx, side in ((-1, 'izq'), (1, 'der')):
        pts2, widths = [], []
        for z, w in V['lapel']:
            op = float(np.interp(z, zs, ws))
            pts2.append((sx * (op + w * 0.85), z))
            widths.append(w)
        pts = sdf.front_points(base, pts2, lift=0.016)
        if len(pts) >= 3:
            objs.append(clay.sweep(f'{name} | solapa {side}', pts, widths[:len(pts)], (0.22, 1.0), coll, mats['vest'], segments=12, samples=6,
                                   up_fn=lambda q: sdf.normal(base, np.array([q]))[0], caps=('round', 'round')))
        # Bolsillo con tapa
        px, pz = V['pocket']
        p = sdf.front_points(base, [(sx * px, pz)])
        if p:
            n = sdf.normal(base, np.array([p[0]]))[0]
            flap = clay.blob(f'{name} | tapa bolsillo {side}', (0, 0, 0), (0.095, 0.014, 0.032), coll, mats['vest'], n=6, p=4, subsurf=2)
            flap.location = p[0] + n * 0.01
            clay.orient_to(flap, n)
            objs.append(flap)
            st = sdf.front_points(base, [(sx * (px - 0.085), pz - 0.012), (sx * px, pz - 0.016), (sx * (px + 0.085), pz - 0.012)], lift=0.02)
            if len(st) == 3:
                clay.stitches(f'{name} | pespunte chaleco bolsillo {side}', st, 0.004, 0.016, 0.011, coll, mats['thread_dark'])
    return objs


# --------------------------------------------------------------------------
# Brazos con mano de manopla (y manilla opcional)
# --------------------------------------------------------------------------

def arms(coll, mats, name, D, bracelet_side=None):
    A = D['arm']
    joint = np.array(D['joint'])
    adir = _dir(D['arm_deg'], A.get('dy', 0.08))
    objs = []
    for sx, side in ((-1, 'izq'), (1, 'der')):
        s = np.array([sx, 1, 1])
        d = adir * s
        start = joint * s
        wrist = start + d * A['wrist_t']
        hand_c = start + d * A['hand_t']
        arm = sdf.round_cone(start, wrist, A['r'][0], A['r'][1])
        hand = sdf.ellipsoid(hand_c, A['hand'])
        hr = A['hand']
        thumb = sdf.capsule(hand_c + np.array([-sx * hr[0] * 0.41, -hr[1] * 0.62, hr[2] * 0.38]),
                            hand_c + np.array([-sx * hr[0] * 0.63, -hr[1] * 0.81, 0.005]), hr[0] * 0.3)
        f = sdf.union(arm, hand, k=0.06)
        f = sdf.union(f, thumb, k=0.03)
        lo = np.minimum(start, hand_c) - 0.17
        hi = np.maximum(start, hand_c) + 0.17
        objs.append(sdf.to_mesh(f'{name} | brazo {side}', f, lo, hi, 0.004, coll, mats['skin'], smooth=2))
        if bracelet_side == side:
            ring = sdf.ring_points(f, wrist + d * 0.012, d, 0.3, 24, lift=0.006)
            if len(ring) > 8:
                objs.append(clay.sweep(f'{name} | manilla dorada', ring, 0.013, (1, 1), coll, mats['gold'], segments=8, samples=4, closed=True))
    return objs


# --------------------------------------------------------------------------
# Pantalón largo / shorts
# --------------------------------------------------------------------------

def pants(coll, mats, name, D):
    Pn = D['pants']
    hip = sdf.round_box(Pn['hip_c'], Pn['hip_half'], Pn['hip_r'])
    parts = [hip]
    for sx in (-1, 1):
        s = np.array([sx, 1, 1])
        parts.append(sdf.round_cone(np.array(Pn['leg_top']) * s, np.array(Pn['leg_bot']) * s, Pn['leg_r'][0], Pn['leg_r'][1]))
        if Pn.get('bulge'):
            parts.append(sdf.ellipsoid(np.array(Pn['bulge'][0]) * s, Pn['bulge'][1]))
    body = sdf.union(*parts, k=0.07)
    crotch = sdf.round_box((0, 0.03, Pn['crotch_z'] - 0.2), (0.008, 0.45, 0.2), 0.008)
    bottom, top = Pn['bottom'], Pn['top']

    def base(P):
        dd = body(P)
        dd = sdf.smax(dd, -crotch(P), 0.07)
        dd = sdf.smax(dd, bottom - P[:, 2], Pn.get('bottom_k', 0.035))
        dd = sdf.smax(dd, P[:, 2] - top, 0.01)
        return dd
    grooves = []
    hx = Pn['hip_half'][0]
    tz = top - 0.03
    if Pn.get('pockets'):
        for sx in (-1, 1):
            pk = sdf.front_points(base, [(sx * hx * 0.54, tz), (sx * hx * 0.63, tz - 0.06), (sx * hx * 0.78, tz - 0.1), (sx * hx * 0.93, tz - 0.115)])
            if len(pk) >= 3:
                grooves.append((sdf.stroke(pk, 0.011), 0.012))
    if Pn.get('folds'):
        for sx in (-1, 1):
            cz = Pn['crotch_z']
            fold = sdf.front_points(base, [(sx * 0.03, cz + 0.01), (sx * 0.085, cz - 0.035), (sx * 0.13, cz - 0.055)])
            if len(fold) >= 3:
                grooves.append((sdf.stroke(fold, [0.004, 0.012, 0.004]), 0.02))
            if Pn.get('knee'):
                knee = sdf.front_points(base, [(sx * 0.12, bottom + 0.075), (sx * 0.2, bottom + 0.06), (sx * 0.28, bottom + 0.075)])
                if len(knee) >= 3:
                    grooves.append((sdf.stroke(knee, [0.003, 0.009, 0.003]), 0.02))
    if Pn.get('fly'):
        fly = sdf.front_points(base, [(0.0, tz), (0.0, Pn['crotch_z'] + 0.1), (0.0, Pn['crotch_z'] + 0.03)])
        if len(fly) >= 3:
            grooves.append((sdf.stroke(fly, 0.007), 0.01))

    def final(P):
        dd = base(P)
        for g, k in grooves:
            dd = sdf.smax(dd, -g(P), k)
        return dd
    lo, hi = Pn['bounds']
    objs = [sdf.to_mesh(f'{name} | pantalon', final, lo, hi, 0.0045, coll, mats['pants'], smooth=2)]
    if Pn.get('pockets'):
        for sx in (-1, 1):
            pk = sdf.front_points(final, [(sx * hx * 0.61, tz), (sx * hx * 0.7, tz - 0.05), (sx * hx * 0.82, tz - 0.082), (sx * hx * 0.94, tz - 0.092)], lift=0.002)
            if len(pk) >= 3:
                objs.append(clay.stitches(f'{name} | pespunte pantalon bolsillo {"izq" if sx < 0 else "der"}', pk, 0.0045, 0.02, 0.013, coll, mats['stitch']))
    if Pn.get('fly'):
        fl = sdf.front_points(final, [(0.035, tz), (0.035, Pn['crotch_z'] + 0.1), (0.012, Pn['crotch_z'] + 0.06)], lift=0.002)
        if len(fl) >= 3:
            objs.append(clay.stitches(f'{name} | pespunte pantalon bragueta', fl, 0.0045, 0.02, 0.013, coll, mats['stitch']))
    if Pn.get('cuffs'):
        # Dobladillo enrollado de los shorts
        for sx, side in ((-1, 'izq'), (1, 'der')):
            c = np.array(Pn['leg_bot']) * np.array([sx, 1, 1])
            ring = sdf.ring_points(final, (c[0], c[1], bottom + 0.022), (0, 0, 1), 0.5, 28, lift=0.004)
            ring = [p for p in ring if abs(p[0] - c[0]) < Pn['leg_r'][1] * 1.3 and p[0] * sx > 0.005]
            if len(ring) > 10:
                ring.sort(key=lambda p: math.atan2(p[1] - c[1], p[0] - c[0]))
                objs.append(clay.sweep(f'{name} | dobladillo short {side}', ring, 0.026, (1, 1), coll, mats['pants'], segments=10, samples=3, closed=True))
    return objs


# --------------------------------------------------------------------------
# Piernas visibles con medias
# --------------------------------------------------------------------------

def legs(coll, mats, name, D):
    L = D['legs']
    objs = []
    for sx, side in ((-1, 'izq'), (1, 'der')):
        x = sx * L['x']
        leg = sdf.round_cone((x, L['y'], L['top']), (x, L['y'] - 0.01, L['ankle']), L['r'][0], L['r'][1])
        objs.append(sdf.to_mesh(f'{name} | pierna {side}', leg, (x - 0.16, L['y'] - 0.17, L['ankle'] - 0.15), (x + 0.16, L['y'] + 0.17, L['top'] + 0.15),
                                0.004, coll, mats['skin'], smooth=2))
        sock = sdf.round_cone((x, L['y'] - 0.005, L['sock_top']), (x, L['y'] - 0.01, 0.07), L['sock_r'], L['sock_r'] * 1.02)
        objs.append(sdf.to_mesh(f'{name} | media {side}', sock, (x - 0.16, L['y'] - 0.17, 0.0), (x + 0.16, L['y'] + 0.17, L['sock_top'] + 0.14),
                                0.004, coll, mats['sock'], smooth=2))
        cuff = sdf.ring_points(sock, (x, L['y'] - 0.005, L['sock_top'] - 0.012), (0, 0, 1), 0.4, 24, lift=0.002)
        if len(cuff) > 8:
            objs.append(clay.sweep(f'{name} | puño media {side}', cuff, 0.02, (1, 1), coll, mats['sock'], segments=8, samples=3, closed=True))
    return objs


# --------------------------------------------------------------------------
# Tenis
# --------------------------------------------------------------------------

def shoes(coll, mats, name, D):
    S = D['shoe']
    objs = []
    for sx, side in ((-1, 'izq'), (1, 'der')):
        x = sx * S['x']
        k = S.get('scale', 1.0)
        upper0 = sdf.union(sdf.ellipsoid((x, -0.03 * k, 0.11 * k), (0.19 * k, 0.265 * k, 0.125 * k)),
                           sdf.ellipsoid((x, -0.13 * k, 0.085 * k), (0.186 * k, 0.18 * k, 0.088 * k)), k=0.06)
        opening = sdf.ellipsoid((x, 0.03 * k, 0.235 * k), (0.125 * k, 0.15 * k, 0.07 * k))

        def up_base(P, upper0=upper0, opening=opening, k=k):
            dd = upper0(P)
            dd = sdf.smax(dd, -opening(P), 0.03)
            dd = sdf.smax(dd, 0.055 * k - P[:, 2], 0.01)
            return dd
        ridge_pts = []
        for t in np.linspace(-1, 1, 7):
            o = np.array([[x + t * 0.13 * k, (-0.12 - 0.04 * (1 - t * t)) * k, 0.6]])
            p, hit = sdf.trace(up_base, o, (0, 0, -1), max_dist=1.0)
            if hit[0]:
                ridge_pts.append(p[0])
        ridge = sdf.stroke(ridge_pts, 0.02 * k) if len(ridge_pts) >= 3 else None

        def upper(P, up_base=up_base, ridge=ridge):
            dd = up_base(P)
            if ridge is not None:
                dd = sdf.smin(dd, ridge(P), 0.015)
            return dd
        objs.append(sdf.to_mesh(f'{name} | tenis {side}', upper, (x - 0.26 * k, -0.36 * k, 0.03 * k), (x + 0.26 * k, 0.32 * k, 0.3 * k), 0.004, coll, mats['upper'], smooth=2))
        if S.get('laces'):
            for li, (yy, zz) in enumerate(((-0.07, 0.0), (-0.015, 0.0))):
                pts = []
                for t in (-1, -0.4, 0.4, 1):
                    o = np.array([[x + t * 0.075 * k, yy * k, 0.6]])
                    p, hit = sdf.trace(upper, o, (0, 0, -1), max_dist=1.0)
                    if hit[0]:
                        pts.append(p[0] + np.array([0, 0, 0.004]))
                if len(pts) >= 3:
                    objs.append(clay.sweep(f'{name} | cordon {side} {li}', pts, 0.014 * k, (0.7, 1.0), coll, mats['lace'], segments=8, samples=4, up=(0, 0, 1)))
        sole = sdf.ellipse_cylinder_z((x, -0.04 * k, 0), 0.207 * k, 0.305 * k, 0.012 * k, 0.075 * k, 0.028 * k)
        objs.append(sdf.to_mesh(f'{name} | suela {side}', sole, (x - 0.25 * k, -0.38 * k, -0.01), (x + 0.25 * k, 0.3 * k, 0.1 * k), 0.004, coll, mats['sole'], smooth=1))
        out = sdf.ellipse_cylinder_z((x, -0.04 * k, 0), 0.203 * k, 0.301 * k, 0.0, 0.02 * k, 0.009 * k)
        objs.append(sdf.to_mesh(f'{name} | suela piso {side}', out, (x - 0.25 * k, -0.38 * k, -0.01), (x + 0.25 * k, 0.3 * k, 0.04 * k), 0.004, coll, mats['outsole'], smooth=1))
    return objs
