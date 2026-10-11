"""Nuestro Hogar · granja: las regiones de Astra (las viviendas de cada pueblo, los recursos y su utilería).

Cada región tiene su casa, todas de 8 × 6 m (la huella de astra.ts), con la puerta hacia -y (el juego la pone de
cara a su entrada):

  casa_puerto    palafito de tablas azules con red, salvavidas y remos      (Puerto de los Lirios)
  casa_bruma     cabaña de entramado con el techo cubierto de musgo         (Brumaverde)
  casa_piedra    casa de piedra minera con farol de mina y dintel           (Piedralumbre)
  casa_brasa     adobe terracota con cúpula de barro y chimenea encendida   (Brasaviva)
  casa_nieve     cabaña de troncos con nieve en el techo y carámbanos       (Nieveclara)
  casa_vigilia   casa de frontera: zócalo de piedra, estandarte y escudo    (Vigilia)
  casa_verdia    casita pastel cubierta de rosas y faroles de alma          (Rosal Eterno, Jardines del Eco)
  casa_senda     casa lila de piedra con torrecita e hilos con faroles       (La Travesía, Refugio de los Hilos)
  casa_nox       casa de contención azul noche con cristales sellados       (Bastión del Velo)
  casa_orbita    módulo espacial con cúpula, escotillas, antena y panel     (la órbita; el acento lo tiñe el juego)

Recursos (sobre su punto, el juego pone el nombre en el letrero):
  recurso_mineral  afloramiento con cristales («cristal», que el juego tiñe por región)
  recurso_madera   pila de troncos con tocón, hacha y astillas
  recurso_semilla  cantero elevado con brotes, costal de semillas y regadera
  recurso_fauna    puesto de observación: caseta con catalejo, comedero y nido
  letrero_nombre   poste con tablero (el nombre lo pinta el juego en el tablero, a 1,55 m)
  archivo_publico  atril con techito, tablón de avisos y cajón de expedientes
  puerta_combate   arco de piedra con espadas cruzadas y antorchas

Coordenadas: origen en el centro de la huella, base en z=0, frente hacia -y. Un solo GLB: granja_astra.glb.

Uso: blender -b -P granja_astra.py -- <carpeta_salida> [claves]
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
from granja_festivales import flor  # noqa: E402
from granja_edificios import cubo, malla, tira_tejas, ventana  # noqa: E402
from granja_monte import grumo  # noqa: E402

RNG = np.random.default_rng(77)
W, D = 8.0, 6.0
FY = -D / 2
VIGA = lambda: madera('viga', '#674A39')  # noqa: E731
CREMA = lambda: mat('crema', '#F0DABC', 0.8)  # noqa: E731
VIDRIO = lambda: mat('vidrio ventana', '#9EBCC0', 0.15, coat=0.6)  # noqa: E731
MUSGO = lambda: tela('musgo', '#6E9A4A')  # noqa: E731
MUSGO2 = lambda: tela('musgo claro', '#8DB45E')  # noqa: E731
NIEVE = lambda: mat('nieve', '#F4F7FA', 0.7)  # noqa: E731


def aclarar(c, f=1.1):
    return '#' + ''.join(f'{max(0, min(255, int(int(c[i:i + 2], 16) * f))):02X}' for i in (1, 3, 5))


# ---------------------------------------------------------------- piezas comunes de las casas

def techo(coll, h, pico, color, vuelo=0.38, largo_extra=0.85, filas=6, w=W, d=D, nombre='techo'):
    """Techo de dos aguas de tejas en escama, con la cumbrera a lo largo del fondo (y)."""
    m1 = laca(f'{nombre} {color}', color, 0.55)
    m2 = laca(f'{nombre} claro {color}', aclarar(color, 1.1), 0.55)
    span = math.hypot(w / 2 + vuelo, pico)
    pend = math.atan2(pico, w / 2 + vuelo)
    largo = d + largo_extra
    for s in (-1, 1):
        base = cubo(coll, f'{nombre} tablado {s}', (0, 0, 0), (span / 2, largo / 2, 0.06), m1)
        base.location = (s * (w / 2 + vuelo) / 2, 0, h + pico / 2 - 0.02)
        base.rotation_euler = (0, s * pend, 0)
        baja = np.array((s * math.cos(pend), 0.0, -math.sin(pend)))
        normal = np.array((s * math.sin(pend), 0.0, math.cos(pend)))
        for r in range(filas):
            o = tira_tejas(coll, f'{nombre} tejas {s}{r}', largo, span / filas + 0.1, (m1, m2)[r % 2], paso=0.36, bulto=0.1)
            o.location = tuple(np.array((0.0, 0.0, h + pico)) + baja * (r * span / filas) + normal * (0.07 + (filas - r) * 0.014))
            o.rotation_euler = (0, pend, 0) if s > 0 else (0, pend, math.pi)
    o = clay.lathe(f'{nombre} cumbrera', [(0.0, -largo / 2 - 0.05), (0.19, -largo / 2 - 0.05), (0.19, largo / 2 + 0.05), (0.0, largo / 2 + 0.05)],
                   coll, laca(f'cumbrera {color}', color, 0.6), segments=12, subsurf=1)
    o.location = (0, 0, h + pico + 0.06)
    o.rotation_euler = (math.pi / 2, 0, 0)
    return span, pend


def frontones(coll, h, pico, material, borde=None, w=W, d=D, vuelo=0.38):
    for fy2, nom in ((-d / 2 - 0.025, 'frente'), (d / 2 + 0.025, 'atrás')):
        verts = [(-w / 2, fy2, h), (w / 2, fy2, h), (0, fy2, h + pico)]
        malla(f'frontón {nom}', verts + [(v[0], v[1] + (0.05 if nom == 'frente' else -0.05), v[2]) for v in verts],
              [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)], coll, material)
        for s in (-1, 1):
            pts = [(s * (w / 2 + vuelo + 0.05), fy2 - (0.42 if nom == 'frente' else -0.42), h - 0.06),
                   (0, fy2 - (0.42 if nom == 'frente' else -0.42), h + pico + 0.06)]
            tubo(coll, f'tabla borde {nom}{s}', pts, 0.07, borde or VIGA(), seg=6)


def ojo_buey(coll, z, color_aro=None, r=0.26):
    o = clay.lathe('ojo de buey', [(0.0, -0.04), (r, -0.04), (r, 0.04), (0.0, 0.04)], coll, VIDRIO(), segments=20, subsurf=0)
    o.location = (0, FY - 0.1, z)
    o.rotation_euler = (math.pi / 2, 0, 0)
    a = clay.lathe('aro ojo de buey', [(r - 0.01, -0.06), (r + 0.06, 0.0), (r - 0.01, 0.06)], coll, color_aro or VIGA(), segments=20, subsurf=0,
                   cap_bottom=False, cap_top=False)
    a.location = (0, FY - 0.12, z)
    a.rotation_euler = (math.pi / 2, 0, 0)
    for k in range(2):
        caja(coll, f'cruz ojo {k}', (0, FY - 0.15, z), (r, 0.02, 0.025) if k else (0.025, 0.02, r), color_aro or VIGA(), p=12, sub=0)


def puerta(coll, m_puerta, m_marco=None, arco=True, redonda=False, escalones=True, piedra_esc='#ADA793'):
    m_marco = m_marco or VIGA()
    if redonda:
        o = clay.lathe('marco puerta redonda', [(0.0, -0.08), (0.95, -0.08), (0.95, 0.08), (0.0, 0.08)], coll, m_marco, segments=28, subsurf=0)
        o.location = (0, FY - 0.05, 1.25)
        o.rotation_euler = (math.pi / 2, 0, 0)
        o = clay.lathe('puerta redonda', [(0.0, -0.06), (0.8, -0.06), (0.8, 0.06), (0.0, 0.06)], coll, m_puerta, segments=28, subsurf=0)
        o.location = (0, FY - 0.16, 1.25)
        o.rotation_euler = (math.pi / 2, 0, 0)
        for k in range(3):
            caja(coll, f'tabla puerta redonda {k}', (-0.42 + k * 0.42, FY - 0.23, 1.25), (0.018, 0.02, 0.7 - abs(k - 1) * 0.12), VIGA(), p=12, sub=0)
        bola(coll, 'perilla', (0, FY - 0.28, 1.25), 0.08, metal('dorado', '#E5C574'), n=3)
    else:
        caja(coll, 'marco puerta', (0, FY - 0.05, 1.58), (0.8, 0.1, 1.3), m_marco, p=8)
        caja(coll, 'puerta', (0, FY - 0.18, 1.45), (0.64, 0.075, 1.04), m_puerta, p=8)
        for k in range(4):
            caja(coll, f'tabla puerta {k}', (-0.48 + k * 0.32, FY - 0.26, 1.42), (0.018, 0.02, 0.98), VIGA(), p=12, sub=0)
        caja(coll, 'travesaño puerta', (0, FY - 0.26, 1.1), (0.6, 0.02, 0.04), VIGA(), p=12, sub=0)
        bola(coll, 'perilla', (0.42, FY - 0.3, 1.42), 0.07, metal('dorado', '#E5C574'), n=3)
        if arco:
            o = clay.lathe('arco puerta', [(0.0, -0.05), (0.58, -0.05), (0.58, 0.05), (0.0, 0.05)], coll, VIDRIO(), segments=24, subsurf=0)
            o.location = (0, FY - 0.2, 2.5)
            o.rotation_euler = (math.pi / 2, 0, 0)
            o.scale = (1, 0.55, 1)
    if escalones:
        caja(coll, 'escalón', (0, FY - 0.52, 0.12), (1.125, 0.55, 0.1), piedra('escalón', piedra_esc), p=6)
        caja(coll, 'escalón bajo', (0, FY - 1.05, 0.055), (1.275, 0.325, 0.05), piedra('escalón', piedra_esc), p=6)


def farolito(coll, nombre, x, y, z, color='#FFD88A', brazo=True, marco='#3E4A57'):
    if brazo:
        tubo(coll, f'{nombre} brazo', [(x, y + 0.25, z + 0.35), (x, y - 0.05, z + 0.45), (x, y - 0.12, z + 0.3)], 0.025, metal('farol', marco))
    caja(coll, f'{nombre} techito', (x, y - 0.12, z + 0.28), (0.13, 0.13, 0.04), metal('farol', marco), p=6, sub=0)
    caja(coll, f'{nombre} vidrio', (x, y - 0.12, z + 0.1), (0.09, 0.09, 0.15), luz(f'farol {color}', color, 2.5), p=10, sub=0)
    caja(coll, f'{nombre} base', (x, y - 0.12, z - 0.07), (0.11, 0.11, 0.03), metal('farol', marco), p=6, sub=0)


def chimenea(coll, cx, cy, h, color='#E6D8B8', brasa=False, nieve=False):
    cubo(coll, 'chimenea', (cx, cy, h + 0.55), (0.45, 0.525, 1.35), piedra('chimenea', color), bisel=0.06)
    for k in range(8):
        caja(coll, f'ladrillo chimenea {k}', (cx + (0.2 if k % 2 else -0.2), cy - 0.54, h + 0.9 + k * 0.17), (0.17, 0.02, 0.06),
             piedra('ladrillo', aclarar(color, 0.85)), p=6, sub=0)
    caja(coll, 'sombrerete', (cx, cy, h + 1.97), (0.57, 0.6, 0.115), piedra('chimenea oscura', '#827E72'), p=6)
    caja(coll, 'boca chimenea', (cx, cy, h + 2.1), (0.3, 0.32, 0.04), luz('brasa', '#FF7A2E', 3.0) if brasa else mat('hollín', '#2B2422', 0.95), p=8, sub=0)
    if nieve:
        bola(coll, 'nieve chimenea', (cx, cy, h + 2.12), (0.6, 0.62, 0.14), NIEVE(), n=3)


def zocalo(coll, color='#ADA793', alto=0.42):
    cubo(coll, 'zócalo', (0, 0, alto / 2), ((W + 0.32) / 2, (D + 0.3) / 2, alto / 2), piedra('zócalo', color), bisel=0.06)
    for k in range(int(W / 0.55)):
        x = -W / 2 + 0.3 + k * 0.55
        caja(coll, f'piedra zócalo {k}', (x, FY - 0.16, alto * 0.48 + (k % 2) * 0.04), (0.24, 0.03, alto * 0.28 - (k % 3) * 0.015),
             piedra(f'piedra {k % 3}', (aclarar(color, 1.06), aclarar(color, 0.92), aclarar(color, 1.12))[k % 3]), p=4)


def paredes(coll, h, color, ruido=0.25, base=0.3):
    return cubo(coll, 'paredes', (0, 0, (h + base) / 2), (W / 2, D / 2, (h - base) / 2),
                mat(f'pared {color}', color, 0.85, noise=dict(scale=18, strength=ruido, distance=0.004)), bisel=0.05)


def piedras_fachada(coll, h, colores, z0=0.5, alto=0.36, cara='frente'):
    """Sillares sueltos en la fachada (o el costado +x), en hileras trabadas."""
    k = 0
    largo = W if cara == 'frente' else D
    fila = 0
    z = z0
    while z < h - 0.2:
        u = -largo / 2 + (0.0 if fila % 2 else 0.3)
        while u < largo / 2 - 0.15:
            ancho = float(RNG.uniform(0.42, 0.7))
            uu = min(u + ancho / 2, largo / 2 - 0.1)
            # Nada encima de la puerta ni de las ventanas
            libre = not (cara == 'frente' and (abs(uu) < 1.0 and z < 2.95 or abs(abs(uu) - W * 0.3) < 1.0 and 1.0 < z < 2.95))
            if libre:
                c = colores[k % len(colores)]
                pos = (uu, FY - 0.02, z) if cara == 'frente' else (W / 2 + 0.02, uu, z)
                half = (ancho / 2 - 0.03, 0.035, alto / 2 - 0.03) if cara == 'frente' else (0.035, ancho / 2 - 0.03, alto / 2 - 0.03)
                caja(coll, f'sillar {cara} {k}', pos, half, piedra(f'sillar {c}', c), p=4, sub=0)
                k += 1
            u += ancho
        z += alto
        fila += 1


def ventanas_casa(coll, detalle, z=2.0, ancho=1.2, jardinera=True, lado=True):
    for s in (-1, 1):
        ventana(coll, f'ventana {s}', s * W * 0.3, z, FY, ancho, detalle, jardinera=jardinera)
    if lado:
        for j in range(2):
            ventana(coll, f'ventana lado {j}', W / 2, z, -(1.55 + j * (D - 3) - D / 2), 1.0, detalle, cara='lado', jardinera=jardinera)


def rosal(coll, nombre, x, y, z0, alto, colores=('#E58FA6', '#F6F1E6', '#F2A5C0')):
    """Rosal trepador pegado a la pared (frente): grumos de hojas subiendo y rosas."""
    for k in range(int(alto / 0.35)):
        z = z0 + k * 0.35
        dx = math.sin(k * 1.7) * 0.18
        grumo(coll, f'{nombre} hojas {k}', (x + dx, y - 0.12, z), (0.26, 0.12, 0.22), (MUSGO, MUSGO2)[k % 2](), k * 1.3)
        if k % 2 == 0 or k == int(alto / 0.35) - 1:
            flor(coll, f'{nombre} rosa {k}', (x + dx + 0.1 * (-1) ** k, y - 0.26, z + 0.05), 0.09, colores[k % len(colores)], centro='#F2C94C', cara='y')


# ---------------------------------------------------------------- las casas

def m_casa_puerto(coll):
    """Palafito de tablas azules sobre pilotes, con red de pesca, boyas, salvavidas y remos."""
    h = 3.6
    tabla = madera('tabla azul', '#5B8FB9')
    tabla2 = madera('tabla azul oscura', '#4A7AA3')
    blanco = laca('marco blanco', '#F2EFE6', 0.5)
    # Plataforma sobre pilotes
    for sx in (-1, 0, 1):
        for sy in (-1, 1):
            clay.lathe(f'pilote {sx}{sy}', [(0.0, 0.0), (0.16, 0.0), (0.15, 0.62), (0.0, 0.64)], coll, madera('pilote', '#7A5236'), segments=10,
                       subsurf=0).location = (sx * (W / 2 - 0.1), sy * (D / 2 - 0.05), 0)
    for k in range(int((W + 0.6) / 0.42)):
        caja(coll, f'tabla piso {k}', (-W / 2 - 0.3 + 0.21 + k * 0.42, -0.3, 0.6), (0.2, D / 2 + 0.55, 0.05), madera('tabla piso', ('#A98058', '#9A7350')[k % 2]), p=8,
             sub=0)
    # Paredes de tablas horizontales
    cubo(coll, 'paredes', (0, 0, (h + 0.65) / 2), (W / 2, D / 2, (h - 0.65) / 2), tabla, bisel=0.05)
    z = 0.85
    k = 0
    while z < h - 0.1:
        caja(coll, f'tabla fachada {k}', (0, FY - 0.03, z), (W / 2 + 0.02, 0.035, 0.115), (tabla, tabla2)[k % 2], p=10, sub=0)
        caja(coll, f'tabla lado {k}', (W / 2 + 0.03, 0, z), (0.035, D / 2 + 0.02, 0.115), (tabla, tabla2)[k % 2], p=10, sub=0)
        z += 0.25
        k += 1
    for x in (-W / 2 + 0.06, W / 2 - 0.06):
        caja(coll, f'esquinero {x}', (x, FY - 0.07, (h + 0.65) / 2), (0.1, 0.1, (h - 0.65) / 2), blanco, p=8)
    caja(coll, 'esquinero lado', (W / 2 + 0.07, D / 2 - 0.08, (h + 0.65) / 2), (0.1, 0.1, (h - 0.65) / 2), blanco, p=8)
    caja(coll, 'viga alta', (0, FY - 0.08, h - 0.1), ((W + 0.12) / 2, 0.12, 0.1), blanco, p=8)
    # Baranda del muelle de enfrente
    for s in (-1, 1):
        for k in range(4):
            x = s * (1.6 + k * 0.75)
            caja(coll, f'balaustre {s}{k}', (x, FY - 0.78, 0.95), (0.04, 0.04, 0.32), blanco, p=10, sub=0)
        caja(coll, f'baranda {s}', (s * 2.75, FY - 0.78, 1.28), (1.25, 0.05, 0.04), blanco, p=10, sub=0)
    puerta(coll, laca('puerta turquesa', '#3FA0A0', 0.45), blanco, escalones=False)
    caja(coll, 'escalón muelle', (0, FY - 1.2, 0.32), (0.9, 0.3, 0.06), madera('tabla piso', '#A98058'), p=8)
    caja(coll, 'escalón muelle bajo', (0, FY - 1.55, 0.14), (0.9, 0.3, 0.06), madera('tabla piso', '#A98058'), p=8)
    ventanas_casa(coll, '#F2EFE6', z=2.2, jardinera=False)
    techo(coll, h, 1.6, '#C4553F')
    frontones(coll, h, 1.6, blanco, borde=blanco)
    ojo_buey(coll, h + 0.6, blanco)
    # Salvavidas, remos cruzados, red con boyas y farol
    o = clay.lathe('salvavidas', [(0.2, -0.05), (0.32, -0.07), (0.38, 0.0), (0.32, 0.07), (0.2, 0.05)], coll, laca('salvavidas', '#F2EFE6', 0.4),
                   segments=20, subsurf=0, cap_bottom=False, cap_top=False)
    o.location = (-1.55, FY - 0.1, 3.1)
    o.rotation_euler = (math.pi / 2, 0, 0)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        caja(coll, f'franja salvavidas {k}', (-1.55 + math.cos(a) * 0.3, FY - 0.16, 3.1 + math.sin(a) * 0.3), (0.06, 0.04, 0.06), laca('rojo', '#E4574B', 0.4),
             p=6, sub=0)
    for s in (-1, 1):
        o = caja(coll, f'remo {s}', (0, 0, 0), (0.04, 0.03, 0.85), madera('remo', '#C9956A'), p=10, sub=0)
        o.location = (1.55, FY - 0.12, 3.05)
        o.rotation_euler = (0, s * 0.6, 0)
        o = caja(coll, f'pala remo {s}', (0, 0, 0.8), (0.11, 0.025, 0.24), madera('remo', '#C9956A'), p=8, sub=0)
        o.location = (1.55, FY - 0.12, 3.05)
        o.rotation_euler = (0, s * 0.6, 0)
    # Red colgada en el costado
    x = W / 2 + 0.12
    for k in range(6):
        tubo(coll, f'red v {k}', [(x, -2.0 + k * 0.4, 3.0), (x, -2.0 + k * 0.4 + 0.08, 1.9 - abs(k - 2.5) * 0.12)], 0.012, mat('red', '#D9C8A0', 0.9), seg=4)
    for j in range(4):
        tubo(coll, f'red h {j}', [(x, -2.05, 2.85 - j * 0.28), (x + 0.03, -1.0, 2.7 - j * 0.3), (x, 0.05, 2.85 - j * 0.28)], 0.012, mat('red', '#D9C8A0', 0.9),
             seg=4)
    for k in range(4):
        bola(coll, f'boya {k}', (x + 0.05, -1.9 + k * 0.62, 1.85 - (k % 2) * 0.1), 0.11, laca('boya', ('#F28C45', '#F2EFE6')[k % 2], 0.4), n=3)
    farolito(coll, 'farol puerta', 1.05, FY, 2.45)
    # Nasas y un balde en la plataforma
    for k in range(2):
        clay.lathe(f'nasa {k}', [(0.0, 0.0), (0.22, 0.0), (0.26, 0.2), (0.18, 0.45), (0.08, 0.5)], coll, mat('mimbre', '#C9A46A', 0.9), segments=10,
                   subsurf=0).location = (-3.3 + k * 0.5, FY - 0.7, 0.65)


def m_casa_bruma(coll):
    """Cabaña del bosque de niebla: entramado, techo cubierto de musgo con hongos, hiedra y puerta redonda."""
    h = 3.5
    zocalo(coll, '#9A9585')
    paredes(coll, h, '#E6D7B8')
    for x in (-W / 2 + 0.06, W / 2 - 0.06):
        caja(coll, f'esquinero {x}', (x, FY - 0.04, h / 2), (0.1, 0.11, h / 2), VIGA(), p=8)
    caja(coll, 'viga alta', (0, FY - 0.07, h - 0.1), ((W + 0.12) / 2, 0.13, 0.11), VIGA(), p=8)
    caja(coll, 'franja', (0, FY - 0.07, 0.72), ((W + 0.12) / 2, 0.125, 0.12), laca('franja musgo', '#6B8A5A', 0.5), p=8)
    caja(coll, 'viga alta lado', (W / 2 + 0.07, 0, h - 0.1), (0.13, D / 2, 0.11), VIGA(), p=8)
    for s in (-1, 1):
        o = caja(coll, f'riostra {s}', (0, 0, 0), (0.06, 0.05, 0.85), VIGA(), p=10, sub=0)
        o.location = (W / 2 + 0.05, 0, 2.0)
        o.rotation_euler = (s * 0.62, 0, 0)
    puerta(coll, laca('puerta verde', '#4E7A45', 0.5), redonda=True, piedra_esc='#9A9585')
    ventanas_casa(coll, '#6B8A5A', z=2.05)
    techo(coll, h, 1.8, '#5F7A45', nombre='techo musgo')
    frontones(coll, h, 1.8, CREMA())
    ojo_buey(coll, h + 0.65)
    # Musgo encima del techo, colgando de los aleros, y hongos
    for s in (-1, 1):
        for k in range(7):
            y = -D / 2 - 0.2 + k * (D + 0.4) / 6
            t = float(RNG.uniform(0.25, 0.75))
            x = s * (W / 2 + 0.38) * t
            z = h + 1.8 * (1 - t) + 0.2
            grumo(coll, f'musgo techo {s}{k}', (x, y, z), (0.55, 0.5, 0.18), (MUSGO, MUSGO2)[k % 2](), k + s)
        for k in range(9):
            y = -D / 2 - 0.3 + k * (D + 0.6) / 8
            bola(coll, f'musgo alero {s}{k}', (s * (W / 2 + 0.45), y, h - 0.02), (0.14, 0.24, 0.16 + 0.06 * (k % 3)), (MUSGO, MUSGO2)[k % 2](), n=3, sub=0)
    for k, (x, y, z, r) in enumerate(((-1.3, -1.0, h + 1.35, 0.18), (1.7, 0.9, h + 0.95, 0.14), (2.2, -1.4, h + 0.7, 0.12))):
        cilindro(coll, f'pie hongo techo {k}', (x, y, z), r * 0.35, r * 1.1, mat('pie hongo', '#F0E6D2', 0.7), seg=8)
        bola(coll, f'sombrero hongo techo {k}', (x, y, z + r * 1.1), (r, r, r * 0.55), laca('hongo rojo', '#D9604E', 0.45), n=3)
        for j in range(3):
            bola(coll, f'punto hongo {k}{j}', (x + math.cos(j * 2.1) * r * 0.5, y + math.sin(j * 2.1) * r * 0.5, z + r * 1.45), r * 0.14, mat('punto', '#FFFFFF'), n=2,
                 sub=0)
    # Hiedra subiendo por las esquinas del frente
    for s in (-1, 1):
        for k in range(8):
            grumo(coll, f'hiedra {s}{k}', (s * (W / 2 - 0.2 - math.sin(k) * 0.2), FY - 0.14, 0.5 + k * 0.38), (0.22, 0.1, 0.2), (MUSGO, MUSGO2)[(k + s) % 2](),
                  k * 2 + s)
    # Hongos y helechos al pie
    for k, x in enumerate((-3.4, -2.6, 2.7, 3.5)):
        r = 0.16 + 0.05 * (k % 2)
        cilindro(coll, f'pie hongo {k}', (x, FY - 0.45, 0), r * 0.35, r * 1.3, mat('pie hongo', '#F0E6D2', 0.7), seg=8)
        bola(coll, f'sombrero hongo {k}', (x, FY - 0.45, r * 1.3), (r, r, r * 0.6), laca('hongo', ('#D9604E', '#C9A46A')[k % 2], 0.45), n=3)
    farolito(coll, 'farol puerta', 1.15, FY, 2.4)
    chimenea(coll, -W * 0.28, D / 2 - D * 0.33, h, '#B5AE98')


def m_casa_piedra(coll):
    """Casa minera de piedra con techo de pizarra, dintel de mina, farol de minero, pico y carretilla de mineral."""
    h = 3.5
    zocalo(coll, '#8A847A', alto=0.5)
    paredes(coll, h, '#A39C90', ruido=0.4)
    piedras_fachada(coll, h, ('#B3ACA0', '#9A9388', '#C2BBAE', '#8E887E'))
    piedras_fachada(coll, h, ('#B3ACA0', '#9A9388', '#C2BBAE'), cara='lado')
    # Dintel y jambas de madera de mina
    for s in (-1, 1):
        caja(coll, f'jamba {s}', (s * 0.95, FY - 0.12, 1.4), (0.13, 0.13, 1.4), madera('entibado', '#7A5236'), p=8)
    caja(coll, 'dintel', (0, FY - 0.14, 2.9), (1.25, 0.15, 0.14), madera('entibado', '#7A5236'), p=8)
    puerta(coll, laca('puerta mina', '#8A5A3C', 0.55), arco=False, piedra_esc='#8A847A')
    ventanas_casa(coll, '#5A6670', z=2.0)
    techo(coll, h, 1.5, '#5A6470', nombre='pizarra')
    frontones(coll, h, 1.5, piedra('frontón', '#A39C90'), borde=madera('entibado', '#7A5236'))
    ojo_buey(coll, h + 0.55, metal('aro', '#5A5F66'))
    # Farol de minero, pico, carretilla con mineral
    farolito(coll, 'farol mina', -1.1, FY - 0.05, 2.35, color='#FFC75A')
    o = caja(coll, 'mango pico', (0, 0, 0), (0.035, 0.035, 0.6), madera('mango', '#C9956A'), p=10, sub=0)
    o.location = (2.0, FY - 0.25, 0.65)
    o.rotation_euler = (0.25, 0.15, 0)
    o = tubo(coll, 'cabeza pico', [(-0.32, 0, 0.1), (0, 0, 0.18), (0.32, 0, 0.1)], 0.045, metal('pico', '#6E737A'))
    o.location = (2.0 + 0.09, FY - 0.25 - 0.15, 0.65 + 0.55)
    caja(coll, 'carretilla', (-3.0, FY - 0.9, 0.42), (0.45, 0.32, 0.18), madera('carretilla', '#8A5A3B'), p=8)
    for s in (-1, 1):
        o = clay.lathe(f'rueda carretilla {s}', [(0.0, -0.03), (0.16, -0.03), (0.16, 0.03), (0.0, 0.03)], coll, madera('rueda', '#5A3A28'), segments=12, subsurf=0)
        o.location = (-3.0 + s * 0.5, FY - 0.9, 0.17)
        o.rotation_euler = (0, math.pi / 2, 0)
    for k in range(6):
        bola(coll, f'mineral carretilla {k}', (-3.25 + (k % 3) * 0.24, FY - 0.98 + (k // 3) * 0.16, 0.66), 0.11,
             piedra('mineral', '#7A7268') if k % 2 else laca('veta', '#D9A441', 0.3), n=2, sub=0)
    chimenea(coll, W * 0.3, D / 2 - D * 0.33, h, '#8A847A')


def m_casa_brasa(coll):
    """Adobe terracota con esquinas redondas, cúpula de barro, chimenea encendida, vasijas y toldo."""
    h = 3.3
    barro = mat('adobe', '#D9855A', 0.9, noise=dict(scale=10, strength=0.35, distance=0.006))
    cubo(coll, 'paredes adobe', (0, 0, h / 2), (W / 2 - 0.15, D / 2 - 0.15, h / 2), barro, bisel=0.12)
    # Esquinas redondas de barro (contrafuertes)
    for sx in (-1, 1):
        for sy in (-1, 1):
            clay.lathe(f'esquina adobe {sx}{sy}', [(0.0, 0.0), (0.42, 0.0), (0.36, h * 0.6), (0.28, h + 0.1), (0.0, h + 0.12)], coll, barro, segments=14,
                       subsurf=1).location = (sx * (W / 2 - 0.2), sy * (D / 2 - 0.2), 0)
    caja(coll, 'franja adobe', (0, FY - 0.03, 0.35), (W / 2 + 0.05, 0.08, 0.32), mat('adobe oscuro', '#B5653F', 0.9), p=7)
    # Pretil, azotea y cúpula
    caja(coll, 'azotea', (0, 0, h + 0.05), (W / 2 - 0.1, D / 2 - 0.1, 0.08), mat('azotea', '#C4753F', 0.9), p=8, sub=0)
    for s in (-1, 1):
        caja(coll, f'pretil frente {s}', (0, s * (D / 2 - 0.05), h + 0.28), (W / 2 + 0.05, 0.14, 0.25), barro, p=7)
        caja(coll, f'pretil lado {s}', (s * (W / 2 - 0.05), 0, h + 0.28), (0.14, D / 2, 0.25), barro, p=7)
        for k in range(5):
            bola(coll, f'almena {s}{k}', (-W / 2 + 0.6 + k * (W - 1.2) / 4, s * (D / 2 - 0.05), h + 0.58), (0.2, 0.16, 0.12), barro, n=3, sub=0)
    o = clay.lathe('cúpula', [(0.0, 0.0), (1.75, 0.0), (1.72, 0.45), (1.5, 1.1), (1.0, 1.6), (0.4, 1.85), (0.0, 1.9)], coll,
                   mat('cúpula barro', '#C4753F', 0.85, noise=dict(scale=8, strength=0.3, distance=0.005)), segments=24, subsurf=1)
    o.location = (-0.9, 0.4, h + 0.1)
    bola(coll, 'remate cúpula', (-0.9, 0.4, h + 2.05), 0.18, laca('remate', '#F2C94C', 0.3), n=3)
    for k in range(8):
        a = k * math.pi / 4
        caja(coll, f'nervio cúpula {k}', (-0.9 + math.cos(a) * 1.6, 0.4 + math.sin(a) * 1.6, h + 0.45), (0.08, 0.08, 0.18), mat('adobe oscuro', '#B5653F', 0.9),
             p=6, sub=0)
    # Puerta en arco con su marco de barro, ventanas en arco con rejitas
    o = clay.lathe('arco puerta barro', [(0.0, -0.1), (1.0, -0.1), (1.0, 0.1), (0.0, 0.1)], coll, mat('adobe oscuro', '#B5653F', 0.9), segments=24, subsurf=0)
    o.location = (0, FY - 0.04, 2.3)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.scale = (1, 0.6, 1)
    puerta(coll, laca('puerta vino', '#8A3A2A', 0.5), m_marco=mat('adobe oscuro', '#B5653F', 0.9), arco=False, piedra_esc='#B5653F')
    for s in (-1, 1):
        x = s * W * 0.3
        caja(coll, f'hueco ventana {s}', (x, FY - 0.03, 1.95), (0.6, 0.06, 0.6), mat('sombra ventana', '#4A2A1E', 0.9), p=8, sub=0)
        o = clay.lathe(f'arco ventana {s}', [(0.0, -0.06), (0.6, -0.06), (0.6, 0.06), (0.0, 0.06)], coll, mat('sombra ventana', '#4A2A1E', 0.9), segments=20,
                       subsurf=0)
        o.location = (x, FY - 0.03, 2.55)
        o.rotation_euler = (math.pi / 2, 0, 0)
        o.scale = (1, 0.7, 1)
        for k in range(4):
            caja(coll, f'reja {s}{k}', (x - 0.39 + k * 0.26, FY - 0.1, 2.1), (0.025, 0.025, 0.7), metal('reja', '#3B2A22'), p=10, sub=0)
        caja(coll, f'alféizar {s}', (x, FY - 0.14, 1.32), (0.75, 0.16, 0.07), mat('adobe oscuro', '#B5653F', 0.9), p=6)
    # Toldo de rayas sobre la puerta
    for k in range(6):
        o = caja(coll, f'toldo {k}', (0, 0, 0), (0.135, 0.55, 0.03), tela('toldo', ('#E4574B', '#F2E2C4')[k % 2]), p=8, sub=0)
        o.location = (-0.675 + k * 0.27, FY - 0.6, 2.95)
        o.rotation_euler = (-0.35, 0, 0)
    # Chimenea encendida, vasijas y un cántaro
    chimenea(coll, W * 0.3, D / 2 - D * 0.33, h + 0.3, '#B5653F', brasa=True)
    for k, (x, y, s, c) in enumerate(((-2.2, FY - 0.6, 1.0, '#C4753F'), (-2.75, FY - 0.45, 0.75, '#E0A050'), (2.3, FY - 0.55, 0.9, '#B5653F'), (2.9, FY - 0.7, 0.6, '#E0A050'))):
        clay.lathe(f'vasija {k}', [(0.0, 0.0), (0.18 * s, 0.0), (0.3 * s, 0.25 * s), (0.26 * s, 0.5 * s), (0.14 * s, 0.62 * s), (0.17 * s, 0.7 * s), (0.0, 0.69 * s)],
                   coll, laca(f'vasija {c}', c, 0.5), segments=16, subsurf=1).location = (x, y, 0)
    for k in range(3):
        bola(coll, f'brasa suelo {k}', (2.6 + k * 0.15, FY - 1.0, 0.05), 0.07, luz('brasa', '#FF7A2E', 2.0), n=2, sub=0)


def m_casa_nieve(coll):
    """Cabaña de troncos con techo empinado nevado, carámbanos, chimenea humeante y leña apilada."""
    h = 3.2
    zocalo(coll, '#9AA3AD', alto=0.4)
    tronco_m = madera('tronco cabaña', '#8A5A3C')
    tronco_m2 = madera('tronco cabaña claro', '#9A6A48')
    cubo(coll, 'paredes', (0, 0, (h + 0.4) / 2), (W / 2 - 0.1, D / 2 - 0.1, (h - 0.4) / 2), tronco_m, bisel=0.05)
    z = 0.58
    k = 0
    while z < h:
        for nombre, largo, pos, rot in (('frente', W + 0.5, (0, FY + 0.05, z), (0, math.pi / 2, 0)), ('atrás', W + 0.5, (0, D / 2 - 0.05, z), (0, math.pi / 2, 0)),
                                        ('lado', D + 0.5, (W / 2 - 0.05, 0, z), (math.pi / 2, 0, 0)), ('lado2', D + 0.5, (-W / 2 + 0.05, 0, z), (math.pi / 2, 0, 0))):
            if nombre == 'frente' and abs(0) < 1 and z < 2.85:
                # Dos tramos a los lados de la puerta
                for s in (-1, 1):
                    o = clay.lathe(f'tronco {nombre} {k}{s}', [(0.0, -1.7), (0.17, -1.7), (0.17, 1.7), (0.0, 1.7)], coll, (tronco_m, tronco_m2)[k % 2], segments=10,
                                   subsurf=0)
                    o.location = (s * 2.6, pos[1], z)
                    o.rotation_euler = rot
                continue
            o = clay.lathe(f'tronco {nombre} {k}', [(0.0, -largo / 2), (0.17, -largo / 2), (0.17, largo / 2), (0.0, largo / 2)], coll, (tronco_m, tronco_m2)[k % 2],
                           segments=10, subsurf=0)
            o.location = pos
            o.rotation_euler = rot
        for sx in (-1, 1):
            o = clay.lathe(f'corte tronco {k}{sx}', [(0.0, -0.01), (0.15, -0.01), (0.15, 0.01), (0.0, 0.01)], coll, madera('corte', '#E0B98A'), segments=10, subsurf=0)
            o.location = (sx * (W / 2 + 0.25), FY + 0.05, z)
            o.rotation_euler = (0, math.pi / 2, 0)
        z += 0.34
        k += 1
    puerta(coll, laca('puerta roja', '#B5453B', 0.5), piedra_esc='#9AA3AD')
    ventanas_casa(coll, '#4F79A8', z=1.95)
    pico = 2.6
    span, pend = techo(coll, h, pico, '#6B4A33', vuelo=0.5, nombre='techo cabaña')
    frontones(coll, h, pico, madera('frontón', '#9A6A48'))
    ojo_buey(coll, h + 0.85)
    # Manto de nieve sobre cada agua del techo, con el borde redondo y carámbanos
    for s in (-1, 1):
        o = clay.rbox(f'nieve techo {s}', (0, 0, 0), (span / 2 + 0.05, (D + 1.0) / 2, 0.16), coll, NIEVE(), p=5, n=6, subsurf=1)
        o.location = (s * (W / 2 + 0.5) / 2 - s * 0.05, 0, h + pico / 2 + 0.22)
        o.rotation_euler = (0, s * pend, 0)
        for k in range(12):
            y = -D / 2 - 0.35 + k * (D + 0.7) / 11
            l = 0.18 + 0.2 * ((k * 7) % 5) / 4
            clay.lathe(f'carámbano {s}{k}', [(0.0, -l), (0.035, -l * 0.5), (0.05, 0.0), (0.0, 0.02)], coll, mat('hielo', '#DDEFFA', 0.15, coat=0.6), segments=6,
                       subsurf=0).location = (s * (W / 2 + 0.55), y, h - 0.05)
    chimenea(coll, W * 0.28, D / 2 - D * 0.33, h + 0.4, '#9AA3AD', nieve=True)
    # Montoncitos de nieve y leña apilada al costado
    for k, (x, y, r) in enumerate(((-3.6, FY - 0.7, 0.45), (3.4, FY - 0.9, 0.38), (-1.8, FY - 1.3, 0.25), (4.3, 1.5, 0.5))):
        bola(coll, f'montón nieve {k}', (x, y, 0.02), (r, r * 0.85, r * 0.4), NIEVE(), n=3)
    for j in range(3):
        for k in range(5 - j):
            o = clay.lathe(f'leña {j}{k}', [(0.0, -0.45), (0.12, -0.45), (0.12, 0.45), (0.0, 0.45)], coll, (tronco_m, tronco_m2)[(j + k) % 2], segments=8, subsurf=0)
            o.location = (W / 2 + 0.55, -1.2 + k * 0.25 + j * 0.12, 0.13 + j * 0.22)
            o.rotation_euler = (0, math.pi / 2, 0)
    farolito(coll, 'farol puerta', 1.15, FY, 2.4)


def m_casa_vigilia(coll):
    """Casa de frontera: base de piedra alta, piso de madera oscura, techo vino, estandarte, escudo y estacas."""
    h = 3.6
    zocalo(coll, '#8A8478', alto=0.5)
    cubo(coll, 'base piedra', (0, 0, 0.9), (W / 2, D / 2, 0.75), piedra('base vigilia', '#9A9386'), bisel=0.05)
    piedras_fachada(coll, 1.6, ('#ADA699', '#8E887E', '#B9B2A4'), z0=0.45, alto=0.38)
    cubo(coll, 'paredes', (0, 0, (h + 1.6) / 2), (W / 2 - 0.05, D / 2 - 0.05, (h - 1.6) / 2), madera('pared vigilia', '#6B4A3A'), bisel=0.05)
    for k in range(int(W / 0.4)):
        x = -W / 2 + 0.2 + k * 0.4
        if abs(x) < 0.9:
            continue
        caja(coll, f'tabla vertical {k}', (x, FY - 0.0, (h + 1.6) / 2), (0.17, 0.03, (h - 1.6) / 2), madera('tabla vigilia', ('#5A3E30', '#6B4A3A')[k % 2]), p=10, sub=0)
    caja(coll, 'viga cintura', (0, FY - 0.06, 1.65), ((W + 0.15) / 2, 0.12, 0.1), VIGA(), p=8)
    puerta(coll, laca('puerta vino', '#5A2A2A', 0.5), arco=False, piedra_esc='#8A8478')
    ventanas_casa(coll, '#6B2A32', z=2.35, ancho=1.0, jardinera=False)
    techo(coll, h, 1.7, '#7A2A32', nombre='techo vino')
    frontones(coll, h, 1.7, madera('frontón vigilia', '#5A3E30'))
    # Escudo sobre la puerta: lágrima dorada con la estrella de los Amantes
    o = clay.lathe('escudo', [(0.0, -0.05), (0.42, -0.05), (0.42, 0.05), (0.0, 0.05)], coll, laca('escudo', '#C9A14A', 0.35), segments=20, subsurf=0)
    o.location = (0, FY - 0.12, h + 0.55)
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.scale = (1, 1.2, 1)
    bola(coll, 'estrella escudo', (0, FY - 0.2, h + 0.55), (0.14, 0.04, 0.14), laca('estrella', '#F6F2EA', 0.3), n=2, sub=0)
    # Estandarte en su asta, al lado de la puerta
    cilindro(coll, 'asta', (-1.5, FY - 0.6, 0), 0.05, 3.6, madera('asta', '#5A3E30'), seg=8)
    bola(coll, 'punta asta', (-1.5, FY - 0.6, 3.65), 0.09, metal('dorado', '#E5C574'), n=2)
    caja(coll, 'travesaño estandarte', (-1.15, FY - 0.6, 3.35), (0.4, 0.03, 0.03), madera('asta', '#5A3E30'), p=10, sub=0)
    caja(coll, 'estandarte', (-1.15, FY - 0.62, 2.65), (0.36, 0.02, 0.68), tela('estandarte', '#6B2A32'), p=8, sub=0)
    bola(coll, 'emblema estandarte', (-1.15, FY - 0.66, 2.8), (0.16, 0.02, 0.16), laca('emblema', '#E5C574', 0.35), n=2, sub=0)
    for k in range(3):
        o = caja(coll, f'fleco {k}', (0, 0, 0), (0.1, 0.02, 0.12), tela('estandarte', '#6B2A32'), p=8, sub=0)
        o.location = (-1.39 + k * 0.24, FY - 0.62, 1.88)
        o.rotation_euler = (0, math.pi / 4, 0)
    # Estacas de empalizada al costado y antorcha
    for k in range(6):
        y = -2.4 + k * 0.85
        clay.lathe(f'estaca {k}', [(0.0, 0.0), (0.13, 0.0), (0.13, 1.3 + (k % 2) * 0.2), (0.0, 1.65 + (k % 2) * 0.2)], coll, madera('estaca', '#7A5A44'), segments=7,
                   subsurf=0).location = (W / 2 + 0.6, y, 0)
    cilindro(coll, 'antorcha', (1.4, FY - 0.25, 1.9), 0.04, 0.5, madera('antorcha', '#5A3E30'), seg=6)
    clay.blob('llama antorcha', (1.4, FY - 0.25, 2.5), (0.1, 0.1, 0.2), coll, luz('llama', '#FFB347', 4.0), n=3, p=1.6)
    chimenea(coll, -W * 0.3, D / 2 - D * 0.33, h, '#8A8478')


def m_casa_verdia(coll):
    """Casita pastel de Verdia: rosales trepadores, puerta en arco, faroles de alma y techo lila."""
    h = 3.5
    zocalo(coll, '#E8E2DA')
    paredes(coll, h, '#F4D7E2', ruido=0.15)
    blanco = laca('marco blanco', '#FBF6F0', 0.5)
    for x in (-W / 2 + 0.06, W / 2 - 0.06):
        caja(coll, f'esquinero {x}', (x, FY - 0.04, h / 2), (0.1, 0.11, h / 2), blanco, p=8)
    caja(coll, 'viga alta', (0, FY - 0.07, h - 0.1), ((W + 0.12) / 2, 0.13, 0.11), blanco, p=8)
    caja(coll, 'franja', (0, FY - 0.07, 0.72), ((W + 0.12) / 2, 0.125, 0.12), laca('franja menta', '#A8CDA0', 0.5), p=8)
    puerta(coll, laca('puerta menta', '#7FB89A', 0.45), blanco, piedra_esc='#E8E2DA')
    ventanas_casa(coll, '#C9B6EA', z=2.0)
    techo(coll, h, 1.75, '#B8A5CC', nombre='techo lila')
    frontones(coll, h, 1.75, blanco, borde=blanco)
    # Corazón de vitral en el frontón
    o = clay.lathe('vitral', [(0.0, -0.04), (0.34, -0.04), (0.34, 0.04), (0.0, 0.04)], coll, luz('vitral', '#F7C6D9', 0.8), segments=20, subsurf=0)
    o.location = (0, FY - 0.1, h + 0.65)
    o.rotation_euler = (math.pi / 2, 0, 0)
    a = clay.lathe('aro vitral', [(0.33, -0.06), (0.4, 0.0), (0.33, 0.06)], coll, blanco, segments=20, subsurf=0, cap_bottom=False, cap_top=False)
    a.location = (0, FY - 0.12, h + 0.65)
    a.rotation_euler = (math.pi / 2, 0, 0)
    # Rosales trepando por las esquinas y por el marco de la puerta
    for s in (-1, 1):
        rosal(coll, f'rosal esquina {s}', s * (W / 2 - 0.25), FY, 0.45, 3.2)
        rosal(coll, f'rosal puerta {s}', s * 1.0, FY - 0.12, 0.35, 2.6, colores=('#F6F1E6', '#F2A5C0'))
    for k in range(5):
        x = -0.8 + k * 0.4
        grumo(coll, f'rosal dintel {k}', (x, FY - 0.25, 2.98 + math.sin(k * 1.4) * 0.06), (0.26, 0.13, 0.17), (MUSGO, MUSGO2)[k % 2](), k)
        if k % 2 == 0:
            flor(coll, f'rosa dintel {k}', (x, FY - 0.4, 3.0), 0.1, ('#E58FA6', '#F6F1E6', '#F2A5C0')[k % 3], centro='#F2C94C', cara='y')
    # Faroles de alma a los lados de la puerta (luz suave crema)
    for s in (-1, 1):
        cilindro(coll, f'poste farol alma {s}', (s * 1.9, FY - 0.9, 0), 0.045, 1.25, blanco, seg=8)
        clay.blob(f'farol alma {s}', (s * 1.9, FY - 0.9, 1.42), (0.15, 0.15, 0.2), coll, luz('alma', '#FFF1D6', 2.2), n=4, p=2.0)
        bola(coll, f'sombrero farol alma {s}', (s * 1.9, FY - 0.9, 1.62), (0.18, 0.18, 0.06), blanco, n=3)
    chimenea(coll, W * 0.3, D / 2 - D * 0.33, h, '#F0E4E8')


def m_casa_senda(coll):
    """Casa lila de piedra con torrecita redonda de techo cónico e hilos con faroles colgando."""
    h = 3.4
    zocalo(coll, '#8A80A0')
    paredes(coll, h, '#B8A5CC', ruido=0.3)
    piedras_fachada(coll, h, ('#C9B9DA', '#A898BE', '#D6C9E4'))
    puerta(coll, laca('puerta morada', '#5D4F8A', 0.45), madera('marco senda', '#4A3A5A'), piedra_esc='#8A80A0')
    ventanas_casa(coll, '#5D4F8A', z=2.0, jardinera=False)
    techo(coll, h, 1.6, '#5D4F8A', nombre='techo morado')
    frontones(coll, h, 1.6, piedra('frontón senda', '#C9B9DA'), borde=madera('marco senda', '#4A3A5A'))
    ojo_buey(coll, h + 0.55, madera('marco senda', '#4A3A5A'))
    # Torrecita en la esquina del frente (+x)
    tx, ty = W / 2 - 0.2, FY + 0.4
    clay.lathe('torre', [(0.0, 0.0), (1.05, 0.0), (1.0, h + 1.2), (0.0, h + 1.2)], coll, piedra('torre senda', '#C9B9DA'), segments=20, subsurf=0).location = (tx, ty, 0)
    for k in range(6):
        a = k * math.pi / 3
        caja(coll, f'sillar torre {k}', (tx + math.cos(a) * 1.02, ty + math.sin(a) * 1.02, 0.6 + (k % 3) * 1.2), (0.25, 0.05, 0.16), piedra('sillar torre', '#A898BE'),
             p=4, sub=0)
    clay.lathe('techo torre', [(0.0, 0.0), (1.35, 0.0), (1.2, 0.2), (0.6, 1.3), (0.0, 2.1)], coll, laca('techo torre', '#4A3A6A', 0.5), segments=20,
               subsurf=1).location = (tx, ty, h + 1.15)
    bola(coll, 'perla torre', (tx, ty, h + 3.35), 0.13, luz('perla', '#C9A8FF', 1.6), n=3)
    o = caja(coll, 'ventana torre', (0, 0, 0), (0.25, 0.04, 0.4), luz('ventana torre', '#E8D8FF', 1.2), p=10, sub=0)
    o.location = (tx + math.cos(-2.2) * 1.02, ty + math.sin(-2.2) * 1.02, h + 0.4)
    o.rotation_euler = (0, 0, -2.2 + math.pi / 2)
    # Hilos con faroles de la torre a un poste
    cilindro(coll, 'poste hilos', (-3.2, FY - 1.0, 0), 0.06, 2.9, madera('marco senda', '#4A3A5A'), seg=8)
    bola(coll, 'perla poste', (-3.2, FY - 1.0, 2.95), 0.09, luz('perla', '#C9A8FF', 1.6), n=2)
    pts = [(-3.2, FY - 1.0, 2.8), (-1.6, FY - 1.0, 2.35), (0.6, FY - 0.95, 2.45), (tx - 0.8, ty - 0.9, 2.95)]
    tubo(coll, 'hilo', pts, 0.012, mat('hilo', '#E8DCF0', 0.6), seg=4)
    for k, t in enumerate((0.2, 0.42, 0.62, 0.82)):
        x = -3.2 + (tx - 0.8 + 3.2) * t
        z = 2.8 - 0.4 * math.sin(t * math.pi)
        tubo(coll, f'cordón farol {k}', [(x, FY - 0.98, z), (x, FY - 0.98, z - 0.25)], 0.008, mat('hilo', '#E8DCF0', 0.6), seg=3)
        clay.blob(f'farolillo {k}', (x, FY - 0.98, z - 0.38), (0.1, 0.1, 0.13), coll, luz('farolillo', ('#E8D8FF', '#FFE8C2')[k % 2], 2.0), n=3, p=2.0)


def m_casa_nox(coll):
    """Casa de contención: piedra azul noche, flejes de acero, cristales sellados que brillan y puerta remachada."""
    h = 3.5
    zocalo(coll, '#4A4E66', alto=0.5)
    paredes(coll, h, '#4A5088', ruido=0.35)
    piedras_fachada(coll, h, ('#565C96', '#454A80', '#6268A2'))
    acero = metal('acero nox', '#7D82A7')
    for z in (1.2, 2.95):
        caja(coll, f'fleje {z}', (0, FY - 0.08, z), ((W + 0.1) / 2, 0.06, 0.07), acero, p=10, sub=0)
        caja(coll, f'fleje lado {z}', (W / 2 + 0.08, 0, z), (0.06, D / 2, 0.07), acero, p=10, sub=0)
        for k in range(9):
            bola(coll, f'remache {z}{k}', (-W / 2 + 0.4 + k * (W - 0.8) / 8, FY - 0.15, z), 0.035, acero, n=2, sub=0)
    puerta(coll, metal('puerta nox', '#5A5F80'), acero, arco=False, piedra_esc='#4A4E66')
    # Sello redondo de la puerta
    o = clay.lathe('sello puerta', [(0.0, -0.03), (0.3, -0.03), (0.3, 0.03), (0.0, 0.03)], coll, luz('sello', '#9A7AE0', 1.4), segments=20, subsurf=0)
    o.location = (0, FY - 0.3, 1.55)
    o.rotation_euler = (math.pi / 2, 0, 0)
    a = clay.lathe('aro sello', [(0.29, -0.05), (0.36, 0.0), (0.29, 0.05)], coll, acero, segments=20, subsurf=0, cap_bottom=False, cap_top=False)
    a.location = (0, FY - 0.31, 1.55)
    a.rotation_euler = (math.pi / 2, 0, 0)
    for s in (-1, 1):
        x = s * W * 0.3
        caja(coll, f'ventana nox {s}', (x, FY - 0.05, 2.1), (0.45, 0.06, 0.5), luz('ventana nox', '#B9A8F0', 0.6), p=10, sub=0)
        for k in range(3):
            caja(coll, f'barrote {s}{k}', (x - 0.3 + k * 0.3, FY - 0.12, 2.1), (0.03, 0.03, 0.52), acero, p=10, sub=0)
        caja(coll, f'marco ventana nox {s}', (x, FY - 0.08, 2.65), (0.6, 0.08, 0.07), acero, p=10, sub=0)
        caja(coll, f'marco ventana nox b {s}', (x, FY - 0.08, 1.55), (0.6, 0.08, 0.07), acero, p=10, sub=0)
    techo(coll, h, 1.4, '#3A3656', nombre='techo nox')
    frontones(coll, h, 1.4, piedra('frontón nox', '#33385E'), borde=acero)
    # Cristales sellados en las esquinas
    for k, (x, y) in enumerate(((-W / 2 - 0.2, FY - 0.2), (W / 2 + 0.2, FY - 0.2), (W / 2 + 0.2, D / 2 + 0.1))):
        for j in range(3):
            hh = 0.8 + j * 0.35
            o = clay.lathe(f'cristal nox {k}{j}', [(0.0, 0.0), (0.16, 0.0), (0.17, hh * 0.7), (0.0, hh)], coll, luz('cristal nox', '#9A7AE0', 1.2), segments=6, subsurf=0)
            o.location = (x + math.cos(j * 2.1) * 0.15, y + math.sin(j * 2.1) * 0.15, 0)
            o.rotation_euler = (math.sin(j * 2.1) * 0.25, -math.cos(j * 2.1) * 0.25, 0)
        caja(coll, f'abrazadera {k}', (x, y, 0.4), (0.3, 0.3, 0.05), acero, p=8, sub=0)
    chimenea(coll, W * 0.3, D / 2 - D * 0.33, h, '#4A4E66')


def m_casa_orbita(coll):
    """Módulo espacial: casco cilíndrico blanco con franjas de acento, cúpula de vidrio, escotilla, ojos de buey,
    antena parabólica, panel solar y patas. El material «acento» lo tiñe el juego por región."""
    blanco = laca('casco', '#F2F4F7', 0.35)
    gris = metal('estructura', '#9AA3AD')
    acento = laca('acento', '#2F8F9A', 0.4)
    # Patas y plataforma
    for sx in (-1, 1):
        for sy in (-1, 1):
            tubo(coll, f'pata {sx}{sy}', [(sx * 2.6, sy * 1.6, 0.9), (sx * 3.4, sy * 2.4, 0.08)], 0.09, gris)
            clay.lathe(f'pie {sx}{sy}', [(0.0, 0.0), (0.35, 0.0), (0.3, 0.08), (0.0, 0.1)], coll, gris, segments=12, subsurf=0).location = (sx * 3.4, sy * 2.4, 0)
    caja(coll, 'plataforma', (0, 0, 0.55), (3.7, 2.6, 0.12), metal('plataforma', '#6E737A'), p=8)
    # Casco: cilindro tumbado a lo largo de x con tapas redondeadas
    r = 2.0
    o = clay.lathe('casco', [(0.0, -3.7), (1.2, -3.7), (r * 0.95, -3.45), (r, -3.0), (r, 3.0), (r * 0.95, 3.45), (1.2, 3.7), (0.0, 3.7)], coll, blanco, segments=28,
                   subsurf=1)
    o.location = (0, 0, 0.7 + r)
    o.rotation_euler = (0, math.pi / 2, 0)
    for x in (-2.6, 2.6):
        o = clay.lathe(f'franja {x}', [(r + 0.02, -0.18), (r + 0.06, -0.15), (r + 0.06, 0.15), (r + 0.02, 0.18)], coll, acento, segments=28, subsurf=0,
                       cap_bottom=False, cap_top=False)
        o.location = (x, 0, 0.7 + r)
        o.rotation_euler = (0, math.pi / 2, 0)
    for k in range(10):
        x = -3.3 + k * 0.73
        o = clay.lathe(f'costura {k}', [(r + 0.005, -0.015), (r + 0.02, 0.0), (r + 0.005, 0.015)], coll, gris, segments=28, subsurf=0, cap_bottom=False, cap_top=False)
        o.location = (x, 0, 0.7 + r)
        o.rotation_euler = (0, math.pi / 2, 0)
    # Cúpula de vidrio arriba
    clay.lathe('aro cúpula', [(1.25, 0.0), (1.4, 0.0), (1.4, 0.2), (1.25, 0.2)], coll, acento, segments=24, subsurf=0).location = (-0.6, 0, 0.7 + 2 * r - 0.25)
    clay.lathe('cúpula', [(0.0, 0.0), (1.28, 0.0), (1.2, 0.5), (0.9, 0.95), (0.45, 1.2), (0.0, 1.27)], coll, mat('cúpula vidrio', '#BFE3EC', 0.08, coat=0.8),
               segments=24, subsurf=1).location = (-0.6, 0, 0.7 + 2 * r - 0.05)
    for k in range(3):
        bola(coll, f'planta cúpula {k}', (-0.6 + (k - 1) * 0.45, (k % 2) * 0.3 - 0.15, 0.7 + 2 * r + 0.25), (0.3, 0.3, 0.35), (MUSGO, MUSGO2)[k % 2](), n=3)
    # Escotilla de la puerta en el frente (-y) con su marco y escalerilla
    fz = 0.7 + 1.35
    caja(coll, 'marco escotilla', (0, -r + 0.05, fz), (0.85, 0.25, 1.15), acento, p=6)
    caja(coll, 'escotilla', (0, -r - 0.12, fz - 0.05), (0.65, 0.08, 0.95), laca('escotilla', '#DDE3EA', 0.35), p=8)
    for k in range(2):
        caja(coll, f'franja escotilla {k}', (0, -r - 0.21, fz - 0.45 + k * 0.85), (0.6, 0.02, 0.05), acento, p=10, sub=0)
    o = clay.lathe('ventanita escotilla', [(0.0, -0.03), (0.2, -0.03), (0.2, 0.03), (0.0, 0.03)], coll, mat('vidrio', '#9ED8E8', 0.08, coat=0.8), segments=16,
                   subsurf=0)
    o.location = (0, -r - 0.22, fz + 0.3)
    o.rotation_euler = (math.pi / 2, 0, 0)
    bola(coll, 'manija escotilla', (0.45, -r - 0.24, fz - 0.05), (0.05, 0.05, 0.12), gris, n=2)
    for k in range(4):
        caja(coll, f'peldaño {k}', (0, -r - 0.55 - k * 0.22, 0.68 - k * 0.17), (0.6, 0.12, 0.035), gris, p=8, sub=0)
    for s in (-1, 1):
        tubo(coll, f'pasamanos {s}', [(s * 0.62, -r - 0.3, 1.6), (s * 0.62, -r - 1.15, 0.7), (s * 0.62, -r - 1.25, 0.05)], 0.03, gris)
    # Ojos de buey a los lados de la escotilla y en el costado
    for k, x in enumerate((-2.2, -1.3, 1.3, 2.2)):
        o = clay.lathe(f'ojo buey {k}', [(0.0, -0.03), (0.28, -0.03), (0.28, 0.03), (0.0, 0.03)], coll, luz('ojo buey', '#BDE8F2', 0.5), segments=18, subsurf=0)
        o.location = (x, -r * 0.94, 0.7 + r + 0.45)
        o.rotation_euler = (math.pi / 2 + 0.22, 0, 0)
        a = clay.lathe(f'aro ojo buey {k}', [(0.27, -0.05), (0.35, 0.0), (0.27, 0.05)], coll, gris, segments=18, subsurf=0, cap_bottom=False, cap_top=False)
        a.location = (x, -r * 0.95, 0.7 + r + 0.45)
        a.rotation_euler = (math.pi / 2 + 0.22, 0, 0)
    # Antena parabólica y panel solar
    cilindro(coll, 'mástil antena', (2.4, 0.6, 0.7 + 2 * r - 0.3), 0.06, 1.4, gris, seg=8)
    o = clay.lathe('plato antena', [(0.0, 0.0), (0.2, 0.02), (0.55, 0.15), (0.7, 0.3), (0.66, 0.31), (0.0, 0.06)], coll, laca('plato', '#F2F4F7', 0.35), segments=20,
                   subsurf=1)
    o.location = (2.4, 0.6, 0.7 + 2 * r + 1.1)
    o.rotation_euler = (0.6, 0, -0.5)
    bola(coll, 'luz antena', (2.4, 0.6, 0.7 + 2 * r + 1.15), 0.07, luz('luz roja', '#FF5A4A', 3.0), n=2)
    cilindro(coll, 'brazo panel', (-W / 2 - 0.2, 1.0, 0.6), 0.07, 2.3, gris, seg=8)
    o = caja(coll, 'panel solar', (0, 0, 0), (1.0, 0.7, 0.04), laca('panel solar', '#2C3E66', 0.25), p=10, sub=0)
    o.location = (-W / 2 - 0.2, 1.0, 3.0)
    o.rotation_euler = (0.5, 0, 0)
    for k in range(4):
        o = caja(coll, f'celda {k}', (-0.75 + k * 0.5, 0, 0.045), (0.015, 0.68, 0.01), gris, p=10, sub=0)
        o.location = (-W / 2 - 0.2, 1.0, 3.0)
        o.rotation_euler = (0.5, 0, 0)


# ---------------------------------------------------------------- recursos y utilería

def m_recurso_mineral(coll):
    """Afloramiento de roca con vetas y cristales (material «cristal», que el juego tiñe por región)."""
    roca = piedra('roca afloramiento', '#8E877D')
    clay.blob('roca base', (0, 0.1, 0.45), (0.95, 0.75, 0.55), coll, roca, n=4, subsurf=0, p=2.2)
    clay.blob('roca lado', (0.75, -0.2, 0.28), (0.45, 0.42, 0.34), coll, piedra('roca afloramiento clara', '#A39C90'), n=3, subsurf=0)
    clay.blob('roca lado b', (-0.7, -0.25, 0.22), (0.38, 0.36, 0.28), coll, piedra('roca afloramiento clara', '#A39C90'), n=3, subsurf=0)
    for i in range(6):
        a = -0.6 + i * 0.4
        hh = 0.5 + 0.35 * ((i * 5) % 3)
        o = clay.lathe(f'cristal {i}', [(0.0, 0.0), (0.13, 0.0), (0.14, hh * 0.7), (0.0, hh)], coll, mat('cristal', '#FFFFFF', 0.15), segments=6, subsurf=0)
        o.location = (math.sin(a) * 0.5, -0.25 + math.cos(a) * 0.15, 0.55 + 0.25 * math.cos(a * 2))
        o.rotation_euler = (-0.35 + 0.15 * i % 0.3, math.sin(a) * 0.6, i)
    for k in range(5):
        bola(coll, f'pepita {k}', (-0.9 + k * 0.45, -0.85 + (k % 2) * 0.12, 0.05), 0.08, mat('cristal', '#FFFFFF', 0.15), n=2, sub=0)
    # Pico apoyado y un balde de mineral
    o = caja(coll, 'mango pico', (0, 0, 0), (0.03, 0.03, 0.5), madera('mango', '#C9956A'), p=10, sub=0)
    o.location = (1.15, -0.55, 0.45)
    o.rotation_euler = (0.2, -0.45, 0)
    clay.lathe('balde mineral', [(0.0, 0.0), (0.16, 0.0), (0.2, 0.28), (0.0, 0.26)], coll, metal('balde', '#8D949C'), segments=12, subsurf=0).location = (-1.15, -0.6, 0)
    for k in range(3):
        bola(coll, f'mineral balde {k}', (-1.18 + (k - 1) * 0.08, -0.6, 0.3), 0.07, mat('cristal', '#FFFFFF', 0.15), n=2, sub=0)


def m_recurso_madera(coll):
    """Pila de troncos con tocón, hacha clavada y astillas."""
    m1 = madera('tronco pila', '#8A5A3C')
    m2 = madera('tronco pila claro', '#9A6A48')
    corte = madera('corte', '#E0B98A')
    for j in range(3):
        for k in range(4 - j):
            o = clay.lathe(f'tronco {j}{k}', [(0.0, -0.75), (0.17, -0.75), (0.17, 0.75), (0.0, 0.75)], coll, (m1, m2)[(j + k) % 2], segments=10, subsurf=0)
            o.location = (-0.2, -0.55 + k * 0.36 + j * 0.18, 0.17 + j * 0.3)
            o.rotation_euler = (0, math.pi / 2, 0)
            for s in (-1, 1):
                c = clay.lathe(f'corte {j}{k}{s}', [(0.0, -0.01), (0.155, -0.01), (0.155, 0.01), (0.0, 0.01)], coll, corte, segments=10, subsurf=0)
                c.location = (-0.2 + s * 0.76, -0.55 + k * 0.36 + j * 0.18, 0.17 + j * 0.3)
                c.rotation_euler = (0, math.pi / 2, 0)
    clay.lathe('tocón', [(0.0, 0.0), (0.42, 0.0), (0.33, 0.12), (0.3, 0.5), (0.0, 0.5)], coll, m1, segments=12, subsurf=0).location = (1.05, -0.2, 0)
    cilindro(coll, 'corte tocón', (1.05, -0.2, 0.5), 0.3, 0.02, corte, seg=12)
    o = caja(coll, 'mango hacha', (0, 0, 0), (0.025, 0.025, 0.36), madera('mango', '#C9956A'), p=10, sub=0)
    o.location = (1.0, -0.2, 0.82)
    o.rotation_euler = (0, 0.5, 0)
    o = caja(coll, 'hoja hacha', (0, 0, 0), (0.12, 0.02, 0.09), metal('hacha', '#8D949C'), p=8, sub=0)
    o.location = (1.12, -0.2, 0.55)
    o.rotation_euler = (0, 0.5, 0)
    for k in range(6):
        o = caja(coll, f'astilla {k}', (0, 0, 0), (0.08, 0.02, 0.012), corte, p=10, sub=0)
        o.location = (0.7 + (k % 3) * 0.25, -0.75 + (k // 3) * 0.2, 0.012)
        o.rotation_euler = (0, 0, k * 1.1)
    grumo(coll, 'musgo tronco', (-0.2, 0.0, 0.92), (0.4, 0.35, 0.08), MUSGO(), 3)


def m_recurso_semilla(coll):
    """Cantero elevado con brotes en hilera, costal de semillas abierto y regadera."""
    tabla = madera('cantero', '#9A6A48')
    for s in (-1, 1):
        caja(coll, f'tabla larga {s}', (0, s * 0.45, 0.2), (0.85, 0.05, 0.2), tabla, p=8)
        caja(coll, f'tabla corta {s}', (s * 0.85, 0, 0.2), (0.05, 0.5, 0.2), tabla, p=8)
    caja(coll, 'tierra', (0, 0, 0.35), (0.8, 0.4, 0.05), mat('tierra', '#6B4A33', 0.95), p=6, sub=0)
    for i in range(5):
        for j in range(2):
            x, y = -0.6 + i * 0.3, -0.18 + j * 0.36
            tubo(coll, f'tallo {i}{j}', [(x, y, 0.38), (x, y, 0.52)], 0.012, mat('tallo', '#5FA85A', 0.6), seg=4)
            for s in (-1, 1):
                bola(coll, f'hoja {i}{j}{s}', (x + s * 0.05, y, 0.55), (0.06, 0.03, 0.02), mat('hoja brote', '#7FC86A', 0.55), n=2, sub=0)
    # Costal de semillas
    clay.blob('costal', (1.25, -0.15, 0.32), (0.3, 0.28, 0.34), coll, tela('costal', '#D9C29A'), n=4, p=2.2)
    clay.lathe('boca costal', [(0.0, 0.0), (0.2, 0.0), (0.24, 0.08), (0.0, 0.06)], coll, tela('costal', '#D9C29A'), segments=12, subsurf=0).location = (1.25, -0.15, 0.6)
    for k in range(10):
        a = k * 2.4
        bola(coll, f'semilla {k}', (1.25 + math.cos(a) * 0.1 * (k % 3) / 2, -0.15 + math.sin(a) * 0.1 * (k % 3) / 2, 0.66), 0.035, mat('semilla', '#C9A46A', 0.6), n=2,
             sub=0)
    caja(coll, 'cuerda costal', (1.25, -0.15, 0.55), (0.25, 0.25, 0.02), mat('cuerda', '#8A6A4A', 0.8), p=12, sub=0)
    # Regadera
    clay.lathe('regadera', [(0.0, 0.0), (0.16, 0.0), (0.16, 0.28), (0.0, 0.3)], coll, laca('regadera', '#4FC1C6', 0.35), segments=14, subsurf=0).location = (-1.25, -0.3, 0)
    tubo(coll, 'pico regadera', [(-1.12, -0.3, 0.12), (-0.92, -0.3, 0.3), (-0.82, -0.3, 0.35)], 0.03, laca('regadera', '#4FC1C6', 0.35))
    tubo(coll, 'asa regadera', [(-1.38, -0.3, 0.25), (-1.3, -0.3, 0.42), (-1.15, -0.3, 0.3)], 0.022, laca('regadera', '#4FC1C6', 0.35))


def m_recurso_fauna(coll):
    """Puesto de observación: caseta de madera con techito, catalejo en trípode, comedero y casita de pájaros."""
    tabla = madera('caseta', '#8A6A4A')
    caja(coll, 'piso caseta', (0, 0.3, 0.1), (0.75, 0.55, 0.06), tabla, p=8)
    caja(coll, 'pared caseta', (0, 0.75, 0.6), (0.75, 0.06, 0.55), tabla, p=8)
    for s in (-1, 1):
        caja(coll, f'lado caseta {s}', (s * 0.72, 0.4, 0.6), (0.05, 0.4, 0.55), tabla, p=8)
    o = caja(coll, 'techo caseta', (0, 0, 0), (0.9, 0.62, 0.05), laca('techo caseta', '#5F7A45', 0.5), p=8)
    o.location = (0, 0.35, 1.25)
    o.rotation_euler = (0.28, 0, 0)
    for k in range(3):
        grumo(coll, f'ramitas caseta {k}', (-0.5 + k * 0.5, 0.45, 1.36), (0.3, 0.26, 0.1), (MUSGO, MUSGO2)[k % 2](), k)
    # Catalejo en trípode
    for k in range(3):
        a = k * 2 * math.pi / 3
        tubo(coll, f'pata trípode {k}', [(0.0, -0.35, 0.95), (math.cos(a) * 0.3, -0.35 + math.sin(a) * 0.3, 0.0)], 0.02, madera('trípode', '#5A3A28'))
    o = clay.lathe('catalejo', [(0.0, -0.3), (0.05, -0.3), (0.05, 0.0), (0.07, 0.02), (0.07, 0.3), (0.08, 0.32), (0.0, 0.32)], coll, metal('catalejo', '#C9A14A'),
                   segments=12, subsurf=0)
    o.location = (0, -0.35, 1.0)
    o.rotation_euler = (math.pi / 2 - 0.35, 0, 0.4)
    # Comedero colgado y casita de pájaros en poste
    cilindro(coll, 'poste casita', (-1.15, -0.2, 0), 0.04, 1.25, madera('poste', '#7A5236'), seg=8)
    caja(coll, 'casita pájaros', (-1.15, -0.2, 1.4), (0.18, 0.16, 0.16), laca('casita', '#E3A066', 0.5), p=8)
    for s in (-1, 1):
        o = caja(coll, f'techo casita {s}', (0, 0, 0), (0.15, 0.2, 0.02), laca('techo casita', '#B5453B', 0.5), p=8, sub=0)
        o.location = (-1.15 + s * 0.1, -0.2, 1.62)
        o.rotation_euler = (0, s * 0.7, 0)
    o = clay.lathe('hoyo casita', [(0.0, -0.01), (0.05, -0.01), (0.05, 0.01), (0.0, 0.01)], coll, mat('hoyo', '#2B2422', 0.9), segments=10, subsurf=0)
    o.location = (-1.15, -0.37, 1.42)
    o.rotation_euler = (math.pi / 2, 0, 0)
    # Pajarito en el techo de la casita
    bola(coll, 'pájaro', (-1.15, -0.2, 1.78), (0.08, 0.06, 0.065), tela('pájaro', '#5A9BD5'), n=3)
    bola(coll, 'cabeza pájaro', (-1.15, -0.27, 1.85), 0.045, tela('pájaro', '#5A9BD5'), n=3)
    bola(coll, 'pico pájaro', (-1.15, -0.32, 1.85), (0.015, 0.025, 0.012), mat('pico', '#F2C94C'), n=2, sub=0)
    clay.lathe('comedero', [(0.0, 0.0), (0.2, 0.0), (0.24, 0.06), (0.0, 0.05)], coll, madera('comedero', '#C9956A'), segments=12, subsurf=0).location = (1.1, -0.3, 0.75)
    cilindro(coll, 'poste comedero', (1.1, -0.3, 0), 0.035, 0.75, madera('poste', '#7A5236'), seg=8)
    for k in range(6):
        bola(coll, f'grano {k}', (1.1 + math.cos(k) * 0.1, -0.3 + math.sin(k) * 0.1, 0.81), 0.025, mat('semilla', '#C9A46A', 0.6), n=2, sub=0)
    # Huellitas en el suelo
    for k in range(4):
        bola(coll, f'huella {k}', (0.4 + k * 0.22, -0.9 + (k % 2) * 0.12, 0.005), (0.05, 0.06, 0.006), mat('huella', '#6B5A44', 0.95), n=2, sub=0)


def m_letrero_nombre(coll):
    """Poste con un tablero colgado (el nombre lo pinta el juego en el tablero: 1,5 × 0,42 a 1,55 m de alto)."""
    m = madera('poste letrero', '#7A5236')
    for s in (-1, 1):
        cilindro(coll, f'poste {s}', (s * 0.85, 0, 0), 0.06, 2.0, m, seg=8)
        bola(coll, f'remate {s}', (s * 0.85, 0, 2.05), 0.08, m, n=2)
        clay.blob(f'piedra pie {s}', (s * 0.85, 0, 0.06), (0.2, 0.18, 0.1), coll, piedra('pie', '#A9A596'), n=3, subsurf=0)
    caja(coll, 'travesaño', (0, 0, 1.9), (0.95, 0.05, 0.05), m, p=8)
    for s in (-1, 1):
        tubo(coll, f'cadena {s}', [(s * 0.6, 0, 1.86), (s * 0.6, 0, 1.78)], 0.012, metal('cadena', '#5D5A58'), seg=4)
    caja(coll, 'tablero', (0, 0, 1.55), (0.78, 0.04, 0.24), madera('tablero', '#C6AE82'), p=8)
    for k in range(4):
        flor(coll, f'flor pie {k}', ((k - 1.5) * 0.35, -0.15, 0.08), 0.06, ('#F4A7B9', '#F7D55A', '#FFFFFF', '#C9A3E0')[k], centro='#F2C94C')


def m_archivo_publico(coll):
    """Archivo público: atril con techito, tablón de avisos con papeles y cajón de expedientes."""
    m = madera('archivo', '#8A5A3B')
    for s in (-1, 1):
        cilindro(coll, f'poste techito {s}', (s * 1.0, 0.35, 0), 0.07, 2.35, m, seg=8)
    o = caja(coll, 'techito', (0, 0, 0), (1.25, 0.6, 0.05), laca('techito archivo', '#7D8399', 0.5), p=8)
    o.location = (0, 0.25, 2.45)
    o.rotation_euler = (0.2, 0, 0)
    caja(coll, 'tablón', (0, 0.4, 1.45), (0.95, 0.05, 0.6), madera('tablón', '#C6AE82'), p=8)
    for k, (x, z, c) in enumerate(((-0.6, 1.7, '#F6F1E6'), (-0.15, 1.6, '#F2E2C4'), (0.35, 1.75, '#F6F1E6'), (0.65, 1.35, '#E8F0F7'), (-0.4, 1.2, '#F7E6A8'),
                                   (0.15, 1.15, '#F6F1E6'))):
        o = caja(coll, f'papel {k}', (0, 0, 0), (0.16, 0.01, 0.2), mat(f'papel {c}', c, 0.8), p=12, sub=0)
        o.location = (x, 0.34, z)
        o.rotation_euler = (0, (k % 3 - 1) * 0.08, 0)
        bola(coll, f'chinche {k}', (x, 0.32, z + 0.16), 0.025, laca('chinche', ('#E4574B', '#4F79A8', '#F7C948')[k % 3], 0.3), n=2, sub=0)
    # Atril con libro abierto
    cilindro(coll, 'pie atril', (0, -0.45, 0), 0.06, 1.0, m, seg=8)
    o = caja(coll, 'atril', (0, 0, 0), (0.42, 0.28, 0.03), m, p=8)
    o.location = (0, -0.45, 1.08)
    o.rotation_euler = (-0.45, 0, 0)
    for s in (-1, 1):
        o = caja(coll, f'hoja libro {s}', (s * 0.19, 0, 0.035), (0.18, 0.24, 0.012), mat('hoja libro', '#F6F1E6', 0.8), p=12, sub=0)
        o.location = (0, -0.45, 1.08)
        o.rotation_euler = (-0.45, s * 0.08, 0)
    # Cajón de expedientes y farolito
    caja(coll, 'cajón', (0.85, -0.2, 0.3), (0.3, 0.25, 0.3), madera('cajón', '#9A6A48'), p=8)
    for k in range(2):
        caja(coll, f'frente cajón {k}', (0.85, -0.46, 0.18 + k * 0.26), (0.25, 0.02, 0.1), madera('frente cajón', '#B98E62'), p=8, sub=0)
        bola(coll, f'tirador {k}', (0.85, -0.49, 0.18 + k * 0.26), 0.025, metal('dorado', '#E5C574'), n=2, sub=0)
    farolito(coll, 'farol archivo', -1.0, 0.35 - 0.1, 1.95, brazo=False)


def m_puerta_combate(coll):
    """Arco de piedra de la zona de combate con espadas cruzadas y dos antorchas (el nombre va en el tablero)."""
    roca = piedra('arco combate', '#8E887E')
    for s in (-1, 1):
        for k in range(5):
            caja(coll, f'sillar {s}{k}', (s * 1.55, 0, 0.3 + k * 0.55), (0.32 - (k % 2) * 0.03, 0.32, 0.26), (roca, piedra('arco combate claro', '#A39C90'))[k % 2], p=4)
    # Dovelas en semicírculo sobre los pilares, con la clave más grande
    for k in range(9):
        a = math.pi * k / 8
        o = caja(coll, f'dovela {k}', (0, 0, 0), (0.3, 0.33, 0.2 if k != 4 else 0.26), (roca, piedra('arco combate claro', '#A39C90'))[k % 2], p=4)
        o.location = (math.cos(a) * 1.55, 0, 2.75 + math.sin(a) * 1.55 * 0.8)
        o.rotation_euler = (0, -a + math.pi / 2, 0)
    caja(coll, 'tablero combate', (0, -0.36, 2.45), (0.78, 0.04, 0.22), madera('tablero', '#C6AE82'), p=8)
    for s in (-1, 1):
        o = caja(coll, f'hoja espada {s}', (0, 0, 0.35), (0.04, 0.012, 0.42), metal('espada', '#C9CED6'), p=10, sub=0)
        o.location = (0, -0.38, 3.2)
        o.rotation_euler = (0, s * 0.7, 0)
        o = caja(coll, f'guarda espada {s}', (0, 0, -0.08), (0.16, 0.025, 0.025), metal('dorado', '#E5C574'), p=10, sub=0)
        o.location = (0, -0.38, 3.2)
        o.rotation_euler = (0, s * 0.7, 0)
        o = caja(coll, f'puño espada {s}', (0, 0, -0.2), (0.025, 0.025, 0.1), madera('puño', '#5A3A28'), p=10, sub=0)
        o.location = (0, -0.38, 3.2)
        o.rotation_euler = (0, s * 0.7, 0)
    bola(coll, 'escudo centro', (0, -0.42, 3.2), (0.22, 0.05, 0.26), laca('escudo combate', '#B5453B', 0.4), n=3)
    for s in (-1, 1):
        cilindro(coll, f'antorcha {s}', (s * 1.55, -0.4, 1.7), 0.045, 0.55, madera('antorcha', '#5A3E30'), seg=6)
        clay.blob(f'llama {s}', (s * 1.55, -0.4, 2.38), (0.11, 0.11, 0.22), coll, luz('llama', '#FFB347', 4.0), n=3, p=1.6)
        clay.blob(f'llama centro {s}', (s * 1.55, -0.42, 2.32), (0.06, 0.06, 0.13), coll, luz('llama clara', '#FFF1B1', 4.0), n=3, p=1.6)


PIEZAS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('m_') and callable(v) and v.__module__ == __name__}


def main(out, claves=None):
    os.makedirs(out, exist_ok=True)
    clay.reset_scene()
    coll = clay.collection('Astra granja')
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
    exportar_glb.exportar(objs, os.path.join(out, 'granja_astra.glb'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    main(args[0], args[1].split(',') if len(args) > 1 else None)
