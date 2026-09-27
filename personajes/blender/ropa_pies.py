"""Zapatos: tenis, botas, botas vaqueras, botas de lluvia, sandalias, pantuflas, zapatos formales y tacones."""
import math

import numpy as np

import clay
import cuerpo
import sdf
from ropa import VX, prenda
from ropa_arriba import V


def lados(ctx):
    S = ctx.D['shoe']
    k = S.get('scale', 1.0)
    for sx in (-1, 1):
        yield sx, sx * S['x'], k


def empeine(x, k, punta=0.0, alto=1.0, largo=1.0, abierto=True):
    """SDF de la capellada del tenis (misma forma que cuerpo.shoes) con punta y alto ajustables (las botas no llevan boca)."""
    upper0 = sdf.union(sdf.ellipsoid((x, -0.03 * k, 0.11 * k * alto), (0.19 * k, 0.265 * k * largo, 0.125 * k * alto)),
                       sdf.ellipsoid((x, (-0.13 - punta) * k, 0.085 * k), (0.186 * k * (1 - punta), (0.18 + punta) * k * largo, 0.088 * k)), k=0.06)
    opening = sdf.ellipsoid((x, 0.03 * k, 0.235 * k * alto), (0.125 * k, 0.15 * k, 0.07 * k))

    def f(P):
        dd = upper0(P)
        if abierto:
            dd = sdf.smax(dd, -opening(P), 0.03)
        dd = sdf.smax(dd, 0.055 * k - P[:, 2], 0.01)
        return dd
    return f


def suela(ctx, sx, x, k, mat, alto=0.075, parte='suela', tacon=0.0, mat_tacon=None):
    sole = sdf.ellipse_cylinder_z((x, -0.04 * k, 0), 0.207 * k, 0.305 * k, 0.012 * k, alto * k, 0.028 * k)
    objs = [ctx.pieza(sdf.to_mesh(ctx.nombre(f'{parte} {ctx.lado(sx)}'), sole, (x - 0.25 * k, -0.38 * k, -0.01), (x + 0.25 * k, 0.3 * k, (alto + 0.03) * k),
                                  VX * 0.8, ctx.coll, mat, smooth=1), ctx.hueso_lado('pie', sx))]
    if tacon:
        t = sdf.round_box((x, 0.16 * k, tacon / 2), (0.09 * k, 0.07 * k, tacon / 2), 0.02)
        objs.append(ctx.pieza(sdf.to_mesh(ctx.nombre(f'tacon {ctx.lado(sx)}'), t, (x - 0.15, 0.0, -0.01), (x + 0.15, 0.3 * k, tacon + 0.03), VX * 0.8,
                                          ctx.coll, mat_tacon or mat, smooth=1), ctx.hueso_lado('pie', sx)))
    return objs


def capellada(ctx, sx, x, k, f, mat, parte='tenis', lo_z=0.03, hi_z=0.3):
    return ctx.pieza(sdf.to_mesh(ctx.nombre(f'{parte} {ctx.lado(sx)}'), f, (x - 0.26 * k, -0.42 * k, lo_z * k), (x + 0.26 * k, 0.32 * k, hi_z),
                                 VX * 0.8, ctx.coll, mat, smooth=2), ctx.hueso_lado('pie', sx))


# ---------------------------------------------------------------------------

@prenda('tenis', 'pies', [V('tenis_rojos', 'Tenis rojos', principal='rojo', suela='blanco', piso='#CFCAC2', cordones='blanco'),
                          V('tenis_azules', 'Tenis azules', principal='azul', suela='blanco', piso='#CFCAC2', cordones='blanco'),
                          V('tenis_rosados', 'Tenis rosados', principal='rosado', suela='blanco', piso='#CFCAC2', cordones='blanco'),
                          V('tenis_amarillos', 'Tenis amarillos', principal='amarillo', suela='blanco', piso='#CFCAC2', cordones='blanco'),
                          V('tenis_verdes', 'Tenis verdes', principal='menta', suela='blanco', piso='#CFCAC2', cordones='blanco'),
                          V('tenis_blancos', 'Tenis blancos', principal='blanco', suela='blanco', piso='#CFCAC2', cordones='blanco'),
                          V('tenis_negros', 'Tenis negros', principal='negro', suela='blanco', piso='#1A1919', cordones='blanco'),
                          V('tenis_lila', 'Tenis lila', principal='lila', suela='blanco', piso='#CFCAC2', cordones='blanco')],
        precio=30)
def tenis(ctx):
    D = dict(ctx.D)
    D['shoe'] = dict(ctx.D['shoe'], laces=True)
    cuerpo.shoes(ctx.coll, {'upper': ctx.m('principal'), 'sole': ctx.m('suela', tipo='lisa'), 'outsole': ctx.m('piso', tipo='lisa'),
                            'lace': ctx.m('cordones', tipo='lisa')}, ctx.N, D)


@prenda('botas', 'pies', [V('botas_cafe', 'Botas café', principal='cafe', suela='#3A2A20', cordones='mostaza'),
                          V('botas_negras', 'Botas negras', principal='negro', suela='#2A2626', cordones='gris'),
                          V('botas_blancas', 'Botas blancas', principal='blanco', suela='gris', cordones='blanco'),
                          V('botas_rosadas', 'Botas rosadas', principal='rosado', suela='blanco', cordones='blanco')],
        precio=45)
def botas(ctx):
    m = ctx.m('principal', tipo='lisa', rough=0.55)
    for sx, x, k in lados(ctx):
        up = empeine(x, k, alto=1.05, abierto=False)
        caña = sdf.round_cone((x, 0.0, 0.14), (x, 0.0, 0.42 if not ctx.el else 0.36), 0.15 * k, 0.14 * k)

        def f(P, up=up, caña=caña):
            return sdf.smin(up(P), caña(P), 0.05)
        capellada(ctx, sx, x, k, f, m, 'bota', hi_z=0.5)
        suela(ctx, sx, x, k, ctx.m('suela', tipo='lisa'), alto=0.09, tacon=0.1)
        ring = sdf.ring_points(f, (x, 0.0, (0.42 if not ctx.el else 0.36) - 0.02), (0, 0, 1), 0.4, 24, lift=0.003)
        if len(ring) > 8:
            ctx.pieza(clay.sweep(ctx.nombre(f'borde bota {ctx.lado(sx)}'), ring, 0.02, (1, 1), ctx.coll, m, segments=6, samples=3, closed=True),
                      ctx.hueso_lado('pie', sx))
        for j, z in enumerate((0.16, 0.22, 0.28)):
            pts = []
            for t in (-1, 0, 1):
                P, hit = sdf.trace(f, np.array([[x + t * 0.07, -1.0, z * k]]), (0, 1, 0), max_dist=2.0)
                if hit[0]:
                    pts.append(P[0] + np.array([0, -0.006, 0]))
            if len(pts) == 3:
                ctx.pieza(clay.sweep(ctx.nombre(f'cordon bota {ctx.lado(sx)} {j}'), pts, 0.011, (1, 0.7), ctx.coll, ctx.m('cordones', tipo='lisa'),
                                     segments=6, samples=3), ctx.hueso_lado('pie', sx))


@prenda('botas_vaqueras', 'pies', [V('botas_vaqueras', 'Botas vaqueras', principal='#8A5A3C', detalle='mostaza', suela='#3A2A20'),
                                   V('botas_vaqueras_negras', 'Botas vaqueras negras', principal='negro', detalle='rojo', suela='#2A2626'),
                                   V('botas_vaqueras_blancas', 'Botas vaqueras blancas', principal='blanco', detalle='rosado', suela='cafe')],
        precio=55)
def botas_vaqueras(ctx):
    m = ctx.m('principal', tipo='lisa', rough=0.4)
    det = ctx.m('detalle', tipo='lisa')
    for sx, x, k in lados(ctx):
        up = empeine(x, k, punta=0.06, alto=1.0, largo=1.08, abierto=False)
        alto = 0.44 if not ctx.el else 0.38
        caña = sdf.round_cone((x, 0.02, 0.14), (x, 0.02, alto), 0.14 * k, 0.16 * k)

        def f(P, up=up, caña=caña):
            return sdf.smin(up(P), caña(P), 0.05)
        capellada(ctx, sx, x, k, f, m, 'bota vaquera', hi_z=0.55)
        suela(ctx, sx, x, k, ctx.m('suela', tipo='lisa'), alto=0.06, tacon=0.12)
        # Costura decorativa en la caña
        pts = []
        for t in np.linspace(-1, 1, 7):
            z = alto - 0.08 - 0.06 * (1 - t * t)
            P, hit = sdf.trace(f, np.array([[x + t * 0.1, -1.0, z]]), (0, 1, 0), max_dist=2.0)
            if hit[0]:
                pts.append(P[0] + np.array([0, -0.004, 0]))
        if len(pts) >= 3:
            ctx.pieza(clay.sweep(ctx.nombre(f'costura vaquera {ctx.lado(sx)}'), pts, 0.01, (1, 0.6), ctx.coll, det, segments=6, samples=4),
                      ctx.hueso_lado('pie', sx))


@prenda('botas_lluvia', 'pies', [V('botas_lluvia', 'Botas de lluvia amarillas', principal='amarillo', suela='blanco'),
                                 V('botas_lluvia_rojas', 'Botas de lluvia rojas', principal='rojo', suela='blanco'),
                                 V('botas_lluvia_rosadas', 'Botas de lluvia rosadas', principal='rosado', suela='blanco'),
                                 V('botas_lluvia_verdes', 'Botas de lluvia verdes', principal='verde', suela='blanco')],
        precio=40)
def botas_lluvia(ctx):
    m = ctx.m('principal', tipo='brillo')
    for sx, x, k in lados(ctx):
        up = empeine(x, k, alto=1.05, abierto=False)
        alto = 0.46 if not ctx.el else 0.38
        caña = sdf.round_cone((x, 0.0, 0.14), (x, 0.0, alto), 0.155 * k, 0.16 * k)

        def f(P, up=up, caña=caña):
            return sdf.smin(up(P), caña(P), 0.05)
        capellada(ctx, sx, x, k, f, m, 'bota lluvia', hi_z=0.55)
        suela(ctx, sx, x, k, ctx.m('suela', tipo='lisa'), alto=0.07)
        ring = sdf.ring_points(f, (x, 0.0, alto - 0.02), (0, 0, 1), 0.4, 24, lift=0.004)
        if len(ring) > 8:
            ctx.pieza(clay.sweep(ctx.nombre(f'borde bota lluvia {ctx.lado(sx)}'), ring, 0.024, (1, 1), ctx.coll, m, segments=6, samples=3, closed=True),
                      ctx.hueso_lado('pie', sx))


@prenda('sandalias', 'pies', [V('sandalias_cafe', 'Sandalias café', principal='cafe', suela='#E7D3B5'),
                              V('sandalias_rosadas', 'Sandalias rosadas', principal='rosado', suela='blanco'),
                              V('sandalias_negras', 'Sandalias negras', principal='negro', suela='#E7D3B5'),
                              V('sandalias_doradas', 'Sandalias doradas', principal='dorado', suela='blanco')],
        oculta=('medias',), precio=30)
def sandalias(ctx):
    m = ctx.m('principal', tipo='lisa')
    piel = ctx.piel_mat
    for sx, x, k in lados(ctx):
        # Pie a la vista con cinco deditos
        pie = clay.blob(ctx.nombre(f'pie sandalia {ctx.lado(sx)}'), (x, -0.03 * k, 0.1 * k), (0.15 * k, 0.24 * k, 0.085 * k), ctx.coll, piel, n=8)
        ctx.pieza(pie, ctx.hueso_lado('pie', sx))
        for j in range(5):
            dx = (-2 + j) * 0.052 * k * sx * -1
            r = 0.036 * k * (1.25 if j == (0 if sx > 0 else 4) else 1.0)
            ctx.pieza(clay.blob(ctx.nombre(f'dedo {ctx.lado(sx)} {j}'), (x + dx, -0.25 * k + abs(j - 2) * 0.015 * k, 0.085 * k), (r, r * 1.1, r * 0.85),
                                ctx.coll, piel, n=4), ctx.hueso_lado('pie', sx))
        tobillo = clay.blob(ctx.nombre(f'tobillo sandalia {ctx.lado(sx)}'), (x, 0.0, 0.2 * k), (0.11 * k, 0.11 * k, 0.1 * k), ctx.coll, piel, n=6)
        ctx.pieza(tobillo, ctx.hueso_lado('pie', sx))
        suela(ctx, sx, x, k, ctx.m('suela', tipo='lisa'), alto=0.05)
        for j, (y, z, w) in enumerate(((-0.13, 0.12, 0.16), (0.0, 0.16, 0.15))):
            pts = [(x - w * k, y * k, 0.05 * k), (x - w * 0.6 * k, y * k, z * k), (x + w * 0.6 * k, y * k, z * k), (x + w * k, y * k, 0.05 * k)]
            ctx.pieza(clay.sweep(ctx.nombre(f'tira sandalia {ctx.lado(sx)} {j}'), pts, 0.022 * k, (1.0, 0.45), ctx.coll, m, segments=6, samples=4),
                      ctx.hueso_lado('pie', sx))
        ring = [(x + math.cos(a) * 0.12 * k, 0.02 * k + math.sin(a) * 0.12 * k, 0.24 * k) for a in np.linspace(0, 2 * math.pi, 16, endpoint=False)]
        ctx.pieza(clay.sweep(ctx.nombre(f'tira tobillo {ctx.lado(sx)}'), ring, 0.018 * k, (1.0, 0.5), ctx.coll, m, segments=6, samples=3, closed=True),
                  ctx.hueso_lado('pie', sx))


def pantufla(ctx, sx, x, k, mat):
    up = sdf.ellipsoid((x, -0.05 * k, 0.12 * k), (0.21 * k, 0.3 * k, 0.14 * k))
    boca = sdf.ellipsoid((x, 0.07 * k, 0.25 * k), (0.12 * k, 0.14 * k, 0.07 * k))

    def f(P):
        return sdf.smax(sdf.smax(up(P), -boca(P), 0.03), 0.03 * k - P[:, 2], 0.01)
    capellada(ctx, sx, x, k, f, mat, 'pantufla', lo_z=0.0, hi_z=0.35)
    suela(ctx, sx, x, k, ctx.m('suela', tipo='lisa'), alto=0.035)
    return f


@prenda('pantuflas_conejo', 'pies', [V('pantuflas_conejo', 'Pantuflas de conejito', principal='#FAF6F2', interior='rosado', suela='rosa_palo'),
                                     V('pantuflas_conejo_rosa', 'Pantuflas de conejita rosada', principal='rosado', interior='blanco',
                                       suela='rosa_palo')],
        precio=35)
def pantuflas_conejo(ctx):
    m = ctx.m('principal', tipo='peluche')
    inte = ctx.m('interior', tipo='peluche')
    ojo = ctx.m('ojo', tipo='brillo', color='#1E1B1A')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        for j in (-1, 1):
            # Sobre la punta y echadas hacia adelante: así se ven aunque el pantalón tape el tobillo
            base = np.array([x + j * 0.07 * k, -0.2 * k, 0.2 * k])
            pts = [base, base + np.array([j * 0.04, -0.08, 0.1]), base + np.array([j * 0.07, -0.18, 0.13])]
            ctx.pieza(clay.sweep(ctx.nombre(f'oreja pantufla {ctx.lado(sx)} {j}'), pts, [0.04, 0.045, 0.03], (1.0, 0.5), ctx.coll, m, segments=8,
                                 samples=4, up=(0, -0.4, 1)), ctx.hueso_lado('pie', sx))
            ctx.pieza(clay.sweep(ctx.nombre(f'oreja dentro {ctx.lado(sx)} {j}'), [p + np.array([0, -0.01, 0.018]) for p in pts], [0.02, 0.025, 0.015],
                                 (1.0, 0.3), ctx.coll, inte, segments=6, samples=4, up=(0, -0.4, 1)), ctx.hueso_lado('pie', sx))
            ctx.pieza(clay.blob(ctx.nombre(f'ojo pantufla {ctx.lado(sx)} {j}'), (x + j * 0.06 * k, -0.3 * k, 0.15 * k), (0.018, 0.01, 0.022), ctx.coll,
                                ojo, n=4), ctx.hueso_lado('pie', sx))
        ctx.pieza(clay.blob(ctx.nombre(f'nariz pantufla {ctx.lado(sx)}'), (x, -0.33 * k, 0.12 * k), (0.02, 0.012, 0.014), ctx.coll, inte, n=4),
                  ctx.hueso_lado('pie', sx))


@prenda('pantuflas_oso', 'pies', [V('pantuflas_oso', 'Pantuflas de osito', principal='#B07A52', interior='#F1D6B3', suela='cafe'),
                                  V('pantuflas_panda', 'Pantuflas de panda', principal='#F6F2EA', interior='#2B2422', suela='gris')],
        precio=35)
def pantuflas_oso(ctx):
    m = ctx.m('principal', tipo='peluche')
    inte = ctx.m('interior', tipo='peluche')
    ojo = ctx.m('ojo', tipo='brillo', color='#1E1B1A')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        for j in (-1, 1):
            ctx.pieza(clay.blob(ctx.nombre(f'oreja oso pantufla {ctx.lado(sx)} {j}'), (x + j * 0.1 * k, -0.2 * k, 0.22 * k), (0.055, 0.03, 0.055),
                                ctx.coll, m, n=5), ctx.hueso_lado('pie', sx))
            ctx.pieza(clay.blob(ctx.nombre(f'oreja oso dentro {ctx.lado(sx)} {j}'), (x + j * 0.1 * k, -0.225 * k, 0.215 * k), (0.03, 0.015, 0.03),
                                ctx.coll, inte, n=4), ctx.hueso_lado('pie', sx))
            ctx.pieza(clay.blob(ctx.nombre(f'ojo oso {ctx.lado(sx)} {j}'), (x + j * 0.06 * k, -0.28 * k, 0.17 * k), (0.018, 0.01, 0.022), ctx.coll,
                                ojo, n=4), ctx.hueso_lado('pie', sx))
        ctx.pieza(clay.blob(ctx.nombre(f'hocico oso {ctx.lado(sx)}'), (x, -0.32 * k, 0.12 * k), (0.06, 0.03, 0.04), ctx.coll, inte, n=5),
                  ctx.hueso_lado('pie', sx))
        ctx.pieza(clay.blob(ctx.nombre(f'nariz oso {ctx.lado(sx)}'), (x, -0.35 * k, 0.135 * k), (0.018, 0.012, 0.012), ctx.coll, ojo, n=4),
                  ctx.hueso_lado('pie', sx))


@prenda('zapatos', 'pies', [V('zapatos_negros', 'Zapatos elegantes negros', principal='negro', suela='#2A2626', cordones='negro'),
                            V('zapatos_cafe', 'Zapatos elegantes café', principal='#6B4632', suela='#3A2A20', cordones='cafe'),
                            V('zapatos_blancos', 'Zapatos elegantes blancos', principal='blanco', suela='gris', cordones='blanco')],
        precio=45)
def zapatos(ctx):
    m = ctx.m('principal', tipo='brillo')
    for sx, x, k in lados(ctx):
        f = empeine(x, k * 0.96, punta=0.05, alto=0.82, largo=1.05)
        capellada(ctx, sx, x, k, f, m, 'zapato')
        suela(ctx, sx, x, k * 0.96, ctx.m('suela', tipo='lisa'), alto=0.05, tacon=0.06)
        for j, y in enumerate((-0.09, -0.04)):
            pts = []
            for t in (-1, 0, 1):
                P, hit = sdf.trace(f, np.array([[x + t * 0.06, y * k, 1.0]]), (0, 0, -1), max_dist=2.0)
                if hit[0]:
                    pts.append(P[0] + np.array([0, 0, 0.004]))
            if len(pts) == 3:
                ctx.pieza(clay.sweep(ctx.nombre(f'cordon zapato {ctx.lado(sx)} {j}'), pts, 0.01, (0.8, 1), ctx.coll, ctx.m('cordones', tipo='lisa'),
                                     segments=6, samples=3, up=(0, 0, 1)), ctx.hueso_lado('pie', sx))


@prenda('tacones', 'pies', [V('tacones_rojos', 'Zapatos de tacón rojos', principal='rojo', suela='#2A2626', mono='rojo'),
                            V('tacones_negros', 'Zapatos de tacón negros', principal='negro', suela='#2A2626', mono='negro'),
                            V('tacones_dorados', 'Zapatos de tacón dorados', principal='dorado', suela='#2A2626', mono='dorado'),
                            V('tacones_rosados', 'Zapatos de tacón rosados', principal='rosado', suela='blanco', mono='blanco')],
        para=('ella',), precio=45)
def tacones(ctx):
    m = ctx.m('principal', tipo='brillo')
    for sx, x, k in lados(ctx):
        f = empeine(x, k * 0.95, punta=0.03, alto=0.75)
        capellada(ctx, sx, x, k, f, m, 'zapato tacon')
        suela(ctx, sx, x, k * 0.95, ctx.m('suela', tipo='lisa'), alto=0.04, tacon=0.13, mat_tacon=m)
        pts = [(x - 0.12 * k, 0.02 * k, 0.12 * k), (x, -0.03 * k, 0.2 * k), (x + 0.12 * k, 0.02 * k, 0.12 * k)]
        ctx.pieza(clay.sweep(ctx.nombre(f'correa tacon {ctx.lado(sx)}'), pts, 0.018, (1, 0.5), ctx.coll, m, segments=6, samples=4),
                  ctx.hueso_lado('pie', sx))
        mono = ctx.m('mono', tipo='brillo')
        for j in (-1, 1):
            ctx.pieza(clay.blob(ctx.nombre(f'moño tacon {ctx.lado(sx)} {j}'), (x + j * 0.035, -0.22 * k, 0.16 * k), (0.035, 0.015, 0.025), ctx.coll,
                                mono, n=4), ctx.hueso_lado('pie', sx))
