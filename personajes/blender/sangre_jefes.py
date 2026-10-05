"""Los cinco jefes de Sangre y Ceniza (jefes.glb): `jefe_<id>` por piezas como los enemigos, pero grandes (2,4 a
3,5 m) y con mucho más detalle. El Conde trae `extra_capa` y, para la fase 2, `extra_alas` (escondidas al empezar)."""
import math

import numpy as np

import sangre_comun as sc
import sangre_formas as sf
import sdf
from sangre_comun import P_
from sangre_enemigos import LADOS, mano_garra, ojos, rot_en
from sangre_enemigos2 import capa_lamina, manga, pata_garra, sc_u, tunica_larga

JEFES = {}


def jefe(id_):
    def deco(fn):
        JEFES[id_] = fn
        return fn
    return deco


def nueva(id_, voxel=0.02, suelo=True, **extras):
    F = sc.Figura(id_, 'jefe', voxel=voxel, suelo=suelo, alcance_ao=0.45)
    F.extras.update(extras)
    F.extras.setdefault('icono_vista', (28, 14))
    return F


def craneo_chico(pz, c, r, pt, coll, nombre, mira=(0, 1, 0), oscuro=None):
    """Calaverita (para cubrir al gólem): bola, quijada y dos cuencas oscuras."""
    c = np.asarray(c, float)
    m = sc_u(mira)
    lat = sc_u(np.cross(m, [0, 0, 1])) if abs(m[2]) < 0.9 else np.array([1.0, 0, 0])
    pz.bola(c, (r, r, r * 0.95), pt, 0.0)
    pz.bola(c + m * r * 0.55 + np.array([0, 0, -r * 0.55]), (r * 0.62, r * 0.5, r * 0.4), pt, r * 0.3)
    for s in (-1, 1):
        pz.malla(sc.bolita(f'{nombre} cuenca {s}', c + m * r * 0.82 + lat * s * r * 0.38 + np.array([0, 0, r * 0.05]), r * 0.24, coll, n=1, sub=1),
                 oscuro or P_('#0E0A08', 'liso'))


# ---------------------------------------------------------------------------
# El Gólem de Osarios (cementerio): un gigante de huesos, calaveras y tierra de tumba con un alma encendida
# ---------------------------------------------------------------------------

@jefe('golem_osarios')
def golem_osarios(coll):
    F = nueva('golem_osarios', voxel=0.026, bioma='cementerio')
    hueso = P_('#CFC2A0', 'hueso', polvo=0.3, semilla=1)
    hueso2 = P_('#B4A684', 'hueso', semilla=2)
    tierra = P_('#3E3226', 'piedra', semilla=3, musgo=0.5, var=1.3)
    lapida = P_('#6A6660', 'piedra', semilla=4, musgo=0.7)
    hierro = P_('#4A4C52', 'hierro', semilla=5)
    alma = P_('#7CFF4A', 'brillo', mat='brillo_verde')
    rng = np.random.default_rng(7)
    c = F.pieza('cuerpo', (0, 0, 1.25), tris=5200)
    torso = sf.union(sdf.ellipsoid((0, 0.05, 1.85), (0.75, 0.55, 0.6)), sdf.round_cone((0, 0.0, 1.25), (0, 0.05, 1.7), 0.45, 0.6), k=0.2)
    hueco = sdf.ellipsoid((0, 0.45, 1.75), (0.32, 0.25, 0.32))
    c.sdf(sc.sdf_ruido(sf.restar(torso, hueco, 0.05), 0.04, 4, 1), (-1.1, -0.8, 0.9), (1.1, 0.9, 2.6), tierra)
    for z in (1.55, 1.7, 1.85, 2.0):
        for s in (-1, 1):
            sf.costilla(c, torso, z, s, 120, 175, hueso, r=0.045, centro=(0, 0.05, 0), sale=0.02, n=5)
    c.bola((0, 0.38, 1.75), 0.2, alma, 0.0)
    F.marca('luz', (0, 0.4, 1.75))
    for k in range(26):
        d = np.array([rng.uniform(-1, 1), rng.uniform(-1, 0.4), rng.uniform(-0.6, 1)])
        p, n = sf.hacia(torso, (0, 0.05, 1.75), d, -0.02)
        if p is None or np.linalg.norm(p - np.array([0, 0.45, 1.75])) < 0.42:
            continue
        if k % 3:
            craneo_chico(c, p + n * 0.05, rng.uniform(0.09, 0.13), hueso if k % 2 else hueso2, coll, f'calavera {k}', mira=n + np.array([0, 0, 0.2]))
        else:
            e = p + n * 0.05
            dd = sc_u(np.cross(n, [0, 0, 1]) + rng.normal(0, 0.3, 3))
            c.trazo([e - dd * 0.22, e + dd * 0.22], 0.035, hueso2, 0.0)
            c.bola(e - dd * 0.24, 0.05, hueso2, 0.01)
            c.bola(e + dd * 0.24, 0.05, hueso2, 0.01)
    # lápidas rotas clavadas en la espalda
    for k, (x, ang) in enumerate(((-0.35, -15), (0.05, 5), (0.4, 18))):
        p = np.array([x, -0.42, 2.15 + 0.08 * (k % 2)])
        c.sdf(sc.sdf_ruido(sdf.round_box(p, (0.16, 0.05, 0.28), 0.05, rot=sc.rot('y', ang) @ sc.rot('x', -25)), 0.015, 9, 3 + k), p - 0.5, p + 0.5, lapida, 0.0)
    for k in range(3):
        ring = [np.array([math.cos(t) * (0.78 - 0.05 * k), math.sin(t) * 0.58 + 0.05, 1.45 + 0.28 * k + 0.12 * math.sin(t * 2)]) for t in np.linspace(0, 2 * math.pi, 22,
                                                                                                                                             endpoint=False)]
        sf.cuerda_anillo(c, f'cadena {k}', ring, 0.03, hierro, coll)
    h = F.pieza('cabeza', (0, 0.2, 2.35), tris=1600)
    hc = np.array([0, 0.3, 2.62])
    cr = sf.union(sdf.round_box(hc, (0.32, 0.3, 0.27), 0.18), sdf.ellipsoid(hc + np.array([0, 0.2, -0.17]), (0.22, 0.14, 0.09)), k=0.06)
    for s in (-1, 1):
        cr = sf.restar(cr, sdf.ellipsoid(hc + np.array([s * 0.13, 0.27, 0.02]), (0.1, 0.1, 0.1)), 0.03)
    cr = sf.restar(cr, sdf.ellipsoid(hc + np.array([0, 0.32, -0.1]), (0.04, 0.06, 0.05)), 0.01)
    cr = sf.agujero(cr, hc + np.array([0.18, 0.0, 0.25]), (0.12, 0.12, 0.08), amp=0.02, sem=4)
    h.sdf(cr, hc - 0.6, hc + 0.6, hueso)
    ojos(h, [hc + np.array([-0.13, 0.23, 0.02]), hc + np.array([0.13, 0.23, 0.02])], 0.055, alma, coll)
    sf.fila_dientes(h, 'diente', hc + np.array([0, 0.3, -0.2]), 0.3, 9, 0.06, P_('#C8B88C', 'hueso'), coll, sentido=-1, sem=2)
    for k in range(5):
        a = math.radians(-60 + k * 30)
        p = hc + np.array([math.sin(a) * 0.3, -0.05 + math.cos(a) * 0.12, 0.25])
        h.sdf(sdf.round_box(p + np.array([0, 0, 0.12]), (0.07, 0.03, 0.15 + 0.04 * (k % 2)), 0.03, rot=sc.rot('y', math.degrees(a) * 0.5)), p - 0.4, p + 0.5, lapida, 0.0)
    m = F.pieza('mandibula', hc + np.array([0, 0.05, -0.2]), tris=500)
    piv = hc + np.array([0, 0.05, -0.2])
    R = sc.rot('x', -14)
    m.sdf(sdf.round_box(rot_en(hc + np.array([0, 0.2, -0.32]), piv, R), (0.24, 0.14, 0.06), 0.05, rot=R), hc - 0.7, hc + 0.5, hueso2)
    sf.fila_dientes(m, 'diente inf', rot_en(hc + np.array([0, 0.3, -0.27]), piv, R), 0.28, 8, 0.05, P_('#C8B88C', 'hueso'), coll, sentido=1, sem=5)
    for lado, s in LADOS:
        hom = np.array([s * 0.78, 0.05, 2.05])
        a = F.pieza(f'brazo_{lado}', hom, tris=2200)
        codo, mun = np.array([s * 1.0, 0.25, 1.45]), np.array([s * 0.95, 0.6, 1.0])
        brazo = sf.union(sdf.round_cone(hom, codo, 0.3, 0.24), sdf.round_cone(codo, mun, 0.24, 0.3), k=0.08)
        a.sdf(sc.sdf_ruido(brazo, 0.03, 5, 6 + s), np.minimum(hom, mun) - 0.5, np.maximum(hom, mun) + 0.5, tierra)
        for k in range(7):
            t = k / 6
            p0 = hom + (mun - hom) * t
            d = sc_u(mun - hom)
            lat = sc_u(np.cross(d, [0, 0, 1]))
            e0 = p0 + lat * 0.25 * math.cos(k * 2.1) + np.array([0, 0, 0.2 * math.sin(k * 2.1)])
            a.trazo([e0 - d * 0.25, e0 + d * 0.25], 0.04, hueso if k % 2 else hueso2, 0.0)
            a.bola(e0 - d * 0.27, 0.06, hueso, 0.01)
            a.bola(e0 + d * 0.27, 0.06, hueso, 0.01)
        puno = mun + (mun - codo) * 0.35
        a.bola(puno, (0.35, 0.35, 0.32), tierra, 0.1)
        for k in range(6):
            ang = 2 * math.pi * k / 6
            craneo_chico(a, puno + np.array([math.cos(ang) * 0.3, 0.12 + math.sin(ang) * 0.3, math.sin(ang) * 0.12]), 0.12, hueso, coll, f'calavera puño {k}',
                         mira=(math.cos(ang), 0.6, math.sin(ang)))
    for lado, s in LADOS:
        cad = np.array([s * 0.42, 0.0, 1.2])
        p = F.pieza(f'pierna_{lado}', cad, tris=1600)
        tob = np.array([s * 0.5, 0.05, 0.2])
        p.sdf(sc.sdf_ruido(sf.union(sdf.round_cone(cad, tob, 0.36, 0.3), sdf.round_box(tob + np.array([0, 0.12, -0.1]), (0.32, 0.42, 0.12), 0.08), k=0.1),
                           0.03, 5, 8 + s), cad - np.array([0.7, 0.7, 1.4]), cad + 0.6, tierra)
        for k in range(3):
            craneo_chico(p, cad + (tob - cad) * (0.3 + 0.25 * k) + np.array([s * 0.3, 0.15, 0.0]), 0.11, hueso2, coll, f'calavera pierna {k}', mira=(s, 0.6, 0))
        for k in range(4):
            b = tob + np.array([(k - 1.5) * 0.15, 0.5, -0.1])
            p.malla(sc.punta(f'garra pie {k}', b, b + np.array([0, 0.15, -0.08]), 0.06, coll, seg=5), hueso)
    return F


# ---------------------------------------------------------------------------
# La Abadesa de los Lamentos (catacumbas): banshee monja que flota, boca abierta en un alarido
# ---------------------------------------------------------------------------

@jefe('abadesa')
def abadesa(coll):
    F = nueva('abadesa', voxel=0.02, suelo=False, vuela=1, bioma='catacumbas')
    habito = P_('#2E3640', 'vidrio', mat='espectro', semilla=1)
    habito2 = P_('#1E242C', 'vidrio', mat='espectro', semilla=2)
    toca = P_('#B8BCC0', 'tela', semilla=3)
    hueso = P_('#D8D8D0', 'hueso', semilla=4)
    oro = P_('#A57D36', 'oro', semilla=5)
    ojo = P_('#5ED8FF', 'brillo', mat='brillo_azul')
    c = F.pieza('cuerpo', (0, 0, 1.6), tris=3200)
    torso = sf.union(sdf.round_cone((0, 0.0, 1.35), (0, 0.04, 1.9), 0.3, 0.36), sdf.ellipsoid((0, 0.03, 1.95), (0.46, 0.3, 0.14)), k=0.1)
    c.sdf(torso, (-0.7, -0.6, 1.0), (0.7, 0.6, 2.2), habito)
    falda = sdf.round_cone((0, -0.05, 1.45), (0, -0.15, 0.45), 0.36, 0.6)
    falda = sf.cortar(falda, (0, 0, 0.55), (0, 0, 1), amp=0.18, esc=4, sem=3, dientes=0.12, esc_dientes=14)
    falda = sf.restar(falda, sdf.round_cone((0, -0.05, 1.4), (0, -0.15, 0.3), 0.32, 0.55))
    c.sdf(falda, (-0.9, -0.9, 0.0), (0.9, 0.8, 1.6), habito)
    for k in range(9):
        a = 2 * math.pi * k / 9
        p = np.array([math.cos(a) * 0.55, -0.12 + math.sin(a) * 0.55, 0.62])
        e = p + np.array([math.cos(a) * 0.15, math.sin(a) * 0.1 - 0.2, -0.55 - 0.15 * (k % 3)])
        c.malla(sf.tira(f'jiron {k}', [p, (p + e) / 2 + np.array([0, -0.06, 0]), e], 0.2, coll, normal=(math.cos(a), math.sin(a), 0), grosor=0.01), habito2)
    # rosario de cuentas con una cruz rota
    for k in range(18):
        t = k / 17
        p = np.array([-0.25 + 0.5 * t, 0.33 - 0.04 * math.sin(math.pi * t), 1.95 - 0.55 * math.sin(math.pi * t)])
        c.malla(sc.bolita(f'cuenta {k}', p, 0.028, coll, n=1, sub=1), P_('#2A1E16', 'madera', color2='#1A120C'))
    cz = np.array([0.0, 0.34, 1.32])
    c.trazo([cz + np.array([0, 0, 0.1]), cz - np.array([0, 0, 0.12])], 0.022, oro, 0.0)
    c.trazo([cz + np.array([-0.07, 0, 0.04]), cz + np.array([0.04, 0, 0.04])], 0.02, oro, 0.0)
    h = F.pieza('cabeza', (0, 0.05, 2.05), tris=2000)
    hc = np.array([0, 0.1, 2.3])
    toca_f = sf.restar(sdf.round_box(hc + np.array([0, -0.02, 0.0]), (0.27, 0.26, 0.3), 0.2), sdf.ellipsoid(hc + np.array([0, 0.26, -0.05]), (0.2, 0.2, 0.24)), 0.03)
    h.sdf(toca_f, hc - 0.6, hc + 0.6, toca)
    velo = sf.union(sdf.round_box(hc + np.array([0, -0.06, 0.06]), (0.32, 0.3, 0.32), 0.24), sdf.round_cone(hc + np.array([0, -0.12, 0.0]), hc + np.array([0, -0.35, -0.75]),
                                                                                                          0.32, 0.42), k=0.1)
    velo = sf.restar(velo, sdf.round_box(hc + np.array([0, -0.02, 0.0]), (0.28, 0.27, 0.31), 0.21), 0.0)
    velo = sf.restar(velo, sdf.ellipsoid(hc + np.array([0, 0.36, -0.1]), (0.3, 0.25, 0.45)), 0.03)
    velo = sf.cortar(velo, hc + np.array([0, 0, -0.75]), (0, 0, 1), amp=0.1, esc=5, sem=6, dientes=0.06, esc_dientes=18)
    h.sdf(velo, hc - np.array([0.8, 0.8, 1.2]), hc + 0.7, habito2)
    cara = sf.union(sdf.round_box(hc + np.array([0, 0.08, -0.03]), (0.16, 0.15, 0.17), 0.12), k=0.0)
    for s in (-1, 1):
        cara = sf.restar(cara, sdf.ellipsoid(hc + np.array([s * 0.07, 0.22, 0.03]), (0.055, 0.05, 0.06)), 0.015)
    cara = sf.restar(cara, sdf.ellipsoid(hc + np.array([0, 0.25, -0.12]), (0.07, 0.07, 0.08)), 0.02)
    h.sdf(cara, hc - 0.4, hc + 0.4, hueso)
    ojos(h, [hc + np.array([-0.07, 0.2, 0.03]), hc + np.array([0.07, 0.2, 0.03])], 0.032, ojo, coll)
    m = F.pieza('mandibula', hc + np.array([0, 0.1, -0.12]), tris=500)
    piv = hc + np.array([0, 0.1, -0.12])
    R = sc.rot('x', -28)
    m.trazo([rot_en(hc + np.array([-0.12, 0.12, -0.15]), piv, R), rot_en(hc + np.array([-0.08, 0.22, -0.24]), piv, R), rot_en(hc + np.array([0, 0.26, -0.26]), piv, R),
             rot_en(hc + np.array([0.08, 0.22, -0.24]), piv, R), rot_en(hc + np.array([0.12, 0.12, -0.15]), piv, R)], 0.035, hueso)
    sf.fila_dientes(m, 'diente inf', rot_en(hc + np.array([0, 0.24, -0.22]), piv, R), 0.14, 7, 0.03, P_('#C8C0A8', 'hueso'), coll, sentido=1, sem=3)
    for lado, s in LADOS:
        hom = np.array([s * 0.44, 0.02, 1.95])
        a = F.pieza(f'brazo_{lado}', hom, tris=1300)
        codo, mun = np.array([s * 0.75, 0.25, 2.0]), np.array([s * 0.95, 0.5, 2.2])
        manga(a, hom, codo + (codo - hom) * 0.3, 0.14, 0.22, habito, sem=s + 8, rasgado=0.06, dientes=0.04)
        a.trazo([hom, codo, mun], [0.06, 0.045, 0.04], hueso, 0.0)
        d = sc_u(mun - codo)
        for i in range(4):
            t = (i - 1.5) / 1.5
            lat = sc_u(np.cross(d, [0, 0, 1]))
            b = mun + lat * t * 0.06
            a.trazo([b, b + d * 0.15 + lat * t * 0.04 + np.array([0, 0, 0.04]), b + d * 0.3 + lat * t * 0.08 + np.array([0, 0, -0.02])], [0.018, 0.015, 0.008], hueso, 0.008)
    k = F.pieza('cola', (0, -0.1, 0.6), tris=600)
    for j in range(5):
        a = (j - 2) * 0.35
        b = np.array([math.sin(a) * 0.35, -0.1 + math.cos(a) * 0.1, 0.6])
        pts = [b + np.array([math.sin(a) * 0.1 * t, -0.25 * t, -0.5 * t - 0.1 * math.sin(t * 3)]) for t in np.linspace(0, 1, 5)]
        k.malla(sc.tubo(f'estela {j}', pts, [0.12, 0.1, 0.07, 0.04, 0.005], coll, segmentos=6, muestras=2, tapas=('flat', 'point')), habito2)
    F.marca('luz', tuple(hc + np.array([0, 0.25, 0])))
    return F


# ---------------------------------------------------------------------------
# El Gusano de Sangre (minas): sale del suelo, boca redonda llena de dientes, cristales de sangre en el lomo
# ---------------------------------------------------------------------------

@jefe('gusano_sangre')
def gusano_sangre(coll):
    F = nueva('gusano_sangre', voxel=0.028, bioma='minas', sale_del_suelo=1)
    carne = P_('#7A2A30', 'carne', color2='#4A1420', sangre=0.4, semilla=1)
    anillo_pt = P_('#5A1A22', 'carne', color2='#3A0E14', semilla=2)
    roca = P_('#4A3E36', 'piedra', semilla=3, musgo=0.2, var=1.3)
    diente = P_('#E0D4B0', 'hueso', semilla=4)
    cristal = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    garganta = P_('#2A0A0E', 'carne', color2='#1A0408', semilla=5)
    c = F.pieza('cuerpo', (0, 0, 0), tris=3600)
    eje = [np.array([0.0, -0.1 * t * t, 1.9 * t]) for t in np.linspace(0, 1, 8)]
    c.trazo(eje, list(np.linspace(0.85, 0.68, 8)), carne, 0.0)
    for k in range(6):
        p = eje[k + 1] if k + 1 < len(eje) else eje[-1]
        r = 0.86 - 0.025 * k
        sf.cuerda_anillo(c, f'anillo {k}', [p + np.array([math.cos(a) * r, math.sin(a) * r, 0]) for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)], 0.06, anillo_pt,
                         coll)
    # cráter de rocas alrededor de la salida
    rng = np.random.default_rng(3)
    for k in range(14):
        a = 2 * math.pi * k / 14 + rng.uniform(-0.1, 0.1)
        r = rng.uniform(1.0, 1.4)
        p = np.array([math.cos(a) * r, math.sin(a) * r, 0.05])
        c.sdf(sc.sdf_ruido(sdf.round_box(p, (0.28, 0.2, rng.uniform(0.12, 0.3)), 0.08, rot=sc.rot('z', math.degrees(a)) @ sc.rot('x', rng.uniform(-30, 30))), 0.04,
                           5, k), p - 0.6, p + 0.6, roca, 0.0)
    for k in range(9):
        a = k * 0.7 + 2.3
        p = np.array([math.cos(a) * 0.55, -0.6 + math.sin(a) * 0.3, 0.6 + 0.14 * k])
        if math.sin(a) > 0.6:
            continue
        d = sc_u(np.array([math.cos(a) * 0.3, -1, 0.5]))
        c.malla(sc.punta(f'cristal {k}', p, p + d * (0.4 + 0.1 * (k % 3)), 0.11, coll, seg=6, medio=0.9), cristal)
    h = F.pieza('cabeza', (0, -0.1, 1.9), tris=3000)
    top = [np.array([0.0, -0.1 + 0.55 * t * t, 1.9 + 1.0 * t]) for t in np.linspace(0, 1, 6)]
    boca0 = top[-1] + np.array([0, 0.25, 0.15])
    nb0 = sc_u(np.array([0, 0.75, 0.66]))
    tubo_f = sf.restar(sdf.stroke([tuple(p) for p in top], [0.68, 0.66, 0.64, 0.66, 0.74, 0.8]),
                       sdf.round_cone(boca0 - nb0 * 0.55, boca0 + nb0 * 0.4, 0.3, 0.75), 0.05)
    h.sdf(tubo_f, np.min(top, 0) - 1.0, np.max(top, 0) + 1.0, carne)
    for k in range(4):
        p = top[k + 1]
        sf.cuerda_anillo(h, f'anillo cabeza {k}', [p + np.array([math.cos(a) * (0.7 - 0.01 * k), math.sin(a) * (0.7 - 0.01 * k) * 0.95, 0]) for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)],
                         0.055, anillo_pt, coll)
    boca = top[-1] + np.array([0, 0.25, 0.15])
    nb = sc_u(np.array([0, 0.75, 0.66]))
    h.malla(sc.torno('garganta', [(0.0, -0.75), (0.3, -0.5), (0.55, -0.15), (0.62, -0.05)], coll, segmentos=24, centro=tuple(boca), eje=tuple(nb)), garganta)
    u = sc_u(np.cross(nb, [1, 0, 0]))
    w = np.cross(nb, u)
    for ring_i, (r, n, L) in enumerate(((0.62, 18, 0.26), (0.5, 14, 0.22), (0.36, 11, 0.18))):
        for k in range(n):
            a = 2 * math.pi * (k + 0.5 * ring_i) / n
            b = boca + (u * math.cos(a) + w * math.sin(a)) * r - nb * (0.08 + 0.14 * ring_i)
            h.malla(sc.punta(f'diente {ring_i} {k}', b, b - (u * math.cos(a) + w * math.sin(a)) * L * 0.6 + nb * L * 0.3, 0.05 - 0.01 * ring_i, coll, seg=4), diente)
    m = F.pieza('mandibula', tuple(boca), tris=1000)
    for k in range(5):
        a = 2 * math.pi * k / 5 + 0.4
        dirr = u * math.cos(a) + w * math.sin(a)
        b = boca + dirr * 0.62
        tip = b + dirr * 0.5 + nb * 0.4
        m.trazo([b, (b + tip) / 2 + dirr * 0.1, tip], [0.24, 0.16, 0.03], carne, 0.0)
        for q in range(3):
            pp = b + (tip - b) * (0.25 + 0.25 * q)
            m.malla(sc.punta(f'gancho {k} {q}', pp, pp - dirr * 0.14 + nb * 0.05, 0.035, coll, seg=4), diente)
    for lado, s in LADOS:
        a = F.pieza(f'extra_tentaculo_{lado}', (s * 0.6, 0.1, 2.3), tris=500)
        pts = [np.array([s * (0.6 + 0.5 * t), 0.1 + 0.3 * t, 2.3 + 0.4 * math.sin(t * 2.5)]) for t in np.linspace(0, 1, 6)]
        a.trazo(pts, list(np.linspace(0.16, 0.03, 6)), carne, 0.0)
        for q in range(4):
            a.malla(sc.punta(f'pua tentaculo {q}', pts[q + 1], pts[q + 1] + np.array([0, 0, 0.12]), 0.04, coll, seg=4), diente)
    F.marca('luz', tuple(boca))
    return F


# ---------------------------------------------------------------------------
# El Obispo Hueco (abadía): mitra dorada, casulla roja quemada, pecho abierto con un corazón en llamas, báculo
# ---------------------------------------------------------------------------

@jefe('obispo_hueco')
def obispo_hueco(coll):
    F = nueva('obispo_hueco', voxel=0.02, bioma='abadia')
    rojo = P_('#4A0C12', 'tela', semilla=1, sangre=0.3)
    blanco = P_('#2A2422', 'tela', semilla=2, barro=0.6)
    oro = P_('#B08A3A', 'oro', semilla=3)
    vacio = P_('#08060A', 'liso')
    hueso = P_('#D2C6A2', 'hueso', semilla=4)
    fuego = P_('#FF6A1A', 'brillo', mat='brillo_fuego')
    ambar = P_('#FFAA33', 'brillo', mat='brillo_ambar')
    c = F.pieza('cuerpo', (0, 0, 1.0), tris=3800)
    torso = sf.union(sdf.round_cone((0, 0.0, 1.0), (0, 0.05, 1.65), 0.36, 0.42), sdf.ellipsoid((0, 0.04, 1.72), (0.55, 0.32, 0.16)), k=0.1)
    pecho = sdf.ellipsoid((0, 0.36, 1.45), (0.22, 0.2, 0.26))
    c.sdf(sf.restar(torso, pecho, 0.04), (-0.8, -0.6, 0.7), (0.8, 0.6, 2.0), blanco)
    casulla = sf.intersect(sf.cascaron(torso, 0.03), sf.union(sdf.round_box((0, 0.35, 1.3), (0.35, 0.3, 0.6), 0.05), sdf.round_box((0, -0.35, 1.3), (0.4, 0.3, 0.6), 0.05)))
    casulla = sf.restar(casulla, pecho, 0.04)
    casulla = sf.agujero(casulla, (-0.25, 0.4, 1.1), (0.1, 0.1, 0.09), amp=0.03, sem=3)
    casulla = sf.agujero(casulla, (0.3, -0.42, 1.5), (0.12, 0.1, 0.1), amp=0.03, sem=4)
    c.sdf(casulla, (-0.8, -0.8, 0.6), (0.8, 0.8, 2.0), rojo)
    tunica_larga(c, 1.1, 0.05, 0.4, 0.62, blanco, sem=6, rasgado=0.08, dientes=0.05)
    tunica_larga(c, 1.15, 0.45, 0.43, 0.62, rojo, sem=7, rasgado=0.1, dientes=0.06)
    for x in (-0.12, 0.12):
        pts = sf.hacia(torso, (0, 0.05, 1.3), (x, 1, 0.8))[0], sf.hacia(torso, (0, 0.05, 1.3), (x, 1, -0.7))[0]
        if pts[0] is not None and pts[1] is not None:
            c.malla(sc.tubo(f'galon {x}', [pts[0] + np.array([0, 0.035, 0]), pts[1] + np.array([0, 0.035, 0])], 0.03, coll, segmentos=4, muestras=1, perfil=(1.6, 0.5)), oro)
    for z in (1.33, 1.45, 1.57):
        for s in (-1, 1):
            sf.costilla(c, sdf.ellipsoid((0, 0.1, 1.45), (0.3, 0.28, 0.3)), z, s, 130, 175, hueso, r=0.03, centro=(0, 0.1, 0), sale=0.0, n=4)
    c.bola((0, 0.3, 1.45), 0.11, fuego, 0.0)
    for k in range(5):
        a = k * 1.25
        c.malla(sc.punta(f'llama corazon {k}', (math.cos(a) * 0.06, 0.3 + math.sin(a) * 0.04, 1.5), (math.cos(a) * 0.08, 0.33 + math.sin(a) * 0.05, 1.68 + 0.04 * (k % 2)),
                         0.05, coll, seg=5), ambar)
    F.marca('luz', (0, 0.3, 1.45))
    h = F.pieza('cabeza', (0, 0.04, 1.78), tris=1600)
    hc = np.array([0, 0.08, 2.0])
    cap = sf.union(sdf.round_box(hc, (0.22, 0.2, 0.22), 0.16), k=0.0)
    cap = sf.restar(cap, sdf.ellipsoid(hc + np.array([0, 0.22, -0.02]), (0.16, 0.14, 0.17)), 0.03)
    h.sdf(cap, hc - 0.5, hc + 0.5, blanco)
    h.bola(hc + np.array([0, 0.05, -0.02]), (0.16, 0.12, 0.17), vacio, 0.0)
    ojos(h, [hc + np.array([-0.06, 0.15, 0.02]), hc + np.array([0.06, 0.15, 0.02])], 0.03, ambar, coll)
    # mitra de dos picos (la de los obispos), con la cruz dorada
    for s, y in ((1, 0.08), (-1, -0.08)):
        mit = sf.intersect(sdf.round_box(hc + np.array([0, y, 0.42]), (0.2, 0.06, 0.3), 0.03), sdf.round_cone(hc + np.array([0, y, 0.15]), hc + np.array([0, y, 0.78]), 0.26, 0.01))
        h.sdf(mit, hc - 0.5, hc + np.array([0.5, 0.5, 0.9]), oro if s > 0 else rojo, 0.0)
    h.trazo([hc + np.array([0, 0.15, 0.3]), hc + np.array([0, 0.15, 0.55])], 0.022, P_('#D8B860', 'oro', semilla=8), 0.0)
    h.trazo([hc + np.array([-0.07, 0.15, 0.47]), hc + np.array([0.07, 0.15, 0.47])], 0.02, P_('#D8B860', 'oro', semilla=8), 0.0)
    for s in (-1, 1):
        h.malla(sf.tira(f'infula {s}', [hc + np.array([s * 0.12, -0.2, 0.2]), hc + np.array([s * 0.14, -0.26, -0.1]), hc + np.array([s * 0.15, -0.28, -0.45])], 0.1, coll,
                        normal=(0, -1, 0), grosor=0.012), oro)
    for lado, s in LADOS:
        hom = np.array([s * 0.52, 0.02, 1.68])
        a = F.pieza(f'brazo_{lado}', hom, tris=1400)
        codo, mun = np.array([s * 0.62, 0.25, 1.35]), np.array([s * 0.55, 0.55, 1.3])
        manga(a, hom, mun, 0.14, 0.22, rojo, sem=s + 9, rasgado=0.06, dientes=0.04)
        mano_garra(a, mun + (mun - codo) * 0.1, mun - codo, hueso, P_('#1A1612', 'liso'), coll, f'mano {lado}', tam=2.4)
        if s > 0:
            g = mun + np.array([0, 0.12, 0])
            a.trazo([g + np.array([0, 0, -1.25]), g, g + np.array([0, 0.02, 0.9])], [0.035, 0.038, 0.032], oro, 0.0)
            t = g + np.array([0, 0.02, 0.9])
            a.trazo([t, t + np.array([0, 0.12, 0.2]), t + np.array([0, 0.3, 0.2]), t + np.array([0, 0.34, 0.05]), t + np.array([0, 0.26, -0.02])],
                    [0.035, 0.035, 0.03, 0.028, 0.02], oro, 0.0)
            a.bola(t + np.array([0, 0.2, 0.12]), 0.06, fuego, 0.0)
            for q in range(3):
                a.malla(sc.punta(f'llama baculo {q}', t + np.array([0, 0.2 + 0.03 * (q - 1), 0.15]), t + np.array([0.0, 0.2 + 0.05 * (q - 1), 0.32 + 0.05 * (q % 2)]), 0.04,
                                 coll, seg=5), ambar)
    for lado, s in LADOS:
        cad = np.array([s * 0.2, 0.0, 0.95])
        p = F.pieza(f'pierna_{lado}', cad, tris=400)
        tob = np.array([s * 0.22, 0.06, 0.12])
        p.cono(cad, tob, 0.16, 0.12, blanco, 0.0)
        p.bola(tob + np.array([0, 0.12, -0.07]), (0.13, 0.2, 0.07), rojo, 0.03)
    return F


# ---------------------------------------------------------------------------
# El Conde Sangrevil (castillo): señor vampiro, capa enorme (extra_capa) y alas de la fase 2 (extra_alas)
# ---------------------------------------------------------------------------

@jefe('conde')
def conde(coll):
    F = nueva('conde', voxel=0.018, bioma='castillo', fases=2)
    negro = P_('#16101A', 'tela', semilla=1)
    carmesi = P_('#6A0A12', 'tela', semilla=2, sangre=0.2)
    oro = P_('#B08A3A', 'oro', semilla=3)
    placa = P_('#2A2228', 'hierro', semilla=4, var=0.7)
    piel = P_('#D0C8D0', 'carne', color2='#8A7A8E', semilla=5)
    pelo = P_('#D8D4D8', 'pelo', color2='#A8A4B0', semilla=6)
    colm = P_('#F4ECE0', 'liso')
    membrana = P_('#3A1420', 'cuero', semilla=7)
    hueso_ala = P_('#1E1418', 'cuero', semilla=8)
    rubi = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    hoja = P_('#6A1418', 'hierro', semilla=9)
    c = F.pieza('cuerpo', (0, 0, 1.05), tris=3600)
    torso = sf.union(sdf.round_cone((0, 0.0, 1.05), (0, 0.04, 1.7), 0.3, 0.36), sdf.ellipsoid((0, 0.03, 1.74), (0.5, 0.3, 0.14)), k=0.1)
    c.sdf(torso, (-0.8, -0.6, 0.8), (0.8, 0.6, 2.0), negro)
    peto = sf.intersect(sf.cascaron(torso, 0.025), sdf.round_box((0, 0.3, 1.45), (0.26, 0.2, 0.3), 0.05))
    c.sdf(peto, (-0.5, 0.0, 1.0), (0.5, 0.6, 1.9), placa)
    for k in range(4):
        z = 1.25 + 0.12 * k
        pts = sf.hacia(torso, (0, 0.04, z), (-0.5, 1, 0))[0], sf.hacia(torso, (0, 0.04, z), (0.5, 1, 0))[0]
        if pts[0] is not None and pts[1] is not None:
            c.malla(sc.tubo(f'filete oro {k}', [pts[0] + np.array([0, 0.04, 0]), (pts[0] + pts[1]) / 2 + np.array([0, 0.07, -0.03]), pts[1] + np.array([0, 0.04, 0])], 0.012,
                            coll, segmentos=4, muestras=2), oro)
    c.malla(sc.bolita('rubi pecho', (0, 0.4, 1.62), (0.06, 0.03, 0.07), coll, n=2), rubi)
    falda = sf.cortar(sf.restar(sdf.round_cone((0, -0.02, 1.15), (0, -0.05, 0.35), 0.34, 0.5), sdf.round_box((0, 0.5, 0.7), (0.14, 0.3, 0.6), 0.03), 0.04), (0, 0, 0.38), (0, 0, 1), 0.04,
                      10, 3, 0.03)
    c.sdf(sf.restar(falda, sdf.round_cone((0, -0.02, 1.1), (0, -0.05, 0.3), 0.3, 0.46)), (-0.8, -0.8, 0.2), (0.8, 0.8, 1.3), negro)
    sf.cuerda_anillo(c, 'cinturon', sf.anillo(torso, (0, 0.03, 1.12), (0, 0, 1), 1.0, 26, 0.03), 0.035, P_('#1A1210', 'cuero'), coll)
    c.caja((0, 0.42, 1.12), (0.08, 0.025, 0.06), 0.02, oro, 0.0)
    for s in (-1, 1):
        cu = sdf.round_box((s * 0.24, -0.16, 2.08), (0.24, 0.025, 0.3), 0.02, rot=sc.rot('z', s * 22) @ sc.rot('x', 12))
        c.sdf(cu, (-0.7, -0.6, 1.6), (0.7, 0.3, 2.5), carmesi)
        c.malla(sc.punta(f'punta cuello {s}', (s * 0.45, -0.25, 2.25), (s * 0.55, -0.3, 2.5), 0.05, coll, seg=4), negro)
    h = F.pieza('cabeza', (0, 0.04, 1.85), tris=1800)
    hc = np.array([0, 0.08, 2.08])
    cab = sf.union(sdf.round_box(hc, (0.19, 0.19, 0.21), 0.14), sdf.ellipsoid(hc + np.array([0, 0.09, -0.15]), (0.13, 0.1, 0.08)), k=0.05)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.075, 0.19, 0.02]), (0.045, 0.03, 0.03)), 0.012)
    h.sdf(cab, hc - 0.4, hc + 0.4, piel)
    for s in (-1, 1):
        h.sdf(sdf.round_cone(hc + np.array([s * 0.17, 0.0, 0.0]), hc + np.array([s * 0.3, -0.05, 0.13]), 0.05, 0.006), hc - 0.5, hc + 0.5, piel, 0.015)
    pel = sf.intersect(sf.cascaron(cab, 0.03), sf.union(sdf.plane(hc + np.array([0, 0, 0.08]), (0, 0, -1)), sdf.plane(hc + np.array([0, -0.04, 0]), (0, 1, 0))))
    pel = sf.restar(pel, sdf.round_cone(hc + np.array([0, 0.35, 0.12]), hc + np.array([0, 0.18, 0.04]), 0.09, 0.008), 0.03)
    pel = sf.union(pel, sdf.round_cone(hc + np.array([0, -0.12, 0.0]), hc + np.array([0, -0.2, -0.4]), 0.17, 0.12), k=0.05)
    h.sdf(pel, hc - np.array([0.5, 0.6, 0.8]), hc + 0.5, pelo)
    ojos(h, [hc + np.array([-0.075, 0.175, 0.02]), hc + np.array([0.075, 0.175, 0.02])], 0.026, rubi, coll)
    for s in (-1, 1):
        sf.diente(h, f'colmillo {s}', hc + np.array([s * 0.035, 0.2, -0.16]), hc + np.array([s * 0.033, 0.21, -0.23]), 0.014, colm, coll)
    # corona de púas
    for k in range(9):
        a = 2 * math.pi * k / 9
        b = hc + np.array([math.cos(a) * 0.2, math.sin(a) * 0.2 - 0.02, 0.2])
        h.malla(sc.punta(f'pua corona {k}', b, b + np.array([math.cos(a) * 0.04, math.sin(a) * 0.04, 0.12 + 0.06 * (k % 2)]), 0.03, coll, seg=4), oro)
    sf.cuerda_anillo(h, 'aro corona', [hc + np.array([math.cos(a) * 0.205, math.sin(a) * 0.205 - 0.02, 0.2]) for a in np.linspace(0, 2 * math.pi, 18, endpoint=False)], 0.025, oro,
                     coll)
    h.malla(sc.bolita('rubi corona', hc + np.array([0, 0.2, 0.22]), 0.03, coll, n=2), rubi)
    for lado, s in LADOS:
        hom = np.array([s * 0.48, 0.02, 1.7])
        a = F.pieza(f'brazo_{lado}', hom, tris=1500 if s > 0 else 1100)
        codo, mun = np.array([s * 0.6, 0.2, 1.38]), np.array([s * 0.55, 0.48, 1.35])
        manga(a, hom, mun, 0.12, 0.13, negro, sem=s + 2, rasgado=0.0, dientes=0.0)
        a.cono(mun - (mun - codo) * 0.05, mun + (mun - codo) * 0.12, 0.14, 0.15, carmesi, 0.0)
        hp = hom + np.array([s * 0.04, 0, 0.07])
        a.sdf(sf.cortar(sf.restar(sdf.ellipsoid(hp, (0.22, 0.2, 0.13)), sdf.ellipsoid(hp + np.array([0, 0, -0.03]), (0.2, 0.18, 0.12))), hp + np.array([0, 0, -0.03]), (0, 0, 1),
                        0.01, 10, 4), hp - 0.3, hp + 0.3, placa)
        for j in range(3):
            b = hp + np.array([s * 0.08, -0.1 + 0.1 * j, 0.08])
            a.malla(sc.punta(f'pua hombrera {j}', b, b + np.array([s * 0.08, 0.0, 0.16]), 0.035, coll, seg=4), oro)
        mano_garra(a, mun + (mun - codo) * 0.2, mun - codo, piel, P_('#2A0A10', 'liso'), coll, f'mano {lado}', tam=2.0, curva=1.0)
        if s > 0:
            g = mun + (mun - codo) * 0.32
            a.trazo([g + np.array([0, 0, -0.1]), g + np.array([0, 0, 0.08])], 0.026, P_('#1A1210', 'cuero'), 0.0)
            a.trazo([g + np.array([-0.15, 0, 0.1]), g + np.array([0, 0.02, 0.12]), g + np.array([0.15, 0, 0.1])], 0.022, oro, 0.0)
            import sangre_armas as sa
            sa.hoja_rombo(a, 'espada sangre', g + np.array([0, 0, 0.12]), (0, 0.2, 1), (0, 1, 0), 1.0, 0.09, 0.025, hoja, coll, punta=0.2, estrecha=0.3)
            F.marca('punta', tuple(g + np.array([0, 0.2, 1.1])))
    for lado, s in LADOS:
        cad = np.array([s * 0.18, 0.0, 1.0])
        p = F.pieza(f'pierna_{lado}', cad, tris=600)
        rod, tob = np.array([s * 0.2, 0.06, 0.55]), np.array([s * 0.2, 0.0, 0.15])
        p.trazo([cad, rod, tob], [0.15, 0.12, 0.11], negro, 0.0)
        bota_f = sf.union(sdf.round_cone(tob + np.array([0, 0, -0.04]), rod + np.array([0, 0.02, 0.06]), 0.13, 0.15),
                          sdf.round_box(tob + np.array([0, 0.12, -0.09]), (0.11, 0.2, 0.06), 0.05), k=0.05)
        p.sdf(bota_f, tob - 0.4, rod + 0.3, placa)
        p.malla(sc.punta('pua rodilla', rod + np.array([0, 0.14, 0.06]), rod + np.array([0, 0.25, 0.1]), 0.045, coll, seg=4), oro)
    # capa enorme (pieza aparte, se mece desde los hombros)
    cp = F.pieza('extra_capa', (0, -0.25, 1.85), tris=1400)
    capa_lamina(cp, 'capa', 1.95, -0.32, 0.5, 1.0, 0.1, negro, coll, filas=12, cols=16, rasgado=0.18, sem=7, curva=0.28, huecos=2)
    capa_lamina(cp, 'forro capa', 1.92, -0.29, 0.48, 0.96, 0.14, carmesi, coll, filas=10, cols=13, rasgado=0.14, sem=8, curva=0.26, huecos=0)
    # alas de murciélago de la fase 2 (escondidas al empezar)
    al = F.pieza('extra_alas', (0, -0.3, 1.75), tris=2600)
    for s in (-1, 1):
        piv = np.array([s * 0.2, -0.3, 1.75])
        cod = piv + np.array([s * 0.7, -0.2, 0.75])
        al.trazo([piv, cod], [0.08, 0.05], hueso_ala, 0.0)
        puntas = [cod + np.array([s * 1.2, -0.1, 0.3]), cod + np.array([s * 1.3, -0.2, -0.45]), cod + np.array([s * 0.85, -0.25, -1.1]), cod + np.array([s * 0.25, -0.25, -1.4])]
        for j, q in enumerate(puntas):
            al.trazo([cod, (cod + q) / 2 + np.array([0, 0, 0.06]), q], [0.045, 0.03, 0.01], hueso_ala, 0.0)
        al.malla(sc.punta(f'garra ala {s}', cod, cod + np.array([s * 0.05, 0.08, 0.22]), 0.05, coll, seg=5), oro)
        borde = [piv + np.array([0, 0, -0.5])] + puntas[::-1]
        poly = [piv + np.array([0, 0, -0.5])]
        for i in range(len(borde) - 1):
            a0, a1 = borde[i], borde[i + 1]
            poly += [a0 + (a1 - a0) * 0.5 + (cod - (a0 + a1) / 2) * 0.2, a1]
        poly += [cod, piv]
        al.malla(sf.poligono(f'membrana {s}', poly, 0.02, coll), membrana)
    F.marca('luz', tuple(hc + np.array([0, 0.2, 0])))
    return F
