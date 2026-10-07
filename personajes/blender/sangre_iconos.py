"""Íconos de Sangre y Ceniza (public/sangre/iconos/<id>.webp, 128 px, fondo transparente): renders de los modelos con
luz dramática, en diagonal si el arma es larga, con un halo suave del color del arma (dorado en las evoluciones).

Los ids son los de las armas del juego (datos/armas.ts): cada uno dice de qué modelo sale su ícono.

Uso: blender -b -P sangre_iconos.py -- <carpeta_salida> [ids separados por coma] [--hoja <png>]
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import clay  # noqa: E402
import sangre_comun as sc  # noqa: E402

# id del ícono: (grupo, figura, color del halo, ¿evolución?)
ICONOS = {
    'espada_larga': ('armas', 'espada_larga', '#e9e2cf'), 'cetro_hierro': ('armas', 'cetro', '#d8b45a'), 'estandarte': ('armas', 'estandarte', '#c8323a'),
    'lanza_ceremonial': ('armas', 'lanza', '#e9e2cf'), 'horca': ('armas', 'horca', '#d9c9a0'), 'hoz': ('armas', 'hoz', '#e8e0c8'),
    'antorcha': ('armas', 'antorcha', '#ff8a2a'), 'honda': ('armas', 'honda', '#b9b0a0'), 'grillete': ('armas', 'grillete', '#9aa0a6'),
    'bola_hierro': ('armas', 'bola_hierro', '#7b7f86'), 'punos': ('armas', 'punos', '#d0c0b0'), 'pico_robado': ('armas', 'pico', '#b0a89a'),
    'maza': ('armas', 'maza', '#c9c3b5'), 'mangual': ('armas', 'mangual', '#8a8f96'), 'lanza_justa': ('armas', 'lanza_justa', '#e2d6b8'),
    'escudo_arrojadizo': ('armas', 'escudo', '#c9c3b5'), 'ballesta': ('armas', 'ballesta', '#d8d0c0'), 'estacas': ('armas', 'estaca', '#c8a878'),
    'agua_bendita': ('armas', 'agua_bendita', '#9fd8ff'), 'trabuco': ('armas', 'trabuco', '#ffd38a'), 'martillo': ('armas', 'martillo', '#ffb46a'),
    'torreta_ballesta': ('cosas', 'torreta_ballesta', '#d8d0c0'), 'yunque': ('proyectiles', 'yunque', '#9aa0a6'),
    'chispas': ('proyectiles', 'bola_fuego', '#ffb02a'), 'frasco_acido': ('armas', 'frasco', '#9be15d'),
    'fuego_griego': ('proyectiles', 'frasco_fuego', '#ff7a2a'), 'frasco_helado': ('proyectiles', 'frasco_hielo', '#9fe8ff'),
    'gas_venenoso': ('proyectiles', 'frasco_roto', '#86c94a'), 'pala': ('armas', 'pala', '#b8b0a0'), 'linterna_almas': ('armas', 'linterna', '#8fe3ff'),
    'huesos': ('proyectiles', 'hueso', '#e8e0c8'), 'campana_funebre': ('armas', 'campana_mano', '#c8b8ff'),
    'incensario': ('armas', 'incensario', '#ffe7a0'), 'libro_oraciones': ('armas', 'grimorio', '#fff0c0'), 'cruz_plata': ('armas', 'cruz', '#e8eef5'),
    'rayo_sagrado': ('proyectiles', 'rayo_sagrado', '#fff4a8'), 'hacha_verdugo': ('armas', 'hacha_verdugo', '#d9d2c2'),
    'ganchos': ('armas', 'gancho', '#a8a0a0'), 'guillotina': ('proyectiles', 'guillotina', '#e0e0e0'), 'soga': ('armas', 'soga', '#c8b088'),
    'baston_cuervos': ('armas', 'baston_cuervos', '#9b7bd8'), 'vudu': ('armas', 'vudu', '#c06bd8'), 'caldero': ('cosas', 'frasco_alquimia', '#7ad04a'),
    'plumas_negras': ('proyectiles', 'pluma_cuervo', '#7a5bb8'), 'laud': ('armas', 'laud', '#ffd9a0'),
    'cuchillos_malabar': ('armas', 'cuchillo_carnicero', '#e0e6ee'), 'flauta': ('armas', 'flauta', '#ffe08a'), 'tambor_guerra': ('armas', 'tambor', '#e8c08a'),
    'daga': ('armas', 'daga', '#e0e6ee'), 'arco_largo': ('armas', 'arco', '#d8c8a8'), 'hacha_arrojadiza': ('armas', 'hacha', '#d0c8b8'),
    'bomba': ('armas', 'bomba', '#ffb05a'), 'carga_minera': ('armas', 'carga_minera', '#ff8a3a'), 'sierra': ('armas', 'sierra', '#c8ccd2'), 'ira_cielo': ('proyectiles', 'rayo_sagrado', '#bfe4ff'),
    # evoluciones: el arma de base con halo dorado
    'hoja_rey_caido': ('armas', 'espada_larga', '#ffd76a', True), 'horca_cosecha': ('armas', 'horca', '#ffd76a', True),
    'cadenas_libertad': ('armas', 'grillete', '#ff6a6a', True), 'maza_juicio': ('armas', 'maza', '#ffe9a0', True),
    'ballesta_cazanoche': ('armas', 'ballesta', '#fff4c0', True), 'martillo_titan': ('armas', 'martillo', '#ff9a3a', True),
    'gran_obra': ('armas', 'frasco', '#d8ff6a', True), 'pala_ultimo_descanso': ('armas', 'pala', '#a8f0ff', True),
    'incensario_juicio': ('armas', 'incensario', '#ffe080', True), 'hacha_ultimo_juicio': ('armas', 'hacha_verdugo', '#ff4a4a', True),
    'baston_noche_eterna': ('armas', 'baston_cuervos', '#b88bff', True), 'laud_requiem': ('armas', 'laud', '#ffd080', True),
    'mil_dagas': ('armas', 'daga', '#f0f4ff', True), 'polvorin': ('armas', 'bomba', '#ffb05a', True),
}


# giros a mano para los que quedan de canto (modo de Euler, grados x, y, z)
GIRO = {
    'hoz': ('XYZ', (0, 0, 65)), 'pico_robado': ('ZYX', (0, -45, 90)), 'ballesta': ('XYZ', (0, 0, -70)), 'ballesta_cazanoche': ('XYZ', (0, 0, -70)),
    'trabuco': ('XYZ', (0, 0, -70)), 'sierra': ('XYZ', (70, 0, 0)), 'torreta_ballesta': ('XYZ', (0, 0, -50)),
}


def registro(grupo):
    import sangre_exportar
    return sangre_exportar.registro(grupo)


def halo(png, color, evolucion, res=128):
    from PIL import Image, ImageDraw, ImageFilter
    im = Image.open(png).convert('RGBA')
    W = im.size[0]
    h = color.lstrip('#')
    rgb = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    capa = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    r = W * (0.4 if evolucion else 0.33)
    d.ellipse((W / 2 - r, W / 2 - r, W / 2 + r, W / 2 + r), fill=rgb + (150 if evolucion else 80,))
    capa = capa.filter(ImageFilter.GaussianBlur(W * 0.11))
    if evolucion:
        # destellos dorados alrededor
        d2 = ImageDraw.Draw(capa)
        rng = np.random.default_rng(len(png))
        for _ in range(7):
            a = rng.uniform(0, 2 * math.pi)
            rr = rng.uniform(0.3, 0.44) * W
            x, y = W / 2 + math.cos(a) * rr, W / 2 + math.sin(a) * rr
            s = rng.uniform(0.012, 0.025) * W
            d2.polygon([(x, y - s * 2.2), (x + s * 0.5, y), (x, y + s * 2.2), (x - s * 0.5, y)], fill=(255, 236, 170, 230))
            d2.polygon([(x - s * 2.2, y), (x, y + s * 0.5), (x + s * 2.2, y), (x, y - s * 0.5)], fill=(255, 236, 170, 230))
    capa.alpha_composite(im)
    return capa.resize((res, res), Image.LANCZOS)


def main(out, ids=None, hoja=None):
    import sangre_exportar
    clay.reset_scene()
    scene = bpy.context.scene
    sc.preparar_render(scene, 256, 32, transparente=True)
    scene.view_settings.look = 'AgX - High Contrast'
    os.makedirs(out, exist_ok=True)
    ids = ids or list(ICONOS)
    necesarios = {}
    for i in ids:
        g, f = ICONOS[i][0], ICONOS[i][1]
        necesarios.setdefault(g, set()).add(f)
    figs = {}
    for g, fs in necesarios.items():
        reg = registro(g)
        for F in sangre_exportar.construir(reg, sorted(fs)):
            figs[(g, F.id)] = F
    raices = [F.root for F in figs.values()]
    luces = clay.collection('SG luces iconos')
    tmp = os.path.join(out, '_tmp')
    os.makedirs(tmp, exist_ok=True)
    hechos = []
    for i in ids:
        spec = ICONOS[i]
        g, f, color = spec[0], spec[1], spec[2]
        evo = len(spec) > 3 and spec[3]
        F = figs[(g, f)]
        sc.solo_visible([F.root], raices)
        F.root.rotation_euler = (0, 0, 0)
        lo, hi = sc.caja_mundo(F.root)
        ext = hi - lo
        largo = ext[2] > 1.8 * max(ext[0], ext[1])
        if i in GIRO:
            modo, ang = GIRO[i]
            F.root.rotation_mode = modo
            F.root.rotation_euler = tuple(math.radians(v) for v in ang)
        elif largo:
            F.root.rotation_euler = (0, math.radians(-45), math.radians(18))
        else:
            F.root.rotation_euler = (0, 0, math.radians(-25))
        lo, hi = sc.caja_mundo(F.root)
        for o in list(luces.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        c = (lo + hi) / 2
        esc = max(float(max(hi - lo)), 0.15)
        sc.luces_dramaticas(luces, centro=tuple(c), escala=esc, calida='#FFD8A8')
        cam = sc.camara_figura(f'cam icono {i}', lo, hi, 0 if largo else 15, 8 if largo else 22, margen=1.12)
        png = os.path.join(tmp, f'{i}.png')
        sc.render(scene, cam, png)
        bpy.data.objects.remove(cam, do_unlink=True)
        F.root.rotation_mode = 'XYZ'
        F.root.rotation_euler = (0, 0, 0)
        halo(png, color, evo).save(os.path.join(out, f'{i}.webp'), 'WEBP', quality=90, method=6)
        hechos.append(i)
        print('icono', i, flush=True)
    if hoja:
        from PIL import Image, ImageDraw
        n = len(hechos)
        cols = 10
        filas = (n + cols - 1) // cols
        im = Image.new('RGB', (cols * 128, filas * 142), (40, 36, 34))
        dr = ImageDraw.Draw(im)
        for k, i in enumerate(hechos):
            ic = Image.open(os.path.join(out, f'{i}.webp')).convert('RGBA')
            x, y = (k % cols) * 128, (k // cols) * 142
            im.paste(ic, (x, y + 14), ic)
            dr.text((x + 2, y + 1), i[:20], fill=(235, 200, 160))
        im.save(hoja)
        print('HOJA', hoja, flush=True)
    import shutil
    shutil.rmtree(tmp, ignore_errors=True)
    print('LISTO', len(hechos), flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    hoja = args[args.index('--hoja') + 1] if '--hoja' in args else None
    pos = [a for a in args if not a.startswith('--') and a != hoja]
    main(pos[0], pos[1].split(',') if len(pos) > 1 else None, hoja)
