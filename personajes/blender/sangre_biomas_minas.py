"""Sangre y Ceniza · Las Minas de Sangre: roca rojiza con estratos y carbón, entibados de madera, rieles y
vagonetas, cristales de sangre, grietas de lava, barriles, dinamita, poleas y lámparas de minero.

Todo en el origen (centro de la base), el frente hacia -Y. Los rieles van en piezas de 1 × 1 m a lo largo de Y
(la curva une el borde -Y con el borde +X), para que el juego arme el recorrido de la carreta en la cuadrícula.
"""
import math

import numpy as np

import sangre_biomas_base as B
import sangre_biomas_cementerio as CE
import sangre_biomas_comun as C
from sangre_biomas_base import Pieza, hx, mezclar, suave

ROCA = '#8A5444'
ROCA_OSC = '#4A2A22'
OCRE = '#A87448'
CARBON = '#24201E'
MADERA = '#8A6644'
MADERA_OSC = '#46301E'
TIERRA = '#6A4A3A'
TIERRA_OSC = '#3A2620'
VOLCAN = '#3A3236'
VOLCAN_OSC = '#1A1618'

LUZ_ANTORCHA = dict(color='#FF9A45', intensidad=1.2, alcance=6.0, particulas='fuego')
LUZ_VELA = dict(color='#FFB866', intensidad=0.7, alcance=3.5, particulas='fuego')
LUZ_LAMPARA = dict(color='#FFC27A', intensidad=1.1, alcance=5.5, particulas='fuego')
LUZ_BRASERO = dict(color='#FF7A30', intensidad=1.4, alcance=6.5, particulas='fuego')
LUZ_LAVA = dict(color='#FF5A20', intensidad=1.3, alcance=5.0, particulas='brasas')


# --------------------------------------------------------------------------
# Pintores
# --------------------------------------------------------------------------

def p_roca(semilla, carbon=0.0):
    pie = B.piedra(ROCA, ROCA_OSC, claro='#A86A54', escala=2.2, humedad=0.25, semilla=semilla, vetas=0.3, color_vetas='#3A1E18')

    def p(P, N):
        col = pie(P, N)
        capa = np.sin(P[:, 2] * 9 + 2.5 * B.fbm(P, 1.2, 2, semilla + 3))
        col = mezclar(col, hx(OCRE) * (0.8 + 0.3 * np.clip(0.5 + B.ruido(P, 6, semilla), 0, 1))[:, None], suave(0.55, 0.9, capa) * 0.55)
        if carbon > 0:
            veta = suave(0.12, 0.04, np.abs(P[:, 2] - 0.75 - 0.12 * B.fbm(P * np.array([1, 1, 0]), 1.5, 2, semilla + 5)))
            col = mezclar(col, hx(CARBON) * (1 + 0.6 * suave(0.6, 0.9, B.ruido(P, 30, semilla + 6)))[:, None], veta * carbon)
        rojo = suave(0.75, 0.9, 1 - np.abs(B.ruido(P, 3, semilla + 8)))
        col = mezclar(col, hx('#B02A22'), rojo * 0.35)
        return col
    return p


def p_techo_roca():
    def fabrica(rn, s):
        def p(P, N):
            col = mezclar(hx(ROCA_OSC), hx('#9A6250'), np.clip(0.55 + 0.6 * rn(P, 3, 3, s + 1), 0, 1))
            col = mezclar(col, hx(OCRE), suave(0.3, 0.7, rn(P, 2, 2, s + 2)) * 0.4)
            grava = suave(0.55, 0.7, rn(P, 16, 1, s + 3))
            col = mezclar(col, hx('#5A3A30'), grava * 0.6)
            grieta = suave(0.9, 0.975, 1 - np.abs(rn(P, 2, 2, s + 7)))
            col = col * (1 - 0.5 * grieta)[:, None]
            return col * (1 + 0.08 * rn(P, 24, 1, s + 4))[:, None]
        return p
    return C.pintor_techo(fabrica, 0)


def p_madera(semilla, eje=2, podrida=0.3):
    return B.madera(MADERA, MADERA_OSC, eje=eje, podrida=podrida, semilla=semilla)


def p_hierro(semilla, cant=0.6):
    return B.metal('#3E3A38', oxido='#7A3E22', cant=cant, semilla=semilla)


def p_volcan(semilla):
    return B.piedra(VOLCAN, VOLCAN_OSC, claro='#5A4E54', escala=2.0, humedad=0.0, semilla=semilla, vetas=0.5, color_vetas='#5A1A10')


def p_tierra(semilla):
    return B.manchado(TIERRA, TIERRA_OSC, escala=6, semilla=semilla)


# --------------------------------------------------------------------------
# Utilería propia
# --------------------------------------------------------------------------

def tabla(p, c, half, R=None, semilla=0, pintor=None, tris=120, eje=None, r=0.012, rug=0.004, mat='madera'):
    """Tabla o viga de madera vieja (caja redondeada con vetas)."""
    if eje is None:
        eje = int(np.argmax(half))
    f = B.desplazar(B.caja((0, 0, 0), half, r=r), rug, 25, 2, semilla)
    m = max(half) + 0.04
    V, F = B.malla_sdf(f, (-half[0] - 0.03, -half[1] - 0.03, -half[2] - 0.03), (half[0] + 0.03, half[1] + 0.03, half[2] + 0.03),
                       max(min(half) / 3, 0.008), tris, suavizar=0)
    V = B.transformar(V, c, R)
    p.parte(V, F, mat, pintor or p_madera(semilla, eje=eje if R is None else eje))
    del m


def remaches(p, puntos, r=0.012, semilla=0):
    Vs, Fs, b = [], [], 0
    for q in puntos:
        V, F = B.torno_m([(0.0, 0.0), (r, 0.0), (r * 0.7, r * 0.7), (0.0, r)], seg=5)
        Vs.append(V + np.asarray(q))
        Fs.append(F + b)
        b += len(V)
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'hierro', p_hierro(semilla))


def lava_tira(p, puntos, ancho=0.06, semilla=0, z=0.008, costra=True):
    """Grieta de lava sobre el piso: tira brillante con costra oscura a los lados."""
    import clay
    pts, _ = clay.catmull_rom(puntos, 6)
    T = np.gradient(pts, axis=0)
    T /= np.maximum(np.linalg.norm(T, axis=1), 1e-9)[:, None]
    Nl = np.stack([-T[:, 1], T[:, 0], np.zeros(len(T))], 1)
    rng = B.azar(semilla)
    w = ancho * (0.6 + 0.4 * np.sin(np.linspace(0, math.pi, len(pts)))) * (0.8 + 0.4 * rng.random(len(pts)))
    V, F = [], []
    for i, q in enumerate(pts):
        V += [q + Nl[i] * w[i] + (0, 0, z), q - Nl[i] * w[i] + (0, 0, z)]
    for i in range(len(pts) - 1):
        a = 2 * i
        F += [(a, a + 1, a + 3), (a, a + 3, a + 2)]
    V = np.array(V)
    F = np.array(F)
    # orientar hacia arriba
    n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    if (n[:, 2] < 0).mean() > 0.5:
        F = F[:, ::-1]
    p.parte(V, F, 'lava', lambda P, N: np.tile(hx('#A8381A'), (len(P), 1)), ao=False)
    if costra:
        for k in range(0, len(pts), 3):
            for s in (-1, 1):
                q = pts[k] + Nl[k] * s * (w[k] + 0.03)
                C.monticulo(p, (q[0], q[1], 0), (0.06 + 0.03 * rng.random(), 0.05 + 0.03 * rng.random()), 0.025 + 0.02 * rng.random(),
                            semilla + k * 2 + (s > 0), p_volcan(semilla + k), 40, terrones=0)


# --------------------------------------------------------------------------
# Paredes
# --------------------------------------------------------------------------

def roca_base_minas(semilla, aplanar=None, carbon=0.0, rocas=2):
    def fn():
        p = Pieza('pared_blanda', 'pared', dureza='blanda', huella=[1, 1], alto=1.5)
        arriba = p_techo_roca()
        C.bloque_roca(p, semilla, C.pintor_pared(p_roca(semilla, carbon), arriba), arriba, rug=0.05, estratos=0.03, amp_var=0.035,
                      angular=0.25, aplanar=aplanar)
        if rocas:
            C.roca_base(p, semilla, p_roca(semilla + 1), n=rocas, tam=(0.08, 0.16))
        C.piedritas_techo(p, semilla, p_roca(semilla + 2), n=3, amp_var=0.035)
        return p
    return fn


def pared_entibado(semilla):
    """Roca con entibado de madera en el frente: dos postes, tablones y una viga."""
    def fn():
        plano = lambda q: (q[:, 1] < -0.3) * suave(0.1, 0.0, np.maximum(np.abs(q[:, 0]) - 0.48, q[:, 2] - 1.3))
        p = roca_base_minas(semilla, plano, rocas=0)()
        y = -0.6
        rng = B.azar(semilla)
        for k, x in enumerate((-0.4, 0.4)):
            tabla(p, (x, y - 0.03, 0.62), (0.055, 0.05, 0.66), semilla=semilla + k, tris=110)
        for k, z in enumerate(np.arange(0.12, 1.2, 0.17)):
            tabla(p, (rng.uniform(-0.02, 0.02), y + 0.03, z), (0.5, 0.018, 0.075), B.rot_euler(0, rng.uniform(-0.03, 0.03), 0),
                  semilla=semilla + 10 + k, tris=70, eje=0)
        tabla(p, (0, y - 0.04, 1.3), (0.52, 0.06, 0.06), semilla=semilla + 30, tris=100, eje=0)
        remaches(p, [(x, y - 0.09, z) for x in (-0.4, 0.4) for z in (0.3, 0.9, 1.3)], 0.014, semilla)
        return p
    return fn


def pared_pico(semilla):
    """Roca con veta de carbón y un pico clavado."""
    def fn():
        p = roca_base_minas(semilla, carbon=1.0)()
        R = B.rot_euler(0.3, 0.0, 0.2)
        o = np.array([0.15, -0.62, 0.95])
        Vm, Fm = B.cilindro_m((0, 0, 0), (0, -0.55, -0.15), 0.017, seg=6)
        p.parte(Vm @ R.T + o, Fm, 'madera', p_madera(semilla, eje=1))
        cabeza = B.union(B.cono_r((-0.2, 0, 0.02), (0, 0, 0), 0.008, 0.028), B.cono_r((0.2, 0, -0.02), (0, 0, 0), 0.012, 0.028), k=0.01)
        V, F = B.malla_sdf(cabeza, (-0.25, -0.05, -0.06), (0.25, 0.05, 0.06), 0.008, 140, 1)
        p.parte(V @ (R @ B.rot_euler(0, 0, 0.0)).T + o + R @ np.array([0, 0.04, 0.01]), F, 'hierro', p_hierro(semilla))
        return p
    return fn


def pared_dura(semilla, flejes=False):
    """Roca dura oscura con venas rojas (y en la variante b, flejes de hierro remachados)."""
    def fn():
        p = Pieza('pared_dura', 'pared', dureza='dura', huella=[1, 1], alto=1.5)
        pie = B.piedra('#5A4044', '#2A1E20', claro='#7A5A5E', escala=2.4, humedad=0.2, semilla=semilla, vetas=0.6, color_vetas='#A0201A')

        def arriba(P, N):
            return pie(P * np.array([1, 1, 0]) + np.array([0, 0, 0]), N)
        top = C.pintor_techo(lambda rn, s: (lambda P, N: mezclar(hx('#2E2224'), hx('#6A4E52'), np.clip(0.55 + 0.6 * rn(P, 3, 3, s + 1), 0, 1))
                                            * (1 - 0.5 * suave(0.9, 0.975, 1 - np.abs(rn(P, 2, 2, s + 7))))[:, None]), 0)
        C.bloque_roca(p, semilla, C.pintor_pared(pie, top), top, rug=0.05, estratos=0.0, angular=0.7, escala_rug=2.6, amp_var=0.03)
        C.roca_base(p, semilla, pie, n=2, tam=(0.09, 0.16))
        if flejes:
            for k, z in enumerate((0.35, 1.0)):
                V, F = B.caja_m((0, -0.61, z), (0.5, 0.012, 0.045))
                p.parte(V, F, 'hierro', p_hierro(semilla + k))
                remaches(p, [(x, -0.625, z) for x in (-0.4, -0.15, 0.1, 0.35)], 0.012, semilla + k)
        return p
    return fn


def pared_borde(semilla):
    """Roca volcánica del borde con grietas de lava en el frente."""
    def fn():
        p = Pieza('pared_borde', 'pared', dureza='borde', huella=[1, 1], alto=1.6)
        pint = p_volcan(semilla)
        C.bloque_roca(p, semilla, pint, pint, alto=1.55, rug=0.06, estratos=0.0, angular=0.7, escala_rug=2.4, amp_var=0.05)
        C.roca_base(p, semilla, pint, n=2, tam=(0.1, 0.18))
        # grieta de lava que baja por el frente
        rng = B.azar(semilla)
        x = rng.uniform(-0.2, 0.2)
        pts = [(x, -0.6, 1.3), (x + 0.08, -0.61, 0.9), (x - 0.05, -0.62, 0.5), (x + 0.05, -0.63, 0.1)]
        V, F = B.tubo_m(pts, [0.018, 0.025, 0.02, 0.03], seg=5, muestras=3)
        p.parte(V, F, 'lava', lambda P, N: np.tile(hx('#FF6A1A'), (len(P), 1)), ao=False)
        return p
    return fn


# --------------------------------------------------------------------------
# Pisos
# --------------------------------------------------------------------------

def p_suelo(cosas, semilla):
    def p(P, N):
        n = C.fbm_piso(P, 1, 4, 700)
        col = mezclar(hx(TIERRA_OSC), hx(TIERRA), np.clip(0.5 + 0.8 * n, 0, 1))
        col = mezclar(col, hx('#8A5A40'), suave(0.2, 0.5, C.ruido_piso(P, 3, 701)) * 0.4)
        grava = suave(0.5, 0.65, C.ruido_piso(P, 14, 702))
        col = mezclar(col, hx('#5A3E34'), grava * 0.6)
        carbon = suave(0.25, 0.5, C.fbm_piso(P, 2, 3, 703))
        col = mezclar(col, hx('#2A2220'), carbon * 0.45)
        col = col * (1 + 0.1 * C.ruido_piso(P, 18, 704))[:, None]
        if 'sangre' in cosas:
            col = mezclar(col, hx('#5A1414'), suave(0.2, 0.45, C.fbm_piso(P, 2, 2, semilla + 5)) * 0.5 * (C.interior_piso(P)))
        return col
    return p


def alto_suelo(P):
    return 0.035 * C.fbm_piso(P, 1, 3, 710) + 0.015 * C.fbm_piso(P, 5, 2, 711)


def piso_mina(semilla, cosas, peso=1.0):
    def fn():
        p = Pieza('piso', 'piso', huella=[2, 2], peso=peso)
        p.ao = dict(rayos=8, dist=0.12, fuerza=0.6, suelo=False)
        p.bordes = dict(claro=0.18, oscuro=0.18, escala=2.0)
        C.piso_campo(p, alto_suelo, p_suelo(cosas, semilla), 22)
        rng = B.azar(semilla)
        C.escombros(p, (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), 0.0), 0.35, 5, semilla + 9, pintor=p_roca(semilla), tam=(0.03, 0.07))
        if 'cristales' in cosas:
            for k in range(3):
                c = np.array([rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), 0.0])
                C.racimo_cristales(p, c, np.array([rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), 1.0]), semilla + 20 + k, tam=0.45, cuantos=(2, 4))
        if 'tablas' in cosas:
            for k in range(4):
                tabla(p, (-0.45 + k * 0.28 + rng.uniform(-0.03, 0.03), rng.uniform(-0.1, 0.1), 0.02), (0.11, 0.6 + rng.uniform(-0.1, 0.05), 0.018),
                      B.rot_euler(0, 0, rng.uniform(-0.08, 0.08)), semilla=semilla + 30 + k, tris=60, eje=1)
        if 'lava' in cosas:
            a = rng.uniform(0, 3)
            d = np.array([math.cos(a), math.sin(a), 0])
            t = np.array([-d[1], d[0], 0])
            pts = [d * -0.6 + t * 0.05, d * -0.25 - t * 0.08, d * 0.1 + t * 0.06, d * 0.45 - t * 0.04, d * 0.65]
            lava_tira(p, pts, 0.05, semilla)
        if 'sangre' in cosas:
            CE.charco(p, (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3)), (0.32, 0.24), semilla, z_agua=0.04)
            p.partes[-2]['mat'] = 'sangre'
            p.partes[-2]['pintor'] = lambda P, N: np.tile(hx('#4A0A0C'), (len(P), 1))
        return p
    return fn


# --------------------------------------------------------------------------
# Rieles
# --------------------------------------------------------------------------

TROCHA = 0.25  # medio ancho entre rieles


def via(p, curva, semilla, roto=False, fin=False):
    """Durmientes y rieles de 1 m: recta a lo largo de Y, o curva de 90° del borde -Y al borde +X."""
    rng = B.azar(semilla)
    met = p_hierro(semilla, 0.5)
    if curva:
        cc = np.array([0.5, -0.5])

        def punto(t, r):
            a = math.pi - t * math.pi / 2  # de (0.5 - r, -0.5) hacia (0.5, -0.5 + r)
            return np.array([cc[0] + r * math.cos(a), cc[1] + r * math.sin(a)])

        def tangente(t):
            a = math.pi - t * math.pi / 2
            return np.array([math.sin(a), -math.cos(a)])
        ts = np.linspace(0, 1, 13)
    else:
        def punto(t, r):
            return np.array([0.5 - r, -0.5 + t])

        def tangente(t):
            return np.array([0.0, 1.0])
        ts = np.linspace(0, 1, 5)
    # durmientes
    nd = 3
    for k in range(nd):
        t = (k + 0.5) / nd
        c = punto(t, 0.5)
        tg = tangente(t)
        ang = math.atan2(tg[1], tg[0]) + math.pi / 2
        if roto and k == 1:
            tabla(p, (c[0] + 0.05, c[1], 0.03), (0.2, 0.06, 0.025), B.rot_euler(0.1, 0.05, ang + 0.4), semilla=semilla + k, tris=60, eje=0)
            continue
        tabla(p, (c[0], c[1], 0.025), (0.4, 0.07, 0.025), B.rot_euler(0, 0, ang + rng.uniform(-0.06, 0.06)), semilla=semilla + k, tris=70, eje=0)
    # rieles: perfil en T barrido
    for s in (-1, 1):
        pts = []
        for t in ts:
            c = punto(t, 0.5 + s * TROCHA)
            z = 0.075
            if roto and s > 0:
                z += 0.12 * suave(0.35, 0.95, t) * (1 if t > 0.3 else 0)
            pts.append((c[0], c[1], z))
        if roto and s > 0:
            pts = [(q[0] + 0.15 * suave(0.4, 1.0, ts[i]), q[1], q[2]) for i, q in enumerate(pts)]
        perf = [(-0.012, -0.022), (0.012, -0.022), (0.004, -0.015), (0.004, 0.006), (0.014, 0.01), (0.014, 0.022), (-0.014, 0.022), (-0.014, 0.01),
                (-0.004, 0.006), (-0.004, -0.015)]
        Vs, Fs = barrido(pts, perf)
        p.parte(Vs, Fs, 'hierro', met)
    # clavos
    clav = []
    for k in range(nd):
        t = (k + 0.5) / nd
        for s in (-1, 1):
            for e in (-1, 1):
                c = punto(t, 0.5 + s * TROCHA + e * 0.025)
                clav.append((c[0], c[1], 0.05))
    remaches(p, clav, 0.01, semilla)
    if fin:
        # tope: dos postes y un travesaño
        for s in (-1, 1):
            tabla(p, (0.5 - 0.5 + s * 0.3, 0.35, 0.25), (0.06, 0.06, 0.25), semilla=semilla + 40 + (s > 0), tris=80)
        tabla(p, (0.0, 0.3, 0.38), (0.42, 0.07, 0.08), semilla=semilla + 45, tris=100, eje=0)
        tabla(p, (0.0, 0.42, 0.18), (0.38, 0.05, 0.05), B.rot_euler(0.5, 0, 0), semilla=semilla + 46, tris=60, eje=0)
        for x in (-0.25, 0.25):
            V, F = B.cilindro_m((x, 0.22, 0.38), (x, 0.18, 0.38), 0.06, seg=8)
            p.parte(V, F, 'hierro', met)


def barrido(pts, perfil):
    """Barre un perfil 2D (x lateral, z) a lo largo de una polilínea casi horizontal."""
    pts = np.asarray(pts, float)
    T = np.gradient(pts, axis=0)
    T /= np.maximum(np.linalg.norm(T, axis=1), 1e-9)[:, None]
    L = np.stack([-T[:, 1], T[:, 0], np.zeros(len(T))], 1)
    L /= np.maximum(np.linalg.norm(L, axis=1), 1e-9)[:, None]
    m = len(perfil)
    V = []
    for i, q in enumerate(pts):
        for x, z in perfil:
            V.append(q + L[i] * x + np.array([0, 0, z]))
    F = []
    for i in range(len(pts) - 1):
        for k in range(m):
            a, b = i * m + k, i * m + (k + 1) % m
            a2, b2 = a + m, b + m
            F += [(a, b, b2), (a, b2, a2)]
    # tapas
    V = np.array(V)
    for i0, sgn in ((0, -1), (len(pts) - 1, 1)):
        c = len(V)
        V = np.vstack([V, V[i0 * m:(i0 + 1) * m].mean(0)])
        for k in range(m):
            a, b = i0 * m + k, i0 * m + (k + 1) % m
            F.append((c, b, a) if sgn < 0 else (c, a, b))
    F = np.array(F)
    # normales hacia afuera: comparar con el centro de cada anillo
    cen = np.repeat(pts, m, axis=0)
    n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    lado = (V[F[:, 0]][: len(n)] - np.concatenate([cen, pts[[0, -1]]])[F[:, 0]])
    if ((n * lado).sum(1) < 0).mean() > 0.5:
        F = F[:, ::-1]
    return V, F


def riel(nombre, curva=False, roto=False, fin=False, semilla=801):
    def fn():
        p = Pieza(nombre, 'deco', huella=[1, 1], alto=0.6 if fin else 0.12, lugar='suelo', solido=fin, girar=False, riel=True)
        p.ao = dict(rayos=8, dist=0.12, fuerza=0.6, suelo=True)
        via(p, curva, semilla, roto, fin)
        C.escombros(p, (0.1, 0.0, 0.0), 0.4, 3, semilla + 50, pintor=p_roca(semilla), tam=(0.025, 0.045))
        return p
    return fn


# --------------------------------------------------------------------------
# Decoración
# --------------------------------------------------------------------------

def carga_mineral(p, c, ancho, largo, semilla):
    """Mineral apilado: rocas rojizas y cristales de sangre que asoman."""
    rng = B.azar(semilla)
    blobs = [B.esfera((c[0] + rng.uniform(-ancho, ancho) * 0.7, c[1] + rng.uniform(-largo, largo) * 0.7, c[2] + rng.uniform(-0.02, 0.05)),
                      rng.uniform(0.06, 0.1)) for _ in range(9)]
    f = B.desplazar(B.union(*blobs, k=0.03), 0.015, 12, 2, semilla)
    f2 = lambda P: np.maximum(f(P), np.maximum(np.abs(P[:, 0] - c[0]) - ancho, np.abs(P[:, 1] - c[1]) - largo))
    p.sdf(f2, (c[0] - ancho - 0.05, c[1] - largo - 0.05, c[2] - 0.12), (c[0] + ancho + 0.05, c[1] + largo + 0.05, c[2] + 0.16), 0.014, 300,
          'piedra', p_roca(semilla))
    for k in range(3):
        q = np.array([c[0] + rng.uniform(-ancho, ancho) * 0.6, c[1] + rng.uniform(-largo, largo) * 0.6, c[2] + 0.05])
        C.racimo_cristales(p, q, np.array([rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), 1.0]), semilla + 10 + k, tam=0.5, cuantos=(2, 4))


def vagoneta(volcada=False):
    nombre = 'deco_vagoneta_volcada' if volcada else 'deco_vagoneta'
    p = Pieza(nombre, 'deco', huella=[1, 1] if not volcada else [1, 2], alto=0.75, lugar='libre', solido=True)
    met = p_hierro(811, 0.55)
    # caja trapezoidal hueca
    def caja(P):
        z = P[:, 2] - 0.2
        w = 0.26 + 0.07 * np.clip(z / 0.4, 0, 1)
        l = 0.38 + 0.06 * np.clip(z / 0.4, 0, 1)
        ext = np.maximum(np.maximum(np.abs(P[:, 0]) - w, np.abs(P[:, 1]) - l), np.maximum(-z, z - 0.42))
        inn = np.maximum(np.maximum(np.abs(P[:, 0]) - (w - 0.025), np.abs(P[:, 1]) - (l - 0.025)), -(z - 0.03))
        return np.maximum(ext, -inn)
    bandas = lambda P: np.maximum(np.abs(np.abs(P[:, 1]) - 0.2) - 0.025, np.abs(P[:, 2] - 0.4) - 0.22) - 0.0

    def f(P):
        d = caja(P)
        aro = np.maximum(caja(P * np.array([0.97, 0.97, 1.0])) - 0.012, np.minimum(bandas(P), np.abs(P[:, 2] - 0.6) - 0.025))
        return np.minimum(d, aro) + 0.003 * B.fbm(P, 20, 2, 812)
    V, F = B.malla_sdf(f, (-0.4, -0.5, 0.15), (0.4, 0.5, 0.68), 0.011, 1300, 1)
    partes = [(V, F, 'hierro', met)]
    # ruedas y ejes
    for y in (-0.24, 0.24):
        Ve, Fe = B.cilindro_m((-0.3, y, 0.11), (0.3, y, 0.11), 0.018, seg=6)
        partes.append((Ve, Fe, 'hierro', met))
        for x in (-TROCHA, TROCHA):
            Vr, Fr = B.torno_m([(0.0, -0.025), (0.08, -0.025), (0.1, -0.012), (0.1, 0.012), (0.08, 0.025), (0.0, 0.025)], seg=12)
            Vr = Vr @ B.rot_y(math.pi / 2).T + np.array([x, y, 0.1])
            partes.append((Vr, Fr, 'hierro', p_hierro(813, 0.4)))
    remaches_pts = [(sx * 0.27, sy * 0.395, z) for sx in (-1, 1) for sy in (-1, 1) for z in (0.3, 0.5)]
    if volcada:
        R = B.rot_euler(0, 1.75, 0.3)
        o = np.array([0.05, 0.1, 0.33])
        for V, F, m, pint in partes:
            p.parte((V - np.array([0, 0, 0.35])) @ R.T + o, F, m, pint)
        remaches(p, [tuple((np.array(q) - np.array([0, 0, 0.35])) @ R.T + o) for q in remaches_pts], 0.012, 814)
        carga_mineral(p, (-0.3, -0.3, 0.02), 0.28, 0.4, 815)
        via(p, False, 816)
    else:
        for V, F, m, pint in partes:
            p.parte(V, F, m, pint)
        remaches(p, remaches_pts, 0.012, 814)
        carga_mineral(p, (0, 0, 0.55), 0.28, 0.38, 815)
        via(p, False, 816)
    return p


def puntal():
    """Marco de madera del entibado (contra la pared, 2 × 1 m): postes, viga, riostras y una lámpara apagada."""
    p = Pieza('deco_puntal', 'deco', huella=[2, 1], alto=1.95, lugar='pared', solido=True)
    rng = B.azar(821)
    for k, x in enumerate((-0.82, 0.82)):
        tabla(p, (x, 0.32, 0.9), (0.07, 0.07, 0.92), B.rot_euler(rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), 0), semilla=821 + k, tris=180)
        tabla(p, (x, 0.32, 0.02), (0.12, 0.12, 0.03), semilla=830 + k, tris=60, mat='piedra', pintor=p_roca(830 + k))
    tabla(p, (0, 0.32, 1.85), (1.0, 0.08, 0.08), semilla=823, tris=220, eje=0)
    for s in (-1, 1):
        tabla(p, (s * 0.62, 0.3, 1.62), (0.26, 0.04, 0.04), B.rot_euler(0, s * 0.75, 0), semilla=824 + (s > 0), tris=80, eje=0)
    remaches(p, [(x, 0.235, 1.85) for x in (-0.82, -0.3, 0.3, 0.82)] + [(x, 0.24, z) for x in (-0.82, 0.82) for z in (0.6, 1.2)], 0.014, 826)
    # tablas atravesadas detrás (contra la roca)
    for k, z in enumerate((0.5, 1.1)):
        tabla(p, (0, 0.44, z), (0.75, 0.015, 0.08), B.rot_euler(0, rng.uniform(-0.05, 0.05), 0), semilla=840 + k, tris=60, eje=0)
    C.escombros(p, (0.3, 0.0, 0.0), 0.3, 4, 845, pintor=p_roca(845), tam=(0.03, 0.06))
    return p


def cristal_grande():
    p = Pieza('deco_cristal_grande', 'deco', huella=[1, 1], alto=1.3, lugar='borde', solido=True, luz=dict(color='#FF2A3A', intensidad=0.8, alcance=4.0, particulas='ninguna'))
    C.monticulo(p, (0, 0, 0), (0.42, 0.38), 0.18, 851, p_roca(851), 400, terrones=6)
    rng = B.azar(852)
    tam = [1.1, 0.85, 0.6, 0.5, 0.42, 0.35, 0.3, 0.25, 0.2, 0.18]
    for k, largo in enumerate(tam):
        a = rng.uniform(0, 6.28) if k else 0.0
        d = 0.0 if k == 0 else rng.uniform(0.08, 0.3)
        base = np.array([math.cos(a) * d, math.sin(a) * d, 0.04])
        n = np.array([math.cos(a) * (0.15 + d * 1.2), math.sin(a) * (0.15 + d * 1.2), 1.0])
        r = largo * 0.12
        V, F = C.cristal_m(largo, r, 6, 0.28)
        M = C.marco(n)
        V = (V @ B.rot_z(rng.uniform(0, 1)).T) @ M.T + base
        col = hx('#B01828')
        p.parte(V, F, 'cristal_sangre', lambda P, N: mezclar(col * 0.4, np.clip(col * 1.8, 0, 1), suave(0.0, 1.1, P[:, 2]) * 0.6 + 0.4 * suave(-0.3, 0.9, N[:, 2])), ao=False)
    p.vacio('llama', (0, 0, 0.6))
    return p


def cristal_chico():
    p = Pieza('deco_cristal_chico', 'deco', huella=[1, 1], alto=0.45, lugar='libre', solido=False)
    C.monticulo(p, (0, 0, 0), (0.22, 0.2), 0.08, 861, p_roca(861), 200, terrones=4)
    C.racimo_cristales(p, np.array([0, 0, 0.04]), np.array([0, 0, 1.0]), 862, tam=1.0, cuantos=(4, 6))
    C.racimo_cristales(p, np.array([0.15, 0.1, 0.0]), np.array([0.5, 0.3, 1.0]), 863, tam=0.6, cuantos=(2, 3))
    return p


def lava_grieta():
    p = Pieza('deco_lava_grieta', 'deco', huella=[1, 1], alto=0.05, lugar='suelo', solido=False, luz=LUZ_LAVA)
    lava_tira(p, [(-0.45, -0.3, 0), (-0.15, -0.1, 0), (0.05, 0.05, 0), (0.25, 0.0, 0), (0.45, 0.25, 0)], 0.05, 871)
    lava_tira(p, [(0.05, 0.05, 0), (0.0, 0.25, 0), (-0.1, 0.42, 0)], 0.03, 872)
    p.vacio('llama', (0.0, 0.0, 0.15))
    return p


def lava_charco():
    """Pozo de lava con costra que flota y orilla de roca volcánica."""
    p = Pieza('deco_lava_charco', 'deco', huella=[1, 1], alto=0.15, lugar='libre', solido=True, peligro=True, luz=LUZ_LAVA)
    n = 18
    rng = B.azar(881)
    V = [(0, 0, 0.04)]
    for k in range(n):
        a = 2 * np.pi * k / n
        r = 0.36 * (1 + 0.15 * math.sin(a * 3 + 1) + 0.05 * rng.uniform(-1, 1))
        V.append((math.cos(a) * r, math.sin(a) * r * 0.85, 0.04))
    F = [(0, 1 + k, 1 + (k + 1) % n) for k in range(n)]
    p.parte(np.array(V), np.array(F), 'lava', lambda P, N: np.tile(hx('#A8381A'), (len(P), 1)), ao=False)
    C.monticulo(p, (0, 0, 0), (0.48, 0.42), 0.11, 882, p_volcan(882), 500, terrones=7, hueco=0.75)
    for k in range(4):
        a = rng.uniform(0, 6.28)
        c = (math.cos(a) * 0.15, math.sin(a) * 0.12, 0.04)
        f = B.desplazar(B.elipsoide(c, (rng.uniform(0.04, 0.08), rng.uniform(0.03, 0.06), 0.015)), 0.005, 20, 2, 883 + k)
        p.sdf(f, np.array(c) - 0.1, np.array(c) + 0.1, 0.008, 60, 'piedra', p_volcan(883 + k))
    p.vacio('llama', (0.0, 0.0, 0.2))
    return p


def pico_roca():
    p = Pieza('deco_pico', 'deco', huella=[1, 1], alto=0.7, lugar='libre', solido=True)
    f = B.desplazar(B.caja((0, 0, 0.12), (0.22, 0.18, 0.16), r=0.08, R=B.rot_euler(0.1, 0.1, 0.4)), 0.025, 6, 3, 891)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.02)), (-0.35, -0.3, -0.03), (0.35, 0.3, 0.35), 0.014, 400, 'piedra', p_roca(891, carbon=0.0))
    R = B.rot_euler(0.5, 0.1, 0.6)
    o = np.array([0.0, 0.0, 0.26])
    Vm, Fm = B.cilindro_m((0, 0, 0), (0, 0, 0.6), 0.018, seg=6)
    p.parte(Vm @ R.T + o, Fm, 'madera', p_madera(892))
    cabeza = B.union(B.cono_r((-0.2, 0, 0.02), (0, 0, 0), 0.008, 0.028), B.cono_r((0.2, 0, -0.02), (0, 0, 0), 0.012, 0.028), k=0.01)
    V, F = B.malla_sdf(cabeza, (-0.25, -0.05, -0.06), (0.25, 0.05, 0.06), 0.008, 140, 1)
    p.parte(V @ (R @ B.rot_x(math.pi / 2)).T + o + R @ np.array([0, 0, 0.6]), F, 'hierro', p_hierro(893))
    C.escombros(p, (0.0, -0.1, 0.0), 0.35, 6, 894, pintor=p_roca(894), tam=(0.03, 0.06))
    return p


def barril(p, c, semilla, alto=0.55, r=0.2, tumbado=False, a=0.0):
    perf = [(0.0, 0.0), (r * 0.85, 0.0), (r, alto * 0.25), (r * 1.06, alto * 0.5), (r, alto * 0.75), (r * 0.85, alto), (r * 0.78, alto - 0.01),
            (r * 0.78, alto - 0.025), (0.0, alto - 0.025)]
    V, F = B.torno_m(perf, seg=14)
    aros = []
    for t in (0.12, 0.38, 0.62, 0.88):
        rr = np.interp(t * alto, [q[1] for q in perf[:6]], [q[0] for q in perf[:6]])
        aros.append(B.toro_m((0, 0, t * alto), rr + 0.004, 0.008, seg=14, seg2=3))
    R = B.rot_euler(math.pi / 2, 0, a) if tumbado else B.rot_z(a)
    off = np.array([0, 0, r]) if tumbado else np.zeros(3)
    if tumbado:
        V = V - np.array([0, 0, alto / 2])
    pint = B.madera(MADERA, MADERA_OSC, eje=2, podrida=0.25, semilla=semilla)

    def duelas(P, N):
        col = pint(P, N)
        ang = np.arctan2(P[:, 1] - c[1], P[:, 0] - c[0])
        return col * (1 - 0.3 * suave(0.85, 0.98, np.abs(np.sin(ang * 8))))[:, None]
    p.parte(V @ R.T + np.asarray(c) + off, F, 'madera', duelas)
    for Va, Fa in aros:
        if tumbado:
            Va = Va - np.array([0, 0, alto / 2])
        p.parte(Va @ R.T + np.asarray(c) + off, Fa, 'hierro', p_hierro(semilla))


def barriles():
    p = Pieza('deco_barriles', 'deco', huella=[1, 1], alto=0.6, lugar='libre', solido=True)
    barril(p, (-0.15, 0.1, 0), 901)
    barril(p, (0.22, 0.15, 0), 902, 0.5, 0.18)
    barril(p, (0.05, -0.25, 0), 903, 0.5, 0.18, tumbado=True, a=0.4)
    return p


def cajas_dinamita():
    p = Pieza('deco_cajas_dinamita', 'deco', huella=[1, 1], alto=0.7, lugar='libre', solido=True)
    rng = B.azar(911)
    for k, (c, h, a) in enumerate([((-0.12, 0.08, 0.17), (0.24, 0.18, 0.17), 0.1), ((0.22, 0.12, 0.13), (0.17, 0.15, 0.13), -0.3),
                                   ((-0.08, 0.1, 0.48), (0.18, 0.14, 0.14), 0.25)]):
        R = B.rot_z(a)

        def f(P, h=h):
            caja = B.caja((0, 0, 0), h, r=0.01)(P)
            tablas_ = 0.006 * suave(0.85, 0.97, np.abs(np.sin(P[:, 2] * math.pi / (h[2] / 1.5))))
            marco = np.maximum(np.abs(P[:, 0]) - h[0] - 0.008, np.maximum(np.abs(P[:, 1]) - h[1] - 0.008, np.abs(np.abs(P[:, 2]) - h[2] + 0.025) - 0.022))
            return np.minimum(caja + tablas_, marco)
        V, F = B.malla_sdf(f, tuple(-np.array(h) - 0.03), tuple(np.array(h) + 0.03), 0.01, 320, 0)
        p.parte(B.transformar(V, c, R), F, 'madera', B.madera('#9A7650', '#4A3420', eje=0, podrida=0.2, semilla=911 + k))
        # equis pintada en rojo (peligro) en el frente
        z0 = c[2]
        for s in (-1, 1):
            Vx, Fx = B.caja_m((0, 0, 0), (h[0] * 0.55, 0.004, 0.012), B.rot_y(s * 0.6))
            p.parte(B.transformar(Vx, R @ np.array([0, -h[1] - 0.004, 0]) + np.array([c[0], c[1], z0]), R), Fx, 'tela', B.liso('#8A1A14'), ao=False)
    # cartuchos regados
    for k in range(4):
        a = rng.uniform(0, 6.28)
        q = np.array([0.2 + math.cos(a) * 0.18, -0.22 + math.sin(a) * 0.1, 0.022])
        d = np.array([math.cos(a + 1.3), math.sin(a + 1.3), 0])
        V, F = B.cilindro_m(q - d * 0.08, q + d * 0.08, 0.02, seg=7)
        p.parte(V, F, 'tela', B.manchado('#A82A20', '#5A1410', 10, semilla=920 + k))
        Vm, Fm = B.tubo_m([q + d * 0.08, q + d * 0.12 + (0, 0, 0.03), q + d * 0.16 + (0, 0.02, 0.0)], 0.003, seg=3, muestras=2)
        p.parte(Vm, Fm, 'tela', B.liso('#2A2420'))
    return p


def carretilla():
    p = Pieza('deco_carretilla', 'deco', huella=[1, 1], alto=0.6, lugar='libre', solido=True)
    R = B.rot_z(0.5)

    def bandeja(P):
        z = P[:, 2] - 0.28
        w = 0.2 + 0.08 * np.clip(z / 0.22, 0, 1)
        l = 0.26 + 0.1 * np.clip(z / 0.22, 0, 1)
        ext = np.maximum(np.maximum(np.abs(P[:, 0]) - w, np.abs(P[:, 1] + 0.05) - l), np.maximum(-z, z - 0.22))
        inn = np.maximum(np.maximum(np.abs(P[:, 0]) - (w - 0.02), np.abs(P[:, 1] + 0.05) - (l - 0.02)), -(z - 0.02))
        return np.maximum(ext, -inn) + 0.003 * B.fbm(P, 20, 2, 931)
    V, F = B.malla_sdf(bandeja, (-0.35, -0.48, 0.24), (0.35, 0.4, 0.54), 0.011, 700, 1)
    p.parte(V @ R.T, F, 'hierro', p_hierro(931, 0.65))
    for s in (-1, 1):
        Vm, Fm = B.tubo_m([(s * 0.16, -0.38, 0.12), (s * 0.18, 0.0, 0.3), (s * 0.2, 0.55, 0.36)], 0.018, seg=5, muestras=3)
        p.parte(Vm @ R.T, Fm, 'madera', p_madera(932))
        Vl, Fl = B.cilindro_m((s * 0.17, 0.3, 0.3), (s * 0.18, 0.32, 0.0), 0.014, seg=5)
        p.parte(Vl @ R.T, Fl, 'hierro', p_hierro(933))
    Vr, Fr = B.torno_m([(0.0, -0.03), (0.1, -0.03), (0.12, -0.015), (0.12, 0.015), (0.1, 0.03), (0.0, 0.03)], seg=12)
    p.parte((Vr @ B.rot_y(math.pi / 2).T + np.array([0, -0.42, 0.12])) @ R.T, Fr, 'hierro', p_hierro(934, 0.4))
    carga_mineral(p, R @ np.array([0, -0.05, 0.47]), 0.2, 0.26, 935)
    return p


def polea():
    """Torno de madera con manivela, soga y balde (borde)."""
    p = Pieza('deco_polea', 'deco', huella=[1, 1], alto=1.7, lugar='borde', solido=True)
    for k, x in enumerate((-0.4, 0.4)):
        tabla(p, (x, 0.0, 0.8), (0.055, 0.055, 0.8), semilla=941 + k, tris=140)
        tabla(p, (x, 0.0, 0.06), (0.08, 0.3, 0.05), semilla=943 + k, tris=80, eje=1)
        for s in (-1, 1):
            tabla(p, (x, s * 0.17, 0.35), (0.03, 0.03, 0.3), B.rot_euler(s * 0.55, 0, 0), semilla=945 + k + s, tris=50)
    tabla(p, (0, 0, 1.62), (0.48, 0.055, 0.055), semilla=950, tris=120, eje=0)
    # rodillo con soga enrollada
    V, F = B.cilindro_m((-0.36, 0, 1.25), (0.36, 0, 1.25), 0.06, seg=10)
    p.parte(V, F, 'madera', p_madera(951, eje=0))
    for k in range(9):
        Vt, Ft = B.toro_m((-0.15 + k * 0.035, 0, 1.25), 0.07, 0.012, seg=10, seg2=4, eje=(1, 0, 0))
        p.parte(Vt, Ft, 'tela', B.liso('#8A7454'))
    Vm, Fm = B.tubo_m([(0.42, 0, 1.25), (0.52, 0, 1.25), (0.52, -0.15, 1.15), (0.55, -0.16, 1.15)], 0.014, seg=5, muestras=2)
    p.parte(Vm, Fm, 'hierro', p_hierro(952))
    # soga que baja al balde
    Vs, Fs = B.cilindro_m((0.05, -0.07, 1.25), (0.05, -0.07, 0.62), 0.01, seg=5)
    p.parte(Vs, Fs, 'tela', B.liso('#8A7454'))
    V, F = B.torno_m([(0.0, 0.32), (0.11, 0.32), (0.13, 0.55), (0.12, 0.55), (0.1, 0.34), (0.0, 0.34)], seg=12, c=(0.05, -0.07, 0.0))
    p.parte(V, F, 'madera', p_madera(953))
    Va, Fa = B.toro_m((0.05, -0.07, 0.6), 0.12, 0.006, seg=10, seg2=3, eje=(1, 0, 0))
    p.parte(Va, Fa, 'hierro', p_hierro(954))
    return p


def escalera():
    p = Pieza('deco_escalera', 'deco', huella=[1, 1], alto=1.7, lugar='pared', solido=False)
    R = B.rot_x(-0.28)
    o = np.array([0, 0.22, 0])
    for s in (-1, 1):
        V, F = B.malla_sdf(B.desplazar(B.caja((s * 0.2, 0, 0.85), (0.025, 0.02, 0.86), r=0.008), 0.003, 25, 2, 961 + s), (s * 0.2 - 0.05, -0.05, -0.05),
                           (s * 0.2 + 0.05, 0.05, 1.76), 0.01, 120, 0)
        p.parte(V @ R.T + o, F, 'madera', p_madera(961 + s))
    for k in range(6):
        if k == 3:
            continue
        z = 0.2 + k * 0.27
        V, F = B.cilindro_m((-0.2, 0, z), (0.2, 0, z), 0.016, seg=6)
        p.parte(V @ R.T + o, F, 'madera', p_madera(965 + k, eje=0))
    V, F = B.cilindro_m((-0.2, 0, 1.01), (0.05, 0.02, 0.93), 0.016, seg=6)
    p.parte(V @ R.T + o, F, 'madera', p_madera(972, eje=0))
    return p


def esqueleto_minero():
    """Esqueleto de minero tirado con su casco y su pico (se camina encima)."""
    p = Pieza('deco_esqueleto_minero', 'deco', huella=[1, 1], alto=0.18, lugar='suelo', solido=False)
    Vc, Fc = C.calavera(1.0, 260)
    p.parte(B.transformar(Vc, (-0.25, 0.05, 0.0), B.rot_euler(0.0, -1.2, 0.3)), Fc, 'hueso', B.hueso(semilla=981))
    casco = B.union(B.cortar(B.esfera((0, 0, 0), 0.1), lambda P: -P[:, 2]), B.cilindro((0, 0, 0), (0, 0, 0.012), 0.125, borde=0.004))
    V, F = B.malla_sdf(casco, (-0.14, -0.14, -0.02), (0.14, 0.14, 0.12), 0.008, 220, 1)
    p.parte(B.transformar(V, (-0.36, -0.15, 0.06), B.rot_euler(0.5, 0.9, 0.4)), F, 'hierro', B.metal('#8A6A3A', oxido='#5A3A1A', cant=0.5, semilla=982))
    for k in range(5):
        a0 = np.array([-0.1, -0.08 + k * 0.045, 0.012])
        V, F = B.tubo_m([a0, a0 + (0.08, 0.0, 0.05), a0 + (0.16, 0.01, 0.01)], [0.008, 0.007, 0.005], seg=4, muestras=3)
        p.parte(V, F, 'hueso', B.hueso(semilla=983 + k))
    C.huesos_suelo(p, (0.2, 0.0), 0.25, 4, 990)
    Vm, Fm = B.cilindro_m((0.05, 0.3, 0.02), (0.45, 0.05, 0.02), 0.017, seg=6)
    p.parte(Vm, Fm, 'madera', p_madera(995))
    cabeza = B.union(B.cono_r((-0.2, 0, 0.02), (0, 0, 0), 0.008, 0.028), B.cono_r((0.2, 0, -0.02), (0, 0, 0), 0.012, 0.028), k=0.01)
    V, F = B.malla_sdf(cabeza, (-0.25, -0.05, -0.06), (0.25, 0.05, 0.06), 0.008, 140, 1)
    p.parte(B.transformar(V, (0.45, 0.05, 0.03), B.rot_euler(math.pi / 2, 0, 2.2)), F, 'hierro', p_hierro(996))
    return p


def sacos():
    p = Pieza('deco_sacos', 'deco', huella=[1, 1], alto=0.5, lugar='libre', solido=True)
    rng = B.azar(1001)
    for k, (c, a) in enumerate([((-0.15, 0.05, 0.0), 0.3), ((0.18, 0.1, 0.0), -0.4), ((0.0, 0.05, 0.22), 1.2)]):
        cuerpo = B.desplazar(B.elipsoide((0, 0, 0.14), (0.16, 0.22, 0.14)), 0.012, 10, 3, 1001 + k)
        nudo = B.elipsoide((0, 0.22, 0.16), (0.05, 0.06, 0.05))
        f = B.union(cuerpo, nudo, k=0.04)
        f2 = lambda P, f=f: np.maximum(f(P), -(P[:, 2] + 0.0))
        V, F = B.malla_sdf(f2, (-0.22, -0.3, -0.01), (0.22, 0.32, 0.32), 0.012, 380, 1)
        p.parte(B.transformar(V, c, B.rot_z(a)), F, 'tela', B.manchado('#9A8460', '#5A4A32', 9, semilla=1001 + k))
    for k in range(4):
        q = np.array([rng.uniform(-0.3, 0.3), rng.uniform(-0.35, -0.2), 0.0])
        C.racimo_cristales(p, q, np.array([0.2, -0.3, 1.0]), 1010 + k, tam=0.25, cuantos=(1, 3))
    return p


def mesa_minero():
    """Banco de trabajo con herramientas, mapa y lámpara (contra la pared)."""
    p = Pieza('deco_mesa_minero', 'deco', huella=[2, 1], alto=0.95, lugar='pared', solido=True)
    tabla(p, (0, 0.2, 0.72), (0.75, 0.25, 0.03), semilla=1021, tris=200, eje=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            tabla(p, (sx * 0.68, 0.2 + sy * 0.19, 0.35), (0.035, 0.035, 0.36), semilla=1022 + sx + sy, tris=60)
    tabla(p, (0, 0.2, 0.2), (0.68, 0.02, 0.03), semilla=1030, tris=50, eje=0)
    # herramientas y cosas encima
    Vm, Fm = B.cilindro_m((-0.5, 0.1, 0.77), (-0.15, 0.25, 0.77), 0.016, seg=6)
    p.parte(Vm, Fm, 'madera', p_madera(1031))
    V, F = B.caja_m((-0.12, 0.27, 0.79), (0.07, 0.02, 0.035), B.rot_z(0.4))
    p.parte(V, F, 'hierro', p_hierro(1032))
    V, F = B.caja_m((0.2, 0.18, 0.755), (0.2, 0.14, 0.002), B.rot_z(-0.15))
    p.parte(V, F, 'tela', B.manchado('#B8A47A', '#7A6440', 6, semilla=1033))
    barril(p, (0.55, 0.3, 0.75), 1034, 0.18, 0.07)
    carga_mineral(p, (-0.45, 0.32, 0.8), 0.12, 0.08, 1035)
    lampara(p, (0.35, 0.3, 0.75), 1036, colgada=False)
    p.extras['luz'] = LUZ_LAMPARA
    return p


def lampara(p, c, semilla, colgada=True):
    """Lámpara de minero (aceite): base, vidrio, techito y asa; la llama adentro."""
    c = np.asarray(c, float)
    met = B.metal('#5A4A30', oxido='#5A3A1A', cant=0.4, semilla=semilla)
    V, F = B.torno_m([(0.0, 0.0), (0.06, 0.0), (0.065, 0.03), (0.045, 0.04), (0.0, 0.04)], seg=10, c=c)
    p.parte(V, F, 'hierro', met)
    V, F = B.torno_m([(0.04, 0.04), (0.045, 0.12), (0.03, 0.15)], seg=10, c=c)
    p.parte(V, F, 'vidrio_luz', lambda P, N: np.tile(hx('#E8A860'), (len(P), 1)), ao=False)
    V, F = B.torno_m([(0.06, 0.15), (0.03, 0.19), (0.0, 0.2)], seg=10, c=c)
    p.parte(V, F, 'hierro', met)
    for k in range(3):
        a = 2 * np.pi * k / 3
        q = c + np.array([math.cos(a) * 0.05, math.sin(a) * 0.05, 0])
        V, F = B.cilindro_m(q + (0, 0, 0.04), q + (0, 0, 0.16), 0.004, seg=4)
        p.parte(V, F, 'hierro', met)
    V, F = B.toro_m(c + (0, 0, 0.24), 0.04, 0.005, seg=8, seg2=3, eje=(1, 0, 0))
    p.parte(V, F, 'hierro', met)
    p.llama(c + (0, 0, 0.085), 0.7)


# --------------------------------------------------------------------------
# Luces
# --------------------------------------------------------------------------

def luz_antorcha():
    """Antorcha clavada en un poste de madera con abrazadera."""
    p = Pieza('luz_antorcha', 'luz', huella=[1, 1], alto=1.5, lugar='libre', solido=True, luz=LUZ_ANTORCHA)
    tabla(p, (0, 0, 0.55), (0.05, 0.05, 0.58), semilla=1041, tris=120)
    V, F = B.cilindro_m((0, -0.06, 1.0), (0, -0.06, 1.12), 0.02, seg=6)
    p.parte(V @ B.rot_x(-0.25).T + np.array([0, -0.03, 0.02]), F, 'madera', p_madera(1042))
    for z in (0.9, 1.05):
        V, F = B.toro_m((0, -0.06, z), 0.035, 0.008, seg=8, seg2=3)
        p.parte(V, F, 'hierro', p_hierro(1043))
    remaches(p, [(0, -0.055, 0.9), (0, -0.055, 1.05)], 0.012, 1044)
    C.antorcha_cabeza(p, (0, -0.1, 1.12), 1045, 0.9)
    C.monticulo(p, (0, 0, 0), (0.15, 0.15), 0.06, 1046, p_tierra(1046), 120, terrones=3)
    return p


def luz_vela():
    p = Pieza('luz_vela', 'luz', huella=[1, 1], alto=0.35, lugar='libre', solido=False, luz=LUZ_VELA)
    f = B.desplazar(B.caja((0, 0, 0.09), (0.18, 0.15, 0.1), r=0.06, R=B.rot_z(0.3)), 0.015, 8, 3, 1051)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.02)), (-0.26, -0.24, -0.03), (0.26, 0.24, 0.22), 0.012, 300, 'piedra', p_roca(1051))
    C.charco_cera(p, (0.02, 0.0, 0.18), 0.12, 1052)
    C.vela(p, (0.04, 0.02, 0.18), 0.14, 0.028, 1053)
    C.vela(p, (-0.07, -0.04, 0.18), 0.08, 0.024, 1054)
    C.vela(p, (0.18, -0.18, 0.0), 0.1, 0.026, 1055)
    C.racimo_cristales(p, np.array([-0.18, 0.12, 0.0]), np.array([-0.3, 0.3, 1.0]), 1056, tam=0.35, cuantos=(2, 3))
    return p


def luz_lampara():
    """Lámpara de minero colgada de un poste en ele."""
    p = Pieza('luz_lampara', 'luz', huella=[1, 1], alto=1.9, lugar='borde', solido=True, luz=LUZ_LAMPARA)
    tabla(p, (0, 0.15, 0.9), (0.055, 0.055, 0.95), semilla=1061, tris=150)
    tabla(p, (0, -0.08, 1.8), (0.04, 0.27, 0.04), semilla=1062, tris=80, eje=1)
    tabla(p, (0, 0.02, 1.62), (0.025, 0.14, 0.025), B.rot_x(0.75), semilla=1063, tris=50, eje=1)
    C.cadena(p, [(0, -0.3, 1.76), (0, -0.3, 1.52)], 0.05, 0.007, semilla=1064)
    lampara(p, (0, -0.3, 1.25), 1065)
    C.monticulo(p, (0, 0.15, 0), (0.18, 0.18), 0.07, 1066, p_tierra(1066), 140, terrones=3)
    return p


def luz_brasero():
    """Brasero de hierro con brasas sobre tres patas."""
    p = Pieza('luz_brasero', 'luz', huella=[1, 1], alto=0.85, lugar='libre', solido=True, luz=LUZ_BRASERO)
    met = p_hierro(1071, 0.5)
    V, F = B.torno_m([(0.0, 0.5), (0.08, 0.5), (0.24, 0.6), (0.27, 0.72), (0.25, 0.72), (0.22, 0.63), (0.0, 0.62)], seg=14)
    p.parte(V, F, 'hierro', met)
    for k in range(3):
        a = 2 * np.pi * k / 3
        d = np.array([math.cos(a), math.sin(a), 0])
        Vb, Fb = B.tubo_m([d * 0.08 + (0, 0, 0.52), d * 0.2 + (0, 0, 0.3), d * 0.28 + (0, 0, 0.0)], 0.017, seg=5, muestras=3)
        p.parte(Vb, Fb, 'hierro', met)
    for k in range(10):
        a = 2 * np.pi * k / 10
        V, F = B.cilindro_m((math.cos(a) * 0.255, math.sin(a) * 0.255, 0.72), (math.cos(a) * 0.27, math.sin(a) * 0.27, 0.8), 0.008, seg=4, r2=0.001)
        p.parte(V, F, 'hierro', met)
    brasas = [B.esfera((math.cos(a) * r, math.sin(a) * r, 0.66), 0.05) for a, r in [(0, 0), (1, 0.12), (2.5, 0.14), (4, 0.13), (5.2, 0.1)]]
    f = B.desplazar(B.union(*brasas, k=0.03), 0.01, 20, 2, 1072)
    V, F = B.malla_sdf(f, (-0.22, -0.22, 0.58), (0.22, 0.22, 0.74), 0.01, 300, 1)
    p.parte(V, F, 'brasa', lambda P, N: mezclar(hx('#2A1410'), hx('#FF5A1A'), suave(0.4, 0.9, B.ruido(P, 25, 1073) * 0.5 + 0.5)), ao=False)
    p.llama((0.0, 0.0, 0.72), 3.0)
    p.llama((0.1, 0.06, 0.7), 2.0)
    return p


PIEZAS = {
    'pared_blanda_a': roca_base_minas(1101),
    'pared_blanda_b': pared_entibado(1102),
    'pared_blanda_c': pared_pico(1103),
    'pared_dura_a': pared_dura(1104),
    'pared_dura_b': pared_dura(1105, flejes=True),
    'pared_borde': pared_borde(1106),
    'veta_hierro': C.veta(roca_base_minas(1107, rocas=1), 'hierro', 1107),
    'veta_sangre': C.veta(roca_base_minas(1108, rocas=1), 'sangre', 1108),
    'veta_oro': C.veta(roca_base_minas(1109, rocas=1), 'oro', 1109),
    'piso_a': piso_mina(1111, [], peso=3),
    'piso_b': piso_mina(1112, ['cristales'], peso=1.5),
    'piso_c': piso_mina(1113, ['tablas'], peso=1),
    'piso_d': piso_mina(1114, ['lava'], peso=0.5),
    'piso_e': piso_mina(1115, ['sangre'], peso=1),
    'deco_riel_recto': riel('deco_riel_recto'),
    'deco_riel_curva': riel('deco_riel_curva', curva=True, semilla=802),
    'deco_riel_fin': riel('deco_riel_fin', fin=True, semilla=803),
    'deco_riel_roto': riel('deco_riel_roto', roto=True, semilla=804),
    'deco_vagoneta': lambda: vagoneta(False),
    'deco_vagoneta_volcada': lambda: vagoneta(True),
    'deco_puntal': puntal,
    'deco_cristal_grande': cristal_grande,
    'deco_cristal_chico': cristal_chico,
    'deco_lava_grieta': lava_grieta,
    'deco_lava_charco': lava_charco,
    'deco_pico': pico_roca,
    'deco_barriles': barriles,
    'deco_cajas_dinamita': cajas_dinamita,
    'deco_carretilla': carretilla,
    'deco_polea': polea,
    'deco_escalera': escalera,
    'deco_esqueleto_minero': esqueleto_minero,
    'deco_sacos': sacos,
    'deco_mesa_minero': mesa_minero,
    'luz_antorcha': luz_antorcha,
    'luz_vela': luz_vela,
    'luz_lampara': luz_lampara,
    'luz_brasero': luz_brasero,
}
