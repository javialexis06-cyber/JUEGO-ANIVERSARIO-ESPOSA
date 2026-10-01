"""Cascos y gorros del retrete espacial (se compran con rollitos en la tienda del retrete).

Se arman con la maquinaria de la ropa (ropa.py): sobre la cabeza de Él y de Ella (con su pelo) y amarrados al hueso
de la cabeza, así siguen todas las poses. No entran al clóset de la casa: se guardan aparte con el prefijo cohete_.

Uso: blender -b -P cohete_cascos.py -- <carpeta_salida> [el|ella|ambos] [claves separadas por coma] [--sin-iconos]
     salida: <carpeta>/ropa/cohete_<clave>_<rol>.glb y <carpeta>/iconos/cohete_casco_<clave>_<rol>.png
"""
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import clay  # noqa: E402
import escena  # noqa: E402
import ropa  # noqa: E402
from clay import sph  # noqa: E402
from ropa import Mats, domo, punto_cabeza, radio_cabeza  # noqa: E402

CASCOS = {}


def casco(clave, oculta=('copete',)):
    def deco(fn):
        CASCOS[clave] = dict(fn=fn, oculta=oculta)
        return fn
    return deco


def tope(ctx):
    return ctx.hc + np.array([0, 0, radio_cabeza(ctx, 0, 89)])


def apuntar(o, dir_):
    """Gira una pieza hecha en el origen (eje z hacia arriba) para que su eje z mire hacia dir_."""
    q = Vector((0, 0, 1)).rotation_difference(Vector(tuple(dir_)).normalized())
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = q
    return o


def pieza(ctx, o):
    return ctx.pieza(o, 'cabeza')


def vidrio(ctx, papel, color, alfa=0.25):
    mt = ctx.m(papel, color, tipo='lisa', rough=0.03, coat=1.0, coat_rough=0.0, alpha=alfa)
    try:
        mt.surface_render_method = 'BLENDED'
    except AttributeError:
        mt.blend_method = 'BLEND'
    return mt


# ---------------------------------------------------------------------------
# Los cascos
# ---------------------------------------------------------------------------

@casco('desatascador', oculta=())
def desatascador(ctx):
    """El desatascador pegado en la frente (como en las caricaturas)."""
    loc, n = punto_cabeza(ctx, 0, 32, 0.0)
    n = np.array(n)
    rojo = ctx.m('copa', '#D93A3A', tipo='brillo')
    copa = clay.lathe(ctx.nombre('copa desatascador'), [(0.0, 0.22), (0.05, 0.22), (0.12, 0.17), (0.2, 0.06), (0.24, 0.0), (0.21, -0.01), (0.0, 0.03)], ctx.coll, rojo,
                      segments=32)
    apuntar(copa, n)
    copa.location = tuple(loc - n * 0.02)
    pieza(ctx, copa)
    tip = loc + n * 0.22
    palo_fin = loc + n * 0.95 + np.array([0, 0, 0.12])
    pieza(ctx, clay.sweep(ctx.nombre('palo desatascador'), [tip, (tip + palo_fin) / 2, palo_fin], 0.05, (1, 1), ctx.coll,
                          ctx.m('palo', '#C9956A', tipo='lisa'), segments=10, samples=3))
    pieza(ctx, clay.blob(ctx.nombre('tapa palo'), tuple(palo_fin), (0.06, 0.06, 0.06), ctx.coll, ctx.m('tapa palo', '#2456C9', tipo='brillo'), n=5))
    # Rayitas de «pegado» alrededor de la copa
    for k in range(3):
        a = math.radians(-40 + k * 40)
        p0 = loc + np.array([math.sin(a) * 0.3, -0.05, math.cos(a) * 0.3])
        pieza(ctx, clay.sweep(ctx.nombre(f'rayita {k}'), [p0, p0 + np.array([math.sin(a) * 0.12, -0.04, math.cos(a) * 0.12])], 0.012, (1, 1), ctx.coll,
                              ctx.m('rayitas', '#FFFFFF', tipo='lisa'), segments=5, samples=2))


@casco('ducha')
def ducha(ctx):
    """Gorro de baño con resorte de bolitas y patitos de hule estampados."""
    m = ctx.m('gorro ducha', '#9FD9F2', tipo='brillo')
    copa, R, els, azs = domo(ctx, 'gorro ducha', m, el_min=6 if ctx.el else 12, margen=0.06, alto_extra=0.06, grosor=0.02)
    hc = ctx.hc
    e0 = els[0]
    # Resorte con vuelos (bolitas alrededor)
    for j in range(0, len(azs), 1):
        a = azs[j]
        p = hc + np.array(sph(a, e0)) * (R[0, j] + 0.08)
        pieza(ctx, clay.blob(ctx.nombre(f'vuelo {j}'), tuple(p), (0.06, 0.06, 0.05), ctx.coll, ctx.m('vuelo ducha', '#C8ECFA', tipo='brillo'), n=4))
    # Patitos
    amarillo = ctx.m('patito', '#FFD23F', tipo='brillo')
    naranja = ctx.m('pico patito', '#F7923A', tipo='brillo')
    for k, (az, el) in enumerate(((-35, 40), (30, 55), (0, 75), (-80, 45), (80, 40))):
        loc, n = punto_cabeza(ctx, az, el, 0.1)
        if loc is None:
            continue
        n = np.array(n)
        pieza(ctx, clay.blob(ctx.nombre(f'patito {k}'), tuple(loc), (0.07, 0.05, 0.045), ctx.coll, amarillo, n=6))
        pieza(ctx, clay.blob(ctx.nombre(f'cabeza patito {k}'), tuple(loc + n * 0.04 + np.array([0.04, 0, 0.02])), (0.035, 0.035, 0.035), ctx.coll, amarillo, n=5))
        pieza(ctx, clay.blob(ctx.nombre(f'pico patito {k}'), tuple(loc + n * 0.05 + np.array([0.075, 0, 0.015])), (0.02, 0.012, 0.01), ctx.coll, naranja, n=4))


@casco('rollo')
def rollo(ctx):
    """Un rollo de papel higiénico gigante de sombrero, con la tira cayendo por un lado."""
    t = tope(ctx)
    papel = ctx.m('papel', '#FBFBF6', tipo='tela')
    carton = ctx.m('cartón', '#C9A27A', tipo='lisa')
    c = t + np.array([0, 0.02, -0.16])
    r, h, hueco = 0.42, 0.42, 0.14
    perfil = [(hueco, 0), (r - 0.03, 0), (r, 0.03), (r, h - 0.03), (r - 0.03, h), (hueco, h)]
    o = clay.lathe(ctx.nombre('rollo sombrero'), perfil, ctx.coll, papel, segments=40, cap_bottom=False, cap_top=False)
    o.location = tuple(c)
    pieza(ctx, o)
    tubo = clay.lathe(ctx.nombre('tubo sombrero'), [(hueco, -0.005), (hueco, h + 0.005), (hueco - 0.02, h + 0.005), (hueco - 0.02, -0.005)], ctx.coll, carton,
                      segments=28, cap_bottom=False, cap_top=False)
    tubo.location = tuple(c)
    pieza(ctx, tubo)
    # La tira que cae por el lado derecho hasta el hombro
    x0 = c[0] + r
    pts = [(x0, c[1] - 0.05, c[2] + h * 0.8), (x0 + 0.04, c[1] - 0.08, c[2] + h * 0.3), (x0 + 0.06, c[1] - 0.1, c[2] - 0.3), (x0 + 0.02, c[1] - 0.12, c[2] - 0.75)]
    pieza(ctx, clay.sweep(ctx.nombre('tira sombrero'), pts, 0.16, (0.12, 1.0), ctx.coll, papel, segments=6, samples=5, up=(1, 0, 0), caps=('flat', 'flat')))
    # Linea de picado cada tanto
    for k in range(3):
        z = c[2] + h * 0.1 - k * 0.3
        pieza(ctx, clay.sweep(ctx.nombre(f'picado {k}'), [(x0 + 0.05, c[1] - 0.25, z), (x0 + 0.06, c[1] + 0.05, z)], 0.006, (1, 1), ctx.coll,
                              ctx.m('picado', '#D8D4CA', tipo='lisa'), segments=4, samples=2))
    # Un moñito rosado
    for lado in (-1, 1):
        lz = clay.blob(ctx.nombre(f'moño rollo {lado}'), (0, 0, 0), (0.09, 0.03, 0.06), ctx.coll, ctx.m('moño', '#F2649A', tipo='brillo'), n=5)
        lz.location = tuple(c + np.array([-0.2 + lado * 0.08, -r * 0.94, h * 0.55]))
        lz.rotation_euler = (0, lado * 0.4, 0)
        pieza(ctx, lz)
    pieza(ctx, clay.blob(ctx.nombre('nudo moño rollo'), tuple(c + np.array([-0.2, -r * 0.96, h * 0.55])), (0.035, 0.03, 0.035), ctx.coll,
                         ctx.m('moño', '#F2649A', tipo='brillo'), n=4))


@casco('antenas', oculta=())
def antenas(ctx):
    """Diadema con dos antenas de resorte y bolitas verdes que brillan."""
    from ropa_accesorios import diadema
    verde = ctx.m('diadema marciano', '#7CD957', tipo='brillo')
    diadema(ctx, verde, lift=0.03)
    luzv = ctx.m('bolita antena', '#B6FF6B', tipo='luz')
    for sx in (-1, 1):
        loc, n = punto_cabeza(ctx, sx * 60, 62, 0.04)
        if loc is None:
            continue
        pts = [loc]
        for k in range(1, 9):
            t = k / 8
            pts.append(loc + np.array([sx * 0.18 * t + 0.03 * math.cos(k * 2.2), 0.03 * math.sin(k * 2.2), 0.55 * t]))
        pieza(ctx, clay.sweep(ctx.nombre(f'resorte {sx}'), pts, 0.022, (1, 1), ctx.coll, verde, segments=6, samples=4))
        pieza(ctx, clay.blob(ctx.nombre(f'bolita {sx}'), tuple(pts[-1] + np.array([0, 0, 0.07])), (0.09, 0.09, 0.09), ctx.coll, luzv, n=7))


@casco('aviador')
def aviador(ctx):
    """Gorro de aviador de cuero con orejeras, borrego adentro y gafas en la frente."""
    cuero = ctx.m('cuero', '#8A5432', tipo='lisa', rough=0.55)
    borrego = ctx.m('borrego', '#F2E6D2', tipo='peluche')
    copa, R, els, azs = domo(ctx, 'gorro aviador', cuero, el_min=4 if ctx.el else 10, margen=0.05, grosor=0.03)
    hc = ctx.hc
    for sx in (-1, 1):
        loc, n = punto_cabeza(ctx, sx * 90, 2, 0.08)
        if loc is None:
            continue
        pieza(ctx, clay.blob(ctx.nombre(f'orejera {sx}'), tuple(loc + np.array([0, 0, -0.12])), (0.07, 0.17, 0.22), ctx.coll, cuero, n=7))
        pieza(ctx, clay.blob(ctx.nombre(f'borrego orejera {sx}'), tuple(loc + np.array([-sx * 0.02, -0.02, -0.12])), (0.06, 0.15, 0.2), ctx.coll, borrego, n=6))
        pieza(ctx, clay.sweep(ctx.nombre(f'correa {sx}'), [loc + np.array([0, -0.02, -0.33]), loc + np.array([-sx * 0.12, -0.12, -0.45])], 0.025, (1.6, 0.5), ctx.coll,
                              cuero, segments=6, samples=2))
    e0 = els[0]
    ring = [hc + np.array(sph(a, e0)) * (R[0, j] + 0.07) for j, a in enumerate(azs)]
    pieza(ctx, clay.sweep(ctx.nombre('borde borrego'), ring, 0.05, (1.2, 1), ctx.coll, borrego, segments=8, samples=3, closed=True))
    # Gafas en la frente
    metal = ctx.m('marco gafas', '#C9A04A', tipo='metal')
    lente = vidrio(ctx, 'vidrio gafas', '#8FD3F2', 0.5)
    for sx in (-1, 1):
        loc, n = punto_cabeza(ctx, sx * 22, 40, 0.07)
        if loc is None:
            continue
        aro = clay.lathe(ctx.nombre(f'aro gafa {sx}'), [(0.11, 0.0), (0.135, 0.0), (0.135, 0.06), (0.11, 0.06)], ctx.coll, metal, segments=24, cap_bottom=False,
                         cap_top=False)
        apuntar(aro, n)
        aro.location = tuple(loc)
        pieza(ctx, aro)
        cr = clay.lathe(ctx.nombre(f'lente {sx}'), [(0.0, 0.05), (0.115, 0.04), (0.0, 0.045)], ctx.coll, lente, segments=24)
        apuntar(cr, n)
        cr.location = tuple(loc)
        pieza(ctx, cr)
    pts = [hc + np.array(sph(a, 38)) * (radio_cabeza(ctx, a, 38) + 0.07) for a in np.linspace(-170, 170, 18)]
    pieza(ctx, clay.sweep(ctx.nombre('resorte gafas'), pts, 0.03, (1.6, 0.5), ctx.coll, ctx.m('resorte gafas', '#4A3020', tipo='lisa'), segments=6, samples=3,
                          up_fn=lambda q: np.array(q) - hc))


@casco('vikingo')
def vikingo(ctx):
    """Casco vikingo de metal con remaches, cuernos y trenzas de barba (de mentiras)."""
    metal = ctx.m('casco vikingo', '#B9BEC8', tipo='metal')
    oro = ctx.m('franja vikingo', '#D9A93A', tipo='metal')
    copa, R, els, azs = domo(ctx, 'casco vikingo', metal, el_min=16 if ctx.el else 22, margen=0.05, alto_extra=0.08, grosor=0.04)
    hc = ctx.hc
    e0 = els[0]
    ring = [hc + np.array(sph(a, e0)) * (R[0, j] + 0.07) for j, a in enumerate(azs)]
    pieza(ctx, clay.sweep(ctx.nombre('borde vikingo'), ring, 0.05, (1.0, 1.4), ctx.coll, oro, segments=8, samples=3, closed=True, up_fn=lambda q: np.array(q) - hc))
    # Franja de la frente a la nuca y remaches
    pts = [hc + np.array(sph(0 if e <= 90 else 180, e if e <= 90 else 180 - e)) * (radio_cabeza(ctx, 0 if e <= 90 else 180, min(e, 180 - e)) + 0.11)
           for e in np.linspace(e0 + 5, 175 - e0, 12)]
    pieza(ctx, clay.sweep(ctx.nombre('franja casco'), pts, 0.045, (1.6, 0.5), ctx.coll, oro, segments=6, samples=3, up_fn=lambda q: np.array(q) - hc))
    for j in range(0, len(azs), 4):
        p = hc + np.array(sph(azs[j], e0 + 8)) * (R[1, j] + 0.09)
        pieza(ctx, clay.blob(ctx.nombre(f'remache {j}'), tuple(p), (0.03, 0.03, 0.03), ctx.coll, oro, n=4))
    hueso = ctx.m('cuerno', '#F4ECD8', tipo='brillo')
    for sx in (-1, 1):
        loc, n = punto_cabeza(ctx, sx * 90, 45, 0.06)
        if loc is None:
            continue
        pts = [loc, loc + np.array([sx * 0.22, -0.02, 0.08]), loc + np.array([sx * 0.38, -0.04, 0.3]), loc + np.array([sx * 0.4, -0.06, 0.55])]
        pieza(ctx, clay.sweep(ctx.nombre(f'cuerno {sx}'), pts, [0.11, 0.08, 0.05, 0.015], (1, 1), ctx.coll, hueso, segments=12, samples=5, caps=('round', 'point')))
        for k in range(2):
            t = 0.25 + k * 0.25
            c = loc + np.array([sx * 0.22 * t * 3, -0.02, 0.08 * t * 2])
            pieza(ctx, clay.blob(ctx.nombre(f'anillo cuerno {sx}{k}'), tuple(c), (0.06, 0.1, 0.1), ctx.coll, oro, n=5))


@casco('astronauta', oculta=())
def astronauta(ctx):
    """Casco de astronauta: burbuja de vidrio con collar blanco, luces y antena."""
    hc = ctx.hc
    rmax = max(radio_cabeza(ctx, a, e) for a in range(-180, 180, 30) for e in (0, 30, 60, 89))
    R = rmax + 0.1
    c = hc + np.array([0, 0, 0.04])
    burbuja = clay.blob(ctx.nombre('burbuja casco'), tuple(c), (R, R, R), ctx.coll, vidrio(ctx, 'vidrio casco', '#CFEFFF', 0.18), n=14)
    pieza(ctx, burbuja)
    blanco = ctx.m('collar casco', '#F4F6FA', tipo='brillo')
    zc = c[2] - R * 0.82
    rc = R * 0.6
    collar = clay.lathe(ctx.nombre('collar casco'), [(rc - 0.04, -0.06), (rc + 0.06, -0.06), (rc + 0.08, 0.0), (rc + 0.06, 0.06), (rc - 0.04, 0.06)], ctx.coll, blanco,
                        segments=40)
    collar.location = (c[0], c[1], zc)
    pieza(ctx, collar)
    for k in range(6):
        a = 2 * math.pi * k / 6
        pieza(ctx, clay.blob(ctx.nombre(f'perno collar {k}'), (c[0] + (rc + 0.075) * math.cos(a), c[1] + (rc + 0.075) * math.sin(a), zc), (0.025, 0.025, 0.025), ctx.coll,
                             ctx.m('perno', '#9AA0AA', tipo='metal'), n=4))
    for sx in (-1, 1):
        p = c + np.array([sx * R * 0.97, 0.0, -R * 0.2])
        pieza(ctx, clay.blob(ctx.nombre(f'luz casco {sx}'), tuple(p), (0.05, 0.07, 0.05), ctx.coll, blanco, n=5))
        pieza(ctx, clay.blob(ctx.nombre(f'foco casco {sx}'), tuple(p + np.array([0, -0.06, 0])), (0.03, 0.02, 0.03), ctx.coll,
                             ctx.m('foco casco', '#FFE27A', tipo='luz'), n=4))
    top = c + np.array([R * 0.35, 0.05, R * 0.93])
    pieza(ctx, clay.sweep(ctx.nombre('antena casco'), [top, top + np.array([0.08, 0.0, 0.28])], 0.015, (1, 1), ctx.coll, ctx.m('perno', '#9AA0AA', tipo='metal'),
                          segments=6, samples=2))
    pieza(ctx, clay.blob(ctx.nombre('bolita antena casco'), tuple(top + np.array([0.08, 0.0, 0.32])), (0.04, 0.04, 0.04), ctx.coll,
                         ctx.m('luz antena', '#FF5A5A', tipo='luz'), n=5))
    # Reflejo en el vidrio
    pieza(ctx, clay.blob(ctx.nombre('reflejo casco'), tuple(c + np.array([-R * 0.5, -R * 0.8, R * 0.35])), (0.1, 0.02, 0.05), ctx.coll,
                         ctx.m('reflejo', '#FFFFFF', tipo='luz', emission_strength=1.2), n=4))


@casco('galactica', oculta=())
def galactica(ctx):
    """Corona galáctica: un aro de luz flotando con planeticas, un anillito y estrellas."""
    t = tope(ctx)
    c = t + np.array([0, 0.0, 0.06])
    oro = ctx.m('aro galáctico', '#FFD23F', tipo='metal')
    pts = [(c[0] + 0.48 * math.cos(a), c[1] + 0.42 * math.sin(a), c[2] + 0.05 * math.sin(2 * a)) for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)]
    pieza(ctx, clay.sweep(ctx.nombre('aro galáctico'), pts, 0.022, (1, 1), ctx.coll, oro, segments=6, samples=3, closed=True))
    planetas = (('#7FB8FF', 0.08), ('#FF8FB1', 0.06), ('#8FE3C8', 0.07), ('#F7A23A', 0.05))
    for k, (col, r) in enumerate(planetas):
        a = 2 * math.pi * k / 4 + 0.4
        p = (c[0] + 0.48 * math.cos(a), c[1] + 0.42 * math.sin(a), c[2] + 0.05 * math.sin(2 * a) + r * 0.6)
        pieza(ctx, clay.blob(ctx.nombre(f'planeta {k}'), p, (r, r, r), ctx.coll, ctx.m(f'planeta {k}', col, tipo='brillo'), n=7))
        if k == 0:
            anillo = clay.lathe(ctx.nombre('anillito'), [(r * 1.35, -0.006), (r * 1.8, -0.006), (r * 1.8, 0.006), (r * 1.35, 0.006)], ctx.coll,
                                ctx.m('anillito', '#FFE6B0', tipo='brillo'), segments=24)
            anillo.location = p
            anillo.rotation_euler = (0.5, 0.2, 0)
            pieza(ctx, anillo)
    from casa import estrella_plana
    for k in range(5):
        a = 2 * math.pi * k / 5 + 1.1
        p = (c[0] + 0.5 * math.cos(a), c[1] + 0.44 * math.sin(a), c[2] + 0.2 + 0.06 * (k % 2))
        e = estrella_plana(ctx.nombre(f'estrella {k}'), (0, 0, 0), 0.06, ctx.coll, ctx.m('estrella', '#FFF2A8', tipo='luz'), grosor=0.02)
        e.location = p
        pieza(ctx, e)


# ---------------------------------------------------------------------------
# Principal
# ---------------------------------------------------------------------------

def construir(ctx, clave):
    info = CASCOS[clave]
    ctx.clave = f'cohete_{clave}'
    ctx.coll = clay.collection(f'{ctx.N} casco {clave}')
    ctx.m = Mats(ctx.clave, {})
    info['fn'](ctx)
    objs = [o for o in ctx.coll.objects if o.type == 'MESH']
    for o in objs:
        o['hueso'] = 'cabeza'
    return ropa.unir_por_material(objs)


def main(out, roles, claves=None, iconos=True):
    t0 = time.time()
    scene = clay.reset_scene()
    escena.setup_render(scene, 192, 192, 20)
    os.makedirs(os.path.join(out, 'ropa'), exist_ok=True)
    os.makedirs(os.path.join(out, 'iconos'), exist_ok=True)
    for rol in roles:
        ctx = ropa.Ctx(rol)
        print('base lista', rol, round(time.time() - t0, 1), 's', flush=True)
        if iconos:
            ropa.preparar_iconos(scene)
            # Sin casco: la cabeza sola
            ropa.icono(ctx, 'cabeza', os.path.join(out, 'iconos', f'cohete_casco_ninguno_{rol}.png'), [])
        for clave in claves or list(CASCOS):
            try:
                objs = construir(ctx, clave)
                arm = ropa.armadura(ctx)
                ocultas = ropa.partes_ocultas(ctx, 'cabeza', CASCOS[clave]['oculta']) if CASCOS[clave]['oculta'] else []
                if iconos:
                    ropa.icono(ctx, 'cabeza', os.path.join(out, 'iconos', f'cohete_casco_{clave}_{rol}.png'), ocultas)
                ropa.piel(arm, objs, rol)
                ropa.exportar(arm, objs, os.path.join(out, 'ropa', f'cohete_{clave}_{rol}.glb'))
            except Exception as e:  # un casco que falla no detiene los demás
                import traceback
                traceback.print_exc()
                print('FALLA', clave, rol, e, flush=True)
            if ctx.coll is not None:
                ctx.coll.hide_render = ctx.coll.hide_viewport = True
                for o in list(ctx.coll.objects):
                    bpy.data.objects.remove(o, do_unlink=True)
            print('casco', clave, rol, round(time.time() - t0, 1), 's', flush=True)
        # La base del personaje se esconde para armar el del otro rol
        ctx.coll_base.hide_render = ctx.coll_base.hide_viewport = True
    print('LISTO', round(time.time() - t0, 1), 's', flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    sin_iconos = '--sin-iconos' in args
    args = [a for a in args if not a.startswith('--')]
    roles = ['el', 'ella'] if len(args) < 2 or args[1] == 'ambos' else [args[1]]
    main(args[0], roles, args[2].split(',') if len(args) > 2 else None, not sin_iconos)
