"""Nuestro Hogar · cocina de chef: los recortes de la comida, la loza y las máquinas, renderizados en Cycles.

Uso (con el bpy de pip, que trae el quitarruido):
    python3.11 personajes/blender/cocina_sprites.py <salida> [claves o prefijos...]
o con el Blender del sistema:
    blender -b -P personajes/blender/cocina_sprites.py -- <salida> [claves...]

Cada pieza sale como <salida>/<clave>.png (fondo transparente) y <salida>/<clave>.json con:
  ancla: dónde cae el origen del modelo en la imagen (px), ppm: píxeles por metro, ref: medida de referencia (m),
  puntos: otros puntos del modelo ya proyectados (px) y lo que el juego necesita para dibujar encima (alto del vaso,
  radio de la boca…). Luego `cocina_atlas.py` las recorta y las empaca en las hojas webp del juego.

Cámara ortográfica (sin perspectiva) a la elevación que usa cada estación del juego:
  38° la loza y lo que va encima del wafle (el óvalo de la superficie en el juego mide 0,62 de alto/ancho),
  20° los vasos (se ve lo de adentro por el plástico), 55° la tabla de picar, 12-30° las máquinas y frascos.
"""
import json
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import clay  # noqa: E402

M = clay.material
RNG = np.random.default_rng


# ---------------------------------------------------------------------------
# Materiales de cocina
# ---------------------------------------------------------------------------

def mat_fruta(nombre, color, sss=0.2, sss_radius=(1.0, 0.2, 0.12), rough=0.3, coat=0.6, **kw):
    return M(f'Fruta | {nombre}', color, rough=rough, sss=sss, sss_radius=sss_radius, sss_scale=0.006, coat=coat, coat_rough=0.1, **kw)


def mat_salsa(nombre, color, rough=0.12, alpha=1.0):
    return M(f'Salsa | {nombre}', color, rough=rough, coat=0.9, coat_rough=0.04, sss=0.25, sss_scale=0.004, spec=0.6)


def mat_liquido(nombre, color, trans=0.6, rough=0.04):
    """Jugos y almíbares: con su color vivo, un brillo y un poquito de luz por dentro."""
    return M(f'Líquido | {nombre}', color, rough=rough, transmission=min(trans, 0.12), ior=1.34, sss=0.5, sss_radius=(1, 0.6, 0.3), sss_scale=0.02,
             coat=0.5, spec=0.5)


def mat_crema(nombre='crema', color='#FFFBF2', sss=0.35):
    return M(f'Crema | {nombre}', color, rough=0.38, sss=sss, sss_radius=(1.0, 0.9, 0.7), sss_scale=0.004,
             noise=dict(scale=260, strength=0.15, distance=0.0006))


def sin_sombra(m):
    """El vidrio deja pasar la luz para las sombras (si no, lo de adentro de un frasco queda negro: sin cáusticas,
    Cycles no deja pasar la luz por el vidrio)."""
    nt = m.node_tree
    if any(n.type == 'MIX_SHADER' for n in nt.nodes):
        return m
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    lp = nt.nodes.new('ShaderNodeLightPath')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Shadow Ray'], mix.inputs['Fac'])
    nt.links.new(bsdf.outputs['BSDF'], mix.inputs[1])
    nt.links.new(tr.outputs['BSDF'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return m


def mat_vidrio(nombre='vidrio', color='#F4FBFF', rough=0.02, ior=1.45):
    return sin_sombra(M(f'Vidrio | {nombre}', color, rough=rough, transmission=1.0, ior=ior, spec=0.6))


def mat_plastico_claro(nombre='plástico', color='#FBFEFF', rough=0.05):
    return sin_sombra(M(f'Plástico | {nombre}', color, rough=rough, transmission=1.0, ior=1.4, spec=0.55))


def mat_metal(nombre='acero', color='#C9CED2', rough=0.22):
    return M(f'Metal | {nombre}', color, rough=rough, metallic=1.0)


def mat_cepillado(nombre='acero cepillado', color='#C3C8CC'):
    return M(f'Metal | {nombre}', color, rough=0.3, metallic=1.0, ribs=dict(scale=2600, strength=0.08, axis='Z', distance=0.0002))


def mat_plastico(nombre, color, rough=0.32, coat=0.3):
    return M(f'Plástico | {nombre}', color, rough=rough, coat=coat, coat_rough=0.12)


def mat_ceramica(nombre, color='#FFFDF8', rough=0.16):
    return M(f'Cerámica | {nombre}', color, rough=rough, coat=0.7, coat_rough=0.05, spec=0.5)


def mat_madera(nombre, color='#C98A50', escala=18.0, fuerza=0.12):
    """Madera con vetas (ondas) y poro fino."""
    return M(f'Madera | {nombre}', color, rough=0.55, wave=dict(scale=escala, strength=fuerza, axis='X', distortion=6.0, distance=0.002),
             noise=dict(scale=400, strength=0.08, distance=0.0005))


def mat_vc(nombre, rough=0.6, coat=0.0, sss=0.0, ruido=None, brillo_var=0.12, trans=0.0):
    """Material con el color por vértice (atributo «col») y un poquito de ruido de color (para lo horneado)."""
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    attr = nt.nodes.new('ShaderNodeVertexColor')
    attr.layer_name = 'col'
    coord = nt.nodes.new('ShaderNodeTexCoord')
    tex = nt.nodes.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 260
    tex.inputs['Detail'].default_value = 6
    nt.links.new(coord.outputs['Object'], tex.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = 1 - brillo_var
    mr.inputs['To Max'].default_value = 1 + brillo_var
    nt.links.new(tex.outputs['Fac'], mr.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeMix')
    mul.data_type = 'RGBA'
    mul.blend_type = 'MULTIPLY'
    mul.inputs['Factor'].default_value = 1.0
    a = [s for s in mul.inputs if s.identifier == 'A_Color'][0]
    b = [s for s in mul.inputs if s.identifier == 'B_Color'][0]
    nt.links.new(attr.outputs['Color'], a)
    nt.links.new(mr.outputs['Result'], b)
    res = [s for s in mul.outputs if s.identifier == 'Result_Color'][0]
    nt.links.new(res, bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.15
    if sss:
        bsdf.inputs['Subsurface Weight'].default_value = sss
        bsdf.inputs['Subsurface Radius'].default_value = (1.0, 0.5, 0.3)
        bsdf.inputs['Subsurface Scale'].default_value = 0.004
    if trans:
        bsdf.inputs['Transmission Weight'].default_value = trans
    bump = nt.nodes.new('ShaderNodeBump')
    tex2 = nt.nodes.new('ShaderNodeTexNoise')
    tex2.inputs['Scale'].default_value = (ruido or {}).get('scale', 500)
    tex2.inputs['Detail'].default_value = 8
    nt.links.new(coord.outputs['Object'], tex2.inputs['Vector'])
    bump.inputs['Strength'].default_value = (ruido or {}).get('strength', 0.25)
    bump.inputs['Distance'].default_value = (ruido or {}).get('distance', 0.0006)
    nt.links.new(tex2.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def pintar(obj, fn):
    """Color por vértice: fn(posiciones Nx3 locales) -> colores Nx3 (lineales)."""
    me = obj.data
    if 'col' not in me.color_attributes:
        me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT')
    attr = me.color_attributes['col']
    pos = np.array([v.co[:] for v in me.vertices])
    cols = np.clip(fn(pos), 0, 4)
    flat = np.ones((len(pos), 4))
    flat[:, :3] = cols
    attr.data.foreach_set('color', flat.ravel())


def lin(hexc):
    return np.array(clay.rgb(hexc)[:3])


def mezcla(a, b, k):
    return a[None, :] * (1 - k[:, None]) + b[None, :] * k[:, None]


# ---------------------------------------------------------------------------
# Mallas útiles
# ---------------------------------------------------------------------------

def grupo(coll, construir, loc=(0, 0, 0), rot=(0, 0, 0), esc=1.0):
    """Construye en el origen y cuelga lo nuevo de un vacío (para moverlo, girarlo y escalarlo junto)."""
    antes = set(coll.all_objects)
    construir(coll)
    raiz = bpy.data.objects.new('grupo', None)
    clay.link(raiz, coll)
    for o in coll.all_objects:
        if o not in antes and o is not raiz and o.parent is None:
            o.parent = raiz
    raiz.location = loc
    raiz.rotation_euler = rot
    raiz.scale = (esc, esc, esc) if isinstance(esc, (int, float)) else esc
    bpy.context.view_layer.update()
    return raiz


def disco_altura(nombre, R, altura, n_anillos=64, n_seg=192, z_base=0.0, borde=0.012, coll=None, material=None, subsurf=1):
    """Disco grueso con la cara de arriba en relieve: altura(x, y) -> z (sobre z_base) y canto redondeado."""
    verts, faces = [], []
    rings = []
    for i in range(n_anillos + 1):
        r = (R - borde) * (i / n_anillos) ** 0.9
        ring = []
        for k in range(n_seg if i else 1):
            a = 2 * math.pi * k / n_seg
            ring.append(len(verts))
            verts.append((r * math.cos(a), r * math.sin(a), 0.0))
        rings.append(ring)
    n_canto = 8
    for j in range(1, n_canto + 1):
        phi = j / n_canto * math.pi / 2
        ring = []
        for k in range(n_seg):
            a = 2 * math.pi * k / n_seg
            r = (R - borde) + borde * math.sin(phi)
            ring.append(len(verts))
            verts.append((r * math.cos(a), r * math.sin(a), 0.0))
        rings.append((ring, phi))
    v = np.array(verts, dtype=float)
    top_n = 1 + n_anillos * n_seg
    v[:top_n, 2] = z_base + altura(v[:top_n, 0], v[:top_n, 1])
    edge_ids = rings[n_anillos]
    h_edge = np.array([v[i, 2] for i in edge_ids])
    for j in range(n_canto):
        ring, phi = rings[n_anillos + 1 + j]
        for k, idx in enumerate(ring):
            v[idx, 2] = z_base + (h_edge[k] - z_base) * math.cos(phi) * 0.999
    centro = rings[0][0]
    r1 = rings[1]
    for k in range(n_seg):
        faces.append((centro, r1[k], r1[(k + 1) % n_seg]))
    for i in range(1, n_anillos):
        a, b = rings[i], rings[i + 1]
        for k in range(n_seg):
            faces.append((a[k], b[k], b[(k + 1) % n_seg], a[(k + 1) % n_seg]))
    prev = rings[n_anillos]
    for j in range(n_canto):
        ring = rings[n_anillos + 1 + j][0]
        for k in range(n_seg):
            faces.append((prev[k], ring[k], ring[(k + 1) % n_seg], prev[(k + 1) % n_seg]))
        prev = ring
    cb = len(v)
    v = np.vstack([v, [[0, 0, z_base]]])
    for k in range(n_seg):
        faces.append((prev[(k + 1) % n_seg], prev[k], cb))
    obj = clay.make_mesh_object(nombre, v, faces, coll, material=material)
    if subsurf:
        clay.add_subsurf(obj, subsurf, subsurf)
    return obj


def cuadricula(x, y, celda, pared, bisel):
    """1 en el fondo de los huequitos, 0 en las paredes (con transición suave)."""
    def eje(t):
        u = t / celda - np.floor(t / celda)
        d = np.minimum(u, 1 - u) * celda
        return clay.smoothstep(pared / 2, pared / 2 + bisel, d)
    return eje(x + celda / 2) * eje(y + celda / 2)


def pieza(o, loc, rot=None, normal=None):
    """La pieza se armó alrededor del origen: se gira ahí y luego se lleva a su sitio (si se gira ya movida, gira
    alrededor del centro de la escena y queda en otra parte)."""
    if normal is not None:
        clay.orient_to(o, normal)
    elif rot is not None:
        o.rotation_euler = rot
    o.location = loc
    return o


def tubo(nombre, pts, r, coll, mat, seg=10, caps=('round', 'round'), subsurf=1, samples=6):
    return clay.sweep(nombre, pts, r, (1, 1), coll, mat, segments=seg, samples=samples, caps=caps, subsurf=subsurf)


def vaso_perfil(nombre, r_abajo, r_arriba, alto, coll, mat, grosor=0.0018, base=0.004, labio=True, seg=96):
    """Vaso abierto de paredes delgadas (perfil de revolución) con base gruesa y borde redondeado."""
    g = grosor
    perfil = [(0.0, 0.0), (r_abajo * 0.96, 0.0), (r_abajo, base * 0.4), (r_arriba, alto)]
    if labio:
        perfil += [(r_arriba + g * 0.5, alto + g * 0.4), (r_arriba - g, alto + g * 0.2)]
    perfil += [(r_arriba - g, alto - g), (r_abajo - g, base), (0.0, base)]
    return clay.lathe(nombre, perfil, coll, mat, segments=seg, cap_top=False, cap_bottom=False)


def etiqueta(nombre, r, z0, z1, coll, mat, seg=96, a0=0.0, a1=2 * math.pi, sobre=0.0006, r1=None):
    """Banda de etiqueta (cilindro abierto) pegada a un frasco de radio r entre z0 y z1 (opcional r1 arriba)."""
    r1 = r if r1 is None else r1
    verts, faces = [], []
    n = seg
    for i, (z, rr) in enumerate(((z0, r + sobre), (z1, r1 + sobre))):
        for k in range(n + 1):
            a = a0 + (a1 - a0) * k / n
            verts.append((rr * math.cos(a), rr * math.sin(a), z))
    for k in range(n):
        faces.append((k, k + 1, n + 1 + k + 1, n + 1 + k))
    o = clay.make_mesh_object(nombre, verts, faces, coll, material=mat)
    return o


# ---------------------------------------------------------------------------
# Escena: luces, cámara y render
# ---------------------------------------------------------------------------

class Pieza:
    def __init__(self, clave, construir, elev=38, azim=0, ref=0.1, px=160, vidrio=False, sombra=True, muestras=40, extra=None,
                 margen=0.05, ancla=(0, 0, 0), luz=1.0, rot_z=0.0, fondo=0.3):
        self.clave, self.construir, self.elev, self.azim = clave, construir, elev, azim
        self.ref, self.px, self.vidrio, self.sombra, self.muestras = ref, px, vidrio, sombra, muestras
        self.extra = extra or {}
        self.margen, self.ancla, self.luz, self.rot_z, self.fondo = margen, ancla, luz, rot_z, fondo


def dir_camara(elev, azim):
    e, a = math.radians(elev), math.radians(azim)
    return Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))


def luces(coll, centro, radio, k=1.0):
    """Estudio de comida: clave cálida grande arriba a la izquierda, relleno frío a la derecha, contraluz y cenital."""
    d = max(radio * 7, 0.4)
    escala = (d / 1.0) ** 2 * k

    def area(nombre, az, el, energia, tam, color):
        v = dir_camara(el, az)
        data = bpy.data.lights.new(nombre, 'AREA')
        data.energy = energia * escala
        data.shape = 'DISK'
        data.size = tam * d
        data.color = clay.rgb(color)[:3]
        o = bpy.data.objects.new(nombre, data)
        clay.link(o, coll)
        o.location = Vector(centro) + v * d
        dd = Vector(centro) - o.location
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = dd.to_track_quat('-Z', 'Y')
        return o

    area('clave', -40, 52, 30, 0.7, '#FFF1E2')
    area('relleno', 55, 22, 9, 0.9, '#EEF4FF')
    area('contraluz', 165, 40, 22, 0.5, '#FFE9D2')
    area('cenital', 0, 88, 6, 1.0, '#FFFFFF')


def preparar(scene, muestras, vidrio, fondo=0.3):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = muestras
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    try:
        scene.cycles.denoiser = 'OPENIMAGEDENOISE'
        scene.cycles.use_denoising = True
    except TypeError:
        scene.cycles.use_denoising = False
        scene.cycles.samples = muestras * 4
    scene.cycles.max_bounces = 10
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 10
    scene.cycles.transparent_max_bounces = 10
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.blur_glossy = 1.0
    scene.render.film_transparent = True
    scene.cycles.film_transparent_glass = vidrio
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Punchy'
    scene.view_settings.exposure = 0.0
    w = bpy.data.worlds.new('Mundo')
    scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = clay.rgb('#FFF4E6')
    bg.inputs['Strength'].default_value = fondo


def cajas_mundo(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in objs:
        ev = o.evaluated_get(dg)
        for c in ev.bound_box:
            pts.append(ev.matrix_world @ Vector(c))
    return pts


def renderizar(p: Pieza, salida):
    scene = clay.reset_scene()
    factor = float(os.environ.get('MUESTRAS', '1'))
    preparar(scene, max(12, round(p.muestras * factor)), p.vidrio, p.fondo)
    coll = clay.collection('Modelo')
    datos = p.construir(coll) or {}
    puntos = datos.pop('puntos', {})
    objs = [o for o in coll.all_objects if o.type == 'MESH' and not o.hide_render]
    raiz = None
    if p.rot_z:
        raiz = bpy.data.objects.new('raiz', None)
        clay.link(raiz, coll)
        for o in coll.all_objects:
            if o.parent is None and o is not raiz:
                o.parent = raiz
        raiz.rotation_euler = (0, 0, math.radians(p.rot_z))
    bpy.context.view_layer.update()
    pts = cajas_mundo(objs)
    lo = Vector((min(q.x for q in pts), min(q.y for q in pts), min(q.z for q in pts)))
    hi = Vector((max(q.x for q in pts), max(q.y for q in pts), max(q.z for q in pts)))
    centro = (lo + hi) / 2
    radio = (hi - lo).length / 2
    if p.sombra:
        bpy.ops.mesh.primitive_plane_add(size=radio * 12, location=(centro.x, centro.y, lo.z - 1e-4))
        piso = bpy.context.active_object
        piso.is_shadow_catcher = True
        clay.link(piso, coll)
    luces(clay.collection('Luces'), centro, radio, p.luz)
    d = dir_camara(p.elev, p.azim)
    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', cam_data)
    clay.link(cam, clay.collection('Camara'))
    cam.location = centro + d * (radio * 6 + 1)
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (-d).to_track_quat('-Z', 'Y')
    cam_data.clip_start = 0.01
    cam_data.clip_end = radio * 20 + 10
    scene.camera = cam
    bpy.context.view_layer.update()
    R = cam.matrix_world.to_3x3()
    der, arr = R.col[0], R.col[1]
    xs = [(q - centro).dot(der) for q in pts]
    ys = [(q - centro).dot(arr) for q in pts]
    m = p.margen + (0.06 if p.sombra else 0)
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    ancho, alto = (x1 - x0), (y1 - y0)
    tam = max(ancho, alto)
    x0 -= tam * m
    x1 += tam * m
    y0 -= tam * m
    y1 += tam * m
    if p.sombra:
        y0 -= alto * 0.05
        x1 += ancho * 0.05
    ancho, alto = x1 - x0, y1 - y0
    ppm = p.px / p.ref
    rx, ry = max(8, round(ancho * ppm)), max(8, round(alto * ppm))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    cam.location = cam.location + der * cx + arr * cy
    cam_data.ortho_scale = max(ancho, alto)
    scene.render.resolution_x, scene.render.resolution_y = rx, ry
    scene.render.resolution_percentage = 100
    bpy.context.view_layer.update()

    def proyectar(q):
        a = Vector(q)
        if raiz is not None:
            a = raiz.matrix_world @ a
        return [round(((a - centro).dot(der) - x0) * ppm, 2), round((y1 - (a - centro).dot(arr)) * ppm, 2)]
    scene.render.filepath = os.path.join(salida, f'{p.clave}.png')
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    info = {'ancla': proyectar(p.ancla), 'ppm': round(ppm, 3), 'ref': p.ref, 'elev': p.elev, **p.extra, **datos}
    if puntos:
        info['puntos'] = {k: proyectar(v) for k, v in puntos.items()}
    with open(os.path.join(salida, f'{p.clave}.json'), 'w') as f:
        json.dump(info, f)
    print(f'{p.clave}: {rx}x{ry} en {time.time() - t0:.1f} s', flush=True)


# ---------------------------------------------------------------------------
# Waflería: el wafle, la wafflera, la loza
# ---------------------------------------------------------------------------

R_WAFLE = 0.09
ALTO_WAFLE = 0.024
MASAS = {
    # cuajado / dorado / tostado: (fondo de los huequitos, crestas)
    'clasica': dict(cuajado=('#F6E3AE', '#F0D594'), dorado=('#EDB45C', '#C9822C'), tostado=('#BE7330', '#8C4718'), pintas=None, cruda='#F3DEA6'),
    'chocolate': dict(cuajado=('#B88A68', '#A8775A'), dorado=('#7D4C2E', '#5F3620'), tostado=('#512B17', '#3A1D0F'), pintas=None, cruda='#8E5C3D'),
    'red_velvet': dict(cuajado=('#EE918A', '#E07A70'), dorado=('#BB3D38', '#982B27'), tostado=('#802521', '#5E1815'), pintas=None, cruda='#C4433F'),
    'avena': dict(cuajado=('#F0DCB4', '#E6CA97'), dorado=('#D69E5E', '#B67B3E'), tostado=('#A06731', '#7A4A1E'), pintas='#6E3F1C', cruda='#E6CC98'),
}


def alturas_wafle(x, y):
    celda = R_WAFLE * 2 / 5.6
    hueco = cuadricula(x, y, celda, celda * 0.26, celda * 0.12)
    r = np.sqrt(x * x + y * y)
    domo = ALTO_WAFLE * (1 - 0.18 * (r / R_WAFLE) ** 2)
    borde = clay.smoothstep(R_WAFLE * 0.97, R_WAFLE * 0.86, r)
    return domo - 0.0085 * hueco * borde, hueco * borde


def wafle(coll, masa, etapa, z=0.0):
    """Wafle belga redondo. etapa: 0 recién cuajado, 1 doradito, 2 tostadito, 3 quemado."""
    info = MASAS[masa]
    obj = disco_altura('wafle', R_WAFLE, lambda x, y: alturas_wafle(x, y)[0], n_anillos=70, n_seg=220, z_base=z, borde=0.011, coll=coll,
                       material=mat_vc(f'wafle {masa} {etapa}', rough=0.62 if etapa < 3 else 0.8, coat=0.15 if etapa in (1, 2) else 0.0,
                                       ruido=dict(scale=700, strength=0.3, distance=0.0005)))
    rng = RNG(7 + etapa)
    claves = ['cuajado', 'dorado', 'tostado']

    def color(pos):
        x, y = pos[:, 0], pos[:, 1]
        _, hueco = alturas_wafle(x, y)
        r = np.sqrt(x * x + y * y)
        canto = np.clip((r - R_WAFLE * 0.93) / (R_WAFLE * 0.07), 0, 1)
        if etapa < 3:
            fondo, cresta = (lin(c) for c in info[claves[etapa]])
            c = mezcla(cresta, fondo, hueco)
            osc = 0.8 if etapa else 0.95
            c = c * (1 - canto[:, None] * (1 - osc))
            ruido = np.sin(x * 211 + 1.3) * np.sin(y * 187 + 0.4) * 0.5 + np.sin((x + y) * 97) * 0.5
            c = c * (1 + 0.08 * ruido[:, None])
        else:
            tost, carb = lin(info['tostado'][1]), lin('#1A0F0A')
            ruido = (np.sin(x * 160 + 2) * np.sin(y * 140) + np.sin((x - y) * 90 + 1)) * 0.5
            k = np.clip(0.55 + 0.35 * (1 - hueco) + 0.3 * ruido + 0.4 * canto, 0, 1)
            c = mezcla(tost, carb, k)
        return c
    pintar(obj, color)
    if info['pintas']:
        for k in range(46):
            a, rr = rng.uniform(0, 2 * math.pi), R_WAFLE * 0.86 * math.sqrt(rng.uniform(0, 1))
            x, y = rr * math.cos(a), rr * math.sin(a)
            h, _ = alturas_wafle(np.array([x]), np.array([y]))
            col = info['pintas'] if k % 3 else ('#E8D2A4' if etapa < 2 else '#B5844A')
            o = clay.blob(f'avena {k}', (0, 0, 0), (0.0026, 0.0018, 0.0006), coll, M(f'pinta {col} {etapa}', col, rough=0.7), n=3, subsurf=0)
            pieza(o, (x, y, z + h[0] + 0.0006), rot=(0, 0, rng.uniform(0, math.pi)))
    return obj


def construir_wafle(masa, etapa):
    return lambda coll: wafle(coll, masa, etapa)


def construir_plato(coll):
    """Plato de loza crema con ala ancha, filito dorado y una franjita de color sobre el ala."""
    R = 0.13
    clay.lathe('pie', [(0.0, 0.0), (0.072, 0.0), (0.075, 0.005), (0.07, 0.008), (0.0, 0.008)], coll, mat_ceramica('plato'), segments=96)
    perfil = [(0.0, 0.009), (0.08, 0.009), (0.088, 0.011), (0.098, 0.017), (R * 0.97, 0.021), (R, 0.0225), (R * 1.003, 0.0205),
              (R * 0.975, 0.018), (0.097, 0.0125), (0.086, 0.006), (0.075, 0.004)]
    clay.lathe('plato', perfil, coll, mat_ceramica('plato'), segments=128, cap_top=False, cap_bottom=False)
    clay.lathe('fondo', [(0.0, 0.009), (0.081, 0.009)], coll, mat_ceramica('plato'), segments=128)
    clay.lathe('filo dorado', [(0.121, 0.0212), (0.1225, 0.0216), (0.124, 0.0219)], coll, M('oro filo', '#D8A84A', rough=0.2, metallic=1.0),
               segments=128, cap_top=False, cap_bottom=False, subsurf=0)
    clay.lathe('franja', [(0.104, 0.0186), (0.108, 0.0194), (0.112, 0.0201)], coll, M('franja plato', '#E9B9A2', rough=0.25, coat=0.6),
               segments=128, cap_top=False, cap_bottom=False, subsurf=0)
    return {'radio_fondo': 0.08, 'alto': 0.009}


def construir_wafflera(coll):
    """Wafflera belga giratoria: carcasa de acero, la placa negra con cuadrícula (donde va el wafle), lucecitas,
    perilla de temperatura y el mango para voltearla. El wafle va encima con el mismo centro y escala."""
    Rp = R_WAFLE * 1.05
    acero = mat_metal('wafflera cromo', '#D5DADE', 0.16)
    esmalte = M('wafflera esmalte', '#DE5A1E', rough=0.28, coat=0.45, coat_rough=0.08)
    negro = M('antiadherente', '#232325', rough=0.55, metallic=0.0, noise=dict(scale=900, strength=0.15, distance=0.0002))
    baq = M('baquelita', '#1C1A19', rough=0.3, coat=0.5)
    z_placa = 0.0

    def alt(x, y):
        celda = R_WAFLE * 2 / 5.6
        hueco = cuadricula(x, y, celda, celda * 0.26, celda * 0.12)
        r = np.sqrt(x * x + y * y)
        return -0.006 + 0.0055 * (1 - hueco) * clay.smoothstep(Rp, Rp * 0.9, r)
    disco_altura('placa', Rp, alt, n_anillos=60, n_seg=180, z_base=z_placa - 0.004, borde=0.003, coll=coll, material=negro)
    # Carcasa: aro de acero alrededor de la placa, con labio
    clay.lathe('carcasa', [(Rp * 0.99, -0.004), (Rp * 1.02, 0.0015), (Rp * 1.12, 0.004), (Rp * 1.3, 0.002), (Rp * 1.36, -0.006),
                           (Rp * 1.38, -0.03), (Rp * 1.3, -0.042), (0.0, -0.042)], coll, esmalte, segments=128, cap_top=False, cap_bottom=False)
    clay.lathe('filo cromo', [(Rp * 1.1, 0.0035), (Rp * 1.2, 0.0045), (Rp * 1.3, 0.0025)], coll, acero, segments=128, cap_top=False, cap_bottom=False)
    clay.lathe('junta', [(Rp * 1.0, -0.0035), (Rp * 1.03, 0.001), (Rp * 1.06, 0.0018)], coll, negro, segments=128, cap_top=False, cap_bottom=False)
    # Base con patitas
    clay.lathe('base', [(0.0, -0.06), (Rp * 1.42, -0.06), (Rp * 1.46, -0.055), (Rp * 1.4, -0.046), (0.0, -0.046)], coll, baq, segments=96)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        clay.blob(f'pata {k}', (math.cos(a) * Rp * 1.25, math.sin(a) * Rp * 1.25, -0.064), (0.012, 0.012, 0.005), coll, baq, n=5)
    # Bisagras / ejes de giro a los lados
    for s in (-1, 1):
        clay.blob(f'eje {s}', (s * Rp * 1.42, 0, -0.016), (0.012, 0.018, 0.016), coll, baq, n=6, p=3)
        clay.lathe(f'tapa eje {s}', [(0.0, 0.0), (0.008, 0.0), (0.009, 0.003), (0.0, 0.004)], coll, acero, segments=24).location = (s * Rp * 1.49, 0, -0.016)
    # Panel del frente con lucecitas y perilla
    clay.rbox('panel', (0, -Rp * 1.34, -0.022), (0.03, 0.006, 0.01), coll, baq, p=4, n=4)
    clay.blob('luz verde', (-0.012, -Rp * 1.345 - 0.004, -0.02), (0.003, 0.002, 0.003), coll,
              M('led verde', '#5DFF7A', rough=0.2, emission='#5DFF7A', emission_strength=6), n=4)
    clay.blob('luz roja', (0.0, -Rp * 1.345 - 0.004, -0.02), (0.003, 0.002, 0.003), coll,
              M('led rojo', '#FF4B4B', rough=0.2, emission='#FF4B4B', emission_strength=4), n=4)
    perilla = clay.lathe('perilla', [(0.0, 0.0), (0.008, 0.0), (0.0085, 0.006), (0.006, 0.009), (0.0, 0.0095)], coll, acero, segments=32)
    perilla.rotation_euler = (math.pi / 2, 0, 0)
    perilla.location = (0.016, -Rp * 1.345, -0.021)
    # Mango para voltear (a la izquierda) con agarradera
    tubo('mango', [(-Rp * 1.45, 0, -0.012), (-Rp * 1.7, 0, -0.008), (-Rp * 2.0, 0, -0.004)], 0.006, coll, acero)
    tubo('agarradera', [(-Rp * 1.96, 0, -0.004), (-Rp * 2.3, 0, 0.0), (-Rp * 2.65, 0, 0.004)], 0.011, coll, baq, seg=16)
    return {'radio_placa': Rp, 'puntos': {'centro': (0, 0, 0), 'frente': (0, -Rp * 1.38, -0.03)}}


def construir_tapa_wafflera(coll):
    """Tapa de vidrio templado con aro de acero, perilla y gotitas de vapor condensado."""
    Rp = R_WAFLE * 1.05
    acero = mat_metal('aro tapa', '#D3D8DC', 0.18)
    vidrio = mat_vidrio('tapa', '#F2F8FF', rough=0.04)
    clay.lathe('aro tapa', [(Rp * 1.06, 0.026), (Rp * 1.16, 0.026), (Rp * 1.19, 0.031), (Rp * 1.14, 0.035), (Rp * 1.04, 0.033)], coll, acero,
               segments=128, cap_top=False, cap_bottom=False)
    perfil = [(Rp * 1.06, 0.032)] + [(Rp * 1.06 * math.cos(t), 0.032 + 0.024 * math.sin(t)) for t in np.linspace(0.05, 1.5, 14)]
    perfil_in = [(rr * 0.985, z - 0.0016) for rr, z in reversed(perfil)]
    clay.lathe('domo', perfil + perfil_in, coll, vidrio, segments=128, cap_bottom=False, cap_top=False)
    clay.lathe('perilla', [(0.0, 0.054), (0.012, 0.054), (0.014, 0.062), (0.01, 0.07), (0.0, 0.071)], coll,
               M('baquelita', '#1C1A19', rough=0.3, coat=0.5), segments=32)
    clay.lathe('base perilla', [(0.0, 0.0545), (0.016, 0.0545), (0.017, 0.056), (0.0, 0.0562)], coll, acero, segments=32)
    gotas = sin_sombra(M('gotas', '#FFFFFF', rough=0.02, transmission=1.0, ior=1.33))
    rng = RNG(11)
    for k in range(60):
        t = rng.uniform(0.15, 1.35)
        a = rng.uniform(0, 2 * math.pi)
        rr = Rp * 1.06 * math.cos(t)
        z = 0.032 + 0.024 * math.sin(t)
        n_ = Vector((math.cos(a) * math.cos(t) * 0.024 / 0.064, math.sin(a) * math.cos(t) * 0.024 / 0.064, math.sin(t))).normalized()
        s = rng.uniform(0.0007, 0.0018)
        o = clay.blob(f'gota {k}', (0, 0, 0), (s, s, s * 0.45), coll, gotas, n=4, subsurf=0)
        pieza(o, (rr * math.cos(a), rr * math.sin(a), z + 0.0004), normal=-Vector(n_))
    return {}


def construir_jarra_masa(masa):
    """Jarra medidora de vidrio con la masa cruda adentro (cremosa, con un hilito pegado en el pico)."""
    color = MASAS[masa]['cruda']

    def f(coll):
        vidrio = mat_vidrio('jarra', '#F6FBFF', rough=0.03)
        R, H = 0.045, 0.13
        perfil = [(0.0, 0.0), (R * 0.95, 0.0), (R, 0.004), (R * 1.04, H * 0.5), (R * 1.08, H), (R * 1.08 - 0.003, H), (R * 1.04 - 0.003, H * 0.5),
                  (R - 0.003, 0.007), (0.0, 0.006)]
        clay.lathe('jarra', perfil, coll, vidrio, segments=64, cap_top=False)
        nivel = H * 0.66
        masa_m = M(f'masa {masa}', color, rough=0.22, sss=0.4, sss_scale=0.004, coat=0.5)
        clay.lathe('masa', [(0.0, 0.006), (R - 0.0035, 0.007), (R * 1.035 - 0.004, nivel), (R * 0.6, nivel + 0.002), (0.0, nivel + 0.003)], coll, masa_m,
                   segments=64)
        clay.blob('pico', (0, -R * 1.06, H * 0.97), (0.013, 0.017, 0.004), coll, vidrio, n=6)
        clay.sweep('asa', [(0, R * 1.05, H * 0.85), (0, R * 1.6, H * 0.8), (0, R * 1.62, H * 0.35), (0, R * 1.04, H * 0.25)], 0.006, (1, 1.4), coll,
                   vidrio, segments=10)
        for k in range(4):
            z = H * (0.25 + k * 0.17)
            clay.sweep(f'raya {k}', [(R * 0.45, -R * 0.92, z), (R * 0.05, -R * 1.05, z), (-R * 0.2, -R * 1.03, z)], 0.0009, (1, 1), coll,
                       M('raya roja', '#D9534F', rough=0.4), segments=5, subsurf=0)
        clay.blob('gota', (R * 0.3, -R * 1.075, H * 0.9), (0.004, 0.003, 0.01), coll, masa_m, n=4)
        clay.blob('hilo', (0, -R * 1.1, H * 0.95), (0.005, 0.004, 0.012), coll, masa_m, n=4)
    return f


def rejilla(parte):
    """Rejilla de enfriar cromada en tres piezas (izquierda, medio que se repite, derecha)."""
    def f(coll):
        cromo = mat_metal('rejilla', '#D9DEE2', 0.12)
        L, Y = 0.11, 0.055
        z = 0.012
        n = 9
        if parte == 'medio':
            for i in range(n):
                x = -L / 2 + (i + 0.5) * L / n
                tubo(f'alambre {i}', [(x, -Y, z), (x, Y, z)], 0.0011, coll, cromo, seg=8, caps=('flat', 'flat'), subsurf=0, samples=2)
            for y in (-Y * 0.98, -Y * 0.35, Y * 0.35, Y * 0.98):
                tubo('travesaño', [(-L / 2, y, z - 0.0015), (L / 2, y, z - 0.0015)], 0.0014, coll, cromo, seg=8, caps=('flat', 'flat'), subsurf=0,
                     samples=2)
            return {'paso': L}
        s = -1 if parte == 'izq' else 1
        Lb = 0.022
        pts = [(s * 0.0, -Y * 0.98, z - 0.0015), (s * Lb * 0.7, -Y * 0.98, z - 0.0015), (s * Lb, -Y * 0.7, z - 0.0015), (s * Lb, Y * 0.7, z - 0.0015),
               (s * Lb * 0.7, Y * 0.98, z - 0.0015), (s * 0.0, Y * 0.98, z - 0.0015)]
        tubo('marco', pts, 0.0016, coll, cromo, seg=10, caps=('flat', 'flat'), subsurf=0, samples=6)
        for y in (-Y * 0.35, Y * 0.35):
            tubo('travesaño', [(0.0, y, z - 0.0015), (s * Lb, y, z - 0.0015)], 0.0014, coll, cromo, seg=8, caps=('flat', 'round'), subsurf=0, samples=2)
        for y in (-Y * 0.8, Y * 0.8):
            tubo('pata', [(s * Lb * 0.9, y, z - 0.0015), (s * Lb * 0.95, y, z * 0.4), (s * Lb, y, 0.0005)], 0.0013, coll, cromo, seg=8, subsurf=0)
        return {}
    return f


def construir_caneca(coll):
    acero = mat_cepillado('caneca', '#BCC2C6')
    negro = mat_plastico('caneca negro', '#26272A', 0.4)
    R, H = 0.11, 0.3
    clay.lathe('cuerpo', [(0.0, 0.004), (R * 0.97, 0.004), (R, 0.012), (R, H - 0.01), (R * 0.98, H), (0.0, H)], coll, acero, segments=96)
    clay.lathe('aro abajo', [(R * 1.0, 0.0), (R * 1.02, 0.0), (R * 1.025, 0.012), (R * 1.0, 0.014)], coll, negro, segments=96)
    clay.lathe('tapa', [(R * 1.01, H - 0.004), (R * 1.03, H), (R * 0.95, H + 0.02), (R * 0.6, H + 0.032), (0.0, H + 0.035)], coll, acero, segments=96)
    clay.lathe('bisagra', [(R * 1.0, H - 0.012), (R * 1.035, H - 0.012), (R * 1.035, H - 0.002), (R * 1.0, H - 0.002)], coll, negro, segments=96,
               cap_top=False, cap_bottom=False)
    clay.rbox('pedal', (0, -R * 1.08, 0.012), (0.04, 0.025, 0.006), coll, negro, p=4, n=4)
    clay.rbox('etiqueta', (0, -R * 1.002, H * 0.6), (0.035, 0.002, 0.02), coll, M('etiqueta caneca', '#5A9A4C', rough=0.5), p=6, n=4)
    return {}


# ---------------------------------------------------------------------------
# Frutas y toppings
# ---------------------------------------------------------------------------

def perfil_fresa(t):
    t = np.clip(t, 0, 1)
    return 0.12 + 0.88 * np.sin(t * math.pi * 0.6) ** 0.7


def forma_fresa(v):
    """Esfera unidad -> fresa (cono redondeado, más ancha arriba, con la punta abajo en -Z)."""
    z = v[:, 2]
    k = perfil_fresa((z + 1) / 2)
    out = v.copy()
    out[:, 0] *= k
    out[:, 1] *= k
    out[:, 2] = np.where(z > 0.6, 0.6 + (z - 0.6) * 0.5, z)
    return out


def mat_piel_fresa():
    return mat_fruta('fresa', '#C40E26', sss=0.15, noise=dict(scale=1100, strength=0.2, distance=0.0003))


def semillas_en(coll, cuerpo, puntos, rng):
    """Semillitas amarillas pegadas a la superficie de verdad (después de suavizar)."""
    sup = clay.Surface(cuerpo)
    m = M('semilla', '#F0CE5E', rough=0.35, coat=0.4)
    for k, p in enumerate(puntos):
        loc, nrm = sup.nearest(p)
        o = clay.blob(f'semilla {k}', (0, 0, 0), (0.0011, 0.0011, 0.0018), coll, m, n=3, subsurf=0)
        pieza(o, tuple(loc - nrm * 0.0003), normal=nrm)


def hojas_fresa(coll, centro, tam, rng, arriba=(0, 0, 1)):
    verde = M('hoja fresa', '#3E9443', rough=0.45, sss=0.2, sss_radius=(0.3, 1.0, 0.3), sss_scale=0.003, coat=0.2)
    c = np.array(centro, dtype=float)
    up = np.array(arriba, dtype=float)
    up /= np.linalg.norm(up)
    e1 = np.cross(up, [0.3, 0.2, 0.9]) if abs(up[2]) < 0.9 else np.cross(up, [1, 0, 0])
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(up, e1)
    for k in range(7):
        a = k / 7 * 2 * math.pi + rng.uniform(-0.2, 0.2)
        d = e1 * math.cos(a) + e2 * math.sin(a)
        p0 = c + up * tam * 0.05
        p1 = c + d * tam * 0.55 + up * tam * 0.12
        p2 = c + d * tam * 1.0 - up * tam * 0.12
        clay.sweep(f'sépalo {k}', [p0, p1, p2], [tam * 0.12, tam * 0.22, tam * 0.02], (1.0, 0.25), coll, verde, segments=8, samples=5,
                   caps=('flat', 'point'), up=tuple(up))
    clay.sweep('tallito', [c, c + up * tam * 0.35 + e1 * tam * 0.05, c + up * tam * 0.6 + e1 * tam * 0.15], tam * 0.07, (1, 1), coll,
               M('tallo fresa', '#4F8A3A', rough=0.5), segments=8)


def fresa_entera(coll, R=0.022, semilla=3):
    """Fresa parada (la punta abajo), con semillas y hojitas."""
    rng = RNG(semilla)
    radios = np.array((R, R, R * 1.25))
    cuerpo = clay.blob('fresa', (0, 0, R * 1.25), (1, 1, 1), coll, mat_piel_fresa(), n=14,
                       shaper=lambda v: forma_fresa(v) * radios)
    bpy.context.view_layer.update()
    pts = []
    n = 90
    for k in range(n):
        y = 1 - (k + 0.5) / n * 1.75
        r = math.sqrt(max(0.0, 1 - y * y))
        a = k * 2.39996
        q = forma_fresa(np.array([[math.cos(a) * r, math.sin(a) * r, y]]))[0] * radios + np.array([0, 0, R * 1.25])
        pts.append(q)
    semillas_en(coll, cuerpo, pts, rng)
    hojas_fresa(coll, (0, 0, R * 1.25 + R * 1.25 * 0.78), R * 0.95, rng)


def fresa_acostada(coll, R=0.022, semilla=3):
    grupo(coll, lambda c: fresa_entera(c, R, semilla), loc=(0, 0, R * 0.95), rot=(0, math.radians(-100), math.radians(-15)))
    return {}


def perfil_corte(t):
    """Ancho de la fresa vista de lado (t: 0 la punta, 1 donde salen las hojas): cónica y con hombros redondos."""
    t = np.clip(t, 0, 1)
    k = 0.08 + 0.92 * (1 - (1 - t) ** 1.8)
    hombro = np.clip((t - 0.8) / 0.2, 0, 1)
    return k * np.sqrt(np.clip(1 - hombro ** 2 * 0.8, 0, 1))


def corte_fresa(coll, tipo, R=0.022):
    """Pedazo de fresa con la cara cortada hacia arriba: mitad (a lo largo), cuarto o lámina.
    La pulpa: corazón blanco alargado, fibras, carne rosada y el borde rojo intenso."""
    H = R * 1.25
    ts = np.linspace(0, 1, 48)
    k = perfil_corte(ts)
    ys = -H + ts * H * 1.72
    grueso = R * (0.92 if tipo != 'lamina' else 0.28)
    lado = 'cuarto' == tipo
    n_u = 30
    verts, faces = [], []
    for j in range(len(ys)):
        for i in range(n_u + 1):
            s = (-1 + 2 * i / n_u) if not lado else i / n_u
            verts.append((s * k[j] * R * 0.995, ys[j], 0.0))
    for j in range(len(ys) - 1):
        for i in range(n_u):
            a = j * (n_u + 1) + i
            faces.append((a, a + 1, a + n_u + 2, a + n_u + 1))
    cara = clay.make_mesh_object('cara', verts, faces, coll,
                                 material=mat_vc('pulpa fresa', rough=0.32, coat=0.2, sss=0.0, brillo_var=0.06,
                                                 ruido=dict(scale=1400, strength=0.15, distance=0.00015)))

    def color(pos):
        x, y = pos[:, 0], pos[:, 1]
        kk = np.interp(y, ys, k) * R + 1e-6
        d = np.clip(np.abs(x) / kk, 0, 1)
        t = (y + H) / (H * 1.72)
        blanco, rosa, carne, rojo = lin('#FBE3DF'), lin('#EE5F6E'), lin('#D8253A'), lin('#A8081E')
        # Fibras blancas que salen del corazón hacia el borde
        ang = np.arctan2(np.abs(x), y + H * 0.35)
        fib = np.clip(np.sin(ang * 30 + np.sin(y * 900) * 0.8) * 2 - 1.2, 0, 1)
        cor = clay.smoothstep(0.26, 0.06, d) * clay.smoothstep(0.08, 0.3, t) * clay.smoothstep(1.0, 0.8, t)
        c = mezcla(carne, rosa, clay.smoothstep(0.7, 0.25, d) * 0.9)
        c = mezcla(c, blanco, np.clip(cor + fib * 0.45 * clay.smoothstep(0.62, 0.2, d) * clay.smoothstep(0.05, 0.25, t), 0, 1))
        c = mezcla(c, rojo, clay.smoothstep(0.66, 0.95, d))
        return c
    pintar(cara, color)
    clay.add_subsurf(cara, 1, 1)

    def shp(v):
        t = np.clip((v[:, 1] + 1) / 2, 0, 1)
        kk = perfil_corte(t)
        x = v[:, 0] * kk * R
        if lado:
            x = np.abs(x)
        y = -H + t * H * 1.72
        z = -np.abs(v[:, 2]) * kk * grueso
        return np.column_stack([x, y, z])
    clay.blob('piel', (0, 0, -0.00025), (1, 1, 1), coll, mat_piel_fresa(), n=14, shaper=shp, subsurf=0)
    if tipo != 'lamina':
        hojas = M('hoja fresa', '#3E9443', rough=0.45, coat=0.2)
        for k_ in range(3):
            clay.blob(f'hojita {k_}', (((k_ - 1) * 0.35 + (0.4 if lado else 0)) * R, H * 0.73, -R * 0.08), (R * 0.2, R * 0.1, R * 0.05), coll, hojas, n=5)


def rodaja_banano(coll):
    R, h = 0.016, 0.006
    piel = M('banano borde', '#EFDB98', rough=0.5, sss=0.3, sss_scale=0.004)
    clay.lathe('rodaja', [(0.0, 0.0), (R * 0.98, 0.0), (R, h * 0.5), (R * 0.98, h), (0.0, h)], coll, piel, segments=48)
    cara = disco_altura('cara banano', R * 0.94, lambda x, y: h + 0.0004 + 0.0005 * np.cos(np.sqrt(x * x + y * y) / R * 3), n_anillos=20,
                        n_seg=72, z_base=h - 0.0005, borde=0.0008, coll=coll, material=mat_vc('pulpa banano', rough=0.35, coat=0.2, sss=0.12), subsurf=1)

    def color(pos):
        r = np.sqrt(pos[:, 0] ** 2 + pos[:, 1] ** 2) / R
        a = np.arctan2(pos[:, 1], pos[:, 0])
        c = mezcla(lin('#FFF4CC'), lin('#F1DF9C'), clay.smoothstep(0.15, 0.85, r))
        estrella = (np.abs(np.sin(a * 1.5)) > 0.85) & (r < 0.28) & (r > 0.08)
        c[estrella] = lin('#7A5A30')
        return c
    pintar(cara, color)


def arandano(coll, R=0.007):
    m = M('arándano', '#2B3C8C', rough=0.55, sss=0.2, sss_scale=0.002, sheen=0.7, sheen_tint='#B7C4F0', sheen_rough=0.3,
          noise=dict(scale=1500, strength=0.08, distance=0.0002))
    clay.blob('arándano', (0, 0, R), (R, R, R * 0.88), coll, m, n=10)
    corona = M('corona arándano', '#1A1E3E', rough=0.6)
    for k in range(5):
        a = k / 5 * 2 * math.pi
        o = clay.blob(f'pétalo {k}', (0, 0, 0), (R * 0.13, R * 0.055, R * 0.06), coll, corona, n=4)
        pieza(o, (math.cos(a) * R * 0.2, math.sin(a) * R * 0.2, R * 1.8), rot=(0, 0, a))


def chantilly(coll, R=0.028, alto=0.044, color='#FFF8EC', vueltas=2.3):
    """Copo de crema con boquilla de estrella: espiral acanalada que sube y termina en piquito."""
    m = mat_crema('chantilly', color)
    pts = []
    n = 70
    for i in range(n + 1):
        t = i / n
        a = t * vueltas * 2 * math.pi
        r = R * 0.66 * (1 - t * 0.9)
        pts.append((math.cos(a) * r, math.sin(a) * r, alto * 0.2 + t * alto * 0.6))

    def estrella(a):
        k = 1 + 0.3 * math.cos(a * 8)
        return math.cos(a) * k, math.sin(a) * k
    clay.sweep('espiral', pts, lambda t: R * 0.3 * (1 - t * 0.45), (1, 1), coll, m, segments=64, samples=3, caps=('round', 'point'),
               profile_fn=estrella, cap_len=2.0, subsurf=1)
    # Base: anillo grueso con estrías
    base = [(math.cos(a) * R * 0.7, math.sin(a) * R * 0.7, alto * 0.15) for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)]
    clay.sweep('anillo', base, R * 0.3, (1, 1), coll, m, segments=64, samples=4, closed=True, profile_fn=estrella)


def bola_helado(coll, color='#FFF3D6', R=0.026, pintas=None):
    m = M(f'helado {color}', color, rough=0.5, sss=0.4, sss_radius=(1, 0.8, 0.6), sss_scale=0.005, noise=dict(scale=260, strength=0.35, distance=0.0012))

    def shp(v):
        z = v[:, 2]
        a = np.arctan2(v[:, 1], v[:, 0])
        onda = 1 + 0.07 * np.sin(a * 7) * clay.smoothstep(-0.1, -0.6, z)
        out = v * np.array([R, R, R * 0.9])
        out[:, 0] *= onda
        out[:, 1] *= onda
        out[:, 2] = np.maximum(out[:, 2], -R * 0.35)
        return out
    clay.blob('helado', (0, 0, R * 0.35), (1, 1, 1), coll, m, n=14, shaper=shp)
    for k in range(3):
        a = k * 2.1 + 0.4
        clay.sweep(f'rizo {k}', [(math.cos(a) * R * 0.5, math.sin(a) * R * 0.5, R * 1.05), (math.cos(a + 0.6) * R * 0.75, math.sin(a + 0.6) * R * 0.75, R * 0.95),
                                 (math.cos(a + 1.2) * R * 0.85, math.sin(a + 1.2) * R * 0.85, R * 0.75)], R * 0.08, (1, 0.6), coll, m, segments=8)
    if pintas:
        rng = RNG(5)
        mp = M(f'pinta helado {pintas}', pintas, rough=0.5)
        for k in range(26):
            a, z = rng.uniform(0, 2 * math.pi), rng.uniform(-0.2, 0.9)
            r = math.sqrt(1 - z * z)
            clay.blob(f'pinta {k}', (math.cos(a) * r * R * 0.99, math.sin(a) * r * R * 0.99, R * 0.35 + z * R * 0.9), (0.0012, 0.0012, 0.0012), coll, mp, n=3,
                      subsurf=0)


def masmelo(coll, color='#FFFFFF'):
    m = M(f'masmelo {color}', color, rough=0.75, sss=0.5, sss_radius=(1, 0.9, 0.9), sss_scale=0.004, sheen=0.4, sheen_tint='#FFFFFF',
          noise=dict(scale=500, strength=0.1, distance=0.0004))
    clay.blob('masmelo', (0, 0, 0.0085), (0.011, 0.011, 0.0085), coll, m, n=10, p=3.0)


def rodaja_kiwi(coll):
    R, h = 0.018, 0.005
    clay.lathe('piel kiwi', [(0.0, 0.0), (R * 0.97, 0.0), (R, h * 0.5), (R * 0.97, h), (0.0, h)], coll,
               M('piel kiwi', '#7A5634', rough=0.85, noise=dict(scale=900, strength=0.4, distance=0.0003)), segments=56)
    cara = disco_altura('cara kiwi', R * 0.92, lambda x, y: h + 0.0003 * np.ones_like(x), n_anillos=26, n_seg=96, z_base=h - 0.0005, borde=0.0006,
                        coll=coll, material=mat_vc('pulpa kiwi', rough=0.3, coat=0.25, sss=0.1), subsurf=1)

    def color(pos):
        r = np.sqrt(pos[:, 0] ** 2 + pos[:, 1] ** 2) / R
        a = np.arctan2(pos[:, 1], pos[:, 0])
        c = mezcla(lin('#F1EDB8'), lin('#86C232'), clay.smoothstep(0.2, 0.42, r))
        c = mezcla(c, lin('#4E8E18'), clay.smoothstep(0.5, 0.95, r))
        rayos = 0.08 * np.sin(a * 46)
        return c * (1 + rayos[:, None] * clay.smoothstep(0.35, 0.6, r)[:, None])
    pintar(cara, color)
    negro = M('semilla kiwi', '#1B1510', rough=0.3, coat=0.6)
    for k in range(34):
        a = k / 34 * 2 * math.pi + (k % 2) * 0.05
        r = R * (0.38 + 0.07 * (k % 3))
        o = clay.blob(f'semilla {k}', (0, 0, 0), (0.0011, 0.0006, 0.0004), coll, negro, n=3, subsurf=0)
        pieza(o, (math.cos(a) * r, math.sin(a) * r, h + 0.0004), rot=(0, 0, a))


def cereza(coll, R=0.011):
    m = M('cereza', '#C2081F', rough=0.08, coat=1.0, coat_rough=0.03, sss=0.3, sss_radius=(1, 0.2, 0.2), sss_scale=0.003)

    def shp(v):
        hoyo = np.exp(-((v[:, 0] ** 2 + v[:, 1] ** 2) / 0.05)) * (v[:, 2] > 0)
        out = v.copy()
        out[:, 2] -= 0.18 * hoyo
        return out * np.array([R, R, R * 0.92])
    clay.blob('cereza', (0, 0, R), (1, 1, 1), coll, m, n=12, shaper=shp)
    clay.sweep('rabito', [(0, 0, R * 1.7), (R * 0.3, 0, R * 2.6), (R * 1.0, 0, R * 3.6)], R * 0.08, (1, 1), coll, M('rabito', '#5C7A2A', rough=0.5),
               segments=8)


def barquillo(coll, L=0.075, R=0.0055):
    m = M('barquillo', '#E2AE62', rough=0.5, coat=0.2, ribs=dict(scale=420, strength=0.5, axis='X', distance=0.0005))
    clay.sweep('barquillo', [(-L / 2, 0, R), (L / 2, 0, R)], R, (1, 1), coll, m, segments=24, samples=8, caps=('flat', 'flat'))
    tost = M('barquillo tostado', '#B9783A', rough=0.5)
    for k in range(9):
        x = -L / 2 + (k + 0.5) * L / 9
        pts = [(x + R * 0.6 * math.sin(t) * 0.3, R * math.cos(t) * 1.02, R + R * math.sin(t) * 1.02) for t in np.linspace(-1.6, 1.6, 8)]
        clay.sweep(f'banda {k}', pts, R * 0.07, (1, 1), coll, tost, segments=5, subsurf=0)


def galleta(coll, R=0.02):
    choco = M('galleta choco', '#2A1A14', rough=0.65, noise=dict(scale=700, strength=0.25, distance=0.0003))
    relleno = M('relleno', '#F6F1E7', rough=0.5)
    clay.lathe('tapa abajo', [(0.0, 0.0), (R, 0.0), (R * 1.01, 0.002), (R, 0.0045), (0.0, 0.0045)], coll, choco, segments=64)
    clay.lathe('relleno', [(0.0, 0.0045), (R * 0.93, 0.0045), (R * 0.95, 0.0065), (R * 0.93, 0.0085), (0.0, 0.0085)], coll, relleno, segments=64)

    def alt(x, y):
        r = np.sqrt(x * x + y * y)
        a = np.arctan2(y, x)
        patron = 0.0005 * (np.sin(a * 12) * np.sin(r / R * 18) > 0.3)
        anillo = 0.0006 * ((r > R * 0.78) & (r < R * 0.86))
        return 0.0035 + patron + anillo
    disco_altura('tapa arriba', R, alt, n_anillos=34, n_seg=128, z_base=0.0085, borde=0.0015, coll=coll, material=choco)


def mantequilla(coll):
    m = M('mantequilla', '#FBE38A', rough=0.3, sss=0.4, sss_scale=0.004, coat=0.3)
    charco = M('mantequilla derretida', '#F6CF55', rough=0.06, coat=1.0)
    clay.blob('charco', (0.002, -0.002, 0.0005), (0.022, 0.018, 0.0012), coll, charco, n=8)

    def shp(v):
        out = v.copy()
        out[:, 2] -= 0.25 * np.abs(v[:, 0]) * (v[:, 2] < 0)
        return out * np.array([0.012, 0.0105, 0.0055])
    clay.blob('pastilla', (0, 0, 0.0055), (1, 1, 1), coll, m, n=8, p=3.2, shaper=shp)


def menta(coll):
    verde = M('menta', '#46A847', rough=0.4, sss=0.3, sss_radius=(0.3, 1.0, 0.3), sss_scale=0.003, coat=0.3,
              noise=dict(scale=600, strength=0.2, distance=0.0002))
    for k, (a, L) in enumerate([(-0.55, 0.026), (0.6, 0.024), (2.4, 0.018)]):
        d = np.array([math.cos(a), math.sin(a), 0.0])
        p0 = np.array([0, 0, 0.002])
        pts = [p0, p0 + d * L * 0.45 + np.array([0, 0, 0.004]), p0 + d * L]
        clay.sweep(f'hoja {k}', pts, [L * 0.05, L * 0.3, L * 0.01], (1.0, 0.12), coll, verde, segments=10, samples=6, caps=('flat', 'point'),
                   up=(0, 0, 1))
        clay.sweep(f'nervio {k}', [p0 + np.array([0, 0, 0.0012]), p0 + d * L * 0.8 + np.array([0, 0, 0.004])], 0.0004, (1, 1), coll,
                   M('nervio menta', '#2F7A33', rough=0.5), segments=4, subsurf=0)
    clay.sweep('tallo', [(0, 0, 0.002), (-0.006, -0.004, 0.0015), (-0.011, -0.009, 0.001)], 0.0011, (1, 1), coll, M('tallo menta', '#3D8A3A', rough=0.5),
               segments=6)


# ---------------------------------------------------------------------------
# Bandeja de toppings: coquitas, frascos, saleros y teteros de salsa
# ---------------------------------------------------------------------------

def coquita(coll, R=0.045, H=0.032, color='#FFFFFF', borde='#E9B9A2'):
    """Coquita de loza (ramekin) acanalada por fuera, vacía. Devuelve la altura del borde."""
    loza = mat_ceramica(f'coquita {color}', color)
    clay.lathe('coquita', [(0.0, 0.0), (R * 0.86, 0.0), (R * 0.92, 0.003), (R, H * 0.9), (R * 1.02, H), (R * 0.95, H), (R * 0.92, H * 0.3),
                           (R * 0.85, 0.006), (0.0, 0.006)], coll, loza, segments=96, cap_top=False)
    for k in range(28):
        a = k / 28 * 2 * math.pi
        tubo(f'estría {k}', [(math.cos(a) * R * 0.93, math.sin(a) * R * 0.93, 0.006), (math.cos(a) * R * 1.005, math.sin(a) * R * 1.005, H * 0.88)],
             0.0016, coll, loza, seg=6, subsurf=0, samples=2)
    clay.lathe('filo', [(R * 1.0, H * 0.97), (R * 1.025, H * 1.0), (R * 0.96, H * 1.01)], coll, M(f'filo {borde}', borde, rough=0.2, coat=0.6),
               segments=96, cap_top=False, cap_bottom=False)
    return H


def montoncito(coll, construir, n, R, z0, rng, esc=1.0, alto=0.012, rot_libre=True):
    """Riega n piezas en un montoncito dentro de una coquita de radio R."""
    for k in range(n):
        a = rng.uniform(0, 2 * math.pi)
        r = R * 0.72 * math.sqrt(rng.uniform(0, 1))
        z = z0 + alto * (1 - (r / (R * 0.75)) ** 2) * rng.uniform(0.6, 1.0)
        rot = (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(0, 2 * math.pi)) if rot_libre else (0, 0, rng.uniform(0, 6.28))
        grupo(coll, construir, loc=(math.cos(a) * r, math.sin(a) * r, z), rot=rot, esc=esc)


def construir_bin(cual):
    def f(coll):
        rng = RNG(sum(map(ord, cual)))
        R, H = 0.045, 0.032
        if cual == 'chantilly':
            coquita(coll, R, H, '#FFFFFF', '#9FD3E0')
            clay.blob('crema base', (0, 0, H * 0.85), (R * 0.95, R * 0.95, 0.008), coll, mat_crema(), n=10)
            grupo(coll, chantilly, loc=(0, 0, H * 0.8), esc=1.25)
            return {}
        if cual == 'helado':
            # Tarrito de helado con una bola encima
            carton = mat_plastico('tarro helado', '#FFF6E8', 0.4, 0.2)
            clay.lathe('tarro', [(0.0, 0.0), (R * 0.82, 0.0), (R * 0.95, H * 1.2), (R * 0.9, H * 1.2), (0.0, H * 1.18)], coll, carton, segments=64)
            etiqueta('banda', R * 0.88, H * 0.35, H * 0.85, coll, M('banda helado', '#F59AB2', rough=0.4), r1=R * 0.93)
            grupo(coll, lambda c: bola_helado(c, '#FFF1CC', pintas='#3A2414'), loc=(0, 0, H * 1.15), esc=1.4)
            return {}
        if cual == 'mantequilla':
            # Mantequillera de loza con su bloque
            loza = mat_ceramica('mantequillera', '#FFFFFF')
            clay.rbox('bandejita', (0, 0, 0.004), (R * 1.1, R * 0.75, 0.004), coll, loza, p=5, n=6)
            clay.rbox('bloque', (0, 0, 0.018), (R * 0.65, R * 0.4, 0.012), coll, M('mantequilla', '#FBE38A', rough=0.3, sss=0.4, sss_scale=0.004, coat=0.3),
                      p=5, n=6)
            clay.rbox('cuchillito', (R * 0.3, -R * 0.55, 0.011), (R * 0.75, 0.004, 0.0015), coll, mat_metal('cuchillito'), p=3, n=4)
            return {}
        if cual == 'barquillo':
            vaso = mat_ceramica('vasito', '#FFFFFF')
            clay.lathe('vasito', [(0.0, 0.0), (R * 0.6, 0.0), (R * 0.7, H * 1.6), (R * 0.64, H * 1.6), (R * 0.55, 0.004), (0.0, 0.004)], coll, vaso, segments=64,
                       cap_top=False)
            for k in range(6):
                a = k / 6 * 2 * math.pi
                grupo(coll, barquillo, loc=(math.cos(a) * R * 0.25, math.sin(a) * R * 0.25, H * 1.7), rot=(0, math.radians(90 - 12), a), esc=1.0)
            return {}
        if cual == 'galleta':
            loza = mat_ceramica('platico', '#FFFFFF')
            clay.lathe('platico', [(0.0, 0.0), (R, 0.0), (R * 1.15, 0.006), (R * 1.1, 0.007), (0.0, 0.004)], coll, loza, segments=64)
            for k in range(4):
                grupo(coll, galleta, loc=(rng.uniform(-0.003, 0.003), rng.uniform(-0.003, 0.003), 0.005 + k * 0.0125), rot=(0, 0, rng.uniform(0, 6)), esc=1.2)
            return {}
        if cual == 'menta':
            coquita(coll, R, H, '#FFFFFF', '#8FCB8A')
            for k in range(7):
                a = k / 7 * 2 * math.pi
                grupo(coll, menta, loc=(math.cos(a) * R * 0.3, math.sin(a) * R * 0.3, H * 0.8 + rng.uniform(0, 0.006)), rot=(rng.uniform(-0.3, 0.3), 0, a), esc=1.3)
            return {}
        if cual == 'cereza':
            vidrio = mat_vidrio('frasco cerezas')
            clay.lathe('frasco', [(0.0, 0.0), (R * 0.8, 0.0), (R * 0.85, 0.005), (R * 0.85, H * 1.6), (R * 0.7, H * 1.75), (R * 0.68, H * 1.9),
                                  (R * 0.65, H * 1.9), (R * 0.67, H * 1.75), (R * 0.82, H * 1.6), (R * 0.82, 0.007), (0.0, 0.006)], coll, vidrio,
                       segments=64, cap_top=False)
            clay.lathe('almíbar', [(0.0, 0.007), (R * 0.81, 0.007), (R * 0.81, H * 1.3), (0.0, H * 1.3)], coll, mat_liquido('almíbar cereza', '#D0203A', 0.55),
                       segments=64)
            montoncito(coll, cereza, 9, R * 0.95, 0.009, rng, esc=1.0, alto=0.03)
            for k in range(4):
                grupo(coll, cereza, loc=((k - 1.5) * 0.012, rng.uniform(-0.01, 0.01), H * 1.85), rot=(0, 0, rng.uniform(0, 6)))
            return {}
        coquita(coll, R, H)
        z0 = H * 0.55
        piezas = {
            'fresa': (lambda c: corte_fresa(c, 'mitad'), 11, 0.85),
            'fresa_entera': (lambda c: fresa_acostada(c, 0.02, rng.integers(0, 99)), 6, 0.85),
            'banano': (rodaja_banano, 12, 1.0),
            'arandano': (arandano, 34, 1.0),
            'kiwi': (rodaja_kiwi, 9, 0.95),
            'masmelo': (lambda c: masmelo(c, '#FFFDF8' if rng.uniform() < 0.5 else '#FFC6D9'), 16, 0.9),
        }[cual]
        montoncito(coll, piezas[0], piezas[1], R, z0, rng, piezas[2], alto=0.016)
        return {}
    return f


def tetero(coll, color_liquido, tapa, etiqueta_c, R=0.024, H=0.12, opaco=False):
    """Tetero de salsa (botella de apretar) con pico de dosificar."""
    cuerpo = mat_plastico_claro('tetero', '#FFFFFF', 0.12) if not opaco else mat_plastico('tetero opaco', color_liquido, 0.3, 0.4)
    clay.lathe('botella', [(0.0, 0.0), (R * 0.9, 0.0), (R, 0.006), (R * 1.02, H * 0.8), (R * 0.85, H * 0.92), (R * 0.55, H), (0.0, H)], coll, cuerpo,
               segments=64)
    if not opaco:
        clay.lathe('salsa', [(0.0, 0.004), (R * 0.95, 0.004), (R * 0.97, H * 0.72), (0.0, H * 0.72)], coll, mat_salsa(f'salsa {color_liquido}', color_liquido),
                   segments=64)
    clay.lathe('tapa', [(0.0, H - 0.002), (R * 0.62, H - 0.002), (R * 0.66, H + 0.014), (R * 0.4, H + 0.018), (0.0, H + 0.018)], coll,
               mat_plastico(f'tapa {tapa}', tapa), segments=48)
    clay.lathe('pico', [(0.0, H + 0.018), (R * 0.28, H + 0.018), (R * 0.08, H + 0.045), (0.0, H + 0.046)], coll, mat_plastico(f'tapa {tapa}', tapa),
               segments=32)
    etiqueta('etiqueta', R * 1.012, H * 0.3, H * 0.62, coll, M(f'etiqueta {etiqueta_c}', etiqueta_c, rough=0.45), a0=-math.pi * 0.95, a1=-math.pi * 0.05)


def osito_miel(coll):
    """El tetero de miel en forma de osito (clásico): plástico ámbar con la miel adentro y tapita amarilla."""
    miel = M('miel', '#E89B12', rough=0.05, transmission=0.55, ior=1.45, sss=0.4, sss_scale=0.01, coat=0.9)
    clay.blob('panza', (0, 0, 0.035), (0.03, 0.026, 0.035), coll, miel, n=10)
    clay.blob('cabeza', (0, 0, 0.083), (0.022, 0.02, 0.019), coll, miel, n=10)
    for s in (-1, 1):
        clay.blob(f'oreja {s}', (s * 0.016, 0, 0.1), (0.007, 0.005, 0.007), coll, miel, n=6)
        clay.blob(f'brazo {s}', (s * 0.027, -0.012, 0.05), (0.008, 0.008, 0.014), coll, miel, n=6)
        clay.blob(f'pata {s}', (s * 0.016, -0.015, 0.01), (0.009, 0.011, 0.008), coll, miel, n=6)
    clay.blob('hocico', (0, -0.018, 0.08), (0.008, 0.006, 0.006), coll, miel, n=6)
    tapa = mat_plastico('tapa miel', '#FFD23F')
    clay.lathe('tapa', [(0.0, 0.098), (0.01, 0.098), (0.011, 0.112), (0.006, 0.116), (0.0, 0.116)], coll, tapa, segments=32)
    clay.lathe('pico', [(0.0, 0.116), (0.004, 0.116), (0.0015, 0.13), (0.0, 0.13)], coll, tapa, segments=16)
    clay.rbox('etiqueta', (0, -0.024, 0.035), (0.017, 0.003, 0.013), coll, M('etiqueta miel', '#FFF4D6', rough=0.5), p=4, n=4)
    for s in (-1, 1):
        clay.blob(f'ojo {s}', (s * 0.007, -0.0185, 0.088), (0.0018, 0.001, 0.0018), coll, M('ojo', '#2B1A0E', rough=0.3), n=4)


def frasco(coll, contenido, tapa, R=0.03, H=0.07, nivel=0.8, cuchara=False, trapo=None):
    vidrio = mat_vidrio('frasco')
    clay.lathe('frasco', [(0.0, 0.0), (R * 0.92, 0.0), (R, 0.006), (R, H * 0.85), (R * 0.85, H * 0.95), (R * 0.85, H), (R * 0.82, H),
                          (R * 0.82, H * 0.95), (R * 0.97, H * 0.85), (R * 0.97, 0.008), (0.0, 0.007)], coll, vidrio, segments=64, cap_top=False)
    clay.lathe('contenido', [(0.0, 0.007), (R * 0.965, 0.007), (R * 0.965, H * nivel), (R * 0.5, H * nivel + 0.002), (0.0, H * nivel + 0.003)], coll,
               contenido, segments=64)
    if trapo:
        tela = M(f'trapo {trapo}', trapo, rough=0.9, ribs=dict(scale=600, strength=0.3, axis='X', distance=0.0003))
        clay.blob('trapo', (0, 0, H + 0.004), (R * 1.25, R * 1.25, 0.006), coll, tela, n=8,
                  shaper=lambda v: v + np.array([0, 0, -0.5]) * np.clip(np.sqrt(v[:, 0:1] ** 2 + v[:, 1:2] ** 2) - 0.7, 0, 1) * 3)
        clay.lathe('cinta', [(R * 0.88, H * 0.93), (R * 0.9, H * 0.93), (R * 0.9, H * 0.98), (R * 0.88, H * 0.98)], coll, M('cinta', '#C8102E', rough=0.6),
                   segments=48, cap_top=False, cap_bottom=False)
    elif tapa:
        clay.lathe('tapa', [(0.0, H - 0.001), (R * 0.9, H - 0.001), (R * 0.92, H + 0.012), (R * 0.85, H + 0.014), (0.0, H + 0.014)], coll,
                   mat_metal(f'tapa {tapa}', tapa, 0.25) if tapa.startswith('#C') else mat_plastico(f'tapa {tapa}', tapa), segments=64)
    if cuchara:
        madera = mat_madera('cuchara', '#C8935A', 80)
        tubo('mango cuchara', [(R * 0.2, 0, H * nivel - 0.01), (R * 0.45, 0.005, H + 0.02), (R * 0.75, 0.01, H + 0.06)], 0.003, coll, madera, seg=8)


def salero(coll, cuerpo_c, contenido, R=0.022, H=0.07, malla=False):
    """Salero/espolvoreador: frasco con tapa de huequitos (o de malla para el azúcar glas)."""
    vidrio = mat_vidrio('salero')
    clay.lathe('salero', [(0.0, 0.0), (R * 0.9, 0.0), (R, 0.005), (R, H * 0.82), (R * 0.9, H * 0.9), (0.0, H * 0.9)], coll, vidrio, segments=64)
    clay.lathe('polvo', [(0.0, 0.006), (R * 0.95, 0.006), (R * 0.95, H * 0.62), (0.0, H * 0.64)], coll, contenido, segments=64)
    acero = mat_metal('tapa salero', cuerpo_c, 0.22)
    if malla:
        clay.lathe('tapa', [(0.0, H * 0.86), (R * 0.95, H * 0.86), (R, H * 0.93), (R * 0.85, H * 1.05), (R * 0.4, H * 1.12), (0.0, H * 1.13)], coll,
                   M('malla', cuerpo_c, rough=0.35, metallic=1.0, ribs=dict(scale=900, strength=0.6, axis='X', distance=0.0004)), segments=64)
    else:
        clay.lathe('tapa', [(0.0, H * 0.86), (R * 0.95, H * 0.86), (R, H * 0.95), (R * 0.96, H * 1.04), (0.0, H * 1.05)], coll, acero, segments=64)
        negro = M('huequito', '#2A2A2A', rough=0.6)
        for k in range(7):
            a = k / 7 * 2 * math.pi
            r = R * 0.5 if k else 0.0
            clay.blob(f'hueco {k}', (math.cos(a) * r, math.sin(a) * r, H * 1.05), (0.0017, 0.0017, 0.0006), coll, negro, n=3, subsurf=0)


def tazon_polvo(coll, contenido, tipo, rng):
    """Coquita con un polvo/rallado amontonado (queso, galleta triturada, coco)."""
    R, H = 0.045, 0.032
    coquita(coll, R, H)
    clay.blob('montón', (0, 0, H * 0.72), (R * 0.88, R * 0.88, 0.012), coll, contenido, n=10)
    if tipo == 'queso':
        m = M('queso rallado', '#F6DE8C', rough=0.45, sss=0.3, sss_scale=0.003)
        for k in range(70):
            a, r = rng.uniform(0, 6.28), R * 0.8 * math.sqrt(rng.uniform(0, 1))
            z = H * 0.72 + 0.012 * (1 - (r / R) ** 2) + rng.uniform(0, 0.004)
            o = clay.blob(f'tirita {k}', (0, 0, 0), (0.006, 0.0012, 0.0009), coll, m, n=3, subsurf=0)
            pieza(o, (math.cos(a) * r, math.sin(a) * r, z), rot=(rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), rng.uniform(0, 6.28)))
    elif tipo == 'galleta':
        osc, cl = M('miga oscura', '#2D1C16', rough=0.7), M('miga crema', '#F2ECE2', rough=0.6)
        for k in range(60):
            a, r = rng.uniform(0, 6.28), R * 0.8 * math.sqrt(rng.uniform(0, 1))
            z = H * 0.72 + 0.012 * (1 - (r / R) ** 2) + rng.uniform(0, 0.003)
            s = rng.uniform(0.0015, 0.0035)
            clay.rbox(f'miga {k}', (math.cos(a) * r, math.sin(a) * r, z), (s, s * 0.8, s * 0.6), coll, osc if k % 4 else cl, p=3, n=3, subsurf=0)
    elif tipo == 'coco':
        m = M('coco', '#FFFDF6', rough=0.6, sss=0.2)
        for k in range(80):
            a, r = rng.uniform(0, 6.28), R * 0.8 * math.sqrt(rng.uniform(0, 1))
            z = H * 0.72 + 0.012 * (1 - (r / R) ** 2) + rng.uniform(0, 0.004)
            o = clay.blob(f'hojuela {k}', (0, 0, 0), (0.004, 0.0012, 0.0005), coll, m, n=3, subsurf=0)
            pieza(o, (math.cos(a) * r, math.sin(a) * r, z), rot=(rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), rng.uniform(0, 6.28)))


def frasco_chispitas(coll, rng):
    R, H = 0.026, 0.075
    vidrio = mat_vidrio('frasco chispas')
    clay.lathe('frasco', [(0.0, 0.0), (R * 0.9, 0.0), (R, 0.005), (R, H * 0.85), (R * 0.9, H * 0.92), (0.0, H * 0.92)], coll, vidrio, segments=64)
    colores = ['#FF5D8F', '#FFD23F', '#3EC1D3', '#7ED957', '#B57CFF', '#FF8C42']
    mats = [M(f'chispa {c}', c, rough=0.3, coat=0.4) for c in colores]
    for k in range(260):
        a, r = rng.uniform(0, 6.28), R * 0.9 * math.sqrt(rng.uniform(0, 1))
        z = rng.uniform(0.007, H * 0.68)
        o = clay.blob(f'chispa {k}', (0, 0, 0), (0.0032, 0.0011, 0.0011), coll, mats[k % 6], n=3, subsurf=0)
        pieza(o, (math.cos(a) * r, math.sin(a) * r, z), rot=(rng.uniform(0, 6.28), rng.uniform(0, 6.28), rng.uniform(0, 6.28)))
    tapa = mat_plastico('tapa chispas', '#FF8FB8')
    clay.lathe('tapa', [(0.0, H * 0.88), (R * 1.02, H * 0.88), (R * 1.04, H), (R * 0.9, H * 1.04), (0.0, H * 1.05)], coll, tapa, segments=64)
    negro = M('huequito', '#2A2A2A', rough=0.6)
    for k in range(5):
        a = k / 5 * 2 * math.pi
        clay.blob(f'hueco {k}', (math.cos(a) * R * 0.45, math.sin(a) * R * 0.45, H * 1.045), (0.0022, 0.0022, 0.0006), coll, negro, n=3, subsurf=0)


SALSAS = {
    # color de la salsa, tapa, etiqueta
    'chocolate': ('#4A2414', '#5A2E18', '#F2D9B8'),
    'leche_condensada': ('#F4E3BC', '#E33B4C', '#2A63B8'),
    'caramelo': ('#C77C24', '#8A4E14', '#FFE8B8'),
}


def construir_salsa(cual):
    def f(coll):
        if cual == 'miel':
            osito_miel(coll)
        elif cual == 'arequipe':
            frasco(coll, mat_salsa('arequipe', '#A8611F'), None, R=0.03, H=0.065, nivel=0.82, cuchara=True, trapo='#E9483C')
        else:
            c, t, e = SALSAS[cual]
            tetero(coll, c, t, e)
        return {}
    return f


def construir_polvo(cual):
    def f(coll):
        rng = RNG(sum(map(ord, cual)) + 7)
        if cual == 'chispitas':
            frasco_chispitas(coll, rng)
        elif cual == 'azucar':
            salero(coll, '#D9DEE2', M('azúcar glas', '#FFFFFF', rough=0.8, sss=0.2), malla=True)
        elif cual == 'canela':
            salero(coll, '#C9CED2', M('canela', '#9A5326', rough=0.85))
        elif cual == 'queso':
            tazon_polvo(coll, M('queso base', '#F3D97F', rough=0.5, sss=0.2), 'queso', rng)
        elif cual == 'galleta_triturada':
            tazon_polvo(coll, M('miga base', '#3A261C', rough=0.7), 'galleta', rng)
        elif cual == 'coco':
            tazon_polvo(coll, M('coco base', '#FBF8EE', rough=0.6), 'coco', rng)
        return {}
    return f


# ---------------------------------------------------------------------------
# Vasos, bebidas, hielo
# ---------------------------------------------------------------------------

VASOS_JUGO = {'P': (0.028, 0.035, 0.09), 'M': (0.031, 0.04, 0.11), 'G': (0.034, 0.045, 0.135)}
VASOS_FRESAS = {'P': (0.03, 0.042, 0.085), 'M': (0.034, 0.048, 0.1), 'G': (0.038, 0.054, 0.115)}
VASOS_FRAPPE = {'P': (0.03, 0.042, 0.12), 'M': (0.032, 0.046, 0.14), 'G': (0.034, 0.05, 0.16)}


def construir_vaso_jugo(tam):
    def f(coll):
        rb, rt, h = VASOS_JUGO[tam]
        vidrio = mat_vidrio('vaso jugo', '#F7FCFF', 0.015)
        # Base gruesa de vidrio y paredes con facetas suaves abajo
        clay.lathe('vaso', [(0.0, 0.0), (rb * 0.95, 0.0), (rb, 0.003), (rt, h), (rt + 0.0012, h + 0.0008), (rt - 0.0018, h + 0.0004),
                            (rb - 0.002, 0.011), (rb * 0.5, 0.0095), (0.0, 0.009)], coll, vidrio, segments=96, cap_top=False, cap_bottom=False)
        return {'r_abajo': rb, 'r_arriba': rt, 'alto': h, 'fondo': 0.0095}
    return f


def construir_vaso_plastico(tabla, tam, logo=None):
    def f(coll):
        rb, rt, h = tabla[tam]
        pl = mat_plastico_claro('vaso pet', '#FCFEFF', 0.06)
        clay.lathe('vaso', [(0.0, 0.0), (rb * 0.96, 0.0), (rb, 0.002), (rt, h), (rt + 0.0016, h + 0.0012), (rt + 0.0008, h + 0.0022),
                            (rt - 0.0008, h + 0.0012), (rt - 0.0008, h), (rb - 0.0008, 0.0012), (0.0, 0.0012)], coll, pl, segments=128, cap_top=False,
                   cap_bottom=False)
        # Estrías finitas en el cuerpo (se ven como reflejos verticales)
        for k in range(40):
            a = k / 40 * 2 * math.pi
            tubo(f'estría {k}', [(math.cos(a) * (rb + 0.0006), math.sin(a) * (rb + 0.0006), 0.004),
                                 (math.cos(a) * (rt * 0.92 + rb * 0.08 + 0.0006), math.sin(a) * (rt * 0.92 + rb * 0.08 + 0.0006), h * 0.9)],
                 0.0005, coll, pl, seg=5, subsurf=0, samples=2)
        if logo:
            # Calcomanía: una fresita (o un copito) estampada al frente
            mlogo = M(f'logo {logo}', logo, rough=0.4, coat=0.3)
            zc = h * 0.42
            rr = rb + (rt - rb) * 0.42 + 0.0009
            for k, (dx, dz, sx, sz) in enumerate(((0, 0, 0.007, 0.009), (-0.002, 0.009, 0.004, 0.0025), (0.002, 0.009, 0.004, 0.0025))):
                col = mlogo if k == 0 else M('logo hoja', '#3FA34D', rough=0.4)
                o = clay.blob(f'logo {k}', (dx, -rr, zc + dz), (sx, 0.0006, sz), coll, col, n=5)
            m_txt = M('logo letra', '#FFFFFF', rough=0.4)
            for k in range(3):
                clay.blob(f'punto {k}', ((k - 1) * 0.0028, -rr - 0.0004, zc + 0.001), (0.0007, 0.0004, 0.0007), coll, m_txt, n=3, subsurf=0)
        return {'r_abajo': rb, 'r_arriba': rt, 'alto': h, 'fondo': 0.0012}
    return f


def cubo_hielo(coll, s=0.012, semilla=0):
    rng = RNG(semilla)
    hielo = sin_sombra(M('hielo', '#F4FBFF', rough=0.12, transmission=0.92, ior=1.31, noise=dict(scale=300, strength=0.3, distance=0.0006)))

    def shp(v):
        return v * np.array([s, s * 0.95, s * 0.9]) + rng.normal(0, s * 0.03, v.shape)
    o = clay.blob('cubo', (0, 0, 0), (1, 1, 1), coll, hielo, n=6, p=4.5, shaper=shp)
    pieza(o, (0, 0, s * 0.9), rot=(rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, 1.5)))
    # Burbujas blancas adentro
    blanco = M('burbuja hielo', '#FFFFFF', rough=0.5, alpha=1.0)
    for k in range(5):
        clay.blob(f'burbuja {k}', tuple(rng.uniform(-s * 0.4, s * 0.4, 3) + np.array([0, 0, s * 0.9])), (s * 0.08, s * 0.08, s * 0.08), coll, blanco, n=3,
                  subsurf=0)


def construir_hielera(coll):
    """Balde de hielo de acero con asas, lleno de cubos, y unas pinzas."""
    rng = RNG(9)
    acero = mat_cepillado('balde', '#C8CDD1')
    R, H = 0.075, 0.075
    clay.lathe('balde', [(0.0, 0.0), (R * 0.85, 0.0), (R * 0.88, 0.004), (R, H), (R * 1.03, H + 0.002), (R * 0.97, H + 0.002), (R * 0.86, 0.006),
                         (0.0, 0.006)], coll, acero, segments=96, cap_top=False)
    for s in (-1, 1):
        tubo(f'asa {s}', [(s * R * 1.0, -0.015, H * 0.75), (s * R * 1.15, -0.01, H * 0.8), (s * R * 1.15, 0.01, H * 0.8), (s * R * 1.0, 0.015, H * 0.75)],
             0.0025, coll, acero, seg=8)
    for k in range(26):
        a, r = rng.uniform(0, 6.28), R * 0.78 * math.sqrt(rng.uniform(0, 1))
        z = H * 0.72 + 0.01 * (1 - (r / R) ** 2) + rng.uniform(-0.004, 0.006)
        grupo(coll, lambda c, k=k: cubo_hielo(c, 0.011, k), loc=(math.cos(a) * r, math.sin(a) * r, z))
    pinza = mat_metal('pinza', '#D6DADD', 0.15)
    for s in (-1, 1):
        tubo(f'pinza {s}', [(R * 0.2, -R * 0.2 + s * 0.004, H * 0.95), (R * 0.75, -R * 0.55 + s * 0.006, H * 1.05), (R * 1.3, -R * 0.75 + s * 0.012, H * 1.0)],
             0.0022, coll, pinza, seg=8)
    return {}


JUGOS = {'naranja': '#FF9418', 'mora': '#6E0E35', 'cafe': '#A87445', 'chocolate': '#5A2E18', 'lulo': '#C3C23E'}


def construir_tanque(sabor):
    """Una sección de la máquina de jugos: base de acero con su llave al frente y el tanque de vidrio con el jugo."""
    def f(coll):
        acero = mat_cepillado('dispensador', '#C5CACE')
        negro = mat_plastico('dispensador negro', '#2A2B2E', 0.35)
        W, D = 0.07, 0.07
        clay.rbox('base', (0, 0, 0.06), (W, D, 0.06), coll, acero, p=8, n=6)
        clay.rbox('bandeja', (0, -D * 0.6, 0.006), (W * 0.9, D * 0.55, 0.006), coll, negro, p=6, n=5)
        for k in range(7):
            clay.rbox(f'rejilla {k}', (-W * 0.75 + k * W * 0.25, -D * 0.6, 0.0125), (0.0035, D * 0.5, 0.0012), coll, acero, p=4, n=3, subsurf=0)
        # Llave: palanca negra con la boquilla
        clay.rbox('soporte llave', (0, -D * 1.02, 0.1), (0.016, 0.01, 0.014), coll, negro, p=4, n=4)
        clay.rbox('palanca', (0, -D * 1.12, 0.122), (0.008, 0.006, 0.03), coll, mat_plastico(f'palanca {sabor}', JUGOS[sabor]), p=4, n=4)
        clay.lathe('boquilla', [(0.0, 0.07), (0.005, 0.07), (0.006, 0.085), (0.0, 0.086)], coll, negro, segments=16).location = (0, -D * 1.06, 0.0)
        # Tanque de vidrio con el jugo y la tapa
        vidrio = mat_vidrio('tanque', '#F6FBFF', 0.02)
        clay.rbox('tanque', (0, 0, 0.12 + 0.1), (W * 0.92, D * 0.92, 0.1), coll, vidrio, p=8, n=6)
        clay.rbox('jugo', (0, 0, 0.12 + 0.08), (W * 0.88, D * 0.88, 0.078), coll,
                  M(f'jugo {sabor}', JUGOS[sabor], rough=0.12, sss=0.5, sss_radius=(1, 0.6, 0.3), sss_scale=0.02, coat=0.5, transmission=0.1), p=8, n=6)
        clay.rbox('tapa', (0, 0, 0.12 + 0.205), (W * 0.95, D * 0.95, 0.008), coll, negro, p=8, n=5)
        tubo('agitador', [(0, 0, 0.13), (0, 0, 0.3)], 0.002, coll, acero, seg=6)
        clay.rbox('paleta', (0, 0, 0.17), (0.025, 0.002, 0.03), coll, acero, p=4, n=3)
        return {'puntos': {'boca': (0, -D * 1.06, 0.07)}}
    return f


# ---------------------------------------------------------------------------
# Fresería: tabla, canasta, cuchillo, bol, batidora, varilla, ingredientes
# ---------------------------------------------------------------------------

def construir_tabla(coll):
    madera = mat_madera('tabla', '#D9A065', escala=10, fuerza=0.14)
    W, D, H = 0.21, 0.135, 0.018
    clay.rbox('tabla', (0, 0, H / 2), (W, D, H / 2), coll, madera, p=8, n=8)
    # Canal para el jugo alrededor
    pts = [(-W * 0.88, -D * 0.82, H), (W * 0.88, -D * 0.82, H), (W * 0.88, D * 0.82, H), (-W * 0.88, D * 0.82, H)]
    clay.sweep('canal', [(x, y, H - 0.0016) for x, y, _ in pts], 0.0035, (1, 0.5), coll, M('canal', '#9C6537', rough=0.7), segments=10, samples=10,
               closed=True)
    # Huequito para colgar y quemaduras de cuchillo (rayitas)
    clay.lathe('hueco', [(0.0, H + 0.0001), (0.009, H + 0.0001)], coll, M('hueco tabla', '#6B4423', rough=0.8), segments=32).location = (W * 0.93 - 0.02, 0, 0)
    rng = RNG(4)
    raya = M('rayita tabla', '#B98249', rough=0.7)
    for k in range(14):
        x, y, a = rng.uniform(-W * 0.6, W * 0.6), rng.uniform(-D * 0.6, D * 0.6), rng.uniform(0, 3.14)
        L = rng.uniform(0.01, 0.03)
        tubo(f'rayita {k}', [(x, y, H + 0.0002), (x + math.cos(a) * L, y + math.sin(a) * L, H + 0.0002)], 0.0004, coll, raya, seg=4, subsurf=0,
             samples=2)
    return {'superficie': H}


def construir_canasta(coll):
    rng = RNG(21)
    mimbre = M('mimbre', '#C99556', rough=0.7, ribs=dict(scale=700, strength=0.7, axis='Z', distance=0.0012),
               noise=dict(scale=120, strength=0.3, distance=0.001))
    W, D, H = 0.1, 0.07, 0.055
    clay.blob('canasta', (0, 0, H / 2), (W, D, H / 2), coll, mimbre, n=10, p=3.2,
              shaper=lambda v: v * np.where(v[:, 2:3] > 0.9, np.array([1, 1, 1]), np.array([1, 1, 1])))
    clay.sweep('borde', [(math.cos(a) * W * 1.0, math.sin(a) * D * 1.0, H) for a in np.linspace(0, 2 * math.pi, 28, endpoint=False)], 0.006, (1, 1),
               coll, M('mimbre borde', '#A8733E', rough=0.7, ribs=dict(scale=900, strength=0.6, axis='X', distance=0.001)), segments=10, samples=4,
               closed=True)
    tela = M('cuadros', '#E8434F', rough=0.9)
    clay.blob('mantel', (-W * 0.55, -D * 0.6, H * 0.95), (0.03, 0.02, 0.012), coll, tela, n=6)
    for k in range(13):
        a, r = rng.uniform(0, 6.28), math.sqrt(rng.uniform(0, 1))
        x, y = math.cos(a) * r * W * 0.7, math.sin(a) * r * D * 0.65
        z = H * 0.82 + 0.012 * (1 - r * r) + rng.uniform(0, 0.008)
        grupo(coll, lambda c, k=k: fresa_entera(c, 0.018, k), loc=(x, y, z), rot=(rng.uniform(-1.6, -0.9), rng.uniform(-0.4, 0.4), rng.uniform(0, 6.28)))
    tubo('asa', [(-W * 0.95, 0, H), (-W * 0.6, 0, H + 0.07), (W * 0.6, 0, H + 0.07), (W * 0.95, 0, H)], 0.005, coll, mimbre, seg=10)
    return {}


def construir_cuchillo(coll):
    """Cuchillo de chef acostado (filo hacia abajo de la imagen, punta a la derecha)."""
    acero = M('hoja cuchillo', '#D7DCE0', rough=0.18, metallic=1.0)
    filo = M('filo', '#F1F4F6', rough=0.08, metallic=1.0)
    L, A = 0.16, 0.038
    verts, faces = [], []
    n = 30
    for i in range(n + 1):
        t = i / n
        x = t * L
        # Lomo recto; el filo sube hacia la punta
        arriba = A * 0.5 * (1 - t ** 6 * 0.8)
        abajo = -A * 0.5 + A * 0.75 * t ** 3.2
        verts += [(x, arriba, 0.0012), (x, abajo, 0.0), (x, arriba, -0.0012)]
    for i in range(n):
        a = i * 3
        faces += [(a, a + 3, a + 4, a + 1), (a + 1, a + 4, a + 5, a + 2), (a + 2, a + 5, a + 3, a)]
    hoja = clay.make_mesh_object('hoja', verts, faces, coll, material=acero)
    clay.add_subsurf(hoja, 1, 2)
    # Brillo del filo
    tubo('filo', [(L * t, -A * 0.5 + A * 0.75 * t ** 3.2 + 0.0015, 0.0007) for t in np.linspace(0.02, 0.97, 8)], 0.0007, coll, filo, seg=4, subsurf=0)
    negro = mat_plastico('mango cuchillo', '#1F1A17', 0.35, 0.5)
    clay.rbox('virola', (-0.006, 0, 0), (0.007, A * 0.42, 0.006), coll, mat_metal('virola'), p=4, n=4)
    clay.rbox('mango', (-0.065, 0, 0), (0.055, A * 0.32, 0.009), coll, negro, p=3.5, n=6)
    for k in range(3):
        clay.lathe(f'remache {k}', [(0.0, 0.0), (0.003, 0.0), (0.003, 0.0095), (0.0, 0.0098)], coll, mat_metal('remache', '#E2E5E8'), segments=16).location = (
            -0.03 - k * 0.03, 0, 0)
    return {'puntos': {'punta': (L * 0.98, 0.0, 0.0), 'filo': (L * 0.55, -A * 0.4, 0.0), 'mango': (-0.065, 0, 0)}}


def construir_bol(coll):
    acero = M('bol', '#D3D8DC', rough=0.16, metallic=1.0)
    R, H = 0.11, 0.075
    perfil = [(0.0, 0.0), (R * 0.42, 0.0), (R * 0.5, 0.004)] + [(R * (0.5 + 0.5 * math.sin(t)), H * (1 - math.cos(t))) for t in np.linspace(0.12, 1.5, 12)]
    perfil += [(R * 1.03, H + 0.002), (R * 1.0, H + 0.004)]
    perfil_in = [(rr * 0.985, z + 0.0015) for rr, z in reversed(perfil[:-2])]
    clay.lathe('bol', perfil + perfil_in, coll, acero, segments=128, cap_top=False, cap_bottom=False)
    clay.lathe('fondo', [(0.0, 0.0015), (R * 0.41, 0.0015)], coll, acero, segments=64)
    return {'r_boca': R, 'alto': H, 'puntos': {'boca': (0, 0, H), 'fondo': (0, 0, 0.004)}}


def construir_batidora(coll):
    """Batidora de pedestal rosada, de perfil (como de revista): la columna a la derecha y el cabezal que se estira
    hacia la izquierda por encima del bol (el bol va en el origen)."""
    cuerpo = M('batidora', '#F08DA0', rough=0.2, coat=0.9, coat_rough=0.05)
    cromo = mat_metal('batidora cromo', '#E2E6E9', 0.12)
    # Base: zapata alargada que va de debajo del bol hasta la columna
    clay.blob('base', (0.06, 0.0, 0.016), (0.17, 0.085, 0.016), coll, cuerpo, n=10, p=3.4)
    clay.lathe('plato giratorio', [(0.0, 0.03), (0.07, 0.03), (0.072, 0.034), (0.0, 0.034)], coll, cromo, segments=64)
    # Columna a la derecha (se ensancha abajo)
    clay.blob('columna', (0.17, 0.0, 0.14), (0.055, 0.06, 0.13), coll, cuerpo, n=10, p=2.6,
              shaper=lambda v: v * np.column_stack([1 + 0.25 * np.clip(-v[:, 2] / 0.13, 0, 1), np.ones(len(v)), np.ones(len(v))]))
    # Cabezal: hacia la izquierda, redondeado y un poquito más bajo adelante
    clay.blob('cabezal', (0.06, 0.0, 0.29), (0.17, 0.068, 0.062), coll, cuerpo, n=12, p=2.4,
              shaper=lambda v: v + np.column_stack([np.zeros(len(v)), np.zeros(len(v)), -0.012 * np.clip(-v[:, 0] / 0.17, 0, 1) ** 2]))
    clay.lathe('aro cromo', [(0.0605, -0.01), (0.064, -0.01), (0.064, 0.01), (0.0605, 0.01)], coll, cromo, segments=64, cap_top=False,
               cap_bottom=False).rotation_euler = (0, math.pi / 2, 0)
    for o in coll.objects:
        if o.name.startswith('aro cromo'):
            o.location = (0.15, 0.0, 0.29)
    clay.lathe('nariz', [(0.0, 0.0), (0.03, 0.0), (0.032, 0.012), (0.026, 0.02), (0.0, 0.021)], coll, cromo, segments=32).rotation_euler = (0, -math.pi / 2, 0)
    for o in coll.objects:
        if o.name.startswith('nariz'):
            o.location = (-0.105, 0.0, 0.295)
    clay.lathe('eje', [(0.0, 0.0), (0.012, 0.0), (0.014, -0.012), (0.009, -0.02), (0.0, -0.021)], coll, cromo, segments=32).location = (0.0, 0.0, 0.232)
    # Perilla de velocidad y palanca
    clay.lathe('perilla', [(0.0, 0.0), (0.012, 0.0), (0.012, 0.01), (0.0, 0.011)], coll, cromo, segments=32).rotation_euler = (math.pi / 2, 0, 0)
    for o in coll.objects:
        if o.name.startswith('perilla'):
            o.location = (0.17, -0.06, 0.2)
    clay.rbox('palanca', (0.13, -0.066, 0.25), (0.018, 0.004, 0.004), coll, cromo, p=4, n=3)
    clay.blob('logo', (0.03, -0.067, 0.3), (0.03, 0.003, 0.009), coll, M('logo batidora', '#FFFFFF', rough=0.3), n=5)
    return {'puntos': {'eje': (0.0, 0.0, 0.212), 'bol': (0, 0, 0.034)}}


def construir_varilla(coll):
    """Varilla de globo (batidor de alambres) colgando: sale del eje hacia abajo."""
    alambre = mat_metal('varilla', '#E8EBEE', 0.12)
    L, R = 0.09, 0.026
    clay.lathe('cuello', [(0.0, 0.0), (0.006, 0.0), (0.006, -0.014), (0.004, -0.02), (0.0, -0.02)], coll, alambre, segments=24)
    for k in range(6):
        a = k / 6 * math.pi
        pts = []
        for t in np.linspace(0, math.pi, 16):
            r = R * math.sin(t) ** 0.8
            z = -0.018 - (1 - math.cos(t)) / 2 * L
            pts.append((math.cos(a) * r, math.sin(a) * r, z))
        pts2 = [(-p[0], -p[1], p[2]) for p in reversed(pts[:-1])]
        tubo(f'alambre {k}', pts + pts2[1:], 0.0016, coll, alambre, seg=6, subsurf=0, samples=3)
    return {'largo': L + 0.02}


def construir_crema_leche(coll):
    """Caja de crema de leche (tetrapak) azul y blanca."""
    caja = M('caja crema', '#FFFFFF', rough=0.35, coat=0.3)
    azul = M('azul crema', '#2F6FC0', rough=0.35, coat=0.3)
    W, D, H = 0.035, 0.025, 0.09
    clay.rbox('caja', (0, 0, H / 2), (W, D, H / 2), coll, caja, p=10, n=6, subsurf=1)
    clay.rbox('franja', (0, 0, H * 0.45), (W * 1.005, D * 1.005, H * 0.14), coll, azul, p=10, n=6, subsurf=1)
    clay.rbox('techo', (0, 0, H + 0.006), (W * 0.98, 0.004, 0.008), coll, caja, p=6, n=4)
    clay.lathe('tapita', [(0.0, 0.0), (0.008, 0.0), (0.008, 0.007), (0.0, 0.0075)], coll, mat_plastico('tapita', '#FFFFFF'), segments=24).location = (
        W * 0.4, -D * 0.4, H)
    clay.blob('vaquita', (0, -D * 1.01, H * 0.73), (0.012, 0.002, 0.009), coll, M('mancha', '#2B2B2B', rough=0.5), n=5)
    clay.blob('gota', (0, -D * 1.01, H * 0.2), (0.008, 0.002, 0.008), coll, M('gota crema', '#FFF6E6', rough=0.3), n=5)
    return {}


def construir_lata_condensada(coll):
    R, H = 0.035, 0.065
    lata = mat_metal('lata', '#D7DCE0', 0.2)
    clay.lathe('lata', [(0.0, 0.0), (R * 0.95, 0.0), (R, 0.004), (R, H - 0.004), (R * 0.97, H), (0.0, H - 0.002)], coll, lata, segments=64)
    for z in (0.006, H - 0.006):
        clay.lathe(f'aro {z}', [(R, z - 0.002), (R * 1.012, z), (R, z + 0.002)], coll, lata, segments=64, cap_top=False, cap_bottom=False)
    etiqueta('etiqueta', R, 0.01, H - 0.01, coll, M('etiqueta lechera', '#2A63B8', rough=0.4, coat=0.3))
    etiqueta('franja', R + 0.0004, H * 0.42, H * 0.62, coll, M('franja lechera', '#FFFFFF', rough=0.4, coat=0.3), a0=-math.pi * 0.9, a1=-math.pi * 0.1)
    etiqueta('roja', R + 0.0008, H * 0.47, H * 0.57, coll, M('franja roja', '#E33B4C', rough=0.4), a0=-math.pi * 0.85, a1=-math.pi * 0.15)
    # Abierta: con la leche asomando
    clay.lathe('leche', [(0.0, H - 0.003), (R * 0.9, H - 0.003)], coll, M('leche condensada', '#F4E3BC', rough=0.15, coat=0.6), segments=64)
    return {}


def construir_ingrediente(cual):
    def f(coll):
        if cual == 'crema':
            return construir_crema_leche(coll)
        if cual == 'condensada':
            return construir_lata_condensada(coll)
        if cual == 'arequipe':
            frasco(coll, mat_salsa('arequipe', '#A8611F'), None, R=0.03, H=0.065, nivel=0.82, cuchara=True, trapo='#E9483C')
        if cual == 'chocolate':
            frasco(coll, mat_salsa('chocolate frasco', '#3E1F12'), '#5A2E18', R=0.028, H=0.07, nivel=0.8, cuchara=True)
        return {}
    return f


def construir_manga(coll):
    """Manga pastelera llena de crema, con boquilla de estrella (apunta hacia abajo a la izquierda)."""
    pl = sin_sombra(M('manga', '#FDFEFF', rough=0.15, transmission=0.6, ior=1.4))
    crema = mat_crema('crema manga')

    def cono(r0, r1, z0, z1, mat, nombre):
        clay.lathe(nombre, [(0.0, z0), (r0, z0), (r1 * 0.98, z1 - 0.004), (r1, z1), (0.0, z1)], coll, mat, segments=48)
    cono(0.006, 0.045, 0.0, 0.13, crema, 'crema')
    cono(0.0075, 0.047, -0.002, 0.13, pl, 'bolsa')
    clay.blob('nudo', (0, 0, 0.145), (0.03, 0.03, 0.02), coll, pl, n=8)
    tubo('torcido', [(0, 0, 0.15), (0.01, 0.005, 0.17), (0.02, 0.0, 0.19)], 0.008, coll, pl)
    boq = mat_metal('boquilla', '#DADFE3', 0.15)
    clay.lathe('boquilla', [(0.0, -0.02), (0.003, -0.02), (0.008, 0.002), (0.0085, 0.006), (0.0, 0.006)], coll, boq, segments=8, subsurf=0)
    return {'puntos': {'punta': (0, 0, -0.02)}}


# ---------------------------------------------------------------------------
# Frapería
# ---------------------------------------------------------------------------

BASES = {
    'cafe': '#4A2A17', 'chocolate': '#3A1C0F', 'moca': '#5B3220', 'fresa': '#E0516F', 'caramelo': '#C27622', 'galleta': '#7E6E64',
    'maracuya': '#F2B21F', 'matcha': '#7FB04A',
}


def construir_bomba(base):
    """Botella de sirope con bomba dosificadora (vidrio cuadradito, etiqueta de color)."""
    def f(coll):
        vidrio = mat_vidrio('botella sirope', '#F6FBFF', 0.02)
        W, H = 0.03, 0.15
        clay.rbox('botella', (0, 0, H / 2), (W, W, H / 2), coll, vidrio, p=5, n=6, subsurf=1)
        clay.rbox('sirope', (0, 0, H * 0.4), (W * 0.92, W * 0.92, H * 0.38), coll, mat_liquido(f'sirope {base}', BASES[base], 0.4), p=5, n=6, subsurf=1)
        clay.lathe('cuello', [(0.0, H), (0.012, H), (0.012, H + 0.02), (0.0, H + 0.02)], coll, vidrio, segments=32)
        negro = mat_plastico('bomba', '#202124', 0.3, 0.4)
        clay.lathe('rosca', [(0.0, H + 0.015), (0.016, H + 0.015), (0.016, H + 0.03), (0.0, H + 0.03)], coll, negro, segments=32)
        tubo('vástago', [(0, 0, H + 0.03), (0, 0, H + 0.06)], 0.004, coll, negro, seg=12)
        clay.rbox('cabeza', (-0.006, 0, H + 0.066), (0.016, 0.008, 0.007), coll, negro, p=4, n=4)
        tubo('pico', [(-0.02, 0, H + 0.066), (-0.04, 0, H + 0.064), (-0.046, 0, H + 0.056)], 0.0035, coll, negro, seg=10)
        # Etiqueta crema con banda del color de la base
        clay.rbox('etiqueta', (0, -W * 1.005, H * 0.45), (W * 0.85, 0.0008, H * 0.2), coll, M('etiqueta sirope', '#FFF6E6', rough=0.5), p=6, n=4)
        clay.rbox('banda', (0, -W * 1.009, H * 0.45), (W * 0.85, 0.0008, H * 0.06), coll, M(f'banda {base}', BASES[base], rough=0.45), p=6, n=4)
        return {'puntos': {'pico': (-0.046, 0, H + 0.056)}}
    return f


def construir_hielera_pala(coll):
    """Cubeta de acero (como de barra) llena de hielo, con la pala de acrílico."""
    rng = RNG(13)
    acero = mat_cepillado('cubeta', '#C3C8CC')
    W, D, H = 0.075, 0.055, 0.06
    clay.rbox('cubeta', (0, 0, H / 2), (W, D, H / 2), coll, acero, p=6, n=6)
    clay.rbox('borde', (0, 0, H), (W * 1.04, D * 1.06, 0.003), coll, acero, p=6, n=6)
    for k in range(28):
        x, y = rng.uniform(-W * 0.82, W * 0.82), rng.uniform(-D * 0.78, D * 0.78)
        grupo(coll, lambda c, k=k: cubo_hielo(c, 0.01, k + 50), loc=(x, y, H * 0.85 + rng.uniform(-0.004, 0.006)))
    pala = sin_sombra(M('pala', '#E9F6FF', rough=0.08, transmission=0.85, ior=1.45))
    clay.blob('pala', (W * 0.3, -D * 0.1, H * 1.08), (0.03, 0.02, 0.012), coll, pala, n=8,
              shaper=lambda v: v + np.array([0, 0, 0.4]) * np.clip(np.abs(v[:, 1:2]), 0, 1))
    tubo('mango pala', [(W * 0.55, -D * 0.2, H * 1.12), (W * 0.95, -D * 0.35, H * 1.2), (W * 1.25, -D * 0.45, H * 1.24)], 0.006, coll, pala, seg=10)
    return {}


def construir_jarra_leche(coll):
    """Botella de leche de vidrio con tapa azul y etiqueta."""
    vidrio = mat_vidrio('botella leche', '#F7FCFF', 0.02)
    R, H = 0.035, 0.14
    perfil = [(0.0, 0.0), (R * 0.95, 0.0), (R, 0.006), (R, H * 0.62), (R * 0.62, H * 0.84), (R * 0.5, H * 0.95), (R * 0.52, H)]
    perfil_in = [(rr * 0.92, z + 0.002) for rr, z in reversed(perfil[1:])]
    clay.lathe('botella', perfil + perfil_in, coll, vidrio, segments=64, cap_top=False, cap_bottom=False)
    leche = M('leche', '#FBFAF4', rough=0.25, sss=0.8, sss_radius=(1, 1, 0.9), sss_scale=0.01, coat=0.3)
    clay.lathe('leche', [(0.0, 0.004), (R * 0.9, 0.004), (R * 0.9, H * 0.6), (R * 0.58, H * 0.8), (0.0, H * 0.8)], coll, leche, segments=64)
    clay.lathe('tapa', [(0.0, H - 0.003), (R * 0.56, H - 0.003), (R * 0.58, H + 0.012), (R * 0.5, H + 0.014), (0.0, H + 0.014)], coll,
               mat_plastico('tapa leche', '#2F6FC0'), segments=48)
    etiqueta('etiqueta', R * 1.005, H * 0.18, H * 0.48, coll, M('etiqueta leche', '#FFFFFF', rough=0.4), a0=-math.pi * 0.95, a1=-math.pi * 0.05)
    etiqueta('vaca', R * 1.009, H * 0.28, H * 0.36, coll, M('franja leche', '#2F6FC0', rough=0.4), a0=-math.pi * 0.85, a1=-math.pi * 0.15)
    return {}


def construir_licuadora(parte):
    def f(coll):
        H0 = 0.11
        if parte == 'base':
            cuerpo = M('licuadora', '#2F9E8F', rough=0.22, coat=0.8, coat_rough=0.06)
            cromo = mat_metal('licuadora cromo', '#E0E4E7', 0.12)
            clay.blob('base', (0, 0, H0 / 2), (0.075, 0.07, H0 / 2), coll, cuerpo, n=10, p=3.2,
                      shaper=lambda v: v * np.column_stack([1 - 0.12 * (v[:, 2] + 1) / 2, 1 - 0.12 * (v[:, 2] + 1) / 2, np.ones(len(v))]))
            clay.rbox('panel', (0, -0.062, H0 * 0.45), (0.05, 0.008, 0.028), coll, mat_plastico('panel', '#1F2224', 0.3), p=4, n=4)
            perilla = clay.lathe('perilla', [(0.0, 0.0), (0.014, 0.0), (0.014, 0.012), (0.011, 0.016), (0.0, 0.017)], coll, cromo, segments=32)
            perilla.rotation_euler = (math.pi / 2, 0, 0)
            perilla.location = (0.0, -0.07, H0 * 0.45)
            for k, c in enumerate(('#5DFF7A', '#FFD23F', '#FF6B6B')):
                clay.blob(f'botón {k}', (-0.034 + k * 0.006 + (0.054 if k else 0) * 0, -0.071, H0 * 0.62), (0.0025, 0.0015, 0.0025), coll,
                          M(f'led {c}', c, rough=0.2, emission=c, emission_strength=3), n=3)
            clay.lathe('acople', [(0.0, H0), (0.045, H0), (0.047, H0 + 0.01), (0.0, H0 + 0.01)], coll, cromo, segments=64)
            for k in range(4):
                a = math.pi / 4 + k * math.pi / 2
                clay.blob(f'pata {k}', (math.cos(a) * 0.055, math.sin(a) * 0.05, 0.002), (0.01, 0.01, 0.004), coll, mat_plastico('pata', '#1F2224'), n=4)
            return {'puntos': {'acople': (0, 0, H0 + 0.01)}}
        # Jarra de vidrio con asa, tapa y cuchillas
        vidrio = mat_vidrio('jarra licuadora', '#F5FBFF', 0.02)
        rb, rt, h = 0.04, 0.058, 0.19
        z0 = H0 + 0.01
        vaso_perfil('jarra', rb, rt, h, coll, vidrio, grosor=0.0025, base=0.006, seg=96)
        for o in list(coll.objects):
            if o.name.startswith('jarra'):
                o.location.z = z0
        tubo('asa', [(rt * 0.9, 0, z0 + h * 0.85), (rt * 1.6, 0, z0 + h * 0.8), (rt * 1.55, 0, z0 + h * 0.25), (rb * 1.05, 0, z0 + h * 0.15)], 0.007, coll,
             vidrio, seg=12)
        negro = mat_plastico('tapa licuadora', '#1F2224', 0.3)
        clay.lathe('tapa', [(0.0, z0 + h - 0.002), (rt * 1.02, z0 + h - 0.002), (rt * 1.04, z0 + h + 0.01), (rt * 0.9, z0 + h + 0.014), (0.0, z0 + h + 0.014)],
                   coll, negro, segments=64)
        clay.lathe('tapón', [(0.0, z0 + h + 0.013), (0.016, z0 + h + 0.013), (0.016, z0 + h + 0.028), (0.0, z0 + h + 0.028)], coll,
                   mat_plastico_claro('tapón'), segments=32)
        cromo = mat_metal('cuchilla', '#E6EAED', 0.1)
        for k in range(4):
            a = k / 4 * 2 * math.pi
            o = clay.rbox(f'cuchilla {k}', (0.016, 0, 0), (0.016, 0.004, 0.0008), coll, cromo, p=3, n=3, subsurf=0)
            pieza(o, (0, 0, z0 + 0.012 + (k % 2) * 0.004), rot=(0, 0.3 if k % 2 else -0.3, a))
        clay.lathe('base jarra', [(0.0, z0 - 0.004), (rb * 1.25, z0 - 0.004), (rb * 1.28, z0 + 0.012), (rb * 1.0, z0 + 0.014), (0.0, z0 + 0.012)], coll, negro,
                   segments=64)
        for k in range(5):
            z = z0 + h * (0.3 + k * 0.13)
            r = rb + (rt - rb) * (z - z0) / h + 0.0006
            tubo(f'marca {k}', [(-0.012, -r, z), (0.0, -r - 0.0002, z)], 0.0007, coll, M('marca blanca', '#FFFFFF', rough=0.5), seg=4, subsurf=0, samples=2)
        return {'r_abajo': rb, 'r_arriba': rt, 'alto': h, 'z0': z0 + 0.006, 'puntos': {'fondo': (0, 0, z0 + 0.006), 'boca': (0, 0, z0 + h)}}
    return f


def construir_sifon(coll):
    """Sifón de crema chantilly (cromado con cabeza negra y boquilla)."""
    cromo = mat_metal('sifón', '#DCE0E3', 0.12)
    negro = mat_plastico('cabeza sifón', '#202124', 0.3)
    R, H = 0.032, 0.17
    clay.lathe('cuerpo', [(0.0, 0.0), (R * 0.92, 0.0), (R, 0.008), (R, H * 0.85), (R * 0.85, H * 0.93), (0.0, H * 0.94)], coll, cromo, segments=64)
    clay.lathe('cabeza', [(0.0, H * 0.92), (R * 0.9, H * 0.92), (R * 0.95, H * 1.02), (R * 0.6, H * 1.06), (0.0, H * 1.06)], coll, negro, segments=48)
    tubo('palanca', [(R * 0.4, 0, H * 1.06), (R * 1.0, 0, H * 1.1), (R * 1.6, 0, H * 1.04)], 0.004, coll, negro, seg=10)
    boq = clay.lathe('boquilla', [(0.0, 0.0), (0.008, 0.0), (0.006, 0.03), (0.0, 0.032)], coll, cromo, segments=8, subsurf=0)
    boq.rotation_euler = (0, math.radians(-110), 0)
    boq.location = (-R * 0.6, 0, H * 1.03)
    etiqueta('franja', R, H * 0.3, H * 0.5, coll, M('franja sifón', '#2F9E8F', rough=0.35, coat=0.4))
    return {'puntos': {'boquilla': (-R * 0.6 - 0.03, 0, H * 1.03 - 0.01)}}


def construir_pitillo(color):
    def f(coll):
        R, L = 0.0035, 0.2
        clay.lathe('pitillo', [(0.0, 0.0), (R, 0.0), (R, L), (R * 0.8, L), (R * 0.8, 0.002), (0.0, 0.002)], coll, mat_plastico(f'pitillo {color}', '#FFFFFF', 0.25, 0.4),
                   segments=24, subsurf=0)
        franja = mat_plastico(f'franja {color}', color, 0.25, 0.4)
        for k in range(40):
            z0 = k * L / 40
            pts = [(math.cos(a) * (R + 0.0002), math.sin(a) * (R + 0.0002), z0 + a / (2 * math.pi) * L / 40) for a in np.linspace(0, 2 * math.pi, 10)]
            tubo(f'franja {k}', pts, 0.0011, coll, franja, seg=5, subsurf=0, samples=2)
        return {'largo': L}
    return f


# ---------------------------------------------------------------------------
# Comunes: propinas, campanita, impresora, moneda
# ---------------------------------------------------------------------------

def moneda(coll, R=0.012):
    oro = M('oro moneda', '#E8B23A', rough=0.22, metallic=1.0)
    clay.lathe('moneda', [(0.0, 0.0), (R * 0.97, 0.0), (R, 0.0012), (R * 0.97, 0.0024), (0.0, 0.0024)], coll, oro, segments=48)
    clay.lathe('relieve', [(R * 0.78, 0.0024), (R * 0.82, 0.0029), (R * 0.86, 0.0024)], coll, oro, segments=48, cap_top=False, cap_bottom=False)
    # Corazoncito en relieve
    for s in (-1, 1):
        clay.blob(f'lóbulo {s}', (s * R * 0.2, R * 0.12, 0.0027), (R * 0.26, R * 0.26, 0.0006), coll, oro, n=5, subsurf=0)
    o = clay.blob('punta', (0, 0, 0), (R * 0.32, R * 0.32, 0.0006), coll, oro, n=4, p=1.3, subsurf=0)
    pieza(o, (0, -R * 0.12, 0.0027), rot=(0, 0, math.pi / 4))


def construir_propinas(coll):
    rng = RNG(17)
    vidrio = mat_vidrio('frasco propinas', '#F5FBFF', 0.02)
    R, H = 0.045, 0.12
    clay.lathe('frasco', [(0.0, 0.0), (R * 0.92, 0.0), (R, 0.006), (R * 1.04, H * 0.6), (R, H * 0.88), (R * 0.8, H * 0.95), (R * 0.8, H),
                          (R * 0.77, H), (R * 0.77, H * 0.95), (R * 0.97, H * 0.88), (R * 1.01, H * 0.6), (R * 0.97, 0.008), (0.0, 0.007)], coll, vidrio,
               segments=64, cap_top=False)
    for k in range(34):
        a, r = rng.uniform(0, 6.28), R * 0.8 * math.sqrt(rng.uniform(0, 1))
        grupo(coll, moneda, loc=(math.cos(a) * r, math.sin(a) * r, 0.009 + rng.uniform(0, 0.035)), rot=(rng.uniform(-1.2, 1.2), rng.uniform(-1.2, 1.2), 0))
    billete = M('billete', '#8CC79A', rough=0.7)
    for k in range(3):
        o = clay.rbox(f'billete {k}', (0, 0, 0), (0.006, 0.02, 0.035), coll, billete, p=8, n=4, subsurf=0)
        pieza(o, (rng.uniform(-0.01, 0.01), rng.uniform(-0.01, 0.01), H * 0.6), rot=(rng.uniform(-0.3, 0.3), rng.uniform(-0.4, 0.4), rng.uniform(0, 3)))
    clay.rbox('etiqueta', (0, -R * 1.04, H * 0.45), (R * 0.6, 0.001, 0.016), coll, M('etiqueta propinas', '#FFF4D6', rough=0.5), p=6, n=4)
    clay.blob('corazón', (0, -R * 1.06, H * 0.45), (0.006, 0.001, 0.006), coll, M('corazón propinas', '#E8434F', rough=0.4), n=4)
    return {}


def construir_campanita(coll):
    cromo = mat_metal('campanita', '#E7EAEC', 0.08)
    negro = mat_plastico('base campanita', '#1F1A17', 0.3, 0.6)
    clay.lathe('base', [(0.0, 0.0), (0.05, 0.0), (0.052, 0.006), (0.046, 0.012), (0.0, 0.012)], coll, negro, segments=64)
    perfil = [(0.042, 0.012)] + [(0.042 * math.cos(t), 0.012 + 0.04 * math.sin(t)) for t in np.linspace(0.05, 1.5, 12)]
    clay.lathe('domo', perfil, coll, cromo, segments=64, cap_bottom=False)
    clay.lathe('botón', [(0.0, 0.05), (0.004, 0.05), (0.004, 0.06), (0.008, 0.062), (0.008, 0.066), (0.0, 0.066)], coll, cromo, segments=24)
    return {}


def construir_impresora(coll):
    gris = mat_plastico('impresora', '#3A3D42', 0.35, 0.3)
    clay.rbox('cuerpo', (0, 0, 0.04), (0.06, 0.07, 0.04), coll, gris, p=5, n=6)
    clay.rbox('tapa', (0, 0.01, 0.083), (0.058, 0.06, 0.006), coll, mat_plastico('tapa impresora', '#4A4E54', 0.3), p=5, n=6)
    clay.rbox('ranura', (0, -0.045, 0.085), (0.045, 0.004, 0.002), coll, M('ranura', '#0E0F10', rough=0.6), p=4, n=3)
    clay.blob('luz', (0.045, -0.07, 0.065), (0.003, 0.002, 0.003), coll, M('led impresora', '#5DFF7A', rough=0.2, emission='#5DFF7A', emission_strength=4), n=3)
    papel = M('papel térmico', '#FBF8F2', rough=0.6)
    clay.rbox('papelito', (0, -0.05, 0.1), (0.04, 0.001, 0.016), coll, papel, p=6, n=4)
    return {'puntos': {'ranura': (0, -0.045, 0.087)}}


# ---------------------------------------------------------------------------
# Catálogo de piezas
# ---------------------------------------------------------------------------

def catalogo():
    P = []
    for masa in MASAS:
        for etapa in range(4):
            P.append(Pieza(f'wafle_{masa}_{etapa}', construir_wafle(masa, etapa), elev=38, ref=R_WAFLE, px=190, sombra=False, muestras=32))
    P.append(Pieza('plato', construir_plato, elev=38, ref=0.13, px=240, muestras=32))
    P.append(Pieza('wafflera', construir_wafflera, elev=38, ref=R_WAFLE, px=170, muestras=40))
    P.append(Pieza('wafflera_tapa', construir_tapa_wafflera, elev=38, ref=R_WAFLE, px=170, vidrio=True, sombra=False, muestras=64))
    for masa in MASAS:
        P.append(Pieza(f'jarra_{masa}', construir_jarra_masa(masa), elev=16, ref=0.13, px=130, vidrio=True, muestras=64))
    for parte in ('izq', 'medio', 'der'):
        P.append(Pieza(f'rejilla_{parte}', rejilla(parte), elev=38, ref=0.11, px=112, sombra=False, muestras=32, margen=0.0))
    P.append(Pieza('caneca', construir_caneca, elev=18, ref=0.3, px=110, muestras=32))
    # Toppings (a la elevación del wafle)
    top = dict(elev=38, muestras=40, sombra=True)
    P.append(Pieza('top_fresa_entera', lambda c: fresa_entera(c), ref=0.022, px=64, **top))
    P.append(Pieza('top_fresa_mitad', lambda c: corte_fresa(c, 'mitad'), ref=0.022, px=64, rot_z=-25, **top))
    P.append(Pieza('top_fresa_cuarto', lambda c: corte_fresa(c, 'cuarto'), ref=0.022, px=64, rot_z=-25, **top))
    P.append(Pieza('top_fresa_lamina', lambda c: corte_fresa(c, 'lamina'), ref=0.022, px=64, rot_z=-25, **top))
    P.append(Pieza('top_banano', rodaja_banano, ref=0.016, px=60, **top))
    P.append(Pieza('top_arandano', arandano, ref=0.007, px=30, **top))
    P.append(Pieza('top_chantilly', chantilly, ref=0.028, px=70, **top))
    P.append(Pieza('top_helado_vainilla', lambda c: bola_helado(c, '#FFF1CC', pintas='#3A2414'), ref=0.026, px=70, **top))
    P.append(Pieza('top_helado_fresa', lambda c: bola_helado(c, '#FFB3C4'), ref=0.026, px=70, **top))
    P.append(Pieza('top_masmelo_blanco', lambda c: masmelo(c, '#FFFDF8'), ref=0.011, px=40, **top))
    P.append(Pieza('top_masmelo_rosado', lambda c: masmelo(c, '#FFC6D9'), ref=0.011, px=40, **top))
    P.append(Pieza('top_kiwi', rodaja_kiwi, ref=0.018, px=60, **top))
    P.append(Pieza('top_cereza', cereza, ref=0.011, px=40, **top))
    P.append(Pieza('top_barquillo', barquillo, ref=0.0375, px=80, rot_z=-30, **top))
    P.append(Pieza('top_galleta', galleta, ref=0.02, px=60, **top))
    P.append(Pieza('top_mantequilla', mantequilla, ref=0.012, px=44, **top))
    P.append(Pieza('top_menta', menta, ref=0.02, px=60, **top))
    # Pedazos de fresa vistos de lado (adentro del vaso de la fresería)
    for tipo in ('mitad', 'cuarto', 'lamina'):
        P.append(Pieza(f'vfresa_{tipo}', lambda c, t=tipo: corte_fresa(c, t), elev=24, ref=0.022, px=56, rot_z=-70, sombra=False, muestras=32))
    P.append(Pieza('vfresa_entera', lambda c: fresa_acostada(c), elev=24, ref=0.022, px=56, sombra=False, muestras=32))
    # Bandeja de toppings
    bandeja = dict(elev=34, ref=0.045, px=56, muestras=40)
    for cual in ('fresa', 'fresa_entera', 'banano', 'arandano', 'kiwi', 'masmelo', 'chantilly', 'helado', 'mantequilla', 'barquillo', 'galleta', 'menta',
                 'cereza'):
        P.append(Pieza(f'bin_{cual}', construir_bin(cual), **bandeja))
    for cual in ('miel', 'arequipe', 'chocolate', 'leche_condensada', 'caramelo'):
        P.append(Pieza(f'salsa_{cual}', construir_salsa(cual), elev=16, ref=0.06, px=60, vidrio=cual != 'arequipe', muestras=48))
    for cual in ('chispitas', 'azucar', 'canela', 'queso', 'galleta_triturada', 'coco'):
        P.append(Pieza(f'polvo_{cual}', construir_polvo(cual), elev=24 if cual in ('chispitas', 'azucar', 'canela') else 34, ref=0.045, px=56, muestras=40,
                       vidrio=cual in ('chispitas', 'azucar', 'canela')))
    # Bebidas
    for tam in VASOS_JUGO:
        P.append(Pieza(f'vaso_{tam}', construir_vaso_jugo(tam), elev=16, ref=0.1, px=150, vidrio=True, muestras=64, sombra=False))
    for k in range(3):
        P.append(Pieza(f'hielo_{k}', lambda c, k=k: cubo_hielo(c, 0.012, k + 3), elev=30, ref=0.012, px=26, vidrio=True, sombra=False, muestras=48))
    P.append(Pieza('hielera', construir_hielera, elev=30, ref=0.075, px=90, vidrio=True, muestras=48))
    for sabor in JUGOS:
        P.append(Pieza(f'tanque_{sabor}', construir_tanque(sabor), elev=10, ref=0.07, px=78, vidrio=True, muestras=48))
    # Fresería
    P.append(Pieza('tabla', construir_tabla, elev=55, ref=0.21, px=250, muestras=32, luz=0.55))
    P.append(Pieza('fresa_grande', fresa_acostada, elev=55, ref=0.022, px=100, muestras=40, sombra=False))
    P.append(Pieza('canasta', construir_canasta, elev=34, ref=0.1, px=110, muestras=40))
    P.append(Pieza('cuchillo', construir_cuchillo, elev=80, ref=0.16, px=200, muestras=32, sombra=False))
    for tam in VASOS_FRESAS:
        P.append(Pieza(f'vasofresa_{tam}', construir_vaso_plastico(VASOS_FRESAS, tam, '#E8233F'), elev=20, ref=0.1, px=210, vidrio=True, muestras=64,
                       sombra=False))
    P.append(Pieza('bol', construir_bol, elev=25, ref=0.11, px=150, muestras=40))
    P.append(Pieza('batidora', construir_batidora, elev=25, ref=0.11, px=150, muestras=40))
    P.append(Pieza('varilla', construir_varilla, elev=10, ref=0.09, px=100, muestras=32, sombra=False))
    for cual in ('crema', 'condensada', 'arequipe', 'chocolate'):
        P.append(Pieza(f'ing_{cual}', construir_ingrediente(cual), elev=16, ref=0.06, px=64, muestras=40, vidrio=cual in ('arequipe', 'chocolate')))
    P.append(Pieza('manga', construir_manga, elev=20, ref=0.1, px=120, muestras=40, vidrio=True, rot_z=0))
    # Frapería
    for base in BASES:
        P.append(Pieza(f'bomba_{base}', construir_bomba(base), elev=12, ref=0.15, px=150, vidrio=True, muestras=48))
    for tam in VASOS_FRAPPE:
        P.append(Pieza(f'vasofrappe_{tam}', construir_vaso_plastico(VASOS_FRAPPE, tam, '#2F9E8F'), elev=20, ref=0.14, px=260, vidrio=True, muestras=64,
                       sombra=False))
    P.append(Pieza('hielera_pala', construir_hielera_pala, elev=34, ref=0.075, px=90, vidrio=True, muestras=48))
    P.append(Pieza('leche', construir_jarra_leche, elev=14, ref=0.14, px=130, vidrio=True, muestras=48))
    P.append(Pieza('licuadora_base', construir_licuadora('base'), elev=15, ref=0.19, px=210, muestras=40))
    P.append(Pieza('licuadora_jarra', construir_licuadora('jarra'), elev=15, ref=0.19, px=210, vidrio=True, muestras=64, sombra=False))
    P.append(Pieza('sifon', construir_sifon, elev=16, ref=0.17, px=140, muestras=40))
    for nombre, color in (('rojo', '#E8434F'), ('azul', '#3A86D9'), ('rosado', '#FF8FB8')):
        P.append(Pieza(f'pitillo_{nombre}', construir_pitillo(color), elev=0, ref=0.2, px=260, muestras=24, sombra=False))
    # Comunes
    P.append(Pieza('propinas', construir_propinas, elev=14, ref=0.12, px=130, vidrio=True, muestras=48))
    P.append(Pieza('campanita', construir_campanita, elev=22, ref=0.05, px=60, muestras=40))
    P.append(Pieza('impresora', construir_impresora, elev=26, ref=0.07, px=80, muestras=32))
    P.append(Pieza('moneda', moneda, elev=60, ref=0.012, px=24, muestras=32, sombra=False))
    return P


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    salida = os.path.abspath(argv[0] if argv else 'juego/web/modelos-crudos/cocina')
    os.makedirs(salida, exist_ok=True)
    pedidas = argv[1:]
    saltar = os.environ.get('SALTAR_HECHOS') == '1'
    for p in catalogo():
        if pedidas and not any(p.clave == q or (q.endswith('*') and p.clave.startswith(q[:-1])) for q in pedidas):
            continue
        if saltar and os.path.exists(os.path.join(salida, f'{p.clave}.png')):
            continue
        try:
            renderizar(p, salida)
        except Exception as e:  # una pieza mala no tumba las demás
            import traceback
            traceback.print_exc()
            print(f'{p.clave}: FALLÓ {e}', flush=True)


if __name__ == '__main__':
    main()
