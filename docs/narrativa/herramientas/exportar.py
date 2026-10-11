"""Exporta autoría local a libros, catálogo de recompensas y guiones de audio.
No llama proveedores, no toca partidas y no copia nada al build del juego.
"""
from pathlib import Path
import csv
import hashlib
import json
import re
import subprocess
import sys
from premios import EFECTOS
ROOT=Path(__file__).resolve().parents[1]
for script in ['autor_campana.py','autor_reparto.py','autor_secretos.py','autor_encuentros.py']:
    subprocess.run([sys.executable,str(ROOT/'herramientas'/script)],check=True)
def leer(nombre): return json.loads((ROOT/'datos'/nombre).read_text())
def guardar(path,datos): path.write_text(json.dumps(datos,ensure_ascii=False,indent=2)+'\n')
personajes=leer('reparto.json'); principales=leer('campana.json'); secretos=leer('secretos.json'); relaciones=leer('relaciones.json')
encuentros=leer('encuentros.json')
NOMBRES={x['id']:x['nombre'] for x in personajes}
NOMBRES.update(el='Él',ella='Ella',narrador='Narrador',aura='Aura',lara='Lara',celia='Celia',nathgora='Nath’Gora',vaelthor='Vael’Thor',conde='Conde Sangrevil')
DIRECCION={'narrador':'Cercano y respirado; describir sin anunciar emociones grandiosas.','aura':'Energía cálida, con escucha; firme sin gritar.','lara':'Serenidad clara, verdad difícil sin amenaza.','celia':'Cercana, cotidiana, asombro sin infantilizar.','nathgora':'Cortesía fría; convicción de estar ofreciendo una solución.','vaelthor':'Preciso y paciente; control que empieza a fallar.','conde':'Autoridad educada con miedo; sin pedir absolución.','el':'Natural, práctico, escuchar antes de resolver.','ella':'Natural, humor y límites claros; sin solemnidad automática.'}
DIRECCION.update({
 'mercader':'Directa y cálida; hacer cuentas no la vuelve fría. Ofrecer corrección sin vender confianza.',
 'cuidadora':'Afectuosa y concreta, humor pequeño; aceptar relevo le cuesta más que enseñar.',
 'herrero':'Humor seco, pausas de oficio; reconocer cansancio sin teatralizarlo.',
 'posadera':'Hospitalidad con carácter, humor de cocina; Lucio no provoca llanto obligatorio.',
 'archivero':'Preciso; usa fechas para ganar tiempo antes de admitir responsabilidad.',
 'canalizadora_aura':'Impulso cálido que aprende a hacer una pausa antes de invitar.',
 'canalizadora_lara':'Dejar terminar al otro; voz clara, risa baja, sin susurro de oráculo.',
 'astronoma':'Precisión con curiosidad y dudas audibles, nunca voz robótica.',
 'viajera':'Ágil sin atropellar confidencias; cansancio cotidiano cuando habla de quedarse.',
 'veterano':'Autoridad acostumbrada a explicar; acortar frases al reconocer su firma.',
 'hilos_tecla':'Comparar y corregirse; firmeza contra un modelo, respeto ante su testigo.',
 'hilos_elian':'Recuperar respiración al poder negar; no actuar confusión como caricatura.',
 'verdia_lucio':'Humor de cocina y cariño sin exigir espera; voz humana, no efecto fantasmal.',
 'nina':'Curiosidad y afecto, orgullo pequeño; interpretación infantil sin caricatura.',
 'nino':'Entusiasmo por aventuras y vergüenza al corregir un mapa; interpretación infantil respetuosa.',
 'lirios_tina':'Preguntas rápidas y sentido del humor; sin declamar como una persona adulta.',
 'brasa_yago':'Impulso y alivio al poder admitir un error; sin caricatura ni solemnidad adulta.'})
lineas=[]
def linea(escena,sufijo,hablante,texto,direccion,capa,prioridad):
    assert hablante in NOMBRES,(escena,hablante)
    id=f'{escena}.{sufijo}'
    lineas.append(dict(id=id,escena=escena,hablante=hablante,texto=texto,direccion=DIRECCION.get(hablante,direccion),capa=capa,archivo=f'{id}.ogg',prioridad=prioridad,huella_texto=hashlib.sha256(f'{hablante}|{texto}'.encode()).hexdigest()[:16]))
def bloque(escena,sufijo,texto,capa,prioridad,direccion):
    for n,t in enumerate(texto.splitlines(),1):
        if not t.strip():continue
        quien,frase=t.split(': ',1)
        linea(escena,f'{sufijo}.{n:02}',quien,frase,direccion,capa,prioridad)
def citas(texto):
    return '\n'.join(f'> **{NOMBRES[q]}:** {t}' for q,t in [x.split(': ',1) for x in texto.splitlines() if x.strip()])
recompensas=[]
POLITICAS={
 'conocimiento':('Ficha comparativa reutilizable de la prueba y sus límites.','No concede materiales, datos no descubiertos ni estadísticas.'),
 'agenda':('Plantilla de planificación del oficio y recordatorio en la partida.','Tres planes fijados; no altera tiempo ni consume recursos automáticamente.'),
 'plano':('Variante reparable o contextual del diseño autorizado.','Mismos insumos y rendimiento; sin venta ni multiplicador global.'),
 'acceso':('Visita, consulta o servicio adicional vinculado al acuerdo.','Conserva consentimiento, permisos, equipo y recursos requeridos.'),
 'tecnica':('Método alternativo o calibración de proceso.','Como máximo 20% de tiempo de operación; nunca se acumula ni afecta cuidado/cultivo.'),
 'trofeo':('Recuerdo exhibible con escena y motivo instrumental si existe.','Sin estadísticas, monedas o inventario comercial; lectura y exhibición no pagan.')}
def premio(id,titulo,familia,tema):
    utilidad,limite=POLITICAS[familia]
    recompensas.append(dict(id=f'Q_{id}',mision=id,nombre=titulo,familia=familia,tema=tema,utilidad=utilidad,efecto_diseno=EFECTOS.get(id,f'{utilidad} Tema exclusivo: {tema}'),limite=limite,insignia=f'I_{id}',unica=True,vendible=False,monedas=0,multiplicadores_globales=0,estado='diseno_no_integrado'))

texto=['# El reparto de Astra','', '142 NPC, cada uno con biografía y un arco personal de tres actos. Los nombres se adoptan para autoría; sus IDs originales permanecen. Las cinco figuras divinas están en [Mundo](01-mundo.md) y Sangrevil y protagonistas en [Campaña](02-campana.md).','', 'Las acciones son instrucciones para diseño, no diálogo pronunciado ni funciones ya implementadas. Inicio, giro, cierre y ambas respuestas constituyen el guion breve completo de cada arco; las escenas extensas de los personajes centrales están en la campaña. No se cuentan los tres actos como tres misiones distintas.','']
texto += ['## Índice por localidad','','| Localidad | Personajes |','|---|---|']
for region_id in dict.fromkeys(x['asentamiento'] for x in personajes):
    texto.append(f'| [{region_id}](#{region_id}) | {sum(x["asentamiento"]==region_id for x in personajes)} |')
texto.append('')
region=None
for x in personajes:
    if region!=x['asentamiento']:
        region=x['asentamiento'];texto+=['## '+region,'']
    q=x['mision']; prioridad='B' if region=='pueblo_sol' else 'C'
    texto += [f"### {x['nombre']} · `{x['id']}`",'',f"**Pasado:** {x['pasado']}",'',f"**Presente y personalidad:** {x['presente']}",'',f"**Cambio:** {x['arco']}",'',f"**Vínculos:** {', '.join(NOMBRES[v] for v in x['vinculos'])}. **Naturaleza:** {x['naturaleza']}. **Hogar planificado:** `{x['hogar_planeado']}`.",'',f"#### {q['titulo']} · `{q['id']}`",'']
    for n,(accion,campo,tono) in enumerate(zip(q['actos'],['inicio','giro','cierre'],['Ofrecer sin presión, tono cotidiano.','Reconocer contradicción sin pedir consuelo al oyente.','Cambio pequeño y concreto, sin fanfarria.']),1):
        texto += [f'**Acto {n}:** {accion}.','',f"> **{x['nombre']}:** {q[campo]}",'']
        linea(q['id'],f'A{n}.01',x['id'],q[campo],tono,'mundo',prioridad)
    texto += [f"**Acceso narrativo:** después de `{q['requiere'][0]}` y visita autorizada. **Decisión antes del acto 3:** {q['decision']}.",'']
    for n,resp in enumerate(q['respuestas'],1):
        texto += [f"> **{x['nombre']} · respuesta {n}:** {resp}",'']
        linea(q['id'],f'R{n}.01',x['id'],resp,'Responder a una elección válida, sin juzgar la otra.','mundo',prioridad)
    texto += [f"**Recuperación:** {q['recuperacion']}",'',f"**Premio único:** `{q['premio']}` y recuerdo «{q['titulo']}». {EFECTOS[q['id']]} Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.",'']
    premio(q['id'],q['titulo'],q['premio'],q['actos'][-1])
(ROOT/'03-reparto.md').write_text('\n'.join(texto))
texto=['# Guiones de las 24 misiones principales','', 'Complemento operativo de [Campaña](02-campana.md). Cada hito requiere acciones reales antes de su escena; las acotaciones nunca se leen en voz alta.','']
for q in principales:
    texto += [f"## {q['id']} · {q['titulo']}",'',f"**Lugar:** {q['zona']}. **Precedente:** {', '.join(q['requiere']) or 'Inicio'}.",'',f"**Acciones y prueba:** {q['acciones']}",'']
    for campo,tono in [('inicio','Conversación al ofrecer misión.'),('giro','Descubrimiento y reacción, dejar responder.'),('cierre','Cierre concreto, sin triunfalismo.')]:
        texto += [f'**{campo.capitalize()}:**','',citas(q[campo]),'']
        bloque(q['id'],campo,q[campo],'pareja','A',tono)
    if q['decision']:texto += [f"**Decisión:** {q['decision']}",'',f"**Consecuencias:** {q['consecuencias']}",'']
    for n,resp in enumerate(q['ramas_dialogo'],1):
        texto += [f'**Guion de rama {n}:**','',citas(resp),'']
        bloque(q['id'],f'rama{n}',resp,'pareja','A','Consecuencia práctica de una elección válida.')
    texto += [f"**Premio:** `{q['premio']}` y recuerdo del hito; no transfiere botín entre juegos.",'', '**Si falla o se suspende:** conservar testimonios; devolver reservas no consumidas; volver al último puesto seguro. Reintentar prueba sin duplicar costos ya confirmados ni el premio. No vence con tiempo real.','']
    premio(q['id'],q['titulo'],q['premio'],q['acciones'])
(ROOT/'02-misiones-principales.md').write_text('\n'.join(texto))
texto=['# Relaciones y misiones ocultas','', 'Cada personaje mantiene al menos un vínculo desarrollado en esta red. Los contactos adicionales de su ficha indican con quién puede cruzar oficios; no implican parentescos o romances no escritos. Todos los romances son entre adultos.','', '## Cómo descubrir sin invadir','', 'Cada secreto tiene tres pistas disponibles en espacios autorizados, documentos públicos o comentarios voluntarios. Dos pistas abren la pregunta; una conversación o contraste confirma el hecho. Las pistas pueden obtenerse en cualquier orden y se conservan en diario. No se requieren compras, horas reales, códigos externos ni amistad máxima. Si una puerta está cerrada, la misma pista puede consultarse en su copia pública señalada; eso nunca da acceso a una carta privada.','', 'Las relaciones privadas tienen cierre y premio equivalente aunque sus protagonistas no quieran revelarlas. La biblia contiene spoilers para producción; el juego solo muestra lo autorizado. Nunca se comunica una confidencia a un tercero para cerrar una colección.','', '## La red','']
for r in relaciones:
    texto += [f"### {r['id']} · {NOMBRES[r['a']]} ↔ {NOMBRES[r['b']]}",'',f"**Vínculo:** {r['tipo'].replace('_',' ')}. **Información:** {'privada o descubrible con permiso' if r['secreto'] else 'compartible en su arco'}.",'',r['pasado'],'',r['presente'],'',f"**Escena de desarrollo:** `{r['revela']}`.",'']
texto += ['## Los doce secretos','']
for q in secretos:
    texto += [f"### {q['id']} · {q['titulo']}",'',f"**Precedente:** {', '.join(q['requiere']) or 'Visita a sus lugares autorizados; sin campaña obligatoria'}.",'', '**Pistas:**','']+[f'{n}. {p}.' for n,p in enumerate(q['pistas'],1)]+['','**Recorrido:**','']+[f'{n}. {p}.' for n,p in enumerate(q['acciones'],1)]+['','**Guion:**','',citas(q['lineas']),'',f"**Elección:** {q['eleccion']}.",'']
    bloque(q['id'],'escena',q['lineas'],'pareja','B','Pregunta respetuosa y confidencia sin espectáculo.')
    for n,resp in enumerate(q['ramas'],1):
        texto += [f'**Rama {n}:**','',citas(resp),'']
        bloque(q['id'],f'rama{n}',resp,'pareja','B','Respetar ambas decisiones; sin insinuar una opción correcta.')
    texto += [f"**Premio equivalente:** `{q['premio']}` y recuerdo del hallazgo. Sin bonus por divulgar. **Recuperación:** guardar pistas y esperar consentimiento; el capítulo nunca vence. Si alguien no quiere hablar, la rama de privacidad cierra con el mismo premio.",'']
    premio(q['id'],q['titulo'],q['premio'],q['acciones'][-1])
(ROOT/'04-relaciones-secretos.md').write_text('\n'.join(texto))
texto=['# Diecinueve encuentros comunitarios','', 'Un arco por localidad: juego, comida, arte o descanso. No toda historia necesita un daño que confesar. Se pueden preparar y completar sin esperar una fecha real; su representación se agenda en la siguiente franja disponible del calendario agrícola. Son misiones únicas, con escena repetible sin premio adicional.','']
for q in encuentros:
    texto += [f"## {q['id']} · {q['titulo']}",'',f"**Lugar:** {q['asentamiento']}. **Acceso:** {', '.join(q['requiere'])} y visita autorizada.",'', '**Preparación y ejecución:**','']+[f'{n}. {p}.' for n,p in enumerate(q['acciones'],1)]+['','**Escena central:**','',citas(q['lineas']),'',f"**Decisión antes de la representación:** {q['eleccion']}.",'']
    bloque(q['id'],'escena',q['lineas'],'mundo','B' if q['asentamiento']=='pueblo_sol' else 'C','Conversación ligera entre vecinos; humor sin remate exagerado.')
    for n,resp in enumerate(q['ramas'],1):
        texto += [f'**Rama {n}:**','',citas(resp),'']
        bloque(q['id'],f'rama{n}',resp,'mundo','B' if q['asentamiento']=='pueblo_sol' else 'C','Respuesta natural y práctica.')
    texto += [f"**Premio único:** `{q['premio']}` y recuerdo de la reunión. Ambas variantes dan utilidad equivalente.",'', '**Recuperación:** si falta equipo, material, permiso o turno, posponer conservando preparación no consumida; nadie pierde amistad por no asistir. Los niños participan con supervisión. Ningún evento consume reservas de seguridad para mantener apariencia de fiesta.','']
    premio(q['id'],q['titulo'],q['premio'],q['acciones'][-1])
(ROOT/'07-encuentros.md').write_text('\n'.join(texto))
# Solo párrafos de diálogo dentro de escenas C01–C10, no biografías ni instrucciones.
actual=None; contador=0
for l in (ROOT/'02-campana.md').read_text().splitlines():
    match=re.match(r'## (C\d{2}) ·',l)
    if match:actual=match[1];contador=0;continue
    if l.startswith('## ') and not match:actual=None
    if actual:
        match=re.match(r'^([a-z_]+): (.+)$',l)
        if match:
            contador+=1;linea(actual,f'L{contador:03}',match[1],match[2],'Escena larga; respetar pausas y escuchar reacción.','pareja','A')
guardados=sorted(lineas,key=lambda l:l['id'])
guardar(ROOT/'datos/recompensas.json',recompensas)
figuras=[]
contenido_mundo=(ROOT/'01-mundo.md').read_text()
for id,nombre,alias in [('figura_aura','Aura','aura'),('figura_lara','Lara','lara'),('figura_celia','Celia','celia'),('figura_nathgora','Nath’Gora','nathgora'),('figura_vaelthor','Vael’Thor','vaelthor')]:
    parrafo=re.search(r'\*\*'+re.escape(nombre)+r'\*\* (.+)',contenido_mundo).group(1)
    figuras.append(dict(id=id,nombre=nombre,alias_voz=alias,biografia=parrafo,estado='autoria_sin_npc_social'))
guardar(ROOT/'datos/figuras.json',figuras)
guardar(ROOT/'audio/lineas.json',guardados)
guardar(ROOT/'audio/lineas-mundo.json',[l for l in guardados if l['capa']=='mundo'])
# Una voz por identidad de autoría; la selección concreta del proveedor está deliberadamente sin configurar.
voces=[dict(id=k,nombre=v,direccion=DIRECCION.get(k,'Leer su biografía: ritmo y léxico de oficio sin caricatura.'),voz_proveedor=None,estado='reutilizar_voz_ya_autorizada' if k in {'el','ella'} else 'por_elegir',referencia_personaje=k) for k,v in NOMBRES.items()]
guardar(ROOT/'audio/reparto-voces.json',voces)
por_voz=ROOT/'audio/por-voz';por_voz.mkdir(exist_ok=True)
for k,v in NOMBRES.items():
    seleccion=[l for l in guardados if l['hablante']==k]
    # No conservar antiguos archivos si una voz desapareciera: todos los ficheros de esta carpeta son exportados.
    contenido=[f'# {v}','', 'Texto pronunciado y dirección separados. No leer IDs, títulos ni acotaciones.','']
    for l in seleccion:contenido += [f"## {l['id']}",'',f"Dirección: {l['direccion']} Capa: {l['capa']}.",'',l['texto'],'']
    (por_voz/f'{k}.md').write_text('\n'.join(contenido))
with (ROOT/'audio/tomas.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['id','escena','hablante','texto','direccion','capa','archivo','prioridad','huella_texto'],lineterminator='\n');w.writeheader();w.writerows(guardados)
resumen={}
for prioridad in ['A','B','C']:
    ls=[l for l in lineas if l['prioridad']==prioridad]
    resumen[prioridad]=dict(lineas=len(ls),caracteres=sum(len(l['texto']) for l in ls),palabras=sum(len(l['texto'].split()) for l in ls))
resumen.update(total_lineas=len(lineas),voces_con_lineas=len({l['hablante'] for l in lineas}),misiones_principales=len(principales),arcos_personales=len(personajes),secretos=len(secretos),encuentros=len(encuentros),relaciones=len(relaciones),estado='guiones_sin_audio_generado',costo='Sin calcular; depende del proveedor, voz, modelo y promoción vigentes.')
unicas={(l['hablante'],l['texto']) for l in lineas}
resumen.update(tomas_unicas_por_hablante_texto=len(unicas),caracteres_unicos=sum(len(t) for _,t in unicas),minutos_estimados_a_145_palabras_por_minuto=round(sum(len(t.split()) for _,t in unicas)/145,1))
guardar(ROOT/'audio/resumen.json',resumen)
(ROOT/'audio/README.md').write_text('\n'.join([
 '# Guiones para producción de voces','',
 f"{resumen['total_lineas']} líneas en {resumen['voces_con_lineas']} identidades de voz; {resumen['tomas_unicas_por_hablante_texto']} combinaciones únicas de hablante y texto. {resumen['caracteres_unicos']} caracteres únicos de texto pronunciado, sin direcciones ni segundas tomas.",
 '', f"Lectura estimada: {resumen['minutos_estimados_a_145_palabras_por_minuto']} minutos a 145 palabras por minuto, antes de pausas. No es duración medida ni costo contratado.",
 '', '| Prioridad | Líneas | Caracteres de texto |','|---|---|---|',
 *[f"| {p} | {resumen[p]['lineas']} | {resumen[p]['caracteres']} |" for p in ['A','B','C']],
 '', '[Dirección completa](../06-produccion.md) · [Catálogo](lineas.json) · [Tomas CSV](tomas.csv) · [Resumen](resumen.json) · [Texto por voz](por-voz)',
 '', 'A: campaña y escenas largas. B: Pueblo del Sol, sus encuentros y secretos. C: resto del reparto y reuniones regionales.',
 '', 'Los archivos por voz contienen únicamente texto pronunciado y dirección separada. Las voces concretas del proveedor siguen sin configurar. Este exportador no genera audio ni realiza llamadas de pago.',
 '', '`lineas-mundo.json` contiene arcos personales y encuentros neutrales. Las escenas de campaña y secretos permanecen en capa pareja por su contexto. No es una campaña adaptada de amigos ni se copia a un build automáticamente.',
 '', 'Antes de producir una tanda, elegir reparto y revisar escena completa. La cifra de caracteres no incluye instrucciones del modelo ni correcciones; consultar precio y promoción vigentes en la cuenta.'])+'\n')
print(json.dumps(resumen,ensure_ascii=False))
