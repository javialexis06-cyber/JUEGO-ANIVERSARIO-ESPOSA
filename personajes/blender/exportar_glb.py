"""Exporta los modelos al juego web (GLB) y los datos de la tienda.

Para el jugable 1 los personajes se exportan como poses "horneadas" (malla estática por pose)
y el juego alterna entre ellas con un rebote al caminar. Las vitrinas llevan los productos como
vacíos con `producto` en sus extras: el juego pone ahí el producto y lo quita según el stock.

Uso: python3 exportar_glb.py <carpeta_salida> [partes]
  partes: productos,vitrinas,letreros,utileria,personajes,tienda,iconos (por defecto todas)
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

import clay  # noqa: E402
import escena  # noqa: E402
import productos as prod  # noqa: E402
import tiendas  # noqa: E402
import utileria  # noqa: E402
import vitrinas  # noqa: E402

OUT = None


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------

def simplificar_materiales():
    """glTF no entiende texturas procedurales: se deja el color base plano y se marca el fieltro
    (el juego le pone un relieve de fieltro compartido a los materiales marcados)."""
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if bsdf is None:
            continue
        base = bsdf.inputs['Base Color']
        if base.is_linked:
            src = base.links[0].from_node
            if src.type == 'VALTORGB':
                els = src.color_ramp.elements
                col = els[len(els) // 2].color if len(els) > 2 else els[-1].color
                base.default_value = tuple(col)
                mat['fieltro'] = 1
            elif src.type in ('TEX_BRICK', 'TEX_CHECKER'):
                # Piso de baldosas o ajedrez: el juego redibuja el patrón con estos datos
                c1, c2 = src.inputs['Color1'].default_value, src.inputs['Color2'].default_value
                info = dict(tipo='ladrillo' if src.type == 'TEX_BRICK' else 'ajedrez', c1=list(c1)[:3], c2=list(c2)[:3],
                            escala=src.inputs['Scale'].default_value)
                if src.type == 'TEX_BRICK':
                    info['mortero'] = list(src.inputs['Mortar'].default_value)[:3]
                    info['mortero_tam'] = src.inputs['Mortar Size'].default_value
                    info['ancho'] = src.inputs['Brick Width'].default_value
                    info['alto'] = src.inputs['Row Height'].default_value
                    info['desfase'] = src.offset
                mat['baldosa'] = json.dumps(info)
                base.default_value = tuple((a + b) / 2 for a, b in zip(c1, c2))
            nt.links.remove(base.links[0])
        nrm = bsdf.inputs['Normal']
        if nrm.is_linked:
            mat['relieve'] = 1
            nt.links.remove(nrm.links[0])
        for name in ('Roughness', 'Metallic', 'Alpha', 'Emission Color'):
            s = bsdf.inputs.get(name)
            if s is not None and s.is_linked:
                nt.links.remove(s.links[0])


def hornear(objs, coll, nombre):
    """Copia estática (con modificadores y pose aplicados) de los objetos malla, en coordenadas de mundo."""
    dg = bpy.context.evaluated_depsgraph_get()
    out = []
    for o in objs:
        if o.type != 'MESH':
            continue
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=False, depsgraph=dg)
        me.transform(o.matrix_world)
        n = bpy.data.objects.new(f'{nombre} | {o.name}', me)
        coll.objects.link(n)
        out.append(n)
    return out


def exportar(objs, path, extras=True):
    simplificar_materiales()
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_extras=extras, export_animations=False, export_skins=False, export_morph=False,
                              export_cameras=False, export_lights=False)
    print('GLB', os.path.basename(path), round(os.path.getsize(path) / 1e6, 2), 'MB', flush=True)


def arbol(root):
    stack, out = [root], []
    while stack:
        o = stack.pop()
        out.append(o)
        stack.extend(o.children)
    return out


def instancias_a_marcas(root):
    """Las copias de productos se vuelven vacíos marcados con el nombre del producto."""
    n = 0
    for o in arbol(root):
        if o.type == 'EMPTY' and o.instance_type == 'COLLECTION' and o.instance_collection:
            nombre = o.instance_collection.name.replace('Producto | ', '')
            o['producto'] = nombre
            o.instance_type = 'NONE'
            o.instance_collection = None
            o.name = f'hueco {nombre}'
            n += 1
    return n


def incluir_colecciones():
    def walk(lc):
        for ch in lc.children:
            ch.exclude = False
            walk(ch)
    walk(bpy.context.view_layer.layer_collection)


# --------------------------------------------------------------------------
# Partes
# --------------------------------------------------------------------------

def exportar_productos():
    incluir_colecciones()
    raices = []
    coll = clay.collection('Export productos')
    nombres = [n for n, _ in prod.CATALOGO] + [n for n, _, _ in prod.CAJAS]
    for i, n in enumerate(nombres):
        src = bpy.data.collections[f'Producto | {n}']
        root = bpy.data.objects.new(f'prod_{n}', None)
        coll.objects.link(root)
        for o in hornear(list(src.objects), coll, n):
            o.parent = root
        raices.append(root)
    todo = [o for r in raices for o in arbol(r)]
    exportar(todo, os.path.join(OUT, 'productos.glb'))


def exportar_vitrinas(tipos, niveles):
    manifest = {}
    for kind in tipos:
        for lvl in niveles:
            coll = clay.collection(f'Export {kind} {lvl}')
            root = vitrinas.build(kind, lvl, coll, (0, 0, 0), 0.0)
            n = instancias_a_marcas(root)
            root.name = f'vitrina_{kind}_{lvl}'
            root['capacidad_visual'] = n
            path = os.path.join(OUT, f'vitrina_{kind}_{lvl}.glb')
            exportar(arbol(root), path)
            manifest[f'{kind}_{lvl}'] = dict(archivo=os.path.basename(path), huecos=n, huella=tiendas.HUELLA[(kind, lvl)])
            coll.hide_render = coll.hide_viewport = True
    return manifest


def exportar_letreros(secciones):
    for sec in secciones:
        if tiendas.SECCIONES[sec][1] is None:
            continue
        coll = clay.collection(f'Export letrero {sec}')
        root = tiendas.hanging_sign(coll, 0.0, 0.0, sec, 2.75)
        root.rotation_euler = (0, 0, 0)
        exportar(arbol(root), os.path.join(OUT, f'letrero_{sec}.glb'))
    coll = clay.collection('Export botón')
    before = set(coll.objects)
    tiendas.empty_slot(coll, 0.0, 0.0, 0.8, 0.6, 0.0)
    boton = [o for o in coll.objects if o not in before and o.name.startswith('botón comprar')][0]
    boton.rotation_euler = (0, 0, 0)
    exportar(arbol(boton), os.path.join(OUT, 'boton_comprar.glb'))


def exportar_utileria():
    piezas = [('carrito_1', lambda c: utileria.carrito(1, c)), ('carrito_2', lambda c: utileria.carrito(2, c)),
              ('canasta', utileria.canasta), ('basura', utileria.basura), ('caneca', utileria.caneca)]
    for nombre, fn in piezas:
        coll = clay.collection(f'Export {nombre}')
        root = utileria.build(nombre, fn, coll, (0, 0, 0), 0.0, 1.0)
        marcas = instancias_a_marcas(root)
        del marcas
        exportar(arbol(root), os.path.join(OUT, f'{nombre}.glb'))


POSES_EL = {
    'reposo': 'reposo', 'caminar_a': 'caminar', 'caminar_b': 'caminar_espejo', 'carrito_a': 'carrito', 'carrito_b': 'carrito_espejo',
    'reponer': 'reponer', 'cobrar': 'cobrar', 'celebrar': 'feliz',
}
POSES_CLIENTE = {'reposo': 'reposo', 'caminar_a': 'caminar', 'caminar_b': 'caminar_espejo', 'tomar': 'reponer'}
POSES_FAMOSO = dict(POSES_CLIENTE, saludar='saludo')
POSES_AYUDANTE = {'reposo': 'reposo', 'caminar_a': 'caminar', 'caminar_b': 'caminar_espejo', 'carrito_a': 'carrito',
                  'carrito_b': 'carrito_espejo', 'reponer': 'reponer', 'cobrar': 'cobrar'}
# Poses de la mascota de pareja (Nuestro Hogar); se suman a las de la tienda en el mismo archivo
POSES_MASCOTA = {
    'comer_a': 'comer_a', 'comer_b': 'comer_b', 'dormido': 'dormido', 'frotar_a': 'frotar_a', 'frotar_b': 'frotar_b',
    'recibir_caricia': 'recibir_caricia', 'acariciar': 'acariciar', 'abrazo_izq': 'abrazo_izq', 'abrazo_der': 'abrazo_der',
    'beso': 'beso', 'regalo': 'regalo', 'hablar_a': 'hablar_a', 'hablar_b': 'hablar_b', 'triste': 'triste',
    'saludo_a': 'saludo', 'saludo_b': 'saludo_b', 'sentado': 'sentado', 'pensando': 'pensando',
    'comer_sentado_a': 'comer_sentado_a', 'comer_sentado_b': 'comer_sentado_b', 'sentado_feliz': 'sentado_feliz',
}
# Mallas de expresión (ojos cerrados, bocas, barro): se exportan y el juego muestra la que toque
EXPRESIONES = ('ojo feliz', 'boca hablar', 'boca beso', 'boca triste', 'suciedad')

# Clientes y ayudantes que se suman en la tiendita (problemas del día y mejoras)
CLIENTES_2 = {'ejecutivo': POSES_CLIENTE, 'deportista': POSES_CLIENTE, 'nina': POSES_CLIENTE, 'ladron': POSES_CLIENTE,
              'famoso': POSES_FAMOSO, 'cajera': POSES_AYUDANTE, 'reponedor': POSES_AYUDANTE, 'guardia': POSES_AYUDANTE,
              'aseo': POSES_AYUDANTE}


def _poses_extra():
    import poses
    P = poses.POSES

    def espejo(d):
        out = {}
        for k, v in d.items():
            if k.startswith('_'):
                out[k] = v
            elif k.endswith('.L'):
                out[k[:-2] + '.R'] = v
            elif k.endswith('.R'):
                out[k[:-2] + '.L'] = v
            else:
                out[k] = v
        return out
    P['caminar_espejo'] = espejo(P['caminar'])
    # En el carrito los brazos quedan igual; solo se alternan las piernas
    car = dict(P['carrito'])
    for a, b in (('pierna.L', 'pierna.R'), ('pie.L', 'pie.R')):
        car[a], car[b] = P['carrito'][b], P['carrito'][a]
    P['carrito_espejo'] = car
    P['cobrar'] = {'brazo.L': (-55, 10, 0), 'brazo.R': (-55, -10, 0), 'mano.L': (-10, 0, 0), 'mano.R': (-10, 0, 0),
                   'cabeza': (6, 0, 0)}


def _rig_personaje(key):
    """Construye al personaje con esqueleto (Él, Ella o un cliente) y devuelve (armadura, objetos, escala)."""
    import cuerpo
    import rig
    coll = clay.collection(f'Export personaje {key}')
    escala = 1.0
    if key in ('el', 'ella'):
        import el
        import ella
        mod = el if key == 'el' else ella
        cuerpo.VOX = 1.35
        mod.build(coll)
        P, B, base = mod.P, mod.B, key
    else:
        import clientes
        import el
        import ella
        cuerpo.VOX = 1.5
        root = clientes.build(key, coll)
        escala = root.scale[0]
        root.scale = (1, 1, 1)
        bpy.context.view_layer.update()
        S = clientes.SPECS[key]
        mod = el if S['base'] == 'm' else ella
        P, B, base = mod.P, mod.B, ('el' if S['base'] == 'm' else 'ella')
    objs = [o for o in coll.objects if o.type == 'MESH']
    extra = {'cabello_largo.L': (-0.7, 0.2, 1.35), 'cabello_largo.R': (0.7, 0.2, 1.35)} if base == 'ella' else None
    arm = rig.build_armature(f'rig {key}', rig.bone_layout(P, B, extra), coll)
    rig.skin(arm, objs, long_hair=base == 'ella', hair_split_z=1.25 if base == 'ella' else None,
             pants_split_z=0.52 if base == 'ella' else 0.44)
    return arm, objs, escala


def exportar_personaje(key, poses_map):
    import poses
    arm, objs, escala = _rig_personaje(key)
    tmp = clay.collection(f'Export poses {key}')
    for archivo, pose in poses_map.items():
        poses.apply_pose(arm, pose)
        bpy.context.view_layer.update()
        baked = hornear(objs, tmp, f'{key} {archivo}')
        root = bpy.data.objects.new(f'{key}_{archivo}', None)
        tmp.objects.link(root)
        for o in baked:
            o.parent = root
        exportar([root] + baked, os.path.join(OUT, f'{key}_{archivo}.glb'))
        for o in baked:
            bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.objects.remove(root, do_unlink=True)
    return escala


def exportar_personaje_animado(key, poses_map):
    """Un solo modelo con esqueleto y una animación (pose fija) por cada pose del juego.

    Pesa mucho menos que una malla por pose, así que la malla puede conservar casi todo su detalle,
    y en el juego las poses se mezclan suavemente en lugar de saltar de una a otra."""
    import poses
    arm, objs, escala = _rig_personaje(key)
    for o in objs:
        if any(e in o.name.lower() for e in EXPRESIONES):
            o.hide_viewport = False
            o.hide_render = False
    arm.animation_data_create()
    ad = arm.animation_data
    for archivo, pose in poses_map.items():
        poses.apply_pose(arm, pose)
        for f in (1, 2):
            for pb in arm.pose.bones:
                pb.keyframe_insert('rotation_euler', frame=f)
                pb.keyframe_insert('location', frame=f)
        act = ad.action
        act.name = f'{key} {archivo}'
        act.use_fake_user = True
        pista = ad.nla_tracks.new()
        pista.name = archivo
        tira = pista.strips.new(archivo, 1, act)
        if getattr(act, 'slots', None) and hasattr(tira, 'action_slot'):
            tira.action_slot = act.slots[0]
        ad.action = None
    poses.apply_pose(arm, '__reposo_de_fabrica__')
    bpy.context.view_layer.update()
    path = os.path.join(OUT, f'{key}.glb')
    simplificar_materiales()
    bpy.ops.object.select_all(action='DESELECT')
    for o in [arm] + objs:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_extras=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                              export_skins=True, export_def_bones=False, export_morph=False, export_cameras=False,
                              export_lights=False, export_optimize_animation_size=False)
    print('GLB', os.path.basename(path), round(os.path.getsize(path) / 1e6, 2), 'MB', flush=True)
    return escala


def exportar_tienda(level):
    """Cascarón de la tienda (sin sitios, vitrinas ni personajes) + datos de los sitios en JSON."""
    T = tiendas.TIENDAS[level]
    W, D = T['W'], T['D']
    coll = clay.collection(f'Export tienda {level}')
    before = set(bpy.data.objects)
    U = lambda name, fn, x, y, r=0.0, s=1.0: utileria.build(name, fn, coll, (x, y, 0), r, s)
    tiendas.shell(coll, W, D, tiendas._floor(T['floor']), T['wall'])
    tiendas.knee_walls(coll, W, D, T['knee'])
    for x, z, h, awning in T['windows']:
        tiendas.window(coll, x, D / 2 - 0.01, z, 2.4, h, awning=awning)
    tiendas.stockroom(coll, T['stock'], D / 2, 1)
    tiendas.entrance(coll, -W / 2, T['entr'], level)
    tiendas.lamps(coll, W, D, level)
    cx, cz = {1: (-0.2, 2.75), 2: (0.6, 3.0), 3: (-6.0, 3.0), 4: (-7.4, 3.0)}[level]
    tiendas.clock(coll, cx, D / 2 - 0.02, cz)
    U('planta', utileria.planta, -W / 2 + 0.6, -D / 2 + 0.5)
    tiendas.pila_bodega(coll, W / 2 - 1.0, -D / 2 + 0.7, level)
    tiendas.pila_bodega(coll, T['stock'] - 2.2, D / 2 - 1.1, level + 3)
    nuevos = [o for o in bpy.data.objects if o not in before]
    # Las cajas de la bodega son copias de productos: se hacen reales para el cascarón
    for o in nuevos:
        if o.type == 'EMPTY' and o.instance_type == 'COLLECTION':
            o['producto'] = o.instance_collection.name.replace('Producto | ', '')
            o.instance_type = 'NONE'
            o.instance_collection = None
    exportar(nuevos, os.path.join(OUT, f'tienda{level}_base.glb'))
    # Sitios: posición por nivel de vitrina (el anclaje a la pared depende de la profundidad)
    sitios = []
    k = 0
    for spec in T['slots']:
        if spec.get('gondola') or spec.get('machine'):
            continue
        kind = tiendas.SECCIONES[spec['section']][0]
        pos = {}
        for lvl in (1, 2, 3):
            y1 = tiendas.HUELLA[(kind, lvl)][3]
            if spec['back'] is not None:
                x, y, rot = spec['back'], D / 2 - 0.1 - y1, 0.0
            elif spec['left'] is not None:
                x, y, rot = -W / 2 + 0.1 + y1, spec['left'], math.pi / 2
            else:
                (x, y), rot = spec['at'], spec['rot']
            pos[lvl] = dict(x=round(x, 3), y=round(y, 3), rot=round(rot, 4))
        sitios.append(dict(id=k, seccion=spec['section'], tipo=kind, inicio=bool(spec['start']), letrero=bool(spec['sign']),
                           posicion=pos, huella={lvl: tiendas.HUELLA[(kind, lvl)] for lvl in (1, 2, 3)},
                           color_tapete=tiendas.SECCIONES[spec['section']][2]))
        k += 1
    for spec in T['slots']:
        if spec.get('gondola'):
            x0, x1, y0, y1 = tiendas.HUELLA[('estante', tiendas.TOPE[level])]
            w, d = x1 - x0, y1 - y0
            for i in range(spec['n']):
                xx = spec['x'] + (i - (spec['n'] - 1) / 2) * (w + 0.05)
                for yy, rot in ((spec['y'], 0.0), (spec['y'] + d + 0.02, math.pi)):
                    pos = {lvl: dict(x=round(xx, 3), y=round(yy, 3), rot=rot) for lvl in (1, 2, 3)}
                    sitios.append(dict(id=k, seccion='abarrotes', tipo='estante', inicio=False, letrero=False, posicion=pos,
                                       huella={lvl: tiendas.HUELLA[('estante', lvl)] for lvl in (1, 2, 3)},
                                       color_tapete=tiendas.SECCIONES['abarrotes'][2], isla=True))
                    k += 1
    datos = dict(nivel=level, nombre=T['name'], W=W, D=D, tope=tiendas.TOPE[level], escala_personas=tiendas.PERSON_SCALE,
                 bodega=dict(x=T['stock'], y=D / 2 - 0.9), entrada=dict(x=-W / 2 + 0.9, y=T['entr']), sitios=sitios,
                 coordenadas='Blender: x a la derecha, y hacia el fondo, z arriba. En Three.js: (x, 0, -y) y rotación y = rot.')
    with open(os.path.join(OUT, f'tienda{level}.json'), 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)
    print('JSON', f'tienda{level}.json', len(sitios), 'sitios', flush=True)


def exportar_iconos(out_iconos, nombres):
    """Íconos PNG transparentes de los productos para la interfaz (globos, alertas, tienda)."""
    os.makedirs(out_iconos, exist_ok=True)
    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = 160
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 24
    coll = clay.collection('Iconos')
    escena.area_light('Luz icono', (-2, -3, 4), (0, 0, 0.1), 300, 2.0, '#FFF3E6', coll)
    escena.area_light('Relleno icono', (3, -2, 2), (0, 0, 0.1), 120, 2.0, '#EAF2FF', coll)
    escena.world_color(scene, '#FFFFFF', 0.8)
    from mathutils import Vector
    scene.view_settings.look = 'AgX - Medium High Contrast'
    for n in nombres:
        c = clay.collection(f'Icono {n}')
        inst = prod.instance(n, (0, 0, 0), -0.4, 1.0, c)
        bpy.context.view_layer.update()
        # Encuadre según el tamaño real del producto
        pts = [o.matrix_world @ Vector(v) for o in bpy.data.collections[f'Producto | {n}'].objects if o.type == 'MESH' for v in o.bound_box]
        zmin, zmax = min(p.z for p in pts), max(p.z for p in pts)
        r = max(max(abs(p.x) for p in pts), max(abs(p.y) for p in pts))
        cz = (zmin + zmax) / 2
        size = max(zmax - zmin, 2 * r) * 1.35
        cam = escena.camera(f'Cam icono {n}', (0, -3.0, cz + 1.2), (0, 0, cz), 50)
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = size
        scene.camera = cam
        scene.render.filepath = os.path.join(out_iconos, f'{n}.png')
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(inst, do_unlink=True)
        c.hide_render = True
    print('ICONOS', len(nombres), flush=True)


def exportar_iconos_piezas(out_iconos, piezas):
    """Íconos PNG de piezas construidas con una función (regalos y decoración de la casa)."""
    from mathutils import Vector
    os.makedirs(out_iconos, exist_ok=True)
    tiendas.exclude_sources()
    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = 160
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 24
    luces = clay.collection('Iconos piezas')
    escena.area_light('Luz icono', (-2, -3, 4), (0, 0, 0.1), 300, 2.0, '#FFF3E6', luces)
    escena.area_light('Relleno icono', (3, -2, 2), (0, 0, 0.1), 120, 2.0, '#EAF2FF', luces)
    escena.world_color(scene, '#FFFFFF', 0.8)
    scene.view_settings.look = 'AgX - Medium High Contrast'
    for n, fn in piezas.items():
        c = clay.collection(f'Icono {n}')
        root = fn(c)
        root.rotation_euler = (0, 0, -0.35)
        bpy.context.view_layer.update()
        pts = [o.matrix_world @ Vector(v) for o in arbol(root) if o.type == 'MESH' for v in o.bound_box]
        zmin, zmax = min(p.z for p in pts), max(p.z for p in pts)
        xmin, xmax = min(p.x for p in pts), max(p.x for p in pts)
        cx, cz = (xmin + xmax) / 2, (zmin + zmax) / 2
        size = max(zmax - zmin, xmax - xmin) * 1.3
        cam = escena.camera(f'Cam icono {n}', (cx, -3.0, cz + 1.0), (cx, 0, cz), 50)
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = size
        scene.camera = cam
        scene.render.filepath = os.path.join(out_iconos, f'{n}.png')
        bpy.ops.render.render(write_still=True)
        c.hide_render = True
    print('ICONOS PIEZAS', len(piezas), flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    OUT = args[0]
    PARTES = args[1].split(',') if len(args) > 1 else ['productos', 'vitrinas', 'letreros', 'utileria', 'personajes', 'tienda', 'iconos']
    os.makedirs(OUT, exist_ok=True)
    t0 = time.time()
    scene = clay.reset_scene()
    escena.setup_render(scene, 160, 160, 24)
    prod.build_all()
    _poses_extra()
    manifest = {}
    if 'iconos' in PARTES:
        tiendas.exclude_sources()
        exportar_iconos(os.path.join(OUT, 'iconos'), [n for n, _ in prod.CATALOGO] + [n for n, _, _ in prod.CAJAS])
    if 'tienda' in PARTES:
        exportar_tienda(1)
    if 'vitrinas' in PARTES:
        manifest['vitrinas'] = exportar_vitrinas(['estante', 'frutas', 'nevera', 'bebidas', 'panaderia', 'congelador', 'caja'], [1, 2])
    if 'letreros' in PARTES:
        exportar_letreros(['frutas', 'abarrotes', 'lacteos', 'panaderia', 'bebidas', 'congelados'])
    if 'utileria' in PARTES:
        exportar_utileria()
    if 'productos' in PARTES:
        exportar_productos()
    if 'personajes' in PARTES:
        escalas = {'el': exportar_personaje('el', POSES_EL)}
        for key in ('abuelita', 'mama', 'adolescente'):
            escalas[key] = exportar_personaje(key, POSES_CLIENTE)
        manifest['personajes'] = dict(escalas=escalas, poses_el=list(POSES_EL), poses_cliente=list(POSES_CLIENTE))
    if 'animados2' in PARTES:
        path = os.path.join(OUT, 'manifest_export.json')
        previo = json.load(open(path)) if os.path.exists(path) else {}
        escalas = previo.get('personajes', {}).get('escalas', {})
        for key, poses_map in CLIENTES_2.items():
            escalas[key] = exportar_personaje_animado(key, poses_map)
        manifest['personajes'] = dict(previo.get('personajes', {}), escalas=escalas)
    if 'pareja' in PARTES:
        # Él y Ella con todas las poses (tienda + casa) y sus expresiones
        path = os.path.join(OUT, 'manifest_export.json')
        previo = json.load(open(path)) if os.path.exists(path) else {}
        escalas = previo.get('personajes', {}).get('escalas', {})
        for key in ('el', 'ella'):
            escalas[key] = exportar_personaje_animado(key, dict(POSES_EL, **POSES_MASCOTA))
        manifest['personajes'] = dict(previo.get('personajes', {}), escalas=escalas, poses_mascota=list(POSES_MASCOTA))
    if 'casa' in PARTES:
        import casa
        for key in casa.CUARTOS:
            coll = casa.construir(key)
            nuevos = list(coll.objects)
            for o in nuevos:
                if o.type == 'EMPTY' and o.instance_type == 'COLLECTION' and o.instance_collection:
                    o['producto'] = o.instance_collection.name.replace('Producto | ', '')
                    o.instance_type = 'NONE'
                    o.instance_collection = None
            raiz = bpy.data.objects.new(f'casa_{key}', None)
            coll.objects.link(raiz)
            for o in nuevos:
                if o.parent is None:
                    o.parent = raiz
            exportar(arbol(raiz), os.path.join(OUT, f'casa_{key}.glb'))
            coll.hide_render = coll.hide_viewport = True
        datos = dict(W=casa.W, D=casa.D, alto=casa.ALTO, escala_personas=tiendas.PERSON_SCALE,
                     cuartos={k: dict(nombre=v['nombre'], puntos={n: dict(x=p[0], y=p[1], rot=p[2]) for n, p in casa.PUNTOS[k].items()},
                                      sitios=casa.SITIOS_DECO[k]) for k, v in casa.CUARTOS.items()},
                     notas=casa.NOTAS)
        with open(os.path.join(OUT, 'casa.json'), 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=1)
    if 'regalos' in PARTES:
        import regalos
        for key in regalos.PIEZAS:
            coll = clay.collection(f'Export {key}')
            root = regalos.build(key, coll)
            exportar(arbol(root), os.path.join(OUT, f'{key}.glb'))
            coll.hide_render = coll.hide_viewport = True
        piezas = {k: (lambda c, k=k: regalos.build(k, c)) for k in regalos.PIEZAS}
        piezas['planta'] = lambda c: utileria.build('planta', utileria.planta, c)
        piezas['globos'] = lambda c: utileria.build('globos', utileria.globos, c)
        exportar_iconos_piezas(os.path.join(OUT, 'iconos'), piezas)
    if 'utileria2' in PARTES:
        for nombre in ('charco', 'trapero_balde', 'planta', 'parlante', 'globos', 'camara'):
            coll = clay.collection(f'Export {nombre}')
            root = utileria.build(nombre, getattr(utileria, nombre), coll, (0, 0, 0), 0.0, 1.0)
            instancias_a_marcas(root)
            exportar(arbol(root), os.path.join(OUT, f'{nombre}.glb'))
    if 'animados' in PARTES:
        escalas = {'el': exportar_personaje_animado('el', POSES_EL)}
        for key in ('abuelita', 'mama', 'adolescente'):
            escalas[key] = exportar_personaje_animado(key, POSES_CLIENTE)
        manifest['personajes'] = dict(escalas=escalas, poses_el=list(POSES_EL), poses_cliente=list(POSES_CLIENTE), animados=True)
    path = os.path.join(OUT, 'manifest_export.json')
    old = json.load(open(path)) if os.path.exists(path) else {}
    old.update(manifest)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(old, f, ensure_ascii=False, indent=1)
    print('LISTO', round(time.time() - t0, 1), 's', flush=True)
