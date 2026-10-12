#!/usr/bin/env python3
"""Actividades y fauna autorizada desde los 24 territorios canónicos."""
import json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[3];N=R/'docs/narrativa';W=R/'juego/web/src/granja-v3'
regiones=json.loads((N/'datos/regiones-recursos.json').read_text())['regiones']
tipos={'pueblo_sol':'cuentas','puerto_lirios':'canales','brumaverde':'senderos','piedralumbre':'soportes','brasaviva':'termica','nieveclara':'termica','vigilia':'cuentas','rosal_eterno':'senderos','jardines_eco':'canales','travesia':'senderos','refugio_hilos':'cuentas','bastion_velo':'soportes','estacion_celia':'presion','huerto_aurelia':'presion','vigia_nocturna':'presion','cantera_esmeralda':'canales','fragmentos_cobre':'soportes','fragmentos_cristal':'soportes','ambarina':'canales','iridalia':'cuentas','confluencia_fuego':'termica','confluencia_agua':'canales','confluencia_tierra':'soportes','confluencia_aire':'presion'}
colonias={'jardines_eco':'P12','estacion_celia':'P16','huerto_aurelia':'P17','fragmentos_cobre':'P17','fragmentos_cristal':'P17'}
data=[]
for r in regiones:
 fauna=next(d for d in r['recursos'] if d['clase']=='fauna')
 data.append({'id':r['id'],'nombre':r['nombre'],'actividad':tipos[r['id']],'diasRenovacion':r['renovacion']['dias_dormidos'],'materiales':{r['id']+'_mineral':1,r['id']+'_madera':1},'producto':'pieza_'+r['id'],'fauna':{'id':fauna['id'],'nombre':fauna['nombre'],'limites':fauna['obtencion'],'colonia':r['id'] in colonias,'permiso':colonias.get(r['id']),'producto':'apoyo_'+r['id']}})
(N/'jugabilidad/regiones.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(W/'regiones-datos.ts').write_text('// Generado por compilar_regiones.py; conserva los territorios y fauna canónicos.\nimport type {TerritorioRegional} from "./regiones-tipos";\nexport const TERRITORIOS_REGIONALES:TerritorioRegional[]='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
codigo="import {compilarModulo} from './scripts/granja-v3/modulos-prueba.mjs';const J=await import(await compilarModulo(new URL('./src/granja-v3/jefes.ts',import.meta.url)));process.stdout.write(JSON.stringify(J.JEFES));"
jefes=json.loads(subprocess.check_output(['node','--input-type=module','-e',codigo],cwd=R/'juego/web',text=True))
(N/'jugabilidad/jefes.json').write_text(json.dumps(jefes,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'territorios':len(data),'actividades':len(set(tipos.values())),'colonias_autorizadas':len(colonias)}))
