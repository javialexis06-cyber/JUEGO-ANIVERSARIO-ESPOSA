"""El local de Súper Manía: el mismo local que crece en 4 tamaños (Tiendita → Minimercado → Supermercado →
Hipermercado) sin perder nada. Datos puros (sin Blender): los usan `exportar_glb.py` para el cascarón y el JSON de
cada tamaño, y `revisar_local.py` para dibujar el plano y revisar que todo tenga camino.

Coordenadas «del local»: las de la Tiendita (12 × 9, centrada en el origen). La pared izquierda (x = -6) y la del
fondo (y = 4.5) no se mueven nunca; el local crece hacia la derecha y hacia el frente. Cada tamaño se exporta en sus
propias coordenadas centradas (como espera el juego): se le resta el centro de ese tamaño.

Cada sitio conserva su id en todos los tamaños (la partida guarda el nivel de cada id). Los ids 3, 8, 10 y 11 eran de
la Tiendita vieja (el tercer estante, la segunda nevera de bebidas y la isla de dos caras) y ya no existen: el juego
le devuelve la plata a quien los había comprado.
"""
import math

IZQ, FONDO = -6.0, 4.5
# Tamaños: ancho (hacia la derecha), fondo (hacia el frente), nivel máximo de las vitrinas y nombre
TAMANOS = {
    1: dict(W=12.0, D=9.0, tope=2, nombre='Tiendita de barrio'),
    2: dict(W=15.0, D=10.0, tope=2, nombre='Minimercado'),
    3: dict(W=18.0, D=11.0, tope=3, nombre='Supermercado'),
    4: dict(W=21.0, D=12.0, tope=3, nombre='Hipermercado'),
}
BODEGA_X = 4.3  # la puerta de la bodega no se mueve


def centro(t):
    T = TAMANOS[t]
    return IZQ + T['W'] / 2, FONDO - T['D'] / 2


def frente(t):
    return FONDO - TAMANOS[t]['D']


def derecha(t):
    return IZQ + TAMANOS[t]['W']


def entrada_y(t):
    """La puerta de la calle (pared izquierda) se corre hacia el frente con cada ampliación."""
    return frente(t) + 2.1


def ancho_puerta(t):
    return 1.1 if t == 1 else 1.6


def caja_y(t):
    return frente(t) + 1.6


def caja_x(t):
    return -3.4 if t <= 2 else -3.0


# sección → (tipo de vitrina, color del tapete)
TIPO = {
    'frutas': ('frutas', '#C6E6AE'), 'abarrotes': ('estante', '#F8DDB8'), 'lacteos': ('nevera', '#C8E1F6'),
    'carnes': ('vitrina', '#F6C6BF'), 'congelados': ('congelador', '#DDD2F4'), 'panaderia': ('panaderia', '#F8E6AE'),
    'bebidas': ('bebidas', '#C2E8EE'), 'wafles': ('wafles', '#F9D0DE'), 'arepas': ('arepas', '#FCE59C'), 'caja': ('caja', '#E8E1D8'),
}

# Huella de cada vitrina por nivel (x0, x1, y0, y1) en su sistema local (el frente mira a -y)
HUELLA = {
    ('estante', 1): (-0.65, 0.65, -0.24, 0.24), ('estante', 2): (-0.75, 0.75, -0.31, 0.31), ('estante', 3): (-0.89, 0.89, -0.35, 0.36),
    ('frutas', 1): (-0.74, 0.74, -0.19, 0.19), ('frutas', 2): (-0.78, 0.78, -0.41, 0.45), ('frutas', 3): (-0.99, 1.22, -0.5, 0.55),
    ('nevera', 1): (-0.42, 0.42, -0.35, 0.4), ('nevera', 2): (-0.72, 0.72, -0.37, 0.43), ('nevera', 3): (-0.94, 0.94, -0.46, 0.56),
    ('vitrina', 1): (-0.5, 0.5, -0.33, 0.32), ('vitrina', 2): (-0.8, 0.8, -0.37, 0.36), ('vitrina', 3): (-0.97, 0.97, -0.52, 0.52),
    ('congelador', 1): (-0.45, 0.45, -0.33, 0.36), ('congelador', 2): (-0.7, 0.7, -0.39, 0.38), ('congelador', 3): (-0.97, 0.97, -0.52, 0.52),
    ('panaderia', 1): (-0.5, 0.5, -0.31, 0.31), ('panaderia', 2): (-0.74, 0.74, -0.32, 0.5), ('panaderia', 3): (-0.92, 0.92, -0.42, 1.05),
    ('bebidas', 1): (-0.46, 0.46, -0.26, 0.26), ('bebidas', 2): (-0.5, 0.5, -0.33, 0.41), ('bebidas', 3): (-0.92, 1.34, -0.46, 0.45),
    ('caja', 1): (-0.64, 0.64, -0.33, 0.33), ('caja', 2): (-0.85, 0.85, -0.36, 0.35), ('caja', 3): (-1.44, 1.0, -0.38, 0.38),
    ('wafles', 1): (-1.02, 0.5, -0.44, 0.84), ('wafles', 2): (-0.77, 0.77, -0.34, 0.34), ('wafles', 3): (-1.01, 1.01, -0.39, 1.05),
    ('arepas', 1): (-0.47, 0.98, -0.46, 0.82), ('arepas', 2): (-0.77, 0.77, -0.34, 0.34), ('arepas', 3): (-1.01, 1.01, -0.39, 1.05),
}


def B(x):
    """Contra la pared del fondo, en x."""
    return ('fondo', x)


def L(y):
    """Contra la pared izquierda, en y."""
    return ('izq', y)


def A(x, y, rot=0.0):
    """Libre en el piso (mirando al frente)."""
    return ('piso', x, y, rot)


def C():
    """La caja: cerca del frente, al lado de la puerta (en el súper grande, un poco más adentro: es más ancha)."""
    return ('caja', None)


# id: (sección, tamaño en que aparece, viene comprado al aparecer, letrero, anclaje [o {tamaño: anclaje}])
SITIOS = {
    0: ('lacteos', 1, True, True, B(-5.0)),
    1: ('abarrotes', 1, True, True, B(-3.1)),
    2: ('abarrotes', 1, False, False, B(-1.3)),
    4: ('bebidas', 1, False, True, B(0.55)),
    5: ('frutas', 1, True, True, L(1.9)),
    6: ('panaderia', 1, False, True, L(-0.3)),
    7: ('congelados', 1, False, True, {1: A(2.6, 0.9), 2: A(1.4, 0.9), 3: A(0.6, 0.9), 4: A(0.6, 0.9)}),
    9: ('caja', 1, True, False, C()),
    # Minimercado: llega la sección de carnes (de regalo) y más de lo que más se vende
    12: ('carnes', 2, True, True, B(6.05)),
    13: ('abarrotes', 2, False, False, B(7.95)),
    14: ('bebidas', 2, False, False, {2: A(5.2, 0.9), 3: A(3.3, 0.9), 4: A(3.3, 0.9)}),
    # Supermercado: el kiosco de wafles (de regalo), otra nevera, otras frutas y otro congelador
    15: ('lacteos', 3, False, False, B(9.85)),
    16: ('frutas', 3, False, False, L(-2.6)),
    17: ('congelados', 3, False, False, A(6.1, 0.9)),
    18: ('wafles', 3, True, True, A(9.3, 0.9)),
    # Hipermercado: el puesto de arepas (de regalo) y lo que faltaba para la gran tienda
    19: ('abarrotes', 4, False, False, B(11.75)),
    20: ('bebidas', 4, False, False, B(13.6)),
    21: ('carnes', 4, False, False, A(12.6, 0.9)),
    22: ('panaderia', 4, False, False, A(2.0, -2.4)),
    23: ('arepas', 4, True, True, A(7.2, -2.4)),
}
IDS_VIEJOS = [3, 8, 10, 11]


def anclaje(sid, t):
    a = SITIOS[sid][4]
    if isinstance(a, dict):
        return a.get(t) or a[max(k for k in a if k <= t)]
    return a


def posicion(sid, t, nivel):
    """(x, y, rot) del sitio en coordenadas del local para el tamaño t y el nivel de vitrina dado."""
    sec = SITIOS[sid][0]
    kind = TIPO[sec][0]
    y1 = HUELLA[(kind, nivel)][3]
    a = anclaje(sid, t)
    if a[0] == 'fondo':
        return a[1], FONDO - 0.1 - y1, 0.0
    if a[0] == 'izq':
        return IZQ + 0.1 + y1, a[1], math.pi / 2
    if a[0] == 'caja':
        return caja_x(t), caja_y(t), 0.0
    return a[1], a[2], a[3]


def sitios_de(t):
    return [sid for sid, s in SITIOS.items() if s[1] <= t]


def caja2_x(t):
    return 0.3 if t <= 2 else 0.6


def puntos(t):
    """Puntos fijos de cada tamaño (coordenadas del local)."""
    xr = derecha(t) - 0.55
    fr = frente(t)
    ey = entrada_y(t)
    lav = (-5.62, ey + 0.85) if t <= 2 else (2.55, 4.0)
    return dict(
        caneca=(5.4, fr + 0.5) if t == 1 else (derecha(t) - 2.8, fr + 0.55),
        caneca2=(xr, 2.3),
        canastas=(-5.4, ey - ancho_puerta(t) / 2 - 0.7),
        guardia=(-4.3, ey + 0.9),
        lavadero=lav,
        decoracion=dict(
            planta=dict(p=(xr, 0.0), rot=0.0, escala=1.1, caja=0.4),
            parlante=dict(p=(xr, -1.1), rot=-math.pi / 2, escala=1.0, caja=0.3),
            globos=dict(p=(-4.6, fr + 0.45), rot=0.0, escala=1.0, caja=0.3),
            camara=dict(p=(-5.95, 0.4), rot=-math.pi / 2, escala=1.0, caja=None),
        ),
    )


# Utilería fija del cascarón (lo que llena el local sin estorbar): (qué, x, y, rectángulo que ocupa o None).
# «isla»: isla de oferta con productos; «pila»: costales y cajas de la bodega; «matera»: planta grande.
def _isla(x, y):
    return ('isla', x, y, (x - 0.66, y - 0.66, x + 0.8, y + 0.66))


def _pila(x, y):
    return ('pila', x, y, (x - 0.76, y - 0.24, x + 0.76, y + 0.82))


def _matera(x, y):
    return ('matera', x, y, (x - 0.35, y - 0.35, x + 0.35, y + 0.35))


def utileria(t):
    fr, xd = frente(t), derecha(t)
    if t == 1:
        return [_pila(2.2, 3.55), _pila(5.15, -2.6), _isla(2.6, -1.6), _matera(xd - 0.5, 3.9)]
    if t == 2:
        return [_pila(2.2, 3.55), _pila(xd - 1.0, fr + 0.5), _isla(2.0, -2.2), _isla(5.6, -2.2)]
    if t == 3:
        return [_pila(xd - 1.0, fr + 0.5), _isla(2.0, -2.4), _isla(5.4, -2.4), _isla(8.8, -2.4), _matera(xd - 0.5, 3.9)]
    return [_pila(xd - 1.0, fr + 0.5), _isla(4.6, -2.4), _isla(10.0, -2.4), _isla(12.8, -2.4)]


def a_centrado(t, x, y):
    cx, cy = centro(t)
    return round(x - cx, 3), round(y - cy, 3)


def datos_json(t):
    """Lo que el juego necesita de cada tamaño (en coordenadas centradas de ese tamaño)."""
    T = TAMANOS[t]
    sitios = []
    for sid in sitios_de(t):
        sec, desde, inicio, letrero, _ = SITIOS[sid]
        kind = TIPO[sec][0]
        pos = {}
        for lvl in (1, 2, 3):
            x, y, rot = posicion(sid, t, lvl)
            cx, cy = a_centrado(t, x, y)
            pos[lvl] = dict(x=cx, y=cy, rot=round(rot, 4))
        sitios.append(dict(id=sid, seccion=sec, tipo=kind, tamano=desde, inicio=inicio, letrero=letrero, posicion=pos,
                           huella={lvl: HUELLA[(kind, lvl)] for lvl in (1, 2, 3)}, color_tapete=TIPO[sec][1]))
    pt = puntos(t)
    P = lambda p: dict(zip(('x', 'y'), a_centrado(t, *p)))
    deco = {}
    for k, d in pt['decoracion'].items():
        x, y = a_centrado(t, *d['p'])
        r = d['caja']
        deco[k] = dict(p=dict(x=x, y=y), rot=round(d['rot'], 4), escala=d['escala'],
                       **({'obstaculo': [round(x - r, 3), round(y - r, 3), round(x + r, 3), round(y + r, 3)]} if r else {}))
    obst = []
    for _, _, _, r in utileria(t):
        x0, y0 = a_centrado(t, r[0], r[1])
        x1, y1 = a_centrado(t, r[2], r[3])
        obst.append([x0, y0, x1, y1])
    # Puesto de canastas de la entrada
    cx, cy = a_centrado(t, *pt['canastas'])
    obst.append([round(cx - 0.4, 3), round(cy - 0.35, 3), round(cx + 0.4, 3), round(cy + 0.35, 3)])
    bx, by = a_centrado(t, BODEGA_X, FONDO - 0.9)
    ex, ey = a_centrado(t, IZQ + 0.9, entrada_y(t))
    return dict(nivel=t, nombre=T['nombre'], W=T['W'], D=T['D'], tope=T['tope'], escala_personas=0.68,
                bodega=dict(x=bx, y=by), entrada=dict(x=ex, y=ey), sitios=sitios,
                puntos=dict(caneca=P(pt['caneca']), caneca2=P(pt['caneca2']), canastas=P(pt['canastas']), guardia=P(pt['guardia']),
                            lavadero=P(pt['lavadero']), decoracion=deco),
                obstaculos=obst, caja2_x=a_centrado(t, caja2_x(t), 0)[0],
                coordenadas='Blender: x a la derecha, y hacia el fondo, z arriba. En Three.js: (x, 0, -y) y rotación y = rot.')
