"""Sangre y Ceniza · lo que solo carga la calidad alta: un GLB por bioma (`bioma_<id>_alta.glb`) y las texturas de
los pisos.

- Pisos: las mismas losas de 2 × 2 m del bioma, pero el color del campo (`C.piso_campo`) se hornea en una textura de
  RES × RES (≈ 4 mm por texel) con su mapa de relieve, en vez de ir en los vértices (que con una rejilla de 6 cm se
  ven pixelados). En los vértices queda solo la oclusión y los bordes gastados, multiplicados por GRIS (el juego lo
  compensa con `textura_escala`). Lo demás de la losa (piedritas, pasto, charcos) sigue con su color en los vértices.
- Detalle (`det_*`, ver sangre_biomas_detalle.py): cositas que el juego riega por el piso, al pie de las paredes y
  colgadas en ellas.

Uso: python3.11 personajes/blender/sangre_biomas_alta.py <carpeta_glb> <carpeta_texturas> [biomas] [--sin-pisos]
     (o con blender -b -P … -- …). Salida: <carpeta_glb>/bioma_<id>_alta.glb (+ .json) y
     <carpeta_texturas>/<id>_<piso>.webp / <id>_<piso>_n.webp
"""
import importlib
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402,F401
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import clay  # noqa: E402
import sangre_biomas_base as B  # noqa: E402
import sangre_biomas_comun as C  # noqa: E402
import sangre_biomas_detalle as D  # noqa: E402
from sangre_biomas_base import hx, mezclar, suave  # noqa: E402

C.ALTA = True

BIOMAS = ['cementerio', 'catacumbas', 'minas', 'abadia', 'castillo']
RES = 512
GRIS = 0.5
# Cuánto se aplanan las manchas grandes del piso de tierra (se repiten cada 2 m: en el juego las reemplazan manchas
# que no se repiten, ver mapa3d.ts)
APLANAR = {'cementerio': 0.55, 'minas': 0.5}


def desenfocar(z, sigma):
    """Desenfoque gaussiano periódico (el piso se repite cada 2 m)."""
    n = z.shape[0]
    f = np.fft.fftfreq(n)
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (f[:, None] ** 2 + f[None, :] ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(z) * g))


def piedritas(P, escala, semilla, prob, radio=0.42):
    """Piedritas pintadas: celdas de Voronoi escogidas al azar. Devuelve (máscara, tono 0..1, alto)."""
    # (torcidas con ruido para que no sean círculos)
    Q = P[:, :2] + (0.32 / escala) * np.stack([C.ruido_piso(P, escala * 1.5, semilla + 1), C.ruido_piso(P, escala * 1.5, semilla + 2)], 1)
    F1, _, ID = B.voronoi(Q, escala, semilla, periodo=C.per(escala))
    sel = ((ID & 0xFFFF) / 65535.0) < prob
    r = radio / escala * (0.6 + 0.7 * ((ID >> 16) & 0xFF) / 255.0)
    m = suave(r, r * 0.6, F1) * sel
    tono = ((ID >> 8) & 0xFF) / 255.0
    alto = m * np.clip(1 - (F1 / r) ** 2, 0, 1) * r * 0.6
    return m, tono, alto


def bordes_voronoi(P, escala, semilla, ancho):
    """Grietas de barro seco: bordes de celdas, a ratos."""
    F1, F2, _ = B.voronoi(P[:, :2], escala, semilla, periodo=C.per(escala))
    corte = suave(0.18, 0.42, C.ruido_piso(P, 2, semilla + 3) + 0.2 * C.ruido_piso(P, 6, semilla + 4))
    return (1 - suave(ancho * 0.4, ancho, F2 - F1)) * corte


def detalle_alta(bioma, P, col, semilla):
    """Lo fino que la textura sí alcanza a mostrar (piedritas, grano, grietas, ceniza, rayones). (color, alto extra)"""
    n = len(P)
    dz = np.zeros(n)
    grano = C.ruido_piso(P, 150, 9200 + semilla)
    col = col * np.where(grano > 0.5, 1.12, np.where(grano < -0.5, 0.86, 1.0))[:, None]

    def poner(m, tono, alto, claro, oscuro):
        nonlocal col, dz
        c = mezclar(hx(oscuro), hx(claro), tono)
        luz = 0.88 + 0.22 * np.clip(alto / (np.max(alto) + 1e-9), 0, 1)
        col = mezclar(col, c * luz[:, None], m * 0.85)
        dz = dz + alto
    if bioma == 'cementerio':
        poner(*piedritas(P, 14, 9300 + semilla, 0.07), '#8E887C', '#5E584E')
        poner(*piedritas(P, 34, 9310 + semilla, 0.1, 0.35), '#6E6656', '#3E382E')
        col = col * (1 - 0.26 * bordes_voronoi(P, 3, 9320 + semilla, 0.011))[:, None]
    elif bioma == 'minas':
        poner(*piedritas(P, 16, 9300 + semilla, 0.1), '#9A6450', '#4E2E24')
        poner(*piedritas(P, 30, 9310 + semilla, 0.09, 0.3), '#2E2826', '#1A1614')
        col = col * (1 - 0.25 * bordes_voronoi(P, 4, 9320 + semilla, 0.01))[:, None]
    elif bioma == 'catacumbas':
        poner(*piedritas(P, 22, 9300 + semilla, 0.05, 0.35), '#D0C6B0', '#8E8472')
        polvo = suave(0.3, 0.7, C.fbm_piso(P, 6, 3, 9330 + semilla))
        col = mezclar(col, hx('#C8BEA6'), polvo * 0.12)
    elif bioma == 'abadia':
        poner(*piedritas(P, 30, 9300 + semilla, 0.1, 0.28), '#4A4440', '#2A2624')
        poner(*piedritas(P, 18, 9310 + semilla, 0.04, 0.35), '#B2A68E', '#6E6452')
    elif bioma == 'castillo':
        # rayones finos y claros sobre el mármol (rectos, por bordes de celdas grandes)
        F1, F2, _ = B.voronoi(P[:, :2] * np.array([1.0, 0.35]), 2, 9300 + semilla, periodo=C.per(2), jitter=1.0)
        ray = (1 - suave(0.0015, 0.004, F2 - F1)) * suave(0.1, 0.35, C.ruido_piso(P, 3, 9301 + semilla))
        col = mezclar(col, hx('#8A8088'), ray * 0.35)
        poner(*piedritas(P, 36, 9310 + semilla, 0.06, 0.3), '#7A7078', '#3A3438')
    return np.clip(col, 0, 1), dz


def hornear(campo, res=RES, malla=32, semilla=0, bioma=''):
    """Color (sRGB 0..1) y normal (espacio tangente) del campo de alturas de una losa de 2 × 2 m.
    Fila 0 = y +1 (arriba de la imagen), columna 0 = x -1: con uv = (x/2+½, y/2+½) y flipY de three.js encaja."""
    t = (np.arange(res) + 0.5) / res * 2 - 1
    X = np.tile(t[None, :], (res, 1))
    Y = np.tile(-t[:, None], (1, res))
    P = np.stack([X.ravel(), Y.ravel(), np.zeros(res * res)], 1)
    z = np.asarray(campo['alto'](P), float).reshape(res, res)
    P[:, 2] = z.ravel()
    h = 2.0 / res
    dzdx = (np.roll(z, -1, 1) - np.roll(z, 1, 1)) / (2 * h)
    dzdy = (np.roll(z, 1, 0) - np.roll(z, -1, 0)) / (2 * h)
    N = np.stack([-dzdx, -dzdy, np.ones_like(z)], -1)
    N /= np.linalg.norm(N, axis=-1, keepdims=True)
    col = np.asarray(campo['pintor'](P, N.reshape(-1, 3)), float)
    col, dz = detalle_alta(bioma, P, col, semilla)
    col = col.reshape(res, res, 3)
    k = APLANAR.get(bioma, 0.0)
    if k:
        for c in range(3):
            base = desenfocar(col[..., c], 20.0)
            col[..., c] = col[..., c] - (base - base.mean()) * k
    z = z + dz.reshape(res, res)
    # grano fino (lo que la rejilla de vértices nunca pudo mostrar) y un poco de oscuro en lo hundido
    grano = C.ruido_piso(P, 48, 9100 + semilla).reshape(res, res)
    cav = desenfocar(z, 3.0) - z
    col = col * (1 + 0.07 * grano)[..., None] * (1 - np.clip(cav * 18, 0, 0.35))[..., None]
    # relieve: solo lo fino (lo grueso ya lo tiene la malla)
    paso = 2.0 / malla / h
    zd = z - desenfocar(z, paso * 0.5)
    zd = zd + 0.0015 * grano
    ddx = (np.roll(zd, -1, 1) - np.roll(zd, 1, 1)) / (2 * h)
    ddy = (np.roll(zd, 1, 0) - np.roll(zd, -1, 0)) / (2 * h)
    Nd = np.stack([-ddx, -ddy, np.ones_like(zd)], -1)
    Nd /= np.linalg.norm(Nd, axis=-1, keepdims=True)
    return np.clip(col, 0, 1), Nd


def guardar(col, Nd, base):
    Image.fromarray((col * 255 + 0.5).astype(np.uint8)).save(base + '.webp', 'WEBP', quality=88, method=6)
    Image.fromarray(((Nd * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)).save(base + '_n.webp', 'WEBP', quality=90, method=6)


def exportar_bioma(bioma, out_glb, out_tex, con_pisos=True):
    clay.reset_scene()
    coll = clay.collection(f'Bioma {bioma} alta')
    raices, info = [], {}
    if con_pisos:
        mod = importlib.import_module(f'sangre_biomas_{bioma}')
        for nombre, fn in mod.PIEZAS.items():
            if not nombre.startswith('piso_'):
                continue
            t0 = time.time()
            p = fn()
            p.nombre = nombre
            campo = getattr(p, 'campo', None)
            if campo is None:
                raise RuntimeError(f'{bioma}/{nombre}: la losa no usa C.piso_campo')
            malla = int(round(np.sqrt(len(p.partes[campo['parte']]['F']) / 2)))
            col, Nd = hornear(campo, RES, malla, semilla=len(raices), bioma=bioma)
            tex = f'{bioma}_{nombre}'
            guardar(col, Nd, os.path.join(out_tex, tex))
            # en los vértices del campo: solo oclusión y bordes (gris)
            p.partes[campo['parte']]['pintor'] = lambda P, N: np.full((len(P), 3), GRIS)
            p.extras['textura'] = tex
            p.extras['textura_escala'] = float(1.0 / B.a_lineal(np.array([GRIS]))[0])
            raices.append(p.construir(coll))
            info[nombre] = dict(tris=p.tris(), textura=tex)
            print(f'  {nombre:28s} {p.tris():6d} tris  {time.time() - t0:5.1f} s', flush=True)
    for fn in D.DETALLES[bioma]:
        t0 = time.time()
        p = fn()
        raices.append(p.construir(coll))
        info[p.nombre] = dict(tris=p.tris(), **{k: v for k, v in p.extras.items()})
        print(f'  {p.nombre:28s} {p.tris():6d} tris  {time.time() - t0:5.1f} s', flush=True)
    ruta = os.path.join(out_glb, f'bioma_{bioma}_alta.glb')
    B.exportar(raices, ruta)
    with open(os.path.join(out_glb, f'bioma_{bioma}_alta.json'), 'w') as fh:
        json.dump(info, fh, ensure_ascii=False, indent=1)


def main(out_glb, out_tex, biomas, con_pisos):
    os.makedirs(out_glb, exist_ok=True)
    os.makedirs(out_tex, exist_ok=True)
    for b in biomas:
        t0 = time.time()
        print('BIOMA', b, flush=True)
        exportar_bioma(b, out_glb, out_tex, con_pisos)
        print('LISTO', b, round(time.time() - t0, 1), 's', flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    banderas = [a for a in args if a.startswith('--')]
    args = [a for a in args if not a.startswith('--')]
    main(args[0], args[1], args[2].split(',') if len(args) > 2 else BIOMAS, '--sin-pisos' not in banderas)
