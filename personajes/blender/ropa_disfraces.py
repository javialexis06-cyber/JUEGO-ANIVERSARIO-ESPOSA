"""Disfraces de pareja por rareza (Nuestro Hogar): verdes, azules, morados y dorados.

Los disfraces blancos son los de siempre (una pijama, una capucha, una colita). Estos traen mucho más
detalle según su rareza: el verde el doble, el azul el triple, el morado cinco veces y el dorado diez
(más piezas, costuras, manchas, pelitos, garras, accesorios y materiales). Cada pieza es una prenda
normal (con su ranura y sus colores) y el juego las junta en el disfraz (src/casa/catalogo.ts).

Importante con los nombres: las piezas se amarran al hueso que se les da; nunca se deja que el nombre
decida (rig.RULES busca «ojo », «boca», «mano», «manga»... dentro del nombre).
"""
import functools
import math

import numpy as np
from mathutils import Vector

import clay
import cuerpo
import sdf

import ropa
from ropa import en_superficie, ruedo
from ropa_abajo import base_enterizo
from ropa_accesorios import COP, base_cola, capucha, sobre_capucha
from ropa_arriba import V, zc
from ropa_pies import lados, pantufla


# Todas estas prendas vienen solo con su disfraz
prenda = functools.partial(ropa.prenda, exclusiva=True)

# ---------------------------------------------------------------------------
# Ayudas
# ---------------------------------------------------------------------------

def unidad(v):
    v = np.asarray(v, dtype=float)
    return v / max(np.linalg.norm(v), 1e-9)


def orientar(obj, hacia):
    """Gira el objeto (hecho mirando a +Z) para que mire hacia `hacia`."""
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(tuple(unidad(hacia))))
    return obj


def punta(v, eje=2, k=0.75):
    """Shaper: afina el blob hacia la punta positiva del eje (garras, púas, pelitos)."""
    t = np.clip(v[:, eje:eje + 1] / max(np.abs(v[:, eje]).max(), 1e-6), 0, 1)
    esc = np.ones_like(v)
    for i in range(3):
        if i != eje:
            esc[:, i:i + 1] = 1 - k * t
    return v * esc


def mano(ctx, sx):
    """Centro de la mano, dirección del brazo y radio (para garras y guantes)."""
    D = ctx.D
    A = D['arm']
    s = np.array([sx, 1, 1])
    d = cuerpo._dir(D['arm_deg'], A.get('dy', 0.08)) * s
    j = np.array(D['joint']) * s
    return j + d * A['hand_t'], d, max(A['hand'])


def garras(ctx, sx, mat, n=3, largo=0.07, grosor=0.022, nombre='garra'):
    """Garritas curvas en la punta de la mano (siguen a la mano)."""
    c, d, r = mano(ctx, sx)
    fuera = unidad(np.cross(d, (0, -1, 0)) * sx)
    out = []
    for k in range(n):
        a = (k - (n - 1) / 2) * 0.55
        dirk = unidad(d * math.cos(a * 0.4) + np.array([0, -1, 0]) * 0.35 + fuera * math.sin(a) * 0.5)
        base = c + dirk * r * 0.92
        o = clay.blob(ctx.nombre(f'{nombre} {ctx.lado(sx)} {k}'), (0, 0, 0), (grosor, grosor, largo), ctx.coll, mat, n=4,
                      shaper=lambda v: punta(v, 2, 0.8))
        o.location = tuple(base + dirk * largo * 0.6)
        orientar(o, dirk + np.array([0, 0, -0.35]))
        out.append(ctx.pieza(o, ctx.hueso_lado('mano', sx)))
    return out


def mechon(ctx, nombre, base, hacia, largo, grosor, mat, hueso, n=4):
    """Pelito de peluche (un mechón en punta)."""
    o = clay.blob(ctx.nombre(nombre), (0, 0, 0), (grosor, grosor * 0.7, largo), ctx.coll, mat, n=n, shaper=lambda v: punta(v, 2, 0.85))
    o.location = tuple(np.asarray(base) + unidad(hacia) * largo * 0.55)
    orientar(o, hacia)
    return ctx.pieza(o, hueso)


def costura(ctx, nombre, pts, mat, hueso, r=0.006):
    """Pespunte en relieve (una tirita fina sobre la tela)."""
    return ctx.pieza(clay.sweep(ctx.nombre(nombre), pts, r, (1, 0.6), ctx.coll, mat, segments=5, samples=4), hueso)


def sobre_torso(ctx, f, x, z, lift=0.0, atras=False):
    """Punto y normal sobre la tela del torso (adelante o atrás)."""
    if atras:
        P, hit = sdf.trace(f, np.array([[x, 3.0, z]]), (0, -1, 0), max_dist=6.0)
        if not hit[0]:
            return None, None
        p = P[0]
    else:
        pts = sdf.front_points(f, [(x, z)])
        if not pts:
            return None, None
        p = pts[0]
    n = sdf.normal(f, np.array([p]))[0]
    return p + n * lift, n


def linea_torso(ctx, f, xs_zs, lift=0.004, atras=False):
    pts = []
    for x, z in xs_zs:
        p, _ = sobre_torso(ctx, f, x, z, lift, atras)
        if p is not None:
            pts.append(p)
    return pts


# ---------------------------------------------------------------------------
# DORADO · Stitch (Él) y Angel (Ella)
# ---------------------------------------------------------------------------
# (el peluche aclara mucho el color: van más fuertes de lo que se ven)
AZUL_STITCH = dict(principal='#2451B3', panza='#86B3EE', marcas='#132F6E', puas='#132F6E', garras='#141A2C', costura='#6E9BE0')
ROSA_ANGEL = dict(principal='#E86FA6', panza='#F9C6DC', marcas='#A93A6E', puas='#A93A6E', garras='#5A1B38', costura='#F3A9CB')


@prenda('enterizo_stitch', 'conjunto', [V('enterizo_stitch', 'Enterizo de Stitch', **AZUL_STITCH), V('enterizo_angel', 'Enterizo de Angel', **ROSA_ANGEL)],
        precio=260)
def enterizo_stitch(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    T = ctx.D['torso']
    hx = T['half'][0]
    # Panza clarita en forma de gota invertida (del pecho al ombligo) con su borde de pelito
    panza_m = ctx.m('panza', tipo='peluche')
    panza = clay.blob(ctx.nombre('panza stitch'), (0, 0, 0), (hx * 0.62, 0.022, 0.33), ctx.coll, panza_m, n=7, p=2.3,
                      shaper=lambda v: v * np.column_stack([1 - 0.28 * np.clip(-v[:, 2] / 0.33, 0, 1), np.ones(len(v)), np.ones(len(v))]))
    objs.append(en_superficie(ctx, f, 0.0, zc(ctx, 0.45), panza, lift=0.012))
    cos = ctx.m('costura', tipo='lisa')
    borde = []
    for a in np.linspace(0, 2 * math.pi, 26):
        x = math.sin(a) * hx * 0.6 * (1 - 0.14 * max(0, -math.cos(a)))
        z = zc(ctx, 0.45) + math.cos(a) * 0.32
        p, _ = sobre_torso(ctx, f, x, z, 0.03)
        if p is not None:
            borde.append(p)
    if len(borde) > 10:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('borde panza stitch'), borde, 0.009, (1, 0.6), ctx.coll, cos, segments=5, samples=3,
                                         closed=True), 'torso'))
    # Pelitos del pecho (el mechón de Stitch) y ombliguito
    for k, (x, dz, inc) in enumerate(((-0.05, 0.0, -0.4), (0.0, 0.02, 0.0), (0.05, 0.0, 0.4))):
        p, n = sobre_torso(ctx, f, x, zc(ctx, 0.82) + dz, 0.0)
        if p is not None:
            objs.append(mechon(ctx, f'pelito pecho {k}', p, n + np.array([inc, 0, 0.9]), 0.07, 0.022, panza_m, 'torso'))
    p, n = sobre_torso(ctx, f, 0.0, zc(ctx, 0.2), 0.03)
    if p is not None:
        objs.append(ctx.pieza(clay.blob(ctx.nombre('ombligo stitch'), tuple(p), (0.014, 0.008, 0.01), ctx.coll, cos, n=4), 'torso'))
    # Manchas oscuras en la espalda y los hombros (como las rayas de la cabeza de Stitch)
    marcas = ctx.m('marcas', tipo='peluche')
    for k, (x, t, s) in enumerate(((-0.16, 0.55, 0.11), (0.16, 0.55, 0.11), (-0.1, 0.18, 0.09), (0.1, 0.18, 0.09))):
        o = clay.blob(ctx.nombre(f'mancha espalda {k}'), (0, 0, 0), (s, 0.018, s * 0.7), ctx.coll, marcas, n=6, p=2.2)
        r = en_superficie(ctx, f, x, zc(ctx, t), o, lift=0.01, atras=True)
        if r is not None:
            objs.append(r)
    # Tres púas suaves por la espalda (de peluche)
    puas = ctx.m('puas', tipo='peluche')
    for k, t in enumerate((0.62, 0.44, 0.26)):
        p, n = sobre_torso(ctx, f, 0.0, zc(ctx, t), 0.0, atras=True)
        if p is not None:
            s = 0.09 - 0.012 * k
            o = clay.blob(ctx.nombre(f'pua stitch {k}'), (0, 0, 0), (0.04, s * 0.8, s), ctx.coll, puas, n=5, shaper=lambda v: punta(v, 2, 0.7))
            o.location = tuple(p + n * s * 0.5)
            orientar(o, n + np.array([0, 0, 0.5]))
            objs.append(ctx.pieza(o, 'torso'))
    # Pespuntes laterales y del cierre (el enterizo se ve cosido de verdad)
    for sx in (-1, 1):
        pts = linea_torso(ctx, f, [(sx * hx * 0.93, zc(ctx, t)) for t in np.linspace(0.08, 0.92, 7)])
        if len(pts) > 3:
            objs.append(costura(ctx, f'pespunte lado {ctx.lado(sx)}', pts, cos, 'torso'))
    pts = linea_torso(ctx, f, [(0.0, zc(ctx, t)) for t in np.linspace(0.62, 0.95, 5)], 0.03)
    if len(pts) > 2:
        objs.append(costura(ctx, 'cierre stitch', pts, ctx.m('marcas', tipo='lisa'), 'torso', r=0.011))
    # Garritas oscuras en las manos y almohadillas en las rodillas
    gm = ctx.m('garras', tipo='brillo')
    for sx in (-1, 1):
        objs += garras(ctx, sx, gm)
        c = np.array(Pn['leg_bot']) * np.array([sx, 1, 1])
        rod = clay.blob(ctx.nombre(f'parche rodilla {ctx.lado(sx)}'), (0, 0, 0), (0.08, 0.016, 0.07), ctx.coll, marcas, n=5, p=2.4)
        o = en_superficie(ctx, fp, c[0], Pn['bottom'] + 0.13, rod, ctx.hueso_lado('pierna', sx), lift=0.012)
        if o is not None:
            objs.append(o)
    del T
    return objs


def oreja_stitch(ctx, cap, sx, mats, forma):
    """Orejota: la de Stitch sale de lado y un poco hacia atrás, ancha y con su muesca; la de Angel sube y se
    enrosca hacia atrás hasta la espalda."""
    m, dentro, marcas = mats
    if forma == 'stitch':
        # Sale del lado de la cabeza hacia afuera (plana y de frente, como las de Stitch), un poco hacia arriba
        base, n = sobre_capucha(ctx, cap, sx * 78, 38, 0.06)
        fuera = unidad(np.array([sx * 1.0, 0.12, 0.42]))
        pts = [base, base + fuera * 0.2, base + fuera * 0.44 + np.array([0, 0, 0.03]), base + fuera * 0.66 + np.array([0, 0, 0.0])]
        rad = [0.15, 0.26, 0.22, 0.05]
        ctx.pieza(clay.sweep(ctx.nombre(f'orejota {sx}'), pts, rad, (1.0, 0.32), ctx.coll, m, segments=14, samples=7, up=(0, 0, 1),
                             caps=('round', 'point')), 'cabeza')
        frente = np.array([0, -0.05, 0.0])
        ctx.pieza(clay.sweep(ctx.nombre(f'orejota dentro {sx}'), [p + frente for p in pts[:3]] + [pts[3] + frente * 0.6], [0.07, 0.17, 0.15, 0.03],
                             (1.0, 0.2), ctx.coll, dentro, segments=12, samples=7, up=(0, 0, 1), caps=('round', 'point')), 'cabeza')
        # Muesca (un piquito oscuro en el borde de arriba) y rayas de pelo en la oreja
        q = pts[2] + np.array([0, 0.0, 0.2])
        ctx.pieza(clay.blob(ctx.nombre(f'muesca oreja {sx}'), tuple(q), (0.05, 0.05, 0.04), ctx.coll, marcas, n=4), 'cabeza')
        for k, t in enumerate((0.35, 0.6)):
            p = pts[0] + (pts[2] - pts[0]) * t + np.array([0, 0.045, 0.1])
            ctx.pieza(clay.blob(ctx.nombre(f'raya oreja {sx} {k}'), tuple(p), (0.07, 0.025, 0.05), ctx.coll, marcas, n=4), 'cabeza')
        # Pelitos en la punta
        for k in range(3):
            ctx.pieza(clay.blob(ctx.nombre(f'pelito oreja {sx} {k}'), tuple(pts[3] + fuera * (0.03 + 0.02 * k) + np.array([0, 0, 0.03 * (k - 1)])),
                                (0.025, 0.02, 0.055), ctx.coll, m, n=4, shaper=lambda v: punta(v, 2, 0.8)), 'cabeza')
        return
    # Angel: sube por encima de la cabeza, se va hacia atrás y cae enroscada
    base, n = sobre_capucha(ctx, cap, sx * 50, 62, 0.05)
    pts = [base, base + np.array([sx * 0.12, 0.05, 0.3]), base + np.array([sx * 0.18, 0.3, 0.42]), base + np.array([sx * 0.2, 0.55, 0.25]),
           base + np.array([sx * 0.18, 0.62, 0.02]), base + np.array([sx * 0.16, 0.52, -0.08])]
    rad = [0.11, 0.13, 0.12, 0.1, 0.07, 0.03]
    ctx.pieza(clay.sweep(ctx.nombre(f'orejota {sx}'), pts, rad, (1.0, 0.45), ctx.coll, m, segments=12, samples=7, up=(sx, 0, 0), caps=('round', 'point')),
              'cabeza')
    frente = np.array([sx * -0.035, -0.02, 0.0])
    ctx.pieza(clay.sweep(ctx.nombre(f'orejota dentro {sx}'), [p + frente for p in pts[:4]], [0.05, 0.075, 0.07, 0.05], (1.0, 0.25), ctx.coll, dentro,
                         segments=10, samples=6, up=(sx, 0, 0)), 'cabeza')
    # Puntas oscuras enroscadas y rayitas
    ctx.pieza(clay.sweep(ctx.nombre(f'punta oreja {sx}'), pts[3:], [0.105, 0.075, 0.035], (1.0, 0.5), ctx.coll, marcas, segments=10, samples=5,
                         up=(sx, 0, 0), caps=('round', 'point')), 'cabeza')
    for k, t in enumerate((0.25, 0.45)):
        i = int(t * (len(pts) - 1))
        p = pts[i] + (pts[i + 1] - pts[i]) * (t * (len(pts) - 1) - i)
        ctx.pieza(clay.blob(ctx.nombre(f'raya oreja {sx} {k}'), tuple(p + np.array([sx * 0.04, 0, 0])), (0.015, 0.06, 0.04), ctx.coll, marcas, n=4), 'cabeza')


def cara_capucha(ctx, cap, mats, forma):
    """Ojazos brillantes, nariz grande, cejas y manchas sobre la capucha."""
    m, dentro, marcas = mats
    ojos = ctx.m('ojos', tipo='brillo')
    brillo = ctx.m('destellos', tipo='brillo', color='#FFFFFF')
    nariz = ctx.m('nariz', tipo='brillo')
    for sx in (-1, 1):
        loc, n = sobre_capucha(ctx, cap, sx * 28, 55, 0.0)
        o = clay.blob(ctx.nombre(f'ojazo {sx}'), (0, 0, 0), (0.17, 0.15, 0.07), ctx.coll, ojos, n=6)
        o.location = tuple(loc + n * 0.035)
        orientar(o, n)
        ctx.pieza(o, 'cabeza')
        for k, (dx, dz, r) in enumerate(((-0.04, 0.05, 0.03), (0.04, -0.03, 0.014))):
            b = loc + n * 0.1 + np.array([sx * 0.0 + dx, -0.01, dz])
            ctx.pieza(clay.blob(ctx.nombre(f'destello ojazo {sx} {k}'), tuple(b), (r, r * 0.6, r), ctx.coll, brillo, n=4), 'cabeza')
        # Ceja (un borde de pelo más oscuro encima del ojo)
        a, na = sobre_capucha(ctx, cap, sx * 27, 71, 0.0)
        ctx.pieza(clay.sweep(ctx.nombre(f'ceja capucha {sx}'), [a + np.array([-sx * 0.1, -0.01, -0.01]), a + np.array([0, -0.03, 0.02]),
                                                                 a + np.array([sx * 0.11, -0.01, -0.02])], 0.028, (1, 0.5), ctx.coll, marcas,
                             segments=6, samples=4), 'cabeza')
        if forma == 'angel':
            # Pestañas coquetas
            for k in range(3):
                p = loc + n * 0.06 + np.array([sx * (0.08 + 0.025 * k), -0.01, 0.07 - 0.02 * k])
                ctx.pieza(clay.sweep(ctx.nombre(f'pestana {sx} {k}'), [p, p + np.array([sx * 0.04, -0.01, 0.03]), p + np.array([sx * 0.07, 0, 0.03])],
                                     [0.01, 0.008, 0.002], (1, 1), ctx.coll, ojos, segments=5, samples=3), 'cabeza')
    loc, n = sobre_capucha(ctx, cap, 0, 44, 0.0)
    o = clay.blob(ctx.nombre('narizota'), (0, 0, 0), (0.14 if forma == 'stitch' else 0.09, 0.09, 0.06), ctx.coll, nariz, n=6, p=2.2)
    o.location = tuple(loc + n * 0.05)
    orientar(o, n)
    ctx.pieza(o, 'cabeza')
    ctx.pieza(clay.blob(ctx.nombre('brillo narizota'), tuple(loc + n * 0.1 + np.array([-0.02, 0, 0.02])), (0.02, 0.01, 0.012), ctx.coll, brillo, n=4),
              'cabeza')
    # Mancha oscura de la frente al cogote (como la cabeza de Stitch) y el copetico de pelo
    for k, el in enumerate((78, 90, 104, 120)):
        q, nq = sobre_capucha(ctx, cap, 0 if el <= 90 else 180, el if el <= 90 else 180 - el, 0.0)
        o = clay.blob(ctx.nombre(f'mancha capucha {k}'), (0, 0, 0), (0.2 - 0.02 * k, 0.17, 0.06), ctx.coll, marcas, n=5, p=2.3)
        o.location = tuple(q + nq * 0.025)
        orientar(o, nq)
        ctx.pieza(o, 'cabeza')
    top, nt = sobre_capucha(ctx, cap, 0, 86, 0.0)
    for k, inc in enumerate((-0.5, 0.0, 0.5)):
        ctx.pieza(mechon(ctx, f'copete capucha {k}', top, nt + np.array([inc, -0.2, 0.8]), 0.12, 0.028, m, 'cabeza'), 'cabeza')


@prenda('capucha_stitch', 'cabeza', [V('capucha_stitch', 'Capucha de Stitch', principal='#2451B3', dentro='#EE8DB5', marcas='#132F6E', ojos='#0B0E18',
                                       nariz='#101A36')], oculta=COP, precio=120)
def capucha_stitch(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    mats = (m, ctx.m('dentro', tipo='peluche'), ctx.m('marcas', tipo='peluche'))
    for sx in (-1, 1):
        oreja_stitch(ctx, cap, sx, mats, 'stitch')
    cara_capucha(ctx, cap, mats, 'stitch')


@prenda('capucha_angel', 'cabeza', [V('capucha_angel', 'Capucha de Angel', principal='#E86FA6', dentro='#F9C6DC', marcas='#A93A6E', ojos='#1E0C16',
                                      nariz='#7A1F4A', antena='#A93A6E')], oculta=COP, precio=120)
def capucha_angel(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    mats = (m, ctx.m('dentro', tipo='peluche'), ctx.m('marcas', tipo='peluche'))
    for sx in (-1, 1):
        oreja_stitch(ctx, cap, sx, mats, 'angel')
    cara_capucha(ctx, cap, mats, 'angel')
    # La antena: sale de la frente, sube y se dobla hacia atrás con una bolita
    base, n = sobre_capucha(ctx, cap, 0, 74, 0.03)
    ant = ctx.m('antena', tipo='peluche')
    pts = [base, base + np.array([0, -0.06, 0.25]), base + np.array([0, 0.08, 0.45]), base + np.array([0, 0.3, 0.4]), base + np.array([0, 0.36, 0.28])]
    ctx.pieza(clay.sweep(ctx.nombre('antena angel'), pts, [0.04, 0.03, 0.025, 0.02, 0.018], (1, 1), ctx.coll, ant, segments=8, samples=6), 'cabeza')
    ctx.pieza(clay.blob(ctx.nombre('bolita antena'), tuple(pts[-1] + np.array([0, 0.01, -0.03])), (0.045, 0.045, 0.045), ctx.coll, ant, n=5), 'cabeza')


@prenda('pantuflas_stitch', 'pies', [V('pantuflas_stitch', 'Pantuflas de Stitch', principal='#2451B3', planta='#86B3EE', garras='#141A2C', suela='#132F6E'),
                                     V('pantuflas_angel', 'Pantuflas de Angel', principal='#E86FA6', planta='#F9C6DC', garras='#5A1B38', suela='#A93A6E')],
        precio=70)
def pantuflas_stitch(ctx):
    m = ctx.m('principal', tipo='peluche')
    planta = ctx.m('planta', tipo='peluche')
    gm = ctx.m('garras', tipo='brillo')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        hueso = ctx.hueso_lado('pie', sx)
        # Tres deditos con garra en la punta y la almohadilla clarita encima
        for j in (-1, 0, 1):
            c = np.array([x + j * 0.085 * k, -0.33 * k, 0.1 * k])
            ctx.pieza(clay.blob(ctx.nombre(f'dedo pantufla {ctx.lado(sx)} {j}'), tuple(c), (0.055 * k, 0.06 * k, 0.05 * k), ctx.coll, m, n=5), hueso)
            g = clay.blob(ctx.nombre(f'garra pantufla {ctx.lado(sx)} {j}'), (0, 0, 0), (0.016, 0.016, 0.045 * k), ctx.coll, gm, n=4,
                          shaper=lambda v: punta(v, 2, 0.8))
            g.location = tuple(c + np.array([0, -0.06 * k, 0.0]))
            orientar(g, (j * 0.2, -1, -0.3))
            ctx.pieza(g, hueso)
        ctx.pieza(clay.blob(ctx.nombre(f'almohadilla {ctx.lado(sx)}'), (x, -0.16 * k, 0.24 * k), (0.1 * k, 0.07 * k, 0.025 * k), ctx.coll, planta, n=5),
                  hueso)
        # Pelitos del tobillo
        for j in range(4):
            a = -0.9 + j * 0.6
            b = np.array([x + math.sin(a) * 0.14 * k, 0.08 * k + math.cos(a) * 0.02, 0.27 * k])
            ctx.pieza(mechon(ctx, f'pelito tobillo {ctx.lado(sx)} {j}', b, (math.sin(a) * 0.4, 0.2, 1.0), 0.05, 0.02, m, hueso), hueso)


@prenda('cola_stitch', 'cola', [V('cola_stitch', 'Colita de Stitch', principal='#2451B3', marcas='#132F6E'),
                                V('cola_angel', 'Colita de Angel', principal='#E86FA6', marcas='#A93A6E')], precio=30)
def cola_stitch(ctx):
    b = base_cola(ctx)
    m = ctx.m('principal', tipo='peluche')
    ctx.pieza(clay.blob(ctx.nombre('colita stitch'), tuple(b + np.array([0, 0.07, 0.01])), (0.075, 0.1, 0.07), ctx.coll, m, n=6,
                        shaper=lambda v: v * np.where(v[:, 1:2] > 0, [0.8, 1, 0.8], [1, 1, 1])), 'pelvis')
    ctx.pieza(clay.blob(ctx.nombre('punta colita stitch'), tuple(b + np.array([0, 0.15, 0.03])), (0.04, 0.05, 0.04), ctx.coll, ctx.m('marcas', tipo='peluche'),
                        n=5), 'pelvis')


# ---------------------------------------------------------------------------
# DORADO · Dragones (Él rojo con placas doradas, Ella lila con placas rosadas)
# ---------------------------------------------------------------------------
DRAGON = dict(principal='#AE1B16', panza='#EDAA2B', escamas='#6E1210', puas='#EDAA2B', garras='#2A1A14', costura='#D9533F')
DRAGONA = dict(principal='#8A62D6', panza='#F6B8DA', escamas='#5E3FAE', puas='#F6B8DA', garras='#2E1F45', costura='#B597EC')


def escama(ctx, nombre, p, n, s, mat, hueso):
    """Escamita redonda que se monta sobre la de abajo (media gota apuntando hacia abajo)."""
    o = clay.blob(ctx.nombre(nombre), (0, 0, 0), (s, s * 0.9, s * 0.38), ctx.coll, mat, n=4,
                  shaper=lambda v: v * np.where(v[:, 1:2] < 0, [0.85, 1.25, 1], [1, 1, 1]))
    o.location = tuple(p + n * s * 0.12)
    orientar(o, n)
    return ctx.pieza(o, hueso)


@prenda('enterizo_dragon', 'conjunto', [V('enterizo_dragon', 'Enterizo de dragón', **DRAGON), V('enterizo_dragona', 'Enterizo de dragona', **DRAGONA)],
        precio=260)
def enterizo_dragon(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    T = ctx.D['torso']
    hx = T['half'][0]
    panza, esc, cos = ctx.m('panza', tipo='peluche'), ctx.m('escamas', tipo='peluche'), ctx.m('costura', tipo='lisa')
    # Placas de la panza: siete bandas acolchadas (más angostas arriba) con su costura
    for k, t in enumerate(np.linspace(0.12, 0.86, 7)):
        ancho = hx * (0.62 - 0.22 * abs(t - 0.45))
        placa = clay.rbox(ctx.nombre(f'placa panza {k}'), (0, 0, 0), (ancho, 0.02, 0.05), ctx.coll, panza, p=5, n=4, subsurf=1)
        o = en_superficie(ctx, f, 0.0, zc(ctx, t), placa, lift=0.016)
        if o is not None:
            objs.append(o)
        pts = linea_torso(ctx, f, [(x, zc(ctx, t) - 0.058) for x in np.linspace(-ancho * 0.9, ancho * 0.9, 5)], 0.02)
        if len(pts) > 2:
            objs.append(costura(ctx, f'costura placa {k}', pts, cos, 'torso', r=0.005))
    # Escamas por la espalda y los costados, en hileras trabadas
    k = 0
    for fila, t in enumerate(np.linspace(0.1, 0.72, 6)):
        for x in np.linspace(-hx * 0.8, hx * 0.8, 6 + fila % 2)[fila % 2::1]:
            p, n = sobre_torso(ctx, f, x, zc(ctx, t), 0.0, atras=True)
            if p is not None:
                objs.append(escama(ctx, f'escama espalda {k}', p, n, 0.05, esc, 'torso'))
                k += 1
    for sx in (-1, 1):
        for fila, t in enumerate(np.linspace(0.2, 0.7, 4)):
            p, n = sobre_torso(ctx, f, sx * hx * 0.86, zc(ctx, t), 0.0)
            if p is not None:
                objs.append(escama(ctx, f'escama costado {ctx.lado(sx)} {fila}', p, n, 0.045, esc, 'torso'))
    # La cresta de púas por la columna
    puas = ctx.m('puas', tipo='peluche')
    for j, t in enumerate(np.linspace(0.7, 0.08, 6)):
        p, n = sobre_torso(ctx, f, 0.0, zc(ctx, t), 0.0, atras=True)
        if p is not None:
            s = 0.1 - 0.008 * j
            o = clay.blob(ctx.nombre(f'pua cresta {j}'), (0, 0, 0), (0.035, s * 0.9, s), ctx.coll, puas, n=5, shaper=lambda v: punta(v, 2, 0.75))
            o.location = tuple(p + n * s * 0.45)
            orientar(o, n + np.array([0, 0.3, 0.45]))
            objs.append(ctx.pieza(o, 'torso'))
    # Garras, escamas en las rodillas y costuras laterales
    gm = ctx.m('garras', tipo='brillo')
    for sx in (-1, 1):
        objs += garras(ctx, sx, gm, n=3, largo=0.08, grosor=0.024)
        c = np.array(Pn['leg_bot']) * np.array([sx, 1, 1])
        for j, dz in enumerate((0.08, 0.14, 0.2)):
            for i, dx in enumerate((-0.05, 0.05)):
                o = clay.blob(ctx.nombre(f'escama pierna {ctx.lado(sx)} {j} {i}'), (0, 0, 0), (0.04, 0.036, 0.015), ctx.coll, esc, n=4)
                r = en_superficie(ctx, fp, c[0] + dx + 0.025 * (j % 2), Pn['bottom'] + dz, o, ctx.hueso_lado('pierna', sx), lift=0.012)
                if r is not None:
                    objs.append(r)
        pts = linea_torso(ctx, f, [(sx * hx * 0.94, zc(ctx, t)) for t in np.linspace(0.08, 0.9, 7)])
        if len(pts) > 3:
            objs.append(costura(ctx, f'pespunte lado {ctx.lado(sx)}', pts, cos, 'torso'))
    del T
    return objs


@prenda('capucha_dragon', 'cabeza', [V('capucha_dragon', 'Capucha de dragón', principal='#AE1B16', cuernos='#F4E3C0', escamas='#6E1210', puas='#F0B83E',
                                       iris='#F7C531', pupila='#1A0E0A', dientes='#FFFFFF', membrana='#F0B83E'),
                                     V('capucha_dragona', 'Capucha de dragona', principal='#8A62D6', cuernos='#FFF1F7', escamas='#5E3FAE', puas='#F6B8DA',
                                       iris='#7EE0D0', pupila='#1C1230', dientes='#FFFFFF', membrana='#F6B8DA')],
        oculta=COP, precio=140)
def capucha_dragon(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    cuerno_m, esc, puas = ctx.m('cuernos', tipo='brillo'), ctx.m('escamas', tipo='peluche'), ctx.m('puas', tipo='peluche')
    # Cuernos curvos hacia atrás con anillos
    for sx in (-1, 1):
        base, n = sobre_capucha(ctx, cap, sx * 32, 70, 0.04)
        pts = [base, base + np.array([sx * 0.06, 0.04, 0.2]), base + np.array([sx * 0.1, 0.22, 0.34]), base + np.array([sx * 0.1, 0.42, 0.34])]
        ctx.pieza(clay.sweep(ctx.nombre(f'cuerno dragon {sx}'), pts, [0.085, 0.07, 0.045, 0.012], (1, 1), ctx.coll, cuerno_m, segments=10, samples=6,
                             caps=('round', 'point')), 'cabeza')
        ps, _ = clay.catmull_rom(pts, 6)
        for j, i in enumerate((2, 5, 8)):
            if i < len(ps):
                ctx.pieza(clay.blob(ctx.nombre(f'anillo cuerno {sx} {j}'), tuple(ps[i]), (0.078 - 0.012 * j, 0.078 - 0.012 * j, 0.018), ctx.coll, cuerno_m, n=4),
                          'cabeza')
        # Aleta de oreja: tres varillas con membrana
        oreja, no = sobre_capucha(ctx, cap, sx * 84, 34, 0.03)
        memb = ctx.m('membrana', tipo='peluche')
        tips = []
        for j, (dz, dy) in enumerate(((0.2, 0.05), (0.08, 0.14), (-0.04, 0.2))):
            tip = oreja + np.array([sx * 0.26, dy, dz])
            tips.append(tip)
            ctx.pieza(clay.sweep(ctx.nombre(f'varilla oreja {sx} {j}'), [oreja, (oreja + tip) / 2 + np.array([sx * 0.02, 0, 0.02]), tip], [0.028, 0.02, 0.008],
                                 (1, 1), ctx.coll, puas, segments=6, samples=4, caps=('round', 'point')), 'cabeza')
        o = clay.blob(ctx.nombre(f'membrana oreja {sx}'), tuple(oreja + np.array([sx * 0.13, 0.1, 0.07])), (0.13, 0.12, 0.018), ctx.coll, memb, n=5)
        o.rotation_euler = (math.radians(-20), math.radians(sx * 70), 0)
        ctx.pieza(o, 'cabeza')
    # Ojos de reptil: iris amarillo, pupila rayita, párpado y ceja con escamas
    iris, pup = ctx.m('iris', tipo='brillo'), ctx.m('pupila', tipo='brillo')
    for sx in (-1, 1):
        loc, n = sobre_capucha(ctx, cap, sx * 26, 55, 0.0)
        o = clay.blob(ctx.nombre(f'iris dragon {sx}'), (0, 0, 0), (0.13, 0.11, 0.055), ctx.coll, iris, n=6)
        o.location = tuple(loc + n * 0.03)
        orientar(o, n)
        ctx.pieza(o, 'cabeza')
        o = clay.blob(ctx.nombre(f'pupila rayita {sx}'), (0, 0, 0), (0.025, 0.09, 0.02), ctx.coll, pup, n=4)
        o.location = tuple(loc + n * 0.075)
        orientar(o, n)
        ctx.pieza(o, 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'destello reptil {sx}'), tuple(loc + n * 0.09 + np.array([-0.03, 0, 0.04])), (0.018, 0.01, 0.018), ctx.coll,
                            ctx.m('destellos', tipo='brillo', color='#FFFFFF'), n=4), 'cabeza')
        a, na = sobre_capucha(ctx, cap, sx * 26, 68, 0.0)
        ctx.pieza(clay.sweep(ctx.nombre(f'ceja dragon {sx}'), [a + np.array([-sx * 0.12, -0.02, -0.03]), a + np.array([0, -0.04, 0.02]),
                                                                a + np.array([sx * 0.14, -0.02, 0.03])], [0.035, 0.04, 0.02], (1, 0.6), ctx.coll, esc,
                             segments=6, samples=4, caps=('round', 'point')), 'cabeza')
    # Hocico con fosas y colmillos en el borde de la capucha (la capucha es la boca del dragón)
    loc, n = sobre_capucha(ctx, cap, 0, 42, 0.0)
    o = clay.blob(ctx.nombre('hocico dragon'), (0, 0, 0), (0.2, 0.15, 0.1), ctx.coll, m, n=6, p=2.2)
    o.location = tuple(loc + n * 0.07)
    orientar(o, n)
    ctx.pieza(o, 'cabeza')
    for sx in (-1, 1):
        ctx.pieza(clay.blob(ctx.nombre(f'fosa nasal {sx}'), tuple(loc + n * 0.16 + np.array([sx * 0.07, 0, 0.03])), (0.026, 0.02, 0.016), ctx.coll, pup, n=4),
                  'cabeza')
    dientes = ctx.m('dientes', tipo='brillo')
    for j, az in enumerate(np.linspace(-58, 58, 8)):
        R, E, azs = cap
        i = int(np.argmin(np.abs((azs - az + 180) % 360 - 180)))
        el = E[0, i] + 3
        p, nn = sobre_capucha(ctx, cap, az, el, 0.0)
        d = clay.blob(ctx.nombre(f'colmillo {j}'), (0, 0, 0), (0.03, 0.02, 0.055 if j in (0, 7, 3, 4) else 0.04), ctx.coll, dientes, n=4,
                      shaper=lambda v: punta(v, 2, 0.8))
        d.location = tuple(p + np.array([0, -0.02, -0.035]))
        orientar(d, (0, -0.35, -1))
        ctx.pieza(d, 'cabeza')
    # Cresta de púas de la frente a la nuca y escamas en la coronilla
    for j, (az, el) in enumerate(((0, 76), (0, 88), (180, 78), (180, 62), (180, 44))):
        p, nn = sobre_capucha(ctx, cap, az, el, 0.0)
        s = 0.12 - 0.012 * j
        o = clay.blob(ctx.nombre(f'pua capucha {j}'), (0, 0, 0), (0.035, s, s * 1.1), ctx.coll, puas, n=5, shaper=lambda v: punta(v, 2, 0.75))
        o.location = tuple(p + nn * s * 0.5)
        orientar(o, nn + np.array([0, 0.25, 0.2]))
        ctx.pieza(o, 'cabeza')
    for j, (az, el) in enumerate(((-40, 80), (40, 80), (-60, 62), (60, 62), (-110, 60), (110, 60), (-140, 40), (140, 40), (-90, 72), (90, 72))):
        p, nn = sobre_capucha(ctx, cap, az, el, 0.0)
        ctx.pieza(escama(ctx, f'escama capucha {j}', p, nn, 0.06, esc, 'cabeza'), 'cabeza')


@prenda('alas_dragon', 'espalda', [V('alas_dragon', 'Alas de dragón', principal='#AE1B16', membrana='#F08A3C', garras='#2A1A14'),
                                   V('alas_dragona', 'Alas de dragona', principal='#8A62D6', membrana='#F6B8DA', garras='#2E1F45')], precio=120)
def alas_dragon(ctx):
    from ropa_accesorios import atras_y, espalda_z
    m, memb, gm = ctx.m('principal', tipo='peluche'), ctx.m('membrana', tipo='peluche'), ctx.m('garras', tipo='brillo')
    base_z = espalda_z(ctx, 0.74)
    for sx in (-1, 1):
        base = np.array([sx * 0.09, atras_y(ctx, base_z) + 0.05, base_z])
        # Grandes y altas: se asoman por detrás de la capucha y por los lados
        codo = base + np.array([sx * 0.44, 0.16, 0.56])
        ctx.pieza(clay.sweep(ctx.nombre(f'brazo ala {sx}'), [base, base + np.array([sx * 0.2, 0.08, 0.3]), codo], [0.06, 0.05, 0.045], (1, 1), ctx.coll, m,
                             segments=8, samples=5), 'torso')
        puntas = [codo + np.array([sx * 0.86, 0.14, 0.26]), codo + np.array([sx * 0.98, 0.16, -0.26]), codo + np.array([sx * 0.66, 0.14, -0.72])]
        for j, q in enumerate(puntas):
            ctx.pieza(clay.sweep(ctx.nombre(f'dedo ala {sx} {j}'), [codo, (codo + q) / 2 + np.array([0, 0.02, 0.07]), q], [0.042, 0.03, 0.01], (1, 1),
                                 ctx.coll, m, segments=8, samples=5, caps=('round', 'point')), 'torso')
        # Pulgar con garra en el codo y bolita en la articulación
        ctx.pieza(clay.blob(ctx.nombre(f'nudillo ala {sx}'), tuple(codo), (0.055, 0.055, 0.055), ctx.coll, m, n=5), 'torso')
        g = clay.blob(ctx.nombre(f'garra ala {sx}'), (0, 0, 0), (0.022, 0.022, 0.07), ctx.coll, gm, n=4, shaper=lambda v: punta(v, 2, 0.85))
        g.location = tuple(codo + np.array([sx * 0.02, 0.0, 0.08]))
        orientar(g, (sx * 0.4, 0.1, 1))
        ctx.pieza(g, 'torso')
        # Membranas entre los dedos (con el borde en ondas) y entre el último dedo y la espalda
        cadena = [base + np.array([0, 0.02, -0.12]), puntas[2], puntas[1], puntas[0], codo]
        for j in range(len(cadena) - 1):
            a, b = cadena[j], cadena[j + 1]
            verts = [codo]
            for t in np.linspace(0, 1, 9):
                q = a + (b - a) * t
                hacia = q - codo
                # Las ondas: el borde se mete un poco entre dedo y dedo
                q = codo + hacia * (1 - 0.16 * math.sin(math.pi * t)) if j > 0 else q
                verts.append(q + np.array([0, 0.01, 0]))
            faces = [(0, i, i + 1) for i in range(1, len(verts) - 1)]
            o = clay.make_mesh_object(ctx.nombre(f'membrana ala {sx} {j}'), [tuple(v) for v in verts], faces, ctx.coll, material=memb)
            clay.add_solidify(o, 0.018, offset=0.0)
            clay.add_subsurf(o, 1, 2)
            ctx.pieza(o, 'torso')


@prenda('cola_dragon', 'cola', [V('cola_dragon', 'Cola de dragón', principal='#AE1B16', panza='#F0B83E', puas='#F0B83E'),
                                V('cola_dragona', 'Cola de dragona', principal='#8A62D6', panza='#F6B8DA', puas='#F6B8DA')], precio=90)
def cola_dragon(ctx):
    b = base_cola(ctx)
    m, panza, puas = ctx.m('principal', tipo='peluche'), ctx.m('panza', tipo='peluche'), ctx.m('puas', tipo='peluche')
    pts = [b, b + np.array([0.02, 0.28, -0.14]), b + np.array([0.12, 0.58, -0.3]), b + np.array([0.28, 0.82, -0.34]), b + np.array([0.42, 0.98, -0.26])]
    ctx.pieza(clay.sweep(ctx.nombre('cola dragon'), pts, [0.2, 0.16, 0.11, 0.07, 0.035], (1, 1), ctx.coll, m, segments=14, samples=7,
                         caps=('round', 'point')), 'pelvis')
    ps, _ = clay.catmull_rom(pts, 7)
    # Púas encima y placas debajo
    for j, i in enumerate(range(3, len(ps) - 3, 3)):
        p = ps[i]
        r = 0.2 - 0.17 * i / len(ps)
        s = 0.085 - 0.005 * j
        o = clay.blob(ctx.nombre(f'pua cola {j}'), (0, 0, 0), (0.025, s * 0.9, s), ctx.coll, puas, n=5, shaper=lambda v: punta(v, 2, 0.75))
        o.location = tuple(p + np.array([0, 0.02, r * 0.95 + s * 0.4]))
        orientar(o, (0, 0.35, 1))
        ctx.pieza(o, 'pelvis')
        pl = clay.blob(ctx.nombre(f'placa cola {j}'), tuple(p + np.array([0, 0, -r * 0.82])), (r * 0.7, 0.04, r * 0.35), ctx.coll, panza, n=4)
        ctx.pieza(pl, 'pelvis')
    # Punta de flecha (sigue la dirección de la cola)
    fin = pts[-1]
    dir_ = unidad(pts[-1] - pts[-2])
    o = clay.blob(ctx.nombre('punta flecha cola'), (0, 0, 0), (0.15, 0.03, 0.14), ctx.coll, puas, n=5,
                  shaper=lambda v: v * np.column_stack([1 - 0.8 * np.clip(v[:, 2] / 0.14, 0, 1), np.ones(len(v)), np.ones(len(v))]))
    o.location = tuple(fin + dir_ * 0.06)
    orientar(o, dir_)
    ctx.pieza(o, 'pelvis')


@prenda('pantuflas_dragon', 'pies', [V('pantuflas_dragon', 'Pantuflas de dragón', principal='#AE1B16', escamas='#6E1210', garras='#F4E3C0', suela='#8E1E1B'),
                                     V('pantuflas_dragona', 'Pantuflas de dragona', principal='#8A62D6', escamas='#5E3FAE', garras='#FFF1F7', suela='#5E3FAE')],
        precio=70)
def pantuflas_dragon(ctx):
    m, esc, gm = ctx.m('principal', tipo='peluche'), ctx.m('escamas', tipo='peluche'), ctx.m('garras', tipo='brillo')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        hueso = ctx.hueso_lado('pie', sx)
        for j in (-1, 0, 1):
            c = np.array([x + j * 0.085 * k, -0.33 * k, 0.1 * k])
            ctx.pieza(clay.blob(ctx.nombre(f'dedo dragon {ctx.lado(sx)} {j}'), tuple(c), (0.05 * k, 0.065 * k, 0.05 * k), ctx.coll, m, n=5), hueso)
            g = clay.blob(ctx.nombre(f'garra dragon {ctx.lado(sx)} {j}'), (0, 0, 0), (0.02, 0.02, 0.06 * k), ctx.coll, gm, n=4, shaper=lambda v: punta(v, 2, 0.85))
            g.location = tuple(c + np.array([0, -0.07 * k, -0.01]))
            orientar(g, (j * 0.2, -1, -0.4))
            ctx.pieza(g, hueso)
        for j, (dx, dy) in enumerate(((-0.07, -0.12), (0.07, -0.12), (0.0, -0.05), (-0.08, 0.02), (0.08, 0.02))):
            p = np.array([x + dx * k, dy * k, 0.255 * k])
            ctx.pieza(clay.blob(ctx.nombre(f'escama pantufla {ctx.lado(sx)} {j}'), tuple(p), (0.045 * k, 0.04 * k, 0.018), ctx.coll, esc, n=4), hueso)
        e = clay.blob(ctx.nombre(f'espolon {ctx.lado(sx)}'), (0, 0, 0), (0.02, 0.02, 0.06 * k), ctx.coll, gm, n=4, shaper=lambda v: punta(v, 2, 0.85))
        e.location = tuple(np.array([x, 0.2 * k, 0.12 * k]))
        orientar(e, (0, 1, 0.3))
        ctx.pieza(e, hueso)


# ---------------------------------------------------------------------------
# DORADO · Silleteros de la Feria de las Flores (Medellín)
# ---------------------------------------------------------------------------

def sombrero_paisa(ctx, flores=False):
    """Sombrero aguadeño: ala ancha que cae un poquito, copa con hendidura, tejido de paja (anillos) y cinta."""
    from ropa_accesorios import ala_y_copa, lathe
    paja, cinta = ctx.m('principal', tipo='rib'), ctx.m('cinta', tipo='lisa')
    # Copa ancha para que baje y se encaje en la cabeza (con el pelo de Él, una copa angosta queda flotando)
    rc = 0.68
    perfil = [(0.0, 0.3), (0.24, 0.26), (0.43, 0.33), (0.6, 0.3), (rc - 0.01, 0.2), (rc, 0.0)]
    c, ala, copa = ala_y_copa(ctx, paja, paja, r_ala=1.18, alto=0.33, r_copa=rc, grosor=0.035, caida=0.07, copa_perfil=perfil, subir=-0.1)
    tejido = ctx.m('tejido', tipo='rib')
    # El tejido de la paja: anillitos en el ala y en la copa
    for k, r in enumerate(np.linspace(rc + 0.06, 1.12, 9)):
        z = 0.035 - 0.07 * ((r - rc) / (1.18 - rc)) ** 2
        lathe(ctx, f'tejido ala {k}', [(r, z + 0.004), (r + 0.012, z + 0.009), (r + 0.024, z + 0.004)], tejido, c, seg=56, tapa_abajo=False, tapa_arriba=False)
    for k, z in enumerate((0.1, 0.16, 0.22)):
        lathe(ctx, f'tejido copa {k}', [(rc - 0.003, z), (rc + 0.005, z + 0.012), (rc - 0.003, z + 0.024)], tejido, c, seg=48, tapa_abajo=False,
              tapa_arriba=False)
    # Cinta negra (o de flores) con su moñito al lado
    lathe(ctx, 'cinta aguadeno', [(rc + 0.005, 0.012), (rc + 0.018, 0.04), (rc + 0.005, 0.075)], cinta, c, seg=48, tapa_abajo=False, tapa_arriba=False)
    for j in (-1, 1):
        o = clay.blob(ctx.nombre(f'mono sombrero {j}'), tuple(c + np.array([rc - 0.02 + 0.05 * j, -0.14, 0.05])), (0.05, 0.02, 0.03), ctx.coll, cinta, n=4)
        ctx.pieza(o, 'cabeza')
    if flores:
        colores = ['flor1', 'flor2', 'flor3', 'flor4']
        for k in range(14):
            a = 2 * math.pi * k / 14
            fl = ropa.flor(ctx, f'flor sombrero {k}', 0.075, ctx.m(colores[k % 4], tipo='lisa'), ctx.m('centro', tipo='lisa'))
            fl.location = tuple(c + np.array([math.cos(a) * (rc + 0.03), math.sin(a) * (rc + 0.03), 0.06]))
            fl.rotation_euler = (0, 0, a + math.pi / 2)
            ctx.pieza(fl, 'cabeza')
        # Cintas de colores que cuelgan por detrás
        for j, col in enumerate(('flor1', 'flor3', 'flor4')):
            x = -0.08 + 0.08 * j
            pts = [c + np.array([x, rc - 0.02, 0.05]), c + np.array([x * 1.4, rc + 0.14, -0.2]), c + np.array([x * 1.8, rc + 0.2, -0.5])]
            ctx.pieza(clay.sweep(ctx.nombre(f'cinta colgando {j}'), pts, 0.028, (1, 0.25), ctx.coll, ctx.m(col, tipo='lisa'), segments=6, samples=5,
                                 up=(0, 1, 0)), 'cabeza')


@prenda('sombrero_aguadeno', 'cabeza', [V('sombrero_aguadeno', 'Sombrero aguadeño', principal='#EDE0BF', tejido='#D9C79A', cinta='#1E1B1A')],
        oculta=COP, precio=90)
def sombrero_aguadeno(ctx):
    sombrero_paisa(ctx)


@prenda('sombrero_flores', 'cabeza', [V('sombrero_flores', 'Sombrero de silletera', principal='#EDE0BF', tejido='#D9C79A', cinta='#C22F3A', flor1='#E2394C',
                                        flor2='#F7C530', flor3='#FFFFFF', flor4='#B05BD6', centro='#F59A2A')], oculta=COP, precio=100)
def sombrero_flores(ctx):
    sombrero_paisa(ctx, flores=True)


@prenda('ruana_paisa', 'arriba', [V('ruana_paisa', 'Camisa, ruana al hombro, pañuelo y carriel', principal='#FAF7F0', ruana='#6B4A33', franjas='#E9DCC0',
                                    panuelo='#C8283A', cuero='#7A4A2A', hebillas='#D8B35A', botones='#E9E2D2')], para=('el',), precio=180)
def ruana_paisa(ctx):
    from ropa_arriba import base_camisa
    objs, f = base_camisa(ctx)
    D = ctx.D
    T = D['torso']
    hx = T['half'][0]
    nc, nr = D['neck_hole']
    ruana, franjas = ctx.m('ruana', tipo='rib'), ctx.m('franjas', tipo='lisa')
    # La ruana doblada sobre el hombro izquierdo: una banda gruesa que baja cruzada adelante y atrás
    for lado, atras in (('frente', False), ('espalda', True)):
        pts = []
        for t in np.linspace(0, 1, 9):
            x = -hx * 0.62 + (hx * 1.15) * t
            z = zc(ctx, 0.93) + (zc(ctx, 0.18) - zc(ctx, 0.93)) * t
            p, n = sobre_torso(ctx, f, x, z, 0.07, atras)
            if p is not None:
                pts.append(p)
        if len(pts) > 3:
            # (el perfil va (a lo largo de la normal, a lo ancho sobre la tela): banda ancha y plana)
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'ruana {lado}'), pts, 0.17, (0.32, 1.0), ctx.coll, ruana, segments=12, samples=5,
                                             up_fn=lambda q: sdf.normal(f, np.array([q]))[0]), 'torso'))
            for j, off in enumerate((-0.12, 0.12)):
                ps = [p + np.array([0, 0, off]) + sdf.normal(f, np.array([p]))[0] * 0.05 for p in pts]
                objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'franja ruana {lado} {j}'), ps, 0.012, (1, 0.5), ctx.coll, franjas, segments=5, samples=4),
                                      'torso'))
            # Flecos en la punta de la ruana
            fin = pts[-1]
            for j in range(7):
                q = fin + np.array([-0.09 + 0.03 * j, 0, -0.1])
                objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'fleco ruana {lado} {j}'), [q, q + np.array([0, 0, -0.09])], 0.009, (1, 1), ctx.coll, ruana,
                                                 segments=4, samples=2), 'torso'))
    # Sobre el hombro: el doblez que une las dos mitades
    hombro = np.array(D['joint']) * np.array([-1, 1, 1]) + np.array([0.12, 0.0, 0.12])
    objs.append(ctx.pieza(clay.blob(ctx.nombre('doblez ruana'), tuple(hombro), (0.16, 0.22, 0.1), ctx.coll, ruana, n=6), 'torso'))
    # Pañuelo rabo de gallo al cuello con el nudo y la punta
    pan = ctx.m('panuelo', tipo='tela')
    ring = sdf.ring_points(f, (0, nc[1], nc[2] - 0.02), (0, 0, 1), 0.6, 28, lift=0.025)
    if len(ring) > 10:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('panuelo cuello'), ring, 0.035, (1, 0.8), ctx.coll, pan, segments=8, samples=3, closed=True), 'torso'))
    p, n = sobre_torso(ctx, f, 0.0, nc[2] - 0.08, 0.05)
    if p is not None:
        objs.append(ctx.pieza(clay.blob(ctx.nombre('nudo panuelo'), tuple(p), (0.05, 0.04, 0.045), ctx.coll, pan, n=5), 'torso'))
        tri = clay.blob(ctx.nombre('punta panuelo'), (0, 0, 0), (0.11, 0.02, 0.13), ctx.coll, pan, n=5,
                        shaper=lambda v: v * np.column_stack([1 - 0.85 * np.clip(-v[:, 2] / 0.13, 0, 1), np.ones(len(v)), np.ones(len(v))]))
        tri.location = tuple(p + np.array([0, -0.01, -0.12]))
        objs.append(ctx.pieza(tri, 'torso'))
    # El carriel: correa cruzada del hombro derecho a la cadera izquierda y el bolso con tapa, flecos y hebillas
    cuero, heb = ctx.m('cuero', tipo='brillo'), ctx.m('hebillas', tipo='metal')
    correa = linea_torso(ctx, f, [(hx * 0.62 - hx * 1.3 * t, zc(ctx, 0.97) + (zc(ctx, 0.12) - zc(ctx, 0.97)) * t) for t in np.linspace(0, 1, 6)], 0.045)
    if len(correa) > 3:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('correa carriel'), correa, 0.032, (0.35, 1.0), ctx.coll, cuero, segments=6, samples=4,
                                         up_fn=lambda q: sdf.normal(f, np.array([q]))[0]), 'torso'))
    p, n = sobre_torso(ctx, f, -hx * 0.85, zc(ctx, 0.08), 0.1)
    if p is not None:
        c = p + np.array([-0.05, -0.02, 0])
        objs.append(ctx.pieza(clay.rbox(ctx.nombre('bolso carriel'), tuple(c), (0.13, 0.05, 0.11), ctx.coll, cuero, p=4, n=4, subsurf=1), 'torso'))
        tapa = clay.blob(ctx.nombre('tapa carriel'), tuple(c + np.array([0, -0.055, 0.04])), (0.13, 0.015, 0.08), ctx.coll, cuero, n=5, p=2.5)
        objs.append(ctx.pieza(tapa, 'torso'))
        for j in (-1, 1):
            objs.append(ctx.pieza(clay.rbox(ctx.nombre(f'hebilla carriel {j}'), tuple(c + np.array([j * 0.06, -0.075, 0.0])), (0.02, 0.006, 0.016), ctx.coll,
                                            heb, p=4, n=3, subsurf=0), 'torso'))
        for j in range(8):
            q = c + np.array([-0.11 + 0.031 * j, -0.01, -0.11])
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'fleco carriel {j}'), [q, q + np.array([0.0, -0.005, -0.08])], 0.007, (1, 1), ctx.coll, cuero,
                                             segments=4, samples=2), 'torso'))
    return objs


@prenda('vestido_chapolera', 'conjunto', [V('vestido_chapolera', 'Vestido de chapolera', principal='#FAF7F0', falda='#1E1B1A', cinta1='#E2394C',
                                            cinta2='#F7C530', cinta3='#2F9E58', flor1='#E2394C', flor2='#F7C530', centro='#FFFFFF', encaje='#FFFFFF')],
        para=('ella',), precio=200)
def vestido_chapolera(ctx):
    from ropa import cuello_redondo, torso
    from ropa_abajo import falda
    D = ctx.D
    T = D['torso']
    blusa = ctx.m('principal', tipo='tela')
    objs = []
    t, f = torso(ctx, 'torso blusa', blusa, crecer=0.016, cuello=1.12)
    objs.append(t)
    # Mangas bombachas con resorte
    A = D['arm']
    for sx in (-1, 1):
        s = np.array([sx, 1, 1])
        d = cuerpo._dir(D['arm_deg'], A.get('dy', 0.08)) * s
        c = np.array(D['joint']) * s + d * 0.06
        objs.append(ctx.pieza(clay.blob(ctx.nombre(f'manga bombacha {ctx.lado(sx)}'), tuple(c), (0.17, 0.16, 0.15), ctx.coll, blusa, n=8),
                              ctx.hueso_lado('brazo', sx)))
        objs.append(ctx.pieza(clay.blob(ctx.nombre(f'resorte manga {ctx.lado(sx)}'), tuple(c + d * 0.11), (0.12, 0.12, 0.03), ctx.coll,
                                        ctx.m('encaje', tipo='rib'), n=5), ctx.hueso_lado('brazo', sx)))
    # Cuello de encaje en ondas
    c, _ = cuello_redondo(ctx, f, ctx.m('encaje', tipo='rib'), grosor=0.03, escala=1.14)
    objs.append(c)
    nc, _ = D['neck_hole']
    ring = sdf.ring_points(f, (0, nc[1], nc[2] - 0.07), (0, 0, 1), 0.7, 36, lift=0.02)
    if len(ring) > 12:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('volante blusa'), [p + np.array([0, 0, 0.012 * math.sin(i * 1.6)]) for i, p in enumerate(ring)],
                                         0.03, (1.4, 0.4), ctx.coll, ctx.m('encaje', tipo='rib'), segments=8, samples=3, closed=True), 'torso'))
    # La falda larga y ancha con tres cintas de colores y flores bordadas
    top = T['bottom'] + 0.06
    o, ff = falda(ctx, top, 0.08, T['half'][0] + 0.03, 0.68, ctx.m('falda', tipo='tela'), parte='falda chapolera', pliegues=16)
    objs.append(o)
    for k, (z, col) in enumerate(((0.14, 'cinta1'), (0.2, 'cinta2'), (0.26, 'cinta3'))):
        ring = sdf.ring_points(ff, (0, 0.03, z), (0, 0, 1), 1.4, 56, lift=0.012)
        if len(ring) > 16:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'cinta falda {k}'), ring, 0.022, (0.5, 1.2), ctx.coll, ctx.m(col, tipo='lisa'), segments=6,
                                             samples=3, closed=True), 'pelvis'))
    for k in range(10):
        a = 2 * math.pi * k / 10 + 0.3
        z = 0.38 + 0.06 * (k % 2)
        ring = sdf.ring_points(ff, (0, 0.03, z), (0, 0, 1), 1.4, 40, lift=0.012)
        if not len(ring):
            continue
        i = int((a % (2 * math.pi)) / (2 * math.pi) * len(ring))
        p = np.array(ring[i])
        fl = ropa.flor(ctx, f'flor falda {k}', 0.06, ctx.m('flor1' if k % 2 else 'flor2', tipo='lisa'), ctx.m('centro', tipo='lisa'))
        fl.location = tuple(p)
        n = unidad(np.array([p[0], p[1] - 0.03, 0.0]))
        orientar(fl, n)
        fl.rotation_quaternion = fl.rotation_quaternion @ Vector((0, 0, 1)).rotation_difference(Vector((0, -1, 0))).inverted()
        objs.append(ctx.pieza(fl, 'pelvis'))
    objs.append(ruedo(ctx, f, T['bottom'] + 0.05, ctx.m('cinta1', tipo='lisa'), 'fajon chapolera', grosor=0.03, prof=(1, 1.2)))
    # Delantal blanco con borde de encaje (sobre la falda, adelante)
    enc = ctx.m('encaje', tipo='rib')
    pts = sdf.front_points(ff, [(0.0, 0.33)])
    if pts:
        p = np.array(pts[0])
        n = sdf.normal(ff, np.array([p]))[0]
        o = clay.blob(ctx.nombre('delantal'), (0, 0, 0), (0.3, 0.015, 0.22), ctx.coll, ctx.m('principal', tipo='tela'), n=6, p=4.0)
        o.location = tuple(p + n * 0.02)
        clay.orient_to(o, n)
        objs.append(ctx.pieza(o, 'pelvis'))
        borde = [p + n * 0.025 + np.array([0.3 * math.sin(a), 0, -0.22 + 0.02 * math.cos(a * 9)]) for a in np.linspace(-1.3, 1.3, 14)]
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('encaje delantal'), borde, 0.018, (1, 0.6), ctx.coll, enc, segments=6, samples=3), 'pelvis'))
    return objs


def silleta(ctx, patron):
    """Silleta de madera a la espalda cargada de flores: redonda (anillos de colores con un girasol en el centro) o de
    corazón (rosas rojas rodeadas de flores blancas y amarillas)."""
    from ropa_accesorios import atras_y, espalda_z
    madera, cabuya, hoja = ctx.m('madera', tipo='lisa'), ctx.m('cabuya', tipo='rib'), ctx.m('hojas', tipo='lisa')
    z0 = espalda_z(ctx, 0.3)
    # Bien atrás (por fuera del pelo) y alta: sobresale por encima de la cabeza como las de verdad
    y0 = atras_y(ctx, z0) + 0.22
    ancho, alto = 0.7, 1.6
    inclina = 0.22
    arriba = lambda t: np.array([0, y0 + inclina * t, z0 + alto * t])
    # Marco: dos parales, travesaños y el espaldar de guadua
    for sx in (-1, 1):
        a, b = arriba(-0.1) + np.array([sx * ancho, 0, 0]), arriba(1.0) + np.array([sx * ancho, 0, 0])
        ctx.pieza(clay.sweep(ctx.nombre(f'paral silleta {sx}'), [a, b], 0.035, (1, 1), ctx.coll, madera, segments=8, samples=2), 'torso')
    for k, t in enumerate((0.0, 0.33, 0.66, 0.98)):
        c = arriba(t)
        ctx.pieza(clay.sweep(ctx.nombre(f'travesano silleta {k}'), [c + np.array([-ancho, 0, 0]), c + np.array([ancho, 0, 0])], 0.028, (1, 1), ctx.coll,
                             madera, segments=8, samples=2), 'torso')
    # Las cargaderas de cabuya por encima de los hombros
    for sx in (-1, 1):
        j = np.array(ctx.D['joint']) * np.array([sx, 1, 1])
        pts = [arriba(0.66) + np.array([sx * 0.28, -0.05, 0]), j + np.array([-sx * 0.05, 0.08, 0.2]), j + np.array([-sx * 0.02, -0.2, 0.08]),
               j + np.array([-sx * 0.06, -0.26, -0.25])]
        ctx.pieza(clay.sweep(ctx.nombre(f'cargadera {sx}'), pts, 0.028, (1, 0.5), ctx.coll, cabuya, segments=6, samples=5), 'torso')
    # Las flores (miran hacia atrás) y un marco de hojas
    atras = np.array([0, 1, -inclina * 0.8])
    def poner_flor(k, u, v, r, col, centro='centro'):
        fl = ropa.flor(ctx, f'flor silleta {k}', r, ctx.m(col, tipo='lisa'), ctx.m(centro, tipo='lisa'))
        p = arriba(v) + np.array([u * ancho, 0.06 + 0.02 * math.sin(k), 0])
        fl.location = tuple(p)
        orientar(fl, (0, -1, 0))
        fl.rotation_quaternion = Vector((0, -1, 0)).rotation_difference(Vector(tuple(unidad(atras))))
        ctx.pieza(fl, 'torso')
    k = 0
    for i, u in enumerate(np.linspace(-0.95, 0.95, 9)):
        for j, v in enumerate(np.linspace(0.05, 0.95, 10)):
            du, dv = u, (v - 0.5) * 2 * (alto / (2 * ancho))
            if patron == 'corazon':
                x, y = du * 1.75, dv * 1.75 + 0.25
                corazon = (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0
                col = 'flor1' if corazon else ('flor2' if (i + j) % 2 else 'flor3')
            else:
                d = math.hypot(du, dv * 0.8)
                col = 'flor2' if d < 0.28 else 'flor1' if d < 0.55 else 'flor3' if d < 0.8 else 'flor4' if d < 1.05 else 'flor5'
            poner_flor(k, u + 0.04 * ((j % 2) - 0.5), v, 0.075 + 0.012 * ((i * 7 + j * 3) % 3), col)
            k += 1
    # Girasol grande en el centro (silleta redonda) y hojas por el borde
    if patron != 'corazon':
        poner_flor(k, 0.0, 0.5, 0.2, 'flor2', 'semillas')
    for j, v in enumerate(np.linspace(0.0, 1.0, 9)):
        for sx in (-1, 1):
            o = clay.blob(ctx.nombre(f'hoja silleta {sx} {j}'), (0, 0, 0), (0.07, 0.02, 0.13), ctx.coll, hoja, n=4, shaper=lambda v: punta(v, 2, 0.6))
            o.location = tuple(arriba(v) + np.array([sx * (ancho + 0.05), 0.05, 0]))
            orientar(o, (sx, 0.3, 0.4 * (j % 3 - 1)))
            ctx.pieza(o, 'torso')


SILLETA = dict(madera='#9A6B42', cabuya='#D8C08A', hojas='#3E8C3A', centro='#F59A2A', semillas='#5A3B1E')


@prenda('silleta_flores', 'espalda', [V('silleta_flores', 'Silleta emblemática de flores', flor1='#E2394C', flor2='#F7C530', flor3='#FFFFFF', flor4='#B05BD6',
                                        flor5='#F58A3C', **SILLETA)], precio=260)
def silleta_flores(ctx):
    silleta(ctx, 'redonda')


@prenda('silleta_corazon', 'espalda', [V('silleta_corazon', 'Silleta de corazón', flor1='#D6203A', flor2='#F7C530', flor3='#FFFFFF', flor4='#F7A7C9',
                                         flor5='#F58A3C', **SILLETA)], precio=260)
def silleta_corazon(ctx):
    silleta(ctx, 'corazon')


def alpargata(ctx):
    """Alpargata: capellada de tela, suela de fique trenzado (anillos) y cintas que se amarran en el tobillo."""
    from ropa_pies import capellada, empeine, suela
    tela, fique, cinta = ctx.m('principal', tipo='tela'), ctx.m('fique', tipo='rib'), ctx.m('cintas', tipo='lisa')
    for sx, x, k in lados(ctx):
        hueso = ctx.hueso_lado('pie', sx)
        f = empeine(x, k * 0.97, punta=0.02, alto=0.8)
        capellada(ctx, sx, x, k, f, tela, 'alpargata')
        suela(ctx, sx, x, k, fique, alto=0.06, parte='suela fique')
        for j, z in enumerate((0.015, 0.035, 0.055)):
            ring = []
            for a in np.linspace(0, 2 * math.pi, 28, endpoint=False):
                ring.append((x + math.cos(a) * 0.214 * k, -0.04 * k + math.sin(a) * 0.312 * k, z * k))
            ctx.pieza(clay.sweep(ctx.nombre(f'trenza fique {ctx.lado(sx)} {j}'), ring, 0.012, (1, 1), ctx.coll, fique, segments=5, samples=2, closed=True),
                      hueso)
        # Cintas cruzadas subiendo por el tobillo
        for j in (-1, 1):
            pts = [(x + j * 0.12 * k, 0.02 * k, 0.16 * k), (x - j * 0.05 * k, 0.1 * k, 0.26 * k), (x + j * 0.1 * k, 0.12 * k, 0.34 * k)]
            ctx.pieza(clay.sweep(ctx.nombre(f'cinta alpargata {ctx.lado(sx)} {j}'), pts, 0.014, (1, 0.5), ctx.coll, cinta, segments=5, samples=4), hueso)
        ctx.pieza(clay.blob(ctx.nombre(f'mono alpargata {ctx.lado(sx)}'), (x, 0.14 * k, 0.33 * k), (0.035, 0.02, 0.025), ctx.coll, cinta, n=4), hueso)


@prenda('alpargatas', 'pies', [V('alpargatas', 'Alpargatas', principal='#FAF7F0', fique='#C9A76A', cintas='#1E1B1A')], precio=70)
def alpargatas(ctx):
    alpargata(ctx)


@prenda('alpargatas_rojas', 'pies', [V('alpargatas_rojas', 'Alpargatas rojas', principal='#C22F3A', fique='#C9A76A', cintas='#C22F3A')], precio=70)
def alpargatas_rojas(ctx):
    alpargata(ctx)


# ---------------------------------------------------------------------------
# Ayudas de los enterizos de animales (morados, azules y verdes)
# ---------------------------------------------------------------------------

def panza(ctx, f, t, ancho, alto, mat, borde=None, nombre='panza animal', forma=2.3, lift=0.012):
    """Parche de la panza (con borde cosido si se da material)."""
    out = []
    o = clay.blob(ctx.nombre(nombre), (0, 0, 0), (ancho, 0.02, alto), ctx.coll, mat, n=7, p=forma)
    r = en_superficie(ctx, f, 0.0, zc(ctx, t), o, lift=lift)
    if r is not None:
        out.append(r)
    if borde is not None:
        pts = []
        for a in np.linspace(0, 2 * math.pi, 24, endpoint=False):
            p, _ = sobre_torso(ctx, f, math.sin(a) * ancho * 0.96, zc(ctx, t) + math.cos(a) * alto * 0.96, 0.03)
            if p is not None:
                pts.append(p)
        if len(pts) > 10:
            out.append(ctx.pieza(clay.sweep(ctx.nombre(f'{nombre} borde'), pts, 0.008, (1, 0.6), ctx.coll, borde, segments=5, samples=3, closed=True),
                                 'torso'))
    return out


def pespuntes(ctx, f, mat):
    T = ctx.D['torso']
    out = []
    for sx in (-1, 1):
        pts = linea_torso(ctx, f, [(sx * T['half'][0] * 0.93, zc(ctx, t)) for t in np.linspace(0.08, 0.92, 7)])
        if len(pts) > 3:
            out.append(costura(ctx, f'pespunte lado {ctx.lado(sx)}', pts, mat, 'torso'))
    return out


def mitones(ctx, mat, dedos=3, nombre='miton'):
    """Guantes de pata sobre las manos (con deditos marcados)."""
    out = []
    for sx in (-1, 1):
        c, d, r = mano(ctx, sx)
        hueso = ctx.hueso_lado('mano', sx)
        out.append(ctx.pieza(clay.blob(ctx.nombre(f'{nombre} {ctx.lado(sx)}'), tuple(c + d * 0.01), (r * 1.1, r * 1.1, r * 1.12), ctx.coll, mat, n=6), hueso))
        fuera = unidad(np.cross(d, (0, -1, 0)) * sx)
        for k in range(dedos):
            a = (k - (dedos - 1) / 2) * 0.5
            dirk = unidad(d + np.array([0, -1, 0]) * 0.3 + fuera * math.sin(a) * 0.6)
            out.append(ctx.pieza(clay.blob(ctx.nombre(f'{nombre} dedo {ctx.lado(sx)} {k}'), tuple(c + dirk * r * 1.02), (r * 0.36, r * 0.36, r * 0.3),
                                           ctx.coll, mat, n=4), hueso))
    return out


def pierna_color(ctx, Pn, mat, desde=0.45, holgura=0.02, nombre='bota color'):
    """Pierna de otro color de la rodilla para abajo (las piernas negras del panda, las medias del zorro)."""
    out = []
    for sx in (-1, 1):
        s = np.array([sx, 1, 1])
        a, b = np.array(Pn['leg_top']) * s, np.array(Pn['leg_bot']) * s
        m_ = a + (b - a) * desde
        r0 = Pn['leg_r'][0] + (Pn['leg_r'][1] - Pn['leg_r'][0]) * desde + holgura
        r1 = Pn['leg_r'][1] + holgura
        cono = sdf.round_cone(m_, b + np.array([0, 0, -0.03]), r0, r1)
        fondo = Pn['bottom']

        def f(P, cono=cono, fondo=fondo):
            return sdf.smax(cono(P), fondo - P[:, 2], 0.01)
        lo, hi = np.minimum(m_, b) - 0.35, np.maximum(m_, b) + 0.35
        out.append(ropa.malla(ctx, f'{nombre} {ctx.lado(sx)}', f, lo, hi, mat, ctx.hueso_lado('pierna', sx)))
    return out


def ojitos(ctx, cap, az=26, el=56, tam=0.1, pestanas=False):
    """Ojitos brillantes sobre la capucha con dos destellos."""
    ojos = ctx.m('ojos', tipo='brillo', color='#16110F')
    brillo = ctx.m('destellos', tipo='brillo', color='#FFFFFF')
    for sx in (-1, 1):
        loc, n = sobre_capucha(ctx, cap, sx * az, el, 0.0)
        o = clay.blob(ctx.nombre(f'ojito capucha {sx}'), (0, 0, 0), (tam, tam * 1.05, tam * 0.5), ctx.coll, ojos, n=5)
        o.location = tuple(loc + n * tam * 0.3)
        orientar(o, n)
        ctx.pieza(o, 'cabeza')
        for k, (dx, dz, r) in enumerate(((-0.3, 0.35, 0.28), (0.3, -0.25, 0.14))):
            ctx.pieza(clay.blob(ctx.nombre(f'destello ojito {sx} {k}'), tuple(loc + n * tam * 0.75 + np.array([dx * tam, 0, dz * tam])),
                                (tam * r, tam * r * 0.6, tam * r), ctx.coll, brillo, n=4), 'cabeza')
        if pestanas:
            for k in range(3):
                p = loc + n * tam * 0.5 + np.array([sx * tam * (0.7 + 0.2 * k), -0.01, tam * (0.6 - 0.25 * k)])
                ctx.pieza(clay.sweep(ctx.nombre(f'pestana capucha {sx} {k}'), [p, p + np.array([sx * 0.035, -0.01, 0.03])], [0.009, 0.002], (1, 1),
                                     ctx.coll, ojos, segments=4, samples=2), 'cabeza')


def hocico(ctx, cap, mat, nariz, el=42, tam=(0.17, 0.12, 0.09), nariz_tam=(0.06, 0.045, 0.04), boca=None):
    """Hocico en la frente de la capucha con nariz brillante (y boquita)."""
    loc, n = sobre_capucha(ctx, cap, 0, el, 0.0)
    o = clay.blob(ctx.nombre('hocico capucha'), (0, 0, 0), tam, ctx.coll, mat, n=6, p=2.2)
    o.location = tuple(loc + n * tam[2] * 0.6)
    orientar(o, n)
    ctx.pieza(o, 'cabeza')
    punta_ = loc + n * tam[2] * 1.45
    ctx.pieza(clay.blob(ctx.nombre('nariz capucha'), tuple(punta_ + np.array([0, 0, tam[1] * 0.35])), nariz_tam, ctx.coll, nariz, n=5), 'cabeza')
    ctx.pieza(clay.blob(ctx.nombre('brillo nariz capucha'), tuple(punta_ + np.array([-nariz_tam[0] * 0.4, -0.02, tam[1] * 0.45])),
                        (nariz_tam[0] * 0.3, 0.01, nariz_tam[2] * 0.3), ctx.coll, ctx.m('destellos', tipo='brillo', color='#FFFFFF'), n=4), 'cabeza')
    if boca is not None:
        for sx in (-1, 1):
            b = punta_ + np.array([0, 0, -tam[1] * 0.15])
            ctx.pieza(clay.sweep(ctx.nombre(f'boquita capucha {sx}'), [b, b + np.array([sx * 0.04, -0.005, -0.03]), b + np.array([sx * 0.08, 0.0, -0.01])],
                                 0.008, (1, 1), ctx.coll, boca, segments=4, samples=3), 'cabeza')
    return loc, n


def mejillas(ctx, cap, mat, az=48, el=42):
    for sx in (-1, 1):
        loc, n = sobre_capucha(ctx, cap, sx * az, el, 0.0)
        o = clay.blob(ctx.nombre(f'cachete capucha {sx}'), (0, 0, 0), (0.07, 0.05, 0.02), ctx.coll, mat, n=4)
        o.location = tuple(loc + n * 0.02)
        orientar(o, n)
        ctx.pieza(o, 'cabeza')


def oreja_capucha(ctx, cap, sx, forma, m, dentro, az=46, el=64, tam=1.0, punta_m=None, mechones=None):
    """Orejas sobre la capucha: redonda (panda, ratón), de punta (zorro, gato) o caída (perrito)."""
    loc, n = sobre_capucha(ctx, cap, sx * az, el, 0.03)
    if forma == 'redonda':
        c = loc + n * 0.12 * tam
        o = clay.blob(ctx.nombre(f'oreja {sx}'), (0, 0, 0), (0.18 * tam, 0.18 * tam, 0.07 * tam), ctx.coll, m, n=6)
        o.location = tuple(c)
        orientar(o, (sx * 0.3, -1, 0.3))
        ctx.pieza(o, 'cabeza')
        o = clay.blob(ctx.nombre(f'oreja dentro {sx}'), (0, 0, 0), (0.12 * tam, 0.12 * tam, 0.03 * tam), ctx.coll, dentro, n=5)
        o.location = tuple(c + np.array([0, -0.05 * tam, 0]))
        orientar(o, (sx * 0.3, -1, 0.3))
        ctx.pieza(o, 'cabeza')
    elif forma == 'punta':
        o = clay.blob(ctx.nombre(f'oreja {sx}'), (0, 0, 0), (0.15 * tam, 0.06 * tam, 0.24 * tam), ctx.coll, m, n=6,
                      shaper=lambda v: v * np.column_stack([1 - 0.8 * np.clip(v[:, 2] / (0.24 * tam), 0, 1), np.ones(len(v)), np.ones(len(v))]))
        o.location = tuple(loc + n * 0.16 * tam)
        o.rotation_euler = (math.radians(-10), math.radians(-sx * 20), 0)
        ctx.pieza(o, 'cabeza')
        o = clay.blob(ctx.nombre(f'oreja dentro {sx}'), (0, 0, 0), (0.08 * tam, 0.02, 0.15 * tam), ctx.coll, dentro, n=5,
                      shaper=lambda v: v * np.column_stack([1 - 0.75 * np.clip(v[:, 2] / (0.15 * tam), 0, 1), np.ones(len(v)), np.ones(len(v))]))
        o.location = tuple(loc + n * 0.16 * tam + np.array([0, -0.05 * tam, -0.03 * tam]))
        o.rotation_euler = (math.radians(-10), math.radians(-sx * 20), 0)
        ctx.pieza(o, 'cabeza')
        if punta_m is not None:
            o = clay.blob(ctx.nombre(f'punta oreja {sx}'), (0, 0, 0), (0.06 * tam, 0.065 * tam, 0.08 * tam), ctx.coll, punta_m, n=5,
                          shaper=lambda v: punta(v, 2, 0.8))
            o.location = tuple(loc + n * 0.16 * tam + np.array([-sx * 0.04 * tam, 0, 0.19 * tam]))
            o.rotation_euler = (math.radians(-10), math.radians(-sx * 20), 0)
            ctx.pieza(o, 'cabeza')
        if mechones is not None:
            for k in range(3):
                ctx.pieza(mechon(ctx, f'mechon oreja {sx} {k}', loc + n * 0.14 * tam + np.array([sx * 0.02 * (k - 1), -0.06, 0.02 * k]),
                                 (sx * 0.2 * (k - 1), -0.5, 1), 0.08 * tam, 0.018, mechones, 'cabeza'), 'cabeza')
    else:  # caída (perrito): baja pegada al lado de la capucha
        pts, normales = [], []
        for e in (el, el - 18, el - 38, el - 58):
            q, nq = sobre_capucha(ctx, cap, sx * az, e, 0.0)
            pts.append(q + nq * 0.06)
            normales.append(nq)
        pts[-1] = pts[-1] + normales[-1] * 0.04 + np.array([0, 0, -0.06])
        ctx.pieza(clay.sweep(ctx.nombre(f'oreja {sx}'), pts, [0.1, 0.16, 0.16, 0.11], (0.3, 1.0), ctx.coll, m, segments=12, samples=6,
                             up_fn=lambda q, c=ctx.hc: unidad(q - c)), 'cabeza')
        ctx.pieza(clay.sweep(ctx.nombre(f'oreja dentro {sx}'), [q + unidad(q - ctx.hc) * 0.035 + np.array([0, -0.01, 0]) for q in pts[1:]],
                             [0.1, 0.1, 0.06], (0.2, 1.0), ctx.coll, dentro, segments=10, samples=5, up_fn=lambda q, c=ctx.hc: unidad(q - c)), 'cabeza')


# ---------------------------------------------------------------------------
# MORADO · Pandas con bambú
# ---------------------------------------------------------------------------

@prenda('enterizo_panda', 'conjunto', [V('enterizo_panda', 'Enterizo de panda', principal='#F7F4EE', negro='#26211F', panza='#FFFFFF', almohadillas='#F2A5B8',
                                         costura='#D9D2C6')], precio=150)
def enterizo_panda(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    negro = ctx.m('negro', tipo='peluche')
    D = ctx.D
    # Mangas y piernas negras, y la franja negra por los hombros (como un panda de verdad)
    objs += ropa.mangas(ctx, D['arm']['wrist_t'] - 0.01, negro, holgura=(0.068, 0.058))
    objs += pierna_color(ctx, Pn, negro, desde=0.3, holgura=0.022, nombre='pierna negra')
    for lado, atras in (('frente', False), ('espalda', True)):
        pts = linea_torso(ctx, f, [(x, zc(ctx, 0.9 - 0.12 * (1 - abs(x) / 0.5))) for x in np.linspace(-0.5, 0.5, 9)], 0.02, atras)
        if len(pts) > 4:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'franja hombros {lado}'), pts, 0.1, (0.35, 1.0), ctx.coll, negro, segments=10, samples=4,
                                             up_fn=lambda q: sdf.normal(f, np.array([q]))[0]), 'torso'))
    objs += panza(ctx, f, 0.4, 0.22, 0.26, ctx.m('panza', tipo='peluche'), borde=ctx.m('costura', tipo='lisa'))
    # Mechoncitos del pecho, guantes negros con almohadillas rosadas y costuras
    for k, inc in enumerate((-0.4, 0.0, 0.4)):
        p, n = sobre_torso(ctx, f, inc * 0.1, zc(ctx, 0.7), 0.0)
        if p is not None:
            objs.append(mechon(ctx, f'mechon pecho {k}', p, n + np.array([inc, 0, 0.8]), 0.06, 0.02, ctx.m('principal', tipo='peluche'), 'torso'))
    objs += mitones(ctx, negro)
    alm = ctx.m('almohadillas', tipo='peluche')
    for sx in (-1, 1):
        c, d, r = mano(ctx, sx)
        objs.append(ctx.pieza(clay.blob(ctx.nombre(f'almohadilla mano {ctx.lado(sx)}'), tuple(c + np.array([0, -r * 1.05, -0.01])), (r * 0.5, 0.02, r * 0.4),
                                        ctx.coll, alm, n=4), ctx.hueso_lado('mano', sx)))
    objs += pespuntes(ctx, f, ctx.m('costura', tipo='lisa'))
    return objs


@prenda('capucha_panda_bambu', 'cabeza', [V('capucha_panda_bambu', 'Capucha de panda con hojitas', principal='#F7F4EE', negro='#26211F', dentro='#6B6663',
                                              cachetes='#F4A6B8', hojas='#5FB04F', tallo='#8CC63F')], oculta=COP, precio=80)
def capucha_panda_bambu(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    negro = ctx.m('negro', tipo='peluche')
    for sx in (-1, 1):
        oreja_capucha(ctx, cap, sx, 'redonda', negro, ctx.m('dentro', tipo='peluche'), az=48, el=66)
        # Manchas negras de los ojos (inclinadas) con el ojito encima
        loc, n = sobre_capucha(ctx, cap, sx * 27, 55, 0.0)
        o = clay.blob(ctx.nombre(f'mancha ojo {sx}'), (0, 0, 0), (0.17, 0.13, 0.045), ctx.coll, negro, n=5)
        o.location = tuple(loc + n * 0.015)
        orientar(o, n)
        ctx.pieza(o, 'cabeza')
    ojitos(ctx, cap, az=27, el=55, tam=0.075)
    hocico(ctx, cap, m, negro, el=43, tam=(0.15, 0.1, 0.07), boca=negro)
    mejillas(ctx, cap, ctx.m('cachetes', tipo='peluche'), az=50, el=44)
    # Ramita de bambú con hojas sobre la oreja
    loc, n = sobre_capucha(ctx, cap, 30, 80, 0.02)
    tallo, hojas = ctx.m('tallo', tipo='lisa'), ctx.m('hojas', tipo='lisa')
    ctx.pieza(clay.sweep(ctx.nombre('ramita bambu'), [loc, loc + np.array([0.12, 0.02, 0.12]), loc + np.array([0.26, 0.05, 0.16])], 0.02, (1, 1), ctx.coll,
                         tallo, segments=6, samples=3), 'cabeza')
    for k, (dx, dz, ang) in enumerate(((0.12, 0.12, 0.8), (0.2, 0.16, -0.5), (0.26, 0.16, 0.3))):
        o = clay.blob(ctx.nombre(f'hoja bambu {k}'), (0, 0, 0), (0.035, 0.012, 0.1), ctx.coll, hojas, n=4, shaper=lambda v: punta(v, 2, 0.7))
        o.location = tuple(loc + np.array([dx, 0.02, dz + 0.06]))
        orientar(o, (math.sin(ang), -0.2, math.cos(ang)))
        ctx.pieza(o, 'cabeza')


@prenda('mochila_bambu', 'espalda', [V('mochila_bambu', 'Atado de bambú a la espalda', tallo='#8CC63F', nudos='#6A9B2E', hojas='#5FB04F', cuerda='#C9A76A')],
        precio=90)
def mochila_bambu(ctx):
    from ropa_accesorios import atras_y, espalda_z
    tallo, nudos, hojas, cuerda = ctx.m('tallo', tipo='lisa'), ctx.m('nudos', tipo='lisa'), ctx.m('hojas', tipo='lisa'), ctx.m('cuerda', tipo='rib')
    z0 = espalda_z(ctx, 0.2)
    y0 = atras_y(ctx, z0) + 0.12
    for k, (dx, alto, inc) in enumerate(((-0.14, 2.05, -0.2), (-0.05, 2.3, -0.06), (0.05, 2.2, 0.08), (0.14, 1.95, 0.2), (0.0, 1.8, 0.0))):
        a = np.array([dx, y0 + 0.04 * (k % 2), z0])
        b = a + np.array([inc, 0.12, alto])
        ctx.pieza(clay.sweep(ctx.nombre(f'tallo bambu {k}'), [a, b], 0.05, (1, 1), ctx.coll, tallo, segments=10, samples=2), 'torso')
        for j, t in enumerate(np.linspace(0.2, 0.95, 4)):
            ctx.pieza(clay.blob(ctx.nombre(f'nudo bambu {k} {j}'), tuple(a + (b - a) * t), (0.058, 0.058, 0.018), ctx.coll, nudos, n=5), 'torso')
        for j in range(3):
            ang = (j - 1) * 0.9 + k
            o = clay.blob(ctx.nombre(f'hoja atado {k} {j}'), (0, 0, 0), (0.04, 0.012, 0.13), ctx.coll, hojas, n=4, shaper=lambda v: punta(v, 2, 0.7))
            o.location = tuple(b + np.array([math.sin(ang) * 0.07, 0.02, 0.06]))
            orientar(o, (math.sin(ang), 0.2, 0.8))
            ctx.pieza(o, 'torso')
    # Dos amarres de cuerda y las cargaderas por los hombros
    for j, t in enumerate((0.25, 0.6)):
        c = np.array([0, y0 + 0.07, z0 + 1.5 * t])
        ring = [c + np.array([math.cos(a) * 0.24, math.sin(a) * 0.09, 0]) for a in np.linspace(0, 2 * math.pi, 16, endpoint=False)]
        ctx.pieza(clay.sweep(ctx.nombre(f'amarre bambu {j}'), ring, 0.018, (1, 1), ctx.coll, cuerda, segments=6, samples=2, closed=True), 'torso')
    for sx in (-1, 1):
        j = np.array(ctx.D['joint']) * np.array([sx, 1, 1])
        pts = [np.array([sx * 0.16, y0 + 0.02, z0 + 0.7]), j + np.array([-sx * 0.05, 0.08, 0.18]), j + np.array([-sx * 0.02, -0.2, 0.06]),
               j + np.array([-sx * 0.06, -0.26, -0.26])]
        ctx.pieza(clay.sweep(ctx.nombre(f'cargadera bambu {sx}'), pts, 0.024, (1, 0.5), ctx.coll, cuerda, segments=6, samples=5), 'torso')


@prenda('pantuflas_panda_garra', 'pies', [V('pantuflas_panda_garra', 'Patas de panda', principal='#26211F', almohadillas='#F2A5B8', garras='#F4EEE4',
                                           suela='#26211F')], precio=60)
def pantuflas_panda_garra(ctx):
    m, alm, gm = ctx.m('principal', tipo='peluche'), ctx.m('almohadillas', tipo='peluche'), ctx.m('garras', tipo='brillo')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        hueso = ctx.hueso_lado('pie', sx)
        for j in (-1.5, -0.5, 0.5, 1.5):
            c = np.array([x + j * 0.07 * k, -0.33 * k, 0.1 * k])
            ctx.pieza(clay.blob(ctx.nombre(f'dedo panda {ctx.lado(sx)} {j}'), tuple(c), (0.045 * k, 0.05 * k, 0.045 * k), ctx.coll, m, n=5), hueso)
            g = clay.blob(ctx.nombre(f'garra panda {ctx.lado(sx)} {j}'), (0, 0, 0), (0.012, 0.012, 0.035 * k), ctx.coll, gm, n=4, shaper=lambda v: punta(v, 2, 0.8))
            g.location = tuple(c + np.array([0, -0.05 * k, 0.0]))
            orientar(g, (0, -1, -0.3))
            ctx.pieza(g, hueso)
        ctx.pieza(clay.blob(ctx.nombre(f'almohadilla panda {ctx.lado(sx)}'), (x, -0.16 * k, 0.24 * k), (0.09 * k, 0.065 * k, 0.022 * k), ctx.coll, alm, n=5),
                  hueso)


# ---------------------------------------------------------------------------
# MORADO · El perrito (Él) y la pulguita (Ella)
# ---------------------------------------------------------------------------

@prenda('enterizo_perrito', 'conjunto', [V('enterizo_perrito', 'Enterizo de perrito', principal='#C98B4E', panza='#F4DDBB', manchas='#7A4A2A', collar='#D6203A',
                                           placa='#F2C75C', almohadillas='#3A2A20', costura='#E8B983')], para=('el',), precio=150)
def enterizo_perrito(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    T = ctx.D['torso']
    objs += panza(ctx, f, 0.42, 0.21, 0.27, ctx.m('panza', tipo='peluche'), borde=ctx.m('costura', tipo='lisa'))
    # Manchas café (una grande en la espalda, otras en el costado y en una pierna)
    manchas = ctx.m('manchas', tipo='peluche')
    for k, (x, t, sx_, sz, atras) in enumerate(((0.1, 0.5, 0.2, 0.17, True), (-0.18, 0.25, 0.1, 0.09, True), (0.26, 0.6, 0.08, 0.1, False))):
        o = clay.blob(ctx.nombre(f'mancha perrito {k}'), (0, 0, 0), (sx_, 0.018, sz), ctx.coll, manchas, n=6, p=2.1)
        r = en_superficie(ctx, f, x, zc(ctx, t), o, lift=0.01, atras=atras)
        if r is not None:
            objs.append(r)
    c = np.array(Pn['leg_bot'])
    o = clay.blob(ctx.nombre('mancha pierna'), (0, 0, 0), (0.08, 0.016, 0.07), ctx.coll, manchas, n=5)
    r = en_superficie(ctx, fp, c[0], Pn['bottom'] + 0.16, o, ctx.hueso_lado('pierna', 1), lift=0.012)
    if r is not None:
        objs.append(r)
    # Collar rojo con hebilla y la placa en forma de huesito
    nc, _ = ctx.D['neck_hole']
    ring = sdf.ring_points(f, (0, nc[1], nc[2] - 0.05), (0, 0, 1), 0.6, 28, lift=0.03)
    col = ctx.m('collar', tipo='brillo')
    if len(ring) > 10:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('collar perrito'), ring, 0.035, (0.6, 1.0), ctx.coll, col, segments=8, samples=3, closed=True), 'torso'))
    p, n = sobre_torso(ctx, f, 0.0, nc[2] - 0.12, 0.06)
    if p is not None:
        placa = ctx.m('placa', tipo='metal')
        objs.append(ctx.pieza(clay.blob(ctx.nombre('argolla placa'), tuple(p + np.array([0, 0, 0.04])), (0.02, 0.012, 0.02), ctx.coll, placa, n=4), 'torso'))
        for j in (-1, 1):
            for i in (-1, 1):
                objs.append(ctx.pieza(clay.blob(ctx.nombre(f'hueso placa {j} {i}'), tuple(p + np.array([j * 0.05, -0.005, i * 0.018])), (0.022, 0.012, 0.022),
                                                ctx.coll, placa, n=4), 'torso'))
        objs.append(ctx.pieza(clay.rbox(ctx.nombre('barra placa'), tuple(p), (0.05, 0.01, 0.018), ctx.coll, placa, p=4, n=3, subsurf=1), 'torso'))
    # Guantes de patita con almohadillas y costuras
    objs += mitones(ctx, ctx.m('principal', tipo='peluche'), nombre='patita')
    alm = ctx.m('almohadillas', tipo='peluche')
    for sx in (-1, 1):
        c_, d, r_ = mano(ctx, sx)
        for k, (dx, dz, s) in enumerate(((0, -0.01, 0.4), (-0.35, 0.3, 0.18), (0.0, 0.4, 0.18), (0.35, 0.3, 0.18))):
            objs.append(ctx.pieza(clay.blob(ctx.nombre(f'almohadilla patita {ctx.lado(sx)} {k}'), tuple(c_ + np.array([dx * r_, -r_ * 1.08, dz * r_])),
                                            (r_ * s, 0.02, r_ * s * 0.85), ctx.coll, alm, n=4), ctx.hueso_lado('mano', sx)))
    objs += pespuntes(ctx, f, ctx.m('costura', tipo='lisa'))
    del T
    return objs


@prenda('capucha_perrito', 'cabeza', [V('capucha_perrito', 'Capucha de perrito', principal='#C98B4E', orejas='#7A4A2A', dentro='#F4DDBB', nariz='#2A1C16',
                                        lengua='#F27A8E', mancha='#7A4A2A')], para=('el',), oculta=COP, precio=80)
def capucha_perrito(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    for sx in (-1, 1):
        oreja_capucha(ctx, cap, sx, 'caida', ctx.m('orejas', tipo='peluche'), ctx.m('dentro', tipo='peluche'), az=70, el=60)
    ojitos(ctx, cap, az=27, el=57, tam=0.085)
    # Cejitas y mancha sobre un ojo
    for sx in (-1, 1):
        a, n = sobre_capucha(ctx, cap, sx * 27, 69, 0.0)
        ctx.pieza(clay.blob(ctx.nombre(f'cejita perrito {sx}'), tuple(a + n * 0.02), (0.05, 0.03, 0.02), ctx.coll, ctx.m('orejas', tipo='peluche'), n=4),
                  'cabeza')
    loc, n = sobre_capucha(ctx, cap, 28, 58, 0.0)
    o = clay.blob(ctx.nombre('mancha ojo perrito'), (0, 0, 0), (0.16, 0.14, 0.03), ctx.coll, ctx.m('mancha', tipo='peluche'), n=5)
    o.location = tuple(loc + n * 0.01)
    orientar(o, n)
    ctx.pieza(o, 'cabeza')
    punta_loc, pn = hocico(ctx, cap, ctx.m('dentro', tipo='peluche'), ctx.m('nariz', tipo='brillo'), el=42, tam=(0.2, 0.14, 0.1), nariz_tam=(0.075, 0.05, 0.05),
                           boca=ctx.m('nariz', tipo='brillo'))
    # La lengüita afuera
    lg = clay.blob(ctx.nombre('lengua perrito'), (0, 0, 0), (0.06, 0.02, 0.07), ctx.coll, ctx.m('lengua', tipo='brillo'), n=5)
    lg.location = tuple(punta_loc + pn * 0.2 + np.array([0.02, -0.02, -0.14]))
    orientar(lg, (0, -0.6, -0.6))
    ctx.pieza(lg, 'cabeza')


@prenda('cola_perrito', 'cola', [V('cola_perrito', 'Colita de perrito', principal='#C98B4E', punta='#F4DDBB')], para=('el',), precio=35)
def cola_perrito(ctx):
    b = base_cola(ctx)
    m = ctx.m('principal', tipo='peluche')
    pts = [b, b + np.array([0.03, 0.14, 0.04]), b + np.array([0.08, 0.24, 0.18]), b + np.array([0.04, 0.24, 0.32]), b + np.array([-0.04, 0.18, 0.36])]
    ctx.pieza(clay.sweep(ctx.nombre('cola perrito'), pts, [0.06, 0.065, 0.06, 0.05, 0.04], (1, 1), ctx.coll, m, segments=10, samples=6), 'pelvis')
    ctx.pieza(clay.blob(ctx.nombre('punta cola perrito'), tuple(pts[-1] + np.array([-0.02, -0.01, 0.01])), (0.05, 0.05, 0.05), ctx.coll,
                        ctx.m('punta', tipo='peluche'), n=5), 'pelvis')


@prenda('pantuflas_perrito', 'pies', [V('pantuflas_perrito', 'Patitas de perrito', principal='#C98B4E', almohadillas='#3A2A20', suela='#7A4A2A')],
        para=('el',), precio=60)
def pantuflas_perrito(ctx):
    m, alm = ctx.m('principal', tipo='peluche'), ctx.m('almohadillas', tipo='peluche')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        hueso = ctx.hueso_lado('pie', sx)
        for j in (-1.5, -0.5, 0.5, 1.5):
            ctx.pieza(clay.blob(ctx.nombre(f'dedo perrito {ctx.lado(sx)} {j}'), (x + j * 0.07 * k, -0.33 * k, 0.1 * k), (0.045 * k, 0.05 * k, 0.045 * k),
                                ctx.coll, m, n=5), hueso)
            ctx.pieza(clay.blob(ctx.nombre(f'frijolito {ctx.lado(sx)} {j}'), (x + j * 0.065 * k, -0.36 * k, 0.16 * k), (0.022 * k, 0.012, 0.018 * k),
                                ctx.coll, alm, n=4), hueso)


PULGA = dict(principal='#8E3B26', segmentos='#6A2A1A', panza='#C9774F', pelitos='#3A1A10', costura='#B85E3E')


@prenda('enterizo_pulga', 'conjunto', [V('enterizo_pulga', 'Enterizo de pulguita', **PULGA)], para=('ella',), precio=150)
def enterizo_pulga(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='brillo', holgura=0.06)
    T = ctx.D['torso']
    # Caparazón por segmentos: anillos brillantes alrededor del cuerpo y placas claritas en la panza
    seg = ctx.m('segmentos', tipo='brillo')
    for k, t in enumerate(np.linspace(0.12, 0.85, 6)):
        ring = sdf.ring_points(f, (0, T['c'][1], zc(ctx, t)), (0, 0, 1), 1.0, 36, lift=0.012)
        if len(ring) > 12:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'segmento pulga {k}'), ring, 0.022, (0.6, 1.0), ctx.coll, seg, segments=6, samples=3, closed=True),
                                  'torso'))
        placa = clay.blob(ctx.nombre(f'placa pulga {k}'), (0, 0, 0), (T['half'][0] * (0.5 - 0.12 * abs(t - 0.45)), 0.018, 0.045), ctx.coll,
                          ctx.m('panza', tipo='brillo'), n=5, p=2.6)
        r = en_superficie(ctx, f, 0.0, zc(ctx, t) + 0.05, placa, lift=0.012)
        if r is not None:
            objs.append(r)
    # Pelitos duros (cerdas) por la espalda y los hombros
    pel = ctx.m('pelitos', tipo='lisa')
    k = 0
    for t in np.linspace(0.2, 0.8, 4):
        for x in np.linspace(-0.3, 0.3, 4):
            p, n = sobre_torso(ctx, f, x, zc(ctx, t), 0.0, atras=True)
            if p is not None:
                objs.append(mechon(ctx, f'cerda {k}', p, n + np.array([0, 0.2, -0.4]), 0.05, 0.008, pel, 'torso', n=3))
                k += 1
    objs += garras(ctx, -1, pel, n=2, largo=0.06, grosor=0.018, nombre='ganchito')
    objs += garras(ctx, 1, pel, n=2, largo=0.06, grosor=0.018, nombre='ganchito')
    objs += pespuntes(ctx, f, ctx.m('costura', tipo='lisa'))
    return objs


@prenda('capucha_pulga', 'cabeza', [V('capucha_pulga', 'Capucha de pulguita', principal='#8E3B26', ojos='#3A0E12', facetas='#6E1C22', antenas='#6A2A1A',
                                      boca='#C9774F')], para=('ella',), oculta=COP, precio=80)
def capucha_pulga(ctx):
    m = ctx.m('principal', tipo='brillo')
    cap = capucha(ctx, m)
    ojos, facetas, ant = ctx.m('ojos', tipo='brillo'), ctx.m('facetas', tipo='brillo'), ctx.m('antenas', tipo='brillo')
    brillo = ctx.m('destellos', tipo='brillo', color='#FFFFFF')
    # Ojazos compuestos: una bola con facetas (bolitas) y destellos
    for sx in (-1, 1):
        loc, n = sobre_capucha(ctx, cap, sx * 34, 56, 0.0)
        o = clay.blob(ctx.nombre(f'ojo compuesto {sx}'), (0, 0, 0), (0.16, 0.16, 0.1), ctx.coll, ojos, n=6)
        o.location = tuple(loc + n * 0.06)
        orientar(o, n)
        ctx.pieza(o, 'cabeza')
        c = loc + n * 0.06
        base = unidad(np.cross(n, (0, 0, 1)))
        arriba_ = unidad(np.cross(base, n))
        for i in range(-2, 3):
            for j in range(-2, 3):
                if i * i + j * j > 5:
                    continue
                q = c + base * i * 0.05 + arriba_ * j * 0.05
                q = c + unidad(q - c + n * 0.12) * 0.12
                ctx.pieza(clay.blob(ctx.nombre(f'faceta {sx} {i} {j}'), tuple(q), (0.028, 0.028, 0.028), ctx.coll, facetas, n=3), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'destello pulga {sx}'), tuple(c + n * 0.14 + arriba_ * 0.05 - base * 0.03), (0.03, 0.015, 0.03), ctx.coll, brillo, n=4),
                  'cabeza')
        # Antenas con segmentos y bolita
        b, nb = sobre_capucha(ctx, cap, sx * 16, 76, 0.02)
        pts = [b, b + np.array([sx * 0.05, -0.08, 0.2]), b + np.array([sx * 0.16, -0.06, 0.38]), b + np.array([sx * 0.3, 0.02, 0.44])]
        ctx.pieza(clay.sweep(ctx.nombre(f'antena pulga {sx}'), pts, [0.025, 0.02, 0.016, 0.012], (1, 1), ctx.coll, ant, segments=6, samples=5), 'cabeza')
        ps, _ = clay.catmull_rom(pts, 5)
        for j, i in enumerate(range(2, len(ps) - 1, 3)):
            ctx.pieza(clay.blob(ctx.nombre(f'segmento antena {sx} {j}'), tuple(ps[i]), (0.028, 0.028, 0.02), ctx.coll, ant, n=3), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'bolita antena {sx}'), tuple(pts[-1]), (0.04, 0.04, 0.04), ctx.coll, ant, n=4), 'cabeza')
    # La trompita chupadora (chiquita y tierna) y pelitos en la coronilla
    loc, n = sobre_capucha(ctx, cap, 0, 42, 0.0)
    ctx.pieza(clay.sweep(ctx.nombre('trompita pulga'), [loc, loc + n * 0.08 + np.array([0, -0.02, -0.04]), loc + n * 0.12 + np.array([0, 0, -0.12])],
                         [0.035, 0.022, 0.012], (1, 1), ctx.coll, ctx.m('boca', tipo='brillo'), segments=6, samples=4), 'cabeza')
    for k, (az, el) in enumerate(((0, 88), (20, 80), (-20, 80), (180, 70), (160, 60), (-160, 60))):
        p, nn = sobre_capucha(ctx, cap, az, el, 0.0)
        ctx.pieza(mechon(ctx, f'cerda capucha {k}', p, nn, 0.06, 0.01, ant, 'cabeza', n=3), 'cabeza')


@prenda('patitas_pulga', 'espalda', [V('patitas_pulga', 'Patitas de pulguita', principal='#8E3B26', uniones='#6A2A1A', ganchos='#3A1A10')],
        para=('ella',), precio=70)
def patitas_pulga(ctx):
    """Dos pares de patitas de más que salen de la espalda y se doblan hacia adelante."""
    from ropa_accesorios import atras_y, espalda_z
    m, un, gm = ctx.m('principal', tipo='brillo'), ctx.m('uniones', tipo='brillo'), ctx.m('ganchos', tipo='lisa')
    for j, t in enumerate((0.62, 0.38)):
        z = espalda_z(ctx, t)
        y = atras_y(ctx, z)
        for sx in (-1, 1):
            a = np.array([sx * 0.26, y - 0.02, z])
            b = a + np.array([sx * 0.4, 0.04, 0.16 - 0.06 * j])
            c = b + np.array([sx * 0.16, -0.24, -0.3])
            d = c + np.array([sx * 0.05, -0.12, -0.12])
            for i, (p, q) in enumerate(((a, b), (b, c), (c, d))):
                ctx.pieza(clay.sweep(ctx.nombre(f'pata pulga {j} {sx} {i}'), [p, q], [0.04 - 0.008 * i, 0.034 - 0.008 * i], (1, 1), ctx.coll, m,
                                     segments=8, samples=2), 'torso')
            for i, p in enumerate((b, c)):
                ctx.pieza(clay.blob(ctx.nombre(f'rodilla pulga {j} {sx} {i}'), tuple(p), (0.045, 0.045, 0.045), ctx.coll, un, n=4), 'torso')
            g = clay.blob(ctx.nombre(f'gancho pulga {j} {sx}'), (0, 0, 0), (0.014, 0.014, 0.04), ctx.coll, gm, n=3, shaper=lambda v: punta(v, 2, 0.8))
            g.location = tuple(d + np.array([0, -0.02, -0.02]))
            orientar(g, (sx * 0.2, -0.6, -0.8))
            ctx.pieza(g, 'torso')


@prenda('pantuflas_pulga', 'pies', [V('pantuflas_pulga', 'Patas saltarinas de pulguita', principal='#8E3B26', ganchos='#3A1A10', suela='#6A2A1A')],
        para=('ella',), precio=60)
def pantuflas_pulga(ctx):
    m, gm = ctx.m('principal', tipo='brillo'), ctx.m('ganchos', tipo='lisa')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        hueso = ctx.hueso_lado('pie', sx)
        for j in (-1, 1):
            g = clay.blob(ctx.nombre(f'gancho pie pulga {ctx.lado(sx)} {j}'), (0, 0, 0), (0.02, 0.02, 0.07 * k), ctx.coll, gm, n=4,
                          shaper=lambda v: punta(v, 2, 0.8))
            g.location = tuple(np.array([x + j * 0.06 * k, -0.36 * k, 0.08 * k]))
            orientar(g, (j * 0.3, -1, -0.5))
            ctx.pieza(g, hueso)
        # El resorte del salto en el talón
        ring = [np.array([x, 0.2 * k, 0.1 * k]) + np.array([math.cos(a) * 0.05, math.sin(a) * 0.05, a * 0.012]) for a in np.linspace(0, 6 * math.pi, 30)]
        ctx.pieza(clay.sweep(ctx.nombre(f'resorte pulga {ctx.lado(sx)}'), ring, 0.012, (1, 1), ctx.coll, gm, segments=5, samples=2), hueso)


# ---------------------------------------------------------------------------
# MORADO · Zorritos del bosque
# ---------------------------------------------------------------------------

@prenda('enterizo_zorro', 'conjunto', [V('enterizo_zorro', 'Enterizo de zorrito', principal='#E8772E', pecho='#FFF6EA', medias='#3A2A24', costura='#F4A66A')],
        precio=150)
def enterizo_zorro(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    pecho = ctx.m('pecho', tipo='peluche')
    # Pechera blanca en V con mechones
    o = clay.blob(ctx.nombre('pechera zorro'), (0, 0, 0), (0.23, 0.022, 0.34), ctx.coll, pecho, n=7,
                  shaper=lambda v: v * np.column_stack([1 - 0.55 * np.clip(-v[:, 2] / 0.34, 0, 1), np.ones(len(v)), np.ones(len(v))]))
    r = en_superficie(ctx, f, 0.0, zc(ctx, 0.55), o, lift=0.014)
    if r is not None:
        objs.append(r)
    for k, (x, t, inc) in enumerate(((-0.1, 0.8, -0.5), (0.0, 0.84, 0.0), (0.1, 0.8, 0.5), (-0.06, 0.7, -0.3), (0.06, 0.7, 0.3))):
        p, n = sobre_torso(ctx, f, x, zc(ctx, t), 0.0)
        if p is not None:
            objs.append(mechon(ctx, f'mechon pechera {k}', p, n + np.array([inc, 0, -0.6]), 0.07, 0.024, pecho, 'torso'))
    medias = ctx.m('medias', tipo='peluche')
    objs += pierna_color(ctx, Pn, medias, desde=0.55, holgura=0.022, nombre='media zorro')
    objs += mitones(ctx, medias, nombre='patita zorro')
    objs += pespuntes(ctx, f, ctx.m('costura', tipo='lisa'))
    return objs


@prenda('capucha_zorro', 'cabeza', [V('capucha_zorro', 'Capucha de zorrito con coronita de hojas', principal='#E8772E', dentro='#FFF6EA', puntas='#3A2A24',
                                      nariz='#2A1C16', hojas1='#D9542B', hojas2='#F2A93B', hojas3='#8C4A22', bellota='#8C5A2B')], oculta=COP, precio=90)
def capucha_zorro(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    dentro = ctx.m('dentro', tipo='peluche')
    for sx in (-1, 1):
        oreja_capucha(ctx, cap, sx, 'punta', m, dentro, az=42, el=66, tam=1.25, punta_m=ctx.m('puntas', tipo='peluche'), mechones=dentro)
        # Cachetes blancos esponjosos a los lados de la cara
        for k, el in enumerate((34, 20)):
            p, n = sobre_capucha(ctx, cap, sx * 58, el, 0.0)
            ctx.pieza(mechon(ctx, f'cachete zorro {sx} {k}', p, n + np.array([sx * 0.5, -0.3, -0.4]), 0.09, 0.04, dentro, 'cabeza'), 'cabeza')
    ojitos(ctx, cap, az=27, el=57, tam=0.08, pestanas=not ctx.el)
    hocico(ctx, cap, dentro, ctx.m('nariz', tipo='brillo'), el=43, tam=(0.15, 0.13, 0.1), nariz_tam=(0.05, 0.04, 0.035), boca=ctx.m('nariz', tipo='brillo'))
    # Coronita de hojas de otoño con dos bellotas
    cols = ['hojas1', 'hojas2', 'hojas3']
    for k, az in enumerate(np.linspace(-150, 150, 13)):
        p, n = sobre_capucha(ctx, cap, az, 68 if abs(az) < 100 else 58, 0.0)
        o = clay.blob(ctx.nombre(f'hoja corona {k}'), (0, 0, 0), (0.085, 0.02, 0.15), ctx.coll, ctx.m(cols[k % 3], tipo='lisa'), n=4,
                      shaper=lambda v: punta(v, 2, 0.6))
        o.location = tuple(p + n * 0.05)
        orientar(o, n + np.array([0, 0, 0.6]) + np.array([math.sin(k), 0, 0]) * 0.3)
        ctx.pieza(o, 'cabeza')
    for j, az in enumerate((-30, 34)):
        p, n = sobre_capucha(ctx, cap, az, 72, 0.0)
        ctx.pieza(clay.blob(ctx.nombre(f'bellota {j}'), tuple(p + n * 0.05), (0.035, 0.035, 0.045), ctx.coll, ctx.m('bellota', tipo='brillo'), n=4), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'gorrito bellota {j}'), tuple(p + n * 0.085), (0.04, 0.04, 0.02), ctx.coll, ctx.m('hojas3', tipo='lisa'), n=4),
                  'cabeza')


@prenda('cola_zorro_esponjosa', 'cola', [V('cola_zorro_esponjosa', 'Cola esponjosa de zorrito', principal='#E8772E', punta='#FFF6EA')], precio=60)
def cola_zorro_esponjosa(ctx):
    b = base_cola(ctx)
    m, pu = ctx.m('principal', tipo='peluche'), ctx.m('punta', tipo='peluche')
    pts = [b, b + np.array([0.08, 0.24, -0.02]), b + np.array([0.18, 0.46, 0.14]), b + np.array([0.16, 0.52, 0.4])]
    ctx.pieza(clay.sweep(ctx.nombre('cola zorro'), pts, [0.07, 0.17, 0.16, 0.06], (1, 1), ctx.coll, m, segments=12, samples=7), 'pelvis')
    ps, _ = clay.catmull_rom(pts, 7)
    # Mechones esponjosos a lo largo y la punta blanca
    for j, i in enumerate(range(4, len(ps) - 2, 2)):
        r = 0.16 * math.sin(math.pi * i / len(ps))
        for s in (-1, 1):
            ctx.pieza(mechon(ctx, f'mechon cola {j} {s}', ps[i] + np.array([s * r * 0.7, 0, 0]), (s, 0.3, 0.4), 0.09, 0.04,
                             pu if i > len(ps) * 0.75 else m, 'pelvis'), 'pelvis')
    ctx.pieza(clay.blob(ctx.nombre('punta cola zorro'), tuple(pts[-1] + np.array([0, 0, 0.03])), (0.1, 0.1, 0.13), ctx.coll, pu, n=6), 'pelvis')


@prenda('pantuflas_zorro', 'pies', [V('pantuflas_zorro', 'Patitas de zorrito', principal='#3A2A24', almohadillas='#F4A6B8', suela='#3A2A24')], precio=60)
def pantuflas_zorro(ctx):
    m, alm = ctx.m('principal', tipo='peluche'), ctx.m('almohadillas', tipo='peluche')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        hueso = ctx.hueso_lado('pie', sx)
        for j in (-1, 0, 1):
            ctx.pieza(clay.blob(ctx.nombre(f'dedo zorro {ctx.lado(sx)} {j}'), (x + j * 0.085 * k, -0.33 * k, 0.1 * k), (0.05 * k, 0.055 * k, 0.045 * k),
                                ctx.coll, m, n=5), hueso)
            ctx.pieza(clay.blob(ctx.nombre(f'frijolito zorro {ctx.lado(sx)} {j}'), (x + j * 0.08 * k, -0.37 * k, 0.15 * k), (0.02 * k, 0.012, 0.018 * k),
                                ctx.coll, alm, n=4), hueso)


def aro_cabeza(ctx, el=55):
    """Centro y radio del aro donde se apoya una corona o un gorro (a esa altura de la cabeza con pelo)."""
    from ropa_accesorios import radio_cabeza
    rh = radio_cabeza(ctx, 90, el)
    return np.array([0, 0.02, ctx.hc[2] + rh * math.sin(math.radians(el))]), rh * math.cos(math.radians(el))


# ---------------------------------------------------------------------------
# MORADO · Ratoncitos de Transformice (como cuando se conocieron)
# ---------------------------------------------------------------------------

@prenda('enterizo_raton', 'conjunto', [V('enterizo_raton', 'Enterizo de ratoncito', principal='#9C7B63', panza='#EBD8C4', patitas='#F2A5B8', costura='#C4A48B')],
        precio=150)
def enterizo_raton(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    objs += panza(ctx, f, 0.4, 0.2, 0.28, ctx.m('panza', tipo='peluche'), borde=ctx.m('costura', tipo='lisa'))
    objs += mitones(ctx, ctx.m('patitas', tipo='peluche'), dedos=4, nombre='patita raton')
    # Remiendos cosidos (un ratoncito aventurero) y pespuntes
    cos = ctx.m('costura', tipo='lisa')
    for k, (x, t, atras) in enumerate(((0.22, 0.72, False), (-0.15, 0.3, True))):
        o = clay.rbox(ctx.nombre(f'remiendo raton {k}'), (0, 0, 0), (0.07, 0.012, 0.06), ctx.coll, ctx.m('panza', tipo='peluche'), p=4, n=3, subsurf=1)
        r = en_superficie(ctx, f, x, zc(ctx, t), o, lift=0.012, atras=atras)
        if r is not None:
            objs.append(r)
            for j in range(4):
                p, n = sobre_torso(ctx, f, x - 0.05 + 0.033 * j, zc(ctx, t) + 0.06, 0.03, atras)
                if p is not None:
                    objs.append(ctx.pieza(clay.blob(ctx.nombre(f'puntada remiendo {k} {j}'), tuple(p), (0.004, 0.004, 0.018), ctx.coll, cos, n=3), 'torso'))
    objs += pespuntes(ctx, f, cos)
    return objs


@prenda('capucha_raton', 'cabeza', [V('capucha_raton', 'Capucha de ratoncito', principal='#9C7B63', dentro='#F2A5B8', nariz='#E86A8A', bigotes='#3A2A24',
                                      dientes='#FFFDF6', cachetes='#F4A6B8')], oculta=COP, precio=80)
def capucha_raton(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    for sx in (-1, 1):
        oreja_capucha(ctx, cap, sx, 'redonda', m, ctx.m('dentro', tipo='peluche'), az=56, el=62, tam=1.55)
    ojitos(ctx, cap, az=24, el=56, tam=0.075, pestanas=not ctx.el)
    punta_loc, n = hocico(ctx, cap, m, ctx.m('nariz', tipo='brillo'), el=42, tam=(0.12, 0.1, 0.1), nariz_tam=(0.045, 0.035, 0.035))
    # Bigotes largos, dientes de ratón y cachetes
    big = ctx.m('bigotes', tipo='lisa')
    c = punta_loc + n * 0.12
    for sx in (-1, 1):
        for k, dz in enumerate((0.03, 0.0, -0.03)):
            a = c + np.array([sx * 0.05, 0, dz])
            ctx.pieza(clay.sweep(ctx.nombre(f'bigote {sx} {k}'), [a, a + np.array([sx * 0.16, 0.02, dz * 2]), a + np.array([sx * 0.3, 0.06, dz * 4 - 0.02])],
                                 [0.006, 0.004, 0.002], (1, 1), ctx.coll, big, segments=4, samples=3), 'cabeza')
    d = ctx.m('dientes', tipo='brillo')
    for sx in (-1, 1):
        ctx.pieza(clay.rbox(ctx.nombre(f'diente raton {sx}'), tuple(c + np.array([sx * 0.018, -0.01, -0.07])), (0.016, 0.008, 0.028), ctx.coll, d, p=4, n=3,
                            subsurf=1), 'cabeza')
    mejillas(ctx, cap, ctx.m('cachetes', tipo='peluche'), az=46, el=44)


@prenda('cola_raton', 'cola', [V('cola_raton', 'Colita de ratón', principal='#F2A5B8')], precio=30)
def cola_raton(ctx):
    b = base_cola(ctx)
    pts = [b, b + np.array([0.06, 0.2, -0.1]), b + np.array([0.2, 0.36, -0.02]), b + np.array([0.18, 0.46, 0.18]), b + np.array([0.02, 0.44, 0.3]),
           b + np.array([-0.08, 0.4, 0.24])]
    ctx.pieza(clay.sweep(ctx.nombre('cola raton'), pts, [0.035, 0.03, 0.025, 0.02, 0.015, 0.008], (1, 1), ctx.coll, ctx.m('principal', tipo='lisa'),
                         segments=8, samples=6, caps=('round', 'point')), 'pelvis')


@prenda('queso_espalda', 'espalda', [V('queso_espalda', 'Queso de Transformice', principal='#F7C948', huecos='#D9A21E', correas='#8A5A3C')], precio=70)
def queso_espalda(ctx):
    """La tajada de queso de Transformice, amarrada a la espalda."""
    from ropa_accesorios import atras_y, espalda_z
    m, hue, cor = ctx.m('principal', tipo='brillo'), ctx.m('huecos', tipo='lisa'), ctx.m('correas', tipo='lisa')
    z = espalda_z(ctx, 0.5)
    y = atras_y(ctx, z) + 0.14
    # Cuña: un prisma triangular redondeado (hecho con una malla y suavizado)
    ancho, alto, fondo = 0.34, 0.42, 0.22
    V_ = [(-ancho, 0, -alto * 0.5), (ancho, 0, -alto * 0.5), (-ancho, 0, alto * 0.5), (-ancho, fondo, -alto * 0.5), (ancho, fondo, -alto * 0.5),
          (-ancho, fondo, alto * 0.5)]
    F_ = [(0, 2, 1), (3, 4, 5), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)]
    o = clay.make_mesh_object(ctx.nombre('cuna queso'), V_, F_, ctx.coll, material=m)
    clay.add_subsurf(o, 2, 2)
    o.location = (0, y, z + 0.1)
    o.rotation_euler = (0, math.radians(18), 0)
    ctx.pieza(o, 'torso')
    for k, (dx, dz, r) in enumerate(((-0.18, -0.05, 0.05), (-0.05, 0.08, 0.035), (0.08, -0.1, 0.04), (-0.2, 0.14, 0.03), (0.16, -0.14, 0.025))):
        ctx.pieza(clay.blob(ctx.nombre(f'hueco queso {k}'), (dx, y + fondo + 0.005, z + 0.1 + dz), (r, 0.015, r), ctx.coll, hue, n=4), 'torso')
    for sx in (-1, 1):
        j = np.array(ctx.D['joint']) * np.array([sx, 1, 1])
        pts = [np.array([sx * 0.2, y + 0.02, z + 0.1]), j + np.array([-sx * 0.05, 0.08, 0.18]), j + np.array([-sx * 0.02, -0.2, 0.06]),
               j + np.array([-sx * 0.06, -0.26, -0.26])]
        ctx.pieza(clay.sweep(ctx.nombre(f'correa queso {sx}'), pts, 0.022, (1, 0.5), ctx.coll, cor, segments=6, samples=5), 'torso')


# ---------------------------------------------------------------------------
# MORADO · Sirena (Ella) y tritón (Él)
# ---------------------------------------------------------------------------

def concha(ctx, nombre, c, hacia, r, mat, costillas_mat, hueso, costillas=7):
    """Concha de abanico con sus costillas."""
    o = clay.blob(ctx.nombre(nombre), (0, 0, 0), (r, r * 0.9, r * 0.25), ctx.coll, mat, n=5,
                  shaper=lambda v: v * np.column_stack([1 - 0.6 * np.clip(-v[:, 1] / (r * 0.9), 0, 1), np.ones(len(v)), np.ones(len(v))]))
    o.location = tuple(c)
    orientar(o, hacia)
    out = [ctx.pieza(o, hueso)]
    q = o.rotation_quaternion
    for k in range(costillas):
        a = math.pi * (0.15 + 0.7 * k / (costillas - 1))
        p0 = Vector((0, -r * 0.8, r * 0.2))
        p1 = Vector((math.cos(a) * r * 0.95, math.sin(a) * r * 0.85 - r * 0.2, r * 0.22))
        pts = [np.array(c) + np.array(q @ p0), np.array(c) + np.array(q @ p1)]
        out.append(ctx.pieza(clay.sweep(ctx.nombre(f'{nombre} costilla {k}'), pts, [r * 0.05, r * 0.08], (1, 1), ctx.coll, costillas_mat, segments=4, samples=2),
                             hueso))
    return out


def perlas(ctx, nombre, ring, mat, hueso, r=0.02):
    return [ctx.pieza(clay.blob(ctx.nombre(f'{nombre} {k}'), tuple(p), (r, r, r), ctx.coll, mat, n=3), hueso) for k, p in enumerate(ring)]


@prenda('top_conchas', 'arriba', [V('top_conchas', 'Blusita de sirena con conchas y perlas', principal='#8FD6D0', conchas='#F7B8C8', costillas='#E88AA3',
                                    perlas='#FFF8F2', estrella='#F7A93B')], para=('ella',), precio=120)
def top_conchas(ctx):
    from ropa_arriba import base_camiseta
    objs, f = base_camiseta(ctx, largo_manga=0.0, cuello=False, tipo='brillo', escote=1.2)
    con, cos = ctx.m('conchas', tipo='brillo'), ctx.m('costillas', tipo='brillo')
    for sx in (-1, 1):
        p, n = sobre_torso(ctx, f, sx * 0.13, zc(ctx, 0.62), 0.02)
        if p is not None:
            objs += concha(ctx, f'concha pecho {sx}', p, n, 0.11, con, cos, 'torso')
    nc, _ = ctx.D['neck_hole']
    ring = sdf.ring_points(f, (0, nc[1], nc[2] - 0.03), (0, 0, 1), 0.6, 30, lift=0.03)
    objs += perlas(ctx, 'perla collar', ring, ctx.m('perlas', tipo='brillo'), 'torso')
    ring2 = sdf.ring_points(f, (0, nc[1], nc[2] - 0.1), (0, 0, 1), 0.6, 34, lift=0.03)
    objs += perlas(ctx, 'perla collar largo', [q for q in ring2 if q[1] < 0.1], ctx.m('perlas', tipo='brillo'), 'torso', r=0.016)
    p, n = sobre_torso(ctx, f, 0.0, zc(ctx, 0.3), 0.03)
    if p is not None:
        est = ropa.estrella(ctx, 'estrella de mar', 0.07, ctx.m('estrella', tipo='brillo'), grosor=0.03)
        est.location = tuple(p)
        clay.orient_to(est, n)
        objs.append(ctx.pieza(est, 'torso'))
    return objs


@prenda('cola_sirena', 'abajo', [V('cola_sirena', 'Cola de sirena', principal='#3FB8AF', escamas='#2E9C95', brillo='#9BE8E0', aleta='#B98AE6',
                                   costillas='#8F62C9')], para=('ella',), tambien=('pies',), oculta=('medias',), precio=160)
def cola_sirena(ctx):
    """Cola de sirena de la cintura a los pies: escamas en hileras y aleta grande abajo."""
    T = ctx.D['torso']
    top = T['bottom'] + 0.06
    m = ctx.m('principal', tipo='brillo')
    cuerpo_ = sdf.union(sdf.round_cone((0, 0.03, top), (0, 0.02, 0.3), T['half'][0] + 0.04, 0.32), sdf.round_cone((0, 0.02, 0.3), (0, 0.0, 0.1), 0.32, 0.16),
                        k=0.08)

    def f(P):
        return sdf.smax(cuerpo_(P), P[:, 2] - top - 0.02, 0.01)
    objs = [ropa.malla(ctx, 'cola sirena', f, (-0.7, -0.7, -0.1), (0.7, 0.7, top + 0.1), m, 'pelvis')]
    esc, bri = ctx.m('escamas', tipo='brillo'), ctx.m('brillo', tipo='brillo')
    k = 0
    for fila, z in enumerate(np.linspace(top - 0.05, 0.14, 7)):
        ring = sdf.ring_points(f, (0, 0.02, z), (0, 0, 1), 1.0, 14 + (fila % 2), lift=0.0)
        for j, p in enumerate(ring):
            n = sdf.normal(f, np.array([p]))[0]
            objs.append(escama(ctx, f'escama sirena {k}', np.array(p), n, 0.055 - 0.003 * fila, bri if (j + fila) % 5 == 0 else esc, 'pelvis'))
            k += 1
    # La aleta: dos lóbulos con costillas
    al, cos = ctx.m('aleta', tipo='brillo'), ctx.m('costillas', tipo='brillo')
    for sx in (-1, 1):
        c = np.array([sx * 0.2, -0.02, 0.06])
        o = clay.blob(ctx.nombre(f'aleta sirena {sx}'), (0, 0, 0), (0.28, 0.05, 0.14), ctx.coll, al, n=6,
                      shaper=lambda v: v * np.column_stack([np.ones(len(v)), np.ones(len(v)), 1 - 0.5 * np.clip(-v[:, 0] * sx / 0.28, 0, 1)]))
        o.location = tuple(c)
        o.rotation_euler = (math.radians(-60), 0, math.radians(sx * 12))
        objs.append(ctx.pieza(o, 'pelvis'))
        for j in range(4):
            a = sx * (0.2 + 0.25 * j)
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'costilla aleta {sx} {j}'), [np.array([sx * 0.04, 0.0, 0.08]),
                                                                                        np.array([sx * 0.04 + math.sin(a) * 0.34, -0.12, 0.05 - abs(math.cos(a)) * 0.03])],
                                             [0.018, 0.008], (1, 1), ctx.coll, cos, segments=4, samples=2), 'pelvis'))
    # Cinturón de conchitas
    ring = sdf.ring_points(f, (0, 0.03, top - 0.02), (0, 0, 1), 1.0, 12, lift=0.02)
    for j, p in enumerate(ring):
        n = sdf.normal(f, np.array([p]))[0]
        objs += concha(ctx, f'conchita cintura {j}', np.array(p) + n * 0.02, n, 0.045, al, cos, 'pelvis', costillas=4)
    return objs


@prenda('corona_conchas', 'cabeza', [V('corona_conchas', 'Coronita de conchas y perlas', principal='#F2C75C', conchas='#F7B8C8', costillas='#E88AA3',
                                       perlas='#FFF8F2', estrella='#F7A93B')], para=('ella',), precio=90)
def corona_conchas(ctx):
    from ropa_accesorios import diadema, punto_cabeza
    m = ctx.m('principal', tipo='metal')
    diadema(ctx, m, lift=0.03, grosor=0.03)
    for k, az in enumerate(np.linspace(-60, 60, 7)):
        loc, n = punto_cabeza(ctx, az, 58, 0.05)
        if loc is None:
            continue
        n = np.array(n)
        if k == 3:
            est = ropa.estrella(ctx, 'estrella corona', 0.1, ctx.m('estrella', tipo='brillo'), grosor=0.035)
            est.location = tuple(loc + n * 0.08)
            clay.orient_to(est, np.array([0, -1, 0.4]))
            ctx.pieza(est, 'cabeza')
        elif k % 2:
            concha(ctx, f'concha corona {k}', loc + n * 0.07, n + np.array([0, -0.6, 0]), 0.07, ctx.m('conchas', tipo='brillo'), ctx.m('costillas', tipo='brillo'),
                   'cabeza', costillas=5)
        else:
            ctx.pieza(clay.blob(ctx.nombre(f'perla corona {k}'), tuple(loc + n * 0.06), (0.04, 0.04, 0.04), ctx.coll, ctx.m('perlas', tipo='brillo'), n=4),
                      'cabeza')


@prenda('corona_triton', 'cabeza', [V('corona_triton', 'Corona de tritón', principal='#F2C75C', perlas='#FFF8F2', concha='#8FD6D0', costillas='#3FB8AF')],
        para=('el',), oculta=COP, precio=90)
def corona_triton(ctx):
    m, per = ctx.m('principal', tipo='metal'), ctx.m('perlas', tipo='brillo')
    c, ra = aro_cabeza(ctx, 62)
    r = (ra + 0.03) / 0.62
    ring = [c + np.array([math.cos(a) * r * 0.62, math.sin(a) * r * 0.62, 0]) for a in np.linspace(0, 2 * math.pi, 40, endpoint=False)]
    ctx.pieza(clay.sweep(ctx.nombre('aro corona triton'), ring, 0.05, (0.6, 1.0), ctx.coll, m, segments=8, samples=2, closed=True), 'cabeza')
    for k in range(7):
        a = -math.pi / 2 + (k - 3) * 0.42
        b = c + np.array([math.cos(a) * r * 0.62, math.sin(a) * r * 0.62, 0.02])
        alto = 0.22 if k == 3 else 0.16 - 0.015 * abs(k - 3)
        # Picos como olas (curvados hacia afuera) con perla en la punta
        pts = [b, b + np.array([math.cos(a) * 0.03, math.sin(a) * 0.03, alto * 0.6]), b + np.array([math.cos(a) * 0.07, math.sin(a) * 0.07, alto])]
        ctx.pieza(clay.sweep(ctx.nombre(f'pico corona triton {k}'), pts, [0.045, 0.03, 0.012], (1, 0.6), ctx.coll, m, segments=6, samples=4,
                             caps=('round', 'point')), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'perla triton {k}'), tuple(pts[-1] + np.array([0, 0, 0.02])), (0.025, 0.025, 0.025), ctx.coll, per, n=3), 'cabeza')
    concha(ctx, 'concha corona triton', c + np.array([0, -r * 0.66, 0.06]), (0, -1, 0.3), 0.08, ctx.m('concha', tipo='brillo'), ctx.m('costillas', tipo='brillo'),
           'cabeza', costillas=6)


@prenda('chaleco_escamas', 'arriba', [V('chaleco_escamas', 'Camisa de escamas de tritón', principal='#2E9C95', escamas='#3FB8AF', brillo='#9BE8E0',
                                        cinturon='#F2C75C', concha='#F7B8C8', costillas='#E88AA3')], para=('el',), precio=130)
def chaleco_escamas(ctx):
    from ropa_arriba import base_camiseta
    objs, f = base_camiseta(ctx, largo_manga=0.1, tipo='brillo')
    esc, bri = ctx.m('escamas', tipo='brillo'), ctx.m('brillo', tipo='brillo')
    T = ctx.D['torso']
    k = 0
    for atras in (False, True):
        for fila, t in enumerate(np.linspace(0.85, 0.2, 6)):
            for x in np.linspace(-T['half'][0] * 0.8, T['half'][0] * 0.8, 6 + fila % 2):
                p, n = sobre_torso(ctx, f, x, zc(ctx, t), 0.0, atras)
                if p is not None:
                    objs.append(escama(ctx, f'escama triton {k}', p, n, 0.05, bri if k % 6 == 0 else esc, 'torso'))
                    k += 1
    objs.append(ruedo(ctx, f, T['bottom'] + 0.05, ctx.m('cinturon', tipo='metal'), 'cinturon triton', grosor=0.03, prof=(1, 1.2)))
    p, n = sobre_torso(ctx, f, 0.0, T['bottom'] + 0.05, 0.05)
    if p is not None:
        objs += concha(ctx, 'hebilla concha', p, n, 0.07, ctx.m('concha', tipo='brillo'), ctx.m('costillas', tipo='brillo'), 'torso', costillas=5)
    return objs


@prenda('pantalon_escamas', 'abajo', [V('pantalon_escamas', 'Pantalón de escamas con aletas', principal='#2E9C95', escamas='#3FB8AF', aleta='#9BE8E0')],
        para=('el',), precio=120)
def pantalon_escamas(ctx):
    from ropa_abajo import dims_pantalon, pantalon_sdf
    Pn = dims_pantalon(ctx, 'largo', 0.02)
    D2_ = dict(ctx.D)
    D2_['pants'] = Pn
    objs = []
    m = ctx.m('principal', tipo='brillo')
    cuerpo.pants(ctx.coll, {'pants': m, 'stitch': m}, ctx.N, D2_)
    fp = pantalon_sdf(Pn)
    esc = ctx.m('escamas', tipo='brillo')
    for sx in (-1, 1):
        s = np.array([sx, 1, 1])
        a, b = np.array(Pn['leg_top']) * s, np.array(Pn['leg_bot']) * s
        for j, t in enumerate(np.linspace(0.1, 0.9, 5)):
            c = a + (b - a) * t
            for i, dx in enumerate((-0.07, 0.07)):
                o = clay.blob(ctx.nombre(f'escama pierna triton {ctx.lado(sx)} {j} {i}'), (0, 0, 0), (0.05, 0.045, 0.016), ctx.coll, esc, n=4)
                r = en_superficie(ctx, fp, c[0] + dx + 0.035 * (j % 2), c[2], o, ctx.hueso_lado('pierna', sx), lift=0.01)
                if r is not None:
                    objs.append(r)
        # Aletas en los tobillos
        al = ctx.m('aleta', tipo='brillo')
        for j in (-1, 1):
            o = clay.blob(ctx.nombre(f'aleta tobillo {ctx.lado(sx)} {j}'), (0, 0, 0), (0.1, 0.02, 0.07), ctx.coll, al, n=5,
                          shaper=lambda v: v * np.column_stack([np.ones(len(v)), np.ones(len(v)), 1 - 0.6 * np.clip(v[:, 0] * j / 0.1, 0, 1)]))
            o.location = tuple(np.array([b[0] + sx * j * 0.18 + j * 0.02, b[1], Pn['bottom'] + 0.06]))
            o.rotation_euler = (0, math.radians(-j * 30), 0)
            objs.append(ctx.pieza(o, ctx.hueso_lado('pierna', sx)))
    return objs


@prenda('tridente', 'espalda', [V('tridente', 'Tridente dorado', principal='#F2C75C', mango='#3FB8AF', perla='#FFF8F2')], para=('el',), precio=90)
def tridente(ctx):
    from ropa_accesorios import atras_y, espalda_z
    m, mango, perla = ctx.m('principal', tipo='metal'), ctx.m('mango', tipo='brillo'), ctx.m('perla', tipo='brillo')
    z = espalda_z(ctx, 0.5)
    y = atras_y(ctx, z) + 0.08
    a, b = np.array([0.3, y, z - 0.55]), np.array([-0.3, y + 0.05, z + 0.85])
    ctx.pieza(clay.sweep(ctx.nombre('asta tridente'), [a, b], 0.03, (1, 1), ctx.coll, mango, segments=8, samples=2), 'torso')
    d = unidad(b - a)
    lado = unidad(np.cross(d, (0, 1, 0)))
    base = b
    ctx.pieza(clay.sweep(ctx.nombre('travesano tridente'), [base - lado * 0.14, base + lado * 0.14], 0.03, (1, 1), ctx.coll, m, segments=8, samples=2), 'torso')
    for j in (-1, 0, 1):
        p0 = base + lado * 0.13 * j
        p1 = p0 + d * (0.3 if j == 0 else 0.24) + lado * 0.02 * j
        ctx.pieza(clay.sweep(ctx.nombre(f'punta tridente {j}'), [p0, p1], [0.026, 0.004], (1, 1), ctx.coll, m, segments=6, samples=2, caps=('round', 'point')),
                  'torso')
    ctx.pieza(clay.blob(ctx.nombre('perla tridente'), tuple(base - d * 0.03), (0.045, 0.045, 0.045), ctx.coll, perla, n=4), 'torso')
    for k, t in enumerate((0.25, 0.5)):
        ctx.pieza(clay.blob(ctx.nombre(f'anillo tridente {k}'), tuple(a + (b - a) * t), (0.042, 0.042, 0.03), ctx.coll, m, n=4), 'torso')


# ---------------------------------------------------------------------------
# MORADO · Arepa (Él) y chocolatico (Ella)
# ---------------------------------------------------------------------------

@prenda('traje_arepa', 'arriba', [V('traje_arepa', 'Traje de arepa con queso', principal='#F2D9A0', tostado='#B8844A', parrilla='#6B4424', queso='#FFF3C4',
                                    camiseta='#F7E7BE')], para=('el',), precio=140)
def traje_arepa(ctx):
    from ropa_arriba import base_camiseta
    objs, f = base_camiseta(ctx, largo_manga=0.1, papel='camiseta')
    T = ctx.D['torso']
    masa, tost, par, queso = ctx.m('principal', tipo='peluche'), ctx.m('tostado', tipo='peluche'), ctx.m('parrilla', tipo='lisa'), ctx.m('queso', tipo='brillo')
    cz = zc(ctx, 0.5)
    R = 0.52
    for lado, sy in (('frente', -1), ('espalda', 1)):
        p, n = sobre_torso(ctx, f, 0.0, cz, 0.0, atras=(sy > 0))
        if p is None:
            continue
        c = p + np.array([0, sy * 0.1, 0])
        o = clay.blob(ctx.nombre(f'arepa {lado}'), tuple(c), (R, 0.09, R * 0.9), ctx.coll, masa, n=8)
        objs.append(ctx.pieza(o, 'torso'))
        # Marcas de la parrilla en rombos y pintas tostadas
        for j in range(-2, 3):
            for d_ in (-1, 1):
                a = np.array([-R * 0.7, 0, j * 0.16 - R * 0.35 * d_])
                b_ = np.array([R * 0.7, 0, j * 0.16 + R * 0.35 * d_])
                pts = [c + a * np.array([1, 0, 1]) + np.array([0, sy * 0.085, 0]), c + b_ * np.array([1, 0, 1]) + np.array([0, sy * 0.085, 0])]
                if np.linalg.norm(pts[0][[0, 2]] - c[[0, 2]]) < R * 0.95 and np.linalg.norm(pts[1][[0, 2]] - c[[0, 2]]) < R * 0.95:
                    objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'parrilla {lado} {j} {d_}'), pts, 0.012, (1, 0.5), ctx.coll, par, segments=4, samples=2),
                                          'torso'))
        for j in range(7):
            a = j * 2.4
            q = c + np.array([math.cos(a) * R * 0.6 * (0.4 + 0.1 * j), sy * 0.08, math.sin(a) * R * 0.5 * (0.4 + 0.1 * j)])
            objs.append(ctx.pieza(clay.blob(ctx.nombre(f'tostado {lado} {j}'), tuple(q), (0.045, 0.015, 0.035), ctx.coll, tost, n=4), 'torso'))
    # El queso derretido que se sale por los bordes (entre las dos tapas)
    for j, a in enumerate(np.linspace(-2.6, 2.6, 9)):
        q = np.array([math.sin(a) * (R + 0.02), T['c'][1], cz + math.cos(a) * R * 0.9])
        largo = 0.06 + 0.06 * (j % 3)
        objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'queso derretido {j}'), [q, q + np.array([0, 0, -largo])], [0.05, 0.03], (1, 0.7), ctx.coll, queso,
                                         segments=6, samples=2), 'torso'))
    return objs


@prenda('gorro_mantequilla', 'cabeza', [V('gorro_mantequilla', 'Gorro de mantequilla', principal='#FBE38A', derretida='#F7D05A', sal='#FFFFFF')],
        para=('el',), oculta=COP, precio=70)
def gorro_mantequilla(ctx):
    from ropa_accesorios import tope
    m, der, sal = ctx.m('principal', tipo='brillo'), ctx.m('derretida', tipo='brillo'), ctx.m('sal', tipo='brillo')
    c = tope(ctx) + np.array([0, 0.02, 0.08])
    ctx.pieza(clay.rbox(ctx.nombre('cubo mantequilla'), tuple(c), (0.26, 0.2, 0.13), ctx.coll, m, p=3, n=5, subsurf=1), 'cabeza')
    for j, (dx, dy, largo) in enumerate(((-0.2, -0.16, 0.12), (0.12, -0.2, 0.16), (0.22, 0.1, 0.1), (-0.16, 0.18, 0.14))):
        q = c + np.array([dx, dy, -0.1])
        ctx.pieza(clay.sweep(ctx.nombre(f'gota mantequilla {j}'), [q, q + np.array([dx * 0.3, dy * 0.3, -largo])], [0.05, 0.035], (1, 1), ctx.coll, der,
                             segments=6, samples=2), 'cabeza')
    for j in range(9):
        q = c + np.array([-0.18 + 0.045 * j, -0.1 + 0.025 * (j % 3), 0.135])
        ctx.pieza(clay.rbox(ctx.nombre(f'grano sal {j}'), tuple(q), (0.01, 0.01, 0.008), ctx.coll, sal, p=3, n=2, subsurf=0), 'cabeza')


@prenda('traje_chocolate', 'arriba', [V('traje_chocolate', 'Traje de taza de chocolate', principal='#FFFDF7', borde='#D6203A', flores='#F7C530',
                                        chocolate='#5A3322', espuma='#C99A6E', camiseta='#F7E7BE')], para=('ella',), precio=140)
def traje_chocolate(ctx):
    from ropa_accesorios import lathe
    from ropa_arriba import base_camiseta
    objs, f = base_camiseta(ctx, largo_manga=0.1, papel='camiseta')
    T = ctx.D['torso']
    taza, borde, choc, esp = ctx.m('principal', tipo='brillo'), ctx.m('borde', tipo='brillo'), ctx.m('chocolate', tipo='brillo'), ctx.m('espuma', tipo='peluche')
    z0, z1 = T['bottom'] - 0.04, zc(ctx, 0.9)
    R = T['half'][0] + 0.12
    c = np.array([0, T['c'][1], z0])
    alto = z1 - z0
    perfil = [(R * 0.82, 0.0), (R * 0.95, alto * 0.25), (R, alto * 0.7), (R + 0.01, alto), (R - 0.04, alto), (R - 0.05, alto * 0.7), (R * 0.8, 0.04)]
    o = lathe(ctx, 'taza chocolate', perfil, taza, c, seg=48, tapa_abajo=False, tapa_arriba=False)
    o['hueso'] = 'torso'
    objs.append(o)
    o = lathe(ctx, 'borde taza', [(R + 0.005, alto - 0.03), (R + 0.02, alto - 0.01), (R + 0.005, alto + 0.01)], borde, c, seg=48, tapa_abajo=False,
              tapa_arriba=False)
    o['hueso'] = 'torso'
    objs.append(o)
    # El chocolate con espuma alrededor del cuello
    o = lathe(ctx, 'chocolate taza', [(R - 0.05, alto - 0.05), (R * 0.4, alto - 0.03)], choc, c, seg=40, tapa_abajo=False, tapa_arriba=False)
    o['hueso'] = 'torso'
    objs.append(o)
    for j in range(14):
        a = 2 * math.pi * j / 14
        q = c + np.array([math.cos(a) * (R - 0.12), math.sin(a) * (R - 0.12), alto - 0.02])
        objs.append(ctx.pieza(clay.blob(ctx.nombre(f'burbuja espuma {j}'), tuple(q), (0.05, 0.05, 0.03), ctx.coll, esp, n=4), 'torso'))
    # Oreja (asa) de la taza y florecitas pintadas
    for sx in (1,):
        pts = [c + np.array([sx * (R - 0.01), 0, alto * 0.75]), c + np.array([sx * (R + 0.18), 0, alto * 0.7]), c + np.array([sx * (R + 0.2), 0, alto * 0.35]),
               c + np.array([sx * (R - 0.01), 0, alto * 0.25])]
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('asa taza'), pts, 0.045, (1, 0.7), ctx.coll, taza, segments=8, samples=5), 'torso'))
    for j in range(8):
        a = -math.pi / 2 + (j - 3.5) * 0.36
        q = c + np.array([math.cos(a) * (R + 0.012), math.sin(a) * (R + 0.012), alto * (0.4 + 0.12 * (j % 2))])
        fl = ropa.flor(ctx, f'flor taza {j}', 0.045, ctx.m('flores' if j % 2 else 'borde', tipo='lisa'), ctx.m('flores', tipo='lisa'))
        fl.location = tuple(q)
        orientar(fl, (math.cos(a), math.sin(a), 0))
        fl.rotation_quaternion = fl.rotation_quaternion @ Vector((0, 0, 1)).rotation_difference(Vector((0, -1, 0))).inverted()
        objs.append(ctx.pieza(fl, 'torso'))
    return objs


@prenda('gorro_espuma', 'cabeza', [V('gorro_espuma', 'Gorro de espuma con queso y malvaviscos', principal='#F3E3CE', queso='#FFF3C4', malvavisco='#FBD3E0',
                                     canela='#8A5A3C')], para=('ella',), oculta=COP, precio=70)
def gorro_espuma(ctx):
    m = ctx.m('principal', tipo='peluche')
    c, _ = aro_cabeza(ctx, 64)
    for k, (rr, dz) in enumerate(((0.42, 0.0), (0.33, 0.12), (0.23, 0.22), (0.12, 0.3))):
        ring = [c + np.array([math.cos(a) * rr, math.sin(a) * rr, dz + 0.03 * math.sin(a * 3 + k)]) for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)]
        ctx.pieza(clay.sweep(ctx.nombre(f'espuma remolino {k}'), ring, 0.09 - 0.012 * k, (1, 1), ctx.coll, m, segments=8, samples=2, closed=True), 'cabeza')
    ctx.pieza(clay.blob(ctx.nombre('puntica espuma'), tuple(c + np.array([0, 0, 0.38])), (0.06, 0.06, 0.08), ctx.coll, m, n=5, shaper=lambda v: punta(v, 2, 0.7)),
              'cabeza')
    # El queso (así se toma el chocolate en Colombia), malvaviscos y una rama de canela
    ctx.pieza(clay.rbox(ctx.nombre('queso chocolate'), tuple(c + np.array([0.2, -0.18, 0.18])), (0.08, 0.07, 0.06), ctx.coll, ctx.m('queso', tipo='brillo'), p=4, n=3,
                        subsurf=1), 'cabeza')
    for j, (dx, dy) in enumerate(((-0.22, -0.16), (-0.05, -0.3), (0.28, 0.1))):
        ctx.pieza(clay.rbox(ctx.nombre(f'malvavisco {j}'), tuple(c + np.array([dx, dy, 0.14])), (0.05, 0.05, 0.04), ctx.coll, ctx.m('malvavisco', tipo='peluche'),
                            p=3, n=3, subsurf=1), 'cabeza')
    ctx.pieza(clay.sweep(ctx.nombre('canela'), [c + np.array([-0.1, 0.1, 0.2]), c + np.array([-0.3, 0.2, 0.46])], 0.03, (1, 1), ctx.coll,
                         ctx.m('canela', tipo='lisa'), segments=8, samples=2), 'cabeza')


# ---------------------------------------------------------------------------
# AZUL · Lilo y Stitch (Él con orejas de Stitch y su camiseta; Ella con el vestido rojo de Lilo)
# ---------------------------------------------------------------------------

@prenda('diadema_stitch', 'cabeza', [V('diadema_stitch', 'Diadema de orejas de Stitch', principal='#2451B3', dentro='#EE8DB5', marcas='#132F6E')],
        oculta=COP, precio=60)
def diadema_stitch(ctx):
    from ropa_accesorios import diadema, punto_cabeza
    m, dentro, marcas = ctx.m('principal', tipo='peluche'), ctx.m('dentro', tipo='peluche'), ctx.m('marcas', tipo='peluche')
    diadema(ctx, m, lift=0.03)
    for sx in (-1, 1):
        base, n = punto_cabeza(ctx, sx * 80, 40, 0.04)
        if base is None:
            continue
        fuera = unidad(np.array([sx, 0.1, 0.45]))
        pts = [base, base + fuera * 0.18, base + fuera * 0.4, base + fuera * 0.56]
        ctx.pieza(clay.sweep(ctx.nombre(f'oreja stitch {sx}'), pts, [0.12, 0.2, 0.17, 0.04], (1.0, 0.3), ctx.coll, m, segments=12, samples=6, up=(0, 0, 1),
                             caps=('round', 'point')), 'cabeza')
        ctx.pieza(clay.sweep(ctx.nombre(f'oreja stitch dentro {sx}'), [p + np.array([0, -0.045, 0]) for p in pts[:3]], [0.06, 0.13, 0.11], (1.0, 0.2),
                             ctx.coll, dentro, segments=10, samples=6, up=(0, 0, 1)), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'muesca stitch {sx}'), tuple(pts[2] + np.array([0, 0, 0.15])), (0.04, 0.04, 0.03), ctx.coll, marcas, n=4), 'cabeza')


@prenda('camiseta_stitch', 'arriba', [V('camiseta_stitch', 'Camiseta de Stitch', principal='#5B8FD9', cara='#2451B3', ojos='#10131E', nariz='#132F6E',
                                        dentro='#EE8DB5', blanco='#FFFFFF')], precio=80)
def camiseta_stitch(ctx):
    from ropa_arriba import base_camiseta, estampar
    objs, f = base_camiseta(ctx)
    cara, ojos, nariz, dentro = ctx.m('cara', tipo='lisa'), ctx.m('ojos', tipo='brillo'), ctx.m('nariz', tipo='brillo'), ctx.m('dentro', tipo='lisa')
    z = zc(ctx, 0.55)
    # La carita de Stitch estampada: cabeza, orejotas, ojos, nariz y boca feliz
    for nombre_, x, dz, tam, mat in (('cara stitch', 0.0, 0.0, (0.17, 0.012, 0.13), cara), ('ojo stitch i', -0.07, 0.03, (0.05, 0.01, 0.045), ojos),
                                     ('ojo stitch d', 0.07, 0.03, (0.05, 0.01, 0.045), ojos), ('nariz stitch', 0.0, -0.02, (0.045, 0.01, 0.03), nariz)):
        o = clay.blob(ctx.nombre(nombre_), (0, 0, 0), tam, ctx.coll, mat, n=5)
        r = estampar(ctx, f, o, x, z + dz, lift=0.006 + (0.006 if mat is not cara else 0))
        if r is not None:
            objs.append(r)
    for sx in (-1, 1):
        o = clay.blob(ctx.nombre(f'oreja estampada {sx}'), (0, 0, 0), (0.13, 0.01, 0.06), ctx.coll, cara, n=5, shaper=lambda v: punta(v, 0, 0.6) if sx > 0 else v)
        r = estampar(ctx, f, o, sx * 0.2, z + 0.06, lift=0.006)
        if r is not None:
            objs.append(r)
        o = clay.blob(ctx.nombre(f'oreja estampada dentro {sx}'), (0, 0, 0), (0.07, 0.008, 0.03), ctx.coll, dentro, n=4)
        r = estampar(ctx, f, o, sx * 0.19, z + 0.06, lift=0.012)
        if r is not None:
            objs.append(r)
        o = clay.blob(ctx.nombre(f'brillo ojo estampado {sx}'), (0, 0, 0), (0.014, 0.006, 0.014), ctx.coll, ctx.m('blanco', tipo='brillo'), n=3)
        r = estampar(ctx, f, o, sx * 0.07 - 0.015, z + 0.05, lift=0.02)
        if r is not None:
            objs.append(r)
    pts = linea_torso(ctx, f, [(x, z - 0.07 - 0.02 * math.cos(x * 9)) for x in np.linspace(-0.07, 0.07, 5)], 0.012)
    if len(pts) > 2:
        objs.append(costura(ctx, 'sonrisa stitch', pts, ojos, 'torso', r=0.008))
    return objs


@prenda('vestido_lilo', 'conjunto', [V('vestido_lilo', 'Vestido de Lilo con collar de flores', principal='#B81428', hojas='#FFFFFF', cinta='#D6203A',
                                       flor1='#F7C530', flor2='#F2A5B8', flor3='#FFFFFF', centro='#F58A3C')], para=('ella',), precio=140)
def vestido_lilo(ctx):
    from ropa_abajo import base_vestido
    objs, f, ff = base_vestido(ctx, hem=0.22, r1=0.6, mangas_si=None, pliegues=8)
    hojas = ctx.m('hojas', tipo='lisa')
    # Hojas blancas estampadas (como el vestido de Lilo)
    k = 0
    for z in (0.3, 0.42, 0.52):
        ring = sdf.ring_points(ff, (0, 0.03, z), (0, 0, 1), 1.2, 7 + (k % 2), lift=0.008)
        for j, p in enumerate(ring):
            n = sdf.normal(ff, np.array([p]))[0]
            o = clay.blob(ctx.nombre(f'hoja lilo {k}'), (0, 0, 0), (0.055, 0.11, 0.014), ctx.coll, hojas, n=4, shaper=lambda v: punta(v, 1, 0.6))
            o.location = tuple(np.array(p) + n * 0.01)
            orientar(o, n)
            o.rotation_mode = 'QUATERNION'
            o.rotation_quaternion = o.rotation_quaternion @ Vector((0, 0, 1)).rotation_difference(Vector((0, 0, 1)))
            objs.append(ctx.pieza(o, 'pelvis'))
            k += 1
    for j, t in enumerate((0.3, 0.6, 0.85)):
        for x in (-0.15, 0.15):
            o = clay.blob(ctx.nombre(f'hoja lilo pecho {j} {x}'), (0, 0, 0), (0.045, 0.014, 0.09), ctx.coll, hojas, n=4, shaper=lambda v: punta(v, 2, 0.6))
            r = en_superficie(ctx, f, x + 0.05 * (j % 2), zc(ctx, t), o, lift=0.008)
            if r is not None:
                objs.append(r)
    # Collar de flores (lei) de tres colores
    nc, _ = ctx.D['neck_hole']
    ring = sdf.ring_points(f, (0, nc[1], nc[2] - 0.08), (0, 0, 1), 0.7, 14, lift=0.06)
    cols = ['flor1', 'flor2', 'flor3']
    for j, p in enumerate(ring):
        fl = ropa.flor(ctx, f'flor lei {j}', 0.075, ctx.m(cols[j % 3], tipo='lisa'), ctx.m('centro', tipo='lisa'))
        n = sdf.normal(f, np.array([p]))[0]
        fl.location = tuple(p)
        orientar(fl, n)
        fl.rotation_quaternion = fl.rotation_quaternion @ Vector((0, 0, 1)).rotation_difference(Vector((0, -1, 0))).inverted()
        objs.append(ctx.pieza(fl, 'torso'))
    return objs


# ---------------------------------------------------------------------------
# AZUL · Ranitas, vaquitas y pollitos
# ---------------------------------------------------------------------------

@prenda('enterizo_rana', 'conjunto', [V('enterizo_rana', 'Enterizo de ranita', principal='#45A832', panza='#F2EDA8', pintas='#3E8C3A', costura='#9BD67E')],
        precio=110)
def enterizo_rana(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    objs += panza(ctx, f, 0.4, 0.24, 0.3, ctx.m('panza', tipo='peluche'), borde=ctx.m('costura', tipo='lisa'))
    pintas = ctx.m('pintas', tipo='peluche')
    for k, (x, t, r_, atras) in enumerate(((0.0, 0.6, 0.09, True), (-0.18, 0.35, 0.06, True), (0.16, 0.25, 0.07, True), (0.2, 0.75, 0.05, True),
                                           (-0.3, 0.7, 0.045, False), (0.3, 0.2, 0.05, False))):
        o = clay.blob(ctx.nombre(f'pinta rana {k}'), (0, 0, 0), (r_, 0.016, r_ * 0.85), ctx.coll, pintas, n=5)
        rr = en_superficie(ctx, f, x, zc(ctx, t), o, lift=0.01, atras=atras)
        if rr is not None:
            objs.append(rr)
    objs += mitones(ctx, ctx.m('principal', tipo='peluche'), dedos=4, nombre='manito rana')
    return objs


@prenda('capucha_rana', 'cabeza', [V('capucha_rana', 'Capucha de ranita', principal='#45A832', ojos_blanco='#FFFFFF', boca='#2E5E22', cachetes='#F4A6B8')],
        oculta=COP, precio=70)
def capucha_rana(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    blanco, negro = ctx.m('ojos_blanco', tipo='brillo'), ctx.m('pupila', tipo='brillo', color='#16110F')
    for sx in (-1, 1):
        loc, n = sobre_capucha(ctx, cap, sx * 30, 74, 0.0)
        # Ojo saltón: bulto verde (párpado) con el ojo blanco encima y la pupila
        ctx.pieza(clay.blob(ctx.nombre(f'bulto ojo rana {sx}'), tuple(loc + n * 0.12), (0.22, 0.2, 0.2), ctx.coll, m, n=6), 'cabeza')
        o = clay.blob(ctx.nombre(f'ojo rana {sx}'), tuple(loc + n * 0.2 + np.array([0, -0.1, 0.0])), (0.16, 0.1, 0.16), ctx.coll, blanco, n=5)
        ctx.pieza(o, 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'pupila rana {sx}'), tuple(loc + n * 0.2 + np.array([0, -0.2, 0.0])), (0.08, 0.025, 0.09), ctx.coll, negro, n=4), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'destello rana {sx}'), tuple(loc + n * 0.2 + np.array([-0.03, -0.225, 0.04])), (0.02, 0.01, 0.02), ctx.coll,
                            ctx.m('destellos', tipo='brillo', color='#FFFFFF'), n=3), 'cabeza')
    # Sonrisa ancha y cachetes
    pts = [sobre_capucha(ctx, cap, a, 40 + 6 * math.cos(math.radians(a) * 2.2), 0.0)[0] + np.array([0, -0.03, 0]) for a in np.linspace(-40, 40, 7)]
    ctx.pieza(clay.sweep(ctx.nombre('sonrisa rana'), pts, 0.015, (1, 1), ctx.coll, ctx.m('boca', tipo='lisa'), segments=5, samples=3), 'cabeza')
    mejillas(ctx, cap, ctx.m('cachetes', tipo='peluche'), az=52, el=44)


@prenda('pantuflas_rana', 'pies', [V('pantuflas_rana', 'Patas de ranita', principal='#45A832', puntas='#3E8C3A', suela='#3E8C3A')], precio=50)
def pantuflas_rana(ctx):
    m, pu = ctx.m('principal', tipo='peluche'), ctx.m('puntas', tipo='peluche')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        hueso = ctx.hueso_lado('pie', sx)
        for j in (-1, 0, 1):
            a = np.array([x + j * 0.05 * k, -0.25 * k, 0.06 * k])
            b = a + np.array([j * 0.07 * k, -0.2 * k, -0.02])
            ctx.pieza(clay.sweep(ctx.nombre(f'dedo rana {ctx.lado(sx)} {j}'), [a, b], [0.035 * k, 0.03 * k], (1, 0.6), ctx.coll, m, segments=6, samples=2), hueso)
            ctx.pieza(clay.blob(ctx.nombre(f'ventosa rana {ctx.lado(sx)} {j}'), tuple(b), (0.035 * k, 0.035 * k, 0.022 * k), ctx.coll, pu, n=4), hueso)


@prenda('enterizo_vaca', 'conjunto', [V('enterizo_vaca', 'Enterizo de vaquita', principal='#FAF7F0', manchas='#26211F', panza='#F7C6D2', campana='#F2C75C',
                                        collar='#C8283A')], precio=110)
def enterizo_vaca(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    manchas = ctx.m('manchas', tipo='peluche')
    for k, (x, t, rx, rz, atras) in enumerate(((0.12, 0.7, 0.16, 0.12, True), (-0.16, 0.35, 0.13, 0.15, True), (0.2, 0.2, 0.09, 0.08, True),
                                               (-0.25, 0.72, 0.1, 0.08, False), (0.28, 0.3, 0.08, 0.1, False))):
        o = clay.blob(ctx.nombre(f'mancha vaca {k}'), (0, 0, 0), (rx, 0.016, rz), ctx.coll, manchas, n=6, p=1.8,
                      shaper=lambda v, k=k: v * (1 + 0.18 * np.sin(np.arctan2(v[:, 2:3], v[:, 0:1]) * (3 + k % 2))))
        rr = en_superficie(ctx, f, x, zc(ctx, t), o, lift=0.01, atras=atras)
        if rr is not None:
            objs.append(rr)
    objs += panza(ctx, f, 0.25, 0.14, 0.12, ctx.m('panza', tipo='peluche'))
    objs += pierna_color(ctx, Pn, manchas, desde=0.75, holgura=0.022, nombre='pezuna vaca')
    # Collar con campanita
    nc, _ = ctx.D['neck_hole']
    ring = sdf.ring_points(f, (0, nc[1], nc[2] - 0.05), (0, 0, 1), 0.6, 26, lift=0.03)
    if len(ring) > 10:
        objs.append(ctx.pieza(clay.sweep(ctx.nombre('collar vaca'), ring, 0.03, (0.6, 1.0), ctx.coll, ctx.m('collar', tipo='lisa'), segments=8, samples=3,
                                         closed=True), 'torso'))
    p, n = sobre_torso(ctx, f, 0.0, nc[2] - 0.14, 0.07)
    if p is not None:
        from ropa_accesorios import lathe
        o = lathe(ctx, 'campana vaca', [(0.0, 0.07), (0.035, 0.065), (0.05, 0.02), (0.065, -0.02), (0.0, -0.02)], ctx.m('campana', tipo='metal'), p)
        o['hueso'] = 'torso'
        objs.append(o)
    return objs


@prenda('capucha_vaca', 'cabeza', [V('capucha_vaca', 'Capucha de vaquita', principal='#FAF7F0', manchas='#26211F', cachos='#F4E3C0', hocico='#F7C6D2',
                                     orejas='#FAF7F0', dentro='#F7C6D2')], oculta=COP, precio=70)
def capucha_vaca(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    manchas, cachos = ctx.m('manchas', tipo='peluche'), ctx.m('cachos', tipo='brillo')
    for sx in (-1, 1):
        base, n = sobre_capucha(ctx, cap, sx * 34, 76, 0.03)
        ctx.pieza(clay.sweep(ctx.nombre(f'cacho vaca {sx}'), [base, base + np.array([sx * 0.08, 0, 0.1]), base + np.array([sx * 0.16, 0.02, 0.14])],
                             [0.05, 0.035, 0.012], (1, 1), ctx.coll, cachos, segments=8, samples=4, caps=('round', 'point')), 'cabeza')
        o_loc, o_n = sobre_capucha(ctx, cap, sx * 70, 56, 0.03)
        o = clay.blob(ctx.nombre(f'oreja vaca {sx}'), (0, 0, 0), (0.17, 0.05, 0.08), ctx.coll, ctx.m('orejas', tipo='peluche'), n=5)
        o.location = tuple(o_loc + np.array([sx * 0.14, 0, 0]))
        o.rotation_euler = (0, math.radians(-sx * 15), 0)
        ctx.pieza(o, 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'oreja vaca dentro {sx}'), tuple(o_loc + np.array([sx * 0.15, -0.035, 0])), (0.11, 0.02, 0.045), ctx.coll,
                            ctx.m('dentro', tipo='peluche'), n=4), 'cabeza')
    loc, n = sobre_capucha(ctx, cap, 30, 66, 0.0)
    o = clay.blob(ctx.nombre('mancha capucha vaca'), (0, 0, 0), (0.2, 0.17, 0.03), ctx.coll, manchas, n=5)
    o.location = tuple(loc + n * 0.012)
    orientar(o, n)
    ctx.pieza(o, 'cabeza')
    ojitos(ctx, cap, az=26, el=58, tam=0.075, pestanas=not ctx.el)
    punta_loc, pn = hocico(ctx, cap, ctx.m('hocico', tipo='peluche'), manchas, el=42, tam=(0.22, 0.14, 0.09), nariz_tam=(0.02, 0.015, 0.02))
    for sx in (-1, 1):
        ctx.pieza(clay.blob(ctx.nombre(f'fosa vaca {sx}'), tuple(punta_loc + pn * 0.14 + np.array([sx * 0.07, 0, 0.02])), (0.025, 0.012, 0.03), ctx.coll,
                            manchas, n=4), 'cabeza')


@prenda('cola_vaca', 'cola', [V('cola_vaca', 'Colita de vaquita', principal='#FAF7F0', borla='#26211F')], precio=25)
def cola_vaca(ctx):
    b = base_cola(ctx)
    pts = [b, b + np.array([0.02, 0.1, -0.1]), b + np.array([0.04, 0.14, -0.28])]
    ctx.pieza(clay.sweep(ctx.nombre('cola vaca'), pts, 0.022, (1, 1), ctx.coll, ctx.m('principal', tipo='peluche'), segments=6, samples=4), 'pelvis')
    ctx.pieza(clay.blob(ctx.nombre('borla vaca'), tuple(pts[-1] + np.array([0, 0, -0.05])), (0.05, 0.05, 0.08), ctx.coll, ctx.m('borla', tipo='peluche'), n=5,
                        shaper=lambda v: punta(v * np.array([1, 1, -1]), 2, 0.5) * np.array([1, 1, -1])), 'pelvis')


@prenda('enterizo_pollito', 'conjunto', [V('enterizo_pollito', 'Enterizo de pollito', principal='#F5C21B', plumas='#FAD85A', alas='#EAB10E')], precio=110)
def enterizo_pollito(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    plumas, alas = ctx.m('plumas', tipo='peluche'), ctx.m('alas', tipo='peluche')
    # Plumitas del pecho en capas
    k = 0
    for fila, t in enumerate((0.8, 0.68, 0.56)):
        for x in np.linspace(-0.12 + 0.03 * fila, 0.12 - 0.03 * fila, 4 - fila):
            p, n = sobre_torso(ctx, f, x, zc(ctx, t), 0.0)
            if p is not None:
                objs.append(mechon(ctx, f'plumita pecho {k}', p, n + np.array([0, 0, -0.9]), 0.08, 0.035, plumas, 'torso'))
                k += 1
    # Alitas en los brazos y colita de plumas
    for sx in (-1, 1):
        c, d, r = mano(ctx, sx)
        j = np.array(ctx.D['joint']) * np.array([sx, 1, 1])
        m_ = (j + c) / 2 + np.array([sx * 0.06, 0.04, 0])
        o = clay.blob(ctx.nombre(f'alita pollito {sx}'), tuple(m_), (0.07, 0.12, 0.2), ctx.coll, alas, n=5, shaper=lambda v: punta(v * np.array([1, 1, -1]), 2, 0.5) * np.array([1, 1, -1]))
        objs.append(ctx.pieza(o, ctx.hueso_lado('brazo', sx)))
    for k2, inc in enumerate((-0.4, 0.0, 0.4)):
        p, n = sobre_torso(ctx, f, inc * 0.12, zc(ctx, 0.12), 0.0, atras=True)
        if p is not None:
            objs.append(mechon(ctx, f'colita pollito {k2}', p, n + np.array([inc, 0, 0.6]), 0.1, 0.04, alas, 'torso'))
    return objs


@prenda('capucha_cascaron', 'cabeza', [V('capucha_cascaron', 'Capucha de pollito con cascarón', principal='#F5C21B', pico='#F58A3C', cascaron='#FFFDF6',
                                         cachetes='#F4A6B8')], oculta=COP, precio=70)
def capucha_cascaron(ctx):
    from ropa_accesorios import lathe
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    ojitos(ctx, cap, az=26, el=56, tam=0.075, pestanas=not ctx.el)
    loc, n = sobre_capucha(ctx, cap, 0, 46, 0.0)
    pico = ctx.m('pico', tipo='brillo')
    for j, dz in ((0, 0.02), (1, -0.03)):
        o = clay.blob(ctx.nombre(f'pico pollito {j}'), (0, 0, 0), (0.12, 0.07, 0.15 - 0.03 * j), ctx.coll, pico, n=5, shaper=lambda v: punta(v, 2, 0.8))
        o.location = tuple(loc + n * 0.09 + np.array([0, 0, dz * 1.5]))
        orientar(o, n + np.array([0, 0, -0.3 * j]))
        ctx.pieza(o, 'cabeza')
    mejillas(ctx, cap, ctx.m('cachetes', tipo='peluche'), az=50, el=44)
    # Medio cascarón en la coronilla con el borde en zigzag
    top, nt = sobre_capucha(ctx, cap, 0, 90, 0.0)
    c = top - np.array([0, 0, 0.03])
    cas = ctx.m('cascaron', tipo='brillo')
    o = lathe(ctx, 'cascaron', [(0.0, 0.34), (0.2, 0.3), (0.33, 0.2), (0.4, 0.08), (0.42, 0.0), (0.39, 0.0), (0.31, 0.18), (0.0, 0.3)], cas, c, seg=40,
              tapa_abajo=False, tapa_arriba=False)
    for i in range(12):
        a = 2 * math.pi * i / 12
        q = c + np.array([math.cos(a) * 0.41, math.sin(a) * 0.41, 0.0])
        d = clay.blob(ctx.nombre(f'pico cascaron {i}'), (0, 0, 0), (0.05, 0.02, 0.07), ctx.coll, cas, n=3, shaper=lambda v: punta(v * np.array([1, 1, -1]), 2, 0.8) * np.array([1, 1, -1]))
        d.location = tuple(q + np.array([0, 0, -0.03]))
        d.rotation_euler = (0, 0, a + math.pi / 2)
        ctx.pieza(d, 'cabeza')
    # Tres plumitas asomándose del cascarón
    for j, inc in enumerate((-0.5, 0.0, 0.5)):
        ctx.pieza(mechon(ctx, f'plumita cabeza {j}', top + np.array([inc * 0.08, 0, 0.18]), (inc, 0, 1), 0.1, 0.03, m, 'cabeza'), 'cabeza')


@prenda('pantuflas_pollito', 'pies', [V('pantuflas_pollito', 'Patitas de pollito', principal='#F58A3C', suela='#E26F1E')], precio=50)
def pantuflas_pollito(ctx):
    m = ctx.m('principal', tipo='brillo')
    for sx, x, k in lados(ctx):
        pantufla(ctx, sx, x, k, m)
        hueso = ctx.hueso_lado('pie', sx)
        for j in (-1, 0, 1):
            a = np.array([x, -0.2 * k, 0.05 * k])
            b = a + np.array([j * 0.12 * k, -0.2 * k, -0.02])
            ctx.pieza(clay.sweep(ctx.nombre(f'dedo pollito {ctx.lado(sx)} {j}'), [a, b], [0.04 * k, 0.025 * k], (1, 0.7), ctx.coll, m, segments=6, samples=2,
                                 caps=('round', 'point')), hueso)


# ---------------------------------------------------------------------------
# VERDE · Tigres, ovejitas y leoncitos
# ---------------------------------------------------------------------------

@prenda('enterizo_tigre', 'conjunto', [V('enterizo_tigre', 'Enterizo de tigre', principal='#E8701A', rayas='#2A1E18', panza='#FFF3E0')], precio=90)
def enterizo_tigre(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    objs += panza(ctx, f, 0.42, 0.18, 0.26, ctx.m('panza', tipo='peluche'))
    rayas = ctx.m('rayas', tipo='peluche')
    T = ctx.D['torso']
    hx = T['half'][0]
    for k, t in enumerate(np.linspace(0.18, 0.82, 5)):
        for sx in (-1, 1):
            pts = linea_torso(ctx, f, [(sx * hx * (0.95 - 0.35 * u), zc(ctx, t) + 0.05 * u) for u in np.linspace(0, 1, 4)], 0.012, atras=True)
            if len(pts) > 2:
                objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'raya tigre {k} {sx}'), pts, [0.03, 0.025, 0.015, 0.004], (0.4, 1.0), ctx.coll, rayas, segments=5,
                                                 samples=3, up_fn=lambda q: sdf.normal(f, np.array([q]))[0]), 'torso'))
    return objs


@prenda('capucha_tigre', 'cabeza', [V('capucha_tigre', 'Capucha de tigre', principal='#E8701A', rayas='#2A1E18', dentro='#FFF3E0', nariz='#E86A8A')],
        oculta=COP, precio=60)
def capucha_tigre(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    for sx in (-1, 1):
        oreja_capucha(ctx, cap, sx, 'redonda', m, ctx.m('dentro', tipo='peluche'), az=48, el=64, tam=0.9)
    rayas = ctx.m('rayas', tipo='peluche')
    for k, (az, el) in enumerate(((0, 72), (-14, 68), (14, 68), (-70, 50), (70, 50), (-75, 30), (75, 30))):
        p, n = sobre_capucha(ctx, cap, az, el, 0.0)
        o = clay.blob(ctx.nombre(f'raya capucha {k}'), (0, 0, 0), (0.025, 0.1, 0.02), ctx.coll, rayas, n=4, shaper=lambda v: punta(v, 1, 0.6))
        o.location = tuple(p + n * 0.012)
        orientar(o, n)
        ctx.pieza(o, 'cabeza')
    ojitos(ctx, cap, az=26, el=57, tam=0.07)
    hocico(ctx, cap, ctx.m('dentro', tipo='peluche'), ctx.m('nariz', tipo='brillo'), el=43, tam=(0.15, 0.1, 0.07), nariz_tam=(0.04, 0.03, 0.03))


@prenda('cola_tigre', 'cola', [V('cola_tigre', 'Cola de tigre', principal='#E8701A', rayas='#2A1E18')], precio=30)
def cola_tigre(ctx):
    b = base_cola(ctx)
    pts = [b, b + np.array([0.04, 0.22, -0.08]), b + np.array([0.12, 0.38, 0.06]), b + np.array([0.1, 0.42, 0.26])]
    ctx.pieza(clay.sweep(ctx.nombre('cola tigre'), pts, [0.05, 0.05, 0.045, 0.04], (1, 1), ctx.coll, ctx.m('principal', tipo='peluche'), segments=8, samples=6),
              'pelvis')
    ps, _ = clay.catmull_rom(pts, 6)
    for j, i in enumerate(range(3, len(ps), 4)):
        ctx.pieza(clay.blob(ctx.nombre(f'anillo cola tigre {j}'), tuple(ps[i]), (0.052, 0.052, 0.02), ctx.coll, ctx.m('rayas', tipo='peluche'), n=4), 'pelvis')


@prenda('enterizo_oveja', 'conjunto', [V('enterizo_oveja', 'Enterizo de ovejita', principal='#FBF6EC', lana='#FFFFFF')], precio=90)
def enterizo_oveja(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    lana = ctx.m('lana', tipo='peluche')
    k = 0
    for atras in (False, True):
        for t in np.linspace(0.15, 0.85, 4):
            for x in np.linspace(-0.3, 0.3, 4):
                p, n = sobre_torso(ctx, f, x + 0.04 * (k % 2), zc(ctx, t), 0.0, atras)
                if p is not None:
                    objs.append(ctx.pieza(clay.blob(ctx.nombre(f'lana {k}'), tuple(p + n * 0.02), (0.075, 0.075, 0.065), ctx.coll, lana, n=4), 'torso'))
                    k += 1
    return objs


@prenda('capucha_oveja', 'cabeza', [V('capucha_oveja', 'Capucha de ovejita', principal='#FBF6EC', lana='#FFFFFF', orejas='#4A3B36', dentro='#F4A6B8')],
        oculta=COP, precio=60)
def capucha_oveja(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    lana = ctx.m('lana', tipo='peluche')
    for k, (az, el) in enumerate([(a, e) for e in (86, 72, 58) for a in np.linspace(-150, 150, 8 if e < 80 else 3)]):
        p, n = sobre_capucha(ctx, cap, az, el, 0.0)
        ctx.pieza(clay.blob(ctx.nombre(f'lana capucha {k}'), tuple(p + n * 0.04), (0.11, 0.11, 0.09), ctx.coll, lana, n=4), 'cabeza')
    for sx in (-1, 1):
        o_loc, o_n = sobre_capucha(ctx, cap, sx * 75, 45, 0.03)
        o = clay.blob(ctx.nombre(f'oreja oveja {sx}'), (0, 0, 0), (0.15, 0.045, 0.07), ctx.coll, ctx.m('orejas', tipo='peluche'), n=5)
        o.location = tuple(o_loc + np.array([sx * 0.12, 0, -0.02]))
        o.rotation_euler = (0, math.radians(sx * 20), 0)
        ctx.pieza(o, 'cabeza')
    ojitos(ctx, cap, az=24, el=54, tam=0.065)


@prenda('enterizo_leon', 'conjunto', [V('enterizo_leon', 'Enterizo de leoncito', principal='#E39A2A', panza='#FFF1D0')], precio=90)
def enterizo_leon(ctx):
    objs, f, fp, Pn = base_enterizo(ctx, tipo='peluche', holgura=0.06)
    objs += panza(ctx, f, 0.42, 0.2, 0.27, ctx.m('panza', tipo='peluche'))
    objs += mitones(ctx, ctx.m('principal', tipo='peluche'), nombre='zarpa leon')
    return objs


@prenda('capucha_leon', 'cabeza', [V('capucha_leon', 'Capucha de leoncito con melena', principal='#E39A2A', melena='#A8521E', dentro='#FFF1D0', nariz='#6B3A22')],
        oculta=COP, precio=70)
def capucha_leon(ctx):
    m = ctx.m('principal', tipo='peluche')
    cap = capucha(ctx, m)
    mel = ctx.m('melena', tipo='peluche')
    # Melena: mechones gruesos alrededor de la cara (por el borde de la capucha) y por la nuca
    R, E, azs = cap
    for k, az in enumerate(np.linspace(-170, 170, 18)):
        i = int(np.argmin(np.abs((azs - az + 180) % 360 - 180)))
        el = E[0, i] + 10
        p, n = sobre_capucha(ctx, cap, az, el, 0.0)
        o = clay.blob(ctx.nombre(f'melena {k}'), (0, 0, 0), (0.1, 0.08, 0.15), ctx.coll, mel, n=5, shaper=lambda v: punta(v, 2, 0.4))
        o.location = tuple(p + n * 0.09)
        orientar(o, n + np.array([0, 0, -0.3]))
        ctx.pieza(o, 'cabeza')
    for sx in (-1, 1):
        oreja_capucha(ctx, cap, sx, 'redonda', m, ctx.m('dentro', tipo='peluche'), az=46, el=70, tam=0.85)
    ojitos(ctx, cap, az=26, el=58, tam=0.07)
    hocico(ctx, cap, ctx.m('dentro', tipo='peluche'), ctx.m('nariz', tipo='brillo'), el=44, tam=(0.15, 0.1, 0.07), nariz_tam=(0.045, 0.03, 0.03))


@prenda('cola_leon', 'cola', [V('cola_leon', 'Cola de leoncito', principal='#E39A2A', borla='#B8642A')], precio=25)
def cola_leon(ctx):
    b = base_cola(ctx)
    pts = [b, b + np.array([0.03, 0.18, -0.1]), b + np.array([0.08, 0.3, 0.04]), b + np.array([0.06, 0.32, 0.2])]
    ctx.pieza(clay.sweep(ctx.nombre('cola leon'), pts, 0.028, (1, 1), ctx.coll, ctx.m('principal', tipo='peluche'), segments=6, samples=5), 'pelvis')
    ctx.pieza(clay.blob(ctx.nombre('borla leon'), tuple(pts[-1] + np.array([0, 0, 0.05])), (0.07, 0.07, 0.09), ctx.coll, ctx.m('borla', tipo='peluche'), n=5),
              'pelvis')
