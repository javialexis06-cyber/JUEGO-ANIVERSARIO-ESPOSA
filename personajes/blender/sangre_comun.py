"""Herramientas comunes de las figuras de Sangre y Ceniza (enemigos, jefes, armas, proyectiles y cosas).

Cada figura se arma por piezas (cuerpo, cabeza, brazo_izq…). Cada pieza junta formas SDF (fundidas como
plastilina y sacadas con marching cubes) y mallas sueltas (barridos, tornos, placas) en UNA sola malla con
colores por vértice: el color, la mugre, el óxido, el musgo, la sangre seca y la oclusión (sombra de contacto)
van horneados en los vértices. Así en el juego cada pieza es una malla con pocos materiales compartidos
(«sg_base», «sg_metal», «sg_brillo_<color>», «sg_espectro») y se puede dibujar cientos de veces con instancias.

Convenciones: metros, z arriba, las figuras miran hacia +Y de Blender (el contrato del juego). Cada pieza
tiene el origen en su articulación (el juego la gira ahí) y cuelga directo del vacío raíz de la figura.
"""
import json
import math
import os
import struct

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from skimage.measure import marching_cubes

import clay
import sdf

# ---------------------------------------------------------------------------
# Color
# ---------------------------------------------------------------------------


def lin(hexc):
    """'#RRGGBB' -> np.array RGB lineal."""
    return np.array(clay.rgb(hexc)[:3])


def mezclar(a, b, t):
    t = np.asarray(t, float)
    if t.ndim == 1:
        t = t[:, None]
    return a * (1 - t) + b * t


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------------------
# Ruido (numpy, determinista)
# ---------------------------------------------------------------------------

def _hash3(ix, iy, iz, semilla):
    h = (ix * 374761393 + iy * 668265263 + iz * 1442695041 + semilla * 2654435761) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h = h ^ (h >> 16)
    return (h & 0xFFFF) / 65535.0


def ruido(P, escala=1.0, semilla=0):
    """Ruido de valor 3D suave en [0, 1]."""
    Q = np.asarray(P, float) * escala
    i = np.floor(Q).astype(np.int64)
    f = Q - i
    u = f * f * (3 - 2 * f)
    acc = np.zeros(len(Q))
    for dx in (0, 1):
        wx = u[:, 0] if dx else 1 - u[:, 0]
        for dy in (0, 1):
            wy = u[:, 1] if dy else 1 - u[:, 1]
            for dz in (0, 1):
                wz = u[:, 2] if dz else 1 - u[:, 2]
                acc += wx * wy * wz * _hash3(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, semilla)
    return acc


def fbm(P, escala=1.0, octavas=4, semilla=0, ganancia=0.5):
    total, amp, norma = 0.0, 1.0, 0.0
    for o in range(octavas):
        total = total + amp * ruido(P, escala * (2.03 ** o), semilla + o * 31)
        norma += amp
        amp *= ganancia
    return total / norma


def grietas(P, escala=20.0, semilla=0, ancho=0.07):
    """1 en las líneas de grieta (ruido «crestado»), 0 lejos."""
    n = fbm(P, escala, 3, semilla)
    return 1.0 - smooth(0.0, ancho, np.abs(n - 0.5))


def sdf_ruido(f, amp=0.006, escala=30.0, semilla=0, octavas=3):
    """Desplaza la superficie de una SDF con ruido (piedra, corteza, carne grumosa)."""
    return lambda P: f(P) + (fbm(P, escala, octavas, semilla) - 0.5) * 2 * amp


# ---------------------------------------------------------------------------
# Acabados: cómo se pinta cada componente (color por vértice)
# ---------------------------------------------------------------------------

OSCURO = lin('#120D0B')
BARRO = lin('#3A2A1C')
SANGRE_SECA = lin('#4A0B0B')
SANGRE_FRESCA = lin('#7A0E0E')
OXIDO = lin('#6B3518')
MUSGO = lin('#33402A')
POLVO = lin('#8C8378')


class Pintura:
    """Acabado de un componente.

    tipo: tela, cuero, carne, hueso, hierro, oro, piedra, madera, pelo, cera, liso, brillo, sangre, vidrio
    mat: base, metal, brillo_<color>, espectro (material del juego)
    color2: segundo tono (moretones de la carne, vetas de la madera, manchas)
    sangre / barro / musgo / polvo: cantidad de cada mugre (0..1)
    """

    def __init__(self, color, tipo='tela', mat=None, color2=None, sangre=0.0, barro=0.0, musgo=0.0, polvo=0.0, var=1.0,
                 escala=1.0, semilla=0, ao=1.0, eje='z'):
        self.color = lin(color) if isinstance(color, str) else np.asarray(color, float)
        self.color2 = (lin(color2) if isinstance(color2, str) else np.asarray(color2, float)) if color2 is not None else None
        self.tipo = tipo
        if mat is None:
            mat = {'hierro': 'metal', 'oro': 'metal', 'brillo': 'brillo_rojo', 'vidrio': 'espectro'}.get(tipo, 'base')
        self.mat = mat
        self.sangre, self.barro, self.musgo, self.polvo = sangre, barro, musgo, polvo
        self.var, self.escala, self.semilla, self.ao, self.eje = var, escala, semilla, ao, eje


def P_(color, tipo='tela', **kw):
    return Pintura(color, tipo, **kw)


def pintar(pt, P, N, cav, cvx, altura=1.0):
    """Colores (lineales) de los vértices P con normales N, cavidad cav y convexidad cvx (0..1)."""
    n = len(P)
    c = np.tile(pt.color, (n, 1))
    s = pt.semilla * 7 + 3
    e = pt.escala
    v = pt.var
    t = pt.tipo
    if t == 'tela':
        c = c * (0.8 + 0.38 * v * fbm(P, 22 * e, 3, s))[:, None]
        c = c * (1 + 0.25 * v * (ruido(P, 90 * e, s + 1) - 0.5))[:, None]
        c = mezclar(c, c * 0.45, 0.55 * cav)
        c = mezclar(c, c * 1.35, 0.3 * cvx)
    elif t == 'cuero':
        c = c * (0.78 + 0.4 * v * fbm(P, 16 * e, 4, s))[:, None]
        c = mezclar(c, c * 0.35, 0.6 * cav)
        c = mezclar(c, np.minimum(c * 1.8 + 0.02, 1), 0.35 * cvx)
    elif t == 'carne':
        c2 = pt.color2 if pt.color2 is not None else pt.color * np.array([0.7, 0.55, 0.75])
        m = smooth(0.42, 0.7, fbm(P, 7 * e, 4, s))
        c = mezclar(c, np.tile(c2, (n, 1)), m * 0.8 * v)
        c = c * (0.85 + 0.3 * fbm(P, 35 * e, 2, s + 5))[:, None]
        c = mezclar(c, c * np.array([0.45, 0.22, 0.2]), 0.65 * cav)
    elif t == 'hueso':
        c = c * (0.82 + 0.3 * v * fbm(P, 12 * e, 4, s))[:, None]
        c = mezclar(c, np.tile(lin('#4A3A26'), (n, 1)), np.clip(0.85 * cav + 0.25 * smooth(0.55, 0.8, fbm(P, 5 * e, 3, s + 2)), 0, 1))
        g = grietas(P, 9 * e, s + 4, 0.04) * v
        c = mezclar(c, np.tile(lin('#2A2016'), (n, 1)), 0.75 * g)
        c = mezclar(c, np.minimum(c * 1.25, 1), 0.3 * cvx)
    elif t == 'hierro':
        c = c * (0.75 + 0.45 * v * fbm(P, 14 * e, 4, s))[:, None]
        rust = smooth(0.5, 0.75, fbm(P, 6 * e, 4, s + 9)) * 0.7 + 0.6 * cav
        c = mezclar(c, np.tile(OXIDO, (n, 1)), np.clip(rust, 0, 0.85) * v)
        c = mezclar(c, np.tile(lin('#9C9890'), (n, 1)), 0.4 * cvx)
        c = mezclar(c, c * 0.4, 0.4 * cav)
    elif t == 'oro':
        c = c * (0.8 + 0.35 * fbm(P, 14 * e, 3, s))[:, None]
        c = mezclar(c, np.tile(lin('#2E2410'), (n, 1)), np.clip(0.8 * cav, 0, 1))
        c = mezclar(c, np.tile(lin('#F3D98A'), (n, 1)), 0.55 * cvx)
    elif t == 'piedra':
        c = c * (0.7 + 0.5 * v * fbm(P, 6 * e, 5, s))[:, None]
        c = c * (0.9 + 0.2 * ruido(P, 40 * e, s + 3))[:, None]
        g = grietas(P, 5 * e, s + 7, 0.035) * v
        c = mezclar(c, c * 0.25, 0.8 * g)
        c = mezclar(c, c * 0.45, 0.6 * cav)
        c = mezclar(c, np.minimum(c * 1.3, 1), 0.3 * cvx)
    elif t == 'madera':
        ax = {'x': 0, 'y': 1, 'z': 2}[pt.eje]
        otros = [i for i in range(3) if i != ax]
        r = np.sqrt(P[:, otros[0]] ** 2 + P[:, otros[1]] ** 2) * 60 * e + fbm(P * np.array([1, 1, 1]), 8 * e, 3, s) * 6
        veta = 0.5 + 0.5 * np.sin(r)
        c2 = pt.color2 if pt.color2 is not None else pt.color * 0.55
        c = mezclar(c, np.tile(c2, (n, 1)), 0.6 * veta * v)
        c = mezclar(c, c * 0.4, 0.6 * cav)
        c = mezclar(c, np.minimum(c * 1.3, 1), 0.25 * cvx)
    elif t == 'pelo':
        c = c * (0.65 + 0.55 * v * fbm(P, 28 * e, 3, s))[:, None]
        if pt.color2 is not None:
            c = mezclar(c, np.tile(pt.color2, (n, 1)), smooth(0.45, 0.65, fbm(P, 5 * e, 3, s + 1)) * 0.7)
        c = mezclar(c, c * 0.3, 0.7 * cav)
    elif t == 'cera':
        c = c * (0.9 + 0.15 * fbm(P, 20 * e, 3, s))[:, None]
        c = mezclar(c, np.minimum(c * 1.25 + 0.05, 1), 0.4 * smooth(0.0, 1.0, N[:, 2]))
        c = mezclar(c, c * 0.6, 0.4 * cav)
    elif t == 'sangre':
        c = c * (0.7 + 0.5 * fbm(P, 18 * e, 3, s))[:, None]
    elif t == 'liso':
        c = c * (0.92 + 0.16 * v * fbm(P, 20 * e, 2, s))[:, None]
        c = mezclar(c, c * 0.55, 0.45 * cav)
    elif t in ('brillo', 'vidrio'):
        pass
    # Mugre común
    if pt.sangre > 0:
        m = smooth(1 - pt.sangre * 0.55, 1 - pt.sangre * 0.55 + 0.08, fbm(P, 5 * e, 4, s + 21))
        m = np.maximum(m, smooth(0.55, 0.9, cav) * pt.sangre)
        c = mezclar(c, np.tile(SANGRE_SECA, (n, 1)) * (0.8 + 0.4 * ruido(P, 30, s)[:, None]), np.clip(m, 0, 0.92))
    if pt.barro > 0:
        z = P[:, 2] / max(altura, 1e-3)
        m = smooth(0.32, 0.02, z + (fbm(P, 6, 3, s + 13) - 0.5) * 0.18) * pt.barro
        c = mezclar(c, np.tile(BARRO, (n, 1)), np.clip(m, 0, 0.9))
    if pt.musgo > 0:
        m = smooth(0.15, 0.7, N[:, 2]) * smooth(0.4, 0.62, fbm(P, 5, 4, s + 17)) + 0.6 * cav * smooth(0.45, 0.6, fbm(P, 9, 3, s + 18))
        c = mezclar(c, np.tile(MUSGO, (n, 1)) * (0.7 + 0.6 * ruido(P, 50, s)[:, None]), np.clip(m * pt.musgo, 0, 0.9))
    if pt.polvo > 0:
        m = smooth(0.3, 0.9, N[:, 2]) * pt.polvo
        c = mezclar(c, np.tile(POLVO, (n, 1)), np.clip(m * 0.6, 0, 0.6))
    return np.clip(c, 0, 1)


# ---------------------------------------------------------------------------
# Materiales compartidos (Blender: con el color de los vértices y relieve para los renders)
# ---------------------------------------------------------------------------

BRILLOS = {
    'rojo': '#FF2A1A', 'ambar': '#FFAA33', 'verde': '#7CFF4A', 'azul': '#5ED8FF', 'violeta': '#C46BFF', 'blanco': '#FFF4DA',
    'oro': '#FFD36B', 'fuego': '#FF6A1A',
}


def _nodo_color(nt):
    a = nt.nodes.new('ShaderNodeVertexColor')
    a.layer_name = 'Col'
    return a


def material_sg(nombre):
    """Materiales del juego: sg_base, sg_metal, sg_brillo_<color>, sg_espectro, sg_sangre."""
    m = bpy.data.materials.get(nombre)
    if m is not None:
        return m
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    col = _nodo_color(nt)
    coord = nt.nodes.new('ShaderNodeTexCoord')

    def relieve(escala, fuerza, dist):
        tx = nt.nodes.new('ShaderNodeTexNoise')
        tx.inputs['Scale'].default_value = escala
        tx.inputs['Detail'].default_value = 8
        tx.inputs['Roughness'].default_value = 0.65
        nt.links.new(coord.outputs['Object'], tx.inputs['Vector'])
        bp = nt.nodes.new('ShaderNodeBump')
        bp.inputs['Strength'].default_value = fuerza
        bp.inputs['Distance'].default_value = dist
        nt.links.new(tx.outputs['Fac'], bp.inputs['Height'])
        nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])

    if nombre.startswith('sg_brillo'):
        hexc = BRILLOS.get(nombre.split('_', 2)[2], '#FF2A1A')
        b.inputs['Base Color'].default_value = clay.rgb(hexc)
        b.inputs['Emission Color'].default_value = clay.rgb(hexc)
        b.inputs['Emission Strength'].default_value = 6.0
        b.inputs['Roughness'].default_value = 0.4
        m['brillo'] = hexc
    elif nombre == 'sg_espectro':
        nt.links.new(col.outputs['Color'], b.inputs['Base Color'])
        nt.links.new(col.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = 1.2
        b.inputs['Alpha'].default_value = 0.55
        b.inputs['Roughness'].default_value = 0.3
        try:
            m.blend_method = 'BLEND'
        except AttributeError:
            pass
        m['espectro'] = 1
    elif nombre == 'sg_metal':
        nt.links.new(col.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Metallic'].default_value = 0.75
        b.inputs['Roughness'].default_value = 0.42
        relieve(70, 0.18, 0.004)
    elif nombre == 'sg_sangre':
        nt.links.new(col.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = 0.18
        b.inputs['Coat Weight'].default_value = 0.6
    else:  # sg_base: fieltro / arcilla
        nt.links.new(col.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = 0.82
        b.inputs['Sheen Weight'].default_value = 0.25
        b.inputs['Sheen Roughness'].default_value = 0.4
        relieve(140, 0.3, 0.003)
    return m


def nombre_mat(mat):
    return 'sg_' + mat


def simplificar_para_gltf(mats):
    """Copias simples para exportar: color blanco (manda el color de los vértices) y marcas para el juego."""
    for m in mats:
        nt = m.node_tree
        b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
        for s in list(b.inputs):
            if s.is_linked:
                for l in list(s.links):
                    nt.links.remove(l)
        if not m.name.startswith('sg_brillo'):
            b.inputs['Base Color'].default_value = (1, 1, 1, 1)
        # Sin brillo de tela ni barniz: three.js usaría el material físico (más caro en el celular)
        b.inputs['Sheen Weight'].default_value = 0.0
        b.inputs['Coat Weight'].default_value = 0.0
        m.use_backface_culling = True
        if m.name == 'sg_base':
            m['fieltro'] = 1
        m['relieve'] = 1
        if m.name == 'sg_espectro':
            b.inputs['Emission Color'].default_value = (0.35, 0.45, 0.5, 1)
            b.inputs['Emission Strength'].default_value = 1.0


# ---------------------------------------------------------------------------
# Mallas
# ---------------------------------------------------------------------------

def _datos_malla(obj):
    """Vértices (mundo) y caras de un objeto evaluado (con modificadores)."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    nv = len(me.vertices)
    co = np.empty(nv * 3)
    me.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    mw = np.array(ev.matrix_world)
    co = co @ mw[:3, :3].T + mw[:3, 3]
    caras = [tuple(p.vertices) for p in me.polygons]
    lisas = [p.use_smooth for p in me.polygons]
    ev.to_mesh_clear()
    return co, caras, lisas


def _mc(f, lo, hi, voxel):
    lo = np.asarray(lo, float)
    hi = np.asarray(hi, float)
    dims = np.ceil((hi - lo) / voxel).astype(int) + 1
    xs = [lo[i] + np.arange(dims[i]) * voxel for i in range(3)]
    X, Y, Z = np.meshgrid(xs[0], xs[1], xs[2], indexing='ij')
    P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    vals = np.empty(len(P))
    ch = 300000
    for s in range(0, len(P), ch):
        vals[s:s + ch] = f(P[s:s + ch])
    vol = vals.reshape(dims)
    # Bordes cerrados: fuera de la caja todo es aire
    vol[0, :, :] = vol[-1, :, :] = np.abs(vol[0, :, :]) + voxel
    vol[:, 0, :] = vol[:, -1, :] = np.abs(vol[:, 0, :]) + voxel
    vol[:, :, 0] = vol[:, :, -1] = np.abs(vol[:, :, 0]) + voxel
    if vol.min() >= 0:
        return None, None
    v, fa, _, _ = marching_cubes(vol, 0.0, spacing=(voxel, voxel, voxel))
    return v + lo, fa


def _limpiar_obj(obj):
    me = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if me.users == 0:
        bpy.data.meshes.remove(me)


class Comp:
    def __init__(self, f=None, lo=None, hi=None, pintura=None, k=0.0, obj=None, plano=False):
        self.f, self.lo, self.hi, self.pt, self.k, self.obj, self.plano = f, lo, hi, pintura, k, obj, plano


class Pieza:
    """Una pieza animable de la figura (cuerpo, cabeza, brazo_izq…)."""

    def __init__(self, fig, nombre, pivote, tris=900, voxel=None):
        self.fig, self.nombre, self.pivote = fig, nombre, np.asarray(pivote, float)
        self.tris, self.voxel = tris, voxel
        self.comps = []
        self.obj = None
        self.extras = {}

    # --- añadir formas ------------------------------------------------------
    def sdf(self, f, lo, hi, pintura, k=0.0):
        """Forma SDF (se funde con las demás de la pieza con suavidad k)."""
        self.comps.append(Comp(f=f, lo=np.asarray(lo, float), hi=np.asarray(hi, float), pintura=pintura, k=k))
        return self

    def malla(self, obj, pintura, plano=False):
        """Malla suelta de Blender (se le aplican sus modificadores)."""
        self.comps.append(Comp(obj=obj, pintura=pintura, plano=plano))
        return obj

    # atajos SDF -------------------------------------------------------------
    def bola(self, c, r, pt, k=0.0, ruido_amp=0.0, ruido_esc=30):
        c = np.asarray(c, float)
        r = np.asarray(r if np.ndim(r) else (r, r, r), float)
        f = sdf.ellipsoid(c, r)
        if ruido_amp:
            f = sdf_ruido(f, ruido_amp, ruido_esc, len(self.comps))
        m = r.max() + 0.02 + ruido_amp
        return self.sdf(f, c - m, c + m, pt, k)

    def cono(self, a, b, r1, r2, pt, k=0.0, ruido_amp=0.0, ruido_esc=30):
        a, b = np.asarray(a, float), np.asarray(b, float)
        f = sdf.round_cone(a, b, r1, r2)
        if ruido_amp:
            f = sdf_ruido(f, ruido_amp, ruido_esc, len(self.comps))
        m = max(r1, r2) + 0.02 + ruido_amp
        return self.sdf(f, np.minimum(a, b) - m, np.maximum(a, b) + m, pt, k)

    def trazo(self, pts, radios, pt, k=0.0, ruido_amp=0.0, ruido_esc=30):
        pts = np.asarray(pts, float)
        f = sdf.stroke([tuple(p) for p in pts], radios)
        if ruido_amp:
            f = sdf_ruido(f, ruido_amp, ruido_esc, len(self.comps))
        m = (max(radios) if np.ndim(radios) else radios) + 0.02 + ruido_amp
        return self.sdf(f, pts.min(0) - m, pts.max(0) + m, pt, k)

    def caja(self, c, half, r, pt, k=0.0, rot=None, ruido_amp=0.0, ruido_esc=30):
        c = np.asarray(c, float)
        f = sdf.round_box(c, half, r, rot)
        if ruido_amp:
            f = sdf_ruido(f, ruido_amp, ruido_esc, len(self.comps))
        m = np.linalg.norm(half) + 0.02 + ruido_amp
        return self.sdf(f, c - m, c + m, pt, k)

    # --- construir ------------------------------------------------------------
    def construir(self, coll):
        """Malla única de la pieza en coordenadas de la figura (sin colores aún)."""
        V, F, cid, lisa = [], [], [], []
        base = 0
        sd = [c for c in self.comps if c.f is not None]
        voxel = self.voxel or self.fig.voxel
        if sd:
            lo = np.min([c.lo for c in sd], 0)
            hi = np.max([c.hi for c in sd], 0)

            def f(P):
                d = sd[0].f(P)
                for c in sd[1:]:
                    d2 = c.f(P)
                    d = sdf.smin(d, d2, c.k) if c.k > 0 else np.minimum(d, d2)
                return d
            v, fa = _mc(f, lo, hi, voxel)
            if v is not None:
                tmp = clay.make_mesh_object(f'tmp {self.nombre}', v, fa, coll)
                bm = bmesh.new()
                bm.from_mesh(tmp.data)
                bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
                bm.to_mesh(tmp.data)
                bm.free()
                sm = tmp.modifiers.new('Suave', 'SMOOTH')
                sm.factor = 0.5
                sm.iterations = 2
                n_expl = sum(self._tris_obj(c.obj) for c in self.comps if c.obj is not None)
                objetivo = max(self.tris - n_expl, 120)
                if len(fa) > objetivo:
                    dm = tmp.modifiers.new('Reducir', 'DECIMATE')
                    dm.decimate_type = 'COLLAPSE'
                    dm.ratio = objetivo / len(fa)
                    dm.use_collapse_triangulate = True
                clay.apply_modifiers(tmp)
                co, caras, _ = _datos_malla(tmp)
                _limpiar_obj(tmp)
                # A qué componente pertenece cada vértice: la SDF más cercana
                D = np.stack([c.f(co) for c in sd], 1)
                ids = np.argmin(D, 1)
                idx_comp = [self.comps.index(c) for c in sd]
                V.append(co)
                F += [tuple(i + base for i in fc) for fc in caras]
                cid.append(np.array([idx_comp[i] for i in ids]))
                lisa += [True] * len(caras)
                base += len(co)
        for i, c in enumerate(self.comps):
            if c.obj is None:
                continue
            co, caras, _ = _datos_malla(c.obj)
            _limpiar_obj(c.obj)
            c.obj = None
            V.append(co)
            F += [tuple(j + base for j in fc) for fc in caras]
            cid.append(np.full(len(co), i))
            lisa += [not c.plano] * len(caras)
            base += len(co)
        if not V:
            raise RuntimeError(f'pieza vacía {self.nombre}')
        V = np.concatenate(V)
        cid = np.concatenate(cid)
        nombre = f'{self.fig.nodo}~{self.nombre}'
        me = bpy.data.meshes.new(nombre)
        me.from_pydata([tuple(map(float, p)) for p in V], [], F)
        me.validate(clean_customdata=False)
        me.update()
        me.polygons.foreach_set('use_smooth', lisa)
        if hasattr(me, 'use_auto_smooth'):
            me.use_auto_smooth = True
            me.auto_smooth_angle = math.radians(60)
        obj = bpy.data.objects.new(nombre, me)
        clay.link(obj, coll)
        self.obj, self.cid = obj, cid
        return obj

    @staticmethod
    def _tris_obj(o):
        dg = bpy.context.evaluated_depsgraph_get()
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        n = sum(len(p.vertices) - 2 for p in me.polygons)
        ev.to_mesh_clear()
        return n


def _curvatura(me, co, nrm):
    ne = len(me.edges)
    ed = np.empty(ne * 2, dtype=np.int64)
    me.edges.foreach_get('vertices', ed)
    ed = ed.reshape(-1, 2)
    nv = len(co)
    suma = np.zeros((nv, 3))
    cnt = np.zeros(nv)
    np.add.at(suma, ed[:, 0], co[ed[:, 1]])
    np.add.at(suma, ed[:, 1], co[ed[:, 0]])
    np.add.at(cnt, ed[:, 0], 1)
    np.add.at(cnt, ed[:, 1], 1)
    cnt = np.maximum(cnt, 1)
    lap = suma / cnt[:, None] - co
    largo = np.linalg.norm(co[ed[:, 0]] - co[ed[:, 1]], axis=1)
    lm = np.zeros(nv)
    np.add.at(lm, ed[:, 0], largo)
    np.add.at(lm, ed[:, 1], largo)
    lm = np.maximum(lm / cnt, 1e-5)
    k = (lap * nrm).sum(1) / lm
    return np.clip(k * 2.2, 0, 1), np.clip(-k * 2.2, 0, 1)


_DIRS = None


def _dirs_hemisferio(k=14):
    global _DIRS
    if _DIRS is None or len(_DIRS) != k:
        rng = np.random.default_rng(5)
        d = []
        for i in range(k):
            u1, u2 = (i + 0.5) / k, (i * 0.618034) % 1.0
            r = math.sqrt(u1)
            th = 2 * math.pi * u2
            d.append((r * math.cos(th), r * math.sin(th), math.sqrt(max(0.0, 1 - u1))))
        _DIRS = np.array(d)
        del rng
    return _DIRS


class Figura:
    """Figura armada por piezas: un vacío raíz `<prefijo>_<id>` con una malla por pieza."""

    def __init__(self, id_, prefijo='enemigo', voxel=0.012, suelo=True, ao=1.0, alcance_ao=None):
        self.id, self.prefijo = id_, prefijo
        self.nodo = f'{prefijo}_{id_}' if prefijo else id_
        self.voxel, self.suelo, self.ao, self.alcance_ao = voxel, suelo, ao, alcance_ao
        self.piezas = {}
        self.extras = {}
        self.root = None

    def pieza(self, nombre, pivote, tris=900, voxel=None):
        p = Pieza(self, nombre, pivote, tris, voxel)
        self.piezas[nombre] = p
        return p

    def construir(self, coll):
        root = bpy.data.objects.new(self.nodo, None)
        clay.link(root, coll)
        self.root = root
        objs = [p.construir(coll) for p in self.piezas.values()]
        # Medidas
        todos = np.concatenate([np.array([v.co for v in o.data.vertices]) for o in objs])
        lo, hi = todos.min(0), todos.max(0)
        altura = float(hi[2] - max(lo[2], 0.0)) if self.suelo else float(hi[2] - lo[2])
        self.lo, self.hi = lo, hi
        # BVH de toda la figura (y el suelo) para la oclusión
        verts, polys = [], []
        for o in objs:
            b = len(verts)
            verts += [v.co.copy() for v in o.data.vertices]
            polys += [[b + i for i in p.vertices] for p in o.data.polygons]
        if self.suelo:
            b = len(verts)
            R = 6.0
            verts += [Vector((-R, -R, -0.002)), Vector((R, -R, -0.002)), Vector((R, R, -0.002)), Vector((-R, R, -0.002))]
            polys.append([b, b + 1, b + 2, b + 3])
        bvh = BVHTree.FromPolygons(verts, polys)
        alcance = self.alcance_ao or max(0.12, 0.28 * float(np.max(hi - lo)))
        dirs = _dirs_hemisferio(14)
        for p in self.piezas.values():
            self._colorear(p, bvh, alcance, dirs, max(altura, 0.05))
        # Origen en la articulación y colgado de la raíz
        tris_total = 0
        for p in self.piezas.values():
            o = p.obj
            me = o.data
            me.transform(_mat_traslacion(-p.pivote))
            o.location = tuple(p.pivote)
            o.parent = root
            o['pieza'] = p.nombre
            for k, v in p.extras.items():
                o[k] = v
            p.n_tris = sum(len(q.vertices) - 2 for q in me.polygons)
            tris_total += p.n_tris
        self.tris = tris_total
        # radio del cuerpo (para choques) y alcance (hasta la punta de lo que estire: brazos, alas, armas)
        cu = self.piezas.get('cuerpo') or next(iter(self.piezas.values()))
        vc = np.array([v.co for v in cu.obj.data.vertices]) + cu.pivote
        self.radio = float(np.percentile(np.linalg.norm(vc[:, :2], axis=1), 96))
        self.alcance = float(max(np.abs(lo[:2]).max(), np.abs(hi[:2]).max()))
        root['altura'] = round(float(hi[2]), 3)
        root['radio'] = round(self.radio, 3)
        root['alcance'] = round(self.alcance, 3)
        root['tris'] = tris_total
        for k, v in self.extras.items():
            root[k] = v
        return root

    def _colorear(self, p, bvh, alcance, dirs, altura):
        o = p.obj
        me = o.data
        me.update()
        nv = len(me.vertices)
        co = np.empty(nv * 3)
        me.vertices.foreach_get('co', co)
        co = co.reshape(-1, 3)
        nrm = np.empty(nv * 3)
        me.vertices.foreach_get('normal', nrm)
        nrm = nrm.reshape(-1, 3)
        cav, cvx = _curvatura(me, co, nrm)
        col = np.zeros((nv, 3))
        ao_mix = np.zeros(nv)
        for i, c in enumerate(p.comps):
            sel = p.cid == i
            if not sel.any():
                continue
            col[sel] = pintar(c.pt, co[sel], nrm[sel], cav[sel], cvx[sel], altura)
            ao_mix[sel] = c.pt.ao * (0.0 if c.pt.tipo in ('brillo',) else 1.0)
        # Oclusión ambiental (rayos sobre toda la figura)
        if self.ao > 0:
            t = np.array([0.0, 0.0, 1.0])
            ao = np.ones(nv)
            for vi in range(nv):
                if ao_mix[vi] <= 0:
                    continue
                n = nrm[vi]
                a = np.array([1.0, 0, 0]) if abs(n[0]) < 0.9 else np.array([0, 1.0, 0])
                u = np.cross(n, a)
                u /= max(np.linalg.norm(u), 1e-9)
                w = np.cross(n, u)
                org = Vector(co[vi] + n * 0.004)
                occ = 0.0
                for d in dirs:
                    dd = u * d[0] + w * d[1] + n * d[2]
                    hit = bvh.ray_cast(org, Vector(dd), alcance)
                    if hit[0] is not None:
                        occ += 1.0 - 0.6 * (hit[3] / alcance)
                ao[vi] = 1.0 - occ / len(dirs)
            del t
            k = np.clip(ao_mix * self.ao, 0, 1)
            fac = 0.28 + 0.72 * smooth(0.0, 0.85, ao)
            col = col * (1 - k + k * fac)[:, None]
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        rgba = np.concatenate([col, np.ones((nv, 1))], 1).ravel()
        attr.data.foreach_set('color', rgba)
        me.color_attributes.active_color = attr
        try:
            me.color_attributes.render_color_index = 0
        except Exception:
            pass
        # Materiales por cara (mayoría de sus vértices)
        mats = []
        for c in p.comps:
            if c.pt.mat not in mats:
                mats.append(c.pt.mat)
        for m in mats:
            me.materials.append(material_sg(nombre_mat(m)))
        if len(mats) > 1:
            cm = np.array([mats.index(c.pt.mat) for c in p.comps])
            vm = cm[p.cid]
            idx = []
            for q in me.polygons:
                vs = vm[list(q.vertices)]
                idx.append(int(np.bincount(vs).argmax()))
            me.polygons.foreach_set('material_index', idx)


def _mat_traslacion(t):
    from mathutils import Matrix
    return Matrix.Translation(Vector(tuple(t)))


# ---------------------------------------------------------------------------
# Mallas sueltas (bajas en polígonos) para las piezas
# ---------------------------------------------------------------------------

def tubo(nombre, pts, radio, coll, segmentos=6, muestras=2, tapas=('flat', 'flat'), perfil=(1, 1), giro=0.0, arriba=(0, 0, 1),
         cap_len=1.0):
    return clay.sweep(nombre, [tuple(map(float, p)) for p in pts], radio, perfil, coll, None, segments=segmentos, samples=muestras,
                      caps=tapas, twist=giro, up=arriba, subsurf=0, cap_len=cap_len)


def bolita(nombre, c, r, coll, n=2, sub=0, p=2.0):
    r = r if np.ndim(r) else (r, r, r)
    return clay.blob(nombre, tuple(map(float, c)), tuple(map(float, r)), coll, None, n=n, p=p, subsurf=sub)


def torno(nombre, perfil, coll, segmentos=12, centro=(0, 0, 0), eje=None):
    o = clay.lathe(nombre, perfil, coll, None, segments=segmentos, subsurf=0)
    if eje is not None:
        apuntar(o, eje)
    o.location = tuple(map(float, centro))
    return o


def apuntar(o, d):
    """Gira un objeto hecho en el origen (eje z) para que su z mire hacia d."""
    q = Vector((0, 0, 1)).rotation_difference(Vector(tuple(map(float, d))).normalized())
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = q
    return o


def punta(nombre, base, tip, r, coll, seg=5, curva=(0, 0, 0), medio=0.62):
    """Cono bajo en polígonos (garras, uñas, dientes, púas, cuernos chicos): base, anillo medio y punta."""
    base = np.asarray(base, float)
    tip = np.asarray(tip, float)
    d = tip - base
    L = np.linalg.norm(d)
    d = d / max(L, 1e-9)
    a = np.array([1.0, 0, 0]) if abs(d[0]) < 0.9 else np.array([0, 1.0, 0])
    u = np.cross(d, a)
    u /= np.linalg.norm(u)
    w = np.cross(d, u)
    mid = base + (tip - base) * 0.5 + np.asarray(curva, float) * L
    verts = []
    for c, rr in ((base, r), (mid, r * medio)):
        for k in range(seg):
            t = 2 * math.pi * k / seg
            verts.append(tuple(c + (u * math.cos(t) + w * math.sin(t)) * rr))
    verts.append(tuple(tip))
    faces = [tuple(range(seg - 1, -1, -1))]
    for k in range(seg):
        k1 = (k + 1) % seg
        faces.append((k, k1, seg + k1, seg + k))
        faces.append((seg + k, seg + k1, 2 * seg))
    o = clay.make_mesh_object(nombre, verts, faces, coll)
    return o


def placa(nombre, contorno, grosor, coll, eje='y'):
    """Placa plana (contorno 2D en el plano perpendicular a `eje`) con grosor (alas, hojas, telas, letreros)."""
    pts = [tuple(map(float, p)) for p in contorno]
    if eje == 'y':
        verts = [(x, 0.0, z) for x, z in pts]
    elif eje == 'x':
        verts = [(0.0, y, z) for y, z in pts]
    else:
        verts = [(x, y, 0.0) for x, y in pts]
    me = bpy.data.meshes.new(nombre)
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in verts]
    bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(nombre, me)
    clay.link(o, coll)
    clay.add_solidify(o, grosor, offset=0.0)
    return o


def lamina(nombre, filas, coll, grosor=0.006):
    """Superficie de una grilla de puntos filas[i][j] (alas membranosas, capas, velos) con grosor."""
    filas = [[tuple(map(float, p)) for p in f] for f in filas]
    ni, nj = len(filas), len(filas[0])
    verts = [p for f in filas for p in f]
    faces = [(i * nj + j, i * nj + j + 1, (i + 1) * nj + j + 1, (i + 1) * nj + j) for i in range(ni - 1) for j in range(nj - 1)]
    o = clay.make_mesh_object(nombre, verts, faces, coll)
    if grosor:
        clay.add_solidify(o, grosor, offset=0.0)
    return o


def rotar_obj(o, eje, ang_deg, centro=(0, 0, 0)):
    """Gira un objeto (con su malla) alrededor de un eje que pasa por centro (aplica la rotación a la malla)."""
    from mathutils import Matrix
    c = Vector(tuple(map(float, centro)))
    R = Matrix.Rotation(math.radians(ang_deg), 4, Vector(tuple(map(float, eje))) if not isinstance(eje, str) else eje.upper())
    M = Matrix.Translation(c) @ R @ Matrix.Translation(-c)
    o.matrix_world = M @ o.matrix_world
    return o


def rot(eje, ang_deg):
    """Matriz 3x3 de rotación (numpy) alrededor de x, y o z."""
    a = math.radians(ang_deg)
    c, s = math.cos(a), math.sin(a)
    if eje == 'x':
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    if eje == 'y':
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def caja_rot(c, half, r, R):
    """SDF de caja redondeada girada con la matriz R (3x3) alrededor de su centro."""
    return sdf.round_box(c, half, r, rot=np.asarray(R))


# ---------------------------------------------------------------------------
# Exportar
# ---------------------------------------------------------------------------

def arbol(root):
    pila, out = [root], []
    while pila:
        o = pila.pop()
        out.append(o)
        pila.extend(o.children)
    return out


def exportar_glb(raices, path):
    """Exporta las figuras (cada una con su raíz) y deja los nombres de las piezas limpios (cabeza, cuerpo…)."""
    objs = [o for r in raices for o in arbol(r)]
    mats = {s.material for o in objs if o.type == 'MESH' for s in o.material_slots if s.material}
    copias = {}
    for m in mats:
        c = m.copy()
        copias[m] = c
    simplificar_para_gltf(list(copias.values()))
    for o in objs:
        if o.type == 'MESH':
            for s in o.material_slots:
                if s.material in copias:
                    s.material = copias[s.material]
    for m, c in copias.items():
        nombre = m.name
        m.name = nombre + '_render'
        c.name = nombre
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.hide_set(False)
        o.hide_viewport = False
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_extras=True, export_animations=False, export_skins=False, export_morph=False,
                              export_cameras=False, export_lights=False, export_colors=True, export_normals=True,
                              export_texcoords=False)
    # Devolver los materiales de render
    for o in objs:
        if o.type == 'MESH':
            for s in o.material_slots:
                for m, c in copias.items():
                    if s.material is c:
                        s.material = m
    for m, c in copias.items():
        nombre = c.name
        bpy.data.materials.remove(c)
        m.name = nombre
    renombrar_glb(path)
    print('GLB', os.path.basename(path), round(os.path.getsize(path) / 1e3), 'KB', flush=True)


def renombrar_glb(path):
    """En Blender los nombres no se pueden repetir: las piezas se llaman «enemigo_zombi~cabeza» y aquí quedan «cabeza»."""
    with open(path, 'rb') as fh:
        data = fh.read()
    magic, ver, total = struct.unpack('<III', data[:12])
    jlen, jtype = struct.unpack('<II', data[12:20])
    js = json.loads(data[20:20 + jlen])
    rest = data[20 + jlen:]
    for n in js.get('nodes', []):
        if '~' in n.get('name', ''):
            n['name'] = n['name'].split('~', 1)[1]
    for m in js.get('meshes', []):
        if '~' in m.get('name', ''):
            m['name'] = m['name'].replace('~', '.')
    nuevo = json.dumps(js, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    nuevo += b' ' * ((4 - len(nuevo) % 4) % 4)
    total = 12 + 8 + len(nuevo) + len(rest)
    with open(path, 'wb') as fh:
        fh.write(struct.pack('<III', magic, ver, total))
        fh.write(struct.pack('<II', len(nuevo), jtype))
        fh.write(nuevo)
        fh.write(rest)


def manifiesto(figs):
    """Datos de cada figura para el programador: piezas con su articulación, alto, radio y triángulos."""
    out = {}
    for f in figs:
        out[f.nodo] = dict(
            altura=round(float(f.hi[2]), 3), radio=round(f.radio, 3), alcance=round(f.alcance, 3),
            tris=int(f.tris), **{k: v for k, v in f.extras.items() if not k.startswith('icono')},
            piezas={n: dict(pivote=[round(float(x), 3) for x in p.pivote], tris=int(p.n_tris), **p.extras) for n, p in f.piezas.items()})
    return out


# ---------------------------------------------------------------------------
# Render: hojas de contacto e íconos
# ---------------------------------------------------------------------------

def preparar_render(scene, res=320, muestras=24, transparente=False, fondo='#2A2624'):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = muestras
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.05
    scene.cycles.use_denoising = False
    try:
        scene.cycles.denoiser = 'OPENIMAGEDENOISE'
        scene.cycles.use_denoising = True
    except TypeError:
        pass
    scene.cycles.max_bounces = 4
    scene.cycles.diffuse_bounces = 2
    scene.cycles.glossy_bounces = 2
    scene.cycles.transparent_max_bounces = 4
    scene.render.resolution_x = scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparente
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 2
    world = bpy.data.worlds.new('Mundo sangre') if scene.world is None else scene.world
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = clay.rgb(fondo)
    bg.inputs['Strength'].default_value = 0.35


def luces_dramaticas(coll, centro=(0, 0, 0.6), escala=1.0, calida='#FFC48A', fria='#8FB4FF'):
    import escena
    c = tuple(centro)
    s = escala
    out = [
        escena.area_light('SG clave', (c[0] - 2.2 * s, c[1] + 2.6 * s, c[2] + 2.6 * s), c, 260 * s * s, 1.6 * s, calida, coll),
        escena.area_light('SG contra', (c[0] + 2.4 * s, c[1] - 2.4 * s, c[2] + 1.8 * s), c, 380 * s * s, 1.2 * s, '#FF5A3A', coll),
        escena.area_light('SG relleno', (c[0] + 2.8 * s, c[1] + 2.0 * s, c[2] + 0.6 * s), c, 70 * s * s, 2.5 * s, fria, coll),
    ]
    return out


def luces_neutras(coll, centro=(0, 0, 0.6), escala=1.0):
    """Luz de revisión: se ven los colores de verdad (para las hojas de contacto)."""
    import escena
    c = tuple(centro)
    s = escala
    return [
        escena.area_light('SG n clave', (c[0] + 2.0 * s, c[1] + 3.0 * s, c[2] + 2.6 * s), c, 190 * s * s, 2.5 * s, '#FFF2E2', coll),
        escena.area_light('SG n relleno', (c[0] - 3.0 * s, c[1] + 1.0 * s, c[2] + 1.0 * s), c, 60 * s * s, 3.0 * s, '#E2ECFF', coll),
        escena.area_light('SG n contra', (c[0] - 0.5 * s, c[1] - 3.0 * s, c[2] + 2.5 * s), c, 110 * s * s, 2.0 * s, '#FFFFFF', coll),
        escena.area_light('SG n atras', (c[0] + 0.5 * s, c[1] - 3.5 * s, c[2] + 0.8 * s), c, 60 * s * s, 3.0 * s, '#FFFFFF', coll),
    ]


def camara_figura(nombre, lo, hi, azimut=30, elev=14, margen=1.15, coll=None):
    """Cámara ortográfica que encuadra la caja [lo, hi] desde el frente (+Y) girada `azimut` grados."""
    import escena
    lo, hi = np.asarray(lo), np.asarray(hi)
    c = (lo + hi) / 2
    a, e = math.radians(azimut), math.radians(elev)
    d = np.array([math.sin(a) * math.cos(e), math.cos(a) * math.cos(e), math.sin(e)])
    dist = 10.0
    cam = escena.camera(nombre, tuple(c + d * dist), tuple(c), 50, coll)
    cam.data.type = 'ORTHO'
    ext = hi - lo
    ancho_vis = abs(math.cos(a)) * ext[0] + abs(math.sin(a)) * ext[1]
    alto_vis = ext[2] * math.cos(e) + (abs(math.sin(a)) * ext[0] + abs(math.cos(a)) * ext[1]) * math.sin(e)
    cam.data.ortho_scale = max(ancho_vis, alto_vis) * margen
    cam.data.clip_end = 50
    return cam


def caja_mundo(root):
    bpy.context.view_layer.update()
    pts = []
    for o in arbol(root):
        if o.type == 'MESH':
            mw = o.matrix_world
            pts += [mw @ Vector(v) for v in o.bound_box]
    P = np.array([tuple(p) for p in pts])
    return P.min(0), P.max(0)


def render(scene, cam, path):
    scene.camera = cam
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def solo_visible(roots_visibles, todas):
    vis = set()
    for r in roots_visibles:
        vis.update(arbol(r))
    for r in todas:
        for o in arbol(r):
            o.hide_render = o not in vis


def hoja_contacto(paths_por_fila, salida, etiquetas=None, tam=256):
    """Une renders PNG en una hoja (una fila por figura) con su nombre."""
    from PIL import Image, ImageDraw
    filas = len(paths_por_fila)
    cols = max(len(r) for r in paths_por_fila)
    W = cols * tam
    H = filas * (tam + 18)
    hoja = Image.new('RGB', (W, H), (24, 22, 21))
    dr = ImageDraw.Draw(hoja)
    for i, fila in enumerate(paths_por_fila):
        for j, p in enumerate(fila):
            if not os.path.exists(p):
                continue
            im = Image.open(p).convert('RGBA').resize((tam, tam))
            fondo = Image.new('RGBA', im.size, (42, 38, 36, 255))
            fondo.alpha_composite(im)
            hoja.paste(fondo.convert('RGB'), (j * tam, i * (tam + 18) + 18))
        if etiquetas:
            dr.text((4, i * (tam + 18) + 3), etiquetas[i], fill=(235, 200, 160))
    hoja.save(salida)
    return salida
