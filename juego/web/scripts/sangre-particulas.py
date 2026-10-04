"""Partículas de Sangre y Ceniza: texturas suaves con alfa (WebP) para el juego.

Uso: python3 scripts/sangre-particulas.py [carpeta]   (por defecto public/sangre/particulas)

Sueltas (sprite de un cuadro):
  brasa, chispa (alargada, se orienta con la velocidad), humo, polvo, alma, alma_estela, sangre (neblina),
  sangre_mancha (salpicadura en el piso), niebla, luz (halo suave), destello (golpe), rayo (rayo sagrado),
  llama, ceniza, onda (onda de choque).
Atlas para animar (cuadros de izquierda a derecha y de arriba abajo):
  humo_atlas 4×4 (la bocanada nace, crece y se deshace), llama_atlas 4×4 (llama que titila, en bucle),
  polvo_atlas 2×2 (cuatro variantes de polvo de roca), sangre_atlas 2×2 (cuatro salpicaduras).

Las aditivas (brasa, chispa, alma, luz, destello, rayo, llama, onda) traen el color ya puesto y se ven bien con
mezcla aditiva; humo y niebla son casi blancos para teñirlos en el juego; polvo, ceniza y sangre traen su color.
"""
import math
import os
import sys

import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, '..', 'public', 'sangre', 'particulas')
os.makedirs(SALIDA, exist_ok=True)
RNG = np.random.default_rng(7)


def ruido(n, escala, semilla, m=None):
    """Ruido suave (m filas × n columnas) por interpolación bicúbica de una rejilla aleatoria de paso 'escala' px."""
    m = m or n
    rng = np.random.default_rng(semilla)
    gw, gh = int(n / escala) + 3, int(m / escala) + 3
    g = rng.random((gh, gw)).astype(np.float32)
    im = Image.fromarray(g, mode='F').resize((int(math.ceil(gw * escala)), int(math.ceil(gh * escala))), Image.BICUBIC)
    a = np.asarray(im, np.float32)
    o = int(escala)
    return np.clip(a[o:o + m, o:o + n], 0, 1)


def fbm(n, escala, semilla, octavas=4, m=None):
    tot = np.zeros((m or n, n), np.float32)
    amp, norm = 1.0, 0.0
    for k in range(octavas):
        tot += amp * ruido(n, max(escala / 2 ** k, 1.5), semilla + 31 * k, m)
        norm += amp
        amp *= 0.5
    return tot / norm


def rejilla(n, m=None):
    m = m or n
    y, x = np.mgrid[0:m, 0:n].astype(np.float32)
    return (x + 0.5) / n * 2 - 1, (y + 0.5) / m * 2 - 1


def suave(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def guardar(nombre, rgb, a, calidad=90):
    rgb = np.clip(rgb, 0, 1)
    a = np.clip(a, 0, 1)
    img = np.dstack([rgb * 255, a[..., None] * 255]).astype(np.uint8)
    ruta = os.path.join(SALIDA, f'{nombre}.webp')
    Image.fromarray(img, 'RGBA').save(ruta, 'WEBP', quality=calidad, method=6)
    print(f'{nombre:16s} {img.shape[1]}×{img.shape[0]}  {os.path.getsize(ruta) / 1024:.1f} KB')


def color(hexa):
    h = hexa.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


def degradado(t, paradas):
    """t (0..1) -> color con paradas [(pos, '#hex'), ...]."""
    out = np.zeros(t.shape + (3,), np.float32)
    pos = [p for p, _ in paradas]
    cols = [color(c) for _, c in paradas]
    for i in range(3):
        out[..., i] = np.interp(t, pos, [c[i] for c in cols])
    return out


# --------------------------------------------------------------------------
# Sueltas
# --------------------------------------------------------------------------

def brasa(n=64):
    x, y = rejilla(n)
    r = np.hypot(x, y * 1.1) + 0.12 * (fbm(n, 12, 1) - 0.5)
    nucleo = suave(0.45, 0.0, r)
    halo = suave(1.0, 0.1, r) ** 2.2
    a = np.maximum(nucleo, halo * 0.75)
    rgb = degradado(np.clip(nucleo * 1.2, 0, 1), [(0, '#A01808'), (0.4, '#FF4A10'), (0.75, '#FFB040'), (1, '#FFF4D0')])
    guardar('brasa', rgb, a)


def chispa(w=32, h=128):
    x, y = rejilla(w, h)
    ancho = 0.18 + 0.25 * (1 - np.abs(y))
    linea = suave(1.0, 0.0, np.abs(x) / ancho) * suave(1.0, 0.55, np.abs(y)) * (0.4 + 0.6 * suave(1.0, -0.6, y))
    nucleo = suave(0.35, 0.0, np.abs(x) / ancho) * suave(0.9, 0.2, np.abs(y))
    a = np.clip(linea + nucleo, 0, 1)
    rgb = degradado(np.clip(nucleo, 0, 1), [(0, '#FF6A10'), (0.6, '#FFC050'), (1, '#FFFBE8')])
    guardar('chispa', rgb, a)


def bocanada(n, semilla, densidad=1.0, abierto=0.0, grumos=0.55):
    """Bocanada de humo: ruido fractal dentro de un círculo que se deshace hacia el borde."""
    x, y = rejilla(n)
    r = np.hypot(x, y)
    nz = fbm(n, n / 4, semilla, 5)
    borde = suave(1.0, 0.25 + 0.4 * abierto, r + (nz - 0.5) * 0.6)
    a = borde * np.clip((nz - 0.25 * abierto) * 1.6, 0, 1) ** (1 + abierto) * densidad
    a = a * (1 - grumos + grumos * fbm(n, n / 10, semilla + 5, 3) * 1.3)
    return np.clip(a, 0, 1), nz


def humo(n=128):
    a, nz = bocanada(n, 11)
    rgb = np.dstack([0.78 + 0.18 * nz] * 3)
    guardar('humo', rgb, a * 0.85)


def polvo_uno(n, semilla):
    a, nz = bocanada(n, semilla, 0.9, 0.15, 0.7)
    x, y = rejilla(n)
    granos = (RNG.random((n, n)) > 0.985) * suave(0.9, 0.2, np.hypot(x, y))
    a = np.clip(a + granos * 0.9, 0, 1)
    rgb = degradado(nz, [(0, '#5A4636'), (0.5, '#8A7562'), (1, '#B8A48E')])
    return rgb, a


def polvo(n=128):
    rgb, a = polvo_uno(n, 21)
    guardar('polvo', rgb, a * 0.9)


def alma(n=128):
    x, y = rejilla(n)
    # orbe arriba y estela hacia abajo (el juego la orienta con el movimiento)
    cy = -0.35
    r = np.hypot(x, (y - cy) * 1.05)
    nucleo = suave(0.32, 0.0, r)
    halo = suave(0.85, 0.05, r) ** 2
    cola_w = 0.28 * (1 - suave(cy, 1.0, y)) + 0.02
    ondula = 0.08 * np.sin(y * 9 + 1.5) * suave(cy, 1.0, y)
    cola = suave(1.0, 0.0, np.abs(x - ondula) / np.maximum(cola_w, 1e-3)) * suave(1.0, cy, y) * (y > cy - 0.1)
    cola *= 0.55 + 0.45 * fbm(n, 10, 31, 3)
    a = np.clip(np.maximum(np.maximum(nucleo, halo * 0.8), cola * 0.7), 0, 1)
    rgb = degradado(np.clip(nucleo + 0.3 * halo, 0, 1), [(0, '#1A5AFF'), (0.45, '#5AB8FF'), (0.8, '#C8F0FF'), (1, '#FFFFFF')])
    guardar('alma', rgb, a)


def alma_estela(w=64, h=256):
    x, y = rejilla(w, h)
    ancho = 0.25 + 0.55 * (1 - (y + 1) / 2)
    ondula = 0.15 * np.sin(y * 7) * (y + 1) / 2
    a = suave(1.0, 0.0, np.abs(x - ondula) / ancho) * suave(1.0, -1.0, y) ** 1.5
    a *= 0.5 + 0.5 * fbm(w, 8, 41, 3, h)
    rgb = degradado(np.clip(a * 1.3, 0, 1), [(0, '#103AC8'), (0.5, '#4AA8FF'), (1, '#DDF6FF')])
    guardar('alma_estela', rgb, a)


def sangre(n=128):
    """Neblina de sangre: nube roja oscura con gotitas."""
    a, nz = bocanada(n, 51, 0.95, 0.1, 0.6)
    x, y = rejilla(n)
    gotas = np.zeros((n, n), np.float32)
    for _ in range(14):
        cx, cy = RNG.uniform(-0.8, 0.8, 2)
        rr = RNG.uniform(0.02, 0.07)
        gotas = np.maximum(gotas, suave(rr, rr * 0.4, np.hypot(x - cx, y - cy)))
    a = np.clip(a * 0.8 + gotas, 0, 1)
    rgb = degradado(np.clip(nz + gotas * 0.4, 0, 1), [(0, '#2A0204'), (0.5, '#6A0A10'), (1, '#A01820')])
    guardar('sangre', rgb, a)


def salpicadura(n, semilla):
    rng = np.random.default_rng(semilla)
    x, y = rejilla(n)
    ang = np.arctan2(y, x)
    r = np.hypot(x, y)
    rad = 0.42 + 0.12 * np.sin(ang * rng.integers(5, 9) + rng.uniform(0, 6)) + 0.08 * (fbm(n, n / 6, semilla) - 0.5)
    for k in range(rng.integers(4, 8)):
        b = rng.uniform(-np.pi, np.pi)
        rad = rad + 0.3 * np.exp(-((np.angle(np.exp(1j * (ang - b)))) / 0.08) ** 2)
    a = suave(rad + 0.02, rad - 0.03, r)
    for _ in range(18):
        cx, cy = rng.uniform(-0.9, 0.9, 2)
        rr = rng.uniform(0.015, 0.05)
        a = np.maximum(a, suave(rr, rr * 0.5, np.hypot(x - cx, y - cy)))
    brillo = fbm(n, n / 8, semilla + 1, 3)
    rgb = degradado(brillo, [(0, '#2A0204'), (0.6, '#5A060C'), (1, '#8A1018')])
    return rgb, a


def sangre_mancha(n=128):
    rgb, a = salpicadura(n, 61)
    guardar('sangre_mancha', rgb, a * 0.95)


def niebla(n=256):
    x, y = rejilla(n)
    nz = fbm(n, n / 3, 71, 5)
    borde = suave(1.0, 0.2, np.hypot(x, y * 1.6) + (nz - 0.5) * 0.5)
    a = borde * np.clip(nz * 1.4 - 0.1, 0, 1) * 0.6
    rgb = np.dstack([0.85 + 0.1 * nz] * 3)
    guardar('niebla', rgb, a)


def luz(n=128):
    x, y = rejilla(n)
    r = np.hypot(x, y)
    a = suave(1.0, 0.0, r) ** 2.4
    rgb = degradado(suave(0.7, 0.0, r), [(0, '#FFB060'), (0.7, '#FFE0B0'), (1, '#FFFFFF')])
    guardar('luz', rgb, a)


def destello(n=128):
    x, y = rejilla(n)
    r = np.hypot(x, y)
    ang = np.arctan2(y, x)
    rayos = np.clip(np.cos(ang * 4) ** 24 + 0.6 * np.cos(ang * 4 + np.pi / 4) ** 40, 0, 1)
    estrella = rayos * suave(1.0, 0.0, r) ** 1.3
    nucleo = suave(0.35, 0.0, r)
    halo = suave(0.8, 0.0, r) ** 3
    a = np.clip(estrella + nucleo + halo * 0.6, 0, 1)
    rgb = degradado(np.clip(nucleo + estrella * 0.5, 0, 1), [(0, '#FFB040'), (0.5, '#FFE8A0'), (1, '#FFFFFF')])
    guardar('destello', rgb, a)


def rayo(w=64, h=256):
    """Rayo sagrado: columna de luz que baja del cielo (arriba fuerte, abajo se abre y se apaga)."""
    x, y = rejilla(w, h)
    ancho = 0.35 + 0.35 * (y + 1) / 2
    col = suave(1.0, 0.0, np.abs(x) / ancho) ** 1.5
    vetas = 0.6 + 0.4 * np.clip(np.sin(x * 23 + 2) * np.sin(x * 11 - 1) + 0.6, 0, 1)
    a = col * vetas * (0.55 + 0.45 * suave(1.0, -0.6, y)) * suave(-1.0, -0.85, y)
    nucleo = suave(0.25, 0.0, np.abs(x) / ancho)
    rgb = degradado(np.clip(nucleo, 0, 1), [(0, '#FFC860'), (0.6, '#FFF0C0'), (1, '#FFFFFF')])
    guardar('rayo', rgb, np.clip(a, 0, 1))


def llama_cuadro(w, h, t, semilla=0):
    """Una llama (base abajo) para el cuadro t (0..1, en bucle)."""
    x, y = rejilla(w, h)
    v = (1 - y) / 2 / 0.86  # 0 abajo, 1 en la punta (la punta queda dentro del cuadro)
    fase = 2 * np.pi * t
    ondula = 0.12 * np.sin(v * 6 - fase * 2 + semilla) * v + 0.05 * np.sin(v * 13 + fase * 3) * v
    ancho = 0.55 * (1 - v) ** 0.6 * (0.9 + 0.1 * np.sin(fase + v * 4)) + 0.02
    nz = ruido(w, 6, 81 + int(t * 16) + semilla, h)
    forma = suave(1.0, 0.55, np.abs(x - ondula) / ancho + (nz - 0.5) * 0.5 * v) * suave(0.0, 0.08, v)
    forma *= suave(1.0, 0.75 + 0.1 * np.sin(fase), v)
    nucleo = suave(1.0, 0.25, np.abs(x - ondula) / (ancho * 0.6)) * suave(0.7, 0.1, v) * suave(0.0, 0.1, v)
    rgb = degradado(np.clip(nucleo * 0.8 + forma * 0.4, 0, 1), [(0, '#C82808'), (0.35, '#FF6A10'), (0.7, '#FFB840'), (1, '#FFF4C8')])
    return rgb, np.clip(forma, 0, 1)


def llama(w=64, h=128):
    rgb, a = llama_cuadro(w, h, 0.0)
    guardar('llama', rgb, a)


def ceniza(n=32):
    x, y = rejilla(n)
    ang = np.arctan2(y, x)
    nz = fbm(n, 6, 91, 2)
    rad = 0.5 + 0.12 * np.sin(ang * 5 + 1) + 0.08 * np.sin(ang * 2 + 2) + 0.25 * (nz - 0.5)
    a = suave(rad, rad - 0.15, np.hypot(x * 1.3, y))
    rgb = degradado(nz, [(0, '#3A3634'), (0.5, '#7A7470'), (1, '#B0A8A0')])
    borde = suave(rad - 0.25, rad - 0.05, np.hypot(x, y)) * (nz > 0.55)
    rgb = rgb * (1 - borde[..., None]) + borde[..., None] * color('#FF6A20')
    guardar('ceniza', rgb, a)


def onda(n=128):
    x, y = rejilla(n)
    r = np.hypot(x, y)
    anillo = np.exp(-((r - 0.8) / 0.08) ** 2) + 0.35 * np.exp(-((r - 0.6) / 0.15) ** 2)
    a = np.clip(anillo, 0, 1) * suave(1.0, 0.9, r)
    rgb = degradado(np.clip(anillo, 0, 1), [(0, '#FF8A40'), (1, '#FFF0D0')])
    guardar('onda', rgb, a)


# --------------------------------------------------------------------------
# Atlas
# --------------------------------------------------------------------------

def atlas(nombre, cuadros, cols, filas):
    h, w = cuadros[0][1].shape
    rgb = np.zeros((h * filas, w * cols, 3), np.float32)
    a = np.zeros((h * filas, w * cols), np.float32)
    for k, (c, al) in enumerate(cuadros):
        i, j = k % cols, k // cols
        rgb[j * h:(j + 1) * h, i * w:(i + 1) * w] = c
        a[j * h:(j + 1) * h, i * w:(i + 1) * w] = al
    guardar(nombre, rgb, a)


def humo_atlas(n=128):
    cuadros = []
    for k in range(16):
        t = k / 15
        a, nz = bocanada(n, 101, densidad=1.0 - 0.75 * t, abierto=t, grumos=0.4 + 0.3 * t)
        # crece: se dibuja más chico al principio
        esc = 0.55 + 0.45 * math.sqrt(t)
        im = Image.fromarray((a * 255).astype(np.uint8)).resize((max(2, int(n * esc)),) * 2, Image.BICUBIC)
        lienzo = np.zeros((n, n), np.float32)
        o = (n - im.size[0]) // 2
        lienzo[o:o + im.size[1], o:o + im.size[0]] = np.asarray(im, np.float32) / 255
        rgb = np.dstack([0.8 + 0.15 * nz] * 3)
        cuadros.append((rgb, lienzo * 0.85))
    atlas('humo_atlas', cuadros, 4, 4)


def llama_atlas(w=64, h=128):
    atlas('llama_atlas', [llama_cuadro(w, h, k / 16) for k in range(16)], 4, 4)


def polvo_atlas(n=128):
    atlas('polvo_atlas', [(lambda r: (r[0], r[1] * 0.9))(polvo_uno(n, 200 + k * 7)) for k in range(4)], 2, 2)


def sangre_atlas(n=128):
    atlas('sangre_atlas', [salpicadura(n, 300 + k * 11) for k in range(4)], 2, 2)


if __name__ == '__main__':
    for f in (brasa, chispa, humo, polvo, alma, alma_estela, sangre, sangre_mancha, niebla, luz, destello, rayo, llama, ceniza, onda,
              humo_atlas, llama_atlas, polvo_atlas, sangre_atlas):
        f()
    print('listo:', SALIDA)
