"""Los enemigos de Sangre y Ceniza (enemigos.glb): cada uno es un vacío `enemigo_<id>` con sus piezas animables
(cuerpo, cabeza, brazo_izq, brazo_der, pierna_izq, pierna_der y mandibula/ala/cola/extra_* según el bicho), con el
origen en la articulación y mirando hacia +Y. Altura de un zombi ≈ 1,1 m.

Lado: la figura mira a +Y, así que su izquierda es -X y su derecha +X.
"""
import math

import numpy as np

import sangre_comun as sc
import sangre_formas as sf
import sdf
from sangre_comun import P_

ENEMIGOS = {}


def enemigo(id_):
    def deco(fn):
        ENEMIGOS[id_] = fn
        return fn
    return deco


LADOS = (('izq', -1), ('der', 1))


def nueva(id_, voxel=0.0095, suelo=True, **extras):
    F = sc.Figura(id_, 'enemigo', voxel=voxel, suelo=suelo)
    F.extras.update(extras)
    return F


def rot_en(p, pivote, R):
    """Gira el punto p alrededor del pivote con la matriz R."""
    return np.asarray(pivote, float) + R @ (np.asarray(p, float) - np.asarray(pivote, float))


# ---------------------------------------------------------------------------
# Partes compartidas
# ---------------------------------------------------------------------------

def remiendo(pz, f, centro, direccion, tam, pt, pt_costura, coll, nombre, levantar=0.002, arriba=(0, 0, 1)):
    """Parche cosido sobre la tela: placa girada a la normal y puntadas en el borde."""
    p, n = sf.hacia(f, centro, direccion)
    if p is None:
        return
    R = sf.base_ortonormal(n, arriba)
    w, h = tam
    c = p + n * levantar
    pz.sdf(sdf.round_box(c, (w, 0.006, h), 0.004, rot=R), c - max(w, h) - 0.02, c + max(w, h) + 0.02, pt, 0.0)
    u, wv = R[:, 0], R[:, 2]
    esquinas = [c + u * sx * w * 0.85 + wv * sz * h * 0.85 + n * 0.006 for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    for i in range(4):
        a, b = esquinas[i], esquinas[(i + 1) % 4]
        sf.puntadas(pz, f'{nombre} costura {i}', a, b, 3, 0.012, pt_costura, coll, r=0.0035, normal=n)


def mano_garra(pz, muneca, direccion, pt_piel, pt_una, coll, nombre, tam=1.0, abajo=(0, 0, -1), dedos=4, curva=0.6, k=0.012):
    """Mano huesuda con dedos curvos y uñas largas."""
    d = np.asarray(direccion, float)
    d = d / np.linalg.norm(d)
    ab = np.asarray(abajo, float)
    ab = ab - (ab @ d) * d
    ab = ab / np.linalg.norm(ab)
    lat = np.cross(d, ab)
    palma = np.asarray(muneca, float) + d * 0.04 * tam
    R = np.stack([lat, d, -ab], 1)
    pz.sdf(sdf.round_box(palma, (0.036 * tam, 0.034 * tam, 0.014 * tam), 0.012 * tam, rot=R), palma - 0.08 * tam, palma + 0.08 * tam,
           pt_piel, k)
    for i in range(dedos):
        t = (i - (dedos - 1) / 2) / max(dedos - 1, 1)
        b = palma + d * 0.03 * tam + lat * t * 0.052 * tam
        m = b + d * 0.032 * tam + ab * 0.01 * tam * curva
        e = m + d * 0.02 * tam + ab * 0.032 * tam * curva
        largo = 1.0 - abs(t) * 0.25
        e = b + (e - b) * largo
        m = b + (m - b) * largo
        pz.trazo([b, m, e], [0.0105 * tam, 0.0095 * tam, 0.008 * tam], pt_piel, 0.006)
        sf.diente(pz, f'{nombre} uña {i}', e - (e - m) * 0.15, e + (e - m) / np.linalg.norm(e - m) * 0.024 * tam + ab * 0.006 * tam,
                  0.0065 * tam, pt_una, coll)
    # pulgar
    b = palma - lat * 0.03 * tam + d * 0.0
    e = b + d * 0.035 * tam - lat * 0.012 * tam + ab * 0.02 * tam
    pz.trazo([b, (b + e) / 2 - lat * 0.008 * tam, e], [0.011 * tam, 0.0095 * tam, 0.008 * tam], pt_piel, 0.006)
    sf.diente(pz, f'{nombre} uña pulgar', e, e + d * 0.016 * tam + ab * 0.008 * tam, 0.006 * tam, pt_una, coll)
    return palma


def ojos(pz, centros, r, pt, coll, nombre='ojo'):
    for i, c in enumerate(centros):
        rr = r[i] if np.ndim(r) else r
        pz.malla(sc.bolita(f'{nombre} {i}', c, rr, coll, n=2), pt)


# ---------------------------------------------------------------------------
# Zombi aldeano
# ---------------------------------------------------------------------------

@enemigo('zombi')
def zombi(coll, gordo=False):
    F = nueva('zombi', bioma='cementerio')
    piel = P_('#6A7658', 'carne', color2='#4E3B4E', sangre=0.15)
    camisa = P_('#6F6754', 'tela', sangre=0.5, semilla=1)
    remiendo1 = P_('#4A372A', 'tela', semilla=2)
    remiendo2 = P_('#323C2E', 'tela', semilla=3)
    pantalon = P_('#3C3026', 'tela', barro=0.8, semilla=4)
    hueso = P_('#D2C6A2', 'hueso')
    cuerda = P_('#8B7350', 'cuero', semilla=5)
    pelo = P_('#2C2824', 'pelo')
    una = P_('#3A3026', 'liso')
    bota = P_('#3B2B20', 'cuero', barro=0.9, semilla=6)
    ojo = P_('#FFB040', 'brillo', mat='brillo_ambar')
    hilo = P_('#1E1A16', 'liso')
    dientes = P_('#C9B98E', 'hueso', semilla=8)

    # --- cuerpo (pivote en la cadera) -------------------------------------
    c = F.pieza('cuerpo', (0, 0.0, 0.48), tris=1050)
    torso_f = sf.union(sdf.round_cone((0, 0.0, 0.5), (0, 0.1, 0.72), 0.158, 0.18),
                       sdf.ellipsoid((0, 0.1, 0.775), (0.228, 0.14, 0.08)),
                       sdf.ellipsoid((0, 0.01, 0.76), (0.17, 0.13, 0.11)),
                       sdf.ellipsoid((0, 0.1, 0.58), (0.16, 0.13, 0.12)), k=0.07)
    lo, hi = (-0.32, -0.22, 0.36), (0.32, 0.34, 0.93)
    c.sdf(torso_f, lo, hi, piel)
    cam = sf.cascaron(torso_f, 0.014)
    cam = sf.cortar(cam, (0, 0, 0.5), (0, 0, 1), amp=0.03, esc=14, sem=1, dientes=0.014, esc_dientes=45)
    cam = sf.agujero(cam, (0.12, 0.22, 0.66), (0.085, 0.09, 0.095), amp=0.02, sem=2)
    cam = sf.restar(cam, sdf.ellipsoid((0, 0.25, 0.84), (0.075, 0.11, 0.1)), 0.01)
    c.sdf(cam, lo, hi, camisa)
    # costillas que asoman por el hueco
    for i, z in enumerate((0.6, 0.64, 0.68, 0.72)):
        sf.costilla(c, torso_f, z, 1, 122, 168, hueso, r=0.0105, centro=(0, 0.08, 0), sale=0.002, n=5)
    # pelvis con el pantalón
    c.bola((0, 0.0, 0.45), (0.175, 0.14, 0.1), pantalon, k=0.02)
    # cuerda de cinturón con nudo y puntas colgando
    ring = sf.anillo(torso_f, (0, 0.03, 0.505), (0, 0, 1), 0.6, 22, 0.02)
    if len(ring) > 10:
        sf.cuerda_anillo(c, 'cinturon', ring, 0.011, cuerda, coll)
    nudo, nn = sf.hacia(torso_f, (0, 0.03, 0.5), (-0.5, 1, 0), 0.03)
    if nudo is not None:
        c.malla(sc.bolita('nudo', nudo, 0.018, coll, n=2), cuerda)
        for j, dx in enumerate((-0.012, 0.014)):
            a = nudo + np.array([dx, 0.004, -0.01])
            c.malla(sc.tubo(f'punta cuerda {j}', [a, a + np.array([dx, 0.02, -0.06]), a + np.array([dx * 1.5, 0.015, -0.12])], 0.008, coll,
                            segmentos=5, muestras=2, tapas=('flat', 'round')), cuerda)
    # remiendos en la espalda y el pecho
    remiendo(c, cam, (0, 0.04, 0.7), (-0.6, -1, 0.15), (0.05, 0.045), remiendo1, hilo, coll, 'remiendo a')
    remiendo(c, cam, (0, 0.04, 0.62), (0.7, -0.8, -0.1), (0.04, 0.05), remiendo2, hilo, coll, 'remiendo b')
    remiendo(c, cam, (0, 0.06, 0.7), (-0.7, 1, 0.2), (0.035, 0.03), remiendo1, hilo, coll, 'remiendo c')
    # harapos colgando del ruedo
    for j, (x, y) in enumerate(((-0.1, 0.16), (0.14, -0.1))):
        p, n = sf.hacia(torso_f, (0, 0.03, 0.52), (x, y, 0), 0.016)
        if p is not None:
            c.malla(sf.tira(f'harapo {j}', [p, p + np.array([0, n[1] * 0.02, -0.05]), p + np.array([0.01, n[1] * 0.03, -0.11])], 0.05, coll,
                            normal=n, grosor=0.006), camisa)

    # --- cabeza (pivote en el cuello) --------------------------------------
    h = F.pieza('cabeza', (0, 0.17, 0.81), tris=900)
    hc = np.array([0, 0.25, 0.945])
    R = sc.rot('y', 11) @ sc.rot('x', 5)

    def H(p):
        return hc + R @ np.asarray(p, float)
    craneo = sdf.round_box(hc, (0.15, 0.13, 0.135), 0.085, rot=R)
    carne = sf.union(craneo, sdf.ellipsoid(H((0, 0.115, 0.055)), (0.13, 0.04, 0.026)),
                     sdf.ellipsoid(H((-0.075, 0.1, -0.03)), (0.045, 0.035, 0.03)),
                     sdf.ellipsoid(H((0.075, 0.1, -0.03)), (0.045, 0.035, 0.03)), k=0.03)
    for s in (-1, 1):
        carne = sf.restar(carne, sdf.ellipsoid(H((s * 0.06, 0.13, 0.008)), (0.043, 0.04, 0.036)), 0.014)
    carne = sf.restar(carne, sdf.ellipsoid(H((0, 0.145, -0.035)), (0.02, 0.03, 0.026)), 0.006)
    carne = sf.restar(carne, sdf.round_box(H((0, 0.14, -0.088)), (0.075, 0.05, 0.02), 0.012, rot=R), 0.008)
    carne = sf.agujero(carne, H((0.07, 0.02, 0.125)), (0.06, 0.06, 0.05), amp=0.014, sem=4)
    h.sdf(carne, hc - 0.26, hc + 0.26, piel)
    h.sdf(sf.cascaron(craneo, -0.01), hc - 0.26, hc + 0.26, hueso)
    # orejas: la izquierda mordida
    oi = sf.cortar(sdf.ellipsoid(H((-0.152, 0.0, 0.0)), (0.026, 0.04, 0.05)), H((-0.152, 0.0, 0.0)), (0, -0.3, -1), amp=0.012, sem=6)
    h.sdf(oi, hc - 0.26, hc + 0.26, piel, 0.012)
    h.bola(H((0.155, 0.0, 0.005)), (0.026, 0.04, 0.054), piel, 0.012)
    ojos(h, [H((-0.06, 0.113, 0.008)), H((0.062, 0.115, 0.014))], (0.02, 0.016), ojo, coll)
    sf.fila_dientes(h, 'diente sup', H((0, 0.125, -0.074)), 0.1, 7, 0.018, dientes, coll, sentido=-1, curva=0.012, sem=2)
    # cicatriz cosida en la frente
    a, na = sf.hacia(craneo, hc, R @ np.array([-0.55, 0.75, 0.55]), 0.002)
    b, nb = sf.hacia(craneo, hc, R @ np.array([0.2, 0.7, 0.75]), 0.002)
    if a is not None and b is not None:
        sf.puntadas(h, 'cicatriz', a, b, 5, 0.022, hilo, coll, r=0.0042, normal=(na + nb) / 2)
    # mechones ralos
    rng = np.random.default_rng(3)
    for j in range(7):
        az = rng.uniform(-150, 150)
        el = rng.uniform(40, 75)
        d = np.array([math.sin(math.radians(az)) * math.cos(math.radians(el)), -math.cos(math.radians(az)) * math.cos(math.radians(el)) * 0.9 + 0.1,
                      math.sin(math.radians(el))])
        p, n = sf.hacia(craneo, hc, R @ d, -0.004)
        if p is None or np.linalg.norm(p - H((0.07, 0.02, 0.125))) < 0.07:
            continue
        caida = np.array([n[0] * 0.5, n[1] * 0.4 - 0.25, -0.6])
        h.malla(sc.tubo(f'mechon {j}', [p, p + n * 0.05 + caida * 0.03, p + n * 0.06 + caida * 0.1], [0.011, 0.008, 0.002], coll,
                        segmentos=5, muestras=2, tapas=('flat', 'point')), pelo)

    # --- mandíbula (bisagra bajo las orejas) --------------------------------
    piv_m = H((0, 0.0, -0.075))
    m = F.pieza('mandibula', piv_m, tris=260)
    Rm = sc.rot('x', -14) @ R
    jc = rot_en(H((0, 0.075, -0.118)), piv_m, sc.rot('x', -14))
    m.sdf(sdf.round_box(jc, (0.098, 0.07, 0.026), 0.024, rot=Rm), jc - 0.15, jc + 0.15, piel)
    sf.fila_dientes(m, 'diente inf', rot_en(H((0, 0.125, -0.1)), piv_m, sc.rot('x', -14)), 0.09, 6, 0.016, dientes, coll, sentido=1,
                    curva=0.01, sem=5)

    # --- brazos (estirados hacia adelante) --------------------------------
    for lado, s in LADOS:
        hombro = np.array([s * 0.215, 0.11, 0.78])
        a = F.pieza(f'brazo_{lado}', hombro, tris=360)
        codo = np.array([s * 0.235, 0.33, 0.79 if s > 0 else 0.73])
        muneca = np.array([s * 0.205, 0.52, 0.82 if s > 0 else 0.71])
        d1 = (codo - hombro) / np.linalg.norm(codo - hombro)
        manga = sdf.round_cone(hombro - d1 * 0.02, codo + d1 * 0.03, 0.078, 0.064)
        manga = sf.cortar(manga, codo + d1 * (0.0 if s > 0 else -0.04), -d1, amp=0.02, esc=30, sem=7 + s, dientes=0.012, esc_dientes=70)
        a.sdf(manga, np.minimum(hombro, codo) - 0.12, np.maximum(hombro, codo) + 0.12, camisa)
        brazo = sf.union(sdf.round_cone(hombro, codo, 0.056, 0.046), sdf.round_cone(codo, muneca, 0.046, 0.036), k=0.02)
        a.sdf(brazo, np.minimum(hombro, muneca) - 0.1, np.maximum(hombro, muneca) + 0.1, piel)
        d2 = (muneca - codo) / np.linalg.norm(muneca - codo)
        mano_garra(a, muneca, d2 + np.array([0, 0, -0.25]), piel, una, coll, f'mano {lado}', tam=1.15)
        if s > 0:
            # hueso que asoma del antebrazo
            p0 = codo + d2 * 0.07 + np.array([0.035, 0, 0.02])
            a.cono(p0 - np.array([0.03, 0, 0.01]), p0 + np.array([0.01, 0.02, 0.025]), 0.011, 0.008, hueso, 0.006)

    # --- piernas ------------------------------------------------------------
    for lado, s in LADOS:
        cadera = np.array([s * 0.09, 0.0, 0.47])
        p = F.pieza(f'pierna_{lado}', cadera, tris=330)
        rodilla = np.array([s * 0.1, 0.035, 0.26])
        tobillo = np.array([s * 0.1, 0.0, 0.075])
        pant = sf.union(sdf.round_cone(cadera, rodilla, 0.088, 0.072), sdf.round_cone(rodilla, tobillo, 0.072, 0.066), k=0.02)
        pant = sf.cortar(pant, tobillo + np.array([0, 0, 0.1 if s < 0 else 0.07]), (0, 0, 1), amp=0.022, esc=25, sem=9 + s,
                         dientes=0.012, esc_dientes=60)
        p.sdf(pant, cadera - np.array([0.12, 0.12, 0.5]), cadera + 0.12, pantalon)
        p.cono(rodilla, tobillo, 0.05, 0.042, piel, 0.0)
        if s < 0:
            pie = np.array([s * 0.1, 0.06, 0.034])
            p.bola(pie, (0.058, 0.1, 0.034), piel, 0.03)
            for j in range(4):
                p.bola(pie + np.array([(j - 1.5) * 0.024, 0.085, -0.004]), 0.016, piel, 0.006)
            for j in range(4):
                sf.diente(p, f'uña pie {j}', pie + np.array([(j - 1.5) * 0.024, 0.1, 0.005]), pie + np.array([(j - 1.5) * 0.024, 0.112, -0.004]),
                          0.006, una, coll)
        else:
            pie = np.array([s * 0.1, 0.05, 0.045])
            botf = sf.union(sdf.round_box(pie, (0.068, 0.108, 0.04), 0.035), sdf.round_cone(tobillo + np.array([0, 0, 0.0]), tobillo + np.array([0, 0, 0.09]), 0.06, 0.062), k=0.03)
            botf = sf.agujero(botf, pie + np.array([0.02, 0.1, 0.02]), (0.03, 0.03, 0.025), amp=0.006, sem=12)
            p.sdf(botf, pie - 0.16, pie + np.array([0.16, 0.16, 0.2]), bota)
            p.bola(pie + np.array([0.02, 0.09, 0.012]), 0.02, piel, 0.0)
            p.caja(pie + np.array([0, 0, -0.035]), (0.07, 0.11, 0.009), 0.007, P_('#211915', 'cuero', barro=1.0), 0.0)
    return F


# ---------------------------------------------------------------------------
# Esqueletos (guerrero y arquero)
# ---------------------------------------------------------------------------

def _craneo(h, hc, hueso, ojo, coll, dientes_pt, R=None, grieta=True):
    """Calavera grande (proporción de muñeco) con cuencas hondas, pómulos, nariz y dientes de arriba."""
    R = np.eye(3) if R is None else R

    def H(p):
        return hc + R @ np.asarray(p, float)
    cr = sdf.round_box(hc, (0.135, 0.125, 0.115), 0.085, rot=R)
    f = sf.union(cr, sdf.ellipsoid(H((-0.078, 0.085, -0.055)), (0.042, 0.04, 0.026)),
                 sdf.ellipsoid(H((0.078, 0.085, -0.055)), (0.042, 0.04, 0.026)),
                 sdf.round_box(H((0, 0.075, -0.095)), (0.074, 0.058, 0.03), 0.02, rot=R), k=0.03)
    for s in (-1, 1):
        f = sf.restar(f, sdf.ellipsoid(H((s * 0.055, 0.125, -0.005)), (0.045, 0.05, 0.046)), 0.012)
        f = sf.restar(f, sdf.ellipsoid(H((s * 0.128, 0.03, -0.02)), (0.025, 0.05, 0.04)), 0.02)  # sienes
    f = sf.restar(f, sdf.ellipsoid(H((0, 0.135, -0.055)), (0.017, 0.03, 0.026)), 0.005)
    if grieta:
        f = sf.agujero(f, H((-0.07, 0.0, 0.11)), (0.035, 0.04, 0.03), amp=0.01, sem=11)
    h.sdf(f, hc - 0.25, hc + 0.25, hueso)
    ojos(h, [H((-0.055, 0.1, -0.005)), H((0.055, 0.1, -0.005))], 0.018, ojo, coll)
    sf.fila_dientes(h, 'diente sup', H((0, 0.128, -0.117)), 0.1, 8, 0.02, dientes_pt, coll, sentido=-1, curva=0.016, sem=3)
    return H


def _esqueleto(coll, id_, arquero=False):
    F = nueva(id_, voxel=0.0075, bioma='cementerio')
    hueso = P_('#D6C9A6', 'hueso', polvo=0.2)
    hueso_osc = P_('#B9A783', 'hueso', semilla=2, polvo=0.2)
    dientes_pt = P_('#C8B88C', 'hueso', semilla=4)
    ojo = P_('#5ED8FF', 'brillo', mat='brillo_verde' if arquero else 'brillo_azul')
    if arquero:
        ojo = P_('#7CFF4A', 'brillo', mat='brillo_verde')
    trapo = P_('#5C1F1C', 'tela', semilla=6, barro=0.4)
    cuerda = P_('#6E5A40', 'cuero', semilla=7)
    hierro = P_('#55575C', 'hierro', semilla=8)
    madera = P_('#5A3E26', 'madera', color2='#3A2616', eje='y')
    capa = P_('#2F3A33', 'tela', semilla=9, barro=0.5)
    cuero = P_('#4A3424', 'cuero', semilla=10)
    pluma = P_('#7A1E1A', 'tela', semilla=12)

    # --- cuerpo: pelvis, columna, costillar, clavículas -----------------------
    c = F.pieza('cuerpo', (0, 0.0, 0.44), tris=1150)
    caja_t = sdf.ellipsoid((0, 0.035, 0.675), (0.135, 0.105, 0.12))
    col = [np.array([0, -0.025, z]) + np.array([0, 0.02 * math.sin((z - 0.44) * 6), 0]) for z in np.linspace(0.45, 0.83, 9)]
    sf.vertebras(c, col, 0.02, hueso, k=0.008)
    c.trazo(col, 0.011, hueso, 0.006)
    for z in (0.61, 0.645, 0.68, 0.715, 0.75):
        for s in (-1, 1):
            sf.costilla(c, caja_t, z, s, 18, 158, hueso if z < 0.7 else hueso_osc, r=0.0095, centro=(0, 0.035, 0), sale=0.0, n=6, k=0.004)
    c.trazo([(0, 0.13, 0.77), (0, 0.14, 0.7), (0, 0.13, 0.63)], [0.016, 0.014, 0.01], hueso, 0.01)
    for s in (-1, 1):
        c.trazo([(0, 0.13, 0.78), (s * 0.08, 0.09, 0.8), (s * 0.165, 0.035, 0.795)], 0.011, hueso, 0.008)
        c.bola((s * 0.08, -0.07, 0.73), (0.042, 0.011, 0.05), hueso_osc, 0.008)
        c.bola((s * 0.07, 0.01, 0.47), (0.055, 0.018, 0.045), hueso, 0.012)
    c.bola((0, -0.03, 0.445), (0.042, 0.03, 0.05), hueso, 0.012)
    c.trazo([(-0.07, 0.04, 0.41), (0, 0.065, 0.39), (0.07, 0.04, 0.41)], 0.013, hueso, 0.01)
    # taparrabo rasgado y cuerda
    ring = sf.anillo(sdf.ellipsoid((0, 0.005, 0.455), (0.12, 0.085, 0.05)), (0, 0.005, 0.455), (0, 0, 1), 0.5, 18, 0.008)
    if len(ring) > 10:
        sf.cuerda_anillo(c, 'cuerda', ring, 0.009, cuerda, coll)
    for j, (x, y, largo) in enumerate(((-0.05, 0.09, 0.16), (0.04, 0.095, 0.13), (0.0, -0.085, 0.17), (0.07, -0.07, 0.11))):
        a = np.array([x, y, 0.455])
        n = np.array([0, 1 if y > 0 else -1, 0])
        c.malla(sf.tira(f'taparrabo {j}', [a, a + n * 0.02 + np.array([0, 0, -largo * 0.5]), a + n * 0.025 + np.array([0.01, 0, -largo])],
                        0.075, coll, normal=n, grosor=0.006), trapo)
    if arquero:
        # capa con capucha (la capucha va en la cabeza): manto sobre los hombros y la espalda, ruedo rasgado
        manto = sf.union(sdf.round_cone((0, -0.03, 0.82), (0, -0.07, 0.5), 0.17, 0.2), sdf.ellipsoid((0, 0.0, 0.8), (0.2, 0.13, 0.06)), k=0.05)
        manto = sf.restar(manto, sdf.round_cone((0, 0.02, 0.84), (0, 0.0, 0.45), 0.145, 0.185), 0.0)
        manto = sf.restar(manto, sdf.round_box((0, 0.2, 0.6), (0.12, 0.12, 0.3), 0.04), 0.03)
        manto = sf.cortar(manto, (0, 0, 0.5), (0, 0, 1), amp=0.05, esc=10, sem=3, dientes=0.025, esc_dientes=40)
        c.sdf(manto, (-0.3, -0.3, 0.35), (0.3, 0.25, 0.9), capa)
        # carcaj a la espalda con flechas
        a, b = np.array([0.06, -0.15, 0.55]), np.array([-0.07, -0.16, 0.86])
        c.cono(a, b, 0.045, 0.05, cuero, 0.0)
        sf.cuerda_anillo(c, 'aro carcaj', [a + (b - a) * 0.9 + np.array([math.cos(t) * 0.052, math.sin(t) * 0.052, 0]) for t in np.linspace(0, 2 * math.pi, 9)[:-1]],
                         0.007, hierro, coll)
        d = (b - a) / np.linalg.norm(b - a)
        for j in range(5):
            o = b + np.array([(j - 2) * 0.016, 0.01 * (j % 2), 0])
            e = o + d * 0.12 + np.array([0, 0, 0.0])
            c.malla(sc.tubo(f'astil {j}', [o - d * 0.05, e], 0.005, coll, segmentos=4, muestras=1), madera)
            for q in (-1, 1):
                c.malla(sf.pluma(f'pluma flecha {j} {q}', e - d * 0.06, e + d * 0.005, 0.03, coll, normal=np.array([q, 0.3, 0])), pluma)
        sf.cuerda_anillo(c, 'correa carcaj', [(0.06, -0.12, 0.6), (0.13, 0.02, 0.7), (0.05, 0.12, 0.79), (-0.08, 0.06, 0.84), (-0.11, -0.1, 0.8)],
                         0.008, cuero, coll, cerrado=False)

    # --- cabeza ---------------------------------------------------------------
    h = F.pieza('cabeza', (0, 0.0, 0.82), tris=760)
    hc = np.array([0, 0.03, 0.935])
    R = sc.rot('y', -6) @ sc.rot('x', 4)
    H = _craneo(h, hc, hueso, ojo, coll, dientes_pt, R, grieta=not arquero)
    if arquero:
        cap = sdf.round_box(hc + np.array([0, -0.015, 0.02]), (0.165, 0.155, 0.14), 0.11, rot=R)
        cap = sf.union(cap, sdf.round_cone(H((0, -0.1, 0.02)), H((0, -0.2, -0.14)), 0.09, 0.03), k=0.05)
        cap = sf.restar(cap, sdf.round_box(hc + np.array([0, -0.01, 0.0]), (0.143, 0.14, 0.125), 0.09, rot=R), 0.0)
        cap = sf.restar(cap, sdf.ellipsoid(H((0, 0.17, -0.03)), (0.12, 0.12, 0.13)), 0.02)
        cap = sf.cortar(cap, H((0, 0, -0.12)), (0, 0, 1), amp=0.02, esc=14, sem=5, dientes=0.012)
        h.sdf(cap, hc - 0.3, hc + 0.3, capa)
    else:
        # casco viejo de hierro (casquete con borde, cresta y remaches)
        eje = R @ np.array([0.0, -0.08, 1.0])
        eje /= np.linalg.norm(eje)
        base = hc + eje * 0.04
        perfil = [(0.158, 0.0), (0.161, 0.03), (0.147, 0.066), (0.112, 0.094), (0.06, 0.109), (0.0, 0.114)]
        h.malla(sc.torno('casco', perfil, coll, segmentos=14, centro=base, eje=eje), hierro)
        borde = [base + R @ np.array([math.cos(t) * 0.162, math.sin(t) * 0.162, 0.0]) for t in np.linspace(0, 2 * math.pi, 15)[:-1]]
        sf.cuerda_anillo(h, 'borde casco', borde, 0.011, hierro, coll)
        cresta = [base + R @ np.array([0, y, 0.0]) + eje * (0.114 * math.sqrt(max(0.0, 1 - (y / 0.165) ** 2)) + 0.004) for y in np.linspace(-0.15, 0.15, 7)]
        h.malla(sc.tubo('cresta casco', cresta, 0.011, coll, segmentos=5, muestras=2), hierro)
        nasal = base + R @ np.array([0, 0.16, 0.0])
        h.malla(sc.tubo('nasal', [nasal + eje * 0.02, nasal - eje * 0.03 + R @ np.array([0, 0.012, 0]), nasal - eje * 0.075 + R @ np.array([0, 0.018, 0])],
                        [0.013, 0.011, 0.008], coll, segmentos=5, muestras=2), hierro)
        rem = [(base + R @ np.array([math.cos(t) * 0.158, math.sin(t) * 0.158, 0.02]), R @ np.array([math.cos(t), math.sin(t), 0.2]))
               for t in np.linspace(0, 2 * math.pi, 9)[:-1]]
        sf.remaches(h, 'remache casco', rem, 0.009, hierro, coll)

    # --- mandíbula ------------------------------------------------------------
    piv = H((0, 0.03, -0.1))
    m = F.pieza('mandibula', piv, tris=220)
    Rm = sc.rot('x', -10)

    def J(p):
        return rot_en(H(p), piv, Rm)
    m.trazo([J((-0.085, 0.0, -0.06)), J((-0.08, 0.04, -0.115)), J((-0.06, 0.11, -0.14)), J((0, 0.135, -0.15)), J((0.06, 0.11, -0.14)),
             J((0.08, 0.04, -0.115)), J((0.085, 0.0, -0.06))], [0.014, 0.018, 0.018, 0.02, 0.018, 0.018, 0.014], hueso)
    sf.fila_dientes(m, 'diente inf', J((0, 0.12, -0.13)), 0.09, 7, 0.017, dientes_pt, coll, sentido=1, curva=0.016, sem=8)

    # --- brazos ---------------------------------------------------------------
    for lado, s in LADOS:
        hombro = np.array([s * 0.17, 0.03, 0.78])
        a = F.pieza(f'brazo_{lado}', hombro, tris=380)
        if arquero and s < 0:
            codo, muneca = np.array([s * 0.19, 0.2, 0.74]), np.array([s * 0.175, 0.36, 0.73])
        elif arquero:
            codo, muneca = np.array([s * 0.2, 0.06, 0.62]), np.array([s * 0.1, 0.2, 0.68])
        elif s > 0:
            codo, muneca = np.array([s * 0.21, 0.12, 0.62]), np.array([s * 0.19, 0.29, 0.65])
        else:
            codo, muneca = np.array([s * 0.2, 0.07, 0.6]), np.array([s * 0.19, 0.2, 0.52])
        sf.hueso_largo(a, hombro, codo, 0.017, hueso, k=0.008)
        d = (muneca - codo) / np.linalg.norm(muneca - codo)
        lat = np.cross(d, [0, 0, 1])
        lat /= np.linalg.norm(lat)
        a.cono(codo + lat * 0.009, muneca + lat * 0.009, 0.011, 0.009, hueso, 0.006)
        a.cono(codo - lat * 0.009, muneca - lat * 0.008, 0.01, 0.009, hueso_osc, 0.006)
        a.bola(codo, 0.022, hueso, 0.008)
        a.bola(muneca, (0.018, 0.016, 0.014), hueso, 0.006)
        palma = muneca + d * 0.035
        a.bola(palma, (0.028, 0.026, 0.012), hueso, 0.008)
        ab = np.array([0, 0, -1.0])
        for i in range(4):
            t = (i - 1.5) / 1.5
            b = palma + d * 0.022 + lat * t * 0.02
            a.trazo([b, b + d * 0.025 + ab * 0.01, b + d * 0.035 + ab * 0.035], [0.0065, 0.006, 0.005], hueso, 0.003)
        if not arquero and s < 0:
            # hombrera oxidada con remaches
            hc_h = hombro + np.array([s * 0.01, 0, 0.02])
            hom = sdf.ellipsoid(hc_h, (0.085, 0.08, 0.06))
            hom = sf.restar(hom, sdf.ellipsoid(hc_h + np.array([0, 0, -0.012]), (0.075, 0.07, 0.055)))
            hom = sf.cortar(hom, hc_h + np.array([0, 0, -0.01]), (0, 0, 1), amp=0.006, esc=20, sem=4)
            a.sdf(hom, hc_h - 0.12, hc_h + 0.12, hierro)
            sf.remaches(a, 'remache hombrera', [sf.hacia(hom, hc_h, (math.cos(t), math.sin(t), 0.6)) for t in np.linspace(0, 2 * math.pi, 7)[:-1]],
                        0.007, hierro, coll)
        if not arquero and s > 0:
            # espada corta oxidada con muescas, guarda y empuñadura con correa
            g = palma + d * 0.01
            dir_h = np.array([0.0, 0.5, 0.86])
            dir_h /= np.linalg.norm(dir_h)
            a.cono(g - dir_h * 0.07, g + dir_h * 0.035, 0.012, 0.012, cuero, 0.0)
            a.bola(g - dir_h * 0.08, 0.017, hierro, 0.0)
            gu = g + dir_h * 0.045
            a.caja(gu, (0.065, 0.012, 0.012), 0.008, hierro, 0.0)
            sf.hoja_espada(a, 'hoja espada', gu + dir_h * 0.005, dir_h, (1, 0, 0), 0.42, 0.06, P_('#7D7F84', 'hierro', semilla=14), coll,
                           muescas=3, sem=1)
        if arquero and s < 0:
            # arco largo de madera con empuñadura de cuero y cuerda
            bc = palma + np.array([0, 0.015, 0.0])
            pts = [bc + np.array([0, -0.07, 0.3]), bc + np.array([0, 0.0, 0.17]), bc, bc + np.array([0, 0.0, -0.17]), bc + np.array([0, -0.07, -0.3])]
            a.trazo(pts, [0.006, 0.012, 0.016, 0.012, 0.006], madera, 0.0)
            a.cono(bc + np.array([0, 0, -0.035]), bc + np.array([0, 0, 0.035]), 0.02, 0.02, cuero, 0.0)
            a.malla(sc.tubo('cuerda arco', [pts[0] + np.array([0, -0.004, 0]), (pts[0] + pts[-1]) / 2 + np.array([0, -0.02, 0]),
                                           pts[-1] + np.array([0, -0.004, 0])], 0.0028, coll, segmentos=3, muestras=1), cuerda)
        if arquero and s > 0:
            # flecha en la mano
            o = palma + np.array([0, 0.0, 0.0])
            dir_f = np.array([-0.3, 1.0, 0.05])
            dir_f /= np.linalg.norm(dir_f)
            a.malla(sc.tubo('flecha mano', [o - dir_f * 0.12, o + dir_f * 0.2], 0.005, coll, segmentos=4, muestras=1), madera)
            sf.diente(a, 'punta flecha', o + dir_f * 0.2, o + dir_f * 0.25, 0.012, hierro, coll)
            for q in (-1, 1):
                a.malla(sf.pluma(f'pluma mano {q}', o - dir_f * 0.12, o - dir_f * 0.06, 0.028, coll, normal=np.array([q * 0.3, 0, 1])), pluma)

    # --- piernas --------------------------------------------------------------
    for lado, s in LADOS:
        cadera = np.array([s * 0.075, 0.0, 0.42])
        p = F.pieza(f'pierna_{lado}', cadera, tris=300)
        rodilla, tobillo = np.array([s * 0.08, 0.03, 0.235]), np.array([s * 0.08, 0.0, 0.06])
        sf.hueso_largo(p, cadera, rodilla, 0.019, hueso, k=0.008, nudos=0.75)
        p.bola(rodilla + np.array([0, 0.022, 0]), (0.02, 0.014, 0.022), hueso_osc, 0.006)
        p.cono(rodilla + np.array([s * -0.008, 0, 0]), tobillo + np.array([s * -0.006, 0, 0]), 0.014, 0.011, hueso, 0.006)
        p.cono(rodilla + np.array([s * 0.012, -0.006, -0.01]), tobillo + np.array([s * 0.012, -0.004, 0]), 0.008, 0.007, hueso_osc, 0.004)
        pie = tobillo + np.array([0, 0.02, -0.03])
        p.bola(pie, (0.034, 0.045, 0.02), hueso, 0.01)
        p.bola(tobillo + np.array([0, -0.028, -0.035]), 0.02, hueso, 0.01)
        for i in range(4):
            b = pie + np.array([(i - 1.5) * 0.017, 0.035, -0.002])
            p.trazo([b, b + np.array([0, 0.03, -0.01]), b + np.array([0, 0.05, -0.016])], [0.0075, 0.0065, 0.006], hueso, 0.003)
    return F


@enemigo('esqueleto')
def esqueleto(coll):
    return _esqueleto(coll, 'esqueleto')


@enemigo('esqueleto_arquero')
def esqueleto_arquero(coll):
    return _esqueleto(coll, 'esqueleto_arquero', arquero=True)


# ---------------------------------------------------------------------------
# Cuervo (vuela a la altura de la cabeza)
# ---------------------------------------------------------------------------

@enemigo('cuervo')
def cuervo(coll):
    F = nueva('cuervo', voxel=0.007, suelo=False, vuela=1, bioma='cementerio')
    negro = P_('#1F1C27', 'pelo', color2='#33284A', semilla=1)
    negro2 = P_('#16141C', 'pelo', color2='#2A2140', semilla=2)
    pico = P_('#2E2A28', 'liso', semilla=3)
    pata = P_('#2B2520', 'cuero', semilla=4)
    una = P_('#141110', 'liso')
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    z0 = 0.95
    c = F.pieza('cuerpo', (0, 0, z0), tris=520)
    cuerpo_f = sf.union(sdf.ellipsoid((0, -0.01, z0), (0.072, 0.15, 0.07)), sdf.ellipsoid((0, 0.06, z0 - 0.018), (0.07, 0.085, 0.072)),
                        sdf.round_cone((0, -0.1, z0 + 0.01), (0, -0.17, z0 + 0.02), 0.045, 0.02), k=0.04)
    c.sdf(cuerpo_f, (-0.12, -0.25, z0 - 0.12), (0.12, 0.2, z0 + 0.12), negro)
    # plumas erizadas del cuello y la espalda
    for j in range(9):
        a = -1.2 + j * 0.3
        p, n = sf.hacia(cuerpo_f, (0, 0.04, z0), (math.sin(a) * 0.8, 0.35, math.cos(a)), -0.004)
        if p is None:
            continue
        tip = p + n * 0.05 + np.array([0, -0.04, 0.0])
        c.malla(sf.pluma(f'pluma erizada {j}', p, tip, 0.03, coll, normal=n + np.array([0, 0.3, 0])), negro2)
    h = F.pieza('cabeza', (0, 0.1, z0 + 0.02), tris=380)
    hc = np.array([0, 0.16, z0 + 0.045])
    h.bola(hc, (0.055, 0.066, 0.056), negro, 0.0)
    h.bola(hc + np.array([0, 0.035, 0.03]), (0.04, 0.03, 0.022), negro, 0.02)
    h.trazo([hc + np.array([0, 0.045, 0.0]), hc + np.array([0, 0.1, -0.006]), hc + np.array([0, 0.15, -0.024])], [0.026, 0.016, 0.003], pico, 0.006)
    h.trazo([hc + np.array([0, 0.045, -0.018]), hc + np.array([0, 0.1, -0.022]), hc + np.array([0, 0.13, -0.026])], [0.018, 0.011, 0.003], pico, 0.004)
    ojos(h, [hc + np.array([-0.04, 0.035, 0.012]), hc + np.array([0.04, 0.035, 0.012])], 0.0125, ojo, coll)
    for j, dx in enumerate((-0.018, 0.0, 0.018)):
        b = hc + np.array([dx, -0.02, 0.05])
        sf.diente(h, f'cresta {j}', b, b + np.array([dx * 0.8, -0.06, 0.035]), 0.012, negro2, coll)
    for lado, s in LADOS:
        piv = np.array([s * 0.06, 0.03, z0 + 0.025])
        a = F.pieza(f'ala_{lado}', piv, tris=420)
        codo = piv + np.array([s * 0.15, 0.03, 0.04])
        punta_a = piv + np.array([s * 0.36, -0.02, 0.06])
        a.trazo([piv, codo, punta_a], [0.024, 0.018, 0.008], negro, 0.0)
        # cobertoras (cortas) y primarias (largas), dirigidas hacia atrás y afuera
        for j in range(9):
            t = j / 8
            base = piv + (punta_a - piv) * (0.08 + 0.92 * t) + np.array([0, -0.01, 0])
            largo = 0.13 + 0.12 * t
            d = np.array([s * (0.15 + 0.55 * t), -1.0, -0.05])
            d /= np.linalg.norm(d)
            a.malla(sf.pluma(f'primaria {j}', base, base + d * largo, 0.045, coll, normal=(s * 0.05, 0.1, 1), grosor=0.005), negro2 if j % 2 else negro)
        for j in range(6):
            t = j / 5
            base = piv + (codo - piv) * (0.1 + 0.9 * t) + np.array([0, 0.005, 0.006])
            d = np.array([s * 0.2, -1.0, 0])
            d /= np.linalg.norm(d)
            a.malla(sf.pluma(f'cobertora {j}', base, base + d * 0.08, 0.045, coll, normal=(0, 0.1, 1), grosor=0.005), negro)
    k = F.pieza('cola', (0, -0.15, z0 + 0.015), tris=160)
    for j in range(6):
        t = (j - 2.5) / 2.5
        b = np.array([t * 0.02, -0.15, z0 + 0.015])
        d = np.array([t * 0.35, -1.0, -0.06])
        d /= np.linalg.norm(d)
        k.malla(sf.pluma(f'timonera {j}', b, b + d * 0.18, 0.05, coll, normal=(0, 0, 1), grosor=0.005), negro2 if j % 2 else negro)
    for lado, s in LADOS:
        piv = np.array([s * 0.03, -0.01, z0 - 0.055])
        p = F.pieza(f'pierna_{lado}', piv, tris=130)
        tob = piv + np.array([0, -0.035, -0.06])
        p.trazo([piv, tob], [0.012, 0.007], pata, 0.0)
        for j, d in enumerate(((-0.25, 1, -0.2), (0, 1, -0.25), (0.25, 1, -0.2), (0, -1, -0.3))):
            d = np.array(d) * np.array([s, 1, 1])
            d = d / np.linalg.norm(d)
            e = tob + d * 0.03
            p.trazo([tob, e], [0.006, 0.005], pata, 0.003)
            sf.diente(p, f'garra {j}', e, e + d * 0.018 + np.array([0, 0, -0.012]), 0.005, una, coll)
    return F


# ---------------------------------------------------------------------------
# Murciélago
# ---------------------------------------------------------------------------

@enemigo('murcielago')
def murcielago(coll):
    F = nueva('murcielago', voxel=0.0065, suelo=False, vuela=1, bioma='castillo')
    pelo = P_('#3B2C2A', 'pelo', color2='#21181A', semilla=1)
    membrana = P_('#4F2B2F', 'cuero', semilla=2)
    hueso = P_('#2C201F', 'cuero', semilla=3)
    oreja_in = P_('#6E3A3C', 'carne', color2='#4A2427')
    colmillo = P_('#E6DCC4', 'liso')
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    z0 = 1.02
    c = F.pieza('cuerpo', (0, 0, z0), tris=380)
    c.bola((0, 0, z0), (0.066, 0.06, 0.085), pelo, 0.0, ruido_amp=0.004, ruido_esc=60)
    c.bola((0, 0.03, z0 + 0.03), (0.05, 0.04, 0.045), pelo, 0.03, ruido_amp=0.004, ruido_esc=60)
    for s in (-1, 1):
        b = np.array([s * 0.03, -0.02, z0 - 0.07])
        c.trazo([b, b + np.array([s * 0.005, -0.02, -0.035])], [0.009, 0.006], hueso, 0.004)
        for j in range(3):
            e = b + np.array([s * 0.005 + (j - 1) * 0.008, -0.02, -0.035])
            sf.diente(c, f'garra pata {s} {j}', e, e + np.array([0, 0.012, -0.012]), 0.004, colmillo, coll)
    h = F.pieza('cabeza', (0, 0.02, z0 + 0.06), tris=420)
    hc = np.array([0, 0.04, z0 + 0.1])
    h.bola(hc, (0.058, 0.052, 0.05), pelo, 0.0, ruido_amp=0.003, ruido_esc=70)
    h.bola(hc + np.array([0, 0.05, -0.012]), (0.03, 0.03, 0.024), pelo, 0.02)
    h.bola(hc + np.array([0, 0.078, -0.005]), (0.016, 0.008, 0.012), oreja_in, 0.006)
    for s in (-1, 1):
        o = sdf.round_cone(hc + np.array([s * 0.032, -0.0, 0.035]), hc + np.array([s * 0.07, -0.025, 0.155]), 0.03, 0.006)
        o = sdf.intersect(o, sdf.round_box(hc + np.array([s * 0.05, -0.012, 0.09]), (0.06, 0.016, 0.09), 0.01, rot=sc.rot('z', s * -20)))
        h.sdf(o, hc - 0.2, hc + 0.2, pelo, 0.01)
        oi = sdf.round_cone(hc + np.array([s * 0.035, 0.005, 0.05]), hc + np.array([s * 0.066, -0.012, 0.14]), 0.018, 0.004)
        oi = sdf.intersect(oi, sdf.round_box(hc + np.array([s * 0.05, 0.004, 0.09]), (0.05, 0.008, 0.08), 0.004, rot=sc.rot('z', s * -20)))
        h.sdf(oi, hc - 0.2, hc + 0.2, oreja_in, 0.0)
        sf.diente(h, f'colmillo {s}', hc + np.array([s * 0.013, 0.07, -0.03]), hc + np.array([s * 0.012, 0.074, -0.06]), 0.006, colmillo, coll)
    ojos(h, [hc + np.array([-0.026, 0.045, 0.012]), hc + np.array([0.026, 0.045, 0.012])], 0.011, ojo, coll)
    for lado, s in LADOS:
        piv = np.array([s * 0.05, 0.01, z0 + 0.03])
        a = F.pieza(f'ala_{lado}', piv, tris=520)
        mun = piv + np.array([s * 0.15, 0.05, 0.06])
        dedos = [mun + np.array([s * 0.24, -0.02, -0.02]), mun + np.array([s * 0.2, -0.12, -0.08]), mun + np.array([s * 0.1, -0.16, -0.12])]
        a.trazo([piv, mun], [0.014, 0.009], hueso, 0.0)
        for j, e in enumerate(dedos):
            a.trazo([mun, (mun + e) / 2 + np.array([0, 0.01, 0.015]), e], [0.007, 0.005, 0.003], hueso, 0.003)
        sf.diente(a, 'pulgar', mun + np.array([0, 0.01, 0.01]), mun + np.array([s * -0.01, 0.04, 0.03]), 0.006, colmillo, coll)
        cuerpo_b = np.array([s * 0.045, -0.02, z0 - 0.06])
        festones = []
        prev = mun
        borde = [piv, mun, dedos[0]]
        pts_borde = [dedos[0], dedos[1], dedos[2], cuerpo_b]
        for i in range(len(pts_borde) - 1):
            a0, a1 = pts_borde[i], pts_borde[i + 1]
            m = (a0 + a1) / 2
            hacia_m = mun - m
            m = m + hacia_m * 0.22
            festones += [a0, m]
        festones.append(cuerpo_b)
        poly = [piv, mun] + festones[:] + [piv + np.array([0, -0.03, -0.04])]
        a.malla(sf.poligono('membrana', poly, 0.006, coll), membrana)
    return F


# ---------------------------------------------------------------------------
# Perro de huesos
# ---------------------------------------------------------------------------

@enemigo('perro_huesos')
def perro_huesos(coll):
    F = nueva('perro_huesos', voxel=0.0085, bioma='cementerio', cuadrupedo=1)
    carne = P_('#4E3B36', 'carne', color2='#2E1E1E', sangre=0.35)
    pelo = P_('#2A221F', 'pelo', color2='#3A2E28', semilla=2)
    hueso = P_('#CFC2A0', 'hueso', polvo=0.15)
    hueso_osc = P_('#A8977A', 'hueso', semilla=3)
    una = P_('#1A1513', 'liso')
    ojo = P_('#FF2A1A', 'brillo', mat='brillo_rojo')
    c = F.pieza('cuerpo', (0, 0, 0.45), tris=1000)
    torso = sf.union(sdf.round_cone((0, -0.22, 0.47), (0, 0.15, 0.47), 0.095, 0.12), sdf.ellipsoid((0, 0.14, 0.42), (0.105, 0.12, 0.13)), k=0.06)
    torso_c = sf.agujero(torso, (-0.1, 0.03, 0.43), (0.08, 0.13, 0.08), amp=0.015, sem=3)
    c.sdf(torso_c, (-0.2, -0.38, 0.25), (0.2, 0.32, 0.65), carne)
    for z in (0.37, 0.41, 0.45, 0.49):
        pass
    for y in (-0.06, -0.01, 0.04, 0.09, 0.14):
        pts = []
        for t in np.linspace(0.15, 0.95, 5):
            a = math.pi * t
            d = np.array([-math.sin(a), 0, math.cos(a)])
            p, n = sf.hacia(torso, (0, y, 0.45), d, 0.003)
            if p is not None:
                pts.append(p)
        if len(pts) >= 3:
            c.trazo(pts, 0.009, hueso, 0.003)
    col = [np.array([0, y, 0.47 + 0.09 + 0.02 * math.sin(y * 9)]) for y in np.linspace(-0.25, 0.2, 9)]
    sf.vertebras(c, col, 0.022, hueso, k=0.01, puas=(0, -0.3, 1), coll=coll, pt_pua=hueso_osc)
    for j in range(10):
        a = (j % 5) / 4 * 2 - 1
        p, n = sf.hacia(torso, (0, -0.2 + j * 0.04, 0.47), (a * 0.9 + (0.3 if j % 2 else -0.3), 0, 1), -0.004)
        if p is not None:
            sf.diente(c, f'mechon {j}', p, p + n * 0.05 + np.array([0, -0.04, 0]), 0.018, pelo, coll)
    for s in (-1, 1):
        c.bola((s * 0.075, -0.24, 0.46), (0.045, 0.06, 0.05), hueso_osc, 0.02)
    # cabeza (calavera de hocico largo)
    h = F.pieza('cabeza', (0, 0.27, 0.53), tris=650)
    hc = np.array([0, 0.36, 0.6])
    cab = sf.union(sdf.ellipsoid(hc, (0.08, 0.095, 0.072)), sdf.round_cone(hc + np.array([0, 0.05, -0.01]), hc + np.array([0, 0.2, -0.04]), 0.052, 0.033),
                   sdf.ellipsoid(hc + np.array([0, 0.05, 0.045]), (0.07, 0.04, 0.02)), k=0.04)
    for s in (-1, 1):
        cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([s * 0.045, 0.07, 0.02]), (0.03, 0.03, 0.025)), 0.01)
    cab = sf.restar(cab, sdf.ellipsoid(hc + np.array([0, 0.22, -0.02]), (0.016, 0.02, 0.014)), 0.004)
    h.sdf(cab, hc - 0.3, hc + 0.3, hueso)
    ojos(h, [hc + np.array([-0.043, 0.065, 0.02]), hc + np.array([0.043, 0.065, 0.02])], 0.014, ojo, coll)
    for s in (-1, 1):
        oreja = sf.cortar(sdf.round_cone(hc + np.array([s * 0.05, -0.03, 0.05]), hc + np.array([s * 0.09, -0.11, 0.13]), 0.032, 0.008),
                          hc + np.array([s * 0.07, -0.07, 0.09]), (s * -1, 0.3, 0.5), amp=0.01, sem=4 + s)
        h.sdf(oreja, hc - 0.3, hc + 0.3, carne, 0.01)
        for j, (y, l) in enumerate(((0.12, 0.05), (0.17, 0.035))):
            b = hc + np.array([s * 0.03, y, -0.045])
            sf.diente(h, f'colmillo {s} {j}', b, b + np.array([0, 0.005, -l]), 0.009, hueso_osc, coll)
    h.bola(hc + np.array([0, -0.06, -0.04]), (0.07, 0.06, 0.06), pelo, 0.03)
    m = F.pieza('mandibula', hc + np.array([0, 0.0, -0.05]), tris=240)
    piv = hc + np.array([0, 0.0, -0.05])
    Rj = sc.rot('x', -18)
    m.trazo([rot_en(hc + np.array([0, 0.01, -0.06]), piv, Rj), rot_en(hc + np.array([0, 0.1, -0.075]), piv, Rj), rot_en(hc + np.array([0, 0.19, -0.075]), piv, Rj)],
            [0.04, 0.03, 0.022], hueso)
    for s in (-1, 1):
        for j, y in enumerate((0.1, 0.15, 0.185)):
            b = rot_en(hc + np.array([s * 0.022, y, -0.06]), piv, Rj)
            sf.diente(m, f'colmillo inf {s} {j}', b, b + Rj @ np.array([0, 0.004, 0.04 - j * 0.008]), 0.008, hueso_osc, coll)
    # patas delanteras (brazos) y traseras (piernas)
    for lado, s in LADOS:
        hom = np.array([s * 0.08, 0.17, 0.44])
        a = F.pieza(f'brazo_{lado}', hom, tris=300)
        codo, pata = np.array([s * 0.09, 0.15, 0.24]), np.array([s * 0.09, 0.21, 0.05])
        a.bola(hom + np.array([0, 0, -0.03]), (0.05, 0.06, 0.08), carne, 0.0)
        sf.hueso_largo(a, hom, codo, 0.018, hueso, k=0.01)
        a.cono(codo, pata, 0.016, 0.013, hueso, 0.006)
        a.bola(pata + np.array([0, 0.02, -0.02]), (0.035, 0.045, 0.022), hueso_osc, 0.01)
        for j in range(4):
            b = pata + np.array([(j - 1.5) * 0.017, 0.055, -0.025])
            sf.diente(a, f'garra {j}', b, b + np.array([0, 0.028, -0.02]), 0.007, una, coll)
        cad = np.array([s * 0.08, -0.24, 0.45])
        p = F.pieza(f'pierna_{lado}', cad, tris=320)
        rod, hock, pie = np.array([s * 0.09, -0.15, 0.3]), np.array([s * 0.09, -0.27, 0.16]), np.array([s * 0.09, -0.23, 0.04])
        p.bola(cad + np.array([0, 0.01, -0.04]), (0.055, 0.075, 0.09), carne, 0.0)
        p.bola(cad + np.array([s * 0.01, 0.0, -0.02]), (0.05, 0.06, 0.06), pelo, 0.0)
        sf.hueso_largo(p, cad, rod, 0.019, hueso, k=0.01)
        p.cono(rod, hock, 0.016, 0.014, hueso, 0.006)
        p.cono(hock, pie, 0.014, 0.012, hueso, 0.006)
        p.bola(pie + np.array([0, 0.02, -0.02]), (0.035, 0.045, 0.022), hueso_osc, 0.01)
        for j in range(4):
            b = pie + np.array([(j - 1.5) * 0.017, 0.055, -0.025])
            sf.diente(p, f'garra {j}', b, b + np.array([0, 0.028, -0.02]), 0.007, una, coll)
    # cola de vértebras con púas
    k = F.pieza('cola', (0, -0.3, 0.5), tris=260)
    pts = [np.array([0, -0.3 - t * 0.3, 0.5 - t * t * 0.25 + 0.05 * math.sin(t * 3)]) for t in np.linspace(0, 1, 8)]
    k.trazo(pts, list(np.linspace(0.016, 0.006, 8)), hueso, 0.006)
    for i, p in enumerate(pts[:-1]):
        k.bola(p, 0.022 * (1 - i / 9), hueso_osc, 0.006)
        if i % 2 == 0:
            sf.diente(k, f'pua cola {i}', p, p + np.array([0, -0.02, 0.04 * (1 - i / 9)]), 0.008, hueso_osc, coll)
    return F
