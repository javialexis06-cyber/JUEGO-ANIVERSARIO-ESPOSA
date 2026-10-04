"""Sangre y Ceniza · Las Catacumbas: toba pálida con marcas de pico, paredes de fémures y calaveras, nichos,
sillares de caliza, agua negra, cadenas, sarcófagos, velas y candelabros.

Todo en el origen (centro de la base), el frente hacia -Y. La cámara del juego mira desde el sur, así que la cara -Y
de los bloques de pared es la que se ve: ahí va el detalle caro (huesos, nichos, argollas).
"""
import math

import numpy as np

import sangre_biomas_base as B
import sangre_biomas_cementerio as CE
import sangre_biomas_comun as C
from sangre_biomas_base import Pieza, hx, mezclar, suave

TOBA = '#A09480'
TOBA_OSC = '#635A4A'
TOBA_CLARA = '#BDB298'
CALIZA = '#ABA18C'
CALIZA_OSC = '#6C6352'
SALITRE = '#DAD6CA'
HUMEDAD = '#4E5A46'
BASALTO = '#4C4C55'
BASALTO_OSC = '#26262D'
LOSA = '#8E8676'
LOSA_OSC = '#5C564A'
JUNTA = '#2E2A24'

LUZ_ANTORCHA = dict(color='#FF9A45', intensidad=1.2, alcance=6.0)
LUZ_VELA = dict(color='#FFB866', intensidad=0.7, alcance=3.5)
LUZ_CANDELABRO = dict(color='#FFB060', intensidad=1.1, alcance=5.5)


# --------------------------------------------------------------------------
# Pintores
# --------------------------------------------------------------------------

def p_toba(semilla, polvo=0.4):
    pie = B.piedra(TOBA, TOBA_OSC, claro=TOBA_CLARA, escala=2.4, humedad=0.25, alto_humedad=0.4, semilla=semilla, vetas=0.25,
                   color_vetas='#4A4236', mancha=HUMEDAD, mancha_cant=0.0)

    def p(P, N):
        col = pie(P, N)
        # marcas de pico: rayones diagonales cortos
        rayas = suave(0.85, 0.97, np.abs(np.sin((P[:, 0] + P[:, 1]) * 30 + P[:, 2] * 18 + 3 * B.fbm(P, 3, 2, semilla + 4))))
        col = col * (1 - 0.18 * rayas * suave(0.2, 0.5, B.ruido(P, 4, semilla + 5)))[:, None]
        # salitre blanco y humedad verdosa abajo
        sal = suave(0.45, 0.75, B.fbm(P, 5, 3, semilla + 6)) * (1 - suave(0.1, 0.7, P[:, 2]))
        col = mezclar(col, hx(SALITRE), sal * 0.6)
        hum = suave(0.3, 0.6, B.fbm(P, 2.5, 3, semilla + 7)) * (1 - suave(0.0, 0.45, P[:, 2]))
        col = mezclar(col, hx(HUMEDAD), hum * 0.5)
        # polvo en lo que mira arriba
        col = mezclar(col, hx('#C2B8A2'), suave(0.6, 0.95, N[:, 2]) * polvo)
        return col
    return p


def p_techo_toba():
    """Techo de los bloques de toba (encaja con el vecino)."""
    def fabrica(rn, s):
        def p(P, N):
            col = mezclar(hx(TOBA_OSC), hx(TOBA_CLARA), np.clip(0.6 + 0.45 * rn(P, 3, 3, s + 1), 0, 1))
            col = mezclar(col, hx('#C8BEA8'), suave(0.2, 0.6, rn(P, 2, 2, s + 2)) * 0.5)
            grava = suave(0.55, 0.7, rn(P, 16, 1, s + 3))
            col = mezclar(col, hx('#6E6454'), grava * 0.6)
            grieta = suave(0.9, 0.975, 1 - np.abs(rn(P, 2, 2, s + 7)))
            col = col * (1 - 0.45 * grieta)[:, None]
            return col * (1 + 0.08 * rn(P, 24, 1, s + 4))[:, None]
        return p
    return C.pintor_techo(fabrica, 0)


def p_caliza(semilla):
    return B.piedra(CALIZA, CALIZA_OSC, claro='#C2B8A2', escala=2.2, humedad=0.35, alto_humedad=0.45, semilla=semilla,
                    vetas=0.2, mancha=HUMEDAD, mancha_cant=0.25)


def p_basalto(semilla):
    pie = B.piedra(BASALTO, BASALTO_OSC, claro='#6A6A76', escala=2.0, humedad=0.3, semilla=semilla, vetas=0.5, color_vetas='#1C1C22')

    def p(P, N):
        col = pie(P, N)
        brillo = suave(0.6, 0.85, B.ruido(P, 9, semilla + 3))
        return mezclar(col, hx('#8A8E9E'), brillo * 0.25)
    return p


def p_hueso(semilla, sucio=0.5):
    return B.hueso('#CDBF9E', '#6E604A', semilla=semilla, sucio=sucio)


# --------------------------------------------------------------------------
# Paredes
# --------------------------------------------------------------------------

def toba_base(semilla, aplanar=None, rocas=2):
    """Bloque de toba (la roca blanda de las catacumbas, también la base de las vetas)."""
    def fn():
        p = Pieza('pared_blanda', 'pared', dureza='blanda', huella=[1, 1], alto=1.5)
        C.bloque_roca(p, semilla, C.pintor_pared(p_toba(semilla), p_techo_toba()), p_techo_toba(), rug=0.04, estratos=0.014,
                      amp_var=0.02, escala_rug=3.5, aplanar=aplanar)
        if rocas:
            C.roca_base(p, semilla, p_toba(semilla + 1), n=rocas, tam=(0.08, 0.15))
        C.piedritas_techo(p, semilla, p_toba(semilla + 2, polvo=0.6), n=3, amp_var=0.02)
        return p
    return fn


def frente_plano(x0, x1, z0, z1):
    """Aplana la cara -Y entre x0..x1 y z0..z1 (para paneles y nichos)."""
    def f(q):
        return (q[:, 1] < -0.3) * suave(0.06, 0.0, np.maximum(np.maximum(x0 - q[:, 0], q[:, 0] - x1), np.maximum(z0 - q[:, 2], q[:, 2] - z1)))
    return f


def panel_huesos(p, semilla, x0=-0.56, x1=0.56, z0=0.04, z1=1.3, y=-0.6, fila_cal=0.78):
    """Pared de osario en la cara -Y: hileras de cabezas de fémur (cúpulas de 6 triángulos con sombreado suave)
    sobre un fondo oscuro, y una franja de calaveras."""
    rng = B.azar(semilla)
    fondo = np.array([(x0, y + 0.004, z0), (x1, y + 0.004, z0), (x1, y + 0.004, z1), (x0, y + 0.004, z1)])
    p.parte(fondo, np.array([(0, 1, 2), (0, 2, 3)]), 'hueso', lambda P, N: np.tile(hx('#2A241C'), (len(P), 1)), ao=False)
    dx, dz = 0.08, 0.068
    Vs, Fs, b = [], [], 0
    ang = np.linspace(0, 2 * np.pi, 7)[:-1]
    fila = 0
    z = z0 + dz / 2
    while z < z1 - dz / 2 + 1e-6:
        if abs(z - fila_cal) > 0.12:
            x = x0 + dx / 2 + (fila % 2) * dx / 2
            while x < x1 - dx / 4:
                r = rng.uniform(0.037, 0.043)
                h = r * rng.uniform(0.8, 1.05)
                c = np.array([x + rng.uniform(-0.006, 0.006), y, z + rng.uniform(-0.006, 0.006)])
                anillo = c + np.stack([np.cos(ang) * r, np.zeros(6), np.sin(ang) * r], 1)
                apice = c + np.array([rng.uniform(-0.005, 0.005), -h, rng.uniform(-0.005, 0.005)])
                Vs.append(np.vstack([anillo, apice[None]]))
                Fs.append(np.array([(6, k, (k + 1) % 6) for k in range(6)]) + b)
                b += 7
                x += dx
        fila += 1
        z += dz
    pint_h = p_hueso(semilla, 0.5)

    def pint(P, N):
        return pint_h(P, N) * (0.55 + 0.45 * np.clip(-N[:, 1], 0, 1))[:, None]
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'hueso', pint)
    Vc, Fc = C.calavera(1.1, 220)
    for k, x in enumerate(np.linspace(x0 + 0.1, x1 - 0.1, 4)):
        R = B.rot_euler(rng.uniform(-0.15, 0.15), 0, rng.uniform(-0.25, 0.25))
        p.parte(B.transformar(Vc, (x, y - 0.03, fila_cal - 0.08), R), Fc, 'hueso', p_hueso(semilla + k, 0.45))


def pared_osario(semilla):
    def fn():
        p = toba_base(semilla, frente_plano(-0.6, 0.6, 0.0, 1.32), rocas=0)()
        p.extras['peso'] = 0.5
        panel_huesos(p, semilla + 1, y=-0.57)
        return p
    return fn


def pared_nicho(semilla):
    """Toba con un nicho funerario en el frente: marco de piedra en arco, calavera, huesos y un cabo de vela."""
    def fn():
        p = toba_base(semilla, frente_plano(-0.35, 0.45, 0.4, 1.15), rocas=1)()
        p.extras['peso'] = 0.7
        y = -0.585
        cx, z0, z1, w = 0.05, 0.52, 0.86, 0.27
        marco_ext = B.union(B.caja((cx, y, (z0 + z1) / 2 - 0.02), (w + 0.07, 0.04, (z1 - z0) / 2 + 0.06), r=0.015),
                            B.cortar(B.cilindro((cx, y - 0.04, z1), (cx, y + 0.04, z1), w + 0.07, borde=0.012), lambda P: z1 - P[:, 2]))
        hueco = B.union(B.caja((cx, y, (z0 + z1) / 2), (w, 0.2, (z1 - z0) / 2)),
                        B.cortar(B.cilindro((cx, y - 0.2, z1), (cx, y + 0.2, z1), w), lambda P: z1 - P[:, 2]))
        marco = B.desplazar(B.restar(marco_ext, hueco), 0.004, 14, 3, semilla)
        p.sdf(marco, (cx - w - 0.12, y - 0.08, z0 - 0.12), (cx + w + 0.12, y + 0.08, z1 + w + 0.12), 0.011, 700, 'piedra', p_caliza(semilla))
        # fondo oscuro del nicho y su piso
        fondo = np.array([(cx - w, y + 0.03, z0), (cx + w, y + 0.03, z0), (cx + w, y + 0.03, z1 + w * 0.9), (cx - w, y + 0.03, z1 + w * 0.9)])
        p.parte(fondo, np.array([(0, 1, 2), (0, 2, 3)]), 'piedra', lambda P, N: mezclar(hx('#1C1814'), hx('#0A0807'), suave(z0, z1, P[:, 2])), ao=False)
        Vc, Fc = C.calavera(1.05, 240)
        p.parte(B.transformar(Vc, (cx + 0.06, y - 0.01, z0 + 0.0), B.rot_euler(0, 0, 0.25)), Fc, 'hueso', p_hueso(semilla))
        for k, (x, a) in enumerate([(-0.12, 0.3), (0.17, -0.2)]):
            Vh, Fh = C.hueso_m(0.2, 0.015, 80)
            p.parte(B.transformar(Vh, (cx + x, y - 0.02, z0 + 0.015), B.rot_euler(0, 0, a)), Fh, 'hueso', p_hueso(semilla + k))
        C.vela(p, (cx - 0.15, y - 0.06, z0), 0.06, 0.02, semilla, llama=False)
        return p
    return fn


def pared_toba(semilla):
    def fn():
        p = toba_base(semilla)()
        V, N = C.malla_base(p)
        rng = B.azar(semilla)
        # algún hueso que asoma del costado
        for k, (q, nq) in enumerate(C.puntos_superficie(V, N, 1, semilla + 2, zmin=0.25, zmax=1.1, arriba=False, sep=0.35)):
            Vh, Fh = C.hueso_m(0.24, 0.018, 90)
            R = C.orientar(np.array([nq[0], nq[1], 0.1])) @ B.rot_euler(0, rng.uniform(-0.5, 0.5), math.pi / 2)
            p.parte(B.transformar(Vh, q - nq * 0.03, R), Fh, 'hueso', p_hueso(semilla))
        C.escombros(p, (0.0, -0.7, 0.0), 0.16, 4, semilla + 3, pintor=p_toba(semilla + 3), tam=(0.03, 0.06))
        return p
    return fn


def pared_sillar(semilla, argolla=False):
    def fn():
        p = Pieza('pared_dura', 'pared', dureza='dura', huella=[1, 1], alto=1.5)
        g, _ = C.campo_muro(semilla, hiladas=5, junta=0.024, rug=0.01, desorden=0.012, bisel=0.03)
        V, F = C.malla_pared(g, 1000, voxel=0.022)
        p.parte(V, F, 'piedra', p_caliza(semilla))
        if argolla:
            met = B.metal('#3A3634', cant=0.6, semilla=semilla)
            Vp, Fp = B.cilindro_m((0, -0.6, 1.05), (0, -0.66, 1.05), 0.05, seg=8)
            p.parte(Vp, Fp, 'hierro', met)
            Va, Fa = B.toro_m((0, -0.67, 0.97), 0.07, 0.012, seg=12, seg2=5, eje=(1, 0, 0))
            p.parte(Va, Fa, 'hierro', met)
            C.cadena(p, [(0, -0.68, 0.9), (0.02, -0.72, 0.55), (0.06, -0.78, 0.2), (0.15, -0.85, 0.02)], 0.06, 0.009, semilla=semilla)
            Vg, Fg = B.toro_m((0.2, -0.88, 0.012), 0.05, 0.011, seg=10, seg2=4, eje=(0, 0.3, 1))
            p.parte(Vg, Fg, 'hierro', met)
        return p
    return fn


def pared_borde(semilla):
    def fn():
        p = Pieza('pared_borde', 'pared', dureza='borde', huella=[1, 1], alto=1.6)
        pint = p_basalto(semilla)
        C.bloque_roca(p, semilla, pint, pint, alto=1.55, rug=0.06, estratos=0.0, angular=0.65, escala_rug=2.4, amp_var=0.05)
        C.roca_base(p, semilla, pint, n=3, tam=(0.1, 0.18))
        return p
    return fn


# --------------------------------------------------------------------------
# Pisos: losas (las juntas exteriores caen en el borde de la baldosa)
# --------------------------------------------------------------------------

def p_losas(f, semilla, polvo=0.4, agua=None):
    def p(P, N):
        z, idx = f(P)
        h = (B._hash(np.maximum(idx, 0), np.zeros_like(idx), np.zeros_like(idx), semilla) & 0xFFFF) / 65535.0
        base = mezclar(hx(LOSA_OSC), hx(LOSA), 0.45 + 0.4 * h)
        n = C.fbm_piso(P, 3, 3, 500)
        col = base * (1 + 0.2 * n)[:, None]
        col = col * (1 + 0.07 * C.ruido_piso(P, 20, 501))[:, None]
        grietas = suave(0.88, 0.97, 1 - np.abs(C.ruido_piso(P, 4, 502 + semilla)))
        col = col * (1 - 0.45 * grietas)[:, None]
        col = mezclar(col, hx('#BCB29C'), suave(0.15, 0.55, C.fbm_piso(P, 2, 3, 503)) * polvo)
        junta = suave(-0.012, -0.022, z)
        col = mezclar(col, hx(JUNTA), junta)
        return col
    return p


def piso_losas(semilla, cosas, peso=1.0):
    def fn():
        p = Pieza('piso', 'piso', huella=[2, 2], peso=peso)
        p.ao = dict(rayos=8, dist=0.1, fuerza=0.55, suelo=False)
        p.bordes = dict(claro=0.25, oscuro=0.2, escala=2.0)
        rects = C.losas_fila(semilla, filas=(0.5, 0.5, 0.5, 0.5), anchos=(0.45, 0.85))
        rng = B.azar(semilla)
        hund = None
        if 'agua' in cosas:
            hund = int(rng.integers(len(rects) // 3, 2 * len(rects) // 3))
        f = C.alto_losas(rects, semilla, junta=0.04, hundir=0.025, bisel=0.03, desnivel=0.012, inclina=0.012)

        def alto(P):
            z, idx = f(P)
            if hund is not None:
                z = np.where(idx == hund, z - 0.04, z)
            if 'rotas' in cosas:
                z = z - 0.02 * suave(0.2, 0.5, C.fbm_piso(P, 2, 2, semilla + 9)) * (idx >= 0)
            return z
        C.piso_campo(p, alto, p_losas(f, semilla), 32)
        if hund is not None:
            x0, y0, x1, y1 = rects[hund]
            V = np.array([(x0 + 0.02, y0 + 0.02, -0.035), (x1 - 0.02, y0 + 0.02, -0.035), (x1 - 0.02, y1 - 0.02, -0.035), (x0 + 0.02, y1 - 0.02, -0.035)])
            p.parte(V, np.array([(0, 1, 2), (0, 2, 3)]), 'agua', lambda P, N: np.tile(hx('#14181E'), (len(P), 1)), ao=False)
        if 'huesos' in cosas:
            for k in range(3):
                Vh, Fh = C.hueso_m(rng.uniform(0.16, 0.26), 0.016, 90)
                c = (rng.uniform(-0.7, 0.7), rng.uniform(-0.7, 0.7), 0.012)
                p.parte(B.transformar(Vh, c, B.rot_euler(0, 0, rng.uniform(0, 6))), Fh, 'hueso', p_hueso(semilla + k))
        if 'escombros' in cosas:
            C.escombros(p, (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), 0.0), 0.35, 6, semilla + 3, pintor=p_toba(semilla), tam=(0.03, 0.08))
        if 'reja' in cosas:
            rejilla_desague(p, (rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4)), semilla)
        return p
    return fn


def rejilla_desague(p, c, semilla):
    """Rejilla de desagüe de hierro con el hueco negro debajo."""
    V = np.array([(c[0] - 0.2, c[1] - 0.2, 0.002), (c[0] + 0.2, c[1] - 0.2, 0.002), (c[0] + 0.2, c[1] + 0.2, 0.002), (c[0] - 0.2, c[1] + 0.2, 0.002)])
    p.parte(V, np.array([(0, 1, 2), (0, 2, 3)]), 'piedra', lambda P, N: np.tile(hx('#08070A'), (len(P), 1)), ao=False)
    Vs, Fs, b = [], [], 0
    for k in range(6):
        t = -0.18 + k * 0.072
        for a, bb in (((c[0] + t, c[1] - 0.2, 0.012), (c[0] + t, c[1] + 0.2, 0.012)), ((c[0] - 0.2, c[1] + t, 0.016), (c[0] + 0.2, c[1] + t, 0.016))):
            V, F = B.cilindro_m(a, bb, 0.01, seg=4)
            Vs.append(V)
            Fs.append(F + b)
            b += len(V)
    for V, F in [B.caja_m((c[0], c[1] - 0.21, 0.01), (0.22, 0.015, 0.012)), B.caja_m((c[0], c[1] + 0.21, 0.01), (0.22, 0.015, 0.012)),
                 B.caja_m((c[0] - 0.21, c[1], 0.01), (0.015, 0.22, 0.012)), B.caja_m((c[0] + 0.21, c[1], 0.01), (0.015, 0.22, 0.012))]:
        Vs.append(V)
        Fs.append(F + b)
        b += len(V)
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'hierro', B.metal('#3A3634', cant=0.7, semilla=semilla))


# --------------------------------------------------------------------------
# Decoración
# --------------------------------------------------------------------------

def nicho_calaveras():
    """Muro de nichos (contra la pared): tres hileras de arcos llenos de calaveras y huesos."""
    p = Pieza('deco_nicho_calaveras', 'deco', huella=[1, 1], alto=1.5, lugar='pared', solido=True)
    p.ao = dict(rayos=12, dist=0.3, fuerza=0.8, suelo=True)
    muro = B.caja((0, 0.25, 0.72), (0.5, 0.25, 0.72), r=0.02)
    huecos = []
    filas = [0.12, 0.6, 1.06]
    for z in filas:
        for x in (-0.24, 0.24):
            huecos.append(B.caja((x, 0.08, z + 0.13), (0.2, 0.25, 0.13), r=0.015))
            huecos.append(B.cortar(B.cilindro((x, -0.2, z + 0.26), (x, 0.33, z + 0.26), 0.2), lambda P, z=z: (z + 0.26) - P[:, 2]))
    f = B.restar(muro, B.union(*huecos), k=0.01)
    f = lambda P, f=f: f(P) + C.juntas(P, 0.24, 0.36, 0.008, 0.008, 'x') * (P[:, 1] < 0.02) + 0.004 * B.fbm(P, 12, 3, 301)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.56, -0.08, -0.02), (0.56, 0.56, 1.5), 0.012, 2200, 'piedra', p_toba(301))
    rng = B.azar(302)
    Vc, Fc = C.calavera(1.0, 160)
    k = 0
    for z in filas:
        for x in (-0.24, 0.24):
            for dx in (-0.08, 0.08):
                R = B.rot_euler(rng.uniform(-0.15, 0.15), 0, rng.uniform(-0.35, 0.35))
                p.parte(B.transformar(Vc, (x + dx + rng.uniform(-0.02, 0.02), 0.05, z + 0.012), R, rng.uniform(0.85, 1.0)), Fc, 'hueso',
                        p_hueso(302 + k))
                k += 1
            Vh, Fh = C.hueso_m(0.3, 0.016, 80)
            p.parte(B.transformar(Vh, (x, 0.2, z + 0.03), B.rot_euler(0, 0, rng.uniform(-0.2, 0.2))), Fh, 'hueso', p_hueso(320 + k))
    C.vela(p, (0.38, -0.02, 0.6), 0.05, 0.018, 330, llama=False)
    C.charco_cera(p, (0.38, -0.02, 0.6), 0.05, 331)
    return p


def osario():
    """Montón de calaveras y fémures apilados (osario), más grande que el del cementerio."""
    p = Pieza('deco_osario', 'deco', huella=[1, 1], alto=0.6, lugar='borde', solido=True)
    rng = B.azar(341)
    Vc, Fc = C.calavera(1.0, 200)
    k = 0
    for capa, (n, r, z) in enumerate([(8, 0.3, 0.0), (5, 0.18, 0.12), (3, 0.08, 0.24), (1, 0.0, 0.36)]):
        for i in range(n):
            a = 2 * np.pi * i / n + capa
            c = (math.cos(a) * r, math.sin(a) * r, z)
            R = B.rot_euler(rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), a + math.pi / 2 + rng.uniform(-0.6, 0.6))
            p.parte(B.transformar(Vc, c, R, rng.uniform(0.9, 1.05)), Fc, 'hueso', p_hueso(341 + k))
            k += 1
    for i in range(10):
        a = rng.uniform(0, 6.28)
        r = rng.uniform(0.15, 0.4)
        Vh, Fh = C.hueso_m(rng.uniform(0.24, 0.34), 0.018, 80)
        p.parte(B.transformar(Vh, (math.cos(a) * r, math.sin(a) * r, rng.uniform(0.02, 0.15)), B.rot_euler(rng.uniform(-0.3, 0.3), rng.uniform(-0.5, 0.5), a + rng.uniform(1, 2))),
                Fh, 'hueso', p_hueso(360 + i))
    return p


def columna(rota=False):
    """Columna estriada de caliza (2,2 m), o su tronco roto con tambores caídos."""
    nombre = 'deco_columna_rota' if rota else 'deco_columna'
    p = Pieza(nombre, 'deco', huella=[1, 1], alto=0.75 if rota else 2.25, lugar='libre' if rota else 'borde', solido=True)
    alto = 2.2
    base = B.union(B.caja((0, 0, 0.07), (0.3, 0.3, 0.07), r=0.015), B.cilindro((0, 0, 0.12), (0, 0, 0.22), 0.25, borde=0.04))

    def fuste(P):
        a = np.arctan2(P[:, 1], P[:, 0])
        r = 0.2 - 0.012 * (np.abs(np.sin(a * 8)) ** 0.5)
        rad = np.sqrt(P[:, 0] ** 2 + P[:, 1] ** 2) - r + 0.01 * (P[:, 2] / alto)
        return np.maximum(rad, np.maximum(0.2 - P[:, 2], P[:, 2] - (alto - 0.25)))
    capitel = B.union(B.cilindro((0, 0, alto - 0.27), (0, 0, alto - 0.12), 0.25, borde=0.05), B.caja((0, 0, alto - 0.06), (0.3, 0.3, 0.06), r=0.015))
    f = B.union(base, fuste, capitel)
    if rota:
        corte = lambda P: P[:, 2] - (0.62 + 0.1 * np.sin(P[:, 0] * 9) + 0.06 * np.sin(P[:, 1] * 13))
        f = B.cortar(f, corte)
    f = B.desplazar(f, 0.006, 10, 3, 371)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.36, -0.36, -0.02), (0.36, 0.36, 0.8 if rota else alto + 0.03), 0.011,
          1300 if rota else 2200, 'piedra', p_caliza(371))
    if rota:
        # tambores caídos
        for k, (c, a) in enumerate([((0.35, -0.3, 0.19), 0.6), ((-0.32, -0.35, 0.18), 2.2)]):
            tam = lambda P: np.maximum(fuste(P + np.array([0, 0, 0.9])), np.abs(P[:, 2]) - 0.17)
            V, F = B.malla_sdf(B.desplazar(tam, 0.006, 10, 3, 372 + k), (-0.25, -0.25, -0.2), (0.25, 0.25, 0.2), 0.011, 500, 1)
            V = V @ B.rot_euler(math.pi / 2, 0, a).T + np.array(c)
            p.parte(V, F, 'piedra', p_caliza(372 + k))
        C.escombros(p, (0.0, -0.2, 0), 0.35, 6, 375, pintor=p_caliza(375), tam=(0.03, 0.07))
    return p


def campo_sarcofago(largo=0.95, ancho=0.4, alto=0.5):
    caja = B.caja((0, 0, alto / 2), (ancho, largo, alto / 2), r=0.02)
    zocalo = B.caja((0, 0, 0.05), (ancho + 0.04, largo + 0.04, 0.05), r=0.015)
    moldura = B.caja((0, 0, alto - 0.04), (ancho + 0.025, largo + 0.025, 0.035), r=0.012)

    def arcos(P):
        # arcadas talladas en los costados largos
        u = ((P[:, 1] + largo) % 0.38) - 0.19
        v = P[:, 2] - 0.12
        hueco = np.maximum(np.abs(u) - 0.12, np.maximum(-v, v - 0.22 - np.sqrt(np.maximum(0.0144 - u * u, 0)) * 0.6))
        prof = np.abs(np.abs(P[:, 0]) - ancho) - 0.012
        return np.maximum(hueco, prof)
    f = B.restar(B.union(caja, zocalo, moldura), arcos)
    return f


def sarcofago(abierto=False):
    nombre = 'deco_sarcofago_abierto' if abierto else 'deco_sarcofago'
    p = Pieza(nombre, 'deco', huella=[1, 2], alto=0.75, lugar='libre', solido=True)
    alto = 0.5
    f = campo_sarcofago(0.88, 0.36, alto)
    if abierto:
        f = B.restar(f, B.caja((0, 0, alto), (0.29, 0.81, 0.4), r=0.02))
    f = B.desplazar(f, 0.004, 14, 3, 381)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.46, -0.98, -0.02), (0.46, 0.98, alto + 0.02), 0.011, 2000, 'piedra',
          p_caliza(381))

    def tapa_f():
        losa = B.caja((0, 0, 0.04), (0.39, 0.92, 0.04), r=0.015)
        # efigie: el difunto acostado con las manos juntas
        cuerpo = B.elipsoide((0, 0.05, 0.1), (0.17, 0.55, 0.07))
        cabeza = B.esfera((0, -0.58, 0.13), 0.09)
        almohada = B.caja((0, -0.62, 0.1), (0.15, 0.1, 0.03), r=0.02)
        manos = B.elipsoide((0, -0.18, 0.18), (0.05, 0.06, 0.035))
        pies = B.union(B.elipsoide((0.06, 0.66, 0.12), (0.045, 0.05, 0.06)), B.elipsoide((-0.06, 0.66, 0.12), (0.045, 0.05, 0.06)))
        espada = B.caja((0, 0.15, 0.17), (0.012, 0.42, 0.01), r=0.004)
        return B.union(losa, B.union(cuerpo, cabeza, almohada, manos, pies, k=0.04), espada)
    tapa = B.desplazar(tapa_f(), 0.004, 14, 3, 382)
    V, F = B.malla_sdf(tapa, (-0.45, -1.0, -0.02), (0.45, 1.0, 0.28), 0.011, 2200, 1)
    if abierto:
        V = V @ B.rot_euler(0.0, -0.45, 0.22).T + np.array([0.48, 0.05, 0.12])
        V[:, 2] = np.maximum(V[:, 2], 0.0)
        Vc, Fc = C.calavera(1.0, 240)
        p.parte(B.transformar(Vc, (0.0, -0.58, 0.08), B.rot_euler(-1.3, 0, math.pi)), Fc, 'hueso', p_hueso(383))
        for k, (c, a) in enumerate([((0.08, -0.1, 0.09), 0.1), ((-0.1, 0.2, 0.09), -0.15), ((0.05, 0.45, 0.09), 0.05)]):
            Vh, Fh = C.hueso_m(0.3, 0.018, 90)
            p.parte(B.transformar(Vh, c, B.rot_euler(0, 0, math.pi / 2 + a)), Fh, 'hueso', p_hueso(384 + k))
        V2 = np.array([(-0.29, -0.81, 0.103), (0.29, -0.81, 0.103), (0.29, 0.81, 0.103), (-0.29, 0.81, 0.103)])
        p.parte(V2, np.array([(0, 1, 2), (0, 2, 3)]), 'piedra', lambda P, N: np.tile(hx('#1A1714'), (len(P), 1)), ao=False)
    else:
        V = V + np.array([0, 0, alto])
    p.parte(V, F, 'piedra', p_caliza(382))
    return p


def cadenas_pared():
    """Ménsula de piedra en la pared con cadenas que cuelgan hasta el piso y grilletes."""
    p = Pieza('deco_cadenas', 'deco', huella=[1, 1], alto=1.45, lugar='pared', solido=False)
    mensula = B.desplazar(B.union(B.caja((0, 0.45, 1.3), (0.28, 0.12, 0.08), r=0.015), B.caja((0, 0.42, 1.18), (0.16, 0.09, 0.08), r=0.02)), 0.004, 12, 3, 391)
    p.sdf(mensula, (-0.35, 0.25, 1.0), (0.35, 0.6, 1.45), 0.012, 300, 'piedra', p_caliza(391))
    met = B.metal('#3A3634', cant=0.6, semilla=392)
    for k, (x, largo) in enumerate([(-0.18, 1.0), (0.0, 1.2), (0.18, 0.75)]):
        Vg, Fg = B.toro_m((x, 0.36, 1.25), 0.03, 0.009, seg=10, seg2=4, eje=(1, 0, 0))
        p.parte(Vg, Fg, 'hierro', met)
        fin = 1.22 - largo
        C.cadena(p, [(x, 0.35, 1.2), (x + 0.01, 0.33, 1.2 - largo * 0.5), (x, 0.3, max(fin, 0.05))], 0.075, 0.01, semilla=393 + k)
        if fin > 0.1:
            Vs, Fs = B.toro_m((x, 0.3, fin - 0.04), 0.045, 0.012, seg=10, seg2=4, eje=(1, 0, 0))
            p.parte(Vs, Fs, 'hierro', met)
    # el resto de la cadena del medio en el piso
    C.cadena(p, [(0.0, 0.3, 0.03), (0.15, 0.1, 0.012), (0.3, 0.0, 0.012)], 0.075, 0.01, semilla=399)
    return p


def grilletes():
    """Argolla en el piso con cadena y grilletes abiertos (se camina encima)."""
    p = Pieza('deco_grilletes', 'deco', huella=[1, 1], alto=0.08, lugar='suelo', solido=False)
    piedra = B.desplazar(B.caja((0, 0, 0.02), (0.14, 0.14, 0.035), r=0.015), 0.004, 14, 2, 401)
    p.sdf(piedra, (-0.2, -0.2, -0.02), (0.2, 0.2, 0.07), 0.01, 160, 'piedra', p_caliza(401))
    met = B.metal('#3A3634', cant=0.65, semilla=402)
    V, F = B.toro_m((0, 0, 0.06), 0.05, 0.011, seg=10, seg2=4, eje=(1, 0, 0.3))
    p.parte(V, F, 'hierro', met)
    for k, (a, L) in enumerate([(0.4, 0.42), (2.0, 0.36)]):
        d = np.array([math.cos(a), math.sin(a), 0])
        fin = d * L + np.array([0, 0, 0.015])
        C.cadena(p, [(0, 0, 0.05), d * L * 0.5 + (0, 0, 0.015), fin], 0.05, 0.0075, semilla=403 + k)
        Vs, Fs = B.toro_m(fin + d * 0.05, 0.05, 0.012, seg=10, seg2=4, eje=(0.2, 0.2, 1))
        p.parte(Vs, Fs, 'hierro', met)
    Vh, Fh = C.hueso_m(0.22, 0.016, 80)
    p.parte(B.transformar(Vh, (-0.2, -0.25, 0.012), B.rot_euler(0, 0, 0.7)), Fh, 'hueso', p_hueso(405))
    return p


def jaula():
    """Jaula colgada de una horca de hierro, con un esqueleto adentro."""
    p = Pieza('deco_jaula', 'deco', huella=[1, 1], alto=2.3, lugar='borde', solido=True)
    met = B.metal('#36322F', cant=0.6, semilla=411)
    Vs, Fs, b = [], [], 0

    def ag(V, F):
        nonlocal b
        Vs.append(V)
        Fs.append(F + b)
        b += len(V)
    ag(*B.cilindro_m((0.32, 0.32, -0.05), (0.32, 0.32, 2.2), 0.035, seg=6))
    ag(*B.cilindro_m((0.32, 0.32, 2.15), (-0.05, -0.05, 2.15), 0.03, seg=6))
    ag(*B.cilindro_m((0.32, 0.32, 1.85), (0.12, 0.12, 2.15), 0.02, seg=5))
    ag(*B.caja_m((0.32, 0.32, 0.03), (0.12, 0.12, 0.03)))
    # jaula: barrotes curvos entre dos aros
    c = np.array([-0.05, -0.05, 0.0])
    z0, z1 = 0.95, 1.75
    for k in range(10):
        a = 2 * np.pi * k / 10
        d = np.array([math.cos(a), math.sin(a), 0])
        pts = [c + d * 0.18 + (0, 0, z0), c + d * 0.24 + (0, 0, (z0 * 2 + z1) / 3), c + d * 0.24 + (0, 0, (z0 + z1 * 2) / 3), c + d * 0.15 + (0, 0, z1)]
        ag(*B.tubo_m(pts, 0.009, seg=4, muestras=3, tapas=False))
    for z, r in ((z0, 0.18), (z1, 0.15), ((z0 + z1) / 2, 0.24)):
        ag(*B.toro_m(c + (0, 0, z), r, 0.011, seg=14, seg2=4))
    ag(*B.torno_m([(0.18, z0 - 0.005), (0.0, z0 - 0.01)], seg=10, c=c))
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'hierro', met)
    C.cadena(p, [c + (0, 0, z1 + 0.02), c + (0, 0, 2.13)], 0.06, 0.009, semilla=412)
    # esqueleto sentado
    Vc, Fc = C.calavera(1.0, 240)
    p.parte(B.transformar(Vc, c + (0.02, -0.02, z0 + 0.38), B.rot_euler(0.5, 0.2, 0.3)), Fc, 'hueso', p_hueso(413))
    for k in range(5):
        a0 = c + np.array([-0.06, 0.02, z0 + 0.12 + k * 0.05])
        V, F = B.tubo_m([a0, a0 + (0.06, -0.06, 0.01), a0 + (0.12, 0.0, 0.0)], [0.007, 0.006, 0.005], seg=4, muestras=3)
        p.parte(V, F, 'hueso', p_hueso(414 + k))
    for k, (cc, a) in enumerate([(c + (0.05, -0.05, z0 + 0.03), 0.4), (c + (-0.05, 0.06, z0 + 0.03), 1.8), (c + (0.0, 0.0, z0 + 0.22), 1.57)]):
        Vh, Fh = C.hueso_m(0.22, 0.015, 70)
        p.parte(B.transformar(Vh, cc, B.rot_euler(0, 0.3 if k == 2 else 0, a)), Fh, 'hueso', p_hueso(420 + k))
    C.huesos_suelo(p, (0, 0), 0.3, 3, 425)
    return p


def urnas():
    """Urnas funerarias y ánforas de barro, una rota con sus tiestos."""
    p = Pieza('deco_urnas', 'deco', huella=[1, 1], alto=0.6, lugar='libre', solido=True)
    barro = lambda s: B.manchado('#8A5E40', '#4A3020', escala=6, fuerza=0.45, semilla=s)
    perfiles = [
        [(0.0, 0.0), (0.08, 0.0), (0.16, 0.12), (0.18, 0.28), (0.12, 0.44), (0.06, 0.5), (0.07, 0.56), (0.05, 0.57), (0.0, 0.52)],
        [(0.0, 0.0), (0.07, 0.0), (0.13, 0.08), (0.14, 0.2), (0.09, 0.3), (0.06, 0.33), (0.07, 0.36), (0.0, 0.35)],
        [(0.0, 0.0), (0.06, 0.0), (0.12, 0.1), (0.13, 0.22), (0.1, 0.32), (0.08, 0.36), (0.0, 0.35)],
    ]
    for k, (perf, c) in enumerate(zip(perfiles, [(-0.15, 0.12), (0.2, 0.15), (0.05, -0.18)])):
        V, F = B.torno_m(perf, seg=14)
        if k == 2:
            # la rota: se corta en diagonal y se reparten tiestos
            ok = (V[:, 2] < 0.18 + 0.12 * np.sin(np.arctan2(V[:, 1], V[:, 0]) * 3)) | (np.hypot(V[:, 0], V[:, 1]) < 1e-3)
            keepF = ok[F].all(1)
            F = F[keepF]
        p.parte(B.transformar(V, (c[0], c[1], 0)), F, 'tierra', barro(431 + k))
    rng = B.azar(435)
    for k in range(5):
        a = rng.uniform(0, 6.28)
        cc = (0.05 + math.cos(a) * 0.22, -0.18 + math.sin(a) * 0.18, 0.01)
        V, F = B.malla_sdf(B.caja((0, 0, 0), (rng.uniform(0.03, 0.05), rng.uniform(0.02, 0.04), 0.006), r=0.004), (-0.07, -0.07, -0.02), (0.07, 0.07, 0.02), 0.007, 30, 0)
        p.parte(B.transformar(V, cc, B.rot_euler(rng.uniform(-0.5, 0.5), 0, a)), F, 'tierra', barro(440 + k))
    # sello de cera roja en la grande
    V, F = B.cilindro_m((-0.15, 0.12, 0.555), (-0.15, 0.12, 0.575), 0.05, seg=10)
    p.parte(V, F, 'cera', B.liso('#7A1A1A'))
    return p


def agua_negra():
    """Pozo de agua negra con brocal de piedra bajo (2 × 2 m)."""
    p = Pieza('deco_agua_negra', 'deco', huella=[2, 2], alto=0.25, lugar='libre', solido=True)

    def rr(P, a, b, r):
        q = np.abs(P[:, :2]) - np.array([a, b]) + r
        return np.sqrt((np.maximum(q, 0) ** 2).sum(1)) + np.minimum(q.max(1), 0) - r
    brocal = lambda P: np.maximum(np.maximum(rr(P, 0.85, 0.8, 0.35), -rr(P, 0.68, 0.63, 0.25)), np.abs(P[:, 2] - 0.09) - 0.1)
    f = lambda P: brocal(P) + C.juntas(np.stack([np.arctan2(P[:, 1], P[:, 0]) * 0.8, P[:, 1], P[:, 2]], 1), 0.2, 0.35, 0.008, 0.01, 'x') \
        + 0.004 * B.fbm(P, 12, 3, 451)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.95, -0.9, -0.02), (0.95, 0.9, 0.22), 0.013, 2200, 'piedra', p_caliza(451))
    n = 24
    V = [(0, 0, 0.1)]
    for k in range(n):
        a = 2 * np.pi * k / n
        c, s = math.cos(a), math.sin(a)
        r = 1 / max(abs(c) / 0.7, abs(s) / 0.65) ** 1
        V.append((c * r * 0.98, s * r * 0.98, 0.1))
    F = [(0, 1 + k, 1 + (k + 1) % n) for k in range(n)]
    p.parte(np.array(V), np.array(F), 'agua', lambda P, N: np.tile(hx('#101418'), (len(P), 1)), ao=False)
    # una calavera que flota a medias
    Vc, Fc = C.calavera(1.0, 200)
    p.parte(B.transformar(Vc, (0.2, -0.1, 0.05), B.rot_euler(-0.9, 0.3, 0.8)), Fc, 'hueso', p_hueso(452))
    return p


def reja_cripta():
    """Entrada de cripta: arco de piedra con reja y candado, oscuro adentro (contra la pared, 2 × 1 m)."""
    p = Pieza('deco_reja_cripta', 'deco', huella=[2, 1], alto=2.1, lugar='pared', solido=True)
    p.ao = dict(rayos=12, dist=0.4, fuerza=0.75, suelo=True)
    pilares = [B.caja((x, 0.3, 0.75), (0.17, 0.2, 0.75), r=0.015) for x in (-0.75, 0.75)]
    arco = B.cortar(B.restar(B.cilindro((0, 0.1, 1.5), (0, 0.5, 1.5), 0.92, borde=0.01), B.cilindro((0, 0.0, 1.5), (0, 0.6, 1.5), 0.58)),
                    lambda P: 1.5 - P[:, 2])
    clave = B.caja((0, 0.28, 2.1), (0.11, 0.22, 0.11), r=0.015)
    fondo = B.caja((0, 0.48, 1.05), (0.6, 0.04, 1.05))
    f = B.union(*pilares, arco, clave, fondo)
    f = lambda P, f=f: f(P) + C.juntas(P, 0.25, 0.34, 0.008, 0.009, 'y') * (np.abs(np.abs(P[:, 0]) - 0.75) < 0.18) + 0.004 * B.fbm(P, 10, 3, 461)
    pie = p_caliza(461)

    def pint(P, N):
        col = pie(P, N)
        dentro = (np.abs(P[:, 0]) < 0.58) & (P[:, 1] > 0.38) & (P[:, 2] < 2.05)
        prof = 0.08 + 0.25 * suave(1.9, 0.4, P[:, 2])
        return np.where(dentro[:, None], col * prof[:, None], col)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.98, 0.05, -0.02), (0.98, 0.56, 2.25), 0.014, 3200, 'piedra', pint)
    met = B.metal('#36322F', cant=0.55, semilla=462)
    Vs, Fs, b = [], [], 0

    def ag(V, F):
        nonlocal b
        Vs.append(V)
        Fs.append(F + b)
        b += len(V)
    for k in range(9):
        x = -0.52 + k * 0.13
        top = 1.5 + math.sqrt(max(0.58 ** 2 - x * x, 0)) - 0.04
        ag(*B.cilindro_m((x, 0.25, 0.0), (x, 0.25, top), 0.012, seg=5))
    for z in (0.12, 0.8, 1.45):
        ag(*B.cilindro_m((-0.58, 0.25, z), (0.58, 0.25, z), 0.014, seg=5))
    ag(*B.caja_m((0.05, 0.22, 0.8), (0.05, 0.02, 0.06)))
    ag(*B.toro_m((0.05, 0.2, 0.72), 0.03, 0.007, seg=8, seg2=4, eje=(0, 1, 0)))
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'hierro', met)
    C.cadena(p, [(-0.3, 0.22, 0.85), (0.0, 0.18, 0.7), (0.3, 0.22, 0.85)], 0.05, 0.008, semilla=463)
    return p


def estatua_monje():
    """Monje encapuchado de piedra rezando, sobre un pedestal (contra la pared)."""
    p = Pieza('deco_estatua_monje', 'deco', huella=[1, 1], alto=1.75, lugar='pared', solido=True)
    zp = 0.4
    ped = B.union(B.caja((0, 0.05, 0.05), (0.3, 0.3, 0.05), r=0.015), B.caja((0, 0.05, 0.22), (0.24, 0.24, 0.15), r=0.015), B.caja((0, 0.05, zp - 0.03), (0.27, 0.27, 0.03), r=0.01))
    habito = B.cono_r((0, 0.05, zp), (0, 0.04, zp + 0.95), 0.24, 0.12)

    def pliegues(P):
        a = np.arctan2(P[:, 1] - 0.05, P[:, 0])
        return 0.014 * np.sin(a * 7 + 1.2 * np.sin(P[:, 2] * 5)) * suave(zp + 0.9, zp + 0.1, P[:, 2])
    hombros = B.elipsoide((0, 0.04, zp + 0.92), (0.17, 0.12, 0.1))
    capucha = B.elipsoide((0, 0.02, zp + 1.1), (0.12, 0.13, 0.15))
    cara = B.elipsoide((0, -0.1, zp + 1.07), (0.075, 0.08, 0.1))
    manos = B.elipsoide((0, -0.13, zp + 0.88), (0.045, 0.05, 0.07))
    mangas = [B.capsula((s * 0.13, 0.0, zp + 0.88), (s * 0.03, -0.11, zp + 0.84), 0.055) for s in (-1, 1)]
    cuerpo = B.union(habito, hombros, capucha, manos, *mangas, k=0.04)
    cuerpo = B.restar(lambda P, c=cuerpo: c(P) + pliegues(P), cara, k=0.02)
    f = B.desplazar(B.union(ped, cuerpo), 0.004, 14, 3, 471)
    pie = p_caliza(471)

    def pint(P, N):
        col = pie(P, N)
        sombra = (P[:, 2] > zp + 0.98) & (P[:, 1] < -0.02) & (np.abs(P[:, 0]) < 0.08)
        return np.where(sombra[:, None], col * 0.3, col)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.36, -0.32, -0.02), (0.36, 0.42, 1.68), 0.011, 3200, 'piedra', pint)
    C.vela(p, (0.18, -0.22, zp), 0.07, 0.02, 472, llama=False)
    C.charco_cera(p, (0.16, -0.2, zp + 0.002), 0.06, 473)
    return p


def escombros_bloques():
    """Bloques de sillería caídos con polvo y piedritas."""
    p = Pieza('deco_escombros', 'deco', huella=[1, 1], alto=0.55, lugar='libre', solido=True)
    rng = B.azar(481)
    for k, (c, h) in enumerate([((-0.15, 0.05, 0.13), (0.24, 0.15, 0.13)), ((0.2, -0.1, 0.11), (0.2, 0.14, 0.11)), ((0.0, 0.15, 0.36), (0.22, 0.14, 0.12)),
                                ((-0.3, -0.25, 0.08), (0.12, 0.1, 0.08))]):
        R = B.rot_euler(rng.uniform(-0.15, 0.15), rng.uniform(-0.2, 0.2), rng.uniform(0, 3))
        f = B.desplazar(B.caja((0, 0, 0), h, r=0.02, R=R), 0.008, 9, 3, 481 + k)
        m = max(h) * 1.5
        p.sdf(lambda P, f=f, c=c: f(P - np.array(c)), np.array(c) - m, np.array(c) + m, 0.012, 260, 'piedra', p_caliza(481 + k))
    C.monticulo(p, (0, 0, 0), (0.42, 0.4), 0.08, 485, p_toba(485), 260, terrones=5)
    C.escombros(p, (0.1, -0.1, 0.0), 0.42, 7, 486, pintor=p_toba(486), tam=(0.025, 0.06))
    return p


# --------------------------------------------------------------------------
# Luces
# --------------------------------------------------------------------------

def luz_antorcha():
    """Antorcha en un soporte de hierro sobre una base de piedra."""
    p = Pieza('luz_antorcha', 'luz', huella=[1, 1], alto=1.45, lugar='libre', solido=True, luz=LUZ_ANTORCHA)
    base = B.desplazar(B.union(B.caja((0, 0, 0.06), (0.16, 0.16, 0.06), r=0.015), B.cilindro((0, 0, 0.1), (0, 0, 0.2), 0.08, borde=0.02)), 0.004, 12, 3, 491)
    p.sdf(base, (-0.22, -0.22, -0.02), (0.22, 0.22, 0.24), 0.01, 300, 'piedra', p_caliza(491))
    met = B.metal('#3A3634', cant=0.55, semilla=492)
    V, F = B.cilindro_m((0, 0, 0.18), (0, 0, 1.0), 0.02, seg=6)
    p.parte(V, F, 'hierro', met)
    for z in (0.45, 0.75):
        V, F = B.toro_m((0, 0, z), 0.028, 0.008, seg=8, seg2=4)
        p.parte(V, F, 'hierro', met)
    for k in range(4):
        a = 2 * np.pi * k / 4 + 0.4
        d = np.array([math.cos(a), math.sin(a), 0])
        Vb, Fb = B.tubo_m([(0, 0, 0.98), d * 0.05 + (0, 0, 1.06), d * 0.07 + (0, 0, 1.2)], 0.008, seg=4, muestras=3)
        p.parte(Vb, Fb, 'hierro', met)
    Va, Fa = B.toro_m((0, 0, 1.16), 0.07, 0.008, seg=10, seg2=4)
    p.parte(Va, Fa, 'hierro', met)
    C.antorcha_cabeza(p, (0, 0, 1.05), 493, 1.0)
    return p


def luz_vela():
    """Velas sobre una calavera y un bloque de piedra, con mucha cera chorreada."""
    p = Pieza('luz_vela', 'luz', huella=[1, 1], alto=0.45, lugar='libre', solido=False, luz=LUZ_VELA)
    bloque = B.desplazar(B.caja((0, 0.02, 0.1), (0.2, 0.16, 0.1), r=0.02), 0.005, 12, 3, 501)
    p.sdf(bloque, (-0.26, -0.2, -0.02), (0.26, 0.24, 0.23), 0.011, 300, 'piedra', p_caliza(501))
    C.charco_cera(p, (0.0, 0.02, 0.2), 0.15, 502)
    C.charco_cera(p, (0.12, -0.2, 0.0), 0.12, 503)
    Vc, Fc = C.calavera(1.0, 240)
    p.parte(B.transformar(Vc, (-0.08, 0.0, 0.2), B.rot_euler(0, 0, 0.3)), Fc, 'hueso', p_hueso(504))
    C.vela(p, (-0.085, 0.01, 0.33), 0.07, 0.022, 505)
    C.vela(p, (0.1, 0.05, 0.2), 0.16, 0.03, 506)
    C.vela(p, (0.12, -0.08, 0.2), 0.08, 0.026, 507)
    C.vela(p, (0.15, -0.25, 0.0), 0.12, 0.028, 508)
    C.vela(p, (0.02, -0.26, 0.0), 0.06, 0.024, 509)
    return p


def luz_candelabro():
    """Candelabro de hierro de pie (1,5 m) con cinco velas."""
    p = Pieza('luz_candelabro', 'luz', huella=[1, 1], alto=1.65, lugar='borde', solido=True, luz=LUZ_CANDELABRO)
    met = B.metal('#4A4440', oxido='#5A3A22', cant=0.4, semilla=511)
    V, F = B.torno_m([(0.0, 0.18), (0.035, 0.18), (0.05, 0.22), (0.022, 0.26), (0.02, 0.6), (0.04, 0.63), (0.02, 0.66), (0.018, 1.1),
                      (0.035, 1.13), (0.018, 1.16), (0.02, 1.2), (0.0, 1.2)], seg=8)
    p.parte(V, F, 'hierro', met)
    for k in range(3):
        a = 2 * np.pi * k / 3
        d = np.array([math.cos(a), math.sin(a), 0])
        Vb, Fb = B.tubo_m([(0, 0, 0.22), d * 0.12 + (0, 0, 0.12), d * 0.22 + (0, 0, 0.02), d * 0.25 + (0, 0, 0.0)], [0.016, 0.014, 0.012, 0.016], seg=5, muestras=3)
        p.parte(Vb, Fb, 'hierro', met)
    puntas = [(0.0, 0.0, 1.2)]
    for k in range(4):
        a = 2 * np.pi * k / 4 + 0.785
        d = np.array([math.cos(a), math.sin(a), 0])
        q = d * 0.24 + (0, 0, 1.22)
        Vb, Fb = B.tubo_m([(0, 0, 1.1), d * 0.12 + (0, 0, 1.06), d * 0.22 + (0, 0, 1.1), q], 0.011, seg=5, muestras=3)
        p.parte(Vb, Fb, 'hierro', met)
        puntas.append(tuple(q))
    for k, q in enumerate(puntas):
        Vp, Fp = B.torno_m([(0.0, -0.01), (0.045, 0.0), (0.05, 0.015), (0.0, 0.012)], seg=8, c=q)
        p.parte(Vp, Fp, 'hierro', met)
        C.vela(p, (q[0], q[1], q[2] + 0.01), 0.14 if k == 0 else 0.1 + 0.03 * (k % 2), 0.022, 512 + k)
    return p


def luz_altar_huesos():
    """Altarcito hecho de calaveras con velas encima."""
    p = Pieza('luz_altar_huesos', 'luz', huella=[1, 1], alto=0.75, lugar='pared', solido=True, luz=LUZ_VELA)
    losa = B.desplazar(B.caja((0, 0.1, 0.44), (0.4, 0.22, 0.035), r=0.012), 0.004, 12, 3, 521)
    p.sdf(losa, (-0.46, -0.16, 0.38), (0.46, 0.36, 0.5), 0.011, 400, 'piedra', p_caliza(521))
    Vc, Fc = C.calavera(1.0, 150)
    rng = B.azar(522)
    k = 0
    for z in (0.0, 0.135, 0.27):
        for x in (-0.3, -0.1, 0.1, 0.3):
            for y in (0.0,):
                R = B.rot_euler(0, 0, rng.uniform(-0.3, 0.3))
                p.parte(B.transformar(Vc, (x, y, z), R, 0.95), Fc, 'hueso', p_hueso(522 + k))
                k += 1
    C.charco_cera(p, (0.0, 0.08, 0.475), 0.2, 540)
    for j, (x, y, h) in enumerate([(-0.25, 0.15, 0.18), (-0.08, 0.02, 0.12), (0.1, 0.18, 0.22), (0.27, 0.0, 0.1)]):
        C.vela(p, (x, y, 0.475), h, 0.026, 541 + j)
    Vh, Fh = C.hueso_m(0.3, 0.018, 80)
    p.parte(B.transformar(Vh, (0.0, -0.05, 0.49), B.rot_euler(0, 0, 0.1)), Fh, 'hueso', p_hueso(550))
    return p


def huesos():
    p = CE.huesos()
    p.extras['peso'] = 1.5
    return p


PIEZAS = {
    'pared_blanda_a': pared_toba(601),
    'pared_blanda_b': pared_osario(602),
    'pared_blanda_c': pared_nicho(603),
    'pared_dura_a': pared_sillar(604),
    'pared_dura_b': pared_sillar(605, argolla=True),
    'pared_borde': pared_borde(606),
    'veta_hierro': C.veta(toba_base(607), 'hierro', 607),
    'veta_sangre': C.veta(toba_base(608), 'sangre', 608),
    'veta_oro': C.veta(toba_base(609), 'oro', 609),
    'piso_a': piso_losas(611, [], peso=3),
    'piso_b': piso_losas(612, ['huesos'], peso=2),
    'piso_c': piso_losas(613, ['agua'], peso=1),
    'piso_d': piso_losas(614, ['rotas', 'escombros'], peso=1.5),
    'piso_e': piso_losas(615, ['reja', 'huesos'], peso=0.7),
    'deco_nicho_calaveras': nicho_calaveras,
    'deco_osario': osario,
    'deco_columna': lambda: columna(False),
    'deco_columna_rota': lambda: columna(True),
    'deco_sarcofago': lambda: sarcofago(False),
    'deco_sarcofago_abierto': lambda: sarcofago(True),
    'deco_cadenas': cadenas_pared,
    'deco_grilletes': grilletes,
    'deco_jaula': jaula,
    'deco_urnas': urnas,
    'deco_agua_negra': agua_negra,
    'deco_reja_cripta': reja_cripta,
    'deco_estatua_monje': estatua_monje,
    'deco_escombros': escombros_bloques,
    'deco_huesos': huesos,
    'deco_calaveras': CE.calaveras,
    'luz_antorcha': luz_antorcha,
    'luz_vela': luz_vela,
    'luz_candelabro': luz_candelabro,
    'luz_altar_huesos': luz_altar_huesos,
}
