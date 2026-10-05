"""Más enemigos de Sangre y Ceniza (se registran en sangre_enemigos.ENEMIGOS): de las catacumbas, las minas, la
abadía y el castillo, y el caballero de la muerte (élite común). Mismas reglas: piezas con el origen en la
articulación, mirando a +Y, izquierda en -X."""
import math

import numpy as np

import sangre_comun as sc
import sangre_formas as sf
import sdf
from sangre_comun import P_
from sangre_enemigos import LADOS, enemigo, mano_garra, nueva, ojos, remiendo, rot_en

# ---------------------------------------------------------------------------
# Ayudas de extremidades
# ---------------------------------------------------------------------------


def manga(pz, a, b, r0, r1, pt, sem=0, rasgado=0.02, dientes=0.012):
    """Manga (o pernera) de tela de a hasta b, con el extremo rasgado."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    d = (b - a) / np.linalg.norm(b - a)
    f = sf.cortar(sdf.round_cone(a - d * 0.02, b, r0, r1), b, -d, amp=rasgado, esc=30, sem=sem, dientes=dientes, esc_dientes=70)
    pz.sdf(f, np.minimum(a, b) - max(r0, r1) - 0.08, np.maximum(a, b) + max(r0, r1) + 0.08, pt)


def bota(pz, tobillo, s, pt, largo=0.1, ancho=0.06, alto=0.04, cana=0.08, r_cana=0.055, suela=None, puntera=None):
    pie = np.asarray(tobillo, float) + np.array([0, largo * 0.45, -tobillo[2] + alto])
    f = sf.union(sdf.round_box(pie, (ancho, largo, alto), alto * 0.85), sdf.round_cone(tobillo, np.asarray(tobillo) + np.array([0, 0, cana]), r_cana,
                                                                                        r_cana * 1.05), k=0.03)
    pz.sdf(f, pie - 0.2, pie + np.array([0.2, 0.2, 0.3]), pt)
    if suela is not None:
        pz.caja(pie + np.array([0, 0.005, -alto + 0.008]), (ancho * 1.02, largo * 1.02, 0.009), 0.007, suela, 0.0)
    if puntera is not None:
        pz.bola(pie + np.array([0, largo * 0.85, 0.0]), (ancho * 0.85, largo * 0.3, alto * 0.85), puntera, 0.01)
    return pie


def pata_garra(pz, base, d, n, largo, r, pt, pt_una, coll, nombre, abre=0.5):
    """Pie/mano de bestia: dedos gruesos con garras curvas."""
    d = sc_u(d)
    lat = sc_u(np.cross(d, [0, 0, 1])) if abs(d[2]) < 0.9 else np.array([1.0, 0, 0])
    for i in range(n):
        t = (i - (n - 1) / 2) / max((n - 1) / 2, 1)
        dd = sc_u(d + lat * t * abs(abre))
        b = np.asarray(base, float) + lat * t * r * 1.6
        e = b + dd * largo + np.array([0, 0, -largo * 0.25])
        pz.trazo([b, (b + e) / 2 + np.array([0, 0, 0.01]), e], [r, r * 0.9, r * 0.75], pt, 0.008)
        sf.diente(pz, f'{nombre} {i}', e, e + dd * r * 2.2 + np.array([0, 0, -r * 1.4]), r * 0.7, pt_una, coll)


def sc_u(v):
    v = np.asarray(v, float)
    return v / max(np.linalg.norm(v), 1e-9)


def tunica_larga(pz, top, hem, r0, r1, pt, sem=0, y=0.0, rasgado=0.04, dientes=0.025, abierta=None, k=0.0):
    """Hábito o falda acampanada desde la cintura hasta el ruedo hecho jirones (abierta = ancho de la abertura frontal)."""
    f = sdf.round_cone((0, y, top), (0, y, hem), r0, r1)
    f = sf.cortar(f, (0, y, hem + 0.03), (0, 0, 1), amp=rasgado, esc=12, sem=sem, dientes=dientes, esc_dientes=40)
    f = sf.restar(f, sdf.round_cone((0, y, top - 0.02), (0, y, hem - 0.05), r0 - 0.02, r1 - 0.025), 0.0)
    if abierta:
        f = sf.restar(f, sdf.round_box((0, y + r1, (top + hem) / 2), (abierta, r1 * 0.6, (top - hem) / 2 + 0.1), 0.02), 0.02)
    m = max(r0, r1) + 0.1
    pz.sdf(f, (-m, y - m, hem - 0.1), (m, y + m, top + 0.05), pt, k)
    return f


def jirones_tela(pz, nombre, base_pts, largo, ancho, pt, coll, normal_fn, sem=0):
    rng = np.random.default_rng(sem)
    for i, p in enumerate(base_pts):
        n = normal_fn(p)
        L = largo * rng.uniform(0.6, 1.3)
        e = p + np.array([0, 0, -L]) + n * 0.03
        pz.malla(sf.tira(f'{nombre} {i}', [p, (p + e) / 2 + n * 0.015, e], ancho * rng.uniform(0.7, 1.2), coll, normal=n, grosor=0.006), pt)


def capa_lamina(pz, nombre, hombros_z, y0, ancho0, ancho1, z1, pt, coll, filas=8, cols=11, rasgado=0.08, sem=0, curva=0.12, huecos=2):
    """Capa colgando a la espalda (lámina con ruedo rasgado y huecos)."""
    rng = np.random.default_rng(sem)
    corte = [rasgado * rng.uniform(0.2, 1.2) for _ in range(cols)]
    filas_pts = []
    agujeros = {(int(rng.integers(filas // 2, filas - 1)), int(rng.integers(1, cols - 2))) for _ in range(huecos)}
    for i in range(filas):
        t = i / (filas - 1)
        fila = []
        for j in range(cols):
            u = j / (cols - 1) * 2 - 1
            ancho = ancho0 + (ancho1 - ancho0) * t
            z = hombros_z + (z1 + corte[j] - hombros_z) * t
            y = y0 - curva * (1 - u * u) * (0.4 + t) - 0.05 * t + 0.02 * math.sin(u * 7 + t * 4) * t
            fila.append((u * ancho, y, z))
        filas_pts.append(fila)
    verts = [p for f in filas_pts for p in f]
    faces = [(i * cols + j, i * cols + j + 1, (i + 1) * cols + j + 1, (i + 1) * cols + j) for i in range(filas - 1) for j in range(cols - 1)
             if (i, j) not in agujeros]
    o = sc.clay.make_mesh_object(nombre, verts, faces, coll)
    sc.clay.add_solidify(o, 0.012, offset=0.0)
    pz.malla(o, pt)
    return o


# ---------------------------------------------------------------------------
# Zombi gordo (cementerio): panza enorme cosida, forúnculos, delantal de carnicero
# ---------------------------------------------------------------------------

@enemigo('zombi_gordo')
def zombi_gordo(coll):
    F = nueva('zombi_gordo', voxel=0.011, bioma='cementerio')
    piel = P_('#6C7258', 'carne', color2='#5A3E52', sangre=0.2)
    delantal = P_('#8A7E66', 'cuero', sangre=0.7, semilla=2)
    pant = P_('#3A3026', 'tela', barro=0.9, semilla=3)
    hilo = P_('#1A1612', 'liso')
    pus = P_('#B8C04A', 'cera', semilla=4)
    bilis = P_('#7CFF4A', 'brillo', mat='brillo_verde')
    ojo = P_('#FFB040', 'brillo', mat='brillo_ambar')
    dientes = P_('#C9B98E', 'hueso')
    una = P_('#2A2420', 'liso')
    c = F.pieza('cuerpo', (0, 0, 0.42), tris=1500)
    panza = sf.union(sdf.ellipsoid((0, 0.08, 0.6), (0.34, 0.32, 0.3)), sdf.ellipsoid((0, 0.0, 0.85), (0.28, 0.22, 0.14)), k=0.12)
    herida = sf.agujero(panza, (0.1, 0.38, 0.55), (0.1, 0.05, 0.03), amp=0.01, sem=2)
    c.sdf(herida, (-0.45, -0.35, 0.25), (0.45, 0.5, 1.05), piel)
    c.bola((0.1, 0.36, 0.55), (0.085, 0.03, 0.022), bilis, 0.0)
    a, na = sf.hacia(panza, (0, 0.08, 0.6), (0.05, 1, 0.9))
    b, nb = sf.hacia(panza, (0, 0.08, 0.6), (0.1, 1, -0.6))
    if a is not None and b is not None:
        sf.puntadas(c, 'costura panza', a, b, 7, 0.04, hilo, coll, r=0.006, normal=(na + nb) / 2)
    rng = np.random.default_rng(4)
    for k in range(9):
        d = np.array([rng.uniform(-1, 1), rng.uniform(-0.6, 1), rng.uniform(-0.5, 0.9)])
        p, n = sf.hacia(panza, (0, 0.08, 0.6), d, -0.01)
        if p is not None:
            c.bola(p, rng.uniform(0.02, 0.035), pus, 0.01)
    # delantal de carnicero
    dl = sf.intersect(sf.restar(sf.cascaron(panza, 0.018), sf.cascaron(panza, 0.004)), sdf.round_box((0, 0.35, 0.55), (0.24, 0.2, 0.28), 0.03))
    dl = sf.agujero(dl, (0.1, 0.38, 0.55), (0.12, 0.08, 0.06), amp=0.015, sem=5)
    c.sdf(dl, (-0.35, 0.0, 0.2), (0.35, 0.55, 0.9), delantal)
    sf.cuerda_anillo(c, 'correa delantal', sf.anillo(panza, (0, 0.06, 0.82), (0, 0, 1), 0.8, 20, 0.02), 0.012, P_('#2A1C14', 'cuero'), coll)
    c.bola((0, 0.02, 0.4), (0.3, 0.24, 0.12), pant, 0.04)
    h = F.pieza('cabeza', (0, 0.12, 0.93), tris=650)
    hc = np.array([0, 0.17, 1.02])
    cab = sf.union(sdf.round_box(hc, (0.11, 0.1, 0.1), 0.07), sdf.ellipsoid(hc + np.array([0, 0.04, -0.09]), (0.13, 0.1, 0.07)), k=0.04)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.045, 0.1, 0.01]), (0.03, 0.03, 0.028)), 0.01)
    cab = sf.restar(cab, sdf.round_box(hc + np.array([0, 0.12, -0.07]), (0.06, 0.04, 0.018), 0.01), 0.008)
    h.sdf(cab, hc - 0.25, hc + 0.25, piel)
    ojos(h, [hc + np.array([-0.045, 0.085, 0.01]), hc + np.array([0.045, 0.085, 0.01])], 0.015, ojo, coll)
    sf.fila_dientes(h, 'diente', hc + np.array([0, 0.115, -0.06]), 0.09, 6, 0.016, dientes, coll, sentido=-1, sem=4)
    for lado, s in LADOS:
        hom = np.array([s * 0.3, 0.05, 0.86])
        a = F.pieza(f'brazo_{lado}', hom, tris=420)
        codo, mun = np.array([s * 0.38, 0.18, 0.66]), np.array([s * 0.35, 0.34, 0.58])
        a.trazo([hom, codo, mun], [0.085, 0.07, 0.055], piel, 0.0)
        for k in range(3):
            p = hom + (codo - hom) * (0.3 + 0.3 * k) + np.array([s * 0.06, 0.02, 0.03])
            a.bola(p, 0.022, pus, 0.01)
        mano_garra(a, mun, mun - codo, piel, una, coll, f'mano {lado}', tam=1.5)
    for lado, s in LADOS:
        cad = np.array([s * 0.15, 0.0, 0.42])
        p = F.pieza(f'pierna_{lado}', cad, tris=300)
        tob = np.array([s * 0.16, 0.02, 0.08])
        p.cono(cad, tob, 0.11, 0.075, pant, 0.0)
        p.sdf(sf.cortar(sdf.round_cone(cad, tob, 0.12, 0.085), tob + np.array([0, 0, 0.1]), (0, 0, 1), 0.02, 25, 3 + s, 0.012),
              cad - np.array([0.2, 0.2, 0.5]), cad + 0.2, pant)
        p.bola(np.array([s * 0.16, 0.07, 0.04]), (0.08, 0.12, 0.045), piel, 0.02)
    return F


# ---------------------------------------------------------------------------
# Ghoul (catacumbas): agachado, brazos larguísimos, orejas puntudas, boca ancha
# ---------------------------------------------------------------------------

@enemigo('ghoul')
def ghoul(coll):
    F = nueva('ghoul', voxel=0.009, bioma='catacumbas')
    piel = P_('#8C9494', 'carne', color2='#4E5A62', sangre=0.3)
    trapo = P_('#3A322A', 'tela', barro=0.7)
    una = P_('#1C1814', 'liso')
    dientes = P_('#D8CCA6', 'hueso')
    ojo = P_('#7CFF4A', 'brillo', mat='brillo_verde')
    c = F.pieza('cuerpo', (0, 0, 0.42), tris=1100)
    torso = sf.union(sdf.round_cone((0, -0.02, 0.44), (0, 0.16, 0.66), 0.13, 0.15), sdf.ellipsoid((0, 0.1, 0.68), (0.2, 0.14, 0.08)), k=0.06)
    c.sdf(torso, (-0.3, -0.25, 0.3), (0.3, 0.35, 0.8), piel)
    for z in (0.52, 0.56, 0.6):
        for s in (-1, 1):
            sf.costilla(c, torso, z, s, 60, 150, piel, r=0.012, centro=(0, 0.06, 0), sale=0.004, n=5)
    sf.vertebras(c, [np.array([0, -0.12 + 0.12 * t, 0.46 + 0.24 * t]) for t in np.linspace(0, 1, 7)], 0.022, piel, k=0.01)
    c.bola((0, -0.01, 0.41), (0.13, 0.1, 0.07), trapo, 0.02)
    for j, (x, y) in enumerate(((-0.06, 0.09), (0.06, 0.09), (0.0, -0.1))):
        p = np.array([x, y, 0.4])
        c.malla(sf.tira(f'taparrabo {j}', [p, p + np.array([0, 0.01 * np.sign(y), -0.08]), p + np.array([0.01, 0.015 * np.sign(y), -0.15])], 0.07, coll,
                        normal=(0, np.sign(y), 0), grosor=0.006), trapo)
    h = F.pieza('cabeza', (0, 0.2, 0.68), tris=800)
    hc = np.array([0, 0.3, 0.73])
    cab = sf.union(sdf.ellipsoid(hc, (0.11, 0.12, 0.1)), sdf.ellipsoid(hc + np.array([0, 0.08, -0.06]), (0.1, 0.07, 0.05)), k=0.04)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.045, 0.1, 0.02]), (0.03, 0.025, 0.022)), 0.01)
    cab = sf.restar(cab, sdf.round_box(hc + np.array([0, 0.13, -0.065]), (0.085, 0.05, 0.02), 0.01, rot=None), 0.006)
    h.sdf(cab, hc - 0.25, hc + 0.25, piel)
    for s in (-1, 1):
        h.sdf(sf.cortar(sdf.round_cone(hc + np.array([s * 0.09, -0.01, 0.03]), hc + np.array([s * 0.24, -0.08, 0.12]), 0.035, 0.004),
                        hc + np.array([s * 0.16, -0.05, 0.08]), (0, 0, 1), 0.006, 30, 4), hc - 0.35, hc + 0.35, piel, 0.012)
    ojos(h, [hc + np.array([-0.045, 0.095, 0.02]), hc + np.array([0.045, 0.095, 0.02])], 0.014, ojo, coll)
    for j in range(8):
        t = (j - 3.5) / 3.5
        b = hc + np.array([t * 0.075, 0.13 - 0.02 * t * t, -0.055])
        sf.diente(h, f'colmillo sup {j}', b, b + np.array([0, 0.005, -0.03]), 0.008, dientes, coll)
    m = F.pieza('mandibula', hc + np.array([0, 0.02, -0.06]), tris=260)
    piv = hc + np.array([0, 0.02, -0.06])
    R = sc.rot('x', -16)
    m.sdf(sdf.round_box(rot_en(hc + np.array([0, 0.09, -0.1]), piv, R), (0.08, 0.06, 0.02), 0.015, rot=R), hc - 0.3, hc + 0.3, piel)
    for j in range(7):
        t = (j - 3) / 3
        b = rot_en(hc + np.array([t * 0.065, 0.135 - 0.02 * t * t, -0.085]), piv, R)
        sf.diente(m, f'colmillo inf {j}', b, b + R @ np.array([0, 0.004, 0.028]), 0.008, dientes, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.19, 0.12, 0.67])
        a = F.pieza(f'brazo_{lado}', hom, tris=420)
        codo, mun = np.array([s * 0.3, 0.22, 0.42]), np.array([s * 0.27, 0.42, 0.18])
        a.trazo([hom, codo, mun], [0.05, 0.035, 0.03], piel, 0.0)
        a.bola(codo, 0.04, piel, 0.01)
        mano_garra(a, mun, mun - codo + np.array([0, 0.1, 0]), piel, una, coll, f'mano {lado}', tam=1.6, curva=1.0)
    for lado, s in LADOS:
        cad = np.array([s * 0.09, -0.02, 0.42])
        p = F.pieza(f'pierna_{lado}', cad, tris=320)
        rod, tob = np.array([s * 0.14, 0.14, 0.28]), np.array([s * 0.12, -0.04, 0.08])
        p.trazo([cad, rod, tob], [0.065, 0.045, 0.035], piel, 0.0)
        pata_garra(p, tob + np.array([0, 0.03, -0.05]), (0, 1, 0), 3, 0.07, 0.016, piel, una, coll, 'garra pie')
    return F


# ---------------------------------------------------------------------------
# Araña de cripta: abdomen con calavera, ocho patas, quelíceros
# ---------------------------------------------------------------------------

@enemigo('arana_cripta')
def arana_cripta(coll):
    F = nueva('arana_cripta', voxel=0.009, bioma='catacumbas', cuadrupedo=1)
    quitina = P_('#2C2220', 'pelo', color2='#3E2E2A', semilla=1)
    marca = P_('#CFC3A0', 'hueso', semilla=2)
    pata_pt = P_('#231B19', 'cuero', semilla=3)
    colm = P_('#8A1414', 'liso', semilla=4)
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    c = F.pieza('cuerpo', (0, 0, 0.32), tris=1300)
    abd = sdf.ellipsoid((0, -0.25, 0.4), (0.24, 0.3, 0.22))
    c.sdf(sc.sdf_ruido(abd, 0.006, 25, 1), (-0.35, -0.6, 0.12), (0.35, 0.1, 0.66), quitina)
    torax = sdf.ellipsoid((0, 0.08, 0.3), (0.16, 0.16, 0.1))
    c.sdf(torax, (-0.25, -0.12, 0.15), (0.25, 0.3, 0.45), quitina, 0.04)
    # calavera pintada en relieve sobre el abdomen
    cr = sf.intersect(sf.cascaron(abd, 0.008), sf.union(sdf.ellipsoid((0, -0.2, 0.62), (0.1, 0.09, 0.08)), sdf.round_box((0, -0.12, 0.6), (0.06, 0.04, 0.05), 0.02),
                                                         k=0.02))
    for s in (-1, 1):
        cr = sf.restar(cr, sdf.ellipsoid((s * 0.04, -0.17, 0.66), (0.03, 0.025, 0.05)), 0.0)
    c.sdf(cr, (-0.2, -0.4, 0.4), (0.2, 0.0, 0.75), marca)
    for k in range(10):
        a = -0.8 + k * 0.18
        p, n = sf.hacia(abd, (0, -0.25, 0.4), (math.sin(a) * 0.7, -0.5, math.cos(a)), -0.004)
        if p is not None and (k % 3 != 1):
            sf.diente(c, f'pelo lomo {k}', p, p + n * 0.05 + np.array([0, -0.02, 0]), 0.01, quitina, coll)
    h = F.pieza('cabeza', (0, 0.2, 0.3), tris=420)
    hc = np.array([0, 0.27, 0.3])
    h.bola(hc, (0.11, 0.09, 0.08), quitina, 0.0)
    ojos(h, [hc + np.array([x, 0.07, z]) for x, z in ((-0.035, 0.035), (0.035, 0.035), (-0.06, 0.015), (0.06, 0.015), (-0.018, 0.055), (0.018, 0.055),
                                                     (-0.075, -0.01), (0.075, -0.01))], (0.018, 0.018, 0.011, 0.011, 0.01, 0.01, 0.008, 0.008), ojo, coll)
    m = F.pieza('mandibula', hc + np.array([0, 0.05, -0.04]), tris=200)
    for s in (-1, 1):
        b = hc + np.array([s * 0.035, 0.07, -0.04])
        m.trazo([b, b + np.array([0, 0.05, -0.03]), b + np.array([-s * 0.01, 0.08, -0.09])], [0.025, 0.018, 0.008], quitina, 0.0)
        sf.diente(m, f'quelicero {s}', b + np.array([-s * 0.01, 0.08, -0.09]), b + np.array([-s * 0.03, 0.07, -0.13]), 0.01, colm, coll)
    for lado, s in LADOS:
        p = F.pieza(f'pierna_{lado}', (s * 0.1, 0.08, 0.3), tris=700)
        for j in range(4):
            ang = math.radians(-50 + j * 35)
            base = np.array([s * 0.13 * math.cos(ang * 0.3), 0.08 + 0.12 * math.sin(ang), 0.3])
            d = np.array([s * math.cos(ang), math.sin(ang), 0])
            rod = base + d * 0.24 + np.array([0, 0, 0.2])
            pie = base + d * 0.5 + np.array([0, 0, -0.29])
            p.trazo([base, rod, (rod + pie) / 2 + d * 0.04, pie], [0.028, 0.022, 0.016, 0.008], pata_pt, 0.0)
            p.bola(rod, 0.03, quitina, 0.008)
            for q in range(3):
                t = 0.2 + q * 0.25
                pp = rod + (pie - rod) * t
                sf.diente(p, f'pelo pata {j} {q}', pp, pp + d * 0.02 + np.array([0, 0, 0.035]), 0.005, quitina, coll)
    return F


# ---------------------------------------------------------------------------
# Espectro (atraviesa paredes): manto translúcido, capucha vacía con dos luces, manos de hueso y cadenas
# ---------------------------------------------------------------------------

@enemigo('espectro')
def espectro(coll):
    F = nueva('espectro', voxel=0.01, suelo=False, vuela=1, bioma='catacumbas')
    velo = P_('#4E6670', 'vidrio', mat='espectro')
    velo2 = P_('#3A525E', 'vidrio', mat='espectro', semilla=2)
    hueso = P_('#C8D4D6', 'hueso')
    cadena = P_('#4A4C52', 'hierro')
    ojo = P_('#5ED8FF', 'brillo', mat='brillo_azul')
    vacio = P_('#0A0C10', 'liso')
    z0 = 0.25
    c = F.pieza('cuerpo', (0, 0, 0.8), tris=900)
    manto = sdf.round_cone((0, 0, 0.95), (0, -0.04, 0.32), 0.16, 0.27)
    manto = sf.cortar(manto, (0, 0, 0.36), (0, 0, 1), amp=0.08, esc=8, sem=3, dientes=0.06, esc_dientes=30)
    c.sdf(manto, (-0.4, -0.4, 0.1), (0.4, 0.4, 1.1), velo)
    for k in range(5):
        a = 2 * math.pi * k / 5 + 0.3
        p = np.array([math.cos(a) * 0.2, math.sin(a) * 0.2 - 0.04, 0.42])
        e = p + np.array([math.cos(a) * 0.08, math.sin(a) * 0.05 - 0.1, -0.28 - 0.06 * (k % 2)])
        c.malla(sf.tira(f'jiron {k}', [p, (p + e) / 2 + np.array([0, -0.03, 0]), e], 0.09, coll, normal=(math.cos(a), math.sin(a), 0), grosor=0.006), velo2)
    sf.cuerda_anillo(c, 'cadena pecho', [(math.cos(a) * 0.19, math.sin(a) * 0.17, 0.78 + 0.07 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 18, endpoint=False)],
                     0.014, cadena, coll)
    for k in range(4):
        p = np.array([0.15, 0.1 - 0.04 * k, 0.72 - 0.06 * k])
        c.malla(sc.bolita(f'eslabon {k}', p, (0.012, 0.02, 0.03), coll, n=1, sub=1), cadena)
    del z0
    h = F.pieza('cabeza', (0, 0.0, 0.95), tris=500)
    hc = np.array([0, 0.03, 1.07])
    # capucha redonda que cae hacia atrás como un manto (nada de punta hacia arriba)
    cap = sf.union(sdf.ellipsoid(hc, (0.16, 0.16, 0.14)), sdf.round_cone(hc + np.array([0, -0.08, -0.02]), hc + np.array([0, -0.2, -0.2]), 0.12, 0.05), k=0.06)
    cap = sf.restar(cap, sdf.ellipsoid(hc + np.array([0, 0.12, -0.01]), (0.1, 0.1, 0.11)), 0.02)
    h.sdf(cap, hc - 0.35, hc + 0.35, velo)
    h.bola(hc + np.array([0, 0.02, -0.01]), (0.1, 0.06, 0.1), vacio, 0.0)
    ojos(h, [hc + np.array([-0.04, 0.085, 0.01]), hc + np.array([0.04, 0.085, 0.01])], 0.018, ojo, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.15, 0.02, 0.9])
        a = F.pieza(f'brazo_{lado}', hom, tris=420)
        mun = np.array([s * 0.24, 0.3, 0.82])
        manga(a, hom, mun, 0.07, 0.1, velo, sem=5 + s, rasgado=0.03, dientes=0.02)
        mano = mun + np.array([0, 0.04, 0])
        a.bola(mano, (0.035, 0.03, 0.02), hueso, 0.0)
        for i in range(4):
            t = (i - 1.5) / 1.5
            b = mano + np.array([t * 0.025, 0.025, 0])
            a.trazo([b, b + np.array([t * 0.01, 0.04, -0.01]), b + np.array([t * 0.015, 0.07, -0.04])], 0.007, hueso, 0.003)
    F.marca('llama', tuple(hc))
    return F


# ---------------------------------------------------------------------------
# Minero maldito (minas): casco con vela, pico, farol al cinto, cristales de sangre en el hombro
# ---------------------------------------------------------------------------

@enemigo('minero_maldito')
def minero_maldito(coll):
    F = nueva('minero_maldito', voxel=0.0095, bioma='minas')
    piel = P_('#7A6E62', 'carne', color2='#4A3A36', sangre=0.15)
    camisa = P_('#4A4438', 'tela', semilla=1, polvo=0.5)
    cuero_pt = P_('#3E2A1C', 'cuero', semilla=2, polvo=0.4)
    pant = P_('#3A3A40', 'tela', barro=0.7, semilla=3, polvo=0.4)
    casco = P_('#6E5A30', 'hierro', semilla=4)
    cera = P_('#E8DCB8', 'cera')
    llama = P_('#FFAA33', 'brillo', mat='brillo_ambar')
    cristal = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    barba = P_('#4A4440', 'pelo', semilla=5)
    hierro = P_('#55575C', 'hierro', semilla=6)
    madera = P_('#5A3E26', 'madera', color2='#352214', eje='z')
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    una = P_('#2A2420', 'liso')
    c = F.pieza('cuerpo', (0, 0, 0.45), tris=1200)
    torso = sf.union(sdf.round_cone((0, 0.0, 0.47), (0, 0.06, 0.72), 0.19, 0.2), sdf.ellipsoid((0, 0.04, 0.76), (0.25, 0.15, 0.08)), k=0.06)
    c.sdf(torso, (-0.35, -0.25, 0.3), (0.35, 0.3, 0.9), camisa)
    dl = sf.intersect(sf.cascaron(torso, 0.016), sdf.round_box((0, 0.2, 0.6), (0.17, 0.1, 0.2), 0.02))
    c.sdf(dl, (-0.3, 0.0, 0.3), (0.3, 0.35, 0.9), cuero_pt)
    sf.cuerda_anillo(c, 'cinturon', sf.anillo(torso, (0, 0.03, 0.5), (0, 0, 1), 0.6, 20, 0.02), 0.016, cuero_pt, coll)
    # farol colgando del cinto
    fl = np.array([-0.2, 0.1, 0.4])
    c.caja(fl, (0.04, 0.04, 0.055), 0.01, hierro, 0.0)
    c.bola(fl, (0.03, 0.03, 0.04), llama, 0.0)
    c.trazo([fl + np.array([0, 0, 0.055]), fl + np.array([0, 0, 0.09]), fl + np.array([0.01, -0.02, 0.1])], 0.006, hierro, 0.0)
    # cristales de sangre que le brotan del hombro y la espalda
    for k, (p, d) in enumerate((((0.17, -0.05, 0.8), (0.4, -0.5, 1)), ((0.12, -0.12, 0.72), (0.2, -1, 0.6)), ((0.22, -0.02, 0.74), (1, -0.3, 0.4)))):
        p, d = np.array(p), sc_u(d)
        c.malla(sc.punta(f'cristal {k}', p, p + d * (0.12 - k * 0.02), 0.03 - k * 0.004, coll, seg=5), cristal)
    c.bola((0, 0.0, 0.43), (0.19, 0.15, 0.08), pant, 0.03)
    F.marca('llama', tuple(fl))
    h = F.pieza('cabeza', (0, 0.08, 0.82), tris=900)
    hc = np.array([0, 0.12, 0.95])
    h.sdf(sdf.round_box(hc, (0.13, 0.12, 0.12), 0.08), hc - 0.25, hc + 0.25, piel)
    h.sdf(sf.restar(sf.union(sdf.ellipsoid(hc + np.array([0, -0.01, 0.05]), (0.16, 0.15, 0.12)), sdf.ellipsoid(hc + np.array([0, 0.0, 0.04]), (0.2, 0.19, 0.02)),
                             k=0.02), sdf.ellipsoid(hc + np.array([0, -0.01, 0.0]), (0.15, 0.14, 0.11))), hc - 0.3, hc + 0.3, casco)
    vela = hc + np.array([0, 0.1, 0.13])
    h.cono(vela, vela + np.array([0, 0, 0.08]), 0.018, 0.017, cera, 0.0)
    for k in range(3):
        a = k * 2.0
        h.trazo([vela + np.array([math.cos(a) * 0.016, math.sin(a) * 0.016, 0.07]), vela + np.array([math.cos(a) * 0.02, math.sin(a) * 0.02, 0.02 - 0.01 * k])],
                [0.006, 0.004], cera, 0.004)
    h.malla(sc.punta('llama vela', vela + np.array([0, 0, 0.085]), vela + np.array([0, 0, 0.14]), 0.014, coll, seg=5), llama)
    h.bola(hc + np.array([0, 0.11, -0.07]), (0.11, 0.06, 0.07), barba, 0.03, ruido_amp=0.006, ruido_esc=50)
    for k in range(5):
        t = (k - 2) / 2
        b = hc + np.array([t * 0.08, 0.13, -0.11])
        h.malla(sc.punta(f'barba {k}', b, b + np.array([t * 0.02, 0.02, -0.08]), 0.025, coll, seg=4), barba)
    ojos(h, [hc + np.array([-0.045, 0.115, 0.01]), hc + np.array([0.045, 0.115, 0.01])], 0.016, ojo, coll)
    F.marca('vela', tuple(vela + np.array([0, 0, 0.1])))
    for lado, s in LADOS:
        hom = np.array([s * 0.24, 0.05, 0.76])
        a = F.pieza(f'brazo_{lado}', hom, tris=450 if s > 0 else 330)
        codo, mun = np.array([s * 0.27, 0.15, 0.6]), np.array([s * 0.24, 0.3, 0.58])
        manga(a, hom, codo + (codo - hom) * 0.2, 0.075, 0.065, camisa, sem=s + 4)
        a.trazo([hom, codo, mun], [0.06, 0.05, 0.045], piel, 0.0)
        mano_garra(a, mun, mun - codo, piel, una, coll, f'mano {lado}', tam=1.3)
        if s > 0:
            g = mun + (mun - codo) * 0.3
            a.trazo([g + np.array([0, -0.06, -0.15]), g, g + np.array([0, 0.04, 0.22])], 0.016, madera, 0.0)
            pt = g + np.array([0, 0.04, 0.22])
            a.trazo([pt + np.array([0, -0.18, -0.06]), pt + np.array([0, -0.08, 0.02]), pt, pt + np.array([0, 0.09, 0.01]), pt + np.array([0, 0.2, -0.08])],
                    [0.006, 0.018, 0.024, 0.018, 0.005], hierro, 0.0)
    for lado, s in LADOS:
        cad = np.array([s * 0.1, 0.0, 0.44])
        p = F.pieza(f'pierna_{lado}', cad, tris=320)
        tob = np.array([s * 0.11, 0.0, 0.1])
        p.cono(cad, tob, 0.09, 0.075, pant, 0.0)
        bota(p, tob, s, cuero_pt, largo=0.11, ancho=0.07, alto=0.045, cana=0.1, r_cana=0.075, suela=P_('#1E1612', 'cuero'))
    return F


# ---------------------------------------------------------------------------
# Rata de peste: rata enorme con bubones, cola pelada y dientes amarillos
# ---------------------------------------------------------------------------

@enemigo('rata_peste')
def rata_peste(coll):
    F = nueva('rata_peste', voxel=0.008, bioma='minas', cuadrupedo=1)
    pelo = P_('#5A4E44', 'pelo', color2='#3A322C', semilla=1, barro=0.6)
    piel_rosa = P_('#A87870', 'carne', color2='#7A4A48', semilla=2)
    bubon = P_('#B8B04A', 'cera', semilla=3)
    diente = P_('#D8B860', 'liso')
    una = P_('#2A2420', 'liso')
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    c = F.pieza('cuerpo', (0, 0, 0.25), tris=900)
    cuerpo_f = sf.union(sdf.ellipsoid((0, -0.06, 0.27), (0.16, 0.26, 0.17)), sdf.ellipsoid((0, 0.14, 0.27), (0.13, 0.14, 0.13)), k=0.08)
    c.sdf(sc.sdf_ruido(cuerpo_f, 0.008, 35, 2), (-0.25, -0.4, 0.05), (0.25, 0.35, 0.5), pelo)
    rng = np.random.default_rng(3)
    for k in range(7):
        d = np.array([rng.uniform(-1, 1), rng.uniform(-1, 0.5), rng.uniform(0.0, 1)])
        p, n = sf.hacia(cuerpo_f, (0, -0.02, 0.27), d, -0.006)
        if p is not None:
            c.bola(p, rng.uniform(0.022, 0.04), bubon, 0.01)
    for k in range(12):
        a = -1.0 + k * 0.17
        p, n = sf.hacia(cuerpo_f, (0, -0.05, 0.27), (math.sin(a) * 0.6, -0.2 + 0.1 * (k % 3), 1), -0.003)
        if p is not None:
            sf.diente(c, f'pelo erizado {k}', p, p + n * 0.04 + np.array([0, -0.04, 0]), 0.013, pelo, coll)
    h = F.pieza('cabeza', (0, 0.22, 0.3), tris=520)
    hc = np.array([0, 0.3, 0.3])
    h.sdf(sf.union(sdf.ellipsoid(hc, (0.09, 0.1, 0.08)), sdf.round_cone(hc + np.array([0, 0.05, -0.01]), hc + np.array([0, 0.18, -0.035]), 0.06, 0.025), k=0.04),
          hc - 0.25, hc + 0.3, pelo)
    h.bola(hc + np.array([0, 0.195, -0.03]), 0.018, piel_rosa, 0.004)
    for s in (-1, 1):
        o = sf.restar(sdf.ellipsoid(hc + np.array([s * 0.07, -0.02, 0.08]), (0.045, 0.012, 0.05)), sdf.ellipsoid(hc + np.array([s * 0.07, 0.0, 0.08]), (0.035, 0.01, 0.04)))
        h.sdf(sf.cortar(o, hc + np.array([s * 0.07, -0.02, 0.1]), (0, 0, -1), 0.01, 40, 3), hc - 0.25, hc + 0.25, piel_rosa, 0.0)
        for j in range(3):
            b = hc + np.array([s * 0.04, 0.17, -0.02])
            h.malla(sc.tubo(f'bigote {s} {j}', [b, b + np.array([s * 0.08, 0.03, 0.02 - j * 0.02])], 0.002, coll, segmentos=3, muestras=1), una)
    ojos(h, [hc + np.array([-0.045, 0.08, 0.025]), hc + np.array([0.045, 0.08, 0.025])], 0.014, ojo, coll)
    for s in (-1, 1):
        sf.diente(h, f'incisivo {s}', hc + np.array([s * 0.008, 0.19, -0.055]), hc + np.array([s * 0.008, 0.195, -0.095]), 0.009, diente, coll)
    for lado, s in LADOS:
        hom = np.array([s * 0.09, 0.13, 0.22])
        a = F.pieza(f'brazo_{lado}', hom, tris=200)
        pata = np.array([s * 0.11, 0.2, 0.03])
        a.trazo([hom, hom + np.array([s * 0.02, 0.02, -0.1]), pata], [0.04, 0.03, 0.02], pelo, 0.0)
        pata_garra(a, pata, (0, 1, 0), 4, 0.035, 0.009, piel_rosa, una, coll, 'dedo mano')
        cad = np.array([s * 0.1, -0.18, 0.24])
        p = F.pieza(f'pierna_{lado}', cad, tris=240)
        tob = np.array([s * 0.12, -0.26, 0.05])
        p.trazo([cad, cad + np.array([s * 0.03, 0.06, -0.1]), tob], [0.07, 0.04, 0.02], pelo, 0.0)
        pata_garra(p, tob + np.array([0, 0.02, -0.02]), (0, 1, 0), 4, 0.05, 0.01, piel_rosa, una, coll, 'dedo pie')
    k = F.pieza('cola', (0, -0.3, 0.22), tris=220)
    pts = [np.array([0.04 * math.sin(t * 6), -0.3 - t * 0.45, 0.22 - t * 0.17 + 0.08 * math.sin(t * 3)]) for t in np.linspace(0, 1, 8)]
    k.trazo(pts, list(np.linspace(0.028, 0.006, 8)), P_('#9A6A64', 'carne', color2='#6A4040', semilla=4), 0.0)
    return F


# ---------------------------------------------------------------------------
# Abominación de carne (minas): enorme, cosida, tercer brazo, gancho y cuchilla
# ---------------------------------------------------------------------------

@enemigo('abominacion')
def abominacion(coll):
    F = nueva('abominacion', voxel=0.013, bioma='minas')
    carne = P_('#A0645C', 'carne', color2='#6A3A44', sangre=0.6)
    carne2 = P_('#8A7A6A', 'carne', color2='#5A4A4A', semilla=2, sangre=0.4)
    hilo = P_('#1A1612', 'liso')
    hierro = P_('#55575C', 'hierro', semilla=3, sangre=0.5)
    dientes = P_('#D8CCA6', 'hueso')
    hueso = P_('#D2C6A2', 'hueso', semilla=4)
    ojo = P_('#FFAA33', 'brillo', mat='brillo_ambar')
    c = F.pieza('cuerpo', (0, 0, 0.6), tris=1800)
    torso = sf.union(sdf.ellipsoid((0, 0.05, 0.85), (0.42, 0.34, 0.38)), sdf.ellipsoid((-0.12, -0.05, 1.18), (0.32, 0.26, 0.2)),
                     sdf.ellipsoid((0.2, 0.12, 0.62), (0.26, 0.24, 0.2)), k=0.12)
    c.sdf(sc.sdf_ruido(torso, 0.012, 9, 3), (-0.6, -0.45, 0.35), (0.6, 0.55, 1.45), carne)
    c.sdf(sf.intersect(sf.cascaron(torso, 0.01), sdf.ellipsoid((0.25, 0.1, 0.95), (0.25, 0.4, 0.3))), (-0.1, -0.4, 0.6), (0.6, 0.5, 1.3), carne2)
    for k, (a0, a1) in enumerate((((-0.2, 1, 0.8), (-0.3, 1, -0.4)), ((0.4, 1, 0.9), (0.8, 0.6, -0.2)), ((-0.6, -1, 0.5), (0.3, -1, 0.6)))):
        a, na = sf.hacia(torso, (0, 0.05, 0.9), a0)
        b, nb = sf.hacia(torso, (0, 0.05, 0.9), a1)
        if a is not None and b is not None:
            sf.puntadas(c, f'costura {k}', a, b, 8, 0.05, hilo, coll, r=0.007, normal=(na + nb) / 2)
    for z in (0.72, 0.8, 0.88):
        sf.costilla(c, torso, z, -1, 110, 160, hueso, r=0.018, centro=(0, 0.05, 0), sale=0.01, n=4)
    for k in range(4):
        p, n = sf.hacia(torso, (0, 0.05, 0.9), (0.3 * k - 0.4, -1, 0.7))
        if p is not None:
            c.malla(sc.punta(f'gancho espalda {k}', p - n * 0.02, p + n * 0.1 + np.array([0, 0, 0.05]), 0.02, coll, seg=5), hierro)
    h = F.pieza('cabeza', (-0.12, 0.08, 1.28), tris=650)
    hc = np.array([-0.12, 0.2, 1.33])
    cab = sdf.ellipsoid(hc, (0.12, 0.12, 0.11))
    cab = sf.restar(cab, sdf.round_box(hc + np.array([0, 0.12, -0.04]), (0.08, 0.05, 0.03), 0.01), 0.008)
    h.sdf(cab, hc - 0.25, hc + 0.25, carne2)
    ojos(h, [hc + np.array([-0.05, 0.1, 0.03]), hc + np.array([0.04, 0.105, 0.05]), hc + np.array([0.07, 0.08, -0.02])], (0.018, 0.012, 0.01), ojo, coll)
    sf.fila_dientes(h, 'diente', hc + np.array([0, 0.11, -0.025]), 0.12, 8, 0.02, dientes, coll, sentido=-1, sem=7)
    sf.fila_dientes(h, 'diente inf', hc + np.array([0, 0.11, -0.065]), 0.11, 7, 0.018, dientes, coll, sentido=1, sem=8)
    for lado, s in LADOS:
        hom = np.array([s * 0.42, 0.05, 1.1 if s < 0 else 1.0])
        a = F.pieza(f'brazo_{lado}', hom, tris=650)
        codo, mun = np.array([s * 0.55, 0.15, 0.78]), np.array([s * 0.52, 0.4, 0.62])
        a.trazo([hom, codo, mun], [0.13, 0.1, 0.08] if s < 0 else [0.11, 0.09, 0.07], carne, 0.0)
        if s < 0:
            mano_garra(a, mun, mun - codo, carne, P_('#2A2420', 'liso'), coll, 'mano izq', tam=2.4)
        else:
            # cuchilla de carnicero injertada en vez de mano
            a.cono(mun, mun + np.array([0, 0.06, 0]), 0.06, 0.05, hierro, 0.0)
            a.caja(mun + np.array([0, 0.25, -0.02]), (0.012, 0.2, 0.09), 0.01, P_('#7D7F84', 'hierro', semilla=9, sangre=0.7), 0.0)
    e = F.pieza('extra_brazo', (0.25, -0.1, 1.25), tris=380)
    hom = np.array([0.25, -0.1, 1.25])
    codo, mun = np.array([0.42, -0.05, 1.45]), np.array([0.5, 0.15, 1.5])
    e.trazo([hom, codo, mun], [0.07, 0.06, 0.05], carne2, 0.0)
    e.trazo([mun, mun + np.array([0.02, 0.08, 0.05]), mun + np.array([0.0, 0.14, -0.02]), mun + np.array([-0.03, 0.1, -0.07])], [0.02, 0.018, 0.015, 0.008], hierro, 0.0)
    for lado, s in LADOS:
        cad = np.array([s * 0.2, 0.05, 0.58])
        p = F.pieza(f'pierna_{lado}', cad, tris=380)
        tob = np.array([s * 0.24, 0.05, 0.1])
        p.trazo([cad, cad + np.array([s * 0.05, 0.05, -0.25]), tob], [0.15, 0.12, 0.1], carne, 0.0)
        p.bola(tob + np.array([0, 0.08, -0.05]), (0.12, 0.16, 0.06), carne, 0.04)
        pata_garra(p, tob + np.array([0, 0.18, -0.07]), (0, 1, 0), 3, 0.05, 0.025, carne, P_('#2A2420', 'liso'), coll, 'uña pie')
    return F


# ---------------------------------------------------------------------------
# Lacayo explosivo (minas): jorobado chiquito con un barril de pólvora a la espalda y la mecha prendida
# ---------------------------------------------------------------------------

@enemigo('lacayo_explosivo')
def lacayo_explosivo(coll):
    F = nueva('lacayo_explosivo', voxel=0.008, bioma='minas')
    piel = P_('#7E8466', 'carne', color2='#5A4A3A', sangre=0.1)
    trapo = P_('#4A3A2C', 'tela', barro=0.7, semilla=1)
    madera = P_('#6A4A2C', 'madera', color2='#3E2816', eje='z', semilla=2)
    hierro = P_('#4A4C52', 'hierro', semilla=3)
    grieta = P_('#FF6A1A', 'brillo', mat='brillo_fuego')
    mecha = P_('#8A7450', 'cuero', semilla=4)
    ojo = P_('#FFAA33', 'brillo', mat='brillo_ambar')
    una = P_('#2A2420', 'liso')
    dientes = P_('#C9B98E', 'hueso')
    c = F.pieza('cuerpo', (0, 0, 0.3), tris=1150)
    torso = sf.union(sdf.round_cone((0, 0.0, 0.32), (0, 0.1, 0.5), 0.13, 0.12), sdf.ellipsoid((0, -0.04, 0.52), (0.16, 0.12, 0.1)), k=0.06)
    c.sdf(torso, (-0.25, -0.2, 0.18), (0.25, 0.25, 0.65), piel)
    c.sdf(sf.cortar(sf.cascaron(torso, 0.012), (0, 0, 0.28), (0, 0, 1), 0.03, 14, 2, 0.015), (-0.25, -0.2, 0.18), (0.25, 0.25, 0.65), trapo)
    # grietas encendidas en el pecho (lo que va a reventar)
    for k in range(4):
        a, na = sf.hacia(torso, (0, 0.04, 0.42), (-0.4 + 0.25 * k, 1, 0.3 - 0.15 * k), -0.0)
        if a is not None:
            c.malla(sc.tubo(f'grieta {k}', [a + na * 0.004, a + na * 0.004 + np.array([0.03, 0.0, -0.04]), a + na * 0.004 + np.array([0.01, 0.0, -0.08])],
                            0.007, coll, segmentos=4, muestras=1), grieta)
    # barril de pólvora a la espalda, con aros y la mecha encendida
    bc = np.array([0, -0.2, 0.58])
    c.cono(bc + np.array([0, 0, -0.16]), bc + np.array([0, 0, 0.16]), 0.13, 0.13, madera, 0.0)
    c.bola(bc, (0.15, 0.15, 0.12), madera, 0.06)
    for z in (-0.11, 0.0, 0.11):
        sf.cuerda_anillo(c, f'aro barril {z}', [bc + np.array([math.cos(a) * 0.152, math.sin(a) * 0.152, z]) for a in np.linspace(0, 2 * math.pi, 16, endpoint=False)],
                         0.01, hierro, coll)
    c.malla(sc.tubo('mecha', [bc + np.array([0, 0, 0.16]), bc + np.array([0.03, 0.02, 0.22]), bc + np.array([0.07, 0.0, 0.26])], 0.007, coll, segmentos=4, muestras=2),
            mecha)
    c.malla(sc.bolita('chispa', bc + np.array([0.075, 0.0, 0.27]), 0.02, coll, n=2), grieta)
    for s in (-1, 1):
        c.malla(sc.tubo(f'correa {s}', [bc + np.array([s * 0.1, 0.08, 0.12]), np.array([s * 0.1, 0.1, 0.55]), np.array([s * 0.08, 0.12, 0.35]),
                                        bc + np.array([s * 0.1, 0.1, -0.12])], 0.01, coll, segmentos=4, muestras=2), P_('#2A1C14', 'cuero'))
    F.marca('llama', tuple(bc + np.array([0.075, 0.0, 0.27])))
    h = F.pieza('cabeza', (0, 0.12, 0.52), tris=600)
    hc = np.array([0, 0.2, 0.6])
    h.sdf(sf.union(sdf.round_box(hc, (0.1, 0.09, 0.09), 0.06), sdf.round_cone(hc + np.array([0, 0.08, 0.0]), hc + np.array([0, 0.15, -0.04]), 0.03, 0.018), k=0.02),
          hc - 0.25, hc + 0.25, piel)
    for s in (-1, 1):
        h.sdf(sdf.round_cone(hc + np.array([s * 0.08, 0, 0.02]), hc + np.array([s * 0.19, -0.04, 0.08]), 0.03, 0.005), hc - 0.3, hc + 0.3, piel, 0.01)
    ojos(h, [hc + np.array([-0.04, 0.08, 0.025]), hc + np.array([0.04, 0.08, 0.025])], (0.018, 0.014), ojo, coll)
    sf.fila_dientes(h, 'diente', hc + np.array([0, 0.085, -0.05]), 0.08, 5, 0.014, dientes, coll, sentido=-1, sem=3)
    for lado, s in LADOS:
        hom = np.array([s * 0.15, 0.03, 0.5])
        a = F.pieza(f'brazo_{lado}', hom, tris=260)
        codo, mun = np.array([s * 0.2, 0.12, 0.38]), np.array([s * 0.17, 0.22, 0.3])
        a.trazo([hom, codo, mun], [0.04, 0.035, 0.03], piel, 0.0)
        mano_garra(a, mun, mun - codo, piel, una, coll, f'mano {lado}', tam=1.0)
        cad = np.array([s * 0.07, 0.0, 0.29])
        p = F.pieza(f'pierna_{lado}', cad, tris=220)
        tob = np.array([s * 0.08, 0.0, 0.06])
        p.trazo([cad, tob], [0.05, 0.035], piel, 0.0)
        manga(p, cad, cad + np.array([0, 0, -0.13]), 0.06, 0.058, trapo, sem=s + 2)
        p.bola(tob + np.array([0, 0.04, -0.03]), (0.045, 0.07, 0.03), piel, 0.02)
    return F
