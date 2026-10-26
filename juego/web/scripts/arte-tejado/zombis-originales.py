"""Hojas de zombis del tejado con el arte y las animaciones originales de PvZ 1.

Fuente: carpeta reanim/ del repositorio ruslan831/PlantsVsZombies-decompilation (piezas y .reanim). Cada
animación se muestrea en CUADROS cuadros con el mismo origen, de modo que la figura no tiembla al cambiar de
cuadro, y se coloca con su base centrada abajo en la celda. Escribe:
  public/jardin/pvz/zombis-tejado-anim.webp   (CUADROS columnas, una fila por animación)
  public/jardin/pvz/zombis-tejado.webp        (4×4: escalera, catapulta, poste, balón, robot, caravana,
                                               bolas de fuego y hielo; retratos de gargantúa, diablillo,
                                               zombi escalera, colgado y cabeza del jefe)
  src/jardin/pvz/arte/tejado-animacion.ts     (filas, escala y duración de cada animación)
Uso: python3 scripts/arte-tejado/zombis-originales.py CARPETA_REANIM
"""
import json
import pathlib
import sys

from PIL import Image

from reanim import dibujar_cuadro, leer, rango

REANIM = pathlib.Path(sys.argv[1])
WEB = pathlib.Path(__file__).resolve().parents[2]
CUADROS, CELDA = 6, 320
# nombre: (archivo, animación, piezas ocultas)
ANIMACIONES = {
    'gargantua-camina': ('Zombie_gargantuar', 'anim_walk', ()),
    'gargantua-golpe': ('Zombie_gargantuar', 'anim_smash', ()),
    'gargantua-sola-camina': ('Zombie_gargantuar', 'anim_walk', ('zombie_imp',)),
    'gargantua-sola-golpe': ('Zombie_gargantuar', 'anim_smash', ('zombie_imp',)),
    'diablillo-camina': ('Zombie_imp', 'anim_walk', ()),
    'diablillo-come': ('Zombie_imp', 'anim_eat', ()),
    'escalera-lleva': ('Zombie_ladder', 'anim_ladderwalk', ()),
    'escalera-lleva-come': ('Zombie_ladder', 'anim_laddereat', ()),
    'escalera-camina': ('Zombie_ladder', 'anim_walk', ()),
    'escalera-come': ('Zombie_ladder', 'anim_eat', ()),
    'colgado-baja': ('Zombie_bungi', 'anim_drop', ()),
    'colgado-espera': ('Zombie_bungi', 'anim_idle', ()),
    'colgado-agarra': ('Zombie_bungi', 'anim_grab', ()),
    'colgado-sube': ('Zombie_bungi', 'anim_raise', ()),
    'catapulta-avanza': ('Zombie_catapult', 'anim_walk', ()),
    'catapulta-lanza': ('Zombie_catapult', 'anim_shoot', ()),
    'jefe-piernas': ('Zombie_boss', 'anim_idle', ()),
    'jefe-cabeza': ('Zombie_boss', 'anim_head_idle', ()),
}


def animacion(archivo, anim, ocultar):
    ruta = REANIM / f'{archivo}.reanim'
    pistas = leer(ruta)
    a, b = rango(pistas, anim)
    total = b - a + 1
    cuadros = [dibujar_cuadro(ruta, pistas, a + round(k * total / CUADROS), ocultar=ocultar) for k in range(CUADROS)]
    caja = cuadros[0].getbbox()
    for c in cuadros[1:]:
        cb = c.getbbox()
        caja = (min(caja[0], cb[0]), min(caja[1], cb[1]), max(caja[2], cb[2]), max(caja[3], cb[3]))
    fps = float(next(iter(__import__('re').findall(r'<fps>(\d+)</fps>', ruta.read_text(errors='replace'))), 12))
    return [c.crop(caja) for c in cuadros], total / fps


hoja = Image.new('RGBA', (CUADROS * CELDA, len(ANIMACIONES) * CELDA), (0, 0, 0, 0))
manifiesto = {}
for fila, (nombre, (archivo, anim, ocultar)) in enumerate(ANIMACIONES.items()):
    cuadros, duracion = animacion(archivo, anim, ocultar)
    w, h = cuadros[0].size
    escala = min(1.0, (CELDA - 4) / max(w, h))
    for k, c in enumerate(cuadros):
        c = c.resize((max(1, round(w * escala)), max(1, round(h * escala))), Image.LANCZOS)
        hoja.alpha_composite(c, (k * CELDA + (CELDA - c.width) // 2, fila * CELDA + CELDA - c.height))
    manifiesto[nombre] = dict(fila=fila, escala=round(escala, 5), ancho=w, alto=h, duracion=round(duracion, 3))
    print(nombre, (w, h), 'escala', round(escala, 3), 'duración', round(duracion, 2))
hoja.save(WEB / 'public/jardin/pvz/zombis-tejado-anim.webp', 'WEBP', quality=90, alpha_quality=100, method=6, exact=True)

# Accesorios sueltos (misma celda 384×512 de la hoja anterior; el atlas recorta la figura principal).
def pieza(nombre):
    return Image.open(REANIM / f'{nombre}.png').convert('RGBA')


accesorios = [
    pieza('Zombie_ladder_1'),
    dibujar_cuadro(REANIM / 'Zombie_catapult.reanim', None, rango(leer(REANIM / 'Zombie_catapult.reanim'), 'anim_idle')[0]),
    pieza('Zombie_gargantuar_telephonepole'),
    pieza('Zombie_catapult_basketball'),
    dibujar_cuadro(REANIM / 'Zombie_boss.reanim', None, rango(leer(REANIM / 'Zombie_boss.reanim'), 'anim_idle')[0]),
    pieza('Zombie_boss_rv'),
    dibujar_cuadro(REANIM / 'Zombie_boss_fireball.reanim', None, rango(leer(REANIM / 'Zombie_boss_fireball.reanim'), 'anim_role')[0], ocultar=('_ground', 'layer')),
    dibujar_cuadro(REANIM / 'Zombie_boss_iceball.reanim', None, rango(leer(REANIM / 'Zombie_boss_iceball.reanim'), 'anim_role')[0], ocultar=('_ground', 'layer')),
]
def retrato(archivo, anim, ocultar=()):
    ruta = REANIM / f'{archivo}.reanim'
    return dibujar_cuadro(ruta, None, rango(leer(ruta), anim)[0], ocultar=ocultar)


accesorios += [retrato('Zombie_gargantuar', 'anim_idle'), retrato('Zombie_imp', 'anim_walk'),
               retrato('Zombie_ladder', 'anim_ladderwalk'), retrato('Zombie_bungi', 'anim_idle'),
               retrato('Zombie_boss', 'anim_head_idle')]
acc = Image.new('RGBA', (384 * 4, 512 * 4), (0, 0, 0, 0))
for i, img in enumerate(accesorios):
    img = img.crop(img.getbbox())
    e = min(1.0, 376 / img.width, 504 / img.height)
    img = img.resize((round(img.width * e), round(img.height * e)), Image.LANCZOS)
    acc.alpha_composite(img, ((i % 4) * 384 + (384 - img.width) // 2, (i // 4) * 512 + (512 - img.height) // 2))
acc.save(WEB / 'public/jardin/pvz/zombis-tejado.webp', 'WEBP', quality=90, alpha_quality=100, method=6, exact=True)

ts = WEB / 'src/jardin/pvz/arte/tejado-animacion.ts'
ts.write_text('// Generado por scripts/arte-tejado/zombis-originales.py: animaciones originales de PvZ 1 del tejado.\n'
              '// escala = píxeles de la hoja por píxel original; ancho/alto en píxeles originales; duración en s.\n'
              f'export const CELDA_TEJADO_ANIM={CELDA},CUADROS_TEJADO_ANIM={CUADROS};\n'
              f'export const ANIM_TEJADO_PVZ={json.dumps(manifiesto, ensure_ascii=False)} as const;\n'
              'export type AnimTejadoPvZ=keyof typeof ANIM_TEJADO_PVZ;\n')
print('escrito', ts)
