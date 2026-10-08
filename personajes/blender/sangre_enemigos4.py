"""Los bichos del botín de Sangre y Ceniza (se registran en sangre_enemigos.ENEMIGOS): no atacan, huyen, y al
tumbarlos sueltan lo que cargan. La rata del tesoro (con su costal de monedas), la rata dorada (rara, toda de oro) y
el ladrón de tumbas (encapuchado, con la pala y el saco de lo que se robó). Mismas reglas que los demás: piezas con el
origen en la articulación, mirando a +Y, izquierda en -X."""
import math

import numpy as np

import sangre_comun as sc
import sangre_formas as sf
import sdf
from sangre_comun import P_
from sangre_enemigos import LADOS, enemigo, mano_garra, nueva, ojos
from sangre_enemigos2 import bota, capa_lamina, manga, pata_garra, sc_u


def _monedas(pz, centro, n, r, coll, rng, pt, esparcir=0.06, nombre='moneda'):
    """Un puñado de monedas sueltas (discos ladeados)."""
    for k in range(n):
        c = np.asarray(centro, float) + np.array([rng.uniform(-esparcir, esparcir), rng.uniform(-esparcir, esparcir), rng.uniform(0, esparcir * 0.6)])
        pz.malla(sc.torno(f'{nombre} {k}', [(0.0, 0.0), (r, 0.0), (r * 1.03, r * 0.22), (0.0, r * 0.24)], coll, segmentos=8, centro=tuple(c),
                          eje=(rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), 1)), pt)


def _rata(F, coll, pelo, piel_rosa, ojo_pt, diente_pt, carga):
    """Rata gorda de cuatro patas (como la de peste, sin bubones); `carga(c, cuerpo_f)` le pone lo de la espalda."""
    una = P_('#2A2420', 'liso')
    c = F.pieza('cuerpo', (0, 0, 0.25), tris=1300)
    cuerpo_f = sf.union(sdf.ellipsoid((0, -0.06, 0.27), (0.17, 0.27, 0.17)), sdf.ellipsoid((0, 0.14, 0.27), (0.13, 0.14, 0.13)), k=0.08)
    c.sdf(sc.sdf_ruido(cuerpo_f, 0.008, 35, 2), (-0.25, -0.4, 0.05), (0.25, 0.35, 0.5), pelo)
    for k in range(10):
        a = -0.9 + k * 0.2
        p, n = sf.hacia(cuerpo_f, (0, -0.05, 0.27), (math.sin(a) * 0.7, -0.4 + 0.1 * (k % 3), 0.6), -0.003)
        if p is not None:
            sf.diente(c, f'pelo erizado {k}', p, p + n * 0.035 + np.array([0, -0.04, 0]), 0.012, pelo, coll)
    carga(c, cuerpo_f)
    h = F.pieza('cabeza', (0, 0.22, 0.3), tris=620)
    hc = np.array([0, 0.3, 0.3])
    h.sdf(sf.union(sdf.ellipsoid(hc, (0.09, 0.1, 0.08)), sdf.round_cone(hc + np.array([0, 0.05, -0.01]), hc + np.array([0, 0.18, -0.035]), 0.06, 0.025), k=0.04),
          hc - 0.25, hc + 0.3, pelo)
    h.bola(hc + np.array([0, 0.195, -0.03]), 0.019, piel_rosa, 0.004)
    for s in (-1, 1):
        o = sf.restar(sdf.ellipsoid(hc + np.array([s * 0.07, -0.02, 0.08]), (0.05, 0.012, 0.055)), sdf.ellipsoid(hc + np.array([s * 0.07, 0.0, 0.08]), (0.04, 0.01, 0.045)))
        h.sdf(o, hc - 0.25, hc + 0.25, piel_rosa, 0.0)
        for j in range(3):
            b = hc + np.array([s * 0.04, 0.17, -0.02])
            h.malla(sc.tubo(f'bigote {s} {j}', [b, b + np.array([s * 0.09, 0.03, 0.025 - j * 0.02])], 0.0022, coll, segmentos=3, muestras=1), una)
    ojos(h, [hc + np.array([-0.045, 0.08, 0.025]), hc + np.array([0.045, 0.08, 0.025])], 0.016, ojo_pt, coll)
    for s in (-1, 1):
        sf.diente(h, f'incisivo {s}', hc + np.array([s * 0.008, 0.19, -0.055]), hc + np.array([s * 0.008, 0.195, -0.095]), 0.009, diente_pt, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.09, 0.13, 0.22])
        a = F.pieza(f'brazo_{lado}', hom, tris=220)
        pata = np.array([s * 0.11, 0.2, 0.03])
        a.trazo([hom, hom + np.array([s * 0.02, 0.02, -0.1]), pata], [0.042, 0.031, 0.02], pelo, 0.0)
        pata_garra(a, pata, (0, 1, 0), 4, 0.035, 0.009, piel_rosa, una, coll, 'dedo mano')
        cad = np.array([s * 0.1, -0.18, 0.24])
        p = F.pieza(f'pierna_{lado}', cad, tris=260)
        tob = np.array([s * 0.12, -0.26, 0.05])
        p.trazo([cad, cad + np.array([s * 0.03, 0.06, -0.1]), tob], [0.075, 0.042, 0.02], pelo, 0.0)
        pata_garra(p, tob + np.array([0, 0.02, -0.02]), (0, 1, 0), 4, 0.05, 0.01, piel_rosa, una, coll, 'dedo pie')
    k = F.pieza('cola', (0, -0.3, 0.22), tris=220)
    pts = [np.array([0.04 * math.sin(t * 6), -0.3 - t * 0.45, 0.22 - t * 0.17 + 0.08 * math.sin(t * 3)]) for t in np.linspace(0, 1, 8)]
    k.trazo(pts, list(np.linspace(0.028, 0.006, 8)), piel_rosa, 0.0)
    return F


# ---------------------------------------------------------------------------
# Rata del tesoro: un costal de monedas amarrado al lomo, monedas que se le salen y un diente de oro
# ---------------------------------------------------------------------------

@enemigo('rata_tesoro')
def rata_tesoro(coll):
    F = nueva('rata_tesoro', voxel=0.008, cuadrupedo=1, botin=1)
    pelo = P_('#6A5A4A', 'pelo', color2='#3E342C', semilla=11, barro=0.4)
    piel = P_('#B08078', 'carne', color2='#7A4A48', semilla=12)
    oro = P_('#C89A3A', 'oro', semilla=13)
    yute = P_('#8A7048', 'tela', semilla=14, polvo=0.5)
    cuerda = P_('#5A4228', 'cuero', semilla=15)
    rng = np.random.default_rng(7)

    def carga(c, cuerpo_f):
        saco = sf.union(sdf.ellipsoid((0, -0.1, 0.5), (0.16, 0.19, 0.15)), sdf.round_cone((0, -0.06, 0.6), (0.02, -0.02, 0.7), 0.07, 0.04), k=0.05)
        for k in range(6):
            a = k * 1.05
            saco = sf.restar(saco, sdf.round_cone((math.cos(a) * 0.17, -0.1 + math.sin(a) * 0.19, 0.42), (math.cos(a) * 0.14, -0.1 + math.sin(a) * 0.16, 0.6),
                                                  0.012, 0.006), 0.01)
        c.sdf(sc.sdf_ruido(saco, 0.006, 28, 16), (-0.25, -0.35, 0.3), (0.25, 0.15, 0.78), yute)
        c.malla(sc.torno('amarre saco', [(0.042, -0.012), (0.05, 0.0), (0.042, 0.012)], coll, segmentos=10, centro=(0.01, -0.04, 0.665), eje=(0.2, 0.3, 1)), cuerda)
        for s in (-1, 1):
            c.trazo([(s * 0.14, -0.1, 0.46), (s * 0.18, -0.05, 0.3), (s * 0.12, 0.05, 0.15), (0, 0.08, 0.1)], 0.012, cuerda, 0.0)
        # remiendo cosido y monedas que se salen por la boca del saco y por un roto
        c.caja((0.12, -0.2, 0.52), (0.05, 0.01, 0.045), 0.006, P_('#6A3A28', 'tela', semilla=17), 0.0, rot=sc.rot('z', -35))
        _monedas(c, (0.03, 0.0, 0.73), 6, 0.022, coll, rng, oro, 0.04)
        _monedas(c, (0.15, -0.22, 0.42), 4, 0.02, coll, rng, oro, 0.03, 'moneda roto')
        c.malla(sc.bolita('gema saco', (-0.05, -0.02, 0.74), (0.02, 0.02, 0.02), coll, n=2), P_('#3AA8FF', 'brillo', mat='brillo_azul'))
    _rata(F, coll, pelo, piel, P_('#FFD36B', 'brillo', mat='brillo_oro'), oro, carga)
    return F


# ---------------------------------------------------------------------------
# Rata dorada: rara; toda de oro bruñido, con gemas incrustadas en el lomo y una coronita
# ---------------------------------------------------------------------------

@enemigo('rata_dorada')
def rata_dorada(coll):
    F = nueva('rata_dorada', voxel=0.008, cuadrupedo=1, botin=1)
    oro = P_('#D8AA44', 'oro', semilla=21)
    oro_osc = P_('#9A7224', 'oro', semilla=22)
    gema_r = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    gema_a = P_('#3AA8FF', 'brillo', mat='brillo_azul')
    gema_v = P_('#7CFF4A', 'brillo', mat='brillo_verde')

    def carga(c, cuerpo_f):
        for k, (d, g) in enumerate((((0.0, -0.1, 1), gema_r), ((0.5, -0.4, 1), gema_a), ((-0.5, -0.4, 1), gema_v), ((0.3, 0.2, 1), gema_a),
                                    ((-0.3, 0.2, 1), gema_r), ((0, -0.6, 0.8), gema_v))):
            p, n = sf.hacia(cuerpo_f, (0, -0.02, 0.27), d, -0.004)
            if p is not None:
                c.bola(p, (0.03, 0.03, 0.022), oro_osc, 0.0)
                c.malla(sc.bolita(f'gema {k}', p + n * 0.018, (0.022, 0.022, 0.018), coll, n=2), g)
        # cadenita de oro alrededor del cuello
        ring = [(math.cos(a) * 0.12, 0.13 + math.sin(a) * 0.07, 0.3 + 0.04 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 16, endpoint=False)]
        sf.cuerda_anillo(c, 'cadenita', ring, 0.01, oro_osc, coll)

    _rata(F, coll, oro, P_('#E8C070', 'oro', semilla=23), gema_a, P_('#F0F0F0', 'liso'), carga)
    h = F.piezas['cabeza']
    hc = np.array([0, 0.3, 0.3])
    corona = hc + np.array([0, -0.02, 0.085])
    h.malla(sc.torno('corona', [(0.045, 0.0), (0.05, 0.0), (0.05, 0.03), (0.045, 0.03)], coll, segmentos=12, centro=tuple(corona), eje=(0, 0, 1)), oro_osc)
    for k in range(5):
        a = 2 * math.pi * k / 5
        b = corona + np.array([math.cos(a) * 0.047, math.sin(a) * 0.047, 0.03])
        sf.diente(h, f'punta corona {k}', b, b + np.array([0, 0, 0.03]), 0.01, oro_osc, coll)
    return F


# ---------------------------------------------------------------------------
# Ladrón de tumbas: encapuchado y flaco, con un pañuelo en la cara, el saco al hombro, la pala y un farol verde
# ---------------------------------------------------------------------------

@enemigo('ladron_tumbas')
def ladron_tumbas(coll):
    F = nueva('ladron_tumbas', voxel=0.0095, botin=1)
    piel = P_('#9A8270', 'carne', color2='#5A4238')
    capa = P_('#2E2A30', 'tela', semilla=31, polvo=0.4)
    capa2 = P_('#3E3436', 'tela', semilla=32, barro=0.5)
    panuelo = P_('#6A2A26', 'tela', semilla=33)
    cuero_pt = P_('#3A281A', 'cuero', semilla=34, polvo=0.4)
    pant = P_('#38343A', 'tela', barro=0.7, semilla=35)
    yute = P_('#7A6440', 'tela', semilla=36, polvo=0.5)
    hierro = P_('#55575C', 'hierro', semilla=37)
    madera = P_('#5A3E26', 'madera', color2='#352214', eje='z')
    oro = P_('#C89A3A', 'oro', semilla=38)
    llama = P_('#7CFF4A', 'brillo', mat='brillo_verde')
    ojo = P_('#FFD36B', 'brillo', mat='brillo_oro')
    una = P_('#2A2420', 'liso')
    rng = np.random.default_rng(9)
    c = F.pieza('cuerpo', (0, 0, 0.45), tris=1700)
    # torso flaco y jorobado (va agachado, huyendo)
    torso = sf.union(sdf.round_cone((0, 0.0, 0.46), (0, 0.1, 0.7), 0.15, 0.17), sdf.ellipsoid((0, 0.06, 0.74), (0.21, 0.14, 0.08)), k=0.06)
    c.sdf(torso, (-0.3, -0.25, 0.3), (0.3, 0.3, 0.9), capa2)
    sf.cuerda_anillo(c, 'cinturon', sf.anillo(torso, (0, 0.03, 0.5), (0, 0, 1), 0.6, 20, 0.02), 0.016, cuero_pt, coll)
    capa_lamina(c, 'capa', 0.8, -0.1, 0.17, 0.24, 0.28, capa, coll, filas=8, cols=11, rasgado=0.06, sem=31)
    # el saco al hombro izquierdo, lleno de cosas de las tumbas (un candelabro y un cáliz asomándose)
    sc_c = np.array([-0.16, -0.12, 0.86])
    saco = sf.union(sdf.ellipsoid(sc_c, (0.17, 0.15, 0.2)), sdf.round_cone(sc_c + np.array([0.06, 0.04, 0.15]), sc_c + np.array([0.12, 0.08, 0.25]), 0.07, 0.04), k=0.05)
    c.sdf(sc.sdf_ruido(saco, 0.007, 26, 39), sc_c - 0.3, sc_c + 0.35, yute)
    c.malla(sc.torno('amarre', [(0.04, -0.012), (0.048, 0.0), (0.04, 0.012)], coll, segmentos=10, centro=tuple(sc_c + np.array([0.1, 0.06, 0.22])), eje=(0.4, 0.3, 1)),
            cuero_pt)
    boca = sc_c + np.array([0.13, 0.09, 0.27])
    c.trazo([boca, boca + np.array([0.02, 0.0, 0.12])], 0.008, oro, 0.0)
    for k in range(3):
        a = k * 2.1
        c.trazo([boca + np.array([0.02, 0, 0.1]), boca + np.array([0.02 + math.cos(a) * 0.05, math.sin(a) * 0.05, 0.14])], 0.006, oro, 0.0)
        c.cono(boca + np.array([0.02 + math.cos(a) * 0.05, math.sin(a) * 0.05, 0.14]), boca + np.array([0.02 + math.cos(a) * 0.05, math.sin(a) * 0.05, 0.17]),
               0.009, 0.008, P_('#E8DCB8', 'cera'), 0.0)
    c.malla(sc.torno('caliz', [(0.0, 0.0), (0.035, 0.0), (0.012, 0.03), (0.01, 0.07), (0.04, 0.1), (0.045, 0.13), (0.0, 0.12)], coll, segmentos=10,
                     centro=tuple(boca + np.array([-0.09, -0.02, 0.0])), eje=(-0.3, 0, 1)), oro)
    _monedas(c, sc_c + np.array([0.05, -0.08, -0.22]), 4, 0.02, coll, rng, oro, 0.03)
    # farol verde (de tumba) colgando del cinto
    fl = np.array([0.2, 0.08, 0.4])
    c.caja(fl, (0.04, 0.04, 0.055), 0.01, hierro, 0.0)
    c.bola(fl, (0.03, 0.03, 0.04), llama, 0.0)
    c.trazo([fl + np.array([0, 0, 0.055]), fl + np.array([0, 0, 0.09]), fl + np.array([-0.01, -0.02, 0.1])], 0.006, hierro, 0.0)
    c.bola((0, 0.0, 0.43), (0.16, 0.13, 0.07), pant, 0.03)
    F.marca('llama', tuple(fl))
    # cabeza: capucha honda, pañuelo tapando nariz y boca, ojos que brillan desde la sombra
    h = F.pieza('cabeza', (0, 0.1, 0.8), tris=900)
    hc = np.array([0, 0.16, 0.9])
    h.sdf(sdf.round_box(hc, (0.11, 0.1, 0.11), 0.08), hc - 0.25, hc + 0.25, piel)
    capucha = sf.restar(sf.union(sdf.ellipsoid(hc + np.array([0, -0.03, 0.04]), (0.16, 0.16, 0.16)),
                                 sdf.round_cone(hc + np.array([0, -0.08, 0.12]), hc + np.array([0, -0.2, 0.2]), 0.08, 0.02), k=0.04),
                        sdf.ellipsoid(hc + np.array([0, 0.1, 0.0]), (0.12, 0.12, 0.13)))
    h.sdf(sc.sdf_ruido(capucha, 0.005, 30, 40), hc - 0.35, hc + 0.35, capa)
    h.sdf(sf.intersect(sf.cascaron(sdf.round_box(hc, (0.115, 0.105, 0.115), 0.08), 0.014), sdf.round_box(hc + np.array([0, 0.1, -0.06]), (0.13, 0.08, 0.06), 0.02)),
          hc - 0.25, hc + 0.25, panuelo)
    h.malla(sf.tira('punta pañuelo', [hc + np.array([0.08, 0.06, -0.08]), hc + np.array([0.13, 0.0, -0.14]), hc + np.array([0.16, -0.04, -0.2])], 0.035, coll,
                    normal=(1, 0, 0)), panuelo)
    ojos(h, [hc + np.array([-0.04, 0.105, 0.025]), hc + np.array([0.04, 0.105, 0.025])], 0.016, ojo, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.2, 0.06, 0.74])
        a = F.pieza(f'brazo_{lado}', hom, tris=520 if s > 0 else 330)
        if s < 0:
            # (sujeta el saco del hombro)
            codo, mun = np.array([-0.24, 0.05, 0.86]), np.array([-0.15, 0.02, 1.0])
        else:
            codo, mun = np.array([0.23, 0.16, 0.58]), np.array([0.2, 0.3, 0.55])
        manga(a, hom, codo + (codo - hom) * 0.25, 0.07, 0.06, capa2, sem=s + 40)
        a.trazo([hom, codo, mun], [0.055, 0.045, 0.04], piel, 0.0)
        mano_garra(a, mun, mun - codo, piel, una, coll, f'mano {lado}', tam=1.2)
        if s > 0:
            # la pala de sepulturero
            g = mun + (mun - codo) * 0.25
            a.trazo([g + np.array([0, -0.1, 0.25]), g, g + np.array([0, 0.08, -0.32])], 0.016, madera, 0.0)
            pl = g + np.array([0, 0.1, -0.42])
            a.caja(pl, (0.07, 0.012, 0.1), 0.01, hierro, 0.0, rot=sc.rot('x', -12))
            a.trazo([g + np.array([-0.05, -0.1, 0.25]), g + np.array([0.05, -0.1, 0.25])], 0.014, madera, 0.0)
    for lado, s in LADOS:
        cad = np.array([s * 0.09, 0.0, 0.43])
        p = F.pieza(f'pierna_{lado}', cad, tris=320)
        tob = np.array([s * 0.1, 0.02, 0.1])
        p.cono(cad, tob, 0.08, 0.065, pant, 0.0)
        bota(p, tob, s, cuero_pt, largo=0.1, ancho=0.06, alto=0.04, cana=0.12, r_cana=0.07, suela=P_('#1E1612', 'cuero'))
    return F
