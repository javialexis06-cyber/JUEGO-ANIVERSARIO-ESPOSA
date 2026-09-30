"""El perrito de la casa: un cachorro de plastilina hecho por piezas para animarlo en el juego.

Mira hacia -y (a la cámara) con el origen en el piso entre las patas. Cada parte que se mueve cuelga de un vacío
en su bisagra (cuerpo, cabeza, orejas, cejas, cola, las cuatro patas) y las caras vienen en variantes que el juego
prende y apaga: ojos abiertos, felices (^ ^) o cerrados, y boca cerrada o abierta con la lengua afuera.
El pelaje y las manchas tienen su propio material para pintarlo de otro color en el juego.
"""
import math

import clay
from tiendas import _group, _mat


def _materiales():
    pelo = lambda nombre, color: _mat(nombre, color, rough=0.9, fuzz=dict(scale=200, color=color, amount=0.35, strength=0.3, distance=0.002))
    return dict(
        pelaje=pelo('Perro | pelaje', '#E0A96D'),
        manchas=pelo('Perro | manchas', '#B9784A'),
        blanco=pelo('Perro | blanco', '#FFF6EC'),
        nariz=_mat('Perro | nariz', '#2B2226', rough=0.2, coat=0.6, coat_rough=0.05),
        ojo=_mat('Perro | ojo', '#2A1D1A', rough=0.08, coat=1.0, coat_rough=0.02),
        brillo=_mat('Perro | brillo', '#FFFFFF', rough=0.2, emission='#FFFFFF', emission_strength=1.5),
        lengua=_mat('Perro | lengua', '#F27B8C', rough=0.35, coat=0.3),
        boca=_mat('Perro | boca', '#7A2E33', rough=0.6),
        mejilla=_mat('Perro | mejilla', '#F4A3A8', rough=0.7),
        collar=_mat('Perro | collar', '#E4574B', rough=0.4, coat=0.3),
        placa=_mat('Perro | placa', '#F5C246', rough=0.25, metallic=0.85, coat=0.3),
    )


def _ojos(coll, m, tipo):
    for s in (-1, 1):
        x = s * 0.068
        if tipo == 'abiertos':
            clay.blob('ojo perro', (x, -0.205, 0.165), (0.034, 0.018, 0.041), coll, m['ojo'], n=8)
            clay.blob('brillo ojo', (x - 0.012, -0.222, 0.182), (0.012, 0.005, 0.012), coll, m['brillo'], n=5)
            clay.blob('brillito ojo', (x + 0.01, -0.222, 0.15), (0.006, 0.004, 0.006), coll, m['brillo'], n=4)
        else:
            # ^ ^ contento o ∪ ∪ dormido
            arriba = tipo == 'felices'
            clay.sweep('ojo raya', [(x - 0.027, -0.214, 0.158 if arriba else 0.174), (x, -0.221, 0.182 if arriba else 0.152),
                                    (x + 0.027, -0.214, 0.158 if arriba else 0.174)], 0.009, (1, 1), coll, m['ojo'], segments=6, samples=4)


def _cabeza(coll, m):
    clay.blob('cráneo perro', (0, -0.08, 0.13), (0.165, 0.145, 0.15), coll, m['pelaje'], n=12)
    clay.blob('mancha cabeza', (-0.07, -0.1, 0.255), (0.085, 0.08, 0.035), coll, m['manchas'], n=8)
    clay.blob('hocico perro', (0, -0.2, 0.07), (0.095, 0.075, 0.068), coll, m['blanco'], n=10)
    clay.blob('frente blanca', (0, -0.17, 0.17), (0.035, 0.05, 0.07), coll, m['blanco'], n=6)
    clay.blob('nariz perro', (0, -0.272, 0.1), (0.037, 0.023, 0.027), coll, m['nariz'], n=8)
    clay.blob('brillo nariz', (-0.012, -0.292, 0.112), (0.01, 0.004, 0.006), coll, m['brillo'], n=4)
    for s in (-1, 1):
        clay.blob('mejilla perro', (s * 0.105, -0.19, 0.075), (0.03, 0.012, 0.019), coll, m['mejilla'], n=5)
    clay.sweep('copete', [(0.0, -0.1, 0.27), (0.02, -0.13, 0.305), (0.045, -0.115, 0.3), (0.035, -0.1, 0.285)], 0.018, (1, 1), coll, m['manchas'],
               segments=6, samples=4)
    for tipo in ('abiertos', 'felices', 'cerrados'):
        _group(coll, f'p_ojos_{tipo}', (0, 0, 0), 0.0, lambda tipo=tipo: _ojos(coll, m, tipo))
    for s, lado in ((1, 'izq'), (-1, 'der')):
        _group(coll, f'p_ceja_{lado}', (s * 0.068, -0.2, 0.228), 0.0,
               lambda: clay.sweep('ceja perro', [(-0.024, 0, 0), (0, -0.004, 0.006), (0.024, 0, 0)], 0.01, (1, 1), coll, m['manchas'], segments=6,
                                  samples=3))

        def oreja(s=s):
            clay.blob('oreja perro', (s * 0.035, 0.0, -0.09), (0.048, 0.03, 0.115), coll, m['manchas'], n=8)
            clay.blob('oreja adentro', (s * 0.03, -0.022, -0.09), (0.028, 0.012, 0.08), coll, m['mejilla'], n=6)
        _group(coll, f'p_oreja_{lado}', (s * 0.135, -0.06, 0.23), 0.0, oreja)
    # Boca: cerrada (sonrisa en w) o abierta con la lengua (el juego la abre al ladrar, comer y hablar)
    _group(coll, 'p_boca_cerrada', (0, 0, 0), 0.0,
           lambda: clay.sweep('boca perro', [(-0.038, -0.262, 0.055), (-0.018, -0.272, 0.043), (0, -0.27, 0.06), (0.018, -0.272, 0.043),
                                             (0.038, -0.262, 0.055)], 0.0075, (1, 1), coll, m['nariz'], segments=6, samples=4))

    def abierta():
        clay.blob('boca abierta', (0, -0.015, -0.012), (0.046, 0.022, 0.034), coll, m['boca'], n=8)
        clay.blob('lengua perro', (0, -0.028, -0.04), (0.03, 0.015, 0.042), coll, m['lengua'], n=8)
    _group(coll, 'p_boca_abierta', (0, -0.255, 0.05), 0.0, abierta)


def _pata(coll, m, trasera):
    if trasera:
        clay.blob('muslo perro', (0, 0.01, -0.02), (0.066, 0.085, 0.08), coll, m['pelaje'], n=8)
    clay.blob('pata perro', (0, 0, -0.09), (0.05, 0.05, 0.1), coll, m['pelaje'], n=8)
    clay.blob('pie perro', (0, -0.022, -0.172), (0.058, 0.07, 0.036), coll, m['blanco'], n=8)
    for k in (-1, 0, 1):
        clay.blob('dedito', (k * 0.022, -0.085, -0.17), (0.013, 0.01, 0.012), coll, m['mejilla'], n=4)


def _cuerpo(coll, m):
    clay.blob('lomo perro', (0, 0.02, 0), (0.15, 0.21, 0.14), coll, m['pelaje'], n=12, p=2.2)
    clay.blob('barriga perro', (0, -0.01, -0.05), (0.115, 0.16, 0.1), coll, m['blanco'], n=10)
    clay.blob('pecho perro', (0, -0.16, 0.02), (0.105, 0.07, 0.11), coll, m['blanco'], n=8)
    clay.blob('mancha lomo', (0.06, 0.06, 0.1), (0.09, 0.1, 0.05), coll, m['manchas'], n=8)
    # Collar rojo con su placa de corazón dorado
    c = (0.0, -0.15, 0.1)
    u, v = (1.0, 0.0, 0.0), (0.0, 0.86, 0.51)
    pts = [tuple(c[i] + 0.105 * (math.cos(a) * u[i] + math.sin(a) * v[i]) for i in range(3)) for a in [k * math.tau / 16 for k in range(16)]]
    clay.sweep('collar', pts, 0.022, (1.2, 0.8), coll, m['collar'], segments=8, samples=3, closed=True)
    for s in (-1, 1):
        clay.blob('placa corazón', (s * 0.011, -0.25, 0.02), (0.015, 0.006, 0.015), coll, m['placa'], n=5)
    clay.blob('punta corazón', (0, -0.25, 0.006), (0.012, 0.006, 0.012), coll, m['placa'], n=4)
    _group(coll, 'p_cabeza', (0, -0.17, 0.12), 0.0, lambda: _cabeza(coll, m))

    def cola():
        clay.sweep('cola perro', [(0, 0, 0), (0, 0.05, 0.07), (0, 0.04, 0.15)], [0.036, 0.03, 0.02], (1, 1), coll, m['pelaje'], segments=8, samples=5)
        clay.blob('punta cola', (0, 0.036, 0.16), (0.026, 0.026, 0.028), coll, m['blanco'], n=6)
    _group(coll, 'p_cola', (0, 0.21, 0.07), 0.0, cola)
    for s, lado in ((1, 'izq'), (-1, 'der')):
        _group(coll, f'p_pata_del_{lado}', (s * 0.085, -0.12, -0.07), 0.0, lambda: _pata(coll, m, False))
        _group(coll, f'p_pata_tra_{lado}', (s * 0.095, 0.13, -0.07), 0.0, lambda: _pata(coll, m, True))


def perro(coll):
    m = _materiales()
    _group(coll, 'p_cuerpo', (0, 0.02, 0.27), 0.0, lambda: _cuerpo(coll, m))
