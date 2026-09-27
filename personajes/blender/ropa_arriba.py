"""Ropa de arriba: camisetas, buzos, suéteres, camisas, chaquetas, sacos, blusas y uniformes."""
import math

import numpy as np

import clay
import cuerpo
import sdf
from ropa import (VX, botones, corazon, cuello_redondo, en_superficie, estrella, flor, mangas, prenda, puntos_superficie,
                  ruedo, torso)

C = dict(rojo='#E4566B', rosado='#F39AB0', rosa_palo='#F2C1CB', amarillo='#F7C948', mostaza='#E3A53B', menta='#8FD6B9',
         verde='#5FA05E', oliva='#7C8A4E', cielo='#8EC5F0', azul='#3B6FB6', marino='#26375E', lila='#C9B6EA', morado='#8A5BB8',
         blanco='#F6F2EA', crema='#F1E4CC', beige='#D8C3A5', cafe='#8A5A3C', gris='#A3A3A8', grafito='#4A4A50', negro='#1E1D1D',
         naranja='#F28C45', vino='#8E2E43', coral='#F07F6B', turquesa='#2FA7B8', dorado='#E5B85C', jean='#4F74A8',
         jean_oscuro='#34507A')


def V(ident, nombre, **papeles):
    return (ident, nombre, {k: C.get(v, v) for k, v in papeles.items()})


# ---------------------------------------------------------------------------
# Base de camiseta (torso + mangas + cuello + ruedo)
# ---------------------------------------------------------------------------

def base_camiseta(ctx, largo_manga=0.12, crecer=0.012, cuello=True, ruedo_si=True, papel='principal', tipo='tela', largo=0.0,
                  puno_rib=True, escote=1.0):
    m = ctx.m(papel, tipo=tipo)
    rib = ctx.m(papel, tipo='rib') if tipo == 'tela' else m
    objs = []
    t, f = torso(ctx, 'torso prenda', m, crecer=crecer, largo=largo, cuello=escote)
    objs.append(t)
    if largo_manga:
        objs += mangas(ctx, largo_manga, m, puno=rib if puno_rib else m, holgura=(0.035, 0.03))
    if cuello:
        c, _ = cuello_redondo(ctx, f, rib, escala=escote)
        objs.append(c)
    if ruedo_si:
        objs.append(ruedo(ctx, f, ctx.D['torso']['bottom'] - largo + 0.022, m, 'ruedo prenda', grosor=0.022))
    return objs, f


def estampar(ctx, f, obj, x, z, atras=False, lift=0.008):
    return en_superficie(ctx, f, x, z, obj, 'torso', lift=lift, atras=atras)


def zc(ctx, t):
    """Altura en el torso: 0 = ruedo, 1 = hombros."""
    T = ctx.D['torso']
    return T['bottom'] + (T['c'][2] + T['half'][2] - T['bottom']) * t


# ---------------------------------------------------------------------------
# Camisetas
# ---------------------------------------------------------------------------

@prenda('camiseta', 'arriba', [V('camiseta_blanca', 'Camiseta blanca', principal='blanco'), V('camiseta_roja', 'Camiseta roja', principal='rojo'),
                               V('camiseta_amarilla', 'Camiseta amarilla', principal='amarillo'),
                               V('camiseta_cielo', 'Camiseta azul cielo', principal='cielo'),
                               V('camiseta_menta', 'Camiseta verde menta', principal='menta'), V('camiseta_lila', 'Camiseta lila', principal='lila'),
                               V('camiseta_rosada', 'Camiseta rosada', principal='rosado'), V('camiseta_negra', 'Camiseta negra', principal='negro')],
        precio=25)
def camiseta(ctx):
    return base_camiseta(ctx)[0]


@prenda('camiseta_corazon', 'arriba', [V('camiseta_corazon', 'Camiseta con corazón', principal='blanco', estampado='rojo'),
                                       V('camiseta_corazon_rosa', 'Camiseta rosada con corazón', principal='rosado', estampado='blanco'),
                                       V('camiseta_corazon_negra', 'Camiseta negra con corazón', principal='negro', estampado='rosado'),
                                       V('camiseta_corazon_amarilla', 'Camiseta amarilla con corazón', principal='amarillo', estampado='rojo')],
        precio=35)
def camiseta_corazon(ctx):
    objs, f = base_camiseta(ctx)
    c = corazon(ctx, 'estampado corazon', 0.62, ctx.m('estampado', tipo='lisa'), grosor=0.16)
    objs.append(estampar(ctx, f, c, 0.0, zc(ctx, 0.55)))
    return objs


@prenda('camiseta_pareja', 'arriba', [V('camiseta_pareja', 'Camiseta de pareja (medio corazón)', principal='blanco', estampado='rojo'),
                                      V('camiseta_pareja_negra', 'Camiseta de pareja negra', principal='negro', estampado='rosado')],
        precio=35)
def camiseta_pareja(ctx):
    """Cada uno lleva medio corazón: lado a lado se completa."""
    objs, f = base_camiseta(ctx)
    c = corazon(ctx, 'medio corazon', 0.7, ctx.m('estampado', tipo='lisa'), grosor=0.16)
    # Se corta la mitad: Él lleva la izquierda del corazón (a su derecha), Ella la derecha
    lado = 1 if ctx.el else -1
    for v in c.data.vertices:
        if v.co.x * lado < 0:
            v.co.x = 0.0
    x = 0.42 * ctx.D['torso']['half'][0] * lado
    objs.append(estampar(ctx, f, c, x, zc(ctx, 0.55)))
    return objs


@prenda('camiseta_rayas', 'arriba', [V('camiseta_marinera', 'Camiseta marinera', principal='blanco', rayas='marino'),
                                     V('camiseta_abeja', 'Camiseta de abejita', principal='amarillo', rayas='negro'),
                                     V('camiseta_rayas_roja', 'Camiseta de rayas rojas', principal='blanco', rayas='rojo'),
                                     V('camiseta_rayas_rosa', 'Camiseta de rayas rosadas', principal='blanco', rayas='rosado')],
        precio=35)
def camiseta_rayas(ctx):
    objs, f = base_camiseta(ctx)
    m = ctx.m('rayas')
    T = ctx.D['torso']
    for k, t in enumerate(np.linspace(0.14, 0.86, 6)):
        z = zc(ctx, t)
        ring = sdf.ring_points(f, (0, T['c'][1], z), (0, 0, 1), 1.2, 44, lift=0.001)
        if len(ring) > 12:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'raya {k}'), ring, 0.03, (0.35, 1.0), ctx.coll, m, segments=6, samples=3,
                                             closed=True, up_fn=lambda q, f=f: sdf.normal(f, np.array([q]))[0]), 'torso'))
    return objs


@prenda('camiseta_estrella', 'arriba', [V('camiseta_heroe', 'Camiseta de súper héroe', principal='rojo', emblema='amarillo'),
                                        V('camiseta_heroe_azul', 'Camiseta de héroe azul', principal='azul', emblema='amarillo'),
                                        V('camiseta_heroe_verde', 'Camiseta de héroe verde', principal='verde', emblema='blanco'),
                                        V('camiseta_heroe_negra', 'Camiseta de héroe negra', principal='negro', emblema='dorado')],
        precio=40)
def camiseta_estrella(ctx):
    objs, f = base_camiseta(ctx)
    e = estrella(ctx, 'emblema estrella', 0.17, ctx.m('emblema', tipo='lisa'), grosor=0.016)
    objs.append(estampar(ctx, f, e, 0.0, zc(ctx, 0.58)))
    return objs


@prenda('camiseta_futbol', 'arriba', [V('camiseta_tricolor', 'Camiseta amarilla de fútbol', principal='amarillo', detalle='marino'),
                                      V('camiseta_futbol_roja', 'Camiseta roja de fútbol', principal='rojo', detalle='marino'),
                                      V('camiseta_futbol_verde', 'Camiseta verde de fútbol', principal='verde', detalle='blanco'),
                                      V('camiseta_futbol_azul', 'Camiseta azul de fútbol', principal='azul', detalle='amarillo')],
        precio=45)
def camiseta_futbol(ctx):
    m = ctx.m('principal')
    det = ctx.m('detalle')
    objs = []
    t, f = torso(ctx, 'torso prenda', m, crecer=0.015, largo=0.02)
    objs.append(t)
    objs += mangas(ctx, 0.13, m, puno=det, holgura=(0.04, 0.035), ancho_puno=0.026)
    c, _ = cuello_redondo(ctx, f, det, grosor=0.03)
    objs.append(c)
    objs.append(ruedo(ctx, f, ctx.D['torso']['bottom'] + 0.005, det, 'ruedo prenda', grosor=0.024))
    # Franjas a los lados
    T = ctx.D['torso']
    for sx in (-1, 1):
        pts = []
        for t in np.linspace(0.08, 0.8, 6):
            z = zc(ctx, t)
            P, hit = sdf.trace(f, np.array([[sx * 1.5, T['c'][1], z]]), (-sx, 0, 0), max_dist=2.0)
            if hit[0]:
                pts.append(P[0])
        if len(pts) >= 3:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'franja {ctx.lado(sx)}'), pts, 0.028, (0.4, 1.0), ctx.coll, det, segments=6,
                                             samples=4, up_fn=lambda q, f=f: sdf.normal(f, np.array([q]))[0]), 'torso'))
    # Escudito de corazón y número en la espalda
    esc = corazon(ctx, 'escudo', 0.22, det, grosor=0.2)
    objs.append(estampar(ctx, f, esc, 0.2 * (1 if ctx.el else -1), zc(ctx, 0.72)))
    objs += numero(ctx, f, 10, det, zc(ctx, 0.52))
    return objs


def numero(ctx, f, n, mat, z, alto=0.22):
    """Número de la espalda con trazos (1 y 0)."""
    objs = []
    digitos = str(n)
    ancho = alto * 0.55
    x0 = -(len(digitos) - 1) * ancho * 0.75
    for k, d in enumerate(digitos):
        x = x0 + k * ancho * 1.5
        if d == '1':
            xz = [(x - ancho * 0.25, z + alto * 0.3), (x + ancho * 0.05, z + alto * 0.5), (x + ancho * 0.05, z - alto * 0.5)]
        else:
            xz = [(x + math.sin(a) * ancho * 0.5, z + math.cos(a) * alto * 0.5) for a in np.linspace(0, 2 * math.pi, 13)]
        pts = []
        for (px, pz) in xz:
            P, hit = sdf.trace(f, np.array([[-px, 3.0, pz]]), (0, -1, 0), max_dist=6.0)
            if hit[0]:
                pts.append(P[0] + sdf.normal(f, P)[0] * 0.004)
        if len(pts) >= 3:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'numero {k}'), pts, 0.022, (0.35, 1.0), ctx.coll, mat, segments=6, samples=4,
                                             closed=d == '0', up_fn=lambda q, f=f: sdf.normal(f, np.array([q]))[0]), 'torso'))
    return objs


@prenda('esqueleto', 'arriba', [V('esqueleto_blanco', 'Esqueleto blanco', principal='blanco'), V('esqueleto_negro', 'Esqueleto negro', principal='negro'),
                                V('esqueleto_rojo', 'Esqueleto rojo', principal='rojo'), V('esqueleto_menta', 'Esqueleto verde menta', principal='menta')],
        precio=20)
def esqueleto(ctx):
    objs, _ = base_camiseta(ctx, largo_manga=0, escote=1.2)
    return objs


# ---------------------------------------------------------------------------
# Buzos y suéteres
# ---------------------------------------------------------------------------

@prenda('buzo', 'arriba', [V('buzo_rosado', 'Buzo rosado con capota', principal='rosado', cordon='blanco'),
                           V('buzo_gris', 'Buzo gris con capota', principal='gris', cordon='blanco'),
                           V('buzo_marino', 'Buzo azul marino con capota', principal='marino', cordon='blanco'),
                           V('buzo_menta', 'Buzo verde menta con capota', principal='menta', cordon='blanco'),
                           V('buzo_amarillo', 'Buzo amarillo con capota', principal='amarillo', cordon='blanco'),
                           V('buzo_lila', 'Buzo lila con capota', principal='lila', cordon='blanco'),
                           V('buzo_negro', 'Buzo negro con capota', principal='negro', cordon='rojo')],
        precio=55)
def buzo(ctx):
    """Buzo con capota caída, bolsillo canguro, cordones y puños acanalados."""
    m1, rib = ctx.m('principal'), ctx.m('principal', tipo='rib')
    D = ctx.D
    T = D['torso']
    objs = []
    t, f = torso(ctx, 'torso buzo', m1, crecer=0.02, largo=0.02)
    objs.append(t)
    objs.append(ruedo(ctx, f, T['bottom'] + 0.012, rib, 'ribete buzo', grosor=0.032, prof=(1, 1.2)))
    A = D['arm']
    objs += mangas(ctx, A['wrist_t'] - 0.02, m1, puno=rib, holgura=(0.04, 0.03), ancho_puno=0.028)
    bol = clay.blob(ctx.nombre('bolsillo buzo'), (0, 0, 0), (0.2, 0.02, 0.085), ctx.coll, m1, n=6, p=4, subsurf=2)
    objs.append(estampar(ctx, f, bol, 0.0, T['c'][2] - 0.1, lift=0.012))
    nh = np.array(D['neck_hole'][0])
    for sx in (-1, 1):
        pts = sdf.front_points(f, [(sx * 0.07, nh[2] - 0.04), (sx * 0.075, nh[2] - 0.12), (sx * 0.08, nh[2] - 0.2)], lift=0.012)
        if len(pts) == 3:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'cordon buzo {ctx.lado(sx)}'), pts, 0.011, (1, 1), ctx.coll,
                                             ctx.m('cordon', tipo='lisa'), segments=6, samples=4), 'torso'))
    c, ring = cuello_redondo(ctx, f, rib, grosor=0.03)
    objs.append(c)
    back = sorted([q for q in ring if q[1] > nh[1] + 0.02], key=lambda q: q[0])
    if len(back) >= 4:
        pts = [back[0] + np.array([0, 0.02, 0.01])] + [q + np.array([0, 0.05, 0.03]) for q in back[1:-1]] + [back[-1] + np.array([0, 0.02, 0.01])]
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('capota rollo'), pts, 0.055, (1.3, 1), ctx.coll, m1, segments=12, samples=4), 'torso'))
    pb = sdf.ring_points(f, (0, T['c'][1], nh[2] - 0.16), (0, 0, 1), 1.0, 36)
    atras = max(pb, key=lambda q: q[1]) if pb else np.array([0, 0.3, nh[2] - 0.16])
    objs.append(ctx.pieza(clay.blob(ctx.nombre('capota'), tuple(atras + np.array([0, 0.03, 0.02])), (0.21, 0.05, 0.14), ctx.coll, m1, n=8, p=2.6),
                          'torso'))
    return objs


def base_sueter(ctx, crecer=0.022):
    m = ctx.m('principal', tipo='rib')
    D = ctx.D
    objs = []
    t, f = torso(ctx, 'torso sueter', m, crecer=crecer, largo=0.02)
    objs.append(t)
    objs.append(ruedo(ctx, f, D['torso']['bottom'] + 0.015, m, 'ribete sueter', grosor=0.034, prof=(1, 1.25)))
    objs += mangas(ctx, D['arm']['wrist_t'] - 0.02, m, puno=m, holgura=(0.04, 0.03), ancho_puno=0.028)
    c, _ = cuello_redondo(ctx, f, m, grosor=0.034)
    objs.append(c)
    return objs, f


@prenda('sueter', 'arriba', [V('sueter_crema', 'Suéter crema', principal='crema'), V('sueter_cafe', 'Suéter café', principal='cafe'),
                             V('sueter_vino', 'Suéter vino tinto', principal='vino'), V('sueter_azul', 'Suéter azul', principal='azul'),
                             V('sueter_oliva', 'Suéter verde oliva', principal='oliva'), V('sueter_gris', 'Suéter gris', principal='gris')],
        precio=45)
def sueter(ctx):
    return base_sueter(ctx)[0]


@prenda('sueter_corazones', 'arriba', [V('sueter_corazones', 'Suéter de corazones', principal='rojo', adorno='blanco'),
                                       V('sueter_corazones_blanco', 'Suéter blanco de corazones', principal='blanco', adorno='rojo'),
                                       V('sueter_corazones_rosa', 'Suéter rosado de corazones', principal='rosado', adorno='blanco'),
                                       V('sueter_corazones_marino', 'Suéter azul de corazones', principal='marino', adorno='rojo')],
        precio=55)
def sueter_corazones(ctx):
    objs, f = base_sueter(ctx)
    m = ctx.m('adorno', tipo='lisa')
    T = ctx.D['torso']
    for k, (x, z, atras) in enumerate(puntos_superficie(12, zc(ctx, 0.12), zc(ctx, 0.85), T['half'][0] * 0.78, semilla=7, sep=0.13)):
        c = corazon(ctx, f'corazoncito {k}', 0.2, m, grosor=0.22)
        o = estampar(ctx, f, c, x, z, atras=atras, lift=0.006)
        if o is not None:
            objs.append(o)
    return objs


@prenda('sueter_navidad', 'arriba', [V('sueter_navidad', 'Suéter navideño', principal='rojo', adorno='blanco', pino='verde'),
                                     V('sueter_navidad_verde', 'Suéter navideño verde', principal='verde', adorno='blanco', pino='rojo')],
        precio=55)
def sueter_navidad(ctx):
    objs, f = base_sueter(ctx)
    blanco, pino = ctx.m('adorno', tipo='lisa'), ctx.m('pino', tipo='lisa')
    T = ctx.D['torso']
    z = zc(ctx, 0.42)
    objs.append(ruedo(ctx, f, z + 0.1, blanco, 'franja navidad 1', grosor=0.016, prof=(0.35, 1.0)))
    objs.append(ruedo(ctx, f, z - 0.1, blanco, 'franja navidad 2', grosor=0.016, prof=(0.35, 1.0)))
    for k, x in enumerate(np.linspace(-T['half'][0] * 0.7, T['half'][0] * 0.7, 5)):
        p = clay.blob(ctx.nombre(f'pino {k}'), (0, 0, 0), (0.05, 0.012, 0.06), ctx.coll, pino, n=5,
                      shaper=lambda v: v * np.where(v[:, 2:3] > 0, [0.35, 1, 1], [1, 1, 1]))
        o = estampar(ctx, f, p, x, z, lift=0.006)
        if o is not None:
            objs.append(o)
    for k, (x, zz, atras) in enumerate(puntos_superficie(8, zc(ctx, 0.62), zc(ctx, 0.9), T['half'][0] * 0.7, semilla=4, sep=0.14)):
        e = estrella(ctx, f'copo {k}', 0.035, blanco, grosor=0.008, puntas=6)
        o = estampar(ctx, f, e, x, zz, atras=atras, lift=0.005)
        if o is not None:
            objs.append(o)
    return objs


# ---------------------------------------------------------------------------
# Camisas
# ---------------------------------------------------------------------------

def base_camisa(ctx, larga=False):
    m = ctx.m('principal')
    D = ctx.D
    objs = []
    t, f = torso(ctx, 'torso camisa', m, crecer=0.016, largo=0.03, cuello=1.08)
    objs.append(t)
    largo = D['arm']['wrist_t'] - 0.02 if larga else 0.13
    objs += mangas(ctx, largo, m, puno=m, holgura=(0.035, 0.03), ancho_puno=0.02)
    objs.append(ruedo(ctx, f, D['torso']['bottom'] - 0.01, m, 'ruedo camisa', grosor=0.018))
    # Cuello de dos puntas
    nc, nr = D['neck_hole']
    for sx in (-1, 1):
        p = clay.blob(ctx.nombre(f'cuello camisa {ctx.lado(sx)}'), (0, 0, 0), (0.085, 0.014, 0.05), ctx.coll, m, n=6, p=2.4,
                      shaper=lambda v, sx=sx: v + np.array([0, 0, -1.0]) * np.maximum(0, v[:, 0:1] * -sx) * 0.4)
        o = estampar(ctx, f, p, sx * (nr[0] * 0.55), nc[2] - 0.05, lift=0.016)
        if o is not None:
            o.rotation_mode = 'XYZ'
            o.rotation_euler.y += math.radians(-24 * sx)
            objs.append(o)
    # Tapeta con botones
    zt, zb = nc[2] - 0.07, D['torso']['bottom'] + 0.05
    pts = sdf.front_points(f, [(0.0, z) for z in np.linspace(zt, zb, 5)], lift=0.004)
    if len(pts) >= 3:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('tapeta camisa'), pts, 0.028, (1.0, 0.3), ctx.coll, m, segments=6, samples=4,
                                         up_fn=lambda q, f=f: sdf.normal(f, np.array([q]))[0]), 'torso'))
    objs += botones(ctx, f, [(0.0, z) for z in np.linspace(zt - 0.03, zb + 0.02, 5)], ctx.m('botones', tipo='lisa'), r=0.018)
    # Bolsillo
    bol = clay.rbox(ctx.nombre('bolsillo camisa'), (0, 0, 0), (0.07, 0.008, 0.075), ctx.coll, m, p=6, n=4, subsurf=1)
    objs.append(estampar(ctx, f, bol, -0.2 * (1 if ctx.el else 1), zc(ctx, 0.66), lift=0.006))
    return objs, f


@prenda('camisa', 'arriba', [V('camisa_blanca', 'Camisa blanca', principal='blanco', botones='crema'),
                             V('camisa_celeste', 'Camisa celeste', principal='cielo', botones='blanco'),
                             V('camisa_rosada', 'Camisa rosada', principal='rosa_palo', botones='blanco'),
                             V('camisa_menta', 'Camisa verde menta', principal='menta', botones='blanco'),
                             V('camisa_amarilla', 'Camisa amarilla', principal='amarillo', botones='blanco')],
        precio=40)
def camisa(ctx):
    return base_camisa(ctx)[0]


@prenda('camisa_hawaiana', 'arriba', [V('camisa_hawaiana', 'Camisa hawaiana azul', principal='turquesa', botones='blanco', flores='blanco',
                                        centro='amarillo'),
                                      V('camisa_hawaiana_roja', 'Camisa hawaiana roja', principal='rojo', botones='blanco', flores='amarillo',
                                        centro='naranja'),
                                      V('camisa_hawaiana_verde', 'Camisa hawaiana verde', principal='verde', botones='blanco', flores='rosado',
                                        centro='amarillo'),
                                      V('camisa_hawaiana_amarilla', 'Camisa hawaiana amarilla', principal='amarillo', botones='blanco',
                                        flores='rojo', centro='blanco')],
        precio=50)
def camisa_hawaiana(ctx):
    objs, f = base_camisa(ctx)
    T = ctx.D['torso']
    mp, mc = ctx.m('flores', tipo='lisa'), ctx.m('centro', tipo='lisa')
    for k, (x, z, atras) in enumerate(puntos_superficie(11, zc(ctx, 0.08), zc(ctx, 0.9), T['half'][0] * 0.8, semilla=11, sep=0.14)):
        if abs(x) < 0.05 and not atras:
            continue
        fl = flor(ctx, f'flor {k}', 0.055, mp, mc)
        o = estampar(ctx, f, fl, x, z, atras=atras, lift=0.006)
        if o is not None:
            objs.append(o)
    return objs


@prenda('camisa_cuadros', 'arriba', [V('camisa_lenador', 'Camisa de cuadros roja', principal='rojo', cuadros='negro', botones='blanco'),
                                     V('camisa_cuadros_azul', 'Camisa de cuadros azul', principal='azul', cuadros='marino', botones='blanco'),
                                     V('camisa_cuadros_verde', 'Camisa de cuadros verde', principal='verde', cuadros='oliva', botones='blanco')],
        precio=45)
def camisa_cuadros(ctx):
    objs, f = base_camisa(ctx, larga=True)
    m = ctx.m('cuadros')
    T = ctx.D['torso']
    up = (lambda q, f=f: sdf.normal(f, np.array([q]))[0])
    for k, t in enumerate(np.linspace(0.1, 0.9, 5)):
        ring = sdf.ring_points(f, (0, T['c'][1], zc(ctx, t)), (0, 0, 1), 1.2, 44, lift=0.001)
        if len(ring) > 12:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'cuadro h {k}'), ring, 0.026, (0.3, 1.0), ctx.coll, m, segments=6, samples=3,
                                             closed=True, up_fn=up), 'torso'))
    for k, x in enumerate(np.linspace(-T['half'][0] * 0.8, T['half'][0] * 0.8, 6)):
        for atras in (False, True):
            pts = []
            for t in np.linspace(0.02, 0.92, 6):
                z = zc(ctx, t)
                O = np.array([[x, 3.0 if atras else -3.0, z]])
                P, hit = sdf.trace(f, O, (0, -1 if atras else 1, 0), max_dist=6.0)
                if hit[0]:
                    pts.append(P[0] + sdf.normal(f, P)[0] * 0.001)
            if len(pts) >= 3:
                objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'cuadro v {k} {int(atras)}'), pts, 0.026, (0.3, 1.0), ctx.coll, m, segments=6,
                                                 samples=4, up_fn=up), 'torso'))
    return objs


# ---------------------------------------------------------------------------
# Chaquetas, chalecos y sacos
# ---------------------------------------------------------------------------

def base_chaqueta(ctx, tipo='tela'):
    m = ctx.m('principal', tipo=tipo)
    rib = ctx.m('punos', tipo='rib')
    D = ctx.D
    objs = []
    t, f = torso(ctx, 'torso chaqueta', m, crecer=0.032, largo=0.03)
    objs.append(t)
    objs.append(ruedo(ctx, f, D['torso']['bottom'] + 0.0, rib, 'ribete chaqueta', grosor=0.034, prof=(1, 1.3)))
    objs += mangas(ctx, D['arm']['wrist_t'] - 0.02, m, puno=rib, holgura=(0.05, 0.04), ancho_puno=0.03)
    c, _ = cuello_redondo(ctx, f, rib, grosor=0.045, escala=1.08)
    objs.append(c)
    nc = D['neck_hole'][0]
    pts = sdf.front_points(f, [(0.0, z) for z in np.linspace(nc[2] - 0.05, D['torso']['bottom'] + 0.02, 6)], lift=0.004)
    if len(pts) >= 3:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('cremallera'), pts, 0.012, (1.0, 0.6), ctx.coll, ctx.m('cremallera', tipo='metal'),
                                         segments=6, samples=4), 'torso'))
    for sx in (-1, 1):
        tapa = clay.rbox(ctx.nombre(f'tapa bolsillo chaqueta {ctx.lado(sx)}'), (0, 0, 0), (0.085, 0.01, 0.028), ctx.coll, m, p=6, n=4, subsurf=1)
        o = estampar(ctx, f, tapa, sx * D['torso']['half'][0] * 0.55, zc(ctx, 0.32), lift=0.008)
        if o is not None:
            objs.append(o)
    return objs, f


@prenda('chaqueta', 'arriba', [V('chaqueta_jean', 'Chaqueta de jean', principal='jean', punos='jean_oscuro', cremallera='#C9CCD2'),
                               V('chaqueta_bomber', 'Chaqueta bomber verde', principal='oliva', punos='naranja', cremallera='#C9CCD2'),
                               V('chaqueta_roja', 'Chaqueta deportiva roja', principal='rojo', punos='blanco', cremallera='#C9CCD2'),
                               V('chaqueta_rosada', 'Chaqueta rosada', principal='rosado', punos='blanco', cremallera='dorado'),
                               V('chaqueta_mostaza', 'Chaqueta mostaza', principal='mostaza', punos='cafe', cremallera='dorado')],
        precio=60)
def chaqueta(ctx):
    return base_chaqueta(ctx)[0]


@prenda('chaqueta_cuero', 'arriba', [V('chaqueta_cuero', 'Chaqueta de cuero negra', principal='#2A2626', punos='#2A2626', cremallera='#C9CCD2'),
                                     V('chaqueta_cuero_cafe', 'Chaqueta de cuero café', principal='#6B4632', punos='#4E3325', cremallera='dorado')],
        precio=75)
def chaqueta_cuero(ctx):
    return base_chaqueta(ctx, tipo='lisa')[0]


def dims_chaleco(ctx):
    """Medidas del chaleco: las de Ella, o calculadas del torso para Él (mismas proporciones)."""
    if 'vest' in ctx.D:
        return ctx.D['vest']
    T = ctx.D['torso']
    nc, nr = ctx.D['neck_hole']
    z0 = T['bottom'] - 0.08
    z1 = nc[2] + 0.1
    fz = lambda t: z0 + (z1 - z0) * t
    return {'c': (0, T['c'][1], T['c'][2] - 0.02), 'half': (T['half'][0] + 0.025, T['half'][1] + 0.025, T['half'][2] + 0.05),
            'r': T['r'] + 0.03, 'taper': 0.55,
            'belly': ((T['belly'][0][0], T['belly'][0][1] - 0.015, T['belly'][0][2] - 0.02), tuple(x + 0.02 for x in T['belly'][1])),
            'armhole': ctx.D['arm']['r'][0] * 1.4,
            'neck': ((0, 0.02, nc[2] + 0.02), (nr[0] + 0.04, nr[1] + 0.04, 0.13)),
            'opening': [(fz(t), w) for t, w in ((0, 0.05), (0.2, 0.05), (0.37, 0.07), (0.57, 0.13), (0.73, 0.19), (1.0, 0.22))],
            'open_y': -0.02, 'bottom': T['bottom'] - 0.04,
            'lapel': [(fz(t), w) for t, w in ((0.81, 0.075), (0.75, 0.08), (0.67, 0.07), (0.58, 0.05), (0.5, 0.03), (0.44, 0.012))],
            'pocket': (0.26, fz(0.17)),
            'bounds': ((-0.9, -0.5, z0 - 0.06), (0.9, 0.5, z1 + 0.04))}


def base_saco(ctx, mangas_si=True, interior='camisa'):
    D = dict(ctx.D)
    D['vest'] = dims_chaleco(ctx)
    m = ctx.m('principal')
    objs = []
    # Camisa de adentro (se ve en el escote)
    t, f = torso(ctx, 'torso camisa interior', ctx.m(interior), crecer=0.004)
    objs.append(t)
    objs += cuerpo.vest(ctx.coll, {'vest': m, 'thread_dark': ctx.m('hilo', tipo='lisa', color='#2B2422')}, ctx.N, D)
    if mangas_si:
        objs += mangas(ctx, D['arm']['wrist_t'] - 0.02, m, puno=m, holgura=(0.05, 0.04), ancho_puno=0.022)
    else:
        objs += mangas(ctx, 0.12, ctx.m(interior), puno=ctx.m(interior), holgura=(0.03, 0.025))
    return objs, f


@prenda('chaleco', 'arriba', [V('chaleco_negro', 'Chaleco negro con camiseta', principal='negro', camisa='blanco'),
                              V('chaleco_jean', 'Chaleco de jean', principal='jean', camisa='blanco'),
                              V('chaleco_cafe', 'Chaleco café', principal='cafe', camisa='crema'),
                              V('chaleco_rosado', 'Chaleco rosado', principal='rosado', camisa='blanco')],
        precio=40)
def chaleco(ctx):
    return base_saco(ctx, mangas_si=False)[0]


def corbata(ctx, f, mat):
    nc = ctx.D['neck_hole'][0]
    zs = np.linspace(nc[2] - 0.08, nc[2] - 0.4, 5)
    pts = sdf.front_points(f, [(0.0, z) for z in zs], lift=0.02)
    objs = []
    if len(pts) >= 3:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('corbata'), pts, lambda t: 0.028 + 0.035 * t, (1.0, 0.3), ctx.coll, mat, segments=8,
                                         samples=5, caps=('flat', 'point'), up_fn=lambda q, f=f: sdf.normal(f, np.array([q]))[0]), 'torso'))
    nudo = clay.blob(ctx.nombre('nudo corbata'), (0, 0, 0), (0.035, 0.02, 0.03), ctx.coll, mat, n=5)
    objs.append(en_superficie(ctx, f, 0.0, nc[2] - 0.06, nudo, lift=0.022))
    return objs


def corbatin(ctx, f, mat):
    nc = ctx.D['neck_hole'][0]
    objs = []
    for sx in (-1, 1):
        ala = clay.blob(ctx.nombre(f'corbatin {ctx.lado(sx)}'), (sx * 0.05, 0, 0), (0.05, 0.016, 0.035), ctx.coll, mat, n=5,
                        shaper=lambda v, sx=sx: v * np.where(v[:, 0:1] * sx < 0, [1, 1, 0.55], [1, 1, 1]))
        objs.append(en_superficie(ctx, f, 0.0, nc[2] - 0.07, ala, lift=0.025))
    nudo = clay.blob(ctx.nombre('nudo corbatin'), (0, 0, 0), (0.022, 0.02, 0.024), ctx.coll, mat, n=5)
    objs.append(en_superficie(ctx, f, 0.0, nc[2] - 0.07, nudo, lift=0.03))
    return objs


@prenda('saco_corbata', 'arriba', [V('saco_negro', 'Saco negro con corbata', principal='negro', camisa='blanco', corbata='rojo'),
                                   V('saco_marino', 'Saco azul con corbata', principal='marino', camisa='blanco', corbata='rosado'),
                                   V('saco_gris', 'Saco gris con corbata', principal='gris', camisa='blanco', corbata='azul'),
                                   V('saco_vino', 'Saco vino con corbata', principal='vino', camisa='blanco', corbata='dorado')],
        precio=80)
def saco_corbata(ctx):
    objs, f = base_saco(ctx)
    return objs + corbata(ctx, f, ctx.m('corbata', tipo='lisa'))


@prenda('saco_corbatin', 'arriba', [V('saco_novio', 'Saco de novio con corbatín', principal='negro', camisa='blanco', corbata='negro'),
                                    V('saco_blanco', 'Saco blanco con corbatín', principal='blanco', camisa='blanco', corbata='negro'),
                                    V('saco_principe', 'Saco rojo de príncipe', principal='rojo', camisa='blanco', corbata='dorado')],
        precio=85)
def saco_corbatin(ctx):
    objs, f = base_saco(ctx)
    return objs + corbatin(ctx, f, ctx.m('corbata', tipo='lisa'))


# ---------------------------------------------------------------------------
# Uniformes
# ---------------------------------------------------------------------------

@prenda('chaqueta_chef', 'arriba', [V('chaqueta_chef', 'Chaqueta de chef', principal='blanco', botones='negro', panuelo='rojo')], precio=55)
def chaqueta_chef(ctx):
    m = ctx.m('principal')
    D = ctx.D
    objs = []
    t, f = torso(ctx, 'torso chef', m, crecer=0.03, largo=0.06)
    objs.append(t)
    objs += mangas(ctx, D['arm']['wrist_t'] - 0.02, m, puno=m, holgura=(0.05, 0.04), ancho_puno=0.03)
    c, _ = cuello_redondo(ctx, f, m, grosor=0.04)
    objs.append(c)
    objs.append(ruedo(ctx, f, D['torso']['bottom'] - 0.05, m, 'ruedo chef', grosor=0.02))
    zs = np.linspace(zc(ctx, 0.78), zc(ctx, 0.2), 4)
    xb = D['torso']['half'][0] * 0.32
    objs += botones(ctx, f, [(x, z) for z in zs for x in (-xb, xb)], ctx.m('botones', tipo='lisa'), r=0.02)
    # Pañuelo al cuello
    nc = D['neck_hole'][0]
    p = clay.blob(ctx.nombre('panuelo chef'), (0, 0, 0), (0.07, 0.02, 0.06), ctx.coll, ctx.m('panuelo'), n=5,
                  shaper=lambda v: v * np.where(v[:, 2:3] < 0, [0.45, 1, 1.2], [1, 1, 1]))
    objs.append(en_superficie(ctx, f, 0.0, nc[2] - 0.06, p, lift=0.03))
    return objs


@prenda('bata_medico', 'arriba', [V('bata_medico', 'Bata de médico', principal='blanco', camisa='cielo', metal='#B9BEC6')], precio=55)
def bata_medico(ctx):
    objs, f = base_saco(ctx, interior='camisa')
    m = ctx.m('principal')
    D = ctx.D
    # Faldón de la bata (más larga que el saco)
    T = D['torso']
    fal = sdf.round_cone((0, T['c'][1], T['bottom'] + 0.02), (0, T['c'][1], T['bottom'] - 0.2), T['half'][0] + 0.08, T['half'][0] + 0.12)
    corte = lambda P: np.maximum(np.abs(P[:, 0]) - 0.03, P[:, 1] - T['c'][1] + 0.05)

    def faldon(P):
        dd = fal(P)
        dd = sdf.smax(dd, -corte(P), 0.01)
        dd = sdf.smax(dd, (T['bottom'] - 0.2) - P[:, 2], 0.01)
        return dd
    R = T['half'][0] + 0.2
    objs.append(ctx.pieza(sdf.to_mesh(ctx.nombre('faldon bata'), faldon, (-R, -R, T['bottom'] - 0.25), (R, R, T['bottom'] + 0.08), VX, ctx.coll, m,
                                      smooth=2), 'pelvis'))
    # Fonendoscopio
    met = ctx.m('metal', tipo='metal')
    nc = D['neck_hole'][0]
    pts = sdf.front_points(f, [(-0.14, nc[2] - 0.02), (-0.12, nc[2] - 0.2), (-0.05, nc[2] - 0.33), (0.02, nc[2] - 0.36)], lift=0.05)
    if len(pts) >= 3:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('fonendo'), pts, 0.012, (1, 1), ctx.coll, ctx.m('negro', tipo='lisa', color='#2B2422'),
                                         segments=6, samples=4), 'torso'))
        d = clay.blob(ctx.nombre('fonendo disco'), tuple(pts[-1] + np.array([0.03, -0.01, 0])), (0.035, 0.015, 0.035), ctx.coll, met, n=5)
        objs.append(ctx.pieza(d, 'torso'))
    return objs


# ---------------------------------------------------------------------------
# Blusa (Ella)
# ---------------------------------------------------------------------------

@prenda('blusa', 'arriba', [V('blusa_blanca', 'Blusa de boleros blanca', principal='blanco', lazo='rosado'),
                            V('blusa_rosada', 'Blusa de boleros rosada', principal='rosa_palo', lazo='rojo'),
                            V('blusa_amarilla', 'Blusa de boleros amarilla', principal='amarillo', lazo='blanco'),
                            V('blusa_lila', 'Blusa de boleros lila', principal='lila', lazo='morado'),
                            V('blusa_menta', 'Blusa de boleros verde menta', principal='menta', lazo='blanco')],
        para=('ella',), precio=45)
def blusa(ctx):
    m = ctx.m('principal')
    D = ctx.D
    objs = []
    t, f = torso(ctx, 'torso blusa', m, crecer=0.014, cuello=1.1)
    objs.append(t)
    A = D['arm']
    # Mangas abullonadas
    for sx in (-1, 1):
        s = np.array([sx, 1, 1])
        d = cuerpo._dir(D['arm_deg'], A.get('dy', 0.08)) * s
        c = np.array(D['joint']) * s + d * 0.06
        b = clay.blob(ctx.nombre(f'manga bombacha {ctx.lado(sx)}'), tuple(c), (0.165, 0.16, 0.15), ctx.coll, m, n=8)
        objs.append(ctx.pieza(b, ctx.hueso_lado('brazo', sx)))
        ring = sdf.ring_points(sdf.ellipsoid(c, (0.165, 0.16, 0.15)), c + d * 0.1, d, 0.4, 24)
        if len(ring) > 8:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'puño bombacha {ctx.lado(sx)}'), ring, 0.018, (1, 1), ctx.coll, m, segments=6, samples=3,
                                             closed=True), ctx.hueso_lado('brazo', sx)))
    # Cuello de boleros (ondas)
    nc = np.array(D['neck_hole'][0])
    cr = np.array(D.get('collar_r', (0.175, 0.145))) * 1.1
    ring = []
    for k in range(48):
        a = 2 * math.pi * k / 48
        o = np.array([[nc[0] + math.cos(a) * (cr[0] + 0.03), nc[1] + math.sin(a) * (cr[1] + 0.03), 1.7]])
        q, hit = sdf.trace(f, o, (0, 0, -1), max_dist=1.2)
        if hit[0]:
            ring.append(q[0] + np.array([0, 0, 0.012 + 0.012 * math.sin(a * 8)]))
    if len(ring) > 12:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('bolero cuello'), ring, 0.03, (1.4, 0.45), ctx.coll, m, segments=8, samples=3, closed=True),
                              'torso'))
    lazo = ctx.m('lazo', tipo='lisa')
    for sx in (-1, 1):
        o = clay.blob(ctx.nombre(f'lazo blusa {ctx.lado(sx)}'), (sx * 0.04, 0, 0), (0.045, 0.014, 0.03), ctx.coll, lazo, n=5)
        objs.append(en_superficie(ctx, f, 0.0, nc[2] - 0.06, o, lift=0.02))
    objs.append(en_superficie(ctx, f, 0.0, nc[2] - 0.06, clay.blob(ctx.nombre('nudo lazo blusa'), (0, 0, 0), (0.018, 0.016, 0.02), ctx.coll, lazo,
                                                                    n=4), lift=0.026))
    objs.append(ruedo(ctx, f, D['torso']['bottom'] + 0.02, m, 'ruedo blusa', grosor=0.02))
    return objs
