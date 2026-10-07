"""Genera los 100 días de Súper Manía en Pareja: el mismo local que crece en 4 tamaños, 25 días cada uno
(Tiendita → Minimercado → Supermercado → Hipermercado). Al crecer se conserva todo (vitrinas, mejoras, ayudantes y
plata) y llegan sitios nuevos; el día lleva el número de los 100 (el 26 es el primero del Minimercado).

Dificultad como el Supermarket Mania original: carrito para unos 5 estantes, vitrinas que guardan más, más clientes
por día y las metas de plata del original:
  ⭐ 1 · Meta: vender cierta plata. Obligatoria para pasar al día siguiente.
  ⭐ 2 · Meta experta: vender bastante más (la «Expert Goal» del original).
  ⭐ 3 · Un reto que rota: propinas, clientes perdidos, espera en la caja, vitrinas vacías, limpieza, robos o
         trabajo en equipo.

Los números cambian según el modo: en pareja llegan más clientes (×1.5) y las metas suben; el reto «equipo» es de
combos en pareja (en solitario, de clientes felices).

Modo legendario (🌙): cada día tiene su versión legendaria, que se abre al sacar sus 3 estrellas. Tiene el doble de
clientes, la mitad de paciencia y 1.5× problemas. Si se cumple la meta legendaria, se gana una Luna (100 en total).

Salidas:
  juego/datos/niveles.json · para el juego (se copia a juego/web/public/datos/)
  docs/sistemas/niveles.md · tabla para leer

Uso: python3 generar_niveles.py
"""
import json
import os
import shutil

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))

TIENDAS = {1: 'Tiendita de barrio', 2: 'Minimercado', 3: 'Supermercado', 4: 'Hipermercado'}
DIAS = 25
FACTOR_PAREJA = 1.5

BASE_CLIENTES = {1: 9, 2: 15, 3: 20, 4: 25}       # clientes el primer día de cada tamaño (modo solitario)
PASO_CLIENTES = {1: 0.42, 2: 0.42, 3: 0.45, 4: 0.48}  # clientes extra por día dentro del tamaño
DURACION_BASE = 90                                 # los días duran 1:30 (un poco más en los días de evento)
PRECIO_MEDIO = {1: 5.8, 2: 6.2, 3: 6.5, 4: 6.6}    # monedas por unidad (promedio de las secciones de cada tamaño)
# Fracción de lo que dejarían todos los clientes si compraran toda su lista. Medido con el piloto (?bot, que juega sin
# perder a nadie): con listas de 3 o más productos vende 1,1-1,25 veces eso y con listas cortas apenas 1-1,05. La meta
# queda en la mitad de lo que vende el piloto y la experta en unos 4/5.
META = {1: 0.5, 2: 0.55}                            # ⭐ 1 según el largo de la lista (3 o más: 0.6)
META_EXPERTA = {1: 0.8, 2: 0.85}                    # ⭐ 2 (3 o más: 0.95)


def factor_meta(s, d, experta, evento=None):
    largo = lista_max(s, d)
    f = META_EXPERTA.get(largo, 0.95) if experta else META.get(largo, 0.6)
    # El gran día, el final y la hora pico arrancan con los estantes casi vacíos y con 30 % más de gente: el piloto
    # vende menos
    return f * (0.82 if evento in ('Gran día', 'Gran final') else 0.86 if evento == 'Hora pico' else 1)
ESPERA_CAJA = {1: 12, 2: 11, 3: 10, 4: 9}          # segundos máximos de espera promedio en caja
VACIA_MAX = {1: 25, 2: 22, 3: 20, 4: 18}           # segundos máximos que una vitrina puede quedar vacía

# Qué aparece y cuándo: (tamaño, día del tamaño) → novedad
NOVEDADES = {
    (1, 1): 'Aprender a reponer desde la bodega y a cobrar en la caja',
    (1, 2): 'Clientes con listas de 2 productos',
    (1, 3): 'Comprar sitios «+» entre días',
    (1, 4): 'Primera mejora de vitrina (nivel 2)',
    (1, 6): 'Llega el adolescente: deja basura',
    (1, 7): 'Se puede contratar a la cajera',
    (1, 8): 'Listas de 3 productos y derrames: toca el charco para trapearlo',
    (1, 11): 'Llega el ejecutivo apurado (poca paciencia)',
    (1, 12): 'Aparece el ladrón: tócalo antes de que llegue a la puerta',
    (1, 14): 'Llega la niña traviesa: tumba productos, tócala para calmarla',
    (1, 16): 'Llega la chica deportista (frutas y bebidas)',
    (1, 18): 'Visita del famoso: todos se detienen a mirarlo, atiéndelo rápido',
    (1, 20): 'Listas de 4 productos',
    (2, 1): '¡El local creció! Minimercado: la sección de carnes de regalo y sitios nuevos para comprar',
    (2, 10): 'Listas más largas: la gente del Minimercado compra de todo',
    (3, 1): '¡El local creció! Supermercado: el kiosco de wafles de regalo y vitrinas hasta nivel 3',
    (4, 1): '¡El local creció! Hipermercado: el puesto de arepas de regalo y la tienda más grande',
    (4, 13): 'Listas de hasta 5 productos',
}

EVENTOS = {
    5: ('Hora pico', 'Los clientes llegan en oleadas: +30 % de clientes'),
    10: ('Día de ofertas', 'Las islas de oferta atraen clientes: +20 % de ventas y de clientes'),
    15: ('Día lluvioso', 'Entra agua por la puerta: el doble de derrames'),
    20: ('Visita especial', 'Inspección: la limpieza cuenta doble'),
    25: ('Gran día', 'El último día de este tamaño del local: todo junto y la meta más alta'),
}


# El Diario del Barrio: días en que una noticia cambia el ánimo de la gente.
# clientes y paciencia multiplican los del día; unidades suma al promedio de lo que lleva cada cliente;
# efectos los aplica el juego (tipos de cliente más frecuentes, secciones preferidas, basura, propina, prisa).
NOTICIAS = {
    'madres': dict(titular='Se acerca el Día de la Madre',
                   texto='Llegan muchas mamás y abuelitas. Son pacientes y dejan mejor propina.',
                   clientes=1.1, paciencia=1.1, unidades=0, efectos=dict(tipos={'mama': 3, 'abuelita': 3}, propina_extra=1)),
    'partido': dict(titular='¡Hoy juega la Selección!',
                    texto='Todos quieren llegar a ver el partido: la gente está impaciente y lleva gaseosa y paquetes.',
                    clientes=1.0, paciencia=0.72, unidades=0, efectos=dict(preferir=['bebidas', 'abarrotes'])),
    'calor': dict(titular='Ola de calor en el barrio',
                  texto='Todos buscan bebidas y helados, y el calor los pone de mal genio.',
                  clientes=1.1, paciencia=0.85, unidades=0, efectos=dict(preferir=['bebidas', 'congelados'])),
    'quincena': dict(titular='¡Llegó la quincena!',
                     texto='La gente cobró: cada cliente lleva una unidad más de cada producto.',
                     clientes=1.1, paciencia=1.0, unidades=0.5, efectos=dict(unidades_extra=1)),
    'concierto': dict(titular='Concierto gratis en el parque',
                      texto='Los adolescentes pasan antes del concierto: más clientes y el doble de basura.',
                      clientes=1.2, paciencia=0.9, unidades=0, efectos=dict(tipos={'adolescente': 4}, basura_x=2)),
    'feria': dict(titular='Feria del barrio en la cuadra',
                  texto='Llega mucha más gente de lo normal. Prepara las vitrinas desde temprano.',
                  clientes=1.4, paciencia=0.95, unidades=0, efectos={}),
    'paro': dict(titular='Paro de buses en la ciudad',
                 texto='Llega menos gente, pero todos van de afán: caminan rápido y se cansan de esperar.',
                 clientes=0.85, paciencia=0.6, unidades=0, efectos=dict(velocidad_x=1.2)),
}
DIAS_NOTICIA = {3: 'madres', 7: 'partido', 9: 'calor', 12: 'quincena', 13: 'concierto', 17: 'feria', 19: 'paro',
                22: 'calor', 23: 'partido', 24: 'quincena'}


def noticia(s, d, evento):
    """La noticia del día (cada tamaño del local corre las fechas para que no se repitan en el mismo orden)."""
    if evento:
        return None
    dn = (d - 1 + 4 * (s - 1)) % DIAS + 1
    return NOTICIAS[DIAS_NOTICIA[dn]] | {'id': DIAS_NOTICIA[dn]} if dn in DIAS_NOTICIA and dn not in EVENTOS else None


def habilitado(cosa, s, d):
    """¿Está disponible 'cosa' en el tamaño s, día d? (al crecer el local se conserva lo aprendido)."""
    desde = {'basura': (1, 6), 'derrames': (1, 8), 'ladron': (1, 12), 'nina_traviesa': (1, 14), 'famoso': (1, 18)}[cosa]
    return (s, d) >= desde


def clientes(s, d, evento):
    n = BASE_CLIENTES[s] + PASO_CLIENTES[s] * (d - 1)
    nt = noticia(s, d, evento)
    if nt:
        n *= nt['clientes']
    if evento == 'Hora pico':
        n *= 1.3
    elif evento == 'Día de ofertas':
        n *= 1.2
    elif evento in ('Gran día', 'Gran final'):
        n *= 1.3
    return round(n)


def lista_max(s, d):
    """Cuántos productos puede llevar un cliente (el juego sortea de 1 a este número)."""
    if s == 1:
        return 1 if d <= 1 else 2 if d < 8 else 3 if d < 20 else 4
    if s == 2:
        return 3 if d < 10 else 4
    if s == 3:
        return 4
    return 4 if d < 13 else 5


def productos_por_cliente(s, d):
    return (lista_max(s, d) + 1) / 2


def unidades_por_producto(s, d):
    """De cada producto lleva 1 unidad los dos primeros días y luego 1 o 2 (igual que UNIDADES_MAX del juego)."""
    return 1 if s == 1 and d <= 2 else 1.5


def ticket(s, d, evento=None):
    """Monedas que deja en promedio un cliente que compra toda su lista (con la quincena, una unidad más)."""
    nt = noticia(s, d, evento)
    extra = nt['unidades'] if nt else 0
    return productos_por_cliente(s, d) * (unidades_por_producto(s, d) + extra) * PRECIO_MEDIO[s]


def redondo(x):
    return int(round(x / 5) * 5)


def objetivo(clave, s, d, n, evento):
    """Devuelve (clave, texto, meta). n = {'solitario': clientes, 'pareja': clientes}.
    Texto y meta son diccionarios por modo: en pareja llegan más clientes y la meta sube."""
    modos = ('solitario', 'pareja')
    f = 1.2 if evento == 'Día de ofertas' else 1.0
    if clave == 'ventas':
        meta = {m: redondo(n[m] * ticket(s, d, evento) * factor_meta(s, d, False, evento) * f) for m in modos}
        return clave, {m: f'Meta: vender {meta[m]} monedas' for m in modos}, meta
    if clave == 'experta':
        meta = {m: redondo(n[m] * ticket(s, d, evento) * factor_meta(s, d, True, evento) * f) for m in modos}
        return clave, {m: f'Meta experta: vender {meta[m]} monedas' for m in modos}, meta
    if clave == 'propinas':
        meta = {m: round(n[m] * 1.0 * (1 + 0.08 * (s - 1))) for m in modos}
        return clave, {m: f'Recolectar {meta[m]} monedas de propina' for m in modos}, meta
    if clave == 'perdidos':
        meta = {m: max(0, round(n[m] * 0.12) - d // 10) for m in modos}
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
    if clave == 'equipo':
        # En pareja: combos en equipo. En solitario: porcentaje de clientes felices.
        combos = 1 + d // 8 + (s - 1)
        felices = min(85, 60 + d)
        return clave, {'solitario': f'{felices} % de clientes felices', 'pareja': f'{combos} combos en pareja'}, \
            {'solitario': felices, 'pareja': combos}
    raise KeyError(clave)


def elegir_reto(s, d, evento):
    """La estrella 3 rota para que cada día se sienta distinto (los eventos tienen la suya)."""
    por_evento = {'Hora pico': 'perdidos', 'Día de ofertas': 'propinas', 'Día lluvioso': 'limpieza',
                  'Visita especial': 'limpieza', 'Gran día': 'perdidos', 'Gran final': 'equipo'}
    if evento in por_evento:
        return por_evento[evento]
    pool = ['propinas', 'perdidos', 'espera_caja', 'sin_vacias', 'equipo']
    if habilitado('basura', s, d) or habilitado('derrames', s, d):
        pool.append('limpieza')
    if habilitado('ladron', s, d):
        pool.append('robos')
    # Salto de 3 para que el mismo reto no caiga siempre en los mismos días
    return pool[(d * 3 + s) % len(pool)]


def generar():
    niveles = []
    for s in range(1, 5):
        for d in range(1, DIAS + 1):
            num = (s - 1) * DIAS + d
            evento, desc_evento = EVENTOS.get(d, (None, None))
            if num == 100:
                # (en la versión de la pareja el juego lo muestra como su aniversario; los amigos ven «Gran final»)
                evento, desc_evento = 'Gran final', 'El último de los 100 días: el local lleno, todo junto y la meta más alta'
            n1 = clientes(s, d, evento)
            n = {'solitario': n1, 'pareja': round(n1 * FACTOR_PAREJA)}
            estrellas = [objetivo('ventas', s, d, n, evento), objetivo('experta', s, d, n, evento), objetivo(elegir_reto(s, d, evento), s, d, n, evento)]
            duracion = DURACION_BASE + 3 * (d // 5) + (20 if evento else 0) + (30 if evento in ('Gran día', 'Gran final') else 0)
            paciencia = max(0.7, 1.0 - 0.008 * (d - 1) - 0.03 * (s - 1))
            nt = noticia(s, d, evento)
            if nt:
                paciencia *= nt['paciencia']
            paciencia = round(paciencia, 3)
            leg = {m: n[m] * 2 for m in n}
            luna_ventas = {m: redondo(leg[m] * ticket(s, d, evento) * 0.6) for m in leg}
            luna_perdidos = {m: round(leg[m] * 0.12) for m in leg}
            legendario = dict(
                clientes=leg, paciencia=round(paciencia * 0.5, 3), problemas_x=1.5,
                luna=dict(ventas=luna_ventas, perdidos_max=luna_perdidos,
                          texto={m: f'Vender {luna_ventas[m]} monedas con máximo {luna_perdidos[m]} clientes perdidos' for m in leg}),
            )
            niveles.append(dict(
                numero=num, tienda=s, nombre_tienda=TIENDAS[s], dia=num, dia_tienda=d, evento=evento, descripcion_evento=desc_evento,
                novedad=NOVEDADES.get((s, d)), duracion_s=duracion, paciencia=paciencia, lista_max=lista_max(s, d),
                noticia=dict(id=nt['id'], titular=nt['titular'], texto=nt['texto'], efectos=nt['efectos']) if nt else None,
                clientes=n,
                problemas=[p for p in ('basura', 'derrames', 'ladron', 'nina_traviesa', 'famoso') if habilitado(p, s, d)],
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
    L = ['# Los 100 días', '',
         'Generado por `juego/datos/generar_niveles.py`. Es el mismo local que crece en 4 tamaños, 25 días cada uno '
         '(ver `docs/sistemas/mecanicas.md`, «El local que crece»). Al crecer se conserva todo y llegan sitios nuevos.',
         '',
         '- **⭐ 1 (meta)** es obligatoria para pasar al día siguiente.',
         '- **⭐ 2 (meta experta)** pide vender bastante más, como la «Expert Goal» del Supermarket Mania original.',
         '- **⭐ 3** es un reto que rota: propinas, clientes perdidos, espera en la caja, vitrinas vacías, limpieza, robos '
         'o trabajo en equipo.',
         '',
         'Todas las cifras se muestran como *solitario / pareja*: en pareja llegan más clientes y las metas suben.',
         '',
         '**Noticias del Diario del Barrio**: algunos días traen una noticia (partido de la Selección, quincena, ola de calor, '
         'feria, paro de buses…) que cambia cuánta gente llega, su paciencia y lo que compra.',
         '',
         '**🌙 Modo legendario**: se abre en cada día al sacar sus 3 estrellas. Tiene el doble de clientes, la mitad de paciencia y 1.5× problemas. '
         'Si se cumple la meta legendaria se gana **1 Luna**; hay 100 en total.',
         '']
    for s in range(1, 5):
        L += [f'## Días {(s - 1) * DIAS + 1}-{s * DIAS} · {TIENDAS[s]}', '',
              'Abierta desde el inicio.' if s == 1 else 'El local crece al abrirse el primer día de este tamaño (pasando la meta del día anterior).', '',
              '| Día | Evento | Clientes | Lista | Novedad | ⭐ 1 | ⭐ 2 | ⭐ 3 | 🌙 Legendario |', '|---|---|---|---|---|---|---|---|---|']
        for n in (x for x in niveles if x['tienda'] == s):
            est = [_celda(e['texto']) for e in n['estrellas']]
            evento = n['evento'] or (f"Noticia: {n['noticia']['titular']}" if n['noticia'] else '')
            L.append(f"| {n['numero']} | {evento} | {n['clientes']['solitario']} / {n['clientes']['pareja']} | {n['lista_max']} | "
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
    shutil.copy(os.path.join(AQUI, 'niveles.json'), os.path.join(RAIZ, 'juego', 'web', 'public', 'datos', 'niveles.json'))
    escribir_md(niveles, os.path.join(RAIZ, 'docs', 'sistemas', 'niveles.md'))
    print(len(niveles), 'niveles ·', sum(len(n['estrellas']) for n in niveles), 'estrellas en total')
