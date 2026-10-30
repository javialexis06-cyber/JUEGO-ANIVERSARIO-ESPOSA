"""Tabla de grupos de recursos que PvZ-Portable lee (Resources.cpp de las fuentes fijadas 0.2.5).

El main.pak remoto es anterior a GOTY: su resources.xml no tiene los recursos que GOTY agregó (Zombatar, logros,
juego rápido…) y ubica algunos en otros grupos. El adaptador combina esta tabla con el resources.xml descargado
para que cada grupo tenga los identificadores que el motor exige; los que faltan usan un sustituto existente.

Uso: python3 scripts/pvz1/grupos-goty.py   (escribe public/jardin/motores/pvz1/grupos-goty.json)
"""
import json
import pathlib
import re
import tarfile

WEB = pathlib.Path(__file__).resolve().parents[2]
FUENTES = WEB / 'public/jardin/motores/pvz1/fuentes-0.2.5.tar.gz'

with tarfile.open(FUENTES) as t:
    miembro = next(m for m in t.getmembers() if m.name.endswith('/src/Resources.cpp'))
    codigo = t.extractfile(miembro).read().decode('utf-8')

grupos = {}
for m in re.finditer(r'bool Sexy::Extract(\w+?)Resources\(ResourceManager\* theManager\)\s*\{(.*?)\n\}', codigo, re.S):
    ids = re.findall(r'Get(Image|Font|Sound)Throw\("(\w+)"\)', m.group(2))
    grupos[m.group(1)] = [[tipo[0], i] for tipo, i in ids]

destino = WEB / 'public/jardin/motores/pvz1/grupos-goty.json'
destino.write_text(json.dumps(grupos, separators=(',', ':')) + '\n')
print(f'{len(grupos)} grupos, {sum(map(len, grupos.values()))} recursos → {destino.relative_to(WEB)}')
