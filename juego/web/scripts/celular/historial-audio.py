"""Notas de voz ficticias en español; solo procesa el texto autoral de historiales.ts."""
import asyncio
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

import edge_tts
import edge_tts.communicate

# Conservar la verificación TLS y añadir la CA del entorno cuando tenga un proxy.
certificados = os.environ.get('SSL_CERT_FILE', '/etc/ssl/certs/ca-certificates.crt')
if Path(certificados).is_file():
    edge_tts.communicate._SSL_CTX.load_verify_locations(certificados)

notas = json.loads(Path(sys.argv[1]).read_text())
salida = Path(sys.argv[2])
salida.mkdir(parents=True, exist_ok=True)
limite = asyncio.Semaphore(4)
indice = {}


async def generar(v):
    voz = {'vida0': 'es-CO-SalomeNeural', 'vida1': 'es-CO-GonzaloNeural', 'vida2': 'es-MX-DaliaNeural'}[v['quien']]
    ritmo = f"{(v['caso'] % 5 - 2) * 2:+d}%"
    huella = hashlib.sha256((voz + ritmo + v['texto']).encode()).hexdigest()[:10]
    nombre = f"{v['id']}-{huella}.ogg"
    destino = salida / nombre
    async with limite:
        if not destino.exists():
            with tempfile.TemporaryDirectory(prefix='astra-voz-') as temporal:
                mp3 = str(Path(temporal) / 'voz.mp3')
                for intento in range(3):
                    try:
                        await edge_tts.Communicate(v['texto'], voz, rate=ritmo, proxy=os.environ.get('HTTPS_PROXY')).save(mp3)
                        break
                    except Exception:
                        if intento == 2:
                            raise
                        await asyncio.sleep(1 + intento)
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-af',
                    'highpass=f=100,lowpass=f=7500,loudnorm=I=-18:TP=-2:LRA=9',
                    '-ac', '1', '-ar', '24000', '-c:a', 'libopus', '-b:a', '28k', str(destino)], check=True)
        duracion = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(destino)]))
        if duracion < 1:
            raise ValueError('Nota vacía: ' + v['id'])
        indice[v['id']] = {'archivo': './audio/celular/historial/' + nombre, 'seg': round(duracion, 2)}
        print('OK ' + v['id'], flush=True)


async def main():
    await asyncio.gather(*(generar(v) for v in notas))
    datos = {'version': 1, 'origen': 'Síntesis de voces de ficción; no son grabaciones privadas',
             'voces': dict(sorted(indice.items()))}
    (salida / 'voces.json').write_text(json.dumps(datos, ensure_ascii=False, indent=1) + '\n')
    print(f'{len(indice)} audios del historial listos', flush=True)


asyncio.run(main())
