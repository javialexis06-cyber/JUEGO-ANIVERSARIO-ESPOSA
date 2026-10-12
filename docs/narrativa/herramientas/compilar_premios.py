#!/usr/bin/env python3
"""Utilidades narrativas concretas: consulta, agenda, variante, módulo, recuerdo y calibración."""
import json,unicodedata
from pathlib import Path
R=Path(__file__).resolve().parents[3];N=R/'docs/narrativa';W=R/'juego/web/src/granja-v3'
rewards=json.loads((N/'datos/recompensas.json').read_text());quests={q['id']:q for f in ['principales','secundarias'] for q in json.loads((N/'jugabilidad'/f'{f}.json').read_text())}
def norm(t):return ''.join(c for c in unicodedata.normalize('NFD',t.lower()) if unicodedata.category(c)!='Mn')
def ambito(r):
 t=norm(r['efecto_diseno']+' '+r['tema'])
 for a,words in [('animales',['animal','refugio','genoma','criatura','diagnostico','cuidado']),('cultivos',['cultivo','surco','semilla','hibrid','floracion','parcela','agua','riego']),('fabricacion',['receta','maquina','forja','lote ferment','bateria','produccion','material','molde']),('pesca',['pesca','pez','juvenil','captura','acuatic']),('rutas',['ruta','mapa','regreso','baliza','retorno','puente','paso','rescate']),('documentos',['copia','document','memoria','autor','credito','fuente','original']),('comunidad',['particip','alojamiento','asamblea','conviv','consent','visita','rito','descanso','restitu'])]:
  if any(x in t for x in words):return a
 return 'documentos'
aliases={'V_posadera':'sopa_verduras','V_cocinero':'racion_viajera','V_artesana':'botas_cobre','V_piedra_santiago':'pechera_cobre','V_piedra_ciro':'racion_viajera','V_verdia_lucio':'sopa_verduras','V_aurelia_oscar':'bateria','V_aurelia_saul':'cafe','V_ambar_nestor':'flechas_ribera','E01':'sopa_verduras','E03':'botas_cobre','E06':'pan','E08':'cafe','E13':'racion_viajera'}
accesos={'V_carpintera','V_bruma_roque','V_lirios_dalia','V_brasa_tarek','V_nieve_luz','V_nieve_celeste','V_hilos_hector','V_ambar_baltasar','F09','T01'}
contenedores={'V_lirios_bastian','V_brasa_ramiro','V_brasa_sol','V_nieve_eira','V_fragmentos_lazaro'}
trampas={'V_lirios_maite','V_lirios_belen'}
tecs={'V_herrero':{'factor':.8,'estaciones':['horno','forja'],'recetas':[]},'V_nocturna_gaspar':{'factor':.9,'estaciones':['horno'],'recetas':['vidrio','vidrio_del_archivo']},'V_esmeralda_indira':{'factor':.9,'estaciones':['banco_trabajo','ensambladora'],'recetas':['bateria','serie_baterias']},'V_fragmentos_pia':{'factor':.9,'estaciones':['horno','fundidora'],'recetas':['vidrio','vidrio_del_archivo']},'F07':{'factor':.8,'estaciones':['horno','forja','alto_horno'],'recetas':[]}}
compiled=[]
for r in rewards:
 q=quests[r['mision']];d=dict(r,region=q['region'],titulares=q['reparto'],ambito=ambito(r),estado='contrato_funcional')
 if r['familia']=='plano':
  id=r['mision']
  if id in aliases:d['plano']={'tipo':'receta','base':aliases[id],'materiales':{}}
  elif id in accesos:d['plano']={'tipo':'acceso','base':'entrada_existente','materiales':{'madera':4,'piedra':2}}
  elif id in contenedores:d['plano']={'tipo':'cofre','base':'reserva_inspectable','materiales':{'madera':25},'capacidad':24}
  elif id in trampas:d['plano']={'tipo':'trampa','base':'trampa_selectiva','materiales':{'madera':20,'fibra':8}}
  else:d['plano']={'tipo':'exhibicion','base':'pieza_reversible','materiales':{'madera':4,'piedra':2,'fibra':1}}
 if r['mision']=='V_brasa_sol':d['plano']={'tipo':'cofre','base':'cuenco_ceramico','materiales':{'piedra':8,'fibra':2},'capacidad':4}
 if r['familia']=='tecnica':d['tecnica']=tecs[r['mision']]
 compiled.append(d)
assert len(compiled)==217 and len({r['id'] for r in compiled})==217
(N/'jugabilidad/premios.json').write_text(json.dumps(compiled,ensure_ascii=False,indent=2)+'\n')
(W/'premios-datos.ts').write_text('// Generado por compilar_premios.py.\nimport type {PremioNarrativo} from "./premios-tipos";\nexport const PREMIOS_NARRATIVOS:PremioNarrativo[]='+json.dumps(compiled,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'premios':len(compiled),'variantes_receta':len(aliases),'modulos_acceso':len(accesos),'cofres':len(contenedores),'trampas':len(trampas)}))
