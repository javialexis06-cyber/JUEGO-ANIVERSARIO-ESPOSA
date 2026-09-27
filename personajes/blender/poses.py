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
    # --- Mascota de pareja (Nuestro Hogar) ---
    'comer_a': {'brazo.R': (-150, 0, 28), 'mano.R': (-35, 0, 0), 'brazo.L': (-20, 0, 8), 'cabeza': (-6, 0, 0)},
    'comer_b': {'brazo.R': (-128, 0, 22), 'mano.R': (-20, 0, 0), 'brazo.L': (-20, 0, 8), 'cabeza': (3, 0, 0)},
    'dormido': {'brazo.L': (0, 0, 10), 'brazo.R': (0, 0, -10), 'cabeza': (0, 0, 10), 'pierna.L': (0, 0, -4), 'pierna.R': (0, 0, 4)},
    'frotar_a': {'brazo.L': (-165, 0, -35), 'brazo.R': (-150, 0, 40), 'mano.L': (-30, 0, 0), 'mano.R': (-30, 0, 0), 'cabeza': (-6, 0, -6)},
    'frotar_b': {'brazo.L': (-150, 0, -40), 'brazo.R': (-165, 0, 35), 'mano.L': (-30, 0, 0), 'mano.R': (-30, 0, 0), 'cabeza': (-6, 0, 6)},
    'recibir_caricia': {'cabeza': (4, 0, 14), 'torso': (0, 0, 4), 'brazo.L': (-10, 0, -6), 'brazo.R': (-10, 0, 6)},
    'acariciar': {'brazo.R': (-80, 0, 115), 'mano.R': (0, 0, 40), 'cabeza': (-4, 0, -8), 'torso': (0, 0, -6)},
    'abrazo_izq': {'brazo.R': (15, 0, 85), 'mano.R': (0, 0, 30), 'brazo.L': (-35, 0, 15), 'cabeza': (0, 0, -16), 'torso': (0, 0, -6)},
    'abrazo_der': {'brazo.L': (15, 0, -85), 'mano.L': (0, 0, -30), 'brazo.R': (-35, 0, -15), 'cabeza': (0, 0, 16), 'torso': (0, 0, 6)},
    'beso': {'cabeza': (-6, 0, 0), 'torso': (-8, 0, 0), 'brazo.L': (20, 0, -12), 'brazo.R': (20, 0, 12)},
    'regalo': {'brazo.L': (-75, 0, 22), 'brazo.R': (-75, 0, -22), 'mano.L': (-15, 0, 0), 'mano.R': (-15, 0, 0), 'cabeza': (-4, 0, 0)},
    'hablar_a': {'brazo.R': (-45, 0, 35), 'mano.R': (-20, 0, 0), 'cabeza': (2, -6, 3)},
    'hablar_b': {'brazo.R': (-25, 0, 18), 'brazo.L': (-30, 0, -20), 'cabeza': (-2, 6, -3)},
    'triste': {'cabeza': (-18, 0, 0), 'torso': (-8, 0, 0), 'brazo.L': (0, 0, 6), 'brazo.R': (0, 0, -6)},
    'saludo_b': {'brazo.L': (-25, 0, -140), 'mano.L': (0, 0, -15), 'cabeza': (4, -6, 5), 'torso': (0, 0, 3)},
    'sentado': {'pierna.L': (-85, 0, 0), 'pierna.R': (-85, 0, 0), 'pie.L': (75, 0, 0), 'pie.R': (75, 0, 0),
                'brazo.L': (-20, 0, 8), 'brazo.R': (-20, 0, -8)},
    'pensando': {'brazo.R': (-120, 0, 25), 'mano.R': (-50, 0, 0), 'cabeza': (6, 0, 10)},
}
# Sentado a la mesa comiendo: piernas de «sentado» y brazos de «comer»
_PIERNAS_SENTADO = {k: v for k, v in POSES['sentado'].items() if k.startswith(('pierna', 'pie'))}
POSES['comer_sentado_a'] = dict(POSES['comer_a'], **_PIERNAS_SENTADO)
POSES['comer_sentado_b'] = dict(POSES['comer_b'], **_PIERNAS_SENTADO)
POSES['sentado_feliz'] = dict(POSES['sentado'], cabeza=(4, 0, 8), torso=(0, 0, 3))


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
