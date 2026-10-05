"""Ayudas de forma para las figuras de Sangre y Ceniza: cortes rasgados, cascarones de tela, puntos sobre la
superficie, huesos, dientes, garras, plumas y remaches. Todo en coordenadas de la figura (mirando a +Y)."""
import math

import numpy as np

import sangre_comun as sc
import sdf

# ---------------------------------------------------------------------------
# Operaciones SDF
# ---------------------------------------------------------------------------


def cascaron(f, t):
    """La misma forma engordada t (tela encima del cuerpo)."""
    return lambda P: f(P) - t


def union(*fs, k=0.0):
    return sdf.union(*fs, k=k)


def restar(f, g, k=0.0):
    return sdf.subtract(f, g, k)


def intersect(f, g, k=0.0):
    return sdf.intersect(f, g, k)


def cortar(f, o, n, amp=0.02, esc=18.0, sem=0, dientes=0.0, esc_dientes=60.0):
    """Deja solo el lado +n del plano (o, n), con el borde rasgado (ruido + dientes de tela rota)."""
    o = np.asarray(o, float)
    n = np.asarray(n, float)
    n = n / np.linalg.norm(n)

    def g(P):
        jag = amp * (sc.fbm(P, esc, 3, sem) - 0.5) * 2
        if dientes:
            jag = jag + dientes * np.abs(np.sin((P[:, 0] + P[:, 1] * 0.7 + P[:, 2] * 0.3) * esc_dientes))
        return np.maximum(f(P), jag - (P - o) @ n)
    return g


def agujero(f, c, r, amp=0.012, esc=40.0, sem=0):
    """Agujero rasgado (esfera con borde irregular) restado de la forma."""
    c = np.asarray(c, float)
    r = np.asarray(r if np.ndim(r) else (r, r, r), float)
    e = sdf.ellipsoid(c, r)

    def g(P):
        h = e(P) + amp * (sc.fbm(P, esc, 3, sem) - 0.5) * 2
        return np.maximum(f(P), -h)
    return g


def caja_de(fs_lo_hi):
    los = [np.asarray(a, float) for _, a, _ in fs_lo_hi]
    his = [np.asarray(b, float) for _, _, b in fs_lo_hi]
    return np.min(los, 0), np.max(his, 0)


# ---------------------------------------------------------------------------
# Superficie
# ---------------------------------------------------------------------------

def sobre(f, origen, direccion, levantar=0.0):
    """Primer punto de la superficie de f desde `origen` en `direccion`, y su normal."""
    O = np.array([origen], float)
    d = np.asarray(direccion, float)
    d = d / np.linalg.norm(d)
    Q, hit = sdf.trace(f, O, d, max_dist=4.0, steps=260)
    if not hit[0]:
        return None, None
    p = Q[0]
    n = sdf.normal(f, np.array([p]))[0]
    n = n / max(np.linalg.norm(n), 1e-9)
    return p + n * levantar, n


def hacia(f, centro, direccion, levantar=0.0, lejos=1.5):
    """Punto de la superficie en la dirección dada desde un centro interior (trazando desde fuera)."""
    d = np.asarray(direccion, float)
    d = d / np.linalg.norm(d)
    return sobre(f, np.asarray(centro, float) + d * lejos, -d, levantar)


def anillo(f, centro, eje, r_fuera=0.6, n=24, levantar=0.0):
    return sdf.ring_points(f, tuple(centro), tuple(eje), r_fuera, n, levantar)


def base_ortonormal(n, arriba=(0, 0, 1)):
    """Matriz con columnas (u, n, w): la normal hace de «y» local (para cajas giradas con round_box)."""
    n = np.asarray(n, float)
    n = n / np.linalg.norm(n)
    up = np.asarray(arriba, float)
    w = up - (up @ n) * n
    if np.linalg.norm(w) < 1e-4:
        w = np.array([0.0, 1.0, 0.0]) - n[1] * n
    w = w / np.linalg.norm(w)
    u = np.cross(n, w)
    return np.stack([u, n, w], 1)


def eje_a(a, b):
    """Matriz con columnas (u, d, w): «y» local a lo largo de a→b."""
    d = np.asarray(b, float) - np.asarray(a, float)
    return base_ortonormal(d / np.linalg.norm(d))


# ---------------------------------------------------------------------------
# Piezas sueltas (mallas bajas)
# ---------------------------------------------------------------------------

def diente(pz, nombre, base, punta, r, pt, coll):
    """Diente / garra / cuerno / púa: cono curvo con punta."""
    base = np.asarray(base, float)
    punta = np.asarray(punta, float)
    o = sc.punta(nombre, base, punta, r, coll, seg=5 if r > 0.008 else 4)
    return pz.malla(o, pt)


def cuerno(pz, nombre, pts, r, pt, coll, seg=6):
    pts = [np.asarray(p, float) for p in pts]
    rs = list(np.linspace(r, r * 0.08, len(pts)))
    o = sc.tubo(nombre, pts, rs, coll, segmentos=seg, muestras=3, tapas=('round', 'point'))
    return pz.malla(o, pt)


def fila_dientes(pz, nombre, centro, ancho, n, alto, pt, coll, sentido=-1, curva=0.0, eje_y=0.0, irregular=0.3, sem=0):
    """Fila de dientes cuadraditos (sentido -1 = hacia abajo, +1 = hacia arriba)."""
    rng = np.random.default_rng(sem)
    c = np.asarray(centro, float)
    for i in range(n):
        t = (i / max(n - 1, 1) - 0.5)
        x = t * ancho
        y = -curva * (t * 2) ** 2 + eje_y
        h = alto * (1 + irregular * (rng.random() - 0.5) * 2)
        w = ancho / n * 0.42
        if rng.random() < 0.12 and n > 4:
            continue  # diente que falta
        o = sc.bolita(f'{nombre} {i}', c + np.array([x, y, sentido * h * 0.5]), (w, w * 0.8, h * 0.55), coll, n=2, p=3.0)
        pz.malla(o, pt)


def remaches(pz, nombre, puntos, r, pt, coll):
    for i, (p, n) in enumerate(puntos):
        if p is None:
            continue
        o = sc.bolita(f'{nombre} {i}', np.asarray(p) + np.asarray(n) * r * 0.2, r, coll, n=1, sub=1)
        pz.malla(o, pt)


def pluma(nombre, raiz, punta, ancho, coll, normal=(0, 0, 1), grosor=0.004, dientes=0):
    """Pluma plana (o placa con punta) de raiz a punta; `normal` es hacia dónde mira su cara."""
    raiz = np.asarray(raiz, float)
    punta = np.asarray(punta, float)
    d = punta - raiz
    L = np.linalg.norm(d)
    d = d / L
    nrm = np.asarray(normal, float)
    lat = np.cross(nrm, d)
    lat = lat / max(np.linalg.norm(lat), 1e-9)
    filas = []
    k = 5
    for i in range(k + 1):
        t = i / k
        w = ancho * (math.sin(math.pi * min(t * 1.15, 1.0)) * 0.85 + 0.15) * (1 - t * 0.35)
        if i == k:
            w = 0.0005
        c = raiz + d * L * t
        filas.append([c - lat * w * 0.5, c + lat * w * 0.5])
    return sc.lamina(nombre, filas, coll, grosor)


def tira(nombre, pts, ancho, coll, normal=(0, 1, 0), grosor=0.006, punta=True):
    """Tira de tela / correa plana que sigue los puntos (harapos, vendas, correas)."""
    pts = [np.asarray(p, float) for p in pts]
    nrm = np.asarray(normal, float)
    filas = []
    for i, p in enumerate(pts):
        d = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        d = d / max(np.linalg.norm(d), 1e-9)
        lat = np.cross(nrm, d)
        lat = lat / max(np.linalg.norm(lat), 1e-9)
        w = ancho if np.ndim(ancho) == 0 else ancho[i]
        if punta and i == len(pts) - 1:
            w *= 0.25
        filas.append([p - lat * w * 0.5, p + lat * w * 0.5])
    return sc.lamina(nombre, filas, coll, grosor)


def cuerda_anillo(pz, nombre, puntos, r, pt, coll, cerrado=True):
    o = sc.clay.sweep(nombre, [tuple(map(float, p)) for p in puntos], r, (1, 1), coll, None, segments=5, samples=1, closed=cerrado,
                      subsurf=0, caps=('flat', 'flat'))
    return pz.malla(o, pt)


def puntadas(pz, nombre, a, b, n, largo, pt, coll, r=0.004, normal=(0, 1, 0)):
    """Costura de cicatriz: línea de a a b con puntadas cruzadas."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    nrm = np.asarray(normal, float)
    d = b - a
    lat = np.cross(nrm, d)
    lat = lat / max(np.linalg.norm(lat), 1e-9)
    pz.malla(sc.tubo(f'{nombre} linea', [a, (a + b) / 2 + nrm * 0.003, b], r * 0.8, coll, segmentos=3, muestras=2), pt)
    for i in range(n):
        c = a + d * (i + 0.5) / n + nrm * 0.004
        pz.malla(sc.tubo(f'{nombre} {i}', [c - lat * largo / 2, c + lat * largo / 2], r, coll, segmentos=3, muestras=1), pt)


# ---------------------------------------------------------------------------
# Anatomía de hueso
# ---------------------------------------------------------------------------

def hueso_largo(pz, a, b, r, pt, k=0.01, nudos=1.0):
    """Hueso largo con cabezas abultadas en los extremos (fémur, húmero)."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    pz.cono(a, b, r, r * 0.85, pt, k)
    d = (b - a) / np.linalg.norm(b - a)
    lat = np.cross(d, [0, 0, 1]) if abs(d[2]) < 0.9 else np.cross(d, [1, 0, 0])
    lat = lat / np.linalg.norm(lat)
    for e, s in ((a, 1), (b, -1)):
        pz.bola(e + lat * r * 0.5 + d * s * r * 0.3, r * 1.45 * nudos, pt, k=0.012)
        pz.bola(e - lat * r * 0.5 + d * s * r * 0.3, r * 1.3 * nudos, pt, k=0.012)


def costilla(pz, f_torso, z, lado, a0, a1, pt, r=0.011, centro=(0, 0, 0), sale=0.0, n=5, k=0.004, escala=(1, 1)):
    """Costilla que rodea la superficie de f_torso a la altura z, del ángulo a0 al a1 (grados, 0 = espalda)."""
    pts = []
    for i in range(n):
        a = math.radians(a0 + (a1 - a0) * i / (n - 1))
        d = np.array([lado * math.sin(a), -math.cos(a), 0.0])
        c = np.array([centro[0], centro[1], z - 0.03 * math.sin(a * 0.5)])
        p, nn = hacia(f_torso, c, d, sale)
        if p is not None:
            pts.append(p)
    if len(pts) >= 3:
        pz.trazo(pts, r, pt, k)
    return pts


def vertebras(pz, pts, r, pt, k=0.006, puas=None, coll=None, pt_pua=None):
    """Columna: bolitas en fila (y púas hacia atrás si se pide)."""
    pts = [np.asarray(p, float) for p in pts]
    for i, p in enumerate(pts):
        pz.bola(p, (r * 1.15, r, r * 0.8), pt, k)
        if puas and coll is not None:
            d = np.asarray(puas, float)
            diente(pz, f'pua vertebra {i}', p + d * r * 0.5, p + d * r * (2.2 + 0.6 * math.sin(i)), r * 0.45, pt_pua or pt, coll)


def placa_marco(nombre, contorno, origen, u, v, grosor, coll):
    """Placa plana con contorno 2D (x a lo largo de u, y a lo largo de v) puesta en origen (hojas, membranas)."""
    import bmesh
    import bpy
    o = np.asarray(origen, float)
    u = np.asarray(u, float)
    v = np.asarray(v, float)
    me = bpy.data.meshes.new(nombre)
    bm = bmesh.new()
    vs = [bm.verts.new(tuple(o + u * x + v * y)) for x, y in contorno]
    bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nombre, me)
    sc.clay.link(ob, coll)
    if grosor:
        sc.clay.add_solidify(ob, grosor, offset=0.0)
    return ob


def poligono(nombre, pts, grosor, coll):
    """Cara de varios puntos 3D (casi plana), triangulada y con grosor (membranas de ala, velos)."""
    import bmesh
    import bpy
    me = bpy.data.meshes.new(nombre)
    bm = bmesh.new()
    vs = [bm.verts.new(tuple(map(float, p))) for p in pts]
    bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nombre, me)
    sc.clay.link(ob, coll)
    if grosor:
        sc.clay.add_solidify(ob, grosor, offset=0.0)
    return ob


def hoja_espada(pz, nombre, empuñe, direccion, plano, largo, ancho, pt, coll, muescas=3, grosor=0.012, punta=0.12, sem=0):
    """Hoja de espada (o cuchilla) desde el empuñe en la dirección dada; `plano` es la dirección del filo (ancho).
    Lleva muescas en el filo (hoja vieja) y un canal central."""
    rng = np.random.default_rng(sem)
    d = np.asarray(direccion, float)
    d /= np.linalg.norm(d)
    w = np.asarray(plano, float)
    w = w - (w @ d) * d
    w /= np.linalg.norm(w)
    contorno = [(0.0, -ancho / 2)]
    n = 7
    for i in range(1, n):
        x = largo * (1 - punta) * i / n
        y = -ancho / 2 * (1 - 0.08 * i / n)
        if muescas and rng.random() < muescas / n:
            contorno += [(x - 0.012, y), (x, y + ancho * 0.18), (x + 0.012, y)]
        else:
            contorno.append((x, y))
    contorno.append((largo * (1 - punta), -ancho / 2 * 0.9))
    contorno.append((largo, 0.0))
    contorno.append((largo * (1 - punta), ancho / 2 * 0.9))
    for i in range(n - 1, 0, -1):
        x = largo * (1 - punta) * i / n
        y = ancho / 2 * (1 - 0.08 * i / n)
        if muescas and rng.random() < muescas / n * 0.6:
            contorno += [(x + 0.012, y), (x, y - ancho * 0.15), (x - 0.012, y)]
        else:
            contorno.append((x, y))
    contorno.append((0.0, ancho / 2))
    ob = placa_marco(nombre, contorno, empuñe, d, w, grosor, coll)
    pz.malla(ob, pt, plano=True)
    return ob
