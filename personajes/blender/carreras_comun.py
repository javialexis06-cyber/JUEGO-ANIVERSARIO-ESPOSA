"""Nuestro Hogar · La Carrera de las Tres Lunas: herramientas comunes de los modelos (carros, criaturas, objetos, pistas).

Convenciones (las de la granja): metros, z arriba, el frente hacia -y (en three.js queda hacia +z), la base en z=0 y
todo se construye en el origen y se mueve después (el origen de cada objeto queda en el origen del mundo).

Los materiales siguen el estilo del juego: «Tela | …» (fieltro, el juego le pone el relieve de felpa), «Madera | …»,
«Laca | …» (plastilina brillante) y «Luz | …» (lo que brilla). Lo que lleva «tinte» en el nombre lo pinta el juego con
el color de cada corredor.
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
from regalos import laca, luz, madera, tela  # noqa: E402
from granja_muebles import bola, caja, cilindro, mat, tubo  # noqa: E402,F401

FUENTE = os.path.join(HERE, 'fuentes', 'CinzelDecorative-Black.ttf')

# Los colores de las tres lunas (docs/mitologia.md: Aurelia dorada, Nocturna de ébano, Esmeralda verde)
AURELIA = '#F2C14E'
NOCTURNA = '#3B2E4F'
ESMERALDA = '#4FBF7A'


def oro():
    return laca('oro carrera', '#E8B83E', 0.3)


def nuevos(coll, antes):
    return [o for o in coll.objects if o not in antes]


def unir_por_material(objs, nombre):
    """Junta las mallas por material (menos llamadas de dibujo). Devuelve las mallas nuevas."""
    mallas = [o for o in objs if o.type == 'MESH' and len(o.data.polygons)]
    for o in objs:
        if o.type == 'MESH' and not len(o.data.polygons):
            bpy.data.objects.remove(o, do_unlink=True)
    grupos = {}
    for o in mallas:
        m = o.data.materials[0] if o.data.materials else None
        grupos.setdefault(m.name if m else '', []).append(o)
    out = []
    for k, (mn, lista) in enumerate(sorted(grupos.items())):
        for o in lista:
            o.parent = None
        if len(lista) == 1:
            clay.apply_modifiers(lista[0])
            lista[0].name = f'{nombre} {k}'
            out.append(lista[0])
        else:
            out.append(clay.join(lista, f'{nombre} {k}'))
    return out


def grupo(coll, nombre, pos, construir, rot=(0, 0, 0), unir=True):
    """Construye en el origen, junta por material y lo cuelga de un vacío en `pos` (el pivote para animar)."""
    antes = set(coll.objects)
    construir()
    hechos = nuevos(coll, antes)
    raiz = bpy.data.objects.new(nombre, None)
    clay.link(raiz, coll)
    hijos = unir_por_material(hechos, nombre) if unir else hechos
    for o in hijos:
        if o.parent is None:
            o.parent = raiz
    raiz.location = pos
    raiz.rotation_euler = rot
    return raiz


def marca(coll, nombre, pos, padre=None):
    """Un vacío que el juego lee (dónde se sienta el muñeco, dónde se engancha la criatura…)."""
    e = bpy.data.objects.new(nombre, None)
    clay.link(e, coll)
    e.location = pos
    if padre is not None:
        e.parent = padre
    return e


def disco(coll, nombre, c, r, grosor, material, eje='y', n=16):
    """Un botón/parche redondo de fieltro, plano en el eje dado."""
    rr = {'y': (r, grosor, r), 'x': (grosor, r, r), 'z': (r, r, grosor)}[eje]
    return clay.blob(nombre, c, rr, coll, material, n=max(4, n // 3), subsurf=1)


def media_luna(coll, nombre, c, r, material, eje='y', grosor=0.03, giro=0.0):
    """Una media luna (barrido en arco con las puntas finas), de frente al eje -y por defecto."""
    pts = []
    for k in range(9):
        a = giro + math.pi * 0.2 + math.pi * 1.6 * k / 8
        x, z = math.cos(a) * r, math.sin(a) * r
        pts.append((c[0] + x, c[1], c[2] + z) if eje == 'y' else (c[0], c[1] + x, c[2] + z) if eje == 'x' else (c[0] + x, c[1] + z, c[2]))
    radios = [r * 0.06, r * 0.22, r * 0.34, r * 0.4, r * 0.42, r * 0.4, r * 0.34, r * 0.22, r * 0.06]
    up = (0, 1, 0) if eje == 'y' else (1, 0, 0) if eje == 'x' else (0, 0, 1)
    return clay.sweep(nombre, pts, radios, (1.0, grosor / max(r * 0.42, 1e-3)), coll, material, segments=8, samples=3, up=up, subsurf=0)


def emblema(coll, c, s, eje='y', lado=-1):
    """El emblema de la carrera: las tres lunas (Aurelia dorada, Nocturna creciente y la pequeña Esmeralda) sobre un
    parche de fieltro crema con costura dorada. `lado` dice hacia dónde mira (−1: hacia −eje)."""
    off = lambda d: (c[0] + (d if eje == 'x' else 0), c[1] + (d if eje == 'y' else 0), c[2] + (d if eje == 'z' else 0))  # noqa: E731

    def p(dx, dz, d):
        if eje == 'y':
            return (c[0] + dx, c[1] + d * lado, c[2] + dz)
        if eje == 'x':
            return (c[0] + d * lado, c[1] - dx * lado, c[2] + dz)
        return (c[0] + dx, c[1] + dz, c[2] + d * lado)
    disco(coll, 'parche emblema', off(0), s * 0.95, s * 0.06, tela('parche crema', '#FFF3DA'), eje)
    ring = []
    for k in range(25):
        a = k / 24 * math.tau
        ring.append(p(math.cos(a) * s * 0.86, math.sin(a) * s * 0.86, s * 0.06))
    clay.sweep('costura emblema', ring, s * 0.035, (1, 1), coll, oro(), segments=6, samples=2, closed=True, caps=(None, None), subsurf=0)
    disco(coll, 'luna aurelia', p(-s * 0.28, s * 0.12, s * 0.08), s * 0.36, s * 0.07, laca('luna aurelia', AURELIA, 0.3), eje)
    media_luna(coll, 'luna nocturna', p(s * 0.3, s * 0.2, s * 0.08), s * 0.3, laca('luna nocturna', NOCTURNA, 0.3), eje, grosor=s * 0.1, giro=-0.3)
    disco(coll, 'luna esmeralda', p(s * 0.18, -s * 0.38, s * 0.08), s * 0.17, s * 0.07, laca('luna esmeralda', ESMERALDA, 0.3), eje)


def texto(coll, nombre, cadena, c, tam, material, grosor=0.05, rot=(math.pi / 2, 0, 0), fuente=FUENTE):
    """Letras de verdad (convertidas en malla), de frente hacia -y por defecto."""
    cu = bpy.data.curves.new(nombre, 'FONT')
    cu.body = cadena
    cu.size = tam
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.extrude = grosor
    cu.bevel_depth = grosor * 0.5
    cu.bevel_resolution = 2
    if fuente and os.path.exists(fuente):
        cu.font = bpy.data.fonts.load(fuente, check_existing=True)
    ob = bpy.data.objects.new(nombre, cu)
    clay.link(ob, coll)
    ob.rotation_euler = rot
    ob.location = c
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.clear()
    ob.data.materials.append(material)
    for f in ob.data.polygons:
        f.use_smooth = False
    # (las letras quedan en el mundo: se aplica la transformación para que el grupo las mueva bien)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return ob


def malla(coll, nombre, verts, caras, material, liso=True):
    return clay.make_mesh_object(nombre, verts, caras, coll, smooth=liso, material=material)


def exportar(raices, ruta):
    import exportar_glb
    objs = []
    for r in raices:
        objs.extend(exportar_glb.arbol(r))
    exportar_glb.exportar(objs, ruta)


def raiz_pieza(coll, clave, construir):
    """Pieza de kit: todo lo nuevo cuelga de un vacío «m_<clave>» en el origen."""
    antes = set(coll.objects)
    construir(coll)
    raiz = bpy.data.objects.new(f'm_{clave}', None)
    clay.link(raiz, coll)
    for o in nuevos(coll, antes):
        if o is not raiz and o.parent is None:
            o.parent = raiz
    return raiz


RNG = np.random.default_rng(3)
