"""Sangre y Ceniza · herramientas comunes de los biomas (pisos, paredes excavables, vetas, decoración y luces).

Cómo se arma una pieza:
- Se construye por partes (mallas en numpy): campos de distancia (SDF + marching cubes, reducidos a un número de
  triángulos), primitivas duras (cajas, cilindros, anillos) o cualquier objeto de Blender ya aplicado.
- Cada parte trae su material (pocos y compartidos: `piedra`, `madera`, `hierro`, `fuego`…) y su «pintor», una
  función (P, N) -> color sRGB que hornea el detalle en los colores por vértice: vetas, musgo arriba, humedad
  abajo, óxido, cera, hollín.
- Al final se calcula la oclusión ambiental (rayos contra la misma pieza y el piso) y se multiplica en los colores:
  las grietas y las juntas quedan oscuras aunque el juego solo tenga luces puntuales.

Convenciones (las mismas del contrato de `docs/sistemas/sangre-y-ceniza.md`):
- Metros, z arriba, el piso en z = 0. Cada pieza en el ORIGEN: el origen es el centro de su base.
- Lo que va contra una pared tiene la espalda hacia +Y y mira hacia -Y.
- La raíz es un vacío con el nombre del contrato (transformación identidad) y la malla es su hija; los vacíos
  `llama*` marcan dónde el juego pone la luz y las partículas.
- Los materiales son blancos: el color va en COLOR_0 (colores por vértice, lineales).
"""
import math

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from skimage.measure import marching_cubes

import clay

# --------------------------------------------------------------------------
# Color
# --------------------------------------------------------------------------


def hx(h):
    """'#RRGGBB' -> np.array sRGB 0..1."""
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)])


def a_lineal(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def mezclar(a, b, t):
    """Mezcla colores (n,3) o (3,) con t (n,) o escalar."""
    t = np.asarray(t, float)
    if t.ndim == 1:
        t = t[:, None]
    return np.asarray(a) * (1 - t) + np.asarray(b) * t


def suave(e0, e1, x):
    t = np.clip((np.asarray(x, float) - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# --------------------------------------------------------------------------
# Ruido (gradiente 3D, fBm, Voronoi 2D), con periodo opcional para que los pisos encajen
# --------------------------------------------------------------------------

_M32 = 0xFFFFFFFF
GRAD = np.array([[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
                 [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]], float)


def _hash(a, b, c, s):
    h = (a * 374761393 + b * 668265263 + c * 1440662683 + s * 1442695041 + 0x9E3779B9) & _M32
    h = ((h ^ (h >> 13)) * 1274126177) & _M32
    h = ((h ^ (h >> 16)) * 2246822519) & _M32
    return h ^ (h >> 15)


def _envolver(i, periodo, eje):
    if periodo is None:
        return i
    p = periodo[eje] if isinstance(periodo, (tuple, list)) else periodo
    return i if p is None else np.mod(i, p)


def ruido(P, escala=1.0, semilla=0, periodo=None):
    """Ruido de gradiente 3D en [-1, 1] aprox. periodo (en celdas de la red) lo hace repetible."""
    Q = np.atleast_2d(np.asarray(P, float)) * escala
    # desfase de una fracción de celda por semilla: el ruido de gradiente vale 0 en los nodos de la red y sin esto
    # los dibujos tipo 1 - |ruido| salen como puntos en cuadrícula (sigue siendo periódico: el desfase es fijo)
    Q = Q + np.array([(semilla * 0.6180339) % 1, (semilla * 0.4142135) % 1, (semilla * 0.7320508) % 1]) * 0.8 + 0.1
    i0 = np.floor(Q).astype(np.int64)
    f = Q - i0
    u = f * f * f * (f * (f * 6 - 15) + 10)
    out = np.zeros(len(Q))
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                ix = _envolver(i0[:, 0] + dx, periodo, 0)
                iy = _envolver(i0[:, 1] + dy, periodo, 1)
                iz = _envolver(i0[:, 2] + dz, periodo, 2)
                g = GRAD[_hash(ix, iy, iz, semilla) % 12]
                d = f - np.array([dx, dy, dz])
                w = (u[:, 0] if dx else 1 - u[:, 0]) * (u[:, 1] if dy else 1 - u[:, 1]) * (u[:, 2] if dz else 1 - u[:, 2])
                out += w * (g * d).sum(1)
    return out * 1.4


def fbm(P, escala=1.0, octavas=4, semilla=0, ganancia=0.5, periodo=None):
    """Ruido fractal en [-1, 1] aprox. Con periodo (celdas en la primera octava) se repite exacto."""
    tot = np.zeros(len(np.atleast_2d(P)))
    amp, norm, esc = 1.0, 0.0, escala
    for k in range(octavas):
        per = None
        if periodo is not None:
            per = tuple(None if p is None else p * (2 ** k) for p in periodo) if isinstance(periodo, tuple) else periodo * (2 ** k)
        tot += amp * ruido(P, esc, semilla + 101 * k, per)
        norm += amp
        amp *= ganancia
        esc *= 2.0
    return tot / norm


def voronoi(XY, escala=1.0, semilla=0, periodo=None, jitter=0.9):
    """Voronoi 2D: (F1, F2, id de la celda). Distancias en las unidades de XY."""
    Q = np.atleast_2d(np.asarray(XY, float))[:, :2] * escala
    i0 = np.floor(Q).astype(np.int64)
    f = Q - i0
    F1 = np.full(len(Q), 9.0)
    F2 = np.full(len(Q), 9.0)
    ID = np.zeros(len(Q), np.int64)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            cx = _envolver(i0[:, 0] + dx, periodo, 0)
            cy = _envolver(i0[:, 1] + dy, periodo, 1)
            h1 = _hash(cx, cy, 7, semilla)
            h2 = _hash(cx, cy, 13, semilla)
            px = dx + 0.5 + jitter * ((h1 & 0xFFFF) / 65535.0 - 0.5)
            py = dy + 0.5 + jitter * ((h2 & 0xFFFF) / 65535.0 - 0.5)
            d = np.hypot(px - f[:, 0], py - f[:, 1])
            m1 = d < F1
            F2 = np.where(m1, F1, np.minimum(F2, d))
            ID = np.where(m1, h1, ID)
            F1 = np.where(m1, d, F1)
    return F1 / escala, F2 / escala, ID


def azar(semilla):
    return np.random.default_rng(semilla)


# --------------------------------------------------------------------------
# Campos de distancia extra (complementan sdf.py)
# --------------------------------------------------------------------------

def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]])


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_euler(rx=0.0, ry=0.0, rz=0.0):
    return rot_z(rz) @ rot_y(ry) @ rot_x(rx)


def caja(c, half, r=0.0, R=None):
    """Caja (redondeada si r > 0) con centro c y medias medidas half, girada por la matriz R (mundo <- local)."""
    c = np.asarray(c, float)
    b = np.asarray(half, float)

    def f(P):
        p = P - c
        if R is not None:
            p = p @ np.asarray(R, float)
        q = np.abs(p) - b + r
        return np.sqrt((np.maximum(q, 0.0) ** 2).sum(-1)) + np.minimum(q.max(-1), 0.0) - r
    return f


def cilindro(a, b, r, borde=0.0):
    """Cilindro entre a y b con bordes redondeados."""
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    ba = b - a
    L = np.linalg.norm(ba)
    u = ba / L

    def f(P):
        pa = P - a
        t = pa @ u
        rad = np.sqrt(np.maximum((pa * pa).sum(-1) - t * t, 0.0))
        dx = rad - (r - borde)
        dy = np.abs(t - L / 2) - (L / 2 - borde)
        return np.sqrt(np.maximum(dx, 0) ** 2 + np.maximum(dy, 0) ** 2) + np.minimum(np.maximum(dx, dy), 0) - borde
    return f


def toro(c, R, r, eje='z'):
    c = np.asarray(c, float)
    ix = {'x': (1, 2, 0), 'y': (0, 2, 1), 'z': (0, 1, 2)}[eje]

    def f(P):
        p = P - c
        q = np.sqrt(p[:, ix[0]] ** 2 + p[:, ix[1]] ** 2) - R
        return np.sqrt(q * q + p[:, ix[2]] ** 2) - r
    return f


def esfera(c, r):
    c = np.asarray(c, float)
    return lambda P: np.sqrt(((P - c) ** 2).sum(-1)) - r


def elipsoide(c, r, R=None):
    c = np.asarray(c, float)
    r = np.asarray(r, float)

    def f(P):
        p = P - c
        if R is not None:
            p = p @ np.asarray(R, float)
        k0 = np.sqrt(((p / r) ** 2).sum(-1))
        k1 = np.sqrt(((p / (r * r)) ** 2).sum(-1))
        return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)
    return f


def capsula(a, b, r):
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    ba = b - a
    l2 = float(ba @ ba)

    def f(P):
        pa = P - a
        h = np.clip((pa @ ba) / l2, 0, 1)
        return np.sqrt(((pa - np.outer(h, ba)) ** 2).sum(-1)) - r
    return f


def cono_r(a, b, ra, rb):
    """Cono redondeado (radios ra en a y rb en b)."""
    import sdf
    return sdf.round_cone(a, b, ra, rb)


def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25


def union(*fs, k=0.0):
    def f(P):
        d = fs[0](P)
        for g in fs[1:]:
            d = smin(d, g(P), k)
        return d
    return f


def restar(a, *bs, k=0.0):
    def f(P):
        d = a(P)
        for b in bs:
            d = -smin(-d, b(P), k) if k > 0 else np.maximum(d, -b(P))
        return d
    return f


def cortar(a, b, k=0.0):
    """Intersección."""
    return lambda P: -smin(-a(P), -b(P), k) if k > 0 else np.maximum(a(P), b(P))


def desplazar(f, amp, escala, octavas=3, semilla=0, periodo=None):
    """Suma ruido fractal a la distancia (piedra rugosa, madera vieja)."""
    return lambda P: f(P) + amp * fbm(P, escala, octavas, semilla, periodo=periodo)


def mover_f(f, d=(0, 0, 0), R=None):
    """Campo movido d y girado R (R en coordenadas de mundo <- local)."""
    d = np.asarray(d, float)

    def g(P):
        p = P - d
        if R is not None:
            p = p @ np.asarray(R, float)
        return f(p)
    return g


def semiplano_z(z, arriba=True):
    """Todo lo de abajo de z (arriba=True deja lo de abajo; útil para cortar con el piso)."""
    return (lambda P: P[:, 2] - z) if arriba else (lambda P: z - P[:, 2])


# --------------------------------------------------------------------------
# Mallas en numpy
# --------------------------------------------------------------------------

def normales(V, F):
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    N = np.zeros_like(V)
    for k in range(3):
        np.add.at(N, F[:, k], fn)
    ln = np.linalg.norm(N, axis=1)
    N /= np.maximum(ln, 1e-12)[:, None]
    return N


def _leer_malla(me):
    me.calc_loop_triangles()
    nv = len(me.vertices)
    V = np.empty(nv * 3)
    me.vertices.foreach_get('co', V)
    nt = len(me.loop_triangles)
    F = np.empty(nt * 3, np.int64)
    me.loop_triangles.foreach_get('vertices', F)
    return V.reshape(-1, 3), F.reshape(-1, 3)


def _malla_temp(V, F, nombre='temp'):
    me = bpy.data.meshes.new(nombre)
    me.from_pydata(V.tolist(), [], F.tolist())
    me.update()
    obj = bpy.data.objects.new(nombre, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _borrar(obj):
    me = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if me is not None and me.users == 0:
        bpy.data.meshes.remove(me)


def reducir(V, F, tris=None, suavizar=0, factor=0.5):
    """Suaviza (iteraciones) y reduce a ~tris triángulos con el colapso de Blender."""
    if (tris is None or len(F) <= tris) and not suavizar:
        return V, F
    obj = _malla_temp(V, F)
    if suavizar:
        m = obj.modifiers.new('suave', 'SMOOTH')
        m.factor = factor
        m.iterations = suavizar
    if tris is not None and len(F) > tris:
        d = obj.modifiers.new('reducir', 'DECIMATE')
        d.decimate_type = 'COLLAPSE'
        d.ratio = max(tris / len(F), 0.001)
        d.use_collapse_triangulate = True
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
    V2, F2 = _leer_malla(me)
    bpy.data.meshes.remove(me)
    _borrar(obj)
    return V2, F2


def malla_sdf(f, bmin, bmax, voxel=0.02, tris=None, suavizar=1, chunk=300000):
    """Marching cubes de un campo de distancia dentro de la caja [bmin, bmax]."""
    bmin = np.asarray(bmin, float)
    bmax = np.asarray(bmax, float)
    dims = np.ceil((bmax - bmin) / voxel).astype(int) + 1
    xs = [bmin[i] + np.arange(dims[i]) * voxel for i in range(3)]
    X, Y, Z = np.meshgrid(xs[0], xs[1], xs[2], indexing='ij')
    P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    vals = np.empty(len(P))
    for s in range(0, len(P), chunk):
        vals[s:s + chunk] = f(P[s:s + chunk])
    vol = vals.reshape(dims)
    # Bordes de la caja: siempre afuera (la malla queda cerrada)
    vol[0, :, :] = vol[-1, :, :] = np.maximum(vol[0, :, :], voxel)
    vol[:, 0, :] = vol[:, -1, :] = np.maximum(vol[:, 0, :], voxel)
    vol[:, :, 0] = vol[:, :, -1] = np.maximum(vol[:, :, 0], voxel)
    if vol.min() >= 0 or vol.max() <= 0:
        raise ValueError('El campo no corta la caja')
    V, F, _, _ = marching_cubes(vol, 0.0, spacing=(voxel, voxel, voxel))
    V = V + bmin
    F = F.astype(np.int64)  # (skimage ya las deja hacia afuera: lo negativo es adentro)
    V, F = soldar(V, F)
    return reducir(V, F, tris, suavizar)


def soldar(V, F, tol=1e-7):
    """Une vértices repetidos (marching cubes los duplica en caras alineadas con la rejilla y la reducción no
    puede colapsar esas costuras) y quita los triángulos que quedan degenerados."""
    _, idx, inv = np.unique(np.round(V / tol).astype(np.int64), axis=0, return_index=True, return_inverse=True)
    inv = inv.reshape(-1)
    V2 = V[idx]
    F2 = inv[F]
    ok = (F2[:, 0] != F2[:, 1]) & (F2[:, 1] != F2[:, 2]) & (F2[:, 0] != F2[:, 2])
    return V2, F2[ok]


def malla_obj(obj, borrar=True):
    """Malla (con modificadores aplicados y en coordenadas de mundo) de un objeto de Blender."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
    me.transform(obj.matrix_world)
    V, F = _leer_malla(me)
    bpy.data.meshes.remove(me)
    if borrar:
        _borrar(obj)
    return V, F


def caja_m(c, half, R=None):
    """Caja dura (caras sueltas: sombreado plano)."""
    c = np.asarray(c, float)
    h = np.asarray(half, float)
    caras = [((1, 0, 0), (0, 1, 0), (0, 0, 1)), ((-1, 0, 0), (0, 0, 1), (0, 1, 0)), ((0, 1, 0), (0, 0, 1), (1, 0, 0)),
             ((0, -1, 0), (1, 0, 0), (0, 0, 1)), ((0, 0, 1), (1, 0, 0), (0, 1, 0)), ((0, 0, -1), (0, 1, 0), (1, 0, 0))]
    V, F = [], []
    for n, u, v in caras:
        n, u, v = np.array(n, float), np.array(u, float), np.array(v, float)
        b = len(V)
        for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            V.append((n + u * su + v * sv) * h)
        F += [(b, b + 1, b + 2), (b, b + 2, b + 3)]
    V = np.array(V)
    if R is not None:
        V = V @ np.asarray(R, float).T
    return V + c, np.array(F, np.int64)


def cilindro_m(a, b, r, seg=8, tapas=True, r2=None, suave=True):
    """Cilindro (o cono si r2) de a a b."""
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    r2 = r if r2 is None else r2
    d = b - a
    L = np.linalg.norm(d)
    w = d / L
    t1 = np.cross(w, [0, 0, 1.0]) if abs(w[2]) < 0.9 else np.cross(w, [1.0, 0, 0])
    t1 /= np.linalg.norm(t1)
    t2 = np.cross(w, t1)
    ang = np.linspace(0, 2 * np.pi, seg, endpoint=False)
    ring = np.cos(ang)[:, None] * t1 + np.sin(ang)[:, None] * t2
    V = np.concatenate([a + ring * r, b + ring * r2])
    F = []
    for k in range(seg):
        k2 = (k + 1) % seg
        F += [(k, k2, seg + k2), (k, seg + k2, seg + k)]
    if tapas:
        ia, ib = len(V), len(V) + 1
        V = np.concatenate([V, [a, b]])
        for k in range(seg):
            k2 = (k + 1) % seg
            F += [(ia, k2, k), (ib, seg + k, seg + k2)]
    return V, np.array(F, np.int64)


def toro_m(c, R, r, seg=12, seg2=6, eje=(0, 0, 1)):
    eje = np.asarray(eje, float)
    eje /= np.linalg.norm(eje)
    t1 = np.cross(eje, [0, 0, 1.0]) if abs(eje[2]) < 0.9 else np.cross(eje, [1.0, 0, 0])
    t1 /= np.linalg.norm(t1)
    t2 = np.cross(eje, t1)
    V, F = [], []
    for i in range(seg):
        a = 2 * np.pi * i / seg
        d = math.cos(a) * t1 + math.sin(a) * t2
        for j in range(seg2):
            b = 2 * np.pi * j / seg2
            V.append(np.asarray(c) + d * (R + r * math.cos(b)) + eje * r * math.sin(b))
    for i in range(seg):
        for j in range(seg2):
            a0 = i * seg2 + j
            a1 = i * seg2 + (j + 1) % seg2
            b0 = ((i + 1) % seg) * seg2 + j
            b1 = ((i + 1) % seg) * seg2 + (j + 1) % seg2
            F += [(a0, b0, b1), (a0, b1, a1)]
    return np.array(V), np.array(F, np.int64)


def torno_m(perfil, seg=12, c=(0, 0, 0)):
    """Superficie de revolución alrededor de z desde [(radio, z), ...] (velas, urnas, candelabros)."""
    V, F = [], []
    n = len(perfil)
    for r, z in perfil:
        for k in range(seg):
            a = 2 * np.pi * k / seg
            V.append((r * math.cos(a), r * math.sin(a), z))
    for i in range(n - 1):
        for k in range(seg):
            a0, a1 = i * seg + k, i * seg + (k + 1) % seg
            b0, b1 = (i + 1) * seg + k, (i + 1) * seg + (k + 1) % seg
            F += [(a0, a1, b1), (a0, b1, b0)]
    V = np.array(V, float)
    if perfil[0][0] > 1e-6:
        ci = len(V)
        V = np.vstack([V, [0, 0, perfil[0][1]]])
        F += [(ci, (k + 1) % seg, k) for k in range(seg)]
    if perfil[-1][0] > 1e-6:
        ci = len(V)
        V = np.vstack([V, [0, 0, perfil[-1][1]]])
        b = (n - 1) * seg
        F += [(ci, b + k, b + (k + 1) % seg) for k in range(seg)]
    return V + np.asarray(c, float), np.array(F, np.int64)


def tubo_m(puntos, r, seg=6, muestras=4, tapas=True):
    """Tubo a lo largo de una curva Catmull-Rom (ramas, raíces, cadenas gruesas, cera chorreada).
    r puede ser una lista (un radio por punto de control)."""
    pts, params = clay.catmull_rom(puntos, muestras)
    n = len(puntos)
    if np.isscalar(r):
        rad = np.full(len(pts), float(r))
    else:
        rad = np.interp(params, np.linspace(0, n - 1, len(r)), r)
    T = np.gradient(pts, axis=0)
    T /= np.maximum(np.linalg.norm(T, axis=1), 1e-9)[:, None]
    N0 = np.cross(T[0], [0, 0, 1.0])
    if np.linalg.norm(N0) < 1e-4:
        N0 = np.cross(T[0], [1.0, 0, 0])
    N0 /= np.linalg.norm(N0)
    Ns = [N0]
    for i in range(1, len(pts)):
        nv = Ns[-1] - np.dot(Ns[-1], T[i]) * T[i]
        ln = np.linalg.norm(nv)
        Ns.append(nv / ln if ln > 1e-6 else Ns[-1])
    V, F = [], []
    for i, p in enumerate(pts):
        B = np.cross(T[i], Ns[i])
        for k in range(seg):
            a = 2 * np.pi * k / seg
            V.append(p + (Ns[i] * math.cos(a) + B * math.sin(a)) * rad[i])
    m = len(pts)
    for i in range(m - 1):
        for k in range(seg):
            a0, a1 = i * seg + k, i * seg + (k + 1) % seg
            b0, b1 = (i + 1) * seg + k, (i + 1) * seg + (k + 1) % seg
            F += [(a0, a1, b1), (a0, b1, b0)]
    V = np.array(V)
    if tapas:
        i0, i1 = len(V), len(V) + 1
        V = np.vstack([V, pts[0] - T[0] * rad[0] * 0.5, pts[-1] + T[-1] * rad[-1] * 0.5])
        F += [(i0, (k + 1) % seg, k) for k in range(seg)]
        b = (m - 1) * seg
        F += [(i1, b + k, b + (k + 1) % seg) for k in range(seg)]
    return V, np.array(F, np.int64)


def transformar(V, d=(0, 0, 0), R=None, s=1.0):
    V = np.asarray(V, float) * s
    if R is not None:
        V = V @ np.asarray(R, float).T
    return V + np.asarray(d, float)


# --------------------------------------------------------------------------
# Materiales (blancos: el color va en los vértices)
# --------------------------------------------------------------------------

MATERIALES = {
    # nombre: (rugosidad, metal, emisión hex o None, fuerza de emisión, fieltro)
    'piedra': (0.92, 0.0, None, 0.0, False),
    'tierra': (0.97, 0.0, None, 0.0, False),
    'madera': (0.85, 0.0, None, 0.0, False),
    'hueso': (0.7, 0.0, None, 0.0, False),
    'hierro': (0.55, 0.65, None, 0.0, False),
    'oro': (0.35, 0.9, None, 0.0, False),
    'cera': (0.45, 0.0, None, 0.0, False),
    'tela': (0.95, 0.0, None, 0.0, True),
    'musgo': (0.95, 0.0, None, 0.0, True),
    'agua': (0.08, 0.0, None, 0.0, False),
    'sangre': (0.18, 0.0, None, 0.0, False),
    'fuego': (0.6, 0.0, '#FF9A30', 2.2, False),
    'brasa': (0.8, 0.0, '#FF4A12', 1.6, False),
    'lava': (0.5, 0.0, '#FF5A14', 1.4, False),
    'cristal_sangre': (0.18, 0.0, '#FF1A2E', 0.6, False),
    'hierro_negro': (0.35, 0.8, '#5A6CFF', 0.12, False),
    'oro_veta': (0.3, 0.95, '#FFB830', 0.35, False),
    'alma': (0.3, 0.0, '#7FC8FF', 1.2, False),
    'hongo': (0.6, 0.0, '#7CFFC0', 0.55, False),
    'vidrio_luz': (0.2, 0.0, '#FFB050', 1.4, False),
    'vitral_rojo': (0.25, 0.0, '#FF2A1A', 0.9, False),
    'vitral_azul': (0.25, 0.0, '#2A5CFF', 0.9, False),
    'vitral_ambar': (0.25, 0.0, '#FFA51A', 0.9, False),
    'vitral_verde': (0.25, 0.0, '#2AFF6A', 0.7, False),
}


def material(nombre):
    m = bpy.data.materials.get(nombre)
    if m is not None:
        return m
    rough, metal, emi, fuerza, fieltro = MATERIALES[nombre]
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if emi:
        bsdf.inputs['Emission Color'].default_value = clay.rgb(emi)
        bsdf.inputs['Emission Strength'].default_value = fuerza
    if fieltro:
        m['fieltro'] = 1
    m['relieve'] = 1
    # Vista previa en Blender: el color de los vértices como color base
    nt = m.node_tree
    ca = nt.nodes.new('ShaderNodeVertexColor')
    ca.layer_name = 'Color'
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    a = [s for s in mix.inputs if s.identifier == 'A_Color'][0]
    b = [s for s in mix.inputs if s.identifier == 'B_Color'][0]
    a.default_value = (1, 1, 1, 1)
    nt.links.new(ca.outputs['Color'], b)
    out = [s for s in mix.outputs if s.identifier == 'Result_Color'][0]
    nt.links.new(out, bsdf.inputs['Base Color'])
    return m


def material_para_exportar(m):
    """Antes de exportar: base blanca sin enlaces (el exportador saca COLOR_0 de los vértices)."""
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    base = bsdf.inputs['Base Color']
    for l in list(base.links):
        m.node_tree.links.remove(l)
    base.default_value = (1, 1, 1, 1)


# --------------------------------------------------------------------------
# Pintores: (P, N) -> color sRGB (n, 3)
# --------------------------------------------------------------------------

def liso(color):
    c = hx(color) if isinstance(color, str) else np.asarray(color, float)
    return lambda P, N: np.tile(c, (len(P), 1))


def manchado(base, oscuro=None, escala=6.0, fuerza=0.35, grano=0.08, semilla=0):
    """Color con manchas suaves y grano fino."""
    b = hx(base)
    o = hx(oscuro) if oscuro else b * 0.55

    def p(P, N):
        t = np.clip(0.5 + 0.8 * fbm(P, escala, 3, semilla), 0, 1)
        c = mezclar(o, b, 1 - fuerza + fuerza * t)
        return c * (1 + grano * ruido(P, escala * 7, semilla + 5))[:, None]
    return p


def piedra(base='#6E6A62', oscuro='#3A3733', claro=None, musgo='#4E5E30', musgo_cant=0.0, escala=2.5,
           humedad=0.35, alto_humedad=0.35, semilla=0, vetas=0.0, color_vetas='#2A2724', grano=0.1, z0=0.0,
           mancha=None, mancha_cant=0.0):
    """Piedra húmeda: manchas grandes, grano, vetas finas, musgo en lo que mira arriba y humedad abajo."""
    B, O = hx(base), hx(oscuro)
    C = hx(claro) if claro else B * 1.18
    MG = hx(musgo)
    CV = hx(color_vetas)
    MC = hx(mancha) if mancha else None

    def p(P, N):
        n1 = fbm(P, escala, 4, semilla)
        t = np.clip(0.55 + 0.7 * n1, 0, 1)
        col = mezclar(O, B, t)
        col = mezclar(col, C, suave(0.25, 0.7, ruido(P, escala * 3.1, semilla + 3)) * 0.45)
        col = col * (1 + grano * ruido(P, escala * 11, semilla + 9))[:, None]
        if vetas > 0:
            v = np.abs(ruido(P * np.array([1, 1, 2.2]), escala * 1.6, semilla + 21))
            col = mezclar(col, CV, (1 - suave(0.0, 0.07, v)) * vetas)
        if MC is not None and mancha_cant > 0:
            m = suave(0.15, 0.55, fbm(P, escala * 0.8, 3, semilla + 33) + mancha_cant - 0.5)
            col = mezclar(col, MC * (0.85 + 0.15 * ruido(P, 9, semilla + 2))[:, None], m * 0.85)
        if musgo_cant > 0:
            arriba = suave(0.35, 0.85, N[:, 2])
            m = suave(-0.05, 0.25, fbm(P, 3.5, 3, semilla + 7) + musgo_cant - 0.5) * arriba
            mc = MG * (0.75 + 0.35 * np.clip(0.5 + ruido(P, 18, semilla + 8), 0, 1))[:, None]
            col = mezclar(col, mc, m)
        if humedad > 0:
            h = 1 - suave(z0, z0 + alto_humedad, P[:, 2])
            col = col * (1 - humedad * h)[:, None]
        return col
    return p


def madera(base='#5A4030', oscuro='#2E2018', eje=2, escala=1.0, podrida=0.3, musgo=None, semilla=0, quemada=0.0,
           hollin='#151110'):
    """Madera vieja: vetas a lo largo del eje, nudos, podrida o quemada (carbón con brasas apagadas)."""
    B, O, H = hx(base), hx(oscuro), hx(hollin)
    MG = hx(musgo) if musgo else None

    def p(P, N):
        q = P.copy()
        q[:, eje] *= 0.12
        vet = np.sin((q[:, (eje + 1) % 3] + q[:, (eje + 2) % 3]) * 60 * escala + 4 * fbm(q, 3 * escala, 3, semilla))
        t = np.clip(0.55 + 0.35 * vet + 0.25 * fbm(P, 4 * escala, 3, semilla + 1), 0, 1)
        col = mezclar(O, B, t)
        col = col * (1 + 0.1 * ruido(P, 30, semilla + 4))[:, None]
        if podrida > 0:
            m = suave(0.1, 0.5, fbm(P, 2.5, 3, semilla + 6) + podrida - 0.5)
            col = mezclar(col, col * np.array([0.6, 0.65, 0.5]), m)
        if MG is not None:
            m = suave(0.4, 0.9, N[:, 2]) * suave(0.0, 0.3, fbm(P, 4, 3, semilla + 7))
            col = mezclar(col, MG, m)
        if quemada > 0:
            m = np.clip(suave(-0.2, 0.3, fbm(P, 3, 4, semilla + 9) + quemada - 0.5), 0, 1)
            col = mezclar(col, H * (1 + 0.6 * np.clip(ruido(P, 22, semilla + 3), 0, 1))[:, None], m)
        return col
    return p


def metal(base='#3C3A38', oxido='#6A3A1E', cant=0.45, escala=5.0, semilla=0, brillo='#8A8580'):
    """Hierro gastado: óxido en manchas y en lo que mira abajo, bordes con brillo."""
    B, OX, BR = hx(base), hx(oxido), hx(brillo)

    def p(P, N):
        col = mezclar(B * 0.8, B * 1.15, np.clip(0.5 + 0.6 * ruido(P, escala * 2, semilla), 0, 1))
        m = suave(0.0, 0.35, fbm(P, escala, 4, semilla + 1) + cant - 0.5 + 0.2 * (1 - N[:, 2]) * 0.5)
        ox = OX * (0.8 + 0.4 * np.clip(0.5 + ruido(P, escala * 5, semilla + 2), 0, 1))[:, None]
        col = mezclar(col, ox, m)
        col = mezclar(col, BR, suave(0.55, 0.9, ruido(P, escala * 3, semilla + 3)) * 0.25 * (1 - m))
        return col
    return p


def hueso(base='#C9BA98', oscuro='#6E604A', semilla=0, sucio=0.45):
    B, O = hx(base), hx(oscuro)

    def p(P, N):
        t = np.clip(0.6 + 0.6 * fbm(P, 9, 3, semilla), 0, 1)
        col = mezclar(O, B, 1 - sucio + sucio * t)
        # tierra en lo de abajo
        col = col * (0.75 + 0.25 * suave(-0.6, 0.4, N[:, 2]))[:, None]
        return col * (1 + 0.06 * ruido(P, 40, semilla + 1))[:, None]
    return p


def cera(base='#D8C8A8', punta='#F0E4C8', semilla=0):
    B, T = hx(base), hx(punta)

    def p(P, N):
        t = suave(-0.2, 0.9, N[:, 2])
        col = mezclar(B * 0.85, T, t * 0.7)
        return col * (1 + 0.05 * ruido(P, 30, semilla))[:, None]
    return p


def degradado_z(abajo, arriba, z0, z1, ruido_amp=0.08, semilla=0):
    A, B = hx(abajo), hx(arriba)

    def p(P, N):
        t = suave(z0, z1, P[:, 2] + ruido_amp * ruido(P, 6, semilla))
        return mezclar(A, B, t)
    return p


def combinar(pintor, f_mascara, otro):
    """Mezcla otro pintor donde f_mascara(P, N) -> [0,1]."""
    def p(P, N):
        return mezclar(pintor(P, N), otro(P, N), np.clip(f_mascara(P, N), 0, 1))
    return p


def oscurecer_abajo(pintor, z0=0.0, z1=0.3, cant=0.4):
    def p(P, N):
        return pintor(P, N) * (1 - cant * (1 - suave(z0, z1, P[:, 2])))[:, None]
    return p


# --------------------------------------------------------------------------
# La pieza
# --------------------------------------------------------------------------

class Pieza:
    """Una pieza del contrato (piso_*, pared_*, veta_*, deco_*, luz_*) armada por partes."""

    def __init__(self, nombre, tipo, **extras):
        self.nombre = nombre
        self.partes = []
        self.vacios = []
        self.extras = dict(tipo=tipo, **extras)
        self.ao = dict(rayos=12, dist=0.35, fuerza=0.75, suelo=True)
        # Bordes gastados: lo convexo se aclara y lo cóncavo se oscurece (se lee la forma aun con poca luz)
        self.bordes = dict(claro=0.35, oscuro=0.25, escala=2.5)
        # Bloques de pared: en la franja del techo que toca al vecino no se hornean bordes ni oclusión (las dos
        # superficies casi coinciden ahí y deben verse idénticas gane la que gane la profundidad)
        self.franja_techo = tipo in ('pared', 'veta')

    def parte(self, V, F, mat, pintor, ao=True, brillo=1.0):
        """Agrega una malla con su material y su pintor (ao=False para lo que brilla)."""
        V = np.asarray(V, float)
        F = np.asarray(F, np.int64)
        if len(F) == 0:
            return self
        self.partes.append(dict(V=V, F=F, mat=mat, pintor=pintor, ao=ao, brillo=brillo))
        return self

    def sdf(self, f, bmin, bmax, voxel, tris, mat, pintor, suavizar=1, ao=True):
        V, F = malla_sdf(f, bmin, bmax, voxel, tris, suavizar)
        return self.parte(V, F, mat, pintor, ao)

    def vacio(self, nombre, pos):
        self.vacios.append((nombre, tuple(map(float, pos))))
        return self

    def llama(self, pos, tam=1.0):
        """Vacío `llama` + la flama (malla de material `fuego`, el juego la puede hacer titilar)."""
        self.vacio('llama', pos)
        V, F = torno_m([(0.0, -0.02), (0.022, 0.0), (0.03, 0.03), (0.024, 0.06), (0.012, 0.09), (0.0, 0.115)], seg=7)
        V = V * tam
        V[:, 2] += 0
        self.parte(transformar(V, (pos[0], pos[1], pos[2] - 0.04 * tam)), F, 'fuego',
                   degradado_z('#E0480C', '#FFD27A', pos[2] - 0.04 * tam, pos[2] + 0.07 * tam), ao=False)
        return self

    def tris(self):
        return int(sum(len(p['F']) for p in self.partes))

    def construir(self, coll):
        mats = []
        Vs, Fs, Cs, MI = [], [], [], []
        base = 0
        for p in self.partes:
            V, F = p['V'], p['F']
            N = normales(V, F)
            C = np.asarray(p['pintor'](V, N), float).reshape(-1, 3) * p['brillo']
            if p['mat'] not in mats:
                mats.append(p['mat'])
            Vs.append(V)
            Fs.append(F + base)
            Cs.append(C)
            MI.append(np.full(len(F), mats.index(p['mat'])))
            base += len(V)
        V = np.concatenate(Vs)
        F = np.concatenate(Fs)
        C = np.concatenate(Cs)
        conao = np.concatenate([np.full(len(p['V']), p['ao']) for p in self.partes])
        efecto = np.ones(len(V))
        if self.franja_techo:
            Nf = normales(V, F)
            cheb = np.maximum(np.abs(V[:, 0]), np.abs(V[:, 1]))
            efecto = 1 - suave(0.4, 0.47, cheb) * suave(0.2, 0.5, Nf[:, 2]) * suave(1.1, 1.3, V[:, 2])
        if self.ao and self.ao.get('fuerza', 0) > 0:
            N = normales(V, F)
            ao = oclusion(V, N, F, self.ao['rayos'], self.ao['dist'], self.ao['suelo'])
            k = 1 - self.ao['fuerza'] * (1 - ao) * efecto
            C = np.where(conao[:, None], C * k[:, None], C)
        if self.bordes and self.bordes.get('claro', 0) + self.bordes.get('oscuro', 0) > 0:
            cv = convexidad(V, F, normales(V, F)) * self.bordes.get('escala', 2.5)
            k = 1 + efecto * np.where(cv > 0, self.bordes['claro'] * np.clip(cv, 0, 1), self.bordes['oscuro'] * np.clip(cv, -1, 0))
            C = np.where(conao[:, None], C * k[:, None], C)
        lin = a_lineal(C)
        me = bpy.data.meshes.new(self.nombre + '_malla')
        me.from_pydata(V.tolist(), [], F.tolist())
        me.validate(clean_customdata=False)
        me.update()
        if len(me.vertices) != len(V):
            raise RuntimeError(f'{self.nombre}: la validación cambió los vértices')
        MI_ok = np.concatenate(MI).astype(np.int32)
        if len(me.polygons) != len(MI_ok):
            # se quitaron caras degeneradas: material por cara según el centro (búsqueda por índices de vértices)
            claves = {tuple(sorted(f)): m for f, m in zip(F.tolist(), MI_ok.tolist())}
            MI_ok = np.array([claves.get(tuple(sorted(p.vertices)), 0) for p in me.polygons], np.int32)
        for m in mats:
            me.materials.append(material(m))
        me.polygons.foreach_set('material_index', MI_ok)
        attr = me.color_attributes.new('Color', 'FLOAT_COLOR', 'POINT')
        rgba = np.concatenate([lin, np.ones((len(lin), 1))], 1).astype(np.float32)
        attr.data.foreach_set('color', rgba.ravel())
        try:
            me.color_attributes.active_color = attr
            me.color_attributes.render_color_index = me.color_attributes.find('Color')
        except Exception:
            pass
        me.shade_smooth()
        me.update()
        raiz = bpy.data.objects.new(self.nombre, None)
        clay.link(raiz, coll)
        obj = bpy.data.objects.new(self.nombre + '_malla', me)
        clay.link(obj, coll)
        obj.parent = raiz
        for k, v in self.extras.items():
            raiz[k] = v
        raiz['tris'] = len(F)
        for nombre, pos in self.vacios:
            e = bpy.data.objects.new(nombre, None)
            e.empty_display_size = 0.05
            clay.link(e, coll)
            e.parent = raiz
            e.location = pos
        return raiz


def convexidad(V, F, N, pasadas=1):
    """> 0 en lo convexo (aristas, crestas), < 0 en lo cóncavo (grietas, juntas), relativo al largo de las aristas."""
    E = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    E = np.concatenate([E, E[:, ::-1]])
    S = np.zeros_like(V)
    cnt = np.zeros(len(V))
    np.add.at(S, E[:, 0], V[E[:, 1]])
    np.add.at(cnt, E[:, 0], 1)
    largo = np.zeros(len(V))
    np.add.at(largo, E[:, 0], np.linalg.norm(V[E[:, 1]] - V[E[:, 0]], axis=1))
    cnt = np.maximum(cnt, 1)
    L = S / cnt[:, None] - V
    cv = -(L * N).sum(1) / np.maximum(largo / cnt, 1e-6)
    for _ in range(pasadas):
        acc = np.zeros(len(V))
        np.add.at(acc, E[:, 0], cv[E[:, 1]])
        cv = 0.5 * cv + 0.5 * acc / cnt
    return cv


def _hemisferio(n):
    """Direcciones en un hemisferio (+z), repartidas por coseno."""
    out = []
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        z = math.sqrt(1 - (i + 0.5) / n)
        r = math.sqrt(1 - z * z)
        a = i * ga
        out.append((r * math.cos(a), r * math.sin(a), z))
    return np.array(out)


def oclusion(V, N, F, rayos=12, dist=0.35, suelo=True):
    """Oclusión ambiental por vértice (1 = abierto): rayos contra la misma pieza y contra el piso z = 0."""
    bvh = BVHTree.FromPolygons([Vector(v) for v in V], F.tolist(), all_triangles=True)
    H = _hemisferio(rayos)
    ao = np.ones(len(V))
    for i in range(len(V)):
        n = N[i]
        if not np.isfinite(n).all() or np.linalg.norm(n) < 0.5:
            continue
        t1 = np.cross(n, (0, 0, 1.0)) if abs(n[2]) < 0.9 else np.cross(n, (1.0, 0, 0))
        t1 /= np.linalg.norm(t1)
        t2 = np.cross(n, t1)
        D = H[:, 0:1] * t1 + H[:, 1:2] * t2 + H[:, 2:3] * n
        o = V[i] + n * 0.004
        golpes = 0
        ov = Vector(o)
        for d in D:
            if suelo and d[2] < -1e-3 and o[2] > -0.01:
                tz = -o[2] / d[2]
                if tz < dist:
                    golpes += 1
                    continue
            if bvh.ray_cast(ov, Vector(d), dist)[0] is not None:
                golpes += 1
        ao[i] = 1 - golpes / len(D)
    return ao


# --------------------------------------------------------------------------
# Exportación
# --------------------------------------------------------------------------

def arbol(root):
    pila, out = [root], []
    while pila:
        o = pila.pop()
        out.append(o)
        pila.extend(o.children)
    return out


def exportar(raices, ruta):
    for m in bpy.data.materials:
        if m.use_nodes and m.name in MATERIALES:
            material_para_exportar(m)
    objs = [o for r in raices for o in arbol(r)]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(filepath=ruta, export_format='GLB', use_selection=True, export_apply=True,
                              export_yup=True, export_extras=True, export_colors=True, export_animations=False,
                              export_skins=False, export_morph=False, export_cameras=False, export_lights=False,
                              export_normals=True, export_texcoords=False)
    print('GLB', ruta, round(__import__('os').path.getsize(ruta) / 1e6, 2), 'MB', flush=True)
