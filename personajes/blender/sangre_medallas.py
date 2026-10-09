"""Medallas de Sangre y Ceniza (public/sangre/iconos/med_<tema>_<glifo>.webp, 128 px, fondo transparente): los íconos de
las mejoras, los objetos, las reliquias y el equipo, más elaborados que el glifo plano. Cada uno es una medalla de
esmalte con su marco de metal y tachuelas, y el glifo del juego en relieve dorado (sale del mismo trazo SVG).

Temas: mejora (bronce y esmalte rojo sangre), objeto (plata y verde petróleo), reliquia (oro, esmalte morado y
piedritas) y equipo (hierro y azul acero).

Uso: blender -b -P sangre_medallas.py -- <glifos.json> <carpeta_salida> [tema:glifo,…] [--hoja <png>]
  glifos.json: {"usos": {tema: [glifo…]}, "glifos": {glifo: "d del path"}} (lo saca el juego de ui/iconos.ts)
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import clay  # noqa: E402
import sangre_comun as sc  # noqa: E402
from sangre_iconos import halo  # noqa: E402

TEMAS = {
    # esmalte, marco, relieve, halo
    'mejora': ('#9A1C24', '#C08A44', '#FFD870', '#ff6a4a'),
    'objeto': ('#1E6A66', '#C8CED8', '#F4E2B0', '#6ad8c8'),
    'reliquia': ('#5A2A96', '#E0B04A', '#FFE08A', '#c46bff'),
    'equipo': ('#34506C', '#9A9EA6', '#ECE2CC', '#a8b8c8'),
}


def lin(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


def material(nombre, color, metal, rugoso, brillo=0.0):
    m = bpy.data.materials.get(nombre)
    if m:
        return m
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*lin(color), 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rugoso
    if brillo:
        b.inputs['Emission Color'].default_value = (*lin(color), 1)
        b.inputs['Emission Strength'].default_value = brillo
    return m


def medalla_base(coll, tema):
    """La medalla de pie (mira hacia +Y, donde está la cámara): disco de esmalte, marco con tachuelas y, en las reliquias, cuatro piedras."""
    esmalte, marco, _, _ = TEMAS[tema]
    m_esm = material(f'esmalte {tema}', esmalte, 0.0, 0.28)
    m_mar = material(f'marco {tema}', marco, 0.85, 0.32)
    objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.0, depth=0.14, location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
    d = bpy.context.object
    d.data.materials.append(m_esm)
    bev = d.modifiers.new('bisel', 'BEVEL')
    bev.width = 0.03
    bev.segments = 3
    objs.append(d)
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.1, major_segments=72, minor_segments=14, location=(0, 0.02, 0),
                                     rotation=(math.radians(90), 0, 0))
    t = bpy.context.object
    t.data.materials.append(m_mar)
    objs.append(t)
    # un aro fino adentro
    bpy.ops.mesh.primitive_torus_add(major_radius=0.84, minor_radius=0.025, major_segments=64, minor_segments=8, location=(0, 0.075, 0),
                                     rotation=(math.radians(90), 0, 0))
    t2 = bpy.context.object
    t2.data.materials.append(m_mar)
    objs.append(t2)
    for k in range(8):
        a = 2 * math.pi * k / 8 + math.pi / 8
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, segments=16, ring_count=8, location=(math.cos(a) * 1.0, 0.1, math.sin(a) * 1.0))
        s = bpy.context.object
        s.data.materials.append(m_mar)
        objs.append(s)
    if tema == 'reliquia':
        m_gema = material('gema reliquia', '#C83CFF', 0.0, 0.1, brillo=1.5)
        for k in range(4):
            a = math.pi / 2 * k
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.085, subdivisions=2, location=(math.cos(a) * 1.0, 0.13, math.sin(a) * 1.0))
            g = bpy.context.object
            g.data.materials.append(m_gema)
            objs.append(g)
    for o in objs:
        for c in o.users_collection:
            c.objects.unlink(o)
        coll.objects.link(o)
    return objs


_NUM = None


def normalizar_d(d):
    """Reescribe el trazo SVG con todo separado: los arcos compactos («a10 10 0 100 20», banderas pegadas) los lee mal
    el importador de Blender y salen rayas sueltas."""
    import re
    global _NUM
    _NUM = _NUM or re.compile(r'[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?')
    out, i, n, cmd, primero = [], 0, len(d), None, True

    def saltar():
        nonlocal i
        while i < n and d[i] in ' ,\t\n':
            i += 1

    def num():
        nonlocal i
        saltar()
        m = _NUM.match(d, i)
        i = m.end()
        return m.group(0)

    def bandera():
        nonlocal i
        saltar()
        c = d[i]
        i += 1
        return c
    while True:
        saltar()
        if i >= n:
            break
        if d[i].isalpha():
            cmd = d[i]
            i += 1
            if cmd in 'Zz':
                out.append(cmd)
                primero = True
                continue
            primero = True
            continue
        # (cada grupo con su letra: el importador tampoco entiende las repeticiones implícitas; después de M va L)
        letra = cmd if primero or cmd not in 'Mm' else ('L' if cmd == 'M' else 'l')
        primero = False
        if cmd in ('A', 'a'):
            out += [letra, num(), num(), num(), bandera(), bandera(), num(), num()]
        else:
            k = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'S': 4, 'Q': 4, 'T': 2}[cmd.upper()]
            out += [letra] + [num() for _ in range(k)]
    return ' '.join(out)


def relieve(coll, d, tema, tmp):
    """El glifo en relieve: el trazo SVG del juego hecho curva, extruido, con bisel, centrado sobre la medalla."""
    svg = os.path.join(tmp, 'glifo.svg')
    with open(svg, 'w') as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="{normalizar_d(d)}" fill="#000"/></svg>')
    antes = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=svg)
    nuevos = [o for o in bpy.data.objects if o not in antes and o.type == 'CURVE']
    if not nuevos:
        return []
    bpy.ops.object.select_all(action='DESELECT')
    for o in nuevos:
        o.select_set(True)
    bpy.context.view_layer.objects.active = nuevos[0]
    if len(nuevos) > 1:
        bpy.ops.object.join()
    g = bpy.context.view_layer.objects.active
    for c in list(g.users_collection):
        c.objects.unlink(g)
    coll.objects.link(g)
    # Centrar y escalar a 1,1 de ancho (en su plano XY), y pararlo frente a la medalla
    import mathutils
    pts = [g.matrix_world @ p.co.xyz for s in g.data.splines for p in s.bezier_points] + [g.matrix_world @ p.co.xyz for s in g.data.splines for p in s.points]
    lo = mathutils.Vector((min(p.x for p in pts), min(p.y for p in pts), 0))
    hi = mathutils.Vector((max(p.x for p in pts), max(p.y for p in pts), 0))
    centro = (lo + hi) / 2
    esc = 1.12 / max(hi.x - lo.x, hi.y - lo.y, 1e-6)
    for s in g.data.splines:
        for p in s.bezier_points:
            for attr in ('co', 'handle_left', 'handle_right'):
                v = g.matrix_world @ getattr(p, attr)
                setattr(p, attr, ((v.x - centro.x) * esc, (v.y - centro.y) * esc, 0))
        for p in s.points:
            v = g.matrix_world @ p.co.xyz
            p.co = ((v.x - centro.x) * esc, (v.y - centro.y) * esc, 0, 1)
    g.matrix_world = mathutils.Matrix.Identity(4)
    g.data.dimensions = '2D'
    g.data.fill_mode = 'BOTH'
    g.data.extrude = 0.06
    g.data.bevel_depth = 0.022
    g.data.bevel_resolution = 3
    g.data.resolution_u = 16
    # (de pie mirando a +Y y sin quedar al revés: X 90° y Z 180°)
    g.rotation_euler = (math.radians(90), 0, math.radians(180))
    g.location = (0, 0.16, 0)
    g.data.materials.clear()
    # (metal a medias: del todo metálico se ve oscuro con esta luz)
    g.data.materials.append(material(f'relieve {tema}', TEMAS[tema][2], 0.55, 0.3))
    return [g]


def main(json_path, out, cuales=None, hoja=None):
    datos = json.load(open(json_path))
    clay.reset_scene()
    try:
        bpy.ops.preferences.addon_enable(module='io_curve_svg')
    except Exception:
        pass
    scene = bpy.context.scene
    sc.preparar_render(scene, 256, 32, transparente=True)
    scene.view_settings.look = 'AgX - High Contrast'
    os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, '_tmp_med')
    os.makedirs(tmp, exist_ok=True)
    trabajos = [(t, g) for t, lista in datos['usos'].items() for g in lista]
    if cuales:
        trabajos = [tg for tg in trabajos if f'{tg[0]}:{tg[1]}' in cuales]
    hechos = []
    luces = clay.collection('SG luces medallas')
    for tema, gl in trabajos:
        d = datos['glifos'].get(gl)
        if not d:
            continue
        coll = clay.collection(f'SG medalla {tema} {gl}')
        objs = medalla_base(coll, tema) + relieve(coll, d, tema, tmp)
        for o in list(luces.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        import mathutils
        lo = mathutils.Vector((-1.12, -0.3, -1.12))
        hi = mathutils.Vector((1.12, 0.1, 1.12))
        sc.luces_dramaticas(luces, centro=(0, 0, 0), escala=2.2, calida='#FFD8A8')
        cam = sc.camara_figura(f'cam medalla {tema} {gl}', lo, hi, 12, 18, margen=1.08)
        png = os.path.join(tmp, f'{tema}_{gl}.png')
        sc.render(scene, cam, png)
        bpy.data.objects.remove(cam, do_unlink=True)
        nombre = f'med_{tema}_{gl}'
        halo(png, TEMAS[tema][3], False).save(os.path.join(out, f'{nombre}.webp'), 'WEBP', quality=90, method=6)
        for o in objs:
            bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.collections.remove(coll)
        hechos.append(nombre)
        print('medalla', nombre, flush=True)
    if hoja:
        from PIL import Image, ImageDraw
        cols = 12
        filas = (len(hechos) + cols - 1) // cols
        im = Image.new('RGB', (cols * 128, filas * 142), (40, 36, 34))
        dr = ImageDraw.Draw(im)
        for k, i in enumerate(hechos):
            ic = Image.open(os.path.join(out, f'{i}.webp')).convert('RGBA')
            x, y = (k % cols) * 128, (k // cols) * 142
            im.paste(ic, (x, y + 14), ic)
            dr.text((x + 2, y + 1), i[4:24], fill=(235, 200, 160))
        im.save(hoja)
        print('HOJA', hoja, flush=True)
    import shutil
    shutil.rmtree(tmp, ignore_errors=True)
    print('LISTO', len(hechos), flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    hoja = args[args.index('--hoja') + 1] if '--hoja' in args else None
    pos = [a for a in args if not a.startswith('--') and a != hoja]
    main(pos[0], pos[1], set(pos[2].split(',')) if len(pos) > 2 else None, hoja)
