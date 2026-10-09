"""Armas y proyectiles de Sangre y Ceniza (armas.glb y proyectiles.glb).

Armas: vacío `arma_<id>` con la pieza `cuerpo` (y `extra_*` si algo cuelga y se mece: la bola del mangual, el
incensario). El ORIGEN está en la empuñadura (donde va la mano); el arma crece hacia +Z y el filo o la cara mira a
+Y. Las de disparo (ballesta, arco) apuntan a +Y. Medidas en metros para un muñeco de ≈1 m (armas de héroe chibi,
grandotas). Algunas traen marcas (vacíos): `punta` (de donde sale el golpe o el disparo) y `llama` (la luz).

Proyectiles: vacío `p_<id>` con la pieza `cuerpo`, centrado en el origen y volando hacia +Y.
"""
import math

import numpy as np

import sangre_comun as sc
import sangre_formas as sf
import sdf
from sangre_comun import P_

ARMAS = {}
PROYECTILES = {}


def arma(id_):
    def deco(fn):
        ARMAS[id_] = fn
        return fn
    return deco


def proyectil(id_):
    def deco(fn):
        PROYECTILES[id_] = fn
        return fn
    return deco


def nueva(id_, voxel=0.004, prefijo='arma', **extras):
    F = sc.Figura(id_, prefijo, voxel=voxel, suelo=False, alcance_ao=0.08)
    F.extras.update(extras)
    F.extras.setdefault('icono_vista', (62, 12))
    return F


# ---------------------------------------------------------------------------
# Materiales
# ---------------------------------------------------------------------------

def acero(s=0):
    return P_('#8C8E93', 'hierro', semilla=s, var=0.6)


def hierro(s=0, color='#55575C'):
    return P_(color, 'hierro', semilla=s)


def oro(s=0):
    return P_('#A57D36', 'oro', semilla=s)


def cuero(s=0, color='#3D2819'):
    return P_(color, 'cuero', semilla=s)


def madera(s=0, color='#5C3F26', eje='z'):
    return P_(color, 'madera', color2='#352214', semilla=s, eje=eje)


def hueso_pt(s=0):
    return P_('#D3C6A2', 'hueso', semilla=s)


def tela(color, s=0):
    return P_(color, 'tela', semilla=s)


def brillo(nombre, color):
    return P_(color, 'brillo', mat=f'brillo_{nombre}')


# ---------------------------------------------------------------------------
# Piezas de armería
# ---------------------------------------------------------------------------

def hoja_rombo(pz, nombre, base, direccion, ancho_eje, largo, ancho, grosor, pt, coll, punta=0.18, estrecha=0.25, muescas=(), curva=0.0,
               n=14, un_filo=False):
    """Hoja de metal con sección de rombo (lomo central y dos filos), punta y muescas [(s, hondo, lado)].
    `curva` dobla la hoja hacia el lado del filo (sables, dagas curvas, guadaña)."""
    import bpy
    base = np.asarray(base, float)
    d = sc_unit(direccion)
    w = np.asarray(ancho_eje, float)
    w = sc_unit(w - (w @ d) * d)
    t = np.cross(d, w)
    verts = []
    S = np.linspace(0, 1, n)
    for s in S:
        ancho_s = ancho * (1 - estrecha * s)
        if s > 1 - punta:
            ancho_s *= max(0.0, (1 - s) / punta) ** 0.8
        wl = wr = ancho_s / 2
        for (sm, hondo, lado) in muescas:
            k = max(0.0, 1 - abs(s - sm) / 0.035)
            if lado > 0:
                wr *= 1 - hondo * k
            else:
                wl *= 1 - hondo * k
        if un_filo:
            wl = min(wl, ancho * 0.12)
        g = grosor * (1 - 0.6 * s) if s < 1 - punta else grosor * 0.4 * max(0.0, (1 - s) / punta)
        c = base + d * largo * s + w * curva * largo * s * s
        verts += [c + w * wr, c + t * g / 2, c - w * wl, c - t * g / 2]
    faces = []
    for i in range(n - 1):
        for k in range(4):
            a, b = i * 4 + k, i * 4 + (k + 1) % 4
            faces.append((a, b, b + 4, a + 4))
    faces.append((3, 2, 1, 0))
    o = sc.clay.make_mesh_object(nombre, [tuple(v) for v in verts], faces, coll)
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    del bpy
    pz.malla(o, pt)
    return o


def sc_unit(v):
    v = np.asarray(v, float)
    return v / max(np.linalg.norm(v), 1e-9)


def empunadura(pz, z0, z1, r, pt_cuero, pt_correa, coll, vueltas=None, x=0.0, y=0.0):
    """Empuñadura forrada en cuero con correa en espiral."""
    a, b = np.array([x, y, z0]), np.array([x, y, z1])
    pz.cono(a, b, r, r * 0.95, pt_cuero, 0.0)
    L = z1 - z0
    vueltas = vueltas or max(3, int(L / 0.03))
    pts = []
    for k in range(vueltas * 8 + 1):
        tt = k / (vueltas * 8)
        ang = tt * 2 * math.pi * vueltas
        pts.append((x + math.cos(ang) * (r + 0.002), y + math.sin(ang) * (r + 0.002), z0 + 0.01 + (L - 0.02) * tt))
    pz.malla(sc.tubo('correa empuñadura', pts, r * 0.22, coll, segmentos=4, muestras=1), pt_correa)


def asta(pz, z0, z1, r0, r1, pt, coll, nudos=2, sem=0, x=0.0, y=0.0, torcer=0.0):
    """Asta de madera con nudos y una leve torcedura."""
    pts = [np.array([x + torcer * math.sin(t * 5 + sem) * (z1 - z0), y + torcer * 0.6 * math.cos(t * 4 + sem) * (z1 - z0), z0 + (z1 - z0) * t])
           for t in np.linspace(0, 1, 6)]
    pz.trazo(pts, list(np.linspace(r0, r1, 6)), pt, 0.0)
    rng = np.random.default_rng(sem)
    for k in range(nudos):
        t = rng.uniform(0.15, 0.85)
        p = pts[0] + (pts[-1] - pts[0]) * t
        a = rng.uniform(0, 2 * math.pi)
        r = r0 + (r1 - r0) * t
        pz.bola(p + np.array([math.cos(a), math.sin(a), 0]) * r * 0.8, (r * 0.45, r * 0.45, r * 0.7), pt, 0.006)
    return pts


def banda(pz, z, r, alto, pt, x=0.0, y=0.0, k=0.0):
    pz.cono((x, y, z - alto / 2), (x, y, z + alto / 2), r, r, pt, k)


def remaches_aro(pz, nombre, z, r, n, rr, pt, coll, x=0.0, y=0.0):
    for i in range(n):
        a = 2 * math.pi * i / n
        p = np.array([x + math.cos(a) * r, y + math.sin(a) * r, z])
        pz.malla(sc.bolita(f'{nombre} {i}', p, rr, coll, n=1, sub=1), pt)


# ---------------------------------------------------------------------------
# ARMAS
# ---------------------------------------------------------------------------

@arma('espada_larga')
def espada_larga(coll):
    F = nueva('espada_larga', clase='monarca')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1400)
    hoja_rombo(c, 'hoja', (0, 0, 0.115), (0, 0, 1), (0, 1, 0), 0.62, 0.068, 0.016, P_('#9A9CA1', 'hierro', semilla=3, var=0.5, sangre=0.2), coll,
               muescas=((0.35, 0.25, 1), (0.55, 0.18, -1)))
    # canal (acanaladura) oscura a cada lado
    for sx in (-1, 1):
        c.malla(sc.tubo(f'canal {sx}', [(sx * 0.0045, 0, 0.13), (sx * 0.004, 0, 0.45)], 0.004, coll, segmentos=4, muestras=1), hierro(2))
    g = sf.union(sdf.stroke([(0, -0.13, 0.12), (0, -0.06, 0.095), (0, 0.0, 0.095), (0, 0.06, 0.095), (0, 0.13, 0.12)], 0.013),
                 sdf.round_box((0, 0, 0.098), (0.016, 0.03, 0.018), 0.01), k=0.01)
    c.sdf(g, (-0.05, -0.17, 0.05), (0.05, 0.17, 0.16), oro(1))
    for s in (-1, 1):
        c.bola((0, s * 0.135, 0.124), 0.018, oro(1), 0.004)
    c.malla(sc.bolita('gema guarda', (0.016, 0, 0.098), (0.008, 0.012, 0.012), coll, n=2), brillo('rojo', '#C0141A'))
    c.malla(sc.bolita('gema guarda 2', (-0.016, 0, 0.098), (0.008, 0.012, 0.012), coll, n=2), brillo('rojo', '#C0141A'))
    empunadura(c, -0.1, 0.085, 0.017, cuero(4), cuero(5, '#24170F'), coll)
    c.sdf(sdf.round_box((0, 0, -0.12), (0.016, 0.032, 0.022), 0.014), (-0.05, -0.06, -0.16), (0.05, 0.06, -0.08), oro(2))
    F.marca('punta', (0, 0, 0.74))
    return F


@arma('horca')
def horca(coll):
    F = nueva('horca', clase='campesino')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    asta(c, -0.38, 0.74, 0.019, 0.017, madera(1), coll, nudos=3, sem=2, torcer=0.01)
    c.cono((0, 0, 0.72), (0, 0, 0.82), 0.024, 0.02, hierro(1), 0.006)
    c.trazo([(0, -0.1, 0.84), (0, -0.05, 0.815), (0, 0, 0.81), (0, 0.05, 0.815), (0, 0.1, 0.84)], 0.012, hierro(2), 0.008)
    for j, y in enumerate((-0.1, 0.0, 0.1)):
        largo = 0.27 if j != 2 else 0.2  # un diente torcido y más corto
        tip_y = y * 1.15 + (0.025 if j == 2 else 0)
        pts = [(0, y, 0.84), (0, y * 1.05, 0.95), (0.005 * j, tip_y, 0.84 + largo)]
        c.trazo(pts, [0.009, 0.008, 0.006], hierro(3 + j), 0.004)
        sf.diente(c, f'punta diente {j}', pts[-1], np.array(pts[-1]) + np.array([0, 0, 0.04]), 0.006, hierro(6), coll)
    # amarre de cuerda en el cuello del hierro
    pts = [(math.cos(a) * 0.024, math.sin(a) * 0.024, 0.66 + a * 0.004) for a in np.linspace(0, 2 * math.pi * 4, 33)]
    c.malla(sc.tubo('amarre', pts, 0.0045, coll, segmentos=4, muestras=1), P_('#8A7450', 'cuero', semilla=4))
    F.marca('punta', (0, 0, 1.12))
    return F


@arma('grillete')
def grillete_arma(coll):
    F = nueva('grillete', clase='prisionero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1500)
    hi = hierro(1)
    # argolla en la muñeca (el eje de la muñeca es Z): el origen queda en su centro
    for z in (-0.02, 0.02):
        c.malla(sf.sc.clay.sweep('aro muñeca', [(math.cos(a) * 0.05, math.sin(a) * 0.05, z) for a in np.linspace(0, 2 * math.pi, 14, endpoint=False)],
                                 0.012, (1, 1), coll, None, segments=6, samples=1, closed=True, subsurf=0), hi)
    sf.remaches(c, 'remache argolla', [(np.array([math.cos(a) * 0.064, math.sin(a) * 0.064, 0.0]), np.array([math.cos(a), math.sin(a), 0]))
                                       for a in np.linspace(0, 2 * math.pi, 5, endpoint=False)], 0.008, hi, coll)
    # cadena de eslabones que sube haciendo una S, y en la punta el grillete roto con su candado
    p = np.array([0.0, 0.06, 0.03])
    pts = [p + np.array([0.02 * math.sin(t * 5), 0.04 * math.sin(t * 3.2), 0.06 + t * 0.42]) for t in np.linspace(0, 1, 9)]
    for k in range(len(pts) - 1):
        a, b = pts[k], pts[k + 1]
        d = sc_unit(b - a)
        lat = sc_unit(np.cross(d, [1, 0, 0]))
        if k % 2:
            lat = sc_unit(np.cross(d, lat))
        L = np.linalg.norm(b - a) * 0.64
        cc = (a + b) / 2
        ring = [cc + d * math.cos(t) * L + lat * math.sin(t) * L * 0.6 for t in np.linspace(0, 2 * math.pi, 10, endpoint=False)]
        c.malla(sf.sc.clay.sweep(f'eslabon {k}', ring, 0.009, (1, 1), coll, None, segments=5, samples=1, closed=True, subsurf=0), hierro(k))
    e = pts[-1] + np.array([0, 0, 0.06])
    arc = [e + np.array([math.cos(a) * 0.055, 0, math.sin(a) * 0.055]) for a in np.linspace(-0.3, math.pi * 1.25, 10)]
    c.trazo(arc, 0.013, hierro(9), 0.004)
    c.caja(e + np.array([0, 0, -0.045]), (0.032, 0.016, 0.03), 0.01, hierro(10), 0.0)
    c.trazo([e + np.array([-0.018, 0, -0.02]), e + np.array([-0.018, 0, 0.0]), e + np.array([0.018, 0, 0.0]), e + np.array([0.018, 0, -0.02])], 0.006,
            hierro(11), 0.003)
    c.malla(sc.bolita('ojo candado', e + np.array([0, 0.017, -0.05]), (0.006, 0.003, 0.01), coll, n=1), P_('#140F0C', 'liso'))
    F.marca('punta', tuple(e))
    return F


@arma('maza')
def maza(coll):
    F = nueva('maza', clase='caballero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1500)
    asta(c, -0.1, 0.4, 0.017, 0.016, hierro(1), coll, nudos=0)
    empunadura(c, -0.09, 0.12, 0.019, cuero(2), cuero(3, '#211510'), coll)
    c.bola((0, 0, -0.115), (0.025, 0.025, 0.02), hierro(4), 0.004)
    c.bola((0, 0, 0.47), (0.05, 0.05, 0.07), hierro(5), 0.01)
    for i in range(7):
        a = 2 * math.pi * i / 7
        u = np.array([math.cos(a), math.sin(a), 0])
        pts = [u * 0.04 + np.array([0, 0, 0.4]), u * 0.085 + np.array([0, 0, 0.45]), u * 0.08 + np.array([0, 0, 0.52]), u * 0.035 + np.array([0, 0, 0.56])]
        R = np.stack([np.cross([0, 0, 1], u), u, [0, 0, 1]], 1)
        cnt = np.array([0, 0, 0.475]) + u * 0.06
        c.sdf(sdf.intersect(sdf.round_box(cnt, (0.006, 0.035, 0.08), 0.003, rot=R), sdf.ellipsoid((0, 0, 0.475), (0.1, 0.1, 0.1))),
              cnt - 0.12, cnt + 0.12, hierro(6 + i), 0.004)
        del pts
    sf.diente(c, 'pincho maza', (0, 0, 0.54), (0, 0, 0.6), 0.016, hierro(14), coll)
    banda(c, 0.39, 0.024, 0.02, oro(1))
    banda(c, 0.13, 0.022, 0.015, oro(1))
    F.marca('punta', (0, 0, 0.55))
    return F


@arma('escudo')
def escudo(coll):
    F = nueva('escudo', clase='caballero', icono_vista=(20, 8))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1700)
    # escudo de lágrima (heater): dos arcos que se juntan en la punta, borde de arriba recto, un poco curvo; mira a +Y
    w, top, bot = 0.2, 0.25, -0.27
    R = (w * w + (top - bot) ** 2) / (2 * w)
    cx = w - R

    def forma2d(P):
        x, z = P[:, 0], P[:, 2]
        d1 = np.sqrt((x - cx) ** 2 + (z - top) ** 2) - R
        d2 = np.sqrt((x + cx) ** 2 + (z - top) ** 2) - R
        return np.maximum(np.maximum(d1, d2), z - top)

    def y_curva(P):
        return 0.06 - 0.09 * (P[:, 0] / w) ** 2

    def escudo_f(P, crecer=0.0, grosor=0.018):
        d2 = forma2d(P) - crecer
        dy = np.abs(P[:, 1] - y_curva(P)) - grosor
        q = np.stack([np.maximum(d2, 0), np.maximum(dy, 0)], 1)
        return np.sqrt((q ** 2).sum(1)) + np.minimum(np.maximum(d2, dy), 0) - 0.004
    lo, hi = (-0.26, -0.08, -0.32), (0.26, 0.14, 0.3)
    c.sdf(escudo_f, lo, hi, P_('#5C1418', 'madera', color2='#3E0D10', eje='z', semilla=2))
    # cheurón de hueso pintado sobre la cara curva (dos franjas que bajan hacia el centro)
    for sx in (-1, 1):
        filas = []
        for t in np.linspace(0, 1, 7):
            x = sx * (0.19 * (1 - t) + 0.0 * t)
            zc = 0.15 * (1 - t) - 0.06 * t
            fila = []
            for dz in (-0.04, 0.04):
                q = np.array([[x, 0.0, zc + dz]])
                fila.append((x, float(y_curva(q)[0]) + 0.027, zc + dz))
            filas.append(fila if sx > 0 else fila[::-1])
        c.malla(sc.lamina(f'cheuron {sx}', filas, coll, 0.004), P_('#CFC3A0', 'hueso', semilla=3 + sx))
    # borde de hierro con remaches
    pts = []
    for t in np.linspace(0, 1, 26, endpoint=False):
        a = t * 2 * math.pi
        dirr = np.array([math.sin(a), 0.0, math.cos(a)])
        P, hit = sdf.trace(lambda Q: forma2d(Q), np.array([[0, 0, 0.0]]) + dirr * 1.0, -dirr, max_dist=2.0)
        if hit[0]:
            q = P[0]
            q[1] = y_curva(q[None])[0]
            pts.append(q)
    if len(pts) > 10:
        c.malla(sf.sc.clay.sweep('borde escudo', pts, 0.016, (1, 1.3), coll, None, segments=6, samples=2, closed=True, subsurf=0), hierro(4))
        sf.remaches(c, 'remache escudo', [(p + np.array([0, 0.02, 0]), np.array([0, 1, 0])) for p in pts[::2]], 0.009, hierro(5), coll)
    c.bola((0, 0.1, 0.07), (0.055, 0.035, 0.055), hierro(6), 0.0)
    sf.diente(c, 'pincho umbo', (0, 0.12, 0.07), (0, 0.17, 0.07), 0.02, hierro(7), coll)
    # manija y correa por detrás (la manija en el origen)
    c.trazo([(-0.07, 0.035, 0.0), (-0.05, -0.0, 0.0), (0.05, -0.0, 0.0), (0.07, 0.035, 0.0)], 0.013, cuero(8), 0.004)
    c.trazo([(0, 0.035, 0.17), (0, 0.005, 0.14), (0, 0.005, 0.06), (0, 0.035, 0.03)], 0.01, cuero(9), 0.004)
    F.marca('punta', (0, 0.17, 0.07))
    return F


@arma('ballesta')
def ballesta(coll):
    F = nueva('ballesta', clase='cazador', icono_vista=(55, 25))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1900)
    md = madera(1, '#4E3420', eje='y')
    # culata a lo largo de +Y; el origen en la empuñadura bajo el gatillo
    c.trazo([(0, -0.2, 0.0), (0, -0.05, 0.035), (0, 0.15, 0.05), (0, 0.38, 0.05)], [0.028, 0.024, 0.02, 0.018], md, 0.0)
    c.caja((0, 0.16, 0.06), (0.018, 0.22, 0.012), 0.008, md, 0.01)
    c.caja((0, -0.17, 0.0), (0.025, 0.07, 0.045), 0.02, md, 0.02)
    # arco de acero atravesado en la punta
    arco = [(-0.27, 0.32, 0.06), (-0.14, 0.38, 0.06), (0, 0.4, 0.06), (0.14, 0.38, 0.06), (0.27, 0.32, 0.06)]
    c.trazo(arco, [0.008, 0.012, 0.016, 0.012, 0.008], acero(2), 0.004)
    c.malla(sc.tubo('cuerda', [arco[0], (0, 0.12, 0.07), arco[-1]], 0.0028, coll, segmentos=3, muestras=1), P_('#C9B88A', 'cuero', semilla=3))
    # estribo
    c.trazo([(-0.04, 0.4, 0.05), (-0.05, 0.47, 0.04), (0, 0.5, 0.035), (0.05, 0.47, 0.04), (0.04, 0.4, 0.05)], 0.007, hierro(4), 0.003)
    # nuez, gatillo y herrajes
    c.bola((0, 0.12, 0.075), (0.016, 0.016, 0.014), hueso_pt(5), 0.004)
    c.trazo([(0, 0.06, 0.04), (0, 0.04, -0.02), (0, 0.0, -0.06)], 0.007, hierro(6), 0.002)
    for y in (-0.08, 0.05, 0.26):
        banda_y = sdf.round_box((0, y, 0.045), (0.03, 0.01, 0.03), 0.006)
        c.sdf(banda_y, (-0.05, y - 0.03, 0.0), (0.05, y + 0.03, 0.09), hierro(7), 0.0)
    # virote cargado
    c.malla(sc.tubo('virote cargado', [(0, 0.12, 0.08), (0, 0.38, 0.08)], 0.0055, coll, segmentos=4, muestras=1), md)
    sf.diente(c, 'punta virote', (0, 0.38, 0.08), (0, 0.43, 0.08), 0.011, acero(8), coll)
    for q in (-1, 1):
        c.malla(sf.pluma(f'pluma virote {q}', (0, 0.13, 0.08), (0, 0.18, 0.08), 0.025, coll, normal=(q, 0, 0.4)), tela('#6E1A16', 9))
    F.marca('punta', (0, 0.44, 0.08))
    return F


@arma('martillo')
def martillo(coll):
    F = nueva('martillo', clase='herrero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1400)
    asta(c, -0.1, 0.48, 0.017, 0.019, madera(2), coll, nudos=1, sem=4)
    empunadura(c, -0.08, 0.1, 0.02, cuero(3), cuero(4, '#211510'), coll, vueltas=5)
    cab = sf.union(sdf.round_box((0, 0.02, 0.52), (0.045, 0.1, 0.048), 0.012), sdf.round_cone((0, 0.12, 0.52), (0, 0.15, 0.52), 0.052, 0.054), k=0.01)
    cab = sf.union(cab, sdf.round_cone((0, -0.07, 0.52), (0, -0.13, 0.525), 0.035, 0.012), k=0.012)
    c.sdf(cab, (-0.1, -0.2, 0.42), (0.1, 0.22, 0.62), P_('#4A4C51', 'hierro', semilla=5, var=1.2), 0.0)
    for y in (0.07, -0.02):
        c.sdf(sdf.round_box((0, y, 0.52), (0.05, 0.008, 0.053), 0.004), (-0.1, y - 0.03, 0.45), (0.1, y + 0.03, 0.6), oro(6), 0.0)
    banda(c, 0.47, 0.023, 0.02, hierro(7))
    sf.remaches(c, 'cuña', [(np.array([0.0, 0.025, 0.572]), np.array([0, 0, 1])), (np.array([0.0, -0.01, 0.572]), np.array([0, 0, 1]))], 0.008, hierro(8), coll)
    F.marca('punta', (0, 0.16, 0.52))
    return F


@arma('frasco')
def frasco(coll):
    F = nueva('frasco', clase='alquimista', icono_vista=(30, 10))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1200)
    vidrio = P_('#6FA88A', 'vidrio', mat='espectro')
    c.sdf(sf.union(sdf.ellipsoid((0, 0, 0.0), (0.065, 0.065, 0.06)), sdf.round_cone((0, 0, 0.04), (0, 0, 0.12), 0.024, 0.018), k=0.02),
          (-0.09, -0.09, -0.08), (0.09, 0.09, 0.15), vidrio)
    c.sdf(sf.restar(sdf.ellipsoid((0, 0, -0.005), (0.055, 0.055, 0.05)), sdf.plane((0, 0, 0.012), (0, 0, -1))), (-0.08, -0.08, -0.07), (0.08, 0.08, 0.03),
          brillo('verde', '#7CFF4A'))
    c.cono((0, 0, 0.118), (0, 0, 0.15), 0.02, 0.023, madera(3, '#8A6A44'), 0.0)
    c.sdf(sc.sdf_ruido(sdf.round_cone((0, 0, 0.142), (0, 0, 0.158), 0.022, 0.02), 0.002, 60, 1), (-0.05, -0.05, 0.12), (0.05, 0.05, 0.18),
          P_('#7A1016', 'cera', semilla=4))
    for k in range(3):
        a = k * 2.1
        c.trazo([(math.cos(a) * 0.022, math.sin(a) * 0.022, 0.145), (math.cos(a) * 0.022, math.sin(a) * 0.022, 0.125 - 0.008 * k)], [0.004, 0.003],
                P_('#7A1016', 'cera', semilla=5), 0.003)
    c.malla(sf.sc.clay.sweep('cordel', [(math.cos(a) * 0.024, math.sin(a) * 0.024, 0.09) for a in np.linspace(0, 2 * math.pi, 10, endpoint=False)], 0.004,
                             (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), cuero(6, '#8A7450'))
    c.malla(sf.tira('etiqueta', [(0.0, -0.07, 0.03), (0.03, -0.066, 0.0), (0.04, -0.06, -0.03)], 0.04, coll, normal=(0, -1, 0.1), grosor=0.003, punta=False),
            P_('#BFAE86', 'tela', semilla=7))
    F.marca('punta', (0, 0, 0))
    return F


@arma('pala')
def pala(coll):
    F = nueva('pala', clase='sepulturero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    asta(c, -0.36, 0.62, 0.018, 0.019, madera(4), coll, nudos=2, sem=6)
    c.trazo([(0, -0.08, -0.48), (0, -0.07, -0.37), (0, 0.07, -0.37), (0, 0.08, -0.48), (0, 0, -0.5), (0, -0.08, -0.48)], 0.012, madera(5, '#4A3220'), 0.006)
    c.cono((0, 0, 0.58), (0, 0, 0.7), 0.024, 0.03, hierro(1), 0.004)
    hoja = sdf.round_box((0, 0, 0.83), (0.012, 0.115, 0.13), 0.01)
    hoja = sf.union(sdf.intersect(hoja, sdf.round_cone((0, 0, 0.7), (0, 0, 0.98), 0.12, 0.08)), sdf.round_box((0, 0, 0.83), (0.01, 0.11, 0.1), 0.008),
                    k=0.01)
    hoja = sf.agujero(hoja, (0.0, 0.08, 0.95), (0.03, 0.03, 0.02), amp=0.006, sem=4)
    c.sdf(hoja, (-0.05, -0.16, 0.66), (0.05, 0.16, 1.0), P_('#5A5C61', 'hierro', semilla=6, barro=0.0, sangre=0.0, polvo=0.6))
    c.sdf(sc.sdf_ruido(sdf.ellipsoid((0.004, 0, 0.9), (0.014, 0.08, 0.06)), 0.006, 40, 2), (-0.04, -0.12, 0.8), (0.04, 0.12, 1.0),
          P_('#3A2A1C', 'piedra', semilla=7), 0.004)
    remaches_aro(c, 'remache cubo', 0.66, 0.028, 3, 0.006, hierro(8), coll)
    F.marca('punta', (0, 0, 0.98))
    return F


@arma('incensario')
def incensario(coll):
    F = nueva('incensario', clase='inquisidor')
    c = F.pieza('cuerpo', (0, 0, 0), tris=300)
    c.malla(sf.sc.clay.sweep('aro mano', [(math.cos(a) * 0.03, 0, math.sin(a) * 0.03 + 0.03) for a in np.linspace(0, 2 * math.pi, 12, endpoint=False)], 0.008,
                             (1, 1), coll, None, segments=5, samples=1, closed=True, subsurf=0), oro(1))
    c.bola((0, 0, 0.0), 0.014, oro(2), 0.0)
    # el incensario cuelga del aro con tres cadenas: pieza aparte para mecerlo
    e = F.pieza('extra_incensario', (0, 0, -0.01), tris=1700)
    base = np.array([0, 0, -0.42])
    for k in range(3):
        a = 2 * math.pi * k / 3
        tope = np.array([math.cos(a) * 0.06, math.sin(a) * 0.06, -0.38])
        pts = [np.array([0, 0, -0.01]) + (tope - np.array([0, 0, -0.01])) * t for t in np.linspace(0, 1, 9)]
        for j, p in enumerate(pts[:-1]):
            e.malla(sc.bolita(f'cadena {k} {j}', p, (0.008, 0.008, 0.016), coll, n=1, sub=1), oro(3 + j % 2))
    cuerpo_f = sf.union(sdf.ellipsoid(base, (0.085, 0.085, 0.07)), sdf.round_cone(base + np.array([0, 0, -0.07]), base + np.array([0, 0, -0.1]), 0.03, 0.045),
                        k=0.02)
    for k in range(8):
        a = 2 * math.pi * k / 8
        cuerpo_f = sf.restar(cuerpo_f, sdf.ellipsoid(base + np.array([math.cos(a) * 0.085, math.sin(a) * 0.085, 0.015]), (0.014, 0.014, 0.022)))
    e.sdf(cuerpo_f, base - 0.15, base + 0.15, oro(5))
    e.bola(base + np.array([0, 0, 0.0]), 0.07, brillo('fuego', '#FF6A1A'), 0.0)
    e.sdf(sdf.ellipsoid(base + np.array([0, 0, 0.055]), (0.075, 0.075, 0.03)), base - 0.15, base + 0.15, oro(6), 0.01)
    e.trazo([base + np.array([0, 0, 0.08]), base + np.array([0, 0, 0.15])], 0.008, oro(7), 0.0)
    e.trazo([base + np.array([-0.03, 0, 0.13]), base + np.array([0.03, 0, 0.13])], 0.007, oro(7), 0.0)
    F.marca('llama', tuple(base))
    F.marca('punta', tuple(base))
    return F


@arma('hacha_verdugo')
def hacha_verdugo(coll):
    F = nueva('hacha_verdugo', clase='verdugo')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1600)
    asta(c, -0.35, 0.78, 0.02, 0.022, madera(6, '#3E2A1A'), coll, nudos=2, sem=8)
    empunadura(c, -0.3, -0.1, 0.022, cuero(7, '#1E1410'), cuero(8, '#120C09'), coll)
    for z in (0.5, 0.74):
        banda(c, z, 0.026, 0.03, hierro(9))
    # hoja en media luna hacia +Y, con barba
    hoja = sf.restar(sdf.ellipsoid((0, 0.17, 0.66), (0.012, 0.2, 0.24)), sdf.ellipsoid((0, 0.36, 0.66), (0.05, 0.12, 0.3)), 0.0)
    hoja = sf.restar(hoja, sdf.round_box((0, 0.0, 0.66), (0.05, 0.03, 0.4), 0.01))
    hoja = sf.union(hoja, sdf.round_box((0, 0.06, 0.66), (0.016, 0.06, 0.09), 0.01), k=0.03)
    c.sdf(hoja, (-0.05, -0.05, 0.38), (0.05, 0.42, 0.94), P_('#6A6C71', 'hierro', semilla=10, sangre=0.65), 0.0)
    sf.diente(c, 'pincho trasero', (0, -0.02, 0.66), (0, -0.12, 0.67), 0.02, hierro(11), coll)
    sf.remaches(c, 'remache hacha', [(np.array([0.016, 0.05, z]), np.array([1, 0, 0])) for z in (0.62, 0.7)], 0.009, hierro(12), coll)
    F.marca('punta', (0, 0.36, 0.66))
    return F


@arma('baston_cuervos')
def baston_cuervos(coll):
    F = nueva('baston_cuervos', clase='bruja')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1800)
    pts = asta(c, -0.4, 0.82, 0.02, 0.016, madera(9, '#3A2A22'), coll, nudos=4, sem=11, torcer=0.04)
    top = pts[-1]
    # garra de madera que sostiene una gema violeta
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.3
        c.trazo([top, top + np.array([math.cos(a) * 0.04, math.sin(a) * 0.04, 0.04]), top + np.array([math.cos(a) * 0.025, math.sin(a) * 0.025, 0.1])],
                [0.01, 0.008, 0.004], madera(12, '#3A2A22'), 0.006)
    c.bola(top + np.array([0, 0, 0.07]), 0.033, brillo('violeta', '#C46BFF'), 0.0)
    # calavera de cuervo amarrada debajo
    k0 = top + np.array([0.02, 0.0, -0.08])
    c.bola(k0, (0.025, 0.03, 0.025), hueso_pt(13), 0.0)
    c.trazo([k0 + np.array([0, 0.02, 0]), k0 + np.array([0, 0.07, -0.01]), k0 + np.array([0, 0.1, -0.025])], [0.012, 0.007, 0.002], hueso_pt(14), 0.004)
    c.malla(sc.bolita('cuenca', k0 + np.array([0.02, 0.012, 0.006]), 0.007, coll, n=1), P_('#120D0B', 'liso'))
    # plumas negras y amuletos colgando con hilo rojo
    for k in range(5):
        a = 2 * math.pi * k / 5
        b = top + np.array([math.cos(a) * 0.02, math.sin(a) * 0.02, -0.12])
        d = np.array([math.cos(a) * 0.4, math.sin(a) * 0.4, -1])
        c.malla(sf.pluma(f'pluma {k}', b, b + sc_unit(d) * 0.12, 0.03, coll, normal=(math.cos(a), math.sin(a), 0.3)), P_('#18151C', 'pelo', semilla=k))
    c.malla(sf.sc.clay.sweep('hilo rojo', [top + np.array([math.cos(a) * 0.022, math.sin(a) * 0.022, -0.11 + a * 0.003]) for a in np.linspace(0, 12, 25)],
                             0.004, (1, 1), coll, None, segments=4, samples=1, subsurf=0), tela('#7A1210', 15))
    for k in range(2):
        b = top + np.array([0.02 * (1 - 2 * k), 0.0, -0.12])
        e = b + np.array([0.015 * (1 - 2 * k), 0, -0.1])
        c.malla(sc.tubo(f'hilo amuleto {k}', [b, e], 0.0025, coll, segmentos=3, muestras=1), tela('#7A1210', 16))
        c.bola(e, (0.012, 0.008, 0.02), hueso_pt(17 + k), 0.0)
    F.marca('punta', tuple(top + np.array([0, 0, 0.07])))
    return F


@arma('laud')
def laud(coll):
    F = nueva('laud', clase='juglar', icono_vista=(25, 15))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1500)
    md = madera(1, '#7A4E2C', eje='y')
    caja = sdf.intersect(sdf.ellipsoid((0, 0.0, -0.12), (0.15, 0.12, 0.2)), sdf.plane((0, 0.0, 0), (0, 1, 0)))
    c.sdf(caja, (-0.2, -0.16, -0.36), (0.2, 0.03, 0.12), md)
    for k in range(5):
        x = (k - 2) * 0.055
        c.malla(sc.tubo(f'costilla caja {k}', [(x * 0.6, -0.002, 0.07), (x, -0.07 * (1 - abs(x) / 0.2), -0.12), (x * 0.6, -0.002, -0.31)], 0.003, coll,
                        segmentos=3, muestras=2), madera(8, '#3A2414', eje='z'))
    c.sdf(sdf.ellipsoid((0, 0.004, -0.12), (0.149, 0.007, 0.199)), (-0.2, -0.02, -0.36), (0.2, 0.03, 0.12),
          P_('#B48A5A', 'madera', color2='#8A643C', eje='z', semilla=2), 0.0)
    c.malla(sc.bolita('roseta', (0, 0.012, -0.08), (0.045, 0.002, 0.045), coll, n=2), P_('#1A120C', 'liso'))
    c.trazo([(0, -0.01, 0.04), (0, -0.005, 0.3)], [0.025, 0.02], madera(3, '#3A2414', eje='z'), 0.0)
    c.caja((0, -0.015, 0.35), (0.026, 0.012, 0.06), 0.006, madera(4, '#3A2414', eje='z'), 0.0)
    for k in range(4):
        for s in (-1, 1):
            c.malla(sc.tubo(f'clavija {k} {s}', [(s * 0.02, -0.015, 0.31 + k * 0.022), (s * 0.045, -0.015, 0.31 + k * 0.022)], 0.006, coll, segmentos=4,
                            muestras=1), hueso_pt(5))
    c.caja((0, 0.012, -0.25), (0.05, 0.008, 0.008), 0.003, madera(6, '#2A1A10'), 0.0)
    for k in range(5):
        x = (k - 2) * 0.007
        c.malla(sc.tubo(f'cuerda {k}', [(x, 0.017, -0.25), (x * 0.7, 0.012, 0.0), (x * 0.5, 0.008, 0.3)], 0.0012, coll, segmentos=3, muestras=1),
                P_('#D8CBA6', 'liso'))
    for z in np.linspace(0.06, 0.26, 6):
        c.malla(sc.tubo(f'traste {z:.2f}', [(-0.02, 0.012, z), (0.02, 0.012, z)], 0.0018, coll, segmentos=3, muestras=1), hierro(7))
    F.marca('punta', (0, 0.05, -0.08))
    return F


@arma('guadana')
def guadana(coll):
    F = nueva('guadana', clase='campesino')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1500)
    asta(c, -0.45, 0.85, 0.019, 0.017, madera(5, '#4A3422'), coll, nudos=3, sem=12, torcer=0.025)
    for z in (-0.05, 0.4):
        c.trazo([(0, 0, z), (0.07, 0, z + 0.01), (0.12, 0, z + 0.04)], [0.013, 0.012, 0.011], madera(6, '#4A3422'), 0.006)
    c.cono((0, 0, 0.8), (0, 0, 0.88), 0.022, 0.024, hierro(7), 0.004)
    hoja_rombo(c, 'hoja guadaña', (0, 0.01, 0.86), (0, 1, -0.12), (0, 0, -1), 0.62, 0.13, 0.014,
               P_('#7E8085', 'hierro', semilla=8, sangre=0.3), coll, punta=0.25, estrecha=0.35, curva=0.28, un_filo=True)
    F.marca('punta', (0, 0.5, 0.75))
    return F


@arma('antorcha')
def antorcha(coll):
    F = nueva('antorcha', clase='campesino')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1100)
    asta(c, -0.15, 0.3, 0.017, 0.022, madera(2, '#4A3220'), coll, nudos=1, sem=14)
    c.sdf(sc.sdf_ruido(sdf.round_cone((0, 0, 0.27), (0, 0, 0.37), 0.032, 0.036), 0.006, 50, 3), (-0.07, -0.07, 0.2), (0.07, 0.07, 0.42),
          P_('#4A3A2A', 'tela', semilla=4))
    for k in range(4):
        a = 2 * math.pi * k / 4
        c.trazo([(math.cos(a) * 0.024, math.sin(a) * 0.024, 0.25), (math.cos(a) * 0.045, math.sin(a) * 0.045, 0.33), (math.cos(a) * 0.04, math.sin(a) * 0.04,
                                                                                                                       0.4)], 0.005, hierro(5), 0.002)
    banda(c, 0.26, 0.026, 0.012, hierro(6))
    banda(c, 0.385, 0.043, 0.008, hierro(6))
    # llama: tres lenguas emisivas
    for k, (dx, dy, h, r) in enumerate(((0, 0, 0.2, 0.04), (0.02, 0.01, 0.13, 0.025), (-0.018, -0.012, 0.11, 0.024))):
        b = np.array([dx, dy, 0.36])
        c.trazo([b, b + np.array([dx * 0.5, dy * 0.5, h * 0.5]), b + np.array([dx * 1.5 + 0.01, dy, h])], [r, r * 0.75, 0.003],
                brillo('fuego', '#FF6A1A') if k == 0 else brillo('ambar', '#FFAA33'), 0.0)
    F.marca('llama', (0, 0, 0.45))
    F.marca('punta', (0, 0, 0.5))
    return F


@arma('estaca')
def estaca(coll):
    F = nueva('estaca', clase='cazador')
    c = F.pieza('cuerpo', (0, 0, 0), tris=700)
    c.trazo([(0, 0, -0.08), (0, 0, 0.12), (0, 0, 0.22)], [0.022, 0.02, 0.016], madera(3, '#7A5A38'), 0.0)
    c.cono((0, 0, 0.21), (0, 0, 0.32), 0.017, 0.002, madera(4, '#9A7A50'), 0.006)
    c.sdf(sc.sdf_ruido(sdf.round_cone((0, 0, -0.1), (0, 0, -0.075), 0.026, 0.024), 0.004, 60, 2), (-0.05, -0.05, -0.14), (0.05, 0.05, -0.05),
          madera(5, '#5A3E26'), 0.004)
    banda(c, 0.0, 0.025, 0.02, P_('#B8BCC4', 'hierro', semilla=6, var=0.4))
    sf.remaches(c, 'remache estaca', [(np.array([0.025, 0, 0.0]), np.array([1, 0, 0])), (np.array([-0.025, 0, 0.0]), np.array([-1, 0, 0]))], 0.006,
                hierro(7), coll)
    F.marca('punta', (0, 0, 0.32))
    return F


@arma('lanza')
def lanza(coll):
    F = nueva('lanza', clase='caballero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1200)
    asta(c, -0.55, 0.95, 0.017, 0.015, madera(7, '#5A4028'), coll, nudos=2, sem=15)
    c.cono((0, 0, 0.93), (0, 0, 1.02), 0.02, 0.016, hierro(8), 0.004)
    hoja_rombo(c, 'hoja lanza', (0, 0, 1.0), (0, 0, 1), (0, 1, 0), 0.24, 0.07, 0.018, acero(9), coll, punta=0.45, estrecha=-0.3)
    sf.diente(c, 'regatón', (0, 0, -0.55), (0, 0, -0.62), 0.016, hierro(10), coll)
    for k in range(5):
        a = 2 * math.pi * k / 5
        b = np.array([0, 0, 0.92])
        c.malla(sf.tira(f'borla {k}', [b, b + np.array([math.cos(a) * 0.03, math.sin(a) * 0.03, -0.06]), b + np.array([math.cos(a) * 0.045, math.sin(a) * 0.045,
                                                                                                                             -0.13])], 0.025, coll,
                        normal=(math.cos(a), math.sin(a), 0), grosor=0.004), tela('#6E1414', k))
    F.marca('punta', (0, 0, 1.24))
    return F


@arma('mangual')
def mangual(coll):
    F = nueva('mangual', clase='caballero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=700)
    asta(c, -0.1, 0.28, 0.018, 0.019, madera(8, '#3E2A1A'), coll, nudos=0)
    empunadura(c, -0.09, 0.1, 0.02, cuero(9), cuero(10, '#211510'), coll)
    banda(c, 0.27, 0.023, 0.03, hierro(11))
    c.bola((0, 0, 0.3), 0.012, hierro(12), 0.0)
    # cadena y bola con púas: pieza aparte que se mece desde la punta del mango
    e = F.pieza('extra_bola', (0, 0, 0.3), tris=1300)
    pts = [np.array([0, 0.03 * math.sin(t * 2), 0.31 + t * 0.2]) for t in np.linspace(0, 1, 5)]
    for k in range(len(pts) - 1):
        a, b = pts[k], pts[k + 1]
        d = sc_unit(b - a)
        lat = sc_unit(np.cross(d, [1, 0, 0])) if k % 2 else np.array([1.0, 0, 0])
        L = np.linalg.norm(b - a) * 0.64
        cc = (a + b) / 2
        ring = [cc + d * math.cos(t) * L + lat * math.sin(t) * L * 0.6 for t in np.linspace(0, 2 * math.pi, 10, endpoint=False)]
        e.malla(sf.sc.clay.sweep(f'eslabon {k}', ring, 0.008, (1, 1), coll, None, segments=5, samples=1, closed=True, subsurf=0), hierro(k))
    bc = pts[-1] + np.array([0, 0, 0.065])
    e.bola(bc, 0.06, hierro(13), 0.0)
    for k in range(14):
        z = 1 - 2 * (k + 0.5) / 14
        r = math.sqrt(1 - z * z)
        a = k * 2.39996
        d = np.array([math.cos(a) * r, math.sin(a) * r, z])
        sf.diente(e, f'pua {k}', bc + d * 0.05, bc + d * 0.1, 0.014, hierro(14 + k % 3), coll)
    F.marca('punta', tuple(bc))
    return F


@arma('daga')
def daga(coll):
    F = nueva('daga', clase='verdugo')
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    hoja_rombo(c, 'hoja daga', (0, 0, 0.06), (0, 0, 1), (0, 1, 0), 0.22, 0.04, 0.012, acero(1), coll, punta=0.3, estrecha=0.2, curva=0.12)
    c.trazo([(0, -0.05, 0.07), (0, 0, 0.055), (0, 0.05, 0.075)], [0.009, 0.011, 0.009], oro(2), 0.004)
    c.trazo([(0, 0, -0.06), (0, 0.0, 0.05)], [0.013, 0.012], hueso_pt(3), 0.0)
    for z in (-0.03, 0.0, 0.03):
        banda(c, z, 0.0135, 0.006, oro(4))
    c.bola((0, 0, -0.07), 0.018, oro(5), 0.0)
    c.malla(sc.bolita('gema pomo', (0, 0.015, -0.07), 0.008, coll, n=2), brillo('rojo', '#C0141A'))
    F.marca('punta', (0, 0.03, 0.28))
    return F


@arma('arco')
def arco(coll):
    F = nueva('arco', clase='cazador', icono_vista=(70, 8))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1000)
    pts = [(0, -0.06, 0.5), (0, 0.0, 0.35), (0, 0.03, 0.15), (0, 0.035, 0.0), (0, 0.03, -0.15), (0, 0.0, -0.35), (0, -0.06, -0.5)]
    c.trazo(pts, [0.006, 0.011, 0.015, 0.018, 0.015, 0.011, 0.006], madera(1, '#4E3420', eje='z'), 0.0)
    c.cono((0, 0.035, -0.06), (0, 0.035, 0.06), 0.021, 0.021, cuero(2), 0.0)
    for z in (0.5, -0.5):
        c.cono((0, -0.06, z * 0.97), (0, -0.065, z * 1.02), 0.008, 0.005, hueso_pt(3), 0.0)
    c.malla(sc.tubo('cuerda arco', [(0, -0.062, 0.49), (0, -0.07, 0.0), (0, -0.062, -0.49)], 0.0025, coll, segmentos=3, muestras=1),
            P_('#C9B88A', 'cuero', semilla=4))
    for k in range(3):
        a = k * 2.1
        c.malla(sc.tubo(f'amarre arco {k}', [(math.cos(a) * 0.02, 0.035 + math.sin(a) * 0.02, 0.07 + k * 0.005), (math.cos(a + 2) * 0.02,
                                                                                                                   0.035 + math.sin(a + 2) * 0.02,
                                                                                                                   0.075 + k * 0.005)],
                        0.003, coll, segmentos=3, muestras=1), cuero(5, '#1E140E'))
    F.marca('punta', (0, 0.05, 0.0))
    return F


# --- extras del arsenal --------------------------------------------------------

@arma('cetro')
def cetro(coll):
    F = nueva('cetro', clase='monarca')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    c.trazo([(0, 0, -0.12), (0, 0, 0.42)], [0.014, 0.012], oro(1), 0.0)
    for z in (-0.1, 0.1, 0.25, 0.4):
        c.bola((0, 0, z), (0.02, 0.02, 0.012), oro(2), 0.006)
    c.bola((0, 0, 0.47), 0.045, oro(3), 0.0)
    for k in range(4):
        a = 2 * math.pi * k / 4
        c.trazo([(math.cos(a) * 0.035, math.sin(a) * 0.035, 0.46), (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.52), (math.cos(a) * 0.02, math.sin(a) * 0.02,
                                                                                                                     0.57)], 0.007, oro(4), 0.004)
    c.bola((0, 0, 0.53), 0.025, brillo('rojo', '#C0141A'), 0.0)
    c.trazo([(0, 0, 0.58), (0, 0, 0.66)], 0.008, oro(5), 0.0)
    c.trazo([(-0.03, 0, 0.63), (0.03, 0, 0.63)], 0.007, oro(5), 0.0)
    F.marca('punta', (0, 0, 0.55))
    return F


@arma('hoz')
def hoz(coll):
    F = nueva('hoz', clase='campesino')
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    c.trazo([(0, 0, -0.08), (0, 0, 0.1)], [0.017, 0.019], madera(1, '#5C3F26'), 0.0)
    banda(c, 0.1, 0.02, 0.015, hierro(2))
    hoja_rombo(c, 'hoja hoz', (0, 0, 0.11), (0, 0.6, 1), (0, 1, -0.6), 0.36, 0.05, 0.01, P_('#8A8C90', 'hierro', semilla=3, sangre=0.25), coll, punta=0.3,
               estrecha=0.3, curva=0.8, un_filo=True)
    F.marca('punta', (0, 0.25, 0.3))
    return F


@arma('pico')
def pico(coll):
    F = nueva('pico', clase='campesino')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1000)
    asta(c, -0.15, 0.58, 0.018, 0.02, madera(1, '#4E3420'), coll, nudos=1, sem=3)
    c.trazo([(0, -0.24, 0.53), (0, -0.12, 0.6), (0, 0.0, 0.62), (0, 0.12, 0.6), (0, 0.26, 0.52)], [0.008, 0.02, 0.026, 0.02, 0.006],
            P_('#4E5055', 'hierro', semilla=4, polvo=0.5), 0.0)
    banda(c, 0.62, 0.03, 0.05, hierro(5))
    F.marca('punta', (0, 0.26, 0.52))
    return F


@arma('bomba')
def bomba(coll):
    F = nueva('bomba', clase='alquimista', icono_vista=(30, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    c.bola((0, 0, 0), 0.07, P_('#2E2C2A', 'hierro', semilla=1), 0.0)
    for a in (0, 1):
        ring = [(math.cos(t) * 0.071, math.sin(t) * 0.071 * (1 - a) , math.sin(t) * 0.071 * a) for t in np.linspace(0, 2 * math.pi, 16, endpoint=False)]
        c.malla(sf.sc.clay.sweep(f'aro bomba {a}', ring, 0.006, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), hierro(2))
    c.cono((0, 0, 0.06), (0, 0, 0.09), 0.022, 0.02, hierro(3), 0.0)
    c.malla(sc.tubo('mecha', [(0, 0, 0.09), (0.01, 0.0, 0.12), (0.03, 0.01, 0.14)], 0.005, coll, segmentos=4, muestras=2), cuero(4, '#8A7450'))
    c.bola((0.032, 0.01, 0.145), 0.012, brillo('fuego', '#FF6A1A'), 0.0)
    F.marca('llama', (0.032, 0.01, 0.145))
    F.marca('punta', (0, 0, 0))
    return F


@arma('carga_minera')
def carga_minera(coll):
    """Tres cartuchos de dinamita amarrados con cuerda, la mecha encendida y una plaquita de hierro con el pico."""
    F = nueva('carga_minera', clase='minero', icono_vista=(25, 22))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1400)
    rojo = P_('#A8281E', 'tela', semilla=6, polvo=0.5)
    for k, (x, y) in enumerate(((-0.024, 0.0), (0.024, 0.0), (0.0, 0.036))):
        c.trazo([(x, y, -0.075), (x, y, 0.075)], [0.023, 0.023], rojo, 0.0)
        # las puntas de papel encerado, más claras
        c.trazo([(x, y, 0.072), (x, y, 0.082)], [0.021, 0.018], P_('#D8C49A', 'tela', semilla=7 + k), 0.0)
        c.trazo([(x, y, -0.082), (x, y, -0.072)], [0.018, 0.021], P_('#D8C49A', 'tela', semilla=9 + k), 0.0)
    for z in (-0.04, 0.035):
        ring = [(math.cos(t) * 0.052, 0.012 + math.sin(t) * 0.046, z) for t in np.linspace(0, 2 * math.pi, 18, endpoint=False)]
        c.malla(sf.sc.clay.sweep(f'cuerda carga {z}', ring, 0.006, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0),
                cuero(5, '#9A8058'))
    # la plaquita de hierro con el pico grabado, amarrada al frente
    c.sdf(sdf.round_box((0, -0.03, -0.005), (0.026, 0.004, 0.022), 0.004), (-0.04, -0.05, -0.04), (0.04, -0.01, 0.03),
          P_('#5A5C62', 'hierro', semilla=8, polvo=0.4))
    c.trazo([(-0.014, -0.036, -0.016), (0.012, -0.036, 0.01)], 0.0035, oro(4), 0.0)
    c.trazo([(0.002, -0.036, 0.016), (0.016, -0.036, 0.008), (0.02, -0.036, -0.004)], [0.003, 0.0045, 0.003], oro(4), 0.0)
    # mecha torcida con la chispa
    c.malla(sc.tubo('mecha carga', [(0.0, 0.036, 0.08), (0.012, 0.03, 0.11), (0.032, 0.02, 0.125), (0.05, 0.02, 0.14)], 0.004, coll,
                    segmentos=4, muestras=3), cuero(4, '#3A2E22'))
    c.bola((0.052, 0.02, 0.142), 0.011, brillo('fuego', '#FF7A1A'), 0.0)
    F.marca('llama', (0.052, 0.02, 0.142))
    F.marca('punta', (0, 0, 0))
    return F


@arma('agua_bendita')
def agua_bendita(coll):
    F = nueva('agua_bendita', clase='cazador', icono_vista=(30, 10))
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    c.sdf(sf.union(sdf.round_box((0, 0, 0.0), (0.04, 0.025, 0.055), 0.02), sdf.round_cone((0, 0, 0.05), (0, 0, 0.1), 0.016, 0.014), k=0.01),
          (-0.07, -0.06, -0.08), (0.07, 0.06, 0.13), P_('#9ABCD0', 'vidrio', mat='espectro'))
    c.sdf(sdf.round_box((0, 0, -0.012), (0.033, 0.019, 0.04), 0.016), (-0.06, -0.05, -0.07), (0.06, 0.05, 0.05), brillo('azul', '#5ED8FF'))
    c.cono((0, 0, 0.095), (0, 0, 0.12), 0.017, 0.019, P_('#B8BCC4', 'hierro', semilla=2, var=0.4), 0.0)
    c.trazo([(0, -0.027, 0.03), (0, -0.027, -0.03)], 0.004, oro(3), 0.0)
    c.trazo([(-0.015, -0.027, 0.012), (0.015, -0.027, 0.012)], 0.004, oro(3), 0.0)
    F.marca('punta', (0, 0, 0))
    return F


@arma('grimorio')
def grimorio(coll):
    F = nueva('grimorio', clase='inquisidor', icono_vista=(25, 30))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1000)
    c.caja((0, 0, 0.0), (0.11, 0.035, 0.14), 0.008, P_('#3A1416', 'cuero', semilla=1), 0.0)
    c.caja((0.006, 0, 0.0), (0.104, 0.03, 0.134), 0.004, P_('#C8B88E', 'tela', semilla=2), 0.0)
    for s in (-1, 1):
        for z in (-1, 1):
            c.caja((s * 0.1, s * 0.0 + 0.0, z * 0.13), (0.018, 0.04, 0.018), 0.006, oro(3), 0.0)
    c.caja((0, -0.038, 0.0), (0.03, 0.006, 0.03), 0.006, oro(4), 0.0)
    c.malla(sc.bolita('ojo grimorio', (0, -0.046, 0.0), (0.012, 0.004, 0.012), coll, n=2), brillo('ambar', '#FFAA33'))
    c.trazo([(0.11, -0.03, 0.02), (0.13, -0.03, 0.02), (0.13, 0.03, 0.02), (0.11, 0.03, 0.02)], 0.006, cuero(5, '#2A1410'), 0.0)
    c.malla(sf.tira('cinta marcador', [(0.02, 0.0, -0.14), (0.025, 0.0, -0.2), (0.03, 0.005, -0.25)], 0.018, coll, normal=(0, 1, 0), grosor=0.003),
            tela('#7A1210', 6))
    F.marca('punta', (0, -0.05, 0))
    return F


@arma('cuchillo_carnicero')
def cuchillo_carnicero(coll):
    F = nueva('cuchillo_carnicero', clase='verdugo')
    c = F.pieza('cuerpo', (0, 0, 0), tris=800)
    c.caja((0, 0.04, 0.2), (0.005, 0.065, 0.13), 0.004, P_('#7D7F84', 'hierro', semilla=1, sangre=0.6), 0.0)
    c.malla(sc.bolita('agujero cuchilla', (0, 0.07, 0.3), (0.007, 0.016, 0.016), coll, n=2), P_('#120D0B', 'liso'))
    c.trazo([(0, 0, -0.06), (0, 0, 0.075)], [0.016, 0.015], madera(2, '#3A2414'), 0.0)
    sf.remaches(c, 'remache mango', [(np.array([0.016, 0, z]), np.array([1, 0, 0])) for z in (-0.03, 0.02)], 0.006, oro(3), coll)
    F.marca('punta', (0, 0.1, 0.25))
    return F


# ---------------------------------------------------------------------------
# PROYECTILES (vuelan hacia +Y, centrados en el origen, muy livianos)
# ---------------------------------------------------------------------------

def nuevo_p(id_, **extras):
    F = sc.Figura(id_, 'p', voxel=0.004, suelo=False, ao=0.6, alcance_ao=0.05)
    F.extras.update(extras)
    F.extras.setdefault('icono_vista', (70, 15))
    return F


@proyectil('virote')
def p_virote(coll):
    F = nuevo_p('virote')
    c = F.pieza('cuerpo', (0, 0, 0), tris=160)
    c.malla(sc.tubo('astil', [(0, -0.12, 0), (0, 0.1, 0)], 0.006, coll, segmentos=5, muestras=1), madera(1, '#5C3F26', eje='y'))
    c.malla(sc.punta('punta', (0, 0.1, 0), (0, 0.16, 0), 0.016, coll, seg=4), acero(2))
    for q in (-1, 1):
        c.malla(sf.pluma(f'pluma {q}', (0, -0.12, 0), (0, -0.06, 0), 0.028, coll, normal=(q, 0, 0.6)), tela('#6E1A16', 3))
    return F


@proyectil('flecha')
def p_flecha(coll):
    F = nuevo_p('flecha')
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.tubo('astil', [(0, -0.2, 0), (0, 0.16, 0)], 0.005, coll, segmentos=5, muestras=1), madera(1, '#7A5A38', eje='y'))
    c.malla(sc.punta('punta', (0, 0.16, 0), (0, 0.22, 0), 0.014, coll, seg=4), hierro(2))
    for k in range(3):
        a = 2 * math.pi * k / 3
        c.malla(sf.pluma(f'pluma {k}', (0, -0.2, 0), (0, -0.12, 0), 0.03, coll, normal=(math.cos(a), 0, math.sin(a))), tela('#2A2420', 3))
    return F


@proyectil('estaca')
def p_estaca(coll):
    F = nuevo_p('estaca')
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.tubo('estaca', [(0, -0.12, 0), (0, 0.06, 0)], 0.016, coll, segmentos=6, muestras=1), madera(1, '#7A5A38', eje='y'))
    c.malla(sc.punta('punta', (0, 0.06, 0), (0, 0.16, 0), 0.016, coll, seg=6), madera(2, '#9A7A50', eje='y'))
    c.malla(sc.tubo('banda', [(0, -0.07, 0), (0, -0.05, 0)], 0.018, coll, segmentos=6, muestras=1), P_('#B8BCC4', 'hierro', var=0.4))
    return F


@proyectil('frasco_roto')
def p_frasco(coll):
    F = nuevo_p('frasco_roto')
    c = F.pieza('cuerpo', (0, 0, 0), tris=420)
    c.malla(sc.bolita('vidrio', (0, 0, 0), 0.05, coll, n=3), P_('#6FA88A', 'vidrio', mat='espectro'))
    c.malla(sc.bolita('liquido', (0, 0, -0.01), (0.04, 0.04, 0.03), coll, n=2), brillo('verde', '#7CFF4A'))
    c.malla(sc.tubo('cuello', [(0, 0, 0.04), (0, 0, 0.08)], 0.015, coll, segmentos=6, muestras=1), P_('#6FA88A', 'vidrio', mat='espectro'))
    c.malla(sc.tubo('corcho', [(0, 0, 0.075), (0, 0, 0.095)], 0.016, coll, segmentos=6, muestras=1), madera(3, '#8A6A44'))
    return F


@proyectil('nota_musical')
def p_nota(coll):
    F = nuevo_p('nota_musical', icono_vista=(0, 0))
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.bolita('cabeza nota', (0, 0, -0.04), (0.035, 0.012, 0.026), coll, n=2), brillo('oro', '#FFD36B'))
    c.malla(sc.tubo('plica', [(0.03, 0, -0.04), (0.03, 0, 0.07)], 0.007, coll, segmentos=4, muestras=1), brillo('oro', '#FFD36B'))
    c.malla(sc.tubo('corchete', [(0.03, 0, 0.07), (0.06, 0, 0.04), (0.065, 0, 0.0)], 0.008, coll, segmentos=4, muestras=2), brillo('oro', '#FFD36B'))
    return F


@proyectil('pluma_cuervo')
def p_pluma(coll):
    F = nuevo_p('pluma_cuervo')
    c = F.pieza('cuerpo', (0, 0, 0), tris=120)
    c.malla(sf.pluma('pluma', (0, -0.1, 0), (0, 0.1, 0), 0.05, coll, normal=(0, 0, 1), grosor=0.005), P_('#1C1A24', 'pelo', color2='#3A2A5A'))
    c.malla(sc.tubo('canon', [(0, -0.12, 0.002), (0, 0.08, 0.002)], 0.003, coll, segmentos=3, muestras=1), brillo('violeta', '#C46BFF'))
    return F


@proyectil('hueso')
def p_hueso(coll):
    F = nuevo_p('hueso')
    c = F.pieza('cuerpo', (0, 0, 0), tris=360)
    c.cono((-0.06, 0, 0), (0.06, 0, 0), 0.012, 0.011, hueso_pt(1), 0.0)
    for x in (-0.065, 0.065):
        for dz in (-0.01, 0.01):
            c.bola((x, 0, dz), 0.015, hueso_pt(2), 0.006)
    return F


@proyectil('bola_fuego')
def p_bola_fuego(coll):
    F = nuevo_p('bola_fuego')
    c = F.pieza('cuerpo', (0, 0, 0), tris=420)
    c.malla(sc.bolita('nucleo', (0, 0, 0), 0.06, coll, n=3), brillo('ambar', '#FFAA33'))
    for k in range(5):
        a = 2 * math.pi * k / 5
        b = np.array([math.cos(a) * 0.04, -0.02, math.sin(a) * 0.04])
        c.malla(sc.punta(f'lengua {k}', b, b + np.array([math.cos(a) * 0.02, -0.12, math.sin(a) * 0.02]), 0.035, coll, seg=5), brillo('fuego', '#FF6A1A'))
    F.marca('llama', (0, 0, 0))
    return F


@proyectil('rayo_sagrado')
def p_rayo(coll):
    F = nuevo_p('rayo_sagrado')
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.tubo('rayo', [(0, -0.3, 0), (0, 0.3, 0)], [0.012, 0.03, 0.012], coll, segmentos=6, muestras=2, tapas=('round', 'round')),
            brillo('blanco', '#FFF4DA'))
    c.malla(sc.tubo('halo', [(0, -0.22, 0), (0, 0.22, 0)], 0.045, coll, segmentos=6, muestras=1), P_('#FFE9A8', 'vidrio', mat='espectro'))
    F.marca('llama', (0, 0, 0))
    return F


@proyectil('cadena_eslabon')
def p_eslabon(coll):
    F = nuevo_p('cadena_eslabon', icono_vista=(30, 30))
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    ring = [(math.sin(t) * 0.035, math.cos(t) * 0.055, 0) for t in np.linspace(0, 2 * math.pi, 12, endpoint=False)]
    c.malla(sf.sc.clay.sweep('eslabon', ring, 0.011, (1, 1), coll, None, segments=6, samples=1, closed=True, subsurf=0), hierro(1))
    return F


# ---------------------------------------------------------------------------
# Armas que el juego pide con su propio nombre (datos/armas.ts → modelo)
# ---------------------------------------------------------------------------

@arma('estandarte')
def estandarte(coll):
    F = nueva('estandarte', clase='monarca')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    asta(c, -0.3, 1.1, 0.018, 0.016, madera(1, '#4A3220'), coll, nudos=1, sem=3)
    c.trazo([(0, -0.02, 1.0), (0, 0.42, 1.0)], 0.014, madera(2, '#4A3220', eje='y'), 0.0)
    c.bola((0, 0, 1.13), 0.03, oro(3), 0.0)
    filas = []
    for i in range(6):
        t = i / 5
        fila = []
        for j in range(6):
            u = j / 5
            z = 1.0 - 0.62 * t - (0.12 * math.sin(u * 9) if t > 0.85 else 0)
            fila.append((0.03 * math.sin(u * 4 + t * 3), 0.02 + 0.4 * u, z))
        filas.append(fila)
    c.malla(sc.lamina('paño', filas, coll, 0.008), tela('#8A1418', 4))
    c.malla(sc.bolita('corona bordada', (0.012, 0.22, 0.75), (0.006, 0.09, 0.07), coll, n=2), oro(5))
    for k in range(5):
        c.malla(sc.punta(f'jiron {k}', (0.02, 0.06 + 0.08 * k, 0.38 - 0.03 * (k % 2)), (0.02, 0.07 + 0.08 * k, 0.28 - 0.04 * (k % 3)), 0.03, coll, seg=3),
                tela('#6A1014', 6))
    F.marca('punta', (0, 0.2, 0.8))
    return F


@arma('honda')
def honda(coll):
    F = nueva('honda', clase='campesino')
    c = F.pieza('cuerpo', (0, 0, 0), tris=600)
    cu = P_('#6A4A2C', 'cuero', semilla=1)
    c.malla(sc.tubo('cuerda a', [(0, 0, 0), (0.03, 0.0, 0.18), (0.06, 0.0, 0.34)], 0.006, coll, segmentos=4, muestras=2), P_('#8A7450', 'cuero'))
    c.malla(sc.tubo('cuerda b', [(0, 0, 0), (-0.03, 0.0, 0.18), (-0.06, 0.0, 0.34)], 0.006, coll, segmentos=4, muestras=2), P_('#8A7450', 'cuero'))
    c.bola((0, 0, 0.38), (0.06, 0.035, 0.045), cu, 0.0)
    c.bola((0, 0.0, 0.39), 0.028, P_('#6A6660', 'piedra', semilla=2), 0.0)
    c.bola((0, 0, -0.01), 0.018, cu, 0.0)
    F.marca('punta', (0, 0, 0.39))
    return F


@arma('bola_hierro')
def bola_hierro(coll):
    F = nueva('bola_hierro', clase='prisionero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=300)
    c.malla(sf.sc.clay.sweep('argolla', [(math.cos(a) * 0.05, math.sin(a) * 0.05, 0.0) for a in np.linspace(0, 2 * math.pi, 12, endpoint=False)], 0.013, (1, 1), coll,
                             None, segments=6, samples=1, closed=True, subsurf=0), hierro(1))
    e = F.pieza('extra_bola', (0, 0, 0.02), tris=1000)
    pts = [np.array([0, 0.0, 0.03 + 0.07 * k]) for k in range(6)]
    for k, p in enumerate(pts):
        e.malla(sc.bolita(f'eslabon {k}', p, (0.016, 0.016 if k % 2 else 0.005, 0.035), coll, n=1, sub=1), hierro(2 + k % 2))
    e.bola((0, 0, 0.52), 0.11, P_('#3A3A40', 'hierro', semilla=4, var=1.2), 0.0)
    e.malla(sc.bolita('argolla bola', (0, 0, 0.42), (0.03, 0.012, 0.03), coll, n=1, sub=1), hierro(5))
    F.marca('punta', (0, 0, 0.52))
    return F


@arma('punos')
def punos(coll):
    F = nueva('punos', clase='prisionero', icono_vista=(35, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    venda = P_('#B8A88A', 'tela', semilla=1, sangre=0.5)
    c.bola((0, 0.02, 0.0), (0.06, 0.075, 0.055), venda, 0.0)
    for k in range(4):
        c.bola(((k - 1.5) * 0.03, 0.07, 0.03), (0.017, 0.03, 0.022), venda, 0.01)
    c.trazo([(-0.05, 0.095, 0.045), (0.05, 0.095, 0.045)], 0.014, hierro(2), 0.0)
    for k in range(4):
        sf.diente(c, f'pincho nudillo {k}', ((k - 1.5) * 0.03, 0.105, 0.05), ((k - 1.5) * 0.03, 0.135, 0.06), 0.009, hierro(3), coll)
    for k in range(4):
        c.malla(sf.sc.clay.sweep(f'vuelta venda {k}', [(math.cos(a) * 0.062, 0.02 + math.sin(a) * 0.075, -0.03 + 0.02 * k) for a in np.linspace(0, 2 * math.pi, 10,
                                                                                                                                         endpoint=False)],
                                 0.006, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), venda)
    F.marca('punta', (0, 0.12, 0.03))
    return F


@arma('lanza_justa')
def lanza_justa(coll):
    F = nueva('lanza_justa', clase='caballero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1200)
    c.trazo([(0, 0, -0.25), (0, 0, 0.1), (0, 0, 1.3)], [0.03, 0.045, 0.012], P_('#C8B890', 'madera', color2='#8A1418', eje='z'), 0.0)
    for k in range(5):
        z = 0.2 + 0.2 * k
        c.malla(sc.tubo(f'espiral {k}', [(0.03 - 0.004 * k, 0, z), (0, 0.03 - 0.004 * k, z + 0.05), (-0.03 + 0.004 * k, 0, z + 0.1)], 0.008, coll, segmentos=4,
                        muestras=1), tela('#7A1014', 2))
    c.malla(sc.torno('arandela', [(0.0, 0.0), (0.14, 0.03), (0.15, 0.06), (0.04, 0.1), (0.0, 0.1)], coll, segmentos=16, centro=(0, 0, 0.02)), hierro(3, '#8A8C92'))
    c.malla(sc.punta('punta lanza', (0, 0, 1.28), (0, 0, 1.38), 0.02, coll, seg=5), hierro(4))
    F.marca('punta', (0, 0, 1.38))
    return F


@arma('trabuco')
def trabuco(coll):
    F = nueva('trabuco', clase='cazador', icono_vista=(60, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1300)
    md = madera(1, '#4E3420', eje='y')
    c.trazo([(0, -0.18, -0.04), (0, -0.05, 0.0), (0, 0.05, 0.03)], [0.035, 0.028, 0.025], md, 0.0)
    c.caja((0, 0.15, 0.04), (0.022, 0.12, 0.02), 0.01, md, 0.0)
    c.malla(sc.torno('cañon', [(0.0, 0.0), (0.022, 0.0), (0.02, 0.2), (0.03, 0.34), (0.05, 0.4), (0.04, 0.41), (0.0, 0.38)], coll, segmentos=14,
                     centro=(0, 0.02, 0.07), eje=(0, 1, 0)), P_('#8A6A3A', 'oro', semilla=2))
    for y in (0.08, 0.2):
        c.malla(sc.tubo(f'abrazadera {y}', [(-0.03, y, 0.05), (0.0, y, 0.1), (0.03, y, 0.05)], 0.007, coll, segmentos=4, muestras=1), hierro(3))
    c.trazo([(0, -0.02, 0.06), (0, 0.0, 0.1), (0, 0.02, 0.09)], 0.008, hierro(4), 0.0)
    c.trazo([(0, -0.02, 0.0), (0, 0.0, -0.04)], 0.006, hierro(5), 0.0)
    F.marca('punta', (0, 0.44, 0.07))
    return F


@arma('linterna')
def linterna(coll):
    F = nueva('linterna', clase='sepulturero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1100)
    hi = hierro(1, '#3E3E44')
    c.trazo([(0, 0, 0.0), (0, 0, 0.06), (0.0, 0.0, 0.06)], 0.008, hi, 0.0)
    c.malla(sf.sc.clay.sweep('asa', [(math.cos(a) * 0.04, 0, -math.sin(a) * 0.04 - 0.05) for a in np.linspace(0, math.pi, 8)], 0.007, (1, 1), coll, None, segments=4,
                             samples=1, subsurf=0), hi)
    b = np.array([0, 0, -0.22])
    c.cono(b + np.array([0, 0, 0.1]), b + np.array([0, 0, 0.13]), 0.065, 0.03, hi, 0.0)
    c.cono(b + np.array([0, 0, -0.11]), b + np.array([0, 0, -0.09]), 0.065, 0.065, hi, 0.0)
    for k in range(6):
        a = 2 * math.pi * k / 6
        c.trazo([b + np.array([math.cos(a) * 0.06, math.sin(a) * 0.06, -0.09]), b + np.array([math.cos(a) * 0.06, math.sin(a) * 0.06, 0.1])], 0.006, hi, 0.0)
    c.cono(b + np.array([0, 0, -0.09]), b + np.array([0, 0, 0.1]), 0.055, 0.055, P_('#5ED8FF', 'vidrio', mat='espectro'), 0.0)
    c.bola(b, (0.035, 0.035, 0.05), brillo('azul', '#5ED8FF'), 0.0)
    F.marca('llama', tuple(b))
    F.marca('punta', tuple(b))
    return F


@arma('campana_mano')
def campana_mano(coll):
    F = nueva('campana_mano', clase='sepulturero')
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    c.trazo([(0, 0, -0.08), (0, 0, 0.1)], [0.018, 0.016], madera(1, '#3A2414'), 0.0)
    c.malla(sc.torno('campana', [(0.0, 0.32), (0.04, 0.31), (0.07, 0.25), (0.08, 0.16), (0.11, 0.1), (0.115, 0.09), (0.0, 0.12)], coll, segmentos=18,
                     centro=(0, 0, 0.0)), P_('#8A6A3A', 'oro', semilla=2))
    c.bola((0, 0, 0.13), 0.025, hierro(3), 0.0)
    F.marca('punta', (0, 0, 0.2))
    return F


@arma('cruz')
def cruz(coll):
    F = nueva('cruz', clase='inquisidor')
    c = F.pieza('cuerpo', (0, 0, 0), tris=800)
    pl = P_('#C8CCD4', 'hierro', semilla=1, var=0.3)
    c.caja((0, 0, 0.2), (0.016, 0.012, 0.28), 0.008, pl, 0.0)
    c.caja((0, 0, 0.32), (0.14, 0.012, 0.016), 0.008, pl, 0.0)
    for p in ((0, 0, 0.5), (0.15, 0, 0.32), (-0.15, 0, 0.32)):
        c.bola(p, 0.022, pl, 0.004)
    c.malla(sc.bolita('gema cruz', (0, -0.014, 0.32), (0.016, 0.006, 0.016), coll, n=2), brillo('blanco', '#FFF4DA'))
    c.trazo([(0, 0, -0.1), (0, 0, -0.06)], 0.02, cuero(2), 0.0)
    F.marca('punta', (0, 0, 0.5))
    return F


@arma('gancho')
def gancho(coll):
    F = nueva('gancho', clase='verdugo')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1000)
    c.trazo([(0, 0, -0.06), (0, 0, 0.06)], 0.02, madera(1, '#3A2414'), 0.0)
    for k in range(4):
        c.malla(sc.bolita(f'eslabon {k}', (0, 0, 0.09 + 0.05 * k), (0.012, 0.012 if k % 2 else 0.004, 0.026), coll, n=1, sub=1), hierro(2))
    g = [(0, 0, 0.28), (0, 0, 0.42), (0, 0.06, 0.5), (0, 0.12, 0.46), (0, 0.13, 0.38)]
    c.trazo(g, [0.014, 0.014, 0.013, 0.011, 0.008], P_('#6A6C72', 'hierro', semilla=3, sangre=0.6), 0.0)
    sf.diente(c, 'punta gancho', g[-1], np.array(g[-1]) + np.array([0, -0.02, 0.05]), 0.009, hierro(4), coll)
    F.marca('punta', g[-1])
    return F


@arma('soga')
def soga(coll):
    F = nueva('soga', clase='verdugo')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1000)
    sg = P_('#8A7450', 'cuero', semilla=1)
    c.malla(sc.tubo('soga', [(0, 0, -0.05), (0.02, 0, 0.15), (0, 0, 0.3)], 0.014, coll, segmentos=6, muestras=3), sg)
    for k in range(5):
        c.malla(sf.sc.clay.sweep(f'vuelta nudo {k}', [(math.cos(a) * 0.026, math.sin(a) * 0.026, 0.3 + 0.02 * k) for a in np.linspace(0, 2 * math.pi, 9, endpoint=False)],
                                 0.01, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), sg)
    lazo = [(math.sin(a) * 0.11, 0, 0.53 + 0.12 * math.cos(a)) for a in np.linspace(0, 2 * math.pi, 14, endpoint=False)]
    c.malla(sf.sc.clay.sweep('lazo', lazo, 0.014, (1, 1), coll, None, segments=6, samples=2, closed=True, subsurf=0), sg)
    F.marca('punta', (0, 0, 0.53))
    return F


@arma('vudu')
def vudu(coll):
    F = nueva('vudu', clase='bruja', icono_vista=(20, 10))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1100)
    tl = P_('#8A7A5A', 'tela', semilla=1)
    c.bola((0, 0, 0.12), (0.05, 0.035, 0.07), tl, 0.0)
    c.bola((0, 0, 0.23), (0.05, 0.045, 0.05), tl, 0.02)
    for s in (-1, 1):
        c.trazo([(s * 0.04, 0, 0.16), (s * 0.09, 0, 0.12)], 0.016, tl, 0.01)
        c.trazo([(s * 0.025, 0, 0.06), (s * 0.03, 0, -0.01)], 0.018, tl, 0.01)
        c.malla(sc.tubo(f'ojo cruz {s}', [(s * 0.02 - 0.008, 0.045, 0.24), (s * 0.02 + 0.008, 0.045, 0.235)], 0.003, coll, segmentos=3, muestras=1), P_('#1A1210', 'liso'))
    c.malla(sc.tubo('boca cosida', [(-0.02, 0.046, 0.21), (0.02, 0.046, 0.21)], 0.003, coll, segmentos=3, muestras=1), P_('#7A1010', 'liso'))
    for k, (p, d) in enumerate((((0.0, 0.0, 0.14), (0.3, 1, 0.2)), ((0.02, 0.0, 0.25), (-0.5, 0.8, 0.6)), ((-0.03, 0.0, 0.1), (-1, 0.3, 0.1)))):
        d = sc_unit(d)
        p = np.array(p)
        c.malla(sc.tubo(f'alfiler {k}', [p - d * 0.03, p + d * 0.08], 0.003, coll, segmentos=3, muestras=1), hierro(3, '#B8BCC4'))
        c.malla(sc.bolita(f'cabeza alfiler {k}', p + d * 0.085, 0.009, coll, n=1, sub=1), brillo('rojo', '#C0141A'))
    c.trazo([(0, 0, -0.02), (0, 0, -0.1)], 0.01, madera(4), 0.0)
    F.marca('punta', (0, 0, 0.2))
    return F


@arma('flauta')
def flauta(coll):
    F = nueva('flauta', clase='juglar')
    c = F.pieza('cuerpo', (0, 0, 0), tris=700)
    c.cono((0, 0, -0.08), (0, 0, 0.32), 0.016, 0.013, madera(1, '#A88050'), 0.0)
    for z in (-0.06, 0.3):
        banda(c, z, 0.018, 0.012, oro(2))
    for k in range(6):
        c.malla(sc.bolita(f'agujero {k}', (0, 0.015, 0.04 + 0.035 * k), (0.005, 0.003, 0.005), coll, n=1), P_('#1A1210', 'liso'))
    c.malla(sf.tira('cinta flauta', [(0, 0, 0.3), (0.02, -0.01, 0.24), (0.04, -0.01, 0.16)], 0.015, coll, normal=(0, 1, 0), grosor=0.003), tela('#7A1410', 3))
    F.marca('punta', (0, 0, 0.33))
    return F


@arma('tambor')
def tambor(coll):
    F = nueva('tambor', clase='juglar', icono_vista=(30, 25))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1200)
    c.cono((0, 0, -0.08), (0, 0, 0.08), 0.13, 0.13, madera(1, '#7A4A2C'), 0.0)
    for z in (-0.082, 0.082):
        c.malla(sc.torno(f'parche {z}', [(0.0, -0.004), (0.136, -0.004), (0.138, 0.004), (0.0, 0.004)], coll, segmentos=20, centro=(0, 0, z)),
                P_('#D8C8A0', 'cuero', semilla=2))
        c.malla(sf.sc.clay.sweep(f'aro {z}', [(math.cos(a) * 0.137, math.sin(a) * 0.137, z) for a in np.linspace(0, 2 * math.pi, 20, endpoint=False)], 0.01, (1, 1),
                                 coll, None, segments=5, samples=1, closed=True, subsurf=0), madera(4, '#4A2E1A'))
    for k in range(10):
        a = 2 * math.pi * k / 10
        c.malla(sc.tubo(f'cuerda {k}', [(math.cos(a) * 0.135, math.sin(a) * 0.135, -0.075), (math.cos(a + 0.31) * 0.135, math.sin(a + 0.31) * 0.135, 0.075)], 0.004,
                        coll, segmentos=3, muestras=1), P_('#8A1418', 'tela'))
    for s in (-1, 1):
        c.trazo([(s * 0.06, 0.05, 0.1), (s * 0.12, 0.1, 0.25)], 0.008, madera(3, '#6A4A2C'), 0.0)
        c.bola((s * 0.06, 0.05, 0.1), 0.018, P_('#D8C8A0', 'cuero'), 0.0)
    F.marca('punta', (0, 0, 0.1))
    return F


@arma('sierra')
def sierra(coll):
    F = nueva('sierra', clase='comun', icono_vista=(20, 40))
    c = F.pieza('cuerpo', (0, 0, 0), tris=700)
    c.malla(sc.torno('disco', [(0.0, -0.006), (0.14, -0.004), (0.14, 0.004), (0.0, 0.006)], coll, segmentos=24, centro=(0, 0, 0.0)),
            P_('#9A9CA2', 'hierro', semilla=1, sangre=0.3))
    for k in range(16):
        a = 2 * math.pi * k / 16
        c.malla(sc.punta(f'diente {k}', (math.cos(a) * 0.135, math.sin(a) * 0.135, 0), (math.cos(a + 0.18) * 0.17, math.sin(a + 0.18) * 0.17, 0), 0.016, coll, seg=3),
                hierro(2, '#8A8C92'))
    c.malla(sc.bolita('eje', (0, 0, 0), (0.03, 0.03, 0.012), coll, n=2), hierro(3))
    F.marca('punta', (0.17, 0, 0))
    return F


@arma('hacha')
def hacha(coll):
    F = nueva('hacha', clase='comun')
    c = F.pieza('cuerpo', (0, 0, 0), tris=900)
    c.trazo([(0, 0, -0.1), (0, 0, 0.32)], [0.016, 0.015], madera(1, '#5A3E26'), 0.0)
    h = sf.restar(sdf.ellipsoid((0, 0.08, 0.28), (0.01, 0.1, 0.1)), sdf.ellipsoid((0, 0.2, 0.28), (0.05, 0.07, 0.15)), 0.0)
    h = sf.union(h, sdf.round_box((0, 0.02, 0.28), (0.014, 0.03, 0.04), 0.008), k=0.02)
    c.sdf(h, (-0.05, -0.05, 0.15), (0.05, 0.2, 0.42), P_('#7A7C82', 'hierro', semilla=2, sangre=0.3), 0.0)
    empunadura(c, -0.08, 0.06, 0.018, cuero(3), cuero(4, '#1E140E'), coll, vueltas=4)
    F.marca('punta', (0, 0.18, 0.28))
    return F


# alias: comparten la malla con el arma original
ARMAS.update({'baston': 'baston_cuervos', 'libro': 'grimorio'})


# ---------------------------------------------------------------------------
# Proyectiles que pide el juego con su nombre
# ---------------------------------------------------------------------------

@proyectil('alma')
def p_alma(coll):
    F = nuevo_p('alma')
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.bolita('nucleo', (0, 0.02, 0), 0.04, coll, n=2), brillo('azul', '#5ED8FF'))
    c.malla(sc.punta('estela', (0, 0.0, 0), (0, -0.16, 0.01), 0.04, coll, seg=5), P_('#5ED8FF', 'vidrio', mat='espectro'))
    F.marca('llama', (0, 0.02, 0))
    return F


@proyectil('bola_hierro')
def p_bola_hierro(coll):
    F = nuevo_p('bola_hierro')
    c = F.pieza('cuerpo', (0, 0, 0), tris=220)
    c.malla(sc.bolita('bola', (0, 0, 0), 0.07, coll, n=3), P_('#3A3A40', 'hierro', semilla=1, var=1.2))
    for k in range(3):
        c.malla(sc.bolita(f'eslabon {k}', (0, -0.08 - 0.035 * k, 0), (0.008, 0.02, 0.012 if k % 2 else 0.004), coll, n=1, sub=1), hierro(2))
    return F


@proyectil('bola_puas')
def p_bola_puas(coll):
    F = nuevo_p('bola_puas')
    c = F.pieza('cuerpo', (0, 0, 0), tris=320)
    c.malla(sc.bolita('bola', (0, 0, 0), 0.055, coll, n=2), hierro(1, '#3A3A40'))
    for k in range(12):
        z = 1 - 2 * (k + 0.5) / 12
        r = math.sqrt(1 - z * z)
        a = k * 2.39996
        d = np.array([math.cos(a) * r, math.sin(a) * r, z])
        c.malla(sc.punta(f'pua {k}', d * 0.045, d * 0.095, 0.014, coll, seg=4), hierro(2, '#5A5C62'))
    return F


@proyectil('bomba')
def p_bomba(coll):
    F = nuevo_p('bomba')
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.bolita('bomba', (0, 0, 0), 0.055, coll, n=2), P_('#2E2C2A', 'hierro', semilla=1))
    c.malla(sc.tubo('mecha', [(0, 0, 0.05), (0.01, -0.01, 0.08), (0.02, -0.03, 0.09)], 0.005, coll, segmentos=3, muestras=1), cuero(2, '#8A7450'))
    c.malla(sc.bolita('chispa', (0.02, -0.03, 0.095), 0.014, coll, n=1, sub=1), brillo('fuego', '#FF6A1A'))
    F.marca('llama', (0.02, -0.03, 0.095))
    return F


@proyectil('cruz')
def p_cruz(coll):
    F = nuevo_p('cruz', icono_vista=(0, 30))
    c = F.pieza('cuerpo', (0, 0, 0), tris=120)
    pl = P_('#E8E0C8', 'hierro', semilla=1, var=0.2)
    c.malla(sc.clay.blob('palo', (0, 0.0, 0), (0.012, 0.09, 0.008), coll, None, n=1, p=6, subsurf=0), pl)
    c.malla(sc.clay.blob('travesaño', (0, 0.03, 0), (0.06, 0.012, 0.008), coll, None, n=1, p=6, subsurf=0), pl)
    c.malla(sc.bolita('brillo cruz', (0, 0.03, 0.0), 0.016, coll, n=1, sub=1), brillo('blanco', '#FFF4DA'))
    return F


@proyectil('daga')
def p_daga(coll):
    F = nuevo_p('daga')
    c = F.pieza('cuerpo', (0, 0, 0), tris=150)
    c.malla(sc.punta('hoja', (0, -0.01, 0), (0, 0.13, 0), 0.02, coll, seg=4, medio=0.8), acero(1))
    c.malla(sc.clay.blob('guarda', (0, -0.015, 0), (0.035, 0.008, 0.01), coll, None, n=1, p=4, subsurf=0), oro(2))
    c.malla(sc.tubo('mango', [(0, -0.07, 0), (0, -0.02, 0)], 0.009, coll, segmentos=4, muestras=1), cuero(3))
    return F


@proyectil('escudo')
def p_escudo(coll):
    F = nuevo_p('escudo', icono_vista=(0, 60))
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.torno('escudo', [(0.0, 0.015), (0.1, 0.012), (0.13, 0.0), (0.12, -0.01), (0.0, -0.005)], coll, segmentos=14), P_('#5C1418', 'madera', color2='#3E0D10'))
    c.malla(sc.bolita('umbo', (0, 0, 0.015), (0.035, 0.035, 0.02), coll, n=2), hierro(2))
    return F


def _frasco_p(id_, color, nombre_brillo):
    F = nuevo_p(id_)
    c = F.pieza('cuerpo', (0, 0, 0), tris=230)
    c.malla(sc.bolita('vidrio', (0, 0, 0), 0.05, coll_p[0], n=2), P_(color, 'vidrio', mat='espectro'))
    c.malla(sc.bolita('liquido', (0, 0, -0.008), (0.042, 0.042, 0.032), coll_p[0], n=2), brillo(nombre_brillo, color))
    c.malla(sc.tubo('cuello', [(0, 0, 0.04), (0, 0, 0.075)], 0.015, coll_p[0], segmentos=6, muestras=1), P_(color, 'vidrio', mat='espectro'))
    c.malla(sc.tubo('corcho', [(0, 0, 0.07), (0, 0, 0.09)], 0.016, coll_p[0], segmentos=6, muestras=1), madera(3, '#8A6A44'))
    return F


coll_p = [None]


@proyectil('frasco_agua')
def p_frasco_agua(coll):
    coll_p[0] = coll
    return _frasco_p('frasco_agua', '#5ED8FF', 'azul')


@proyectil('frasco_fuego')
def p_frasco_fuego(coll):
    coll_p[0] = coll
    F = _frasco_p('frasco_fuego', '#FF6A1A', 'fuego')
    F.marca('llama', (0, 0, 0.0))
    return F


@proyectil('frasco_hielo')
def p_frasco_hielo(coll):
    coll_p[0] = coll
    return _frasco_p('frasco_hielo', '#BFE4FF', 'blanco')


@proyectil('gancho')
def p_gancho(coll):
    F = nuevo_p('gancho')
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.tubo('gancho', [(0, -0.08, 0), (0, 0.04, 0), (0, 0.09, 0.03), (0, 0.07, 0.07), (0, 0.03, 0.06)], 0.01, coll, segmentos=5, muestras=2,
                    tapas=('flat', 'point')), P_('#6A6C72', 'hierro', semilla=1, sangre=0.5))
    return F


@proyectil('guillotina')
def p_guillotina(coll):
    F = nuevo_p('guillotina', icono_vista=(10, 15))
    c = F.pieza('cuerpo', (0, 0, 0), tris=120)
    c.malla(sf.placa_marco('cuchilla', [(-0.1, 0.0), (0.1, 0.06), (0.1, 0.14), (-0.1, 0.14)], (0, 0, 0), (1, 0, 0), (0, 0, 1), 0.012, coll),
            P_('#9A9CA2', 'hierro', semilla=1, sangre=0.6))
    c.malla(sc.clay.blob('lastre', (0, 0, 0.15), (0.11, 0.015, 0.02), coll, None, n=1, p=6, subsurf=0), hierro(2, '#3A3A40'))
    return F


@proyectil('hacha')
def p_hacha(coll):
    F = nuevo_p('hacha', icono_vista=(10, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=250)
    c.malla(sc.tubo('mango', [(0, -0.08, 0), (0, 0.08, 0)], 0.01, coll, segmentos=4, muestras=1), madera(1, '#5A3E26', eje='y'))
    c.malla(sf.placa_marco('hoja', [(0.0, 0.05), (0.08, 0.02), (0.1, 0.06), (0.09, 0.12), (0.0, 0.09)], (0, 0, 0), (1, 0, 0), (0, 1, 0), 0.01, coll),
            P_('#7A7C82', 'hierro', semilla=2, sangre=0.3))
    return F


@proyectil('pagina')
def p_pagina(coll):
    F = nuevo_p('pagina', icono_vista=(0, 40))
    c = F.pieza('cuerpo', (0, 0, 0), tris=100)
    filas = [[(-0.05 + 0.1 * u, -0.07 + 0.14 * t, 0.01 * math.sin(u * 3 + t * 2)) for u in (0, 0.5, 1)] for t in (0, 0.5, 1)]
    c.malla(sc.lamina('pagina', filas, coll, 0.003), P_('#D8C8A0', 'tela', semilla=1))
    for k in range(4):
        c.malla(sc.tubo(f'renglon {k}', [(-0.035, -0.04 + 0.025 * k, 0.004), (0.035, -0.04 + 0.025 * k, 0.004)], 0.002, coll, segmentos=3, muestras=1),
                brillo('oro', '#FFD36B'))
    return F


@proyectil('pico')
def p_pico(coll):
    F = nuevo_p('pico', icono_vista=(10, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=250)
    c.malla(sc.tubo('mango', [(0, -0.12, 0), (0, 0.06, 0)], 0.011, coll, segmentos=4, muestras=1), madera(1, '#4E3420', eje='y'))
    c.malla(sc.tubo('cabeza', [(-0.12, 0.03, 0), (0, 0.07, 0), (0.12, 0.03, 0)], [0.004, 0.016, 0.004], coll, segmentos=5, muestras=2, tapas=('point', 'point')),
            hierro(2))
    return F


@proyectil('piedra')
def p_piedra(coll):
    F = nuevo_p('piedra')
    c = F.pieza('cuerpo', (0, 0, 0), tris=150)
    c.malla(sc.bolita('piedra', (0, 0, 0), (0.035, 0.03, 0.028), coll, n=2), P_('#6A6660', 'piedra', semilla=1))
    return F


@proyectil('sierra')
def p_sierra(coll):
    F = nuevo_p('sierra', icono_vista=(10, 50))
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    c.malla(sc.torno('disco', [(0.0, -0.004), (0.08, -0.003), (0.08, 0.003), (0.0, 0.004)], coll, segmentos=16), P_('#9A9CA2', 'hierro', semilla=1, sangre=0.3))
    for k in range(10):
        a = 2 * math.pi * k / 10
        c.malla(sc.punta(f'diente {k}', (math.cos(a) * 0.075, math.sin(a) * 0.075, 0), (math.cos(a + 0.25) * 0.1, math.sin(a + 0.25) * 0.1, 0), 0.012, coll, seg=3),
                hierro(2, '#8A8C92'))
    return F


@proyectil('yunque')
def p_yunque(coll):
    F = nuevo_p('yunque', icono_vista=(30, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=300)
    c.malla(sc.clay.blob('cara', (0, 0, 0.04), (0.11, 0.05, 0.025), coll, None, n=2, p=5, subsurf=0), hierro(1, '#3E4046'))
    c.malla(sc.clay.blob('cintura', (0, 0, 0.0), (0.05, 0.04, 0.03), coll, None, n=2, p=4, subsurf=0), hierro(2, '#3E4046'))
    c.malla(sc.clay.blob('pie', (0, 0, -0.04), (0.08, 0.055, 0.02), coll, None, n=2, p=5, subsurf=0), hierro(3, '#3E4046'))
    c.malla(sc.punta('cuerno', (0.1, 0, 0.04), (0.17, 0, 0.045), 0.024, coll, seg=5), hierro(4, '#3E4046'))
    return F


PROYECTILES.update({'rayo': 'rayo_sagrado'})


# ---------------------------------------------------------------------------
# Sangre y Ceniza 2: las trece armas comunes nuevas y sus proyectiles
# ---------------------------------------------------------------------------

def terracota(s=0, color='#9A5A34'):
    return P_(color, 'piedra', semilla=s)


def _abrojo(pz, nombre, centro, tam, pt, coll, giro=0.0):
    """Abrojo: cuatro púas en tetraedro (siempre queda una para arriba)."""
    centro = np.asarray(centro, float)
    dirs = [(0, 0, 1), (0.943, 0, -0.333), (-0.471, 0.816, -0.333), (-0.471, -0.816, -0.333)]
    cg, sg = math.cos(giro), math.sin(giro)
    for k, d in enumerate(dirs):
        d = np.array([d[0] * cg - d[1] * sg, d[0] * sg + d[1] * cg, d[2]])
        pz.malla(sc.punta(f'{nombre} {k}', centro - d * tam * 0.15, centro + d * tam, tam * 0.22, coll, seg=4), pt)
    pz.bola(centro, tam * 0.2, pt, 0.0)


def _cuervo(pz, nombre, centro, esc, coll, alas=0.0, sem=0):
    """Un cuervo gordito (mira a +Y). `alas` 0 = recogidas, 1 = abiertas en vuelo."""
    o = np.asarray(centro, float)
    negro = P_('#1C1A22', 'pelo', semilla=sem)
    pz.bola(o, (0.05 * esc, 0.07 * esc, 0.05 * esc), negro, 0.0)
    cab = o + np.array([0, 0.065, 0.035]) * esc
    pz.bola(cab, 0.036 * esc, negro, 0.012 * esc)
    pz.malla(sc.punta(f'{nombre} pico', cab + np.array([0, 0.025, -0.004]) * esc, cab + np.array([0, 0.07, -0.012]) * esc, 0.012 * esc, coll, seg=4),
             P_('#D8A02A', 'hueso', semilla=sem + 1))
    for s in (-1, 1):
        pz.malla(sc.bolita(f'{nombre} ojo {s}', cab + np.array([s * 0.022, 0.018, 0.012]) * esc, 0.007 * esc, coll, n=1, sub=1), brillo('ambar', '#FFAA33'))
        if alas > 0:
            raiz = o + np.array([s * 0.03, 0.0, 0.02]) * esc
            for k in range(3):
                punta = raiz + np.array([s * (0.12 - 0.02 * k), -0.03 - 0.03 * k, 0.03 * alas - 0.01 * k]) * esc
                pz.malla(sf.pluma(f'{nombre} ala {s} {k}', raiz, punta, 0.05 * esc, coll, normal=(0, 0.2, 1)), negro)
        else:
            pz.bola(o + np.array([s * 0.042, -0.01, 0.01]) * esc, (0.018 * esc, 0.06 * esc, 0.032 * esc), negro, 0.01 * esc)
    for k in (-1, 0, 1):
        pz.malla(sf.pluma(f'{nombre} cola {k}', o + np.array([0, -0.05, 0.0]) * esc, o + np.array([k * 0.025, -0.13, -0.01]) * esc, 0.03 * esc, coll,
                          normal=(0, 0, 1)), negro)


def _murcielago(pz, nombre, centro, esc, coll, sem=0):
    """Murciélago con las alas abiertas (mira a +Y) y los ojos rojos."""
    o = np.asarray(centro, float)
    piel = P_('#3A2A30', 'pelo', semilla=sem)
    ala = P_('#2A1E26', 'cuero', semilla=sem + 1)
    pz.bola(o, (0.035 * esc, 0.045 * esc, 0.03 * esc), piel, 0.0)
    cab = o + np.array([0, 0.045, 0.01]) * esc
    pz.bola(cab, 0.03 * esc, piel, 0.01 * esc)
    for s in (-1, 1):
        pz.malla(sc.punta(f'{nombre} oreja {s}', cab + np.array([s * 0.015, 0, 0.018]) * esc, cab + np.array([s * 0.028, -0.005, 0.06]) * esc, 0.012 * esc,
                          coll, seg=3), piel)
        pz.malla(sc.bolita(f'{nombre} ojo {s}', cab + np.array([s * 0.013, 0.025, 0.006]) * esc, 0.006 * esc, coll, n=1, sub=1), brillo('rojo', '#FF2A1A'))
        # el ala: tres dedos con la membrana entre ellos
        raiz = o + np.array([s * 0.025, 0.01, 0.01]) * esc
        dedos = [raiz + np.array([s * 0.09, 0.03, 0.03]) * esc, raiz + np.array([s * 0.15, -0.01, 0.0]) * esc, raiz + np.array([s * 0.12, -0.06, -0.02]) * esc]
        for k, d in enumerate(dedos):
            pz.trazo([raiz, d], [0.006 * esc, 0.003 * esc], ala, 0.0)
        filas = [[raiz, raiz, raiz], [dedos[0], (dedos[0] + dedos[1]) / 2 - np.array([0, 0.012, 0]) * esc, dedos[1]],
                 [dedos[1], (dedos[1] + dedos[2]) / 2 - np.array([0, 0.012, 0]) * esc, dedos[2]]]
        pz.malla(sc.lamina(f'{nombre} membrana {s} a', [[tuple(p) for p in f] for f in filas[:2]], coll, 0.003 * esc), ala)
        pz.malla(sc.lamina(f'{nombre} membrana {s} b', [[tuple(p) for p in f] for f in filas[1:]], coll, 0.003 * esc), ala)
        pz.malla(sc.lamina(f'{nombre} membrana {s} c', [[tuple(raiz)] * 3, [tuple(dedos[2]), tuple((dedos[2] + o) / 2), tuple(o - np.array([0, 0.04, 0]) * esc)]],
                           coll, 0.003 * esc), ala)


def _cepo(pz, nombre, centro, r, coll, abierto=True, sem=0):
    """Cepo de oso: la placa con el resorte y las dos mandíbulas dentadas (abiertas en el piso o cerradas)."""
    o = np.asarray(centro, float)
    hi = P_('#4A4C52', 'hierro', semilla=sem, polvo=0.4)
    pz.caja(o, (r * 0.32, r * 0.22, r * 0.05), r * 0.03, hi, 0.0)
    pz.bola(o + np.array([0, 0, r * 0.07]), (r * 0.12, r * 0.12, r * 0.03), P_('#8A6A3A', 'oro', semilla=sem + 1), 0.0)
    for s in (-1, 1):
        # cada mandíbula: medio aro dentado
        if abierto:
            arco = [o + np.array([math.cos(a) * r, s * math.sin(a) * r * 0.95, 0.0]) for a in np.linspace(0, math.pi, 9)]
            arriba = np.array([0, 0, 1.0])
        else:
            arco = [o + np.array([math.cos(a) * r, s * 0.015, math.sin(a) * r * 0.95]) for a in np.linspace(0, math.pi, 9)]
            arriba = np.array([0, -s * 1.0, 0])
        pz.trazo(arco, r * 0.07, hi, 0.0)
        for k in range(1, 8):
            b = arco[k]
            hacia = (o - b)
            hacia = hacia / max(np.linalg.norm(hacia), 1e-9)
            pz.malla(sc.punta(f'{nombre} diente {s} {k}', b, b + hacia * r * 0.16 + arriba * r * 0.12, r * 0.05, coll, seg=3),
                     P_('#8A8C92', 'hierro', semilla=sem + 2 + k, sangre=0.4))
        # el resorte de lado
        pz.trazo([o + np.array([s * r * 0.3, 0, 0.0]), o + np.array([s * r * 1.25, 0, 0.0])], r * 0.06, hi, 0.0)
        pz.bola(o + np.array([s * r * 1.25, 0, 0.0]), r * 0.1, hi, 0.0)


# ------------------------------------------------------------------ armas en la mano

@arma('cazo_aceite')
def cazo_aceite(coll):
    """Jarra de barro con aceite hirviendo: la boca brilla, burbujea y escurre por los lados."""
    F = nueva('cazo_aceite', clase='comun', icono_vista=(30, 15))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1500)
    o = np.array([0, 0.075, -0.02])
    c.malla(sc.torno('jarra', [(0.0, 0.0), (0.045, 0.0), (0.066, 0.035), (0.064, 0.085), (0.042, 0.12), (0.04, 0.135), (0.048, 0.145), (0.044, 0.152),
                               (0.0, 0.14)], coll, segmentos=18, centro=tuple(o)), terracota(1))
    # franjas pintadas y el asa (por donde se agarra)
    for z, col in ((0.05, '#3A2418'), (0.075, '#C88A4A')):
        banda(c, o[2] + z, 0.067, 0.008, P_(col, 'piedra', semilla=3), x=o[0], y=o[1])
    c.malla(sc.tubo('asa jarra', [o + np.array([0, -0.04, 0.12]), o + np.array([0, -0.085, 0.1]), o + np.array([0, -0.088, 0.05]), o + np.array([0, -0.06, 0.03])],
                    0.011, coll, segmentos=6, muestras=3), terracota(2, '#8A4E2C'))
    # el aceite: la superficie que brilla, burbujas y chorros que escurren
    top = o + np.array([0, 0, 0.142])
    c.bola(top, (0.04, 0.04, 0.008), brillo('fuego', '#FF6A1A'), 0.0)
    rng = np.random.default_rng(3)
    for k in range(5):
        a = rng.uniform(0, 2 * math.pi)
        c.malla(sc.bolita(f'burbuja {k}', top + np.array([math.cos(a) * 0.02, math.sin(a) * 0.02, 0.008]), 0.007 + 0.004 * (k % 2), coll, n=1, sub=1),
                brillo('ambar', '#FFAA33'))
    for k, a in enumerate((0.9, 3.6)):
        d = np.array([math.cos(a), math.sin(a), 0])
        pts = [top + d * 0.046 + np.array([0, 0, 0.004]), top + d * 0.058 + np.array([0, 0, -0.02]), top + d * 0.066 + np.array([0, 0, -0.05 - 0.02 * k])]
        c.malla(sc.tubo(f'chorro aceite {k}', pts, [0.007, 0.006, 0.005], coll, segmentos=6, muestras=3), brillo('fuego', '#FF6A1A'))
        c.malla(sc.bolita(f'gota aceite {k}', pts[-1] + np.array([0, 0, -0.006]), 0.008, coll, n=2), brillo('fuego', '#FF6A1A'))
    F.marca('llama', tuple(top))
    F.marca('punta', tuple(top))
    return F


@arma('frasco_escarcha')
def frasco_escarcha(coll):
    """Frasco escarchado: vidrio blanco por el frío, líquido azul que brilla, carámbanos y tapa de plata."""
    F = nueva('frasco_escarcha', clase='comun', icono_vista=(30, 10))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1600)
    vidrio = P_('#BFE4FF', 'vidrio', mat='espectro')
    c.sdf(sf.union(sdf.round_box((0, 0, 0.03), (0.05, 0.05, 0.06), 0.03), sdf.round_cone((0, 0, 0.08), (0, 0, 0.15), 0.022, 0.016), k=0.02),
          (-0.09, -0.09, -0.06), (0.09, 0.09, 0.18), vidrio)
    c.sdf(sdf.round_box((0, 0, 0.018), (0.042, 0.042, 0.045), 0.026), (-0.07, -0.07, -0.05), (0.07, 0.07, 0.08), brillo('hielo', '#8AF0FF'))
    # escarcha pegada al vidrio (copitos blancos) y carámbanos que cuelgan de la panza
    rng = np.random.default_rng(5)
    for k in range(14):
        a = rng.uniform(0, 2 * math.pi)
        z = rng.uniform(-0.01, 0.09)
        c.malla(sc.bolita(f'escarcha {k}', (math.cos(a) * 0.066, math.sin(a) * 0.066, z), (0.014, 0.014, 0.01), coll, n=1, sub=1), P_('#F4FAFF', 'hueso', semilla=k))
    for k in range(6):
        a = 2 * math.pi * k / 6 + 0.2
        b = np.array([math.cos(a) * 0.055, math.sin(a) * 0.055, -0.02])
        c.malla(sc.punta(f'carambano {k}', b, b + np.array([0, 0, -0.04 - 0.02 * (k % 3)]), 0.01, coll, seg=5), P_('#CFF0FF', 'vidrio', mat='espectro'))
    c.cono((0, 0, 0.145), (0, 0, 0.17), 0.02, 0.022, P_('#C4CCD8', 'hierro', semilla=2, var=0.3), 0.0)
    c.bola((0, 0, 0.175), 0.014, P_('#C4CCD8', 'hierro', semilla=3, var=0.3), 0.0)
    c.malla(sf.sc.clay.sweep('cordel escarcha', [(math.cos(a) * 0.024, math.sin(a) * 0.024, 0.12) for a in np.linspace(0, 2 * math.pi, 10, endpoint=False)],
                             0.004, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), cuero(6, '#5A6A7A'))
    F.marca('punta', (0, 0, 0.03))
    return F


@arma('bolsa_azufre')
def bolsa_azufre(coll):
    """Bolsita de cuero llena de azufre: el polvo amarillo se sale por arriba y echa humo."""
    F = nueva('bolsa_azufre', clase='comun', icono_vista=(30, 15))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1500)
    cu = cuero(1, '#6A4A2C')
    c.sdf(sc.sdf_ruido(sf.union(sdf.ellipsoid((0, 0, 0.07), (0.065, 0.06, 0.065)), sdf.round_cone((0, 0, 0.1), (0, 0, 0.15), 0.035, 0.03), k=0.03), 0.004, 30, 2),
          (-0.09, -0.09, -0.01), (0.09, 0.09, 0.17), cu)
    c.malla(sf.sc.clay.sweep('cordon bolsa', [(math.cos(a) * 0.036, math.sin(a) * 0.033, 0.125) for a in np.linspace(0, 2 * math.pi, 12, endpoint=False)],
                             0.005, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), cuero(2, '#C8A870'))
    c.malla(sc.tubo('cordon colgando', [(0.03, -0.02, 0.125), (0.05, -0.03, 0.06), (0.03, -0.04, 0.0), (0.0, 0, -0.04)], 0.005, coll, segmentos=4, muestras=2),
            cuero(3, '#C8A870'))
    # el azufre: un montoncito que se sale y unas piedritas
    az = P_('#E0CC3A', 'piedra', semilla=4)
    c.bola((0, 0, 0.155), (0.034, 0.034, 0.018), az, 0.01)
    rng = np.random.default_rng(7)
    for k in range(7):
        a = rng.uniform(0, 2 * math.pi)
        c.malla(sc.bolita(f'piedra azufre {k}', (math.cos(a) * 0.025, math.sin(a) * 0.025, 0.165 + rng.uniform(0, 0.01)), 0.008, coll, n=1, sub=1), az)
    # símbolo alquímico del azufre cosido (triángulo con cruz) y el humo amarillento
    for a, b in (((-0.025, -0.058, 0.04), (0.025, -0.058, 0.04)), ((-0.025, -0.058, 0.04), (0, -0.06, 0.085)), ((0.025, -0.058, 0.04), (0, -0.06, 0.085)),
                 ((0, -0.056, 0.04), (0, -0.054, 0.005)), ((-0.014, -0.056, 0.022), (0.014, -0.056, 0.022))):
        c.trazo([a, b], 0.0035, P_('#E0CC3A', 'tela', semilla=8), 0.0)
    for k in range(3):
        a = 2.1 * k + 0.4
        c.malla(sc.bolita(f'chispa azufre {k}', (math.cos(a) * 0.012, math.sin(a) * 0.012, 0.178 + 0.006 * k), 0.007, coll, n=1, sub=1), brillo('ambar', '#FFAA33'))
    F.marca('punta', (0, 0, 0.16))
    return F


@arma('racimo')
def racimo(coll):
    """Tres bombitas amarradas de una cuerda, con las mechas trenzadas en una sola chispa."""
    F = nueva('racimo', clase='comun', icono_vista=(30, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1500)
    centros = [np.array([math.cos(a) * 0.045, math.sin(a) * 0.045, 0.06]) for a in (0.3, 2.4, 4.5)]
    for k, p in enumerate(centros):
        c.bola(p, 0.045, P_('#2E2C2A', 'hierro', semilla=k), 0.0)
        ring = [p + np.array([math.cos(t) * 0.046, math.sin(t) * 0.046, 0]) for t in np.linspace(0, 2 * math.pi, 14, endpoint=False)]
        c.malla(sf.sc.clay.sweep(f'aro racimo {k}', ring, 0.004, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), oro(k + 2))
        c.cono(p + np.array([0, 0, 0.038]), p + np.array([0, 0, 0.055]), 0.014, 0.012, hierro(4), 0.0)
        c.malla(sc.tubo(f'mecha racimo {k}', [p + np.array([0, 0, 0.055]), p * 0.4 + np.array([0, 0, 0.12]), np.array([0, 0, 0.15])], 0.004, coll, segmentos=4,
                        muestras=2), cuero(4, '#8A7450'))
    c.malla(sf.sc.clay.sweep('cuerda racimo', [np.array([math.cos(t) * 0.075, math.sin(t) * 0.075, 0.07]) for t in np.linspace(0, 2 * math.pi, 18, endpoint=False)],
                             0.006, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), cuero(5, '#9A8058'))
    c.malla(sc.tubo('asa racimo', [(0.07, 0, 0.07), (0.05, 0, 0.0), (0.0, 0, -0.03), (-0.05, 0, 0.0), (-0.07, 0, 0.07)], 0.006, coll, segmentos=4, muestras=2),
            cuero(6, '#9A8058'))
    c.bola((0, 0, 0.158), 0.014, brillo('fuego', '#FF6A1A'), 0.0)
    F.marca('llama', (0, 0, 0.158))
    F.marca('punta', (0, 0, 0.06))
    return F


@arma('bolsa_abrojos')
def bolsa_abrojos(coll):
    """Costal de lona remendado del que se salen los abrojos de hierro."""
    F = nueva('bolsa_abrojos', clase='comun', icono_vista=(30, 15))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1700)
    lona = P_('#8A7A5A', 'tela', semilla=1, polvo=0.4)
    c.sdf(sc.sdf_ruido(sf.union(sdf.ellipsoid((0, 0, 0.06), (0.07, 0.06, 0.06)), sdf.round_cone((0, 0, 0.08), (0, 0, 0.12), 0.05, 0.045), k=0.03), 0.004, 25, 3),
          (-0.1, -0.1, -0.01), (0.1, 0.1, 0.14), lona)
    c.malla(sf.sc.clay.sweep('boca costal', [(math.cos(a) * 0.05, math.sin(a) * 0.046, 0.118) for a in np.linspace(0, 2 * math.pi, 14, endpoint=False)],
                             0.007, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), lona)
    # el remiendo y la cuerda del hombro
    c.caja((0.03, -0.055, 0.05), (0.022, 0.004, 0.02), 0.004, P_('#5A3A2A', 'tela', semilla=2), 0.0)
    sf.puntadas(c, 'puntadas remiendo', np.array([0.008, -0.06, 0.032]), np.array([0.052, -0.06, 0.032]), 4, 0.01, P_('#D8C8A0', 'tela', semilla=3), coll,
                normal=(0, -1, 0))
    c.malla(sc.tubo('cuerda costal', [(0.045, 0.0, 0.11), (0.03, 0.0, 0.03), (0.0, 0, -0.04)], 0.005, coll, segmentos=4, muestras=2), cuero(3, '#9A8058'))
    hi = P_('#5A5C62', 'hierro', semilla=4, polvo=0.3)
    c.bola((0, 0, 0.12), (0.042, 0.04, 0.01), P_('#2A2420', 'liso'), 0.0)
    for k, (p, t) in enumerate((((0.0, 0.0, 0.175), 0.042), ((0.035, 0.018, 0.155), 0.036), ((-0.034, -0.012, 0.152), 0.036), ((0.012, -0.034, 0.15), 0.032),
                                ((-0.016, 0.034, 0.158), 0.032), ((0.075, -0.04, 0.03), 0.03))):
        _abrojo(c, f'abrojo {k}', p, t, hi, coll, giro=k * 1.3)
    F.marca('punta', (0, 0, 0.12))
    return F


@arma('cepo')
def cepo(coll):
    """Cepo de oso cerrado, colgado de su cadena (así se lleva)."""
    F = nueva('cepo', clase='comun', icono_vista=(20, 15))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1700)
    for k in range(6):
        z0 = 0.03 * k
        eje = (1, 0) if k % 2 else (0, 1)
        aro = [(eje[0] * math.cos(t) * 0.011, eje[1] * math.cos(t) * 0.011, z0 + math.sin(t) * 0.019) for t in np.linspace(0, 2 * math.pi, 10, endpoint=False)]
        c.malla(sf.sc.clay.sweep(f'eslabon cepo {k}', aro, 0.0042, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), hierro(2 + k % 2))
    c.bola((0, 0, 0.19), 0.016, hierro(4), 0.0)
    _cepo(c, 'cepo', (0, 0, 0.2), 0.09, coll, abierto=False, sem=5)
    F.marca('punta', (0, 0, 0.3))
    return F


@arma('ballesta_pesada')
def ballesta_pesada(coll):
    """Ballesta de pie: arco de acero grueso, torno para tensarla y tres patas plegadas debajo."""
    F = nueva('ballesta_pesada', clase='comun', icono_vista=(55, 25))
    c = F.pieza('cuerpo', (0, 0, 0), tris=2200)
    md = madera(1, '#5A3E26', eje='y')
    c.trazo([(0, -0.16, 0.0), (0, -0.04, 0.03), (0, 0.15, 0.05), (0, 0.4, 0.05)], [0.032, 0.028, 0.024, 0.022], md, 0.0)
    c.caja((0, 0.16, 0.065), (0.022, 0.24, 0.014), 0.008, md, 0.01)
    arco = [(-0.3, 0.33, 0.065), (-0.16, 0.4, 0.065), (0, 0.42, 0.065), (0.16, 0.4, 0.065), (0.3, 0.33, 0.065)]
    c.trazo(arco, [0.012, 0.018, 0.024, 0.018, 0.012], acero(2), 0.004)
    c.malla(sc.tubo('cuerda pesada', [arco[0], (0, 0.1, 0.075), arco[-1]], 0.004, coll, segmentos=3, muestras=1), P_('#C9B88A', 'cuero', semilla=3))
    # el torno de atrás con su manivela
    c.cono((-0.05, -0.17, 0.05), (0.05, -0.17, 0.05), 0.025, 0.025, hierro(4), 0.0)
    for s in (-1, 1):
        c.trazo([(s * 0.05, -0.17, 0.05), (s * 0.07, -0.17, 0.05), (s * 0.07, -0.2, 0.09)], 0.007, hierro(5), 0.003)
        c.bola((s * 0.07, -0.2, 0.095), 0.012, madera(6, '#3A2414'), 0.0)
    # las tres patas plegadas por debajo y la bisagra
    c.bola((0, 0.1, 0.015), 0.022, hierro(7), 0.0)
    for k, a in enumerate((-0.35, 0.0, 0.35)):
        c.trazo([(0, 0.1, 0.0), (math.sin(a) * 0.05, 0.1 - math.cos(a) * 0.04, -0.2)], [0.012, 0.009], madera(8 + k, '#4E3420'), 0.0)
        c.malla(sc.punta(f'pata punta {k}', (math.sin(a) * 0.05, 0.1 - math.cos(a) * 0.04, -0.2), (math.sin(a) * 0.055, 0.1 - math.cos(a) * 0.045, -0.24), 0.01,
                         coll, seg=4), hierro(11))
    for y in (-0.06, 0.08, 0.3):
        c.sdf(sdf.round_box((0, y, 0.05), (0.034, 0.012, 0.034), 0.006), (-0.05, y - 0.03, 0.0), (0.05, y + 0.03, 0.1), hierro(12), 0.0)
    c.malla(sc.tubo('virote pesado', [(0, 0.1, 0.09), (0, 0.4, 0.09)], 0.007, coll, segmentos=4, muestras=1), md)
    sf.diente(c, 'punta virote pesado', (0, 0.4, 0.09), (0, 0.46, 0.09), 0.014, acero(13), coll)
    F.marca('punta', (0, 0.47, 0.09))
    return F


@arma('guante_cetreria')
def guante_cetreria(coll):
    """Guante de cetrero de cuero grueso con un cuervo parado encima."""
    F = nueva('guante_cetreria', clase='comun', icono_vista=(30, 15))
    c = F.pieza('cuerpo', (0, 0, 0), tris=2200)
    cu = cuero(1, '#7A5232')
    # la manga ancha de cuero (acampanada) con su borde y la mano cerrada encima, los dedos hacia adelante
    c.cono((0, 0, -0.07), (0, 0, 0.06), 0.066, 0.04, cu, 0.0)
    banda(c, -0.066, 0.068, 0.01, cuero(2, '#C8A060'), 0.0)
    for k in range(5):
        a = 2 * math.pi * k / 5
        c.malla(sc.bolita(f'remache guante {k}', (math.cos(a) * 0.058, math.sin(a) * 0.058, -0.03), 0.005, coll, n=1, sub=1), oro(10 + k))
    c.bola((0, 0.012, 0.09), (0.046, 0.042, 0.04), cu, 0.015)
    for k in range(4):
        x = (k - 1.5) * 0.022
        c.trazo([(x, 0.03, 0.105), (x, 0.065, 0.1), (x, 0.075, 0.07)], [0.012, 0.011, 0.01], cu, 0.004)
    c.trazo([(0.042, 0.02, 0.08), (0.05, 0.05, 0.07), (0.035, 0.07, 0.065)], [0.013, 0.012, 0.01], cu, 0.004)
    banda(c, 0.055, 0.042, 0.007, cuero(3, '#C8A060'), 0.0)
    c.malla(sc.tubo('pihuela', [(0, -0.04, 0.11), (0.03, -0.06, 0.05), (0.02, -0.05, -0.01)], 0.004, coll, segmentos=4, muestras=2), cuero(4, '#3A2414'))
    _cuervo(c, 'cuervo guante', (0, 0.0, 0.19), 0.9, coll, alas=0.0, sem=6)
    for s in (-1, 1):
        c.trazo([(s * 0.015, 0.0, 0.16), (s * 0.015, 0.012, 0.128)], 0.004, P_('#D8A02A', 'hueso', semilla=7), 0.0)
    F.marca('punta', (0, 0.05, 0.22))
    return F


@arma('jaula')
def jaula(coll):
    """Jaulita de hierro colgando de la mano, con un murciélago adentro cabeza abajo y los ojos rojos."""
    F = nueva('jaula', clase='comun')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1900)
    hi = hierro(1, '#3E3E44')
    c.malla(sf.sc.clay.sweep('aro jaula', [(math.cos(a) * 0.035, 0, -math.sin(a) * 0.035 - 0.04) for a in np.linspace(0, math.pi, 8)], 0.006, (1, 1), coll, None,
                             segments=4, samples=1, subsurf=0), hi)
    b = np.array([0, 0, -0.23])
    c.malla(sc.torno('techo jaula', [(0.0, 0.115), (0.03, 0.105), (0.072, 0.075), (0.078, 0.066), (0.0, 0.07)], coll, segmentos=14, centro=tuple(b)), hi)
    c.malla(sc.torno('piso jaula', [(0.0, -0.1), (0.074, -0.1), (0.078, -0.088), (0.0, -0.086)], coll, segmentos=14, centro=tuple(b)), hi)
    c.malla(sc.torno('pie jaula', [(0.0, -0.13), (0.03, -0.12), (0.02, -0.1), (0.0, -0.1)], coll, segmentos=10, centro=tuple(b)), hierro(2, '#5A4A3A'))
    for k in range(10):
        a = 2 * math.pi * k / 10
        c.malla(sc.tubo(f'barrote {k}', [b + np.array([math.cos(a) * 0.07, math.sin(a) * 0.07, -0.09]), b + np.array([math.cos(a) * 0.07, math.sin(a) * 0.07, 0.07])],
                        0.004, coll, segmentos=4, muestras=1), hi)
    c.malla(sf.sc.clay.sweep('aro medio jaula', [b + np.array([math.cos(a) * 0.071, math.sin(a) * 0.071, -0.01]) for a in np.linspace(0, 2 * math.pi, 16, endpoint=False)],
                             0.004, (1, 1), coll, None, segments=4, samples=1, closed=True, subsurf=0), hi)
    c.malla(sc.tubo('varilla jaula', [b + np.array([0, 0, 0.11]), np.array([0, 0, -0.068])], 0.006, coll, segmentos=5, muestras=1), hi)
    # el murciélago colgando de la percha, cabeza abajo y con las alas recogidas
    m = b + np.array([0, 0, 0.0])
    c.malla(sc.tubo('percha jaula', [b + np.array([-0.06, 0, 0.045]), b + np.array([0.06, 0, 0.045])], 0.004, coll, segmentos=4, muestras=1), madera(3, '#4E3420'))
    c.malla(sc.bolita('cuerpo murcielago jaula', m, (0.026, 0.022, 0.036), coll, n=2), P_('#2A1E26', 'cuero', semilla=3))
    c.malla(sc.bolita('cabeza murcielago jaula', m + np.array([0, 0.004, -0.042]), 0.02, coll, n=2), P_('#3A2A30', 'pelo', semilla=4))
    for s in (-1, 1):
        c.malla(sc.tubo(f'pata jaula {s}', [m + np.array([s * 0.008, 0, 0.03]), b + np.array([s * 0.008, 0, 0.045])], 0.0025, coll, segmentos=3, muestras=1),
                P_('#2A1E26', 'cuero', semilla=6))
        c.malla(sc.punta(f'oreja jaula {s}', m + np.array([s * 0.01, 0, -0.056]), m + np.array([s * 0.018, 0, -0.08]), 0.007, coll, seg=3), P_('#3A2A30', 'pelo', semilla=5))
        c.malla(sc.bolita(f'ojo jaula {s}', m + np.array([s * 0.009, 0.018, -0.046]), 0.005, coll, n=1, sub=1), brillo('rojo', '#FF2A1A'))
    F.marca('punta', tuple(b))
    return F


@arma('latigo_espinas')
def latigo_espinas(coll):
    """Látigo de zarza: mango forrado con una rosa y la rama llena de espinas que se enrolla."""
    F = nueva('latigo_espinas', clase='comun', icono_vista=(40, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=2200)
    empunadura(c, -0.07, 0.09, 0.02, cuero(1, '#3A2414'), cuero(2, '#7A5232'), coll)
    c.bola((0, 0, -0.08), 0.024, P_('#4A5A2A', 'madera', semilla=3), 0.0)
    # la rama: sale para arriba y se enrolla
    pts = [np.array([0, 0, 0.09])]
    for k in range(1, 15):
        t = k / 14
        a = t * 4.2
        r = 0.04 + 0.12 * t
        pts.append(np.array([math.sin(a) * r, math.cos(a) * r * 0.5 - 0.02, 0.09 + 0.36 * math.sin(t * math.pi * 0.62)]))
    rama = P_('#4A5A2A', 'madera', semilla=4, color2='#2A3418')
    c.trazo(pts, list(np.linspace(0.011, 0.004, len(pts))), rama, 0.0)
    rng = np.random.default_rng(9)
    for k in range(1, len(pts) - 1):
        for q in range(2):
            d = pts[k + 1] - pts[k - 1]
            d = d / max(np.linalg.norm(d), 1e-9)
            n = np.cross(d, np.array([0, 0, 1.0]) if abs(d[2]) < 0.9 else np.array([1.0, 0, 0]))
            n = n / max(np.linalg.norm(n), 1e-9)
            a = rng.uniform(0, 2 * math.pi)
            lado = n * math.cos(a) + np.cross(d, n) * math.sin(a)
            r = 0.011 - 0.006 * k / len(pts)
            c.malla(sc.punta(f'espina {k} {q}', pts[k] + lado * r * 0.6, pts[k] + lado * (r + 0.016) + d * 0.006, 0.004, coll, seg=3),
                    P_('#C8B88A', 'hueso', semilla=k))
    # hojitas y la rosa en el mango
    for k in (3, 7, 11):
        c.malla(sf.pluma(f'hoja zarza {k}', pts[k], pts[k] + np.array([0.03, 0.01, 0.02]), 0.02, coll, normal=(0, 1, 0.2)), P_('#3A6A2A', 'tela', semilla=k))
    rosa = np.array([0.0, -0.025, 0.09])
    for k in range(6):
        a = 2 * math.pi * k / 6
        c.bola(rosa + np.array([math.cos(a) * 0.012, 0, math.sin(a) * 0.012]), (0.012, 0.008, 0.012), P_('#A8141E', 'tela', semilla=10 + k), 0.006)
    c.bola(rosa + np.array([0, -0.004, 0]), 0.01, P_('#7A0A12', 'tela', semilla=17), 0.004)
    F.marca('punta', tuple(pts[-1]))
    return F


@arma('vara_sangre')
def vara_sangre(coll):
    """Varita de hueso con una gota de sangre que flota arriba, sujeta por alambre de plata."""
    F = nueva('vara_sangre', clase='comun')
    c = F.pieza('cuerpo', (0, 0, 0), tris=1700)
    sf.hueso_largo(c, np.array([0, 0, -0.1]), np.array([0, 0, 0.3]), 0.016, hueso_pt(1))
    empunadura(c, -0.05, 0.06, 0.02, tela('#5A0A10', 2), cuero(3, '#2A1410'), coll)
    top = np.array([0, 0, 0.36])
    for k in range(3):
        a = 2 * math.pi * k / 3
        c.trazo([np.array([0, 0, 0.3]), np.array([math.cos(a) * 0.035, math.sin(a) * 0.035, 0.34]), top + np.array([math.cos(a) * 0.022, math.sin(a) * 0.022, 0.03])],
                [0.005, 0.004, 0.002], P_('#C4CCD8', 'hierro', semilla=4 + k, var=0.3), 0.003)
    # la gota: bola con su punta para arriba
    c.sdf(sdf.round_cone(tuple(top - np.array([0, 0, 0.005])), tuple(top + np.array([0, 0, 0.05])), 0.03, 0.004), (-0.05, -0.05, 0.3), (0.05, 0.05, 0.43),
          brillo('rojo', '#FF2A1A'))
    for k in range(3):
        c.malla(sc.bolita(f'gotita {k}', top + np.array([math.cos(k * 2.1) * 0.045, math.sin(k * 2.1) * 0.045, -0.03 - 0.01 * k]), 0.008, coll, n=1, sub=1),
                brillo('rojo', '#FF2A1A'))
    c.malla(sf.sc.clay.sweep('espiral plata', [np.array([math.cos(a) * 0.02, math.sin(a) * 0.02, 0.08 + a * 0.012]) for a in np.linspace(0, 14, 30)], 0.0025, (1, 1),
                             coll, None, segments=4, samples=1, subsurf=0), P_('#C4CCD8', 'hierro', semilla=8, var=0.3))
    F.marca('llama', tuple(top))
    F.marca('punta', tuple(top))
    return F


@arma('sifon')
def sifon(coll):
    """Sifón de fuego griego: un tanque de cobre con su fuelle y el tubo con boca de dragón que escupe la llama."""
    F = nueva('sifon', clase='comun', icono_vista=(55, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=2200)
    cobre = P_('#C07A44', 'oro', semilla=1)
    # (el tanque forrado en cuero: el cobre liso se ve negro de lejos)
    c.bola((0, -0.05, 0.02), (0.058, 0.058, 0.068), cuero(10, '#7A4A2A'), 0.0)
    c.cono((0, -0.05, 0.08), (0, -0.05, 0.1), 0.02, 0.016, hierro(3), 0.0)
    for z in (-0.02, 0.03):
        banda(c, 0.02 + z, 0.06, 0.01, cobre, 0.0, y=-0.05)
    # el fuelle de atrás
    c.sdf(sdf.round_box((0, -0.13, 0.02), (0.045, 0.025, 0.04), 0.015), (-0.06, -0.17, -0.03), (0.06, -0.09, 0.07), cuero(3, '#5A3A22'))
    c.trazo([(0, -0.16, 0.02), (0, -0.2, 0.02)], 0.01, madera(4, '#3A2414'), 0.0)
    # el tubo hacia +Y con la boca de dragón
    c.trazo([(0, -0.01, 0.05), (0, 0.12, 0.06), (0, 0.32, 0.065)], [0.016, 0.014, 0.013], cobre, 0.0)
    for y in (0.08, 0.2):
        c.trazo([(0, y, 0.065), (0, y, 0.0), (0, y - 0.03, -0.04)], 0.006, hierro(5), 0.003)
    boca = np.array([0, 0.36, 0.065])
    c.bola(boca, (0.03, 0.045, 0.028), P_('#8A5A2A', 'oro', semilla=6), 0.01)
    for s in (-1, 1):
        c.malla(sc.punta(f'cuerno sifon {s}', boca + np.array([s * 0.018, -0.02, 0.018]), boca + np.array([s * 0.03, -0.06, 0.05]), 0.008, coll, seg=4), hueso_pt(7))
        c.malla(sc.bolita(f'ojo sifon {s}', boca + np.array([s * 0.022, 0.005, 0.016]), 0.006, coll, n=1, sub=1), brillo('ambar', '#FFAA33'))
    c.caja(boca + np.array([0, 0.035, -0.012]), (0.022, 0.018, 0.006), 0.004, P_('#8A5A2A', 'oro', semilla=8), 0.0)
    # la llamita en la boca
    c.malla(sc.punta('llama sifon', boca + np.array([0, 0.04, 0.0]), boca + np.array([0, 0.11, 0.01]), 0.02, coll, seg=6), brillo('fuego', '#FF6A1A'))
    c.trazo([(0, -0.05, -0.04), (0, -0.04, -0.1)], 0.014, madera(9, '#3A2414'), 0.0)
    F.marca('llama', tuple(boca + np.array([0, 0.06, 0])))
    F.marca('punta', tuple(boca + np.array([0, 0.08, 0])))
    return F


@arma('perdigonera')
def perdigonera(coll):
    """Perdigonera de dos cañones recortados y boca de campana, con la culata corta de nogal."""
    F = nueva('perdigonera', clase='comun', icono_vista=(60, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=1700)
    md = madera(1, '#5A3420', eje='y')
    c.trazo([(0, -0.17, -0.05), (0, -0.06, 0.0), (0, 0.04, 0.03)], [0.034, 0.028, 0.024], md, 0.0)
    c.caja((0, 0.1, 0.035), (0.024, 0.09, 0.018), 0.008, md, 0.0)
    for s in (-1, 1):
        c.malla(sc.torno(f'canon {s}', [(0.0, 0.0), (0.017, 0.0), (0.016, 0.2), (0.026, 0.27), (0.032, 0.3), (0.02, 0.3), (0.0, 0.29)], coll, segmentos=14,
                         centro=(s * 0.018, 0.02, 0.065), eje=(0, 1, 0)), P_('#4A4C52', 'hierro', semilla=2 + s))
        c.malla(sc.bolita(f'boca {s}', (s * 0.018, 0.316, 0.065), (0.019, 0.004, 0.019), coll, n=2), P_('#120D0B', 'liso'))
    for y in (0.07, 0.18):
        c.malla(sc.tubo(f'abrazadera perdigonera {y}', [(-0.04, y, 0.06), (0.0, y, 0.09), (0.04, y, 0.06)], 0.007, coll, segmentos=4, muestras=1), oro(3))
    c.trazo([(0, -0.02, 0.06), (0, 0.0, 0.1), (0, 0.025, 0.095)], 0.008, hierro(4), 0.0)
    c.trazo([(0, -0.03, 0.0), (0, -0.01, -0.04)], 0.006, hierro(5), 0.0)
    c.malla(sf.sc.clay.sweep('guardamonte', [(0, -0.05 + 0.03 * math.cos(a), -0.015 - 0.03 * math.sin(a)) for a in np.linspace(0, math.pi, 8)], 0.004, (1, 1),
                             coll, None, segments=4, samples=1, subsurf=0), oro(6))
    F.marca('punta', (0, 0.33, 0.065))
    return F


# ------------------------------------------------------------------ proyectiles

@proyectil('jarra_aceite')
def p_jarra_aceite(coll):
    F = nuevo_p('jarra_aceite', icono_vista=(20, 15))
    c = F.pieza('cuerpo', (0, 0, 0), tris=320)
    c.malla(sc.torno('jarrita', [(0.0, -0.045), (0.035, -0.045), (0.05, -0.015), (0.045, 0.02), (0.028, 0.04), (0.03, 0.05), (0.0, 0.045)], coll, segmentos=10),
            terracota(1))
    c.malla(sc.bolita('aceite', (0, 0, 0.046), (0.024, 0.024, 0.006), coll, n=1, sub=1), brillo('fuego', '#FF6A1A'))
    c.malla(sc.tubo('chorro', [(0.025, 0, 0.04), (0.04, -0.02, 0.02), (0.05, -0.05, -0.01)], [0.006, 0.005, 0.003], coll, segmentos=4, muestras=1),
            brillo('fuego', '#FF6A1A'))
    F.marca('llama', (0, 0, 0.05))
    return F


@proyectil('racimo')
def p_racimo(coll):
    F = nuevo_p('racimo')
    c = F.pieza('cuerpo', (0, 0, 0), tris=360)
    for k, a in enumerate((0.3, 2.4, 4.5)):
        p = (math.cos(a) * 0.03, math.sin(a) * 0.03, 0.0)
        c.malla(sc.bolita(f'bombita {k}', p, 0.035, coll, n=2), P_('#2E2C2A', 'hierro', semilla=k))
    c.malla(sc.tubo('mecha racimo', [(0, 0, 0.03), (0.01, -0.01, 0.06)], 0.004, coll, segmentos=3, muestras=1), cuero(2, '#8A7450'))
    c.malla(sc.bolita('chispa racimo', (0.012, -0.012, 0.066), 0.012, coll, n=1, sub=1), brillo('fuego', '#FF6A1A'))
    F.marca('llama', (0.012, -0.012, 0.066))
    return F


@proyectil('abrojo')
def p_abrojo(coll):
    F = nuevo_p('abrojo', icono_vista=(40, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=200)
    # (grandotes: desde la cámara de arriba los abrojos de verdad no se veían)
    _abrojo(c, 'abrojo', (0, 0, 0.05), 0.12, P_('#7A7C82', 'hierro', semilla=1, sangre=0.4), coll)
    return F


@proyectil('cepo')
def p_cepo(coll):
    F = nuevo_p('cepo', icono_vista=(50, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=700)
    _cepo(c, 'cepo suelo', (0, 0, 0.03), 0.24, coll, abierto=True, sem=2)
    return F


@proyectil('cuervo')
def p_cuervo(coll):
    F = nuevo_p('cuervo', icono_vista=(40, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=700)
    _cuervo(c, 'cuervo vuela', (0, 0, 0), 1.7, coll, alas=1.0, sem=3)
    return F


@proyectil('murcielago')
def p_murcielago(coll):
    F = nuevo_p('murcielago', icono_vista=(40, 20))
    c = F.pieza('cuerpo', (0, 0, 0), tris=650)
    _murcielago(c, 'murcielago vuela', (0, 0, 0), 1.8, coll, sem=4)
    return F


@proyectil('gota_sangre')
def p_gota_sangre(coll):
    F = nuevo_p('gota_sangre')
    c = F.pieza('cuerpo', (0, 0, 0), tris=220)
    c.malla(sc.bolita('gota', (0, 0.02, 0), (0.035, 0.04, 0.035), coll, n=2), brillo('rojo', '#FF2A1A'))
    c.malla(sc.punta('estela gota', (0, 0.0, 0), (0, -0.16, 0.0), 0.032, coll, seg=6), P_('#FF3A4A', 'vidrio', mat='espectro'))
    F.marca('llama', (0, 0.02, 0))
    return F


@proyectil('perdigon')
def p_perdigon(coll):
    F = nuevo_p('perdigon')
    c = F.pieza('cuerpo', (0, 0, 0), tris=120)
    c.malla(sc.bolita('perdigon', (0, 0, 0), 0.022, coll, n=2), P_('#5A5C62', 'hierro', semilla=1))
    c.malla(sc.punta('estela perdigon', (0, -0.01, 0), (0, -0.09, 0), 0.016, coll, seg=5), P_('#FFE0A8', 'vidrio', mat='espectro'))
    return F
