"""Ropa, peinados, accesorios y disfraces de Él y Ella (Nuestro Hogar).

Cada prenda se construye sobre el personaje ya armado (sus medidas D, su cabeza y su cabello) y se
amarra al mismo esqueleto: cada malla lleva el hueso que la mueve (o una mezcla, como el pantalón o el
cabello largo). Se exporta sola con el esqueleto; en el juego se pega a los huesos del personaje por
nombre y oculta la ropa de fábrica de su ranura.

Las prendas están en ropa_arriba.py, ropa_abajo.py, ropa_pies.py, ropa_pelo.py y ropa_accesorios.py.
Cada una declara sus variantes de color: el modelo se exporta una vez (con los colores de la primera) y
el juego pinta las demás cambiando el color de cada material según su papel («principal», «detalle»...).

Uso: python3 ropa.py <carpeta_salida> <el|ella> [claves separadas por coma] [--sin-iconos]
     salida: <carpeta>/ropa/<clave>_<rol>.glb, <carpeta>/iconos/ropa_<variante>_<rol>.png y <carpeta>/ropa_<rol>.json
"""
import copy
import json
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
import cuerpo  # noqa: E402
import escena  # noqa: E402
import rig  # noqa: E402
import sdf  # noqa: E402
from clay import sph  # noqa: E402

M = clay.material
VOX_ROPA = 1.6  # resolución de las mallas SDF de la ropa (más liviana que el cuerpo)
VX = 0.0045 * VOX_ROPA

# ---------------------------------------------------------------------------
# Registro
# ---------------------------------------------------------------------------

PRENDAS = {}
PRECIO = {'pelo': 35, 'cabeza': 30, 'cara': 20, 'arriba': 40, 'abajo': 35, 'pies': 30, 'espalda': 45, 'cola': 25, 'conjunto': 70}


def prenda(clave, ranura, variantes, para=('el', 'ella'), oculta=(), tambien=(), precio=None, nombre_para=None):
    """Registra una prenda.

    ranura: pelo, cabeza, cara, arriba, abajo, pies, espalda, cola o conjunto (conjunto = arriba + abajo).
    variantes: [(id, nombre, {papel: color})...]; la primera da los colores del modelo exportado.
    para: a quién le queda; oculta: otras partes de fábrica que tapa (copete, medias); tambien: otras ranuras.
    nombre_para: {'el': 'nombre', ...} si el nombre de la primera variante cambia según quién lo lleva.
    """
    def deco(fn):
        PRENDAS[clave] = dict(fn=fn, ranura=ranura, variantes=variantes, para=tuple(para), oculta=tuple(oculta),
                              tambien=tuple(tambien), precio=precio or PRECIO[ranura], nombre_para=nombre_para or {})
        return fn
    return deco


# ---------------------------------------------------------------------------
# Materiales con papel (el juego recolorea por papel)
# ---------------------------------------------------------------------------

def _aclarar(hexc, t):
    h = hexc.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    if t >= 0:
        r, g, b = (int(c + (255 - c) * t) for c in (r, g, b))
    else:
        r, g, b = (int(c * (1 + t)) for c in (r, g, b))
    return f'#{r:02X}{g:02X}{b:02X}'


def _hacer_mat(nombre, tipo, color, kw):
    if tipo in ('tela', 'rib'):
        k = dict(rough=0.88, spec=0.3, sheen=0.3, sheen_rough=0.3, sheen_tint=_aclarar(color, 0.5),
                 fuzz=dict(scale=150, color=_aclarar(color, 0.22), amount=0.6, strength=0.4, distance=0.003))
        if tipo == 'rib':
            k['ribs'] = dict(scale=24, strength=0.55, axis='X', distance=0.004)
    elif tipo == 'peluche':
        k = dict(rough=0.95, spec=0.2, sheen=0.6, sheen_rough=0.5, sheen_tint=_aclarar(color, 0.6),
                 fuzz=dict(scale=90, color=_aclarar(color, 0.3), amount=0.9, strength=0.8, distance=0.006))
    elif tipo == 'pelo':
        k = dict(rough=0.75, spec=0.25, sheen=0.25, sheen_rough=0.4, sheen_tint='#6E6966',
                 noise=dict(scale=14, strength=0.12, detail=3, distance=0.012),
                 fuzz=dict(scale=130, color=_aclarar(color, 0.2), amount=0.8, strength=0.5, distance=0.004))
    elif tipo == 'brillo':
        k = dict(rough=0.22, coat=0.6, coat_rough=0.05, spec=0.5)
    elif tipo == 'metal':
        k = dict(rough=0.25, metallic=1.0)
    elif tipo == 'luz':
        k = dict(rough=0.5, emission=color, emission_strength=2.5)
    else:  # lisa: plástico, cuero, goma
        k = dict(rough=0.45, coat=0.15, coat_rough=0.2)
    k.update(kw)
    return M(nombre, color, **k)


class Mats:
    """Materiales de la prenda en construcción: se nombran «Ropa | <clave> <papel>»."""

    def __init__(self, clave, colores):
        self.clave = clave
        self.colores = dict(colores)
        self.hechos = {}

    def __call__(self, papel, color=None, tipo='tela', **kw):
        color = color or self.colores.get(papel) or '#CCCCCC'
        clave_m = (papel, tipo)
        if clave_m not in self.hechos:
            nombre = f'Ropa | {self.clave} {papel}' + (f' {tipo}' if tipo not in ('tela', 'lisa') else '')
            self.hechos[clave_m] = (_hacer_mat(nombre, tipo, color, kw), nombre, kw)
        return self.hechos[clave_m][0]

    def recolorear(self, colores):
        """Vuelve a armar los materiales de cada papel con otro color (íconos de las variantes)."""
        for (papel, tipo), (mat, nombre, kw) in self.hechos.items():
            if papel in colores:
                _hacer_mat(nombre, tipo, colores[papel], kw)

    def papeles_usados(self):
        return {p for p, _ in self.hechos}


# ---------------------------------------------------------------------------
# Contexto del personaje
# ---------------------------------------------------------------------------

# Mechones altos de Él que tapan los gorros (en el juego: parte extra «copete»)
COPETE = {'el': ('mechon copete', 'mechon flequillo'), 'ella': ()}


class Ctx:
    """Personaje base armado (con sus superficies) sobre el que se ajusta cada prenda."""

    def __init__(self, rol):
        import el
        import ella
        self.rol = rol
        self.mod = el if rol == 'el' else ella
        self.N = self.mod.NAME
        self.P, self.B, self.D = self.mod.P, self.mod.B, self.mod.D
        self.hc = np.array(self.P['head_center'])
        self.coll_base = clay.collection(f'{self.N} base')
        cuerpo.VOX = 1.35
        self.mod.build(self.coll_base)
        self.base = {o.name.split('| ', 1)[1]: o for o in self.coll_base.objects if o.type == 'MESH'}
        self.piel_mat = self.base['cabeza'].active_material
        self.coll = None
        self.m = None
        self.clave = None
        cabeza = [self.base['cabeza']]
        pelo = [o for n, o in self.base.items() if n.startswith('cabello') or n.startswith('mechon')]
        self.sup_cabeza = clay.Surface(cabeza)
        self.sup_pelo = clay.Surface(cabeza + pelo)
        bajo = [o for o in pelo if not any(k in o.name for k in COPETE[rol])]
        self.sup_pelo_bajo = clay.Surface(cabeza + bajo)
        cuerpo.VOX = VOX_ROPA

    # --- ayudas --------------------------------------------------------------
    def lado(self, sx):
        return 'izq' if sx < 0 else 'der'

    def hueso_lado(self, base, sx):
        return base + ('.L' if sx < 0 else '.R')

    def nombre(self, parte):
        return f'{self.N} | {parte}'

    def pieza(self, obj, hueso=None, modo=None):
        if hueso:
            obj['hueso'] = hueso
        if modo:
            obj['modo'] = modo
        return obj

    @property
    def el(self):
        return self.rol == 'el'


# ---------------------------------------------------------------------------
# Piel: pesos por pieza (como rig.skin) con hueso explícito
# ---------------------------------------------------------------------------

def piel(arm, objs, rol):
    split = 0.52 if rol == 'ella' else 0.44
    for obj in objs:
        if obj.type != 'MESH':
            continue
        clay.apply_modifiers(obj)
        mw = obj.matrix_world.copy()
        obj.parent = arm
        obj.matrix_parent_inverse = arm.matrix_world.inverted()
        obj.matrix_world = mw
        for g in list(obj.vertex_groups):
            obj.vertex_groups.remove(g)
        modo = obj.get('modo')
        if modo == 'pantalon':
            gp, gl, gr = (obj.vertex_groups.new(name=n) for n in ('pelvis', 'pierna.L', 'pierna.R'))
            for v in obj.data.vertices:
                w = obj.matrix_world @ v.co
                t = float(np.clip((split - w.z) / 0.14, 0.0, 1.0))
                t = t * t * (3 - 2 * t)
                side = float(np.clip(0.5 + w.x / 0.08, 0.0, 1.0))
                gp.add([v.index], 1.0 - t, 'REPLACE')
                gl.add([v.index], t * (1 - side), 'REPLACE')
                gr.add([v.index], t * side, 'REPLACE')
        elif modo == 'pelo_largo' and rol == 'ella':
            gh = obj.vertex_groups.new(name='cabeza')
            gls = {s: obj.vertex_groups.new(name='cabello_largo' + s) for s in ('.L', '.R')}
            corte = obj.get('corte', 1.25)
            for v in obj.data.vertices:
                w = obj.matrix_world @ v.co
                t = float(np.clip((corte - w.z) / 0.35, 0.0, 1.0))
                t = t * t * (3 - 2 * t)
                gh.add([v.index], 1.0 - t, 'REPLACE')
                gls['.L' if w.x < 0 else '.R'].add([v.index], t, 'REPLACE')
        else:
            bone = obj.get('hueso') or rig.bone_for(obj.name)
            if bone.startswith('cabello_largo') and rol != 'ella':
                bone = 'cabeza'
            g = obj.vertex_groups.new(name=bone)
            g.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
        mod = obj.modifiers.new('Esqueleto', 'ARMATURE')
        mod.object = arm


def armadura(ctx):
    extra = {'cabello_largo.L': (-0.7, 0.2, 1.35), 'cabello_largo.R': (0.7, 0.2, 1.35)} if ctx.rol == 'ella' else None
    return rig.build_armature(f'rig {ctx.rol}', rig.bone_layout(ctx.P, ctx.B, extra), ctx.coll)


# ---------------------------------------------------------------------------
# Exportación (materiales simplificados solo en una copia)
# ---------------------------------------------------------------------------

def _simplificar(mat):
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        return
    base = bsdf.inputs['Base Color']
    if base.is_linked:
        src = base.links[0].from_node
        if src.type == 'VALTORGB':
            els = src.color_ramp.elements
            col = els[len(els) // 2].color if len(els) > 2 else els[-1].color
            base.default_value = tuple(col)
            mat['fieltro'] = 1
        nt.links.remove(base.links[0])
    nrm = bsdf.inputs['Normal']
    if nrm.is_linked:
        mat['relieve'] = 1
        nt.links.remove(nrm.links[0])
    for name in ('Roughness', 'Metallic', 'Alpha', 'Emission Color'):
        s = bsdf.inputs.get(name)
        if s is not None and s.is_linked:
            nt.links.remove(s.links[0])


def exportar(arm, objs, path):
    copias = {}
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if m is None:
                continue
            if m.name not in copias:
                c = m.copy()
                c.name = m.name.replace('Ropa | ', '')
                _simplificar(c)
                copias[m.name] = (m, c)
            slot.material = copias[m.name][1]
    bpy.ops.object.select_all(action='DESELECT')
    for o in [arm] + objs:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_extras=True, export_animations=False, export_skins=True, export_def_bones=False,
                              export_morph=False, export_cameras=False, export_lights=False)
    for o in objs:
        for slot in o.material_slots:
            for orig, c in copias.values():
                if slot.material is c:
                    slot.material = orig
    for orig, c in copias.values():
        bpy.data.materials.remove(c)
    print('GLB', os.path.basename(path), round(os.path.getsize(path) / 1e3), 'KB', flush=True)


# ---------------------------------------------------------------------------
# Íconos: el personaje con la prenda puesta, encuadrado en su ranura
# ---------------------------------------------------------------------------

OCULTA = {
    'el': {
        'arriba': ('torso camiseta', 'cuello camiseta', 'ribete', 'pespunte camiseta', 'suciedad ropa'),
        'abajo': ('pantalon', 'pespunte pantalon'),
        'pies': ('tenis', 'suela'),
        'pelo': ('cabello base', 'mechon'),
        'copete': COPETE['el'],
    },
    'ella': {
        'arriba': ('torso camiseta', 'cuello camiseta', 'ribete manga', 'pespunte camiseta', 'chaleco', 'solapa', 'tapa bolsillo',
                   'pespunte chaleco', 'suciedad ropa'),
        'abajo': ('pantalon', 'dobladillo short', 'pespunte shorts'),
        'pies': ('tenis', 'suela', 'cordon'),
        'pelo': ('cabello base', 'mechon'),
        'medias': ('media', 'puño media'),
        'copete': (),
    },
}
RANURAS_CONJUNTO = {'conjunto': ('arriba', 'abajo')}


def partes_ocultas(ctx, ranura, extra=()):
    ran = list(RANURAS_CONJUNTO.get(ranura, (ranura,))) + list(extra)
    frags = [f for r in ran for f in OCULTA[ctx.rol].get(r, ())]
    return [o for n, o in ctx.base.items() if any(n.startswith(f) for f in frags)]


ENCUADRE = {
    # (zona, alto visible, cámara desde atrás)
    'pelo': ('cabeza', 1.95, False), 'cabeza': ('sombrero', 2.1, False), 'cara': ('cara', 1.4, False),
    'arriba': ('torso', 1.45, False), 'abajo': ('piernas', 1.05, False), 'pies': ('pies', 0.7, False),
    'espalda': ('espalda', 2.0, True), 'cola': ('cola', 1.4, True), 'conjunto': ('todo', 2.9, False),
}


def preparar_iconos(scene):
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = 192
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 20
    luces = clay.collection('Luces íconos ropa')
    escena.area_light('Luz ropa', (-3, -4, 5), (0, 0, 1.0), 900, 3.0, '#FFF3E6', luces)
    escena.area_light('Relleno ropa', (4, -3, 2.5), (0, 0, 1.0), 350, 3.0, '#EAF2FF', luces)
    escena.area_light('Contra ropa', (0, 4, 3), (0, 0, 1.0), 300, 3.0, '#FFFFFF', luces)
    escena.world_color(scene, '#FFFFFF', 0.8)
    scene.view_settings.look = 'AgX - Medium High Contrast'


def icono(ctx, ranura, path, ocultas):
    scene = bpy.context.scene
    for o in ocultas:
        o.hide_render = True
    zona, alto, atras = ENCUADRE.get(ranura, ('todo', 2.9, False))
    hc = ctx.hc
    cz = {'cabeza': hc[2] + 0.1, 'sombrero': hc[2] + 0.28, 'cara': hc[2] - 0.05, 'torso': ctx.D['torso']['c'][2] + 0.02,
          'espalda': ctx.D['torso']['c'][2] + 0.25, 'piernas': ctx.B['pelvis_z'] - 0.14, 'cola': ctx.B['pelvis_z'] + 0.05,
          'pies': 0.14, 'todo': 1.12}[zona]
    y = 3.4 if atras else -3.4
    sube = 1.3 if zona in ('cabeza', 'sombrero') else 0.5
    cam = escena.camera(f'Cam ropa {os.path.basename(path)}', (-0.9 if atras else 0.9, y, cz + sube), (0, 0, cz), 50)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = alto
    scene.camera = cam
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    for o in ocultas:
        o.hide_render = False


# ---------------------------------------------------------------------------
# Ayudas de forma (compartidas por las prendas)
# ---------------------------------------------------------------------------

def D2(ctx, **cambios):
    """Copia profunda de las medidas del personaje con cambios (torso, manga, ...)."""
    d = copy.deepcopy(ctx.D)
    for k, v in cambios.items():
        if isinstance(v, dict) and isinstance(d.get(k), dict):
            d[k].update(v)
        else:
            d[k] = v
    return d


def torso_sdf(D, crecer=0.0, largo=0.0, cuello=1.0):
    """SDF del torso de camiseta sin mangas; `crecer` lo engorda, `largo` baja el ruedo y `cuello` agranda el escote."""
    d = copy.deepcopy(D)
    T = d['torso']
    T['half'] = tuple(h + crecer for h in T['half'])
    T['r'] = T['r'] + crecer * 0.5
    T['bottom'] = T['bottom'] - largo
    if T.get('belly'):
        c, r = T['belly']
        T['belly'] = (c, tuple(x + crecer for x in r))
    nc, nr = d['neck_hole']
    d['neck_hole'] = (nc, tuple(x * cuello for x in nr))
    d['sleeve'] = None
    base, _ = cuerpo.shirt_sdf(d)
    return base


def malla(ctx, parte, f, lo, hi, mat, hueso, voxel=VX, smooth=2, modo=None):
    return ctx.pieza(sdf.to_mesh(ctx.nombre(parte), f, lo, hi, voxel, ctx.coll, mat, smooth=smooth), hueso, modo)


def torso(ctx, parte, mat, crecer=0.018, largo=0.0, cuello=1.0, extra=None):
    """Torso de la prenda (amarrado al hueso torso); `extra(P, d)` puede tallar o sumar formas."""
    D = ctx.D
    base = torso_sdf(D, crecer, largo, cuello)
    f = base if extra is None else (lambda P: extra(P, base(P)))
    lo, hi = D['shirt_bounds']
    lo = np.array(lo) - np.array([0.1, 0.1, 0.1 + largo])
    hi = np.array(hi) + 0.1
    return malla(ctx, parte, f, lo, hi, mat, 'torso'), f


def ruedo(ctx, f, z, mat, parte='ribete', grosor=0.028, prof=(1, 1.1), n=40, hueso='torso'):
    """Anillo alrededor del cuerpo a la altura z (dobladillo, pretina, franja)."""
    ring = sdf.ring_points(f, (0, ctx.D['torso']['c'][1], z), (0, 0, 1), 1.2, n)
    if len(ring) < 12:
        return None
    return ctx.pieza(clay.sweep(ctx.nombre(parte), ring, grosor, prof, ctx.coll, mat, segments=8, samples=3, closed=True), hueso)


def cuello_redondo(ctx, f, mat, grosor=0.026, parte='cuello prenda', escala=1.0):
    D = ctx.D
    nc = np.array(D['neck_hole'][0])
    cr = np.array(D.get('collar_r', (0.175, 0.145))) * escala
    ring = []
    for k in range(28):
        a = 2 * math.pi * k / 28
        o = np.array([[nc[0] + math.cos(a) * cr[0], nc[1] + math.sin(a) * cr[1], 1.7]])
        q, hit = sdf.trace(f, o, (0, 0, -1), max_dist=1.2)
        if hit[0]:
            ring.append(q[0] + np.array([0, 0, 0.004]))
    if len(ring) < 10:
        return None, ring
    return ctx.pieza(clay.sweep(ctx.nombre(parte), ring, grosor, (1, 1), ctx.coll, mat, segments=10, samples=3, closed=True), 'torso'), ring


def manga(ctx, sx, largo, radios, mat, puno=None, nombre='manga', ancho_puno=0.022, inicio=0.07, D=None):
    """Manga como pieza aparte amarrada al brazo (sigue al brazo en todas las poses)."""
    D = D or ctx.D
    A = D['arm']
    s = np.array([sx, 1, 1])
    d = cuerpo._dir(D['arm_deg'], A.get('dy', 0.08)) * s
    j = np.array(D['joint']) * s
    a = j - d * inicio
    b = j + d * largo
    cono = sdf.round_cone(a, b, radios[0], radios[1])
    corte = sdf.plane(b, d)

    def f(P):
        return sdf.smax(cono(P), corte(P), 0.012)
    lo = np.minimum(a, b) - max(radios) - 0.05
    hi = np.maximum(a, b) + max(radios) + 0.05
    objs = [malla(ctx, f'{nombre} {ctx.lado(sx)}', f, lo, hi, mat, ctx.hueso_lado('brazo', sx))]
    if puno is not None:
        ring = sdf.ring_points(f, b - d * 0.02, d, 0.4, 28)
        if len(ring) > 10:
            objs.append(ctx.pieza(clay.sweep(ctx.nombre(f'puño {nombre} {ctx.lado(sx)}'), ring, ancho_puno, (1, 1), ctx.coll, puno,
                                             segments=8, samples=3, closed=True), ctx.hueso_lado('brazo', sx)))
    return objs, f, (b, d)


def mangas(ctx, largo, mat, puno=None, holgura=(0.035, 0.025), **kw):
    A = ctx.D['arm']
    objs = []
    for sx in (-1, 1):
        o, _, _ = manga(ctx, sx, largo, (A['r'][0] + holgura[0], A['r'][1] + holgura[1]), mat, puno=puno, **kw)
        objs += o
    return objs


def en_superficie(ctx, f, x, z, obj, hueso='torso', lift=0.01, atras=False):
    """Pega un objeto hecho en el origen (mirando a -Y) sobre la superficie del frente (o de la espalda)."""
    if atras:
        O = np.array([[x, 3.0, z]])
        P, hit = sdf.trace(f, O, (0, -1, 0), max_dist=6.0)
        if not hit[0]:
            return None
        p = P[0]
    else:
        pts = sdf.front_points(f, [(x, z)])
        if not pts:
            return None
        p = pts[0]
    n = sdf.normal(f, np.array([p]))[0]
    obj.location = p + n * lift
    clay.orient_to(obj, n)
    return ctx.pieza(obj, hueso)


def corazon(ctx, parte, s, mat, grosor=0.3):
    """Corazón inflado en el origen, mirando a -Y (para estampados y adornos)."""
    import regalos
    return regalos.corazon_plano(ctx.nombre(parte), (0, 0, 0), s, ctx.coll, mat, grosor=grosor)


def estrella(ctx, parte, r, mat, grosor=0.012, puntas=5):
    """Estrella plana redondeada en el origen, mirando a -Y."""
    verts = [(0, -grosor, 0)]
    for k in range(puntas * 2):
        a = math.pi / 2 + k * math.pi / puntas
        rr = r if k % 2 == 0 else r * 0.45
        verts.append((math.cos(a) * rr, -grosor, math.sin(a) * rr))
    faces = [(0, 1 + k, 1 + (k + 1) % (puntas * 2)) for k in range(puntas * 2)]
    o = clay.make_mesh_object(ctx.nombre(parte), verts, faces, ctx.coll, material=mat)
    clay.add_solidify(o, grosor, offset=0.0)
    clay.add_subsurf(o, 1, 1)
    return o


def botones(ctx, f, xs_zs, mat, r=0.022, hueso='torso'):
    out = []
    for k, (x, z) in enumerate(xs_zs):
        b = clay.blob(ctx.nombre(f'boton {k}'), (0, 0, 0), (r, r * 0.45, r), ctx.coll, mat, n=5)
        o = en_superficie(ctx, f, x, z, b, hueso, lift=0.006)
        if o is not None:
            out.append(o)
        else:
            bpy.data.objects.remove(b, do_unlink=True)
    return out


def flor(ctx, parte, r, mat_petalo, mat_centro, petalos=5):
    """Florcita plana en el origen mirando a -Y (estampados, adornos)."""
    objs = []
    for j in range(petalos):
        a = 2 * math.pi * j / petalos
        objs.append(clay.blob(ctx.nombre(f'{parte} pétalo {j}'), (math.cos(a) * r * 0.62, 0, math.sin(a) * r * 0.62),
                              (r * 0.48, r * 0.15, r * 0.48), ctx.coll, mat_petalo, n=4))
    objs.append(clay.blob(ctx.nombre(f'{parte} centro'), (0, -r * 0.08, 0), (r * 0.32, r * 0.18, r * 0.32), ctx.coll, mat_centro, n=4))
    return clay.join(objs, ctx.nombre(parte))


def puntos_superficie(n, zmin, zmax, xmax, semilla=3, atras=True, sep=0.09):
    """Puntos al azar (x, z, atrás?) sobre el frente y la espalda, separados entre sí."""
    rng = np.random.default_rng(semilla)
    out = []
    intentos = 0
    while len(out) < n and intentos < n * 40:
        intentos += 1
        x, z = rng.uniform(-xmax, xmax), rng.uniform(zmin, zmax)
        a = bool(atras and rng.random() < 0.45)
        if all(math.hypot(x - q[0], z - q[1]) > sep or a != q[2] for q in out):
            out.append((x, z, a))
    return out


def domo(ctx, nombre, mat, el_min=12.0, margen=0.03, alto_extra=0.0, suavizar=6, n_az=48, n_el=12, hueso='cabeza', sup=None,
         ancho=1.0, frente=0.0, inflar=2, aplastar=1.0, grosor=0.03):
    """Casquete que envuelve la cabeza y el cabello (gorros, cascos): se miden los rayos desde el centro
    de la cabeza hasta la superficie del pelo, se inflan (tapan los mechones), se suavizan y se agranda un margen."""
    sup = sup or ctx.sup_pelo_bajo
    hc = ctx.hc
    els = np.linspace(el_min, 88, n_el)
    azs = np.linspace(-180, 180, n_az, endpoint=False)
    R = np.zeros((n_el, n_az))
    for i, e in enumerate(els):
        for j, a in enumerate(azs):
            loc, _ = sup.radial(hc, sph(a, e))
            R[i, j] = np.linalg.norm(loc - hc) if loc is not None else 0.6
    for _ in range(inflar):
        R = np.maximum(R, np.maximum(np.roll(R, 1, 1), np.roll(R, -1, 1)))
        R[1:] = np.maximum(R[1:], R[:-1])
    for _ in range(suavizar):
        R = 0.5 * R + 0.25 * (np.roll(R, 1, 1) + np.roll(R, -1, 1))
        R[1:-1] = 0.5 * R[1:-1] + 0.25 * (R[:-2] + R[2:])
    verts, faces = [], []
    for i, e in enumerate(els):
        for j, a in enumerate(azs):
            u = np.array(sph(a, e))
            r = R[i, j] + margen + alto_extra * (e / 90) ** 2
            p = hc + u * r
            p[0] = hc[0] + (p[0] - hc[0]) * ancho
            p[2] = hc[2] + (p[2] - hc[2]) * aplastar
            p[1] += frente
            verts.append(p)
    top = len(verts)
    verts.append(hc + np.array([0, frente, (R[-1].mean() + margen + alto_extra) * aplastar]))
    for i in range(n_el - 1):
        for j in range(n_az):
            a0, a1 = i * n_az + j, i * n_az + (j + 1) % n_az
            b0, b1 = a0 + n_az, a1 + n_az
            faces.append((a0, a1, b1, b0))
    for j in range(n_az):
        faces.append(((n_el - 1) * n_az + j, (n_el - 1) * n_az + (j + 1) % n_az, top))
    o = clay.make_mesh_object(ctx.nombre(nombre), verts, faces, ctx.coll, material=mat)
    if grosor:
        clay.add_solidify(o, grosor, offset=-1.0)
    clay.add_subsurf(o, 1, 2)
    return ctx.pieza(o, hueso), R, els, azs


def radio_cabeza(ctx, az, el, sup=None):
    loc, _ = (sup or ctx.sup_pelo_bajo).radial(ctx.hc, sph(az, el))
    return np.linalg.norm(loc - ctx.hc) if loc is not None else 0.6


def punto_cabeza(ctx, az, el, lift=0.0, sup=None):
    """Punto sobre la cabeza/pelo en la dirección (az, el) y su normal."""
    return (sup or ctx.sup_pelo_bajo).radial(ctx.hc, sph(az, el), lift)


# ---------------------------------------------------------------------------
# Principal
# ---------------------------------------------------------------------------

def cargar_modulos():
    import importlib
    for nombre in ('ropa_arriba', 'ropa_abajo', 'ropa_pies', 'ropa_pelo', 'ropa_accesorios'):
        if os.path.exists(os.path.join(HERE, f'{nombre}.py')):
            importlib.import_module(nombre)


HUESO_RANURA = {'pelo': 'cabeza', 'cabeza': 'cabeza', 'cara': 'cabeza', 'arriba': 'torso', 'conjunto': 'torso', 'abajo': 'pelvis',
                'pies': 'pelvis', 'espalda': 'torso', 'cola': 'pelvis'}


def regla(nombre):
    """Hueso según el nombre de la pieza (reglas de rig.py), o None si ninguna aplica."""
    low = nombre.lower()
    for frag, bone, by_side in rig.RULES:
        if frag in low:
            return bone + ((rig.side_of(low) or '.L') if by_side else '')
    return None


def construir(ctx, clave):
    """Arma la prenda: todo lo que se crea en su colección se exporta (también costuras de las funciones del cuerpo)."""
    info = PRENDAS[clave]
    ctx.clave = clave
    ctx.coll = clay.collection(f'{ctx.N} ropa {clave}')
    ctx.m = Mats(clave, info['variantes'][0][2])
    info['fn'](ctx)
    objs = [o for o in ctx.coll.objects if o.type == 'MESH']
    for o in objs:
        if o.name.lower().endswith('| pantalon') and not o.get('modo'):
            o['modo'] = 'pantalon'
        if not o.get('hueso') and not o.get('modo'):
            o['hueso'] = regla(o.name) or HUESO_RANURA[info['ranura']]
    return objs


def main(out, rol, claves=None, iconos=True):
    cargar_modulos()
    t0 = time.time()
    scene = clay.reset_scene()
    escena.setup_render(scene, 192, 192, 20)
    ctx = Ctx(rol)
    print('base lista', round(time.time() - t0, 1), 's', flush=True)
    os.makedirs(os.path.join(out, 'ropa'), exist_ok=True)
    os.makedirs(os.path.join(out, 'iconos'), exist_ok=True)
    if iconos:
        preparar_iconos(scene)
    path_json = os.path.join(out, f'ropa_{rol}.json')
    catalogo = json.load(open(path_json)) if os.path.exists(path_json) else {}
    claves = claves or [k for k, v in PRENDAS.items() if rol in v['para']]
    fallas = []
    for clave in claves:
        info = PRENDAS[clave]
        if rol not in info['para']:
            continue
        try:
            objs = construir(ctx, clave)
            arm = armadura(ctx)
            piel(arm, objs, rol)
            ocultas = partes_ocultas(ctx, info['ranura'], info['oculta'])
            papeles = ctx.m.papeles_usados()
            for k, (vid, nombre, colores) in enumerate(info['variantes']):
                if iconos:
                    if k:
                        ctx.m.recolorear(colores)
                    icono(ctx, info['ranura'], os.path.join(out, 'iconos', f'ropa_{vid}_{rol}.png'), ocultas)
                ranura = info['ranura']
                catalogo[vid] = dict(
                    id=vid, nombre=info['nombre_para'].get(rol, nombre) if not k else nombre, precio=info['precio'], modelo=clave,
                    ranura='arriba' if ranura == 'conjunto' else ranura,
                    tambien=(['abajo'] if ranura == 'conjunto' else []) + list(info['tambien']),
                    oculta=list(info['oculta']), colores={p: c for p, c in colores.items() if p in papeles},
                    orden=list(PRENDAS).index(clave) * 100 + k)
            if iconos and len(info['variantes']) > 1:
                ctx.m.recolorear(info['variantes'][0][2])
            exportar(arm, objs, os.path.join(out, 'ropa', f'{clave}_{rol}.glb'))
        except Exception as e:  # una prenda que falla no detiene las demás
            import traceback
            traceback.print_exc()
            fallas.append(clave)
            print('FALLA', clave, e, flush=True)
        if ctx.coll is not None:
            ctx.coll.hide_render = ctx.coll.hide_viewport = True
            for o in list(ctx.coll.objects):
                bpy.data.objects.remove(o, do_unlink=True)
        print('prenda', clave, rol, round(time.time() - t0, 1), 's', flush=True)
        with open(path_json, 'w', encoding='utf-8') as f:
            json.dump(catalogo, f, ensure_ascii=False, indent=1)
    print('LISTO', round(time.time() - t0, 1), 's', 'fallas:', fallas, flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    sin_iconos = '--sin-iconos' in args
    args = [a for a in args if not a.startswith('--')]
    # Las prendas se registran en el módulo «ropa» (no en __main__): se corre desde ahí
    import ropa as _ropa
    _ropa.main(args[0], args[1], args[2].split(',') if len(args) > 2 else None, not sin_iconos)
