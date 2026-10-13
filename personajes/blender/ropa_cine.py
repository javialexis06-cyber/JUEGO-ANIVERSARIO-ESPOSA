"""Ropa exclusiva de los personajes de cine de la granja (docs/en-obra/pelicula-de-astra.md, capítulo 11): no se vende.

Fuatia, la diosa que creó Laura: vestido de los cuatro elementos (volantes de fuego, agua, tierra y aire, con sus
bordados) y corona de los cuatro elementos (una llama, una gota, una hoja y un remolino alrededor de un sol pequeño).
Nath'Gora, la estrella que se apagó: corona de esquirlas de cristal oscuro con una estrella muerta y agrietada al frente.
Vael'Thor, el Ceramista de Sombras: media máscara de porcelana, rajada y reparada con oro (kintsugi), con un ojo violeta.
"""
import math

import numpy as np

import clay
import sdf
from clay import sph
from ropa import prenda, punto_cabeza
from ropa_abajo import base_vestido
from ropa_accesorios import delante_ojo
from ropa_arriba import V
from ropa_diosas import _aro_cabeza, _bordado

ELEMENTOS = ('fuego', 'agua', 'tierra', 'aire')


# ---------------------------------------------------------------------------
# Fuatia
# ---------------------------------------------------------------------------

@prenda('vestido_elementos', 'conjunto', [V('vestido_elementos', 'Vestido de los cuatro elementos', principal='#7CC8C2', fuego='#F08A3C', agua='#4FA3D9',
                                            tierra='#B98A4E', aire='#EEF6FA', cinta='#FFFFFF', joya='#D9A94E')],
        para=('ella',), exclusiva=True)
def vestido_elementos(ctx):
    """Vestido largo de diosa con el ruedo partido en cuatro: cada cuarto con el volante y los bordados de un elemento."""
    objs, f, ff = base_vestido(ctx, hem=0.02, r1=0.98, mangas_si='bombacha', pliegues=18)
    cinta = ctx.m('cinta', tipo='lisa')
    joya = ctx.m('joya', tipo='brillo')
    for k, z in enumerate((0.36, 0.2, 0.06)):
        ring = sdf.ring_points(ff, (0, 0.03, z), (0, 0, 1), 1.4, 64, lift=0.012 if k < 2 else 0.006)
        if len(ring) < 16:
            continue
        n = len(ring)
        for e, nombre in enumerate(ELEMENTOS):
            # (cada cuarto empieza donde acabó el anterior, sin hueco)
            arco = [ring[(e * n // 4 + i) % n] for i in range(n // 4 + 1)]
            arco = [p + np.array([0, 0, 0.016 * math.sin(i * 1.1)]) for i, p in enumerate(arco)] if k < 2 else arco
            mat = ctx.m(nombre, tipo='luz' if nombre == 'fuego' and k == 2 else 'lisa')
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'volante {nombre} {k}'), arco, 0.032 if k < 2 else 0.024, (1.3, 0.45) if k < 2 else (1, 0.7),
                                             ctx.coll, mat, segments=8, samples=3, caps=('round', 'round')), 'pelvis'))
    for e, nombre in enumerate(ELEMENTOS):
        objs += _bordado(ctx, ff, 'hoja', ctx.m(nombre, tipo='lisa'), 9, 40 + e, z0=0.1, z1=0.5)
    objs += _bordado(ctx, ff, 'estrella', joya, 10, 49, z0=0.12, z1=0.46, r=0.028)
    # La joya del pecho en cuatro colores
    T = ctx.D['torso']
    zj = T['c'][2] + T['half'][2] * 0.35
    P, hit = sdf.trace(f, np.array([[0.0, -2.0, zj]]), (0, 1, 0), max_dist=4.0)
    if hit[0]:
        nrm = sdf.normal(f, P)[0]
        objs.append(ctx.pieza(clay.blob(ctx.nombre('engaste elementos'), tuple(P[0] + nrm * 0.018), (0.085, 0.015, 0.085), ctx.coll, cinta, n=5, p=1.6), 'torso'))
        for e, nombre in enumerate(ELEMENTOS):
            a = e * math.pi / 2 + math.pi / 4
            c = P[0] + nrm * 0.03 + np.array([math.cos(a) * 0.035, 0, math.sin(a) * 0.035])
            objs.append(ctx.pieza(clay.blob(ctx.nombre(f'gema {nombre}'), tuple(c), (0.028, 0.02, 0.028), ctx.coll, ctx.m(nombre, tipo='brillo'), n=4), 'torso'))
    return objs


@prenda('corona_elementos', 'cabeza', [V('corona_elementos', 'Corona de los cuatro elementos', principal='#D9A94E', fuego='#FFB347', agua='#6FC3F0',
                                         tierra='#7FBF63', aire='#F4FAFF', centro='#FFF1B1')],
        para=('ella',), exclusiva=True)
def corona_elementos(ctx):
    """Aro de oro con un sol pequeño al frente y, a sus lados, una llama, una gota, una hoja y un remolino de aire."""
    oro = ctx.m('principal', tipo='metal')
    aro = _aro_cabeza(ctx, el=62, lift=0.035, n=29)
    ctx.pieza(clay.sweep(ctx.nombre('aro corona elementos'), [p for p, _, _ in aro], 0.028, (1.3, 0.8), ctx.coll, oro, segments=8, samples=3, closed=True),
              'cabeza')
    loc, nrm = punto_cabeza(ctx, 0, 60, 0.07)
    if loc is not None:
        s = clay.blob(ctx.nombre('sol elementos'), tuple(loc), (0.085, 0.04, 0.085), ctx.coll, ctx.m('centro', tipo='luz'), n=4)
        clay.orient_to(s, np.array(nrm))
        ctx.pieza(s, 'cabeza')
    for az, nombre in ((-52, 'fuego'), (-24, 'agua'), (24, 'tierra'), (52, 'aire')):
        loc, nrm = punto_cabeza(ctx, az, 62, 0.05)
        if loc is None:
            continue
        nrm = np.array(nrm)
        loc = np.array(loc)
        tang = np.array([math.cos(math.radians(az)), math.sin(math.radians(az)), 0.0])
        if nombre == 'fuego':
            pts = [loc, loc + nrm * 0.03 + np.array([0, 0, 0.18]), loc + np.array([0, 0, 0.36])]
            ctx.pieza(clay.sweep(ctx.nombre('llama elementos'), pts, [0.1, 0.07, 0.005], (1, 0.55), ctx.coll, ctx.m('fuego', tipo='luz'), segments=8, samples=5,
                                 caps=('round', 'point'), up=tuple(nrm)), 'cabeza')
        elif nombre == 'agua':
            # Gota: bola abajo y punta arriba
            ctx.pieza(clay.blob(ctx.nombre('gota elementos'), tuple(loc + np.array([0, 0, 0.07])), (0.08, 0.06, 0.085), ctx.coll, ctx.m('agua', tipo='brillo'), n=5), 'cabeza')
            ctx.pieza(clay.sweep(ctx.nombre('punta gota'), [loc + np.array([0, 0, 0.13]), loc + np.array([0, 0, 0.27])], [0.065, 0.004], (1, 0.75), ctx.coll,
                                 ctx.m('agua', tipo='brillo'), segments=8, samples=3, caps=('round', 'point')), 'cabeza')
        elif nombre == 'tierra':
            h = clay.blob(ctx.nombre('hoja elementos'), (0, 0, 0), (0.075, 0.02, 0.16), ctx.coll, ctx.m('tierra', tipo='peluche'), n=4, p=1.7)
            h.location = tuple(loc + np.array([0, 0, 0.13]))
            clay.orient_to(h, nrm)
            ctx.pieza(h, 'cabeza')
            ctx.pieza(clay.sweep(ctx.nombre('vena hoja elementos'), [loc + nrm * 0.016 + np.array([0, 0, 0.0]), loc + nrm * 0.022 + np.array([0, 0, 0.25])], 0.008,
                                 (1, 1), ctx.coll, oro, segments=5, samples=2), 'cabeza')
        else:
            # Remolino: una espiral que sube
            pts = [loc + nrm * 0.02 + tang * math.cos(t * 9) * (0.09 - t * 0.05) + np.array([0, 0, 0.05 + t * 0.24 + math.sin(t * 9) * 0.03]) for t in np.linspace(0, 1, 16)]
            ctx.pieza(clay.sweep(ctx.nombre('remolino elementos'), pts, [0.032, 0.024, 0.005], (1, 0.6), ctx.coll, ctx.m('aire', tipo='luz'), segments=6, samples=3,
                                 caps=('round', 'point')), 'cabeza')


# ---------------------------------------------------------------------------
# Nath'Gora
# ---------------------------------------------------------------------------

@prenda('corona_esquirlas', 'cabeza', [V('corona_esquirlas', 'Corona de la estrella apagada', principal='#1B1D2A', esquirla='#2E3552', brillo='#9FD6FF',
                                         estrella='#5E6680')],
        para=('el',), exclusiva=True)
def corona_esquirlas(ctx):
    """Aro negro con esquirlas de cristal oscuro torcidas (puntas con un brillo frío) y una estrella muerta y rajada al frente."""
    negro = ctx.m('principal', tipo='metal')
    vidrio = ctx.m('esquirla', tipo='brillo')
    frio = ctx.m('brillo', tipo='luz')
    aro = _aro_cabeza(ctx, el=60, lift=0.08, n=29)
    ctx.pieza(clay.sweep(ctx.nombre('aro esquirlas'), [p for p, _, _ in aro], 0.03, (1.3, 0.8), ctx.coll, negro, segments=8, samples=3, closed=True), 'cabeza')
    rng = np.random.default_rng(7)
    for k, az in enumerate(np.linspace(-150, 150, 11)):
        loc, nrm = punto_cabeza(ctx, az, 60, 0.08)
        if loc is None:
            continue
        nrm, loc = np.array(nrm), np.array(loc)
        alto = 0.34 + 0.22 * (1 - abs(az) / 150) + rng.uniform(-0.05, 0.07)
        ladeo = rng.uniform(-0.05, 0.05)
        punta = loc + nrm * 0.05 + np.array([ladeo, 0, alto])
        ctx.pieza(clay.sweep(ctx.nombre(f'esquirla {k}'), [loc, loc + nrm * 0.03 + np.array([ladeo * 0.4, 0, alto * 0.5]), punta], [0.08, 0.055, 0.004], (1, 0.5),
                             ctx.coll, vidrio, segments=5, samples=3, caps=('round', 'point'), up=tuple(nrm)), 'cabeza')
        ctx.pieza(clay.blob(ctx.nombre(f'brillo esquirla {k}'), tuple(punta - np.array([0, 0, 0.02])), (0.02, 0.02, 0.026), ctx.coll, frio, n=3), 'cabeza')
    loc, nrm = punto_cabeza(ctx, 0, 58, 0.12)
    if loc is not None:
        loc, nrm = np.array(loc), np.array(nrm)
        ctx.pieza(clay.blob(ctx.nombre('estrella muerta'), tuple(loc), (0.1, 0.08, 0.1), ctx.coll, ctx.m('estrella', tipo='lisa'), n=5), 'cabeza')
        # La grieta que la cruza, con un hilo de luz fría adentro
        pts = [loc + nrm * 0.055 + np.array([x, 0, z]) for x, z in ((-0.05, 0.05), (-0.015, 0.015), (-0.03, -0.01), (0.01, -0.03), (0.04, -0.055))]
        ctx.pieza(clay.sweep(ctx.nombre('grieta estrella'), pts, 0.007, (1, 0.6), ctx.coll, frio, segments=5, samples=3), 'cabeza')


# ---------------------------------------------------------------------------
# Vael'Thor
# ---------------------------------------------------------------------------

@prenda('mascara_porcelana', 'cara', [V('mascara_porcelana', 'Máscara de porcelana rajada', principal='#F4EFE6', oro='#E0B84A', ojo='#B07CFF',
                                        sombra='#3A2350')],
        para=('el',), exclusiva=True)
def mascara_porcelana(ctx):
    """Media máscara de porcelana sobre el lado derecho de la cara, con el ojo hundido en sombra y un brillo violeta, y las
    rajaduras reparadas con oro."""
    porcelana = ctx.m('principal', tipo='brillo')
    oro = ctx.m('oro', tipo='metal')
    c, n, F = delante_ojo(ctx, 1, 0.05)
    c, n = np.array(c), np.array(n)
    centro = c + np.array([0.08, 0, 0.04])
    m = clay.blob(ctx.nombre('mascara porcelana'), tuple(centro), (0.32, 0.06, 0.42), ctx.coll, porcelana, n=8, p=2.4)
    clay.orient_to(m, n)
    ctx.pieza(m, 'cabeza')
    # El ojo: un hueco oscuro con el iris violeta que brilla
    ojo_c = c + n * 0.05
    ctx.pieza(clay.blob(ctx.nombre('hueco ojo mascara'), tuple(ojo_c), (0.09, 0.02, 0.1), ctx.coll, ctx.m('sombra', tipo='lisa'), n=5), 'cabeza')
    ctx.pieza(clay.blob(ctx.nombre('iris mascara'), tuple(ojo_c + n * 0.015), (0.04, 0.012, 0.05), ctx.coll, ctx.m('ojo', tipo='luz'), n=4), 'cabeza')
    ring = [ojo_c + np.array([math.cos(a) * 0.11, 0, math.sin(a) * 0.12]) for a in np.linspace(0, 2 * math.pi, 20, endpoint=False)]
    ctx.pieza(clay.sweep(ctx.nombre('borde ojo mascara'), ring, 0.012, (1, 0.6), ctx.coll, oro, segments=6, samples=3, closed=True, up=(0, -1, 0)), 'cabeza')
    # Rajaduras de oro (kintsugi)
    for k, puntos in enumerate((((-0.12, 0.22), (-0.04, 0.12), (-0.08, 0.04)), ((0.1, -0.08), (0.16, -0.16), (0.12, -0.26)), ((0.14, 0.18), (0.2, 0.1)))):
        pts = [centro + n * 0.052 + np.array([x, 0, z]) for x, z in puntos]
        ctx.pieza(clay.sweep(ctx.nombre(f'rajadura oro {k}'), pts, 0.009, (1, 0.5), ctx.coll, oro, segments=5, samples=3), 'cabeza')
    # La cinta que la sostiene
    el = math.degrees(math.asin((F['eye_z'] - ctx.hc[2]) / 0.66))
    pts = []
    for az in np.linspace(60, 300, 13):
        loc, _ = ctx.sup_pelo.radial(ctx.hc, sph(az, el + 6), 0.02)
        if loc is not None:
            pts.append(loc)
    if len(pts) > 4:
        ctx.pieza(clay.sweep(ctx.nombre('cinta mascara'), pts, 0.025, (1, 0.4), ctx.coll, ctx.m('sombra', tipo='lisa'), segments=6, samples=3), 'cabeza')
