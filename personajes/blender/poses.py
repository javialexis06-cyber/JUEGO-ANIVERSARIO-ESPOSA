"""Poses de presentación sobre el esqueleto compatible (huesos orientados a +Z).

Ejes locales de cada hueso = ejes del mundo con Y<->Z:
  rotación X local -> girar hacia delante/atrás (negativo = hacia delante, -Y)
  rotación Y local -> girar alrededor del eje vertical (cabeza que voltea)
  rotación Z local -> inclinar hacia los lados
Recordatorio: .L es el lado -X (la derecha del personaje cuando mira a cámara).
Ojo con el signo de X según hacia dónde cuelga la pieza: en brazos y piernas (cuelgan) negativo = hacia
delante; en torso y cabeza (van hacia arriba) positivo = hacia delante (la cabeza agacha, el torso se encorva).
Cabeza: Y positivo voltea hacia +X (derecha de la pantalla); Z positivo la ladea hacia -X.

Los brazos son rígidos y cortos (la mano queda a ~0,32 del hombro) y la cabeza es enorme: las manos no llegan
a la cara ni se juntan al frente sin ayuda. Por eso las poses de reacción usan `brazo()` (apuntar el brazo en
el marco del torso) y '_pos' (adelantar o subir el hombro, como un encogimiento; en coordenadas del mundo).
"""
import math

from mathutils import Euler, Matrix, Quaternion, Vector

# Dirección de reposo hombro → mano (Él 35°, Ella 33° hacia afuera, un poco atrás)
_REPOSO_BRAZO = Vector((math.sin(math.radians(34)), 0.08, -math.cos(math.radians(34)))).normalized()
# Ejes locales de un hueso orientado a +Z vistos desde el mundo (columnas X, Y, Z)
_EJES = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))


def brazo(lado, afuera, adelante, arriba, giro=0.0):
    """Rotación (grados XYZ) que apunta el brazo en esa dirección, en el marco del torso.

    afuera = hacia su propio lado, adelante = hacia la cámara, arriba = al cielo (no hace falta normalizar).
    giro = vuelta del brazo sobre su eje (la manopla), en grados."""
    sx = -1 if lado == 'L' else 1
    reposo = Vector((sx * _REPOSO_BRAZO.x, _REPOSO_BRAZO.y, _REPOSO_BRAZO.z))
    meta = Vector((sx * afuera, -adelante, arriba)).normalized()
    q = reposo.rotation_difference(meta)
    if giro:
        q = Quaternion(meta, math.radians(sx * giro)) @ q
    local = _EJES.transposed() @ q.to_matrix() @ _EJES
    return tuple(round(math.degrees(a), 1) for a in local.to_euler('XYZ'))


def _mundo_a_local(v):
    """Desplazamiento en el mundo (x, y, z) → ubicación local de un hueso orientado a +Z."""
    return (v[0], v[2], -v[1])


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


# --------------------------------------------------------------------------
# Reacciones de los minijuegos (docs/sistemas/reacciones.md). «Derecho» = .L (la derecha del personaje).
# --------------------------------------------------------------------------

def espejo(pose):
    """La misma pose reflejada (izquierda ↔ derecha): se cambian los lados y se invierten Y y Z."""
    out = {}
    for k, v in pose.items():
        if k == '_pos':
            out[k] = {_otro_lado(b): (-d[0], d[1], d[2]) for b, d in v.items()}
        elif k == '_raiz_x':
            out[k] = -v
        elif k.startswith('_'):
            out[k] = v
        else:
            out[_otro_lado(k)] = (v[0], -v[1], -v[2])
    return out


def _otro_lado(b):
    return b[:-2] + ('.R' if b.endswith('.L') else '.L') if b.endswith(('.L', '.R')) else b


def _h(**lados):
    """'_pos' de los hombros: _h(L=(adentro, adelante, arriba), R=(...))."""
    return {'brazo.' + k: ((1 if k == 'L' else -1) * a, -f, u) for k, (a, f, u) in lados.items()}


def _reacciones():
    B = brazo
    R = {}
    # Brazos «arriba»: la cabeza es enorme y la mano choca con la quijada pasados ~20° sobre el hombro;
    # se abren a los lados y el torso o la cabeza se ladean al lado contrario para que se vean más altos.
    AB = lambda lado, adelante=0.15, arriba=0.33: B(lado, 0.92, adelante, arriba)

    # --- Presumir: se sacude el hombro contrario, pecho afuera y mentón arriba
    R['presumir_a'] = {
        'torso': (-8, 14, -4), 'cabeza': (-12, 8, -12),
        'brazo.L': B('L', -0.602, 0.796, 0.057), 'brazo.R': B('R', 0.6, -0.1, -0.8),
        '_pos': _h(L=(0.08, 0.12, 0.05)),
        'pelvis': (0, 0, -3), 'pierna.L': (0, 0, 3), 'pierna.R': (-4, 0, 6), 'pie.R': (-8, 0, 0),
    }
    R['presumir_b'] = {
        'torso': (-6, 4, 5), 'cabeza': (-12, 16, -16),
        'brazo.L': B('L', 1.0, 0.3, -0.45), 'brazo.R': B('R', 0.6, -0.1, -0.8),
        'pelvis': (0, 0, -3), 'pierna.L': (0, 0, 3), 'pierna.R': (-4, 0, 6), 'pie.R': (-8, 0, 0),
    }
    # --- Pulgares arriba (bombeo)
    R['pulgares_a'] = {
        'torso': (10, 0, 0), 'cabeza': (-10, 0, 4),
        'brazo.L': B('L', 0.3, 1.0, 0.05, giro=40), 'brazo.R': B('R', 0.3, 1.0, 0.05, giro=40),
        '_pos': _h(L=(0.03, 0.08, 0.02), R=(0.03, 0.08, 0.02)),
    }
    R['pulgares_b'] = {
        'torso': (2, 0, 0), 'cabeza': (-12, 0, 0),
        'brazo.L': B('L', 0.75, 0.8, 0.22, giro=40), 'brazo.R': B('R', 0.75, 0.8, 0.22, giro=40),
        '_pos': _h(L=(0.02, 0.06, 0.03), R=(0.02, 0.06, 0.03)), '_raiz_z': 0.03,
    }
    # --- Baile: brazos a un lado, cadera y torso al otro, un pie arriba
    R['baile_a'] = {
        'pelvis': (0, 0, 10), 'pierna.L': (0, 0, -10), 'pierna.R': (30, 0, 12), 'pie.R': (30, 0, 0),
        'torso': (0, -10, 8), 'cabeza': (-6, 12, 6),
        'brazo.R': B('R', 0.9, 0.2, 0.33), 'brazo.L': B('L', -0.2, 0.95, 0.05),
        '_pos': _h(L=(0.06, 0.12, 0.04)), '_raiz_x': -0.05,
    }
    R['baile_b'] = espejo(R['baile_a'])
    # --- Salto: anticipación y en el aire (el juego suma el salto; la pose solo despega un poco)
    R['preparar_salto'] = {
        'torso': (24, 0, 0), 'cabeza': (4, 0, 0),
        'brazo.L': B('L', 0.35, -0.8, -0.45), 'brazo.R': B('R', 0.35, -0.8, -0.45),
        'pierna.L': (-8, 0, -16), 'pierna.R': (-8, 0, 16), 'pie.L': (8, 0, 16), 'pie.R': (8, 0, -16),
        '_raiz_z': -0.02,
    }
    R['salto'] = {
        'torso': (-10, 0, 0), 'cabeza': (-16, 0, 0),
        'brazo.L': AB('L', 0.1, 0.38), 'brazo.R': AB('R', 0.1, 0.38),
        'pierna.L': (38, 0, -8), 'pierna.R': (28, 0, 8), 'pie.L': (30, 0, 0), 'pie.R': (25, 0, 0),
        '_raiz_z': 0.12,
    }
    # --- Puño al cielo y «¡sí!»
    R['puno_a'] = {
        'torso': (-6, -6, -13), 'cabeza': (-16, -4, -12),
        'brazo.L': B('L', 0.8, 0.2, 0.55), 'brazo.R': B('R', 0.579, -0.343, -0.74),
        'pelvis': (0, 0, -4), 'pierna.L': (0, 0, -3), 'pierna.R': (0, 0, 11),
    }
    R['puno_b'] = {
        'torso': (22, -12, 6), 'cabeza': (12, -6, 4),
        'brazo.L': B('L', 0.636, -0.334, -0.696), 'brazo.R': B('R', 0.55, 0.35, -0.6),
        'pierna.R': (-45, 0, 4), 'pie.R': (-15, 0, 0), 'pierna.L': (0, 0, -3),
    }
    R['musculo'] = {
        'torso': (-8, 0, 0), 'cabeza': (-12, 0, 0),
        'brazo.L': B('L', 1.0, 0.1, 0.25, giro=90), 'brazo.R': B('R', 1.0, 0.1, 0.25, giro=90),
        'pierna.L': (0, 0, -9), 'pierna.R': (0, 0, 9), 'pie.L': (0, 0, 9), 'pie.R': (0, 0, -9),
    }
    # Manos en la cintura: el brazo se abre y la mano se esconde tras la cadera (se lee como jarras de frente)
    JL, JR = B('L', 0.579, -0.343, -0.74), B('R', 0.579, -0.343, -0.74)
    R['jarras'] = {
        'torso': (-9, 0, 0), 'cabeza': (-14, 0, 0), 'brazo.L': JL, 'brazo.R': JR,
        'pierna.L': (0, 0, -8), 'pierna.R': (0, 0, 8), 'pie.L': (0, 0, 8), 'pie.R': (0, 0, -8),
    }
    # --- Perder
    R['puchero'] = {
        '_pos': _h(L=(0.02, 0, 0.08), R=(0.02, 0, 0.08)),
        'brazo.L': B('L', 0.5, 0.12, -0.86), 'brazo.R': B('R', 0.5, 0.12, -0.86),
        'torso': (6, 0, 0), 'cabeza': (14, -8, 12),
        'pierna.R': (14, 0, 4), 'pie.R': (28, 0, 0),
    }
    R['facepalm'] = {
        'torso': (14, 0, 6), 'cabeza': (24, 0, 22),
        'brazo.L': B('L', 0.714, 0.157, -0.683), 'brazo.R': B('R', 0.5, 0.15, -0.85),
    }
    R['rascarse'] = {
        'torso': (0, 0, 10), 'cabeza': (6, -12, 20),
        'brazo.L': B('L', 0.402, -0.841, -0.363), 'brazo.R': B('R', 0.5, 0, -0.85),
    }
    R['triste_b'] = {
        'torso': (18, 0, 0), 'cabeza': (18, 0, 4),
        'brazo.L': B('L', 0.45, 0.25, -0.85), 'brazo.R': B('R', 0.45, 0.25, -0.85),
        '_pos': _h(L=(0.02, 0.05, -0.03), R=(0.02, 0.05, -0.03)),
        'pierna.L': (-6, 0, 0), 'pierna.R': (-6, 0, 0), 'pie.L': (6, 0, 0), 'pie.R': (6, 0, 0),
    }
    R['encogerse'] = {
        '_pos': _h(L=(0, 0, 0.09), R=(0, 0, 0.09)),
        'brazo.L': B('L', 0.85, 0.5, -0.4, giro=-70), 'brazo.R': B('R', 0.85, 0.5, -0.4, giro=-70),
        'torso': (-4, 0, -4), 'cabeza': (0, -8, 10),
    }
    # Llanto: las manos no alcanzan los ojos; se aprietan contra los cachetes
    LL = B('L', 0.763, 0.497, 0.415)
    R['llorar_a'] = {
        'torso': (-4, 0, 0), 'cabeza': (-10, 0, 0),
        'brazo.L': LL, 'brazo.R': B('R', 0.763, 0.497, 0.415),
        '_pos': _h(L=(0, 0.12, 0), R=(0, 0.12, 0)),
    }
    R['llorar_b'] = {
        'torso': (-4, 0, 3), 'cabeza': (-4, 0, 12),
        'brazo.L': B('L', 0.857, 0.503, -0.117), 'brazo.R': B('R', 0.55, 0.688, 0.474),
        '_pos': _h(L=(0, 0.12, 0), R=(0, 0.12, 0.05)),
    }
    R['rodillas_a'] = {
        'pierna.L': (80, 0, -6), 'pierna.R': (80, 0, 6), 'pie.L': (-10, 0, 0), 'pie.R': (-10, 0, 0), '_raiz_z': -0.14,
        'torso': (-14, 0, 0), 'cabeza': (-22, 0, 0),
        'brazo.L': AB('L', 0.25, 0.35), 'brazo.R': AB('R', 0.25, 0.35),
    }
    R['rodillas_b'] = {
        'pierna.L': (80, 0, -6), 'pierna.R': (80, 0, 6), 'pie.L': (-10, 0, 0), 'pie.R': (-10, 0, 0), '_raiz_z': -0.14,
        'torso': (28, 0, 0), 'cabeza': (8, 0, 6),
        'brazo.L': B('L', 0.5, 0.6, -0.6), 'brazo.R': B('R', 0.5, 0.6, -0.6),
    }
    R['bandera'] = {
        'torso': (0, 0, -12), 'cabeza': (4, 0, -8),
        'brazo.L': B('L', 0.8, 0.2, 0.5), 'brazo.R': B('R', -0.185, 0.944, -0.274),
        '_pos': _h(R=(0.08, 0.12, 0)),
    }
    R['desmayo'] = {
        'torso': (-16, 0, 8), 'cabeza': (-16, 0, 20),
        'brazo.L': B('L', 0.926, 0.132, -0.354), 'brazo.R': AB('R', 0.3, 0.25),
        '_pos': _h(L=(0, 0.12, 0)),
        'pierna.R': (-15, 0, 6), 'pie.R': (-15, 0, 0),
    }
    R['tirado'] = {
        'brazo.L': AB('L', 0.0, 0.3), 'brazo.R': AB('R', 0.0, 0.3),
        'pierna.L': (0, 0, -28), 'pierna.R': (0, 0, 28), 'cabeza': (-6, 0, 0),
    }
    # --- Enojo
    R['enojo_a'] = {
        'torso': (14, 0, 0), 'cabeza': (6, 0, 0),
        'brazo.L': B('L', 0.75, -0.1, -0.7), 'brazo.R': B('R', 0.75, -0.1, -0.7),
        '_pos': _h(L=(0, 0, 0.06), R=(0, 0, 0.06)),
        'pierna.L': (-40, 0, -4), 'pie.L': (-10, 0, 0),
    }
    R['enojo_b'] = espejo(R['enojo_a'])
    # Brazos cruzados: rígidos, se cruzan los antebrazos al frente del pecho (uno delante del otro)
    R['brazos_cruzados'] = {
        'torso': (-6, -8, 0), 'cabeza': (-12, 28, 0),
        'brazo.L': B('L', -0.502, 0.851, 0.156), 'brazo.R': B('R', -0.439, 0.899, -0.006),
        '_pos': _h(L=(0.08, 0.12, 0), R=(0.08, 0.12, 0)),
    }
    R['boca_abierta'] = {
        'torso': (-10, 0, 0), 'cabeza': (8, 0, 0),
        'brazo.L': B('L', 0.756, 0.641, 0.13), 'brazo.R': B('R', 0.756, 0.641, 0.13),
        '_pos': _h(L=(0, 0.12, 0), R=(0, 0.12, 0)),
    }
    # --- Celebrar al otro
    R['aplauso_a'] = {
        'torso': (4, 0, 0), 'cabeza': (-8, 0, 0),
        'brazo.L': B('L', 0.45, 0.9, 0.15), 'brazo.R': B('R', 0.45, 0.9, 0.15),
        '_pos': _h(L=(0.04, 0.1, 0), R=(0.04, 0.1, 0)),
    }
    R['aplauso_b'] = {
        'torso': (4, 0, 0), 'cabeza': (-8, 0, 0),
        'brazo.L': B('L', -0.34, 0.936, 0.095), 'brazo.R': B('R', -0.34, 0.936, 0.095),
        '_pos': _h(L=(0.08, 0.12, 0), R=(0.08, 0.12, 0)),
    }
    BARRIGA_R = B('R', -0.377, 0.914, -0.148)
    R['senalar_a'] = {
        'torso': (-14, 0, 0), 'cabeza': (-16, -6, 0),
        'brazo.L': B('L', 0.9, 0.45, 0.15), 'brazo.R': BARRIGA_R, '_pos': _h(R=(0, 0.12, 0)),
    }
    R['senalar_b'] = {
        'torso': (12, 0, 0), 'cabeza': (8, -6, 0),
        'brazo.L': B('L', 0.9, 0.45, 0.15), 'brazo.R': BARRIGA_R, '_pos': _h(R=(0, 0.12, 0)),
    }
    R['risita_a'] = {
        'torso': (4, 0, 6), 'cabeza': (14, -6, 16),
        'brazo.L': B('L', 0.056, 0.827, -0.559), 'brazo.R': B('R', 0.45, 0.1, -0.9),
        '_pos': _h(L=(0.04, 0.12, 0), R=(0, 0, 0.07)),
    }
    R['risita_b'] = {
        'torso': (4, 0, -4), 'cabeza': (14, 6, -12),
        'brazo.L': B('L', -0.302, 0.944, -0.136), 'brazo.R': B('R', 0.45, 0.1, -0.9),
        '_pos': _h(L=(0.08, 0.12, 0), R=(0, 0, 0.07)),
    }
    R['beso_volado_a'] = {
        'torso': (4, 0, 2), 'cabeza': (12, 0, 10),
        'brazo.L': B('L', 0.043, 0.895, -0.444), 'brazo.R': B('R', 0.5, 0, -0.85),
        '_pos': _h(L=(0.08, 0.12, 0)),
    }
    R['beso_volado_b'] = {
        'torso': (6, 8, 0), 'cabeza': (-8, 0, -6),
        'brazo.L': B('L', 0.45, 0.9, 0.35), 'brazo.R': B('R', 0.6, -0.2, -0.75),
        'pierna.R': (20, 0, 0), 'pie.R': (25, 0, 0),
    }
    R['pensando_b'] = {
        'torso': (0, 0, -4), 'cabeza': (6, 0, -10),
        'brazo.L': B('L', -0.293, 0.955, 0.051), 'brazo.R': B('R', -0.185, 0.944, -0.274),
        '_pos': _h(L=(0.08, 0.12, 0), R=(0.08, 0.12, 0)),
    }
    # --- Esperar el turno
    R['reloj'] = {
        'torso': (6, 6, 0), 'cabeza': (10, 12, 0),
        'brazo.R': B('R', 0.15, 1, -0.05), 'brazo.L': B('L', 0.5, 0, -0.85),
        '_pos': _h(R=(0.04, 0.1, 0.02)),
    }
    R['impaciente_a'] = {
        'torso': (-4, 0, -3), 'cabeza': (-6, 0, 8), 'brazo.L': JL, 'brazo.R': JR,
        'pierna.L': (-10, 0, -4), 'pie.L': (-30, 0, 0), 'pierna.R': (0, 0, 3),
    }
    R['impaciente_b'] = dict(R['impaciente_a'], **{'pie.L': (0, 0, 0), 'pierna.L': (-6, 0, -4)})
    R['bostezo'] = {
        'torso': (-14, 0, 0), 'cabeza': (-24, 0, 0),
        'brazo.L': AB('L', 0.1, 0.28), 'brazo.R': AB('R', 0.1, 0.28), '_raiz_z': 0.02,
    }
    # --- Dados y fichas (manos juntas al frente: hombros adelantados)
    JUNTAS = _h(L=(0.08, 0.12, 0), R=(0.08, 0.12, 0))
    R['agitar_a'] = {
        'torso': (2, 0, 0), 'cabeza': (6, 0, 0),
        'brazo.L': B('L', -0.351, 0.932, -0.092), 'brazo.R': B('R', -0.351, 0.932, -0.092), '_pos': JUNTAS,
    }
    R['agitar_b'] = {
        'torso': (6, 0, 0), 'cabeza': (8, 0, 0),
        'brazo.L': B('L', -0.302, 0.944, -0.136), 'brazo.R': B('R', -0.302, 0.944, -0.136), '_pos': JUNTAS,
    }
    R['soplar'] = {
        'torso': (6, 0, 0), 'cabeza': (18, 0, 0),
        'brazo.L': B('L', -0.249, 0.897, -0.366), 'brazo.R': B('R', -0.249, 0.897, -0.366),
        '_pos': _h(L=(0, 0.12, 0), R=(0, 0.12, 0)),
    }
    R['lanzar'] = {
        'torso': (16, 8, 0), 'cabeza': (6, 0, 0),
        'brazo.L': B('L', 0.1, 1, -0.35), 'brazo.R': B('R', 0.4, -0.6, -0.6),
        '_pos': _h(L=(0.03, 0.12, 0)),
        'pierna.R': (20, 0, 0), 'pie.R': (20, 0, 0),
    }
    R['suplicar'] = {
        'torso': (-4, 0, 0), 'cabeza': (-12, 0, 0),
        'brazo.L': B('L', -0.239, 0.921, 0.308), 'brazo.R': B('R', -0.239, 0.921, 0.308), '_pos': JUNTAS,
    }
    R['frotar_manos_a'] = {
        'torso': (8, 0, 0), 'cabeza': (14, 0, 0),
        'brazo.L': B('L', -0.15, 0.952, -0.268), 'brazo.R': B('R', -0.15, 0.952, -0.268), '_pos': JUNTAS,
    }
    R['frotar_manos_b'] = {
        'torso': (8, 0, 0), 'cabeza': (14, 0, -4),
        'brazo.L': B('L', -0.377, 0.912, -0.163), 'brazo.R': B('R', -0.074, 0.925, -0.372),
        '_pos': _h(L=(0, 0.12, 0), R=(0.08, 0.12, 0)),
    }
    R['contar_a'] = {
        'torso': (12, 0, 0), 'cabeza': (22, 0, 0),
        'brazo.L': B('L', 0.25, 0.85, -0.55), 'brazo.R': B('R', 0.5, 0.05, -0.85),
        '_pos': _h(L=(0.02, 0.1, 0)),
    }
    R['contar_b'] = {
        'torso': (12, 0, 4), 'cabeza': (20, -8, 4),
        'brazo.L': B('L', 0.6, 0.75, -0.5), 'brazo.R': B('R', 0.5, 0.05, -0.85),
        '_pos': _h(L=(0.02, 0.1, 0)),
    }
    R['inclinado'] = {
        'torso': (22, 0, 0), 'cabeza': (12, 0, 0),
        'brazo.L': B('L', 0.5, 0.55, -0.65), 'brazo.R': B('R', 0.5, 0.55, -0.65),
        '_pos': _h(L=(0, 0.05, 0), R=(0, 0.05, 0)),
    }
    # --- Ganar la partida
    # Trofeo: no alcanza a subirlo sobre la cabeza; lo alza con la mano derecha y abre la otra
    R['trofeo'] = {
        'torso': (-8, 0, -12), 'cabeza': (-14, 0, -10),
        'brazo.L': B('L', 0.8, 0.3, 0.5), 'brazo.R': B('R', 0.92, 0.2, 0.0),
        'pelvis': (0, 0, -4), 'pierna.L': (0, 0, -3), 'pierna.R': (0, 0, 11),
    }
    R['corona'] = {
        'torso': (-8, 0, 0), 'cabeza': (-6, 0, 0),
        'brazo.L': B('L', 0.937, 0.04, 0.348), 'brazo.R': B('R', 0.937, 0.04, 0.348),
    }
    R['reverencia'] = {
        'torso': (35, 0, 0), 'cabeza': (12, 0, 0),
        'brazo.L': B('L', -0.201, 0.954, -0.224), 'brazo.R': B('R', 0.6, -0.7, -0.2),
        '_pos': _h(L=(0.08, 0.12, 0)),
        'pierna.R': (18, 0, 0), 'pie.R': (15, 0, 0), '_raiz_y': 0.06,
    }
    R['chocar_cinco'] = {
        'torso': (0, 0, 12), 'cabeza': (-8, -10, -6),
        'brazo.L': B('L', 0.85, 0.25, 0.33), 'brazo.R': B('R', 0.5, 0, -0.85),
        'pierna.L': (0, 0, -8),
    }
    R['senalar_arriba'] = {
        'torso': (-4, 0, -13), 'cabeza': (-14, 0, -12),
        'brazo.L': B('L', 0.75, 0.15, 0.6), 'brazo.R': B('R', 0.3, 0.95, 0.1),
        '_pos': _h(R=(0.03, 0.1, 0)),
        'pelvis': (0, 0, -4), 'pierna.L': (0, 0, -3), 'pierna.R': (0, 0, 11),
    }
    return R


POSES.update(_reacciones())


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
    if '_raiz_x' in pose or '_raiz_y' in pose:
        rig.pose.bones['raiz'].location = _mundo_a_local((pose.get('_raiz_x', 0), pose.get('_raiz_y', 0), pose.get('_raiz_z', 0)))
    # Hombros (o cualquier hueso) corridos: encoger, adelantar
    for bone, d in pose.get('_pos', {}).items():
        pb = rig.pose.bones.get(bone)
        if pb is not None:
            pb.location = _mundo_a_local(d)
