"""Herramientas de modelado procedural estilo plastilina para Blender 4.2+ / 5.x.

Todo se construye desde código para que los personajes se puedan regenerar,
ajustar por parámetros y exportar sin pasos manuales.
Convenciones: Z arriba, los personajes miran hacia -Y, unidades de Blender.
"""
import math

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree


# --------------------------------------------------------------------------
# Color
# --------------------------------------------------------------------------

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb(hex_str, alpha=1.0):
    """'#RRGGBB' -> tupla lineal RGBA para nodos de Blender."""
    h = hex_str.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in range(0, 6, 2))
    return (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), alpha)


# --------------------------------------------------------------------------
# Escena y colecciones
# --------------------------------------------------------------------------

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    return scene


def collection(name, parent=None):
    coll = bpy.data.collections.get(name)
    if coll is None:
        coll = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(coll)
    return coll


def link(obj, coll=None):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


# --------------------------------------------------------------------------
# Mallas
# --------------------------------------------------------------------------

def make_mesh_object(name, verts, faces, coll=None, smooth=True, material=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(map(float, v)) for v in verts], [], [tuple(map(int, f)) for f in faces])
    me.validate(clean_customdata=False)
    me.update()
    if smooth:
        me.shade_smooth()
    obj = bpy.data.objects.new(name, me)
    link(obj, coll)
    if material is not None:
        set_material(obj, material)
    return obj


def set_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj


def add_subsurf(obj, levels=1, render_levels=2):
    m = obj.modifiers.new('Subdivision', 'SUBSURF')
    m.levels = levels
    m.render_levels = render_levels
    m.quality = 3
    return m


def add_solidify(obj, thickness=0.02, offset=1.0, even=True):
    m = obj.modifiers.new('Grosor', 'SOLIDIFY')
    m.thickness = thickness
    m.offset = offset
    m.use_even_offset = even
    m.use_quality_normals = True
    return m


def add_bevel(obj, width=0.02, segments=3):
    m = obj.modifiers.new('Bisel', 'BEVEL')
    m.width = width
    m.segments = segments
    m.limit_method = 'ANGLE'
    return m


def apply_modifiers(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return obj


def quad_sphere(n=12):
    """Esfera a partir de un cubo subdividido (topología limpia en quads).

    Devuelve (verts Nx3 numpy, faces lista de quads) sobre la esfera unidad.
    """
    verts = []
    index = {}
    faces = []

    def vid(p):
        key = tuple(np.round(p, 6))
        if key not in index:
            index[key] = len(verts)
            verts.append(p)
        return index[key]

    g = np.linspace(-1.0, 1.0, n + 1)
    axes = [
        (np.array([1, 0, 0]), np.array([0, 1, 0]), np.array([0, 0, 1])),
        (np.array([-1, 0, 0]), np.array([0, 0, 1]), np.array([0, 1, 0])),
        (np.array([0, 1, 0]), np.array([0, 0, 1]), np.array([1, 0, 0])),
        (np.array([0, -1, 0]), np.array([1, 0, 0]), np.array([0, 0, 1])),
        (np.array([0, 0, 1]), np.array([1, 0, 0]), np.array([0, 1, 0])),
        (np.array([0, 0, -1]), np.array([0, 1, 0]), np.array([1, 0, 0])),
    ]
    for normal, u_ax, v_ax in axes:
        ids = [[vid(normal + u_ax * g[i] + v_ax * g[j]) for j in range(n + 1)] for i in range(n + 1)]
        for i in range(n):
            for j in range(n):
                faces.append((ids[i][j], ids[i + 1][j], ids[i + 1][j + 1], ids[i][j + 1]))
    v = np.array(verts, dtype=float)
    # Proyección "spherified cube" para una distribución uniforme.
    x, y, z = v[:, 0], v[:, 1], v[:, 2]
    sx = x * np.sqrt(1 - y * y / 2 - z * z / 2 + y * y * z * z / 3)
    sy = y * np.sqrt(1 - z * z / 2 - x * x / 2 + z * z * x * x / 3)
    sz = z * np.sqrt(1 - x * x / 2 - y * y / 2 + x * x * y * y / 3)
    v = np.stack([sx, sy, sz], axis=1)
    # Asegurar normales hacia fuera.
    fixed = []
    for f in faces:
        a, b, c = v[f[0]], v[f[1]], v[f[2]]
        nrm = np.cross(b - a, c - a)
        center = v[list(f)].mean(axis=0)
        fixed.append(f if np.dot(nrm, center) > 0 else tuple(reversed(f)))
    return v, fixed


def superellipsoid_dirs(v, p=2.0, pz=None):
    """Lleva puntos de la esfera unidad a una superelipsoide (p>2 = más cuadrada)."""
    pz = pz or p
    ax = np.abs(v)
    r = (ax[:, 0] ** p + ax[:, 1] ** p + ax[:, 2] ** pz) ** (1.0 / p)
    return v / r[:, None]


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def blob(name, center, radii, coll=None, material=None, n=10, p=2.0, shaper=None, subsurf=1):
    """Elipsoide / superelipsoide deformable (la pieza base de la plastilina)."""
    v, f = quad_sphere(n)
    if p != 2.0:
        v = superellipsoid_dirs(v, p)
    v = v * np.array(radii)
    if shaper is not None:
        v = shaper(v)
    v = v + np.array(center)
    obj = make_mesh_object(name, v, f, coll, material=material)
    if subsurf:
        add_subsurf(obj, subsurf, subsurf + 1)
    return obj


# --------------------------------------------------------------------------
# Barridos (tubos, mechones, cejas, costuras)
# --------------------------------------------------------------------------

def catmull_rom(points, samples=8, closed=False, alpha=0.5):
    P = [np.array(p, dtype=float) for p in points]
    if closed:
        P = [P[-1]] + P + [P[0], P[1]]
    else:
        P = [2 * P[0] - P[1]] + P + [2 * P[-1] - P[-2]]
    out = []
    params = []
    nseg = len(P) - 3
    for s in range(nseg):
        p0, p1, p2, p3 = P[s:s + 4]

        def tj(ti, a, b):
            return ti + max(np.linalg.norm(b - a), 1e-6) ** alpha

        t0 = 0.0
        t1 = tj(t0, p0, p1)
        t2 = tj(t1, p1, p2)
        t3 = tj(t2, p2, p3)
        last = s == nseg - 1 and not closed
        count = samples + (1 if last else 0)
        for k in range(count):
            t = t1 + (t2 - t1) * k / samples
            a1 = (t1 - t) / (t1 - t0) * p0 + (t - t0) / (t1 - t0) * p1
            a2 = (t2 - t) / (t2 - t1) * p1 + (t - t1) / (t2 - t1) * p2
            a3 = (t3 - t) / (t3 - t2) * p2 + (t - t2) / (t3 - t2) * p3
            b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2
            b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3
            c = (t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2
            out.append(c)
            params.append(s + k / samples)
    return np.array(out), np.array(params)


def _interp(values, u, count):
    """Interpola una lista de valores por punto de control en el parámetro u."""
    if callable(values):
        return values
    vals = list(values) if isinstance(values, (list, tuple)) else [values] * count
    if len(vals) == 1:
        vals = vals * count
    xs = np.linspace(0, count - 1, len(vals))
    return lambda t: float(np.interp(t * (count - 1), xs, vals))


def sweep(name, points, radius=0.05, profile=(1.0, 1.0), coll=None, material=None,
          segments=12, samples=8, closed=False, caps=('round', 'round'), up=(0, 0, 1),
          twist=0.0, flat_bottom=1.0, cap_len=1.0, subsurf=1, profile_fn=None, up_fn=None):
    """Tubo suave a lo largo de una curva Catmull-Rom.

    radius, profile y twist aceptan un valor, una lista por punto de control o
    una función f(t) con t en [0,1] a lo largo del recorrido.
    profile=(ancho, grosor) escala la sección elíptica en los ejes normal/binormal.
    caps: 'round' (semiesfera), 'point' (punta), 'flat' o None.
    flat_bottom<1 aplana el lado -normal de la sección (p. ej. la cara que toca la cabeza).
    up_fn(p) -> vector: si se da, la normal de cada anillo se alinea con up_fn(p)
    en lugar de transportarse en paralelo (útil para mechones sobre la cabeza).
    """
    pts, params = catmull_rom(points, samples, closed)
    count = len(points)
    total = params[-1] if not closed else count
    tnorm = params / max(total, 1e-6)

    r_fn = _interp(radius, 0, count)
    if callable(profile):
        p_fn = profile
    else:
        prof = profile if isinstance(profile[0], (list, tuple)) else [profile]
        pw = _interp([p[0] for p in prof], 0, count)
        pt = _interp([p[1] for p in prof], 0, count)
        p_fn = lambda t: (pw(t), pt(t))
    tw_fn = _interp(twist, 0, count)

    n = len(pts)
    tangents = []
    for i in range(n):
        if closed:
            d = pts[(i + 1) % n] - pts[(i - 1) % n]
        else:
            d = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]
        d = d / max(np.linalg.norm(d), 1e-9)
        tangents.append(d)
    up = np.array(up, dtype=float)
    T0 = tangents[0]
    N0 = up - np.dot(up, T0) * T0
    if np.linalg.norm(N0) < 1e-5:
        N0 = np.cross(T0, [1, 0, 0])
        if np.linalg.norm(N0) < 1e-5:
            N0 = np.cross(T0, [0, 1, 0])
    N0 /= np.linalg.norm(N0)
    normals = [N0]
    for i in range(1, n):
        a, b = Vector(tangents[i - 1]), Vector(tangents[i])
        q = a.rotation_difference(b)
        nv = q @ Vector(normals[-1])
        nv = np.array(nv)
        nv -= np.dot(nv, tangents[i]) * tangents[i]
        nv /= max(np.linalg.norm(nv), 1e-9)
        normals.append(nv)
    if up_fn is not None:
        for i in range(n):
            u = np.array(up_fn(pts[i]), dtype=float)
            u -= np.dot(u, tangents[i]) * tangents[i]
            if np.linalg.norm(u) > 1e-6:
                normals[i] = u / np.linalg.norm(u)

    ring_angles = np.linspace(0, 2 * np.pi, segments, endpoint=False)

    def ring(center, T, N, r, prof, tw):
        B = np.cross(T, N)
        c, s = math.cos(tw), math.sin(tw)
        N2 = c * N + s * B
        B2 = -s * N + c * B
        out = []
        for a in ring_angles:
            if profile_fn is not None:
                u, v = profile_fn(a)
            else:
                u, v = math.cos(a), math.sin(a)
                if u < 0:
                    u *= flat_bottom
            out.append(center + N2 * (u * r * prof[0]) + B2 * (v * r * prof[1]))
        return out

    verts = []
    rings = []
    for i in range(n):
        t = tnorm[i]
        r = max(r_fn(t), 0.0)
        rings.append(ring(pts[i], tangents[i], normals[i], r, p_fn(t), tw_fn(t)))

    faces = []
    start_pole = end_pole = None
    ring_ids = []
    # Tapa inicial redondeada
    cap_start, cap_end = (caps if isinstance(caps, (list, tuple)) else (caps, caps))
    pre_rings = []
    if not closed and cap_start == 'round':
        r0 = max(r_fn(0.0), 1e-5)
        steps = 4
        for k in range(steps, 0, -1):
            phi = k / (steps + 1) * math.pi / 2
            off = -tangents[0] * r0 * math.sin(phi) * cap_len * p_fn(0.0)[1]
            pre_rings.append(ring(pts[0] + off, tangents[0], normals[0], r0 * math.cos(phi), p_fn(0.0), tw_fn(0.0)))
    all_rings = pre_rings + rings
    post_rings = []
    if not closed and cap_end == 'round':
        r1 = max(r_fn(1.0), 1e-5)
        steps = 4
        for k in range(1, steps + 1):
            phi = k / (steps + 1) * math.pi / 2
            off = tangents[-1] * r1 * math.sin(phi) * cap_len * p_fn(1.0)[1]
            post_rings.append(ring(pts[-1] + off, tangents[-1], normals[-1], r1 * math.cos(phi), p_fn(1.0), tw_fn(1.0)))
    all_rings = all_rings + post_rings

    for rg in all_rings:
        ids = []
        for p in rg:
            ids.append(len(verts))
            verts.append(p)
        ring_ids.append(ids)
    m = segments
    face_uvs = []
    nr = len(ring_ids)
    vden = nr if closed else max(nr - 1, 1)
    for a in range(nr - 1):
        r1, r2 = ring_ids[a], ring_ids[a + 1]
        for k in range(m):
            faces.append((r1[k], r1[(k + 1) % m], r2[(k + 1) % m], r2[k]))
            face_uvs.append(((k / m, a / vden), ((k + 1) / m, a / vden), ((k + 1) / m, (a + 1) / vden), (k / m, (a + 1) / vden)))
    if closed:
        r1, r2 = ring_ids[-1], ring_ids[0]
        for k in range(m):
            faces.append((r1[k], r1[(k + 1) % m], r2[(k + 1) % m], r2[k]))
            face_uvs.append(((k / m, (nr - 1) / vden), ((k + 1) / m, (nr - 1) / vden), ((k + 1) / m, 1.0), (k / m, 1.0)))
    else:
        # polos
        first, last = ring_ids[0], ring_ids[-1]
        if cap_start in ('round', 'point', 'flat'):
            if cap_start == 'round':
                r0 = max(r_fn(0.0), 1e-5)
                pole = pts[0] - tangents[0] * r0 * cap_len * p_fn(0.0)[1]
            elif cap_start == 'point':
                pole = pts[0] - tangents[0] * 1e-4
            else:
                pole = np.mean([verts[i] for i in first], axis=0)
            start_pole = len(verts)
            verts.append(pole)
            for k in range(m):
                faces.append((first[(k + 1) % m], first[k], start_pole))
                face_uvs.append((((k + 1) / m, 0.0), (k / m, 0.0), ((k + 0.5) / m, 0.0)))
        if cap_end in ('round', 'point', 'flat'):
            if cap_end == 'round':
                r1 = max(r_fn(1.0), 1e-5)
                pole = pts[-1] + tangents[-1] * r1 * cap_len * p_fn(1.0)[1]
            elif cap_end == 'point':
                pole = pts[-1] + tangents[-1] * 1e-4
            else:
                pole = np.mean([verts[i] for i in last], axis=0)
            end_pole = len(verts)
            verts.append(pole)
            for k in range(m):
                faces.append((last[k], last[(k + 1) % m], end_pole))
                face_uvs.append(((k / m, 1.0), ((k + 1) / m, 1.0), ((k + 0.5) / m, 1.0)))
    obj = make_mesh_object(name, verts, faces, coll, material=material)
    # UV: u alrededor de la sección, v a lo largo del recorrido (para hebras de cabello).
    uv = obj.data.uv_layers.new(name='UVMap')
    li = 0
    for poly, fuv in zip(obj.data.polygons, face_uvs):
        for j, loop_index in enumerate(poly.loop_indices):
            uv.data[loop_index].uv = fuv[j]
    # Orientar normales hacia fuera de forma robusta.
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.shade_smooth()
    if subsurf:
        add_subsurf(obj, subsurf, subsurf + 1)
    return obj


# --------------------------------------------------------------------------
# Superficies: proyectar rasgos sobre la cabeza / el cuerpo
# --------------------------------------------------------------------------

class Surface:
    """BVH del objeto evaluado (con modificadores) en coordenadas de mundo."""

    def __init__(self, objs):
        if not isinstance(objs, (list, tuple)):
            objs = [objs]
        dg = bpy.context.evaluated_depsgraph_get()
        verts, polys = [], []
        for obj in objs:
            ev = obj.evaluated_get(dg)
            me = ev.to_mesh()
            mw = obj.matrix_world
            base = len(verts)
            verts.extend([mw @ v.co for v in me.vertices])
            polys.extend([[base + i for i in p.vertices] for p in me.polygons])
            ev.to_mesh_clear()
        self.bvh = BVHTree.FromPolygons(verts, polys)

    def ray(self, origin, direction, dist=100.0):
        loc, nrm, idx, d = self.bvh.ray_cast(Vector(origin), Vector(direction).normalized(), dist)
        if loc is None:
            return None, None
        return np.array(loc), np.array(nrm)

    def front(self, x, z, y0=-20.0):
        """Primer punto de la superficie visto desde el frente (-Y)."""
        return self.ray((x, y0, z), (0, 1, 0))

    def radial(self, center, direction, lift=0.0):
        """Punto exterior de la superficie en la dirección dada desde center."""
        d = np.array(direction, dtype=float)
        d /= np.linalg.norm(d)
        origin = np.array(center) + d * 20.0
        loc, nrm = self.ray(origin, -d)
        if loc is None:
            return None, None
        return loc + nrm * lift, nrm

    def nearest(self, p):
        loc, nrm, idx, d = self.bvh.find_nearest(Vector(p))
        return np.array(loc), np.array(nrm)


def front_stroke(surf, pts2d, lift=0.0):
    """Proyecta puntos (x, z) sobre la superficie vista de frente; omite los que fallan."""
    out = []
    for x, z in pts2d:
        loc, nrm = surf.front(x, z)
        if loc is not None:
            out.append(loc + nrm * lift)
    return out


def surface_ring(surf, center, z, n=24, offset=0.0):
    """Anillo que abraza una superficie a la altura z (dobladillos, pretinas, puños)."""
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        d = np.array([math.cos(a), math.sin(a), 0.0])
        origin = np.array([center[0], center[1], z]) + d * 6.0
        loc, nrm = surf.ray(origin, -d)
        if loc is None:
            continue
        pts.append(loc + nrm * offset)
    return pts


def sph(az_deg, el_deg):
    """Dirección desde azimut (0 = frente -Y, +90 = +X) y elevación en grados."""
    az, el = math.radians(az_deg), math.radians(el_deg)
    return np.array([math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)])


def orient_to(obj, normal, up=(0, 0, 1)):
    """Rota obj para que su eje -Y local mire en la dirección 'normal'."""
    n = Vector(normal).normalized()
    fwd = -n
    q = Vector((0, 1, 0)).rotation_difference(fwd)
    # Corregir el giro para mantener Z local lo más vertical posible.
    z_now = q @ Vector((0, 0, 1))
    upv = Vector(up)
    upv = (upv - upv.dot(n) * n).normalized()
    if upv.length > 0:
        ang = z_now.angle(upv)
        axis = z_now.cross(upv)
        if axis.length > 1e-6:
            q = Quaternion(axis.normalized(), ang) @ q
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = q
    return obj


# --------------------------------------------------------------------------
# Materiales
# --------------------------------------------------------------------------

def material(name, color, rough=0.5, sss=0.0, sss_radius=(1.0, 0.45, 0.3), sss_scale=0.04,
             sheen=0.0, sheen_rough=0.4, sheen_tint=None, coat=0.0, coat_rough=0.08,
             spec=0.5, metallic=0.0, emission=None, emission_strength=0.0,
             noise=None, wave=None, ribs=None, strands=None):
    """Principled BSDF con relieve procedural opcional.

    noise=dict(scale, strength, detail, distance) -> grano de plastilina/fieltro
    wave=dict(scale, strength, axis, distortion)  -> mechones / hebras
    ribs=dict(scale, strength, axis)              -> tejido acanalado
    strands=dict(scale, strength, distortion)     -> surcos de mechón a lo largo del UV
    """
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (600, 0)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (300, 0)
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    col = rgb(color) if isinstance(color, str) else color
    bsdf.inputs['Base Color'].default_value = col
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metallic
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = spec
    if sss > 0:
        bsdf.inputs['Subsurface Weight'].default_value = sss
        bsdf.inputs['Subsurface Radius'].default_value = sss_radius
        bsdf.inputs['Subsurface Scale'].default_value = sss_scale
    if sheen > 0:
        bsdf.inputs['Sheen Weight'].default_value = sheen
        bsdf.inputs['Sheen Roughness'].default_value = sheen_rough
        if sheen_tint:
            bsdf.inputs['Sheen Tint'].default_value = rgb(sheen_tint) if isinstance(sheen_tint, str) else sheen_tint
    if coat > 0:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = coat_rough
    if emission:
        bsdf.inputs['Emission Color'].default_value = rgb(emission) if isinstance(emission, str) else emission
        bsdf.inputs['Emission Strength'].default_value = emission_strength

    height_sources = []
    coord = None
    if noise or wave or ribs or strands:
        coord = nt.nodes.new('ShaderNodeTexCoord')
        coord.location = (-900, 0)
    if noise:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.location = (-500, 200)
        tex.inputs['Scale'].default_value = noise.get('scale', 60)
        tex.inputs['Detail'].default_value = noise.get('detail', 8)
        tex.inputs['Roughness'].default_value = noise.get('roughness', 0.6)
        nt.links.new(coord.outputs['Object'], tex.inputs['Vector'])
        height_sources.append((tex.outputs['Fac'], noise.get('strength', 0.2), noise.get('distance', 0.01)))
    if wave:
        mapping = nt.nodes.new('ShaderNodeMapping')
        mapping.location = (-700, -150)
        rot = wave.get('rotation', (0, 0, 0))
        mapping.inputs['Rotation'].default_value = rot
        nt.links.new(coord.outputs['Object'], mapping.inputs['Vector'])
        tex = nt.nodes.new('ShaderNodeTexWave')
        tex.location = (-500, -150)
        tex.wave_type = 'BANDS'
        tex.bands_direction = wave.get('axis', 'Z')
        tex.inputs['Scale'].default_value = wave.get('scale', 20)
        tex.inputs['Distortion'].default_value = wave.get('distortion', 4)
        tex.inputs['Detail'].default_value = 2
        nt.links.new(mapping.outputs['Vector'], tex.inputs['Vector'])
        height_sources.append((tex.outputs['Fac'], wave.get('strength', 0.2), wave.get('distance', 0.01)))
    if ribs:
        tex = nt.nodes.new('ShaderNodeTexWave')
        tex.location = (-500, -400)
        tex.wave_type = 'BANDS'
        tex.bands_direction = ribs.get('axis', 'X')
        tex.wave_profile = 'SIN'
        tex.inputs['Scale'].default_value = ribs.get('scale', 60)
        tex.inputs['Distortion'].default_value = 0.0
        nt.links.new(coord.outputs['Object'], tex.inputs['Vector'])
        height_sources.append((tex.outputs['Fac'], ribs.get('strength', 0.2), ribs.get('distance', 0.005)))

    if strands:
        uvn = nt.nodes.new('ShaderNodeUVMap')
        uvn.location = (-900, -600)
        uvn.uv_map = 'UVMap'
        tex = nt.nodes.new('ShaderNodeTexWave')
        tex.location = (-500, -600)
        tex.wave_type = 'BANDS'
        tex.bands_direction = 'X'
        tex.wave_profile = 'SIN'
        tex.inputs['Scale'].default_value = strands.get('scale', 4)
        tex.inputs['Distortion'].default_value = strands.get('distortion', 0.6)
        tex.inputs['Detail'].default_value = 1.5
        nt.links.new(uvn.outputs['UV'], tex.inputs['Vector'])
        height_sources.append((tex.outputs['Fac'], strands.get('strength', 0.4), strands.get('distance', 0.01)))

    normal_socket = None
    y = 0
    for fac, strength, dist in height_sources:
        bump = nt.nodes.new('ShaderNodeBump')
        bump.location = (50, -300 + y)
        y -= 180
        bump.inputs['Strength'].default_value = strength
        bump.inputs['Distance'].default_value = dist
        nt.links.new(fac, bump.inputs['Height'])
        if normal_socket is not None:
            nt.links.new(normal_socket, bump.inputs['Normal'])
        normal_socket = bump.outputs['Normal']
    if normal_socket is not None:
        nt.links.new(normal_socket, bsdf.inputs['Normal'])
    return m


def game_color(material_obj):
    """Color base (lineal) del material, para exportar versiones ligeras."""
    nt = material_obj.node_tree
    for n in nt.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            return tuple(n.inputs['Base Color'].default_value)
    return (0.8, 0.8, 0.8, 1.0)


# --------------------------------------------------------------------------
# Utilidades de transformación
# --------------------------------------------------------------------------

def mirror_x(points):
    return [(-p[0], p[1], p[2]) for p in points]


def lerp(a, b, t):
    return np.array(a) * (1 - t) + np.array(b) * t


def join(objs, name):
    """Une objetos (aplicando modificadores) en una sola malla."""
    for o in objs:
        apply_modifiers(o)
    ctx = bpy.context.copy()
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    return objs[0]
