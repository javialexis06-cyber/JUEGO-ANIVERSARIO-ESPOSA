"""Fuente de autoría. No modifica ni importa partidas del juego."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
misiones = []
def m(id, titulo, zona, prev, reparto, acciones, premio, inicio, giro, cierre, decision='', consecuencias=''):
    misiones.append(dict(id=id,titulo=titulo,zona=zona,requiere=prev.split(),reparto=reparto.split(),acciones=acciones,premio=premio,inicio=inicio,giro=giro,cierre=cierre,decision=decision,consecuencias=consecuencias,estado='diseno_no_integrado'))
# Cada bloque incluye aceptación, hallazgo y cierre. Las escenas mayores están en 02-campana.md.
m('P01','La semilla que no despierta','pueblo_sol','','mercader botanica canalizadora_aura',
'Examinar un surco afectado; sembrar y regar un cultivo ordinario en otro surco; dormir hasta su crecimiento reglamentario; comparar muestras sin consumir una cosecha ajena. El segundo surco crece: la agricultura no está globalmente averiada.',
'conocimiento',
'mercader: No te vendí una promesa de cosecha, te vendí una semilla sana. Si falló, quiero saber por qué.\nbotanica: La raíz está viva. Lo que falta no es agua. Anotemos antes de ponerle nombre al miedo.',
'canalizadora_aura: Aura puede despertar una posibilidad; no puede obligarla a vivir. Aquí alguien está quitando las posibilidades.\nella: Entonces empezamos por este surco. Lo demás lo averiguamos caminando.',
'mercader: Reservaré una muestra y pagaré la reposición con mi fondo de garantía. No quiero cobrarte dos veces mi duda.\nel: Una muestra, dos cuadernos y ninguna sentencia todavía.')
m('P02','La carta sin campana','vigilia','P01','viajera vigilia_telmo canalizadora_lara',
'Recibir carta al dormir; contrastar sello con Telmo y visitar a Serena. Registrar hora agrícola de recepción; no exige sincronía entre celulares.',
'acceso',
'viajera: La bolsa volvió cerrada. Yo dejé una carta adentro y regresó otra, escrita con la misma tinta.\nvigilia_telmo: Es el sello de Valdemora. No puedo prometer que su dueño siga vivo.',
'canalizadora_lara: La campana no se ha roto. Hay algo entre la llamada y nosotros.\nel: ¿Y puedes entrar?\ncanalizadora_lara: Puedo sostener el regreso. Si abandono ese puesto, quizá nadie vuelva.',
'ella: Entonces nos enseñas a regresar antes de enseñarnos a pelear.\ncanalizadora_lara: Eso sí puedo hacerlo.')
m('P03','El oficio del regreso','pueblo_sol','P02','cuidadora veterinaria vigilia_azucena',
'Preparar comida y equipo del catálogo existente; realizar entrenamiento de extracción sin consumir animal propio; verificar ancla y espacio de retorno. La prueba registra simulación, no victoria de Sangre.',
'conocimiento',
'cuidadora: Un grifo no es una montura que dejas esperando mientras decides ser valiente.\nvigilia_azucena: Si lo llamas, te irás. Aunque te falte una piedra preciosa.',
'veterinaria: Nadie aprende a cuidarse a punta de hacerse daño. La prueba termina antes del combate.\nella: ¿Y si alguno no quiere seguir?\nvigilia_azucena: Regresan. La ruta no exige que se pongan de acuerdo con miedo.',
'el: Prefiero una mochila incompleta a una mesa con una silla vacía.\ncuidadora: Guarda esa frase para cuando aparezca el botín.')
m('P04','Las Afueras','sangre/afueras','P03','canalizadora_lara',
'Completar los lugares de Afueras y su puerta según las reglas de la Noche; rescatar al menos un prisionero por una acción real. No reemplazar retos actuales ni obligar a jugar sin caer para escuchar la historia.',
'trofeo',
'canalizadora_lara: Estos muertos no eligieron caminar. Alguien cerró el camino de descanso.\nella: ¿Se puede abrir sin destruir lo que fueron?',
'canalizadora_lara: Rompan el conducto, no el nombre. Las reliquias mantienen el desvío.\nel: Por eso la campana suena desde dos lados.',
'canalizadora_lara: Un alma encontró la salida. No vuelve a su cuerpo; vuelve a tener un camino.\nella: Que el diario diga su nombre, si ella quiere compartirlo.')
m('P05','Una grieta en el acta','pueblo_sol','P04','archivero veterano',
'Contrastar dos páginas donadas al archivo y entrevistar a Aurelio. La pista principal tiene copia accesible; ninguna donación coleccionable opcional bloquea el acto.',
'conocimiento',
'archivero: Esta página se guardó para cuando hubiera calma. La calma se convirtió en una excusa demasiado larga.\nveterano: Yo voté por ocultarla. No voy a fingir que solo obedecí.',
'ella: ¿Qué protegía el silencio?\nveterano: Al principio, una evacuación. Después, nuestra reputación.\narchivero: Publicar un acta no devuelve once años, pero cambia quién puede discutir la siguiente.',
'el: Dejaremos el original y una copia abierta.\nveterano: Y mi firma. No la borres para que el papel se vea limpio.',
'Publicar de inmediato o primero leer el acta en asamblea.','Ambas rutas publican el mismo contenido. Inmediato: Damián organiza preguntas individuales. Asamblea: Alma facilita una reunión. No se pierde amistad ni evidencia.')
m('P06','El fuego bajo la piedra','sangre/subsuelo','P05','minero brasa_idalia',
'Completar el Subsuelo de la Noche. Contrastar roca de Minas de Sangre con registro geológico de Darío, sin transferir mineral entre juegos. Recuperar prueba de un conducto de Vael.',
'trofeo',
'minero: La veta continúa bajo la frontera. La galería no. No conozco esa mina por haber bajado a la nuestra.\nbrasa_idalia: Si encuentran un nido, no confundan calor con salud.',
'el: Las paredes tienen números repetidos, como si la mina llevara una cuenta.\nbrasa_idalia: Vael cuenta lo que cree suyo. Un dragón no escribe así.',
'ella: El escudo no fue un regalo de tranquilidad. Fue un refugio después de una catástrofe.\nminero: Entonces hay que cuidar también la salida, no solo el techo.')
m('P07','Los tres manuscritos','celia','P06','bruma_elio brasa_idalia vigilia_azucena',
'Reunir tres testimonios de criaturas mediante arcos de cuidado. Ruta principal alternativa: los custodios prestan copias tras una prueba ordinaria de cuidado y protección de hábitat; criar las tres especies míticas es opcional, no un bloqueo de genética rara.',
'conocimiento',
'bruma_elio: Una cicatriz no es tierra sucia. El unicornio devuelve vida sin fingir que nunca pasó nada.\nbrasa_idalia: El dragón dejó reserva. Eso es lo que el manuscrito pide, no producir más fuego.',
'vigilia_azucena: El grifo bajó cuando alguien pidió ayuda. No cuando el guardián decidió que merecía rescate.\nella: Las tres historias hablan de límites.',
'el: Cuidar, reservar y preguntar. Suena pequeño para detener una estrella.\nbrasa_idalia: Por eso una estrella muerta no sabe hacerlo.')
m('P08','El Santuario roto','sangre/santuario','P07','canalizadora_aura canalizadora_lara',
'Completar Santuario y su puerta en la Noche; registrar rescates y altares destruidos desde el juego real. Conservar escena distinta de los ritos agrícolas.',
'acceso',
'canalizadora_aura: Ese coro sabe las palabras, pero no deja respirar entre ellas.\ncanalizadora_lara: Son ecos. No están escuchando a ninguna de nosotras.',
'ella: Aquí guardaron dioses como si fueran piezas de un altar.\ncanalizadora_aura: Vael construyó la forma. Nath le dio la ceniza para mantenerla.',
'el: No todos alcanzaron a pedir ayuda.\ncanalizadora_lara: Por eso contamos lo que encontramos sin inventar una victoria para quienes perdimos.')
m('P09','La copa del Conde','sangre/corte','P08','canalizadora_lara',
'Completar Corte según la Noche. Escena del Lazo y destino de Sangrevil usa el desenlace canónico existente. Una derrota permite reintentar; no altera la relación de la pareja.',
'trofeo',
'conde: Les ofrecí una ciudad donde nadie tuviera que despedirse.\nella: Les quitaste incluso la posibilidad de irse.',
'nathgora: Siempre habrá alguien dispuesto a comprar otra noche.\nel: Eso no te concede nuestras mañanas.\ncanalizadora_lara: Sangrevil, el miedo no fue tu delito. Hacer de otros tu prisión sí.',
'canalizadora_lara: El conducto está cerrado. Nox contendrá lo que elegiste convertirte.\nella: Volvamos. El peligro no terminó, pero hoy alguien puede descansar.')
m('P10','La mañana de los nombres','vigilia','P09','vigilia_noemi vigilia_aldan posadera',
'Registrar supervivientes con consentimiento y organizar provisiones ordinarias para un refugio. Los NPC refugiados de fondo no se agregan automáticamente al roster social. Reconstrucción diferida visible en correo.',
'conocimiento',
'vigilia_noemi: No les preguntes primero qué recuerdan de la Noche. Pregunta dónde quieren dormir.\npositiva: ',
'vigilia_aldan: Retirar una reja no me absuelve de haber cerrado otras. Necesito un procedimiento que puedan apelar.\nposadera: Tengo seis camas, no veinte promesas. Hagamos turnos y busquemos casas.',
'ella: La mañana no arregló la ciudad.\nel: Pero dejó de prohibir que la arreglen.',
'Priorizar residencia local o retorno voluntario.','Las plazas y el costo total son equivalentes; ninguna ruta fuerza a regresar a una ciudad destruida. Se habilitan dos cartas ambientales distintas.')
m('P11','Lo que la ceniza todavía quiere','pueblo_sol','P10','astronoma viajera',
'Comparar tres lecturas nocturnas en jornadas dormidas, sin esperar noches reales. Detectar patrón repetido en envíos, no enfermedad universal de cultivos.',
'conocimiento',
'astronoma: Una fisura cerrada deja una señal. Esta tiene ritmo. Alguien está buscando otro conducto.\nviajera: El mismo símbolo aparece en facturas de refugios.',
'el: ¿La Custodia paga por comida?\nviajera: Paga primero. Después cobra obediencia. No todo el que comió sabía el precio.',
'ella: Vamos a separar a quienes buscan refugio de quienes construyen la trampa.\nastronoma: Y a contrastar la hipótesis antes de bautizar otro enemigo.')
m('P12','Una mesa sin juramento','celia','P11','posadera canalizadora_aura nox_inigo',
'Reunir testimonios voluntarios de tres adultos y abrir alojamiento independiente. No obligar a denunciar como requisito de comida. Detectar almacén de recipientes corruptos mediante documentos.',
'acceso',
'nox_inigo: Repartí sus cartas. Nunca vi la ceniza; ese fue mi modo cómodo de no verla.\nposadera: Aquí comes antes de explicar por qué llegaste.',
'canalizadora_aura: No quiero reemplazar su juramento por uno a mi nombre.\nella: Entonces hacemos una salida que no tenga dueño.',
'nox_inigo: Entregaré mi ruta y responderé por lo que hice. No necesito que me llames inocente.\nel: Tampoco que te llames irrecuperable para no reparar nada.')
m('P13','Dos maneras de recordar','rosal_eterno','P12','verdia_isadora verdia_eneas eco_esteban',
'Visitar Verdia con permiso y ancla; obtener dos testimonios del panteón destruido, aceptando contradicción. Una memoria solo se archiva con consentimiento.',
'conocimiento',
'verdia_isadora: En mi recuerdo el puente era azul. En el suyo, no tenía baranda. Los dos lo cruzamos.\neco_esteban: Un archivo conserva voces; no las obliga a cantar al unísono.',
'ella: Vael necesita que la historia tenga una sola forma.\nverdia_eneas: Y aquí ni siquiera permanecer es obligatorio.',
'el: Nos llevamos permiso para contar, no personas para demostrar.\nverdia_isadora: Así se abre una memoria sin dejarla vacía.')
m('P14','La puerta que admite un no','travesia','P13','senda_iria senda_ofelia senda_pablo',
'Acompañar reparación de Ofelia y Pablo; resolver pruebas de responsabilidad sin falsificar testimonio. Ambas almas pueden aplazar; el jugador accede a una prueba archivada equivalente para seguir campaña.',
'conocimiento',
'senda_ofelia: Quiero una respuesta que me deje descansar sin pedirle nada a nadie.\nsenda_iria: Puedo acompañarte. No puedo convertir ese deseo en una prueba cumplida.',
'senda_pablo: Si digo que lo siento, ¿tiene que perdonarme?\nella: No. Lo que sí puedes hacer es dejar de exigirlo.',
'senda_iria: Esta puerta reconoce una elección. La copia de Vael reconoce una respuesta ensayada.\nel: Entonces el regreso no es la nota de un examen.')
m('P15','Una casa que no cambia','refugio_hilos','P14','hilos_tecla hilos_elian hilos_asha',
'Resolver laberinto con dos testimonios no idénticos y una negativa libre. Pistas persistentes, mapa accesible y reinicio sin pérdida de inventario reservado.',
'acceso',
'hilos_elian: Me ofrecieron el día antes del incendio. Al tercer regreso olvidé que había otros días.\nhilos_tecla: No busques la pared falsa. Busca la regla que necesita que tú no cambies.',
'vaelthor: He corregido su casa. No existe ya aquello que pueda herirlo.\nella: Tampoco aquello que todavía podría elegir.',
'hilos_asha: La salida aparece cuando dos relatos caben sin borrarse.\nhilos_elian: No recuerdo todo. Ya no voy a llamar fracaso a esa frase.')
m('P16','El límite de Nox','bastion_velo','P15','nox_dorian nox_mirta nox_salma',
'Consultar expediente de contención del Conde desde perímetro autorizado. Investigar un sello sin abrir celdas; tratar contaminación de operario por protocolo médico.',
'conocimiento',
'nox_dorian: La autorización permite revisar una grieta, no acercarse a una celda por curiosidad.\nnox_salma: Este hombre tiene ceniza en los pulmones. Eso no lo convierte en un condenado.',
'nox_mirta: El sello de Sangrevil contiene su transformación; nadie lo está usando para alimentar el escudo.\nel: Entonces el siguiente conducto no viene de su libertad.',
'ella: Nath busca otra autorización.\nnox_dorian: Y nosotros podemos defender el límite sin tratar a cada visitante como culpable.')
m('P17','Una órbita con reservas','estacion_celia','P16','orbita_helena orbita_boris orbita_rita',
'Preparar combustible, aire y carga desde cantidades disponibles; tutorial sin viaje irreversible. Ensayo permite volver a puerto. Ninguna batería se carga leyendo diálogo.',
'acceso',
'orbita_helena: El cielo es una ruta, no un permiso para saltarse la logística.\norbita_boris: Si esta columna baja de la reserva, la nave no sale.',
'el: ¿Y si la lectura de Nath no espera?\norbita_rita: Se manda una sonda. No se mandan personas con aire prestado.',
'ella: Quiero un manifiesto que también diga cuánto cuesta regresar.\norbita_helena: Ese es el único que voy a firmar.')
m('P18','Las tres lunas distintas','lunas','P17','aurelia_aitana nocturna_matea esmeralda_indira',
'Contrastar luz, tránsito y resonancia en tres puestos. Orden libre, recibos distintos, solo observación durante la campaña básica; extracción intensiva pertenece a secundarios.',
'conocimiento',
'aurelia_aitana: Aurelia favorece crecimiento. Más luz de la debida también quema.\nnocturna_matea: Nocturna orienta; no tenemos almas en depósitos.',
'esmeralda_indira: La resonancia de Esmeralda responde a intervalos, no a una demanda infinita.\nella: Tres funciones, no tres pilas para un arma.',
'el: La red de Vael imita las tres y no respeta ninguna.\nesmeralda_indira: Por eso su patrón deja una diferencia que podemos medir.')
m('P19','El precio de una terraza','ambarina','P18','ambar_zora ambar_kenzo ambar_alina',
'Negociar agua y estudiar terraza antigua; restitución de muestra o copia in situ a elección. No llevar reliquia sagrada por defecto a museo extranjero.',
'acceso',
'ambar_zora: La última expedición prometió lluvia. Nos dejó una factura de tuberías.\nambar_kenzo: Lo que necesitan está escrito en la terraza. No hace falta romperla.',
'ella: ¿Qué necesitarían ustedes para que este viaje también les sirva?\nambar_alina: Un balance de agua honesto y una copia que podamos usar, no agradecimientos.',
'el: El plano de Vael necesita un territorio que acepte ser recipiente.\nambar_zora: Entonces anota que aquí no recibió esa autorización.',
'Copiar en el lugar o estudiar préstamo supervisado.','Mismo dato principal y gasto de preparación equivalente. Préstamo exige devolución antes del cierre. Copia deja una jornada adicional de trabajo técnico.')
m('P20','Una voz no representa a todos','iridalia','P19','iris_calista iris_orin iris_edda',
'Presentar evidencia a asamblea y contrastar resonancia con un hábitat; elegir posición de baliza entre dos opciones seguras. No domesticar criatura para abrir puerta.',
'acceso',
'iris_calista: Puedo recibirlos. No puedo regalarles la decisión de todos.\niris_orin: Estos cristales recuerdan presión, no palabras. No les pidamos declarar culpables.',
'iris_edda: Si la baliza desplaza el nido, busquen otra posición. Una emergencia también tiene alternativas.\nel: Vael ofrece un plano que no nos deja negociar eso.',
'ella: Entonces presentamos dos lugares y sus costos.\niris_calista: Por primera vez me traen una propuesta que acepta perder una votación.')
m('P21','El pacto que se puede revisar','celia','P20','maestra veterano exploradora',
'Reunir representantes ya conocidos; publicar capacidades, reservas y retorno de cada ruta. Consejo con decisiones concretas y acta; no exige máxima amistad de todo el reparto.',
'conocimiento',
'maestra: Una regla que nadie puede entender tampoco la puede discutir.\nveterano: Quiero que mi relevo tenga acceso al acta que yo escondí.',
'exploradora: Las rutas tienen salidas alternativas. El tratado también debería tenerlas.\nella: Que incluya cómo retirarse, cómo volver y a quién reclamar.',
'el: No estamos jurando que nunca va a faltar nada.\nmaestra: Estamos acordando qué hacemos cuando falte.')
m('P22','La vasija abierta','refugio_hilos','P21','hilos_tecla brasa_sol canalizadora_aura',
'Desactivar tres nodos de prisión con prueba de contradicción, retiro de autorización y retorno voluntario. Secuencia guiada; ninguno exige combate exclusivo o todas las misiones secretas.',
'trofeo',
'vaelthor: Han construido una alianza que puede romperse. La mía no falla.\nbrasa_sol: Una taza sin abertura tampoco derrama. Sigue sin servir para beber.',
'hilos_tecla: Primer nodo: dos recuerdos. Segundo: permiso retirado. Tercero: una salida utilizada.\nella: No son defectos. Son personas.',
'vaelthor: Lo perdido no vuelve porque lo nombren.\nel: Lo sabemos. Por eso dejaremos de perder a quienes todavía pueden salir.')
m('P23','La estrella que no será nuestra casa','borde_astra','P22','canalizadora_aura canalizadora_lara',
'Sostener tres relevos de la red con reservas pactadas; rescatar operarios y cerrar conducto. Si una etapa falla, volver al puesto y reintentar sin repetir costos confirmados; final no convierte minería en arma de consumo infinito.',
'trofeo',
'nathgora: Ellos también prometieron ayudar. Cuando su estrella tenga hambre, descubrirán cuánto vale su pacto.\nella: Por eso el pacto tiene reservas y límites. No solo palabras.',
'aura: No puedo devolver tu estrella. Puedo negarte otra víctima.\nlara: Tu pérdida merece ser nombrada. Tu venganza no merece nuestro consentimiento.\nel: Este mundo puede cambiar. No te lo vamos a entregar para evitarlo.',
'nathgora: Volverán a necesitar una certeza.\nella: Y volveremos a pedir ayuda. No es lo mismo que pedir un dueño.')
m('P24','La parcela de mañana','pueblo_sol','P23','cuidadora mercader archivero canalizadora_lara',
'Volver a la granja; plantar una semilla ordinaria a elección y asistir o leer acta de cierre. Campaña terminada permite seguir jugando, repetir visitas y terminar secundarios sin nuevo apocalipsis recurrente.',
'conocimiento',
'archivero: ¿Cómo titulo la última página?\nel: Deja espacio. Hay gente que todavía no terminó su parte.',
'cuidadora: El agua sigue donde la dejaron. Alguien cuidó mientras ustedes cuidaban más lejos.\nmercader: Y esta semilla no es legendaria. No necesita serlo.',
'ella: ¿Mañana qué hacemos?\nel: Miramos si brotó.\nnarrador: El mundo no quedó terminado. Quedó abierto.',
'Celebración pública o noche tranquila.','Mismos desbloqueos y trofeo final. Pública: concierto de Lía y relatos voluntarios. Tranquila: visita corta, luz de casa y dos sillas. Puede verse la otra escena después sin duplicar premio.')
# Corregir una acotación de autor sin convertirla en hablante ficticio.
misiones[9]['inicio']='vigilia_noemi: No les preguntes primero qué recuerdan de la Noche. Pregunta dónde quieren dormir.\nposadera: Puedo recibirlos. Primero contemos camas, no heridas.'
ramas={
 'P05':[
  'archivero: La copia está abierta desde hoy. Habrá un horario para preguntas individuales.\nveterano: Mi declaración irá al lado; no encima de los testimonios.',
  'maestra: Leeré el acta antes de pedir opiniones. Nadie tendrá que responder hoy.\narchivero: Después de la asamblea quedará la misma copia pública.'],
 'P10':[
  'posadera: Estas plazas serán de residencia, no de espera obligatoria.\nvigilia_noemi: Registraremos atención sin preguntar cuándo piensa irse cada persona.',
  'vigilia_aldan: El retorno será voluntario y con destino confirmado.\nposadera: Quien cambie de opinión conservará una cama mientras buscamos otra opción.'],
 'P19':[
  'ambar_kenzo: La copia está terminada y ustedes conservarán otra.\nambar_zora: No saldrá ninguna pieza del lugar para que el informe parezca más importante.',
  'ambar_kenzo: El préstamo vuelve antes de cerrar el acuerdo. Aquí está la fecha.\nella: Lo devolveremos con el informe y con las preguntas que no resolvimos.'],
 'P24':[
  'musica: Hay sitio para bailar y para mirar sentados.\nartesana: El escenario se recoge mañana, dentro de mi jornada.\nel: Me gusta una fiesta que también sabe terminar.',
  'ella: Hoy quiero quedarme aquí, sin otra visita pendiente.\nel: Ponemos dos sillas y dejamos el cuaderno cerrado.\nnarrador: El silencio de aquella noche no se parecía a la quietud de Nath. Podían salir de él cuando quisieran.']}
for q in misiones:
    q['ramas_dialogo']=ramas.get(q['id'],[])
    q['recuperacion']='Guardar el último recibo confirmado; reintentar desde puesto seguro sin duplicar premios ni costos. Las pruebas de la Noche usan sus reglas de recuperación actuales.'
(ROOT/'datos/campana.json').write_text(json.dumps(misiones,ensure_ascii=False,indent=2)+'\n')
