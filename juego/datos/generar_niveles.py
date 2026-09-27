"""Genera los 100 niveles de Súper Manía en Pareja: 4 tiendas × 25 días.

Cada nivel tiene 3 estrellas:
  ⭐ 1 · Meta de ventas: obligatoria para pasar al siguiente nivel.
  ⭐ 2 y ⭐ 3 · Dos objetivos que rotan: propinas, clientes perdidos, espera en la caja,
               vitrinas vacías, limpieza, robos, productos preparados, clientes felices o
               combos en pareja.

Los números cambian según el modo: en pareja llegan más clientes (×1.5), y el objetivo
«equipo» es de combos en pareja; en solitario es de clientes felices.

Modo legendario (🌙): cada nivel tiene su versión legendaria, que se abre al sacar las
3 estrellas del nivel. Tiene el doble de clientes, la mitad de paciencia y 1.5× problemas.
Si se cumple la meta legendaria, se gana una Luna (100 en total).

Salidas:
  juego/datos/niveles.json · para el juego
  docs/niveles.md          · tabla para leer

Uso: python3 generar_niveles.py
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))

TIENDAS = {1: 'Tiendita de barrio', 2: 'Minimercado', 3: 'Supermercado', 4: 'Hipermercado'}
DIAS = 25
FACTOR_PAREJA = 1.5

BASE_CLIENTES = {1: 8, 2: 12, 3: 15, 4: 18}      # clientes el día 1 (modo solitario)
PASO_CLIENTES = {1: 0.45, 2: 0.5, 3: 0.55, 4: 0.6}  # clientes extra por día dentro de la tienda
PRECIO_MEDIO = {1: 5.6, 2: 6.4, 3: 7.2, 4: 8.0}   # monedas por producto (promedio de las vitrinas de cada tienda)
ESPERA_CAJA = {1: 12, 2: 10, 3: 9, 4: 8}           # segundos máximos de espera promedio en caja
VACIA_MAX = {1: 25, 2: 22, 3: 19, 4: 16}           # segundos máximos que una vitrina puede quedar vacía

# Qué aparece y cuándo: (tienda, día) → novedad
NOVEDADES = {
    (1, 1): 'Aprender a reponer desde la bodega y a cobrar en la caja',
    (1, 2): 'Clientes con listas de 2 productos',
    (1, 3): 'Comprar sitios «+» entre días',
    (1, 4): 'Primera mejora de vitrina (nivel 2)',
    (1, 6): 'Llega el adolescente: deja basura',
    (1, 8): 'Listas de 3 productos',
    (1, 11): 'Llega el ejecutivo apurado (poca paciencia)',
    (1, 16): 'Llega la chica deportista (frutas y bebidas)',
    (1, 20): 'Listas de 4 productos',
    (2, 1): 'Nueva tienda: se empieza de cero. Derrames en el piso',
    (2, 2): 'Se puede comprar la zona especial de wafles',
    (2, 3): 'Aparece el ladrón',
    (2, 8): 'Llega el turista (compra un poco de todo)',
    (2, 14): 'Llega el chef (compra mucho de una sola sección)',
    (3, 1): 'Nueva tienda: se empieza de cero. Ayudantes: cajera y reponedor',
    (3, 2): 'El niño perdido: llévalo con su mamá',
    (3, 3): 'Se pueden comprar la zona de arepas y las máquinas de malteadas y café',
    (4, 1): 'Nueva tienda: se empieza de cero. Ayudantes: guardia y aseo',
    (4, 3): 'Llega la niña traviesa (tumba productos)',
    (4, 5): 'Máquinas de jugos y horno de pizza',
    (4, 9): 'Visita del famoso: todos se detienen a mirarlo',
}

# Estrellas mínimas (de 75) para abrir la tienda siguiente: 70 %, 80 % y 90 %
REQUISITO_TIENDA = {2: 53, 3: 60, 4: 68}

EVENTOS = {
    5: ('Hora pico', 'Los clientes llegan en oleadas: +30 % de clientes'),
    10: ('Día de ofertas', 'Las islas de oferta atraen clientes: +20 % de ventas y de clientes'),
    15: ('Día lluvioso', 'Entra agua por la puerta: el doble de derrames'),
    20: ('Visita especial', 'Inspección: la limpieza cuenta doble'),
    25: ('Gran día', 'Final de la tienda: todo junto y la meta más alta'),
}


def habilitado(cosa, s, d):
    """¿Está disponible 'cosa' en la tienda s, día d? (las tiendas nuevas conservan lo aprendido)."""
    desde = {'basura': (1, 6), 'derrames': (2, 1), 'ladron': (2, 3), 'preparados': (2, 2), 'nino_perdido': (3, 2),
             'nina_traviesa': (4, 3), 'famoso': (4, 9)}[cosa]
    return (s, d) >= desde


def clientes(s, d, evento):
    n = BASE_CLIENTES[s] + PASO_CLIENTES[s] * (d - 1)
    if evento == 'Hora pico':
        n *= 1.3
    elif evento == 'Día de ofertas':
        n *= 1.2
    elif evento == 'Gran día':
        n *= 1.35
    return round(n)


def productos_por_cliente(s, d):
    """Largo promedio de la lista de compras. El juego sortea de 1 a `maximo` productos (igual que aquí)."""
    maximo = (1 if d <= 1 else 2 if d < 8 else 3 if d < 20 else 4) + (s - 1)
    return (maximo + 1) / 2


def ticket(s, d):
    """Monedas que deja en promedio un cliente que compra toda su lista."""
    return productos_por_cliente(s, d) * PRECIO_MEDIO[s]


def objetivo(clave, s, d, n, evento):
    """Devuelve (clave, texto, meta). n = {'solitario': clientes, 'pareja': clientes}.
    Texto y meta son diccionarios por modo: en pareja llegan más clientes y la meta sube."""
    modos = ('solitario', 'pareja')
    if clave == 'ventas':
        f = 1.2 if evento == 'Día de ofertas' else 1.0
        meta = {m: int(round(n[m] * ticket(s, d) * 0.75 * f / 5) * 5) for m in modos}
        return clave, {m: f'Vender {meta[m]} monedas' for m in modos}, meta
    if clave == 'propinas':
        meta = {m: round(n[m] * 1.1 * (1 + 0.1 * (s - 1))) for m in modos}
        return clave, {m: f'Recolectar {meta[m]} monedas de propina' for m in modos}, meta
    if clave == 'perdidos':
        meta = {m: max(0, round(n[m] * 0.15) - d // 8) for m in modos}
        txt = {m: ('Que ningún cliente se vaya sin comprar' if meta[m] == 0 else
                   f"Máximo {meta[m]} {'cliente perdido' if meta[m] == 1 else 'clientes perdidos'} por demora") for m in modos}
        return clave, txt, meta
    if clave == 'espera_caja':
        meta = ESPERA_CAJA[s]
        return clave, f'Espera promedio en caja de {meta} s o menos', meta
    if clave == 'sin_vacias':
        meta = VACIA_MAX[s]
        return clave, f'Ninguna vitrina vacía por más de {meta} s', meta
    if clave == 'limpieza':
        meta = 20 if evento != 'Visita especial' else 12
        return clave, f'Ningún charco ni basura por más de {meta} s', meta
    if clave == 'robos':
        return clave, 'Ningún robo', 0
    if clave == 'preparados':
        meta = {'solitario': 2 + d // 5, 'pareja': 3 + d // 4}
        return clave, {m: f'Vender {meta[m]} productos preparados' for m in modos}, meta
    if clave == 'equipo':
        # En pareja: combos en equipo. En solitario: porcentaje de clientes felices.
        combos = 2 + d // 6 + (s - 1)
        felices = min(90, 65 + d)
        return clave, {'solitario': f'{felices} % de clientes felices', 'pareja': f'{combos} combos en pareja'}, \
            {'solitario': felices, 'pareja': combos}
    raise KeyError(clave)


def elegir_objetivos(s, d, evento):
    """Las estrellas 2 y 3 rotan para que cada nivel se sienta distinto, y los eventos tienen las suyas."""
    if evento == 'Hora pico':
        return ['perdidos', 'espera_caja']
    if evento == 'Día de ofertas':
        return ['propinas', 'sin_vacias']
    if evento == 'Día lluvioso':
        return ['limpieza', 'perdidos']
    if evento == 'Visita especial':
        return ['limpieza', 'equipo']
    if evento == 'Gran día':
        return ['propinas', 'perdidos']
    if evento == 'Nuestro aniversario':
        return ['propinas', 'equipo']
    pool = [('propinas', 'perdidos'), ('propinas', 'espera_caja'), ('perdidos', 'sin_vacias'), ('propinas', 'equipo')]
    if habilitado('basura', s, d):
        pool.append(('limpieza', 'propinas'))
    if habilitado('ladron', s, d):
        pool.append(('robos', 'perdidos'))
    if habilitado('preparados', s, d) and s >= 2:
        pool.append(('preparados', 'propinas'))
    return list(pool[(d - 1) % len(pool)])


def generar():
    niveles = []
    for s in range(1, 5):
        for d in range(1, DIAS + 1):
            num = (s - 1) * DIAS + d
            evento, desc_evento = EVENTOS.get(d, (None, None))
            if num == 100:
                evento, desc_evento = 'Nuestro aniversario', 'Tienda decorada, música especial y un mensaje final para los dos'
            n1 = clientes(s, d, evento)
            n = {'solitario': n1, 'pareja': round(n1 * FACTOR_PAREJA)}
            estrellas = [objetivo('ventas', s, d, n, evento)] + [objetivo(k, s, d, n, evento) for k in elegir_objetivos(s, d, evento)]
            duracion = 180 + 5 * (d // 5) + (30 if evento else 0) + (60 if evento in ('Gran día', 'Nuestro aniversario') else 0)
            paciencia = round(max(0.7, 1.0 - 0.008 * (d - 1) - 0.03 * (s - 1)), 3)
            leg = {m: n[m] * 2 for m in n}
            luna_ventas = {m: int(round(leg[m] * ticket(s, d) * 0.6 / 5) * 5) for m in leg}
            luna_perdidos = {m: round(leg[m] * 0.2) for m in leg}
            legendario = dict(
                clientes=leg, paciencia=round(paciencia * 0.5, 3), problemas_x=1.5,
                luna=dict(ventas=luna_ventas, perdidos_max=luna_perdidos,
                          texto={m: f'Vender {luna_ventas[m]} monedas con máximo {luna_perdidos[m]} clientes perdidos' for m in leg}),
            )
            niveles.append(dict(
                numero=num, tienda=s, nombre_tienda=TIENDAS[s], dia=d, evento=evento, descripcion_evento=desc_evento,
                novedad=NOVEDADES.get((s, d)), duracion_s=duracion, paciencia=paciencia,
                clientes=n,
                problemas=[p for p in ('basura', 'derrames', 'ladron', 'nino_perdido', 'nina_traviesa', 'famoso') if habilitado(p, s, d)],
                estrellas=[dict(numero=i + 1, clave=k, texto=t, meta=m) for i, (k, t, m) in enumerate(estrellas)],
                legendario=legendario,
            ))
    return niveles


def _celda(t):
    if not isinstance(t, dict):
        return t
    a, b = t['solitario'], t['pareja']
    if a == b:
        return a
    # Mismo texto con distinto número: «Vender 55 / 85 monedas»
    pa, pb = a.split(), b.split()
    if len(pa) == len(pb):
        dif = [i for i, (x, y) in enumerate(zip(pa, pb)) if x != y]
        if len(dif) == 1:
            i = dif[0]
            return ' '.join(pa[:i] + [f'{pa[i]} / {pb[i]}'] + pa[i + 1:])
    return f'{a} / {b}'


def escribir_md(niveles, ruta):
    L = ['# Los 100 niveles', '',
         'Generado por `juego/datos/generar_niveles.py`. Son 4 tiendas de 25 días cada una.',
         '',
         '- **⭐ 1 (ventas)** es obligatoria para pasar al siguiente nivel.',
         '- **⭐ 2 y ⭐ 3** premian jugar bien. Pueden ser de:',
         '  - propinas;',
         '  - clientes que se fueron por demora;',
         '  - espera en la caja;',
         '  - vitrinas vacías;',
         '  - limpieza;',
         '  - robos;',
         '  - productos preparados;',
         '  - trabajo en equipo.',
         '',
         'Todas las cifras se muestran como *solitario / pareja*: en pareja llegan más clientes y las metas suben.',
         '',
         '**🌙 Modo legendario**: se abre en cada nivel al sacar sus 3 estrellas. Tiene el doble de clientes, la mitad de paciencia y 1.5× problemas. '
         'Si se cumple la meta legendaria se gana **1 Luna**; hay 100 en total.',
         '']
    for s in range(1, 5):
        req = f'Para abrirla: terminar el día 25 de la tienda anterior con al menos **{REQUISITO_TIENDA[s]} de 75 estrellas** ' \
              f'({ {2: 70, 3: 80, 4: 90}[s] } %).' if s > 1 else 'Abierta desde el inicio.'
        L += [f'## Tienda {s} · {TIENDAS[s]}', '', req, '',
              '| Nivel | Día | Evento | Clientes | Novedad | ⭐ 1 | ⭐ 2 | ⭐ 3 | 🌙 Legendario |', '|---|---|---|---|---|---|---|---|---|']
        for n in (x for x in niveles if x['tienda'] == s):
            est = [_celda(e['texto']) for e in n['estrellas']]
            L.append(f"| {n['numero']} | {n['dia']} | {n['evento'] or ''} | {n['clientes']['solitario']} / {n['clientes']['pareja']} | "
                     f"{n['novedad'] or ''} | {est[0]} | {est[1]} | {est[2]} | "
                     f"{n['legendario']['clientes']['solitario']} / {n['legendario']['clientes']['pareja']} clientes · "
                     f"{_celda(n['legendario']['luna']['texto'])} |")
        L.append('')
    with open(ruta, 'w', encoding='utf-8') as f:
        f.write('\n'.join(L))


if __name__ == '__main__':
    niveles = generar()
    with open(os.path.join(AQUI, 'niveles.json'), 'w', encoding='utf-8') as f:
        json.dump(niveles, f, ensure_ascii=False, indent=1)
    escribir_md(niveles, os.path.join(RAIZ, 'docs', 'niveles.md'))
    print(len(niveles), 'niveles ·', sum(len(n['estrellas']) for n in niveles), 'estrellas en total')
