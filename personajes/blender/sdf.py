"""Modelado por campos de distancia (SDF) para formas orgánicas tipo plastilina.

Cada forma es una función f(P) -> distancia (P es un arreglo Nx3). Las uniones
suaves (smin) funden las piezas como si se hubieran modelado a mano, y la malla
final se extrae con marching cubes.
"""
import bmesh
import numpy as np
from skimage.measure import marching_cubes

import clay


# --------------------------------------------------------------------------
# Primitivas
# --------------------------------------------------------------------------

def _len(v):
    return np.sqrt((v * v).sum(-1))


def sphere(c, r):
    c = np.asarray(c, float)
    return lambda P: _len(P - c) - r


def ellipsoid(c, r):
    c = np.asarray(c, float)
    r = np.asarray(r, float)

    def f(P):
        p = P - c
        k0 = _len(p / r)
        k1 = _len(p / (r * r))
        return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)
    return f


def round_box(c, half, r, rot=None):
    c = np.asarray(c, float)
    b = np.asarray(half, float)

    def f(P):
        p = P - c
        if rot is not None:
            p = p @ np.asarray(rot, float)
        q = np.abs(p) - b + r
        return _len(np.maximum(q, 0.0)) + np.minimum(np.max(q, axis=-1), 0.0) - r
    return f


def round_cone(a, b, r1, r2):
    """Cono redondeado (cápsula de radio variable) entre a y b."""
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    ba = b - a
    l2 = float(ba @ ba)
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2

    def f(P):
        pa = P - a
        y = pa @ ba
        z = y - l2
        w = pa * l2 - np.outer(y, ba)
        x2 = (w * w).sum(-1)
        y2 = y * y * l2
        z2 = z * z * l2
        k = np.sign(rr) * rr * rr * x2
        d_end = np.sqrt(x2 + z2) * il2 - r2
        d_start = np.sqrt(x2 + y2) * il2 - r1
        d_mid = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
        return np.where(np.sign(z) * a2 * z2 > k, d_end, np.where(np.sign(y) * a2 * y2 < k, d_start, d_mid))
    return f


def capsule(a, b, r):
    return round_cone(a, b, r, r)


def stroke(points, radii, samples=6):
    """Trazo suave (cadena de conos redondeados) a lo largo de una curva Catmull-Rom."""
    pts, params = clay.catmull_rom(points, samples)
    n = len(points)
    if np.isscalar(radii):
        rad = np.full(len(pts), float(radii))
    else:
        xs = np.linspace(0, n - 1, len(radii))
        rad = np.interp(params, xs, radii)
    segs = [round_cone(pts[i], pts[i + 1], rad[i], rad[i + 1]) for i in range(len(pts) - 1)
            if np.linalg.norm(pts[i + 1] - pts[i]) > 1e-6]

    def f(P):
        d = segs[0](P)
        for s in segs[1:]:
            d = np.minimum(d, s(P))
        return d
    return f


def plane(o, n):
    o = np.asarray(o, float)
    n = np.asarray(n, float)
    n = n / np.linalg.norm(n)
    return lambda P: (P - o) @ n


def ellipse_cylinder_z(c, rx, ry, z0, z1, rounding):
    """Pastilla elíptica vertical con bordes redondeados (suelas)."""
    c = np.asarray(c, float)

    def f(P):
        p = P - c
        k0 = np.sqrt((p[:, 0] / rx) ** 2 + (p[:, 1] / ry) ** 2)
        k1 = np.sqrt((p[:, 0] / rx ** 2) ** 2 + (p[:, 1] / ry ** 2) ** 2)
        d2 = k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)
        zc = (z0 + z1) / 2
        dz = np.abs(P[:, 2] - zc) - (z1 - z0) / 2
        q = np.stack([d2 + rounding, dz + rounding], 1)
        return _len(np.maximum(q, 0)) + np.minimum(np.max(q, 1), 0) - rounding
    return f


# --------------------------------------------------------------------------
# Operaciones
# --------------------------------------------------------------------------

def smin(a, b, k):
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


def union(*fs, k=0.0):
    def f(P):
        d = fs[0](P)
        for g in fs[1:]:
            d = smin(d, g(P), k) if k > 0 else np.minimum(d, g(P))
        return d
    return f


def subtract(a, b, k=0.0):
    return lambda P: smax(a(P), -b(P), k) if k > 0 else np.maximum(a(P), -b(P))


def intersect(a, b, k=0.0):
    return lambda P: smax(a(P), b(P), k) if k > 0 else np.maximum(a(P), b(P))


def taper_x(f, z_center, amount):
    """Ensancha en X hacia abajo (amount>0) respecto a z_center."""
    def g(P):
        s = 1.0 + amount * (z_center - P[:, 2])
        Q = P.copy()
        Q[:, 0] = Q[:, 0] / s
        return f(Q) * np.minimum(s, 1.0)
    return g


# --------------------------------------------------------------------------
# Consultas
# --------------------------------------------------------------------------

def trace(f, origins, direction, max_dist=4.0, steps=200):
    """Trazado de esferas: primer punto de la superficie desde cada origen."""
    O = np.atleast_2d(np.asarray(origins, float))
    d = np.asarray(direction, float)
    d = d / np.linalg.norm(d)
    t = np.zeros(len(O))
    hit = np.zeros(len(O), bool)
    for _ in range(steps):
        P = O + np.outer(t, d)
        dist = f(P)
        hit |= dist < 1e-4
        t = np.where(hit, t, t + np.maximum(dist * 0.9, 1e-4))
        if hit.all() or (t > max_dist).all():
            break
    return O + np.outer(t, d), hit


def normal(f, P, eps=1e-4):
    P = np.atleast_2d(P)
    g = np.zeros_like(P)
    for i in range(3):
        e = np.zeros(3)
        e[i] = eps
        g[:, i] = f(P + e) - f(P - e)
    return g / np.maximum(_len(g), 1e-9)[:, None]


def front_points(f, xz, lift=0.0, y0=-3.0):
    """Proyecta puntos (x, z) sobre la superficie vista de frente (-Y)."""
    O = np.array([[x, y0, z] for x, z in xz])
    P, hit = trace(f, O, (0, 1, 0), max_dist=6.0)
    if lift:
        P = P + normal(f, P) * lift
    return [p for p, h in zip(P, hit) if h]


def ring_points(f, center, axis, radius_out, n=24, lift=0.0):
    """Anillo alrededor de un eje: traza desde fuera hacia el eje (dobladillos, puños)."""
    c = np.asarray(center, float)
    ax = np.asarray(axis, float)
    ax = ax / np.linalg.norm(ax)
    t1 = np.cross(ax, [0, 0, 1.0]) if abs(ax[2]) < 0.9 else np.cross(ax, [1.0, 0, 0])
    t1 /= np.linalg.norm(t1)
    t2 = np.cross(ax, t1)
    out = []
    for k in range(n):
        a = 2 * np.pi * k / n
        d = np.cos(a) * t1 + np.sin(a) * t2
        P, hit = trace(f, [c + d * radius_out], -d, max_dist=radius_out)
        if hit[0]:
            p = P[0]
            if lift:
                p = p + normal(f, p[None])[0] * lift
            out.append(p)
    return out


# --------------------------------------------------------------------------
# Malla
# --------------------------------------------------------------------------

def to_mesh(name, f, bmin, bmax, voxel=0.006, coll=None, material=None, smooth=2, chunk=400000):
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
    verts, faces, _, _ = marching_cubes(vol, 0.0, spacing=(voxel, voxel, voxel))
    verts = verts + bmin
    obj = clay.make_mesh_object(name, verts, faces, coll, smooth=True, material=material)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.shade_smooth()
    if smooth:
        m = obj.modifiers.new('Suavizado', 'SMOOTH')
        m.factor = 0.5
        m.iterations = smooth
    return obj
