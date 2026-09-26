"""Clientes y ayudantes del supermercado, en el mismo estilo de Él y Ella.

Un generador paramétrico arma cada personaje a partir de una ficha (SPECS): base de
proporciones, peinado o sombrero, expresión, ropa, colores y accesorios.
"""
import copy
import math

import bpy
import numpy as np

import clay
import cuerpo
import el
import ella
import personaje
import sdf
from clay import sph

M = clay.material


# --------------------------------------------------------------------------
# Materiales por personaje
# --------------------------------------------------------------------------

def fabric(name, color, fz=None, ribs=False):
    fz = fz or color
    kw = dict(rough=0.88, spec=0.3, sheen=0.3, sheen_rough=0.3, sheen_tint='#FFFFFF',
              fuzz=dict(scale=150, color=fz, amount=0.55, strength=0.35, distance=0.003))
    if ribs:
        kw['ribs'] = dict(scale=38, strength=0.3, axis='X', distance=0.003)
    return M(name, color, **kw)


def lighten(hexc, k=0.25):
    h = hexc.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    r, g, b = (int(c + (255 - c) * k) for c in (r, g, b))
    return '#%02X%02X%02X' % (r, g, b)


def darken(hexc, k=0.3):
    h = hexc.lstrip('#')
    r, g, b = (int(int(h[i:i + 2], 16) * (1 - k)) for i in (0, 2, 4))
    return '#%02X%02X%02X' % (r, g, b)


def materials(name, S):
    m = personaje.common_materials(name)
    if S.get('skin'):
        m['skin'] = M(f'{name} | piel', S['skin'], rough=0.46, sss=0.22, sss_radius=(1.0, 0.42, 0.28), sss_scale=0.06, coat=0.08, coat_rough=0.35)
    hc = S.get('hair_color', '#1A1414')
    m['hair'] = M(f'{name} | cabello', hc, rough=0.72, spec=0.25, sheen=0.25, sheen_rough=0.4, sheen_tint=lighten(hc, 0.4),
                  noise=dict(scale=14, strength=0.1, detail=3, distance=0.012),
                  fuzz=dict(scale=130, color=lighten(hc, 0.25), amount=0.7, strength=0.45, distance=0.004))
    m['brow'] = M(f'{name} | cejas', S.get('brow_color', darken(hc, 0.35)), rough=0.4, coat=0.2)
    top = S['top']
    m['shirt'] = fabric(f'{name} | parte superior', top, lighten(top, 0.25), ribs=S.get('ribs', True))
    m['rib'] = fabric(f'{name} | resorte', top, lighten(top, 0.2), ribs=True)
    m['thread_dark'] = M(f'{name} | hilo', lighten(top, 0.35), rough=0.7)
    bot = S.get('bottom', '#3A4F7A')
    m['pants'] = fabric(f'{name} | parte inferior', bot, lighten(bot, 0.25))
    m['stitch'] = M(f'{name} | pespunte', lighten(bot, 0.35), rough=0.7)
    m['vest'] = fabric(f'{name} | chaqueta', S.get('jacket', top), lighten(S.get('jacket', top), 0.25))
    sh = S.get('shoes', '#2B2A2A')
    m['upper'] = fabric(f'{name} | zapatos', sh, lighten(sh, 0.2))
    m['sole'] = M(f'{name} | suela', S.get('sole', '#F4F1EA'), rough=0.45, coat=0.15)
    m['outsole'] = M(f'{name} | piso suela', '#3A3838', rough=0.6)
    m['lace'] = M(f'{name} | cordones', '#F6F3EE', rough=0.7)
    m['sock'] = fabric(f'{name} | medias', S.get('socks', '#F2F0EB'), '#FFFFFF', ribs=True)
    m['gold'] = M(f'{name} | dorado', '#D9A94E', rough=0.22, metallic=1.0)
    m['acc'] = M(f'{name} | accesorio', S.get('acc_color', '#E4564F'), rough=0.4, coat=0.3)
    a2 = S.get('acc2_color', '#2B2A2A')
    m['acc2'] = M(f'{name} | accesorio 2', a2, rough=0.8, sheen=0.3, sheen_tint='#FFFFFF', ribs=dict(scale=30, strength=0.3, axis='X', distance=0.004),
                  fuzz=dict(scale=140, color=lighten(a2, 0.25), amount=0.5, strength=0.3, distance=0.003))
    m['lens'] = M(f'{name} | lente', '#1C2430', rough=0.05, coat=1.0)
    m['glass'] = M(f'{name} | vidrio gafas', '#EAF6FA', rough=0.05, alpha=0.15)
    m['white'] = fabric(f'{name} | blanco', '#F7F5F0', '#FFFFFF')
    return m


# --------------------------------------------------------------------------
# Cabello: casquete genérico + mechones + peinados especiales
# --------------------------------------------------------------------------

def cap(coll, P, mats, name, hairline, thick_top=0.12, thick_base=0.05, back=0.03):
    hc = np.array(P['head_center'])
    v, f = clay.quad_sphere(18)
    v = clay.superellipsoid_dirs(v, P['head_p'])
    v = v * np.array(P['head_radii'])
    v = personaje.head_shaper(P)(v)
    u = v / np.linalg.norm(v, axis=1)[:, None]
    az = np.degrees(np.arctan2(u[:, 0], -u[:, 1]))
    elv = np.degrees(np.arcsin(np.clip(u[:, 2], -1, 1)))
    a = np.abs(az)
    hl = np.interp(a, [0, 25, 45, 62, 80, 100, 130, 180], hairline)
    s = clay.smoothstep(hl - 5, hl + 5, elv)
    thick = thick_base + thick_top * clay.smoothstep(5, 65, elv) + back * clay.smoothstep(90, 180, a)
    scale = 1 + (thick * s - 0.02 * (1 - s)) / np.linalg.norm(v, axis=1)
    v = v * scale[:, None] + hc
    obj = clay.make_mesh_object(f'{name} | cabello base', v, f, coll, material=mats['hair'])
    clay.add_subsurf(obj, 1, 2)
    return obj


def locks(coll, surf, P, mats, name, spec, L=0.62):
    hc = np.array(P['head_center'])
    objs = []
    for i, (path, radii) in enumerate(spec):
        pts = []
        for p in path:
            if p[0] == 'w':
                pts.append(np.array(p[1:]) + hc)
            else:
                loc, _ = surf.radial(hc, sph(p[0], p[1]), p[2])
                pts.append(loc)
        objs.append(clay.sweep(f'{name} | mechon {i}', pts, radii, (L, 1.0), coll, mats['hair'], segments=14, samples=7,
                               caps=('round', 'round'), up_fn=lambda q: np.array(q) - hc, flat_bottom=0.6))
    return objs


def hair(coll, head, P, mats, name, style):
    hc = np.array(P['head_center'])
    R = P['head_radii']
    if style == 'moño':
        c = cap(coll, P, mats, name, [42, 40, 30, 16, 6, -4, -22, -38], 0.05, 0.04)
        surf = clay.Surface([head, c])
        top, _ = surf.radial(hc, sph(175, 58), 0.1)
        clay.blob(f'{name} | moño', top, (0.26, 0.24, 0.22), coll, mats['hair'], n=10)
        locks(coll, surf, P, mats, name, [
            [[(sx * 5, 55, 0.0), (sx * 60, 50, 0.03), (sx * 130, 50, 0.04), (sx * 165, 55, 0.05)], [0.14, 0.18, 0.16, 0.1]] for sx in (-1, 1)])
    elif style == 'raya_lado':
        c = cap(coll, P, mats, name, [40, 40, 30, 16, 6, -6, -24, -40], 0.08, 0.05)
        surf = clay.Surface([head, c])
        locks(coll, surf, P, mats, name, [
            [[(-40, 70, 0.0), (-5, 62, 0.04), (35, 55, 0.05), (70, 42, 0.04)], [0.16, 0.2, 0.18, 0.1]],
            [[(-50, 55, 0.0), (-20, 48, 0.03), (15, 44, 0.04), (45, 40, 0.03)], [0.14, 0.18, 0.16, 0.08]],
            [[(-40, 70, 0.0), (-80, 60, 0.03), (-110, 40, 0.03)], [0.15, 0.17, 0.1]],
            [[(-30, 80, 0.0), (80, 75, 0.04), (140, 55, 0.04)], [0.16, 0.2, 0.12]],
        ], 0.5)
    elif style == 'melena':
        c = cap(coll, P, mats, name, [48, 44, 34, 20, 8, -4, -24, -44], 0.1, 0.05)
        surf = clay.Surface([head, c])
        spec = []
        for sx in (-1, 1):
            spec += [
                [[(sx * 4, 58, 0.0), (sx * 40, 46, 0.05), (sx * 78, 24, 0.07), (sx * 100, 0, 0.07), ('w', sx * 0.72, 0.18, -0.55),
                  ('w', sx * 0.78, 0.2, -0.72)], [0.14, 0.2, 0.21, 0.2, 0.18, 0.12]],
                [[(sx * 8, 76, 0.0), (sx * 90, 50, 0.06), (sx * 130, 10, 0.07), ('w', sx * 0.55, 0.45, -0.6)], [0.15, 0.21, 0.2, 0.12]],
            ]
        spec.append([[(180, 70, 0.0), (180, 20, 0.07), ('w', 0.0, 0.62, -0.6)], [0.18, 0.22, 0.14]])
        locks(coll, surf, P, mats, name, spec, 0.45)
    elif style == 'cola_alta':
        c = cap(coll, P, mats, name, [46, 44, 34, 20, 8, -6, -26, -42], 0.05, 0.04)
        surf = clay.Surface([head, c])
        base, _ = surf.radial(hc, sph(180, 45), 0.05)
        clay.sweep(f'{name} | cola', [base, base + np.array([0, 0.25, 0.2]), base + np.array([0, 0.45, 0.0]), base + np.array([0, 0.5, -0.35]),
                                      base + np.array([0, 0.42, -0.6])], [0.12, 0.15, 0.14, 0.11, 0.04], (1, 1), coll, mats['hair'], segments=14, samples=7)
        clay.lathe(f'{name} | moña', [(0.1, -0.04), (0.11, 0.0), (0.1, 0.04)], coll, mats['acc'], segments=20).location = base
        bpy.context.view_layer.update()
        band = [surf.radial(hc, sph(a, 36 if abs(a) < 100 else 28), 0.02)[0] for a in range(-180, 180, 15)]
        clay.sweep(f'{name} | balaca', band, 0.055, (0.4, 1), coll, mats['acc'], segments=8, samples=3, closed=True, up_fn=lambda q: np.array(q) - hc)
    elif style == 'despeinado':
        c = cap(coll, P, mats, name, [34, 34, 26, 12, 4, -6, -26, -38], 0.12, 0.05)
        surf = clay.Surface([head, c])
        spec = []
        rng = np.random.default_rng(11)
        for k, (az, el_) in enumerate(((-60, 60), (-20, 70), (20, 68), (60, 60), (100, 50), (-100, 50), (150, 55), (-150, 55), (180, 60), (0, 85))):
            az2 = az + rng.uniform(-25, 25)
            spec.append([[(az, el_ - 18, 0.0), (az2, el_, 0.08), (az2 + rng.uniform(-15, 15), el_ + rng.uniform(-25, 5), 0.2)], [0.13, 0.16, 0.07]])
        locks(coll, surf, P, mats, name, spec, 0.7)
    elif style == 'coletas':
        c = cap(coll, P, mats, name, [48, 44, 34, 20, 8, -6, -26, -44], 0.05, 0.04)
        surf = clay.Surface([head, c])
        for sx in (-1, 1):
            base, _ = surf.radial(hc, sph(sx * 105, 30), 0.05)
            clay.sweep(f'{name} | coleta {sx}', [base, base + np.array([sx * 0.25, 0.05, 0.05]), base + np.array([sx * 0.38, 0.05, -0.25]),
                                                 base + np.array([sx * 0.35, 0.05, -0.55])], [0.11, 0.14, 0.12, 0.04], (1, 1), coll, mats['hair'],
                       segments=12, samples=6)
            for k in range(2):
                clay.blob(f'{name} | moño coleta {sx} {k}', base + np.array([sx * 0.06, 0, (k - 0.5) * 0.12]), (0.05, 0.05, 0.07), coll, mats['acc'], n=5)
    elif style == 'copete':
        c = cap(coll, P, mats, name, [40, 38, 28, 14, 4, -8, -26, -40], 0.07, 0.05)
        surf = clay.Surface([head, c])
        locks(coll, surf, P, mats, name, [
            [[(0, 45, 0.02), (0, 58, 0.18), (0, 75, 0.3), (180, 80, 0.22), (180, 60, 0.08)], [0.2, 0.28, 0.27, 0.22, 0.12]],
            [[(-30, 45, 0.0), (-20, 60, 0.14), (-15, 78, 0.2), (170, 70, 0.1)], [0.15, 0.22, 0.2, 0.1]],
            [[(30, 45, 0.0), (20, 60, 0.14), (15, 78, 0.2), (-170, 70, 0.1)], [0.15, 0.22, 0.2, 0.1]],
        ], 0.75)
    else:  # 'corto'
        cap(coll, P, mats, name, [36, 36, 28, 14, 4, -6, -26, -38], 0.08, 0.05)


def hat(coll, head, P, mats, name, kind):
    hc = np.array(P['head_center'])
    R = P['head_radii']
    top = hc[2] + R[2]
    if kind == 'chef':
        clay.lathe(f'{name} | banda chef', [(R[0] * 0.95, top - 0.2), (R[0] * 0.97, top + 0.02)], coll, mats['white'], segments=36)
        clay.blob(f'{name} | gorro chef', (0, 0.02, top + 0.35), (0.55, 0.5, 0.4), coll, mats['white'], n=12,
                  shaper=lambda v: v * (1 + 0.08 * np.cos(np.arctan2(v[:, 1], v[:, 0]) * 7))[:, None])
    elif kind == 'sombrero':
        clay.lathe(f'{name} | ala', [(0.0, top - 0.12), (1.05, top - 0.14), (1.1, top - 0.1)], coll, mats['acc2'], segments=40)
        clay.lathe(f'{name} | copa', [(R[0] * 0.8, top - 0.12), (R[0] * 0.75, top + 0.18), (0.0, top + 0.2)], coll, mats['acc2'], segments=40)
        clay.lathe(f'{name} | cinta', [(R[0] * 0.81, top - 0.08), (R[0] * 0.79, top + 0.0)], coll, mats['acc'], segments=40)
    elif kind in ('gorra', 'gorra_atras'):
        o = clay.blob(f'{name} | gorra', (0, 0.0, top - 0.25), (R[0] * 1.03, R[1] * 1.03, 0.52), coll, mats['acc'], n=12,
                      shaper=lambda v: np.where(v[:, 2:3] < 0, v * np.array([1, 1, 0.05]), v))
        vis = clay.blob(f'{name} | visera', (0, -R[1] * 0.95, top - 0.25), (0.42, 0.35, 0.03), coll, mats['acc'], n=8)
        clay.blob(f'{name} | botón gorra', (0, 0, top + 0.26), (0.05, 0.05, 0.03), coll, mats['acc'], n=4)
        if kind == 'gorra_atras':
            vis.location = (0, 2 * R[1] * 0.95, 0)
    elif kind == 'lana':
        clay.blob(f'{name} | gorro lana', (0, 0.0, top - 0.3), (R[0] * 1.05, R[1] * 1.05, 0.62), coll, mats['acc2'], n=12,
                  shaper=lambda v: np.where(v[:, 2:3] < 0, v * np.array([1, 1, 0.05]), v))
        clay.lathe(f'{name} | borde lana', [(R[0] * 1.08, top - 0.32), (R[0] * 1.1, top - 0.2), (R[0] * 1.02, top - 0.15)], coll, mats['acc2'], segments=40)
        clay.blob(f'{name} | pompón', (0, 0.0, top + 0.3), (0.13, 0.13, 0.12), coll, mats['acc2'], n=8)
    elif kind == 'guardia':
        clay.lathe(f'{name} | gorra guardia', [(R[0] * 0.98, top - 0.18), (R[0] * 1.0, top + 0.05), (R[0] * 1.08, top + 0.12), (0, top + 0.16)], coll,
                   mats['acc2'], segments=40)
        clay.blob(f'{name} | visera', (0, -R[1] * 0.95, top - 0.16), (0.4, 0.3, 0.03), coll, mats['lens'], n=8)
        clay.blob(f'{name} | placa', (0, -R[1] * 1.02, top - 0.02), (0.08, 0.02, 0.09), coll, mats['gold'], n=5)


# --------------------------------------------------------------------------
# Accesorios
# --------------------------------------------------------------------------

def _hand(D, side):
    sx = -1 if side == 'izq' else 1
    A = D['arm']
    d = cuerpo._dir(D['arm_deg'], A.get('dy', 0.08)) * np.array([sx, 1, 1])
    return np.array(D['joint']) * np.array([sx, 1, 1]) + d * A['hand_t']


def accessories(coll, head, P, D, mats, name, accs):
    hc = np.array(P['head_center'])
    F = P['face']
    surf = clay.Surface(head)
    for a in accs:
        if a in ('gafas', 'gafas_sol'):
            for sx in (-1, 1):
                loc, nrm = surf.front(sx * F['eye_x'], F['eye_z'])
                ring = []
                for k in range(20):
                    t = 2 * math.pi * k / 20
                    ring.append(loc + np.array([math.cos(t) * 0.15, -0.07, math.sin(t) * 0.14]))
                clay.sweep(f'{name} | marco gafas {sx}', ring, 0.016, (1, 1), coll, mats['acc2'], segments=8, samples=3, closed=True)
                lens = clay.blob(f'{name} | lente {sx}', loc + np.array([0, -0.075, 0]), (0.14, 0.012, 0.13), coll,
                                 mats['lens'] if a == 'gafas_sol' else mats['glass'], n=6)
            l0, _ = surf.front(-F['eye_x'] + 0.15, F['eye_z'] + 0.03)
            l1, _ = surf.front(F['eye_x'] - 0.15, F['eye_z'] + 0.03)
            clay.sweep(f'{name} | puente gafas', [l0 + [0, -0.07, 0], (l0 + l1) / 2 + [0, -0.09, 0.02], l1 + [0, -0.07, 0]], 0.014, (1, 1), coll,
                       mats['acc2'], segments=6, samples=3)
        elif a == 'antifaz':
            personaje.decal_dome(f'{name} | antifaz', surf, 0, F['eye_z'] + 0.01, 0.62, 0.13, 0.02, coll, mats['acc2'])
        elif a == 'audifonos':
            band = [surf.radial(hc, sph(ang, 70 if abs(ang) < 60 else 20), 0.06)[0] for ang in (-95, -70, -40, 0, 40, 70, 95)]
            clay.sweep(f'{name} | diadema', band, 0.035, (0.6, 1), coll, mats['acc2'], segments=8, samples=5)
            for sx in (-1, 1):
                loc, nrm = surf.ray((sx * 3, 0.03, P['ear']['z']), (-sx, 0, 0))
                clay.blob(f'{name} | auricular {sx}', loc + np.array([sx * 0.12, 0, 0]), (0.08, 0.16, 0.18), coll, mats['acc'], n=8)
        elif a == 'bigote':
            loc, nrm = surf.front(0, F['mouth'][1] + 0.07)
            clay.sweep(f'{name} | bigote', [loc + [-0.17, -0.01, -0.03], loc + [-0.06, -0.03, 0.01], loc + [0, -0.03, 0.0], loc + [0.06, -0.03, 0.01],
                                           loc + [0.17, -0.01, -0.03]], [0.02, 0.04, 0.03, 0.04, 0.02], (0.7, 1), coll, mats['hair'], segments=10, samples=4,
                       up=(0, -1, 0))
        elif a == 'corbata':
            clay.sweep(f'{name} | corbata', [(0, -0.3, 0.9), (0, -0.33, 0.75), (0, -0.34, 0.62)], [0.04, 0.06, 0.07], (0.25, 1), coll, mats['acc'],
                       segments=8, samples=4, up=(0, -1, 0), caps=('round', 'point'))
            for sx in (-1, 1):
                clay.sweep(f'{name} | cuello camisa {sx}', [(sx * 0.02, -0.26, 0.93), (sx * 0.12, -0.29, 0.86)], [0.04, 0.02], (0.3, 1), coll, mats['white'],
                           segments=6, samples=3, up=(0, -1, 0), caps=('round', 'point'))
        elif a == 'delantal':
            clay.blob(f'{name} | delantal', (0, -0.25, 0.6), (0.3, 0.05, 0.28), coll, mats['acc'], n=8, p=3)
            clay.blob(f'{name} | bolsillo delantal', (0, -0.3, 0.52), (0.14, 0.02, 0.07), coll, mats['acc'], n=6, p=3)
            for sx in (-1, 1):
                clay.sweep(f'{name} | tira {sx}', [(sx * 0.18, -0.26, 0.85), (sx * 0.14, -0.2, 0.95), (sx * 0.1, 0.0, 1.0)], 0.02, (1, 1), coll, mats['acc'],
                           segments=6, samples=3)
        elif a == 'placa':
            clay.blob(f'{name} | placa', (0.18, -0.3, 0.8), (0.07, 0.015, 0.035), coll, mats['white'], n=5)
        elif a == 'baston':
            h = _hand(D, 'der')
            clay.sweep(f'{name} | bastón', [h + [0.02, -0.02, 0.05], h + [0.04, -0.03, -0.6], (h[0] + 0.05, h[1] - 0.03, 0.0)], 0.025, (1, 1), coll,
                       clay.material('Cliente | madera', '#9C6B45', rough=0.6), segments=8, samples=3)
            clay.sweep(f'{name} | mango', [h + [0.02, -0.02, 0.05], h + [-0.04, -0.03, 0.12], h + [-0.1, -0.03, 0.06]], 0.025, (1, 1), coll,
                       clay.material('Cliente | madera', '#9C6B45', rough=0.6), segments=8, samples=3)
        elif a in ('bolso', 'maletin'):
            h = _hand(D, 'izq')
            if a == 'bolso':
                clay.rbox(f'{name} | bolso', h + [0.0, 0.0, -0.3], (0.16, 0.08, 0.13), coll, mats['acc'], p=3)
                clay.sweep(f'{name} | asa bolso', [h + [-0.1, 0, -0.18], h + [0, 0, 0.0], h + [0.1, 0, -0.18]], 0.018, (1, 1), coll, mats['acc'], segments=6, samples=3)
            else:
                clay.rbox(f'{name} | maletín', h + [0.0, 0.0, -0.32], (0.22, 0.07, 0.17), coll, mats['acc2'], p=5)
                clay.sweep(f'{name} | asa maletín', [h + [-0.06, 0, -0.15], h + [0, 0, -0.08], h + [0.06, 0, -0.15]], 0.02, (1, 1), coll, mats['acc2'],
                           segments=6, samples=3)
                clay.rbox(f'{name} | broche', h + [0.0, -0.075, -0.22], (0.04, 0.01, 0.02), coll, mats['gold'], p=5)
        elif a == 'paleta':
            h = _hand(D, 'der')
            clay.sweep(f'{name} | palo', [h + [0, -0.05, 0], h + [0, -0.08, 0.35]], 0.012, (1, 1), coll, mats['white'], segments=6, samples=2)
            clay.lathe(f'{name} | dulce', [(0.0, -0.03), (0.13, -0.02), (0.13, 0.02), (0.0, 0.03)], coll, mats['acc'], segments=24).location = h + [0, -0.09, 0.45]
            bpy.context.view_layer.update()
        elif a == 'costal':
            clay.blob(f'{name} | costal', (0.1, 0.5, 0.95), (0.35, 0.3, 0.38), coll, clay.material('Cliente | costal', '#C9A774', rough=0.9,
                      fuzz=dict(scale=120, color='#DCC08F', amount=0.6, strength=0.4, distance=0.004)), n=10)
            clay.sweep(f'{name} | nudo', [(0.2, 0.5, 1.3), (0.35, 0.3, 1.2), (0.33, 0.0, 0.95)], 0.035, (1, 1), coll,
                       clay.material('Cliente | costal', '#C9A774', rough=0.9), segments=8, samples=3)
        elif a == 'camara':
            clay.rbox(f'{name} | cámara', (0, -0.32, 0.72), (0.12, 0.06, 0.08), coll, mats['acc2'], p=5)
            obj_lens = clay.lathe(f'{name} | objetivo', [(0.05, 0), (0.045, 0.06)], coll, mats['lens'], segments=20)
            obj_lens.location = (0, -0.38, 0.72)
            obj_lens.rotation_euler = (math.pi / 2, 0, 0)
            clay.sweep(f'{name} | correa', [(-0.12, -0.3, 0.75), (-0.2, -0.2, 0.95), (0, -0.1, 1.0), (0.2, -0.2, 0.95), (0.12, -0.3, 0.75)], 0.012, (1, 1), coll,
                       mats['acc'], segments=6, samples=4)
        elif a == 'estrellitas':
            for k, (x, z) in enumerate(((-0.8, 2.3), (0.85, 2.1), (0.7, 2.6))):
                clay.blob(f'{name} | brillo {k}', (x, -0.2, z), (0.06, 0.02, 0.06), coll, mats['gold'], n=4)
        elif a == 'canasta':
            import utileria
            h = _hand(D, 'izq')
            utileria.build('canasta', utileria.canasta, coll, (h[0], h[1] - 0.05, h[2] - 0.36), 0.0, 1.1)


# --------------------------------------------------------------------------
# Fichas de clientes y ayudantes
# --------------------------------------------------------------------------

SPECS = {
    # ---------------- clientes ----------------
    'abuelita': dict(base='f', label='Abuelita', hair='moño', hair_color='#D8D4CF', skin='#F2C6A6', top='#B79ADA', sleeves='largas',
                     bottom='#8C6D5B', lower='falda', shoes='#7A5646', sole='#E9E1D4', accs=['gafas', 'baston', 'bolso'], acc_color='#C9506B',
                     acc2_color='#8A6A55', mouth='u', scale=0.95),
    'ejecutivo': dict(base='m', label='Ejecutivo apurado', hair='raya_lado', hair_color='#3A2A22', top='#34466E', jacket='#34466E', sleeves='largas',
                      bottom='#4A4F58', shoes='#1E1C1C', accs=['corbata', 'maletin'], acc_color='#D84A4A', acc2_color='#3B2A20', brow_tilt=14,
                      mouth='recta'),
    'mama': dict(base='f', label='Mamá con su hijo', hair='melena', hair_color='#5A3A28', top='#6FBF9B', sleeves='cortas', bottom='#6FBF9B',
                 lower='falda', shoes='#E98A8A', socks='#F7EFE6', accs=['canasta']),
    'deportista': dict(base='f', label='Chica deportista', hair='cola_alta', hair_color='#7A3B25', top='#79D2C0', sleeves='cortas', bottom='#8C6BC8',
                       shoes='#F48FB1', acc_color='#F48FB1'),
    'adolescente': dict(base='m', label='Adolescente con audífonos', hair='despeinado', hair_color='#2D3E6B', top='#F29B4B', sleeves='largas',
                        bottom='#3E6FA8', shoes='#E9E6DF', accs=['audifonos'], acc_color='#E4564F', acc2_color='#2B2A2A', mouth='recta'),
    'chef': dict(base='m', label='Chef', hat='chef', hair='corto', hair_color='#2A1E1A', top='#F7F5F0', sleeves='largas', bottom='#3A3838',
                 shoes='#2B2A2A', accs=['bigote', 'delantal'], acc_color='#E4564F'),
    'turista': dict(base='m', label='Turista', hat='sombrero', hair='corto', hair_color='#8A5A3A', top='#4FC3D9', sleeves='cortas', bottom='#D8C39A',
                    lower='short', shoes='#8A5A3A', accs=['gafas_sol', 'camara'], acc_color='#E4564F', acc2_color='#E7C98B'),
    'nina': dict(base='f', label='Niña traviesa', hair='coletas', hair_color='#3A2418', top='#F4A7C0', sleeves='cortas', bottom='#F4A7C0',
                 lower='falda', shoes='#E4564F', socks='#FFFFFF', accs=['paleta'], acc_color='#7FD3F5', mouth='lengua', brow_tilt=-6, scale=0.7),
    'famoso': dict(base='m', label='Famoso', hair='copete', hair_color='#E8C45A', top='#D9A94E', jacket='#D9A94E', sleeves='largas', bottom='#2B2A2A',
                   shoes='#F7F5F0', accs=['gafas_sol', 'estrellitas'], acc2_color='#1E1C1C'),
    'ladron': dict(base='m', label='Ladrón', hat='lana', hair='corto', hair_color='#2A1E1A', top='#2F2E2E', stripes=True, sleeves='largas',
                   bottom='#3A3838', shoes='#2B2A2A', accs=['antifaz', 'costal'], acc2_color='#1A1919', brow_tilt=16, mouth='recta'),
    'nino': dict(base='m', label='Hijo de la mamá (niño perdido)', hat='gorra_atras', hair='corto', hair_color='#5A3A28', top='#F7D24A', sleeves='cortas',
                 bottom='#5A8FD6', lower='short', shoes='#E4564F', acc_color='#5DBB7A', mouth='o', brow_tilt=-10, scale=0.62),
    # ---------------- ayudantes ----------------
    'cajera': dict(base='f', label='Ayudante: cajera', hat='gorra', hair='melena', hair_color='#3A2418', top='#EE7A68', sleeves='cortas',
                   bottom='#3A3838', shoes='#2B2A2A', accs=['placa'], acc_color='#EE7A68'),
    'reponedor': dict(base='m', label='Ayudante: reponedor', hat='gorra', hair='corto', hair_color='#2A1E1A', top='#F7F5F0', sleeves='cortas',
                      bottom='#3E6FA8', shoes='#2B2A2A', accs=['delantal', 'placa'], acc_color='#5DBB7A'),
    'guardia': dict(base='m', label='Ayudante: guardia', hat='guardia', hair='corto', hair_color='#2A1E1A', top='#2F4A7A', sleeves='cortas',
                    bottom='#2F4A7A', shoes='#1E1C1C', accs=['placa'], acc2_color='#23375C', brow_tilt=8, mouth='recta'),
    'aseo': dict(base='f', label='Ayudante: aseo', hat='gorra', hair='cola_alta', hair_color='#5A3A28', top='#8EC9F0', sleeves='cortas',
                 bottom='#8EC9F0', shoes='#F7D24A', accs=['delantal'], acc_color='#F7D24A'),
}


def build(key, coll=None):
    """Construye un cliente/ayudante centrado en el origen; devuelve el vacío raíz."""
    S = SPECS[key]
    name = f'Cliente {key}' if 'Ayudante' not in S['label'] else f'Ayudante {key}'
    coll = coll or clay.collection(name)
    base_mod = el if S['base'] == 'm' else ella
    P = copy.deepcopy(base_mod.P)
    D = copy.deepcopy(base_mod.D)
    P['face']['mouth_type'] = S.get('mouth', 'u')
    P['face']['brow_tilt'] = S.get('brow_tilt', 0)
    before = set(coll.objects)
    mats = materials(name, S)
    if S.get('stripes'):
        mats['shirt'] = M(f'{name} | rayas', '#2F2E2E', rough=0.85, sheen=0.3, sheen_tint='#FFFFFF',
                          wave=dict(scale=5, strength=0.2, axis='Z', distortion=0.0))
        # rayas blancas y negras con textura de ondas en el color
        nt = mats['shirt'].node_tree
        wave = [n for n in nt.nodes if n.type == 'TEX_WAVE'][0]
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.interpolation = 'CONSTANT'
        ramp.color_ramp.elements[0].color = clay.rgb('#262525')
        ramp.color_ramp.elements[1].position = 0.5
        ramp.color_ramp.elements[1].color = clay.rgb('#F2F0EB')
        nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac'])
        bsdf = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'][0]
        nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    head = personaje.build_head(coll, P, mats, name)
    face, surf = personaje.build_face(coll, head, P, mats, name)
    personaje.build_ears(coll, head, P, mats, name, surf)
    personaje.build_neck(coll, P, mats, name)
    hair(coll, head, P, mats, name, S.get('hair', 'corto'))
    if S.get('hat'):
        hat(coll, head, P, mats, name, S['hat'])
    # Ropa
    if S.get('sleeves') == 'largas':
        D['sleeve'] = dict(len=0.27, r=(D['sleeve']['r'][0], D['sleeve']['r'][1] * 0.85), hole=D['sleeve']['hole'] * 0.8)
    cuerpo.shirt(coll, mats, name, D)
    if S.get('jacket'):
        pass
    cuerpo.arms(coll, mats, name, D)
    lower = S.get('lower', 'pantalon')
    if S['base'] == 'm' and lower == 'pantalon':
        cuerpo.pants(coll, mats, name, D)
    elif lower == 'falda':
        z_top = D['torso']['bottom'] + 0.06
        D['skirt'] = dict(top=z_top, hem=0.3, r=(D['torso']['half'][0] * 0.95, D['torso']['half'][0] * 1.2))
        cuerpo.skirt(coll, mats, name, D)
        if 'legs' not in D:
            D['legs'] = dict(x=0.2, y=0.0, top=0.46, ankle=0.2, r=(0.1, 0.095), sock_top=0.26, sock_r=0.1)
        cuerpo.legs(coll, mats, name, D)
    else:  # shorts o pantalón en base femenina
        if S['base'] == 'm':
            D['pants'] = dict(D['pants'], bottom=0.32, bulge=None, pockets=True, knee=False, cuffs=True,
                              leg_bot=(0.232, 0.005, 0.34), bounds=((-0.54, -0.32, 0.26), (0.54, 0.38, 0.58)))
            D['legs'] = dict(x=0.23, y=0.0, top=0.36, ankle=0.2, r=(0.1, 0.095), sock_top=0.24, sock_r=0.1)
            cuerpo.pants(coll, mats, name, D)
            cuerpo.legs(coll, mats, name, D)
        else:
            if lower == 'short':
                cuerpo.pants(coll, mats, name, D)
                cuerpo.legs(coll, mats, name, D)
            else:
                D['pants'] = dict(D['pants'], bottom=0.14, cuffs=False, leg_bot=(0.215, 0.01, 0.2), leg_r=(0.2, 0.19),
                                  bounds=((-0.5, -0.32, 0.1), (0.5, 0.36, 0.64)))
                cuerpo.pants(coll, mats, name, D)
    D['shoe'] = dict(D.get('shoe', {}), laces=S['base'] == 'f')
    cuerpo.shoes(coll, mats, name, D)
    accessories(coll, head, P, D, mats, name, S.get('accs', []))
    new = [o for o in coll.objects if o not in before]
    root = bpy.data.objects.new(f'{name} | raíz', None)
    clay.link(root, coll)
    for o in new:
        if o.parent is None:
            o.parent = root
    s = S.get('scale', 1.0)
    root.scale = (s, s, s)
    return root
