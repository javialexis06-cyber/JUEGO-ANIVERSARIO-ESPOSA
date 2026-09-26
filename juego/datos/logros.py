"""Logros y coleccionables de Súper Manía en Pareja.

Salidas: juego/datos/logros.json (para el juego) y docs/logros.md (para leer).
Uso: python3 logros.py
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))

# (id, nombre, descripción con {n}, contador, [bronce, plata, oro], categoría, modo)
# modo: 'todos' | 'pareja' | 'solitario'
LOGROS = [
    ('reponer', 'Nunca falta nada', 'Reponer {n} vitrinas', 'vitrinas_repuestas', [100, 500, 2000], 'Tienda', 'todos'),
    ('siempre_llena', 'Vitrina siempre llena', 'Terminar {n} niveles sin que ninguna vitrina quede vacía', 'niveles_sin_vacias', [1, 10, 30], 'Tienda', 'todos'),
    ('cero_perdidos', 'Nadie se va con las manos vacías', 'Terminar {n} niveles sin clientes perdidos', 'niveles_sin_perdidos', [1, 10, 50], 'Clientes', 'todos'),
    ('propinas', 'Propineros', 'Juntar {n} monedas de propina', 'propinas_total', [500, 2500, 10000], 'Clientes', 'todos'),
    ('caja', 'Caja rápida', 'Atender {n} clientes en la caja', 'clientes_cobrados', [100, 1000, 5000], 'Clientes', 'todos'),
    ('felices', 'Caritas verdes', 'Que {n} clientes salgan felices', 'clientes_felices', [100, 1000, 5000], 'Clientes', 'todos'),
    ('trapero', 'Trapero de oro', 'Limpiar {n} derrames', 'derrames_limpios', [25, 150, 500], 'Limpieza', 'todos'),
    ('basura', 'Tienda impecable', 'Recoger {n} basuras', 'basuras', [50, 300, 1000], 'Limpieza', 'todos'),
    ('ladrones', 'Atrapaladrones', 'Atrapar {n} ladrones', 'ladrones', [10, 50, 200], 'Seguridad', 'todos'),
    ('ninos', 'Reencuentros', 'Devolver {n} niños perdidos a su mamá', 'ninos_devueltos', [5, 25, 100], 'Seguridad', 'todos'),
    ('famoso', 'Fans número 1', 'Atender al famoso en menos de 20 s, {n} veces', 'famoso_rapido', [1, 5, 20], 'Clientes', 'todos'),
    ('wafles', 'Maestros del wafle', 'Vender {n} wafles', 'wafles', [25, 150, 500], 'Zonas especiales', 'todos'),
    ('arepas', 'De corazón arepero', 'Vender {n} arepas', 'arepas', [25, 150, 500], 'Zonas especiales', 'todos'),
    ('barista', 'Baristas', 'Vender {n} malteadas, cafés o jugos', 'bebidas_preparadas', [25, 150, 500], 'Zonas especiales', 'todos'),
    ('quemado', 'Ni uno quemado', 'Terminar {n} niveles sin quemar nada en la cocina', 'niveles_sin_quemar', [1, 10, 25], 'Zonas especiales', 'todos'),
    ('combos', 'Combo de amor', 'Hacer {n} combos en pareja', 'combos', [25, 250, 1000], 'Pareja', 'pareja'),
    ('sincronizados', 'Sincronizados', 'Hacer {n} combos en un solo día', 'max_combos_dia', [5, 10, 20], 'Pareja', 'pareja'),
    ('mano_a_mano', 'Mano a mano', 'Terminar {n} niveles en pareja', 'niveles_pareja', [5, 25, 100], 'Pareja', 'pareja'),
    ('sola', 'Yo puedo', 'Terminar {n} tiendas completas en solitario', 'tiendas_solitario', [1, 2, 4], 'Solitario', 'solitario'),
    ('estrellas', 'Cielo estrellado', 'Conseguir {n} estrellas', 'estrellas', [50, 150, 300], 'Progreso', 'todos'),
    ('perfectos', 'Perfección', 'Sacar 3 estrellas al primer intento en {n} niveles', 'perfectos_primer_intento', [10, 50, 100], 'Progreso', 'todos'),
    ('madrugadores', 'Madrugadores', 'Cumplir la meta de ventas antes de la mitad del día en {n} niveles', 'meta_temprana', [1, 10, 30], 'Progreso', 'todos'),
    ('lunas', 'Noche de lunas', 'Conseguir {n} Lunas en modo legendario', 'lunas', [1, 25, 100], 'Legendario', 'todos'),
    ('dorados', 'Todo dorado', 'Conseguir las 25 Lunas de {n} tiendas', 'tiendas_lunas_completas', [1, 2, 4], 'Legendario', 'todos'),
]

# Logros únicos (sin rangos)
UNICOS = [
    ('primer_dia', 'Abrimos', 'Terminar el nivel 1'),
    ('duenos_1', 'Dueños de la tiendita', 'Comprar los 12 sitios de la tiendita y mejorarlos todos al tope'),
    ('duenos_2', 'Dueños del minimercado', 'Comprar los 22 sitios del minimercado y mejorarlos todos al tope'),
    ('duenos_3', 'Dueños del supermercado', 'Comprar los 33 sitios del supermercado y mejorarlos todos al tope'),
    ('duenos_4', 'Dueños del hipermercado', 'Comprar los 45 sitios del hipermercado y mejorarlos todos al tope'),
    ('equipo_completo', 'Equipo completo', 'Tener los 4 ayudantes contratados al mismo tiempo'),
    ('aniversario', 'Feliz aniversario', 'Terminar el nivel 100'),
    ('leyendas', 'Leyendas del súper', 'Conseguir las 300 estrellas y las 100 Lunas'),
]

COLECCIONABLES = [
    ('corazones', 'Corazones escondidos', 100,
     'En cada nivel aparece una vez un corazoncito de plastilina escondido (dura 10 s). Tócalo para guardarlo. Cada 10 corazones se abre '
     'una página del álbum de recuerdos de la pareja.'),
    ('figuritas', 'Álbum de clientes', 30,
     'Cada uno de los 10 tipos de cliente tiene una figurita de bronce, plata y oro, que se gana al atenderlo 10, 50 y 200 veces.'),
    ('cajas_doradas', 'Cajas doradas', 9,
     'Al conseguir todas las Lunas de los niveles de una sección, su caja de la bodega se vuelve dorada.'),
    ('recetas', 'Recetas', 8,
     'Variantes que se desbloquean con logros: arepa de queso, arepa de choclo, arepa con huevo, wafle de chocolate, wafle de '
     'arequipe, malteada de mora, café con leche y pizza hawaiana. Aparecen como productos nuevos.'),
    ('postales', 'Postales', 4,
     'Una por tienda, al sacar las 3 estrellas en su Gran día. Muestran un lugar especial para ustedes, que ustedes eligen.'),
]


SINGULAR = [(' niveles', ' nivel'), (' tiendas completas', ' tienda completa'), (' veces', ' vez'), (' Lunas', ' Luna'),
            (' tiendas', ' tienda')]


def _texto(desc, m):
    antes, despues = desc.split('{n}', 1)
    if m == 1:  # singular solo en lo que viene después del número
        for a, b in SINGULAR:
            if despues.startswith(a) or f'{a} ' in despues or despues.endswith(a):
                despues = despues.replace(a, b, 1)
                break
    return antes + f'{m:,}'.replace(',', '.') + despues


def generar():
    logros = []
    for id_, nombre, desc, contador, metas, cat, modo in LOGROS:
        logros.append(dict(id=id_, nombre=nombre, categoria=cat, modo=modo, contador=contador,
                           rangos=[dict(rango=r, meta=m, texto=_texto(desc, m)) for r, m in zip(('bronce', 'plata', 'oro'), metas)]))
    for id_, nombre, desc in UNICOS:
        logros.append(dict(id=id_, nombre=nombre, categoria='Especiales', modo='todos', contador=None, rangos=[dict(rango='único', meta=1, texto=desc)]))
    colecc = [dict(id=i, nombre=n, total=t, descripcion=d) for i, n, t, d in COLECCIONABLES]
    return dict(logros=logros, coleccionables=colecc)


def escribir_md(data, ruta):
    L = ['# Logros y coleccionables', '', 'Generado por `juego/datos/logros.py`.', '',
         '- **Logros por rangos:** tienen bronce, plata y oro. Cada rango da una medalla para la vitrina de trofeos del menú y algunas recompensas cosméticas.',
         '- **Logros especiales:** se ganan una sola vez.',
         '- **Qué partidas cuentan:** los logros suman lo que pase en las 3 partidas (la de Ella, la de Él y la de los dos). Los que dicen *pareja* o *solitario* solo cuentan en ese modo.',
         '', '## Logros por rangos', '', '| Logro | Categoría | Modo | 🥉 Bronce | 🥈 Plata | 🥇 Oro |', '|---|---|---|---|---|---|']
    for g in data['logros']:
        if g['categoria'] == 'Especiales':
            continue
        r = g['rangos']
        L.append(f"| **{g['nombre']}** | {g['categoria']} | {g['modo']} | {r[0]['texto']} | {r[1]['texto']} | {r[2]['texto']} |")
    L += ['', '## Logros especiales', '', '| Logro | Cómo se gana |', '|---|---|']
    for g in data['logros']:
        if g['categoria'] == 'Especiales':
            L.append(f"| **{g['nombre']}** | {g['rangos'][0]['texto']} |")
    L += ['', '## Coleccionables', '', '| Colección | Cantidad | Cómo se consigue |', '|---|---|---|']
    for c in data['coleccionables']:
        L.append(f"| **{c['nombre']}** | {c['total']} | {c['descripcion']} |")
    L += ['',
          '## Recompensas de los logros',
          '',
          '- **🥉 Bronce:** medalla en la vitrina de trofeos.',
          '- **🥈 Plata:** medalla y un adorno para la tienda: una planta especial, un cuadro de ustedes o un letrero con sus nombres.',
          '- **🥇 Oro:** medalla y un cosmético para Él y Ella, como sombreros, delantales o camisetas de la tienda.',
          '- **Leyendas del súper:** vitrinas con acabado dorado en todas las tiendas.']
    with open(ruta, 'w', encoding='utf-8') as f:
        f.write('\n'.join(L) + '\n')


if __name__ == '__main__':
    data = generar()
    with open(os.path.join(AQUI, 'logros.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    escribir_md(data, os.path.join(RAIZ, 'docs', 'logros.md'))
    n_rangos = sum(len(g['rangos']) for g in data['logros'])
    print(len(data['logros']), 'logros ·', n_rangos, 'medallas ·', sum(c['total'] for c in data['coleccionables']), 'coleccionables')
