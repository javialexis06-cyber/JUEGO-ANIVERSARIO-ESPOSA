"""Nuestro Hogar · granja: las obras de construcción y los refugios por dentro.

Obras (construccion-render.ts): postes y vigas del andamio, escalera, tablas, cajón de herramientas, cartel de obra,
estacas con cinta y el obrero de peluche (el brazo del martillo va aparte para que el juego lo anime).
Refugios por dentro (arte.ts decorarInterior, zonas-render.ts adornosRefugio, ganaderia-render.ts): piso de tablas,
paredes, pesebres de paja, divisiones, bebedero y comedero de piedra, camas, percha, nido y huevo, el comedero grande
con su heno, la hoja de la puerta, la incubadora, paja regada, farol colgado, ventana, costales, escoba y aseladero.

Todo con las medidas de three.js de esos archivos (frente hacia -y en Blender, que en three.js mira a la cámara). Cada
pieza queda bajo un vacío «m_<clave>» en granja_obras.glb.

Uso: blender -b -P granja_obras.py -- <carpeta_salida> [claves]
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
from granja_muebles import bola, caja, cilindro, mat, metal, piedra, tubo, vidrio  # noqa: E402

RNG = np.random.default_rng(71)
MAD = lambda: madera('obra madera', '#B28C5C')  # noqa: E731
MAD_CLARA = lambda: madera('obra madera clara', '#C9A06E')  # noqa: E731
OSC = lambda: madera('obra madera oscura', '#695B48')  # noqa: E731
PIEDRA = lambda: piedra('obra piedra', '#9C9A8C')  # noqa: E731
HIERRO = lambda: metal('obra hierro', '#6C7474')  # noqa: E731
CUERDA = lambda: tela('cuerda', '#C9AE7A')  # noqa: E731
PAJA = lambda: tela('paja', '#E3C77A')  # noqa: E731
PAJA_OSC = lambda: tela('paja oscura', '#C9A95C')  # noqa: E731
CREMA = lambda: mat('pared refugio', '#EFDFBC', 0.75)  # noqa: E731


def C(x, y, z):
    """De three.js (x, y arriba, z al frente) a Blender (x, -z, y)."""
    return (x, -z, y)


def H(w, h, d):
    return (w / 2, d / 2, h / 2)


def bloque(coll, nombre, medidas, centro, material, p=8, sub=1):
    return caja(coll, nombre, C(*centro), H(*medidas), material, p=p, sub=sub)


def cil(coll, nombre, r, alto, centro, material, seg=12, r2=None):
    x, y, z = centro
    return cilindro(coll, nombre, C(x, y - alto / 2, z), r, alto, material, seg=seg, r2=r2)


def palo(coll, nombre, a, b, r, material, seg=6):
    return tubo(coll, nombre, [C(*a), C(*b)], r, material, seg=seg)


# ---------------------------------------------------------------- obras

def m_obra_poste(coll):
    bloque(coll, 'poste', (0.13, 2.7, 0.13), (0, 1.35, 0), MAD(), p=10)
    bloque(coll, 'zapata', (0.26, 0.13, 0.26), (0, 0.065, 0), PIEDRA(), p=4)
    for y in (1.2, 2.4):
        for k in range(3):
            o = clay.lathe(f'amarre {y} {k}', [(0.075, -0.012), (0.085, 0.0), (0.075, 0.012)], coll, CUERDA(), segments=12, subsurf=0,
                           cap_bottom=False, cap_top=False)
            o.location = C(0, y - 0.05 + k * 0.035, 0)
    bola(coll, 'remate poste', C(0, 2.72, 0), (0.08, 0.08, 0.04), MAD_CLARA(), n=2, sub=0)


def m_obra_viga(coll):
    """1 m a lo largo de x, centrada (el juego la estira)."""
    bloque(coll, 'viga', (1.0, 0.1, 0.1), (0, 0, 0), MAD(), p=10)
    for x in (-0.3, 0.3):
        bola(coll, f'clavo {x}', C(x, 0, 0.052), 0.012, HIERRO(), n=2, sub=0)


def m_obra_escalera(coll):
    for s in (-1, 1):
        bloque(coll, f'larguero {s}', (0.07, 2.2, 0.07), (s * 0.24, 1.1, 0), MAD(), p=10)
    for k in range(7):
        bloque(coll, f'peldaño {k}', (0.48, 0.05, 0.06), (0, 0.25 + k * 0.3, 0), MAD_CLARA(), p=10)


def m_obra_tablas(coll):
    for i in range(5):
        o = bloque(coll, f'tabla {i}', (1.15, 0.085, 0.24), (0, 0.045 + i * 0.087, 0), MAD() if i % 2 else MAD_CLARA(), p=12)
        o.rotation_euler = (0, 0, 0.13 * (1 if i % 2 else -0.4))
    # El serrucho encima
    bloque(coll, 'hoja serrucho', (0.5, 0.008, 0.12), (0.05, 0.47, 0.0), metal('serrucho', '#C9D1D6'), p=12, sub=0)
    bloque(coll, 'mango serrucho', (0.14, 0.03, 0.1), (-0.27, 0.47, 0.0), laca('mango rojo', '#C0503E'), p=6)


def m_obra_cajon(coll):
    bloque(coll, 'cajon', (0.6, 0.45, 0.55), (0, 0.225, 0), MAD(), p=8)
    for y in (0.13, 0.36):
        bloque(coll, f'fleje {y}', (0.66, 0.035, 0.6), (0, y, 0), OSC(), p=10)
    # Martillo, frasco de clavos y metro
    bloque(coll, 'mango martillo', (0.04, 0.04, 0.36), (-0.12, 0.47, 0.02), MAD_CLARA(), p=6)
    bloque(coll, 'cabeza martillo', (0.1, 0.06, 0.06), (-0.12, 0.49, -0.15), HIERRO(), p=6)
    cil(coll, 'frasco clavos', 0.06, 0.12, (0.14, 0.51, 0.08), vidrio('frasco clavos', '#D8EEF0'), seg=12)
    for k in range(5):
        palo(coll, f'clavo {k}', (0.12 + k * 0.01, 0.47, 0.06 + (k % 2) * 0.03), (0.13 + k * 0.012, 0.56, 0.07), 0.006, HIERRO(), seg=4)
    cil(coll, 'metro', 0.06, 0.04, (0.16, 0.47, -0.14), laca('metro', '#F2C14E'), seg=14)


def m_obra_cartel(coll):
    """Cartel de obra 1,15 × 0,5 con rayas, centrado; la barra de avance la pone el juego delante."""
    bloque(coll, 'tabla cartel', (1.15, 0.5, 0.06), (0, 0, 0), mat('lona', '#EFE2BA', 0.7), p=10)
    for i in range(5):
        o = bloque(coll, f'raya {i}', (0.08, 0.5, 0.012), (-0.42 + i * 0.21, 0, 0.034), laca('raya', '#BD9148'), p=10, sub=0)
        o.rotation_euler = (0, -0.5, 0)
    bloque(coll, 'marco arriba', (1.2, 0.05, 0.07), (0, 0.27, 0), OSC(), p=10)
    bloque(coll, 'marco abajo', (1.2, 0.05, 0.07), (0, -0.27, 0), OSC(), p=10)
    # El casco de obra pintado en el centro
    o = clay.lathe('casco emblema', [(0.0, 0.0), (0.11, 0.0), (0.1, 0.06), (0.05, 0.1), (0.0, 0.105)], coll, laca('casco', '#F2C14E'), segments=16, subsurf=1)
    o.location = C(0, -0.02, 0.05)
    o.rotation_euler = (math.pi / 2, 0, 0)
    bloque(coll, 'ala casco', (0.28, 0.025, 0.03), (0, -0.03, 0.06), laca('casco ala', '#E0A93A'), p=8)


def m_obra_estaca(coll):
    bloque(coll, 'estaca', (0.08, 0.45, 0.08), (0, 0.225, 0), MAD_CLARA(), p=10)
    o = bloque(coll, 'punta', (0.06, 0.06, 0.06), (0, 0.0, 0), MAD_CLARA(), p=4)
    o.scale = (1, 1, 0.5)
    bloque(coll, 'cinta', (0.1, 0.06, 0.1), (0, 0.38, 0), laca('cinta', '#E9CE8C'), p=8)
    bloque(coll, 'raya cinta', (0.105, 0.02, 0.105), (0, 0.38, 0), laca('raya cinta', '#C0503E'), p=8)


def _cara(coll, z_cara, y_ojos, sep=0.07):
    piel = mat('piel obrero', '#D7AD83', 0.7)
    negro = mat('ojo', '#2B2422', 0.3)
    for s in (-1, 1):
        bola(coll, f'ojo {s}', C(s * sep, y_ojos, z_cara), (0.026, 0.03, 0.018), negro, n=2, sub=0)
        bola(coll, f'brillo {s}', C(s * sep - 0.008, y_ojos + 0.012, z_cara + 0.012), 0.008, luz('brillo ojo', '#FFFFFF', 1.0), n=2, sub=0)
        bola(coll, f'cachete {s}', C(s * 0.12, y_ojos - 0.07, z_cara - 0.01), (0.04, 0.025, 0.012), mat('cachete', '#F2A7A0', 0.8), n=2, sub=0)
    tubo(coll, 'sonrisa', [C(-0.04, y_ojos - 0.09, z_cara + 0.005), C(0, y_ojos - 0.11, z_cara + 0.012), C(0.04, y_ojos - 0.09, z_cara + 0.005)], 0.009, negro, seg=5)
    return piel


def m_obrero(coll):
    """El obrero de peluche (sin el brazo derecho, que es aparte); pies en el origen, mirando a la cámara."""
    overol = tela('overol', '#506574')
    camisa = tela('camisa obrero', '#AF7950')
    botas = mat('botas', '#4B4540', 0.6)
    for s in (-1, 1):
        bloque(coll, f'pierna {s}', (0.16, 0.42, 0.19), (s * 0.11, 0.27, 0), overol, p=3)
        bola(coll, f'bota {s}', C(s * 0.11, 0.07, 0.05), (0.1, 0.15, 0.08), botas, n=3)
    bola(coll, 'cuerpo', C(0, 0.74, 0), (0.24, 0.17, 0.3), camisa, n=4)
    bola(coll, 'peto', C(0, 0.66, 0.06), (0.2, 0.13, 0.24), overol, n=4)
    for s in (-1, 1):
        palo(coll, f'tirante {s}', (s * 0.11, 0.88, 0.14), (s * 0.12, 0.66, 0.17), 0.018, overol, seg=5)
        bola(coll, f'boton {s}', C(s * 0.11, 0.82, 0.18), 0.022, metal('botón', '#D6BD80'), n=2, sub=0)
    bloque(coll, 'bolsillo', (0.14, 0.1, 0.02), (0, 0.6, 0.19), tela('bolsillo', '#43586A'), p=6)
    # El brazo izquierdo (el derecho lo anima el juego)
    tubo(coll, 'brazo izq', [C(-0.22, 0.92, 0.0), C(-0.27, 0.72, 0.04), C(-0.25, 0.6, 0.08)], 0.07, camisa, seg=8)
    piel = _cara(coll, 0.17, 1.22)
    bola(coll, 'mano izq', C(-0.25, 0.57, 0.08), 0.075, piel, n=3)
    bola(coll, 'cabeza', C(0, 1.2, 0), (0.21, 0.19, 0.23), piel, n=4)
    bola(coll, 'nariz', C(0, 1.18, 0.19), (0.035, 0.03, 0.03), mat('nariz', '#C9906A', 0.7), n=2, sub=0)
    for s in (-1, 1):
        bola(coll, f'oreja {s}', C(s * 0.21, 1.2, 0), (0.035, 0.04, 0.05), piel, n=2, sub=0)
    # El casco amarillo
    o = clay.lathe('casco', [(0.0, 0.0), (0.24, 0.0), (0.23, 0.08), (0.17, 0.17), (0.08, 0.21), (0.0, 0.22)], coll, laca('casco obrero', '#E8B94A'), segments=20, subsurf=1)
    o.location = C(0, 1.34, 0)
    cil(coll, 'ala casco', 0.29, 0.03, (0, 1.35, 0.03), laca('ala casco obrero', '#D9A63A'), seg=20)
    bloque(coll, 'cresta casco', (0.04, 0.05, 0.36), (0, 1.55, 0), laca('cresta casco', '#F2C94C'), p=6)
    # Cinturón de herramientas
    cil(coll, 'cinturon', 0.27, 0.06, (0, 0.53, 0), mat('cinturón', '#7A5C41', 0.6), seg=18)
    bloque(coll, 'bolsa cinturon', (0.12, 0.13, 0.08), (0.2, 0.47, 0.12), mat('bolsa cuero', '#8A6242', 0.6), p=6)


def m_obrero_brazo(coll):
    """El brazo con el martillo; el origen es el hombro (el juego lo gira en x para martillar)."""
    camisa = tela('camisa obrero', '#AF7950')
    piel = mat('piel obrero', '#D7AD83', 0.7)
    tubo(coll, 'brazo der', [C(0, 0, 0), C(0.02, -0.17, 0.06), C(0, -0.3, 0.11)], 0.07, camisa, seg=8)
    bola(coll, 'mano der', C(0, -0.33, 0.12), 0.075, piel, n=3)
    palo(coll, 'mango', (0, -0.36, 0.13), (0, -0.04, 0.2), 0.022, MAD_CLARA(), seg=6)
    bloque(coll, 'cabeza martillo', (0.22, 0.1, 0.1), (0, -0.03, 0.2), HIERRO(), p=6)


# ---------------------------------------------------------------- refugios por dentro (cuarto de 4 × 4)

def m_ref_piso(coll):
    bloque(coll, 'piso', (4.0, 0.14, 4.0), (0, -0.07, 0), madera('piso refugio', '#B7956C'), p=10, sub=0)
    for i in range(13):
        bloque(coll, f'junta {i}', (0.02, 0.01, 3.98), (-1.85 + i * 0.3, 0.004, 0), OSC(), p=12, sub=0)
    for k in range(18):
        x, z = RNG.uniform(-1.8, 1.8), RNG.uniform(-1.8, 1.8)
        bola(coll, f'nudo {k}', C(x, 0.003, z), (0.05, 0.03, 0.004), madera('nudo', '#9B7B58'), n=2, sub=0)


def m_ref_pared_lado(coll):
    """Pared de un lado: 4 m de largo (a lo largo de z), 1,15 de alto, centrada en x = 0."""
    bloque(coll, 'pared lado', (0.12, 1.15, 4.0), (0, 0.575, 0), CREMA(), p=10)
    for k in range(5):
        bloque(coll, f'tabla lado {k}', (0.125, 0.012, 4.0), (0, 0.18 + k * 0.21, 0), madera('junta pared', '#D9C49E'), p=12, sub=0)
    bloque(coll, 'remate lado', (0.16, 0.06, 4.02), (0, 1.17, 0), MAD(), p=10)


def m_ref_pared_fondo(coll):
    bloque(coll, 'pared fondo', (4.0, 1.6, 0.12), (0, 0.8, 0), CREMA(), p=10)
    for k in range(7):
        bloque(coll, f'tabla fondo {k}', (4.0, 0.012, 0.125), (0, 0.2 + k * 0.21, 0), madera('junta pared', '#D9C49E'), p=12, sub=0)
    for x in (-1.1, 0.0, 1.1):
        bloque(coll, f'pilar {x}', (0.12, 1.65, 0.12), (x, 0.825, 0.11), OSC(), p=10)
    bloque(coll, 'viga fondo', (4.0, 0.1, 0.14), (0, 1.62, 0.08), OSC(), p=10)
    # Herraduras y un cuadrito de la granja colgados
    o = clay.lathe('herradura', [(0.07, -0.012), (0.09, 0.0), (0.07, 0.012)], coll, metal('herradura', '#9A9EA4'), segments=14, subsurf=0,
                   cap_bottom=False, cap_top=False)
    o.location = C(-0.55, 1.2, 0.08)
    o.rotation_euler = (math.pi / 2, 0, 0)
    bloque(coll, 'cuadrito', (0.34, 0.26, 0.03), (0.55, 1.15, 0.08), MAD_CLARA(), p=8)
    bloque(coll, 'dibujo cuadrito', (0.26, 0.18, 0.01), (0.55, 1.15, 0.1), mat('dibujo', '#A8D08D', 0.6), p=8, sub=0)


def m_ref_pesebre(coll):
    bloque(coll, 'cama paja', (1.05, 0.1, 1.25), (0, 0.05, 0), PAJA(), p=4)
    for i in range(14):
        a = RNG.uniform(0, math.pi)
        x, z = RNG.uniform(-0.45, 0.45), RNG.uniform(-0.55, 0.55)
        palo(coll, f'brizna {i}', (x - math.cos(a) * 0.1, 0.11, z - math.sin(a) * 0.1), (x + math.cos(a) * 0.1, 0.12, z + math.sin(a) * 0.1),
             0.01, PAJA() if i % 3 else PAJA_OSC(), seg=4)


def m_ref_corral(coll):
    """División de un corral: dos postes y dos travesaños de 1,1 m a lo largo de x, centrada."""
    for x in (-0.55, 0.55):
        bloque(coll, f'poste corral {x}', (0.08, 0.76, 0.08), (x, 0.38, 0), OSC(), p=10)
        bola(coll, f'remate corral {x}', C(x, 0.78, 0), (0.05, 0.05, 0.03), MAD_CLARA(), n=2, sub=0)
    for y in (0.32, 0.65):
        bloque(coll, f'travesaño {y}', (1.11, 0.07, 0.07), (0, y, 0), MAD(), p=10)


def _artesa(coll, contenido):
    bloque(coll, 'base artesa', (0.5, 0.07, 0.6), (0, 0.035, 0), PIEDRA(), p=4)
    for s in (-1, 1):
        bloque(coll, f'lado artesa {s}', (0.06, 0.26, 0.6), (s * 0.22, 0.15, 0), PIEDRA(), p=4)
        bloque(coll, f'frente artesa {s}', (0.4, 0.26, 0.06), (0, 0.15, s * 0.27), PIEDRA(), p=4)
    if contenido == 'agua':
        bloque(coll, 'agua', (0.39, 0.02, 0.48), (0, 0.22, 0), vidrio('agua bebedero', '#8EBDC5'), p=8, sub=0)
    else:
        bloque(coll, 'verde', (0.39, 0.03, 0.48), (0, 0.22, 0), tela('verdura', '#9BB382'), p=6)
        for i in range(6):
            palo(coll, f'heno artesa {i}', (-0.14 + i * 0.055, 0.25, -0.15), (-0.1 + i * 0.05, 0.255, 0.14), 0.012, PAJA(), seg=4)
        for k in range(3):
            bola(coll, f'zanahoria {k}', C(-0.1 + k * 0.1, 0.25, 0.08 - k * 0.06), (0.025, 0.06, 0.025), laca('zanahoria', '#E8853A'), n=2, sub=0)


def m_ref_bebedero(coll):
    _artesa(coll, 'agua')


def m_ref_comedero_verde(coll):
    _artesa(coll, 'verde')


def m_ref_cama(coll):
    bloque(coll, 'marco cama', (0.91, 0.035, 0.57), (0, 0.018, 0), OSC(), p=8)
    bloque(coll, 'colchon paja', (0.85, 0.06, 0.51), (0, 0.06, 0), PAJA(), p=3)
    for j in range(6):
        palo(coll, f'paja cama {j}', (-0.33 + j * 0.13, 0.095, -0.2), (-0.29 + j * 0.12, 0.095, 0.21), 0.009, PAJA_OSC(), seg=4)
    bola(coll, 'almohada', C(0, 0.1, -0.18), (0.18, 0.08, 0.04), tela('almohadita', '#EFDFBC'), n=3)


def m_ref_percha(coll):
    """Percha de 2,6 m a lo largo de x con sus soportes (centrada, a la altura del travesaño)."""
    palo(coll, 'percha', (-1.3, 0, 0), (1.3, 0, 0), 0.06, MAD(), seg=10)
    for x in (-1.25, 1.25):
        palo(coll, f'soporte {x}', (x, 0, 0), (x, 0, -0.2), 0.04, OSC(), seg=6)


def m_ref_nido(coll):
    o = clay.lathe('nido', [(0.17, 0.0), (0.3, 0.03), (0.32, 0.08), (0.27, 0.11), (0.2, 0.06), (0.0, 0.04)], coll, PAJA(), segments=20, subsurf=1)
    o.location = (0, 0, 0)
    for i in range(16):
        a = i / 16 * math.tau
        palo(coll, f'brizna nido {i}', (math.cos(a) * 0.22, 0.09, math.sin(a) * 0.22), (math.cos(a + 0.6) * 0.3, 0.1, math.sin(a + 0.6) * 0.3),
             0.008, PAJA_OSC(), seg=4)


def m_ref_huevo(coll):
    bola(coll, 'huevo', C(0, 0.075, 0), (0.06, 0.06, 0.08), mat('huevo', '#F1E2BD', 0.55), n=4)


def m_ref_comedero(coll):
    """El comedero grande (1,8 × 0,65), patas incluidas; el heno es aparte."""
    bloque(coll, 'fondo comedero', (1.8, 0.12, 0.65), (0, 0.45, 0), MAD(), p=8)
    for z in (-0.32, 0.32):
        bloque(coll, f'lado comedero {z}', (1.9, 0.28, 0.08), (0, 0.58, z), MAD_CLARA(), p=8)
    for x in (-0.92, 0.92):
        bloque(coll, f'cabecera {x}', (0.08, 0.28, 0.7), (x, 0.58, 0), MAD_CLARA(), p=8)
    for x in (-0.72, 0.72):
        bloque(coll, f'pata comedero {x}', (0.1, 0.45, 0.1), (x, 0.225, 0), OSC(), p=8)
    for x in (-0.6, 0.0, 0.6):
        bola(coll, f'remache {x}', C(x, 0.62, 0.365), 0.018, HIERRO(), n=2, sub=0)


def m_ref_heno(coll):
    bloque(coll, 'heno', (1.7, 0.12, 0.53), (0, 0.55, 0), PAJA(), p=3)
    for i in range(22):
        x, z = RNG.uniform(-0.75, 0.75), RNG.uniform(-0.2, 0.2)
        a = RNG.uniform(0, math.pi)
        palo(coll, f'heno {i}', (x - math.cos(a) * 0.08, 0.62, z - math.sin(a) * 0.08), (x + math.cos(a) * 0.08, 0.64, z + math.sin(a) * 0.08),
             0.01, PAJA() if i % 3 else PAJA_OSC(), seg=4)


def m_ref_puerta(coll):
    """La hoja de la puerta del corral: la bisagra en el origen, se extiende 0,95 hacia +x."""
    for i in range(5):
        bloque(coll, f'tablon {i}', (0.18, 1.45, 0.1), (0.09 + i * 0.19, 0.8, 0), MAD() if i % 2 else MAD_CLARA(), p=10)
    for y in (0.3, 1.25):
        bloque(coll, f'herraje {y}', (0.93, 0.1, 0.13), (0.475, y, 0.02), HIERRO(), p=10)
    o = bloque(coll, 'diagonal', (0.08, 1.15, 0.05), (0.475, 0.78, 0.06), OSC(), p=10)
    o.rotation_euler = (0, -0.68, 0)
    bloque(coll, 'pestillo', (0.07, 0.15, 0.15), (0.8, 0.8, 0.13), metal('pestillo', '#D6BD80'), p=6)
    for y in (0.3, 1.25):
        cil(coll, f'bisagra {y}', 0.04, 0.16, (0.0, y, 0.0), HIERRO(), seg=10)


def m_ref_incubadora(coll):
    bloque(coll, 'mesa incubadora', (1.3, 0.15, 0.95), (0, 0.5, 0), MAD(), p=8)
    for x in (-0.52, 0.52):
        for z in (-0.35, 0.35):
            bloque(coll, f'pata inc {x} {z}', (0.12, 0.55, 0.12), (x, 0.26, z), OSC(), p=8)
    bloque(coll, 'cama heno', (1.05, 0.09, 0.7), (0, 0.6, 0), PAJA(), p=3)
    for x in (-0.58, 0.58):
        bloque(coll, f'lado vidrio {x}', (0.08, 0.55, 0.88), (x, 0.8, 0), vidrio('vidrio incubadora', '#D8EEF0'), p=8)
    bloque(coll, 'techo incubadora', (1.3, 0.08, 0.95), (0, 1.1, 0), metal('techo incubadora', '#B6B5A4'), p=8)
    bola(coll, 'lampara', C(0, 0.98, 0), 0.12, luz('lámpara incubadora', '#FFDA91', 2.0), n=3)
    cil(coll, 'termometro', 0.025, 0.3, (0.45, 0.82, 0.48), vidrio('termómetro', '#F2F2F2'), seg=8)
    bola(coll, 'bulbo termometro', C(0.45, 0.67, 0.48), 0.035, laca('mercurio', '#D9473E'), n=2, sub=0)


def m_ref_paja(coll):
    """Paja regada en un parche de 1,2 × 1,2 (el juego pone varios)."""
    for i in range(26):
        x, z = RNG.uniform(-0.6, 0.6), RNG.uniform(-0.6, 0.6)
        a = RNG.uniform(0, math.pi)
        palo(coll, f'paja {i}', (x - math.cos(a) * 0.14, 0.015, z - math.sin(a) * 0.14), (x + math.cos(a) * 0.14, 0.02, z + math.sin(a) * 0.14),
             0.012, PAJA() if i % 3 else PAJA_OSC(), seg=4)


def m_ref_farol(coll):
    """Farol colgado: el origen es el centro de la lámpara (la cuerda sube 0,6)."""
    palo(coll, 'cuerda farol', (0, 0.2, 0), (0, 0.8, 0), 0.015, CUERDA(), seg=4)
    bloque(coll, 'tapa farol', (0.34, 0.06, 0.34), (0, 0.19, 0), metal('farol', '#4A4A4F'), p=8)
    for x in (-0.13, 0.13):
        for z in (-0.13, 0.13):
            bloque(coll, f'arista {x} {z}', (0.03, 0.32, 0.03), (x, 0, z), metal('farol', '#4A4A4F'), p=8, sub=0)
    bloque(coll, 'vidrio farol', (0.24, 0.3, 0.24), (0, 0, 0), luz('luz farol', '#FFE2A0', 2.5), p=8)
    bloque(coll, 'base farol', (0.3, 0.05, 0.3), (0, -0.17, 0), metal('farol', '#4A4A4F'), p=8)
    o = clay.lathe('asa farol', [(0.06, -0.01), (0.075, 0.0), (0.06, 0.01)], coll, metal('farol', '#4A4A4F'), segments=12, subsurf=0,
                   cap_bottom=False, cap_top=False)
    o.location = C(0, 0.26, 0)
    o.rotation_euler = (math.pi / 2, 0, 0)


def m_ref_ventana(coll):
    """Ventana en la pared izquierda (mirando a +x): marco, vidrio con luz de afuera y cruz."""
    bloque(coll, 'marco ventana', (0.06, 0.7, 1.1), (0, 0, 0), madera('marco ventana', '#6E4B33'), p=8)
    bloque(coll, 'vidrio ventana', (0.07, 0.52, 0.9), (0.005, 0, 0), luz('cielo ventana', '#CFE9EF', 0.6), p=8, sub=0)
    bloque(coll, 'cruz v', (0.08, 0.52, 0.05), (0.02, 0, 0), madera('marco ventana', '#6E4B33'), p=8)
    bloque(coll, 'cruz h', (0.08, 0.05, 0.9), (0.02, 0, 0), madera('marco ventana', '#6E4B33'), p=8)
    bloque(coll, 'repisa ventana', (0.16, 0.05, 1.2), (0.06, -0.37, 0), madera('repisa', '#8A6242'), p=8)
    o = clay.lathe('matica ventana', [(0.0, 0.0), (0.06, 0.0), (0.07, 0.09), (0.0, 0.09)], coll, laca('materita', '#C8683E'), segments=12, subsurf=1)
    o.location = C(0.08, -0.35, 0.25)
    bola(coll, 'hojas matica', C(0.08, -0.22, 0.25), (0.07, 0.07, 0.06), tela('hojas', '#6DB04A'), n=3)


def m_ref_costal(coll):
    o = clay.lathe('costal', [(0.0, 0.0), (0.24, 0.0), (0.3, 0.12), (0.28, 0.38), (0.16, 0.5), (0.07, 0.52), (0.0, 0.52)], coll,
                   tela('costal', '#D8C49C'), segments=16, subsurf=1)
    o.location = (0, 0, 0)
    o.scale = (1, 0.85, 1)
    cil(coll, 'amarre costal', 0.08, 0.06, (0, 0.52, 0), CUERDA(), seg=10)
    bola(coll, 'oreja costal', C(0, 0.6, 0), (0.07, 0.05, 0.06), tela('costal', '#D8C49C'), n=3)
    bloque(coll, 'parche', (0.16, 0.14, 0.01), (0, 0.24, 0.25), tela('sello costal', '#B39168'), p=6, sub=0)
    bola(coll, 'grano', C(0, 0.24, 0.257), (0.04, 0.05, 0.005), laca('grano', '#F2C14E'), n=2, sub=0)


def m_ref_escoba(coll):
    palo(coll, 'palo escoba', (0, 0.15, 0), (0.25, 1.55, 0), 0.025, madera('palo escoba', '#8A6242'), seg=6)
    o = bloque(coll, 'cepillo escoba', (0.32, 0.3, 0.08), (0, 0.12, 0), PAJA_OSC(), p=3)
    o.rotation_euler = (0, -0.18, 0)
    bloque(coll, 'atadura escoba', (0.2, 0.05, 0.09), (0.02, 0.27, 0), laca('cinta escoba', '#C0503E'), p=6)


def m_ref_aseladero(coll):
    """Aseladero de las gallinas: dos palos a dos alturas y su escalerita (centrado en x)."""
    for x in (-0.7, 0.7):
        bloque(coll, f'pata aseladero {x}', (0.08, 1.1, 0.08), (x, 0.55, 0), OSC(), p=10)
    for k in range(2):
        bloque(coll, f'palo aseladero {k}', (1.6, 0.06, 0.06), (0, 0.7 + k * 0.3, -k * 0.35), MAD(), p=10)
    for k in range(4):
        bloque(coll, f'peldaño aseladero {k}', (0.3, 0.03, 0.06), (0, 0.12 + k * 0.14, 0.75 - k * 0.2), MAD_CLARA(), p=10)
    o = bloque(coll, 'rampa aseladero', (0.3, 0.04, 1.2), (0, 0.35, 0.8), MAD(), p=10)
    o.rotation_euler = (0.6, 0, 0)



def m_ref_huevo_pato(coll):
    bola(coll, 'huevo pato', C(0, 0.075, 0), (0.06, 0.06, 0.08), mat('huevo pato', '#D1DDBA', 0.55), n=4)


def m_ref_huevo_dino(coll):
    bola(coll, 'huevo dino', C(0, 0.075, 0), (0.06, 0.06, 0.08), mat('huevo dino', '#A4B984', 0.55), n=4)
    for k in range(5):
        a = k * 1.3
        bola(coll, f'pinta {k}', C(math.cos(a) * 0.05, 0.06 + (k % 3) * 0.03, math.sin(a) * 0.05), 0.012, mat('pinta dino', '#6E8A52', 0.6), n=2, sub=0)


def m_ref_nidal(coll):
    """Nidal de las aves (0,62 × 0,35 × 0,58) con su paja."""
    bloque(coll, 'caja nidal', (0.62, 0.35, 0.58), (0, 0.2, 0), MAD(), p=8)
    bloque(coll, 'hueco nidal', (0.5, 0.05, 0.46), (0, 0.38, 0), OSC(), p=8, sub=0)
    bola(coll, 'paja nidal', C(0, 0.42, 0.04), (0.22, 0.2, 0.06), PAJA(), n=3)
    for i in range(8):
        a = i / 8 * math.tau
        palo(coll, f'brizna nidal {i}', (math.cos(a) * 0.12, 0.44, 0.04 + math.sin(a) * 0.12), (math.cos(a) * 0.24, 0.42, 0.04 + math.sin(a) * 0.22),
             0.009, PAJA_OSC(), seg=4)
    bloque(coll, 'tablilla nidal', (0.64, 0.06, 0.04), (0, 0.06, 0.3), MAD_CLARA(), p=8)


def m_ref_heno_alto(coll):
    """El pesebre alto de los demás animales (1,1 × 0,5 × 0,46) con heno."""
    bloque(coll, 'pesebre alto', (1.1, 0.5, 0.46), (0, 0.25, 0), MAD(), p=8)
    for k in range(6):
        palo(coll, f'reja pesebre {k}', (-0.45 + k * 0.18, 0.5, 0.2), (-0.45 + k * 0.18, 0.85, 0.28), 0.018, OSC(), seg=5)
    bloque(coll, 'heno pesebre', (0.98, 0.1, 0.34), (0, 0.55, 0), PAJA(), p=3)
    for i in range(10):
        x = RNG.uniform(-0.42, 0.42)
        palo(coll, f'heno pesebre {i}', (x, 0.58, -0.1), (x + 0.05, 0.66, 0.12), 0.01, PAJA_OSC(), seg=4)


def m_ref_madriguera(coll):
    """La madriguera de los conejos: arco de madera con hojitas a los lados."""
    o = clay.lathe('arco madriguera', [(0.21, -0.12), (0.33, -0.13), (0.45, -0.12), (0.45, 0.12), (0.33, 0.13), (0.21, 0.12)], coll,
                   madera('madriguera', '#9A6F4C'), segments=20, subsurf=1)
    o.location = C(0, 0.0, 0)
    o.rotation_euler = (math.pi / 2, 0, 0)
    bloque(coll, 'tapa piso', (1.0, 0.04, 0.3), (0, 0.0, 0), OSC(), p=8)
    for x in (-0.56, 0.56):
        for k in range(3):
            bola(coll, f'hoja {x} {k}', C(x + (k - 1) * 0.06, 0.15 + k * 0.06, 0.05), (0.09, 0.05, 0.03), tela('hoja madriguera', '#9BB382'), n=3)
    bola(coll, 'zanahoria madriguera', C(0.32, 0.04, 0.22), (0.025, 0.09, 0.025), laca('zanahoria', '#E8853A'), n=2, sub=0)


def m_ref_cristales(coll):
    """Los cristales del refugio del dragón (siete, en arco)."""
    for i in range(7):
        x, z = math.cos(i) * 0.5, math.sin(i) * 0.21
        alto = 0.3 * (0.7 + 0.3 * ((i * 0.618) % 1))
        o = clay.lathe(f'cristal {i}', [(0.0, 0.0), (0.12, 0.02), (0.1, alto * 0.75), (0.0, alto)], coll,
                       luz('cristal dragón', ('#B9A7F2', '#9FD3F2', '#F2B6C6')[i % 3], 0.6), segments=6, subsurf=0)
        o.location = C(x, 0.0, z)
        o.rotation_euler = (0.15 * math.sin(i * 2), 0.15 * math.cos(i * 3), i)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Obras y refugios granja')
    raices = []
    for clave in claves or PIEZAS:
        antes = set(coll.objects)
        PIEZAS[clave](coll)
        raiz = bpy.data.objects.new(f'm_{clave}', None)
        clay.link(raiz, coll)
        for o in coll.objects:
            if o not in antes and o is not raiz and o.parent is None:
                o.parent = raiz
        raices.append(raiz)
        print('pieza', clave, flush=True)
    import exportar_glb
    objs = []
    for r in raices:
        objs.extend(exportar_glb.arbol(r))
    exportar_glb.exportar(objs, os.path.join(out, 'granja_obras.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
