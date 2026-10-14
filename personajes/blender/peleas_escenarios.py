"""Nuestro Hogar · El Torneo del Despertar Dorado (peleas): los tres escenarios de la pelea, en el estilo del juego
(madera, fieltro, laca y plastilina, todo redondeado), armados con piezas nuevas y con los kits de la granja.

  plaza       La Plaza del Pueblo del Sol en la Fiesta del Despertar Dorado: la tarima de madera con su faldón dorado,
              las gradas con el público de peluche, el letrero del torneo, los arcos y guirnaldas de la fiesta, las
              fogatas festivas, el puesto del pan de miel, las casas del pueblo y las lomas del valle.
  brasaviva   Las termas al pie del volcán: el piso de columnas de basalto con grietas de lava, las termas con vapor,
              las casas de Brasaviva con faroles rojos, las vacas volcánicas, rocas y el volcán humeando al fondo.
  nieveclara  El lago helado de los rescatistas: la pista de hielo con su borde de nieve, pinos nevados, las casas de
              Nieveclara, muñecos de nieve, el estanque, las ovejas de cristal y las montañas.

Medidas del juego: la pelea va por la línea y=0 (de x=-8 a x=8), el piso de pelea en z=0, la cámara del lado de -y.
Cada escenario es UN GLB (modelos/peleas/<id>.glb). Lo quieto queda bajo un solo vacío «estatico» (el optimizador junta
sus mallas por material: pocas llamadas de dibujo); lo que se mueve va en vacíos «vivo_<tipo>_<n>» (el juego hace saltar
al público, temblar las llamas y subir el vapor).

Uso: blender -b -P peleas_escenarios.py -- <carpeta_salida> [plaza,brasaviva,nieveclara]
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
from granja_muebles import bola, caja, cilindro, mat, metal, piedra, tubo  # noqa: E402
import granja_festivales as fest  # noqa: E402
import granja_pueblo as pueblo  # noqa: E402
import granja_monte as monte  # noqa: E402
import granja_edificios as edif  # noqa: E402
import granja_astra as astra  # noqa: E402
import granja_astra_paisaje as paisaje  # noqa: E402

RNG = np.random.default_rng(2026)
FUENTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
ORO = lambda: laca('oro torneo', '#F2B632', 0.3)  # noqa: E731
ORO_CLARO = lambda: laca('oro claro torneo', '#FFE08A', 0.3)  # noqa: E731
NIEVE = lambda: mat('nieve torneo', '#F4F7FA', 0.75)  # noqa: E731


# ------------------------------------------------------------------------------------------------ armar
class Escena:
    """Junta lo que se construye: piezas quietas (que después van bajo «estatico») y piezas vivas."""

    def __init__(self, nombre):
        _FAMILIAS.clear()
        self.coll = clay.collection(f'Peleas {nombre}')
        self.raiz = bpy.data.objects.new(nombre, None)
        clay.link(self.raiz, self.coll)
        self.estatico = bpy.data.objects.new('estatico', None)
        clay.link(self.estatico, self.coll)
        self.estatico.parent = self.raiz
        self.vivos = []
        self.n = 0

    def _nuevos(self, antes):
        return [o for o in self.coll.objects if o not in antes and o.parent is None and o not in (self.raiz, self.estatico)]

    def pieza(self, fn, loc=(0, 0, 0), rot=0.0, esc=1.0, vivo=None):
        """Construye `fn(coll)` en el origen y lo pone en su lugar (girado en z y escalado)."""
        antes = set(self.coll.objects)
        fn(self.coll)
        nuevos = self._nuevos(antes)
        self.n += 1
        e = bpy.data.objects.new(f'{vivo}_{self.n}' if vivo else f'pieza_{self.n}', None)
        clay.link(e, self.coll)
        e.location = loc
        e.rotation_euler = (0, 0, rot)
        e.scale = (esc, esc, esc) if not isinstance(esc, (tuple, list)) else esc
        for o in nuevos:
            o.parent = e
        if vivo:
            e.parent = self.raiz
            self.vivos.append(e)
        else:
            e.parent = self.estatico
        return e

    def terminar(self):
        """Junta las mallas: lo quieto, todo en una malla por material bajo «estatico»; cada pieza viva, en una sola
        malla (con sus materiales) bajo su vacío. Así el escenario se dibuja con pocas llamadas."""
        bpy.context.view_layer.update()
        quietas = [o for o in exportar_arbol(self.estatico) if o.type == 'MESH']
        # (en tandas, para no armar una malla gigante de una vez)
        for k in range(0, len(quietas), 400):
            fundir(quietas[k:k + 400], f'estatico {k // 400}', self.estatico, self.coll)
        for v in self.vivos:
            objs = [o for o in exportar_arbol(v) if o.type == 'MESH']
            if objs:
                fundir(objs, f'{v.name} malla', v, self.coll)
        for o in list(exportar_arbol(self.raiz)):
            if o.type == 'EMPTY' and o not in (self.raiz, self.estatico) and o not in self.vivos and not o.children:
                bpy.data.objects.remove(o)


def _bsdf(m):
    if not m or not m.use_nodes:
        return None
    return next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)


def color_de(m):
    """El color base (lineal) como lo deja el exportador: el del medio de la rampa si el fieltro la tiene."""
    b = _bsdf(m)
    if not b:
        return (0.8, 0.8, 0.8)
    c = b.inputs['Base Color']
    if c.is_linked:
        src = c.links[0].from_node
        if src.type == 'VALTORGB':
            els = src.color_ramp.elements
            return tuple((els[len(els) // 2].color if len(els) > 2 else els[-1].color)[:3])
        if src.type in ('TEX_BRICK', 'TEX_CHECKER'):
            a, b2 = src.inputs['Color1'].default_value, src.inputs['Color2'].default_value
            return tuple((x + y) / 2 for x, y in zip(a[:3], b2[:3]))
    return tuple(c.default_value[:3])


_FAMILIAS = {}


def familia(m):
    """Un material blanco por familia (fieltro, madera, laca, piedra…, con su aspereza): el color va en los vértices.
    Lo que brilla (luz) se queda con su material."""
    b = _bsdf(m)
    if not b:
        return None
    em = b.inputs.get('Emission Strength')
    if em is not None and em.default_value > 0.01:
        return None
    if b.inputs.get('Alpha') is not None and b.inputs['Alpha'].default_value < 0.99:
        return None
    tipo = m.name.split('|')[0].strip() if '|' in m.name else 'Base'
    clave = (tipo, round(b.inputs['Roughness'].default_value * 5) / 5, round(b.inputs['Metallic'].default_value * 2) / 2,
             round((b.inputs['Coat Weight'].default_value if 'Coat Weight' in b.inputs else 0) * 2) / 2)
    if clave not in _FAMILIAS:
        f = m.copy()
        f.name = f'{tipo} | familia {len(_FAMILIAS)}'
        bf = _bsdf(f)
        c = bf.inputs['Base Color']
        if c.is_linked:
            f.node_tree.links.remove(c.links[0])
        c.default_value = (1, 1, 1, 1)
        for k in ('fieltro', 'relieve'):
            if k in m.keys():
                f[k] = m[k]
        if m.name.startswith('Tela') or m.name.startswith('Granja'):
            f['fieltro'] = 1
        _FAMILIAS[clave] = f
    return _FAMILIAS[clave]


def fundir(objs, nombre, padre, coll):
    """Una sola malla con todas estas (modificadores aplicados), en el espacio de `padre`, con el color de cada material
    pintado en los vértices y los materiales reducidos a sus familias (muy pocas llamadas de dibujo)."""
    import bmesh
    dg = bpy.context.evaluated_depsgraph_get()
    inv = padre.matrix_world.inverted()
    bm = bmesh.new()
    capa = bm.loops.layers.float_color.new('Color')
    mats = []
    for o in objs:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(inv @ o.matrix_world)
        mapa, colores = [], []
        for m in me.materials:
            f = familia(m) or m
            if f not in mats:
                mats.append(f)
            mapa.append(mats.index(f))
            colores.append((*color_de(m), 1.0) if familia(m) else (1.0, 1.0, 1.0, 1.0))
        if not mapa:
            mapa, colores = [0], [(0.8, 0.8, 0.8, 1.0)]
            if not mats:
                mats.append(None)
        antes = len(bm.faces)
        indices = [p.material_index for p in me.polygons]
        bm.from_mesh(me)
        bm.faces.ensure_lookup_table()
        for i, cara in enumerate(bm.faces[antes:]):
            mi = indices[i] if i < len(indices) else 0
            mi = min(mi, len(mapa) - 1)
            cara.material_index = mapa[mi]
            for lp in cara.loops:
                lp[capa] = colores[mi]
        bpy.data.meshes.remove(me)
    for o in objs:
        bpy.data.objects.remove(o)
    me = bpy.data.meshes.new(nombre)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    if me.color_attributes:
        me.color_attributes.active_color = me.color_attributes[0]
        me.color_attributes.render_color_index = 0
    ob = bpy.data.objects.new(nombre, me)
    coll.objects.link(ob)
    ob.parent = padre
    ob.matrix_parent_inverse.identity()
    return ob


def exportar_arbol(r):
    pila, out = [r], []
    while pila:
        o = pila.pop()
        out.append(o)
        pila.extend(o.children)
    return out


def con(fn, *a, **k):
    return lambda coll: fn(coll, *a, **k)


# ------------------------------------------------------------------------------------------------ piezas nuevas
def texto(coll, cuerpo, c, tam, cara, canto, extrude=0.06):
    cu = bpy.data.curves.new(f'texto {cuerpo}', 'FONT')
    cu.body = cuerpo
    cu.font = bpy.data.fonts.load(FUENTE, check_existing=True)
    cu.size = tam
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.extrude = extrude
    cu.bevel_depth = 0.0
    cu.space_character = 1.08
    cu.bevel_resolution = 3
    cu.resolution_u = 6
    ob = bpy.data.objects.new(f'texto {cuerpo}', cu)
    coll.objects.link(ob)
    ob.location = c
    ob.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.append(cara)
    ob.data.materials.append(canto)
    mw = ob.matrix_world.to_3x3()
    for p in ob.data.polygons:
        p.material_index = 0
        p.use_smooth = True
    # El origen en el del mundo (como todo lo demás)
    me = ob.data
    me.transform(ob.matrix_basis)
    ob.matrix_basis.identity()
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.0005)
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me)
    bm.free()
    return ob


def sol(coll, c, r, cara=None):
    """Un sol de fieltro con rayos y carita (el emblema del Despertar Dorado)."""
    x, y, z = c
    o = cilindro(coll, 'sol disco', (x, y, z), r, 0.08, ORO(), seg=28)
    o.rotation_euler = (math.radians(90), 0, 0)
    o.location = (x, y + 0.04, z)
    me = o.data
    me.transform(o.matrix_basis)
    o.matrix_basis.identity()
    for k in range(12):
        a = k / 12 * math.tau
        largo = r * (0.55 if k % 2 else 0.4)
        tubo(coll, f'rayo sol {k}', [(x + math.cos(a) * r * 1.02, y, z + math.sin(a) * r * 1.02), (x + math.cos(a) * (r + largo), y, z + math.sin(a) * (r + largo))], r * 0.07, ORO_CLARO(), seg=6)
    if cara is not False:
        for s in (-1, 1):
            bola(coll, f'ojo sol {s}', (x + s * r * 0.32, y - 0.08, z + r * 0.12), (r * 0.08, r * 0.04, r * 0.11), laca('ojo sol', '#4A2716'), n=3, sub=0)
            bola(coll, f'cachete sol {s}', (x + s * r * 0.5, y - 0.07, z - r * 0.15), (r * 0.13, r * 0.03, r * 0.09), tela('cachete sol', '#F28C7A'), n=3, sub=0)
        tubo(coll, 'sonrisa sol', [(x - r * 0.28, y - 0.08, z - r * 0.16), (x, y - 0.08, z - r * 0.38), (x + r * 0.28, y - 0.08, z - r * 0.16)], r * 0.045, laca('ojo sol', '#4A2716'), seg=5)


def espectador(coll, color, piel, pelo, rasgo='brazos', alto=1.0, sx=0.0):
    """Un vecino de peluche en las gradas: cuerpo gordito, cabeza cuadradita redondeada, ojos brillantes, boca abierta
    de la emoción y los brazos arriba (o un banderín, un gorro de fiesta, una bufanda o un sombrero)."""
    a = alto
    ropa = tela(f'ropa público {color}', color)
    pi = tela(f'piel público {piel}', piel)
    clay.blob('cuerpo público', (sx, 0, 0.36 * a), (0.31 * a, 0.27 * a, 0.36 * a), coll, ropa, n=4, subsurf=0)
    clay.blob('cabeza público', (sx, -0.02, 0.98 * a), (0.36 * a, 0.31 * a, 0.31 * a), coll, pi, n=5, p=3.0, subsurf=0)
    clay.blob('pelo público', (sx, 0.04, 1.16 * a), (0.37 * a, 0.32 * a, 0.16 * a), coll, tela(f'pelo público {pelo}', pelo), n=4, p=2.6, subsurf=0)
    negro = laca('ojo público', '#2A1A14', 0.2)
    for s in (-1, 1):
        clay.blob('ojo público', (sx + s * 0.12 * a, -0.3 * a, 0.99 * a), (0.05 * a, 0.03 * a, 0.065 * a), coll, negro, n=3, subsurf=0)
        clay.blob('brillo ojo público', (sx + s * 0.12 * a + 0.015, -0.325 * a, 1.02 * a), (0.016 * a, 0.01 * a, 0.016 * a), coll, laca('brillo público', '#FFFFFF', 0.2), n=2, subsurf=0)
        clay.blob('cachete público', (sx + s * 0.22 * a, -0.27 * a, 0.9 * a), (0.06 * a, 0.02 * a, 0.04 * a), coll, tela('cachete público', '#F4A3A3'), n=3, subsurf=0)
    clay.blob('boca público', (sx, -0.305 * a, 0.86 * a), (0.06 * a, 0.02 * a, 0.05 * a), coll, laca('boca público', '#8A2A2A', 0.4), n=3, subsurf=0)
    if rasgo in ('brazos', 'banderin'):
        for s in (-1, 1):
            arriba = 1.0 if (rasgo == 'brazos' or s > 0) else 0.55
            mano = (sx + s * 0.5 * a, -0.06 * a, (0.62 + 0.42 * arriba) * a)
            tubo(coll, 'brazo público', [(sx + s * 0.26 * a, 0, 0.55 * a), mano], 0.08 * a, ropa, seg=6)
            clay.blob('mano público', mano, (0.085 * a,) * 3, coll, pi, n=3, subsurf=0)
        if rasgo == 'banderin':
            mx = sx + 0.5 * a
            tubo(coll, 'palo banderín', [(mx, -0.08 * a, 0.95 * a), (mx, -0.08 * a, 1.7 * a)], 0.018, madera('palo banderín', '#9A6A48'), seg=5)
            fest.triangulo(coll, 'banderín público', (mx + 0.01, -0.08 * a, 1.58 * a), 0.18 * a, 0.35 * a, tela('banderín público', '#F6C445'), giro=0.0)
    else:
        for s in (-1, 1):
            tubo(coll, 'brazo público', [(sx + s * 0.27 * a, 0, 0.55 * a), (sx + s * 0.36 * a, -0.1 * a, 0.3 * a)], 0.08 * a, ropa, seg=6)
    if rasgo == 'gorro':
        clay.lathe('gorro fiesta', [(0.0, 0.0), (0.16 * a, 0.0), (0.0, 0.36 * a)], coll, laca('gorro fiesta', '#E4566B'), segments=10, subsurf=0).location = (sx, 0.02, 1.22 * a)
        clay.blob('pompón', (sx, 0.02, 1.6 * a), (0.05 * a,) * 3, coll, tela('pompón', '#FFF4C8'), n=3, subsurf=0)
    elif rasgo == 'bufanda':
        clay.lathe('bufanda', [(0.2 * a, -0.06 * a), (0.3 * a, -0.06 * a), (0.31 * a, 0.06 * a), (0.2 * a, 0.06 * a)], coll, tela('bufanda', '#E4574B'), segments=12, subsurf=0).location = (sx, 0, 0.7 * a)
        clay.blob('gorro lana', (sx, 0.03, 1.18 * a), (0.34 * a, 0.3 * a, 0.2 * a), coll, tela('gorro lana público', '#3B6FB6'), n=4, subsurf=0)
    elif rasgo == 'sombrero':
        cilindro(coll, 'ala sombrero', (sx, 0.03, 1.2 * a), 0.46 * a, 0.03 * a, tela('sombrero paja', '#E8C77A'), seg=16)
        cilindro(coll, 'copa sombrero', (sx, 0.03, 1.22 * a), 0.25 * a, 0.2 * a, tela('sombrero paja', '#E8C77A'), seg=16, r2=0.21 * a)


def fila_publico(e, x0, x1, y, z, colores, rasgos, alto=1.0, pieles=('#F3CFB3', '#E5B48F', '#C98E66', '#A8714D', '#8D5A3B'), pelos=('#2B2422', '#5A3A28', '#B0532F', '#E8CF8F', '#1F1D2E')):
    """Una fila de espectadores, de a cuatro por vacío (saltan juntos)."""
    xs = np.arange(x0, x1 + 0.01, 0.85)
    for k in range(0, len(xs), 4):
        par = xs[k:k + 4]
        cx = float(par.mean())

        def armar(coll, par=par, cx=cx, k=k):
            for j, x in enumerate(par):
                i = k + j
                espectador(coll, colores[i % len(colores)], pieles[(i * 3) % len(pieles)], pelos[(i * 7) % len(pelos)], rasgos[i % len(rasgos)],
                           alto * (0.92 + RNG.random() * 0.16), sx=float(x - cx))
        e.pieza(armar, (cx, y, z), 0.0, vivo='vivo_publico')


def gradas(coll, ancho, filas=3, color='#B27A4A'):
    """Gradas de tablones (bajan hacia la cámara)."""
    m1, m2 = madera('grada', color), madera('grada oscura', '#7E5232')
    for f in range(filas):
        z = 0.45 + f * 0.5
        y = f * 0.9
        caja(coll, f'grada asiento {f}', (0, y, z), (ancho / 2, 0.42, 0.07), m1, p=8, sub=0)
        caja(coll, f'grada frente {f}', (0, y - 0.38, z / 2), (ancho / 2, 0.05, z / 2), m2, p=8, sub=0)
        for x in np.arange(-ancho / 2 + 0.3, ancho / 2, 2.4):
            caja(coll, f'grada pata {f} {x}', (x, y + 0.3, z / 2), (0.08, 0.08, z / 2), m2, p=8, sub=0)


def fogata(coll):
    """Fogata festiva (sin la llama, que es viva): piedras en círculo, leños cruzados y brasas."""
    for k in range(10):
        a = k / 10 * math.tau
        clay.blob(f'piedra fogata {k}', (math.cos(a) * 0.62, math.sin(a) * 0.62, 0.12), (0.2, 0.17, 0.15), coll, piedra('fogata', ('#8C847A', '#A39A8E')[k % 2]), n=3, subsurf=0)
    for k in range(4):
        a = k / 4 * math.pi
        tubo(coll, f'leño {k}', [(math.cos(a) * 0.5, math.sin(a) * 0.5, 0.12), (-math.cos(a) * 0.15, -math.sin(a) * 0.15, 0.42)], 0.08, madera('leño', '#6B4430'), seg=6)
    for k in range(7):
        clay.blob(f'brasa {k}', ((RNG.random() - 0.5) * 0.5, (RNG.random() - 0.5) * 0.5, 0.08), (0.08, 0.08, 0.05), coll, luz('brasa', '#FF6A1A', 3.0), n=2, subsurf=0)


def llama(coll, tam=1.0):
    """La llama (viva): tres gotas de luz una dentro de otra."""
    def gota(v):
        z = v[:, 2]
        k = np.clip((z + 1) / 2, 0, 1)
        v = v.copy()
        v[:, 0] *= 1.0 - k * 0.75
        v[:, 1] *= 1.0 - k * 0.75
        return v
    for i, (r, h, c, f) in enumerate([(0.42, 0.75, '#FF7A2A', 4.0), (0.3, 0.55, '#FFB347', 6.0), (0.16, 0.35, '#FFF0A0', 8.0)]):
        clay.blob(f'llama {i}', (0, -i * 0.04, 0.42 + h * tam * 0.85), (r * tam, r * tam, h * tam), coll, luz(f'llama {i}', c, f), n=4, subsurf=0, shaper=gota)


def tarima(coll, ancho=19.0, fondo=3.8, alto=0.42):
    """La tarima del torneo: tablones, faldón de fieltro dorado con banderines y postes con perillas."""
    for k, y in enumerate(np.arange(-fondo / 2 + 0.17, fondo / 2, 0.34)):
        caja(coll, f'tablón {k}', (0, y, -0.05), (ancho / 2, 0.16, 0.05), madera(f'tablón {k % 3}', ('#D6A46E', '#C99560', '#DDB07A')[k % 3]), p=10, sub=0)
    caja(coll, 'cuerpo tarima', (0, 0, -alto / 2 - 0.05), (ancho / 2, fondo / 2, alto / 2), madera('tarima', '#9A6A48'), p=10, sub=0)
    falda = tela('faldón dorado', '#E9A92B')
    caja(coll, 'faldón', (0, -fondo / 2 - 0.03, -alto / 2 - 0.06), (ancho / 2 + 0.02, 0.03, alto / 2), falda, p=10, sub=0)
    for k, x in enumerate(np.arange(-ancho / 2 + 0.3, ancho / 2, 0.6)):
        fest.triangulo(coll, f'pico faldón {k}', (x, -fondo / 2 - 0.07, -0.08), 0.26, 0.24, tela(f'pico {k % 2}', ('#C2273E', '#FFF4E0')[k % 2]), giro=0.0)
    cinta = tela('cinta borde', '#C2273E')
    caja(coll, 'cinta borde', (0, -fondo / 2 - 0.06, -0.05), (ancho / 2 + 0.03, 0.03, 0.05), cinta, p=10, sub=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (ancho / 2 - 0.15), sy * (fondo / 2 - 0.15)
            cilindro(coll, f'poste {sx} {sy}', (x, y, -0.05), 0.12, 1.25 if sy > 0 else 0.6, madera('poste', '#7E5232'), seg=10)
            bola(coll, f'perilla {sx} {sy}', (x, y, (1.3 if sy > 0 else 0.65)), 0.17, ORO(), n=4)
    # Cuerdas solo atrás (las de adelante taparían la pelea)
    for z, c in ((0.55, '#C2273E'), (1.0, '#F6C445')):
        tubo(coll, f'cuerda {z}', [(-ancho / 2 + 0.15, fondo / 2 - 0.15, z), (0, fondo / 2 - 0.1, z - 0.12), (ancho / 2 - 0.15, fondo / 2 - 0.15, z)], 0.035, tela(f'cuerda {c}', c), seg=6)


def letrero_torneo(coll):
    """El letrero grande del torneo, colgado de dos postes, con el sol del Despertar Dorado."""
    m = madera('letrero', '#8A5A3B')
    for s in (-1, 1):
        cilindro(coll, f'poste letrero {s}', (s * 5.2, 0, 0), 0.18, 5.4, m, seg=10)
        bola(coll, f'remate letrero {s}', (s * 5.2, 0, 5.5), 0.26, ORO(), n=4)
    caja(coll, 'tabla letrero', (0, 0.05, 4.3), (4.9, 0.12, 0.72), madera('tabla letrero', '#6B4430'), p=8, sub=0)
    caja(coll, 'marco letrero', (0, 0.16, 4.3), (5.0, 0.06, 0.8), ORO(), p=8, sub=0)
    texto(coll, 'TORNEO DEL', (0, -0.2, 4.62), 0.42, ORO_CLARO(), laca('canto letras', '#C98A1A'))
    texto(coll, 'DESPERTAR DORADO', (0, -0.2, 4.06), 0.62, ORO_CLARO(), laca('canto letras', '#C98A1A'))
    sol(coll, (0, -0.1, 5.55), 0.62)
    for s in (-1, 1):
        for k in range(5):
            fest.triangulo(coll, f'banderín letrero {s} {k}', (s * (1.4 + k * 0.75), -0.1, 3.42), 0.22, 0.42, tela(f'banderín {k % 3}', ('#F6C445', '#C2273E', '#FFF4E0')[k % 3]), giro=0.0)


def loma(coll, c, r, color, semilla):
    monte.grumo(coll, f'loma {semilla}', c, r, mat(f'loma {color}', color, 0.95), semilla)


def montana(coll, c, alto, ancho, color, nieve=None, lava=None):
    x, y, z = c
    o = clay.lathe(f'montaña {x}', [(0.0, 0.0), (ancho, 0.0), (ancho * 0.6, alto * 0.45), (ancho * 0.25, alto * 0.85), (ancho * 0.12, alto), (0.0, alto)], None, mat(f'montaña {color}', color, 0.95), segments=14, subsurf=0)
    o.location = (x, y, z)
    o.scale = (1, 0.6, 1)
    out = [o]
    if nieve:
        n = clay.lathe(f'nieve montaña {x}', [(ancho * 0.33, alto * 0.72), (ancho * 0.25, alto * 0.85), (ancho * 0.12, alto + 0.05), (0.0, alto + 0.08)], None, NIEVE(), segments=14, subsurf=0)
        n.location = (x, y, z)
        n.scale = (1.04, 0.64, 1)
        out.append(n)
    if lava:
        n = clay.lathe(f'boca volcán {x}', [(ancho * 0.12, alto - 0.3), (ancho * 0.1, alto + 0.05), (0.0, alto + 0.02)], None, luz('lava volcán', '#FF6A1A', 6.0), segments=14, subsurf=0)
        n.location = (x, y, z)
        out.append(n)
        for k in range(3):
            a = -0.5 + k * 0.5
            tubo(None, f'río lava {k}', [(x + a * 0.6, y - 0.6 * ancho * 0.1, z + alto * 0.98), (x + a * ancho * 0.3, y - ancho * 0.3, z + alto * 0.55), (x + a * ancho * 0.5, y - ancho * 0.45, z + alto * 0.1)], ancho * 0.03,
                 luz('lava volcán', '#FF6A1A', 6.0), seg=6)
    return out


def en(coll, objs):
    for o in objs:
        if o.users_collection:
            for c in o.users_collection:
                c.objects.unlink(o)
        coll.objects.link(o)


def suelo(coll, color, z, mitad=(40, 30)):
    o = clay.rbox('suelo', (0, mitad[1] * 0.5, z - 0.2), (mitad[0], mitad[1], 0.2), coll, mat('suelo ' + color, color, 0.95), p=8, n=3, subsurf=0)
    return o


def piedritas(coll, n, x0, x1, y0, y1, z, colores, tam=(0.14, 0.3)):
    for k in range(n):
        x, y = x0 + RNG.random() * (x1 - x0), y0 + RNG.random() * (y1 - y0)
        r = tam[0] + RNG.random() * (tam[1] - tam[0])
        clay.blob(f'piedrita {k}', (x, y, z + r * 0.15), (r, r * 0.8, r * 0.3), coll, piedra('piedrita', colores[k % len(colores)]), n=2, subsurf=0)


# ------------------------------------------------------------------------------------------------ escenarios
def plaza():
    e = Escena('plaza')
    # Piso: la plaza empedrada (más abajo que la tarima) y el valle
    e.pieza(lambda coll: suelo(coll, '#C9A26E', -0.42))
    e.pieza(lambda coll: piedritas(coll, 260, -24, 24, -7, 3, -0.42, ('#D9B98A', '#BFA078', '#E2C79A'), (0.18, 0.34)))
    e.pieza(tarima)
    # Adelante, a los lados de la tarima: fogatas festivas y canastas con pan de miel
    for s in (-1, 1):
        e.pieza(fogata, (s * 11.2, -0.8, -0.42))
        e.pieza(llama, (s * 11.2, -0.8, -0.42), vivo='vivo_llama')
        e.pieza(pueblo.m_caja, (s * 10.3, -2.6, -0.42), 0.3)
        e.pieza(fest.m_extra_primavera, (s * 13.5, 1.0, -0.42), s * 0.3)
    # Las gradas con el público
    e.pieza(con(gradas, 26, 3), (0, 6.0, -0.42))
    colores = ('#E4566B', '#4F8FE0', '#F6C445', '#7CCF6B', '#C46BD6', '#F28C45', '#3FB5A3', '#FFF4E0')
    for f in range(3):
        fila_publico(e, -12.2 + (f % 2) * 0.4, 12.2, 6.0 + f * 0.9, -0.42 + 0.5 + f * 0.5, colores[f:] + colores[:f], ('brazos', 'banderin', 'gorro', 'brazos', 'sombrero', 'banderin'), 0.95)
    # El letrero del torneo y la fiesta: arco, postes con guirnaldas
    e.pieza(letrero_torneo, (0, 10.5, -1.9), 0, 1.3)
    for s in (-1, 1):
        e.pieza(fest.m_poste_verano, (s * 8.6, 10.0, -0.42))
        e.pieza(fest.m_poste_primavera, (s * 16.6, 10.0, -0.42))
        for k in range(4):
            e.pieza(fest.m_tira_verano, (s * (8.6 + k * 2.0) - (2.0 if s < 0 else 0), 10.0, 2.53))
    # El puesto del pan de miel y el de las flores, a los lados
    e.pieza(pueblo.m_puesto_mercado_mostaza, (-17, 3.0, -0.42), 0.35)
    e.pieza(pueblo.m_puesto_mercado_verde, (17, 3.0, -0.42), -0.35)
    e.pieza(fest.m_centro_verano, (0, 15.5, -0.42))
    # Las casas del Pueblo del Sol
    casas = [('edificio_posada_10x8', -14, 19), ('edificio_semillas_8x7', -5, 21), ('edificio_carpinteria_9x7', 6, 20.5), ('edificio_clinica_7x6', 15, 19), ('edificio_animales_7x6', -24, 22), ('edificio_archivo_9x7', 24, 22)]
    for clave, x, y in casas:
        e.pieza(edif.PIEZAS[clave], (x, y, -0.42), (RNG.random() - 0.5) * 0.3)
    for x, y in ((-11.5, 13), (12, 13.5), (-21, 14), (21, 14.5), (0, 26), (-30, 27), (30, 27)):
        e.pieza(pueblo.m_arbol_a if x < 0 else pueblo.m_arbol_b, (x, y, -0.42), RNG.random() * 6, 1.2)
    for x in (-12, -6, 6, 12):
        e.pieza(pueblo.m_farol, (x, 12.5, -0.42))
    # El valle: lomas verdes y doradas
    def valle(coll):
        for k, (x, y, r, c) in enumerate([(-40, 45, 18, '#8FBF5A'), (-12, 50, 16, '#A9C86A'), (14, 48, 20, '#86B354'), (42, 46, 17, '#B9C96A'), (0, 60, 26, '#7FA84E')]):
            loma(coll, (x, y, -6), (r * 1.6, r * 0.7, r * 0.55), c, k)
    e.pieza(valle)
    e.terminar()
    return e


def columnas_basalto(coll, ancho=19.0, fondo=4.0):
    """El piso de Brasaviva: columnas de basalto hexagonales con las grietas de lava entre medio."""
    oscuros = ('#3E3A3C', '#4A4244', '#36323A')
    r = 0.42
    dx, dy = r * 1.5, r * math.sqrt(3)
    i = 0
    for cx in np.arange(-ancho / 2, ancho / 2 + 0.01, dx):
        col = int(round((cx + ancho / 2) / dx))
        for cy in np.arange(-fondo / 2, fondo / 2 + 0.01, dy):
            y = cy + (dy / 2 if col % 2 else 0)
            h = 1.2 + RNG.random() * 0.3
            dz = -0.02 - RNG.random() * 0.05
            o = clay.lathe(f'columna {i}', [(0.0, -h), (r * 0.97, -h), (r * 0.97, dz - 0.04), (r * 0.9, dz), (0.0, dz)], coll, piedra(f'basalto {i % 3}', oscuros[i % 3]), segments=6, subsurf=0)
            o.location = (cx, y, 0)
            o.rotation_euler = (0, 0, math.radians(30))
            me = o.data
            me.transform(o.matrix_basis)
            o.matrix_basis.identity()
            i += 1
    # La lava que brilla entre las columnas (abajito)
    caja(coll, 'lava entre columnas', (0, 0, -0.12), (ancho / 2 + 0.4, fondo / 2 + 0.4, 0.04), luz('lava piso', '#FF5A1A', 2.2), p=8, sub=0)


def faroles(coll, x0, x1, z, color='#E4574B'):
    """Una cuerda de faroles de papel (los rojos de Brasaviva)."""
    pts = [(x, 0, z - 0.4 * math.sin((x - x0) / (x1 - x0) * math.pi)) for x in np.linspace(x0, x1, 9)]
    tubo(coll, 'cuerda faroles', pts, 0.02, tela('cuerda faroles', '#4A2716'), seg=4)
    for k, p in enumerate(pts[1:-1]):
        fest.farolillo(coll, f'farol {k}', (p[0], p[1], p[2] - 0.32), 0.22, (color, '#F6C445')[k % 2], fuerza=1.6)


def brasaviva():
    e = Escena('brasaviva')
    e.pieza(lambda coll: suelo(coll, '#4A3A3A', -0.5))
    e.pieza(columnas_basalto)
    e.pieza(lambda coll: piedritas(coll, 160, -24, 24, -7, 4, -0.5, ('#2E2A2C', '#5A4E4A', '#3E3438'), (0.2, 0.45)))
    for s in (-1, 1):
        e.pieza(fogata, (s * 11.3, -0.9, -0.5))
        e.pieza(con(llama, 1.2), (s * 11.3, -0.9, -0.5), vivo='vivo_llama')
        e.pieza(paisaje.m_charco_lava, (s * 13.5, -2.8, -0.5), s)
        e.pieza(paisaje.m_basalto, (s * 12.6, 1.6, -0.5), s * 0.6, 1.1)
    # Rocas donde se sienta el público
    def repisa(coll):
        for k, x in enumerate(np.arange(-12, 12.1, 2.0)):
            clay.blob(f'roca repisa {k}', (x, 0, 0.25), (1.2, 0.8, 0.5), coll, piedra('repisa', ('#5A4E4A', '#4A4244')[k % 2]), n=3, subsurf=0)
            clay.blob(f'roca repisa alta {k}', (x + 1, 1.1, 0.75), (1.2, 0.8, 0.8), coll, piedra('repisa', ('#4A4244', '#5A4E4A')[k % 2]), n=3, subsurf=0)
    e.pieza(repisa, (0, 6.0, -0.5))
    colores = ('#E0572E', '#F6C445', '#C2273E', '#F28C45', '#FFF4E0', '#8A5A3B')
    fila_publico(e, -11.5, 11.5, 5.9, 0.2 - 0.5, colores, ('brazos', 'sombrero', 'banderin', 'brazos'), 0.95)
    fila_publico(e, -11.0, 11.0, 7.1, 0.75 - 0.5 + 0.4, colores[2:] + colores[:2], ('banderin', 'brazos', 'brazos', 'sombrero'), 0.95)
    # Las termas, las casas y las vacas volcánicas
    e.pieza(paisaje.m_termas, (-11, 11.5, -0.5), 0.2)
    for k in range(4):
        e.pieza(lambda coll, k=k: clay.blob(f'vapor {k}', (0, 0, 0.6), (0.7, 0.7, 0.5), coll, mat('vapor termas', '#FFFFFF', 0.9), n=3, subsurf=0),
                (-11 + (k - 1.5) * 1.3, 11.4 + (k % 2) * 0.5, -0.2), vivo='vivo_vapor')
    for x, y, r in ((-18, 17, 0.3), (3, 18, -0.1), (13, 16.5, -0.3), (24, 19, -0.4), (-28, 19, 0.4)):
        e.pieza(astra.m_casa_brasa, (x, y, -0.5), r)
    for x, y, r in ((8, 11.5, 2.6), (11, 12.5, 3.4), (-17, 3.0, 0.4)):
        e.pieza(pueblo.m_vaca, (x, y, -0.5), r)
    for s in (-1, 1):
        e.pieza(con(faroles, -5, 5, 0), (s * 10.5, 9.5, 3.6))
        for x in (s * 5.5, s * 15.5):
            e.pieza(lambda coll: cilindro(coll, 'poste faroles', (0, 0, 0), 0.12, 4.0, madera('poste faroles', '#4A2E22'), seg=8), (x, 9.5, -0.5))
    e.pieza(letrero_torneo, (0, 10.0, -1.6), 0, 1.15)
    for x, y, r in ((-6, 11, 0.4), (6.5, 11.5, 1.3), (-24, 9, 2.2), (20, 8, 0.8), (-13, 19, 1.0), (15, 20, 2.0)):
        e.pieza(paisaje.m_roca_volcanica, (x, y, -0.5), r, 1.6)
    # El volcán y los cerros de ceniza
    e.pieza(lambda coll: en(coll, montana(coll, (0, 70, -2), 24, 26, '#4A3434', lava=True)))
    e.pieza(lambda coll: en(coll, montana(coll, (-45, 60, -2), 14, 20, '#5A4040')))
    e.pieza(lambda coll: en(coll, montana(coll, (45, 62, -2), 16, 22, '#523A3A')))
    for k in range(3):
        e.pieza(lambda coll, k=k: clay.blob(f'humo volcán {k}', (0, 0, 0), (4, 4, 3), coll, mat('humo volcán', '#6A5A5A', 0.95), n=3, subsurf=0), (k * 2 - 2, 70, 24 + k * 4), vivo='vivo_vapor')
    e.terminar()
    return e


def pista_hielo(coll, ancho=19.0, fondo=4.0):
    """El lago helado donde se pelea: hielo liso con rayitas, borde de nieve y bloques de hielo."""
    hielo = mat('hielo pista', '#CFEAF7', 0.12, coat=0.8)
    caja(coll, 'hielo', (0, 0, -0.08), (ancho / 2, fondo / 2, 0.08), hielo, p=10, sub=0)
    for k in range(14):
        x, y = (RNG.random() - 0.5) * ancho * 0.9, (RNG.random() - 0.5) * fondo * 0.8
        caja(coll, f'raya hielo {k}', (x, y, 0.003), (0.4 + RNG.random() * 0.6, 0.01, 0.002), mat('raya hielo', '#FFFFFF', 0.3), p=10, sub=0).rotation_euler = (0, 0, RNG.random() * 3)
    for k, x in enumerate(np.arange(-ancho / 2 - 0.4, ancho / 2 + 0.5, 0.9)):
        bola(coll, f'nieve borde atrás {k}', (x, fondo / 2 + 0.3, 0.05), (0.62, 0.5, 0.28), NIEVE(), n=3, sub=0)
        bola(coll, f'nieve borde frente {k}', (x, -fondo / 2 - 0.35, -0.2), (0.6, 0.45, 0.22), NIEVE(), n=3, sub=0)
    caja(coll, 'cuerpo pista', (0, 0, -0.4), (ancho / 2, fondo / 2, 0.3), mat('hielo hondo', '#9CCBE8', 0.2, coat=0.5), p=10, sub=0)


def oveja_cristal(coll):
    """Una oveja de cristal de Nieveclara (lana de cristal azulado, carita oscura)."""
    lana = mat('lana cristal', '#D8F0FF', 0.15, coat=0.9)
    for k in range(9):
        a = k / 9 * math.tau
        bola(coll, f'lana {k}', (math.cos(a) * 0.32, math.sin(a) * 0.2, 0.62 + math.sin(a * 2) * 0.05), 0.24, lana, n=3, sub=0)
    bola(coll, 'cuerpo oveja', (0, 0, 0.62), (0.42, 0.3, 0.3), lana, n=4, sub=0)
    cara = tela('cara oveja', '#4A4652')
    bola(coll, 'cabeza oveja', (0, -0.42, 0.78), (0.17, 0.16, 0.2), cara, n=3, sub=0)
    for s in (-1, 1):
        bola(coll, f'ojo oveja {s}', (s * 0.07, -0.56, 0.84), 0.035, laca('ojo oveja', '#FFFFFF'), n=2, sub=0)
        bola(coll, f'oreja oveja {s}', (s * 0.2, -0.4, 0.86), (0.1, 0.04, 0.05), cara, n=2, sub=0)
        for t in (-1, 1):
            tubo(coll, f'pata oveja {s} {t}', [(s * 0.22, t * 0.15, 0.4), (s * 0.22, t * 0.15, 0.03)], 0.06, cara, seg=5)


def nieveclara():
    e = Escena('nieveclara')
    e.pieza(lambda coll: suelo(coll, '#EEF4F8', -0.45))
    e.pieza(pista_hielo)
    def montoncitos(coll):
        for k in range(70):
            x, y = (RNG.random() - 0.5) * 50, -6 + RNG.random() * 9
            if abs(y) < 2.6 and abs(x) < 10:
                continue
            bola(coll, f'montón nieve {k}', (x, y, -0.45), (0.6 + RNG.random() * 0.8, 0.5 + RNG.random() * 0.5, 0.25 + RNG.random() * 0.25), NIEVE(), n=3, sub=0)
    e.pieza(montoncitos)
    for s in (-1, 1):
        e.pieza(fogata, (s * 11.4, -0.8, -0.45))
        e.pieza(con(llama, 1.0), (s * 11.4, -0.8, -0.45), vivo='vivo_llama')
        e.pieza(fest.m_extra_invierno, (s * 13.5, 1.5, -0.45), -s * 0.4)
        e.pieza(paisaje.m_pino_nevado, (s * 10.5, 2.0, -0.45), s, 1.1)
    # Gradas de troncos con el público abrigado
    e.pieza(con(gradas, 26, 2, '#8A6A4A'), (0, 6.0, -0.45))
    colores = ('#3B6FB6', '#E4574B', '#F2F4F8', '#7FB0D9', '#E8C66A', '#A3443A')
    fila_publico(e, -12.2, 12.2, 6.0, 0.05, colores, ('bufanda', 'brazos', 'bufanda', 'banderin'), 0.95)
    fila_publico(e, -11.8, 11.8, 6.9, 0.55, colores[3:] + colores[:3], ('brazos', 'bufanda', 'banderin', 'bufanda'), 0.95)
    e.pieza(letrero_torneo, (0, 10.0, -1.6), 0, 1.15)
    for s in (-1, 1):
        e.pieza(fest.m_poste_invierno, (s * 8.6, 9.6, -0.45))
        for k in range(3):
            e.pieza(fest.m_tira_invierno, (s * (8.6 + k * 2.0) - (2.0 if s < 0 else 0), 9.6, 2.5))
    e.pieza(paisaje.m_estanque_helado, (15, 13, -0.45), 0.3)
    for x, y, r in ((-16, 17, 0.2), (-4, 19, -0.1), (8, 19.5, 0.2), (20, 18.5, -0.4), (-28, 20, 0.4)):
        e.pieza(astra.m_casa_nieve, (x, y, -0.45), r)
    for x, y, r in ((-15, 3.0, 0.6), (-16.5, 4.5, 2.4), (6, 12.5, 3.8)):
        e.pieza(oveja_cristal, (x, y, -0.45), r, 1.1)
    for k in range(18):
        x = -34 + k * 4 + RNG.random() * 2
        y = 24 + RNG.random() * 10
        e.pieza(paisaje.m_pino_nevado, (x, y, -0.45), RNG.random() * 6, 1.4 + RNG.random() * 0.8)
    for x, y in ((-14, 7.5), (16, 7.0), (-24, 10), (26, 9)):
        e.pieza(paisaje.m_roca_nevada, (x, y, -0.45), RNG.random() * 6, 1.3)
    e.pieza(lambda coll: en(coll, montana(coll, (-30, 70, -2), 22, 26, '#6F86A8', nieve=True)))
    e.pieza(lambda coll: en(coll, montana(coll, (8, 80, -2), 30, 30, '#5F7898', nieve=True)))
    e.pieza(lambda coll: en(coll, montana(coll, (45, 72, -2), 20, 24, '#7A90B0', nieve=True)))
    e.terminar()
    return e


ESCENARIOS = {'plaza': plaza, 'brasaviva': brasaviva, 'nieveclara': nieveclara}


def main(out, claves=None):
    import exportar_glb
    os.makedirs(out, exist_ok=True)
    for clave in claves or ESCENARIOS:
        clay.reset_scene()
        e = ESCENARIOS[clave]()
        objs = exportar_arbol(e.raiz)
        print('escenario', clave, len(objs), 'objetos', flush=True)
        exportar_glb.exportar(objs, os.path.join(out, f'{clave}.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
