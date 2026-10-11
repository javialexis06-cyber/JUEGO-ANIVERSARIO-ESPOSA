"""Comprueba cobertura, referencias, progreso y seguridad de la autoría narrativa.
Estas comprobaciones NO certifican misiones ejecutables ni equilibrio en una build.
"""
from pathlib import Path
from collections import Counter,defaultdict
import csv
import json
import re
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
def leer(nombre):return json.loads((ROOT/'datos'/nombre).read_text())
def exigir(condicion,mensaje):
    if not condicion:raise ValueError(mensaje)
def unicos(datos,campo,etiqueta):
    duplicados=[k for k,v in Counter(x[campo] for x in datos).items() if v>1]
    exigir(not duplicados,f'{etiqueta}: duplicados {duplicados}')
def comprobar(datos):
    roster=datos['roster'];personas=datos['reparto'];figuras=datos['figuras'];principales=datos['campana'];secretos=datos['secretos'];encuentros=datos['encuentros'];relaciones=datos['relaciones'];premios=datos['recompensas'];lineas=datos['lineas'];neutral=datos['neutral'];elementales=datos['elementales'];recursos=datos['regiones-recursos']
    ids={x['id'] for x in personas};refs={x['id']:x for x in roster['personajes']};regiones={x['id'] for x in roster['asentamientos']}
    exigir(len(personas)==142 and ids==set(refs),'Cobertura o IDs del reparto original alterados')
    exigir(len(figuras)==6 and {x['id'] for x in figuras}=={x['id'] for x in roster['figurasNarrativas']}|{'figura_fuatia'},'Cinco figuras originales incompletas')
    exigir({x['asentamiento'] for x in personas}==regiones and len(regiones)==19,'Asentamientos incompletos')
    unicos(personas,'id','Personajes');unicos(figuras,'id','Figuras');unicos(relaciones,'id','Relaciones');unicos(lineas,'id','Líneas');unicos(premios,'id','Premios')
    misiones=principales+[p['mision'] for p in personas]+secretos+encuentros+elementales
    unicos(misiones,'id','Misiones');mis={q['id']:q for q in misiones}
    exigir(len(principales)==36 and len(secretos)==12 and len(encuentros)==19 and len(elementales)==8,'Cobertura de misiones incorrecta')
    for p in personas:
        exigir(p['nombre']==refs[p['id']]['nombrePropuesto'],'Nombre no reconciliado con roster: '+p['id'])
        exigir(p['hogar_planeado']==refs[p['id']]['hogarPlaneado'],'Vivienda alterada: '+p['id'])
        for k in ['pasado','presente','arco']:
            exigir(isinstance(p[k],str) and len(p[k].split())>=15,f'Perfil sin desarrollo: {p["id"]}.{k}')
        exigir(len(p['vinculos'])>=2 and set(p['vinculos'])<=ids and p['id'] not in p['vinculos'],'Vínculos inválidos: '+p['id'])
        vida=p.get('profundidad',{})
        exigir(len(vida.get('memorias',[]))==3 and all(len(m['texto'].split())>=35 for m in vida['memorias']),'Vida ampliada incompleta: '+p['id'])
        exigir(len(vida.get('escenas',[]))==2 and vida.get('cotidiano') and vida.get('postura_fuatia'),'Vida sin presente o escenas: '+p['id'])
        for n,escena in enumerate(vida['escenas'],1):
            exigir(escena['id']==f"VID_{p['id']}_{n}" and escena['premio'] is None and escena['repetible'] and escena['capa']=='mundo','Escena personal inválida')
            exigir(len(escena['lineas'].splitlines())==4 and all(l.split(': ',1)[0] in ids for l in escena['lineas'].splitlines()),'Diálogo personal incompleto o sin interlocutor')
        q=p['mision']
        exigir(len(q['actos'])==3 and all(q['actos']),'Arco sin tres actos: '+q['id'])
        exigir(len(q['respuestas'])==2 and all(q['respuestas']) and q['decision'],'Rama incompleta: '+q['id'])
        exigir(all(q[k] for k in ['inicio','giro','cierre','recuperacion']),'Guion incompleto: '+q['id'])
        exigir('V_'+p['id']==q['id'],'ID personal inestable: '+q['id'])
        if p['asentamiento']=='bastion_velo':exigir(p['naturaleza']=='persona_viva','Personal de Nox convertido en alma cautiva')
    nox=[p for p in personas if p['asentamiento']=='bastion_velo'];exigir(len(nox)==6,'Perímetro de Nox incompleto')
    muertos={p['id'] for p in personas if p['naturaleza']=='alma_en_reparacion'}
    exigir(muertos=={'senda_ofelia','senda_pablo','hilos_elian'},'Almas de Senda inconsistentes')
    for q in principales:
        exigir(all(q[k] for k in ['inicio','giro','cierre','acciones','recuperacion']),'Guion principal incompleto: '+q['id'])
        exigir(len(q['ramas_dialogo'])==(2 if q['decision'] else 0),'Decisión principal sin ambos guiones: '+q['id'])
    for q in secretos:
        exigir(len(q['pistas'])==3 and len(set(q['pistas']))==3,'Secreto sin pistas distintas: '+q['id'])
        exigir(len(q['acciones'])==3 and len(q['ramas'])==2 and all(q['ramas']) and q['lineas'],'Secreto incompleto: '+q['id'])
    for q in encuentros:
        exigir(q['asentamiento'] in regiones and len(q['acciones'])==3 and len(q['ramas'])==2 and q['lineas'],'Encuentro incompleto: '+q['id'])
    exigir({q['asentamiento'] for q in encuentros}==regiones,'Encuentro comunitario ausente en una localidad')
    # Dependencias completas y sin ciclos: el final no requiere secretos o completar todo el reparto.
    for q in misiones:
        exigir(set(q['requiere'])<=set(mis),'Precedente inexistente: '+q['id'])
        exigir(q['estado']=='diseno_no_integrado','Diseño presentado como runtime: '+q['id'])
        exigir(q['premio'] in {'agenda','plano','tecnica','conocimiento','acceso','trofeo'},'Familia de premio desconocida')
        if 'reparto' in q:exigir(set(q['reparto'])<=ids|{f['id'] for f in figuras},'Interlocutor inexistente: '+q['id'])
    visitados=set();activos=set()
    def visitar(id):
        exigir(id not in activos,'Ciclo de requisitos: '+id)
        if id in visitados:return
        activos.add(id)
        for r in mis[id]['requiere']:visitar(r)
        activos.remove(id);visitados.add(id)
    for id in mis:visitar(id)
    exigir(len(visitados)==217,'Misiones inalcanzables o cobertura incorrecta')
    exigir(all(all(r in {m['id'] for m in principales} for r in q['requiere']) for q in principales),'Campaña bloqueada por secreto o arco opcional')
    exigir({p['mision'] for p in premios}==set(mis) and len(premios)==len(mis),'Premio ausente o repetido por misión')
    for p in premios:
        exigir(p['unica'] and not p['vendible'] and p['monedas']==0 and p['multiplicadores_globales']==0,'Premio rompe presupuesto: '+p['id'])
        exigir(p['efecto_diseno'] and p['limite'] and p['estado']=='diseno_no_integrado','Efecto sin límite o confundido con runtime')
        exigir(p['familia']==mis[p['mision']]['premio'],'Familia incoherente: '+p['id'])
    cubiertos=set();grafo=defaultdict(set)
    for r in relaciones:
        exigir(r['a'] in ids and r['b'] in ids and r['a']!=r['b'],'Relación de personaje inexistente')
        exigir(r['revela'] in mis,'Relación sin escena de desarrollo: '+r['id'])
        exigir(r['pasado'] and r['presente'],'Relación sin trasfondo')
        cubiertos.update([r['a'],r['b']]);grafo[r['a']].add(r['b']);grafo[r['b']].add(r['a'])
    exigir(cubiertos==ids,'Habitante sin relación desarrollada: '+str(ids-cubiertos))
    # La red ampliada incluye contactos funcionales explícitos, no romances implícitos.
    for p in personas:
        for v in p['vinculos']:grafo[p['id']].add(v);grafo[v].add(p['id'])
    vistos=set();pendientes=['mercader']
    while pendientes:
        a=pendientes.pop()
        if a in vistos:continue
        vistos.add(a);pendientes.extend(grafo[a]-vistos)
    exigir(vistos==ids,'Red de mundo desconectada: '+str(ids-vistos))
    menores={'nina','nino','lirios_tina','brasa_yago'}
    for r in relaciones:
        if r['tipo'] in {'pareja_adulta_privada','expareja_adulta_y_colegas','matrimonio_y_duelo'}:
            exigir(not ({r['a'],r['b']}&menores),'Relación romántica de menor')
    voces=set(ids)|{'el','ella','narrador','aura','lara','celia','nathgora','vaelthor','conde','fuatia'}
    escenas=set(mis)|{f'C{i:02}' for i in range(1,15)}|{e['id'] for p in personas for e in p['profundidad']['escenas']}
    for l in lineas:
        exigir(l['hablante'] in voces and l['escena'] in escenas,'Línea sin hablante o escena')
        exigir(l['texto'].strip() and l['direccion'] and l['archivo']==l['id']+'.ogg','Toma incompleta')
        exigir(l['capa'] in {'mundo','pareja'} and l['prioridad'] in {'A','B','C'},'Capa o prioridad inválida')
        if l['escena'].startswith(('P','C','S','F','T')):exigir(l['capa']=='pareja','Contexto de pareja filtrado al paquete neutral')
        if l['hablante'] in {'el','ella'}:exigir(l['capa']=='pareja','Protagonista filtrado al paquete neutral')
    ids_lineas={l['id'] for l in lineas}
    for p in personas:
        q=p['mision']['id']
        exigir({f'{q}.{s}.01' for s in ['A1','A2','A3','R1','R2']}<=ids_lineas,'Momento o rama personal sin exportar')
    escenas_exportadas={l['escena'] for l in lineas}
    exigir(escenas_exportadas==escenas,'Escena o misión sin líneas exportadas')
    exigir({l['id'] for l in neutral}=={l['id'] for l in lineas if l['capa']=='mundo'},'Exportado neutral incompleto o con capa privada')
    exigir(len(recursos['regiones'])==24 and recursos['estado']=='diseno_no_integrado','Catálogo de territorios incompleto')
    unicos(recursos['regiones'],'id','Territorios')
    for zona in recursos['regiones']:
        exigir({r['clase'] for r in zona['recursos']}=={'mineral','semilla','madera','fauna'} and len(zona['recursos'])==4,'Recursos sin ecosistema: '+zona['id'])
        exigir(zona['renovacion']['dias_dormidos'] in range(2,6) and zona['renovacion']['cupo_mineral']==6 and zona['estado']=='diseno_no_integrado','Renovación o estado incorrectos')
        for r in zona['recursos']:exigir(len(r['usos'])==2 and r['obtencion'],'Recurso sin usos recurrentes')
    return {'npc':len(personas),'figuras':len(figuras),'localidades':len(regiones),'misiones':len(misiones),'relaciones':len(relaciones),'lineas':len(lineas),'ciclos':0,'premios_con_bonus_global':0}

def cargar():
    datos={n:leer(n+'.json') for n in ['reparto','figuras','campana','secretos','encuentros','relaciones','recompensas','elementales','regiones-recursos']}
    datos['roster']=json.loads((REPO/'juego/web/src/granja-v3/REPARTO-MUNDOS.json').read_text())
    datos['lineas']=json.loads((ROOT/'audio/lineas.json').read_text());datos['neutral']=json.loads((ROOT/'audio/lineas-mundo.json').read_text())
    return datos
if __name__=='__main__':
    datos=cargar();resultado=comprobar(datos)
    # Ejemplos negativos: demuestran que referencias, bloqueos y privacidad fallan de verdad.
    import copy
    casos=[]
    def caso(nombre,cambio):
        alterado=copy.deepcopy(datos);cambio(alterado)
        try:comprobar(alterado)
        except ValueError:casos.append(nombre)
        else:raise AssertionError('La validación aceptó corrupción: '+nombre)
    caso('NPC omitido',lambda d:d['reparto'].pop())
    caso('ID duplicado',lambda d:d['reparto'][1].update(id=d['reparto'][0]['id']))
    caso('Requisito inexistente',lambda d:d['campana'][2].update(requiere=['P999']))
    caso('Ciclo de campaña',lambda d:d['campana'][0].update(requiere=['P24']))
    caso('Campaña exige secreto',lambda d:d['campana'][0].update(requiere=['S03']))
    caso('Rama sin diálogo',lambda d:d['reparto'][0]['mision'].update(respuestas=['una sola']))
    caso('Interlocutor inexistente',lambda d:d['secretos'][0].update(reparto=['no_existe']))
    caso('Nox como refugio de alma',lambda d:next(p for p in d['reparto'] if p['id']=='nox_dorian').update(naturaleza='cuidador_de_verdia'))
    caso('Bonus acumulable',lambda d:d['recompensas'][0].update(multiplicadores_globales=5))
    caso('Contexto privado exportable',lambda d:next(l for l in d['lineas'] if l['escena']=='C04').update(capa='mundo'))
    caso('Cambio de vivienda',lambda d:d['reparto'][0].update(hogar_planeado='casa_inventada'))
    caso('Secreto sin pistas',lambda d:d['secretos'][0].update(pistas=['una']))
    caso('Fuatia omitida',lambda d:d['figuras'].pop())
    caso('Vida reducida',lambda d:d['reparto'][0]['profundidad'].update(memorias=[]))
    caso('Escena con interlocutor inventado',lambda d:d['reparto'][0]['profundidad']['escenas'][0].update(lineas='inventado: Hola'))
    caso('Arco opcional bloquea campaña elemental',lambda d:next(q for q in d['campana'] if q['id']=='F06').update(requiere=['T01']))
    caso('Mineral sin usos recurrentes',lambda d:d['regiones-recursos']['regiones'][0]['recursos'][0].update(usos=[]))
    # Consistencia de ficheros de producción y enlaces, sin comprobar por reflejo la prosa.
    with (ROOT/'audio/tomas.csv').open(newline='') as f:
        tomas=list(csv.DictReader(f))
    exigir([x['id'] for x in tomas]==[x['id'] for x in datos['lineas']],'CSV de tomas desactualizado')
    for p in ROOT.glob('*.md'):
        for destino in re.findall(r'\]\(([^)]+)\)',p.read_text()):
            if destino.startswith(('http:','https:','#')):continue
            exigir((p.parent/destino.split('#')[0]).exists(),f'Enlace roto: {p.name} → {destino}')
    resumen=json.loads((ROOT/'audio/resumen.json').read_text())
    exigir(resumen['total_lineas']==len(datos['lineas']),'Resumen de audio desactualizado')
    resultado['casos_invalidos_rechazados']=len(casos)
    resultado['estado']='autoria_validada; verificaciones_de_motor_y_medios_separadas'
    (ROOT/'VERIFICACION.json').write_text(json.dumps(resultado,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(resultado,ensure_ascii=False))
