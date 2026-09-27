"""Piezas compartidas de los personajes: cabeza, rostro, orejas, cuerpo, brazos y tenis.

Cada función recibe un diccionario de proporciones para que Él y Ella compartan
el mismo lenguaje de formas (cabeza tipo mochi, rasgos en relieve, extremidades
cortas redondeadas) con diferencias de tamaño y vestuario.
"""
import math

import bmesh
import numpy as np

import clay
from clay import sph


# --------------------------------------------------------------------------
# Materiales comunes
# --------------------------------------------------------------------------

def common_materials(prefix):
    M = clay.material
    return {
        'skin': M(f'{prefix} | piel melocoton', '#F3B28A', rough=0.46, sss=0.22, sss_radius=(1.0, 0.42, 0.28), sss_scale=0.06,
                  coat=0.08, coat_rough=0.35),
        'ear_in': M(f'{prefix} | interior oreja', '#E9A58C', rough=0.55, sss=0.2, sss_scale=0.04),
        'blush': M(f'{prefix} | rubor', '#F7868E', rough=0.5, sss=0.15, sss_scale=0.03),
        'blush_dot': M(f'{prefix} | brillo rubor', '#FFD3D3', rough=0.35),
        'eye': M(f'{prefix} | ojos charol', '#050404', rough=0.18, coat=0.35, coat_rough=0.03, spec=0.35),
        'shine': M(f'{prefix} | destello', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=1.6),
        'feature': M(f'{prefix} | trazo rostro', '#1B1512', rough=0.35, coat=0.4, coat_rough=0.15),
    }


# --------------------------------------------------------------------------
# Cabeza
# --------------------------------------------------------------------------

def head_shaper(P):
    a, b, c = P['head_radii']
    jowl = P.get('jowl', 0.07)
    flat = P.get('face_flat', 0.14)
    chin = P.get('chin_flat', 0.08)

    def f(v):
        u = v / np.array([a, b, c])  # coordenadas normalizadas
        x, y, z = u[:, 0], u[:, 1], u[:, 2]
        # Mofletes: más ancho en la mitad inferior, sin afilar la barbilla.
        j0, j1, j2, j3 = P.get('jowl_band', (0.35, -0.35, -0.55, -1.0))
        widen = 1 + jowl * clay.smoothstep(j0, j1, z) * (1 - clay.smoothstep(j2, j3, z))
        widen = widen * (1 - P.get('top_narrow', 0.0) * clay.smoothstep(0.1, 0.9, z))
        # Cara más plana al frente para que los rasgos se asienten bien.
        yscale = np.where(y < 0, 1 - flat * clay.smoothstep(0.0, -0.9, y) * (1 - 0.5 * np.abs(x)), 1.0)
        # Base de la cabeza (barbilla) ancha y ligeramente aplanada.
        zscale = np.where(z < 0, 1 - chin * clay.smoothstep(-0.5, -1.0, z), 1.0)
        return np.stack([v[:, 0] * widen, v[:, 1] * yscale, v[:, 2] * zscale], axis=1)
    return f


def build_head(coll, P, mats, name):
    head = clay.blob(f'{name} | cabeza', P['head_center'], P['head_radii'], coll, mats['skin'],
                     n=14, p=P.get('head_p', 2.25), shaper=head_shaper(P), subsurf=2)
    return head


def build_neck(coll, P, mats, name):
    hc = np.array(P['head_center'])
    top = P['neck_top']
    return clay.sweep(f'{name} | cuello', [(0, 0.02, top - 0.12), (0, 0.02, top + 0.12)], P.get('neck_r', 0.13), (1, 1), coll,
                      mats['skin'], segments=16, caps=('flat', 'flat'))


# --------------------------------------------------------------------------
# Rostro
# --------------------------------------------------------------------------

def _surface_stroke(surf, pts2d, lift=0.0):
    """Proyecta una línea (x, z) sobre la cara y la separa 'lift' por la normal."""
    out = []
    for x, z in pts2d:
        loc, nrm = surf.front(x, z)
        out.append(loc + nrm * lift)
    return out


def build_expressions(coll, P, name, surf):
    """Expresiones de la mascota: boca abierta (hablar), boca de beso, boca triste y barro en la cara.
    Quedan ocultas; el juego muestra la que toque según lo que esté haciendo el personaje."""
    M = clay.material
    feature = M(f'{name} | trazo expresion', '#1B1512', rough=0.35, coat=0.4, coat_rough=0.15)
    lengua = M(f'{name} | lengua', '#E86F7A', rough=0.45, sss=0.1, sss_scale=0.02)
    beso = M(f'{name} | labios beso', '#E5566A', rough=0.35, coat=0.3, coat_rough=0.2, sss=0.1, sss_scale=0.02)
    barro = M(f'{name} | barro', '#6B4A33', rough=0.85, noise=dict(scale=60, strength=0.25, detail=4, distance=0.004))
    F = P['face']
    mw, mz, md = F['mouth']
    out = []
    # Boca abierta con lengüita (hablar)
    loc, nrm = surf.front(0, mz - md * 0.55)
    o = clay.blob(f'{name} | boca hablar', (0, 0, 0), (mw * 0.42, 0.022, md * 0.9 + 0.012), coll, feature, n=6, subsurf=2)
    o.location = loc - nrm * 0.004
    clay.orient_to(o, nrm)
    loc, nrm = surf.front(0, mz - md * 0.85)
    t = clay.blob(f'{name} | boca hablar lengua', (0, 0, 0), (mw * 0.26, 0.018, md * 0.35 + 0.006), coll, lengua, n=5, subsurf=2)
    t.location = loc + nrm * 0.004
    clay.orient_to(t, nrm)
    out += [o, t]
    # Piquito de beso
    loc, nrm = surf.front(0, mz - md * 0.45)
    k = clay.blob(f'{name} | boca beso', (0, 0, 0), (mw * 0.3, 0.035, mw * 0.24), coll, beso, n=7, subsurf=2)
    k.location = loc + nrm * 0.008
    clay.orient_to(k, nrm)
    out.append(k)
    # Boca triste (U invertida)
    ts = np.linspace(math.pi * 0.08, math.pi * 0.92, 9)
    pts = [(mw * 0.75 * math.cos(t), mz - md * 0.9 + md * 0.7 * math.sin(t)) for t in ts]
    s = clay.sweep(f'{name} | boca triste', _surface_stroke(surf, pts, 0.0), F.get('mouth_r', 0.021), (0.7, 1.0), coll, feature,
                   segments=12, samples=8, up=(0, -1, 0))
    out.append(s)
    # Barro en la cara (cuando la higiene está baja)
    ex, ez = F['eye_x'], F['eye_z']
    for i, (cx, cz, rx, rz) in enumerate(((-ex * 1.25, ez - 0.2, 0.05, 0.04), (ex * 0.55, ez + 0.2, 0.045, 0.035),
                                          (ex * 1.35, ez - 0.28, 0.03, 0.03))):
        out.append(decal_dome(f'{name} | suciedad cara {i}', surf, cx, cz, rx, rz, 0.012, coll, barro))
    for x in out:
        x.hide_render = True
        x.hide_viewport = True
    return out


def build_dirt_clothes(coll, name, objs):
    """Barro en la ropa (camiseta), oculto por defecto."""
    barro = clay.material(f'{name} | barro ropa', '#6B4A33', rough=0.85, noise=dict(scale=60, strength=0.25, detail=4, distance=0.004))
    surf = clay.Surface(objs)
    out = []
    for i, (cx, cz, rx, rz) in enumerate(((-0.14, 0.66, 0.06, 0.05), (0.12, 0.78, 0.045, 0.04), (0.2, 0.6, 0.035, 0.03))):
        try:
            d = decal_dome(f'{name} | suciedad ropa {i}', surf, cx, cz, rx, rz, 0.014, coll, barro)
        except Exception:
            continue
        d.hide_render = True
        d.hide_viewport = True
        out.append(d)
    return out


def decal_dome(name, surf, cx, cz, rx, rz, height, coll, material, n=18):
    """Parche abombado que sigue la curvatura de la superficie (rubor, manchas).

    Se proyecta una rejilla elíptica sobre la cara vista de frente; el centro se
    eleva 'height' y el borde queda enterrado, así nunca se despega ni se hunde."""
    verts, idx = [], {}
    us = np.linspace(-1, 1, n)
    for i, u in enumerate(us):
        for j, v in enumerate(us):
            r2 = u * u + v * v
            if r2 > 1.0:
                continue
            loc, nrm = surf.front(cx + u * rx, cz + v * rz)
            if loc is None:
                continue
            h = height * math.sqrt(max(1.0 - r2, 0.0)) - 0.004
            idx[(i, j)] = len(verts)
            verts.append(loc + nrm * h)
    faces = []
    for i in range(n - 1):
        for j in range(n - 1):
            q = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
            if all(k in idx for k in q):
                faces.append(tuple(idx[k] for k in q))
    obj = clay.make_mesh_object(name, verts, faces, coll, material=material)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # que las normales miren hacia la cámara (-Y)
    if sum(f.normal.y for f in bm.faces) > 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.shade_smooth()
    clay.add_subsurf(obj, 1, 2)
    return obj


def build_face(coll, head, P, mats, name, expression='feliz'):
    surf = clay.Surface(head)
    objs = {}
    F = P['face']
    ex, ez = F['eye_x'], F['eye_z']
    erx, erz = F['eye_r']
    for side, sx in (('izq', -1), ('der', 1)):
        loc, nrm = surf.front(sx * ex, ez)
        # Ojo de charol: óvalo abombado hundido en la cara.
        eye = clay.blob(f'{name} | ojo {side}', (0, 0, 0), (erx, F.get('eye_depth', 0.055), erz), coll, mats['eye'], n=8, subsurf=2)
        eye.location = loc - nrm * F.get('eye_sink', 0.018)
        clay.orient_to(eye, nrm)
        objs[f'ojo_{side}'] = eye
        # Destellos (arriba a la derecha en ambos ojos, como la referencia)
        eye_surf = clay.Surface(eye)
        hx, hz = F.get('shine_offset', (0.035, 0.05))
        for k, (dx, dz, r) in enumerate(((hx, hz, F.get('shine_r', 0.026)), (-hx * 0.7, -hz * 0.9, F.get('shine_r', 0.026) * 0.45))):
            p, n = eye_surf.front(sx * ex + dx, ez + dz)
            if p is None:
                continue
            s = clay.blob(f'{name} | destello {side} {k}', (0, 0, 0), (r, 0.008, r * 1.1), coll, mats['shine'], n=6, subsurf=1)
            s.location = p - n * 0.002
            clay.orient_to(s, n)
            objs[f'destello_{side}_{k}'] = s
        # Párpado feliz (^ ^) oculto para la expresión de ojos cerrados
        arc = [(sx * ex + dx * erx * 1.1, ez + dz) for dx, dz in ((-1, -0.01), (-0.5, 0.045), (0, 0.06), (0.5, 0.045), (1, -0.01))]
        lid = clay.sweep(f'{name} | ojo feliz {side}', _surface_stroke(surf, arc, 0.0), 0.024, (0.6, 1.0), coll, mats['feature'],
                         segments=10, samples=6, caps=('round', 'round'), up=(0, -1, 0))
        lid.hide_render = True
        lid.hide_viewport = True
        objs[f'ojo_feliz_{side}'] = lid
        # Cejas
        bx = F['brow']
        tilt = math.radians(F.get('brow_tilt', 0.0))  # >0: extremo interior más bajo (enojado/apurado)
        cxb, czb = bx[1][0], bx[1][1]
        pts = []
        for bxx, bzz in bx:
            dxx, dzz = bxx - cxb, bzz - czb
            rx = dxx * math.cos(tilt) - dzz * math.sin(tilt)
            rz = dxx * math.sin(tilt) + dzz * math.cos(tilt)
            pts.append((sx * (cxb + rx), czb + rz + F.get('brow_lift', 0.0)))
        brow = clay.sweep(f'{name} | ceja {side}', _surface_stroke(surf, pts, 0.0), F.get('brow_r', [0.026, 0.033, 0.028]),
                          (0.55, 1.0), coll, mats['brow'], segments=12, samples=8, up=(0, -1, 0))
        objs[f'ceja_{side}'] = brow
        # Rubor con dos puntitos de brillo
        bxz = F['blush']
        loc, nrm = surf.front(sx * bxz[0], bxz[1])
        bl = decal_dome(f'{name} | rubor {side}', surf, sx * bxz[0], bxz[1], F['blush_r'][0], F['blush_r'][1], 0.012, coll, mats['blush'])
        objs[f'rubor_{side}'] = bl
        bsurf = clay.Surface(bl)
        for k, dx in enumerate((-0.035, 0.035)):
            p, n = bsurf.front(sx * bxz[0] + dx, bxz[1] + 0.005)
            if p is None:
                continue
            d = clay.blob(f'{name} | puntito rubor {side} {k}', (0, 0, 0), (0.014, 0.006, 0.02), coll, mats['blush_dot'], n=5, subsurf=1)
            d.location = p - n * 0.001
            clay.orient_to(d, n)
    # Boca: en U (sonrisa), recta, en O o sonrisa con lengua
    mw, mz, md = F['mouth']  # medio ancho, altura de las puntas, profundidad de la curva
    kind = F.get('mouth_type', 'u')
    if kind == 'o':
        loc, nrm = surf.front(0, mz - md * 0.5)
        mo = clay.blob(f'{name} | boca', (0, 0, 0), (mw * 0.45, 0.02, md * 0.7), coll, mats['feature'], n=6, subsurf=2)
        mo.location = loc - nrm * 0.004
        clay.orient_to(mo, nrm)
        objs['boca'] = mo
        return objs, surf
    if kind == 'recta':
        pts = [(-mw * 0.8, mz - md * 0.45), (0, mz - md * 0.5), (mw * 0.8, mz - md * 0.45)]
    else:
        ts = np.linspace(math.pi * 1.06, math.pi * 1.94, 9)
        s0 = math.sin(ts[0])
        pts = [(mw * math.cos(t) / abs(math.cos(ts[0])), mz + md * (math.sin(t) - s0) / (1 + s0)) for t in ts]
    mouth = clay.sweep(f'{name} | boca', _surface_stroke(surf, pts, 0.0), F.get('mouth_r', 0.021), (0.7, 1.0), coll, mats['feature'],
                       segments=12, samples=8, up=(0, -1, 0))
    objs['boca'] = mouth
    if kind == 'lengua':
        loc, nrm = surf.front(mw * 0.3, mz - md * 1.05)
        t = clay.blob(f'{name} | lengua', (0, 0, 0), (0.035, 0.02, 0.03), coll, mats['blush'], n=5, subsurf=2)
        t.location = loc
        clay.orient_to(t, nrm)
    return objs, surf


def build_ears(coll, head, P, mats, name, surf=None):
    surf = surf or clay.Surface(head)
    hc = np.array(P['head_center'])
    E = P['ear']
    out = []
    for side, sx in (('izq', -1), ('der', 1)):
        d = np.array([sx * 1.0, E.get('y', 0.08), 0])
        origin = np.array([sx * 3.0, E.get('y', 0.08), E['z']])
        loc, nrm = surf.ray(origin, (-sx, 0, 0))
        center = loc + np.array([sx * E.get('out', 0.035), 0, 0])
        ear = clay.blob(f'{name} | oreja {side}', center, (E['r'][0], E['r'][1], E['r'][2]), coll, mats['skin'], n=8, subsurf=2,
                        shaper=lambda v, sx=sx: v + np.stack([np.zeros(len(v)), -0.25 * np.abs(v[:, 0]) * 0, np.zeros(len(v))], 1))
        ear.rotation_euler = (0, 0, sx * math.radians(E.get('yaw', 18)))
        inner = clay.blob(f'{name} | oreja interior {side}', center + np.array([sx * E['r'][0] * 0.55, -0.01, -0.005]),
                          (E['r'][0] * 0.35, E['r'][1] * 0.5, E['r'][2] * 0.55), coll, mats['ear_in'], n=6, subsurf=2)
        inner.rotation_euler = ear.rotation_euler
        out += [ear, inner]
    return out


# --------------------------------------------------------------------------
# Cuerpo
# --------------------------------------------------------------------------

def torso_shaper(B):
    """Camiseta tipo 'barril' corto: hombros redondos, base algo más ancha."""
    def f(v):
        rz = B['torso_radii'][2]
        z = v[:, 2] / rz
        widen = 1 + B.get('hem_flare', 0.08) * clay.smoothstep(0.3, -1.0, z)
        shoulder = 1 - B.get('shoulder_drop', 0.10) * clay.smoothstep(0.4, 1.0, z)
        return np.stack([v[:, 0] * widen * shoulder, v[:, 1] * (1 + 0.04 * clay.smoothstep(0.3, -1, z)), v[:, 2]], axis=1)
    return f


def build_torso(coll, B, mat, name):
    return clay.blob(f'{name} | torso', B['torso_center'], B['torso_radii'], coll, mat, n=12, p=B.get('torso_p', 2.6),
                     shaper=torso_shaper(B), subsurf=2)


def build_arm(coll, B, mats, name, side, sx, sleeve_mat, band_mat=None, bracelet_mat=None):
    """Manga corta + brazo + mano de muñeco (manopla con pulgar)."""
    A = B['arm']
    sh = np.array([sx * A['shoulder'][0], A['shoulder'][1], A['shoulder'][2]])
    hand = np.array([sx * A['hand'][0], A['hand'][1], A['hand'][2]])
    d = hand - sh
    L = np.linalg.norm(d)
    dn = d / L
    objs = []
    sleeve_end = sh + dn * A.get('sleeve_len', 0.2)
    sleeve = clay.sweep(f'{name} | manga {side}', [sh - dn * 0.06, sh + dn * 0.08, sleeve_end], [A['sleeve_r'] * 0.95, A['sleeve_r'], A['sleeve_r'] * 1.02],
                        (1.0, 0.92), coll, sleeve_mat, segments=16, samples=5, caps=('round', 'flat'))
    objs.append(sleeve)
    if band_mat is not None:
        band = clay.sweep(f'{name} | puño manga {side}', [sleeve_end - dn * 0.012, sleeve_end + dn * 0.012], A['sleeve_r'] * 1.04, (1.0, 0.94),
                          coll, band_mat, segments=16, samples=2, caps=('round', 'round'))
        objs.append(band)
    arm = clay.sweep(f'{name} | brazo {side}', [sleeve_end - dn * 0.05, hand - dn * 0.05], [A['arm_r'], A['arm_r'] * 0.9], (1, 1),
                     coll, mats['skin'], segments=14, samples=4, caps=('flat', 'flat'))
    objs.append(arm)
    hr = A['hand_r']
    h = clay.blob(f'{name} | mano {side}', hand, (hr * 0.95, hr * 0.9, hr * 1.05), coll, mats['skin'], n=8, subsurf=2)
    objs.append(h)
    thumb_c = hand + np.array([-sx * hr * 0.55, -hr * 0.55, hr * 0.25])
    th = clay.sweep(f'{name} | pulgar {side}', [hand + np.array([-sx * hr * 0.2, -hr * 0.3, hr * 0.1]), thumb_c], [hr * 0.38, hr * 0.33], (1, 1),
                    coll, mats['skin'], segments=10, samples=3)
    objs.append(th)
    if bracelet_mat is not None:
        wrist = hand - dn * (hr * 1.08)
        ring = []
        # círculo perpendicular a dn
        t1 = np.cross(dn, [0, 1, 0])
        t1 /= np.linalg.norm(t1)
        t2 = np.cross(dn, t1)
        rr = A['arm_r'] * 1.22
        for k in range(12):
            a = 2 * math.pi * k / 12
            ring.append(wrist + (t1 * math.cos(a) + t2 * math.sin(a)) * rr)
        br = clay.sweep(f'{name} | manilla dorada', ring, 0.013, (1, 1), coll, bracelet_mat, segments=8, samples=4, closed=True)
        objs.append(br)
    return objs


def build_sneaker(coll, S, mats, name, side, sx):
    """Tenis de muñeco: capellada acolchada, suela gruesa redondeada, cordones y cuello."""
    c = np.array([sx * S['x'], S.get('y', -0.04), 0.0])
    L, W, H = S['len'], S['width'], S['height']
    sole_h = S.get('sole_h', 0.07)
    objs = []

    def sole_shape(v):
        y = v[:, 1] / (L / 2 + 0.016)
        z = v[:, 2]
        widen = 1 + 0.07 * clay.smoothstep(0.2, -0.8, y) - 0.05 * clay.smoothstep(0.3, 1.0, y)
        z = np.where(z < 0, z * 0.55, z)
        return np.stack([v[:, 0] * widen, v[:, 1], z], 1)

    sole = clay.blob(f'{name} | suela {side}', c + np.array([0, 0, sole_h * 0.62]), (W / 2 + 0.016, L / 2 + 0.016, sole_h * 0.62), coll,
                     mats['sole'], n=12, p=3.0, shaper=sole_shape, subsurf=2)
    objs.append(sole)
    uh = H - sole_h

    def upper_shape(v):
        y = v[:, 1] / (L / 2)
        z = v[:, 2] / (uh * 0.62)
        zs = np.where(v[:, 2] > 0, 1 - 0.42 * clay.smoothstep(0.15, -1.0, y), 0.35)
        xs = 1 + 0.05 * clay.smoothstep(0.2, -0.8, y) - 0.06 * clay.smoothstep(0.2, 1.0, y)
        return np.stack([v[:, 0] * xs, v[:, 1], v[:, 2] * zs], 1)

    upper = clay.blob(f'{name} | capellada {side}', c + np.array([0, 0.005, sole_h + uh * 0.1]), (W / 2, L / 2 * 0.97, uh * 0.95), coll,
                      mats['upper'], n=12, p=2.3, shaper=upper_shape, subsurf=2)
    objs.append(upper)
    surf = clay.Surface(upper)
    # Cordones sobre el empeine (proyectados desde arriba)
    for k in range(S.get('laces', 2)):
        y = c[1] - L * 0.2 + k * L * 0.13
        pts = []
        for dx in (-0.2, -0.07, 0.07, 0.2):
            loc, nrm = surf.ray((c[0] + dx * W, y + abs(dx) * 0.05, 3.0), (0, 0, -1))
            if loc is not None:
                pts.append(loc + nrm * 0.004)
        if len(pts) >= 3:
            objs.append(clay.sweep(f'{name} | cordon {side} {k}', pts, 0.016, (0.7, 1.0), coll, mats['lace'], segments=8, samples=4,
                                   up=(0, 0, 1)))
    # Cuello acolchado del tobillo
    ring = []
    for k in range(16):
        a = 2 * math.pi * k / 16
        x = c[0] + math.cos(a) * W * 0.3
        y = c[1] + L * 0.18 + math.sin(a) * L * 0.2
        loc, nrm = surf.ray((x, y, 3.0), (0, 0, -1))
        if loc is not None:
            ring.append(loc + np.array([0, 0, 0.005]))
    if len(ring) > 8:
        objs.append(clay.sweep(f'{name} | cuello tenis {side}', ring, 0.03, (1, 1), coll, mats['upper'], segments=10, samples=4, closed=True))
    # Costura de la puntera
    toe = []
    for k in range(9):
        a = math.pi * (0.15 + 0.7 * k / 8)
        d = np.array([math.cos(a), -math.sin(a), 0])
        origin = c + np.array([0, -L * 0.1, sole_h + 0.035]) + d * 3.0
        loc, nrm = surf.ray(origin, -d)
        if loc is not None:
            toe.append(loc + nrm * 0.002)
    if len(toe) > 4 and 'stitch_shoe' in mats:
        objs.append(clay.sweep(f'{name} | costura puntera {side}', toe, 0.006, (1, 1), coll, mats['stitch_shoe'], segments=6, samples=4))
    return objs
