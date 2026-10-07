"""Sangre y Ceniza · textura de roca de cada bioma para la calidad alta (las paredes se ven menos sosas).

Las paredes son mallas de SDF sin coordenadas de textura: el juego proyecta esta textura desde los tres ejes en el
mundo (src/sangre/vista/roca.ts) y la multiplica por el color de los vértices (que ya trae las formas grandes:
hiladas, musgo, humedad). Aquí va lo fino: estratos, piedritas incrustadas, poros, raíces, fracturas, hollín, motas.

Un cuadro de 1 m que se repite sin costuras (el eje v es «arriba» en las caras de los lados). Canales:
  R = alto (relieve; 0,5 es plano), G = oscuro (grietas, poros, hollín), B = claro (motas, salitre, aristas).
Uso: python3.11 personajes/blender/sangre_roca_alta.py <carpeta> [biomas]  →  <carpeta>/<bioma>_roca.webp
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402,F401  (el módulo de pip necesita bpy antes que bmesh)
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import sangre_biomas_base as B  # noqa: E402
from sangre_biomas_base import suave  # noqa: E402

RES = 512


class Lienzo:
    def __init__(self, res=RES):
        t = (np.arange(res) + 0.5) / res
        U = np.tile(t[None, :], (res, 1))
        V = np.tile(1 - t[:, None], (1, res))  # fila 0 = arriba
        self.res = res
        self.P = np.stack([U.ravel(), V.ravel(), np.zeros(res * res)], 1)
        self.h = np.zeros(res * res)
        self.osc = np.zeros(res * res)
        self.cla = np.zeros(res * res)

    # ruido que se repite cada 1 m (escala entera)
    def n(self, e, s, P=None):
        return B.ruido(self.P if P is None else P, e, s, periodo=(e, e, None))

    def fbm(self, e, o, s, P=None):
        return B.fbm(self.P if P is None else P, e, o, s, periodo=(e, e, None))

    def vor(self, e, s, jitter=0.9, P=None):
        return B.voronoi((self.P if P is None else P)[:, :2], e, s, periodo=(e, e), jitter=jitter)

    def torcido(self, e, amp, s):
        Q = self.P.copy()
        Q[:, 0] += amp * self.n(e, s)
        Q[:, 1] += amp * self.n(e, s + 1)
        return Q

    def piedras(self, e, s, prob, radio=0.42, alto=1.0, claro=0.5, borde=0.5):
        """Piedritas incrustadas (torcidas para que no sean círculos): sobresalen, con arista clara y junta oscura."""
        Q = self.torcido(e * 2, 0.3 / e, s + 7)
        F1, _, ID = self.vor(e, s, P=Q)
        sel = ((ID & 0xFFFF) / 65535.0) < prob
        r = radio / e * (0.6 + 0.7 * ((ID >> 16) & 0xFF) / 255.0)
        m = suave(r, r * 0.7, F1) * sel
        domo = np.clip(1 - (F1 / r) ** 2, 0, 1) * sel
        self.h += domo * alto
        self.cla += m * claro * (0.4 + 0.6 * domo)
        self.osc += suave(r * 0.75, r * 1.0, F1) * suave(r * 1.25, r * 1.0, F1) * sel * borde

    def poros(self, e, s, prob, radio=0.3, hondo=0.6, osc=0.7):
        F1, _, ID = self.vor(e, s)
        sel = ((ID & 0xFFFF) / 65535.0) < prob
        r = radio / e * (0.5 + 0.8 * ((ID >> 16) & 0xFF) / 255.0)
        m = suave(r, r * 0.4, F1) * sel
        self.h -= m * hondo
        self.osc += m * osc

    def grietas(self, e, s, ancho=0.03, fuerza=0.8, corte=0.25):
        Q = self.torcido(e * 4, 0.025, s + 3)
        v = np.abs(self.n(e, s, Q))
        g = (1 - suave(ancho * 0.4, ancho, v)) * suave(corte - 0.15, corte + 0.15, self.n(max(2, e // 2), s + 9))
        self.osc += g * fuerza
        self.h -= g * 0.5

    def motas(self, e, s, umbral, cuanto, oscuras=False):
        v = self.n(e, s)
        m = suave(umbral, umbral + 0.15, v)
        if oscuras:
            self.osc += m * cuanto
        else:
            self.cla += m * cuanto

    def imagen(self):
        R = self.res
        h = self.h - self.h.mean()
        h = h / (np.abs(h).max() + 1e-9)
        rgb = np.stack([0.5 + 0.5 * h, np.clip(self.osc, 0, 1), np.clip(self.cla, 0, 1)], 1).reshape(R, R, 3)
        return Image.fromarray((rgb * 255 + 0.5).astype(np.uint8))


def textura(bioma, res=RES):
    L = Lienzo(res)
    V = L.P[:, 1]
    if bioma == 'cementerio':
        # tierra del barranco: estratos ondulados, piedritas, raíces finas y poros
        s = np.sin((V + 0.05 * L.fbm(3, 3, 11)) * 2 * np.pi * 6)
        L.h += 0.35 * s + 0.3 * L.fbm(6, 4, 12)
        L.osc += 0.3 * suave(0.55, 0.95, s)
        L.piedras(8, 21, 0.14, alto=1.4, claro=0.55)
        L.piedras(20, 22, 0.12, radio=0.35, alto=0.6, claro=0.4)
        L.poros(30, 23, 0.25, hondo=0.4, osc=0.5)
        # raíces: líneas finas que bajan torcidas
        Q = L.torcido(6, 0.05, 24)
        Q[:, 1] *= 0.25
        r = np.abs(B.ruido(Q, 8, 25, periodo=(8, 2, None)))
        L.osc += (1 - suave(0.02, 0.06, r)) * suave(0.0, 0.3, L.n(3, 26)) * 0.75
        L.h += (1 - suave(0.02, 0.06, r)) * suave(0.0, 0.3, L.n(3, 26)) * 0.5
    elif bioma == 'catacumbas':
        # toba y caliza: muchos poros, salitre, marcas de cincel y estratos suaves
        L.h += 0.35 * L.fbm(5, 4, 31)
        L.poros(18, 32, 0.45, radio=0.32, hondo=0.8, osc=0.75)
        L.poros(42, 33, 0.35, radio=0.3, hondo=0.4, osc=0.5)
        L.motas(48, 34, 0.45, 0.6)
        cincel = np.abs(np.sin((L.P[:, 0] * 22 + L.P[:, 1] * 13 + 0.4 * L.n(10, 35)) * 2 * np.pi))
        L.osc += (1 - suave(0.0, 0.12, cincel)) * suave(0.1, 0.4, L.n(3, 36)) * 0.35
        L.h -= (1 - suave(0.0, 0.12, cincel)) * suave(0.1, 0.4, L.n(3, 36)) * 0.3
        L.grietas(4, 37, 0.025, 0.7, corte=0.3)
    elif bioma == 'minas':
        # roca roja en capas de distinto grueso, fracturas, conglomerado y vetitas que brillan
        capa = (V * 5 + 0.25 * L.fbm(2, 3, 41)) % 1.0
        borde = suave(0.0, 0.05, capa) * suave(1.0, 0.92, capa)
        L.h += 0.5 * borde + 0.25 * L.fbm(7, 4, 42)
        L.osc += 0.55 * (1 - borde)
        franja = np.floor(V * 5 + 0.25 * L.fbm(2, 3, 41)).astype(int) % 3
        L.cla += 0.18 * (franja == 1)
        L.osc += 0.2 * (franja == 2)
        L.piedras(12, 43, 0.12, alto=1.0, claro=0.45)
        L.grietas(5, 44, 0.03, 0.9, corte=0.2)
        L.motas(64, 45, 0.6, 0.8)
    elif bioma == 'abadia':
        # sillar de arenisca: grano fino, lechos, desportilladuras y chorreones de hollín hacia arriba
        L.h += 0.3 * L.fbm(12, 4, 51)
        lecho = np.abs(np.sin((V + 0.02 * L.n(5, 52)) * 2 * np.pi * 9))
        L.osc += (1 - suave(0.0, 0.18, lecho)) * 0.25
        L.motas(70, 53, 0.4, 0.35)
        L.motas(70, 54, 0.45, 0.3, oscuras=True)
        L.poros(10, 55, 0.08, radio=0.4, hondo=0.7, osc=0.35)
        Q = L.P.copy()
        Q[:, 1] /= 7
        hollin = suave(0.0, 0.55, B.ruido(Q, 14, 56, periodo=(14, 2, None)) + 0.15 * L.n(30, 57))
        L.osc += hollin * 0.55
        L.grietas(3, 58, 0.025, 0.6, corte=0.35)
    elif bioma == 'castillo':
        # granito: sal y pimienta, cristalitos claros, desportilladuras y alguna veta
        L.h += 0.25 * L.fbm(10, 4, 61)
        F1, _, ID = L.vor(70, 62)
        t = (ID & 0xFF) / 255.0
        L.osc += (t < 0.28) * suave(0.009, 0.004, F1) * 0.85
        L.cla += (t > 0.8) * suave(0.009, 0.004, F1) * 0.7
        L.piedras(28, 63, 0.18, radio=0.38, alto=0.5, claro=0.35, borde=0.2)
        L.poros(9, 64, 0.06, radio=0.45, hondo=0.8, osc=0.4)
        L.grietas(3, 65, 0.02, 0.55, corte=0.4)
    else:
        raise ValueError(bioma)
    return L.imagen()


def main(out, biomas):
    os.makedirs(out, exist_ok=True)
    for b in biomas:
        textura(b).save(os.path.join(out, f'{b}_roca.webp'), 'WEBP', quality=90, method=6)
        print('ROCA', b, flush=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else ['cementerio', 'catacumbas', 'minas', 'abadia', 'castillo'])
