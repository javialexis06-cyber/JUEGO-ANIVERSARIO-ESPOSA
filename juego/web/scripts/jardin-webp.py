"""Pasa las hojas de arte del Jardín (public/jardin/pvz/*.png) a WebP para que el juego pese mucho menos.

Las opacas (mapas, fondos, portada) van con pérdida suave (calidad 84). Las que tienen transparencia (plantas,
zombis, objetos) van con pérdida en el color (calidad 90) pero con el canal alfa SIN pérdida: el recorte de figuras
del atlas (atlas.ts) depende del alfa exacto. Uso: python3 scripts/jardin-webp.py [--borrar-png]
"""
import pathlib
import sys

from PIL import Image

DIR = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'jardin' / 'pvz'
total_antes = total_despues = 0
for png in sorted(DIR.glob('*.png')):
    img = Image.open(png)
    img.load()
    con_alfa = img.mode in ('RGBA', 'LA') or 'transparency' in img.info
    if con_alfa:
        img = img.convert('RGBA')
        opaca = img.getchannel('A').getextrema()[0] == 255
    else:
        opaca = True
    destino = png.with_suffix('.webp')
    if opaca:
        img.convert('RGB').save(destino, 'WEBP', quality=84, method=6)
    else:
        img.save(destino, 'WEBP', quality=90, alpha_quality=100, method=6, exact=True)
    # El alfa tiene que quedar idéntico (el atlas recorta las figuras con él)
    if not opaca:
        nuevo = Image.open(destino).convert('RGBA').getchannel('A')
        if nuevo.tobytes() != img.getchannel("A").tobytes():
            sys.exit(f'El alfa cambió en {destino.name}')
    antes, despues = png.stat().st_size, destino.stat().st_size
    total_antes += antes
    total_despues += despues
    print(f'{png.name}: {antes / 1e6:.2f} MB → {despues / 1e6:.2f} MB {"(opaca)" if opaca else "(alfa exacto)"}')
    if '--borrar-png' in sys.argv:
        png.unlink()
print(f'Total: {total_antes / 1e6:.1f} MB → {total_despues / 1e6:.1f} MB')
