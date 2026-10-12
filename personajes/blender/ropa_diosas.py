"""Ropa de las diosas para las escenas de cine de la granja (exclusiva: no se vende en la tienda).

Celia, la semidiosa de la Tierra: vestido largo verde brote con hojas bordadas y corona de hojas, flores y brotes.
Aura, la del fuego que despierta: vestido dorado con soles bordados y corona de llamas.
Lara, la que acompaña el descanso: vestido de noche con estrellas, velo oscuro y transparente que le cubre la frente y
los ojos (como dice la mitología: un rostro lleno de amor que casi no se ve), corona de rosas y luna creciente.
Las tres flotan: el vestido llega hasta el piso y tapa los pies.
"""
import math

import numpy as np

import clay
import sdf
from ropa import flor, prenda, punto_cabeza
from ropa_abajo import base_vestido
from ropa_arriba import V


# ---------------------------------------------------------------------------
# Vestido largo de diosa
# ---------------------------------------------------------------------------

def _bordado(ctx, ff, forma, mat, n, semilla, z0=0.12, z1=0.5, r=0.034):
    """Figuritas pegadas a la falda (hojas, soles o estrellas) mirando hacia afuera."""
    rng = np.random.default_rng(semilla)
    objs = []
    for k in range(n):
        a = rng.uniform(0, 2 * math.pi)
        z = rng.uniform(z0, z1)
        O = np.array([[math.cos(a) * 2, 0.03 + math.sin(a) * 2, z]])
        P, hit = sdf.trace(ff, O, (-math.cos(a), -math.sin(a), 0), max_dist=3.0)
        if not hit[0]:
            continue
        nrm = sdf.normal(ff, P)[0]
        if forma == 'hoja':
            b = clay.blob(ctx.nombre(f'hoja bordada {k}'), (0, 0, 0), (r * 0.55, 0.007, r * 1.25), ctx.coll, mat, n=4, p=1.7)
        elif forma == 'sol':
            b = clay.blob(ctx.nombre(f'sol bordado {k}'), (0, 0, 0), (r * 0.8, 0.007, r * 0.8), ctx.coll, mat, n=4)
        else:
            b = clay.blob(ctx.nombre(f'estrella bordada {k}'), (0, 0, 0), (r * 0.45, 0.006, r * 0.45), ctx.coll, mat, n=3)
        b.location = P[0] + nrm * 0.005
        clay.orient_to(b, nrm)
        b.rotation_euler.rotate_axis('Z', rng.uniform(-0.6, 0.6))
        objs.append(ctx.pieza(b, 'pelvis'))
    return objs


@prenda('vestido_diosa', 'conjunto', [V('vestido_celia', 'Vestido de Celia', principal='#9FD08A', cinta='#F6E7B0', bordado='#5FA85A', joya='#F2C94C'),
                                      V('vestido_aura', 'Vestido de Aura', principal='#FFD36B', cinta='#FFF3C8', bordado='#E8892B', joya='#FF9D4A'),
                                      V('vestido_lara', 'Vestido de Lara', principal='#3A2F5C', cinta='#C9B6EA', bordado='#E9E4F5', joya='#B9A4F0')],
        para=('ella',), exclusiva=True)
def vestido_diosa(ctx):
    # Falda acampanada hasta el piso (hem bajo, vuelo amplio) con mangas bombachas
    objs, f, ff = base_vestido(ctx, hem=0.02, r1=0.98, mangas_si='bombacha', pliegues=18)
    joya = ctx.m('joya', tipo='brillo')
    cinta = ctx.m('cinta', tipo='lisa')
    # Dos volantes con onda y un ribete en el ruedo
    for k, z in enumerate((0.36, 0.2)):
        ring = sdf.ring_points(ff, (0, 0.03, z), (0, 0, 1), 1.4, 56, lift=0.01)
        if len(ring) > 12:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'volante diosa {k}'), [p + np.array([0, 0, 0.018 * math.sin(i * 1.1)]) for i, p in enumerate(ring)],
                                             0.032, (1.3, 0.45), ctx.coll, ctx.m('principal'), segments=8, samples=3, closed=True), 'pelvis'))
    ring = sdf.ring_points(ff, (0, 0.03, 0.06), (0, 0, 1), 1.4, 64, lift=0.006)
    if len(ring) > 12:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('ribete ruedo diosa'), ring, 0.022, (1, 0.7), ctx.coll, cinta, segments=6, samples=3, closed=True),
                              'pelvis'))
    # Bordado según la diosa: el color «bordado» lo pinta el juego; la forma es una hoja suave que también lee como llama
    # o estrella desde lejos (un solo modelo para las tres variantes)
    objs += _bordado(ctx, ff, 'hoja', ctx.m('bordado', tipo='lisa'), 30, 21)
    objs += _bordado(ctx, ff, 'estrella', joya, 14, 22, z0=0.1, z1=0.48, r=0.03)
    # Joya del pecho con su engaste
    T = ctx.D['torso']
    zj = T['c'][2] + T['half'][2] * 0.35
    P, hit = sdf.trace(f, np.array([[0.0, -2.0, zj]]), (0, 1, 0), max_dist=4.0)
    if hit[0]:
        nrm = sdf.normal(f, P)[0]
        g = clay.blob(ctx.nombre('joya pecho diosa'), tuple(P[0] + nrm * 0.03), (0.05, 0.025, 0.06), ctx.coll, joya, n=5, p=1.6)
        objs.append(ctx.pieza(g, 'torso'))
        aro = clay.blob(ctx.nombre('engaste joya diosa'), tuple(P[0] + nrm * 0.018), (0.07, 0.015, 0.08), ctx.coll, cinta, n=5, p=1.6)
        objs.append(ctx.pieza(aro, 'torso'))
    return objs


# ---------------------------------------------------------------------------
# Coronas y velo
# ---------------------------------------------------------------------------

def _aro_cabeza(ctx, el=58, lift=0.03, desde=-180, hasta=180, n=25):
    pts = []
    for az in np.linspace(desde, hasta, n):
        loc, nrm = punto_cabeza(ctx, az, el, lift)
        if loc is not None:
            pts.append((loc, np.array(nrm), az))
    return pts


@prenda('corona_hojas', 'cabeza', [V('corona_hojas', 'Corona de hojas de Celia', principal='#6FAE55', claro='#A8D88A', flores='#F7C8D8', centro='#F2C94C')],
        para=('ella',), exclusiva=True)
def corona_hojas(ctx):
    """Aro de ramitas con hojas que se alternan hacia arriba, cinco flores al frente y brotes enroscados."""
    rama = ctx.m('principal', tipo='lisa')
    hoja_o = ctx.m('principal', tipo='peluche')
    hoja_c = ctx.m('claro', tipo='peluche')
    aro = _aro_cabeza(ctx, el=62, lift=0.04, n=29)
    ctx.pieza(clay.sweep(ctx.nombre('rama corona'), [p for p, _, _ in aro], 0.018, (1, 1), ctx.coll, rama, segments=6, samples=3, closed=True), 'cabeza')
    for k, (p, nrm, az) in enumerate(aro):
        # Hojas en abanico, más grandes al frente
        frente = 1.0 - min(1.0, abs(((az + 180) % 360) - 180) / 180.0) * 0.4
        for s in (-1, 1):
            h = clay.blob(ctx.nombre(f'hoja corona {k}{s}'), (0, 0, 0), (0.06 * frente, 0.016, 0.13 * frente), ctx.coll,
                          hoja_o if (k + (s > 0)) % 2 else hoja_c, n=4, p=1.7)
            tang = np.array([-math.sin(math.radians(az)), math.cos(math.radians(az)), 0.0])
            h.location = tuple(p + nrm * 0.03 + np.array([0, 0, 0.07 * frente]) + tang * s * 0.035)
            clay.orient_to(h, nrm * 0.6 + tang * s * 0.8)
            h.rotation_euler.rotate_axis('X', -0.5)
            ctx.pieza(h, 'cabeza')
    # Cinco flores al frente (la del medio más grande) y brotitos enroscados entre ellas
    for k, az in enumerate((-40, -20, 0, 20, 40)):
        loc, nrm = punto_cabeza(ctx, az, 61, 0.09)
        if loc is None:
            continue
        fl = flor(ctx, f'flor corona {k}', 0.22 if az == 0 else 0.15, ctx.m('flores', tipo='lisa'), ctx.m('centro', tipo='lisa'), petalos=5)
        fl.location = tuple(loc)
        clay.orient_to(fl, np.array(nrm))
        ctx.pieza(fl, 'cabeza')
    for k, az in enumerate((-55, -30, 30, 55)):
        loc, nrm = punto_cabeza(ctx, az, 63, 0.05)
        if loc is None:
            continue
        nrm = np.array(nrm)
        pts = [loc + nrm * 0.01 + np.array([0, 0, 0.02]), loc + nrm * 0.08 + np.array([0, 0, 0.16]),
               loc + nrm * 0.05 + np.array([0.06 * (1 if az > 0 else -1), 0, 0.25]), loc + nrm * 0.0 + np.array([0.02, 0, 0.22])]
        ctx.pieza(clay.sweep(ctx.nombre(f'brote corona {k}'), pts, 0.018, (1, 1), ctx.coll, hoja_c, segments=5, samples=5, caps=('round', 'round')),
                  'cabeza')


@prenda('corona_llamas', 'cabeza', [V('corona_llamas', 'Corona de llamas de Aura', principal='#E8C66A', llama='#FFB347', centro='#FFF1B1')],
        para=('ella',), exclusiva=True)
def corona_llamas(ctx):
    """Aro de oro con siete llamas que brillan solas (la del centro más alta) y un sol pequeño al frente."""
    oro = ctx.m('principal', tipo='metal')
    llama = ctx.m('llama', tipo='luz')
    centro = ctx.m('centro', tipo='luz')
    aro = _aro_cabeza(ctx, el=62, lift=0.035, desde=-180, hasta=180, n=29)
    ctx.pieza(clay.sweep(ctx.nombre('aro corona llamas'), [p for p, _, _ in aro], 0.03, (1.3, 0.8), ctx.coll, oro, segments=8, samples=3, closed=True), 'cabeza')
    for k, az in enumerate((-75, -50, -25, 0, 25, 50, 75)):
        loc, nrm = punto_cabeza(ctx, az, 62, 0.04)
        if loc is None:
            continue
        nrm = np.array(nrm)
        alto = 0.36 if az == 0 else 0.28 - abs(az) / 75 * 0.1
        curva = np.array([math.sin(math.radians(az)) * 0.03, 0, 0])
        pts = [loc, loc + nrm * 0.02 + np.array([0, 0, alto * 0.5]) - curva, loc + nrm * 0.0 + np.array([0, 0, alto]) + curva]
        ctx.pieza(clay.sweep(ctx.nombre(f'llama corona {k}'), pts, [0.085, 0.055, 0.005], (1, 0.55), ctx.coll, llama, segments=8, samples=5,
                             caps=('round', 'point'), up=tuple(nrm)), 'cabeza')
        ctx.pieza(clay.sweep(ctx.nombre(f'centro llama {k}'), [loc + nrm * 0.012, loc + nrm * 0.015 + np.array([0, 0, alto * 0.55])],
                             [0.04, 0.004], (1, 0.5), ctx.coll, centro, segments=6, samples=3, caps=('round', 'point'), up=tuple(nrm)), 'cabeza')
    loc, nrm = punto_cabeza(ctx, 0, 55, 0.07)
    if loc is not None:
        s = clay.blob(ctx.nombre('sol corona'), tuple(loc), (0.07, 0.03, 0.07), ctx.coll, centro, n=4)
        clay.orient_to(s, np.array(nrm))
        ctx.pieza(s, 'cabeza')
        for k in range(8):
            a = k * math.pi / 4
            r = clay.blob(ctx.nombre(f'rayo sol corona {k}'), (0, 0, 0), (0.018, 0.014, 0.045), ctx.coll, oro, n=3)
            r.location = tuple(np.array(loc) + np.array([math.cos(a) * 0.11, -0.01, math.sin(a) * 0.11]))
            r.rotation_euler = (0, math.pi / 2 - a, 0)
            ctx.pieza(r, 'cabeza')


@prenda('velo_lara', 'cabeza', [V('velo_lara', 'Velo de Lara', principal='#2A2238', rosas='#8E3B5E', luna='#F3EEDF', hojas='#4E6B4A')],
        para=('ella',), exclusiva=True)
def velo_lara(ctx):
    """Velo oscuro que cae desde la coronilla por la espalda y, adelante, una franja transparente sobre la frente y los
    ojos. Encima, corona de rosas con hojitas y una luna creciente al frente."""
    hc = ctx.hc
    m = ctx.m('principal', tipo='peluche')
    # Velo de atrás (como el de novia, más largo y amplio)
    filas, cols = 9, 13
    verts, faces = [], []
    for i in range(filas):
        t = i / (filas - 1)
        for j in range(cols):
            u = j / (cols - 1) - 0.5
            az = 180 + u * 200 * (1 - 0.25 * t)
            if t < 0.3:
                loc, n = punto_cabeza(ctx, az, 75 - t * 130, 0.06)
                p = loc if loc is not None else hc
            else:
                ang = math.radians(az)
                rr = 0.66 + 0.3 * t
                p = np.array([math.sin(ang) * rr, 0.22 + 0.5 * t, hc[2] - 0.32 - (t - 0.3) * 1.6])
            p = p + np.array([0, 0, 0.025 * math.sin(j * 1.7 + i)])
            verts.append(p)
    for i in range(filas - 1):
        for j in range(cols - 1):
            a = i * cols + j
            faces.append((a, a + 1, a + cols + 1, a + cols))
    o = clay.make_mesh_object(ctx.nombre('velo lara'), verts, faces, ctx.coll, material=m)
    clay.add_solidify(o, 0.012, offset=0.0)
    clay.add_subsurf(o, 2, 2)
    o['modo'] = 'pelo_largo'
    o['corte'] = 1.4
    # Franja del frente: tela fina y transparente que baja hasta la nariz
    sheer = ctx.m('principal', tipo='lisa', alpha=0.55)
    sheer.blend_method = 'BLEND'
    filas, cols = 5, 13
    verts, faces = [], []
    for i in range(filas):
        t = i / (filas - 1)
        for j in range(cols):
            az = -80 + j / (cols - 1) * 160
            loc, n = punto_cabeza(ctx, az, 60 - t * 52, 0.04 + 0.03 * t)
            p = loc if loc is not None else hc
            verts.append(np.array(p) + np.array([0, 0, -0.01 * math.sin(j * 1.3) * t]))
    for i in range(filas - 1):
        for j in range(cols - 1):
            a = i * cols + j
            faces.append((a, a + 1, a + cols + 1, a + cols))
    f = clay.make_mesh_object(ctx.nombre('velo frente lara'), verts, faces, ctx.coll, material=sheer)
    clay.add_solidify(f, 0.006, offset=0.0)
    clay.add_subsurf(f, 2, 2)
    ctx.pieza(f, 'cabeza')
    # Corona de rosas con hojitas
    rosa = ctx.m('rosas', tipo='peluche')
    hoja = ctx.m('hojas', tipo='peluche')
    for k, (p, nrm, az) in enumerate(_aro_cabeza(ctx, el=62, lift=0.07, n=17)):
        if k % 2:
            ctx.pieza(clay.blob(ctx.nombre(f'rosa velo {k}'), tuple(p), (0.05, 0.05, 0.045), ctx.coll, rosa, n=4), 'cabeza')
            ctx.pieza(clay.blob(ctx.nombre(f'centro rosa velo {k}'), tuple(p + nrm * 0.03), (0.022, 0.022, 0.02), ctx.coll, rosa, n=3), 'cabeza')
        else:
            h = clay.blob(ctx.nombre(f'hoja velo {k}'), (0, 0, 0), (0.03, 0.01, 0.055), ctx.coll, hoja, n=4, p=1.7)
            h.location = tuple(p)
            clay.orient_to(h, nrm)
            ctx.pieza(h, 'cabeza')
    # Luna creciente al frente, arriba de la franja
    loc, n = punto_cabeza(ctx, 0, 66, 0.1)
    if loc is not None:
        luna = ctx.m('luna', tipo='luz')
        pts = [np.array(loc) + np.array([math.cos(a) * 0.09, -0.01, math.sin(a) * 0.09 + 0.06]) for a in np.linspace(-1.9, 1.9, 9)]
        ctx.pieza(clay.sweep(ctx.nombre('luna velo'), pts, [0.008, 0.03, 0.008], (1, 0.6), ctx.coll, luna, segments=8, samples=4,
                             caps=('point', 'point')), 'cabeza')
