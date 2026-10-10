"""Ropa del pueblo de la granja (y para el creador de personajes): lo que les faltaba a los vecinos según su oficio.
Sombrero arriero, casco de minero, sombrero de pescador y pañoleta (cabeza); barba (cara); carriel (espalda);
ruana y delantal (arriba); moño bajo y calvo con canas (pelo)."""
import math

import numpy as np

import clay
import sdf
from clay import sph
from ropa import VX, domo, prenda, torso_sdf
from ropa_accesorios import COP, ala_y_copa, atras_y, lathe
from ropa_arriba import V, base_camiseta
from ropa_pelo import V1, casco, hp, mat, mechon, sup


# ---------------------------------------------------------------------------
# Cabeza
# ---------------------------------------------------------------------------

@prenda('sombrero_arriero', 'cabeza', [V('sombrero_arriero', 'Sombrero arriero', principal='#F3EBD9', cinta='#1E1D1D'),
                                        V('sombrero_arriero_cafe', 'Sombrero arriero café', principal='#C9A46A', cinta='#3A2A20')],
        oculta=COP, precio=45)
def sombrero_arriero(ctx):
    """El sombrero paisa: copa con pliegue arriba, ala media un poquito levantada atrás y cinta negra."""
    m = ctx.m('principal', tipo='rib')

    def levantar(co):
        from mathutils import Vector
        return Vector((co.x, co.y, co.z + 0.12 * max(0.0, co.y) ** 2))
    perfil = [(0.0, 0.3), (0.18, 0.34), (0.32, 0.31), (0.5, 0.3), (0.56, 0.18), (0.56, 0.0)]
    c, ala, copa = ala_y_copa(ctx, m, m, r_ala=0.9, r_copa=0.56, grosor=0.03, deformar=levantar, copa_perfil=perfil)
    lathe(ctx, 'cinta arriero', [(0.565, 0.015), (0.578, 0.06), (0.565, 0.1)], ctx.m('cinta', tipo='lisa'), c, tapa_abajo=False,
          tapa_arriba=False)


@prenda('casco_minero', 'cabeza', [V('casco_minero', 'Casco de minero', principal='#F0B323', lampara='#3A3A40', luz='#FFF3B0')],
        oculta=COP, precio=50)
def casco_minero(ctx):
    m = ctx.m('principal', tipo='lisa')
    copa, R, els, azs = domo(ctx, 'casco minero', m, el_min=18 if ctx.el else 24, margen=0.05, alto_extra=0.04)
    hc = ctx.hc
    e0 = els[0]
    # Visera alrededor (más ancha adelante)
    ring = [hc + np.array(sph(a, e0)) * (R[0, j] + 0.07 + 0.06 * max(0.0, math.cos(math.radians(a)))) for j, a in enumerate(azs)]
    ctx.pieza(clay.sweep(ctx.nombre('visera casco'), ring, 0.05, (1.6, 0.35), ctx.coll, m, segments=8, samples=3, closed=True,
                         up_fn=lambda q: np.array(q) - hc), 'cabeza')
    # Nervio central de la copa
    pts = [hc + np.array(sph(0, e)) * (R[i, len(azs) // 2] + 0.07) for i, e in enumerate(els[::3])]
    if len(pts) >= 3:
        ctx.pieza(clay.sweep(ctx.nombre('nervio casco'), pts, 0.035, (1, 1), ctx.coll, m, segments=6, samples=3), 'cabeza')
    # Lámpara adelante
    frente = hc + np.array(sph(0, 32)) * (R[min(4, len(els) - 1), 0] + 0.08)
    lam = clay.rbox(ctx.nombre('lampara casco'), tuple(frente), (0.16, 0.1, 0.13), ctx.coll, ctx.m('lampara', tipo='lisa'), p=4, n=5)
    ctx.pieza(lam, 'cabeza')
    luz = clay.blob(ctx.nombre('luz casco'), tuple(frente + np.array([0, -0.1, 0])), (0.11, 0.035, 0.095), ctx.coll,
                    ctx.m('luz', tipo='lisa'), n=6)
    ctx.pieza(luz, 'cabeza')


@prenda('sombrero_pescador', 'cabeza', [V('sombrero_pescador', 'Sombrero de pescador', principal='#E3D2A8'),
                                        V('sombrero_pescador_verde', 'Sombrero de pescador verde', principal='#7C8A4E'),
                                        V('sombrero_pescador_azul', 'Sombrero de pescador azul', principal='#3B6FB6')],
        oculta=COP, precio=30)
def sombrero_pescador(ctx):
    """Sombrero de tela (bucket): copa redonda y ala caída alrededor, con costuras."""
    m = ctx.m('principal', tipo='tela')
    copa, R, els, azs = domo(ctx, 'copa pescador', m, el_min=14 if ctx.el else 20, margen=0.04, alto_extra=0.03)
    hc = ctx.hc
    e0 = els[0]
    r0 = float(R[0].mean()) + 0.04
    z0 = hc[2] + r0 * math.sin(math.radians(e0)) - 0.01
    c = np.array([hc[0], hc[1], z0])
    rr = r0 * math.cos(math.radians(e0))
    lathe(ctx, 'ala pescador', [(rr - 0.02, 0.03), (rr + 0.28, -0.1), (rr + 0.29, -0.13), (rr - 0.02, -0.01)], m, c, seg=48, tapa_abajo=False,
          tapa_arriba=False)


@prenda('panoleta', 'cabeza', [V('panoleta_roja', 'Pañoleta roja', principal='#D9453D', puntos='#F6F2EA'),
                               V('panoleta_azul', 'Pañoleta azul', principal='#3B6FB6', puntos='#F6F2EA'),
                               V('panoleta_verde', 'Pañoleta verde', principal='#5FA05E', puntos='#F7C948')],
        oculta=COP, precio=20)
def panoleta(ctx):
    """Pañoleta amarrada en la cabeza, con su nudo y las dos puntas atrás."""
    m = ctx.m('principal', tipo='tela')
    copa, R, els, azs = domo(ctx, 'panoleta', m, el_min=30 if ctx.el else 34, margen=0.02, alto_extra=0.0)
    hc = ctx.hc
    atras = hc + np.array(sph(180, els[0])) * (R[0, len(azs) // 2] + 0.03)
    ctx.pieza(clay.blob(ctx.nombre('nudo panoleta'), tuple(atras), (0.08, 0.07, 0.07), ctx.coll, m, n=6), 'cabeza')
    for sx in (-1, 1):
        pts = [atras, atras + np.array([sx * 0.07, 0.08, -0.08]), atras + np.array([sx * 0.11, 0.12, -0.2])]
        ctx.pieza(clay.sweep(ctx.nombre(f'punta panoleta {sx}'), pts, [0.05, 0.04, 0.012], (1.6, 0.35), ctx.coll, m, segments=6, samples=3),
                  'cabeza')
    # Puntitos de la tela
    pm = ctx.m('puntos', tipo='lisa')
    for i in range(1, len(els) - 1, 2):
        for j in range(0, len(azs), 6):
            p = hc + np.array(sph(azs[j] + (i % 4) * 7, els[i])) * (R[i, j] + 0.035)
            ctx.pieza(clay.blob(ctx.nombre(f'punto panoleta {i} {j}'), tuple(p), (0.018, 0.018, 0.012), ctx.coll, pm, n=3), 'cabeza')


# ---------------------------------------------------------------------------
# Cara
# ---------------------------------------------------------------------------

@prenda('barba', 'cara', [V('barba', 'Barba de candado', principal='#2B2422'), V('barba_canosa', 'Barba de candado canosa', principal='#D8D3CC'),
                          V('barba_roja', 'Barba de candado pelirroja', principal='#A4502C')], para=('el',), precio=20)
def barba(ctx):
    """Barba de peluche: un arco de mechones por la mandíbula, del una patilla a la otra, y el bigote encima."""
    F = ctx.P['face']
    m = ctx.m('principal', tipo='pelo')
    zb = F['mouth'][1]
    for k, x in enumerate(np.linspace(-0.34, 0.34, 11)):
        t = abs(x) / 0.34
        z = zb - 0.12 + 0.2 * t ** 2
        loc, n = ctx.sup_cabeza.radial(ctx.hc, np.array([x, -0.6, z]) - ctx.hc, 0.025)
        if loc is None:
            continue
        r = 0.085 - 0.02 * t
        ctx.pieza(clay.blob(ctx.nombre(f'barba {k}'), tuple(loc), (r, r * 0.75, r * 1.15), ctx.coll, m, n=6), 'cabeza')
    # Mentón más tupido
    loc, n = ctx.sup_cabeza.radial(ctx.hc, np.array([0, -0.6, zb - 0.15]) - ctx.hc, 0.04)
    if loc is not None:
        ctx.pieza(clay.blob(ctx.nombre('barba menton'), tuple(loc), (0.13, 0.08, 0.1), ctx.coll, m, n=6), 'cabeza')
    for sx in (-1, 1):
        pts = []
        for x, dz in ((0.0, 0.0), (0.08, -0.01), (0.16, -0.03)):
            loc, n = ctx.sup_cabeza.radial(ctx.hc, np.array([sx * x, -0.6, zb + 0.055 + dz]) - ctx.hc, 0.025)
            if loc is not None:
                pts.append(loc)
        if len(pts) >= 3:
            ctx.pieza(clay.sweep(ctx.nombre(f'bigote barba {sx}'), pts, [0.04, 0.035, 0.02], (1, 0.6), ctx.coll, m, segments=8, samples=4,
                                 caps=('round', 'round'), up=(0, -1, 0)), 'cabeza')


# ---------------------------------------------------------------------------
# Espalda
# ---------------------------------------------------------------------------

@prenda('carriel', 'espalda', [V('carriel', 'Carriel antioqueño', principal='#6B4632', piel='#E8D7B5', hebilla='#D9B45C')], precio=45)
def carriel(ctx):
    """El carriel paisa: el bolso de cuero colgado al costado, con su tapa de piel y la correa cruzada."""
    m, piel, met = ctx.m('principal', tipo='brillo'), ctx.m('piel', tipo='peluche'), ctx.m('hebilla', tipo='metal')
    T = ctx.D['torso']
    x = T['half'][0] + 0.1
    z = T['bottom'] + 0.06
    y = T['c'][1] - 0.02
    ctx.pieza(clay.rbox(ctx.nombre('carriel'), (x, y, z), (0.07, 0.22, 0.2), ctx.coll, m, p=4, n=6), 'torso')
    ctx.pieza(clay.rbox(ctx.nombre('tapa carriel'), (x + 0.04, y, z + 0.1), (0.05, 0.23, 0.11), ctx.coll, piel, p=4, n=5), 'torso')
    ctx.pieza(clay.blob(ctx.nombre('hebilla carriel'), (x + 0.1, y - 0.06, z + 0.02), (0.025, 0.04, 0.04), ctx.coll, met, n=4), 'torso')
    ft = torso_sdf(ctx.D, 0.035)
    hombro = np.array([-0.2, T['c'][1], T['c'][2] + T['half'][2] + 0.1])
    P, hit = sdf.trace(ft, np.array([[hombro[0], hombro[1], 2.0]]), (0, 0, -1), max_dist=3.0)
    top = P[0] + np.array([0, 0, 0.02]) if hit[0] else hombro
    fr = sdf.front_points(ft, [(-0.05, T['c'][2] + 0.05), (0.15, T['c'][2] - 0.15)], lift=0.02)
    pts = [top + np.array([0, 0.05, 0])] + list(fr) + [np.array([x, y - 0.05, z + 0.18])]
    if len(pts) >= 3:
        ctx.pieza(clay.sweep(ctx.nombre('correa carriel'), pts, 0.028, (1, 0.35), ctx.coll, m, segments=6, samples=4), 'torso')


# ---------------------------------------------------------------------------
# Arriba
# ---------------------------------------------------------------------------

@prenda('ruana', 'arriba', [V('ruana', 'Ruana boyacense', principal='#8A5A3C', franjas='#E3D2A8', camisa='#F6F2EA'),
                            V('ruana_gris', 'Ruana gris', principal='#7A7A80', franjas='#26375E', camisa='#F6F2EA'),
                            V('ruana_vino', 'Ruana vino tinto', principal='#8E2E43', franjas='#E5B85C', camisa='#F1E4CC')],
        precio=60)
def ruana(ctx):
    """Ruana de lana: un poncho grande que cae de los hombros y tapa los brazos de arriba, con franjas y flecos."""
    objs, f = base_camiseta(ctx, largo_manga=0.3, papel='camisa')
    m = ctx.m('principal', tipo='rib')
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    arriba = nc[2] - 0.02
    abajo = T['bottom'] - 0.08
    ancho = T['half'][0] + 0.26
    cy = T['c'][1]

    def capa(P):
        t = np.clip((arriba - P[:, 2]) / (arriba - abajo), 0, 1)
        r = 0.2 + (ancho - 0.2) * np.sqrt(t)
        d = np.sqrt((P[:, 0] / np.maximum(r, 1e-3)) ** 2 + ((P[:, 1] - cy) / np.maximum(r * 0.62 + 0.06, 1e-3)) ** 2) - 1
        d = d * 0.25
        d = sdf.smax(d, P[:, 2] - arriba, 0.03)
        d = sdf.smax(d, abajo - P[:, 2], 0.01)
        cuello = np.sqrt(P[:, 0] ** 2 + (P[:, 1] - nc[1]) ** 2) - 0.17
        return sdf.smax(d, -cuello, 0.02)
    R = ancho + 0.1
    objs.append(ctx.pieza(sdf.to_mesh(ctx.nombre('ruana'), capa, (-R, cy - R, abajo - 0.05), (R, cy + R, arriba + 0.05), VX, ctx.coll, m,
                                      smooth=2), 'torso'))
    franjas = ctx.m('franjas', tipo='lisa')
    for k, z in enumerate((abajo + 0.07, abajo + 0.13)):
        t = (arriba - z) / (arriba - abajo)
        r = 0.2 + (ancho - 0.2) * math.sqrt(t) + 0.012
        ring = []
        for a in np.linspace(0, 2 * math.pi, 40, endpoint=False):
            c, s = math.cos(a), math.sin(a)
            ring.append((c * r, cy + s * (r * 0.62 + 0.06), z))
        objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'franja ruana {k}'), ring, 0.018, (1, 0.6), ctx.coll, franjas, segments=6, samples=2,
                                         closed=True), 'torso'))
    # Flecos abajo
    for j, a in enumerate(np.linspace(0, 2 * math.pi, 26, endpoint=False)):
        c, s = math.cos(a), math.sin(a)
        r = ancho
        p = np.array([c * r, cy + s * (r * 0.62 + 0.06), abajo])
        objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'fleco ruana {j}'), [p, p + np.array([0, 0, -0.04]), p + np.array([0, 0, -0.08])], 0.01,
                                         (1, 1), ctx.coll, franjas, segments=4, samples=2), 'torso'))
    return objs


@prenda('delantal', 'arriba', [V('delantal', 'Delantal con camisa', principal='#F6F2EA', camisa='#8EC5F0', ribete='#E4566B'),
                               V('delantal_cuero', 'Delantal de cuero', principal='#7A4E33', camisa='#F1E4CC', ribete='#3A2A20'),
                               V('delantal_cuadros', 'Delantal verde de mercado', principal='#5FA05E', camisa='#F6F2EA', ribete='#F7C948')],
        precio=35)
def delantal(ctx):
    """Delantal de trabajo encima de la camisa: peto, bolsillo, tiras al cuello y a la cintura."""
    objs, f = base_camiseta(ctx, largo_manga=0.14, papel='camisa')
    m = ctx.m('principal', tipo='tela')
    rib = ctx.m('ribete', tipo='lisa')
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    ft = torso_sdf(D, 0.03)
    top = nc[2] - 0.12
    bottom = T['bottom'] - 0.18

    def peto(P):
        ancho = np.where(P[:, 2] > T['c'][2] - 0.05, 0.2, 0.3)
        d = np.maximum(np.abs(P[:, 0]) - ancho, np.maximum(P[:, 2] - top, bottom - P[:, 2]))
        # Una lámina delante del cuerpo
        frente = ft(P)
        lam = np.abs(frente - 0.015) - 0.012
        return np.maximum(d, np.maximum(lam, P[:, 1] - T['c'][1]))
    R = T['half'][0] + 0.3
    objs.append(ctx.pieza(sdf.to_mesh(ctx.nombre('peto delantal'), peto, (-R, T['c'][1] - R, bottom - 0.05), (R, T['c'][1] + 0.05, top + 0.05),
                                      VX, ctx.coll, m, smooth=2), 'torso'))
    bols = sdf.front_points(ft, [(0.0, T['c'][2] - 0.15)], lift=0.045)
    if len(bols):
        objs.append(ctx.pieza(clay.rbox(ctx.nombre('bolsillo delantal'), tuple(bols[0]), (0.15, 0.02, 0.08), ctx.coll, rib, p=4, n=5), 'torso'))
    cint = sdf.front_points(ft, [(-0.32, T['c'][2] - 0.02), (0.0, T['c'][2] - 0.02), (0.32, T['c'][2] - 0.02)], lift=0.03)
    if len(cint) >= 3:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('tira cintura delantal'), cint, 0.02, (1, 0.4), ctx.coll, rib, segments=6, samples=3), 'torso'))
    cue = sdf.front_points(ft, [(-0.18, top), (-0.12, nc[2] - 0.02), (0.12, nc[2] - 0.02), (0.18, top)], lift=0.03)
    if len(cue) >= 3:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('tira cuello delantal'), cue, 0.016, (1, 0.4), ctx.coll, rib, segments=6, samples=3), 'torso'))
    return objs


# ---------------------------------------------------------------------------
# Pelo
# ---------------------------------------------------------------------------

@prenda('pelo_mono_bajo', 'pelo', V1('pelo_mono_bajo', 'Moño bajo de abuelita'), para=('ella',), precio=35)
def pelo_mono_bajo(ctx):
    cap = casco(ctx, lambda el, a: 0.04 + 0.02 * clay.smoothstep(20, 80, el))
    s = sup(ctx, [cap])
    nuca = hp(s, ctx, 180, 18, 0.13)
    ctx.pieza(clay.blob(ctx.nombre('mechon moño bajo'), tuple(nuca), (0.2, 0.15, 0.17), ctx.coll, mat(ctx), n=8), 'cabeza')
    ring = [nuca + np.array([math.cos(a) * 0.17, 0.02 * math.sin(a), math.sin(a) * 0.14]) for a in np.linspace(0, 2 * math.pi, 18, endpoint=False)]
    mechon(ctx, 'vuelta moño bajo', ring + [ring[0]], 0.05, L=0.8)
    for k, az in enumerate((-80, -40, 0, 40, 80)):
        pts = [hp(s, ctx, az, 45, 0.04), hp(s, ctx, az * 0.6 + (180 if abs(az) > 60 else 0) * 0, 60, 0.06), nuca - (nuca - ctx.hc) * 0.1]
        mechon(ctx, f'peinado atras {k}', pts, [0.08, 0.1, 0.07], L=0.5)


@prenda('pelo_calvo', 'pelo', V1('pelo_calvo', 'Calvo con canas a los lados'), para=('el',), precio=25)
def pelo_calvo(ctx):
    """Coronilla pelada y una franja de pelo de oreja a oreja por detrás (las canas se pintan con el color del pelo)."""
    s = sup(ctx)
    for k, az in enumerate(np.linspace(-110, 110, 9)):
        a = az + 180 if az >= 0 else az - 180
        pts = [hp(s, ctx, a * 0.0 + (180 - abs(az)) * (1 if az >= 0 else -1), el, 0.035) for el in (8, 22, 34)]
        mechon(ctx, f'franja calvo {k}', pts, [0.07, 0.09, 0.06], L=0.5)
