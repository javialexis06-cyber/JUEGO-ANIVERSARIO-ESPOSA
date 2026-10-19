"""Plantas contra Zombis: La Semilla Madre · personajes modelados en Blender y renderizados por piezas.

Cada planta o zombi se modela con los ayudantes de plastilina (clay.py) separado en las mismas piezas que anima el
juego (cabeza, hocico, tallo, brazos, piernas…). Cada pieza se renderiza sola en Cycles con la misma cámara
ortográfica, contorno oscuro de caricatura (casco invertido) y fondo transparente; la sombra del personaje entero
sale aparte sobre el suelo. El juego (src/jardin/pvz/arte) las anima en 2D alrededor de sus pivotes.

Uso (con el bpy de pip, que trae el quitarruido):
    python3.11 personajes/blender/pvz_sprites.py <salida> [personajes...]
Después: python3 personajes/blender/pvz_atlas.py <salida> juego/web/public/jardin/pvz

Salida por personaje: <salida>/<id>/<pieza>[__<variante>].png y <salida>/<id>/info.json con el marco en px de mundo
(1 unidad de Blender = 100 px de mundo), el ancla, los pivotes y puntos proyectados, el z de dibujo y el padre.
Convenciones: Z arriba; el personaje se modela mirando a +X con el suelo en Z = 0 y el ancla en el origen, y luego
se gira un poco hacia la cámara (que mira desde −Y, algo desde arriba).
"""
import json
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

import clay  # noqa: E402

UNI = 100.0      # px de mundo por unidad de Blender
PX = float(os.environ.get('PX', '4'))   # px del render por px de mundo (4 alcanza para pantallas de 3x)
ELEV = 16.0      # elevación de la cámara (grados)
TINTA = '#1d1408'
MUESTRAS = int(os.environ.get('MUESTRAS', '40'))


# ---------------------------------------------------------------------------------------------------------------
# Materiales

def mat(nombre, color, rough=0.42, coat=0.25, sss=0.04, **kw):
    """Plástico de juguete con un poco de piel: colores vivos de caricatura."""
    return clay.material(f'PvZ | {nombre}', color, rough=rough, coat=coat, coat_rough=0.25, sss=sss, sss_radius=(1.0, 0.5, 0.3),
                         sss_scale=0.02, spec=0.45, **kw)


def mat_brillo(nombre, color):
    return clay.material(f'PvZ | {nombre}', color, rough=0.12, coat=0.8, coat_rough=0.05, spec=0.7)


def mat_contorno():
    """Contorno de caricatura: la cáscara se ve oscura solo por las caras de atrás (el borde de la silueta)."""
    m = bpy.data.materials.get('PvZ | contorno')
    if m:
        return m
    m = bpy.data.materials.new('PvZ | contorno')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    emi = nt.nodes.new('ShaderNodeEmission')
    emi.inputs['Color'].default_value = clay.rgb(TINTA)
    emi.inputs['Strength'].default_value = 1.0
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    lp = nt.nodes.new('ShaderNodeLightPath')
    cara = nt.nodes.new('ShaderNodeMixShader')
    rayo = nt.nodes.new('ShaderNodeMixShader')
    # Para la cámara: la cara cercana de la cáscara (de espaldas) es transparente y la lejana (de frente) se ve solo
    # en el borde de la silueta como tinta. Para la luz, las sombras y los rebotes la cáscara no existe (si no,
    # encierra al personaje y lo deja a oscuras).
    nt.links.new(geo.outputs['Backfacing'], cara.inputs['Fac'])
    nt.links.new(emi.outputs['Emission'], cara.inputs[1])
    nt.links.new(tr.outputs['BSDF'], cara.inputs[2])
    nt.links.new(lp.outputs['Is Camera Ray'], rayo.inputs['Fac'])
    nt.links.new(tr.outputs['BSDF'], rayo.inputs[1])
    nt.links.new(cara.outputs['Shader'], rayo.inputs[2])
    nt.links.new(rayo.outputs['Shader'], out.inputs['Surface'])
    return m


def contorno(obj, grosor=0.016):
    """Casco invertido: Solidify hacia afuera con normales invertidas y el material de contorno."""
    if obj.type != 'MESH':
        return obj
    me = obj.data
    n = len(me.materials)
    if n == 0:
        me.materials.append(mat('gris', '#888888'))
        n = 1
    for _ in range(n):
        me.materials.append(mat_contorno())
    mod = obj.modifiers.new('contorno', 'SOLIDIFY')
    mod.thickness = grosor
    mod.offset = 1.0
    mod.use_flip_normals = True
    mod.use_rim = False
    mod.material_offset = n
    # Sin «even offset»: en las puntas finas (hojas) dispara picos enormes.
    mod.use_even_offset = False
    obj.visible_shadow = True
    return obj


# ---------------------------------------------------------------------------------------------------------------
# Personaje por piezas

class Personaje:
    """Junta las piezas de un personaje: cada pieza vive en su propia colección (y sus variantes en otras)."""

    def __init__(self, ident, giro=-22.0):
        self.id = ident
        self.giro = giro
        self.raiz = bpy.data.objects.new(f'{ident} raíz', None)
        clay.link(self.raiz, clay.collection('Personaje'))
        self.piezas = []      # (id, z, padre, pivote3d)
        self.variantes = {}   # id -> {nombre: coll}
        self.colls = {}
        self.puntos = {}
        self.ancla = (0.0, 0.0, 0.0)
        self.conservar = []       # piezas del dibujo SVG que se dejan encima (efectos)
        self.sin_sombra = False   # objetos que vuelan (soles, proyectiles): sin sombra en el suelo
        self.extras_torso = []    # piezas que agregan los accesorios y siguen la postura del torso / de la cabeza
        self.extras_cabeza = []

    def coll(self, pieza, variante=None):
        clave = pieza if variante is None else f'{pieza}__{variante}'
        c = self.colls.get(clave)
        if c is None:
            c = clay.collection(f'{self.id} · {clave}', clay.collection('Personaje'))
            self.colls[clave] = c
        return c

    def pieza(self, ident, z, pivote, padre=None):
        self.piezas.append((ident, z, padre, Vector(pivote)))
        return self.coll(ident)

    def variante(self, pieza, nombre):
        self.variantes.setdefault(pieza, {})[nombre] = True
        return self.coll(pieza, nombre)

    def punto(self, nombre, p):
        self.puntos[nombre] = Vector(p)

    def inclinar(self, ids, centro, grados, eje='Y'):
        """Gira (antes de terminar) las piezas ids y sus variantes alrededor de un punto: posturas como el zombi encorvado."""
        R = Matrix.Translation(Vector(centro)) @ Matrix.Rotation(math.radians(grados), 4, eje) @ Matrix.Translation(-Vector(centro))
        bpy.context.view_layer.update()   # las matrices de los objetos recién ubicados aún no están al día
        for clave, c in self.colls.items():
            if clave.split('__')[0] in ids:
                for o in c.objects:
                    o.matrix_world = R @ o.matrix_world
        self.piezas = [(i, z, padre, (R @ piv) if i in ids else piv) for i, z, padre, piv in self.piezas]
        bpy.context.view_layer.update()

    def terminar(self, grosor=0.016):
        """Contorno a todo y gira el personaje hacia la cámara (todo cuelga de la raíz)."""
        for c in self.colls.values():
            for o in c.objects:
                if o.type == 'MESH' and not o.get('sin_contorno'):
                    contorno(o, o.get('contorno', grosor))
                if o.parent is None:
                    o.parent = self.raiz
        self.raiz.rotation_euler = (0, 0, math.radians(self.giro))
        bpy.context.view_layer.update()

    def mundo(self, p):
        return self.raiz.matrix_world @ Vector(p)


def sin_contorno(o):
    o['sin_contorno'] = 1
    return o


# ---------------------------------------------------------------------------------------------------------------
# Escena y render

def preparar():
    scene = clay.reset_scene()
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = MUESTRAS
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
    scene.cycles.max_bounces = 6
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 2
    scene.cycles.transparent_max_bounces = 16
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0.0
    w = bpy.data.worlds.new('Mundo')
    scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = clay.rgb('#E8F0FF')
    bg.inputs['Strength'].default_value = 0.22
    return scene


def dir_camara():
    e = math.radians(ELEV)
    return Vector((0.0, -math.cos(e), math.sin(e)))


def luces(centro, radio):
    """Sol de la tarde arriba a la izquierda (como el sol del jardín), relleno frío y contraluz."""
    coll = clay.collection('Luces')
    d = max(radio * 6, 3.0)

    def area(nombre, az, el, energia, tam, color):
        e, a = math.radians(el), math.radians(az)
        v = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
        data = bpy.data.lights.new(nombre, 'AREA')
        data.energy = energia * (d / 3.0) ** 2
        data.shape = 'DISK'
        data.size = tam * d
        data.color = clay.rgb(color)[:3]
        o = bpy.data.objects.new(nombre, data)
        clay.link(o, coll)
        o.location = Vector(centro) + v * d
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = (Vector(centro) - o.location).to_track_quat('-Z', 'Y')

    area('clave', -38, 50, 140, 0.5, '#FFF1D8')
    area('relleno', 50, 18, 22, 1.0, '#DDE8FF')
    area('contraluz', 170, 45, 130, 0.35, '#FFF0D8')


def todos_los_objetos(p):
    return [o for c in p.colls.values() for o in c.objects if o.type == 'MESH']


def renderizar(p: Personaje, salida):
    scene = bpy.context.scene
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in todos_los_objetos(p):
        ev = o.evaluated_get(dg)
        pts += [ev.matrix_world @ Vector(c) for c in ev.bound_box]
    lo = Vector((min(q.x for q in pts), min(q.y for q in pts), min(q.z for q in pts)))
    hi = Vector((max(q.x for q in pts), max(q.y for q in pts), max(q.z for q in pts)))
    centro = (lo + hi) / 2
    radio = (hi - lo).length / 2
    luces(centro, radio)
    # Piso que solo recibe la sombra (para la pieza «sombra»).
    bpy.ops.mesh.primitive_plane_add(size=radio * 8, location=(centro.x, centro.y, 0.0))
    piso = bpy.context.active_object
    piso.is_shadow_catcher = True
    piso.hide_render = True
    # Cámara ortográfica que encuadra al personaje entero (todas las piezas comparten el mismo cuadro).
    d = dir_camara()
    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', cam_data)
    clay.link(cam, clay.collection('Camara'))
    cam.location = centro + d * (radio * 6 + 2)
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (-d).to_track_quat('-Z', 'Y')
    cam_data.clip_start = 0.01
    cam_data.clip_end = radio * 30 + 20
    scene.camera = cam
    bpy.context.view_layer.update()
    R = cam.matrix_world.to_3x3()
    der, arr = R.col[0], R.col[1]
    xs = [(q - centro).dot(der) for q in pts]
    ys = [(q - centro).dot(arr) for q in pts]
    m = 0.06
    x0, x1, y0, y1 = min(xs) - m, max(xs) + m * 2.2, min(ys) - m * 1.5, max(ys) + m
    ancho, alto = x1 - x0, y1 - y0
    ppu = UNI * PX
    rx, ry = math.ceil(ancho * ppu), math.ceil(alto * ppu)
    ancho, alto = rx / ppu, ry / ppu
    x1, y0 = x0 + ancho, y1 - alto
    cam.location = cam.location + der * ((x0 + x1) / 2) + arr * ((y0 + y1) / 2)
    cam_data.ortho_scale = max(ancho, alto)
    scene.render.resolution_x, scene.render.resolution_y = rx, ry
    scene.render.resolution_percentage = 100
    bpy.context.view_layer.update()

    def local(q):
        """Punto 3D del mundo → marco local del juego (px de mundo, y hacia abajo)."""
        v = Vector(q) - centro
        return [round((v.dot(der) - x0) * UNI, 2), round((y1 - v.dot(arr)) * UNI, 2)]

    os.makedirs(os.path.join(salida, p.id), exist_ok=True)
    objetos = todos_los_objetos(p)

    def solo(visibles, sombra=False):
        for o in objetos:
            o.hide_render = o not in visibles
            o.is_holdout = False
        piso.hide_render = not sombra
        if sombra:
            for o in objetos:
                o.hide_render = False
                o.is_holdout = True

    trabajos = [(pid, None) for pid, *_ in p.piezas] + [(pid, v) for pid, vs in p.variantes.items() for v in vs]
    t0 = time.time()
    for pid, var in trabajos:
        visibles = set(p.coll(pid, var).objects)
        solo(visibles)
        nombre = pid if var is None else f'{pid}__{var}'
        scene.render.filepath = os.path.join(salida, p.id, f'{nombre}.png')
        bpy.ops.render.render(write_still=True)
    # La sombra del personaje entero sobre el suelo.
    if not p.sin_sombra:
        solo(set(), sombra=True)
        scene.render.filepath = os.path.join(salida, p.id, 'sombra.png')
        bpy.ops.render.render(write_still=True)
    for o in objetos:
        o.is_holdout = False

    info = {
        'id': p.id, 'ppu': PX, 'conservar': p.conservar, 'ancho': round(ancho * UNI, 2), 'alto': round(alto * UNI, 2), 'ancla': local(p.mundo(p.ancla)),
        'puntos': {k: local(p.mundo(v)) for k, v in p.puntos.items()},
        'piezas': ([] if p.sin_sombra else [{'id': 'sombra', 'z': -10, 'pivote': local(p.mundo(p.ancla)), 'archivo': 'sombra.png', 'sinTinte': True}]) + [
            {
                'id': pid, 'z': z, 'padre': padre, 'pivote': local(p.mundo(piv)), 'archivo': f'{pid}.png',
                'estados': {v: f'{pid}__{v}.png' for v in p.variantes.get(pid, {})} or None,
            }
            for pid, z, padre, piv in p.piezas
        ],
    }
    with open(os.path.join(salida, p.id, 'info.json'), 'w') as f:
        json.dump(info, f, indent=1, ensure_ascii=False)
    print(f'{p.id}: {len(trabajos) + 1} renders {rx}x{ry} en {time.time() - t0:.1f} s', flush=True)


# ---------------------------------------------------------------------------------------------------------------
# Ayudantes de forma

def hoja_plana(nombre, base, punta, ancho, coll, material, curva=0.0, grosor=0.22, lado=(0, 0, 1)):
    """Hoja: barrido aplanado de la base a la punta, con una pequeña comba."""
    b, t = Vector(base), Vector(punta)
    mid = (b + t) / 2 + Vector(lado) * curva
    return clay.sweep(nombre, [tuple(b), tuple(b * 0.6 + mid * 0.4), tuple(mid), tuple(t)], [ancho * 0.35, ancho, ancho * 0.85, ancho * 0.05],
                      (1.0, grosor), coll, material, segments=12, samples=6, caps=('round', 'point'), up=lado)


def _sock(lista, ident):
    return next(k for k in lista if k.identifier == ident)


def mat_pvz(nombre, color, arriba=None, abajo=None, z0=0.0, z1=1.0, ruido=0.0, ruido_escala=18.0, manchas=None, bump=0.0,
            bump_escala=60.0, rough=0.42, coat=0.25, sss=0.04, sheen=0.0):
    """Material pintado: degradado vertical (abajo → color → arriba, en la Z del mundo), moteado suave y manchas
    opcionales (dict(color, escala, cantidad)). Le da volumen de ilustración a las piezas lisas."""
    m = mat(nombre, color, rough=rough, coat=coat, sss=sss, **({'sheen': sheen, 'sheen_rough': 0.5} if sheen else {}))
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(geo.outputs['Position'], sep.inputs['Vector'])
    rango = nt.nodes.new('ShaderNodeMapRange')
    rango.inputs['From Min'].default_value = z0
    rango.inputs['From Max'].default_value = z1
    nt.links.new(sep.outputs['Z'], rango.inputs['Value'])
    rampa = nt.nodes.new('ShaderNodeValToRGB')
    e = rampa.color_ramp.elements
    e[0].position, e[0].color = 0.0, clay.rgb(abajo or color)
    e[1].position, e[1].color = 1.0, clay.rgb(arriba or color)
    medio = e.new(0.5)
    medio.color = clay.rgb(color)
    nt.links.new(rango.outputs['Result'], rampa.inputs['Fac'])
    salida = rampa.outputs['Color']
    if ruido > 0:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = ruido_escala
        tex.inputs['Detail'].default_value = 3
        nt.links.new(geo.outputs['Position'], tex.inputs['Vector'])
        f = nt.nodes.new('ShaderNodeMapRange')
        f.inputs['From Min'].default_value = 0.3
        f.inputs['From Max'].default_value = 0.7
        f.inputs['To Min'].default_value = 1.0 - ruido
        f.inputs['To Max'].default_value = 1.0 + ruido
        nt.links.new(tex.outputs['Fac'], f.inputs['Value'])
        mul = nt.nodes.new('ShaderNodeMix')
        mul.data_type = 'RGBA'
        mul.blend_type = 'MULTIPLY'
        _sock(mul.inputs, 'Factor_Float').default_value = 1.0
        nt.links.new(salida, _sock(mul.inputs, 'A_Color'))
        comb = nt.nodes.new('ShaderNodeCombineColor')
        for k in ('Red', 'Green', 'Blue'):
            nt.links.new(f.outputs['Result'], comb.inputs[k])
        nt.links.new(comb.outputs['Color'], _sock(mul.inputs, 'B_Color'))
        salida = _sock(mul.outputs, 'Result_Color')
    if manchas:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = manchas.get('escala', 9.0)
        tex.inputs['Detail'].default_value = 4
        tex.inputs['Roughness'].default_value = 0.55
        nt.links.new(geo.outputs['Position'], tex.inputs['Vector'])
        umbral = nt.nodes.new('ShaderNodeMapRange')
        c = manchas.get('cantidad', 0.35)
        umbral.inputs['From Min'].default_value = 1.0 - c
        umbral.inputs['From Max'].default_value = 1.0 - c + 0.08
        nt.links.new(tex.outputs['Fac'], umbral.inputs['Value'])
        mz = nt.nodes.new('ShaderNodeMix')
        mz.data_type = 'RGBA'
        nt.links.new(umbral.outputs['Result'], _sock(mz.inputs, 'Factor_Float'))
        nt.links.new(salida, _sock(mz.inputs, 'A_Color'))
        _sock(mz.inputs, 'B_Color').default_value = clay.rgb(manchas['color'])
        salida = _sock(mz.outputs, 'Result_Color')
    nt.links.new(salida, bsdf.inputs['Base Color'])
    if bump > 0:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = bump_escala
        tex.inputs['Detail'].default_value = 6
        nt.links.new(geo.outputs['Position'], tex.inputs['Vector'])
        b = nt.nodes.new('ShaderNodeBump')
        b.inputs['Strength'].default_value = bump
        b.inputs['Distance'].default_value = 0.01
        nt.links.new(tex.outputs['Fac'], b.inputs['Height'])
        nt.links.new(b.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def marco_dir(direccion, arriba=(0, 0, 1)):
    x = Vector(direccion).normalized()
    z = Vector(arriba) - Vector(arriba).dot(x) * x
    if z.length < 1e-5:
        z = Vector((0, 1, 0)).cross(x)
    z.normalize()
    y = z.cross(x)
    return x, y, z


def superficie(nombre, f, nu, nv, coll, material, grosor=0.012, subsurf=2):
    """Malla de rejilla u × v (f(u, v) → punto), con grosor y suavizado."""
    verts = [tuple(f(i / nu, -1 + 2 * j / nv)) for i in range(nu + 1) for j in range(nv + 1)]
    caras = []
    for i in range(nu):
        for j in range(nv):
            a = i * (nv + 1) + j
            caras.append((a, a + nv + 1, a + nv + 2, a + 1))
    o = clay.make_mesh_object(nombre, verts, caras, coll, material=material)
    if grosor:
        clay.add_solidify(o, grosor, 0.0)
    if subsurf:
        clay.add_subsurf(o, subsurf, subsurf)
    return o


def hoja(nombre, base, direccion, largo, ancho, coll, material, nervio=None, pliegue=0.35, caida=0.25, arco=0.06, punta=0.8,
         torsion=0.0, grosor=0.012, ondas=0.0, normal=(0, 0, 1)):
    """Hoja de planta: lámina con forma de gota que termina en punta, doblada en V por el nervio central (pliegue),
    arqueada y con la punta caída; nervio central opcional de otro material."""
    X, Y, Z = marco_dir(direccion, normal)
    b = Vector(base)

    def ancho_en(u):
        return ancho * (math.sin(math.pi * min(1.0, u ** punta)) ** 0.85) * (1.0 - 0.1 * u) + ancho * 0.12 * (1 - u) ** 3

    def f(u, v):
        w = ancho_en(u)
        tor = torsion * u
        yy = w * v * math.cos(tor)
        zz = w * v * math.sin(tor) + pliegue * w * abs(v) ** 1.4 + arco * largo * math.sin(math.pi * u) - caida * largo * u * u
        zz += ondas * w * math.sin(v * 3.0 + u * 9.0) * abs(v)
        return b + X * (largo * u) + Y * yy + Z * zz

    o = superficie(nombre, f, 16, 8, coll, material, grosor=grosor)
    if nervio is not None:
        pts = [tuple(f(u, 0.0) + Z * grosor * 0.6) for u in (0.0, 0.25, 0.5, 0.75, 0.95)]
        n = clay.sweep(nombre + ' nervio', pts, [ancho * 0.07, ancho * 0.06, ancho * 0.045, ancho * 0.03, ancho * 0.01], (1.0, 0.45), coll, nervio,
                       segments=6, samples=4, caps=('round', 'point'), up=tuple(Z))
        sin_contorno(n)
    return o


def en_superficie(centro, radios, direccion):
    """Punto sobre un elipsoide (centro, radios) en una dirección, con su normal."""
    d = Vector(direccion).normalized()
    c, r = Vector(centro), Vector(radios)
    k = 1.0 / math.sqrt((d.x / r.x) ** 2 + (d.y / r.y) ** 2 + (d.z / r.z) ** 2)
    p = c + d * k
    n = Vector(((p.x - c.x) / r.x ** 2, (p.y - c.y) / r.y ** 2, (p.z - c.z) / r.z ** 2)).normalized()
    return p, n


def ojo_planta(coll, cabeza_c, cabeza_r, direccion, r, negro, blanco, alto=1.0):
    """Ojo de planta de PvZ: óvalo negro alto y brillante, hundido apenas en la cabeza, con un brillo grande arriba y
    uno chico abajo."""
    p, n = en_superficie(cabeza_c, cabeza_r, direccion)
    lado = Vector((0, 0, 1)).cross(n).normalized()
    arriba = n.cross(lado).normalized()
    o = clay.blob('ojo', (0, 0, 0), (r * 0.7, r * 0.4, r * alto), coll, negro, n=10, subsurf=2)
    o.location = p - n * r * 0.12
    clay.orient_to(o, n)
    sin_contorno(o)
    g = clay.blob('brillo', (0, 0, 0), (r * 0.26, r * 0.1, r * 0.3), coll, blanco, n=6, subsurf=1)
    g.location = p + n * r * 0.27 + arriba * r * 0.42 * alto - lado * r * 0.2
    clay.orient_to(g, n)
    sin_contorno(g)
    g = clay.blob('brillo chico', (0, 0, 0), (r * 0.11, r * 0.06, r * 0.11), coll, blanco, n=6, subsurf=1)
    g.location = p + n * r * 0.27 - arriba * r * 0.45 * alto + lado * r * 0.22
    clay.orient_to(g, n)
    sin_contorno(g)


def roseta(p, ident, coll, material, nervio, hojas_def, alto=0.02):
    """Hojas de la base de las plantas: [(ángulo en grados, largo, ancho)]."""
    for k, (ang, largo, ancho) in enumerate(hojas_def):
        a = math.radians(ang)
        d = Vector((math.cos(a), math.sin(a), 0.32))
        hoja(f'{ident} hoja base {k}', Vector((math.cos(a), math.sin(a), 0)) * 0.025 + Vector((0, 0, alto)), d, largo, ancho, coll, material,
             nervio=nervio, pliegue=0.22, caida=0.45, arco=0.12, punta=0.62, torsion=0.12 * (1 if k % 2 else -1))


# ---------------------------------------------------------------------------------------------------------------
# Plantas

def lanzaguisantes(ident='lanzaguisantes', claro='#8FDA48', verde='#4DAA22', oscuro='#1F600C', boca='#0E2606', nuca='hoja', disparos=1, cejas=False):
    """El lanzaguisantes: cabeza redonda con el hocico que sale de frente y se abre en un labio grueso, ojos grandes,
    una hoja en la nuca, tallo en S y una roseta de hojas con nervio."""
    p = Personaje(ident)
    piel = mat_pvz(f'{ident} piel', verde, arriba=claro, abajo=oscuro, z0=0.38, z1=0.74, ruido=0.05, rough=0.38, coat=0.3, sss=0.06)
    piel_hocico = mat_pvz(f'{ident} hocico', verde, arriba=claro, abajo=oscuro, z0=0.47, z1=0.64, ruido=0.04, rough=0.38, coat=0.3, sss=0.06)
    hojas_m = mat_pvz(f'{ident} hojas', '#358C1C', arriba='#55AE2C', abajo='#1B5409', z0=0.0, z1=0.1, ruido=0.08, rough=0.5, coat=0.15)
    nervio = mat(f'{ident} nervio', '#B4E77A', rough=0.5, coat=0.1)
    tallo_m = mat_pvz(f'{ident} tallo', '#4E9E27', arriba='#5FB232', abajo='#2A6A14', z0=0.0, z1=0.38, rough=0.5, coat=0.15)
    negro = mat_brillo('ojo negro', '#0E0E0E')
    blanco = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    hueco = mat('hueco', boca, rough=0.95, coat=0.0)
    hueco2 = mat('hueco fondo', '#050D02', rough=1.0, coat=0.0)

    c = p.pieza('hojas', 1, (0, 0, 0))
    roseta(p, ident, c, hojas_m, nervio, [(-30, 0.25, 0.085), (45, 0.21, 0.08), (125, 0.23, 0.085), (205, 0.22, 0.08), (275, 0.19, 0.075)])
    c = p.pieza('tallo', 2, (0, 0, 0))
    clay.sweep('tallo', [(0.0, 0, 0.0), (-0.03, 0, 0.1), (0.012, 0, 0.22), (-0.005, 0, 0.32), (0.0, 0, 0.4)], [0.04, 0.034, 0.03, 0.032, 0.036],
               (1, 1), c, tallo_m, segments=14, samples=8, caps=('flat', 'round'))
    c = p.pieza('cabeza', 5, (0, 0, 0.38), padre='tallo')
    CAB_C, CAB_R = Vector((-0.01, 0, 0.56)), Vector((0.215, 0.205, 0.198))
    clay.blob('cabeza', tuple(CAB_C), tuple(CAB_R), c, piel, n=16, subsurf=2)
    # Mejillas apenas marcadas donde nace el hocico.
    clay.blob('mejilla', (0.12, 0, 0.535), (0.11, 0.135, 0.11), c, piel, n=10, subsurf=2)
    ojo_planta(c, CAB_C, CAB_R, (0.36, -0.6, 0.72), 0.082, negro, blanco, alto=1.05)
    ojo_planta(c, CAB_C, CAB_R, (0.62, -0.02, 0.8), 0.07, negro, blanco, alto=1.05)
    if cejas:
        # Cejas de hoja, fruncidas (la repetidora es brava).
        for d, k in (((0.36, -0.6, 0.72), 0.082), ((0.62, -0.02, 0.8), 0.07)):
            q, nn = en_superficie(CAB_C, CAB_R, d)
            lado = Vector((0, 0, 1)).cross(nn).normalized()
            ceja(f'ceja {d}', c, q + Vector((0, 0, k * 1.0)) - lado * k * 0.85 - nn * 0.01, q + Vector((0, 0, k * 0.72)) + lado * k * 0.85 - nn * 0.01, 0.02,
                 mat(f'{ident} ceja', oscuro, rough=0.5), nn)
    c = p.pieza('hocico', 6, (0.14, 0, 0.55), padre='cabeza')
    clay.sweep('hocico', [(0.1, 0, 0.548), (0.2, 0, 0.55), (0.29, 0, 0.553), (0.33, 0, 0.555)], [0.09, 0.077, 0.08, 0.098], (1, 1), c, piel_hocico,
               segments=24, samples=8, caps=('round', 'flat'))
    labio = clay.lathe('labio', [(0.062, -0.035), (0.098, -0.03), (0.114, -0.012), (0.118, 0.006), (0.108, 0.024), (0.086, 0.03), (0.068, 0.022),
                                 (0.062, 0.0)], c, piel_hocico, segments=36)
    labio.rotation_euler = (0, math.radians(90), 0)
    labio.location = (0.335, 0, 0.555)
    garganta = clay.lathe('garganta', [(0.064, 0.02), (0.06, -0.02), (0.045, -0.06), (0.0, -0.075)], c, hueco, segments=24, cap_top=False)
    garganta.rotation_euler = (0, math.radians(90), 0)
    garganta.location = (0.34, 0, 0.555)
    sin_contorno(garganta)
    f = clay.blob('fondo boca', (0.29, 0, 0.555), (0.01, 0.045, 0.045), c, hueco2, n=6, subsurf=1)
    sin_contorno(f)
    c = p.pieza('nuca', 3, (-0.17, 0, 0.6), padre='cabeza')
    if nuca == 'hoja':
        hoja(f'{ident} nuca 1', (-0.17, 0.0, 0.6), (-0.95, 0.0, 0.25), 0.2, 0.055, c, hojas_m, nervio=nervio, pliegue=0.5, caida=-0.35, arco=0.03, punta=1.0)
        hoja(f'{ident} nuca 2', (-0.16, 0.04, 0.65), (-0.85, 0.2, 0.6), 0.15, 0.04, c, piel, nervio=nervio, pliegue=0.5, caida=-0.3, arco=0.02, punta=1.0)
        hoja(f'{ident} nuca 3', (-0.16, -0.04, 0.57), (-0.9, -0.2, 0.0), 0.13, 0.038, c, piel, nervio=nervio, pliegue=0.5, caida=-0.3, arco=0.02, punta=1.0)
    elif nuca:
        nuca(p, c, piel, hojas_m, nervio)
    p.punto('boca', (0.37, 0, 0.555))
    p.punto('cabeza', (0.0, 0, 0.78))
    p.terminar()
    return p


def girasol(ident='girasol'):
    """El girasol: cara redonda color miel mirando a la cámara (un poco hacia los zombis), dos coronas de pétalos con
    degradado, ojos brillantes, mejillas rosadas y sonrisa; tallo y roseta de hojas."""
    p = Personaje(ident, giro=0.0)
    hojas_m = mat_pvz(f'{ident} hojas', '#358C1C', arriba='#55AE2C', abajo='#1B5409', z0=0.0, z1=0.1, ruido=0.08, rough=0.5, coat=0.15)
    nervio = mat(f'{ident} nervio', '#B4E77A', rough=0.5, coat=0.1)
    tallo_m = mat_pvz(f'{ident} tallo', '#4E9E27', arriba='#5FB232', abajo='#2A6A14', z0=0.0, z1=0.42, rough=0.5, coat=0.15)
    petalo = mat_pvz(f'{ident} pétalo', '#FFD21F', arriba='#FFE762', abajo='#F2A50E', z0=0.3, z1=0.82, ruido=0.05, rough=0.4, coat=0.25, sss=0.15)
    petalo_at = mat_pvz(f'{ident} pétalo atrás', '#F5B416', arriba='#FFD43A', abajo='#D98A08', z0=0.3, z1=0.82, ruido=0.05, rough=0.45, coat=0.2, sss=0.12)
    cara = mat_pvz(f'{ident} cara', '#E39A33', arriba='#F0B04A', abajo='#C9781C', z0=0.48, z1=0.68, ruido=0.04, rough=0.5, coat=0.2, sss=0.05)
    borde = mat(f'{ident} borde cara', '#9A5712', rough=0.6, coat=0.1, noise=dict(scale=160, strength=0.5, distance=0.004))
    negro = mat_brillo('ojo negro', '#0E0E0E')
    blanco = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    boca = mat('sonrisa', '#4A2008', rough=0.6, coat=0.1)
    rubor = mat('rubor', '#F2846A', rough=0.6, coat=0.0)

    C = Vector((0.0, -0.02, 0.6))
    n = Vector((0.32, -1.0, 0.12)).normalized()
    u = Vector((0, 0, 1)).cross(n).normalized()          # derecha de la cara
    v = n.cross(u).normalized()                          # arriba de la cara

    c = p.pieza('hojas', 1, (0, 0, 0))
    roseta(p, ident, c, hojas_m, nervio, [(-20, 0.23, 0.08), (70, 0.2, 0.075), (160, 0.23, 0.08), (250, 0.21, 0.078)])
    c = p.pieza('tallo', 2, (0, 0, 0))
    clay.sweep('tallo', [(0.0, 0, 0.0), (0.02, 0, 0.12), (-0.015, 0, 0.27), (0.0, -0.005, 0.4), (0.0, 0.0, 0.5)], [0.04, 0.034, 0.031, 0.033, 0.035],
               (1, 1), c, tallo_m, segments=14, samples=8, caps=('flat', 'round'))
    hoja(f'{ident} hoja tallo', (0.02, 0, 0.2), (0.9, -0.2, 0.55), 0.12, 0.04, c, hojas_m, nervio=nervio, pliegue=0.3, caida=0.2, arco=0.05)
    piv_cab = C - v * 0.15 + n * -0.02
    c = p.pieza('petalos_atras', 3, tuple(C), padre='cabeza')
    for k in range(13):
        a = 2 * math.pi * (k + 0.5) / 13
        d = u * math.cos(a) + v * math.sin(a)
        hoja(f'pétalo atrás {k}', C + d * 0.112 - n * 0.025, d - n * 0.18, 0.168, 0.053, c, petalo_at, pliegue=0.3, caida=0.0, arco=0.02, punta=0.55,
             grosor=0.01, normal=n)
    c = p.pieza('petalos', 4, tuple(C), padre='cabeza')
    for k in range(13):
        a = 2 * math.pi * k / 13
        d = u * math.cos(a) + v * math.sin(a)
        hoja(f'pétalo {k}', C + d * 0.122, d + n * 0.12, 0.146, 0.05, c, petalo, pliegue=0.35, caida=0.0, arco=0.025, punta=0.55, grosor=0.01,
             normal=n)
    c = p.pieza('cabeza', 5, tuple(piv_cab), padre='tallo')
    o = clay.blob('borde cara', (0, 0, 0), (0.15, 0.054, 0.15), c, borde, n=14, subsurf=2)
    o.location = C - n * 0.005
    clay.orient_to(o, n)
    o = clay.blob('cara', (0, 0, 0), (0.131, 0.048, 0.131), c, cara, n=14, subsurf=2)
    o.location = C + n * 0.02
    clay.orient_to(o, n)
    sin_contorno(o)
    sup = C + n * 0.062
    for lado_ in (-1, 1):
        r = 0.04
        e = clay.blob('ojo', (0, 0, 0), (r * 0.72, r * 0.35, r * 1.08), c, negro, n=10, subsurf=2)
        e.location = sup + u * (lado_ * 0.049) + v * 0.033 - n * 0.006
        clay.orient_to(e, n)
        sin_contorno(e)
        g = clay.blob('brillo', (0, 0, 0), (r * 0.26, r * 0.1, r * 0.3), c, blanco, n=6, subsurf=1)
        g.location = e.location + n * 0.009 + v * r * 0.45 - u * r * 0.2
        clay.orient_to(g, n)
        sin_contorno(g)
        g = clay.blob('brillo chico', (0, 0, 0), (r * 0.11, r * 0.06, r * 0.11), c, blanco, n=6, subsurf=1)
        g.location = e.location + n * 0.009 - v * r * 0.5 + u * r * 0.25
        clay.orient_to(g, n)
        sin_contorno(g)
        m = clay.blob('mejilla', (0, 0, 0), (0.024, 0.006, 0.015), c, rubor, n=8, subsurf=1)
        m.location = sup + u * (lado_ * 0.08) - v * 0.014 - n * 0.008
        clay.orient_to(m, n)
        sin_contorno(m)
    pts = [tuple(sup + u * x + v * (-0.033 - 0.025 * (1 - (x / 0.055) ** 2)) - n * 0.004) for x in (-0.055, -0.027, 0.0, 0.027, 0.055)]
    o = clay.sweep('sonrisa', pts, [0.005, 0.008, 0.009, 0.008, 0.005], (1, 1), c, boca, segments=8, samples=6, caps=('round', 'round'))
    sin_contorno(o)
    p.punto('sol', tuple(C))
    p.punto('cabeza', tuple(C + v * 0.28))
    p.conservar = [{'id': 'resplandor', 'alinear': 'sol', 'escala': 0.95}, {'id': 'cara_luz', 'alinear': 'sol', 'escala': 0.92, 'z': 5.5}]
    p.terminar()
    return p


def girar_coll(coll, centro, grados, eje='Y'):
    """Gira todos los objetos de una colección alrededor de un punto (los blobs tienen el origen en el mundo)."""
    bpy.context.view_layer.update()
    R = Matrix.Translation(Vector(centro)) @ Matrix.Rotation(math.radians(grados), 4, eje) @ Matrix.Translation(-Vector(centro))
    for o in coll.objects:
        o.matrix_world = R @ o.matrix_world


def base_cara(n):
    """Ejes de una cara que mira en la dirección n: (derecha, arriba)."""
    n = Vector(n).normalized()
    u = Vector((0, 0, 1)).cross(n).normalized()
    return n, u, n.cross(u).normalized()


def poner(o, pos, n):
    o.location = pos
    clay.orient_to(o, n)
    return o


def ojo_blanco(nombre, coll, pos, n, r, blanco_m, alto=1.15):
    """Ojo blanco de caricatura (sin pupila: la pupila es otra pieza cuando se mueve)."""
    return poner(clay.blob(nombre, (0, 0, 0), (r, r * 0.45, r * alto), coll, blanco_m, n=10, subsurf=2), pos, n)


def pupila(nombre, coll, pos, n, r, negro, brillo):
    o = poner(clay.blob(nombre, (0, 0, 0), (r, r * 0.4, r * 1.1), coll, negro, n=8, subsurf=2), pos, n)
    sin_contorno(o)
    _, u, v = base_cara(n)
    g = poner(clay.blob(nombre + ' brillo', (0, 0, 0), (r * 0.35, r * 0.15, r * 0.38), coll, brillo, n=6, subsurf=1), pos + n * r * 0.35 + v * r * 0.45 - u * r * 0.3, n)
    sin_contorno(g)
    return o


def ceja(nombre, coll, a, b, grosor, material, n):
    o = clay.sweep(nombre, [tuple(a), tuple((Vector(a) + Vector(b)) / 2 + Vector(n) * 0.006), tuple(b)], [grosor * 0.7, grosor, grosor * 0.6], (1.0, 0.55), coll,
                   material, segments=8, samples=4, caps=('round', 'round'), up=tuple(n))
    o['contorno'] = 0.008
    return o


def nuez(ident='nuez'):
    """La nuez: cuerpo alto de cáscara con vetas, cara grande con ojos que miran, párpados para parpadear, cejas
    preocupadas y grietas cuando la muerden (agrietada: grietas; muy agrietada: le falta un pedazo arriba)."""
    p = Personaje(ident, giro=0.0)
    cascara = mat_pvz(f'{ident} cáscara', '#A8682E', arriba='#C58848', abajo='#7A4518', z0=0.05, z1=0.8, ruido=0.16, ruido_escala=7,
                      manchas=dict(color='#8A5222', escala=4.0, cantidad=0.4), bump=0.6, bump_escala=18, rough=0.7, coat=0.1, sss=0.02)
    veta = mat(f'{ident} veta', '#7A4A1F', rough=0.7, coat=0.0)
    blanco_m = mat('ojo blanco', '#FFFFFF', rough=0.25, coat=0.5)
    negro = mat_brillo('ojo negro', '#0E0E0E')
    brillo = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    grieta = mat('grieta nuez', '#3C2210', rough=0.9, coat=0.0)
    interior = mat('nuez dentro', '#E9C893', rough=0.8, coat=0.0)
    C, R = Vector((0.0, 0.0, 0.42)), Vector((0.31, 0.27, 0.39))
    n, u, v = base_cara((0.35, -1.0, 0.0))

    def cuerpo(coll, nivel):
        o = clay.blob('cáscara', tuple(C), tuple(R), coll, cascara, n=18, subsurf=2, p=2.15,
                      shaper=lambda q: q * (1.0 + 0.035 * np.sin(q[:, 2:3] * 23.0 + np.arctan2(q[:, 1:2], q[:, 0:1]) * 3.0)
                                           + 0.02 * np.sin(np.arctan2(q[:, 1:2], q[:, 0:1]) * 7.0)))
        if nivel == 2:
            # Le falta un pedazo arriba a la derecha: una muesca con el interior claro.
            o2 = clay.blob('mordisco', (0.18, -0.05, 0.74), (0.13, 0.2, 0.1), coll, interior, n=8, subsurf=2)
            sin_contorno(o2)
            mod = o.modifiers.new('mordida', 'BOOLEAN')
            corte = clay.blob('corte', (0.2, -0.05, 0.8), (0.14, 0.32, 0.12), None, None, n=8, subsurf=1)
            corte.hide_render = True
            corte.hide_viewport = True
            mod.object = corte
            mod.operation = 'DIFFERENCE'
            o.modifiers.move(len(o.modifiers) - 1, 0)
        # Vetas verticales de la cáscara.
        for k in range(7):
            a = -1.1 + k * 0.36
            pts = []
            for t in (0.1, 0.3, 0.5, 0.7, 0.9):
                el = -1.2 + t * 2.4
                d = Vector((math.sin(a) * math.cos(el * 0.6), -math.cos(a) * math.cos(el * 0.6), math.sin(el * 0.6)))
                q, _ = en_superficie(C, R, d)
                pts.append(tuple(q + (q - C).normalized() * 0.003))
            o = clay.sweep(f'veta {k}', pts, [0.005, 0.01, 0.012, 0.01, 0.005], (1, 0.5), coll, veta, segments=6, samples=4, caps=('point', 'point'))
            sin_contorno(o)
        if nivel >= 1:
            lineas = [[(-0.55, 0.85), (-0.4, 0.65), (-0.48, 0.5), (-0.32, 0.35)], [(0.45, 0.2), (0.6, 0.05), (0.52, -0.15), (0.66, -0.3)]]
            if nivel == 2:
                lineas += [[(0.1, 0.9), (0.05, 0.6), (0.2, 0.45), (0.12, 0.3), (0.25, 0.1)], [(-0.3, -0.3), (-0.15, -0.45), (-0.3, -0.6)],
                           [(0.6, 0.6), (0.4, 0.55), (0.35, 0.4)]]
            for j, lin in enumerate(lineas):
                pts = []
                for (a, el) in lin:
                    d = n * math.cos(a) * math.cos(el) + u * math.sin(a) * math.cos(el) + Vector((0, 0, math.sin(el)))
                    q, _ = en_superficie(C, R, d)
                    pts.append(tuple(q + (q - C).normalized() * 0.004))
                o = clay.sweep(f'grieta {nivel} {j}', pts, [0.006, 0.01, 0.008, 0.005] + [0.004] * (len(pts) - 4), (1, 0.5), coll, grieta, segments=6,
                               samples=4, caps=('point', 'point'))
                sin_contorno(o)

    cuerpo(p.pieza('cuerpo', 1, (0, 0, 0)), 0)
    cuerpo(p.variante('cuerpo', 'agrietada'), 1)
    cuerpo(p.variante('cuerpo', 'muy_agrietada'), 2)
    cara_c = C + v * 0.03
    sup = lambda d: en_superficie(C, R, d)[0]
    ojos = {}
    for lado_ in (-1, 1):
        d = (n * 1.0 + u * (lado_ * 0.4) + Vector((0, 0, 0.16))).normalized()
        ojos[lado_] = sup(d)
    c = p.pieza('ojos', 2, tuple(cara_c), padre='cuerpo')
    for lado_, q in ojos.items():
        ojo_blanco(f'ojo {lado_}', c, q - n * 0.016, n, 0.1 if lado_ == 1 else 0.094, blanco_m, alto=1.2)
    c = p.pieza('pupilas', 3, tuple(cara_c), padre='ojos')
    for lado_, q in ojos.items():
        pupila(f'pupila {lado_}', c, q + n * 0.03 - v * 0.015, n, 0.045, negro, brillo)
    c = p.pieza('parpados', 4, tuple(cara_c + v * 0.1), padre='ojos')
    for lado_, q in ojos.items():
        o = poner(clay.blob(f'párpado {lado_}', (0, 0, 0), (0.108, 0.055, 0.118), c, cascara, n=10, subsurf=2), q + n * 0.004, n)
        ceja(f'pestaña {lado_}', c, q + n * 0.05 - u * 0.08 - v * 0.005, q + n * 0.05 + u * 0.08 - v * 0.005, 0.009, grieta, n)
    p.pieza('cejas', 5, tuple(cara_c + v * 0.12), padre='cuerpo')
    for nombre, caida in (('agrietada', 0.03), ('muy_agrietada', 0.06)):
        c = p.variante('cejas', nombre)
        for lado_, q in ojos.items():
            a = q + v * 0.14 + n * 0.03 - u * 0.07 + v * (caida if lado_ == -1 else 0)
            b = q + v * 0.14 + n * 0.03 + u * 0.07 + v * (caida if lado_ == 1 else 0)
            ceja(f'ceja {nombre} {lado_}', c, a, b, 0.016, veta, n)
    p.punto('cabeza', (0.0, 0, 0.84))
    p.terminar()
    return p


def petacereza(ident='petacereza'):
    """Dos cerezas bravas unidas por los tallos con una hoja arriba; al inflarse se ponen más rojas, con venas, y aprietan
    la cara."""
    p = Personaje(ident, giro=0.0)
    tallo_m = mat_pvz(f'{ident} tallo', '#4E9E27', arriba='#5FB232', abajo='#2A6A14', z0=0.3, z1=0.7, rough=0.5, coat=0.15)
    hojas_m = mat_pvz(f'{ident} hoja', '#3F9A24', arriba='#5DB834', abajo='#22630F', z0=0.55, z1=0.75, rough=0.5, coat=0.15)
    nervio = mat(f'{ident} nervio', '#B4E77A', rough=0.5)
    blanco_m = mat('ojo blanco', '#FFFFFF', rough=0.25, coat=0.5)
    negro = mat_brillo('ojo negro', '#0E0E0E')
    brillo = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    boca_m = mat('boca cereza', '#3A0A08', rough=0.8)
    diente = mat('diente', '#F4EFD6', rough=0.3, coat=0.3)
    ceja_m = mat('ceja cereza', '#4A0E0B', rough=0.6)
    vena = mat('vena cereza', '#FF6A5A', rough=0.5)
    cerezas = (('cereza_a', 2, Vector((-0.16, -0.05, 0.19)), 0.175, (0.2, -1.0, 0.05)), ('cereza_b', 3, Vector((0.14, -0.1, 0.25)), 0.165, (0.45, -1.0, 0.1)))
    c = p.pieza('tallos', 1, (0.0, 0.05, 0.64))
    for nombre, _, C, r, _d in cerezas:
        clay.sweep(f'tallo {nombre}', [tuple(C + Vector((0, 0, r * 0.85))), tuple(C + Vector((0.03 * (1 if C.x < 0 else -1), 0.05, r + 0.15))),
                                       (0.0, 0.05, 0.64)], [0.022, 0.018, 0.016], (1, 1), c, tallo_m, segments=10, samples=6, caps=('round', 'round'))
    hoja(f'{ident} hoja', (0.0, 0.05, 0.64), (0.6, 0.2, 0.55), 0.17, 0.05, c, hojas_m, nervio=nervio, pliegue=0.4, caida=0.3, arco=0.05)
    clay.blob('nudo', (0.0, 0.05, 0.645), (0.028, 0.028, 0.024), c, tallo_m, n=8, subsurf=2)
    for nombre, z, C, r, dirc in cerezas:
        for var in (None, 'inflada'):
            coll = p.pieza(nombre, z, tuple(C)) if var is None else p.variante(nombre, var)
            inf = var == 'inflada'
            piel = mat_pvz(f'{ident} {nombre} {var}', '#E8283A' if inf else '#D81F2E', arriba='#FF5A62' if inf else '#F04A55',
                           abajo='#9E0D1A' if inf else '#8E0C18', z0=C.z - r, z1=C.z + r, ruido=0.04, rough=0.25, coat=0.6, sss=0.08)
            clay.blob(f'{nombre} cuerpo', tuple(C), (r, r * 0.95, r * 0.95), coll, piel, n=16, subsurf=2)
            hueco = clay.blob(f'{nombre} hoyo', tuple(C + Vector((0, 0, r * 0.9))), (r * 0.18, r * 0.16, r * 0.06), coll, mat('hoyo cereza', '#7A0A12', rough=0.6),
                              n=6, subsurf=1)
            sin_contorno(hueco)
            n, u, v = base_cara(dirc)
            q = C + n * r * 0.9
            for lado_ in (-1, 1):
                pe = q + u * lado_ * r * 0.36 + v * r * 0.15
                ojo_blanco(f'{nombre} ojo {lado_}', coll, pe - n * 0.01, n, r * 0.2, blanco_m, alto=0.9 if not inf else 0.7)
                pupila(f'{nombre} pupila {lado_}', coll, pe + n * 0.018 - u * lado_ * r * 0.04 - v * r * 0.03, n, r * 0.085, negro, brillo)
                # Cejas bravas en V (más caídas al inflarse).
                ceja(f'{nombre} ceja {lado_}', coll, pe + v * r * (0.3 if inf else 0.32) + u * lado_ * r * 0.22 + n * 0.02,
                     pe + v * r * (0.17 if inf else 0.22) - u * lado_ * r * 0.18 + n * 0.02, r * 0.07, ceja_m, n)
            bm = poner(clay.blob(f'{nombre} boca', (0, 0, 0), (r * 0.32, r * 0.08, r * (0.1 if not inf else 0.16)), coll, boca_m, n=8, subsurf=2),
                       q - v * r * 0.32 + n * 0.008, n)
            sin_contorno(bm)
            for k in range(4):
                d = poner(clay.blob(f'{nombre} diente {k}', (0, 0, 0), (r * 0.06, r * 0.04, r * 0.06), coll, diente, n=5, subsurf=1),
                          q - v * r * (0.27 if not inf else 0.22) + u * r * (-0.21 + k * 0.14) + n * 0.02, n)
                sin_contorno(d)
            g = poner(clay.blob(f'{nombre} brillo', (0, 0, 0), (r * 0.22, r * 0.08, r * 0.14), coll, brillo, n=6, subsurf=1),
                      C + (n * 0.55 - u * 0.45 + v * 0.65).normalized() * r * 0.98, (n * 0.55 - u * 0.45 + v * 0.65).normalized())
            sin_contorno(g)
            if inf:
                for k in range(3):
                    a = 0.6 + k * 0.9
                    pts = [tuple(C + (n * 0.3 + u * math.cos(a + t * 0.3) + v * math.sin(a + t * 0.3)).normalized() * r * 1.0) for t in (0, 1, 2)]
                    o = clay.sweep(f'{nombre} vena {k}', pts, [r * 0.03, r * 0.022, r * 0.005], (1, 0.5), coll, vena, segments=5, samples=3,
                                   caps=('round', 'point'))
                    sin_contorno(o)
    p.terminar()
    return p


def patatapum(ident='patatapum'):
    """La patatapum: papa con manchitas, ojos chiquitos y sonrisa traviesa, antena con un bombillo rojo (que se
    enciende) y el montón de tierra al frente (plano cuando está enterrada)."""
    p = Personaje(ident, giro=0.0)
    papa = mat_pvz(f'{ident} papa', '#D9A95E', arriba='#EAC07A', abajo='#A9733A', z0=0.0, z1=0.4, ruido=0.1, ruido_escala=12,
                   manchas=dict(color='#B07A3E', escala=11, cantidad=0.25), bump=0.2, bump_escala=40, rough=0.65, coat=0.1, sss=0.04)
    ojito = mat('ojito papa', '#7D4C22', rough=0.7)
    negro = mat_brillo('ojo negro', '#0E0E0E')
    brillo = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    blanco_m = mat('ojo blanco', '#FFFFFF', rough=0.25, coat=0.5)
    boca_m = mat('boca papa', '#4A2410', rough=0.7)
    metal = mat('antena', '#7E8287', rough=0.3, metallic=0.8)
    luz = mat('bombillo', '#8E1A12', rough=0.15, coat=0.8)
    luz_on = mat('bombillo encendido', '#FF3A2A', rough=0.15, coat=0.8, emission='#FF2A1A', emission_strength=4.0)
    tierra = mat('montón tierra', '#7A4E26', rough=0.95, noise=dict(scale=40, strength=0.6, distance=0.02))
    tierra_c = mat('montón tierra claro', '#946136', rough=0.95)
    C, R = Vector((0.0, 0.0, 0.19)), Vector((0.24, 0.2, 0.19))
    n, u, v = base_cara((0.3, -1.0, 0.1))
    c = p.pieza('papa', 3, (0.0, 0.0, 0.02))
    clay.blob('papa', tuple(C), tuple(R), c, papa, n=16, subsurf=2, shaper=lambda q: q * [1.0, 1.0, 1.0] + [[0.0, 0.0, 0.02 * math.sin(qq[0] * 18)] for qq in q])
    for k, (a, el) in enumerate(((-0.9, 0.5), (0.8, 0.6), (1.4, -0.1), (-1.3, -0.2), (0.2, 0.9))):
        d = n * math.cos(a) * math.cos(el) + u * math.sin(a) * math.cos(el) + Vector((0, 0, math.sin(el)))
        q, nn = en_superficie(C, R, d)
        o = poner(clay.blob(f'ojito {k}', (0, 0, 0), (0.016, 0.006, 0.012), c, ojito, n=6, subsurf=1), q, nn)
        sin_contorno(o)
    cara = en_superficie(C, R, n)[0]
    for lado_ in (-1, 1):
        q = en_superficie(C, R, (n + u * lado_ * 0.32 + Vector((0, 0, 0.18))).normalized())[0]
        ojo_blanco(f'ojo {lado_}', c, q - n * 0.008, n, 0.032, blanco_m)
        pupila(f'pupila {lado_}', c, q + n * 0.012 + u * 0.006, n, 0.017, negro, brillo)
    pts = [tuple(cara + u * x + v * (-0.035 - 0.025 * (1 - (x / 0.05) ** 2)) + n * 0.004) for x in (-0.05, -0.025, 0.0, 0.025, 0.05)]
    o = clay.sweep('sonrisa', pts, [0.005, 0.008, 0.009, 0.008, 0.005], (1, 1), c, boca_m, segments=8, samples=6, caps=('round', 'round'))
    sin_contorno(o)
    c = p.pieza('antena', 1, (0.0, 0.0, 0.37))
    clay.sweep('antena', [(0.0, 0.0, 0.33), (0.0, 0.0, 0.5)], 0.011, (1, 1), c, metal, segments=8, samples=2, caps=('flat', 'round'))
    clay.lathe('base antena', [(0.035, 0.0), (0.03, 0.03), (0.012, 0.045)], c, metal, segments=16).location = (0.0, 0.0, 0.33)
    c = p.pieza('luz', 2, (0.0, 0.0, 0.52), padre='antena')
    clay.blob('bombillo', (0.0, 0.0, 0.545), (0.04, 0.04, 0.045), c, luz, n=10, subsurf=2)
    c = p.variante('luz', 'encendida')
    clay.blob('bombillo', (0.0, 0.0, 0.545), (0.04, 0.04, 0.045), c, luz_on, n=10, subsurf=2)
    o = clay.blob('halo', (0.0, -0.01, 0.545), (0.075, 0.075, 0.075), c, mat('halo bombillo', '#FF6A50', rough=1.0, emission='#FF5A40',
                                                                               emission_strength=1.5, alpha=0.35), n=8, subsurf=1)
    sin_contorno(o)
    c = p.pieza('tierra', 6, (0, 0, 0))
    for k in range(9):
        a = -2.4 + k * 0.6
        x, y = math.cos(a) * 0.24, math.sin(a) * 0.16 - 0.02
        clay.blob(f'terrón {k}', (x, y, 0.035), (0.075, 0.06, 0.05 + 0.015 * (k % 2)), c, tierra if k % 2 else tierra_c, n=8, subsurf=2)
    c = p.variante('tierra', 'plana')
    clay.blob('mancha tierra', (0.0, 0.0, 0.0), (0.22, 0.16, 0.025), c, tierra, n=10, subsurf=2)
    for k in range(5):
        clay.blob(f'terrón plano {k}', (-0.14 + k * 0.07, -0.08 + (k % 2) * 0.04, 0.025), (0.035, 0.03, 0.022), c, tierra_c, n=6, subsurf=1)
    p.conservar = ['terrones', 'estallido']
    p.terminar()
    return p


def desesporada(ident='desesporada'):
    """Seta desesporada: hongo chiquito de sombrero morado con pecas claras, cuerpo lila con ojos grandes y un
    hociquito que escupe esporas; dormida cierra los ojos."""
    p = Personaje(ident, giro=0.0)
    som = mat_pvz(f'{ident} sombrero', '#9B55C9', arriba='#B977E3', abajo='#6E3296', z0=0.18, z1=0.42, ruido=0.06, rough=0.4, coat=0.3, sss=0.06)
    peca = mat('peca seta', '#E6C8F5', rough=0.5, coat=0.2)
    cuerpo_m = mat_pvz(f'{ident} cuerpo', '#D8C2EE', arriba='#E8DAF7', abajo='#B69AD6', z0=0.0, z1=0.24, ruido=0.04, rough=0.5, coat=0.2, sss=0.1)
    negro = mat_brillo('ojo negro', '#0E0E0E')
    brillo = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    linea = mat('párpado seta', '#5A3A70', rough=0.6)
    hueco = mat('hueco seta', '#3A1E4A', rough=0.9)
    n, u, v = base_cara((0.55, -1.0, 0.05))
    C, R = Vector((0.0, 0.0, 0.13)), Vector((0.12, 0.11, 0.13))
    for var in (None, 'dormida'):
        c = p.pieza('cuerpo', 1, (0, 0, 0)) if var is None else p.variante('cuerpo', var)
        clay.blob('cuerpo', tuple(C), tuple(R), c, cuerpo_m, n=14, subsurf=2)
        clay.sweep('hocico', [(0.06, -0.02, 0.1), (0.15, -0.03, 0.105), (0.19, -0.035, 0.11)], [0.04, 0.034, 0.042], (1, 1), c, cuerpo_m, segments=16, samples=5,
                   caps=('round', 'flat'))
        h = clay.blob('boca', (0.195, -0.035, 0.11), (0.006, 0.026, 0.028), c, hueco, n=6, subsurf=1)
        sin_contorno(h)
        for lado_ in (-1, 1):
            q = en_superficie(C, R, (n + u * lado_ * 0.45 + Vector((0, 0, 0.05))).normalized())[0]
            if var is None:
                ojo = poner(clay.blob(f'ojo {lado_}', (0, 0, 0), (0.026, 0.014, 0.04), c, negro, n=8, subsurf=2), q, n)
                sin_contorno(ojo)
                g = poner(clay.blob(f'brillo {lado_}', (0, 0, 0), (0.01, 0.005, 0.012), c, brillo, n=5, subsurf=1), q + n * 0.01 + v * 0.016 - u * 0.008, n)
                sin_contorno(g)
            else:
                ceja(f'dormido {lado_}', c, q - u * 0.026 + v * 0.004, q + u * 0.026 + v * 0.004, 0.007, linea, n)
    c = p.pieza('sombrero', 2, (0.0, 0.0, 0.26), padre='cuerpo')
    clay.blob('sombrero', (0.0, 0.0, 0.33), (0.18, 0.165, 0.12), c, som, n=14, subsurf=2, shaper=lambda q: q * [1, 1, 1] - [[0, 0, 0.06 * max(0.0, -qq[2]) / 0.12] for qq in q])
    clay.blob('borde sombrero', (0.0, 0.0, 0.27), (0.17, 0.155, 0.03), c, som, n=12, subsurf=2)
    for k, (a, el, r) in enumerate(((-0.2, 0.55, 0.035), (0.9, 0.35, 0.028), (-1.2, 0.3, 0.03), (0.3, 1.1, 0.025), (2.2, 0.5, 0.03))):
        d = n * math.cos(a) * math.cos(el) + u * math.sin(a) * math.cos(el) + Vector((0, 0, math.sin(el)))
        q, nn = en_superficie((0.0, 0.0, 0.33), (0.18, 0.165, 0.12), d)
        o = poner(clay.blob(f'peca {k}', (0, 0, 0), (r, r * 0.25, r * 0.85), c, peca, n=6, subsurf=1), q, nn)
        sin_contorno(o)
    p.punto('boca', (0.2, -0.035, 0.11))
    p.punto('cabeza', (0.0, 0.0, 0.47))
    p.conservar = ['zzz']
    p.terminar()
    return p


def diente_conico(nombre, coll, base, direccion, largo, radio, material, contorno_g=0.007):
    d = clay.lathe(nombre, [(radio, 0.0), (radio * 0.8, largo * 0.45), (0.0, largo)], coll, material, segments=10)
    d.location = base
    d.rotation_mode = 'QUATERNION'
    d.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(direccion).normalized())
    d['contorno'] = contorno_g
    return d


def carnivora(ident='carnivora'):
    """La carnívora: cabeza de trampa morada con pecas lilas, labios verdes gruesos, dientes blancos hacia adentro y el
    paladar granate con la lengua; tallo y roseta. «cerrada» es la cabeza cerrada y abultada, masticando."""
    p = Personaje(ident, giro=-26.0)
    mor = mat_pvz(f'{ident} cabeza', '#8236B0', arriba='#A257D2', abajo='#57207C', z0=0.3, z1=1.0, ruido=0.08, rough=0.35, coat=0.35, sss=0.08,
                  manchas=dict(color='#C08AE6', escala=9.0, cantidad=0.3), bump=0.1, bump_escala=40)
    labio = mat_pvz(f'{ident} labio', '#8CCB4A', arriba='#B4E27A', abajo='#5E9E2A', z0=0.3, z1=0.9, rough=0.4, coat=0.3)
    diente = mat('diente carnívora', '#FBF8EC', rough=0.25, coat=0.5)
    paladar = mat_pvz('paladar', '#7A1238', arriba='#9A1E48', abajo='#4A0820', z0=0.35, z1=0.8, rough=0.5, coat=0.3, sss=0.1)
    garganta = mat('garganta', '#3A0618', rough=0.7, coat=0.1)
    lengua = mat('lengua carnívora', '#D2486B', rough=0.35, coat=0.4)
    hojas_m = mat_pvz(f'{ident} hojas', '#358C1C', arriba='#55AE2C', abajo='#1B5409', z0=0.0, z1=0.1, ruido=0.08, rough=0.5, coat=0.15)
    nervio = mat(f'{ident} nervio', '#B4E77A', rough=0.5)
    tallo_m = mat_pvz(f'{ident} tallo', '#4E9E27', arriba='#5FB232', abajo='#2A6A14', z0=0.0, z1=0.45, rough=0.5, coat=0.15)
    P0 = Vector((0.06, 0.0, 0.44))   # bisagra de la boca
    L, W = 0.5, 0.25
    c = p.pieza('hojas', 1, (0, 0, 0))
    roseta(p, ident, c, hojas_m, nervio, [(-30, 0.27, 0.09), (50, 0.23, 0.085), (130, 0.26, 0.09), (215, 0.25, 0.085), (285, 0.2, 0.08)])
    c = p.pieza('tallo', 2, (0, 0, 0))
    clay.sweep('tallo', [(0.0, 0, 0.0), (-0.05, 0, 0.14), (0.0, 0, 0.3), (0.05, 0, 0.42)], [0.052, 0.044, 0.042, 0.05], (1, 1), c, tallo_m, segments=14,
               samples=8, caps=('flat', 'round'))

    def mandibula(coll, arriba, apertura, H):
        """Media cabeza que sale de la bisagra hacia adelante, con labio, paladar y dientes; apertura en grados."""
        s_ = 1 if arriba else -1
        a = math.radians(apertura) * s_
        fwd = Vector((math.cos(a), 0, math.sin(a)))
        nrm = Vector((-math.sin(a), 0, math.cos(a))) * s_       # hacia afuera de la concha
        cen = P0 + fwd * L * 0.5
        o = clay.blob('concha', (0, 0, 0), (L * 0.55, W, H), coll, mor, n=18, subsurf=2,
                      shaper=lambda q: np.column_stack([q[:, 0], q[:, 1], np.where(q[:, 2] * s_ > 0, q[:, 2], q[:, 2] * 0.18)]))
        o.location = cen
        o.rotation_euler = (0, -a, 0)
        pal = clay.blob('paladar', (0, 0, 0), (L * 0.5, W * 0.88, 0.02), coll, paladar, n=12, subsurf=2)
        pal.location = cen - nrm * 0.03
        pal.rotation_euler = (0, -a, 0)
        sin_contorno(pal)
        borde = [tuple(cen + fwd * (L * 0.54 * math.cos(t * math.pi / 2)) + Vector((0, W * 0.97 * math.sin(t * math.pi / 2), 0)) - nrm * 0.02)
                 for t in (-1.0, -0.75, -0.5, -0.25, 0.0, 0.25, 0.5, 0.75, 1.0)]
        clay.sweep('labio', borde, 0.036, (1.0, 0.7), coll, labio, segments=10, samples=5, caps=('round', 'round'))
        for k in range(9):
            t = -0.82 + k * 0.205
            ang = t * math.pi / 2
            q = cen + fwd * (L * 0.5 * math.cos(ang)) + Vector((0, W * 0.9 * math.sin(ang), 0)) - nrm * 0.035
            hacia = (-nrm * 1.0 - (q - cen).normalized() * 0.35)
            diente_conico(f'diente {k}', coll, q, hacia, 0.07 if abs(t) < 0.6 else 0.055, 0.022, diente)
        return cen, fwd

    c = p.pieza('garganta', 3, tuple(P0), padre='tallo')
    clay.blob('garganta', tuple(P0 + Vector((0.1, 0, 0.02))), (0.13, 0.17, 0.12), c, garganta, n=12, subsurf=2)
    clay.sweep('lengua', [tuple(P0 + Vector((0.04, 0, -0.03))), tuple(P0 + Vector((0.2, 0.0, -0.02))), tuple(P0 + Vector((0.33, 0.02, 0.02)))],
               [0.06, 0.055, 0.025], (1.0, 0.35), c, lengua, segments=10, samples=5, caps=('round', 'round'))
    mandibula(p.pieza('mandibula_inf', 4, tuple(P0), padre='tallo'), False, 14, 0.16)
    mandibula(p.pieza('mandibula_sup', 5, tuple(P0), padre='tallo'), True, 34, 0.25)
    c = p.pieza('cerrada', 6, tuple(P0), padre='tallo')
    cen = P0 + Vector((0.22, 0, 0.05))
    clay.blob('cerrada', tuple(cen), (0.29, 0.25, 0.25), c, mor, n=18, subsurf=2,
              shaper=lambda q: q * (1.0 + 0.06 * np.sin(q[:, 0:1] * 14.0)))
    pts = [tuple(cen + Vector((0.3 * math.cos(t), 0.25 * math.sin(t) * 1.0, -0.02 + 0.03 * math.cos(t * 3)))) for t in (-1.5, -0.9, -0.3, 0.3, 0.9, 1.5)]
    clay.sweep('labio cerrado', pts, 0.034, (1.0, 0.7), c, labio, segments=10, samples=5, caps=('round', 'round'))
    for k in range(6):
        t = -1.1 + k * 0.44
        q = cen + Vector((0.3 * math.cos(t), 0.25 * math.sin(t), -0.01))
        diente_conico(f'diente cerrado {k}', c, q, Vector((math.cos(t), math.sin(t), 0.9 if k % 2 else -0.9)), 0.045, 0.018, diente, 0.006)
    p.punto('boca', tuple(P0 + Vector((0.5, 0, 0.08))))
    p.punto('cabeza', tuple(P0 + Vector((0.18, 0, 0.52))))
    p.terminar()
    return p


def nuca_hielo(p, c, piel, hojas_m, nervio):
    """Cresta de cristales de hielo en la nuca del hielaguisantes."""
    cristal = mat('cristal hielo', '#E8FBFF', rough=0.08, coat=0.9, transmission=0.3)
    for k, (d, largo, r) in enumerate((((-0.9, 0.0, 0.45), 0.2, 0.04), ((-0.7, 0.25, 0.8), 0.16, 0.035), ((-0.75, -0.25, 0.7), 0.15, 0.033),
                                        ((-0.95, 0.15, 0.1), 0.13, 0.03), ((-0.4, 0.05, 0.95), 0.13, 0.03))):
        b = Vector((-0.15, 0.0, 0.62)) + Vector(d).normalized() * 0.04
        t = b + Vector(d).normalized() * largo
        clay.sweep(f'cristal {k}', [tuple(b), tuple((b + t) / 2), tuple(t)], [r, r * 0.8, r * 0.05], (1.0, 0.7), c, cristal, segments=6, samples=3,
                   caps=('flat', 'point'), subsurf=0)


def nuca_repetidora(p, c, piel, hojas_m, nervio):
    """Tupé de hojas de la repetidora (más hojas y más paradas)."""
    for k, (d, largo, ancho) in enumerate((((-0.95, 0.0, 0.3), 0.22, 0.06), ((-0.8, 0.25, 0.65), 0.18, 0.05), ((-0.85, -0.25, 0.55), 0.17, 0.048),
                                            ((-0.55, 0.05, 0.9), 0.15, 0.045), ((-0.95, 0.1, -0.1), 0.15, 0.045))):
        hoja(f'tupé {k}', (-0.17, 0.0, 0.62), d, largo, ancho, c, hojas_m if k % 2 == 0 else piel, nervio=nervio, pliegue=0.5, caida=-0.35, arco=0.03, punta=1.0)


def hielaguisantes():
    return lanzaguisantes('hielaguisantes', claro='#B4E6FF', verde='#4FB0E6', oscuro='#155F9A', boca='#0D2A44', nuca=nuca_hielo)


def repetidora():
    return lanzaguisantes('repetidora', claro='#7FC93E', verde='#3E9620', oscuro='#1A520A', boca='#0A2405', nuca=nuca_repetidora, cejas=True)


# ---------------------------------------------------------------------------------------------------------------
# Zombis

PIEL_ZOMBI = '#97A68C'


def arrugar(o, fuerza=0.012, escala=0.35, nombre='arruga'):
    """Arrugas y pliegues suaves: desplazamiento con ruido de nubes sobre la malla ya subdividida."""
    tex = bpy.data.textures.new(nombre, 'CLOUDS')
    tex.noise_scale = escala
    tex.noise_depth = 2
    m = o.modifiers.new(nombre, 'DISPLACE')
    m.texture = tex
    m.strength = fuerza
    m.mid_level = 0.5
    m.texture_coords = 'LOCAL'
    return o


def jirones(*args, **kw):
    """(Antes tiras en punta; se quitaron porque se veían como garras. Los bordes rotos ahora son pliegues.)"""
    return None


def mano_zombi(nombre, coll, piel, una, muneca, lado):
    """Mano gris colgando: palma con la base del pulgar, cuatro dedos que se afinan y se curvan, pulgar adelante y uñas."""
    x0, y0, z0 = muneca
    pal = clay.blob(f'palma {nombre}', (x0 + 0.012, y0, z0 - 0.05), (0.05, 0.036, 0.062), coll, piel, n=10, subsurf=2, p=2.4)
    arrugar(pal, 0.004, 0.2, 'nudillos')
    largos = (0.07, 0.088, 0.082, 0.062)
    for k in range(4):
        dx = -0.026 + k * 0.0175
        L = largos[k]
        c1 = 0.35 + 0.1 * k
        pts = [(x0 + dx + 0.006, y0 + lado * 0.002 * k, z0 - 0.085), (x0 + dx + 0.012, y0, z0 - 0.085 - L * 0.5),
               (x0 + dx + 0.012 + L * 0.28, y0, z0 - 0.085 - L * 0.85), (x0 + dx + 0.012 + L * 0.5, y0, z0 - 0.085 - L * 0.95 + 0.012)]
        o = clay.sweep(f'dedo {nombre} {k}', pts, [0.0155, 0.0135, 0.0115, 0.0085], (1, 0.9), coll, piel, segments=8, samples=4, caps=('round', 'round'))
        o['contorno'] = 0.008
        e = pts[-1]
        u = clay.blob(f'uña {nombre} {k}', (e[0] + 0.004, y0 - lado * 0.004, e[2] + 0.002), (0.006, 0.008, 0.01), coll, una, n=6, subsurf=1)
        sin_contorno(u)
    o = clay.sweep(f'pulgar {nombre}', [(x0 + 0.03, y0 + lado * 0.018, z0 - 0.04), (x0 + 0.05, y0 + lado * 0.03, z0 - 0.065),
                                        (x0 + 0.07, y0 + lado * 0.03, z0 - 0.09)], [0.019, 0.0155, 0.011], (1, 0.9), coll, piel, segments=8, samples=4,
                   caps=('round', 'round'))
    o['contorno'] = 0.008


def zombi(ident='zombi', saco='#6E4B2C', camisa='#EDE6CF', corbata='#C4362A', pantalon='#4B4239', zapatos='#3A2817', extra=None, ropa='oficina'):
    """El zombi de oficina: cráneo grande con la ceja pesada, ojos desiguales hundidos en ojeras, nariz caída, boca
    abierta con dientes torcidos y unos pelos parados; saco café raído con solapas, camisa manchada, corbata roja torcida,
    pantalón remendado y zapatos gastados. Brazos colgando (el juego los levanta al caminar)."""
    p = Personaje(ident, giro=232.0)
    piel = mat_pvz(f'{ident} piel', PIEL_ZOMBI, arriba='#A8B79C', abajo='#84937A', z0=0.4, z1=1.4, ruido=0.07, ruido_escala=14,
                   manchas=dict(color='#7F8F6B', escala=7.0, cantidad=0.3), bump=0.08, bump_escala=45, rough=0.6, coat=0.08, sss=0.06)
    piel_osc = mat_pvz(f'{ident} piel oscura', '#7B8B6B', ruido=0.06, rough=0.65, coat=0.05)
    ojera = mat(f'{ident} ojera', '#6F7A62', rough=0.7, coat=0.0)
    tela = mat_pvz(f'{ident} saco', saco, arriba='#7C5634', abajo='#5A3B22', z0=0.45, z1=0.95, ruido=0.1, ruido_escala=22,
                   manchas=dict(color='#4A311C', escala=6.0, cantidad=0.28), bump=0.25, bump_escala=180, rough=0.85, coat=0.0, sss=0.0, sheen=0.4)
    tela_osc = mat_pvz(f'{ident} solapa', '#4E321C', ruido=0.08, bump=0.2, bump_escala=180, rough=0.85, coat=0.0, sss=0.0)
    blanca = mat_pvz(f'{ident} camisa', camisa, ruido=0.06, manchas=dict(color='#C9B58A', escala=9.0, cantidad=0.32), bump=0.1,
                     bump_escala=150, rough=0.75, coat=0.0, sss=0.0)
    roja = mat_pvz(f'{ident} corbata', corbata, arriba='#D8473A', abajo='#9E2A20', z0=0.6, z1=0.9, ruido=0.05, rough=0.45, coat=0.2, sss=0.0)
    pant = mat_pvz(f'{ident} pantalón', pantalon, arriba='#564C42', abajo='#3E362F', z0=0.05, z1=0.55, ruido=0.08, bump=0.2,
                   bump_escala=170, rough=0.85, coat=0.0, sss=0.0)
    remiendo = mat(f'{ident} remiendo', '#8C6A3F', rough=0.85, coat=0.0, ribs=dict(scale=90, strength=0.3, axis='Z'))
    hilo = mat('hilo', '#E7DFC6', rough=0.8, coat=0.0)
    media = mat(f'{ident} media', '#B3AD9C', rough=0.85, coat=0.0, ribs=dict(scale=120, strength=0.25, axis='Z'))
    zap = mat_pvz(f'{ident} zapatos', zapatos, ruido=0.12, manchas=dict(color='#5A4430', escala=12, cantidad=0.25), rough=0.4, coat=0.35, sss=0.0)
    suela = mat('suela', '#2A2018', rough=0.8, coat=0.0)
    ojo_b = mat('ojo zombi', '#FAF6E4', rough=0.25, coat=0.5)
    pupila = mat_brillo('pupila', '#141414')
    hueso = mat('hueso', '#F0E7CC', rough=0.5)
    boca_m = mat('boca zombi', '#2E1512', rough=0.9, coat=0.0)
    lengua = mat('lengua zombi', '#7D3F3A', rough=0.5, coat=0.2)
    diente = mat('diente', '#EDE4C2', rough=0.3, coat=0.3)
    una = mat('uña zombi', '#4C4A3A', rough=0.4, coat=0.3)
    pelo = mat('pelo zombi', '#35291E', rough=0.7)
    boton = mat('botón', '#2B1D12', rough=0.3, coat=0.5)
    atleta = ropa == 'atleta'
    if atleta:
        camiseta = mat_pvz(f'{ident} camiseta', '#D43A2A', arriba='#E5503E', abajo='#A82A1E', z0=0.5, z1=0.95, ruido=0.06, bump=0.12, bump_escala=160,
                           rough=0.7, coat=0.0, sss=0.0, sheen=0.3)
        franja_b = mat('franja blanca', '#F4F2EA', rough=0.6, coat=0.0)
        short = mat_pvz(f'{ident} short', '#2B56A0', arriba='#3567B8', abajo='#1F3F78', z0=0.35, z1=0.6, ruido=0.06, rough=0.6, coat=0.1, sss=0.0,
                        sheen=0.4)
        media_b = mat('media blanca', '#F4F2EA', rough=0.8, coat=0.0, ribs=dict(scale=140, strength=0.2, axis='Z'))
        raya_r = mat('raya media', '#D43A2A', rough=0.7)
        tenis = mat_pvz(f'{ident} tenis', '#E0402E', ruido=0.05, rough=0.4, coat=0.3, sss=0.0)
        azul = mat('cinta azul', '#2E7FD6', rough=0.5, coat=0.2)
        rubio = mat_pvz(f'{ident} pelo', '#F2CF4A', arriba='#FFE27A', abajo='#C99A2A', z0=1.3, z1=1.5, ruido=0.1, bump=0.4, bump_escala=60, rough=0.6,
                        coat=0.1, sss=0.0)

    HOMBRO, CODO, MUNECA, CADERA, RODILLA, TOBILLO = 0.88, 0.67, 0.48, 0.52, 0.28, 0.08
    # Piernas: izquierda cerca de la cámara (+Y antes de girar), derecha lejos.
    for lado, s_, zp, zz in (('der', -1, 1, 1.1), ('izq', 1, 2, 2.1)):
        y = s_ * 0.078
        c = p.pieza(f'pierna_{lado}', zp, (0, y, CADERA))
        if atleta:
            clay.sweep(f'short {lado}', [(0.0, y, CADERA + 0.04), (0.012, y * 1.05, RODILLA + 0.09)], [0.088, 0.09], (1, 1), c, short, segments=14, samples=4,
                       caps=('round', 'flat'))
            clay.sweep(f'pierna {lado}', [(0.012, y, RODILLA + 0.1), (0.012, y, RODILLA), (0.0, y, TOBILLO + 0.05)], [0.048, 0.046, 0.04], (1, 1), c, piel,
                       segments=12, samples=5, caps=('flat', 'flat'))
            clay.sweep(f'media {lado}', [(0.004, y, TOBILLO + 0.17), (0.0, y, TOBILLO - 0.01)], [0.047, 0.044], (1, 1), c, media_b, segments=12, samples=3,
                       caps=('flat', 'flat'))
            for k in range(3):
                z = TOBILLO + 0.14 - k * 0.028
                o = clay.lathe(f'raya {lado} {k}', [(0.0475 - k * 0.001, -0.007), (0.0475 - k * 0.001, 0.007)], c, raya_r, segments=20, cap_bottom=False,
                               cap_top=False)
                o.location = (0.003, y, z)
                sin_contorno(o)
            c = p.pieza(f'zapato_{lado}', zz, (0.0, y, TOBILLO), padre=f'pierna_{lado}')
            clay.blob(f'tenis {lado}', (0.045, y, 0.05), (0.12, 0.062, 0.05), c, tenis, n=12, subsurf=2, p=2.2)
            clay.rbox(f'suela {lado}', (0.045, y, 0.012), (0.125, 0.064, 0.016), c, franja_b, p=4.0, n=6, subsurf=2)
            continue
        o = clay.sweep(f'pierna {lado}', [(0.0, y, CADERA + 0.03), (0.016, y, RODILLA + 0.1), (0.008, y, RODILLA - 0.1), (0.0, y, TOBILLO + 0.05)],
                       [0.08, 0.071, 0.069, 0.078], (1, 1), c, pant, segments=18, samples=6, caps=('round', 'flat'))
        arrugar(o, 0.014, 0.3, 'pliegues pantalón')
        clay.sweep(f'media {lado}', [(0.0, y, TOBILLO + 0.07), (0.002, y, TOBILLO - 0.01)], 0.043, (1, 1), c, media, segments=10, samples=3,
                   caps=('flat', 'flat'))
        if lado == 'izq':
            r = clay.rbox('remiendo', (0.03, y + 0.06, RODILLA + 0.03), (0.04, 0.012, 0.045), c, remiendo, p=5.0, n=5, subsurf=1)
            r.rotation_euler = (0, 0.15, 0)
            sin_contorno(r)
            for k, (a0, b0) in enumerate((((-0.01, 0.0715, RODILLA + 0.075), (0.07, 0.0715, RODILLA + 0.075)),
                                          ((-0.01, 0.0715, RODILLA - 0.015), (0.07, 0.0715, RODILLA - 0.015)))):
                st = clay.stitches(f'puntada remiendo {k}', [a0, b0], radius=0.0045, dash=0.014, gap=0.01, coll=c, material=hilo)
                if st:
                    sin_contorno(st)
        c = p.pieza(f'zapato_{lado}', zz, (0.0, y, TOBILLO), padre=f'pierna_{lado}')
        clay.blob(f'zapato {lado}', (0.05, y, 0.05), (0.12, 0.063, 0.05), c, zap, n=12, subsurf=2, p=2.3)
        clay.blob(f'punta {lado}', (0.13, y, 0.045), (0.05, 0.058, 0.04), c, zap, n=8, subsurf=2)
        clay.rbox(f'suela {lado}', (0.05, y, 0.008), (0.125, 0.064, 0.012), c, suela, p=4.0, n=6, subsurf=2)
        for k in range(3):
            o = clay.sweep(f'cordón {lado} {k}', [(0.05 + k * 0.025, y - 0.03, 0.095 - k * 0.006), (0.05 + k * 0.025, y + 0.03, 0.095 - k * 0.006)],
                           0.006, (1, 1), c, hilo, segments=5, samples=2, caps=('round', 'round'))
            sin_contorno(o)

    if atleta:
        # Camiseta deportiva sin mangas con una franja blanca y el número; cuello de piel.
        c = p.pieza('cuerpo', 5, (0.0, 0, CADERA))
        clay.blob('camiseta', (0.02, 0, 0.72), (0.15, 0.175, 0.235), c, camiseta, n=14, subsurf=2, p=2.4)
        clay.blob('faldón', (0.0, 0, 0.565), (0.145, 0.17, 0.085), c, camiseta, n=10, subsurf=2)
        o = clay.blob('franja', (0.01, 0, 0.6), (0.153, 0.178, 0.03), c, franja_b, n=12, subsurf=2)
        clay.blob('pecho piel', (0.1, 0, 0.88), (0.07, 0.11, 0.05), c, piel, n=10, subsurf=2)
        cuello = clay.lathe('cuello camiseta', [(0.1, -0.012), (0.105, 0.0), (0.1, 0.012)], c, mat('cuello camiseta', '#8E1A12', rough=0.6), segments=24,
                            cap_bottom=False, cap_top=False)
        cuello.location = (0.05, 0.0, 0.9)
        cuello.scale = (1.0, 1.2, 1.0)
        sin_contorno(cuello)
        bpy.ops.object.text_add(location=(0.172, 0.005, 0.7))
        t = bpy.context.active_object
        t.data.body = '0'
        t.data.size = 0.16
        t.data.align_x = 'CENTER'
        t.data.extrude = 0.006
        t.data.bevel_depth = 0.003
        t.rotation_euler = (math.radians(90), 0, math.radians(90))
        bpy.ops.object.convert(target='MESH')
        t = bpy.context.active_object
        t.data.materials.clear()
        t.data.materials.append(franja_b)
        clay.link(t, c)
        t['contorno'] = 0.005
    else:
        # Torso inclinado hacia adelante: saco abierto con solapas, hombreras, bolsillo, botones y el dobladillo roto.
        c = p.pieza('cuerpo', 5, (0.0, 0, CADERA))
        def tela_cuerpo(q):
            a = np.arctan2(q[:, 1], q[:, 0])
            z = q[:, 2]
            abajo = np.clip((-z - 0.12) / 0.13, 0.0, 1.0)       # parte baja: se ensancha y el borde queda irregular
            ensancha = 1.0 + 0.1 * abajo
            borde = 0.022 * abajo * (np.sin(a * 5.0 + 1.0) + 0.6 * np.sin(a * 11.0))
            return np.column_stack([q[:, 0] * ensancha, q[:, 1] * ensancha, z + borde])
        sc = clay.blob('saco', (0.02, 0, 0.715), (0.168, 0.195, 0.255), c, tela, n=18, subsurf=2, p=2.8, shaper=tela_cuerpo)
        arrugar(sc, 0.016, 0.3, 'pliegues saco')
        for s_ in (-1, 1):
            hb = clay.blob(f'hombrera {s_}', (0.02, s_ * 0.17, 0.86), (0.085, 0.075, 0.058), c, tela, n=10, subsurf=2)
            arrugar(hb, 0.008, 0.25, 'pliegues hombro')
        clay.blob('camisa', (0.115, 0, 0.77), (0.075, 0.095, 0.16), c, blanca, n=10, subsurf=2)
        for s_ in (-1, 1):
            o = clay.sweep(f'cuello camisa {s_}', [(0.1, s_ * 0.065, 0.93), (0.145, s_ * 0.05, 0.9), (0.165, s_ * 0.03, 0.865)], 0.024, (1.0, 0.35), c, blanca,
                           segments=8, samples=4, caps=('round', 'point'), up=(1, 0, 0))
            o['contorno'] = 0.01
            clay.sweep(f'solapa {s_}', [(0.125, s_ * 0.09, 0.9), (0.155, s_ * 0.085, 0.8), (0.16, s_ * 0.06, 0.68), (0.145, s_ * 0.03, 0.6)],
                       [0.03, 0.036, 0.03, 0.012], (1.0, 0.3), c, tela_osc, segments=8, samples=5, caps=('round', 'point'), up=(1, 0, 0))
        for k, z in enumerate((0.64, 0.565)):
            b_ = clay.blob(f'botón {k}', (0.168, 0.075, z), (0.008, 0.014, 0.014), c, boton, n=6, subsurf=1)
            sin_contorno(b_)
        st = clay.stitches('costura hombro', [(0.0, 0.2, 0.84), (0.06, 0.2, 0.82), (0.12, 0.19, 0.79)], radius=0.004, dash=0.014, gap=0.01, coll=c,
                           material=mat('hilo oscuro', '#3A2715', rough=0.8))
        if st:
            sin_contorno(st)

        c = p.pieza('corbata', 6, (0.15, 0, 0.88), padre='cuerpo')
        clay.blob('nudo', (0.158, 0.0, 0.875), (0.026, 0.03, 0.026), c, roja, n=8, subsurf=2)
        clay.sweep('corbata', [(0.16, 0.0, 0.86), (0.18, 0.012, 0.76), (0.185, 0.03, 0.66), (0.175, 0.045, 0.6)], [0.02, 0.034, 0.04, 0.012], (1.0, 0.3), c,
                   roja, segments=8, samples=6, caps=('round', 'point'), up=(1, 0, 0))
        for k in range(3):
            o = clay.sweep(f'raya corbata {k}', [(0.19, 0.01 + k * 0.012, 0.82 - k * 0.07), (0.192, 0.03 + k * 0.012, 0.805 - k * 0.07)], 0.004, (1, 1), c,
                           mat('raya corbata', '#7E1C14', rough=0.5), segments=5, samples=2, caps=('round', 'round'))
            sin_contorno(o)

    # Cabeza: cráneo grande algo cuadrado, ceja pesada, ojeras, ojos desiguales, nariz, orejas, boca abierta y pelos.
    CRA_C, CRA_R = Vector((0.06, 0, 1.2)), Vector((0.21, 0.194, 0.22))
    c = p.pieza('cabeza', 10, (0.04, 0, 0.95), padre='cuerpo')
    def craneo(q):
        a = np.arctan2(q[:, 1], q[:, 0])
        return q * (1.0 + 0.028 * np.sin(a * 3.0 + 0.8) + 0.02 * np.sin(q[:, 2:3].ravel() / 0.22 * 4.0))[:, None]
    cr = clay.blob('cráneo', tuple(CRA_C), tuple(CRA_R), c, piel, n=20, subsurf=2, p=2.2, shaper=craneo)
    arrugar(cr, 0.006, 0.25, 'piel cráneo')
    clay.blob('ceja', (0.2, 0, 1.235), (0.06, 0.16, 0.045), c, piel, n=10, subsurf=2)
    clay.blob('pómulos', (0.13, 0, 1.065), (0.125, 0.15, 0.1), c, piel, n=12, subsurf=2)
    # Cicatriz cosida en la sien visible.
    hilo_c = mat('hilo cicatriz', '#2E2A22', rough=0.8, coat=0.0)
    pts = [en_superficie(CRA_C, CRA_R, d)[0] for d in ((0.55, 0.7, 0.5), (0.2, 0.85, 0.55), (-0.15, 0.85, 0.55), (-0.5, 0.7, 0.55))]
    cic = clay.sweep('cicatriz', [tuple(q + (q - CRA_C).normalized() * 0.003) for q in pts], 0.006, (1, 0.5), c, mat('cicatriz', '#6C7A5C', rough=0.7, coat=0.0),
                     segments=6, samples=6, caps=('round', 'round'))
    sin_contorno(cic)
    for k, q in enumerate(pts):
        for sg in (-1, 1):
            n_ = (q - CRA_C).normalized()
            pp = clay.sweep(f'puntada {k} {sg}', [tuple(q + n_ * 0.004 + Vector((0, 0, sg * 0.022))), tuple(q + n_ * 0.004 - Vector((0, 0, sg * 0.022)))], 0.0035,
                            (1, 1), c, hilo_c, segments=4, samples=2, caps=('round', 'round'))
            sin_contorno(pp)
    clay.sweep('cuello', [(0.01, 0, 0.88), (0.04, 0, 0.96), (0.06, 0, 1.03)], [0.055, 0.05, 0.06], (1, 1), c, piel_osc, segments=12, samples=4,
               caps=('flat', 'flat'))
    for s_ in (-1, 1):
        clay.blob(f'oreja {s_}', (-0.01, s_ * 0.18, 1.14), (0.04, 0.035, 0.06), c, piel, n=8, subsurf=2)
        o = clay.blob(f'oreja dentro {s_}', (0.0, s_ * 0.198, 1.14), (0.022, 0.01, 0.036), c, piel_osc, n=6, subsurf=1)
        sin_contorno(o)
    # Ojos: el cercano grande, abierto de par en par; el lejano chico, con el párpado caído.
    for k, (direc, r, parpado) in enumerate((((0.66, 0.44, 0.28), 0.072, False), ((0.88, -0.12, 0.26), 0.056, True))):
        q, n = en_superficie(CRA_C, CRA_R, direc)
        hund = clay.blob(f'ojera {k}', (0, 0, 0), (r * 1.05, r * 0.45, r * 0.6), c, ojera, n=8, subsurf=2)
        hund.location = q - n * r * 0.22 + Vector((0, 0, -r * 0.62))
        clay.orient_to(hund, n)
        sin_contorno(hund)
        o = clay.blob(f'ojo {k}', (0, 0, 0), (r, r * 0.6, r * 1.05), c, ojo_b, n=10, subsurf=2)
        o.location = q - n * r * 0.05
        clay.orient_to(o, n)
        lado = Vector((0, 0, 1)).cross(n).normalized()
        pu = clay.blob(f'pupila {k}', (0, 0, 0), (r * 0.2, r * 0.13, r * 0.2), c, pupila, n=6, subsurf=1)
        pu.location = q + n * r * 0.52 + Vector((0, 0, -r * 0.18)) + lado * r * (0.2 if k == 0 else -0.1)
        clay.orient_to(pu, n)
        sin_contorno(pu)
        if parpado:
            pa = clay.blob(f'párpado {k}', (0, 0, 0), (r * 1.15, r * 0.7, r * 0.6), c, piel, n=8, subsurf=2)
            pa.location = q + n * r * 0.12 + Vector((0, 0, r * 0.58))
            clay.orient_to(pa, n)
    q, n = en_superficie(CRA_C, CRA_R, (0.95, 0.06, -0.05))
    clay.sweep('nariz', [tuple(q - n * 0.01), tuple(q + n * 0.028 + Vector((0, 0, -0.008))), tuple(q + n * 0.036 + Vector((0, 0, -0.03)))],
               [0.027, 0.025, 0.018], (1, 1), c, piel, segments=8, samples=4, caps=('round', 'round'))
    # Boca abierta y torcida: hueco oscuro, lengua, labios con volumen y una fila de dientes disparejos colgando del labio de arriba.
    q, n = en_superficie((0.13, 0, 1.065), (0.125, 0.15, 0.1), (0.8, 0.32, -0.4))
    lado = Vector((0, 0, 1)).cross(n).normalized()
    arr = n.cross(lado).normalized()
    h = clay.blob('boca', (0, 0, 0), (0.1, 0.034, 0.058), c, boca_m, n=10, subsurf=2)
    h.location = q
    clay.orient_to(h, n)
    sin_contorno(h)
    lg = clay.blob('lengua', (0, 0, 0), (0.055, 0.022, 0.02), c, lengua, n=8, subsurf=2)
    lg.location = q + n * 0.01 - arr * 0.026
    clay.orient_to(lg, n)
    sin_contorno(lg)
    lab_sup = [tuple(q + lado * x + arr * (0.056 - 0.012 * (x / 0.1) ** 2 + 0.004 * math.sin(x * 60)) + n * 0.002) for x in (-0.1, -0.05, 0.0, 0.05, 0.1)]
    ls = clay.sweep('labio sup', lab_sup, [0.008, 0.01, 0.011, 0.01, 0.007], (1.0, 0.8), c, piel_osc, segments=8, samples=5, caps=('round', 'round'))
    ls['contorno'] = 0.008
    lab_inf = [tuple(q + lado * x + arr * (-0.058 + 0.015 * (x / 0.1) ** 2) + n * 0.002) for x in (-0.09, -0.045, 0.0, 0.045, 0.09)]
    li = clay.sweep('labio inf', lab_inf, [0.008, 0.01, 0.011, 0.01, 0.007], (1.0, 0.8), c, piel_osc, segments=8, samples=5, caps=('round', 'round'))
    li['contorno'] = 0.008
    for k, (dx, largo, ang) in enumerate(((-0.075, 0.03, 8), (-0.045, 0.04, -4), (-0.015, 0.034, 6), (0.017, 0.045, -8), (0.05, 0.03, 10), (0.078, 0.024, -5))):
        d = diente_conico(f'diente {k}', c, q + lado * dx + arr * 0.052 + n * 0.012, -arr + lado * math.tan(math.radians(ang)), largo, 0.0125, diente, 0.005)
    arrugar(ls, 0.003, 0.15, 'labio')
    if atleta:
        for k, (d, r) in enumerate((((0.0, 0.0, 1.0), 0.15), ((-0.6, 0.0, 0.6), 0.13), ((0.4, 0.5, 0.65), 0.1), ((0.4, -0.5, 0.65), 0.1),
                                    ((-0.3, 0.6, 0.6), 0.11), ((-0.3, -0.6, 0.6), 0.11), ((0.7, 0.0, 0.62), 0.08))):
            q, nn = en_superficie(CRA_C, CRA_R, d)
            clay.blob(f'mechón {k}', tuple(q - nn * r * 0.35), (r, r * 0.95, r * 0.6), c, rubio, n=10, subsurf=2)
        banda = clay.lathe('cinta', [(1.0, -0.035), (1.06, -0.03), (1.07, 0.0), (1.06, 0.03), (1.0, 0.035)], c, azul, segments=36, cap_bottom=False,
                           cap_top=False)
        banda.scale = (CRA_R.x * 1.0, CRA_R.y * 1.02, 1.0)
        banda.location = CRA_C + Vector((0.0, 0.0, 0.08))
        banda.rotation_euler = (0, math.radians(-8), 0)
        for s_ in (-1, 1):
            clay.sweep(f'nudo cinta {s_}', [tuple(CRA_C + Vector((-CRA_R.x * 1.02, 0.0, 0.08))), tuple(CRA_C + Vector((-CRA_R.x * 1.25, s_ * 0.05, 0.02))),
                                             tuple(CRA_C + Vector((-CRA_R.x * 1.45, s_ * 0.07, -0.04)))], [0.03, 0.028, 0.02], (1.0, 0.3), c, azul,
                       segments=6, samples=4, caps=('round', 'point'), up=(0, 0, 1))
    else:
        for k, (x, y, dx, dz, curva) in enumerate(((-0.06, -0.02, 0.05, 0.09, 0.03), (-0.02, 0.02, 0.07, 0.11, -0.02), (0.02, -0.01, 0.09, 0.08, 0.035),
                                                    (-0.1, 0.03, -0.02, 0.07, 0.03))):
            z = 1.39 - abs(x) * 0.2
            o = clay.sweep(f'pelo {k}', [(x, y, z - 0.01), (x + dx * 0.4, y, z + dz * 0.6), (x + dx, y + curva, z + dz), (x + dx * 1.3, y + curva * 1.5, z + dz * 0.8)],
                           [0.008, 0.007, 0.005, 0.002], (1, 1), c, pelo, segments=5, samples=5, caps=('round', 'point'))
            o['contorno'] = 0.005
    c = p.pieza('mandibula', 9, (0.06, 0, 1.0), padre='cabeza')
    clay.blob('mandíbula', (0.135, 0, 0.955), (0.11, 0.13, 0.048), c, piel, n=10, subsurf=2)
    clay.blob('mentón', (0.2, 0, 0.945), (0.045, 0.07, 0.04), c, piel, n=8, subsurf=2)
    for k in range(2):
        d = clay.blob(f'diente abajo {k}', (0.222, -0.025 + k * 0.05, 0.983), (0.012, 0.013, 0.018), c, diente, n=6, subsurf=1)
        d['contorno'] = 0.006

    # Brazos colgando: derecho lejos (detrás del cuerpo), izquierdo cerca (delante).
    for lado, s_, zb in (('der', -1, 0), ('izq', 1, 12)):
        y = s_ * 0.19
        c = p.pieza(f'brazo_{lado}', zb, (0.0, y, HOMBRO), padre='cuerpo')
        if atleta:
            clay.sweep(f'brazo {lado}', [(0.0, y, HOMBRO + 0.02), (0.005, y * 1.04, CODO)], [0.05, 0.044], (1, 1), c, piel, segments=12, samples=5,
                       caps=('round', 'round'))
            clay.blob(f'sisa {lado}', (0.0, y * 0.97, HOMBRO + 0.01), (0.065, 0.06, 0.05), c, camiseta, n=10, subsurf=2)
        else:
            o = clay.sweep(f'manga {lado}', [(0.0, y, HOMBRO + 0.02), (0.003, y * 1.02, (HOMBRO + CODO) / 2), (0.005, y * 1.04, CODO)], [0.068, 0.063, 0.057],
                           (1, 1), c, tela, segments=16, samples=5, caps=('round', 'round'))
            arrugar(o, 0.013, 0.28, 'pliegues manga')
        if lado == 'izq':
            # Variante «roto»: la manga deshecha y el hueso a la vista (cuando pierde el antebrazo).
            cv = p.variante('brazo_izq', 'roto')
            if atleta:
                clay.sweep('brazo roto', [(0.0, y, HOMBRO + 0.02), (0.005, y * 1.04, CODO + 0.04)], [0.05, 0.046], (1, 1), cv, piel, segments=12, samples=5,
                           caps=('round', 'flat'))
                clay.blob('sisa rota', (0.0, y * 0.97, HOMBRO + 0.01), (0.065, 0.06, 0.05), cv, camiseta, n=10, subsurf=2)
            else:
                clay.sweep('manga rota', [(0.0, y, HOMBRO + 0.02), (0.005, y * 1.04, CODO + 0.04)], [0.062, 0.056], (1, 1), cv, tela, segments=12, samples=5,
                           caps=('round', 'flat'))
                jirones('manga rota', cv, tela, (0.005, y * 1.04), 0.055, CODO + 0.045, 7, largo=0.04, ancho=0.022, semilla=2)
            clay.sweep('hueso', [(0.005, y * 1.04, CODO + 0.05), (0.005, y * 1.04, CODO - 0.05)], 0.017, (1, 1), cv, hueso, segments=8, samples=3,
                       caps=('flat', 'round'))
            clay.blob('punta hueso', (0.005, y * 1.04, CODO - 0.06), (0.026, 0.022, 0.022), cv, hueso, n=6, subsurf=1)
        c = p.pieza(f'antebrazo_{lado}', zb + 0.1, (0.005, y * 1.04, CODO), padre=f'brazo_{lado}')
        if atleta:
            clay.sweep(f'antebrazo {lado}', [(0.005, y * 1.04, CODO + 0.01), (0.0, y * 1.07, MUNECA + 0.02)], [0.043, 0.038], (1, 1), c, piel, segments=12,
                       samples=5, caps=('round', 'flat'))
            clay.sweep(f'muñequera {lado}', [(0.0, y * 1.07, MUNECA + 0.075), (0.0, y * 1.07, MUNECA + 0.02)], 0.044, (1, 1), c, azul, segments=12, samples=2,
                       caps=('flat', 'flat'))
        else:
            o = clay.sweep(f'antebrazo {lado}', [(0.005, y * 1.04, CODO + 0.01), (0.002, y * 1.055, (CODO + MUNECA) / 2), (0.0, y * 1.07, MUNECA + 0.03)],
                           [0.058, 0.053, 0.056], (1, 1), c, tela, segments=16, samples=5, caps=('round', 'flat'))
            arrugar(o, 0.011, 0.28, 'pliegues antebrazo')
            pu = clay.blob(f'puño {lado}', (0.0, y * 1.07, MUNECA + 0.025), (0.047, 0.047, 0.026), c, blanca, n=10, subsurf=2)
            arrugar(pu, 0.006, 0.2, 'puño')
        c = p.pieza(f'mano_{lado}', zb + 0.2, (0.0, y * 1.07, MUNECA), padre=f'antebrazo_{lado}')
        mano_zombi(lado, c, piel, una, (0.0, y * 1.07, MUNECA), s_)
    p.punto('cabeza', (0.06, 0, 1.42))
    p.punto('boca', (0.22, 0, 1.0))
    if extra:
        extra(p)
    # Postura de zombi: el torso cae hacia adelante desde la cadera y la cabeza un poco más.
    arriba = ['cuerpo', 'corbata', 'cabeza', 'mandibula'] + [f'{a}_{l}' for a in ('brazo', 'antebrazo', 'mano') for l in ('der', 'izq')]
    p.inclinar(arriba + p.extras_torso, (0.0, 0, CADERA), 9)
    p.inclinar(['cabeza', 'mandibula'] + p.extras_cabeza, (0.04, 0, 0.95), 6)
    for k in ('cabeza', 'boca'):
        p.puntos[k] = Matrix.Rotation(math.radians(9), 4, 'Y') @ (p.puntos[k] - Vector((0, 0, CADERA))) + Vector((0, 0, CADERA))
    p.terminar()
    return p


def con_cono(p):
    """Cono de tránsito naranja con franjas reflectivas sobre la cabeza (intacto, abollado y muy abollado)."""
    naranja = mat_pvz('cono', '#FF7A1A', arriba='#FF9A3C', abajo='#D9560A', z0=1.3, z1=1.9, ruido=0.05, rough=0.35, coat=0.4, sss=0.0)
    franja = mat('cono franja', '#F4F4EE', rough=0.25, coat=0.6)
    hueco = mat('cono hueco', '#3A1A08', rough=0.9)
    base_c = Vector((0.06, 0.0, 1.34))

    def cono(coll, dobla, aplasta, roto):
        alto = 0.52 * aplasta
        perfil = [(0.17, 0.0), (0.15, alto * 0.25), (0.12, alto * 0.5), (0.085, alto * 0.75), (0.04, alto * 0.97), (0.0, alto)]
        o = clay.lathe('cono', perfil, coll, naranja, segments=32, cap_bottom=False)
        o.location = base_c + Vector((0, 0, 0.03))
        for k, (z0, z1) in enumerate(((0.3, 0.42), (0.62, 0.72))):
            r0 = 0.17 - 0.13 * z0
            r1 = 0.17 - 0.13 * z1
            f = clay.lathe(f'franja {k}', [(r0 + 0.006, alto * z0), (r1 + 0.006, alto * z1)], coll, franja, segments=32, cap_bottom=False, cap_top=False)
            f.location = o.location
            sin_contorno(f)
        b = clay.rbox('base cono', tuple(base_c + Vector((0, 0, 0.02))), (0.22, 0.22, 0.025), coll, naranja, p=4.0, n=6, subsurf=2)
        if dobla:
            # Abolladura: la punta se tuerce hacia atrás y aparece una mella.
            m = o.modifiers.new('doblar', 'SIMPLE_DEFORM')
            m.deform_method = 'BEND'
            m.angle = math.radians(dobla)
            m.deform_axis = 'Y'
            o.modifiers.move(len(o.modifiers) - 1, 0)
        if roto:
            h = clay.blob('mella', tuple(base_c + Vector((0.09, -0.06, alto * 0.55))), (0.035, 0.02, 0.05), coll, hueco, n=6, subsurf=1)
            sin_contorno(h)
        return o, b

    for var, (dobla, aplasta, roto) in ((None, (0, 1.0, False)), ('abollado', (-25, 0.92, False)), ('muy_abollado', (-55, 0.8, True))):
        coll = p.pieza('cono', 11, tuple(base_c), padre='cabeza') if var is None else p.variante('cono', var)
        cono(coll, dobla, aplasta, roto)
        girar_coll(coll, base_c, -10)
    p.extras_cabeza.append('cono')
    p.punto('cabeza', tuple(base_c + Vector((0, 0, 0.55))))


def con_cubo(p):
    """Balde de lata al revés tapando la frente, con su asa y una mancha de pintura roja (sano, abollado, muy abollado)."""
    lata = mat_pvz('cubo', '#9AA2AB', arriba='#C2C8CF', abajo='#6E757E', z0=1.15, z1=1.6, ruido=0.08, ruido_escala=25,
                   manchas=dict(color='#7C838B', escala=10, cantidad=0.25), bump=0.2, bump_escala=50, rough=0.25, coat=0.3, sss=0.0)
    lata.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.85
    pintura = mat('pintura cubo', '#C8302A', rough=0.4, coat=0.2)
    oscuro = mat('cubo dentro', '#3B3F45', rough=0.6)
    base_c = Vector((0.09, 0.0, 1.14))

    def cubo(coll, golpes):
        perfil = [(0.235, 0.0), (0.24, 0.02), (0.225, 0.04), (0.205, 0.2), (0.185, 0.32), (0.17, 0.335), (0.0, 0.34)]
        o = clay.lathe('cubo', perfil, coll, lata, segments=36, cap_bottom=False)
        o.location = base_c
        for k, z in enumerate((0.07, 0.24)):
            r = 0.235 - 0.14 * z
            a = clay.lathe(f'aro {k}', [(r + 0.008, z - 0.012), (r + 0.012, z), (r + 0.008, z + 0.012)], coll, lata, segments=36, cap_bottom=False, cap_top=False)
            a.location = base_c
            sin_contorno(a)
        pm = clay.blob('mancha pintura', tuple(base_c + Vector((0.16, -0.12, 0.17))), (0.05, 0.035, 0.06), coll, pintura, n=8, subsurf=2)
        sin_contorno(pm)
        clay.sweep('asa', [tuple(base_c + Vector((-0.02, 0.22, 0.06))), tuple(base_c + Vector((-0.15, 0.3, 0.0))), tuple(base_c + Vector((-0.24, 0.18, 0.04)))],
                   0.008, (1, 1), coll, mat('asa cubo', '#5B6068', rough=0.3, metallic=0.9), segments=6, samples=6, caps=('round', 'round'))
        for k, (d, r) in enumerate(golpes):
            g = clay.blob(f'golpe {k}', tuple(base_c + Vector(d)), (r, r * 0.6, r * 0.8), coll, oscuro, n=8, subsurf=2)
            sin_contorno(g)
        return o

    for var, golpes in ((None, []), ('abollado', [((0.2, -0.08, 0.22), 0.03), ((0.12, -0.17, 0.1), 0.025)]),
                        ('muy_abollado', [((0.2, -0.08, 0.22), 0.04), ((0.12, -0.17, 0.1), 0.035), ((0.21, 0.05, 0.08), 0.035), ((0.05, -0.19, 0.27), 0.03)])):
        coll = p.pieza('cubo', 11, tuple(base_c), padre='cabeza') if var is None else p.variante('cubo', var)
        o = cubo(coll, golpes)
        if var == 'muy_abollado':
            o.scale = (1.04, 1.0, 0.9)
        girar_coll(coll, base_c, 8)
    p.extras_cabeza.append('cubo')
    p.punto('cabeza', tuple(base_c + Vector((0, 0, 0.38))))


def con_bandera(p):
    """El palo con la bandera roja del cerebro, colgando de la mano lejana (el juego lo gira y lo deja arriba)."""
    madera = mat('asta', '#A8743E', rough=0.55, coat=0.2)
    roja = mat_pvz('bandera', '#C8262B', arriba='#E0443F', abajo='#9A1A1E', z0=-0.6, z1=0.0, ruido=0.06, bump=0.15, bump_escala=60, rough=0.7,
                   coat=0.0, sss=0.0, sheen=0.4)
    rosa = mat('cerebro', '#F7A6B8', rough=0.45, coat=0.3)
    surco = mat('cerebro surco', '#C4566E', rough=0.6)
    hueco = mat('agujero bandera', '#2A1A10', rough=0.9)
    M = Vector((0.0, -0.19 * 1.07, 0.48))   # muñeca derecha (lejana)
    c = p.pieza('asta', 0.3, tuple(M), padre='mano_der')
    clay.sweep('asta', [tuple(M + Vector((0, 0, 0.06))), tuple(M + Vector((0, 0, -0.92)))], 0.016, (1, 1), c, madera, segments=8, samples=2,
               caps=('round', 'round'))
    clay.blob('puño asta', tuple(M + Vector((0.01, 0.0, -0.02))), (0.042, 0.04, 0.05), c, mat('mano asta', PIEL_ZOMBI, rough=0.6), n=8, subsurf=2)
    tope = M + Vector((0, 0, -0.58))

    def tela(coll, agujeros):
        def f(u, v):
            # u: a lo largo del palo hacia adelante (+X), v: de arriba a abajo; ondas suaves.
            x = 0.48 * u
            z = -0.36 * (v + 1) / 2 - 0.02 * math.sin(u * 3.0)
            y = 0.03 * math.sin(u * 6.0 + v) - 0.01
            return tope + Vector((x, y, z))
        o = superficie('bandera', f, 14, 6, coll, roja, grosor=0.01)
        cen = tope + Vector((0.25, -0.03, -0.18))
        g = clay.blob('cerebro', tuple(cen), (0.09, 0.02, 0.06), coll, rosa, n=10, subsurf=2)
        g.rotation_euler = (0, 0, 0)
        for k in range(3):
            o2 = clay.sweep(f'surco {k}', [tuple(cen + Vector((-0.06 + k * 0.05, -0.022, 0.03))), tuple(cen + Vector((-0.04 + k * 0.05, -0.024, -0.01))),
                                           tuple(cen + Vector((-0.06 + k * 0.05, -0.022, -0.04)))], 0.005, (1, 1), coll, surco, segments=5, samples=3)
            sin_contorno(o2)
        if agujeros:
            for k, (d, r) in enumerate((((0.38, -0.05, -0.12), 0.035), ((0.12, -0.05, -0.27), 0.025), ((0.42, -0.05, -0.3), 0.03))):
                h = clay.blob(f'agujero {k}', tuple(tope + Vector(d)), (r, 0.012, r), coll, hueco, n=6, subsurf=1)
                sin_contorno(h)

    tela(p.pieza('bandera', 0.25, tuple(tope + Vector((0, 0, -0.02))), padre='asta'), False)
    tela(p.variante('bandera', 'agujereada'), True)
    p.extras_torso += ['asta', 'bandera']


def con_pertiga(p):
    """La pértiga, en la mano lejana, horizontal y apuntando adelante (la suelta, para el salto, es el dibujo SVG)."""
    madera = mat('pértiga', '#C99A5A', rough=0.5, coat=0.25)
    cinta = mat('cinta pértiga', '#D43A2A', rough=0.5)
    M = Vector((0.0, -0.19 * 1.07, 0.48))
    c = p.pieza('pertiga', 11, tuple(M), padre='mano_der')
    a, b = M + Vector((1.45, 0.0, 0.0)), M + Vector((-0.55, 0.0, 0.0))
    clay.sweep('pértiga', [tuple(a), tuple(b)], 0.017, (1, 1), c, madera, segments=8, samples=2, caps=('round', 'round'))
    for t in (0.3, 0.62):
        q = a + (b - a) * t
        o = clay.sweep(f'cinta {t}', [tuple(q - (b - a).normalized() * 0.04), tuple(q + (b - a).normalized() * 0.04)], 0.02, (1, 1), c, cinta, segments=8,
                       samples=2, caps=('flat', 'flat'))
        o['contorno'] = 0.006
    p.extras_torso.append('pertiga')
    p.conservar = ['pertiga_suelta']


# ---------------------------------------------------------------------------------------------------------------
# Dave el Loco (diálogos)

def mat_cuadros(nombre, c1, c2, c3, escala=7.0):
    """Tela de franela a cuadros: dos juegos de franjas cruzadas (X y Z) sobre el color base."""
    m = mat(nombre, c1, rough=0.8, coat=0.0, sss=0.0, sheen=0.4, sheen_rough=0.5)
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(geo.outputs['Position'], sep.inputs['Vector'])

    def franjas(eje):
        mul = nt.nodes.new('ShaderNodeMath')
        mul.operation = 'MULTIPLY'
        mul.inputs[1].default_value = escala
        nt.links.new(sep.outputs[eje], mul.inputs[0])
        fr = nt.nodes.new('ShaderNodeMath')
        fr.operation = 'FRACT'
        nt.links.new(mul.outputs[0], fr.inputs[0])
        lt = nt.nodes.new('ShaderNodeMath')
        lt.operation = 'LESS_THAN'
        lt.inputs[1].default_value = 0.42
        nt.links.new(fr.outputs[0], lt.inputs[0])
        return lt.outputs[0]

    fx, fz = franjas('X'), franjas('Z')
    suma = nt.nodes.new('ShaderNodeMath')
    suma.operation = 'ADD'
    nt.links.new(fx, suma.inputs[0])
    nt.links.new(fz, suma.inputs[1])
    rampa = nt.nodes.new('ShaderNodeValToRGB')
    rampa.color_ramp.interpolation = 'CONSTANT'
    e = rampa.color_ramp.elements
    e[0].position, e[0].color = 0.0, clay.rgb(c1)
    e[1].position, e[1].color = 0.4, clay.rgb(c2)
    e.new(0.8).color = clay.rgb(c3)
    div = nt.nodes.new('ShaderNodeMath')
    div.operation = 'DIVIDE'
    div.inputs[1].default_value = 2.0
    nt.links.new(suma.outputs[0], div.inputs[0])
    nt.links.new(div.outputs[0], rampa.inputs['Fac'])
    nt.links.new(rampa.outputs['Color'], bsdf.inputs['Base Color'])
    return m


def dave(ident='dave'):
    """Dave el Loco: barba de tres días, nariz grande, pelo revuelto saliendo de una olla puesta de sombrero, camisa de
    franela roja a cuadros, jean y botas. Ojos, cejas y boca con siete ánimos; boca de hablar media y abierta."""
    # Mira a +X y se gira hacia la cámara: su lado izquierdo (−Y) queda adelante, como el brazo «izq» del dibujo.
    p = Personaje(ident, giro=-68.0)
    piel = mat_pvz('dave piel', '#F2BE94', arriba='#F7CDA6', abajo='#D99C70', z0=1.7, z1=2.4, ruido=0.04, rough=0.5, coat=0.1, sss=0.15)
    barba = mat('dave barba', '#6A5A4C', rough=0.9, coat=0.0, noise=dict(scale=300, strength=0.6, distance=0.004))
    pelo = mat_pvz('dave pelo', '#6B4A2E', arriba='#7E5A38', abajo='#4E3420', z0=2.0, z1=2.4, ruido=0.1, bump=0.5, bump_escala=80, rough=0.7,
                   coat=0.05, sss=0.0)
    camisa = mat_cuadros('dave camisa', '#B8322A', '#7A1C17', '#2B1A16')
    jean = mat_pvz('dave jean', '#3D5E8C', arriba='#4A6E9E', abajo='#2E4A70', z0=0.1, z1=1.0, ruido=0.08, bump=0.2, bump_escala=200, rough=0.8,
                   coat=0.0, sss=0.0, sheen=0.3)
    bota = mat_pvz('dave bota', '#6A4428', ruido=0.1, rough=0.5, coat=0.3, sss=0.0)
    suela = mat('suela', '#2A2018', rough=0.8, coat=0.0)
    olla = mat_pvz('dave olla', '#A9B0B8', arriba='#D3D8DE', abajo='#7C838C', z0=2.3, z1=2.8, ruido=0.05, rough=0.22, coat=0.4, sss=0.0)
    olla.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.85
    negro = mat_brillo('ojo negro', '#141414')
    blanco_m = mat('ojo blanco', '#FFFFFF', rough=0.25, coat=0.5)
    brillo = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    ceja_m = mat('dave ceja', '#4E3420', rough=0.7)
    boca_m = mat('dave boca', '#5A1A14', rough=0.7)
    lengua = mat('dave lengua', '#D2606A', rough=0.4)
    diente = mat('diente', '#F7F3E3', rough=0.3, coat=0.3)
    linea = mat('dave línea', '#7A3A20', rough=0.6)
    boton = mat('botón', '#2B1D12', rough=0.3, coat=0.5)

    CAD, HOM, COD, MUN, CUE = 0.96, 1.66, 1.27, 0.89, 1.76
    for lado, s_, zp in (('der', 1, 1), ('izq', -1, 2)):
        y = s_ * 0.13
        c = p.pieza(f'pierna_{lado}', zp, (0, y, CAD))
        clay.sweep(f'jean {lado}', [(0.0, y, CAD + 0.05), (0.03, y, 0.55), (0.0, y, 0.12)], [0.12, 0.105, 0.11], (1, 1), c, jean, segments=14, samples=6,
                   caps=('round', 'flat'))
        o = clay.stitches(f'costura jean {lado}', [(0.0, y + s_ * 0.105, CAD), (0.03, y + s_ * 0.1, 0.55), (0.0, y + s_ * 0.105, 0.15)], radius=0.005,
                          dash=0.02, gap=0.015, coll=c, material=mat('hilo jean', '#E0A84A', rough=0.7))
        if o:
            sin_contorno(o)
        c = p.pieza(f'zapato_{lado}', zp + 0.1, (0.0, y, 0.1), padre=f'pierna_{lado}')
        clay.blob(f'bota {lado}', (0.06, y, 0.08), (0.17, 0.09, 0.08), c, bota, n=12, subsurf=2, p=2.3)
        clay.sweep(f'caña bota {lado}', [(0.0, y, 0.06), (0.0, y, 0.2)], 0.1, (1, 1), c, bota, segments=12, samples=2, caps=('flat', 'flat'))
        clay.rbox(f'suela {lado}', (0.06, y, 0.015), (0.175, 0.095, 0.018), c, suela, p=4.0, n=6, subsurf=2)
    c = p.pieza('cuerpo', 5, (0.0, 0, CAD))
    clay.blob('panza', (0.03, 0, 1.3), (0.27, 0.3, 0.4), c, camisa, n=16, subsurf=2, p=2.3)
    clay.blob('cinturón', (0.02, 0, 1.0), (0.25, 0.28, 0.05), c, mat('cinturón', '#3A2618', rough=0.5, coat=0.2), n=12, subsurf=2)
    clay.rbox('hebilla', (0.27, 0.0, 1.0), (0.012, 0.05, 0.035), c, mat('hebilla', '#D8B24A', rough=0.2, metallic=0.9), p=4, n=5, subsurf=1)
    for k in range(4):
        b_ = clay.blob(f'botón {k}', (0.3 - abs(k - 1.5) * 0.01, 0.0, 1.55 - k * 0.15), (0.01, 0.018, 0.018), c, boton, n=6, subsurf=1)
        sin_contorno(b_)
    for s_ in (-1, 1):
        clay.sweep(f'cuello camisa {s_}', [(0.12, s_ * 0.1, 1.72), (0.22, s_ * 0.08, 1.65), (0.26, s_ * 0.03, 1.58)], 0.04, (1.0, 0.35), c, camisa,
                   segments=8, samples=4, caps=('round', 'point'), up=(1, 0, 0))
    clay.rbox('bolsillo', (0.26, -0.13, 1.42), (0.02, 0.07, 0.07), c, camisa, p=5, n=5, subsurf=1)
    # Cabeza: cráneo, mejillas, barba de tres días, nariz grande, orejas y pelo que sale por debajo de la olla.
    CC, CR = Vector((0.05, 0.0, 2.08)), Vector((0.27, 0.25, 0.3))
    c = p.pieza('cabeza', 10, (0.03, 0, CUE), padre='cuerpo')
    clay.sweep('cuello', [(0.0, 0, 1.68), (0.03, 0, 1.86)], 0.1, (1, 1), c, piel, segments=12, samples=2, caps=('flat', 'flat'))
    clay.blob('cráneo', tuple(CC), tuple(CR), c, piel, n=16, subsurf=2)
    clay.blob('mandíbula', (0.1, 0.0, 1.92), (0.22, 0.23, 0.16), c, piel, n=12, subsurf=2)
    b = clay.blob('barba', (0.11, 0.0, 1.91), (0.235, 0.245, 0.17), c, barba, n=12, subsurf=2,
                  shaper=lambda q: q * [1, 1, 1] - np.column_stack([np.zeros(len(q)), np.zeros(len(q)), np.maximum(0, q[:, 2]) * 0.4]))
    b['contorno'] = 0.012
    n, u, v = base_cara((1.0, 0.0, 0.0))
    q, nn = en_superficie(CC, CR, (n + Vector((0, 0, -0.06))).normalized())
    clay.blob('nariz', tuple(q + nn * 0.045), (0.062, 0.058, 0.072), c, piel, n=10, subsurf=2)
    for s_ in (-1, 1):
        clay.blob(f'oreja {s_}', (-0.02, s_ * 0.26, 2.06), (0.05, 0.04, 0.08), c, piel, n=8, subsurf=2)
    for k in range(9):
        a = -2.2 + k * 0.55
        d = Vector((math.cos(a) * 0.9, math.sin(a), 0.25)).normalized()
        q, nn = en_superficie(CC, CR, d)
        if d.x > 0.5:
            continue
        clay.sweep(f'mechón {k}', [tuple(q + Vector((0, 0, 0.05))), tuple(q + nn * 0.1 + Vector((0, 0, 0.02))), tuple(q + nn * 0.17 - Vector((0, 0, 0.05)))],
                   [0.05, 0.035, 0.003], (1.0, 0.5), c, pelo, segments=6, samples=4, caps=('round', 'point'), up=(0, 0, 1))
    # Rasgos de la cara: posiciones en la superficie del cráneo mirando hacia n.
    def cara(dx, dz):
        q, nn = en_superficie(CC, CR, (n + u * dx + Vector((0, 0, dz))).normalized())
        return q, nn
    ojos_p = {lado_: cara(lado_ * 0.36, 0.25) for lado_ in (-1, 1)}
    ANIMOS = ('loco', 'feliz', 'serio', 'asustado', 'enojado', 'triste')

    def ojos(coll, animo):
        for lado_, (q, nn) in ojos_p.items():
            r = 0.074
            if animo == 'feliz':
                ceja(f'ojo feliz {lado_}', coll, q - u * r * 0.9 - v * r * 0.1, q + u * r * 0.9 - v * r * 0.1, 0.014, negro, nn)
                continue
            esc = {'loco': (1.25 if lado_ == 1 else 0.85), 'asustado': 1.25}.get(animo, 1.0)
            alto = {'serio': 0.75, 'enojado': 0.7, 'triste': 0.85}.get(animo, 1.0)
            ojo_blanco(f'ojo {lado_}', coll, q - nn * 0.01, nn, r * esc, blanco_m, alto=1.2 * alto)
            pr = r * esc * (0.32 if animo == 'asustado' else 0.45)
            off = {'loco': (u * 0.012 * lado_ + v * 0.01), 'triste': -v * 0.015, 'enojado': v * 0.005}.get(animo, Vector((0, 0, 0)))
            pupila(f'pupila {lado_}', coll, q + nn * 0.022 + u * 0.01 + off, nn, pr, negro, brillo)
            if animo in ('serio', 'enojado', 'triste'):
                pa = poner(clay.blob(f'párpado {lado_}', (0, 0, 0), (r * 1.1, r * 0.55, r * 0.6), coll, piel, n=8, subsurf=2), q + nn * 0.01 + v * r * 0.75, nn)

    ojos(p.pieza('ojos', 10.5, tuple(cara(0.0, 0.25)[0]), padre='cabeza'), 'normal')
    for an in ANIMOS:
        ojos(p.variante('ojos', an), an)

    def cejas(coll, animo):
        for lado_, (q, nn) in ojos_p.items():
            base = q + v * 0.1 + nn * 0.02
            inc = {'loco': 0.035 * lado_, 'serio': -0.015, 'asustado': 0.03, 'enojado': -0.04, 'triste': 0.04, 'feliz': 0.02}.get(animo, 0.0)
            alto = {'asustado': 0.04, 'loco': 0.02 if lado_ == 1 else -0.01, 'feliz': 0.02}.get(animo, 0.0)
            # inc > 0 sube la punta de afuera (sorpresa/tristeza invierte el sentido: sube la de adentro).
            adentro = base - u * lado_ * 0.06 + v * (alto + (inc if animo in ('asustado', 'triste') else -inc * 0.5))
            afuera = base + u * lado_ * 0.07 + v * (alto + (-inc * 0.4 if animo in ('asustado', 'triste') else inc))
            ceja(f'ceja {lado_}', coll, adentro, afuera, 0.024, ceja_m, nn)

    cejas(p.pieza('cejas', 12, tuple(cara(0.0, 0.42)[0]), padre='cabeza'), 'normal')
    for an in ANIMOS:
        cejas(p.variante('cejas', an), an)
    # La boca va sobre la barba (si no, la barba la tapa).
    qb, nb = en_superficie((0.11, 0.0, 1.91), (0.235, 0.245, 0.17), Vector((1.0, 0.04, -0.12)).normalized())
    qb = qb + nb * 0.004

    def boca(coll, animo):
        if animo in ('loco', 'feliz', 'asustado'):
            ab = {'loco': (0.12, 0.05), 'feliz': (0.1, 0.045), 'asustado': (0.05, 0.06)}[animo]
            h = poner(clay.blob('boca', (0, 0, 0), (ab[0], 0.03, ab[1]), coll, boca_m, n=10, subsurf=2), qb + nb * 0.01 - v * (0.01 if animo != 'asustado' else 0.0), nb)
            h['contorno'] = 0.01
            if animo != 'asustado':
                d = poner(clay.blob('dientes', (0, 0, 0), (ab[0] * 0.8, 0.02, 0.016), coll, diente, n=8, subsurf=1), qb + nb * 0.025 + v * ab[1] * 0.45, nb)
                sin_contorno(d)
            lg = poner(clay.blob('lengua', (0, 0, 0), (ab[0] * 0.5, 0.02, ab[1] * 0.35), coll, lengua, n=8, subsurf=1), qb + nb * 0.02 - v * ab[1] * 0.45, nb)
            sin_contorno(lg)
            return
        curva = {'normal': 0.02, 'serio': 0.0, 'enojado': -0.025, 'triste': -0.03}[animo]
        ancho_b = 0.09 if animo != 'serio' else 0.075
        pts = [tuple(qb + u * x + v * (-curva * (1 - (x / ancho_b) ** 2)) + nb * 0.012) for x in (-ancho_b, -ancho_b / 2, 0.0, ancho_b / 2, ancho_b)]
        o = clay.sweep('boca curva', pts, [0.008, 0.012, 0.013, 0.012, 0.008], (1, 0.7), coll, linea, segments=8, samples=5)
        o['contorno'] = 0.008

    boca(p.pieza('boca', 11, tuple(qb), padre='cabeza'), 'normal')
    for an in ('normal',) + ANIMOS:
        boca(p.variante('boca', an), an)

    def boca_habla(coll, abierta):
        h = poner(clay.blob('boca habla', (0, 0, 0), (0.085, 0.03, 0.03 + abierta * 0.05), coll, boca_m, n=10, subsurf=2), qb + nb * 0.01 - v * abierta * 0.02, nb)
        h['contorno'] = 0.01
        d = poner(clay.blob('dientes', (0, 0, 0), (0.06, 0.02, 0.012), coll, diente, n=8, subsurf=1), qb + nb * 0.025 + v * 0.02, nb)
        sin_contorno(d)
        lg = poner(clay.blob('lengua', (0, 0, 0), (0.045, 0.02, 0.012 + abierta * 0.02), coll, lengua, n=8, subsurf=1), qb + nb * 0.02 - v * abierta * 0.04, nb)
        sin_contorno(lg)

    boca_habla(p.pieza('boca_habla', 11.1, tuple(qb), padre='cabeza'), 0.2)
    boca_habla(p.variante('boca_habla', 'abierta'), 1.0)
    # La olla boca abajo de sombrero, con su mango y una abolladura.
    c = p.pieza('olla', 13, (0.03, 0.0, 2.32), padre='cabeza')
    o = clay.lathe('olla', [(0.33, 0.0), (0.345, 0.02), (0.33, 0.04), (0.3, 0.06), (0.29, 0.3), (0.25, 0.34), (0.0, 0.35)], c, olla, segments=40, cap_bottom=False)
    o.location = (0.03, 0.0, 2.24)
    o.rotation_euler = (0, math.radians(-8), 0)
    clay.sweep('mango olla', [(-0.27, 0.0, 2.4), (-0.42, 0.0, 2.38), (-0.6, 0.0, 2.33)], [0.03, 0.028, 0.03], (1.0, 0.6), c,
               mat('mango olla', '#2B2B2E', rough=0.4, coat=0.3), segments=10, samples=4, caps=('round', 'round'))
    g = clay.blob('abolladura', (0.2, -0.18, 2.48), (0.05, 0.03, 0.04), c, mat('olla golpe', '#7C838C', rough=0.4, metallic=0.8), n=6, subsurf=1)
    sin_contorno(g)
    # Brazos con manga larga arremangada y manos grandes.
    for lado, s_, zb in (('der', 1, 0), ('izq', -1, 14)):
        y = s_ * 0.3
        c = p.pieza(f'brazo_{lado}', zb, (0.02, y, HOM), padre='cuerpo')
        clay.sweep(f'manga {lado}', [(0.02, y, HOM + 0.03), (0.03, y * 1.03, COD)], [0.095, 0.085], (1, 1), c, camisa, segments=12, samples=4,
                   caps=('round', 'round'))
        c = p.pieza(f'antebrazo_{lado}', zb + 0.1, (0.03, y * 1.03, COD), padre=f'brazo_{lado}')
        clay.sweep(f'remango {lado}', [(0.03, y * 1.03, COD + 0.02), (0.03, y * 1.04, COD - 0.08)], 0.09, (1, 1), c, camisa, segments=12, samples=2,
                   caps=('round', 'flat'))
        clay.sweep(f'antebrazo {lado}', [(0.03, y * 1.04, COD - 0.06), (0.03, y * 1.05, MUN + 0.03)], [0.065, 0.058], (1, 1), c, piel, segments=12, samples=4,
                   caps=('flat', 'round'))
        c = p.pieza(f'mano_{lado}', zb + 0.2, (0.03, y * 1.05, MUN), padre=f'antebrazo_{lado}')
        clay.blob(f'mano {lado}', (0.05, y * 1.05, MUN - 0.07), (0.07, 0.06, 0.085), c, piel, n=10, subsurf=2)
        clay.sweep(f'pulgar {lado}', [(0.08, y * 1.05 + s_ * 0.02, MUN - 0.04), (0.13, y * 1.05 + s_ * 0.03, MUN - 0.09)], [0.026, 0.022], (1, 1), c, piel,
                   segments=8, samples=2, caps=('round', 'round'))
    p.punto('cabeza', (0.03, 0, 2.62))
    p.punto('globo', (0.4, 0, 2.3))
    p.terminar(grosor=0.02)
    return p


# ---------------------------------------------------------------------------------------------------------------
# Objetos: soles, proyectiles, cortacésped, premios

def sol(ident='sol'):
    """El sol: esfera dorada que brilla, con un anillo de rayos (gira aparte) y el halo (dibujo SVG, sin tinte)."""
    p = Personaje(ident, giro=0.0)
    p.sin_sombra = True
    disco = mat('sol disco', '#FFD23A', rough=0.2, coat=0.6, emission='#FFC21A', emission_strength=1.6)
    rayo = mat('sol rayo', '#FFE36A', rough=0.3, coat=0.3, emission='#FFD43A', emission_strength=1.2)
    centro = mat('sol centro', '#FFF6C4', rough=0.2, emission='#FFF2B0', emission_strength=2.5)
    c = p.pieza('rayos', 1, (0, 0, 0))
    n, u, v = base_cara((0.0, -1.0, 0.0))
    for k in range(12):
        a = k * math.tau / 12
        d = u * math.cos(a) + v * math.sin(a)
        largo = 0.16 if k % 2 == 0 else 0.12
        clay.sweep(f'rayo {k}', [tuple(d * 0.17), tuple(d * (0.17 + largo * 0.5)), tuple(d * (0.17 + largo))], [0.045, 0.03, 0.004], (1.0, 0.45), c, rayo,
                   segments=6, samples=3, caps=('flat', 'point'), up=tuple(n))
    c = p.pieza('disco', 2, (0, 0, 0))
    clay.blob('disco', (0, 0, 0), (0.2, 0.12, 0.2), c, disco, n=14, subsurf=2)
    o = poner(clay.blob('centro', (0, 0, 0), (0.11, 0.03, 0.11), c, centro, n=10, subsurf=2), -n * 0.1 + v * 0.03 - u * 0.03, -n)
    sin_contorno(o)
    p.conservar = ['halo']
    p.terminar()
    return p


def guisante(ident='guisante', color='#7DD63A', claro='#C8F58A', oscuro='#3F8F1C', hielo=False):
    p = Personaje(ident, giro=0.0)
    p.sin_sombra = True
    m = mat_pvz(f'{ident} bola', color, arriba=claro, abajo=oscuro, z0=-0.1, z1=0.1, rough=0.25, coat=0.6, sss=0.1)
    c = p.pieza('bola', 1, (0, 0, 0))
    clay.blob('bola', (0, 0, 0), (0.1, 0.1, 0.1), c, m, n=12, subsurf=2)
    brillo = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    o = poner(clay.blob('brillo', (0, 0, 0), (0.03, 0.01, 0.022), c, brillo, n=6, subsurf=1), Vector((-0.035, -0.085, 0.045)), Vector((-0.35, -0.85, 0.45)))
    sin_contorno(o)
    if hielo:
        cristal = mat('cristal hielo', '#E8FBFF', rough=0.08, coat=0.9, transmission=0.3)
        for k in range(5):
            a = k * math.tau / 5 + 0.4
            d = Vector((math.cos(a), -0.3, math.sin(a))).normalized()
            clay.sweep(f'escarcha {k}', [tuple(d * 0.07), tuple(d * 0.13)], [0.02, 0.002], (1, 0.6), c, cristal, segments=5, samples=2, caps=('flat', 'point'),
                       subsurf=0)
        p.conservar = ['estela']
    p.terminar(grosor=0.012)
    return p


def espora(ident='espora'):
    p = Personaje(ident, giro=0.0)
    p.sin_sombra = True
    m = mat_pvz('espora', '#C79BE8', arriba='#E6CCF7', abajo='#8E5CB8', z0=-0.08, z1=0.08, rough=0.6, coat=0.1, sss=0.2, bump=0.4, bump_escala=60)
    c = p.pieza('bola', 1, (0, 0, 0))
    clay.blob('espora', (0, 0, 0), (0.075, 0.075, 0.075), c, m, n=10, subsurf=2,
              shaper=lambda q: q * (1.0 + 0.12 * np.sin(q[:, 0:1] * 80) * np.sin(q[:, 2:3] * 80)))
    p.conservar = ['nube']
    p.terminar(grosor=0.01)
    return p


def cortacesped(ident='cortacesped'):
    """Cortacésped rojo de empujar: carcasa con borde, motor negro con tapa y cuerda, manubrio y ruedas blancas."""
    p = Personaje(ident, giro=-18.0)
    rojo = mat_pvz('cortacésped rojo', '#D8312A', arriba='#F0503E', abajo='#9C1C17', z0=0.05, z1=0.3, ruido=0.04, rough=0.3, coat=0.6, sss=0.0)
    negro = mat('motor', '#2A2A2E', rough=0.35, coat=0.4)
    metal = mat('metal cortacésped', '#B8BEC6', rough=0.25, metallic=0.9)
    goma = mat('rueda goma', '#2B2B2B', rough=0.7)
    llanta = mat('rueda llanta', '#F2F2EE', rough=0.3, coat=0.4)
    amarillo = mat('tapa', '#F2C230', rough=0.3, coat=0.5)
    c = p.pieza('cuerpo', 1, (0.0, 0.0, 0.09))
    clay.rbox('carcasa', (0.02, 0.0, 0.13), (0.3, 0.19, 0.07), c, rojo, p=3.2, n=8, subsurf=2)
    clay.rbox('falda', (0.02, 0.0, 0.07), (0.32, 0.2, 0.025), c, rojo, p=4.0, n=8, subsurf=2)
    clay.lathe('motor', [(0.1, 0.0), (0.1, 0.1), (0.085, 0.13), (0.0, 0.135)], c, negro, segments=24).location = (0.0, 0.0, 0.19)
    clay.lathe('tapa motor', [(0.035, 0.0), (0.035, 0.03), (0.0, 0.035)], c, amarillo, segments=16).location = (0.02, -0.04, 0.32)
    clay.sweep('cuerda', [(-0.06, 0.06, 0.29), (-0.14, 0.08, 0.36), (-0.3, 0.06, 0.42)], 0.006, (1, 1), c, mat('cuerda', '#EDE6CF', rough=0.7), segments=5,
               samples=4)
    for s_ in (-1, 1):
        clay.sweep(f'manubrio {s_}', [(-0.22, s_ * 0.14, 0.17), (-0.4, s_ * 0.15, 0.4), (-0.55, s_ * 0.15, 0.6)], 0.016, (1, 1), c, metal, segments=8, samples=4)
    clay.sweep('agarradera', [(-0.55, -0.17, 0.6), (-0.55, 0.17, 0.6)], 0.026, (1, 1), c, negro, segments=10, samples=2)
    for x in (-0.2, 0.22):
        clay.lathe(f'rueda lejana {x}', [(0.0, -0.025), (0.07, -0.025), (0.078, 0.0), (0.07, 0.025), (0.0, 0.025)], c, goma,
                   segments=24).rotation_euler = (math.radians(90), 0, 0)
        c.objects[-1].location = (x, 0.21, 0.075)
    for nombre, x in (('rueda_a', -0.2), ('rueda_b', 0.22)):
        cr = p.pieza(nombre, 2, (x, -0.21, 0.075), padre='cuerpo')
        o = clay.lathe(nombre, [(0.0, -0.028), (0.072, -0.028), (0.082, 0.0), (0.072, 0.028), (0.0, 0.028)], cr, goma, segments=28)
        o.rotation_euler = (math.radians(90), 0, 0)
        o.location = (x, -0.21, 0.075)
        h = clay.lathe(nombre + ' llanta', [(0.0, 0.0), (0.045, 0.0), (0.05, 0.008), (0.0, 0.012)], cr, llanta, segments=20)
        h.rotation_euler = (math.radians(90), 0, 0)
        h.location = (x, -0.24, 0.075)
        for k in range(4):
            a = k * math.pi / 2
            b = clay.blob(f'{nombre} tuerca {k}', (x + math.cos(a) * 0.025, -0.255, 0.075 + math.sin(a) * 0.025), (0.008, 0.005, 0.008), cr, metal, n=4,
                          subsurf=1)
            sin_contorno(b)
    p.terminar()
    return p


def moneda(ident, color, claro, oscuro):
    p = Personaje(ident, giro=0.0)
    p.sin_sombra = True
    m = mat_pvz(ident, color, arriba=claro, abajo=oscuro, z0=-0.15, z1=0.15, rough=0.2, coat=0.6, sss=0.0)
    m.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.85
    c = p.pieza('moneda', 1, (0, 0, 0))
    n = Vector((0.25, -1.0, 0.0)).normalized()
    o = clay.lathe('moneda', [(0.0, -0.022), (0.14, -0.022), (0.152, 0.0), (0.14, 0.022), (0.0, 0.022)], c, m, segments=36)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(n)
    aro = clay.lathe('aro', [(0.11, 0.0), (0.118, 0.006), (0.11, 0.012)], c, m, segments=36, cap_bottom=False, cap_top=False)
    aro.rotation_mode = 'QUATERNION'
    aro.rotation_quaternion = o.rotation_quaternion
    aro.location = -n * 0.02
    sin_contorno(aro)
    # Emblema: un brote de dos hojas en relieve.
    _, u, v = base_cara(n)
    base = -n * 0.024 - v * 0.05
    clay.sweep('brote', [tuple(base), tuple(base + v * 0.06)], 0.009, (1, 1), c, m, segments=6, samples=2)
    for s_ in (-1, 1):
        hoja('brote hoja', base + v * 0.06, u * s_ * 0.9 + v * 0.6 - n * 0.2, 0.06, 0.022, c, m, pliegue=0.2, caida=0.0, arco=0.0, grosor=0.006, normal=-n)
    p.terminar(grosor=0.012)
    return p


def diamante(ident='diamante'):
    p = Personaje(ident, giro=0.0)
    p.sin_sombra = True
    gema = mat('gema', '#7FD8FF', rough=0.05, coat=1.0, emission='#5ACBFF', emission_strength=0.4)
    c = p.pieza('gema', 1, (0, 0, 0))
    o = clay.lathe('gema', [(0.0, -0.13), (0.16, 0.02), (0.11, 0.08), (0.0, 0.08)], c, gema, segments=8, subsurf=0)
    o.rotation_euler = (math.radians(12), 0, math.radians(22))
    p.conservar = ['destello']
    p.terminar(grosor=0.012)
    return p


def bolsa_monedas(ident='bolsa_monedas'):
    p = Personaje(ident, giro=0.0)
    tela = mat_pvz('bolsa', '#E2C58C', arriba='#F1DCAE', abajo='#A9834A', z0=0.0, z1=0.45, ruido=0.08, bump=0.3, bump_escala=120, rough=0.8, coat=0.0, sss=0.0,
                   sheen=0.4)
    cuerda = mat('cuerda bolsa', '#8A5A2E', rough=0.7)
    oro = mat('oro bolsa', '#F5C542', rough=0.2, metallic=0.85)
    c = p.pieza('bolsa', 1, (0, 0, 0))
    clay.blob('bolsa', (0.0, 0.0, 0.17), (0.2, 0.18, 0.17), c, tela, n=14, subsurf=2,
              shaper=lambda q: q * [1, 1, 1] + np.column_stack([np.zeros(len(q)), np.zeros(len(q)), -0.03 * (q[:, 2] < 0)]))
    clay.blob('cuello bolsa', (0.0, 0.0, 0.36), (0.08, 0.075, 0.06), c, tela, n=10, subsurf=2)
    for k in range(5):
        a = k * math.tau / 5
        clay.sweep(f'boca bolsa {k}', [(0.0, 0.0, 0.38), (math.cos(a) * 0.08, math.sin(a) * 0.07, 0.45)], [0.04, 0.02], (1.0, 0.4), c, tela, segments=6,
                   samples=2, caps=('flat', 'round'))
    o = clay.lathe('nudo', [(0.085, -0.015), (0.092, 0.0), (0.085, 0.015)], c, cuerda, segments=20, cap_bottom=False, cap_top=False)
    o.location = (0.0, 0.0, 0.34)
    o = clay.lathe('moneda bolsa', [(0.0, -0.01), (0.06, -0.01), (0.065, 0.0), (0.06, 0.01), (0.0, 0.01)], c, oro, segments=24)
    o.rotation_euler = (math.radians(80), 0, math.radians(10))
    o.location = (0.06, -0.17, 0.16)
    p.terminar()
    return p


def abono(ident='abono'):
    """Abono: una cápsula verde brillante con hojas en espiral (el halo y la chispa son del dibujo SVG)."""
    p = Personaje(ident, giro=0.0)
    p.sin_sombra = True
    verde = mat_pvz('abono', '#5FD12A', arriba='#C8FF7A', abajo='#1F7A12', z0=-0.15, z1=0.15, rough=0.2, coat=0.7, sss=0.2,
                    )
    hoja_m = mat('abono hoja', '#2E9A1C', rough=0.4, coat=0.4)
    c = p.pieza('capsula', 1, (0, 0, 0))
    clay.blob('cápsula', (0, 0, 0), (0.13, 0.11, 0.16), c, verde, n=12, subsurf=2)
    for k in range(3):
        a = k * math.tau / 3
        hoja(f'hoja abono {k}', (math.cos(a) * 0.05, math.sin(a) * 0.05, 0.12), (math.cos(a + 0.8), math.sin(a + 0.8), 0.7), 0.13, 0.04, c, hoja_m,
             pliegue=0.3, caida=0.4, arco=0.04)
    p.conservar = ['halo', 'chispa']
    p.terminar(grosor=0.012)
    return p


def nuez_rodante(ident, explosiva=False):
    """Nuez de bolos: redonda (rueda); la explosiva es roja con mecha encendida (la chispa es del dibujo SVG)."""
    p = Personaje(ident, giro=0.0)
    if explosiva:
        cascara = mat_pvz(f'{ident} cáscara', '#C8362A', arriba='#E85A42', abajo='#8A1C14', z0=0.05, z1=0.75, ruido=0.12, ruido_escala=7, bump=0.5,
                          bump_escala=18, rough=0.55, coat=0.25)
        veta = mat(f'{ident} veta', '#7A1A10', rough=0.7)
    else:
        cascara = mat_pvz(f'{ident} cáscara', '#A8682E', arriba='#C58848', abajo='#7A4518', z0=0.05, z1=0.75, ruido=0.16, ruido_escala=7,
                          manchas=dict(color='#8A5222', escala=4.0, cantidad=0.4), bump=0.6, bump_escala=18, rough=0.7, coat=0.1)
        veta = mat(f'{ident} veta', '#7A4A1F', rough=0.7)
    blanco_m = mat('ojo blanco', '#FFFFFF', rough=0.25, coat=0.5)
    negro = mat_brillo('ojo negro', '#0E0E0E')
    brillo = mat('brillo blanco', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=0.8)
    C, R = Vector((0.0, 0.0, 0.35)), Vector((0.34, 0.3, 0.34))
    n, u, v = base_cara((0.3, -1.0, 0.0))
    c = p.pieza('cuerpo', 1, tuple(C))
    clay.blob('cáscara', tuple(C), tuple(R), c, cascara, n=16, subsurf=2,
              shaper=lambda q: q * (1.0 + 0.03 * np.sin(np.arctan2(q[:, 1:2], q[:, 0:1]) * 7.0 + q[:, 2:3] * 10)))
    for k in range(6):
        a = k * math.pi / 6
        pts = []
        for t in range(7):
            el = -1.3 + t * 2.6 / 6
            d = Vector((math.cos(a) * math.cos(el), math.sin(a) * math.cos(el), math.sin(el)))
            q, _ = en_superficie(C, R, d)
            pts.append(tuple(q + (q - C).normalized() * 0.003))
        o = clay.sweep(f'veta {k}', pts, 0.008, (1, 0.5), c, veta, segments=6, samples=3, caps=('point', 'point'))
        sin_contorno(o)
    c = p.pieza('cara', 2, tuple(C), padre='cuerpo')
    for lado_ in (-1, 1):
        q = en_superficie(C, R, (n + u * lado_ * 0.38 + Vector((0, 0, 0.18))).normalized())[0]
        ojo_blanco(f'ojo {lado_}', c, q - n * 0.015, n, 0.085, blanco_m, alto=1.15)
        pupila(f'pupila {lado_}', c, q + n * 0.028 + u * 0.01, n, 0.04, negro, brillo)
        if explosiva:
            ceja(f'ceja {lado_}', c, q + v * 0.13 + u * lado_ * 0.07 + n * 0.03, q + v * 0.09 - u * lado_ * 0.06 + n * 0.03, 0.016, veta, n)
    q = en_superficie(C, R, (n + Vector((0, 0, -0.35))).normalized())[0]
    pts = [tuple(q + u * x + v * (0.02 * (1 - (x / 0.07) ** 2) * (1 if explosiva else -1)) + n * 0.01) for x in (-0.07, -0.035, 0.0, 0.035, 0.07)]
    o = clay.sweep('boca', pts, [0.006, 0.01, 0.011, 0.01, 0.006], (1, 1), c, mat('boca nuez', '#3C2210', rough=0.6), segments=8, samples=5)
    sin_contorno(o)
    if explosiva:
        clay.sweep('mecha', [tuple(C + Vector((0.05, 0.0, 0.32))), tuple(C + Vector((0.1, 0.0, 0.42))), tuple(C + Vector((0.16, 0.0, 0.46)))], 0.012, (1, 1),
                   p.coll('cuerpo'), mat('mecha', '#3A2A1A', rough=0.8), segments=6, samples=4)
        p.conservar = ['chispa']
    p.punto('cabeza', tuple(C + Vector((0, 0, 0.38))))
    p.punto('centro', tuple(C))
    p.terminar()
    return p


# ---------------------------------------------------------------------------------------------------------------

PERSONAJES = {
    'lanzaguisantes': lambda: lanzaguisantes(),
    'zombi': lambda: zombi(),
    'girasol': lambda: girasol(),
    'nuez': lambda: nuez(),
    'petacereza': lambda: petacereza(),
    'patatapum': lambda: patatapum(),
    'desesporada': lambda: desesporada(),
    'carnivora': lambda: carnivora(),
    'hielaguisantes': hielaguisantes,
    'repetidora': repetidora,
    'caracono': lambda: zombi('caracono', extra=con_cono),
    'caracubo': lambda: zombi('caracubo', extra=con_cubo),
    'abanderado': lambda: zombi('abanderado', extra=con_bandera),
    'pertiga': lambda: zombi('pertiga', ropa='atleta', extra=con_pertiga),
    'sol': lambda: sol(),
    'guisante': lambda: guisante(),
    'guisante_hielo': lambda: guisante('guisante_hielo', '#7FD0F5', '#E0F7FF', '#2E7FB3', hielo=True),
    'espora': lambda: espora(),
    'cortacesped': lambda: cortacesped(),
    'moneda_plata': lambda: moneda('moneda_plata', '#C9CED6', '#F2F4F7', '#8A9099'),
    'moneda_oro': lambda: moneda('moneda_oro', '#F5C542', '#FFE68A', '#B8861E'),
    'diamante': lambda: diamante(),
    'bolsa_monedas': lambda: bolsa_monedas(),
    'abono': lambda: abono(),
    'nuez_bolos': lambda: nuez_rodante('nuez_bolos'),
    'nuez_explosiva': lambda: nuez_rodante('nuez_explosiva', explosiva=True),
    'dave': lambda: dave(),
}


def vista(p: Personaje, salida):
    """Prueba rápida: el personaje entero en una sola imagen sobre pasto (VISTA=1), para revisar el modelo."""
    scene = bpy.context.scene
    # Solo las piezas base (sin variantes) y sin las que se pidan ocultar (OCULTAR=parpados,luz); VARIANTES=pieza__var,…
    # muestra esas variantes en lugar de su base.
    ocultar = set(filter(None, os.environ.get('OCULTAR', '').split(',')))
    variantes = set(filter(None, os.environ.get('VARIANTES', '').split(',')))
    con_var = {v.split('__')[0] for v in variantes}
    for clave, c in p.colls.items():
        base = clave.split('__')[0]
        ver = (clave in variantes) if '__' in clave else (base not in con_var and base not in ocultar)
        for o in c.objects:
            o.hide_render = not ver
    objetos = [o for o in todos_los_objetos(p) if not o.hide_render]
    dg = bpy.context.evaluated_depsgraph_get()
    pts = [o.evaluated_get(dg).matrix_world @ Vector(c) for o in objetos for c in o.evaluated_get(dg).bound_box]
    lo = Vector((min(q.x for q in pts), min(q.y for q in pts), min(q.z for q in pts)))
    hi = Vector((max(q.x for q in pts), max(q.y for q in pts), max(q.z for q in pts)))
    centro, radio = (lo + hi) / 2, (hi - lo).length / 2
    luces(centro, radio)
    bpy.ops.mesh.primitive_plane_add(size=radio * 8, location=(centro.x, centro.y, 0.0))
    piso = bpy.context.active_object
    piso.data.materials.append(clay.material('piso vista', '#5DA832', rough=0.9))
    d = dir_camara()
    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', cam_data)
    clay.link(cam, clay.collection('Camara'))
    cam.location = centro + d * (radio * 6 + 2)
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (-d).to_track_quat('-Z', 'Y')
    cam_data.ortho_scale = (hi - lo).z * 1.25 + 0.1
    cam_data.clip_end = radio * 30 + 20
    scene.camera = cam
    scene.render.film_transparent = False
    scene.render.resolution_x = scene.render.resolution_y = int(os.environ.get('TAM', '900'))
    os.makedirs(os.path.join(salida, p.id), exist_ok=True)
    scene.render.filepath = os.path.join(salida, p.id, '_vista.png')
    bpy.ops.render.render(write_still=True)
    print('vista', p.id, flush=True)


def main(salida, claves=None):
    for clave in claves or list(PERSONAJES):
        preparar()
        p = PERSONAJES[clave]()
        if os.environ.get('VISTA'):
            vista(p, salida)
        else:
            renderizar(p, salida)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1:] or None)
