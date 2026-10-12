#!/usr/bin/env python3
"""Contratos jugables explícitos. Conserva guiones, IDs, consentimiento y materiales finitos."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
N=ROOT/'docs/narrativa'
W=ROOT/'juego/web/src/granja-v3'
main=json.loads((N/'datos/campana.json').read_text())
world=json.loads((ROOT/'juego/web/public/granja/astra/produccion.json').read_text())
npcs={n['id']:n for n in world['npc']}
regiones={r['id']:r for r in world['regiones']}
missions={q['id']:q for q in main}

def step(tipo,texto,region=None,**kw): return dict(tipo=tipo,texto=texto,region=region,punto=None,**kw)
def obs(texto,*datos,region=None):return step('observar',texto,region,datos=list(datos))
def ask(*ids,declines=()):return step('preguntar','Pedir permiso y escuchar la respuesta de cada participante.',participantes=[dict(id=n,respuesta='aplaza' if n in declines else 'acepta',texto=('Prefiero aplazarlo. Usa el caso autorizado del archivo; no cuentes mi silencio como un sí.' if n in declines else 'Autorizo esta consulta y su uso para este trabajo. Las partes privadas quedan fuera.')) for n in ids])
def seq(texto,orden,datos=(),region=None):return step('secuencia',texto,region,orden=orden,datos=list(datos))
def compare(texto,datos,opciones,respuesta,region=None):return step('contraste',texto,region,datos=datos,opciones=opciones,respuesta=respuesta)
def pay(texto,materiales,region=None):return step('entregar',texto,region,materiales=materiales)
def visit(*regions):return step('visitar','Recorrer los destinos autorizados y conservar sus recibos.',regiones=list(regions))
def care(n=2):return step('cuidar','Alimentar y acompañar a animales ordinarios distintos después de aceptar.',region='granja',cantidad=n)
def crop(n=1):return step('cultivar','Sembrar, regar y cosechar cultivos ordinarios propios, conservando especie y procedencia.',region='granja',cantidad=n)
def wait(n=1):return step('jornadas','Dormir '+str(n)+' jornada(s); las horas reales y entrar al mapa no cuentan.',cantidad=n)
def night(sector):return step('sangre','Completar la puerta de '+sector+' en Sangre y Ceniza con el mismo personaje.',sector=sector,cantidad=1 if sector=='afueras' else 0)
def inspect(condicion,texto):return step('inspeccionar',texto,condicion=condicion)
def circuit(texto,region=None):return step('circuito',texto,region,datos=['Entrada en el oeste; retorno autorizado en el este.', 'El núcleo central está protegido: ninguna conexión puede entrar en él.', 'La reserva y el retorno son destinos distintos. Cambia las uniones y comprueba el circuito.'])
maze=['#########','#S..#..A#','#.#.#.#.#','#.#...#.#','#.###.#.#','#B....#R#','#.#####.#','#......E#','#########']

steps={
 'P01':[
  obs('Examinar el surco de referencia y sus muestras.', 'Surco afectado: semilla viva, humedad suficiente y retorno detenido.', 'Surco testigo: semilla ordinaria, riego y crecimiento al dormir.'),
  crop(),compare('Comparar el ensayo con el surco afectado.', ['Tu recibo conserva siembra, riego y cosecha del mismo surco.', 'El testigo creció con reglas agrícolas normales.'], ['Toda semilla está dañada','El fallo se limita al intercambio del surco afectado','Dormir sustituye al agua'],1),
 ],
 'F01':[
  obs('Medir dos surcos y el canal público.','Humedad del afectado: 62; testigo: 64. Ambos superan el mínimo de 50.','El canal recibe 12 unidades; devuelve 0. El cultivo no falla por ausencia de oración.'),
  ask('botanica'),visit('puerto_lirios'),compare('Identificar la causa comprobada.', ['La orilla mantiene reserva; el canal no registra retorno.', 'Una semilla sana creció en el testigo.'],['Falta de devoción','Falta global de agua','Un tramo de retorno está detenido'],2),
 ],
 'P02':[wait(),ask('vigilia_telmo'),ask('canalizadora_lara'),compare('Contrastar sello y ruta de regreso.', ['Sello: Valdemora; recepción: jornada agrícola posterior a la solicitud.', 'Serena conserva el ancla; no necesita que ambos teléfonos marquen la misma hora.'],['La carta exige simultaneidad real','Mantener el ancla permite investigar y volver','La carta acredita una victoria de combate'],1)],
 'P03':[inspect('equipo','Revisar herramientas, arma y ración del catálogo.'),pay('Reservar ancla y comida para un ensayo de retorno.',{'madera':2,'pan':1}),seq('Practicar extracción y retorno con una pieza inerte.', ['Declarar la reserva','Marcar la salida','Aislar la pieza de práctica','Retirar sin ocupar el paso','Regresar al ancla'], ['Es una prueba de equipo; no consume animales ni acredita una puerta de Sangre.'])],
 'P04':[night('afueras')],
 'P05':[obs('Consultar las dos copias públicas.', 'Original firmado: tres lotes y tres destinatarios.', 'Resumen posterior: cuatro lotes; repite el segundo recibo sin nueva entrega.'),ask('veterano'),compare('Señalar la discrepancia demostrable.', ['Las firmas autorizan la consulta, no una acusación automática.'],['Falta la firma de la diosa','Un recibo aparece dos veces','La cosecha produjo menos'],1)],
 'P06':[night('subsuelo'),obs('Comparar roca y registro de Darío.', 'La prueba geológica es una copia; el mineral de Sangre no entra en la mochila agrícola.', 'Conducto: entrada 8, reserva 3 y devolución registrada 8 sin salida física.'),circuit('Aislar el retorno falseado del conducto y conservar su prueba.')],
 'F02':[compare('Distinguir reserva, entrada y retorno.', ['Registro A: entran 8, quedan 3 y salen 5.', 'Registro B: entran 8, quedan 3 y se declaran 8 devueltas.'],['Ambos balances son correctos','El registro B cuenta energía reservada como devolución','El agua dejó de existir'],1),circuit('Retirar la conexión de Vael y abrir el retorno independiente.')],
 'P07':[care(),inspect('refugio','Comprobar hogar, alimento y reserva de los animales cuidados.',),ask('cuidadora'),obs('Recibir los tres manuscritos prestados tras el cuidado.', 'Custodio del unicornio: origen y límites de su testimonio.', 'Custodio del dragón: protección del hábitat, sin criar una especie rara.', 'Custodio del grifo: derecho de retirada y copia autorizada.')],
 'P08':[night('santuario'),obs('Registrar la prueba real del Santuario.', 'La puerta y los rescates proceden de la partida de Sangre.', 'El rito agrícola no reemplaza ni repite la destrucción de los altares de la Noche.')],
 'P09':[night('corte')],
 'P10':[ask('vigilia_noemi','vigilia_telmo'),pay('Preparar provisiones y soporte para el refugio.',{'pan':2,'madera':4}),seq('Organizar atención sin imponer retorno ni testimonio.', ['Contar plazas','Reservar alimento','Preguntar dónde quieren permanecer','Registrar la opción voluntaria','Publicar turnos de atención'])],
 'F03':[obs('Inspeccionar el contrato público del comedor.', 'La comida no exige una declaración contra la Custodia.', 'Cerrar el horno antes de abrir otra mesa dejaría a sus usuarios sin atención.'),ask('nox_inigo'),pay('Preparar la mesa alternativa antes del cierre.',{'pan':2,'madera':4}),seq('Cambiar el servicio sin interrumpir la atención.', ['Abrir la mesa alternativa','Confirmar plazas y reserva','Trasladar a quien lo desea','Cerrar el horno contaminante','Conservar consulta voluntaria'])],
 'P11':[wait(3),obs('Comparar las lecturas de tres jornadas agrícolas.', 'Jornada uno: lote A, retorno 4.', 'Jornada dos: lote B, mismo recibo del lote A.', 'Jornada tres: lote C, mismo recibo del lote A.'),compare('Distinguir el patrón de la ceniza.', ['Tres envíos distintos conservan un único recibo copiado.'],['Todos los cultivos están enfermos','El envío duplica el registro de retorno','Las tres jornadas son la misma noche real'],1)],
 'P12':[ask('posadera','canalizadora_aura','nox_inigo'),pay('Preparar alojamiento y comida sin juramento.',{'pan':3,'madera':6}),compare('Reconocer la cláusula de obediencia.', ['Contrato público: la ración se suspende si se retira el consentimiento.', 'La reserva de recipientes se presenta como condición de alojamiento.'],['La comida legitima cualquier condición','Retirar consentimiento puede hacerse sin perder comida','No hace falta alojamiento independiente'],1)],
 'F04':[obs('Leer el acta de AV 156 y las fuentes autorizadas.', 'El nacimiento eliminó explotadores y protegió cuidadores.', 'Los descendientes protegidos también vivieron pérdidas y cambios; el duelo no hereda culpa.'),ask('veterano','maestra'),compare('Conservar hechos y consentimiento.', ['La fuente histórica y el duelo familiar responden a preguntas distintas.'],['El nacimiento fue indiscriminado','La protección elimina todo duelo','El duelo posterior no cambia quién fue protegido'],2)],
 'P13':[visit('rosal_eterno'),ask('verdia_amaranta','verdia_isadora'),compare('Archivar dos memorias que no coinciden.', ['Amaranta recuerda una retirada antes de la campana.', 'Isadora recuerda la campana antes de salir del jardín.', 'Ambas autorizan conservar su versión, sin nombres de terceros.'],['Borrar la memoria minoritaria','Conservar ambas con origen y contexto','Elegir a quien tiene más amistad'],1)],
 'P14':[ask('senda_ofelia','senda_pablo',declines=('senda_ofelia',)),compare('Distinguir reparación y exigencia de perdón.', ['Ofelia aplaza y deja disponible un caso archivado equivalente.', 'Pablo ofrece restitución; su destinatario puede rechazar contacto.'],['El perdón es un recibo obligatorio','La responsabilidad permite reparación sin contacto forzado','Aplazar impide seguir la campaña'],1),seq('Resolver el caso autorizado respetando una negativa.', ['Identificar daño comprobado','Separar explicación y excusa','Ofrecer restitución','Aceptar aplazamiento','Conservar regreso'])],
 'P15':[ask('hilos_tecla','hilos_hector'),step('laberinto','Recorrer la Casa Fija, contrastar A y B y retirar permiso en R antes de salir por E.',mapa=maze,datos=['A y B son testimonios autorizados no idénticos.', 'R permite retirar tu autorización. El mapa queda disponible y el reinicio conserva materiales.'])],
 'P16':[ask('nox_dorian','nox_salma'),obs('Examinar el sello desde el perímetro autorizado.', 'El Conde está contenido; esta investigación no abre sus celdas.', 'Operario: exposición confirmada, zona de atención y relevo disponibles.'),seq('Ejecutar el protocolo de retirada y atención.', ['Aislar la herramienta','Retirar al operario a zona segura','Solicitar atención autorizada','Relevar el puesto','Registrar exposición sin abrir celdas'])],
 'F05':[obs('Consultar reparación y cierre persistente.', 'El tramo de agua reparado ya tiene devolución comprobada.', 'El depósito cerrado mantiene una restitución pendiente; hay un suministro alternativo limitado.'),compare('Separar reparación, restitución y perdón.', ['Una devolución no acredita perdón; la revisión protege a afectados actuales.'],['Una reparación obliga a perdonar','La restitución puede seguir pendiente con atención alternativa','Abrir da permiso de extracción ilimitada'],1),pay('Sostener la alternativa de capacidad equivalente.',{'madera':2,'piedra':2})],
 'P17':[inspect('nave','Comprobar nave construida, salida y espacio de carga.'),pay('Reservar combustible y energía para el ensayo orbital.',{'combustible_estelar':1,'bateria':1}),seq('Ensayar salida, contingencia y regreso.', ['Verificar aire','Declarar consumo y reserva','Confirmar puerto de retorno','Ensayar aborto','Volver a puerto'], ['Una batería se fabrica y paga; el diálogo no la recarga.'])],
 'P18':[obs('Medir luz del puesto de Aurelia.','Aurelia: luz constante; reserva sin cambios.',region='huerto_aurelia'),obs('Medir tránsito del puesto de Nocturna.','Nocturna: tránsito variable; usar referencia estable.',region='vigia_nocturna'),obs('Medir resonancia del puesto de Esmeralda.','Esmeralda: resonancia detectada en soporte, sin extracción.',region='cantera_esmeralda')],
 'P19':[ask('ambar_zora'),obs('Examinar la terraza con permiso.', 'La muestra permanece bajo custodia local.', 'La copia in situ requiere trabajo; el préstamo requiere devolución.'),dict(seq('Elegir y realizar el estudio autorizado.', ['Registrar origen','Acordar custodia','Tomar la medida autorizada','Devolver soporte','Confirmar conservación']),planes=['Copia in situ','Préstamo con devolución'],ordenAlternativo=['Registrar origen','Mantener soporte en su sitio','Copiar con permiso','Verificar copia','Confirmar conservación']),dict(wait(),cantidadAlternativa=2)],
 'P20':[ask('iris_calista'),compare('Separar representación y permiso de hábitat.', ['La asamblea recibe evidencia, pero una sola voz no representa a todos.', 'Dos posiciones de baliza conservan paso y refugio.'],['La baliza exige domesticar una criatura','Cualquiera de las dos posiciones seguras conserva el hábitat','La primera persona puede ceder todo el mundo'],1),pay('Instalar la baliza con materiales reales.',{'madera':2,'piedra':2})],
 'F06':[visit('huerto_aurelia','vigia_nocturna','cantera_esmeralda','ambarina','iridalia'),obs('Presentar reservas y permisos de los destinos.', 'Cada mundo conserva consentimiento, reserva y salida.', 'El acuerdo permite entrar a Confluencia; no exige culto ni donación de animales.'),seq('Formalizar una alianza revisable.', ['Declarar capacidades','Separar reserva y retorno','Conservar permisos de cada territorio','Declarar salida voluntaria','Abrir seguimiento común'])],
 'F11':[inspect('matriz','Confirmar los cuatro sellos independientes de retorno.'),pay('Fabricar la matriz con componentes de las rutas autorizadas.', {f'confluencia_{el}_mineral':1 for el in ['fuego','agua','tierra','aire']}),circuit('Conectar la matriz sin contar una misma reserva dos veces.')],
 'F12':[inspect('matriz','Verificar los cuatro sellos y la matriz terminada.'),seq('Aislar las cuatro amplificaciones antes de intervenir.', ['Aislar calor','Aislar humedad','Distribuir soporte','Mantener presión','Separar el retorno falseado'], ['La redistribución de Fuatia conserva equilibrio y los territorios.']),circuit('Desmontar el circuito de Forma Fija en la Cámara de los Núcleos.')],
 'P21':[ask('maestra','veterano','exploradora'),obs('Publicar capacidades, reservas y rutas de regreso.', 'Se conservan cuatro sellos; las reservas de cada territorio siguen siendo propias.', 'El consejo no exige amistad máxima con todos los habitantes.'),seq('Acordar obligaciones concretas y revisión.', ['Publicar capacidad disponible','Conservar reservas locales','Confirmar tres relevos','Registrar salida y apelación','Fijar revisión del pacto'])],
 'P22':[compare('Desactivar el primer nodo: contradicción.', ['La casa exige una memoria única.', 'Dos testigos autorizan recuerdos no idénticos.'],['Forzar coincidencia','Conservar la contradicción comprobada','Elegir el relato más cómodo'],1),seq('Desactivar el segundo nodo: retirada de autorización.', ['Consultar alcance del permiso','Solicitar retirar autorización','Aceptar la retirada','Desconectar registro no autorizado']),seq('Desactivar el tercer nodo: retorno voluntario.', ['Ofrecer dos salidas seguras','Aceptar la salida elegida','Conservar el ancla','Cerrar la prisión'])],
 'P23':[pay('Reservar soporte finito para los tres relevos.',{'madera':4,'piedra':4,'pan':2}),seq('Sostener el relevo de calor y evacuar su puesto.', ['Declarar reserva','Abrir retorno','Retirar operarios','Confirmar puesto seguro']),seq('Sostener el relevo de soporte sin usar minería como arma.', ['Distribuir carga','Señalar salida','Retirar operarios','Confirmar puesto seguro']),seq('Sostener el relevo de presión y cerrar el conducto.', ['Mantener presión','Abrir retorno','Retirar operarios','Cerrar conducto'])],
 'P24':[crop(),seq('Conservar el acta de cierre y seguir viviendo en la granja.', ['Confirmar semilla ordinaria','Conservar la parcela','Leer acta común','Elegir celebración o descanso'],region='pueblo_sol')],
}

for i,el in enumerate(['fuego','agua','tierra','aire'],7):
 region='confluencia_'+el
 steps[f'F{i:02}']=[
  obs('Inspeccionar autorización, suministro y retorno.', f'Territorio de {el}: reserva protegida y depósito autorizado.', 'El registro de Vael llama devolución al caudal que sigue reservado.'),
  pay('Procesar el componente local de cierre.',{region+'_mineral':2,region+'_madera':2}),
  seq('Calibrar el componente antes de instalarlo.', ['Verificar autorización','Medir suministro','Separar reserva','Comprobar componente']),
  dict(circuit('Cerrar el retorno falseado y conservar el retorno autorizado.'),destino=region,alternativa='combate'),
 ]

# Los IDs tienen que existir: una errata de actor no crea una persona nueva.
known=set(npcs)
# Nombres de producción conservados por el reparto, sin renombrar IDs para una misión.
aliases={}

compiled=[]
for q in main:
 region={'celia':'pueblo_sol','lunas':'estacion_celia','sangre/afueras':'vigilia','sangre/subsuelo':'piedralumbre','sangre/santuario':'vigilia','sangre/corte':'vigilia'}.get(q['zona'],q['zona'])
 qsteps=steps[q['id']]
 for i,s in enumerate(qsteps):
  s['id']=q['id']+'.'+str(i+1);s['region']=s['region'] or region
  s['punto']=({'x':75.5,'z':23.4} if s['region']=='pueblo_sol' else regiones.get(s['region'],{}).get('plano',{}).get('archivo',{'x':0,'z':22})) if s['tipo'] not in ['cultivar','cuidar','preguntar','visitar'] else None
  if q['id']=='P23' and s['tipo']=='secuencia': s['punto']={'x':[-12,0,12][i-1],'z':22}
  for person in s.get('participantes',[]):
   person['id']=aliases.get(person['id'],person['id'])
   assert person['id'] in known,person['id']
   if person['id']=='nox_inigo' and q['id'] in ['F03','P12']:
    person['comision']={'region':s['region'],'x':77.5 if s['region']=='pueblo_sol' else -4,'z':25 if s['region']=='pueblo_sol' else 17}
 compiled.append(dict(id=q['id'],titulo=q['titulo'],region=region,clase='principal',requiere=q['requiere'],reparto=q['reparto'],pasos=qsteps,decision=q['decision'],ramas=q['ramas_dialogo'],consecuencias=q['consecuencias']))
assert len(compiled)==36
(N/'jugabilidad/principales.json').write_text(json.dumps(compiled,ensure_ascii=False,indent=2)+'\n')
(W/'historia-datos.ts').write_text('// Generado por docs/narrativa/herramientas/compilar_jugabilidad.py.\nimport type {MisionHistoria} from "./historia-tipos";\nexport const MISIONES_HISTORIA:MisionHistoria[]='+json.dumps(compiled,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'misiones':len(compiled),'pasos':sum(len(q['pasos']) for q in compiled)}))
