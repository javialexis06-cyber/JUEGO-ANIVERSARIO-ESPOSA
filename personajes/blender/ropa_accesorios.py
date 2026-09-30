"""Accesorios: sombreros y gorros, orejas y diademas (cabeza); gafas, antifaz y bigotes (cara);
capas, alas y mochila (espalda) y colas."""
import math

import numpy as np

import clay
import sdf
from clay import sph
from ropa import corazon, domo, estrella, flor, prenda, punto_cabeza, radio_cabeza
from ropa_arriba import V

COP = ('copete',)


def tope(ctx):
    """Punto más alto de la cabeza con el pelo (sin copete)."""
    return ctx.hc + np.array([0, 0, radio_cabeza(ctx, 0, 89)])


def lathe(ctx, parte, perfil, mat, centro, seg=40, tapa_abajo=True, tapa_arriba=True, rot=(0, 0, 0)):
    o = clay.lathe(ctx.nombre(parte), perfil, ctx.coll, mat, segments=seg, cap_bottom=tapa_abajo, cap_top=tapa_arriba)
    o.location = tuple(centro)
    o.rotation_euler = rot
    return ctx.pieza(o, 'cabeza')


def diadema(ctx, mat, lift=0.03, az=95, grosor=0.03):
    """Diadema que pasa por encima de la cabeza de oreja a oreja."""
    pts = []
    for e in np.linspace(5, 175, 11):
        a = az if e <= 90 else -az
        ee = e if e <= 90 else 180 - e
        loc, nrm = punto_cabeza(ctx, a if e != 90 else 0, ee, lift)
        if loc is not None:
            pts.append(loc)
    pts.sort(key=lambda p: p[0])
    o = clay.sweep(ctx.nombre('diadema'), pts, grosor, (1.4, 0.6), ctx.coll, mat, segments=8, samples=4,
                   up_fn=lambda q: np.array(q) - ctx.hc)
    return ctx.pieza(o, 'cabeza')


def pompon(ctx, parte, c, r, mat):
    return ctx.pieza(clay.blob(ctx.nombre(parte), tuple(c), (r, r, r), ctx.coll, mat, n=7), 'cabeza')


# ---------------------------------------------------------------------------
# Gorras y gorros
# ---------------------------------------------------------------------------

@prenda('gorra', 'cabeza', [V('gorra_azul', 'Gorra azul', principal='azul', visera='marino'),
                            V('gorra_roja', 'Gorra roja', principal='rojo', visera='vino'),
                            V('gorra_negra', 'Gorra negra', principal='negro', visera='grafito'),
                            V('gorra_rosada', 'Gorra rosada', principal='rosado', visera='blanco'),
                            V('gorra_blanca', 'Gorra blanca', principal='blanco', visera='azul'),
                            V('gorra_verde', 'Gorra verde', principal='verde', visera='oliva')],
        oculta=COP, precio=25)
def gorra(ctx):
    copa, R, els, azs = domo(ctx, 'gorra copa', ctx.m('principal'), el_min=26 if ctx.el else 32, margen=0.03)
    hc = ctx.hc
    e0 = els[0]
    j0 = int(np.argmin(np.abs(azs)))
    r0 = R[0, j0] + 0.03
    frente = hc + np.array(sph(0, e0)) * r0
    ancho = 0.5 * min(r0 * math.cos(math.radians(e0)) * 1.05, 0.75)
    vis = clay.blob(ctx.nombre('gorra visera'), (0, 0, 0), (ancho * 1.9, 0.3, 0.018), ctx.coll, ctx.m('visera'), n=10, p=2.2,
                    shaper=lambda v: np.column_stack([v[:, 0], np.minimum(v[:, 1], 0.0), v[:, 2]]))
    vis.location = tuple(frente + np.array([0, 0.06, -0.005]))
    vis.rotation_euler = (math.radians(16), 0, 0)
    ctx.pieza(vis, 'cabeza')
    pompon(ctx, 'gorra boton', hc + np.array([0, 0, R[-1].mean() + 0.05]), 0.03, ctx.m('visera'))


@prenda('boina', 'cabeza', [V('boina_roja', 'Boina roja', principal='rojo'), V('boina_negra', 'Boina negra', principal='negro'),
                            V('boina_rosada', 'Boina rosada', principal='rosado'), V('boina_mostaza', 'Boina mostaza', principal='mostaza')],
        oculta=COP, precio=25)
def boina(ctx):
    m = ctx.m('principal')
    copa, R, els, azs = domo(ctx, 'boina', m, el_min=40, margen=0.05, ancho=1.06, frente=0.02)
    # Plato de la boina: un disco blando más ancho que la copa, ladeado hacia un lado
    hc = ctx.hc
    r = float(np.mean(R[0])) * math.cos(math.radians(els[0])) + 0.1
    z = float(np.mean(R[-1])) + 0.02
    o = clay.blob(ctx.nombre('boina plato'), (0, 0, 0), (r * 1.08, r, 0.085), ctx.coll, m, n=7)
    o.rotation_euler = (math.radians(4), math.radians(-9), 0)
    o.location = tuple(hc + np.array([0.05, 0.03, z - 0.05]))
    ctx.pieza(o, 'cabeza')
    pompon(ctx, 'boina rabito', hc + np.array([0.06, 0.03, z + 0.04]), 0.028, m)


@prenda('gorro_lana', 'cabeza', [V('gorro_lana_rojo', 'Gorro de lana rojo', principal='rojo', pompon='blanco'),
                                 V('gorro_lana_gris', 'Gorro de lana gris', principal='gris', pompon='rosado'),
                                 V('gorro_lana_amarillo', 'Gorro de lana amarillo', principal='amarillo', pompon='blanco'),
                                 V('gorro_lana_verde', 'Gorro de lana verde', principal='verde', pompon='blanco'),
                                 V('gorro_lana_azul', 'Gorro de lana azul', principal='azul', pompon='blanco')],
        oculta=COP, precio=30)
def gorro_lana(ctx):
    m = ctx.m('principal', tipo='rib')
    copa, R, els, azs = domo(ctx, 'gorro lana', m, el_min=16 if ctx.el else 22, margen=0.035, alto_extra=0.05)
    hc = ctx.hc
    e0 = els[0]
    ring = [hc + np.array(sph(a, e0)) * (R[0, j] + 0.05) for j, a in enumerate(azs)]
    ctx.pieza(clay.sweep(ctx.nombre('doblez gorro'), ring, 0.06, (1.2, 0.8), ctx.coll, m, segments=8, samples=3, closed=True,
                         up_fn=lambda q: np.array(q) - hc), 'cabeza')
    pompon(ctx, 'pompon gorro', hc + np.array([0, 0, R[-1].mean() + 0.12]), 0.1, ctx.m('pompon', tipo='peluche'))


@prenda('gorro_navidad', 'cabeza', [V('gorro_navidad', 'Gorro de Navidad', principal='rojo', pompon='blanco'),
                                    V('gorro_navidad_verde', 'Gorro de duende', principal='verde', pompon='blanco')],
        oculta=COP, precio=30)
def gorro_navidad(ctx):
    m = ctx.m('principal', tipo='peluche')
    copa, R, els, azs = domo(ctx, 'gorro navidad', m, el_min=20 if ctx.el else 26, margen=0.04)
    hc = ctx.hc
    top = hc + np.array([0, 0.02, R[-1].mean() + 0.02])
    pts = [top + np.array([0, 0, -0.05]), top + np.array([0.05, 0.05, 0.2]), top + np.array([0.28, 0.12, 0.26]), top + np.array([0.45, 0.14, 0.1])]
    ctx.pieza(clay.sweep(ctx.nombre('punta gorro navidad'), pts, [0.4, 0.26, 0.12, 0.04], (1, 1), ctx.coll, m, segments=12, samples=6, up=(0, -1, 0)),
              'cabeza')
    blanco = ctx.m('pompon', tipo='peluche')
    e0 = els[0]
    ring = [hc + np.array(sph(a, e0)) * (R[0, j] + 0.06) for j, a in enumerate(azs)]
    ctx.pieza(clay.sweep(ctx.nombre('borde gorro navidad'), ring, 0.08, (1.1, 1), ctx.coll, blanco, segments=8, samples=3, closed=True), 'cabeza')
    pompon(ctx, 'pompon navidad', pts[-1] + np.array([0.02, 0, -0.04]), 0.09, blanco)


@prenda('gorro_chef', 'cabeza', [V('gorro_chef', 'Gorro de chef', principal='blanco')], oculta=COP, precio=30)
def gorro_chef(ctx):
    m = ctx.m('principal')
    copa, R, els, azs = domo(ctx, 'banda chef', m, el_min=26 if ctx.el else 32, margen=0.03)
    hc = ctx.hc
    base = hc + np.array([0, 0.02, R[-1].mean() - 0.02])
    rng = np.random.default_rng(2)
    for k in range(9):
        a = 2 * math.pi * k / 9
        c = base + np.array([math.cos(a) * 0.26, math.sin(a) * 0.22, 0.32 + rng.uniform(0, 0.06)])
        ctx.pieza(clay.blob(ctx.nombre(f'nube chef {k}'), tuple(c), (0.22, 0.2, 0.2), ctx.coll, m, n=7), 'cabeza')
    ctx.pieza(clay.blob(ctx.nombre('centro chef'), tuple(base + np.array([0, 0, 0.36])), (0.3, 0.26, 0.26), ctx.coll, m, n=8), 'cabeza')
    lathe(ctx, 'cuerpo chef', [(0.0, 0.0), (0.5, 0.0), (0.48, 0.3), (0.0, 0.3)], m, base + np.array([0, 0, -0.02]), tapa_abajo=False)


@prenda('gorro_fiesta', 'cabeza', [V('gorro_fiesta', 'Gorro de fiesta', principal='rosado', rayas='amarillo', pompon='cielo'),
                                   V('gorro_fiesta_azul', 'Gorro de fiesta azul', principal='azul', rayas='blanco', pompon='rojo'),
                                   V('gorro_fiesta_verde', 'Gorro de fiesta verde', principal='menta', rayas='rosado', pompon='amarillo')],
        precio=20, oculta=COP)
def gorro_fiesta(ctx):
    t = tope(ctx)
    c = t + np.array([0.12, 0.02, -0.08])
    rot = (0, math.radians(14), 0)
    lathe(ctx, 'cono fiesta', [(0.0, 0.0), (0.3, 0.0), (0.02, 0.6), (0.0, 0.6)], ctx.m('principal', tipo='lisa'), c, rot=rot)
    for k, z in enumerate((0.1, 0.24, 0.38)):
        r = 0.3 * (1 - z / 0.6) + 0.004
        lathe(ctx, f'raya fiesta {k}', [(r + 0.004, z - 0.025), (r + 0.008, z), (r - 0.004, z + 0.035)], ctx.m('rayas', tipo='lisa'), c, rot=rot,
              tapa_abajo=False, tapa_arriba=False)
    tip = c + np.array([math.sin(math.radians(14)) * 0.6, 0, math.cos(math.radians(14)) * 0.6])
    pompon(ctx, 'pompon fiesta', tip, 0.07, ctx.m('pompon', tipo='peluche'))


# ---------------------------------------------------------------------------
# Sombreros
# ---------------------------------------------------------------------------

def ala_y_copa(ctx, m_ala, m_copa, r_ala=0.95, alto=0.3, r_copa=0.58, grosor=0.03, caida=0.0, deformar=None, copa_perfil=None, subir=0.0):
    """Sombrero de ala: el ala se apoya donde la cabeza mide r_copa de ancho y la copa sube desde ahí."""
    hc = ctx.hc
    # Altura donde se apoya: el ancho de la cabeza (con pelo) iguala al de la copa
    z0 = None
    for e in np.linspace(10, 80, 36):
        r = radio_cabeza(ctx, 90, e)
        if r * math.cos(math.radians(e)) <= r_copa * 0.98:
            z0 = hc[2] + r * math.sin(math.radians(e))
            break
    z0 = (z0 or hc[2] + 0.4) + subir
    c = np.array([0, 0.02, z0])
    perfil_ala = [(r_copa * 0.95, grosor), (r_ala, grosor * 0.4 - caida), (r_ala + 0.01, -caida), (r_copa * 0.95, 0.0)]
    ala = lathe(ctx, 'ala sombrero', perfil_ala, m_ala, c, seg=48, tapa_abajo=False, tapa_arriba=False)
    if deformar:
        for v in ala.data.vertices:
            v.co = deformar(v.co)
    perfil = copa_perfil or [(0.0, alto), (r_copa * 0.9, alto), (r_copa, alto * 0.7), (r_copa, 0.0)]
    copa = lathe(ctx, 'copa sombrero', perfil, m_copa, c, seg=40, tapa_abajo=False)
    return c, ala, copa


@prenda('sombrero_vueltiao', 'cabeza', [V('sombrero_vueltiao', 'Sombrero vueltiao', principal='#EFE3C6', rayas='#1E1D1D')], oculta=COP, precio=45)
def sombrero_vueltiao(ctx):
    m, rayas = ctx.m('principal', tipo='rib'), ctx.m('rayas', tipo='lisa')
    c, ala, copa = ala_y_copa(ctx, m, m, r_ala=1.0, alto=0.32, r_copa=0.56, grosor=0.035)
    for k, r in enumerate(np.linspace(0.62, 0.95, 6)):
        lathe(ctx, f'franja ala {k}', [(r, 0.036), (r + 0.025, 0.034), (r + 0.025, 0.037), (r, 0.039)], rayas, c, seg=48, tapa_abajo=False,
              tapa_arriba=False)
    for k, z in enumerate((0.07, 0.15, 0.23)):
        lathe(ctx, f'franja copa {k}', [(0.565, z), (0.57, z + 0.025), (0.565, z + 0.04)], rayas, c, tapa_abajo=False, tapa_arriba=False)


@prenda('sombrero_paja', 'cabeza', [V('sombrero_paja', 'Sombrero de paja con cinta rosada', principal='#E8C98A', cinta='rosado', flor='rojo'),
                                    V('sombrero_paja_azul', 'Sombrero de paja con cinta azul', principal='#E8C98A', cinta='azul', flor='blanco'),
                                    V('sombrero_paja_blanco', 'Sombrero blanco de playa', principal='blanco', cinta='negro', flor='rosado')],
        oculta=COP, precio=35)
def sombrero_paja(ctx):
    m = ctx.m('principal', tipo='rib')
    c, ala, copa = ala_y_copa(ctx, m, m, r_ala=1.02, alto=0.26, r_copa=0.56, caida=0.1)
    lathe(ctx, 'cinta sombrero', [(0.565, 0.02), (0.575, 0.05), (0.565, 0.09)], ctx.m('cinta', tipo='lisa'), c, tapa_abajo=False, tapa_arriba=False)
    fl = flor(ctx, 'flor sombrero', 0.08, ctx.m('flor', tipo='lisa'), ctx.m('centro flor', tipo='lisa', color='#F7C948'))
    fl.location = tuple(c + np.array([0.45, -0.3, 0.07]))
    fl.rotation_euler = (0, 0, math.radians(35))
    ctx.pieza(fl, 'cabeza')


@prenda('sombrero_vaquero', 'cabeza', [V('sombrero_vaquero', 'Sombrero vaquero', principal='#8A5A3C', cinta='#3A2A20'),
                                       V('sombrero_vaquero_negro', 'Sombrero vaquero negro', principal='negro', cinta='dorado'),
                                       V('sombrero_vaquero_blanco', 'Sombrero vaquero blanco', principal='blanco', cinta='cafe'),
                                       V('sombrero_vaquero_rosado', 'Sombrero vaquero rosado', principal='rosado', cinta='blanco')],
        oculta=COP, precio=40)
def sombrero_vaquero(ctx):
    m = ctx.m('principal')

    def curvar(co):
        from mathutils import Vector
        return Vector((co.x, co.y, co.z + 0.35 * max(0.0, abs(co.x) - 0.45) ** 1.5))
    perfil = [(0.0, 0.34), (0.2, 0.3), (0.22, 0.36), (0.5, 0.32), (0.56, 0.2), (0.56, 0.0)]
    c, ala, copa = ala_y_copa(ctx, m, m, r_ala=0.98, r_copa=0.56, grosor=0.03, deformar=curvar, copa_perfil=perfil)
    lathe(ctx, 'cinta vaquero', [(0.565, 0.02), (0.575, 0.05), (0.565, 0.08)], ctx.m('cinta', tipo='lisa'), c, tapa_abajo=False, tapa_arriba=False)


@prenda('sombrero_bruja', 'cabeza', [V('sombrero_bruja', 'Sombrero de bruja', principal='morado', cinta='verde', hebilla='dorado'),
                                     V('sombrero_bruja_negro', 'Sombrero de brujo negro', principal='negro', cinta='naranja', hebilla='dorado')],
        oculta=COP, precio=40)
def sombrero_bruja(ctx):
    m = ctx.m('principal')
    c, ala, copa = ala_y_copa(ctx, m, m, r_ala=0.98, alto=0.1, r_copa=0.55)
    pts = [c + np.array([0, 0, 0.05]), c + np.array([0, 0.02, 0.35]), c + np.array([0.06, 0.06, 0.62]), c + np.array([0.22, 0.14, 0.78])]
    ctx.pieza(clay.sweep(ctx.nombre('punta bruja'), pts, [0.55, 0.3, 0.13, 0.03], (1, 1), ctx.coll, m, segments=14, samples=6, up=(0, -1, 0)), 'cabeza')
    lathe(ctx, 'cinta bruja', [(0.53, 0.02), (0.545, 0.06), (0.52, 0.11)], ctx.m('cinta', tipo='lisa'), c, tapa_abajo=False, tapa_arriba=False)
    h = clay.rbox(ctx.nombre('hebilla bruja'), tuple(c + np.array([0, -0.55, 0.065])), (0.06, 0.012, 0.045), ctx.coll, ctx.m('hebilla', tipo='metal'),
                  p=6, n=4, subsurf=1)
    ctx.pieza(h, 'cabeza')


@prenda('sombrero_pirata', 'cabeza', [V('sombrero_pirata', 'Sombrero de pirata', principal='negro', borde='dorado', calavera='blanco')],
        oculta=COP, precio=45)
def sombrero_pirata(ctx):
    m = ctx.m('principal')

    def tricornio(co):
        from mathutils import Vector
        a = math.atan2(co.y, co.x)
        r = math.hypot(co.x, co.y)
        sube = max(0.0, r - 0.55) * (0.9 + 0.9 * math.cos(3 * (a + math.pi / 2)))
        return Vector((co.x, co.y, co.z + sube))
    c, ala, copa = ala_y_copa(ctx, m, m, r_ala=0.92, alto=0.3, r_copa=0.55, deformar=tricornio)
    borde = lathe(ctx, 'borde pirata', [(0.9, 0.02), (0.93, 0.04), (0.9, 0.06)], ctx.m('borde', tipo='metal'), c, seg=48, tapa_abajo=False,
                  tapa_arriba=False)
    for v in borde.data.vertices:
        v.co = tricornio(v.co)
    cal = ctx.m('calavera', tipo='lisa')
    ctx.pieza(clay.blob(ctx.nombre('calavera'), tuple(c + np.array([0, -0.56, 0.2])), (0.07, 0.03, 0.065), ctx.coll, cal, n=5), 'cabeza')
    for sx in (-1, 1):
        ctx.pieza(clay.blob(ctx.nombre(f'ojo calavera {sx}'), tuple(c + np.array([sx * 0.025, -0.59, 0.21])), (0.016, 0.01, 0.018), ctx.coll, m, n=4),
                  'cabeza')
        ctx.pieza(clay.sweep(ctx.nombre(f'hueso calavera {sx}'), [c + np.array([-0.09, -0.57, 0.13 + 0.06 * (sx > 0)]),
                                                                   c + np.array([0.09, -0.57, 0.19 - 0.06 * (sx > 0)])],
                             0.014, (1, 1), ctx.coll, cal, segments=6, samples=2), 'cabeza')


@prenda('sombrero_copa', 'cabeza', [V('sombrero_copa', 'Sombrero de copa', principal='negro', cinta='rojo'),
                                    V('sombrero_copa_blanco', 'Sombrero de copa blanco', principal='blanco', cinta='negro')],
        oculta=COP, precio=45)
def sombrero_copa(ctx):
    m = ctx.m('principal', tipo='brillo')
    perfil = [(0.0, 0.5), (0.44, 0.5), (0.46, 0.48), (0.42, 0.1), (0.44, 0.0)]
    c, ala, copa = ala_y_copa(ctx, m, m, r_ala=0.68, r_copa=0.45, copa_perfil=perfil, subir=-0.02)
    lathe(ctx, 'cinta copa', [(0.43, 0.04), (0.445, 0.08), (0.43, 0.13)], ctx.m('cinta', tipo='lisa'), c, tapa_abajo=False, tapa_arriba=False)


# ---------------------------------------------------------------------------
# Coronas, diademas y orejas
# ---------------------------------------------------------------------------

@prenda('corona', 'cabeza', [V('corona', 'Corona de rey', principal='dorado', gemas='rojo'),
                             V('corona_plata', 'Corona de plata', principal='#C9CCD2', gemas='azul')],
        oculta=COP, precio=60)
def corona(ctx):
    t = tope(ctx)
    c = t + np.array([0, 0.02, -0.14])
    m = ctx.m('principal', tipo='metal')
    lathe(ctx, 'aro corona', [(0.4, 0.0), (0.42, 0.0), (0.42, 0.1), (0.4, 0.1)], m, c, tapa_abajo=False, tapa_arriba=False)
    gem = ctx.m('gemas', tipo='brillo')
    for k in range(6):
        a = 2 * math.pi * k / 6 + math.pi / 2
        base = c + np.array([math.cos(a) * 0.41, math.sin(a) * 0.41, 0.08])
        ctx.pieza(clay.sweep(ctx.nombre(f'pico corona {k}'), [base, base + np.array([0, 0, 0.14])], 0.06, (1, 0.35), ctx.coll, m, segments=6, samples=2,
                             caps=('flat', 'point'), up=(math.cos(a), math.sin(a), 0)), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'bola corona {k}'), tuple(base + np.array([0, 0, 0.16])), (0.03, 0.03, 0.03), ctx.coll, m, n=4), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'gema corona {k}'), tuple(c + np.array([math.cos(a) * 0.43, math.sin(a) * 0.43, 0.05])), (0.03, 0.03, 0.03),
                            ctx.coll, gem, n=4), 'cabeza')


@prenda('tiara', 'cabeza', [V('tiara', 'Tiara de princesa', principal='#D7DBE2', gemas='rosado'),
                            V('tiara_dorada', 'Tiara dorada', principal='dorado', gemas='cielo')],
        precio=50, oculta=COP)
def tiara(ctx):
    m = ctx.m('principal', tipo='metal')
    gem = ctx.m('gemas', tipo='brillo')
    pts = []
    for az in np.linspace(-70, 70, 9):
        loc, n = punto_cabeza(ctx, az, 58, 0.02)
        if loc is not None:
            pts.append(loc)
    ctx.pieza(clay.sweep(ctx.nombre('aro tiara'), pts, 0.018, (1, 1), ctx.coll, m, segments=6, samples=4), 'cabeza')
    for k, az in enumerate((-40, -20, 0, 20, 40)):
        loc, n = punto_cabeza(ctx, az, 58, 0.02)
        if loc is None:
            continue
        alto = 0.16 if az == 0 else 0.1
        tip = loc + np.array(n) * 0.03 + np.array([0, 0, alto])
        ctx.pieza(clay.sweep(ctx.nombre(f'pico tiara {k}'), [loc, tip], 0.04, (1, 0.3), ctx.coll, m, segments=6, samples=2, caps=('flat', 'point'),
                             up=tuple(n)), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'gema tiara {k}'), tuple(loc + np.array([0, -0.01, alto * 0.45])), (0.028, 0.02, 0.032), ctx.coll, gem, n=4),
                  'cabeza')


@prenda('diadema_mono', 'cabeza', [V('diadema_mono_roja', 'Diadema con moño rojo', principal='rojo'),
                                   V('diadema_mono_rosada', 'Diadema con moño rosado', principal='rosado'),
                                   V('diadema_mono_negra', 'Diadema con moño negro', principal='negro'),
                                   V('diadema_mono_blanca', 'Diadema con moño blanco', principal='blanco'),
                                   V('diadema_mono_amarilla', 'Diadema con moño amarillo', principal='amarillo')],
        precio=20, oculta=COP)
def diadema_mono(ctx):
    m = ctx.m('principal', tipo='lisa')
    diadema(ctx, m)
    loc, n = punto_cabeza(ctx, 45, 62, 0.06)
    for j in (-1, 1):
        ctx.pieza(clay.blob(ctx.nombre(f'ala moño {j}'), tuple(loc + np.array([j * 0.11, 0, 0.02])), (0.12, 0.05, 0.08), ctx.coll, m, n=6,
                            shaper=lambda v, j=j: v * np.where(v[:, 0:1] * j < 0, [1, 1, 0.55], [1, 1, 1])), 'cabeza')
    ctx.pieza(clay.blob(ctx.nombre('nudo moño'), tuple(loc + np.array([0, -0.01, 0.02])), (0.045, 0.045, 0.045), ctx.coll, m, n=5), 'cabeza')


def orejas(ctx, forma, m1, m2, az=48, el=62, alto=0.24):
    """Diadema con orejas: gato (triángulo), conejo (largas) u oso (redondas)."""
    diadema(ctx, m1)
    for sx in (-1, 1):
        loc, n = punto_cabeza(ctx, sx * az, el, 0.02)
        if loc is None:
            continue
        n = np.array(n)
        if forma == 'gato':
            o = clay.blob(ctx.nombre(f'oreja gato {sx}'), (0, 0, 0), (0.15, 0.05, 0.16), ctx.coll, m1, n=6,
                          shaper=lambda v: v * np.column_stack([1 - 0.75 * np.clip(v[:, 2] / 0.16, 0, 1), np.ones(len(v)), np.ones(len(v))]))
            o2 = clay.blob(ctx.nombre(f'oreja gato dentro {sx}'), (0, -0.035, -0.02), (0.08, 0.02, 0.1), ctx.coll, m2, n=5,
                           shaper=lambda v: v * np.column_stack([1 - 0.7 * np.clip(v[:, 2] / 0.1, 0, 1), np.ones(len(v)), np.ones(len(v))]))
            for q in (o, o2):
                q.location = tuple(loc + n * 0.1)
                q.rotation_euler = (math.radians(-8), math.radians(-sx * 18), 0)
                ctx.pieza(q, 'cabeza')
        elif forma == 'conejo':
            base = loc
            pts = [base, base + n * 0.12 + np.array([sx * 0.03, 0.02, 0.12]), base + n * 0.2 + np.array([sx * 0.07, 0.05, 0.34])]
            ctx.pieza(clay.sweep(ctx.nombre(f'oreja conejo {sx}'), pts, [0.06, 0.09, 0.05], (0.45, 1.0), ctx.coll, m1, segments=10, samples=5,
                                 up=(0, -1, 0)), 'cabeza')
            pts2 = [p + np.array([0, -0.025, 0.01]) for p in pts]
            ctx.pieza(clay.sweep(ctx.nombre(f'oreja conejo dentro {sx}'), pts2, [0.03, 0.05, 0.025], (0.25, 1.0), ctx.coll, m2, segments=8, samples=5,
                                 up=(0, -1, 0)), 'cabeza')
        else:
            c = loc + n * 0.08
            ctx.pieza(clay.blob(ctx.nombre(f'oreja oso {sx}'), tuple(c), (0.11, 0.05, 0.11), ctx.coll, m1, n=6), 'cabeza')
            ctx.pieza(clay.blob(ctx.nombre(f'oreja oso dentro {sx}'), tuple(c + np.array([0, -0.035, -0.005])), (0.065, 0.02, 0.065), ctx.coll, m2, n=5),
                      'cabeza')


@prenda('orejas_gato', 'cabeza', [V('orejas_gato', 'Orejitas de gato negras', principal='negro', dentro='rosado'),
                                  V('orejas_gato_blancas', 'Orejitas de gato blancas', principal='blanco', dentro='rosado'),
                                  V('orejas_gato_grises', 'Orejitas de gato grises', principal='gris', dentro='rosado'),
                                  V('orejas_gato_naranja', 'Orejitas de gato naranja', principal='naranja', dentro='crema')],
        precio=25, oculta=COP)
def orejas_gato(ctx):
    orejas(ctx, 'gato', ctx.m('principal', tipo='peluche'), ctx.m('dentro', tipo='peluche'))


@prenda('orejas_conejo', 'cabeza', [V('orejas_conejo', 'Orejas de conejo', principal='blanco', dentro='rosado'),
                                    V('orejas_conejo_rosa', 'Orejas de conejo rosadas', principal='rosado', dentro='blanco'),
                                    V('orejas_conejo_cafe', 'Orejas de conejo café', principal='cafe', dentro='beige')],
        precio=25, oculta=COP)
def orejas_conejo(ctx):
    orejas(ctx, 'conejo', ctx.m('principal', tipo='peluche'), ctx.m('dentro', tipo='peluche'), az=30, el=70)


@prenda('orejas_oso', 'cabeza', [V('orejas_oso', 'Orejitas de osito', principal='#B07A52', dentro='#F1D6B3'),
                                 V('orejas_panda', 'Orejitas de panda', principal='#2B2422', dentro='gris'),
                                 V('orejas_oso_rosa', 'Orejitas de osita rosada', principal='rosado', dentro='blanco')],
        precio=25, oculta=COP)
def orejas_oso(ctx):
    orejas(ctx, 'oso', ctx.m('principal', tipo='peluche'), ctx.m('dentro', tipo='peluche'), az=55, el=55)


@prenda('cuernos', 'cabeza', [V('cuernos', 'Cuernitos de diablito', principal='rojo'), V('cuernos_negros', 'Cuernitos negros', principal='negro'),
                              V('cuernos_dorados', 'Cuernitos dorados', principal='dorado')],
        precio=25, oculta=COP)
def cuernos(ctx):
    m = ctx.m('principal', tipo='brillo')
    for sx in (-1, 1):
        loc, n = punto_cabeza(ctx, sx * 40, 68, 0.0)
        if loc is None:
            continue
        n = np.array(n)
        pts = [loc - n * 0.02, loc + n * 0.1 + np.array([sx * 0.04, 0, 0.02]), loc + n * 0.16 + np.array([sx * 0.1, 0, 0.1])]
        ctx.pieza(clay.sweep(ctx.nombre(f'cuerno {sx}'), pts, [0.085, 0.055, 0.012], (1, 1), ctx.coll, m, segments=10, samples=5,
                             caps=('round', 'point'), up=(0, -1, 0)), 'cabeza')


@prenda('aureola', 'cabeza', [V('aureola', 'Aureola de angelito', principal='#FFD46B')], precio=35)
def aureola(ctx):
    t = tope(ctx)
    c = t + np.array([0, 0.05, 0.22])
    ring = [c + np.array([math.cos(a) * 0.36, math.sin(a) * 0.3, 0]) for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)]
    ctx.pieza(clay.sweep(ctx.nombre('aureola'), ring, 0.04, (1, 1), ctx.coll, ctx.m('principal', tipo='luz'), segments=10, samples=3, closed=True),
              'cabeza')


@prenda('antenas_abeja', 'cabeza', [V('antenas_abeja', 'Antenas de abejita', principal='negro', pompon='amarillo')], precio=20, oculta=COP)
def antenas_abeja(ctx):
    m = ctx.m('principal', tipo='lisa')
    diadema(ctx, m)
    for sx in (-1, 1):
        loc, n = punto_cabeza(ctx, sx * 30, 70, 0.03)
        if loc is None:
            continue
        pts = [loc, loc + np.array([sx * 0.04, -0.02, 0.18]), loc + np.array([sx * 0.14, -0.06, 0.3])]
        ctx.pieza(clay.sweep(ctx.nombre(f'antena {sx}'), pts, 0.018, (1, 1), ctx.coll, m, segments=6, samples=5, up=(0, -1, 0)), 'cabeza')
        pompon(ctx, f'bolita antena {sx}', pts[-1], 0.06, ctx.m('pompon', tipo='peluche'))


@prenda('flor_pelo', 'cabeza', [V('flor_pelo_roja', 'Flor roja para el pelo', petalos='rojo', centro='amarillo'),
                                V('flor_pelo_rosada', 'Flor rosada para el pelo', petalos='rosado', centro='amarillo'),
                                V('flor_pelo_amarilla', 'Flor amarilla para el pelo', petalos='amarillo', centro='naranja'),
                                V('flor_pelo_blanca', 'Flor blanca para el pelo', petalos='blanco', centro='amarillo')],
        precio=15, oculta=COP)
def flor_pelo(ctx):
    fl = flor(ctx, 'flor pelo', 0.2, ctx.m('petalos', tipo='lisa'), ctx.m('centro', tipo='lisa'), petalos=6)
    loc, n = punto_cabeza(ctx, 78, 40, 0.03)
    fl.location = tuple(loc)
    clay.orient_to(fl, np.array(n))
    ctx.pieza(fl, 'cabeza')


@prenda('velo_novia', 'cabeza', [V('velo_novia', 'Velo de novia', principal='#FFFFFF', flores='#FBF3F0')], para=('ella',), precio=55)
def velo_novia(ctx):
    m = ctx.m('principal', tipo='peluche')
    hc = ctx.hc
    # Coronita de flores blancas
    for k, az in enumerate(np.linspace(-80, 80, 9)):
        loc, n = punto_cabeza(ctx, az, 60, 0.03)
        if loc is not None:
            ctx.pieza(clay.blob(ctx.nombre(f'florcita velo {k}'), tuple(loc), (0.045, 0.045, 0.04), ctx.coll, ctx.m('flores', tipo='lisa'), n=4),
                      'cabeza')
    # Velo: tela que cae desde la coronilla por la espalda
    filas, cols = 7, 11
    verts, faces = [], []
    for i in range(filas):
        t = i / (filas - 1)
        for j in range(cols):
            u = j / (cols - 1) - 0.5
            az = 180 + u * 160 * (1 - 0.3 * t)
            if t < 0.35:
                loc, n = punto_cabeza(ctx, az, 70 - t * 120, 0.06)
                p = loc if loc is not None else hc
            else:
                ang = math.radians(az)
                rr = 0.62 + 0.25 * t
                p = np.array([math.sin(ang) * rr, 0.25 + 0.45 * t, hc[2] - 0.35 - (t - 0.35) * 1.3])
            p = p + np.array([0, 0, 0.02 * math.sin(j * 1.7 + i)])
            verts.append(p)
    for i in range(filas - 1):
        for j in range(cols - 1):
            a = i * cols + j
            faces.append((a, a + 1, a + cols + 1, a + cols))
    o = clay.make_mesh_object(ctx.nombre('velo'), verts, faces, ctx.coll, material=m)
    clay.add_solidify(o, 0.012, offset=0.0)
    clay.add_subsurf(o, 2, 2)
    o['modo'] = 'pelo_largo'
    o['corte'] = 1.3


def capucha(ctx, m, margen=0.07):
    """Capucha que tapa el pelo y deja la cara libre (el borde baja por los lados y la nuca)."""
    hc = ctx.hc
    sup = ctx.sup_pelo_bajo
    n_az, n_el = 48, 14
    azs = np.linspace(-180, 180, n_az, endpoint=False)
    borde = lambda a: np.interp(abs(a), [0, 40, 70, 100, 140, 180], [40, 34, 5, -25, -38, -40])
    verts, faces = [], []
    R = np.zeros((n_el, n_az))
    E = np.zeros((n_el, n_az))
    for j, a in enumerate(azs):
        e0 = borde(a)
        for i in range(n_el):
            e = e0 + (89 - e0) * i / (n_el - 1)
            E[i, j] = e
            loc, _ = sup.radial(hc, sph(a, e))
            R[i, j] = np.linalg.norm(loc - hc) if loc is not None else 0.6
    crudo = R.copy()
    for _ in range(2):
        R = np.maximum(R, np.maximum(np.roll(R, 1, 1), np.roll(R, -1, 1)))
    for _ in range(6):
        R = 0.5 * R + 0.25 * (np.roll(R, 1, 1) + np.roll(R, -1, 1))
        R[1:-1] = 0.5 * R[1:-1] + 0.25 * (R[:-2] + R[2:])
    # El suavizado bajaba los picos: los mechones de la coronilla de Él se salían por la capucha (puntos negros)
    vecinos = np.maximum(crudo, np.maximum(np.roll(crudo, 1, 1), np.roll(crudo, -1, 1)))
    vecinos[1:-1] = np.maximum(vecinos[1:-1], np.maximum(vecinos[:-2], vecinos[2:]))
    R = np.maximum(R, vecinos + 0.015)
    for i in range(n_el):
        for j, a in enumerate(azs):
            verts.append(hc + np.array(sph(a, E[i, j])) * (R[i, j] + margen))
    top = len(verts)
    verts.append(hc + np.array([0, 0, R[-1].mean() + margen]))
    for i in range(n_el - 1):
        for j in range(n_az):
            a0, a1 = i * n_az + j, i * n_az + (j + 1) % n_az
            faces.append((a0, a1, a1 + n_az, a0 + n_az))
    for j in range(n_az):
        faces.append(((n_el - 1) * n_az + j, (n_el - 1) * n_az + (j + 1) % n_az, top))
    o = clay.make_mesh_object(ctx.nombre('capucha'), verts, faces, ctx.coll, material=m)
    clay.add_solidify(o, 0.04, offset=-1.0)
    clay.add_subsurf(o, 1, 2)
    ctx.pieza(o, 'cabeza')
    # Ribete de la cara
    ring = [verts[j] for j in range(n_az)]
    ctx.pieza(clay.sweep(ctx.nombre('borde capucha'), ring, 0.04, (1, 1), ctx.coll, m, segments=8, samples=3, closed=True), 'cabeza')
    return R + margen, E, azs


def sobre_capucha(ctx, cap, az, el, hundir=0.02):
    """Punto sobre la superficie exterior de la capucha (orejas, ojos y púas van encima, no dentro)."""
    R, E, azs = cap
    j = int(np.argmin(np.abs((azs - az + 180) % 360 - 180)))
    r = float(np.interp(el, E[:, j], R[:, j]))
    d = np.array(sph(az, el))
    return ctx.hc + d * (r - hundir), d


@prenda('capucha_dino', 'cabeza', [V('capucha_dino', 'Capucha de dinosaurio', principal='#7DC47A', puas='#F7A93B', ojos='blanco')],
        oculta=COP, precio=40)
def capucha_dino(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    puas = ctx.m('puas', tipo='lisa')
    for k, (az, el) in enumerate(((0, 70), (0, 84), (180, 80), (180, 60), (180, 38), (180, 14))):
        loc, n = sobre_capucha(ctx, cap, az, el)
        s = 0.16 - 0.012 * k
        o = clay.blob(ctx.nombre(f'pua capucha {k}'), (0, 0, 0), (0.035, s, s * 1.2), ctx.coll, puas, n=5,
                      shaper=lambda v: v * np.where(v[:, 2:3] > 0, [0.5, 0.5, 1], [1, 1, 1]))
        o.location = tuple(loc)
        from mathutils import Vector
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(tuple(n)))
        ctx.pieza(o, 'cabeza')
    blanco, negro = ctx.m('ojos', tipo='brillo'), ctx.m('pupila', tipo='brillo', color='#1E1B1A')
    for sx in (-1, 1):
        loc, n = sobre_capucha(ctx, cap, sx * 24, 60, 0.0)
        ctx.pieza(clay.blob(ctx.nombre(f'ojo dino {sx}'), tuple(loc), (0.12, 0.1, 0.12), ctx.coll, blanco, n=5), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'pupila dino {sx}'), tuple(loc + n * 0.09 + np.array([0, -0.02, 0.01])), (0.055, 0.035, 0.06), ctx.coll,
                            negro, n=4), 'cabeza')


@prenda('capucha_oso', 'cabeza', [V('capucha_oso', 'Capucha de osito', principal='#B07A52', orejas='#B07A52', dentro='#F1D6B3'),
                                  V('capucha_panda', 'Capucha de panda', principal='#F6F2EA', orejas='#2B2422', dentro='#2B2422'),
                                  V('capucha_osa_rosa', 'Capucha de osita rosada', principal='#F7C6D2', orejas='#F7C6D2', dentro='#FFFFFF')],
        oculta=COP, precio=40)
def capucha_oso(ctx):
    capucha_animal(ctx, 'oso')


@prenda('capucha_conejo', 'cabeza', [V('capucha_conejo', 'Capucha de conejito', principal='#FAF6F2', orejas='#FAF6F2', dentro='#F7C6D2'),
                                     V('capucha_conejo_rosa', 'Capucha de conejita rosada', principal='#F7C6D2', orejas='#F7C6D2', dentro='#FFFFFF'),
                                     V('capucha_conejo_gris', 'Capucha de conejito gris', principal='#B9B4B0', orejas='#B9B4B0', dentro='#F7C6D2')],
        oculta=COP, precio=40)
def capucha_conejo(ctx):
    capucha_animal(ctx, 'conejo')


@prenda('capucha_unicornio', 'cabeza', [V('capucha_unicornio', 'Capucha de unicornio', principal='#DCCDF5', orejas='#DCCDF5', dentro='#FFFFFF',
                                          cuerno='#F2C75C', crin='#F59FC0'),
                                        V('capucha_unicornio_blanca', 'Capucha de unicornio blanca', principal='#FAF6F2', orejas='#FAF6F2',
                                          dentro='#F7C6D2', cuerno='#F2C75C', crin='#8EC5F0')],
        oculta=COP, precio=45)
def capucha_unicornio(ctx):
    capucha_animal(ctx, 'unicornio')


def capucha_animal(ctx, forma):
    """Capucha de peluche con orejas (redondas, largas de conejo o de punta con cuerno de unicornio)."""
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    orejas_m, dentro = ctx.m('orejas', tipo='peluche'), ctx.m('dentro', tipo='peluche')
    for sx in (-1, 1):
        if forma == 'conejo':
            base, n = sobre_capucha(ctx, cap, sx * 26, 72, 0.04)
            pts = [base, base + n * 0.12 + np.array([sx * 0.04, 0.03, 0.1]), base + n * 0.18 + np.array([sx * 0.12, 0.07, 0.28])]
            ctx.pieza(clay.sweep(ctx.nombre(f'oreja capucha {sx}'), pts, [0.08, 0.11, 0.07], (0.45, 1.0), ctx.coll, orejas_m, segments=10,
                                 samples=5, up=(0, -1, 0)), 'cabeza')
            pts2 = [p + np.array([0, -0.035, 0.01]) for p in pts]
            ctx.pieza(clay.sweep(ctx.nombre(f'oreja capucha dentro {sx}'), pts2, [0.04, 0.065, 0.035], (0.25, 1.0), ctx.coll, dentro, segments=8,
                                 samples=5, up=(0, -1, 0)), 'cabeza')
            continue
        loc, n = sobre_capucha(ctx, cap, sx * 46, 58)
        c = loc + n * 0.13
        if forma == 'unicornio':
            o = clay.blob(ctx.nombre(f'oreja capucha {sx}'), (0, 0, 0), (0.16, 0.08, 0.21), ctx.coll, orejas_m, n=6,
                          shaper=lambda v: v * np.column_stack([1 - 0.7 * np.clip(v[:, 2] / 0.21, 0, 1), np.ones(len(v)), np.ones(len(v))]))
            o.location = tuple(c)
            o.rotation_euler = (0, math.radians(sx * 22), 0)
            ctx.pieza(o, 'cabeza')
            continue
        ctx.pieza(clay.blob(ctx.nombre(f'oreja capucha {sx}'), tuple(c), (0.2, 0.09, 0.2), ctx.coll, orejas_m, n=6), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'oreja capucha dentro {sx}'), tuple(c + np.array([0, -0.075, -0.015])), (0.12, 0.035, 0.12), ctx.coll, dentro,
                            n=5), 'cabeza')
    if forma == 'unicornio':
        # Cuerno en espiral sobre la frente y una crin de bolitas por la nuca
        base, n = sobre_capucha(ctx, cap, 0, 58, 0.03)
        cuerno = ctx.m('cuerno', tipo='brillo')
        eje = n * 0.75 + np.array([0, -0.25, 0.4])
        eje = eje / np.linalg.norm(eje)
        pts = [base + eje * t * 0.5 for t in (0, 0.5, 1)]
        ctx.pieza(clay.sweep(ctx.nombre('cuerno unicornio'), pts, [0.11, 0.065, 0.008], (1, 1), ctx.coll, cuerno, segments=10, samples=6,
                             up=(1, 0, 0)), 'cabeza')
        for k in range(3):
            q = base + eje * (0.09 + 0.13 * k)
            ctx.pieza(clay.blob(ctx.nombre(f'espiral cuerno {k}'), tuple(q), (0.1 - 0.022 * k, 0.1 - 0.022 * k, 0.025), ctx.coll, cuerno, n=5),
                      'cabeza')
        crin = ctx.m('crin', tipo='peluche')
        for k, el in enumerate((80, 64, 48, 32, 16)):
            q, nq = sobre_capucha(ctx, cap, 180, el, 0.0)
            r = 0.12 - 0.01 * k
            ctx.pieza(clay.blob(ctx.nombre(f'crin {k}'), tuple(q + nq * r * 0.4), (r, r, r), ctx.coll, crin, n=5), 'cabeza')


# ---------------------------------------------------------------------------
# Cara
# ---------------------------------------------------------------------------

def ojo(ctx, sx):
    F = ctx.P['face']
    return np.array([sx * F['eye_x'], -0.6, F['eye_z']])


def delante_ojo(ctx, sx, lift=0.05):
    F = ctx.P['face']
    d = ojo(ctx, sx) - ctx.hc
    loc, n = ctx.sup_cabeza.radial(ctx.hc, d, lift)
    return (loc if loc is not None else ojo(ctx, sx)), (n if n is not None else np.array([0, -1, 0])), F


def patillas(ctx, m, z_off=0.02):
    out = []
    for sx in (-1, 1):
        a, n, F = delante_ojo(ctx, sx, 0.045)
        pts = [a + np.array([sx * 0.17, 0.0, 0.0])]
        for az in (70, 90, 105):
            loc, nn = ctx.sup_cabeza.radial(ctx.hc, sph(sx * az, math.degrees(math.asin((F['eye_z'] - ctx.hc[2]) / 0.66))), 0.03)
            if loc is not None:
                pts.append(loc)
        if len(pts) >= 3:
            out.append(ctx.pieza(clay.sweep(ctx.nombre(f'patilla {sx}'), pts, 0.016, (1, 1), ctx.coll, m, segments=6, samples=4), 'cabeza'))
    return out


def gafas(ctx, forma='redonda', r=0.16, lente=None, marco=None, grosor=0.022):
    marco = marco or ctx.m('marco', tipo='brillo')
    for sx in (-1, 1):
        c, n, F = delante_ojo(ctx, sx, 0.05)
        if forma == 'redonda':
            ring = [c + np.array([math.cos(a) * r, 0, math.sin(a) * r * 0.92]) for a in np.linspace(0, 2 * math.pi, 20, endpoint=False)]
            ctx.pieza(clay.sweep(ctx.nombre(f'aro gafas {sx}'), ring, grosor, (1, 1), ctx.coll, marco, segments=8, samples=3, closed=True), 'cabeza')
            if lente is not None:
                ctx.pieza(clay.blob(ctx.nombre(f'lente {sx}'), tuple(c + np.array([0, 0.004, 0])), (r * 0.98, 0.012, r * 0.9), ctx.coll, lente, n=6), 'cabeza')
        elif forma == 'corazon':
            h = corazon(ctx, f'lente corazon {sx}', r * 3.4, lente or marco, grosor=0.12)
            h.location = tuple(c)
            ctx.pieza(h, 'cabeza')
        else:
            e = estrella(ctx, f'lente estrella {sx}', r * 1.25, lente or marco, grosor=0.012)
            e.location = tuple(c)
            ctx.pieza(e, 'cabeza')
    a, _, _ = delante_ojo(ctx, -1, 0.05)
    b, _, _ = delante_ojo(ctx, 1, 0.05)
    mid = (a + b) / 2 + np.array([0, -0.02, 0.03])
    ctx.pieza(clay.sweep(ctx.nombre('puente gafas'), [a + np.array([r * 0.9, 0, 0.02]), mid, b + np.array([-r * 0.9, 0, 0.02])], 0.014, (1, 1), ctx.coll,
                         marco, segments=6, samples=4), 'cabeza')
    patillas(ctx, marco)


@prenda('gafas_redondas', 'cara', [V('gafas_redondas', 'Gafas redondas', marco='negro'), V('gafas_redondas_doradas', 'Gafas doradas', marco='dorado'),
                                   V('gafas_redondas_rojas', 'Gafas rojas', marco='rojo'), V('gafas_redondas_carey', 'Gafas café', marco='cafe')],
        precio=20)
def gafas_redondas(ctx):
    gafas(ctx)


@prenda('gafas_sol', 'cara', [V('gafas_sol', 'Gafas de sol', marco='negro', lente='#1E1D22'),
                              V('gafas_sol_rosa', 'Gafas de sol rosadas', marco='rosado', lente='#5A2A3A'),
                              V('gafas_sol_doradas', 'Gafas de sol de aviador', marco='dorado', lente='#2F3E4F')],
        precio=25)
def gafas_sol(ctx):
    gafas(ctx, lente=ctx.m('lente', tipo='brillo'), r=0.17, grosor=0.025)


@prenda('gafas_corazon', 'cara', [V('gafas_corazon', 'Gafas de corazón', marco='rosado', lente='rojo'),
                                  V('gafas_corazon_rosa', 'Gafas de corazón rosadas', marco='blanco', lente='rosado')],
        precio=25)
def gafas_corazon(ctx):
    gafas(ctx, 'corazon', lente=ctx.m('lente', tipo='brillo'), r=0.17)


@prenda('gafas_estrella', 'cara', [V('gafas_estrella', 'Gafas de estrella', marco='dorado', lente='amarillo'),
                                   V('gafas_estrella_rosa', 'Gafas de estrella rosadas', marco='rosado', lente='lila')],
        precio=25)
def gafas_estrella(ctx):
    gafas(ctx, 'estrella', lente=ctx.m('lente', tipo='brillo'), r=0.17)


@prenda('antifaz', 'cara', [V('antifaz_rojo', 'Antifaz de héroe rojo', principal='rojo'), V('antifaz_negro', 'Antifaz negro', principal='negro'),
                            V('antifaz_azul', 'Antifaz azul', principal='azul')],
        precio=20)
def antifaz(ctx):
    m = ctx.m('principal', tipo='lisa')
    for sx in (-1, 1):
        c, n, F = delante_ojo(ctx, sx, 0.035)
        ring = [c + np.array([math.cos(a) * 0.19, 0, math.sin(a) * 0.16]) for a in np.linspace(0, 2 * math.pi, 22, endpoint=False)]
        ctx.pieza(clay.sweep(ctx.nombre(f'antifaz ojo {sx}'), ring, 0.055, (1.4, 0.4), ctx.coll, m, segments=8, samples=3, closed=True,
                             up=(0, -1, 0)), 'cabeza')
    F = ctx.P['face']
    el = math.degrees(math.asin((F['eye_z'] - ctx.hc[2]) / 0.66))
    pts = []
    for az in np.linspace(40, 320, 15):
        loc, n = ctx.sup_pelo.radial(ctx.hc, sph(az, el), 0.02)
        if loc is not None:
            pts.append(loc)
    if len(pts) > 4:
        ctx.pieza(clay.sweep(ctx.nombre('cinta antifaz'), pts, 0.03, (1, 0.4), ctx.coll, m, segments=6, samples=3), 'cabeza')


@prenda('parche', 'cara', [V('parche', 'Parche de pirata', principal='negro')], precio=15)
def parche(ctx):
    m = ctx.m('principal', tipo='lisa')
    c, n, F = delante_ojo(ctx, 1, 0.03)
    ctx.pieza(clay.blob(ctx.nombre('parche'), tuple(c), (0.17, 0.03, 0.15), ctx.coll, m, n=6), 'cabeza')
    pts = []
    for k, (az, el) in enumerate(((60, 55), (110, 40), (180, 20), (250, 8), (300, 0))):
        loc, _ = ctx.sup_pelo.radial(ctx.hc, sph(az, el), 0.015)
        if loc is not None:
            pts.append(loc)
    if len(pts) > 2:
        ctx.pieza(clay.sweep(ctx.nombre('cinta parche'), [c + np.array([0.12, 0.02, 0.08])] + pts, 0.016, (1, 0.5), ctx.coll, m, segments=6, samples=3),
                  'cabeza')


@prenda('nariz_payaso', 'cara', [V('nariz_payaso', 'Nariz de payaso', principal='#E0202E')], precio=10)
def nariz_payaso(ctx):
    F = ctx.P['face']
    z = (F['eye_z'] + F['mouth'][1]) / 2 - 0.02
    loc, n = ctx.sup_cabeza.radial(ctx.hc, np.array([0, -0.6, z]) - ctx.hc, 0.05)
    ctx.pieza(clay.blob(ctx.nombre('nariz payaso'), tuple(loc + np.array([0, -0.02, 0])), (0.095, 0.09, 0.09), ctx.coll, ctx.m('principal', tipo='brillo'), n=6),
              'cabeza')


@prenda('bigote', 'cara', [V('bigote', 'Bigote elegante', principal='#2B2422'), V('bigote_cafe', 'Bigote café', principal='cafe')], precio=15)
def bigote(ctx):
    F = ctx.P['face']
    z = F['mouth'][1] + 0.055
    m = ctx.m('principal', tipo='pelo')
    for sx in (-1, 1):
        pts = []
        for x, dz in ((0.0, 0.0), (0.07, -0.005), (0.14, 0.0), (0.19, 0.035)):
            loc, n = ctx.sup_cabeza.radial(ctx.hc, np.array([sx * x, -0.6, z + dz]) - ctx.hc, 0.02)
            if loc is not None:
                pts.append(loc)
        if len(pts) >= 3:
            ctx.pieza(clay.sweep(ctx.nombre(f'bigote {sx}'), pts, [0.035, 0.04, 0.025, 0.012], (1, 0.6), ctx.coll, m, segments=8, samples=4,
                                 caps=('round', 'point'), up=(0, -1, 0)), 'cabeza')


@prenda('bigotes_gato', 'cara', [V('bigotes_gato', 'Bigotes de gatito', principal='#2B2422', nariz='rosado')], precio=10)
def bigotes_gato(ctx):
    F = ctx.P['face']
    m = ctx.m('principal', tipo='lisa')
    zb = (F['blush'][1] + F['mouth'][1]) / 2
    for sx in (-1, 1):
        for k, dz in enumerate((-0.035, 0.0, 0.035)):
            a = np.array([sx * 0.2, -0.6, zb + dz * 0.5])
            b = np.array([sx * 0.46, -0.6, zb + dz * 1.8])
            pts = []
            for p in (a, (a + b) / 2, b):
                loc, _ = ctx.sup_cabeza.radial(ctx.hc, p - ctx.hc, 0.012)
                if loc is not None:
                    pts.append(loc)
            if len(pts) == 3:
                ctx.pieza(clay.sweep(ctx.nombre(f'bigote gato {sx} {k}'), pts, 0.014, (1, 1), ctx.coll, m, segments=5, samples=3), 'cabeza')
    z = (F['eye_z'] + F['mouth'][1]) / 2 - 0.01
    loc, n = ctx.sup_cabeza.radial(ctx.hc, np.array([0, -0.6, z]) - ctx.hc, 0.012)
    ctx.pieza(clay.blob(ctx.nombre('naricita gato'), tuple(loc), (0.035, 0.02, 0.025), ctx.coll, ctx.m('nariz', tipo='brillo'), n=4,
                        shaper=lambda v: v * np.where(v[:, 2:3] < 0, [0.5, 1, 1], [1, 1, 1])), 'cabeza')


# ---------------------------------------------------------------------------
# Espalda
# ---------------------------------------------------------------------------

def espalda_z(ctx, t):
    T = ctx.D['torso']
    return T['bottom'] + (T['c'][2] + T['half'][2] - T['bottom']) * t


def atras_y(ctx, z=None, x=0.0):
    """Y de la espalda donde se apoya algo; en Ella, por fuera del pelo largo (si no, el pelo lo tapa)."""
    T = ctx.D['torso']
    y = T['c'][1] + T['half'][1] + 0.04
    if z is not None and not ctx.el:
        # Varios rayos: los dos mechones largos pueden dejar una raya en el centro
        for dx in (-0.16, -0.08, 0.0, 0.08, 0.16):
            loc, _ = ctx.sup_pelo.ray((x + dx, 5.0, z), (0, -1, 0))
            if loc is not None:
                y = max(y, float(loc[1]) + 0.01)
    return y


@prenda('capa', 'espalda', [V('capa_roja', 'Capa de héroe roja', principal='rojo', broche='dorado'),
                            V('capa_azul', 'Capa de héroe azul', principal='azul', broche='dorado'),
                            V('capa_morada', 'Capa de mago morada', principal='morado', broche='dorado'),
                            V('capa_negra', 'Capa negra', principal='negro', broche='rojo'),
                            V('capa_rosada', 'Capa rosada', principal='rosado', broche='blanco')],
        precio=45)
def capa(ctx):
    m = ctx.m('principal')
    T = ctx.D['torso']
    nc = ctx.D['neck_hole'][0]
    filas, cols = 9, 13
    verts, faces = [], []
    ztop = nc[2] - 0.02
    zbot = 0.22
    for i in range(filas):
        t = i / (filas - 1)
        z = ztop + (zbot - ztop) * t
        ancho = 0.34 + 0.5 * t ** 0.8
        for j in range(cols):
            u = j / (cols - 1) * 2 - 1
            a = u * math.radians(80 - 20 * t)
            y = atras_y(ctx) - 0.06 + 0.12 * t + 0.28 * (1 - math.cos(a)) * (0.5 - 0.4 * t) + 0.03 * math.sin(u * 7 + t * 3) * t
            x = math.sin(a) * ancho
            if t < 0.15:
                y += (1 - t / 0.15) * -0.1 * math.cos(a)
            verts.append((x, y + 0.12 * t, z))
    for i in range(filas - 1):
        for j in range(cols - 1):
            a = i * cols + j
            faces.append((a, a + cols, a + cols + 1, a + 1))
    o = clay.make_mesh_object(ctx.nombre('capa'), verts, faces, ctx.coll, material=m)
    clay.add_solidify(o, 0.02, offset=0.0)
    clay.add_subsurf(o, 2, 2)
    ctx.pieza(o, 'torso')
    for sx in (-1, 1):
        ctx.pieza(clay.blob(ctx.nombre(f'broche capa {sx}'), (sx * 0.24, T['c'][1] - T['half'][1] + 0.02, ztop - 0.03), (0.045, 0.02, 0.045), ctx.coll,
                            ctx.m('broche', tipo='metal'), n=5), 'torso')


def ala(ctx, sx, lobulos, m, base, inclinar=25):
    """Ala hecha de lóbulos planos que salen de la espalda."""
    for k, (dx, dz, rx, rz) in enumerate(lobulos):
        c = base + np.array([sx * dx, 0.02 * k, dz])
        o = clay.blob(ctx.nombre(f'ala {ctx.lado(sx)} {k}'), tuple(c), (rx, 0.025, rz), ctx.coll, m, n=6)
        o.rotation_euler = (0, math.radians(sx * inclinar), math.radians(sx * -12))
        ctx.pieza(o, 'torso')


@prenda('alas_angel', 'espalda', [V('alas_angel', 'Alas de angelito', principal='#FFFFFF')], precio=55)
def alas_angel(ctx):
    m = ctx.m('principal', tipo='peluche')
    base_z = espalda_z(ctx, 0.7)
    for sx in (-1, 1):
        base = np.array([sx * 0.1, atras_y(ctx, base_z) + 0.02, base_z])
        plumas = [(0.12, 0.05, 0.16, 0.14), (0.3, 0.1, 0.2, 0.15), (0.48, 0.16, 0.2, 0.13), (0.28, -0.1, 0.18, 0.12), (0.46, -0.04, 0.16, 0.1),
                  (0.62, 0.1, 0.14, 0.1)]
        ala(ctx, sx, plumas, m, base)


@prenda('alas_mariposa', 'espalda', [V('alas_mariposa', 'Alas de mariposa', principal='#F7A7C9', detalle='#8FD6F0', puntos='blanco'),
                                     V('alas_mariposa_monarca', 'Alas de mariposa monarca', principal='naranja', detalle='negro', puntos='blanco'),
                                     V('alas_hada', 'Alas de hada', principal='#DCCDF5', detalle='#BDEFE6', puntos='blanco')],
        precio=55)
def alas_mariposa(ctx):
    m, d, p = ctx.m('principal', tipo='lisa'), ctx.m('detalle', tipo='lisa'), ctx.m('puntos', tipo='lisa')
    base_z = espalda_z(ctx, 0.62)
    for sx in (-1, 1):
        base = np.array([sx * 0.06, atras_y(ctx, base_z) + 0.03, base_z])
        ala(ctx, sx, [(0.34, 0.22, 0.34, 0.3)], m, base, inclinar=15)
        ala(ctx, sx, [(0.26, -0.22, 0.24, 0.2)], d, base + np.array([0, 0.005, 0]), inclinar=15)
        for k, (dx, dz) in enumerate(((0.42, 0.3), (0.28, 0.12), (0.3, -0.25))):
            o = clay.blob(ctx.nombre(f'punto ala {sx} {k}'), tuple(base + np.array([sx * dx, 0.035, dz])), (0.045, 0.012, 0.045), ctx.coll, p, n=4)
            ctx.pieza(o, 'torso')


@prenda('alas_abeja', 'espalda', [V('alas_abeja', 'Alitas de abeja', principal='#DDF3FF')], precio=35)
def alas_abeja(ctx):
    m = ctx.m('principal', tipo='brillo')
    base_z = espalda_z(ctx, 0.72)
    for sx in (-1, 1):
        base = np.array([sx * 0.06, atras_y(ctx, base_z) + 0.03, base_z])
        ala(ctx, sx, [(0.2, 0.16, 0.2, 0.13), (0.16, -0.04, 0.14, 0.09)], m, base, inclinar=30)


@prenda('alas_murcielago', 'espalda', [V('alas_murcielago', 'Alas de murciélago', principal='negro'),
                                       V('alas_diablito', 'Alas de diablito', principal='rojo')],
        precio=45)
def alas_murcielago(ctx):
    m = ctx.m('principal', tipo='lisa')
    base_z = espalda_z(ctx, 0.7)
    for sx in (-1, 1):
        base = np.array([sx * 0.08, atras_y(ctx, base_z) + 0.02, base_z])
        for k, (dx, dz, rx, rz) in enumerate(((0.2, 0.08, 0.2, 0.2), (0.38, 0.12, 0.18, 0.22), (0.54, 0.2, 0.14, 0.2))):
            o = clay.blob(ctx.nombre(f'ala murcielago {ctx.lado(sx)} {k}'), (0, 0, 0), (rx, 0.02, rz), ctx.coll, m, n=6,
                          shaper=lambda v, rz=rz: v * np.column_stack([1 - 0.7 * np.clip(-v[:, 2] / rz, 0, 1), np.ones(len(v)), np.ones(len(v))]))
            o.location = tuple(base + np.array([sx * dx, 0.02 * k, dz]))
            o.rotation_euler = (0, math.radians(sx * 20), math.radians(sx * -12))
            ctx.pieza(o, 'torso')
        pts = [base, base + np.array([sx * 0.3, 0.02, 0.34]), base + np.array([sx * 0.62, 0.03, 0.42])]
        ctx.pieza(clay.sweep(ctx.nombre(f'hueso ala {sx}'), pts, 0.022, (1, 1), ctx.coll, m, segments=6, samples=4), 'torso')


@prenda('mochila', 'espalda', [V('mochila_roja', 'Mochila roja', principal='rojo', detalle='amarillo'),
                               V('mochila_amarilla', 'Mochila amarilla', principal='amarillo', detalle='azul'),
                               V('mochila_azul', 'Mochila azul', principal='azul', detalle='rojo'),
                               V('mochila_rosada', 'Mochila rosada', principal='rosado', detalle='blanco')],
        precio=40)
def mochila(ctx):
    m, d = ctx.m('principal'), ctx.m('detalle')
    T = ctx.D['torso']
    z = T['c'][2]
    y = atras_y(ctx, z + 0.1) + 0.1
    ctx.pieza(clay.rbox(ctx.nombre('mochila'), (0, y, z), (0.3, 0.12, 0.3), ctx.coll, m, p=4, n=6), 'torso')
    ctx.pieza(clay.rbox(ctx.nombre('bolsillo mochila'), (0, y + 0.12, z - 0.1), (0.2, 0.05, 0.13), ctx.coll, d, p=4, n=5), 'torso')
    ctx.pieza(clay.rbox(ctx.nombre('tapa mochila'), (0, y + 0.02, z + 0.27), (0.29, 0.13, 0.06), ctx.coll, d, p=4, n=5), 'torso')
    import ropa
    ft = ropa.torso_sdf(ctx.D, 0.03)
    for sx in (-1, 1):
        hombro = np.array([sx * 0.2, T['c'][1], T['c'][2] + T['half'][2] + 0.1])
        P, hit = sdf.trace(ft, np.array([[hombro[0], hombro[1], 2.0]]), (0, 0, -1), max_dist=3.0)
        top = P[0] + np.array([0, 0, 0.02]) if hit[0] else hombro
        fr = sdf.front_points(ft, [(sx * 0.22, z - 0.1)], lift=0.02)
        pts = [np.array([sx * 0.2, y - 0.08, z + 0.2]), top + np.array([0, 0.06, 0]), top + np.array([0, -0.06, 0])] + fr
        ctx.pieza(clay.sweep(ctx.nombre(f'correa mochila {sx}'), pts, 0.035, (1, 0.4), ctx.coll, d, segments=6, samples=4), 'torso')


# ---------------------------------------------------------------------------
# Colas
# ---------------------------------------------------------------------------

def base_cola(ctx):
    z = ctx.B['pelvis_z'] + 0.02
    # En Ella la cola sale por fuera del pelo largo, que le cae hasta la cadera
    y = (ctx.D['pants']['hip_half'][1] + 0.05) if ctx.el else max(0.3, atras_y(ctx, z) - 0.04)
    return np.array([0, y + 0.02, z])


@prenda('cola_gato', 'cola', [V('cola_gato', 'Cola de gatito negra', principal='negro'), V('cola_gato_blanca', 'Cola de gatito blanca', principal='blanco'),
                              V('cola_gato_gris', 'Cola de gatito gris', principal='gris'), V('cola_gato_naranja', 'Cola de gatito naranja', principal='naranja')],
        precio=20)
def cola_gato(ctx):
    b = base_cola(ctx)
    pts = [b, b + np.array([0.05, 0.2, -0.05]), b + np.array([0.15, 0.34, 0.12]), b + np.array([0.1, 0.36, 0.4])]
    ctx.pieza(clay.sweep(ctx.nombre('cola gato'), pts, [0.06, 0.06, 0.055, 0.05], (1, 1), ctx.coll, ctx.m('principal', tipo='peluche'), segments=10,
                         samples=6), 'pelvis')


@prenda('cola_conejo', 'cola', [V('cola_conejo', 'Colita de conejo', principal='blanco'), V('cola_conejo_rosa', 'Colita de conejo rosada', principal='rosado')],
        precio=15)
def cola_conejo(ctx):
    b = base_cola(ctx)
    ctx.pieza(clay.blob(ctx.nombre('cola conejo'), tuple(b + np.array([0, 0.08, 0])), (0.13, 0.12, 0.12), ctx.coll, ctx.m('principal', tipo='peluche'), n=7),
              'pelvis')


@prenda('cola_oso', 'cola', [V('cola_oso', 'Colita de osito', principal='#B07A52'), V('cola_panda', 'Colita de panda', principal='#2B2422')], precio=15)
def cola_oso(ctx):
    b = base_cola(ctx)
    ctx.pieza(clay.blob(ctx.nombre('cola oso'), tuple(b + np.array([0, 0.06, 0])), (0.09, 0.08, 0.08), ctx.coll, ctx.m('principal', tipo='peluche'), n=6),
              'pelvis')


@prenda('cola_dino', 'cola', [V('cola_dino', 'Cola de dinosaurio', principal='#7DC47A', puas='#F7A93B')], precio=30)
def cola_dino(ctx):
    b = base_cola(ctx)
    pts = [b, b + np.array([0, 0.25, -0.12]), b + np.array([0.06, 0.52, -0.32]), b + np.array([0.12, 0.72, -0.42])]
    ctx.pieza(clay.sweep(ctx.nombre('cola dino'), pts, [0.2, 0.15, 0.09, 0.02], (1, 1), ctx.coll, ctx.m('principal', tipo='peluche'), segments=12, samples=6,
                         caps=('round', 'point')), 'pelvis')
    puas = ctx.m('puas', tipo='lisa')
    from clay import catmull_rom
    ps, _ = catmull_rom(pts, 6)
    for k, p in enumerate(ps[2:-3:3]):
        s = 0.07 - 0.008 * k
        ctx.pieza(clay.blob(ctx.nombre(f'pua cola {k}'), tuple(p + np.array([0, 0, 0.12 - 0.015 * k])), (0.02, s, s * 1.2), ctx.coll, puas, n=5,
                            shaper=lambda v: v * np.where(v[:, 2:3] > 0, [0.5, 0.5, 1], [1, 1, 1])), 'pelvis')


@prenda('cola_diablo', 'cola', [V('cola_diablo', 'Cola de diablito', principal='rojo'), V('cola_diablo_negra', 'Cola de diablito negra', principal='negro')],
        precio=20)
def cola_diablo(ctx):
    b = base_cola(ctx)
    m = ctx.m('principal', tipo='brillo')
    pts = [b, b + np.array([0.02, 0.25, -0.2]), b + np.array([0.12, 0.42, -0.1]), b + np.array([0.18, 0.5, 0.12])]
    ctx.pieza(clay.sweep(ctx.nombre('cola diablo'), pts, 0.022, (1, 1), ctx.coll, m, segments=8, samples=6), 'pelvis')
    punta = clay.blob(ctx.nombre('punta diablo'), (0, 0, 0), (0.07, 0.02, 0.08), ctx.coll, m, n=5,
                      shaper=lambda v: v * np.where(v[:, 2:3] > 0, [0.2, 1, 1], [1, 1, 1]))
    punta.location = tuple(pts[-1] + np.array([0.02, 0.02, 0.06]))
    ctx.pieza(punta, 'pelvis')


@prenda('cola_zorro', 'cola', [V('cola_zorro', 'Cola de zorrito', principal='naranja', punta='blanco')], precio=30)
def cola_zorro(ctx):
    b = base_cola(ctx)
    pts = [b, b + np.array([0.06, 0.22, -0.02]), b + np.array([0.14, 0.4, 0.16]), b + np.array([0.12, 0.42, 0.34])]
    ctx.pieza(clay.sweep(ctx.nombre('cola zorro'), pts, [0.06, 0.14, 0.13, 0.05], (1, 1), ctx.coll, ctx.m('principal', tipo='peluche'), segments=12,
                         samples=6), 'pelvis')
    ctx.pieza(clay.blob(ctx.nombre('punta zorro'), tuple(pts[-1] + np.array([0, 0, -0.02])), (0.08, 0.08, 0.1), ctx.coll, ctx.m('punta', tipo='peluche'),
                        n=6), 'pelvis')

