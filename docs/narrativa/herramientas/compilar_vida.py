#!/usr/bin/env python3
"""Agenda social desde las biografías canónicas, sin alterar líneas grabadas."""
import json,re,unicodedata
from pathlib import Path
R=Path(__file__).resolve().parents[3];W=R/'juego/web/src/granja-v3';N=R/'docs/narrativa'
def ts(nombre):
    return json.loads((W/nombre).read_text().split('export const DATOS = ',1)[1].strip().rstrip(';'))
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
lore=ts('astra-lore-datos.ts');world=ts('astra-mundo-datos.ts');bios={n['id']:n for n in lore['npc']}
# Los 24 vecinos originales conservan preferencias, comercio y navegación propios.
familias=[('semillas',r'cultiv|agricult|botanic|semill|jardin', ['manzana','pan','resina'],['heno','harina']),
 ('cuidados',r'ganader|veterin|animal|fauna|refugio|criador', ['manzana','heno','lana'],['heno','tela']),
 ('pesca',r'pesc|ribera|barquer|buz|muelle', ['trucha_asada','pan','cuerda'],['lombriz','cuerda']),
 ('taller',r'forj|miner|metal|taller|carpinter|vidri|ceram|electric|tecnic|ingenier', ['cafe','hierro','resina'],['carbon','resina']),
 ('cocina',r'cocin|posad|panader|comedor|intendente|ferment', ['pan','manzana','harina'],['pan','sal']),
 ('archivo',r'archiv|document|copist|bibliotec|maestr|traductor|cartograf|astronom|investig', ['cafe','vidrio','tela'],['tela','resina']),
 ('tejidos',r'tej|costur|sastr|artesan|musico|pintor|ilustr', ['tela','lana','resina'],['tela','fibra'])]
perfiles=[];escenas={}
for index,n in enumerate(world['npc']):
    b=bios[n['id']];texto=norm(b['funcion']);familia=next((f for f in familias if re.search(f[1],texto)),('vecindad','',['pan','manzana','tela'],[]))
    memoria=' '.join(m['texto'] for m in b['profundidad']['memorias']);edad=re.search(r',? (\d{1,2})(?: años|,)',b['pasado'])
    menor=bool(edad and int(edad[1])<18) or bool(re.search(r'\b(nino|nina|infantil|menor)\b',texto))
    original=n['region']=='pueblo_sol';hashid=sum((i+1)*ord(c) for i,c in enumerate(n['id']));gustos=familia[2]
    encanta=[gustos[hashid%len(gustos)]];gusta=[g for g in gustos if g not in encanta];desagrada=['carbon'] if familia[0]!='taller' else ['heno']
    completo=b.get('mision');q=completo.get('id') if completo else None
    propias=[l for l in lore['lineas'] if l['hablante']==n['id'] and l['escena']=='VID_'+n['id']+'_1']
    posteriores=[l for l in lore['lineas'] if l['hablante']==n['id'] and l['escena']=='VID_'+n['id']+'_2']
    for nivel in ([] if original else range(1,4)):
        filas=posteriores if nivel>1 and posteriores else propias
        escenas['SOC_'+n['id']+'_'+str(nivel)]=[l['id'] for l in filas[:2]] or [l['id'] for l in lore['lineas'] if l['escena']=='VID_'+n['id']+'_1'][:1]
    perfiles.append({'id':n['id'],'region':n['region'],'original':original,'menor':menor,'naturaleza':n.get('naturaleza','persona_viva'),'oficio':familia[0],'descanso':index%7,'abre':540 if menor else 480,'cierra':960 if menor else 1020,'merienda':960 if menor else 750+(hashid%3)*30,'cumpleanos':{'dia':hashid%28+1,'estacion':['primavera','verano','otono','invierno'][hashid//28%4]},'encanta':encanta,'gusta':gusta,'desagrada':desagrada,'mercancia':[] if original or menor or n.get('naturaleza')!='persona_viva' else familia[3], 'mision':q,'cotidiano':b['profundidad']['cotidiano'],'postura_fuatia':b['profundidad']['postura_fuatia'],'cambio':b['arco'],'motivo_regalo':b['presente'],'estacional':familia[0] in ['semillas','pesca'],'nocturno':familia[0]=='archivo' and bool(re.search('astronom|cielo|estrella',texto))})
for p in perfiles:
    if p['id']=='orbita_rita':p['oficio']='logistica';p['mercancia']=['bateria','combustible_estelar']
relaciones=json.loads((N/'datos/relaciones.json').read_text())
data={'perfiles':perfiles,'relaciones':relaciones,'escenas':escenas}
(N/'jugabilidad/vida-social.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(W/'vida-astra-datos.ts').write_text('// Generado por compilar_vida.py. Mantiene las líneas de voz originales.\nimport type {PerfilVida,RelacionVida} from "./vida-astra-tipos";\nexport const PERFILES_VIDA:PerfilVida[]='+json.dumps(perfiles,ensure_ascii=False,separators=(',',':'))+';\nexport const RELACIONES_VIDA:RelacionVida[]='+json.dumps(relaciones,ensure_ascii=False,separators=(',',':'))+';\nexport const ESCENAS_VIDA:Record<string,string[]>='+json.dumps(escenas,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'personas':len(perfiles),'rutinas_nuevas':sum(not p['original'] for p in perfiles),'relaciones':len(relaciones),'escenas':len(escenas),'lineas_nuevas':0}))
