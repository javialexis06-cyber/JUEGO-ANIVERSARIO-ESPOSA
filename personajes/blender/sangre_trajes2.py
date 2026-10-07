"""Los otros nueve trajes de Sangre y Ceniza (se registran en sangre_trajes.TRAJES): caballero, cazador, herrero,
alquimista, sepulturero, inquisidor, verdugo, bruja y juglar. Cada uno se reconoce de un vistazo por lo que lleva en
la cabeza y por la silueta (la cabeza del muñeco es enorme: lo de arriba es lo que más se ve desde la cámara)."""
import math

import numpy as np

import clay
import ropa
import sangre_comun as sc
import sdf
from ropa import en_superficie, punto_cabeza, radio_cabeza, ruedo
from sangre_trajes import (anillo_en, botas_altas, brazo, capa_rasgada, cinturon, encadenar, espalda_pts, frente, huecos, jag, manga_s,
                           muneca, pantalon_s, rasgar_abajo, remiendo, traje, unidad)


def sombrero(ctx, m_ala, m_copa, r_ala, perfil, r_copa=0.55, caida=0.0, deformar=None, subir=0.0, grosor=0.035):
    import ropa_accesorios as ra
    return ra.ala_y_copa(ctx, m_ala, m_copa, r_ala=r_ala, alto=perfil[0][1], r_copa=r_copa, grosor=grosor, caida=caida, deformar=deformar,
                         copa_perfil=perfil, subir=subir)


def cinta_copa(ctx, c, r, z0, z1, mat, parte='cinta'):
    import ropa_accesorios as ra
    ra.lathe(ctx, parte, [(r, z0), (r + 0.015, (z0 + z1) / 2), (r, z1)], mat, c, tapa_abajo=False, tapa_arriba=False)


def faldon(ctx, mat, largo_z, ancho0=None, ancho1=None, abierto=0.0, rasgado=0.0, sem=0, parte='faldon', y=0.03):
    """Faldón de abrigo o túnica desde la cintura (amarrado a la pelvis), con abertura adelante y ruedo rasgado."""
    T = ctx.D['torso']
    top = T['bottom'] + 0.08
    r0 = ancho0 or (T['half'][0] + 0.04)
    r1 = ancho1 or (r0 + 0.2)
    bell = sdf.round_cone((0, y, top), (0, y, largo_z), r0, r1)
    hueco = sdf.round_cone((0, y, top + 0.05), (0, y, largo_z - 0.05), r0 - 0.03, r1 - 0.03)

    def f(P):
        d = sdf.smax(bell(P), -hueco(P), 0.01)
        d = np.maximum(d, P[:, 2] - top)
        corte = largo_z + (jag(P, rasgado, 12, sem, dientes=rasgado * 0.7, freq=40) if rasgado else 0.0)
        d = np.maximum(d, corte - P[:, 2])
        if abierto:
            d = sdf.smax(d, abierto - np.abs(P[:, 0]) - (P[:, 1] > 0) * 2.0, 0.02)
        return d
    R = r1 + 0.1
    return ropa.malla(ctx, parte, f, (-R, -R + y, largo_z - 0.1), (R, R + y, top + 0.06), mat, 'pelvis'), f


def capucha_s(ctx, mat, margen=0.06):
    import ropa_accesorios as ra
    return ra.capucha(ctx, mat, margen=margen)


def hombrera(ctx, sx, mat, r=(0.2, 0.2, 0.14), puas=0, mat_pua=None, capas=2):
    j, d, A = brazo(ctx, sx)
    c = j + d * 0.03 + np.array([0, 0, 0.08])
    hb = ctx.hueso_lado('brazo', sx)
    for k in range(capas):
        cc = c + d * 0.05 * k + np.array([0, 0, -0.05 * k])
        ctx.pieza(clay.blob(ctx.nombre(f'hombrera {ctx.lado(sx)} {k}'), tuple(cc), (r[0] * (1 - 0.1 * k), r[1] * (1 - 0.1 * k), r[2]), ctx.coll, mat, n=6,
                            shaper=lambda v: v * np.where(v[:, 2:3] < -0.02, [1, 1, 0.4], [1, 1, 1])), hb)
    for k in range(puas):
        a = -0.6 + 0.6 * k
        b = c + np.array([sx * 0.12, math.sin(a) * 0.12, 0.08])
        ctx.pieza(clay.sweep(ctx.nombre(f'pua hombrera {ctx.lado(sx)} {k}'), [b, b + np.array([sx * 0.05, 0, 0.14])], [0.04, 0.005], (1, 1), ctx.coll, mat_pua or mat,
                             segments=6, samples=2, caps=('flat', 'point')), hb)


def brazal(ctx, sx, mat, largo=0.12, holgura=0.05):
    c, d, r = muneca(ctx, sx)
    a = c - d * largo
    o = clay.sweep(ctx.nombre(f'brazal {ctx.lado(sx)}'), [a, c + d * 0.01], [r + holgura, r + holgura + 0.01], (1, 1), ctx.coll, mat, segments=12, samples=2,
                   caps=('flat', 'flat'))
    return ctx.pieza(o, ctx.hueso_lado('brazo', sx))


def guante(ctx, sx, mat):
    import ropa_disfraces as rd
    c, d, r = rd.mano(ctx, sx)
    return ctx.pieza(clay.blob(ctx.nombre(f'guante {ctx.lado(sx)}'), tuple(c + d * 0.01), (r * 1.12, r * 1.12, r * 1.15), ctx.coll, mat, n=6),
                     ctx.hueso_lado('mano', sx))


def mascara_cara(ctx, mat, az=(-78, 78), el=(-30, 22), n=(17, 9), lift=0.035):
    """Media máscara sobre la cara (de las cejas a la nariz) con dos huecos para los ojos."""
    F = ctx.P['face']
    hc = ctx.hc
    el_ojo = math.degrees(math.asin(max(-1.0, min(1.0, (F['eye_z'] - hc[2]) / 0.6))))
    az_ojo = math.degrees(math.atan2(F['eye_x'], 0.56))
    azs = np.linspace(az[0], az[1], n[0])
    els = np.linspace(el[0], el[1], n[1])
    puntos = {}
    for i, e in enumerate(els):
        for j, a in enumerate(azs):
            lo, nn = punto_cabeza(ctx, a, e, lift)
            if lo is not None:
                puntos[(i, j)] = lo
    verts, idx, faces = [], {}, []
    for k, p in puntos.items():
        idx[k] = len(verts)
        verts.append(tuple(p))
    for i in range(n[1] - 1):
        for j in range(n[0] - 1):
            q = [(i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j)]
            if not all(k in idx for k in q):
                continue
            ec, ac = (els[i] + els[i + 1]) / 2, (azs[j] + azs[j + 1]) / 2
            if any(((ac - sx * az_ojo) / 16) ** 2 + ((ec - el_ojo) / 11) ** 2 < 1 for sx in (-1, 1)):
                continue  # hueco del ojo
            faces.append(tuple(idx[k] for k in q))
    o = clay.make_mesh_object(ctx.nombre('mascara verdugo'), verts, faces, ctx.coll, material=mat)
    clay.add_solidify(o, 0.02, offset=0.0)
    clay.add_subsurf(o, 1, 1)
    ctx.pieza(o, 'cabeza')
    return o


def correa_cruzada(ctx, f, mat, sx=1, ancho=0.035, parte='correa'):
    T = ctx.D['torso']
    nc = ctx.D['neck_hole'][0]
    pts_f = frente(ctx, f, [(sx * 0.27, nc[2] - 0.05), (0.0, T['c'][2] - 0.02), (-sx * 0.3, T['bottom'] + 0.08)], lift=0.02)
    pts_b = espalda_pts(f, [(-sx * 0.3, T['bottom'] + 0.08), (0.0, T['c'][2] - 0.02), (sx * 0.27, nc[2] - 0.05)], lift=0.02)
    pts = pts_f + pts_b
    if len(pts) >= 5:
        ctx.pieza(clay.sweep(ctx.nombre(parte), pts, ancho, (1.0, 0.35), ctx.coll, mat, segments=6, samples=3, closed=True,
                             up_fn=lambda q, f=f: sdf.normal(f, np.array([q]))[0]), 'torso')
    return pts_f


# ---------------------------------------------------------------------------
# CABALLERO(A): yelmo con cimera, coraza, hombreras, brazales, tabardo con la cruz y cota de malla
# ---------------------------------------------------------------------------

@traje('caballero', 'Caballero', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.6, mugre=0.3, sangre=0.15))
def caballero(ctx):
    acero = ctx.m('acero', '#8C9098', tipo='metal', rough=0.42)
    acero2 = ctx.m('acero oscuro', '#5A5E66', tipo='metal', rough=0.5)
    malla = ctx.m('cota de malla', '#6A6E76', tipo='rib', rough=0.6)
    tabardo = ctx.m('tabardo', '#26304A', tipo='tela')
    cruz = ctx.m('cruz', '#C8B890', tipo='tela')
    cuero = ctx.m('cuero', '#2E2018', tipo='lisa', rough=0.6)
    pluma = ctx.m('cimera', '#7A1414', tipo='peluche')
    oro = ctx.m('oro', '#A07A34', tipo='metal', rough=0.38)
    D = ctx.D
    T = D['torso']
    t, f = ropa.torso(ctx, 'torso cota', malla, crecer=0.03, largo=0.12, extra=rasgar_abajo(T['bottom'] - 0.1, 0.008, 30, 1))
    for sx in (-1, 1):
        manga_s(ctx, sx, D['arm']['wrist_t'] - 0.04, (0.04, 0.035), malla, nombre='manga cota')
        brazal(ctx, sx, acero)
        hombrera(ctx, sx, acero, capas=3)
        guante(ctx, sx, cuero)
    coraza = ropa.torso(ctx, 'torso coraza', acero, crecer=0.06, largo=-0.04, cuello=1.2)[1]
    del coraza
    # tabardo con la cruz (frente y espalda) y cinturón
    tb = sdf.round_box((0, 0.0, T['c'][2] - 0.1), (0.26, 0.6, 0.5), 0.03)

    def tab(P, d):
        d = np.maximum(d, tb(P))
        return np.maximum(d, (T['bottom'] - 0.16 + jag(P, 0.02, 14, 4, dientes=0.012)) - P[:, 2])
    _, ft = ropa.torso(ctx, 'torso tabardo', tabardo, crecer=0.085, largo=0.18, cuello=1.25, extra=tab)
    for atras in (False, True):
        for (x0, z0, x1, z1) in ((0.0, T['c'][2] + 0.17, 0.0, T['bottom'] - 0.08), (-0.2, T['c'][2] + 0.07, 0.2, T['c'][2] + 0.07)):
            pts = (espalda_pts(ft, [(x0, z0), (x1, z1)], lift=0.006) if atras else frente(ctx, ft, [(x0, z0), (x1, z1)], lift=0.006))
            if len(pts) == 2:
                ctx.pieza(clay.sweep(ctx.nombre(f'cruz {atras} {x0}'), [pts[0], (pts[0] + pts[1]) / 2, pts[1]], 0.065, (1.0, 0.2), ctx.coll, cruz, segments=6,
                                     samples=2, up_fn=lambda q, f=ft: sdf.normal(f, np.array([q]))[0]), 'torso')
    cinturon(ctx, ft, T['bottom'] + 0.02, cuero, oro)
    if ctx.el:
        pantalon_s(ctx, '#4A4E56', '#2A2C30', tipo='rib')
    else:
        faldon(ctx, malla, 0.2, rasgado=0.0, parte='faldon malla')
    botas_altas(ctx, acero2, cuero, metal=acero, hebillas=2)
    for sx in (-1, 1):
        x = sx * ctx.D['shoe']['x']
        ctx.pieza(clay.blob(ctx.nombre(f'rodillera {ctx.lado(sx)}'), (x, -0.2, 0.4 if ctx.el else 0.42), (0.12, 0.07, 0.1), ctx.coll, acero, n=5),
                  ctx.hueso_lado('pierna', sx))
    # yelmo de cara abierta con cimera roja y nasal
    from ropa import domo
    cas, R, els, azs = domo(ctx, 'yelmo', acero, el_min=8 if ctx.el else 14, margen=0.05, alto_extra=0.05, grosor=0.04)
    tope = ctx.hc + np.array([0, 0, radio_cabeza(ctx, 0, 89) + 0.09])
    pts = [tope + np.array([0, y, -0.02 - 0.5 * y * y]) for y in np.linspace(-0.45, 0.4, 8)]
    ctx.pieza(clay.sweep(ctx.nombre('cresta yelmo'), pts, 0.035, (0.6, 1.4), ctx.coll, acero2, segments=6, samples=2), 'cabeza')
    pl = [tope + np.array([0, -0.32 + 0.09 * k, 0.04]) for k in range(8)]
    for k, p in enumerate(pl):
        ctx.pieza(clay.sweep(ctx.nombre(f'pluma cimera {k}'), [p, p + np.array([0, 0.12, 0.22]), p + np.array([0, 0.34, 0.26]), p + np.array([0, 0.5, 0.1 - 0.02 * k])],
                             [0.07, 0.08, 0.06, 0.01], (1.0, 0.45), ctx.coll, pluma, segments=6, samples=3, caps=('flat', 'point')), 'cabeza')
    # borde del yelmo, nervios verticales y carrilleras
    e0 = (8 if ctx.el else 14) + 1
    ring = []
    for a in np.linspace(-180, 180, 30, endpoint=False):
        lo, nn = punto_cabeza(ctx, a, e0, 0.075)
        if lo is not None:
            ring.append(lo)
    if len(ring) > 12:
        ctx.pieza(clay.sweep(ctx.nombre('borde yelmo'), ring, 0.04, (1.0, 0.7), ctx.coll, acero2, segments=6, samples=2, closed=True), 'cabeza')
    for a in (-120, -60, 60, 120, 180):
        pts = []
        for e in np.linspace(e0 + 4, 82, 7):
            lo, nn = punto_cabeza(ctx, a, e, 0.085)
            if lo is not None:
                pts.append(lo)
        if len(pts) > 3:
            ctx.pieza(clay.sweep(ctx.nombre(f'nervio yelmo {a}'), pts, 0.022, (1.0, 0.6), ctx.coll, acero2, segments=5, samples=2), 'cabeza')
    for sx in (-1, 1):
        lo, nn = punto_cabeza(ctx, sx * 75, e0 - 12, 0.06)
        if lo is not None:
            ctx.pieza(clay.blob(ctx.nombre(f'carrillera {sx}'), tuple(lo), (0.06, 0.16, 0.2), ctx.coll, acero, n=5), 'cabeza')
    loc, n = punto_cabeza(ctx, 0, 40, 0.06)
    if loc is not None:
        ctx.pieza(clay.sweep(ctx.nombre('nasal yelmo'), [loc + np.array([0, -0.03, 0.08]), loc + np.array([0, -0.06, -0.12])], [0.04, 0.03], (1.2, 0.5), ctx.coll, acero2,
                             segments=6, samples=2), 'cabeza')
    for a in np.linspace(-150, 150, 11):
        loc, n = punto_cabeza(ctx, a, (8 if ctx.el else 14) + 2, 0.07)
        if loc is not None:
            ctx.pieza(clay.blob(ctx.nombre(f'remache yelmo {a:.0f}'), tuple(loc), (0.025, 0.025, 0.025), ctx.coll, oro, n=3), 'cabeza')


# ---------------------------------------------------------------------------
# CAZADOR(A) DE VAMPIROS: sombrero de ala ancha con hebilla, abrigo largo de cuero, correas con estacas y frascos
# ---------------------------------------------------------------------------

@traje('cazador', 'Cazador de vampiros', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.8, mugre=0.35, sangre=0.2))
def cazador(ctx):
    cuero = ctx.m('abrigo cuero', '#3A2A20', tipo='lisa', rough=0.55)
    camisa = ctx.m('camisa', '#8A8070', tipo='tela')
    chaleco = ctx.m('chaleco', '#4A1A1A', tipo='tela')
    correa = ctx.m('correas', '#1E1410', tipo='lisa', rough=0.6)
    plata = ctx.m('plata', '#B8BCC4', tipo='metal', rough=0.3)
    madera = ctx.m('estacas', '#8A6A44', tipo='lisa', rough=0.7)
    vidrio = ctx.m('frasco agua', '#7AB8D8', tipo='brillo')
    sombrero_m = ctx.m('sombrero', '#24201E', tipo='tela')
    pantalon = '#2A2624'
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    t, f = ropa.torso(ctx, 'torso camisa cazador', camisa, crecer=0.02, largo=0.0)
    abre = sdf.round_box((0, -0.5, T['c'][2]), (0.13, 0.32, 0.6), 0.04)
    _, fc = ropa.torso(ctx, 'torso chaleco cazador', chaleco, crecer=0.04, largo=0.02, cuello=1.2)
    _, fa = ropa.torso(ctx, 'torso abrigo', cuero, crecer=0.07, largo=0.06, cuello=1.3, extra=lambda P, d: np.maximum(d, -abre(P)))
    for sx in (-1, 1):
        o, fm, (b, d) = manga_s(ctx, sx, D['arm']['wrist_t'] - 0.02, (0.055, 0.05), cuero, nombre='manga abrigo')
        anillo_en(ctx, fm, b - d * 0.04, d, cuero, ctx.hueso_lado('brazo', sx), grosor=0.035, prof=(1, 1.3), parte=f'puño abrigo {ctx.lado(sx)}', fuera=0.5)
        guante(ctx, sx, correa)
    # solapas grandes del abrigo y cuello alzado
    for sx in (-1, 1):
        p = frente(ctx, fa, [(sx * 0.17, nc[2] - 0.12)], lift=0.02)
        if p:
            o = clay.blob(ctx.nombre(f'solapa abrigo {ctx.lado(sx)}'), (0, 0, 0), (0.09, 0.015, 0.16), ctx.coll, cuero, n=5)
            en_superficie(ctx, fa, sx * 0.17, nc[2] - 0.12, o, 'torso', lift=0.02)
    cuello = espalda_pts(fa, [(x, nc[2] + 0.02) for x in np.linspace(-0.25, 0.25, 6)], lift=0.0)
    if len(cuello) > 3:
        ctx.pieza(clay.sweep(ctx.nombre('cuello alzado'), [p + np.array([0, 0.02, 0.08]) for p in cuello], 0.07, (0.35, 1.0), ctx.coll, cuero, segments=6, samples=3),
                  'torso')
    faldon(ctx, cuero, 0.18 if ctx.el else 0.22, abierto=0.13, rasgado=0.025, sem=3, parte='faldon abrigo')
    # correas cruzadas con estacas y frascos de agua bendita
    pts = correa_cruzada(ctx, fa, correa, sx=1, parte='bandolera')
    for k, p in enumerate(pts[:2]):
        q = p + np.array([0, -0.03, -0.02])
        ctx.pieza(clay.sweep(ctx.nombre(f'estaca pecho {k}'), [q + np.array([0.05, 0, 0.12]), q + np.array([-0.03, 0, -0.1])], [0.025, 0.004], (1, 1), ctx.coll, madera,
                             segments=6, samples=2, caps=('flat', 'point')), 'torso')
    for k, x in enumerate((-0.22, -0.12)):
        p = frente(ctx, fa, [(x, T['bottom'] + 0.06)], lift=0.04)
        if p:
            ctx.pieza(clay.blob(ctx.nombre(f'frasco cinto {k}'), tuple(p[0] + np.array([0, 0, -0.04])), (0.035, 0.03, 0.06), ctx.coll, vidrio, n=4), 'torso')
            ctx.pieza(clay.blob(ctx.nombre(f'tapa frasco {k}'), tuple(p[0] + np.array([0, 0, 0.03])), (0.02, 0.02, 0.018), ctx.coll, plata, n=3), 'torso')
    cinturon(ctx, fa, T['bottom'] + 0.03, correa, plata)
    pantalon_s(ctx, pantalon, '#1A1816')
    botas_altas(ctx, correa, ctx.m('suela', '#141010', tipo='lisa'), metal=plata, hebillas=2, alto=0.48 if ctx.el else 0.46)
    # sombrero de ala ancha con copa alta y hebilla de plata
    perfil = [(0.0, 0.42), (0.44, 0.42), (0.46, 0.4), (0.5, 0.05), (0.52, 0.0)]
    c, ala, copa = sombrero(ctx, sombrero_m, sombrero_m, 1.08, perfil, r_copa=0.53, caida=0.04,
                            deformar=lambda co: co.__class__((co.x, co.y, co.z + 0.06 * max(0, abs(co.x) - 0.6) - 0.04 * max(0, -co.y - 0.6))))
    cinta_copa(ctx, c, 0.505, 0.04, 0.12, correa, 'cinta sombrero cazador')
    ctx.pieza(clay.rbox(ctx.nombre('hebilla sombrero'), tuple(c + np.array([0, -0.53, 0.08])), (0.07, 0.015, 0.055), ctx.coll, plata, p=4, n=3, subsurf=1), 'cabeza')


# ---------------------------------------------------------------------------
# HERRERO(A): delantal grueso de cuero, pañoleta, gafas de forja en la frente, guantes, cinto de herramientas
# ---------------------------------------------------------------------------

@traje('herrero', 'Herrero', oculta=('arriba', 'abajo', 'pies', 'medias'), mugre=dict(barro=0.5, mugre=0.5, hollin=0.8))
def herrero(ctx):
    camisa = ctx.m('camisa herrero', '#6A6052', tipo='tela')
    delantal = ctx.m('delantal cuero', '#5A3A22', tipo='lisa', rough=0.62)
    correa = ctx.m('correas', '#2A1C14', tipo='lisa', rough=0.6)
    hierro = ctx.m('hierro', '#4E5056', tipo='metal', rough=0.5)
    laton = ctx.m('laton', '#9A7A3A', tipo='metal', rough=0.35)
    lente = ctx.m('lente gafas', '#3A6A5A', tipo='brillo')
    panuelo = ctx.m('panoleta', '#4A2A22', tipo='tela')
    madera = ctx.m('mango', '#6A4A2C', tipo='lisa', rough=0.7)
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    t, f = ropa.torso(ctx, 'torso camisa herrero', camisa, crecer=0.02, largo=0.03)
    for sx in (-1, 1):
        o, fm, (b, d) = manga_s(ctx, sx, 0.16, (0.045, 0.045), camisa, nombre='manga herrero')
        anillo_en(ctx, fm, b - d * 0.03, d, camisa, ctx.hueso_lado('brazo', sx), grosor=0.04, prof=(1, 1.2), parte=f'remango herrero {ctx.lado(sx)}', fuera=0.5)
        if sx > 0:
            guante(ctx, sx, delantal)
            brazal(ctx, sx, delantal, largo=0.1, holgura=0.06)
    # delantal de cuero del pecho a las rodillas con bolsillos y correas al cuello
    dl_box = sdf.round_box((0, -0.5, T['c'][2] - 0.1), (0.3, 0.3, 0.5), 0.05)

    def dl(P, d):
        return np.maximum(d, dl_box(P))
    _, fd = ropa.torso(ctx, 'torso delantal', delantal, crecer=0.055, largo=0.0, cuello=1.4, extra=dl)
    faldon(ctx, delantal, 0.2 if ctx.el else 0.24, ancho0=T['half'][0] + 0.07, ancho1=T['half'][0] + 0.2, parte='delantal abajo')
    for sx in (-1, 1):
        p = frente(ctx, fd, [(sx * 0.2, nc[2] - 0.02)], lift=0.0)
        q = espalda_pts(fd, [(sx * 0.12, nc[2] - 0.05)])
        if p and q:
            ctx.pieza(clay.sweep(ctx.nombre(f'correa cuello {sx}'), [p[0], p[0] + np.array([0, 0.05, 0.08]), q[0] + np.array([0, 0, 0.06])], 0.025, (1, 0.4), ctx.coll,
                                 correa, segments=5, samples=2), 'torso')
    remiendo(ctx, fd, 0.14, T['c'][2] - 0.12, 0.08, 0.07, ctx.m('bolsillo', '#4A2E1A', tipo='lisa'), correa, girar=0, parte='bolsillo delantal')
    cinturon(ctx, fd, T['bottom'] + 0.04, correa, hierro)
    # herramientas colgadas del cinto: tenazas y martillito
    p = frente(ctx, fd, [(0.3, T['bottom'] + 0.02)], lift=0.05)
    if p:
        b = p[0]
        ctx.pieza(clay.sweep(ctx.nombre('tenazas a'), [b, b + np.array([0.02, -0.02, -0.25])], 0.014, (1, 1), ctx.coll, hierro, segments=5, samples=2), 'pelvis')
        ctx.pieza(clay.sweep(ctx.nombre('tenazas b'), [b + np.array([0.03, 0, 0]), b + np.array([0.05, -0.02, -0.24])], 0.014, (1, 1), ctx.coll, hierro, segments=5,
                             samples=2), 'pelvis')
    p = frente(ctx, fd, [(-0.32, T['bottom'] + 0.02)], lift=0.05)
    if p:
        b = p[0]
        ctx.pieza(clay.sweep(ctx.nombre('martillito mango'), [b, b + np.array([0, -0.02, -0.22])], 0.016, (1, 1), ctx.coll, madera, segments=5, samples=2), 'pelvis')
        ctx.pieza(clay.rbox(ctx.nombre('martillito cabeza'), tuple(b + np.array([0, -0.02, -0.24])), (0.06, 0.03, 0.03), ctx.coll, hierro, p=4, n=3, subsurf=1), 'pelvis')
    pantalon_s(ctx, '#3A3634', '#24201E')
    botas_altas(ctx, correa, ctx.m('suela', '#141010', tipo='lisa'), alto=0.3, doblez=False)
    # pañoleta anudada y gafas de forja en la frente
    from ropa import domo
    domo(ctx, 'panoleta', panuelo, el_min=30, margen=0.03, grosor=0.025)
    loc, n = punto_cabeza(ctx, 180, 30, 0.04)
    if loc is not None:
        ctx.pieza(clay.blob(ctx.nombre('nudo panoleta'), tuple(loc), (0.07, 0.05, 0.06), ctx.coll, panuelo, n=3), 'cabeza')
        for k, dx in enumerate((-0.05, 0.06)):
            ctx.pieza(clay.sweep(ctx.nombre(f'punta panoleta {k}'), [loc, loc + np.array([dx, 0.1, -0.12])], [0.05, 0.01], (1, 0.3), ctx.coll, panuelo, segments=5, samples=2,
                                 caps=('flat', 'point')), 'cabeza')
    pts = []
    for a in np.linspace(-180, 180, 28, endpoint=False):
        lo, nn = punto_cabeza(ctx, a, 32 if abs(a) < 100 else 30, 0.05)
        if lo is not None:
            pts.append(lo)
    if len(pts) > 10:
        ctx.pieza(clay.sweep(ctx.nombre('banda gafas'), pts, 0.03, (0.4, 1.0), ctx.coll, correa, segments=5, samples=2, closed=True,
                             up_fn=lambda q: np.array(q) - ctx.hc), 'cabeza')
    for sx in (-1, 1):
        lo, nn = punto_cabeza(ctx, sx * 22, 35, 0.07)
        if lo is not None:
            o = ctx.pieza(clay.lathe(ctx.nombre(f'aro gafa {sx}'), [(0.0, 0.0), (0.14, 0.0), (0.15, 0.07), (0.12, 0.09)], ctx.coll, laton, segments=16, subsurf=0,
                                     cap_bottom=False, cap_top=False), 'cabeza')
            o.location = tuple(lo)
            clay.orient_to(o, -np.asarray(nn))
            o.rotation_quaternion = o.rotation_quaternion @ __import__('mathutils').Quaternion((1, 0, 0), math.radians(90))
            ctx.pieza(clay.blob(ctx.nombre(f'lente gafa {sx}'), tuple(lo + np.asarray(nn) * 0.07), (0.115, 0.115, 0.115), ctx.coll, lente, n=4,
                                shaper=lambda v, nn=nn: v * 0.999), 'cabeza')


# ---------------------------------------------------------------------------
# ALQUIMISTA: gorro de cuero con gafas verdes, abrigo con delantal manchado, bandolera de frascos de colores
# ---------------------------------------------------------------------------

@traje('alquimista', 'Alquimista', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.4, mugre=0.45))
def alquimista(ctx):
    abrigo = ctx.m('abrigo alquimista', '#3E4A2E', tipo='tela')
    delantal = ctx.m('delantal manchado', '#8A7A5A', tipo='lisa', rough=0.7)
    correa = ctx.m('correas', '#2A1C14', tipo='lisa', rough=0.6)
    laton = ctx.m('laton', '#9A7A3A', tipo='metal', rough=0.35)
    gorro = ctx.m('gorro cuero', '#4A3020', tipo='lisa', rough=0.6)
    lente = ctx.m('lente verde', '#5AD06A', tipo='brillo', emission='#2A8A3A', emission_strength=1.5)
    pociones = [ctx.m(f'pocion {k}', c, tipo='brillo', emission=c, emission_strength=1.2) for k, c in enumerate(('#7CFF4A', '#C46BFF', '#FF6A1A', '#5ED8FF'))]
    D = ctx.D
    T = D['torso']
    t, f = ropa.torso(ctx, 'torso abrigo alquimista', abrigo, crecer=0.04, largo=0.05, cuello=1.15)
    for sx in (-1, 1):
        o, fm, (b, d) = manga_s(ctx, sx, D['arm']['wrist_t'] - 0.03, (0.06, 0.07), abrigo, campana=0.03, nombre='manga alquimista')
        anillo_en(ctx, fm, b - d * 0.03, d, correa, ctx.hueso_lado('brazo', sx), grosor=0.025, parte=f'puño alquimista {ctx.lado(sx)}', fuera=0.5)
    dl_box = sdf.round_box((0, -0.5, T['c'][2] - 0.15), (0.28, 0.3, 0.5), 0.05)
    _, fd = ropa.torso(ctx, 'torso delantal alquimista', delantal, crecer=0.065, largo=0.0, cuello=1.4, extra=lambda P, d: np.maximum(d, dl_box(P)))
    faldon(ctx, abrigo, 0.16 if ctx.el else 0.2, abierto=0.0, rasgado=0.03, sem=5, parte='faldon alquimista')
    rng = np.random.default_rng(8)
    for k in range(6):
        p = frente(ctx, fd, [(rng.uniform(-0.2, 0.2), rng.uniform(T['bottom'] + 0.05, T['c'][2] + 0.1))], lift=0.012)
        if p:
            ctx.pieza(clay.blob(ctx.nombre(f'mancha {k}'), tuple(p[0]), (rng.uniform(0.03, 0.06), 0.01, rng.uniform(0.03, 0.05)), ctx.coll, pociones[k % 4], n=3), 'torso')
    pts = correa_cruzada(ctx, f, correa, sx=-1, parte='bandolera frascos')
    for k in range(4):
        t_ = 0.15 + 0.22 * k
        if len(pts) < 3:
            break
        q = pts[0] + (pts[-1] - pts[0]) * t_ + np.array([0, -0.04, 0])
        ctx.pieza(clay.blob(ctx.nombre(f'frasco bandolera {k}'), tuple(q), (0.035, 0.03, 0.05), ctx.coll, pociones[k], n=4), 'torso')
        ctx.pieza(clay.blob(ctx.nombre(f'corcho bandolera {k}'), tuple(q + np.array([0, 0, 0.055])), (0.018, 0.018, 0.016), ctx.coll, laton, n=3), 'torso')
    cinturon(ctx, f, T['bottom'] + 0.03, correa, laton)
    pantalon_s(ctx, '#3A3028', '#24201E')
    botas_altas(ctx, correa, ctx.m('suela', '#141010', tipo='lisa'), alto=0.36, doblez=True)
    # gorro de cuero ajustado con orejeras y las gafas verdes encima
    from ropa import domo
    domo(ctx, 'gorro alquimista', gorro, el_min=8 if ctx.el else 15, margen=0.035, grosor=0.03)
    for sx in (-1, 1):
        lo, nn = punto_cabeza(ctx, sx * 90, 10, 0.03)
        if lo is not None:
            ctx.pieza(clay.blob(ctx.nombre(f'orejera {sx}'), tuple(lo + np.array([0, 0, -0.1])), (0.05, 0.13, 0.17), ctx.coll, gorro, n=4), 'cabeza')
    for sx in (-1, 1):
        lo, nn = punto_cabeza(ctx, sx * 24, 46, 0.08)
        if lo is not None:
            ctx.pieza(clay.blob(ctx.nombre(f'aro gafa alquimista {sx}'), tuple(lo), (0.12, 0.12, 0.12), ctx.coll, laton, n=4,
                                shaper=lambda v: v * np.array([1, 1, 1])), 'cabeza')
            ctx.pieza(clay.blob(ctx.nombre(f'lente alquimista {sx}'), tuple(lo + np.asarray(nn) * 0.05), (0.095, 0.095, 0.095), ctx.coll, lente, n=4), 'cabeza')


# ---------------------------------------------------------------------------
# SEPULTURERO(A): sombrero de copa abollado con crespón, levita negra raída, bufanda, linterna
# ---------------------------------------------------------------------------

@traje('sepulturero', 'Sepulturero', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=1.0, mugre=0.5))
def sepulturero(ctx):
    levita = ctx.m('levita', '#1E1C20', tipo='tela')
    camisa = ctx.m('camisa gris', '#6A6668', tipo='tela')
    bufanda = ctx.m('bufanda', '#3A3A44', tipo='rib')
    copa = ctx.m('sombrero copa', '#141216', tipo='tela')
    crespon = ctx.m('crespon', '#0A0A0C', tipo='tela')
    correa = ctx.m('correas', '#1E1612', tipo='lisa', rough=0.6)
    hierro = ctx.m('hierro', '#4A4C52', tipo='metal', rough=0.5)
    luz = ctx.m('linterna', '#FFB040', tipo='brillo', emission='#FFAA33', emission_strength=2.0)
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    t, f = ropa.torso(ctx, 'torso camisa sepulturero', camisa, crecer=0.02, largo=0.0)
    abre = sdf.round_box((0, -0.5, T['c'][2] - 0.05), (0.11, 0.32, 0.6), 0.04)
    _, fl = ropa.torso(ctx, 'torso levita', levita, crecer=0.06, largo=0.05, cuello=1.25,
                       extra=encadenar(lambda P, d: np.maximum(d, -abre(P)), huecos([((0.3, T['c'][1] + T['half'][1], T['c'][2] - 0.05), (0.05, 0.05, 0.05))], sem=3)))
    for sx in (-1, 1):
        manga_s(ctx, sx, D['arm']['wrist_t'] - 0.02, (0.05, 0.045), levita, rasgado=0.02, sem=sx + 3, nombre='manga levita')
    faldon(ctx, levita, 0.2 if ctx.el else 0.24, abierto=0.12, rasgado=0.06, sem=4, parte='faldon levita')
    ropa.botones(ctx, fl, [(sx * 0.15, z) for sx in (-1, 1) for z in (T['c'][2] + 0.05, T['c'][2] - 0.1)], hierro, r=0.022)
    anillo_en(ctx, f, (0, T['c'][1], nc[2] - 0.02), (0, 0, 1), bufanda, 'torso', grosor=0.06, prof=(1, 0.8), parte='bufanda', fuera=1.0, lift=0.04)
    p = frente(ctx, fl, [(0.1, nc[2] - 0.06)], lift=0.06)
    if p:
        ctx.pieza(clay.sweep(ctx.nombre('punta bufanda'), [p[0], p[0] + np.array([0.04, -0.04, -0.2]), p[0] + np.array([0.05, -0.05, -0.42])], [0.06, 0.06, 0.05],
                             (1.0, 0.3), ctx.coll, bufanda, segments=6, samples=2), 'torso')
    cinturon(ctx, fl, T['bottom'] + 0.03, correa, hierro)
    # linterna colgando del cinto
    p = frente(ctx, fl, [(-0.32, T['bottom'] + 0.01)], lift=0.06)
    if p:
        b = p[0] + np.array([0, 0, -0.12])
        ctx.pieza(clay.rbox(ctx.nombre('caja linterna'), tuple(b), (0.05, 0.05, 0.07), ctx.coll, hierro, p=6, n=3, subsurf=1), 'pelvis')
        ctx.pieza(clay.blob(ctx.nombre('luz linterna'), tuple(b), (0.04, 0.04, 0.055), ctx.coll, luz, n=3), 'pelvis')
        ctx.pieza(clay.sweep(ctx.nombre('asa linterna'), [b + np.array([0, 0, 0.07]), b + np.array([0, 0, 0.12]), p[0]], 0.008, (1, 1), ctx.coll, hierro, segments=4, samples=2),
                  'pelvis')
    pantalon_s(ctx, '#2A2626', '#141212')
    botas_altas(ctx, correa, ctx.m('suela', '#100C0C', tipo='lisa'), alto=0.34, doblez=False)
    # sombrero de copa abollado con crespón que cuelga atrás
    perfil = [(0.0, 0.62), (0.42, 0.64), (0.44, 0.6), (0.4, 0.3), (0.44, 0.0)]

    def abollar(co):
        return co.__class__((co.x, co.y, co.z - 0.03 * max(0.0, co.y - 0.3)))
    c, ala, cp = sombrero(ctx, copa, copa, 0.7, perfil, r_copa=0.47, caida=0.02, deformar=abollar)
    for v in cp.data.vertices:
        if v.co.z > 0.35:
            v.co.x += 0.06 * (v.co.z - 0.35)
            v.co.z -= 0.05 * max(0.0, v.co.x) * (v.co.z - 0.35) * 3
    cinta_copa(ctx, c, 0.42, 0.05, 0.16, crespon, 'cinta crespon')
    b = c + np.array([0.1, 0.42, 0.12])
    ctx.pieza(clay.sweep(ctx.nombre('crespon cola'), [b, b + np.array([0.02, 0.12, -0.15]), b + np.array([0.05, 0.16, -0.42])], [0.08, 0.07, 0.04], (1.0, 0.15), ctx.coll,
                         crespon, segments=6, samples=2), 'cabeza')


# ---------------------------------------------------------------------------
# INQUISIDOR(A): capucha roja, estola dorada, sol de oro en el pecho, sotana negra, cadena del incensario al cinto
# ---------------------------------------------------------------------------

@traje('inquisidor', 'Inquisidor', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.5, mugre=0.25))
def inquisidor(ctx):
    sotana = ctx.m('sotana', '#1A1618', tipo='tela')
    rojo = ctx.m('capa roja', '#6A1216', tipo='tela')
    oro = ctx.m('oro', '#B08A3A', tipo='metal', rough=0.35)
    estola = ctx.m('estola', '#9A7A34', tipo='tela')
    cuero = ctx.m('cuero', '#1E1612', tipo='lisa', rough=0.6)
    libro = ctx.m('libro', '#3A1414', tipo='lisa', rough=0.6)
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    t, f = ropa.torso(ctx, 'torso sotana', sotana, crecer=0.035, largo=0.05)
    for sx in (-1, 1):
        o, fm, (b, d) = manga_s(ctx, sx, D['arm']['wrist_t'] - 0.02, (0.06, 0.08), sotana, campana=0.03, nombre='manga sotana')
        anillo_en(ctx, fm, b - d * 0.03, d, rojo, ctx.hueso_lado('brazo', sx), grosor=0.03, parte=f'puño sotana {ctx.lado(sx)}', fuera=0.5)
    faldon(ctx, sotana, 0.1 if ctx.el else 0.12, ancho0=T['half'][0] + 0.05, ancho1=T['half'][0] + 0.32, rasgado=0.02, sem=6, parte='falda sotana')
    # muceta roja (capita sobre los hombros) y capa roja larga
    _, fm2 = ropa.torso(ctx, 'torso muceta', rojo, crecer=0.07, largo=0.0, cuello=1.2,
                        extra=lambda P, d: np.maximum(d, (T['c'][2] + 0.02 + jag(P, 0.015, 18, 2, dientes=0.01)) - P[:, 2]))
    capa_rasgada(ctx, rojo, zbot=0.18, rasgado=0.05, huecos_n=0, sem=5)
    for sx in (-1, 1):
        pts = frente(ctx, fm2, [(sx * 0.16, nc[2] - 0.04), (sx * 0.15, T['c'][2] - 0.05), (sx * 0.14, T['bottom'] - 0.05)], lift=0.012)
        if len(pts) == 3:
            ctx.pieza(clay.sweep(ctx.nombre(f'estola {sx}'), pts + [pts[-1] + np.array([0, -0.02, -0.25])], 0.06, (1.0, 0.25), ctx.coll, estola, segments=6, samples=3),
                      'torso')
    p = frente(ctx, fm2, [(0.0, T['c'][2] + 0.06)], lift=0.03)
    if p:
        ctx.pieza(clay.blob(ctx.nombre('sol pecho'), tuple(p[0]), (0.07, 0.02, 0.07), ctx.coll, oro, n=4), 'torso')
        for k in range(10):
            a = 2 * math.pi * k / 10
            ctx.pieza(clay.sweep(ctx.nombre(f'rayo sol {k}'), [p[0] + np.array([math.cos(a) * 0.06, -0.005, math.sin(a) * 0.06]),
                                                                p[0] + np.array([math.cos(a) * 0.12, -0.01, math.sin(a) * 0.12])], [0.02, 0.003], (1, 0.4), ctx.coll, oro,
                                 segments=4, samples=1, caps=('flat', 'point')), 'torso')
    cinturon(ctx, f, T['bottom'] + 0.02, cuero, oro)
    p = frente(ctx, f, [(-0.3, T['bottom'] - 0.02)], lift=0.07)
    if p:
        ctx.pieza(clay.rbox(ctx.nombre('libro cinto'), tuple(p[0] + np.array([0, 0, -0.1])), (0.03, 0.08, 0.11), ctx.coll, libro, p=6, n=3, subsurf=1), 'pelvis')
    botas_altas(ctx, cuero, ctx.m('suela', '#100C0C', tipo='lisa'), alto=0.3, doblez=False)
    # capucha roja (redonda, deja la cara libre) con borde dorado
    capucha_s(ctx, rojo, margen=0.07)


# ---------------------------------------------------------------------------
# VERDUGO(A): capucha negra con antifaz, arnés de cuero cruzado, delantal ensangrentado, brazales con remaches
# ---------------------------------------------------------------------------

@traje('verdugo', 'Verdugo', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.7, mugre=0.4, sangre=0.7))
def verdugo(ctx):
    negro = ctx.m('capucha negra', '#141012', tipo='tela')
    camisa = ctx.m('camisa verdugo', '#2A2426', tipo='tela')
    cuero = ctx.m('arnes', '#2A1A12', tipo='lisa', rough=0.6)
    hierro = ctx.m('hierro', '#4A4C52', tipo='metal', rough=0.5)
    delantal = ctx.m('delantal sangre', '#4A2A22', tipo='lisa', rough=0.62)
    D = ctx.D
    T = D['torso']
    t, f = ropa.torso(ctx, 'torso verdugo', camisa, crecer=0.025, largo=0.04)
    for sx in (-1, 1):
        manga_s(ctx, sx, 0.12, (0.045, 0.045), camisa, rasgado=0.02, sem=sx + 7, nombre='manga verdugo')
        brazal(ctx, sx, cuero, largo=0.14, holgura=0.06)
        c, d, r = muneca(ctx, sx)
        for k in range(3):
            lo = c - d * (0.03 + 0.04 * k) + np.array([0, -r - 0.06, 0])
            ctx.pieza(clay.blob(ctx.nombre(f'remache brazal {ctx.lado(sx)} {k}'), tuple(lo), (0.018, 0.018, 0.018), ctx.coll, hierro, n=2), ctx.hueso_lado('brazo', sx))
    correa_cruzada(ctx, f, cuero, sx=1, ancho=0.045, parte='arnes a')
    correa_cruzada(ctx, f, cuero, sx=-1, ancho=0.045, parte='arnes b')
    p = frente(ctx, f, [(0.0, T['c'][2] - 0.02)], lift=0.04)
    if p:
        ctx.pieza(clay.blob(ctx.nombre('argolla arnes'), tuple(p[0]), (0.06, 0.03, 0.06), ctx.coll, hierro, n=3), 'torso')
    faldon(ctx, delantal, 0.2 if ctx.el else 0.24, ancho0=T['half'][0] + 0.06, ancho1=T['half'][0] + 0.16, rasgado=0.03, sem=8, parte='delantal verdugo')
    cinturon(ctx, f, T['bottom'] + 0.03, cuero, hierro, ancho=0.045)
    pantalon_s(ctx, '#1E1A1C', '#100E10')
    botas_altas(ctx, cuero, ctx.m('suela', '#0C0A0A', tipo='lisa'), metal=hierro, hebillas=2)
    # capucha negra (redonda, deja la cara) con antifaz de cuero sobre los ojos y faldón sobre los hombros
    capucha_s(ctx, negro, margen=0.06)
    mascara_cara(ctx, ctx.m('mascara cuero', '#1A1012', tipo='lisa', rough=0.55))
    for a in np.linspace(-170, 170, 12):
        if abs(a) < 45:
            continue
        lo, nn = punto_cabeza(ctx, a, -32, 0.08)
        if lo is not None:
            ctx.pieza(clay.sweep(ctx.nombre(f'faldon capucha {a:.0f}'), [lo, lo + np.asarray(nn) * 0.08 + np.array([0, 0, -0.2])], [0.1, 0.02], (1.0, 0.3), ctx.coll, negro,
                                 segments=5, samples=2, caps=('flat', 'point')), 'cabeza')


# ---------------------------------------------------------------------------
# BRUJA / BRUJO: sombrero puntudo doblado con plumas de cuervo, chal raído, vestido o túnica en capas, amuletos
# ---------------------------------------------------------------------------

@traje('bruja', 'Bruja', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.8, mugre=0.45))
def bruja(ctx):
    morado = ctx.m('vestido bruja', '#2E1E36', tipo='tela')
    morado2 = ctx.m('capas bruja', '#1E1424', tipo='tela')
    chal = ctx.m('chal', '#3A2E2A', tipo='rib')
    sombrero_m = ctx.m('sombrero bruja', '#1A1420', tipo='tela')
    cinta = ctx.m('cinta bruja', '#5A1A2A', tipo='tela')
    pluma = ctx.m('plumas cuervo', '#141018', tipo='lisa', rough=0.4)
    hueso = ctx.m('amuletos hueso', '#C8BC98', tipo='lisa', rough=0.6)
    hierba = ctx.m('hierbas', '#4A5A2A', tipo='tela')
    cuero = ctx.m('cuero', '#1E1612', tipo='lisa', rough=0.6)
    gema = ctx.m('gema', '#C46BFF', tipo='brillo', emission='#9A3ADA', emission_strength=1.5)
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    t, f = ropa.torso(ctx, 'torso bruja', morado, crecer=0.03, largo=0.04, extra=rasgar_abajo(T['bottom'] - 0.03, 0.02, 14, 3, dientes=0.015))
    for sx in (-1, 1):
        manga_s(ctx, sx, D['arm']['wrist_t'] - 0.01, (0.06, 0.1), morado, rasgado=0.05, sem=sx + 4, campana=0.05, nombre='manga bruja')
    largo = 0.05 if not ctx.el else 0.1
    faldon(ctx, morado, largo, ancho0=T['half'][0] + 0.04, ancho1=T['half'][0] + 0.32, rasgado=0.06, sem=9, parte='falda bruja')
    faldon(ctx, morado2, largo + 0.18, ancho0=T['half'][0] + 0.07, ancho1=T['half'][0] + 0.3, rasgado=0.09, sem=10, parte='sobrefalda bruja')
    # chal sobre los hombros con flecos
    _, fch = ropa.torso(ctx, 'torso chal', chal, crecer=0.065, largo=0.0, cuello=1.25,
                        extra=lambda P, d: np.maximum(d, (T['c'][2] + 0.0 + 0.12 * np.abs(P[:, 0]) + jag(P, 0.02, 20, 5, dientes=0.02)) - P[:, 2]))
    for k in range(10):
        x = -0.3 + 0.066 * k
        p = espalda_pts(fch, [(x, T['c'][2] + 0.02 + 0.12 * abs(x))], lift=0.0)
        if p:
            ctx.pieza(clay.sweep(ctx.nombre(f'fleco chal {k}'), [p[0], p[0] + np.array([0, 0.01, -0.09])], [0.012, 0.004], (1, 1), ctx.coll, chal, segments=4, samples=1,
                                 caps=('flat', 'point')), 'torso')
    cinturon(ctx, f, T['bottom'] + 0.03, cuero, hueso)
    for k, x in enumerate((-0.3, -0.18, 0.22, 0.32)):
        p = frente(ctx, f, [(x, T['bottom'] + 0.02)], lift=0.05)
        if p:
            b = p[0]
            ctx.pieza(clay.sweep(ctx.nombre(f'hilo amuleto {k}'), [b, b + np.array([0, -0.01, -0.14])], 0.006, (1, 1), ctx.coll, cuero, segments=3, samples=1), 'pelvis')
            m = (hueso, hierba, gema, hueso)[k]
            ctx.pieza(clay.blob(ctx.nombre(f'amuleto {k}'), tuple(b + np.array([0, -0.01, -0.17])), (0.03, 0.02, 0.045), ctx.coll, m, n=3), 'pelvis')
    botas_altas(ctx, cuero, ctx.m('suela', '#0C0A0A', tipo='lisa'), alto=0.3, doblez=False)
    # sombrero puntudo y doblado, con cinta, hebilla de hueso y plumas de cuervo
    import ropa_accesorios as ra
    c, ala, copa = ra.ala_y_copa(ctx, sombrero_m, sombrero_m, r_ala=1.1, alto=0.1, r_copa=0.55, caida=0.06,
                                 deformar=lambda co: co.__class__((co.x, co.y, co.z + 0.05 * math.sin(math.atan2(co.y, co.x) * 3) * max(0, math.hypot(co.x, co.y) - 0.6))))
    pts = [c + np.array([0, 0, 0.05]), c + np.array([0, 0.03, 0.42]), c + np.array([0.05, 0.08, 0.78]), c + np.array([0.24, 0.16, 1.0]), c + np.array([0.45, 0.12, 0.98])]
    ctx.pieza(clay.sweep(ctx.nombre('punta sombrero bruja'), pts, [0.55, 0.36, 0.18, 0.07, 0.02], (1, 1), ctx.coll, sombrero_m, segments=14, samples=5, up=(0, -1, 0)),
              'cabeza')
    cinta_copa(ctx, c, 0.53, 0.02, 0.13, cinta, 'cinta sombrero bruja')
    ctx.pieza(clay.rbox(ctx.nombre('hebilla hueso'), tuple(c + np.array([0, -0.55, 0.075])), (0.06, 0.014, 0.05), ctx.coll, hueso, p=4, n=3, subsurf=1), 'cabeza')
    for k in range(4):
        a = math.radians(30 + 14 * k)
        b = c + np.array([math.sin(a) * 0.54, -math.cos(a) * 0.54, 0.09])
        ctx.pieza(clay.sweep(ctx.nombre(f'pluma cuervo {k}'), [b, b + np.array([0.06 + 0.02 * k, 0.04, 0.2]), b + np.array([0.12 + 0.03 * k, 0.1, 0.34 - 0.03 * k])],
                             [0.03, 0.04, 0.004], (1.0, 0.25), ctx.coll, pluma, segments=5, samples=2, caps=('flat', 'point')), 'cabeza')


# ---------------------------------------------------------------------------
# JUGLAR: gorra con pluma larga, jubón de rombos apagados, media capa al hombro, mangas abullonadas, calzas y escarpines
# ---------------------------------------------------------------------------

@traje('juglar', 'Juglar', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.6, mugre=0.3))
def juglar(ctx):
    vino = ctx.m('jubon vino', '#5A1A2A', tipo='tela')
    mostaza = ctx.m('rombos mostaza', '#8A6A2A', tipo='tela')
    negro = ctx.m('calzas', '#1E1A1C', tipo='rib')
    capa_m = ctx.m('media capa', '#2A3A2A', tipo='tela')
    gorra = ctx.m('gorra juglar', '#2A1A22', tipo='tela')
    pluma = ctx.m('pluma juglar', '#8A1A1A', tipo='peluche')
    oro = ctx.m('oro', '#A07A34', tipo='metal', rough=0.38)
    cuero = ctx.m('cuero', '#2A1A12', tipo='lisa', rough=0.6)
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    t, f = ropa.torso(ctx, 'torso jubon juglar', vino, crecer=0.03, largo=0.06, extra=rasgar_abajo(T['bottom'] - 0.04, 0.0, 10, 1, dientes=0.03))
    for sx in (-1, 1):
        o, fm, (b, d) = manga_s(ctx, sx, D['arm']['wrist_t'] - 0.03, (0.04, 0.035), mostaza if sx > 0 else vino, nombre='manga juglar')
        j, d2, _ = brazo(ctx, sx)
        ctx.pieza(clay.blob(ctx.nombre(f'abullonado juglar {ctx.lado(sx)}'), tuple(j + d2 * 0.05), (0.18, 0.17, 0.16), ctx.coll, vino if sx > 0 else mostaza, n=6),
                  ctx.hueso_lado('brazo', sx))
    # rombos (arlequín apagado) en el pecho y la espalda
    for atras in (False, True):
        for i in range(3):
            for k in range(3):
                x = -0.2 + 0.2 * k
                z = T['bottom'] + 0.1 + 0.12 * i
                if (i + k) % 2:
                    continue
                o = clay.make_mesh_object(ctx.nombre(f'rombo {atras} {i} {k}'), [(0, -0.006, 0.075), (0.085, -0.006, 0), (0, -0.006, -0.075), (-0.085, -0.006, 0)],
                                          [(0, 1, 2, 3)], ctx.coll, material=mostaza)
                clay.add_solidify(o, 0.012, offset=0.0)
                en_superficie(ctx, f, x, z, o, 'torso', lift=0.008, atras=atras)
    ropa.botones(ctx, f, [(0.0, z) for z in np.linspace(nc[2] - 0.08, T['bottom'] + 0.05, 4)], oro, r=0.018)
    # media capa colgada de un hombro (el izquierdo) y cinto con bolsa de monedas
    capa_rasgada(ctx, capa_m, zbot=0.4, ancho0=0.3, ancho1=0.5, rasgado=0.06, huecos_n=0, sem=6)
    cinturon(ctx, f, T['bottom'] + 0.02, cuero, oro)
    p = frente(ctx, f, [(0.3, T['bottom'] + 0.0)], lift=0.05)
    if p:
        ctx.pieza(clay.blob(ctx.nombre('bolsa monedas'), tuple(p[0] + np.array([0, 0, -0.1])), (0.06, 0.05, 0.08), ctx.coll, cuero, n=4), 'pelvis')
    pantalon_s(ctx, '#1E1A1C', '#100E10', tipo='rib')
    import ropa_pies
    for sx, x, k in ropa_pies.lados(ctx):
        up = ropa_pies.empeine(x, k, punta=0.3, alto=0.95, abierto=False)
        ropa_pies.capellada(ctx, sx, x, k, up, cuero, 'escarpin', hi_z=0.3)
        ropa_pies.suela(ctx, sx, x, k, ctx.m('suela', '#100C0C', tipo='lisa'), alto=0.05, parte='suela escarpin')
    # gorra blanda caída a un lado con pluma larga
    from ropa import domo
    cap, R, els, azs = domo(ctx, 'gorra juglar', gorra, el_min=32, margen=0.05, alto_extra=0.12, grosor=0.04, frente=0.02, ancho=1.08)
    tope = ctx.hc + np.array([0, 0, radio_cabeza(ctx, 0, 89)])
    b = tope + np.array([0.25, 0.1, 0.0])
    ctx.pieza(clay.sweep(ctx.nombre('pluma gorra'), [b, b + np.array([0.12, 0.1, 0.3]), b + np.array([0.24, 0.26, 0.52]), b + np.array([0.34, 0.5, 0.6]),
                                                     b + np.array([0.4, 0.72, 0.5])], [0.06, 0.1, 0.1, 0.07, 0.005], (1.0, 0.22), ctx.coll, pluma, segments=6, samples=4,
                         caps=('flat', 'point')), 'cabeza')
    ctx.pieza(clay.blob(ctx.nombre('broche gorra'), tuple(b), (0.05, 0.05, 0.05), ctx.coll, oro, n=3), 'cabeza')
