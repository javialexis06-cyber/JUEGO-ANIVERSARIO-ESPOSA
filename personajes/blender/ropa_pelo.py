"""Peinados de Él y Ella. Todos en negro de fábrica: el tinte del clóset les cambia el color en el juego."""
import math

import numpy as np

import clay
import personaje
from clay import sph
from ropa import prenda

NEGRO = '#0A0909'
LINEA = {
    'el': ([0, 25, 45, 62, 80, 100, 130, 180], [36, 36, 30, 20, 12, -2, -24, -38]),
    'ella': ([0, 12, 30, 50, 70, 90, 120, 180], [54, 50, 40, 26, 12, 0, -24, -48]),
}


def V1(ident, nombre):
    return [(ident, nombre, {'principal': NEGRO})]


def mat(ctx):
    return ctx.m('principal', tipo='pelo')


def casco(ctx, grosor=0.05, linea=None, raya=False, n=20, nombre='cabello casco', subir=0.0):
    """Casquete de pelo pegado a la cabeza hasta la línea del cabello (como el de fábrica), con el grosor dado
    (número o función(el, az))."""
    P = ctx.P
    hc = ctx.hc
    v, f = clay.quad_sphere(n)
    v = clay.superellipsoid_dirs(v, P['head_p'])
    v = v * np.array(P['head_radii'])
    v = personaje.head_shaper(P)(v)
    u = v / np.linalg.norm(v, axis=1)[:, None]
    az = np.degrees(np.arctan2(u[:, 0], -u[:, 1]))
    el = np.degrees(np.arcsin(np.clip(u[:, 2], -1, 1)))
    a = np.abs(az)
    xs, ys = linea or LINEA[ctx.rol]
    hl = np.interp(a, xs, ys) + subir
    s = clay.smoothstep(hl - 5, hl + 5, el)
    g = grosor(el, a) if callable(grosor) else grosor * np.ones(len(v))
    if raya:
        g = g * (1 - 0.75 * np.exp(-(v[:, 0] / 0.05) ** 2) * clay.smoothstep(30, 55, el))
    scale = 1 + (g * s - 0.02 * (1 - s)) / np.linalg.norm(v, axis=1)
    v = v * scale[:, None] + hc
    o = clay.make_mesh_object(ctx.nombre(nombre), v, f, ctx.coll, material=mat(ctx))
    clay.add_subsurf(o, 1, 2)
    return ctx.pieza(o, 'cabeza')


def sup(ctx, extra=()):
    return clay.Surface([ctx.base['cabeza']] + list(extra))


def hp(surf, ctx, az, el, lift=0.0):
    loc, nrm = surf.radial(ctx.hc, sph(az, el), lift)
    if loc is None:
        return ctx.hc + np.array(sph(az, el)) * 0.7
    return loc


def mechon(ctx, nombre, pts, radios, L=0.6, largo=False, corte=1.25, up_fn=None, segments=14, samples=7):
    hc = ctx.hc
    o = clay.sweep(ctx.nombre(f'mechon {nombre}'), pts, radios, (L, 1.0), ctx.coll, mat(ctx), segments=segments, samples=samples,
                   caps=('round', 'round'), up_fn=up_fn or (lambda p: np.array(p) - hc), flat_bottom=0.6)
    if largo and not ctx.el:
        o['modo'] = 'pelo_largo'
        o['corte'] = corte
    else:
        o['hueso'] = 'cabeza'
    return o


def rizo(ctx, nombre, c, r, eje=(0, 0, 1)):
    """Rizo: bolita con una espiral encima."""
    b = clay.blob(ctx.nombre(f'rizo {nombre}'), tuple(c), (r, r, r * 0.9), ctx.coll, mat(ctx), n=6)
    b['hueso'] = 'cabeza'
    return b


def largos(ctx, surf, sx, locks, L=0.42, corte=1.25):
    """Mechones largos (formato de ella.py: ('h', az, el, lift) sobre la cabeza o ('w', x, y, z) en el mundo)."""
    hc = ctx.hc
    out = []
    for name, path, radii in locks:
        pts = []
        for p in path:
            if p[0] == 'h':
                pts.append(hp(surf, ctx, sx * p[1], p[2], p[3]))
            else:
                pts.append(np.array([sx * p[1], p[2], p[3]]))

        def up_fn(q, sx=sx):
            q = np.array(q)
            if q[2] > hc[2] - 0.35:
                return q - hc
            return np.array([q[0], q[1] - 0.2, 0.0])
        out.append(mechon(ctx, f'{name} {ctx.lado(sx)}', pts, radii, L=L, largo=True, corte=corte, up_fn=up_fn, segments=16, samples=7))
    return out


LARGO_ELLA = [
    ('marco', [('h', 2, 56, 0.0), ('h', 24, 50, 0.04), ('h', 48, 37, 0.06), ('h', 72, 22, 0.07), ('h', 100, 8, 0.07),
               ('w', 0.72, 0.3, 1.12), ('w', 0.76, 0.3, 0.82), ('w', 0.72, 0.28, 0.6)], [0.13, 0.19, 0.21, 0.2, 0.19, 0.19, 0.18, 0.1]),
    ('lado 1', [('h', 3, 66, 0.0), ('h', 35, 58, 0.05), ('h', 70, 40, 0.07), ('h', 110, 14, 0.08),
                ('w', 0.72, 0.42, 1.06), ('w', 0.76, 0.42, 0.78), ('w', 0.7, 0.4, 0.55)], [0.14, 0.2, 0.21, 0.21, 0.2, 0.19, 0.1]),
    ('lado 2', [('h', 5, 78, 0.0), ('h', 60, 62, 0.05), ('h', 104, 34, 0.07), ('h', 124, 4, 0.08),
                ('w', 0.62, 0.52, 1.02), ('w', 0.67, 0.45, 0.74), ('w', 0.6, 0.42, 0.52)], [0.14, 0.2, 0.21, 0.21, 0.2, 0.19, 0.1]),
    ('atras 1', [('h', 174, 80, 0.0), ('h', 145, 56, 0.05), ('h', 140, 22, 0.07), ('h', 141, -12, 0.07),
                 ('w', 0.44, 0.6, 0.98), ('w', 0.45, 0.6, 0.7), ('w', 0.4, 0.55, 0.5)], [0.15, 0.21, 0.22, 0.21, 0.2, 0.19, 0.1]),
    ('atras 2', [('h', 176, 60, 0.0), ('h', 170, 30, 0.05), ('h', 168, 0, 0.07), ('h', 167, -26, 0.07),
                 ('w', 0.16, 0.66, 0.98), ('w', 0.17, 0.64, 0.7), ('w', 0.15, 0.58, 0.49)], [0.15, 0.21, 0.22, 0.21, 0.2, 0.19, 0.1]),
]


def flequillo_recto(ctx, surf, n=7, alto=None, ancho=48):
    """Flequillo de mechones cortos que caen sobre la frente."""
    F = ctx.P['face']
    fin = alto if alto is not None else F['brow'][1][1] + 0.05
    out = []
    for k, az in enumerate(np.linspace(-ancho, ancho, n)):
        a = hp(surf, ctx, az * 0.3, 80, 0.02)
        b = hp(surf, ctx, az * 0.8, 55, 0.05)
        c = hp(surf, ctx, az, 35, 0.04)
        c[2] = min(c[2], fin + 0.12)
        d = np.array([c[0] * 1.02, c[1] - 0.03, fin])
        out.append(mechon(ctx, f'flequillo {k}', [a, b, c, d], [0.1, 0.15, 0.13, 0.05], L=0.5))
    return out


# ---------------------------------------------------------------------------
# Él
# ---------------------------------------------------------------------------

@prenda('pelo_rapado', 'pelo', V1('pelo_rapado', 'Corte rapado'), para=('el',), precio=25)
def pelo_rapado(ctx):
    casco(ctx, 0.035)


@prenda('pelo_lado', 'pelo', V1('pelo_lado', 'Peinado de lado'), para=('el',), precio=35)
def pelo_lado(ctx):
    cap = casco(ctx, lambda el, a: 0.05 + 0.06 * clay.smoothstep(10, 70, el))
    s = sup(ctx, [cap])
    for k, e in enumerate(np.linspace(78, 38, 7)):
        pts = [hp(s, ctx, -60, e, 0.0), hp(s, ctx, -20, e + 6, 0.06), hp(s, ctx, 30, e + 2, 0.08), hp(s, ctx, 75, e - 8, 0.05),
               hp(s, ctx, 100, e - 20, 0.02)]
        mechon(ctx, f'lado {k}', pts, [0.12, 0.18, 0.2, 0.17, 0.06], L=0.55)
    for k, e in enumerate(np.linspace(70, 20, 5)):
        pts = [hp(s, ctx, -60, e, 0.0), hp(s, ctx, -110, e - 8, 0.04), hp(s, ctx, -150, e - 18, 0.03)]
        mechon(ctx, f'atras {k}', pts, [0.14, 0.18, 0.06], L=0.55)


@prenda('pelo_afro', 'pelo', V1('pelo_afro', 'Afro'), para=('el', 'ella'), precio=45)
def pelo_afro(ctx):
    cap = casco(ctx, 0.06, subir=-4)
    hc = ctx.hc
    c = hc + np.array([0, 0.06, 0.16])
    rng = np.random.default_rng(3)
    k = 0
    for i in range(160):
        u = rng.normal(size=3)
        u /= np.linalg.norm(u)
        az = math.degrees(math.atan2(u[0], -u[1]))
        el = math.degrees(math.asin(u[2]))
        if el < -25 or (abs(az) < 62 and el < 38):
            continue
        r = rng.uniform(0.1, 0.14)
        rizo(ctx, str(k), c + u * np.array([0.8, 0.74, 0.62]), r)
        k += 1
        if k >= 70:
            break
    del cap


@prenda('pelo_rizos', 'pelo', V1('pelo_rizos', 'Rizos'), para=('el', 'ella'), precio=40)
def pelo_rizos(ctx):
    cap = casco(ctx, 0.05)
    s = sup(ctx, [cap])
    xs, ys = LINEA[ctx.rol]
    k = 0
    for el in np.linspace(90, -20, 9):
        n = max(1, int(round(22 * math.cos(math.radians(el)))))
        for j in range(n):
            az = -180 + 360 * (j + 0.5 * (k % 2)) / n
            if el < np.interp(abs(az), xs, ys) + 4:
                continue
            p = hp(s, ctx, az, el, 0.035)
            rizo(ctx, str(k), p, 0.075)
            k += 1


@prenda('pelo_mohicano', 'pelo', V1('pelo_mohicano', 'Mohicano'), para=('el',), precio=40)
def pelo_mohicano(ctx):
    cap = casco(ctx, 0.02)
    s = sup(ctx, [cap])
    for k, (az, el) in enumerate(((0, 50), (0, 66), (0, 80), (180, 84), (180, 70), (180, 54), (180, 36))):
        base = hp(s, ctx, az, el, 0.0)
        n = base - ctx.hc
        n /= np.linalg.norm(n)
        atras = np.array([0, 1, 0]) * (0.06 if az == 0 else 0.1)
        tip = base + n * (0.26 - 0.02 * abs(k - 3)) + atras
        mechon(ctx, f'cresta {k}', [base - n * 0.02, base + n * 0.1 + atras * 0.4, tip], [0.11, 0.09, 0.03], L=0.45,
               up_fn=lambda p: np.array([1.0, 0, 0]))


@prenda('pelo_colita', 'pelo', V1('pelo_colita', 'Colita de samurái'), para=('el',), precio=40)
def pelo_colita(ctx):
    cap = casco(ctx, lambda el, a: 0.05 + 0.03 * clay.smoothstep(20, 80, el))
    s = sup(ctx, [cap])
    c = hp(s, ctx, 180, 58, 0.1)
    b = clay.blob(ctx.nombre('mechon moño'), tuple(c), (0.15, 0.14, 0.13), ctx.coll, mat(ctx), n=8)
    b['hueso'] = 'cabeza'
    ring = [c + np.array([math.cos(a) * 0.1, 0.0, math.sin(a) * 0.1]) + np.array([0, -0.08, -0.03]) for a in np.linspace(0, 2 * math.pi, 14, endpoint=False)]
    liga = clay.sweep(ctx.nombre('liga moño'), ring, 0.022, (1, 1), ctx.coll, ctx.m('liga', tipo='lisa', color='#E4566B'), segments=6, samples=3,
                      closed=True)
    liga['hueso'] = 'cabeza'
    for k, az in enumerate((-40, -15, 15, 40)):
        pts = [hp(s, ctx, az, 42, 0.0), hp(s, ctx, az * 0.6, 70, 0.04), hp(s, ctx, 180 - az * 0.3, 70, 0.05), c - (c - ctx.hc) * 0.1]
        mechon(ctx, f'peinado atras {k}', pts, [0.1, 0.15, 0.14, 0.08], L=0.5)


@prenda('pelo_largo_el', 'pelo', V1('pelo_largo_el', 'Pelo largo'), para=('el',), precio=45)
def pelo_largo_el(ctx):
    cap = casco(ctx, lambda el, a: 0.05 + 0.08 * clay.smoothstep(10, 70, el), raya=True)
    s = sup(ctx, [cap])
    for sx in (-1, 1):
        for k, (az0, az1) in enumerate(((10, 70), (30, 110), (60, 140), (90, 170))):
            pts = [hp(s, ctx, sx * 3, 70 - k * 4, 0.0), hp(s, ctx, sx * az0, 50, 0.06), hp(s, ctx, sx * az1, 10, 0.08),
                   hp(s, ctx, sx * az1, -25, 0.07) + np.array([0, 0.02, -0.12])]
            mechon(ctx, f'largo {ctx.lado(sx)} {k}', pts, [0.13, 0.19, 0.2, 0.12], L=0.5)


@prenda('pelo_copete', 'pelo', V1('pelo_copete', 'Copete de rockero'), para=('el',), precio=40)
def pelo_copete(ctx):
    cap = casco(ctx, lambda el, a: 0.04 + 0.03 * clay.smoothstep(40, 80, el))
    s = sup(ctx, [cap])
    for k, dx in enumerate((-30, -12, 6, 24)):
        pts = [hp(s, ctx, dx, 42, 0.0), hp(s, ctx, dx * 0.8, 62, 0.22), hp(s, ctx, dx * 0.6, 82, 0.26), hp(s, ctx, 180 - dx * 0.2, 72, 0.08),
               hp(s, ctx, 180 - dx * 0.2, 45, 0.02)]
        mechon(ctx, f'copete {k}', pts, [0.12, 0.2, 0.22, 0.16, 0.08], L=0.6)


# ---------------------------------------------------------------------------
# Ella
# ---------------------------------------------------------------------------

@prenda('pelo_cola', 'pelo', V1('pelo_cola', 'Cola de caballo'), para=('ella',), precio=35)
def pelo_cola(ctx):
    cap = casco(ctx, lambda el, a: 0.04 + 0.04 * clay.smoothstep(20, 80, el))
    s = sup(ctx, [cap])
    nudo = hp(s, ctx, 180, 40, 0.06)
    liga = clay.blob(ctx.nombre('liga cola'), tuple(nudo), (0.08, 0.05, 0.08), ctx.coll, ctx.m('liga', tipo='peluche', color='#F39AB0'), n=6)
    liga['hueso'] = 'cabeza'
    for k, dx in enumerate((-0.05, 0.0, 0.05)):
        pts = [nudo + np.array([dx, 0.02, 0.02]), nudo + np.array([dx * 1.5, 0.22, -0.12]), nudo + np.array([dx * 2, 0.28, -0.42]),
               nudo + np.array([dx * 2.2, 0.24, -0.68])]
        mechon(ctx, f'cola {k}', pts, [0.08, 0.12, 0.1, 0.03], L=0.8)
    for k, az in enumerate((-60, -25, 25, 60)):
        pts = [hp(s, ctx, az * 0.2, 60, 0.0), hp(s, ctx, az, 55, 0.05), hp(s, ctx, 180 - az * 0.6, 55, 0.05), nudo]
        mechon(ctx, f'recogido {k}', pts, [0.09, 0.14, 0.12, 0.07], L=0.5)


@prenda('pelo_mono', 'pelo', V1('pelo_mono', 'Moño alto'), para=('ella',), precio=35)
def pelo_mono(ctx):
    cap = casco(ctx, lambda el, a: 0.04 + 0.03 * clay.smoothstep(20, 80, el))
    s = sup(ctx, [cap])
    top = hp(s, ctx, 170, 78, 0.12)
    b = clay.blob(ctx.nombre('mechon moño alto'), tuple(top), (0.2, 0.2, 0.15), ctx.coll, mat(ctx), n=8)
    b['hueso'] = 'cabeza'
    ring = [top + np.array([math.cos(a) * 0.19, math.sin(a) * 0.19, -0.02 + 0.03 * math.sin(a * 3)]) for a in np.linspace(0, 2 * math.pi, 18, endpoint=False)]
    mechon(ctx, 'vuelta moño', ring + [ring[0]], 0.06, L=0.8)
    for k, az in enumerate((-70, -30, 30, 70, 150, -150)):
        pts = [hp(s, ctx, az, 30, 0.0), hp(s, ctx, az * 0.8, 60, 0.05), top - (top - ctx.hc) * 0.15]
        mechon(ctx, f'recogido {k}', pts, [0.09, 0.13, 0.08], L=0.5)


@prenda('pelo_trenzas', 'pelo', V1('pelo_trenzas', 'Dos trenzas'), para=('ella',), precio=45)
def pelo_trenzas(ctx):
    cap = casco(ctx, 0.06, raya=True)
    s = sup(ctx, [cap])
    liga = ctx.m('liga', tipo='lisa', color='#E4566B')
    for sx in (-1, 1):
        ini = hp(s, ctx, sx * 115, 5, 0.04)
        fin = np.array([sx * 0.46, -0.28, 0.72])
        ctrl = [ini, ini + np.array([sx * 0.06, -0.1, -0.2]), (ini + fin) / 2 + np.array([sx * 0.05, -0.12, 0]), fin]
        from clay import catmull_rom
        pts, _ = catmull_rom(ctrl, 10)
        for j, p in enumerate(pts[::2]):
            off = np.array([0.03 * (1 if j % 2 else -1), 0, 0])
            r = 0.085 - 0.002 * j
            o = clay.blob(ctx.nombre(f'mechon trenza {ctx.lado(sx)} {j}'), tuple(p + off), (r, r * 0.9, r * 0.8), ctx.coll, mat(ctx), n=5)
            o['modo'] = 'pelo_largo'
            o['corte'] = 1.3
        lp = fin + np.array([0, 0, -0.04])
        o = clay.blob(ctx.nombre(f'liga trenza {ctx.lado(sx)}'), tuple(lp), (0.06, 0.06, 0.035), ctx.coll, liga, n=5)
        o['modo'] = 'pelo_largo'
        o['corte'] = 1.3
        pun = clay.blob(ctx.nombre(f'mechon punta trenza {ctx.lado(sx)}'), tuple(lp + np.array([0, 0, -0.08])), (0.06, 0.05, 0.08), ctx.coll,
                        mat(ctx), n=5)
        pun['modo'] = 'pelo_largo'
        pun['corte'] = 1.3


@prenda('pelo_corto', 'pelo', V1('pelo_corto', 'Corte bob con flequillo'), para=('ella',), precio=40)
def pelo_corto(ctx):
    cap = casco(ctx, lambda el, a: 0.05 + 0.06 * clay.smoothstep(10, 70, el))
    s = sup(ctx, [cap])
    zfin = ctx.hc[2] - 0.34
    for sx in (-1, 1):
        for k, az in enumerate((60, 85, 110, 135, 160)):
            p0 = hp(s, ctx, sx * az * 0.4, 72, 0.0)
            p1 = hp(s, ctx, sx * az, 30, 0.07)
            p2 = hp(s, ctx, sx * az, -10, 0.1)
            p2[2] = zfin + 0.08
            p3 = p2 + (p2 - ctx.hc) * np.array([0.05, 0.05, 0]) + np.array([0, 0, -0.08])
            mechon(ctx, f'bob {ctx.lado(sx)} {k}', [p0, p1, p2, p3], [0.12, 0.19, 0.2, 0.14], L=0.55)
    flequillo_recto(ctx, s)


@prenda('pelo_rizado', 'pelo', V1('pelo_rizado', 'Largo rizado'), para=('ella',), precio=45)
def pelo_rizado(ctx):
    cap = casco(ctx, 0.07, raya=True)
    s = sup(ctx, [cap])
    for sx in (-1, 1):
        for k, (az, x, y) in enumerate(((40, 0.72, 0.2), (80, 0.76, 0.36), (115, 0.66, 0.5), (150, 0.44, 0.6), (172, 0.16, 0.64))):
            top = hp(s, ctx, sx * az, 10, 0.08)
            pts = [hp(s, ctx, sx * az * 0.3, 70, 0.0), hp(s, ctx, sx * az * 0.8, 40, 0.07), top]
            for j, z in enumerate(np.linspace(top[2] - 0.12, 0.62, 5)):
                ang = j * 1.9 + k
                pts.append(np.array([sx * x + 0.05 * math.cos(ang), y + 0.05 * math.sin(ang), z]))
            mechon(ctx, f'rizado {ctx.lado(sx)} {k}', pts, [0.1, 0.16, 0.18, 0.18, 0.17, 0.16, 0.14, 0.09], L=0.7, largo=True, corte=1.3)


@prenda('pelo_colitas', 'pelo', V1('pelo_colitas', 'Dos colitas'), para=('ella',), precio=40)
def pelo_colitas(ctx):
    cap = casco(ctx, 0.06, raya=True)
    s = sup(ctx, [cap])
    lazo = ctx.m('lazo', tipo='lisa', color='#F39AB0')
    for sx in (-1, 1):
        nudo = hp(s, ctx, sx * 100, 42, 0.05)
        o = clay.blob(ctx.nombre(f'liga colita {ctx.lado(sx)}'), tuple(nudo), (0.06, 0.07, 0.07), ctx.coll, lazo, n=5)
        o['hueso'] = 'cabeza'
        for j in (-1, 1):
            b = clay.blob(ctx.nombre(f'lazo colita {ctx.lado(sx)} {j}'), tuple(nudo + np.array([sx * 0.02, j * 0.08, 0.06])), (0.03, 0.07, 0.05),
                          ctx.coll, lazo, n=5)
            b['hueso'] = 'cabeza'
        for k, dy in enumerate((-0.04, 0.0, 0.04)):
            pts = [nudo + np.array([sx * 0.02, dy, 0]), nudo + np.array([sx * 0.2, dy * 1.5, -0.05]), nudo + np.array([sx * 0.28, dy * 2, -0.3]),
                   nudo + np.array([sx * 0.24, dy * 2, -0.52])]
            mechon(ctx, f'colita {ctx.lado(sx)} {k}', pts, [0.07, 0.11, 0.1, 0.03], L=0.8)


@prenda('pelo_flequillo', 'pelo', V1('pelo_flequillo', 'Largo con flequillo'), para=('ella',), precio=40)
def pelo_flequillo(ctx):
    cap = casco(ctx, lambda el, a: 0.05 + 0.09 * clay.smoothstep(10, 70, el))
    s = sup(ctx, [cap])
    for sx in (-1, 1):
        largos(ctx, s, sx, LARGO_ELLA)
    flequillo_recto(ctx, s)


@prenda('pelo_ondas', 'pelo', V1('pelo_ondas', 'Largo ondulado'), para=('ella',), precio=40)
def pelo_ondas(ctx):
    cap = casco(ctx, lambda el, a: 0.05 + 0.09 * clay.smoothstep(10, 70, el), raya=True)
    s = sup(ctx, [cap])
    ondas = []
    for name, path, radii in LARGO_ELLA:
        p2 = []
        for i, p in enumerate(path):
            if p[0] == 'w':
                p2.append(('w', p[1] + 0.06 * math.sin(i * 2.1), p[2], p[3]))
            else:
                p2.append(p)
        ondas.append((name, p2, [r * 1.12 for r in radii]))
    for sx in (-1, 1):
        largos(ctx, s, sx, ondas, L=0.5)
