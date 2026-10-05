"""Sangre y Ceniza · El Cementerio Hundido: lodo, barrancos de tierra con raíces y huesos, muros de piedra con musgo,
lápidas torcidas, mausoleos, ángeles que lloran, rejas oxidadas, árboles secos, faroles y velas.

Todo en el origen (centro de la base), el frente hacia -Y (la espalda de lo que va contra la pared hacia +Y).
"""
import math

import numpy as np

import sangre_biomas_base as B
import sangre_biomas_comun as C
from sangre_biomas_base import Pieza, hx, mezclar, suave

# Paleta (sRGB): tonos medios, que se lean en la oscuridad
TIERRA = '#6E5844'
TIERRA_OSC = '#46362A'
LODO = '#4E4034'
LODO_OSC = '#2E261F'
PASTO = '#66713E'
PASTO_SECO = '#8A7E48'
MUSGO = '#5A6E36'
LIQUEN = '#A6A86E'
LAPIDA = '#8E8B84'
LAPIDA_OSC = '#55524D'
GRANITO = '#5C5862'
GRANITO_OSC = '#34313A'

LUZ_ANTORCHA = dict(color='#FF9A45', intensidad=1.2, alcance=6.0, particulas='fuego')
LUZ_VELA = dict(color='#FFB866', intensidad=0.7, alcance=3.5, particulas='fuego')
LUZ_FAROL = dict(color='#FFC07A', intensidad=1.0, alcance=5.0, particulas='fuego')


# --------------------------------------------------------------------------
# Pintores del bioma
# --------------------------------------------------------------------------

def p_tierra(semilla):
    piedra = B.piedra('#86817A', '#4E4A45', musgo=MUSGO, musgo_cant=0.3, escala=4, humedad=0, semilla=semilla + 50)

    def p(P, N):
        n = B.fbm(P, 2.2, 4, semilla)
        col = mezclar(hx(TIERRA_OSC), hx(TIERRA), np.clip(0.55 + 0.7 * n, 0, 1))
        capa = np.sin(P[:, 2] * 14 + 3 * B.fbm(P, 1.5, 2, semilla + 3))
        col = col * (1 + 0.1 * capa)[:, None]
        m = suave(0.58, 0.64, B.ruido(P, 6, semilla + 9))
        col = mezclar(col, piedra(P, N), m)
        raicillas = suave(0.82, 0.95, 1 - np.abs(B.ruido(P * np.array([1, 1, 0.35]), 7, semilla + 11)))
        col = mezclar(col, hx('#3A2C20'), raicillas * 0.6)
        return col * (1 - 0.3 * (1 - suave(0.0, 0.4, P[:, 2])))[:, None]
    return p


def p_pasto(semilla):
    """Pasto del techo de los barrancos (encaja con el bloque vecino, ver C.pintor_techo)."""
    def fabrica(rn, s):
        def p(P, N):
            n = rn(P, 3, 3, s + 20)
            col = mezclar(hx(PASTO) * 0.78, hx(PASTO) * 1.05, np.clip(0.5 + 0.8 * n, 0, 1))
            seco = suave(0.15, 0.55, rn(P, 2, 2, s + 21))
            col = mezclar(col, hx(PASTO_SECO), seco * 0.55)
            tierra = suave(0.38, 0.65, rn(P, 4, 3, s + 22))
            col = mezclar(col, hx(TIERRA), tierra * 0.7)
            hojas = suave(0.55, 0.7, rn(P, 18, 1, s + 24))
            col = mezclar(col, hx('#8A5A2E'), hojas * 0.5)
            grieta = suave(0.9, 0.975, 1 - np.abs(rn(P, 2, 2, s + 27)))
            col = mezclar(col, hx(TIERRA_OSC), grieta * 0.6)
            return col * (1 + 0.1 * rn(P, 24, 1, s + 23))[:, None]
        return p
    return C.pintor_techo(fabrica, semilla)


def p_suelta(semilla, base=None, oscuro=None):
    """Tierra removida: terrones oscuros, piedritas y raicillas."""
    B1, O = hx(base or '#6A5442'), hx(oscuro or '#3C2E22')

    def p(P, N):
        col = mezclar(O, B1, np.clip(0.5 + 0.8 * B.fbm(P, 7, 3, semilla), 0, 1))
        piedritas = suave(0.62, 0.7, B.ruido(P, 22, semilla + 1))
        col = mezclar(col, hx('#8A857C'), piedritas * 0.8)
        terron = suave(0.3, 0.6, B.ruido(P, 11, semilla + 2))
        col = mezclar(col, O * 0.8, terron * 0.5)
        return col * (0.8 + 0.2 * suave(-0.5, 0.8, N[:, 2]))[:, None]
    return p


def p_lapida(semilla, musgo=0.45, liquen=0.5, base=LAPIDA, oscuro=LAPIDA_OSC):
    pie = B.piedra(base, oscuro, musgo=MUSGO, musgo_cant=musgo, escala=3.5, humedad=0.3, alto_humedad=0.3,
                   semilla=semilla, vetas=0.3, mancha=LIQUEN, mancha_cant=liquen * 0.6)

    def p(P, N):
        col = pie(P, N)
        # chorreones de mugre (manchas estiradas hacia abajo)
        ch = suave(0.35, 0.7, B.ruido(P * np.array([4.0, 4.0, 0.5]), 3, semilla + 40))
        return col * (1 - 0.28 * ch)[:, None]
    return p


def p_granito(semilla):
    return B.piedra(GRANITO, GRANITO_OSC, claro='#7A7684', musgo=MUSGO, musgo_cant=0.35, escala=2.0, humedad=0.25,
                    semilla=semilla, vetas=0.45, color_vetas='#24222A')


def p_piedrita(semilla):
    return B.piedra('#86817A', '#4E4A45', musgo=MUSGO, musgo_cant=0.35, escala=5, humedad=0.0, semilla=semilla)


# --------------------------------------------------------------------------
# Paredes
# --------------------------------------------------------------------------

def _pasto_arriba(p, V, N, semilla, n=5):
    for k, (q, nq) in enumerate(C.puntos_superficie(V, N, n, semilla + 300, zmin=1.3, lados=False, sep=0.25)):
        C.pasto(p, (q[0], q[1], q[2] - 0.01), 0.12, 6, rng_alto(semilla + k), PASTO, PASTO_SECO, semilla + k)


def rng_alto(s):
    return 0.09 + 0.06 * B.azar(s).random()


def _piedras(p, V, N, semilla, n=4, r=(0.06, 0.12), lados=True, arriba=True):
    rng = B.azar(semilla + 400)
    for k, (q, nq) in enumerate(C.puntos_superficie(V, N, n, semilla + 401, lados=lados, arriba=arriba, sep=0.3)):
        rr = rng.uniform(*r)
        c = q - nq * rr * 0.45
        f = B.desplazar(B.caja(c, (rr, rr * 0.8, rr * 0.7), r=rr * 0.55, R=B.rot_euler(*rng.uniform(0, 3, 3))), rr * 0.12, 1 / rr, 2, semilla + k)
        m = rr * 1.5
        p.sdf(f, c - m, c + m, rr / 6, 70, 'piedra', p_piedrita(semilla + k))


def tierra_base(semilla, rocas=2):
    """Barranco de tierra con pasto: la roca blanda del cementerio (también la base de las vetas)."""
    def fn():
        p = Pieza('pared_blanda', 'pared', dureza='blanda', huella=[1, 1], alto=1.5)
        arriba = p_pasto(semilla)
        C.bloque_roca(p, semilla, C.pintor_pared(p_tierra(semilla), arriba), arriba, rug=0.05, estratos=0.022, amp_var=0.035)
        if rocas:
            C.roca_base(p, semilla, p_piedrita(semilla), n=rocas, tam=(0.08, 0.14))
        return p
    return fn


def pared_blanda(semilla, extra):
    def fn():
        p = tierra_base(semilla)()
        V, N = C.malla_base(p)
        _pasto_arriba(p, V, N, semilla, 3)
        _piedras(p, V, N, semilla, 3)
        rng = B.azar(semilla + 7)
        if extra == 'raices':
            for k, (q, nq) in enumerate(C.puntos_superficie(V, N, 4, semilla + 8, zmin=0.9, zmax=1.35, arriba=False, sep=0.3)):
                lado = np.array([nq[0], nq[1], 0])
                lado /= max(np.linalg.norm(lado), 1e-6)
                L = rng.uniform(0.4, 0.8)
                pts = [q - lado * 0.02, q + lado * 0.05 + (0, 0, -L * 0.3), q + lado * 0.07 + (rng.uniform(-.1, .1), rng.uniform(-.1, .1), -L * 0.7),
                       q + lado * 0.04 + (rng.uniform(-.1, .1), rng.uniform(-.1, .1), -L)]
                C.raiz(p, pts, 0.026, 0.006, semilla=semilla + k)
        elif extra == 'huesos':
            for k, (q, nq) in enumerate(C.puntos_superficie(V, N, 3, semilla + 9, zmin=0.3, zmax=1.1, arriba=False, sep=0.35)):
                nh = np.array([nq[0], nq[1], 0.15])
                if k == 0:
                    Vc, Fc = C.calavera(1.1, 300)
                    R = C.orientar(nh) @ B.rot_euler(rng.uniform(-0.3, 0.3), 0, rng.uniform(-0.4, 0.4))
                    p.parte(B.transformar(Vc, q - nq * 0.05, R), Fc, 'hueso', B.hueso(semilla=semilla + k))
                else:
                    Vh, Fh = C.hueso_m(rng.uniform(0.22, 0.32), 0.02)
                    R = C.orientar(nh) @ B.rot_euler(0, 0, math.pi / 2 + rng.uniform(-0.5, 0.5))
                    p.parte(B.transformar(Vh, q - nq * 0.02, R @ B.rot_euler(0, rng.uniform(-0.6, 0.6), 0)), Fh, 'hueso', B.hueso(semilla=semilla + k))
        elif extra == 'hongos':
            for k, (q, nq) in enumerate(C.puntos_superficie(V, N, 2, semilla + 10, zmin=0.1, zmax=0.6, arriba=False, sep=0.4)):
                hongos(p, q - nq * 0.02, nq, semilla + k, 0.8)
        return p
    return fn


def muro_cementerio(semilla, roto=False):
    """Muro viejo de piedras del cementerio (roca dura): sillares rústicos, musgo arriba, hiedra."""
    def fn():
        p = Pieza('pared_dura', 'pared', dureza='dura', huella=[1, 1], alto=1.5)
        g, _ = C.campo_muro(semilla, hiladas=6, junta=0.03, rug=0.016, desorden=0.025, bisel=0.05, faltan=0.08 if roto else 0.0)
        if roto:
            g0 = g
            g = lambda P: np.maximum(g0(P), P[:, 2] - (1.25 + 0.2 * np.sin(P[:, 0] * 4 + 1) + 0.08 * np.sin(P[:, 1] * 9)))
        V, F = C.malla_pared(g, 1000, voxel=0.022)
        piedra = B.piedra('#8A867E', '#4E4A44', claro='#A09A90', musgo=MUSGO, musgo_cant=0.55, escala=2.5, humedad=0.4,
                          alto_humedad=0.5, semilla=semilla, mancha=LIQUEN, mancha_cant=0.35)
        p.parte(V, F, 'piedra', piedra)
        N = B.normales(V, F)
        # hiedra muerta subiendo por los lados
        rng = B.azar(semilla + 3)
        for k, (q, nq) in enumerate(C.puntos_superficie(V, N, 2, semilla + 4, zmin=0.0, zmax=0.25, arriba=False, sep=0.4)):
            lado = np.array([nq[0], nq[1], 0])
            lado /= max(np.linalg.norm(lado), 1e-6)
            t = np.cross(lado, (0, 0, 1))
            pts = [q + lado * 0.01 + (0, 0, -0.05)]
            for j in range(1, 6):
                pts.append(q + lado * (0.015 + 0.01 * rng.random()) + t * rng.uniform(-0.15, 0.15) + (0, 0, j * 0.24))
            C.raiz(p, pts, 0.014, 0.006, color='#4E4230', semilla=semilla + k)
        _pasto_arriba(p, V, N, semilla, 3)
        return p
    return fn


def borde_cementerio(semilla):
    """Roca imposible del borde: granito oscuro, grande y agrietado."""
    def fn():
        p = Pieza('pared_borde', 'pared', dureza='borde', huella=[1, 1], alto=1.6)
        pint = p_granito(semilla)
        C.bloque_roca(p, semilla, pint, pint, alto=1.55, rug=0.06, estratos=0.0, angular=0.6, escala_rug=2.2, amp_var=0.05)
        C.roca_base(p, semilla, pint, n=3, tam=(0.1, 0.18))
        return p
    return fn


# --------------------------------------------------------------------------
# Pisos
# --------------------------------------------------------------------------

def p_lodo(semilla_hojas=0, hojas=0.0, pasto=0.5):
    def p(P, N):
        n = C.fbm_piso(P, 1, 4, 410)
        col = mezclar(hx(LODO_OSC), hx(LODO), np.clip(0.5 + 0.8 * n, 0, 1))
        col = mezclar(col, hx('#6A5A46'), suave(0.2, 0.55, C.ruido_piso(P, 3, 414)) * 0.5)
        humedo = suave(0.15, 0.4, C.fbm_piso(P, 2, 3, 411))
        col = mezclar(col, hx('#241D18'), humedo * 0.55)
        pas = suave(0.2, 0.5, C.fbm_piso(P, 2, 3, 412))
        col = mezclar(col, hx(PASTO) * 0.85, pas * pasto)
        if hojas > 0:
            h = suave(0.55, 0.7, C.ruido_piso(P, 10, semilla_hojas)) * suave(-0.2, 0.3, C.fbm_piso(P, 2, 2, semilla_hojas + 1))
            col = mezclar(col, hx('#94622E'), h * hojas)
        return col * (1 + 0.1 * C.ruido_piso(P, 16, 413))[:, None]
    return p


def alto_lodo(P):
    return 0.03 * C.fbm_piso(P, 1, 3, 400) + 0.012 * C.fbm_piso(P, 4, 2, 401)


def piso_lodo(semilla, cosas, hojas=0.0, peso=1.0):
    def fn():
        p = Pieza('piso', 'piso', huella=[2, 2], peso=peso)
        p.ao = dict(rayos=8, dist=0.12, fuerza=0.6, suelo=False)
        p.bordes = dict(claro=0.15, oscuro=0.15, escala=2.0)
        rng = B.azar(semilla)
        cc = (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3)) if 'charco' in cosas else None

        def alto(P):
            z = alto_lodo(P)
            if cc is not None:
                e = ((P[:, 0] - cc[0]) / 0.6) ** 2 + ((P[:, 1] - cc[1]) / 0.46) ** 2
                z = z - 0.06 * suave(1.0, 0.45, e)
            return z
        if 'losas' in cosas:
            losas_rotas(p, semilla)
        else:
            C.piso_campo(p, alto, p_lodo(semilla, hojas), 22)
        for k in range(rng.integers(2, 4)):
            C.pasto(p, (rng.uniform(-0.75, 0.75), rng.uniform(-0.75, 0.75), 0.0), 0.12, 6, 0.1, PASTO, PASTO_SECO, semilla + k)
        if 'piedras' in cosas:
            C.escombros(p, (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), 0.0), 0.3, 4, semilla + 9, pintor=p_piedrita(semilla), tam=(0.03, 0.07))
        if 'huesos' in cosas:
            for k in range(2):
                Vh, Fh = C.hueso_m(rng.uniform(0.18, 0.28), 0.018)
                c = (rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), 0.012)
                p.parte(B.transformar(Vh, c, B.rot_euler(0, 0, rng.uniform(0, 6))), Fh, 'hueso', B.hueso(semilla=semilla + k))
        if cc is not None:
            charco(p, cc, (0.45, 0.32), semilla, z_agua=-0.012)
        if 'hojas' in cosas:
            hojarasca(p, semilla, 14)
        return p
    return fn


def losas_rotas(p, semilla):
    """Camino viejo de losas hundidas en el lodo (las juntas exteriores caen en el borde)."""
    # losas solo en el centro (hasta 0,8 m del centro): la franja del borde es el mismo lodo de los otros pisos
    rects = [tuple(v * 0.8 for v in r) for r in C.losas_fila(semilla, filas=(0.5, 0.5, 0.5, 0.5), anchos=(0.45, 0.8))]
    rng = B.azar(semilla + 1)
    keep = [r for r in rects if rng.random() > 0.2]
    f = C.alto_losas(keep, semilla, junta=0.05, hundir=0.025, bisel=0.035, desnivel=0.015, inclina=0.015)
    lodo = p_lodo(semilla, 0.3, pasto=0.6)
    piedra = B.piedra('#8C877F', '#55514B', musgo=MUSGO, musgo_cant=0.4, escala=3, humedad=0.0, semilla=semilla,
                      mancha=LIQUEN, mancha_cant=0.3)

    def alto(P):
        z, _ = f(P)
        lodo_z = alto_lodo(P)
        w = suave(0.92, 0.82, np.maximum(np.abs(P[:, 0]), np.abs(P[:, 1])))
        return lodo_z * (1 - w) + w * np.maximum(z + 0.01, lodo_z - 0.015)

    def pint(P, N):
        z, idx = f(P)
        en_losa = suave(-0.02, -0.005, z) * (idx >= 0)
        return mezclar(lodo(P, N), piedra(P, N), en_losa)
    C.piso_campo(p, alto, pint, 30)


def charco(p, c, r, semilla, z_agua=0.012):
    """Charco de agua negra (material `agua`, brilla con las antorchas)."""
    rng = B.azar(semilla + 77)
    pts = []
    n = 14
    for k in range(n):
        a = 2 * np.pi * k / n
        rr = 1 + 0.25 * math.sin(a * 3 + rng.uniform(0, 6)) + 0.1 * rng.uniform(-1, 1)
        pts.append((c[0] + math.cos(a) * r[0] * rr, c[1] + math.sin(a) * r[1] * rr, z_agua))
    V = np.array([(c[0], c[1], z_agua)] + pts)
    F = np.array([(0, 1 + k, 1 + (k + 1) % n) for k in range(n)])
    p.parte(V, F, 'agua', lambda P, N: np.tile(hx('#1A1E26'), (len(P), 1)), ao=False)
    # orilla de lodo (anillo: el agua queda a la vista)
    C.monticulo(p, (c[0], c[1], 0), (r[0] * 1.25, r[1] * 1.25), z_agua + 0.02, semilla, B.manchado(LODO, LODO_OSC, 5, semilla=semilla),
                220, terrones=4, hueco=0.82)


def hojarasca(p, semilla, n=12, area=0.85):
    """Hojas secas sueltas (triángulos doblados)."""
    rng = B.azar(semilla + 55)
    Vs, Fs, b = [], [], 0
    for k in range(n):
        c = np.array([rng.uniform(-area, area), rng.uniform(-area, area), 0.012])
        a = rng.uniform(0, 6.28)
        L = rng.uniform(0.04, 0.07)
        d = np.array([math.cos(a), math.sin(a), 0])
        t = np.array([-d[1], d[0], 0])
        V = np.array([c - d * L, c + t * L * 0.45 + (0, 0, 0.01), c + d * L, c - t * L * 0.45 + (0, 0, 0.01), c + (0, 0, 0.004)])
        F = np.array([(0, 4, 1), (1, 4, 2), (2, 4, 3), (3, 4, 0)])
        Vs.append(V)
        Fs.append(F + b)
        b += 5
    cols = [hx('#9A6A34'), hx('#7A4A26'), hx('#A88A48')]

    def pint(P, N):
        i = (np.floor(np.abs(B.ruido(P, 9, semilla)) * 7).astype(int)) % 3
        return np.array([cols[j] for j in i])
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'tela', pint)


# --------------------------------------------------------------------------
# Decoración
# --------------------------------------------------------------------------

def campo_lapida(forma, ancho, alto, grosor, semilla, grabado='cruz'):
    """Lápida de pie (base en z = 0, frente hacia -Y)."""
    rng = B.azar(semilla)
    w, t = ancho / 2, grosor / 2
    if forma == 'redonda':
        zc = alto - w
        cuerpo = B.union(B.caja((0, 0, zc / 2), (w, t, zc / 2), r=0.012), B.cilindro((0, -t, zc), (0, t, zc), w, borde=0.012))
        cuerpo = B.cortar(cuerpo, lambda P: -P[:, 2] - 0.0)
    elif forma == 'gotica':
        zc = alto - w * 1.4
        arco = B.cortar(B.cilindro((-w * 0.45, -t, zc), (-w * 0.45, t, zc), w * 1.45, borde=0.01),
                        B.cilindro((w * 0.45, -t, zc), (w * 0.45, t, zc), w * 1.45, borde=0.01))
        arco = B.cortar(arco, lambda P: zc - P[:, 2] - 0.0)
        cuerpo = B.union(B.caja((0, 0, zc / 2), (w, t, zc / 2), r=0.012), arco)
    else:  # recta con hombros
        cuerpo = B.union(B.caja((0, 0, alto / 2 - 0.03), (w, t, alto / 2 - 0.03), r=0.015),
                         B.caja((0, 0, alto - 0.03), (w * 0.7, t, 0.04), r=0.015))
    # moldura: marco rehundido al frente
    marco = B.caja((0, -t - 0.01, alto * 0.48), (w * 0.72, 0.016, alto * 0.3), r=0.01)
    dentro = B.caja((0, -t - 0.01, alto * 0.48), (w * 0.62, 0.03, alto * 0.24), r=0.01)
    f = B.restar(cuerpo, lambda P: np.maximum(marco(P), -dentro(P)) + 0.008)
    lineas = []
    if grabado == 'cruz':
        cz = alto * 0.62
        lineas += [((0, -t, cz - 0.12), (0, -t, cz + 0.1)), ((-0.06, -t, cz + 0.03), (0.06, -t, cz + 0.03))]
    for k in range(3):
        z = alto * (0.38 - 0.07 * k)
        lineas.append(((-w * 0.45 + 0.02 * k, -t, z), (w * 0.45 - 0.03 * k, -t, z)))
    f = C.grabar(f, lineas, 0.013)
    # grieta y despicados
    a = rng.uniform(-0.6, 0.6)
    grieta = B.caja((rng.uniform(-w, w) * 0.5, 0, alto * rng.uniform(0.5, 0.8)), (w * 0.6, t * 2, 0.004), R=B.rot_euler(0, a, 0))
    golpes = [B.esfera((rng.choice([-w, w]), rng.uniform(-t, t), rng.uniform(0.2, 1.0) * alto), rng.uniform(0.03, 0.06)) for _ in range(2)]
    f = B.restar(f, grieta, *golpes, k=0.01)
    return B.desplazar(f, 0.006, 14, 3, semilla + 1)


def lapida_pieza(nombre, forma, ancho, alto, grosor, semilla, incl=(0.12, 0.08), alto_pieza=None, lugar='libre'):
    def fn():
        p = Pieza(nombre, 'deco', huella=[1, 1], alto=alto_pieza or alto, lugar=lugar, solido=True)
        f = campo_lapida(forma, ancho, alto, grosor, semilla)
        R = B.rot_euler(incl[0], incl[1], 0)
        g = B.mover_f(f, (0, 0.05, -0.06), R)
        m = max(ancho, alto) * 0.75
        p.sdf(lambda P: np.maximum(g(P), -(P[:, 2] + 0.02)), (-m, -m, -0.04), (m, m, alto + 0.08), 0.011, 1400, 'piedra',
              p_lapida(semilla))
        # tierra removida delante y pasto alrededor
        C.monticulo(p, (0, -0.32, 0), (ancho * 0.55, 0.32), 0.06, semilla, p_suelta(semilla), 260, terrones=5)
        C.pasto(p, (ancho * 0.45, 0.05, 0), 0.1, 6, 0.12, PASTO, PASTO_SECO, semilla + 1)
        C.pasto(p, (-ancho * 0.5, 0.0, 0), 0.08, 5, 0.1, PASTO, PASTO_SECO, semilla + 2)
        return p
    return fn


def lapida_cruz():
    """Cruz celta de piedra sobre un pedestal escalonado."""
    p = Pieza('deco_lapida_cruz', 'deco', huella=[1, 1], alto=1.2, lugar='borde', solido=True)
    base = B.union(B.caja((0, 0, 0.08), (0.28, 0.2, 0.08), r=0.015), B.caja((0, 0, 0.22), (0.2, 0.14, 0.07), r=0.015))
    palo = B.caja((0, 0, 0.66), (0.065, 0.05, 0.38), r=0.012)
    brazo = B.caja((0, 0, 0.86), (0.25, 0.05, 0.06), r=0.012)
    aro = B.cortar(B.toro((0, 0, 0.86), 0.15, 0.028, eje='y'), B.caja((0, 0, 0.86), (1, 0.035, 1)))
    centro = B.cilindro((0, -0.06, 0.86), (0, 0.06, 0.86), 0.05, borde=0.01)
    f = B.union(base, palo, brazo, aro, centro, k=0.01)
    lineas = [((-0.1, -0.2, 0.12), (0.1, -0.2, 0.12)), ((-0.08, -0.2, 0.06), (0.08, -0.2, 0.06))]
    f = C.grabar(f, lineas, 0.012)
    # nudos celtas: surcos en el palo
    f = B.restar(f, *[B.toro((0, -0.05, z), 0.03, 0.006, eje='y') for z in (0.5, 0.62, 0.74)])
    f = B.desplazar(f, 0.005, 14, 3, 31)
    R = B.rot_euler(0.06, -0.1, 0.2)
    g = B.mover_f(f, (0, 0, -0.02), R)
    p.sdf(lambda P: np.maximum(g(P), -(P[:, 2] + 0.02)), (-0.45, -0.4, -0.04), (0.45, 0.4, 1.2), 0.011, 1500, 'piedra', p_lapida(31, 0.5, 0.6))
    C.pasto(p, (0.2, -0.22, 0), 0.1, 6, 0.12, PASTO, PASTO_SECO, 3)
    C.pasto(p, (-0.25, 0.15, 0), 0.1, 6, 0.12, PASTO, PASTO_SECO, 4)
    return p


def lapida_rota():
    p = Pieza('deco_lapida_rota', 'deco', huella=[1, 1], alto=0.45, lugar='libre', solido=True)
    f = campo_lapida('redonda', 0.5, 0.85, 0.11, 41)
    corte = lambda P: P[:, 2] - (0.38 + 0.08 * np.sin(P[:, 0] * 11) + 0.03 * np.sin(P[:, 0] * 31))
    abajo = B.cortar(f, corte)
    arriba = B.cortar(f, lambda P: -corte(P))
    g1 = B.mover_f(abajo, (0, 0.15, -0.04), B.rot_euler(-0.12, 0.05, 0))
    p.sdf(lambda P: np.maximum(g1(P), -(P[:, 2] + 0.02)), (-0.4, -0.2, -0.04), (0.4, 0.4, 0.5), 0.011, 700, 'piedra', p_lapida(41))
    # el pedazo de arriba tumbado en el piso, boca arriba
    R = B.rot_euler(-math.pi / 2 + 0.06, 0.08, 0.35)
    V, F = B.malla_sdf(lambda P: np.maximum(arriba(P), -(P[:, 2] - 0.3)), (-0.35, -0.12, 0.25), (0.35, 0.12, 0.95), 0.011, 700, 1)
    V = V - np.array([0, 0, 0.38])
    V = V @ R.T + np.array([0.06, -0.45, 0.06])
    p.parte(V, F, 'piedra', p_lapida(42))
    C.escombros(p, (0.0, -0.05, 0), 0.25, 5, 43, pintor=p_lapida(43), tam=(0.025, 0.05))
    C.pasto(p, (-0.28, 0.2, 0), 0.1, 6, 0.12, PASTO, PASTO_SECO, 5)
    return p


def lapidas_grupo():
    """Tres lapiditas viejas en fila, cada una torcida a su manera (2 × 1 m)."""
    p = Pieza('deco_lapidas_grupo', 'deco', huella=[2, 1], alto=0.75, lugar='libre', solido=True)
    for k, (x, forma, a, h) in enumerate([(-0.62, 'gotica', 0.38, 0.72), (0.0, 'recta', 0.42, 0.6), (0.6, 'redonda', 0.36, 0.55)]):
        f = campo_lapida(forma, a, h, 0.09, 50 + k)
        R = B.rot_euler(0.1 * (k - 1) + 0.08, 0.12 * (1 - k), 0.1 * k)
        g = B.mover_f(f, (x, 0.1, -0.05), R)
        p.sdf(lambda P, g=g: np.maximum(g(P), -(P[:, 2] + 0.02)), (x - 0.4, -0.35, -0.04), (x + 0.4, 0.45, h + 0.1), 0.011, 800,
              'piedra', p_lapida(50 + k))
        C.monticulo(p, (x, -0.22, 0), (0.22, 0.2), 0.05, 60 + k, p_suelta(60 + k), 170, terrones=3)
    for k in range(4):
        C.pasto(p, (-0.9 + 0.6 * k, 0.3, 0), 0.08, 5, 0.1, PASTO, PASTO_SECO, 70 + k)
    return p


def tumba_losa():
    """Losa de tumba en el piso, partida, con una cruz en relieve (se puede caminar encima)."""
    p = Pieza('deco_tumba_losa', 'deco', huella=[1, 2], alto=0.18, lugar='suelo', solido=False)
    marco = B.restar(B.caja((0, 0, 0.06), (0.48, 0.98, 0.07), r=0.02), B.caja((0, 0, 0.1), (0.4, 0.9, 0.08)))
    losa = B.caja((0, 0, 0.07), (0.39, 0.89, 0.05), r=0.015)
    cruz = B.union(B.caja((0, -0.1, 0.12), (0.03, 0.4, 0.015), r=0.008), B.caja((0, -0.3, 0.12), (0.18, 0.03, 0.015), r=0.008))
    f = B.union(marco, B.union(losa, cruz, k=0.01))
    grieta = lambda P: np.abs(P[:, 1] - 0.25 - 0.15 * np.sin(P[:, 0] * 9) - 0.04 * np.sin(P[:, 0] * 27)) - 0.01
    f = B.restar(f, grieta)
    f = B.desplazar(f, 0.005, 12, 3, 81)
    g = B.mover_f(f, (0, 0, -0.03), B.rot_euler(0.02, -0.03, 0))
    p.sdf(lambda P: np.maximum(g(P), -(P[:, 2] + 0.02)), (-0.55, -1.05, -0.04), (0.55, 1.05, 0.2), 0.012, 1600, 'piedra',
          p_lapida(81, musgo=0.6, liquen=0.4))
    for k, c in enumerate([(-0.4, 0.95), (0.42, -0.9), (0.45, 0.4)]):
        C.pasto(p, (c[0], c[1], 0), 0.08, 5, 0.08, PASTO, PASTO_SECO, 82 + k)
    return p


def cruz_torcida():
    """Cruz de tablas clavadas, torcida, con un trapo colgando."""
    p = Pieza('deco_cruz_torcida', 'deco', huella=[1, 1], alto=1.3, lugar='borde', solido=True)
    R = B.rot_euler(0.1, 0.16, 0.25)
    palo = B.desplazar(B.caja((0, 0, 0.6), (0.045, 0.03, 0.68), r=0.008), 0.004, 30, 2, 91)
    brazo = B.desplazar(B.caja((0, -0.035, 0.95), (0.3, 0.025, 0.04), r=0.008, R=B.rot_euler(0, 0.12, 0)), 0.004, 30, 2, 92)
    g1 = B.mover_f(palo, (0, 0, -0.08), R)
    g2 = B.mover_f(brazo, (0, 0, -0.08), R)
    mad = B.madera('#7A6852', '#3A2E24', eje=2, podrida=0.5, semilla=91)
    p.sdf(lambda P: np.maximum(g1(P), -(P[:, 2] + 0.02)), (-0.4, -0.4, -0.04), (0.5, 0.5, 1.4), 0.01, 500, 'madera', mad)
    mad2 = B.madera('#7A6852', '#3A2E24', eje=0, podrida=0.5, semilla=92)
    p.sdf(g2, (-0.5, -0.5, 0.6), (0.5, 0.4, 1.2), 0.01, 400, 'madera', mad2)
    # clavos
    for x in (-0.03, 0.03):
        a = R @ np.array([x, -0.065, 0.95]) + np.array([0, 0, -0.08])
        Vc, Fc = B.cilindro_m(a, a + R @ np.array([0, -0.015, 0]), 0.008, seg=5)
        p.parte(Vc, Fc, 'hierro', B.metal(cant=0.8))
    # trapo colgando del brazo
    t0 = R @ np.array([0.2, -0.065, 0.92]) + np.array([0, 0, -0.08])
    trapo = B.desplazar(B.caja((0, 0, -0.18), (0.06, 0.006, 0.18), r=0.004), 0.012, 9, 3, 93)
    gt = B.mover_f(trapo, t0, B.rot_euler(0.05, 0.1, 0.25))
    p.sdf(gt, t0 + np.array([-0.2, -0.15, -0.45]), t0 + np.array([0.2, 0.15, 0.05]), 0.008, 260, 'tela',
          B.manchado('#5A2A26', '#2A1412', escala=10, semilla=93))
    C.monticulo(p, (0, 0, 0), (0.28, 0.25), 0.08, 94, p_suelta(94), 220, terrones=4)
    C.escombros(p, (0.0, 0.0, 0.03), 0.22, 4, 95, pintor=p_piedrita(95), tam=(0.03, 0.05))
    return p


def mausoleo():
    """Mausoleo pequeño (2 × 2 m): columnas, frontón, techo a dos aguas, reja entreabierta, urnas y musgo."""
    p = Pieza('deco_mausoleo', 'deco', huella=[2, 2], alto=2.5, lugar='pared', solido=True)
    p.ao = dict(rayos=12, dist=0.5, fuerza=0.75, suelo=True)
    zb = 0.18
    zt = 1.62
    plinto = B.union(B.caja((0, 0.12, zb / 2), (0.88, 0.78, zb / 2), r=0.02),
                     B.caja((0, -0.72, 0.06), (0.55, 0.12, 0.06), r=0.015),
                     B.caja((0, -0.64, 0.12), (0.5, 0.1, 0.06), r=0.015))
    cuerpo0 = B.caja((0, 0.2, (zb + zt) / 2), (0.7, 0.58, (zt - zb) / 2), r=0.02)
    cuerpo = lambda P: cuerpo0(P) + C.juntas(P, 0.24, 0.4, 0.01, 0.01, 'x', zb) * (np.abs(P[:, 1] + 0.38) < 0.05) \
        + C.juntas(P, 0.24, 0.4, 0.01, 0.01, 'y', zb) * (np.abs(np.abs(P[:, 0]) - 0.7) < 0.05)
    puerta = B.caja((0, -0.4, 0.2 + 0.55), (0.3, 0.12, 0.55), r=0.01)
    arco_p = B.cilindro((0, -0.52, 1.3), (0, -0.28, 1.3), 0.3)
    hueco = B.union(puerta, B.cortar(arco_p, lambda P: 1.3 - P[:, 2]))
    cols = []
    for x in (-0.58, 0.58):
        cols += [B.cilindro((x, -0.52, zb), (x, -0.52, zt), 0.075, borde=0.01),
                 B.caja((x, -0.52, zb + 0.05), (0.1, 0.1, 0.05), r=0.01), B.caja((x, -0.52, zt - 0.05), (0.1, 0.1, 0.05), r=0.01)]
        for k in range(8):
            a = 2 * np.pi * k / 8
            cols.append(B.capsula((x + 0.075 * math.cos(a), -0.52 + 0.075 * math.sin(a), zb + 0.14), (x + 0.075 * math.cos(a), -0.52 + 0.075 * math.sin(a), zt - 0.14), 0.012))
    cornisa = B.caja((0, 0.12, zt + 0.08), (0.8, 0.74, 0.08), r=0.02)
    tejado = lambda P: np.maximum(np.maximum(np.abs(P[:, 0]) * 0.62 + (P[:, 2] - (zt + 0.16)) - 0.5, -(P[:, 2] - (zt + 0.15))),
                                  np.abs(P[:, 1] - 0.12) - 0.8)
    fronton = lambda P: np.maximum(tejado(P) + 0.04, np.abs(P[:, 1] + 0.62) - 0.06)
    cruz = B.union(B.caja((0, -0.6, zt + 0.68), (0.03, 0.03, 0.17), r=0.008), B.caja((0, -0.6, zt + 0.74), (0.11, 0.03, 0.03), r=0.008))
    placa = B.caja((0, -0.66, zt - 0.02), (0.3, 0.02, 0.06), r=0.01)
    f = B.union(plinto, B.restar(cuerpo, hueco), *cols, cornisa, tejado, cruz, placa)
    # tejas del techo: surcos a lo largo de la pendiente
    teja = lambda P: 0.012 * suave(0.6, 0.95, np.abs(np.sin(P[:, 1] * 22))) * (P[:, 2] > zt + 0.17)
    f2 = lambda P: f(P) + teja(P) + 0.006 * B.fbm(P, 9, 3, 101)
    gr = C.grabar(f2, [((-0.22, -0.68, zt - 0.02), (0.22, -0.68, zt - 0.02))], 0.012)
    pie = B.piedra('#96928A', '#5A564F', claro='#ABA59A', musgo=MUSGO, musgo_cant=0.5, escala=2.0, humedad=0.35, alto_humedad=0.6,
                   semilla=101, mancha=LIQUEN, mancha_cant=0.3)

    def pint(P, N):
        col = pie(P, N)
        ch = suave(0.35, 0.7, B.ruido(P * np.array([5.0, 5.0, 0.4]), 3, 102))
        oscuro = (np.abs(P[:, 0]) < 0.29) & (P[:, 1] > -0.42) & (P[:, 1] < -0.2) & (P[:, 2] < 1.55)
        col = col * (1 - 0.25 * ch)[:, None]
        return np.where(oscuro[:, None], col * 0.25, col)
    p.sdf(gr, (-0.95, -0.95, -0.02), (0.95, 0.95, 2.55), 0.016, 5200, 'piedra', pint)
    # reja de hierro entreabierta en la puerta (bisagra en x = -0.29)
    Rg = B.rot_euler(0, 0, -0.5)
    hinge = np.array([-0.29, -0.44, 0.2])
    Vs, Fs, b = [], [], 0
    for k in range(6):
        x = 0.05 + k * 0.1
        alto = 1.05 + 0.25 * math.sin(math.pi * x / 0.6)
        for V, F in (B.cilindro_m((x, 0, 0), (x, 0, alto), 0.011, seg=5), B.cilindro_m((x, 0, alto), (x, 0, alto + 0.06), 0.02, seg=5, r2=0.002)):
            Vs.append(V @ Rg.T + hinge)
            Fs.append(F + b)
            b += len(V)
    for z in (0.08, 0.55, 0.95):
        V, F = B.cilindro_m((0.0, 0, z), (0.58, 0, z), 0.012, seg=5)
        Vs.append(V @ Rg.T + hinge)
        Fs.append(F + b)
        b += len(V)
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'hierro', B.metal('#3A3634', cant=0.6, semilla=103))
    # urnas a los lados de la escalera
    for x in (-0.72, 0.72):
        V, F = B.torno_m([(0.0, 0.0), (0.07, 0.0), (0.05, 0.04), (0.1, 0.12), (0.1, 0.2), (0.06, 0.27), (0.08, 0.3), (0.0, 0.31)], seg=10)
        p.parte(B.transformar(V, (x * 1.1, -0.56, zb - 0.01)), F, 'piedra', p_lapida(104, musgo=0.6))
    # velas y flores marchitas al pie de la puerta
    C.vela(p, (0.18, -0.68, 0.18), 0.12, 0.025, 105, llama=False)
    C.vela(p, (-0.2, -0.7, 0.18), 0.08, 0.022, 106, llama=False)
    for k, c in enumerate([(-0.85, -0.8), (0.88, 0.2), (-0.86, 0.6)]):
        C.pasto(p, (c[0], c[1], 0), 0.12, 7, 0.16, PASTO, PASTO_SECO, 107 + k)
    return p


def angel():
    """Ángel que llora sobre un pedestal, con un ala rota (el pedazo en el piso)."""
    p = Pieza('deco_angel', 'deco', huella=[1, 1], alto=1.75, lugar='pared', solido=True)
    zp = 0.5
    pedestal = B.union(B.caja((0, 0, 0.06), (0.3, 0.3, 0.06), r=0.015), B.caja((0, 0, 0.28), (0.24, 0.24, 0.18), r=0.015),
                       B.caja((0, 0, zp - 0.03), (0.28, 0.28, 0.035), r=0.012))
    tunica = B.cono_r((0, 0.02, zp), (0, 0.0, zp + 0.78), 0.2, 0.1)

    def pliegues(P):
        a = np.arctan2(P[:, 1], P[:, 0])
        return 0.012 * np.sin(a * 9 + 0.8 * np.sin(P[:, 2] * 6)) * suave(zp + 0.75, zp, P[:, 2])
    torso = B.elipsoide((0, 0.0, zp + 0.82), (0.13, 0.09, 0.14))
    cabeza = B.esfera((0, -0.06, zp + 1.0), 0.085)
    pelo = B.elipsoide((0, -0.03, zp + 1.03), (0.088, 0.08, 0.07))
    brazos = [B.capsula((s * 0.12, -0.0, zp + 0.88), (s * 0.06, -0.12, zp + 0.92), 0.035) for s in (-1, 1)]
    manos = [B.elipsoide((s * 0.035, -0.135, zp + 0.98), (0.03, 0.022, 0.045)) for s in (-1, 1)]
    cuerpo = B.union(tunica, torso, cabeza, pelo, *brazos, *manos, k=0.03)
    cuerpo2 = lambda P: cuerpo(P) + pliegues(P)

    def ala(s):
        base = np.array([s * 0.08, 0.1, zp + 0.88])
        e = B.elipsoide((0, 0.0, 0.0), (0.09, 0.035, 0.38))

        def f(P):
            q = (P - base) @ B.rot_euler(-0.5, s * 0.35, 0)
            q2 = q - np.array([s * 0.06, 0, 0.18])
            d = e(q2)
            plumas = 0.008 * np.sin(q2[:, 2] * 60 + q2[:, 0] * 30)
            return d + plumas
        return f
    ala_izq = ala(-1)
    ala_der0 = ala(1)
    ala_der = lambda P: np.maximum(ala_der0(P), P[:, 2] - (zp + 1.08 - 0.3 * (P[:, 0] - 0.1)))
    f = B.union(pedestal, cuerpo2, ala_izq, ala_der, k=0.0)
    f = B.desplazar(f, 0.004, 16, 3, 111)
    pie = B.piedra('#9A968C', '#5E5A52', claro='#B4AEA2', musgo=MUSGO, musgo_cant=0.45, escala=3.0, humedad=0.3, alto_humedad=0.5,
                   semilla=111, mancha=LIQUEN, mancha_cant=0.4)

    def pint(P, N):
        col = pie(P, N)
        lagrimas = suave(0.4, 0.7, B.ruido(P * np.array([6, 6, 0.6]), 4, 112)) * (P[:, 2] > zp + 0.5)
        return col * (1 - 0.3 * lagrimas)[:, None]
    p.sdf(f, (-0.45, -0.4, -0.02), (0.45, 0.6, 1.85), 0.011, 4200, 'piedra', pint)
    # el pedazo del ala, en el piso
    V, F = B.malla_sdf(lambda P: np.maximum(ala_der0(P), -(P[:, 2] - (zp + 1.08 - 0.3 * (P[:, 0] - 0.1)))),
                       (-0.1, -0.3, zp + 0.9), (0.6, 0.6, 1.85), 0.011, 500, 1)
    V = V - V.mean(0)
    V = V @ B.rot_euler(1.35, 0.3, 2.2).T + np.array([0.3, -0.38, 0.0])
    V[:, 2] -= V[:, 2].min() + 0.01
    p.parte(V, F, 'piedra', pint)
    C.escombros(p, (0.25, -0.35, 0), 0.2, 4, 113, pintor=p_lapida(113), tam=(0.02, 0.04))
    C.pasto(p, (-0.3, -0.3, 0), 0.1, 6, 0.14, PASTO, PASTO_SECO, 114)
    return p


def arbol_seco():
    """Árbol muerto y retorcido (2,4 m), raíces que se meten al piso y musgo colgando."""
    p = Pieza('deco_arbol_seco', 'deco', huella=[1, 1], alto=2.5, lugar='borde', solido=True)
    p.ao = dict(rayos=10, dist=0.3, fuerza=0.6, suelo=True)
    rng = B.azar(121)
    mad = B.madera('#6E6256', '#3A322A', eje=2, podrida=0.35, musgo=MUSGO, semilla=121)
    tronco = [(0, 0, -0.1), (0.04, 0.02, 0.5), (-0.06, 0.05, 1.0), (0.02, -0.02, 1.45)]
    V, F = B.tubo_m(tronco, [0.16, 0.12, 0.1, 0.075], seg=9, muestras=5)
    p.parte(V, F, 'madera', mad)
    # raíces
    for k in range(5):
        a = 2 * np.pi * k / 5 + rng.uniform(-0.3, 0.3)
        d = np.array([math.cos(a), math.sin(a), 0])
        pts = [d * 0.05 + (0, 0, 0.3), d * 0.2 + (0, 0, 0.08), d * 0.42 + (0, 0, 0.02), d * 0.6 + (0, 0, -0.06)]
        Vr, Fr = B.tubo_m(pts, [0.07, 0.05, 0.03, 0.012], seg=6, muestras=4)
        p.parte(Vr, Fr, 'madera', mad)

    def rama(p0, d, largo, r, nivel):
        if nivel > 3 or r < 0.008:
            return
        d = d / np.linalg.norm(d)
        pts = [p0]
        cur = p0.copy()
        for j in range(3):
            d = d + rng.normal(0, 0.25, 3)
            d[2] += 0.1
            d /= np.linalg.norm(d)
            cur = cur + d * largo / 3
            pts.append(cur.copy())
        Vb, Fb = B.tubo_m(pts, [r, r * 0.8, r * 0.6, r * 0.4], seg=max(4, 7 - nivel), muestras=3)
        p.parte(Vb, Fb, 'madera', mad)
        for h in range(2 if nivel < 2 else 1 + int(rng.random() < 0.6)):
            t = rng.uniform(0.5, 1.0)
            idx = min(int(t * 3), 3)
            nd = d + rng.normal(0, 0.6, 3)
            nd[2] = abs(nd[2]) * 0.6
            rama(np.array(pts[idx]), nd, largo * 0.65, r * 0.55, nivel + 1)
    top = np.array(tronco[-1], float)
    for k, a in enumerate([0.3, 2.4, 4.3]):
        rama(top - (0, 0, 0.1 * k), np.array([math.cos(a), math.sin(a), 0.9]), 0.75, 0.06, 1)
    # musgo colgando
    for k in range(4):
        q = np.array([rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(1.4, 1.8)])
        Vm, Fm = B.tubo_m([q, q + (0.02, 0, -0.15), q + (-0.01, 0.02, -0.3)], [0.02, 0.012, 0.003], seg=4, muestras=3)
        p.parte(Vm, Fm, 'musgo', B.manchado('#6E7A48', '#3E4A28', 10, semilla=130 + k))
    C.monticulo(p, (0, 0, 0), (0.35, 0.35), 0.06, 122, p_suelta(122), 240, terrones=5)
    hojarasca(p, 123, 10, 0.45)
    return p


def reja():
    """Tramo de reja de hierro (2 m) sobre un murito, con dos pilares de piedra; un barrote doblado."""
    p = Pieza('deco_reja', 'deco', huella=[2, 1], alto=1.45, lugar='pared', solido=True)
    murito = B.desplazar(B.caja((0, 0.3, 0.12), (1.0, 0.12, 0.12), r=0.02), 0.006, 10, 3, 141)
    pilares = [B.desplazar(B.union(B.caja((x, 0.3, 0.65), (0.13, 0.13, 0.65), r=0.015), B.caja((x, 0.3, 1.33), (0.16, 0.16, 0.04), r=0.012),
                                   B.esfera((x, 0.3, 1.43), 0.08)), 0.006, 10, 3, 142) for x in (-0.92, 0.92)]
    f = B.union(murito, *pilares)
    f = lambda P, f=f: f(P) + C.juntas(P, 0.22, 0.26, 0.008, 0.01, 'y') * (np.abs(np.abs(P[:, 0]) - 0.92) < 0.16)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.02)), (-1.1, 0.1, -0.03), (1.1, 0.5, 1.55), 0.014, 2000, 'piedra',
          p_lapida(141, musgo=0.55))
    Vs, Fs, b = [], [], 0

    def agregar(V, F):
        nonlocal b
        Vs.append(V)
        Fs.append(F + b)
        b += len(V)
    for k in range(13):
        x = -0.72 + k * 0.12
        if k == 8:
            pts = [(x, 0.3, 0.22), (x + 0.02, 0.3, 0.6), (x + 0.12, 0.22, 0.85), (x + 0.2, 0.12, 1.0)]
            agregar(*B.tubo_m(pts, 0.012, seg=5, muestras=3))
            continue
        top = 1.12 + (0.06 if k % 2 else 0)
        agregar(*B.cilindro_m((x, 0.3, 0.22), (x, 0.3, top), 0.012, seg=5))
        agregar(*B.cilindro_m((x, 0.3, top), (x, 0.3, top + 0.09), 0.025, seg=4, r2=0.001))
    for z in (0.32, 0.98):
        agregar(*B.cilindro_m((-0.8, 0.3, z), (0.8, 0.3, z), 0.014, seg=5))
    for k in range(6):
        x = -0.66 + k * 0.24
        agregar(*B.toro_m((x, 0.3, 1.05), 0.045, 0.008, seg=8, seg2=4, eje=(0, 1, 0)))
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'hierro', B.metal('#3A3634', cant=0.6, semilla=143))
    for k, x in enumerate((-0.6, 0.1, 0.65)):
        C.pasto(p, (x, 0.12, 0), 0.1, 6, 0.14, PASTO, PASTO_SECO, 144 + k)
    return p


def ataud():
    """Ataúd viejo abierto, la tapa rajada a un lado y huesos adentro (1 × 2 m)."""
    p = Pieza('deco_ataud', 'deco', huella=[1, 2], alto=0.4, lugar='libre', solido=True)

    def hexa(P, ancho=0.3, cabeza=0.22, pies=0.16, largo=0.85):
        y = P[:, 1]
        w = np.where(y > 0.35, cabeza + (ancho - cabeza) * (largo - y) / (largo - 0.35), pies + (ancho - pies) * (y + largo) / (largo + 0.35))
        return np.maximum(np.abs(P[:, 0]) - w, np.abs(y) - largo)
    caja_ext = lambda P: np.maximum(hexa(P), np.abs(P[:, 2] - 0.17) - 0.17)
    caja_int = lambda P: np.maximum(hexa(P) + 0.03, np.abs(P[:, 2] - 0.21) - 0.17)
    f = lambda P: np.maximum(caja_ext(P), -caja_int(P)) + 0.004 * B.fbm(P, 20, 2, 151)
    g = B.mover_f(f, (0, 0, 0.0), B.rot_euler(0, 0, 0.12))
    mad = B.madera('#5E4636', '#2E2018', eje=1, podrida=0.45, semilla=151)
    p.sdf(g, (-0.5, -1.0, -0.01), (0.5, 1.0, 0.38), 0.012, 1100, 'madera', mad)
    # tapa partida recostada al lado
    tapa = lambda P: np.maximum(hexa(P), np.abs(P[:, 2]) - 0.025) + 0.004 * B.fbm(P, 20, 2, 152)
    tapa2 = B.restar(tapa, lambda P: np.abs(P[:, 1] - 0.1 - 0.06 * np.sin(P[:, 0] * 18)) - 0.012)
    V, F = B.malla_sdf(tapa2, (-0.4, -0.95, -0.06), (0.4, 0.95, 0.06), 0.011, 800, 1)
    V = V @ B.rot_euler(0, -1.1, -0.08).T + np.array([0.42, 0.05, 0.15])
    p.parte(V, F, 'madera', B.madera('#5E4636', '#2E2018', eje=1, podrida=0.45, semilla=152))
    # adentro: calavera y huesos
    R0 = B.rot_euler(0, 0, 0.12)
    Vc, Fc = C.calavera(1.0, 260)
    p.parte(B.transformar(Vc, R0 @ np.array([0.0, 0.55, 0.06]), R0 @ B.rot_euler(-1.2, 0, math.pi)), Fc, 'hueso', B.hueso(semilla=153))
    for k, (c, a) in enumerate([((0.05, 0.0, 0.07), 0.2), ((-0.08, -0.3, 0.07), 1.4), ((0.06, -0.45, 0.07), 1.6)]):
        Vh, Fh = C.hueso_m(0.26, 0.018)
        p.parte(B.transformar(Vh, R0 @ np.array(c), R0 @ B.rot_euler(0, 0, a)), Fh, 'hueso', B.hueso(semilla=154 + k))
    return p


def fosa():
    """Tumba recién abierta: hueco oscuro con orilla irregular, montón de tierra, tablas atravesadas y una pala
    clavada (1 × 2 m)."""
    p = Pieza('deco_fosa', 'deco', huella=[1, 2], alto=0.55, lugar='libre', solido=True)

    def rect(P, a, b):
        return np.maximum(np.abs(P[:, 0]) - a, np.abs(P[:, 1]) - b)
    rng = B.azar(161)
    alto_orilla = lambda P: 0.035 + 0.05 * np.clip(0.5 + B.fbm(P, 3, 2, 166), 0, 1) + 0.04 * suave(0.0, 0.3, P[:, 0])
    orilla = lambda P: np.maximum(np.maximum(rect(P, 0.36, 0.78) - 0.035 * (1 + B.ruido(P, 5, 167)), -rect(P, 0.27, 0.68)),
                                  P[:, 2] - alto_orilla(P))
    terrones = [B.esfera((rng.choice([-1, 1]) * rng.uniform(0.28, 0.38), rng.uniform(-0.75, 0.75), 0.04), rng.uniform(0.03, 0.06)) for _ in range(9)]
    f = B.desplazar(B.union(orilla, *terrones, k=0.025), 0.01, 10, 3, 161)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.55, -0.95, -0.02), (0.55, 0.95, 0.2), 0.012, 1000, 'tierra', p_suelta(161))
    # el hueco: rejilla con un degradado de profundidad (oscuro en el centro)
    nx, ny = 6, 12
    xs, ys = np.linspace(-0.3, 0.3, nx + 1), np.linspace(-0.71, 0.71, ny + 1)
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    V = np.stack([X.ravel(), Y.ravel(), np.full(X.size, 0.006)], 1)
    F = []
    for i in range(nx):
        for j in range(ny):
            a, b = i * (ny + 1) + j, (i + 1) * (ny + 1) + j
            F += [(a, b, b + 1), (a, b + 1, a + 1)]

    def hondo(P, N):
        d = np.minimum((0.3 - np.abs(P[:, 0])) / 0.3, (0.71 - np.abs(P[:, 1])) / 0.71)
        return mezclar(hx('#3A2C20'), hx('#060504'), suave(0.0, 0.45, d))
    p.parte(V, np.array(F), 'tierra', hondo, ao=False)
    # tablas atravesadas
    for k, (y, a) in enumerate([(-0.35, 0.08), (0.22, -0.12)]):
        tabla = B.desplazar(B.caja((0, y, 0.07), (0.44, 0.07, 0.014), r=0.006, R=B.rot_euler(0.0, 0.04 * (k * 2 - 1), a)), 0.003, 25, 2, 168 + k)
        p.sdf(tabla, (-0.55, y - 0.25, 0.0), (0.55, y + 0.25, 0.13), 0.009, 160, 'madera', B.madera('#7A6450', '#3A2C20', eje=0, podrida=0.4, semilla=168 + k))
    C.monticulo(p, (0.62, 0.45, 0), (0.28, 0.42), 0.34, 162, p_suelta(162), 700, terrones=9)
    C.escombros(p, (0.52, -0.05, 0), 0.2, 4, 165, pintor=p_piedrita(165), tam=(0.03, 0.05))
    # pala clavada en el montón
    R = B.rot_euler(0.25, -0.3, 0.4)
    o = np.array([0.66, 0.45, 0.2])
    Vm, Fm = B.cilindro_m((0, 0, 0), (0, 0, 0.8), 0.018, seg=6)
    p.parte(Vm @ R.T + o, Fm, 'madera', B.madera('#7A6450', '#3E3024', eje=2, semilla=163))
    Vp, Fp = B.malla_sdf(B.union(B.caja((0, 0, -0.12), (0.1, 0.012, 0.12), r=0.01), B.cilindro((0, 0, 0), (0, 0, 0.05), 0.025)),
                         (-0.15, -0.05, -0.28), (0.15, 0.05, 0.08), 0.01, 120, 0)
    p.parte(Vp @ R.T + o, Fp, 'hierro', B.metal(cant=0.7, semilla=164))
    return p


def huesos():
    """Huesos regados y una calavera (para el piso, se camina encima)."""
    p = Pieza('deco_huesos', 'deco', huella=[1, 1], alto=0.12, lugar='suelo', solido=False)
    rng = B.azar(171)
    Vc, Fc = C.calavera(1.0, 300)
    p.parte(B.transformar(Vc, (0.1, -0.05, -0.008), B.rot_euler(0.25, 0.15, 0.6)), Fc, 'hueso', B.hueso(semilla=171))
    for k in range(6):
        Vh, Fh = C.hueso_m(rng.uniform(0.14, 0.3), rng.uniform(0.014, 0.02))
        c = (rng.uniform(-0.35, 0.35), rng.uniform(-0.35, 0.35), 0.014)
        p.parte(B.transformar(Vh, c, B.rot_euler(0, rng.uniform(-0.1, 0.1), rng.uniform(0, 6.28))), Fh, 'hueso', B.hueso(semilla=172 + k))
    # costillas (arcos)
    for k in range(4):
        a0 = np.array([-0.25, -0.25 + k * 0.06, 0.01])
        V, F = B.tubo_m([a0, a0 + (0.08, 0.02, 0.06), a0 + (0.17, 0.0, 0.02)], [0.008, 0.007, 0.005], seg=5, muestras=3)
        p.parte(V, F, 'hueso', B.hueso(semilla=180 + k))
    return p


def calaveras():
    """Montoncito de calaveras y huesos."""
    p = Pieza('deco_calaveras', 'deco', huella=[1, 1], alto=0.38, lugar='libre', solido=True)
    rng = B.azar(191)
    Vc, Fc = C.calavera(1.0, 280)
    pos = [(-0.12, -0.05, 0.0), (0.1, -0.08, 0.0), (0.0, 0.12, 0.0), (-0.16, 0.14, 0.0), (0.16, 0.12, 0.0), (-0.03, 0.02, 0.12), (0.06, 0.08, 0.13), (0.0, 0.05, 0.24)]
    for k, c in enumerate(pos):
        R = B.rot_euler(rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2), rng.uniform(-0.8, 0.8))
        p.parte(B.transformar(Vc, c, R, rng.uniform(0.9, 1.1)), Fc, 'hueso', B.hueso(semilla=191 + k))
    for k in range(5):
        Vh, Fh = C.hueso_m(rng.uniform(0.2, 0.3), 0.018)
        a = rng.uniform(0, 6.28)
        p.parte(B.transformar(Vh, (math.cos(a) * 0.26, math.sin(a) * 0.26, 0.02), B.rot_euler(0, rng.uniform(-0.3, 0.3), a + 1.4)), Fh, 'hueso', B.hueso(semilla=200 + k))
    return p


def florero():
    """Florero de piedra con flores marchitas sobre un pedestal."""
    p = Pieza('deco_florero', 'deco', huella=[1, 1], alto=0.8, lugar='libre', solido=True)
    ped = B.desplazar(B.union(B.caja((0, 0, 0.05), (0.18, 0.18, 0.05), r=0.012), B.caja((0, 0, 0.3), (0.12, 0.12, 0.22), r=0.012),
                              B.caja((0, 0, 0.53), (0.15, 0.15, 0.03), r=0.01)), 0.005, 12, 3, 211)
    p.sdf(lambda P: np.maximum(ped(P), -(P[:, 2] + 0.01)), (-0.25, -0.25, -0.02), (0.25, 0.25, 0.6), 0.01, 600, 'piedra', p_lapida(211))
    V, F = B.torno_m([(0.0, 0.56), (0.06, 0.56), (0.05, 0.6), (0.09, 0.66), (0.1, 0.72), (0.07, 0.78), (0.09, 0.8), (0.07, 0.8), (0.06, 0.74), (0.0, 0.74)], seg=12)
    p.parte(V, F, 'piedra', p_lapida(212, musgo=0.6))
    rng = B.azar(213)
    for k in range(7):
        a = rng.uniform(0, 6.28)
        q0 = np.array([math.cos(a) * 0.03, math.sin(a) * 0.03, 0.76])
        d = np.array([math.cos(a), math.sin(a), 0])
        tip = q0 + d * rng.uniform(0.08, 0.16) + (0, 0, rng.uniform(0.1, 0.22))
        cae = tip + d * 0.06 + (0, 0, -0.08)
        V, F = B.tubo_m([q0, (q0 + tip) / 2 + (0, 0, 0.04), tip, cae], [0.005, 0.004, 0.004, 0.003], seg=4, muestras=3)
        p.parte(V, F, 'madera', B.liso('#5A5232'))
        Vf, Ff = B.malla_sdf(B.elipsoide(cae, (0.022, 0.022, 0.03)), cae - 0.05, cae + 0.05, 0.008, 40, 0)
        p.parte(Vf, Ff, 'tela', B.manchado(['#6A2A3A', '#5A3A28', '#7A5A30'][k % 3], '#2A1A16', 12, semilla=214 + k))
    return p


def banca():
    """Banca de piedra rota: una pata caída."""
    p = Pieza('deco_banca', 'deco', huella=[2, 1], alto=0.5, lugar='libre', solido=True)
    asiento = B.caja((0, 0, 0.0), (0.7, 0.2, 0.04), r=0.015)
    pata = lambda x: B.caja((x, 0, 0.19), (0.07, 0.17, 0.19), r=0.015)
    g1 = B.mover_f(asiento, (0.03, 0.0, 0.21), B.rot_euler(0, 0.32, 0))
    f = B.union(pata(-0.55), g1, B.caja((0.62, 0.05, 0.08), (0.17, 0.07, 0.08), r=0.015, R=B.rot_euler(0, 0, 0.5)))
    f = B.desplazar(f, 0.006, 12, 3, 221)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.9, -0.4, -0.02), (0.9, 0.4, 0.55), 0.011, 1200, 'piedra', p_lapida(221, musgo=0.6))
    C.escombros(p, (0.5, -0.15, 0), 0.25, 5, 222, pintor=p_lapida(222), tam=(0.02, 0.05))
    return p


def hongos(p, c, n, semilla, tam=1.0):
    """Racimo de hongos pálidos con el sombrero que brilla un poquito (material `hongo`)."""
    rng = B.azar(semilla)
    M = C.marco(n + np.array([0, 0, 1.2]))
    for k in range(rng.integers(3, 6)):
        h = tam * rng.uniform(0.04, 0.1)
        r = h * rng.uniform(0.45, 0.8)
        off = np.array([rng.uniform(-0.06, 0.06), rng.uniform(-0.06, 0.06), 0]) * tam
        Vt, Ft = B.cilindro_m((0, 0, -0.01), (0, 0, h), r * 0.18, seg=6)
        p.parte((Vt + off) @ M.T + c, Ft, 'hueso', B.liso('#C8C0A8'))
        Vs, Fs = B.torno_m([(r * 0.2, h - r * 0.1), (r, h), (r * 0.8, h + r * 0.35), (0.0, h + r * 0.5)], seg=9)
        p.parte((Vs + off) @ M.T + c, Fs, 'hongo', lambda P, N: mezclar(hx('#3A8A78'), hx('#B8F0D8'), suave(-0.2, 0.9, N[:, 2])), ao=False)


def deco_hongos():
    p = Pieza('deco_hongos', 'deco', huella=[1, 1], alto=0.15, lugar='suelo', solido=False)
    for k, c in enumerate([(0, 0), (0.18, 0.12), (-0.15, 0.1), (0.05, -0.18)]):
        hongos(p, np.array([c[0], c[1], 0.0]), np.array([0, 0, 1.0]), 231 + k, 1.0)
    C.monticulo(p, (0, 0, 0), (0.3, 0.3), 0.03, 235, B.manchado(LODO, LODO_OSC, 5, semilla=235), 120)
    return p


def raices():
    """Raíces que salen del piso y se vuelven a meter."""
    p = Pieza('deco_raices', 'deco', huella=[1, 1], alto=0.2, lugar='suelo', solido=False)
    rng = B.azar(241)
    for k in range(4):
        a = rng.uniform(0, 6.28)
        d = np.array([math.cos(a), math.sin(a), 0])
        t = np.array([-d[1], d[0], 0])
        o = t * rng.uniform(-0.2, 0.2)
        pts = [o - d * 0.44 + (0, 0, -0.06), o - d * 0.22 + (0, 0, 0.05), o + t * 0.06 + (0, 0, 0.08), o + d * 0.2 + (0, 0, 0.03), o + d * 0.42 + (0, 0, -0.06)]
        C.raiz(p, pts, 0.05, 0.02, color='#5E4A36', semilla=241 + k)
        for e in (o - d * 0.44, o + d * 0.42):
            C.monticulo(p, (e[0], e[1], 0), (0.09, 0.09), 0.035, 245 + k, p_suelta(245 + k), 60, terrones=2)
    return p


def deco_charco():
    p = Pieza('deco_charco', 'deco', huella=[1, 1], alto=0.03, lugar='suelo', solido=False)
    charco(p, (0, 0), (0.42, 0.3), 251, z_agua=0.035)
    C.pasto(p, (0.38, 0.25, 0), 0.08, 5, 0.08, PASTO, PASTO_SECO, 252)
    return p


# --------------------------------------------------------------------------
# Luces
# --------------------------------------------------------------------------

def luz_antorcha():
    """Antorcha clavada en el piso: estaca de hierro, canasta y trapo con brea; la llama arriba."""
    p = Pieza('luz_antorcha', 'luz', huella=[1, 1], alto=1.45, lugar='libre', solido=True, luz=LUZ_ANTORCHA)
    met = B.metal('#3A3634', cant=0.55, semilla=261)
    V, F = B.cilindro_m((0, 0, -0.05), (0, 0, 1.0), 0.02, seg=6)
    p.parte(V, F, 'hierro', met)
    # puntas de la canasta
    for k in range(4):
        a = 2 * np.pi * k / 4 + 0.4
        d = np.array([math.cos(a), math.sin(a), 0])
        Vb, Fb = B.tubo_m([(0, 0, 0.98), d * 0.05 + (0, 0, 1.06), d * 0.07 + (0, 0, 1.2)], 0.008, seg=4, muestras=3)
        p.parte(Vb, Fb, 'hierro', met)
    Va, Fa = B.toro_m((0, 0, 1.16), 0.07, 0.008, seg=10, seg2=4)
    p.parte(Va, Fa, 'hierro', met)
    C.antorcha_cabeza(p, (0, 0, 1.05), 262, 1.0)
    C.escombros(p, (0, 0, 0), 0.14, 5, 263, pintor=p_piedrita(263), tam=(0.035, 0.06))
    return p


def luz_vela():
    p = Pieza('luz_vela', 'luz', huella=[1, 1], alto=0.3, lugar='suelo', solido=False, luz=LUZ_VELA)
    C.charco_cera(p, (0, 0, 0), 0.16, 3)
    C.vela(p, (0.0, 0.03, 0.0), 0.22, 0.034, 1)
    C.vela(p, (0.1, -0.05, 0.0), 0.14, 0.03, 2)
    C.vela(p, (-0.09, -0.06, 0.0), 0.1, 0.028, 3)
    Vc, Fc = C.calavera(0.9, 260)
    p.parte(B.transformar(Vc, (-0.12, 0.12, 0.0), B.rot_euler(0, 0, 0.5)), Fc, 'hueso', B.hueso(semilla=4))
    C.vela(p, (-0.13, 0.13, 0.115), 0.06, 0.022, 5)
    return p


def luz_farol():
    """Farol de hierro colgado de un poste torcido."""
    p = Pieza('luz_farol', 'luz', huella=[1, 1], alto=1.95, lugar='borde', solido=True, luz=LUZ_FAROL)
    mad = B.madera('#6E5E4E', '#36291F', eje=2, podrida=0.4, semilla=271)
    V, F = B.tubo_m([(0, 0.1, -0.05), (0.02, 0.1, 0.8), (-0.02, 0.12, 1.5), (0.0, 0.1, 1.8)], [0.06, 0.05, 0.045, 0.04], seg=7, muestras=4)
    p.parte(V, F, 'madera', mad)
    V, F = B.tubo_m([(0, 0.1, 1.72), (0, -0.15, 1.76), (0.0, -0.32, 1.72)], 0.03, seg=6, muestras=3)
    p.parte(V, F, 'madera', mad)
    met = B.metal('#3A3634', cant=0.5, semilla=272)
    c = np.array([0.0, -0.32, 1.3])
    Vs, Fs, b = [], [], 0
    for V, F in [B.cilindro_m(c + (0, 0, 0.24), c + (0, 0, 0.41), 0.006, seg=4),
                 B.torno_m([(0.0, 0.0), (0.09, 0.0), (0.09, 0.02), (0.0, 0.02)], seg=4, c=c),
                 B.torno_m([(0.11, 0.23), (0.05, 0.31), (0.0, 0.32)], seg=4, c=c),
                 B.toro_m(c + (0, 0, 0.35), 0.025, 0.006, seg=8, seg2=4, eje=(1, 0, 0))]:
        Vs.append(V)
        Fs.append(F + b)
        b += len(V)
    for k in range(4):
        a = 2 * np.pi * k / 4 + math.pi / 4
        q = c + np.array([math.cos(a) * 0.09, math.sin(a) * 0.09, 0])
        V, F = B.cilindro_m(q, q + (0, 0, 0.24), 0.008, seg=4)
        Vs.append(V)
        Fs.append(F + b)
        b += len(V)
    V = np.concatenate(Vs)
    V = (V - c) @ B.rot_euler(0, 0, math.pi / 4).T + c
    p.parte(V, np.concatenate(Fs), 'hierro', met)
    Vv, Fv = B.torno_m([(0.075, 0.02), (0.075, 0.23)], seg=4, c=c)
    Vv = (Vv - c) @ B.rot_euler(0, 0, math.pi / 4).T + c
    p.parte(Vv, Fv, 'vidrio_luz', lambda P, N: np.tile(hx('#E8A860'), (len(P), 1)), ao=False)
    p.llama(c + (0, 0, 0.09), 1.0)
    C.escombros(p, (0, 0.1, 0), 0.16, 4, 273, pintor=p_piedrita(273), tam=(0.03, 0.06))
    return p


def luz_tumba_velas():
    """Losa de tumba con velas y una calavera: la ofrenda (se camina encima)."""
    p = Pieza('luz_tumba_velas', 'luz', huella=[1, 1], alto=0.4, lugar='libre', solido=False, luz=LUZ_VELA)
    f = B.desplazar(B.caja((0, 0, 0.05), (0.4, 0.4, 0.06), r=0.02), 0.005, 12, 3, 281)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.01)), (-0.5, -0.5, -0.02), (0.5, 0.5, 0.15), 0.012, 500, 'piedra', p_lapida(281, musgo=0.5))
    C.charco_cera(p, (0.05, 0.05, 0.11), 0.16, 282)
    for k, (x, y, h) in enumerate([(0.1, 0.12, 0.2), (-0.15, 0.1, 0.14), (0.2, -0.12, 0.1), (-0.05, -0.18, 0.08), (0.24, 0.2, 0.07)]):
        C.vela(p, (x, y, 0.11), h, 0.026 + 0.004 * (k % 2), 283 + k)
    Vc, Fc = C.calavera(1.0, 260)
    p.parte(B.transformar(Vc, (-0.15, -0.05, 0.11), B.rot_euler(0, 0, -0.3)), Fc, 'hueso', B.hueso(semilla=290))
    return p


PIEZAS = {
    'pared_blanda_a': pared_blanda(11, 'raices'),
    'pared_blanda_b': pared_blanda(12, 'huesos'),
    'pared_blanda_c': pared_blanda(13, 'hongos'),
    'pared_dura_a': muro_cementerio(14),
    'pared_dura_b': muro_cementerio(15, roto=True),
    'pared_borde': borde_cementerio(16),
    'veta_hierro': C.veta(tierra_base(17), 'hierro', 17),
    'veta_sangre': C.veta(tierra_base(18), 'sangre', 18),
    'veta_oro': C.veta(tierra_base(19), 'oro', 19),
    'piso_a': piso_lodo(21, ['piedras'], peso=3),
    'piso_b': piso_lodo(22, ['huesos', 'hojas'], hojas=0.5, peso=2),
    'piso_c': piso_lodo(23, ['charco'], peso=1),
    'piso_d': piso_lodo(24, ['losas'], peso=1.5),
    'piso_e': piso_lodo(25, ['hojas', 'piedras'], hojas=0.8, peso=2),
    'deco_lapida_redonda': lapida_pieza('deco_lapida_redonda', 'redonda', 0.5, 0.85, 0.11, 31, (0.1, 0.12)),
    'deco_lapida_gotica': lapida_pieza('deco_lapida_gotica', 'gotica', 0.48, 0.95, 0.1, 32, (-0.08, -0.15)),
    'deco_lapida_recta': lapida_pieza('deco_lapida_recta', 'recta', 0.55, 0.7, 0.12, 33, (0.16, 0.05)),
    'deco_lapida_cruz': lapida_cruz,
    'deco_lapida_rota': lapida_rota,
    'deco_lapidas_grupo': lapidas_grupo,
    'deco_tumba_losa': tumba_losa,
    'deco_cruz_torcida': cruz_torcida,
    'deco_mausoleo': mausoleo,
    'deco_angel': angel,
    'deco_arbol_seco': arbol_seco,
    'deco_reja': reja,
    'deco_ataud': ataud,
    'deco_fosa': fosa,
    'deco_huesos': huesos,
    'deco_calaveras': calaveras,
    'deco_florero': florero,
    'deco_banca': banca,
    'deco_hongos': deco_hongos,
    'deco_raices': raices,
    'deco_charco': deco_charco,
    'luz_antorcha': luz_antorcha,
    'luz_vela': luz_vela,
    'luz_farol': luz_farol,
    'luz_tumba_velas': luz_tumba_velas,
}
