"""Enemigos de la abadía y del castillo, y el caballero de la muerte (se registran en sangre_enemigos.ENEMIGOS)."""
import math

import numpy as np

import sangre_comun as sc
import sangre_formas as sf
import sdf
from sangre_comun import P_
from sangre_enemigos import LADOS, enemigo, mano_garra, nueva, ojos, rot_en
from sangre_enemigos2 import bota, capa_lamina, manga, pata_garra, sc_u, tunica_larga


def capucha_redonda(pz, hc, r, pt, y_cara=0.11, caida=0.16, k=0.0):
    """Capucha redonda que cae hacia atrás sobre la espalda, con la abertura de la cara."""
    hc = np.asarray(hc, float)
    cap = sf.union(sdf.ellipsoid(hc + np.array([0, -0.01, 0.01]), (r * 1.1, r * 1.12, r * 1.05)),
                   sdf.round_cone(hc + np.array([0, -0.06, -0.02]), hc + np.array([0, -caida, -0.2]), r * 0.85, r * 0.45), k=0.06)
    cap = sf.restar(cap, sdf.ellipsoid(hc + np.array([0, 0, 0]), (r * 0.98, r * 1.0, r * 0.93)), 0.0)
    cap = sf.restar(cap, sdf.ellipsoid(hc + np.array([0, y_cara + 0.04, -0.02]), (r * 0.72, r * 0.6, r * 0.78)), 0.02)
    pz.sdf(cap, hc - 0.4, hc + 0.4, pt, k)
    return cap


def cara_calavera(pz, hc, r, pt_piel, pt_ojo, coll, dientes=None):
    """Cara chupada (casi calavera) metida dentro de una capucha."""
    hc = np.asarray(hc, float)
    f = sf.union(sdf.round_box(hc, (r * 0.8, r * 0.85, r * 0.85), r * 0.55), sdf.ellipsoid(hc + np.array([0, r * 0.45, -r * 0.6]), (r * 0.55, r * 0.4, r * 0.3)),
                 k=0.03)
    for s in (-1, 1):
        f = sf.restar(f, sdf.ellipsoid(hc + np.array([s * r * 0.38, r * 0.78, r * 0.05]), (r * 0.26, r * 0.25, r * 0.24)), 0.01)
    f = sf.restar(f, sdf.ellipsoid(hc + np.array([0, r * 0.9, -r * 0.3]), (r * 0.1, r * 0.15, r * 0.14)), 0.005)
    pz.sdf(f, hc - 0.3, hc + 0.3, pt_piel)
    ojos(pz, [hc + np.array([-r * 0.38, r * 0.66, r * 0.05]), hc + np.array([r * 0.38, r * 0.66, r * 0.05])], r * 0.13, pt_ojo, coll)
    if dientes is not None:
        sf.fila_dientes(pz, 'diente cara', hc + np.array([0, r * 0.82, -r * 0.62]), r * 0.7, 7, r * 0.15, dientes, coll, sentido=-1, sem=5)


def mano_huesuda(pz, mun, d, pt, coll, nombre, tam=1.0):
    return mano_garra(pz, mun, d, pt, P_('#1A1612', 'liso'), coll, nombre, tam=tam)


# ---------------------------------------------------------------------------
# Monje caído (abadía)
# ---------------------------------------------------------------------------

@enemigo('monje_caido')
def monje_caido(coll):
    F = nueva('monje_caido', voxel=0.01, bioma='abadia')
    habito = P_('#4E3B2A', 'tela', barro=0.9, semilla=1)
    habito2 = P_('#3A2C20', 'tela', semilla=2)
    piel = P_('#9A9488', 'carne', color2='#5A4E4A')
    cuerda = P_('#8A7450', 'cuero', semilla=3)
    cuenta = P_('#2A1E16', 'madera', color2='#1A120C')
    cera = P_('#E8DCB8', 'cera')
    llama = P_('#FFAA33', 'brillo', mat='brillo_ambar')
    libro = P_('#3A1414', 'cuero', semilla=4)
    ojo = P_('#FFAA33', 'brillo', mat='brillo_ambar')
    madera = P_('#6A4A2C', 'madera', color2='#3E2816')
    c = F.pieza('cuerpo', (0, 0, 0.45), tris=1300)
    torso = sf.union(sdf.round_cone((0, -0.02, 0.48), (0, 0.06, 0.74), 0.17, 0.19), sdf.ellipsoid((0, 0.02, 0.78), (0.23, 0.16, 0.08)),
                     sdf.ellipsoid((0, -0.06, 0.78), (0.17, 0.12, 0.1)), k=0.06)
    c.sdf(torso, (-0.35, -0.3, 0.35), (0.35, 0.3, 0.92), habito)
    tunica_larga(c, 0.55, 0.06, 0.2, 0.3, habito, sem=3, rasgado=0.05, dientes=0.03)
    sf.cuerda_anillo(c, 'cordon', sf.anillo(torso, (0, 0.02, 0.52), (0, 0, 1), 0.6, 20, 0.02), 0.014, cuerda, coll)
    p0 = np.array([0.12, 0.17, 0.5])
    for k in range(9):
        p = p0 + np.array([0.01 * math.sin(k), 0.02 + 0.004 * k, -0.035 * k])
        c.malla(sc.bolita(f'cuenta {k}', p, 0.014, coll, n=1, sub=1), cuenta)
    cruz = p0 + np.array([0.01, 0.06, -0.34])
    c.trazo([cruz + np.array([0, 0, 0.05]), cruz - np.array([0, 0, 0.04])], 0.01, madera, 0.0)
    c.trazo([cruz + np.array([-0.03, 0, 0.02]), cruz + np.array([0.0, 0, 0.02])], 0.009, madera, 0.0)  # brazo roto
    h = F.pieza('cabeza', (0, 0.08, 0.82), tris=800)
    hc = np.array([0, 0.12, 0.93])
    capucha_redonda(h, hc, 0.15, habito2)
    cara_calavera(h, hc + np.array([0, 0.02, -0.01]), 0.115, piel, ojo, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.22, 0.03, 0.78])
        a = F.pieza(f'brazo_{lado}', hom, tris=520)
        codo, mun = np.array([s * 0.26, 0.17, 0.62]), np.array([s * 0.2, 0.32, 0.6])
        manga(a, hom, mun + (mun - codo) * 0.1, 0.075, 0.11, habito, sem=s + 6, rasgado=0.025)
        mano_huesuda(a, mun + (mun - codo) * 0.15, mun - codo, piel, coll, f'mano {lado}', tam=1.15)
        if s > 0:
            vb = mun + np.array([0, 0.09, 0.02])
            a.cono(vb, vb + np.array([0, 0, 0.12]), 0.022, 0.02, cera, 0.0)
            for q in range(3):
                ang = q * 2.0
                a.trazo([vb + np.array([math.cos(ang) * 0.02, math.sin(ang) * 0.02, 0.11]), vb + np.array([math.cos(ang) * 0.024, math.sin(ang) * 0.024,
                                                                                                       0.04 - 0.02 * q])], [0.007, 0.005], cera, 0.004)
            a.malla(sc.punta('llama vela', vb + np.array([0, 0, 0.125]), vb + np.array([0, 0, 0.19]), 0.016, coll, seg=5), llama)
            F.marca('llama', tuple(vb + np.array([0, 0, 0.15])))
        else:
            lb = mun + np.array([0, 0.08, 0.0])
            a.caja(lb, (0.07, 0.025, 0.09), 0.008, libro, 0.0)
            a.caja(lb + np.array([0.004, 0, 0]), (0.066, 0.021, 0.086), 0.004, P_('#B8A880', 'tela', sangre=0.3), 0.0)
    for lado, s in LADOS:
        cad = np.array([s * 0.09, 0.0, 0.45])
        p = F.pieza(f'pierna_{lado}', cad, tris=200)
        tob = np.array([s * 0.1, 0.05, 0.06])
        p.cono(cad, tob, 0.06, 0.045, habito2, 0.0)
        p.bola(tob + np.array([0, 0.06, -0.03]), (0.05, 0.08, 0.025), piel, 0.01)
        p.caja(tob + np.array([0, 0.05, -0.055]), (0.055, 0.09, 0.008), 0.006, P_('#3A2618', 'cuero'), 0.0)
    return F


# ---------------------------------------------------------------------------
# Gárgola de piedra (abadía)
# ---------------------------------------------------------------------------

@enemigo('gargola')
def gargola(coll):
    F = nueva('gargola', voxel=0.011, bioma='abadia')
    piedra = P_('#6E6C66', 'piedra', musgo=0.7, semilla=1)
    piedra2 = P_('#5A5852', 'piedra', musgo=0.4, semilla=2)
    membrana = P_('#4E4C48', 'piedra', semilla=3, var=0.6)
    ojo = P_('#FF6A1A', 'brillo', mat='brillo_fuego')
    c = F.pieza('cuerpo', (0, 0, 0.5), tris=1300)
    torso = sf.union(sdf.ellipsoid((0, 0.08, 0.72), (0.26, 0.22, 0.24)), sdf.round_cone((0, -0.02, 0.5), (0, 0.06, 0.66), 0.17, 0.2), k=0.08)
    c.sdf(sc.sdf_ruido(torso, 0.01, 12, 1), (-0.4, -0.3, 0.3), (0.4, 0.4, 1.0), piedra)
    for k in range(5):
        p = np.array([0, -0.05 - 0.02 * k, 0.9 - 0.08 * k])
        sf.diente(c, f'pua lomo {k}', p, p + np.array([0, -0.07, 0.05]), 0.025, piedra2, coll)
    h = F.pieza('cabeza', (0, 0.18, 0.88), tris=900)
    hc = np.array([0, 0.28, 0.95])
    cab = sf.union(sdf.ellipsoid(hc, (0.13, 0.13, 0.11)), sdf.round_cone(hc + np.array([0, 0.06, -0.03]), hc + np.array([0, 0.19, -0.06]), 0.08, 0.05),
                   sdf.ellipsoid(hc + np.array([0, 0.08, 0.05]), (0.12, 0.05, 0.03)), k=0.04)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.055, 0.12, 0.025]), (0.03, 0.025, 0.02)), 0.01)
    cab = sf.restar(cab, sdf.round_box(hc + np.array([0, 0.17, -0.09]), (0.06, 0.05, 0.015), 0.01), 0.006)
    h.sdf(sc.sdf_ruido(cab, 0.006, 20, 2), hc - 0.3, hc + 0.3, piedra)
    ojos(h, [hc + np.array([-0.055, 0.11, 0.025]), hc + np.array([0.055, 0.11, 0.025])], 0.017, ojo, coll)
    for s in (-1, 1):
        sf.cuerno(h, f'cuerno {s}', [hc + np.array([s * 0.07, 0.0, 0.08]), hc + np.array([s * 0.14, -0.08, 0.18]), hc + np.array([s * 0.15, -0.2, 0.16]),
                                     hc + np.array([s * 0.12, -0.27, 0.08])], 0.035, piedra2, coll)
        h.sdf(sdf.round_cone(hc + np.array([s * 0.11, -0.02, 0.02]), hc + np.array([s * 0.22, -0.06, 0.06]), 0.03, 0.005), hc - 0.35, hc + 0.35, piedra, 0.01)
        for j in range(2):
            b = hc + np.array([s * (0.03 + 0.015 * j), 0.2 - 0.02 * j, -0.08])
            sf.diente(h, f'colmillo {s} {j}', b, b + np.array([0, 0.005, -0.045 + 0.01 * j]), 0.01, P_('#9A968C', 'piedra', semilla=5), coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.24, 0.1, 0.82])
        a = F.pieza(f'brazo_{lado}', hom, tris=420)
        codo, mun = np.array([s * 0.32, 0.22, 0.58]), np.array([s * 0.27, 0.4, 0.4])
        a.trazo([hom, codo, mun], [0.07, 0.055, 0.045], piedra, 0.0)
        mano_garra(a, mun, mun - codo, piedra, piedra2, coll, f'mano {lado}', tam=1.6)
        w = F.pieza(f'ala_{lado}', (s * 0.12, -0.1, 0.86), tris=520)
        piv = np.array([s * 0.12, -0.1, 0.86])
        cod = piv + np.array([s * 0.25, -0.1, 0.32])
        w.trazo([piv, cod], [0.04, 0.03], piedra, 0.0)
        puntas = [cod + np.array([s * 0.35, -0.05, 0.1]), cod + np.array([s * 0.36, -0.1, -0.2]), cod + np.array([s * 0.2, -0.1, -0.45])]
        for j, q in enumerate(puntas):
            w.trazo([cod, (cod + q) / 2 + np.array([0, 0, 0.03]), q], [0.025, 0.018, 0.008], piedra2, 0.0)
        sf.diente(w, 'garra ala', cod, cod + np.array([s * 0.02, 0.03, 0.09]), 0.022, piedra2, coll)
        borde = [piv + np.array([0, 0.0, -0.18]), puntas[2], puntas[1], puntas[0]]
        poly = [cod]
        for i in range(len(borde) - 1):
            a0, a1 = borde[i], borde[i + 1]
            poly += [a0, a0 + (a1 - a0) * 0.5 + (cod - (a0 + a1) / 2) * 0.22]
        poly += [puntas[0], cod + np.array([0, 0.005, 0.0])]
        w.malla(sf.poligono('membrana', [piv + np.array([0, 0, -0.18])] + poly[1:] + [cod, piv], 0.012, coll), membrana)
    for lado, s in LADOS:
        cad = np.array([s * 0.13, -0.02, 0.5])
        p = F.pieza(f'pierna_{lado}', cad, tris=380)
        rod, hock, pie = np.array([s * 0.18, 0.2, 0.35]), np.array([s * 0.17, -0.06, 0.16]), np.array([s * 0.16, 0.02, 0.04])
        p.trazo([cad, rod, hock, pie], [0.1, 0.06, 0.045, 0.04], piedra, 0.0)
        pata_garra(p, pie + np.array([0, 0.03, -0.01]), (0, 1, 0), 3, 0.06, 0.02, piedra, piedra2, coll, 'garra pie')
    k = F.pieza('cola', (0, -0.18, 0.5), tris=320)
    pts = [np.array([0.06 * math.sin(t * 4), -0.18 - t * 0.45, 0.5 - t * 0.42 + 0.1 * math.sin(t * 3)]) for t in np.linspace(0, 1, 7)]
    k.trazo(pts, list(np.linspace(0.05, 0.015, 7)), piedra, 0.0)
    e = pts[-1]
    k.sdf(sdf.round_box(e + np.array([0, -0.04, 0]), (0.05, 0.05, 0.01), 0.008, rot=sc.rot('z', 45)), e - 0.15, e + 0.15, piedra2, 0.01)
    return F


# ---------------------------------------------------------------------------
# Inquisidor no muerto (abadía): máscara de hierro, capelina roja, tabardo con sol de oro, hierro de marcar al rojo
# ---------------------------------------------------------------------------

@enemigo('inquisidor_muerto')
def inquisidor_muerto(coll):
    F = nueva('inquisidor_muerto', voxel=0.01, bioma='abadia')
    negro = P_('#22191A', 'tela', semilla=1, barro=0.5)
    rojo = P_('#6E1414', 'tela', semilla=2, sangre=0.3)
    oro = P_('#A57D36', 'oro', semilla=3)
    hierro = P_('#4E5056', 'hierro', semilla=4)
    piel = P_('#8A8478', 'carne', color2='#4A3E3A')
    brasa = P_('#FF6A1A', 'brillo', mat='brillo_fuego')
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    madera = P_('#4A3220', 'madera', color2='#2A1A10')
    c = F.pieza('cuerpo', (0, 0, 0.48), tris=1400)
    torso = sf.union(sdf.round_cone((0, -0.02, 0.5), (0, 0.04, 0.78), 0.17, 0.19), sdf.ellipsoid((0, 0.02, 0.82), (0.23, 0.15, 0.08)), k=0.06)
    c.sdf(torso, (-0.35, -0.3, 0.35), (0.35, 0.3, 0.95), negro)
    tunica_larga(c, 0.56, 0.05, 0.2, 0.3, negro, sem=4, rasgado=0.03, dientes=0.02)
    tab = sf.intersect(sf.union(sf.cascaron(torso, 0.016), sdf.round_cone((0, 0.0, 0.55), (0, 0.0, 0.1), 0.215, 0.31)),
                       sdf.round_box((0, 0.3, 0.45), (0.11, 0.2, 0.42), 0.02))
    tab = sf.restar(tab, sdf.round_cone((0, 0.0, 0.55), (0, 0.0, 0.1), 0.2, 0.29), 0.0)
    c.sdf(sf.cortar(tab, (0, 0, 0.12), (0, 0, 1), 0.03, 12, 5, 0.02), (-0.2, 0.0, 0.0), (0.2, 0.45, 0.95), rojo)
    sol, nsol = sf.hacia(torso, (0, 0.03, 0.68), (0, 1, 0), 0.03)
    if sol is not None:
        c.bola(sol, (0.05, 0.016, 0.05), oro, 0.0)
        for k in range(8):
            a = 2 * math.pi * k / 8
            c.malla(sc.punta(f'rayo sol {k}', sol + np.array([math.cos(a) * 0.04, 0.0, math.sin(a) * 0.04]), sol + np.array([math.cos(a) * 0.085, 0.005,
                                                                                                                          math.sin(a) * 0.085]), 0.012, coll,
                             seg=4), oro)
    # capelina roja sobre los hombros
    cap = sf.cortar(sf.restar(sdf.round_cone((0, 0.0, 0.86), (0, 0.0, 0.66), 0.17, 0.3), sdf.round_cone((0, 0.0, 0.88), (0, 0.0, 0.64), 0.15, 0.28)),
                    (0, 0, 0.68), (0, 0, 1), 0.02, 18, 6, 0.012)
    c.sdf(cap, (-0.4, -0.4, 0.55), (0.4, 0.4, 0.95), rojo)
    # libro encadenado al cinto
    sf.cuerda_anillo(c, 'cinto', sf.anillo(torso, (0, 0.02, 0.55), (0, 0, 1), 0.6, 20, 0.02), 0.014, P_('#1A1210', 'cuero'), coll)
    lb = np.array([-0.21, 0.08, 0.42])
    c.caja(lb, (0.03, 0.07, 0.09), 0.008, P_('#3A1414', 'cuero', semilla=6), 0.0)
    for k in range(4):
        c.malla(sc.bolita(f'eslabon libro {k}', lb + np.array([0.0, -0.02, 0.1 + 0.03 * k]), (0.008, 0.012, 0.016), coll, n=1, sub=1), hierro)
    h = F.pieza('cabeza', (0, 0.06, 0.88), tris=800)
    hc = np.array([0, 0.1, 0.99])
    capucha_redonda(h, hc, 0.15, rojo)
    h.bola(hc + np.array([0, 0.0, -0.01]), (0.12, 0.12, 0.12), piel, 0.0)
    mk = sf.intersect(sf.restar(sdf.ellipsoid(hc + np.array([0, 0.02, -0.01]), (0.135, 0.135, 0.14)), sdf.ellipsoid(hc + np.array([0, 0.0, -0.01]), (0.12, 0.12, 0.13))),
                      sdf.plane(hc + np.array([0, 0.05, 0]), (0, -1, 0)))
    for s in (-1, 1):
        mk = sf.restar(mk, sdf.round_box(hc + np.array([s * 0.05, 0.14, 0.02]), (0.035, 0.05, 0.009), 0.005))
    h.sdf(mk, hc - 0.3, hc + 0.3, hierro)
    sf.remaches(h, 'remache mascara', [(hc + np.array([math.sin(a) * 0.12, 0.08 + math.cos(a) * 0.08, -0.1 + 0.05 * math.cos(a)]), np.array([math.sin(a), 0.6, 0]))
                                       for a in np.linspace(-1.2, 1.2, 5)], 0.009, hierro, coll)
    ojos(h, [hc + np.array([-0.05, 0.11, 0.02]), hc + np.array([0.05, 0.11, 0.02])], 0.014, ojo, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.22, 0.02, 0.8])
        a = F.pieza(f'brazo_{lado}', hom, tris=520)
        codo, mun = np.array([s * 0.26, 0.15, 0.62]), np.array([s * 0.22, 0.32, 0.6])
        manga(a, hom, mun, 0.07, 0.09, negro, sem=s + 8, rasgado=0.02)
        mano_huesuda(a, mun + (mun - codo) * 0.1, mun - codo, piel, coll, f'mano {lado}', tam=1.15)
        if s > 0:
            g = mun + np.array([0, 0.06, 0])
            a.trazo([g + np.array([0, -0.08, -0.1]), g, g + np.array([0, 0.12, 0.25])], 0.014, madera, 0.0)
            t = g + np.array([0, 0.12, 0.25])
            a.trazo([t, t + np.array([0, 0.06, 0.1])], 0.01, hierro, 0.0)
            e = t + np.array([0, 0.07, 0.12])
            for k in range(6):
                ang = 2 * math.pi * k / 6
                a.malla(sc.punta(f'sol marca {k}', e, e + np.array([math.cos(ang) * 0.05, 0.0, math.sin(ang) * 0.05]), 0.016, coll, seg=4), brasa)
            a.bola(e, (0.03, 0.02, 0.03), brasa, 0.0)
            F.marca('llama', tuple(e))
        else:
            for k in range(3):
                z = 0.0 + 0.04 * k
                ring = [hom + (codo - hom) * (0.5 + 0.2 * k) + np.array([math.cos(t) * 0.075, math.sin(t) * 0.075, z * 0.2]) for t in np.linspace(0, 2 * math.pi, 9)[:-1]]
                sf.cuerda_anillo(a, f'cadena brazo {k}', ring, 0.011, hierro, coll)
    for lado, s in LADOS:
        cad = np.array([s * 0.09, 0.0, 0.47])
        p = F.pieza(f'pierna_{lado}', cad, tris=220)
        tob = np.array([s * 0.1, 0.03, 0.08])
        p.cono(cad, tob, 0.06, 0.05, negro, 0.0)
        bota(p, tob, s, P_('#1A1210', 'cuero'), largo=0.1, ancho=0.06, alto=0.04, cana=0.06, r_cana=0.06)
    return F


# ---------------------------------------------------------------------------
# Nigromante (abadía): túnica morada con runas verdes, corona de huesos, bastón con calavera
# ---------------------------------------------------------------------------

@enemigo('nigromante')
def nigromante(coll):
    F = nueva('nigromante', voxel=0.01, bioma='abadia')
    tunica = P_('#2E2238', 'tela', semilla=1, barro=0.4)
    tunica2 = P_('#1E1626', 'tela', semilla=2)
    runa = P_('#7CFF4A', 'brillo', mat='brillo_verde')
    hueso = P_('#D2C6A2', 'hueso', semilla=3)
    piel = P_('#8A8A80', 'carne', color2='#4A4A4E')
    madera = P_('#3A2A22', 'madera', color2='#1E140E')
    ojo = P_('#7CFF4A', 'brillo', mat='brillo_verde')
    c = F.pieza('cuerpo', (0, 0, 0.5), tris=1400)
    torso = sf.union(sdf.round_cone((0, -0.02, 0.52), (0, 0.03, 0.82), 0.15, 0.17), sdf.ellipsoid((0, 0.01, 0.85), (0.21, 0.14, 0.07)), k=0.06)
    c.sdf(torso, (-0.35, -0.3, 0.35), (0.35, 0.3, 0.97), tunica)
    f_t = tunica_larga(c, 0.6, 0.04, 0.19, 0.33, tunica, sem=6, rasgado=0.05, dientes=0.04, abierta=0.08)
    del f_t
    for k in range(10):
        a = 2 * math.pi * k / 10
        p = np.array([math.cos(a) * 0.31, math.sin(a) * 0.31, 0.12])
        c.malla(sc.tubo(f'runa {k}', [p, p + np.array([0, 0, 0.05]), p + np.array([0.02 * math.cos(a + 1.5), 0.02 * math.sin(a + 1.5), 0.07])], 0.006, coll,
                        segmentos=3, muestras=1), runa)
    # hombreras de hueso con calavera
    for s in (-1, 1):
        hp = np.array([s * 0.22, 0.0, 0.87])
        c.bola(hp, (0.08, 0.08, 0.05), hueso, 0.02)
        for j in range(3):
            sf.diente(c, f'pua hombrera {s} {j}', hp + np.array([s * 0.03, -0.03 + 0.03 * j, 0.03]), hp + np.array([s * 0.06, -0.05 + 0.03 * j, 0.12]), 0.016, hueso, coll)
    cr = np.array([0.0, 0.17, 0.55])
    c.bola(cr, (0.04, 0.04, 0.04), hueso, 0.0)
    c.malla(sc.bolita('ojo calavera cinto', cr + np.array([0.015, 0.035, 0.01]), 0.008, coll, n=1), runa)
    sf.cuerda_anillo(c, 'cinto', sf.anillo(torso, (0, 0.02, 0.58), (0, 0, 1), 0.6, 20, 0.02), 0.013, P_('#1A1210', 'cuero'), coll)
    h = F.pieza('cabeza', (0, 0.05, 0.9), tris=850)
    hc = np.array([0, 0.08, 1.02])
    capucha_redonda(h, hc, 0.14, tunica2)
    cara_calavera(h, hc + np.array([0, 0.02, -0.01]), 0.105, hueso, ojo, coll, dientes=P_('#C9B98E', 'hueso'))
    for k in range(7):
        a = math.radians(-70 + k * 23)
        b = hc + np.array([math.sin(a) * 0.15, math.cos(a) * 0.05, 0.12])
        sf.cuerno(h, f'hueso corona {k}', [b, b + np.array([math.sin(a) * 0.04, 0.0, 0.08 + 0.03 * (k % 2)]), b + np.array([math.sin(a) * 0.07, -0.02, 0.15 + 0.04 * (k % 2)])],
                  0.016, hueso, coll, seg=5)
    for lado, s in LADOS:
        hom = np.array([s * 0.21, 0.01, 0.84])
        a = F.pieza(f'brazo_{lado}', hom, tris=650 if s > 0 else 420)
        if s > 0:
            codo, mun = np.array([s * 0.26, 0.12, 0.66]), np.array([s * 0.25, 0.25, 0.68])
        else:
            codo, mun = np.array([s * 0.28, 0.14, 0.78]), np.array([s * 0.24, 0.28, 0.9])
        manga(a, hom, mun, 0.07, 0.11, tunica, sem=s + 9, rasgado=0.03)
        mano_huesuda(a, mun + (mun - codo) * 0.1, mun - codo, piel, coll, f'mano {lado}', tam=1.1)
        if s > 0:
            g = mun + np.array([0, 0.06, 0])
            a.trazo([g + np.array([0, 0.0, -0.55]), g, g + np.array([0.0, 0.02, 0.45])], [0.016, 0.017, 0.014], madera, 0.0)
            t = g + np.array([0.0, 0.02, 0.5])
            a.bola(t, (0.05, 0.055, 0.05), hueso, 0.0)
            a.bola(t + np.array([0, 0.035, -0.03]), (0.035, 0.03, 0.02), hueso, 0.01)
            ojos(a, [t + np.array([-0.02, 0.045, 0.005]), t + np.array([0.02, 0.045, 0.005])], 0.011, runa, coll, 'ojo baston')
            for k in range(3):
                ang = k * 2.1
                a.malla(sc.punta(f'llama verde {k}', t + np.array([math.cos(ang) * 0.02, math.sin(ang) * 0.02, 0.04]),
                                 t + np.array([math.cos(ang) * 0.03, math.sin(ang) * 0.03, 0.12 + 0.03 * k]), 0.02, coll, seg=5), runa)
            F.marca('llama', tuple(t + np.array([0, 0, 0.06])))
        else:
            a.malla(sc.bolita('orbe', mun + np.array([0, 0.08, 0.06]), 0.04, coll, n=2), runa)
    for lado, s in LADOS:
        cad = np.array([s * 0.08, 0.0, 0.48])
        p = F.pieza(f'pierna_{lado}', cad, tris=200)
        tob = np.array([s * 0.09, 0.04, 0.07])
        p.cono(cad, tob, 0.055, 0.045, tunica2, 0.0)
        bota(p, tob, s, P_('#1A1210', 'cuero'), largo=0.1, ancho=0.05, alto=0.035, cana=0.05, r_cana=0.05)
    return F


# ---------------------------------------------------------------------------
# Vampiro menor (castillo): levita negra, capa de cuello alto con forro rojo, colmillos
# ---------------------------------------------------------------------------

@enemigo('vampiro')
def vampiro(coll):
    F = nueva('vampiro', voxel=0.0095, bioma='castillo')
    levita = P_('#1C1418', 'tela', semilla=1)
    forro = P_('#7A0E14', 'tela', semilla=2)
    piel = P_('#C8C0C8', 'carne', color2='#8A7A8E')
    pelo = P_('#141016', 'pelo', semilla=3)
    camisa = P_('#C8BCA8', 'tela', semilla=4, sangre=0.3)
    oro = P_('#A57D36', 'oro', semilla=5)
    colm = P_('#F0E8DA', 'liso')
    una = P_('#2A1218', 'liso')
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    c = F.pieza('cuerpo', (0, 0, 0.5), tris=1400)
    torso = sf.union(sdf.round_cone((0, 0.0, 0.5), (0, 0.03, 0.8), 0.14, 0.17), sdf.ellipsoid((0, 0.02, 0.82), (0.22, 0.13, 0.07)), k=0.06)
    c.sdf(torso, (-0.35, -0.3, 0.35), (0.35, 0.3, 0.95), levita)
    falda = sf.cortar(sf.restar(sdf.round_cone((0, -0.02, 0.56), (0, -0.04, 0.22), 0.16, 0.22), sdf.round_box((0, 0.25, 0.35), (0.06, 0.15, 0.3), 0.02), 0.02),
                      (0, 0, 0.24), (0, 0, 1), 0.02, 14, 2, 0.015)
    c.sdf(falda, (-0.35, -0.35, 0.1), (0.35, 0.3, 0.65), levita)
    jab = sf.intersect(sf.cascaron(torso, 0.02), sdf.round_box((0, 0.2, 0.74), (0.05, 0.1, 0.08), 0.02))
    c.sdf(sc.sdf_ruido(jab, 0.006, 40, 3), (-0.15, 0.0, 0.6), (0.15, 0.35, 0.9), camisa)
    c.malla(sc.bolita('broche', (0, 0.17, 0.79), (0.025, 0.012, 0.025), coll, n=2), P_('#8A0A12', 'brillo', mat='brillo_rojo'))
    for s in (-1, 1):
        c.bola((s * 0.06, 0.17, 0.63), 0.012, oro, 0.0)
    # capa: cuello alto en punta y capa larga
    for s in (-1, 1):
        cu = sdf.round_box((s * 0.1, -0.08, 0.98), (0.1, 0.012, 0.12), 0.01, rot=sc.rot('z', s * 25) @ sc.rot('x', 10))
        c.sdf(cu, (-0.3, -0.3, 0.8), (0.3, 0.1, 1.15), forro)
        c.malla(sc.punta(f'punta cuello {s}', (s * 0.2, -0.12, 1.06), (s * 0.24, -0.14, 1.16), 0.025, coll, seg=4), levita)
    capa_lamina(c, 'capa', 0.86, -0.15, 0.24, 0.42, 0.18, levita, coll, filas=8, cols=11, rasgado=0.06, sem=4, huecos=1)
    capa_lamina(c, 'forro capa', 0.84, -0.135, 0.23, 0.4, 0.2, forro, coll, filas=7, cols=9, rasgado=0.05, sem=5, huecos=0)
    h = F.pieza('cabeza', (0, 0.04, 0.88), tris=800)
    hc = np.array([0, 0.07, 1.0])
    cab = sf.union(sdf.round_box(hc, (0.11, 0.11, 0.12), 0.08), sdf.ellipsoid(hc + np.array([0, 0.06, -0.08]), (0.08, 0.07, 0.05)), k=0.04)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.045, 0.11, 0.01]), (0.028, 0.02, 0.018)), 0.008)
    h.sdf(cab, hc - 0.25, hc + 0.25, piel)
    for s in (-1, 1):
        h.sdf(sdf.round_cone(hc + np.array([s * 0.1, 0.0, 0.0]), hc + np.array([s * 0.17, -0.03, 0.08]), 0.03, 0.004), hc - 0.3, hc + 0.3, piel, 0.01)
    pel = sf.intersect(sf.cascaron(cab, 0.018), sf.union(sdf.plane(hc + np.array([0, 0, 0.045]), (0, 0, -1)), sdf.plane(hc + np.array([0, -0.02, 0]), (0, 1, 0))))
    pel = sf.restar(pel, sdf.round_cone(hc + np.array([0, 0.2, 0.07]), hc + np.array([0, 0.1, 0.02]), 0.05, 0.005), 0.02)
    h.sdf(pel, hc - 0.3, hc + 0.3, pelo)
    ojos(h, [hc + np.array([-0.045, 0.1, 0.012]), hc + np.array([0.045, 0.1, 0.012])], 0.015, ojo, coll)
    for s in (-1, 1):
        sf.diente(h, f'colmillo {s}', hc + np.array([s * 0.022, 0.11, -0.085]), hc + np.array([s * 0.02, 0.115, -0.125]), 0.008, colm, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.2, 0.01, 0.81])
        a = F.pieza(f'brazo_{lado}', hom, tris=420)
        codo, mun = np.array([s * 0.26, 0.14, 0.66]), np.array([s * 0.24, 0.3, 0.68])
        manga(a, hom, mun, 0.06, 0.05, levita, sem=s + 3, rasgado=0.005, dientes=0.0)
        a.cono(mun - (mun - codo) * 0.05, mun + (mun - codo) * 0.08, 0.06, 0.065, forro, 0.0)
        mano_garra(a, mun + (mun - codo) * 0.12, mun - codo, piel, una, coll, f'mano {lado}', tam=1.15, curva=0.9)
    for lado, s in LADOS:
        cad = np.array([s * 0.08, 0.0, 0.48])
        p = F.pieza(f'pierna_{lado}', cad, tris=240)
        tob = np.array([s * 0.09, 0.02, 0.08])
        p.cono(cad, tob, 0.065, 0.05, levita, 0.0)
        bota(p, tob, s, P_('#120C0E', 'cuero', semilla=6), largo=0.12, ancho=0.05, alto=0.035, cana=0.12, r_cana=0.055)
    return F


# ---------------------------------------------------------------------------
# Novia del Conde (castillo): vestido de novia rasgado y manchado, velo, rosa marchita
# ---------------------------------------------------------------------------

@enemigo('novia_vampira')
def novia_vampira(coll):
    F = nueva('novia_vampira', voxel=0.0095, bioma='castillo')
    vestido = P_('#B8B0A8', 'tela', sangre=0.45, semilla=1)
    vestido2 = P_('#9A928C', 'tela', semilla=2)
    velo = P_('#8A8A96', 'vidrio', mat='espectro')
    piel = P_('#D0C4CC', 'carne', color2='#8A7A8E')
    pelo = P_('#141016', 'pelo', semilla=3)
    rosa = P_('#5A0A12', 'tela', semilla=4)
    tallo = P_('#2A3020', 'madera', color2='#1A1E12')
    colm = P_('#F0E8DA', 'liso')
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    una = P_('#2A1218', 'liso')
    c = F.pieza('cuerpo', (0, 0, 0.55), tris=1500)
    torso = sf.union(sdf.round_cone((0, 0.0, 0.56), (0, 0.02, 0.8), 0.12, 0.15), sdf.ellipsoid((0, 0.03, 0.74), (0.16, 0.12, 0.08)), k=0.06)
    c.sdf(torso, (-0.3, -0.3, 0.4), (0.3, 0.3, 0.95), vestido)
    tunica_larga(c, 0.62, 0.0, 0.14, 0.4, vestido, sem=5, rasgado=0.06, dientes=0.04)
    for k in range(6):
        a = 2 * math.pi * k / 6 + 0.2
        p = np.array([math.cos(a) * 0.35, math.sin(a) * 0.35, 0.12])
        c.malla(sf.tira(f'jiron vestido {k}', [p + np.array([0, 0, 0.1]), p + np.array([math.cos(a) * 0.03, math.sin(a) * 0.03, 0.0]),
                                               p + np.array([math.cos(a) * 0.05, math.sin(a) * 0.05, -0.09])], 0.08, coll, normal=(math.cos(a), math.sin(a), 0),
                        grosor=0.005), vestido2)
    for z in (0.58, 0.3):
        rz = 0.14 + (0.62 - z) / 0.62 * 0.26 + 0.008
        sf.cuerda_anillo(c, f'encaje {z}', [(math.cos(a) * rz, math.sin(a) * rz, z + 0.012 * math.sin(a * 12))
                                            for a in np.linspace(0, 2 * math.pi, 30, endpoint=False)], 0.01, vestido2, coll)
    h = F.pieza('cabeza', (0, 0.03, 0.86), tris=900)
    hc = np.array([0, 0.06, 0.98])
    cab = sf.union(sdf.round_box(hc, (0.11, 0.11, 0.115), 0.08), sdf.ellipsoid(hc + np.array([0, 0.05, -0.08]), (0.08, 0.07, 0.05)), k=0.04)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.045, 0.11, 0.01]), (0.028, 0.02, 0.02)), 0.008)
    h.sdf(cab, hc - 0.25, hc + 0.25, piel)
    pel = sf.restar(sf.union(sf.cascaron(cab, 0.022), sdf.round_cone(hc + np.array([0, -0.04, 0.0]), hc + np.array([0, -0.08, -0.32]), 0.13, 0.15), k=0.04),
                    sdf.plane(hc + np.array([0, 0.02, 0]), (0, -1, 0.0)), 0.0)
    pel = sf.cortar(pel, hc + np.array([0, 0, -0.3]), (0, 0, 1), 0.04, 14, 4, 0.02)
    h.sdf(sf.restar(pel, sdf.ellipsoid(hc + np.array([0, 0.16, -0.04]), (0.11, 0.08, 0.11)), 0.0), hc - 0.45, hc + 0.3, pelo)
    ojos(h, [hc + np.array([-0.045, 0.1, 0.012]), hc + np.array([0.045, 0.1, 0.012])], 0.015, ojo, coll)
    for s in (-1, 1):
        sf.diente(h, f'colmillo {s}', hc + np.array([s * 0.018, 0.105, -0.082]), hc + np.array([s * 0.016, 0.11, -0.115]), 0.007, colm, coll)
    # diadema con flores secas y velo hasta la espalda
    sf.cuerda_anillo(h, 'diadema', [hc + np.array([math.cos(a) * 0.13, -0.02 + math.sin(a) * 0.12, 0.09]) for a in np.linspace(0, 2 * math.pi, 16, endpoint=False)],
                     0.01, vestido2, coll)
    filas = []
    for i in range(6):
        t = i / 5
        fila = []
        for j in range(9):
            u = (j / 8) * 2 - 1
            ang = u * 1.05
            r = 0.15 + 0.06 * t
            ond = 0.025 * math.sin(u * 9 + t * 2) * t
            fila.append(hc + np.array([math.sin(ang) * r, -math.cos(ang) * r * 0.85 - 0.04 - 0.08 * t + ond, 0.1 - 0.42 * t - 0.05 * abs(math.sin(u * 5)) * t]))
        filas.append(fila)
    h.malla(sc.lamina('velo', filas, coll, 0.006), velo)
    for lado, s in LADOS:
        hom = np.array([s * 0.15, 0.02, 0.79])
        a = F.pieza(f'brazo_{lado}', hom, tris=420)
        codo, mun = np.array([s * 0.2, 0.12, 0.64]), np.array([s * 0.16, 0.27, 0.66]) if s > 0 else np.array([s * 0.22, 0.15, 0.5])
        manga(a, hom, mun, 0.05, 0.075, vestido, sem=s + 2, rasgado=0.03)
        mano_garra(a, mun + (mun - codo) * 0.12, mun - codo, piel, una, coll, f'mano {lado}', tam=0.95, curva=0.8)
        if s > 0:
            r0 = mun + (mun - codo) * 0.2 + np.array([0, 0.03, 0])
            a.malla(sc.tubo('tallo rosa', [r0 + np.array([0, 0, -0.08]), r0, r0 + np.array([0.01, 0.02, 0.12])], 0.005, coll, segmentos=4, muestras=1), tallo)
            for q in range(3):
                sf.diente(a, f'espina {q}', r0 + np.array([0, 0, -0.04 + 0.05 * q]), r0 + np.array([0.012, 0, -0.035 + 0.05 * q]), 0.004, tallo, coll)
            rc = r0 + np.array([0.01, 0.02, 0.14])
            a.bola(rc, (0.035, 0.035, 0.03), rosa, 0.0)
            for q in range(5):
                ang = 2 * math.pi * q / 5
                a.bola(rc + np.array([math.cos(ang) * 0.025, math.sin(ang) * 0.025, -0.005]), (0.02, 0.02, 0.012), rosa, 0.006)
    for lado, s in LADOS:
        cad = np.array([s * 0.07, 0.0, 0.53])
        p = F.pieza(f'pierna_{lado}', cad, tris=160)
        tob = np.array([s * 0.08, 0.06, 0.05])
        p.cono(cad + np.array([0, 0, -0.3]), tob, 0.04, 0.035, piel, 0.0)
        p.bola(tob + np.array([0, 0.04, -0.02]), (0.04, 0.06, 0.025), piel, 0.01)
    return F


# ---------------------------------------------------------------------------
# Hombre lobo (castillo)
# ---------------------------------------------------------------------------

@enemigo('hombre_lobo')
def hombre_lobo(coll):
    F = nueva('hombre_lobo', voxel=0.012, bioma='castillo')
    pelo = P_('#4A4038', 'pelo', color2='#2E2620', semilla=1, sangre=0.2)
    pecho = P_('#7A6A58', 'pelo', color2='#5A4A3C', semilla=2)
    piel = P_('#3A2E2A', 'cuero', semilla=3)
    trapo = P_('#2E3440', 'tela', semilla=4, barro=0.6)
    una = P_('#D8CCA6', 'hueso', semilla=5)
    dientes = P_('#E0D4B0', 'hueso', semilla=6)
    ojo = P_('#FFAA33', 'brillo', mat='brillo_ambar')
    c = F.pieza('cuerpo', (0, 0, 0.62), tris=1700)
    torso = sf.union(sdf.ellipsoid((0, 0.12, 1.0), (0.32, 0.25, 0.26)), sdf.round_cone((0, -0.02, 0.66), (0, 0.08, 0.92), 0.2, 0.26), k=0.1)
    c.sdf(sc.sdf_ruido(torso, 0.012, 14, 1), (-0.45, -0.3, 0.45), (0.45, 0.45, 1.3), pelo)
    c.sdf(sf.intersect(sf.cascaron(torso, 0.008), sdf.ellipsoid((0, 0.32, 0.9), (0.2, 0.15, 0.25))), (-0.3, 0.1, 0.6), (0.3, 0.5, 1.2), pecho)
    rng = np.random.default_rng(3)
    for k in range(16):
        d = np.array([rng.uniform(-1, 1), rng.uniform(-1, 0.2), rng.uniform(0.2, 1)])
        p, n = sf.hacia(torso, (0, 0.06, 0.9), d, -0.01)
        if p is not None:
            c.malla(sc.punta(f'mechon lomo {k}', p, p + n * 0.07 + np.array([0, -0.05, 0.0]), 0.035, coll, seg=4), pelo)
    c.sdf(sf.cortar(sdf.ellipsoid((0, 0.02, 0.62), (0.24, 0.2, 0.13)), (0, 0, 0.55), (0, 0, 1), 0.04, 14, 5, 0.025), (-0.35, -0.3, 0.4), (0.35, 0.3, 0.8), trapo)
    h = F.pieza('cabeza', (0, 0.28, 1.15), tris=1000)
    hc = np.array([0, 0.36, 1.22])
    cab = sf.union(sdf.ellipsoid(hc, (0.14, 0.15, 0.13)), sdf.round_cone(hc + np.array([0, 0.08, -0.03]), hc + np.array([0, 0.3, -0.07]), 0.085, 0.045), k=0.05)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.06, 0.13, 0.04]), (0.03, 0.025, 0.02)), 0.01)
    h.sdf(sc.sdf_ruido(cab, 0.008, 25, 2), hc - 0.35, hc + 0.4, pelo)
    h.bola(hc + np.array([0, 0.31, -0.06]), (0.03, 0.025, 0.022), P_('#141010', 'liso'), 0.005)
    for s in (-1, 1):
        h.sdf(sf.restar(sdf.round_cone(hc + np.array([s * 0.08, -0.02, 0.09]), hc + np.array([s * 0.13, -0.06, 0.25]), 0.055, 0.008),
                        sdf.round_cone(hc + np.array([s * 0.08, 0.0, 0.1]), hc + np.array([s * 0.13, -0.04, 0.24]), 0.035, 0.004)), hc - 0.4, hc + 0.4, pelo, 0.012)
        for j in range(3):
            b = hc + np.array([s * (0.035 + 0.01 * j), 0.27 - 0.05 * j, -0.1])
            sf.diente(h, f'colmillo {s} {j}', b, b + np.array([0, 0.005, -0.05 + 0.012 * j]), 0.012, dientes, coll)
        h.malla(sc.punta(f'melena {s}', hc + np.array([s * 0.12, -0.05, -0.05]), hc + np.array([s * 0.22, -0.12, -0.12]), 0.05, coll, seg=4), pelo)
    ojos(h, [hc + np.array([-0.06, 0.125, 0.04]), hc + np.array([0.06, 0.125, 0.04])], 0.018, ojo, coll)
    m = F.pieza('mandibula', hc + np.array([0, 0.06, -0.08]), tris=280)
    piv = hc + np.array([0, 0.06, -0.08])
    R = sc.rot('x', -18)
    m.trazo([rot_en(hc + np.array([0, 0.07, -0.1]), piv, R), rot_en(hc + np.array([0, 0.27, -0.12]), piv, R)], [0.06, 0.035], pelo, 0.0)
    for s in (-1, 1):
        for j in range(3):
            b = rot_en(hc + np.array([s * (0.03 + 0.008 * j), 0.25 - 0.05 * j, -0.105]), piv, R)
            sf.diente(m, f'colmillo inf {s} {j}', b, b + R @ np.array([0, 0.004, 0.04 - 0.01 * j]), 0.011, dientes, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.32, 0.1, 1.1])
        a = F.pieza(f'brazo_{lado}', hom, tris=600)
        codo, mun = np.array([s * 0.42, 0.18, 0.82]), np.array([s * 0.38, 0.38, 0.6])
        a.trazo([hom, codo, mun], [0.11, 0.08, 0.06], pelo, 0.0)
        a.malla(sc.punta(f'mechon codo {lado}', codo, codo + np.array([s * 0.05, -0.1, -0.02]), 0.04, coll, seg=4), pelo)
        mano_garra(a, mun, mun - codo, piel, una, coll, f'mano {lado}', tam=2.0, curva=1.0)
    for lado, s in LADOS:
        cad = np.array([s * 0.15, 0.0, 0.62])
        p = F.pieza(f'pierna_{lado}', cad, tris=440)
        rod, hock, pie = np.array([s * 0.18, 0.18, 0.42]), np.array([s * 0.17, -0.1, 0.2]), np.array([s * 0.17, 0.0, 0.05])
        p.trazo([cad, rod, hock, pie], [0.13, 0.08, 0.055, 0.05], pelo, 0.0)
        p.sdf(sf.cortar(sdf.round_cone(cad, rod, 0.145, 0.1), rod + np.array([0, -0.03, 0.06]), (0, -0.4, 1), 0.035, 18, 4 + s, 0.02), cad - 0.3, cad + 0.3, trapo)
        pata_garra(p, pie + np.array([0, 0.04, -0.01]), (0, 1, 0), 4, 0.07, 0.022, piel, una, coll, 'garra pie')
    k = F.pieza('cola', (0, -0.2, 0.68), tris=260)
    pts = [np.array([0.05 * math.sin(t * 3), -0.2 - t * 0.38, 0.68 - t * 0.3]) for t in np.linspace(0, 1, 6)]
    k.trazo(pts, [0.05, 0.07, 0.07, 0.06, 0.04, 0.01], pelo, 0.0)
    return F


# ---------------------------------------------------------------------------
# Caballero de la muerte (élite común): armadura ennegrecida con púas, yelmo con cuernos y visera roja, mandoble
# ---------------------------------------------------------------------------

@enemigo('caballero_muerte')
def caballero_muerte(coll):
    F = nueva('caballero_muerte', voxel=0.012, bioma='todos', elite=1)
    placa = P_('#2E2E34', 'hierro', semilla=1, var=0.8)
    placa2 = P_('#3A3A42', 'hierro', semilla=2, var=0.8)
    oro = P_('#7A5A26', 'oro', semilla=3)
    malla = P_('#4A4A50', 'hierro', semilla=4, var=1.4)
    capa = P_('#3A0C10', 'tela', semilla=5, barro=0.6)
    hueso = P_('#C8BC98', 'hueso', semilla=6)
    visor = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    cuero = P_('#1E1612', 'cuero', semilla=7)
    hoja = P_('#5A5C62', 'hierro', semilla=8, sangre=0.4)
    c = F.pieza('cuerpo', (0, 0, 0.62), tris=1800)
    peto = sf.union(sdf.round_cone((0, 0.0, 0.66), (0, 0.04, 0.98), 0.21, 0.25), sdf.ellipsoid((0, 0.05, 1.0), (0.3, 0.2, 0.1)), k=0.06)
    peto = sf.union(peto, sdf.round_box((0, 0.2, 0.9), (0.02, 0.06, 0.12), 0.015, rot=sc.rot('x', 8)), k=0.03)
    c.sdf(peto, (-0.45, -0.3, 0.45), (0.45, 0.4, 1.15), placa)
    for z in (0.72, 0.78):
        sf.cuerda_anillo(c, f'franja peto {z}', sf.anillo(peto, (0, 0.02, z), (0, 0, 1), 0.7, 22, 0.006), 0.012, placa2, coll)
    cr, ncr = sf.hacia(peto, (0, 0.02, 0.9), (0, 1, 0.1), 0.02)
    if cr is not None:
        c.bola(cr, (0.06, 0.03, 0.065), hueso, 0.0)
        for s in (-1, 1):
            c.malla(sc.bolita(f'cuenca peto {s}', cr + np.array([s * 0.025, 0.025, 0.01]), 0.014, coll, n=1), P_('#120D0B', 'liso'))
    c.sdf(sf.cortar(sf.restar(sdf.round_cone((0, 0.0, 0.66), (0, 0.0, 0.38), 0.23, 0.29), sdf.round_cone((0, 0.0, 0.7), (0, 0.0, 0.34), 0.2, 0.26)),
                    (0, 0, 0.4), (0, 0, 1), 0.02, 16, 3, 0.02), (-0.4, -0.4, 0.3), (0.4, 0.4, 0.75), malla)
    sf.cuerda_anillo(c, 'cinturon', sf.anillo(peto, (0, 0.02, 0.68), (0, 0, 1), 0.7, 22, 0.015), 0.02, cuero, coll)
    c.caja((0, 0.27, 0.68), (0.05, 0.015, 0.04), 0.01, oro, 0.0)
    capa_lamina(c, 'capa', 1.02, -0.2, 0.3, 0.5, 0.2, capa, coll, filas=9, cols=12, rasgado=0.1, sem=6, huecos=3)
    h = F.pieza('cabeza', (0, 0.04, 1.08), tris=900)
    hc = np.array([0, 0.06, 1.22])
    yelmo = sf.union(sdf.round_box(hc, (0.15, 0.15, 0.15), 0.1), sdf.round_box(hc + np.array([0, 0.12, -0.03]), (0.08, 0.06, 0.1), 0.04), k=0.04)
    yelmo = sf.union(yelmo, sdf.round_cone(hc + np.array([0, -0.12, 0.14]), hc + np.array([0, 0.16, 0.15]), 0.02, 0.02), k=0.02)
    yelmo = sf.restar(yelmo, sdf.round_box(hc + np.array([0, 0.19, 0.03]), (0.11, 0.06, 0.012), 0.004), 0.004)
    h.sdf(yelmo, hc - 0.3, hc + 0.3, placa)
    h.caja(hc + np.array([0, 0.155, 0.03]), (0.1, 0.01, 0.009), 0.004, visor, 0.0)
    for k in range(5):
        h.malla(sc.bolita(f'respiradero {k}', hc + np.array([-0.04 + 0.02 * k, 0.185, -0.08]), (0.006, 0.006, 0.014), coll, n=1), P_('#120D0B', 'liso'))
    for s in (-1, 1):
        sf.cuerno(h, f'cuerno {s}', [hc + np.array([s * 0.14, 0.0, 0.08]), hc + np.array([s * 0.26, 0.02, 0.14]), hc + np.array([s * 0.32, 0.08, 0.26]),
                                     hc + np.array([s * 0.3, 0.14, 0.36])], 0.045, hueso, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.3, 0.02, 1.0])
        a = F.pieza(f'brazo_{lado}', hom, tris=700 if s > 0 else 520)
        codo, mun = np.array([s * 0.36, 0.12, 0.8]), np.array([s * 0.33, 0.3, 0.74])
        a.trazo([hom, codo, mun], [0.08, 0.07, 0.065], placa2, 0.0)
        hp = hom + np.array([s * 0.03, 0.0, 0.05])
        pf = sf.restar(sdf.ellipsoid(hp, (0.15, 0.14, 0.1)), sdf.ellipsoid(hp + np.array([0, 0, -0.02]), (0.13, 0.12, 0.09)))
        pf = sf.cortar(pf, hp + np.array([0, 0, -0.02]), (0, 0, 1), 0.005, 20, 3)
        a.sdf(pf, hp - 0.2, hp + 0.2, placa)
        for j in range(3):
            b = hp + np.array([s * 0.06, -0.06 + 0.06 * j, 0.06])
            sf.diente(a, f'pua hombrera {j}', b, b + np.array([s * 0.06, 0.0, 0.11]), 0.025, placa2, coll)
        a.bola(codo, (0.085, 0.085, 0.07), placa, 0.01)
        a.bola(mun + (mun - codo) * 0.15, (0.06, 0.06, 0.055), placa2, 0.01)
        if s > 0:
            g = mun + (mun - codo) * 0.3
            a.cono(g + np.array([0, 0, -0.12]), g + np.array([0, 0, 0.08]), 0.02, 0.02, cuero, 0.0)
            a.trazo([g + np.array([0, -0.13, 0.09]), g + np.array([0, 0.13, 0.09])], 0.02, oro, 0.0)
            a.bola(g + np.array([0, 0, -0.14]), 0.03, oro, 0.0)
            hb = g + np.array([0, 0, 0.1])
            d = sc_u(np.array([0, 0.15, 1]))
            import sangre_armas as sa
            sa.hoja_rombo(a, 'mandoble', hb, d, (0, 1, 0), 0.8, 0.12, 0.03, hoja, coll, punta=0.15, estrecha=0.25, muescas=((0.4, 0.2, 1), (0.6, 0.15, -1)))
    for lado, s in LADOS:
        cad = np.array([s * 0.13, 0.0, 0.6])
        p = F.pieza(f'pierna_{lado}', cad, tris=420)
        rod, tob = np.array([s * 0.14, 0.04, 0.34]), np.array([s * 0.14, 0.0, 0.1])
        p.trazo([cad, rod, tob], [0.1, 0.08, 0.075], placa2, 0.0)
        p.bola(rod + np.array([0, 0.05, 0.01]), (0.075, 0.05, 0.075), placa, 0.01)
        sf.diente(p, 'pua rodilla', rod + np.array([0, 0.09, 0.01]), rod + np.array([0, 0.15, 0.03]), 0.02, placa2, coll)
        bota(p, tob, s, placa, largo=0.13, ancho=0.08, alto=0.05, cana=0.1, r_cana=0.085, puntera=placa2)
    return F
