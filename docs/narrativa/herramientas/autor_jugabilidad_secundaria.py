#!/usr/bin/env python3
"""Contratos secundarios: prácticas del oficio, permisos, trabajo real y pistas públicas.
La autoría original permanece en reparto/secretos/encuentros/elementales. No produce medios.
"""
import json,re,unicodedata
from pathlib import Path
from compilar_jugabilidad import step,obs,ask,seq,compare,pay,care,crop,wait,circuit,visit
ROOT=Path(__file__).resolve().parents[3];N=ROOT/'docs/narrativa'
world=json.loads((ROOT/'juego/web/public/granja/astra/produccion.json').read_text())
npc={n['id']:n for n in world['npc']};reg={r['id']:r for r in world['regiones']}
roster=json.loads((N/'datos/reparto.json').read_text())
def norm(x):return ''.join(c for c in unicodedata.normalize('NFD',x.lower()) if unicodedata.category(c)!='Mn')
nombres={norm(n['nombre']).split()[0]:n['id'] for n in roster}
# Nombres propios originales autorizados, sin crear duplicados de habitantes.
nombres.update({'flora':'botanica','rosa':'posadera','mara':'cuidadora','alma':'maestra','aurelio':'veterano','bruno':'herrero','lio':'musica','lia':'musica','tomás':'guardabosques','tomas':'guardabosques'})
def personas(texto,owner):
 ids=[]
 for palabra in re.findall(r'\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\b',texto):
  id=nombres.get(norm(palabra))
  if id and id!=owner and id not in ids:ids.append(id)
 return ids

def oficio(texto,registro,cantidad=1):return step('oficio',texto,registro=registro,cantidad=cantidad)
def datos_fuente(n,i):
 memorias=n['profundidad']['memorias']
 return [memorias[i%len(memorias)]['texto'],n['mision']['inicio'], 'Fuente autorizada: '+n['nombre']+'. El taller conserva una copia y el derecho a retirar partes privadas.']
def contraste_oficio(texto,n,i):
 t=norm(texto);seed=sum(ord(c) for c in n['id'])+i
 if any(k in t for k in ['reserva','consumo','balance','agua','aire','cupo','costo','presupuesto','cuenta','recibo','lote','capacidad']):
  entrada=10+seed%9;reserva=2+seed%4
  return compare(texto,[f'Ensayo del oficio: entran {entrada}, quedan {reserva} en reserva y se entregan {entrada-reserva}.',f'El segundo registro declara {entrada} entregados y también conserva la misma reserva.',n['mision']['inicio']],['Los dos registros contabilizan lo mismo','El segundo cuenta la reserva como entrega','La reserva no necesita registrarse'],1)
 return compare(texto,datos_fuente(n,i),['Conservar origen, permiso y discrepancias sin agregar una certeza que las fuentes no prueban','Elegir la fuente de mayor prestigio y borrar las demás','Cambiar el original para que las copias coincidan'],0)

OBSERVAR={'consultar','observar','revisar','examinar','leer','inspeccionar','inventariar','identificar','medir','contar','clasificar','estudiar','encontrar','hallar'}
CONTRASTAR={'comparar','contrastar','auditar','reconstruir','interpretar','reconocer','distinguir','calcular','conciliar'}
PREGUNTAR={'escuchar','preguntar','pedir','entrevistar','hablar','solicitar'}
PREPARAR={'preparar','reservar','forjar','fabricar','construir','reparar','restaurar','tallar','tejer','reemplazar','crear','reciclar','instalar'}
PROCEDER={'publicar','registrar','presentar','corregir','probar','ensayar','retirar','acordar','recuperar','ofrecer','señalar','dibujar','celebrar','marcar','recorrer','entregar','reunir','con','enseñar','simular','organizar','grabar','repartir','adaptar','formar','modelar','mostrar','autorizar','redactar','configurar','separar','calibrar','ajustar','ejecutar','elegir','practicar','atender','pintar','guardar','proponer','acompañar','archivar','copiar','rectificar','ayudar','reajustar','documentar','destruir','tomar','diseñar','afinar'}

OBSERVAR={norm(v) for v in OBSERVAR};CONTRASTAR={norm(v) for v in CONTRASTAR};PREGUNTAR={norm(v) for v in PREGUNTAR};PREPARAR={norm(v) for v in PREPARAR};PROCEDER={norm(v) for v in PROCEDER}|{'seguir','devolver','visitar','desmontar'}

def traducir(n,texto,i):
 t=norm(texto);v=t.split()[0];id=n['id'];otros=personas(texto,id)
 if v in ['cultivar','sembrar','plantar']:
  cultivo=crop(2 if 'dos especies' in t or 'dos variedades' in t else 1);cultivo['texto']=texto+' Registra cultivo propio, riego y cosecha; el ensayo usa especies ordinarias compatibles.';return [cultivo]
 if 'dos variedades' in t:return [crop(2)]
 if v in ['pescar','capturar'] or id=='lirios_belen' and 'captura' in t:return [oficio(texto+' Obtén una captura con la acción real de pesca; el juvenil se devuelve en el ensayo, sin venderlo.','pescar'),step('devolver_pesca','Devolver un ejemplar capturado en la actividad a su tramo autorizado del lago; no se vende.',region='lago')]
 if v=='limpiar':return [pay(texto+' Aporta material al tramo delimitado.',{'madera':2,'fibra':1}),circuit('Restablecer el retorno del tramo autorizado y probar que queda libre.')]
 if v=='cocinar':
  cantidad=2 if 'dos porciones' in t else 1;return [oficio(texto+' Fabrica pan mediante una receta existente en tu cocina.','fabricar_pan',cantidad),pay('Reservar las porciones propias para este encuentro.',{'pan':cantidad})]
 if id=='herrero' and v=='forjar':return [oficio(texto+' Produce un lingote de cobre en el horno existente.','fabricar_lingote_cobre'),pay('Entregar el lingote para la pieza y su control de seguridad.',{'lingote_cobre':1}),circuit('Comprobar el aislamiento de la pieza en el banco de control.')]
 if id=='bruma_felix' and 'compost' in t:return [oficio(texto+' Fabrica fertilizante con la receta de fibra y heno.','fabricar_fertilizante'),pay('Separar una unidad del lote preparado.',{'fertilizante':1})]
 if v in PREGUNTAR:return [ask(*(otros or [id]),declines=('senda_ofelia',))]
 if v in OBSERVAR:
  r=[obs(texto,*datos_fuente(n,i))]
  if 'permiso' in t or 'autoriz' in t:r.append(ask(*(otros or [id])))
  return r
 if v in CONTRASTAR:return [contraste_oficio(texto,n,i)]
 if v in PREPARAR:
  coste={'lana':1,'fibra':1} if any(k in t for k in ['manta','tapete','tej','lana']) else {'madera':2,'piedra':1} if any(k in t for k in ['pieza','cuenco','placa','modelo','baliza','instrumento','soporte']) else {'fibra':2,'madera':1}
  r=[pay(texto+' Los materiales se incorporan al trabajo local una sola vez.',coste)]
  if any(k in t for k in ['calibr','circuito','aire','retorno','cuenco','soporte']):r.append(circuit('Comprobar el trabajo de '+n['nombre']+' con núcleo y reserva aislados.'))
  return r
 if v in PROCEDER:
  datos=datos_fuente(n,i);operaciones=['Consultar el alcance: '+texto,'Separar lo comprobado de lo supuesto','Confirmar permiso y alternativa de retirada','Registrar origen y límite del trabajo']
  if any(k in t for k in ['relevo','guardia','expos','contamin','segur','presion']):operaciones=['Declarar cobertura del puesto','Preparar reserva y salida','Confirmar relevo autorizado','Retirar al operario con el puesto cubierto','Conservar informe de seguridad']
  elif any(k in t for k in ['musica','ritmo','pieza autorizada','partitura','silencio']):operaciones=['Entrada autorizada','Pulso A','Pausa visible','Pulso B','Salida voluntaria']
  elif any(k in t for k in ['credit','autor','original','identidad','correccion','atribucion']):operaciones=['Leer la copia autorizada','Marcar discrepancia sin borrar original','Consultar atribución y permiso','Añadir corrección con fecha','Conservar versión anterior']
  r=([ask(*otros)] if otros and ('permiso' in t or 'consent' in t or v in ['acordar','ofrecer','mostrar']) else [])+[seq(texto,operaciones,datos)]
  if 'tras dormir' in t or 'posterior' in t and id=='cuidadora':r.append(wait())
  return r
 raise ValueError('Falta contrato del verbo '+v+' en '+id+': '+texto)

compiled=[]
for n in roster:
 q=n['mision'];pasos=[]
 for i,a in enumerate(q['actos']):pasos+=traducir(n,a,i)
 if n['id']=='nina':pasos=[ask('maestra'),obs(q['actos'][0],'Maceta de práctica: humedad 20.','Maceta testigo: humedad 60.','La maceta testigo conserva un crecimiento normal.'),pay(q['actos'][1],{'fertilizante':1}),crop(),seq(q['actos'][2],['Leer el recibo del cultivo','Dibujar sin arrancar la planta','Anotar una pregunta','Conservar el cuaderno con Alma'])]
 if n['id']=='lirios_tina':pasos.insert(0,ask('lirios_julian'))
 if n['id']=='nino':pasos.insert(0,ask('guardabosques'))
 if n['id']=='brasa_yago':pasos.insert(0,ask('brasa_sol'))
 if n['id']=='cuidadora':pasos=[care(),pay(q['actos'][1],{'heno':2}),ask('cuidadora'),wait(),dict(care(),posterior=True)]
 compiled.append(dict(id=q['id'],titulo=q['titulo'],region=npc[n['id']]['region'],clase='personal',personal=n['id'],requiere=q['requiere'],reparto=[n['id']],pasos=pasos,decision=q['decision'],ramas=q['respuestas'],consecuencias=n['arco']))

# Encuentros: sus preparaciones tienen costes propios y las almas no requieren alimento corporal.
enc=json.loads((N/'datos/encuentros.json').read_text())
costes=[{'pan':4},{'madera':2,'fibra':1},{'fibra':3,'lana':1},{'piedra':3},{'madera':2},{'lana':1,'pan':2},{'fibra':2},{'madera':1,'fibra':1},{'cuerda':1},{'madera':2},{'cuerda':1},{'madera':2,'fibra':1},{'pan':3},{'pan':2},{'antorcha':1},{'piedra':2,'fibra':1},{'madera':2,'piedra':1},{'pan':2},{'cuerda':1}]
for i,q in enumerate(enc):
 region=q['asentamiento'];ids=[id for id in q['reparto'] if id in npc]
 pasos=[ask(*ids[:3])]
 if q['id'] in ['E01','E13','E14','E18']:pasos.append(oficio(q['acciones'][0]+' Prepara las raciones con una receta ordinaria de pan.','fabricar_pan',costes[i].get('pan',1)))
 pasos+=[pay(q['acciones'][0]+' Los materiales se usan en el puesto del encuentro.',costes[i]),seq(q['acciones'][1],['Consultar alcance del encuentro','Preparar entrada segura','Ensayar primera parte','Ofrecer pausa o retiro','Confirmar regreso'],['Ensayo autorizado por los participantes. La pausa y la salida siguen disponibles.',q['lineas'].split('\n')[0]]),seq(q['acciones'][2],['Confirmar permisos vigentes','Ofrecer participación sin obligación','Recoger piezas de visita','Conservar paso y salida'])]
 compiled.append(dict(id=q['id'],titulo=q['titulo'],region=region,clase='encuentro',requiere=q['requiere'],reparto=q['reparto'],pasos=pasos,decision=q['eleccion'],ramas=q['ramas'],consecuencias='El encuentro conserva participación voluntaria y su recuerdo comunitario.'))

secretos=json.loads((N/'datos/secretos.json').read_text())
for q in secretos:
 ids=[id for id in q['reparto'] if id in npc];region=npc[ids[0]]['region']
 pistas=[]
 for i,texto in enumerate(q['pistas']):
  n=npc[ids[i%len(ids)]];p=n['oficio'] if n['region']!='pueblo_sol' else {'x':75.5+i*2,'z':23.4}
  pistas.append(dict(texto=texto,region=n['region'],x=p['x'],z=p['z']))
 datos=[q['pistas'][0],q['pistas'][1],q['acciones'][0]]
 pasos=[obs(q['acciones'][0],*datos),ask(*ids[:3]),seq(q['acciones'][2],['Revisar qué parte fue autorizada','Mantener datos privados fuera del acta','Conservar origen y responsabilidad','Aceptar conversación o privacidad'])]
 if q['id']=='S04':pasos.insert(2,pay('Preparar la custodia del lote inerte sin abrir contención.',{'madera':2,'piedra':2}))
 if q['id']=='S09':pasos.insert(2,circuit('Probar la baliza redundante en un modelo aislado.'))
 if q['id']=='S11':pasos.insert(2,pay('Restituir el material de ensayo contabilizado.',{'madera':2,'piedra':1}))
 if q['id']=='S12':pasos=[obs(q['acciones'][0],'El cierre anterior conserva sus recibos; no repite premios.'),step('nota','Escoger una pregunta del mundo o escribir una nota local. No se publica el texto.')]
 compiled.append(dict(id=q['id'],titulo=q['titulo'],region=region,clase='secreta',requiere=q['requiere'],reparto=q['reparto'],pistas=pistas,pasos=pasos,decision=q['eleccion'],ramas=q['ramas'],consecuencias='Solo se conserva lo autorizado; escoger privacidad también completa la historia.'))

T=json.loads((N/'datos/elementales.json').read_text())
for q in T:
 ids=[id for id in q['reparto'] if id in npc];region=q['zona'];pasos=[ask(*ids[:2]),obs(q['acciones'][0],q['acciones'][1],q['efecto_premio'])]
 if q['id']=='T01':pasos += [pay('Preparar el soporte de la rampa sin retirar un núcleo.',{'madera':2,'piedra':2}),circuit('Probar el retorno del soporte y su reserva de reparación.')]
 elif q['id']=='T02':pasos += [pay(q['acciones'][1],{'fibra':2,'madera':1}),oficio('Observar la reserva de fauna del muelle sin capturar juveniles.','observacion:puerto_lirios_fauna')]
 elif q['id']=='T03':pasos += [care(),seq(q['acciones'][1],['Despejar visitantes','Mantener refugio y alimento','Ofrecer un contacto voluntario','Conservar descanso del animal'])]
 elif q['id']=='T04':pasos += [pay(q['acciones'][1],{'confluencia_aire_mineral':1,'confluencia_aire_madera':1}),compare(q['acciones'][2],['La señal A dice norte y tiene forma de flecha norte.','La señal B dice norte, pero su forma señala sur.','La señal C dice sur y tiene forma de flecha sur.'],['A y C conservan texto y forma concordantes','B basta si su color es brillante','Hace falta escuchar las tres'],0)]
 elif q['id']=='T05':pasos += [compare(q['acciones'][1],['El retorno reparado tiene recibo.','La restitución conserva destinatario y revisión.','La reserva alternativa está disponible y es limitada.'],['El recibo obliga a perdonar','La responsabilidad y el suministro pueden revisarse sin exigir perdón','La pérdida demuestra que todo uso humano es culpa'],1)]
 elif q['id']=='T06':pasos += [crop(),compare(q['acciones'][1],['Reserva local: 6; demanda prevista: 4.','Una inundación demanda 20 y destruye el soporte de retorno.'],['Ajustar riego con demanda y reserva explícitas','Inundar sin contabilizar compensaciones','Fuatia no puede mover agua'],0)]
 elif q['id']=='T07':pasos += [pay(q['acciones'][1],{'confluencia_fuego_mineral':2,'confluencia_fuego_madera':1}),circuit('Aislar el intercambiador y conservar retorno y parada.')]
 else:pasos += [compare(q['acciones'][1],[q['pistas'][0],q['pistas'][1]],['Consultar solo la versión autorizada','Entrar a una vivienda cerrada','Publicar la nota incompleta'],0)]
 pasos.append(seq(q['acciones'][2],['Declarar la reserva y su uso','Conservar límites y derecho a disentir','Confirmar regreso y responsable de revisión','Registrar el acuerdo revisable']))
 c=dict(id=q['id'],titulo=q['titulo'],region=region,clase='arco_elemental',requiere=q['requiere'],reparto=q['reparto'],pasos=pasos,decision=q['eleccion'],ramas=q['ramas'],consecuencias=q['efecto_premio'])
 if q.get('secreta'):c['pistas']=[dict(texto=t,region=region,x=75.5+i*2,z=23.4) for i,t in enumerate(q['pistas'])]
 compiled.append(c)

for q in compiled:
 for i,p in enumerate(q['pasos']):
  p['id']=q['id']+'.'+str(i+1);p['region']=p['region'] or q['region']
  p['punto']=({'x':75.5,'z':23.4} if p['region']=='pueblo_sol' else reg.get(p['region'],{}).get('plano',{}).get('archivo',{'x':0,'z':22})) if p['tipo'] not in ['cultivar','cuidar','preguntar','visitar','oficio'] else None
  if p['tipo']=='devolver_pesca':p['punto']=None
  for n in p.get('participantes',[]):assert n['id'] in npc,n['id']
assert len(compiled)==181 and len({q['id'] for q in compiled})==181
(N/'jugabilidad/secundarias.json').write_text(json.dumps(compiled,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'secundarias':len(compiled),'pasos':sum(len(q['pasos']) for q in compiled),'secretos_descubribles':sum(bool(q.get('pistas')) for q in compiled)}))
