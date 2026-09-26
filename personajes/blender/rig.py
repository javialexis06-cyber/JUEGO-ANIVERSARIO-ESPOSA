"""Esqueleto compatible con el de la entrega anterior (mismos 28 nombres de hueso,
todos orientados hacia +Z) más dos huesos opcionales para el cabello largo.

Convención heredada: el sufijo .L corresponde al lado -X (izquierda de la pantalla
cuando el personaje mira a la cámara) y .R al lado +X. Así los clips existentes
(Reposo, Saludar, Caminar, ...) se pueden reutilizar sin renombrar nada.
"""
import bpy
import numpy as np

import clay

BONE_LEN = 0.1


def bone_layout(P, B, extra=None):
    hc = np.array(P['head_center'])
    F = P['face']
    A = B['arm']
    S = B['shoe']
    neck = P['neck_top']
    pelvis_z = B.get('pelvis_z', 0.47)
    leg_top = B.get('leg_top', pelvis_z - 0.02)
    ankle_z = B.get('ankle_z', 0.14)
    head_top = hc[2] + P['head_radii'][2]
    L = {
        'raiz': (0, 0, 0),
        'pelvis': (0, 0.03, pelvis_z),
        'torso': (0, 0.03, pelvis_z + 0.13),
        'cabeza': (0, 0.02, neck - 0.02),
        'sonrisa': (0, -0.45, F['mouth'][1] - F['mouth'][2] * 0.5),
        'hablar': (0, -0.46, F['mouth'][1] - F['mouth'][2] * 0.5),
        'beso': (0, -0.5, F['mouth'][1] - F['mouth'][2] * 0.5),
        'suciedad_cara': (0, 0, hc[2]),
        'ojo.L': (-F['eye_x'], -0.43, F['eye_z']),
        'parpado.L': (-F['eye_x'], -0.42, F['eye_z']),
        'cabello.L': (-0.3, 0.06, head_top - 0.2),
        'ojo.R': (F['eye_x'], -0.43, F['eye_z']),
        'parpado.R': (F['eye_x'], -0.42, F['eye_z']),
        'cabello.R': (0.3, 0.06, head_top - 0.2),
        'suciedad_ropa': (0, 0, pelvis_z + 0.3),
        'brazo.L': (-A['shoulder'][0], A['shoulder'][1], A['shoulder'][2]),
        'mano.L': (-(A['hand'][0] - 0.03), A['hand'][1] + 0.01, A['hand'][2] + 0.06),
        'brazo.R': (A['shoulder'][0], A['shoulder'][1], A['shoulder'][2]),
        'mano.R': (A['hand'][0] - 0.03, A['hand'][1] + 0.01, A['hand'][2] + 0.06),
        'pierna.L': (-S['x'], 0.03, leg_top),
        'pie.L': (-S['x'], -0.01, ankle_z),
        'suciedad_pie.L': (-S['x'], -0.1, 0.18),
        'pierna.R': (S['x'], 0.03, leg_top),
        'pie.R': (S['x'], -0.01, ankle_z),
        'suciedad_pie.R': (S['x'], -0.1, 0.18),
        'regalo': (0, -0.42, 0.9),
        'comida': (0, -0.47, 1.25),
        'burbujas': (0, 0, 0),
    }
    if extra:
        L.update(extra)
    return L


PARENTS = {
    'raiz': None, 'pelvis': 'raiz', 'torso': 'pelvis', 'cabeza': 'torso',
    'sonrisa': 'cabeza', 'hablar': 'cabeza', 'beso': 'cabeza', 'suciedad_cara': 'cabeza',
    'ojo.L': 'cabeza', 'parpado.L': 'cabeza', 'cabello.L': 'cabeza',
    'ojo.R': 'cabeza', 'parpado.R': 'cabeza', 'cabello.R': 'cabeza',
    'suciedad_ropa': 'torso', 'brazo.L': 'torso', 'mano.L': 'brazo.L', 'brazo.R': 'torso', 'mano.R': 'brazo.R',
    'pierna.L': 'pelvis', 'pie.L': 'pierna.L', 'suciedad_pie.L': 'pie.L',
    'pierna.R': 'pelvis', 'pie.R': 'pierna.R', 'suciedad_pie.R': 'pie.R',
    'regalo': 'raiz', 'comida': 'raiz', 'burbujas': 'raiz',
    'cabello_largo.L': 'cabeza', 'cabello_largo.R': 'cabeza',
}


def build_armature(name, layout, coll):
    arm_data = bpy.data.armatures.new(f'{name} | RIG')
    rig = bpy.data.objects.new(f'{name} | RIG', arm_data)
    clay.link(rig, coll)
    bpy.context.view_layer.objects.active = rig
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    ebones = {}
    for bname, head in layout.items():
        eb = arm_data.edit_bones.new(bname)
        eb.head = head
        eb.tail = (head[0], head[1], head[2] + BONE_LEN)
        eb.roll = 0.0
        ebones[bname] = eb
    for bname, eb in ebones.items():
        par = PARENTS.get(bname)
        if par and par in ebones:
            eb.parent = ebones[par]
    bpy.ops.object.mode_set(mode='OBJECT')
    rig.show_in_front = True
    return rig


def side_of(obj_name):
    if ' izq' in obj_name:
        return '.L'
    if ' der' in obj_name:
        return '.R'
    return None


RULES = [
    # (fragmento del nombre, hueso, ¿por lado?)
    ('pespunte camiseta', 'torso', False),
    ('ribete', 'torso', False),
    ('pespunte pantalon', 'pelvis', False),
    ('tenis', 'pie', True),
    ('ojo feliz', 'parpado', True),
    ('destello', 'ojo', True),
    ('ojo ', 'ojo', True),
    ('boca', 'sonrisa', False),
    ('puño manga', 'brazo', True),
    ('manga', 'brazo', True),
    ('brazo', 'brazo', True),
    ('manilla', 'mano.L', False),
    ('mano', 'mano', True),
    ('pulgar', 'mano', True),
    ('cuello camiseta', 'torso', False),
    ('dobladillo camiseta', 'torso', False),
    ('cuello tenis', 'pie', True),
    ('cuello', 'torso', False),
    ('torso', 'torso', False),
    ('chaleco', 'torso', False),
    ('solapa', 'torso', False),
    ('tapa bolsillo', 'torso', False),
    ('cadera', 'pelvis', False),
    ('bragueta', 'pelvis', False),
    ('bolsillo', 'pelvis', False),
    ('suela', 'pie', True),
    ('capellada', 'pie', True),
    ('cordon', 'pie', True),
    ('costura puntera', 'pie', True),
    ('pernera', 'pierna', True),
    ('dobladillo short', 'pierna', True),
    ('dobladillo', 'pierna', True),
    ('pierna short', 'pierna', True),
    ('puño media', 'pierna', True),
    ('media', 'pierna', True),
    ('pierna', 'pierna', True),
]


def bone_for(obj_name):
    low = obj_name.lower()
    for frag, bone, by_side in RULES:
        if frag in low:
            if by_side:
                s = side_of(low)
                return bone + (s or '.L')
            return bone
    return 'cabeza'


def skin(rig, objs, long_hair=False, hair_split_z=None):
    """Asigna pesos rígidos por pieza (estilo figura articulada) y, si hay cabello
    largo, pesos suaves entre la cabeza y los huesos del cabello colgante."""
    for obj in objs:
        if obj.type != 'MESH':
            continue
        # Dejar cada malla en espacio de mundo antes de emparentar
        mw = obj.matrix_world.copy()
        obj.parent = rig
        obj.matrix_parent_inverse = rig.matrix_world.inverted()
        obj.matrix_world = mw
        for g in list(obj.vertex_groups):
            obj.vertex_groups.remove(g)
        bone = bone_for(obj.name)
        if obj.name.lower().endswith('| pantalon'):
            # Pantalón de una pieza: la cadera sigue a la pelvis y cada pernera a su pierna
            gp = obj.vertex_groups.new(name='pelvis')
            gl = obj.vertex_groups.new(name='pierna.L')
            gr = obj.vertex_groups.new(name='pierna.R')
            mwv = obj.matrix_world
            for v in obj.data.vertices:
                w = mwv @ v.co
                t = float(np.clip((0.44 - w.z) / 0.14, 0.0, 1.0))
                t = t * t * (3 - 2 * t)
                side = float(np.clip(0.5 + w.x / 0.08, 0.0, 1.0))
                gp.add([v.index], 1.0 - t, 'REPLACE')
                gl.add([v.index], t * (1 - side), 'REPLACE')
                gr.add([v.index], t * side, 'REPLACE')
        elif long_hair and 'mechon' in obj.name.lower() and hair_split_z is not None:
            side = '.L' if ' izq' in obj.name.lower() else '.R'
            gh = obj.vertex_groups.new(name='cabeza')
            gl = obj.vertex_groups.new(name='cabello_largo' + side)
            mwv = obj.matrix_world
            for v in obj.data.vertices:
                z = (mwv @ v.co).z
                t = float(np.clip((hair_split_z - z) / 0.35, 0.0, 1.0))
                t = t * t * (3 - 2 * t)
                gh.add([v.index], 1.0 - t, 'REPLACE')
                gl.add([v.index], t, 'REPLACE')
        else:
            g = obj.vertex_groups.new(name=bone)
            g.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
        mod = obj.modifiers.new('Esqueleto', 'ARMATURE')
        mod.object = rig
        # El esqueleto debe ir antes de la subdivisión para deformar la malla base.
        if obj.modifiers.find('Esqueleto') > 0:
            with bpy.context.temp_override(object=obj):
                bpy.ops.object.modifier_move_to_index(modifier='Esqueleto', index=0)
    return rig
