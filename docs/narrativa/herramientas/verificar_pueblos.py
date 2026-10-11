#!/usr/bin/env python3
"""Revisa la vida de los pueblos (docs/narrativa/datos/pueblos/*.json) antes de compilarla con integrar_motor.py:
IDs únicos, hablantes y vínculos que existen, casas, pasos con materiales y estadísticas válidas, ropa del clóset y
cantidades de cada texto. Sale con error y la lista de problemas si algo no cuadra."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
N = ROOT / 'docs/narrativa'
WEB = ROOT / 'juego/web'
reparto = json.loads((N / 'datos/reparto.json').read_text())
original = json.loads((WEB / 'src/granja-v3/REPARTO-MUNDOS.json').read_text())
prendas = {m['m']: m for m in json.loads((WEB / 'src/salas/prendas.json').read_text())['modelos']}
objetos = set(json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {compilarModulo} from './scripts/granja-v3/modulos-prueba.mjs';const O=await import(await compilarModulo(new URL('./src/granja-v3/objetos.ts',import.meta.url)));process.stdout.write(JSON.stringify(Object.keys(O.OBJETOS)));"],
    cwd=WEB, text=True)))
ESTADISTICAS = {'cosechar', 'plantar', 'regar', 'alimentar', 'pescar', 'mineral', 'fabricar', 'construir', 'reparar', 'curar', 'comidas', 'expediciones', 'vender'}
RANURAS = ['pelo', 'cabeza', 'cara', 'arriba', 'abajo', 'pies', 'espalda']
POSES = {'reposo', 'brazos_cruzados', 'jarras', 'pensando', 'pensando_b', 'contar_a', 'frotar_manos_a', 'reloj', 'senalar_a', 'senalar_arriba', 'inclinado',
         'presumir_a', 'risita_a', 'reverencia', 'pulgares_a'}
regiones = {s['id'] for s in original['asentamientos']} | {'cruce_valle', 'confluencia'}
casas = {h['id']: h for h in original['viviendas']}

vida = {'residentes': [], 'viviendas': [], 'encargos': []}
for f in sorted((N / 'datos/pueblos').glob('*.json')):
    if f.name.startswith('contexto'):
        continue
    d = json.loads(f.read_text())
    for k in vida:
        vida[k] += d.get(k, [])

errores = []
viejos = {n['id'] for n in reparto}
nombres_viejos = {n['nombre'] for n in reparto}
nuevos = {}
for n in vida['residentes']:
    i = n.get('id', '?')
    if i in viejos or i in nuevos:
        errores.append(f'{i}: ID repetido')
    if n.get('nombre') in nombres_viejos:
        errores.append(f'{i}: el nombre {n.get("nombre")} ya lo tiene otro residente')
    nuevos[i] = n
    if n.get('asentamiento') not in regiones:
        errores.append(f'{i}: región desconocida {n.get("asentamiento")}')
    for k in ['funcion', 'pasado', 'presente', 'arco', 'memorias', 'cotidiano', 'conversacion', 'hogar', 'ropa']:
        if not n.get(k):
            errores.append(f'{i}: falta {k}')
    if len(n.get('memorias', [])) != 3 or any(len(m.get('texto', '').split()) < 30 for m in n.get('memorias', [])):
        errores.append(f'{i}: necesita 3 memorias de al menos 30 palabras')
    if len(n.get('conversacion', [])) < 3:
        errores.append(f'{i}: la conversación necesita al menos 3 líneas')
    r = n.get('ropa') or []
    if len(r) < 10 or r[0] not in ('el', 'ella') or not (0 <= r[1] <= 5):
        errores.append(f'{i}: fila de ropa inválida')
    else:
        for ranura, valor in zip(RANURAS, r[3:10]):
            if not valor:
                continue
            m = prendas.get(valor.split('#')[0])
            if not m or m['r'] != ranura or r[0] not in m['para']:
                errores.append(f'{i}: prenda {valor} no sirve en {ranura} para {r[0]}')
        if len(r) > 10 and r[10] not in POSES:
            errores.append(f'{i}: pose {r[10]} desconocida')
ids = viejos | set(nuevos) | {'el', 'ella', 'narrador'}
for n in nuevos.values():
    for v in n.get('vinculos', []):
        if v not in ids:
            errores.append(f'{n["id"]}: vínculo desconocido {v}')
    for l in n.get('conversacion', []):
        if l.get('hablante') not in ids:
            errores.append(f'{n["id"]}: hablante desconocido {l.get("hablante")}')
casas_nuevas = {}
for h in vida['viviendas']:
    if h['id'] in casas or h['id'] in casas_nuevas:
        errores.append(f'{h["id"]}: casa repetida')
    casas_nuevas[h['id']] = h
por_region = {}
for h in list(casas.values()) + list(casas_nuevas.values()):
    por_region[h['asentamientoId']] = por_region.get(h['asentamientoId'], 0) + 1
for reg, k in por_region.items():
    if reg != 'pueblo_sol' and k > 6:
        errores.append(f'{reg}: {k} casas (caben 6 en el plano)')
for n in nuevos.values():
    if n.get('hogar') not in casas and n.get('hogar') not in casas_nuevas:
        errores.append(f'{n["id"]}: casa desconocida {n.get("hogar")}')
npc_region = {}
for n in reparto + list(nuevos.values()):
    npc_region[n['asentamiento']] = npc_region.get(n['asentamiento'], 0) + 1
for reg, k in npc_region.items():
    if reg != 'pueblo_sol' and k > 16:
        errores.append(f'{reg}: {k} habitantes (caben 16 puestos)')
vistos = set()
for q in vida['encargos']:
    i = q.get('id', '?')
    if i in vistos or not re.fullmatch(r'EP?_[a-z_0-9]+', i):
        errores.append(f'{i}: ID repetido o con formato inválido')
    vistos.add(i)
    if q.get('region') not in regiones:
        errores.append(f'{i}: región desconocida')
    if q.get('clase') not in ('encargo', 'encargo_entre_pueblos'):
        errores.append(f'{i}: clase inválida')
    for k in ['titulo', 'pasos', 'inicio', 'giro', 'decision', 'opciones', 'ramas', 'cierre']:
        if not q.get(k):
            errores.append(f'{i}: falta {k}')
    if len(q.get('opciones', [])) != 2 or len(q.get('ramas', [])) != 2:
        errores.append(f'{i}: necesita 2 opciones y 2 ramas')
    for st in q.get('pasos', []):
        t = st.get('tipo')
        if t == 'entrega':
            for o, c in st.get('materiales', {}).items():
                if o not in objetos or not (isinstance(c, int) and 1 <= c <= 20):
                    errores.append(f'{i}: material inválido {o}×{c}')
        elif t == 'visitas':
            for r in st.get('regiones', []):
                if r not in regiones:
                    errores.append(f'{i}: región de visita desconocida {r}')
        elif t == 'estadistica':
            if st.get('clave') not in ESTADISTICAS or not isinstance(st.get('cantidad'), int):
                errores.append(f'{i}: estadística inválida {st.get("clave")}')
        elif t == 'jornadas':
            if not isinstance(st.get('cantidad'), int):
                errores.append(f'{i}: jornadas sin cantidad')
        elif t == 'testimonios':
            for x in st.get('npc', []):
                if x not in ids:
                    errores.append(f'{i}: testigo desconocido {x}')
        elif t != 'archivo':
            errores.append(f'{i}: paso de tipo {t} no lo ejecuta el motor')
    lineas = q.get('inicio', []) + q.get('giro', []) + q.get('cierre', []) + [l for r in q.get('ramas', []) for l in r]
    for l in lineas:
        if l.get('hablante') not in ids or not l.get('texto'):
            errores.append(f'{i}: línea con hablante desconocido {l.get("hablante")}')
    for x in q.get('reparto', []):
        if x not in ids:
            errores.append(f'{i}: reparto desconocido {x}')
    for x in q.get('requiere', []):
        if x not in {e['id'] for e in vida['encargos']}:
            errores.append(f'{i}: requiere un encargo que no existe {x}')
    pago = q.get('recompensa', {})
    if not (0 <= pago.get('monedas', 0) <= 400):
        errores.append(f'{i}: recompensa en monedas fuera de rango')
    for o, c in pago.get('objetos', {}).items():
        if o not in objetos or not (isinstance(c, int) and 1 <= c <= 10):
            errores.append(f'{i}: objeto de recompensa inválido {o}×{c}')
print(json.dumps({'residentes': len(nuevos), 'viviendas': len(casas_nuevas), 'encargos': len(vida['encargos']), 'errores': len(errores)}, ensure_ascii=False))
for e in errores:
    print(' -', e)
sys.exit(1 if errores else 0)
