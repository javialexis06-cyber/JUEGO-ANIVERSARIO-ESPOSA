"""Sangre y Ceniza · El Castillo del Conde: granito oscuro, mármol negro y rojo con filetes de oro, tapices con
el emblema del Conde, armaduras, retratos, banquete, trono, ataúd, fuente de sangre, chimeneas y candelabros.

Todo en el origen (centro de la base), el frente hacia -Y. El emblema del Conde (un murciélago dorado sobre una
gota) se repite en tapices, estandartes, alfombra y piso.
"""
import math

import numpy as np

import sangre_biomas_abadia as AB
import sangre_biomas_base as B
import sangre_biomas_catacumbas as CA
import sangre_biomas_cementerio as CE
import sangre_biomas_comun as C
import sangre_biomas_minas as MI
from sangre_biomas_base import Pieza, hx, mezclar, suave

GRANITO = '#66626E'
GRANITO_OSC = '#2E2C34'
MARMOL_N = '#2A2428'
MARMOL_R = '#5A1E26'
ORO = '#C09A44'
ROJO = '#7A121C'
ROJO_OSC = '#3A060C'
MADERA_OSC = '#3A2418'
SANGRE = '#4A060A'

LUZ_VELA = dict(color='#FFB866', intensidad=0.8, alcance=4.0, particulas='fuego')
LUZ_CANDELABRO = dict(color='#FFB060', intensidad=1.1, alcance=5.5, particulas='fuego')
LUZ_FUEGO = dict(color='#FF8A3A', intensidad=1.6, alcance=7.0, particulas='fuego')
LUZ_ANTORCHA = dict(color='#FF9A45', intensidad=1.2, alcance=6.0, particulas='fuego')


# --------------------------------------------------------------------------
# Pintores y emblema
# --------------------------------------------------------------------------

def p_granito(semilla, sangre=0.0):
    pie = B.piedra(GRANITO, GRANITO_OSC, claro='#86828E', escala=2.4, humedad=0.3, semilla=semilla, vetas=0.35, color_vetas='#1E1C22')

    def p(P, N):
        col = pie(P, N)
        moteado = suave(0.6, 0.8, B.ruido(P, 30, semilla + 4))
        col = mezclar(col, hx('#A8A4B0'), moteado * 0.25)
        if sangre > 0:
            chorro = suave(0.55, 0.8, B.ruido(P * np.array([5.0, 5.0, 0.4]), 3, semilla + 5)) * suave(0.0, 0.6, P[:, 2])
            col = mezclar(col, hx(SANGRE), chorro * sangre)
        return col
    return p


def p_techo_granito():
    def fabrica(rn, s):
        def p(P, N):
            col = mezclar(hx(GRANITO_OSC), hx('#7A7682'), np.clip(0.55 + 0.6 * rn(P, 3, 3, s + 1), 0, 1))
            polvo = suave(0.25, 0.65, rn(P, 2, 2, s + 2))
            col = mezclar(col, hx('#5A5458'), polvo * 0.5)
            grava = suave(0.55, 0.7, rn(P, 16, 1, s + 3))
            col = mezclar(col, hx('#24222A'), grava * 0.5)
            grieta = suave(0.9, 0.975, 1 - np.abs(rn(P, 2, 2, s + 7)))
            return col * (1 - 0.5 * grieta)[:, None]
        return p
    return C.pintor_techo(fabrica, 0)


def p_oro(semilla):
    return B.metal(ORO, oxido='#5A4020', cant=0.2, escala=6, semilla=semilla, brillo='#F4D88A')


def p_madera(semilla, eje=2):
    return B.madera('#4A2E1E', '#1A0E08', eje=eje, podrida=0.1, semilla=semilla)


def p_terciopelo(semilla):
    return B.manchado(ROJO, ROJO_OSC, escala=8, fuerza=0.5, semilla=semilla)


def emblema(u, v):
    """Emblema del Conde en coordenadas (u, v) de -1 a 1: murciélago dorado sobre una gota. Devuelve 0..1."""
    gota = np.hypot(u, (v + 0.25) * 1.1) < 0.45
    gota |= (np.abs(u) < 0.45 * (1 - (v + 0.25) / 0.95)) & (v > -0.25) & (v < 0.7)
    cuerpo = np.hypot(u / 0.12, (v - 0.1) / 0.3) < 1
    alas = (np.abs(u) < 0.85) & (np.abs(v - 0.15 - 0.25 * np.abs(u)) < 0.12 + 0.08 * np.cos(np.abs(u) * 14))
    orejas = (np.abs(np.abs(u) - 0.06) < 0.03) & (v > 0.35) & (v < 0.48)
    murcielago = cuerpo | alas | orejas
    return np.where(murcielago, 1.0, np.where(gota, 0.45, 0.0))


def tela(p, ancho, alto, nx, ny, origen, R, color_fn, pliegue=0.03, semilla=0, caida=None, mat='tela', dos_caras=True):
    """Tela de dos caras (tapiz, cortina, estandarte, mantel): rejilla en (u, v) con pliegues.
    color_fn(u, v) -> color sRGB (u, v en -1..1). caida(u, v) -> desplazamiento extra en z (cola de golondrina, flecos)."""
    us = np.linspace(-1, 1, nx + 1)
    vs = np.linspace(-1, 1, ny + 1)
    U, Vv = np.meshgrid(us, vs, indexing='ij')
    U, Vv = U.ravel(), Vv.ravel()
    y = pliegue * np.sin(U * ancho * 9 + 0.5 * np.sin(Vv * 3)) * (0.6 + 0.4 * (1 - Vv) / 2) + 0.01 * B.ruido(np.stack([U, Vv, 0 * U], 1), 3, semilla)
    X = U * ancho / 2
    Z = (Vv + 1) / 2 * alto
    if caida is not None:
        Z = Z + caida(U, Vv)
    L = np.stack([X, y, Z], 1)
    W = L @ np.asarray(R, float).T + np.asarray(origen, float)
    F = []
    for i in range(nx):
        for j in range(ny):
            a = i * (ny + 1) + j
            b = (i + 1) * (ny + 1) + j
            F += [(a, b, b + 1), (a, b + 1, a + 1)]
    F = np.array(F)
    cols = np.asarray(color_fn(U, Vv), float)
    n0 = np.cross(W[F[:, 1]] - W[F[:, 0]], W[F[:, 2]] - W[F[:, 0]]).mean(0)
    frente = np.asarray(R, float) @ np.array([0, -1.0, 0])
    if np.dot(n0, frente) < 0:
        F = F[:, ::-1]
    nv = len(W)
    if not dos_caras:
        p.parte(W, F, mat, lambda P, N, cols=cols: cols if len(P) == len(cols) else np.tile(cols.mean(0), (len(P), 1)))
        return
    Wf = W + (np.asarray(R, float) @ np.array([0, -0.002, 0]))
    Wb = W + (np.asarray(R, float) @ np.array([0, 0.002, 0]))
    Vall = np.vstack([Wf, Wb])
    Fall = np.vstack([F, F[:, ::-1] + nv])
    Call = np.vstack([cols, cols * 0.6])
    # el color va por índice de vértice (la pieza puede mover la tela después de crearla)
    p.parte(Vall, Fall, mat, lambda P, N, Call=Call: Call if len(P) == len(Call) else np.tile(Call.mean(0), (len(P), 1)))


def color_tapiz(semilla, base=ROJO, borde=ORO):
    def f(U, V):
        rng = np.clip(0.5 + 0.5 * B.ruido(np.stack([U * 3, V * 3, 0 * U], 1), 4, semilla), 0, 1)
        col = mezclar(hx(base) * 0.75, hx(base) * 1.1, rng)
        b = (np.abs(U) > 0.86) | (np.abs(V) > 0.9)
        fil = (np.abs(np.abs(U) - 0.8) < 0.025) | (np.abs(np.abs(V) - 0.84) < 0.02)
        col = np.where((b | fil)[:, None], hx(borde) * (0.85 + 0.2 * rng)[:, None], col)
        e = emblema(U / 0.6, (V - 0.1) / 0.5)
        col = np.where((e > 0.9)[:, None], hx(borde), np.where((e > 0.3)[:, None], hx(ROJO_OSC), col))
        return col
    return f


# --------------------------------------------------------------------------
# Paredes
# --------------------------------------------------------------------------

def escombro_castillo(semilla, sangre=0.0, rocas=3):
    def fn():
        p = Pieza('pared_blanda', 'pared', dureza='blanda', huella=[1, 1], alto=1.5)
        arriba = p_techo_granito()
        C.bloque_roca(p, semilla, C.pintor_pared(p_granito(semilla, sangre), arriba), arriba, rug=0.05, estratos=0.0, angular=0.65,
                      escala_rug=3.6, amp_var=0.035, bulto=0.08)
        rng = B.azar(semilla)
        V, N = C.malla_base(p)
        for k, (q, nq) in enumerate(C.puntos_superficie(V, N, rocas + 1, semilla + 3, zmin=0.1, zmax=1.4, sep=0.35)):
            h = (rng.uniform(0.09, 0.15), rng.uniform(0.07, 0.1), rng.uniform(0.06, 0.09))
            R = C.marco(nq + rng.normal(0, 0.4, 3)) @ B.rot_euler(rng.uniform(0, 0.5), rng.uniform(0, 0.5), rng.uniform(0, 3))
            AB.bloque_sillar(p, q - nq * 0.04, h, R, semilla + 10 + k, pintor=p_granito(semilla + 10 + k))
        C.piedritas_techo(p, semilla, p_granito(semilla + 2), n=3, amp_var=0.035)
        return p
    return fn


def pared_cortina(semilla):
    """Escombros con una cortina roja desgarrada que cuelga del frente."""
    def fn():
        plano = lambda q: (q[:, 1] < -0.3) * suave(0.1, 0.0, np.maximum(np.abs(q[:, 0]) - 0.45, -q[:, 2]))
        p = escombro_castillo(semilla, rocas=1)()
        rng = B.azar(semilla)

        def caida(U, V):
            return -0.25 * (1 - (V + 1) / 2) * (0.5 + 0.5 * np.sin(U * 7 + 1.0)) * (np.abs(np.sin(U * 13)) > 0.4)
        tela(p, 0.8, 1.15, 14, 18, (0.0, -0.64, 0.22), B.rot_z(0.0), lambda U, V: mezclar(hx(ROJO_OSC), hx(ROJO), np.clip(0.6 + 0.4 * np.sin(U * 20), 0, 1)),
             pliegue=0.035, semilla=semilla, caida=caida)
        V, F = B.cilindro_m((-0.48, -0.66, 1.4), (0.48, -0.66, 1.4), 0.018, seg=6)
        p.parte(V, F, 'oro', p_oro(semilla))
        del plano, rng
        return p
    return fn


def pared_sangre(semilla):
    def fn():
        p = escombro_castillo(semilla, sangre=0.8, rocas=2)()
        V, N = C.malla_base(p)
        for k, (q, nq) in enumerate(C.puntos_superficie(V, N, 1, semilla + 9, zmin=0.25, zmax=0.6, arriba=False, sep=0.3)):
            Vc, Fc = C.calavera(1.1, 240)
            p.parte(B.transformar(Vc, q - nq * 0.05, C.orientar(np.array([nq[0], nq[1], 0.15]))), Fc, 'hueso', B.hueso(semilla=semilla))
        # charco de sangre al pie del frente
        n = 12
        Vb = [(0.0, -0.75, 0.012)] + [(math.cos(2 * np.pi * k / n) * 0.22 * (1 + 0.2 * math.sin(k * 2.3)), -0.75 + math.sin(2 * np.pi * k / n) * 0.12, 0.012) for k in range(n)]
        p.parte(np.array(Vb), np.array([(0, 1 + k, 1 + (k + 1) % n) for k in range(n)]), 'sangre', lambda P, N: np.tile(hx(SANGRE), (len(P), 1)), ao=False)
        return p
    return fn


def muro_granito(semilla, estandarte=False):
    def fn():
        p = Pieza('pared_dura', 'pared', dureza='dura', huella=[1, 1], alto=1.5)
        g, _ = C.campo_muro(semilla, hiladas=5, junta=0.02, rug=0.006, desorden=0.006, bisel=0.022)
        V, F = C.malla_pared(g, 1100, voxel=0.02)
        p.parte(V, F, 'piedra', p_granito(semilla))
        if estandarte:
            V, F = B.cilindro_m((-0.32, -0.65, 1.38), (0.32, -0.65, 1.38), 0.016, seg=6)
            p.parte(V, F, 'oro', p_oro(semilla))
            for x in (-0.32, 0.32):
                Vb, Fb = B.malla_sdf(B.esfera((x, -0.65, 1.38), 0.03), (x - 0.04, -0.69, 1.34), (x + 0.04, -0.61, 1.42), 0.01, 40, 0)
                p.parte(Vb, Fb, 'oro', p_oro(semilla))

            def cola(U, V):
                return -0.18 * (1 - (V + 1) / 2) ** 3 * 0 + np.where(V < -0.7, -0.12 * (1 - np.abs(U)) * (-0.7 - V) / 0.3, 0.0)
            tela(p, 0.58, 1.05, 10, 16, (0.0, -0.655, 0.33), B.rot_z(0.0), color_tapiz(semilla), pliegue=0.02, semilla=semilla, caida=cola)
        return p
    return fn


def muro_borde(semilla):
    def fn():
        p = Pieza('pared_borde', 'pared', dureza='borde', huella=[1, 1], alto=1.6)
        g, _ = C.campo_muro(semilla, alto=1.55, hiladas=4, junta=0.025, rug=0.01, desorden=0.012, bisel=0.03)
        contrafuerte = B.union(B.caja((0, -0.66, 0.6), (0.16, 0.1, 0.6), r=0.02), B.caja((0, -0.62, 1.25), (0.16, 0.08, 0.3), r=0.02, R=B.rot_x(0.25)))
        g0 = g
        g = lambda P: np.minimum(g0(P), contrafuerte(P) + 0.004 * B.fbm(P, 10, 2, semilla))
        V, F = C.malla_pared(g, 1100, voxel=0.022)
        p.parte(V, F, 'piedra', p_granito(semilla, sangre=0.35))
        return p
    return fn


# --------------------------------------------------------------------------
# Pisos: mármol oscuro con filetes de oro
# --------------------------------------------------------------------------

def piso_marmol(semilla, cosas, peso=1.0):
    def fn():
        p = Pieza('piso', 'piso', huella=[2, 2], peso=peso)
        p.ao = dict(rayos=8, dist=0.1, fuerza=0.5, suelo=False)
        p.bordes = dict(claro=0.2, oscuro=0.2, escala=2.0)
        n = 2
        rects = [(-1 + 2 * i / n, -1 + 2 * j / n, -1 + 2 * (i + 1) / n, -1 + 2 * (j + 1) / n) for i in range(n) for j in range(n)]
        f = C.alto_losas(rects, semilla, junta=0.022, hundir=0.012, bisel=0.015, desnivel=0.004 if 'grietas' not in cosas else 0.015,
                         inclina=0.004 if 'grietas' not in cosas else 0.02)

        def alto(P):
            z, _ = f(P)
            return z

        def pint(P, N):
            z, idx = f(P)
            # cada losa: rombo rojo dentro de mármol negro, con vetas
            u = (P[:, 0] + 1) % 1.0 - 0.5
            v = (P[:, 1] + 1) % 1.0 - 0.5
            rombo = (np.abs(u) + np.abs(v)) < 0.34
            base = np.where(rombo[:, None], hx('#3E161C'), hx(MARMOL_N))
            vet = suave(0.82, 0.96, 1 - np.abs(C.ruido_piso(P, 3, 1600 + semilla) + 0.3 * C.ruido_piso(P, 9, 1601)))
            col = mezclar(base, hx('#7A7078'), vet * 0.5)
            filete = np.abs((np.abs(u) + np.abs(v)) - 0.34) < 0.012
            col = np.where(filete[:, None], hx('#8A6A2E'), col)
            if 'escudo' in cosas:
                e = emblema(P[:, 0] / 0.55, P[:, 1] / 0.55)
                circ = np.abs(np.hypot(P[:, 0], P[:, 1]) - 0.62) < 0.02
                col = np.where((e > 0.9)[:, None] | circ[:, None], hx(ORO), np.where((e > 0.3)[:, None], hx('#6A0A12'), col))
            if 'rastro' in cosas:
                r = suave(0.12, 0.03, np.abs(P[:, 0] - 0.15 * np.sin(P[:, 1] * 2.5))) * suave(0.85, 0.5, np.abs(P[:, 1])) * suave(-0.2, 0.4, C.ruido_piso(P, 6, 1602))
                col = mezclar(col, hx(SANGRE), r * 0.85)
            polvo = suave(0.2, 0.6, C.fbm_piso(P, 2, 3, 1603))
            col = mezclar(col, hx('#3E383A'), polvo * 0.3)
            junta = suave(-0.006, -0.011, z)
            return mezclar(col, hx('#0E0C0C'), junta)
        C.piso_campo(p, alto, pint, 32)
        rng = B.azar(semilla)
        if 'sangre' in cosas:
            c = (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3))
            nn = 16
            Vb = [(c[0], c[1], 0.008)] + [(c[0] + math.cos(2 * np.pi * k / nn) * 0.42 * (1 + 0.25 * math.sin(k * 1.7) + 0.1 * math.sin(k * 4.1)),
                                           c[1] + math.sin(2 * np.pi * k / nn) * 0.3 * (1 + 0.25 * math.cos(k * 2.3)), 0.008) for k in range(nn)]
            p.parte(np.array(Vb), np.array([(0, 1 + k, 1 + (k + 1) % nn) for k in range(nn)]), 'sangre', lambda P, N: np.tile(hx(SANGRE), (len(P), 1)), ao=False)
            for k in range(5):
                q = (c[0] + rng.uniform(-0.6, 0.6), c[1] + rng.uniform(-0.5, 0.5), 0.008)
                r = rng.uniform(0.02, 0.05)
                Vg = [q] + [(q[0] + math.cos(2 * np.pi * j / 8) * r, q[1] + math.sin(2 * np.pi * j / 8) * r, 0.008) for j in range(8)]
                p.parte(np.array(Vg), np.array([(0, 1 + j, 1 + (j + 1) % 8) for j in range(8)]), 'sangre', lambda P, N: np.tile(hx(SANGRE), (len(P), 1)), ao=False)
        if 'grietas' in cosas:
            C.escombros(p, (rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), 0), 0.35, 6, semilla + 3, pintor=p_granito(semilla), tam=(0.03, 0.07))
        return p
    return fn


# --------------------------------------------------------------------------
# Decoración
# --------------------------------------------------------------------------

def tapiz():
    """Tapiz grande con el emblema del Conde, colgado de una vara dorada sobre un soporte (contra la pared)."""
    p = Pieza('deco_tapiz', 'deco', huella=[1, 1], alto=2.3, lugar='pared', solido=False)
    for x in (-0.48, 0.48):
        V, F = B.torno_m([(0.0, 0.0), (0.09, 0.0), (0.07, 0.04), (0.02, 0.08), (0.018, 2.15), (0.035, 2.18), (0.0, 2.24)], seg=8, c=(x, 0.35, 0))
        p.parte(V, F, 'oro', p_oro(1701))
    V, F = B.cilindro_m((-0.52, 0.35, 2.1), (0.52, 0.35, 2.1), 0.02, seg=6)
    p.parte(V, F, 'oro', p_oro(1702))

    def flecos(U, V):
        return np.where(V < -0.95, -0.05 * (np.abs(np.sin(U * 40)) > 0.5), 0.0)
    tela(p, 0.88, 1.85, 16, 30, (0.0, 0.33, 0.22), B.rot_z(0.0), color_tapiz(1703), pliegue=0.03, semilla=1703, caida=flecos)
    return p


def armadura():
    """Armadura completa en su base de madera, con alabarda (contra la pared)."""
    p = Pieza('deco_armadura', 'deco', huella=[1, 1], alto=2.1, lugar='pared', solido=True)
    met = B.metal('#8A8A92', oxido='#4A3A2A', cant=0.2, escala=6, semilla=1711, brillo='#D8DCE4')
    base = B.caja((0, 0.05, 0.06), (0.28, 0.24, 0.06), r=0.015)
    MI.tabla(p, (0, 0.05, 0.06), (0.28, 0.24, 0.06), semilla=1712, tris=100, eje=0, pintor=p_madera(1712, 0))
    del base
    cuerpo = B.union(
        B.elipsoide((0, 0.05, 1.2), (0.2, 0.14, 0.24)),                        # peto
        B.esfera((0, 0.05, 1.58), 0.12), B.cilindro((0, 0.05, 1.46), (0, 0.05, 1.52), 0.08),  # yelmo y gola
        B.esfera((0.21, 0.05, 1.38), 0.09), B.esfera((-0.21, 0.05, 1.38), 0.09),  # hombreras
        B.capsula((0.24, 0.05, 1.34), (0.27, 0.0, 1.08), 0.055), B.capsula((-0.24, 0.05, 1.34), (-0.27, 0.0, 1.08), 0.055),
        B.capsula((0.27, 0.0, 1.06), (0.2, -0.12, 0.92), 0.05), B.capsula((-0.27, 0.0, 1.06), (-0.14, -0.1, 0.95), 0.05),
        B.esfera((0.19, -0.13, 0.9), 0.05), B.esfera((-0.13, -0.11, 0.93), 0.05),  # guanteletes
        B.cono_r((0, 0.05, 0.98), (0, 0.05, 0.84), 0.19, 0.21),                # faldar
        B.capsula((0.09, 0.05, 0.82), (0.1, 0.05, 0.48), 0.07), B.capsula((-0.09, 0.05, 0.82), (-0.1, 0.05, 0.48), 0.07),
        B.esfera((0.1, 0.02, 0.48), 0.07), B.esfera((-0.1, 0.02, 0.48), 0.07),  # rodilleras
        B.capsula((0.1, 0.05, 0.46), (0.1, 0.05, 0.17), 0.055), B.capsula((-0.1, 0.05, 0.46), (-0.1, 0.05, 0.17), 0.055),
        B.elipsoide((0.1, -0.02, 0.15), (0.06, 0.12, 0.04)), B.elipsoide((-0.1, -0.02, 0.15), (0.06, 0.12, 0.04)), k=0.02)
    visera = B.caja((0, -0.08, 1.6), (0.07, 0.03, 0.006))
    cresta = B.caja((0, 0.05, 1.7), (0.012, 0.11, 0.03), r=0.008)
    bandas = lambda P: 0.004 * suave(0.85, 0.97, np.abs(np.sin(P[:, 2] * 40))) * ((P[:, 2] > 0.84) & (P[:, 2] < 1.0))
    f = B.union(B.restar(cuerpo, visera), cresta)
    f2 = lambda P: f(P) + bandas(P)
    p.sdf(f2, (-0.38, -0.2, 0.1), (0.38, 0.25, 1.76), 0.01, 3200, 'hierro', met)
    # alabarda en la mano derecha
    V, F = B.cilindro_m((0.2, -0.13, 0.12), (0.2, -0.13, 2.0), 0.016, seg=6)
    p.parte(V, F, 'madera', p_madera(1713))
    hoja = B.union(B.cortar(B.cilindro((0.2, -0.14, 1.75), (0.2, -0.12, 1.75), 0.16), lambda P: 0.2 - P[:, 0]), B.cono_r((0.2, -0.13, 1.95), (0.2, -0.13, 2.12), 0.02, 0.002),
                   B.cono_r((0.2, -0.13, 1.75), (0.08, -0.13, 1.82), 0.025, 0.003))
    hoja = B.cortar(hoja, lambda P: np.abs(P[:, 1] + 0.13) - 0.006)
    p.sdf(hoja, (0.0, -0.2, 1.55), (0.42, -0.06, 2.15), 0.007, 300, 'hierro', met)
    # capa roja
    tela(p, 0.5, 1.2, 8, 14, (0.0, 0.2, 0.25), B.rot_z(0.0), lambda U, V: mezclar(hx(ROJO_OSC), hx(ROJO), np.clip(0.5 + 0.5 * np.sin(U * 12), 0, 1)), pliegue=0.03, semilla=1714)
    return p


def retrato():
    """Retrato del Conde en marco dorado recostado contra la pared (los ojos rojos brillan un poquito)."""
    p = Pieza('deco_retrato', 'deco', huella=[1, 1], alto=1.7, lugar='pared', solido=True)
    R = B.rot_x(-0.18)
    o = np.array([0, 0.3, 0.0])
    w, h = 0.42, 0.62
    marco = lambda P: np.maximum(np.maximum(np.abs(P[:, 0]) - w - 0.09, np.abs(P[:, 2] - h - 0.05) - h - 0.09),
                                 np.maximum(np.abs(P[:, 1]) - 0.035 + 0.02 * suave(w + 0.02, w + 0.09, np.maximum(np.abs(P[:, 0]), np.abs(P[:, 2] - h - 0.05) * w / h)),
                                            -np.maximum(np.abs(P[:, 0]) - w, np.abs(P[:, 2] - h - 0.05) - h)))
    tallas = lambda P: 0.006 * suave(0.6, 0.95, np.abs(np.sin(P[:, 0] * 50) * np.sin(P[:, 2] * 50)))
    V, F = B.malla_sdf(lambda P: marco(P) + tallas(P), (-w - 0.12, -0.06, -0.08), (w + 0.12, 0.06, 2 * h + 0.2), 0.009, 1600, 0)
    p.parte(V @ R.T + o, F, 'oro', p_oro(1721))

    def pintura(U, V):
        x, z = U * w, (V + 1) * h
        fondo = mezclar(hx('#1A1012'), hx('#3A1A1A'), np.clip(0.5 + 0.5 * B.ruido(np.stack([U * 2, V * 2, 0 * U], 1), 2, 3), 0, 1))
        cabeza = np.hypot(x / 0.13, (z - 0.92) / 0.17) < 1
        pelo = cabeza & (z > 0.98)
        cuerpo = (np.abs(x) < 0.32 - 0.1 * (z - 0.1)) & (z < 0.76)
        cuello = (np.abs(x) < 0.15) & (z > 0.62) & (z < 0.8) & (np.abs(x) > 0.04)
        ojos = (np.hypot(np.abs(x) - 0.05, z - 0.94) < 0.018)
        col = np.where(cuerpo[:, None], hx('#0A0808'), fondo)
        col = np.where(cuello[:, None], hx('#8A101A'), col)
        col = np.where(cabeza[:, None], hx('#C8B8B0'), col)
        col = np.where(pelo[:, None], hx('#0E0A0A'), col)
        col = np.where(ojos[:, None], hx('#FF2020'), col)
        return col
    tela(p, 2 * w, 2 * h, 18, 26, (0, 0.0, 0.05), np.eye(3), pintura, pliegue=0.0, semilla=1722)
    q = p.partes[-1]
    q['V'] = q['V'] @ R.T + o
    pint = q['pintor']
    q['pintor'] = lambda P, N, pint=pint: pint((P - o) @ R, N)
    return p


def mesa_banquete():
    """Mesa de banquete larga (2 × 1 m): mantel, candelabro encendido, copas, platos, botella y huesos."""
    p = Pieza('deco_mesa_banquete', 'deco', huella=[2, 1], alto=1.2, lugar='libre', solido=True, luz=LUZ_VELA)
    MI.tabla(p, (0, 0, 0.74), (0.9, 0.36, 0.035), semilla=1731, tris=260, eje=0, pintor=p_madera(1731, 0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            V, F = B.torno_m([(0.0, 0.0), (0.05, 0.0), (0.035, 0.08), (0.04, 0.3), (0.025, 0.45), (0.04, 0.6), (0.035, 0.71), (0.0, 0.71)], seg=8, c=(sx * 0.78, sy * 0.28, 0))
            p.parte(V, F, 'madera', p_madera(1732))

    mantel = lambda P: np.minimum(B.caja((0, 0, 0.778), (0.95, 0.38, 0.006), r=0.004)(P),
                                  np.maximum(np.maximum(np.abs(np.abs(P[:, 1]) - 0.385) - 0.006, np.abs(P[:, 0]) - 0.95),
                                             np.maximum(P[:, 2] - 0.78, 0.55 + 0.05 * np.sin(P[:, 0] * 17) - P[:, 2])))
    p.sdf(B.desplazar(mantel, 0.004, 12, 2, 1733), (-1.0, -0.42, 0.5), (1.0, 0.42, 0.8), 0.009, 900, 'tela',
          B.manchado('#C8BCA8', '#7A6E5A', 6, semilla=1733))
    # candelabro de tres brazos
    c = np.array([0.0, 0.0, 0.79])
    V, F = B.torno_m([(0.0, 0.0), (0.09, 0.0), (0.03, 0.05), (0.02, 0.32), (0.0, 0.32)], seg=10, c=c)
    p.parte(V, F, 'oro', p_oro(1734))
    for s in (-1, 0, 1):
        q0 = c + np.array([s * 0.16, 0, 0.36 if s == 0 else 0.3])
        if s:
            Vb, Fb = B.tubo_m([c + (0, 0, 0.22), c + (s * 0.1, 0, 0.2), q0 - (0, 0, 0.02)], 0.01, seg=5, muestras=3)
            p.parte(Vb, Fb, 'oro', p_oro(1735))
        C.vela(p, tuple(q0), 0.14, 0.018, 1736 + s, color='#D8CCB0')
    # copas, platos, botella, hueso y vino derramado
    rng = B.azar(1740)
    for k, x in enumerate((-0.7, -0.4, 0.35, 0.7)):
        y = 0.18 if k % 2 else -0.18
        V, F = B.torno_m([(0.0, 0.0), (0.12, 0.0), (0.13, 0.012), (0.0, 0.012)], seg=12, c=(x, y, 0.79))
        p.parte(V, F, 'piedra', B.liso('#C8C4BC'))
        V, F = B.torno_m([(0.0, 0.0), (0.035, 0.0), (0.008, 0.02), (0.007, 0.08), (0.035, 0.1), (0.04, 0.15), (0.0, 0.13)], seg=10, c=(x + 0.1, y - 0.12 * np.sign(y), 0.79))
        p.parte(V, F, 'oro', p_oro(1741 + k))
    Vh, Fh = C.hueso_m(0.18, 0.02, 80)
    p.parte(B.transformar(Vh, (-0.4, 0.18, 0.82), B.rot_z(0.4)), Fh, 'hueso', B.hueso(semilla=1745))
    V, F = B.torno_m([(0.0, 0.0), (0.045, 0.0), (0.045, 0.16), (0.015, 0.22), (0.015, 0.28), (0.0, 0.28)], seg=10)
    p.parte(V @ B.rot_euler(math.pi / 2, 0, 0.6).T + np.array([0.45, -0.12, 0.835]), F, 'piedra', B.liso('#1A3A2A'))
    nn = 10
    Vb = [(0.6, -0.25, 0.792)] + [(0.6 + math.cos(2 * np.pi * k / nn) * 0.12, -0.25 + math.sin(2 * np.pi * k / nn) * 0.08, 0.792) for k in range(nn)]
    p.parte(np.array(Vb), np.array([(0, 1 + k, 1 + (k + 1) % nn) for k in range(nn)]), 'sangre', lambda P, N: np.tile(hx(SANGRE), (len(P), 1)), ao=False)
    return p


def trono():
    """Trono del Conde: respaldo alto en punta, terciopelo rojo y remates dorados, sobre una tarima (contra la pared)."""
    p = Pieza('deco_trono', 'deco', huella=[1, 1], alto=2.0, lugar='pared', solido=True)
    tarima = B.union(B.caja((0, 0.05, 0.06), (0.45, 0.42, 0.06), r=0.012), B.caja((0, 0.1, 0.16), (0.38, 0.34, 0.05), r=0.012))
    p.sdf(B.desplazar(tarima, 0.003, 12, 2, 1751), (-0.5, -0.42, -0.02), (0.5, 0.5, 0.24), 0.012, 500, 'piedra', p_granito(1751))
    respaldo = lambda P: np.maximum(B.caja((0, 0.3, 1.15), (0.3, 0.05, 0.8), r=0.02)(P), (P[:, 2] - 1.75) + np.abs(P[:, 0]) * 1.2)
    asiento = B.caja((0, 0.05, 0.52), (0.3, 0.27, 0.06), r=0.02)
    patas = B.union(*[B.caja((sx * 0.27, sy, 0.38), (0.035, 0.035, 0.18), r=0.01) for sx in (-1, 1) for sy in (-0.18, 0.28)])
    brazos = B.union(*[B.caja((sx * 0.3, 0.05, 0.75), (0.035, 0.25, 0.025), r=0.01) for sx in (-1, 1)],
                     *[B.caja((sx * 0.3, -0.16, 0.65), (0.03, 0.03, 0.1), r=0.01) for sx in (-1, 1)])
    f = B.union(respaldo, asiento, patas, brazos)
    p.sdf(B.desplazar(f, 0.003, 16, 2, 1752), (-0.42, -0.3, 0.18), (0.42, 0.4, 1.82), 0.011, 1800, 'madera', p_madera(1752))
    cojin = B.union(B.caja((0, 0.04, 0.6), (0.26, 0.23, 0.035), r=0.03), B.caja((0, 0.24, 1.1), (0.24, 0.03, 0.5), r=0.03))
    p.sdf(cojin, (-0.32, -0.25, 0.5), (0.32, 0.32, 1.65), 0.011, 600, 'tela', p_terciopelo(1753))
    for q in [(0.3, -0.16, 0.77), (-0.3, -0.16, 0.77), (0.0, 0.3, 1.78), (0.3, 0.3, 1.45), (-0.3, 0.3, 1.45)]:
        V, F = B.malla_sdf(B.esfera(q, 0.04), np.array(q) - 0.05, np.array(q) + 0.05, 0.01, 50, 0)
        p.parte(V, F, 'oro', p_oro(1754))
    tela(p, 0.28, 0.32, 8, 8, (0.0, 0.265, 1.2), np.eye(3), lambda U, V: np.where((emblema(U, V) > 0.9)[:, None], hx(ORO), hx(ROJO)), pliegue=0.0, semilla=1755)
    return p


def ataud_conde():
    """Ataúd del Conde: laca negra con filetes dorados, tapa corrida, raso rojo y rosas secas, sobre su tarima (1 × 2 m)."""
    p = Pieza('deco_ataud_conde', 'deco', huella=[1, 2], alto=0.8, lugar='libre', solido=True)
    tarima = B.desplazar(B.caja((0, 0, 0.08), (0.48, 0.98, 0.08), r=0.015), 0.003, 12, 2, 1761)
    p.sdf(tarima, (-0.52, -1.0, -0.02), (0.52, 1.0, 0.18), 0.013, 400, 'piedra', p_granito(1761))

    def hexa(P, ancho=0.3, cabeza=0.22, pies=0.16, largo=0.85):
        y = P[:, 1]
        w = np.where(y > 0.35, cabeza + (ancho - cabeza) * (largo - y) / (largo - 0.35), pies + (ancho - pies) * (y + largo) / (largo + 0.35))
        return np.maximum(np.abs(P[:, 0]) - w, np.abs(y) - largo)
    caja_ext = lambda P: np.maximum(hexa(P), np.abs(P[:, 2] - 0.35) - 0.18)
    caja_int = lambda P: np.maximum(hexa(P) + 0.03, np.abs(P[:, 2] - 0.4) - 0.18)
    filete = lambda P: 0.004 * (np.abs(P[:, 2] - 0.48) < 0.012)
    f = lambda P: np.maximum(caja_ext(P), -caja_int(P)) - filete(P)
    lac = B.manchado('#141012', '#060406', escala=6, fuerza=0.3, semilla=1762)

    def pint(P, N):
        col = lac(P, N)
        oro = (np.abs(P[:, 2] - 0.48) < 0.014) | (np.abs(P[:, 2] - 0.2) < 0.01)
        return np.where(oro[:, None], hx(ORO), col)
    p.sdf(f, (-0.4, -0.95, 0.15), (0.4, 0.95, 0.55), 0.011, 1300, 'madera', pint)
    # raso rojo adentro
    Vr = np.array([(-0.25, -0.8, 0.24), (0.25, -0.8, 0.24), (0.25, 0.8, 0.24), (-0.25, 0.8, 0.24)])
    p.parte(Vr, np.array([(0, 1, 2), (0, 2, 3)]), 'tela', p_terciopelo(1763), ao=False)
    tapa = lambda P: np.maximum(hexa(P), np.abs(P[:, 2]) - 0.03)
    V, F = B.malla_sdf(tapa, (-0.35, -0.9, -0.05), (0.35, 0.9, 0.05), 0.011, 600, 0)
    V = V @ B.rot_z(0.18).T + np.array([0.18, -0.35, 0.56])
    p.parte(V, F, 'madera', lambda P, N: lac(P, N))
    cruz = B.union(B.caja((0, 0, 0), (0.02, 0.22, 0.008), r=0.004), B.caja((0, -0.08, 0), (0.1, 0.02, 0.008), r=0.004))
    V, F = B.malla_sdf(cruz, (-0.14, -0.26, -0.03), (0.14, 0.26, 0.03), 0.006, 120, 0)
    p.parte(V @ B.rot_z(0.18).T + np.array([0.18, -0.35, 0.595]), F, 'oro', p_oro(1764))
    # rosas secas
    rng = B.azar(1765)
    for k in range(4):
        c = np.array([rng.uniform(-0.35, 0.35), rng.uniform(0.85, 0.95) * (1 if k % 2 else -1), 0.17])
        V, F = B.malla_sdf(B.desplazar(B.esfera((0, 0, 0), 0.035), 0.01, 60, 2, 1766 + k), (-0.05, -0.05, -0.05), (0.05, 0.05, 0.05), 0.007, 60, 0)
        p.parte(V + c + (0, 0, 0.02), F, 'tela', B.manchado('#4A0A12', '#1A0206', 20, semilla=1770 + k))
        Vt, Ft = B.cilindro_m(c, c + (rng.uniform(-0.2, 0.2), rng.uniform(-0.1, 0.1), 0.0), 0.005, seg=4)
        p.parte(Vt, Ft, 'madera', B.liso('#2A3A1A'))
    return p


def alfombra():
    """Alfombra roja con borde dorado, a lo largo de Y (1 × 2 m; se encadena con otra igual)."""
    p = Pieza('deco_alfombra', 'deco', huella=[1, 2], alto=0.02, lugar='suelo', solido=False, girar=False)

    def color(U, V):
        x = U * 0.5
        col = mezclar(hx(ROJO) * 0.8, hx(ROJO) * 1.05, np.clip(0.5 + 0.5 * B.ruido(np.stack([U * 3, V * 6, 0 * U], 1), 3, 1781), 0, 1))
        borde = np.abs(x) > 0.4
        fil = np.abs(np.abs(x) - 0.34) < 0.012
        rombos = (np.abs(x) + np.abs(((V + 1) * 2) % 1.0 - 0.5) * 0.6) < 0.16
        col = np.where((borde | fil)[:, None], hx(ORO) * 0.85, col)
        col = np.where(rombos[:, None], hx(ROJO_OSC), col)
        return col
    tela(p, 0.95, 2.0, 10, 20, (0.0, -1.0, 0.012), B.rot_x(-math.pi / 2), color, pliegue=0.0, semilla=1782, dos_caras=False)
    q = p.partes[-1]
    q['V'][:, 2] = 0.012 + 0.006 * np.sin(q['V'][:, 0] * 9) * np.sin(q['V'][:, 1] * 3)
    return p


def estandarte():
    """Estandarte en asta con el emblema (borde)."""
    p = Pieza('deco_estandarte', 'deco', huella=[1, 1], alto=2.3, lugar='borde', solido=True)
    V, F = B.torno_m([(0.0, 0.0), (0.14, 0.0), (0.12, 0.05), (0.03, 0.1), (0.022, 2.2), (0.045, 2.22), (0.0, 2.3)], seg=8)
    p.parte(V, F, 'oro', p_oro(1791))
    V, F = B.cilindro_m((-0.3, 0, 2.1), (0.3, 0, 2.1), 0.014, seg=6)
    p.parte(V, F, 'oro', p_oro(1792))

    def cola(U, V):
        return np.where(V < -0.6, 0.25 * (np.abs(U) < 0.3) * (-0.6 - V) / 0.4, 0.0)
    tela(p, 0.56, 1.2, 10, 18, (0.0, -0.02, 0.88), np.eye(3), color_tapiz(1793), pliegue=0.025, semilla=1793, caida=cola)
    return p


def reloj():
    """Reloj de pie detenido a medianoche (contra la pared)."""
    p = Pieza('deco_reloj', 'deco', huella=[1, 1], alto=2.15, lugar='pared', solido=True)
    cuerpo = B.union(B.caja((0, 0.25, 0.12), (0.26, 0.18, 0.12), r=0.015), B.caja((0, 0.25, 0.9), (0.19, 0.14, 0.7), r=0.012),
                     B.caja((0, 0.25, 1.75), (0.25, 0.17, 0.2), r=0.015), B.cortar(B.cilindro((0, 0.08, 1.95), (0, 0.42, 1.95), 0.25, borde=0.01), lambda P: 1.95 - P[:, 2]))
    ventana = B.caja((0, 0.08, 0.95), (0.11, 0.04, 0.38), r=0.03)
    esfera = B.cilindro((0, 0.06, 1.75), (0, 0.1, 1.75), 0.16)
    f = B.restar(cuerpo, ventana, esfera)
    tallas = lambda P: 0.005 * suave(0.85, 0.97, np.abs(np.sin(P[:, 2] * 35))) * (P[:, 1] < 0.1)
    p.sdf(B.desplazar(lambda P: f(P) + tallas(P), 0.002, 16, 2, 1801), (-0.32, 0.0, -0.02), (0.32, 0.5, 2.25), 0.011, 1800, 'madera', p_madera(1801))
    V, F = B.torno_m([(0.0, 0.0), (0.16, 0.0)], seg=24)
    V = V @ B.rot_x(math.pi / 2).T + np.array([0, 0.1, 1.75])
    p.parte(V, F[:, ::-1], 'piedra', lambda P, N: mezclar(hx('#D8CCB0'), hx('#7A6A50'), suave(0.1, 0.16, np.hypot(P[:, 0], P[:, 2] - 1.75))), ao=False)
    for k in range(12):
        a = 2 * np.pi * k / 12
        Vm, Fm = B.caja_m((math.sin(a) * 0.13, 0.095, 1.75 + math.cos(a) * 0.13), (0.008, 0.003, 0.016), B.rot_y(-a))
        p.parte(Vm, Fm, 'hierro', B.liso('#1A1614'))
    for L in (0.11, 0.08):
        Vm, Fm = B.caja_m((0, 0.09, 1.75 + L / 2), (0.007, 0.004, L / 2))
        p.parte(Vm, Fm, 'hierro', B.liso('#1A1614'))
    V, F = B.cilindro_m((0, 0.15, 1.3), (0, 0.15, 0.75), 0.006, seg=4)
    p.parte(V, F, 'oro', p_oro(1802))
    V, F = B.cilindro_m((0, 0.13, 0.72), (0, 0.17, 0.72), 0.06, seg=12)
    p.parte(V, F, 'oro', p_oro(1803))
    Vf = np.array([(-0.11, 0.2, 0.58), (0.11, 0.2, 0.58), (0.11, 0.2, 1.33), (-0.11, 0.2, 1.33)])
    p.parte(Vf, np.array([(0, 1, 2), (0, 2, 3)]), 'madera', lambda P, N: np.tile(hx('#0E0A08'), (len(P), 1)), ao=False)
    return p


def espejo_roto():
    """Espejo alto con marco dorado: el vidrio roto en pedazos oscuros (no refleja a nadie)."""
    p = Pieza('deco_espejo_roto', 'deco', huella=[1, 1], alto=2.0, lugar='pared', solido=True)
    w, h, z0 = 0.34, 0.75, 0.25
    marco = lambda P: np.maximum(np.maximum(np.abs(P[:, 0]) - w - 0.07, np.abs(P[:, 2] - z0 - h) - h - 0.07),
                                 np.maximum(np.abs(P[:, 1] - 0.36) - 0.03, -np.maximum(np.abs(P[:, 0]) - w, np.abs(P[:, 2] - z0 - h) - h)))
    remate = B.cortar(B.cilindro((0, 0.33, z0 + 2 * h + 0.05), (0, 0.39, z0 + 2 * h + 0.05), 0.2, borde=0.01), lambda P: z0 + 2 * h + 0.05 - P[:, 2])
    patas = B.union(B.caja((0, 0.3, 0.1), (0.3, 0.15, 0.1), r=0.02), B.caja((0, 0.36, 0.18), (w + 0.07, 0.03, 0.08)))
    tallas = lambda P: 0.006 * suave(0.6, 0.95, np.abs(np.sin(P[:, 0] * 45) * np.sin(P[:, 2] * 45)))
    f = B.union(marco, remate, patas)
    p.sdf(lambda P: np.maximum(f(P) + tallas(P), -(P[:, 2] + 0.01)), (-0.5, 0.1, -0.02), (0.5, 0.45, z0 + 2 * h + 0.3), 0.01, 2200, 'oro', p_oro(1811))
    rng = B.azar(1812)
    # pedazos de vidrio que quedan en el marco
    for k in range(9):
        cx, cz = rng.uniform(-w + 0.08, w - 0.08), z0 + rng.uniform(0.1, 2 * h - 0.1)
        if abs(cx) < 0.12 and abs(cz - z0 - h) < 0.35:
            continue
        pts = [(cx + math.cos(a) * rng.uniform(0.06, 0.14), 0.335, cz + math.sin(a) * rng.uniform(0.06, 0.16)) for a in np.sort(rng.uniform(0, 6.28, 5))]
        V = np.array([(cx, 0.335, cz)] + pts)
        F = np.array([(0, 1 + j, 1 + (j + 1) % 5) for j in range(5)])
        p.parte(V, F[:, ::-1], 'agua', lambda P, N: np.tile(hx('#30343C'), (len(P), 1)), ao=False)
    Vf = np.array([(-w, 0.355, z0), (w, 0.355, z0), (w, 0.355, z0 + 2 * h), (-w, 0.355, z0 + 2 * h)])
    p.parte(Vf, np.array([(0, 1, 2), (0, 2, 3)]), 'madera', lambda P, N: np.tile(hx('#0A0808'), (len(P), 1)), ao=False)
    AB.vidrios(p, (0, 0.0), 0.3, 0, 1813)
    for k in range(8):
        a = rng.uniform(0, 6.28)
        q = np.array([math.cos(a) * rng.uniform(0, 0.35), -0.05 + math.sin(a) * 0.2, 0.01])
        s = rng.uniform(0.03, 0.07)
        V = np.array([q + (s, 0, 0), q + (-s * 0.5, s * 0.8, 0.003), q + (-s * 0.4, -s * 0.7, 0)])
        p.parte(V, np.array([(0, 1, 2)]), 'agua', lambda P, N: np.tile(hx('#3A3E48'), (len(P), 1)), ao=False)
    return p


def jarron():
    p = Pieza('deco_jarron', 'deco', huella=[1, 1], alto=1.1, lugar='libre', solido=True)
    V, F = B.torno_m([(0.0, 0.0), (0.16, 0.0), (0.12, 0.05), (0.08, 0.12), (0.18, 0.3), (0.24, 0.48), (0.2, 0.62), (0.1, 0.72), (0.09, 0.8),
                      (0.14, 0.86), (0.12, 0.88), (0.08, 0.82), (0.0, 0.8)], seg=16)
    pie = B.manchado('#1A1418', '#0A080A', 6, fuerza=0.3, semilla=1821)

    def pint(P, N):
        col = pie(P, N)
        oro = (np.abs(P[:, 2] - 0.3) < 0.02) | (np.abs(P[:, 2] - 0.62) < 0.015) | (np.abs(P[:, 2] - 0.86) < 0.015)
        ang = np.arctan2(P[:, 1], P[:, 0])
        vid = (np.abs(np.sin(ang * 6 + P[:, 2] * 10)) < 0.12) & (P[:, 2] > 0.32) & (P[:, 2] < 0.6)
        return np.where((oro | vid)[:, None], hx(ORO), col)
    p.parte(V, F, 'piedra', pint)
    rng = B.azar(1822)
    for k in range(6):
        a = rng.uniform(0, 6.28)
        q0 = np.array([math.cos(a) * 0.04, math.sin(a) * 0.04, 0.8])
        d = np.array([math.cos(a), math.sin(a), 0])
        tip = q0 + d * rng.uniform(0.1, 0.2) + (0, 0, rng.uniform(0.15, 0.3))
        cae = tip + d * 0.05 + (0, 0, -0.06)
        V, F = B.tubo_m([q0, (q0 + tip) / 2 + (0, 0, 0.04), tip, cae], [0.005, 0.004, 0.004, 0.003], seg=4, muestras=3)
        p.parte(V, F, 'madera', B.liso('#2A3220'))
        Vf, Ff = B.malla_sdf(B.desplazar(B.esfera(cae, 0.03), 0.008, 60, 2, 1823 + k), cae - 0.05, cae + 0.05, 0.007, 50, 0)
        p.parte(Vf, Ff, 'tela', B.manchado('#5A0A14', '#1A0206', 18, semilla=1830 + k))
    return p


def gargola():
    """Gárgola agazapada sobre su pedestal (borde)."""
    p = Pieza('deco_gargola', 'deco', huella=[1, 1], alto=1.55, lugar='borde', solido=True)
    zp = 0.6
    ped = B.union(B.caja((0, 0, 0.06), (0.3, 0.3, 0.06), r=0.015), B.caja((0, 0, 0.32), (0.22, 0.22, 0.24), r=0.015), B.caja((0, 0, zp - 0.03), (0.27, 0.27, 0.035), r=0.01))
    cuerpo = B.elipsoide((0, 0.04, zp + 0.3), (0.16, 0.2, 0.22), R=B.rot_x(0.4))
    cabeza = B.union(B.esfera((0, -0.16, zp + 0.52), 0.1), B.elipsoide((0, -0.25, zp + 0.48), (0.06, 0.08, 0.05)))
    cuernos = B.union(*[B.cono_r((s * 0.06, -0.12, zp + 0.6), (s * 0.12, -0.05, zp + 0.74), 0.025, 0.005) for s in (-1, 1)])
    orejas = B.union(*[B.cono_r((s * 0.09, -0.12, zp + 0.55), (s * 0.18, -0.1, zp + 0.6), 0.03, 0.004) for s in (-1, 1)])
    brazos = B.union(*[B.capsula((s * 0.13, -0.08, zp + 0.38), (s * 0.12, -0.2, zp + 0.06), 0.045) for s in (-1, 1)])
    garras = B.union(*[B.elipsoide((s * 0.12 + d, -0.24, zp + 0.03), (0.02, 0.05, 0.02)) for s in (-1, 1) for d in (-0.03, 0, 0.03)])
    piernas = B.union(*[B.elipsoide((s * 0.15, 0.08, zp + 0.14), (0.08, 0.14, 0.12)) for s in (-1, 1)])
    alas = B.union(*[(lambda s: (lambda P: B.elipsoide((s * 0.22, 0.18, zp + 0.55), (0.18, 0.04, 0.3), R=B.rot_euler(0.3, s * -0.5, s * 0.4))(P)
                                             + 0.01 * np.sin(P[:, 2] * 40)))(s) for s in (-1, 1)])
    cola = B.capsula((0, 0.22, zp + 0.08), (0.12, 0.3, zp + 0.02), 0.03)
    boca = B.caja((0, -0.31, zp + 0.46), (0.04, 0.03, 0.008))
    ojos = B.union(*[B.esfera((s * 0.04, -0.25, zp + 0.55), 0.015) for s in (-1, 1)])
    bicho = B.restar(B.union(cuerpo, cabeza, cuernos, orejas, brazos, garras, piernas, cola, k=0.03), boca, ojos)
    f = B.desplazar(B.union(ped, bicho, alas), 0.005, 14, 3, 1841)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.48, -0.42, -0.02), (0.48, 0.45, 1.5), 0.011, 3200, 'piedra', p_granito(1841))
    return p


def fuente_sangre():
    """Fuente de sangre (2 × 2 m): taza octogonal, columna con un plato arriba y chorros de sangre."""
    p = Pieza('deco_fuente_sangre', 'deco', huella=[2, 2], alto=1.4, lugar='libre', solido=True)
    pie = p_granito(1851)
    V, F = B.torno_m([(0.0, 0.0), (0.85, 0.0), (0.88, 0.05), (0.85, 0.35), (0.9, 0.4), (0.82, 0.42), (0.78, 0.12), (0.0, 0.1)], seg=8)
    p.parte(V @ B.rot_z(math.pi / 8).T, F, 'piedra', pie)
    W = [(0, 0, 0.32)] + [(math.cos(2 * np.pi * k / 8 + math.pi / 8) * 0.8, math.sin(2 * np.pi * k / 8 + math.pi / 8) * 0.8, 0.32) for k in range(8)]
    p.parte(np.array(W), np.array([(0, 1 + k, 1 + (k + 1) % 8) for k in range(8)]), 'sangre', lambda P, N: np.tile(hx(SANGRE), (len(P), 1)), ao=False)
    V, F = B.torno_m([(0.0, 0.1), (0.14, 0.1), (0.1, 0.2), (0.08, 0.9), (0.3, 1.02), (0.34, 1.1), (0.3, 1.12), (0.0, 1.06)], seg=12)
    p.parte(V, F, 'piedra', pie)
    W = [(0, 0, 1.09)] + [(math.cos(2 * np.pi * k / 12) * 0.29, math.sin(2 * np.pi * k / 12) * 0.29, 1.09) for k in range(12)]
    p.parte(np.array(W), np.array([(0, 1 + k, 1 + (k + 1) % 12) for k in range(12)]), 'sangre', lambda P, N: np.tile(hx(SANGRE), (len(P), 1)), ao=False)
    # remate: gota de piedra y chorros
    V, F = B.torno_m([(0.0, 1.06), (0.05, 1.08), (0.04, 1.25), (0.0, 1.38)], seg=10)
    p.parte(V, F, 'oro', p_oro(1852))
    for k in range(4):
        a = 2 * np.pi * k / 4 + 0.4
        d = np.array([math.cos(a), math.sin(a), 0])
        Vc, Fc = B.tubo_m([d * 0.3 + (0, 0, 1.1), d * 0.42 + (0, 0, 0.95), d * 0.5 + (0, 0, 0.6), d * 0.52 + (0, 0, 0.33)], [0.02, 0.016, 0.014, 0.018], seg=5, muestras=3)
        p.parte(Vc, Fc, 'sangre', lambda P, N: np.tile(hx('#6A0A10'), (len(P), 1)), ao=False)
    for k in range(4):
        a = 2 * np.pi * k / 4
        Vc, Fc = C.calavera(1.4, 220)
        p.parte(B.transformar(Vc, (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.62), C.orientar(np.array([math.cos(a), math.sin(a), 0]))), Fc, 'piedra', pie)
    return p


def columna_marmol():
    p = Pieza('deco_columna_marmol', 'deco', huella=[1, 1], alto=2.3, lugar='borde', solido=True)
    V, F = B.torno_m([(0.0, 0.0), (0.27, 0.0), (0.27, 0.08), (0.23, 0.12), (0.21, 0.18), (0.18, 0.22), (0.16, 2.02), (0.19, 2.06), (0.22, 2.16), (0.25, 2.2),
                      (0.25, 2.28), (0.0, 2.28)], seg=14)
    mar = B.piedra(MARMOL_N, '#0E0A0C', claro='#5A4E54', escala=3, humedad=0, semilla=1861, vetas=0.6, color_vetas='#8A7E86')

    def pint(P, N):
        col = mar(P, N)
        oro = ((P[:, 2] > 0.1) & (P[:, 2] < 0.2)) | ((P[:, 2] > 2.02) & (P[:, 2] < 2.18))
        return np.where(oro[:, None], hx(ORO) * (0.8 + 0.2 * np.clip(0.5 + B.ruido(P, 20, 3), 0, 1))[:, None], col)
    p.parte(V, F, 'piedra', pint)
    return p


def sillas_rotas():
    p = Pieza('deco_sillas_rotas', 'deco', huella=[1, 1], alto=0.9, lugar='libre', solido=True)
    for k, (c, R) in enumerate([((-0.15, 0.1, 0.0), B.rot_z(0.4)), ((0.2, -0.15, 0.25), B.rot_euler(1.5, 0.0, -0.6))]):
        asiento = B.caja((0, 0, 0.45), (0.2, 0.2, 0.025), r=0.008)
        patas = B.union(*[B.caja((sx * 0.17, sy * 0.17, 0.22), (0.02, 0.02, 0.22), r=0.006) for sx in (-1, 1) for sy in (-1, 1)])
        resp = B.caja((0, 0.18, 0.7), (0.19, 0.02, 0.24), r=0.008)
        f = B.union(asiento, patas, resp)
        if k == 1:
            f = B.cortar(f, lambda P: P[:, 0] - 0.1)
        V, F = B.malla_sdf(B.desplazar(f, 0.002, 20, 2, 1871 + k), (-0.24, -0.24, -0.02), (0.24, 0.24, 0.96), 0.01, 500, 0)
        if k == 1:
            V = V - np.array([0, 0, 0.45])
        p.parte(B.transformar(V, c, R), F, 'madera', p_madera(1871 + k))
        cojin = B.caja((0, 0, 0.48), (0.18, 0.18, 0.02), r=0.015)
        Vc, Fc = B.malla_sdf(cojin, (-0.22, -0.22, 0.42), (0.22, 0.22, 0.54), 0.012, 100, 0)
        if k == 1:
            Vc = Vc - np.array([0, 0, 0.45])
        p.parte(B.transformar(Vc, c, R), Fc, 'tela', p_terciopelo(1873 + k))
    return p


# --------------------------------------------------------------------------
# Luces
# --------------------------------------------------------------------------

def luz_candelabro():
    p = AB.luz_candelabro()
    return p


def luz_vela():
    """Candelero de plata de tres velas sobre una mesita redonda."""
    p = Pieza('luz_vela', 'luz', huella=[1, 1], alto=1.2, lugar='libre', solido=True, luz=LUZ_VELA)
    V, F = B.torno_m([(0.0, 0.0), (0.2, 0.0), (0.05, 0.05), (0.035, 0.12), (0.04, 0.6), (0.06, 0.66), (0.0, 0.66)], seg=10)
    p.parte(V, F, 'madera', p_madera(1881))
    V, F = B.torno_m([(0.0, 0.66), (0.26, 0.66), (0.27, 0.69), (0.0, 0.7)], seg=16)
    p.parte(V, F, 'madera', p_madera(1882, eje=0))
    plata = B.metal('#A8A8B0', oxido='#3A3A3E', cant=0.3, semilla=1883, brillo='#E0E0E8')
    c = np.array([0, 0, 0.7])
    V, F = B.torno_m([(0.0, 0.0), (0.08, 0.0), (0.025, 0.04), (0.018, 0.2), (0.0, 0.2)], seg=10, c=c)
    p.parte(V, F, 'hierro', plata)
    for s in (-1, 0, 1):
        q0 = c + np.array([s * 0.13, 0, 0.24 if s == 0 else 0.2])
        if s:
            Vb, Fb = B.tubo_m([c + (0, 0, 0.14), c + (s * 0.08, 0, 0.12), q0 - (0, 0, 0.02)], 0.008, seg=5, muestras=3)
            p.parte(Vb, Fb, 'hierro', plata)
        C.vela(p, tuple(q0), 0.16 if s == 0 else 0.12, 0.018, 1884 + s, color='#D8CCB0')
    C.charco_cera(p, (0.08, 0.05, 0.7), 0.08, 1890)
    return p


def luz_antorcha():
    return CA.luz_antorcha()


def luz_chimenea():
    """Chimenea de piedra con fuego (contra la pared, 2 × 1 m)."""
    p = Pieza('luz_chimenea', 'luz', huella=[2, 1], alto=1.9, lugar='pared', solido=True, luz=LUZ_FUEGO)
    caja = B.union(B.caja((0, 0.28, 0.7), (0.85, 0.22, 0.7), r=0.02), B.caja((0, 0.2, 1.45), (0.95, 0.3, 0.06), r=0.015),
                   B.caja((0, 0.32, 1.7), (0.7, 0.18, 0.2), r=0.015))
    hogar = B.union(B.caja((0, 0.15, 0.48), (0.55, 0.3, 0.42)), B.cortar(B.cilindro((0, -0.2, 0.9), (0, 0.42, 0.9), 0.55), lambda P: 0.9 - P[:, 2]))
    f = B.restar(caja, hogar)
    f = lambda P, f=f: f(P) + C.juntas(P, 0.22, 0.32, 0.007, 0.008, 'x') * (P[:, 1] < 0.08) + 0.003 * B.fbm(P, 12, 2, 1901)
    pie = p_granito(1901)

    def pint(P, N):
        col = pie(P, N)
        dentro = (np.abs(P[:, 0]) < 0.54) & (P[:, 1] > 0.1) & (P[:, 2] < 1.4)
        hollin = suave(0.3, 1.2, P[:, 2]) * (np.abs(P[:, 0]) < 0.7)
        col = mezclar(col, hx(AB.HOLLIN), hollin * 0.6)
        return np.where(dentro[:, None], col * 0.25, col)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-1.0, 0.0, -0.02), (1.0, 0.55, 1.92), 0.014, 2400, 'piedra', pint)
    # escudo en la campana
    tela(p, 0.4, 0.4, 8, 8, (0.0, 0.135, 1.5), np.eye(3), lambda U, V: np.where((emblema(U, V) > 0.9)[:, None], hx(ORO), hx(ROJO_OSC)), pliegue=0.0, semilla=1902, mat='oro')
    # leños, brasas y fuego
    for k, (a, b) in enumerate([((-0.35, 0.05, 0.1), (0.3, 0.25, 0.12)), ((-0.25, 0.3, 0.1), (0.35, 0.05, 0.14)), ((-0.05, 0.0, 0.2), (0.1, 0.35, 0.22))]):
        AB.viga(p, a, b, 0.05, 1903 + k, brasas=0.55, tris=120)
    brasas = [B.esfera((x, y, 0.06), 0.05) for x, y in [(-0.2, 0.15), (0.0, 0.2), (0.2, 0.12), (0.1, 0.3), (-0.1, 0.3)]]
    V, F = B.malla_sdf(B.desplazar(B.union(*brasas, k=0.04), 0.01, 20, 2, 1907), (-0.32, 0.0, 0.0), (0.32, 0.4, 0.14), 0.012, 220, 1)
    p.parte(V, F, 'brasa', lambda P, N: mezclar(hx('#2A1008'), hx('#FF5A1A'), suave(0.3, 0.8, B.ruido(P, 25, 1908) * 0.5 + 0.5)), ao=False)
    p.llama((0.0, 0.18, 0.35), 3.5)
    p.llama((-0.18, 0.2, 0.28), 2.4)
    p.llama((0.17, 0.16, 0.3), 2.6)
    # morillos de hierro
    for x in (-0.38, 0.38):
        V, F = B.tubo_m([(x, -0.05, 0.0), (x, -0.05, 0.25), (x, 0.05, 0.15), (x, 0.35, 0.12)], 0.016, seg=5, muestras=3)
        p.parte(V, F, 'hierro', B.metal('#2A2826', cant=0.4, semilla=1909))
    return p


PIEZAS = {
    'pared_blanda_a': escombro_castillo(2001),
    'pared_blanda_b': pared_cortina(2002),
    'pared_blanda_c': pared_sangre(2003),
    'pared_dura_a': muro_granito(2004),
    'pared_dura_b': muro_granito(2005, estandarte=True),
    'pared_borde': muro_borde(2006),
    'veta_hierro': C.veta(escombro_castillo(2007, rocas=1), 'hierro', 2007),
    'veta_sangre': C.veta(escombro_castillo(2008, rocas=1), 'sangre', 2008),
    'veta_oro': C.veta(escombro_castillo(2009, rocas=1), 'oro', 2009),
    'piso_a': piso_marmol(2011, [], peso=3),
    'piso_b': piso_marmol(2012, ['sangre'], peso=1),
    'piso_c': piso_marmol(2013, ['escudo'], peso=0.4),
    'piso_d': piso_marmol(2014, ['grietas'], peso=1.5),
    'piso_e': piso_marmol(2015, ['rastro'], peso=1),
    'deco_tapiz': tapiz,
    'deco_armadura': armadura,
    'deco_retrato': retrato,
    'deco_mesa_banquete': mesa_banquete,
    'deco_trono': trono,
    'deco_ataud_conde': ataud_conde,
    'deco_alfombra': alfombra,
    'deco_estandarte': estandarte,
    'deco_reloj': reloj,
    'deco_espejo_roto': espejo_roto,
    'deco_jarron': jarron,
    'deco_gargola': gargola,
    'deco_fuente_sangre': fuente_sangre,
    'deco_columna_marmol': columna_marmol,
    'deco_sillas_rotas': sillas_rotas,
    'luz_candelabro': luz_candelabro,
    'luz_vela': luz_vela,
    'luz_antorcha': luz_antorcha,
    'luz_chimenea': luz_chimenea,
}
