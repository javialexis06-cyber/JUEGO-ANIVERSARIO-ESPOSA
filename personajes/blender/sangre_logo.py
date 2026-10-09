"""El logo de Sangre y Ceniza para la pantalla de inicio (public/sangre/logo.webp, fondo transparente): «Sangre y
Ceniza» en Cinzel Decorative (fuentes/, licencia OFL) con la cara de hueso viejo y el filo dorado, la «y» de sangre
brillante, goterones de sangre que se escurren de las letras y una barra con un rombo debajo.

Uso: blender -b -P sangre_logo.py -- <salida.webp> [--muestras N]
"""
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Vector  # noqa: E402

import clay  # noqa: E402
import sangre_comun as sc  # noqa: E402

FUENTE = os.path.join(HERE, 'fuentes', 'CinzelDecorative-Black.ttf')


def lin(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


def material(nombre, color, metal, rugoso, relieve=0.0, brillo=0.0, capa=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*lin(color), 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rugoso
    if capa:
        b.inputs['Coat Weight'].default_value = capa
        b.inputs['Coat Roughness'].default_value = 0.08
    if brillo:
        b.inputs['Emission Color'].default_value = (*lin(color), 1)
        b.inputs['Emission Strength'].default_value = brillo
    if relieve:
        # Hueso gastado: ruido fino en el relieve y en el color (manchitas de ceniza)
        tc = nt.nodes.new('ShaderNodeTexCoord')
        ru = nt.nodes.new('ShaderNodeTexNoise')
        ru.inputs['Scale'].default_value = 60.0
        ru.inputs['Detail'].default_value = 6.0
        nt.links.new(tc.outputs['Object'], ru.inputs['Vector'])
        bu = nt.nodes.new('ShaderNodeBump')
        bu.inputs['Strength'].default_value = relieve
        nt.links.new(ru.outputs['Fac'], bu.inputs['Height'])
        nt.links.new(bu.outputs['Normal'], b.inputs['Normal'])
        mz = nt.nodes.new('ShaderNodeMix')
        mz.data_type = 'RGBA'
        mz.inputs['A'].default_value = (*lin(color), 1)
        mz.inputs['B'].default_value = (*lin('#6a5a48'), 1)
        rampa = nt.nodes.new('ShaderNodeValToRGB')
        rampa.color_ramp.elements[0].position = 0.55
        rampa.color_ramp.elements[1].position = 0.78
        nt.links.new(ru.outputs['Fac'], rampa.inputs['Fac'])
        nt.links.new(rampa.outputs['Color'], mz.inputs['Factor'])
        nt.links.new(mz.outputs['Result'], b.inputs['Base Color'])
    return m


def texto(cuerpo, x, tam, extrude, bisel, mats, coll):
    """Un texto en el plano XZ mirando a −Y (hacia la cámara), con la cara de un material y el canto de otro."""
    cu = bpy.data.curves.new(f'logo {cuerpo}', 'FONT')
    cu.body = cuerpo
    cu.font = bpy.data.fonts.load(FUENTE, check_existing=True)
    cu.size = tam
    cu.align_x = 'LEFT'
    cu.extrude = extrude
    cu.bevel_depth = bisel
    cu.bevel_resolution = 4
    cu.resolution_u = 8
    ob = bpy.data.objects.new(f'logo {cuerpo}', cu)
    coll.objects.link(ob)
    ob.location = (x, 0, 0)
    ob.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    for m in mats:
        ob.data.materials.append(m)
    # La cara (lo que mira de frente a la cámara) con el primer material; el canto y el bisel con el segundo
    mw = ob.matrix_world.to_3x3()
    for p in ob.data.polygons:
        n = mw @ p.normal
        p.material_index = 0 if n.y < -0.92 else 1
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def ancho(ob):
    bpy.context.view_layer.update()
    xs = [(ob.matrix_world @ Vector(c)).x for c in ob.bound_box]
    return min(xs), max(xs)


def gota(x, z, largo, radio, mat, coll):
    """Un chorrito de sangre: baja pegado a la cara de la letra (aplanado) desde un poco más arriba de la base, se
    descuelga por debajo y termina en una gota redonda."""
    me = bpy.data.meshes.new('gota')
    bm = bmesh.new()
    total = largo + 0.16
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=radio * 0.7, radius2=radio * 1.05, depth=total)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, 0.16 - total / 2))
    esf = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=radio * 1.45)
    bmesh.ops.translate(bm, verts=esf['verts'], vec=(0, 0, -largo - radio * 0.5))
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('gota', me)
    coll.objects.link(ob)
    # (delante de la cara de la letra: el texto llega hasta y = −(extrusión + bisel))
    ob.location = (x, -0.118, z)
    ob.scale = (1, 0.55, 1)
    ob.data.materials.append(mat)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def main(salida, muestras=96):
    clay.reset_scene()
    scene = bpy.context.scene
    sc.preparar_render(scene, 512, muestras, transparente=True)
    scene.view_settings.look = 'AgX - Punchy'
    coll = clay.collection('SG logo')
    hueso = material('Logo hueso', '#EFE3C8', 0.1, 0.45, relieve=0.06)
    oro = material('Logo oro', '#C9963E', 1.0, 0.24)
    # (rojo oscuro: con mucha luz, AgX lo lava hacia rosado)
    # (con un poquito de luz propia: si no, AgX la deja color vino apagado)
    sangre = material('Logo sangre', '#8A0010', 0.0, 0.32, brillo=0.55)
    sangre_oscura = material('Logo sangre oscura', '#4A0208', 0.3, 0.3, brillo=0.2)
    # «Sangre» · «y» · «Ceniza» (en la Decorativa, las mayúsculas llevan el adorno y las minúsculas son versalitas)
    tam = 1.0
    a = texto('Sangre', 0, tam, 0.09, 0.034, [hueso, oro], coll)
    x0, x1 = ancho(a)
    y = texto('y', x1 + 0.2, tam * 0.92, 0.09, 0.03, [sangre, sangre_oscura], coll)
    y0, y1 = ancho(y)
    c = texto('Ceniza', y1 + 0.2, tam, 0.09, 0.034, [hueso, oro], coll)
    c0, c1 = ancho(c)
    objs = [a, y, c]
    # Goterones de sangre: salen de la base de algunas letras (sobre todo de «Sangre» y de la «y»)
    rnd = random.Random(7)
    bpy.context.view_layer.update()
    base = []
    for ob in (a, y):
        mw = ob.matrix_world
        for v in ob.data.vertices:
            w = mw @ v.co
            if w.y < -0.03 and -0.02 < w.z < 0.03:
                base.append(w.x)
    base.sort()
    puestos = []
    for _ in range(40):
        if len(puestos) >= 7 or not base:
            break
        bx = rnd.choice(base)
        if all(abs(bx - p) > 0.28 for p in puestos):
            puestos.append(bx)
            largo = rnd.uniform(0.1, 0.36)
            objs.append(gota(bx, 0.0, largo, rnd.uniform(0.022, 0.034), sangre, coll))
    # La barra de abajo: dos filos dorados que se afinan hacia un rombo de sangre en el centro
    cx = (x0 + c1) / 2
    zb = -0.42
    for lado in (-1, 1):
        me = bpy.data.meshes.new('barra')
        bm = bmesh.new()
        largo = (c1 - x0) * 0.36
        bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.028, radius2=0.004, depth=largo)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new('barra', me)
        coll.objects.link(ob)
        ob.location = (cx + lado * (largo / 2 + 0.16), 0, zb)
        ob.rotation_euler = (0, math.radians(90 * lado), 0)
        ob.data.materials.append(oro)
        for p in ob.data.polygons:
            p.use_smooth = True
        objs.append(ob)
    bpy.ops.mesh.primitive_cube_add(size=0.17, location=(cx, -0.02, zb), rotation=(0, math.radians(45), 0))
    rombo = bpy.context.active_object
    for col in rombo.users_collection:
        col.objects.unlink(rombo)
    coll.objects.link(rombo)
    rombo.scale = (1, 0.5, 1)
    bev = rombo.modifiers.new('bisel', 'BEVEL')
    bev.width = 0.02
    bev.segments = 3
    rombo.data.materials.append(sangre)
    objs.append(rombo)
    # Cámara de frente (desde −Y), un poquito desde arriba para que se vea el canto dorado
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(cc) for o in objs for cc in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    luces = clay.collection('SG luces logo')
    centro = (lo + hi) / 2
    import escena
    c = tuple(centro)
    an = hi.x - lo.x
    # Clave cálida de frente y arriba a la izquierda, relleno frío suave y un contraluz rojo detrás (filo de brasa)
    escena.area_light('SG logo clave', (c[0] - an * 0.3, c[1] - 6, c[2] + 4), c, 2600, 6, '#FFF0DC', luces)
    escena.area_light('SG logo relleno', (c[0] + an * 0.35, c[1] - 6, c[2] - 1), c, 700, 8, '#DCE6FF', luces)
    escena.area_light('SG logo contra', (c[0], c[1] + 4, c[2] + 3), c, 1100, 6, '#FF8A4A', luces)
    cam = sc.camara_figura('cam logo', lo, hi, 180, 10, margen=1.04)
    ancho_px = 1800
    scene.render.resolution_x = ancho_px
    scene.render.resolution_y = int(ancho_px * (hi.z - lo.z) / (hi.x - lo.x) * 1.12 + 40)
    tmp = salida + '.png'
    sc.render(scene, cam, tmp)
    from PIL import Image
    im = Image.open(tmp).convert('RGBA')
    caja = im.getbbox()
    if caja:
        im = im.crop((max(0, caja[0] - 8), max(0, caja[1] - 8), min(im.width, caja[2] + 8), min(im.height, caja[3] + 8)))
    im.save(salida, 'WEBP', quality=92, method=6)
    os.remove(tmp)
    print('LOGO', salida, im.size, flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    m = int(args[args.index('--muestras') + 1]) if '--muestras' in args else 96
    main(args[0], m)
