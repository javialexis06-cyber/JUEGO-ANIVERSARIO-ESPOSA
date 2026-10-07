"""Sangre y Ceniza · piezas de detalle de la calidad alta (cosas pequeñas que el juego riega por el mapa).

No son del contrato de la simulación: el juego las pone solo en la vista (con un azar fijo por celda), así que no
cambian nada del juego ni de lo que se sincroniza en línea. Tres lugares (extra `lugar` de la raíz):
- `suelo`: en el piso abierto, bajitas (menos de ~12 cm) para no tapar lo que se recoge. Centradas en el origen,
  caben en un círculo de ~0,4 m.
- `pie`: al pie de una pared. La pared queda detrás (+Y): la pieza va de y ≈ +0,04 (metida en la roca) a y ≈ -0,35.
- `muro`: colgadas en la cara de una pared que ve la cámara. Espalda en y ≈ +0,03; sobresalen poco hacia -Y.
El juego las junta en una sola malla por trozo de mapa (por material), así que pesan poco aunque sean muchas.
"""
import math

import numpy as np

import sangre_biomas_base as B
import sangre_biomas_comun as C
from sangre_biomas_base import Pieza, hx, mezclar, suave


def pieza(nombre, lugar, peso=1.0):
    p = Pieza(nombre, 'detalle', lugar=lugar, peso=peso)
    p.ao = dict(rayos=10, dist=0.12, fuerza=0.6, suelo=True)
    p.bordes = dict(claro=0.25, oscuro=0.2, escala=2.5)
    return p


def liso_ruido(color, oscuro=None, escala=12, semilla=0):
    return B.manchado(color, oscuro, escala=escala, fuerza=0.4, grano=0.1, semilla=semilla)


# --------------------------------------------------------------------------
# Piezas sueltas (helpers): cada uno agrega partes a la pieza
# --------------------------------------------------------------------------

def piedras(p, c, radio, n, pint, tam=(0.025, 0.06), semilla=0, tris=50):
    C.escombros(p, (c[0], c[1], 0.0), radio, n, semilla, pintor=pint, tam=tam, tris=tris)


def hueso(p, c, ang, largo=0.18, r=0.014, semilla=0, color=('#C9BA98', '#6E604A')):
    V, F = C.hueso_m(largo, r, tris=110)
    p.parte(B.transformar(V, (c[0], c[1], r * 0.75), B.rot_euler(0, 0, ang)), F, 'hueso', B.hueso(*color, semilla=semilla))


def craneo(p, c, ang, s=0.85, semilla=0, inclina=(0.2, 0.1)):
    V, F = C.calavera(1.0, 300, semilla)
    R = B.rot_euler(inclina[0], inclina[1], ang)
    p.parte(B.transformar(V, (c[0], c[1], -0.006), R, s), F, 'hueso', B.hueso(semilla=semilla))


def hojas(p, c, area, n, colores, semilla=0, largo=(0.035, 0.065), z=0.008):
    rng = B.azar(semilla)
    Vs, Fs, b = [], [], 0
    for _ in range(n):
        a0 = rng.uniform(0, 2 * np.pi)
        d0 = area * math.sqrt(rng.random())
        cc = np.array([c[0] + math.cos(a0) * d0, c[1] + math.sin(a0) * d0, z + rng.uniform(0, 0.006)])
        a = rng.uniform(0, 6.28)
        L = rng.uniform(*largo)
        d = np.array([math.cos(a), math.sin(a), 0])
        t = np.array([-d[1], d[0], 0])
        rizo = rng.uniform(0.004, 0.014)
        V = np.array([cc - d * L, cc + t * L * 0.42 + (0, 0, rizo), cc + d * L * 0.9 + (0, 0, rizo * 0.5), cc - t * L * 0.42 + (0, 0, rizo),
                      cc + (0, 0, 0.002), cc + d * L * 1.15 + (0, 0, 0.001)])
        F = np.array([(0, 4, 1), (1, 4, 2), (2, 4, 3), (3, 4, 0), (1, 2, 5), (2, 3, 5)])
        V = np.concatenate([V, V])
        F = np.concatenate([F, F[:, ::-1] + 6])
        Vs.append(V)
        Fs.append(F + b)
        b += 12
    cols = [hx(x) for x in colores]

    def pint(P, N):
        i = (np.floor(np.abs(B.ruido(P, 11, semilla)) * 9).astype(int)) % len(cols)
        base = np.array([cols[j] for j in i])
        return base * (0.85 + 0.25 * np.clip(0.5 + B.ruido(P, 60, semilla + 1), 0, 1))[:, None]
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'tela', pint)


def ramita(p, pts, r=0.008, color='#4A3A2A', semilla=0):
    V, F = B.tubo_m(pts, [r, r * 0.8, r * 0.45], seg=5, muestras=3)
    p.parte(V, F, 'madera', B.madera(color, '#24190F', eje=0, podrida=0.3, semilla=semilla))


def vela_apagada(p, c, alto=0.08, r=0.022, semilla=0, color='#C8B892'):
    C.vela(p, (c[0], c[1], 0.0), alto, r, semilla, llama=False, color=color)
    C.charco_cera(p, (c[0], c[1], 0.0), r * 2.6, semilla + 1, color=color)


def tabla(p, c, largo, ancho, grosor, R, pint, roto=0.0, semilla=0):
    """Tabla con la punta astillada (roto > 0: la punta se angosta)."""
    rng = B.azar(semilla)
    n = 6
    xs = np.linspace(-largo / 2, largo / 2, n + 1)
    V, F = [], []
    for i, x in enumerate(xs):
        w = ancho / 2
        if roto > 0 and i == n:
            w *= 0.35
        dz = rng.uniform(-0.003, 0.003)
        for sy, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            V.append((x, sy * w * (1 + rng.uniform(-0.06, 0.06)), sz * grosor / 2 + dz))
    for i in range(n):
        for k in range(4):
            a, b2 = i * 4 + k, i * 4 + (k + 1) % 4
            F += [(a, b2, b2 + 4), (a, b2 + 4, a + 4)]
    F += [(0, 2, 1), (0, 3, 2), (n * 4, n * 4 + 1, n * 4 + 2), (n * 4, n * 4 + 2, n * 4 + 3)]
    V = np.array(V)
    p.parte(B.transformar(V, c, R), np.array(F, np.int64), 'madera', pint)


def clavo(p, c, R, largo=0.07, doblado=0.0, semilla=0):
    pts = [np.array([0, 0, 0.0]), np.array([largo * 0.5, 0, 0]), np.array([largo, 0, doblado])]
    V, F = B.tubo_m(pts, 0.0035, seg=4, muestras=2)
    p.parte(B.transformar(V, c, R), F, 'hierro', B.metal('#4A4440', cant=0.7, semilla=semilla))
    Vc, Fc = B.cilindro_m((-0.002, 0, 0), (0.0015, 0, 0), 0.008, seg=7)
    p.parte(B.transformar(Vc, c, R), Fc, 'hierro', B.metal('#4A4440', cant=0.6, semilla=semilla + 1))


def moneda(p, c, R, r=0.022, semilla=0):
    V, F = B.cilindro_m((0, 0, -0.002), (0, 0, 0.002), r, seg=12)
    cara = hx('#E8C060')

    def pint(P, N):
        q = (P - np.asarray(c)) @ np.asarray(R)
        borde = suave(r * 0.7, r * 0.95, np.hypot(q[:, 0], q[:, 1]))
        col = mezclar(cara * 0.85, cara * 1.1, np.clip(0.5 + B.ruido(P, 90, semilla), 0, 1))
        return mezclar(col, hx('#8A6420'), borde * 0.5 * (1 - np.abs(N[:, 2])) + 0.15 * borde)
    p.parte(B.transformar(V, c, R), F, 'oro', pint)


def petalos(p, c, area, n, color='#6A0E18', semilla=0):
    rng = B.azar(semilla)
    Vs, Fs, b = [], [], 0
    for _ in range(n):
        a0 = rng.uniform(0, 2 * np.pi)
        d0 = area * math.sqrt(rng.random())
        cc = np.array([c[0] + math.cos(a0) * d0, c[1] + math.sin(a0) * d0, 0.006])
        a = rng.uniform(0, 6.28)
        r = rng.uniform(0.014, 0.024)
        ring = [(cc[0] + math.cos(a + k * 2 * np.pi / 7) * r * (1.15 if k == 0 else 1), cc[1] + math.sin(a + k * 2 * np.pi / 7) * r * 0.8,
                 cc[2] + 0.006 * (1 - math.cos(k * 2 * np.pi / 7))) for k in range(7)]
        V = np.array([cc] + ring)
        F = np.array([(0, 1 + k, 1 + (k + 1) % 7) for k in range(7)])
        V = np.concatenate([V, V])
        F = np.concatenate([F, F[:, ::-1] + 8])
        Vs.append(V)
        Fs.append(F + b)
        b += 16
    base = hx(color)

    def pint(P, N):
        return mezclar(base * 0.7, base * 1.35, np.clip(0.5 + B.ruido(P, 50, semilla), 0, 1))
    p.parte(np.concatenate(Vs), np.concatenate(Fs), 'tela', pint)


def vidrios(p, c, area, n, colores, semilla=0):
    rng = B.azar(semilla)
    for k in range(n):
        a0 = rng.uniform(0, 2 * np.pi)
        d0 = area * math.sqrt(rng.random())
        cc = (c[0] + math.cos(a0) * d0, c[1] + math.sin(a0) * d0, 0.004)
        r = rng.uniform(0.02, 0.045)
        m = rng.integers(3, 5)
        ang = np.sort(rng.uniform(0, 2 * np.pi, m))
        top = [(math.cos(t) * r * rng.uniform(0.5, 1.1), math.sin(t) * r * rng.uniform(0.5, 1.1)) for t in ang]
        V = [(x, y, 0.003) for x, y in top] + [(x, y, -0.002) for x, y in top]
        F = [(0, j, j + 1) for j in range(1, m - 1)] + [(m, m + j + 1, m + j) for j in range(1, m - 1)]
        for j in range(m):
            j2 = (j + 1) % m
            F += [(j, m + j, m + j2), (j, m + j2, j2)]
        R = B.rot_euler(rng.uniform(-0.15, 0.15), rng.uniform(-0.15, 0.15), rng.uniform(0, 6.28))
        col = hx(colores[k % len(colores)])
        p.parte(B.transformar(np.array(V), cc, R), np.array(F, np.int64), 'cera',
                lambda P, N, col=col: mezclar(col * 0.6, np.minimum(col * 1.15, 1), suave(0.3, 1.0, N[:, 2])))


def pagina(p, c, ang, ancho=0.11, alto=0.15, rizo=0.02, quemada=0.5, semilla=0):
    nx, ny = 5, 6
    xs = np.linspace(-ancho / 2, ancho / 2, nx + 1)
    ys = np.linspace(-alto / 2, alto / 2, ny + 1)
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    Z = 0.004 + rizo * ((X / (ancho / 2)) ** 2 * 0.6 + np.maximum(0, Y / (alto / 2)) ** 3)
    V = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    F = []
    for i in range(nx):
        for j in range(ny):
            a = i * (ny + 1) + j
            F += [(a, a + ny + 1, a + ny + 2), (a, a + ny + 2, a + 1)]
    F = np.array(F)
    V = np.concatenate([V, V])
    F = np.concatenate([F, F[:, ::-1] + len(V) // 2])
    papel, tinta, quemado = hx('#C8B48A'), hx('#3A2E24'), hx('#1E1612')
    R = B.rot_euler(0, 0, ang)

    def pint(P, N):
        q = (P - np.array([c[0], c[1], 0.0])) @ R
        borde = np.maximum(np.abs(q[:, 0]) / (ancho / 2), np.abs(q[:, 1]) / (alto / 2))
        lineas = (np.abs(np.sin(q[:, 1] * 260)) > 0.85) & (np.abs(q[:, 0]) < ancho * 0.36) & (np.abs(q[:, 1]) < alto * 0.4)
        col = mezclar(papel * 0.85, papel, np.clip(0.5 + B.ruido(P, 40, semilla), 0, 1))
        col = np.where(lineas[:, None], mezclar(col, tinta, 0.5), col)
        q2 = suave(1 - quemada * 0.45 - 0.1 * B.ruido(P, 30, semilla + 1), 1.0, borde)
        return mezclar(col, quemado, q2)
    p.parte(B.transformar(V, (c[0], c[1], 0), R), F, 'tela', pint)


def cadena_colgada(p, x, z_arriba, largo, semilla=0, color='#3A3634', comba=None):
    """Argolla en la pared y la cadena que cuelga (o que hace una comba hasta otra argolla)."""
    Va, Fa = B.toro_m((x, -0.03, z_arriba), 0.028, 0.007, seg=10, seg2=5, eje=(0, 1, 0))
    p.parte(Va, Fa, 'hierro', B.metal(color, cant=0.6, semilla=semilla))
    Vp, Fp = B.cilindro_m((x, 0.03, z_arriba + 0.028), (x, -0.035, z_arriba + 0.028), 0.012, seg=6)
    p.parte(Vp, Fp, 'hierro', B.metal(color, cant=0.5, semilla=semilla + 1))
    if comba is None:
        pts = [(x, -0.035, z_arriba - 0.02), (x + 0.01, -0.045, z_arriba - largo * 0.5), (x - 0.005, -0.04, z_arriba - largo)]
    else:
        x2 = comba
        pts = [(x, -0.035, z_arriba - 0.02), ((x + x2) / 2, -0.06, z_arriba - largo), (x2, -0.035, z_arriba - 0.02)]
        Vb, Fb = B.toro_m((x2, -0.03, z_arriba), 0.028, 0.007, seg=10, seg2=5, eje=(0, 1, 0))
        p.parte(Vb, Fb, 'hierro', B.metal(color, cant=0.6, semilla=semilla + 2))
    C.cadena(p, pts, eslabon=0.045, grosor=0.007, color=color, oxido=0.6, semilla=semilla)


def enredadera(p, x0, z0, n, largo, hoja='#4E5E2C', seca='#7A6A3A', tallo='#3E3424', semilla=0, ancho=0.4):
    """Hiedra que cuelga del borde de arriba de la pared (tallos con hojitas)."""
    rng = B.azar(semilla)
    hojas_v, hojas_f, b = [], [], 0
    for k in range(n):
        x = x0 + rng.uniform(-ancho / 2, ancho / 2)
        L = largo * rng.uniform(0.5, 1.0)
        pts = [(x, 0.0, z0 + 0.04)]
        for j in range(1, 5):
            pts.append((x + rng.uniform(-0.05, 0.05), -0.02 - 0.012 * j * rng.random(), z0 - L * j / 4))
        V, F = B.tubo_m(pts, [0.006, 0.005, 0.004, 0.003, 0.002], seg=4, muestras=3)
        p.parte(V, F, 'madera', B.liso(tallo))
        tt, _ = __import__('clay').catmull_rom(pts, 4)
        for q in tt[1::2]:
            a = rng.uniform(0, 6.28)
            s = rng.uniform(0.022, 0.034)
            u = np.array([math.cos(a), 0, math.sin(a)]) * s
            w = np.array([-math.sin(a), 0, math.cos(a)]) * s * 0.7
            cc = np.asarray(q) + (0, -0.012, 0)
            Vh = np.array([cc - u, cc + w + (0, -0.006, 0), cc + u, cc - w + (0, -0.006, 0), cc + (0, -0.01, 0)])
            Fh = np.array([(0, 4, 1), (1, 4, 2), (2, 4, 3), (3, 4, 0)])
            hojas_v.append(np.concatenate([Vh, Vh]))
            hojas_f.append(np.concatenate([Fh, Fh[:, ::-1] + 5]) + b)
            b += 10
    if hojas_v:
        H1, H2 = hx(hoja), hx(seca)

        def pint(P, N):
            t = suave(-0.3, 0.6, B.ruido(P, 9, semilla))
            return mezclar(H1, H2, t) * (0.8 + 0.3 * np.clip(0.5 + B.ruido(P, 40, semilla + 1), 0, 1))[:, None]
        p.parte(np.concatenate(hojas_v), np.concatenate(hojas_f), 'musgo', pint)


def raices_muro(p, x0, z0, n, color='#4E3E2C', semilla=0, ancho=0.5):
    rng = B.azar(semilla)
    for k in range(n):
        x = x0 + rng.uniform(-ancho / 2, ancho / 2)
        z = z0 + rng.uniform(-0.2, 0.2)
        L = rng.uniform(0.25, 0.55)
        pts = [(x, 0.03, z), (x + rng.uniform(-0.04, 0.04), -0.05, z - 0.04), (x + rng.uniform(-0.08, 0.08), -0.07, z - L * 0.6),
               (x + rng.uniform(-0.1, 0.1), -0.05, z - L)]
        V, F = B.tubo_m(pts, [0.016, 0.012, 0.007, 0.003], seg=5, muestras=3)
        p.parte(V, F, 'madera', B.madera(color, '#241A10', eje=2, podrida=0.5, semilla=semilla + k))


def monton(p, ancho, fondo, alto, pint, semilla=0, tris=220, mat='tierra'):
    """Montoncito de tierra/polvo contra la pared (la mitad de atrás entra en la roca)."""
    rng = B.azar(semilla)
    partes = [B.elipsoide((0, 0.02, 0.0), (ancho, fondo, alto))]
    for k in range(3):
        partes.append(B.elipsoide((rng.uniform(-ancho, ancho) * 0.6, rng.uniform(-fondo, 0) * 0.6, 0.0),
                                  (ancho * 0.4, fondo * 0.5, alto * rng.uniform(0.5, 0.9))))
    f0 = B.desplazar(B.union(*partes, k=0.03), alto * 0.12, 14, 3, semilla)
    f = lambda P: np.maximum(np.maximum(f0(P), -(P[:, 2] + 0.01)), P[:, 1] - 0.05)
    m = ancho * 1.3
    p.sdf(f, (-m, -fondo * 1.4, -0.02), (m, 0.06, alto * 1.3), max(alto / 6, 0.01), tris, mat, pint)


def escombro_pie(p, pint_piedra, pint_polvo, semilla, ancho=0.32, n=7, tam=(0.035, 0.09), polvo=True):
    if polvo:
        monton(p, ancho, 0.16, 0.05, pint_polvo, semilla, 180)
    rng = B.azar(semilla + 5)
    for k in range(n):
        x = rng.uniform(-ancho, ancho)
        y = -rng.uniform(0.0, 0.22) * (1 - abs(x) / ancho * 0.5)
        piedras(p, (x, y), 0.02, 1, pint_piedra, tam=(tam[0] * (1.4 - 0.6 * -y / 0.22), tam[1] * (1.3 - 0.5 * -y / 0.22)), semilla=semilla + k * 7, tris=70)


def trapo(p, c, ang, color='#5A4A3A', ancho=0.18, fondo=0.12, semilla=0):
    nx, ny = 7, 5
    xs = np.linspace(-ancho / 2, ancho / 2, nx + 1)
    ys = np.linspace(-fondo / 2, fondo / 2, ny + 1)
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    rng = B.azar(semilla)
    Z = 0.006 + 0.012 * np.abs(np.sin(X * 40 + rng.uniform(0, 3))) * np.exp(-((Y / fondo) ** 2) * 4) + rng.uniform(0, 0.004, X.shape)
    V = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    F = []
    for i in range(nx):
        for j in range(ny):
            a = i * (ny + 1) + j
            F += [(a, a + ny + 1, a + ny + 2), (a, a + ny + 2, a + 1)]
    F = np.array(F)
    V = np.concatenate([V, V])
    F = np.concatenate([F, F[:, ::-1] + len(V) // 2])
    p.parte(B.transformar(V, (c[0], c[1], 0), B.rot_euler(0, 0, ang)), F, 'tela', B.manchado(color, None, escala=20, fuerza=0.5, semilla=semilla))


# --------------------------------------------------------------------------
# Cementerio
# --------------------------------------------------------------------------

def p_piedrita_ce(s):
    return B.piedra('#86817A', '#4E4A45', musgo='#5A6E36', musgo_cant=0.35, escala=6, humedad=0.0, semilla=s)


def p_lodo_ce(s):
    return B.manchado('#4E4034', '#2E261F', escala=8, semilla=s)


def ce_pasto():
    p = pieza('det_pasto', 'suelo', 3)
    rng = B.azar(501)
    for k in range(3):
        C.pasto(p, (rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2), 0.0), 0.08, 7, rng.uniform(0.07, 0.11), '#66713E', '#8A7E48', 501 + k)
    return p


def ce_hojas():
    p = pieza('det_hojas', 'suelo', 3)
    hojas(p, (0, 0), 0.3, 16, ['#9A6A34', '#7A4A26', '#A88A48', '#5E3A1E'], 511)
    return p


def ce_piedritas():
    p = pieza('det_piedritas', 'suelo', 2)
    piedras(p, (0, 0), 0.22, 6, p_piedrita_ce(521), semilla=521)
    return p


def ce_ramitas():
    p = pieza('det_ramitas', 'suelo', 1.5)
    rng = B.azar(531)
    for k in range(3):
        a = rng.uniform(0, 6.28)
        d = np.array([math.cos(a), math.sin(a), 0])
        t = np.array([-d[1], d[0], 0])
        L = rng.uniform(0.18, 0.3)
        o = np.array([rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), 0.008])
        ramita(p, [o - d * L / 2, o + t * 0.02 + (0, 0, 0.004), o + d * L / 2 + t * 0.03], 0.007, semilla=531 + k)
        ramita(p, [o + d * 0.02, o + d * 0.05 + t * 0.04 + (0, 0, 0.006), o + d * 0.07 + t * 0.09], 0.004, semilla=541 + k)
    hojas(p, (0, 0), 0.2, 5, ['#7A4A26', '#5E3A1E'], 532)
    return p


def ce_hongos():
    p = pieza('det_hongos', 'suelo', 1)
    rng = B.azar(551)
    for k in range(rng.integers(4, 7)):
        c = np.array([rng.uniform(-0.12, 0.12), rng.uniform(-0.12, 0.12), 0.0])
        h = rng.uniform(0.025, 0.06)
        r = h * rng.uniform(0.5, 0.8)
        Vt, Ft = B.cilindro_m((0, 0, -0.005), (0, 0, h), r * 0.2, seg=6)
        p.parte(Vt + c, Ft, 'hueso', B.liso('#C8BCA0'))
        Vs, Fs = B.torno_m([(r * 0.2, h - r * 0.1), (r, h), (r * 0.8, h + r * 0.35), (0.0, h + r * 0.5)], seg=9)
        p.parte(Vs + c, Fs, 'musgo', lambda P, N: mezclar(hx('#6A3A22'), hx('#B07A48'), suave(-0.2, 0.9, N[:, 2])))
    C.monticulo(p, (0, 0, 0), (0.17, 0.15), 0.015, 552, B.manchado('#5A6E36', '#3A4422', 9, semilla=552), 90)
    return p


def ce_hueso():
    p = pieza('det_hueso', 'suelo', 1.2)
    rng = B.azar(561)
    for k in range(2):
        hueso(p, (rng.uniform(-0.12, 0.12), rng.uniform(-0.12, 0.12)), rng.uniform(0, 6.28), rng.uniform(0.14, 0.22), 0.013, 561 + k)
    hojas(p, (0, 0), 0.18, 4, ['#7A4A26', '#9A6A34'], 562)
    return p


def ce_flores():
    """Flores marchitas dejadas en el piso (tallos y pétalos oscuros)."""
    p = pieza('det_flores', 'suelo', 0.8)
    rng = B.azar(571)
    for k in range(4):
        a = rng.uniform(-0.6, 0.6) + 0.4
        d = np.array([math.cos(a), math.sin(a), 0])
        o = np.array([rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), 0.006])
        ramita(p, [o - d * 0.12, o, o + d * 0.12 + (0, 0, 0.004)], 0.004, color='#3E4A22', semilla=571 + k)
        petalos(p, o + d * 0.13, 0.025, 5, '#5A0E1A', 581 + k)
    p.parte(*B.toro_m((0, 0, 0.01), 0.018, 0.005, seg=8, seg2=4), 'tela', B.liso('#2A2A3A'))
    return p


def ce_pie_pasto():
    p = pieza('det_pie_pasto', 'pie', 2)
    rng = B.azar(601)
    monton(p, 0.3, 0.12, 0.035, p_lodo_ce(601), 601, 150)
    for k in range(4):
        C.pasto(p, (rng.uniform(-0.3, 0.3), rng.uniform(-0.12, -0.02), 0.0), 0.08, 8, rng.uniform(0.12, 0.2), '#66713E', '#8A7E48', 602 + k)
    return p


def ce_pie_piedras():
    p = pieza('det_pie_piedras', 'pie', 2)
    escombro_pie(p, p_piedrita_ce(611), p_lodo_ce(611), 611)
    C.pasto(p, (0.15, -0.08, 0.0), 0.06, 5, 0.09, '#66713E', '#8A7E48', 612)
    return p


def ce_pie_raices():
    p = pieza('det_pie_raices', 'pie', 1.2)
    rng = B.azar(621)
    for k in range(3):
        x = rng.uniform(-0.3, 0.3)
        pts = [(x, 0.06, 0.12), (x + rng.uniform(-0.05, 0.05), -0.04, 0.05), (x + rng.uniform(-0.1, 0.1), -0.16, 0.015), (x + rng.uniform(-0.12, 0.12), -0.28, -0.03)]
        V, F = B.tubo_m(pts, [0.03, 0.02, 0.012, 0.005], seg=6, muestras=3)
        p.parte(V, F, 'madera', B.madera('#5E4A36', '#2E2218', eje=2, podrida=0.4, semilla=621 + k))
    monton(p, 0.22, 0.1, 0.03, p_lodo_ce(622), 622, 120)
    return p


def ce_pie_hojas():
    p = pieza('det_pie_hojas', 'pie', 1.5)
    monton(p, 0.32, 0.14, 0.03, B.manchado('#6A4A2A', '#3A2818', 10, semilla=631), 631, 140)
    hojas(p, (0, -0.07), 0.28, 22, ['#9A6A34', '#7A4A26', '#A88A48', '#5E3A1E'], 632, z=0.02)
    return p


def ce_muro_hiedra():
    p = pieza('det_muro_hiedra', 'muro', 2)
    enredadera(p, 0.0, 1.42, 5, 0.75, semilla=641)
    return p


def ce_muro_raices():
    p = pieza('det_muro_raices', 'muro', 1)
    raices_muro(p, 0.0, 0.95, 4, semilla=651)
    return p


# --------------------------------------------------------------------------
# Catacumbas
# --------------------------------------------------------------------------

def p_caliza(s):
    return B.piedra('#ABA18C', '#6C6352', escala=6, humedad=0.0, semilla=s, mancha='#DAD6CA', mancha_cant=0.25)


def p_polvo_ca(s):
    return B.manchado('#7A705E', '#4A4436', 9, semilla=s)


def ca_huesitos():
    p = pieza('det_huesitos', 'suelo', 3)
    rng = B.azar(701)
    for k in range(4):
        hueso(p, (rng.uniform(-0.18, 0.18), rng.uniform(-0.18, 0.18)), rng.uniform(0, 6.28), rng.uniform(0.07, 0.16), 0.01, 701 + k)
    piedras(p, (0, 0), 0.2, 3, p_caliza(702), tam=(0.015, 0.03), semilla=702)
    return p


def ca_craneo():
    p = pieza('det_craneo', 'suelo', 1.2)
    rng = B.azar(711)
    craneo(p, (0.02, 0.0), rng.uniform(0, 6.28), 0.75, 711)
    hueso(p, (-0.12, 0.1), 0.6, 0.15, 0.011, 712)
    return p


def ca_piedritas():
    p = pieza('det_piedritas', 'suelo', 2)
    piedras(p, (0, 0), 0.24, 7, p_caliza(721), semilla=721)
    return p


def ca_velita():
    p = pieza('det_velita', 'suelo', 1.5)
    rng = B.azar(731)
    vela_apagada(p, (0, 0), rng.uniform(0.05, 0.09), 0.02, 731)
    vela_apagada(p, (0.07, 0.05), 0.035, 0.016, 732)
    return p


def ca_costillas():
    p = pieza('det_costillas', 'suelo', 1)
    for k in range(4):
        a0 = np.array([-0.08, -0.08 + k * 0.05, 0.008])
        V, F = B.tubo_m([a0, a0 + (0.07, 0.015, 0.045 - k * 0.006), a0 + (0.15, 0.0, 0.01)], [0.007, 0.006, 0.004], seg=5, muestras=3)
        p.parte(V, F, 'hueso', B.hueso(semilla=741 + k))
    hueso(p, (0.0, -0.02), 1.57, 0.2, 0.012, 745)
    return p


def ca_trapo():
    p = pieza('det_trapo', 'suelo', 1)
    trapo(p, (0, 0), 0.4, '#5E5446', semilla=751)
    hueso(p, (0.08, -0.06), 2.0, 0.12, 0.01, 752)
    return p


def ca_pie_huesos():
    p = pieza('det_pie_huesos', 'pie', 2)
    rng = B.azar(761)
    monton(p, 0.3, 0.13, 0.04, p_polvo_ca(761), 761, 150)
    for k in range(6):
        hueso(p, (rng.uniform(-0.28, 0.28), rng.uniform(-0.2, -0.02)), rng.uniform(0, 6.28), rng.uniform(0.1, 0.22), 0.012, 762 + k)
    craneo(p, (rng.uniform(-0.15, 0.15), -0.08), rng.uniform(-0.6, 0.6), 0.75, 769, inclina=(0.15, 0.25))
    return p


def ca_pie_escombro():
    p = pieza('det_pie_escombro', 'pie', 2)
    escombro_pie(p, p_caliza(771), p_polvo_ca(771), 771)
    return p


def ca_pie_velas():
    p = pieza('det_pie_velas', 'pie', 1.5)
    rng = B.azar(781)
    for k, x in enumerate((-0.15, -0.04, 0.08, 0.17)):
        vela_apagada(p, (x, -0.06 - rng.uniform(0, 0.08)), rng.uniform(0.04, 0.13), rng.uniform(0.016, 0.024), 781 + k)
    return p


def ca_muro_cadena():
    p = pieza('det_muro_cadena', 'muro', 1.5)
    cadena_colgada(p, -0.12, 1.15, 0.28, 791, comba=0.18)
    return p


def ca_muro_argolla():
    p = pieza('det_muro_argolla', 'muro', 1)
    cadena_colgada(p, 0.0, 1.0, 0.42, 801)
    return p


def ca_muro_raices():
    p = pieza('det_muro_raices', 'muro', 0.8)
    raices_muro(p, 0.0, 1.15, 3, color='#5A4A38', semilla=811)
    return p


# --------------------------------------------------------------------------
# Minas
# --------------------------------------------------------------------------

def p_roca_mi(s):
    return B.piedra('#8A5444', '#4A2A22', escala=6, humedad=0.0, semilla=s, claro='#A87448')


def p_carbon(s):
    return B.piedra('#2E2826', '#141110', escala=9, humedad=0.0, semilla=s, claro='#4A4440', grano=0.25)


def p_tierra_mi(s):
    return B.manchado('#6A4A3A', '#3A2620', 9, semilla=s)


def p_madera_mi(s, quemada=0.0):
    return B.madera('#8A6644', '#46301E', eje=0, podrida=0.25, semilla=s, quemada=quemada)


def mi_carbon():
    p = pieza('det_carbon', 'suelo', 2)
    piedras(p, (0, 0), 0.2, 6, p_carbon(901), tam=(0.02, 0.05), semilla=901)
    return p


def mi_grava():
    p = pieza('det_grava', 'suelo', 3)
    piedras(p, (0, 0), 0.26, 8, p_roca_mi(911), tam=(0.015, 0.045), semilla=911, tris=40)
    return p


def mi_clavos():
    p = pieza('det_clavos', 'suelo', 1)
    rng = B.azar(921)
    for k in range(4):
        c = (rng.uniform(-0.12, 0.12), rng.uniform(-0.12, 0.12), 0.004)
        clavo(p, c, B.rot_euler(0, 0, rng.uniform(0, 6.28)), rng.uniform(0.05, 0.08), rng.uniform(0, 0.02), 921 + k)
    tabla(p, (0.02, 0.06, 0.008), 0.16, 0.05, 0.016, B.rot_euler(0, 0, 0.5), p_madera_mi(925), roto=1, semilla=925)
    return p


def mi_astillas():
    p = pieza('det_astillas', 'suelo', 1.5)
    rng = B.azar(931)
    for k in range(4):
        tabla(p, (rng.uniform(-0.12, 0.12), rng.uniform(-0.12, 0.12), 0.007 + k * 0.004), rng.uniform(0.08, 0.2), rng.uniform(0.02, 0.04), 0.012,
              B.rot_euler(0, 0, rng.uniform(0, 6.28)), p_madera_mi(931 + k), roto=1, semilla=931 + k)
    return p


def mi_pepitas():
    p = pieza('det_pepitas', 'suelo', 0.8)
    piedras(p, (0, 0), 0.16, 4, p_roca_mi(941), tam=(0.02, 0.04), semilla=941)
    rng = B.azar(942)
    for k in range(5):
        c = np.array([rng.uniform(-0.12, 0.12), rng.uniform(-0.12, 0.12), 0.006])
        f = B.desplazar(B.esfera(c, 0.009), 0.003, 120, 2, 942 + k)
        p.sdf(f, c - 0.02, c + 0.02, 0.003, 40, 'oro', B.metal('#D8A848', '#7A5418', cant=0.2, semilla=942 + k, brillo='#FFE08A'))
    return p


def mi_pie_escombro():
    p = pieza('det_pie_escombro', 'pie', 2)
    escombro_pie(p, p_roca_mi(951), p_tierra_mi(951), 951)
    return p


def mi_pie_carbon():
    p = pieza('det_pie_carbon', 'pie', 1.5)
    monton(p, 0.26, 0.13, 0.06, p_carbon(961), 961, 180, mat='piedra')
    piedras(p, (0.0, -0.12), 0.18, 5, p_carbon(962), tam=(0.025, 0.05), semilla=962)
    return p


def mi_pie_tablas():
    p = pieza('det_pie_tablas', 'pie', 1.2)
    rng = B.azar(971)
    for k in range(3):
        x = -0.2 + k * 0.17 + rng.uniform(-0.03, 0.03)
        L = rng.uniform(0.45, 0.7)
        inc = rng.uniform(0.25, 0.4)
        # recostada contra la pared: el pie en el piso, la punta arriba en la roca
        c = (x, -0.04 - math.sin(inc) * L / 2, math.cos(inc) * L / 2)
        R = B.rot_euler(-(math.pi / 2 - inc), 0, rng.uniform(-0.1, 0.1)) @ B.rot_euler(0, math.pi / 2, 0)
        tabla(p, c, L, 0.09, 0.018, R, p_madera_mi(971 + k), roto=rng.random() < 0.5, semilla=971 + k)
    return p


def mi_pie_saco():
    p = pieza('det_pie_saco', 'pie', 0.8)
    f0 = B.union(B.elipsoide((0, -0.12, 0.08), (0.13, 0.11, 0.09)), B.elipsoide((0.02, -0.1, 0.17), (0.07, 0.06, 0.06)), k=0.05)
    f = B.desplazar(f0, 0.008, 20, 3, 981)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.005)), (-0.18, -0.27, -0.01), (0.18, 0.03, 0.26), 0.012, 300, 'tela',
          B.manchado('#8A7450', '#4A3A26', escala=14, fuerza=0.5, semilla=981))
    V, F = B.toro_m((0.02, -0.1, 0.205), 0.035, 0.007, seg=10, seg2=4)
    p.parte(V, F, 'tela', B.liso('#5A4630'))
    piedras(p, (0.16, -0.18), 0.06, 3, p_carbon(982), tam=(0.02, 0.035), semilla=982)
    return p


def mi_pie_balde():
    p = pieza('det_pie_balde', 'pie', 0.8)
    V, F = B.torno_m([(0.075, 0.0), (0.085, 0.004), (0.095, 0.14), (0.088, 0.14), (0.078, 0.01), (0.0, 0.01)], seg=12)
    R = B.rot_euler(math.pi / 2 - 0.05, 0, 0.6)
    c = (0.05, -0.15, 0.09)
    p.parte(B.transformar(V, c, R), F, 'madera', p_madera_mi(991))
    for z in (0.025, 0.115):
        Vt, Ft = B.toro_m((0, 0, z), 0.092, 0.006, seg=14, seg2=4)
        p.parte(B.transformar(Vt, c, R), Ft, 'hierro', B.metal('#3A3634', cant=0.6, semilla=992))
    hojas(p, (-0.08, -0.22), 0.07, 6, ['#24201E', '#3A3230'], 993)
    return p


def mi_muro_cuerda():
    p = pieza('det_muro_cuerda', 'muro', 1)
    clavo(p, (0.0, 0.03, 1.12), B.rot_euler(0, 0, -math.pi / 2), 0.08, 0.0, 1001)
    for k in range(4):
        V, F = B.toro_m((0.005 * k, -0.055, 1.0 - 0.012 * k), 0.09 - 0.006 * k, 0.012, seg=16, seg2=5, eje=(0.05 * k, 1, 0.1))
        p.parte(V, F, 'tela', B.manchado('#A08A5A', '#5A4A2A', escala=30, semilla=1002 + k))
    return p


def mi_muro_farol():
    p = pieza('det_muro_farol', 'muro', 0.8)
    clavo(p, (0.0, 0.03, 1.2), B.rot_euler(0, 0, -math.pi / 2), 0.09, 0.0, 1011)
    c = np.array([0.0, -0.06, 0.95])
    V, F = B.torno_m([(0.0, 0.0), (0.05, 0.0), (0.055, 0.02), (0.045, 0.03), (0.045, 0.13), (0.055, 0.14), (0.03, 0.17), (0.0, 0.18)], seg=8)
    p.parte(V + c, F, 'hierro', B.metal('#3A3634', cant=0.55, semilla=1012))
    Vg, Fg = B.cilindro_m(c + (0, 0, 0.035), c + (0, 0, 0.125), 0.043, seg=8)
    p.parte(Vg, Fg, 'cera', B.liso('#5A4A2E'), ao=False)
    Va, Fa = B.toro_m(c + (0, 0, 0.21), 0.03, 0.005, seg=8, seg2=4, eje=(1, 0, 0))
    p.parte(Va, Fa, 'hierro', B.metal('#3A3634', cant=0.5, semilla=1013))
    return p


def mi_muro_pico():
    """Pico recostado contra la pared (va al pie pero alto)."""
    p = pieza('det_pie_pico', 'pie', 0.6)
    inc = 0.3
    L = 0.8
    a = np.array([0.0, -0.22, 0.0])
    b = a + np.array([0, math.sin(inc) * L, math.cos(inc) * L])
    V, F = B.cilindro_m(a, b, 0.018, seg=7)
    p.parte(V, F, 'madera', p_madera_mi(1021))
    cabeza = [b + (-0.2, 0.01, -0.06), b + (-0.08, 0.0, 0.02), b + (0.0, 0.0, 0.03), b + (0.08, 0.0, 0.02), b + (0.2, 0.01, -0.06)]
    Vc, Fc = B.tubo_m(cabeza, [0.006, 0.02, 0.026, 0.02, 0.006], seg=6, muestras=3)
    p.parte(Vc, Fc, 'hierro', B.metal('#4A4440', cant=0.65, semilla=1022))
    return p


# --------------------------------------------------------------------------
# Abadía
# --------------------------------------------------------------------------

def p_sillar(s):
    return B.piedra('#B2A68E', '#6E6452', escala=6, humedad=0.0, semilla=s, mancha='#1E1A18', mancha_cant=0.2)


def p_ceniza(s):
    return B.manchado('#4A4440', '#221E1C', 10, semilla=s)


def ab_ceniza():
    """Ceniza regada (una capita gris de borde irregular) con palitos de carbón."""
    p = pieza('det_ceniza', 'suelo', 2)
    rng = B.azar(1101)
    nn = 18
    radios = [0.17 * (1 + 0.35 * math.sin(k * 1.9 + 0.7) + 0.2 * math.sin(k * 4.3)) for k in range(nn)]
    V = [(0.0, 0.0, 0.007)] + [(math.cos(2 * np.pi * k / nn) * radios[k], math.sin(2 * np.pi * k / nn) * radios[k] * 0.8, 0.002) for k in range(nn)]
    p.parte(np.array(V), np.array([(0, 1 + k, 1 + (k + 1) % nn) for k in range(nn)]), 'tierra',
            lambda P, N: mezclar(hx('#5A5652'), hx('#8A8682'), np.clip(0.5 + B.ruido(P, 30, 1101), 0, 1)) * (0.8 + 0.25 * suave(0.15, 0.0, np.hypot(P[:, 0], P[:, 1])))[:, None])
    carbon = B.madera('#2A2420', '#0E0C0A', eje=0, quemada=0.9, semilla=1102)
    for k in range(6):
        a0, d0 = rng.uniform(0, 6.28), rng.uniform(0.02, 0.13)
        c = (math.cos(a0) * d0, math.sin(a0) * d0 * 0.8, 0.01)
        Vb, Fb = B.caja_m(c, (rng.uniform(0.008, 0.02), rng.uniform(0.006, 0.01), 0.006), B.rot_euler(0, 0, rng.uniform(0, 6.28)))
        p.parte(Vb, Fb, 'madera', carbon)
    return p


def ab_vidrios():
    p = pieza('det_vidrios', 'suelo', 1.5)
    vidrios(p, (0, 0), 0.2, 6, ['#7A2018', '#22346A', '#8A6420', '#9A968A', '#9A968A'], 1111)
    V, F = B.tubo_m([(-0.15, 0.05, 0.006), (-0.05, 0.02, 0.008), (0.06, 0.06, 0.006)], 0.004, seg=4, muestras=2)
    p.parte(V, F, 'hierro', B.metal('#2A2826', cant=0.3, semilla=1112))
    return p


def ab_paginas():
    p = pieza('det_paginas', 'suelo', 1.5)
    rng = B.azar(1121)
    for k in range(3):
        pagina(p, (rng.uniform(-0.12, 0.12), rng.uniform(-0.1, 0.1)), rng.uniform(0, 6.28), quemada=rng.uniform(0.3, 0.9), semilla=1121 + k)
    return p


def ab_velita():
    p = pieza('det_velita', 'suelo', 1.2)
    vela_apagada(p, (0, 0), 0.07, 0.022, 1131, color='#D8CCB0')
    vela_apagada(p, (-0.07, 0.04), 0.03, 0.018, 1132, color='#D8CCB0')
    return p


def ab_rosario():
    p = pieza('det_rosario', 'suelo', 0.6)
    rng = B.azar(1141)
    pts = []
    for k in range(26):
        t = k / 25 * 2 * np.pi
        pts.append((0.09 * math.cos(t) + 0.015 * math.sin(3 * t), 0.06 * math.sin(t) + 0.01 * math.cos(2 * t), 0.006))
    for k, q in enumerate(pts):
        V, F = B.torno_m([(0.0, -0.006), (0.006, 0.0), (0.0, 0.006)], seg=6)
        p.parte(V + q, F, 'madera', B.liso('#3A2418' if k % 6 else '#6A4A30'))
    c = np.array([0.0, -0.1, 0.006])
    for a, b2, w in (((0, 0.03, 0), (0, -0.03, 0), 0.006), ((-0.017, 0.013, 0), (0.017, 0.013, 0), 0.006)):
        V, F = B.caja_m(c + (np.array(a) + np.array(b2)) / 2, (abs(a[0] - b2[0]) / 2 + w / 2, abs(a[1] - b2[1]) / 2 + w / 2, 0.004))
        p.parte(V, F, 'oro', B.metal('#B8903A', '#6A4A18', cant=0.3, semilla=1142))
    return p


def ab_piedritas():
    p = pieza('det_piedritas', 'suelo', 2)
    piedras(p, (0, 0), 0.24, 6, p_sillar(1151), semilla=1151)
    return p


def ab_pie_escombro():
    p = pieza('det_pie_escombro', 'pie', 2)
    escombro_pie(p, p_sillar(1161), p_ceniza(1161), 1161)
    return p


def ab_pie_libros():
    p = pieza('det_pie_libros', 'pie', 1)
    rng = B.azar(1171)
    tapas = ['#5A1A1E', '#2A3A2A', '#3A2A1E', '#4A3A5A']
    z = 0.0
    for k in range(4):
        w, d, h = rng.uniform(0.07, 0.1), rng.uniform(0.1, 0.13), rng.uniform(0.025, 0.04)
        c = (rng.uniform(-0.04, 0.04) - 0.1, -0.1 + rng.uniform(-0.02, 0.02), z + h / 2)
        R = B.rot_euler(0, 0, rng.uniform(-0.4, 0.4))
        V, F = B.caja_m(c, (w, d, h / 2), R)
        p.parte(V, F, 'tela', B.manchado(tapas[k], None, escala=20, semilla=1171 + k))
        Vh, Fh = B.caja_m(np.array(c) + R @ np.array([0.006, 0, 0]), (w - 0.004, d - 0.008, h / 2 - 0.004), R)
        p.parte(Vh, Fh, 'hueso', B.liso('#C8B48A'))
        z += h
    # uno abierto en el piso
    pagina(p, (0.12, -0.14), 0.3, 0.1, 0.14, 0.01, 0.2, 1179)
    pagina(p, (0.2, -0.13), 0.35, 0.1, 0.14, 0.012, 0.2, 1180)
    return p


def ab_pie_vigas():
    p = pieza('det_pie_vigas', 'pie', 1.2)
    rng = B.azar(1181)
    for k in range(2):
        L = rng.uniform(0.4, 0.6)
        c = (rng.uniform(-0.1, 0.1), -0.08 - k * 0.09, 0.04 + k * 0.035)
        R = B.rot_euler(0, 0, rng.uniform(-0.2, 0.2))
        V, F = B.caja_m(c, (L / 2, 0.045, 0.04), R)
        p.parte(V, F, 'madera', B.madera('#5A4030', '#2E2018', eje=0, quemada=0.8, semilla=1181 + k))
    C.monticulo(p, (0.0, -0.1, 0.0), (0.3, 0.14), 0.018, 1183, p_ceniza(1183), 100)
    return p


def ab_pie_velas():
    p = pieza('det_pie_velas', 'pie', 1.2)
    rng = B.azar(1191)
    for k, x in enumerate((-0.12, 0.0, 0.11)):
        vela_apagada(p, (x, -0.07 - rng.uniform(0, 0.06)), rng.uniform(0.05, 0.15), rng.uniform(0.018, 0.026), 1191 + k, color='#D8CCB0')
    return p


def ab_muro_cruz():
    p = pieza('det_muro_cruz', 'muro', 1)
    c = np.array([0.0, -0.02, 1.05])
    pint = B.madera('#4A3020', '#24160E', eje=2, podrida=0.2, semilla=1201)
    V, F = B.caja_m(c, (0.018, 0.018, 0.16))
    p.parte(V, F, 'madera', pint)
    V, F = B.caja_m(c + (0, 0, 0.06), (0.09, 0.018, 0.018))
    p.parte(V, F, 'madera', pint)
    clavo(p, c + (0, -0.02, 0.06), B.rot_euler(0, 0, math.pi / 2), 0.03, 0, 1202)
    return p


def ab_muro_hiedra():
    p = pieza('det_muro_hiedra', 'muro', 1.2)
    enredadera(p, 0.0, 1.42, 4, 0.65, hoja='#4A4A2A', seca='#6A5A3A', semilla=1211)
    return p


def ab_muro_cadena():
    p = pieza('det_muro_cadena', 'muro', 0.8)
    cadena_colgada(p, 0.0, 1.1, 0.35, 1221, color='#2E2A28')
    return p


# --------------------------------------------------------------------------
# Castillo
# --------------------------------------------------------------------------

def p_granito(s):
    return B.piedra('#66626E', '#2E2C34', escala=6, humedad=0.0, semilla=s)


def p_polvo_cas(s):
    return B.manchado('#3E383A', '#1E1A1C', 10, semilla=s)


def cas_monedas():
    p = pieza('det_monedas', 'suelo', 1.5)
    rng = B.azar(1301)
    for k in range(7):
        c = (rng.uniform(-0.14, 0.14), rng.uniform(-0.14, 0.14), 0.004 + 0.004 * (k % 3))
        moneda(p, c, B.rot_euler(rng.uniform(-0.25, 0.25), rng.uniform(-0.25, 0.25), rng.uniform(0, 6.28)), rng.uniform(0.016, 0.022), 1301 + k)
    return p


def cas_petalos():
    p = pieza('det_petalos', 'suelo', 2)
    petalos(p, (0, 0), 0.24, 14, '#6A0E18', 1311)
    return p


def cas_ceramica():
    p = pieza('det_ceramica', 'suelo', 1.5)
    rng = B.azar(1321)
    barro = B.manchado('#8A4A2E', '#4A2418', escala=14, semilla=1321)
    for k in range(6):
        r = 0.09
        a0, a1 = rng.uniform(0, 6.28), 0
        a1 = a0 + rng.uniform(0.6, 1.2)
        z0, z1 = rng.uniform(0.0, 0.05), rng.uniform(0.07, 0.12)
        nn = 4
        V, F = [], []
        for i in range(nn + 1):
            a = a0 + (a1 - a0) * i / nn
            for z, rr in ((z0, r), (z1, r * 0.85)):
                V.append((math.cos(a) * rr, math.sin(a) * rr, z))
        for i in range(nn):
            q = i * 2
            F += [(q, q + 2, q + 3), (q, q + 3, q + 1)]
        V = np.array(V)
        V = np.concatenate([V, V])
        F = np.array(F)
        F = np.concatenate([F, F[:, ::-1] + len(V) // 2])
        R = B.rot_euler(math.pi / 2 + rng.uniform(-0.3, 0.3), 0, rng.uniform(0, 6.28))
        c = (rng.uniform(-0.15, 0.15), rng.uniform(-0.15, 0.15), 0.01)
        Vt = B.transformar(V - V.mean(0), c, R)
        Vt[:, 2] = np.maximum(Vt[:, 2], 0.002)
        p.parte(Vt, F, 'cera', barro)
    return p


def cas_copa():
    p = pieza('det_copa', 'suelo', 0.6)
    V, F = B.torno_m([(0.0, 0.0), (0.035, 0.0), (0.035, 0.005), (0.008, 0.012), (0.006, 0.06), (0.012, 0.07), (0.035, 0.08),
                      (0.042, 0.12), (0.038, 0.12), (0.03, 0.085), (0.0, 0.078)], seg=10)
    R = B.rot_euler(math.pi / 2 - 0.12, 0, 0.8)
    p.parte(B.transformar(V, (0.0, 0.0, 0.04), R), F, 'oro', B.metal('#C09A44', '#6A4A18', cant=0.25, semilla=1331, brillo='#FFE08A'))
    nn = 12
    q = np.array([0.08, -0.07, 0.004])
    Vb = [q] + [q + (math.cos(2 * np.pi * k / nn) * 0.07 * (1 + 0.3 * math.sin(k * 2.1)), math.sin(2 * np.pi * k / nn) * 0.05, 0) for k in range(nn)]
    p.parte(np.array(Vb), np.array([(0, 1 + k, 1 + (k + 1) % nn) for k in range(nn)]), 'sangre', B.liso('#3A0408'), ao=False)
    return p


def cas_piedritas():
    p = pieza('det_piedritas', 'suelo', 2)
    piedras(p, (0, 0), 0.24, 6, p_granito(1341), semilla=1341)
    return p


def cas_velita():
    p = pieza('det_velita', 'suelo', 1)
    vela_apagada(p, (0, 0), 0.06, 0.02, 1351, color='#D8D0BC')
    petalos(p, (0.05, 0.05), 0.08, 4, '#6A0E18', 1352)
    return p


def cas_pie_escombro():
    p = pieza('det_pie_escombro', 'pie', 2)
    escombro_pie(p, p_granito(1361), p_polvo_cas(1361), 1361)
    return p


def cas_pie_jarron():
    p = pieza('det_pie_jarron', 'pie', 1)
    perfil = [(0.0, 0.0), (0.06, 0.0), (0.075, 0.03), (0.1, 0.12), (0.09, 0.2), (0.05, 0.25), (0.045, 0.28), (0.06, 0.3)]
    V, F = B.torno_m(perfil, seg=14)
    corte = 0.13 + 0.05 * np.sin(np.arctan2(V[:, 1], V[:, 0]) * 3)
    V[:, 2] = np.minimum(V[:, 2], corte)
    c = (-0.05, -0.12, 0.0)

    def pint(P, N):
        q = P - np.asarray(c)
        z = q[:, 2]
        franja = (np.abs(z - 0.06) < 0.012) | (np.abs(z - 0.1) < 0.006)
        col = mezclar(hx('#1E2A4A'), hx('#2A3A6A'), np.clip(0.5 + B.ruido(P, 20, 1371), 0, 1))
        return np.where(franja[:, None], hx('#B8903A'), col)
    p.parte(B.transformar(V, c), F, 'cera', pint)
    rng = B.azar(1372)
    for k in range(4):
        r = rng.uniform(0.03, 0.05)
        cc = (rng.uniform(0.0, 0.2), rng.uniform(-0.25, -0.1), 0.006)
        Vt, Ft = B.caja_m(cc, (r, r * 0.7, 0.004), B.rot_euler(rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, 6.28)))
        p.parte(Vt, Ft, 'cera', pint)
    return p


def cas_pie_cojin():
    p = pieza('det_pie_cojin', 'pie', 0.8)
    f = B.desplazar(B.caja((0.0, -0.13, 0.045), (0.13, 0.11, 0.035), r=0.035, R=B.rot_euler(0.15, 0.05, 0.3)), 0.004, 25, 2, 1381)
    p.sdf(lambda P: np.maximum(f(P), -(P[:, 2] + 0.004)), (-0.2, -0.3, -0.01), (0.2, 0.04, 0.14), 0.01, 300, 'tela',
          B.manchado('#6A1A1E', '#3A060C', escala=18, fuerza=0.45, semilla=1381))
    rng = B.azar(1382)
    for k in range(4):
        q = np.array([0.0, -0.13, 0.045]) + B.rot_euler(0.15, 0.05, 0.3) @ np.array([0.13 * (1 if k % 2 else -1), 0.11 * (1 if k // 2 else -1), 0])
        V, F = B.cilindro_m(q, q + (rng.uniform(-0.02, 0.02), -0.01, -0.035), 0.007, seg=5, r2=0.012)
        p.parte(V, F, 'tela', B.liso('#C09A44'))
    return p


def cas_pie_casco():
    p = pieza('det_pie_casco', 'pie', 0.8)
    c = np.array([0.0, -0.13, 0.0])
    R = B.rot_euler(-0.3, 0.4, 0.6)
    exterior = B.elipsoide((0, 0, 0), (0.09, 0.1, 0.11))
    f0 = B.restar(exterior, B.elipsoide((0, 0, -0.015), (0.075, 0.085, 0.1)), B.caja((0, -0.09, 0.02), (0.05, 0.03, 0.012)))
    f1 = lambda Q: np.maximum(f0(Q), -(Q[:, 2] + 0.03))

    def f(P):
        return f1((P - c) @ R)
    p.sdf(f, c - 0.15, c + 0.15, 0.007, 420, 'hierro', B.metal('#5A5A62', '#5A3A1E', cant=0.35, semilla=1391, brillo='#A8A8B0'))
    return p


def cas_muro_escudo():
    p = pieza('det_muro_escudo', 'muro', 1)
    c = np.array([0.0, -0.025, 0.98])
    contorno = lambda Q: np.maximum(np.maximum(np.abs(Q[:, 0]) - 0.12, Q[:, 2] - 0.12), np.hypot(Q[:, 0], np.maximum(-Q[:, 2], 0) * 0.7 + 0.05) - 0.17)
    f = lambda P: np.maximum(contorno(P - c), np.abs(P[:, 1] - c[1]) - 0.012 - 0.004 * (1 - np.abs((P[:, 0] - c[0]) / 0.12) ** 2))

    def pint(P, N):
        q = P - c
        campo = np.where((q[:, 0] > 0) ^ (q[:, 2] > 0.02), 1.0, 0.0)
        col = mezclar(hx('#7A121C'), hx('#1E2A4A'), campo)
        borde = contorno(q) > -0.016
        cheuron = np.abs(q[:, 2] - 0.06 + np.abs(q[:, 0]) * 0.9) < 0.018
        col = np.where((borde | cheuron)[:, None], hx('#C09A44'), col)
        return col * (0.85 + 0.25 * np.clip(0.5 + B.ruido(P, 30, 1401), 0, 1))[:, None]
    p.sdf(f, c - (0.15, 0.03, 0.2), c + (0.15, 0.03, 0.15), 0.006, 520, 'hierro', pint)
    return p


def cas_muro_cadena():
    p = pieza('det_muro_cadena', 'muro', 0.8)
    cadena_colgada(p, -0.14, 1.2, 0.22, 1411, comba=0.14)
    return p


def cas_muro_espadas():
    p = pieza('det_muro_espadas', 'muro', 0.8)
    c = np.array([0.0, -0.035, 1.0])
    for s in (-1, 1):
        R = B.rot_euler(0, s * 0.75, 0)
        hoja_V, hoja_F = B.caja_m((0, 0, 0.16), (0.016, 0.004, 0.2))
        p.parte(B.transformar(hoja_V, c, R), hoja_F, 'hierro', B.metal('#8A8A92', '#5A3A1E', cant=0.2, semilla=1421, brillo='#C8C8D0'))
        V, F = B.caja_m((0, 0, -0.045), (0.06, 0.008, 0.008))
        p.parte(B.transformar(V, c, R), F, 'oro', B.metal('#C09A44', cant=0.2, semilla=1422))
        V, F = B.cilindro_m((0, 0, -0.05), (0, 0, -0.13), 0.009, seg=6)
        p.parte(B.transformar(V, c, R), F, 'tela', B.liso('#3A2418'))
    return p


# --------------------------------------------------------------------------
# Lista por bioma
# --------------------------------------------------------------------------

DETALLES = {
    'cementerio': [ce_pasto, ce_hojas, ce_piedritas, ce_ramitas, ce_hongos, ce_hueso, ce_flores,
                   ce_pie_pasto, ce_pie_piedras, ce_pie_raices, ce_pie_hojas, ce_muro_hiedra, ce_muro_raices],
    'catacumbas': [ca_huesitos, ca_craneo, ca_piedritas, ca_velita, ca_costillas, ca_trapo,
                   ca_pie_huesos, ca_pie_escombro, ca_pie_velas, ca_muro_cadena, ca_muro_argolla, ca_muro_raices],
    'minas': [mi_carbon, mi_grava, mi_clavos, mi_astillas, mi_pepitas,
              mi_pie_escombro, mi_pie_carbon, mi_pie_tablas, mi_pie_saco, mi_pie_balde, mi_muro_pico, mi_muro_cuerda, mi_muro_farol],
    'abadia': [ab_ceniza, ab_vidrios, ab_paginas, ab_velita, ab_rosario, ab_piedritas,
               ab_pie_escombro, ab_pie_libros, ab_pie_vigas, ab_pie_velas, ab_muro_cruz, ab_muro_hiedra, ab_muro_cadena],
    'castillo': [cas_monedas, cas_petalos, cas_ceramica, cas_copa, cas_piedritas, cas_velita,
                 cas_pie_escombro, cas_pie_jarron, cas_pie_cojin, cas_pie_casco, cas_muro_escudo, cas_muro_cadena, cas_muro_espadas],
}
