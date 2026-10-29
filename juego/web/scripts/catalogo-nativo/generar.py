"""Genera public/jardin/motores/pvz2/catalogo-nativo.json: todas las plantas y zombis nativos de Gardendless
con nombre en español, mundo de origen y datos del almanaque, más los grupos de zombis de cada escenario.

Fuente: fuente-gardendless.json (extraída de las tablas del motor fijado con extraer.mjs). Uso:
  python3 scripts/catalogo-nativo/generar.py
"""
import json
import pathlib

import re

from fusiones import FUSIONES, P
from nombres import EXCLUIDAS, EXCLUIDOS_ZOMBI, PLANTAS, nombre_zombi

AQUI = pathlib.Path(__file__).resolve().parent
DESTINO = AQUI.parents[1] / 'public' / 'jardin' / 'motores' / 'pvz2' / 'catalogo-nativo.json'
fuente = json.loads((AQUI / 'fuente-gardendless.json').read_text())

plantas = []
for p in fuente['plantas']:
    if p['id'] in EXCLUIDAS or not p['en'] or p['vida'] is None:
        continue
    plantas.append({'id': p['id'], 'nombre': PLANTAS.get(p['id'], p['en']), 'mundo': p['mundo'] or 'especial',
                    'coste': p['coste'], 'recarga': p['recarga'], 'vida': p['vida'], 'familia': p['familia'], 'res': p['res']})
sin_nombre = [p['id'] for p in plantas if p['id'] not in PLANTAS]
zombis = []
for z in fuente['zombis']:
    if z['id'] in EXCLUIDOS_ZOMBI or not z['en']:
        continue
    zombis.append({'id': z['id'], 'nombre': nombre_zombi(z['id'], z['en']), 'mundo': z['mundo'] or 'especial', 'res': z['res'],
                   'jefe': z['id'].startswith('zombossmech_') or z['id'].startswith('kongfu_boss_')})
ids_plantas = {p['id'] for p in plantas}
fusiones = []
for en, es, a, b, (base, props) in FUSIONES:
    assert P[a] in ids_plantas and P[b] in ids_plantas and base in ids_plantas, (en, a, b, base)
    slug = re.sub(r'[^a-z0-9]+', '_', en.lower()).strip('_')
    fusiones.append({'id': base if props is None else 'fus_' + slug, 'nombre': es, 'fusion': en, 'padres': [P[a], P[b]],
                     'base': base, 'props': props})
catalogo = {'version': 1, 'fusiones': fusiones, 'motor': fuente['version'], 'plantas': plantas, 'zombis': zombis, 'escenarios': fuente['escenarios']}
DESTINO.write_text(json.dumps(catalogo, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'{len(fusiones)} fusiones, {len(plantas)} plantas, {len(zombis)} zombis, {len(fuente["escenarios"])} escenarios →', DESTINO)
if sin_nombre:
    print('Sin nombre en español:', ', '.join(sin_nombre))
