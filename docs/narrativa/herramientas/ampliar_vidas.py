"""Incorpora biografías escritas a mano, sin cambiar identidades o viviendas del motor."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
vidas = {}


def v(nid, infancia, aprendizaje, quiebre, cotidiano, fuatia, antes, despues):
    if nid in vidas:
        raise ValueError('Vida duplicada: ' + nid)
    memorias = [dict(etapa=k, texto=t) for k, t in zip(
        ['Primeros años y lo que aprendió a querer', 'Aprendizaje, decisiones y vínculos', 'Lo que cambia y lo que todavía pesa'],
        [infancia, aprendizaje, quiebre])]
    escenas = [dict(id=f'VID_{nid}_{i}', momento=moment, lineas=lines,
                    condicion=('visita_autorizada' if i == 1 else 'mision_personal_completada'),
                    premio=None, capa='mundo', repetible=True)
               for i, moment, lines in [(1, 'Antes del cambio', antes), (2, 'Después del arco personal', despues)]]
    for m in memorias:
        if len(m['texto'].split()) < 35:
            raise ValueError('Etapa demasiado breve: ' + nid)
    for scene in escenas:
        if len(scene['lineas'].splitlines()) != 4:
            raise ValueError('Escena incompleta: ' + nid)
    vidas[nid] = dict(id=nid, memorias=memorias, cotidiano=cotidiano,
                     postura_fuatia=fuatia, escenas=escenas, estado='diseno_no_integrado')


for path in sorted((ROOT / 'herramientas/vidas').glob('*.py')):
    exec(compile(path.read_text(), str(path), 'exec'), {'v': v})

reparto = json.loads((ROOT / 'datos/reparto.json').read_text())
ids = {n['id'] for n in reparto}
if ids != set(vidas) or len(vidas) != 142:
    raise ValueError('Faltan biografías: ' + str(ids - set(vidas)))
for n in reparto:
    n['profundidad'] = vidas[n['id']]
    for scene in n['profundidad']['escenas']:
        for line in scene['lineas'].splitlines():
            speaker, sep, text = line.partition(': ')
            if not sep or not text or speaker not in ids:
                raise ValueError('Voz o línea desconocida: ' + line)
for name, data in [('reparto.json', reparto), ('vidas.json', list(vidas.values()))]:
    (ROOT / 'datos' / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'vidas_ampliadas': len(vidas), 'escenas_personales': len(vidas) * 2,
                  'palabras_nuevas': sum(sum(len(m['texto'].split()) for m in x['memorias']) + len(x['cotidiano'].split()) + len(x['postura_fuatia'].split()) + sum(len(l.split(': ',1)[1].split()) for e in x['escenas'] for l in e['lineas'].splitlines()) for x in vidas.values())}, ensure_ascii=False))
