"""Trajes serios de las 12 clases de Sangre y Ceniza para el cuerpo de Él y el de Ella.

Se arman con la maquinaria de la ropa de la casa (ropa.py): sobre el muñeco armado, cada malla amarrada a su hueso
(torso, brazos, pelvis, piernas, pies, cabeza), así siguen todas las poses. Cada traje sale en UN archivo:
ropa/sangre_<clase>_<rol>.glb (camisa, pantalón o falda, botas, capa, sombrero, grilletes…), y en sangre/trajes.json
qué partes de fábrica tapa (arriba, abajo, pies, copete, medias) para esconderlas.

Además de los materiales de tela/fieltro, cada traje trae mugre en los colores de los vértices (oclusión, barro abajo,
manchas, sangre seca según la clase): multiplica el color del material, en el juego y en los renders.

Uso: blender -b -P sangre_trajes.py -- <carpeta_salida> <el|ella|ambos> [clases separadas por coma] [--hoja <png>] [--sin-glb]
     salida: <carpeta>/ropa/sangre_<clase>_<rol>.glb y <carpeta>/sangre/trajes.json
"""
import contextlib
import json
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402
from mathutils.bvhtree import BVHTree  # noqa: E402

import clay  # noqa: E402
import cuerpo  # noqa: E402
import escena  # noqa: E402
import ropa  # noqa: E402
import sangre_comun as sc  # noqa: E402
import sdf  # noqa: E402
from clay import sph  # noqa: E402
from ropa import VX, en_superficie, punto_cabeza, radio_cabeza, ruedo  # noqa: E402

TRAJES = {}


def traje(clave, nombre, oculta=('arriba', 'abajo', 'pies'), mugre=None):
    """Registra el traje de una clase; `oculta` son las partes de fábrica que tapa; `mugre` el perfil de suciedad."""
    def deco(fn):
        TRAJES[clave] = dict(fn=fn, nombre=nombre, oculta=tuple(oculta), mugre=dict(mugre or {}))
        return fn
    return deco


# ---------------------------------------------------------------------------
# Ayudas
# ---------------------------------------------------------------------------

@contextlib.contextmanager
def submats(ctx, sufijo, **colores):
    """Materiales aparte para reusar prendas de la casa que piden los papeles «principal», «suela»…"""
    viejo = ctx.m
    ctx.m = ropa.Mats(f'{ctx.clave} {sufijo}', colores)
    try:
        yield ctx.m
    finally:
        ctx.m = viejo


def unidad(v):
    v = np.asarray(v, float)
    return v / max(np.linalg.norm(v), 1e-9)


def jag(P, amp, esc=14.0, sem=0, dientes=0.0, freq=45.0):
    """Borde rasgado: ruido + dientes de tela rota."""
    j = amp * (sc.fbm(P, esc, 3, sem) - 0.5) * 2
    if dientes:
        j = j + dientes * np.abs(np.sin(P[:, 0] * freq + P[:, 1] * freq * 0.7 + 1.3 * sem))
    return j


def rasgar_abajo(z0, amp, esc=14.0, sem=0, dientes=0.0):
    """extra() de ropa.torso: corta todo lo que quede debajo de z0 con el borde rasgado."""
    def g(P, d):
        return np.maximum(d, (z0 + jag(P, amp, esc, sem, dientes)) - P[:, 2])
    return g


def huecos(lista, sem=0):
    """extra() que abre huecos rasgados [(centro, radios)] en la tela."""
    elips = [(sdf.ellipsoid(c, r), i) for i, (c, r) in enumerate(lista)]

    def g(P, d):
        for e, i in elips:
            h = e(P) + 0.012 * (sc.fbm(P, 40, 3, sem + i) - 0.5) * 2
            d = np.maximum(d, -h)
        return d
    return g


def encadenar(*gs):
    def g(P, d):
        for h in gs:
            d = h(P, d)
        return d
    return g


def brazo(ctx, sx):
    """Hombro (articulación) y dirección del brazo de este lado."""
    D = ctx.D
    A = D['arm']
    s = np.array([sx, 1, 1])
    d = cuerpo._dir(D['arm_deg'], A.get('dy', 0.08)) * s
    j = np.array(D['joint']) * s
    return j, d, A


def manga_s(ctx, sx, largo, holgura, mat, rasgado=0.0, sem=0, nombre='manga', campana=0.0, inicio=0.07):
    """Manga amarrada al brazo; con `rasgado` el puño queda hecho jirones."""
    j, d, A = brazo(ctx, sx)
    a = j - d * inicio
    b = j + d * largo
    r0, r1 = A['r'][0] + holgura[0], A['r'][1] + holgura[1] + campana
    cono = sdf.round_cone(a, b, r0, r1)
    lat = unidad(np.cross(d, [0, 0, 1]))

    def f(P):
        dd = cono(P)
        corte = (P - b) @ d
        if rasgado:
            corte = corte + jag(P, rasgado, 30, sem) + rasgado * 0.7 * np.abs(np.sin((P @ lat) * 80 + P[:, 2] * 50))
        return sdf.smax(dd, corte, 0.008)
    lo = np.minimum(a, b) - max(r0, r1) - 0.08
    hi = np.maximum(a, b) + max(r0, r1) + 0.08
    return ropa.malla(ctx, f'{nombre} {ctx.lado(sx)}', f, lo, hi, mat, ctx.hueso_lado('brazo', sx)), f, (b, d)


def anillo_en(ctx, f, centro, eje, mat, hueso, grosor=0.022, prof=(1, 1), parte='aro', n=28, lift=0.004, fuera=0.7):
    ring = sdf.ring_points(f, tuple(centro), tuple(eje), fuera, n, lift)
    if len(ring) < 10:
        return None
    return ctx.pieza(clay.sweep(ctx.nombre(parte), ring, grosor, prof, ctx.coll, mat, segments=7, samples=3, closed=True), hueso)


def puntadas_linea(ctx, pts, mat, hueso, parte='puntadas'):
    if len(pts) < 2:
        return None
    o = clay.stitches(ctx.nombre(parte), pts, 0.0055, 0.026, 0.016, ctx.coll, mat)
    return ctx.pieza(o, hueso) if o is not None else None


def remiendo(ctx, f, x, z, w, h, mat, hilo, hueso='torso', atras=False, girar=0.0, parte='remiendo'):
    """Parche cosido sobre una prenda (frente o espalda) con puntadas en todo el borde."""
    o = clay.rbox(ctx.nombre(parte), (0, 0, 0), (w, 0.009, h), ctx.coll, mat, p=5, n=4, subsurf=1)
    o.rotation_euler = (0, math.radians(girar), 0)
    r = en_superficie(ctx, f, x, z, o, hueso, lift=0.008, atras=atras)
    if r is None:
        bpy.data.objects.remove(o, do_unlink=True)
        return
    # puntadas siguiendo el borde (sobre la superficie)
    pts = []
    for a in np.linspace(0, 2 * math.pi, 22):
        px = x + math.cos(a) * w * 0.88 * (1 if not atras else -1)
        pz = z + math.sin(a) * h * 0.88
        if atras:
            P, hit = sdf.trace(f, np.array([[px, 3.0, pz]]), (0, -1, 0), max_dist=6.0)
            if hit[0]:
                pts.append(P[0] + np.array([0, 0.016, 0]))
        else:
            q = sdf.front_points(f, [(px, pz)], lift=0.016)
            if q:
                pts.append(q[0])
    puntadas_linea(ctx, pts, hilo, hueso, f'{parte} puntadas')


def frente(ctx, f, xs_zs, lift=0.006):
    return sdf.front_points(f, list(xs_zs), lift=lift)


def espalda_pts(f, xs_zs, lift=0.006):
    out = []
    for x, z in xs_zs:
        P, hit = sdf.trace(f, np.array([[x, 3.0, z]]), (0, -1, 0), max_dist=6.0)
        if hit[0]:
            out.append(P[0] + np.array([0, lift, 0]))
    return out


def cinturon(ctx, f, z, cuero, hebilla, ancho=0.03, parte='cinturon', hueso='torso'):
    o = anillo_en(ctx, f, (0, ctx.D['torso']['c'][1], z), (0, 0, 1), cuero, hueso, grosor=ancho, prof=(1.0, 0.45), parte=parte, n=36, lift=0.012,
                  fuera=1.2)
    p = frente(ctx, f, [(0.0, z)], lift=0.03)
    if p:
        hb = clay.rbox(ctx.nombre(f'hebilla {parte}'), (0, 0, 0), (0.06, 0.012, 0.05), ctx.coll, hebilla, p=4, n=3, subsurf=1)
        en_superficie(ctx, f, 0.0, z, hb, hueso, lift=0.032)
        pasador = clay.rbox(ctx.nombre(f'pasador {parte}'), (0, 0, 0), (0.012, 0.012, 0.042), ctx.coll, hebilla, p=4, n=2, subsurf=1)
        en_superficie(ctx, f, 0.0, z, pasador, hueso, lift=0.048)
    return o


def botas_altas(ctx, cuero, suela_m, alto=None, holgura=0.02, metal=None, doblez=True, parte='bota sangre', hebillas=2):
    """Botas altas de cuero (el pantalón va metido): caña ancha, doblez arriba y correas con hebilla."""
    import ropa_pies
    objs = []
    for sx, x, k in ropa_pies.lados(ctx):
        h = alto or (0.44 if ctx.el else 0.42)
        r_top = (0.235 if ctx.el else 0.215) + holgura
        up = ropa_pies.empeine(x, k, alto=1.08, abierto=False)
        cana = sdf.round_cone((x, 0.0, 0.14), (x, 0.0, h), r_top * 0.82, r_top)

        def f(P, up=up, cana=cana, h=h):
            dd = sdf.smin(up(P), cana(P), 0.05)
            return sdf.smax(dd, P[:, 2] - h, 0.01)
        objs.append(ropa_pies.capellada(ctx, sx, x, k, f, cuero, parte, hi_z=h + 0.08))
        objs += ropa_pies.suela(ctx, sx, x, k, suela_m, alto=0.085, parte=f'suela {parte}', tacon=0.06)
        hb = ctx.hueso_lado('pie', sx)
        if doblez:
            o = anillo_en(ctx, f, (x, 0.0, h - 0.035), (0, 0, 1), cuero, hb, grosor=0.04, prof=(1, 1.3), parte=f'doblez {parte} {ctx.lado(sx)}',
                          lift=0.008, fuera=0.5)
            objs.append(o)
        if metal is not None:
            for j in range(hebillas):
                z = 0.2 + j * 0.11
                o = anillo_en(ctx, f, (x, 0.0, z), (0, 0, 1), cuero, hb, grosor=0.018, prof=(1.0, 0.5), parte=f'correa {parte} {ctx.lado(sx)} {j}',
                              lift=0.006, fuera=0.5)
                objs.append(o)
                hbm = clay.rbox(ctx.nombre(f'hebilla {parte} {ctx.lado(sx)} {j}'), (0, 0, 0), (0.026, 0.01, 0.022), ctx.coll, metal, p=4, n=2, subsurf=1)
                P, hit = sdf.trace(f, np.array([[x + sx * 0.5, -0.04, z]]), (-sx, 0, 0), max_dist=2.0)
                if hit[0]:
                    n = sdf.normal(f, P)[0]
                    hbm.location = tuple(P[0] + n * 0.014)
                    clay.orient_to(hbm, n)
                    objs.append(ctx.pieza(hbm, hb))
                else:
                    bpy.data.objects.remove(hbm, do_unlink=True)
    return objs


def pantalon_s(ctx, principal, costura, largo='largo', holgura=0.0, tipo='tela'):
    import ropa_abajo
    with submats(ctx, 'pantalon', principal=principal, costura=costura):
        objs, f, Pn = ropa_abajo.base_pantalon(ctx, largo, holgura, tipo=tipo, bolsillos=False)
    return objs, f, Pn


def pantalon_rasgado(ctx, mat, z_corte, amp=0.035, holgura=0.01, sem=3):
    """Pantalón hecho jirones a media pierna (SDF propia, amarrado como el pantalón: pelvis y piernas)."""
    import ropa_abajo
    Pn = ropa_abajo.dims_pantalon(ctx, 'largo', holgura)
    base = ropa_abajo.pantalon_sdf(Pn)

    def f(P):
        return np.maximum(base(P), (z_corte + jag(P, amp, 16, sem, dientes=amp * 0.6, freq=60)) - P[:, 2])
    lo, hi = Pn['bounds']
    o = ropa.malla(ctx, 'pantalon jirones', f, lo, hi, mat, None, modo='pantalon')
    return o, f, Pn


def corona_s(ctx, oro, gema, ladeo=7.0, puntas=5, rota=1, alto=0.24, r=0.45, perlas=None):
    """Corona vieja y abollada: aro grabado, puntas planas (una rota) y gemas opacas."""
    # se apoya donde la cabeza (con el pelo) es tan ancha como la corona
    z0 = None
    for e in np.linspace(8, 86, 80):
        ancho = max(radio_cabeza(ctx, az, e) * math.cos(math.radians(e)) for az in (0, 60, 90, 120, 180, -60, -90, -120))
        if ancho <= r * 0.96:
            z0 = ctx.hc[2] + radio_cabeza(ctx, 0, e) * math.sin(math.radians(e))
            break
    z0 = z0 if z0 is not None else ctx.hc[2] + radio_cabeza(ctx, 0, 89) - 0.09
    c = np.array([ctx.hc[0], ctx.hc[1] + 0.02, z0 - 0.03])
    Rl = sc.rot('y', ladeo) @ sc.rot('x', -5)
    rng = np.random.default_rng(4)
    # aro con abolladuras
    n = 32
    filas = []
    for z in (0.0, 0.04, 0.08, 0.12):
        fila = []
        for k in range(n + 1):
            a = 2 * math.pi * k / n
            rr = r * (1 + 0.025 * math.sin(a * 3 + 1) + 0.015 * math.sin(a * 7))
            fila.append(c + Rl @ np.array([math.cos(a) * rr, math.sin(a) * rr, z]))
        filas.append(fila)
    o = sc.lamina(ctx.nombre('aro corona sangre'), filas, ctx.coll, 0.03)
    clay.set_material(o, oro)
    clay.add_subsurf(o, 1, 1)
    ctx.pieza(o, 'cabeza')
    for zz in (0.006, 0.115):
        ring = [c + Rl @ np.array([math.cos(a) * (r + 0.02), math.sin(a) * (r + 0.02), zz]) for a in np.linspace(0, 2 * math.pi, 28, endpoint=False)]
        ctx.pieza(clay.sweep(ctx.nombre(f'moldura corona {zz}'), ring, 0.014, (1, 1), ctx.coll, oro, segments=6, samples=2, closed=True), 'cabeza')
    for kk in range(puntas):
        a = 2 * math.pi * kk / puntas - math.pi / 2
        u = np.array([math.cos(a), math.sin(a), 0.0])
        base = c + Rl @ (u * (r + 0.005) + np.array([0, 0, 0.115]))
        h = alto * (0.45 if kk == rota else (1.0 if kk % 2 == 0 else 0.8))
        tip = base + Rl @ np.array([0, 0, h]) + Rl @ (u * 0.02)
        ctx.pieza(clay.sweep(ctx.nombre(f'punta corona {kk}'), [base, (base + tip) / 2, tip], [0.075, 0.05, 0.012], (1, 0.3), ctx.coll, oro,
                             segments=6, samples=2, caps=('flat', 'point' if kk != rota else 'flat'), up=tuple(Rl @ u)), 'cabeza')
        if kk != rota:
            ctx.pieza(clay.blob(ctx.nombre(f'bola corona {kk}'), tuple(tip + Rl @ np.array([0, 0, 0.022])), (0.028, 0.028, 0.028), ctx.coll,
                                perlas or oro, n=3), 'cabeza')
        g = clay.blob(ctx.nombre(f'gema corona {kk}'), tuple(c + Rl @ (u * (r + 0.035) + np.array([0, 0, 0.06]))), (0.038, 0.038, 0.038), ctx.coll, gema, n=3)
        ctx.pieza(g, 'cabeza')
    del rng


def sombrero_paja(ctx, paja, cinta, r_ala=0.98, alto=0.27, roto=True):
    """Sombrero de paja de ala ancha con el borde deshilachado y una cinta oscura."""
    import ropa_accesorios as ra
    rng = np.random.default_rng(9)
    bocados = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.05, 0.12)) for _ in range(5)]

    def deformar(co):
        v = np.array(co)
        rr = math.hypot(v[0], v[1])
        if rr > r_ala * 0.7:
            a = math.atan2(v[1], v[0])
            caida = 0.05 * math.sin(a * 2 + 0.6) + 0.025 * math.sin(a * 5)
            if roto:
                for b, prof in bocados:
                    da = (a - b + math.pi) % (2 * math.pi) - math.pi
                    if abs(da) < 0.18:
                        s = (1 - abs(da) / 0.18)
                        v[0] *= 1 - prof * s * (rr - r_ala * 0.7) / rr
                        v[1] *= 1 - prof * s * (rr - r_ala * 0.7) / rr
            v[2] += -caida * (rr - r_ala * 0.7) / (r_ala * 0.3) * 0.7
        return Vector(tuple(v))
    perfil = [(0.0, alto), (0.4, alto - 0.01), (0.5, alto * 0.75), (0.53, 0.0)]
    c, ala, copa = ra.ala_y_copa(ctx, paja, paja, r_ala=r_ala, alto=alto, r_copa=0.55, grosor=0.035, caida=0.05, deformar=deformar,
                                 copa_perfil=perfil)
    ring = [c + np.array([math.cos(a) * 0.545, math.sin(a) * 0.545, 0.07]) for a in np.linspace(0, 2 * math.pi, 32, endpoint=False)]
    ctx.pieza(clay.sweep(ctx.nombre('cinta sombrero'), ring, 0.045, (0.3, 1.0), ctx.coll, cinta, segments=6, samples=2, closed=True), 'cabeza')
    # pajas sueltas en el borde
    for k in range(14):
        a = rng.uniform(0, 2 * math.pi)
        p0 = c + np.array([math.cos(a) * (r_ala - 0.04), math.sin(a) * (r_ala - 0.04), 0.0])
        p1 = p0 + np.array([math.cos(a + rng.uniform(-0.4, 0.4)) * 0.09, math.sin(a + rng.uniform(-0.4, 0.4)) * 0.09, -0.03 - rng.uniform(0, 0.04)])
        ctx.pieza(clay.sweep(ctx.nombre(f'paja suelta {k}'), [p0, p1], 0.008, (1, 1), ctx.coll, paja, segments=4, samples=1, caps=('flat', 'point')),
                  'cabeza')
    return c


def eslabones(ctx, a, d, n, mat, hueso, r=0.045, grosor=0.013, parte='eslabon', caida=(0, 0, -1)):
    """Cadena de n eslabones desde a en la dirección d (alternando de plano)."""
    d = unidad(d)
    cai = unidad(caida)
    p = np.asarray(a, float)
    for i in range(n):
        dirk = unidad(d * (1 - i / max(n, 1)) + cai * (i / max(n, 1)) * 1.4)
        c = p + dirk * r * 0.95
        lat = unidad(np.cross(dirk, [0, 0, 1]) if abs(dirk[2]) < 0.9 else np.cross(dirk, [1, 0, 0]))
        if i % 2:
            lat = unidad(np.cross(dirk, lat))
        pts = [c + dirk * math.cos(t) * r + lat * math.sin(t) * r * 0.62 for t in np.linspace(0, 2 * math.pi, 10, endpoint=False)]
        ctx.pieza(clay.sweep(ctx.nombre(f'{parte} {i}'), pts, grosor, (1, 1), ctx.coll, mat, segments=6, samples=2, closed=True), hueso)
        p = c + dirk * r * 0.95


def grillete(ctx, centro, eje, r, mat, hueso, parte='grillete', cadena=3, caida=(0, 0, -1), ancho=0.05, r_eslabon=0.045):
    """Argolla gruesa de hierro con bisagra y remaches, y un trozo de cadena rota colgando."""
    eje = unidad(eje)
    u = unidad(np.cross(eje, [0, 0, 1]) if abs(eje[2]) < 0.9 else np.cross(eje, [1, 0, 0]))
    w = np.cross(eje, u)
    c = np.asarray(centro, float)
    filas = []
    for z in (-ancho / 2, ancho / 2):
        filas.append([c + eje * z + (u * math.cos(t) + w * math.sin(t)) * r for t in np.linspace(0, 2 * math.pi, 25)])
    o = sc.lamina(ctx.nombre(parte), filas, ctx.coll, 0.032)
    clay.set_material(o, mat)
    clay.add_subsurf(o, 1, 1)
    ctx.pieza(o, hueso)
    for s in (-1, 1):
        ring = [c + eje * s * ancho * 0.5 + (u * math.cos(t) + w * math.sin(t)) * (r + 0.012) for t in np.linspace(0, 2 * math.pi, 20, endpoint=False)]
        ctx.pieza(clay.sweep(ctx.nombre(f'{parte} borde {s}'), ring, 0.011, (1, 1), ctx.coll, mat, segments=5, samples=2, closed=True), hueso)
    for k in range(4):
        t = k * math.pi / 2 + 0.4
        p = c + (u * math.cos(t) + w * math.sin(t)) * (r + 0.02)
        ctx.pieza(clay.blob(ctx.nombre(f'{parte} remache {k}'), tuple(p), (0.016, 0.016, 0.016), ctx.coll, mat, n=2), hueso)
    # argollita y cadena
    abajo = unidad(np.asarray(caida, float) - (np.asarray(caida, float) @ eje) * eje)
    p0 = c + abajo * (r + 0.03)
    ctx.pieza(clay.blob(ctx.nombre(f'{parte} argolla'), tuple(p0), (0.03, 0.03, 0.03), ctx.coll, mat, n=3), hueso)
    if cadena:
        eslabones(ctx, p0, abajo, cadena, mat, hueso, parte=f'{parte} cadena', caida=caida, r=r_eslabon, grosor=r_eslabon * 0.3)


def muneca(ctx, sx):
    j, d, A = brazo(ctx, sx)
    return j + d * (A['wrist_t'] - 0.035), d, A['r'][1]


def tobillo(ctx, sx):
    x = sx * ctx.D['shoe']['x']
    return np.array([x, 0.0, 0.27 if ctx.el else 0.3])


def capa_rasgada(ctx, mat, zbot=0.24, ancho0=0.36, ancho1=0.86, cols=17, filas=12, rasgado=0.1, huecos_n=3, sem=2, cuello=None, parte='capa sangre'):
    """Capa larga desde los hombros con el ruedo hecho jirones y algunos huecos (amarrada al torso)."""
    from ropa_accesorios import atras_y
    rng = np.random.default_rng(sem)
    T = ctx.D['torso']
    nc = ctx.D['neck_hole'][0]
    ztop = nc[2] - 0.03
    corte = [zbot + rasgado * (0.5 + 0.5 * math.sin(j * 1.7 + sem)) * rng.uniform(0.4, 1.4) for j in range(cols)]
    verts = []
    for i in range(filas):
        t = i / (filas - 1)
        for j in range(cols):
            u = j / (cols - 1) * 2 - 1
            a = u * math.radians(82 - 18 * t)
            zb = corte[j] if 0 < j < cols - 1 else corte[j] + rasgado
            z = ztop + (zb - ztop) * t
            ancho = ancho0 + (ancho1 - ancho0) * t ** 0.8
            y = atras_y(ctx, z if not ctx.el else None) - 0.05 + 0.12 * t + 0.3 * (1 - math.cos(a)) * (0.5 - 0.4 * t) + 0.035 * math.sin(u * 8 + t * 3) * t
            x = math.sin(a) * ancho
            if t < 0.15:
                y += (1 - t / 0.15) * -0.1 * math.cos(a)
            verts.append((x, y + 0.12 * t, z))
    faces = []
    agujeros = set()
    for _ in range(huecos_n):
        i0, j0 = int(rng.integers(filas // 2, filas - 2)), int(rng.integers(2, cols - 3))
        agujeros.add((i0, j0))
        if rng.random() < 0.6:
            agujeros.add((i0 + 1, j0))
    for i in range(filas - 1):
        for j in range(cols - 1):
            if (i, j) in agujeros:
                continue
            a = i * cols + j
            faces.append((a, a + cols, a + cols + 1, a + 1))
    o = clay.make_mesh_object(ctx.nombre(parte), verts, faces, ctx.coll, material=mat)
    clay.add_solidify(o, 0.022, offset=0.0)
    clay.add_subsurf(o, 1, 2)
    ctx.pieza(o, 'torso')
    return o, ztop


# ---------------------------------------------------------------------------
# Mugre en los vértices (multiplica el color del material)
# ---------------------------------------------------------------------------

def ensuciar(ctx, objs, perfil, extra_bvh=()):
    barro = perfil.get('barro', 0.4)
    mugre = perfil.get('mugre', 0.35)
    sangre = perfil.get('sangre', 0.0)
    hollin = perfil.get('hollin', 0.0)
    verts, polys = [], []
    for o in list(objs) + list(extra_bvh):
        if o.type != 'MESH':
            continue
        mw = o.matrix_world
        b = len(verts)
        verts += [mw @ v.co for v in o.data.vertices]
        polys += [[b + i for i in p.vertices] for p in o.data.polygons]
    b = len(verts)
    verts += [Vector((-6, -6, -0.002)), Vector((6, -6, -0.002)), Vector((6, 6, -0.002)), Vector((-6, 6, -0.002))]
    polys.append([b, b + 1, b + 2, b + 3])
    bvh = BVHTree.FromPolygons(verts, polys)
    dirs = sc._dirs_hemisferio(10)
    alcance = 0.3
    for o in objs:
        if o.type != 'MESH':
            continue
        me = o.data
        nv = len(me.vertices)
        if nv == 0:
            continue
        mw = np.array(o.matrix_world)
        co = np.array([v.co for v in me.vertices]) @ mw[:3, :3].T + mw[:3, 3]
        nrm = np.array([v.normal for v in me.vertices]) @ mw[:3, :3].T
        nrm /= np.maximum(np.linalg.norm(nrm, axis=1), 1e-9)[:, None]
        cav, cvx = sc._curvatura(me, co, nrm)
        ao = np.ones(nv)
        for vi in range(nv):
            n = nrm[vi]
            a = np.array([1.0, 0, 0]) if abs(n[0]) < 0.9 else np.array([0, 1.0, 0])
            u = np.cross(n, a)
            u /= np.linalg.norm(u)
            w = np.cross(n, u)
            org = Vector(co[vi] + n * 0.006)
            occ = 0.0
            for d in dirs:
                hit = bvh.ray_cast(org, Vector(u * d[0] + w * d[1] + n * d[2]), alcance)
                if hit[0] is not None:
                    occ += 1.0 - 0.6 * hit[3] / alcance
            ao[vi] = 1 - occ / len(dirs)
        m = np.ones((nv, 3))
        m *= (0.42 + 0.58 * sc.smooth(0.0, 0.85, ao))[:, None]
        m *= (1 - 0.35 * cav)[:, None]
        g = sc.smooth(0.42, 0.78, sc.fbm(co, 3.5, 4, 5)) * mugre
        m = sc.mezclar(m, m * np.array([0.72, 0.64, 0.55]), g)
        zb = sc.smooth(0.55, 0.08, co[:, 2] + (sc.fbm(co, 4, 3, 8) - 0.5) * 0.25) * barro
        m = sc.mezclar(m, m * np.array([0.55, 0.42, 0.3]), np.clip(zb, 0, 0.9))
        if sangre:
            s = sc.smooth(1 - sangre * 0.5, 1 - sangre * 0.5 + 0.06, sc.fbm(co, 3.0, 4, 21))
            m = sc.mezclar(m, m * np.array([0.42, 0.07, 0.06]), np.clip(s, 0, 0.9))
        if hollin:
            s = sc.smooth(0.5, 0.75, sc.fbm(co, 2.5, 4, 31)) * hollin
            m = sc.mezclar(m, m * np.array([0.35, 0.33, 0.32]), np.clip(s, 0, 0.85))
        m = np.clip(m, 0, 1)
        attr = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        attr.data.foreach_set('color', np.concatenate([m, np.ones((nv, 1))], 1).ravel())
        me.color_attributes.active_color = attr


def mugre_en_render(objs):
    """Para los renders: el color de los vértices multiplica el del material (como en el juego)."""
    hechos = set()
    for o in objs:
        if o.type != 'MESH':
            continue
        for s in o.material_slots:
            m = s.material
            if m is None or m.name in hechos or not m.use_nodes:
                continue
            hechos.add(m.name)
            nt = m.node_tree
            b = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if b is None:
                continue
            vc = nt.nodes.new('ShaderNodeVertexColor')
            vc.layer_name = 'Col'
            mix = nt.nodes.new('ShaderNodeMix')
            mix.data_type = 'RGBA'
            mix.blend_type = 'MULTIPLY'
            mix.inputs['Factor'].default_value = 1.0
            a_sock = [k for k in mix.inputs if k.identifier == 'A_Color'][0]
            b_sock = [k for k in mix.inputs if k.identifier == 'B_Color'][0]
            base = b.inputs['Base Color']
            if base.is_linked:
                src = base.links[0].from_socket
                nt.links.remove(base.links[0])
                nt.links.new(src, a_sock)
            else:
                a_sock.default_value = base.default_value
            nt.links.new(vc.outputs['Color'], b_sock)
            nt.links.new([k for k in mix.outputs if k.identifier == 'Result_Color'][0], base)


# ---------------------------------------------------------------------------
# MONARCA · rey o reina sin reino: corona abollada, manto raído con armiño, jubón de terciopelo
# ---------------------------------------------------------------------------

@traje('monarca', 'Monarca', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.45, mugre=0.25))
def monarca(ctx):
    vino = ctx.m('terciopelo', '#5A1622', tipo='tela')
    oro = ctx.m('oro viejo', '#A07A34', tipo='metal', rough=0.38)
    oro_t = ctx.m('bordado oro', '#B48B3E', tipo='lisa')
    manto = ctx.m('manto', '#3A1030', tipo='tela')
    armino = ctx.m('arminio', '#D8CCB4', tipo='peluche')
    motas = ctx.m('motas arminio', '#1C1716', tipo='lisa')
    cuero = ctx.m('cuero', '#2A1C15', tipo='lisa', rough=0.6)
    suela = ctx.m('suela', '#1A1311', tipo='lisa')
    gema = ctx.m('gema', '#6E0D16', tipo='brillo')
    calzas = ctx.m('calzas', '#26201E', tipo='tela')
    D = ctx.D
    T = D['torso']
    largo = 0.1 if ctx.el else 0.06
    t, f = ropa.torso(ctx, 'torso jubon', vino, crecer=0.03, largo=largo, cuello=1.05,
                      extra=rasgar_abajo(T['bottom'] - largo + 0.025, 0.012, 18, 3))
    z_ruedo = T['bottom'] - largo + 0.05
    ruedo(ctx, f, z_ruedo, oro_t, 'ruedo jubon', grosor=0.024)
    # Franja bordada al frente con botones de oro
    nc = D['neck_hole'][0]
    pts = frente(ctx, f, [(0.0, z) for z in np.linspace(nc[2] - 0.06, z_ruedo + 0.02, 6)], lift=0.004)
    if len(pts) >= 3:
        ctx.pieza(clay.sweep(ctx.nombre('franja jubon'), pts, 0.05, (1.0, 0.25), ctx.coll, oro_t, segments=6, samples=3,
                             up_fn=lambda q, f=f: sdf.normal(f, np.array([q]))[0]), 'torso')
    ropa.botones(ctx, f, [(0.0, z) for z in np.linspace(nc[2] - 0.1, z_ruedo + 0.06, 5)], oro, r=0.02)
    # Emblema: medallón de oro con una gema
    med = clay.blob(ctx.nombre('medallon'), (0, 0, 0), (0.075, 0.018, 0.075), ctx.coll, oro, n=4)
    en_superficie(ctx, f, -0.2, T['c'][2] + 0.05, med, 'torso', lift=0.02)
    g = clay.blob(ctx.nombre('gema medallon'), (0, 0, 0), (0.03, 0.02, 0.03), ctx.coll, gema, n=3)
    en_superficie(ctx, f, -0.2, T['c'][2] + 0.05, g, 'torso', lift=0.04)
    # Mangas largas con hombreras abullonadas acuchilladas y puños de oro
    for sx in (-1, 1):
        A = D['arm']
        o, fm, (b, d) = manga_s(ctx, sx, A['wrist_t'] - 0.03, (0.04, 0.035), vino, nombre='manga jubon')
        anillo_en(ctx, fm, b - d * 0.025, d, oro_t, ctx.hueso_lado('brazo', sx), grosor=0.026, parte=f'puno jubon {ctx.lado(sx)}', fuera=0.5)
        j, d2, _ = brazo(ctx, sx)
        c = j + d2 * 0.05
        ctx.pieza(clay.blob(ctx.nombre(f'abullonado {ctx.lado(sx)}'), tuple(c), (0.175, 0.17, 0.16), ctx.coll, vino, n=6), ctx.hueso_lado('brazo', sx))
        for k in range(5):
            a = -1.2 + k * 0.6
            q0 = c + np.array([sx * 0.04, 0, 0]) + np.array([sx * math.cos(a) * 0.15, math.sin(a) * 0.16, 0.06])
            q1 = c + np.array([sx * math.cos(a) * 0.17, math.sin(a) * 0.17, -0.08])
            ctx.pieza(clay.sweep(ctx.nombre(f'cuchillada {ctx.lado(sx)} {k}'), [q0, (q0 + q1) / 2 + np.array([sx * 0.02, 0, 0]), q1], 0.022, (1, 0.5),
                                 ctx.coll, oro_t, segments=5, samples=2), ctx.hueso_lado('brazo', sx))
    # Cinturón con hebilla y cadena de mando con colgante
    cinturon(ctx, f, z_ruedo + 0.07, cuero, oro)
    pts = frente(ctx, f, [(-0.26, nc[2] - 0.04), (-0.17, nc[2] - 0.17), (0.0, nc[2] - 0.24), (0.17, nc[2] - 0.17), (0.26, nc[2] - 0.04)], lift=0.02)
    if len(pts) >= 4:
        ctx.pieza(clay.sweep(ctx.nombre('cadena mando'), pts, 0.017, (1, 1), ctx.coll, oro, segments=6, samples=4), 'torso')
        for k, p in enumerate(pts[1:-1]):
            ctx.pieza(clay.blob(ctx.nombre(f'eslabon mando {k}'), tuple(p), (0.03, 0.02, 0.03), ctx.coll, oro, n=2), 'torso')
    # Manto raído y cuello de armiño
    capa_rasgada(ctx, manto, zbot=0.2, rasgado=0.12, huecos_n=4, sem=3)
    cuello_f = sdf.ellipsoid((0, T['c'][1] + 0.01, nc[2] - 0.035), (0.37, 0.3, 0.09))
    cuello_f2 = sf_restar(cuello_f, sdf.ellipsoid((0, T['c'][1] - 0.02, nc[2] + 0.02), (0.2, 0.17, 0.13)))
    col = ropa.malla(ctx, 'cuello arminio', sc_ruido(cuello_f2, 0.012, 22), (-0.5, -0.45, nc[2] - 0.2), (0.5, 0.5, nc[2] + 0.15), armino, 'torso')
    del col
    rng = np.random.default_rng(5)
    for k in range(16):
        a = 2 * math.pi * k / 16 + rng.uniform(-0.1, 0.1)
        dirr = np.array([math.sin(a), -math.cos(a), 0.35])
        P, hit = sdf.trace(cuello_f2, np.array([(0, T['c'][1], nc[2] - 0.03) + dirr * 1.0]), -unidad(dirr), max_dist=2.0)
        if hit[0]:
            ctx.pieza(clay.blob(ctx.nombre(f'mota arminio {k}'), tuple(P[0]), (0.016, 0.016, 0.032), ctx.coll, motas, n=2), 'torso')
    for sx in (-1, 1):
        ctx.pieza(clay.blob(ctx.nombre(f'broche manto {sx}'), (sx * 0.27, T['c'][1] - T['half'][1] - 0.01, nc[2] - 0.09), (0.05, 0.022, 0.05), ctx.coll, oro,
                            n=3), 'torso')
    # Abajo: calzas y botas altas (Él) o falda larga de terciopelo (Ella)
    if ctx.el:
        pantalon_s(ctx, '#26201E', '#3A302C')
    else:
        import ropa_abajo
        top = T['bottom'] + 0.06
        o, ff = ropa_abajo.falda(ctx, top, 0.13, T['half'][0] + 0.03, 0.64, vino, parte='falda reina', pliegues=14)
        ruedo(ctx, ff, 0.17, oro_t, 'ruedo falda reina', grosor=0.024, hueso='pelvis')
    del calzas
    botas_altas(ctx, cuero, suela, metal=oro, hebillas=1)
    corona_s(ctx, oro, gema, ladeo=8 if ctx.el else -6, rota=1, alto=0.24 if ctx.el else 0.27,
             perlas=ctx.m('perla', '#D8D0C0', tipo='brillo') if not ctx.el else None)


def sf_restar(f, g, k=0.0):
    return sdf.subtract(f, g, k)


def sc_ruido(f, amp, esc):
    return sc.sdf_ruido(f, amp, esc, 3, 3)


# ---------------------------------------------------------------------------
# CAMPESINO(A) · sombrero de paja, camisa de lino remendada, chaleco de lana, polainas de tela
# ---------------------------------------------------------------------------

@traje('campesino', 'Campesino', oculta=('arriba', 'abajo', 'pies', 'copete', 'medias'), mugre=dict(barro=0.9, mugre=0.5))
def campesino(ctx):
    lino = ctx.m('lino', '#A79A7C', tipo='tela')
    lana = ctx.m('chaleco lana', '#4B3A2B', tipo='rib')
    pardo = ctx.m('pantalon pardo', '#5A4532', tipo='tela')
    parche1 = ctx.m('parche verde', '#4A5236', tipo='tela')
    parche2 = ctx.m('parche rojizo', '#7A4A34', tipo='tela')
    hilo = ctx.m('hilo', '#2A221C', tipo='lisa')
    cuerda = ctx.m('cuerda', '#8A7450', tipo='rib')
    cuero = ctx.m('cuero', '#3A2A1E', tipo='lisa', rough=0.65)
    suela = ctx.m('suela', '#211814', tipo='lisa')
    paja = ctx.m('paja', '#B89A55', tipo='rib')
    cinta = ctx.m('cinta sombrero', '#2C2420', tipo='tela')
    panuelo = ctx.m('panuelo', '#6E2A22', tipo='tela')
    delantal = ctx.m('delantal', '#9C8F72', tipo='tela')
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    t, f = ropa.torso(ctx, 'torso camisa lino', lino, crecer=0.02, largo=0.05, cuello=1.1,
                      extra=rasgar_abajo(T['bottom'] - 0.03, 0.015, 16, 1))
    # Mangas remangadas hasta el codo, con el rollo grueso
    for sx in (-1, 1):
        o, fm, (b, d) = manga_s(ctx, sx, 0.15, (0.045, 0.045), lino, nombre='manga lino')
        anillo_en(ctx, fm, b - d * 0.03, d, lino, ctx.hueso_lado('brazo', sx), grosor=0.04, prof=(1, 1.2), parte=f'remango {ctx.lado(sx)}', fuera=0.5)
    # Chaleco de lana abierto adelante, con el ruedo gastado
    abre = sdf.round_box((0, -0.5, T['c'][2]), (0.11, 0.3, 0.5), 0.04)

    def chal(P, d):
        d = np.maximum(d, -abre(P))
        return np.maximum(d, (T['bottom'] + 0.04 + jag(P, 0.012, 20, 4)) - P[:, 2])
    tc, fc = ropa.torso(ctx, 'torso chaleco lana', lana, crecer=0.05, largo=0.0, cuello=1.25, extra=chal)
    remiendo(ctx, fc, 0.18, T['c'][2] - 0.02, 0.07, 0.06, parche2, hilo, atras=True, girar=12, parte='parche chaleco')
    remiendo(ctx, fc, -0.27, T['c'][2] - 0.08, 0.055, 0.05, parche1, hilo, girar=-10, parte='parche chaleco frente')
    # Cordones del escote de la camisa
    for k in range(3):
        z = nc[2] - 0.08 - k * 0.05
        pts = frente(ctx, f, [(-0.05, z), (0.0, z - 0.02), (0.05, z)], lift=0.01)
        if len(pts) == 3:
            ctx.pieza(clay.sweep(ctx.nombre(f'cordon escote {k}'), pts, 0.008, (1, 1), ctx.coll, cuerda, segments=4, samples=2), 'torso')
    # Pañuelo al cuello con nudo
    anillo_en(ctx, f, (0, T['c'][1], nc[2] - 0.02), (0, 0, 1), panuelo, 'torso', grosor=0.045, prof=(1, 0.8), parte='panuelo', fuera=1.0, lift=0.02)
    p = frente(ctx, f, [(0.06, nc[2] - 0.05)], lift=0.05)
    if p:
        p = p[0]
        ctx.pieza(clay.blob(ctx.nombre('nudo panuelo'), tuple(p), (0.045, 0.035, 0.04), ctx.coll, panuelo, n=3), 'torso')
        for k, dx in enumerate((-0.02, 0.035)):
            ctx.pieza(clay.sweep(ctx.nombre(f'punta panuelo {k}'), [p, p + np.array([dx, -0.03, -0.08]), p + np.array([dx * 1.6, -0.035, -0.15])],
                                 [0.03, 0.035, 0.005], (1, 0.35), ctx.coll, panuelo, segments=5, samples=2, caps=('flat', 'point')), 'torso')
    # Cuerda de cinturón con morral de cuero
    zc = T['bottom'] + 0.03
    anillo_en(ctx, f, (0, T['c'][1], zc), (0, 0, 1), cuerda, 'torso', grosor=0.018, parte='cuerda cinto', fuera=1.2, lift=0.02, n=32)
    P, hit = sdf.trace(f, np.array([[0.6, -0.05, zc - 0.06]]), (-1, 0, 0), max_dist=2.0)
    if hit[0]:
        q = P[0] + np.array([0.06, 0, 0])
        ctx.pieza(clay.rbox(ctx.nombre('morral'), tuple(q + np.array([0, 0, -0.06])), (0.05, 0.1, 0.09), ctx.coll, cuero, p=3, n=4, subsurf=1), 'pelvis')
        ctx.pieza(clay.rbox(ctx.nombre('tapa morral'), tuple(q + np.array([0.012, 0, 0.0])), (0.05, 0.105, 0.04), ctx.coll, cuero, p=3, n=3, subsurf=1),
                  'pelvis')
    if ctx.el:
        objs, fp, Pn = pantalon_s(ctx, '#5A4532', '#3A2C20', holgura=0.01)
        for sx in (-1, 1):
            c = np.array(Pn['leg_bot']) * np.array([sx, 1, 1])
            remiendo(ctx, fp, c[0] + sx * 0.02, 0.3, 0.06, 0.055, parche1 if sx < 0 else parche2, hilo, hueso=ctx.hueso_lado('pierna', sx), girar=8 * sx,
                     parte=f'parche rodilla {ctx.lado(sx)}')
    else:
        import ropa_abajo
        top = T['bottom'] + 0.06
        o, ff = ropa_abajo.falda(ctx, top, 0.2, T['half'][0] + 0.03, 0.6, pardo, parte='falda campesina', pliegues=12)
        remiendo(ctx, ff, -0.32, 0.35, 0.07, 0.06, parche1, hilo, hueso='pelvis', girar=-6, parte='parche falda')
        remiendo(ctx, ff, 0.3, 0.42, 0.06, 0.05, parche2, hilo, hueso='pelvis', atras=True, parte='parche falda atras')
        # delantal
        dl = sdf.round_box((0, -0.55, 0.4), (0.3, 0.28, 0.2), 0.03)
        fd = sdf.intersect(sdf.subtract(sc.sdf_ruido(lambda P: ff(P) - 0.02, 0.004, 25), lambda P: ff(P) + 0.01), dl)
        ropa.malla(ctx, 'delantal', fd, (-0.5, -0.8, 0.1), (0.5, 0.0, 0.7), delantal, 'pelvis')
    # Polainas de tela cruzadas con cordón y zapatos bajos de cuero
    botas_altas(ctx, cuero, suela, alto=0.22, doblez=False)
    for sx in (-1, 1):
        x = sx * ctx.D['shoe']['x']
        r = (0.235 if ctx.el else 0.215) + 0.01
        z0, z1 = 0.2, (0.42 if ctx.el else 0.5)
        cil = sdf.round_cone((x, 0.0, z0), (x, 0.01, z1), r * 0.9, r)
        fpol = lambda P, cil=cil, z0=z0, z1=z1: sdf.smax(sdf.smax(cil(P), z0 - P[:, 2], 0.01), P[:, 2] - z1, 0.01)
        ropa.malla(ctx, f'polaina {ctx.lado(sx)}', fpol, (x - 0.4, -0.4, z0 - 0.1), (x + 0.4, 0.4, z1 + 0.1), lino, ctx.hueso_lado('pierna', sx))
        pts = []
        for k in range(26):
            tt = k / 25
            a = tt * 2 * math.pi * 3.3
            z = z0 + 0.02 + (z1 - z0 - 0.04) * tt
            rr = r * (0.9 + 0.1 * tt) + 0.012
            pts.append((x + math.cos(a) * rr, 0.005 + math.sin(a) * rr, z + 0.03 * math.sin(a)))
        ctx.pieza(clay.sweep(ctx.nombre(f'cordon polaina {ctx.lado(sx)}'), pts, 0.011, (1, 1), ctx.coll, cuerda, segments=5, samples=2),
                  ctx.hueso_lado('pierna', sx))
    sombrero_paja(ctx, paja, cinta)


# ---------------------------------------------------------------------------
# PRISIONERO(A) · harapos de costal, grilletes con la cadena rota, pies vendados
# ---------------------------------------------------------------------------

@traje('prisionero', 'Prisionero', oculta=('arriba', 'abajo', 'pies', 'medias'), mugre=dict(barro=1.0, mugre=0.75, sangre=0.35))
def prisionero(ctx):
    costal = ctx.m('costal', '#7A6A4C', tipo='rib')
    costal2 = ctx.m('costal oscuro', '#5C4E38', tipo='rib')
    hierro = ctx.m('hierro', '#6A6C72', tipo='metal', rough=0.5)
    venda = ctx.m('vendas', '#9A8E74', tipo='tela')
    cuerda = ctx.m('cuerda', '#6E5A3E', tipo='rib')
    trapo = ctx.m('trapo cabeza', '#5A2420', tipo='tela')
    D = ctx.D
    T = D['torso']
    nc = D['neck_hole'][0]
    largo = 0.14 if ctx.el else 0.0
    hz = T['bottom'] - largo
    # Túnica de costal con el ruedo hecho jirones y huecos
    extra = encadenar(rasgar_abajo(hz + 0.03, 0.04, 12, 2, dientes=0.035),
                      huecos([((-0.24, T['c'][1] - T['half'][1], T['c'][2] - 0.04), (0.07, 0.06, 0.06)),
                              ((0.2, T['c'][1] + T['half'][1], T['c'][2] + 0.04), (0.09, 0.07, 0.07)),
                              ((0.36, T['c'][1], T['bottom'] + 0.02), (0.06, 0.08, 0.06))], sem=7))
    t, f = ropa.torso(ctx, 'torso tunica costal', costal, crecer=0.026, largo=largo, cuello=1.15, extra=extra)
    for sx in (-1, 1):
        manga_s(ctx, sx, 0.11, (0.05, 0.05), costal, rasgado=0.03, sem=4 + sx, nombre='manga costal')
    # Remiendos burdos con cuerda
    for k, (x, z, atras) in enumerate(((0.15, T['c'][2] + 0.08, False), (-0.12, T['c'][2] - 0.1, True))):
        remiendo(ctx, f, x, z, 0.06, 0.05, costal2, cuerda, atras=atras, girar=15 - 30 * k, parte=f'remiendo costal {k}')
    anillo_en(ctx, f, (0, T['c'][1], T['bottom'] + 0.04), (0, 0, 1), cuerda, 'torso', grosor=0.02, parte='cuerda cintura', fuera=1.2, lift=0.02, n=32)
    # Collar de hierro con argolla
    cuello_c = np.array([0, T['c'][1], nc[2] + 0.005])
    filas = [[cuello_c + np.array([math.cos(a) * 0.235, math.sin(a) * 0.205, z]) for a in np.linspace(0, 2 * math.pi, 25)] for z in (-0.02, 0.035)]
    o = sc.lamina(ctx.nombre('collar hierro'), filas, ctx.coll, 0.03)
    clay.set_material(o, hierro)
    clay.add_subsurf(o, 1, 1)
    ctx.pieza(o, 'torso')
    pa = cuello_c + np.array([0, -0.235, -0.03])
    ctx.pieza(clay.blob(ctx.nombre('argolla collar'), tuple(pa), (0.035, 0.03, 0.035), ctx.coll, hierro, n=3), 'torso')
    eslabones(ctx, pa + np.array([0, -0.01, -0.02]), (0, -0.3, -1), 2, hierro, 'torso', parte='cadena collar')
    # Grilletes en las muñecas y los tobillos, con la cadena rota colgando
    for sx in (-1, 1):
        c, d, r = muneca(ctx, sx)
        grillete(ctx, c, d, r + 0.045, hierro, ctx.hueso_lado('brazo', sx), parte=f'grillete mano {ctx.lado(sx)}', cadena=4 if sx < 0 else 3,
                 caida=(0, 0, -1), ancho=0.075, r_eslabon=0.055)
    # Pantalón hecho jirones (Él) o solo la túnica larga (Ella, con las piernas a la vista)
    if ctx.el:
        pantalon_rasgado(ctx, costal2, 0.28, amp=0.04)
    for sx in (-1, 1):
        x = sx * ctx.D['shoe']['x']
        k = ctx.D['shoe'].get('scale', 1.0)
        import ropa_pies
        up = ropa_pies.empeine(x, k, alto=1.0, abierto=False)
        tob = sdf.round_cone((x, 0.0, 0.1), (x, 0.0, 0.36 if ctx.el else 0.3), 0.17 * k, 0.15 * k)
        fp = sc.sdf_ruido(lambda Q, up=up, tob=tob: sdf.smin(up(Q), tob(Q), 0.05), 0.008, 30, 2, 3)
        ropa.malla(ctx, f'pie vendado {ctx.lado(sx)}', fp, (x - 0.35, -0.45, -0.05), (x + 0.35, 0.35, 0.5), venda, ctx.hueso_lado('pie', sx))
        pts = []
        for kk in range(30):
            tt = kk / 29
            a = tt * 2 * math.pi * 4.2
            z = 0.06 + 0.26 * tt
            rr = (0.19 if z < 0.15 else 0.165) * k
            pts.append((x + math.cos(a) * rr, -0.04 * (1 - tt) + math.sin(a) * rr * (1.3 if z < 0.15 else 1.0), z))
        ctx.pieza(clay.sweep(ctx.nombre(f'venda vuelta {ctx.lado(sx)}'), pts, 0.016, (1.4, 0.5), ctx.coll, venda, segments=5, samples=2),
                  ctx.hueso_lado('pie', sx))
        grillete(ctx, tobillo(ctx, sx) + np.array([0, 0, 0.0]), (0, 0, 1), (0.2 if ctx.el else 0.17) * k, hierro, ctx.hueso_lado('pie', sx),
                 parte=f'grillete pie {ctx.lado(sx)}', cadena=0 if sx < 0 else 2, caida=(sx * 0.6, 0.4, -0.2), ancho=0.07, r_eslabon=0.05)
        if sx < 0:
            # bola de hierro arrastrada: la cadena baja del grillete hasta el piso, por detrás
            p0 = tobillo(ctx, sx) + np.array([0, 0.2 * k, -0.03])
            bola = np.array([x - 0.05, 0.62, 0.14])
            pts = [p0 + (bola - p0) * t + np.array([0, 0, -0.1 * math.sin(math.pi * t)]) for t in np.linspace(0, 1, 7)]
            for kk in range(len(pts) - 1):
                c = (pts[kk] + pts[kk + 1]) / 2
                dd = unidad(pts[kk + 1] - pts[kk])
                lat = unidad(np.cross(dd, [0, 0, 1]))
                if kk % 2:
                    lat = unidad(np.cross(dd, lat))
                L = np.linalg.norm(pts[kk + 1] - pts[kk]) * 0.62
                anillo = [c + dd * math.cos(t) * L + lat * math.sin(t) * L * 0.6 for t in np.linspace(0, 2 * math.pi, 10, endpoint=False)]
                ctx.pieza(clay.sweep(ctx.nombre(f'cadena bola {kk}'), anillo, 0.016, (1, 1), ctx.coll, hierro, segments=6, samples=2, closed=True),
                          ctx.hueso_lado('pie', sx))
            ctx.pieza(clay.blob(ctx.nombre('bola hierro'), tuple(bola), (0.14, 0.14, 0.14), ctx.coll, hierro, n=6), ctx.hueso_lado('pie', sx))
            ctx.pieza(clay.blob(ctx.nombre('argolla bola'), tuple(bola + np.array([0, -0.12, 0.08])), (0.035, 0.03, 0.035), ctx.coll, hierro, n=3),
                      ctx.hueso_lado('pie', sx))
    # Trapo amarrado en la cabeza, con las puntas del nudo atrás
    pts = []
    for a in np.linspace(-180, 180, 30, endpoint=False):
        loc, n = punto_cabeza(ctx, a, 18 if abs(a) < 90 else 10, 0.02)
        if loc is not None:
            pts.append(loc)
    if len(pts) > 12:
        ctx.pieza(clay.sweep(ctx.nombre('trapo cabeza'), pts, 0.06, (0.35, 1.0), ctx.coll, trapo, segments=6, samples=2, closed=True,
                             up_fn=lambda q: np.array(q) - ctx.hc), 'cabeza')
        loc, n = punto_cabeza(ctx, 180, 12, 0.04)
        if loc is not None:
            ctx.pieza(clay.blob(ctx.nombre('nudo trapo'), tuple(loc), (0.06, 0.05, 0.05), ctx.coll, trapo, n=3), 'cabeza')
            for kk, dx in enumerate((-0.05, 0.06)):
                ctx.pieza(clay.sweep(ctx.nombre(f'punta trapo {kk}'), [loc, loc + np.array([dx, 0.08, -0.1]), loc + np.array([dx * 1.5, 0.1, -0.24])],
                                     [0.05, 0.04, 0.008], (1, 0.3), ctx.coll, trapo, segments=5, samples=2, caps=('flat', 'point')), 'cabeza')


# ---------------------------------------------------------------------------
# Armar, ensuciar, exportar y revisar
# ---------------------------------------------------------------------------

def aligerar(objs, total=42000, minimo=60):
    """Reparte un presupuesto de triángulos según el área de cada pieza y reduce lo que se pase (los SDF de la ropa
    salen muy densos y los barridos traen subdivisión): el traje queda liviano para 4 jugadores en el celular."""
    dg = bpy.context.evaluated_depsgraph_get()
    datos = []
    for o in objs:
        if o.type != 'MESH':
            continue
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        n = sum(len(p.vertices) - 2 for p in me.polygons)
        area = sum(p.area for p in me.polygons)
        ev.to_mesh_clear()
        datos.append((o, n, area))
    suma = sum(a for _, _, a in datos) or 1.0
    for o, n, area in datos:
        meta = max(minimo, total * area / suma)
        if n > meta * 1.15:
            dm = o.modifiers.new('Aligerar', 'DECIMATE')
            dm.decimate_type = 'COLLAPSE'
            dm.ratio = max(meta / n, 0.03)


def construir(ctx, clave):
    info = TRAJES[clave]
    ctx.clave = f'sangre_{clave}'
    ctx.coll = clay.collection(f'{ctx.N} sangre {clave}')
    ctx.m = ropa.Mats(ctx.clave, {})
    info['fn'](ctx)
    objs = [o for o in ctx.coll.objects if o.type == 'MESH']
    for o in objs:
        if o.name.lower().endswith('| pantalon') and not o.get('modo'):
            o['modo'] = 'pantalon'
        if not o.get('hueso') and not o.get('modo'):
            o['hueso'] = ropa.regla(o.name) or 'torso'
    objs = ropa.unir_por_material(objs)
    aligerar(objs, info.get('tris', 42000))
    return objs


def ocultas(ctx, oculta):
    frags = [f for r in oculta for f in ropa.OCULTA[ctx.rol].get(r, ())]
    frags += ['suciedad']
    return [o for n, o in ctx.base.items() if any(n.startswith(f) for f in frags)]


def tris(objs):
    n = 0
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        if o.type == 'MESH':
            n += sum(len(p.vertices) - 2 for p in o.data.polygons)
    del dg
    return n


def render_hoja(ctx, clave, carpeta, ocultos):
    scene = bpy.context.scene
    for o in ocultos:
        o.hide_render = True
    luces = clay.collection('SG luces trajes')
    if not luces.objects:
        sc.luces_neutras(luces, centro=(0, 0, 1.1), escala=2.4)
    rutas = []
    for k, az in enumerate((-25, 155)):
        a = math.radians(az)
        cam = escena.camera(f'cam traje {k}', (math.sin(a) * 6, -math.cos(a) * 6, 1.4 + 6 * math.tan(math.radians(22))), (0, 0, 1.4), 50)
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = 3.5
        p = os.path.join(carpeta, f'{clave}_{ctx.rol}_{k}.png')
        sc.render(scene, cam, p)
        bpy.data.objects.remove(cam, do_unlink=True)
        rutas.append(p)
    for o in ocultos:
        o.hide_render = False
    return rutas


ARMA_CLASE = {'monarca': 'espada_larga', 'campesino': 'horca', 'prisionero': 'grillete', 'caballero': 'maza', 'cazador': 'ballesta', 'herrero': 'martillo',
              'alquimista': 'frasco', 'sepulturero': 'pala', 'inquisidor': 'incensario', 'verdugo': 'hacha_verdugo', 'bruja': 'baston_cuervos', 'juglar': 'laud'}


def retrato(ctx, clave, carpeta, ocultos, res=(384, 480)):
    """Retrato de cuerpo entero (para escoger clase): luz dramática, fondo transparente y el arma de la clase en la mano."""
    import sangre_armas
    from PIL import Image
    scene = bpy.context.scene
    viejo = (scene.render.resolution_x, scene.render.resolution_y, scene.render.film_transparent)
    for o in ocultos:
        o.hide_render = True
    neutras = bpy.data.collections.get('SG luces trajes')
    if neutras:
        neutras.hide_render = True
    luces = clay.collection('SG luces retrato')
    for o in list(luces.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    # personajes de frente (miran a -Y): la luz clave viene de adelante a la izquierda y el contraluz rojo de atrás
    c = (0, 0, 1.25)
    escena.area_light('SG r clave', (-2.6, -5.2, 4.2), c, 1500, 3.0, '#FFE6CC', luces)
    escena.area_light('SG r relleno', (4.5, -3.5, 1.5), c, 350, 4.0, '#9FB8FF', luces)
    escena.area_light('SG r contra', (3.0, 4.5, 3.5), c, 1300, 2.0, '#FF5A3A', luces)
    escena.area_light('SG r contra2', (-3.2, 4.0, 2.5), c, 600, 2.0, '#FFB070', luces)
    luces.hide_render = False
    # arma en la mano derecha (el muñeco mide ~2,2 en Blender; las armas están hechas para 1 m)
    coll_a = clay.collection(f'SG arma retrato {clave}')
    arma = None
    try:
        F = sangre_armas.ARMAS[ARMA_CLASE[clave]](coll_a)
        F.construir(coll_a)
        arma = F.root
        mano = np.array(ctx.B['arm']['hand']) * np.array([1, 1, 1]) + np.array([0.04, -0.06, 0.02])
        arma.location = tuple(mano)
        # girada para que el filo mire adelante (-Y) e inclinada hacia afuera para que no se meta en la cabeza
        arma.rotation_mode = 'ZYX'
        arma.rotation_euler = (math.radians(8), math.radians(42), math.radians(180))
        arma.scale = (2.0, 2.0, 2.0)
    except Exception as e:  # sin arma, igual sale el retrato
        print('sin arma en el retrato', clave, e, flush=True)
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.film_transparent = True
    a = math.radians(-24)
    cam = escena.camera(f'cam retrato {clave}', (0.15 + math.sin(a) * 7, -math.cos(a) * 7, 1.25 + 7 * math.tan(math.radians(9))), (0.15, 0, 1.3), 50)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 3.55
    png = os.path.join(carpeta, f'_{clave}_{ctx.rol}.png')
    sc.render(scene, cam, png)
    bpy.data.objects.remove(cam, do_unlink=True)
    Image.open(png).convert('RGBA').save(os.path.join(carpeta, f'{clave}_{ctx.rol}.webp'), 'WEBP', quality=88, method=6)
    os.remove(png)
    if arma is not None:
        for o in sc.arbol(arma):
            bpy.data.objects.remove(o, do_unlink=True)
    luces.hide_render = True
    if neutras:
        neutras.hide_render = False
    scene.render.resolution_x, scene.render.resolution_y, scene.render.film_transparent = viejo
    for o in ocultos:
        o.hide_render = False


def main(out, roles, claves, hoja=None, glb=True, retratos=None):
    import importlib
    if os.path.exists(os.path.join(HERE, 'sangre_trajes2.py')):
        importlib.import_module('sangre_trajes2')
    t0 = time.time()
    scene = clay.reset_scene()
    sc.preparar_render(scene, 420, 20, transparente=False, fondo='#5A5550')
    os.makedirs(os.path.join(out, 'ropa'), exist_ok=True)
    os.makedirs(os.path.join(out, 'sangre'), exist_ok=True)
    claves = claves or list(TRAJES)
    path_json = os.path.join(out, 'sangre', 'trajes.json')
    datos = json.load(open(path_json)) if os.path.exists(path_json) else {}
    filas, etiquetas = [], []
    tmp = os.path.join(os.path.dirname(hoja), '_trajes_tmp') if hoja else None
    if tmp:
        os.makedirs(tmp, exist_ok=True)
    for rol in roles:
        ctx = ropa.Ctx(rol)
        print('base', rol, round(time.time() - t0, 1), 's', flush=True)
        for clave in claves:
            info = TRAJES[clave]
            t1 = time.time()
            objs = construir(ctx, clave)
            arm = ropa.armadura(ctx)
            ropa.piel(arm, objs, rol)
            ocu = ocultas(ctx, info['oculta'])
            visibles = [o for o in ctx.base.values() if o not in ocu]
            ensuciar(ctx, objs, info['mugre'], visibles)
            n = tris(objs)
            pesos = sorted(((sum(len(q.vertices) - 2 for q in o.data.polygons), o.name.split('| ', 1)[-1]) for o in objs if o.type == 'MESH'), reverse=True)
            print('  más pesados:', ', '.join(f'{nm} {k}' for k, nm in pesos[:12]), flush=True)
            if glb:
                ropa.exportar(arm, objs, os.path.join(out, 'ropa', f'sangre_{clave}_{rol}.glb'))
            previos = datos.get(clave, {}).get('tris', {})
            datos[clave] = dict(nombre=info['nombre'], oculta=list(info['oculta']), modelo=f'sangre_{clave}', tris=dict(previos, **{rol: n}))
            if hoja or retratos:
                mugre_en_render(objs)
            if retratos:
                os.makedirs(retratos, exist_ok=True)
                retrato(ctx, clave, retratos, ocu)
            if hoja:
                filas.append(render_hoja(ctx, clave, tmp, ocu))
                etiquetas.append(f'sangre_{clave}_{rol}  {n} tris')
            print(f'traje {clave} {rol}: {n} triángulos, {time.time() - t1:.1f} s', flush=True)
            for o in list(ctx.coll.objects):
                bpy.data.objects.remove(o, do_unlink=True)
        ctx.coll_base.hide_render = True
        for o in ctx.coll_base.objects:
            o.hide_render = True
    if glb:
        with open(path_json, 'w', encoding='utf-8') as fh:
            json.dump(datos, fh, ensure_ascii=False, indent=1)
    if hoja:
        sc.hoja_contacto(filas, hoja, etiquetas, tam=420)
        print('HOJA', hoja, flush=True)
    print('LISTO', round(time.time() - t0, 1), 's', flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    opc = [a for a in args if a.startswith('--')]
    pos = [a for a in args if not a.startswith('--')]
    hoja = None
    if '--hoja' in args:
        hoja = args[args.index('--hoja') + 1]
        pos = [a for a in pos if a != hoja]
    retratos = None
    if '--retratos' in args:
        retratos = args[args.index('--retratos') + 1]
        pos = [a for a in pos if a != retratos]
    roles = {'el': ['el'], 'ella': ['ella'], 'ambos': ['el', 'ella']}[pos[1] if len(pos) > 1 else 'ambos']
    claves = pos[2].split(',') if len(pos) > 2 else None
    import sangre_trajes as _st
    _st.main(pos[0], roles, claves, hoja, glb='--sin-glb' not in opc, retratos=retratos)
