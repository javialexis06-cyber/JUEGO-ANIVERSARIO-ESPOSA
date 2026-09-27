"""Ropa de abajo y conjuntos: pantalones, joggers, bermudas, shorts, faldas, tutú, vestidos, overol,
pijamas enterizas y traje de astronauta."""
import copy
import math

import numpy as np

import clay
import cuerpo
import sdf
from ropa import VX, corazon, cuello_redondo, en_superficie, estrella, mangas, prenda, ruedo, torso
from ropa_arriba import C, V, zc


# ---------------------------------------------------------------------------
# Medidas
# ---------------------------------------------------------------------------

def dims_pantalon(ctx, largo='largo', holgura=0.0):
    """Medidas del pantalón según el largo (largo, bermuda, short) sobre las del personaje."""
    if ctx.el:
        Pn = copy.deepcopy(ctx.D['pants'])
        fondo = {'largo': 0.125, 'bermuda': 0.3, 'short': 0.38}[largo]
    else:
        Pn = copy.deepcopy(ctx.D['pants'])
        Pn.update({'leg_bot': (0.21, 0.0, 0.21), 'leg_r': (0.2, 0.185), 'cuffs': False, 'bottom_k': 0.03})
        fondo = {'largo': 0.12, 'bermuda': 0.28, 'short': 0.39}[largo]
    Pn['bottom'] = fondo
    lt = np.array(Pn['leg_top'])
    lb = np.array(Pn['leg_bot'])
    # La pierna llega hasta el ruedo
    t = (lt[2] - (fondo + 0.07)) / max(lt[2] - lb[2], 1e-3)
    lb2 = lt + (lb - lt) * min(max(t, 0.2), 1.6)
    Pn['leg_bot'] = tuple(lb2)
    r0, r1 = Pn['leg_r']
    Pn['leg_r'] = (r0 + holgura, r0 + (r1 - r0) * min(t, 1.0) + holgura)
    Pn['hip_half'] = tuple(h + holgura for h in Pn['hip_half'])
    Pn['bounds'] = ((-0.6, -0.4, fondo - 0.06), (0.6, 0.45, Pn['top'] + 0.04))
    Pn['cuffs'] = False
    if 'bulge' in Pn and largo != 'largo':
        Pn.pop('bulge')
    return Pn


def pantalon_sdf(Pn):
    """Mismo pantalón de cuerpo.py (sin surcos) para ubicar adornos y ruedos."""
    hip = sdf.round_box(Pn['hip_c'], Pn['hip_half'], Pn['hip_r'])
    parts = [hip]
    for sx in (-1, 1):
        s = np.array([sx, 1, 1])
        parts.append(sdf.round_cone(np.array(Pn['leg_top']) * s, np.array(Pn['leg_bot']) * s, Pn['leg_r'][0], Pn['leg_r'][1]))
        if Pn.get('bulge'):
            parts.append(sdf.ellipsoid(np.array(Pn['bulge'][0]) * s, Pn['bulge'][1]))
    body = sdf.union(*parts, k=0.07)
    crotch = sdf.round_box((0, 0.03, Pn['crotch_z'] - 0.2), (0.008, 0.45, 0.2), 0.008)

    def f(P):
        dd = body(P)
        dd = sdf.smax(dd, -crotch(P), 0.07)
        dd = sdf.smax(dd, Pn['bottom'] - P[:, 2], Pn.get('bottom_k', 0.035))
        dd = sdf.smax(dd, P[:, 2] - Pn['top'], 0.01)
        return dd
    return f


def split_z(ctx):
    return 0.52 if not ctx.el else 0.44


def hueso_pierna(ctx, x, z):
    return 'pelvis' if z > split_z(ctx) - 0.04 else ctx.hueso_lado('pierna', -1 if x < 0 else 1)


def base_pantalon(ctx, largo='largo', holgura=0.0, tipo='tela', bolsillos=None):
    Pn = dims_pantalon(ctx, largo, holgura)
    if bolsillos is not None:
        Pn['pockets'] = bolsillos
    D = dict(ctx.D)
    D['pants'] = Pn
    mats = {'pants': ctx.m('principal', tipo=tipo), 'stitch': ctx.m('costura', tipo='lisa', color=None)}
    cuerpo.pants(ctx.coll, mats, ctx.N, D)
    f = pantalon_sdf(Pn)
    objs = []
    # Pretina
    ring = sdf.ring_points(f, (0, 0.03, Pn['top'] - 0.025), (0, 0, 1), 1.0, 40, lift=0.002)
    if len(ring) > 12:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('pretina'), ring, 0.026, (1, 0.8), ctx.coll, ctx.m('principal', tipo=tipo), segments=8,
                                         samples=3, closed=True), 'pelvis'))
    return objs, f, Pn


def ruedo_pierna(ctx, f, Pn, mat, grosor=0.024, parte='ruedo', lift=0.004):
    objs = []
    for sx in (-1, 1):
        c = np.array(Pn['leg_bot']) * np.array([sx, 1, 1])
        ring = sdf.ring_points(f, (c[0], c[1], Pn['bottom'] + grosor), (0, 0, 1), 0.5, 28, lift=lift)
        ring = [p for p in ring if p[0] * sx > 0.01]
        if len(ring) > 10:
            ring.sort(key=lambda p: math.atan2(p[1] - c[1], p[0] - c[0]))
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'{parte} {ctx.lado(sx)}'), ring, grosor, (1, 1), ctx.coll, mat, segments=8, samples=3,
                                             closed=True), ctx.hueso_lado('pierna', sx)))
    return objs


def piernas_el(ctx, Pn, media='blanco'):
    """Él no tiene piernas debajo del pantalón de fábrica: con bermudas y shorts se le ponen piernas y medias."""
    if not ctx.el:
        return []
    L = {'x': 0.232, 'y': 0.0, 'top': Pn['bottom'] + 0.06, 'ankle': 0.2, 'r': (0.115, 0.105), 'sock_top': 0.27, 'sock_r': 0.11}
    D = dict(ctx.D)
    D['legs'] = L
    return cuerpo.legs(ctx.coll, {'skin': ctx.piel_mat, 'sock': ctx.m('medias', color=C.get(media, media))}, ctx.N, D)


def adornos_pantalon(ctx, f, Pn, n, hacer, semilla=5):
    """Estampado repartido sobre las piernas (frente y atrás)."""
    rng = np.random.default_rng(semilla)
    objs = []
    for k in range(n):
        sx = -1 if k % 2 else 1
        c = np.array(Pn['leg_bot']) * np.array([sx, 1, 1])
        z = rng.uniform(Pn['bottom'] + 0.06, Pn['top'] - 0.08)
        x = c[0] + rng.uniform(-0.08, 0.08)
        atras = bool(rng.random() < 0.45)
        o = hacer(k)
        r = en_superficie(ctx, f, x, z, o, hueso_pierna(ctx, x, z), lift=0.006, atras=atras)
        if r is not None:
            objs.append(r)
    return objs


# ---------------------------------------------------------------------------
# Pantalones
# ---------------------------------------------------------------------------

@prenda('pantalon', 'abajo', [V('pantalon_jean', 'Jean azul', principal='jean', costura='mostaza'),
                              V('pantalon_negro', 'Pantalón negro', principal='negro', costura='grafito'),
                              V('pantalon_caqui', 'Pantalón caqui', principal='beige', costura='cafe'),
                              V('pantalon_gris', 'Pantalón gris', principal='gris', costura='grafito'),
                              V('pantalon_rojo', 'Pantalón rojo', principal='rojo', costura='vino'),
                              V('pantalon_blanco', 'Pantalón blanco', principal='blanco', costura='beige')],
        precio=35)
def pantalon(ctx):
    base_pantalon(ctx, 'largo', 0.005, bolsillos=True)


@prenda('jogger', 'abajo', [V('jogger_gris', 'Jogger gris', principal='gris', costura='grafito', cordon='blanco'),
                            V('jogger_negro', 'Jogger negro', principal='negro', costura='grafito', cordon='blanco'),
                            V('jogger_marino', 'Jogger azul', principal='marino', costura='grafito', cordon='blanco'),
                            V('jogger_rosado', 'Jogger rosado', principal='rosado', costura='rosa_palo', cordon='blanco')],
        precio=35)
def jogger(ctx):
    objs, f, Pn = base_pantalon(ctx, 'largo', 0.02, bolsillos=False)
    objs += ruedo_pierna(ctx, f, Pn, ctx.m('principal', tipo='rib'), grosor=0.03, parte='puño jogger')
    for sx in (-1, 1):
        pts = sdf.front_points(f, [(sx * 0.03, Pn['top'] - 0.03), (sx * 0.04, Pn['top'] - 0.1), (sx * 0.05, Pn['top'] - 0.15)], lift=0.01)
        if len(pts) == 3:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'cordon jogger {ctx.lado(sx)}'), pts, 0.01, (1, 1), ctx.coll, ctx.m('cordon', tipo='lisa'),
                                             segments=6, samples=4), 'pelvis'))
    return objs


@prenda('bermuda', 'abajo', [V('bermuda_caqui', 'Bermuda caqui', principal='beige', costura='cafe'),
                             V('bermuda_jean', 'Bermuda de jean', principal='jean', costura='mostaza'),
                             V('bermuda_verde', 'Bermuda verde', principal='oliva', costura='cafe'),
                             V('bermuda_cuadros', 'Bermuda azul', principal='azul', costura='blanco')],
        precio=30)
def bermuda(ctx):
    objs, f, Pn = base_pantalon(ctx, 'bermuda', 0.03, bolsillos=True)
    objs += ruedo_pierna(ctx, f, Pn, ctx.m('principal'), grosor=0.026, parte='dobladillo bermuda')
    objs += piernas_el(ctx, Pn)
    return objs


@prenda('short', 'abajo', [V('short_azul', 'Short deportivo azul', principal='azul', franja='blanco', costura='blanco'),
                           V('short_rojo', 'Short deportivo rojo', principal='rojo', franja='blanco', costura='blanco'),
                           V('short_negro', 'Short deportivo negro', principal='negro', franja='menta', costura='grafito'),
                           V('short_rosado', 'Short rosado', principal='rosado', franja='blanco', costura='blanco')],
        precio=25)
def short(ctx):
    objs, f, Pn = base_pantalon(ctx, 'short', 0.035, bolsillos=False)
    franja = ctx.m('franja')
    objs += ruedo_pierna(ctx, f, Pn, franja, grosor=0.018, parte='dobladillo short')
    for sx in (-1, 1):
        pts = []
        for z in np.linspace(Pn['top'] - 0.03, Pn['bottom'] + 0.03, 5):
            P, hit = sdf.trace(f, np.array([[sx * 1.5, 0.03, z]]), (-sx, 0, 0), max_dist=2.0)
            if hit[0]:
                pts.append(P[0] + sdf.normal(f, P)[0] * 0.002)
        if len(pts) >= 3:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'franja short {ctx.lado(sx)}'), pts, 0.022, (0.35, 1), ctx.coll, franja, segments=6, samples=4,
                                             up_fn=lambda q, f=f: sdf.normal(f, np.array([q]))[0]), ctx.hueso_lado('pierna', sx)))
    objs += piernas_el(ctx, Pn)
    return objs


@prenda('pantalon_pijama', 'abajo', [V('pijama_corazones', 'Pantalón de pijama de corazones', principal='rosa_palo', adorno='rojo', costura='rosado'),
                                     V('pijama_estrellas', 'Pantalón de pijama de estrellas', principal='marino', adorno='amarillo', costura='azul'),
                                     V('pijama_menta', 'Pantalón de pijama verde', principal='menta', adorno='blanco', costura='verde')],
        precio=30)
def pantalon_pijama(ctx):
    objs, f, Pn = base_pantalon(ctx, 'largo', 0.03, bolsillos=False)
    objs += ruedo_pierna(ctx, f, Pn, ctx.m('principal', tipo='rib'), grosor=0.028, parte='puño pijama')
    m = ctx.m('adorno', tipo='lisa')
    objs += adornos_pantalon(ctx, f, Pn, 14, lambda k: corazon(ctx, f'adorno pijama {k}', 0.2, m, grosor=0.22), semilla=9)
    return objs


# ---------------------------------------------------------------------------
# Faldas (Ella)
# ---------------------------------------------------------------------------

def falda_sdf(top, hem, r0, r1, pliegues=10, y=0.03):
    bell = sdf.round_cone((0, y, top), (0, y, hem + 0.02), r0, r1)
    pleats = []
    for k in range(pliegues):
        a = 2 * math.pi * k / pliegues
        pleats.append(sdf.capsule((math.cos(a) * r1 * 1.02, y + math.sin(a) * r1 * 1.02, hem + 0.02),
                                  (math.cos(a) * r0, y + math.sin(a) * r0, top - 0.05), 0.012))

    def f(P):
        dd = bell(P)
        dd = sdf.smax(dd, hem - P[:, 2], 0.02)
        dd = sdf.smax(dd, P[:, 2] - top - 0.02, 0.01)
        for pl in pleats:
            dd = sdf.smax(dd, -pl(P), 0.02)
        return dd
    return f


def falda(ctx, top, hem, r0, r1, mat, parte='falda', pliegues=10):
    f = falda_sdf(top, hem, r0, r1, pliegues)
    R = r1 + 0.1
    o = ctx.pieza(sdf.to_mesh(ctx.nombre(parte), f, (-R, -R + 0.03, hem - 0.05), (R, R + 0.03, top + 0.06), VX, ctx.coll, mat, smooth=2), 'pelvis')
    return o, f


def cintura_ella(ctx):
    return ctx.D['pants']['top'] + 0.01


@prenda('falda', 'abajo', [V('falda_rosada', 'Falda rosada', principal='rosado', costura='rosa_palo'),
                           V('falda_negra', 'Falda negra', principal='negro', costura='grafito'),
                           V('falda_jean', 'Falda de jean', principal='jean', costura='mostaza'),
                           V('falda_roja', 'Falda roja', principal='rojo', costura='vino'),
                           V('falda_amarilla', 'Falda amarilla', principal='amarillo', costura='mostaza'),
                           V('falda_lila', 'Falda lila', principal='lila', costura='morado')],
        para=('ella',), precio=35)
def falda_corta(ctx):
    top = cintura_ella(ctx)
    o, f = falda(ctx, top, 0.34, 0.4, 0.52, ctx.m('principal'))
    objs = [o]
    objs.append(ruedo(ctx, f, top - 0.025, ctx.m('principal'), 'pretina falda', grosor=0.024, hueso='pelvis'))
    ring = sdf.ring_points(f, (0, 0.03, 0.365), (0, 0, 1), 1.0, 44, lift=0.003)
    if len(ring) > 12:
        objs.append(ctx.pieza(clay.stitches(ctx.nombre('pespunte falda'), ring, 0.0045, 0.022, 0.014, ctx.coll, ctx.m('costura', tipo='lisa'),
                                            closed=True), 'pelvis'))
    return objs


@prenda('falda_larga', 'abajo', [V('falda_larga_blanca', 'Falda larga blanca', principal='blanco'),
                                 V('falda_larga_lila', 'Falda larga lila', principal='lila'),
                                 V('falda_larga_mostaza', 'Falda larga mostaza', principal='mostaza'),
                                 V('falda_larga_verde', 'Falda larga verde', principal='oliva')],
        para=('ella',), precio=40)
def falda_larga(ctx):
    top = cintura_ella(ctx)
    o, f = falda(ctx, top, 0.14, 0.4, 0.66, ctx.m('principal'), pliegues=14)
    return [o, ruedo(ctx, f, top - 0.025, ctx.m('principal'), 'pretina falda', grosor=0.024, hueso='pelvis')]


@prenda('tutu', 'abajo', [V('tutu_rosado', 'Tutú rosado', principal='rosado'), V('tutu_lila', 'Tutú lila', principal='lila'),
                          V('tutu_blanco', 'Tutú blanco', principal='blanco'), V('tutu_menta', 'Tutú verde menta', principal='menta')],
        para=('ella',), precio=40)
def tutu(ctx):
    top = cintura_ella(ctx)
    m = ctx.m('principal', tipo='peluche')
    objs = []
    for k, (z, r) in enumerate(((top - 0.07, 0.5), (top - 0.12, 0.6), (top - 0.17, 0.66))):
        pts = [(math.cos(a) * r * (1 + 0.06 * math.sin(a * 9 + k)), 0.03 + math.sin(a) * r * 0.9 * (1 + 0.06 * math.sin(a * 9 + k)),
                z + 0.02 * math.sin(a * 7 + k)) for a in np.linspace(0, 2 * math.pi, 28, endpoint=False)]
        objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'capa tutu {k}'), pts, 0.07, (1.6, 0.5), ctx.coll, m, segments=10, samples=3, closed=True,
                                         up=(0, 0, 1)), 'pelvis'))
    f = falda_sdf(top, top - 0.16, 0.4, 0.45, 8)
    objs.append(ctx.pieza(sdf.to_mesh(ctx.nombre('base tutu'), f, (-0.6, -0.57, top - 0.25), (0.6, 0.63, top + 0.06), VX, ctx.coll,
                                      ctx.m('principal'), smooth=2), 'pelvis'))
    return objs


# ---------------------------------------------------------------------------
# Vestidos (conjunto: arriba + abajo)
# ---------------------------------------------------------------------------

def base_vestido(ctx, hem=0.32, r1=0.56, mangas_si='bombacha', pliegues=12, crecer=0.012, falda_tipo='tela'):
    m = ctx.m('principal')
    D = ctx.D
    objs = []
    t, f = torso(ctx, 'torso vestido', m, crecer=crecer, cuello=1.12)
    objs.append(t)
    T = D['torso']
    top = T['bottom'] + 0.06
    o, ff = falda(ctx, top, hem, T['half'][0] + 0.02, r1, ctx.m('principal', tipo=falda_tipo), parte='falda vestido', pliegues=pliegues)
    objs.append(o)
    objs.append(ruedo(ctx, f, T['bottom'] + 0.04, ctx.m('cinta', tipo='lisa'), 'cinta vestido', grosor=0.026, prof=(1, 1.2)))
    if mangas_si == 'bombacha':
        A = D['arm']
        for sx in (-1, 1):
            s = np.array([sx, 1, 1])
            d = cuerpo._dir(D['arm_deg'], A.get('dy', 0.08)) * s
            c = np.array(D['joint']) * s + d * 0.06
            objs.append(ctx.pieza(clay.blob(ctx.nombre(f'manga bombacha {ctx.lado(sx)}'), tuple(c), (0.16, 0.155, 0.145), ctx.coll, m, n=8),
                                  ctx.hueso_lado('brazo', sx)))
    elif mangas_si == 'corta':
        objs += mangas(ctx, 0.12, m, puno=m, holgura=(0.035, 0.03))
    c, _ = cuello_redondo(ctx, f, m, grosor=0.022, escala=1.12)
    objs.append(c)
    return objs, f, ff


@prenda('vestido', 'conjunto', [V('vestido_rojo', 'Vestido rojo', principal='rojo', cinta='blanco'),
                                V('vestido_cielo', 'Vestido azul cielo', principal='cielo', cinta='blanco'),
                                V('vestido_amarillo', 'Vestido amarillo', principal='amarillo', cinta='blanco'),
                                V('vestido_menta', 'Vestido verde menta', principal='menta', cinta='blanco'),
                                V('vestido_negro', 'Vestido negro', principal='negro', cinta='rojo'),
                                V('vestido_lila', 'Vestido lila', principal='lila', cinta='blanco')],
        para=('ella',), precio=65)
def vestido(ctx):
    return base_vestido(ctx)[0]


@prenda('vestido_puntos', 'conjunto', [V('vestido_puntos', 'Vestido de puntos', principal='blanco', cinta='rojo', puntos='negro'),
                                       V('vestido_puntos_rojo', 'Vestido rojo de puntos', principal='rojo', cinta='blanco', puntos='blanco'),
                                       V('vestido_puntos_rosado', 'Vestido rosado de puntos', principal='rosado', cinta='blanco', puntos='blanco')],
        para=('ella',), precio=70)
def vestido_puntos(ctx):
    objs, f, ff = base_vestido(ctx)
    m = ctx.m('puntos', tipo='lisa')
    rng = np.random.default_rng(12)
    for k in range(34):
        a = rng.uniform(0, 2 * math.pi)
        z = rng.uniform(0.36, ctx.D['torso']['bottom'] + 0.02)
        O = np.array([[math.cos(a) * 2, 0.03 + math.sin(a) * 2, z]])
        P, hit = sdf.trace(ff, O, (-math.cos(a), -math.sin(a), 0), max_dist=3.0)
        if not hit[0]:
            continue
        n = sdf.normal(ff, P)[0]
        b = clay.blob(ctx.nombre(f'punto {k}'), (0, 0, 0), (0.028, 0.008, 0.028), ctx.coll, m, n=4)
        b.location = P[0] + n * 0.004
        clay.orient_to(b, n)
        objs.append(ctx.pieza(b, 'pelvis'))
    return objs


@prenda('vestido_novia', 'conjunto', [V('vestido_novia', 'Vestido de novia', principal='#FBF8F1', cinta='#F2E3C9', perlas='#FFFFFF')],
        para=('ella',), precio=120)
def vestido_novia(ctx):
    objs, f, ff = base_vestido(ctx, hem=0.06, r1=0.8, mangas_si='bombacha', pliegues=16)
    perla = ctx.m('perlas', tipo='brillo')
    T = ctx.D['torso']
    for k, a in enumerate(np.linspace(-2.4, 2.4, 11)):
        O = np.array([[math.sin(a) * 2, 0.03 - math.cos(a) * 2, T['bottom'] + 0.04]])
        P, hit = sdf.trace(f, O, (-math.sin(a), math.cos(a), 0), max_dist=3.0)
        if hit[0]:
            objs.append(ctx.pieza(clay.blob(ctx.nombre(f'perla {k}'), tuple(P[0] + sdf.normal(f, P)[0] * 0.03), (0.016, 0.016, 0.016), ctx.coll, perla,
                                            n=4), 'torso'))
    # Encaje del ruedo
    ring = sdf.ring_points(ff, (0, 0.03, 0.09), (0, 0, 1), 1.3, 60, lift=0.004)
    if len(ring) > 12:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('encaje ruedo'), [p + np.array([0, 0, 0.012 * math.sin(k * 1.3)]) for k, p in enumerate(ring)],
                                         0.02, (1, 0.7), ctx.coll, ctx.m('cinta', tipo='lisa'), segments=6, samples=3, closed=True), 'pelvis'))
    return objs


@prenda('vestido_princesa', 'conjunto', [V('vestido_princesa', 'Vestido de princesa rosado', principal='rosado', cinta='dorado', joya='#8FD6F0'),
                                         V('vestido_princesa_azul', 'Vestido de princesa azul', principal='cielo', cinta='blanco', joya='#F39AB0'),
                                         V('vestido_princesa_amarillo', 'Vestido de princesa amarillo', principal='amarillo', cinta='blanco',
                                           joya='#E4566B')],
        para=('ella',), precio=110)
def vestido_princesa(ctx):
    objs, f, ff = base_vestido(ctx, hem=0.08, r1=0.78, pliegues=10)
    T = ctx.D['torso']
    joya = ctx.m('joya', tipo='brillo')
    # Volantes en capas sobre la falda
    for k, z in enumerate((0.42, 0.26)):
        ring = sdf.ring_points(ff, (0, 0.03, z), (0, 0, 1), 1.3, 48, lift=0.01)
        if len(ring) > 12:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'volante {k}'), [p + np.array([0, 0, 0.015 * math.sin(i * 1.2)]) for i, p in enumerate(ring)],
                                             0.035, (1.3, 0.45), ctx.coll, ctx.m('principal'), segments=8, samples=3, closed=True), 'pelvis'))
    g = clay.blob(ctx.nombre('joya pecho'), (0, 0, 0), (0.04, 0.02, 0.05), ctx.coll, joya, n=5, p=1.6)
    objs.append(en_superficie(ctx, f, 0.0, zc(ctx, 0.65), g, lift=0.02))
    del T
    return objs


# ---------------------------------------------------------------------------
# Overol, pijamas enterizas y astronauta
# ---------------------------------------------------------------------------

@prenda('overol', 'abajo', [V('overol_jean', 'Overol de jean', principal='jean', costura='mostaza', metal='#C9CCD2'),
                            V('overol_rosado', 'Overol rosado', principal='rosado', costura='blanco', metal='#C9CCD2'),
                            V('overol_amarillo', 'Overol amarillo', principal='amarillo', costura='blanco', metal='#C9CCD2'),
                            V('overol_rojo', 'Overol rojo', principal='rojo', costura='blanco', metal='#C9CCD2')],
        precio=55)
def overol(ctx):
    objs, fp, Pn = base_pantalon(ctx, 'largo', 0.03, bolsillos=False)
    m = ctx.m('principal')
    ft = __import__('ropa').torso_sdf(ctx.D, 0.035)
    T = ctx.D['torso']
    # Peto sobre el pecho
    z0, z1 = Pn['top'] - 0.05, zc(ctx, 0.72)
    peto = clay.rbox(ctx.nombre('peto overol'), (0, 0, 0), (0.2, 0.02, (z1 - z0) / 2 + 0.02), ctx.coll, m, p=5, n=5, subsurf=2)
    objs.append(en_superficie(ctx, ft, 0.0, (z0 + z1) / 2, peto, lift=0.012))
    met = ctx.m('metal', tipo='metal')
    for sx in (-1, 1):
        x = sx * 0.1
        front = sdf.front_points(ft, [(x, z1)], lift=0.01)
        if not front:
            continue
        pf = front[0]
        # Tiras: del peto por encima del hombro hasta la espalda
        hombro = np.array([sx * T['half'][0] * 0.45, T['c'][1], T['c'][2] + T['half'][2] + 0.06])
        P, hit = sdf.trace(ft, np.array([[hombro[0], hombro[1], 2.0]]), (0, 0, -1), max_dist=3.0)
        top = P[0] + np.array([0, 0, 0.012]) if hit[0] else hombro
        P2, hit2 = sdf.trace(ft, np.array([[sx * 0.14, 3.0, Pn['top'] + 0.05]]), (0, -1, 0), max_dist=6.0)
        back = P2[0] + np.array([0, 0.012, 0]) if hit2[0] else np.array([sx * 0.14, 0.35, Pn['top']])
        objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'tira overol {ctx.lado(sx)}'), [pf, top + np.array([0, -0.05, 0]), top + np.array([0, 0.08, 0]),
                                                                                   back], 0.035, (1.0, 0.35), ctx.coll, m, segments=8, samples=5,
                                         up_fn=lambda q: sdf.normal(ft, np.array([q]))[0]), 'torso'))
        objs.append(ctx.pieza(clay.blob(ctx.nombre(f'hebilla overol {ctx.lado(sx)}'), tuple(pf + np.array([0, -0.012, 0])), (0.03, 0.012, 0.03),
                                        ctx.coll, met, n=4), 'torso'))
    bol = clay.rbox(ctx.nombre('bolsillo peto'), (0, 0, 0), (0.09, 0.008, 0.065), ctx.coll, ctx.m('costura', tipo='lisa'), p=6, n=4, subsurf=1)
    objs.append(en_superficie(ctx, ft, 0.0, (z0 + z1) / 2 + 0.03, bol, lift=0.04))
    return objs


def base_enterizo(ctx, tipo='peluche', holgura=0.05):
    m = ctx.m('principal', tipo=tipo)
    D = ctx.D
    objs = []
    t, f = torso(ctx, 'torso enterizo', m, crecer=0.04, largo=0.04)
    objs.append(t)
    objs += mangas(ctx, D['arm']['wrist_t'] - 0.02, m, puno=ctx.m('principal', tipo='rib'), holgura=(0.05, 0.04), ancho_puno=0.028)
    Pn = dims_pantalon(ctx, 'largo', holgura)
    Pn['top'] = D['torso']['bottom'] + 0.1
    D2 = dict(D)
    D2['pants'] = Pn
    cuerpo.pants(ctx.coll, {'pants': m, 'stitch': ctx.m('principal')}, ctx.N, D2)
    fp = pantalon_sdf(Pn)
    objs += ruedo_pierna(ctx, fp, Pn, ctx.m('principal', tipo='rib'), grosor=0.03, parte='puño enterizo')
    c, _ = cuello_redondo(ctx, f, ctx.m('principal', tipo='rib'), grosor=0.03)
    objs.append(c)
    return objs, f, fp, Pn


@prenda('pijama_dino', 'conjunto', [V('pijama_dino', 'Pijama enteriza de dinosaurio', principal='#7DC47A', panza='#F4E6A9', puas='#F7A93B')],
        precio=80)
def pijama_dino(ctx):
    objs, f, fp, Pn = base_enterizo(ctx)
    panza = clay.blob(ctx.nombre('panza dino'), (0, 0, 0), (0.24, 0.02, 0.26), ctx.coll, ctx.m('panza', tipo='peluche'), n=6, p=2.4)
    objs.append(en_superficie(ctx, f, 0.0, zc(ctx, 0.4), panza, lift=0.01))
    puas = ctx.m('puas', tipo='lisa')
    T = ctx.D['torso']
    for k, t in enumerate(np.linspace(0.2, 0.95, 5)):
        z = zc(ctx, t)
        P, hit = sdf.trace(f, np.array([[0, 3.0, z]]), (0, -1, 0), max_dist=6.0)
        if hit[0]:
            s = 0.06 - 0.008 * k
            objs.append(ctx.pieza(clay.blob(ctx.nombre(f'pua {k}'), tuple(P[0] + np.array([0, s * 0.6, 0])), (0.018, s, s), ctx.coll, puas, n=5,
                                            shaper=lambda v: v * np.where(v[:, 1:2] > 0, [0.5, 1, 0.5], [1, 1, 1])), 'torso'))
    del T, fp, Pn
    return objs


@prenda('pijama_oso', 'conjunto', [V('pijama_oso', 'Pijama enteriza de osito', principal='#B07A52', panza='#F1D6B3'),
                                   V('pijama_panda', 'Pijama enteriza de panda', principal='#F6F2EA', panza='#2B2422'),
                                   V('pijama_conejo', 'Pijama enteriza de conejito', principal='#FAF6F2', panza='#F7C6D2'),
                                   V('pijama_unicornio', 'Pijama enteriza de unicornio', principal='#DCCDF5', panza='#FFFFFF')],
        precio=80)
def pijama_oso(ctx):
    objs, f, fp, Pn = base_enterizo(ctx)
    panza = clay.blob(ctx.nombre('panza oso'), (0, 0, 0), (0.22, 0.02, 0.25), ctx.coll, ctx.m('panza', tipo='peluche'), n=6, p=2.2)
    objs.append(en_superficie(ctx, f, 0.0, zc(ctx, 0.42), panza, lift=0.01))
    del fp, Pn
    return objs


@prenda('traje_astronauta', 'conjunto', [V('traje_astronauta', 'Traje de astronauta', principal='#F4F4F2', detalle='#9FA7B3', luces='#E4566B',
                                           luz2='#5FC6F0', parche='#3B6FB6')], precio=110)
def traje_astronauta(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='tela', holgura=0.06)
    det = ctx.m('detalle', tipo='lisa')
    caja = clay.rbox(ctx.nombre('panel pecho'), (0, 0, 0), (0.15, 0.03, 0.1), ctx.coll, det, p=6, n=4, subsurf=1)
    objs.append(en_superficie(ctx, f, 0.0, zc(ctx, 0.62), caja, lift=0.03))
    for k, (x, papel) in enumerate(((-0.07, 'luces'), (0.0, 'luz2'), (0.07, 'luces'))):
        b = clay.blob(ctx.nombre(f'luz panel {k}'), (0, 0, 0), (0.022, 0.012, 0.022), ctx.coll, ctx.m(papel, tipo='brillo'), n=4)
        objs.append(en_superficie(ctx, f, x, zc(ctx, 0.62), b, lift=0.065))
    objs.append(ruedo(ctx, f, ctx.D['torso']['bottom'] + 0.03, det, 'cinturon astronauta', grosor=0.035, prof=(1, 1.3)))
    p = estrella(ctx, 'parche estrella', 0.06, ctx.m('parche', tipo='lisa'), grosor=0.01)
    objs.append(en_superficie(ctx, f, -0.25 if ctx.el else 0.25, zc(ctx, 0.8), p, lift=0.012))
    for sx in (-1, 1):
        c = np.array(Pn['leg_bot']) * np.array([sx, 1, 1])
        rod = clay.blob(ctx.nombre(f'rodillera {ctx.lado(sx)}'), (0, 0, 0), (0.1, 0.02, 0.07), ctx.coll, det, n=5, p=2.6)
        o = en_superficie(ctx, fp, c[0], Pn['bottom'] + 0.12, rod, ctx.hueso_lado('pierna', sx), lift=0.012)
        if o is not None:
            objs.append(o)
    return objs


@prenda('pijama_corazones', 'conjunto', [V('pijama_enteriza_corazones', 'Pijama de corazones', principal='rosa_palo', adorno='rojo'),
                                         V('pijama_enteriza_estrellas', 'Pijama de estrellas', principal='marino', adorno='amarillo')],
        precio=70)
def pijama_corazones(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='tela', holgura=0.04)
    m = ctx.m('adorno', tipo='lisa')
    T = ctx.D['torso']
    import ropa
    for k, (x, z, atras) in enumerate(ropa.puntos_superficie(10, zc(ctx, 0.1), zc(ctx, 0.85), T['half'][0] * 0.75, semilla=6, sep=0.13)):
        c = corazon(ctx, f'adorno {k}', 0.2, m, grosor=0.22)
        o = en_superficie(ctx, f, x, z, c, 'torso', lift=0.006, atras=atras)
        if o is not None:
            objs.append(o)
    objs += adornos_pantalon(ctx, fp, Pn, 10, lambda k: corazon(ctx, f'adorno pierna {k}', 0.18, m, grosor=0.22), semilla=4)
    return objs
