"""Sangre y Ceniza · La Abadía en Llamas: sillería tiznada, escombros con vigas carbonizadas y brasas, vitrales
rotos, bancas quemadas, campana caída, órgano quemado, altar, púlpito y hogueras.

Todo en el origen (centro de la base), el frente hacia -Y. Cualquier pieza puede traer vacíos `llama*` (las luz_*
siempre; también las vigas que arden y el altar).
"""
import math

import numpy as np

import sangre_biomas_base as B
import sangre_biomas_catacumbas as CA
import sangre_biomas_comun as C
import sangre_biomas_minas as MI
from sangre_biomas_base import Pieza, hx, mezclar, suave

SILLAR = '#B2A68E'
SILLAR_OSC = '#6E6452'
HOLLIN = '#1E1A18'
CARBON = '#221A16'
CENIZA = '#7A7470'
MARMOL_A = '#9C9488'
MARMOL_B = '#4E4844'
TERCIOPELO = '#6A1A1E'
ORO = '#B8903A'

LUZ_ANTORCHA = dict(color='#FF9A45', intensidad=1.2, alcance=6.0)
LUZ_VELA = dict(color='#FFB866', intensidad=0.8, alcance=4.0)
LUZ_FUEGO = dict(color='#FF7A30', intensidad=1.6, alcance=7.0)
LUZ_CANDELABRO = dict(color='#FFB060', intensidad=1.1, alcance=5.5)


# --------------------------------------------------------------------------
# Pintores
# --------------------------------------------------------------------------

def p_sillar(semilla, hollin=0.5):
    pie = B.piedra(SILLAR, SILLAR_OSC, claro='#CABFA8', escala=2.2, humedad=0.15, semilla=semilla, vetas=0.15)

    def p(P, N):
        col = pie(P, N)
        # hollín: sube desde abajo en lenguas, más en lo que mira hacia arriba-afuera
        lenguas = B.fbm(P * np.array([2.0, 2.0, 0.6]), 2.0, 3, semilla + 5)
        h = suave(-0.2, 0.4, lenguas + hollin - 0.5 + 0.3 * (1 - suave(0.2, 1.4, P[:, 2])))
        col = mezclar(col, hx(HOLLIN) * (1 + 0.5 * np.clip(B.ruido(P, 9, semilla + 6), 0, 1))[:, None], h * 0.85)
        return col
    return p


def p_carbon(semilla, brasas=0.25):
    def p(P, N):
        col = mezclar(hx('#120E0C'), hx('#3A2C24'), np.clip(0.5 + 0.7 * B.fbm(P, 9, 3, semilla), 0, 1))
        grietas = suave(0.85, 0.97, np.abs(np.sin(P[:, 0] * 40 + P[:, 1] * 37 + P[:, 2] * 13 + 3 * B.fbm(P, 4, 2, semilla + 1))))
        col = col * (1 - 0.4 * grietas)[:, None]
        br = suave(0.55, 0.75, B.ruido(P, 14, semilla + 2)) * brasas
        return mezclar(col, hx('#C83A10'), br)
    return p


def p_techo_escombro():
    def fabrica(rn, s):
        def p(P, N):
            col = mezclar(hx('#4A443C'), hx('#A89C86'), np.clip(0.55 + 0.6 * rn(P, 3, 3, s + 1), 0, 1))
            ceniza = suave(0.2, 0.6, rn(P, 2, 2, s + 2))
            col = mezclar(col, hx(CENIZA), ceniza * 0.6)
            hollin = suave(0.3, 0.7, rn(P, 4, 2, s + 3))
            col = mezclar(col, hx(HOLLIN), hollin * 0.55)
            grava = suave(0.55, 0.7, rn(P, 16, 1, s + 4))
            col = mezclar(col, hx('#3A3430'), grava * 0.5)
            grieta = suave(0.9, 0.975, 1 - np.abs(rn(P, 2, 2, s + 7)))
            return col * (1 - 0.5 * grieta)[:, None]
        return p
    return C.pintor_techo(fabrica, 0)


def p_bronce(semilla):
    return B.metal('#8A6A3A', oxido='#3A6A58', cant=0.45, escala=4, semilla=semilla, brillo='#C8A46A')


def p_oro(semilla):
    return B.metal(ORO, oxido='#5A4020', cant=0.25, escala=6, semilla=semilla, brillo='#F0D080')


def bloque_sillar(p, c, half, R, semilla, pintor=None, tris=90):
    """Bloque de sillería suelto (escombro)."""
    f = B.desplazar(B.caja((0, 0, 0), half, r=0.015), 0.006, 12, 2, semilla)
    V, F = B.malla_sdf(f, tuple(-np.array(half) - 0.03), tuple(np.array(half) + 0.03), max(min(half) / 4, 0.008), tris, 0)
    p.parte(B.transformar(V, c, R), F, 'piedra', pintor or p_sillar(semilla))


def viga(p, a, b, ancho, semilla, brasas=0.3, tris=200):
    """Viga carbonizada de a a b (con grietas de carbón y brasas)."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    L = np.linalg.norm(b - a)
    f = B.desplazar(B.caja((0, 0, 0), (L / 2, ancho, ancho), r=0.015), 0.012, 14, 3, semilla)
    V, F = B.malla_sdf(f, (-L / 2 - 0.04, -ancho - 0.04, -ancho - 0.04), (L / 2 + 0.04, ancho + 0.04, ancho + 0.04), max(ancho / 4, 0.01), tris, 1)
    d = (b - a) / L
    M = C.marco(d)  # z local -> d
    V = V @ B.rot_y(math.pi / 2).T  # x -> -z ... ponemos el largo en z
    V = V @ M.T + (a + b) / 2
    p.parte(V, F, 'madera', p_carbon(semilla, brasas))


# --------------------------------------------------------------------------
# Paredes
# --------------------------------------------------------------------------

def escombro_base(semilla, extra=None, rocas=3):
    """Pared de escombros (roca blanda de la abadía): sillares rotos y cascajo tiznado."""
    def fn():
        p = Pieza('pared_blanda', 'pared', dureza='blanda', huella=[1, 1], alto=1.5)
        arriba = p_techo_escombro()
        C.bloque_roca(p, semilla, C.pintor_pared(p_sillar(semilla, 0.55), arriba), arriba, rug=0.055, estratos=0.0, angular=0.6,
                      escala_rug=4.0, amp_var=0.04, bulto=0.09)
        rng = B.azar(semilla)
        V, N = C.malla_base(p)
        # sillares rotos que asoman del cascajo
        for k, (q, nq) in enumerate(C.puntos_superficie(V, N, rocas + 2, semilla + 3, zmin=0.1, zmax=1.4, sep=0.32)):
            h = (rng.uniform(0.09, 0.16), rng.uniform(0.07, 0.11), rng.uniform(0.06, 0.1))
            R = C.marco(nq + rng.normal(0, 0.4, 3)) @ B.rot_euler(rng.uniform(0, 0.5), rng.uniform(0, 0.5), rng.uniform(0, 3))
            bloque_sillar(p, q - nq * 0.04, h, R, semilla + 10 + k)
        C.piedritas_techo(p, semilla, p_sillar(semilla + 2), n=3, amp_var=0.04)
        return p
    return fn


def pared_viga(semilla):
    def fn():
        p = escombro_base(semilla, rocas=2)()
        rng = B.azar(semilla)
        a = np.array([rng.uniform(-0.3, 0.3), -0.35, 1.25])
        b = a + np.array([rng.uniform(-0.25, 0.25), -0.55, -0.45])
        viga(p, a, b, 0.07, semilla, brasas=0.35)
        return p
    return fn


def pared_brasas(semilla):
    """Escombros con grietas que todavía arden (brasas en el frente)."""
    def fn():
        p = escombro_base(semilla, rocas=2)()
        V, N = C.malla_base(p)
        rng = B.azar(semilla)
        for k, (q, nq) in enumerate(C.puntos_superficie(V, N, 4, semilla + 7, zmin=0.1, zmax=1.0, arriba=False, sep=0.25)):
            blobs = [B.esfera((rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), rng.uniform(-0.02, 0.02)), rng.uniform(0.025, 0.045)) for _ in range(3)]
            f = B.desplazar(B.union(*blobs, k=0.02), 0.006, 30, 2, semilla + k)
            Vb, Fb = B.malla_sdf(f, (-0.1, -0.1, -0.08), (0.1, 0.1, 0.08), 0.008, 60, 1)
            Vb = Vb @ C.marco(nq).T + q - nq * 0.02
            p.parte(Vb, Fb, 'brasa', lambda P, N: mezclar(hx('#2A1008'), hx('#FF5A1A'), suave(0.2, 0.8, B.ruido(P, 30, 77) * 0.5 + 0.5)), ao=False)
        return p
    return fn


def muro_iglesia(semilla, ventana=False):
    """Muro de sillares de la iglesia; la variante b con una ventana gótica de vitral en el frente."""
    def fn():
        p = Pieza('pared_dura', 'pared', dureza='dura', huella=[1, 1], alto=1.5)
        g, _ = C.campo_muro(semilla, hiladas=5, junta=0.022, rug=0.008, desorden=0.01, bisel=0.028)
        if ventana:
            hueco = B.union(B.caja((0, -0.6, 0.78), (0.2, 0.12, 0.38)), B.cortar(B.cilindro((0, -0.75, 1.16), (0, -0.45, 1.16), 0.2), lambda P: 1.16 - P[:, 2]))
            g0 = g
            g = lambda P: np.maximum(g0(P), -hueco(P))
        V, F = C.malla_pared(g, 1100, voxel=0.02)
        p.parte(V, F, 'piedra', p_sillar(semilla, 0.6))
        if ventana:
            vitral(p, (0, -0.52, 0.4), 0.2, 0.76, semilla, roto=0.25)
        else:
            # pilastra con capitel en el frente
            pil = B.union(B.caja((0, -0.63, 0.7), (0.09, 0.04, 0.7), r=0.012), B.caja((0, -0.65, 1.38), (0.12, 0.06, 0.05), r=0.012),
                          B.caja((0, -0.65, 0.06), (0.12, 0.06, 0.06), r=0.012))
            p.sdf(B.desplazar(pil, 0.003, 14, 2, semilla), (-0.18, -0.74, -0.02), (0.18, -0.55, 1.47), 0.012, 400, 'piedra', p_sillar(semilla + 1, 0.4))
        return p
    return fn


def vitral(p, base, medio, alto, semilla, roto=0.3, grosor=0.02):
    """Ventana gótica (arco apuntado) con vitral de colores emplomado; roto deja huecos."""
    rng = B.azar(semilla)
    x0, y0, z0 = base
    colores = ['vitral_rojo', 'vitral_azul', 'vitral_ambar', 'vitral_verde']
    tonos = {'vitral_rojo': '#C82A20', 'vitral_azul': '#2A50C8', 'vitral_ambar': '#E0A030', 'vitral_verde': '#2A9A50'}
    nx, nz = 4, 9
    zc = z0 + alto - medio * 1.3
    for i in range(nx):
        for j in range(nz):
            u0, u1 = -medio + 2 * medio * i / nx, -medio + 2 * medio * (i + 1) / nx
            v0, v1 = z0 + alto * j / nz, z0 + alto * (j + 1) / nz
            cx, cz = (u0 + u1) / 2, (v0 + v1) / 2
            # dentro del arco apuntado
            if cz > zc:
                dx1 = math.hypot(cx - (-medio * 0.3), cz - zc)
                dx2 = math.hypot(cx - (medio * 0.3), cz - zc)
                if max(dx1, dx2) > medio * 1.3 - 0.02:
                    continue
            if rng.random() < roto:
                continue
            m = colores[(i * 3 + j * 2 + int(rng.integers(0, 2))) % 4]
            V = np.array([(x0 + u0 + 0.008, y0, v0 + 0.008), (x0 + u1 - 0.008, y0, v0 + 0.008), (x0 + u1 - 0.008, y0, v1 - 0.008), (x0 + u0 + 0.008, y0, v1 - 0.008)])
            # algo torcidos los vidrios
            V[:, 1] += rng.uniform(-0.004, 0.004, 4)
            F = np.array([(0, 1, 2), (0, 2, 3), (0, 2, 1), (0, 3, 2)])
            V = np.vstack([V, V])
            F = np.array([(0, 1, 2), (0, 2, 3), (4, 6, 5), (4, 7, 6)])
            col = hx(tonos[m])
            p.parte(V, F, m, lambda P, N, col=col: col * (0.8 + 0.4 * np.clip(0.5 + B.ruido(P, 30, 3), 0, 1))[:, None], ao=False)
    # emplomado
    Vs, Fs, b = [], [], 0
    for i in range(nx + 1):
        u = -medio + 2 * medio * i / nx
        V, F = B.caja_m((x0 + u, y0 - 0.006, z0 + alto * 0.45), (0.006, 0.006, alto * 0.45))
        Vs.append(V)
        Fs.append(F + b)
        b += len(V)
    for j in range(nz + 1):
        v = z0 + alto * j / nz
        if v > zc + medio * 0.6:
            continue
        V, F = B.caja_m((x0, y0 - 0.006, v), (medio, 0.006, 0.006))
        Vs.append(V)
        Fs.append(F + b)
        b += len(V)
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'hierro', B.metal('#2A2826', cant=0.2, semilla=semilla))


def muro_borde(semilla):
    """Muro grueso del borde, ennegrecido por el fuego."""
    def fn():
        p = Pieza('pared_borde', 'pared', dureza='borde', huella=[1, 1], alto=1.6)
        g, _ = C.campo_muro(semilla, alto=1.55, hiladas=5, junta=0.025, rug=0.012, desorden=0.015, bisel=0.035)
        V, F = C.malla_pared(g, 1000, voxel=0.022)
        p.parte(V, F, 'piedra', p_sillar(semilla, 1.1))
        return p
    return fn


# --------------------------------------------------------------------------
# Pisos: baldosas en ajedrez con hollín y ceniza
# --------------------------------------------------------------------------

def piso_ajedrez(semilla, cosas, peso=1.0):
    def fn():
        p = Pieza('piso', 'piso', huella=[2, 2], peso=peso)
        p.ao = dict(rayos=8, dist=0.1, fuerza=0.55, suelo=False)
        p.bordes = dict(claro=0.2, oscuro=0.2, escala=2.0)
        n = 4
        rects = [(-1 + 2 * i / n, -1 + 2 * j / n, -1 + 2 * (i + 1) / n, -1 + 2 * (j + 1) / n) for i in range(n) for j in range(n)]
        rng = B.azar(semilla)
        f = C.alto_losas(rects, semilla, junta=0.025, hundir=0.018, bisel=0.02, desnivel=0.006, inclina=0.006)
        tumba = 'tumba' in cosas

        def alto(P):
            z, idx = f(P)
            if tumba:
                d = np.maximum(np.abs(P[:, 0]) - 0.36, np.abs(P[:, 1]) - 0.62)
                z = np.where(d < 0, 0.012 - 0.03 * suave(-0.03, 0.0, d) - 0.012 * suave(-0.05, -0.04, d) * (d > -0.05), z)
                cruz = np.minimum(np.maximum(np.abs(P[:, 0]) - 0.025, np.abs(P[:, 1] + 0.1) - 0.3), np.maximum(np.abs(P[:, 0]) - 0.14, np.abs(P[:, 1] + 0.22) - 0.025))
                z = z - 0.008 * suave(0.005, -0.003, cruz)
            return z

        def pint(P, N):
            z, idx = f(P)
            ii = np.floor((P[:, 0] + 1) * n / 2).astype(int)
            jj = np.floor((P[:, 1] + 1) * n / 2).astype(int)
            claro = ((ii + jj) % 2 == 0)
            base = np.where(claro[:, None], hx(MARMOL_A), hx(MARMOL_B))
            vet = suave(0.8, 0.95, 1 - np.abs(C.ruido_piso(P, 3, 900 + semilla)))
            col = base * (1 - 0.25 * vet)[:, None] * (1 + 0.1 * C.fbm_piso(P, 4, 2, 901))[:, None]
            hollin = suave(0.0, 0.5, C.fbm_piso(P, 2, 3, 902) + 0.1)
            col = mezclar(col, hx(HOLLIN), hollin * 0.7)
            ceniza = suave(0.25, 0.55, C.fbm_piso(P, 3, 2, 903))
            col = mezclar(col, hx(CENIZA), ceniza * 0.45)
            junta = suave(-0.008, -0.016, z)
            col = mezclar(col, hx('#1A1614'), junta)
            if tumba:
                d = np.maximum(np.abs(P[:, 0]) - 0.36, np.abs(P[:, 1]) - 0.62)
                lapida = B.piedra('#8A8278', '#4A443E', escala=4, humedad=0, semilla=semilla)(P, N)
                col = np.where((d < -0.01)[:, None], mezclar(lapida, hx(HOLLIN), hollin * 0.4), col)
            return col
        C.piso_campo(p, alto, pint, 32)
        if 'ceniza' in cosas:
            for k in range(2):
                c = (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), 0)
                C.monticulo(p, c, (rng.uniform(0.15, 0.3), rng.uniform(0.12, 0.25)), 0.05, semilla + k, p_ceniza(semilla + k), 160, terrones=3)
        if 'vidrios' in cosas:
            vidrios(p, (0, 0), 0.6, 10, semilla)
        if 'tablas' in cosas:
            for k in range(3):
                a = rng.uniform(-0.6, 0.6)
                c = np.array([rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), 0.03])
                d = np.array([math.cos(a), math.sin(a), 0])
                viga(p, c - d * 0.4, c + d * 0.4, 0.035, semilla + 10 + k, brasas=0.2, tris=90)
        if 'escombros' in cosas:
            C.escombros(p, (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), 0), 0.35, 6, semilla + 3, pintor=p_sillar(semilla), tam=(0.03, 0.07))
        return p
    return fn


def p_ceniza(semilla):
    def p(P, N):
        col = mezclar(hx('#4A4440'), hx('#9A948C'), np.clip(0.5 + 0.7 * B.fbm(P, 8, 3, semilla), 0, 1))
        br = suave(0.62, 0.78, B.ruido(P, 18, semilla + 1)) * (1 - suave(0.0, 0.05, P[:, 2]))
        return mezclar(col, hx('#E0501A'), br * 0.8)
    return p


def vidrios(p, c, radio, n, semilla):
    """Esquirlas de vitral regadas por el piso (brillan un poquito)."""
    rng = B.azar(semilla + 300)
    tonos = {'vitral_rojo': '#C82A20', 'vitral_azul': '#2A50C8', 'vitral_ambar': '#E0A030', 'vitral_verde': '#2A9A50'}
    for k in range(n):
        m = list(tonos)[k % 4]
        a = rng.uniform(0, 6.28)
        d = radio * math.sqrt(rng.random())
        q = np.array([c[0] + math.cos(a) * d, c[1] + math.sin(a) * d, 0.012])
        s = rng.uniform(0.03, 0.07)
        b = rng.uniform(0, 6.28)
        V = np.array([q + (math.cos(b) * s, math.sin(b) * s, 0), q + (math.cos(b + 2.2) * s * 0.7, math.sin(b + 2.2) * s * 0.7, 0.004),
                      q + (math.cos(b + 4.1) * s * 0.8, math.sin(b + 4.1) * s * 0.8, 0.0)])
        col = hx(tonos[m])
        p.parte(V, np.array([(0, 1, 2)]), m, lambda P, N, col=col: np.tile(col, (len(P), 1)), ao=False)


# --------------------------------------------------------------------------
# Decoración
# --------------------------------------------------------------------------

def banca(quemada=True, rota=False):
    nombre = 'deco_banca_rota' if rota else 'deco_banca_quemada'
    p = Pieza(nombre, 'deco', huella=[2, 1], alto=0.95, lugar='libre', solido=True)
    rng = B.azar(1201 + rota)
    mad = lambda s: B.madera('#6A4430', '#2E1C12', eje=0, podrida=0.1, quemada=0.55, semilla=s)
    L = 0.85
    corte = (lambda P: P[:, 0] - (0.45 + 0.15 * np.sin(P[:, 2] * 9) + 0.08 * np.sin(P[:, 1] * 17))) if quemada else None

    def pieza_sdf(f, bmin, bmax, s, tris):
        if corte is not None:
            f0 = f
            f = lambda P: np.maximum(f0(P), corte(P))
        V, F = B.malla_sdf(B.desplazar(f, 0.004, 18, 2, s), bmin, bmax, 0.011, tris, 1)
        return V, F
    asiento = B.caja((0, -0.05, 0.42), (L, 0.2, 0.025), r=0.008)
    respaldo = B.caja((0, 0.15, 0.68), (L, 0.025, 0.24), r=0.008, R=B.rot_x(-0.12))
    lados = B.union(*[B.union(B.caja((x, -0.02, 0.4), (0.03, 0.24, 0.4), r=0.01), B.cilindro((x, -0.02, 0.82), (x, -0.02, 0.86), 0.06)) for x in (-L, L)])
    zocalo = B.caja((0, 0.1, 0.08), (L, 0.02, 0.06), r=0.006)
    f = B.union(asiento, respaldo, lados, zocalo)
    V, F = pieza_sdf(f, (-L - 0.06, -0.3, -0.02), (L + 0.06, 0.32, 0.92), 1201, 1200)
    if rota:
        # partida en dos y la mitad derecha volteada
        izq = V[:, 0] < 0.05
        Fi = F[izq[F].all(1)]
        Fd = F[(~izq)[F].all(1)]
        p.parte(V, Fi, 'madera', mad(1202))
        Vd = (V - np.array([0.4, 0, 0])) @ B.rot_euler(1.4, 0.15, 0.35).T + np.array([0.55, -0.15, 0.22])
        p.parte(Vd, Fd, 'madera', mad(1203))
    else:
        p.parte(V, F, 'madera', mad(1202))
        # brasas en el borde quemado y la llama chiquita
        for k in range(3):
            q = np.array([0.45 + rng.uniform(-0.05, 0.05), rng.uniform(-0.15, 0.15), rng.uniform(0.3, 0.75)])
            Vb, Fb = B.malla_sdf(B.esfera((0, 0, 0), 0.03), (-0.05, -0.05, -0.05), (0.05, 0.05, 0.05), 0.01, 30, 0)
            p.parte(Vb + q, Fb, 'brasa', lambda P, N: np.tile(hx('#FF5A1A'), (len(P), 1)), ao=False)
        C.monticulo(p, (0.6, -0.05, 0), (0.25, 0.22), 0.05, 1204, p_ceniza(1204), 140, terrones=2)
    return p


def vitral_roto():
    """Ventana gótica en pie (contra la pared) con el vitral medio roto y vidrios en el piso."""
    p = Pieza('deco_vitral_roto', 'deco', huella=[1, 1], alto=2.3, lugar='pared', solido=True, luz=dict(color='#C8A0FF', intensidad=0.5, alcance=3.0))
    w, zb, zt = 0.36, 0.25, 1.55
    marco_ext = B.union(B.caja((0, 0.3, (zb + zt) / 2), (w + 0.12, 0.12, (zt - zb) / 2 + 0.1), r=0.02),
                        B.cortar(B.cortar(B.cilindro((-w * 0.35, 0.18, zt), (-w * 0.35, 0.42, zt), (w + 0.12) * 1.35, borde=0.01),
                                          B.cilindro((w * 0.35, 0.18, zt), (w * 0.35, 0.42, zt), (w + 0.12) * 1.35, borde=0.01)), lambda P: zt - P[:, 2]),
                        B.caja((0, 0.3, 0.12), (w + 0.2, 0.18, 0.12), r=0.02))
    hueco = B.union(B.caja((0, 0.3, (zb + zt) / 2 + 0.05), (w, 0.3, (zt - zb) / 2 + 0.05)),
                    B.cortar(B.cortar(B.cilindro((-w * 0.35, 0.0, zt), (-w * 0.35, 0.6, zt), w * 1.35), B.cilindro((w * 0.35, 0.0, zt), (w * 0.35, 0.6, zt), w * 1.35)),
                             lambda P: zt - P[:, 2]))
    parteluz = B.caja((0, 0.3, (zb + zt) / 2 + 0.1), (0.025, 0.06, (zt - zb) / 2 + 0.1))
    rosa = B.restar(B.cilindro((0, 0.26, zt + 0.25), (0, 0.34, zt + 0.25), 0.11), B.cilindro((0, 0.2, zt + 0.25), (0, 0.4, zt + 0.25), 0.07))
    f = B.union(B.restar(marco_ext, hueco), parteluz, rosa)
    f = lambda P, f=f: f(P) + 0.004 * B.fbm(P, 12, 3, 1211)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.62, 0.12, -0.02), (0.62, 0.5, 2.3), 0.013, 2400, 'piedra', p_sillar(1211, 0.6))
    for s in (-1, 1):
        vitral(p, (s * w / 2, 0.3, zb), w / 2 - 0.025, zt - zb + w * 0.6, 1212 + s, roto=0.35)
    vidrios(p, (0, -0.1), 0.35, 12, 1215)
    C.escombros(p, (0.2, -0.05, 0), 0.25, 4, 1216, pintor=p_sillar(1216), tam=(0.03, 0.06))
    return p


def columna_gotica():
    """Pilar gótico de haces, roto, con tambores caídos."""
    p = Pieza('deco_columna_rota', 'deco', huella=[1, 1], alto=1.0, lugar='libre', solido=True)
    haz = [B.cilindro((math.cos(a) * 0.13, math.sin(a) * 0.13, 0.15), (math.cos(a) * 0.13, math.sin(a) * 0.13, 1.4), 0.07, borde=0.01) for a in np.linspace(0, 2 * np.pi, 8, endpoint=False)]
    nucleo = B.cilindro((0, 0, 0.15), (0, 0, 1.4), 0.15)
    base = B.union(B.caja((0, 0, 0.06), (0.3, 0.3, 0.06), r=0.015), B.cilindro((0, 0, 0.1), (0, 0, 0.2), 0.27, borde=0.03))
    f = B.union(base, nucleo, *haz)
    corte = lambda P: P[:, 2] - (0.85 + 0.15 * np.sin(P[:, 0] * 8) + 0.1 * np.sin(P[:, 1] * 11))
    f = B.desplazar(B.cortar(f, corte), 0.005, 12, 3, 1221)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.36, -0.36, -0.02), (0.36, 0.36, 1.1), 0.011, 1600, 'piedra', p_sillar(1221, 0.6))
    for k, (c, a) in enumerate([((0.32, -0.32, 0.15), 0.7), ((-0.35, -0.2, 0.14), 2.0)]):
        tam = lambda P: np.maximum(B.union(B.cilindro((0, 0, -0.14), (0, 0, 0.14), 0.15), *[B.cilindro((math.cos(b) * 0.13, math.sin(b) * 0.13, -0.14), (math.cos(b) * 0.13, math.sin(b) * 0.13, 0.14), 0.06) for b in np.linspace(0, 2 * np.pi, 8, endpoint=False)])(P), np.abs(P[:, 2]) - 0.14)
        V, F = B.malla_sdf(B.desplazar(tam, 0.005, 12, 3, 1222 + k), (-0.26, -0.26, -0.18), (0.26, 0.26, 0.18), 0.011, 500, 1)
        p.parte(V @ B.rot_euler(math.pi / 2, 0, a).T + np.array(c), F, 'piedra', p_sillar(1222 + k, 0.6))
    C.escombros(p, (0.0, -0.25, 0), 0.35, 6, 1225, pintor=p_sillar(1225), tam=(0.03, 0.07))
    return p


def altar():
    """Altar de piedra con mantel quemado, cruz dorada, cáliz, libro y candeleros encendidos (contra la pared)."""
    p = Pieza('deco_altar', 'deco', huella=[2, 1], alto=1.3, lugar='pared', solido=True, luz=LUZ_VELA)
    mesa = B.union(B.caja((0, 0.15, 0.48), (0.8, 0.3, 0.05), r=0.015), B.caja((0, 0.15, 0.22), (0.7, 0.24, 0.22), r=0.015),
                   B.caja((0, 0.1, 0.04), (0.9, 0.4, 0.04), r=0.015))
    arcos = lambda P: np.maximum(np.maximum(np.abs(((P[:, 0] + 0.7) % 0.35) - 0.175) - 0.11, np.abs(P[:, 2] - 0.22) - 0.15), np.abs(P[:, 1] + 0.09) - 0.02)
    f = B.desplazar(B.restar(mesa, arcos), 0.004, 12, 3, 1231)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.95, -0.35, -0.02), (0.95, 0.6, 0.55), 0.012, 1600, 'piedra', p_sillar(1231, 0.45))
    # mantel quemado que cuelga por el frente
    mantel = B.desplazar(lambda P: np.maximum(np.maximum(np.abs(P[:, 0]) - 0.7, np.abs(P[:, 1] + 0.16) - 0.008), np.maximum(P[:, 2] - 0.53, 0.3 + 0.08 * np.sin(P[:, 0] * 13) - P[:, 2])), 0.006, 10, 3, 1232)
    p.sdf(mantel, (-0.75, -0.2, 0.2), (0.75, -0.12, 0.56), 0.009, 400, 'tela', B.madera(TERCIOPELO, '#2A0A0C', eje=2, podrida=0, quemada=0.4, semilla=1232))
    Vm = np.array([(-0.7, -0.16, 0.535), (0.7, -0.16, 0.535), (0.7, 0.4, 0.535), (-0.7, 0.4, 0.535)])
    p.parte(Vm, np.array([(0, 1, 2), (0, 2, 3)]), 'tela', B.madera('#C8BCA0', '#4A3E30', eje=0, podrida=0, quemada=0.5, semilla=1233))
    # cruz dorada
    cruz = B.union(B.caja((0, 0.32, 0.88), (0.025, 0.02, 0.33), r=0.006), B.caja((0, 0.32, 1.02), (0.15, 0.02, 0.025), r=0.006),
                   B.caja((0, 0.32, 0.58), (0.08, 0.06, 0.04), r=0.01))
    p.sdf(cruz, (-0.2, 0.25, 0.53), (0.2, 0.4, 1.25), 0.008, 300, 'oro', p_oro(1234))
    # cáliz y libro
    V, F = B.torno_m([(0.0, 0.0), (0.05, 0.0), (0.012, 0.03), (0.01, 0.08), (0.045, 0.11), (0.05, 0.15), (0.0, 0.15)], seg=10, c=(-0.35, 0.1, 0.535))
    p.parte(V, F, 'oro', p_oro(1235))
    V, F = B.caja_m((0.3, 0.05, 0.56), (0.12, 0.09, 0.025), B.rot_z(0.2))
    p.parte(V, F, 'tela', B.liso('#3A1414'))
    V, F = B.caja_m((0.3, 0.05, 0.587), (0.11, 0.085, 0.004), B.rot_z(0.2))
    p.parte(V, F, 'tela', B.manchado('#D8CCA8', '#7A6A50', 10, semilla=1236))
    # candeleros con velas
    for x in (-0.6, 0.6):
        V, F = B.torno_m([(0.0, 0.0), (0.07, 0.0), (0.03, 0.04), (0.015, 0.07), (0.015, 0.3), (0.04, 0.32), (0.0, 0.32)], seg=10, c=(x, 0.25, 0.535))
        p.parte(V, F, 'oro', p_oro(1237))
        C.vela(p, (x, 0.25, 0.855), 0.22, 0.022, 1238 + (x > 0), color='#D8CCB0')
    C.charco_cera(p, (0.0, 0.05, 0.536), 0.12, 1240)
    return p


def pulpito():
    """Púlpito de madera tallada sobre fuste de piedra, con su escalerita (contra la pared)."""
    p = Pieza('deco_pulpito', 'deco', huella=[1, 1], alto=1.75, lugar='pared', solido=True)
    fuste = B.union(B.cilindro((0, 0.05, 0.0), (0, 0.05, 0.75), 0.1, borde=0.02), B.cilindro((0, 0.05, 0.0), (0, 0.05, 0.08), 0.2, borde=0.02),
                    B.cono_r((0, 0.05, 0.6), (0, 0.05, 0.8), 0.12, 0.3))
    p.sdf(B.desplazar(fuste, 0.003, 14, 2, 1251), (-0.35, -0.3, -0.02), (0.35, 0.4, 0.85), 0.011, 700, 'piedra', p_sillar(1251, 0.5))

    def caja_oct(P):
        a = np.arctan2(P[:, 1] - 0.05, P[:, 0])
        r = np.hypot(P[:, 0], P[:, 1] - 0.05)
        oct_r = 0.33 * np.cos(np.pi / 8) / np.cos(((a + np.pi / 8) % (np.pi / 4)) - np.pi / 8)
        ext = np.maximum(r - oct_r, np.maximum(0.8 - P[:, 2], P[:, 2] - 1.35))
        inn = np.maximum(r - (oct_r - 0.03), 0.85 - P[:, 2])
        tallas = 0.008 * suave(0.85, 0.95, np.abs(np.sin(a * 4))) + 0.006 * suave(0.8, 0.95, np.abs(np.sin(P[:, 2] * 30)))
        return np.maximum(ext, -inn) + tallas
    p.sdf(B.desplazar(caja_oct, 0.003, 18, 2, 1252), (-0.4, -0.35, 0.75), (0.4, 0.45, 1.4), 0.011, 1300, 'madera',
          B.madera('#5A3A26', '#26160E', eje=2, podrida=0, quemada=0.35, semilla=1252))
    # atril y libro
    V, F = B.caja_m((0, -0.24, 1.35), (0.16, 0.12, 0.012), B.rot_x(0.35))
    p.parte(V, F, 'madera', B.madera('#5A3A26', '#26160E', eje=0, semilla=1253))
    V, F = B.caja_m((0, -0.25, 1.38), (0.14, 0.1, 0.012), B.rot_x(0.35))
    p.parte(V, F, 'tela', B.manchado('#D0C4A0', '#6A5A40', 10, semilla=1254))
    for k in range(4):
        tabla = MI.tabla
        tabla(p, (0.38, 0.32 - k * 0.09, 0.12 + k * 0.17), (0.12, 0.05, 0.015), semilla=1255 + k, tris=50, eje=0,
              pintor=B.madera('#5A3A26', '#26160E', eje=0, quemada=0.3, semilla=1255 + k))
    MI.tabla(p, (0.48, 0.2, 0.4), (0.015, 0.2, 0.4), B.rot_x(-0.6), semilla=1260, tris=60, eje=2, pintor=B.madera('#5A3A26', '#26160E', eje=2, semilla=1260))
    return p


def campana():
    """Campana de bronce caída, rajada, sobre escombros y una viga."""
    p = Pieza('deco_campana_caida', 'deco', huella=[1, 1], alto=0.9, lugar='libre', solido=True)
    perf = [(0.0, 0.72), (0.12, 0.72), (0.2, 0.66), (0.24, 0.5), (0.27, 0.3), (0.33, 0.12), (0.4, 0.03), (0.42, 0.0), (0.38, 0.0), (0.35, 0.04),
            (0.29, 0.12), (0.23, 0.3), (0.2, 0.5), (0.16, 0.64), (0.0, 0.67)]
    V, F = B.torno_m(perf[::-1], seg=20)
    ang = np.arctan2(V[:, 1], V[:, 0])
    V[:, 0] *= 1 + 0.0
    raja = (np.abs(ang - 0.6) < 0.06) & (V[:, 2] < 0.35)
    V[raja] *= np.array([0.97, 0.97, 1.0])
    V2 = V @ B.rot_euler(0, -1.25, 0.4).T + np.array([0.0, 0.05, 0.4])
    V2[:, 2] -= min(V2[:, 2].min(), 0)
    p.parte(V2, F, 'hierro', p_bronce(1271))
    # yugo de madera
    MI.tabla(p, (-0.38, 0.0, 0.18), (0.08, 0.35, 0.08), B.rot_z(0.4), semilla=1272, tris=120, eje=1, pintor=p_carbon(1272, 0.15))
    C.escombros(p, (0.1, -0.15, 0), 0.4, 7, 1273, pintor=p_sillar(1273), tam=(0.04, 0.09))
    for k in range(2):
        bloque_sillar(p, (0.35 - k * 0.6, -0.35, 0.08), (0.14, 0.1, 0.08), B.rot_z(0.5 + k), 1274 + k)
    return p


def santo():
    """Santo de piedra sin cabeza sobre su peana (contra la pared)."""
    p = Pieza('deco_estatua_santo', 'deco', huella=[1, 1], alto=1.65, lugar='pared', solido=True)
    zp = 0.45
    ped = B.union(B.caja((0, 0.05, 0.06), (0.28, 0.28, 0.06), r=0.015), B.cilindro((0, 0.05, 0.1), (0, 0.05, zp - 0.04), 0.2, borde=0.02),
                  B.caja((0, 0.05, zp - 0.025), (0.24, 0.24, 0.025), r=0.01))
    tunica = B.cono_r((0, 0.05, zp), (0, 0.04, zp + 0.92), 0.22, 0.13)
    pliegues = lambda P: 0.012 * np.sin(np.arctan2(P[:, 1] - 0.05, P[:, 0]) * 9 + np.sin(P[:, 2] * 6)) * suave(zp + 0.85, zp, P[:, 2])
    manto = B.elipsoide((0, 0.08, zp + 0.75), (0.2, 0.14, 0.28))
    hombros = B.elipsoide((0, 0.04, zp + 0.92), (0.19, 0.12, 0.09))
    cuello = lambda P: np.maximum(B.cilindro((0, 0.04, zp + 0.95), (0, 0.04, zp + 1.06), 0.06)(P), P[:, 2] - (zp + 1.04 + 0.03 * np.sin(P[:, 0] * 30)))
    brazo = B.capsula((0.15, 0.0, zp + 0.88), (0.12, -0.14, zp + 0.68), 0.05)
    libro = B.caja((0.1, -0.16, zp + 0.66), (0.08, 0.03, 0.1), r=0.008, R=B.rot_euler(0.2, 0, 0.3))
    brazo2 = B.capsula((-0.15, 0.0, zp + 0.88), (-0.18, -0.02, zp + 0.55), 0.05)
    cuerpo = B.union(B.union(tunica, manto, hombros, cuello, brazo, brazo2, k=0.04), libro)
    f = B.desplazar(B.union(ped, lambda P: cuerpo(P) + pliegues(P)), 0.004, 14, 3, 1281)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.36, -0.32, -0.02), (0.36, 0.4, 1.55), 0.011, 2800, 'piedra', p_sillar(1281, 0.55))
    # la cabeza en el piso
    V, F = B.malla_sdf(B.desplazar(B.union(B.esfera((0, 0, 0), 0.085), B.elipsoide((0, 0.02, 0.02), (0.09, 0.08, 0.08)), k=0.02), 0.004, 20, 2, 1282),
                       (-0.12, -0.12, -0.12), (0.12, 0.12, 0.12), 0.009, 260, 1)
    p.parte(V + np.array([0.3, -0.32, 0.075]), F, 'piedra', p_sillar(1282, 0.4))
    return p


def vigas_ardiendo():
    """Vigas del techo caídas que siguen ardiendo (2 × 1 m): carbón, brasas y llamas."""
    p = Pieza('deco_vigas_ardiendo', 'deco', huella=[2, 1], alto=0.7, lugar='libre', solido=True, luz=LUZ_FUEGO)
    viga(p, (-0.95, -0.2, 0.08), (0.9, 0.15, 0.1), 0.09, 1291, brasas=0.4, tris=320)
    viga(p, (-0.6, 0.3, 0.05), (0.7, -0.3, 0.32), 0.075, 1292, brasas=0.4, tris=280)
    viga(p, (0.2, 0.35, 0.04), (0.55, -0.35, 0.06), 0.05, 1293, brasas=0.3, tris=160)
    C.monticulo(p, (0.0, 0.0, 0), (0.6, 0.4), 0.06, 1294, p_ceniza(1294), 260, terrones=4)
    for q, t in [((0.05, -0.02, 0.22), 2.6), ((-0.35, 0.1, 0.2), 2.0), ((0.45, -0.18, 0.28), 2.2)]:
        p.llama(q, t)
    return p


def atril():
    """Atril de hierro con un libro grande abierto."""
    p = Pieza('deco_atril', 'deco', huella=[1, 1], alto=1.25, lugar='libre', solido=True)
    met = B.metal('#3A3634', cant=0.4, semilla=1301)
    V, F = B.torno_m([(0.0, 0.0), (0.18, 0.0), (0.16, 0.04), (0.03, 0.08), (0.025, 0.95), (0.05, 0.98), (0.0, 0.99)], seg=10)
    p.parte(V, F, 'hierro', met)
    V, F = B.caja_m((0, -0.02, 1.02), (0.24, 0.17, 0.012), B.rot_x(0.45))
    p.parte(V, F, 'hierro', met)
    for s in (-1, 1):
        hoja = lambda P, s=s: np.maximum(np.maximum(np.abs(P[:, 0] - s * 0.11) - 0.11, np.abs(P[:, 1]) - 0.15), np.abs(P[:, 2] - 0.02 - 0.03 * np.cos((P[:, 0] - s * 0.11) * 7)) - 0.012)
        V, F = B.malla_sdf(hoja, (s * 0.11 - 0.14, -0.18, -0.03), (s * 0.11 + 0.14, 0.18, 0.08), 0.008, 180, 0)
        p.parte(V @ B.rot_x(0.45).T + np.array([0, -0.02, 1.035]), F, 'tela', B.manchado('#D8CCA8', '#6A5A40', 12, semilla=1302 + s))
    V, F = B.caja_m((0, -0.02, 1.032), (0.23, 0.16, 0.008), B.rot_x(0.45))
    p.parte(V, F, 'tela', B.liso('#4A1414'))
    return p


def cruz_procesional():
    p = Pieza('deco_cruz_procesional', 'deco', huella=[1, 1], alto=2.2, lugar='borde', solido=True)
    V, F = B.torno_m([(0.0, 0.0), (0.22, 0.0), (0.2, 0.05), (0.06, 0.12), (0.025, 0.2), (0.022, 1.7), (0.04, 1.73), (0.0, 1.74)], seg=10)
    p.parte(V, F, 'oro', p_oro(1311))
    cruz = B.union(B.caja((0, 0, 1.95), (0.025, 0.02, 0.24), r=0.006), B.caja((0, 0, 2.02), (0.16, 0.02, 0.025), r=0.006),
                   *[B.esfera(q, 0.035) for q in [(0, 0, 2.2), (0.17, 0, 2.02), (-0.17, 0, 2.02)]], B.cilindro((0, -0.03, 2.02), (0, 0.03, 2.02), 0.05))
    p.sdf(cruz, (-0.25, -0.08, 1.68), (0.25, 0.08, 2.28), 0.008, 500, 'oro', p_oro(1312))
    # cintas quemadas
    for s in (-1, 1):
        V, F = B.tubo_m([(s * 0.15, 0, 1.98), (s * 0.17, -0.03, 1.75), (s * 0.15, 0.02, 1.55)], [0.018, 0.015, 0.008], seg=4, muestras=3)
        p.parte(V, F, 'tela', B.madera(TERCIOPELO, '#2A0A0C', eje=2, quemada=0.4, semilla=1313 + s))
    return p


def escombros_abadia():
    p = Pieza('deco_escombros', 'deco', huella=[1, 1], alto=0.6, lugar='libre', solido=True)
    rng = B.azar(1321)
    for k in range(5):
        h = (rng.uniform(0.1, 0.2), rng.uniform(0.08, 0.13), rng.uniform(0.06, 0.1))
        c = (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), h[2] + (0.15 if k == 4 else 0.0))
        bloque_sillar(p, c, h, B.rot_euler(rng.uniform(-0.2, 0.2), rng.uniform(-0.3, 0.3), rng.uniform(0, 3)), 1321 + k)
    # pedazo de tracería (arco) y viga
    arco = B.cortar(B.restar(B.cilindro((0, -0.04, 0), (0, 0.04, 0), 0.3), B.cilindro((0, -0.1, 0), (0, 0.1, 0), 0.2)), lambda P: -P[:, 2])
    V, F = B.malla_sdf(B.desplazar(arco, 0.004, 14, 2, 1327), (-0.35, -0.08, -0.02), (0.35, 0.08, 0.35), 0.01, 300, 1)
    p.parte(V @ B.rot_euler(1.3, 0, 0.6).T + np.array([0.15, 0.2, 0.06]), F, 'piedra', p_sillar(1327, 0.4))
    viga(p, (-0.45, -0.2, 0.05), (0.2, 0.4, 0.25), 0.05, 1328, brasas=0.2, tris=150)
    C.monticulo(p, (0, 0, 0), (0.45, 0.42), 0.08, 1329, p_ceniza(1329), 260, terrones=5)
    return p


def cenizas():
    p = Pieza('deco_cenizas', 'deco', huella=[1, 1], alto=0.12, lugar='suelo', solido=False)
    C.monticulo(p, (0, 0, 0), (0.4, 0.33), 0.1, 1331, p_ceniza(1331), 300, terrones=5)
    C.monticulo(p, (0.3, 0.25, 0), (0.15, 0.12), 0.05, 1332, p_ceniza(1332), 100, terrones=2)
    viga(p, (-0.2, -0.1, 0.06), (0.15, 0.15, 0.08), 0.03, 1333, brasas=0.5, tris=80)
    return p


def organo():
    """Órgano de tubos quemado (contra la pared, 2 × 1 m)."""
    p = Pieza('deco_organo', 'deco', huella=[2, 1], alto=2.4, lugar='pared', solido=True)
    caja = B.union(B.caja((0, 0.25, 0.45), (0.85, 0.22, 0.45), r=0.015), B.caja((0, 0.1, 0.78), (0.6, 0.15, 0.04), r=0.01, R=B.rot_x(0.2)))
    teclas = lambda P: np.maximum(np.maximum(np.abs(P[:, 0]) - 0.55, np.abs(P[:, 1] + 0.02) - 0.07), np.abs(P[:, 2] - 0.7) - 0.015) + 0.004 * (np.abs(np.sin(P[:, 0] * 120)) > 0.9)
    f = B.desplazar(B.union(caja, teclas), 0.003, 14, 2, 1341)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.92, -0.15, -0.02), (0.92, 0.5, 0.95), 0.012, 1200, 'madera',
          B.madera('#5A3A26', '#26160E', eje=0, quemada=0.5, semilla=1341))
    rng = B.azar(1342)
    xs = np.linspace(-0.75, 0.75, 13)
    for k, x in enumerate(xs):
        h = 1.9 - 0.9 * abs(x) / 0.75 + rng.uniform(-0.05, 0.05)
        r = 0.045 - 0.015 * abs(x) / 0.75
        roto = k in (3, 9)
        top = 0.9 + (h - 0.9) * (0.55 if roto else 1.0)
        V, F = B.torno_m([(r, 0.9), (r, top), (r * 0.9, top), (0.0, top - 0.02)], seg=8, c=(x, 0.3, 0.0))
        p.parte(V, F, 'hierro', B.metal('#9A8A6A', oxido='#2A2420', cant=0.65, semilla=1343 + k))
        # boca del tubo
        V, F = B.caja_m((x, 0.3 - r, 1.05), (r * 0.6, 0.004, 0.02))
        p.parte(V, F, 'hierro', B.liso('#0E0C0A'), ao=False)
        if roto:
            V, F = B.torno_m([(r, 0.0), (r, (h - 0.9) * 0.45)], seg=8)
            p.parte(V @ B.rot_euler(1.45, 0, 0.4 + k).T + np.array([x + 0.1, -0.25, 0.05]), F, 'hierro', B.metal('#9A8A6A', oxido='#2A2420', cant=0.65, semilla=1360 + k))
    MI.tabla(p, (0, 0.33, 1.9), (0.82, 0.05, 0.04), semilla=1370, tris=100, eje=0, pintor=p_carbon(1370, 0.1))
    return p


def confesionario():
    p = Pieza('deco_confesionario', 'deco', huella=[2, 1], alto=2.1, lugar='pared', solido=True)
    mad = B.madera('#4A2E1E', '#1E120A', eje=2, quemada=0.45, semilla=1381)

    def f(P):
        caja = B.caja((0, 0.15, 1.0), (0.85, 0.3, 1.0), r=0.015)(P)
        huecos = np.minimum(np.maximum(np.maximum(np.abs(P[:, 0] + 0.45) - 0.3, P[:, 1] - 0.3), np.abs(P[:, 2] - 0.95) - 0.8),
                            np.maximum(np.maximum(np.abs(P[:, 0] - 0.45) - 0.3, P[:, 1] - 0.3), np.abs(P[:, 2] - 0.95) - 0.8))
        remate = B.caja((0, 0.15, 2.04), (0.9, 0.34, 0.05), r=0.01)(P)
        tallas = 0.006 * suave(0.85, 0.97, np.abs(np.sin(P[:, 2] * 25)))
        return np.minimum(np.maximum(caja, -huecos), remate) + tallas
    p.sdf(B.desplazar(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), 0.003, 16, 2, 1381), (-0.95, -0.25, -0.02), (0.95, 0.55, 2.12), 0.013, 2000, 'madera', mad)
    # cortinas de terciopelo quemadas
    for x in (-0.45, 0.45):
        cort = lambda P, x=x: np.maximum(np.maximum(np.abs(P[:, 0] - x) - 0.28, np.abs(P[:, 1] + 0.12 + 0.02 * np.sin(P[:, 0] * 40)) - 0.012),
                                         np.maximum(P[:, 2] - 1.72, 0.45 + 0.15 * np.sin(P[:, 0] * 11 + x) - P[:, 2]))
        p.sdf(cort, (x - 0.32, -0.2, 0.25), (x + 0.32, -0.05, 1.76), 0.01, 400, 'tela', B.madera(TERCIOPELO, '#200808', eje=2, quemada=0.55, semilla=1382 + (x > 0)))
    V = np.array([(-0.3, 0.3, 0.2), (0.3, 0.3, 0.2), (0.3, 0.3, 1.7), (-0.3, 0.3, 1.7)])
    p.parte(V, np.array([(0, 1, 2), (0, 2, 3)]), 'madera', lambda P, N: np.tile(hx('#0E0A08'), (len(P), 1)), ao=False)
    return p


def pila_bautismal():
    p = Pieza('deco_pila_bautismal', 'deco', huella=[1, 1], alto=0.95, lugar='libre', solido=True)
    V, F = B.torno_m([(0.0, 0.0), (0.3, 0.0), (0.3, 0.06), (0.16, 0.12), (0.11, 0.2), (0.1, 0.5), (0.16, 0.56), (0.36, 0.7), (0.4, 0.86), (0.37, 0.88),
                      (0.33, 0.78), (0.0, 0.76)], seg=8)
    pint = p_sillar(1391, 0.4)
    p.parte(V @ B.rot_z(math.pi / 8).T, F, 'piedra', pint)
    n = 8
    W = [(0, 0, 0.8)] + [(math.cos(2 * np.pi * k / n + math.pi / 8) * 0.34, math.sin(2 * np.pi * k / n + math.pi / 8) * 0.34, 0.8) for k in range(n)]
    p.parte(np.array(W), np.array([(0, 1 + k, 1 + (k + 1) % n) for k in range(n)]), 'agua', lambda P, N: np.tile(hx('#141A20'), (len(P), 1)), ao=False)
    C.escombros(p, (0.1, -0.1, 0), 0.4, 4, 1392, pintor=p_sillar(1392), tam=(0.03, 0.06))
    return p


def deco_vidrios():
    p = Pieza('deco_vidrios', 'deco', huella=[1, 1], alto=0.03, lugar='suelo', solido=False)
    vidrios(p, (0, 0), 0.4, 18, 1401)
    C.escombros(p, (0.1, 0.1, 0), 0.3, 3, 1402, pintor=p_sillar(1402), tam=(0.02, 0.04))
    return p


# --------------------------------------------------------------------------
# Luces
# --------------------------------------------------------------------------

def luz_antorcha():
    p = CA.luz_antorcha()
    return p


def luz_vela():
    """Candelero de ofrendas de hierro con muchas velas."""
    p = Pieza('luz_vela', 'luz', huella=[1, 1], alto=0.95, lugar='libre', solido=True, luz=LUZ_VELA)
    met = B.metal('#3A3634', cant=0.4, semilla=1411)
    V, F = B.torno_m([(0.0, 0.0), (0.16, 0.0), (0.03, 0.06), (0.025, 0.7), (0.0, 0.7)], seg=8)
    p.parte(V, F, 'hierro', met)
    V, F = B.caja_m((0, 0, 0.72), (0.32, 0.14, 0.015))
    p.parte(V, F, 'hierro', met)
    V, F = B.caja_m((0, -0.06, 0.82), (0.3, 0.06, 0.012))
    p.parte(V, F, 'hierro', met)
    rng = B.azar(1412)
    C.charco_cera(p, (0.0, 0.05, 0.735), 0.2, 1413)
    for k in range(5):
        x = -0.24 + k * 0.12
        C.vela(p, (x, 0.07, 0.735), rng.uniform(0.05, 0.12), 0.02, 1414 + k, color='#A89878', llama=k % 2 == 0)
    for k in range(3):
        x = -0.18 + k * 0.18
        C.vela(p, (x, -0.06, 0.832), rng.uniform(0.04, 0.09), 0.018, 1430 + k, color='#A89878', llama=k == 1)
    return p


def luz_candelabro():
    p = CA.luz_candelabro()
    for q in p.partes:
        if q['mat'] == 'hierro':
            q['mat'] = 'oro'
            q['pintor'] = p_oro(1441)
    return p


def luz_hoguera():
    """Hoguera de bancas y libros (la luz más fuerte del bioma)."""
    p = Pieza('luz_hoguera', 'luz', huella=[1, 1], alto=0.9, lugar='libre', solido=True, luz=LUZ_FUEGO)
    rng = B.azar(1451)
    C.monticulo(p, (0, 0, 0), (0.42, 0.42), 0.07, 1452, p_ceniza(1452), 260, terrones=4)
    for k in range(6):
        a = 2 * np.pi * k / 6 + rng.uniform(-0.2, 0.2)
        d = np.array([math.cos(a), math.sin(a), 0])
        viga(p, d * 0.38 + (0, 0, 0.04), d * 0.05 + (0, 0, 0.42), 0.04, 1453 + k, brasas=0.6, tris=90)
    for k in range(3):
        V, F = B.caja_m((rng.uniform(-0.25, 0.25), rng.uniform(-0.25, 0.25), 0.07), (0.09, 0.06, 0.02), B.rot_euler(rng.uniform(-0.3, 0.3), 0, rng.uniform(0, 3)))
        p.parte(V, F, 'tela', B.madera('#4A1414', '#1A0808', eje=0, quemada=0.6, semilla=1460 + k))
    brasas = [B.esfera((math.cos(a) * r, math.sin(a) * r, 0.08), 0.05) for a, r in [(0, 0), (1, 0.12), (2.5, 0.14), (4, 0.13), (5.2, 0.1)]]
    f = B.desplazar(B.union(*brasas, k=0.03), 0.01, 20, 2, 1465)
    V, F = B.malla_sdf(f, (-0.22, -0.22, 0.0), (0.22, 0.22, 0.16), 0.01, 260, 1)
    p.parte(V, F, 'brasa', lambda P, N: mezclar(hx('#2A1008'), hx('#FF5A1A'), suave(0.3, 0.8, B.ruido(P, 25, 1466) * 0.5 + 0.5)), ao=False)
    p.llama((0.0, 0.0, 0.32), 4.5)
    p.llama((0.1, 0.06, 0.25), 3.0)
    p.llama((-0.09, -0.05, 0.22), 2.6)
    return p


def luz_brasero():
    return MI.luz_brasero()


PIEZAS = {
    'pared_blanda_a': escombro_base(1501),
    'pared_blanda_b': pared_viga(1502),
    'pared_blanda_c': pared_brasas(1503),
    'pared_dura_a': muro_iglesia(1504),
    'pared_dura_b': muro_iglesia(1505, ventana=True),
    'pared_borde': muro_borde(1506),
    'veta_hierro': C.veta(escombro_base(1507, rocas=1), 'hierro', 1507),
    'veta_sangre': C.veta(escombro_base(1508, rocas=1), 'sangre', 1508),
    'veta_oro': C.veta(escombro_base(1509, rocas=1), 'oro', 1509),
    'piso_a': piso_ajedrez(1511, [], peso=3),
    'piso_b': piso_ajedrez(1512, ['ceniza'], peso=2),
    'piso_c': piso_ajedrez(1513, ['vidrios', 'escombros'], peso=1),
    'piso_d': piso_ajedrez(1514, ['tumba'], peso=0.6),
    'piso_e': piso_ajedrez(1515, ['tablas', 'ceniza'], peso=1.2),
    'deco_banca_quemada': lambda: banca(True, False),
    'deco_banca_rota': lambda: banca(False, True),
    'deco_vitral_roto': vitral_roto,
    'deco_columna_rota': columna_gotica,
    'deco_altar': altar,
    'deco_pulpito': pulpito,
    'deco_campana_caida': campana,
    'deco_estatua_santo': santo,
    'deco_vigas_ardiendo': vigas_ardiendo,
    'deco_atril': atril,
    'deco_cruz_procesional': cruz_procesional,
    'deco_escombros': escombros_abadia,
    'deco_cenizas': cenizas,
    'deco_organo': organo,
    'deco_confesionario': confesionario,
    'deco_pila_bautismal': pila_bautismal,
    'deco_vidrios': deco_vidrios,
    'luz_antorcha': luz_antorcha,
    'luz_vela': luz_vela,
    'luz_candelabro': luz_candelabro,
    'luz_brasero': luz_brasero,
    'luz_hoguera': luz_hoguera,
}
