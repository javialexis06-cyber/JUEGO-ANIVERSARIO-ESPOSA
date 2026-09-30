"""Nuestro Hogar: conceptos de decoración para los cuartos propios (gamer, griego, egipcio, espacial…).

Mismas reglas que regalos.py y deco_nueva.py: todo en el origen con el frente hacia -y; lo de piso, mesa y peluche
con la base en z=0 y los cuadros centrados en z=0 con el respaldo en y=0 (se cuelgan en la pared).
Los materiales con «tinte» en el nombre se pueden pintar de otro color en el juego (las luces neón, los LED…).
Cada pieza se exporta a deco_<clave>.glb con su ícono (exportar_tienda_casa.py).
"""
import math

import numpy as np

import clay
from comidas import transparente
from deco_nueva import letras, m, matera, peluche, plano
from regalos import _marco, corazon_plano, laca, luz, madera, papel, tela
from tiendas import _mat


def metal(nombre, color='#C9CCD2', rough=0.3):
    return _mat(f'Deco | metal {nombre}', color, rough=rough, metallic=1.0)


def marmol(nombre='mármol', color='#F4F1EA'):
    return laca(nombre, color, 0.45)


def oro(nombre='oro'):
    return _mat(f'Deco | {nombre}', '#E5B85C', rough=0.28, metallic=1.0)


def aro(coll, nombre, c, r, eje, tubo, mat, n=24):
    """Aro (toro) de radio r centrado en c, perpendicular al eje 'x', 'y', 'z' o a un vector cualquiera."""
    nrm = np.array({'x': (1, 0, 0), 'y': (0, 1, 0), 'z': (0, 0, 1)}[eje] if isinstance(eje, str) else eje, dtype=float)
    nrm /= np.linalg.norm(nrm)
    ref = np.array([1.0, 0, 0]) if abs(nrm[0]) < 0.9 else np.array([0, 0, 1.0])
    u = np.cross(nrm, ref)
    u /= np.linalg.norm(u)
    v = np.cross(nrm, u)
    pts = [tuple(np.array(c) + r * (math.cos(a) * u + math.sin(a) * v)) for a in np.linspace(0, 2 * math.pi, n, endpoint=False)]
    return clay.sweep(nombre, pts, tubo, (1, 1), coll, mat, segments=8, samples=3, closed=True)


def girar_y(ang):
    """Para `shaper` de clay.blob: gira la pieza sobre su propio centro alrededor del eje y (piezas de pared)."""
    c, s = math.cos(ang), math.sin(ang)
    return lambda v: np.column_stack([v[:, 0] * c + v[:, 2] * s, v[:, 1], -v[:, 0] * s + v[:, 2] * c])


def prisma(coll, nombre, pts2d, z0, z1, mat, y=0.0, eje='z'):
    """Prisma con base poligonal: en el piso (eje z, pts en x-y) o en la pared (eje y, pts en x-z, de y a y-grosor)."""
    n = len(pts2d)
    if eje == 'z':
        verts = [(x, yy, z0) for x, yy in pts2d] + [(x, yy, z1) for x, yy in pts2d]
    else:
        verts = [(x, y - z0, zz) for x, zz in pts2d] + [(x, y - z1, zz) for x, zz in pts2d]
    caras = [tuple(range(n))[::-1], tuple(range(n, 2 * n))] + [(k, (k + 1) % n, n + (k + 1) % n, n + k) for k in range(n)]
    o = clay.make_mesh_object(nombre, verts, caras, coll, smooth=False, material=mat)
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    return o


def poligono(n, r, rot=0.0, cx=0.0, cy=0.0):
    return [(cx + r * math.cos(rot + 2 * math.pi * k / n), cy + r * math.sin(rot + 2 * math.pi * k / n)) for k in range(n)]


def trazo(coll, nombre, pts, radio, mat, cerrado=False):
    return clay.sweep(nombre, pts, radio, (1, 1), coll, mat, segments=6, samples=3 if len(pts) < 5 else 4, closed=cerrado, caps=('round', 'round'))


# ---------------------------------------------------------------------------
# 1. Gamer (luces que cambian de color)
# ---------------------------------------------------------------------------

def deco_neon_gg(coll):
    """Letrero neón «GG» sobre acrílico oscuro."""
    clay.rbox('acrílico neón', (0, -0.012, 0), (0.36, 0.012, 0.19), coll, transparente('acrílico', '#1E2230', 0.55), p=6, n=4)
    neon = luz('tinte neón gg', '#35F0FF', 5.0)
    y = -0.034
    for cx in (-0.14, 0.14):
        pts = [(cx + 0.1 * math.cos(a), y, 0.1 * math.sin(a)) for a in np.linspace(math.radians(40), math.radians(320), 12)]
        pts += [(cx + 0.1, y, -0.02), (cx + 0.1, y, -0.0), (cx + 0.03, y, 0.0)]
        trazo(coll, f'neón G {cx}', pts, 0.013, neon)
    for sx in (-1, 1):
        clay.blob(f'tornillo {sx}', (sx * 0.32, -0.026, 0.15), (0.012, 0.006, 0.012), coll, metal('tornillo'), n=4)


def deco_paneles_hex(coll):
    """Paneles hexagonales de luz (como panal) para la pared."""
    borde = laca('panel hex', '#2A2D3A', 0.4)
    brillo = luz('tinte panel', '#B45CFF', 1.3)
    r = 0.105
    dx, dz = r * math.sqrt(3), r * 1.5
    for k, (i, j) in enumerate(((0, 0), (1, 0), (0.5, 1), (-0.5, 1), (1.5, 1), (0.5, -1))):
        cx, cz = i * dx - 0.08, j * dz
        prisma(coll, f'hex {k}', poligono(6, r * 0.96, math.pi / 6, cx, cz), 0.0, 0.03, borde, eje='y')
        prisma(coll, f'hex luz {k}', poligono(6, r * 0.8, math.pi / 6, cx, cz), 0.03, 0.036, brillo, eje='y')


def deco_poster_control(coll):
    """Afiche de un control de videojuego sobre fondo morado."""
    hx, hz = _marco(coll, 0.5, 0.64, '#2A2D3A', '#6C4AB6')
    y = -0.028
    cuerpo = laca('control afiche', '#F2EBDD', 0.4)
    clay.blob('control', (0, y, 0.02), (0.17, 0.012, 0.08), coll, cuerpo, n=6)
    for sx in (-1, 1):
        clay.blob(f'agarre {sx}', (sx * 0.12, y, -0.05), (0.06, 0.012, 0.07), coll, cuerpo, n=5)
    cruz = laca('cruceta', '#2A2D3A', 0.4)
    clay.rbox('cruceta h', (-0.09, y - 0.014, 0.03), (0.035, 0.004, 0.011), coll, cruz, p=6, n=3)
    clay.rbox('cruceta v', (-0.09, y - 0.014, 0.03), (0.011, 0.004, 0.035), coll, cruz, p=6, n=3)
    for k, (x, z, col) in enumerate(((0.09, 0.06, '#E4566B'), (0.12, 0.03, '#3B6FB6'), (0.06, 0.03, '#F7C948'), (0.09, 0.0, '#5FA85A'))):
        clay.blob(f'botón {k}', (x, y - 0.014, z), (0.014, 0.006, 0.014), coll, laca(f'botón {col}', col, 0.3), n=4)
    letras(coll, 'YO', -0.08, y - 0.004, hz - 0.1, 0.07, laca('letras afiche', '#F7C948', 0.4), radio=0.009)


def deco_audifonos(coll):
    """Audífonos gamer en su soporte, con aros de luz."""
    base = laca('soporte audífonos', '#2A2D3A', 0.35)
    clay.lathe('base soporte', [(0.0, 0.0), (0.08, 0.0), (0.085, 0.015), (0.0, 0.02)], coll, base, segments=24)
    clay.sweep('palo soporte', [(0, 0, 0.02), (0, 0, 0.26)], 0.012, (1, 1), coll, base, segments=8, samples=2)
    clay.sweep('gancho', [(-0.06, 0, 0.26), (0, 0, 0.29), (0.06, 0, 0.26)], 0.014, (1, 0.6), coll, base, segments=8, samples=3)
    diadema = laca('diadema', '#1E2230', 0.35)
    clay.sweep('diadema', [(-0.09, 0, 0.15), (-0.08, 0, 0.26), (0, 0, 0.31), (0.08, 0, 0.26), (0.09, 0, 0.15)], 0.018, (1, 0.5), coll, diadema,
               segments=8, samples=4)
    for sx in (-1, 1):
        clay.blob(f'orejera {sx}', (sx * 0.1, 0, 0.12), (0.03, 0.06, 0.06), coll, tela('orejera', '#2A2D3A'), n=6)
        aro(coll, f'aro luz {sx}', (sx * 0.13, 0, 0.12), 0.045, 'x', 0.007, luz('tinte audífonos', '#35F0FF', 4.0))


def deco_consola(coll):
    """Consola portátil de dos controles, parada en su base."""
    cuerpo = laca('pantalla consola', '#1E2230', 0.3)
    clay.rbox('pantalla consola', (0, 0.01, 0.12), (0.12, 0.012, 0.07), coll, cuerpo, p=6, n=4)
    clay.rbox('vidrio', (0, -0.003, 0.12), (0.1, 0.002, 0.055), coll, luz('pantalla juego', '#6CE2A8', 1.2), p=8, n=3, subsurf=0)
    for sx, col in ((-1, '#3BB3E4'), (1, '#E4566B')):
        clay.rbox(f'control {sx}', (sx * 0.145, 0.01, 0.12), (0.025, 0.014, 0.07), coll, laca(f'joycon {col}', col, 0.35), p=5, n=4)
        clay.blob(f'palanca {sx}', (sx * 0.145, -0.008, 0.15 if sx < 0 else 0.1), (0.012, 0.008, 0.012), coll, laca('palanca', '#2A2D3A', 0.4), n=4)
    clay.rbox('base consola', (0, 0.02, 0.025), (0.13, 0.04, 0.025), coll, laca('base consola', '#2A2D3A', 0.4), p=5, n=4)


def deco_slime(coll):
    """Peluche de slime verde con carita (y una gotica)."""
    verde = tela('slime', '#7BD66B')
    clay.blob('slime', (0, 0, 0.13), (0.17, 0.15, 0.13), coll, verde, n=10, p=2.2,
              shaper=lambda v: np.column_stack([v[:, 0] * (1 + 0.15 * np.clip(-v[:, 2] / 0.13, 0, 1)), v[:, 1], np.maximum(v[:, 2], -0.12)]))
    clay.blob('brillo slime', (-0.06, -0.08, 0.2), (0.035, 0.02, 0.025), coll, tela('brillo slime', '#C9F2B8'), n=4)
    for sx in (-1, 1):
        clay.blob(f'ojo slime {sx}', (sx * 0.05, -0.135, 0.15), (0.022, 0.01, 0.028), coll, laca('ojo slime', '#1E2230', 0.2), n=4)
    trazo(coll, 'boca slime', [(-0.025, -0.145, 0.1), (0, -0.15, 0.09), (0.025, -0.145, 0.1)], 0.005, laca('ojo slime', '#1E2230', 0.2))
    clay.blob('gota', (0.13, -0.08, 0.03), (0.03, 0.03, 0.02), coll, verde, n=5)


def deco_torre_pc(coll):
    """Torre de computador con ventilador de luces (el costado de vidrio)."""
    caja = laca('torre pc', '#1E2230', 0.35)
    clay.rbox('torre', (0, 0, 0.26), (0.11, 0.24, 0.24), coll, caja, p=8, n=4)
    clay.rbox('vidrio torre', (-0.112, 0, 0.26), (0.004, 0.2, 0.2), coll, transparente('vidrio torre', '#9FB4D6', 0.35), p=8, n=3, subsurf=0)
    brillo = luz('tinte ventiladores', '#FF4FA3', 4.0)
    for k, z in enumerate((0.38, 0.24, 0.1)):
        aro(coll, f'ventilador {k}', (0.0, -0.245, z), 0.055, 'y', 0.008, brillo)
        clay.blob(f'aspas {k}', (0.0, -0.243, z), (0.04, 0.006, 0.04), coll, laca('aspas', '#2A2D3A', 0.5), n=5)
    clay.rbox('franja luz', (-0.113, 0.0, 0.47), (0.004, 0.2, 0.006), coll, brillo, p=8, n=3, subsurf=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.blob(f'pata torre {sx}{sy}', (sx * 0.08, sy * 0.2, 0.012), (0.02, 0.02, 0.012), coll, laca('pata', '#2A2D3A', 0.5), n=4)


def deco_lampara_led(coll):
    """Barra de luz LED de pie (esquinera)."""
    base = laca('base led', '#2A2D3A', 0.35)
    clay.lathe('base barra', [(0.0, 0.0), (0.13, 0.0), (0.13, 0.02), (0.02, 0.035), (0.0, 0.035)], coll, base, segments=24)
    clay.rbox('barra led', (0, 0, 0.72), (0.05, 0.05, 0.68), coll, luz('tinte barra', '#8E3BFF', 0.9), p=4, n=4)
    clay.rbox('carcasa led', (0, 0.03, 0.72), (0.055, 0.03, 0.69), coll, base, p=4, n=4)
    clay.rbox('tapa led', (0, 0, 1.41), (0.03, 0.03, 0.012), coll, base, p=6, n=3)


# ---------------------------------------------------------------------------
# 2. Griego
# ---------------------------------------------------------------------------

def deco_meandro(coll):
    """Placa de mármol con un templo griego y la greca alrededor."""
    clay.rbox('placa', (0, -0.012, 0), (0.34, 0.012, 0.24), coll, marmol('placa mármol'), p=8, n=4)
    y = -0.026
    greca = laca('greca', '#3B6FB6', 0.4)
    for sz in (-1, 1):
        pts = []
        x = -0.3
        while x < 0.29:
            pts += [(x, y, sz * 0.2), (x, y, sz * 0.2 - sz * 0.03), (x + 0.03, y, sz * 0.2 - sz * 0.03), (x + 0.03, y, sz * 0.2 - sz * 0.015),
                    (x + 0.015, y, sz * 0.2 - sz * 0.015), (x + 0.015, y, sz * 0.2), (x + 0.05, y, sz * 0.2)]
            x += 0.05
        clay.sweep(f'greca {sz}', pts, 0.004, (1, 1), coll, greca, segments=4, samples=1, caps=('round', 'round'))
    blanco = marmol('templo', '#FFFFFF')
    clay.rbox('escalón', (0, y, -0.1), (0.18, 0.008, 0.012), coll, blanco, p=6, n=3)
    for k in range(5):
        clay.rbox(f'columna templo {k}', (-0.14 + k * 0.07, y, -0.02), (0.012, 0.008, 0.07), coll, blanco, p=6, n=3)
    prisma(coll, 'frontón', [(-0.18, 0.055), (0.18, 0.055), (0.0, 0.12)], 0.0, 0.012, blanco, y=y + 0.004, eje='y')


def deco_laurel(coll):
    """Corona de laurel dorada colgada en la pared, con cinta azul."""
    hoja_oro = oro('laurel oro')
    for k in range(20):
        a = math.radians(-65 + k * 16)
        for d, off in ((0.2, 0.0), (0.165, 0.12)):
            b = a + off
            clay.blob(f'hoja laurel {k} {d}', (d * math.cos(b), -0.015, d * math.sin(b)), (0.034, 0.008, 0.014), coll, hoja_oro, n=4,
                      shaper=girar_y(-(b + math.pi / 2) + 0.35))
    clay.sweep('rama laurel', [(0.18 * math.cos(a), -0.012, 0.18 * math.sin(a)) for a in np.linspace(math.radians(-80), math.radians(260), 18)], 0.005,
               (1, 1), coll, hoja_oro, segments=5, samples=2)
    cinta = tela('cinta laurel', '#3B6FB6')
    clay.blob('moño', (0, -0.02, -0.18), (0.04, 0.012, 0.025), coll, cinta, n=5)
    for sx in (-1, 1):
        clay.sweep(f'cinta {sx}', [(0, -0.02, -0.18), (sx * 0.04, -0.02, -0.26), (sx * 0.06, -0.02, -0.3)], 0.012, (1, 0.25), coll, cinta, segments=6,
                   samples=3)


def anfora(coll, nombre, h, color='#C8693A', banda='#2B2422'):
    s = h / 0.4
    perfil = [(0.0, 0.0), (0.05, 0.0), (0.06, 0.02), (0.13, 0.12), (0.14, 0.2), (0.1, 0.3), (0.05, 0.34), (0.045, 0.37), (0.07, 0.4), (0.05, 0.4)]
    clay.lathe(nombre, [(r * s, z * s) for r, z in perfil], coll, laca(f'{nombre} barro', color, 0.55), segments=28, cap_top=False)
    clay.lathe(f'{nombre} banda', [(0.132 * s + 0.002, 0.13 * s), (0.141 * s + 0.002, 0.17 * s), (0.14 * s + 0.002, 0.21 * s)], coll,
               laca(f'{nombre} banda', banda, 0.5), segments=28, cap_bottom=False, cap_top=False)
    for sx in (-1, 1):
        clay.sweep(f'{nombre} asa {sx}', [(sx * 0.05 * s, 0, 0.35 * s), (sx * 0.12 * s, 0, 0.36 * s), (sx * 0.12 * s, 0, 0.28 * s), (sx * 0.1 * s, 0, 0.25 * s)],
                   0.01 * s, (1, 1), coll, laca(f'{nombre} barro', color, 0.55), segments=6, samples=3)


def deco_anfora(coll):
    anfora(coll, 'ánfora', 0.32)


def deco_anfora_grande(coll):
    anfora(coll, 'ánfora grande', 0.75)
    hoja = laca('olivo', '#8FA66A', 0.6)
    for k in range(5):
        a = -0.5 + k * 0.25
        base = (0.0, 0.0, 0.72)
        punta = (0.12 * math.sin(a) * 2, 0.0, 0.72 + 0.28 - abs(a) * 0.2)
        clay.sweep(f'rama olivo {k}', [base, punta], 0.006, (1, 1), coll, madera('rama', '#8A6A4A'), segments=5, samples=2)
        for j in range(4):
            t = 0.3 + j * 0.2
            p = (base[0] + (punta[0] - base[0]) * t, 0.0, base[2] + (punta[2] - base[2]) * t)
            clay.blob(f'hoja olivo {k}{j}', (p[0] + 0.02 * (1 - 2 * (j % 2)), -0.01, p[2]), (0.022, 0.008, 0.01), coll, hoja, n=4)


def deco_busto(coll):
    """Busto griego de mármol sobre su pedestal, con laurel."""
    blanco = marmol('busto')
    clay.rbox('pedestal busto', (0, 0, 0.04), (0.09, 0.08, 0.04), coll, marmol('pedestal busto', '#E7E1D6'), p=6, n=4)
    clay.blob('hombros', (0, 0, 0.14), (0.12, 0.07, 0.07), coll, blanco, n=8)
    clay.lathe('cuello busto', [(0.035, 0.18), (0.035, 0.24)], coll, blanco, segments=16)
    clay.blob('cabeza busto', (0, -0.005, 0.29), (0.06, 0.065, 0.075), coll, blanco, n=8)
    clay.blob('nariz busto', (0, -0.068, 0.29), (0.012, 0.012, 0.02), coll, blanco, n=4)
    rng = np.random.default_rng(5)
    for k in range(14):
        a = rng.uniform(-0.3, math.pi + 0.3)
        clay.blob(f'rizo {k}', (0.06 * math.cos(a), 0.02 + 0.02 * math.sin(a) * 0.6, 0.31 + 0.045 * math.sin(a)), (0.02, 0.02, 0.02), coll, blanco, n=4)
    for k in range(6):
        a = math.radians(200 + k * 28)
        clay.blob(f'laurel busto {k}', (0.065 * math.cos(a), 0.065 * math.sin(a) * 0.9, 0.33), (0.018, 0.008, 0.01), coll, oro('laurel busto'), n=4)


def deco_pegaso(coll):
    def alas(c, s, p, cl, o):
        for sx in (-1, 1):
            for k in range(3):
                clay.blob(f'pluma ala {sx}{k}', (sx * (0.13 + k * 0.03) * s, 0.05 * s, (0.22 + k * 0.04) * s), (0.03 * s, 0.015 * s, (0.07 - k * 0.012) * s), c,
                          tela('ala pegaso', '#FFF8EC'), n=5)
        for k in range(4):
            clay.blob(f'crin dorada {k}', (0.0, (0.04 - k * 0.012) * s, (0.4 - k * 0.04) * s), (0.03 * s, 0.03 * s, 0.03 * s), c, tela('crin dorada', '#F7C948'), n=5)
    peluche(coll, 'pegaso', '#FFFFFF', '#F2EBDD', 'gato', extras=alas)


def deco_columna(coll):
    """Columna jónica de mármol con una matera de hiedra encima."""
    blanco = marmol('columna')
    clay.rbox('basa', (0, 0, 0.04), (0.17, 0.17, 0.04), coll, blanco, p=6, n=4)
    clay.lathe('toro', [(0.12, 0.08), (0.15, 0.1), (0.12, 0.12)], coll, blanco, segments=28)
    clay.lathe('fuste', [(0.115, 0.12), (0.1, 0.84)], coll, blanco, segments=28)
    for k in range(12):
        a = 2 * math.pi * k / 12
        clay.sweep(f'estría {k}', [(0.113 * math.cos(a), 0.113 * math.sin(a), 0.16), (0.1 * math.cos(a), 0.1 * math.sin(a), 0.8)], 0.008, (1, 1), coll,
                   marmol('estría', '#E7E1D6'), segments=5, samples=2)
    clay.rbox('ábaco', (0, 0, 0.9), (0.16, 0.16, 0.03), coll, blanco, p=6, n=4)
    for sx in (-1, 1):
        aro(coll, f'voluta {sx}', (sx * 0.13, -0.1, 0.86), 0.035, 'y', 0.014, blanco, n=16)
        aro(coll, f'voluta atrás {sx}', (sx * 0.13, 0.1, 0.86), 0.035, 'y', 0.014, blanco, n=16)
    h = 0.93
    clay.lathe('matera columna', [(0.0, h), (0.07, h), (0.09, h + 0.1), (0.0, h + 0.1)], coll, laca('matera columna', '#C8693A', 0.5), segments=20)
    hoja = laca('hiedra', '#5FA85A', 0.6)
    for k in range(5):
        a = 2 * math.pi * k / 5
        pts = [(0.05 * math.cos(a), 0.05 * math.sin(a), h + 0.1), (0.13 * math.cos(a), 0.13 * math.sin(a), h + 0.05), (0.16 * math.cos(a), 0.16 * math.sin(a), h - 0.12)]
        clay.sweep(f'hiedra {k}', pts, 0.006, (1, 1), coll, hoja, segments=5, samples=3)
        for j in range(3):
            q = pts[j]
            clay.blob(f'hoja hiedra {k}{j}', (q[0], q[1], q[2] - 0.01), (0.025, 0.025, 0.01), coll, hoja, n=4)


# ---------------------------------------------------------------------------
# 3. Egipcio
# ---------------------------------------------------------------------------

def deco_papiro(coll):
    """Papiro con jeroglíficos, enrollado arriba y abajo."""
    papiro = papel('papiro', '#E8CF9A')
    clay.rbox('hoja papiro', (0, -0.006, 0), (0.22, 0.006, 0.32), coll, papiro, p=10, n=4, subsurf=1)
    for sz in (-1, 1):
        clay.sweep(f'rollo {sz}', [(-0.24, -0.012, sz * 0.33), (0.24, -0.012, sz * 0.33)], 0.02, (1, 1), coll, papel('rollo papiro', '#D8B97C'), segments=10,
                   samples=2, caps=('flat', 'flat'))
    tinta = laca('jeroglífico', '#3A2A2A', 0.6)
    azul = laca('jeroglífico azul', '#2F6FA8', 0.5)
    y = -0.014
    # Ojo de Horus, un ave, un ankh y ondas de agua
    trazo(coll, 'ojo horus', [(-0.12, y, 0.2), (-0.08, y, 0.23), (-0.02, y, 0.2), (-0.08, y, 0.18), (-0.12, y, 0.2)], 0.005, tinta)
    clay.blob('pupila horus', (-0.07, y, 0.205), (0.012, 0.004, 0.012), coll, azul, n=4)
    trazo(coll, 'lágrima horus', [(-0.08, y, 0.18), (-0.08, y, 0.14), (-0.06, y, 0.13)], 0.004, tinta)
    clay.blob('ave', (0.08, y, 0.2), (0.035, 0.004, 0.025), coll, tinta, n=5)
    clay.blob('cabeza ave', (0.12, y, 0.23), (0.014, 0.004, 0.014), coll, tinta, n=4)
    aro(coll, 'ankh ojo', (0.0, y, 0.03), 0.028, 'y', 0.006, azul, n=14)
    trazo(coll, 'ankh palo', [(0.0, y, 0.0), (0.0, y, -0.1)], 0.007, azul)
    trazo(coll, 'ankh brazos', [(-0.045, y, -0.015), (0.045, y, -0.015)], 0.007, azul)
    for k in range(3):
        z = -0.17 - k * 0.035
        trazo(coll, f'agua {k}', [(-0.15 + j * 0.05, y, z + 0.012 * (j % 2)) for j in range(7)], 0.004, azul)


def deco_escarabajo(coll):
    """Escarabajo sagrado con alas doradas (de pared)."""
    y = -0.02
    clay.blob('cuerpo escarabajo', (0, y, 0), (0.07, 0.02, 0.09), coll, laca('escarabajo', '#2F6FA8', 0.25), n=6)
    clay.blob('cabeza escarabajo', (0, y, 0.1), (0.04, 0.018, 0.03), coll, laca('escarabajo', '#2F6FA8', 0.25), n=5)
    clay.blob('sol escarabajo', (0, y + 0.004, 0.16), (0.045, 0.012, 0.045), coll, laca('sol escarabajo', '#E4566B', 0.3), n=6)
    ala = oro('ala escarabajo')
    for sx in (-1, 1):
        for k in range(5):
            clay.blob(f'pluma {sx}{k}', (sx * (0.1 + k * 0.045), y + 0.004, 0.03 - k * 0.012), (0.03, 0.006, 0.07 - k * 0.008), coll, ala, n=4)
        for k in range(3):
            clay.blob(f'pata {sx}{k}', (sx * 0.075, y, -0.04 - k * 0.035), (0.03, 0.006, 0.008), coll, laca('pata escarabajo', '#1E2A3A', 0.4), n=4)


def deco_piramide(coll):
    """Pirámide de mesa con la punta de luz."""
    arena = laca('pirámide', '#E3C27A', 0.55)
    b, h = 0.15, 0.22
    verts = [(-b, -b, 0), (b, -b, 0), (b, b, 0), (-b, b, 0), (0, 0, h)]
    o = clay.make_mesh_object('pirámide', verts, [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4), (3, 2, 1, 0)], coll, smooth=False, material=arena)
    del o
    for k in range(1, 5):
        z = h * k / 5
        w = b * (1 - k / 5)
        clay.sweep(f'hilada {k}', [(-w, -w - 0.002, z), (w, -w - 0.002, z)], 0.003, (1, 1), coll, laca('hilada', '#C9A45C', 0.6), segments=4, samples=2)
    clay.blob('punta luz', (0, 0, h - 0.01), (0.025, 0.025, 0.03), coll, luz('punta pirámide', '#FFE7A8', 4.0), n=5)


def deco_gato_egipcio(coll):
    """Gato egipcio sentado (negro con collar dorado y arete)."""
    negro = laca('gato egipcio', '#22201F', 0.35)
    clay.lathe('base gato', [(0.0, 0.0), (0.07, 0.0), (0.07, 0.02), (0.0, 0.02)], coll, oro('base gato'), segments=20)
    clay.blob('cuerpo gato eg', (0, 0.01, 0.13), (0.05, 0.06, 0.11), coll, negro, n=8)
    clay.blob('pecho gato eg', (0, -0.03, 0.17), (0.04, 0.03, 0.07), coll, negro, n=6)
    clay.blob('cabeza gato eg', (0, -0.02, 0.28), (0.04, 0.038, 0.042), coll, negro, n=6)
    for sx in (-1, 1):
        clay.blob(f'oreja gato eg {sx}', (sx * 0.025, -0.015, 0.33), (0.016, 0.01, 0.03), coll, negro, n=4)
        clay.blob(f'ojo gato eg {sx}', (sx * 0.016, -0.055, 0.29), (0.009, 0.004, 0.006), coll, oro('ojo gato'), n=4)
    aro(coll, 'collar', (0, -0.015, 0.23), 0.04, 'z', 0.008, oro('collar'), n=16)
    clay.blob('arete', (0.042, -0.02, 0.27), (0.008, 0.008, 0.008), coll, oro('arete'), n=4)
    clay.sweep('cola gato eg', [(0.04, 0.05, 0.03), (0.07, 0.0, 0.02), (0.05, -0.05, 0.02)], 0.012, (1, 1), coll, negro, segments=6, samples=3)


def deco_momia(coll):
    def vendas(c, s, p, cl, o):
        venda = tela('venda', '#EFE7D6')
        for k, (z, r, inc) in enumerate(((0.06, 0.125, 0.3), (0.12, 0.128, -0.25), (0.18, 0.12, 0.35), (0.27, 0.1, -0.3), (0.33, 0.105, 0.25))):
            aro(c, f'venda {k}', (0, -0.005 * s, z * s), r * s, (inc, 0.0, 1.0), 0.012 * s, venda, n=20)
        clay.blob('ojo destapado', (0.035 * s, -0.095 * s, 0.33 * s), (0.018 * s, 0.006 * s, 0.018 * s), c, laca('ojo momia', '#FFFFFF', 0.2), n=4)
    peluche(coll, 'momia', '#E7DCC6', '#F6F0E2', 'oso', extras=vendas)


def deco_obelisco(coll):
    """Obelisco de arena con la punta dorada y jeroglíficos."""
    arena = laca('obelisco', '#E3C27A', 0.55)
    clay.rbox('basa obelisco', (0, 0, 0.05), (0.16, 0.16, 0.05), coll, laca('basa obelisco', '#C9A45C', 0.6), p=6, n=4)
    b0, b1, h = 0.1, 0.065, 1.1
    verts = [(-b0, -b0, 0.1), (b0, -b0, 0.1), (b0, b0, 0.1), (-b0, b0, 0.1), (-b1, -b1, h), (b1, -b1, h), (b1, b1, h), (-b1, b1, h), (0, 0, h + 0.1)]
    caras = [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 8), (5, 6, 8), (6, 7, 8), (7, 4, 8), (3, 2, 1, 0)]
    clay.make_mesh_object('obelisco', verts, caras, coll, smooth=False, material=arena)
    punta = [(-b1 - 0.002, -b1 - 0.002, h), (b1 + 0.002, -b1 - 0.002, h), (b1 + 0.002, b1 + 0.002, h), (-b1 - 0.002, b1 + 0.002, h), (0, 0, h + 0.102)]
    clay.make_mesh_object('piramidión', punta, [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)], coll, smooth=False, material=oro('piramidión'))
    tinta = laca('jeroglífico obelisco', '#8A5A2C', 0.6)
    for k in range(7):
        z = 0.25 + k * 0.11
        w = b0 - (b0 - b1) * (z - 0.1) / (h - 0.1)
        y = -w - 0.003
        forma = k % 3
        if forma == 0:
            aro(coll, f'glifo {k}', (0, y, z), 0.02, 'y', 0.005, tinta, n=12)
        elif forma == 1:
            trazo(coll, f'glifo {k}', [(-0.025, y, z - 0.015), (0.0, y, z + 0.02), (0.025, y, z - 0.015)], 0.005, tinta)
        else:
            trazo(coll, f'glifo {k}', [(-0.025, y, z), (0.025, y, z)], 0.005, tinta)
            trazo(coll, f'glifo b {k}', [(0.0, y, z - 0.025), (0.0, y, z + 0.025)], 0.005, tinta)


# ---------------------------------------------------------------------------
# 4. Espacial
# ---------------------------------------------------------------------------

def deco_planetas(coll):
    """Sistema solar sobre un disco de noche estrellada."""
    clay.lathe('disco noche', [(0.0, 0.0), (0.3, 0.0), (0.3, 0.02), (0.0, 0.02)], coll, laca('noche', '#1F2A4D', 0.5), segments=40).rotation_euler = (math.pi / 2, 0, 0)
    y = -0.03
    clay.blob('sol', (-0.2, y, 0.0), (0.07, 0.02, 0.07), coll, luz('sol planetas', '#FFD166', 2.5), n=6)
    for k, (x, z, r, col) in enumerate(((-0.09, 0.08, 0.025, '#C9B6EA'), (-0.02, -0.07, 0.032, '#3BB3E4'), (0.06, 0.09, 0.028, '#E4566B'),
                                         (0.16, -0.04, 0.05, '#F2B45C'))):
        clay.blob(f'planeta {k}', (x, y, z), (r, r * 0.6, r), coll, laca(f'planeta {col}', col, 0.4), n=6)
    aro(coll, 'anillo saturno', (0.16, y - 0.01, -0.04), 0.08, (0.25, 0.35, 1.0), 0.006, laca('anillo', '#F7E0A0', 0.4), n=24)
    rng = np.random.default_rng(8)
    for k in range(14):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0.1, 0.27)
        clay.blob(f'estrella {k}', (r * math.cos(a), y + 0.008, r * math.sin(a)), (0.006, 0.003, 0.006), coll, luz('estrellita', '#FFFFFF', 3.0), n=3)


def deco_cuadro_astronauta(coll):
    """Astronauta flotando con un corazón (cuadro)."""
    hx, hz = _marco(coll, 0.5, 0.62, '#2A2D3A', '#243A6B')
    y = -0.028
    traje = laca('traje', '#F4F4F4', 0.5)
    clay.blob('casco', (0, y, 0.1), (0.07, 0.012, 0.07), coll, traje, n=6)
    clay.blob('visor', (0, y - 0.01, 0.1), (0.05, 0.006, 0.042), coll, laca('visor', '#F28C45', 0.2), n=5)
    clay.blob('cuerpo astronauta', (0, y, -0.02), (0.07, 0.012, 0.075), coll, traje, n=6)
    for sx in (-1, 1):
        clay.sweep(f'brazo astronauta {sx}', [(sx * 0.06, y, 0.0), (sx * 0.12, y, 0.05), (sx * 0.14, y, 0.1)], 0.025, (1, 0.4), coll, traje, segments=6, samples=3)
        clay.sweep(f'pierna astronauta {sx}', [(sx * 0.03, y, -0.08), (sx * 0.06, y, -0.15)], 0.028, (1, 0.4), coll, traje, segments=6, samples=2)
    corazon_plano('corazón astronauta', (0.14, y - 0.01, 0.14), 0.12, coll, laca('corazón', '#E4566B', 0.35), grosor=0.3)
    rng = np.random.default_rng(3)
    for k in range(10):
        clay.blob(f'estrella cuadro {k}', (rng.uniform(-hx + 0.03, hx - 0.03), y, rng.uniform(-hz + 0.03, hz - 0.03)), (0.006, 0.003, 0.006), coll,
                  luz('estrellita', '#FFFFFF', 3.0), n=3)


def deco_lampara_luna(coll):
    """Luna llena de luz sobre una base de madera."""
    clay.lathe('base luna', [(0.0, 0.0), (0.07, 0.0), (0.07, 0.03), (0.0, 0.03)], coll, madera('base luna', '#B98559'), segments=24)
    clay.blob('luna', (0, 0, 0.14), (0.11, 0.11, 0.11), coll, luz('luna', '#FFF4D6', 1.6), n=10)
    rng = np.random.default_rng(6)
    for k in range(7):
        a, b = rng.uniform(0, 2 * math.pi), rng.uniform(-0.8, 0.8)
        d = np.array([math.cos(a) * math.cos(b), math.sin(a) * math.cos(b), math.sin(b)])
        c = np.array([0, 0, 0.14]) + d * 0.105
        clay.blob(f'cráter {k}', tuple(c), (0.02, 0.02, 0.02), coll, laca('cráter', '#E7D9B8', 0.7), n=4)


def deco_cohete_mesa(coll):
    """Cohete de juguete retro (rojo y blanco)."""
    blanco = laca('cohete', '#F4F4F4', 0.35)
    rojo = laca('cohete rojo', '#E4566B', 0.35)
    clay.lathe('fuselaje', [(0.0, 0.04), (0.045, 0.05), (0.055, 0.12), (0.05, 0.22), (0.03, 0.28), (0.0, 0.31)], coll, blanco, segments=24)
    clay.lathe('punta cohete', [(0.034, 0.26), (0.02, 0.29), (0.0, 0.312)], coll, rojo, segments=24, cap_bottom=False)
    clay.lathe('franja cohete', [(0.056, 0.12), (0.057, 0.14)], coll, rojo, segments=24, cap_bottom=False, cap_top=False)
    for k in range(3):
        a = 2 * math.pi * k / 3
        o = prisma(coll, f'aleta {k}', [(0.0, 0.04), (0.06, 0.0), (0.06, 0.03), (0.0, 0.12)], -0.006, 0.006, rojo, eje='y')
        o.rotation_euler = (0, 0, a)
        o.location = (0.035 * math.cos(a), 0.035 * math.sin(a), 0)
    clay.blob('ventana cohete', (0, -0.05, 0.19), (0.018, 0.008, 0.018), coll, laca('ventana', '#8EC5F0', 0.2), n=4)
    aro(coll, 'marco ventana', (0, -0.051, 0.19), 0.02, 'y', 0.004, metal('marco ventana'), n=12)


def deco_alien(coll):
    def antenas(c, s, p, cl, o):
        for sx in (-1, 1):
            clay.sweep(f'antena {sx}', [(sx * 0.03 * s, 0, 0.38 * s), (sx * 0.06 * s, 0, 0.47 * s)], 0.008 * s, (1, 1), c, p, segments=5, samples=2)
            clay.blob(f'bolita antena {sx}', (sx * 0.06 * s, 0, 0.48 * s), (0.02 * s, 0.02 * s, 0.02 * s), c, luz('bolita alien', '#F7C948', 2.0), n=4)
        clay.blob('ojo grande', (0, -0.085 * s, 0.335 * s), (0.03 * s, 0.01 * s, 0.03 * s), c, o, n=5)
    peluche(coll, 'alien', '#8FD66B', '#C9F2B8', None, extras=antenas)


def deco_telescopio(coll):
    """Telescopio en trípode, apuntando al cielo."""
    pata = madera('trípode', '#8A6A4A')
    for k in range(3):
        a = 2 * math.pi * k / 3
        clay.sweep(f'pata trípode {k}', [(0, 0, 0.75), (0.28 * math.cos(a), 0.28 * math.sin(a), 0.0)], 0.015, (1, 1), coll, pata, segments=6, samples=2)
    clay.blob('cabeza trípode', (0, 0, 0.77), (0.04, 0.04, 0.03), coll, metal('cabeza trípode', '#2A2D3A'), n=5)
    tubo = laca('tubo telescopio', '#3B6FB6', 0.3)
    clay.sweep('tubo telescopio', [(-0.2, 0.1, 0.68), (0.25, -0.12, 0.98)], [0.045, 0.06], (1, 1), coll, tubo, segments=16, samples=2, caps=('flat', 'flat'))
    clay.sweep('ocular', [(-0.2, 0.1, 0.68), (-0.26, 0.13, 0.64)], 0.015, (1, 1), coll, metal('ocular', '#2A2D3A'), segments=8, samples=2)
    aro(coll, 'boca telescopio', (0.25, -0.12, 0.98), 0.062, (0.45, -0.22, 0.3), 0.01, oro('boca telescopio'), n=16)


# ---------------------------------------------------------------------------
# 5. Tropical (playa)
# ---------------------------------------------------------------------------

def deco_tabla_surf(coll):
    """Tabla de surf parada contra la pared, con franjas."""
    tabla = clay.blob('tabla surf', (0, 0, 0.72), (0.2, 0.035, 0.72), coll, laca('tabla surf', '#F7C948', 0.3), n=10, p=2.0,
                      shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.5 * (np.abs(v[:, 2]) / 0.72) ** 2), v[:, 1], v[:, 2]]))
    tabla.rotation_euler = (-0.12, 0, 0)
    for k, (z, col) in enumerate(((0.55, '#3BB3E4'), (0.62, '#E4566B'))):
        f = clay.rbox(f'franja surf {k}', (0, -0.02, z), (0.19, 0.02, 0.018), coll, laca(f'franja {col}', col, 0.3), p=6, n=3)
        f.rotation_euler = (-0.12, 0, 0)
    for k in range(5):
        a = 2 * math.pi * k / 5
        o = clay.blob(f'hibisco {k}', (0.04 * math.cos(a), -0.03, 0.95 + 0.04 * math.sin(a)), (0.03, 0.01, 0.03), coll, laca('hibisco', '#E4566B', 0.4), n=4)
        o.rotation_euler = (-0.12, 0, 0)


def deco_cuadro_ola(coll):
    """La gran ola con sol (cuadro)."""
    hx, hz = _marco(coll, 0.66, 0.46, '#F2EBDD', '#FDF1DC')
    y = -0.026
    plano(coll, 'mar ola', [(-hx, -hz), (hx, -hz), (hx, -0.04), (-hx, -0.02)], y, papel('mar ola', '#2F7FB5'))
    pts = [(-hx, y - 0.006, -0.02), (-0.12, y - 0.006, 0.02), (0.02, y - 0.006, 0.12), (0.12, y - 0.006, 0.1), (0.1, y - 0.006, 0.04), (0.04, y - 0.006, 0.06)]
    clay.sweep('cresta', pts, 0.02, (1, 0.3), coll, papel('cresta', '#FFFFFF'), segments=6, samples=4)
    clay.sweep('ola', [(-hx, y - 0.004, -0.06), (-0.1, y - 0.004, -0.02), (0.02, y - 0.004, 0.06), (0.1, y - 0.004, 0.05)], 0.04, (1, 0.3), coll,
               papel('ola', '#3BB3E4'), segments=6, samples=4)
    clay.blob('sol ola', (0.2, y - 0.004, 0.12), (0.05, 0.004, 0.05), coll, laca('sol ola', '#F28C45', 0.4), n=5)


def deco_concha(coll):
    """Caracola y estrella de mar."""
    concha = laca('caracola', '#F6C7B6', 0.35)
    for k in range(6):
        t = k / 5
        clay.blob(f'vuelta caracola {k}', (0.0 + t * 0.09, 0.0, 0.05 + math.sin(t * 2) * 0.02), (0.07 - t * 0.05, 0.06 - t * 0.04, 0.05 - t * 0.03), coll,
                  concha, n=6)
    clay.blob('boca caracola', (-0.03, -0.04, 0.05), (0.04, 0.02, 0.035), coll, laca('boca caracola', '#F39AB0', 0.3), n=5)
    naranja = laca('estrella de mar', '#F28C45', 0.5)
    for k in range(5):
        a = 2 * math.pi * k / 5
        clay.sweep(f'brazo estrella {k}', [(0.12, -0.06, 0.012), (0.12 + 0.06 * math.cos(a), -0.06 + 0.06 * math.sin(a), 0.01)], [0.018, 0.008], (1, 0.6),
                   coll, naranja, segments=6, samples=2)
    clay.blob('centro estrella', (0.12, -0.06, 0.015), (0.02, 0.02, 0.012), coll, naranja, n=4)


def deco_tortuga(coll):
    def caparazon(c, s, p, cl, o):
        clay.blob('caparazón', (0, 0.06 * s, 0.17 * s), (0.17 * s, 0.1 * s, 0.15 * s), c, tela('caparazón', '#5FA85A'), n=8)
        for k in range(5):
            a = 2 * math.pi * k / 5
            clay.blob(f'placa {k}', (0.07 * math.cos(a) * s, 0.13 * s, (0.18 + 0.06 * math.sin(a)) * s), (0.03 * s, 0.015 * s, 0.03 * s), c,
                      tela('placa', '#8FD6B9'), n=4)
    peluche(coll, 'tortuga', '#9BD67B', '#E6F4C8', None, extras=caparazon)


def deco_flotador(coll):
    """Salvavidas rojo y blanco colgado en la pared, con su cuerda."""
    for k in range(8):
        a0 = 2 * math.pi * k / 8
        pts = [(0.17 * math.cos(a), -0.05, 0.17 * math.sin(a)) for a in np.linspace(a0, a0 + 2 * math.pi / 8, 5)]
        clay.sweep(f'salvavidas {k}', pts, 0.05, (1, 1), coll, laca('salvavidas rojo' if k % 2 else 'salvavidas blanco', '#E4566B' if k % 2 else '#FFFFFF', 0.4),
                   segments=10, samples=2, caps=(None, None))
    cuerda = tela('cuerda', '#E8CF9A')
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        clay.sweep(f'cuerda {k}', [(0.2 * math.cos(a - 0.3), -0.1, 0.2 * math.sin(a - 0.3)), (0.23 * math.cos(a), -0.1, 0.23 * math.sin(a)),
                                    (0.2 * math.cos(a + 0.3), -0.1, 0.2 * math.sin(a + 0.3))], 0.008, (1, 1), coll, cuerda, segments=5, samples=3)


# ---------------------------------------------------------------------------
# 6. Japonés
# ---------------------------------------------------------------------------

def deco_abanico(coll):
    """Abanico japonés abierto con flores de cerezo (de pared)."""
    varilla = madera('varilla abanico', '#5B3A2A')
    tela_ab = papel('abanico', '#F6E7DA')
    n = 11
    for k in range(n):
        a0 = math.radians(20 + 140 * k / n)
        a1 = math.radians(20 + 140 * (k + 1) / n)
        pts = [(0.06 * math.cos(a0), 0.06 * math.sin(a0)), (0.3 * math.cos(a0), 0.3 * math.sin(a0)), (0.3 * math.cos(a1), 0.3 * math.sin(a1)),
               (0.06 * math.cos(a1), 0.06 * math.sin(a1))]
        prisma(coll, f'pliegue {k}', [(x, z - 0.12) for x, z in pts], 0.0 if k % 2 else 0.006, 0.012 if k % 2 else 0.018, tela_ab, eje='y')
        trazo(coll, f'varilla {k}', [(0.0, -0.02, -0.12), (0.3 * math.cos(a0), -0.02, 0.3 * math.sin(a0) - 0.12)], 0.004, varilla)
    rosa = laca('flor cerezo', '#F39AB0', 0.5)
    for k, (x, z) in enumerate(((-0.12, 0.08), (0.02, 0.12), (0.14, 0.05), (-0.05, 0.02), (0.09, -0.02))):
        for j in range(5):
            a = 2 * math.pi * j / 5
            clay.blob(f'pétalo cerezo {k}{j}', (x + 0.014 * math.cos(a), -0.024, z + 0.014 * math.sin(a)), (0.012, 0.004, 0.012), coll, rosa, n=3)
    clay.blob('clavo abanico', (0, -0.024, -0.12), (0.016, 0.008, 0.016), coll, oro('clavo abanico'), n=4)


def deco_cuadro_fuji(coll):
    """El monte Fuji con sol rojo (cuadro)."""
    hx, hz = _marco(coll, 0.64, 0.46, '#2B2422', '#F6E7DA')
    y = -0.026
    clay.blob('sol fuji', (0.14, y, 0.09), (0.07, 0.004, 0.07), coll, laca('sol fuji', '#E4566B', 0.4), n=6)
    plano(coll, 'monte', [(-0.26, -hz), (0.26, -hz), (0.08, 0.06), (-0.06, 0.06)], y - 0.004, papel('monte', '#3B6FB6'))
    plano(coll, 'nieve', [(-0.1, 0.0), (-0.06, 0.06), (0.08, 0.06), (0.12, 0.0), (0.06, 0.02), (0.01, -0.01), (-0.04, 0.02)], y - 0.008, papel('nieve', '#FFFFFF'))
    for k in range(3):
        trazo(coll, f'nube fuji {k}', [(-0.28 + k * 0.08, y - 0.01, -0.06 - k * 0.03), (-0.2 + k * 0.08, y - 0.01, -0.05 - k * 0.03)], 0.012, papel('nube', '#FFFFFF'))


def deco_maneki(coll):
    """Gato de la suerte (maneki-neko) con la patica arriba."""
    blanco = laca('maneki', '#FFFFFF', 0.3)
    clay.blob('cuerpo maneki', (0, 0, 0.1), (0.08, 0.07, 0.1), coll, blanco, n=8)
    clay.blob('cabeza maneki', (0, -0.01, 0.23), (0.075, 0.065, 0.06), coll, blanco, n=8)
    for sx in (-1, 1):
        clay.blob(f'oreja maneki {sx}', (sx * 0.05, -0.005, 0.29), (0.02, 0.012, 0.028), coll, blanco, n=4)
        clay.blob(f'oreja dentro {sx}', (sx * 0.05, -0.014, 0.288), (0.011, 0.004, 0.016), coll, laca('oreja rosa', '#F39AB0', 0.4), n=3)
        trazo(coll, f'ojo maneki {sx}', [(sx * 0.035, -0.07, 0.235), (sx * 0.025, -0.074, 0.24), (sx * 0.015, -0.07, 0.235)], 0.004, laca('ojo', '#2B2422', 0.2))
    clay.sweep('pata arriba', [(0.06, -0.02, 0.15), (0.09, -0.04, 0.22), (0.09, -0.04, 0.27)], 0.022, (1, 1), coll, blanco, segments=8, samples=3)
    clay.blob('pata abajo', (-0.04, -0.07, 0.08), (0.025, 0.02, 0.025), coll, blanco, n=4)
    aro(coll, 'collar maneki', (0, -0.01, 0.175), 0.06, 'z', 0.008, laca('collar rojo', '#E4566B', 0.4), n=16)
    clay.blob('campana', (0, -0.07, 0.16), (0.016, 0.012, 0.016), coll, oro('campana'), n=4)
    clay.rbox('moneda', (-0.04, -0.07, 0.12), (0.03, 0.006, 0.04), coll, oro('koban'), p=4, n=3)


def deco_farol_papel(coll):
    """Lámpara japonesa de papel (andon) de pie."""
    mad = madera('farol', '#3A2A22')
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.rbox(f'pata farol {sx}{sy}', (sx * 0.15, sy * 0.15, 0.5), (0.015, 0.015, 0.5), coll, mad, p=6, n=3)
    clay.rbox('papel farol', (0, 0, 0.62), (0.14, 0.14, 0.32), coll, luz('papel farol', '#FFF1DC', 1.4), p=10, n=4, subsurf=1)
    for k, z in enumerate((0.3, 0.52, 0.72, 0.94)):
        clay.rbox(f'listón {k}', (0, 0, z), (0.16, 0.16, 0.012), coll, mad, p=6, n=3)
    clay.rbox('tapa farol', (0, 0, 1.0), (0.18, 0.18, 0.02), coll, mad, p=6, n=3)


def deco_cerezo(coll):
    """Cerezo en flor en matera baja."""
    h = matera(coll, 0.16, 0.18, '#2B2422')
    tronco = madera('cerezo', '#6B4A3A')
    ramas = [[(0, 0, h), (0.02, 0, h + 0.35), (-0.05, 0, h + 0.7)], [(0.02, 0, h + 0.35), (0.2, 0.02, h + 0.6)], [(-0.02, 0, h + 0.5), (-0.22, -0.02, h + 0.75)],
             [(0.0, 0, h + 0.6), (0.12, -0.03, h + 0.9)]]
    for k, pts in enumerate(ramas):
        clay.sweep(f'rama cerezo {k}', pts, [0.035, 0.02, 0.012][:len(pts)], (1, 1), coll, tronco, segments=8, samples=4)
    flor = tela('flores cerezo', '#F7B6C8')
    for k, (x, y, z, r) in enumerate(((-0.05, 0, h + 0.75, 0.16), (0.2, 0.02, h + 0.62, 0.13), (-0.22, -0.02, h + 0.77, 0.13), (0.12, -0.03, h + 0.92, 0.12),
                                      (0.05, 0.05, h + 0.85, 0.12))):
        clay.blob(f'copa cerezo {k}', (x, y, z), (r, r * 0.9, r * 0.75), coll, flor, n=8)


# ---------------------------------------------------------------------------
# 7. Princesa
# ---------------------------------------------------------------------------

def corona(coll, nombre, c, r, alto, mat, joya='#E4566B'):
    """Coronita de 5 puntas con perlas y una joya al frente."""
    cx, cy, cz = c
    aro(coll, f'{nombre} aro', (cx, cy, cz), r, 'z', r * 0.12, mat, n=20)
    for k in range(10):
        a = 2 * math.pi * k / 10
        clay.sweep(f'{nombre} punta {k}', [(cx + r * math.cos(a), cy + r * math.sin(a), cz), (cx + r * math.cos(a), cy + r * math.sin(a), cz + alto)], [r * 0.12, r * 0.04],
                   (1, 1), coll, mat, segments=5, samples=2, caps=('flat', 'point'))
        clay.blob(f'{nombre} perla {k}', (cx + r * math.cos(a), cy + r * math.sin(a), cz + alto), (r * 0.09, r * 0.09, r * 0.09), coll,
                  laca('perla', '#FFF8EC', 0.2), n=3)
    clay.blob(f'{nombre} joya', (cx, cy - r * 1.02, cz + alto * 0.35), (r * 0.18, r * 0.08, r * 0.2), coll, laca(f'joya {joya}', joya, 0.1), n=4)


def deco_espejo_princesa(coll):
    """Espejo ovalado con marco dorado de rococó y una corona encima."""
    dorado = oro('marco princesa')
    clay.blob('marco espejo princesa', (0, -0.02, 0), (0.22, 0.02, 0.3), coll, dorado, n=10)
    clay.blob('vidrio espejo princesa', (0, -0.04, 0), (0.18, 0.006, 0.26), coll, _mat('Deco | espejo princesa', '#DCE7F2', rough=0.05, metallic=1.0), n=10)
    for k in range(16):
        a = 2 * math.pi * k / 16
        clay.blob(f'volutas {k}', (0.21 * math.cos(a), -0.03, 0.29 * math.sin(a)), (0.025, 0.012, 0.025), coll, dorado, n=4)
    corona(coll, 'corona espejo', (0, -0.03, 0.31), 0.07, 0.07, dorado)
    corazon_plano('corazón espejo', (0, -0.035, -0.31), 0.12, coll, laca('corazón espejo', '#F39AB0', 0.3), grosor=0.35)


def deco_tiara(coll):
    """Tiara de princesa sobre un cojín rosado con borlas."""
    clay.rbox('cojín tiara', (0, 0, 0.04), (0.12, 0.12, 0.04), coll, tela('cojín tiara', '#F39AB0'), p=3, n=6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.blob(f'borla {sx}{sy}', (sx * 0.12, sy * 0.12, 0.03), (0.015, 0.015, 0.025), coll, tela('borla', '#F7C948'), n=4)
    corona(coll, 'tiara', (0, 0, 0.09), 0.06, 0.05, oro('tiara'), joya='#8EC5F0')


def deco_joyero(coll):
    """Joyero abierto con collar de perlas y anillos."""
    rosa = laca('joyero', '#F7C6D2', 0.3)
    clay.rbox('caja joyero', (0, 0, 0.05), (0.12, 0.08, 0.05), coll, rosa, p=6, n=4)
    tapa = clay.rbox('tapa joyero', (0, 0.1, 0.14), (0.12, 0.012, 0.08), coll, rosa, p=6, n=4)
    del tapa
    clay.rbox('espejito joyero', (0, 0.087, 0.14), (0.1, 0.002, 0.065), coll, _mat('Deco | espejito', '#DCE7F2', rough=0.05, metallic=1.0), p=8, n=3, subsurf=0)
    clay.rbox('terciopelo', (0, 0, 0.098), (0.11, 0.07, 0.004), coll, tela('terciopelo', '#B9456A'), p=6, n=3)
    perla = laca('perla', '#FFF8EC', 0.2)
    for k in range(14):
        a = math.pi * k / 13
        clay.blob(f'perla collar {k}', (-0.1 + 0.2 * k / 13, -0.05 - 0.04 * math.sin(a), 0.105), (0.01, 0.01, 0.01), coll, perla, n=3)
    for k, x in enumerate((-0.04, 0.04)):
        aro(coll, f'anillo {k}', (x, 0.03, 0.115), 0.016, 'y', 0.004, oro('anillo'), n=12)
        clay.blob(f'gema anillo {k}', (x, 0.03, 0.134), (0.008, 0.008, 0.008), coll, laca('gema', '#8EC5F0' if k else '#E4566B', 0.1), n=3)


def deco_castillo(coll):
    """Castillo de princesa de juguete (rosado con techos lila)."""
    muro = laca('castillo', '#F7D6E0', 0.45)
    techo = laca('techo castillo', '#C9B6EA', 0.4)
    clay.rbox('muralla', (0, 0, 0.18), (0.26, 0.16, 0.18), coll, muro, p=8, n=4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.lathe(f'torre {sx}{sy}', [(0.0, 0.0), (0.07, 0.0), (0.07, 0.46), (0.0, 0.46)], coll, muro, segments=16).location = (sx * 0.26, sy * 0.16, 0)
            clay.lathe(f'techo torre {sx}{sy}', [(0.085, 0.46), (0.0, 0.64)], coll, techo, segments=16).location = (sx * 0.26, sy * 0.16, 0)
            clay.sweep(f'banderita {sx}{sy}', [(sx * 0.26, sy * 0.16, 0.64), (sx * 0.26, sy * 0.16, 0.7)], 0.004, (1, 1), coll, madera('asta', '#8A6A4A'), segments=4, samples=2)
            clay.blob(f'bandera {sx}{sy}', (sx * 0.26 + 0.025, sy * 0.16, 0.69), (0.025, 0.004, 0.012), coll, laca('bandera', '#E4566B', 0.4), n=3)
    clay.lathe('torre central', [(0.0, 0.3), (0.09, 0.3), (0.09, 0.62), (0.0, 0.62)], coll, muro, segments=18)
    clay.lathe('techo central', [(0.11, 0.62), (0.0, 0.86)], coll, techo, segments=18)
    clay.blob('puerta castillo', (0, -0.16, 0.1), (0.06, 0.012, 0.09), coll, madera('puerta castillo', '#8A5634'), n=6,
              shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], -0.09)]))
    for k, x in enumerate((-0.14, 0.14)):
        clay.blob(f'ventana castillo {k}', (x, -0.162, 0.24), (0.03, 0.006, 0.04), coll, luz('ventana castillo', '#FFE7A8', 1.5), n=4)
    corazon_plano('corazón castillo', (0, -0.1, 0.5), 0.12, coll, laca('corazón', '#E4566B', 0.35), grosor=0.35)


def deco_corona_pared(coll):
    """Corona grande de pared con bombillitos (sobre la cama)."""
    dorado = oro('corona pared')
    base = [(-0.28, -0.12), (0.28, -0.12), (0.28, -0.04), (0.2, 0.16), (0.12, 0.0), (0.0, 0.2), (-0.12, 0.0), (-0.2, 0.16), (-0.28, -0.04)]
    prisma(coll, 'corona pared', base, 0.0, 0.025, dorado, eje='y')
    for k, (x, z) in enumerate(((0.2, 0.16), (0.0, 0.2), (-0.2, 0.16))):
        clay.blob(f'bola corona {k}', (x, -0.02, z + 0.02), (0.025, 0.02, 0.025), coll, dorado, n=4)
    for k in range(7):
        clay.blob(f'bombillo corona {k}', (-0.24 + k * 0.08, -0.03, -0.08), (0.014, 0.01, 0.014), coll, luz('bombillo corona', '#FFE7A8', 3.5), n=3)


# ---------------------------------------------------------------------------
# 8. Música
# ---------------------------------------------------------------------------

def disco(coll, nombre, c, r, etiqueta):
    clay.lathe(f'{nombre} acetato', [(0.0, 0.0), (r, 0.0), (r, 0.006), (0.0, 0.006)], coll, laca('acetato', '#1E1D1D', 0.25), segments=32).location = c
    o = clay.lathe(f'{nombre} etiqueta', [(0.0, 0.006), (r * 0.33, 0.006), (r * 0.33, 0.008), (0.0, 0.008)], coll, papel(f'etiqueta {etiqueta}', etiqueta), segments=24)
    o.location = c


def deco_vinilos(coll):
    """Tres discos de vinilo colgados en la pared."""
    for k, (x, z, col) in enumerate(((-0.2, 0.06, '#E4566B'), (0.02, -0.05, '#F7C948'), (0.22, 0.07, '#3BB3E4'))):
        grupo = []
        for o in (clay.lathe(f'vinilo {k}', [(0.0, 0.0), (0.13, 0.0), (0.13, 0.006), (0.0, 0.006)], coll, laca('acetato', '#1E1D1D', 0.25), segments=32),
                  clay.lathe(f'etiqueta vinilo {k}', [(0.0, 0.006), (0.043, 0.006), (0.043, 0.009), (0.0, 0.009)], coll, papel(f'etiqueta {col}', col), segments=24)):
            o.rotation_euler = (math.pi / 2, 0, 0)
            o.location = (x, -0.004, z)
            grupo.append(o)
        for j in range(3):
            aro(coll, f'surco {k}{j}', (x, -0.011, z), 0.07 + j * 0.02, 'y', 0.0015, laca('surco', '#3A3838', 0.2), n=28)


def deco_poster_rock(coll):
    """Afiche de una guitarra con un rayo."""
    hx, hz = _marco(coll, 0.46, 0.66, '#1E1D1D', '#2A2D3A')
    y = -0.028
    clay.blob('cuerpo guitarra afiche', (0.0, y, -0.1), (0.1, 0.01, 0.12), coll, laca('guitarra afiche', '#E4566B', 0.35), n=6)
    clay.rbox('mástil afiche', (0.0, y - 0.004, 0.1), (0.016, 0.006, 0.16), coll, madera('mástil', '#8A5634'), p=6, n=3)
    clay.rbox('clavijero afiche', (0.0, y - 0.004, 0.27), (0.026, 0.006, 0.03), coll, laca('clavijero', '#1E1D1D', 0.4), p=6, n=3)
    prisma(coll, 'rayo', [(-0.16, 0.2), (-0.08, 0.2), (-0.12, 0.1), (-0.06, 0.1), (-0.16, -0.05), (-0.13, 0.06), (-0.18, 0.06)], 0.0, 0.006, luz('rayo', '#F7C948', 1.5),
           y=y, eje='y')
    for k in range(3):
        clay.blob(f'estrella rock {k}', (0.13, y, 0.18 - k * 0.1), (0.018, 0.004, 0.018), coll, luz('estrella rock', '#FFFFFF', 2.0), n=3)


def deco_microfono(coll):
    """Micrófono de estudio retro en su base."""
    metal_osc = metal('micro', '#2A2D3A', 0.3)
    clay.lathe('base micro', [(0.0, 0.0), (0.07, 0.0), (0.07, 0.015), (0.0, 0.02)], coll, metal_osc, segments=24)
    clay.sweep('palo micro', [(0, 0, 0.02), (0, 0, 0.2)], 0.008, (1, 1), coll, metal_osc, segments=8, samples=2)
    aro(coll, 'horquilla', (0, 0, 0.24), 0.05, 'y', 0.006, metal_osc, n=16)
    clay.blob('cápsula', (0, 0, 0.26), (0.04, 0.035, 0.06), coll, metal('rejilla micro', '#C9CCD2', 0.35), n=8)
    aro(coll, 'banda micro', (0, 0, 0.26), 0.041, 'z', 0.006, oro('banda micro'), n=16)


def deco_guitarra_electrica(coll):
    """Guitarra eléctrica en su atril."""
    atril = metal('atril', '#2A2D3A', 0.35)
    for sx in (-1, 1):
        clay.sweep(f'pata atril {sx}', [(sx * 0.15, 0.1, 0.0), (0, 0.06, 0.3)], 0.01, (1, 1), coll, atril, segments=6, samples=2)
    clay.sweep('cuello atril', [(0, 0.06, 0.0), (0, 0.06, 0.3), (0, 0.1, 0.85)], 0.01, (1, 1), coll, atril, segments=6, samples=3)
    cuerpo = laca('tinte guitarra', '#E4566B', 0.25)
    clay.blob('cuerpo guitarra', (0, 0, 0.3), (0.17, 0.035, 0.2), coll, cuerpo, n=8,
              shaper=lambda v: np.column_stack([v[:, 0] * (1 - 0.25 * np.exp(-((v[:, 2] - 0.05) / 0.06) ** 2)), v[:, 1], v[:, 2]]))
    clay.rbox('golpeador', (0.04, -0.035, 0.27), (0.07, 0.004, 0.09), coll, laca('golpeador', '#FFFFFF', 0.3), p=4, n=3)
    clay.rbox('mástil guitarra', (0, 0.0, 0.72), (0.022, 0.014, 0.24), coll, madera('mástil guitarra', '#D8A56B'), p=6, n=3)
    clay.rbox('clavijero guitarra', (0, 0.0, 0.98), (0.03, 0.012, 0.05), coll, laca('clavijero', '#1E1D1D', 0.4), p=6, n=3)
    for k in range(3):
        clay.rbox(f'pastilla {k}', (0, -0.037, 0.22 + k * 0.05), (0.035, 0.004, 0.008), coll, metal('pastilla'), p=6, n=3)
    for k in range(6):
        clay.sweep(f'cuerda {k}', [(-0.012 + k * 0.005, -0.018, 0.2), (-0.012 + k * 0.005, -0.018, 0.96)], 0.0012, (1, 1), coll, metal('cuerda', '#E7E7E7'),
                   segments=4, samples=2)


def deco_amplificador(coll):
    """Amplificador de guitarra con perillas doradas."""
    caja = tela('amplificador', '#1E1D1D')
    clay.rbox('caja amp', (0, 0, 0.22), (0.24, 0.13, 0.22), coll, caja, p=8, n=4)
    clay.rbox('parrilla', (0, -0.13, 0.18), (0.2, 0.006, 0.15), coll, tela('parrilla amp', '#5C4A3A'), p=8, n=3)
    clay.rbox('panel amp', (0, -0.128, 0.39), (0.21, 0.008, 0.035), coll, laca('panel amp', '#E8CF9A', 0.4), p=6, n=3)
    for k in range(6):
        clay.blob(f'perilla amp {k}', (-0.15 + k * 0.06, -0.14, 0.39), (0.012, 0.01, 0.012), coll, oro('perilla amp'), n=4)
    clay.sweep('asa amp', [(-0.08, 0, 0.44), (0, 0, 0.47), (0.08, 0, 0.44)], 0.012, (1, 0.5), coll, laca('asa', '#2A2D3A', 0.4), segments=6, samples=3)


# ---------------------------------------------------------------------------
# 9. Fútbol (la Selección)
# ---------------------------------------------------------------------------

def deco_camiseta(coll):
    """Camiseta amarilla con el 10, enmarcada."""
    hx, hz = _marco(coll, 0.56, 0.64, '#2B2422', '#EFE7DA')
    y = -0.03
    amarillo = tela('camiseta', '#F7C948')
    clay.rbox('torso camiseta', (0, y, -0.03), (0.12, 0.01, 0.18), coll, amarillo, p=4, n=4)
    for sx in (-1, 1):
        clay.rbox(f'manga {sx}', (sx * 0.16, y, 0.09), (0.06, 0.009, 0.05), coll, amarillo, p=4, n=4)
        clay.rbox(f'puño {sx}', (sx * 0.2, y - 0.004, 0.06), (0.025, 0.006, 0.02), coll, tela('puño', '#3B6FB6'), p=4, n=3)
    clay.blob('cuello camiseta', (0, y - 0.006, 0.14), (0.04, 0.006, 0.025), coll, tela('cuello', '#3B6FB6'), n=4)
    rojo = laca('número', '#E4566B', 0.4)
    trazo(coll, 'uno', [(-0.05, y - 0.012, 0.06), (-0.035, y - 0.012, 0.08), (-0.035, y - 0.012, -0.06)], 0.009, rojo)
    aro(coll, 'cero', (0.03, y - 0.012, 0.01), 0.045, 'y', 0.009, rojo, n=16)


def deco_bufanda(coll):
    """Bufanda de hincha colgada (amarilla, azul y roja)."""
    colores = ('#F7C948', '#3B6FB6', '#E4566B')
    trazo(coll, 'percha bufanda', [(-0.25, -0.03, 0.08), (0.25, -0.03, 0.08)], 0.014, madera('percha', '#8A5634'))
    for sx in (-1, 1):
        clay.blob(f'tope percha {sx}', (sx * 0.26, -0.03, 0.08), (0.02, 0.02, 0.02), coll, madera('percha', '#8A5634'), n=4)
    for k in range(7):
        x = -0.17 + k * 0.057
        clay.rbox(f'tramo bufanda {k}', (x, -0.05, 0.04), (0.03, 0.012, 0.045), coll, tela(f'bufanda {colores[k % 3]}', colores[k % 3]), p=4, n=4)
    for sx in (-1, 1):
        for j in range(4):
            clay.rbox(f'caída bufanda {sx}{j}', (sx * 0.17, -0.02, -0.02 - j * 0.07), (0.028, 0.012, 0.035), coll, tela(f'bufanda {colores[j % 3]}', colores[j % 3]),
                      p=4, n=4)
        for j in range(4):
            trazo(coll, f'fleco {sx}{j}', [(sx * 0.17 - 0.02 + j * 0.013, -0.02, -0.26), (sx * 0.17 - 0.02 + j * 0.013, -0.02, -0.3)], 0.004, tela('fleco', '#F7C948'))


def deco_copa(coll):
    """Copa de campeón dorada."""
    dorado = oro('copa')
    clay.rbox('base copa', (0, 0, 0.03), (0.06, 0.06, 0.03), coll, laca('base copa', '#1E1D1D', 0.35), p=6, n=4)
    clay.lathe('copa', [(0.0, 0.06), (0.03, 0.06), (0.012, 0.1), (0.012, 0.14), (0.05, 0.17), (0.075, 0.24), (0.07, 0.26), (0.0, 0.25)], coll, dorado, segments=24)
    for sx in (-1, 1):
        clay.sweep(f'oreja copa {sx}', [(sx * 0.07, 0, 0.24), (sx * 0.11, 0, 0.22), (sx * 0.09, 0, 0.18), (sx * 0.06, 0, 0.18)], 0.008, (1, 1), coll, dorado,
                   segments=6, samples=3)
    clay.blob('estrella copa', (0, -0.062, 0.2), (0.018, 0.006, 0.018), coll, laca('estrella copa', '#E4566B', 0.3), n=4)


def balon(coll, nombre, c, r):
    clay.blob(nombre, c, (r, r, r), coll, laca('balón', '#FFFFFF', 0.4), n=10)
    # Los 12 pentágonos negros van en las puntas de un icosaedro (bien repartidos, como el balón de verdad)
    f = (1 + 5 ** 0.5) / 2
    dirs = [(0, sy, sz * f) for sy in (-1, 1) for sz in (-1, 1)] + [(sx, sy * f, 0) for sx in (-1, 1) for sy in (-1, 1)] + \
        [(sx * f, 0, sz) for sx in (-1, 1) for sz in (-1, 1)]
    for k, d in enumerate(dirs):
        d = np.array(d, dtype=float) / np.linalg.norm(d)
        p = np.array(c) + d * r * 0.93
        clay.blob(f'{nombre} parche {k}', tuple(p), (r * 0.26, r * 0.26, r * 0.26), coll, laca('parche balón', '#1E1D1D', 0.4), n=4)


def deco_balon(coll):
    balon(coll, 'balón grande', (0, 0, 0.12), 0.12)


def deco_arco(coll):
    """Arco de fútbol pequeño con su malla y un balón."""
    blanco = laca('arco', '#FFFFFF', 0.35)
    for sx in (-1, 1):
        clay.sweep(f'palo {sx}', [(sx * 0.4, 0.0, 0.0), (sx * 0.4, 0.0, 0.55)], 0.018, (1, 1), coll, blanco, segments=8, samples=2)
        clay.sweep(f'palo atrás {sx}', [(sx * 0.4, 0.0, 0.55), (sx * 0.4, 0.3, 0.0)], 0.012, (1, 1), coll, blanco, segments=6, samples=2)
    clay.sweep('travesaño', [(-0.4, 0.0, 0.55), (0.4, 0.0, 0.55)], 0.018, (1, 1), coll, blanco, segments=8, samples=2)
    malla = tela('malla', '#DDE3EA')
    for k in range(9):
        x = -0.4 + k * 0.1
        clay.sweep(f'malla v {k}', [(x, 0.0, 0.55), (x, 0.3, 0.0)], 0.003, (1, 1), coll, malla, segments=4, samples=2)
    for k in range(6):
        t = k / 5
        clay.sweep(f'malla h {k}', [(-0.4, 0.3 * t, 0.55 * (1 - t)), (0.4, 0.3 * t, 0.55 * (1 - t))], 0.003, (1, 1), coll, malla, segments=4, samples=2)
    balon(coll, 'balón arco', (0.15, -0.1, 0.08), 0.08)


# ---------------------------------------------------------------------------
# 10. Colombiano (cafetero y costeño)
# ---------------------------------------------------------------------------

def deco_sombrero_vueltiao(coll):
    """Sombrero vueltiao colgado de frente (las trenzas en negro y crema)."""
    crema = tela('vueltiao crema', '#EFE3C8')
    negro = tela('vueltiao negro', '#2B2422')
    for nombre, perfil in (('ala vueltiao', [(0.085, 0.0), (0.25, 0.0), (0.255, 0.012), (0.09, 0.02)]),
                           ('copa vueltiao', [(0.088, 0.015), (0.085, 0.1), (0.055, 0.13), (0.0, 0.135)])):
        o = clay.lathe(nombre, perfil, coll, crema, segments=36)
        o.rotation_euler = (math.pi / 2, 0, 0)
    # Trenzas negras sobre el ala y la copa (a la vista de frente)
    for k, r in enumerate((0.11, 0.13, 0.155, 0.175, 0.2, 0.22, 0.24)):
        aro(coll, f'trenza {k}', (0, -0.016 - 0.0005 * k, 0), r, 'y', 0.007 if k % 2 else 0.004, negro, n=40)
    for k, (y, r) in enumerate(((-0.04, 0.088), (-0.075, 0.086), (-0.1, 0.075))):
        aro(coll, f'trenza copa {k}', (0, y, 0), r + 0.003, 'y', 0.006, negro, n=28)
    for k in range(12):
        a = 2 * math.pi * k / 12
        clay.blob(f'rombo vueltiao {k}', (0.19 * math.cos(a), -0.02, 0.19 * math.sin(a)), (0.012, 0.004, 0.012), coll, negro, n=3)


def deco_mochila_wayuu(coll):
    """Mochila wayuu de colores colgada de su gasa."""
    colores = ('#E4566B', '#F7C948', '#3B6FB6', '#5FA85A', '#F28C45', '#B45CFF')
    for k in range(6):
        z = -0.05 - k * 0.04
        clay.lathe(f'franja mochila {k}', [(0.1, z), (0.105, z + 0.02), (0.1, z + 0.04)], coll, tela(f'mochila {colores[k]}', colores[k]), segments=24,
                   cap_bottom=False, cap_top=False).location = (0, -0.11, 0)
    clay.lathe('fondo mochila', [(0.0, -0.3), (0.09, -0.29), (0.1, -0.25)], coll, tela('mochila fondo', '#2B2422'), segments=24, cap_top=False).location = (0, -0.11, 0)
    rombo = tela('rombos', '#FFFFFF')
    for k in range(5):
        a = -0.6 + k * 0.3
        clay.blob(f'rombo {k}', (0.1 * math.sin(a), -0.11 - 0.1 * math.cos(a), -0.15), (0.015, 0.006, 0.02), coll, rombo, n=3)
    clay.sweep('gasa', [(-0.09, -0.11, 0.0), (-0.06, -0.08, 0.25), (0.0, -0.02, 0.33), (0.06, -0.08, 0.25), (0.09, -0.11, 0.0)], 0.012, (1, 0.5), coll,
               tela('gasa', '#E4566B'), segments=6, samples=4)
    for sx in (-1, 1):
        for j in range(3):
            trazo(coll, f'borla mochila {sx}{j}', [(sx * 0.1, -0.12, -0.25), (sx * (0.11 + j * 0.005), -0.12, -0.34)], 0.004, tela('borla mochila', colores[j]))


def deco_chiva(coll):
    """Chiva de colores (bus de escalera) de artesanía."""
    colores = ('#E4566B', '#F7C948', '#3B6FB6', '#5FA85A')
    clay.rbox('carrocería chiva', (0, 0, 0.1), (0.16, 0.08, 0.06), coll, laca('chiva', '#F7C948', 0.35), p=6, n=4)
    clay.rbox('techo chiva', (0, 0, 0.19), (0.17, 0.09, 0.012), coll, laca('techo chiva', '#E4566B', 0.35), p=6, n=4)
    for k in range(4):
        clay.rbox(f'franja chiva {k}', (0, -0.081, 0.06 + k * 0.022), (0.155, 0.003, 0.008), coll, laca(f'franja chiva {colores[k]}', colores[k], 0.35), p=6, n=3)
    for k in range(5):
        clay.rbox(f'ventana chiva {k}', (-0.12 + k * 0.06, -0.082, 0.14), (0.02, 0.003, 0.022), coll, laca('ventana chiva', '#2B2422', 0.3), p=6, n=3)
    clay.rbox('capó chiva', (-0.2, 0, 0.08), (0.05, 0.07, 0.04), coll, laca('capó', '#3B6FB6', 0.35), p=6, n=4)
    for sx in (-0.17, 0.1):
        for sy in (-1, 1):
            # (la llanta se hace en el origen, se para y se lleva a su puesto)
            o = clay.lathe(f'llanta {sx}{sy}', [(0.0, -0.012), (0.035, -0.012), (0.035, 0.012), (0.0, 0.012)], coll, laca('llanta', '#1E1D1D', 0.6), segments=16)
            o.rotation_euler = (math.pi / 2, 0, 0)
            o.location = (sx, sy * 0.08, 0.035)
    for k in range(4):
        clay.rbox(f'maleta {k}', (-0.1 + k * 0.07, 0, 0.225), (0.025, 0.035, 0.022), coll, laca(f'maleta {colores[k]}', colores[(k + 1) % 4], 0.5), p=6, n=3)


def deco_guacamaya(coll):
    def plumas(c, s, p, cl, o):
        clay.blob('pico guacamaya', (0, -0.1 * s, 0.29 * s), (0.03 * s, 0.03 * s, 0.035 * s), c, laca('pico', '#F2EBDD', 0.3), n=4)
        for sx in (-1, 1):
            clay.blob(f'ala guacamaya {sx}', (sx * 0.12 * s, 0.02 * s, 0.15 * s), (0.03 * s, 0.07 * s, 0.1 * s), c, tela('ala guacamaya', '#3B6FB6'), n=5)
            clay.blob(f'ala amarilla {sx}', (sx * 0.125 * s, 0.0, 0.1 * s), (0.028 * s, 0.05 * s, 0.05 * s), c, tela('ala amarilla', '#F7C948'), n=4)
        clay.sweep('cola guacamaya', [(0, 0.09 * s, 0.1 * s), (0, 0.18 * s, 0.0)], [0.04 * s, 0.02 * s], (1, 0.4), c, tela('cola', '#3B6FB6'), segments=6, samples=2)
    peluche(coll, 'guacamaya', '#E4566B', '#FFFFFF', None, extras=plumas)


def deco_silleta(coll):
    """Silleta de la Feria de las Flores (Medellín) recostada."""
    mad = madera('silleta', '#B98559')
    clay.rbox('tabla silleta', (0, 0.04, 0.45), (0.28, 0.02, 0.45), coll, mad, p=6, n=4)
    for sx in (-1, 1):
        clay.sweep(f'pata silleta {sx}', [(sx * 0.25, 0.1, 0.0), (sx * 0.25, 0.04, 0.9)], 0.02, (1, 1), coll, mad, segments=6, samples=2)
    rng = np.random.default_rng(21)
    colores = ('#E4566B', '#F7C948', '#F39AB0', '#FFFFFF', '#F28C45', '#B45CFF')
    for k in range(60):
        x, z = rng.uniform(-0.25, 0.25), rng.uniform(0.1, 0.85)
        col = colores[int(rng.integers(0, len(colores)))]
        clay.blob(f'flor silleta {k}', (x, 0.0, z), (0.045, 0.03, 0.045), coll, tela(f'flor {col}', col), n=4)
    for k in range(12):
        x, z = rng.uniform(-0.26, 0.26), rng.uniform(0.1, 0.85)
        clay.blob(f'hoja silleta {k}', (x, 0.01, z), (0.05, 0.02, 0.02), coll, tela('hoja silleta', '#5FA85A'), n=4)
    corazon_plano('corazón silleta', (0, -0.04, 0.48), 0.2, coll, tela('corazón silleta', '#E4566B'), grosor=0.35)


def deco_bulto_cafe(coll):
    """Bulto de café de Colombia con granos regados."""
    costal = tela('costal', '#C8A878')
    clay.blob('bulto', (0, 0, 0.22), (0.2, 0.15, 0.22), coll, costal, n=10, p=2.6)
    clay.blob('amarre', (0, 0, 0.45), (0.06, 0.06, 0.04), coll, costal, n=5)
    clay.rbox('sello café', (0, -0.15, 0.24), (0.1, 0.004, 0.07), coll, papel('sello café', '#8A3A2A'), p=6, n=3)
    grano = laca('grano', '#5B3A2A', 0.4)
    rng = np.random.default_rng(9)
    for k in range(10):
        clay.blob(f'grano {k}', (rng.uniform(-0.25, 0.25), rng.uniform(-0.28, -0.16), 0.01), (0.014, 0.01, 0.008), coll, grano, n=3)


# ---------------------------------------------------------------------------
# 11. Pirata
# ---------------------------------------------------------------------------

def deco_timon(coll):
    """Timón de barco de madera colgado en la pared."""
    mad = madera('timón', '#8A5634')
    aro(coll, 'rueda timón', (0, -0.04, 0), 0.19, 'y', 0.025, mad, n=32)
    aro(coll, 'rueda dentro', (0, -0.04, 0), 0.06, 'y', 0.02, mad, n=20)
    clay.blob('centro timón', (0, -0.045, 0), (0.04, 0.03, 0.04), coll, oro('centro timón'), n=5)
    for k in range(8):
        a = 2 * math.pi * k / 8
        clay.sweep(f'rayo timón {k}', [(0.05 * math.cos(a), -0.04, 0.05 * math.sin(a)), (0.3 * math.cos(a), -0.04, 0.3 * math.sin(a))], [0.016, 0.012], (1, 1),
                   coll, mad, segments=6, samples=2)
        clay.blob(f'mango timón {k}', (0.3 * math.cos(a), -0.04, 0.3 * math.sin(a)), (0.022, 0.022, 0.022), coll, mad, n=4)


def deco_mapa_tesoro(coll):
    """Mapa del tesoro con la X y el camino punteado."""
    viejo = papel('mapa viejo', '#E8CF9A')
    clay.rbox('mapa', (0, -0.006, 0), (0.28, 0.006, 0.2), coll, viejo, p=10, n=4)
    for sx in (-1, 1):
        clay.blob(f'clavo mapa {sx}', (sx * 0.26, -0.016, 0.18), (0.012, 0.008, 0.012), coll, metal('clavo'), n=3)
    y = -0.014
    plano(coll, 'isla', [(-0.18, -0.1), (-0.05, -0.14), (0.12, -0.1), (0.2, 0.02), (0.1, 0.12), (-0.08, 0.1), (-0.2, 0.02)], y, papel('isla', '#C9B27A'))
    for k in range(3):
        clay.blob(f'palmera mapa {k}', (-0.1 + k * 0.05, y - 0.004, 0.05), (0.02, 0.004, 0.016), coll, papel('palma mapa', '#5FA85A'), n=4)
    pts = [(-0.14, y - 0.004, -0.06), (-0.06, y - 0.004, -0.02), (0.02, y - 0.004, -0.07), (0.1, y - 0.004, 0.0)]
    for k in range(10):
        t = k / 9
        i = min(2, int(t * 3))
        u = t * 3 - i
        p0, p1 = np.array(pts[i]), np.array(pts[i + 1])
        q = p0 + (p1 - p0) * u
        clay.blob(f'paso {k}', tuple(q), (0.006, 0.003, 0.006), coll, laca('camino', '#8A3A2A', 0.6), n=3)
    rojo = laca('x tesoro', '#E4566B', 0.4)
    trazo(coll, 'x a', [(0.08, y - 0.006, -0.02), (0.12, y - 0.006, 0.02)], 0.007, rojo)
    trazo(coll, 'x b', [(0.08, y - 0.006, 0.02), (0.12, y - 0.006, -0.02)], 0.007, rojo)
    aro(coll, 'rosa vientos', (-0.2, y - 0.004, 0.13), 0.035, 'y', 0.004, laca('rosa vientos', '#3A2A2A', 0.6), n=16)


def deco_barco_botella(coll):
    """Barquito pirata dentro de una botella, sobre su soporte."""
    mad = madera('soporte botella', '#8A5634')
    for sx in (-1, 1):
        clay.rbox(f'soporte {sx}', (sx * 0.1, 0, 0.02), (0.015, 0.05, 0.02), coll, mad, p=6, n=3)
    o = clay.lathe('botella', [(0.0, -0.16), (0.07, -0.16), (0.075, -0.12), (0.075, 0.1), (0.04, 0.14), (0.025, 0.17), (0.025, 0.2)], coll,
                   transparente('botella', '#CFEFE3', 0.3), segments=28, cap_top=False)
    o.rotation_euler = (0, math.pi / 2, 0)
    o.location = (0, 0, 0.085)
    corcho = clay.lathe('corcho', [(0.0, 0.2), (0.024, 0.2), (0.026, 0.24), (0.0, 0.24)], coll, madera('corcho', '#C9956A'), segments=12)
    corcho.rotation_euler = (0, math.pi / 2, 0)
    corcho.location = (0, 0, 0.085)
    clay.blob('casco barco', (0, 0, 0.055), (0.08, 0.03, 0.022), coll, madera('casco', '#6B4A3A'), n=6,
              shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.minimum(v[:, 2], 0.008)]))
    clay.sweep('mástil barco', [(0, 0, 0.06), (0, 0, 0.14)], 0.004, (1, 1), coll, madera('mástil', '#6B4A3A'), segments=4, samples=2)
    prisma(coll, 'vela', [(-0.04, 0.075), (0.04, 0.075), (0.03, 0.135), (-0.03, 0.135)], -0.002, 0.002, tela('vela', '#F2EBDD'), eje='y')
    clay.blob('bandera pirata', (0.012, 0, 0.145), (0.012, 0.002, 0.008), coll, laca('bandera negra', '#1E1D1D', 0.4), n=3)


def deco_loro(coll):
    def pirata(c, s, p, cl, o):
        clay.blob('pico loro', (0, -0.1 * s, 0.28 * s), (0.03 * s, 0.035 * s, 0.035 * s), c, laca('pico loro', '#F7C948', 0.3), n=4)
        clay.blob('parche', (-0.035 * s, -0.09 * s, 0.335 * s), (0.02 * s, 0.006 * s, 0.018 * s), c, laca('parche', '#1E1D1D', 0.4), n=4)
        trazo(c, 'cinta parche', [(-0.1 * s, -0.02 * s, 0.37 * s), (-0.035 * s, -0.09 * s, 0.34 * s), (0.06 * s, -0.07 * s, 0.37 * s)], 0.004 * s, laca('parche', '#1E1D1D', 0.4))
        prisma(c, 'sombrero pirata', [(-0.1 * s, 0.39 * s), (0.1 * s, 0.39 * s), (0.0, 0.46 * s)], -0.03 * s, 0.03 * s, laca('sombrero pirata', '#1E1D1D', 0.5), eje='y')
        clay.blob('calavera', (0, -0.035 * s, 0.415 * s), (0.012 * s, 0.004 * s, 0.012 * s), c, laca('calavera', '#FFFFFF', 0.4), n=3)
        for sx in (-1, 1):
            clay.blob(f'ala loro {sx}', (sx * 0.12 * s, 0.02 * s, 0.15 * s), (0.03 * s, 0.07 * s, 0.1 * s), c, tela('ala loro', '#F7C948'), n=5)
    peluche(coll, 'loro', '#5FA85A', '#C9F2B8', None, extras=pirata)


def deco_cofre(coll):
    """Cofre del tesoro abierto con monedas de oro."""
    mad = madera('cofre', '#8A5634')
    herraje = oro('herraje')
    clay.rbox('caja cofre', (0, 0, 0.13), (0.24, 0.15, 0.13), coll, mad, p=6, n=4)
    tapa = clay.blob('tapa cofre', (0, 0.17, 0.33), (0.24, 0.05, 0.13), coll, mad, n=8,
                     shaper=lambda v: np.column_stack([v[:, 0], np.maximum(v[:, 1], -0.02), v[:, 2]]))
    del tapa
    for sx in (-1, 0, 1):
        clay.rbox(f'herraje {sx}', (sx * 0.17, -0.152, 0.13), (0.015, 0.004, 0.13), coll, herraje, p=6, n=3)
    clay.rbox('cerradura', (0, -0.156, 0.2), (0.025, 0.006, 0.03), coll, herraje, p=6, n=3)
    rng = np.random.default_rng(14)
    for k in range(40):
        x, y = rng.uniform(-0.2, 0.2), rng.uniform(-0.12, 0.12)
        z = 0.26 + 0.05 * (1 - (x / 0.22) ** 2) * (1 - (y / 0.14) ** 2) + rng.uniform(-0.01, 0.01)
        clay.lathe(f'moneda {k}', [(0.0, 0.0), (0.025, 0.0), (0.025, 0.006), (0.0, 0.006)], coll, herraje, segments=12, subsurf=0).location = (x, y, z)
    for k, col in enumerate(('#E4566B', '#3BB3E4', '#5FA85A')):
        clay.blob(f'gema cofre {k}', (-0.1 + k * 0.1, -0.05, 0.3), (0.018, 0.018, 0.018), coll, laca(f'gema {col}', col, 0.1), n=4)


def deco_barril(coll):
    """Barril de madera con aros de hierro."""
    mad = madera('barril', '#A0683C')
    clay.lathe('barril', [(0.0, 0.0), (0.17, 0.0), (0.2, 0.15), (0.21, 0.28), (0.2, 0.41), (0.17, 0.56), (0.0, 0.56)], coll, mad, segments=24)
    for k, (z, r) in enumerate(((0.06, 0.18), (0.18, 0.205), (0.38, 0.205), (0.5, 0.18))):
        aro(coll, f'aro barril {k}', (0, 0, z), r + 0.004, 'z', 0.012, metal('aro barril', '#4A4A4A', 0.5), n=24)
    for k in range(12):
        a = 2 * math.pi * k / 12
        clay.sweep(f'duela {k}', [(0.17 * math.cos(a), 0.17 * math.sin(a), 0.02), (0.212 * math.cos(a), 0.212 * math.sin(a), 0.28),
                                   (0.17 * math.cos(a), 0.17 * math.sin(a), 0.54)], 0.003, (1, 1), coll, madera('juntura', '#6B4A3A'), segments=4, samples=3)


# ---------------------------------------------------------------------------
# 12. Bosque (cabaña)
# ---------------------------------------------------------------------------

def deco_reloj_cucu(coll):
    """Reloj cucú de cabañita con su pajarito."""
    mad = madera('cucú', '#8A5634')
    clay.rbox('casita cucú', (0, -0.05, -0.02), (0.13, 0.05, 0.14), coll, mad, p=8, n=4)
    for sx in (-1, 1):
        # (cada tabla del techo se hace en el origen, se inclina y se lleva a su puesto)
        o = clay.rbox(f'techo cucú {sx}', (0, 0, 0), (0.1, 0.065, 0.012), coll, madera('techo cucú', '#5B3A2A'), p=6, n=3)
        o.rotation_euler = (0, sx * 0.6, 0)
        o.location = (sx * 0.075, -0.05, 0.16)
    o = clay.lathe('carátula', [(0.0, 0.0), (0.07, 0.0), (0.07, 0.008), (0.0, 0.008)], coll, papel('carátula', '#FFF8EC'), segments=28)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (0, -0.1, -0.03)
    trazo(coll, 'aguja h', [(0, -0.112, -0.03), (0.03, -0.112, -0.01)], 0.004, laca('aguja', '#2B2422', 0.3))
    trazo(coll, 'aguja m', [(0, -0.112, -0.03), (0, -0.112, 0.025)], 0.003, laca('aguja', '#2B2422', 0.3))
    clay.blob('pajarito', (0, -0.12, 0.09), (0.025, 0.02, 0.02), coll, laca('pajarito', '#F7C948', 0.4), n=4)
    for k, x in enumerate((-0.05, 0.05)):
        clay.sweep(f'cadena {k}', [(x, -0.03, -0.16), (x, -0.03, -0.32)], 0.003, (1, 1), coll, metal('cadena'), segments=4, samples=2)
        clay.blob(f'piña {k}', (x, -0.03, -0.35), (0.018, 0.018, 0.04), coll, madera('piña', '#5B3A2A'), n=4)
    for k in range(3):
        clay.blob(f'hoja cucú {k}', (-0.06 + k * 0.06, -0.1, 0.12), (0.025, 0.006, 0.012), coll, laca('hoja cucú', '#5FA85A', 0.6), n=3)


def deco_cuadro_pinos(coll):
    """Bosque de pinos y un lago (cuadro)."""
    hx, hz = _marco(coll, 0.64, 0.46, '#6B4A3A', '#DCE8D2')
    y = -0.026
    plano(coll, 'montaña atrás', [(-hx, -0.02), (-0.1, 0.14), (0.05, 0.04), (0.18, 0.16), (hx, 0.0), (hx, -0.05), (-hx, -0.05)], y, papel('montaña', '#9DB8A0'))
    plano(coll, 'lago', [(-hx, -hz), (hx, -hz), (hx, -0.1), (-hx, -0.08)], y - 0.004, papel('lago', '#8EC5F0'))
    for k, (x, h) in enumerate(((-0.24, 0.16), (-0.17, 0.2), (-0.1, 0.14), (0.14, 0.18), (0.22, 0.22))):
        plano(coll, f'pino {k}', [(x - 0.04, -0.08), (x + 0.04, -0.08), (x, -0.08 + h)], y - 0.008, papel('pino', '#2F7A4F'))


def deco_hongos(coll):
    """Lámpara de hongos que brillan (para la mesa de noche)."""
    clay.blob('musgo', (0, 0, 0.02), (0.12, 0.09, 0.03), coll, tela('musgo', '#6BA35A'), n=6)
    for k, (x, y, h, r) in enumerate(((-0.04, 0.0, 0.16, 0.06), (0.05, 0.02, 0.11, 0.045), (0.02, -0.05, 0.07, 0.03))):
        clay.lathe(f'tallo hongo {k}', [(0.0, 0.02), (r * 0.35, 0.02), (r * 0.3, h), (0.0, h)], coll, laca('tallo hongo', '#FFF4E4', 0.5), segments=14).location = (x, y, 0)
        clay.blob(f'sombrero hongo {k}', (x, y, h), (r, r, r * 0.6), coll, luz('tinte hongo', '#FF6B8A', 0.8), n=8,
                  shaper=lambda v, r=r: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], -r * 0.1)]))
        for j in range(4):
            a = 2 * math.pi * j / 4 + k
            clay.blob(f'punto hongo {k}{j}', (x + r * 0.55 * math.cos(a), y + r * 0.55 * math.sin(a), h + r * 0.4), (r * 0.15, r * 0.15, r * 0.1), coll,
                      laca('punto hongo', '#FFFFFF', 0.4), n=3)


def deco_zorro(coll):
    def cola(c, s, p, cl, o):
        clay.sweep('cola zorro', [(0.1 * s, 0.05 * s, 0.05 * s), (0.2 * s, 0.0, 0.1 * s), (0.2 * s, -0.08 * s, 0.2 * s)], [0.05 * s, 0.07 * s, 0.04 * s], (1, 1), c, p,
                   segments=8, samples=4)
        clay.blob('punta cola', (0.2 * s, -0.09 * s, 0.23 * s), (0.04 * s, 0.04 * s, 0.04 * s), c, cl, n=4)
    peluche(coll, 'zorro', '#F28C45', '#FFF4E4', 'gato', extras=cola)


def deco_tronco(coll):
    """Tronco cortado con hongos y un musgo (asiento del bosque)."""
    clay.lathe('tronco', [(0.0, 0.0), (0.2, 0.0), (0.19, 0.38), (0.0, 0.38)], coll, madera('corteza', '#6B4A3A'), segments=24)
    clay.lathe('corte tronco', [(0.0, 0.38), (0.185, 0.38), (0.185, 0.385), (0.0, 0.385)], coll, madera('corte', '#D8B27A'), segments=24)
    for k, r in enumerate((0.05, 0.1, 0.15)):
        aro(coll, f'anillo tronco {k}', (0, 0, 0.386), r, 'z', 0.003, madera('anillo', '#A0683C'), n=24)
    for k, (a, z) in enumerate(((0.3, 0.1), (0.8, 0.16), (-0.4, 0.08))):
        x, y = 0.2 * math.cos(a - math.pi / 2), 0.2 * math.sin(a - math.pi / 2)
        clay.blob(f'hongo tronco {k}', (x, y, z), (0.04, 0.03, 0.02), coll, laca('hongo tronco', '#E4566B', 0.4), n=5)
    clay.blob('musgo tronco', (0.0, 0.0, 0.4), (0.08, 0.06, 0.02), coll, tela('musgo', '#6BA35A'), n=5)


def deco_pino(coll):
    """Pino en matera (verde de bosque, con piñas)."""
    h = matera(coll, 0.15, 0.2, '#8A5634')
    clay.sweep('tronco pino', [(0, 0, h), (0, 0, h + 0.2)], 0.035, (1, 1), coll, madera('tronco pino', '#6B4A3A'), segments=8, samples=2)
    verde = tela('pino', '#2F7A4F')
    for k in range(4):
        z = h + 0.15 + k * 0.2
        r = 0.3 - k * 0.06
        clay.lathe(f'copa pino {k}', [(0.0, z), (r, z), (0.0, z + 0.32)], coll, verde, segments=20)
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.5
        clay.blob(f'piña pino {k}', (0.2 * math.cos(a), 0.2 * math.sin(a), h + 0.25), (0.025, 0.025, 0.035), coll, madera('piña', '#8A5634'), n=4)


# ---------------------------------------------------------------------------
# 13. Kawaii (pastel)
# ---------------------------------------------------------------------------

def deco_nube_arcoiris(coll):
    """Arcoíris con dos nubes sonrientes (de pared)."""
    colores = ('#F39AB0', '#F7C948', '#8FD6B9', '#8EC5F0', '#C9B6EA')
    for k, col in enumerate(colores):
        r = 0.26 - k * 0.04
        clay.sweep(f'arco {k}', [(r * math.cos(a), -0.02, r * math.sin(a) - 0.08) for a in np.linspace(0, math.pi, 14)], 0.02, (1, 0.6), coll,
                   laca(f'arco {col}', col, 0.4), segments=6, samples=3)
    for sx in (-1, 1):
        for k, (dx, dz, r) in enumerate(((0.0, 0.0, 0.07), (-0.06, -0.01, 0.05), (0.06, -0.01, 0.05))):
            clay.blob(f'nube {sx} {k}', (sx * 0.2 + dx, -0.04, -0.1 + dz), (r, 0.035, r * 0.8), coll, tela('nube', '#FFFFFF'), n=6)
        for ex in (-1, 1):
            clay.blob(f'ojito nube {sx}{ex}', (sx * 0.2 + ex * 0.02, -0.077, -0.09), (0.006, 0.003, 0.008), coll, laca('ojito', '#2B2422', 0.2), n=3)
        clay.blob(f'cachete nube {sx}', (sx * 0.2 + 0.04, -0.075, -0.105), (0.012, 0.003, 0.008), coll, laca('cachete', '#F39AB0', 0.4), n=3)


def deco_neon_corazon(coll):
    """Corazón de neón sobre acrílico (el color se puede cambiar)."""
    clay.rbox('acrílico corazón', (0, -0.012, 0), (0.24, 0.012, 0.22), coll, transparente('acrílico', '#1E2230', 0.45), p=6, n=4)
    pts = []
    for t in np.linspace(0, 2 * math.pi, 28, endpoint=False):
        x = 16 * math.sin(t) ** 3
        z = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x * 0.011, -0.034, z * 0.011 + 0.01))
    clay.sweep('neón corazón', pts, 0.012, (1, 1), coll, luz('tinte neón corazón', '#FF4FA3', 4.0), segments=8, samples=3, closed=True)


def deco_leche_fresa(coll):
    """Cajita de leche de fresa con carita (kawaii)."""
    rosa = laca('caja leche', '#F7C6D2', 0.35)
    clay.rbox('caja leche', (0, 0, 0.1), (0.06, 0.06, 0.1), coll, rosa, p=8, n=4)
    prisma(coll, 'techo leche', [(-0.062, 0.2), (0.062, 0.2), (0.0, 0.25)], -0.062, 0.062, rosa, y=0.0, eje='y')
    for sx in (-1, 1):
        clay.blob(f'ojo leche {sx}', (sx * 0.022, -0.062, 0.12), (0.008, 0.004, 0.01), coll, laca('ojo', '#2B2422', 0.2), n=3)
        clay.blob(f'cachete leche {sx}', (sx * 0.035, -0.062, 0.1), (0.01, 0.003, 0.006), coll, laca('cachete', '#E4566B', 0.4), n=3)
    trazo(coll, 'sonrisa leche', [(-0.01, -0.063, 0.105), (0, -0.064, 0.1), (0.01, -0.063, 0.105)], 0.003, laca('ojo', '#2B2422', 0.2))
    clay.blob('fresa leche', (0, -0.062, 0.05), (0.02, 0.004, 0.022), coll, laca('fresa', '#E4566B', 0.4), n=4)
    clay.sweep('pitillo', [(0.03, 0.02, 0.22), (0.04, 0.02, 0.3), (0.07, 0.02, 0.33)], 0.006, (1, 1), coll, laca('pitillo', '#FFFFFF', 0.3), segments=6, samples=3)


def deco_nube_peluche(coll):
    """Peluche de nube con carita y cachetes."""
    blanco = tela('nube peluche', '#FFFFFF')
    for k, (x, z, r) in enumerate(((0.0, 0.16, 0.13), (-0.12, 0.1, 0.1), (0.12, 0.1, 0.1), (-0.06, 0.06, 0.1), (0.06, 0.06, 0.1))):
        clay.blob(f'nube peluche {k}', (x, 0, z), (r, r * 0.8, r), coll, blanco, n=8)
    for sx in (-1, 1):
        clay.blob(f'ojo nube peluche {sx}', (sx * 0.04, -0.105, 0.15), (0.012, 0.006, 0.016), coll, laca('ojo', '#2B2422', 0.2), n=3)
        clay.blob(f'cachete nube peluche {sx}', (sx * 0.075, -0.1, 0.12), (0.02, 0.006, 0.012), coll, tela('cachete', '#F39AB0'), n=3)
    trazo(coll, 'boca nube', [(-0.015, -0.11, 0.125), (0, -0.112, 0.118), (0.015, -0.11, 0.125)], 0.004, laca('ojo', '#2B2422', 0.2))


def deco_lampara_estrella(coll):
    """Lámpara de pie con una estrella que brilla."""
    base = laca('base estrella', '#F7C6D2', 0.35)
    clay.lathe('base lámpara estrella', [(0.0, 0.0), (0.14, 0.0), (0.14, 0.025), (0.0, 0.035)], coll, base, segments=24)
    clay.sweep('palo estrella', [(0, 0, 0.03), (0, 0, 1.05)], 0.014, (1, 1), coll, base, segments=6, samples=2)
    pts = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        r = 0.25 if k % 2 == 0 else 0.11
        pts.append((r * math.cos(a), r * math.sin(a) + 1.2))
    prisma(coll, 'estrella lámpara', pts, -0.04, 0.04, luz('tinte estrella', '#F7C948', 1.2), y=0.0, eje='y')


# ---------------------------------------------------------------------------
# 14. Biblioteca (lectora y psicóloga)
# ---------------------------------------------------------------------------

def deco_repisa_libros(coll):
    """Repisa flotante con libros, una matica y un cerebrito."""
    mad = madera('repisa', '#C9956A')
    clay.rbox('tabla repisa', (0, -0.1, -0.12), (0.3, 0.1, 0.015), coll, mad, p=6, n=3)
    colores = ('#3B6FB6', '#E4566B', '#F7C948', '#8FD6B9', '#C9B6EA', '#F28C45')
    x = -0.28
    for k in range(9):
        w, h = 0.03 + 0.01 * (k % 3), 0.17 + 0.03 * ((k * 7) % 4) / 3
        col = colores[k % len(colores)]
        clay.rbox(f'libro repisa {k}', (x + w / 2, -0.1, -0.105 + h / 2), (w / 2, 0.075, h / 2), coll, laca(f'libro {col}', col, 0.5), p=8, n=3)
        x += w + 0.004
    clay.blob('cerebro', (0.2, -0.1, -0.06), (0.05, 0.045, 0.045), coll, laca('cerebro', '#F39AB0', 0.4), n=6)
    for k in range(4):
        trazo(coll, f'surco cerebro {k}', [(0.16 + k * 0.02, -0.14, -0.03), (0.17 + k * 0.02, -0.145, -0.06), (0.16 + k * 0.02, -0.14, -0.09)], 0.004,
              laca('surco cerebro', '#E4566B', 0.4))


def deco_cuadro_cerebro(coll):
    """Lámina antigua de un cerebro (para la psicóloga)."""
    hx, hz = _marco(coll, 0.46, 0.6, '#8A5634', '#F2E6CC')
    y = -0.026
    clay.blob('cerebro lámina', (0, y, 0.04), (0.14, 0.008, 0.11), coll, laca('cerebro lámina', '#F7C6D2', 0.4), n=8)
    tinta = laca('tinta lámina', '#8A3A2A', 0.6)
    for k in range(6):
        z = 0.12 - k * 0.035
        trazo(coll, f'giro {k}', [(-0.12 + 0.01 * (k % 2), y - 0.01, z), (-0.05, y - 0.01, z + 0.015), (0.03, y - 0.01, z - 0.01), (0.11, y - 0.01, z + 0.01)], 0.003, tinta)
    clay.blob('cerebelo', (0.08, y, -0.06), (0.05, 0.008, 0.035), coll, laca('cerebelo', '#E7A5B8', 0.4), n=5)
    for k in range(4):
        trazo(coll, f'renglón {k}', [(-0.16, y - 0.004, -0.14 - k * 0.025), (0.16 - k * 0.04, y - 0.004, -0.14 - k * 0.025)], 0.0025, tinta)


def deco_lampara_banquero(coll):
    """Lámpara de banquero con pantalla verde."""
    dorado = oro('lámpara banquero')
    clay.rbox('base banquero', (0, 0, 0.02), (0.1, 0.06, 0.02), coll, dorado, p=6, n=3)
    clay.sweep('brazo banquero', [(0, 0.02, 0.04), (0, 0.02, 0.22)], 0.01, (1, 1), coll, dorado, segments=6, samples=2)
    clay.blob('pantalla banquero', (0, -0.01, 0.24), (0.13, 0.06, 0.04), coll, _mat('Deco | vidrio verde', '#2F7A4F', rough=0.15, coat=0.6), n=8,
              shaper=lambda v: np.column_stack([v[:, 0], v[:, 1], np.maximum(v[:, 2], -0.015)]))
    clay.blob('luz banquero', (0, -0.01, 0.225), (0.09, 0.03, 0.006), coll, luz('luz banquero', '#FFE7A8', 3.0), n=5)
    clay.sweep('cadenita', [(0.05, -0.04, 0.22), (0.05, -0.045, 0.16)], 0.002, (1, 1), coll, dorado, segments=4, samples=2)


def deco_buho(coll):
    def buho(c, s, p, cl, o):
        for sx in (-1, 1):
            clay.blob(f'ojo grande buho {sx}', (sx * 0.04 * s, -0.08 * s, 0.33 * s), (0.032 * s, 0.01 * s, 0.032 * s), c, tela('ojo buho', '#FFFFFF'), n=5)
            clay.blob(f'pupila buho {sx}', (sx * 0.04 * s, -0.09 * s, 0.33 * s), (0.014 * s, 0.006 * s, 0.014 * s), c, o, n=4)
            aro(c, f'gafas {sx}', (sx * 0.04 * s, -0.095 * s, 0.33 * s), 0.036 * s, 'y', 0.004 * s, oro('gafas'), n=14)
            clay.blob(f'penacho {sx}', (sx * 0.07 * s, 0.0, 0.41 * s), (0.02 * s, 0.015 * s, 0.035 * s), c, p, n=4)
        clay.blob('pico buho', (0, -0.1 * s, 0.29 * s), (0.012 * s, 0.012 * s, 0.018 * s), c, laca('pico buho', '#F7A93B', 0.3), n=3)
        clay.rbox('librito', (0, -0.14 * s, 0.1 * s), (0.06 * s, 0.01 * s, 0.045 * s), c, laca('librito', '#E4566B', 0.4), p=6, n=3)
    peluche(coll, 'búho', '#A67C52', '#F2DDB8', None, extras=buho)


def deco_pila_libros(coll):
    """Torre de libros gordos en el piso con una matica encima."""
    colores = ('#3B6FB6', '#8A3A2A', '#2F7A4F', '#F7C948', '#E4566B', '#C9B6EA', '#3A2A22')
    z = 0.0
    for k, col in enumerate(colores):
        h = 0.06 + 0.015 * (k % 3)
        o = clay.rbox(f'libro pila {k}', (0, 0, z + h / 2), (0.16 - 0.01 * (k % 3), 0.11, h / 2), coll, laca(f'libro {col}', col, 0.5), p=8, n=3)
        o.rotation_euler = (0, 0, (k - 3) * 0.07)
        clay.rbox(f'hojas pila {k}', (0.006, 0, z + h / 2), (0.15 - 0.01 * (k % 3), 0.105, h / 2 - 0.008), coll, papel('hojas', '#FFF8EC'), p=8, n=3,
                  subsurf=0).rotation_euler = (0, 0, (k - 3) * 0.07)
        z += h
    clay.lathe('matera pila', [(0.0, z), (0.05, z), (0.06, z + 0.07), (0.0, z + 0.07)], coll, laca('matera pila', '#F2EBDD', 0.5), segments=16)
    hoja = laca('hoja pila', '#5FA85A', 0.6)
    for k in range(6):
        a = 2 * math.pi * k / 6
        clay.blob(f'hoja pila {k}', (0.04 * math.cos(a), 0.04 * math.sin(a), z + 0.11), (0.035, 0.035, 0.02), coll, hoja, n=4)


# ---------------------------------------------------------------------------
# 15. Navidad
# ---------------------------------------------------------------------------

def deco_corona_navidad(coll):
    """Corona de Navidad con moño rojo y bolitas."""
    verde = tela('corona navidad', '#2F7A4F')
    for k in range(18):
        a = 2 * math.pi * k / 18
        clay.blob(f'rama corona {k}', (0.17 * math.cos(a), -0.03, 0.17 * math.sin(a)), (0.06, 0.03, 0.05), coll, verde, n=5)
    for k, col in enumerate(('#E4566B', '#F7C948', '#E4566B', '#FFFFFF', '#E4566B', '#F7C948')):
        a = 2 * math.pi * k / 6 + 0.3
        clay.blob(f'bolita corona {k}', (0.19 * math.cos(a), -0.07, 0.19 * math.sin(a)), (0.022, 0.022, 0.022), coll, laca(f'bolita {col}', col, 0.2), n=4)
    rojo = tela('moño navidad', '#E4566B')
    for sx in (-1, 1):
        clay.blob(f'lazo navidad {sx}', (sx * 0.05, -0.07, -0.17), (0.05, 0.02, 0.03), coll, rojo, n=5)
        clay.sweep(f'cinta navidad {sx}', [(0, -0.07, -0.18), (sx * 0.04, -0.07, -0.26)], 0.012, (1, 0.3), coll, rojo, segments=6, samples=2)
    clay.blob('nudo navidad', (0, -0.075, -0.17), (0.022, 0.02, 0.02), coll, rojo, n=4)


def deco_medias(coll):
    """Dos medias de Navidad colgadas (una de Él y una de Ella)."""
    trazo(coll, 'repisa medias', [(-0.25, -0.02, 0.12), (0.25, -0.02, 0.12)], 0.015, madera('repisa medias', '#8A5634'))
    for k, (x, col) in enumerate(((-0.12, '#E4566B'), (0.12, '#2F7A4F'))):
        tela_m = tela(f'media {col}', col)
        clay.rbox(f'caña media {k}', (x, -0.04, -0.02), (0.05, 0.02, 0.1), coll, tela_m, p=3, n=5)
        clay.blob(f'pie media {k}', (x + 0.03, -0.04, -0.13), (0.08, 0.022, 0.045), coll, tela_m, n=6)
        clay.rbox(f'borde media {k}', (x, -0.045, 0.08), (0.058, 0.026, 0.025), coll, tela('borde media', '#FFFFFF'), p=3, n=4)
        corazon_plano(f'corazón media {k}', (x, -0.065, -0.02), 0.06, coll, laca('corazón media', '#F7C948', 0.35), grosor=0.3)


def deco_casita_jengibre(coll):
    """Casita de galleta de jengibre con glaseado y dulces."""
    galleta = laca('jengibre', '#B97A45', 0.6)
    glaseado = laca('glaseado', '#FFFFFF', 0.4)
    clay.rbox('casita', (0, 0, 0.07), (0.09, 0.07, 0.07), coll, galleta, p=6, n=4)
    prisma(coll, 'techo jengibre', [(-0.11, 0.135), (0.11, 0.135), (0.0, 0.225)], 0.0, 0.17, galleta, y=0.085, eje='y')
    for sx in (-1, 1):
        trazo(coll, f'nieve alero {sx}', [(sx * 0.11, -0.088, 0.135), (0.0, -0.088, 0.225)], 0.009, glaseado)
    trazo(coll, 'nieve techo', [(0.0, -0.085, 0.228), (0.0, 0.085, 0.228)], 0.01, glaseado)
    clay.blob('puerta jengibre', (0, -0.071, 0.04), (0.022, 0.005, 0.035), coll, laca('puerta dulce', '#E4566B', 0.4), n=4)
    for sx in (-1, 1):
        aro(coll, f'ventana jengibre {sx}', (sx * 0.05, -0.072, 0.09), 0.016, 'y', 0.004, glaseado, n=12)
    for k, col in enumerate(('#E4566B', '#8FD6B9', '#F7C948', '#C9B6EA')):
        clay.blob(f'dulce {k}', (-0.06 + k * 0.04, -0.075, 0.13), (0.008, 0.006, 0.008), coll, laca(f'dulce {col}', col, 0.2), n=3)


def deco_reno(coll):
    def cachos(c, s, p, cl, o):
        cacho = madera('cacho', '#8A5634')
        for sx in (-1, 1):
            clay.sweep(f'cacho {sx}', [(sx * 0.05 * s, 0, 0.38 * s), (sx * 0.08 * s, 0, 0.47 * s), (sx * 0.12 * s, 0, 0.52 * s)], 0.01 * s, (1, 1), c, cacho, segments=5, samples=3)
            clay.sweep(f'rama cacho {sx}', [(sx * 0.08 * s, 0, 0.47 * s), (sx * 0.05 * s, 0, 0.52 * s)], 0.008 * s, (1, 1), c, cacho, segments=5, samples=2)
        clay.blob('nariz roja', (0, -0.115 * s, 0.3 * s), (0.022 * s, 0.018 * s, 0.02 * s), c, laca('nariz roja', '#E4566B', 0.2), n=4)
        aro(c, 'bufanda reno', (0, 0, 0.23 * s), 0.09 * s, 'z', 0.022 * s, tela('bufanda reno', '#2F7A4F'), n=16)
    peluche(coll, 'reno', '#A67C52', '#F2DDB8', 'perro', extras=cachos)


def deco_muneco_nieve(coll):
    """Muñeco de nieve con bufanda y sombrero."""
    nieve = tela('nieve', '#FFFFFF')
    clay.blob('bola abajo', (0, 0, 0.2), (0.22, 0.22, 0.2), coll, nieve, n=10)
    clay.blob('bola medio', (0, 0, 0.5), (0.16, 0.16, 0.15), coll, nieve, n=10)
    clay.blob('bola cabeza', (0, 0, 0.73), (0.11, 0.11, 0.11), coll, nieve, n=10)
    for sx in (-1, 1):
        clay.blob(f'ojo nieve {sx}', (sx * 0.035, -0.1, 0.76), (0.012, 0.008, 0.014), coll, laca('carbón', '#2B2422', 0.3), n=3)
        clay.sweep(f'brazo nieve {sx}', [(sx * 0.14, 0, 0.52), (sx * 0.3, 0, 0.62), (sx * 0.34, 0, 0.7)], 0.01, (1, 1), coll, madera('rama', '#6B4A3A'), segments=5, samples=3)
    clay.sweep('zanahoria', [(0, -0.1, 0.73), (0, -0.2, 0.72)], [0.02, 0.004], (1, 1), coll, laca('zanahoria', '#F28C45', 0.4), segments=8, samples=2, caps=('flat', 'point'))
    for k in range(3):
        clay.blob(f'botón nieve {k}', (0, -0.155, 0.56 - k * 0.06), (0.014, 0.008, 0.014), coll, laca('carbón', '#2B2422', 0.3), n=3)
    aro(coll, 'bufanda nieve', (0, 0, 0.63), 0.12, 'z', 0.03, tela('bufanda nieve', '#E4566B'), n=16)
    clay.sweep('punta bufanda', [(0.06, -0.1, 0.62), (0.08, -0.13, 0.5)], 0.025, (1, 0.35), coll, tela('bufanda nieve', '#E4566B'), segments=6, samples=2)
    clay.lathe('sombrero nieve', [(0.0, 0.81), (0.13, 0.81), (0.13, 0.83), (0.08, 0.83), (0.08, 0.97), (0.0, 0.97)], coll, laca('sombrero nieve', '#2B2422', 0.4), segments=20)


def deco_regalos(coll):
    """Pila de regalos con moños."""
    for k, (x, y, z, w, h, col, lazo) in enumerate(((-0.1, 0.0, 0.0, 0.14, 0.16, '#E4566B', '#F7C948'), (0.12, 0.02, 0.0, 0.12, 0.12, '#3B6FB6', '#FFFFFF'),
                                                    (0.0, 0.0, 0.16, 0.1, 0.1, '#8FD6B9', '#E4566B'))):
        clay.rbox(f'regalo {k}', (x, y, z + h / 2), (w, w * 0.9, h / 2), coll, laca(f'regalo {col}', col, 0.35), p=8, n=4)
        cinta = laca(f'cinta {lazo}', lazo, 0.3)
        clay.rbox(f'cinta a {k}', (x, y, z + h / 2), (0.018, w * 0.9 + 0.003, h / 2 + 0.003), coll, cinta, p=8, n=3)
        clay.rbox(f'cinta b {k}', (x, y, z + h / 2), (w + 0.003, 0.018, h / 2 + 0.003), coll, cinta, p=8, n=3)
        for sx in (-1, 1):
            clay.blob(f'moño {k}{sx}', (x + sx * 0.025, y, z + h + 0.015), (0.03, 0.012, 0.02), coll, cinta, n=4)


# ---------------------------------------------------------------------------
# 16. Halloween
# ---------------------------------------------------------------------------

def murcielago(coll, nombre, c, e, mat):
    x, y, z = c
    clay.blob(f'{nombre} cuerpo', (x, y, z), (0.02 * e, 0.008, 0.028 * e), coll, mat, n=4)
    for sx in (-1, 1):
        pts = [(x + sx * 0.015 * e, z + 0.01 * e), (x + sx * 0.08 * e, z + 0.03 * e), (x + sx * 0.07 * e, z - 0.005 * e), (x + sx * 0.05 * e, z + 0.005 * e),
               (x + sx * 0.035 * e, z - 0.015 * e), (x + sx * 0.015 * e, z - 0.01 * e)]
        prisma(coll, f'{nombre} ala {sx}', pts if sx > 0 else pts[::-1], 0.0, 0.006, mat, y=y + 0.003, eje='y')
    for sx in (-1, 1):
        clay.blob(f'{nombre} oreja {sx}', (x + sx * 0.01 * e, y, z + 0.03 * e), (0.006 * e, 0.004, 0.01 * e), coll, mat, n=3)


def deco_murcielagos(coll):
    """Bandada de murciélagos de papel pegados en la pared."""
    negro = papel('murciélago', '#2B2422')
    for k, (x, z, e) in enumerate(((-0.2, 0.1, 1.3), (0.0, 0.18, 1.0), (0.18, 0.05, 1.5), (-0.08, -0.08, 0.9), (0.12, -0.15, 1.1))):
        murcielago(coll, f'murciélago {k}', (x, -0.006, z), e, negro)


def deco_luna_bruja(coll):
    """Luna llena con la silueta de una bruja en su escoba (cuadro)."""
    hx, hz = _marco(coll, 0.5, 0.62, '#2B2422', '#3D2E4F')
    y = -0.026
    clay.blob('luna bruja', (0.0, y, 0.05), (0.15, 0.004, 0.15), coll, luz('luna bruja', '#FFE7A8', 1.2), n=8)
    negro = papel('silueta', '#1E1D1D')
    trazo(coll, 'escoba bruja', [(-0.14, y - 0.008, 0.0), (0.12, y - 0.008, 0.1)], 0.006, negro)
    clay.blob('paja escoba', (-0.15, y - 0.008, -0.005), (0.035, 0.004, 0.02), coll, negro, n=4)
    clay.blob('bruja cuerpo', (0.0, y - 0.008, 0.07), (0.03, 0.004, 0.045), coll, negro, n=4)
    prisma(coll, 'sombrero bruja', [(-0.03, 0.11), (0.03, 0.11), (-0.01, 0.18)], 0.0, 0.004, negro, y=y - 0.006, eje='y')
    for k, (x, z) in enumerate(((-0.15, -0.2), (0.15, -0.18))):
        murcielago(coll, f'murcielaguito {k}', (x, y - 0.004, z), 0.6, negro)


def deco_calabaza(coll, grande=False):
    """Calabaza de Halloween con la cara que brilla."""
    e = 2.4 if grande else 1.0
    naranja = laca('calabaza', '#F28C45', 0.45)
    for k in range(8):
        a = 2 * math.pi * k / 8
        clay.blob(f'gajo {k}', (0.05 * e * math.cos(a), 0.05 * e * math.sin(a), 0.1 * e), (0.07 * e, 0.07 * e, 0.09 * e), coll, naranja, n=6)
    clay.sweep('tallo calabaza', [(0, 0, 0.18 * e), (0.01 * e, 0, 0.24 * e), (0.03 * e, 0, 0.25 * e)], 0.014 * e, (1, 1), coll, madera('tallo', '#6B7A3A'),
               segments=6, samples=3)
    brillo = luz('cara calabaza', '#FFB84D', 3.0)
    yf = -0.118 * e
    for sx in (-1, 1):
        prisma(coll, f'ojo calabaza {sx}', [(sx * 0.02 * e, 0.12 * e), (sx * 0.06 * e, 0.12 * e), (sx * 0.04 * e, 0.155 * e)], 0.0, 0.006, brillo, y=yf, eje='y')
    prisma(coll, 'boca calabaza', [(-0.06 * e, 0.07 * e), (-0.03 * e, 0.06 * e), (-0.015 * e, 0.075 * e), (0.0, 0.06 * e), (0.015 * e, 0.075 * e), (0.03 * e, 0.06 * e),
                                   (0.06 * e, 0.07 * e), (0.03 * e, 0.045 * e), (-0.03 * e, 0.045 * e)], 0.0, 0.006, brillo, y=yf, eje='y')


def deco_calabaza_grande(coll):
    deco_calabaza(coll, grande=True)


def deco_caldero(coll):
    """Caldero de bruja con una poción verde que burbujea."""
    clay.lathe('caldero', [(0.0, 0.02), (0.08, 0.02), (0.13, 0.08), (0.13, 0.15), (0.1, 0.19), (0.11, 0.2), (0.1, 0.2)], coll, laca('caldero', '#2B2422', 0.4),
               segments=28, cap_top=False)
    clay.lathe('poción', [(0.0, 0.17), (0.105, 0.17)], coll, luz('poción', '#7BD66B', 1.5), segments=28, cap_bottom=False)
    for k in range(5):
        a = 2 * math.pi * k / 5
        clay.blob(f'burbuja {k}', (0.05 * math.cos(a), 0.05 * math.sin(a), 0.18 + 0.01 * (k % 2)), (0.018, 0.018, 0.018), coll, luz('burbuja', '#B8F2A0', 1.2), n=4)
    for k in range(3):
        a = 2 * math.pi * k / 3
        clay.sweep(f'pata caldero {k}', [(0.08 * math.cos(a), 0.08 * math.sin(a), 0.04), (0.1 * math.cos(a), 0.1 * math.sin(a), 0.0)], 0.012, (1, 1), coll,
                   laca('caldero', '#2B2422', 0.4), segments=5, samples=2)


def deco_fantasma(coll):
    """Peluche de fantasmita con cachetes."""
    blanco = tela('fantasma', '#FFFFFF')
    clay.blob('fantasma', (0, 0, 0.18), (0.13, 0.11, 0.18), coll, blanco, n=10,
              shaper=lambda v: np.column_stack([v[:, 0] * (1 + 0.25 * np.clip(-v[:, 2] / 0.18, 0, 1)), v[:, 1], np.maximum(v[:, 2], -0.16)]))
    for k in range(5):
        clay.blob(f'onda fantasma {k}', (-0.12 + k * 0.06, 0, 0.025), (0.035, 0.1, 0.03), coll, blanco, n=5)
    for sx in (-1, 1):
        clay.blob(f'ojo fantasma {sx}', (sx * 0.04, -0.105, 0.24), (0.016, 0.006, 0.022), coll, laca('ojo', '#2B2422', 0.2), n=4)
        clay.blob(f'cachete fantasma {sx}', (sx * 0.07, -0.1, 0.2), (0.02, 0.005, 0.012), coll, tela('cachete', '#F39AB0'), n=3)
    clay.blob('boca fantasma', (0, -0.11, 0.19), (0.016, 0.005, 0.02), coll, laca('ojo', '#2B2422', 0.2), n=4)
    for sx in (-1, 1):
        clay.blob(f'bracito {sx}', (sx * 0.15, -0.02, 0.18), (0.04, 0.03, 0.025), coll, blanco, n=4)


def deco_escoba(coll):
    """Escoba de bruja recostada, con un sombrero puntudo."""
    palo = madera('palo escoba', '#8A5634')
    clay.sweep('palo escoba', [(0.0, 0.0, 0.25), (0.02, 0.08, 1.2)], 0.018, (1, 1), coll, palo, segments=8, samples=2)
    paja = tela('paja', '#D8B27A')
    clay.lathe('paja escoba', [(0.03, 0.3), (0.1, 0.02), (0.0, 0.0)], coll, paja, segments=20)
    aro(coll, 'amarre escoba', (0, 0.0, 0.27), 0.035, 'z', 0.01, tela('amarre', '#8A3A2A'), n=14)
    clay.lathe('ala sombrero bruja', [(0.0, 0.0), (0.16, 0.0), (0.16, 0.012), (0.0, 0.012)], coll, laca('sombrero bruja', '#3D2E4F', 0.5), segments=24).location = (0.25, -0.1, 0.0)
    clay.lathe('cono sombrero bruja', [(0.08, 0.012), (0.0, 0.26)], coll, laca('sombrero bruja', '#3D2E4F', 0.5), segments=20).location = (0.25, -0.1, 0.0)
    aro(coll, 'cinta sombrero', (0.25, -0.1, 0.03), 0.078, 'z', 0.01, laca('cinta sombrero', '#8FD66B', 0.4), n=16)


# ---------------------------------------------------------------------------
# 17. Cine
# ---------------------------------------------------------------------------

def deco_poster_cine(coll):
    """Afiche de película romántica: dos siluetas y un corazón gigante."""
    hx, hz = _marco(coll, 0.46, 0.66, '#E5B85C', '#40202A')
    y = -0.028
    corazon_plano('corazón cine', (0, y - 0.004, 0.08), 0.26, coll, laca('corazón cine', '#E4566B', 0.35), grosor=0.25)
    for sx in (-1, 1):
        clay.blob(f'silueta cabeza {sx}', (sx * 0.05, y - 0.01, -0.06), (0.03, 0.004, 0.03), coll, papel('silueta', '#1E1D1D'), n=4)
        clay.blob(f'silueta cuerpo {sx}', (sx * 0.05, y - 0.01, -0.14), (0.045, 0.004, 0.06), coll, papel('silueta', '#1E1D1D'), n=4)
    for k in range(3):
        trazo(coll, f'título cine {k}', [(-0.14 + k * 0.01, y - 0.004, 0.25 - k * 0.025), (0.14 - k * 0.03, y - 0.004, 0.25 - k * 0.025)], 0.006 - k * 0.001,
              laca('título', '#F7C948', 0.4))


def deco_claqueta(coll):
    """Claqueta de cine en la pared."""
    negro = laca('claqueta', '#1E1D1D', 0.35)
    clay.rbox('tablero claqueta', (0, -0.012, -0.03), (0.2, 0.012, 0.15), coll, negro, p=8, n=4)
    o = clay.rbox('palo claqueta', (0, 0, 0), (0.2, 0.012, 0.03), coll, negro, p=8, n=3)
    o.rotation_euler = (0, -0.25, 0)
    o.location = (0.0, -0.014, 0.17)
    for k in range(5):
        prisma(coll, f'raya claqueta {k}', [(-0.19 + k * 0.08, 0.125), (-0.15 + k * 0.08, 0.125), (-0.12 + k * 0.08, 0.1), (-0.16 + k * 0.08, 0.1)], 0.0, 0.004,
               laca('raya blanca', '#FFFFFF', 0.4), y=-0.024, eje='y')
    for k in range(3):
        trazo(coll, f'renglón claqueta {k}', [(-0.17, -0.026, 0.03 - k * 0.06), (0.17, -0.026, 0.03 - k * 0.06)], 0.003, laca('tiza', '#FFFFFF', 0.6))


def deco_palomitas(coll):
    """Balde de crispetas a rayas."""
    for k in range(10):
        a0 = 2 * math.pi * k / 10
        col = '#E4566B' if k % 2 else '#FFFFFF'
        pts = [(0.07 * math.cos(a0 + d), 0.07 * math.sin(a0 + d)) for d in np.linspace(0, 2 * math.pi / 10, 4)]
        verts = [(x, y, 0.0) for x, y in pts] + [(x * 1.45, y * 1.45, 0.2) for x, y in pts]
        n = len(pts)
        caras = [(j, j + 1, n + j + 1, n + j) for j in range(n - 1)]
        clay.make_mesh_object(f'franja balde {k}', verts, caras, coll, smooth=False, material=laca(f'balde {col}', col, 0.4))
    clay.lathe('fondo balde', [(0.0, 0.0), (0.07, 0.0)], coll, laca('balde blanco', '#FFFFFF', 0.4), segments=20, cap_top=False)
    rng = np.random.default_rng(31)
    maiz = tela('crispeta', '#FFF4D6')
    for k in range(36):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0, 0.1)
        z = 0.2 + 0.05 * (1 - r / 0.1) + rng.uniform(-0.01, 0.02)
        clay.blob(f'crispeta {k}', (r * math.cos(a), r * math.sin(a), z), (0.02, 0.02, 0.018), coll, maiz, n=4)


def deco_rollo_pelicula(coll):
    """Rollo de película con la cinta desenrollada."""
    plata = metal('rollo', '#B8BCC4', 0.3)
    o = clay.lathe('carrete', [(0.0, 0.0), (0.13, 0.0), (0.13, 0.012), (0.0, 0.012)], coll, plata, segments=32)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = (0, 0.02, 0.14)
    for k in range(5):
        a = 2 * math.pi * k / 5
        clay.blob(f'hueco carrete {k}', (0.07 * math.cos(a), 0.007, 0.14 + 0.07 * math.sin(a)), (0.028, 0.006, 0.028), coll, laca('hueco', '#2B2422', 0.4), n=4)
    cinta = laca('cinta película', '#2B2422', 0.35)
    clay.sweep('cinta', [(0.1, 0.0, 0.06), (0.2, -0.04, 0.01), (0.3, -0.02, 0.01)], 0.022, (1, 0.12), coll, cinta, segments=6, samples=4, up=(0, 0, 1))
    clay.blob('eje carrete', (0, 0.0, 0.14), (0.02, 0.02, 0.02), coll, plata, n=4)
    clay.rbox('base rollo', (0, 0.02, 0.012), (0.08, 0.04, 0.012), coll, laca('base rollo', '#40202A', 0.4), p=6, n=3)


def deco_silla_director(coll):
    """Silla de director de cine con su lona."""
    mad = madera('silla director', '#8A5634')
    lona = tela('lona director', '#1E1D1D')
    for sx in (-1, 1):
        clay.sweep(f'x pata {sx} a', [(sx * 0.2, -0.18, 0.0), (sx * 0.2, 0.18, 0.45)], 0.018, (1, 1), coll, mad, segments=6, samples=2)
        clay.sweep(f'x pata {sx} b', [(sx * 0.2, 0.18, 0.0), (sx * 0.2, -0.18, 0.45)], 0.018, (1, 1), coll, mad, segments=6, samples=2)
        clay.sweep(f'respaldo palo {sx}', [(sx * 0.2, 0.18, 0.45), (sx * 0.2, 0.2, 0.9)], 0.018, (1, 1), coll, mad, segments=6, samples=2)
        clay.sweep(f'brazo silla {sx}', [(sx * 0.2, -0.18, 0.6), (sx * 0.2, 0.19, 0.6)], 0.015, (1, 1), coll, mad, segments=6, samples=2)
    clay.rbox('asiento lona', (0, 0, 0.45), (0.19, 0.18, 0.01), coll, lona, p=6, n=3)
    clay.rbox('respaldo lona', (0, 0.195, 0.78), (0.2, 0.01, 0.09), coll, lona, p=6, n=3)
    letras(coll, 'YO', -0.07, 0.18, 0.78, 0.07, laca('letras silla', '#F7C948', 0.4), radio=0.008)


def deco_foco_cine(coll):
    """Reflector de estudio de cine en trípode."""
    negro = laca('foco', '#1E1D1D', 0.35)
    for k in range(3):
        a = 2 * math.pi * k / 3
        clay.sweep(f'pata foco {k}', [(0, 0, 0.8), (0.25 * math.cos(a), 0.25 * math.sin(a), 0.0)], 0.013, (1, 1), coll, metal('trípode foco', '#6B6E75'), segments=6,
                   samples=2)
    clay.sweep('poste foco', [(0, 0, 0.8), (0, 0, 1.1)], 0.015, (1, 1), coll, metal('trípode foco', '#6B6E75'), segments=6, samples=2)
    o = clay.lathe('cuerpo foco', [(0.0, 0.0), (0.1, 0.0), (0.13, 0.18), (0.12, 0.2)], coll, negro, segments=24, cap_top=False)
    o.rotation_euler = (math.pi / 2 + 0.3, 0, 0)
    o.location = (0, 0.05, 1.15)
    clay.blob('luz foco', (0, -0.14, 1.22), (0.11, 0.02, 0.11), coll, luz('luz foco', '#FFF4D6', 3.0), n=6)
    for sx in (-1, 1):
        clay.rbox(f'aleta foco {sx}', (sx * 0.17, -0.15, 1.22), (0.05, 0.004, 0.11), coll, negro, p=6, n=3)


# ---------------------------------------------------------------------------
# 18. Retro 80s
# ---------------------------------------------------------------------------

def deco_neon_palmera(coll):
    """Neón de palmera con atardecer (el color se puede cambiar)."""
    clay.rbox('acrílico palmera', (0, -0.012, 0), (0.26, 0.012, 0.26), coll, transparente('acrílico', '#1E2230', 0.45), p=6, n=4)
    y = -0.034
    sol = luz('tinte sol neón', '#FF7A45', 3.0)
    trazo(coll, 'sol neón', [(0.12 * math.cos(a), y, 0.12 * math.sin(a) - 0.06) for a in np.linspace(0, math.pi, 12)], 0.009, sol)
    trazo(coll, 'horizonte neón', [(-0.2, y, -0.06), (0.2, y, -0.06)], 0.009, sol)
    palma = luz('tinte palmera neón', '#35F0FF', 3.0)
    trazo(coll, 'tronco neón', [(-0.08, y - 0.004, -0.2), (-0.05, y - 0.004, 0.0), (-0.02, y - 0.004, 0.16)], 0.009, palma)
    for k in range(5):
        a = math.radians(-20 + k * 50)
        trazo(coll, f'hoja neón {k}', [(-0.02, y - 0.004, 0.16), (-0.02 + 0.09 * math.cos(a), y - 0.004, 0.2 + 0.03 * math.sin(a)),
                                        (-0.02 + 0.15 * math.cos(a), y - 0.004, 0.13 + 0.05 * math.sin(a))], 0.008, palma)


def deco_cassette(coll):
    """Cassette gigante de pared."""
    clay.rbox('cassette', (0, -0.02, 0), (0.3, 0.02, 0.19), coll, laca('cassette', '#F28C45', 0.35), p=8, n=4)
    clay.rbox('etiqueta cassette', (0, -0.041, 0.04), (0.25, 0.003, 0.11), coll, papel('etiqueta cassette', '#FFF8EC'), p=8, n=3)
    clay.rbox('ventana cassette', (0, -0.045, 0.03), (0.15, 0.003, 0.045), coll, laca('ventana cassette', '#2B2422', 0.3), p=8, n=3)
    for sx in (-1, 1):
        aro(coll, f'rueda cassette {sx}', (sx * 0.1, -0.05, 0.03), 0.03, 'y', 0.008, laca('rueda', '#FFFFFF', 0.4), n=14)
    for k in range(3):
        trazo(coll, f'línea etiqueta {k}', [(-0.22, -0.046, 0.12 - k * 0.02 - 0.0), (-0.05, -0.046, 0.12 - k * 0.02)], 0.003, laca('tinta', '#3B6FB6', 0.5))
    prisma(coll, 'base cassette', [(-0.2, -0.19), (0.2, -0.19), (0.16, -0.1), (-0.16, -0.1)], 0.02, 0.045, laca('base cassette', '#2B2422', 0.4), eje='y')


def deco_lava(coll):
    """Lámpara de lava (el color de la lava se puede cambiar)."""
    plata = metal('lámpara lava', '#C9CCD2', 0.25)
    clay.lathe('base lava', [(0.0, 0.0), (0.07, 0.0), (0.05, 0.1), (0.035, 0.12), (0.0, 0.12)], coll, plata, segments=24)
    clay.lathe('vidrio lava', [(0.034, 0.12), (0.055, 0.25), (0.03, 0.38), (0.0, 0.38)], coll, transparente('vidrio lava', '#FFD6E8', 0.35), segments=24,
               cap_bottom=False)
    clay.lathe('tapa lava', [(0.03, 0.38), (0.022, 0.42), (0.0, 0.42)], coll, plata, segments=20, cap_bottom=False)
    lava = luz('tinte lava', '#FF4FA3', 1.6)
    for k, (z, r) in enumerate(((0.16, 0.03), (0.23, 0.022), (0.3, 0.018), (0.2, 0.015))):
        clay.blob(f'burbuja lava {k}', (0.008 * (k % 2), 0.0, z), (r, r, r * 1.3), coll, lava, n=5)


def deco_patines(coll):
    """Par de patines de ruedas retro."""
    for k, (x, rot, col) in enumerate(((-0.1, 0.2, '#F39AB0'), (0.12, -0.15, '#8EC5F0'))):
        bota = laca(f'patín {col}', col, 0.35)
        c, s = math.cos(rot), math.sin(rot)

        def pt(px, py, pz):
            return (x + px * c - py * s, px * s + py * c, pz)
        clay.blob(f'bota {k}', pt(0.0, 0.03, 0.15), (0.055, 0.06, 0.085), coll, bota, n=6)
        clay.blob(f'pie patín {k}', pt(0.0, -0.05, 0.08), (0.06, 0.09, 0.05), coll, bota, n=6)
        clay.rbox(f'suela patín {k}', pt(0.0, -0.02, 0.045), (0.06, 0.12, 0.01), coll, laca('suela', '#FFFFFF', 0.4), p=6, n=3)
        for j, py in enumerate((-0.1, 0.06)):
            for sx in (-1, 1):
                clay.blob(f'rueda patín {k}{j}{sx}', pt(sx * 0.05, py, 0.025), (0.012, 0.025, 0.025), coll, laca('rueda patín', '#F7C948', 0.3), n=4)
        clay.blob(f'freno {k}', pt(0.0, -0.14, 0.03), (0.02, 0.02, 0.018), coll, laca('freno', '#E4566B', 0.4), n=4)
        for j in range(3):
            trazo(coll, f'cordón {k}{j}', [pt(-0.04, -0.06 + j * 0.03, 0.12 + j * 0.03), pt(0.04, -0.06 + j * 0.03, 0.12 + j * 0.03)], 0.004, laca('cordón', '#FFFFFF', 0.4))


def deco_arcade_mini(coll):
    """Maquinita de arcade mini (del tamaño de un niño) con la pantalla prendida."""
    cuerpo = laca('arcade mini', '#6C4AB6', 0.35)
    clay.rbox('mueble arcade', (0, 0.02, 0.4), (0.18, 0.16, 0.4), coll, cuerpo, p=6, n=4)
    clay.rbox('pantalla arcade', (0, -0.14, 0.6), (0.13, 0.01, 0.1), coll, luz('pantalla arcade', '#35F0FF', 1.1), p=8, n=3)
    clay.rbox('marquesina', (0, -0.14, 0.76), (0.16, 0.012, 0.035), coll, luz('marquesina', '#FF4FA3', 1.5), p=8, n=3)
    clay.rbox('tablero arcade', (0, -0.19, 0.44), (0.17, 0.06, 0.02), coll, laca('tablero', '#2B2422', 0.4), p=6, n=3)
    clay.sweep('palanca', [(-0.07, -0.2, 0.46), (-0.07, -0.2, 0.52)], 0.006, (1, 1), coll, metal('palanca'), segments=4, samples=2)
    clay.blob('bola palanca', (-0.07, -0.2, 0.53), (0.018, 0.018, 0.018), coll, laca('bola', '#E4566B', 0.3), n=4)
    for k, col in enumerate(('#F7C948', '#5FA85A', '#3BB3E4')):
        clay.blob(f'botón arcade {k}', (0.02 + k * 0.04, -0.2, 0.465), (0.013, 0.013, 0.008), coll, laca(f'botón {col}', col, 0.3), n=4)
    for sx in (-1, 1):
        clay.rbox(f'franja lateral {sx}', (sx * 0.182, 0.02, 0.4), (0.003, 0.14, 0.3), coll, laca('franja', '#F7C948', 0.35), p=6, n=3)


def deco_bola_disco(coll):
    """Bola de discoteca en su soporte."""
    base = metal('soporte bola', '#C9CCD2', 0.3)
    clay.lathe('base bola', [(0.0, 0.0), (0.06, 0.0), (0.06, 0.02), (0.0, 0.025)], coll, base, segments=20)
    clay.sweep('palo bola', [(0, 0, 0.02), (0, 0, 0.12)], 0.008, (1, 1), coll, base, segments=6, samples=2)
    clay.blob('bola disco', (0, 0, 0.21), (0.09, 0.09, 0.09), coll, _mat('Deco | espejitos', '#E7E9EE', rough=0.08, metallic=1.0), n=12)
    rng = np.random.default_rng(5)
    for k in range(24):
        d = rng.normal(size=3)
        d /= np.linalg.norm(d)
        p = np.array((0, 0, 0.21)) + d * 0.091
        col = ('#FF4FA3', '#35F0FF', '#F7C948')[k % 3]
        clay.blob(f'reflejo {k}', tuple(p), (0.01, 0.01, 0.01), coll, luz(f'reflejo {col}', col, 1.5), n=3)


# ---------------------------------------------------------------------------
# 19. Romántico
# ---------------------------------------------------------------------------

def deco_luces_corazon(coll):
    """Guirnalda de bombillitos en forma de corazón con fotos colgadas."""
    alambre = laca('alambre', '#6B4A3A', 0.5)
    pts = []
    for t in np.linspace(0, 2 * math.pi, 40, endpoint=False):
        x = 16 * math.sin(t) ** 3
        z = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x * 0.016, -0.015, z * 0.016 + 0.02))
    clay.sweep('alambre corazón', pts, 0.003, (1, 1), coll, alambre, segments=4, samples=2, closed=True)
    for k, p in enumerate(pts[::3]):
        clay.blob(f'bombillo {k}', p, (0.012, 0.012, 0.016), coll, luz('bombillo cálido', '#FFD98A', 3.0), n=4)
    for k, (x, z) in enumerate(((-0.08, 0.02), (0.08, 0.02), (0.0, -0.1))):
        clay.rbox(f'foto colgada {k}', (x, -0.02, z), (0.035, 0.004, 0.04), coll, papel('polaroid', '#FFFFFF'), p=8, n=3)
        clay.rbox(f'imagen foto {k}', (x, -0.025, z + 0.006), (0.028, 0.002, 0.026), coll, papel(f'imagen {k}', ('#F39AB0', '#8EC5F0', '#F7C948')[k]), p=8, n=3,
                  subsurf=0)
        clay.blob(f'gancho foto {k}', (x, -0.024, z + 0.042), (0.006, 0.004, 0.01), coll, madera('gancho', '#C9956A'), n=3)


def deco_rosas(coll):
    """Florero de vidrio con una docena de rosas rojas."""
    clay.lathe('florero rosas', [(0.0, 0.0), (0.05, 0.0), (0.07, 0.08), (0.045, 0.17), (0.055, 0.2)], coll, transparente('florero', '#E7F3F7', 0.3), segments=24,
               cap_top=False)
    rojo = laca('rosa roja', '#C0304A', 0.35)
    verde = madera('tallo rosa', '#4F8A45')
    rng = np.random.default_rng(3)
    for k in range(12):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0, 0.07)
        top = (r * math.cos(a), r * math.sin(a), 0.33 + rng.uniform(-0.03, 0.03))
        clay.sweep(f'tallo rosa {k}', [(0.0, 0.0, 0.05), (top[0] * 0.6, top[1] * 0.6, 0.2), top], 0.004, (1, 1), coll, verde, segments=4, samples=3)
        clay.blob(f'rosa {k}', top, (0.03, 0.03, 0.028), coll, rojo, n=6)
        for j in range(3):
            b = 2 * math.pi * j / 3 + k
            clay.blob(f'pétalo rosa {k}{j}', (top[0] + 0.022 * math.cos(b), top[1] + 0.022 * math.sin(b), top[2] + 0.005), (0.016, 0.016, 0.02), coll, rojo, n=4)
        clay.blob(f'hoja rosa {k}', ((top[0] * 0.7), (top[1] * 0.7) - 0.01, 0.24), (0.018, 0.006, 0.01), coll, laca('hoja rosa', '#5FA85A', 0.6), n=3)


def deco_rosal(coll):
    """Rosal en matera de barro con rosas rosadas y rojas."""
    h = matera(coll, 0.17, 0.26, '#C8693A')
    verde = tela('rosal', '#4F8A45')
    clay.blob('arbusto rosal', (0, 0, h + 0.22), (0.24, 0.22, 0.24), coll, verde, n=10)
    rng = np.random.default_rng(8)
    for k in range(18):
        d = rng.normal(size=3)
        d[2] = abs(d[2]) + 0.2
        d /= np.linalg.norm(d)
        p = np.array((0, 0, h + 0.22)) + d * np.array((0.24, 0.22, 0.24))
        col = '#C0304A' if k % 2 else '#F39AB0'
        clay.blob(f'rosa rosal {k}', tuple(p), (0.035, 0.035, 0.03), coll, laca(f'rosa {col}', col, 0.35), n=5)


def deco_cuadro_amor(coll):
    """Dos corazones entrelazados con la fecha escondida en un listón."""
    hx, hz = _marco(coll, 0.5, 0.5, '#E7B7C4', '#FFF1F4')
    y = -0.026
    corazon_plano('corazón uno', (-0.05, y - 0.006, 0.03), 0.2, coll, laca('corazón uno', '#E4566B', 0.35), grosor=0.28)
    corazon_plano('corazón dos', (0.06, y - 0.012, -0.01), 0.18, coll, laca('corazón dos', '#F39AB0', 0.35), grosor=0.28)
    clay.sweep('listón amor', [(-0.18, y - 0.02, -0.14), (-0.05, y - 0.024, -0.12), (0.05, y - 0.024, -0.12), (0.18, y - 0.02, -0.14)], 0.025, (1, 0.2), coll,
               laca('listón', '#F7C948', 0.4), segments=6, samples=4)
    for k in range(3):
        trazo(coll, f'fecha {k}', [(-0.08 + k * 0.06, y - 0.03, -0.12), (-0.05 + k * 0.06, y - 0.03, -0.12)], 0.004, laca('tinta', '#8A3A2A', 0.5))


# ---------------------------------------------------------------------------
# 20. Nórdico (minimalista)
# ---------------------------------------------------------------------------

def deco_cuadro_geometrico(coll):
    """Cuadro minimalista de formas y líneas (terracota, mostaza y salvia)."""
    hx, hz = _marco(coll, 0.46, 0.62, '#E8DCCB', '#FBF7F0')
    y = -0.026
    clay.blob('círculo terracota', (-0.04, y, 0.1), (0.1, 0.004, 0.1), coll, papel('terracota', '#C8693A'), n=8)
    plano(coll, 'arco salvia', [(0.02, -0.2), (0.18, -0.2), (0.18, -0.02), (0.1, 0.04), (0.02, -0.02)], y - 0.004, papel('salvia', '#9DB8A0'))
    clay.blob('sol mostaza', (0.1, y - 0.006, 0.2), (0.04, 0.004, 0.04), coll, papel('mostaza', '#E3B04B'), n=6)
    for k in range(3):
        trazo(coll, f'línea {k}', [(-0.17, y - 0.008, -0.08 - k * 0.04), (-0.03, y - 0.008, -0.08 - k * 0.04)], 0.004, papel('línea', '#3A3838'))


def deco_espejo_sol(coll):
    """Espejo redondo con rayos de sol en rattan."""
    clay.blob('espejo sol', (0, -0.02, 0), (0.12, 0.01, 0.12), coll, _mat('Deco | espejo sol', '#DCE7F2', rough=0.05, metallic=1.0), n=10)
    aro(coll, 'marco sol', (0, -0.02, 0), 0.125, 'y', 0.012, madera('rattan', '#D8B27A'), n=28)
    for k in range(24):
        a = 2 * math.pi * k / 24
        l = 0.3 if k % 2 else 0.24
        trazo(coll, f'rayo sol {k}', [(0.14 * math.cos(a), -0.015, 0.14 * math.sin(a)), (l * math.cos(a), -0.015, l * math.sin(a))], 0.006, madera('rattan', '#D8B27A'))


def deco_jarron_nordico(coll):
    """Jarrón de cerámica con plumas de pampa."""
    clay.lathe('jarrón nórdico', [(0.0, 0.0), (0.05, 0.0), (0.08, 0.06), (0.08, 0.14), (0.04, 0.2), (0.035, 0.24), (0.04, 0.25)], coll,
               laca('cerámica', '#EFE7DA', 0.6), segments=24, cap_top=False)
    trazo(coll, 'raya jarrón', [(0.081 * math.cos(a), 0.081 * math.sin(a), 0.1) for a in np.linspace(0, 2 * math.pi, 20)], 0.004, laca('raya', '#C8693A', 0.5),
          cerrado=True)
    pampa = tela('pampa', '#E8D5B0')
    for k in range(6):
        a = -0.5 + k * 0.2
        base = (0.0, 0.0, 0.22)
        punta = (0.3 * math.sin(a), 0.03 * (k % 2), 0.55 - abs(a) * 0.15)
        clay.sweep(f'tallo pampa {k}', [base, punta], 0.003, (1, 1), coll, madera('tallo pampa', '#B98559'), segments=4, samples=2)
        clay.blob(f'pluma pampa {k}', (punta[0] * 0.85, punta[1], punta[2] - 0.05), (0.035, 0.03, 0.09), coll, pampa, n=5)


def deco_lampara_arco(coll):
    """Lámpara de arco con base de mármol y pantalla de campana."""
    clay.rbox('base arco', (0, 0, 0.04), (0.14, 0.14, 0.04), coll, marmol('base arco', '#F2EFEA'), p=6, n=4)
    oro_mate = _mat('Deco | latón', '#C9A45C', rough=0.35, metallic=1.0)
    pts = [(0, 0, 0.08), (0.0, 0.0, 1.0), (0.2, 0.0, 1.5), (0.55, 0.0, 1.55), (0.75, 0.0, 1.35)]
    clay.sweep('arco lámpara', pts, 0.014, (1, 1), coll, oro_mate, segments=8, samples=6)
    clay.lathe('campana', [(0.02, 1.36), (0.08, 1.3), (0.15, 1.18), (0.16, 1.16)], coll, laca('campana', '#2B2422', 0.4), segments=24, cap_bottom=False,
               cap_top=False).location = (0.75, 0, 0)
    clay.blob('bombillo arco', (0.75, 0, 1.2), (0.05, 0.05, 0.05), coll, luz('bombillo arco', '#FFE7A8', 3.0), n=5)


def deco_canasta_manta(coll):
    """Canasta de mimbre con una manta tejida doblada."""
    mimbre = madera('mimbre', '#C9A06A')
    clay.lathe('canasta manta', [(0.0, 0.0), (0.18, 0.0), (0.2, 0.3), (0.21, 0.31)], coll, mimbre, segments=28, cap_top=False)
    for k in range(6):
        aro(coll, f'tejido {k}', (0, 0, 0.04 + k * 0.05), 0.182 + k * 0.0045, 'z', 0.006, madera('tejido', '#A67C52'), n=28)
    manta = tela('manta', '#E8DCCB')
    clay.blob('manta doblada', (0.02, 0.0, 0.34), (0.19, 0.16, 0.08), coll, manta, n=8)
    clay.sweep('manta cae', [(0.18, -0.02, 0.36), (0.24, -0.04, 0.25), (0.23, -0.05, 0.12)], 0.05, (1, 0.3), coll, manta, segments=6, samples=3)
    for k in range(5):
        trazo(coll, f'fleco manta {k}', [(0.2 + k * 0.01, -0.06, 0.1), (0.2 + k * 0.01, -0.06, 0.06)], 0.004, manta)


PIEZAS = {
    # 1. Gamer
    'deco_neon_gg': deco_neon_gg, 'deco_paneles_hex': deco_paneles_hex, 'deco_poster_control': deco_poster_control, 'deco_audifonos': deco_audifonos,
    'deco_consola': deco_consola, 'deco_slime': deco_slime, 'deco_torre_pc': deco_torre_pc, 'deco_lampara_led': deco_lampara_led,
    # 2. Griego
    'deco_meandro': deco_meandro, 'deco_laurel': deco_laurel, 'deco_anfora': deco_anfora, 'deco_busto': deco_busto, 'deco_pegaso': deco_pegaso,
    'deco_columna': deco_columna, 'deco_anfora_grande': deco_anfora_grande,
    # 3. Egipcio
    'deco_papiro': deco_papiro, 'deco_escarabajo': deco_escarabajo, 'deco_piramide': deco_piramide, 'deco_gato_egipcio': deco_gato_egipcio,
    'deco_momia': deco_momia, 'deco_obelisco': deco_obelisco,
    # 4. Espacial
    'deco_planetas': deco_planetas, 'deco_cuadro_astronauta': deco_cuadro_astronauta, 'deco_lampara_luna': deco_lampara_luna,
    'deco_cohete_mesa': deco_cohete_mesa, 'deco_alien': deco_alien, 'deco_telescopio': deco_telescopio,
    # 5. Tropical
    'deco_tabla_surf': deco_tabla_surf, 'deco_cuadro_ola': deco_cuadro_ola, 'deco_concha': deco_concha, 'deco_tortuga': deco_tortuga,
    'deco_flotador': deco_flotador,
    # 6. Japonés
    'deco_abanico': deco_abanico, 'deco_cuadro_fuji': deco_cuadro_fuji, 'deco_maneki': deco_maneki, 'deco_farol_papel': deco_farol_papel,
    'deco_cerezo': deco_cerezo,
    # 7. Princesa
    'deco_espejo_princesa': deco_espejo_princesa, 'deco_tiara_cojin': deco_tiara, 'deco_joyero': deco_joyero, 'deco_castillo': deco_castillo,
    'deco_corona_pared': deco_corona_pared,
    # 8. Música
    'deco_vinilos': deco_vinilos, 'deco_poster_rock': deco_poster_rock, 'deco_microfono': deco_microfono,
    'deco_guitarra_electrica': deco_guitarra_electrica, 'deco_amplificador': deco_amplificador,
    # 9. Fútbol
    'deco_camiseta': deco_camiseta, 'deco_bufanda': deco_bufanda, 'deco_copa': deco_copa, 'deco_balon': deco_balon, 'deco_arco': deco_arco,
    # 10. Colombiano
    'deco_vueltiao_pared': deco_sombrero_vueltiao, 'deco_mochila_wayuu': deco_mochila_wayuu, 'deco_chiva': deco_chiva,
    'deco_guacamaya': deco_guacamaya, 'deco_silleta': deco_silleta, 'deco_bulto_cafe': deco_bulto_cafe,
    # 11. Pirata
    'deco_timon': deco_timon, 'deco_mapa_tesoro': deco_mapa_tesoro, 'deco_barco_botella': deco_barco_botella, 'deco_loro': deco_loro,
    'deco_cofre': deco_cofre, 'deco_barril': deco_barril,
    # 12. Bosque
    'deco_reloj_cucu': deco_reloj_cucu, 'deco_cuadro_pinos': deco_cuadro_pinos, 'deco_hongos': deco_hongos, 'deco_zorro': deco_zorro,
    'deco_tronco': deco_tronco, 'deco_pino': deco_pino,
    # 13. Kawaii
    'deco_nube_arcoiris': deco_nube_arcoiris, 'deco_neon_corazon': deco_neon_corazon, 'deco_leche_fresa': deco_leche_fresa,
    'deco_nube_peluche': deco_nube_peluche, 'deco_lampara_estrella': deco_lampara_estrella,
    # 14. Biblioteca
    'deco_repisa_libros': deco_repisa_libros, 'deco_cuadro_cerebro': deco_cuadro_cerebro, 'deco_lampara_banquero': deco_lampara_banquero,
    'deco_buho': deco_buho, 'deco_pila_libros': deco_pila_libros,
    # 15. Navidad
    'deco_corona_navidad': deco_corona_navidad, 'deco_medias': deco_medias, 'deco_casita_jengibre': deco_casita_jengibre, 'deco_reno': deco_reno,
    'deco_muneco_nieve': deco_muneco_nieve, 'deco_regalos': deco_regalos,
    # 16. Halloween
    'deco_murcielagos': deco_murcielagos, 'deco_luna_bruja': deco_luna_bruja, 'deco_calabaza': deco_calabaza, 'deco_caldero': deco_caldero,
    'deco_fantasma': deco_fantasma, 'deco_calabaza_grande': deco_calabaza_grande, 'deco_escoba': deco_escoba,
    # 17. Cine
    'deco_poster_cine': deco_poster_cine, 'deco_claqueta': deco_claqueta, 'deco_balde_crispetas': deco_palomitas, 'deco_rollo_pelicula': deco_rollo_pelicula,
    'deco_silla_director': deco_silla_director, 'deco_foco_cine': deco_foco_cine,
    # 18. Retro 80s
    'deco_neon_palmera': deco_neon_palmera, 'deco_cassette': deco_cassette, 'deco_lava': deco_lava, 'deco_patines': deco_patines,
    'deco_arcade_mini': deco_arcade_mini, 'deco_bola_disco': deco_bola_disco,
    # 19. Romántico
    'deco_luces_corazon': deco_luces_corazon, 'deco_rosas': deco_rosas, 'deco_rosal': deco_rosal, 'deco_cuadro_amor': deco_cuadro_amor,
    # 20. Nórdico
    'deco_cuadro_geometrico': deco_cuadro_geometrico, 'deco_espejo_sol': deco_espejo_sol, 'deco_jarron_nordico': deco_jarron_nordico,
    'deco_lampara_arco': deco_lampara_arco, 'deco_canasta_manta': deco_canasta_manta,
}
