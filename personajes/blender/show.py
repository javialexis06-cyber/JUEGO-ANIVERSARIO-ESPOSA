"""El estudio de «El Show de Nosotros»: un set de concurso de televisión en el estilo de plastilina y fieltro.

Escenario con piso brillante y medallón, gradas de LED, la tarima de los concursantes con sus dos atriles (azul de Él,
rosado de Ella) con pantallita y bombillos, el atril del presentador (el perrito), la pantalla gigante de LED con su
marco de bombillos, dos pantallas laterales, el letrero «El Show de Nosotros» con letras en relieve y bombillos,
telón de terciopelo con cenefa y flecos dorados, la cercha con ocho reflectores móviles, tres cámaras de televisión
(dos de pedestal y una grúa) con su luz roja de «al aire», monitores de piso, bafles, floreros con rosas de fieltro,
cañones de confeti, corazones de neón, el cuadro de «APLAUSOS», las gradas del público con su cordón dorado y cables.

Lo que el juego mueve o pinta va en nodos con nombre (todo lo demás se une por material para dibujar poco):
  foco_N / foco_N_cabeza        reflectores (el yugo gira en z, la cabeza se inclina)
  pantalla_grande / pantalla_izq / pantalla_der / marcador_el / marcador_ella   superficies que pinta el juego
  tally_N                        luz roja de cada cámara
  bombillos_0/1/2                bombillos por fase (se prenden en cadena)
  corbatin / microfono           el vestuario del presentador (el juego se lo pone al perrito)
  publico_a/b/c / publico_mano   el público (el juego los repite y los pone a aplaudir)
  ancla_el / ancla_ella / ancla_perro    dónde se paran

Mira hacia -y (al público). Uso: python3 show.py <carpeta_salida>   (escribe show_estudio.glb)
"""
import math
import os
import struct
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402  (bpy antes que bmesh: es el que lo carga)
import bmesh  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402

TAU = math.tau
COLL = None
_MATS = {}
FASES = ([], [], [])
DINAMICOS = []


# --------------------------------------------------------------------------------------------- Materiales

def mat(nombre, color, **kw):
    n = f'Show | {nombre}'
    if n not in _MATS:
        _MATS[n] = clay.material(n, color, **kw)
    return _MATS[n]


def fieltro(nombre, color, rough=0.92, escala=160, cantidad=0.32):
    return mat(nombre, color, rough=rough, fuzz=dict(scale=escala, color=color, amount=cantidad, strength=0.28, distance=0.002))


def brillo(nombre, color, fuerza):
    return mat(nombre, color, rough=0.35, emission=color, emission_strength=fuerza)


# --------------------------------------------------------------------------------------------- Piezas

def caja(nombre, centro, medio, m, p=8.0, n=4, subsurf=1):
    return clay.rbox(nombre, centro, medio, COLL, m, p=p, n=n, subsurf=subsurf)


def bola(nombre, centro, radios, m, n=5, subsurf=0, p=2.0):
    if not isinstance(radios, (tuple, list)):
        radios = (radios, radios, radios)
    return clay.blob(nombre, centro, radios, COLL, m, n=n, p=p, subsurf=subsurf)


def tubo(nombre, puntos, r, m, seg=8, muestras=4, cerrado=False, perfil=(1, 1), caps=('round', 'round'), subsurf=0):
    return clay.sweep(nombre, puntos, r, perfil, COLL, m, segments=seg, samples=muestras, closed=cerrado, caps=caps, subsurf=subsurf)


def cilindro(nombre, centro, radio, alto, m, seg=24, rot=(0, 0, 0), r2=None, subsurf=0):
    """Cilindro (o cono si r2) construido en el origen y luego movido: así gira bien."""
    r2 = radio if r2 is None else r2
    o = clay.lathe(nombre, [(radio, -alto / 2), (radio, -alto / 2 + 0.0001), (r2, alto / 2 - 0.0001), (r2, alto / 2)], COLL, m, segments=seg, subsurf=subsurf)
    o.rotation_euler = rot
    o.location = centro
    return o


def torno(nombre, perfil, centro, m, seg=28, rot=(0, 0, 0), subsurf=1):
    o = clay.lathe(nombre, perfil, COLL, m, segments=seg, subsurf=subsurf)
    o.rotation_euler = rot
    o.location = centro
    return o


def prisma(nombre, contorno, z0, z1, m, bisel=0.0):
    """Polígono (x, y) extruido de z0 a z1 (escenario, tarimas)."""
    bm = bmesh.new()
    abajo = [bm.verts.new((x, y, z0)) for x, y in contorno]
    arriba = [bm.verts.new((x, y, z1)) for x, y in contorno]
    n = len(contorno)
    bm.faces.new(list(reversed(abajo)))
    bm.faces.new(arriba)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((abajo[i], abajo[j], arriba[j], arriba[i]))
    me = bpy.data.meshes.new(nombre)
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(nombre, me)
    clay.link(o, COLL)
    o.data.materials.append(m)
    if bisel:
        clay.add_bevel(o, bisel, 2)
    return o


def prisma_vertical(nombre, contorno_xz, y0, y1, m, bisel=0.0):
    """Figura plana parada (corazón, estrella, marquesina): el contorno va en (x, z) y el grosor en y (de y0 a y1)."""
    o = prisma(nombre, contorno_xz, y0, y1, m)
    me = o.data
    for v in me.vertices:
        v.co.y, v.co.z = v.co.z, v.co.y
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    if bisel:
        clay.add_bevel(o, bisel, 2)
    return o


def corazon(r, n=32, cx=0.0, cz=0.0):
    return [(cx + r * 16 * math.sin(t) ** 3 / 16, cz + r * (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) / 16)
            for t in np.linspace(0, TAU, n, endpoint=False)]


def estrella(r_ext, r_int, cx=0.0, cz=0.0, puntas=5):
    return [(cx + (r_ext if k % 2 == 0 else r_int) * math.sin(TAU * k / (2 * puntas)), cz + (r_ext if k % 2 == 0 else r_int) * math.cos(TAU * k / (2 * puntas)))
            for k in range(2 * puntas)]


def unir_hijos(raiz):
    """Une las piezas de un grupo que se mueve por material (un reflector = dos o tres mallas, no nueve)."""
    grupos = {}
    for o in list(raiz.children):
        if o.type == 'MESH' and not o.children and o not in DINAMICOS:
            grupos.setdefault(o.active_material.name if o.active_material else '', []).append(o)
    for nombre, lista in grupos.items():
        if len(lista) > 1:
            clay.join(lista, f'{raiz.name} {nombre.replace("Show | ", "")}')


def plano(nombre, centro, ancho, alto, m, giro_z=0.0, inclina=0.0):
    """Rectángulo vertical que mira hacia -y (pantallas), con UV de 0 a 1."""
    me = bpy.data.meshes.new(nombre)
    w, h = ancho / 2, alto / 2
    me.from_pydata([(-w, 0, -h), (w, 0, -h), (w, 0, h), (-w, 0, h)], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name='UVMap')
    for i, (u, v) in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[i].uv = (u, v)
    o = bpy.data.objects.new(nombre, me)
    clay.link(o, COLL)
    o.data.materials.append(m)
    o.rotation_euler = (inclina, 0, giro_z)
    o.location = centro
    return o


def contorno_escenario(offset=0.0, n=40):
    """Atrás recto y adelante media elipse (el borde del escenario), agrandado `offset`."""
    rx, ry, cy = 4.4 + offset, 2.4 + offset, -0.8
    pts = [(-rx, 2.9 + offset * 0.2)]
    for k in range(n + 1):
        a = math.pi + math.pi * k / n
        pts.append((rx * math.cos(a), cy + ry * math.sin(a)))
    pts.append((rx, 2.9 + offset * 0.2))
    return pts


def bombillo(pos, normal=(0, -1, 0), fase=0, r=0.028):
    """Bombillito de marquesina con su socket dorado; va a la fase que le toca (se prenden en cadena)."""
    x, y, z = pos
    nx, ny, nz = normal
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    s = caja('socket', (x - nx * r * 0.5, y - ny * r * 0.5, z - nz * r * 0.5), (r * 0.7, r * 0.7, r * 0.7), oro, n=2, subsurf=0)
    b = bola('bombillo', (x + nx * r * 0.45, y + ny * r * 0.45, z + nz * r * 0.45), r, brillo(f'bombillo {fase}', '#FFF1C2', 6.0), n=3)
    FASES[fase % 3].append(b)
    return s, b


def fila_bombillos(puntos, normal, cada=0.16, r=0.028, cerrado=False):
    """Bombillos repartidos cada `cada` metros a lo largo de una polilínea."""
    pts = [np.array(p, float) for p in puntos]
    if cerrado:
        pts.append(pts[0])
    largos = [np.linalg.norm(pts[i + 1] - pts[i]) for i in range(len(pts) - 1)]
    total = sum(largos)
    n = max(2, int(total / cada))
    k = 0
    for i in range(n + (0 if cerrado else 1)):
        d = total * i / n
        j = 0
        while j < len(largos) - 1 and d > largos[j]:
            d -= largos[j]
            j += 1
        p = pts[j] + (pts[j + 1] - pts[j]) * (d / max(largos[j], 1e-6))
        nn = normal(p) if callable(normal) else normal
        bombillo(tuple(p), nn, k, r)
        k += 1


# --------------------------------------------------------------------------------------------- Fuente

def fuente_fredoka():
    """Fredoka (la letra del juego) para las letras del letrero: se convierte de WOFF a TTF al vuelo."""
    rutas = [os.path.join(HERE, '..', '..', 'juego', 'web', 'node_modules', '@fontsource', 'fredoka', 'files', 'fredoka-latin-700-normal.woff')]
    rutas += ['/home/user/JUEGO-ANIVERSARIO-ESPOSA/juego/web/node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff']
    src = next((r for r in rutas if os.path.exists(r)), None)
    if not src:
        return None
    dst = os.path.join(bpy.app.tempdir or '/tmp', 'fredoka-700.ttf')
    data = open(src, 'rb').read()
    flavor, ntab = struct.unpack('>4xIxxxxH', data[:14])
    tablas = []
    for i in range(ntab):
        tag, off, clen, olen, chk = struct.unpack('>4sIIII', data[44 + i * 20:64 + i * 20])
        raw = data[off:off + clen]
        if clen < olen:
            raw = zlib.decompress(raw)
        tablas.append((tag, chk, raw))
    e = int(math.log2(ntab))
    cab = struct.pack('>IHHHH', flavor, ntab, (2 ** e) * 16, e, ntab * 16 - (2 ** e) * 16)
    pos = 12 + 16 * ntab
    dire, cuerpo = b'', b''
    for tag, chk, raw in sorted(tablas):
        dire += struct.pack('>4sIII', tag, chk, pos + len(cuerpo), len(raw))
        cuerpo += raw + b'\0' * ((4 - len(raw) % 4) % 4)
    with open(dst, 'wb') as f:
        f.write(cab + dire + cuerpo)
    return bpy.data.fonts.load(dst)


FUENTE = None


def letras(nombre, texto, centro, tam, m, fondo=0.04, bisel=0.008, giro=(math.pi / 2, 0, 0)):
    """Texto en relieve (mirando hacia -y), convertido a malla."""
    cu = bpy.data.curves.new(nombre, 'FONT')
    cu.body = texto
    if FUENTE:
        cu.font = FUENTE
    cu.size = tam
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.extrude = fondo
    cu.bevel_depth = bisel
    cu.bevel_resolution = 2
    cu.resolution_u = 4
    tmp = bpy.data.objects.new(nombre + ' tmp', cu)
    clay.link(tmp, COLL)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    o = bpy.data.objects.new(nombre, me)
    clay.link(o, COLL)
    o.data.materials.clear()
    o.data.materials.append(m)
    o.rotation_euler = giro
    o.location = centro
    return o


# --------------------------------------------------------------------------------------------- El set

def escenario():
    piso = mat('piso estudio', '#1C1330', rough=0.42, coat=0.5, coat_rough=0.15)
    tarima = mat('escenario', '#2A1550', rough=0.18, coat=1.0, coat_rough=0.04)
    lado = fieltro('escenario lado', '#3B1E66')
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    led = brillo('led', '#FF6FA5', 3.0)
    # Piso del estudio (oscuro y un poco brillante)
    caja('piso', (0, -2.5, -0.05), (13, 9, 0.05), piso, p=10, n=2, subsurf=0)
    # El escenario: atrás recto, adelante media elipse; tapa brillante, lado de fieltro, filo dorado y franja de LED
    c = contorno_escenario()
    prisma('escenario lado', c, 0.0, 0.225, lado)
    prisma('escenario tapa', contorno_escenario(-0.02), 0.225, 0.24, tarima)
    tubo('filo dorado', [(x, y, 0.235) for x, y in c[1:-1]], 0.022, oro, seg=6, muestras=2, caps=('flat', 'flat'))
    tubo('franja led', [(x, y, 0.12) for x, y in contorno_escenario(0.006)[1:-1]], 0.016, led, seg=6, muestras=2, perfil=(1.0, 2.2))
    # Dos gradas al frente, cada una con su franja de luz
    for k, (off, alto) in enumerate(((0.32, 0.16), (0.64, 0.08))):
        cont = contorno_escenario(off)
        dentro = contorno_escenario(off - 0.32)
        frente = [p for p in cont if p[1] < -0.6]
        frente_in = [p for p in dentro if p[1] < -0.6]
        anillo = frente + list(reversed(frente_in))
        prisma(f'grada {k}', anillo, 0.0, alto, tarima)
        tubo(f'grada led {k}', [(x, y - 0.006, alto * 0.55) for x, y in frente], 0.012, led, seg=6, muestras=2, perfil=(1.0, 1.8))
        tubo(f'grada filo {k}', [(x, y, alto) for x, y in frente], 0.014, oro, seg=6, muestras=2, caps=('flat', 'flat'))
    # Medallón del piso: aro dorado, estrella de puntas rosadas y azules y un corazón al centro
    cx, cy = 0.0, -1.55
    rosa = fieltro('rosa', '#FF6FA5')
    azul = fieltro('azul', '#4FA3FF')
    crema = fieltro('crema', '#FFF1E4')
    morado = mat('medallon', '#3C1C70', rough=0.2, coat=1.0, coat_rough=0.05)
    torno('medallón', [(0.0, 0.0), (1.25, 0.0), (1.25, 0.004)], (cx, cy, 0.24), morado, seg=48, subsurf=0)
    for r, m in ((1.25, oro), (0.95, rosa), (0.5, oro)):
        pts = [(cx + r * math.cos(a), cy + r * 0.999 * math.sin(a), 0.246) for a in np.linspace(0, TAU, 48, endpoint=False)]
        tubo(f'aro {r}', pts, 0.02 if m is oro else 0.03, m, seg=6, muestras=2, cerrado=True, perfil=(1, 0.5))
    for k in range(16):
        a = TAU * k / 16
        largo = 0.92 if k % 2 == 0 else 0.7
        m = rosa if k % 4 == 0 else azul if k % 4 == 2 else crema
        p1 = (cx + largo * math.cos(a), cy + largo * math.sin(a))
        lado_a = (cx + 0.52 * math.cos(a + 0.12), cy + 0.52 * math.sin(a + 0.12))
        lado_b = (cx + 0.52 * math.cos(a - 0.12), cy + 0.52 * math.sin(a - 0.12))
        prisma(f'punta {k}', [lado_b, p1, lado_a], 0.24, 0.247, m)
    prisma('corazón piso', corazon(0.3, 40, cx, cy), 0.24, 0.252, mat('corazon piso', '#FF4F8F', rough=0.25, coat=1.0))
    # Marcas de cinta en el piso (donde se paran) y la tarima de los concursantes
    cinta = fieltro('cinta', '#FFD25A')
    for x in (-0.95, 0.95):
        for s in (-1, 1):
            o = caja('cinta', (0, 0, 0), (0.11, 0.012, 0.002), cinta, n=2, subsurf=0)
            o.rotation_euler = (0, 0, s * 0.78)
            o.location = (x, -0.12, 0.425)
    prisma('tarima concursantes', [(-1.75, -0.45), (1.75, -0.45), (1.75, 0.55), (-1.75, 0.55)], 0.24, 0.42, lado, bisel=0.02)
    caja('tapa tarima', (0, 0.05, 0.415), (1.73, 0.49, 0.01), tarima, p=10, n=2, subsurf=0)
    tubo('led tarima', [(-1.74, -0.458, 0.33), (1.74, -0.458, 0.33)], 0.012, led, seg=6, muestras=2, perfil=(1, 2))
    tubo('filo tarima', [(-1.76, -0.455, 0.42), (1.76, -0.455, 0.42)], 0.014, oro, seg=6, muestras=2)


def atril(x, rol):
    """Atril del concursante: cuerpo de fieltro de su color, banda blanca con la pantallita, escritorio con filo
    dorado y su botón grande, corazón (o estrella) bordado y bombillos alrededor del frente."""
    color = '#4FA3FF' if rol == 'el' else '#FF6FA5'
    oscuro = '#2B6FCF' if rol == 'el' else '#D93D78'
    cuerpo = fieltro(f'atril {rol}', color)
    franja = fieltro(f'atril {rol} oscuro', oscuro)
    crema = fieltro('crema', '#FFF1E4')
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    y = -0.66
    caja('atril cuerpo', (x, y, 0.47), (0.36, 0.2, 0.23), cuerpo, p=6, n=4)
    caja('atril zócalo', (x, y, 0.27), (0.39, 0.23, 0.035), franja, p=6, n=3)
    caja('atril banda', (x, y - 0.17, 0.58), (0.33, 0.04, 0.085), crema, p=6, n=3)
    caja('atril escritorio', (x, y + 0.03, 0.715), (0.42, 0.25, 0.022), franja, p=8, n=3)
    caja('atril tapa', (x, y + 0.03, 0.733), (0.4, 0.23, 0.008), crema, p=8, n=2, subsurf=0)
    tubo('atril filo', [(x - 0.42, y - 0.222, 0.72), (x + 0.42, y - 0.222, 0.72)], 0.012, oro, seg=6, muestras=2)
    # El botón grande (hacia el concursante) y una base dorada
    torno('botón base', [(0.0, 0.0), (0.085, 0.0), (0.085, 0.02), (0.07, 0.03), (0.0, 0.03)], (x, y + 0.1, 0.74), oro, seg=20, subsurf=0)
    bola('botón', (x, y + 0.1, 0.775), (0.06, 0.06, 0.04), mat('boton', '#FF3B3B', rough=0.2, coat=1.0), n=5)
    # Bordado: un corazón para Ella, una estrella para Él (de fieltro, en relieve)
    cz = 0.4
    pts = corazon(0.11, 32, x, cz) if rol == 'ella' else estrella(0.12, 0.055, x, cz)
    prisma_vertical('bordado', pts, y - 0.222, y - 0.198, crema, bisel=0.006)
    # Pantallita (la pinta el juego): nombre y puntos
    p = plano(f'marcador_{rol}', (x, y - 0.212, 0.58), 0.56, 0.15, mat('pantalla', '#0E0A18', rough=0.3))
    DINAMICOS.append(p)
    caja('marco pantallita', (x, y - 0.2, 0.58), (0.3, 0.012, 0.09), mat('marco', '#15101F', rough=0.4), p=8, n=2, subsurf=0)
    # Bombillos por el borde del frente
    fila_bombillos([(x - 0.37, y - 0.21, 0.27), (x - 0.37, y - 0.21, 0.69), (x + 0.37, y - 0.21, 0.69), (x + 0.37, y - 0.21, 0.27)], (0, -1, 0), cada=0.105, r=0.018)


def atril_presentador():
    """El atril del perrito: tronco de cono de fieltro morado, filos dorados, un micrófono pintado y su banquito."""
    morado = fieltro('atril presentador', '#6A3FB5')
    oscuro = fieltro('atril presentador oscuro', '#43207F')
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    crema = fieltro('crema', '#FFF1E4')
    x, y, giro = -2.55, -1.0, 0.42
    raiz = bpy.data.objects.new('atril presentador', None)
    clay.link(raiz, COLL)
    antes = set(COLL.objects)
    torno('atril pie', [(0.0, 0.0), (0.34, 0.0), (0.34, 0.06), (0.24, 0.1), (0.0, 0.1)], (0, 0, 0.24), oscuro, seg=28)
    torno('atril tronco', [(0.0, 0.0), (0.2, 0.0), (0.24, 0.42), (0.0, 0.42)], (0, 0, 0.32), morado, seg=28)
    caja('atril mesa', (0, -0.02, 0.77), (0.3, 0.2, 0.025), oscuro, p=8, n=3)
    caja('atril mesa tapa', (0, -0.02, 0.795), (0.28, 0.18, 0.006), crema, p=8, n=2, subsurf=0)
    for z in (0.33, 0.74):
        torno('atril aro', [(0.21 if z < 0.5 else 0.245, -0.012), (0.23 if z < 0.5 else 0.262, 0.0), (0.21 if z < 0.5 else 0.245, 0.012)], (0, 0, z), oro, seg=28, subsurf=0)
    # Escudo del show al frente: corazón con un micrófono
    prisma_vertical('escudo', corazon(0.13, 32, 0.0, 0.56), -0.262, -0.232, mat('corazon piso', '#FF4F8F', rough=0.25, coat=1.0), bisel=0.008)
    cilindro('escudo mic', (0, -0.262, 0.565), 0.02, 0.11, oro, seg=12)
    bola('escudo mic bola', (0, -0.262, 0.625), 0.032, mat('rejilla', '#3A3A44', rough=0.45, metallic=0.6), n=4)
    # Tarjetas de preguntas encima
    for k in range(3):
        o = caja('tarjeta', (0, 0, 0), (0.07, 0.05, 0.002), crema, n=2, subsurf=0)
        o.rotation_euler = (0, 0, 0.2 + k * 0.08)
        o.location = (0.08 + k * 0.004, -0.04, 0.803 + k * 0.004)
    # El banquito del perrito (detrás del atril)
    torno('banquito', [(0.0, 0.0), (0.2, 0.0), (0.22, 0.05), (0.2, 0.1), (0.0, 0.1)], (0, 0.36, 0.24), oscuro, seg=24)
    tubo('banquito filo', [(0.21 * math.cos(a), 0.36 + 0.21 * math.sin(a), 0.33) for a in np.linspace(0, TAU, 24, endpoint=False)], 0.012, oro, seg=6, muestras=2, cerrado=True)
    for o in COLL.objects:
        if o not in antes and o is not raiz and o.parent is None:
            o.parent = raiz
    raiz.location = (x, y, 0)
    raiz.rotation_euler = (0, 0, giro)
    ancla = bpy.data.objects.new('ancla_perro', None)
    clay.link(ancla, COLL)
    ancla.location = (x - 0.36 * math.sin(giro), y + 0.36 * math.cos(giro), 0.34)
    ancla.rotation_euler = (0, 0, giro)
    DINAMICOS.append(ancla)


def pantallas():
    """La pantalla gigante con su marco de bombillos, las dos laterales, la pared del fondo y el letrero."""
    marco = mat('marco', '#15101F', rough=0.4)
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    pant = mat('pantalla', '#0E0A18', rough=0.3)
    led = brillo('led', '#FF6FA5', 3.0)
    # Pared del fondo con franjas de luz y estrellitas
    pared = fieltro('pared fondo', '#241040', escala=90)
    caja('pared fondo', (0, 3.25, 2.8), (6.2, 0.1, 2.9), pared, p=10, n=2, subsurf=0)
    for x in (-5.2, -4.4, 4.4, 5.2):
        tubo('franja pared', [(x, 3.13, 0.3), (x, 3.13, 5.4)], 0.025, led, seg=6, muestras=2, perfil=(2.0, 0.6))
    for k in range(26):
        rng = math.sin(k * 12.9898) * 43758.5453
        u = rng - math.floor(rng)
        x = -5.8 + 11.6 * ((k * 0.381966) % 1.0)
        z = 3.4 + 2.2 * u
        if abs(x) < 2.6 and z < 4.3:
            continue
        prisma_vertical('estrellita', estrella(0.09, 0.04, x, z), 3.13, 3.145, brillo('estrellas', '#FFE08A', 2.0))
    # Pantalla gigante
    w, h, cz, y = 4.6, 2.3, 1.95, 2.55
    caja('marco pantalla', (0, y + 0.06, cz), (w / 2 + 0.16, 0.08, h / 2 + 0.16), marco, p=10, n=3)
    tubo('filo pantalla', [(-w / 2 - 0.08, y - 0.03, cz - h / 2 - 0.08), (w / 2 + 0.08, y - 0.03, cz - h / 2 - 0.08), (w / 2 + 0.08, y - 0.03, cz + h / 2 + 0.08),
                           (-w / 2 - 0.08, y - 0.03, cz + h / 2 + 0.08)], 0.018, oro, seg=6, muestras=1, cerrado=True)
    p = plano('pantalla_grande', (0, y - 0.025, cz), w, h, pant)
    DINAMICOS.append(p)
    fila_bombillos([(-w / 2 - 0.16, y - 0.06, cz - h / 2 - 0.16), (w / 2 + 0.16, y - 0.06, cz - h / 2 - 0.16), (w / 2 + 0.16, y - 0.06, cz + h / 2 + 0.16),
                    (-w / 2 - 0.16, y - 0.06, cz + h / 2 + 0.16)], (0, -1, 0), cada=0.17, r=0.03, cerrado=True)
    # Patas de la pantalla
    for x in (-1.6, 1.6):
        caja('pata pantalla', (x, y + 0.1, 0.45), (0.08, 0.08, 0.25), marco, p=6, n=2, subsurf=0)
    # Pantallas laterales giradas hacia el centro
    for s, nombre in ((-1, 'pantalla_izq'), (1, 'pantalla_der')):
        giro = s * -0.42
        cx, cyy = s * 3.45, 1.85
        c = caja('marco lateral', (0, 0.05, 0), (0.62, 0.06, 1.38), marco, p=10, n=3)
        c.rotation_euler = (0, 0, giro)
        c.location = (cx, cyy, 1.9)
        q = plano(nombre, (cx + 0.012 * math.sin(giro), cyy - 0.012 * math.cos(giro), 1.9), 1.06, 2.56, pant, giro_z=giro)
        DINAMICOS.append(q)
        tubo('filo lateral', [(cx + math.cos(giro) * dx - math.sin(giro) * -0.02, cyy + math.sin(giro) * dx + math.cos(giro) * -0.02, z)
                              for dx, z in ((-0.58, 0.58), (0.58, 0.58), (0.58, 3.22), (-0.58, 3.22))], 0.014, oro, seg=6, muestras=1, cerrado=True)
        caja('base lateral', (cx, cyy, 0.3), (0.3, 0.2, 0.06), marco, p=6, n=2, subsurf=0)


def letrero():
    """El letrero «El Show de Nosotros»: marquesina de fieltro con borde dorado, letras en relieve y bombillos."""
    fondo = fieltro('letrero fondo', '#2C1257', escala=110)
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    crema = mat('letras', '#FFF4E6', rough=0.5, coat=0.6, emission='#FFE9C9', emission_strength=0.6)
    rosa = mat('letras rosa', '#FF6FA5', rough=0.4, coat=0.6, emission='#FF6FA5', emission_strength=1.2)
    cy, cz = 2.42, 3.62
    # Marquesina: rectángulo con la parte de arriba en arco
    cont = []
    for k in range(25):
        a = math.pi * k / 24
        cont.append((-1.95 * math.cos(a), 0.42 + 0.28 * math.sin(a)))
    cont = [(-1.95, -0.48)] + cont + [(1.95, -0.48)]
    prisma_vertical('marquesina', [(px, cz + pz) for px, pz in cont], cy, cy + 0.12, fondo, bisel=0.02)
    pts_borde = [(x, cy - 0.01, cz + z) for x, z in cont]
    tubo('borde marquesina', pts_borde, 0.035, oro, seg=8, muestras=2, cerrado=True)
    fila_bombillos([(x * 0.93, cy - 0.04, cz + z * 0.9 - 0.01) for x, z in cont], (0, -1, 0), cada=0.15, r=0.03, cerrado=True)
    # Letras
    letras('letras el show', 'El Show', (0, cy - 0.045, cz + 0.2), 0.52, crema, fondo=0.03, bisel=0.012)
    letras('letras de nosotros', 'de Nosotros', (0, cy - 0.045, cz - 0.24), 0.36, rosa, fondo=0.03, bisel=0.01)
    # Corazones a los lados de la marquesina
    for s in (-1, 1):
        h = prisma_vertical('corazón letrero', corazon(0.22, 32), -0.03, 0.03, rosa, bisel=0.015)
        h.rotation_euler = (0, s * 0.25, 0)
        h.location = (s * 2.25, cy - 0.02, cz + 0.12)
    # Cadenas que lo cuelgan de la cercha
    for x in (-1.5, 1.5):
        tubo('cadena', [(x, cy, cz + 0.62), (x, cy - 0.3, 4.45)], 0.01, oro, seg=4, muestras=2)


def telon():
    """Telón de terciopelo recogido a los lados, con cenefa ondulada, flecos dorados y amarres."""
    terciopelo = mat('telon', '#9E1234', rough=0.7, sheen=1.0, sheen_rough=0.3, sheen_tint='#FF8FA8',
                     fuzz=dict(scale=120, color='#9E1234', amount=0.22, strength=0.2, distance=0.002))
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    y = -2.45
    for s in (-1, 1):
        # Pliegues: tubos aplastados uno al lado del otro, más juntos donde se recoge
        for k in range(7):
            x = s * (4.05 + k * 0.2)
            pts = []
            for j in range(9):
                z = 5.3 * j / 8
                recoge = 1.0 - 0.55 * math.exp(-((z - 1.6) ** 2) / 0.35)
                pts.append((s * 4.0 + (x - s * 4.0) * recoge, y + 0.04 * math.sin(k * 1.7 + j), z))
            tubo('pliegue', pts, 0.13, terciopelo, seg=10, muestras=3, perfil=(1.0, 0.55), caps=('flat', 'flat'))
        # Amarre dorado con borla
        amarre = [(s * (4.0 + 0.7 * u), y - 0.12 - 0.06 * math.sin(u * math.pi), 1.6 - 0.05 * math.sin(u * math.pi)) for u in np.linspace(0, 1, 6)]
        tubo('amarre', amarre, 0.03, oro, seg=8, muestras=3)
        bola('borla', (s * 4.05, y - 0.16, 1.45), (0.06, 0.06, 0.11), oro, n=4)
    # Cenefa de arriba (ondas) con flecos
    ondas = 9
    for k in range(ondas):
        x0 = -5.6 + 11.2 * k / ondas
        x1 = -5.6 + 11.2 * (k + 1) / ondas
        pts = [(x0 + (x1 - x0) * u, y - 0.05, 5.0 - 0.32 * math.sin(u * math.pi)) for u in np.linspace(0, 1, 7)]
        tubo('cenefa', pts, 0.16, terciopelo, seg=10, muestras=2, perfil=(1.0, 0.5))
        tubo('fleco', [(p[0], p[1] - 0.06, p[2] - 0.13) for p in pts], 0.025, oro, seg=6, muestras=2)
        bola('borla cenefa', (x1, y - 0.1, 4.82), (0.045, 0.045, 0.09), oro, n=3)
    caja('cenefa fondo', (0, y + 0.05, 5.28), (5.8, 0.06, 0.3), terciopelo, p=8, n=2, subsurf=0)


def cercha_y_focos():
    """La cercha de aluminio (barras y diagonales) y los ocho reflectores móviles colgados."""
    metal = mat('cercha', '#A9ABBA', rough=0.35, metallic=0.85)
    negro = mat('foco', '#26242E', rough=0.45, metallic=0.3)
    lente = brillo('lente', '#FFF6E0', 4.0)
    z = 4.55
    for y in (-1.65, 1.25):
        for dz, dy in ((0, 0), (0.25, 0), (0, 0.25), (0.25, 0.25)):
            tubo('barra', [(-4.6, y + dy, z + dz), (4.6, y + dy, z + dz)], 0.018, metal, seg=6, muestras=1)
        for k in range(24):
            x0 = -4.6 + 9.2 * k / 24
            x1 = -4.6 + 9.2 * (k + 1) / 24
            tubo('diagonal', [(x0, y, z), (x1, y, z + 0.25)], 0.009, metal, seg=4, muestras=1)
            tubo('diagonal', [(x0, y + 0.25, z + 0.25), (x1, y + 0.25, z)], 0.009, metal, seg=4, muestras=1)
    for x in (-4.6, 4.6):
        tubo('travesaño', [(x, -1.65, z + 0.12), (x, 1.5, z + 0.12)], 0.025, metal, seg=6, muestras=1)
        tubo('torre', [(x, -1.5, 0), (x, -1.5, z)], 0.04, metal, seg=8, muestras=1)
    sitios = [(-3.0, -1.55), (-1.8, -1.55), (-0.6, -1.55), (0.6, -1.55), (1.8, -1.55), (3.0, -1.55), (-2.2, 1.35), (2.2, 1.35)]
    for i, (x, y) in enumerate(sitios):
        # Yugo (gira en z) con la cabeza (se inclina en x); la lente mira hacia abajo (-z)
        yugo = bpy.data.objects.new(f'foco_{i}', None)
        clay.link(yugo, COLL)
        antes = set(COLL.objects)
        caja('foco base', (0, 0, -0.03), (0.09, 0.09, 0.035), negro, p=6, n=2, subsurf=0)
        for s in (-1, 1):
            caja('foco brazo', (s * 0.11, 0, -0.13), (0.018, 0.04, 0.11), negro, p=6, n=2, subsurf=0)
        for o in COLL.objects:
            if o not in antes and o is not yugo and o.parent is None:
                o.parent = yugo
        cabeza = bpy.data.objects.new(f'foco_{i}_cabeza', None)
        clay.link(cabeza, COLL)
        antes = set(COLL.objects)
        torno('foco cuerpo', [(0.0, 0.08), (0.06, 0.08), (0.085, 0.0), (0.095, -0.12), (0.0, -0.12)], (0, 0, 0), negro, seg=18, subsurf=0)
        torno('foco lente', [(0.0, 0.0), (0.075, 0.0), (0.072, 0.012), (0.0, 0.016)], (0, 0, -0.135), lente, seg=18, subsurf=0, rot=(math.pi, 0, 0))
        for k in range(4):
            a = TAU * k / 4 + 0.4
            o = caja('aleta', (0, 0, 0), (0.006, 0.03, 0.04), negro, n=2, subsurf=0)
            o.rotation_euler = (0, 0, a)
            o.location = (0.1 * math.cos(a), 0.1 * math.sin(a), -0.02)
        for o in COLL.objects:
            if o not in antes and o is not cabeza and o.parent is None:
                o.parent = cabeza
        unir_hijos(yugo)
        unir_hijos(cabeza)
        cabeza.parent = yugo
        cabeza.location = (0, 0, -0.2)
        yugo.location = (x, y + 0.12, z - 0.02)
        DINAMICOS.extend([yugo, cabeza])


def camaras():
    """Dos cámaras de pedestal y una grúa, con su luz de «al aire»."""
    negro = mat('camara', '#2B2B33', rough=0.5, metallic=0.2)
    gris = mat('camara gris', '#5D5D6B', rough=0.4, metallic=0.5)
    vidrio = mat('lente camara', '#0C1420', rough=0.08, coat=1.0)
    metal = mat('cercha', '#A9ABBA', rough=0.35, metallic=0.85)

    def cuerpo_camara(i, pos, giro, inclina=0.12):
        raiz = bpy.data.objects.new(f'camara_tv_{i}', None)
        clay.link(raiz, COLL)
        antes = set(COLL.objects)
        caja('cuerpo', (0, 0.05, 0), (0.13, 0.26, 0.14), negro, p=6, n=3)
        cilindro('lente tubo', (0, -0.3, 0.0), 0.085, 0.24, gris, seg=20, rot=(math.pi / 2, 0, 0))
        cilindro('parasol', (0, -0.45, 0.0), 0.11, 0.08, negro, seg=20, rot=(math.pi / 2, 0, 0), r2=0.095)
        cilindro('vidrio', (0, -0.49, 0.0), 0.07, 0.01, vidrio, seg=20, rot=(math.pi / 2, 0, 0))
        caja('visor', (-0.17, 0.12, 0.12), (0.05, 0.08, 0.06), negro, p=6, n=2, subsurf=0)
        caja('asa', (0, -0.05, 0.19), (0.04, 0.16, 0.02), gris, p=6, n=2, subsurf=0)
        for s in (-1, 1):
            tubo('manija', [(s * 0.12, 0.3, -0.05), (s * 0.25, 0.55, -0.12)], 0.016, metal, seg=6, muestras=1)
        t = bola(f'tally_{i}', (0, -0.15, 0.17), (0.025, 0.025, 0.018), brillo(f'tally {i}', '#FF2A2A', 0.3), n=3)
        DINAMICOS.append(t)
        for o in COLL.objects:
            if o not in antes and o is not raiz and o.parent is None:
                o.parent = raiz
        raiz.location = pos
        raiz.rotation_euler = (inclina, 0, giro)
        return raiz

    for i, (x, y) in enumerate(((-3.3, -4.8), (3.1, -5.2))):
        giro = math.atan2(0 - x, -(-0.6 - y))  # la lente (que mira a -y) apunta al centro del escenario
        # Pedestal: base de tres ruedas, columna y cabeza
        for k in range(3):
            a = TAU * k / 3 + 0.3
            tubo('pata pedestal', [(x, y, 0.15), (x + 0.42 * math.cos(a), y + 0.42 * math.sin(a), 0.07)], 0.03, negro, seg=6, muestras=1)
            bola('rueda', (x + 0.44 * math.cos(a), y + 0.44 * math.sin(a), 0.05), 0.05, gris, n=3)
        cilindro('columna', (x, y, 0.62), 0.06, 1.0, gris, seg=16)
        torno('volante', [(0.2, -0.015), (0.22, 0.0), (0.2, 0.015)], (x, y, 0.9), metal, seg=20, subsurf=0)
        cuerpo_camara(i, (x, y, 1.25), giro)
    # Grúa: base, poste, brazo largo con contrapesos y la cámara en la punta
    bx, by = 4.9, -3.4
    caja('base grúa', (bx, by, 0.08), (0.4, 0.4, 0.08), negro, p=6, n=2)
    cilindro('poste grúa', (bx, by, 0.85), 0.07, 1.5, metal, seg=16)
    brazo = [(bx + 0.9, by + 0.55, 1.75), (bx, by, 1.62), (bx - 1.7, by - 0.4, 2.35), (bx - 2.6, by - 0.62, 2.7)]
    tubo('brazo grúa', brazo, 0.045, metal, seg=8, muestras=3)
    tubo('tensor', [(bx + 0.9, by + 0.55, 1.95), (bx, by, 2.1), (bx - 2.6, by - 0.62, 2.85)], 0.008, metal, seg=4, muestras=3)
    for k in range(3):
        caja('contrapeso', (bx + 0.95, by + 0.6, 1.62 - k * 0.12), (0.12, 0.12, 0.05), negro, p=6, n=2, subsurf=0)
    jx, jy = bx - 2.65, by - 0.66
    cuerpo_camara(2, (jx, jy, 2.55), math.atan2(0 - jx, -(-0.6 - jy)), inclina=0.32)


def publico():
    """Las gradas del público (sillas de terciopelo y escalones), el cordón dorado y las figuras que el juego repite."""
    escalon = fieltro('grada publico', '#2A1A40')
    silla = mat('silla', '#5B1F3A', rough=0.7, sheen=0.8, sheen_tint='#FF8FB0', fuzz=dict(scale=120, color='#5B1F3A', amount=0.2, strength=0.2, distance=0.002))
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    for k, (y, z) in enumerate(((-6.0, 0.0), (-6.9, 0.32), (-7.8, 0.64))):
        if z > 0:
            caja('escalón', (0, y, z / 2), (6.2, 0.45, z / 2), escalon, p=10, n=2, subsurf=0)
        for j in range(17):
            x = -5.0 + j * 0.625
            caja('silla asiento', (x, y + 0.06, z + 0.28), (0.24, 0.2, 0.05), silla, p=6, n=2)
            caja('silla espaldar', (x, y + 0.24, z + 0.5), (0.24, 0.04, 0.22), silla, p=6, n=2)
    # Cordón dorado con postes
    postes = [(-5.4 + k * 1.35, -5.15) for k in range(9)]
    for x, y in postes:
        torno('poste', [(0.0, 0.0), (0.12, 0.0), (0.12, 0.03), (0.03, 0.06), (0.025, 0.8), (0.05, 0.84), (0.0, 0.86)], (x, y, 0), oro, seg=16, subsurf=0)
        bola('poste bola', (x, y, 0.9), 0.05, oro, n=4)
    for a, b in zip(postes, postes[1:]):
        pts = [(a[0] + (b[0] - a[0]) * u, a[1], 0.8 - 0.18 * math.sin(u * math.pi)) for u in np.linspace(0, 1, 7)]
        tubo('cordón', pts, 0.025, silla, seg=8, muestras=2)
    # Figuras para el público (el juego las repite): de espaldas, cabezona, con distintos peinados
    piel = fieltro('publico', '#FFFFFF')

    def figura(nombre, peinado):
        antes = set(COLL.objects)
        bola('cuerpo', (0, 0, 0.32), (0.2, 0.16, 0.24), piel, n=5, subsurf=0, p=2.4)
        bola('cabeza', (0, 0, 0.72), (0.2, 0.18, 0.19), piel, n=5, subsurf=0, p=2.6)
        if peinado == 'cola':
            bola('cola', (0, 0.17, 0.66), (0.07, 0.08, 0.14), piel, n=4)
        elif peinado == 'gorra':
            torno('gorra', [(0.0, 0.0), (0.2, 0.0), (0.18, 0.08), (0.0, 0.1)], (0, 0, 0.8), piel, seg=16, subsurf=0)
        else:
            bola('copete', (0.05, 0.02, 0.9), (0.09, 0.08, 0.06), piel, n=4)
        nuevos = [o for o in COLL.objects if o not in antes]
        o = clay.join(nuevos, nombre)
        DINAMICOS.append(o)
        return o

    figura('publico_a', 'copete')
    figura('publico_b', 'cola')
    figura('publico_c', 'gorra')
    m = bola('publico_mano', (0, 0, 0), (0.05, 0.035, 0.06), piel, n=3)
    DINAMICOS.append(m)


def detalles():
    """Lo que hace que no se vea vacío: monitores de piso, bafles, floreros con rosas, cañones de confeti,
    corazones de neón, el cuadro de «APLAUSOS» y cables."""
    negro = mat('camara', '#2B2B33', rough=0.5, metallic=0.2)
    gris = mat('camara gris', '#5D5D6B', rough=0.4, metallic=0.5)
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    bafle = fieltro('bafle', '#1B1822', escala=200)
    rosa = fieltro('rosa', '#FF6FA5')
    rojo = fieltro('rosa roja', '#E8344E')
    verde = fieltro('hoja', '#3FA85F')
    crema = fieltro('crema', '#FFF1E4')
    # Monitores de piso mirando a los concursantes
    for x in (-1.0, 1.0):
        o = caja('monitor piso', (0, 0, 0.11), (0.28, 0.16, 0.1), negro, p=6, n=2)
        o.rotation_euler = (0.5, 0, 0)
        o.location = (x, -2.75, 0.24)
        r = caja('monitor rejilla', (0, 0.165, 0.13), (0.22, 0.01, 0.06), gris, n=2, subsurf=0)
        r.rotation_euler = (0.5, 0, 0)
        r.location = (x, -2.75, 0.24)
    # Bafles a los lados (torres)
    for s in (-1, 1):
        for k, (alto, ancho) in enumerate(((0.55, 0.42), (0.5, 0.38), (0.42, 0.34))):
            z0 = [0, 0.56, 1.07][k]
            caja('bafle', (s * 5.05, -3.4, z0 + alto / 2), (ancho / 2, 0.3, alto / 2), bafle, p=7, n=2)
            torno('cono', [(0.0, -0.02), (ancho * 0.36, 0.0), (ancho * 0.3, -0.04), (0.0, -0.06)], (s * 5.05, -3.71, z0 + alto / 2), gris, seg=18, subsurf=0,
                  rot=(math.pi / 2, 0, 0))
    # Floreros con rosas de fieltro a los lados del escenario
    for s in (-1, 1):
        x, y = s * 3.75, -2.0
        torno('florero', [(0.0, 0.0), (0.14, 0.0), (0.2, 0.18), (0.12, 0.42), (0.16, 0.5), (0.0, 0.5)], (x, y, 0.24), oro, seg=20)
        for k in range(9):
            a = TAU * k / 9
            r = 0.05 + 0.1 * (k % 3) / 2
            px, py, pz = x + r * math.cos(a), y + r * math.sin(a), 0.86 + 0.08 * ((k * 7) % 3)
            tubo('tallo', [(x, y, 0.7), (px, py, pz - 0.05)], 0.008, verde, seg=4, muestras=1)
            bola('rosa', (px, py, pz), (0.07, 0.07, 0.055), rojo if k % 2 else rosa, n=4, p=2.4)
            bola('hoja', (px * 0.5 + x * 0.5 + 0.05, py * 0.5 + y * 0.5, pz - 0.12), (0.06, 0.02, 0.03), verde, n=3)
    # Cañones de confeti
    for s in (-1, 1):
        o = cilindro('cañón', (0, 0, 0.18), 0.07, 0.36, negro, seg=16)
        o.rotation_euler = (0.35, s * 0.3, 0)
        o.location = (s * 4.1, -3.0, 0.24)
        bola('boca cañón', (s * 4.1 + s * 0.06, -3.12, 0.6), (0.075, 0.075, 0.02), oro, n=4)
    # Corazones de neón en la pared del fondo
    neon = brillo('neon', '#FF4F8F', 5.0)
    for s in (-1, 1):
        tubo('neón', [(px, 3.12, pz) for px, pz in corazon(0.5, 40, s * 4.8, 2.4)], 0.022, neon, seg=6, muestras=2, cerrado=True)
    # Cuadro de APLAUSOS colgado sobre el público (se prende cuando toca aplaudir)
    caja('aplausos caja', (0, -4.2, 3.7), (0.85, 0.12, 0.24), negro, p=8, n=2)
    ap = caja('aplausos', (0, -4.33, 3.7), (0.78, 0.01, 0.19), brillo('aplausos', '#FF3030', 0.4), p=8, n=2, subsurf=0)
    DINAMICOS.append(ap)
    letras('letras aplausos', 'APLAUSOS', (0, -4.35, 3.7), 0.24, crema, fondo=0.012, bisel=0.004, giro=(math.pi / 2, 0, 0))
    for x in (-0.6, 0.6):
        tubo('cadena aplausos', [(x, -4.2, 3.95), (x, -4.0, 4.55)], 0.008, oro, seg=4, muestras=1)
    # Cables por el piso
    cable = mat('cable', '#111014', rough=0.6)
    for pts in (
        [(-3.3, -4.8, 0.02), (-2.6, -4.2, 0.02), (-2.9, -3.6, 0.02), (-4.4, -3.4, 0.02)],
        [(3.1, -5.2, 0.02), (2.2, -4.6, 0.02), (2.8, -3.8, 0.02), (4.6, -3.6, 0.02)],
        [(-1.0, -2.75, 0.25), (-1.3, -2.9, 0.06), (-2.2, -3.4, 0.02)],
        [(1.0, -2.75, 0.25), (1.3, -2.9, 0.06), (2.2, -3.4, 0.02)],
    ):
        tubo('cable', pts, 0.014, cable, seg=5, muestras=4)


def anclas():
    for nombre, pos in (('ancla_el', (-0.95, -0.2, 0.42)), ('ancla_ella', (0.95, -0.2, 0.42))):
        a = bpy.data.objects.new(nombre, None)
        clay.link(a, COLL)
        a.location = pos
        DINAMICOS.append(a)


def vestuario_presentador():
    """El corbatín (rojo con pepitas) y el micrófono de mano (rejilla, cuerpo plateado y banderita del show)."""
    rojo = fieltro('corbatin', '#E4574B')
    pepa = fieltro('crema', '#FFF1E4')
    oro = mat('oro', '#F2C14E', rough=0.32, metallic=0.75, coat=0.4)
    antes = set(COLL.objects)
    for s in (-1, 1):
        bola('ala', (s * 0.06, 0, 0), (0.06, 0.025, 0.04), rojo, n=4, p=2.2)
        for k in range(2):
            bola('pepa', (s * (0.04 + k * 0.035), -0.024, 0.012 - k * 0.022), (0.008, 0.004, 0.008), pepa, n=2)
    bola('nudo', (0, -0.006, 0), (0.024, 0.024, 0.026), rojo, n=4)
    nuevos = [o for o in COLL.objects if o not in antes]
    c = clay.join(nuevos, 'corbatin')
    DINAMICOS.append(c)
    antes = set(COLL.objects)
    plata = mat('microfono', '#D9D9E3', rough=0.25, metallic=0.85)
    torno('mic cuerpo', [(0.0, 0.0), (0.016, 0.0), (0.024, 0.13), (0.03, 0.15), (0.0, 0.15)], (0, 0, 0), plata, seg=16, subsurf=0)
    bola('mic rejilla', (0, 0, 0.18), 0.042, mat('rejilla', '#3A3A44', rough=0.45, metallic=0.6), n=4)
    torno('mic aro', [(0.03, -0.006), (0.034, 0.0), (0.03, 0.006)], (0, 0, 0.152), oro, seg=16, subsurf=0)
    caja('mic bandera', (0, -0.035, 0.11), (0.032, 0.006, 0.024), mat('bandera mic', '#FF6FA5', rough=0.6), n=2, subsurf=0)
    nuevos = [o for o in COLL.objects if o not in antes]
    m = clay.join(nuevos, 'microfono')
    DINAMICOS.append(m)


# --------------------------------------------------------------------------------------------- Armar y unir

def construir():
    global COLL, FUENTE
    clay.reset_scene()
    COLL = clay.collection('Show')
    FUENTE = fuente_fredoka()
    escenario()
    for x, rol in ((-0.95, 'el'), (0.95, 'ella')):
        atril(x, rol)
    atril_presentador()
    pantallas()
    letrero()
    telon()
    cercha_y_focos()
    camaras()
    publico()
    detalles()
    anclas()
    vestuario_presentador()
    # Bombillos por fase en una malla cada una
    for k, lista in enumerate(FASES):
        if lista:
            o = clay.join(list(lista), f'bombillos_{k}')
            DINAMICOS.append(o)
    return COLL


def unir_estaticos():
    """Todo lo que no se mueve se hornea en coordenadas del mundo y se une por material (pocas llamadas de dibujo)."""
    dinamicos = set()
    for o in DINAMICOS:
        stack = [o]
        while stack:
            x = stack.pop()
            dinamicos.add(x.name)
            stack.extend(x.children)
    dg = bpy.context.evaluated_depsgraph_get()
    por_mat = {}
    quitar = []
    for o in list(COLL.objects):
        if o.name in dinamicos or o.type != 'MESH':
            continue
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=False, depsgraph=dg)
        me.transform(o.matrix_world)
        m = o.active_material
        n = bpy.data.objects.new(f'horneado {o.name}', me)
        COLL.objects.link(n)
        por_mat.setdefault(m.name if m else 'sin', []).append(n)
        quitar.append(o)
    for o in quitar:
        bpy.data.objects.remove(o)
    for o in list(COLL.objects):
        if o.type == 'EMPTY' and o.name not in dinamicos and not o.children:
            bpy.data.objects.remove(o)
    for nombre, lista in por_mat.items():
        clay.join(lista, 'set ' + nombre.replace('Show | ', ''))


def exportar(salida):
    import exportar_glb
    os.makedirs(salida, exist_ok=True)
    objs = [o for o in COLL.objects]
    exportar_glb.exportar(objs, os.path.join(salida, 'show_estudio.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    salida = args[0] if args else os.path.join(HERE, '..', '..', 'juego', 'web', 'modelos-crudos')
    construir()
    unir_estaticos()
    caras = 0
    for o in COLL.objects:
        if o.type == 'MESH':
            dg = bpy.context.evaluated_depsgraph_get()
            caras += len(o.evaluated_get(dg).data.polygons)
    print('objetos', len(COLL.objects), 'caras', caras, flush=True)
    exportar(salida)
