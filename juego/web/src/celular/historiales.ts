// Historiales ficticios: vida cotidiana anterior a los sucesos de los expedientes.
// Las fechas distinguen planes viejos de los hechos actuales. Nada lleva indicadores de importancia.
import type { Caso, Chat, Contacto, Mensaje, Voz } from './tipos';

interface Vida {
  ano: number;
  vecinos: [string, string, string];
  grupos: [string, string];
  lugares: string[];
  comidas: string[];
  objetos: string[];
  oficio: string[][];
  /** Reutiliza solo notas cotidianas ya grabadas, con el mismo texto. No genera voces nuevas. */
  audioExistente?: boolean;
}

const VIDAS: Record<string, Vida> = {
 pacto: { ano:301, vecinos:['Inés · Costuras','Roque · Harina','Vera'], grupos:['La cocina de abajo','Patio de los Hornos'],
  lugares:['la pila del patio','el puesto de harina','el portón de servicio','la plaza de los Hornos'],
  comidas:['pan de anís','sopa de cebolla','arepas de maíz','tortas de miel'], objetos:['un delantal azul','una olla pequeña','dos cucharones','el canasto de ropa'], oficio:[
   ['Mañana cambiaron el reparto. La harina llega por la puerta del patio.','¿Y el muchacho que venía con la mula?','Se fue a ayudarle al hermano. Viene una señora con dos carretas.','Entonces bajo dos veces. Una sola no me cabe.','Pídale el canasto a Inés. Ya se lo remendé.','Listo, pero se lo devuelvo limpio esta vez.'],
   ['Se quemó el pan de la bandeja del fondo.','¿Otra vez la puerta del horno no cierra?','Sí cierra. Dejé la bandeja mientras buscaba sal. Culpa mía.','Guardemos los que sirven para la sopa.','Los de arriba salieron bonitos, esos son para vender.','Y los feos para nosotros jajaja.'],
   ['Me dijeron que andaba alguien perdido por los Hornos.','Era un vendedor buscando la casa de Roque. Ya lo encontraron.','Yo ya estaba pensando cualquier cosa.','No todo el que no llega a comer está desaparecido, Marce.','Díselo a mi mamá. Si tardo diez minutos manda a buscarme.','La mía hace lo mismo y vivo cruzando la calle.'],
   ['El mantel largo no aparece.','Está secando detrás de la cocina. No lo doblen húmedo.','El de flores apareció en el cuarto de escobas.','Ese es mío. Lo llevé para tapar el pan.','Me había asustado con la mancha roja.','Es mora. Lo de siempre: prometí no comer encima y comí encima.'],
  ] },
 faro: { ano:312, vecinos:['Mila · Redes','Alonso · Remiendos','Ofelia'], grupos:['Los del muelle','Intercambios del puerto'],
  lugares:['el puesto de hielo','el muelle pequeño','la tienda de redes','la fila de la lonja'],
  comidas:['caldo de bagre','arroz con coco','bollo de maíz','pescado asado'], objetos:['un remo corto','la lona verde','un balde con tapa','un rollo de cuerda'], oficio:[
   ['Le dejé la red al pie del banco.','¿La del hueco grande?','Sí. Pero ya lo cosí. El hueco ahora está en el bolsillo mío.','Pase por pescado mañana y quedamos a paz.','No me pague con las espinas como la otra vez.','Esas eran para el caldo, desagradecido.'],
   ['El bote rojo volvió sin el muchacho.','Está conmigo. Se bajó en el otro muelle para comprar hielo.','Avise en el grupo que ya estaban alarmando.','Ya escribí. El bote se lo llevó el hermano.','Voy a borrar lo que mandé.','No borre: aclare. Después creen que uno esconde cosas.'],
   ['La lámpara del patio se apaga con el viento.','No es el viento. El conector está flojo.','¿Entonces no compro bombillo?','No compre nada. Llevo la herramienta cuando baje.','Le guardo sopa.','Con eso me paga. Y deje de amarrar cables con hilo de pescar.'],
   ['Al final la comida no es en la playa.','¿Y los que ya salieron?','Les escribió Mila. Va a llover, nos vemos en la fonda.','Yo llevaba una mesa en la carreta.','Guárdela. La fonda sí tiene mesas jajaja.','Me río para no hacer el viaje de vuelta bravo.'],
  ] },
 cota: { ano:312, vecinos:['Nelia · Arreglos','Rubén · Taller','Tania'], grupos:['Turno de la mañana','La cuadra de arriba'],
  lugares:['el taller de ruedas','la tienda de cascos','el patio del comedor','la subida del mercado'],
  comidas:['arroz de olla','aguapanela','pan de queso','sopa de verduras'], objetos:['la chaqueta gris','un termo grande','unas botas viejas','la caja de herramientas'], oficio:[
   ['La lámpara que me devolvió no es la mía.','La suya tiene una raya blanca, ¿cierto?','Dos rayas. La de una es de Rubén.','Entonces se cambiaron las etiquetas al lavarlas.','Ya encontré la mía en el taller.','No la cargue con el cable doblado, por favor.'],
   ['¿Es verdad que cerraron toda la mina?','Cerraron el comedor por la gotera. La mina sigue igual.','En el grupo escribieron «cerrado hasta mañana».','Porque mandaron el aviso sin el encabezado.','Voy a poner el aviso completo.','Gracias. Yo ya estaba empacando para descansar jajaja.'],
   ['Las botas nuevas me están matando.','Le dije que no las estrenara en turno largo.','Me quedaron buenas en la tienda.','En la tienda uno camina tres pasos.','¿Le cambio las plantillas por las viejas?','Primero seque las dos. No mezcle pares húmedos.'],
   ['El carro hizo tres golpes al bajar.','El carro, no el techo. Una rueda tiene un plano.','Sí, lo revisamos entre dos. No salió al turno.','Perfecto. Déjelo marcado con la cinta naranja.','Anotado en el taller, no en producción.','Eso. Que luego confunden mantenimiento con un hallazgo.'],
  ] },
 eco: { ano:312, vecinos:['Lina · Cintas','Bruno · Atriles','Elia'], grupos:['Ensayo de los jueves','Intercambio de cuadernos'],
  lugares:['el patio de ensayo','la mesa de las cintas','el sendero de las flores','el salón pequeño'],
  comidas:['galletas de avena','pan con miel','té de frutas','buñuelos pequeños'], objetos:['la carpeta amarilla','el atril plegable','una bufanda violeta','mi cuaderno rayado'], oficio:[
   ['El ensayo cambió de salón.','¿El grande?','El pequeño. El grande quedó ocupado con los atriles.','Entonces llevo menos sillas.','Lleva las mismas: nos toca apretarnos.','Canto mejor si no me clavan una silla en la espalda.'],
   ['Me mandaste el mismo verso dos veces.','Es que le cambié una palabra y no se nota.','¿Cuál?','En el segundo dice «vuelve». En el primero decía «vuela».','Ah ya. Pensé que era error del teléfono.','Todavía no lo copien en limpio. No me convence.'],
   ['Se perdió la carpeta de las voces.','La tengo yo. Me la entregaron ayer para ponerle cinta.','Ay, ya estábamos buscando por todo el salón.','Le puse nombre en la tapa. No era una señal del universo.','Jajaja voy a avisar.','Y guárdenla en el cajón, que encima del atril se cae.'],
   ['Ya pude hacer la nota larga sin quedarme sin aire.','¿Tomaste agua antes de empezar?','Sí. Y dejé de querer ganarle al de al lado.','Eso era. No es una competencia.','Pero si él aguanta cuatro tiempos yo también quiero.','Ensaye tranquila. La canción no se va a ir.'],
  ] },
 nocturna: { ano:312, vecinos:['Violeta · Taller óptico','Darío · Cargas','Ágata'], grupos:['Los del turno nocturno','Club de observación'],
  lugares:['el taller de lentes','la sala de descanso','el depósito de baterías','la terraza de observación'],
  comidas:['pan de semillas','chocolate caliente','galletas de sal','sopa de cebada'], objetos:['el estuche de lentes','la manta verde','un termo azul','el cuaderno de tapas negras'], oficio:[
   ['El punto de la foto se mueve.','Lo de ayer era un reflejo en el vidrio.','Esta vez limpié el lente antes.','Igual aparece cuando prende la luz del pasillo.','Tiene razón. Apagué la lámpara y desapareció.','Guarde las dos fotos. Sirven para que no volvamos a discutir lo mismo.'],
   ['¿Quién quedó con la batería de repuesto?','La devolví cargada a la caja de la sala.','Hay tres y ninguna tiene etiqueta.','La mía tiene un golpe junto al asa.','Encontrada. Estaba con los cables de fotografía.','Cada turno cambia todo de sitio y luego nadie fue.'],
   ['Al final no hacemos observación mañana.','¿Cambió el cielo?','Cambió el turno de Darío. No tenemos quién lleve las cajas.','Entonces dejo el lente guardado.','Pero la comida sí. A esa hora comemos todos.','Ah bueno. A mí lo que me preocupaba era perder el pan.'],
   ['Me están preguntando por el número raro del cuaderno.','Es el lote del vidrio que encargamos.','Pensaron que era una coordenada.','No: lo que está al lado de «anticipo» es la cuenta del taller.','Voy a separar las hojas de compras de las de observación.','Por fin. Hay una receta de sopa entre dos dibujos del cielo.'],
  ] },
 ambarina: { ano:312, vecinos:['Nadira · Remiendos','Tomás · Carretas','Leda'], grupos:['Relevos de las terrazas','Intercambios de la plaza'],
  lugares:['la fila del molino','el taller de ejes','la plaza de sombra','el puesto de telas'],
  comidas:['pan de dátiles','arroz con lentejas','té de menta','tortas de sésamo'], objetos:['la lona naranja','un saco vacío','mi taza de barro','el sombrero de ala corta'], oficio:[
   ['El barril pequeño llegó vacío.','Ese era el de devolver, el lleno va marcado por debajo.','No vi la marca porque lo dejé apoyado.','No lo llene otra vez sin pesarlo.','Ya pesé los dos y el recibo estaba bien.','Guarde el papel. La semana pasada reclamaron dos veces el mismo reparto.'],
   ['Hoy la fila empieza al otro lado de la plaza.','¿Volvieron a cambiar la ruta?','La fila de las telas. La suya está igual.','Me asusté. Ya había cargado el carro.','No todo lo que escribo es sobre el trabajo, Simón.','Culpa mía. Llevo mirando recibos desde que me levanté.'],
   ['Tu mula se soltó y está bajo el toldo.','¿Se llevó el carro?','No, anda buscando las cáscaras.','Voy por ella. No le dé pan.','Llegó sola. Me miró como si yo fuera el visitante.','Es su barrio más que el mío jajaja.'],
   ['Me dijeron que abría un pozo nuevo.','Era el nombre de la venta de cachivaches: «El Pozo Nuevo».','Yo ya estaba preguntando cuántos litros.','La gente promete mucho por vender una olla.','Voy por la olla de todas formas.','Mírela bien. Tiene un asa cambiada.'],
  ] },
 iridalia: { ano:312, vecinos:['Nara · Telas','León · Atriles','Otilia'], grupos:['Taller de los sábados','Intercambios de la loma'],
  lugares:['el taller de cintas','la plaza del mercado','el salón de práctica','la mesa de tejidos'],
  comidas:['pan de almendra','galletas de canela','infusión de flores','tortas de fruta'], objetos:['el pañuelo verde','mi bolso de tela','las pinzas pequeñas','la caja de cintas'], oficio:[
   ['La tela que llegó cambia de color con la luz.','¿En sombra sigue siendo azul?','Sí. Bajo la lámpara sale violeta.','La necesito para que se vea desde lejos, no para esconderla.','Le llevo una muestra a la plaza.','Escríbeme cuando llegues. No me llames.'],
   ['Te mandé una nota de voz sin querer.','Estoy esperando que aparezca el texto.','Dice que el ensayo pasó al salón pequeño. Nada urgente.','Gracias. A la máquina le salió «salón primero».','Lo escribo en el grupo también.','Mejor. A cada teléfono le inventa algo distinto.'],
   ['El atril vibra cuando apoyo la mano.','Tenía un tornillo suelto. Ya lo apreté.','Pensé que el piso se estaba moviendo.','Probé los otros tres y están bien.','Deje este al lado de la ventana para reconocerlo.','Le puse una cinta. No moví lo que usted había marcado.'],
   ['Puse el aviso de la reunión con letra grande.','¿Y el fondo?','Blanco. El primero quedó amarillo y no se leía.','Listo. El color solo no sirve para decir a qué hora empieza.','Ahora tiene hora y lugar escritos.','Así sí. Mándalo completo, sin recortar la parte de abajo.'],
  ] },
 estacion: { ano:312, vecinos:['Aina · Costuras','Nicolás · Taller','Berta'], grupos:['Comedor del segundo turno','Objetos prestados'],
  lugares:['el módulo del comedor','la mesa de paquetes','el taller de cascos','la sala de descanso'],
  comidas:['ajiaco','pan de maíz','lentejas','galletas de panela'], objetos:['la toalla azul','el bolso de viaje','el vaso con tapa','mi suéter viejo'], oficio:[
   ['El paquete de vacaciones llegó a otro casillero.','¿No le pusieron nombre?','Le pusieron «técnico». Muy específico todo.','Debe estar junto al de repuestos.','Sí, aquí está. Traje una bufanda para el día que bajemos.','Guárdela lejos de los filtros: la otra quedó oliendo a taller.'],
   ['La bitácora del comedor dice que ya entregaron el pan.','La escribió el del turno anterior antes de terminar.','Entonces no firmo hasta que lo vea.','Exacto. Yo tampoco recibí el termo que aparece ahí.','Voy a dejar la hora real en otro renglón.','Eso. Después nos toca buscar un pan que nunca llegó.'],
   ['Se apagó el panel del pasillo.','Lo desconectamos para limpiar el polvo. Ya quedó.','Pensé que era otra falla de toda la estación.','Leíste el aviso de ayer. El de hoy está encima.','Me aparecen al revés en el chat.','Mire la fecha. No siempre lo último que reenvían es lo más nuevo.'],
   ['El bolso rojo que bajó no era el suyo.','Menos mal. Yo todavía tengo turno.','Era de Nicolás. Bajó el equipaje por adelantado.','Avísele a mi mamá, que ya dijo que se me perdió el transporte.','Ya le escribí. Le guardó comida de todas formas.','Que la congele. Me conoce desde que nací y todavía cocina para veinte.'],
  ] },
};

// Escenas de barrio que vuelven a temas cotidianos: arreglos, entregas, comidas, recibos, malentendidos y planes.
// Se combinan con objetos, lugares y secuencias propias de cada teléfono; no imitan conversaciones privadas.
const COTIDIANAS: string[][] = [
 ['¿Todavía tienes {objeto}?','Sí, lo dejé en {lugar}.','Pasé y no había nadie.','Llegué tarde. Te lo llevo después de comer.','No corras, lo necesito mañana.','Entonces mañana temprano. Me recuerdas si no aparezco.'],
 ['Hice {comida}. Si pasa cerca le guardo.','¿Todavía está caliente?','Si deja de preguntar y viene, sí.','Ya salí. No me sirva tanto.','Siempre dice lo mismo y repite.','Porque usted cocina poquito jajaja.'],
 ['La reunión era hoy o mañana?','Mañana. Lo de hoy es para recoger las sillas.','Ah. Yo ya estaba cambiándome.','No se arregle tanto para cargar sillas.','Ahora voy elegante a cargar sillas.','Mande foto para creerle.'],
 ['No encuentre el recibo que le mandé. Me equivoqué.','Ya lo había copiado.','Ese era el del pedido anterior. El suyo lo dejé con {persona}.','Entonces borro el que anoté.','Sí, el nuevo tiene incluida la entrega.','Listo. Ya me parecía que estaba cobrando dos veces.'],
 ['¿Oyó ese golpe de anoche?','Era una puerta. Se soltó el pasador con el viento.','Yo pensando en qué se estaba cayendo.','Hoy amaneció la ropa toda regada.','Le presto cuerda si necesita.','Gracias. Y pinzas, que se perdieron más que medias.'],
 ['Le guardaron puesto en {lugar}.','No alcanzo, salí tarde.','¿Lo cedo?','Sí. No haga esperar a nadie.','Listo, ya le avisé a {persona}.','Gracias. La próxima invito {comida}.'],
 ['Apareció {objeto}. Estaba bajo el banco.','Yo había revisado ahí.','Lo tenía tapado una chaqueta.','Entonces no revisé muy bien que digamos.','Ya le puse su nombre en un papel.','No lo pegue encima de la mancha, que después lo arranco todo.'],
 ['¿Me compra hilo si sale?','¿Del blanco?','Blanco no, el de la muestra que le dejé.','Yo veo eso blanco.','Es crema. Si no está seguro no compre.','Voy a llevar la muestra y dejar que me regañen allá.'],
 ['Alguien mandó una bolsa para su casa.','¿Quién?','No dijo. Tiene {comida} y una cuchara.','Ah, es mía. La dejé cuando fui a ayudar.','Pensé que era un regalo misterioso.','El misterio era por qué no encontraba mi cuchara.'],
 ['No haga el viaje. Hoy no abren.','Estoy en {lugar} ya.','Ay, lo mandé muy tarde.','No importa, compré {comida}.','Siempre le encuentra lo bueno.','Es eso o devolverme bravo con hambre.'],
 ['La cuenta quedó saldada. Le debo solo el favor.','¿Seguro? Yo anoté que faltaba la entrega.','La entrega la hizo {persona}, no la cobraron.','Voy a tachar mi papel entonces.','Guárdelo por si vuelven a preguntar.','Eso me pasa por anotar en tres sitios.'],
 ['Me llegó la foto al revés.','Es que la tomé de cabeza.','No, también tiene el texto de otro pedido.','Le reenvié la vieja. Espere.','Ya no sé cuál mirar.','La que dice «esta sí». Y ahora sí es.'],
 ['¿Mañana llueve?','No sé. El aviso que compartieron es del año pasado.','Lo mandaron como si acabara de salir.','Mire abajo: todavía nombra la feria de antes.','Jajaja y yo guardando los zapatos.','Guárdelos igual, tiene un hueco la suela.'],
 ['La llave no gira.','Empuje la puerta un poquito hacia arriba.','Ya. ¿Siempre está así?','Cuando llueve se hincha la madera.','Voy a dejar aviso para el que venga después.','Deje el papel por dentro. Por fuera se lo lleva el viento.'],
 ['¿Le suena este número?','Parece la cuenta del pedido.','Era el turno para el arreglo. Menos mal pregunté.','Yo ya iba a sumarlo a lo que debía.','No le invente deudas al bolsillo.','El bolsillo las inventa solo.'],
 ['Se fue {persona} antes de que llegara.','¿Se llevó {objeto}?','No. Está en la mesa.','Entonces paso más tarde.','Cierre la ventana si entra.','Y le dejo {comida} para que no diga que solo pido favores.'],
 ['Terminé el remiendo. No quedó igualito.','Con que no se vuelva a abrir me sirve.','Va a aguantar. Lo probé con peso.','¿Cuánto le debo?','Después cuadramos. Hoy se me quedó el cuaderno.','Anótelo cuando llegue, que luego se le olvida cobrar.'],
 ['¿Puede bajar la música un poquito?','Ay, pensé que no se oía para afuera.','Se oye la misma canción desde el desayuno.','Se quedó repitiendo. Ya lo apagué.','Gracias. La voy a terminar cantando dormido.','Si me la canta bien le presto el disco.'],
 ['La foto no salió. Está todo oscuro.','Le puse el dedo al lente sin querer.','Yo tratando de adivinar qué era.','Era {objeto}. Le mando otra cuando vuelva.','No hace falta, ya se lo trajo {persona}.','Tan eficiente todo el mundo menos yo.'],
 ['Lleve una taza. Acá no alcanzan.','Llevo dos.','Dos no, que no hay dónde poner todo.','Bueno, una y {comida}.','Eso sí lo recibimos.','Hay prioridades claras en este grupo.'],
 ['¿Quién pidió {objeto}?','Yo, pero era para el otro día.','Ya llegó.','Entonces lo guardo hasta que pueda usarlo.','No lo deje en {lugar}, que lo prestan.','Le pongo un letrero que diga «ni se les ocurra».'],
 ['No era una cita de trabajo. Era la comida.','Yo llegué con el cuaderno.','Por eso nos miró como si faltara alguien.','Pensé que faltaba quien iba a explicar.','Faltaba quien trajera {comida}.','Ese era yo también. Qué comienzo tan bueno.'],
 ['¿Reenvía el horario completo?','Ya se lo mandé ayer.','Me llegó solo la mitad. No se ve la fecha.','Espere que lo busco.','Sin afán. Estoy ordenando los papeles.','Enviado. Ese sí es el de esta semana.'],
 ['Mi mensaje de antes sonó bravo. No era la idea.','Lo leí corriendo. Pensé que había hecho algo.','Era por el pedido, no por usted.','Ah. A veces uno lee todo con la voz que no es.','Sí. Después hablamos tranquilos.','Listo. Yo llevo {comida}.'],
 ['Se quedó una taza en {lugar}.','Si es azul no es mía.','La mía es azul y está acá.','Entonces apareció una taza sin dueño.','Déjela con {persona}, alguien va a preguntar.','Así empiezan las colecciones de cosas que nadie recoge.'],
 ['¿Me presta {objeto} hasta el descanso?','Sí, pero me hace falta después.','Se lo devuelvo antes de comer.','Con que vuelva entero me sirve.','Le tomo foto para acordarme de cómo iba.','No hace falta foto, hace falta que no se le olvide.'],
 ['El sobre tiene escrito martes.','Lo escribí la semana pasada. Es para hoy.','Yo estaba esperando hasta el martes.','No, no. Lo de hoy sí se recoge en {lugar}.','Voy saliendo entonces.','Gracias, que llevaba todo el día preguntándome por qué no llegaba.'],
 ['Voy a vender {objeto}.','¿No le hacía falta?','Me regalaron uno mejor.','¿Cuánto pide?','Lo que costó el arreglo, para no perderlo todo.','Le pregunto a {persona}. No me lo aparte todavía.'],
 ['¿Quién anda poniendo cajas en la entrada?','Las puse yo. Son de la colecta.','No se puede pasar con el canasto.','Ya las corro. No me di cuenta.','La colecta bien, pero no nos deje adentro jajaja.','Ahí quedó libre. Me gané el regaño del día.'],
 ['Probé la receta que me mandó.','¿Y?','Me quedó para pegar ladrillos.','¿Le puso agua?','La cantidad que decía el papel.','El papel era por taza, no por olla. Mañana le ayudo.'],
 ['Encontré una moneda en el bolsillo de {objeto}.','¿Dónde le va a encontrar bolsillo a eso?','En la funda, no en eso. Me entiende.','Ah. Déjela ahí por si alguien vuelve.','Si no aparece nadie la usamos para {comida}.','El fondo de emergencias más pequeño de la cuadra.'],
 ['Están buscando quien reciba un paquete en {lugar}.','Hoy puedo yo.','No necesita firmar, solo que no se moje.','Lo dejo con {persona} cuando llegue.','Dígale que es el paquete sin cinta.','Anotado. Sin cinta. No el otro.'],
 ['¿Por qué me mandó un punto?','Tenía el teléfono en la mano y se me fue.','Pensé que era algo urgente.','No. Si fuera urgente escribo completo.','Listo, siga durmiendo.','No estaba durmiendo. Bueno sí.'],
 ['El canasto llegó con una mancha.','Es de {comida}. No es nada raro.','Yo lo lavé y no salió.','Déjelo remojando. No le eche más jabón.','Va a quedar como nuevo o sin color.','Con que quede sin olor es ganancia.'],
 ['Nos vemos en {lugar} a la salida.','¿A cuál salida? Hoy termino tarde.','La suya. Yo tengo que recoger {objeto}.','Entonces sí. Le escribo cuando vaya.','Si no contesto estoy haciendo la fila.','Le guardo el puesto si llego primero.'],
 ['¿Le puedo devolver la plata en dos partes?','Claro. Tampoco me hace falta hoy.','La mitad mañana y el resto cuando entreguen el encargo.','Como le quede cómodo.','Gracias. No quería quedarme sin decir nada.','Con hablar basta. Después cuadramos el papel.'],
 ['Hoy amaneció una mata en el patio.','La puse yo. Me sobraba la maceta.','Pensé que la habían dejado de regalo.','Pues si la cuida se la regalo.','¿Cuánta agua?','Poquita. Lo de ayer casi se vuelve una sopa.'],
 ['Me cambió la hora del teléfono.','¿Se quedó sin batería?','Sí. Lo cargué y apareció otra fecha.','No cambie los mensajes. Solo ajuste el reloj.','Listo. El aviso raro que mandé era por eso.','Ya me había extrañado que saludara en la madrugada.'],
 ['Se llenó el cajón de bolsas.','Yo siempre traigo una por si acaso.','Ya tenemos como para mudar toda la cuadra.','Entonces mañana no compro otra.','Eso dijo la vez pasada.','Guárdeme una en {lugar}, así no se me olvida llevarla.'],
 ['¿El encargo era grande o pequeño?','Pequeño. Cabe junto a {objeto}.','Entonces sí lo puedo llevar.','No lo deje al sol.','Voy directo a {lugar}.','Gracias. A la vuelta le guardo {comida}.'],
 ['No le conté cómo salió lo de la feria.','Vi que devolvieron las cajas.','Se vendió todo menos lo que yo había hecho.','¿Y eso?','Lo dejé en la casa. Me acordé cuando ya estábamos armando.','Eso merece una comida y una libreta más grande.'],
 ['El papel dice tres y usted pidió cuatro.','Sí. Uno era para {persona}.','Entonces me falta anotar uno.','Pero no lo cobre dos veces. Ya dejó el anticipo.','Voy a separar los recibos por nombre.','Eso. El grupo completo no cabe en una sola cuenta.'],
 ['Estoy haciendo limpieza. ¿Todavía quiere la caja?','Sí, no la bote.','Lleva un año diciendo que viene.','Esta vez voy. En serio.','Le puse su nombre y la dejé en {lugar}.','Si mañana no paso, ahí sí se la regalo a quien llegue.'],
 ['La comida empieza un poquito después.','¿Cuánto es un poquito?','Lo que tarde en ablandar lo de la olla.','Eso no es una hora.','Coma algo antes de venir y no me presione.','Jajaja. Voy a buscar {comida} de camino.'],
 ['Ese mensaje no era para este grupo.','Ya nos dimos cuenta por el saludo.','Por favor ignoren lo de la cuenta.','La ignoramos desde antes de que lo pidiera.','Muy amables. Ya me estaba dando pena.','Le cobramos en {comida} y queda arreglado.'],
 ['Necesito que alguien pruebe si esto quedó bien.','¿Se come?','No. Es el remiendo de {objeto}.','Entonces que pruebe {persona}. Yo solo recibo comida.','Qué colaboración tan conveniente.','Paso después y le ayudo, no se ponga así.'],
 ['¿Se oyó el audio?','Se oye a usted buscando la bolsa.','Después explicaba lo del encargo.','Cortó justo antes de esa parte.','Bueno: lo dejé en {lugar}, al lado de {objeto}.','Ahora sí entendí todo en un solo mensaje.'],
 ['Estuve buscando el nombre en la lista y no sale.','Está en la hoja de atrás.','Ah. Yo pensé que me habían sacado.','No, lo escribió {persona} con otra letra.','Ya vi. No me reconocí ni yo.','La próxima escribe usted mismo y no nos pelea.'],
];

const AUDIOS = [
 'Te dejé {objeto} con {persona}. No salgas a buscarme que ya voy de regreso. La bolsa pequeña es la tuya, la otra no.',
 'Oye, el recibo de la entrega en {lugar} era el viejo. Ya hablé con el del puesto y quedó saldado. No pagues otra vez. Te llevo el papel.',
 'No me esperen para comer. Me tocó devolverme porque olvidé las llaves. Guárdenme {comida} y después les cuento lo que pasó.',
 'Ya arreglaron la puerta. Ahora sí cierra sin empujarla. Que no se les olvide devolver la herramienta, que nos la prestaron solo por hoy.',
 'El audio de antes no se entendía con ese viento. Solo decía que mañana nos vemos en {lugar}, más tarde. Escribo la hora cuando confirmen.',
 'Se me olvidó avisarte: encontré la chaqueta. Estaba con la ropa que llevamos a remendar. No la dejó nadie perdida en la calle.',
 'No compres {comida}, que acá sobró bastante. Trae algo para tomar. Y si ves a {persona}, dile que le guardé su canasto.',
 'Yo no pedí que cancelaran la comida. Dije que no podía llevar las sillas. Si alguien consigue dónde sentarnos, yo igual voy.',
 'Ay, perdón por llamar a esta hora. Toqué el contacto equivocado. No pasó nada. Mañana me cuentas si sí te sirvió lo que llevé.',
 'Ya bajó el ruido. Era el del taller probando una rueda, no fue nada más. Había escrito antes de asomarme y los puse a todos a mirar.',
 'Me quedé sin papel para envolver. ¿Tienes un pedazo? No hace falta que sea bonito. Lo necesito para que no se moje el cuaderno.',
 'El cambio que te debían está adentro del sobre. Lo conté dos veces porque siempre me enredo. Si no cuadra, me escribes y lo miramos.',
];

const NUEVAS_VIDAS: [string, string, Vida['vecinos'], Vida['grupos'], string[], string[], string[], string[]][] = [
 ['campana','cota',['Rita · Remiendos','Dante · Herramientas','Alda'],['Los del taller','Comidas del domingo'],
  ['el taller de radios','la panadería','el patio de mantas','la plaza baja'],['pan de queso','chocolate caliente','sopa de papa','galletas de avena'],['el abrigo azul','el termo pequeño','la bolsa de botones','el cajón de agujas'],
  ['Las fundas nuevas quedaron estrechas. Dejé dos muestras en el taller.','El recibo de esa radio es de la temporada pasada, ya está pagado.','Hoy voy al puesto de telas, no a repartir mantas.','La campana del patio es para llamar a comer, no es una alarma.']],
 ['semillas','eco',['Estela · Canastos','Ramón · Carretas','Lola'],['Turnos del archivo','Intercambios de Brumaverde'],
  ['el mostrador del archivo','el puesto de canastos','la plaza de sombra','la mesa del vivero'],['pan de semillas','infusión de menta','arroz con verduras','torta de fruta'],['el impermeable verde','la caja de etiquetas','el canasto pequeño','mi cuaderno'],
  ['La etiqueta azul de la caja es vieja. La caja vacía sí volvió.','El helecho del patio se secó otra vez. Esta vez no fui yo.','El vivero pidió cambiar el día de la entrega, no la dirección.','Hoy no fumigan el archivo. Ese aviso quedó colgado desde el mes pasado.']],
 ['archivo','pacto',['Nieves · Papeles','Héctor · Colas','Alma'],['Encuadernadores','La cuadra del mercado'],
  ['el taller de libros','la mesa de Adela','el puesto de papel','la plaza del mercado'],['pan de anís','café con leche','sopa de cebolla','galletas de canela'],['el estuche de gafas','la prensa pequeña','el bolso de tela','el cuaderno de encargos'],
  ['La hoja de atrás todavía está húmeda. No la pongan bajo la prensa.','Ese recibo era el presupuesto, no una entrega. Hay que separarlos.','La mesa de nogal no se vende, aunque esté rayada.','La caja marcada para el patio no tiene libros: son herramientas.']],
 ['tejedora','iridalia',['Rosa · Cintas','Teo · Atriles','Oliva'],['Taller de tejidos','Vecinos del mirador'],
  ['el taller de telas','la mesa de muestras','la plaza de la feria','el puesto de hilos'],['té de frutas','pan de almendra','buñuelos pequeños','galletas de coco'],['la bolsa violeta','el telar pequeño','el costurero','el cuaderno de patrones'],
  ['La cinta violeta de ayer era para los paquetes, no para el vestido.','Me mandaste la dirección de la feria del año pasado. Ya no es allí.','La cometa quedó bonita, pero la voy a guardar para mi familia.','El telar hace ruido porque una pieza está floja. No es el piso.']],
];
for (const [id,base,vecinos,grupos,lugares,comidas,objetos,semillas] of NUEVAS_VIDAS) {
 VIDAS[id]={...VIDAS[base],ano:312,vecinos,grupos,lugares,comidas,objetos,audioExistente:true,
  oficio:semillas.map(t=>[t,'¿Entonces reviso el encargo de hoy?','Sí, pero mire la fecha completa del papel.','Listo, ya separé las hojas.','Le guardo algo para comer al volver.','Gracias. Paso después del turno.'])};
}

const ESTACIONES = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
const normal = (s: string) => s.split(' · ')[0];

export function ampliarHistorial(c: Caso): Caso {
 const v = VIDAS[c.id];
 if (!v) return c;
 const nuevos: Contacto[] = v.vecinos.map((nombre,i) => ({id:`vida${i}`,nombre,color:['#bd765e','#527f8e','#9680ad'][i],rol:nombre.split(' · ')[1] ?? 'Vecina'}));
 const grupos: Contacto[] = v.grupos.map((nombre,i) => ({id:`grupo${i}`,nombre,color:['#3b997a','#6475a6'][i],rol:'Grupo'}));
 const contactos = [...c.contactos,...nuevos,...grupos];
 const chats: Chat[] = [...c.chats.map(ch=>({...ch,mensajes:[...ch.mensajes]})),
  ...nuevos.map(con=>({con:con.id,archivado:con.id==='vida2',silenciado:true,mensajes:[]})),
  ...grupos.map(con=>({con:con.id,grupo:con.nombre,silenciado:true,archivado:con.id==='grupo1',mensajes:[]}))];
 const voces: Voz[] = [...c.voces];
 const fecha = (sesion:number,j:number) => `${3+(j*5+sesion*7)%23} de ${ESTACIONES[sesion%4]} · AV ${v.ano-3+Math.floor(sesion/4)}`;
 const texto = (s:string,j:number,k:number) => s.replaceAll('{objeto}',v.objetos[(j+k)%v.objetos.length])
  .replaceAll('{lugar}',v.lugares[(j+Math.floor(k/2))%v.lugares.length])
  .replaceAll('{comida}',v.comidas[(j+k)%v.comidas.length]).replaceAll('{persona}',normal(v.vecinos[(j+k)%3]));
 for (let j=0;j<chats.length;j++) {
  const ch=chats[j], anteriores: Mensaje[]=[];
  for(let sesion=0;sesion<12;sesion++) {
   // Los contactos originales también conservan las pequeñas historias de su oficio.
   const dialogo = sesion===10 && j<4 ? v.oficio[j]
    : COTIDIANAS[(j*12+sesion+c.n*3)%COTIDIANAS.length];
   const dia=fecha(sesion,j), hora=7+(j*3+sesion)%13;
   dialogo.forEach((t,k)=>anteriores.push({de:ch.grupo ? (k%3===1?'yo':nuevos[(k+j)%3].id) : k%2===0?ch.con:'yo',
    t:`${String(hora).padStart(2,'0')}:${String((j*7+sesion*3)%40+k*2).padStart(2,'0')}`,...(k===0?{dia}:{}),texto:texto(t,j,sesion),
    ...(k===2&&sesion%4===0?{cita:{de:ch.grupo?nuevos[j%3].id:ch.con,texto:texto(dialogo[0],j,sesion)}}:{}),
    ...(k===dialogo.length-1&&sesion%3===0?{reaccion:['👍','❤️','😂'][j%3]}:{}),
    ...(k===3&&sesion%5===0?{editado:true}:{}),}));
   if(j>=c.chats.length && j<c.chats.length+3 && sesion%3===2) {
    const num=(j-c.chats.length)*4+Math.floor(sesion/3);
    // Estas siete frases no contienen nombres ni lugares: el audio y la transcripción siguen siendo idénticos.
    const audio = v.audioExistente ? AUDIOS[(num+1)%AUDIOS.length] : texto(AUDIOS[(num+c.n)%AUDIOS.length],j,sesion);
    if(v.audioExistente && audio.includes('{'))continue;
    const id=`vida_${v.audioExistente?'pacto':c.id}_${num}`;
    voces.push({id,quien:ch.con,nombre:normal(contactos.find(x=>x.id===ch.con)!.nombre),fecha:dia,
     texto:audio,historial:true});
    anteriores.push({de:ch.con,t:`${String(hora).padStart(2,'0')}:58`,voz:id});
    anteriores.push({de:'yo',t:`${String(hora).padStart(2,'0')}:59`,texto:c.id==='iridalia'?'Ya pude leer la transcripción. Gracias por avisar.':'Listo, ya te escuché. Te escribo cuando llegue.'});
   }
   if(sesion%7===0)anteriores.push({de:'yo',t:`${String(hora).padStart(2,'0')}:57`,eliminado:true});
  }
  ch.mensajes=[...anteriores,...ch.mensajes];
 }
 const llamadas=[...c.llamadas];
 for(let sesion=11;sesion>=0;sesion--) for(let j=0;j<3;j++) llamadas.push({quien:nuevos[j].id,dia:fecha(sesion,j),
  t:`${String(8+j*3).padStart(2,'0')}:24`,tipo:sesion%5===0?'perdida':sesion%2===0?'entrante':'saliente',...(sesion%5===0?{}:{dur:`${1+(sesion+j)%8}:${String((sesion*13+j*7)%60).padStart(2,'0')}`})});
 const ordenFecha = (dia:string,hora:string) => {
  const d=dia.match(/(\d+) de (Primavera|Verano|Otoño|Invierno)/), a=dia.match(/AV (\d+)/), h=hora.split(':').map(Number);
  return ((a?Number(a[1]):v.ano)*120+(d?ESTACIONES.indexOf(d[2])*30+Number(d[1]):0))*1440+h[0]*60+h[1];
 };
 llamadas.sort((a,b)=>ordenFecha(b.dia,b.t)-ordenFecha(a.dia,a.t));
 const notas=[...c.notas,...v.objetos.map((objeto,j)=>({id:`vida_n${j}`,titulo:['Pendientes de la casa','Compras sin afán','Cosas prestadas','Para el próximo descanso'][j],
  fecha:fecha(9,j),texto:`${objeto}\nPasar por ${v.lugares[j]}.\nPreguntar cuánto quedó del encargo.\nNo volver a comprar ${v.comidas[j]}: todavía hay.\n${j%2?'Revisado: lo de la entrega ya se pagó.':'Cambiar la hora si llaman del taller.'}`}))];
 return {...c, tutorial:false, contactos,chats,voces,llamadas,notas,
  bloqueo:{...c.bloqueo,recordatorio:''},candados:c.candados.map(k=>({...k,recordatorio:''})),
  expediente:c.expediente.map(t=>t.replace('Hasta el teléfono.','').replace('Hasta el teléfono','')
   .replace(' Naim dice que Teófilo usa ese número para todo.','').replace(' Rocío, la maestra, dice que Simón usa ese número para todo.','')
   .replace(' Boris dice que Joaquín pone de clave lo que tenga a mano.','')
   .replace('Yo te enseño cómo se revisa un teléfono. Tú me dices qué pasó esa noche y dónde está Marcela.','El registro de los liberados no incluye a Marcela. Su mamá sigue esperando noticias.')),
  telefono:{...c.telefono,avisos:c.telefono.avisos.filter(a=>!a.texto.startsWith('Clave:'))},
  calendario:[...c.calendario,...Array.from({length:12},(_,j)=>({dia:fecha(j,j%3),t:'17:30',texto:j%2?'Recoger encargo en '+v.lugares[j%4]:'Comida con '+normal(v.vecinos[j%3])}))],
 };
}
