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
    # (la cuchilla de la guillotina de frente llenaba todo el ícono)
    'guillotina': ('XYZ', (-15, 0, 205)),
}


# Sangre y Ceniza 2: las comunes nuevas, las evoluciones que faltaban (el arma de base con halo) y las uniones (las dos
# armas cruzadas: se arman con sus íconos, sin volver a renderizar)
ICONOS.update({
    'aceite_hirviendo': ('armas', 'cazo_aceite', '#ff8a2a'), 'frasco_escarcha': ('armas', 'frasco_escarcha', '#9fe8ff'),
    'humo_azufre': ('armas', 'bolsa_azufre', '#d8d04a'), 'bomba_racimo': ('armas', 'racimo', '#ff9a3a'), 'abrojos': ('armas', 'bolsa_abrojos', '#a8a0a0'),
    'cepos': ('armas', 'cepo', '#8a8c92'), 'ballesta_pie': ('armas', 'ballesta_pesada', '#d8d0c0'), 'cuervos_cazadores': ('armas', 'guante_cetreria', '#7a5bb8'),
    'murcielagos': ('armas', 'jaula', '#c8323a'), 'latigo_espinas': ('armas', 'latigo_espinas', '#7a8a4a'), 'rayo_sangre': ('armas', 'vara_sangre', '#ff3a4a'),
    'lanza_fuego': ('armas', 'sifon', '#ff7a2a'), 'perdigonera': ('armas', 'perdigonera', '#c8c0b0'),
})
EVOLUCIONES_NUEVAS = {
    'cetro_emperador': ('cetro_hierro', '#ffe08a'), 'estandarte_eterno': ('estandarte', '#ff7a4a'), 'lanza_coronacion': ('lanza_ceremonial', '#fff0b0'),
    'guadana_luna': ('hoz', '#c8d8ff'), 'hoguera_pueblo': ('antorcha', '#ff8a2a'), 'honda_pastor': ('honda', '#e8e0c8'),
    'bola_condenado': ('bola_hierro', '#b0b4ba'), 'punos_motin': ('punos', '#ff6a6a'), 'pico_fuga': ('pico_robado', '#d8d0c0'),
    'mangual_asedio': ('mangual', '#c8ccd2'), 'lanza_campeon': ('lanza_justa', '#f0e2b8'), 'escudo_muralla': ('escudo_arrojadizo', '#e0d8c8'),
    'estacas_plata': ('estacas', '#e8eef5'), 'agua_rio_santo': ('agua_bendita', '#9fe0ff'), 'trabuco_mayor': ('trabuco', '#ffd38a'),
    'torreta_asedio': ('torreta_ballesta', '#ffb46a'), 'lluvia_yunques': ('yunque', '#b0b4ba'), 'fragua_viva': ('chispas', '#ffc04a'),
    'fuego_inextinguible': ('fuego_griego', '#ff6a1a'), 'corazon_invierno': ('frasco_helado', '#bfeaff'), 'miasma': ('gas_venenoso', '#9bd84a'),
    'farol_animas': ('linterna_almas', '#8fe3ff'), 'osario_vivo': ('huesos', '#f0e8d0'), 'campana_difuntos': ('campana_funebre', '#c8b8ff'),
    'evangelio_fuego': ('libro_oraciones', '#ffb04a'), 'cruz_peregrina': ('cruz_plata', '#f4f8ff'), 'juicio_celestial': ('rayo_sagrado', '#fff4a8'),
    'garfios_matadero': ('ganchos', '#c8504a'), 'la_viuda': ('guillotina', '#e8e8e8'), 'soga_ahorcado': ('soga', '#d8b888'),
    'muneca_condena': ('vudu', '#d07bff'), 'caldero_tres_brujas': ('caldero', '#8ae05a'), 'plumas_augurio': ('plumas_negras', '#9a7aff'),
    'cuchillos_fortuna': ('cuchillos_malabar', '#f0f4ff'), 'flauta_flautista': ('flauta', '#ffe08a'), 'tambor_ultima_batalla': ('tambor_guerra', '#f0c88a'),
    'arco_montero': ('arco_largo', '#f0e0b8'), 'hachas_lenador': ('hacha_arrojadiza', '#e8d8c0'), 'barreno_mayor': ('carga_minera', '#ffc070'),
    'sierras_molino': ('sierra', '#e0e4ea'), 'tormenta_dorada': ('ira_cielo', '#ffe07a'), 'rio_brea': ('aceite_hirviendo', '#ff7a1a'),
    'invierno_eterno': ('frasco_escarcha', '#d8f4ff'), 'aliento_averno': ('humo_azufre', '#ffd04a'), 'lluvia_polvora': ('bomba_racimo', '#ffb05a'),
    'campo_espinas': ('abrojos', '#c8c0b8'), 'mandibula_hierro': ('cepos', '#b8bcc4'), 'fortin': ('ballesta_pie', '#ffb46a'),
    'bandada_noche': ('cuervos_cazadores', '#9a7aff'), 'nube_vampiros': ('murcielagos', '#ff4a5a'), 'zarza_maldita': ('latigo_espinas', '#9aaa5a'),
    'rio_carmesi': ('rayo_sangre', '#ff2a3a'), 'aliento_dragon': ('lanza_fuego', '#ff9a2a'), 'canon_mano': ('perdigonera', '#e8d8b8'),
}
for _i, (_b, _c) in EVOLUCIONES_NUEVAS.items():
    ICONOS[_i] = (ICONOS[_b][0], ICONOS[_b][1], _c, True)
    if _b in GIRO:
        GIRO.setdefault(_i, GIRO[_b])
# uniones: id → (arma de adelante, arma de atrás, color)
UNIONES = {
    'cruz_bautismal': ('agua_bendita', 'cruz_plata', '#bfe8ff'), 'lanzaestacas': ('ballesta', 'estacas', '#e8c890'), 'campana_osario': ('campana_funebre', 'huesos', '#c8b8ff'),
    'parlamento_cuervos': ('baston_cuervos', 'plumas_negras', '#a87bff'), 'evangelio_tormenta': ('rayo_sagrado', 'libro_oraciones', '#fff4a8'), 'marcha_flautista': ('tambor_guerra', 'flauta', '#ffe08a'),
    'horca_garfios': ('ganchos', 'soga', '#c8504a'), 'molino_hachas': ('hacha_arrojadiza', 'sierra', '#e0d0c0'), 'santa_barbara': ('bomba', 'carga_minera', '#ffc06a'),
    'peste_negra': ('gas_venenoso', 'frasco_acido', '#9bd84a'), 'cadalso': ('guillotina', 'hacha_verdugo', '#ff4a4a'), 'fuego_escarcha': ('fuego_griego', 'frasco_helado', '#ff9a6a'),
    'campo_trampero': ('cepos', 'abrojos', '#c8c0b0'), 'noche_alada': ('cuervos_cazadores', 'murcielagos', '#c84aff'),
}
GIRO.update({'ballesta_pie': ('XYZ', (0, 0, -70)), 'fortin': ('XYZ', (0, 0, -70)), 'perdigonera': ('XYZ', (0, 0, -70)), 'canon_mano': ('XYZ', (0, 0, -70)),
             'lanza_fuego': ('XYZ', (0, 0, -70)), 'aliento_dragon': ('XYZ', (0, 0, -70)), 'trabuco_mayor': ('XYZ', (0, 0, -70))})


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


def icono_union(out, tmp, i, a, b, color):
    """Las dos armas cruzadas (la de atrás más chiquita e inclinada) con el halo dorado de las evoluciones."""
    from PIL import Image
    T = 512
    lienzo = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    atras = Image.open(os.path.join(out, f'{b}.webp')).convert('RGBA').resize((380, 380), Image.LANCZOS).rotate(-24, resample=Image.BICUBIC)
    adelante = Image.open(os.path.join(out, f'{a}.webp')).convert('RGBA').resize((400, 400), Image.LANCZOS).rotate(16, resample=Image.BICUBIC)
    lienzo.alpha_composite(atras, (T - 380 - 10, 8))
    lienzo.alpha_composite(adelante, (6, T - 400 - 6))
    png = os.path.join(tmp, f'{i}.png')
    lienzo.save(png)
    halo(png, color, True).save(os.path.join(out, f'{i}.webp'), 'WEBP', quality=90, method=6)


def main(out, ids=None, hoja=None):
    import sangre_exportar
    clay.reset_scene()
    scene = bpy.context.scene
    sc.preparar_render(scene, 256, 32, transparente=True)
    scene.view_settings.look = 'AgX - High Contrast'
    os.makedirs(out, exist_ok=True)
    ids = ids or [*ICONOS, *UNIONES]
    uniones = [i for i in ids if i in UNIONES]
    ids = [i for i in ids if i not in UNIONES]
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
    for i in uniones:
        a, b, color = UNIONES[i]
        icono_union(out, tmp, i, a, b, color)
        hechos.append(i)
        print('union', i, flush=True)
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
