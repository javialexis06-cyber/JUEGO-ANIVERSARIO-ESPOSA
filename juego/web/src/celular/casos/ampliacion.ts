// Expedientes 9–12: historias independientes. Las claves son datos del mundo; no se muestran ayudas ni se anotan pistas.
import type { Caso, Chat, Contacto, Foto, Nota, Correo, Pregunta } from '../tipos';
const contacto=(id:string,nombre:string,rol:string,color='#728c9d'):Contacto=>({id,nombre,rol,color});
const chat=(con:string,dia:string,lineas:[string,string,string][],extra:Partial<Chat>={}):Chat=>({con,...extra,mensajes:lineas.map(([de,t,texto],i)=>({de,t,texto,...(i===0?{dia}:{})}))});
const pregunta=(texto:string,opciones:string[],correcta:number,porque:string):Pregunta=>({texto,opciones,correcta,porque});
interface Expediente {
 id:string;n:number;titulo:string;lugar:string;mundo:string;nombre:string;edad:string;oficio:string;retrato:string;fondo:string;
 color:string;pin:string;privado:string;fecha:string;expediente:string[];hallazgo:string;contactos:Contacto[];chats:Chat[];
 notas:Nota[];fotos:Foto[];correo:Correo[];preguntas:Pregunta[];final:string[];cierre:string;
 lugares:[string,string,number,number][];
}
function caso(e:Expediente):Caso {
 const candado='archivo';
 return {
  id:e.id,n:e.n,titulo:e.titulo,lugar:e.lugar,mundo:e.mundo,persona:{nombre:e.nombre,edad:e.edad,oficio:e.oficio,foto:e.retrato},
  expediente:e.expediente,hallazgo:e.hallazgo,dueno:e.nombre,tutorial:false,
  telefono:{modelo:['Nube C-4','Hoja S-2','Archivo R-6','Trama L-3'][e.n-9],fondo:e.fondo,acento:e.color,oscuro:e.n%2===0,
   bateria:31+(e.n*7)%50,operador:'Red de Astra',hora:'09:24',fecha:e.fecha,carcasa:['robusto','flores','viejo','elegante'][e.n-9] as 'robusto'|'flores'|'viejo'|'elegante',
   avisos:[{app:'mensajes',titulo:e.contactos[0].nombre,texto:'Cuando puedas, escríbeme.',t:'08:42'},{app:'calendario',titulo:'Hoy',texto:'Revisar los pendientes de la semana',t:'08:00'}]},
  bloqueo:{id:'bloqueo',tipo:'pin',clave:e.pin,titulo:'Desbloquear teléfono',recordatorio:''},
  candados:[{id:candado,tipo:'palabra',clave:e.privado,titulo:'Archivo personal',recordatorio:''}],
  apps:['mensajes','fotos','notas','grabadora','llamadas','mapa','correo','calendario','linterna'],
  contactos:e.contactos,chats:e.chats,notas:e.notas,fotos:e.fotos,voces:[],correo:e.correo,
  llamadas:e.contactos.slice(0,3).map((c,i)=>({quien:c.id,dia:e.fecha,t:`08:${14+i*11}`,tipo:'perdida' as const})),
  mapa:{titulo:e.lugar,fondo:'#d9e3d4',trazos:[{tipo:'camino',d:'5,70 25,55 42,60 62,35 85,20'},{tipo:'agua',d:'5,90 25,86 50,92 80,80 98,85'}],
   lugares:e.lugares.map(([id,nombre,x,y])=>({id,nombre,x,y,icono:'pin'}))},
  calendario:[{dia:e.fecha,t:'17:00',texto:'Recoger la ropa'},{dia:'21 de Invierno · AV 311',t:'11:00',texto:'La cita del año pasado — terminada'}],
  pistas:[],ayudas:[],preguntas:e.preguntas,
  final:{titulo:e.titulo,paneles:e.final.map((texto,i)=>({foto:i===e.final.length-1?e.retrato:e.fondo,texto,mov:(['acerca','der','aleja'] as const)[i%3]})),cierre:e.cierre},
 };
}

export const CASO_CAMPANA=caso({
 id:'campana',n:9,titulo:'La campana de las seis',lugar:'Nieveclara',mundo:'Celia',nombre:'Dalia',edad:'34 años',oficio:'Reparadora de equipos de rescate',
 retrato:'c9_dalia',fondo:'c9_fondo',color:'#70a3c7',pin:'2714',privado:'canela',fecha:'18 de Invierno · AV 312',
 expediente:[
  'Dalia no volvió al taller después de llevar mantas a los refugios. Su hermano recibió «ya estoy en la plaza» a las seis, pero quienes cerraron el puesto no la vieron.',
  'El teléfono apareció en el banco del taller, junto a la tarjeta de su torno: inventario 2714. La mochila y las botas de nieve no están.',
  'Esta mañana encontraron una campana que sonaba en la subida. El parte inicial habla del refugio del Pino; en la copia del registro ese nombre está tachado y escrito encima.',
 ],hallazgo:'Banco de reparación del taller, junto a las fundas de radio',
 contactos:[contacto('hermano','Fabián','Hermano'),contacto('rescate','Mara','Coordinación de refugios'),contacto('reloj','Nereo','Relojero'),contacto('pan','Clara','Panadería')],
 chats:[
  chat('hermano','17 de Invierno · AV 312',[
   ['yo','07:02','¿Le diste de comer a Canela? La gata ya se roba el pan de la mesa.'],['hermano','07:04','Sí. También botó otra vez el florero.'],
   ['yo','07:05','El archivo de mis cuentas sigue con el nombre de esa bandida. No me lo vayas a cambiar.'],
   ['yo','16:10','Voy a salir con las mantas. Si te llega el aviso de la plaza, todavía no pongas el agua.'],['yo','18:00','Ya estoy en la plaza. Voy al taller.'],
   ['hermano','18:03','¿Por qué no contestas?'],['hermano','20:25','Fui a la plaza. Clara no te vio.']],{}),
  chat('rescate','17 de Invierno · AV 312',[
   ['rescate','09:15','El letrero del Pino se lo llevaron al refugio del Lago mientras pintan la pared. Los registros de hoy van por código, no por letrero.'],
   ['yo','09:19','Pino R-2, Lago R-4. Ya lo copié en la cinta de las mantas.'],['rescate','15:32','El paso alto queda cerrado desde las cinco. El corredor del lago se mantiene abierto.'],
   ['yo','16:12','Entonces llevo las mantas por abajo. Si se pone feo me quedo bajo techo.'],['rescate','19:04','La radio del R-4 no transmite; sí recibe. Lleven batería cuando suban.']]),
  chat('reloj','16 de Invierno · AV 312',[
   ['reloj','11:11','La campana de repuesto del R-4 tiene un retardo de veinte minutos en el reloj del poste. No ajusté la esfera; falta una pieza.'],
   ['yo','11:14','Lo anoté. El sonido no me sirve para calcular la hora de paso.'],['reloj','11:15','Exacto. El reloj del taller sí quedó bien.'],['yo','11:16','Te debo el pan del arreglo, no se me olvidó.']]),
  chat('pan','17 de Invierno · AV 312',[
   ['pan','14:20','¿Paso con pan al taller?'],['yo','14:22','Hoy no. Dejé los mensajes de las seis programados toda la semana y siempre me toca aclarar dónde voy.'],
   ['pan','14:25','Mejor los quita cuando cambie de ruta.'],['yo','14:26','Sí, de regreso lo hago.'],['pan','18:44','Cerré. Te guardé el pedido para mañana.']]),
 ],
 notas:[
  {id:'taller',titulo:'Taller — entregas',fecha:'17 de Invierno · AV 312',texto:'Mantas: R-4.\nBatería grande: pendiente, no cabe en el morral.\nLlevar cordón para campana.\nEl pedido de pan sigue sin pagar.'},
  {id:'cuenta',titulo:'Cuentas personales',fecha:'17 de Invierno · AV 312',candado:'archivo',texto:'17/Invierno 16:08 — Reprogramé entrega al R-4 por cierre de la parte alta. Dejé el aviso automático de la plaza tal cual.\nSi no vuelve la radio, campana de mano desde la puerta. No bajar por el hielo.'},
  {id:'compras',titulo:'Para el domingo',fecha:'12 de Invierno · AV 312',texto:'Jabón, un florero que Canela no pueda botar, pan. El florero de metal suena peor al caerse.'},
 ],
 fotos:[{id:'c9_mantas',archivo:'c9_fondo',fecha:'17 de Invierno · AV 312 · 15:55',pie:'Las dos mantas del R-4 listas junto a la puerta.'},{id:'c9_lista',archivo:'c9_documento',fecha:'17 de Invierno · AV 312 · 16:02',pie:'Copia del parte antes de salir.'}],
 correo:[{id:'c9_parte',de:'Coordinación de refugios',asunto:'Registro corregido',fecha:'18 de Invierno · AV 312 · 08:40',texto:'El vigilante escribió «Pino» por el letrero que vio. El sello de la puerta es R-4 y el contador registra apertura a las 17:42. La campana se oyó desde ese edificio. No consta salida posterior.'}],
 lugares:[['taller','Taller de Dalia',14,73],['plaza','Plaza',35,58],['pino','Pino · R-2',70,19],['lago','Lago · R-4',81,65]],
 preguntas:[
  pregunta('¿Qué demuestra el mensaje de las seis?',['Que Dalia volvió a la plaza','Que alguien robó el teléfono','Solo que se envió un aviso programado','Que la campana sonó a tiempo'],2,'Clara y el archivo personal confirman que los avisos estaban programados, no describían su ubicación.'),
  pregunta('¿En qué edificio hay que buscarla?',['En el taller','En el refugio del Pino R-2','En la panadería','En el refugio del Lago R-4'],3,'El código de las mantas, el sello de la puerta y la entrega reprogramada coinciden en R-4. El letrero prestado confundió el parte.'),
  pregunta('¿Cómo conviene acercarse?',['Por el paso alto cerrado','Por el corredor del lago, con una batería para la radio','Esperar el próximo mensaje automático','Seguir la hora del reloj del poste'],1,'El corredor inferior sigue abierto y la radio del R-4 recibe pero no transmite. El reloj del poste tiene un retraso conocido.'),
 ],final:['Mara toma el corredor del lago con una batería de repuesto. Desde el R-4 vuelve a sonar la campana de mano.','Dalia abre la puerta. Pasó la noche junto a la estufa después de que el hielo cerrara la bajada; escuchaba la radio, pero nadie podía oírla.','En el taller, Fabián sirve el pan que Clara guardó. Canela se queda dormida encima de las mantas.'],cierre:'Caso cerrado. Los refugios conservan sus códigos visibles y el letrero vuelve al edificio correcto.',
});

export const CASO_SEMILLAS=caso({
 id:'semillas',n:10,titulo:'La caja sin destinatario',lugar:'Brumaverde',mundo:'Celia',nombre:'Inés',edad:'29 años',oficio:'Catalogadora de semillas',
 retrato:'c10_ines',fondo:'c10_fondo',color:'#70a58c',pin:'4306',privado:'helecho',fecha:'9 de Verano · AV 312',
 expediente:['Inés salió con una caja que el almacén registró como enviada al norte. Nunca llegó al vivero y el mismo número aparece entregado en dos pueblos.','Su teléfono quedó sobre el mostrador con el carné de archivo 4306. La caja pequeña y el impermeable no están; las llaves siguen en el cajón.','La familia recuerda una discusión por un cobro y teme que se haya marchado. El archivo conserva recibos de varias temporadas mezclados en una sola carpeta.'],
 hallazgo:'Mostrador del archivo botánico, debajo de un impermeable seco',
 contactos:[contacto('prima','Elvira','Prima'),contacto('almacen','Jairo','Almacén'),contacto('vivero','Solana','Vivero del norte'),contacto('barca','Dimas','Barquero')],
 chats:[
  chat('prima','8 de Verano · AV 312',[
   ['prima','08:10','¿Otra vez la misma caja?'],['yo','08:12','La caja de madera sí. El envío no. Jairo las vuelve a usar y deja las etiquetas viejas.'],
   ['prima','08:13','¿Pudiste pagar lo de la reparación?'],['yo','08:15','Eso fue el verano pasado y quedó saldado. Mira el año del recibo, no solo el día.'],['yo','08:17','El helecho de mi ventana revivió. Le dejé su nombre a la carpeta privada por celebrarlo.']]),
  chat('almacen','8 de Verano · AV 312',[
   ['almacen','11:20','La caja 26 viajó al norte en AV 311. Hoy le puse cinta naranja para separarla de esa ruta.'],['yo','11:22','Son esquejes, no semillas secas. Si la dejamos cerrada hasta mañana se dañan.'],
   ['almacen','11:24','Me llegó el aviso de fumigación del almacén, hay que sacarla antes de las cuatro.'],['yo','11:27','La llevo a sombra. Déjame una carretilla limpia.'],['almacen','17:12','La carretilla está detrás del archivo; no apareció la caja.']]),
  chat('vivero','7 de Verano · AV 312',[
   ['vivero','15:09','No manden esos esquejes al norte. El puente de servicio sigue cerrado y no tengo refrigeración.'],['yo','15:12','¿El depósito del sotobosque conserva la llave exterior?'],['vivero','15:13','Sí. La puerta deja entrar por fuera; el pasador interior está desmontado. Lleva una cuña si vas.'],['yo','15:15','Anotado. Voy a buscar dónde dejé la cuña.']]),
  chat('barca','8 de Verano · AV 312',[
   ['barca','15:31','No pude esperarla en el muelle. El agua subió y quité la pasarela.'],['yo','15:34','Voy por el sendero de tierra a dejar la caja. No cruce por buscarme.'],['barca','18:06','¿Ya volvió? Vi la cinta naranja por la ventana del depósito. Pensé que estaba haciendo inventario.'],['barca','20:02','El farol sigue encendido. Mañana pregunto en el archivo.']]),
 ],
 notas:[{id:'archivo',titulo:'Registro de conservación',fecha:'8 de Verano · AV 312',candado:'archivo',texto:'15:26. Caja 26: esquejes de sombra. Destino provisional: depósito del sotobosque. Etiqueta nueva naranja; despegar la azul de AV 311.\nNo llevé la cuña: la encontré partida. Revisar el pasador antes de cerrar.'},
  {id:'ropa',titulo:'Lavado',fecha:'6 de Verano · AV 312',texto:'El impermeable seco es para Elvira. El mío está en la carretilla. Comprar jabón, no otro impermeable.'}],
 fotos:[{id:'c10_etiquetas',archivo:'c10_documento',fecha:'8 de Verano · AV 312 · 15:20',pie:'Las dos etiquetas siguen pegadas.'},{id:'c10_ventana',archivo:'c10_fondo',fecha:'8 de Verano · AV 312 · 15:40',pie:'Bajo techo, lejos de la fumigación.'}],
 correo:[{id:'c10_envio',de:'Archivo botánico',asunto:'Envío 26 — AV 311',fecha:'8 de Verano · AV 311',texto:'Entrega al vivero norte confirmada. Caja retornable, etiqueta azul.'},
  {id:'c10_revision',de:'Taller de herrajes',asunto:'Pasador interior pendiente',fecha:'6 de Verano · AV 312',texto:'El pasador del depósito del sotobosque aún no está instalado. La cerradura exterior cierra sola. Quedará pendiente hasta que baje el agua.'}],
 lugares:[['archivo','Archivo botánico',15,75],['norte','Vivero norte',80,18],['deposito','Depósito del sotobosque',69,67],['muelle','Muelle sin pasarela',36,45]],
 preguntas:[pregunta('¿Por qué aparece la caja entregada en el norte?',['Porque Inés llegó al norte','Porque el número y la etiqueta pertenecen a un envío de AV 311','Porque el barquero mintió','Porque el vivero cambió de nombre'],1,'Las fechas y los colores separan el envío viejo de la reutilización actual.'),
  pregunta('¿Dónde buscar a Inés?',['En casa de Elvira','En el vivero norte','En el depósito del sotobosque','En la barca'],2,'Su registro y el avistamiento de la cinta naranja apuntan al depósito de sombra.'),
  pregunta('¿Qué debe llevar el equipo?',['Un recibo de cobro','La llave exterior y herramientas para el pasador','Más etiquetas azules','Una caja vacía para esperar al puente'],1,'La puerta cierra por fuera y el mecanismo interior está desmontado. Inés anotó que no pudo llevar la cuña.')],
 final:['Jairo llega por tierra con la llave y un herrajero. El farol de la ventana sigue prendido.','Inés está dentro, cuidando los esquejes. El viento cerró la puerta cuando bajó a acomodar la caja y el teléfono se había quedado en el archivo.','Elvira le lleva comida. Esta vez la caja tiene una sola etiqueta y una fecha completa.'],cierre:'Caso cerrado. El depósito recibe un pasador nuevo; el archivo deja de identificar envíos solo por el número de la caja.',
});

export const CASO_ARCHIVO=caso({
 id:'archivo',n:11,titulo:'La página que faltaba',lugar:'Vigilia de Ceniza',mundo:'Celia',nombre:'Benicio',edad:'57 años',oficio:'Encuadernador',
 retrato:'c11_benicio',fondo:'c11_fondo',color:'#ba9662',pin:'1852',privado:'nogal',fecha:'23 de Otoño · AV 312',
 expediente:['Benicio debía entregar un libro restaurado en la biblioteca. Su firma aparece en el recibo de las cinco, pero la bibliotecaria asegura que quien llegó llevaba otro abrigo.','El teléfono apareció bajo la prensa del taller. Su carné de lector 1852 sirve de separador en una novela; el abrigo de lluvia está colgado.','La última búsqueda que la familia recuerda fue en el mercado. En su taller abundan papeles de clientes, borradores y mensajes a medio corregir.'],hallazgo:'Debajo de la prensa del taller de encuadernación',
 contactos:[contacto('hija','Celia','Hija'),contacto('biblioteca','Adela','Bibliotecaria'),contacto('aprendiz','Milo','Aprendiz'),contacto('carpintero','Omar','Carpintero')],
 chats:[chat('hija','22 de Otoño · AV 312',[
  ['hija','10:40','¿Va a descansar después de la entrega?'],['yo','10:42','Sí. Solo falta recuperar la página del índice. No la entregué con el libro porque estaba secando.'],['hija','10:44','La mesa de nogal sigue en mi casa.'],['yo','10:46','No me la cambie. Hasta a la carpeta de mis papeles le puse nogal por esa mesa.']]),
  chat('biblioteca','22 de Otoño · AV 312',[
   ['biblioteca','12:03','La colección pasó al depósito seco. La sala de abajo sigue con humedad.'],['yo','12:05','¿Se entra por el pasillo del patio?'],['biblioteca','12:08','Por ahí se va al depósito viejo. Para el seco, puerta lateral detrás de la escalera.'],['biblioteca','17:06','Recibido el libro. Falta la hoja del índice.'],['yo','17:07','La llevo después.']]),
  chat('aprendiz','22 de Otoño · AV 312',[
   ['aprendiz','15:10','¿Le entrego el libro a Adela?'],['yo','15:12','Sí. Firma tú como quien entrega; yo dejé el presupuesto firmado de antemano.'],['aprendiz','17:04','El recibo se pegó al papel del presupuesto y quedó su firma debajo. No lo noté hasta salir.'],['yo','17:07','La llevo después.'],['aprendiz','17:08','Ese mensaje era para Adela, maestro.'],['yo','17:10','Ya se lo reenvié. Salgo a buscar la hoja.']]),
  chat('carpintero','22 de Otoño · AV 312',[
   ['carpintero','14:01','Dejé la escalera de mano en el depósito seco. La puerta lateral tiene picaporte nuevo, se traba si la madera se hincha.'],['yo','14:03','La hoja del índice debe estar en el cajón de arriba. Yo subo, tranquilo.'],['carpintero','19:11','¿Encontró la hoja?'],['carpintero','20:18','Dejé la luz encendida de ese lado porque vi su gorra por el vidrio. Pensé que estaba con Adela.']])],
 notas:[{id:'encargo',titulo:'Restauración — pasos',fecha:'22 de Otoño · AV 312',candado:'archivo',texto:'Libro entregado por Milo. Índice: cajón superior del depósito seco, detrás de la escalera.\nEn el depósito viejo ya no queda papel limpio.\nLlevar gafas y regresar por el teléfono.'},{id:'mercado',titulo:'Encargos del mercado',fecha:'22 de Otoño · AV 311',texto:'Visita terminada. Comprar cera y regalarle a Celia el costurero de nogal.'}],
 fotos:[{id:'c11_recibo',archivo:'c11_documento',fecha:'22 de Otoño · AV 312 · 17:10',pie:'Milo mandó la copia del recibo.'},{id:'c11_archivo',archivo:'c11_fondo',fecha:'21 de Otoño · AV 312',pie:'Puerta del depósito seco, detrás de la escalera.'}],
 correo:[{id:'c11_catalogo',de:'Biblioteca de Vigilia',asunto:'Traslado por humedad',fecha:'20 de Otoño · AV 312',texto:'Los materiales de restauración y hojas sueltas pasan al depósito seco lateral. El depósito del patio queda clausurado. No usar sus rótulos antiguos como referencia.'}],
 lugares:[['taller','Taller',12,74],['biblioteca','Biblioteca',52,38],['seco','Depósito seco lateral',66,30],['viejo','Depósito viejo del patio',36,48]],
 preguntas:[pregunta('¿Quién llevó el libro a las cinco?',['Benicio','Omar','Milo, con el presupuesto ya firmado por Benicio','Adela'],2,'Milo explica el recibo pegado y Adela vio a alguien con otro abrigo. La firma no prueba la presencia de Benicio.'),
  pregunta('¿A qué lugar fue Benicio después?',['Al mercado del año anterior','Al depósito viejo del patio','Al depósito seco detrás de la escalera','A la casa de su hija'],2,'El traslado, el cajón del índice y la nota del encargo señalan el depósito lateral.'),
  pregunta('¿Qué explica que no pudiera avisar?',['Se llevó un teléfono sin batería','Dejó el teléfono en el taller y la puerta del depósito se trabó','La biblioteca no existe','La firma borró sus mensajes'],1,'El teléfono sigue bajo la prensa y Omar ya había advertido del picaporte.')],
 final:['Adela y Omar abren la puerta lateral, que cedió de tanto empujarla desde adentro.','Benicio aparece con la hoja del índice seca y una silla que usó para pasar la noche. Lo primero que pide son sus gafas.','Milo escribe un recibo nuevo. En «entregado por» firma con su propio nombre, despacio.'],cierre:'Caso cerrado. El depósito seco tiene un picaporte reparado y los recibos distinguen autor, presupuesto y persona que entrega.',
});

export const CASO_TEJEDORA=caso({
 id:'tejedora',n:12,titulo:'La ruta del hilo violeta',lugar:'Iridalia',mundo:'Celia',nombre:'Leonor',edad:'38 años',oficio:'Tejedora de señales',
 retrato:'c12_leonor',fondo:'c12_fondo',color:'#a385bc',pin:'6241',privado:'cometa',fecha:'14 de Primavera · AV 312',
 expediente:['Leonor llevaba un telar portátil a la feria. Su familia recibió una ubicación frente al teatro, pero al llegar solo estaban las cajas del montaje del día anterior.','El teléfono apareció en la caseta de acreditación, junto al pase de artesana 6241. El guardia lo recogió después del cambio de turno.','La última foto enviada muestra un hilo violeta. Algunos vecinos creen que siguió una señal del escenario y que todavía está dentro del teatro.'],hallazgo:'Caseta de acreditación de la feria',
 contactos:[contacto('socio','Ariel','Socio del taller'),contacto('montaje','Vera','Montaje de la feria'),contacto('telas','Nara','Telas'),contacto('guardia','Ivo','Guardia del mirador')],
 chats:[chat('socio','13 de Primavera · AV 312',[
  ['yo','07:15','La cometa quedó colgada en el taller. No es para vender, es la primera que hice con mi abuela.'],['socio','07:16','Dejé las cuentas privadas con ese nombre, como pediste.'],['yo','12:40','Te mando dónde dejé ayer las cajas, para que las recojas. No es donde voy a estar hoy.'],['yo','12:41','Ubicación guardada: teatro de la plaza — 12 de Primavera.'],['socio','17:35','Llegué al teatro. Tus cajas ya no están. ¿A qué puerta voy?']]),
  chat('montaje','13 de Primavera · AV 312',[
   ['montaje','08:10','La prueba del telar pasa al mirador cubierto. En el teatro ensayan y no podemos cortar la luz.'],['yo','08:13','¿El mirador de arriba, el de la caseta?'],['montaje','08:14','Ese. El tramo violeta termina allí; lo pusimos para el recorrido de carga.'],['yo','13:06','Dejo el teléfono cargando con el pase mientras subo el último bulto.'],['montaje','18:22','Pensé que bajabas con Ivo. Voy a preguntar.']]),
  chat('telas','13 de Primavera · AV 312',[
   ['telas','10:20','El violeta de la ruta no es una señal de auxilio. Es cinta de carga de la feria.'],['yo','10:22','La voy a guardar como muestra, se ve bonito bajo la lluvia.'],['telas','10:24','No mezcles la cuerda con el hilo del telar, que deja pelusa.'],['yo','10:27','Yo también paso el día diciéndole eso a la gente jajaja.']]),
  chat('guardia','13 de Primavera · AV 312',[
   ['guardia','11:05','Después de las dos el montacargas queda sin operador. El acceso peatonal sigue abierto hasta que bajemos la persiana.'],['yo','11:08','La caja grande me cabe por las escaleras, voy en dos viajes.'],['guardia','14:10','Me cambiaron el turno. El relevo me confirmó que estaba todo vacío.'],['guardia','19:25','El relevo contó los bultos, no revisó la sala de ensayo del mirador. Voy a pedir que suban.']])],
 notas:[{id:'patron',titulo:'Patrón del telar',fecha:'13 de Primavera · AV 312',candado:'archivo',texto:'Demostración en la sala de ensayo del mirador cubierto.\nVera me deja la llave de la sala, pero la persiana exterior la baja el guardia.\nQuedarme hasta terminar la tela; recordar avisar al relevo antes de que cierre.'},{id:'pago',titulo:'Por pagar',fecha:'10 de Primavera · AV 312',texto:'Dos conos de hilo, una taza, pasajes. El adelanto del telar ya entró; no volver a cobrarlo.'}],
 fotos:[{id:'c12_cinta',archivo:'c12_documento',fecha:'13 de Primavera · AV 312 · 12:50',pie:'El plano nuevo de montaje, con la ruta de carga.'},{id:'c12_mirador',archivo:'c12_fondo',fecha:'13 de Primavera · AV 312 · 11:40',pie:'La muestra tiene que ir bajo techo.'}],
 correo:[{id:'c12_horarios',de:'Coordinación de feria',asunto:'Cambio de turno — incidencia',fecha:'14 de Primavera · AV 312 · 08:12',texto:'El parte del relevo solo registra bultos en la plataforma. La sala interior no se revisó. La persiana del mirador se cerró a las 18:00 y no hay apertura posterior.'}],
 lugares:[['teatro','Teatro · ubicación antigua',15,75],['caseta','Caseta',38,59],['ruta','Ruta de carga violeta',62,38],['mirador','Mirador cubierto',85,20]],
 preguntas:[pregunta('¿Qué significa la ubicación frente al teatro?',['Que Leonor estaba allí a las 12:41','Es la ubicación del día anterior, enviada para recoger cajas','Una señal de auxilio','Un error del mapa de Astra'],1,'El mensaje explica que es un lugar guardado de ayer y la fecha de la ubicación lo confirma.'),
  pregunta('¿Qué hay que seguir para encontrarla?',['La música del teatro','La cinta violeta hacia la sala del mirador cubierto','La cometa del taller','El telar vendido'],1,'El cambio de montaje y la nota del patrón coinciden con la ruta de carga, que no es una señal mágica.'),
  pregunta('¿Por qué el relevo creyó que no quedaba nadie?',['Leonor le dio un nombre falso','Solo contó los bultos de la plataforma y no revisó la sala interior','No había ningún mirador','La familia cambió el reloj'],1,'El parte de incidencia y el mensaje de Ivo describen la revisión incompleta antes de cerrar.')],
 final:['Vera sube con el guardia de la mañana. Del otro lado de la persiana se oyen golpes con la lanzadera del telar.','Leonor pasó la noche en la sala interior, arropada con la tela de muestra. Se había quedado sin su teléfono y nadie revisó antes de cerrar.','En la feria, termina su demostración con un cartel nuevo: las salidas se comprueban mirando cada sala, no contando cajas.'],cierre:'Caso cerrado. La cometa se queda en el taller; el hilo violeta se convierte en una muestra de la feria, con su fecha escrita.',
});
