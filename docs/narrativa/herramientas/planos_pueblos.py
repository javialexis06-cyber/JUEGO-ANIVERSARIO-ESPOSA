"""El plano de cada pueblo de Astra (fuera del Pueblo del Sol, que conserva el suyo).

Un pueblo de verdad, como el primero: calle principal de este a oeste (las rutas salen por sus extremos), calle de
norte a sur, plaza redonda con su monumento en el centro, las casas al norte mirando a la calle, los puestos de oficio
de cada habitante al sur (allí trabaja de día), el archivo al fondo de la plaza, los recursos en las afueras y la
entrada de combate en una esquina. Solo cambia dónde quedan las cosas: los IDs son los mismos de siempre.

Coordenadas del juego: x hacia el este, z hacia el sur (hacia la cámara). La zona caminable es |x| < LX, |z| < LZ.
"""
import math

LX, LZ = 52, 38
PLAZA = {'x': 0, 'z': 0, 'r': 7.5}
INICIO = {'x': 0, 'z': 9}
ARCHIVO = {'x': 0, 'z': -9.6}
COMBATE = {'x': 38, 'z': 24}
# Casas: borde de arriba a la izquierda (x, z) de una huella de 8 × 6, la puerta hacia la calle (+z)
CASAS_X = [-18, 10, -30, 22, -42, 34, -18, 10]
CASAS_Z = [-12, -12, -12, -12, -12, -12, -24, -24]
# Puestos de oficio al sur de la calle (mirando al norte); el habitante trabaja parado entre el puesto y la calle
PUESTOS_X = [-9.5, 9.5, -14.5, 14.5, -19.5, 19.5, -24.5, 24.5, -29.5, 29.5, -34.5, 34.5, -39.5, 39.5, -44.5, 44.5]
PUESTO_Z = 6.6
RECURSOS_X = [-30, -12, 12, 30]
RECURSO_Z = 22
RUTA_Z = [0, -6, 6, -16, 16, 22]


def casa(i):
    x, z = CASAS_X[i], CASAS_Z[i]
    return {'x': x, 'z': z, 'ancho': 8, 'fondo': 6, 'entrada': {'x': x + 4, 'z': z + 7}}


def puesto(k):
    """Puesto k: centro, huella (medio ancho, medio fondo) y el sitio donde trabaja su habitante."""
    x = PUESTOS_X[k % len(PUESTOS_X)]  # (el Pueblo del Sol tiene 24, pero conserva sus sitios)
    return {'x': x, 'z': PUESTO_Z, 'giro': 0, 'oficio': {'x': x, 'z': PUESTO_Z - 2.1}}  # el puesto mira a la cámara; quien atiende, detrás


def plaza(k, n):
    """Sitio k de n alrededor de la plaza (al atardecer se juntan ahí)."""
    a = -math.pi / 2 + (k + 0.5) * 2 * math.pi / max(n, 1)
    return {'x': round(PLAZA['x'] + math.cos(a) * 5.2, 2), 'z': round(PLAZA['z'] + math.sin(a) * 5.2, 2)}


def recurso(i):
    return {'x': RECURSOS_X[i], 'z': RECURSO_Z}


def ruta(i):
    return {'x': -LX + 2.5 if i % 2 == 0 else LX - 2.5, 'z': RUTA_Z[i // 2]}


def paso_archivo(i):
    return {'x': ARCHIVO['x'] - 4 + i * 4, 'z': ARCHIVO['z'] + 1.6}


def solidos(n_puestos, combate, n_casas=0):
    """Lo que no se atraviesa además de las casas: [x, z, medio ancho, medio fondo]."""
    s = [[0, 0, 1.4, 1.4], [ARCHIVO['x'], ARCHIVO['z'] - 0.4, 1.3, 0.6]]
    s += [[x, z, r, r] for _, x, z, r in adornos(n_casas) if r > 0]
    s += [[PUESTOS_X[k], PUESTO_Z, 1.3, 0.8] for k in range(n_puestos)]
    if combate:
        s += [[COMBATE['x'] - 1.55, COMBATE['z'] + 0.2, 0.35, 0.35], [COMBATE['x'] + 1.55, COMBATE['z'] + 0.2, 0.35, 0.35]]
    return s


HITO = {'x': 0, 'z': -27}


def adornos(n_casas):
    """Lo que llena el pueblo (el arte elige el modelo según la región). [tipo, x, z, radio sólido (0 = se pisa)]:
    faroles por la calle, bancos y jardines en la plaza, huertas y árboles en el barrio de atrás, el pozo, el hito del
    pueblo al norte (faro, mina, atalaya…), sembrados y cercas al sur cerca de los recursos."""
    a = []
    for x in range(-46, 47, 9):
        if abs(x) > 8:
            a += [['farol', x + 0.5, -2.2, 0.25], ['farol', x - 0.5, 2.2, 0.25]]
    for k in range(4):  # en las diagonales: las calles y la entrada quedan libres
        ang = k * math.pi / 2 + math.pi / 4
        a.append(['banco', round(math.cos(ang) * 8.8, 2), round(math.sin(ang) * 8.8, 2), 0.45])
    for k in range(4):
        ang = k * math.pi / 2 + math.pi / 4
        a.append(['jardin', round(math.cos(ang) * 3.3, 2), round(math.sin(ang) * 3.3, 2), 0])
    # Barrio de atrás: huertas y árboles detrás de las casas, el pozo y el hito
    xs_casas = CASAS_X[:n_casas]
    for x in range(-46, 47, 6):
        detras = any(cx - 1 <= x <= cx + 9 for cx in xs_casas)
        if abs(x) < 3:
            continue
        a.append(['huerta' if detras else 'arbol', x, -16.5, 0 if detras else 0.9])
        if not detras or x % 12 == 0:
            a.append(['arbol', x + 3, -21.5, 0.9])
    for x in (-40, -28, 28, 40):
        a += [['arbol', x, -31, 0.9], ['arbol', x + 5, -34.5, 0.9]]
    a += [['pozo', -8, -19.5, 0.9], ['hito', HITO['x'], HITO['z'], 3.2], ['banco', -4, -21, 0.45], ['banco', 4, -21, 0.45]]
    # Al sur: sembrados entre los recursos, cercas y unos árboles sueltos
    for x in (-21, 21):
        a += [['huerta', x, 22, 0], ['huerta', x, 27.5, 0]]
    for x in (-44, -38, 44):
        a.append(['arbol', x, 31, 0.9])
    for x in range(-34, 35, 4):
        if abs(x) > 6:
            a.append(['cerca', x, 33.5, 0])
    return a
