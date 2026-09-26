"""Poses de presentación sobre el esqueleto compatible (huesos orientados a +Z).

Ejes locales de cada hueso = ejes del mundo con Y<->Z:
  rotación X local -> girar hacia delante/atrás (negativo = hacia delante, -Y)
  rotación Y local -> girar alrededor del eje vertical (cabeza que voltea)
  rotación Z local -> inclinar hacia los lados
Recordatorio: .L es el lado -X (la derecha del personaje cuando mira a cámara).
"""
import math

from mathutils import Euler

POSES = {
    'reposo': {},
    'saludo': {
        'brazo.L': (-25, 0, -115), 'mano.L': (0, 0, 20),
        'brazo.R': (0, 0, 8),
        'cabeza': (4, -6, 5), 'torso': (0, 0, 3),
    },
    'feliz': {
        'brazo.L': (-20, 0, -120), 'brazo.R': (-20, 0, 120),
        'cabeza': (-8, 0, 0),
        '_raiz_z': 0.05,
    },
    'carrito': {
        'brazo.L': (-78, 12, 0), 'brazo.R': (-78, -12, 0),
        'mano.L': (10, 0, 0), 'mano.R': (10, 0, 0),
        'torso': (-8, 0, 0), 'cabeza': (6, 0, 0),
        'pierna.L': (-22, 0, 0), 'pierna.R': (18, 0, 0),
        'pie.L': (12, 0, 0), 'pie.R': (-8, 0, 0),
    },
    'reponer': {
        'brazo.R': (-125, 0, 10), 'mano.R': (-10, 0, 0),
        'brazo.L': (-60, 20, 0),
        'cabeza': (-14, 10, 0), 'torso': (4, 0, 0),
    },
    'caminar': {
        'brazo.L': (25, 0, 0), 'brazo.R': (-25, 0, 0),
        'pierna.L': (-25, 0, 0), 'pierna.R': (22, 0, 0),
        'pie.L': (10, 0, 0),
        'cabeza': (0, 0, -3),
    },
}


def apply_pose(rig, name, extra=None):
    pose = dict(POSES.get(name, {}))
    if extra:
        pose.update(extra)
    for pb in rig.pose.bones:
        pb.rotation_mode = 'XYZ'
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
    for bone, rot in pose.items():
        if bone.startswith('_'):
            continue
        pb = rig.pose.bones.get(bone)
        if pb is None:
            continue
        pb.rotation_euler = Euler([math.radians(a) for a in rot], 'XYZ')
    if '_raiz_z' in pose:
        # La raíz apunta a +Z: su eje Y local es el Z del mundo
        rig.pose.bones['raiz'].location = (0, pose['_raiz_z'], 0)
