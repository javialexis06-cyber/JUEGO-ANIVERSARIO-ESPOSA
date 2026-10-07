"""Sangre y Ceniza · generadores que comparten los cinco biomas.

- Paredes excavables (bloques de 1 × 1 × 1,5 m): roca natural o muro de sillares. Cada bloque se sale ~10 cm de su
  celda para fundirse con el vecino; el techo usa un ruido que se repite cada metro (igual en todas las variantes),
  así que los bloques vecinos forman una meseta continua con grietas suaves entre bloque y bloque.
- Pisos de 2 × 2 m: campo de alturas con ruido que se repite cada 2 m (encajan sin costuras, sin girarlos), o losas
  cuyas juntas caen siempre en el borde de la baldosa (la junta se completa con la vecina).
- Utilería repetida: calaveras, huesos, velas con cera chorreada, cadenas, escombros, antorchas.
"""
import math

import numpy as np

import sangre_biomas_base as B
from sangre_biomas_base import hx, mezclar, suave

# --------------------------------------------------------------------------
# Paredes
# --------------------------------------------------------------------------

ALTO = 1.5
MEDIO = 0.6       # medio ancho del bloque (la celda mide 0,5): se sale 10 cm para fundirse con el vecino
CAJA_PARED = ((-0.78, -0.78, -0.06), (0.78, 0.78, 1.72))


def interior(P, a=0.49, b=0.36):
    """1 en el centro del bloque, 0 cerca del borde de la celda (donde toca al vecino)."""
    cheb = np.maximum(np.abs(P[:, 0]), np.abs(P[:, 1]))
    return suave(a, b, cheb)


def ruido_metro(P, escala, octavas=3, semilla=0):
    """Ruido plano (x, y) que se repite cada metro: igual en todos los bloques, así los bordes encajan."""
    Q = P.copy()
    Q[:, 2] = 0
    e = max(1, int(round(escala)))
    return B.fbm(Q, e, octavas, semilla, periodo=(e, e, None))


def ruido_libre(P, escala, octavas=3, semilla=0):
    return B.fbm(P, escala, octavas, semilla)


def techo_comun(P, alto=1.45, semilla=None, amp=0.03, amp_var=0.05, domo=10.0):
    """Altura del techo de un bloque: en la franja del borde un ruido que se repite cada metro (igual en todas las
    variantes); en el centro, el ruido propio de la variante. El domo suave deja la superficie de cada bloque un
    poco más alta que la del vecino dentro de su propia celda (sin parpadeo donde se solapan)."""
    w = interior(P)
    h = amp * ruido_metro(P, 3, 3, 900) * (1 - w)
    if semilla is not None:
        Q = P.copy()
        Q[:, 2] = 0
        h = h + amp_var * B.fbm(Q, 2.5, 3, semilla) * w
    # el domo arranca justo en la frontera (pendiente cero ahí: sin pliegue visible entre bloques)
    d = domo * (np.maximum(0, np.abs(P[:, 0]) - 0.5) ** 2 + np.maximum(0, np.abs(P[:, 1]) - 0.5) ** 2)
    return alto + h - d


def campo_roca(semilla, alto=1.45, rug=0.05, estratos=0.018, rocas=3, angular=0.0, escala_rug=3.0, medio=MEDIO,
               redondeo=0.17, extra=None, k_extra=0.08, amp_var=0.05):
    """Bloque de roca natural (SDF). extra: lista de campos que se funden (rocas, raíces, cristales)."""
    rng = B.azar(semilla)
    cuerpo = B.caja((0, 0, alto / 2 + 0.1), (medio, medio, alto / 2 + 0.25), r=redondeo)

    def techo(P):
        return P[:, 2] - techo_comun(P, alto, semilla + 5, amp_var=amp_var)

    base = B.cortar(cuerpo, techo, k=0.07)
    piezas = [base]
    for i in range(rocas):
        a = rng.uniform(0, 2 * np.pi)
        r = rng.uniform(0.12, 0.22)
        dist = medio - r * 0.35 + rng.uniform(0.0, 0.06)
        c = (math.cos(a) * dist, math.sin(a) * dist, rng.uniform(0.0, 0.25))
        R = B.rot_euler(rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(0, 6.28))
        piezas.append(B.caja(c, (r, r * rng.uniform(0.7, 1.0), r * rng.uniform(0.6, 0.9)), r=r * 0.6, R=R))
    f = B.union(*piezas, k=0.1)
    if extra:
        f0 = f
        f = lambda P, f0=f0: B.union(f0, *extra, k=k_extra)(P)

    def g(P):
        d = f(P)
        lado = 1 - suave(alto - 0.25, alto - 0.05, P[:, 2])
        # estratos: repisas horizontales en los lados
        d = d + estratos * lado * np.sin(P[:, 2] * 2 * np.pi * 2.4 + 2.2 * B.fbm(P, 1.2, 2, semilla + 3))
        n = B.fbm(P, escala_rug, 4, semilla + 1)
        if angular > 0:
            n = n * (1 - angular) + angular * (1 - 2 * np.abs(B.ruido(P, escala_rug * 0.9, semilla + 2)))
        arriba = 0.5 * ruido_metro(P, 6, 3, 777)
        d = d + rug * (lado * n + (1 - lado) * arriba)
        return np.maximum(d, -(P[:, 2] + 0.05))
    return g


def pintor_techo(fabrica, semilla):
    """Pintor del techo de un bloque que encaja con el vecino: fabrica(ruido, semilla) -> pintor, donde
    ruido(P, escala, octavas, semilla) es ruido_metro (con la misma semilla en todas las variantes) en la franja del
    borde y ruido_libre (con la semilla de la variante) en el centro."""
    per = fabrica(ruido_metro, 0)
    lib = fabrica(ruido_libre, semilla)

    def p(P, N):
        return mezclar(per(P, N), lib(P, N), interior(P))
    return p


def malla_pared(f, tris=1300, voxel=0.024, caja=CAJA_PARED):
    V, F = B.malla_sdf(f, caja[0], caja[1], voxel, None, suavizar=1)
    # Lo de abajo del piso no se ve: fuera
    abajo = (V[F][:, :, 2] < -0.035).all(1)
    F = F[~abajo]
    usados = np.unique(F)
    remap = -np.ones(len(V), np.int64)
    remap[usados] = np.arange(len(usados))
    V, F = V[usados], remap[F]
    return B.reducir(V, F, tris, 0)


def pintor_pared(lado, arriba, alto=1.45, borde_arriba=0.12, mezcla_ruido=0.08, semilla=0):
    """Une un pintor para los lados y otro para el techo según la normal y la altura."""
    def p(P, N):
        cl = lado(P, N)
        ca = arriba(P, N)
        t = suave(0.45, 0.8, N[:, 2]) * suave(alto - borde_arriba - 0.25, alto - borde_arriba, P[:, 2] + mezcla_ruido * B.ruido(P, 5, semilla))
        return mezclar(cl, ca, t)
    return p


def campo_muro(semilla, alto=1.45, hiladas=5, junta=0.022, rotas=0.15, rug=0.012, medio=MEDIO, desorden=0.02,
               bisel=0.035, faltan=0.0):
    """Muro de sillares (piedras talladas con juntas). Devuelve (campo, campo_de_juntas para pintar)."""
    rng = B.azar(semilla)
    piedras = []
    alto_h = alto / hiladas
    for h in range(hiladas):
        z0 = h * alto_h
        # Cada hilada: piedras que dan la vuelta al bloque (de -medio a medio en x, en las dos caras y)
        off = rng.uniform(0, 0.3)
        x = -medio - off
        while x < medio:
            w = rng.uniform(0.28, 0.5)
            x1 = min(x + w, medio + 0.15)
            cx = (x + x1) / 2
            if rng.random() > faltan or h < 1:
                dz = rng.uniform(-desorden, desorden)
                hz = alto_h / 2 - junta / 2
                piedras.append(B.caja((cx, 0, z0 + alto_h / 2 + dz), ((x1 - x) / 2 - junta / 2, medio + rng.uniform(-0.02, 0.02), hz),
                                      r=bisel, R=B.rot_euler(rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), 0)))
            x = x1
    # Núcleo (relleno de mortero) un poco hundido
    nucleo = B.caja((0, 0, alto / 2 - 0.04), (medio - 0.035, medio - 0.035, alto / 2), r=0.02)
    piedra_f = B.union(*piedras)
    f = B.union(piedra_f, nucleo)

    def g(P):
        d = f(P) + rug * B.fbm(P, 8, 3, semilla + 1)
        return np.maximum(d, -(P[:, 2] + 0.05))
    return g, piedra_f


# --------------------------------------------------------------------------
# Pisos (2 × 2 m, centrados en el origen, la cara de arriba en z ≈ 0)
# --------------------------------------------------------------------------

def rejilla(n=28, tam=2.0):
    xs = np.linspace(-tam / 2, tam / 2, n + 1)
    X, Y = np.meshgrid(xs, xs, indexing='ij')
    V = np.stack([X.ravel(), Y.ravel(), np.zeros(X.size)], 1)
    F = []
    for i in range(n):
        for j in range(n):
            a = i * (n + 1) + j
            b = (i + 1) * (n + 1) + j
            if (i + j) % 2:
                F += [(a, b, b + 1), (a, b + 1, a + 1)]
            else:
                F += [(a, b, a + 1), (b, b + 1, a + 1)]
    return V, np.array(F, np.int64)


def per(escala):
    """Periodo (en celdas) para que un ruido de esa escala se repita cada 2 m."""
    return (int(round(2 * escala)), int(round(2 * escala)), None)


def fbm_piso(P, escala, octavas=3, semilla=0):
    Q = P.copy()
    Q[:, 2] = 0
    return B.fbm(Q, escala, octavas, semilla, periodo=per(escala))


def ruido_piso(P, escala, semilla=0):
    Q = P.copy()
    Q[:, 2] = 0
    return B.ruido(Q, escala, semilla, periodo=per(escala))


# Calidad alta: las losas se hornean en textura a ~4 mm por texel (sangre_biomas_alta.py pone ALTA = True). Ahí las
# líneas suaves de ruido que en los vértices se veían como grietas parecen garabatos: grieta_piso las vuelve finas,
# quebradas y a ratos (con ALTA = False da exactamente lo mismo de siempre).
ALTA = False


def grieta_piso(P, escala, semilla, umbral=(0.88, 0.97)):
    if not ALTA:
        return suave(umbral[0], umbral[1], 1 - np.abs(ruido_piso(P, escala, semilla)))
    Q = P.copy()
    Q[:, 0] += 0.03 * ruido_piso(P, 16, semilla + 31) + 0.01 * ruido_piso(P, 48, semilla + 33)
    Q[:, 1] += 0.03 * ruido_piso(P, 16, semilla + 32) + 0.01 * ruido_piso(P, 48, semilla + 34)
    v = np.abs(ruido_piso(Q, escala, semilla))
    corte = suave(0.0, 0.3, ruido_piso(P, 2, semilla + 35) + 0.05)
    return (1 - suave(0.015, 0.045, v)) * corte


def piso_campo(pieza, alto_fn, pintor, n=28):
    """Campo de alturas de 2 × 2 m. alto_fn(P) -> z (debe repetirse cada 2 m en los bordes)."""
    V, F = rejilla(n)
    V[:, 2] = alto_fn(V)
    # (la calidad alta hornea el mismo campo en textura: sangre_biomas_alta.py)
    pieza.campo = dict(parte=len(pieza.partes), alto=alto_fn, pintor=pintor)
    pieza.parte(V, F, 'tierra', pintor)
    return pieza


def losas_fila(semilla, filas=(0.5, 0.5, 0.5, 0.5), anchos=(0.4, 0.75)):
    """Losas en hiladas: cada fila con sus anchos (todas las juntas exteriores caen en el borde de la baldosa).
    Devuelve una lista de rectángulos (x0, y0, x1, y1)."""
    rng = B.azar(semilla)
    rects = []
    y = -1.0
    for h in filas:
        x = -1.0
        while x < 1.0 - 1e-6:
            w = rng.uniform(*anchos)
            if 1.0 - (x + w) < anchos[0] * 0.8:
                w = 1.0 - x
            rects.append((x, y, x + w, y + h))
            x += w
        y += h
    return rects


def alto_losas(rects, semilla, junta=0.035, hundir=0.022, bisel=0.03, desnivel=0.012, inclina=0.01):
    """Campo de alturas de losas con juntas (el borde exterior queda a media junta)."""
    rng = B.azar(semilla)
    params = [(rng.uniform(-desnivel, desnivel), rng.uniform(-inclina, inclina), rng.uniform(-inclina, inclina))
              for _ in rects]

    def f(P):
        z = np.full(len(P), -hundir)
        idx = np.full(len(P), -1)
        for k, (x0, y0, x1, y1) in enumerate(rects):
            dx = np.minimum(P[:, 0] - x0, x1 - P[:, 0])
            dy = np.minimum(P[:, 1] - y0, y1 - P[:, 1])
            d = np.minimum(dx, dy) - junta / 2
            dentro = d > -1e-9
            dz, ix, iy = params[k]
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            h = dz + ix * (P[:, 0] - cx) + iy * (P[:, 1] - cy)
            perfil = -hundir + (hundir + h) * suave(0.0, bisel, d)
            z = np.where(dentro, np.maximum(z, perfil), z)
            idx = np.where(dentro & (d > 0.002), k, idx)
        return z, idx
    return f


# --------------------------------------------------------------------------
# Utilería común
# --------------------------------------------------------------------------

def campo_calavera(c=(0, 0, 0), s=1.0, R=None):
    """Calavera mirando a -Y (unos 15 cm de largo con s = 1)."""
    def loc(P):
        p = (P - np.asarray(c, float)) / s
        if R is not None:
            p = p @ np.asarray(R, float)
        return p
    craneo = B.elipsoide((0, 0.012, 0.075), (0.062, 0.075, 0.066))
    cara = B.caja((0, -0.045, 0.032), (0.04, 0.03, 0.035), r=0.022)
    pomulos = B.union(B.esfera((0.04, -0.05, 0.042), 0.017), B.esfera((-0.04, -0.05, 0.042), 0.017))
    mandibula = B.caja((0, -0.04, -0.002), (0.034, 0.03, 0.014), r=0.012)
    f0 = B.union(craneo, cara, pomulos, mandibula, k=0.02)
    ojos = B.union(B.elipsoide((0.024, -0.074, 0.05), (0.018, 0.02, 0.016)),
                   B.elipsoide((-0.024, -0.074, 0.05), (0.018, 0.02, 0.016)))
    nariz = B.elipsoide((0, -0.078, 0.026), (0.008, 0.02, 0.011))
    boca = B.caja((0, -0.072, 0.012), (0.026, 0.012, 0.0035), r=0.002)
    sienes = B.union(B.esfera((0.068, -0.012, 0.06), 0.018), B.esfera((-0.068, -0.012, 0.06), 0.018))
    f1 = B.restar(f0, ojos, nariz, k=0.006)
    f1 = B.restar(f1, boca, sienes, k=0.01)
    return lambda P: f1(loc(P)) * s


def calavera(s=1.0, tris=320, semilla=0):
    f = campo_calavera(s=1.0)
    V, F = B.malla_sdf(f, (-0.09, -0.11, -0.03), (0.09, 0.1, 0.15), 0.006, tris, suavizar=1)
    return V * s, F


def hueso_m(largo=0.3, r=0.022, tris=120):
    """Hueso largo a lo largo de x, apoyado (centro en el origen)."""
    a, b = np.array([-largo / 2 + r, 0, 0]), np.array([largo / 2 - r, 0, 0])
    f = B.union(B.capsula(a, b, r * 0.7),
                B.esfera(a + (0, 0.012, 0), r * 1.1), B.esfera(a + (0, -0.012, 0), r * 1.1),
                B.esfera(b + (0, 0.012, 0), r * 1.1), B.esfera(b + (0, -0.012, 0), r * 1.1), k=0.02)
    m = largo / 2 + r * 2
    return B.malla_sdf(f, (-m, -0.06, -0.05), (m, 0.06, 0.05), 0.008, tris, suavizar=1)


def vela(pieza, pos, alto=0.18, r=0.032, semilla=0, llama=True, color='#BFAE8C'):
    """Vela con cera chorreada y su llama (el vacío `llama` arriba)."""
    rng = B.azar(semilla)
    x, y, z = pos
    perf = [(r * 1.25, 0.0), (r * 1.05, 0.012), (r, 0.03), (r * 0.98, alto - 0.02), (r * 0.9, alto - 0.006),
            (r * 0.55, alto - 0.012), (0.004, alto - 0.008)]
    V, F = B.torno_m(perf, seg=10)
    pieza.parte(B.transformar(V, (x, y, z)), F, 'cera', B.cera(color, semilla=semilla))
    # chorreones
    for k in range(rng.integers(2, 5)):
        a = rng.uniform(0, 2 * np.pi)
        L = rng.uniform(0.25, 0.75) * alto
        p0 = np.array([math.cos(a) * r * 0.98, math.sin(a) * r * 0.98, alto - 0.01])
        pts = [p0, p0 + (0, 0, -L * 0.5), p0 + (0, 0, -L)]
        Vt, Ft = B.tubo_m(pts, [0.007, 0.006, 0.008], seg=5, muestras=3)
        pieza.parte(B.transformar(Vt, (x, y, z)), Ft, 'cera', B.cera(color, semilla=semilla + k))
    # mecha
    Vm, Fm = B.cilindro_m((x, y, z + alto - 0.01), (x, y, z + alto + 0.012), 0.0025, seg=4)
    pieza.parte(Vm, Fm, 'madera', B.liso('#1A1412'), ao=False)
    if llama:
        pieza.llama((x, y, z + alto + 0.045), 0.9)
    return pieza


def charco_cera(pieza, c, r=0.12, semilla=0, color='#A8977A'):
    rng = B.azar(semilla)
    blobs = [B.elipsoide((c[0] + rng.uniform(-r, r) * 0.6, c[1] + rng.uniform(-r, r) * 0.6, c[2]),
                         (r * rng.uniform(0.4, 0.7), r * rng.uniform(0.4, 0.7), 0.012)) for _ in range(5)]
    f = B.union(*blobs, k=0.03)
    pieza.sdf(lambda P: np.maximum(f(P), -(P[:, 2] - c[2] + 0.002)), (c[0] - r * 1.3, c[1] - r * 1.3, c[2] - 0.01),
              (c[0] + r * 1.3, c[1] + r * 1.3, c[2] + 0.03), 0.012, 160, 'cera', B.cera(color, semilla=semilla), suavizar=1)


def cadena(pieza, puntos, eslabon=0.05, grosor=0.009, color='#3A3634', oxido=0.5, semilla=0):
    """Cadena de eslabones a lo largo de una curva (cuelga si los puntos bajan en el medio)."""
    import clay
    pts, _ = clay.catmull_rom(puntos, 10)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    paso = eslabon * 0.78
    t = 0.0
    k = 0
    Vs, Fs = [], []
    base = 0
    while t < s[-1]:
        p = np.array([np.interp(t, s, pts[:, i]) for i in range(3)])
        q = np.array([np.interp(min(t + 0.01, s[-1]), s, pts[:, i]) for i in range(3)])
        d = q - p
        d = d / max(np.linalg.norm(d), 1e-9)
        # eslabón: toro estirado; alterna el giro 90°
        up = np.array([0, 0, 1.0]) if abs(d[2]) < 0.9 else np.array([1.0, 0, 0])
        n1 = np.cross(d, up)
        n1 /= np.linalg.norm(n1)
        if k % 2:
            n1 = np.cross(d, n1)
        V, F = B.toro_m((0, 0, 0), eslabon * 0.32, grosor, seg=6, seg2=4, eje=(0, 0, 1))
        V[:, 0] *= 1.45
        M = np.stack([d, np.cross(n1, d), n1], 1)  # x local -> d, y local -> ..., z local (eje del toro) -> n1
        V = V @ M.T + p
        Vs.append(V)
        Fs.append(F + base)
        base += len(V)
        t += paso
        k += 1
    if Vs:
        pieza.parte(np.concatenate(Vs), np.concatenate(Fs), 'hierro', B.metal(color, cant=oxido, semilla=semilla))
    return pieza


def escombros(pieza, c, radio=0.35, n=7, semilla=0, pintor=None, tam=(0.04, 0.1), mat='piedra', tris=60):
    """Piedritas sueltas alrededor de c."""
    rng = B.azar(semilla)
    pintor = pintor or B.piedra('#6A665E', '#3A3733', escala=6, humedad=0.0, semilla=semilla)
    for i in range(n):
        a = rng.uniform(0, 2 * np.pi)
        d = radio * math.sqrt(rng.random())
        r = rng.uniform(*tam)
        cc = (c[0] + math.cos(a) * d, c[1] + math.sin(a) * d, c[2] + r * 0.3)
        f = B.desplazar(B.caja(cc, (r, r * rng.uniform(0.6, 1.0), r * rng.uniform(0.5, 0.8)), r=r * 0.5,
                               R=B.rot_euler(rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), rng.uniform(0, 6))),
                        r * 0.18, 1.0 / r, 2, semilla + i)
        m = r * 1.6
        pieza.sdf(f, (cc[0] - m, cc[1] - m, -0.01), (cc[0] + m, cc[1] + m, cc[2] + m), r / 5, tris, mat, pintor, suavizar=1)
    return pieza


def antorcha_cabeza(pieza, c, semilla=0, tam=1.0):
    """Cabeza de antorcha: palo envuelto en trapo con brea, la llama encima."""
    x, y, z = c
    V, F = B.torno_m([(0.0, -0.02), (0.03, 0.0), (0.042, 0.03), (0.046, 0.08), (0.04, 0.12), (0.03, 0.14), (0.0, 0.15)], seg=9)
    pieza.parte(B.transformar(V * tam, (x, y, z)), F, 'tela', B.manchado('#2A221C', '#120E0C', escala=20, semilla=semilla))
    # vendas
    for k in range(3):
        Vt, Ft = B.toro_m((x, y, z + (0.03 + k * 0.04) * tam), 0.045 * tam, 0.008 * tam, seg=10, seg2=4)
        pieza.parte(Vt, Ft, 'tela', B.liso('#3A2E24'))
    # brasas en la punta
    Vb, Fb = B.torno_m([(0.0, 0.12), (0.032, 0.13), (0.02, 0.152), (0.0, 0.158)], seg=9)
    pieza.parte(B.transformar(Vb * tam, (x, y, z)), Fb, 'brasa', B.liso('#FF6A20'), ao=False)
    pieza.llama((x, y, z + 0.2 * tam), 2.4 * tam)
    return pieza


def pasto(pieza, c, radio=0.15, n=9, alto=0.12, color='#4C5A2C', seco='#6A6236', semilla=0):
    """Mata de pasto seco (hojas finas)."""
    rng = B.azar(semilla)
    Vs, Fs, base = [], [], 0
    for i in range(n):
        a = rng.uniform(0, 2 * np.pi)
        d = radio * math.sqrt(rng.random())
        p0 = np.array([c[0] + math.cos(a) * d, c[1] + math.sin(a) * d, c[2] - 0.01])
        h = alto * rng.uniform(0.6, 1.2)
        incl = rng.uniform(0.2, 0.7)
        b = rng.uniform(0, 2 * np.pi)
        tip = p0 + np.array([math.cos(b) * incl * h, math.sin(b) * incl * h, h])
        mid = (p0 + tip) / 2 + np.array([0, 0, h * 0.15])
        w = 0.012
        perp = np.array([-math.sin(b), math.cos(b), 0]) * w
        V = np.array([p0 - perp, p0 + perp, mid + perp * 0.6, mid - perp * 0.6, tip])
        V = np.concatenate([V, V])  # la cara de atrás con sus propios vértices (las hojas se ven por los dos lados)
        F = np.array([(0, 1, 2), (0, 2, 3), (3, 2, 4), (5, 7, 6), (5, 8, 7), (8, 9, 7)])
        Vs.append(V)
        Fs.append(F + base)
        base += 10
    C1, C2 = hx(color), hx(seco)

    def p(P, N):
        t = suave(c[2], c[2] + alto, P[:, 2])
        return mezclar(C1 * 0.6, mezclar(C1, C2, 0.5 + 0.5 * B.ruido(P, 8, semilla)), t)
    pieza.parte(np.concatenate(Vs), np.concatenate(Fs), 'musgo', p)
    return pieza


# --------------------------------------------------------------------------
# Vetas: el mineral sale de la roca del bioma (el mismo estilo de mineral en los cinco biomas)
# --------------------------------------------------------------------------

def puntos_superficie(V, N, n, semilla, zmin=0.15, zmax=1.42, lados=True, arriba=True, sep=0.2, centro=0.36):
    """Escoge n puntos de la malla separados entre sí (en los lados y/o el techo). En el techo solo en el centro
    del bloque (centro = medio ancho permitido), para no tapar ni romper la franja que encaja con el vecino."""
    rng = B.azar(semilla)
    ok = (V[:, 2] > zmin) & (V[:, 2] < zmax + 0.2)
    if not lados:
        ok &= N[:, 2] > 0.6
    if not arriba:
        ok &= N[:, 2] < 0.5
    # nada en los bordes de la celda que tocan al vecino (quedaría enterrado)
    ok &= (np.abs(V[:, 0]) < 0.66) & (np.abs(V[:, 1]) < 0.66)
    techo = N[:, 2] > 0.6
    ok &= ~techo | (np.maximum(np.abs(V[:, 0]), np.abs(V[:, 1])) < centro)
    idx = np.flatnonzero(ok)
    rng.shuffle(idx)
    elegidos = []
    for i in idx:
        if all(np.linalg.norm(V[i] - V[j]) > sep for j in elegidos):
            elegidos.append(i)
        if len(elegidos) >= n:
            break
    return [(V[i], N[i]) for i in elegidos]


def marco(n):
    """Base ortonormal con z = n."""
    n = np.asarray(n, float)
    n = n / np.linalg.norm(n)
    t = np.cross(n, (0, 0, 1.0)) if abs(n[2]) < 0.9 else np.cross(n, (1.0, 0, 0))
    t /= np.linalg.norm(t)
    return np.stack([t, np.cross(n, t), n], 1)


def cristal_m(largo, r, lados=6, punta=0.35):
    """Prisma hexagonal con punta (a lo largo de z, base en el origen)."""
    perf = [(r * 0.8, -0.04), (r, 0.0), (r, largo * (1 - punta)), (0.0, largo)]
    return B.torno_m(perf, seg=lados)


def racimo_cristales(pieza, p, n, semilla, tam=1.0, mat='cristal_sangre', color='#C81C2C', cuantos=(3, 6)):
    """Racimo de cristales que salen de la superficie en p con normal n."""
    rng = B.azar(semilla)
    M = marco(n)
    claro = hx(color) * 1.6

    def pint(P, N):
        t = suave(-0.2, 0.8, N[:, 2] * 0.5 + 0.5)
        return mezclar(hx(color) * 0.55, np.clip(claro, 0, 1), t)
    for k in range(rng.integers(*cuantos)):
        largo = tam * rng.uniform(0.12, 0.32)
        r = tam * rng.uniform(0.025, 0.05)
        V, F = cristal_m(largo, r, 6, rng.uniform(0.25, 0.45))
        inc = B.rot_euler(rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), rng.uniform(0, 6.28))
        off = np.array([rng.uniform(-0.05, 0.05), rng.uniform(-0.05, 0.05), -0.03]) * tam
        V = (V @ inc.T + off) @ M.T + p
        pieza.parte(V, F, mat, pint, ao=False)


def pepita(pieza, p, n, semilla, tam=1.0, mat='oro_veta', color='#E0A93A'):
    rng = B.azar(semilla)
    M = marco(n)
    blobs = [B.elipsoide((rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), rng.uniform(0, 0.02)),
                         (rng.uniform(0.03, 0.06), rng.uniform(0.025, 0.05), rng.uniform(0.02, 0.04))) for _ in range(3)]
    f = B.desplazar(B.union(*blobs, k=0.03), 0.006, 30, 2, semilla)
    V, F = B.malla_sdf(f, (-0.12, -0.12, -0.06), (0.12, 0.12, 0.08), 0.008, 90, suavizar=1)
    V = (V * tam) @ M.T + p
    C1 = hx(color)
    pieza.parte(V, F, mat, lambda P, N: mezclar(C1 * 0.6, np.clip(C1 * 1.3, 0, 1), suave(-0.3, 0.9, N[:, 2])), ao=False)


def trozo_hierro(pieza, p, n, semilla, tam=1.0):
    """Mena de hierro negro: trozos angulosos con brillo frío."""
    rng = B.azar(semilla)
    M = marco(n)
    cajas = [B.caja((rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), rng.uniform(-0.01, 0.03)),
                    (rng.uniform(0.03, 0.06), rng.uniform(0.03, 0.05), rng.uniform(0.03, 0.06)), r=0.008,
                    R=B.rot_euler(rng.uniform(0, 1), rng.uniform(0, 1), rng.uniform(0, 6))) for _ in range(3)]
    f = B.union(*cajas, k=0.01)
    V, F = B.malla_sdf(f, (-0.13, -0.13, -0.08), (0.13, 0.13, 0.12), 0.008, 80, suavizar=0)
    V = (V * tam) @ M.T + p

    def pint(P, N):
        base = mezclar(hx('#2A2C34'), hx('#4A5068'), suave(0.2, 0.9, N[:, 2] * 0.5 + 0.5))
        brillo = suave(0.5, 0.8, B.ruido(P, 40, semilla))
        return mezclar(base, hx('#9AA8E0'), brillo * 0.6)
    pieza.parte(V, F, 'hierro_negro', pint, ao=False)


def veta(base_fn, tipo, semilla, n=None):
    """veta_hierro / veta_sangre / veta_oro sobre la roca blanda del bioma (base_fn() -> Pieza)."""
    def fn():
        p = base_fn()
        p.extras.update(tipo='veta', dureza='veta', mineral=tipo)
        V, N = malla_base(p)
        cant = n or dict(hierro=9, sangre=7, oro=8)[tipo]
        for k, (q, nq) in enumerate(puntos_superficie(V, N, cant, semilla, sep=0.22)):
            q = q - nq * 0.02
            if tipo == 'sangre':
                racimo_cristales(p, q, nq + np.array([0, 0, 0.4]), semilla + k, tam=1.15)
            elif tipo == 'oro':
                pepita(p, q, nq, semilla + k, tam=1.2)
            else:
                trozo_hierro(p, q, nq, semilla + k, tam=1.3)
        return p
    return fn


# --------------------------------------------------------------------------
# Tierra y montículos
# --------------------------------------------------------------------------

def monticulo(pieza, c, r, alto, semilla=0, pintor=None, tris=260, terrones=0, hueco=0.0):
    """Montículo de tierra (tumba removida, escombros) apoyado en el piso, con terrones sueltos.
    hueco > 0 lo vuelve una orilla (anillo) dejando libre el centro."""
    rng = B.azar(semilla + 3)
    partes = [B.elipsoide((c[0], c[1], 0.0), (r[0], r[1], alto))]
    for k in range(terrones):
        a = rng.uniform(0, 6.28)
        d = rng.uniform(0.3, 0.9)
        q = (c[0] + math.cos(a) * r[0] * d, c[1] + math.sin(a) * r[1] * d, alto * (1 - d) * 0.8)
        partes.append(B.esfera(q, min(r) * rng.uniform(0.12, 0.22)))
    f = B.desplazar(B.union(*partes, k=0.03), min(0.012 + alto * 0.08, 0.04), 9, 3, semilla)
    if hueco > 0:
        f0 = f
        dentro = B.elipsoide((c[0], c[1], 0.0), (r[0] * hueco, r[1] * hueco, alto * 3))
        f = lambda P: np.maximum(f0(P), -dentro(P))
    f2 = lambda P: np.maximum(f(P), -(P[:, 2] + 0.02))
    m = max(r) * 1.2
    pieza.sdf(f2, (c[0] - m, c[1] - m, -0.03), (c[0] + m, c[1] + m, alto + 0.05), max(min(r) / 12, 0.012), tris,
              'tierra', pintor or B.manchado('#5E4A38', '#3A2C20', escala=6, semilla=semilla))


def raiz(pieza, puntos, r0=0.025, r1=0.006, color='#5A4634', semilla=0):
    V, F = B.tubo_m(puntos, [r0, (r0 + r1) / 2, r1], seg=5, muestras=3)
    pieza.parte(V, F, 'madera', B.madera(color, '#2E2218', eje=2, podrida=0.4, semilla=semilla))


def orientar(frente, arriba=(0, 0, 1.0)):
    """Matriz (mundo <- local) que pone el -Y local (el frente de las piezas) mirando hacia 'frente'."""
    y = -np.asarray(frente, float)
    y /= np.linalg.norm(y)
    up = np.asarray(arriba, float)
    z = up - np.dot(up, y) * y
    if np.linalg.norm(z) < 1e-4:
        z = np.array([0, 1.0, 0]) - y[1] * y
    z /= np.linalg.norm(z)
    x = np.cross(y, z)
    return np.stack([x, y, z], 1)


def grabar(f, lineas, ancho=0.012):
    """Grabado: resta surcos (lista de segmentos (a, b)) a un campo."""
    surcos = [B.capsula(a, b, ancho / 2) for a, b in lineas]
    g = B.union(*surcos)
    return lambda P: np.maximum(f(P), -g(P))


def juntas(P, alto_hilada=0.28, largo=0.42, ancho=0.012, prof=0.012, eje='x', z0=0.0):
    """Surcos de sillería sobre una cara (para sumarlos a un campo: el campo crece hacia afuera = surco)."""
    z = P[:, 2] - z0
    fila = np.floor(z / alto_hilada)
    dz = np.abs((z % alto_hilada) - alto_hilada / 2) - (alto_hilada / 2 - ancho)
    u = P[:, 0] if eje == 'x' else P[:, 1]
    u2 = u + (fila % 2) * largo / 2
    du = np.abs((u2 % largo) - largo / 2) - (largo / 2 - ancho)
    w = np.maximum(dz, du)
    return prof * suave(-ancho * 0.2, ancho * 0.8, w)


def huesos_suelo(pieza, c, radio, n, semilla, pintor=None):
    """Huesos regados en el piso alrededor de c."""
    rng = B.azar(semilla)
    for k in range(n):
        a = rng.uniform(0, 6.28)
        d = radio * math.sqrt(rng.random())
        V, F = hueso_m(rng.uniform(0.14, 0.26), rng.uniform(0.013, 0.018), 80)
        q = (c[0] + math.cos(a) * d, c[1] + math.sin(a) * d, 0.012)
        pieza.parte(B.transformar(V, q, B.rot_euler(0, rng.uniform(-0.1, 0.1), rng.uniform(0, 6.28))), F, 'hueso',
                    pintor or B.hueso(semilla=semilla + k))


# --------------------------------------------------------------------------
# Bloque de roca con malla controlada (techo en rejilla exacta + faldón)
# --------------------------------------------------------------------------

def altura_techo(P, alto=1.45, semilla=0, amp=0.015, amp_var=0.04):
    """Techo de un bloque: en la franja del borde ruido que se repite cada metro (igual en todas las variantes),
    en el centro el relieve propio de la variante."""
    w = interior(P)
    Q = P.copy()
    Q[:, 2] = 0
    return alto + amp * ruido_metro(P, 3, 3, 900) * (1 - w) + amp_var * B.fbm(Q, 2.5, 3, semilla + 5) * w


def bloque_roca(pieza, semilla, pintor_lado, pintor_arriba, alto=1.45, mat='piedra', rug=0.045, estratos=0.018,
                angular=0.0, bulto=0.07, amp_var=0.04, sep=0.085, nx=12, ny=8, filas=9, escala_rug=3.0, aplanar=None):
    """Bloque de pared de 1 × 1 m que encaja con sus vecinos como baldosas de terreno.

    - Techo: rejilla exacta sobre la celda (los vértices del borde coinciden con los del vecino: mismas posiciones,
      alturas y colores).
    - Faldón: bisel de 45° que arranca en la frontera (siempre por debajo del techo vecino) y el costado que baja
      hasta el piso con estratos, rugosidad y un abultamiento en la base. Esquinas redondeadas.
    nx: divisiones en x (caras ±Y; la -Y es la que ve la cámara), ny: divisiones en y (caras ±X)."""
    xs = np.linspace(-0.5, 0.5, nx + 1)
    ys = np.linspace(-0.5, 0.5, ny + 1)
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    Vt = np.stack([X.ravel(), Y.ravel(), np.zeros(X.size)], 1)
    Vt[:, 2] = altura_techo(Vt, alto, semilla, amp_var=amp_var)
    Ft = []
    for i in range(nx):
        for j in range(ny):
            a = i * (ny + 1) + j
            b = (i + 1) * (ny + 1) + j
            if (i + j) % 2:
                Ft += [(a, b, b + 1), (a, b + 1, a + 1)]
            else:
                Ft += [(a, b, a + 1), (b, b + 1, a + 1)]
    pieza.parte(Vt, np.array(Ft, np.int64), mat, pintor_arriba)

    # Perímetro (en sentido antihorario visto desde arriba): punto del borde y normal hacia afuera
    per = []
    for x in xs[:-1]:
        per.append(((x, -0.5), (0.0, -1.0)))
    for a in (-60, -30):
        per.append(((0.5, -0.5), (math.cos(math.radians(a)), math.sin(math.radians(a)))))
    for y in ys[:-1]:
        per.append(((0.5, y), (1.0, 0.0)))
    for a in (30, 60):
        per.append(((0.5, 0.5), (math.cos(math.radians(a)), math.sin(math.radians(a)))))
    for x in xs[::-1][:-1]:
        per.append(((x, 0.5), (0.0, 1.0)))
    for a in (120, 150):
        per.append(((-0.5, 0.5), (math.cos(math.radians(a)), math.sin(math.radians(a)))))
    for y in ys[::-1][:-1]:
        per.append(((-0.5, y), (-1.0, 0.0)))
    for a in (210, 240):
        per.append(((-0.5, -0.5), (math.cos(math.radians(a)), math.sin(math.radians(a)))))
    # en las esquinas el punto (x, y) del borde cae justo en la esquina: el normal promedio redondea
    bp = np.array([p for p, _ in per], float)
    bn = np.array([n for _, n in per], float)
    ncol = len(per)
    hb = altura_techo(np.concatenate([bp, np.zeros((ncol, 1))], 1), alto, semilla, amp_var=amp_var)
    # filas: bisel (3) y costado
    zs_lado = np.linspace(alto - 0.16, -0.05, filas - 3)
    Vs = []
    for r in range(filas):
        if r < 3:
            off = [0.0, 0.035, 0.07][r]
            z = hb - [0.0, 0.03, 0.09][r]
            q = np.concatenate([bp + bn * off, z[:, None]], 1)
        else:
            z = np.full(ncol, zs_lado[r - 3])
            q0 = np.concatenate([bp + bn * sep, z[:, None]], 1)
            n3 = B.fbm(q0, escala_rug, 4, semilla + 1)
            if angular > 0:
                n3 = n3 * (1 - angular) + angular * (1 - 2 * np.abs(B.ruido(q0, escala_rug * 0.9, semilla + 2)))
            capa = np.sin(z * 2 * np.pi * 2.4 + 2.2 * B.fbm(q0, 1.2, 2, semilla + 3))
            base = bulto * (1 - suave(0.0, 0.45, z)) * (0.6 + 0.8 * np.clip(0.5 + B.ruido(q0, 2.5, semilla + 4), 0, 1))
            plano = aplanar(q0) if aplanar is not None else 0.0
            off = sep + (rug * n3 + estratos * capa) * (1 - plano) + base * (1 - plano)
            # que el costado no se meta debajo del bisel más de la cuenta
            off = np.maximum(off, 0.03)
            q = np.concatenate([bp + bn * off[:, None], z[:, None]], 1)
            q[:, 2] += 0.02 * B.ruido(q0, 6, semilla + 6) * (1 - plano)
        Vs.append(q)
    Vs = np.concatenate(Vs)
    Fs = []
    for r in range(filas - 1):
        for c in range(ncol):
            c2 = (c + 1) % ncol
            a, b = r * ncol + c, r * ncol + c2
            a2, b2 = (r + 1) * ncol + c, (r + 1) * ncol + c2
            Fs += [(a, a2, b2), (a, b2, b)]
    pieza.parte(Vs, np.array(Fs, np.int64), mat, pintor_lado)
    return Vt, Vs


def roca_base(pieza, semilla, pintor, n=3, lado=None, alto_max=0.3, tam=(0.1, 0.2)):
    """Rocas sueltas pegadas a la base del bloque (rompen la línea del pie de la pared)."""
    rng = B.azar(semilla + 11)
    for k in range(n):
        if lado is None:
            a = rng.uniform(0, 2 * np.pi)
        else:
            a = lado + rng.uniform(-0.6, 0.6)
        r = rng.uniform(*tam)
        d = 0.55 + rng.uniform(0.0, 0.08)
        c = np.array([math.cos(a) * d, math.sin(a) * d, rng.uniform(0.0, alto_max * 0.5)])
        c[:2] = np.clip(c[:2], -0.62, 0.62)
        f = B.desplazar(B.caja(c, (r, r * rng.uniform(0.7, 1.0), r * rng.uniform(0.55, 0.85)), r=r * 0.55,
                               R=B.rot_euler(rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(0, 6.28))), r * 0.12, 1 / r, 3, semilla + k)
        m = r * 1.6
        pieza.sdf(lambda P, f=f: np.maximum(f(P), -(P[:, 2] + 0.03)), c - m, c + m, r / 7, 80, 'piedra', pintor)


def malla_base(p, partes=2):
    """Vértices y normales de las primeras partes de una pieza (el cuerpo del bloque: techo y faldón)."""
    Vs, Ns = [], []
    for q in p.partes[:partes]:
        Vs.append(q['V'])
        Ns.append(B.normales(q['V'], q['F']))
    return np.concatenate(Vs), np.concatenate(Ns)


def piedritas_techo(pieza, semilla, pintor, n=3, tam=(0.025, 0.055), alto=1.45, amp_var=0.04, mat='piedra'):
    """Piedritas sueltas en el centro del techo de un bloque (lejos de la franja que encaja con el vecino)."""
    rng = B.azar(semilla + 21)
    for k in range(n):
        r = rng.uniform(*tam)
        x, y = rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3)
        z = altura_techo(np.array([[x, y, 0.0]]), alto, semilla, amp_var=amp_var)[0]
        c = np.array([x, y, z + r * 0.2])
        f = B.desplazar(B.caja(c, (r, r * rng.uniform(0.6, 1.0), r * rng.uniform(0.5, 0.7)), r=r * 0.5,
                               R=B.rot_euler(rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, 6.28))), r * 0.15, 1 / r, 2, semilla + k)
        m = r * 1.6
        pieza.sdf(f, c - m, c + m, r / 5, 40, mat, pintor)


def interior_piso(P, a=0.85, b=0.6):
    """1 en el centro de una baldosa de piso de 2 × 2 m, 0 cerca de su borde."""
    return suave(a, b, np.maximum(np.abs(P[:, 0]), np.abs(P[:, 1])))
