#!/usr/bin/env python3
"""Compila la autoría de Astra a contratos de juego y producción; no genera audio."""
import json, re, hashlib, subprocess, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import planos_pueblos as PL  # el plano de cada pueblo (calles, plaza, casas, puestos, recursos)
ROOT=Path(__file__).resolve().parents[3]
N=ROOT/'docs/narrativa'
W=ROOT/'juego/web/src/granja-v3'
def load(f): return json.loads((N/f).read_text())
def ts(name,value): (W/name).write_text('// Generado por docs/narrativa/herramientas/integrar_motor.py.\nexport const DATOS = '+json.dumps(value,ensure_ascii=False,separators=(',',':'))+';\n')
roster=load('datos/reparto.json'); regiones=load('datos/regiones-recursos.json')['regiones']
# Vida de los pueblos (docs/narrativa/datos/pueblos/*.json): vecinos nuevos, sus casas y los encargos de cada pueblo
vida_pueblos={'residentes':[],'viviendas':[],'encargos':[]}
for f in sorted((N/'datos/pueblos').glob('*.json')):
 if f.name.startswith('contexto'):continue
 d=json.loads(f.read_text())
 for k in vida_pueblos:vida_pueblos[k]+=d.get(k,[])
def linea_vida(escena,parte,i,hablante,texto):
 lid=f'{escena}.{parte}.{i:02d}'
 return dict(id=lid,escena=escena,hablante=hablante,texto=texto,direccion='Natural y cercano; vida del pueblo.',capa='pareja' if hablante in ('el','ella') else 'mundo',archivo=lid+'.ogg',prioridad='C',huella_texto=hashlib.sha256(f'{hablante}|{texto}'.encode()).hexdigest()[:16])
lineas_pueblos=[]
for n in vida_pueblos['residentes']:
 roster.append({'id':n['id'],'nombre':n['nombre'],'asentamiento':n['asentamiento'],'mundo':n.get('mundo',''),'funcion':n['funcion'],'pasado':n['pasado'],'presente':n['presente'],'arco':n['arco'],'vinculos':n.get('vinculos',[]),'mision':None,'hogar_planeado':n['hogar'],'naturaleza':n.get('naturaleza','persona_viva'),'voz':n.get('voz',''),'ropa':n.get('ropa'),'profundidad':{'id':n['id'],'memorias':n['memorias'],'cotidiano':n.get('cotidiano',''),'postura_fuatia':n.get('postura_fuatia','')},'origen':'vida_pueblos'})
 lineas_pueblos+=[linea_vida('VID_'+n['id']+'_1','vida',i+1,l['hablante'],l['texto']) for i,l in enumerate(n['conversacion'])]
original=json.loads((W/'REPARTO-MUNDOS.json').read_text())
# El primer pueblo conserva exactamente sus huellas y sus horarios existentes.
legacy_code="import {compilarModulo} from './scripts/granja-v3/modulos-prueba.mjs';const D=await import(await compilarModulo(new URL('./src/granja-v3/pueblo-datos.ts',import.meta.url)));const A=await import(await compilarModulo(new URL('./src/granja-v3/aldeanos.ts',import.meta.url)));process.stdout.write(JSON.stringify({viviendas:D.VIVIENDAS_PUEBLO,npc:D.NPCS_PUEBLO,vida:A.VIDA_PUEBLO}));"
legacy=json.loads(subprocess.check_output(['node','--input-type=module','-e',legacy_code],cwd=ROOT/'juego/web',text=True))
worlds=[]
colors={'celia':'#88aa78','frontera':'#a78b7d','verdia':'#a8cda0','senda':'#b8a5cc','nox':'#7d82a7','astra':'#8db9ca','confluencia':'#d0bc9c'}
for s in original['asentamientos']:
 homes=[dict(h) for h in original['viviendas'] if h['asentamientoId']==s['id']]+[dict(h,capacidad=len(h['ocupantes'])) for h in vida_pueblos['viviendas'] if h['asentamientoId']==s['id']]
 for h in homes:h['ocupantes']=list(h['ocupantes'])+[n['id'] for n in vida_pueblos['residentes'] if n['hogar']==h['id'] and n['id'] not in h['ocupantes']]
 for i,h in enumerate(homes):
  h=dict(h);h.update(estado='presente_en_motor_provisional',**(PL.casa(i) if s['id']!='pueblo_sol' else {}))
  if s['id']=='pueblo_sol': h.update(next(v for v in legacy['viviendas'] if v['id']==h['id']))
  homes[i]=h
 worlds.append({'id':s['id'],'nombre':s['nombre'],'mundo':s['mundoId'],'color':colors[s['mundoId']],'musica':{'pueblo_sol':'M02','puerto_lirios':'M03','brumaverde':'M04','piedralumbre':'M05','brasaviva':'M06','nieveclara':'M07','vigilia':'M08','rosal_eterno':'M12','jardines_eco':'M12','travesia':'M13','refugio_hilos':'M14','bastion_velo':'M15','ambarina':'M17','iridalia':'M18'}.get(s['id'],'M16'),'viviendas':homes,'npc':[n['id'] for n in roster if n['asentamiento']==s['id']],'permiso':None,'combate':None})
for ident,nombre,mundo in [('cruce_valle','Cruce del Valle','celia'),('fragmentos_cobre','Asteroide Cobrizo','astra'),('fragmentos_cristal','Asteroide Prisma','astra'),('confluencia','Refugio de Confluencia','confluencia'),('confluencia_fuego','Caldera del Rescoldo','confluencia'),('confluencia_agua','Mar de los Retornos','confluencia'),('confluencia_tierra','Terraza de las Raíces','confluencia'),('confluencia_aire','Altura de las Corrientes','confluencia'),('borde_astra','Borde de Astra','astra')]:
 worlds.append({'id':ident,'nombre':nombre,'mundo':mundo,'color':colors[mundo],'musica':'M19' if ident=='borde_astra' else 'M23' if mundo=='confluencia' else 'M16' if mundo=='astra' else 'M02','viviendas':[],'npc':[],'permiso':None,'combate':None})
by={r['id']:r for r in worlds}
for r in worlds:
 if r['id']!='pueblo_sol':
  r['plano']={'limites':{'x':PL.LX,'z':PL.LZ},'plaza':PL.PLAZA,'inicio':PL.INICIO,'archivo':PL.ARCHIVO,'combate':None,'solidos':[],'puestos':[]}
 r['permiso']={'rosal_eterno':'F04','jardines_eco':'F04','travesia':'P13','refugio_hilos':'P14','bastion_velo':'P15','estacion_celia':'P16','huerto_aurelia':'P17','vigia_nocturna':'P17','cantera_esmeralda':'P17','campamento_fragmentos':'P17','fragmentos_cobre':'P17','fragmentos_cristal':'P17','ambarina':'P18','iridalia':'P19','confluencia':'F06','borde_astra':'P22'}.get(r['id'],'F06' if r['mundo']=='confluencia' else None)
 r['combate']={'brumaverde':'ruinas_celia','rosal_eterno':'reino_verdia','travesia':'reino_senda','bastion_velo':'reino_nox','fragmentos_cobre':'asteroide_cobre','fragmentos_cristal':'asteroide_cristal','ambarina':'planeta_ambar','iridalia':'planeta_iris'}.get(r['id'],r['id'] if r['id'].startswith('confluencia_') else None)
routes=[]
def connect(a,b,tipo='camino',construccion=None):
 routes.append({'id':a+'__'+b,'desde':a,'hacia':b,'tipo':tipo,'construccion':construccion})
connect('pueblo_sol','cruce_valle')
for rid in ['puerto_lirios','brumaverde','piedralumbre']:connect('cruce_valle',rid)
connect('piedralumbre','brasaviva');connect('brumaverde','nieveclara');connect('nieveclara','vigilia')
for rid,obj in [('rosal_eterno','portal_verdia'),('travesia','portal_senda'),('bastion_velo','portal_nox'),('estacion_celia','nave_exploradora')]:connect('granja',rid,'nave' if rid=='estacion_celia' else 'portal',obj)
connect('rosal_eterno','jardines_eco');connect('travesia','refugio_hilos')
for rid in ['huerto_aurelia','vigia_nocturna','cantera_esmeralda','campamento_fragmentos','ambarina','iridalia']:connect('estacion_celia',rid,'nave')
connect('campamento_fragmentos','fragmentos_cobre','nave');connect('campamento_fragmentos','fragmentos_cristal','nave')
connect('estacion_celia','confluencia','umbral')
for elemento in ['fuego','agua','tierra','aire']:connect('confluencia','confluencia_'+elemento,'umbral')
connect('estacion_celia','borde_astra','nave')
# Cada extremo reserva una puerta física y una llegada libre; regreso siempre accesible.
for r in routes:
 for endpoint in ['desde','hacia']:
  here=r[endpoint]; i=sum(1 for previous in routes[:routes.index(r)] if here in [previous['desde'],previous['hacia']])
  r[endpoint+'_punto']={'x':108,'z':29} if here=='pueblo_sol' else PL.ruta(i)
np=[]
for n in roster:
 k=by[n['asentamiento']]['npc'].index(n['id'])
 np.append({'id':n['id'],'nombre':n['nombre'],'region':n['asentamiento'],'hogar':n['hogar_planeado'],'voz':n['id'],'mision':n['mision']['id'] if n.get('mision') else None,'funcion':n['funcion'],'plaza':PL.plaza(k,len(by[n['asentamiento']]['npc'])),'oficio':PL.puesto(k)['oficio'],'horario':{'oficio':[480,1020],'plaza':[1020,1260],'hogar':[1260,480]},'naturaleza':n['naturaleza'],**({'ropa':n['ropa']} if n.get('ropa') else {})})
for n in np:
 if n['region']=='pueblo_sol':
  old=next(v for v in legacy['npc'] if v['id']==n['id']);vida=legacy['vida'][n['id']]
  n['oficio']={'x':old['x'],'z':old['z']};n['plaza']=vida['plaza'];n['horario_fuente']='aldeanos.ts: VIDA_PUEBLO y ubicacionAldeano, incluida lluvia y festivales'
# Cada habitante tiene su puesto de oficio; lo sólido del pueblo (monumento, archivo, puestos, combate) va en el plano
for r in worlds:
 if 'plano' not in r:continue
 r['plano']['puestos']=[dict(PL.puesto(k),npc=i) for k,i in enumerate(r['npc'])]
 if r['combate']:r['plano']['combate']=PL.COMBATE
 r['plano']['solidos']=PL.solidos(len(r['npc']),bool(r['combate']),len(r['viviendas']))
 r['plano']['adornos']=PL.adornos(len(r['viviendas']))
 r['plano']['hito']=PL.HITO
ts('astra-mundo-datos.ts',{'regiones':worlds,'rutas':routes,'npc':np})
for r in regiones:
 for i,d in enumerate(r['recursos']):d['punto']={'x':[68,72,80,84][i],'z':26} if r['id']=='pueblo_sol' else PL.recurso(i)
ts('astra-recursos-datos.ts',regiones)
seeds=[]
for r in regiones:
 seed=next(x for x in r['recursos'] if x['clase']=='semilla')
 seeds.append({'id':r['id']+'_cultivo','nombre':seed['nombre'].removeprefix('Semilla de ').capitalize(),'modelo':'zanahoria','semilla':seed['id'],'producto':r['id']+'_cosecha','horas':24*r['renovacion']['dias_dormidos'],'dias':r['renovacion']['dias_dormidos'],'estaciones':['primavera','verano','otono','invierno'],'climas':['templado'],'precio':0,'valor':0,'cantidad':1,'region':r['id'],'presurizado':r['mundo'] in ['Astra','Confluencia']})
ts('astra-cultivos-datos.ts',seeds)
qs=load('datos/campana.json')+load('datos/secretos.json')+load('datos/encuentros.json')+load('datos/elementales.json')
qs += [dict(n['mision'],clase='personal',zona=n['asentamiento'],reparto=[n['id']]) for n in roster if n.get('mision')]
rewards={r['mision']:r for r in load('datos/recompensas.json')}
compiled=[]
for q in qs:
 labels=q.get('actos',q.get('acciones',[]))
 if isinstance(labels,str):labels=[s.strip() for s in labels.split(';') if s.strip()]
 if not labels:labels=[q['titulo']]
 region=q.get('zona') or next((n['asentamiento'] for n in roster if n['id'] in q.get('reparto',[])),'pueblo_sol')
 region={'celia':'pueblo_sol','lunas':'estacion_celia','sangre/afueras':'vigilia','sangre/subsuelo':'piedralumbre','sangre/santuario':'vigilia','sangre/corte':'vigilia'}.get(region,region)
 stages=[{'id':q['id']+'.testimonios','tipo':'testimonios','texto':'Consultar a quienes participan, con copias públicas para testimonios de otros lugares.','npc':[i for i in q.get('reparto',[]) if not i.startswith('figura_')][:3]}]
 stages.extend({'id':q['id']+'.archivo.'+str(i+1),'tipo':'archivo','texto':'Consultar el registro público: '+label,'accion_original':label,'punto':PL.paso_archivo(i),'lectura':True} for i,label in enumerate(labels[:4]))
 compiled.append({'id':q['id'],'titulo':q['titulo'],'region':region,'requiere':q.get('requiere',[]),'reparto':q.get('reparto',[]),'clase':q.get('clase','principal' if q['id'][0] in 'PF' else 'secreta' if q['id'].startswith('S') else 'encuentro'),'pasos':stages,'decision':q.get('decision',q.get('eleccion','')),'premio':rewards[q['id']],'alcance':'adaptacion_archivistica; acciones economicas y retos específicos se añaden en contratos explícitos'})
# Recibos reales de campaña; no se acreditan por leer su guion.
steps={
 'P01':[{'tipo':'estadistica','clave':'cosechar','cantidad':1,'texto':'Sembrar, regar y cosechar un cultivo ordinario después de aceptar.'}],
 'P02':[{'tipo':'jornadas','cantidad':1,'texto':'Dormir una jornada para recibir la carta.'}],
 'P03':[{'tipo':'entrega','materiales':{'pan':1,'madera':2},'texto':'Preparar y reservar una ración y el ancla de práctica.'}],
 'P04':[{'tipo':'sangre','sector':'afueras','texto':'Terminar la puerta de Afueras en Sangre y Ceniza y rescatar a una persona.'}],
 'P06':[{'tipo':'sangre','sector':'subsuelo','texto':'Completar la puerta del Subsuelo en Sangre y Ceniza.'}],
 'P07':[{'tipo':'estadistica','clave':'alimentar','cantidad':1,'texto':'Cuidar un animal ordinario después de aceptar para recibir copias autorizadas.'}],
 'P08':[{'tipo':'sangre','sector':'santuario','texto':'Completar la puerta del Santuario en Sangre y Ceniza.'}],
 'P09':[{'tipo':'sangre','sector':'corte','texto':'Completar Corte en Sangre y Ceniza.'}],
 'P10':[{'tipo':'entrega','materiales':{'pan':2},'texto':'Entregar provisiones reales al refugio.'}],
 'P11':[{'tipo':'jornadas','cantidad':3,'texto':'Registrar tres jornadas dormidas para las lecturas.'}],
 'P17':[{'tipo':'entrega','materiales':{'combustible_estelar':1,'bateria':1},'texto':'Reservar combustible y batería; fabricar y colocar nave aparte.'}],
 'P18':[{'tipo':'visitas','regiones':['huerto_aurelia','vigia_nocturna','cantera_esmeralda'],'texto':'Visitar los tres puestos lunares en cualquier orden.'}],
 'P19':[{'tipo':'visitas','regiones':['ambarina'],'texto':'Visitar la terraza de Ambarina.'}],
 'P20':[{'tipo':'visitas','regiones':['iridalia'],'texto':'Visitar la asamblea de Iridalia.'}],
 'P24':[{'tipo':'estadistica','clave':'plantar','cantidad':1,'texto':'Plantar una semilla ordinaria para la parcela de mañana.'}],
}
for i,el in enumerate(['fuego','agua','tierra','aire'],7):steps['F'+str(i).zfill(2)]=[{'tipo':'visitas','regiones':['confluencia_'+el],'texto':'Visitar y registrar el territorio elemental.'},{'tipo':'prueba_elemental','elemento':el,'texto':'Confirmar el balance con mineral y madera autorizados; la arena permite practicar combate aparte.'}]
steps['F11']=[{'tipo':'visitas','regiones':['confluencia_fuego','confluencia_agua','confluencia_tierra','confluencia_aire'],'texto':'Contrastar los cuatro balances en el refugio.'}]
for q in compiled:
 for i,st in enumerate(steps.get(q['id'],[])):q['pasos'].append(dict(st,id=q['id']+'.real.'+str(i+1)))
 if q['id'].startswith('S') or q['id']=='T08':q['pasos'].insert(0,{'id':q['id']+'.pista','tipo':'archivo','texto':'Reconocer una pista pública antes de descubrir esta misión.','punto':PL.paso_archivo(3),'lectura':True})
for q in vida_pueblos['encargos']:
 pasos=[]
 for i,st in enumerate(q['pasos']):
  st=dict(st,id=q['id']+'.paso.'+str(i+1))
  if st['tipo']=='archivo':st.update(punto=PL.paso_archivo(i%4),lectura=True)
  pasos.append(st)
 compiled.append({'id':q['id'],'titulo':q['titulo'],'region':q['region'],'requiere':q.get('requiere',[]),'reparto':q.get('reparto',[]),'clase':q['clase'],'pasos':pasos,'decision':q['decision'],'opciones':q['opciones'],'premio':{'mision':q['id'],'nombre':q['titulo'],'familia':'encargo'},'recompensa':q.get('recompensa',{}),'alcance':'encargo de pueblo: pasos del motor y recompensa al cerrar'})
 # Escenas: inicio, giro, un cierre corto común y cada rama seguida de las palabras de cierre
 for parte in ['inicio','giro']:lineas_pueblos+=[linea_vida(q['id'],parte,i+1,l['hablante'],l['texto']) for i,l in enumerate(q[parte])]
 lineas_pueblos.append(linea_vida(q['id'],'cierre',1,'narrador','El acuerdo queda anotado en el archivo del pueblo.'))
 for k,rama in enumerate(q['ramas']):lineas_pueblos+=[linea_vida(q['id'],'rama'+str(k+1),i+1,l['hablante'],l['texto']) for i,l in enumerate(rama+q['cierre'])]
ts('astra-misiones-datos.ts',compiled)
# Guiones y memorias grandes quedan fuera del núcleo: solo la interfaz los carga bajo demanda.
ts('astra-lore-datos.ts',{'npc':roster,'figuras':load('datos/figuras.json'),'lineas':load('audio/lineas.json')+lineas_pueblos})

lines=load('audio/lineas.json')+lineas_pueblos
counts={scene:sum(l['escena']==scene for l in lines) for scene in set(l['escena'] for l in lines)}
for q in compiled:
 if q['id'][0] in 'PF' or q['clase'].startswith('encargo'):
  for parte in ['inicio','giro','cierre','rama1','rama2']:
   cantidad=sum(l['id'].startswith(q['id']+'.'+parte+'.') for l in lines)
   if cantidad:counts[q['id']+'#'+parte]=cantidad
ts('astra-campana-datos.ts',{'misiones':[q for q in compiled if q['id'][0] in 'PF' or q['clase'].startswith('encargo')],'escenas':counts})
# Contrato de producción: ningún archivo se da por producido y no hay rutas inventadas para reproducirlo.
lines=load('audio/lineas.json')+lineas_pueblos
manifest={'version':1,'estado':'contrato_sin_medios_producidos','npc':np,'regiones':worlds,'rutas':routes,'voces':load('audio/reparto-voces.json'),'biografias':roster,'figuras':load('datos/figuras.json'),'misiones':compiled,'recursos':regiones,'lineas':lines,'escenas':sorted(set(l['escena'] for l in lines)),'musica':[{'id':m.group(1),'uso':m.group(2),'direccion':m.group(3)} for m in re.finditer(r'^\| (M\d+) \| ([^|]+) \| ([^|]+) \|', (N/'06-produccion.md').read_text(),re.M)]+[{'id':'M23','uso':'Confluencia','direccion':'Cuatro variaciones elementales y refugio; motivos separados, sin letra.'}],'medios':{'voces':{},'musica':{},'modelos':{}},'guardado':5,'nota':'Las misiones catalogadas incluyen adaptación de investigación; consultar los recibos reales adicionales y los efectos aún pendientes de cada premio.'}
p=ROOT/'juego/web/public/granja/astra';p.mkdir(parents=True,exist_ok=True)
(p/'produccion.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
if not (p/'medios.json').exists(): (p/'medios.json').write_text(json.dumps({'version':1,'voces':{},'musica':{},'modelos':{}},indent=2)+'\n')
print(json.dumps({'regiones':len(worlds),'npc':len(np),'viviendas':sum(len(r['viviendas']) for r in worlds),'misiones':len(compiled),'lineas':len(lines),'rutas':len(routes)},ensure_ascii=False))
