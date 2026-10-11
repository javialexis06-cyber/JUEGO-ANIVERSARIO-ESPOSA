# El reparto de Astra

142 NPC, cada uno con biografía y un arco personal de tres actos. Los nombres se adoptan para autoría; sus IDs originales permanecen. Las seis figuras divinas están en [Mundo](01-mundo.md) y Sangrevil y protagonistas en [Campaña](02-campana.md).

Las acciones son instrucciones para diseño, no diálogo pronunciado ni funciones ya implementadas. Inicio, giro, cierre y ambas respuestas constituyen el guion breve completo de cada arco; las escenas extensas de los personajes centrales están en la campaña. No se cuentan los tres actos como tres misiones distintas.

## Índice por localidad

| Localidad | Personajes |
|---|---|
| [pueblo_sol](#pueblo_sol) | 24 |
| [puerto_lirios](#puerto_lirios) | 8 |
| [brumaverde](#brumaverde) | 8 |
| [piedralumbre](#piedralumbre) | 8 |
| [brasaviva](#brasaviva) | 8 |
| [nieveclara](#nieveclara) | 8 |
| [vigilia](#vigilia) | 6 |
| [rosal_eterno](#rosal_eterno) | 12 |
| [jardines_eco](#jardines_eco) | 6 |
| [travesia](#travesia) | 8 |
| [refugio_hilos](#refugio_hilos) | 4 |
| [bastion_velo](#bastion_velo) | 6 |
| [estacion_celia](#estacion_celia) | 8 |
| [huerto_aurelia](#huerto_aurelia) | 4 |
| [vigia_nocturna](#vigia_nocturna) | 4 |
| [cantera_esmeralda](#cantera_esmeralda) | 4 |
| [campamento_fragmentos](#campamento_fragmentos) | 4 |
| [ambarina](#ambarina) | 6 |
| [iridalia](#iridalia) | 6 |

## pueblo_sol

### Inés · `mercader`

**Pasado:** Inés, 39, heredó una tienda con deuda durante la sequía de AV 294. Su madre había anotado préstamos de semillas como ventas para que nadie sintiera vergüenza. Inés convirtió esa generosidad en contratos demasiado duros al descubrir el agujero contable.

**Presente y personalidad:** Cuenta frascos cuando está nerviosa y guarda recibos impecables en cajas torcidas. Quiere garantizar suministro y teme volver a depender de vecinos. Le encanta probar mermeladas; ante un regalo pregunta primero cuánto costó.

**Cambio:** Aprende a separar deuda comercial de ayuda comunitaria. No regala la tienda: crea un fondo visible, con límites y derecho a revisión. Su cambio nace de escuchar a quienes pagaron dos veces por el mismo lote.

**Vínculos:** Tomás, Mara, Olga. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_01`.

#### Lo que debe una semilla · `V_mercader`

**Primeros años y lo que aprendió a querer:**

A los diez años Inés se sentaba debajo del mostrador mientras su madre atendía. Distinguía clientes por los pasos: quien arrastraba una bota pediría crédito, quien golpeaba las tablas compararía precios. Una tarde la madre sacó dinero de su bolsillo para completar una cuenta y luego negó haberlo hecho. Inés creyó que las tiendas sobrevivían gracias a personas que nunca necesitaban admitir su ayuda. Aprendió a sumar antes de aprender a preguntar cuánto esfuerzo escondía una cifra. Todavía recuerda el olor de una mermelada que no se vendió; las dos se la comieron, riéndose de su etiqueta demasiado solemne.

**Aprendizaje, decisiones y vínculos:**

A los diecisiete llevó un pedido al puerto y descubrió que la misma semilla tenía tres precios según la urgencia del comprador. Volvió orgullosa de haber negociado uno bueno. Su madre preguntó qué habían recibido quienes cultivaban y ella no lo sabía. La conversación acabó mal: Inés entendió que ninguna decisión suya sería bastante generosa. Conservó la factura como prueba de capacidad, aunque ahora también recuerda a la descargadora esperando su jornal. Su independencia empezó con una discusión que ambas confundieron con una falta de cariño.

**Lo que cambia y lo que todavía pesa:**

En AV 294 heredó la administración y quiso demostrar que podía sostenerla. El agua escaseaba y la libreta de su madre mezclaba ventas, préstamos y ayuda. Tomás pagó antes y consiguió reserva; Mara llegó con recipientes para varios corrales y pidió esperar. Inés convirtió los nombres en saldos porque una regla parecía menos humillante que escoger personas. Duplicó una deuda al copiarla y defendió el nuevo total incluso cuando reconoció una letra suya bajo otra fecha. Su peor recuerdo no es equivocarse: es haber visto que Mara dejaba de discutir y haber interpretado ese silencio como aceptación.

**Cuando no ofrece una misión:**

Abre temprano para recibir mercancía sin público y almuerza tarde, cuando ya puede saber que el día no fue un desastre. Guarda monedas doblando el papel como su madre y niega parecerse a ella. Disfruta inventar nombres absurdos para una mermelada nueva con Simón. Tras su misión permite revisar cuentas, pero sigue exigiendo pago puntual a quien sí puede pagar. No renuncia a comerciar ni decide que todo beneficio es sospechoso.

**Ante Fuatia:**

Le agradece a Fuatia que preserve suelo y lluvia, pero desconfía de un favor imposible de presupuestar. Puede vender materiales para un altar y exigir que el proveedor no arranque plantas protegidas. Su temor más privado es que la diosa lea la deuda duplicada como abuso deliberado y ninguna restitución sea suficiente. Esa inquietud no reemplaza la obligación concreta de devolverla.

**Conversaciones personales:**

##### VID_mercader_1 · Antes del cambio

> **Inés:** No mires esa etiqueta. Simón escribió «mermelada de decisiones acertadas» y ahora nadie la compra.
> **Simón:** Yo dije que la probaran primero. Tú pusiste el cartel de no tocar.
> **Inés:** Mi mamá regalaba cucharadas. Yo siempre veía el frasco que quedaba vacío, nunca la gente que volvía.
> **Simón:** Hoy podemos ofrecer una muestra pequeña. El frasco seguirá siendo tuyo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_mercader_2 · Después del arco personal

> **Mara:** El recibo está bien esta vez. Lo digo para que no creas que vine a reclamar por costumbre.
> **Inés:** Me alegra, pero me cuesta más oír eso que la queja. Con la queja sabía qué hacer.
> **Mara:** Podemos hablar de algo que no haya que arreglar. ¿Cómo salió la mermelada?
> **Inés:** Muy ácida. Por fin una cuenta que no voy a defender.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Auditar tres recibos y sus lotes.

> **Inés:** No te pido que me creas porque sonrío. Te pido que revises estas cuentas conmigo.

**Acto 2:** Cultivar dos especies compatibles con la estación y registrar procedencia.

> **Inés:** El sello está bien. La deuda no. La repetí al cambiar de libreta y nadie se atrevió a decirme que no podía pagar.

**Acto 3:** Presentar cuentas y abrir reserva comunitaria con límites.

> **Inés:** La caja seguirá cerrando cada noche. La diferencia es que ahora cualquiera podrá preguntar qué hay dentro.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Corregir públicamente o contactar primero a deudores.

> **Inés · respuesta 1:** Publicar: Me quedaré para responder cada pregunta.

> **Inés · respuesta 2:** Contactar: Nadie tendrá que contar su pobreza en una plaza para recuperar lo suyo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «Lo que debe una semilla». Consulta de reservas comunitarias por especie y procedencia; no sustituye desbloqueos estacionales de colecciones. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Mara · `cuidadora`

**Pasado:** Mara, 35, aprendió a criar animales con una tía paciente. Durante la sequía repartió agua sin preguntar a quién pertenecía cada establo; una cría murió pese a sus cuidados y convirtió ese fracaso en vigilancia constante. Nunca atribuye esa muerte a castigo divino.

**Presente y personalidad:** Distingue animales por sus hábitos, canta mal y no le importa. Corrige a otros demasiado pronto: cuidar se volvió una forma de no sentirse impotente. Conserva un cepillo desgastado, no una reliquia milagrosa.

**Cambio:** Acepta formar cuidadores y descansar sin revisarles todo. La crianza mítica no elimina pérdida ni da derecho a forzar genomas. Su amistad con Inés incluye límites que antes callaba.

**Vínculos:** Inés, Adela, Elio. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_02`.

#### Un turno que también termina · `V_cuidadora`

**Primeros años y lo que aprendió a querer:**

La tía que enseñó a Mara le daba encargos pequeños: sostener una puerta, cambiar un trapo, anotar cuánto comía una cría. Mara quería los trabajos vistosos y llamaba lentitud a la paciencia. Una tarde la tía la dejó observar a una cabra que rechazaba acercarse. Al volver, la niña llevaba una hora sentada sin tocarla. Recibió un pan, no una medalla. Por primera vez el cuidado le pareció una compañía posible y no una manera de lograr que otro hiciera lo que ella quería.

**Aprendizaje, decisiones y vínculos:**

En su primer invierno como responsable convirtió el corral en una demostración de eficiencia. Ordenó mantas por tamaño y elaboró un horario que no dejaba huecos. La tía lo miró, preguntó dónde almorzaría la cuidadora y esperó. Mara fingió que comer de pie era una elección. El día que una vecina la invitó a caminar, rechazó la salida y después sintió rabia porque nadie insistió. Aprendió a sentirse imprescindible antes de aprender a pedir que alguien quisiera acompañarla sin necesitarla.

**Lo que cambia y lo que todavía pesa:**

Tenía diecisiete años durante la sequía de AV 294. Transportó agua a establos que no conocía y volvió tan cansada que dejó una sandalia junto al pozo. Una cría murió pese a recibir los cuidados disponibles. Mara sabía que no podía producir agua inexistente; aun así reconstruyó cada visita buscando cinco minutos que le permitieran culparse. Inés le exigió una deuda que consideraba ayuda compartida y ambas discutieron junto a recipientes vacíos. Mara dejó de pedir porque depender le parecía otra ocasión de decepcionar a alguien. Nunca consideró esa muerte un juicio de Fuatia.

**Cuando no ofrece una misión:**

Le gustan las mañanas ruidosas, cuando cada animal anuncia lo que quiere. Arregla bozales innecesarios para transformarlos en correas de guía y compra una fruta que pueda comer caminando, aunque después de su arco intenta sentarse. Conoce las bromas de Cora y responde tarde, cuando ya parecía no haberlas oído. Si acepta relevo, puede revisar una nota al regresar; progresar no borra de un día para otro su necesidad de comprobar.

**Ante Fuatia:**

Reconoce en Fuatia una ternura que otros no ven y también una amenaza: convertir a un animal en prueba de virtud humana. Le permite conversar con sus protegidos, pero le pide que no reclame que todos sean mensajeros. Cuidar no obliga a una criatura a anunciar un milagro. Discute incluso con una diosa si una cría necesita descanso y la aparición está atrayendo visitantes.

**Conversaciones personales:**

##### VID_cuidadora_1 · Antes del cambio

> **Mara:** Esa manta es para mí. Sí, yo también me sorprendo cada vez que la veo.
> **Adela:** Te la traje porque la semana pasada envolviste a todos y saliste temblando.
> **Mara:** Mi tía decía que aprender a quedarse era difícil. No me avisó que aprender a salir costaba más.
> **Adela:** Primero vamos a desayunar. No hace falta aprenderlo todo antes.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_cuidadora_2 · Después del arco personal

> **Mara:** Hoy salí y no revisé el corral desde la ventana. Miré una sola vez al volver.
> **Cora:** Eso cuenta. Si esperas una mañana perfecta, no me vas a acompañar al río nunca.
> **Mara:** Quiero ir por ir, Cora. No a comprobar si tus peces tienen problemas.
> **Cora:** Entonces lleva algo de comer. Los problemas pueden esperar nuestra caminata.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar necesidades reales de dos animales sin alterar sus genomas.

> **Mara:** Si digo que puedo con todo, pregúntame cuándo dormí. No aceptes mi respuesta rápida.

**Acto 2:** Preparar raciones y refugio para un turno normal.

> **Mara:** Adela no me quitó un animal. Me quitó la excusa de que nadie más sabía cuidarlo.

**Acto 3:** Acordar relevo y comprobar cuidado posterior sin acelerar tiempo real.

> **Mara:** Voy a dejar el cepillo aquí. Si lo necesitan, ya saben usarlo.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Relevo fijo o turnos rotativos.

> **Mara · respuesta 1:** Fijo: Tendré que confiar en una persona de verdad.

> **Mara · respuesta 2:** Rotativo: Voy a enseñar, no a examinar cada mano.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Un turno que también termina». Plan de relevo de cuidado con ración, responsable y reserva; no ejecuta cuidados ni adelanta 48 horas reales. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Olivia · `carpintera`

**Pasado:** Olivia, 32, creció reparando casas tras crecidas. Su padre medía puertas desde arriba de la escalera; ella descubrió que la precisión no servía si una persona no podía atravesarlas. Se fue de una cuadrilla que premiaba rapidez sobre accesibilidad.

**Presente y personalidad:** Se ríe de sus propias manchas de cola y se enfurece si llaman adorno a una rampa. Ayuda sin preguntar medidas personales; a veces impone soluciones porque cree saber qué necesita el usuario.

**Cambio:** Aprende a prototipar con quien usará la obra. Su ambición pasa de firmar el edificio más grande a dejar diseños reparables por el propio pueblo.

**Vínculos:** Roque, Renata, Rosa. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_03`.

#### La puerta de quien vive ahí · `V_carpintera`

**Primeros años y lo que aprendió a querer:**

Olivia creció entre marcas de agua dibujadas en las paredes. Después de una crecida su padre medía otra vez, como si el metro pudiera asegurar que la casa ya no se movería. Ella hacía barcos con retales y se molestaba cuando usaban sus juguetes para alimentar la estufa. Una vecina conservó uno y lo colocó sobre el marco reparado. No era la pieza más útil de aquella semana, pero demostraba que una niña había pasado por allí haciendo algo más que ayudar a reconstruir.

**Aprendizaje, decisiones y vínculos:**

Entró en una cuadrilla donde cobraban por obra cerrada. Su primera puerta era impecable: cerraba sin ruido y tenía bisagras alineadas. Una clienta no podía atravesarla con su ayuda de movilidad. El capataz dijo que el plano se había cumplido. Olivia repitió esa explicación antes de admitir que también había notado la dificultad durante la medición. Reparó el paso en horas no pagadas y al marcharse recibió el apodo de «la que regala tiempo». Le dolió porque todavía quería ser reconocida por esos mismos hombres.

**Lo que cambia y lo que todavía pesa:**

Más tarde ganó un concurso con una fachada de tres niveles. El premio exigía que la ejecución fuera suya aunque la idea de las rampas procedía de una usuaria. Aceptó inicialmente y pasó una noche escribiendo cómo justificaría la firma. Al día siguiente pidió corregirla; perdió parte del contrato y la tranquilidad de un ingreso seguro. Renata supo cuánto le costó y dejó de creer que cobrar con justicia era un lujo reservado a quien ya tenía dinero. Olivia conserva el dibujo premiado, sin fingir que nunca quiso verlo con su nombre solo.

**Cuando no ofrece una misión:**

Aprueba un corte después de recorrerlo con la mano, cocina pésimo y disfruta escuchar a Simón describir problemas que tienen solución comestible. Tiene retales guardados por motivos que no caben en inventario y un proyecto de mesa que cambia cada estación. Después de su misión puede negarse a una restauración urgente si no hay plazo seguro. Quiere construir algo hermoso, además de accesible; no renuncia al orgullo de oficio.

**Ante Fuatia:**

Fuatia protege la madera que necesita y puede desaprobar su corte. Olivia exige distinguir una casa reparable de una exhibición desechable. Presentaría el diseño, el destino de los retales y los árboles de reemplazo antes de aceptar un favor. Si la diosa propone prohibir toda tala, le preguntará cómo refugiar a quienes siguen viviendo bajo techos rotos.

**Conversaciones personales:**

##### VID_carpintera_1 · Antes del cambio

> **Olivia:** Este barco me lo devolvieron veinte años después. No flota; el barniz pesa demasiado.
> **Renata:** Puedo hacerle una vela y cobrarte como restauración naval prestigiosa.
> **Olivia:** Mi padre quemaba los otros. No era cruel; necesitábamos calor. Yo lo odié igual aquella tarde.
> **Renata:** Puedes recordar las dos cosas sin decidir que una de ellas sobra.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_carpintera_2 · Después del arco personal

> **Olivia:** Quien usa la puerta volvió a medirse el paso. Yo esperaba que hablara del acabado.
> **Renata:** ¿Y no era eso lo que querías? Que pudiera pasar sin pedir ayuda.
> **Olivia:** Sí. También quería que dijera que quedó bonita. Me cuesta admitir cuánto me importaba.
> **Renata:** A mí me parece bonita. Ahora termina de cobrarla antes de regalar otra tarde.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Medir recorrido y puerta con permiso del residente.

> **Olivia:** No voy a dibujar una casa para alguien a quien todavía no he escuchado.

**Acto 2:** Construir prototipo con materiales reservados y probar paso.

> **Olivia:** Mi primer plano cabía en el terreno. La mesa de Rosa no cabía en la vida que puse adentro.

**Acto 3:** Corregir una pieza y registrar plano reversible.

> **Olivia:** Una puerta buena se nota menos que quien logra cruzarla.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Rampa lateral o entrada baja.

> **Olivia · respuesta 1:** Lateral: Guardaré espacio para girar, no solo para subir.

> **Olivia · respuesta 2:** Baja: Cuidaremos el drenaje para no cambiar un obstáculo por otro.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La puerta de quien vive ahí». Módulo de acceso reparable para entrada existente, con la misma huella y prueba de paso antes de integrarlo. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Bruno · `herrero`

**Pasado:** Bruno, 49, trabajó con Gonzalo antes del accidente de AV 281. Era aprendiz y sobrevivió porque llevaba un recado fuera de la galería. Años después confundió ese azar con deuda y empezó a aceptar cualquier encargo sin descanso.

**Presente y personalidad:** Su humor es seco; toca el metal antes de describirlo y comparte café solo cuando hay confianza. Rechaza elogios grandiosos. Hace herramientas seguras, pero oculta cuándo su propia mano tiembla.

**Cambio:** Pide relevo y registra fatiga de oficio como cualquier defecto técnico. No descubre que el accidente fue culpa suya: reconoce que sobrevivir no exige agotarse de por vida.

**Vínculos:** Gonzalo, Santiago, Aurelio. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_04`.

#### La herramienta del relevo · `V_herrero`

**Primeros años y lo que aprendió a querer:**

Bruno aprendió a guardar clavos por tamaño con un vecino que jamás le pagó una jornada completa pero siempre le apartó comida. Durante años recordó solo el plato y llamaba ingratitud a pensar en el dinero. De muchacho escuchaba golpes desde la calle y reconocía quién trabajaba; soñaba con tener uno propio. Su primer martillo era demasiado pesado y fingía llevarlo con facilidad. Gonzalo lo cambió por otro menor sin convertir el gesto en una burla. Ese respeto fue una razón concreta para seguirlo a la mina.

**Aprendizaje, decisiones y vínculos:**

En AV 281, con dieciocho años, iba a llevar una pieza de unión cuando le pidieron salir por un recado. Volvió y encontró el acceso cerrado. Darío, también de dieciocho, estaba buscando a quién entregar una instrucción tardía. Los dos repitieron durante años dónde se encontraban, como si una ubicación exacta pudiera ordenar una tarde que nunca dejó de moverse. Bruno no oyó a su brigada morir desde dentro ni conoce cada último momento. Esa ausencia alimentó versiones que trataba como certezas.

**Lo que cambia y lo que todavía pesa:**

Un encargo de herramienta de rescate le devolvió prestigio y empezó a aceptar todos los siguientes. Una clienta descubrió una unión mal enfriada antes de usarla. Bruno intentó quedarse con la pieza en silencio; Olivia pidió registrar por qué había salido así. Se enfadó con ella porque el informe haría visible algo que prefería presentar como mala suerte. Después comprendió que había empezado a ocultar riesgos para conservar la imagen del sobreviviente útil. Su cansancio podía poner a otros en el mismo peligro que juraba evitar.

**Cuando no ofrece una misión:**

Le gustan las herramientas gastadas que aún funcionan y los domingos sin cliente que llaman «solo una preguntica». Cocina huevos sobre una placa retirada, jamás en un horno activo, y se ríe de que Simón supervise su improvisación. Tras la misión sigue teniendo jornadas malas; pone el martillo boca abajo para avisar que no acepta trabajo adicional. No espera que Gonzalo le dé permiso para descansar, aunque todavía desea que alguna vez lo vea hacerlo.

**Ante Fuatia:**

El rencor de Fuatia le resulta familiar. Le preocupa una diosa que llama vigilancia a no soltar nunca una ofensa. Entiende que el metal venga de una herida del suelo, pero rechaza considerar cada herramienta nueva un abuso. Quiere que ella vea la reparación de una bomba que vuelve a dar agua, además del mineral consumido para fabricarla.

**Conversaciones personales:**

##### VID_herrero_1 · Antes del cambio

> **Bruno:** Este martillo no era el de Gonzalo. Era mío. Llevo años contando mal esa parte.
> **Darío:** Yo también había puesto otra puerta en mi recuerdo. En el plano no aparece.
> **Bruno:** Supongo que quería que la tarde hubiera tenido una salida más.
> **Darío:** Podemos revisar el plano sin arreglar lo que pasó inventando una.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_herrero_2 · Después del arco personal

> **Bruno:** Dejé el taller cerrado a mediodía. Una señora preguntó si estaba enfermo.
> **Olivia:** ¿Le dijiste que estabas almorzando o prefieres que organicemos un misterio?
> **Bruno:** Le dije almuerzo. Me pidió una reparación para cuando resucitara.
> **Olivia:** El pueblo sobrevivirá a tus tres huevos, Bruno. Tú también.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Examinar tres piezas de un lote sin fabricarlas de nuevo.

> **Bruno:** El martillo no sabe si estoy cansado. La pieza sí lo va a recordar.

**Acto 2:** Contrastar acta con Gonzalo y temperatura de taller.

> **Bruno:** Me fui a llevar un recado. Ellos se quedaron. He vivido como si todavía tuviera que devolver esos minutos.

**Acto 3:** Forjar una pieza con receta normal y aprobar control de seguridad.

> **Bruno:** Hoy cierro a la hora escrita. Si algo es urgente, lo resolveremos entre dos.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Registro abierto o informe técnico anónimo.

> **Bruno · respuesta 1:** Abierto: Que mi nombre también figure en el descanso.

> **Bruno · respuesta 2:** Anónimo: Servirá para el taller; hablaré de lo mío cuando pueda.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `tecnica` y recuerdo «La herramienta del relevo». Ficha de control de fatiga y método de forja alternativo; no suma reducción a recetas mineras ya aprendidas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Adela · `veterinaria`

**Pasado:** Adela, 41, estudió con Zaira y se distanció por una discusión sobre un remedio sin dosis. Una atención tardía le enseñó a registrar causas en vez de repartir culpas. No odia la tradición: teme la certeza que impide observar.

**Presente y personalidad:** Ordena vendas por tamaño y nunca por precio. Guarda dibujos de pacientes sanos, no solo historiales de crisis. Al preguntar puede sonar fría cuando intenta no prometer una cura.

**Cambio:** Integra saber local medido y admite incertidumbre frente a Mara. Su consulta ofrece prevención legible sin convertir cada cuidado en alarma o medicamento.

**Vínculos:** Mara, Zaira, Noemí. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_05`.

#### Lo que una receta no promete · `V_veterinaria`

**Primeros años y lo que aprendió a querer:**

Adela se interesó por animales observando a un gato que nunca se acercaba cuando lo llamaban y siempre aparecía al sacar comida. Su familia llamaba egoísmo a esa conducta; ella sospechó que el animal sencillamente no había aceptado el trato. Le gustaba desmontar explicaciones demasiado cómodas. En una libreta infantil anotó que las gallinas no podían prever toda lluvia, después de esperar una tormenta que no llegó. Conserva aquellas hojas porque recuerda cuánto puede desear una persona que su primera teoría sea cierta.

**Aprendizaje, decisiones y vínculos:**

Con Zaira compartió estudio, vivienda temporal y una relación adulta que ambas decidieron terminar. Una curaba aprendiendo de huertos y relatos; la otra insistía en medir. En sus mejores jornadas intercambiaban métodos sin sentir que una corrección era un juicio sobre el cariño. La discusión por una dosis se volvió insoportable porque usaron heridas privadas para ganar una cuestión clínica. No se separaron por ser tradición y ciencia incompatibles: dejaron de escucharse con cuidado. Pueden reparar su colaboración sin reanudar su romance.

**Lo que cambia y lo que todavía pesa:**

Una atención llegó tarde porque el propietario no entendió una indicación. Adela había escrito lo correcto con un vocabulario que solo colegas podían seguir. Primero defendió su letra y su receta; después comprobó que el error se había repetido en dos hogares. Cambió la ficha, pero mantuvo la anterior detrás de la nueva. Le avergüenza verla y también la necesita para recordar que explicar al final no devuelve un momento perdido. No convierte al propietario en culpable para preservar su autoridad.

**Cuando no ofrece una misión:**

Se prepara té y lo olvida al atender, disfruta juegos de mesa y puede equivocarse contando antes de reírse. Anota dudas clínicas en tinta distinta de los resultados, nunca altera un diagnóstico para que parezca seguro. Tras su arco acepta que Mara le discuta una instrucción antes de aplicarla. Sigue exigiendo dosis y registros a Zaira; reconciliarse profesionalmente no hace que sus métodos dejen de necesitar pruebas.

**Ante Fuatia:**

Desea escuchar a Fuatia cuando habla con un animal y le incomoda que otros traten esa conversación como diagnóstico infalible. La experiencia de un cuerpo necesita atención aunque un elemento lo proteja. Puede reconocer una bendición sin suspender seguimiento. Si la diosa busca hacer sufrir a un responsable, Adela sigue atendiendo al ser herido sin participar de la sentencia.

**Conversaciones personales:**

##### VID_veterinaria_1 · Antes del cambio

> **Adela:** La taza fría significa que entraron pacientes; la tibia significa que olvidé cuál era la mía.
> **Mara:** Te traje una con tu nombre. Vas a encontrar otra interpretación, ya lo sé.
> **Adela:** Mi letra era correcta, Mara. Eso fue lo primero que dije el día que alguien no pudo entenderla.
> **Mara:** Hoy me explicaste dos veces sin enfadarte. Yo noté la diferencia.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_veterinaria_2 · Después del arco personal

> **Zaira:** Conservaste el protocolo anterior. Pensé que te gustaría olvidarlo.
> **Adela:** Quiero dejar de usarlo, no fingir que jamás lo escribí. También conservo tus correcciones.
> **Zaira:** Esta es de aquella temporada en que todavía nos escuchábamos bien.
> **Adela:** Podemos aprender de ella sin volver a vivir juntas. Me alegra que hayas venido.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar ficha de síntoma con condiciones reales de refugio.

> **Adela:** Una planta puede ayudar. Que sea antigua no decide la dosis.

**Acto 2:** Medir preparación herbal con Zaira sin usarla en animal sano.

> **Adela:** Zaira me mostró un dato que yo no quería mirar. Yo le mostré un riesgo que ella ya había visto. Nos faltó escucharnos.

**Acto 3:** Corregir guía y enseñar cuándo consultar.

> **Adela:** Escribe también cuándo no usarlo. Esa línea puede cuidar más que el nombre del remedio.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Guía ilustrada o ficha de texto.

> **Adela · respuesta 1:** Ilustrada: Que el dibujo no esconda la medida.

> **Adela · respuesta 2:** Texto: Que la precisión no vuelva ilegible la ayuda.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «Lo que una receta no promete». Comparador de refugio, alimento y síntoma con límites de observación; deriva a consulta, no prescribe automáticamente. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Rosa · `posadera`

**Pasado:** Rosa, 52, abrió la posada con su esposo Lucio. Él murió en AV 306 y eligió quedarse en Verdia. Rosa no conoce aún su elección; convertir cada habitación en lugar para otro la ayudó a seguir, pero dejó intacta la mesa donde discutían recetas.

**Presente y personalidad:** Es hospitalaria y tiene mal humor cuando alguien mueve sus ollas sin avisar. Le gusta ganar al dominó y no tolera que la reduzcan a viuda abnegada. Sus camas tienen capacidad finita.

**Cambio:** Puede conocer una carta de Lucio sin recibir mandato de esperar eternamente. Decide qué recuerdo conservar y qué hacer nuevo; una escena opcional permite duelo o alegría sin forzar romance posterior.

**Vínculos:** Simón, Lucio, Belén. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_06`.

#### Una mesa para el presente · `V_posadera`

**Primeros años y lo que aprendió a querer:**

Rosa creció en una casa donde recibir visitas significaba esconder todo lo gastado. La comida podía ser abundante, pero nadie se sentaba hasta que el mantel quedara sin arrugas. De joven alquiló un cuarto y puso a propósito una silla distinta a las demás. Le gustó recibir una amiga sin pedir disculpas por la madera. Esa primera sobremesa se parece más a la posada que construyó después que cualquier gran gesto de hospitalidad. Todavía alisa manteles cuando está nerviosa y detesta que Lucio lo recordara con tanta facilidad.

**Aprendizaje, decisiones y vínculos:**

Lucio cocinaba más despacio de lo que ella habría elegido y decía que un negocio lleno podía quebrar sin dejar de parecer próspero. Discutieron por abrir otra planta. Rosa quería que la posada demostrara algo a quienes le aconsejaron buscar un oficio menos incierto. Él temía no poder atenderla. Resolvieron posponer la obra, compraron dos mesas y durante una estación estuvieron molestos por haber cedido. Su matrimonio tuvo acuerdos trabajados, humor y discusiones repetidas; no fue una felicidad sin diferencias hasta la muerte.

**Lo que cambia y lo que todavía pesa:**

En AV 306, cuando murió Lucio, visitantes intentaron consolarla describiendo una vida perfecta. Rosa acabó contando una pelea por sal demasiado cara y alguien cambió de tema. Entendió que otros querían un recuerdo sin bordes. Guardó intacta una mesa, pero siguió cobrando habitaciones y encargando leña: la pena no suspendió las cuentas. Permitió que Simón cocinara, luego le corrigió un plato por parecerse poco y otro por parecerse demasiado. Le tomó tiempo reconocer que ninguno podía ocupar el lugar que ella no había decidido dejar libre.

**Cuando no ofrece una misión:**

Sabe quién se duerme antes de terminar un cuento y puede inventar una excusa para terminar la conversación sin avergonzarlo. Le gustan cartas competitivas, flores que no necesitan jarrón caro y pan ligeramente tostado. Después de conocer el mensaje autorizado de Lucio puede cambiar el mantel de su mesa. No significa que haya dejado de quererlo. Puede recordar un día cualquiera sin convertirlo en ceremonia ni permitir que huéspedes opinen sobre si debe tener otra pareja.

**Ante Fuatia:**

Le agradece a Fuatia calor y agua limpia, pero jamás preguntó qué ofrenda devolvería a Lucio. Le inquieta que una aparición amable se convierta en excusa para señalar a una viuda que no reza. Si la diosa pide alojar a quienes protegen un humedal, Rosa querrá saber cuántas camas, por cuánto tiempo y quién ayudará a tenderlas. La hospitalidad también tiene trabajo detrás.

**Conversaciones personales:**

##### VID_posadera_1 · Antes del cambio

> **Rosa:** Lucio me habría dicho que esas cortinas son carísimas. Las escogí yo y habría insistido igual.
> **Simón:** ¿Quieres que conserve las anteriores para recordar la discusión?
> **Rosa:** Quiero que las laves para la habitación del fondo. También tenían utilidad fuera de nuestra pelea.
> **Simón:** Entonces hoy hablamos de cortinas. Me parece un buen tema para almorzar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_posadera_2 · Después del arco personal

> **Rosa:** Cambié el mantel. No tuve una revelación; simplemente se había roto en una esquina.
> **Simón:** Te guardé el trozo bordado por si lo querías. Si no, puedo usarlo de muestra.
> **Rosa:** Lo guardaré. Y mañana quiero escoger otro dibujo, de esos que a Lucio le parecían extravagantes.
> **Simón:** Voy a prepararme para defender mi sueldo cuando veas el precio.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Inventariar camas y preparar menú con capacidad real.

> **Rosa:** No quiero que todo lo que cocinemos sepa a despedida. Pero tampoco quiero fingir que nunca comimos aquí juntos.

**Acto 2:** Encontrar receta anotada por Lucio con permiso.

> **Rosa:** Este garabato dice menos sal. Nos pasamos veinte años discutiendo la misma sopa. Me alegra que no lo borrara.

**Acto 3:** Organizar cena pequeña y escoger disposición de la mesa.

> **Rosa:** Voy a guardar una silla. Las otras vuelven a ser de quien llegue.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Conservar receta o crear versión nueva.

> **Rosa · respuesta 1:** Conservar: No tiene que saber idéntica para seguir siendo nuestra.

> **Rosa · respuesta 2:** Nueva: Lucio se habría quejado. Y habría pedido otra cucharada.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «Una mesa para el presente». Variante de presentación de menú de sopa con mismas entradas, porciones y energía que la receta base elegida. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Damián · `archivero`

**Pasado:** Damián, 46, llegó como copista y encontró en los archivos un orden que su infancia itinerante no tenía. En AV 305 prometió a Aurelio guardar un reverso hasta preparar evacuaciones; prolongó la promesa cuando ya servía a una reputación.

**Presente y personalidad:** Habla con fechas cuando teme hablar de sí mismo. Colecciona tazas desparejas y disfruta historias absurdas fuera del trabajo. Quiere merecer confianza y la busca escondiendo errores que podrían hacerla posible.

**Cambio:** Publica procedencia, dudas y correcciones. Se disculpa con personas concretas y permite que Esteban cuestione su resumen sin entregar recuerdos privados al jugador.

**Vínculos:** Aurelio, Esteban, Berenice. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_07`.

#### El reverso que firmé · `V_archivero`

**Primeros años y lo que aprendió a querer:**

Los viajes de su infancia dejaban a Damián historias sin testigos disponibles: cada pueblo conservaba otra versión de quién era su familia. Quiso una habitación donde las cosas siguieran en el mismo lugar al despertar. Al entrar al archivo como ayudante sintió alivio frente a estantes que podían numerarse. Un compañero cambió una carpeta para gastarle una broma y él pasó una tarde entera buscándola. Le pareció cruel, pero nunca explicó por qué. Esa dificultad para mostrar desorden íntimo convirtió más tarde la precisión profesional en refugio y máscara.

**Aprendizaje, decisiones y vínculos:**

Aprendió a corregir copias sin humillar a quien las había escrito. Sin embargo, cuando publicaron su primer catálogo, agradeció solo a superiores y olvidó mencionar a quienes recuperaban papel mojado. Flora reclamó nombres en otro proyecto y Damián consideró excesivo el conflicto. Años después pudo reconocer la misma comodidad en su lista. No fue corrupto desde el comienzo: disfrutaba que un trabajo valioso le diera por fin un lugar estable y temió perderlo cada vez que una corrección comprometía a sus protectores.

**Lo que cambia y lo que todavía pesa:**

Aurelio le pidió reservar un reverso en AV 305 para organizar evacuaciones. Damián preguntó cuánto y aceptó una respuesta vaga. Al pasar la emergencia pudo preguntar de nuevo; prefirió elaborar un índice de documentos seguros. Llamó prudencia a cada día adicional. Paloma llevaba paquetes cuya procedencia registraba sin abrirlos y él se tranquilizaba pensando que nadie estaba mintiendo de forma expresa. Cuando encuentra la hoja otra vez recuerda un detalle vergonzoso: durante esos años había recomendado a estudiantes contrastar siempre las fuentes.

**Cuando no ofrece una misión:**

Ordena su cocina con menos éxito que sus archivos, compra pan fuera de hora y conserva cartas que no sabe contestar. Puede discutir con Esteban sobre una coma hasta que Alma los obliga a almorzar. Después de publicar el reverso no busca hacer confesiones interminables; atiende solicitudes de corrección y soporta que alguien no acepte su disculpa. Sigue apreciando el silencio del archivo, ahora con una mesa donde otras personas puedan alterar su orden.

**Ante Fuatia:**

Teme la idea de que Fuatia pueda juzgar el uso final del papel que registra. Quiere documentos de sus sentencias y un derecho de respuesta que una diosa enfadada podría considerar insolencia. No intenta demostrar que el nacimiento fue falso: busca conservar la precisión de su origen junto a los relatos de quienes sobrevivieron sin celebrarlo.

**Conversaciones personales:**

##### VID_archivero_1 · Antes del cambio

> **Damián:** Esta carpeta contiene cartas sin contestar. No es material público; es mi vida bastante desordenada.
> **Alma:** Pensé que nunca dejabas una fecha sin anotar.
> **Damián:** Las anoto. Saber cuánto tardo no me ayuda a escribir la primera frase.
> **Alma:** Si quieres, puedo quedarme corrigiendo trabajos. No tengo que leer tu carta para acompañarte.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_archivero_2 · Después del arco personal

> **Aurelio:** Vinieron a pedir el acta y no preguntaron si yo permitía verla.
> **Damián:** Es lo que acordamos. Todavía me preparo para que te enfades cada vez.
> **Aurelio:** A veces me enfado. Ya no quiero que eso vuelva a cerrar un cajón.
> **Damián:** Entonces guardaré también esa frase. Sin convertirla en absolución de la anterior.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar catálogo y dos copias discrepantes.

> **Damián:** Un archivo puede mentir sin cambiar una letra. Basta con decidir qué página no se muestra.

**Acto 2:** Recuperar autorización del testigo para abrir reverso.

> **Damián:** Prometí esperar. Después empecé a necesitar que todos creyeran que no había nada que esperar.

**Acto 3:** Registrar corrección conservando original y responsabilidad.

> **Damián:** La corrección tendrá fecha, autor y el error completo. Mi trabajo no es quedar intacto.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Lectura acompañada o copia consultable.

> **Damián · respuesta 1:** Acompañada: Responderé sin interrumpir al testigo.

> **Damián · respuesta 2:** Consultable: La nota no reemplazará lo que él escribió.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El reverso que firmé». Vista de original, corrección y procedencia de documentos autorizados; mantiene privadas las partes no consentidas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Eliana · `canalizadora_aura`

**Pasado:** Eliana, 29, era ayudante de Flora y soñaba con ser Santa como quien sueña con no volver a fallar. Durante una helada ofreció un rito a una familia agotada que solo necesitaba relevo. Comprendió tarde el peso de una invitación divina.

**Presente y personalidad:** Sonríe fácil, pregunta poco cuando se entusiasma y cuida una maceta que nunca floreció. Es amiga de Serena desde la escuela; discutieron al asumir oficios porque Eliana confundió silencio con falta de esperanza.

**Cambio:** Aprende a ofrecer posibilidades y aceptar un no. En la campaña renuncia a un gran rito vistoso para sostener turnos de comida; Aura la respalda sin apagar su alegría.

**Vínculos:** Serena, Flora, Alma. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_08`.

#### El brote que puede esperar · `V_canalizadora_aura`

**Primeros años y lo que aprendió a querer:**

Eliana ayudaba a Flora a mover macetas y se inventaba ceremonias para celebrar cada brote. Un plantón que no germinaba recibía un nombre más largo, como si necesitar mayor atención explicara la demora. Flora la dejó comparar semillas sin ridiculizar el rito. Aprendió que una fiesta podía acompañar una observación, pero no volverla verdadera. Un día una niña preguntó si el entusiasmo de Eliana tenía vacaciones y ella respondió que no. Años más tarde recuerda la pregunta cuando está agotada y siente que debe parecer un amanecer para todos.

**Aprendizaje, decisiones y vínculos:**

Solicitó aprender el oficio de Santa creyendo que Aura la ayudaría a impedir sus propios errores. La formación incluía inventarios de comida y turnos de escucha que le parecían auxiliares frente a los ritos. Una antigua oficiante le pidió explicar cómo recibiría a quien no quisiera bendición. Eliana contestó ofreciendo una ceremonia más pequeña. Solo al oír la pregunta repetida comprendió que no había aceptado la negativa. No perdió su fe; perdió una imagen de sí misma donde entusiasmo y cuidado siempre coincidían.

**Lo que cambia y lo que todavía pesa:**

Durante una helada ofreció un rito a una familia que llevaba jornadas protegiendo cultivos. Preparó música y flores, pidió que vinieran y tomó el silencio por timidez. Al llegar encontró al padre dormido junto a recipientes y a la madre intentando agradecer sin sostenerse de pie. Eliana empezó a recoger el altar con vergüenza; la mujer le pidió primero cargar agua. Pasaron la tarde trabajando casi sin hablar. Esa escena explica por qué en campaña puede renunciar a una aparición vistosa y organizar comida sin sentir que ha dejado de servir a Aura.

**Cuando no ofrece una misión:**

Disfruta vestirse para una fiesta y luego quitarse las sandalias bajo la mesa. Inventaría juegos para que los niños descubrieran plantas, siempre con supervisión y terreno seguro. Tras su misión acepta que un día tranquilo no es un fracaso espiritual. Todavía quiere que sus ritos sean hermosos; pregunta antes de invitar y puede admitir que una respuesta le decepciona sin cobrar esa emoción a quien la dio.

**Ante Fuatia:**

Reconoce lo amoroso de Fuatia y rechaza que una ayuda se retire para educar mediante miedo. No pide a la diosa que sea Aura. Propone una segunda oportunidad verificable y acepta que Fuatia exija pruebas. La diferencia que defenderá es que aceptar reparación no deba requerir entusiasmo por quien dictó la sentencia.

**Conversaciones personales:**

##### VID_canalizadora_aura_1 · Antes del cambio

> **Eliana:** Preparé una ceremonia para una familia que necesitaba dormir. Hasta ensayé la bienvenida.
> **Flora:** Recuerdo que luego llevaste recipientes y volviste sin flores.
> **Eliana:** Mi peor parte fue querer que me consolaran por haberme equivocado.
> **Flora:** Pudiste cargar agua sin hacerlo. Esa parte también ocurrió.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_canalizadora_aura_2 · Después del arco personal

> **Eliana:** Dijeron que no vendrían y no les propuse otro horario. Dejé la invitación en paz.
> **Serena:** ¿Y tú cómo quedaste? Puedes decir que triste sin cambiar su respuesta.
> **Eliana:** Un poquito. Y aliviada. Aura no me pidió sonreír para aprobar el día.
> **Serena:** Entonces ven a sentarte. No he organizado ningún rito para el descanso.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Preparar altar con cultivo legítimo o préstamo ceremonial.

> **Eliana:** ¿Quieres empezar algo, o quieres que hoy nadie te pida empezar nada? Estoy aprendiendo a preguntar eso primero.

**Acto 2:** Preguntar consentimiento a tres participantes adultos.

> **Eliana:** Aura no me pidió un altar lleno. Me pidió dejar espacio para quien no quisiera venir.

**Acto 3:** Celebrar rito breve o suspenderlo con comida compartida.

> **Eliana:** Voy a regar la maceta igual. No para demostrar que merecía florecer.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Rito pequeño o descanso comunitario.

> **Eliana · respuesta 1:** Rito: Habrá sitio para observar sin jurar nada.

> **Eliana · respuesta 2:** Descanso: Hoy la oportunidad será poder detenerse.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El brote que puede esperar». Participación o visita a rito pequeño, incluido descanso; ninguna rama da bendición estadística mayor. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Serena · `canalizadora_lara`

**Pasado:** Serena, 31, acompañó a su abuela en una muerte tranquila y a un vecino en una muerte llena de miedo. No eligió el oficio porque todas las despedidas fueran bellas, sino porque alguien debía quedarse incluso cuando no lo eran. Fue aprendiz de una Santa anterior que se retiró con vida.

**Presente y personalidad:** Tiene risa baja, detesta flores envueltas en plástico y guarda botones para remendar. Muchos le hablan solo de pérdidas; desea también conversaciones corrientes. Calla demasiado para no herir.

**Cambio:** Hace pública la verdad del escudo y acepta que acompañar no exige resolver todo dolor. Puede negarse a un rito abusivo aunque alguien invoque a Lara. No es una encarnación ni posee recuerdos de siglos.

**Vínculos:** Eliana, Nilo, Naim. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_09`.

#### El nombre que no se pronuncia por otro · `V_canalizadora_lara`

**Primeros años y lo que aprendió a querer:**

Serena recuerda a su abuela contando historias mientras pelaba fruta, con pausas demasiado largas para una niña. Pensaba que el silencio era una parte aburrida y lo llenaba con preguntas. Cuando la abuela empezó a cansarse, descubrió que podía esperar una respuesta sin perder su compañía. Su muerte fue tranquila, pero no le dejó una instrucción perfecta ni una última frase preparada. Serena conserva un cuento interrumpido y se resiste a inventar cómo acababa para que parezca que recibió un mensaje.

**Aprendizaje, decisiones y vínculos:**

Acompañó después a un vecino que no quiso aceptar su muerte. Otros le recomendaron hablarle de descanso y ella repitió palabras que le habían servido con su abuela. El hombre se enfadó; no quería que su miedo pareciera una falta de sabiduría. Serena se quedó sin discurso, le acercó agua y le permitió decir cosas que la familia prefería no oír. Eligió el oficio de Lara por aquella dificultad, no porque poseyera una serenidad especial. Su maestra se retiró viva y le enseñó que permanecer tampoco exige consumir toda la propia vida.

**Lo que cambia y lo que todavía pesa:**

La primera extracción de una expedición fallida la dejó esperando una campana que finalmente sonó. Al recibir al grupo todos intentaron describir lo que habían conseguido y nadie quiso decir qué habían perdido. Serena pidió sentarse y encontró que una persona seguía sosteniendo un objeto sin saber para qué. Desde entonces su protocolo empieza por regreso, agua y espacio, no por victoria. Le avergüenza haber repetido una vez «al menos volvieron» demasiado pronto; sabe que una verdad puede convertirse en una manera de no escuchar.

**Cuando no ofrece una misión:**

Ríe con cuentos malos, prefiere conversaciones durante tareas sencillas y necesita tardes sin visitas. No viste el oficio como una obligación de hablar siempre bajo. Después de su arco puede rechazar una petición de rito y explicar por qué, aun si el vecino se enfada. No es inmortal ni recuerda otras Santas como experiencias propias; lee sus errores de archivo para evitar presentar a Lara como una solución sin historia.

**Ante Fuatia:**

Puede respetar a Fuatia y acompañar al humano que ella castiga. Para Serena atender sufrimiento no constituye un voto sobre el expediente. Le preocupan las sentencias que crecen por indignación cuando ya se completó la reparación. Si Fuatia busca reconocimiento de autoridad, Serena le ofrece escucha, pero no prometerá abandonar a nadie para demostrar lealtad.

**Conversaciones personales:**

##### VID_canalizadora_lara_1 · Antes del cambio

> **Serena:** No sé cómo terminaba ese cuento. Mi abuela se quedó dormida y yo me fui a jugar.
> **Eliana:** ¿Nunca inventaste un final para recordarlo entero?
> **Serena:** Algunos. No me gustaba ninguno. Al final guardé la tarde como había sido.
> **Eliana:** Me gusta que también hubiera juego en ella.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_canalizadora_lara_2 · Después del arco personal

> **Serena:** Hoy dije que no. Vinieron a pedir un rito para avergonzar a alguien frente a su familia.
> **Alma:** Seguro citaron alguna regla antigua. ¿Quieres que la revisemos?
> **Serena:** Mañana. Primero quiero merendar sin preparar otra defensa de mi negativa.
> **Alma:** Tengo fruta. Podemos pasar una tarde que no vaya a ningún archivo.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Escuchar una solicitud sin registrar detalles privados.

> **Serena:** No me cuentes una pérdida para pagar la visita. También puedes venir a hablar de la lluvia.

**Acto 2:** Preparar flores y espacio de silencio.

> **Serena:** Creí que callar era siempre delicado. A veces dejaba a alguien solo con una pregunta que sí podía responder.

**Acto 3:** Ofrecer tres formas de recuerdo, incluida ausencia voluntaria.

> **Serena:** No diremos el nombre si no quiere. Una ceremonia no adquiere permiso porque sea bonita.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Lectura consentida o ceremonia sin nombres.

> **Serena · respuesta 1:** Lectura: Leeré lo que autorizó, ninguna línea más.

> **Serena · respuesta 2:** Silencio: El espacio no necesita llenarse para acompañar.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El nombre que no se pronuncia por otro». Espacio de recuerdo con lectura, silencio o ausencia; registra permiso y permite retirar una inscripción. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Cora · `pescadora`

**Pasado:** Cora, 27, hija de una trabajadora del puerto, aprendió a reconocer corrientes con Julián. Un torneo premió su captura grande y la impulsó a pescar un lugar que estaba agotado. Fue Olga quien rechazó la compra.

**Presente y personalidad:** Disfruta competir y exagera historias hasta que Tina la corrige. No quiere abandonar la pesca; teme que aceptar límites la convierta en mala profesional. Cocina trucha para reconciliarse.

**Cambio:** Se vuelve una pescadora que muestra también lo que devolvió. Defiende cuotas basadas en observación sin humillar a quienes necesitan vender.

**Vínculos:** Julián, Olga, Tina. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_10`.

#### La captura que vuelve · `V_pescadora`

**Primeros años y lo que aprendió a querer:**

Cora veía a su madre salir al puerto cuando todavía no podía acompañarla y medía la jornada por los barcos que regresaban. Aprendió corrientes con Julián, que le pedía describir un remolino antes de darle un nombre. Una vez volvió con un pez pequeño y lo mostró más orgullosa que otra captura mayor: había sabido soltar la línea antes de enganchar un ave. Nadie fotografió aquel día. Años después descubrió que quería el aplauso que no había recibido por algo que solamente ella y Julián comprendieron.

**Aprendizaje, decisiones y vínculos:**

El torneo le ofreció una respuesta fácil: captura grande, nombre en un cartel y compradores que preguntaban por su técnica. Se convenció de que conocer una corriente le daba derecho a aprovecharla mejor que otros. No contó las jornadas sin peces pequeños, porque perjudicarían el relato de talento. Al llegar a una zona agotada vio otra barca esperándola y tuvo rabia, como si un lugar público le perteneciera por haberlo encontrado primero. Esa reacción le resulta más difícil de admitir que la captura excesiva.

**Lo que cambia y lo que todavía pesa:**

Olga rechazó comprarle el lote y Cora lo oyó como un ataque a su madre, cuyos ingresos habían sido variables. Empezó a defender a todos los pescadores para no hablar de sí misma. Maite mostró registros donde coincidían la caída de crías y las capturas del torneo. Cora reconoció su propia firma, quiso discutir el método y después dejó la hoja sobre la mesa. La reparación exige reducir ingreso una temporada y negociar el reparto; una disculpa no devuelve al agua lo que ya salió de ella.

**Cuando no ofrece una misión:**

Cuenta anécdotas exageradas señalando cuáles adornó. Le gusta cocinar pescado con personas que no esperan una clase de pesca, y acompaña a Mara a caminar cuando consigue un relevo. Tras el arco conserva el cartel del torneo, con fecha y una nota de lo que faltaba medir. Puede seguir queriendo ganar otro sin repetir el abuso ni vivir castigándose por haber deseado reconocimiento.

**Ante Fuatia:**

Pide a Fuatia proteger el río y teme usar esa protección como sello comercial. Una captura bendecida no se convierte en sostenible por su nombre. Quiere que la diosa explique cuánto se puede extraer y acepte contrastar el criterio con habitantes que dependen del lugar. No comprará absolución ofreciendo el pez más hermoso en un altar.

**Conversaciones personales:**

##### VID_pescadora_1 · Antes del cambio

> **Cora:** Julián me vio devolver una línea para no atrapar un ave. Nadie me aplaudió; todavía me acuerdo.
> **Mara:** ¿Querías aplausos por el ave o que alguien supiera que tú también sabías cuidar?
> **Cora:** Lo segundo, creo. Luego conseguí un cartel enorme por hacer exactamente lo contrario.
> **Mara:** Podemos guardar el cartel. También sirve para recordar qué cosas sí reciben aplausos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_pescadora_2 · Después del arco personal

> **Cora:** Hoy volví con menos. No voy a adornar el cuento diciendo que fue una gran jornada.
> **Mara:** ¿Quieres que caminemos o prefieres hablar de lo que vas a vender?
> **Cora:** Caminemos. Tengo una idea para otro torneo y necesito que me escuches antes de enamorarme del cartel.
> **Mara:** Entonces cuéntamela despacio. Todavía no hemos llegado al río.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar dos puntos en horas agrícolas válidas.

> **Cora:** Te podría contar el pez más grande. Hoy necesito contarte el que no debí llevarme.

**Acto 2:** Capturar con acción real y devolver ejemplar juvenil.

> **Cora:** Olga no quería arruinarme la venta. Quería que pudiera volver a vender el año siguiente.

**Acto 3:** Publicar calendario de presión y rutas alternativas.

> **Cora:** La próxima historia tendrá una captura menos y un río más.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Registro público o enseñanza en muelle.

> **Cora · respuesta 1:** Público: Pondré también mis cifras malas.

> **Cora · respuesta 2:** Muelle: Dejaré que Tina explique la devolución.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La captura que vuelve». Calendario de presión de pesca por puntos visitados; conserva horarios, probabilidades y cuotas reales. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Darío · `minero`

**Pasado:** Darío, 49, era mensajero de superficie cuando ocurrió el accidente de Piedralumbre. Buscó explicaciones hasta volverse explorador de roca; durante años creyó que conocer cada veta impediría cualquier desgracia.

**Presente y personalidad:** Ordena botas por desgaste y compara cafés con solemnidad absurda. Trabaja bien solo y comunica mal cuando necesita ayuda. Los cuadernos técnicos de la mina son trabajo de cuadrillas, no revelaciones escritas por él siglos atrás.

**Cambio:** Admite rutas desconocidas, entrega planos incompletos con su incertidumbre y acepta acompañante. No promete que una receta rápida elimina riesgos.

**Vínculos:** Eloy, Bruno, Úrsula. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_10`.

#### El tramo que no conozco · `V_minero`

**Primeros años y lo que aprendió a querer:**

De niño Darío se metía piedras en los bolsillos hasta romper las costuras y su madre decía que acabaría llevando el suelo a casa. Le gustaban las formas que no podían fabricarse con una regla. Empezó llevando recados de superficie porque quería ver las galerías sin fingir una experiencia que no tenía. Gonzalo le prestaba mapas de sectores tranquilos y él los copiaba junto a la cena. El oficio llegó primero como curiosidad y placer; no nació íntegramente del accidente que después reorganizó su vida.

**Aprendizaje, decisiones y vínculos:**

En AV 281 tenía dieciocho años, la misma edad de Bruno. Entregó una orden cuyo texto admitía dos lecturas y vio que una persona buscaba al responsable para preguntar. Darío no era quien decidió el cierre ni puede atribuirse haber sabido lo que ocurriría. Durante años, sin embargo, construyó una versión donde habría podido impedirlo siendo más insistente. La culpa le daba una explicación y también una identidad: si el desastre había sido evitable por él, estudiar lo suficiente impediría el siguiente.

**Lo que cambia y lo que todavía pesa:**

Tiempo después encontró una veta rentable y entregó un plano como definitivo. Vera detectó una zona sin medir y él sostuvo que no cambiaba la ruta. Ambos regresaron a revisarla; una grieta nueva obligaba a cambiar el paso. Nada trágico ocurrió aquella vez y por eso el error fue fácil de esconder. Darío decide contarlo en su arco precisamente porque no quiere necesitar otra desgracia para reconocer límites. Con Bruno puede hablar del placer de encontrar roca, además de la tarde que siempre los vuelve mensajeros de dieciocho años.

**Cuando no ofrece una misión:**

Lava una piedra durante conversaciones difíciles porque el movimiento lo tranquiliza. Conserva colecciones por textura, no solo por valor, y tiene sentido del humor sobre las cosas que tarda en tirar. Después de su misión admite una zona desconocida sin poner inmediatamente una excusa. Puede negarse a explorar por curiosidad ajena, descansar junto al río y seguir siendo un minero respetado aunque una galería quede para otro día.

**Ante Fuatia:**

Sabe que Fuatia siente cada extracción y no desea convertir su oficio en una provocación. Presenta devolución de terreno, límites y seguridad; desconfía de una aprobación divina usada para eludir todo informe. Puede preguntarle si el oro destinado a una reparación y el destinado a ostentar son la misma herida. Acepta que ella no valore esa diferencia y negocia sin fingir que ya comparten criterio.

**Conversaciones personales:**

##### VID_minero_1 · Antes del cambio

> **Darío:** Antes de la galería me gustaban piedras sin utilidad. Luego empecé a explicar para qué servía cada una.
> **Bruno:** Como si encontrarlas bonitas no justificara traerlas a casa.
> **Darío:** Esta no sirve para nada. Me la quedé igual. Voy a intentar decirlo sin una disculpa.
> **Bruno:** Por fin un material que no vas a pedirme transformar antes del almuerzo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_minero_2 · Después del arco personal

> **Vera:** Dejaste el espacio blanco en el plano. La gente preguntará qué falta.
> **Darío:** Que pregunten. Una vez lo llené porque me avergonzaba volver sin respuesta.
> **Vera:** Podemos fechar la próxima revisión sin prometer que lo sabremos todo.
> **Darío:** Y hoy podemos cenar hablando de algo que no tenga una grieta.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Leer cuaderno minero recuperado legítimamente o ficha pública equivalente.

> **Darío:** El hueco en el plano no es un desafío. Es información que todavía no tenemos.

**Acto 2:** Inspeccionar salida y tres señales sin generar mineral extra.

> **Darío:** Yo dibujaba una línea para no soportar el blanco. Alguien podía seguirla creyendo que la había recorrido.

**Acto 3:** Marcar incertidumbre y ruta de retirada.

> **Darío:** Este mapa tiene un límite. Por eso ahora sí puedo firmarlo.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Añadir baliza o cerrar ramal para estudio.

> **Darío · respuesta 1:** Baliza: Indicará regreso, no una promesa de paso.

> **Darío · respuesta 2:** Cierre: Anotaremos cuándo revisarlo; no desaparecerá del registro.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «El tramo que no conozco». Mapa anotable de retirada con incertidumbres y balizas; no revela mineral, pisos ni tesoros sin recorrer. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Vera · `exploradora`

**Pasado:** Vera, 30, empezó guiando visitantes para ahorrar y viajar. Se perdió en una ruta que había vendido como fácil; Ulises la encontró y nunca usó su error para ridiculizarla. Desde entonces confunde precaución con revisar cada decisión ajena.

**Presente y personalidad:** Le gustan mapas con manchas de comida y colecciona palabras de saludo. Habla deprisa, se impacienta ante leyendas vagas y tiene miedo a decir no sé delante de aprendices.

**Cambio:** Publica mapas con accesibilidad, costo y fecha de revisión. Deja que una ruta se diseñe colectivamente y no se atribuye los conocimientos locales.

**Vínculos:** Ulises, Paloma, Samira. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_11`.

#### Dos caminos que sirven · `V_exploradora`

**Primeros años y lo que aprendió a querer:**

Vera creció escuchando viajeros con la atención de quien imaginaba irse antes de tener una mochila propia. Dibujaba rutas que empezaban en lugares conocidos y terminaban fuera del papel. Al ahorrar para el primer viaje descubrió que también disfrutaba explicar caminos a personas recién llegadas. La gratitud de un visitante podía hacerle sentir que pertenecía a un sitio sin quedarse en él. Empezó a confundir reconocimiento con prueba de haber entendido un territorio. Un mapa muy limpio le resultaba más convincente que una conversación difícil con quien vivía allí.

**Aprendizaje, decisiones y vínculos:**

Vendió una ruta como fácil porque necesitaba completar su ingreso y otras guías parecían igual de seguras. Al perderse intentó recordar el folleto en vez de mirar el terreno. Ulises la encontró y preguntó si tenía agua, sin reclamar que una guía debiera saber volver. Vera esperaba humillación y casi le ofreció dinero por callarse. Él aceptó registrar la ruta mal descrita, no convertir el auxilio en deuda personal. Le costó más soportar esa cortesía que habría podido costarle una burla conocida.

**Lo que cambia y lo que todavía pesa:**

Tras el rescate quiso impedir todo riesgo ajeno. Corregía planes sin preguntar, evitaba recomendar caminos que otros usaban y respondía a una duda con instrucciones adicionales. Paloma le señaló que estaba convirtiendo acompañar en obtener permiso. Vera dejó de hablarle una semana, convencida de que a nadie importaba la seguridad. Solo después pudo recordar que Ulises le había permitido decidir qué contar. Su arco no consiste en tomar riesgos mayores: aprende a repartir la autoridad sobre un recorrido.

**Cuando no ofrece una misión:**

Le gusta quedarse una tarde mirando actividad de plaza sin convertirla en visita guiada. Lleva dos lápices porque perder uno aún le irrita de manera desproporcionada. Tras su misión marca fecha, incertidumbre y aportes locales; también admite que una ruta simplemente le gusta. Puede acompañar a Darío sin tomarle decisiones y preguntar qué quiere mirar antes de sacar el mapa.

**Ante Fuatia:**

Fuatia le parece una aliada capaz de mantener caminos seguros y una autoridad que podría cerrar uno porque rechaza a quien lo usa. Vera quiere rutas de salida incluso para alguien juzgado. No exige que toda prohibición desaparezca: pide que tenga motivo, revisión y alternativa. Le resulta incómodo descubrir que antes defendía cierres tan personales como los que ahora cuestiona.

**Conversaciones personales:**

##### VID_exploradora_1 · Antes del cambio

> **Vera:** Cuando Ulises me encontró, yo seguía mirando el folleto. El bosque estaba delante y parecía menos real.
> **Paloma:** Si lo hubieras escrito tú, también querrías que el papel te diera la razón.
> **Vera:** Lo había escrito yo. Esa es la parte que siempre tardaba en contar.
> **Paloma:** Bueno. Ahora tenemos una historia con todas sus páginas, aunque no una versión cómoda.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_exploradora_2 · Después del arco personal

> **Vera:** Dejé de explicarte por qué deberías tomar el camino corto. ¿Lo notaste?
> **Darío:** Sí. Iba a escogerlo, pero me dio curiosidad poder decirte que quería el otro.
> **Vera:** Qué difícil me lo estás poniendo, Darío.
> **Darío:** Podemos llevar los dos lápices. Esta vez no hace falta decidir quién conduce toda la tarde.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Recorrer dos rutas autorizadas y anotar obstáculos.

> **Vera:** Un camino corto puede ser larguísimo para quien lo cruza con un carro.

**Acto 2:** Consultar a residente y contrastar desgaste.

> **Vera:** Ulises no me salvó por conocer todo. Me salvó porque preguntó dónde había dejado de saber.

**Acto 3:** Publicar opción rápida y opción protegida sin declarar una universal.

> **Vera:** El mapa llevará nuestros nombres y la fecha. Que nadie lo confunda con el terreno.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Priorizar sombra o firmeza.

> **Vera · respuesta 1:** Sombra: Pondremos el consumo de agua en la leyenda.

> **Vera · respuesta 2:** Firmeza: Anotaremos que no protege igual del calor.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Dos caminos que sirven». Comparador de distancia, sombra y obstáculos de rutas conocidas, con fecha y costo de regreso. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Simón · `cocinero`

**Pasado:** Simón, 34, entró a la posada como lavaplatos y aprendió de Lucio. La primera reseña elogiosa le hizo repetir un menú caro hasta endeudarse. Rosa lo sostuvo y todavía usa esa ayuda como argumento en discusiones.

**Presente y personalidad:** Es creativo y susceptible, prueba con demasiada sal cuando está ansioso. Disfruta comida sencilla en secreto porque siente que un chef debería preferir cosas raras.

**Cambio:** Diseña platos aprovechables sin convertir sobrantes en comida insegura. Le pide a Rosa una relación de trabajo con cuentas claras, no gratitud eterna.

**Vínculos:** Rosa, Ciro, Saúl. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_06`.

#### Lo que alcanza una olla · `V_cocinero`

**Primeros años y lo que aprendió a querer:**

Simón empezó lavando platos porque el turno incluía comida y un lugar donde sentarse. Se entretenía adivinando qué huésped había dejado más pan y Lucio le pidió abandonar el juego: un plato no explicaba la jornada de nadie. Después lo invitó a probar una salsa sin preguntar si tenía talento. Para Simón fue una novedad que aprender un oficio no empezara con un examen. Durante meses lavó y escuchó; cuando recibió su primera tarea de cocina, tuvo más miedo de decepcionar a ese hombre paciente que de equivocarse ante clientes.

**Aprendizaje, decisiones y vínculos:**

La reseña elogiosa describió un menú caro y Simón intentó repetirlo incluso cuando cambiaron los proveedores. Confundió un reconocimiento con una obligación de permanecer idéntico. Rosa cubrió una compra atrasada y luego mencionó su ayuda en una discusión sobre horarios. Él respondió que podía marcharse, aunque no tenía ahorros para hacerlo. Ninguno quería perder al otro; ambos usaron la inseguridad como argumento. La deuda se volvió una manera de hablar de autoridad que evitaba decir cuánto necesitaban la continuidad de la posada.

**Lo que cambia y lo que todavía pesa:**

Al morir Lucio, Simón temió que cualquier innovación pareciera falta de respeto. Conservó sabores que no le gustaban y llamó homenaje a la inmovilidad. Un huésped preguntó qué plato era suyo y no supo responder sin nombrar al maestro. Su arco permite cocinar con memoria y autoría propias. Puede agradecer a Rosa la ayuda mientras exige registrar qué ya pagó y qué aún debe. No necesita convertir a Lucio en un maestro equivocado para dejar de repetir todas sus elecciones.

**Cuando no ofrece una misión:**

Prueba recetas en cantidades pequeñas, escribe nombres ridículos en etiquetas ajenas y se ofende un poco si alguien cambia la sal sin probar. Tiene domingos en que quiere que otro cocine, aunque nadie espere eso del cocinero. Tras su misión acuerda horarios reales con Rosa y conserva un plato de Lucio que sí disfruta. Puede preparar una cena ligera simplemente porque hace calor, sin que el menú tenga que representar su crecimiento personal.

**Ante Fuatia:**

Le preocupa que Fuatia juzgue desperdicio sin ver todos los intentos de aprender. Quiere distinguir una prueba pequeña que permite mejorar de una compra enorme para presumir. Ofrecerá comida producida con límites y pedirá que la bendición no convierta su mesa en comedor obligatorio. Un favor divino no le entrega más manos para cocinar.

**Conversaciones personales:**

##### VID_cocinero_1 · Antes del cambio

> **Simón:** La primera vez que Lucio me dejó probar una salsa pensé que iba a preguntarme cuánto había aprendido.
> **Rosa:** Te preguntó si querías más pan. Siempre empezaba por una cosa bastante concreta.
> **Simón:** Yo tardé un año en dejar de responder como si cada plato fuera un examen.
> **Rosa:** Y yo todavía necesito que me recuerdes sentarme antes de que se enfríe.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_cocinero_2 · Después del arco personal

> **Simón:** Este es mío. Tiene una cosa que Lucio no habría usado y otra que me enseñó él.
> **Rosa:** Si no me gusta, ¿puedo decirlo sin que parezca un juicio sobre tu vida entera?
> **Simón:** Puedes. Preferiría que probaras dos cucharadas antes de reconstruirme la infancia.
> **Rosa:** Trato hecho. Lo de la sal lo discutimos después de cenar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Inventariar ingredientes del catálogo y caducidad aplicable.

> **Simón:** La receta está rica. La cuenta está mintiendo. No puedo servir aplausos cuando se acaba la harina.

**Acto 2:** Cocinar dos porciones con receta ordinaria.

> **Simón:** Lucio decía que primero había que alimentar. Yo oía que había que impresionar.

**Acto 3:** Comparar costo y gustos, acordar menú que no prometa cantidades ausentes.

> **Simón:** Este plato no necesita una historia triste para valer la pena. Necesita llegar caliente.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Menú compartido o porciones reservables.

> **Simón · respuesta 1:** Compartido: Nadie tendrá que competir por el último plato.

> **Simón · respuesta 2:** Reservas: Mostraremos cupos antes de cobrar.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «Lo que alcanza una olla». Variante de emplatado del menú con mismas recetas y cupos; no transforma sobrantes en nuevos productos gratis. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Flora · `botanica`

**Pasado:** Flora, 37, documentó cultivos de familias que antes no aparecían en tratados. Una publicación borró los nombres de sus colaboradoras; respondió obsesionándose con autoría hasta rechazar un dato que no venía de su método.

**Presente y personalidad:** Disfruta dibujar raíces más que flores y habla con las plantas sin afirmar que contesten. Su laboratorio tiene notas hermosas y tazas olvidadas. Aprecia a Eliana pero teme que un rito sustituya registros. Es tía y tutora de Nina: reserva tardes sin experimentos para estar juntas.

**Cambio:** Compara saber agrícola y medición, acredita contribuciones y separa hipótesis de resultado. No demuestra que toda tradición es ciencia ni que toda emoción invalida un dato.

**Vínculos:** Eliana, Tomás, Aitana. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_12`.

#### Una cosecha con nombres · `V_botanica`

**Primeros años y lo que aprendió a querer:**

Flora fue una niña que escribía nombres para no olvidar lo que una vecina le enseñaba mientras trabajaba. La escuela describía plantas con palabras distintas y durante un tiempo creyó que uno de los dos saberes debía estar equivocado. Una misma especie podía recibir varios nombres porque varias personas la usaban de otra forma. Descubrirlo la alegró. Sus primeras libretas mezclan dibujos, recetas y hojas pegadas torcidas. Antes de buscar reconocimiento científico quería poder devolver a alguien una conversación que había recibido como regalo.

**Aprendizaje, decisiones y vínculos:**

Una publicación usó datos que ella había reunido y borró los nombres de colaboradoras locales. Cuando reclamó, un editor ofreció poner su nombre solo en portada. Le tentó aceptar: significaba un lugar profesional que no parecía repetible. Rechazó la solución, pero después empezó a pedir a todos la documentación que a ella le habían negado. Un método destinado a impedir robo acabó rechazando testimonios que no habían podido archivarse. Alma fue quien le preguntó si también se exigiría esa prueba a la vecina de sus libretas infantiles.

**Lo que cambia y lo que todavía pesa:**

Aceptar la tutela escolar de Nina durante la formación de su madre en el puerto cambió el ritmo de su casa. Flora preparó explicaciones precisas para cada duda y descubrió que una niña podía querer compañía al regar, no otra lección. Cuando se secó la fresa de Nina, intentó encontrar la causa antes de atender su vergüenza. La misión recoge esa diferencia: conserva observación y no deja que un resultado defina cuánto cuidó alguien. Su rigor mejora al escuchar; no desaparece en favor de que todos los relatos sean equivalentes.

**Cuando no ofrece una misión:**

Conserva dos mesas, una para muestras y otra donde Nina puede dejar dibujos sin que parezcan experimentos. Le gusta discutir de ciencia y también cocinar siguiendo una receta porque ese día no desea comparar variantes. Después de su arco acredita nombres y límites en la misma ficha. Puede rechazar un dato insuficiente con una explicación comprensible, sin insinuar que quien lo ofrece vale menos.

**Ante Fuatia:**

Desea estudiar los efectos de Fuatia sin reducirla a un recurso de cultivo. Le atrae hablar con alguien que siente el suelo completo y le incomoda que la autoridad divina termine toda discusión. Preguntará por diferencias entre extracción, abuso y recuperación. Si recibe una bendición, registrará resultados y condiciones; un relato de altar sigue siendo relato hasta contrastarlo.

**Conversaciones personales:**

##### VID_botanica_1 · Antes del cambio

> **Flora:** La libreta más vieja tiene grasa de cocina. Un editor quiso limpiarla antes de fotografiarla.
> **Alma:** ¿Porque parecía poco profesional o porque había nombres que no entendía?
> **Flora:** Las dos cosas. Yo también había querido limpiar páginas cuando intentaba que me aceptaran.
> **Alma:** Déjame verla así. Me interesa saber dónde se usaron esas plantas, además de cómo se llamaban.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_botanica_2 · Después del arco personal

> **Nina:** Hoy no le pusiste una etiqueta a mi dibujo. Pensé que se te había olvidado.
> **Flora:** No todo tiene que explicar qué especie es. Me gustó el color que escogiste.
> **Nina:** Es verde inventado. La planta de verdad no tiene ese tono.
> **Flora:** Podemos conservar las dos. El dibujo no le está quitando el nombre a la planta.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar dos surcos bajo condiciones registradas.

> **Flora:** Si la prueba no sale como espero, igual sale información. Recuérdamelo cuando me veas borrando.

**Acto 2:** Entrevistar a Tomás y contrastar su técnica.

> **Flora:** Tomás sabía algo que mi tabla no preguntaba. Yo sabía algo que su costumbre no podía medir.

**Acto 3:** Publicar ficha con límites y autoría compartida.

> **Flora:** La ficha tiene dos firmas y una pregunta abierta. Es un buen resultado.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Prueba de suelo o prueba de riego.

> **Flora · respuesta 1:** Suelo: Mantendremos el agua comparable.

> **Flora · respuesta 2:** Riego: No añadiremos un fertilizante para esconder la diferencia.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «Una cosecha con nombres». Comparador de dos surcos con condiciones observadas, autoría y calendario sin modificar su crecimiento. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Tomás · `agricultor`

**Pasado:** Tomás, 50, sostuvo su parcela durante la sequía reservando agua que después faltó a otra familia. Alegó una norma de propiedad y evitó las reuniones donde podía cambiarse. Nunca fue un villano secreto: fue una persona que hizo una elección cómoda con efectos graves.

**Presente y personalidad:** Es trabajador, le gusta arreglar mangos de pala y presume de zanahorias aunque no gane concursos. Tiene afecto por Mara y la evita cuando hablan de agua. Es abuelo de Leo y aprende a escuchar sus mapas sin convertir cada paseo en una clase de cultivo.

**Cambio:** Reconoce beneficio recibido y participa en un reparto medible. Reparar exige trabajo y recursos disponibles, no que los otros olviden lo ocurrido.

**Vínculos:** Inés, Mara, Dalia. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_12`.

#### La acequia de todos · `V_agricultor`

**Primeros años y lo que aprendió a querer:**

Tomás creció aprendiendo que una parcela propia protegía de depender de una familia ajena. Su padre calculaba reservas con preocupación y celebraba cosechas sin mostrar cuánto miedo había pasado antes. Tomás recibió esa combinación como sensatez. Cuando consiguió la tierra, llevaba cuentas que no enseñaba porque la incertidumbre le parecía una vergüenza personal. Hubo temporadas generosas en que ayudó a vecinos de verdad. Esos recuerdos hicieron más fácil defender después una decisión injusta: podía enumerar ayuda anterior cuando alguien reclamaba por lo que estaba haciendo ahora.

**Aprendizaje, decisiones y vínculos:**

Durante AV 294 reservó agua con una norma que lo favorecía. Sabía que la parcela vecina también esperaba riego y evitó pasar junto al canal después de cerrar su turno. Le había prometido a su familia no perder lo construido y llamó responsabilidad a conservarlo a cualquier precio. Mara propuso revisar el reparto; él pidió que trajeran una modificación escrita antes de discutir. No necesitaba demostrar que la regla era justa, solo conservarla hasta terminar su cosecha. La misma energía que antes usaba para trabajar se volvió habilidad para posponer una conversación.

**Lo que cambia y lo que todavía pesa:**

El nacimiento de Leo y luego la organización de su residencia escolar le dieron alegrías que no quería mezclar con aquel conflicto. Le enseñaba rutas y hablaba del huerto como fruto de esfuerzo exclusivamente propio. Una pregunta de Alma sobre el canal encontró a Leo repitiendo su versión. Tomás se vio transmitiendo comodidad como si fuera una historia inocente. En su misión reconoce el beneficio recibido y aporta recursos reales; no exige que una familia que perdió cosecha le admire por corregirlo. Puede conservar orgullo por su trabajo sin negar la parte sostenida por otros.

**Cuando no ofrece una misión:**

Disfruta inventar cuentos sobre herramientas viejas y exagerar cuánto cargaba de joven. Espera cartas de la madre de Leo y las lee sin fingir que no le importan sus visitas. Tras su arco continúa discutiendo costos y no regalará su parcela para parecer cambiado. En la Casa del Huerto respeta espacios propios de Flora y Nina; compartir dirección no los convierte en una pareja ni en una sola familia sin diferencias.

**Ante Fuatia:**

Teme que Fuatia lo vea como vio a quienes se aprovecharon de la naturaleza en su nacimiento. Quisiera una señal de perdón rápido y sabe que buscarla puede eludir su deuda con personas reales. Puede disentir de un castigo sin negar el abuso de agua. La historia permite que su reparación avance aunque siga rezando con miedo y todavía no entienda qué piensa la diosa.

**Conversaciones personales:**

##### VID_agricultor_1 · Antes del cambio

> **Tomás:** A Leo le cuento lo que trabajé para comprar la parcela. Nunca cuánto ayudaron cuando la mantuve.
> **Alma:** Los dos relatos pueden caber en la misma mesa. No va a dejar de quererte por oír el segundo.
> **Tomás:** Me preocupa otra cosa: que aprenda a discutir conmigo y descubra que prefiero no contestar.
> **Alma:** Ya está aprendiendo. Tú todavía puedes aprender a quedarte en la conversación.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_agricultor_2 · Después del arco personal

> **Leo:** ¿Hoy cerraste el canal más temprano porque sobraba agua?
> **Tomás:** Porque no todo el turno era justo. Sobrara o no, había que cambiarlo.
> **Leo:** ¿Entonces podemos dibujar una norma distinta al lado del mapa?
> **Tomás:** Podemos. Y pon mi nombre en la anterior; no quiero que parezca que apareció sola.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar reparto de agua y consumo propio.

> **Tomás:** La norma me daba derecho. La norma también dejaba a Mara sin agua. Nunca puse las dos frases juntas.

**Acto 2:** Limpiar tramo autorizado con aporte de Tomás.

> **Tomás:** No quiero que me digan que todo agricultor habría hecho igual. No todos lo hicieron.

**Acto 3:** Registrar acuerdo de sequía y mecanismo de apelación.

> **Tomás:** Voy a cumplir incluso cuando mi parcela sea la que espere. Si no, el acuerdo no significa nada.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Aporte material o jornadas de trabajo.

> **Tomás · respuesta 1:** Material: No traeré cosas que deban pagar mis vecinos.

> **Tomás · respuesta 2:** Jornadas: Anotaremos horas reales de trabajo, no promesas.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La acequia de todos». Plan de acequia con consumos y turno acordado; no abastece parcelas ni fabrica agua al consultarlo. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Alma · `maestra`

**Pasado:** Alma, 43, estudió para archivar y terminó enseñando después de organizar una escuela durante la sequía. Sus alumnos le hicieron preguntas sobre el escudo que contestó con versiones tranquilizadoras. Supo después que eran incompletas.

**Presente y personalidad:** Es paciente con niños y mordaz con instituciones. Colecciona errores graciosos de su propia escritura y pregunta antes de tocar un trabajo ajeno. Le cuesta admitir una ignorancia delante del aula.

**Cambio:** Enseña cómo verificar y corregir, no solo qué creer. No utiliza a Nina y Leo como detectives de peligro: supervisa sus proyectos y conserva su derecho a jugar.

**Vínculos:** Nina, Leo, Damián. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_13`.

#### La clase donde dije no sé · `V_maestra`

**Primeros años y lo que aprendió a querer:**

Alma prefería archivar objetos a explicar frente a un salón. De niña elaboraba pequeñas cajas para historias que había oído y disfrutaba que alguien pidiera consultarlas. Su primera clase surgió cuando una maestra viajera perdió un turno: Alma sabía dónde estaba todo y supusieron que podría hablar de ello. Tartamudeó, olvidó un dato y se divirtió al escuchar otra pregunta que no figuraba en su plan. No descubrió una vocación inevitable; encontró una tarea difícil que quería intentar de nuevo.

**Aprendizaje, decisiones y vínculos:**

La escuela de la sequía empezó con horarios que cambiaban para acompañar repartos de agua. Alma cuidó que alumnos pudieran aprender sin servir de mensajeros de peligros adultos. También simplificó historias del escudo para que durmieran tranquilos. La comunidad agradecía esas explicaciones y la gratitud dificultó revisar lo que había dicho. Una madre preguntó qué parte provenía de documento y cuál de una esperanza. Alma explicó la fuente, pero dejó intacta la lámina escolar. No sabía cómo admitir una incertidumbre sin sentir que retiraba la seguridad que ofrecía.

**Lo que cambia y lo que todavía pesa:**

Al encontrar registros contradictorios intentó resolverlo antes de hablar con el grupo. Pasaron semanas y estudiantes seguían copiando la lámina. Flora le señaló que enseñar a verificar exigía mostrar también una corrección propia. Su misión incluye revisar el material con adultos responsables; Nina y Leo no se convierten en investigadores enviados a una frontera. Alma distingue la curiosidad que debe recibir respuesta de una carga que no corresponde a niños. Puede ser querida por enseñar y cuestionada por lo que enseñó sin perder toda legitimidad.

**Cuando no ofrece una misión:**

Prefiere merendar mientras corrige y canta mal sin vergüenza fuera del salón. Después de su arco la lámina tiene fecha, fuente y una parte abierta que no llama error a toda pregunta nueva. Sigue preparando clases porque improvisar permanentemente no es respeto al alumno. Puede cerrar el archivo una tarde y conversar con Serena de algo que no termine convertido en ejemplo pedagógico.

**Ante Fuatia:**

No permite que Fuatia se use para amenazar a un niño que dejó secar una planta. Su nacimiento juzgó explotación consciente, no torpeza infantil. Quiere enseñar la historia con su protección y sus muertes, incluyendo opiniones distintas de adultos. Si la diosa exige devoción como prueba de cuidado, Alma defiende que conservar un arroyo puede aprenderse sin prometerle un altar.

**Conversaciones personales:**

##### VID_maestra_1 · Antes del cambio

> **Alma:** La primera clase salió mal y por eso quise volver. Todo lo que me faltó cabía en una tarde siguiente.
> **Damián:** Yo habría cambiado la copia para que no quedara registro del tropiezo.
> **Alma:** No había copia. Quedaban niños que recordaban perfectamente lo que yo había dicho.
> **Damián:** Una fuente mucho menos cómoda que un folio perdido.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_maestra_2 · Después del arco personal

> **Alma:** Hoy uno preguntó por qué corregí la lámina. Esperaba una discusión; quería saber dónde escribir la fecha.
> **Serena:** A veces la vergüenza prepara más juicio del que el otro trae.
> **Alma:** Sí. También preguntó qué estaba estudiando yo. Me gustó no tener que inventarme una respuesta terminada.
> **Serena:** Guardemos el trabajo. Esta tarde solo estamos escogiendo fruta.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar una lección antigua y fuente pública.

> **Alma:** No vamos a examinar a los niños sobre una verdad que los adultos escondimos.

**Acto 2:** Preparar demostración segura con dos resultados posibles.

> **Alma:** Puedo corregir el tablero. También tengo que corregir cómo respondí cuando preguntaron.

**Acto 3:** Enseñar corrección y permitir preguntas sin premios por respuesta deseada.

> **Alma:** Mañana traeremos otra pregunta. La clase no terminó mal por no resolverlas todas.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Experimento o lectura comparada.

> **Alma · respuesta 1:** Experimento: Lo haremos sin instrumentos peligrosos.

> **Alma · respuesta 2:** Lectura: Cada voz conservará su propia frase.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La clase donde dije no sé». Página de tutorial con ejemplo seguro y corrección consultable; no concede experiencia por releer. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Lía · `musica`

**Pasado:** Lía, 26, aprendió música con Sora a través de un instrumento del archivo y las historias de Anselmo. Tocaba en actos oficiales hasta notar que usaban sus canciones para cerrar discusiones. Renunció a ese puesto sin renunciar a tocar.

**Presente y personalidad:** Se ríe con todo el cuerpo y deja silencios largos al afinar. Quiere ser escuchada, pero a veces interpreta hablar encima de la música como desprecio. Tiene una amistad amorosa posible con Renata, ambas adultas, que no define el jugador.

**Cambio:** Compone un concierto que admite pausas, ruido y retiro. Su relación privada solo se revela si ambas lo autorizan; ninguna recompensa obliga a divulgarla.

**Vínculos:** Renata, Sora, Anselmo. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_13`.

#### Una canción con sitio para irse · `V_musica`

**Primeros años y lo que aprendió a querer:**

Lía empezó con un instrumento prestado cuyo estuche olía a madera húmeda. Sora la escuchaba repetir tres notas sin anunciar que sería alguien importante. Anselmo contaba historias que ella transformaba en melodías distintas de las que él recordaba y discutían entre risas. Aquella libertad fue su primer hogar musical. Una tarde tocó tan fuerte que una vecina golpeó la pared; Lía lo tomó como prueba de que había logrado conmoverla. Después descubrió que también vivían personas intentando dormir al otro lado de su entusiasmo.

**Aprendizaje, decisiones y vínculos:**

Los actos oficiales le dieron pago y una audiencia que no tendría sola. Le indicaban cuánto debía durar la canción y ella disfrutaba ajustarla, hasta que le pidieron llenar una discusión que aún no había terminado. Tocó de todos modos. Quienes preguntaban dejaron de oírse entre sí y alguien la felicitó por mejorar el ambiente. No fue una única escena de engaño: aceptó varios encargos porque temía que negarse borrara todas las oportunidades anteriores. Su renuncia tuvo pérdida económica y no una plaza que la aplaudiera automáticamente.

**Lo que cambia y lo que todavía pesa:**

Renata reparó una correa y cobró menos horas de las trabajadas. Lía interpretó el gesto como cariño; Renata lo describió como una mala costumbre que no quería seguir. Esa conversación adulta ayudó a ambas a no intercambiar amor por disponibilidad. Decidieron una relación privada con acuerdos sobre ensayos, descansos y qué contar a vecinos. No guardan una falta ni preparan una revelación obligatoria. El secreto permite al jugador respetar su límite, y ninguna de las dos debe justificar quién es para ganar el premio.

**Cuando no ofrece una misión:**

Le gusta improvisar letras absurdas al lavar platos, comprar telas que Renata dice que no combinan y escuchar una canción sin analizarla. Después de su arco admite que retirarse de un concierto no constituye un ataque a su oficio. Puede seguir queriendo aplausos y también dejar un ensayo para otra tarde. Su relación tiene desacuerdos cotidianos que no presagian ruptura ni se convierten en misiones para terceros.

**Ante Fuatia:**

Encuentra belleza en la voz que el viento adquiere cerca de Fuatia. Se niega a componer un himno que vuelva admirable cualquier castigo porque lo dicte una diosa. Puede ofrecer una pieza de gratitud por proteger un humedal y otra donde sobrevivientes expresen incomodidad. Un altar necesita permitir silencio; una canción no hará callar la discusión por sus consecuencias.

**Conversaciones personales:**

##### VID_musica_1 · Antes del cambio

> **Lía:** Sora oyó estas tres notas cientos de veces. Nunca me dijo que dejara de intentar la cuarta.
> **Renata:** Yo habría pedido un descanso. Y luego otra repetición, si te veía contenta.
> **Lía:** Antes habría oído solo lo primero. Como si quererme fuera tener oídos inagotables.
> **Renata:** Hoy puedo pedirlo sin que conviertas la tarde en una prueba. Me gusta eso.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_musica_2 · Después del arco personal

> **Renata:** Cobré todas las horas de la correa. Me dieron ganas de dejar la última por fuera otra vez.
> **Lía:** La pago completa y te invito a cenar por una razón distinta de la factura.
> **Renata:** Bien. Y quiero cenar donde no tengamos que escuchar tus canciones oficiales.
> **Lía:** También quiero eso. Tengo una nueva bastante ridícula, pero puede esperar al postre.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Escuchar tres sonidos voluntarios de oficios.

> **Lía:** No quiero una plaza callada porque se le prohibió hablar. Quiero saber qué tiene ganas de escuchar.

**Acto 2:** Ensayar sin impedir conversaciones ni descanso.

> **Lía:** Renata no dejó de querer mi música por pedirme menos volumen. Me estaba diciendo cómo poder quedarse.

**Acto 3:** Celebrar concierto con salida tranquila y asientos accesibles.

> **Lía:** La última nota no exige aplausos. Ya podemos volver a conversar.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Concierto de tarde o velada breve.

> **Lía · respuesta 1:** Tarde: Cuidaremos el horario de la escuela.

> **Lía · respuesta 2:** Breve: Dejaré una versión para quienes no pudieron venir.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «Una canción con sitio para irse». Recuerdo del concierto y acceso a su reproducción cuando exista pista producida; opción silenciosa equivalente. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Gael · `guardabosques`

**Pasado:** Gael, 36, llegó a Brumaverde como aprendiz de Silvana. Detuvo una tala legal sin consultar a Roque, que necesitaba madera para una rampa. Ganó fama de protector y perdió una amistad.

**Presente y personalidad:** Reconoce árboles por sombra y disfruta carpintería pequeña aunque lo oculte. Es severo cuando teme parecer complaciente. Cree que necesita siempre una negativa para justificar su oficio.

**Cambio:** Aprende a proteger procesos y negociar extracción regenerativa, no congelar el bosque. Acepta revisar un permiso que firmó mal sin permitir explotación ilimitada.

**Vínculos:** Silvana, Roque, Vera. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_14`.

#### La rama que sí se puede cortar · `V_guardabosques`

**Primeros años y lo que aprendió a querer:**

Gael llegó a Brumaverde buscando trabajo y una vida que no dependiera de conseguir encargos cada semana. Silvana le enseñó a caminar mirando marcas viejas antes de nuevas hojas. Le gustó pertenecer a un cuidado que nadie podría terminar en una temporada. Una tarde encontró un árbol cortado por una tormenta y quiso retirarlo; otro habitante señaló brotes que ya crecían a su lado. Gael empezó a entender procesos largos, pero aún deseaba una frontera simple donde pudiera distinguir al protector del destructor de un vistazo.

**Aprendizaje, decisiones y vínculos:**

Detuvo una tala legal que Roque había previsto para una rampa. Había leído el permiso, pero interpretó la urgencia como presión de un oficio menos cuidadoso que el suyo. El pueblo celebró su firmeza antes de saber para qué era la madera. Gael sintió orgullo y no contó la necesidad que había decidido dejar para después. Roque tuvo que volver a explicar el proyecto frente a vecinos que ya lo sospechaban abusivo. Esa humillación, más que el retraso, rompió la relación.

**Lo que cambia y lo que todavía pesa:**

Al ver la rampa terminada por otra vía, Gael quiso participar en su inauguración y recibió una negativa. Se enfadó porque la reparación le parecía suficiente para recuperar trato. Silvana preguntó a quién pretendía cuidar al insistir en asistir. Su arco revisa permisos reales y deja que Roque no ofrezca amistad inmediata. Puede conservar una defensa firme del bosque sin apropiarse de las necesidades humanas que deben discutir sus límites. No demuestra haber cambiado dejando que cualquier extracción pase.

**Cuando no ofrece una misión:**

Conoce aves por horario y hace marcas torcidas en su propia puerta porque nunca termina de medirla. Tiene interés en música sin talento y se ríe cuando Lía le presta percusión sencilla. Después de su misión vuelve a un lugar reparado para observar, no a comprobar que el autor agradezca su visita. Puede admitir una revisión pública de un permiso suyo aunque algunos devotos crean que perder autoridad es perder protección.

**Ante Fuatia:**

Fuatia le da una fuerza difícil de negociar: su ira confirma la idea cómoda de que los límites deberían obedecerse sin explicar. Gael admira su defensa del bosque y sospecha lo fácil que sería usarla para ganar discusiones humanas. Le ofrecerá datos de recuperación y defenderá a Roque frente a una prohibición general. Quiere respeto sin convertirse en portavoz obligatorio de la diosa.

**Conversaciones personales:**

##### VID_guardabosques_1 · Antes del cambio

> **Gael:** La primera vez que dijeron protector del bosque me gustó demasiado para explicar lo de la rampa.
> **Olivia:** Roque todavía tuvo que defender un permiso que tú ya habías leído.
> **Gael:** Yo pensaba que retrasar una necesidad era menos grave que perder un árbol.
> **Olivia:** Si no escuchas la necesidad, cualquier espera puede parecerte pequeña.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_guardabosques_2 · Después del arco personal

> **Gael:** Corregí el permiso. Roque no me invitó a la cena, y no fui a explicarle lo cambiado que estoy.
> **Olivia:** ¿Quieres sentarte aquí o necesitas que la tarde sea otra prueba de paciencia?
> **Gael:** Aquí. Y prefiero que hablemos de algo que todavía me salga sin un informe.
> **Olivia:** Entonces ayúdame con esta puerta. Está torcida y es la mía.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Identificar árbol vivo y madera caída.

> **Gael:** Prohibí cortar antes de preguntar para qué. El árbol siguió en pie; una persona siguió sin entrar a su casa.

**Acto 2:** Consultar necesidad de obra y límite de extracción.

> **Gael:** Roque no pedía el bosque entero. Yo le contesté como si lo pidiera.

**Acto 3:** Señalar zona y observar recuperación por días agrícolas.

> **Gael:** Habrá límites. También habrá razones escritas para quien quiera revisarlos.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Madera caída o poda supervisada.

> **Gael · respuesta 1:** Caída: No arrancaremos hábitats del suelo por llamarlos desperdicio.

> **Gael · respuesta 2:** Poda: La recuperación quedará registrada antes de otra extracción.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La rama que sí se puede cortar». Plan de poda y revisión en zona autorizada, sin aumentar madera disponible por día. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Renata · `artesana`

**Pasado:** Renata, 28, cosía para una compañía itinerante que le pagaba en exposición. Se quedó cuando Olivia compró una reparación y no le pidió agradecer la oportunidad. Aprendió a cobrar, todavía regala más horas de las que puede sostener.

**Presente y personalidad:** Es observadora, guarda hilos por textura y pone apodos a tijeras. Le gustan los conciertos de Lía, no siempre el volumen. Oculta su vínculo por privacidad, no por vergüenza ni tragedia obligatoria.

**Cambio:** Diseña prendas reparables y acuerda cómo compartir una relación sin convertirla en noticia de plaza. Puede negarse a trabajo gratuito incluso para un festival.

**Vínculos:** Lía, Olivia, Sarai. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_15`.

#### La costura que se puede abrir · `V_artesana`

**Primeros años y lo que aprendió a querer:**

Renata viajaba con una compañía que podía recordar una función entera y olvidar quién había cosido sus trajes. Al principio le gustaban los cambios de pueblo: cada habitación permitía imaginar que pronto sería tomada en serio. Aprendió a reparar bajo luz insuficiente y a reconocer qué persona podía esperar mientras ella terminaba una costura. Algunas noches cantaban juntos y era feliz. Esa felicidad hizo más difícil nombrar la explotación: no todos los compañeros la trataban mal, pero ninguno recibía la factura que ella necesitaba cobrar.

**Aprendizaje, decisiones y vínculos:**

El jefe prometía exposición como si pudiera pagarse pan con gente mirando. Renata empezó a trabajar más para demostrar valor, llegando tarde al espectáculo que supuestamente la presentaría. Olivia encargó una reparación, pidió precio y pagó sin convertirlo en un premio. Renata ofreció otra tarea gratis por costumbre y Olivia dijo que no. Esa negativa le resultó extrañamente amable. Quedarse no nació de rechazar todos los viajes, sino de descubrir una relación donde alguien deseaba su trabajo y admitía que costaba.

**Lo que cambia y lo que todavía pesa:**

Al diseñar para un festival aceptó tareas que excedían la jornada y luego se enfadó porque nadie notaba el sacrificio. Lía se ofreció a ayudar creyendo que una relación permitiría evitar hablar de dinero. Renata distinguió compañía, oficio y factura con torpeza inicial; la conversación les permitió una intimidad menos dependiente. Todavía siente miedo cuando entrega un precio nuevo. Su arco no acaba con una valentía que elimina esa sensación: aprende a sostener el importe aunque le tiemble la mano.

**Cuando no ofrece una misión:**

Guarda retales por textura y puede tardar más escogiendo un color para sí misma que haciendo una prenda entera. Le encanta burlarse de nombres solemnes de comida con Simón. Tras su misión reparte trabajo y reconoce límites sin declarar que jamás hará un regalo. Puede regalar una hora por decisión propia; el cambio consiste en que nadie la presuponga ni se la cobre mediante gratitud.

**Ante Fuatia:**

Le interesa Fuatia por su presencia elegante y rechaza copiarla en un traje que deba demostrar devoción. Una prenda blanca sigue requiriendo tela, lavado y reparación. Si la diosa protege a una artesana que usa materiales responsables, Renata querrá seguir pudiendo criticar una sentencia. No entrega su desacuerdo a cambio de un taller bendecido.

**Conversaciones personales:**

##### VID_artesana_1 · Antes del cambio

> **Renata:** Casi escribo otro precio. No porque la tela costara menos; porque me imaginé a alguien frunciendo la cara.
> **Olivia:** Puedes dejar que frunza la cara. La puerta no se repara con mi expresión tampoco.
> **Renata:** Cuando me pagaste la primera vez pensé que acabarías pidiendo un favor enorme.
> **Olivia:** Todavía puedo pedir uno. Tú todavía puedes calcularlo y decirme que no.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_artesana_2 · Después del arco personal

> **Lía:** ¿Esta hora me la regalas porque quieres o porque crees que debo sentirme menos incómoda?
> **Renata:** Porque quiero. La de mañana se cobra y no te voy a querer menos al cobrarla.
> **Lía:** Bien. Hoy ayudo a ordenar retales sin intentar convertirlo en pago.
> **Renata:** Si mezclas los azules, te cobraré la paciencia aparte. Eso sí es una amenaza bastante seria.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Reunir tela ya producida y revisar prenda con permiso.

> **Renata:** Si una costura solo se puede arreglar destruyendo la prenda, no terminé el diseño.

**Acto 2:** Probar dos cierres accesibles sin fabricar duplicados.

> **Renata:** Lía no quiere que cosa toda la noche para que su escenario parezca bonito. Era yo la que no sabía decir hasta aquí.

**Acto 3:** Entregar patrón y tarifa de reparación transparente.

> **Renata:** El patrón queda abierto. Mi jornada no.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Cierre de lazo o broche reutilizable.

> **Renata · respuesta 1:** Lazo: Ajustaremos sin exigir manos fuertes.

> **Renata · respuesta 2:** Broche: La pieza podrá reemplazarse por separado.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La costura que se puede abrir». Patrón de cierre reparable o ajustable de prenda existente; sin aumento universal de defensa. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Nerea · `astronoma`

**Pasado:** Nerea, 33, observó lunas con su madre y sufrió cuando una predicción fallida se convirtió en burla pública. En vez de explicar incertidumbre empezó a anunciar solo hechos seguros. Su hermano Ivo viajó a la estación; llevan dos años discutiendo por cartas que cada uno lee como reproche.

**Presente y personalidad:** Le gusta café frío y hace dibujos diminutos en márgenes de tablas. Es brillante pero reserva datos hasta comprobarlos sola. En secreto disfruta nubes que arruinan sus noches porque la obligan a descansar.

**Cambio:** Comparte intervalos y errores. Repara relación con Ivo sin renunciar a exigir protocolos; su lectura detecta la red de Nath, no predice toda catástrofe.

**Vínculos:** Ivo, Matea, Vera. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_16`.

#### El cielo con margen de error · `V_astronoma`

**Primeros años y lo que aprendió a querer:**

Nerea observaba lunas con su madre y su hermano Ivo usando un instrumento que había que sostener a turnos. Si uno se quedaba más tiempo, otro perdía el momento que esperaba. Las primeras discusiones fueron por esa mirada compartida, no por planetas peligrosos. Le gustaba acertar dónde aparecería una sombra y disfrutar de que alguien confiara en su cálculo. Una noche la predicción falló y llegaron vecinos que habían dejado labores para verla. Nerea quiso esconder el cuaderno; su madre le pidió anotar también esa noche.

**Aprendizaje, decisiones y vínculos:**

Al estudiar observaciones ajenas descubrió errores mucho mayores que el suyo, pero esa información no le devolvió tranquilidad. Empezó a anunciar únicamente resultados seguros y otros la consideraron una profesional más seria. Cada elogio reforzaba la dificultad de mostrar una hipótesis. Ivo quería expediciones y Nerea organizaba razones para posponerlas. Podían hablar durante horas de técnica sin decir que a ella le daba miedo quedarse sin alguien con quien turnarse el instrumento.

**Lo que cambia y lo que todavía pesa:**

Hace dos años Ivo viajó a la estación. Una carta hablaba de lo bien que se veía el planeta y Nerea la leyó como reproche a quien no se atrevía a ir. Él recibió una lista de protocolos y la interpretó como falta de alegría por su trabajo. Ambos seguían escribiendo, empeorando una discusión que creían evitar. En la campaña la señal de Nath exige formular una hipótesis pública. Su misión con Ivo no le pide abandonar protocolos ni viajar para probar afecto: puede decir que tiene miedo, estar orgullosa y conservar razones para exigir reserva.

**Cuando no ofrece una misión:**

Revisa instrumentos con música baja, le encanta un cielo que no está trabajando y tiene pésima letra cuando se entusiasma. Después de su arco publica intervalos y puede admitir que una hipótesis le gusta sin presentarla como prueba. Las cartas a Ivo incluyen una pregunta cotidiana antes del protocolo. Todavía puede tardar en contestar: hay días en que una reparación ocupa una mesa y sus sentimientos no se resuelven con una buena fórmula.

**Ante Fuatia:**

Distingue la presencia de Fuatia en el aire de una profecía sobre cada fenómeno del cielo. Le inquieta el alcance de una sequía global por una sentencia local y pedirá registros de compensación. Puede admirar el poder que apaga volcanes y negarse a usar esa admiración como argumento para cerrar una discusión. Ivo le ayudará a mostrar lo que las estaciones también dependen del balance.

**Conversaciones personales:**

##### VID_astronoma_1 · Antes del cambio

> **Nerea:** A veces miro sin tomar una medida. Mi madre decía que también habíamos subido para eso.
> **Alma:** ¿Tu hermano lo sabe o solo recibe páginas de instrucciones?
> **Nerea:** Recibe demasiadas instrucciones. Yo pensaba que decir cuidado ya decía te extraño.
> **Alma:** Puede decirlo, pero no siempre con suficiente claridad para quien está lejos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_astronoma_2 · Después del arco personal

> **Nerea:** Escribí que estoy orgullosa antes de pedirle revisar reservas. Tuve miedo de que una frase anulara la otra.
> **Paloma:** Las dos llegaron. No tuve que escoger cuál transportar.
> **Nerea:** Gracias. ¿Y había una respuesta que no sonara a informe de misión?
> **Paloma:** Preguntó si sigues perdiendo el lápiz detrás de la oreja. No parecía un reproche.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar tres observaciones en jornadas dormidas.

> **Nerea:** No falló el cielo. Falló el modo en que prometí lo que no sabía.

**Acto 2:** Comparar calibración con Ivo y Matea.

> **Nerea:** Ivo oyó desconfianza cuando yo escribí cuidado. Yo oí abandono cuando él escribió viaje.

**Acto 3:** Publicar pronóstico con intervalo y fecha, no certeza divina.

> **Nerea:** El informe dirá probablemente. Quien lo lea merece conocer también esa palabra.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Carta íntima o informe conjunto.

> **Nerea · respuesta 1:** Carta: Esta parte no irá al archivo sin permiso de Ivo.

> **Nerea · respuesta 2:** Informe: Firmaremos datos juntos y hablaremos de lo demás aparte.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «El cielo con margen de error». Agenda de observación con intervalos de incertidumbre de tres jornadas lógicas, sin cambiar clima ni RNG. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Aurelio · `veterano`

**Pasado:** Aurelio, 64, coordinó convoyes durante el accidente de AV 281 y firmó un cierre ambiguo. Después defendió ocultar documentos del escudo por miedo a otra evacuación. Su autoridad nació de trabajo real y acabó protegiéndose a sí misma.

**Presente y personalidad:** Repara sillas, cuenta historias buenas y cambia de tema cuando llegan a su firma. Quiere seguir siendo útil y confunde utilidad con tener la última palabra. No es alcalde vitalicio.

**Cambio:** Entrega actas, acepta investigación y forma un relevo sin controlar su versión. No se exige perdón de Gonzalo para que la misión concluya.

**Vínculos:** Bruno, Gonzalo, Damián. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_17`.

#### La firma debajo de la orden · `V_veterano`

**Primeros años y lo que aprendió a querer:**

Aurelio empezó transportando provisiones y ganó autoridad porque recordaba quién necesitaba qué antes de que se lo pidieran. Durante sus primeras jornadas resolvía disputas pequeñas llevando dos cantidades distintas en el mismo carro. Le gustaba llegar cuando alguien lo esperaba y sentir que su presencia simplificaba las cosas. Esa utilidad fue real. Con el tiempo empezó a creer que también le correspondía escoger qué información complicaría demasiado a quienes protegía. No heredó una voluntad de ocultar: fue convirtiendo experiencia en derecho a decidir por otros.

**Aprendizaje, decisiones y vínculos:**

Tenía treinta y tres años en AV 281. Firmó una orden ambigua de cierre para que dos responsables pudieran actuar según su evaluación y evitó escribir quién tendría la última decisión. La frase le pareció flexible antes del accidente y razonable incluso al defenderla después. Gonzalo perdió a su brigada. Aurelio sostuvo convoyes y rescates, trabajo necesario que no corrigió la firma anterior. Años más tarde seguía contando primero lo que hizo bien aquella semana, no por falsedad del recuerdo sino por miedo a que un error borrara una vida útil.

**Lo que cambia y lo que todavía pesa:**

Al comenzar la Noche volvió a elegir información restringida para evitar pánico. En AV 305 pidió a Damián reservar un reverso mientras organizaban evacuaciones y dejó sin fecha el final de la reserva. Cuando el peligro inmediato cambió, podía revisar la decisión; eligió conservar capacidad de controlar el relato. Reconocerlo amenaza la reputación con la que aún obtiene obediencia. Su misión culmina entregando documentos y aceptando investigación, no celebrando un arrepentimiento privado. Gonzalo tiene derecho a no perdonarlo y el concejo puede relevarlo aunque muchas personas aún lo quieran.

**Cuando no ofrece una misión:**

Baila sentado, recuerda chistes que nadie le pidió y sabe preparar sopa para mucha gente. Tras el arco puede ofrecer consejo sin presidir toda reunión. Se le escapa un tono de mando y tiene que corregirlo ante quien acaba de interrumpir. No queda excluido de la vida del pueblo como única forma de justicia: sigue teniendo amigos, obligaciones y una autoridad que ahora debe aceptar límites visibles.

**Ante Fuatia:**

Admira a Fuatia por actuar con decisión donde instituciones tardan y teme que quiera condenarlo sin escuchar sus convoyes. La pregunta le devuelve un problema propio: él también pedía que lo útil bastara para confiarle secretos. Puede defender revisión de sentencias divinas incluso mientras responde por la suya. No usará una amenaza de la diosa para cerrar otra investigación humana.

**Conversaciones personales:**

##### VID_veterano_1 · Antes del cambio

> **Aurelio:** Este carro llevaba dos cantidades distintas. Me gustaba que nadie tuviera que discutir delante de mí.
> **Damián:** ¿Pensabas que la paz era que no se oyera discusión?
> **Aurelio:** A veces. Otras entendía bastante bien que solo la estaba aplazando. Las cómodas son las que olvidé explicar.
> **Damián:** Podemos registrar ambas. Tu recuerdo tampoco tiene que cerrar como un acta limpia.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_veterano_2 · Después del arco personal

> **Aurelio:** La reunión terminó sin pedirme consejo. Vine caminando como si hubiera olvidado un trabajo.
> **Rosa:** Puedes ayudar a cortar verduras. Aquí nadie necesita una orden de convoy.
> **Aurelio:** No sé cuánto servir. Antes esa era justamente la cosa que todos me preguntaban.
> **Rosa:** Pregúntame tú hoy. La mesa seguirá siendo la misma.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Reconstruir secuencia de tres documentos.

> **Aurelio:** Yo estaba allí. Eso no convierte mi recuerdo en toda la verdad.

**Acto 2:** Escuchar a Gonzalo sin defensa automática.

> **Aurelio:** El cierre tenía dos lecturas. Elegí la que me dejaba dormir y la enseñé como la única.

**Acto 3:** Publicar informe con medidas, compensación y relevo.

> **Aurelio:** Puedo seguir arreglando sillas. La presidencia de esta reunión será de otra persona.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Declaración oral o escrita.

> **Aurelio · respuesta 1:** Oral: No interrumpiré a quien me contradiga.

> **Aurelio · respuesta 2:** Escrita: La firma quedará donde siempre debió estar.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La firma debajo de la orden». Registro de actas y responsabilidades consultable con medidas de reparación; no equivale a perdón de terceros. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Nina · `nina`

**Pasado:** Nina tiene nueve años y vive con su tía y tutora Flora en la Casa del Huerto; Flora no es su madre. Un plantón de fresa se secó mientras estaba de visita; interpretó que una planta muerta era prueba de no quererla suficiente. Su madre realiza una formación agrícola en el puerto y acordó mantener la escuela de Nina y visitas regulares; no es un abandono ni una ausencia misteriosa.

**Presente y personalidad:** Es curiosa, negocia turnos y se enfada si la llaman ayudante perfecta. Guarda piedras que parecen pan. Alma acompaña su proyecto; Mara enseña cuidado sin cargarle responsabilidades adultas.

**Cambio:** Aprende que observar y pedir ayuda también es cuidar. Su infancia sigue teniendo juego, no una profecía o culpa por la seguridad del mundo.

**Vínculos:** Alma, Mara, Leo. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_12`.

#### La maceta de los intentos · `V_nina`

**Primeros años y lo que aprendió a querer:**

Nina recuerda el huerto por sus caminos, no por nombres de especies. Antes de vivir con Flora durante la formación agrícola de su madre en el puerto, jugaba a dar lugares a piedras que parecían animales. Su madre visitaba y Nina quería mostrarle todo lo nuevo sin admitir qué cosas le costaban. Una tarde guardó un dibujo poco terminado porque creía que debía aprovechar la visita enseñando únicamente logros. Flora lo encontró y preguntó si podían mirarlo sin acabarlo. A Nina le sorprendió que algo a medias también mereciera una conversación.

**Aprendizaje, decisiones y vínculos:**

El plantón de fresa le parecía un encargo adulto y quería cumplirlo sola. Cuando se secó, escondió el recipiente detrás de otros para evitar una explicación que ya imaginaba. No había cometido un abuso ni recibido castigo divino: estaba aprendiendo y le faltaba ayuda. Le costó decirlo porque en la escuela se hablaba mucho de cuidar y ella pensó que perder algo demostraba cuánto había querido. Su madre no suspendió visitas ni Flora retiró el encargo. El cambio fue acordar cómo pedir compañía antes de que una duda se convirtiera en secreto.

**Lo que cambia y lo que todavía pesa:**

Durante un proyecto escolar quiso presentar una planta de crecimiento rápido para no volver a mostrar un fracaso. Leo propuso dibujar también lo que no brotaba y Nina lo acusó de querer hacerla quedar mal. Luego pudo ver que él dibujaba rutas sin saber aún todos sus destinos. La misión permite observar, regar según reglas y comparar sin atribuir moral al resultado. Nina puede seguir creyendo en historias de diosas sin sentir que debe obtener una cosecha perfecta para ser digna de protección.

**Cuando no ofrece una misión:**

Dibuja hojas imposibles, comparte meriendas y a veces quiere que adultos le expliquen algo sin corregir también el dibujo que lleva. Después de su arco pide ayuda y otros días vuelve a querer hacerlo sola. Su madre mantiene formación, contacto y visitas acordadas; no es una ausencia que la niña deba solucionar. La aventura sigue siendo un mundo al que mirar desde lugares seguros, con derecho a aburrirse y jugar.

**Ante Fuatia:**

Quiere saber si Fuatia habla con cada pájaro o si alguno prefiere no contarle cosas. No recibe una profecía ni la responsabilidad de cambiar a la diosa. Alma aclara que una planta seca no equivale a aprovecharse de la naturaleza. Nina puede levantar un altar de juego y desmontarlo después sin perder amistad, protección o cariño.

**Conversaciones personales:**

##### VID_nina_1 · Antes del cambio

> **Nina:** Cuando venga mamá quiero mostrarle el dibujo entero. Si no lo termino quizá parezca que no hice nada.
> **Flora:** También puedes contarle qué estabas intentando. No tiene que venir a calificar tu semana.
> **Nina:** ¿Y puedo decir que me aburrí de colorear hojas verdes?
> **Flora:** Claro. A veces hasta yo me aburro de clasificar todas.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nina_2 · Después del arco personal

> **Nina:** Esta planta todavía no brotó. Hoy no la escondí detrás de la otra.
> **Leo:** Podemos dibujar dónde está. Mi mapa también tiene cosas que no se abren aún.
> **Nina:** Después quiero dibujar una que crezca hacia abajo, pero de mentira.
> **Leo:** Ponemos imaginación al lado. Alma dijo que podemos inventar si avisamos.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Con Alma, comparar maceta seca y sana.

> **Nina:** ¿Si no vuelve a crecer significa que ya no era mi amiga?

**Acto 2:** Preparar sustrato seguro sin herramientas peligrosas.

> **Nina:** Alma dijo que puedo estar triste y plantar otra. Pensé que tenía que escoger una sola cosa.

**Acto 3:** Dibujar crecimiento tras dormir y anotar una pregunta.

> **Nina:** Le voy a poner nombre al dibujo, no a la nota del examen.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Flor de observación o planta alimentaria.

> **Nina · respuesta 1:** Flor: Voy a contar visitas de insectos desde lejos.

> **Nina · respuesta 2:** Alimento: Si crece, preguntaré antes de compartirlo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «La maceta de los intentos». Dibujo de maceta en álbum de hitos, con escena releíble y sin convertirlo en objeto de venta. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Leo · `nino`

**Pasado:** Leo tiene diez años y dibuja rutas con su abuelo Tomás, que comparte la Casa del Huerto con Flora y Nina. Se inventó un atajo para impresionar a Tina y ella llegó a una puerta cerrada. El incidente ocurrió en el pueblo con supervisión, no en un plano hostil. Su madre trabaja por turnos en transporte regional y eligieron una residencia escolar estable con el abuelo; comparte cartas y tardes libres con ella.

**Presente y personalidad:** Le gustan cristales, criaturas y exagerar títulos de mapas. Admira a Vera y se enfada si una corrección se hace delante de todos. Quiere explorar; todavía debe hacerlo acompañado.

**Cambio:** Distingue imaginar una aventura de anunciar una ruta real. Acepta corrección y produce un mapa seguro para otros niños.

**Vínculos:** Alma, Vera, Tina. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_12`.

#### El mapa que dice todavía no · `V_nino`

**Primeros años y lo que aprendió a querer:**

Leo se acostumbró a observar horarios porque su madre trabaja por turnos en transporte regional. Las tardes de visita tenían comidas favoritas y ratos en que ella quería descansar antes de jugar. Vivir con Tomás durante la escuela le dio continuidad sin quitar ese vínculo. El abuelo enseñaba herramientas y exageraba aventuras antiguas; Leo repetía los cuentos con entusiasmo. Cuando aprendió a dibujar rutas quiso que también otros niños lo buscaran a él. Era una forma de pertenecer al grupo, no una vocación de explorar fronteras peligrosas.

**Aprendizaje, decisiones y vínculos:**

Inventó un atajo para impresionar a Tina durante una actividad del pueblo con supervisión. Ella llegó a una puerta cerrada y Leo dijo que debía haber cambiado. Prefería culpar al lugar antes de admitir que había adornado el plano. Tina no tuvo un accidente y no lo convirtió en una tragedia; se enfadó por haber esperado una cosa que él no sabía. El hecho pudo ser pequeño y seguir siendo importante. Leo aprendió que una amistad puede reclamar una verdad sin romperse por una vergüenza.

**Lo que cambia y lo que todavía pesa:**

Alma pidió fechar una revisión y Leo quiso copiar un mapa adulto para que se viera profesional. Vera le mostró símbolos fáciles de leer y explicó que usar otro plano no haría desaparecer lo que faltaba comprobar. La misión mantiene rutas dentro de lugares seguros y distingue imaginación de dato. Tomás también modifica una explicación del canal; Leo descubre que revisar no es algo que adultos ya perfectos exigen a niños. No tiene que resolver el pasado del abuelo para seguir dibujando con él.

**Cuando no ofrece una misión:**

Guarda cartas de su madre junto a figuras que quiere mostrarle, compite por encontrar formas en nubes y puede dejar un proyecto sin convertirlo en promesa. Tras el arco pregunta antes de recomendar un paso y todavía escribe cuentos de expediciones inventadas. En la Casa del Huerto convive con Nina sin que ambos tengan que compartir todo. Su abuelo y Flora coordinan cuidado, no una pareja deducida por dirección.

**Ante Fuatia:**

Le atraen ojos que cambian de color y pregunta si Fuatia puede hacer un viento solo para jugar. Aprende que el poder no convierte un capricho en necesidad y que no tiene que demostrar heroísmo para que un adulto lo quiera. Puede admirar la aparición sin ser mensajero secreto de una secta ni guía enviado a la Noche.

**Conversaciones personales:**

##### VID_nino_1 · Antes del cambio

> **Leo:** Tina dijo que esperó delante de la puerta. Yo dije que seguro antes se abría.
> **Vera:** ¿Lo habías visto alguna vez o querías que el mapa tuviera una sorpresa?
> **Leo:** Quería que me pidiera dibujar el siguiente. Me dio vergüenza no saber tanto.
> **Vera:** Puedes hacer un mapa pequeño que sí conozcas. Una sorpresa no tiene que ser un dato falso.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nino_2 · Después del arco personal

> **Leo:** Aquí dice no comprobado. Antes me parecía que eso estropeaba el dibujo.
> **Tomás:** Yo también dejaba cosas sin explicar para que parecieran mejor hechas.
> **Leo:** Entonces podemos revisar los dos. Después quiero un cuento con un túnel que sí inventamos.
> **Tomás:** Escribimos cuento en la portada. Y tú escoges adónde llega esta vez.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Recorrer patio y plaza con adulto.

> **Leo:** Mi mapa decía secreto porque no sabía si había camino.

**Acto 2:** Marcar dos rutas reales y una imaginaria con símbolos distintos.

> **Leo:** Tina no me pidió que fuera el mejor explorador. Me pidió llegar a la merienda.

**Acto 3:** Probar lectura con Tina y corregirla.

> **Leo:** El dragón dibujado se queda. Ahora dice imaginación.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Mapa con dibujos o con fichas grandes.

> **Leo · respuesta 1:** Dibujos: Alma revisará que se distingan los símbolos.

> **Leo · respuesta 2:** Fichas: Nina probará si se entienden sin leer.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «El mapa que dice todavía no». Mapa infantil que distingue ruta conocida e imaginación; accesible en diario sin revelar zonas nuevas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Paloma · `viajera`

**Pasado:** Paloma, 40, fue correo local antes de abrir rutas regionales. Transportó paquetes del Concejo sin leerlos y creyó que neutralidad significaba no preguntar por sus consecuencias. Teo, su hermano menor, se quedó en el puerto y la acusó de irse cuando había trabajo difícil.

**Presente y personalidad:** Es rápida, recuerda gustos de casas y pierde sus propios guantes. Quiere una habitación que no sea prestada, teme que quedarse la vuelva prescindible. Sus visitas conservan una identidad, no copias por ciudad.

**Cambio:** Adopta manifiestos con procedencia y derecho de rechazo. Se reconcilia con Teo mediante acuerdos, no con una gran disculpa que borra años. Tiene una ruta principal y tiempo libre.

**Vínculos:** Teo, Telmo, Rita. **Naturaleza:** persona_viva. **Hogar planificado:** `pueblo_sol_vivienda_11`.

#### La carta que puedo negarme a llevar · `V_viajera`

**Primeros años y lo que aprendió a querer:**

Paloma empezó de correo local porque disfrutaba conocer las esquinas donde alguien siempre esperaba un paquete. De niña era ella quien recibía cartas de familiares y distinguía noticias por el tamaño del sobre. Teo, su hermano menor, prefería saber de antemano cuánto tardaría en volver. Sus primeras rutas fueron un proyecto compartido: él ayudaba a ordenar y ella traía historias. Con los años convirtió regresar en una parada breve, mientras Teo siguió sosteniendo tareas que los relatos no mostraban. Ninguno recuerda aquella distribución con la misma sensación de justicia.

**Aprendizaje, decisiones y vínculos:**

Al trabajar para el Concejo aceptó la regla de no abrir paquetes y la extendió a no preguntar procedencia ni destino efectivo. Un buen correo, pensaba, no escogía qué noticia merecía llegar. La neutralidad de la entrega le daba orgullo profesional y una manera de evitar disputas políticas. Damián registraba sin revelar, Aurelio decidía sin explicar y los tres podían describir su pequeña parte sin nombrar el efecto conjunto. Paloma no conoció todo el contenido oculto en AV 305; sí decidió no mirar preguntas que habría podido plantear.

**Lo que cambia y lo que todavía pesa:**

Teo le reprochó irse cuando el puerto necesitaba trabajo difícil. Ella respondió enumerando peligros de sus viajes, como si el riesgo pudiera saldar cualquier ausencia. Pasaron cartas donde cada uno repetía lo que hacía y ninguno decía qué extrañaba. En su misión acuerdan turnos concretos, manifiestos y derecho de rechazo. No tiene que abandonar rutas para reconciliarse ni Teo tiene que admirar cada regreso. Podrán volver a discutir, ahora sobre una distribución que ambos pueden ver.

**Cuando no ofrece una misión:**

Dobla ropa por tamaño de bolsa, disfruta comer algo que no deba cargar y tiene dos historias que cuenta demasiado por cansancio. Después de su arco pregunta por destinatario y procedencia sin abrir cartas privadas. Reserva tardes de puerto con Teo que no son únicamente jornadas de reparación. Puede quedarse por gusto, no porque toda partida vuelva a ser un pecado familiar.

**Ante Fuatia:**

Quiere que Fuatia distinga transportar una herramienta de decidir su uso, pero no usa esa diferencia para negarse a investigar un daño conocido. Defenderá rutas de salida para trabajadores atrapados por un castigo. Si la diosa la protege de un viento, no le promete obediencia sobre todos los paquetes futuros. Un favor no cancela la responsabilidad de preguntar.

**Conversaciones personales:**

##### VID_viajera_1 · Antes del cambio

> **Paloma:** Teo ordenaba sobres conmigo. Cuando empecé a viajar, seguí diciendo nosotros como si todavía hiciera la mitad.
> **Damián:** A veces una palabra conserva una relación que las jornadas ya cambiaron.
> **Paloma:** Lo extraño. Esa frase no la puse en ninguna de las cartas donde defendía mi trabajo.
> **Damián:** Puedes escribirla sin decidir antes quién ganó la discusión.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_viajera_2 · Después del arco personal

> **Paloma:** Me quedo dos tardes. Una para ayudar y la otra para ver el puerto sin entregar nada.
> **Inés:** ¿Tu hermano conoce esa distinción o esperas que la adivine como todo lo anterior?
> **Paloma:** Se lo escribí. Respondió que en la segunda también habría platos por lavar.
> **Inés:** Suena a una invitación bastante poco solemne. Me alegra por ustedes.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar manifiestos de dos entregas.

> **Paloma:** No leo cartas ajenas. Eso no me obliga a ignorar quién está pagando para que no lleguen.

**Acto 2:** Hablar con destinatario sin abrir correo privado.

> **Paloma:** Teo no me pedía abandonar los caminos. Me pedía avisar cuándo también era parte de la casa.

**Acto 3:** Publicar regla de rechazo y acordar relevo con Teo.

> **Paloma:** Esta semana regreso el jueves. Si cambia, les escribiré antes de que tengan que adivinar.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Ruta directa o relevo regional.

> **Paloma · respuesta 1:** Directa: La carga estará limitada a lo que puedo regresar.

> **Paloma · respuesta 2:** Relevo: Cada mano firmará su tramo, no una promesa ajena.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La carta que puedo negarme a llevar». Manifiesto de ruta con remitente, tramo, capacidad y aviso de cambio; no deja leer cartas ajenas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## puerto_lirios

### Bastián · `lirios_bastian`

**Pasado:** Bastián, 48, aprendió a construir barcos con embarcaciones dañadas por la crecida. Un diseño suyo ganó velocidad reduciendo espacio para chalecos; lo retiró antes de un accidente, pero otro taller conservó los planos.

**Presente y personalidad:** Es bromista, talla miniaturas y se ofende cuando Olga lo llama empresario. Quiere prestigio sin mirar qué sacrificó por conseguirlo.

**Cambio:** Publica retiro de diseño, paga adaptación y acepta construir despacio. Su hija es Tina; escucharla no significa llevarla a navegar en peligro.

**Vínculos:** Olga, Tina, Belén. **Naturaleza:** persona_viva. **Hogar planificado:** `puerto_lirios_vivienda_01`.

#### El espacio que no era sobrante · `V_lirios_bastian`

**Primeros años y lo que aprendió a querer:**

Bastián aprendió a reconocer embarcaciones por las reparaciones y no por sus nombres. Su maestro conservaba tablas de una crecida para explicar cómo la misma madera podía fallar de otra forma. Le gustaba rescatar una pieza que otros daban por perdida. El primer barco que ayudó a terminar no ganó velocidad, pero su propietario pudo volver a trabajar. Durante años ese recuerdo le importó más que cualquier concurso.

**Aprendizaje, decisiones y vínculos:**

El diseño rápido nació de una demanda concreta: transportar productos antes de que perdieran valor. Bastián redujo espacio pensando que nadie usaría todos los chalecos a la vez. Se dio cuenta al cargar la barca con trabajadores y mercancía, sin necesidad de un accidente. Retiró el plano de su taller, pero evitó explicar en público la razón. Su prestigio sobrevivió intacto y por eso demoró avisar al otro fabricante.

**Lo que cambia y lo que todavía pesa:**

Organizar el cuidado de Tina con Dalia le enseñó una continuidad que no podía garantizar durmiendo en el taller. Compartía vivienda con Olga por costos y sostenía visitas; aun así se avergonzaba cuando alguien preguntaba por qué la hija vivía en otra casa. Quiso demostrar amor regalando un bote pequeño. Tina prefería que llegara antes de la merienda. Su misión combina retirar un plano peligroso y aprender a no reemplazar presencia por objetos.

**Cuando no ofrece una misión:**

Repara juguetes fríos en horas familiares, deja trabajo sin terminar cuando corresponde una visita y discute precios con Olga sin que su convivencia implique romance. Tras el arco sigue orgulloso de diseñar barcos; aprende a publicar un retiro sin llamarlo innovación superior.

**Ante Fuatia:**

Admiraría a Fuatia deteniendo una ola y le pediría explicar cómo quedan quienes viven del río después. No quiere que un barco seguro dependa de agradar a una diosa. Sus planos deben funcionar también el día en que nadie recibe un favor.

**Conversaciones personales:**

##### VID_lirios_bastian_1 · Antes del cambio

> **Bastián:** Te hice un bote pequeño. Dalia dijo que primero te preguntara si querías uno.
> **Tina:** Quería que vieras el pez del dibujo antes de que cerraran la escuela.
> **Bastián:** Puedo ir. El bote todavía no tiene que resolver toda la tarde.
> **Tina:** Mejor. El dibujo no sabe navegar, pero sí sabe esperar un poquito.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_lirios_bastian_2 · Después del arco personal

> **Bastián:** Publiqué el retiro y un cliente preguntó si todos mis barcos eran malos.
> **Olga:** ¿Le mostraste qué cambió o empezaste a defenderte entero?
> **Bastián:** Empecé entero. Luego volví al plano. Me costó, pero no retiré el aviso.
> **Olga:** Entonces cena. Mañana puedes volver a explicar un barco, sin justificar tu vida completa.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Inspeccionar barco atracado.

> **Bastián:** Lo que llamé espacio vacío era el lugar para regresar vivos.

**Acto 2:** Reservar materiales y adaptar compartimiento de seguridad.

> **Bastián:** Tina metió su dibujo donde debía ir el chaleco. Lo vio más claro que yo.

**Acto 3:** Probar flotación con supervisión adulta.

> **Bastián:** El plano anterior también llevará mi firma: retirado.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Adaptar bodega o reducir asientos.

> **Bastián · respuesta 1:** Bodega: Publicaré la nueva capacidad de carga.

> **Bastián · respuesta 2:** Asientos: No venderé boletos que no podamos asegurar.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «El espacio que no era sobrante». Plano de compartimiento de seguridad con capacidad de carga publicada y mismos materiales estructurales. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Olga · `lirios_olga`

**Pasado:** Olga, 55, sostuvo el mercado después de una temporada de pescado escaso. Rechazó la captura de Cora y perdió clientes que la acusaron de enriquecerse con cuotas. Publicó precios, pero nunca escuchó cómo afectaban a familias pequeñas.

**Presente y personalidad:** Es directa, canta mientras pesa y detesta regateos teatrales. Quiere abastecer sin agotar el río; trata toda discusión como intento de engaño.

**Cambio:** Acuerda cuotas con datos y representación, separa inspección de compra y abre reclamaciones. Deja de responder cada desacuerdo pesando otra vez la captura; aprende a preguntar qué parte de la regla dejó a alguien fuera.

**Vínculos:** Cora, Maite, Bastián. **Naturaleza:** persona_viva. **Hogar planificado:** `puerto_lirios_vivienda_01`.

#### Una balanza que se pueda discutir · `V_lirios_olga`

**Primeros años y lo que aprendió a querer:**

Olga aprendió el mercado desde el lado de quien llevaba una cesta pequeña y esperaba que le compraran todo. Recuerda no conocer el precio hasta que el comprador terminaba de mirar. Al conseguir su puesto quiso ofrecer previsibilidad: balanza visible, cartel legible y pago antes de descargar otro lote. Aquellas decisiones fueron útiles. Le cuesta aceptar que una regla nacida de una injusticia todavía pueda crear otra.

**Aprendizaje, decisiones y vínculos:**

Una temporada escasa la obligó a repartir compras y soportó críticas de proveedores grandes. Cerró cuotas, publicó precios y consideró que la transparencia resolvía el conflicto. No escuchó a familias pequeñas cuyos gastos no podían esperar otra semana. Creía que cualquiera podría organizarse si conocía la tabla. Esa creencia le evitaba mirar las reservas con que ella misma había podido sostener el negocio.

**Lo que cambia y lo que todavía pesa:**

Rechazar la captura de Cora la convirtió en guardiana para unos y monopolista para otros. Defendió una inspección que también decidía cuánto compraría su propio puesto. Maite le pidió separar ambas funciones; Olga respondió que nadie más tenía experiencia suficiente. La misión obliga a formar representación y aceptar resultados que no aumentan su margen. Con Bastián comparte gastos, discusiones de cocina y descanso, sin parentesco o romance deducido.

**Cuando no ofrece una misión:**

Tiene un cajón de recetas que nunca prepara porque llega cansada. Le gustan visitas donde nadie pida el precio de algo. Después de su arco aprende a preguntar qué dejó fuera un criterio sin repesar como única respuesta. No pierde gusto por vender bien.

**Ante Fuatia:**

Puede agradecer el agua protegida por Fuatia y negarse a financiar un altar cuyo encargado quiera excepciones de cuota. Necesita que cuidado y acceso a mercado no dependan de demostrar devoción. Su desacuerdo con la diosa no la vuelve partidaria de contaminar.

**Conversaciones personales:**

##### VID_lirios_olga_1 · Antes del cambio

> **Olga:** Antes llevaba una cesta y esperaba el precio. Ahora veo gente esperando mi respuesta.
> **Maite:** Publicaste la tabla, pero algunos necesitan hablar de lo que la tabla no alcanza.
> **Olga:** Me enfada que parezca que nunca basta. Ese enfado no contesta lo que preguntas.
> **Maite:** Podemos empezar por una familia, sin rediseñar el río antes del almuerzo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_lirios_olga_2 · Después del arco personal

> **Olga:** La inspección nueva rechazó un lote que yo ya quería comprar.
> **Cora:** ¿Pediste repetirla hasta que saliera bien?
> **Olga:** Casi. Luego recordé por qué dejamos de hacerla detrás de mi puesto.
> **Cora:** Hoy puedo quedarme a tomar café sin traer una captura para defender.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar tres pesajes registrados.

> **Olga:** Puedo tener una balanza justa y una regla injusta. No me gusta, pero son cuentas distintas.

**Acto 2:** Observar abundancia sin exigir capturas masivas.

> **Olga:** Maite no pidió eliminar el mercado. Pidió que el estanque también tuviera voz.

**Acto 3:** Acordar cuota y publicar compra y apelación.

> **Olga:** El precio será visible antes de que descarguen el bote.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Consejo abierto o comisión rotativa.

> **Olga · respuesta 1:** Abierto: Habrá turno incluso para quien no vende aquí.

> **Olga · respuesta 2:** Rotativa: Ningún asiento será mío por costumbre.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Una balanza que se pueda discutir». Agenda de cuota, recepción y apelación del mercado; precios y límites esenciales siguen visibles sin premio. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Maite · `lirios_maite`

**Pasado:** Maite, 31, heredó un estanque pequeño y aprendió por ensayo. Compró una especie rentable sin estudiar el equilibrio y dañó plantas de las orillas; asumió la pérdida y se volvió hostil a cualquier cambio.

**Presente y personalidad:** Habla con precisión, se relaja viendo patos y escribe malas poesías que no muestra. Teme que una nueva prueba repita su error.

**Cambio:** Diseña ensayos reversibles, con límites de densidad y agua. Recupera curiosidad sin transformar estanques en fábricas infinitas.

**Vínculos:** Olga, Dalia, Amira. **Naturaleza:** persona_viva. **Hogar planificado:** `puerto_lirios_vivienda_02`.

#### El estanque que también respira · `V_lirios_maite`

**Primeros años y lo que aprendió a querer:**

El estanque heredado era pequeño y a Maite le gustaba saberlo de extremo a extremo. De niña marcaba niveles con piedras y veía aves aparecer sin invitación. Al hacerse responsable encontró cuentas modestas y una oportunidad de introducir una especie más rentable. No quería poseer un lago ni dominar el mercado: esperaba dejar de temer una reparación inesperada cada temporada.

**Aprendizaje, decisiones y vínculos:**

La compra llegó con instrucciones de densidad pensadas para otro lugar. Maite las siguió sin revisar plantas de orilla y defendió su preparación cuando Belén preguntó. Ver peces creciendo le pareció confirmación suficiente. El daño apareció primero donde no miraba: menos sombra y barro desprendido. No hubo una desgracia repentina que la absolviera de observar tarde.

**Lo que cambia y lo que todavía pesa:**

Asumió la pérdida de la especie, pero convirtió prudencia en rechazar cualquier ensayo nuevo. Si nada cambiaba, nadie podría atribuirle otro daño. Dalia le preguntó si la hostilidad protegería también plantas que necesitaban una recuperación distinta. En su misión acepta un ensayo reversible y registra una salida antes de buscar rendimiento. Todavía puede decir que no a un proveedor sin que sea falta de crecimiento personal.

**Cuando no ofrece una misión:**

Cuenta pájaros por placer, no todos los días por informe. Tiene una silla que cambia de sombra según la hora. Tras el arco vuelve a entusiasmarse con una prueba, pero comunica condiciones de parada antes de invitar a mirar resultados.

**Ante Fuatia:**

Quiere que Fuatia le muestre lo que siente bajo el agua y teme que el primer error la clasifique para siempre. No le pide fingir que cuidó correctamente: desea saber qué recuperación sería suficiente. No interpreta una visita de ave como sentencia favorable.

**Conversaciones personales:**

##### VID_lirios_maite_1 · Antes del cambio

> **Maite:** Conocía cada piedra y aun así miré solo los peces que crecían.
> **Dalia:** A mí me pasó con el dique. Veía el canal recto y creía haber entendido el río.
> **Maite:** Por eso me enfada tanto que alguien llegue con una mejora perfecta.
> **Dalia:** Podemos pedirle que explique cómo la detendría si empieza a fallar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_lirios_maite_2 · Después del arco personal

> **Maite:** El ensayo no produjo más. Tampoco dañó la orilla. Quiero conservar ese resultado sin maquillarlo.
> **Belén:** Sirve para decidir. No todos los informes tienen que vender la siguiente compra.
> **Maite:** Y sirve para volver a sentarnos aquí sin vigilar una ganancia.
> **Belén:** Déjame mover la silla. Esta hora siempre me da el sol en los ojos.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar agua y densidad.

> **Maite:** No necesito que me prometas que funcionará. Necesito poder deshacerlo si no funciona.

**Acto 2:** Restaurar orilla con especies autorizadas.

> **Maite:** Estaba protegiendo mi error de una segunda prueba. No el estanque.

**Acto 3:** Observar tras jornadas dormidas y ajustar población.

> **Maite:** Hoy cabe menos. Vive mejor. Voy a anotarlo así.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Borde vegetal o sombra modular.

> **Maite · respuesta 1:** Vegetal: Usaremos especies de esta ribera.

> **Maite · respuesta 2:** Sombra: Dejará luz suficiente y podrá retirarse.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «El estanque que también respira». Variante de borde vegetal o sombra para estanque; cambia disposición, nunca duplica capacidad ni peces. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Julián · `lirios_julian`

**Pasado:** Julián, 60, cuidó el faro treinta años. Durante una tormenta siguió un horario antiguo y encendió tarde; Teo perdió carga, no una vida. Desde entonces duerme cerca de la escalera y rechaza relevos.

**Presente y personalidad:** Es metódico, cuenta chistes lentísimos y disfruta acertijos. Cree que delegar demuestra que está envejeciendo mal.

**Cambio:** Instala registro con redundancia y forma suplentes. Acepta que descansar mejora un servicio público. Su primer día libre no visita la escalera para comprobar al suplente: camina con Teo y habla de algo que no sea el faro.

**Vínculos:** Cora, Teo, Hugo. **Naturaleza:** persona_viva. **Hogar planificado:** `puerto_lirios_vivienda_02`.

#### La luz que no depende de uno · `V_lirios_julian`

**Primeros años y lo que aprendió a querer:**

Julián recibió el faro como un trabajo estable cuando tenía treinta años. Le gustó aprender nombres de barcos que no conocería por dentro. De noche podía ayudar a personas que jamás le agradecerían directamente; eso le parecía una libertad. Al principio llevaba comida para dos porque el antiguo cuidador todavía venía a revisar una pieza y ambos miraban el horizonte sin hacer ceremonia del relevo.

**Aprendizaje, decisiones y vínculos:**

Durante décadas memorizó horarios y convirtió experiencia en costumbre. Una tormenta llegó fuera de la franja prevista. Vio cambios, pero esperó la señal fijada y encendió tarde. Teo perdió carga, no una vida. Julián pagó una parte y le ofreció reparación; también insistió demasiado en recordar que nadie había muerto. Ese alivio verdadero le servía para evitar oír cuánto costaba lo perdido.

**Lo que cambia y lo que todavía pesa:**

Desde entonces duerme junto a la escalera y revisa controles que ya comprobó. Rechazar relevo le parece responsabilidad, aunque hace más vulnerable el servicio al concentrarlo todo. Hugo propuso alertas redundantes y Julián oyó jubilación impuesta. La misión distingue ajustar el puesto de expulsar al cuidador. Puede formar suplentes, conservar trabajo y salir una tarde sin supervisar desde una esquina.

**Cuando no ofrece una misión:**

Disfruta reparar radios sin emitir nada y caminar con Teo hablando de comida. Tras el arco no convierte el primer descanso en demostración heroica: vuelve, revisa el registro y confía en una jornada que ocurrió sin su presencia.

**Ante Fuatia:**

Sabe que Fuatia es aire y agua del horizonte, pero no quiere que el puerto abandone señales porque una diosa podría advertir. La protección elemental no sustituye mantenimiento. Le agradecería una corriente favorable sin llamar castigo a la siguiente tormenta.

**Conversaciones personales:**

##### VID_lirios_julian_1 · Antes del cambio

> **Julián:** Digo que nadie murió y parece que estoy pidiendo que la conversación termine.
> **Teo:** Me alegra estar vivo. También perdí cosas que no volvieron con esa frase.
> **Julián:** Lo sé. Hoy quiero escucharlas sin explicarte otra vez el horario.
> **Teo:** Empecemos por la carga. Después puedo contarte qué ya conseguí reemplazar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_lirios_julian_2 · Después del arco personal

> **Julián:** Caminé una hora entera sin volver a la escalera.
> **Hugo:** La señal se registró y el suplente avisó. ¿Quieres mirar o prefieres cenar primero?
> **Julián:** Cenar. Que el registro pueda esperar también estaba incluido en el proyecto.
> **Hugo:** Bien. Entonces hoy hablamos de una lámpara que tengo por puro gusto.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar lámpara apagada de prueba.

> **Julián:** No falló mi cariño por el puerto. Falló una lámpara que dependía de mis ojos.

**Acto 2:** Calibrar señales con Hugo.

> **Julián:** Teo no vino a cobrarme aquella caja. Vino a ofrecerme una noche de sueño.

**Acto 3:** Ejecutar relevo diurno y verificar doble registro.

> **Julián:** Esta luz no lleva mi nombre. Puede seguir cuando yo baje.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Señal sonora o baliza visual.

> **Julián · respuesta 1:** Sonora: Dejaremos horario que respete el descanso.

> **Julián · respuesta 2:** Visual: Añadiremos contraste para niebla.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La luz que no depende de uno». Plan de relevo y revisión del faro con señales redundantes; no abre travesías inseguras. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Belén · `lirios_belen`

**Pasado:** Belén, 42, tejía redes de malla cerrada porque pagaban más. Vio juveniles atrapados y propuso una red selectiva que pescadores rechazaron por miedo a perder ingresos. Vendió el diseño demasiado pronto sin mostrar pruebas.

**Presente y personalidad:** Es cálida, afila agujas como ritual y compite con Renata en remiendos. Desea que una buena intención cuente como resultado.

**Cambio:** Ensaya, acepta límites de diseño y paga reparaciones. Trabaja con Cora para que devolver no sea una orden sin herramientas.

**Vínculos:** Renata, Cora, Olga. **Naturaleza:** persona_viva. **Hogar planificado:** `puerto_lirios_vivienda_03`.

#### La red que deja pasar · `V_lirios_belen`

**Primeros años y lo que aprendió a querer:**

Belén tejía observando manos adultas y le gustaba que una red terminada pareciera una sola cosa sin borrar cada nudo. Sus primeras ventas pagaron herramientas y una mesa propia. Cuando compradores pidieron malla más cerrada vio un mejor precio y no todo lo que atraparía. La elección creció por pedidos sucesivos, no por una decisión solemne de dañar el río.

**Aprendizaje, decisiones y vínculos:**

Al ver juveniles en un lote, quiso diseñar una red que devolviera lo pequeño. Los pescadores temían perder también ingreso de capturas legítimas y ella llamó resistencia a cualquier pregunta. Vendió el cambio antes de medirlo porque necesitaba financiar pruebas. Una rotura reveló que el material funcionaba distinto en otra corriente. Devolver una factura no bastaba para compensar tiempo perdido.

**Lo que cambia y lo que todavía pesa:**

Cora aceptó probar sin convertirla en salvadora del puerto. Belén tuvo que escribir resultados desfavorables y reconocer dónde el diseño anterior todavía funcionaba mejor. Su misión paga reparaciones y acuerda ensayos con quienes usan la red. Sigue buscando una mejora propia y puede desear que su nombre permanezca, siempre que no borre aportes ajenos ni prometa selectividad inexistente.

**Cuando no ofrece una misión:**

Trenza mientras escucha y pierde el hilo si la conversación la emociona. Después del arco aparta horas pagadas para revisar una pieza devuelta. Hace objetos pequeños que no tienen función de pesca y disfruta que alguien los compre simplemente porque le gustan.

**Ante Fuatia:**

Ofrecería a Fuatia una red probada, nunca una pieza cuyo brillo garantice bondad. Le pide juzgar uso, densidad y devolución además del material. Si la diosa castiga un oficio entero, Belén muestra personas que intentaron cambiar y los costos que siguen afrontando.

**Conversaciones personales:**

##### VID_lirios_belen_1 · Antes del cambio

> **Belén:** Llamé miedo al cambio a una pregunta que yo todavía no sabía responder.
> **Cora:** Preguntaban cuánto dejarían de vender. Eso no vuelve egoísta a toda familia.
> **Belén:** Necesitaba pedidos para pagar pruebas. Vendí la promesa y luego quise llamarla ensayo.
> **Cora:** Podemos empezar con una red y un registro que no tenga que gustarnos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_lirios_belen_2 · Después del arco personal

> **Belén:** Hoy reparé una antigua. No habría sido justo obligar a comprar la nueva.
> **Cora:** ¿Vas a anunciarlo o prefieres que parezca que todo cambio es mejor?
> **Belén:** Voy a anotarlo. Después quiero tejer algo que no acabe en un debate de cuotas.
> **Cora:** Yo compraría una cesta. Para llevar comida y no más informes.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Reparar una red sin consumir peces.

> **Belén:** Una red que dice cuidar tiene que demostrar a quién deja salir.

**Acto 2:** Comparar tamaño con fichas de especies.

> **Belén:** No estaba lista. Yo sí tenía afán de que mi nombre saliera en el mercado.

**Acto 3:** Probar en captura reglamentaria y documentar devolución.

> **Belén:** Venderé esta versión con sus límites y su modo de reparación.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Malla selectiva o trampa revisable.

> **Belén · respuesta 1:** Malla: La talla mínima quedará marcada.

> **Belén · respuesta 2:** Trampa: Exige revisión; no dejaré venderla como automática.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La red que deja pasar». Variante de red o trampa selectiva con misma durabilidad y captura base; exige revisión y devolución reales. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Teo · `lirios_teo`

**Pasado:** Teo, 34, aprendió navegación mientras Paloma se iba de viaje. Se quedó cuidando una casa familiar y sintió que los demás celebraban solo a quien regresaba con historias. Su resentimiento creció en silencios, no en una traición secreta.

**Presente y personalidad:** Es generoso con pasajeros y rígido con su hermana. Guarda postales sin responder. Quiere reconocimiento por la continuidad que ofrece.

**Cambio:** Pide acuerdos de relevo y deja de cobrar afecto con obligaciones implícitas. Conserva el derecho de querer quedarse.

**Vínculos:** Paloma, Julián, Tina. **Naturaleza:** persona_viva. **Hogar planificado:** `puerto_lirios_vivienda_03`.

#### El puerto también es un viaje · `V_lirios_teo`

**Primeros años y lo que aprendió a querer:**

Teo ayudaba a Paloma a separar sobres y esperaba el regreso para oír qué caminos había descubierto. Al principio quedarse también le gustaba: conocía a quienes necesitaban una mano sin anunciarla. Con los años esa ayuda se convirtió en una obligación atribuida al que no viajaba. Nadie le preguntó cuándo había elegido conservarla ni cuándo quería un descanso.

**Aprendizaje, decisiones y vínculos:**

Aprendió navegación buscando un oficio que le diera placer propio. Una tormenta y la señal tardía del faro le hicieron perder carga. Lo irritó que le recordaran tantas veces estar vivo como si reclamar dinero fuera mezquindad. Podía agradecer y exigir reparación a la vez. Esa discusión se unió al malestar familiar: otras personas parecían elegir siempre qué sentimiento suyo resultaba aceptable.

**Lo que cambia y lo que todavía pesa:**

Las cartas con Paloma terminaron enumerando sacrificios. Teo respondía tarde para que ella notara cuánto ocupaba su vida, aunque quería recibir otra noticia. El silencio le daba control y también lo dejaba más solo. Su misión propone relevo concreto y no exige que se convierta en viajero para demostrar amplitud. Puede preferir el puerto y dejar de cobrar esa preferencia como una deuda eterna a su hermana.

**Cuando no ofrece una misión:**

Conoce puestos donde preparan pescado como le gusta y detesta que llamen rutina aburrida a su gusto por volver. Tras el arco planifica descansos, avisa y puede invitar a Paloma sin reservarle primero una labor. No deja de querer ayuda.

**Ante Fuatia:**

Defiende una ruta de salida incluso para quien Fuatia castigue. No por admirar al responsable, sino porque conoce lo que cuesta quedar obligado a permanecer. También pide a la diosa escuchar a quienes se quedaron manteniendo una orilla antes de premiar al viajero que trae una reparación vistosa.

**Conversaciones personales:**

##### VID_lirios_teo_1 · Antes del cambio

> **Teo:** Escribí que estaba ocupado para que ella entendiera que hacía falta. Lo repetí hasta que dejó de preguntar.
> **Julián:** ¿Y querías que dejara de hacerlo?
> **Teo:** No. Quería una ayuda que se le ocurriera sola, porque pedirla me parecía valer menos.
> **Julián:** Podemos practicar pidiendo una bastante pequeña. Yo necesito compañía para salir del faro.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_lirios_teo_2 · Después del arco personal

> **Paloma:** Esta tarde no vine a que me entregues otra lista. Vine a caminar contigo.
> **Teo:** Hay una lista, pero puede esperar. ¿Quieres el camino largo?
> **Paloma:** Sí. Si te cansas, lo dices antes de enfadarte conmigo por no adivinarlo.
> **Teo:** Y si te aburres, no conviertas la salida en una entrega rápida. Trato hecho.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar tareas de muelle.

> **Teo:** Cada regreso de Paloma era una fiesta. Nadie preguntaba cómo había sido quedarse.

**Acto 2:** Preparar manifiesto con Paloma.

> **Teo:** No necesito que haga mi vida. Necesito dejar de decidir la suya para castigarla.

**Acto 3:** Acordar descanso y entregar carta consentida.

> **Teo:** El domingo no salgo. Bastián cubrirá el muelle y yo no tendré que justificarlo.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Carta privada o conversación acompañada.

> **Teo · respuesta 1:** Carta: Paloma elegirá cuándo leerla.

> **Teo · respuesta 2:** Acompañada: Rosa ayudará a que terminemos las frases.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «El puerto también es un viaje». Horario de muelle y relevo con cupos, para preparar envío sin esperar una hora real. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Dalia · `lirios_dalia`

**Pasado:** Dalia, 45, cultivó juncos para vender cuando una obra rectificó el río. Perdió terreno por erosión y culpó al bosque antes de revisar el dique que había aprobado. Su familia sobrevivió gracias a una vecina de Brumaverde.

**Presente y personalidad:** Es orgullosa, fabrica cestas y disfruta discutir con mapas grandes. Le cuesta agradecer sin sentir deuda. Es hermana menor de Bastián y tía de Tina; la niña vive con ella durante la semana escolar por acuerdo familiar.

**Cambio:** Restaura riberas con Silvana, admite responsabilidad compartida y acuerda compensación concreta. Conserva orgullo por su oficio, pero retira una acusación escrita que sus vecinos habían aprendido a repetir como si fuera un hecho.

**Vínculos:** Silvana, Tomás, Maite. **Naturaleza:** persona_viva. **Hogar planificado:** `puerto_lirios_vivienda_04`.

#### El río que no firma fronteras · `V_lirios_dalia`

**Primeros años y lo que aprendió a querer:**

Dalia aprendió juncos por necesidad y terminó disfrutando una planta que podía sostener techo y tejido. Una parcela junto al río le dio ingreso propio y la sensación de que quedarse había sido una decisión, no una falta de alternativas. Cuando Bastián viajaba por encargos, ella le guardaba una comida sin registrarlo como favor. Más tarde ambos tuvieron que aprender que el cariño tampoco volvía ilimitada su disponibilidad.

**Aprendizaje, decisiones y vínculos:**

Apoyó una rectificación del cauce porque prometía proteger su terreno. El dique redujo erosión en un lado y la aumentó en otro. Dalia acusó al bosque repitiendo una explicación heredada; vecinos de Brumaverde la ayudaron aun después de oírla. Quiso agradecer sin retirar la acusación, como si recibir cuidado no obligara a revisar una historia conveniente.

**Lo que cambia y lo que todavía pesa:**

Alojar a Tina durante la semana escolar exige horarios, visitas de Bastián y acuerdos que no siempre salen fluidos. Dalia quiere a su sobrina y a veces quiere una tarde sola. Le molesta que pedir relevo parezca rechazarla. Su misión restaura riberas con Silvana y corrige una acusación escrita; en casa aprende a nombrar necesidades sin convertir a la niña en prueba de sacrificio adulto.

**Cuando no ofrece una misión:**

Teje para vender y también una pieza lenta que no promete terminar a nadie. Después del arco conversa con Tina de plantas sin convertir cada paseo en lección. Mantiene coordinación familiar explícita; no se vuelve madre sustituta por compartir vivienda.

**Ante Fuatia:**

Desea protección de Fuatia para el cultivo, pero admite que ella respaldó una obra dañina. La ayuda recibida no le da inocencia retrospectiva ni la excluye de reparar. Si la diosa exige que renuncie a toda ribera, Dalia defiende un cultivo con límites y vigilancia pública.

**Conversaciones personales:**

##### VID_lirios_dalia_1 · Antes del cambio

> **Dalia:** La vecina del bosque me ayudó después de leer mi acusación. Yo no sabía cómo agradecer sin sentirme en deuda.
> **Silvana:** Podías revisar lo escrito. No necesitaba que me quisieras para devolver agua a una orilla.
> **Dalia:** Me costó más borrar la frase que mover piedra.
> **Silvana:** A mí también me cuesta revisar frases que ya celebraron los vecinos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_lirios_dalia_2 · Después del arco personal

> **Dalia:** Tina, mañana llega tu papá antes de la merienda. Yo voy a tener una tarde para mí.
> **Tina:** ¿Vas a hacer otra cosa que no sea ayudar a alguien?
> **Dalia:** Voy a terminar un tejido bastante lento y quizá tampoco lo termine.
> **Tina:** Después me lo muestras así. No hay que tenerlo listo para que yo lo vea.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar orillas y acta de obra.

> **Dalia:** Yo señalaba río arriba porque el agua venía de allá. El error también estaba bajo mis botas.

**Acto 2:** Plantar juncos autorizados en tramo seguro.

> **Dalia:** Silvana trajo ayuda sin traer la frase te lo dije. Todavía no sé cómo agradecerle eso.

**Acto 3:** Registrar sedimentos tras dormir y acordar mantenimiento.

> **Dalia:** La ribera tendrá dos brigadas y una cuenta pública.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Restauración lenta o barrera temporal.

> **Dalia · respuesta 1:** Lenta: Protegeremos el tramo mientras arraiga.

> **Dalia · respuesta 2:** Temporal: Tendrá fecha de retiro y materiales recuperables.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «El río que no firma fronteras». Diseño de ribera modular con lote, recuperación y fecha de retiro; no crea suelo fértil instantáneo. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Tina · `lirios_tina`

**Pasado:** Tina tiene ocho años y es hija de Bastián. Aprende del río con Cora y creyó que un pez pequeño era un trofeo más raro. Lo devolvió cuando comprendió su edad, sin ser humillada por su equivocación. Vive con su tía Dalia cerca del camino escolar; Bastián mantiene visitas y cuidado acordados. No es un padre declarado ausente por vivir en otra casa.

**Presente y personalidad:** Pregunta sin pausa, imita voces del faro y prefiere dibujos a discursos. Se enfada si Leo se atribuye descubrimientos compartidos.

**Cambio:** Aprende a observar sin capturar todo, corrige un mapa con Leo y sigue siendo niña.

**Vínculos:** Bastián, Cora, Leo. **Naturaleza:** persona_viva. **Hogar planificado:** `puerto_lirios_vivienda_04`.

#### La libreta de lo que vi · `V_lirios_tina`

**Primeros años y lo que aprendió a querer:**

Tina conoce dos mesas: la del cuidado escolar con Dalia y la de visitas de Bastián. Las distingue por meriendas y dibujos, no por cuál debería ser su casa verdadera. Le gusta que los adultos le avisen cuándo cambian horarios. Una visita pospuesta puede darle tristeza sin probar abandono. Conserva un cuaderno que lleva de un lugar a otro para no tener que contar cada juego desde el principio.

**Aprendizaje, decisiones y vínculos:**

La captura pequeña le pareció rara porque los trofeos que veía eran grandes. Pensó que habría encontrado algo más especial. Cora le explicó la edad sin burlarse y la acompañó a devolverla. Tina quiso saber si otro pescador la capturaría después; la pregunta no tenía una garantía perfecta. Aprendió que hacer algo correcto no siempre asegura que todo el mundo hará lo mismo.

**Lo que cambia y lo que todavía pesa:**

Cuando Leo prometió un atajo y encontró la puerta cerrada, Tina se enfadó por esperar una sorpresa que él no conocía. No dejó de querer jugar con él. Alma les ayudó a distinguir cuento y ruta, y Tina pidió que el siguiente mapa incluyera sitios donde se podía descansar. Su arco conserva curiosidad sin enviarla a peligros adultos ni usarla para que Bastián aprenda una lección a costa suya.

**Cuando no ofrece una misión:**

Le interesan peces por forma y color, dibuja chalecos enormes para todos los pasajeros inventados y puede preferir una tarde sin hablar de naturaleza. Tras la misión hace preguntas antes de capturar, pero sigue aprendiendo y equivocándose con supervisión.

**Ante Fuatia:**

Querría preguntar a Fuatia si los peces la llaman de alguna manera distinta. No se convierte en elegida por esa curiosidad. Dalia y Cora le explican que el cuidado no consiste en recoger cada criatura para protegerla en casa; también se puede observar y devolver.

**Conversaciones personales:**

##### VID_lirios_tina_1 · Antes del cambio

> **Tina:** Si devuelvo este pez, ¿cómo sabe que no lo quise guardar?
> **Cora:** Puede que no lo piense como nosotros. Lo importante es que vuelva a su lugar.
> **Tina:** Entonces puedo hacer un dibujo para recordarlo sin llevármelo.
> **Cora:** Claro. Y puedes inventarle un sombrero sin decir que lo viste de verdad.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_lirios_tina_2 · Después del arco personal

> **Tina:** En el mapa puse una banca porque no quiero una aventura sin merienda.
> **Leo:** Podemos poner otra donde esperamos a tu papá, pero solo si sabemos dónde queda.
> **Tina:** Esa sí la sabemos. El túnel de peces con sombrero lo dejamos para el cuento.
> **Leo:** Va a ser un cuento buenísimo, aunque nunca encontremos la puerta.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Visitar muelle con adulto.

> **Tina:** Si lo dejo en el agua, ¿igual cuenta que lo encontré?

**Acto 2:** Dibujar tres señales sin tocar fauna.

> **Tina:** Cora dice que sí. El río no tiene que quedarse vacío para que mi cuaderno esté lleno.

**Acto 3:** Mostrar libreta a Leo y corregir autoría.

> **Tina:** Le puse nuestros nombres. También el del pez, pero no su dirección.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Dibujo del faro o de la ribera.

> **Tina · respuesta 1:** Faro: Julián acompañará la visita, sin subir sola.

> **Tina · respuesta 2:** Ribera: Miraremos desde el camino marcado.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «La libreta de lo que vi». Libreta de avistamientos con dibujos y escena de corrección; no concede animales capturados. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## brumaverde

### Silvana · `bruma_silvana`

**Pasado:** Silvana, 58, nació después de la gran crecida y escuchó a su madre culpar al puerto. Protegió árboles valiosos y permitió otra tala menos visible que dañó la ribera. Se volvió autoridad sin revisar esa contradicción.

**Presente y personalidad:** Es afectuosa con aprendices y dura con comerciantes. Talla cucharas, le cuesta aceptar que usa madera del bosque que protege.

**Cambio:** Comparte datos y permisos, reconoce daño y distingue conservación de prestigio. Le cuesta especialmente firmar un permiso propuesto por Roque; hacerlo demuestra confianza en un procedimiento, no abandono de los árboles.

**Vínculos:** Gael, Dalia, Roque. **Naturaleza:** persona_viva. **Hogar planificado:** `brumaverde_vivienda_01`.

#### Las raíces de la discusión · `V_bruma_silvana`

**Primeros años y lo que aprendió a querer:**

Silvana nació mucho después de la gran crecida, pero creció oyéndola como si continuara cada mañana. Su madre culpaba al puerto y guardaba un objeto rescatado para mostrar cuánto había perdido la familia. Silvana heredó afecto, memoria y una explicación que no había contrastado. Cuidar el bosque le dio una manera de honrar a esa madre sin preguntarse qué otras riberas también habían sido heridas.

**Aprendizaje, decisiones y vínculos:**

Protegió árboles visibles y permitió retirar otros junto al agua porque parecían jóvenes y abundantes. La erosión llegó despacio. Mientras tanto recibió reconocimiento por el tronco antiguo que podía mostrarse a visitantes. No inventó el valor del árbol protegido, pero disfrutó un logro que hacía menos visible su otro permiso. Gael aprendió esa forma de autoridad antes de discutirla.

**Lo que cambia y lo que todavía pesa:**

Dalia le reclamó daño y Silvana respondió con la historia de AV 221, aunque ninguna había vivido aquel año. Ada encontró registros actuales; Roque pidió un permiso medido para una rampa. La misión exige firmarlo y reconocer una tala propia mal evaluada. No deja de cuidar árboles por compartir decisiones. Su dificultad más íntima es que revisar el relato de su madre se sienta como deslealtad a una persona amada.

**Cuando no ofrece una misión:**

Camina rutas que no enseña a turistas porque quiere conservar un gusto privado. Después del arco puede escuchar una crítica sin señalar inmediatamente el árbol que salvó. Sigue necesitando pruebas para un permiso y tiene tardes en que prefiere aprender otro canto de ave.

**Ante Fuatia:**

Venera a Fuatia, pero no usará esa relación para anular a Roque. Le atrae que la diosa recuerde cada herida y empieza a sospechar lo que cuesta conservarlas como identidad entera. Defender una tala limitada ante ella es una prueba de cuidado mucho más difícil que nombrar a un enemigo del bosque.

**Conversaciones personales:**

##### VID_bruma_silvana_1 · Antes del cambio

> **Silvana:** Mi madre contaba la crecida como si yo hubiera visto el agua. A veces yo también digo recordarla.
> **Benicio:** Recordamos escuchar. No es lo mismo, y puede doler casi igual.
> **Silvana:** Si retiro una acusación, parece que dejo de acompañarla.
> **Benicio:** Puedes conservar su dolor sin heredar cada explicación.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_bruma_silvana_2 · Después del arco personal

> **Roque:** Firmaste. Pensé que todavía ibas a encontrar otro documento que faltara.
> **Silvana:** Encontré miedo de perder autoridad. No sirve como criterio de suelo.
> **Roque:** Yo sigo respondiendo por el corte escondido. No estamos limpiándonos la historia mutuamente.
> **Silvana:** Lo sé. Podemos compartir la revisión sin inventarnos una amistad inmediata.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Leer actas de tala.

> **Silvana:** Mi madre tenía razones para estar enojada. Yo las heredé como si fueran un mapa.

**Acto 2:** Medir ribera con Dalia.

> **Silvana:** La tala que aprobamos aquí sí movió esa orilla. Negarlo no protege ningún árbol.

**Acto 3:** Autorizar recuperación y madera de obra con límites.

> **Silvana:** La próxima decisión tendrá también la firma de quien vive río abajo.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Restaurar primero o obra y restauración conjunta.

> **Silvana · respuesta 1:** Primero: Habrá suministro alternativo para la rampa.

> **Silvana · respuesta 2:** Conjunta: Separaremos lotes y responsables para que ninguna parte se pierda.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Las raíces de la discusión». Plan comunitario de tala y restauración con representación de ribera; no elimina costos de madera. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Félix · `bruma_felix`

**Pasado:** Félix, 29, llegó buscando un oficio distinto al de su familia. Una fermentación salió mal y arruinó un pedido; mintió sobre la temperatura para conservar trabajo. Amira descubrió el dato y le dio ocasión de corregirlo.

**Presente y personalidad:** Es ingenioso, cuida frascos como mascotas y hace bromas al pedir disculpas. Teme parecer incapaz si una prueba falla.

**Cambio:** Registra lotes y descarte, aprende que no todo sobrante debe aprovecharse. Su amistad se repara con transparencia continuada.

**Vínculos:** Amira, Simón, Zaira. **Naturaleza:** persona_viva. **Hogar planificado:** `brumaverde_vivienda_01`.

#### El lote que no se sirve · `V_bruma_felix`

**Primeros años y lo que aprendió a querer:**

Félix llegó al bosque para trabajar lejos del oficio familiar y disfrutó no ser presentado como hijo de alguien. Aprendió fermentación lavando recipientes, esperando tiempos y oliendo resultados que no podía explicar todavía. Una vecina probó su primer lote aceptable y pidió otro. El pedido sencillo le dio un orgullo que temía perder si alguien notaba cuánto seguía aprendiendo.

**Aprendizaje, decisiones y vínculos:**

Una temperatura errónea arruinó una entrega. Félix corrigió el registro para que pareciera problema de transporte. No quería perjudicar a otro trabajador, pero la versión terminó señalando a quien llevó el lote. Amira comparó horarios y le preguntó en privado antes de publicar la corrección. Él agradeció la oportunidad y luego se enfadó por necesitarla.

**Lo que cambia y lo que todavía pesa:**

Intentó aprovechar el lote para disminuir la pérdida, confundiendo recuperar dinero con evitar desperdicio. La prueba no cumplía seguridad y tuvo que descartarlo. Su arco acepta costo, retiro y explicación al afectado. Después puede presentar un resultado pequeño sin usar cada recipiente como demostración de que ya merece permanecer. Su familia sigue siendo una relación que puede retomar sin volver automáticamente al oficio que dejó.

**Cuando no ofrece una misión:**

Le gustan olores del bosque y comidas que no debe analizar por fermentación. Tras la misión admite una parada, firma el descarte y cobra un lote bueno sin prometer que nunca tendrá otro fallo. Su amistad con Amira necesita más que una conversación agradecida.

**Ante Fuatia:**

Teme que Fuatia vea descarte como abuso y defiende distinguir una pérdida necesaria de una práctica sostenida. No exige convertir material inseguro en alimento para complacerla. Le mostraría prevención, volumen de prueba y disposición responsable; no una mesa llena de productos que solo aparentan aprovechamiento.

**Conversaciones personales:**

##### VID_bruma_felix_1 · Antes del cambio

> **Félix:** Escribí transporte para no escribir temperatura. Luego apareció el nombre de quien llevó la caja.
> **Amira:** Todavía puedes retirar la acusación. No basta cambiar la cifra a escondidas.
> **Félix:** Quisiera corregir sin sentir que dejo de ser el que por fin encontró su oficio.
> **Amira:** El oficio no desaparece porque tu firma quede junto a un fallo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_bruma_felix_2 · Después del arco personal

> **Félix:** Descarté el lote. No intenté venderlo como una variante más fuerte.
> **Amira:** ¿Y cómo vas con la caja que sí salió bien?
> **Félix:** Feliz. Me cuesta decirlo sin agregar todas las precauciones que ahora conozco.
> **Amira:** Podemos comer primero y dejar tu registro al lado, no encima del plato.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Identificar lote fallido y apartarlo.

> **Félix:** Puedo hacer un chiste de esto. La etiqueta necesita una respuesta seria.

**Acto 2:** Preparar compost con receta y cantidades válidas.

> **Félix:** Amira no me pidió acertar siempre. Me pidió no venderle mi duda como certeza.

**Acto 3:** Registrar control y destino seguro del descarte.

> **Félix:** Este lote va al compost, no a una mesa. El siguiente tendrá fecha.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Bitácora visible o etiqueta por frasco.

> **Félix · respuesta 1:** Visible: Anotaremos también los descartes.

> **Félix · respuesta 2:** Frascos: Cada recipiente conservará su procedencia.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El lote que no se sirve». Ficha de lote fermentado, descarte y compostaje que conserva procedencia y contraindicaciones. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Amira · `bruma_amira`

**Pasado:** Amira, 33, amplió colmenas para pagar estudios de una hermana residente de fondo. La densidad afectó polinizadores locales; en lugar de admitirlo culpó a flores de Aurelia. Kiara mostró el desequilibrio sin quitarle su oficio.

**Presente y personalidad:** Es sociable, escucha zumbidos en silencio y se pone a la defensiva con números. Quiere abundancia y seguridad económica.

**Cambio:** Redistribuye colmenas, cultiva diversidad y vende miel con procedencia, no promesas curativas. El primer lote más pequeño le da miedo por sus ingresos. Negocia transición con Olga en lugar de fingir que cuidar no tiene costo.

**Vínculos:** Félix, Kiara, Flora. **Naturaleza:** persona_viva. **Hogar planificado:** `brumaverde_vivienda_02`.

#### No todo zumbido es abundancia · `V_bruma_amira`

**Primeros años y lo que aprendió a querer:**

Amira cuidaba colmenas observando distancias que otras personas no veían. Le gustaba regresar y notar que el día había continuado sin pedirle instrucciones. Cuando su hermana quiso estudiar, ofreció aumentar producción para ayudar. La promesa fue afectuosa, pero también una manera de no admitir que temía que el vínculo cambiara cuando la otra se marchara.

**Aprendizaje, decisiones y vínculos:**

Introdujo más colmenas y durante una temporada vio ingreso suficiente. Los polinizadores locales perdieron espacio y Amira culpó flores nuevas de Aurelia. Era una hipótesis cómoda: permitía conservar su plan y una imagen de benefactora familiar. Kiara mostró densidades; Amira intentó desplazar el debate a la pureza de semillas que ninguna había medido como causa.

**Lo que cambia y lo que todavía pesa:**

Reducir el primer lote le dio miedo económico real. No quería pedir a su hermana que abandonara estudios ni tratar la ayuda anterior como deuda. La misión acuerda transición con Olga, diversidad y procedencia. Amira puede reconocer cariño detrás de una promesa y abuso en la manera de cumplirla. Sus conversaciones con Félix le recuerdan cuánto tarda una corrección en reconstruir confianza.

**Cuando no ofrece una misión:**

Lee cartas mientras repara cajas, compra dulces ajenos porque no todo debe salir de su miel y disfruta una tarde sin zumbido. Tras el arco da datos de lote sin inventar propiedades curativas. Sigue queriendo ayudar a su hermana dentro de recursos acordados.

**Ante Fuatia:**

Se siente vista por Fuatia y le preocupa que esa mirada solo registre la densidad culpable. No pide que el motivo familiar borre el daño; quiere una recuperación medible y una transición posible. La diosa deberá escuchar también a polinizadores no domesticados, que no son propiedad de la apicultora.

**Conversaciones personales:**

##### VID_bruma_amira_1 · Antes del cambio

> **Amira:** Cuando prometí pagar estudios no pensé en qué haría si el bosque no podía dar otro lote.
> **Ada:** ¿Tu hermana pidió esa cantidad o la fijaste para sentir que seguías haciendo falta?
> **Amira:** La fijé yo. Me habría dolido menos si la culpa fuera de una flor nueva.
> **Ada:** Podemos medir flores sin darles el trabajo de defender nuestra versión.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_bruma_amira_2 · Después del arco personal

> **Amira:** La carta dice que puede completar una parte. Pensé en responder que yo todavía podía todo.
> **Félix:** ¿Podías o querías que siguiera necesitando tu ayuda?
> **Amira:** Quería las dos cosas. Hoy voy a decirle cuánto sí puedo sostener.
> **Félix:** Después me ayudas a escoger un dulce que no tengamos que producir nosotros.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar floración en tres puntos.

> **Amira:** Pensé que más colmenas era más vida. A veces era más competencia.

**Acto 2:** Ajustar densidad sin duplicar colmenas.

> **Amira:** Kiara no vino a darme una lección de luna. Vino a preguntar quién estaba faltando aquí.

**Acto 3:** Comparar visitas y registrar lote de miel.

> **Amira:** La etiqueta dirá flores y fecha. No voy a prometer salud dentro de un tarro.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Reducir densidad o ampliar flores antes.

> **Amira · respuesta 1:** Reducir: Planificaremos ingresos durante la transición.

> **Amira · respuesta 2:** Flores: No aumentaremos colonias hasta verificar recuperación.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «No todo zumbido es abundancia». Plan de floración y densidad de colmenas con advertencia de competencia, sin bonus acumulativo de miel. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Roque · `bruma_roque`

**Pasado:** Roque, 47, aprendió tallado por placer antes de convertirlo en oficio. Necesitaba madera para una rampa y Gael le prohibió incluso usar un tronco caído. Respondió cortando a escondidas otra pieza; la necesidad no vuelve correcto ocultarlo.

**Presente y personalidad:** Es paciente enseñando y orgulloso al pedir ayuda. Guarda juguetes imperfectos; no vende todo lo que hace.

**Cambio:** Repara daño, pide permisos revisables y diseña módulos que aprovechan materiales existentes. Guarda el juguete que talló con el resto de aquella rampa: lo quiere sin usarlo como excusa para el corte escondido.

**Vínculos:** Gael, Olivia, Silvana. **Naturaleza:** persona_viva. **Hogar planificado:** `brumaverde_vivienda_02`.

#### La pieza que faltaba · `V_bruma_roque`

**Primeros años y lo que aprendió a querer:**

Roque tallaba animales que no se parecían del todo a los reales y vendió el primero porque alguien quiso su expresión torpe. Convertir placer en oficio le dio independencia, pero también prisa. Dejaba proyectos propios para después de cada encargo y el después cambiaba de estación. Le gusta recordar que amaba la madera antes de tener que justificar para qué serviría cada tabla.

**Aprendizaje, decisiones y vínculos:**

La rampa era una necesidad real. Gael bloqueó el permiso y Roque sintió que debía exponer una dificultad humana frente a vecinos para recibir el material. El enojo lo llevó a cortar a escondidas una pieza distinta, aunque tenía derecho a reclamar el procedimiento. Usó una causa legítima para evitar responder por su método. La obra útil no devuelve sola el árbol tomado.

**Lo que cambia y lo que todavía pesa:**

Guardó un juguete hecho con retales de aquella rampa y durante un tiempo lo mostró como prueba de aprovechamiento. La misión requiere reparar daño, permisos revisables y módulos hechos con entradas existentes. Puede querer ese juguete sin usarlo para ganar cada disputa. Silvana conserva autoridad sobre suelo y él exige que su evaluación sea explicable. No hace falta que ambos se vuelvan íntimos para colaborar correctamente.

**Cuando no ofrece una misión:**

Cuenta cuentos cortos mientras talla, prefiere café tibio y después del arco vuelve a un proyecto personal sin tratarlo como premio de virtud. Puede cobrar accesibilidad sin regalar toda la jornada. Con Gael mantiene una cortesía que todavía tiene días tensos.

**Ante Fuatia:**

A Fuatia le preguntaría dónde duerme quien protege árboles y no tiene techo. Puede aceptar límites de extracción, pero no que el deseo de conservar sea suficiente para negar toda madera. Mostrar recuperación real y reclamar una apelación forman parte del mismo cuidado que quiere practicar.

**Conversaciones personales:**

##### VID_bruma_roque_1 · Antes del cambio

> **Roque:** Este juguete salió de aquella rampa. Lo enseñaba para que nadie preguntara por el corte.
> **Gael:** Puedes conservarlo sin convertirlo en una defensa.
> **Roque:** Y puedo decirte que me humilló cómo trataste el permiso sin fingir que eso autorizaba lo mío.
> **Gael:** Sí. No voy a pedir que una reparación nos vuelva cómodos de golpe.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_bruma_roque_2 · Después del arco personal

> **Roque:** Cobré la rampa completa y dejé una tarde para este animal torcido.
> **Silvana:** ¿Es una especie nueva o te salió la pata así?
> **Roque:** Me salió así. Antes era justamente lo que alguien compraba.
> **Silvana:** Me gusta. No necesitas un permiso mío para el gusto.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Identificar madera y permiso.

> **Roque:** Necesitar la rampa era cierto. También fue cierto que escondí de dónde saqué la pieza.

**Acto 2:** Recuperar material permitido y compensar corte.

> **Roque:** Gael puede revisar su prohibición y yo reconocer lo mío. Una cosa no cancela la otra.

**Acto 3:** Construir módulo accesible con usuario presente.

> **Roque:** Esta madera alcanza porque el plano cambió, no porque el bosque nos deba más.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Módulo plegable o fijo reparable.

> **Roque · respuesta 1:** Plegable: Probaremos estabilidad antes de entregar.

> **Roque · respuesta 2:** Fijo: Cada pieza se podrá sustituir sin demoler.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La pieza que faltaba». Módulo de rampa reparable o plegable con presupuesto equivalente, probado antes de cambiar colisión. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Elio · `bruma_elio`

**Pasado:** Elio, 39, crió conejos y vio un unicornio recuperar una pradera dañada. Quiso repetir el fenómeno a cualquier costo, hasta que Mara le hizo ver que estaba buscando una revelación, no bienestar.

**Presente y personalidad:** Es reservado, fabrica juguetes de madera y habla mejor con cuidadores que con visitantes. Cree que necesita demostrar que su oficio sirve al gran mito.

**Cambio:** Cuida hábitat y acepta que una criatura no revele un manuscrito cuando él quiera. Facilita copia de estudio para la campaña.

**Vínculos:** Mara, Violeta, Ada. **Naturaleza:** persona_viva. **Hogar planificado:** `brumaverde_vivienda_03`.

#### La pradera que no es un laboratorio · `V_bruma_elio`

**Primeros años y lo que aprendió a querer:**

Los conejos de Elio le enseñaron a preparar espacio antes de ofrecer comida. Una pareja de animales tardó semanas en acercarse y él disfrutó un primer contacto que no pudo programar. Ese respeto coexistía con su ambición: quería descubrir algo que otros criadores contarían durante años. Cuando oyó hablar de criaturas míticas, comenzó a ver cuidados ordinarios como antesala de una experiencia más importante.

**Aprendizaje, decisiones y vínculos:**

El unicornio recuperó parte de una pradera dañada sin dejarla idéntica a la anterior. Elio copió detalles del encuentro y quiso repetirlos como receta. Seleccionó horarios y observadores buscando una nueva manifestación. El animal podía estar sano y no conceder el fenómeno; él empezó a sentirlo como fracaso propio. Mara preguntó cuándo había dejado de alegrarse simplemente de verlo descansar.

**Lo que cambia y lo que todavía pesa:**

Decidir facilitar una copia autorizada del manuscrito le quitó protagonismo: otros estudiarían la historia sin depender de su presencia. Sintió miedo de volverse prescindible y primero pidió demasiadas condiciones. La misión devuelve el valor al hábitat y permite que el cuidador siga teniendo oficio sin ser dueño de la revelación. No necesita renunciar al asombro, solo dejar de cobrarlo a una criatura.

**Cuando no ofrece una misión:**

Da nombres provisionales a madrigueras y se ríe cuando cambia el ocupante. Tras el arco puede visitar sin esperar una señal divina. Le gustan excursiones en que nadie saque cuaderno y conserva un boceto malo del unicornio porque recuerda cómo temblaba su mano.

**Ante Fuatia:**

Fuatia podría hablar con el animal mejor que él y esa idea despierta celos que no le gusta admitir. Le pediría no reunir público alrededor de una conversación de descanso. La amistad de una diosa tampoco convierte al unicornio en propiedad, y Elio debe aplicarse a sí mismo esa misma regla.

**Conversaciones personales:**

##### VID_bruma_elio_1 · Antes del cambio

> **Elio:** Anoté el momento exacto pensando que podría repetirlo. Me enfadé cuando no pasó nada.
> **Mara:** ¿El animal estaba bien?
> **Elio:** Sí. Esa respuesta dejó de bastarme y ahí empezó el problema.
> **Mara:** Podemos volver a visitarlo sin preparar un descubrimiento.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_bruma_elio_2 · Después del arco personal

> **Elio:** Presté la copia. No preguntaron si tenía que estar yo para entenderla.
> **Mara:** ¿Te dolió o te dio descanso?
> **Elio:** Las dos. Hoy quiero observar una madriguera bastante común.
> **Mara:** Esa todavía tendrá suficientes cosas para sorprenderte.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar bienestar de animales existentes.

> **Elio:** El unicornio no me debe una historia por haberle llevado agua.

**Acto 2:** Restaurar refugio y permitir elección de salida.

> **Elio:** Mara encontró todas las medidas correctas y ninguna pregunta sobre lo que necesitaba el animal.

**Acto 3:** Observar resultado y estudiar copia consentida del manuscrito.

> **Elio:** Si aparece el manuscrito, lo leeremos. Si no, la pradera igual habrá valido la pena.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Zona tranquila o sendero separado.

> **Elio · respuesta 1:** Tranquila: Los visitantes mirarán desde fuera.

> **Elio · respuesta 2:** Separado: El recorrido no atravesará el refugio.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La pradera que no es un laboratorio». Ficha de observación de pradera y manuscrito autorizado; sin mejorar probabilidades genéticas o exigir revelación. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Zaira · `bruma_zaira`

**Pasado:** Zaira, 42, aprendió herbolaria con una abuela y perdió pacientes por falta de recursos, no por maldad de un médico. Rechazó protocolos que sentía como desprecio a su familia. Adela la confrontó por una mezcla sin medida.

**Presente y personalidad:** Es franca, cultiva etiquetas junto a plantas y disfruta olores de cocina. Valora memoria local, teme que escribir dosis le quite dignidad al aprendizaje oral.

**Cambio:** Registra medidas con nombres de maestras y acepta contraindicaciones. Su arco no declara inútil la medicina ni convierte hierbas en cura universal.

**Vínculos:** Adela, Félix, Milena. **Naturaleza:** persona_viva. **Hogar planificado:** `brumaverde_vivienda_03`.

#### La medida de una memoria · `V_bruma_zaira`

**Primeros años y lo que aprendió a querer:**

La abuela de Zaira enseñaba herbolaria mientras contaba quién había aprendido antes que ella. Las historias permitían recordar usos y personas, aunque no siempre cantidades. Zaira recibió cuidado y saber juntos; separarlos le parecía romper una herencia. Cuando empezó a atender fuera de casa, algunos profesionales descartaron sus relatos antes de preguntar qué había hecho. Aprendió a defender la dignidad familiar con la misma intensidad con que defendía una mezcla.

**Aprendizaje, decisiones y vínculos:**

Estudiar con Adela amplió métodos y una relación adulta compartida. Podían discutir sin convertirlo en guerra entre tradición y ciencia hasta que una dosis sin medida produjo una disputa donde se lastimaron de forma personal. Zaira oyó corrección como desprecio a su abuela; Adela buscó certeza para no nombrar miedo. Terminaron la relación y no usan el pasado afectivo como derecho a reconciliarse.

**Lo que cambia y lo que todavía pesa:**

Hubo pacientes que perdió por falta de recursos. Zaira rechazaba convertir esas pérdidas en evidencia contra todo su saber, pero también evitó revisar ocasiones donde sí podía mejorar. Su misión registra dosis, contraindicaciones y nombres de maestras. Reconocer un límite no declara inútil a su abuela. Mantener una memoria no exige aplicar hoy lo que entonces se hizo con herramientas diferentes.

**Cuando no ofrece una misión:**

Conserva una receta de cocina cuya única medida es a gusto y se divierte separándola de la ficha clínica. Tras el arco puede trabajar con Adela sin vivir juntas otra vez. Quiere amistad posible, no perdón inmediato ni la promesa de que nunca volverán a discutir.

**Ante Fuatia:**

Hablaría con Fuatia sobre plantas sin reclamar una cura perfecta. Le preocupa que un favor divino vuelva intocable una dosis. Si la diosa hace sufrir a quien abusó del suelo, Zaira atenderá a una persona que lo necesita sin exigir primero una confesión que satisfaga a la deidad.

**Conversaciones personales:**

##### VID_bruma_zaira_1 · Antes del cambio

> **Zaira:** Cuando corrigieron la mezcla oí que mi abuela era una ignorante. No era lo que habías escrito.
> **Adela:** Yo tampoco separé bien el miedo del tono que usé contigo.
> **Zaira:** Quiero conservar nombres y cambiar medidas. Antes me parecía escoger una lealtad.
> **Adela:** Podemos revisar una ficha sin pedirle que resuelva nuestra relación anterior.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_bruma_zaira_2 · Después del arco personal

> **Zaira:** La receta de cocina sigue diciendo a gusto. No voy a convertir toda la casa en consulta.
> **Ada:** ¿Puedo llevarme una porción aunque no tenga cantidad exacta?
> **Zaira:** Esa sí. La medicina viene en otra hoja y con instrucciones bastante menos poéticas.
> **Ada:** Me gusta saber dónde podemos bromear y dónde necesitamos medir.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Identificar tres plantas seguras.

> **Zaira:** Mi abuela medía. Que no usara tu instrumento no significa que no hubiera medida.

**Acto 2:** Comparar preparación medida con Adela.

> **Zaira:** Yo defendía su nombre. Dejé de preguntar si esta mezcla la habría preocupado también.

**Acto 3:** Redactar ficha con contraindicaciones y fuentes.

> **Zaira:** La receta llevará a mi abuela y a Adela. Ninguna firma borra a la otra.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Guía oral transcrita o taller conjunto.

> **Zaira · respuesta 1:** Oral: La transcripción conservará también los límites.

> **Zaira · respuesta 2:** Taller: No daremos el preparado a un animal sin indicación.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La medida de una memoria». Guía de dosis, fuentes y límites de preparación, consultable sin usar remedio en animal sano. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Ada · `bruma_ada`

**Pasado:** Ada, 25, estudió suelos para recuperar una parcela degradada. Le atribuyeron a ella el hallazgo de un hábitat que una cuadrilla llevaba años cuidando; calló porque necesitaba una beca.

**Presente y personalidad:** Es curiosa, dibuja cerdos de musgo y evita ceremonias. Quiere reconocimiento sin perder vínculos; escribe cartas de agradecimiento que nunca envía.

**Cambio:** Corrige autoría, comparte seguimiento y conserva el oficio ganado sin apropiarse del trabajo anterior. Sigue presentándose como investigadora. No necesita renunciar a su trabajo para reconocer que su primer crédito estaba incompleto.

**Vínculos:** Elio, Celino, Silvana. **Naturaleza:** persona_viva. **Hogar planificado:** `brumaverde_vivienda_04`.

#### El nombre bajo el musgo · `V_bruma_ada`

**Primeros años y lo que aprendió a querer:**

Ada quería recuperar una parcela conocida y consiguió estudiar suelos como quien aprende el idioma de un lugar querido. Le gustaba llegar con preguntas que trabajadores mayores no trataban como competencia. La beca prometía continuidad económica y ella sabía cuánto dependía de una evaluación externa. Por eso una oportunidad profesional podía sentirse como un salvavidas, no como prestigio decorativo.

**Aprendizaje, decisiones y vínculos:**

Un informe le atribuyó sola un hábitat que una cuadrilla conservaba desde antes. No lo escribió así, pero vio la frase antes de publicarse. Pensó que corregirla podía retrasar la beca y prometió reconocer aportes en un artículo siguiente. El siguiente nunca tenía bastante espacio. La omisión se fue volviendo una decisión sostenida, más incómoda que el error inicial.

**Lo que cambia y lo que todavía pesa:**

Amira necesitó una medición que contrariaba su plan y Ada supo explicarle por qué un beneficio familiar no borraba el desequilibrio. Oírse decirlo le hizo reconocer lo que aún evitaba en su propia carrera. La misión corrige crédito, comparte seguimiento y permite conservar su empleo ganado. No entrega todo mérito a otros por expiación; aprende a separar trabajo propio de apropiación.

**Cuando no ofrece una misión:**

Le gustan cuadernos usados, almuerzos con conversación que no termine en otra propuesta de estudio y caminar hasta una parcela sin recoger muestras. Tras el arco consulta nombres antes de publicar, incluso cuando eso retrasa una entrega. Sigue aspirando a una investigación importante.

**Ante Fuatia:**

Fuatia le ofrece una mirada material que ninguna muestra alcanza. Ada quiere escucharla sin que el testimonio divino borre el de la cuadrilla. Si la diosa premia a una figura visible, le mostrará quienes sostuvieron el cuidado sin recibir una aparición. Investigar también exige preguntar quién queda fuera del relato.

**Conversaciones personales:**

##### VID_bruma_ada_1 · Antes del cambio

> **Ada:** La frase estaba en el borrador. Yo pude escribir al editor y no lo hice.
> **Flora:** Puedes explicar cuánto dependías de la beca. Eso no cambia quién había cuidado el hábitat.
> **Ada:** Lo sé. Quiero corregir sin fingir que no hice ningún trabajo propio.
> **Flora:** Entonces escribamos una autoría completa, no otra incompleta con tu nombre borrado.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_bruma_ada_2 · Después del arco personal

> **Ada:** Esta vez faltaba un nombre y pregunté antes de cerrar. La entrega se retrasó.
> **Amira:** ¿Perdiste la beca?
> **Ada:** No. Pero habría seguido siendo lo correcto si tocaba defenderla con el informe más lento.
> **Amira:** Hoy podemos celebrar una cosa sin prometer que todo saldrá fácil.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Examinar hábitat sin retirar musgo vivo.

> **Ada:** Me felicitaron antes de que supiera cómo explicar lo que no había hecho.

**Acto 2:** Entrevistar cuidadores y recuperar registros.

> **Ada:** Callarme no fue modestia. Fue dejar que otros desaparecieran de mi premio.

**Acto 3:** Publicar restauración con coautoría y límite de uso.

> **Ada:** El suelo no cambió al corregir la placa. Nosotros sí podemos cambiar.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Panel comunitario o informe del archivo.

> **Ada · respuesta 1:** Panel: Los residentes elegirán qué nombres mostrar.

> **Ada · respuesta 2:** Archivo: Guardaremos autorizaciones y una copia local.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El nombre bajo el musgo». Registro de hábitat, autores y recuperación que no revela ubicación sensible a visitantes. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Benicio · `bruma_benicio`

**Pasado:** Benicio, 72, aprendió relatos de varias familias y combinó versiones para actuar en fiestas. Una mezcla terminó citada como hecho antiguo sobre el escudo; disfrutó tanto ser escuchado que tardó en corregirla.

**Presente y personalidad:** Tiene humor travieso, distingue voces con facilidad y adora escuchar cuentos malos de niños. No recuerda AV 0: transmite relatos aprendidos.

**Cambio:** Separa tradición, invención y testimonio, sin dejar de narrar. Devuelve crédito a narradoras olvidadas. En una visita posterior pregunta a Leo por su dragón inventado y disfruta el cuento sin corregirlo como si fuera un plano.

**Vínculos:** Damián, Esteban, Alma. **Naturaleza:** persona_viva. **Hogar planificado:** `brumaverde_vivienda_04`.

#### Un cuento no es un acta · `V_bruma_benicio`

**Primeros años y lo que aprendió a querer:**

Benicio creció escuchando variantes de una misma historia en casas que no querían coincidir. Le divertía llevar una frase de un relato al siguiente y observar a adultos reconocerse de forma inesperada. Narrar le dio un lugar sin oficio de fuerza ni terreno propio. Aprendió a escoger pausas por la respiración de quien escuchaba, una atención real que después también podía usar para guiar hacia una conclusión cómoda.

**Aprendizaje, decisiones y vínculos:**

En fiestas combinó versiones para hacer una pieza más emocionante. La anunció como cuento, pero al circular quedó citada como hecho antiguo sobre el escudo. Oyó una repetición incorrecta y sintió orgullo antes de inquietud. No todos los errores de memoria le parecían graves, y prefería disfrutar un público numeroso a interrumpirlo para hablar de fuentes.

**Lo que cambia y lo que todavía pesa:**

Alma usó una frase en escuela y preguntó procedencia. Benicio podía nombrar tres narradoras cuyas voces había mezclado, pero nunca aparecían en el programa. La misión separa testimonio e invención, devuelve crédito y le permite seguir contando. No necesita hablar como un archivo para ser honesto: debe avisar qué tipo de historia ofrece y dejar que otra persona recuerde distinto.

**Cuando no ofrece una misión:**

Le gustan cuentos absurdos de Leo y no los corrige como mapas. Después del arco puede preparar una función inventada con entusiasmo sin venderla como descubrimiento histórico. Tiene días en que olvidar un nombre lo entristece; pide ayuda en vez de rellenarlo con uno convincente.

**Ante Fuatia:**

El nacimiento de Fuatia le parece una historia que el público quiere volver perfectamente justa o completamente monstruosa. Prefiere contar la precisión de sus muertes y el dolor de familiares protegidos sin borrar ninguno. La diosa puede escuchar un relato donde no controla la reacción de todos los oyentes.

**Conversaciones personales:**

##### VID_bruma_benicio_1 · Antes del cambio

> **Benicio:** La aplaudieron y pensé que la mezcla debía ser mejor que las historias de cada casa.
> **Alma:** Una mezcla puede ser buena y todavía necesitar decir que la inventaste.
> **Benicio:** Me costó admitirlo porque habían empezado a citarme como si hubiera estado allí.
> **Alma:** Podemos devolverles otros nombres sin perder tu voz en el escenario.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_bruma_benicio_2 · Después del arco personal

> **Leo:** Mi cuento tiene una puerta donde la realidad no tiene ninguna.
> **Benicio:** Excelente. ¿Cómo avisaremos antes de que alguien vaya a buscarla?
> **Leo:** Ponemos inventado y luego contamos por qué me gustaría que estuviera.
> **Benicio:** Eso quiero escuchar. Un deseo no necesita hacerse pasar por un plano.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Escuchar dos versiones consentidas.

> **Benicio:** Este dragón habló porque yo necesitaba un final divertido. El manuscrito nunca dijo que hablara.

**Acto 2:** Señalar qué parte es creación del narrador.

> **Benicio:** Ser un buen cuento no le da permiso para ocupar el lugar de un testigo.

**Acto 3:** Grabar relato con fuentes y contexto.

> **Benicio:** Ahora puedo inventar otra vez. Ya saben cuándo estoy haciéndolo.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Relato humorístico o memoria oral.

> **Benicio · respuesta 1:** Humor: Lo anunciaré como cuento, bien claro.

> **Benicio · respuesta 2:** Memoria: Mantendré las dudas de quien la contó.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «Un cuento no es un acta». Cuento reproducible marcado como ficción o memoria según permiso; no sustituye documentos canónicos. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## piedralumbre

### Eloy · `piedra_eloy`

**Pasado:** Eloy, 54, entró de joven a una brigada después del accidente de AV 281. Atribuyó su supervivencia posterior a normas inflexibles y comenzó a cerrar rutas sin explicar criterio.

**Presente y personalidad:** Es sobrio, hornea pan los domingos y sabe los nombres de familias mineras. Quiere evitar riesgos; confunde una reclamación con un ataque.

**Cambio:** Introduce apelaciones y publica umbrales de cierre. Mantiene límites reales de equipo y nunca entrega permiso como premio de simpatía.

**Vínculos:** Darío, Hugo, Mireya. **Naturaleza:** persona_viva. **Hogar planificado:** `piedralumbre_vivienda_01`.

#### Un permiso con razones · `V_piedra_eloy`

**Primeros años y lo que aprendió a querer:**

Eloy tenía veintitrés años cuando el accidente de AV 281 cambió cómo se hablaba de la mina. Entró en una brigada posterior y recibía instrucciones acompañadas de historias que nadie terminaba de explicar. Una norma escrita le parecía una oportunidad de no depender del ánimo del superior. Aprendió seguridad con cuidado verdadero y orgullo por regresar con todos; ese valor no nació como deseo de mandar.

**Aprendizaje, decisiones y vínculos:**

Una ruta que cerró evitó un desprendimiento y el reconocimiento reforzó su certeza. Empezó a usar la misma severidad para riesgos diferentes, sin publicar criterios. Si alguien pedía revisar, lo oía como exigencia de arriesgar una vida. La experiencia que había permitido prevenir un daño terminó impidiendo discutir cuándo ya existían condiciones seguras para volver.

**Lo que cambia y lo que todavía pesa:**

Mireya necesitó acceso para revisar una bomba y él rechazó explicar el umbral. Una reparación retrasada afectó a otra cuadrilla. Eloy no eligió ese daño, pero su procedimiento lo hizo más difícil de resolver. La misión introduce apelación y registro sin abrir cada ruta por simpatía. Puede soportar que la revisión confirme su cierre y también que otra evaluación lo modifique.

**Cuando no ofrece una misión:**

Colecciona pequeños modelos de ascensores y disfruta carreras lentas de piezas sobre una mesa. Después del arco no cobra un diálogo como peaje. Al salir del puesto puede pedir consejo sin fingir que conserva la última palabra sobre toda decisión ajena.

**Ante Fuatia:**

Fuatia le atrae porque siente riesgos que él solo estima. No quiere utilizar esa ventaja para hacer sus prohibiciones indiscutibles. Le pedirá publicar por qué un sector permanece cerrado y cómo puede cambiarlo una recuperación real. La confianza en una diosa no debe volver secreta la seguridad de una brigada.

**Conversaciones personales:**

##### VID_piedra_eloy_1 · Antes del cambio

> **Eloy:** La primera vez que un cierre funcionó pensé que bastaría hacerlo igual siempre.
> **Mireya:** Mi bomba esperaba una revisión distinta. La misma puerta cerraba dos problemas.
> **Eloy:** Tenía miedo de explicar algo que luego pudiera discutirse.
> **Mireya:** Precisamente por eso necesitábamos poder discutirlo antes de quedarnos sin agua.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_piedra_eloy_2 · Después del arco personal

> **Eloy:** La apelación confirmó un cierre y cambió otro. No sé con cuál me siento más extraño.
> **Gonzalo:** Con el que ya no depende de que te guste la respuesta.
> **Eloy:** Sí. Hoy voy a dejar el registro y cenar sin revisarlo otra vez.
> **Gonzalo:** Si te sientas aquí, hablamos del modelo que nunca consigues terminar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar tres condiciones de entrada.

> **Eloy:** La reja puede estar cerrada. La explicación tiene que estar abierta.

**Acto 2:** Probar señalización de salida en galería segura.

> **Eloy:** Un trabajador me pidió entender la regla. Yo oí que quería saltársela.

**Acto 3:** Publicar autorización limitada y fecha de revisión.

> **Eloy:** Podrán reclamar ante otro turno. No tienen que convencerme a mí de que les caigo bien.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Inspección por pares o segundo responsable.

> **Eloy · respuesta 1:** Pares: Ambos registrarán el mismo criterio.

> **Eloy · respuesta 2:** Responsable: Tendrá autoridad para corregirme, no solo avisarme.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «Un permiso con razones». Consulta de criterios y apelación de entrada; la autorización concreta siempre exige condiciones de seguridad. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Úrsula · `piedra_ursula`

**Pasado:** Úrsula, 35, clasificó una geoda usando el lugar de compra y publicó una procedencia falsa. La piedra venía de una galería cerrada y su informe ayudó a vender más. Retiró el artículo, no ha contactado a todos los afectados.

**Presente y personalidad:** Es minuciosa, rompe lápices al apretar y disfruta piedras sin valor comercial. Quiere terminar de reparar sin que su oficio se reduzca al error.

**Cambio:** Distingue extracción, transferencia y observación. La procedencia requiere recibo real; una pieza comprada no demuestra haber descendido.

**Vínculos:** Darío, Olmo, Kenzo. **Naturaleza:** persona_viva. **Hogar planificado:** `piedralumbre_vivienda_01`.

#### La piedra y el camino · `V_piedra_ursula`

**Primeros años y lo que aprendió a querer:**

Úrsula encontró su primera geoda en una compra de mercado y quiso saber de dónde había salido. Nadie conservaba un recibo claro. La incertidumbre la impulsó a estudiar, pero también le dejó deseo de ofrecer respuestas más elegantes que las disponibles. Una maestra le enseñó a dibujar inclusiones sin corregirlas hacia una forma esperada; esa paciencia reaparece cuando admite lo que no puede acreditar.

**Aprendizaje, decisiones y vínculos:**

El artículo confundió lugar de compra y extracción. Había visto una etiqueta comercial y la tomó como procedencia. Cuando lectores empezaron a pedir piezas semejantes, disfrutó que su investigación ayudara a un taller. Descubrir una galería cerrada no solo corregía una frase: comprometía contratos sostenidos por su autoridad. Retiró el texto con prisa y esperaba que retirarlo terminara todo.

**Lo que cambia y lo que todavía pesa:**

Petra encontró clientes que conservaban el certificado antiguo. Úrsula quiso explicar que ya no lo usaba; Petra preguntó cómo iban a saberlo quienes no seguían su trabajo. La misión incluye contactar y publicar la cadena de transferencia. No convierte cada vendedor en culpable por asociación ni exige descender para valorar una piedra. Separa conocimiento de posesión y de viaje.

**Cuando no ofrece una misión:**

Le gustan piedras corrientes bajo buena luz y conversaciones donde no tenga que identificar un objeto. Tras el arco mantiene un archivo de correcciones con acceso sencillo. Puede entusiasmarse con una hipótesis, siempre que no se venda como certificado antes de comprobarla.

**Ante Fuatia:**

Fuatia podría sentir la herida de extracción que falta en un registro. Úrsula la escucharía, pero pediría un testimonio comprensible y consentimiento antes de usarlo. No inventará «procedencia elemental» para encarecer cualquier geoda ni confundirá la presencia de la diosa con permiso de una galería.

**Conversaciones personales:**

##### VID_piedra_ursula_1 · Antes del cambio

> **Úrsula:** Comprada en Piedralumbre terminó escrita como extraída aquí. No parecía una gran distancia.
> **Petra:** Para el precio sí la fue. Todavía hay clientes con tu certificado viejo.
> **Úrsula:** Yo esperaba que retirar el artículo retirara también todas sus consecuencias.
> **Petra:** Podemos empezar contactando a uno. El papel que ya tiene no se corrige solo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_piedra_ursula_2 · Después del arco personal

> **Úrsula:** Esta ficha dice transferencia conocida, extracción pendiente. Me gusta cómo quedó de poco solemne.
> **Petra:** ¿Puedo vender la piedra igual?
> **Úrsula:** Claro, explicando esa parte. No necesita una expedición inventada para ser hermosa.
> **Petra:** Por fin un certificado que no intenta competir con la joya.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar inventario con recibos de origen.

> **Úrsula:** La piedra era auténtica. La historia que yo le pegué no.

**Acto 2:** Examinar muestra de galería autorizada.

> **Úrsula:** No saber dónde nació una muestra es un dato mejor que inventarle una ruta.

**Acto 3:** Corregir ficha y notificar compradores.

> **Úrsula:** Esta ficha dice observado aquí, extraído allí, recibido después. Cada verbo importa.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Retornar muestra o préstamo de estudio.

> **Úrsula · respuesta 1:** Retorno: Dejaremos registro sin apropiarnos del objeto.

> **Úrsula · respuesta 2:** Préstamo: La fecha y devolución serán condiciones del cierre.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La piedra y el camino». Ficha de procedencia que separa observación, extracción y transferencia de una muestra. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Gonzalo · `piedra_gonzalo`

**Pasado:** Gonzalo, 57, perdió a compañeros en AV 281 y sobrevivió al cierre mal comunicado. No sabe toda la secuencia; durante años acusó a Bruno, un aprendiz que llevaba un recado. Su dolor es real y su acusación necesita corrección.

**Presente y personalidad:** Trabaja en silencio, hace hierro delicado y no soporta discursos de homenaje. Guarda una caja con nombres autorizados por familias.

**Cambio:** Contrasta el acta, retira acusación falsa y exige reparación institucional sin verse obligado a perdonar a Aurelio.

**Vínculos:** Bruno, Aurelio, Eloy. **Naturaleza:** persona_viva. **Hogar planificado:** `piedralumbre_vivienda_02`.

#### El metal no recuerda por nosotros · `V_piedra_gonzalo`

**Primeros años y lo que aprendió a querer:**

Gonzalo entró a la mina por salario y se quedó por compañeros que acabaron conociendo mejor que algunos vecinos. Compartían comida, discusiones sobre turnos y proyectos que no tenían relación con roca. Antes de AV 281 esperaba ahorrar para un taller pequeño y enseñar sin presión de producción. Recordar aquel deseo le duele porque otros querían cosas igualmente ordinarias y no tuvieron tiempo de intentarlas.

**Aprendizaje, decisiones y vínculos:**

Tenía veintiséis años durante el cierre mal comunicado. Sobrevivió sin comprender toda la secuencia, aunque durante décadas otros esperaban que el sobreviviente tuviera la versión completa. Bruno llevaba un recado y Gonzalo usó esa ausencia para construir una acusación. La certeza le daba un lugar donde poner rabia que no sabía discutir con una institución. La repetición convirtió sospecha en relato público y lesionó a alguien que tampoco podía reconstruir la tarde.

**Lo que cambia y lo que todavía pesa:**

Cada aniversario pensaba retirar una frase y lo posponía porque temía perder el derecho a reclamar por su brigada. Darío conservaba preguntas, Aurelio conservaba autoridad y el grupo no podía tener una sola memoria limpia. La misión contrasta actas, retira acusación falsa y mantiene exigencia de reparación. Perdonar a Aurelio no es condición de progreso; conservar enojo tampoco autoriza seguir señalando a Bruno. Gonzalo puede aprender una injusticia propia sin aceptar que toda responsabilidad quede diluida en una tragedia.

**Cuando no ofrece una misión:**

Disfruta arreglar una herramienta para alguien que no sabe quién fue en la mina. Tiene un juego de mesa incompleto que su brigada inventaba y no desea reconstruir con frases ajenas. Tras el arco puede contar una anécdota alegre sin que el oyente la convierta en consuelo. Quiere conservar nombres, no vivir obligado a representar todas las pérdidas.

**Ante Fuatia:**

Comprende el rencor constitutivo de Fuatia y teme lo cómodo que resulta sostenerlo. No le exige olvidar a los explotadores ni admite que castigue a quien no corresponde. En una conversación decisiva defenderá que comprobar una acusación no traiciona a víctimas. La diosa puede respetar ese límite sin convertirse en amiga suya.

**Conversaciones personales:**

##### VID_piedra_gonzalo_1 · Antes del cambio

> **Gonzalo:** Queríamos ahorrar para un taller. La gente pregunta por los últimos minutos, casi nunca por lo que íbamos a hacer después.
> **Bruno:** ¿Quieres contarme el taller o prefieres que deje de preguntar también yo?
> **Gonzalo:** Quiero contarlo. Me costará que estés aquí, Bruno. Eso no significa que tengas que irte.
> **Bruno:** Puedo escuchar sin defender otra vez dónde me encontraba aquella tarde.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_piedra_gonzalo_2 · Después del arco personal

> **Gonzalo:** Retiré tu nombre de la acusación. No te pido que me digas que ahora estamos bien.
> **Bruno:** Agradezco que lo hicieras delante de quienes la oyeron. Necesitaré más tiempo para otra cosa.
> **Gonzalo:** Lo sé. Hoy puedo dejar una herramienta y volver otra jornada.
> **Bruno:** Déjala. El trabajo tiene su precio y la conversación podrá esperar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar actas completas.

> **Gonzalo:** No quiero una placa que cierre la conversación. Quiero la conversación que no tuvimos.

**Acto 2:** Escuchar versión de Bruno con tercero presente.

> **Gonzalo:** Bruno estaba fuera. Lo sabía, y aun así le cobré que pudiera seguir caminando.

**Acto 3:** Fabricar placa con consentimiento y corregir atribuciones.

> **Gonzalo:** Retiro esa acusación. Lo demás seguirá en investigación.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Memorial pequeño o archivo sin placa.

> **Gonzalo · respuesta 1:** Pequeño: Ningún nombre irá sin permiso de la familia.

> **Gonzalo · respuesta 2:** Archivo: No mostrarlo en plaza no significa olvidarlo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El metal no recuerda por nosotros». Registro del accidente corregido y permisos de memorial, sin forzar perdón ni exponer a familiares. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Petra · `piedra_petra`

**Pasado:** Petra, 30, tallaba gemas para clientes ricos y ocultó una inclusión que reducía resistencia. La pieza se quebró; devolvió dinero, pero aprendió a esconder otras imperfecciones visuales por vergüenza.

**Presente y personalidad:** Es alegre, celebra piedras asimétricas fuera del trabajo y se viste con delantales llenos de remiendos. Quiere belleza que nadie cuestione.

**Cambio:** Ofrece clasificación legible y piezas reparables. La técnica no mejora rareza genética ni convierte cualquier piedra en gema valiosa.

**Vínculos:** Úrsula, Pía, Sol. **Naturaleza:** persona_viva. **Hogar planificado:** `piedralumbre_vivienda_02`.

#### Una grieta que entra en el diseño · `V_piedra_petra`

**Primeros años y lo que aprendió a querer:**

Petra aprendió a tallar mirando cómo cambiaba una piedra al girarla. Le interesaban inclusiones que compradores consideraban defectos y durante un tiempo coleccionó las piezas descartadas. El primer encargo caro llegó con una exigencia de apariencia perfecta. Poder cobrarlo le permitió elegir herramientas y le hizo creer que profesionalizarse consistía en abandonar el gusto por aquello que el cliente no valoraba.

**Aprendizaje, decisiones y vínculos:**

Ocultó una inclusión que disminuía resistencia. La joya se quebró y devolvió dinero, una acción necesaria que no terminó su miedo. Empezó a disimular incluso marcas inocuas porque temía que otra irregularidad pareciera prueba de incompetencia. Su trabajo se volvió cada vez más uniforme y menos propio. Le costaba reconocer que no había querido solamente evitar hambre: también había querido pertenecer al mundo que compraba piezas impecables.

**Lo que cambia y lo que todavía pesa:**

Úrsula necesitó explicar un certificado incorrecto y Petra vio que la apariencia del papel podía ocultar tanto como un corte. Su misión ofrece clasificación legible y reparaciones con límites. Puede mantener piezas de lujo sin prometer invulnerabilidad. Al volver a una gema irregular distingue un gusto personal de un argumento comercial: no hará de cada marca una historia sagrada para justificar precio.

**Cuando no ofrece una misión:**

Trabaja escuchando música breve y escoge piedras para una caja que no vende. Después del arco firma condición estructural antes de cerrar factura. Puede decirle a un cliente que una pieza no sirve para el uso que quiere y conservar orgullo aunque pierda esa compra.

**Ante Fuatia:**

No considera que sentir extracción vuelva a Fuatia dueña de todos los significados de una gema. Quiere presentar trazabilidad y uso responsable; puede admirar un color sin atribuir virtud a quien lo lleva. Le inquieta que la diosa castigue ostentación sin distinguir un regalo querido de un desprecio al suelo.

**Conversaciones personales:**

##### VID_piedra_petra_1 · Antes del cambio

> **Petra:** La inclusión que oculté sí afectaba la pieza. Las que escondí después no siempre lo hacían.
> **Úrsula:** ¿Por miedo a otra rotura?
> **Petra:** Por miedo a que alguien me viera antes de que yo pudiera explicarme.
> **Úrsula:** Podemos hacer una ficha que empiece por el uso y no por defender toda tu trayectoria.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_piedra_petra_2 · Después del arco personal

> **Petra:** Esa piedra va a mi caja, no al mostrador. Me gusta y no quiero inventarle un precio especial.
> **Úrsula:** ¿Puedo verla sin clasificarla?
> **Petra:** Sí. Gírala. La marca se ve mejor justo donde antes la habría escondido.
> **Úrsula:** Voy a mirarla un rato antes de pedirte cualquier dato.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Examinar tres inclusiones.

> **Petra:** Esta línea es hermosa. También debilita la pieza. Puedo decir las dos cosas.

**Acto 2:** Tallar muestra sin ocultar defecto.

> **Petra:** Vael vendería una forma perfecta. Yo estaba empezando a vender una fotografía.

**Acto 3:** Entregar ficha de uso y reparación.

> **Petra:** La montura protege la grieta y la deja visible. Ahora sí está terminada.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Montura visible o uso decorativo.

> **Petra · respuesta 1:** Visible: No se venderá como pieza de carga.

> **Petra · respuesta 2:** Decorativo: Indicaremos que no sirve para herramienta.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «Una grieta que entra en el diseño». Montura protectora visible o pieza decorativa con misma calidad base y clasificación de uso. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Santiago · `piedra_santiago`

**Pasado:** Santiago, 37, aprendió herrería con Bruno y diseñó armaduras según su propio cuerpo. Una exploradora no podía moverse bien con su equipo; la llamó inexperta antes de revisar el patrón.

**Presente y personalidad:** Es amable, disfruta bailes y se avergüenza al admitir que una armadura bonita puede estorbar. Cree que proteger exige endurecer cada pieza.

**Cambio:** Prueba movilidad y ofrece variantes laterales, no escalada permanente de defensa. Reconoce a quienes prueban sin convertirlos en maniquíes.

**Vínculos:** Bruno, Vera, Otto. **Naturaleza:** persona_viva. **Hogar planificado:** `piedralumbre_vivienda_03`.

#### La armadura donde alguien cabe · `V_piedra_santiago`

**Primeros años y lo que aprendió a querer:**

Santiago aprendió con Bruno que una pieza buena no debía exigir que quien la usaba se adaptara a un fallo. Le gustaba fabricar algo que pudiera probar con sus propias manos. Su cuerpo se convirtió en medida cómoda porque siempre estaba disponible. Años de pruebas exitosas ocultaron cuánto se parecían sus clientes a él y cuánto había delegado en ellos la dificultad de usar lo distinto.

**Aprendizaje, decisiones y vínculos:**

Una exploradora no se movía bien con su equipo. Santiago revisó cierres, encontró que respondían y la llamó inexperta antes de preguntar dónde presionaba la pieza. Había definido correcto como ajustado a su patrón. Al probar con una distribución diferente descubrió su propio error. Le avergonzó admitir que las quejas anteriores podían haber señalado lo mismo y no haber recibido escucha.

**Lo que cambia y lo que todavía pesa:**

La misión ofrece variantes de movilidad y reconoce a probadores como personas. La nueva ampliación RPG se limita a armas: sus viejos protectores conservan función de seguridad y relato, sin abrir por ello árboles de armadura o estadísticas globales. Santiago aprende a construir empuñaduras, apoyos y pesos para gustos diferentes. No tiene que abandonar el oficio anterior para dejar de convertir su cuerpo en estándar universal.

**Cuando no ofrece una misión:**

Hace ejercicios de agarre con piezas sin filo, comparte bromas con Petra y quiere una mesa de trabajo ajustable para sí mismo. Después del arco pregunta cómo se usará una espada antes de hablar de su acabado. No exige que todos quieran combate cuerpo a cuerpo.

**Ante Fuatia:**

Le mostraría a Fuatia una hoja destinada a defender una ruta y no fingiría que el mineral dejó de salir del suelo. Pide que juzgue volumen, uso y recuperación, no una familia de arma como moralmente inferior. Un bastón elemental también necesita materiales y responsabilidad.

**Conversaciones personales:**

##### VID_piedra_santiago_1 · Antes del cambio

> **Santiago:** Dijiste que apretaba aquí y yo contesté que el cierre funcionaba. No estaba respondiendo tu problema.
> **Vera:** Necesitaba moverme, no felicitar al mecanismo.
> **Santiago:** Quiero probar otra distribución sin pedirte que sufras para demostrarla.
> **Vera:** Empezamos con una pieza sin filo y paramos cuando te lo diga.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_piedra_santiago_2 · Después del arco personal

> **Santiago:** Tres personas escogieron pesos distintos. Antes habría decidido que dos necesitaban acostumbrarse.
> **Bruno:** ¿Y hoy?
> **Santiago:** Hoy anoté preferencias. También hice uno que me gusta a mí, sin llamarlo el mejor para todos.
> **Bruno:** Ese progreso sí puedo medir sin que tengamos que discutir de talento.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Medir movilidad con consentimiento.

> **Santiago:** Si no puedes correr de vuelta, no te protegí. Te vestí.

**Acto 2:** Fabricar variante con presupuesto equivalente.

> **Santiago:** Vera me explicó dónde dolía. Yo le expliqué mi experiencia. No estaba respondiendo.

**Acto 3:** Probar giro y retorno en zona sin daño.

> **Santiago:** Esta variante cambia el ajuste, no convierte a nadie en invulnerable.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Movilidad o carga equilibrada.

> **Santiago · respuesta 1:** Movilidad: Conserva la defensa base y reduce capacidad de carga propuesta.

> **Santiago · respuesta 2:** Carga: Conserva movilidad base y exige peso máximo visible.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La armadura donde alguien cabe». Patrón de ajuste lateral de armadura: movilidad/carga contextual con presupuesto equivalente, sin más defensa global. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Mireya · `piedra_mireya`

**Pasado:** Mireya, 32, automatizó bombas para cuidar a su padre residente de fondo. Una prioridad mal configurada dejó a otra cuadrilla sin agua; trató el incidente como fallo humano de quienes no leyeron el panel.

**Presente y personalidad:** Es rápida, desmonta aparatos para relajarse y se impacienta cuando explicaciones técnicas no alcanzan. Quiere ahorrar tiempo y a veces lo cobra a quienes aprenden.

**Cambio:** Diseña límites, reservas y botón de parada. Acepta que una automatización debe poder entenderse y no generar entradas infinitas.

**Vínculos:** Tessa, Eloy, Mara. **Naturaleza:** persona_viva. **Hogar planificado:** `piedralumbre_vivienda_03`.

#### La máquina que sabe detenerse · `V_piedra_mireya`

**Primeros años y lo que aprendió a querer:**

Mireya aprendió mecanismos ayudando a reparar herramientas sencillas y disfrutaba ver que un movimiento pudiera continuar sin su mano. Al organizar cuidado de su padre residente de fondo quiso recuperar horas, no reemplazar cariño por máquinas. Una bomba automática le permitió compartir una comida completa. Conserva ese beneficio real cuando discute los daños posteriores, porque comprender un error no exige llamar inútil a todo lo construido.

**Aprendizaje, decisiones y vínculos:**

Una prioridad mal fijada dejó otra cuadrilla sin agua. Mireya encontró que el panel mostraba la condición y defendió que el operador debió leerlo. Había diseñado la advertencia después de decidir el reparto y la colocó donde solo ella la buscaba. Los afectados vieron que una explicación correcta podía ser una forma de eludir la elección que creó el problema.

**Lo que cambia y lo que todavía pesa:**

Eloy cerró acceso a revisión y Mireya necesitó reclamar un criterio legible. Reconoció su propio argumento en aquella negativa. La misión define reservas, parada y fallo comprensible sin generar entradas infinitas. Puede seguir automatizando cuidado mientras acepta que ahorrar tiempo para una familia no permite trasladar todo riesgo a otra. El padre no es una deuda narrativa que deba curarse al completar una bomba.

**Cuando no ofrece una misión:**

Mantiene una máquina de juguete que no ahorra absolutamente nada y le gusta por su ruido regular. Tras el arco prepara una instrucción con quienes operan, además del diagrama. Puede apagar un circuito una tarde sin sentir que falló como hija o ingeniera.

**Ante Fuatia:**

La omnipresencia de Fuatia le inspira un riesgo: diseñar suponiendo que siempre habrá alguien percibiendo el fallo. Mireya defiende paradas y reservas aunque la diosa prometa vigilar. Un sistema sostenible debe responder también a una decisión divina de atender otro intercambio.

**Conversaciones personales:**

##### VID_piedra_mireya_1 · Antes del cambio

> **Mireya:** Esta máquina me devolvió una comida con mi padre. Quiero recordarlo sin usarlo para negar lo del agua.
> **Eloy:** Un trabajo puede cuidar de verdad y tener una parte que hizo daño.
> **Mireya:** Ojalá hubiera podido aceptar esa frase antes de culpar al operador.
> **Eloy:** Ahora la estamos aprendiendo desde dos puertas distintas.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_piedra_mireya_2 · Después del arco personal

> **Mireya:** Apagué el circuito para revisar. Nadie tuvo que perder agua para descubrir el botón.
> **Hugo:** ¿Y la advertencia se ve sin oír nada?
> **Mireya:** Sí. La probaron personas que no conocían mi panel.
> **Hugo:** Entonces podemos escuchar tu juguete absurdo un rato. Ese sí no necesita una justificación.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar entradas y salidas de una máquina real.

> **Mireya:** Si funciona solo mientras yo explico, no funciona solo.

**Acto 2:** Configurar reserva con consumo finito.

> **Mireya:** El panel estaba claro para mí. No para quien tuvo que decidir sin mi ayuda.

**Acto 3:** Probar falta de insumo y parada sin duplicar productos.

> **Mireya:** La reserva gana prioridad. La velocidad no será la respuesta a toda alarma.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Prioridad de cuidado o prioridad de retorno.

> **Mireya · respuesta 1:** Cuidado: Mantendrá raciones antes de fabricar.

> **Mireya · respuesta 2:** Retorno: Mantendrá combustible antes de enviar carga.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La máquina que sabe detenerse». Plantilla de prioridades de máquina con reservas y parada; solo configura recursos existentes. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Hugo · `piedra_hugo`

**Pasado:** Hugo, 40, arregló lámparas de mina y perdió audición parcial tras años de ruido. No es una maldición; ocultó la dificultad porque pensó que perdería empleo. Julián le pidió señales redundantes en el puerto.

**Presente y personalidad:** Es paciente, cocina muy picante y agradece que le hablen de frente. No quiere que cada conversación sea sobre su condición.

**Cambio:** Introduce alertas visuales y sonoras para todos, solicita ajustes sin abandonar su experiencia. No se simula una cura por misión.

**Vínculos:** Julián, Eloy, Boris. **Naturaleza:** persona_viva. **Hogar planificado:** `piedralumbre_vivienda_04`.

#### Una alarma de más de una forma · `V_piedra_hugo`

**Primeros años y lo que aprendió a querer:**

Hugo disfrutaba desmontar lámparas en vez de mirar solamente la luz final. Su primer empleo incluía ruido que nadie medía porque trabajar allí siempre había sonado así. Una tarde reparó un aviso y lo oyó mejor que toda la cuadrilla; aquel logro lo convirtió en la persona encargada de detectar cada falla. La exposición continuó mientras su oído ya no respondía del mismo modo.

**Aprendizaje, decisiones y vínculos:**

La pérdida auditiva parcial fue gradual y no una maldición ni resultado de un único descuido. Hugo aprendió a mirar labios y a predecir rutinas. Ocultó dificultad por miedo a perder empleo; a veces contestaba una pregunta distinta y culpaba cansancio. Le dolía más imaginar desconfianza en su experiencia que pedir repetir una frase.

**Lo que cambia y lo que todavía pesa:**

Julián solicitó señales redundantes para el puerto y Hugo encontró una tarea donde su ajuste servía a todos. La misión incorpora alertas visuales y sonoras, no una cura. Explicar lo que necesita puede despertar alivio y rabia por haber tenido que esconderlo. No se convierte en portavoz de toda discapacidad ni debe narrar intimidad para justificar una señal accesible.

**Cuando no ofrece una misión:**

Le gustan mecanismos con movimiento visible y bromas que el interlocutor repite sin hacer un espectáculo de ayuda. Tras el arco pide condiciones de comunicación sin retirarse del oficio. Puede pasar una tarde en silencio porque lo disfruta, no porque esté aislado.

**Ante Fuatia:**

Fuatia puede hablar mediante aire y Hugo le pedirá una aparición que no dependa solo de voz. La divinidad no ofrece restaurar su oído como premio. Él quiere participar en los acuerdos elementales y diseñar señales legibles para quien ve, oye o necesita ambas cosas.

**Conversaciones personales:**

##### VID_piedra_hugo_1 · Antes del cambio

> **Hugo:** Vi el movimiento del aviso antes de oírlo. Durante un tiempo pensé que debía fingir lo contrario.
> **Mireya:** ¿Quién necesitaba que fuera oído para ser un dato válido?
> **Hugo:** Yo temía que dejaran de preguntar lo que sabía de lámparas.
> **Mireya:** Seguiremos preguntándolo. También puedes pedir que te miremos al responder.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_piedra_hugo_2 · Después del arco personal

> **Hugo:** La señal nueva se entiende sin sonido. La antigua sigue para quien prefiera escucharla.
> **Julián:** Pensé que ibas a retirarla como recuerdo de algo mal hecho.
> **Hugo:** Funcionaba para algunos. El problema era creer que eso significaba todos.
> **Julián:** Hoy lo entendí sin tener que vigilar desde la escalera.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar tres balizas.

> **Hugo:** No necesito escuchar mejor para diseñar una señal mejor.

**Acto 2:** Instalar contraste y vibración propuesta con insumos normales.

> **Hugo:** Pensé que pedir otra alarma era admitir que no servía. Ahora veo a todos leerla antes.

**Acto 3:** Probar evacuación sin ambiente de combate.

> **Hugo:** Dejemos las dos. Si una falla, no tiene que fallar también el regreso.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Luz contrastada o pulso háptico.

> **Hugo · respuesta 1:** Luz: Añadiremos patrón, no solo color.

> **Hugo · respuesta 2:** Pulso: El aviso escrito seguirá disponible.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Una alarma de más de una forma». Plan de alertas redundantes de luz, texto y pulso; avisos de seguridad básicos no se cobran como recompensa. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Ciro · `piedra_ciro`

**Pasado:** Ciro, 46, cocinó para cuadrillas con raciones escasas y aprendió a ocultar hambre propia. Llegó a valorar una comida solo por su energía y perdió el placer que lo llevó al oficio.

**Presente y personalidad:** Es risueño, organiza especias alfabéticamente y recuerda cumpleaños. Quiere cuidar sin aceptar que alguien lo cuide.

**Cambio:** Hace menús equivalentes, reserva una porción para sí y enseña que un efecto de comida no se acumula sin límite.

**Vínculos:** Simón, Gonzalo, Alina. **Naturaleza:** persona_viva. **Hogar planificado:** `piedralumbre_vivienda_04`.

#### La porción del cocinero · `V_piedra_ciro`

**Primeros años y lo que aprendió a querer:**

Ciro empezó cocinando porque disfrutaba reunir personas que no hablaban mientras trabajaban. Cada plato necesitaba tiempo y alguien podía recordar su gusto, una autoría modesta que le alegraba. Las primeras raciones de cuadrilla eran escasas; aprendió a contar porciones sin probar bastante para sí. Recibía gratitud cuando alcanzaba y la transformó en razón para ocultar que él no comía igual.

**Aprendizaje, decisiones y vínculos:**

Una tabla de energía le facilitó pedidos y también desplazó placer. Preparaba lo eficiente, defendía cifras y se irritaba cuando alguien deseaba variar un sabor sin mayor rendimiento. La comida se volvió otra herramienta que debía justificar cada costo. Sus horas libres las pasaba buscando una combinación más económica y dejó de cocinar para alguien por curiosidad o cariño.

**Lo que cambia y lo que todavía pesa:**

Simón le propuso probar variantes de efecto equivalente y Ciro preguntó para qué tantas si una rendía bien. Al oírse recordó su mesa inicial. La misión conserva presupuesto de energía y limita acumulación de efectos; además reserva una porción propia. Puede reconocer necesidad real de alimentación sin convertirla en el único significado de sentarse juntos.

**Cuando no ofrece una misión:**

Tiene especias guardadas para una receta que no vende y después del arco la prueba en cantidad pequeña. Puede terminar de servir y sentarse, no esperar que todos se retiren para comer sobras. La cuadrilla aprende que agradecer también significa respetar su descanso.

**Ante Fuatia:**

Respeta el fuego de Fuatia por el calor que permite cocinar, pero no ofrece hambre propia como tributo. Pregunta cómo se sostendrán comidas de quienes reparan un daño cuando la diosa cierre un horno contaminante. Una sentencia necesita una mesa alternativa, no únicamente un objetivo correcto.

**Conversaciones personales:**

##### VID_piedra_ciro_1 · Antes del cambio

> **Ciro:** Esta receta tenía un olor distinto antes de que la describiera solo como cuarenta de energía.
> **Simón:** El número puede seguir en la ficha. No tiene que comerse también el nombre.
> **Ciro:** Pensé que querer variar era un capricho cuando algunos necesitaban cualquier comida.
> **Simón:** Comer suficiente y disfrutar no son turnos que debas repartir a personas distintas.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_piedra_ciro_2 · Después del arco personal

> **Ciro:** Guardé mi porción antes de terminar el servicio. Nadie se quedó sin comer.
> **Gonzalo:** Te esperamos para sentarnos. Si tardas más, hablaremos mientras sirves.
> **Ciro:** Hoy quiero probar esa especia que llevo dos meses defendiendo en el cajón.
> **Gonzalo:** Entonces tendremos tema de conversación que no empieza por la galería.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contar cupos y recursos.

> **Ciro:** Siempre calculé una persona menos. Era la manera de decir que yo no necesitaba comer.

**Acto 2:** Cocinar ración existente sin cambiar sus estadísticas.

> **Ciro:** Simón me dejó mi plato. No fue una recompensa. Era parte de la cuenta.

**Acto 3:** Repartir con reserva y anotar alergias ficticias sin datos reales.

> **Ciro:** La receta seguirá alimentando igual. Ahora también me incluye.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Sabor suave o especiado.

> **Ciro · respuesta 1:** Suave: No tendrá menor utilidad por ser sencillo.

> **Ciro · respuesta 2:** Especiado: La variante será gusto, no daño extra.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La porción del cocinero». Variante de sabor de ración existente con mismas porciones y efecto; incluye porción del cocinero en cupo. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## brasaviva

### Tarek · `brasa_tarek`

**Pasado:** Tarek, 36, heredó manejo de vacas volcánicas y usó una técnica de enfriamiento sin revisar agua disponible. Una temporada mostró que el bienestar animal exigía coordinación de toda la aldea, no orgullo ganadero.

**Presente y personalidad:** Es enérgico, inventa nombres de quesos y le cuesta pedir ayuda a Nadia. Valora animales como individuos pero presume cifras de producción.

**Cambio:** Registra temperatura y reserva, acepta descansos y no usa animales como máquinas térmicas. Cancela una entrega antes de exigirle otra tanda al establo. La decisión le cuesta prestigio comercial y le devuelve coherencia con su afecto.

**Vínculos:** Nadia, Mara, Rufina. **Naturaleza:** persona_viva. **Hogar planificado:** `brasaviva_vivienda_01`.

#### Un refugio antes del producto · `V_brasa_tarek`

**Primeros años y lo que aprendió a querer:**

Tarek heredó ganado y sabía reconocer preferencias antes de poder llevar un registro completo. Su familia se enorgullecía de no necesitar ayuda externa. Cuando ofreció una mejora, quiso demostrar que conservar tradición no era repetir sin pensar. Una cría se acercaba a una sombra que él había preparado y ese pequeño resultado le dio más alegría que cualquier contrato grande.

**Aprendizaje, decisiones y vínculos:**

La técnica de enfriamiento funcionó en el establo y consumió agua prevista para otros usos. Tarek había calculado bienestar animal sin preguntar quién sostenía la reserva. Cuando Nadia mostró costo, él habló de cariño para no discutir cantidad. Esa defensa hacía parecer que limitar producción era querer menos a sus animales. Mara le ayudó a separar afecto de una promesa comercial excesiva.

**Lo que cambia y lo que todavía pesa:**

Cancelar una entrega costó prestigio y dinero. La misión registra temperatura, suministro y descanso sin usar vacas como máquinas térmicas. Tarek conserva autoridad ganadera, pero acepta relevo y consumo acordado. La protección de Fuatia no convertirá un animal volcánico en combustible ni permitirá que una bendición reemplace alimentación y espacio.

**Cuando no ofrece una misión:**

Le gustan los baños cuando ya no tiene una labor pendiente que aparenta urgencia. Tras el arco visita a Rufina sin discutir primero la reserva. Sigue hablando con orgullo del rebaño y puede explicar qué parte no está disponible para un pedido.

**Ante Fuatia:**

Fuatia ama a los animales y Tarek espera entenderse con ella; por eso le cuesta más cuando lo critica. No puede usar su afecto como permiso para exigir recursos ajenos. Quiere acuerdos donde el agua de un establo y el descanso de personas no tengan que convertirse en enemigos.

**Conversaciones personales:**

##### VID_brasa_tarek_1 · Antes del cambio

> **Tarek:** La cría estaba bien. Yo repetía esa frase para no hablar del agua de los baños.
> **Rufina:** Me alegra que esté bien. La frase no llena mi depósito.
> **Tarek:** No quiero que parezca que cuidarla fue una excusa.
> **Rufina:** No lo fue. Fue un cuidado cuyo costo teníamos que acordar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_brasa_tarek_2 · Después del arco personal

> **Tarek:** Cancelé el pedido. El comprador llamó falta de ambición a dejar descansar al rebaño.
> **Mara:** ¿Y tú qué pensaste?
> **Tarek:** Que yo mismo habría usado esa frase hace una estación. Hoy la entrega puede esperar.
> **Mara:** Entonces vamos a comer sin convertir la espera en una tragedia.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar bienestar sin recoger producto.

> **Tarek:** La vaca no sabe que yo prometí una entrega. Su calor no espera a mi contrato.

**Acto 2:** Medir sombra y agua disponibles.

> **Tarek:** Nadia no me quitó producción. Me mostró cuánto estaba cobrando el refugio a la acequia.

**Acto 3:** Adaptar refugio y verificar cuidado real sin acelerar reloj.

> **Tarek:** Primero quedará el agua de cuidado. Lo que sobre decidirá el lote.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Sombra pasiva o intercambio térmico.

> **Tarek · respuesta 1:** Pasiva: Exige espacio, no combustible.

> **Tarek · respuesta 2:** Intercambio: Tendrá entrada finita y parada visible.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «Un refugio antes del producto». Plano de refugio sombreado o intercambio térmico con consumo visible, sin producción animal adicional. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Sol · `brasa_sol`

**Pasado:** Sol, 28, rompió una pieza ceremonial y la reparó con una junta visible. Un cliente rechazó la marca; comenzó a fabricar copias perfectas hasta no disfrutar ninguna. Encontró un fragmento de geometría de Vael y admiró su acabado antes de conocer su función.

**Presente y personalidad:** Es curiosa, habla con objetos mientras trabaja y guarda el primer cuenco torcido. Le cuesta creer que lo humilde pueda discutir con lo cósmico.

**Cambio:** Distingue forma y finalidad. Su vasija abierta inspira desmontar prisiones, pero ella no fabrica magia infinita ni tiene sangre secreta de Vael.

**Vínculos:** Petra, Yago, Tecla. **Naturaleza:** persona_viva. **Hogar planificado:** `brasaviva_vivienda_01`.

#### La vasija que admite salir · `V_brasa_sol`

**Primeros años y lo que aprendió a querer:**

Sol modelaba barro porque no necesitaba defender el resultado al comenzar. Una taza podía volverse animal y un cuenco, casa diminuta. Aprender horno le dio una emoción distinta: una transformación que no podía deshacer a voluntad. Su primera pieza útil quedó algo torcida y la familia la usó igual. Antes de buscar perfección tuvo una experiencia de belleza que servía sin pedir disculpas por cada marca.

**Aprendizaje, decisiones y vínculos:**

La pieza ceremonial se rompió y Sol reparó con junta visible. El cliente dijo que quería olvidar el accidente, no recordarlo cada vez. Ella comprendió ese deseo, pero lo convirtió en una regla para todo trabajo futuro. Fabricó copias tan iguales que sabía distinguirlas solo por fecha. Recibía más elogios y disfrutaba menos. Empezó a llamar profesionalismo a no sentir interés mientras trabajaba.

**Lo que cambia y lo que todavía pesa:**

El fragmento de Vael mostró un acabado imposible y Sol lo admiró. La culpa posterior intenta hacerla afirmar que nunca habría querido su método, pero no es verdad: le sedujo la promesa de no fallar. Al descubrir esencias encerradas puede separar belleza y finalidad sin fingir que una marca visible vuelve moral cualquier objeto. Su vasija abierta ofrece un contraejemplo práctico; no hereda sangre divina, no fabrica magia ilimitada y no necesita dominar toda geometría para cuestionar la finalidad que vio.

**Cuando no ofrece una misión:**

Yago dibuja junto al taller lejos de hornos y herramientas calientes. Sol valora su juego y le permite no elegir todavía un oficio. Después del arco conserva alguna pieza perfectamente simétrica porque le gusta, además de reparaciones visibles. La imperfección deja de ser vergüenza sin convertirse en nueva obligación estética. Puede encargar a otro un cuenco y descansar sin modelar su propia lección.

**Ante Fuatia:**

Fuatia reúne fuego y tierra del proceso que Sol conoce. Le preocupa que la diosa llame equilibrio a una forma cerrada que nunca deba revisarse. Defenderá que una sentencia tenga apertura aun cuando el daño original esté comprobado. Puede escuchar ira real y oponerse al sufrimiento prolongado, sin dar a Vael la razón sobre su orden perfecto.

**Conversaciones personales:**

##### VID_brasa_sol_1 · Antes del cambio

> **Sol:** Me gustó el fragmento. Lo digo porque contar que supe enseguida lo malo que era me haría parecer mejor.
> **Ramiro:** Yo también me tranquilizaba con una pieza bonita. Luego podía evitar preguntar para qué la compraban.
> **Sol:** No quiero dejar de admirar una forma. Quiero acordarme de mirar si alguien puede salir de ella.
> **Ramiro:** Esa pregunta habría cabido en mis facturas antes de que sirvieran para una prisión.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_brasa_sol_2 · Después del arco personal

> **Sol:** Hice una taza simétrica porque hoy me apetecía. No demuestra que volví a obedecer a Vael.
> **Yago:** ¿Y si a mí me salen las dos asas distintas?
> **Sol:** Miramos si pueden usarse y si te gustan. No necesitamos convertir cada cuenco en un juicio.
> **Yago:** Entonces después quiero dibujar una taza que corre. Esa no vamos a meterla al horno.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Examinar fragmento sin activar poder.

> **Sol:** Es perfecto. Esa frase no me dice para qué sirve.

**Acto 2:** Fabricar cuenco reparable con receta normal.

> **Sol:** Una prisión también puede estar bien hecha. Ese no es el elogio que quiero para mi trabajo.

**Acto 3:** Comparar abertura y unión con Tecla.

> **Sol:** Yago, deja la marca. Quiero recordar por dónde se reparó.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Junta visible o piezas desmontables.

> **Sol · respuesta 1:** Visible: La marca no fingirá una grieta nueva.

> **Sol · respuesta 2:** Desmontables: Cada parte podrá cambiar sin destruir el conjunto.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La vasija que admite salir». Cuenco reparable o desmontable con idéntico costo material y capacidad, sin esencia divina dentro. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Nadia · `brasa_nadia`

**Pasado:** Nadia, 34, instaló riego térmico prometiendo dos cosechas más. Funcionó en prueba y consumió agua que Rufina necesitaba en baños de descanso. Desde entonces evita innovar delante de vecinos.

**Presente y personalidad:** Es serena en público, impaciente sola y se ríe de nombres científicos largos. Quiere ayudar sin volver a vender un rendimiento aislado.

**Cambio:** Evalúa costo comunitario y abre ensayos reversibles. Su técnica conserva calendario y requisitos de cultivo.

**Vínculos:** Tarek, Rufina, Flora. **Naturaleza:** persona_viva. **Hogar planificado:** `brasaviva_vivienda_02`.

#### El calor que también cuesta agua · `V_brasa_nadia`

**Primeros años y lo que aprendió a querer:**

Nadia empezó a reparar riego porque le gustaba una solución que otras personas podían ver al instante. El primer canal restituido alimentó cultivos que no eran suyos y el agradecimiento le dio deseo de intervenir en más cosas. Estudiaba con impaciencia por llegar a la aplicación. Una prueba positiva podía parecerle permiso suficiente para saltar preguntas de vecinos que no dominaban su vocabulario.

**Aprendizaje, decisiones y vínculos:**

Prometió dos cosechas más y el sistema térmico funcionó en una muestra. Había calculado consumo del cultivo sin sumar usos de baños y viviendas. Rufina llegó con cifras de descanso y Nadia respondió con productividad, como si las columnas hablaran de beneficios intercambiables. La innovación no falló técnicamente del mismo modo que falló el acuerdo social que debía sostenerla.

**Lo que cambia y lo que todavía pesa:**

Después evitó proponer cualquier cambio frente al pueblo. Creía que así impediría repetir daño, pero también dejaba infraestructura envejeciendo sin la revisión que podía ofrecer. La misión introduce ensayo reversible y presupuesto comunitario. No concede cosechas extra que ignoren calendario ni autoriza una prueba solo porque puede apagarse: debe incluir qué devuelve y quién soporta una parada.

**Cuando no ofrece una misión:**

Disfruta arreglar juguetes de movimiento y observar un canal sin dirigirlo. Tras el arco vuelve a proponer una mejora con preguntas abiertas, tolerando que el pueblo la rechace. Puede entusiasmarse con lo pequeño sin presentarlo como solución total a otra estación.

**Ante Fuatia:**

Quiere trabajar con Fuatia para entender intercambios y teme la tentación de llamar divina a su propia promesa. Una bendición no arregla un presupuesto incompleto. Defiende que hogares y ganado tengan voz junto al cultivo más rentable, aunque la diosa prefiera la recuperación del agua sobre todos ellos.

**Conversaciones personales:**

##### VID_brasa_nadia_1 · Antes del cambio

> **Nadia:** En la prueba no faltó nada. Faltaba sumar a quienes no estaban dentro de la prueba.
> **Rufina:** Yo también puedo hablar solo de mis baños. Eso no volvería completo el pueblo.
> **Nadia:** Dejé de proponer por vergüenza. Ahora las piezas que puedo revisar siguen gastándose.
> **Rufina:** Trae el plan. Podemos discutirlo sin prometer que esta vez diremos sí.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_brasa_nadia_2 · Después del arco personal

> **Nadia:** El ensayo quedó más pequeño. No tendrá dos cosechas extra ni el nombre que había inventado.
> **Tarek:** ¿Te sigue haciendo ilusión?
> **Nadia:** Sí. Me alivia no tener que convencer a todos de una maravilla antes de abrir un canal.
> **Tarek:** Ese alivio también merece una tarde en los baños.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Medir consumo de dos usos.

> **Nadia:** El cultivo creció. La comunidad quedó con menos agua. Mi informe solo celebró lo primero.

**Acto 2:** Ensayar riego en parcela autorizada.

> **Nadia:** Rufina no estaba contra el futuro. Necesitaba un baño que funcionara esta noche.

**Acto 3:** Ajustar reserva y publicar costo por lote.

> **Nadia:** El plano empieza por cuánto podemos gastar, no por cuánto quiero demostrar.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Recircular o reducir parcela.

> **Nadia · respuesta 1:** Recircular: Registraremos pérdidas, no agua perfecta.

> **Nadia · respuesta 2:** Reducir: El área menor conserva los mismos tiempos de crecimiento.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El calor que también cuesta agua». Comparador de calor y gasto de agua por parcela; el riego sigue consumiendo recursos y jornadas normales. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Ramiro · `brasa_ramiro`

**Pasado:** Ramiro, 49, vendió recipientes térmicos a una organización que decía ofrecer refugio. Descubrió contratos de obediencia y calló por miedo a quebrar su taller. Sus piezas fueron utilizadas por la Custodia, no son corruptas por ser vidrio.

**Presente y personalidad:** Es afable, colecciona canicas y cambia de tema al ver sellos comerciales. Quiere indemnizar sin perder a trabajadores.

**Cambio:** Entrega facturas, ofrece retirada segura y participa en restitución. No obtiene absolución por fabricar una pieza bonita.

**Vínculos:** Íñigo, Sol, Baltasar. **Naturaleza:** persona_viva. **Hogar planificado:** `brasaviva_vivienda_02`.

#### El cliente que debía rechazar · `V_brasa_ramiro`

**Primeros años y lo que aprendió a querer:**

Ramiro aprendió vidrio con una familia que podía vivir bien una temporada y temer la siguiente. Un recipiente perfecto condensaba días de práctica en algo fácil de vender. Le gustaba que su taller diera trabajo, comida y conversación. Cuando una organización pidió muchas piezas térmicas, vio estabilidad para gente que conocía antes de pensar en la imagen de un comprador generoso.

**Aprendizaje, decisiones y vínculos:**

La Custodia se presentaba como refugio. Los primeros recibos eran correctos; después apareció una cláusula de obediencia y alguien pidió recipientes sin identificación de origen. Ramiro supo que había razones para detenerse. Continuó entregando porque temía que el taller no sobreviviera al retiro del contrato. No conocía cada prisión, pero hizo de esa falta de detalle una excusa para no investigar lo que sí había visto.

**Lo que cambia y lo que todavía pesa:**

Entregar facturas en su misión arriesga al negocio y a la confianza de trabajadores. No puede resarcirlo fabricando una pieza bella ni exigir absolución por confesar. Participa en retirada segura, documenta compradores y propone contratos diferentes. El vidrio no es corrupto por naturaleza; el uso y el encubrimiento requieren respuesta. Sol le recuerda que ambos admiran cosas útiles sin deberles fidelidad a quienes las compran.

**Cuando no ofrece una misión:**

Guarda una pieza fea del primer horno porque un aprendiz, se ríe cada vez que la ve. Tras el arco deja precios y destino visibles en pedidos grandes. Puede alegrarse de una venta sin intentar demostrar que toda la temporada quedó purificada.

**Ante Fuatia:**

Fuatia tendría motivos para castigarlo y él preferiría negociar una reparación con fin verificable. Su miedo a la ruina no lo vuelve inocente, pero también teme una sentencia que arrastre trabajadores. Defender a esas personas no debe convertirse en otro argumento para conservar el mismo contrato abusivo.

**Conversaciones personales:**

##### VID_brasa_ramiro_1 · Antes del cambio

> **Ramiro:** Esta cláusula llegó cuando todavía podía decir que no. Dejé la factura debajo de las anteriores.
> **Íñigo:** Yo entregaba cartas y decía que no sabía qué pasaba dentro. Las rutas sí las conocía.
> **Ramiro:** Quisiera una confesión que no costara el trabajo de nadie.
> **Íñigo:** Primero retiremos el uso dañino. Después discutimos quién sostiene esa transición.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_brasa_ramiro_2 · Después del arco personal

> **Ramiro:** Vendí un lote menor. El taller no está seguro para siempre, pero el destino quedó registrado.
> **Sol:** ¿Puedes disfrutar que salió bien sin volverlo prueba de inocencia?
> **Ramiro:** Voy a intentarlo. Hoy solo quiero que veas el borde que logré mejorar.
> **Sol:** Lo miro. Luego comeremos algo que no venga servido en una sentencia.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar contratos y lotes.

> **Ramiro:** Cuando entendí para qué los querían, ya no era ignorancia. Era mi decisión de no mirar.

**Acto 2:** Retirar recipientes inactivos con personal autorizado.

> **Ramiro:** No son todos culpables por haber dormido en un refugio. Mis facturas tienen que distinguir quién contrató qué.

**Acto 3:** Crear política de venta y fondo de restitución.

> **Ramiro:** El taller seguirá. Ese cliente no. La reparación no saldrá del salario de mi cuadrilla.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Retirada supervisada o sellado temporal.

> **Ramiro · respuesta 1:** Retirada: Mirta registrará custodia de cada pieza.

> **Ramiro · respuesta 2:** Sellado: No quedarán accesibles mientras preparamos transporte.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «El cliente que debía rechazar». Plano de recipiente inspectable y ficha de retirada de lote; no concede uso energético de reliquias. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Idalia · `brasa_idalia`

**Pasado:** Idalia, 45, estudió dragones con una comunidad que confundía valentía con acercarse sin permiso. Sobrevivió a una erupción gracias a una reserva de calor que un dragón no gastó defendiendo su nido.

**Presente y personalidad:** Es firme, narra escenas con detalle y cocina lentamente. Quiere que respeten su oficio; rechaza toda demostración aunque a veces una enseñanza sería segura.

**Cambio:** Enseña distancia, reserva y lectura del manuscrito. Ofrece alternativa de archivo para que la campaña no exija crianza rara.

**Vínculos:** Dante, Mara, Azucena. **Naturaleza:** persona_viva. **Hogar planificado:** `brasaviva_vivienda_03`.

#### El fuego que no se gastó · `V_brasa_idalia`

**Primeros años y lo que aprendió a querer:**

Idalia estudió dragones cuando otros trataban el oficio como prueba de coraje. Le fascinaba aprender una conducta que no respondía a órdenes humanas. Una primera visita desde lejos le permitió ver cuidado entre criaturas que los relatos llamaban únicamente feroces. Esa paciencia le gustó, pero quería también el reconocimiento que recibían quienes regresaban con marcas de haberse acercado demasiado.

**Aprendizaje, decisiones y vínculos:**

Durante una erupción un dragón conservó calor en vez de gastarlo todo defendiendo un nido. La reserva permitió una salida y ella sobrevivió. Personas cercanas lo narraron como que la criatura la había elegido por valor. Idalia pudo disfrutar la leyenda, aunque sabía que se había expuesto más de lo necesario. Le tomó tiempo explicar el riesgo sin reducir la gratitud que sentía.

**Lo que cambia y lo que todavía pesa:**

El manuscrito de reserva se convirtió en pieza que visitantes querían ver a cualquier costo. Idalia organizó copias y recorridos con distancia, perdiendo atractivo para quienes esperaban un encuentro espectacular. Su misión conserva una alternativa de archivo para la campaña. No exige criar un dragón ni demostrar valentía ante fuego real. Puede defender a la criatura sin declarar inútil la curiosidad humana que la llevó hasta ella.

**Cuando no ofrece una misión:**

Le gusta sentir calor suave y le molesta que cada broma sobre su oficio trate de quemarse. Tras el arco ofrece una visita ordinaria con orgullo. Tiene relaciones de trabajo donde puede aceptar ayuda sin describir otra hazaña y descansar durante una conversación.

**Ante Fuatia:**

Fuatia es fuego y también lo que lo equilibra; Idalia respeta que escuche al dragón. No le pide consumir la reserva del animal para derrotar una amenaza más vistosa. En campaña relaciona ese cuidado con el límite de la diosa: el poder disponible no convierte todo gasto en necesario.

**Conversaciones personales:**

##### VID_brasa_idalia_1 · Antes del cambio

> **Idalia:** Dicen que el dragón me eligió. La historia suena mejor que admitir que yo estaba demasiado cerca.
> **Mara:** ¿Puedes agradecer el rescate y corregir el recorrido?
> **Idalia:** Sí. Lo difícil es perder una fama que me gustaba mientras digo que nunca la quise.
> **Mara:** Entonces no digas eso. Conserva la verdad y cambia lo que viene después.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_brasa_idalia_2 · Después del arco personal

> **Idalia:** Hoy vieron el manuscrito en copia. Nadie tuvo que mirar un nido para sentir que la visita contaba.
> **Dante:** ¿Y hubo quien pidió algo más peligroso?
> **Idalia:** Sí. Le expliqué la alternativa y no inventé un permiso porque pagara más.
> **Dante:** Estoy practicando exactamente esa devolución.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar nido desde zona autorizada.

> **Idalia:** El dragón no ganó porque ardiera más. Sobrevivió porque no gastó todo.

**Acto 2:** Preparar reserva de refugio con recursos normales.

> **Idalia:** Yo contaba aquella noche como una batalla. Era una decisión de cuidado.

**Acto 3:** Leer testimonio y explicar retirada.

> **Idalia:** Pueden llevar una copia. El nido y su dueño se quedan aquí.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Observación o archivo acompañado.

> **Idalia · respuesta 1:** Observación: Nadie cruzará el límite por una imagen.

> **Idalia · respuesta 2:** Archivo: La copia basta para la prueba principal.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El fuego que no se gastó». Copia de estudio del manuscrito del dragón con guía de reserva, sin añadir criatura al inventario. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Dante · `brasa_dante`

**Pasado:** Dante, 31, guiaba calderas para visitantes y aceptó un viaje con mala visibilidad por no devolver el pago. Rufina tuvo que alojar al grupo cuando regresó; el riesgo lo pagaron otros.

**Presente y personalidad:** Es carismático, disfruta cantar caminando y odia dar malas noticias. Quiere que la gente vuelva a contratarlo.

**Cambio:** Cobra preparación transparente y devuelve cuando cancela. Publica ruta alternativa sin llamarla premio de consolación.

**Vínculos:** Rufina, Idalia, Vera. **Naturaleza:** persona_viva. **Hogar planificado:** `brasaviva_vivienda_03`.

#### La excursión que no sale · `V_brasa_dante`

**Primeros años y lo que aprendió a querer:**

Dante entró a guiar visitantes porque disfrutaba volver interesante un lugar que conocía desde niño. Le gustaba que una calle habitual pudiera asombrar a alguien nuevo. Ahorraba para mejorar equipo y cada cancelación parecía retrasar una vida propia fuera de turnos. Esa presión no explicaba todo: también disfrutaba ser el guía que conseguía lo que otros consideraban imposible.

**Aprendizaje, decisiones y vínculos:**

Aceptó un recorrido con mala visibilidad por no devolver el pago. Dijo que conocer terreno compensaría condiciones y el grupo regresó tarde. Rufina alojó visitantes y otros dejaron turnos para ayudar. Nadie murió, pero el riesgo y el costo se trasladaron a personas que no habían contratado la aventura. Dante quiso agradecer antes de hablar de restitución.

**Lo que cambia y lo que todavía pesa:**

Las quejas le hicieron prometer nunca cancelar de nuevo, como si un servicio más heroico reparara el problema. La misión cambia cobro, preparación y devolución, además de una ruta alternativa con valor propio. Un visitante puede escoger no salir y recibir lo correspondiente. Dante conserva deseo de guiar, pero deja de medir talento por la capacidad de negar un límite.

**Cuando no ofrece una misión:**

Le gusta merendar en miradores accesibles y escuchar qué vio un visitante en un paseo corto. Tras el arco puede tener un día de ingreso menor sin convertirlo en humillación profesional. Rufina no queda como alojamiento gratuito por si su plan se vuelve a desordenar.

**Ante Fuatia:**

Pediría a Fuatia un viento favorable y no usará esa petición como garantía comercial. Si la diosa no interviene, el contrato sigue necesitando devolución. Si interviene, el grupo conserva derecho a retirarse; una aparición divina no vuelve obligatoria una excursión.

**Conversaciones personales:**

##### VID_brasa_dante_1 · Antes del cambio

> **Dante:** Tuve el dinero para devolverlo en la mano. Lo volví a guardar y dije que conocía el camino.
> **Rufina:** Después el precio lo pagaron también quienes abrieron los baños fuera de turno.
> **Dante:** Estoy preparando el reintegro de esas horas, no otra visita de agradecimiento.
> **Rufina:** Gracias. La conversación será más fácil cuando no tenga que transformarse en otro servicio.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_brasa_dante_2 · Después del arco personal

> **Dante:** Cancelé y devolví. La persona escogió paseo corto sin que yo lo llamara consuelo.
> **Idalia:** ¿Te pareció bastante aventura?
> **Dante:** A ella sí. Yo tuve que dejar de evaluar su tarde por la distancia que había logrado guiarla.
> **Idalia:** Hoy cenaremos en un lugar donde ninguno tenga que demostrar nada.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar datos de caldera.

> **Dante:** Puedo devolver una entrada. No puedo devolverles una decisión tomada con datos que escondí.

**Acto 2:** Probar retorno en ruta fría.

> **Dante:** Cuando dije casi seguro, quería decir necesito este trabajo.

**Acto 3:** Preparar cancelación y paseo alternativo con presupuesto.

> **Dante:** Hoy no salimos a la caldera. El paseo corto sigue siendo un paseo, no un fracaso.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Paseo protegido o devolución completa.

> **Dante · respuesta 1:** Paseo: Cada visitante podrá rechazarlo.

> **Dante · respuesta 2:** Devolución: Nadie perderá su lugar en próximas reservas.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La excursión que no sale». Agenda de capacidad, cancelación y ruta alternativa, con costo y permiso explícitos. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Rufina · `brasa_rufina`

**Pasado:** Rufina, 67, abrió baños comunales después de dejar una fábrica agotadora. Se volvió indispensable y empezó a decidir horarios para toda la aldea. Defendía descanso ajeno sin tomarse el propio.

**Presente y personalidad:** Es divertida, sabe escuchar y guarda recetas de jabón absurdamente perfumado. Tiene paciencia hasta que alguien intenta pagar un favor con elogios. Es abuela y cuidadora cotidiana de Yago; su relevo deja también tiempo para conversar con él.

**Cambio:** Organiza turnos y admite nuevos usos del calor con límites. Su relevo conserva autonomía, no una lista eterna de instrucciones.

**Vínculos:** Nadia, Dante, Anselmo. **Naturaleza:** persona_viva. **Hogar planificado:** `brasaviva_vivienda_04`.

#### El turno de quien abre · `V_brasa_rufina`

**Primeros años y lo que aprendió a querer:**

Rufina trabajó en una fábrica donde pedir descanso convertía una necesidad en discusión sobre carácter. Ahorró para unos baños que no midieran a cada visitante por lo que produciría después. Le gustaban conversaciones lentas y gente que podía irse sin explicar por qué estaba cansada. La primera jornada cerró temprano porque nadie tenía energía para limpiar más. Recordar aquel acuerdo le duele cuando nota cuánto le cuesta permitirlo hoy.

**Aprendizaje, decisiones y vínculos:**

Los baños se hicieron indispensables y Rufina empezó a decidir horarios ajenos desde su experiencia. Una propuesta nueva podía parecer ataque a un cuidado que ella había sostenido con mucho esfuerzo. Defendía descanso de visitantes, pero completaba turnos porque creía que nadie conocería cada detalle. La autoridad adquirió la misma exigencia de presencia que había rechazado en la fábrica.

**Lo que cambia y lo que todavía pesa:**

Cuidar de Yago durante viajes estacionales de sus padres requiere acuerdos, cartas y visitas. Rufina quiere que tenga juego y supervisión; a veces aplica al niño un horario tan rígido como al baño. Su misión forma relevo real y permite otros usos de calor con reserva. La abuela no tiene que volverse una figura sin necesidades para ser querida, ni el aprendiz compensar con trabajo que ella esté cansada.

**Cuando no ofrece una misión:**

Le gusta remojar los pies después del cierre y contar historias donde ella no resolvió la situación. Tras el arco puede usar los baños como visitante mientras otra persona conduce el turno. Conserva criterio y protesta cuando un relevo falla sin concluir que solo ella puede hacerlo.

**Ante Fuatia:**

Ve en Fuatia el calor compartido y una tentación de castigar para enseñar. Rufina reconoce haber organizado descanso ajeno sin preguntar qué necesitaba cada persona. Puede discutir con la diosa una sentencia prolongada, no porque todo abuso merezca olvido, sino porque controlar cada jornada también puede convertirse en explotación.

**Conversaciones personales:**

##### VID_brasa_rufina_1 · Antes del cambio

> **Rufina:** Abrí esto para que nadie tuviera que probar que merecía descansar. Luego inventé horarios para todos.
> **Nadia:** ¿También para ti?
> **Rufina:** Para mí siempre quedaba después. El después era bastante obediente: nunca llegaba.
> **Nadia:** Puedo tomar un turno, si no necesitas decidir también cómo usaré cada minuto.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_brasa_rufina_2 · Después del arco personal

> **Rufina:** Hoy entré como visitante. Casi expliqué dónde estaba cada paño y conseguí callarme a tiempo.
> **Yago:** ¿Entonces hiciste una cosa que yo también puedo aprender? Esperar sin tocar todo.
> **Rufina:** Sí. Y después jugué una partida bastante mala.
> **Yago:** Me gusta esa parte. No vamos a trabajar siempre para celebrar descanso.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Inventariar agua y horarios.

> **Rufina:** La puerta ha tenido llave de repuesto treinta años. Yo era la que nunca dejaba usarla.

**Acto 2:** Formar relevo adulto sin consumir jornada real de cuidado.

> **Rufina:** Descansar no vuelve menos mío este lugar. Tal vez lo vuelve más de todos.

**Acto 3:** Revisar capacidad y tomar descanso.

> **Rufina:** Esta tarde me siento al otro lado del mostrador. Si falta algo, pueden decidir.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Turno fijo o calendario cooperativo.

> **Rufina · respuesta 1:** Fijo: El suplente tendrá autoridad real.

> **Rufina · respuesta 2:** Cooperativo: Reservaremos días sin aperturas obligatorias.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «El turno de quien abre». Calendario cooperativo de baños con cupos de agua y relevo, sin exigir servicio cada jornada. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Yago · `brasa_yago`

**Pasado:** Yago tiene once años y es aprendiz de dibujo de Sol. Rompió un cuenco frío y mintió para no perder permiso de estar en el taller. Los hornos y herramientas calientes siempre los operan adultos. Vive con su abuela Rufina mientras sus padres viajan por temporadas con una caravana de cerámica; hay cartas y visitas regulares, no abandono.

**Presente y personalidad:** Es impulsivo, hace figuras desproporcionadas y quiere reconocimiento sin practicar lo aburrido. Le encanta limpiar arcilla porque puede conversar.

**Cambio:** Admite error y aprende reparación segura; no trabaja para pagar una deuda ni obtiene un oficio adulto por misión.

**Vínculos:** Sol, Alma, Rufina. **Naturaleza:** persona_viva. **Hogar planificado:** `brasaviva_vivienda_04`.

#### La grieta de arcilla fría · `V_brasa_yago`

**Primeros años y lo que aprendió a querer:**

Yago mira la caravana de cerámica de sus padres como algo emocionante y también como días en que los extraña. Vive con Rufina durante temporadas acordadas, recibe cartas y visitas y no necesita buscar un misterio de abandono. Le gusta enseñar un dibujo nuevo al regreso y contar las cosas aburridas también. Sol le dio un lugar para dibujar lejos de herramientas calientes; entrar al taller no lo convirtió en trabajador.

**Aprendizaje, decisiones y vínculos:**

Rompió un cuenco frío al moverlo y escondió la pieza. Había recibido permiso de estar allí y temía que un error cancelara todas las tardes siguientes. Inventó que ya estaba roto. La mentira era pequeña, pero lo obligó a recordar otra historia cada vez que alguien mencionaba el cuenco. No hizo daño a un animal ni provocó un accidente de horno: se trataba de aprender a decir qué había pasado.

**Lo que cambia y lo que todavía pesa:**

Sol explicó una reparación segura que adultos ejecutarían donde correspondiera. Yago podía dibujar, observar y admitir sin pagar una deuda con trabajo. Rufina escuchó su miedo sin presentar castigo elemental. La misión conserva permiso con nuevas instrucciones; aprender no vuelve al niño responsable del taller. Todavía puede querer un oficio distinto cuando crezca.

**Cuando no ofrece una misión:**

Dibuja tazas con patas, espera merienda y busca juegos con Nina y Leo cuando las visitas están programadas. Tras el arco pregunta antes de mover objetos y algún día vuelve a olvidar. Los adultos supervisan calor y maquinaria aunque el niño haya completado una misión.

**Ante Fuatia:**

Fuatia le parece hermosa y un poco inquietante cuando otros hablan de castigos. Sol aclara que romper barro por torpeza no equivale a destruir naturaleza por provecho. Puede imaginar animales de cuatro colores sin convertirse en invocador real ni recibir permiso de combatir.

**Conversaciones personales:**

##### VID_brasa_yago_1 · Antes del cambio

> **Yago:** Si digo que rompí el cuenco, ¿voy a dejar de venir?
> **Sol:** Vamos a revisar dónde pones las manos. No voy a cambiar tu tarde por una deuda de taller.
> **Yago:** Pensé que necesitaba arreglarlo solo para que pareciera que nunca pasó.
> **Sol:** Yo pensé algo muy parecido de grande. Podemos dejar de esconderlo los dos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_brasa_yago_2 · Después del arco personal

> **Yago:** Hoy pregunté antes de tocar. Después dibujé una taza que corre y se escapa de todos los permisos.
> **Rufina:** ¿Y tuviste que repararla antes de merendar?
> **Yago:** No. Era un dibujo. Las tazas reales se quedan donde Sol pueda revisarlas.
> **Rufina:** Entonces vamos a comer. Tus padres también querrán conocer esa taza imposible.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Con Sol, reunir piezas frías.

> **Yago:** Dije que se cayó sola. Pero fui yo el que movió la tabla.

**Acto 2:** Dibujar arreglo sin herramientas peligrosas.

> **Yago:** ¿Puedo ayudar a arreglarla sin fingir que no se rompió?

**Acto 3:** Modelar nueva pieza y etiquetar lo imaginado.

> **Yago:** Le puse la línea. Ahora se ve dónde aprendí.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Dibujar cuenco o modelar figura fría.

> **Yago · respuesta 1:** Cuenco: Sol hará cualquier unión que exija herramientas.

> **Yago · respuesta 2:** Figura: Se secará fuera del horno hasta que una adulta la revise.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «La grieta de arcilla fría». Dibujo o figura fría en álbum de hitos; no se vende ni emplea como herramienta de adulto. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## nieveclara

### Eira · `nieve_eira`

**Pasado:** Eira, 36, crió ovejas cristalinas y vendió lana por encima de su capacidad para financiar un refugio. El proyecto bueno no evitó estrés animal. Anselmo rechazó un lote y ella lo tomó como traición.

**Presente y personalidad:** Es animada, hace bufandas largas y abraza con permiso. Quiere demostrar que un pueblo frío puede producir abundancia.

**Cambio:** Acuerda cupos por bienestar, acepta pedidos pequeños y separa cuidado de rendimiento. Elige una tarde de tejido sin encargo y descubre cuánto había dejado de disfrutar al convertir cada hilo en deuda.

**Vínculos:** Anselmo, Mara, Celeste. **Naturaleza:** persona_viva. **Hogar planificado:** `nieveclara_vivienda_01`.

#### La manta antes del pedido · `V_nieve_eira`

**Primeros años y lo que aprendió a querer:**

Eira empezó cuidando ovejas para una familia que sabía volver hermoso un invierno austero. Le enseñaron a guardar lana y también a dejar que una jornada no produjera nada. Al recibir su rebaño quiso devolver ese cuidado construyendo un refugio para visitantes. Le ilusionaba imaginar una mesa encendida detrás de la puerta y personas que no tuvieran que explicar por qué necesitaban calor.

**Aprendizaje, decisiones y vínculos:**

Los contratos exigían más lana de la que podía obtener respetando capacidad y descanso. Eira aceptó primero uno, después otro que permitiría completar el techo. La buena finalidad aparecía al comienzo de cada defensa. Anselmo rechazó un lote y ella lo acusó de sabotear a quienes seguían sin refugio. Desplazó el costo del proyecto a animales que nunca lo habían elegido.

**Lo que cambia y lo que todavía pesa:**

Al revisar reservas descubrió que había presupuestado trabajo propio también como ilimitado. La misión reduce entregas, registra bienestar y construye por etapas con insumos reales. Anselmo puede confiar otra vez sin recibir una disculpa grandiosa. El refugio tarda más y sigue siendo un deseo valioso; completarlo deja de exigir que todo el cuidado se considere secundario frente a su inauguración.

**Cuando no ofrece una misión:**

Teje lento cuando no vende, inventa mantas con colores que no combinan y disfruta un día de nieve mirado desde dentro. Tras el arco cancela una entrega antes de agotar el rebaño. Puede querer que otros admiren el refugio sin usar esa necesidad para vender otra promesa.

**Ante Fuatia:**

Fuatia protege animales y Eira quiere mostrarle el proyecto humano sin fingir que vuelve aceptable cualquier extracción. La diosa puede agradecer un refugio y exigir que las ovejas descansen. Eira defenderá etapas y suministro, no un milagro que permita conservar los mismos pedidos excesivos.

**Conversaciones personales:**

##### VID_nieve_eira_1 · Antes del cambio

> **Eira:** Cada vez que veía cansancio pensaba en la gente que seguiría esperando el techo.
> **Anselmo:** El techo no tiene que desaparecer para que miremos lo que cuesta.
> **Eira:** Cuando rechazaste el lote sentí que rechazabas todo lo que yo quería cuidar.
> **Anselmo:** Estaba rechazando un lote. Todavía quiero sentarme en tu refugio cuando esté listo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nieve_eira_2 · Después del arco personal

> **Eira:** Terminé una pared y dejé la otra para una temporada con reserva.
> **Anselmo:** ¿Y cómo vas a anunciarlo?
> **Eira:** Como una pared hecha. Estoy aprendiendo a no presentarla siempre como la mitad que falta.
> **Anselmo:** Hoy podemos admirar una cosa completa sin pedirle que sea todo el edificio.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar refugio y bienestar.

> **Eira:** Construí un refugio para que estuvieran bien y después les cobré el refugio con más producción.

**Acto 2:** Reservar lana ya obtenida legítimamente.

> **Eira:** Anselmo estaba defendiendo mi proyecto de mis propias cuentas.

**Acto 3:** Tejer muestra y publicar cupos sostenibles.

> **Eira:** Habrá menos mantas este mes. Las habrá también el siguiente.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Manta compartida o abrigo modular.

> **Eira · respuesta 1:** Compartida: Se asignará por necesidad visible.

> **Eira · respuesta 2:** Modular: Cada sección se podrá reparar.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La manta antes del pedido». Variante de manta modular con mismo costo de lana y abrigo base, sin exigir más producción animal. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Anselmo · `nieve_anselmo`

**Pasado:** Anselmo, 70, tejió para caravanas y escribió canciones con una compañera fallecida. Cedió derechos a un empresario creyendo que haría llegar la música más lejos; Sora conserva una versión anterior en Verdia.

**Presente y personalidad:** Es irónico, disfruta colores chillones y detesta que toda persona mayor sea llamada sabio. Quiere recuperar autoría sin poseer las voces de otros.

**Cambio:** Publica canciones con créditos y permiso, enseña tejido sin imponer su estilo. La visita a Sora no obliga a hablar de una pérdida.

**Vínculos:** Lía, Sora, Eira. **Naturaleza:** persona_viva. **Hogar planificado:** `nieveclara_vivienda_01`.

#### El hilo de otra voz · `V_nieve_anselmo`

**Primeros años y lo que aprendió a querer:**

Anselmo tejía para caravanas y compuso canciones con una compañera que hacía letras más rápidas de lo que él encontraba melodía. Discutían por finales, precios y a qué hora dejar el trabajo. A veces nadie pagaba por la música y seguían cantando para sí. Él conserva ese placer anterior a la difusión: dos personas creando algo que no estaba obligado a representar una vida entera.

**Aprendizaje, decisiones y vínculos:**

Cedió derechos pensando que una empresa llevaría las canciones más lejos. Las escuchó después sin los nombres completos y con palabras ajustadas a un acto que ambos habrían discutido. Quería denunciarlo, pero también temía que dejaran de sonar. La muerte de su compañera lo hizo guardar la versión como si cualquier revisión propia fuera una traición.

**Lo que cambia y lo que todavía pesa:**

Sora conserva en Verdia una interpretación anterior. Recuperarla exige permiso y no resucita a la compañera ni declara auténtica una sola grabación. La misión identifica créditos y deja versiones distintas con procedencia. Anselmo puede crear otra canción sin hablar por una persona que ya no está. Con Eira aprende a rechazar un pedido sin usar recuerdos como autoridad indiscutible.

**Cuando no ofrece una misión:**

Teje mientras escucha relatos y a veces canta la versión nueva porque le gusta una frase, sin que eso absuelva al empresario. Tras el arco visita conciertos de Lía sin corregirle todos los finales. Puede tener un día alegre que no funcione como homenaje.

**Ante Fuatia:**

Querría cantar a Fuatia sin prometer una pureza que sus castigos no tienen. Le parece posible agradecer calor y lamentar una sentencia en la misma obra. Si la diosa exige una versión única de su nacimiento, Anselmo defenderá los testimonios distintos sin negar los hechos del origen.

**Conversaciones personales:**

##### VID_nieve_anselmo_1 · Antes del cambio

> **Anselmo:** La canción tenía otro final. Algunas tardes lo cambiábamos solo porque estábamos cansados del anterior.
> **Lía:** ¿Y ahora cuál prefieres?
> **Anselmo:** Me cuesta responder sin imaginar que debo elegir por los dos.
> **Lía:** Puedes contar cuál te gusta hoy. La versión antigua seguirá teniendo su nombre.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nieve_anselmo_2 · Después del arco personal

> **Anselmo:** Escribí una melodía nueva y no intenté convencerme de que ella también la habría elegido.
> **Eira:** ¿Puedo oírla cuando termine de poner la mesa?
> **Anselmo:** Sí. No es una despedida ni un mensaje encontrado. Es bastante alegre.
> **Eira:** Entonces necesito una mesa que no parezca preparada únicamente para recordar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar partitura y permisos.

> **Anselmo:** Esa canción es nuestra. Que alguien la haya comprado no le permite cambiar quién la escribió.

**Acto 2:** Reparar manta con lana existente.

> **Anselmo:** Sora guardó lo que yo creía perdido. No por eso le voy a pedir que viva en mi recuerdo.

**Acto 3:** Interpretar pieza autorizada y corregir créditos.

> **Anselmo:** La manta quedó con otro color. Me gusta que se note quién siguió el trabajo.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Versión instrumental o lectura de créditos.

> **Anselmo · respuesta 1:** Instrumental: Respetaremos el silencio donde iba una voz.

> **Anselmo · respuesta 2:** Lectura: No exigiremos actuar a quien solo quiso ser reconocido.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «El hilo de otra voz». Recuerdo de créditos musicales y acceso instrumental si existe audio autorizado. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Luz · `nieve_luz`

**Pasado:** Luz, 27, investigó gallinas aurorales y prolongó iluminación para mejorar una muestra. Confundió actividad con bienestar hasta que Milena observó falta de reposo.

**Presente y personalidad:** Es curiosa, dibuja constelaciones en cajas y habla rápido. Teme que un resultado pequeño no merezca fondos.

**Cambio:** Registra descanso y luz juntos. Diseña un refugio que permita oscuridad, no una bonificación constante de productos.

**Vínculos:** Milena, Elvira, Flora. **Naturaleza:** persona_viva. **Hogar planificado:** `nieveclara_vivienda_02`.

#### La luz que sabe apagarse · `V_nieve_luz`

**Primeros años y lo que aprendió a querer:**

Luz aprendió a observar auroras porque le interesaban cambios que no pedían permiso a nadie. Su familia celebraba una aparición y seguía haciendo labores mientras ella quería dejarlo todo para mirar. Estudiar animales aurorales parecía unir ambos mundos: belleza y oficio. Un primer registro cuidadoso le dio reconocimiento y deseo de obtener una muestra cada vez más llamativa.

**Aprendizaje, decisiones y vínculos:**

Prolongó luz para aumentar actividad y describió el movimiento como bienestar. Una gallina se apartaba a lugares menos visibles y Luz lo clasificaba como conducta curiosa. Milena pidió registrar descanso; la investigadora respondió que el animal seguía comiendo. Había escogido indicadores capaces de aprobar el ensayo que deseaba publicar.

**Lo que cambia y lo que todavía pesa:**

Corregirlo exigió bajar rendimiento y cambiar un resumen que ya circulaba. La misión incluye oscuridad suficiente, observación y retiro de la práctica sin inventar adaptación inmediata. Luz puede seguir estudiando seres fantásticos sin tratarlos como emisores para una escena. La belleza no necesita producirse continuamente para ser relevante.

**Cuando no ofrece una misión:**

Le gusta mirar cielo sin cámara y llevar notas que a veces acaban con una receta de merienda. Tras el arco muestra descanso junto a actividad y reconoce ausencias de dato. Puede rechazar un encargo de luz permanente aunque parezca una gran oportunidad profesional.

**Ante Fuatia:**

Fuatia siente aire y calor de la instalación, pero Luz no busca una aprobación que sustituya observar al animal. Le preguntará cómo compensa un brillo y registrará lo que vea. Una diosa que ama criaturas también puede necesitar que alguien le diga que el público está impidiendo dormir.

**Conversaciones personales:**

##### VID_nieve_luz_1 · Antes del cambio

> **Luz:** Se movían más y yo escribía activas. Dejé de preguntar si podían dejar de moverse.
> **Milena:** La zona oscura estaba en tu plano. No aparecía en tus resultados.
> **Luz:** Porque allí la muestra parecía menos interesante.
> **Milena:** Una criatura tranquila también tiene algo que decirnos, aunque no dé una foto brillante.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nieve_luz_2 · Después del arco personal

> **Luz:** Apagué a la hora acordada. Una visita preguntó si la aurora había fallado.
> **Celeste:** ¿Qué le respondiste?
> **Luz:** Que estábamos dejando descansar. Luego miramos el cielo sin producirlo nosotros.
> **Celeste:** Es una visita que yo también querría hacer.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar ciclos de animales.

> **Luz:** Se movían más. Yo escribí estaban mejor. No era el mismo dato.

**Acto 2:** Probar pantalla de oscuridad reversible.

> **Luz:** Milena preguntó dónde podían esconderse de mi experimento.

**Acto 3:** Comparar bienestar sin adelantar cuidados reales.

> **Luz:** La lámpara tendrá interruptor. El informe, una columna para descanso.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Pantalla o horario limitado.

> **Luz · respuesta 1:** Pantalla: El animal podrá elegir zona.

> **Luz · respuesta 2:** Horario: La luz artificial nunca borrará todo el reposo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La luz que sabe apagarse». Pantalla de reposo o plan de luz limitado, reversible y sin aumentar huevos por completar misión. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Quirina · `nieve_quirina`

**Pasado:** Quirina, 46, pescaba glaciares y usó una temporada excepcional como regla permanente. Llevó un grupo a un punto que ya no era seguro; Otto lo devolvió por una ruta larga.

**Presente y personalidad:** Es lacónica, hace té dulce y disfruta desafíos de paciencia. Quiere conservar autoridad y teme pedir información a alguien más joven.

**Cambio:** Ajusta rutas con datos actuales, enseña devolución y reconoce incertidumbre de hielo. Lleva a un aprendiz solo al punto autorizado y no necesita demostrar valentía cerca de un borde que recuerda más seguro.

**Vínculos:** Otto, Cora, Severo. **Naturaleza:** persona_viva. **Hogar planificado:** `nieveclara_vivienda_02`.

#### El agujero que ya no está · `V_nieve_quirina`

**Primeros años y lo que aprendió a querer:**

Quirina aprendió pesca en hielo siguiendo marcas cuya apariencia cambiaba con la estación. Le gustaba una incertidumbre compartida: decidir con otros dónde valía la pena esperar. Una temporada excepcional le permitió pagar herramientas mejores y se volvió el relato que visitantes querían oír. Le alegraba que la buscaran por saber, aunque empezó a temer toda respuesta que sonara menos segura que aquel año.

**Aprendizaje, decisiones y vínculos:**

Usó ese punto como referencia fija cuando las condiciones ya habían cambiado. El grupo esperaba una gran jornada y ella evitó nombrar dudas para no perder un ingreso. Otto tuvo que devolverlos por una ruta larga. No hubo muerte que volviera visible el error para todo el pueblo; quedaron cansancio, gastos y una persona que ya no quería aceptar su palabra sin comprobar.

**Lo que cambia y lo que todavía pesa:**

Alma pidió una descripción con fecha y Quirina empezó a justificar la excepción de entonces. La misión compara marcas actuales, reconoce límites y publica alternativa. No transforma a Otto en garante de todas sus excursiones futuras. Puede llevar otra visita con orgullo si conserva derecho a no prometer una pesca que el lugar no ofrece.

**Cuando no ofrece una misión:**

Prepara comida caliente que comparte incluso en jornadas sin captura. Tras el arco anota una salida cancelada como resultado, no como vacío vergonzoso. Puede pasar una tarde de pueblo sin sentir que perdió oportunidad de estar en el hielo.

**Ante Fuatia:**

Fuatia podría transformar un hielo en agua y ese poder no equivale a conocer el plan de cada visitante. Quirina le pide avisos legibles al negociar rutas, no garantías de aventura. Agradecer un rescate no permite venderlo después como servicio siempre disponible.

**Conversaciones personales:**

##### VID_nieve_quirina_1 · Antes del cambio

> **Quirina:** La jornada buena estaba fechada. Yo dejé de decir el año cuando comencé a vender el recorrido.
> **Otto:** El paisaje no tenía por qué seguir cumpliendo tu mejor recuerdo.
> **Quirina:** Te hice cargar una vuelta que no habías ofrecido.
> **Otto:** Registra eso también. No necesito que prometas no equivocarte jamás.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nieve_quirina_2 · Después del arco personal

> **Quirina:** Hoy cancelé. El grupo vino a tomar caldo y algunos dijeron que igual habían disfrutado.
> **Severo:** ¿Puedes creerles sin imaginar que te están consolando?
> **Quirina:** Estoy intentándolo. Todavía me gustó más la temporada extraordinaria.
> **Severo:** Puede seguir gustándote sin convertirse en regla del hielo.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar pronóstico y grosor observado.

> **Quirina:** Ese lugar existió. No existe seguro porque yo lo recuerde así.

**Acto 2:** Pescar solo en punto autorizado.

> **Quirina:** Otto nos llevó por el camino largo. La demora era una prueba de que sí sabía regresar.

**Acto 3:** Devolver juveniles y corregir mapa de acceso.

> **Quirina:** Mi calendario tendrá fecha. El hielo no firmó que repetiría el año pasado.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Punto protegido o jornada de observación.

> **Quirina · respuesta 1:** Protegido: Mantendrá requisitos reales de pesca.

> **Quirina · respuesta 2:** Observación: No entregará capturas ficticias como premio.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «El agujero que ya no está». Calendario de puntos seguros observados, fechas y devolución de juveniles; no revela peces desconocidos. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Severo · `nieve_severo`

**Pasado:** Severo, 59, heredó registros del tiempo y acertó una gran tormenta. Desde entonces el pueblo espera profecías; un pronóstico ambiguo suyo se leyó como certeza y dejó a una brigada mal preparada.

**Presente y personalidad:** Es amable, escucha radio en silencio y odia admitir que disfruta la reputación. Quiere ser útil sin tener que parecer infalible.

**Cambio:** Publica rangos de tres días lógicos y alternativas. Las predicciones no fuerzan clima ni reinician semillas de la partida.

**Vínculos:** Quirina, Samira, Nerea. **Naturaleza:** persona_viva. **Hogar planificado:** `nieveclara_vivienda_03`.

#### Tres días, ninguna promesa · `V_nieve_severo`

**Primeros años y lo que aprendió a querer:**

Severo heredó registros que mezclaban observación y nombres de quienes habían soportado cada invierno. Al copiarlos encontró errores y le gustó poder revisarlos sin despreciar el trabajo antiguo. Predecir una gran tormenta le permitió organizar reservas y esa utilidad fue real. El pueblo empezó a escuchar su voz como algo distinto de un informe: una promesa de que alguien sabría qué venía.

**Aprendizaje, decisiones y vínculos:**

Su prudencia sonaba menos memorable que el gran acierto. Anunció un pronóstico ambiguo sin explicar probabilidad suficiente y una brigada lo leyó como tranquilidad. Cuando faltó equipo, Severo defendió que había dicho posible. La palabra estaba, pero la conversación que podía permitir entenderla había sido demasiado rápida. Quería conservar certeza pública aun entregando una duda.

**Lo que cambia y lo que todavía pesa:**

Otto necesitaba saber qué se había medido y Severo respondió con autoridad heredada. La misión distingue datos, intervalo y recomendación práctica. Puede avisar preparación sin predecir desastre y equivocarse sin convertir toda crítica en negación del oficio. Su edad y su archivo le dan experiencia, no derecho a que otros asuman riesgos para proteger su imagen.

**Cuando no ofrece una misión:**

Disfruta un cielo corriente, juega partidas donde acepta perder y prepara notas que no salen de su mesa. Tras el arco deja recomendaciones visibles junto al cálculo. A veces siente alivio cuando nadie le pregunta por la tarde siguiente; vuelve a ser vecino durante una comida.

**Ante Fuatia:**

La presencia de Fuatia en aire no la convierte en explicación de todo tiempo adverso. Severo quiere escuchar qué intervención hizo y qué fenómeno no provocó. No declarará que una tormenta prueba culpa de viajeros ni usará la posibilidad de un milagro para vaciar reservas.

**Conversaciones personales:**

##### VID_nieve_severo_1 · Antes del cambio

> **Severo:** Había escrito posible. Me agarré de esa palabra como si todos hubieran aprendido a leerla igual que yo.
> **Otto:** Yo necesitaba saber cuánto equipo recomendarías llevar.
> **Severo:** Me costaba parecer menos seguro después de aquel acierto.
> **Otto:** Un informe claro me ayuda más que otra tarde extraordinaria.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nieve_severo_2 · Después del arco personal

> **Severo:** Hoy dejé una recomendación y el dato que todavía falta. No tiene aspecto de profecía.
> **Milena:** ¿Puedes guardar la libreta ahora?
> **Severo:** Sí. Quiero perder una partida donde el resultado no decida la reputación de nadie.
> **Milena:** Entonces vamos a buscar un juego que no tenga pronóstico del tiempo.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar tres registros agrícolas.

> **Severo:** Pronóstico no significa contrato con el cielo. Debí escribirlo mejor.

**Acto 2:** Marcar intervalo y plan alternativo.

> **Severo:** La tormenta no castigó a quien no me creyó. Cambió más rápido de lo que medimos.

**Acto 3:** Presentar aviso comprensible y revisar después.

> **Severo:** El aviso tiene probabilidad y un lugar donde revisar. Ambos son parte del servicio.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Aviso breve o ficha detallada.

> **Severo · respuesta 1:** Breve: No esconderá la incertidumbre.

> **Severo · respuesta 2:** Detallada: Habrá una versión legible junto a la tabla.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Tres días, ninguna promesa». Pronóstico legible de tres jornadas con intervalo y contingencia; conserva semilla climática del motor. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Milena · `nieve_milena`

**Pasado:** Milena, 34, cuidaba plantas frías y respondió a una pérdida volviéndose estricta con aprendices. Su mejor alumna dejó de preguntarle por miedo a parecer descuidada.

**Presente y personalidad:** Es observadora, baila sola al cocinar y recoge frases divertidas. Quiere que otros aprendan y les ahorra errores hasta quitarles espacio.

**Cambio:** Organiza pruebas pequeñas y reconoce que un error informado no equivale a negligencia. Entrega un cuaderno con hojas equivocadas, permitiendo que su alumna vea cuánto del oficio se aprende sin una respuesta brillante.

**Vínculos:** Luz, Zaira, Alma. **Naturaleza:** persona_viva. **Hogar planificado:** `nieveclara_vivienda_03`.

#### La parcela de prueba · `V_nieve_milena`

**Primeros años y lo que aprendió a querer:**

Milena cuidaba plantas frías porque le gustaba ver crecimiento donde visitantes suponían que todo esperaba otra estación. Su primera mentora dejaba que cada aprendiz escogiera una maceta propia y ella recordaba ese espacio como confianza. Una pérdida posterior le dolió tanto que empezó a medir cada gesto de los nuevos estudiantes. Confundía impedir otro fallo con devolver el cuidado recibido.

**Aprendizaje, decisiones y vínculos:**

La mejor alumna dejó de preguntar. Milena interpretó el silencio como autonomía y la celebró frente a otros. Un registro mostraba dudas borradas antes de la revisión. Descubrirlo la enfadó primero: creía que podía corregir si le daban información. Tardó más en admitir que su manera de responder hacía peligroso formular una duda sencilla.

**Lo que cambia y lo que todavía pesa:**

La misión permite comparar sin castigar preguntas y diferencia cultivo perdido de descuido probado. Milena conserva reglas de agua y reposo; no declara que toda práctica vale igual. Su trabajo con Luz exige esa misma claridad sin tono humillante. No puede pedir que la alumna vuelva inmediatamente a confiar para confirmar que ya enseña mejor.

**Cuando no ofrece una misión:**

Compra plantas que no son proyectos de estudio y tiene una en casa cuyo crecimiento disfruta sin ficha pública. Tras el arco pide una duda antes de elogiar una respuesta perfecta. Puede tener una jornada frustrante y anunciar que revisará después en vez de descargarla sobre aprendizajes ajenos.

**Ante Fuatia:**

Fuatia puede amar suelo y volverse implacable por una herida, un impulso que Milena reconoce. Quiere que la diosa distinga una persona aprendiendo de quien explota con conocimiento. La protección no debe generar un miedo que haga esconder el problema hasta que sea mayor.

**Conversaciones personales:**

##### VID_nieve_milena_1 · Antes del cambio

> **Milena:** Dejó de preguntar y yo la felicité por no necesitarme. Su libreta seguía llena de dudas borradas.
> **Luz:** ¿Las borraba porque ya sabía o porque esperaba tu cara al leerlas?
> **Milena:** Me dolió reconocer la segunda. Quisiera que ahora volviera a preguntar pronto.
> **Luz:** Puedes ofrecer el espacio. No fijar también cuándo debe confiar otra vez.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nieve_milena_2 · Después del arco personal

> **Milena:** Hoy alguien preguntó lo que ya había explicado. Respiré antes de volver a decirlo.
> **Eira:** ¿Y la explicación salió distinta?
> **Milena:** Más simple. Me alegró descubrir que también me faltaba aprender a enseñarla.
> **Eira:** Ven a ver la planta de mi ventana. No necesita convertirse en tarea para ninguno.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Elegir dos plantas compatibles.

> **Milena:** Pueden preguntar antes de saber cómo formularlo. Yo también empecé sin el nombre correcto.

**Acto 2:** Ensayar protección reversible con registro.

> **Milena:** Guardé mis propios ensayos fallidos y les mostré solo plantas sanas. Les estaba enseñando una mentira.

**Acto 3:** Comparar resultados y enseñar lo incierto.

> **Milena:** Esta parcela se queda para probar. No tiene que ganar el concurso.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Cobertura o ubicación protegida.

> **Milena · respuesta 1:** Cobertura: Se medirá humedad además de temperatura.

> **Milena · respuesta 2:** Ubicación: El traslado no ignorará estación ni sustrato.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La parcela de prueba». Cuaderno de ensayos de frío y humedad con resultados positivos y negativos, sin bonus de madurez. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Otto · `nieve_otto`

**Pasado:** Otto, 39, es rescatista de montaña y canceló un ascenso para cuidar a su pareja residente de fondo. Sintió culpa cuando otra brigada tuvo una emergencia y decidió no volver a tomar días libres.

**Presente y personalidad:** Es tranquilo, cuenta pasos con música y aprecia quedarse en casa. Teme que querer una vida pequeña parezca egoísmo.

**Cambio:** Forma una red de relevos y diferencia disponibilidad de responsabilidad. No promete rescate universal. El cierre incluye una cena en casa: no tiene que aparecer una emergencia para que su decisión de descansar sea puesta a prueba.

**Vínculos:** Severo, Santiago, Uma. **Naturaleza:** persona_viva. **Hogar planificado:** `nieveclara_vivienda_04`.

#### La cuerda de un equipo · `V_nieve_otto`

**Primeros años y lo que aprendió a querer:**

Otto quería ser rescatista por una mezcla de oficio, salario y gusto por caminos exigentes. Le gustaba volver y encontrar una casa donde nadie esperaba otra demostración de fuerza. Su pareja residente de fondo comparte decisiones y no existe solamente para enfermar o enseñarle descanso. Los dos habían acordado que algunas jornadas no serían de servicio.

**Aprendizaje, decisiones y vínculos:**

Canceló un ascenso para cuidarla y otra brigada tuvo una emergencia. No había firmado cubrirla ni podía estar en dos lugares; aun así tomó el incidente como prueba de haber escogido mal. Empezó a revisar avisos en toda comida. Su pareja se sintió acompañada por un cuerpo que no terminaba de llegar, siempre atento a una ausencia posible.

**Lo que cambia y lo que todavía pesa:**

Al rescatar al grupo de Quirina vio lo fácil que era para otros contar con su disponibilidad sin contratarla. La misión organiza relevos y límites sin prometer rescate seguro para toda imprudencia. Otto puede negarse a una salida y seguir siendo un profesional comprometido. No tiene que conseguir que nunca ocurra nada mientras descansa para conservar el derecho a hacerlo.

**Cuando no ofrece una misión:**

Cocina desayunos largos cuando puede, colecciona mapas viejos y camina sin medir distancia deportiva. Tras el arco conserva un aviso de urgencia con turnos acordados, no una vigilancia personal infinita. Su vida familiar no se reduce a compensar lo que hace por otros.

**Ante Fuatia:**

Fuatia parece capaz de sentir toda emergencia y Otto comprende cuánto cuesta convertir eso en deber de resolverlas todas. No espera un contrato de invulnerabilidad elemental. Quiere rutas claras, reservas y la posibilidad de que pedir ayuda no equivalga a que otro entregue toda su vida.

**Conversaciones personales:**

##### VID_nieve_otto_1 · Antes del cambio

> **Otto:** Nadie me había pedido cubrir aquella brigada. Igual pensé que descansar explicaba todo lo que pasó.
> **Quirina:** Tu trabajo empezó a incluir lo que ni sabías que estaba ocurriendo.
> **Otto:** Sí. Yo había vuelto a casa, pero seguía intentando estar en cualquier montaña.
> **Quirina:** Hoy podemos revisar turnos, sin inventar una persona que llegue a todos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nieve_otto_2 · Después del arco personal

> **Otto:** Dejé el aviso al relevo y desayuné hasta terminar. Me pareció una hora larguísima.
> **Severo:** ¿Era angustia o gusto?
> **Otto:** Las dos al comienzo. Luego solamente había café y conversación.
> **Severo:** No necesitan una emergencia evitada para justificar esa mañana.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Inspeccionar anclas en zona segura.

> **Otto:** Si una ruta depende de que yo nunca me enferme, no tenemos una ruta segura.

**Acto 2:** Practicar relevo sin exponer civiles.

> **Otto:** No estuve allí aquel día. Eso no significa que deba estar en todos los días que quedan.

**Acto 3:** Publicar capacidad y contacto alternativo.

> **Otto:** La cuerda llevará tres manos. La mía también podrá soltarse para descansar.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Relevo local o alerta regional.

> **Otto · respuesta 1:** Local: Habrá entrenamiento antes de abrir ruta.

> **Otto · respuesta 2:** Regional: Se publicará demora estimada, no llegada instantánea.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La cuerda de un equipo». Plan de rescate con responsables, capacidad y demora; no concede extracción gratuita universal. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Celeste · `nieve_celeste`

**Pasado:** Celeste, 32, aprendió cuidado de vacas de nube y quiso criar un grifo para salvar a todo viajero. Azucena le mostró que enseñar una llamada no da control sobre una criatura.

**Presente y personalidad:** Es soñadora, cose juguetes blandos y se distrae mirando auroras. Quiere ayudar, pero confunde una capacidad fantástica con obligación ilimitada.

**Cambio:** Establece refugios y rutas de observación; acepta que un grifo necesita descanso y no responde a todo deseo.

**Vínculos:** Azucena, Eira, Mara. **Naturaleza:** persona_viva. **Hogar planificado:** `nieveclara_vivienda_04`.

#### La nube que necesita suelo · `V_nieve_celeste`

**Primeros años y lo que aprendió a querer:**

Celeste criaba vacas de nube y disfrutaba mirar cómo encontraban caminos cómodos sin seguir siempre su plano. Una vez una criatura se quedó quieta ante una puerta y le mostró un suelo resbaladizo que ella no había visto. Esa observación la hizo respetar decisiones animales. El sueño de un grifo de rescate nació después, como deseo de que una capacidad hermosa sirviera a todo viajero.

**Aprendizaje, decisiones y vínculos:**

Diseñó una llamada creyendo que una respuesta repetida se convertiría en servicio garantizado. Azucena explicó que el grifo no era un vehículo almacenado. Celeste oyó prohibición a una esperanza y defendió su sueño como si cuestionarlo fuera resignarse a perder personas. Empezó a valorar a una criatura por el futuro heroico que podía prestar, no por lo que elegía hacer.

**Lo que cambia y lo que todavía pesa:**

La misión trabaja señales, ancla y consentimiento sin entregar un grifo ilimitado. Celeste conserva el deseo de ayudar y aprende una ruta alternativa cuando no hay respuesta. Con Azucena también cuestiona la vigilancia que pretende organizar cada salida. Puede aceptar límites de una criatura y reclamar libertad responsable para humanos; ambos cuidados se necesitan.

**Cuando no ofrece una misión:**

Dibuja alas desproporcionadas que no usa en fichas técnicas y disfruta una tarde observando al rebaño sin probar llamadas. Tras el arco puede anunciar una ruta viable sin convertirla en rescate milagroso. Mantiene conversaciones con viajeros que no empiezan por sus tragedias.

**Ante Fuatia:**

La amistad de Fuatia con animales la alegra y le hace preguntar por autonomía. Hablar con un grifo no debería convertirlo en obligación de salvar a todo humano. Quiere que la diosa respalde esa libertad aunque en un momento difícil prefiera exigir una intervención.

**Conversaciones personales:**

##### VID_nieve_celeste_1 · Antes del cambio

> **Celeste:** Soñé un grifo que pudiera llegar a todos. No le había dejado una tarde para sí mismo.
> **Azucena:** Yo tampoco dejaba salidas sin revisar. A veces llamaba cuidado a controlar el plan entero.
> **Celeste:** No quiero perder el sueño. Quiero que tenga otra forma.
> **Azucena:** Entonces ensayemos una llamada y también qué harías si no responde.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nieve_celeste_2 · Después del arco personal

> **Celeste:** Hoy no hubo respuesta y el grupo usó la ruta preparada. Nadie lo llamó abandono.
> **Otto:** Buena señal. ¿Vas a intentarlo de nuevo ahora?
> **Celeste:** Otro día. Hoy quiero mirar las alas sin pedirles trabajo.
> **Otto:** Me quedo un rato. Yo también estoy aprendiendo eso.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar bienestar y hogar adecuado.

> **Celeste:** Le dibujé cien rutas antes de preguntarme dónde dormiría.

**Acto 2:** Preparar descanso y ruta de visita.

> **Celeste:** Azucena no apagó mi sueño. Le puso un lugar donde descansar.

**Acto 3:** Observar respuesta sin forzar crianza o extracción.

> **Celeste:** Habrá llamadas que no pueda atender. Por eso también construimos refugios.

**Acceso narrativo:** después de `P01` y visita autorizada. **Decisión antes del acto 3:** Refugio cerrado o zona de retiro abierta.

> **Celeste · respuesta 1:** Cerrado: El acceso lo decidirá el cuidador con criterios visibles.

> **Celeste · respuesta 2:** Abierta: Los visitantes no atravesarán la zona tranquila.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La nube que necesita suelo». Variante de zona de retiro de criatura con hogar adecuado, sin cambiar genomas o obediencia. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## vigilia

### Aldán · `vigilia_aldan`

**Pasado:** Aldán, 49, dirigió evacuaciones en AV 303 y detuvo a una familia por un sello ilegible. La ayudó después, pero ocultó el incidente en cifras generales. Su hijo vive lejos por una elección propia, no porque él sea monstruoso.

**Presente y personalidad:** Habla poco, repara juguetes de refugiados y cocina demasiado para invitados. Quiere seguridad; le cuesta aceptar que su criterio tenga apelación.

**Cambio:** Publica permisos con vía de revisión, retira restricciones innecesarias y escucha la historia que su informe borró.

**Vínculos:** Noemí, Dorian, Ulises. **Naturaleza:** persona_viva. **Hogar planificado:** `vigilia_vivienda_01`.

#### La puerta con otro testigo · `V_vigilia_aldan`

**Primeros años y lo que aprendió a querer:**

Aldán aprendió administración en puestos pequeños donde un sello podía evitar que una carga desapareciera. Le gustaba saber qué responsabilidad aceptaba cada firma. Cuando empezó a coordinar pasos, esa claridad era útil y daba seguridad a visitantes. También le permitía no discutir historias de personas que no cabían en la casilla prevista; un procedimiento podía convertirse en manera de no escuchar.

**Aprendizaje, decisiones y vínculos:**

En AV 303 detuvo a una familia por un sello ilegible. Después la ayudó y registró traslado exitoso sin nombrar la espera que él impuso. El informe no era enteramente falso, pero enseñaba una institución más cuidadosa que la experiencia vivida. Aldán temía que hacer pública una excepción debilitara toda frontera cuando necesitaban organización y acabó confundiendo institución con su propio criterio.

**Lo que cambia y lo que todavía pesa:**

Su hijo se fue lejos por elección propia. Aldán intentaba conversar enviando recomendaciones como si fueran un itinerario. Ese vínculo no demuestra que sea monstruoso ni lo absuelve de los pasos cerrados. La misión crea apelación y corrige registro particular. Después puede seguir exigiendo equipo o un permiso seguro mientras alguien distinto revise su negativa.

**Cuando no ofrece una misión:**

Sabe reparar bolsos, cocina lo mismo varios días porque le gusta y conserva un juego que esperaba compartir con su hijo. Tras el arco una carta incluye una pregunta sin instrucción. En el puesto puede tolerar una crítica sin describir de inmediato todas las evacuaciones que organizó.

**Ante Fuatia:**

Respeta que Fuatia distinga daño real y teme que convierta precisión en prohibición sin apelación. La pregunta también expone su antigua autoridad. No puede reclamar procedimiento humano ante una diosa mientras oculta demoras propias. Defenderá a un castigado que debe recibir atención sin prometerle impunidad.

**Conversaciones personales:**

##### VID_vigilia_aldan_1 · Antes del cambio

> **Aldán:** La familia llegó al final. Esa frase me permitía no decir cuánto esperó por mi decisión.
> **Noemí:** En mi registro aparecen las horas. No contradice el traslado; completa lo que falta.
> **Aldán:** Me preocupa que nadie confíe en otra norma si ve un error mío.
> **Noemí:** Una norma que no admite revisarlo nos pide bastante más fe de la que estás confesando.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_vigilia_aldan_2 · Después del arco personal

> **Aldán:** La revisión cambió una negativa. Dejé la firma y no añadí una nota diciendo que yo tenía buenas razones.
> **Telmo:** ¿También mandamos la carta para tu hijo?
> **Aldán:** Sí. Pregunté por su casa. No preparé una inspección familiar disfrazada de cariño.
> **Telmo:** Entonces es una carta que podré entregar sin necesitar una carpeta de anexos.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar permiso rechazado.

> **Aldán:** Mi informe decía nadie quedó sin ayuda. La ayuda llegó tarde.

**Acto 2:** Contrastar riesgo y registro con Noemí.

> **Aldán:** Noemí no estaba pidiendo abrir todas las puertas. Pedía una segunda persona cuando yo dijera no.

**Acto 3:** Probar apelación y modificar procedimiento.

> **Aldán:** La guardia seguirá. La última palabra ya no será solo mía.

**Acceso narrativo:** después de `P02` y visita autorizada. **Decisión antes del acto 3:** Apelación clínica o civil.

> **Aldán · respuesta 1:** Clínica: No exigirá divulgar un diagnóstico en la plaza.

> **Aldán · respuesta 2:** Civil: Se podrá reclamar sin conocer a un oficial.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «La puerta con otro testigo». Sistema consultable de apelación de paso; mantiene validación de equipo y riesgos actuales. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Noemí · `vigilia_noemi`

**Pasado:** Noemí, 38, llegó a Vigilia para una estancia corta y permaneció por falta de médicos. Detectó contaminación fuera de la frontera y denunció demasiado pronto una causa sin datos; Aldán usó el error para ignorar advertencias posteriores.

**Presente y personalidad:** Es tenaz, toca el acordeón mal y ríe con Rosa. Quiere que la escuchen; revisa casos hasta perder su propio relevo.

**Cambio:** Distingue cuidado inmediato de diagnóstico confirmado, publica correcciones y establece descanso de equipo. Su siguiente aviso puede decir no sabemos la causa todavía, sin permitir que esa duda sea usada para negar una cama.

**Vínculos:** Adela, Salma, Aldán. **Naturaleza:** persona_viva. **Hogar planificado:** `vigilia_vivienda_01`.

#### La ceniza no es una culpa · `V_vigilia_noemi`

**Primeros años y lo que aprendió a querer:**

Noemí eligió una estancia corta en Vigilia para aprender atención de frontera y luego volver a una consulta con horario. Se quedó al ver cuántas personas esperaban turno y comenzó a presentar quedarse como algo que no había podido elegir. Había afecto y necesidad, pero también deseo de un oficio difícil donde su trabajo importara de forma visible. Admitir esa ambición no reduce el cuidado que dio.

**Aprendizaje, decisiones y vínculos:**

Encontró ceniza en pacientes que no cruzaron y anunció una causa antes de contrastarla. Quería provocar una revisión que las peticiones anteriores no conseguían. El error permitió a Aldán desoír advertencias posteriores y ella quiso responder con certeza todavía mayor. Su autoridad clínica se volvió parte de una lucha donde cada duda parecía regalar poder al otro.

**Lo que cambia y lo que todavía pesa:**

La misión vuelve a series de muestras, atención y procedencia. Noemí puede retirar una hipótesis y exigir que un síntoma siga siendo atendido. Aldán no queda habilitado a ignorar todo por un informe malo. Durante la reconstrucción pregunta dónde dormirán supervivientes antes de pedir recuerdos útiles para una investigación. No usa cada persona como prueba de que tenía razón.

**Cuando no ofrece una misión:**

Le gusta cocinar alimentos que no tienen ficha de emergencia y pasear hasta ver la frontera más pequeña desde lejos. Tras el arco toma un turno libre anunciado; otros profesionales continúan sin que su ausencia invalide la vocación. Puede elegir quedarse de nuevo sin llamarlo prisión.

**Ante Fuatia:**

Si Fuatia castiga a un explotador, Noemí sigue atendiendo necesidades concretas. No requiere elegir una alianza divina para ofrecer tratamiento. Desea que los cuatro elementos conserven agua y aire del refugio, pero rechaza clasificar a pacientes según cuánto agradan a la deidad.

**Conversaciones personales:**

##### VID_vigilia_noemi_1 · Antes del cambio

> **Noemí:** Dije que no podía irme. La verdad es que también quería quedarme y que mi trabajo se notara.
> **Rosa:** Puedes quererlo sin convertir cada descanso en traición a la gente que atendiste.
> **Noemí:** Lo sé en consulta. Me cuesta cuando la persona soy yo.
> **Rosa:** Tengo una silla donde no tienes que responder como médica mientras comes.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_vigilia_noemi_2 · Después del arco personal

> **Noemí:** Retiré la causa del informe, no la necesidad de atender. Aldán lo leyó por completo.
> **Aldán:** Sí. Esta vez no usaré una duda para fingir que los síntomas también son discutibles.
> **Noemí:** Bien. Seguiremos discutiendo otras cosas.
> **Aldán:** Espero que algunas puedan ser qué sopa escoger después del turno.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Atender necesidad básica sin interrogar.

> **Noemí:** Primero respira. La pregunta de dónde estuvo puede esperar.

**Acto 2:** Comparar tres muestras autorizadas y anónimas.

> **Noemí:** El primer diagnóstico estaba mal. La necesidad de atención no lo estaba.

**Acto 3:** Publicar protocolo con incertidumbre y prevención.

> **Noemí:** Salma recibirá un protocolo, no una sentencia sobre cada paciente.

**Acceso narrativo:** después de `P02` y visita autorizada. **Decisión antes del acto 3:** Ficha clínica o aviso comunitario.

> **Noemí · respuesta 1:** Clínica: Conservará privacidad del caso.

> **Noemí · respuesta 2:** Comunitario: Dará instrucciones sin nombres propios.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La ceniza no es una culpa». Guía de atención y diagnóstico provisional con fuentes anónimas; no convierte ceniza en juicio moral. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Ulises · `vigilia_ulises`

**Pasado:** Ulises, 42, cartografió una frontera que cambió bajo la Noche. Rescató a Vera y permitió que ella creyera que él jamás se perdía. No quería destruir una confianza que necesitaba.

**Presente y personalidad:** Es afable, disfruta mapas antiguos erróneos y se calla ante elogios de infalibilidad. Quiere enseñar sin mostrar sus dudas.

**Cambio:** Firma revisiones, cuenta el uso de pistas ajenas y deja mapas con blancos explícitos. Cuenta a Vera cómo también él necesitó una señal ajena. Quiere admiración que no obligue a ninguno a fingir perfección.

**Vínculos:** Vera, Aldán, Asha. **Naturaleza:** persona_viva. **Hogar planificado:** `vigilia_vivienda_02`.

#### La frontera del papel · `V_vigilia_ulises`

**Primeros años y lo que aprendió a querer:**

Ulises empezó mapas escuchando a comerciantes que conocían mejor sus caminos que las oficinas. Le gustaba dibujar una conexión que permitiera encontrarse sin pedir guía. Las primeras rutas eran fechas, paradas y dudas, no una imagen total de territorio dominado. Un cambio de frontera le mostró que el conocimiento podía caducar sin que la experiencia anterior hubiera sido inútil.

**Aprendizaje, decisiones y vínculos:**

La Noche desplazó referencias y Ulises ocultó una vuelta equivocada porque necesitaba que confiaran en una salida. Rescatar a Vera consolidó la imagen de alguien que jamás se pierde. Ella esperaba consejo y él evitaba contar sus propias incertidumbres para no quitarle seguridad. Así una ayuda verdadera también empezó a transmitir un ideal imposible.

**Lo que cambia y lo que todavía pesa:**

La misión publica revisión y reservas, admite fallos antiguos y permite compartir decisiones. Ulises no tiene que renunciar a ser guía ni demostrar imperfección haciendo un recorrido peligroso. Puede apoyar a Vera sin tratarla como alumna permanente. Una relación de oficio madura cuando ambos pueden discutir y conservar información distinta del mismo terreno.

**Cuando no ofrece una misión:**

Lleva un cuaderno para dibujos que no son mapas y se ríe de su poca capacidad de dibujar animales. Tras el arco comparte una jornada perdida con fecha y explicación. Puede caminar por un camino conocido simplemente para descansar, sin verificar cada salida.

**Ante Fuatia:**

Fuatia siente suelo completo y Ulises no la imagina como un mapa para apropiarse. Le solicitará acuerdos de tránsito con reservas reales. Si la diosa bloquea un paso, pedir alternativa y revisión no constituye negar la herida que lo motivó.

**Conversaciones personales:**

##### VID_vigilia_ulises_1 · Antes del cambio

> **Ulises:** Me perdí una vez y volví. Nunca te lo conté porque parecías necesitar que yo supiera todo.
> **Vera:** Necesitaba aprender a volver, no encontrar a alguien que nunca tuviera una duda.
> **Ulises:** Convertí tu confianza en una excusa para no mostrarte cómo hice la revisión.
> **Vera:** Podemos dibujar esa vuelta. Sin volver a hacerla para demostrarla.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_vigilia_ulises_2 · Después del arco personal

> **Ulises:** Hoy llevé un cuaderno sin referencias de salida. Me salió un ave parecida a un bolso.
> **Azucena:** Algunos bolsos viajan bastante. No lo uses como ficha de especie.
> **Ulises:** No pensaba hacerlo. Me gusta tener una cosa que puede quedar mal sin cerrar una ruta.
> **Azucena:** Guárdala. Yo también dibujo alas que no pienso medir.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar dos rutas fechadas.

> **Ulises:** El borde del mapa dice hasta aquí supimos, no hasta aquí existe el mundo.

**Acto 2:** Identificar referencia que no cambia con ilusión.

> **Ulises:** Encontré a Vera siguiendo una señal de otra guía. Ella también debe figurar en esta historia.

**Acto 3:** Publicar mapa de retirada y zonas desconocidas.

> **Ulises:** La mejor ruta de hoy puede no ser la de mañana. Revisarla será parte del oficio.

**Acceso narrativo:** después de `P02` y visita autorizada. **Decisión antes del acto 3:** Referencias de terreno o balizas de equipo.

> **Ulises · respuesta 1:** Terreno: Indicaremos qué puede cambiar.

> **Ulises · respuesta 2:** Balizas: Cada una exigirá mantenimiento y registro.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La frontera del papel». Mapa con versiones fechadas, blancos y retirada; no marca tesoros sin prueba. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Kael · `vigilia_kael`

**Pasado:** Kael, 30, creció bajo la Constelación y creyó que su brillo garantizaba toda seguridad. Un ataque en el borde lo llevó al extremo contrario: quiso vigilar incluso conversaciones privadas.

**Presente y personalidad:** Es serio, fabrica relojes de sol y tiene humor inesperado. Quiere una medida para todo riesgo.

**Cambio:** Diferencia señal cósmica, conducta humana y derecho a privacidad. Su puesto observa el límite, no la fidelidad de parejas.

**Vínculos:** Nerea, Azucena, Serena. **Naturaleza:** persona_viva. **Hogar planificado:** `vigilia_vivienda_02`.

#### Lo que una estrella no vigila · `V_vigilia_kael`

**Primeros años y lo que aprendió a querer:**

Kael creció bajo la Constelación oyendo que el Hogar estaba protegido. Esa certeza le permitió jugar y mirar fronteras sin imaginar un deber personal. Entró a vigilancia por oficio y creía que confirmar señales bastaría para conservar una vida estable. Un ataque en el borde le mostró una operación local que no contradecía la existencia del escudo, pero sí su interpretación de seguridad total.

**Aprendizaje, decisiones y vínculos:**

Respondió revisando movimientos cada vez más pequeños. Quiso registrar conversaciones privadas porque temía que cualquier palabra abriera otro conducto. Los vecinos dejaron de hablar con él de asuntos ordinarios y Kael leyó ese retiro como sospecha. La necesidad de pertenecer se mezcló con autoridad hasta que ya solo encontraba contacto humano mediante preguntas de control.

**Lo que cambia y lo que todavía pesa:**

Ulises pidió distinguir un indicio material de una intimidad que no correspondía inspeccionar. La misión revisa permisos, rutas y límites. Kael no abandona vigilancia ni declara que no exista amenaza. Aprende a rechazar una petición abusiva incluso cuando una superioridad invoca seguridad. Puede volver a ser vecino sin exigir acceso a toda historia para merecer confianza.

**Cuando no ofrece una misión:**

Disfruta juegos de precisión, recoge piedras de formas extrañas y quiere aprender música sin evaluar cada ensayo como señal. Tras el arco puede saludar a una persona y no convertir la respuesta en dato. Todavía siente miedo y usa protocolos en vez de improvisar nuevas invasiones.

**Ante Fuatia:**

La omnipresencia de Fuatia le resulta tentadora como vigilancia perfecta. Debe aceptar que sentir aire no entrega intenciones de cada respiración y que proteger no permite apropiarse de intimidad. Puede solicitar una señal física sin pedir a la diosa que lo convierta en juez de toda palabra.

**Conversaciones personales:**

##### VID_vigilia_kael_1 · Antes del cambio

> **Kael:** Dejaron de contarme cosas. Yo lo escribía como falta de colaboración, aunque antes éramos vecinos.
> **Ulises:** ¿Qué podían decir sin acabar en un registro tuyo?
> **Kael:** Casi nada. Quería saber que estaban seguros y terminé haciendo peligrosa una conversación.
> **Ulises:** Hoy podemos tomar café sin anotar que lo elegimos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_vigilia_kael_2 · Después del arco personal

> **Kael:** Un compañero pidió revisar una carta privada. Le expliqué el límite y no inventé una excepción.
> **Telmo:** Gracias. Si hay un indicio real, podremos discutirlo por el procedimiento acordado.
> **Kael:** Después quiero preguntarte cómo estás sin que parezca un inicio de inspección.
> **Telmo:** Empieza por quedarte a escuchar una respuesta que no tenga utilidad de servicio.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar señal del escudo con registro de borde.

> **Kael:** La Constelación no es un ojo puesto sobre cada casa. Yo estaba convirtiendo mi miedo en uno.

**Acto 2:** Retirar vigilancia privada no autorizada.

> **Kael:** El Lazo puede seguir intacto y alguien abrir una puerta que no debía. Son mecanismos distintos.

**Acto 3:** Calibrar alerta territorial con Nerea.

> **Kael:** Vigilaremos conductos. Las conversaciones seguirán perteneciendo a quien las tiene.

**Acceso narrativo:** después de `P02` y visita autorizada. **Decisión antes del acto 3:** Alerta discreta o señal pública.

> **Kael · respuesta 1:** Discreta: No almacenará información personal.

> **Kael · respuesta 2:** Pública: Indicará riesgo, no señalará culpables.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Lo que una estrella no vigila». Plan de alerta territorial del escudo, sin recopilar conversaciones o datos de relaciones. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Azucena · `vigilia_azucena`

**Pasado:** Azucena, 44, crio grifos antes de trabajar en extracción. Una expedición demoró la llamada buscando botín; decidió después controlar cada salida por adelantado. Celeste la confrontó cuando empezó a prohibir sueños además de riesgos.

**Presente y personalidad:** Es cálida con animales, seca con aventureros y le gusta dibujar manos. Desea salvar sin admitir que otro adulto puede elegir irse.

**Cambio:** Enseña consentimiento, reserva y retirada. El manuscrito del grifo no aparece por sacrificio ni por obediencia total.

**Vínculos:** Celeste, Mara, Kael. **Naturaleza:** persona_viva. **Hogar planificado:** `vigilia_vivienda_03`.

#### La llamada que no se discute · `V_vigilia_azucena`

**Primeros años y lo que aprendió a querer:**

Azucena crio grifos antes de la extracción y conservó gusto por criaturas que sabían hacer cosas sin ella. Aprender señales incluía equivocarse, esperar y aceptar una negativa. La primera vez que un grifo bajó por una llamada, quiso contar a todo el mundo la técnica. Una cuidadora le preguntó si también contaría las veces en que no respondía. Esa precisión se perdió después bajo presión de expediciones.

**Aprendizaje, decisiones y vínculos:**

Un grupo demoró la llamada buscando botín. Al volver, Azucena habló de salida segura mientras quienes llegaron defendían lo que casi conseguían. Temió que cualquier libertad repitiera la demora y empezó a controlar planes completos. No castigó por diversión; convirtió experiencia de cuidado en obligación de obedecerla antes de descubrir nada.

**Lo que cambia y lo que todavía pesa:**

Celeste soñaba rescates y recibió prohibiciones sobre riesgos que aún no había propuesto. Le mostró a Azucena que estaba negando incluso imaginación. La misión distingue entrenamiento, extracción real y deseo, sin prometer respuestas ilimitadas de un grifo. Puede exigir preparación y permitir que una persona decida retirarse. No obtiene un animal al inventario como agradecimiento.

**Cuando no ofrece una misión:**

Dibuja alas por gusto, disfruta viajar sin coordinar el grupo y sabe contar bromas de iniciación que no ridiculizan miedo. Tras el arco mantiene equipo y anclas, pero pregunta por objetivos en vez de dictarlos de inmediato. Puede decir no a una extracción imposible sin usarlo para decidir toda aventura posterior.

**Ante Fuatia:**

Fuatia ama animales y Azucena se entiende con ella en respeto a reservas. Discrepa si la diosa convierte una criatura en medio obligatorio de castigo. El grifo conserva voluntad; escuchar lenguaje animal no implica que una divinidad pueda reclamar toda su jornada.

**Conversaciones personales:**

##### VID_vigilia_azucena_1 · Antes del cambio

> **Azucena:** Empecé controlando la llamada y acabé diciendo qué sueños merecían intentarse.
> **Celeste:** Yo quería aprender preparación. No que alguien eligiera qué imaginaría después.
> **Azucena:** Me asustaba oír otra vez que faltaba solamente un botín antes de regresar.
> **Celeste:** Podemos hablar de ese riesgo sin cerrar cada posibilidad que no has visto.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_vigilia_azucena_2 · Después del arco personal

> **Azucena:** Hoy una persona eligió retirarse. No le expliqué cómo podía haber seguido si me obedecía.
> **Mara:** ¿Y el grifo?
> **Azucena:** Volvió a descansar. No necesitábamos convertir el regreso en demostración.
> **Mara:** Me gusta una historia donde alguien vuelve y todavía puede decidir qué quiere contar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar preparación del grifo.

> **Azucena:** Si alguien pide extracción, no se vota si le faltó valentía. Se vuelve.

**Acto 2:** Ensayar llamada con señal de entrenamiento.

> **Azucena:** Quise evitar otra demora y terminé impidiendo que eligieran nada.

**Acto 3:** Estudiar manuscrito y derecho de retirada.

> **Azucena:** El grifo protege una ruta. No adquiere a quien rescata.

**Acceso narrativo:** después de `P02` y visita autorizada. **Decisión antes del acto 3:** Ensayo individual o por relevos.

> **Azucena · respuesta 1:** Individual: No exigirá otro jugador conectado.

> **Azucena · respuesta 2:** Relevos: Cada señal quedará disponible en solitario.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La llamada que no se discute». Guía de llamada y manuscrito del grifo; no hace un grifo siempre disponible ni propiedad del jugador. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Telmo · `vigilia_telmo`

**Pasado:** Telmo, 36, llevaba cartas oficiales y perdió una bolsa durante la primera evacuación. Reconstruyó mensajes de memoria y una familia recibió una versión equivocada. Lo corrigió, pero empezó a negarse a dar cualquier resumen útil.

**Presente y personalidad:** Es amable, dobla sobres impecables y disfruta novelas de viaje. Quiere fiabilidad sin cargar responsabilidad por interpretar.

**Cambio:** Separa original, copia y resumen, solicita permiso y verifica destinatarios sin leer intimidad ajena. Una visita posterior lo encuentra leyendo su novela por gusto, no custodiando cada sobre para justificar que todavía es necesario.

**Vínculos:** Paloma, Berenice, Rita. **Naturaleza:** persona_viva. **Hogar planificado:** `vigilia_vivienda_03`.

#### La copia no ocupa el lugar · `V_vigilia_telmo`

**Primeros años y lo que aprendió a querer:**

Telmo empezó entregando cartas pequeñas y disfrutaba el momento en que un destinatario reconocía la letra antes de abrir. La neutralidad del oficio consistía en conservar el sobre, no en no sentir nada. Aprendió a dejar que una noticia se leyera a solas aunque él deseara saber si había llevado alegría. Esa paciencia se volvió más difícil cuando la evacuación convirtió cada entrega en urgencia.

**Aprendizaje, decisiones y vínculos:**

Perdió una bolsa en la primera salida y reconstruyó de memoria un mensaje para no dejar a una familia esperando sin respuesta. Una frase cambió el destino previsto. Al corregir, explicó intención con tanta prisa que la familia no pudo hablar de lo ocurrido. Desde entonces evitó incluso resumir información pública que habría ayudado, temiendo que otro error borrara toda confianza.

**Lo que cambia y lo que todavía pesa:**

Paloma mostró cómo marcar un resumen como tal y conservar fuente disponible. La misión reconstruye cadena y define cuándo no hay dato suficiente. Telmo aprende a explicar ausencia sin abandonar utilidad. No se convierte en narrador de cartas privadas para el jugador: el contenido consentido y la procedencia pública son cosas diferentes.

**Cuando no ofrece una misión:**

Escribe cartas propias muy breves y luego añade dibujos porque le parece poco lo dicho. Tras el arco puede contar un horario en palabras claras y conservar una referencia al documento. Quiere tardes en que la bolsa quede guardada y nadie espere noticia de él.

**Ante Fuatia:**

Le pediría a Fuatia no confundir llevar una sentencia con compartirla. También se negaría a distribuir propaganda que presente un castigo nuevo como hecho ya demostrado. Su trabajo puede apoyar reparación y aceptar que una persona no quiera recibir una aparición en vez de una carta.

**Conversaciones personales:**

##### VID_vigilia_telmo_1 · Antes del cambio

> **Telmo:** Quería dar una respuesta y fabriqué una que sonaba suficientemente parecida.
> **Paloma:** ¿Ahora distingues el resumen de lo que recuerdas sin fuente?
> **Telmo:** Sí. Me cuesta decir no sé cuando alguien espera una noticia importante.
> **Paloma:** Puedes decirlo y ayudar a buscar la fuente. No tienes que inventarla para seguir siendo útil.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_vigilia_telmo_2 · Después del arco personal

> **Telmo:** Hoy expliqué el horario y dejé dónde consultarlo. No era una carta privada ni una adivinación.
> **Aldán:** Suena menos solemne que nuestros avisos antiguos.
> **Telmo:** También se entiende más rápido. Después quiero escribir algo que no tenga sello.
> **Aldán:** Yo tengo una carta así pendiente. Podríamos guardarnos compañía sin leernos los borradores.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar sello y destinatario.

> **Telmo:** Puedo explicar dónde va el sobre. No debo inventar lo que quiso decir quien lo escribió.

**Acto 2:** Recuperar copia autorizada de mensaje.

> **Telmo:** Mi resumen dejó de ser ayuda cuando nadie supo que era resumen.

**Acto 3:** Entregar con etiqueta de origen y registrar recepción.

> **Telmo:** La copia está marcada. Si falta el original, se dirá que falta.

**Acceso narrativo:** después de `P02` y visita autorizada. **Decisión antes del acto 3:** Lectura privada o entrega cerrada.

> **Telmo · respuesta 1:** Privada: Solo ocurrirá con permiso del destinatario.

> **Telmo · respuesta 2:** Cerrada: El recibo no guardará el contenido.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La copia no ocupa el lugar». Plantilla de correspondencia que etiqueta original, copia y resumen sin guardar el contenido privado. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## rosal_eterno

### Amaranta · `verdia_amaranta`

**Pasado:** Amaranta vivió 63 años y murió en AV 274. Cultivó rosas para homenajes oficiales; tardó en escuchar a quienes no querían otra ceremonia. En Verdia eligió permanecer y empezó un jardín sin monumentos.

**Presente y personalidad:** Tiene humor delicado, disfruta podar y aún corrige cómo recuerdan otros. Quiere que el olvido no destruya afectos, teme confundir silencio con abandono.

**Cambio:** Permite espacios sin nombre y memoria privada. Permanecer en Verdia no exige producir rosas para los vivos.

**Vínculos:** Aina, Serena, Basilia. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_01`.

#### El rosal sin inscripción · `V_verdia_amaranta`

**Primeros años y lo que aprendió a querer:**

Amaranta aprendió cultivo en una casa que marcaba celebraciones con flores sencillas. Antes de recibir encargos oficiales cultivaba por aroma y por gusto de ver otra temporada. Una vecina quería una rosa sin nombre conmemorativo y ella no entendía qué podía faltar a una flor tan apreciada. La carrera posterior le enseñó a prestar atención a programas y visitantes, mientras alejaba aquel gusto pequeño que no necesitaba discurso.

**Aprendizaje, decisiones y vínculos:**

Los homenajes daban trabajo a varias familias y Amaranta no deseaba despreciarlos. Sin embargo, cuando una persona pedía menos ceremonia, le ofrecía una composición más modesta en vez de permitirle no asistir. Había confundido cariño con hacerse cargo de expresar lo que otros sentirían. Aprendió a escuchar algunas negativas todavía en vida, sin convertir su muerte en la primera ocasión de cambiar.

**Lo que cambia y lo que todavía pesa:**

Murió en AV 274 con sesenta y tres años y eligió permanecer. El jardín sin monumentos parecía una solución clara hasta que un visitante pidió un pequeño símbolo propio. Amaranta intentó prohibirlo en nombre de libertad. La misión distingue evitar imposición de dictar silencio. Conserva un espacio tranquilo y permite usos consentidos; no se vuelve funcionaria de duelo por quedarse en Verdia.

**Cuando no ofrece una misión:**

Deja una sección sin diseño y cambia macetas por placer. Tras el arco pregunta si un visitante quiere conversar o mirar. Una flor puede ser bella sin convertirse en examen de cuánto recuerda alguien a una persona ausente.

**Ante Fuatia:**

Conoce el nacimiento de Fuatia por testimonios llegados después de su muerte. No lo presenció. Le interesa que sus altares permitan gratitud, miedo y ninguna ofrenda. Puede cuidar un jardín dedicado a ella sin decidir qué deben sentir todos sus visitantes.

**Conversaciones personales:**

##### VID_verdia_amaranta_1 · Antes del cambio

> **Amaranta:** Pensé que un jardín sin monumentos dejaría libre a todo el mundo. Luego una persona quiso un símbolo y casi se lo prohibí.
> **Aina:** Una norma puede imponer silencio tan fácilmente como una ceremonia.
> **Amaranta:** Me sigue importando este espacio tranquilo.
> **Aina:** Puedes conservarlo preguntando qué espacio necesita quien llega.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_amaranta_2 · Después del arco personal

> **Amaranta:** Hoy dejaron una piedra y preguntaron antes. No le inventé un nombre público.
> **Sarai:** ¿Vas a dibujar alrededor?
> **Amaranta:** Otro día, si lo quieren. Hoy me gustó verla sin convertirla en proyecto.
> **Sarai:** Me quedaré mirando contigo. No traje un pincel por obligación.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Pedir permiso para visitar jardín.

> **Amaranta:** No toda ausencia quiere convertirse en una inscripción.

**Acto 2:** Reunir testimonio voluntario sin identificar a terceros.

> **Amaranta:** Pensé que si no escribíamos su nombre, nadie lo acompañaba. Ella quería acompañarlo en silencio.

**Acto 3:** Diseñar placa reversible o zona sin placa.

> **Amaranta:** La rosa no contará lo que su dueña no quiso contar.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Placa consentida o jardín sin nombres.

> **Amaranta · respuesta 1:** Placa: Se podrá retirar por petición del testigo.

> **Amaranta · respuesta 2:** Sin nombres: No contará como colección incompleta.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «El rosal sin inscripción». Recuerdo del jardín con o sin inscripción, retirables por permiso; misma recompensa en silencio. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Nilo · `verdia_nilo`

**Pasado:** Nilo murió con 47 años en AV 291 tras una vida de acompañar viajes. Eligió ser Cuidador de rutas, no juez de almas. Prometía destinos tranquilos para calmar miedo y aprendió que una promesa falsa también pesa después de morir.

**Presente y personalidad:** Es cordial, disfruta caminar sin misión y colecciona historias de comidas. Los visitantes lo confunden con representante infalible de Lara.

**Cambio:** Explica opciones sin dirigir decisiones. Su trabajo termina cuando alguien pide espacio; puede descansar o reincarnarse más adelante.

**Vínculos:** Serena, Eneas, Iria. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_01`.

#### El guía que no decide · `V_verdia_nilo`

**Primeros años y lo que aprendió a querer:**

Nilo acompañaba viajes llevando comida y conversación cuando una familia no podía contratar guía. Le gustaba escuchar por qué alguien quería salir, no únicamente adónde iba. En una ruta recibió una pregunta sobre peligro y respondió con certeza para que la persona durmiera. Al principio pensó que calmar era una herramienta tan necesaria como una manta.

**Aprendizaje, decisiones y vínculos:**

Prometió un destino tranquilo y hubo una dificultad que podía haber explicado. La persona llegó, pero dijo que habría escogido otra preparación de haberlo sabido. Nilo confundía gratitud por acompañar con aprobación de todo lo dicho. Empezó a ofrecer advertencias tan numerosas que parecían otra manera de conducir la elección, hasta comprender que informar también requiere proporción.

**Lo que cambia y lo que todavía pesa:**

Murió con cuarenta y siete años en AV 291 y eligió rutas de Verdia sin ser juez de almas. Aquí volvió a prometer serenidad a quien aún sentía miedo. La misión aprende a describir opciones y aceptar pausa. Nadie tiene que atravesar una puerta para demostrar que agradece su servicio y él no transforma cuidado en autoridad sobre reincarnación.

**Cuando no ofrece una misión:**

Disfruta caminar sin destino encargado y volver por un camino diferente. Tras el arco puede decir que no conoce una sensación que el viajero aún no ha vivido. Conserva hospitalidad sin fingir que todas las transiciones serán cómodas.

**Ante Fuatia:**

Fuatia también quiere proteger y puede ofrecer seguridad mediante castigo. Nilo le pregunta cuánto sabe de lo que un protegido preferiría elegir. No exige que deje de intervenir: quiere que una ayuda deje espacio para una negativa y una ruta diferente.

**Conversaciones personales:**

##### VID_verdia_nilo_1 · Antes del cambio

> **Nilo:** Dije que estaría tranquilo para que pudiera dormir. Llegó con miedo y creyó haber fallado a mi promesa.
> **Eneas:** Un miedo no debería tener que pedirte disculpas.
> **Nilo:** Quise regalar alivio y entregué una obligación bastante rara.
> **Eneas:** Hoy podemos ofrecer compañía sin describir de antemano cómo se sentirá.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_nilo_2 · Después del arco personal

> **Nilo:** La persona decidió quedarse en la banca. El camino sigue abierto sin llevarla hoy.
> **Amaranta:** ¿También podrás quedarte?
> **Nilo:** Sí. No tengo que llamar retraso a toda conversación que se detiene.
> **Amaranta:** Entonces escogeremos sombra y hablaremos de tus paseos sin encargo.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar reglas de visita.

> **Nilo:** Conozco el camino. No conozco mejor que tú la vida que quieres.

**Acto 2:** Acompañar recorrido elegido por visitante.

> **Nilo:** Le prometí calma porque no sabía acompañar una pregunta abierta.

**Acto 3:** Ofrecer regreso y registrar consentimiento sin evaluación moral.

> **Nilo:** Puedes volver sin decidir nada. La visita no fue desperdicio.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Recorrido breve o descanso junto al umbral.

> **Nilo · respuesta 1:** Breve: Mantendremos ancla y salida visibles.

> **Nilo · respuesta 2:** Descanso: No interpretaré silencio como permiso.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El guía que no decide». Recorrido acompañado o descanso en umbral con opción clara de regreso; no obliga a decidir destino. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Isadora · `verdia_isadora`

**Pasado:** Isadora murió con 51 años antes de AV 0. Fue testigo de la evacuación de un panteón que Nath destruyó; el archivo simplificó su relato para que encajara con otro. Eligió preservar huertos donde distintas versiones podían crecer juntas.

**Presente y personalidad:** Es aguda, se ríe de recuerdos de ropa y se molesta si todo diálogo se vuelve interrogatorio. Quiere ser persona además de testigo.

**Cambio:** Autoriza fragmentos y conserva desacuerdos. La campaña no extrae una verdad total de su mente.

**Vínculos:** Esteban, Damián, Sarai. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_02`.

#### Dos frutos, dos recuerdos · `V_verdia_isadora`

**Primeros años y lo que aprendió a querer:**

Isadora creció en un plano anterior al Alzamiento del Velo y recuerda una vida que no estaba siempre anunciando una catástrofe. Tenía disputas por agua de huerto, recetas favoritas y una vecina que pintaba puertas azules. Esos detalles le importan porque archivos posteriores describieron su mundo únicamente como panteón destruido. Su casa no existió solo para convertirse en evidencia de Nath.

**Aprendizaje, decisiones y vínculos:**

La evacuación mezcló órdenes, cambios de ruta y personas decidiendo qué podían cargar. Isadora recuerda un puente azul; Esteban conserva otra estructura. Ella tiene testimonio propio, no conocimiento de toda la secuencia ni acceso a las últimas decisiones de todos. Durante años oyó resúmenes que convertían diferencias en errores y entendió que quedarse callada facilitaba una historia que no la representaba.

**Lo que cambia y lo que todavía pesa:**

Murió con cincuenta y un años antes de AV 0 y eligió cuidar huertos en Verdia. Continúa siglos después sin envejecimiento mortal ni una obligación eterna de trabajar. Su misión autoriza dos relatos distintos y conserva el derecho a no contar una parte. Los protagonistas no se llevan su alma para demostrar verdad. Cuando narra una mañana corriente del plano perdido, recupera una vida que la campaña necesita respetar además de utilizar.

**Cuando no ofrece una misión:**

Cultiva algo que no crecía en el mundo anterior y disfruta un recuerdo que no funciona como comparación. Tras el arco puede rechazar una entrevista sin cerrar otra visita de té. Las conversaciones sobre panteones no la convierten en archivo público automático.

**Ante Fuatia:**

No presenció el nacimiento de Fuatia en AV 156: ya estaba en Verdia. Recibió relatos de visitantes y desconfía de cualquier versión obligatoria. La precisión de sus blancos y el dolor de sobrevivientes pueden registrarse juntos. No equipara a Fuatia con Nath solo por compartir resentimiento; examina medios y decisiones.

**Conversaciones personales:**

##### VID_verdia_isadora_1 · Antes del cambio

> **Isadora:** Antes del puente hubo muchas mañanas en que solo discutíamos cuánto regar.
> **Esteban:** El archivo convirtió esas mañanas en un prólogo demasiado corto.
> **Isadora:** Quiero que alguien conozca la puerta azul aunque no ayude a vencerlo.
> **Esteban:** Puedo registrarla sin obligarla a demostrar otra cosa.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_isadora_2 · Después del arco personal

> **Isadora:** Hoy no quise hablar del último viaje. La visita aceptó y preguntó por este huerto.
> **Eneas:** ¿Te gustó que hubiera una conversación después de decir no?
> **Isadora:** Mucho. No tuve que entregar un recuerdo para recibir compañía.
> **Eneas:** Podemos seguir aquí mientras tú decides qué planta quieres mostrar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Escuchar relatos por separado y con permiso.

> **Isadora:** Recuerdo el color. Ella recuerda la baranda. No nos vuelvas rivales para ordenar tu cuaderno.

**Acto 2:** Comparar detalles sin forzar coincidencia.

> **Isadora:** Vael quería arreglar la diferencia. Yo quiero que aprendas a vivir con ella.

**Acto 3:** Archivar versiones y acompañarlas de contexto.

> **Isadora:** Deja mi risa en el relato. No fui testigo todo el día.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Archivo paralelo o encuentro consentido.

> **Isadora · respuesta 1:** Paralelo: Ninguna versión será la correcta por defecto.

> **Isadora · respuesta 2:** Encuentro: Podrán detener la lectura cuando quieran.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «Dos frutos, dos recuerdos». Vista paralela de dos relatos autorizados, conservando diferencias y contexto. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Berenice · `verdia_berenice`

**Pasado:** Berenice murió con 68 años en AV 302 después de ser escribana. Guardó una carta para evitar conflicto y el destinatario murió sin leerla. Reconoce que su cuidado también controló a otros; su reparación ocurrió antes de llegar a Verdia.

**Presente y personalidad:** Es cálida, dibuja bordes de sobres y aprecia cartas sin grandes declaraciones. Quiere facilitar correspondencia sin decidir cuándo otro está preparado.

**Cambio:** Establece permisos y entrega literal. No manda mensajes automáticos que obliguen a los vivos a responder a muertos.

**Vínculos:** Telmo, Damián, Lucio. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_02`.

#### La carta que no me pertenece · `V_verdia_berenice`

**Primeros años y lo que aprendió a querer:**

Berenice se hizo escribana porque podía prestar palabras a quienes tenían algo claro que decir y poca práctica para escribirlo. Disfrutaba ser útil sin ocupar el lugar del remitente. Al empezar le preguntaba a cada persona si quería leer en voz alta. Con experiencia fue suponiendo intenciones y limpiando frases que le parecían demasiado duras.

**Aprendizaje, decisiones y vínculos:**

Guardó una carta para evitar un conflicto entre personas que conocía. Planeaba entregarla cuando pudiera acompañar la lectura, pero siempre había un motivo para esperar. El destinatario murió antes. Berenice no puede saber si la carta habría cambiado la relación y se niega a inventar un perdón final para tranquilizarse. Corrigió el acto y habló con afectados todavía en vida.

**Lo que cambia y lo que todavía pesa:**

Murió con sesenta y ocho años en AV 302 y permanecer en Verdia no le otorgó absolución por defecto ni una nueva oportunidad de entregar a un muerto lo que jamás leyó. La misión trabaja consentimiento, copias y devolución. Puede ofrecer acompañamiento sin retener un texto por miedo al resultado. Su historia distingue un arrepentimiento honesto de una fantasía donde el mundo debe conceder una escena de cierre.

**Cuando no ofrece una misión:**

Escribe cartas propias con tachones y las deja visibles a quien corresponda. Tras el arco conserva caligrafía bella sin convertirla en filtro de emoción ajena. Le gusta recibir mensajes muy cortos y descubrir que también pueden ser suficientes.

**Ante Fuatia:**

A Fuatia le pediría avisos legibles de una sentencia, no documentos que solo embellezcan su voluntad. Una diosa puede temer conflicto y llamarlo protección. Berenice sabe que evitar una conversación también decide el destino de otra persona.

**Conversaciones personales:**

##### VID_verdia_berenice_1 · Antes del cambio

> **Berenice:** No sé si habría cambiado nada. Me costó aceptar que el arrepentimiento no viene con una respuesta escondida.
> **Aina:** Puedes conservar la pregunta sin fabricar una última conversación.
> **Berenice:** Hoy quiero enseñar a escribir una carta sin corregir lo que la persona siente.
> **Aina:** Entonces pregúntale primero qué quiere conservar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_berenice_2 · Después del arco personal

> **Berenice:** Me pidieron entregar una frase dura. Pregunté si querían acompañamiento y respeté la respuesta.
> **Oriel:** ¿Te quedaste esperando que saliera todo bien?
> **Berenice:** Un rato. Después recordé que la carta no me prometía un final cómodo.
> **Oriel:** Podemos tomar té sin convertirnos en jurado de lo que sucederá.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar autorización de autor.

> **Berenice:** No voy a decidir si esta carta le hará bien. Voy a preguntarle si quiere recibirla.

**Acto 2:** Preparar copia fiel con partes privadas excluidas por el autor.

> **Berenice:** Una carta puede esperar por decisión de quien la recibe, no por mi miedo.

**Acto 3:** Entregar o custodiar según deseo del destinatario.

> **Berenice:** El sobre queda aquí hasta que haya respuesta. No habrá una deuda por no abrirlo.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Entrega autorizada o custodia voluntaria.

> **Berenice · respuesta 1:** Entrega: Conservaré solo el recibo, no la reacción íntima.

> **Berenice · respuesta 2:** Custodia: La carta no se perderá ni vencerá.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La carta que no me pertenece». Agenda de entrega o custodia sin plazo real; destinatario puede rechazar carta sin perder utilidad. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Lucio · `verdia_lucio`

**Pasado:** Lucio murió con 59 años en AV 306 y fue esposo de Rosa. Eligió quedarse en Verdia porque disfruta hospedar, no porque espere poseer la vida de ella desde lejos. Conserva arrepentimientos cotidianos: dejó demasiadas decisiones domésticas a Rosa.

**Presente y personalidad:** Es bromista, cocina por compañía y todavía discute la sal. Quiere enviar cariño sin convertir una carta en obligación de recordar.

**Cambio:** Escribe permiso para que Rosa siga viviendo como quiera. Una visita no lo devuelve a su cuerpo ni permite matrimonio gestionado como premio.

**Vínculos:** Rosa, Simón, Berenice. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_03`.

#### Una receta, ninguna cadena · `V_verdia_lucio`

**Primeros años y lo que aprendió a querer:**

Lucio trabajó cocinas pequeñas antes de conocer a Rosa ya adulta. Le gustaba una mesa donde huéspedes distintos pudieran disputar un ingrediente sin dejar de comer juntos. Sabía comprar barato y tardaba demasiado escogiendo algo para sí mismo. La posada compartida no nació de una revelación romántica: reunieron recursos, discutieron distribución y aprendieron a decidir en jornadas donde ambos estaban cansados.

**Aprendizaje, decisiones y vínculos:**

Su relación con Rosa incluía humor, afecto y desacuerdos repetidos. Él prefería asegurar atención antes de ampliar; ella deseaba demostrar que podían hacer crecer el negocio. Cedieron por temporadas y ninguna postura era enteramente cómoda. Lucio dejó demasiadas decisiones domésticas a Rosa porque su trabajo de cocina parecía tener urgencia visible. Alguien tenía que recordar limpieza, fechas y reparaciones. Admiraba que ella lo hiciera y usó esa admiración como razón para no aprender algunas tareas.

**Lo que cambia y lo que todavía pesa:**

Enseñar a Simón le devolvió gusto por recetas que ya preparaba sin mirar. También pudo esconder detrás de enseñar otra conversación pendiente con Rosa. Al morir con cincuenta y nueve años en AV 306 eligió Verdia porque aún disfruta hospitalidad, no para vigilar desde lejos a su esposa. La carta autorizada no pide conservar una mesa intacta ni le dicta si amar otra vez. Lucio puede reconocer lo que dejó a cargo de ella sin inventar una vida matrimonial perfecta ni usar la muerte para evitar toda responsabilidad.

**Cuando no ofrece una misión:**

El hospedaje de Verdia no alimenta una necesidad corporal equivalente a la humana ni produce monedas por muerte. Un té ofrece encuentro. Después de su arco aprende usos que no existían en su posada y puede recibir a Rosa si ella quiere y existe permiso, sin exigir visita recurrente para conservar vínculo. Sigue prefiriendo menús distintos a los de Simón. Una conversación puede ser alegre, incómoda o breve sin representar una despedida nueva.

**Ante Fuatia:**

Le agradece a Fuatia el calor que permite recibir y no considera que todo hogar cálido sea moralmente justo. Sabe que un trabajo cuidado puede descansar en carga ajena. Si la diosa mira un horno para premiar, Lucio le hablaría también de quien llevó agua y limpió sin recibir nombre en el relato.

**Conversaciones personales:**

##### VID_verdia_lucio_1 · Antes del cambio

> **Lucio:** Yo cocinaba y Rosa recordaba que había que reparar una ventana. Siempre decía que ella era mejor organizando.
> **Amaranta:** ¿La admirabas o estabas dejando de aprender?
> **Lucio:** Las dos. Me costaría menos contarlo si una cancelara la otra.
> **Amaranta:** Aquí también puedes aprender sin usar una carta para pedirle que te absuelva.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_lucio_2 · Después del arco personal

> **Lucio:** La carta no pide que espere. Me descubrí queriendo explicar un plato antes de decir esa parte.
> **Berenice:** Ya quedó escrito con claridad. La decisión de leerla sigue siendo suya.
> **Lucio:** Bien. Hoy quiero recibir a alguien que no conoció la posada.
> **Berenice:** Entonces tendrás una conversación donde no todo empieza con volver.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Escuchar lo que Lucio autoriza contar.

> **Lucio:** Dile que la sopa todavía me parece salada. Y que puede cambiarla. Las dos cosas son verdad.

**Acto 2:** Copiar receta y carta sin añadir recuerdos reales.

> **Lucio:** No quiero una silla que le impida sentarse con alguien más. Quiero que coma acompañada si le apetece.

**Acto 3:** Ofrecer entrega a Rosa y respetar respuesta.

> **Lucio:** La carta dice gracias y sigue. No dice espérame.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Carta breve o receta anotada.

> **Lucio · respuesta 1:** Carta: Berenice guardará la copia con permiso.

> **Lucio · respuesta 2:** Receta: Rosa podrá recibir el mensaje después sin perderlo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «Una receta, ninguna cadena». Receta anotada de sopa con misma función que la base; no fuerza visita, matrimonio o espera eterna. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Sarai · `verdia_sarai`

**Pasado:** Sarai murió con 40 años en AV 287. Fue pintora y aceptó retratos oficiales que borraban a trabajadores. Corrigió algunos antes de morir; eligió continuar murales con quienes quisieran participar.

**Presente y personalidad:** Es vivaz, disfruta manchas accidentales y teme repetir propaganda bajo aspecto hermoso. Tiene una amistad de oficio con Renata.

**Cambio:** Pinta capas que conservan cambios y deja zonas a otros autores. Ningún mural implica permiso eterno para usar un rostro.

**Vínculos:** Renata, Isadora, Orin. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_03`.

#### La capa que no borra · `V_verdia_sarai`

**Primeros años y lo que aprendió a querer:**

Sarai pintaba personas ocupadas porque sus posturas decían más que una pose solemne. Sus primeros trabajos tenían manos, mesas usadas y alguien entrando fuera del centro. Conseguir un retrato oficial le dio pago estable y materiales que no podía comprar antes. Quiso usar esa oportunidad para seguir pintando libre después y aceptó condiciones que cada vez ocupaban más espacio.

**Aprendizaje, decisiones y vínculos:**

Los encargos borraban trabajadores de una escena para mostrar únicamente al funcionario que inauguraba. Sarai sabía que no todos habían faltado el día de posar, pero llamaba composición a su omisión. Antes de morir corrigió varios retratos y discutió deudas concretas, no proclamó que toda imagen de autoridad fuera falsa. Le costó perder clientes que habían apreciado sinceramente su técnica.

**Lo que cambia y lo que todavía pesa:**

Murió con cuarenta años en AV 287 y eligió murales participativos. En Verdia quiso invitar a cada visitante y una persona pidió no ser pintada. Sarai pensó que incluir era siempre hacer visible. La misión aprende que reconocer no obliga a exponer. Puede conservar una figura anónima autorizada sin convertirla en pista que revele después una intimidad.

**Cuando no ofrece una misión:**

Pinta paisajes sin personas cuando le apetece y deja un mural un día para que otro autor trabaje. Tras el arco su firma identifica contribución, no propiedad de todas las imágenes. Le gusta escuchar una opinión estética que no evalúe también su reparación moral.

**Ante Fuatia:**

El aspecto de Fuatia la impresiona y no la usará para hacer amable una escena cruel. Un retrato elegante puede convivir con un texto crítico de su sentencia. Sarai pediría permiso para mostrar una aparición y acreditaría a quienes sostienen el altar sin quedar detrás de la diosa como decoración.

**Conversaciones personales:**

##### VID_verdia_sarai_1 · Antes del cambio

> **Sarai:** Dejé fuera a quienes habían montado la mesa. En el cuadro el funcionario parecía haber preparado todo.
> **Aina:** ¿Querías un cuadro más limpio o conservar el encargo?
> **Sarai:** Quería conservarlo y usé limpio para no decirlo.
> **Aina:** Puedes dibujar hoy una mesa que no necesite mentir sobre quién puso las manos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_sarai_2 · Después del arco personal

> **Sarai:** Una persona pidió no aparecer y dejó una idea para el color. También es una contribución.
> **Sora:** ¿Pondrás su nombre?
> **Sarai:** Preguntaré. No tengo que publicar una identidad para admitir que no elegí todo sola.
> **Sora:** Me gusta que el mural pueda tener una parte que no está intentando cantar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Pedir permiso a dos autores.

> **Sarai:** No voy a pintar una multitud feliz para tapar una reunión difícil.

**Acto 2:** Preparar pigmento autorizado sin extraer memoria.

> **Sarai:** Renata puso una costura visible donde yo quería una superficie lisa. Me enseñó algo sin dar discurso.

**Acto 3:** Pintar corrección visible y registrar quién puede retirarla.

> **Sarai:** El mural podrá seguir después de mí. No necesita terminar conmigo.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Capa nueva o panel separado.

> **Sarai · respuesta 1:** Capa: Conservará registro del original.

> **Sarai · respuesta 2:** Panel: Permitirá desacuerdo sin cubrir otra voz.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «La capa que no borra». Panel de mural por capas con créditos y permiso de retirada; sin estadísticas de bendición. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Eneas · `verdia_eneas`

**Pasado:** Eneas murió con 76 años en AV 263. Fue cuidador familiar y creyó que marcharse equivalía a abandonar. En Verdia tardó décadas en admitir que también quería otra vida; sigue considerando reincarnarse sin anunciar decisión final.

**Presente y personalidad:** Es amable, hace preguntas precisas y disfruta juegos sencillos. Se irrita si lo llaman experto en almas porque conoce solo acompañamiento.

**Cambio:** Ofrece información sin vender certezas. Su arco puede terminar decidiendo esperar o prepararse, siempre por voluntad propia.

**Vínculos:** Nilo, Oriel, Yara. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_04`.

#### Lo que no vuelve idéntico · `V_verdia_eneas`

**Primeros años y lo que aprendió a querer:**

Eneas cuidó familiares durante una vida larga y recuerda años donde también hacía excursiones, discutía y se aburría. Cuando otros necesitaban ayuda, respondía con gusto; con el tiempo empezó a preparar su jornada alrededor de la posibilidad de ser llamado. Prefería sentirse necesario a decir que algún día deseaba viajar sin regreso fijado. El afecto era verdadero y no explicaba por sí solo toda la permanencia.

**Aprendizaje, decisiones y vínculos:**

Un relevo le ofreció tiempo y él lo rechazó porque sabía que otro haría cosas de modo distinto. Decía que nadie conocía cada detalle, pero también temía descubrir que podrían continuar sin él. Al morir con setenta y seis años en AV 263 eligió Verdia y cuidó de nuevo, ahora en un lugar donde permanecer no exige oficio.

**Lo que cambia y lo que todavía pesa:**

Décadas después sintió curiosidad por reincarnarse. La guardó como si fuera un anuncio de abandono a quienes aún lo visitaban. La misión permite considerar opciones sin obligarlo a decidir durante la escena. No se diseña el próximo bebé, no se garantiza una familia idéntica y el jugador no compra su paso. Eneas puede conservar afecto y desear otra vida; también puede permanecer sin que sea incapacidad de cambiar.

**Cuando no ofrece una misión:**

Disfruta paseos que no atienden una ruta de otro y preguntas sobre cosas que no vivió. Tras el arco deja conversaciones abiertas sin convertirlas en promesa de quedarse siempre. No requiere repetir un discurso de reincarnación en cada visita: puede querer hablar de una merienda.

**Ante Fuatia:**

A Fuatia le preguntaría si ser todos los elementos le permite reconocer un deseo distinto del deber que sostiene. Respeta su defensa y rechaza que el amor exija permanecer sin elección. No busca resolverla psicológicamente; comparte una experiencia que ella puede escuchar o disentir.

**Conversaciones personales:**

##### VID_verdia_eneas_1 · Antes del cambio

> **Eneas:** Cuando ofrecieron relevo, me molestó imaginar que encontrarían otra manera de hacer las cosas.
> **Nilo:** ¿Temías un mal cuidado o no hacer falta?
> **Eneas:** Las dos. Me costó nombrar la segunda sin sentirme mezquino.
> **Nilo:** Esa sensación también puede acompañarse sin decidir por ti qué vida escogerás.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_eneas_2 · Después del arco personal

> **Eneas:** Hoy dije que todavía no sé. Nadie me pidió que fijara una despedida para dejar la pregunta abierta.
> **Isadora:** ¿Quieres caminar?
> **Eneas:** Sí. Por gusto, no para representar un ensayo de partida.
> **Isadora:** Entonces escogeremos un camino que aún no conozcamos.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar opciones de permanencia y reincarnación.

> **Eneas:** No volveré siendo una copia que reconoce a todos. Si elijo irme, tiene que ser con esa verdad.

**Acto 2:** Escuchar deseos sin inferir identidades futuras.

> **Eneas:** Quedarme por miedo y quedarme por ganas se parecían por fuera. Necesitaba distinguirlo.

**Acto 3:** Preparar despedida o espacio de espera según elección de Eneas.

> **Eneas:** Hoy decidí esperar. Esta vez no lo llamo obligación.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Preparar despedida o jardín de espera.

> **Eneas · respuesta 1:** Despedida: Será ensayo; la decisión final sigue siendo mía.

> **Eneas · respuesta 2:** Jardín: No tendrá un plazo para demostrar valentía.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «Lo que no vuelve idéntico». Página de opciones de permanencia y reincarnación, sin diseñar identidad de una vida futura. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Yara · `verdia_yara`

**Pasado:** Yara murió con 33 años en AV 298. Cantaba ceremonias y aceptaba cualquier letra por miedo a dejar de ser invitada. Aprendió a negarse antes de morir y eligió un espacio donde el silencio también cuenta.

**Presente y personalidad:** Es juguetona, cambia tonos de saludo y disfruta escuchar ranas. Quiere cantar; no quiere representar toda despedida.

**Cambio:** Diseña ritos con participación voluntaria. Puede retirarse sin castigo de amistad ni bloqueo de historia.

**Vínculos:** Eneas, Sora, Lía. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_04`.

#### El canto que no llama a todos · `V_verdia_yara`

**Primeros años y lo que aprendió a querer:**

Yara cantaba porque una canción podía reunir a gente que no se atrevía a conversar. Su primer público era una casa con tareas pendientes y alguien que seguía lavando mientras la escuchaba. Le gustaba recibir atención sin que todos tuvieran que detener su vida. Cuando llegaron invitaciones pagadas, cada negativa parecía poner en riesgo la siguiente y aceptó letras que ya no sentía propias.

**Aprendizaje, decisiones y vínculos:**

Una ceremonia pedía a asistentes expresar alegría. Yara miró una persona cansada que había venido por compañía y no podía seguir el ritmo impuesto. Sabía que la letra cerraba esa dificultad y la cantó de todos modos. Antes de morir aprendió a negarse a algunos encargos sin presentar el cambio como una voz siempre valiente. Tuvo miedo y perdió ingresos.

**Lo que cambia y lo que todavía pesa:**

Murió con treinta y tres años en AV 298 y eligió un espacio de escucha. La misión pregunta quién quiere cantar, oír o retirarse. Yara reconoce que puede utilizar incluso una invitación suave para buscar aprobación. El silencio no tiene que contener una tragedia por interpretar: algunas personas solo prefieren estar tranquilas. Su oficio puede dar lugar a esa preferencia y conservar canciones alegres.

**Cuando no ofrece una misión:**

Tararea mientras pasea, cambia repertorio por gusto y disfruta juegos donde otro dirige. Tras el arco programa pausas reales, no interludios que obligan a conversar. Puede querer que aplaudan sin reclamar explicación a quien no participa.

**Ante Fuatia:**

La voz de Fuatia puede asombrar y Yara no la convertirá en aprobación automática del altar. Quiere que una persona agradecida pueda quedarse callada. A una sentencia cruel no le añadirá música que obligue a sentir reconciliación donde aún hay miedo.

**Conversaciones personales:**

##### VID_verdia_yara_1 · Antes del cambio

> **Yara:** La letra pedía alegría. Yo vi a alguien que había venido a no estar solo, no a celebrarlo todo.
> **Sora:** ¿Pudiste cambiarla?
> **Yara:** Aquella vez no. Otra sí, y perdí un encargo. No quiero que la segunda borre la primera.
> **Sora:** Podemos contar una trayectoria sin convertirla en un instante perfecto.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_yara_2 · Después del arco personal

> **Yara:** Hoy hubo una persona que escuchó y se fue antes del final. No le pedí una explicación.
> **Amaranta:** ¿También estuvo invitada a volver?
> **Yara:** Sí. No necesita aprender a asistir como yo imagino.
> **Amaranta:** Dejemos una banca donde pueda escogerse otra duración.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Solicitar canción con tema autorizado.

> **Yara:** Si alguien no canta, no significa que quiera menos a quien recuerda.

**Acto 2:** Ensayar momento y volumen.

> **Yara:** La canción más difícil fue la que tuve que negarme a cantar.

**Acto 3:** Celebrar rito breve o silencio acompañado.

> **Yara:** Hoy habrá una pausa larga. No la llenemos por costumbre.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Canto suave o ceremonia sin música.

> **Yara · respuesta 1:** Suave: Permitirá hablar sin competir con la pista.

> **Yara · respuesta 2:** Sin música: La escena conservará ambiente y subtítulos.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «El canto que no llama a todos». Recuerdo de rito con canción o silencio; mismo desbloqueo sin obligar a dar voz. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Tobías · `verdia_tobias`

**Pasado:** Tobías murió con 62 años en AV 280. Fue pescador de río y volvió observación su pasatiempo al dejar el oficio. Eligió Verdia para aprender a mirar sin llevarse todo.

**Presente y personalidad:** Es tranquilo, cuenta historias exageradas y admite la exageración al final. Quiere compartir belleza sin convertirla en captura obligatoria.

**Cambio:** Construye un registro de avistamientos, no una colección de almas o especies únicas apresadas. Puede seguir exagerando en sobremesa porque avisa que está contando un cuento; su observación de oficio conserva medidas honestas.

**Vínculos:** Cora, Celino, Tina. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_05`.

#### La colección que sigue nadando · `V_verdia_tobias`

**Primeros años y lo que aprendió a querer:**

Tobías empezó pescando para vender y durante muchos años midió una buena salida por lo que llevaba de regreso. Le gustaban el oficio y la compañía, no solamente el ingreso. Al dejar trabajo pudo seguir yendo al río y al principio sintió que una jornada sin captura desperdiciaba la experiencia acumulada. Había aprendido a valorar un lugar mediante la extracción y le costó otro tipo de visita.

**Aprendizaje, decisiones y vínculos:**

Un ave aprendió a acercarse mientras él se quedaba quieto. Tobías quiso llevar una pluma como prueba del encuentro y luego esperó la siguiente con prisa. Descubrió cómo un deseo pequeño podía reorganizar otra vez la salida alrededor de obtener algo. No fue una gran culpa, sino una ocasión de revisar la forma en que intentaba conservar cada placer.

**Lo que cambia y lo que todavía pesa:**

Murió con sesenta y dos años en AV 280 y eligió Verdia para observar sin obligación productiva. La misión compara relatos, devuelve hallazgos donde corresponde y permite un cuaderno que no se vende como propiedad del río. No condena a quienes viven de pesca; admite que su retiro tiene condiciones distintas y que una cuota justa debe escuchar necesidades reales.

**Cuando no ofrece una misión:**

Recuerda recetas y puede enseñar técnicas de observación sin dar lecciones de pureza a una pescadora viva. Tras el arco conserva dibujos malos porque la visita importa más que su capacidad de copiar. Disfruta una conversación que no le pide el secreto del río.

**Ante Fuatia:**

Fuatia puede defender agua y Tobías comparte el deseo sin confundirlo con prohibir toda captura. Se opone a altares donde un pez pequeño deba morir para demostrar respeto. Una ofrenda no necesita quitar aquello que pretende agradecer.

**Conversaciones personales:**

##### VID_verdia_tobias_1 · Antes del cambio

> **Tobías:** Dejé de trabajar y seguía buscando algo que justificara cada tarde junto al agua.
> **Nilo:** ¿Entonces una salida tranquila parecía pérdida?
> **Tobías:** Sí. Hasta quiso convertirse en tarea recoger una pluma.
> **Nilo:** Hoy podemos mirar sin fabricar un recibo de la visita.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_tobias_2 · Después del arco personal

> **Tobías:** El dibujo quedó torcido. Lo guardé porque recuerdo dónde estaba sentado.
> **Sarai:** No voy a corregirlo si no quieres.
> **Tobías:** Me gustaría que me enseñaras una cosa y después dejáramos el lápiz.
> **Sarai:** Perfecto. No toda tarde necesita terminar en un taller.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar tres sombras acuáticas.

> **Tobías:** Aquí el mejor resultado no cabe en una bolsa.

**Acto 2:** Dibujar sin capturar.

> **Tobías:** Me pasé una vida diciendo mío cuando quería decir lo vi.

**Acto 3:** Publicar registro con ubicación general y protección.

> **Tobías:** El dibujo se queda con nosotros. El pez, donde eligió nadar.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Dibujo o descripción sonora.

> **Tobías · respuesta 1:** Dibujo: No revelará refugios delicados.

> **Tobías · respuesta 2:** Sonora: Tendrá transcripción y no exigirá escuchar audio.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «La colección que sigue nadando». Álbum de avistamientos acuáticos sin captura y con ubicación general no sensible. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Celino · `verdia_celino`

**Pasado:** Celino murió con 55 años en AV 270. Construía puentes y una reparación apresurada dejó fuera a un barrio. Corrigió accesos en vida; en Verdia procura no confundir conexión con derecho de entrada.

**Presente y personalidad:** Es práctico, disfruta caminar sin destino y le gustan herramientas diminutas. Quiere unir jardines; olvida preguntar si alguien deseaba conservar distancia.

**Cambio:** Construye pasos autorizados y rutas que puedan cerrarse por acuerdo, no por capricho del constructor.

**Vínculos:** Olivia, Ada, Tobías. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_05`.

#### Un puente con permiso en ambas orillas · `V_verdia_celino`

**Primeros años y lo que aprendió a querer:**

Celino construyó puentes en una vida donde había que escoger entre rapidez y una conexión que durara. Aprendió a escuchar pasos antes de cambiar tablas y disfrutaba ver un cruce que antes obligaba a rodear. La utilidad le dio una seguridad profesional fuerte: si un puente ayudaba a muchos, parecía evidente que debía completarse pronto. Esa cuenta dejaba fuera a quien seguía sin poder entrar.

**Aprendizaje, decisiones y vínculos:**

Una reparación apresurada conservó ancho y cierre que aislaban a un barrio. El proyecto figuraba terminado porque el paso principal funcionaba. Celino mostró el buen resultado al recibir la primera queja y tardó en escuchar el acceso que faltaba. Corrigió en vida, con costo y revisión, antes de morir con cincuenta y cinco años en AV 270.

**Lo que cambia y lo que todavía pesa:**

En Verdia quiso conectar todos los jardines y descubrió que alguna comunidad prefería una visita anunciada. La misión distingue acceso seguro de derecho a entrar sin permiso. Celino puede ofrecer puente y dejar un límite respetuoso sin declararlo fracaso. Tampoco usa privacidad como excusa para conservar un trayecto físicamente excluyente.

**Cuando no ofrece una misión:**

Diseña juguetes de equilibrio y disfruta caminar por un paso que otro construyó. Tras el arco pide conocer usos y consentimiento antes de dibujar conexión. No tiene que verificar cada puente que cruza para demostrar experiencia.

**Ante Fuatia:**

A Fuatia le preocupa extracción y Celino le muestra qué desplazamiento evita una obra. Puede aceptar menos material sin admitir que cualquier conexión humana sea lesión injustificable. La diosa tendrá que distinguir un paso compartido de un acceso construido para apropiarse de un jardín.

**Conversaciones personales:**

##### VID_verdia_celino_1 · Antes del cambio

> **Celino:** En el informe decía conectado. El barrio seguía esperando una entrada que pudiera usar.
> **Aina:** La palabra cabía porque nadie de allí la había revisado.
> **Celino:** Después en Verdia hice lo contrario: quería abrir puertas que nadie me había pedido.
> **Aina:** Acceder y entrar todavía necesitan preguntas diferentes.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_celino_2 · Después del arco personal

> **Celino:** Dejé un aviso para solicitar visita. El puente sigue siendo accesible cuando está acordada.
> **Isadora:** ¿Te molesta no poder cruzar ahora?
> **Celino:** Un poco. No voy a llamar injusticia a toda preferencia que no coincida con mi paseo.
> **Isadora:** Tenemos otro camino para esta tarde. Puedes escogerlo sin reformar el anterior.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Preguntar a residentes de dos jardines.

> **Celino:** Un puente no hace amistades por sí solo. A veces solo facilita que una persona invada otra.

**Acto 2:** Probar paso con materiales de visita autorizados.

> **Celino:** Las dos orillas tienen que quererlo. Debí preguntar antes de dibujar.

**Acto 3:** Registrar cuidado y derecho a cerrar por riesgo.

> **Celino:** Dejaremos una ruta alternativa. Nadie estará obligado a cruzar para volver a casa.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Puente bajo o sendero largo.

> **Celino · respuesta 1:** Bajo: Será accesible con barandas claras.

> **Celino · respuesta 2:** Largo: Conservará sombra y puntos de descanso.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «Un puente con permiso en ambas orillas». Visita por puente o sendero autorizado, con salida alternativa y mantenimiento; no invade otro jardín. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Aina · `verdia_aina`

**Pasado:** Aina murió con 84 años en AV 295. Reparaba objetos baratos y vio cómo museos preferían símbolos de gobernantes. Eligió conservar cucharas, botones y notas cuyo valor solo conoce quien los usó.

**Presente y personalidad:** Es curiosa, ríe con facilidad y se enfada si llaman humilde a todo lo suyo. Quiere proteger recuerdos sin decidir cuáles merecen seguir.

**Cambio:** Solicita consentimiento y devuelve objetos cuando se pide. Ningún hallazgo privado se convierte automáticamente en trofeo público.

**Vínculos:** Amaranta, Berenice, Damián. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_06`.

#### El botón que no es un tesoro · `V_verdia_aina`

**Primeros años y lo que aprendió a querer:**

Aina reparaba objetos baratos porque conocía hogares donde comprar de nuevo no era una opción. Le gustaba que una cuchara continuara junto a la misma mano. Un museo pidió piezas de un gobernante y dejó fuera reparaciones domésticas que parecían no representar una época. Ella conservó algunas, primero por enojo, después por curiosidad sobre vidas que nadie estaba preguntando.

**Aprendizaje, decisiones y vínculos:**

También llegó a pensar que toda cosa usada debía salvarse. Una propietaria le pidió desprenderse de un objeto y Aina lo guardó porque consideraba que con el tiempo agradecería haberlo recuperado. Aprendió que memoria valiosa para una restauradora puede ser una carga para quien la vivió. El cuidado no da derecho a retirar una decisión de otro.

**Lo que cambia y lo que todavía pesa:**

Murió con ochenta y cuatro años en AV 295 y eligió objetos cotidianos en Verdia. La misión conserva procedencia y permiso sin convertir la exposición en identidad obligatoria. Puede reparar una pieza y reconocer que alguien prefiera no mostrarla. No determina qué persona fue importante por el valor comercial de lo que dejó.

**Cuando no ofrece una misión:**

Colecciona botones que sí le regalaron y juega a adivinar usos de objetos nuevos. Tras el arco una ficha puede decir uso privado sin invitar al jugador a descubrirlo. Le gusta un objeto que no necesita historia para acompañar la mesa de hoy.

**Ante Fuatia:**

Los altares de Fuatia suelen privilegiar ofrendas llamativas. Aina mostraría una herramienta gastada que protegió un canal durante años y pediría no identificar a su dueño sin permiso. Un premio divino puede reconocer trabajo poco visible sin convertirlo en espectáculo.

**Conversaciones personales:**

##### VID_verdia_aina_1 · Antes del cambio

> **Aina:** Guardé un objeto que querían dejar. Pensé que la memoria me autorizaba a saber mejor cuánto dolía.
> **Berenice:** A mí me pasó con una carta. La buena intención no vuelve nuestra una elección ajena.
> **Aina:** Hoy pregunto antes de reparar para exposición.
> **Berenice:** Y una respuesta privada también puede cerrar correctamente la ficha.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_aina_2 · Después del arco personal

> **Aina:** Esta cuchara no va al museo. Me la dieron para usarla.
> **Lucio:** Entonces empezará con un té bastante corriente.
> **Aina:** Me gusta. No necesita representar a quien la fabricó cada vez que alguien la toca.
> **Lucio:** Tenemos una mesa donde pueden pasar cosas pequeñas.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar procedencia de objeto.

> **Aina:** No sé cuánto vale. Sé quién puede decidir si quiere compartirlo.

**Acto 2:** Escuchar relato permitido por dueño.

> **Aina:** Un museo puede robar sin llevarse nada: basta con contar la vida de alguien sin permiso.

**Acto 3:** Crear ficha privada o devolver pieza.

> **Aina:** La ficha tendrá una puerta cerrada para lo que no nos corresponde.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Ficha privada o devolución.

> **Aina · respuesta 1:** Privada: Solo guardará el texto autorizado.

> **Aina · respuesta 2:** Devolución: El catálogo anotará entrega sin reproducir intimidad.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El botón que no es un tesoro». Ficha privada de objeto o registro de devolución, sin transformar intimidad en trofeo público. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Dimas · `verdia_dimas`

**Pasado:** Dimas murió con 49 años en AV 304. Trabajó en un banco de semillas y ocultó lotes fallidos para conservar prestigio. Lo corrigió en vida; en Verdia estudia germinación como proceso, no prueba de bondad.

**Presente y personalidad:** Es afable, hace dibujos de brotes y teme que una Santa le pida milagros. Quiere enseñar sin producir para pagar su permanencia.

**Cambio:** Ofrece estudios consentidos y explica límites. Una semilla sagrada no compra absolución ni altera estadísticas por fe.

**Vínculos:** Eliana, Nazario, Inés. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `rosal_eterno_vivienda_06`.

#### El lote que también enseñó · `V_verdia_dimas`

**Primeros años y lo que aprendió a querer:**

Dimas trabajó en banco de semillas cuando aún podía recordar cada proveedor por una visita. Le gustaba distinguir procedencias que compradores agrupaban como si fueran lo mismo. Una colección bien registrada le permitió conservar trabajo y recibir pedidos estables. Con el tiempo, una ficha de fallo parecía una amenaza a todo el esfuerzo compartido que quería defender.

**Aprendizaje, decisiones y vínculos:**

Ocultó lotes fallidos para no perder confianza en la institución. Pensó que una reposición rápida impediría daño y no haría falta explicar qué se había retirado. Algunas familias ya habían sembrado. Corrigió la omisión en vida y participó en compensación antes de morir con cuarenta y nueve años en AV 304. Una buena intención no hizo germinar lo que habían comprado.

**Lo que cambia y lo que todavía pesa:**

Eligió Verdia y empezó a estudiar crecimiento como proceso. Todavía se irritaba con registros de resultados nulos hasta que Amaranta señaló que buscaba defender la colección una vez más. La misión distingue muestra y promesa, anota lo que no brota y permite consultar sin comprar un premio espiritual. Ninguna alma demuestra bondad mediante cosecha perfecta.

**Cuando no ofrece una misión:**

Disfruta ordenar frascos por formas además de especies y conserva una semilla que no pretende plantar. Tras el arco invita a comparar un fallo sin preparar un discurso de disculpa. Puede sentir decepción por un lote y seguir ofreciendo información útil.

**Ante Fuatia:**

Fuatia protege suelo y Dimas no le atribuye castigo a un resultado negativo. Quiere que altares agradezcan trabajo sin prometer germinación. Si una bendición se publicita como garantía, pedirá condiciones y rectificación igual que a un banco de semillas humano.

**Conversaciones personales:**

##### VID_verdia_dimas_1 · Antes del cambio

> **Dimas:** Reponer parecía más fácil que decir por qué. La gente ya había gastado una temporada.
> **Amaranta:** El tiempo también estaba dentro de lo que vendías como garantía.
> **Dimas:** Me costó entender que un fallo registrado podía ayudar más que otra promesa buena.
> **Amaranta:** Aquí podemos mirar un surco sin obligarlo a defender tu colección.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_verdia_dimas_2 · Después del arco personal

> **Dimas:** Hoy anoté no germinó y dejé la ficha abierta para comparar causas.
> **Tobías:** ¿Quieres que la revisemos ahora?
> **Dimas:** Después. Primero quiero pasear sin medir un crecimiento que quizá no llegue hoy.
> **Tobías:** Yo conozco un lugar donde también podemos mirar sin llevarnos nada.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar registros de viabilidad.

> **Dimas:** Esta semilla no nació mejor por estar aquí. La guardamos mejor y anotamos lo que ocurrió.

**Acto 2:** Preparar muestra de estudio autorizada.

> **Dimas:** Eliana me pidió una guía, no un milagro. Me costó creerle.

**Acto 3:** Entregar guía y señalar límites de uso.

> **Dimas:** También van los lotes que fallaron. Si no, enseñaría solo la mitad.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Registro completo o muestra guiada.

> **Dimas · respuesta 1:** Completo: Habrá causas conocidas y desconocidas.

> **Dimas · respuesta 2:** Muestra: No concederá producción gratuita para la granja.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El lote que también enseñó». Cuaderno de viabilidad de semillas con lotes fallidos; no otorga semillas comerciales por lectura. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## jardines_eco

### Sora · `eco_sora`

**Pasado:** Sora murió con 44 años en AV 286. Cantó con la compañera de Anselmo y conserva partituras anteriores al contrato comercial. Eligió quedarse como cuidadora de un coro, luego descubrió que muchos preferían escuchar.

**Presente y personalidad:** Es alegre, inventa juegos rítmicos y teme que el coro se disuelva si permite faltas.

**Cambio:** Transforma obligación en invitación y autoriza una versión para Lía sin ceder toda su historia.

**Vínculos:** Anselmo, Lía, Yara. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `jardines_eco_vivienda_01`.

#### El coro que admite una silla vacía · `V_eco_sora`

**Primeros años y lo que aprendió a querer:**

Sora aprendió canto de oído en una casa donde trabajar y escuchar podían ocurrir al mismo tiempo. Cantó con la compañera de Anselmo y recuerda ensayos alegres, desacuerdos y versiones que no buscaban un contrato. Enseñó a Lía en vida mediante repeticiones pequeñas, antes de morir con cuarenta y cuatro años en AV 286. La enseñanza fue afecto cotidiano, no una aparición póstuma que la eligiera.

**Aprendizaje, decisiones y vínculos:**

Conservó partituras anteriores a la cesión comercial y esperaba devolverlas sin usarlas para corregir el gusto de Anselmo. También se aferró a una versión porque le recordaba una tarde que los demás no conservaban igual. Tener una fuente valiosa no le da derecho a escoger qué emoción debe acompañar su recuperación.

**Lo que cambia y lo que todavía pesa:**

En Verdia organizó un coro y confundió estar invitado con querer cantar. Algunas personas preferían escuchar y ella proponía roles menores en vez de aceptar silencio. La misión abre participación y pausas, preserva procedencia de partituras y permite varias versiones. No fija cuál relación musical representa mejor a una persona fallecida.

**Cuando no ofrece una misión:**

Tararea melodías incompletas, juega con rimas malas y puede disfrutar una canción nueva sin compararla con la anterior. Tras el arco deja lugares para audiencia sin transformar cada visitante en potencial intérprete. Lía puede recordarla sin repetir su estilo.

**Ante Fuatia:**

Fuatia tiene una voz elemental que no obliga a todo oyente a responder con oración. Sora defenderá el derecho a escuchar sin adherirse. Un coro puede agradecer cuidado y conservar una estrofa crítica sin volverse traidor a la diosa.

**Conversaciones personales:**

##### VID_eco_sora_1 · Antes del cambio

> **Sora:** La partitura me devuelve aquella tarde. A Anselmo quizá le devuelva otra cosa.
> **Yara:** ¿Puedes entregarla sin pedirle que sienta lo que tú conservaste?
> **Sora:** Sí, aunque me cuesta. A veces proteger una versión parece proteger a quienes la cantaron.
> **Yara:** También podemos proteger que recuerden distinto.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_eco_sora_2 · Después del arco personal

> **Sora:** Hoy vinieron a oír. No preparé un turno para hacerlos cantar de todos modos.
> **Oriel:** ¿Te sentiste rechazada?
> **Sora:** Un poco al principio. Después oí el coro sin estar pensando quién faltaba dentro de él.
> **Oriel:** Suena a una función donde una invitación pudo seguir siendo invitación.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar créditos de partitura.

> **Sora:** Un coro sin permiso puede sonar afinado y seguir haciendo daño.

**Acto 2:** Ensayar con participantes voluntarios.

> **Sora:** Anselmo no necesita que yo vuelva a su canción. Necesita saber que la suya no desapareció.

**Acto 3:** Ofrecer versión escuchable y descanso de cantantes.

> **Sora:** Hoy algunas voces escucharán. También son parte de la reunión.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Ensayo abierto o grabación autorizada.

> **Sora · respuesta 1:** Abierto: Se podrá salir sin explicación.

> **Sora · respuesta 2:** Grabación: Solo incluirá a quienes consientan y tendrá versión escrita.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «El coro que admite una silla vacía». Partitura autorizada o recuerdo del ensayo con versión escrita y permisos separados de grabación. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Esteban · `eco_esteban`

**Pasado:** Esteban murió con 71 años antes de AV 0. Era cronista de un panteón destruido y sobrevivió a su primera evacuación; ordenaba testimonios para darles elegancia; una narradora le mostró cómo sus resúmenes habían cambiado decisiones. Eligió conservar versiones completas en Verdia.

**Presente y personalidad:** Es paciente, disfruta historias contradictorias y tiene un humor seco. No considera que morir le dé acceso a toda verdad.

**Cambio:** Ayuda a Damián a corregir sin humillarlo y mantiene consentimiento de Isadora. Permite que el copista corrija también una frase suya. La edad y la muerte no lo sitúan fuera de la revisión.

**Vínculos:** Damián, Benicio, Isadora. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `jardines_eco_vivienda_01`.

#### El margen donde cabía otra voz · `V_eco_esteban`

**Primeros años y lo que aprendió a querer:**

Esteban trabajó como cronista en un plano destruido antes de AV 0. Había empezado con mercados, cambios de oficio y relatos de celebraciones, no con la obligación de explicar una catástrofe. Le gustaba una frase elegante capaz de unir dos voces. Esa preferencia se volvió peligrosa cuando la unión ocultaba decisiones distintas que una comunidad necesitaba conocer.

**Aprendizaje, decisiones y vínculos:**

Sobrevivió a una primera evacuación y quiso dar un informe que permitiera actuar pronto. Resumió testimonios eliminando discrepancias y una narradora mostró cómo la omisión cambiaba lo que parecía seguro. Él podía citarla correctamente en una línea y haber transformado el sentido del conjunto. La crítica le dolió porque había trabajado de verdad para ayudar.

**Lo que cambia y lo que todavía pesa:**

Murió con setenta y un años antes del Velo y eligió versiones completas en Verdia. Sigue siglos después, sin ser mortal testigo de eventos posteriores. La misión con Isadora conserva diferencias de puente y ruta sin obligar a que una memoria se borre. Su archivo admite fuente y duda; el jugador no gana derecho a recuerdos privados por necesitar una respuesta para campaña.

**Cuando no ofrece una misión:**

Escribe cuentos inventados aparte del archivo para no cobrar a los testimonios toda su ambición literaria. Tras el arco pregunta antes de resumir y ofrece acceso a la versión autorizada completa. Puede conversar de una comida del plano perdido sin introducir siempre a Nath en la primera frase.

**Ante Fuatia:**

El nacimiento de Fuatia llega por registros posteriores, no por experiencia propia. Esteban distingue hechos y recepción: blancos precisos, protegidos vivos y opiniones diversas. Le incomoda que una deidad reclame como única historia el reconocimiento que desea obtener de quienes la vieron.

**Conversaciones personales:**

##### VID_eco_esteban_1 · Antes del cambio

> **Esteban:** Uní dos voces y la frase quedó mejor. El camino que parecía seguro ya no era el mismo.
> **Isadora:** Yo necesitaba que la duda sobreviviera a tu buena escritura.
> **Esteban:** No quiero dejar de escribir bien.
> **Isadora:** Entonces escribe también dónde se separan las voces, sin llamar defecto a esa parte.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_eco_esteban_2 · Después del arco personal

> **Esteban:** Hoy guardé un relato entero y preparé el resumen con permiso.
> **Berenice:** ¿Te gustó cómo quedó?
> **Esteban:** Sí. También dejé una diferencia que me incomoda porque no sé resolverla.
> **Berenice:** Puede quedarse ahí. No todo archivo necesita terminar como un cuento.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar relato y resumen.

> **Esteban:** Tu resumen está bien escrito. Esa no es la misma pregunta que si es fiel.

**Acto 2:** Señalar cambios de significado.

> **Esteban:** Yo hice lo mismo. No lo cuento para absolverte; lo cuento para que podamos corregirlo.

**Acto 3:** Autorizar ficha con dos versiones y contexto.

> **Esteban:** Conserva el margen. Alguien todavía puede necesitar escribir allí.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Versiones paralelas o notas críticas.

> **Esteban · respuesta 1:** Paralelas: No tendrán jerarquía de prestigio.

> **Esteban · respuesta 2:** Notas: No interrumpirán la voz original.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El margen donde cabía otra voz». Comparador de relato y resumen con notas críticas que no interrumpen la voz original. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Violeta · `eco_violeta`

**Pasado:** Violeta murió con 58 años en AV 278. Restauró suelos dañados y borró señales del desastre para tranquilizar visitantes. Después entendió que una comunidad necesitaba recordar dónde había riesgo.

**Presente y personalidad:** Es firme, adora flores torcidas y evita llamarse sanadora. Quiere recuperar vida sin imponer olvido.

**Cambio:** Enseña purificación con memoria y vincula el manuscrito del unicornio a cuidado medible. Deja que Elio elija cómo enseñar la pradera; su experiencia orienta sin convertir a los vivos en aprendices perpetuos.

**Vínculos:** Elio, Amaranta, Ada. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `jardines_eco_vivienda_02`.

#### La cicatriz fértil · `V_eco_violeta`

**Primeros años y lo que aprendió a querer:**

Violeta restauraba suelos y disfrutaba el primer brote de un lugar que otros habían dejado de visitar. Su oficio exigía meses sin resultado vistoso y aprendió a alegrarse de cambios pequeños. Cuando llegaron visitantes para una recuperación, quiso que se llevaran esperanza. Retiró marcas de un desastre pensando que así podrían mirar hacia delante sin continuar asustados.

**Aprendizaje, decisiones y vínculos:**

Las señales también indicaban dónde aún había riesgo. Una familia pidió mostrar a un niño hasta dónde llegó el daño y encontró un paisaje que ya no permitía explicarlo. Violeta oyó la petición como deseo de mantener miedo. Tardó en aceptar que borrar una cicatriz podía retirar una herramienta de cuidado, no solo una imagen triste.

**Lo que cambia y lo que todavía pesa:**

Murió con cincuenta y ocho años en AV 278 y eligió jardines del Eco. La misión recupera memoria sin recrear peligro ni obligar a cada visitante a escuchar el desastre. Puede restaurar belleza y dejar señal legible. Ninguna de las dos cosas requiere transformar el lugar en museo obligatorio.

**Cuando no ofrece una misión:**

Planta por gusto una especie que no es prueba de recuperación y disfruta el paseo de alguien que solo quiere sombra. Tras el arco consulta antes de retirar una marca. Puede cambiar un sendero sin decidir qué recuerdos deben dejar de pesar.

**Ante Fuatia:**

Fuatia siente una herida aunque se vuelva invisible para humanos. Violeta agradece esa presencia y le pide que no obligue a mirar siempre la ofensa. Recuperar suelo puede incluir memoria, vida nueva y momentos donde un visitante no tenga que aprender una lección.

**Conversaciones personales:**

##### VID_eco_violeta_1 · Antes del cambio

> **Violeta:** Hice que el lugar pareciera no haber sufrido. Me gustó cuando dijeron que todo estaba olvidado.
> **Esteban:** ¿Quién había decidido olvidarlo?
> **Violeta:** Nadie. Yo había supuesto que una vista tranquila les devolvería seguridad.
> **Esteban:** Dejemos una señal para que puedan escoger qué aprender al pasar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_eco_violeta_2 · Después del arco personal

> **Violeta:** La marca queda, y el sendero nuevo puede recorrerse sin entrar a la exposición.
> **Tobías:** Hoy solo quiero sombra.
> **Violeta:** Está bien. No voy a contarte el desastre como precio de sentarte.
> **Tobías:** Entonces volveré con ganas de escuchar otro día, no por deber lo que vi hoy.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Leer registro de terreno dañado.

> **Violeta:** Purificar no significa fingir que esta tierra nunca sufrió.

**Acto 2:** Preparar restauración autorizada.

> **Violeta:** El unicornio dejó una marca. Yo era la que quería borrarla para la visita.

**Acto 3:** Señalar cicatriz y observar diversidad posterior.

> **Violeta:** La vida volvió alrededor, no encima de una mentira.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Señal discreta o jardín de memoria.

> **Violeta · respuesta 1:** Discreta: Seguirá indicando riesgo de suelo.

> **Violeta · respuesta 2:** Jardín: Requerirá permiso de quienes vivieron la pérdida.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La cicatriz fértil». Ficha de restauración que conserva cicatriz y riesgo de suelo, sin elevar rareza de criaturas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Nazario · `eco_nazario`

**Pasado:** Nazario murió con 66 años en AV 309. Guardó propaganda de la Custodia porque una de sus frases lo había consolado. Nunca sirvió a Nath; la vergüenza de haber creído una promesa le impidió enseñar el libro para estudiarlo.

**Presente y personalidad:** Es amable, debate fechas de siembra y se enfada si alguien confunde duda con complicidad.

**Cambio:** Entrega contexto y permite análisis sin acusar a todo lector. La evidencia es una publicación, no una confesión criminal inexistente.

**Vínculos:** Dimas, Eliana, Íñigo. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `jardines_eco_vivienda_02`.

#### La frase que casi creí · `V_eco_nazario`

**Primeros años y lo que aprendió a querer:**

Nazario leía para encontrar palabras de sentimientos que no sabía explicar. Una frase de la Custodia parecía reconocer cansancio sin pedir otra prueba de fortaleza. Le alivió cuando ya era mayor y atravesaba jornadas difíciles. No sirvió a Nath ni sabía todo el mecanismo del refugio. Haber recibido consuelo no lo vuelve agente secreto ni ingenuo carente de una vida anterior.

**Aprendizaje, decisiones y vínculos:**

Al conocer contratos de obediencia guardó el libro por vergüenza. Temía que otros consideraran sospechoso cuánto le había gustado una promesa. Podía afirmar que no creía, pero evitaba explicar qué necesidad real había aprovechado la propaganda. Esa ocultación impedía estudiar por qué la oferta resultaba convincente.

**Lo que cambia y lo que todavía pesa:**

Murió con sesenta y seis años en AV 309 y eligió Verdia. La misión registra texto y contexto sin convertir su intimidad en exposición pública. Puede mostrar el libro y reservar detalles propios. Entender una captación no exige ridiculizar a quien buscó alivio ni declarar inocente a quien impuso obediencia.

**Cuando no ofrece una misión:**

Lee comedias que no necesita analizar y sigue encontrando frases bellas en obras imperfectas. Tras el arco separa consuelo personal de recomendación institucional. Puede discutir un mensaje de secta sin convertirse en guía automático de todos los testimonios del archivo.

**Ante Fuatia:**

Fuatia nace de resentimiento y Nazario comprende lo fácil que resulta escuchar una promesa que ya coincide con una herida. Quiere preguntar qué costo tiene un favor sin avergonzarse de desearlo. La deidad no reemplaza a la Custodia como consuelo que deba aceptarse entero.

**Conversaciones personales:**

##### VID_eco_nazario_1 · Antes del cambio

> **Nazario:** Esa frase me consoló. Cuando supe lo otro pensé que decirlo me haría parecer cómplice.
> **Oriel:** Puedes mostrar cómo funcionaba sin entregar todos tus días difíciles.
> **Nazario:** Quiero que se estudie sin que alguien se ría de la necesidad que la hizo útil.
> **Oriel:** Esa necesidad no era la cláusula que después querían imponer.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_eco_nazario_2 · Después del arco personal

> **Nazario:** Hoy presté el libro y elegí qué nota personal no saldría en la ficha.
> **Esteban:** La fuente sigue siendo legible. No perdimos nada que el estudio necesitara.
> **Nazario:** Me alegra. Ahora quiero leer una historia graciosa que no me explique qué debo creer.
> **Esteban:** Tengo dos. Dejaré que escojas sin escribir una recomendación solemne.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Pedir autorización de consulta.

> **Nazario:** Decía que nadie volvería a sentirse solo. Yo también quería creer eso.

**Acto 2:** Comparar promesa con cláusulas de obediencia.

> **Nazario:** Leerlo no me hizo culpable de sus crímenes. Guardarlo escondido sí dejó a otros sin esta advertencia.

**Acto 3:** Archivar propaganda como evidencia sin difundir reclutamiento.

> **Nazario:** La ficha explicará cómo prometían ayuda y dónde quitaban la salida.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Lectura crítica o copia restringida.

> **Nazario · respuesta 1:** Crítica: No repetirá consignas como canción atractiva.

> **Nazario · respuesta 2:** Restringida: El resumen público conservará la advertencia útil.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La frase que casi creí». Guía crítica de contratos de secta, consultable sin difundir propaganda como premio. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Basilia · `eco_basilia`

**Pasado:** Basilia murió con 79 años en AV 300. Fabricó velas para despedidas y comenzó a medir cariño por tamaño de ofrenda. Una familia pobre le explicó por qué dejaba de asistir.

**Presente y personalidad:** Es cariñosa, aprecia aromas sencillos y se avergüenza de su antiguo catálogo. Quiere que nadie pague por pertenecer.

**Cambio:** Diseña ceremonias con opciones gratuitas y producción modesta; no juzga fe por inventario. Conserva el gusto por hacer una vela hermosa. Lo que abandona es la idea de que su belleza deba ordenar el cariño de otros.

**Vínculos:** Serena, Amaranta, Renata. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `jardines_eco_vivienda_03`.

#### La ofrenda que puede ser nada · `V_eco_basilia`

**Primeros años y lo que aprendió a querer:**

Basilia fabricó velas durante una vida larga y empezó vendiendo lo que hogares podían pagar. Le gustaba que una luz pequeña acompañara una mesa igual que una grande. Los encargos ceremoniales ofrecieron mejores ingresos y programas que distinguían tamaño de ofrenda. Al principio anotaba precios; después empezó a leer cariño en una cantidad de cera que también medía dinero disponible.

**Aprendizaje, decisiones y vínculos:**

Una familia pobre dejó de asistir y le explicó que no quería exhibir una ofrenda considerada insuficiente. Basilia ofreció descuento, pensando que el problema era únicamente precio. La familia quería que nadie les exigiera demostrar afecto comprando. Aceptar eso cuestionaba parte del negocio y una reputación de cuidadora de ceremonias que había disfrutado.

**Lo que cambia y lo que todavía pesa:**

Murió con setenta y nueve años en AV 300 y eligió espacios de luz en Verdia. La misión separa presencia, tributo y consentimiento. Puede enseñar oficio y no vender una jerarquía de recuerdos. La ausencia de vela no indica falta de amor; un altar sin objeto también puede estar completo para quien lo visita.

**Cuando no ofrece una misión:**

Hace velas de formas absurdas para sí misma y se divierte cuando alumbran peor por ser tan ambiciosas. Tras el arco ofrece una opción sencilla sin llamarla versión para quienes no pueden. Su historia no exige abandonar belleza o comercio, sino quitarles una medida moral falsa.

**Ante Fuatia:**

En altares de Fuatia le preocupa que cuatro elementos terminen convertidos en cuatro compras obligatorias. Defenderá agradecimiento con agua disponible, un gesto de mantenimiento o ninguna cosa material. La diosa puede recibir cariño sin premiar la ofrenda que más gastó.

**Conversaciones personales:**

##### VID_eco_basilia_1 · Antes del cambio

> **Basilia:** Ofrecí descuento. Creí que así respondía a lo que la familia me había dicho.
> **Amaranta:** Querían asistir sin que la vela los clasificara.
> **Basilia:** Tenía que cambiar una costumbre que también me daba ingresos.
> **Amaranta:** Puedes decir que costó. No vuelve menos importante escucharla.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_eco_basilia_2 · Después del arco personal

> **Basilia:** Hoy no trajeron nada y dejé el sitio igual de abierto.
> **Yara:** ¿Cantaremos allí?
> **Basilia:** Si quieren. También puede servir para sentarnos a no organizar una despedida.
> **Yara:** Me gustaría una luz que no venga con un programa entero.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar costos de rito.

> **Basilia:** La vela no es una medida del amor. Yo la vendía como si lo fuera.

**Acto 2:** Preparar vela o símbolo sin consumo obligatorio.

> **Basilia:** No necesitaban una ofrenda más barata. Necesitaban que no hubiera una entrada que pagar.

**Acto 3:** Publicar opciones con silencio y ausencia válidos.

> **Basilia:** Habrá luz. También se podrá recordar con las manos vacías.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Vela compartida o gesto sin objeto.

> **Basilia · respuesta 1:** Compartida: No dará bendición mayor por aportar más.

> **Basilia · respuesta 2:** Gesto: Tendrá el mismo cierre narrativo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «La ofrenda que puede ser nada». Recuerdo ceremonial con ofrenda compartida o manos vacías y misma utilidad. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Oriel · `eco_oriel`

**Pasado:** Oriel murió con 39 años en AV 297. Mediaba amistades y escribía acuerdos; llegó a forzar una reconciliación pública que sus amigos no querían. Eligió estudiar límites, no unir a toda persona con otra.

**Presente y personalidad:** Es sociable, disfruta juegos cooperativos y pregunta demasiadas veces si todos están bien. Desea una tarde donde sus amigos no necesiten que medie nada. A veces pregunta si están bien porque él no sabe cómo dejar de intervenir.

**Cambio:** Acompaña vínculos sin dirigirlos. El Lazo de los protagonistas no vuelve obligación toda relación del mundo.

**Vínculos:** Eneas, Lía, Renata. **Naturaleza:** cuidador_de_verdia. **Hogar planificado:** `jardines_eco_vivienda_03`.

#### El permiso de no contar · `V_eco_oriel`

**Primeros años y lo que aprendió a querer:**

Oriel empezó mediando porque sabía escuchar versiones que otros querían decidir enseguida. Disfrutaba cuando una conversación difícil terminaba en un acuerdo pequeño y concreto. La gratitud le dio fama y la fama le ofreció una expectativa incómoda: si había dos personas enfadadas, parecía que su oficio debía dejarlas juntas al final de la tarde.

**Aprendizaje, decisiones y vínculos:**

Forzó una reconciliación pública entre amistades que habían pedido tiempo. Preparó palabras amables y un gesto visible sin confirmar que quisieran compartirlo. Nadie protestó frente al público; el silencio pareció éxito. Después dejaron de acudir a Oriel y ella entendió primero que no apreciaban su esfuerzo. Le costó reconocer que el esfuerzo también podía haberles quitado elección.

**Lo que cambia y lo que todavía pesa:**

Murió con treinta y nueve años en AV 297 y eligió estudiar límites en Verdia. La misión permite acuerdos de distancia, no solo volver a tratarse. En S01 respeta relación privada de Lía y Renata sin convertir permiso de escuchar en autorización de difundir. No gana una historia mejor si obliga a personajes a revelar más.

**Cuando no ofrece una misión:**

Tiene gusto por juegos donde no negocia y disfruta que otra persona resuelva un desacuerdo sin invitarla. Tras el arco pregunta si se desea mediación antes de ofrecer un método. Puede retirarse sin tratarlo como fracaso de utilidad.

**Ante Fuatia:**

Quiere que Fuatia pueda negociar sin prometer amistad y terminar una sentencia sin imponer gratitud. Una neutralidad interesada puede ser explícita; no necesita disfrazarse de afecto. Oriel defenderá que cumplir una reparación permita seguir discrepando de quien la exigió.

**Conversaciones personales:**

##### VID_eco_oriel_1 · Antes del cambio

> **Oriel:** Preparé el abrazo antes de preguntar si querían volver a acercarse.
> **Sora:** Nadie dijo que no frente al público.
> **Oriel:** Usé ese silencio como firma. Luego me dolió que no quisieran volver a verme.
> **Sora:** Puedes ofrecer distancia ahora, sin convertirla en otro gesto que deban aplaudir.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_eco_oriel_2 · Después del arco personal

> **Oriel:** Acordaron no hablarse durante un tiempo y dejé el documento abierto a revisión.
> **Nazario:** ¿Eso cuenta como una mediación terminada?
> **Oriel:** Sí. No necesito decidir que juntos sería una versión más bonita.
> **Nazario:** Entonces sentémonos. Hoy no traigo ningún conflicto para que te hagas imprescindible.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Escuchar versiones por separado.

> **Oriel:** Una relación no le debe una escena bonita a quien la mira desde fuera.

**Acto 2:** Preguntar qué puede compartirse.

> **Oriel:** Lía y Renata pueden quererse sin volverlo asunto del jardín.

**Acto 3:** Ofrecer encuentro o cierre privado sin penalización.

> **Oriel:** Lo que no se contó seguirá siendo de ellas. Esa también es una decisión completa.

**Acceso narrativo:** después de `P12` y visita autorizada. **Decisión antes del acto 3:** Encuentro autorizado o acuerdos separados.

> **Oriel · respuesta 1:** Encuentro: Ambas podrán cancelar antes de comenzar.

> **Oriel · respuesta 2:** Separados: No transmitiré confidencias entre conversaciones.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El permiso de no contar». Guía de consentimiento en encuentros: información compartible, límites y retiro de permiso. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## travesia

### Iria · `senda_iria`

**Pasado:** Iria, 45, acompañó visitantes antes de entrar al servicio de Senda. Una persona la obedeció por miedo a decepcionarla; Iria confundió cumplimiento con elección. Está viva y vuelve al Santuario en sus días de descanso.

**Presente y personalidad:** Es tranquila, disfruta paseos sin propósito y tiene manos siempre manchadas de tinta. Quiere ayudar; termina frases ajenas demasiado pronto.

**Cambio:** Aprende a sostener negativas y aplazamientos. No puede hacer una prueba por Ofelia ni cobrar acceso a reparación.

**Vínculos:** Nilo, Ofelia, Pablo. **Naturaleza:** persona_viva. **Hogar planificado:** `travesia_vivienda_01`.

#### El paso que no doy por ti · `V_senda_iria`

**Primeros años y lo que aprendió a querer:**

Iria aprendió acompañamiento recibiendo a personas que llegaban a un pueblo sin conocer costumbres. Le gustaba explicar sin hacer sentir torpe a quien preguntaba. En una primera jornada alguien repitió sus instrucciones con alivio y ella sintió que ayudar podía ser una forma de pertenecer. Más tarde empezó a preparar respuestas antes de que formularan dudas, para conservar aquella sensación de utilidad.

**Aprendizaje, decisiones y vínculos:**

Una persona siguió su plan por miedo a decepcionarla. Iria preguntó si estaba bien y oyó una respuesta rápida como confirmación. Descubrir el motivo le dolió porque nunca había amenazado. Le costó entender que gratitud y autoridad podían ejercer presión sin una orden explícita. Su tono amable no volvía libre cualquier decisión que ocurría cerca de ella.

**Lo que cambia y lo que todavía pesa:**

Aceptó servicio vivo autorizado en Senda y vuelve al Santuario durante descanso. La misión permite aplazar, negar y buscar una prueba archivada equivalente para que campaña continúe sin forzar almas. Iria puede quedarse disponible sin organizar cada reparación ajena. Aprender a aceptar un no no la convierte en acompañante indiferente ni retira permisos reales del plano.

**Cuando no ofrece una misión:**

Le gustan excursiones cortas en días libres y comidas donde nadie requiere orientación. Tras el arco deja una pausa completa después de preguntar, sin llenarla enseguida con una opción más fácil. Puede disfrutar ser buscada y reconocer cuándo necesita descanso.

**Ante Fuatia:**

Con Fuatia hablaría de ayuda que se vuelve deuda. La protección elemental puede ser deseada sin aceptar toda sentencia futura. Iria defenderá una negativa a un altar incluso si la diosa se siente poco agradecida; cuidar no tiene que convertir a un protegido en seguidor.

**Conversaciones personales:**

##### VID_senda_iria_1 · Antes del cambio

> **Iria:** Pregunté si estaba bien y respondió antes de respirar. Lo guardé como una elección clara.
> **Nora:** ¿Esperabas cualquier respuesta o esperabas que aprobara tu plan?
> **Iria:** Quería ayudar. También quería que se notara.
> **Nora:** Podemos dejar una pausa donde las dos necesidades no se confundan.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_senda_iria_2 · Después del arco personal

> **Iria:** Hoy pidió aplazar. La ruta sigue disponible y usamos el archivo para otra prueba.
> **Mateo:** ¿Te quedaste sintiendo que faltaba convencer?
> **Iria:** Un rato. Después volví al servicio sin llevar su negativa como problema que resolver.
> **Mateo:** Cuando termine el turno podemos caminar sin acompañar oficialmente a nadie.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Leer regla de consentimiento.

> **Iria:** Puedo caminar a tu lado. Si respondo por ti, la puerta solo conocerá mi voz.

**Acto 2:** Acompañar una prueba sin elegir respuesta.

> **Iria:** Me agradeció por resolverlo. Después no supo decir qué había elegido.

**Acto 3:** Registrar decisión o aplazamiento y ruta de retorno.

> **Iria:** Hoy decidió esperar. No escribiré fracaso donde hubo una decisión.

**Acceso narrativo:** después de `P13` y visita autorizada. **Decisión antes del acto 3:** Acompañar o ofrecer espacio.

> **Iria · respuesta 1:** Acompañar: Preguntaré antes de cada intervención.

> **Iria · respuesta 2:** Espacio: El ancla seguirá a mano sin presión de tiempo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El paso que no doy por ti». Registro de acompañamiento y decisión aplazada, que nunca acredita la prueba del alma por el jugador. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Mateo · `senda_mateo`

**Pasado:** Mateo, 37, carpintero vivo autorizado, construyó un puente basándose en un plano de Vael que parecía estable. Iria detectó que devolvía a su entrada. Retirarlo le costó un ascenso y una certeza.

**Presente y personalidad:** Es práctico, juega a construir torres y se incomoda con intuiciones que no puede medir.

**Cambio:** Comprueba función con recorridos y testimonios, no apariencia. Permite a otro revisar su obra. Después reconstruye un banco sencillo por placer. No necesita que cada obra refute a Vael para recordar por qué aprendió carpintería.

**Vínculos:** Iria, Tecla, Olivia. **Naturaleza:** persona_viva. **Hogar planificado:** `travesia_vivienda_01`.

#### El puente que siempre vuelve · `V_senda_mateo`

**Primeros años y lo que aprendió a querer:**

Mateo empezó carpintería construyendo bancos que permitían trabajar sin estar siempre de pie. Le gustaban planos claros y aprendió a confiar en quien podía explicar cada unión. Entrar al servicio autorizado de Senda prometía un oficio donde seguridad y cuidado fueran el mismo proyecto. No conocía toda geometría de Vael y no era cómplice por admirar un diseño convincente.

**Aprendizaje, decisiones y vínculos:**

El puente parecía estable y superó una prueba parcial. Devolvía a su entrada mediante una ruta que el plano no mostraba como repetición. Iria lo detectó acompañando a alguien que había cruzado varias veces. Mateo buscó justificar la estructura antes de retirarla porque estaba asociada a un ascenso. Su primera defensa fue que nadie había caído; ignoraba que perder salida también era daño.

**Lo que cambia y lo que todavía pesa:**

Retirarlo costó autoridad y una promesa profesional. La misión ensaya retorno además de resistencia y mantiene ancla independiente. Mateo aprende a ofrecer una obra incompleta con límite explícito, en vez de una perfecta que no puede inspeccionar. Sigue vivo, trabaja con permiso y vuelve al Santuario; no debe quedarse atrapado en Senda para demostrar responsabilidad.

**Cuando no ofrece una misión:**

Hace juegos de equilibrio sin función espiritual y después del arco prueba puentes con recorridos reversibles. Puede apreciar un plano bonito preguntando qué permite hacer, no solo si parece correcto. Prefiere un almuerzo donde no deba explicar otra vez el ascenso perdido.

**Ante Fuatia:**

A Fuatia le mostraría cómo un intercambio puede parecer equilibrado y devolver siempre el costo al mismo lugar. Su experiencia ayuda a detectar conductos de Vael sin darle autoridad sobre todos. No necesita que una diosa convierta su error en destino elegido para poder aprovechar lo aprendido.

**Conversaciones personales:**

##### VID_senda_mateo_1 · Antes del cambio

> **Mateo:** Nadie caía. Repetí eso antes de mirar que tampoco podían salir.
> **Iria:** La seguridad que mediste era una parte de la que necesitaban.
> **Mateo:** Me costó retirar algo que llevaba mi nombre junto a una promesa de ascenso.
> **Iria:** El retorno no sabe qué promesa profesional tenemos que proteger.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_senda_mateo_2 · Después del arco personal

> **Mateo:** Este plano incluye ida y vuelta. La vuelta tiene una prueba distinta y una parada posible.
> **Héctor:** ¿Puedes mostrarme el mecanismo sin necesitar que tú estés para repararlo?
> **Mateo:** Sí. Quiero que lo pruebes con instrucciones que no sean otra extensión de mi presencia.
> **Héctor:** Entonces hoy también puedo aprender algo de tu obra incompleta.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar referencias físicas de dos extremos.

> **Mateo:** Las medidas coincidían. El destino no. Nunca había pensado en medir eso.

**Acto 2:** Recorrer prueba con ancla y salida segura.

> **Mateo:** Tecla no rompió mi puente. Demostró que llevaba días roto por dentro.

**Acto 3:** Desmontar tramo ilusorio y publicar evidencia.

> **Mateo:** Este paso tendrá prueba de regreso además de carga.

**Acceso narrativo:** después de `P13` y visita autorizada. **Decisión antes del acto 3:** Desmontaje o cierre documentado.

> **Mateo · respuesta 1:** Desmontaje: Reservaremos materiales reales, no restos duplicados de ilusión.

> **Mateo · respuesta 2:** Cierre: El mapa mostrará por qué no se cruza.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «El puente que siempre vuelve». Plan de revisión de puentes y prueba de regreso, sin fabricar material de ilusiones desmontadas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Nora · `senda_nora`

**Pasado:** Nora, 33, investigadora viva, redactó testimonios de reparación y un resumen suyo convirtió una duda en confesión. Rectificó, pero guardó el borrador como si borrarlo la hiciera menos culpable.

**Presente y personalidad:** Es inquisitiva, colecciona frases de humor y disfruta cocinar sin medir. En trabajo cree que la precisión requiere dureza.

**Cambio:** Separa dicho, interpretación y silencio. Pide confirmación del testigo y deja versiones anteriores con acceso restringido.

**Vínculos:** Tecla, Damián, Anwar. **Naturaleza:** persona_viva. **Hogar planificado:** `travesia_vivienda_02`.

#### El verbo que cambié · `V_senda_nora`

**Primeros años y lo que aprendió a querer:**

Nora estudiaba relatos porque encontraba diferencias que una tabla sencilla no mostraba. Le gustaba escribir una voz con ritmo propio y su primer informe fue celebrado por claridad. Empezó a ofrecer versiones cada vez más breves para que colegas pudieran actuar rápido. La brevedad parecía una habilidad neutral hasta que empezó a decidir qué dudas quedaban fuera.

**Aprendizaje, decisiones y vínculos:**

Un resumen convirtió una posibilidad en confesión. Nora había escogido una frase final porque el testimonio extenso le parecía desordenado. Al rectificar temió que conservar el borrador hiciera parecer que aún defendía su error; borrarlo habría ocultado cómo sucedió. La culpa le pedía limpieza donde el archivo necesitaba procedencia.

**Lo que cambia y lo que todavía pesa:**

Su misión conserva borrador identificado, versión autorizada y corrección. Las almas pueden negarse a ampliar una historia; una reparación no entrega toda intimidad al investigador. Nora es una acompañante viva autorizada, no una juez de Senda. No puede resolver responsabilidad por elegancia de texto ni dejar que su propia angustia exija a un testigo consolarla.

**Cuando no ofrece una misión:**

Lee ficción donde nadie necesita demostrar hechos y escribe notas privadas bastante largas. Tras el arco solicita aprobación del sentido, no únicamente firma. Puede aceptar que un relato útil siga resultando incómodo o fragmentario.

**Ante Fuatia:**

Querría entrevistar a Fuatia sin convertir su ira en intención que la diosa nunca dijo. Tampoco limpiará una amenaza para presentarla como ternura. Puede escribir poder, protección y crueldad juntos, identificando voz y contexto de cada afirmación.

**Conversaciones personales:**

##### VID_senda_nora_1 · Antes del cambio

> **Nora:** Quité la duda porque pensé que la frase quedaba más clara. Luego parecía una confesión.
> **Tecla:** La claridad que buscabas le entregaba al lector una certeza que no existía.
> **Nora:** Quise borrar el borrador. Me avergonzaba más que la corrección.
> **Tecla:** Consérvalo identificado. Necesitamos ver dónde cambió el sentido.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_senda_nora_2 · Después del arco personal

> **Nora:** El testigo pidió dejar una parte sin explicar y no la convertí en misterio del archivo.
> **Leire:** ¿Todavía pudiste trabajar con la otra parte?
> **Nora:** Sí. Mi curiosidad no era un requisito de su reparación.
> **Leire:** Ven a leer una historia donde podamos estar curiosas sin pedirle nada a nadie.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar testimonio y resumen.

> **Nora:** Escribí reconoció cuando había dicho quizá. Cambié una vida con un verbo.

**Acto 2:** Consultar corrección con persona afectada.

> **Nora:** No voy a pedir que me consuele por mi error. Voy a corregir donde lo publiqué.

**Acto 3:** Guardar original autorizado y retirar inferencia falsa.

> **Nora:** La duda seguirá siendo duda hasta que su dueño diga otra cosa.

**Acceso narrativo:** después de `P13` y visita autorizada. **Decisión antes del acto 3:** Corrección pública o notificación individual.

> **Nora · respuesta 1:** Pública: No mostrará intimidad del testigo.

> **Nora · respuesta 2:** Individual: Llegará a todas las instituciones que recibieron el error.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El verbo que cambié». Vista de dicho, inferencia y corrección con permisos distintos y términos preservados. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Fabián · `senda_fabian`

**Pasado:** Fabián, 41, encargado vivo de suministros, aceptó llevar un lote sin reservar retorno porque era urgente. Regresó con ayuda ajena y llamó heroísmo a una imprudencia logística.

**Presente y personalidad:** Es alegre, recuerda sabores de raciones y detesta desperdicio. Quiere ser útil y le cuesta rechazar un pedido.

**Cambio:** Calcula reservas no negociables y ofrece alternativas. Las provisiones no se duplican al entrar o salir de Senda.

**Vínculos:** Héctor, Rita, Ciro. **Naturaleza:** persona_viva. **Hogar planificado:** `travesia_vivienda_02`.

#### El paquete del regreso · `V_senda_fabian`

**Primeros años y lo que aprendió a querer:**

Fabián trabajó suministros en un lugar donde comida y equipo podían parecer detalles hasta que faltaban. Disfrutaba encontrar una forma de cargar que dejara a otra persona una mano libre. Aprendió cálculos que no daban aplausos y al entrar a Senda quiso que su oficio fuera reconocido como algo más que llevar cajas. La urgencia le ofreció una ocasión de sentirse imprescindible.

**Aprendizaje, decisiones y vínculos:**

Aceptó un lote sin reservar retorno. Sabía que dependía de otra disponibilidad que aún no estaba confirmada, pero llamó solidaridad a confiar en que aparecería. Regresó con ayuda ajena y el relato público lo presentó como heroico. Cada felicitación hacía menos probable que contara cuántas personas cambiaron sus planes para cubrir su decisión.

**Lo que cambia y lo que todavía pesa:**

La misión separa carga útil, combustible y regreso, manteniendo salidas aplazables. Fabián no puede entregar reserva de otra brigada solo porque su pedido resulte urgente. Reconoce la ayuda sin apropiársela como capacidad personal. Está vivo y no debe sustituir descanso por servicio eterno en un plano de reparación.

**Cuando no ofrece una misión:**

Cocina platos de pocos ingredientes porque conoce lo que cuesta transportar. Tras el arco disfruta un envío tranquilo que no exige rescate y puede perder un encargo por no tener reserva. Su oficio sigue siendo valioso aunque la historia no lo llame hazaña.

**Ante Fuatia:**

Fuatia puede compensar intercambios enormes y Fabián admira ese poder sin tratarlo como reserva invisible. Una intervención divina no se presupone en un manifiesto. Le mostraría una carga menor y completa antes de pedir que el agua de otro territorio pague su retorno.

**Conversaciones personales:**

##### VID_senda_fabian_1 · Antes del cambio

> **Fabián:** Dijeron que conseguí volver. No mencioné a quienes dejaron lo suyo para ayudarme.
> **Asha:** La historia parecía que tú habías previsto esa ayuda.
> **Fabián:** Me gustó que por fin miraran mi trabajo. Por eso tardé en corregirla.
> **Asha:** Podemos nombrar el trabajo y también lo que no habías reservado.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_senda_fabian_2 · Después del arco personal

> **Fabián:** El lote es más pequeño y tiene retorno confirmado. Nadie tendrá que inventarme otra valentía.
> **Leire:** ¿Te parece bastante entrega?
> **Fabián:** Sí. Me está gustando que llegue sin una historia excepcional.
> **Leire:** Entonces podremos usar la comida antes de que tengas que defenderla.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contar entradas disponibles.

> **Fabián:** El regreso no es lo que hacemos con lo que sobra. Es una parte de la preparación.

**Acto 2:** Reservar ancla y comida sin gastar dos veces.

> **Fabián:** Héctor pagó con su reserva mi manera de parecer valiente.

**Acto 3:** Preparar entrega y manifiesto de vuelta.

> **Fabián:** Este paquete no se entrega. Es el que garantiza que quien entrega también vuelva.

**Acceso narrativo:** después de `P13` y visita autorizada. **Decisión antes del acto 3:** Carga reducida o segundo viaje.

> **Fabián · respuesta 1:** Reducida: Informaremos cuánto queda pendiente.

> **Fabián · respuesta 2:** Segundo: No usará el mismo combustible dos veces.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «El paquete del regreso». Plan de carga con paquete de regreso separado de entrega; no duplica provisiones al cruzar plano. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Leire · `senda_leire`

**Pasado:** Leire, 35, acompañante viva, cuidó familiares y aprendió a anticipar toda necesidad. En Senda empezó a preparar respuestas para almas agotadas, pensando que así les daba descanso.

**Presente y personalidad:** Es cariñosa, disfruta bordar y se enfada al recibir consejo cuando no lo pidió. Busca compañía más que prestigio, pero ofrece tareas cuando no sabe pedirla. Le cuesta recibir un gesto que no pueda devolver enseguida.

**Cambio:** Ofrece apoyo y descanso sin resolver responsabilidad ajena. Descubre que pedir descanso para sí no la hace menos cuidadora.

**Vínculos:** Ofelia, Iria, Rufina. **Naturaleza:** persona_viva. **Hogar planificado:** `travesia_vivienda_03`.

#### La silla antes de la prueba · `V_senda_leire`

**Primeros años y lo que aprendió a querer:**

Leire cuidó familiares leyendo gestos que otras personas no advertían. Anticipar agua, abrigo o compañía le permitía aliviar una jornada y daba afecto concreto a su oficio. También aprendió a evitar preguntar porque parecía más atento saber ya. Se sentía poco útil ante alguien cuyas preferencias no reconocía enseguida.

**Aprendizaje, decisiones y vínculos:**

En Senda preparó respuestas para almas agotadas. Escogía un lugar, una duración y palabras suaves antes de escuchar. Una persona siguió el plan y luego pidió estar sola; Leire presentó otras opciones en vez de permitirlo. Su amabilidad había ocupado espacio hasta que la única respuesta fácil era aceptar.

**Lo que cambia y lo que todavía pesa:**

La misión diferencia ayuda material, escucha y decisión. Puede ofrecer un vaso antes de una conversación sin seleccionar después toda reparación. Leire sigue viva y mantiene descanso fuera del plano. No se exige que una alma narre dolor para justificar el cuidado recibido ni que ella produzca alivio visible para acreditar una buena jornada.

**Cuando no ofrece una misión:**

Disfruta tareas con música, prepara una comida favorita sin repartirla siempre y después del arco pregunta por lo que alguien quiere hoy aunque creyera conocerlo. Puede admitir que no sabe ayudar y ofrecer compañía mientras busca una opción autorizada.

**Ante Fuatia:**

Fuatia conoce necesidades materiales con una presencia que Leire no tiene, pero también puede decidir demasiado pronto cómo debería recibirse un favor. Leire defenderá preguntar si se desea aparición, conversación o una ayuda discreta. No toda persona protegida quiere ser visitada por una diosa.

**Conversaciones personales:**

##### VID_senda_leire_1 · Antes del cambio

> **Leire:** Ya había escogido la banca, el horario y lo que diría si lloraba. No había preguntado si quería sentarse.
> **Iria:** ¿Qué pidió?
> **Leire:** Estar sola. Yo respondí que conocía otra banca más tranquila.
> **Iria:** Podemos ofrecer una salida donde no haya otra invitación escondida.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_senda_leire_2 · Después del arco personal

> **Leire:** Hoy pregunté y eligió nada de lo que tenía preparado.
> **Nora:** ¿Pudiste dejarlo ahí?
> **Leire:** Sí. Después hice una comida para mí que no tuve que llamar reserva de acompañamiento.
> **Nora:** Me gusta oírte hablar de una preferencia tuya.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Preparar espacio de descanso.

> **Leire:** Puedo traerte una silla. No tengo que decirte dónde sentarte si puedes elegirlo.

**Acto 2:** Preguntar qué ayuda se desea.

> **Leire:** Yo quería ahorrarles dolor. También les estaba quitando la respuesta.

**Acto 3:** Retirar instrucciones no solicitadas y ofrecer retorno.

> **Leire:** La próxima pausa será la mía. Iria cubrirá sin seguir mi lista palabra por palabra.

**Acceso narrativo:** después de `P13` y visita autorizada. **Decisión antes del acto 3:** Descanso acompañado o privacidad.

> **Leire · respuesta 1:** Acompañado: No habrá interrogatorio durante la pausa.

> **Leire · respuesta 2:** Privacidad: Mantendremos contacto de ayuda disponible.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La silla antes de la prueba». Agenda de descanso y relevo de acompañantes, sin convertir ayuda en respuesta sustitutiva. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Anwar · `senda_anwar`

**Pasado:** Anwar, 48, mediador vivo, obtuvo prestigio por encuentros de reconciliación. Forzó a una víctima a escuchar una disculpa porque la ceremonia ya estaba organizada. La persona se retiró y él lo llamó fracaso.

**Presente y personalidad:** Es elocuente, cocina para amigos y detesta silencios largos. Quiere que su trabajo produzca finales legibles.

**Cambio:** Diferencia reparar, pedir perdón y recibirlo. Permite reparación material sin encuentro y acepta que no habrá escena reconciliadora.

**Vínculos:** Pablo, Nora, Oriel. **Naturaleza:** persona_viva. **Hogar planificado:** `travesia_vivienda_03`.

#### La disculpa que no cobra · `V_senda_anwar`

**Primeros años y lo que aprendió a querer:**

Anwar disfrutaba reunir vecinos para resolver disputas de agua y trabajo. Un acuerdo pequeño podía cambiar semanas difíciles y la gratitud lo impulsó a estudiar mediación. Con prestigio llegaron ceremonias donde el éxito se veía desde fuera. Empezó a recibir peticiones de cerrar una disputa antes de un evento, como si reconciliar fuese otra pieza del montaje.

**Aprendizaje, decisiones y vínculos:**

Organizó una disculpa y obligó a una víctima a escuchar porque ya estaban reunidos. Cuando la persona se retiró, describió fracaso de disposición en vez de revisar su convocatoria. Había preparado un público que hacía costosa la negativa. Su deseo de un acuerdo se convirtió en presión sobre quien no debía demostrar nada para conservar respeto.

**Lo que cambia y lo que todavía pesa:**

La misión permite mediación rechazada, versiones separadas y reparación sin perdón. Anwar está vivo, trabaja con autorización y no representa la ley total de Lara. Debe responder ante procedimientos humanos de cuidado. Puede seguir teniendo talento negociador cuando acepta que un encuentro termine sin foto de ambas partes juntas.

**Cuando no ofrece una misión:**

Le gustan juegos donde el resultado sí es claro y aprende a no extender reglas competitivas a relaciones. Tras el arco pregunta por audiencia y permiso antes de organizar. Puede comer con alguien que no quiera contarle su problema más difícil.

**Ante Fuatia:**

Fuatia puede dar una sentencia precisa y exigir después reconocimiento. Anwar conoce el daño de convertir una ceremonia en prueba de disposición. Defenderá reparación con indicadores y el derecho a no agradecer un castigo; terminar una sanción no vuelve obligatorio el perdón de nadie.

**Conversaciones personales:**

##### VID_senda_anwar_1 · Antes del cambio

> **Anwar:** Ya había preparado la sala. Dije que irse era negarse a colaborar.
> **Oriel:** ¿Habías preguntado si quería escuchar una disculpa delante de todos?
> **Anwar:** No. El acuerdo que deseaba empezó antes de recibir sus respuestas.
> **Oriel:** La siguiente vez podemos preparar primero la posibilidad de que no ocurra.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_senda_anwar_2 · Después del arco personal

> **Anwar:** Rechazaron mediación y se acordó reparar por otra vía. No lo llamé fracaso personal.
> **Nora:** ¿Sigue el documento abierto?
> **Anwar:** Sí, para el trabajo pendiente. El perdón no figura como material requerido.
> **Nora:** Esa frase es mucho más clara que nuestras invitaciones antiguas.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar autorización del encuentro.

> **Anwar:** Si el encuentro necesita que alguien no pueda irse, no es un encuentro.

**Acto 2:** Proponer reparación sin exigir respuesta.

> **Anwar:** La disculpa era de Pablo. El escenario era mío. Ninguno pertenecía a quien había sufrido.

**Acto 3:** Registrar cumplimiento y cerrar sin evaluar perdón.

> **Anwar:** Habrá reparación aunque no haya abrazo.

**Acceso narrativo:** después de `P13` y visita autorizada. **Decisión antes del acto 3:** Mensaje consentido o reparación sin contacto.

> **Anwar · respuesta 1:** Mensaje: Solo se enviará si el destinatario acepta.

> **Anwar · respuesta 2:** Sin contacto: No llevará una petición de gratitud escondida.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La disculpa que no cobra». Guía de reparación sin contacto y consentimiento de mensajes, sin exigir perdón para cerrar. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Ofelia · `senda_ofelia`

**Pasado:** Ofelia murió con 42 años en AV 311. Era constructora y prometió reparar una vivienda que dejó sin terminar para aceptar un contrato mejor. No fue intrínsecamente corrupta: ayudó a otros y evitó reconocer ese daño concreto.

**Presente y personalidad:** Es lúcida, disfruta hablar de ventanas y hace planes para no sentir vergüenza. Como alma en reparación no requiere comida corporal ni salario por avanzar.

**Cambio:** Acepta responsabilidad y una reparación simbólica verificada con testimonio autorizado. Puede ascender a Verdia sin exigir perdón de quienes viven.

**Vínculos:** Leire, Iria, Pablo. **Naturaleza:** alma_en_reparacion. **Hogar planificado:** `travesia_vivienda_04`.

#### La casa que dejé esperando · `V_senda_ofelia`

**Primeros años y lo que aprendió a querer:**

Ofelia aprendió construcción arreglando una vivienda donde cada habitación conservaba algo hecho por un familiar. Le gustaba ver cómo la obra continuaba una vida, no solo cerraba un contrato. Conseguir trabajos mejores parecía confirmar su capacidad. Al prometer reparar una casa sencilla quiso que el cliente agradeciera disponibilidad, aunque ya sospechaba que preferiría otro proyecto si aparecía.

**Aprendizaje, decisiones y vínculos:**

Aceptó el contrato más rentable y dejó una parte abierta. En mensajes hablaba de materiales pendientes cuando lo que faltaba era decidir volver. Ayudó de verdad a otras personas, pero usaba esos trabajos para sentirse la constructora generosa que no habría podido abandonar a nadie. La familia afectada siguió cargando con la incomodidad que ella convirtió en demora administrativa.

**Lo que cambia y lo que todavía pesa:**

Murió con cuarenta y dos años en AV 311. Senda no es tortura ni permite que otro pague para comprarle absolución. En su misión identifica promesa, responde por la parte concreta y puede aplazar conversación. La campaña usa una prueba archivada equivalente si aún no quiere seguir; no la obliga a abrirse para que protagonistas avancen. La reparación no exige que una persona viva perdone ni que la casa se rehaga mágicamente por una escena.

**Cuando no ofrece una misión:**

Tiene recuerdos buenos de obras que terminó y no necesita negarlos para reconocer ésta. Tras el arco puede explicar una medida sin buscar demostrar inocencia general. Una visita futura permite hablar de una ventana favorita, además de su falta; su vida no cabe en el peor contrato.

**Ante Fuatia:**

Fuatia le recuerda una autoridad que podría reducirla a quien se aprovechó de otros. Ofelia admite el acto sin aceptar que todo lo que fue deba desaparecer. La diosa puede exigir responsabilidad y disentir de su ritmo, pero Senda conserva voluntad y no se convierte en lugar de castigo elemental.

**Conversaciones personales:**

##### VID_senda_ofelia_1 · Antes del cambio

> **Ofelia:** Hablo de las casas que sí terminé cuando pienso en la que dejé. Es una forma bastante ordenada de no volver a ella.
> **Iria:** Podemos mirar esa promesa sin pedirte que renuncies a todos tus recuerdos buenos.
> **Ofelia:** Me cuesta no usar lo bueno como defensa.
> **Iria:** Lo conservamos aparte. Aquí necesitamos saber qué quedó pendiente y qué puedes reconocer hoy.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_senda_ofelia_2 · Después del arco personal

> **Ofelia:** Hoy pude nombrar la demora sin decir materiales como si hubiera sido una entrega que nunca llegó.
> **Mateo:** ¿Quieres revisar el siguiente paso?
> **Ofelia:** Después. También quiero hablar de una ventana que me gustó construir.
> **Mateo:** Podemos hacerlo. No toda conversación tuya tiene que ser un examen de esta falta.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar promesa y daño sin datos privados.

> **Ofelia:** Siempre decía que iba a volver. La casa necesitaba que volviera, no que lo dijera.

**Acto 2:** Reconstruir decisión y ofrecer reparación autorizada.

> **Ofelia:** Tengo razones. No quiero usarlas otra vez para ocupar el lugar de quienes esperaron.

**Acto 3:** Reconocer límites y elegir continuar o aplazar.

> **Ofelia:** No puedo hacer aquella casa igual. Sí puedo dejar de esconder qué elegí.

**Acceso narrativo:** después de `P13` y visita autorizada. **Decisión antes del acto 3:** Reconocer ahora o descansar antes.

> **Ofelia · respuesta 1:** Ahora: Iria acompañará sin escribir mi respuesta.

> **Ofelia · respuesta 2:** Descanso: La misión no vencerá ni retrocederá mi reparación.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La casa que dejé esperando». Página de responsabilidad y reparación elegida; ascenso requiere decisión del alma, no amistad máxima. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Pablo · `senda_pablo`

**Pasado:** Pablo murió con 36 años en AV 310. Administraba provisiones y castigó con silencio a una amiga que denunció faltantes. Admitió la cuenta, pero no el uso del afecto para silenciarla.

**Presente y personalidad:** Es simpático, hace rompecabezas y busca aprobación inmediata. Quiere salir de Senda y todavía imagina que una frase correcta garantiza perdón.

**Cambio:** Repara sin pedir reconciliación obligatoria. Su llegada eventual a Verdia depende de su propia elección, no de amistad acumulada con el jugador.

**Vínculos:** Anwar, Ofelia, Iria. **Naturaleza:** alma_en_reparacion. **Hogar planificado:** `travesia_vivienda_04`.

#### Lo que no compra un perdón · `V_senda_pablo`

**Primeros años y lo que aprendió a querer:**

Pablo administraba provisiones porque le gustaba que cada casa supiera qué recibiría. Aprendió a recordar nombres y preferencias, ofreciendo ayuda que parecía personal incluso en una lista larga. Tenía una amistad que confiaba en él y recibió avisos de faltantes. Antes de discutir números, le dolió que alguien cercano pudiera sospechar de su cuidado.

**Aprendizaje, decisiones y vínculos:**

La cuenta tenía un error que reconoció. Después respondió tarde a esa amiga, retiró conversaciones y dejó que ella notara el cambio. No amenazó expresamente y por eso podía decirse que solo estaba decepcionado. El afecto se volvió una forma de castigar denuncia. Aceptar el balance no implicaba haber reparado esa presión.

**Lo que cambia y lo que todavía pesa:**

Murió con treinta y seis años en AV 310 y llegó a Senda como alma en reparación. La misión distingue disculpa del derecho a recibir respuesta, sin usar a la amiga viva como herramienta obligatoria de cierre. Puede aceptar que el vínculo no vuelva a ser el mismo. No es intrínsecamente corrupto ni su silencio se cura pagando un recurso.

**Cuando no ofrece una misión:**

Le gustaban comidas compartidas sin recuento y puede recordar una amistad que no existía solo para señalarlo. Tras el arco permite una distancia acordada y no la presenta como nuevo castigo a sí mismo. Tiene algo que aprender más allá de inventar una gran confesión.

**Ante Fuatia:**

Cuestionaría a Fuatia prolongando pérdidas para que alguien aprenda a agradecer. Conoce cómo un retiro puede hacer obedecer sin decir una orden. Eso no lo vuelve superior moral a la diosa; le permite nombrar una presión que él mismo utilizó y que ya no quiere reproducir.

**Conversaciones personales:**

##### VID_senda_pablo_1 · Antes del cambio

> **Pablo:** Contestaba tarde para que notara cuánto me había dolido. Si preguntaba, podía decir que estaba ocupado.
> **Leire:** Querías que dejara de denunciar, aunque no lo pidieras con esas palabras.
> **Pablo:** Sí. Admití la cifra para no admitir esa parte.
> **Leire:** Podemos trabajarla sin pedirle que vuelva a hablarte para confirmarlo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_senda_pablo_2 · Después del arco personal

> **Pablo:** La respuesta puede no llegar. Dejé de describirlo como algo que todavía debe darme.
> **Anwar:** ¿Y qué quieres hacer ahora?
> **Pablo:** Recordar una comida buena sin usarla para demostrar que la amistad merece regresar.
> **Anwar:** Puedo escucharte sin organizar el reencuentro.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar cuenta y testimonio autorizado.

> **Pablo:** Pensaba que decir lo siento me daba derecho a escuchar ya pasó.

**Acto 2:** Proponer restitución sin contacto obligado.

> **Pablo:** Ella no me debe la frase que me permita dormir.

**Acto 3:** Retirar exigencia de perdón y registrar responsabilidad.

> **Pablo:** Voy a hacer lo que puedo reparar. La respuesta seguirá siendo suya.

**Acceso narrativo:** después de `P13` y visita autorizada. **Decisión antes del acto 3:** Carta autorizada o restitución discreta.

> **Pablo · respuesta 1:** Carta: No llevará pregunta que obligue a contestar.

> **Pablo · respuesta 2:** Discreta: Quedará evidencia sin convertirla en espectáculo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «Lo que no compra un perdón». Registro de restitución sin petición de gratitud; no autoriza contacto con víctima. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## refugio_hilos

### Tecla · `hilos_tecla`

**Pasado:** Tecla, 36, analista viva, rechazó un testimonio que no encajaba en su modelo. Elián quedó atrapado mientras ella buscaba una ruta perfecta. Cambió de método después de escuchar dos recuerdos que se contradecían sin mentir.

**Presente y personalidad:** Es incisiva, disfruta juegos imposibles y dobla papel por placer. Quiere desmontar a Vael; teme parecerse a él cuando impone una sola explicación.

**Cambio:** Acepta modelos revisables y participación de afectados. Su prueba final usa consentimiento, contradicción y salida, no una ecuación que ordena a otros.

**Vínculos:** Elián, Sol, Nora. **Naturaleza:** persona_viva. **Hogar planificado:** `refugio_hilos_vivienda_01`.

#### El patrón que no nos contiene · `V_hilos_tecla`

**Primeros años y lo que aprendió a querer:**

Tecla aprendió análisis comparando recorridos de personas que atravesaban el mismo lugar y conservaban descripciones distintas. Al inicio disfrutaba esa diversidad porque parecía prometer un modelo más rico. Una evaluación premió una ruta elegante donde cada dato encajaba y ella aprendió a sentir que las excepciones disminuían su capacidad. El modelo fue herramienta antes de convertirse en refugio para una identidad profesional.

**Aprendizaje, decisiones y vínculos:**

Rechazó un testimonio que no encajaba. Elián seguía atrapado y Tecla medía variaciones en vez de abrir una prueba de salida que parecía demasiado imperfecta. No quería conservarlo allí; estaba esperando la certeza con que podría prometerle rescate. Los dos recuerdos contradictorios no eran mentiras y ella tuvo que admitir que el rigor también exige revisar el supuesto de una sola ruta verdadera.

**Lo que cambia y lo que todavía pesa:**

Su misión reconoce al testigo como fuente, prueba regreso independiente y deja incertidumbre legible. La crítica a Vael no funciona como excusa para esconder cuánto se parecían sus métodos en una decisión concreta. Tecla es analista viva y no el alma que debe reparar la falta de Elián. Puede acompañar salida sin conceder perdón ni diseñar cómo tendría que sentirse al conseguirla. Su trabajo resulta más difícil y más abierto, no sencillamente menos preciso.

**Cuando no ofrece una misión:**

Arma juegos de rutas con reglas que pueden cambiar porque son juegos, y disfruta relatos que nadie requiere validar. Tras el arco escribe preguntas en un color distinto de conclusiones. Conserva un modelo bello y lo usa donde sus supuestos sí están demostrados, sin predicar que todo orden es malvado.

**Ante Fuatia:**

Ayuda a Fuatia a leer las compensaciones falsas de Vael y no le propone medir almas como materia. La diosa puede sentir intercambios físicos y necesitar escuchar rutas de testigos. Tecla pide conservar diferencias honestas en vez de forzar el equilibrio a un diagrama que agrade.

**Conversaciones personales:**

##### VID_hilos_tecla_1 · Antes del cambio

> **Tecla:** Su recuerdo no cabía y yo seguí buscando un modelo que sí lo aceptara, sin dejarle probar la salida.
> **Héctor:** Estabas esperando una certeza que el sistema no tenía.
> **Tecla:** También esperaba seguir siendo la persona que siempre explica bien una ruta.
> **Héctor:** Hoy puedes explicarnos qué falta. Eso sirve más que otra espera perfecta.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_hilos_tecla_2 · Después del arco personal

> **Tecla:** Hay dos testimonios distintos y dejamos ambas pruebas disponibles.
> **Nora:** ¿No te molesta la contradicción?
> **Tecla:** Sí. Pero no necesito resolver mi incomodidad antes de respetar las fuentes.
> **Nora:** Entonces guardemos el informe y leamos algo que no vaya a evaluarnos.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar dos rutas legítimas.

> **Tecla:** Si mi modelo exige borrar tu recuerdo, el modelo es el problema.

**Acto 2:** Registrar excepción sin descartarla.

> **Tecla:** Vael cuenta excepciones como material defectuoso. Yo las estaba llamando ruido.

**Acto 3:** Probar salida con decisión libre y ancla.

> **Tecla:** Dejaremos abierta la página de revisión. Nadie tiene que caber en ella a la fuerza.

**Acceso narrativo:** después de `P14` y visita autorizada. **Decisión antes del acto 3:** Mapa con variantes o procedimiento de prueba.

> **Tecla · respuesta 1:** Variantes: Mostrará incertidumbres y referencias.

> **Tecla · respuesta 2:** Procedimiento: Podrá refutarse con un recorrido documentado.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El patrón que no nos contiene». Cuaderno de pruebas refutables del laberinto, con variantes y excepciones conservadas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Héctor · `hilos_hector`

**Pasado:** Héctor, 43, artesano vivo, hizo anclas tan complejas que solo él podía repararlas. Un equipo quedó esperando su vuelta con el objeto intacto pero incomprensible.

**Presente y personalidad:** Es metódico, aprecia juegos de madera y cree que una solución sencilla no demuestra talento.

**Cambio:** Diseña anclas reparables, comparte instrucciones y reconoce que seguridad incluye comprensión. El primer ancla armada por otro le produce orgullo y vértigo. Asha reconoce ambos sin pedirle que vuelva a intervenir.

**Vínculos:** Fabián, Asha, Uma. **Naturaleza:** persona_viva. **Hogar planificado:** `refugio_hilos_vivienda_01`.

#### El ancla que otra mano entiende · `V_hilos_hector`

**Primeros años y lo que aprendió a querer:**

Héctor disfrutaba fabricar objetos que parecían simples hasta que alguien los abría. Un primer ancla permitió regresar a un equipo y le dio orgullo de una precisión que pocos entendían. Compró herramientas mejores y siguió añadiendo mecanismos que resolvían problemas reales. La acumulación también lo convirtió en la única persona capaz de explicar cómo funcionaba el conjunto.

**Aprendizaje, decisiones y vínculos:**

Un equipo quedó esperando su vuelta con el objeto intacto. Héctor defendió que nadie había seguido el mantenimiento completo, pero no existía una explicación que pudieran usar sin él. Confundía complejidad con valor y la dependencia con garantía de empleo. Le costó admitir que parte de su seguridad económica descansaba en que otros no aprendieran demasiado bien a reparar.

**Lo que cambia y lo que todavía pesa:**

La misión ofrece módulos, prueba y manual legible con insumos equivalentes. Héctor no regala todo trabajo ni fabrica retornos ilimitados: comparte conocimiento necesario y puede cobrar mantenimiento real. Sigue vivo y sus anclas requieren permisos, reservas y equipo; una copia de plano no abre todo Senda por sí misma.

**Cuando no ofrece una misión:**

Hace cajas con compartimientos absurdos por gusto, separados del equipo crítico. Tras el arco puede volver de descanso y encontrar una reparación bien hecha por otro. Disfruta la mezcla de alivio y pequeño orgullo herido sin convertirla en nueva restricción.

**Ante Fuatia:**

Fuatia puede sostener balance y Héctor teme que un sistema dependa de invocarla siempre. Propone mecanismos que pueden inspeccionarse y detenerse con recursos humanos. El poder de una diosa complementa un retorno; no debería convertirse en propietario invisible del acceso.

**Conversaciones personales:**

##### VID_hilos_hector_1 · Antes del cambio

> **Héctor:** El ancla estaba intacta. Yo lo usaba para decir que el problema era de quien no entendía el manual.
> **Mateo:** ¿Había un manual que alguien distinto pudiera terminar de leer?
> **Héctor:** No. Me gustaba que necesitaran llamar al que la había construido.
> **Mateo:** Puedes seguir siendo artesano sin que el regreso dependa de encontrarte despierto.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_hilos_hector_2 · Después del arco personal

> **Héctor:** Repararon un módulo mientras descansaba. La primera cosa que sentí no fue alivio.
> **Tecla:** ¿Te molestó no hacer falta?
> **Héctor:** Sí. Luego vi que seguían teniendo trabajo para mí y nadie estaba atrapado esperándolo.
> **Tecla:** Podemos celebrar las dos cosas sin ocultar tu primera reacción.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Desmontar ancla de prueba no activa.

> **Héctor:** La hice difícil de romper y casi imposible de entender. Es otra manera de fallar.

**Acto 2:** Reemplazar pieza con costo estándar.

> **Héctor:** Asha no necesita admirar mi diseño. Necesita regresar con él.

**Acto 3:** Enseñar armado a segundo adulto y verificar salida.

> **Héctor:** Ahora otra mano puede repararla sin buscarme. Ese es el resultado.

**Acceso narrativo:** después de `P14` y visita autorizada. **Decisión antes del acto 3:** Piezas marcadas o guía paso a paso.

> **Héctor · respuesta 1:** Marcadas: No dependerán solo del color.

> **Héctor · respuesta 2:** Guía: Habrá versión corta junto al objeto.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «El ancla que otra mano entiende». Plano de ancla reparable con mismas piezas y capacidad base; exige armado y prueba reales. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Asha · `hilos_asha`

**Pasado:** Asha, 29, guía viva, escapó de una ruta falsa siguiendo una señal que nadie había registrado. Se atribuyó el rescate por vergüenza de no saber quién ayudó y perdió una cadena de conocimiento útil.

**Presente y personalidad:** Es valiente, tararea al contar pasos y desconfía de mapas fijos. Quiere moverse sin que su intuición deba explicarse.

**Cambio:** Registra referencias y crédito incierto, coordina con Ulises y acepta un plan de regreso medible.

**Vínculos:** Ulises, Héctor, Elián. **Naturaleza:** persona_viva. **Hogar planificado:** `refugio_hilos_vivienda_02`.

#### La señal que no inventé · `V_hilos_asha`

**Primeros años y lo que aprendió a querer:**

Asha entró a rutas buscando conocer lugares que no podía visitar como turista. Disfrutaba aprender de señales dejadas por manos distintas y al principio acreditaba cada indicación con entusiasmo. Un contrato importante pidió una responsable visible y ella empezó a narrar trayectos como si hubiera descubierto todo. No todas las omisiones nacían de cálculo; algunas se volvían cómodas al repetir una historia exitosa.

**Aprendizaje, decisiones y vínculos:**

Escapó de una ruta falsa siguiendo una señal cuyo autor desconocía. Al regresar dijo que había encontrado el paso. Quería sonar preparada ante quienes ya dudaban de su juventud. La versión ocultó una cadena de conocimiento que otro equipo necesitaba conservar. Su vergüenza por no saber un nombre terminó impidiendo reconocer que alguien había ayudado.

**Lo que cambia y lo que todavía pesa:**

La misión documenta señal, incertidumbre y aporte sin inventar autor. No exige que aparezca un salvador secreto para cerrar correctamente. Asha puede seguir guiando y decir encontrado gracias a un aviso desconocido. Trabaja viva con autorización y no cruza almas como carga sin elección. Con Fabián comparte oficio útil que ha llamado hazaña a ayudas ajenas.

**Cuando no ofrece una misión:**

Colecciona mapas de comidas y conoce refugios por una conversación agradable además de coordenadas. Tras el arco publica la duda antes de contratar una ruta. Puede sentir orgullo de haber leído bien una señal sin reclamar haberla creado.

**Ante Fuatia:**

Fuatia puede mandar una corriente y no anunciarse. Asha no le atribuirá cada ayuda desconocida por deseo de un relato divino. Agradecer una señal y registrar no identificado permite que otro testimonio futuro la complete sin comprar una explicación hoy.

**Conversaciones personales:**

##### VID_hilos_asha_1 · Antes del cambio

> **Asha:** Seguí una marca y dije encontré la salida. Me parecía peor no saber quién la había dejado.
> **Fabián:** Peor para tu reputación o para la gente que necesitaba volver a usarla.
> **Asha:** Para mi reputación. Los siguientes perdieron la indicación al oír mi resumen.
> **Fabián:** Guardemos ahora la marca aunque el nombre quede abierto.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_hilos_asha_2 · Después del arco personal

> **Asha:** La ficha acredita la señal y dice autor desconocido. No inventamos uno para terminarla.
> **Tecla:** ¿Cómo te sientes firmándola así?
> **Asha:** Bastante orgullosa. Pude usar una ayuda sin convertirla en mi descubrimiento entero.
> **Tecla:** Entonces tenemos un registro terminado con una pregunta todavía viva.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Encontrar marca sin retirarla.

> **Asha:** Seguí una señal. Eso no la convierte en mi descubrimiento.

**Acto 2:** Contrastar rutas con testigos.

> **Asha:** No sé quién la dejó. Puedo escribir exactamente eso y conservar lo que sí sabemos.

**Acto 3:** Crear protocolo de referencia y retorno.

> **Asha:** La siguiente persona tendrá más que mi suerte.

**Acceso narrativo:** después de `P14` y visita autorizada. **Decisión antes del acto 3:** Registro de marcas o balizas renovables.

> **Asha · respuesta 1:** Marcas: No alteraremos testimonios originales.

> **Asha · respuesta 2:** Balizas: Exigirán mantenimiento y reserva de regreso.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La señal que no inventé». Agenda de balizas y referencias revisables; crédito incierto se conserva como incierto. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Elián · `hilos_elian`

**Pasado:** Elián murió con 28 años en AV 307 después de abandonar a su hermano durante un incendio. En Senda intentaba reconocer el miedo y Vael le ofreció repetir el día anterior, sin fuego ni culpa. Su hermano sobrevivió; su reparación no consiste en inventar un muerto.

**Presente y personalidad:** Es retraído, disfruta recetas simples y recuerda fragmentos contradictorios. Quiere volver a una identidad entera y teme que una laguna lo vuelva falso.

**Cambio:** Acepta memoria incompleta, sale del molde y continúa su reparación sin fingir inocencia. No llega automáticamente a Verdia por ser rescatado.

**Vínculos:** Tecla, Asha, Ofelia. **Naturaleza:** alma_en_reparacion. **Hogar planificado:** `refugio_hilos_vivienda_02`.

#### El día después del día perfecto · `V_hilos_elian`

**Primeros años y lo que aprendió a querer:**

Elián recuerda una vida que incluía aburrimiento, trabajo y discusiones con su hermano por cosas pequeñas. A veces quería marcharse antes de terminar una conversación porque ambos repetían el mismo argumento. Esos recuerdos no demuestran una maldad escondida; importan porque el incendio no fue el único día que existió. Le gustaría que alguien conociera un chiste de ambos sin pedirle enseguida explicar cómo acabó todo.

**Aprendizaje, decisiones y vínculos:**

Durante el incendio huyó dejando al hermano. El hermano sobrevivió: no se inventa una muerte que vuelva más dramática la reparación. Elián murió con veintiocho años en AV 307 y llegó a Senda intentando reconocer miedo y acto. Quería una frase que le permitiera distinguir haber sentido terror de haber decidido irse, pero temía que admitir elección lo convirtiera en esa decisión para siempre.

**Lo que cambia y lo que todavía pesa:**

Vael ofreció repetir el día anterior sin fuego ni culpa. La casa perfecta tenía gestos familiares y ninguna posibilidad real de decir que no. Elián conservó un recuerdo discrepante que el molde no podía hacer repetir; Tecla lo desestimó antes de escucharlo completo. Salir de la intrusión no lo absuelve ni lo condena a tortura. La misión permite reconocer, ofrecer un testimonio autorizado y aceptar que una respuesta del hermano no puede exigirse. El jugador no reemplaza su voluntad con una elección económica.

**Cuando no ofrece una misión:**

Después del arco puede hablar de una tarde cualquiera y reservar la del incendio. Su memoria no se vuelve propiedad del archivo ni protagonista de cada conversación de rescate. Tiene deseos pequeños nuevos: aprender un juego, escuchar una voz sin que cada pausa parezca la repetición de Vael.

**Ante Fuatia:**

La crueldad paciente de Fuatia le recuerda una vida organizada alrededor de una falta. Puede aceptar reparación y cuestionar sufrimiento prolongado sin negar el abandono. Senda pertenece a un cuidado de responsabilidad con elección, no a un altar donde la diosa decida cuándo debe agradecer su castigo.

**Conversaciones personales:**

##### VID_hilos_elian_1 · Antes del cambio

> **Elián:** Mi hermano hacía una broma muy mala cada vez que arreglábamos una puerta. Vael la repetía igual en cada vuelta.
> **Tecla:** ¿La broma era distinta en tu recuerdo?
> **Elián:** Lo distinto era poder decir que ya estaba cansado de oírla. En la casa perfecta siempre me reía.
> **Tecla:** Quiero registrar eso sin convertirlo en una anécdota que tengas que contar a todo el mundo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_hilos_elian_2 · Después del arco personal

> **Elián:** Hoy no hablé del fuego. No porque lo negara; quería aprender el juego que trajiste.
> **Asha:** Podemos hacerlo. La partida no va a decidir qué persona eres.
> **Elián:** Me gustaría perder sin que alguien me explique una lección del pasado.
> **Asha:** Entonces empieza. Yo también puedo perder sin hacer de eso una ruta falsa.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar repetición desde zona segura.

> **Elián:** Era el día antes del incendio. Después dejó de haber un después.

**Acto 2:** Hallar dos recuerdos autorizados no idénticos.

> **Elián:** Mi hermano vivió. Yo usaba la casa para no preguntar qué le había hecho mi huida.

**Acto 3:** Retirar consentimiento a la casa y elegir salida.

> **Elián:** No estoy entero. Estoy aquí, y puedo seguir.

**Acceso narrativo:** después de `P14` y visita autorizada. **Decisión antes del acto 3:** Salida con compañía o salida en silencio.

> **Elián · respuesta 1:** Compañía: Tecla no decidirá la respuesta por mí.

> **Elián · respuesta 2:** Silencio: Tendré ancla y ayuda visible, no abandono.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El día después del día perfecto». Ruta acompañada de salida autorizada, sin declarar reparación terminada ni abrir Verdia automáticamente. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## bastion_velo

### Dorian · `nox_dorian`

**Pasado:** Dorian, 50, asumió mando del perímetro tras una filtración y simplificó permisos por origen territorial. Salma le mostró que su regla rechazaba ayuda sin reducir riesgo.

**Presente y personalidad:** Es firme, cultiva hierbas domésticas y tiene gusto por comedias. Quiere contención; trata excepciones como amenazas personales.

**Cambio:** Establece criterio verificable, apelación y relevo. No puede negociar libertades de celdas ni usa el Conde como batería.

**Vínculos:** Aldán, Salma, Mirta. **Naturaleza:** persona_viva. **Hogar planificado:** `bastion_velo_vivienda_01`.

#### El límite escrito con precisión · `V_nox_dorian`

**Primeros años y lo que aprendió a querer:**

Dorian aprendió mando en trabajos donde compartir un turno podía ser más importante que una gran decisión. Le gustaba que cada operario supiera cuándo saldría y a quién dejaría la tarea. Al asumir el perímetro tras una filtración encontró incertidumbre y presión por demostrar control. La regla más simple parecía capaz de dar tranquilidad a una institución que no sabía explicar todavía todo el riesgo.

**Aprendizaje, decisiones y vínculos:**

Clasificó permisos por origen territorial. La revisión era rápida y dejaba fuera ayuda valiosa sin medir la exposición real. Salma mostró un caso y Dorian pidió no debilitar al puesto mientras se investigaba. La frase trasladaba la investigación al futuro y conservaba un rechazo presente. El sistema tenía responsables vivos; no era una ley natural de Nox que él solo ejecutaba.

**Lo que cambia y lo que todavía pesa:**

La misión hace visibles condiciones y apelación con controles materiales. Los seis trabajadores del Bastión son vivos autorizados en perímetro, no almas inocentes encerradas. Dorian puede mantener límites fuertes y retirar una discriminación. No permite al jugador visitar una celda por amistad ni clasifica como entidad corrupta a un humano incómodo.

**Cuando no ofrece una misión:**

Tiene plantas en un lugar del Santuario durante relevos y pregunta cómo crecieron sin su turno. Tras el arco deja que otro coordine mientras descansa. Puede equivocarse en un juego sin recibir burla sobre su capacidad de mando.

**Ante Fuatia:**

Fuatia castiga humanos y Dorian no equipara automáticamente esa sentencia con una condición de Nox. Quiere pruebas y dominio de cada institución. La diosa puede ayudar a contener una filtración sin decidir que un empleado sancionado deba quedar dentro de una celda.

**Conversaciones personales:**

##### VID_nox_dorian_1 · Antes del cambio

> **Dorian:** El origen cabía en una casilla. La exposición requería preguntas que no quería oír después de la filtración.
> **Salma:** La rapidez de la regla no redujo el riesgo de quien sí entró.
> **Dorian:** Quería que vieran un puesto estable.
> **Salma:** Podemos estabilizarlo sin fingir que una clasificación cómoda es una prueba.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nox_dorian_2 · Después del arco personal

> **Dorian:** El relevo revisó un permiso sin pedirme aprobación de cada línea.
> **Mirta:** Quedó procedencia y umbral. Podrás consultarlo al volver.
> **Dorian:** Entonces hoy voy a mirar mis plantas, no el puesto desde lejos.
> **Mirta:** Buena idea. Siguen siendo tuyas sin estar de guardia también ellas.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar condiciones de visita.

> **Dorian:** No voy a abrir Nox. Sí voy a dejar de llamar seguridad a todo lo que yo prohíba.

**Acto 2:** Simular rechazo y apelación sin entrar a celdas.

> **Dorian:** Salma pidió un equipo médico. Mi formulario respondió sobre su lugar de nacimiento.

**Acto 3:** Publicar permiso por función y riesgo medido.

> **Dorian:** La autorización tendrá razones y fecha. Mi firma no será una categoría moral.

**Acceso narrativo:** después de `P15` y visita autorizada. **Decisión antes del acto 3:** Revisión médica o técnica.

> **Dorian · respuesta 1:** Médica: No expondrá historiales privados.

> **Dorian · respuesta 2:** Técnica: Evaluará tarea, equipo y retorno.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El límite escrito con precisión». Consulta de permisos por función y riesgo, no llave de celdas ni juicio moral de visitantes. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Salma · `nox_salma`

**Pasado:** Salma, 44, médica viva, atendió contaminaciones del perímetro y una vez usó la palabra corrupto para describir un pulmón. Un guardia la interpretó como juicio sobre la persona.

**Presente y personalidad:** Es cálida, hace listas de chistes y se indigna con lenguaje vago. Le cuesta perdonarse una palabra aunque ya la corrigió.

**Cambio:** Separa entidad contenida, sustancia y paciente. Garantiza tratamiento antes de investigación y evita curas mágicas instantáneas.

**Vínculos:** Noemí, Dorian, Íñigo. **Naturaleza:** persona_viva. **Hogar planificado:** `bastion_velo_vivienda_01`.

#### La palabra en la ficha · `V_nox_salma`

**Primeros años y lo que aprendió a querer:**

Salma aprendió medicina trabajando con personas cuyo oficio no permitía mostrarse cansadas. Le interesaba cómo explicar un tratamiento sin apropiarse del paciente. Al llegar al perímetro encontró vocabulario de sellos y contaminación mezclado con palabras morales. Quiso hablar rápido con ingenieros para ser útil y adoptó términos que parecían claros solo dentro de cada especialidad.

**Aprendizaje, decisiones y vínculos:**

Describió un pulmón como corrupto y un guardia leyó juicio sobre la persona. El afectado recibió más vigilancia y menos conversación. Salma defendió que el informe era técnico; al releerlo entendió que el contexto hacía previsible la interpretación. Corregir un término importaba también fuera de la consulta.

**Lo que cambia y lo que todavía pesa:**

La misión separa lesión, exposición y entidad. Tratar a un operario vivo no convierte a Nox en refugio de inocentes ni permite abrir sus celdas. Salma mantiene diagnóstico y solicita una revisión del trato concreto. No inventa una recuperación mágica porque la contaminación resulte incómoda para el relato del puesto.

**Cuando no ofrece una misión:**

Tiene recetas que prepara durante relevos y disfruta hablar sin abreviaturas. Tras el arco pide confirmar qué se entendió de un aviso clínico. Puede atender a alguien con responsabilidad disciplinaria sin asumir que ofrecer cuidado lo declara inocente.

**Ante Fuatia:**

Si Fuatia desea que un responsable sufra, Salma no convierte tratamiento en desafío teatral; sencillamente sigue su oficio. Cuestionará una restricción que empeore lesión y no presentará la discusión como elegir bien o mal. El dolor de un cuerpo no certifica qué decisión moral debería tomar.

**Conversaciones personales:**

##### VID_nox_salma_1 · Antes del cambio

> **Salma:** Escribí una palabra del laboratorio y el guardia la leyó como una sentencia.
> **Mirta:** El traslado quedó registrado por ese término. Necesitamos corregir también la acción.
> **Salma:** Yo quería arreglar la frase primero.
> **Mirta:** Hagamos las dos. El empleado no puede esperar a que el informe vuelva a sonar correcto.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nox_salma_2 · Después del arco personal

> **Salma:** Hoy confirmaron el significado antes de aplicar un permiso distinto.
> **Dorian:** ¿Tienes algo que revisar al final del turno?
> **Salma:** No hoy. Quiero cocinar una receta cuyo nombre no tenga ninguna advertencia clínica.
> **Dorian:** Si invitas, puedo aprender a escuchar sin convertirlo en otro parte.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar caso anonimizado.

> **Salma:** Tiene contaminación. No es una entidad de Nox. El formulario tiene que decirlo antes que nosotros.

**Acto 2:** Comparar vocabulario clínico con protocolo de guardia.

> **Salma:** Noemí conoce el daño de una causa mal nombrada. Vamos a trabajar con esa experiencia.

**Acto 3:** Publicar corrección y probar triage.

> **Salma:** La ficha describe un tratamiento, no cuánto merece alguien recibirlo.

**Acceso narrativo:** después de `P15` y visita autorizada. **Decisión antes del acto 3:** Ficha detallada o protocolo breve.

> **Salma · respuesta 1:** Detallada: Se resguardará el caso personal.

> **Salma · respuesta 2:** Breve: Mantendrá diferencias esenciales y contacto médico.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La palabra en la ficha». Ficha clínica que distingue paciente, contaminación y entidad contenida, con privacidad médica. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Viggo · `nox_viggo`

**Pasado:** Viggo, 39, ingeniero vivo, reforzó sellos añadiendo capas hasta que nadie podía inspeccionar debajo. Mirta detectó una grieta escondida por su mejora.

**Presente y personalidad:** Es aplicado, repara relojes y detesta perder un desafío técnico. Quiere una contención sin mantenimiento.

**Cambio:** Acepta inspección y diseño por capas desmontables. Nunca entrega llaves de celda como recompensa. Aprende a felicitar una inspección que encontró algo, en vez de esperar que cada revisión confirme la imagen de su diseño.

**Vínculos:** Mirta, Héctor, Hugo. **Naturaleza:** persona_viva. **Hogar planificado:** `bastion_velo_vivienda_02`.

#### El sello que se deja revisar · `V_nox_viggo`

**Primeros años y lo que aprendió a querer:**

Viggo empezó ingeniería haciendo cierres que podían abrirse para inspección. Disfrutaba que una pieza protegiera sin esconder lo que sostenía. La filtración del perímetro lo llevó a añadir capas y recibir reconocimiento por cada refuerzo visible. Quería impedir una repetición antes de que alguien preguntara si la última intervención había sido suficiente.

**Aprendizaje, decisiones y vínculos:**

Los refuerzos ocultaron una grieta que Mirta encontró al seguir un movimiento interno. Viggo argumentó que la capa externa estaba intacta. Había conservado una apariencia de seguridad mientras hacía más difícil detectar el problema. La obra protegía algunos riesgos y ampliaba otro, algo que su informe de mejora no había separado.

**Lo que cambia y lo que todavía pesa:**

La misión desmonta de forma controlada, deja registro de inspección y mantiene contención. No se rompen sellos de Nox para demostrar libertad ni se convierten celdas en zonas de cosecha. Viggo aprende que un límite fiable debe poder revisarse por personas diferentes. Puede conservar orgullo de ingeniería sin pedir confianza en una superficie perfecta.

**Cuando no ofrece una misión:**

Repara instrumentos musicales durante descanso y no todos suenan mejor después. Tras el arco conserva puertos de revisión accesibles y admite un retraso sin vender una capa decorativa. Puede escuchar una crítica de mantenimiento sin oír acusación de sabotaje.

**Ante Fuatia:**

Trabajaría con Fuatia sobre piedra y calor de sellos, pero no le ofrece un muro que deba mantenerse inmóvil para siempre. Si equilibrio cambia, la estructura debe tolerar inspección. La tentación de Forma Fija es prometer que jamás habrá otra revisión, no simplemente hacer una obra hermosa.

**Conversaciones personales:**

##### VID_nox_viggo_1 · Antes del cambio

> **Viggo:** La capa se veía entera. Yo la mostraba antes de que alguien preguntara por debajo.
> **Mirta:** El movimiento interno no aparecía en tu dibujo de refuerzos.
> **Viggo:** Cada capa me daba una respuesta fácil sobre cuánto había trabajado.
> **Mirta:** Hoy necesitamos ver también lo que ese trabajo dejó de permitirnos mirar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nox_viggo_2 · Después del arco personal

> **Viggo:** La inspección está abierta sin retirar contención. No es tan impresionante por fuera.
> **Tamara:** Se entiende mejor desde el panel.
> **Viggo:** Me alegra. Esta tarde quiero arreglar un instrumento que nadie usará para comprobar seguridad.
> **Tamara:** Entonces puedo acompañarte sin estar esperando otro aviso.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Inspeccionar modelo inerte.

> **Viggo:** Si no puedo mirar la grieta, no la sellé: la escondí.

**Acto 2:** Desmontar capa con autorización.

> **Viggo:** Mirta no vino a probar que trabajo mal. Vino a impedir que la falla siga creciendo.

**Acto 3:** Registrar falla y calendario de revisión.

> **Viggo:** No hay cierre eterno sin responsabilidad continua.

**Acceso narrativo:** después de `P15` y visita autorizada. **Decisión antes del acto 3:** Capa inspectable o sensor externo.

> **Viggo · respuesta 1:** Capa: Exige protocolo de bloqueo previo.

> **Viggo · respuesta 2:** Sensor: No sustituirá inspección cuando dé alerta.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «El sello que se deja revisar». Modelo inerte de sello inspectable; no entrega sello operativo que permita abrir Nox. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Mirta · `nox_mirta`

**Pasado:** Mirta, 47, registra evidencia y descubrió que un inventario suyo omitía movimientos internos. Nadie robó, pero la omisión hizo parecer culpable a un operario. Defendió el sistema antes de revisar el caso.

**Presente y personalidad:** Es reservada, disfruta plantas de escritorio y firma páginas con cuidado. Quiere confianza institucional y teme que mostrar un fallo la destruya.

**Cambio:** Conserva cadena de custodia completa, corrige acusación y permite auditoría. No exhibe sufrimiento de celdas por curiosidad.

**Vínculos:** Viggo, Damián, Ramiro. **Naturaleza:** persona_viva. **Hogar planificado:** `bastion_velo_vivienda_02`.

#### La pieza que nunca salió · `V_nox_mirta`

**Primeros años y lo que aprendió a querer:**

Mirta empezó inventarios porque conocía cuánto podían perder hogares cuando una transferencia no dejaba rastro. Le gustaba devolver precisión a una disputa sin escoger de antemano una persona favorita. Un sistema muy ordenado le permitió hacer trabajo más rápido y se convirtió en un logro por el que la reconocían. Con los años tendió a confiar más en la ficha que en quien decía haber hecho un movimiento.

**Aprendizaje, decisiones y vínculos:**

Un inventario omitió traslados internos y parecía señalar a un operario como responsable de un faltante. No había robo. Mirta pidió que explicara por qué el registro decía otra cosa, en vez de revisar qué no podía registrar el sistema. El afectado necesitaba defenderse frente a una máquina que parecía más neutral que cualquier testimonio.

**Lo que cambia y lo que todavía pesa:**

La misión conserva transferencias, corrige acusación y separa evidencia de resumen. La anotación no desaparece para volver limpio el historial. Mirta sigue en perímetro vivo autorizado; no conoce por archivo cada esencia contenida. En campaña participa después del permiso previsto, sin duplicarse en otro pueblo para entregar una pista antes de tiempo.

**Cuando no ofrece una misión:**

Disfruta ordenar piezas de un juego y puede aceptar una partida sin registro de resultados. Tras el arco deja una opción para anotar datos que el catálogo aún no interpreta, sin conceder por ello materiales. Su precisión incluye preguntar qué no está capturando.

**Ante Fuatia:**

Le pediría a Fuatia que el registro de una sentencia incluya revisión y reparación, no solo la herida original que la diosa siente. Una culpa comprobada no vuelve correcta toda pérdida posterior. Mirta puede exigir pruebas a humanos y divinidad sin tratar ambas autoridades como idénticas.

**Conversaciones personales:**

##### VID_nox_mirta_1 · Antes del cambio

> **Mirta:** Le pedí que explicara el faltante. Yo no había dejado una casilla para el traslado que sí hizo.
> **Salma:** La ficha parecía más segura que su recuerdo.
> **Mirta:** Porque tenía todas las líneas rectas. Me cuesta admitir lo fácil que fue confiar en eso.
> **Salma:** Corrijamos el trato además de dibujar otra línea.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nox_mirta_2 · Después del arco personal

> **Mirta:** El historial conserva la omisión y la corrección. No tuvimos que borrar al operario para ordenar el caso.
> **Viggo:** ¿Vas a revisar más cosas hoy?
> **Mirta:** Mañana. Quiero una partida que no termine en inventario de quién se equivocó.
> **Viggo:** Entonces escogeré un juego donde puedas reírte de mis fichas mal puestas.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Seguir tres recibos de custodia.

> **Mirta:** El objeto no había salido. Mi registro lo había dejado sin camino.

**Acto 2:** Consultar traslado autorizado.

> **Mirta:** Una institución confiable tiene que poder decir esta acusación nació aquí y estaba mal.

**Acto 3:** Rectificar inventario y notificar afectado.

> **Mirta:** Conservaremos el error y la corrección. Solo una de las dos no cuenta la historia.

**Acceso narrativo:** después de `P15` y visita autorizada. **Decisión antes del acto 3:** Auditoría abierta de proceso o revisión independiente.

> **Mirta · respuesta 1:** Proceso: No mostrará información sensible de contención.

> **Mirta · respuesta 2:** Independiente: El revisor podrá contradecir mi firma.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La pieza que nunca salió». Registro de custodia con correcciones y notificaciones, sin exhibir información de celdas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Íñigo · `nox_inigo`

**Pasado:** Íñigo, 34, repartió cartas de la Custodia cuando buscaba alojamiento y dinero. Al descubrir que los contratos quitaban libertad de salida abandonó la red y entregó rutas. Su empleo actual en el perímetro incluye evaluación y límites explícitos.

**Presente y personalidad:** Es cordial, disfruta juegos de cartas y teme que cada gesto amable parezca reclutamiento. Quiere reparar sin que todo recuerdo se vuelva confesión pública.

**Cambio:** Participa en restitución y apoyo sin exigir perdón. No era jefe secreto ni su salida lo hizo automáticamente inocente.

**Vínculos:** Eliana, Salma, Ramiro. **Naturaleza:** persona_viva. **Hogar planificado:** `bastion_velo_vivienda_03`.

#### El refugio sin letra pequeña · `V_nox_inigo`

**Primeros años y lo que aprendió a querer:**

Íñigo buscaba alojamiento y trabajo cuando la Custodia ofreció ambos. Sus primeras tareas llevaban comida a un refugio donde personas lo trataban con amabilidad. Le gustó una jornada previsible después de viajes inciertos. Esa experiencia explica parte de la permanencia sin convertir a la organización en inocente ni a todos sus miembros en personas incapaces de decidir.

**Aprendizaje, decisiones y vínculos:**

Las cartas añadieron cláusulas de salida y él evitó preguntar mientras siguieran pagando. Después una persona necesitó marcharse y el contrato convirtió la ayuda previa en deuda de obediencia. Íñigo decidió abandonar, entregó rutas y dejó de usar no vi ceniza como defensa absoluta. Conocía una parte suficiente para tener preguntas y había preferido salario a plantearlas.

**Lo que cambia y lo que todavía pesa:**

Su trabajo actual de perímetro incluye evaluación, límites y relevos. No dirige una secta secreta intercambiable con cualquier otro antiguo miembro. En P12 vuelve a Celia como testigo voluntario durante un relevo: no hay que entrar a Nox antes del permiso de campaña. La misión permite responder por su papel sin exigir que toda persona reclutada se declare culpable para recibir comida.

**Cuando no ofrece una misión:**

Se alegra cuando le ofrecen hospedaje sin juramento y todavía lee condiciones de contratos varias veces. Tras el arco puede aceptar una invitación sin pensar que deberá pagarla con toda su historia. Tiene deseos propios de conocer rutas, no únicamente de compensar cada carta que entregó.

**Ante Fuatia:**

La neutralidad interesada de Fuatia le parece más honesta que una promesa de refugio escondiendo obligaciones. Aun así pregunta qué concede y qué pide. La diosa podría protegerlo por conveniencia sin volverse dueña de su trabajo; aceptar alianza no significa entregarle el derecho de salida.

**Conversaciones personales:**

##### VID_nox_inigo_1 · Antes del cambio

> **Íñigo:** Me dieron cama y un trabajo. Eso ocurrió de verdad antes de que yo quisiera no mirar las cláusulas.
> **Rosa:** Aquí puedes comer sin empezar por demostrar que nunca aceptaste nada de ellos.
> **Íñigo:** Quiero responder por las cartas, pero me cuesta separar una responsabilidad de pagar alojamiento toda la vida.
> **Rosa:** Tendremos una cuenta concreta. Ninguna de sus líneas dirá obediencia.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nox_inigo_2 · Después del arco personal

> **Íñigo:** Leí el contrato y pude preguntar una condición sin que llamaran ingratitud a mi duda.
> **Mirta:** Quedó la respuesta escrita.
> **Íñigo:** Gracias. Hoy quiero hablar de una ruta que me gustaría conocer, no de la que debo entregar como prueba.
> **Mirta:** Podemos consultarla al final del turno. No tienes que justificar el gusto con una reparación.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar ruta y contrato de secta.

> **Íñigo:** La cama existía. La salida que prometíamos no.

**Acto 2:** Ayudar a salida voluntaria con provisiones finitas.

> **Íñigo:** No diré que solo llevaba sobres. También dije que podían confiar.

**Acto 3:** Registrar responsabilidad y separar ayuda de interrogatorio.

> **Íñigo:** Esta ayuda no pide juramento. Ni a ellos, ni a mí.

**Acceso narrativo:** después de `P15` y visita autorizada. **Decisión antes del acto 3:** Testimonio reservado o declaración de proceso.

> **Íñigo · respuesta 1:** Reservado: Mirta preservará identidad de otros reclutados.

> **Íñigo · respuesta 2:** Proceso: Describirá hechos sin volver propaganda la escena.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El refugio sin letra pequeña». Servicio de apoyo a salida voluntaria, con cupos y sin juramento; no otorga impunidad. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Tamara · `nox_tamara`

**Pasado:** Tamara, 28, cuida balizas y una vez silenció una alerta repetida por creerla defecto. Era una falla de retorno que había aprendido a ignorar.

**Presente y personalidad:** Es vivaz, inventa nombres de rutas y disfruta mecánica pequeña. Quiere dejar de ser tratada como aprendiz, oculta preguntas.

**Cambio:** Prueba alarmas con contingencia, registra falsos avisos sin apagarlos por comodidad y pide revisión. Acepta enseñar una pregunta que antes ocultaba. Así consigue reconocimiento por hacer comprensible el regreso, no por actuar como si supiera todo.

**Vínculos:** Hugo, Uma, Viggo. **Naturaleza:** persona_viva. **Hogar planificado:** `bastion_velo_vivienda_03`.

#### La alarma que escuchamos tarde · `V_nox_tamara`

**Primeros años y lo que aprendió a querer:**

Tamara empezó balizas porque encontraba satisfacción en una señal sencilla que cambiaba una decisión a tiempo. En su primer puesto ensayaban respuestas antes de atender tráfico y ella disfrutaba saber qué haría ante cada aviso. Después llegaron alertas repetidas que parecían no conducir a ninguna acción. La rutina empezó a enseñarle lo contrario: que responder siempre era interrumpir trabajo por nada.

**Aprendizaje, decisiones y vínculos:**

Silenció una repetición y era una falla de retorno que habían aprendido a ignorar. Su informe llamó defecto al aviso antes de revisar qué medía. No hubo voluntad de sabotear ni garantía de inocencia técnica. El sistema daba demasiado ruido y ella escogió una respuesta que retiró también información necesaria; ambas partes necesitaban revisión.

**Lo que cambia y lo que todavía pesa:**

La misión separa alerta, confirmación y silenciamiento temporal con retorno visible. Tamara conserva oficio sin volverse una vigía incapaz de descansar. Los recursos del perímetro se recuperan en sectores autorizados y no abren celdas. No gana permiso de desconectar una contención para obtener una muestra de campaña.

**Cuando no ofrece una misión:**

Le gustan instrumentos de ritmo y una tarde donde nadie llame señal a cada sonido. Tras el arco documenta razón de una pausa y dónde se verá el aviso pendiente. Puede pedir otro turno para descansar sin presentarlo como renuncia a proteger.

**Ante Fuatia:**

Fuatia percibe todo fenómeno elemental y Tamara pregunta cómo vuelve accionable una percepción constante. Admirar presencia total no implica exigir atención humana infinita. La diosa podría enviar un aviso específico; debe ser legible con color, texto y sonido alternativo, no una prueba de devoción para interpretarlo.

**Conversaciones personales:**

##### VID_nox_tamara_1 · Antes del cambio

> **Tamara:** Había sonado tantas veces que yo ya preparaba el silencio antes de leerlo.
> **Viggo:** El panel enseñaba a reaccionar así. Eso no elimina la revisión de tu decisión.
> **Tamara:** Quiero cambiar las dos cosas sin que una sirva para culpar a la otra.
> **Viggo:** Empecemos por distinguir qué retorno estaba intentando mostrar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nox_tamara_2 · Después del arco personal

> **Tamara:** La pausa tiene motivo y un aviso visible de lo que sigue pendiente.
> **Dorian:** ¿El relevo sabe cuándo debe volver a sonar?
> **Tamara:** Lo probamos juntos. Hoy puedo salir sin escuchar la baliza imaginada en cada golpe de puerta.
> **Dorian:** Entonces tendrás una tarde donde los sonidos también pueden ser solamente sonidos.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Probar baliza en modelo seguro.

> **Tamara:** Me daba vergüenza preguntar por un ruido que todos parecían entender.

**Acto 2:** Contrastar causa de repetición.

> **Tamara:** No era una pregunta pequeña. Era la señal de que alguien no podía regresar.

**Acto 3:** Instalar aviso redundante y simulación de retorno.

> **Tamara:** Dejaremos escrito qué significa y qué hacer si no lo sabemos.

**Acceso narrativo:** después de `P15` y visita autorizada. **Decisión antes del acto 3:** Panel de texto o patrones luminosos.

> **Tamara · respuesta 1:** Texto: Habrá símbolo claro junto a instrucciones.

> **Tamara · respuesta 2:** Luz: No dependerá solo de distinguir colores.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La alarma que escuchamos tarde». Plan de balizas con prueba de redundancia, significado y protocolo de retorno. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## estacion_celia

### Helena · `orbita_helena`

**Pasado:** Helena, 46, comandó la primera órbita estable de AV 308. Aceptó una carga extra y consumió parte de la reserva; Boris evitó emergencia. Presentó el vuelo como éxito completo para sostener financiación.

**Presente y personalidad:** Es decidida, juega con plantas de papel y teme que una pausa se lea como falta de ambición.

**Cambio:** Publica costos de éxito y permite abortar misión sin castigo laboral. Los tratados dejan a otros mundos capacidad de negar acceso.

**Vínculos:** Boris, Rita, Calista. **Naturaleza:** persona_viva. **Hogar planificado:** `estacion_celia_vivienda_01`.

#### El vuelo que también puede volver · `V_orbita_helena`

**Primeros años y lo que aprendió a querer:**

Helena empezó coordinación de viajes organizando carga que otras personas consideraban rutinaria. Le gustaba que una salida pudiera ocurrir porque alguien había pensado detalles sin espectáculo. Cuando se propuso una estación estable vio la posibilidad de un trabajo compartido duradero y también una obra que conservaría su nombre. Ambos deseos participaron en las decisiones; ninguno explica por sí solo todo lo que hizo.

**Aprendizaje, decisiones y vínculos:**

En AV 308 aceptó una carga extra para no perder apoyo. Boris había reservado margen y ella lo utilizó sabiendo que reducía alternativas de retorno. El viaje llegó, pero una contingencia requirió la previsión que el informe final llamó excesiva. Helena presentó éxito completo porque temía que financiar el siguiente vuelo dependiera de una primera historia sin grietas.

**Lo que cambia y lo que todavía pesa:**

La misión publica maniobra, consumo y reserva real. No vuelve inútil el proyecto ni declara que nadie debiera viajar; obliga a sostenerlo con condiciones que una comunidad pueda discutir. Helena tolera que Boris conserve un criterio diferente y también que se cuestionen márgenes suyos. La estación tiene aire, agua y transporte finitos; los protagonistas son visitantes, no nuevos propietarios del puesto.

**Cuando no ofrece una misión:**

Le gustan comidas con ingredientes terrestres familiares y juegos donde no debe coordinar turnos. Tras el arco abre reuniones a informes incompletos y no exige una presentación triunfal para mantener empleo. Puede decir que está orgullosa del vuelo sin añadir que todo salió impecable.

**Ante Fuatia:**

Fuatia puede ser el aire de la estación y Helena no lo convierte en depósito infinito. Quiere acuerdos de compensación antes de pedir una intervención enorme. Su ambición de viajar conserva lugar dentro del balance, pero no exige que otro territorio pague silenciosamente toda la reserva.

**Conversaciones personales:**

##### VID_orbita_helena_1 · Antes del cambio

> **Helena:** El informe dice que llegamos. No dice de dónde salió la alternativa que Boris dejó preparada.
> **Boris:** La alternativa no demuestra que nunca debimos salir. Demuestra que el margen tenía una tarea.
> **Helena:** Yo quería una primera historia que no hiciera dudar a quienes pagaban.
> **Boris:** Hoy podemos financiar un proyecto que sabe describir sus dudas.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_orbita_helena_2 · Después del arco personal

> **Helena:** Dejé el consumo completo en la reunión. Todavía hubo personas que quisieron apoyar el próximo vuelo.
> **Rita:** No necesitaban que toda cifra pareciera celebración.
> **Helena:** Me alegra. Esta noche quiero cenar sin presidir una aprobación.
> **Rita:** Tenemos una mesa donde pueden escogerse platos por gusto.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Leer manifiesto de AV 308.

> **Helena:** El vuelo salió bien porque Boris dijo no a una orden mía. Eso tiene que figurar.

**Acto 2:** Ensayar aborto con reservas finitas.

> **Helena:** Una nave capaz de volver no es menos ambiciosa. Es menos irresponsable.

**Acto 3:** Publicar balance y regla de salida.

> **Helena:** Si no hay reserva, no sale. Ni por mi firma ni por una buena historia.

**Acceso narrativo:** después de `P16` y visita autorizada. **Decisión antes del acto 3:** Ensayo en puerto o órbita de prueba.

> **Helena · respuesta 1:** Puerto: No consumirá combustible de viaje como si hubiera despegado.

> **Helena · respuesta 2:** Órbita: Exige saldo real y condición de retorno antes de salir.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El vuelo que también puede volver». Acceso a preparación de vuelo autorizado con opción de abortar; no sustituye aire, nave o combustible. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Dexo · `orbita_dexo`

**Pasado:** Dexo, 31, piloto, recibió elogios por aterrizar con combustible mínimo y empezó a confundir precisión con gastar toda reserva. Uma le contó cuánto cuesta rescatar una nave que no puede elegir alternativa.

**Presente y personalidad:** Es extrovertido, guarda melodías de motores y detesta esperas. Quiere ser recordado por un vuelo extraordinario.

**Cambio:** Practica aterrizajes aburridos y seguros, acepta reserva aunque reduzca carga y cumple derecho de cancelación.

**Vínculos:** Uma, Boris, Helena. **Naturaleza:** persona_viva. **Hogar planificado:** `estacion_celia_vivienda_01`.

#### El aterrizaje sin aplausos · `V_orbita_dexo`

**Primeros años y lo que aprendió a querer:**

Dexo quería pilotar desde que vio una maniobra de aterrizaje contada como una habilidad casi musical. Entrenar incluía repetir movimientos aburridos y aprendió a disfrutar que un control respondiera igual. El primer aterrizaje con poca reserva le dio elogios que las prácticas normales no recibían. Empezó a valorar precisión por cuánto podía dejar de llevar, no por las opciones que conservaba.

**Aprendizaje, decisiones y vínculos:**

Una salida sin alternativa lo llevó a pedir a Uma un rescate fuera de capacidad. Describió urgencia como si no existieran decisiones anteriores que habían retirado otras posibilidades. Ella aceptó y un puesto ajeno aportó oxígeno. Dexo podía agradecer la maniobra sin explicar todavía la cadena de reservas que consumió; la historia le permitía seguir siendo piloto audaz.

**Lo que cambia y lo que todavía pesa:**

La misión exige plan, destino alternativo y consumo legible. No lo convierte en mal piloto por querer una trayectoria elegante ni le regala combustible para repetirla. Uma tiene derecho a rechazar futuras peticiones imposibles. Dexo aprende a incluir el margen en el orgullo de una maniobra bien hecha, aunque el público lo encuentre menos interesante.

**Cuando no ofrece una misión:**

Escucha música mientras mantiene controles y dibuja rutas de comidas que quiere probar al volver. Tras el arco puede aterrizar con reserva y no disculparse por lo poco heroica que fue la salida. Sigue teniendo gusto por pilotar con precisión.

**Ante Fuatia:**

Un viento de Fuatia puede facilitar viaje y Dexo no lo presupone al reducir combustible. Le pediría colaboración con alternativas preparadas. La diosa no tiene que premiar una imprudencia para probar que protege a humanos ni producir un rescate permanente por haberlo hecho una vez.

**Conversaciones personales:**

##### VID_orbita_dexo_1 · Antes del cambio

> **Dexo:** Me aplaudieron por llegar casi vacío. Empecé a querer que cada aterrizaje pareciera aquel.
> **Uma:** Para rescatarte, alguien tuvo que llevar lo que tú no quisiste conservar.
> **Dexo:** No lo conté cuando agradecí.
> **Uma:** La próxima salida puede incluirlo antes de que alguien necesite ayudarte.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_orbita_dexo_2 · Después del arco personal

> **Dexo:** Llegué con alternativa sin usar. Todavía siento que podría haber apurado más.
> **Boris:** Puedes sentirlo y no convertirlo en otro plan.
> **Dexo:** Hoy voy a guardar la nave y escuchar música sin medir una trayectoria.
> **Boris:** Ese margen también tiene utilidad.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar consumos.

> **Dexo:** Aterrizar al límite parecía una medalla hasta que alguien tuvo que prepararse para recogerme.

**Acto 2:** Simular dos desvíos.

> **Dexo:** Uma no llama brillante a un piloto por quitarse todas las alternativas.

**Acto 3:** Ejecutar ruta autorizada con reserva visible.

> **Dexo:** Hoy sobró combustible. Esa será la noticia.

**Acceso narrativo:** después de `P16` y visita autorizada. **Decisión antes del acto 3:** Ruta corta o ruta con puerto alterno.

> **Dexo · respuesta 1:** Corta: Mantendrá reserva de contingencia igual.

> **Dexo · respuesta 2:** Alterna: El costo adicional quedará claro antes de aceptar.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «El aterrizaje sin aplausos». Plan comparativo de ruta y puerto alterno con reserva mínima no negociable. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Tessa · `orbita_tessa`

**Pasado:** Tessa, 34, diseñó asistencia automática de cuidado y presentó alertas como sustituto de observación. Una instalación cumplía indicadores mientras un refugio tenía una zona dañada. Mireya se lo mostró.

**Presente y personalidad:** Es amable, disfruta manualidades y hace dibujos para explicar algoritmos. Quiere aliviar trabajo; teme reconocer límites de su herramienta.

**Cambio:** Mantiene humanos responsables, entradas finitas y parada. No avanza cuidados reales ni genera alimento leyendo datos.

**Vínculos:** Mireya, Adela, Valentina. **Naturaleza:** persona_viva. **Hogar planificado:** `estacion_celia_vivienda_02`.

#### La ayuda que no se llama reemplazo · `V_orbita_tessa`

**Primeros años y lo que aprendió a querer:**

Tessa aprendió asistencia automática cuidando instalaciones con turnos escasos. Una alerta le permitió detectar algo antes de que un trabajador lo sufriera y sintió orgullo de tecnología que acompañaba. Las primeras herramientas pedían confirmar observación. Más tarde buscó reducir intervención humana para demostrar que el equipo podía sostenerse casi solo.

**Aprendizaje, decisiones y vínculos:**

Los indicadores estaban correctos y una zona del refugio seguía dañada. Tessa defendió el promedio porque todas las lecturas conocidas pasaban. Mireya señaló un lugar que el diseño no miraba. El fallo no probaba que observar con máquinas fuera inútil; mostraba que aprobar lo medido no equivalía a conocer toda la instalación.

**Lo que cambia y lo que todavía pesa:**

La misión añade inspección accesible, parada y límites de aviso, sin simular cuidado real mediante un panel perfecto. Tessa puede fabricar herramientas mejores y conservar usuarios con decisión propia. Una estadística buena no permite negar a quien encuentra daño. Tampoco debe provocar una avería para probar que se toma en serio la crítica.

**Cuando no ofrece una misión:**

Tiene aparatos que usa solo por comodidad y alguno que mantiene por gusto. Tras el arco consulta usuarios antes de anunciar autonomía. Puede pasar un día sin mejorar nada y disfrutar que el refugio siga necesitando observación compartida.

**Ante Fuatia:**

La omnipresencia de Fuatia le inspira sensores y le impide fingir que los suyos son equivalentes. Quiere usar una lectura divina con contexto, no sustituir toda atención. Un favor no permite omitir cuidado de animales porque la diosa los perciba.

**Conversaciones personales:**

##### VID_orbita_tessa_1 · Antes del cambio

> **Tessa:** El promedio era correcto. Yo lo enseñaba como respuesta a una zona que no estaba dentro del cálculo.
> **Mireya:** Mi panel también sabía aprobar lo que yo había decidido medir.
> **Tessa:** Quiero seguir construyendo ayudas.
> **Mireya:** Entonces déjalas abiertas a quien encuentre algo que todavía no sabían mirar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_orbita_tessa_2 · Después del arco personal

> **Tessa:** El aviso nuevo pide comprobar, no declara que todo está bien si nadie respondió.
> **Said:** Lo entiendo sin conocer tu diagrama.
> **Tessa:** Me alegra más de lo que esperaba. Antes quería que pareciera impresionante.
> **Said:** Hoy parece usable. Eso sí ayuda a mi turno.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar alerta con estado físico.

> **Tessa:** El panel decía todo bien. La puerta del refugio decía otra cosa.

**Acto 2:** Configurar prioridad y reserva.

> **Tessa:** Adela me pidió mostrar qué no observa el sistema. Pensé que era una derrota; era una instrucción de uso.

**Acto 3:** Probar falta de insumo y derivación a persona.

> **Tessa:** La ayuda avisará sus límites antes de actuar.

**Acceso narrativo:** después de `P16` y visita autorizada. **Decisión antes del acto 3:** Alertas o propuesta de turnos.

> **Tessa · respuesta 1:** Alertas: Nunca se presentarán como diagnóstico completo.

> **Tessa · respuesta 2:** Turnos: Una persona deberá aceptar el relevo y aportar insumos.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La ayuda que no se llama reemplazo». Plantilla de alertas o turnos humanos con insumos finitos y límites de observación visibles. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Boris · `orbita_boris`

**Pasado:** Boris, 52, construyó reservas de aire y fue acusado de frenar el vuelo de Helena. Salvó la contingencia, pero comenzó a usar márgenes cada vez mayores para no ser discutido.

**Presente y personalidad:** Es seco, hace pan dulce y guarda registros legibles. Quiere seguridad sin negociar; le cuesta distinguir margen fundado de miedo.

**Cambio:** Publica cálculo y revisión, conserva reserva mínima y acepta evaluación externa. Una medición externa reduce un margen excesivo. Él firma sin convertirla en amenaza a su empleo y sostiene el mínimo demostrado.

**Vínculos:** Helena, Dexo, Óscar. **Naturaleza:** persona_viva. **Hogar planificado:** `estacion_celia_vivienda_02`.

#### El número que tiene una razón · `V_orbita_boris`

**Primeros años y lo que aprendió a querer:**

Boris trabajó reservas de aire mucho antes de una estación estable. Le gustaba diseñar un espacio donde personas pudieran respirar sin acordarse de él a cada momento. El margen era una forma concreta de cuidar libertad: decidir otra ruta, esperar una reparación, no actuar con prisa. Su oficio tenía satisfacción silenciosa y poca presencia en los relatos de vuelo.

**Aprendizaje, decisiones y vínculos:**

Durante el viaje de Helena lo acusaron de frenar ambición y después su reserva sostuvo una contingencia. La reivindicación le dio alivio y empezó a usarse para cerrar todo desacuerdo futuro. Añadía margen más grande para que nadie pudiera decir que faltaba cuidado. No sumaba cuánto material y espacio quitaba a otra necesidad.

**Lo que cambia y lo que todavía pesa:**

La misión compara reservas con criterios visibles, en vez de confianza en el prudente por reputación. Boris puede conservar un límite fuerte cuando está justificado y reducir otro sin sentirse traidor al vuelo salvado. La estación no respira por una fuente infinita lunar. La evidencia pasada informa; no aprueba por sí sola cualquier decisión presente.

**Cuando no ofrece una misión:**

Cultiva una planta pequeña por placer y discute con Valentina sobre dónde ponerla sin convertirlo en informe. Tras el arco puede recibir una revisión de margen y dejar un turno tranquilo. Le gusta ser recordado, pero no exige gratitud constante para sostenerlo.

**Ante Fuatia:**

Fuatia es el aire que conserva y Boris no supone que invocarla elimine reservas. Una diosa neutral puede intervenir por interés compartido, no por contrato vitalicio. Su colaboración debe registrar qué compensación necesita y qué hará el puesto si decide no prestarla.

**Conversaciones personales:**

##### VID_orbita_boris_1 · Antes del cambio

> **Boris:** Mi reserva ayudó. Después empecé a usar aquella jornada para no explicar ninguna cifra nueva.
> **Helena:** Yo usaba llegar para no explicar cómo la gasté. No somos opuestos tan sencillos.
> **Boris:** Podemos revisar esta salida sin celebrar otra vez la anterior.
> **Helena:** Sí. Y escuchar qué espacio necesita Valentina para su cultivo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_orbita_boris_2 · Después del arco personal

> **Boris:** Reduje un margen y conservé el otro. No tuve que escoger entre cuidar y dejar viajar.
> **Valentina:** ¿Tu planta también acepta que la movamos un poquito?
> **Boris:** Si sigue teniendo luz y no me la conviertes en demostración de autosuficiencia.
> **Valentina:** Trato hecho. Hoy será una planta que nos gusta.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar consumo de aire y batería.

> **Boris:** No es seguro porque el número sea grande. Es seguro si responde a un riesgo medido.

**Acto 2:** Comparar margen con contingencia probada.

> **Boris:** Helena puede haber pedido demasiado y yo haber añadido miedo a la tabla.

**Acto 3:** Publicar umbral y revisión independiente.

> **Boris:** La reserva seguirá. La explicación será de todos.

**Acceso narrativo:** después de `P16` y visita autorizada. **Decisión antes del acto 3:** Reserva conservadora o recalibrada.

> **Boris · respuesta 1:** Conservadora: Tendrá fecha de nueva medición.

> **Boris · respuesta 2:** Recalibrada: Nunca bajará del mínimo demostrado por la contingencia.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El número que tiene una razón». Calculadora de reserva con consumo registrado y margen revisable, sin generar energía. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Valentina · `orbita_valentina`

**Pasado:** Valentina, 29, adaptó cultivos hidropónicos y ocultó que un lote crecía por debajo de la previsión. Compró reposición externa para mantener una apariencia de autosuficiencia.

**Presente y personalidad:** Es curiosa, dibuja raíces flotantes y hace ensaladas simples. Quiere autonomía; confunde reconocer dependencia con fallar.

**Cambio:** Publica balance de agua, energía e importación. Las plantas siguen jornadas dormidas y consumen insumos.

**Vínculos:** Tessa, Aitana, Liora. **Naturaleza:** persona_viva. **Hogar planificado:** `estacion_celia_vivienda_03`.

#### El huerto que recibe ayuda · `V_orbita_valentina`

**Primeros años y lo que aprendió a querer:**

Valentina cultivó en espacios reducidos antes de la órbita y disfrutaba encontrar alimento donde parecía no caber un huerto. Adaptar un cultivo no significaba copiar una tierra entera; al principio explicaba esa diferencia con entusiasmo. La estación le ofreció una demostración importante y una expectativa de autosuficiencia que nadie había probado con temporadas suficientes.

**Aprendizaje, decisiones y vínculos:**

El lote crecía por debajo de previsión. Compró reposición terrestre y dejó que el abastecimiento pareciera local. La comida era segura; la procedencia del balance no era honesta. Temía perder financiación para una investigación todavía valiosa y decidió protegerla con un resultado que no había obtenido.

**Lo que cambia y lo que todavía pesa:**

La misión separa producción, compra y prueba, conserva alimento y corrige promesa. Valentina no debe destruir reposición para hacer visible su culpa. Puede defender una estación dependiente de acuerdos claros mientras estudia reducir esa dependencia. La órbita no convierte plantas en fuentes sin agua ni habilita una cosecha más rápida por narración.

**Cuando no ofrece una misión:**

Cocina con una verdura terrestre favorita y no todo plato debe demostrar mérito de la estación. Tras el arco etiqueta mezcla, compara fallos y disfruta un pequeño lote bueno. Puede admitir que aún falta trabajo sin vivir su investigación como fraude entero.

**Ante Fuatia:**

La diosa podría transformar entorno, pero Valentina no usará ese poder para fingir que una instalación humana logró lo mismo sola. Si Fuatia ayuda, la ayuda y el balance deben constar. Una bendición no reemplaza agua, luz ni retorno de nutrientes.

**Conversaciones personales:**

##### VID_orbita_valentina_1 · Antes del cambio

> **Valentina:** La comida estaba bien. Yo repetía eso para no decir que el balance la hacía parecer cultivada aquí.
> **Rita:** Había una compra que otros necesitaban ver para preparar el siguiente viaje.
> **Valentina:** Quería tiempo para mejorar sin perder la promesa de independencia.
> **Rita:** Podemos pedir tiempo con el resultado que tenemos, no con otro inventado.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_orbita_valentina_2 · Después del arco personal

> **Valentina:** Este lote es pequeño y es nuestro. El otro ingrediente llegó de tierra y también se llama por su nombre.
> **Saúl:** ¿Todavía podemos hacer un plato bonito?
> **Valentina:** Sí. No necesita ser una bandera de autosuficiencia.
> **Saúl:** Entonces déjame poner una receta que no le pida defender todo el huerto.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar producción y compra.

> **Valentina:** El huerto no produjo todo esto. Una caja vino de Celia. La escondí detrás de la palabra autosuficiente.

**Acto 2:** Cultivar ensayo con consumo medido.

> **Valentina:** Recibir ayuda no arruinó el proyecto. Mentir sobre ella sí podía hacerlo.

**Acto 3:** Publicar balance y acordar suministro transparente.

> **Valentina:** La etiqueta contará el viaje de cada hoja.

**Acceso narrativo:** después de `P16` y visita autorizada. **Decisión antes del acto 3:** Mezcla de suministro o reducción de cupos.

> **Valentina · respuesta 1:** Mezcla: Se registrará importación y costo.

> **Valentina · respuesta 2:** Cupos: Se avisará antes de aceptar pedidos.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El huerto que recibe ayuda». Balance hidropónico de producción e importación que conserva calendario al dormir. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Ivo · `orbita_ivo`

**Pasado:** Ivo, 28, hermano de Nerea, viajó a la estación para investigar mundos. Leyó su preocupación como deseo de mantenerlo pequeño y dejó de enviar datos incompletos. Esa ausencia aumentó el miedo de ella.

**Presente y personalidad:** Es entusiasta, recoge formas de nubes y pierde lápices. Quiere independencia, responde con silencio cuando se siente evaluado.

**Cambio:** Comparte estado sin pedir permiso para toda decisión, pregunta qué necesita su hermana y conserva intimidad propia.

**Vínculos:** Nerea, Helena, Kenzo. **Naturaleza:** persona_viva. **Hogar planificado:** `estacion_celia_vivienda_03`.

#### La distancia en dos libretas · `V_orbita_ivo`

**Primeros años y lo que aprendió a querer:**

Ivo observaba lunas con Nerea y se enfadaba cuando le tocaba sostener el instrumento más tiempo que mirar. Le encantaba imaginar un lugar donde la sombra cambiaba debajo de sus propios pies. La hermana ayudó a aprender y también corrigió prisa. Creció mezclando gratitud con deseo de que lo vieran como alguien capaz de decidir un viaje propio.

**Aprendizaje, decisiones y vínculos:**

Llegó a la estación hace dos años y leyó las listas de cuidado como orden de quedarse pequeño. Dejó de enviar observaciones incompletas para que Nerea recibiera solamente cosas sólidas. El silencio aumentó su preocupación y llegaron listas todavía más extensas. Ninguno veía el esfuerzo del otro porque cada carta confirmaba una interpretación que ya esperaba.

**Lo que cambia y lo que todavía pesa:**

La misión conserva protocolos y abre cartas con emociones comprensibles. Ivo puede decir que quiere permanecer sin probarlo mediante una maniobra arriesgada. Nerea puede sentir miedo sin pedir control sobre toda decisión. No tienen que resolver la discusión en un abrazo orbital: acuerdan datos, frecuencia y lugar para noticias corrientes.

**Cuando no ofrece una misión:**

Dibuja vistas que no pretende publicar y disfruta merendar con Rita mientras alguien más revisa instrumentos. Tras el arco manda una duda antes de que desaparezca del informe. Puede pedir consejo a Nerea sin sentir que entregó nuevamente su edad adulta.

**Ante Fuatia:**

Fuatia puede sentir el aire que respira y Ivo quiere hablarle de lo que implica llevarlo en una reserva pequeña. Admirar presencia total no le hace despreciar mecanismos humanos. Le interesa una alianza que permita viajar sin llamar enemigos de naturaleza a todos los exploradores.

**Conversaciones personales:**

##### VID_orbita_ivo_1 · Antes del cambio

> **Ivo:** Dejé de contar lo incompleto para que supiera que yo podía. Ella pensó que estaba dejando de contar todo.
> **Rita:** ¿Y tú preguntaste qué había leído en tu silencio?
> **Ivo:** No. La siguiente lista me parecía contestar una pelea que seguía solo en mi cabeza.
> **Rita:** Podemos enviar una observación y una pregunta que no sea otro desafío.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_orbita_ivo_2 · Después del arco personal

> **Ivo:** Le escribí que todavía no sé y que quiero seguir aquí. Respondió las dos partes.
> **Helena:** ¿Te dejó un protocolo?
> **Ivo:** Sí. Esta vez no lo leí como una orden de volver a ser niño.
> **Helena:** Me alegra. La estación admite hermanos además de informes.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar calibración de ambos observatorios.

> **Ivo:** Le mandaba solo descubrimientos. Ella no sabía si yo estaba bien entre uno y otro.

**Acto 2:** Preparar mensaje con dato y límite.

> **Ivo:** Nerea no necesita gobernar mi viaje. Yo tampoco necesito callar para probar que es mío.

**Acto 3:** Acordar frecuencia de noticias voluntaria.

> **Ivo:** El informe irá al archivo. Esta frase será solo para mi hermana.

**Acceso narrativo:** después de `P16` y visita autorizada. **Decisión antes del acto 3:** Carta íntima o llamada programada.

> **Ivo · respuesta 1:** Carta: No se hará pública al completar la misión.

> **Ivo · respuesta 2:** Llamada: Tendrá alternativa escrita y no requerirá reloj real.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La distancia en dos libretas». Agenda voluntaria de noticias y observación conjunta, con carta íntima fuera del archivo. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Said · `orbita_said`

**Pasado:** Said, 41, médico de estación, detectó fatiga en sí mismo y siguió trabajando para no dejar sin atención al equipo. Se equivocó al transcribir una dosis y otra médica corrigió a tiempo.

**Presente y personalidad:** Es tranquilo, cuenta historias cómicas y se queda dormido leyendo novelas. Quiere sostener al grupo sin parecer una carga.

**Cambio:** Introduce doble control y relevo, registra su error sin exponer pacientes. El descanso no cura de inmediato cualquier lesión.

**Vínculos:** Noemí, Salma, Helena. **Naturaleza:** persona_viva. **Hogar planificado:** `estacion_celia_vivienda_04`.

#### El turno de quien cuida · `V_orbita_said`

**Primeros años y lo que aprendió a querer:**

Said eligió medicina para trabajar con preguntas concretas y aprendió que una explicación buena necesitaba tiempo. En puestos anteriores compartía turnos con más personas. La estación ofreció oficio importante y menos relevo; le gustaba conocer a pacientes también como colegas. Esa cercanía empezó a hacer cada descanso parecer una retirada de alguien querido.

**Aprendizaje, decisiones y vínculos:**

Detectó fatiga propia y continuó. Un error de transcripción de dosis fue corregido a tiempo por otra médica; no hubo una muerte inventada que hiciera dramático el cambio. Said sintió alivio y vergüenza, y quiso compensar trabajando más. La respuesta habría reproducido el riesgo que acababa de observar.

**Lo que cambia y lo que todavía pesa:**

La misión organiza turnos, segunda revisión y pausa con reserva clínica. No abandona a una estación desprovista de atención ni convierte su cuerpo en fuente infinita. Said puede reconocer talento de quien lo corrigió sin tratarla como asistente de una autoridad intacta. Se atiende a sí mismo con las mismas condiciones que recomendaría a un compañero.

**Cuando no ofrece una misión:**

Le gusta preparar café para conversación que no debe terminar en ficha. Tras el arco firma cuando está apto y pide relevo antes de que un error lo obligue. Puede vivir una tarde tranquila sin que ocurra nada que pruebe que merecía descansar.

**Ante Fuatia:**

No confunde la presencia elemental de Fuatia con atención clínica garantizada. Si la diosa quiere castigar a alguien en la estación, Said reclama aire y tratamiento para quien lo necesite. El cuidado se sostiene por necesidades, no por afinidad del paciente con una alianza divina.

**Conversaciones personales:**

##### VID_orbita_said_1 · Antes del cambio

> **Said:** Reconocí fatiga y seguí. Cuando corrigieron la dosis quise quedarme más horas para demostrar atención.
> **Tessa:** ¿Era la misma respuesta que habrías recomendado a otra persona?
> **Said:** No. Me trataba como si descansar tuviera otro significado cuando yo lo hacía.
> **Tessa:** Podemos preparar un turno que no espere a tu siguiente error.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_orbita_said_2 · Después del arco personal

> **Said:** Pedí relevo antes de la última consulta. Quedó otra profesional y una reserva clara.
> **Helena:** ¿Y cómo estuvo tu tarde?
> **Said:** Bastante común. Cociné, hablé y no tuve que merecerlo con una crisis evitada.
> **Helena:** Quiero aprender esa forma de contar un éxito.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar protocolo anonimizado.

> **Said:** La receta se corrigió a tiempo. Yo también necesito corregir mi turno.

**Acto 2:** Preparar relevo y verificación por pares.

> **Said:** Pedir otro médico no significa que los abandone. Significa que dejan de depender de mi agotamiento.

**Acto 3:** Publicar horario de descanso y atención alternativa.

> **Said:** Esta noche no estaré disponible. El servicio sí tendrá un responsable.

**Acceso narrativo:** después de `P16` y visita autorizada. **Decisión antes del acto 3:** Relevo remoto o presencial.

> **Said · respuesta 1:** Remoto: No prometerá atención que exija equipo ausente.

> **Said · respuesta 2:** Presencial: Tendrá recursos y capacidad publicados.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El turno de quien cuida». Guía de relevo y doble control anonimizada, sin curar lesiones por leerla. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Rita · `orbita_rita`

**Pasado:** Rita, 38, administró carga terrestre y encontró duplicados de recibos que parecía más fácil corregir en silencio. El inventario quedó bien, pero nadie pudo explicar por qué faltaba una reserva de retorno.

**Presente y personalidad:** Es eficiente, disfruta cocinar con Ciro y guarda sellos por sus dibujos. Quiere orden y teme que una anotación de error se vuelva acusación eterna.

**Cambio:** Conserva historial de cambios y procedencia, distingue préstamo de consumo y nunca crea objetos para cuadrar tablas.

**Vínculos:** Paloma, Telmo, Fabián. **Naturaleza:** persona_viva. **Hogar planificado:** `estacion_celia_vivienda_04`.

#### La caja en dos columnas · `V_orbita_rita`

**Primeros años y lo que aprendió a querer:**

Rita aprendió carga en tierra donde un paquete que llegaba bien podía esconder una ruta muy distinta a la factura. Le gustaba explicar a un viajero qué traía antes de salir, no descubrirlo con urgencia después. Al coordinar órbita recibió más documentos y menos tiempo. Una corrección rápida parecía servicio eficiente para quienes no querían esperar otra revisión.

**Aprendizaje, decisiones y vínculos:**

Encontró recibos duplicados y los arregló en silencio. El inventario resultó correcto, pero borró el camino necesario para saber dónde se había gastado reserva de retorno. Pensaba que dejar trazas de error haría desconfiar de un equipo que ya iba a volar. La limpieza del presente quitó información al siguiente viaje.

**Lo que cambia y lo que todavía pesa:**

La misión conserva original, corrección y transferencia confirmada. No contar dos veces un hallazgo ni una reserva es parte de cuidar. Rita puede comunicar retraso sin culpar a un documento como si nadie hubiera decidido cómo interpretarlo. La Liga de Rutas Abiertas requiere agua, aire y manifiestos reales; no libre paso ficticio sin capacidad.

**Cuando no ofrece una misión:**

Guarda postales y compra una comida que no viaja bien porque justamente puede comerla allí. Tras el arco distingue traslado de creación de recurso y deja procedencia legible. Puede admitir un error sin narrar todo el equipo como desastre.

**Ante Fuatia:**

La intervención de Fuatia será un aporte registrado, no una reserva duplicable. Rita defenderá que el balance elemental tenga la misma honestidad de transferencia que sus manifiestos. Si la diosa ayuda a un territorio, los demás necesitan saber qué se cedió sin inventar una recompensa económica por leerlo.

**Conversaciones personales:**

##### VID_orbita_rita_1 · Antes del cambio

> **Rita:** Las cantidades quedaron bien. Borré la parte que mostraba de dónde salió el cambio.
> **Boris:** Por eso la siguiente reserva parecía faltar sin que nadie la hubiera usado.
> **Rita:** Quería evitar una discusión antes de volar.
> **Boris:** Y la trasladamos a una jornada con menos alternativas.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_orbita_rita_2 · Después del arco personal

> **Rita:** Dejé el recibo duplicado marcado y la transferencia correcta al lado.
> **Ivo:** ¿No te molesta ver las dos hojas?
> **Rita:** Un poco. Me ayuda pensar que la siguiente persona no tendrá que inventar mi recorrido.
> **Ivo:** Hoy podemos guardar las hojas y mirar una postal sin buscarle un destino de carga.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Seguir lote y dos recibos.

> **Rita:** La caja no puede estar en dos naves porque aparezca en dos hojas.

**Acto 2:** Conciliar depósito sin alterar saldo ficticiamente.

> **Rita:** Corregí la cifra y borré el camino. Necesitamos las dos cosas.

**Acto 3:** Publicar corrección y reservar regreso.

> **Rita:** El historial mostrará por qué cambió. No volveremos a inventar una caja para arreglar una suma.

**Acceso narrativo:** después de `P16` y visita autorizada. **Decisión antes del acto 3:** Auditoría por ruta o por lote.

> **Rita · respuesta 1:** Ruta: Mantendrá cada entrega y reserva.

> **Rita · respuesta 2:** Lote: Mantendrá transferencias sin contarlas como producción.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La caja en dos columnas». Manifiesto por lote o ruta con transferencias distintas de nuevos hallazgos. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## huerto_aurelia

### Aitana · `aurelia_aitana`

**Pasado:** Aitana, 32, agrónoma, consiguió un lote extraordinario bajo luz intensa y convirtió un resultado en estándar. Flora reprodujo la prueba con otra planta y mostró daño.

**Presente y personalidad:** Es optimista, cultiva flores por gusto y habla de potencial antes de costos. Desea volver a cultivar una flor sin publicar su tasa de crecimiento. Su alegría científica es sincera, pero teme que la calma no parezca trabajo.

**Cambio:** Estudia condiciones específicas y publica resultados negativos. Su técnica no concede cosechas instantáneas. Recupera aquella flor al final de la visita: el gusto privado por una planta no necesita convertirse en resultado universal.

**Vínculos:** Flora, Valentina, Kiara. **Naturaleza:** persona_viva. **Hogar planificado:** `huerto_aurelia_vivienda_01`.

#### El sol que no sirve para todo · `V_aurelia_aitana`

**Primeros años y lo que aprendió a querer:**

Aitana estudiaba cultivo porque una misma planta cambiaba según el cuidado recibido. Le encantaban pruebas lentas donde debía observar antes de sacar una conclusión. Una muestra bajo luz intensa produjo un lote extraordinario y recibió un nombre asociado al suyo. Al repetirse el elogio empezó a pensar que todos los siguientes ensayos debían superar aquel primero.

**Aprendizaje, decisiones y vínculos:**

Aplicó intensidad como estándar y otras plantas sufrieron daño. Flora reprodujo con distinta especie; Aitana respondió que el método requería preparación suficiente. No había calculado que el objeto de estudio también cambiaba condiciones. El éxito se volvió una excepción usada como regla para no perder autoridad.

**Lo que cambia y lo que todavía pesa:**

La misión compara especies y descanso, publica límite y mantiene costos de instalación. Aurelia no ofrece crecimiento gratuito ni altera el calendario agrícola al leer una ficha lunar. Aitana conserva una técnica útil donde corresponde y reconoce que no es mejor para todo. Puede disfrutar que un cultivo crezca de forma corriente sin ponerlo a competir con su nombre.

**Cuando no ofrece una misión:**

Hace dibujos de sombras, comparte ensayos con personas que no quieren trabajar en ellos y disfruta comida de tierra sin llamarla menos avanzada. Tras el arco anuncia condiciones antes del rendimiento. Puede seguir queriendo un descubrimiento grande sin exigirlo a cada planta.

**Ante Fuatia:**

Fuatia podría cambiar luz y calor a escala enorme, pero Aitana le pide balance de agua antes de celebrar producción. No trata una bendición como técnica reproducida por laboratorio. Cada ayuda conserva fuente y no convierte el suelo de otro territorio en costo invisible.

**Conversaciones personales:**

##### VID_aurelia_aitana_1 · Antes del cambio

> **Aitana:** La muestra extraordinaria tenía nombre. La que sufrió quedó como observación secundaria.
> **Flora:** Las dos estaban diciendo algo del método.
> **Aitana:** Me costaba darles el mismo espacio porque una defendía mi carrera.
> **Flora:** Tu carrera puede incluir aprender dónde termina una técnica.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_aurelia_aitana_2 · Después del arco personal

> **Aitana:** El lote de hoy es corriente y quedó completo en el registro.
> **Kiara:** ¿Podemos comer una parte sin compararla otra vez?
> **Aitana:** Sí. Quiero disfrutar que salió, no solo medir cuánto le faltó al extraordinario.
> **Kiara:** Esa también parece una buena jornada lunar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Medir luz en dos sectores.

> **Aitana:** Este brote creció mejor. No significa que toda planta quiera la misma luz.

**Acto 2:** Ensayar cultivo compatible con estación.

> **Aitana:** Flora no discutía mi alegría. Discutía la frase para todos.

**Acto 3:** Publicar respuesta y límites sin multiplicar rendimiento.

> **Aitana:** La ficha dirá especie, condiciones y lo que todavía no sabemos.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Sombra ajustable o lote pequeño.

> **Aitana · respuesta 1:** Sombra: El ajuste consumirá trabajo y respetará el cultivo.

> **Aitana · respuesta 2:** Pequeño: No ampliará producción sin otra medición.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El sol que no sirve para todo». Comparador de luz por especie y condiciones, sin elevar rendimiento de todas las plantas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Óscar · `aurelia_oscar`

**Pasado:** Óscar, 45, técnico solar, acumuló baterías usadas creyendo que una reserva enorme era buena por definición. Varias perdieron capacidad y estorbaron inspecciones.

**Presente y personalidad:** Es bromista, colecciona relojes y tiene apego a objetos que podrían servir. Quiere no desperdiciar.

**Cambio:** Mide capacidad, recicla con trazabilidad y distingue almacenamiento de generación infinita. Guarda una sola carcasa por recuerdo y lo dice así. No necesita inventarle utilidad para justificar que le tenga cariño.

**Vínculos:** Boris, Raimundo, Lázaro. **Naturaleza:** persona_viva. **Hogar planificado:** `huerto_aurelia_vivienda_01`.

#### La reserva que todavía funciona · `V_aurelia_oscar`

**Primeros años y lo que aprendió a querer:**

Óscar aprendió energía intentando que un hogar pudiera conservar luz después del turno de trabajo. Disfrutaba una reparación que dejaba a otra persona escoger cómo pasar la noche. Guardó baterías usadas porque había visto lo que costaba esperar una pieza nueva. La reserva comenzó como previsión útil, no como deseo de acumular todo lo posible.

**Aprendizaje, decisiones y vínculos:**

Las baterías perdían capacidad y ocupaban lugar de inspección. Óscar sumaba unidades como si el número garantizara disponibilidad. Retirar una le parecía volver a la escasez que había conocido. Decía que quien proponía ordenar no comprendía una emergencia, aunque el depósito ya dificultaba detectar fallos.

**Lo que cambia y lo que todavía pesa:**

La misión mide capacidad, separa reparación y descarte seguro, conserva reserva útil sin un almacén infinito. No se destruye material para demostrar desprendimiento emocional. Óscar aprende a distinguir lo que puede sostener un retorno de aquello que únicamente lo tranquiliza al contarlo.

**Cuando no ofrece una misión:**

Le gusta reparar una lámpara pequeña que no compite con el sistema lunar. Tras el arco anota capacidad y fecha en vez de celebrar solo volumen. Puede quedarse mirando una luz que otros encendieron mientras él descansaba.

**Ante Fuatia:**

La diosa es fuego y aire, y Óscar no le pide almacenar calor sin consecuencia. Un favor de Fuatia tampoco hace eterna una batería. Quiere una infraestructura que respete pérdidas, recuperación y balance sin presentar todo consumo humano como una guerra contra los elementos.

**Conversaciones personales:**

##### VID_aurelia_oscar_1 · Antes del cambio

> **Óscar:** Tenía cuarenta unidades y no sabía cuánto podían entregar juntas.
> **Boris:** El número se parecía a reserva más que la capacidad medida.
> **Óscar:** Retirar una me hacía sentir otra vez sin recursos.
> **Boris:** Podemos reparar algunas y dejar paso para inspeccionarlas. La reserva también necesita espacio.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_aurelia_oscar_2 · Después del arco personal

> **Óscar:** Hoy conté capacidad y dejé fuera las que aún no funcionan.
> **Aitana:** ¿Te parece un depósito más pequeño?
> **Óscar:** Sí. También más honesto. Y por fin encuentro mi lámpara sin mover todo.
> **Aitana:** Me gustaría verla encendida sin que tengamos que llamarla contingencia.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Medir tres baterías.

> **Óscar:** Si nadie puede decir cuánto guarda, esa batería no es una reserva. Es una esperanza pesada.

**Acto 2:** Separar reparación y descarte con recibos.

> **Óscar:** Lázaro me pidió dejar de llamar repuesto a cualquier cosa que no quería soltar.

**Acto 3:** Preparar reserva demostrada y calendario de revisión.

> **Óscar:** Se quedarán menos. Sabremos qué pueden hacer.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Reparación o reciclaje.

> **Óscar · respuesta 1:** Reparación: Consumirá piezas y conservará límite medido.

> **Óscar · respuesta 2:** Reciclaje: El material recuperado será menor que el invertido.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La reserva que todavía funciona». Plano de soporte reparable de batería; capacidad depende de medición, no del plano. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Kiara · `aurelia_kiara`

**Pasado:** Kiara, 28, bióloga, defendió llevar abejas a todo invernadero. Un ecosistema cerrado necesitaba otro equilibrio; Amira le mostró pérdidas locales ocultas por promedios.

**Presente y personalidad:** Es curiosa, baila con música de trabajo y teme que la cautela detenga ciencia. Quiere pertenecer al grupo que decide, después de años de ser solo ayudante. Le preocupa que admitir límites vuelva a dejarla fuera.

**Cambio:** Ensaya de forma reversible y escucha a cuidadores. No libera fauna terrestre en otros mundos por misión.

**Vínculos:** Amira, Aitana, Edda. **Naturaleza:** persona_viva. **Hogar planificado:** `huerto_aurelia_vivienda_02`.

#### La visita que no invade · `V_aurelia_kiara`

**Primeros años y lo que aprendió a querer:**

Kiara aprendió biología observando un huerto donde distintos polinizadores aparecían sin un plan humano total. Le gustaban diferencias pequeñas que un visitante ignoraba. Un proyecto de colmenas demostró beneficio y abrió trabajo estable. Su entusiasmo por una solución compartida la hizo empezar a hablar de cada invernadero como si necesitara la misma introducción.

**Aprendizaje, decisiones y vínculos:**

Los promedios mostraban mejora mientras un ecosistema local perdía espacio. Amira señaló consecuencias que Kiara no había incluido en el método. Respondió que las pruebas respaldaban rendimiento general y la crítica pedía mirar una distribución incómoda. Conservar el resultado agregado se había vuelto una forma de no decidir quién soportaba la pérdida.

**Lo que cambia y lo que todavía pesa:**

La misión compara diversidad, condiciones y densidad, propone recuperación sin obligar a una especie a ser útil comercialmente. Kiara no abandona investigación ni convierte la tradición local en infalible. Puede admitir un beneficio parcial y un perjuicio igualmente real. El coste de corregir se planifica en vez de esconderlo tras una consigna de cuidado sin precio.

**Cuando no ofrece una misión:**

Dibuja insectos para recordar forma sin capturarlos y se divierte con dibujos inventados de niños supervisados. Tras el arco mide sectores por separado. Puede vivir una visita agradable donde no deba volver cada paisaje una propuesta profesional.

**Ante Fuatia:**

Fuatia habla con animales y Kiara quiere escuchar también a los que no integran el rebaño útil de una finca. La diosa podría intervenir por balance antes que por productividad. Kiara negociará necesidades sin afirmar que una especie introducida vale más porque aumente un promedio.

**Conversaciones personales:**

##### VID_aurelia_kiara_1 · Antes del cambio

> **Kiara:** El promedio mejoró. Lo repetía mientras Amira señalaba justamente el lugar que perdía.
> **Amira:** Yo había culpado tus flores por no mirar mi densidad. Ninguna necesita fingir que solo falló la otra.
> **Kiara:** Podemos conservar los dos resultados separados.
> **Amira:** Y acordar recuperación sin pedir que el número se vuelva una disculpa.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_aurelia_kiara_2 · Después del arco personal

> **Kiara:** Hoy observé una visita sin proponer otra colmena.
> **Aitana:** ¿Te sigue interesando el paisaje?
> **Kiara:** Muchísimo. Me gusta descubrir que interés no siempre necesita instalar algo.
> **Aitana:** Entonces sentémonos a ver qué ya está ocurriendo.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar polinización en recinto.

> **Kiara:** Transportar una abeja también transporta necesidades. Mi maleta no las resolvía.

**Acto 2:** Comparar dos métodos sin liberar especies.

> **Kiara:** Edda preguntó quién había invitado a la especie. Nunca puse esa casilla.

**Acto 3:** Registrar balance y plan de retiro.

> **Kiara:** El recinto tendrá salida para retirar la prueba, no para soltarla sin control.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Método manual o recinto limitado.

> **Kiara · respuesta 1:** Manual: Exige trabajo, no producción gratuita.

> **Kiara · respuesta 2:** Recinto: No permite colonizar hábitats exteriores.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La visita que no invade». Guía de ensayo de polinización manual o cerrado, sin liberar fauna ni colonizar mundos. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Saúl · `aurelia_saul`

**Pasado:** Saúl, 36, cocinero, vendió néctar con etiqueta lunar aunque mezclaba cosechas terrestres. No era alimento peligroso; era una historia comercial falsa que encarecía el producto.

**Presente y personalidad:** Es simpático, aprecia sabores simples y disfruta inventar nombres de postres. Quiere distinción sin admitir mezclas.

**Cambio:** Etiqueta origen y ofrece recetas equivalentes. Una palabra mítica no mejora energía del plato. Una receta mixta sigue vendiéndose y le enseña que sus clientes podían querer el sabor sin comprar la historia exagerada.

**Vínculos:** Simón, Ciro, Aitana. **Naturaleza:** persona_viva. **Hogar planificado:** `huerto_aurelia_vivienda_02`.

#### La etiqueta que sabe igual · `V_aurelia_saul`

**Primeros años y lo que aprendió a querer:**

Saúl empezó cocina vendiendo alimentos que viajeros podían reconocer lejos de casa. Le gustaba adaptar una receta sin fingir que había nacido allí. En Aurelia una cosecha diferente le dio una oportunidad comercial y clientes interesados en procedencia. La palabra lunar aparecía más en encargos que el sabor que había trabajado durante años.

**Aprendizaje, decisiones y vínculos:**

Mezcló cosechas terrestres y vendió néctar como enteramente lunar. No era peligroso, pero el relato falso aumentaba precio y ocultaba transporte. Defendía calidad al recibir preguntas de origen. Su carrera había empezado valorando adaptaciones y terminó escondiendo justamente la mezcla que daba al producto su gusto.

**Lo que cambia y lo que todavía pesa:**

La misión corrige etiqueta, precio y recibo sin tirar alimento seguro. Puede conservar la receta y celebrar una combinación auténtica. Saúl tiene que explicar a compradores qué pagaron, no únicamente presentar un envase nuevo. El comercio entre mundos necesita información que permita decidir, no una distancia convertida en prestigio vacío.

**Cuando no ofrece una misión:**

Cocina porciones pequeñas para probar con amigos y tiene una receta terrestre que no quiere adaptar. Tras el arco etiqueta aportes de cada cultivo sin avergonzarse de depender de otros lugares. Puede ganar dinero por un plato bueno sin inventarle exclusividad.

**Ante Fuatia:**

No venderá bendición de Fuatia como ingrediente. La diosa puede proteger una cosecha y no convertir todos sus derivados en producto elemental superior. Saúl pediría permiso de usar el relato y conservaría trazabilidad aunque la aparición pareciera buena publicidad.

**Conversaciones personales:**

##### VID_aurelia_saul_1 · Antes del cambio

> **Saúl:** La mezcla sabía bien. Yo contestaba eso cuando preguntaban de dónde venía.
> **Valentina:** En mi balance también usé comida segura para esconder una procedencia distinta.
> **Saúl:** Antes me enorgullecía adaptar. Después empecé a llamarlo lunar como si tierra fuera una vergüenza.
> **Valentina:** Podemos servir la mezcla con todos sus lugares presentes.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_aurelia_saul_2 · Después del arco personal

> **Saúl:** Esta etiqueta dice lo que mezclamos. Vendió menos al principio y alguien volvió por el sabor.
> **Óscar:** ¿Te parece una noticia bastante buena?
> **Saúl:** Sí. Hoy no necesito que el cliente compre también una aventura que no vivió.
> **Óscar:** Entonces podemos disfrutar un vaso que no pretenda ser un tratado.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Seguir ingredientes de lote.

> **Saúl:** El sabor no estaba mintiendo. La etiqueta sí.

**Acto 2:** Cocinar receta ordinaria y comparar gusto.

> **Saúl:** Simón probó la mezcla y le gustó. Yo era quien creía que debía esconderla.

**Acto 3:** Corregir etiqueta y precio de origen.

> **Saúl:** Dirá de dónde viene cada parte. No perderá cariño por perder una exageración.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Receta mixta o lote de origen único.

> **Saúl · respuesta 1:** Mixta: Tendrá precio y procedencia visibles.

> **Saúl · respuesta 2:** Único: Dependerá de disponibilidad, no de promesa perpetua.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La etiqueta que sabe igual». Variante de receta de néctar con origen etiquetado y mismo efecto alimentario. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## vigia_nocturna

### Matea · `nocturna_matea`

**Pasado:** Matea, 40, navegante, siguió una estrella de referencia cuando una nube de ceniza alteró visibilidad. El desvío no causó muertos, pero dejó a una nave usando su reserva.

**Presente y personalidad:** Es calmada, colecciona cuentos del cielo y quiere que todos amen la noche tanto como ella.

**Cambio:** Calibra con referencias independientes y distingue tránsito de almas de rutas físicas. No guía por corazonadas sobrenaturales.

**Vínculos:** Nerea, Dexo, Naim. **Naturaleza:** persona_viva. **Hogar planificado:** `vigia_nocturna_vivienda_01`.

#### Dos referencias para una noche · `V_nocturna_matea`

**Primeros años y lo que aprendió a querer:**

Matea aprendió navegación viendo a una maestra revisar referencias antes de confiar en su familiaridad. Le gustaba orientarse y también las comidas donde podían contar cómo se habían perdido sin perder respeto. Una estrella estable se convirtió en su apoyo más cómodo. Con experiencia empezó a tratarla como certeza en vez de referencia que también requería contexto.

**Aprendizaje, decisiones y vínculos:**

La nube de ceniza alteró visibilidad y siguió la estrella cuando debía cruzar otra medida. La nave usó reserva de retorno para corregir. Nadie murió, pero llegó con menos alternativa y un puesto tuvo que reorganizar turnos. Matea quiso describirlo como ajuste normal para que colegas no cuestionaran cada salida futura.

**Lo que cambia y lo que todavía pesa:**

La misión conserva dos referencias independientes, coste y aviso de degradación. No exige una persona incapaz de orientarse nunca mal ni acepta que un trayecto exitoso borre consumo adicional. Nocturna orienta tránsito; no convierte almas en combustible ni garantiza por un presagio que la nave esté segura.

**Cuando no ofrece una misión:**

Disfruta puzzles de orientación sin necesidad de público y cambia una ruta por gusto cuando hay reserva. Tras el arco reconoce referencia faltante sin volverse incapaz de pilotar. Puede dejar instrumentos a otro y recordar una comida del viaje en vez de toda desviación.

**Ante Fuatia:**

La presencia de Fuatia en aire y polvo puede dar un aviso valioso, pero Matea no la usa como referencia única. Quiere cooperación elemental con alternativas verificables. Una deidad neutral podría priorizar otro balance y eso debe caber dentro de la preparación del puesto.

**Conversaciones personales:**

##### VID_nocturna_matea_1 · Antes del cambio

> **Matea:** La estrella seguía ahí. Yo quería que eso bastara para decir que el rumbo seguía siendo el mismo.
> **Dexo:** ¿Cuánto consumió corregirlo?
> **Matea:** Más de lo que aparecía en mi primera descripción. Todavía había usado ajuste para ocultarlo.
> **Dexo:** Podemos registrar lo que gastamos sin convertir el viaje en una vergüenza total.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nocturna_matea_2 · Después del arco personal

> **Matea:** Hoy faltó una referencia y elegimos el método alternativo antes de perder rumbo.
> **Gaspar:** ¿La imagen estaba menos hermosa?
> **Matea:** Sí. Llegamos con reserva y vimos igual una parte bonita del camino.
> **Gaspar:** Me gusta que el instrumento no tenga que ganar también un concurso de vistas.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar señal lunar y baliza.

> **Matea:** Una luna hermosa también puede estar oculta. La ruta tiene que seguir siendo comprensible.

**Acto 2:** Simular pérdida de referencia.

> **Matea:** Nerea no pidió apagar mis cuentos. Pidió que no fueran el único instrumento de vuelo.

**Acto 3:** Publicar retorno con dos métodos independientes.

> **Matea:** La nave podrá volver aunque no vea la estrella.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Instrumento redundante o puerto alterno.

> **Matea · respuesta 1:** Instrumento: Tendrá calibración y consumo visibles.

> **Matea · respuesta 2:** Puerto: Exige permiso y combustible reales.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Dos referencias para una noche». Plan de vuelta con referencias independientes, consumo y puerto alterno autorizado. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Elvira · `nocturna_elvira`

**Pasado:** Elvira, 34, estudió plantas nocturnas y llevó una a una exposición iluminada hasta dañarla. Había defendido su rareza mientras ignoraba sus necesidades.

**Presente y personalidad:** Es reservada, disfruta leer en penumbra y hace chistes sobre macetas dramáticas. Desea enseñar la belleza nocturna a alguien paciente. La exhibición fallida la llevó a creer que ninguna visita podría entender su oficio.

**Cambio:** Diseña exhibiciones sin alterar reposo. Los animales oscuros se crían en Celia con hogar adecuado, no en depósitos de almas.

**Vínculos:** Luz, Milena, Liora. **Naturaleza:** persona_viva. **Hogar planificado:** `vigia_nocturna_vivienda_01`.

#### La belleza que necesita sombra · `V_nocturna_elvira`

**Primeros años y lo que aprendió a querer:**

Elvira estudiaba plantas nocturnas porque le gustaba un cuidado que visitantes debían aprender despacio. Algunas especies no lucían como esperaba una exposición y ella disfrutaba explicar la diferencia. Una invitación importante prometió dar visibilidad a su trabajo. Empezó a pensar cómo hacer que la planta se viera mejor bajo luces diseñadas para otra vida.

**Aprendizaje, decisiones y vínculos:**

La exposición la dañó. Elvira había insistido en rareza y no preguntó cuánto tiempo soportaría ambiente. Quiso conservar fotografías como prueba de que el proyecto sí había tenido valor. La muestra había sido observada por mucha gente y esa cifra no compensaba lo que necesitaba el ser que llevó allí.

**Lo que cambia y lo que todavía pesa:**

La misión programa observación compatible con oscuridad y regreso, sin poner una planta al servicio de cada visita. Elvira puede enseñar una especie mediante dibujo o explicación si no conviene mostrarla directamente. Su interés científico no depende de poseer un ejemplar cada vez ni de producir una escena más impresionante.

**Cuando no ofrece una misión:**

Tiene una maceta corriente por gusto, lee bajo luz tenue suficiente y pasea sin fotografiarlo todo. Tras el arco pregunta qué necesita el ejemplar antes de acordar una exhibición. Puede rechazar un honor profesional y conservar deseo de que el oficio sea conocido.

**Ante Fuatia:**

Fuatia siente agua y calor de una planta y Elvira quiere escuchar ese conocimiento sin obligarla a lucirse. Le pediría una visita discreta si la aparición luminosa altera descanso. Una diosa amorosa puede aceptar que su aspecto no deba dominar cada encuentro.

**Conversaciones personales:**

##### VID_nocturna_elvira_1 · Antes del cambio

> **Elvira:** En la fotografía se veía extraordinaria. La usé para no mirar la ficha de daño.
> **Valentina:** La exposición recibió aplausos y la planta no recibió condiciones.
> **Elvira:** Me gustaría conservar la imagen sin anunciar que fue un ejemplo correcto.
> **Valentina:** Puedes identificar cómo se tomó. También forma parte de lo que aprendiste.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nocturna_elvira_2 · Después del arco personal

> **Elvira:** Hoy mostré el dibujo. Una visita prefirió no ver la planta si había que alterar su noche.
> **Naim:** ¿Sentiste que habías ofrecido menos?
> **Elvira:** Al comienzo. Después tuvimos una conversación más larga de la que permite una fotografía.
> **Naim:** Quiero aprender esa manera de observar sin reclamar entrada.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Registrar luz del hábitat.

> **Elvira:** Que podamos verla no es la primera necesidad de esta planta.

**Acto 2:** Preparar exhibición reversible con refugio.

> **Elvira:** Luz quería que el refugio permitiera elegir oscuridad. Yo quería una foto mejor.

**Acto 3:** Mostrar planta sin sacrificar reposo.

> **Elvira:** La visita tendrá horarios y ventanas. La planta no será decoración disponible siempre.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Exhibición breve o ficha ilustrada.

> **Elvira · respuesta 1:** Breve: Dejará refugio accesible.

> **Elvira · respuesta 2:** Ficha: No fingirá haber cultivado una pieza por imprimirla.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La belleza que necesita sombra». Plano de exhibición reversible de planta con sombra y refugio; no altera su reposo. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Gaspar · `nocturna_gaspar`

**Pasado:** Gaspar, 53, fabricó lentes y vendió precisión que no había calibrado porque la imagen se veía nítida. Una medición errónea afectó el trabajo de Nerea.

**Presente y personalidad:** Es amable, aprecia detalles diminutos y canta al pulir. Quiere que su arte sea tratado como ciencia.

**Cambio:** Publica tolerancias, repara equipos y acepta que una imagen bella no equivale a un dato correcto.

**Vínculos:** Nerea, Petra, Pía. **Naturaleza:** persona_viva. **Hogar planificado:** `vigia_nocturna_vivienda_02`.

#### Lo nítido y lo verdadero · `V_nocturna_gaspar`

**Primeros años y lo que aprendió a querer:**

Gaspar reparaba lentes con paciencia por una imagen que podía ayudar a orientarse. Le gustaba que un cristal aparentemente pequeño hiciera visible otra distancia. Un cliente elogió claridad y él empezó a usar nítido como prueba de precisión. Eran cualidades relacionadas y distintas, algo que sabía estudiar mejor de lo que conseguía explicar en una venta.

**Aprendizaje, decisiones y vínculos:**

Entregó un instrumento sin calibración completa. La vista hermosa hizo fácil aceptar el pago y posponer medida. Nerea trabajó con una lectura errónea y Gaspar respondió primero que podía verse bien el objeto observado. Estaba defendiendo una cualidad que la clienta nunca había reclamado como insuficiente.

**Lo que cambia y lo que todavía pesa:**

La misión compara patrones, calibra y conserva límites térmicos descubiertos por Pía. No hace que todo prisma encontrado sirva para cualquier arma o nave. Gaspar puede ofrecer lentes bellos para mirar y otros adecuados para medir sin confundir la expectativa. Retirar una promesa falsa no destruye una habilidad óptica real.

**Cuando no ofrece una misión:**

Colecciona cristales que no instala en instrumentos y disfruta mirar paisajes sin escala. Tras el arco entrega ficha de calibración y fecha. Puede devolver un importe por función incumplida aunque el cliente siga apreciando la pieza como objeto.

**Ante Fuatia:**

El color de ojos de Fuatia puede deslumbrar y no prueba aprobación moral de una lectura. Gaspar no venderá una lente que supuestamente revela culpa elemental. Escuchar a la diosa exige lenguaje y contexto; medir aire o luz no abre la mente de una persona.

**Conversaciones personales:**

##### VID_nocturna_gaspar_1 · Antes del cambio

> **Gaspar:** Se veía nítido. Repetí esa defensa cuando Nerea preguntaba por una cifra incorrecta.
> **Pía:** A mi prisma le pasó algo parecido: estable era una prueba de una sola temperatura.
> **Gaspar:** Podemos devolver la función que prometimos sin negar lo hermoso que sí había.
> **Pía:** Empecemos por escribir cuál propiedad todavía falta medir.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nocturna_gaspar_2 · Después del arco personal

> **Gaspar:** Esta lente es para mirar. La otra tiene calibración y un límite térmico indicado.
> **Matea:** Por fin puedo escoger sin descifrar cuánto significa perfecto.
> **Gaspar:** Me costó dejar de usar esa palabra. Ahora quiero mirar una vista sin venderla.
> **Matea:** Te acompaño, si no convertimos el paseo en otra prueba.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar lente con patrón.

> **Gaspar:** Yo veía bien. Nerea medía mal. Mi frase de precisión no tenía prueba.

**Acto 2:** Reajustar pieza usando materiales normales.

> **Gaspar:** La tolerancia no es una vergüenza pequeña debajo de la ficha. Es parte del instrumento.

**Acto 3:** Documentar tolerancia y fecha de calibración.

> **Gaspar:** Aquí dice hasta dónde sirve. Ahora sí puede usarse con confianza.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Lente de observación o de medición.

> **Gaspar · respuesta 1:** Observación: No se venderá como medidor exacto.

> **Gaspar · respuesta 2:** Medición: Mantendrá calibración y límite documentados.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `tecnica` y recuerdo «Lo nítido y lo verdadero». Método de calibración de lente o ficha de uso limitado; no concede visión de todo el mapa. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Naim · `nocturna_naim`

**Pasado:** Naim, 30, observador vivo del tránsito de Lara, comenzó a registrar detalles de despedidas por fascinación. Serena le enseñó que una autorización de observación no cubre toda historia privada.

**Presente y personalidad:** Es contemplativo, disfruta dibujar sombras y tiende a hablar solemne cuando está nervioso. Quiere compartir asombro sin convertirlo en una afirmación divina. Su ceremonia verbal suele esconder una pregunta mucho más sencilla.

**Cambio:** Registra rutas sin identidades y permite que un testigo retire autorización. No almacena almas ni promete mensajes de fallecidos.

**Vínculos:** Serena, Iria, Nilo. **Naturaleza:** persona_viva. **Hogar planificado:** `vigia_nocturna_vivienda_02`.

#### Lo que no debo anotar · `V_nocturna_naim`

**Primeros años y lo que aprendió a querer:**

Naim sintió curiosidad por tránsito antes de obtener autorización para observarlo. Le impresionaba que una salida pudiera ocurrir con serenidad y quería aprender de todo detalle. La fascinación convivía con respeto, pero empezó a dar por hecho que conocer más siempre permitiría cuidar mejor. Una libreta se volvió acompañante de momentos que no todos deseaban conservar.

**Aprendizaje, decisiones y vínculos:**

Registró detalles privados de despedidas porque le parecían importantes. Serena preguntó si el permiso incluía nombres y palabras íntimas. Naim había leído autorización de presencia como autorización de relato. No planeaba comerciar con recuerdos; aun así quien no pidió el registro no debía pagar su curiosidad.

**Lo que cambia y lo que todavía pesa:**

La misión distingue observación funcional, contenido consentido y retirada. Naim está vivo y no procesa almas como recurso lunar. El tránsito pertenece a Lara; Nocturna permite orientación y estudio autorizado, no acceso ilimitado a toda historia. Puede aprender de un patrón sin necesitar identificar cada vida que pasó.

**Cuando no ofrece una misión:**

Dibuja estrellas por forma y juega con mapas imaginados fuera de su libreta profesional. Tras el arco pregunta antes de registrar y admite que una persona diga no sin clasificarla como poco colaboradora. Puede recibir compañía sin traer un descubrimiento nuevo.

**Ante Fuatia:**

Fuatia siente materia y Naim no le atribuirá acceso a toda intimidad espiritual. Si habla con animales, también hay conversaciones que no necesita publicar. El prestigio de un testimonio divino no elimina la pregunta de quién aceptó que quedara en archivo.

**Conversaciones personales:**

##### VID_nocturna_naim_1 · Antes del cambio

> **Naim:** El permiso decía observar. Yo añadí nombres porque me parecía que volverían más humano el registro.
> **Serena:** Una persona no necesita aparecer en tu libreta para conservar humanidad.
> **Naim:** Quise aprender y me costó admitir cuánto de la pregunta era solamente mío.
> **Serena:** Podemos conservar lo útil que sí fue autorizado.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_nocturna_naim_2 · Después del arco personal

> **Naim:** Hoy no llevé nombres. Aprendí el patrón y dejé que la despedida siguiera siendo de quien la vivía.
> **Elvira:** ¿Sentiste que faltaba algo?
> **Naim:** Curiosidad. No la convertí en otra obligación para el visitante.
> **Elvira:** Entonces podremos conversar de lo que tú quieras contar, sin un informe al final.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar permisos de observación.

> **Naim:** Pude observar una ruta. Eso no me concedió la vida de quien pasó por ella.

**Acto 2:** Separar medición territorial de relato personal.

> **Naim:** Serena me preguntó si aceptaría que alguien hiciera eso con mi casa. Dejé de llamarlo estudio completo.

**Acto 3:** Destruir copia no autorizada y conservar solo dato permitido.

> **Naim:** La página tendrá menos detalles y más cuidado.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Informe anónimo o observación sin archivo.

> **Naim · respuesta 1:** Anónimo: No permitirá reconstruir identidades.

> **Naim · respuesta 2:** Sin archivo: Solo conservará cumplimiento del protocolo.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «Lo que no debo anotar». Informe territorial anónimo sin identidades de almas ni mensajes de muertos no autorizados. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## cantera_esmeralda

### Olmo · `esmeralda_olmo`

**Pasado:** Olmo, 43, minero lunar, llamó descubrimiento a una veta que un mapa local ya señalaba. Úrsula pidió procedencia y él respondió con el nombre del comprador.

**Presente y personalidad:** Es franco, disfruta piedras comunes y se pone rígido ante discusiones de autoría. Sueña con pagar un taller propio, no con descubrir algo legendario. Por eso reconocer mapas anteriores le parecía ceder su única ventaja.

**Cambio:** Reconoce mapa previo, limita extracción y conserva recibos separados de venta. La colaboración le deja un trabajo más continuo. Aprende que compartir un crédito no equivale a regalar su jornal.

**Vínculos:** Úrsula, Duna, Indira. **Naturaleza:** persona_viva. **Hogar planificado:** `cantera_esmeralda_vivienda_01`.

#### La veta que ya tenía historia · `V_esmeralda_olmo`

**Primeros años y lo que aprendió a querer:**

Olmo aprendió minería con mapas gastados por manos que no firmaban tratados. Le gustaba añadir una marca y saber que otra persona podría continuar. En la luna una compra importante pedía origen exclusivo; encontrar una veta le pareció una oportunidad de reconocimiento. Ya tenía un plano local que la señalaba, pero empezó a describirla como si el conocimiento naciera al llegar él.

**Aprendizaje, decisiones y vínculos:**

Úrsula pidió procedencia y respondió con comprador porque ese nombre daba prestigio. No demostraba extracción ni descubrimiento. Olmo quería conservar un mérito que sí tenía —haber completado una expedición— y lo mezclaba con uno anterior que correspondía a otros. Corregir podía afectar un contrato, no solo una frase del diario.

**Lo que cambia y lo que todavía pesa:**

La misión conserva mapa local, extracción real y transferencia. Olmo puede seguir produciendo material sin apropiarse de la historia del territorio. La luna no es un depósito disponible sin permiso y el regreso requiere aire. Una repetición de expedición entrega recursos reales, no un nuevo premio de descubrimiento por cada entrada.

**Cuando no ofrece una misión:**

Le gustan piedras que no procesa y dibuja señales sencillas para colegas. Tras el arco usa hallado siguiendo un mapa y conserva su firma en la extracción que sí realizó. Puede disfrutar una ruta vieja sin venderla como aventura inédita.

**Ante Fuatia:**

Fuatia siente su extracción y Olmo propone límites de recuperación de terreno. No le promete que una concesión humana determine todo balance; tampoco acepta que sentir una veta borre conocimiento local. La negociación requiere uso, volumen, tiempo y quienes ya dependían del sector.

**Conversaciones personales:**

##### VID_esmeralda_olmo_1 · Antes del cambio

> **Olmo:** Yo llegué a la veta. El mapa ya sabía dónde estaba y lo dejé fuera del relato.
> **Úrsula:** Puedes conservar la expedición sin quitar a otros el hallazgo anterior.
> **Olmo:** El contrato decía exclusivo. Me gustó demasiado la palabra.
> **Úrsula:** Revisemos qué parte del contrato dependía de una historia que no era cierta.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_esmeralda_olmo_2 · Después del arco personal

> **Olmo:** Volví por material, no por otro trofeo de descubrimiento.
> **Raimundo:** ¿La ruta conserva el nombre de quienes la señalaron?
> **Olmo:** Sí. Hoy quiero probar una variante que todavía no conozco.
> **Raimundo:** Te daré los movimientos del sector, con las dudas incluidas.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Contrastar mapa y extracción.

> **Olmo:** Encontrarla para mí no significa que nadie la hubiera encontrado.

**Acto 2:** Tomar muestra autorizada con límite.

> **Olmo:** La factura prueba que la vendí. No prueba que fuera mía la primera mirada.

**Acto 3:** Corregir crédito y plan de cierre.

> **Olmo:** El informe tendrá fuente, volumen y terreno que dejamos recuperar.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Muestra mínima o lectura in situ.

> **Olmo · respuesta 1:** Mínima: Consumirá permiso y registrará volumen.

> **Olmo · respuesta 2:** In situ: Dará el mismo dato principal sin objeto extra.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La veta que ya tenía historia». Ficha de veta, crédito y volumen de muestra, separada de precio de venta. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Indira · `esmeralda_indira`

**Pasado:** Indira, 35, técnica de resonancia, amplificó una lectura de maná para mostrar un resultado convincente. El sensor saturado ocultó variaciones necesarias para retorno.

**Presente y personalidad:** Es vivaz, disfruta ritmos irregulares y cree que toda discusión puede resolverse con una gráfica.

**Cambio:** Calibra sin saturar y escucha a quienes usan la lectura. Una marea de maná no llena automáticamente baterías.

**Vínculos:** Raimundo, Óscar, Orin. **Naturaleza:** persona_viva. **Hogar planificado:** `cantera_esmeralda_vivienda_01`.

#### El silencio del sensor lleno · `V_esmeralda_indira`

**Primeros años y lo que aprendió a querer:**

Indira estudiaba resonancia porque podía mostrar procesos que nadie percibía directamente. Una señal pequeña le resultaba fascinante y esperaba que otros también la miraran con cuidado. Presentaciones rápidas pedían gráficas claras. Aprendió a aumentar visibilidad y recibió elogios antes de separar cuánto podía amplificar sin perder diferencias necesarias.

**Aprendizaje, decisiones y vínculos:**

Una lectura de maná saturó el sensor. La gráfica parecía estable y ocultó variaciones de retorno. Indira quería un resultado convincente para sostener el proyecto, no producir una ruta insegura. Sin embargo, había escogido apariencia después de que el rango indicara límites. La intención no restauró la información retirada.

**Lo que cambia y lo que todavía pesa:**

La misión conserva señal bruta, calibración y parada segura. Orin había usado una resonancia como aprobación moral y ella conoce lo distinto que significa presión. El maná lunar no es un suministro infinito para bastones; se recupera, procesa y limita. Indira puede lograr una demostración interesante sin convertir una variación en defecto que necesite esconder.

**Cuando no ofrece una misión:**

Escucha música sin graficarla y guarda dibujos de señales por gusto. Tras el arco presenta una lectura poco vistosa con referencia a su escala. Puede recibir una pregunta de Orin sin convertirlo en ejemplo constante de interpretación mala.

**Ante Fuatia:**

Fuatia ofrece balance elemental, no un sello automático de aprobación de cada lectura de maná. Indira pedirá correlación y contexto antes de atribuir una señal a su voluntad. Una alianza divina no habilita convertir amplitud en combustible de combate ilimitado.

**Conversaciones personales:**

##### VID_esmeralda_indira_1 · Antes del cambio

> **Indira:** Amplifiqué para que vieran la señal. Después ya no se veían las diferencias que importaban.
> **Orin:** Yo había llamado aprobación a algo que ni siquiera era una decisión.
> **Indira:** Podemos mostrar lo que medimos sin pedir que el público se emocione de la misma manera.
> **Orin:** Y hacer música después, cuando nadie vaya a usarla como permiso de extracción.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_esmeralda_indira_2 · Después del arco personal

> **Indira:** La señal de hoy parece menos espectacular y tiene rango completo.
> **Duna:** ¿Podemos dejar que alguien pregunte sin defender otra vez el proyecto entero?
> **Indira:** Sí. Me gustaría que mirara una parte pequeña con calma.
> **Duna:** Yo también estoy aprendiendo a presentar una prueba que no promete todo el paisaje.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar sensor saturado y patrón.

> **Indira:** La línea recta parecía estable. Era el instrumento incapaz de decir más.

**Acto 2:** Ajustar rango con insumos normales.

> **Indira:** Raimundo no necesitaba una señal fuerte. Necesitaba ver cuándo cambiaba.

**Acto 3:** Publicar intervalo y alerta no energética.

> **Indira:** Dejaremos margen para escuchar lo que aún no esperamos.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Rango amplio o sensor doble.

> **Indira · respuesta 1:** Amplio: Mantendrá límites de detalle escritos.

> **Indira · respuesta 2:** Doble: Consumirá mantenimiento y no duplicará energía medida.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `tecnica` y recuerdo «El silencio del sensor lleno». Método de calibración de resonancia sin saturación; no llena baterías por medir maná. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Duna · `esmeralda_duna`

**Pasado:** Duna, 27, restauradora, trajo musgo terrestre a un suelo lunar creyendo que toda planta verde ayuda. Lo mantuvo en recinto cuando detectó incompatibilidad, pero ocultó la decisión para conservar financiación.

**Presente y personalidad:** Es curiosa, escribe diarios de viaje y quiere sentirse útil fuera de Celia. Extraña senderos con árboles y lleva dibujos, no plantas liberadas, para acompañar ese deseo. Su error confundió nostalgia con restauración.

**Cambio:** Estudia sustratos propios, retira especies incompatibles y comunica resultados. No terraformar un planeta entero por entregar semillas.

**Vínculos:** Olmo, Yuna, Ada. **Naturaleza:** persona_viva. **Hogar planificado:** `cantera_esmeralda_vivienda_02`.

#### El verde que no pertenece aquí · `V_esmeralda_duna`

**Primeros años y lo que aprendió a querer:**

Duna quería restaurar paisajes porque le dolía que una intervención dejara lugares sin posibilidad de volver. Aprendió técnicas terrestres que producían verde visible y reconocimiento rápido. Al viajar a Esmeralda vio suelo distinto y supuso que comenzar con una planta resistente daría tiempo para estudiar después. Su deseo de reparar iba por delante de escuchar qué había allí.

**Aprendizaje, decisiones y vínculos:**

El musgo era incompatible y lo mantuvo en un recinto al detectarlo. Esa parada fue útil y la escondió para conservar financiación que esperaba restauración exterior. Presentó fotografías desde un ángulo que no mostraba el límite. Había detenido un daño y fabricado una historia que podía inducir a otros a repetirlo fuera de protección.

**Lo que cambia y lo que todavía pesa:**

La misión publica recinto, prueba y condiciones, busca recuperación local sin reemplazar todo por verde terrestre. Duna no tiene que liberar la muestra para demostrar confianza ni eliminarla por vergüenza. Puede mantener investigación consentida con resultados negativos. Restaurar no es convertir cada mundo en un jardín familiar al visitante.

**Cuando no ofrece una misión:**

Disfruta texturas de piedra que no tienen plantas y compara colores con Pía sin llamarlo experimento. Tras el arco explica lo que no se introducirá antes de mostrar lo que sí funciona. Puede sentir amor por un paisaje que no se parece al suyo.

**Ante Fuatia:**

Fuatia controla tierra sin decidir que toda tierra desea el mismo ecosistema. Duna negocia recuperación y escucha formas locales de cuidado. Pedir una intervención para que la luna parezca terrestre repetiría su primera prisa; admirar poder no obliga a usarlo como decorado.

**Conversaciones personales:**

##### VID_esmeralda_duna_1 · Antes del cambio

> **Duna:** El recinto protegía afuera. Yo dejé el borde fuera de la fotografía para conservar el apoyo.
> **Indira:** Otros podían creer que la prueba ya funcionaba fuera.
> **Duna:** Lo sé. Hacer una buena parada no me autorizaba a esconderla.
> **Indira:** Presentemos el límite como parte del resultado, no como una nota avergonzada.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_esmeralda_duna_2 · Después del arco personal

> **Duna:** Hoy me gustó una roca sin intentar imaginar qué plantar encima.
> **Pía:** ¿Puedo dibujarla o quieres medir textura?
> **Duna:** Dibujemos. Después habrá una ficha distinta si necesitamos trabajar.
> **Pía:** Me alegra que el paisaje pueda seguir siendo una visita.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Examinar recinto cerrado.

> **Duna:** Planté una idea de hogar, no una solución para este suelo.

**Acto 2:** Retirar muestra incompatible con protocolo.

> **Duna:** Yuna preguntó qué necesitaba Esmeralda antes de preguntarme qué traje.

**Acto 3:** Ensayar restauración local y publicar límite.

> **Duna:** La parcela pequeña basta para una prueba. El mundo no es mi maceta.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Sustrato local o protección sin cultivo.

> **Duna · respuesta 1:** Local: Respetará balance de agua y extracción.

> **Duna · respuesta 2:** Protección: No recibirá cosechas ficticias como premio.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El verde que no pertenece aquí». Cuaderno de restauración local y retiro de ensayo, sin terraformar ni crear cosechas. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Raimundo · `esmeralda_raimundo`

**Pasado:** Raimundo, 56, técnico sísmico, dejó de enviar avisos menores después de que los llamaran alarmista. Un movimiento posterior mostró que habían perdido una tendencia.

**Presente y personalidad:** Es paciente, disfruta cocina dulce y se enfada cuando lo tranquilizan sin escuchar cifras. Quiere que los demás puedan preparar viaje sin tener que confiar personalmente en él. Se irrita cuando elogian su intuición en vez de leer series.

**Cambio:** Separa aviso, tendencia y emergencia, usa rangos claros y registra recepción. Aprende a enviar datos pequeños sin tono de catástrofe y a pedir confirmación de lectura, no confirmación de prestigio.

**Vínculos:** Indira, Severo, Óscar. **Naturaleza:** persona_viva. **Hogar planificado:** `cantera_esmeralda_vivienda_02`.

#### La serie de avisos pequeños · `V_esmeralda_raimundo`

**Primeros años y lo que aprendió a querer:**

Raimundo aprendió movimiento de suelo junto a trabajadores que sabían escuchar un aviso sin pensar que prometía catástrofe. Le gustaba detectar una tendencia y ajustar jornada antes de urgencia. En la luna recibía preguntas que pedían sí o no, aunque el registro ofreciera intervalos. A fuerza de repetir detalles terminó pareciendo incómodo a quien deseaba una salida rápida.

**Aprendizaje, decisiones y vínculos:**

Lo llamaron alarmista y dejó de enviar señales menores. Quería conservar empleo y relación con compañeros sin parecer enemigo del progreso. Un movimiento posterior mostró la tendencia que ya no estaba siendo seguida en conjunto. El silencio protegió su reputación unos días y retiró una herramienta útil del equipo.

**Lo que cambia y lo que todavía pesa:**

La misión distingue niveles de aviso, confirmación y parada, no convierte cada vibración en motivo de evacuación. Raimundo recupera voz sin exigir que todo termine como él proponía. Su edad le da historia de observación y no autoridad profética. El mineral regional se extrae en circuitos permitidos con retorno preparado.

**Cuando no ofrece una misión:**

Le gusta caminar donde no tiene que instalar sensor y cuenta bromas malas sobre piedras que no se mueven. Tras el arco deja tendencia legible aun cuando aún no amerite cierre. Puede escuchar una duda técnica sin leerla siempre como la burla que antes recibió.

**Ante Fuatia:**

Fuatia es tierra y Raimundo no espera que responda por toda presión con un terremoto moral. Sentir y provocar son distintos. Pedirá que sus intervenciones dejen señales y balance consultables para que los humanos no confundan un movimiento normal con castigo.

**Conversaciones personales:**

##### VID_esmeralda_raimundo_1 · Antes del cambio

> **Raimundo:** Dejé de enviar lo pequeño. Si no molestaba, parecía que volvía a ser buen compañero.
> **Olmo:** Después la tendencia faltaba justo cuando intentábamos decidir.
> **Raimundo:** No quiero volver a gritar cada dato para asegurar que me escuchen.
> **Olmo:** Preparemos niveles que podamos responder sin confundirlos con una orden de pánico.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_esmeralda_raimundo_2 · Después del arco personal

> **Raimundo:** El aviso menor quedó consultable y no detuvo la jornada por sí solo.
> **Duna:** ¿Te lo discutieron?
> **Raimundo:** Preguntaron el umbral. Esta vez pude oírlo como pregunta, no como otro alarmista.
> **Duna:** Podemos dejar el registro y pasear antes de que el turno vuelva a empezar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Recuperar tres lecturas fechadas.

> **Raimundo:** No toda vibración es emergencia. Eso no significa que no sea información.

**Acto 2:** Comparar tendencia sin cambiar eventos de partida.

> **Raimundo:** Me pidieron menos ruido. Yo dejé de comunicar una serie completa.

**Acto 3:** Probar aviso con niveles y acción correspondiente.

> **Raimundo:** El aviso dirá qué sabemos y qué hacer. No solo tengan cuidado.

**Acceso narrativo:** después de `P17` y visita autorizada. **Decisión antes del acto 3:** Panel local o boletín de rutas.

> **Raimundo · respuesta 1:** Local: Mantendrá lectura y contacto técnico.

> **Raimundo · respuesta 2:** Rutas: Distinguirá zonas sin cerrar toda la luna por defecto.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La serie de avisos pequeños». Boletín de tendencia sísmica por niveles con acción y fecha, sin modificar eventos aleatorios. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## campamento_fragmentos

### Axel · `fragmentos_axel`

**Pasado:** Axel, 33, contratista de asteroides, aceptó recuperar un cargamento sin revisar propiedad de los restos. La factura parecía legal, pero el objeto pertenecía a una comunidad evacuada.

**Presente y personalidad:** Es entusiasta, hace figuras de chatarra y quiere que nadie lo llame carroñero. Quisiera construir una casa usando restos legales. A veces llama oportunidad a una pieza porque teme que, si pregunta, tendrá que devolverla.

**Cambio:** Exige procedencia, devolución y límite de extracción. Recuperar no convierte todas las ruinas en mercancía libre.

**Vínculos:** Lázaro, Rita, Kenzo. **Naturaleza:** persona_viva. **Hogar planificado:** `campamento_fragmentos_vivienda_01`.

#### El resto que tenía dueño · `V_fragmentos_axel`

**Primeros años y lo que aprendió a querer:**

Axel comenzó recuperación viendo objetos que una catástrofe convertía en restos sin quitarles historia. Al principio preguntaba a evacuados qué querían conservar. Los contratos espaciales prometieron trabajo estable con facturas de propiedad que parecía suficiente revisar. Se acostumbró a tomar una firma empresarial como respuesta antes de escuchar si había otra comunidad reclamando.

**Aprendizaje, decisiones y vínculos:**

Aceptó una carga que pertenecía a una comunidad evacuada. El vendedor tenía papeles y omitía cómo habían salido los objetos. Axel vio una señal de uso familiar y decidió que no correspondía investigar todo cada vez. La prisa era económica y también un hábito de proteger su papel de recuperador útil de preguntas que podían detener la expedición.

**Lo que cambia y lo que todavía pesa:**

La misión contrasta propiedad, custodia y permiso, permite devolución y recuperación autorizada. No abandona todo aprovechamiento de asteroides ni convierte a cada contratista en saqueador automático. Axel puede conservar ingreso por rescatar material que sí fue cedido. Hallar no basta para poseer; trasladar una caja no crea una nueva unidad en inventario.

**Cuando no ofrece una misión:**

Le gustan herramientas que otra persona reparó y consulta sus marcas sin coleccionarlas como trofeo. Tras el arco deja una carga en espera si no puede acreditar consentimiento. Puede sentir frustración por perder contrato sin llamar obstáculo a quienes estaban reclamando su vida.

**Ante Fuatia:**

Fuatia puede recuperar suelo y Axel necesita respetar también comunidad. Un permiso elemental no reemplaza al dueño de un objeto. Pediría colaboración para una retirada segura y no vendería el hecho de haber sido ayudado por una diosa como propiedad superior del cargamento.

**Conversaciones personales:**

##### VID_fragmentos_axel_1 · Antes del cambio

> **Axel:** La firma era válida para el vendedor. No me decía cómo había llegado el objeto a su almacén.
> **Kenzo:** Yo tuve una firma administrativa y tampoco pude llamarla consentimiento de todos.
> **Axel:** Quisiera que el oficio fuera tan limpio como una factura ordenada.
> **Kenzo:** Puede ser más cuidadoso. No tiene que dejar de hacer preguntas para parecer eficiente.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_fragmentos_axel_2 · Después del arco personal

> **Axel:** La carga vuelve a custodia comunitaria. Otra sí quedó autorizada y cobré recuperarla.
> **Lázaro:** ¿Te molesta que no podamos contar ambas como material propio?
> **Axel:** Hoy me alivia. Quiero conocer qué harán con la que sí nos cedieron.
> **Lázaro:** Tendremos una cuenta que no necesite adornar el hallazgo.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar contrato y señal de origen.

> **Axel:** Que nadie esté aquí no significa que nadie tenga derecho a volver.

**Acto 2:** Consultar reclamante autorizado.

> **Axel:** Rita encontró el nombre donde yo solo veía peso de carga.

**Acto 3:** Recuperar o devolver con cadena de custodia.

> **Axel:** La pieza viajará con un destino, no solo con un precio.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Devolución o préstamo autorizado.

> **Axel · respuesta 1:** Devolución: No contará como venta perdida que deba compensar el reclamante.

> **Axel · respuesta 2:** Préstamo: Exige permiso y fecha de retorno.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El resto que tenía dueño». Consulta de contratos y servicio de restitución o préstamo autorizado de restos. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Pía · `fragmentos_pia`

**Pasado:** Pía, 28, estudió prismas y llamó estable a una pieza tras una sola prueba. Gaspar la usó en instrumento y descubrió que cambiaba con temperatura.

**Presente y personalidad:** Es rápida, disfruta luces de colores y se aburre cuando tiene que repetir mediciones. Necesita resultados rápidos para sostener su puesto y disfruta investigar de verdad; esa tensión, no desinterés, alimenta su prisa.

**Cambio:** Publica condiciones y variación, diseña uso adecuado y evita prometer precisión universal. Una repetición que cambia su clasificación ya no se descarta como inconveniente. Se vuelve el resultado que justifica la nueva ficha.

**Vínculos:** Gaspar, Petra, Orin. **Naturaleza:** persona_viva. **Hogar planificado:** `campamento_fragmentos_vivienda_01`.

#### El prisma bajo otra luz · `V_fragmentos_pia`

**Primeros años y lo que aprendió a querer:**

Pía empezó cristales por colores que cambiaban al girar y estudió después propiedades que no se veían igual de fácil. Su primer prisma estable recibió atención profesional y le gustó que un objeto hermoso tuviera una función precisa. Presentar resultados requería plazos que la práctica completa no siempre cumplía. Empezó a considerar una prueba buena como garantía de las siguientes.

**Aprendizaje, decisiones y vínculos:**

Gaspar instaló una pieza que cambiaba con temperatura. Pía había comprobado una sola condición y no había escrito el intervalo faltante. Defendió que la lectura original era verdadera antes de admitir que estable significaba algo más amplio al vender. El error exigía contactar un uso real, no añadir otra frase al artículo.

**Lo que cambia y lo que todavía pesa:**

La misión calibra, deja rango y distingue pieza de colección de componente funcional. Un prisma sirve a instrumentos o armas según condiciones probadas, no por rareza estética sola. Pía conserva gusto por estudiar y puede publicar un resultado limitado sin sentir que vuelve a ser una aprendiz sin valor.

**Cuando no ofrece una misión:**

Dibuja colores que el cristal nunca produce y mantiene esas hojas fuera de fichas técnicas. Tras el arco pregunta dónde funcionará una pieza antes de garantizarla. Puede mostrar una que le gusta sin buscarle utilidad obligatoria para campaña.

**Ante Fuatia:**

Los ojos elementales de Fuatia podrían parecer una escala perfecta y Pía no los convierte en sensor sin acuerdo. Una manifestación de fuego no certifica temperatura de cada entorno. Necesita leer balance y uso, no únicamente copiar colores para un prisma bendecido.

**Conversaciones personales:**

##### VID_fragmentos_pia_1 · Antes del cambio

> **Pía:** Lo llamé estable porque aquella prueba no cambió. La palabra viajó más lejos que la condición.
> **Gaspar:** Yo lo instalé suponiendo que ambas estaban en la ficha.
> **Pía:** Podemos corregir las dos promesas sin decir que el prisma no tenía ninguna propiedad útil.
> **Gaspar:** Sí. Después me gustaría mirarlo sin ponerle una tarea.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_fragmentos_pia_2 · Después del arco personal

> **Pía:** Esta pieza queda para colección. No tiene que sostener retorno ni una lectura de campaña.
> **Duna:** ¿Entonces podemos dibujarla aunque nos salgan colores inventados?
> **Pía:** Claro. Guardamos otra hoja para lo que sí medimos.
> **Duna:** Me gusta un cristal que hoy no necesita aprobar nada.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Medir patrón bajo dos condiciones.

> **Pía:** No mentí sobre la prueba. Mentí al dejarla parecer todas las pruebas.

**Acto 2:** Contrastar uso con Gaspar.

> **Pía:** Gaspar necesitaba un instrumento. Yo le vendí mi mejor instante.

**Acto 3:** Clasificar pieza y anotar tolerancias.

> **Pía:** Servirá para este uso. La ficha no lo llamará eterno.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Uso óptico limitado o decoración.

> **Pía · respuesta 1:** Limitado: Mantendrá condiciones registradas.

> **Pía · respuesta 2:** Decoración: No tendrá estadísticas de herramienta.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `tecnica` y recuerdo «El prisma bajo otra luz». Método de clasificación de prismas por condición y tolerancia, sin rareza extra automática. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Lázaro · `fragmentos_lazaro`

**Pasado:** Lázaro, 46, recuperador, conserva objetos porque creció con escasez. Empezó a contabilizar cada traslado como hallazgo nuevo y su inventario prometía más material del que tenía.

**Presente y personalidad:** Es ingenioso, aprecia reparaciones feas y guarda recuerdos en latas. Quiere aprovechar sin admitir que algo ya no sirve.

**Cambio:** Distingue lote original, reuso y descarte; reciclaje devuelve menos que fabricación y nunca crea oro circular.

**Vínculos:** Óscar, Axel, Rita. **Naturaleza:** persona_viva. **Hogar planificado:** `campamento_fragmentos_vivienda_02`.

#### Tres nombres para la misma pieza · `V_fragmentos_lazaro`

**Primeros años y lo que aprendió a querer:**

Lázaro creció con escasez y aprendió que una pieza guardada podía ahorrar una compra imposible. Reparar cosas usadas le daba independencia. Al llegar a restos espaciales sintió que dejar algo atrás era una pérdida evitable, aunque no tuviera todavía dónde usarlo. El inventario empezó a funcionar también como tranquilidad personal frente a años de tener poco.

**Aprendizaje, decisiones y vínculos:**

Contó cada traslado como hallazgo nuevo y los registros ofrecían más material del que había. No aparecía una caja extra al moverla, pero el informe de productividad se veía mejor. Lázaro justificaba la práctica porque todo objeto estaba físicamente localizable. El problema no era únicamente ubicación: otras personas preparaban proyectos con cantidades inexistentes.

**Lo que cambia y lo que todavía pesa:**

La misión distingue recuperación, custodia y transferencia por identidad. No destruye objetos útiles para enseñarle a soltar ni permite desarmar propiedad ajena sin autorización. Puede conservar una colección personal con espacio acordado y dejar de usarla como producción comercial. El campamento comparte recursos finitos, no restituye planetas destruidos.

**Cuando no ofrece una misión:**

Le gustan cajitas hechas con retales y regalos modestos cuyo uso conoce. Tras el arco acepta un depósito menor y completo. Puede quedarse con una pieza de gusto privado sin prometer que rescatará algún día todo material que ve.

**Ante Fuatia:**

Fuatia registra una extracción una vez aunque una caja viaje varias rutas. Lázaro acepta aplicar esa precisión al inventario. También pregunta qué recuperación ofrece un material si no puede reponerse: equilibrio no es anunciar que el universo contiene más piedras en otro lugar.

**Conversaciones personales:**

##### VID_fragmentos_lazaro_1 · Antes del cambio

> **Lázaro:** La caja estaba en el puesto. La conté otra vez porque había completado otro traslado.
> **Rita:** Los proyectos esperaban dos cajas, no dos jornadas de trabajo.
> **Lázaro:** Quería que se notara cuánto hacía sin dejar de conservar todo lo útil.
> **Rita:** Podemos registrar trabajo sin inventar el material que aún falta.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_fragmentos_lazaro_2 · Después del arco personal

> **Lázaro:** Este depósito tiene menos unidades y nadie tiene que adivinar cuáles se contaron dos veces.
> **Axel:** ¿Todavía te parece escaso?
> **Lázaro:** A veces. Hoy hice una caja pequeña para mis cosas y no la ofrecí como recurso del campamento.
> **Axel:** Ese límite también deja lugar para una vida propia.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Seguir pieza entre depósitos.

> **Lázaro:** No encontramos tres motores. Movimos uno tres veces.

**Acto 2:** Separar reuso y nuevo hallazgo.

> **Lázaro:** Óscar no quería tirar nada. Yo tampoco. El inventario empezó a contar nuestros deseos.

**Acto 3:** Reciclar una muestra con pérdida material registrada.

> **Lázaro:** La pieza tendrá un solo origen y todos sus caminos.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Reparación o desmontaje.

> **Lázaro · respuesta 1:** Reparación: Consumirá insumos nuevos y mantendrá desgaste.

> **Lázaro · respuesta 2:** Desmontaje: Nunca devolverá valor mayor que la pieza de entrada.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «Tres nombres para la misma pieza». Plano de pieza reparable o desmontable con devolución material menor que inversión. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Uma · `fragmentos_uma`

**Pasado:** Uma, 37, rescatista espacial, aceptó un rescate fuera de capacidad porque Dexo le dijo que no había alternativa. Volvieron con ayuda de otro puesto; la promesa de heroísmo ocultó una deuda de oxígeno.

**Presente y personalidad:** Es serena, juega con nudos y quiere que nadie se sienta abandonado. Le cuesta decir que un intento necesita esperar preparación.

**Cambio:** Forma red de puestos, comparte capacidad y no promete seguridad imposible. La escena posterior la muestra practicando nudos por gusto. Su red de relevos le devuelve algo más que capacidad de rescate.

**Vínculos:** Dexo, Otto, Tamara. **Naturaleza:** persona_viva. **Hogar planificado:** `campamento_fragmentos_vivienda_02`.

#### La reserva de quien rescata · `V_fragmentos_uma`

**Primeros años y lo que aprendió a querer:**

Uma quiso rescatar porque había visto cuánto podía cambiar una jornada cuando alguien llegaba con preparación. Entrenó para actuar en incertidumbre y también para decir cuándo no era posible salir. La imagen de rescatista valiente recibió más atención que aquellos límites. Con experiencia comenzó a temer que una negativa sonara como abandono aunque preservara otra posibilidad segura.

**Aprendizaje, decisiones y vínculos:**

Dexo dijo que no había alternativa y ella aceptó fuera de capacidad. Regresaron con oxígeno de otro puesto. La gratitud pública hacía sencillo contar heroísmo y difícil explicar que habían trasladado riesgo. Uma no dejó de querer a las personas rescatadas; empezó a reconocer que su deseo de salvar también podía imponer costos a quienes no lo habían elegido.

**Lo que cambia y lo que todavía pesa:**

La misión prepara capacidad, alternativas y retorno verificable. Una petición urgente no le entrega oxígeno infinito ni obligación de resolver toda maniobra ajena. Puede ayudar de otro modo cuando salir es inadmisible. El apoyo de Fuatia puede tener lugar sin convertir rescate en recurso renovable garantizado.

**Cuando no ofrece una misión:**

Disfruta caminar en gravedad familiar durante descanso y leer historias donde nadie tenga una emergencia. Tras el arco avisa límites antes de un contrato. Puede querer ser reconocida sin convertir cada negativa en culpa que deba compensar arriesgándose la próxima vez.

**Ante Fuatia:**

Le pediría a Fuatia que explique el balance de un rescate enorme y no utilice desesperación para pedir lealtad. La diosa puede ayudar por interés común; aceptar esa ayuda no autoriza prometerla en cada salida posterior. Uma defiende reserva también cuando el público desea un milagro.

**Conversaciones personales:**

##### VID_fragmentos_uma_1 · Antes del cambio

> **Uma:** Sabía que no tenía capacidad completa. Quise creer que decir sí ya creaba una alternativa.
> **Dexo:** La creó otro puesto dejando parte de su reserva.
> **Uma:** Te ayudé de verdad y también hice una decisión que podía dañar a más personas.
> **Dexo:** Voy a incluir esa parte cuando vuelva a contar la salida.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_fragmentos_uma_2 · Después del arco personal

> **Uma:** Hoy dije no a una maniobra y sí a coordinar una ruta diferente.
> **Boris:** ¿Pudiste descansar después?
> **Uma:** Me costó al principio. Luego leí una historia sin rescate y me gustó mucho.
> **Boris:** Ese final puede quedarse así. No necesita otra emergencia para justificarse.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Calcular consumo de dos personas.

> **Uma:** Rescatar también necesita aire de regreso para quien fue a buscar.

**Acto 2:** Probar ancla en zona segura.

> **Uma:** Decir todavía no podemos no es lo mismo que dejar de intentarlo.

**Acto 3:** Acordar llamada y contingencia con puesto alterno.

> **Uma:** La siguiente llamada tendrá tres puestos escuchando. Ninguno fingirá capacidad que no tiene.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Puesto fijo o relevos de patrulla.

> **Uma · respuesta 1:** Fijo: Publicará alcance antes de abrir ruta.

> **Uma · respuesta 2:** Patrulla: No gastará la misma reserva en dos recorridos simultáneos.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La reserva de quien rescata». Agenda de puestos de rescate con capacidad y oxígeno de vuelta, no rescate infinito. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## ambarina

### Zora · `ambar_zora`

**Pasado:** Zora, 42, coordina hábitats y firmó un acuerdo terrestre que prometía lluvia tecnológica. Los proveedores se marcharon y quedaron tuberías inútiles; para no mostrar fracaso ella rechazó después toda alianza.

**Presente y personalidad:** Es hospitalaria con límites, aprecia cerámica reparada y cuenta litros al preparar té. Quiere autonomía sin aislamiento.

**Cambio:** Negocia capacidad y retiro, exige beneficios locales y acepta ayuda verificable. No vende Ambarina por acceso al jugador.

**Vínculos:** Alina, Helena, Calista. **Naturaleza:** persona_viva. **Hogar planificado:** `ambarina_vivienda_01`.

#### El tratado que sí cabe en un tanque · `V_ambar_zora`

**Primeros años y lo que aprendió a querer:**

Zora creció en un hábitat donde aprender a repartir agua incluía conversaciones largas, no una fórmula aceptada por todos. Había familias que preferían conservar y otras que buscaban abrir comercio. Coordinar le gustaba porque podía escuchar sin pertenecer enteramente a una postura. Al recibir la propuesta terrestre sintió que por fin una visita traía una respuesta que no empezaba pidiendo más sacrificio local.

**Aprendizaje, decisiones y vínculos:**

Firmó lluvia tecnológica con verificaciones insuficientes. Los proveedores se marcharon y quedaron tuberías que no sostenían lo anunciado. Zora quiso responsabilizarse reparando sola, pero también cerró toda oferta futura para evitar exponer de nuevo su criterio. Una comunidad que había discutido opciones recibió otra decisión unilateral en nombre de protección.

**Lo que cambia y lo que todavía pesa:**

La misión revisa capacidad, entregas y voto, permite una alianza limitada sin prometer lluvia inexistente. El tratado de campaña no convierte Ambarina en finca de Él y Ella. Zora sigue coordinando si la comunidad lo decide y puede perder una votación. No necesita que extranjeros la salven para recuperar todo prestigio anterior.

**Cuando no ofrece una misión:**

Disfruta desayunos con conversación que no sea asamblea y una planta que comparte con una vecina por turnos. Tras el arco admite un sí parcial sin garantizar que todo visitante será confiable. Puede pedir ayuda sin cerrar quién tendrá derecho a decidir después.

**Ante Fuatia:**

Fuatia puede hacer océano donde hay desierto y Zora no acepta que la capacidad decida por sí sola si conviene hacerlo. Quiere saber balance y consentimiento territorial. El planeta tiene vida que no necesita volverse otro paisaje para merecer protección.

**Conversaciones personales:**

##### VID_ambar_zora_1 · Antes del cambio

> **Zora:** Nos ofrecieron lluvia y oí una pausa en los sacrificios que llevábamos años repitiendo.
> **Kenzo:** ¿Qué pedimos comprobar antes de firmar?
> **Zora:** Menos de lo que sabíamos preguntar. Después decidí que nadie más entraría a ofrecernos nada.
> **Kenzo:** La comunidad puede escoger otro método sin que todo empiece por confiar de nuevo en tu decisión sola.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_ambar_zora_2 · Después del arco personal

> **Zora:** La votación dejó una propuesta fuera y aceptó otra parte. No llamé ingratitud a quienes discreparon.
> **Samira:** ¿Sigues contenta con el acuerdo?
> **Zora:** Sí. También sé qué no prometimos. Quiero desayunar sin inventar otra certeza para cada pregunta.
> **Samira:** Hoy podemos hablar de una planta que nos gusta, no de todo el hábitat.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar contrato fallido.

> **Zora:** No me prometas lluvia. Dime cuánta agua tienes, cuánto cuesta traerla y cuándo puedes dejar de hacerlo.

**Acto 2:** Medir reserva y demanda local.

> **Zora:** Calista también ha dicho no a un trato bonito. Me ayuda saber que no fui la única.

**Acto 3:** Redactar acuerdo revisable con plazo y devolución.

> **Zora:** Podremos revisar el acuerdo sin convertir la discusión en una traición.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Suministro pequeño o intercambio técnico.

> **Zora · respuesta 1:** Pequeño: Tendrá capacidad publicada y reserva local.

> **Zora · respuesta 2:** Técnico: No prometerá recursos que todavía no existen.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «El tratado que sí cabe en un tanque». Tratado pequeño revisable de suministro o intercambio técnico, con cupos y reserva local. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Néstor · `ambar_nestor`

**Pasado:** Néstor, 50, metalúrgico, usó una aleación importada sin preguntar cómo se extraía. El precio ocultaba daño en una terraza ancestral. Kenzo le mostró las marcas.

**Presente y personalidad:** Es franco, disfruta pulir herramientas y quiere que su taller compita con los orbitales. Desea que una herramienta local llegue a otra región por buena factura, no por extracción barata. Se avergüenza de haber confundido ambas cosas.

**Cambio:** Exige procedencia y produce variantes reparables. El material nuevo no invalida de golpe todas las herramientas anteriores.

**Vínculos:** Gonzalo, Kenzo, Baltasar. **Naturaleza:** persona_viva. **Hogar planificado:** `ambarina_vivienda_01`.

#### La aleación con camino · `V_ambar_nestor`

**Primeros años y lo que aprendió a querer:**

Néstor aprendió metalurgia en un taller que reutilizaba piezas porque importar era caro. Le gustaba reconocer utilidad donde alguien veía chatarra. Conseguir una aleación nueva prometía herramientas más duraderas y una salida de mantenimiento constante. La búsqueda era práctica y también una ambición legítima de oficio. No había decidido que cualquier suministro barato sería aceptable.

**Aprendizaje, decisiones y vínculos:**

El precio ocultaba extracción de una terraza ancestral. Néstor no preguntó y después invocó falta de información como si no hubiera visto señales de una cadena incompleta. Kenzo mostró marcas que conectaban la compra con un lugar conocido. Negar procedencia requería retirar del relato algo que ya sabía.

**Lo que cambia y lo que todavía pesa:**

La misión conserva muestras, compara recuperación y acuerda suministro con comunidad. Néstor puede seguir usando metal importado que acredite permiso; no necesita expulsar todo intercambio para responder por uno. Las armas de la ampliación tendrán componentes útiles de su mundo, no un rango global que vuelva todos los minerales anteriores basura.

**Cuando no ofrece una misión:**

Le gusta reparar una sartén doméstica y cocinar para alguien que no quiera hablar de aleación. Tras el arco pide trazabilidad antes de precio final. Puede ofrecer una pieza cara explicando por qué, sin usar respeto territorial como adorno comercial vacío.

**Ante Fuatia:**

Fuatia siente cada extracción y Néstor no confunde eso con permiso para cualquiera que lleve una ofrenda. Le propondrá recuperación de material y límites reales. Si la diosa castiga al comerciante, también debe discutirse cómo evitar que trabajadores pierdan todo sin alternativa de suministro.

**Conversaciones personales:**

##### VID_ambar_nestor_1 · Antes del cambio

> **Néstor:** El precio me gustó y no pregunté por qué parecía tan bueno. Después dije que no podía saberlo.
> **Kenzo:** Las marcas estaban disponibles. No tenías que reconocerlas solo, podías preguntar.
> **Néstor:** Quiero conservar utilidad de la aleación sin borrar la terraza.
> **Kenzo:** Empecemos por saber qué material sigue autorizado y qué reparación quedó pendiente.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_ambar_nestor_2 · Después del arco personal

> **Néstor:** Esta pieza cuesta más y tendrá devolución de recortes documentada.
> **Alina:** ¿Vas a explicar toda la cadena a quien solo quiere una herramienta?
> **Néstor:** La explicación está disponible. No le cobraré un sermón como precio de preguntar.
> **Alina:** Después me gustaría ver la sartén que arreglaste para ti.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Seguir procedencia de metal.

> **Néstor:** Si la barra viene barata porque otro suelo paga el daño, no estoy ahorrando.

**Acto 2:** Probar mezcla con presupuesto equivalente.

> **Néstor:** Kenzo no pidió cerrar mi horno. Pidió dejar de tratar su terraza como una bodega.

**Acto 3:** Publicar uso, reparación y límite térmico.

> **Néstor:** La ficha tiene origen y límite. Ninguno se esconderá debajo del brillo.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Reparación local o variante de calor.

> **Néstor · respuesta 1:** Local: No superará rendimiento base sin costo equivalente.

> **Néstor · respuesta 2:** Calor: Cambia tolerancia contextual, no defensa universal.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La aleación con camino». Variante de ajuste térmico de herramienta, con mismos materiales y rendimiento general. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Alina · `ambar_alina`

**Pasado:** Alina, 31, seleccionó plantas resistentes y anunció que necesitaban casi nada de agua. Eran resistentes a sequía, no ajenas al riego; el anuncio dañó huertos de otros.

**Presente y personalidad:** Es animada, guarda recetas familiares y se avergüenza al oír su frase repetida. Quiere una cocina abastecida, una ambición concreta que se volvió eslogan cuando compradores pidieron una planta milagrosa.

**Cambio:** Publica intervalos, no eslóganes; reduce pérdidas sin eliminar costo de cultivar. Una cosecha modesta alcanza para una comida real. Esa medida le devuelve entusiasmo sin necesidad de prometer invulnerabilidad.

**Vínculos:** Zora, Ciro, Yuna. **Naturaleza:** persona_viva. **Hogar planificado:** `ambarina_vivienda_02`.

#### La planta que igual tiene sed · `V_ambar_alina`

**Primeros años y lo que aprendió a querer:**

Alina seleccionaba plantas junto a gente que recordaba temporadas más secas y otras menos duras. Le fascinaba una variedad capaz de soportar espera sin rendirse. Estudiar le permitió describir resistencia y encontrar compradores. La atención externa premiaba frases cortas, y empezó a convertir tolera más sequía en necesita casi nada para que el cultivo pareciera extraordinario.

**Aprendizaje, decisiones y vínculos:**

Otros huertos siguieron el anuncio y recibieron menos agua de la necesaria. Alina respondió que se había indicado mínimo, sin revisar qué significaba ese mínimo en una etiqueta. Su éxito dependía de condiciones que ella conocía y otros no. No bastaba retirar publicidad mientras familias aún decidían riego por la versión anterior.

**Lo que cambia y lo que todavía pesa:**

La misión corrige necesidades, conserva diversidad y permite reposición acordada. La planta sigue siendo resistente y valiosa; no se vuelve falsa porque la promesa estuviera mal. El clima de Ambarina requiere agua real y calendario, sin cosechas gratis por visitar una ficha. Alina puede vender semilla con límites claros y dejar una variedad local sin convertirla en producto insignia.

**Cuando no ofrece una misión:**

Prueba platos con semillas de uso alimentario y pasea por huertos ajenos sin sugerirles siempre una sustitución. Tras el arco disfruta un crecimiento corriente. Puede reconocer una pérdida sin convertir cada planta viva en testimonio que deba limpiar su reputación.

**Ante Fuatia:**

La diosa podría poner agua al instante y Alina le pregunta por el intercambio que sostiene después. No usará ese poder para justificar publicidad de riego inexistente. Una bendición puntual y una necesidad de cultivo son información distinta, y ambas deben conservarse en su ficha.

**Conversaciones personales:**

##### VID_ambar_alina_1 · Antes del cambio

> **Alina:** Yo sabía cuánto seguía regando. La etiqueta hacía parecer que esa parte apenas importaba.
> **Zora:** Quien la compra tiene que poder repetir condiciones, no adivinar las que tú conservaste.
> **Alina:** La variedad sigue siendo buena. Me cuesta explicar eso sin volver a defender el anuncio.
> **Zora:** Puedes ofrecerla con lo que realmente necesita.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_ambar_alina_2 · Después del arco personal

> **Alina:** Dejamos el registro de agua junto a la semilla. Nadie tiene que comprarla por parecer invencible.
> **Néstor:** ¿Quieres ver un huerto sin plantear otra prueba?
> **Alina:** Sí. Me gustaría que me inviten por compañía y no solamente para evaluar plantas.
> **Néstor:** Entonces llevo una comida que no presume propiedades resistentes.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar riego real con folleto.

> **Alina:** Resiste no quiere decir no necesita. Debí decir cuánto, no casi nada.

**Acto 2:** Cultivar lote pequeño en estación válida.

> **Alina:** Ciro mostró una olla vacía y preguntó cuántas promesas podían cocinarse.

**Acto 3:** Corregir guía y apoyar huertos afectados.

> **Alina:** La guía tendrá agua mínima y margen. No volveremos a vender invulnerabilidad vegetal.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Cultivo de alimento o ensayo de semillas.

> **Alina · respuesta 1:** Alimento: Priorizará cupos y gasto visible.

> **Alina · respuesta 2:** Semillas: No multiplicará lotes sin proceso normal de cosecha.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La planta que igual tiene sed». Ficha de riego mínimo e intervalos de cultivo resistente; no elimina agua ni estación. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Baltasar · `ambar_baltasar`

**Pasado:** Baltasar, 44, constructor de domos, selló demasiado un refugio para reducir pérdidas y empeoró ventilación. Había diseñado para una cifra de presión, no para residentes.

**Presente y personalidad:** Es paciente, disfruta hacer cometas y quiere un edificio que no necesite reparación nunca. Le gustaría descansar dentro de una casa que no estuviera inspeccionando. Su búsqueda de perfección intenta ahorrar ese trabajo y acaba multiplicándolo.

**Cambio:** Prueba con usuarios, deja piezas inspectables y acepta mantenimiento como parte del cuidado. Acepta el calendario de revisiones como una forma de habitar, no como prueba de que nunca debió terminar la construcción.

**Vínculos:** Ramiro, Néstor, Boris. **Naturaleza:** persona_viva. **Hogar planificado:** `ambarina_vivienda_02`.

#### La cúpula donde se puede respirar · `V_ambar_baltasar`

**Primeros años y lo que aprendió a querer:**

Baltasar diseñó refugios para conservar calor y aire cuando cada pérdida significaba transportar más. Le gustaba una obra que permitía dormir sin vigilar juntas. Los primeros residentes conversaban con él mientras reparaba y conocía preferencias de circulación. Al crecer contratos empezó a trabajar con cifras de eficiencia y dejó esas visitas para el momento posterior a entregar.

**Aprendizaje, decisiones y vínculos:**

Selló demasiado un domo y redujo ventilación. La presión cumplía la cifra elegida, pero quienes vivían dentro no podían usarlo cómodamente. Baltasar pidió que probaran adaptación antes de aceptar rediseño. El informe tenía razón sobre lo medido y no sobre la vida que prometía proteger.

**Lo que cambia y lo que todavía pesa:**

La misión ensaya renovación de aire, descanso y mantenimiento, conserva materiales con salida reparable. No ofrece un domo ideal para toda comunidad ni convierte a residentes en probadores sin permiso. Puede mantener experiencia técnica y aceptar que otro evalúe uso antes de cerrar factura. Una residencia segura no exige que quien la habita deje de expresar necesidades.

**Cuando no ofrece una misión:**

Le gusta observar arquitectura pequeña de sombra y sentarse en un espacio que no diseñó. Tras el arco entrega instrucción que otro puede mantener. Puede desear una obra bella sin sacrificar toda ventana que dificulte un resultado perfecto de laboratorio.

**Ante Fuatia:**

Fuatia es aire dentro del domo y Baltasar no cree que presencia divina excuse falta de circulación. Le pide ayuda para un balance que los residentes acepten, no un ambiente impuesto porque la diosa pueda sostenerlo. Ninguna bendición convierte incomodidad en ingratitud.

**Conversaciones personales:**

##### VID_ambar_baltasar_1 · Antes del cambio

> **Baltasar:** La presión era correcta. Les pedí acostumbrarse antes de preguntar dónde se sentían mal.
> **Samira:** Habías medido el refugio sin dejar a la vida dentro modificar la pregunta.
> **Baltasar:** Quiero una prueba donde podamos detener sin fingir que terminó el diseño.
> **Samira:** Entonces empecemos invitando a quienes lo van a habitar.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_ambar_baltasar_2 · Después del arco personal

> **Baltasar:** Dejé una ventana que pierde un poco y mejora la circulación necesaria.
> **Zora:** ¿Puedes conservarla sin llamarla concesión estética?
> **Baltasar:** Sí. Hoy entiendo mejor para qué estaba construyendo todo el resto.
> **Zora:** Podemos sentarnos dentro y dejar de evaluar por una tarde.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Medir presión y ventilación.

> **Baltasar:** El domo conservaba la presión. Yo olvidé preguntar qué conservaba adentro.

**Acto 2:** Probar módulo inerte con piezas finitas.

> **Baltasar:** Una casa sin intercambio se parece demasiado a la solución de Vael.

**Acto 3:** Publicar mantenimiento y acceso de emergencia.

> **Baltasar:** Habrá aire, inspección y una salida que nadie deba pedir por favor.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Ventilación pasiva o módulo regulable.

> **Baltasar · respuesta 1:** Pasiva: Exige entorno compatible.

> **Baltasar · respuesta 2:** Regulable: Consume energía y falla de modo seguro documentado.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `plano` y recuerdo «La cúpula donde se puede respirar». Módulo inspectable de domo con salida de emergencia y consumo de ventilación. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Samira · `ambar_samira`

**Pasado:** Samira, 38, pronosticadora, guio caravanas con un registro excelente y empezó a omitir intervalos por no confundir clientes. Una tormenta demoró un envío y el lenguaje seguro hizo que nadie reservara agua suficiente.

**Presente y personalidad:** Es directa, disfruta cuentos absurdos y admira a Severo aunque discuten métodos. Desea escribir una crónica humorística de caravanas. Severo le recuerda que una buena frase puede acompañar un aviso sin sustituir sus cifras.

**Cambio:** Comunica tres días lógicos con alternativas y reserva; no impone esperar una fecha real. Sus boletines conservan un comentario pequeño y los rangos completos: no tiene que elegir entre ser legible y ser honesta.

**Vínculos:** Severo, Vera, Zora. **Naturaleza:** persona_viva. **Hogar planificado:** `ambarina_vivienda_03`.

#### La arena entre dos cifras · `V_ambar_samira`

**Primeros años y lo que aprendió a querer:**

Samira aprendió pronóstico siguiendo caravanas que celebraban saber con qué preparar la siguiente parada. Le gustaba que una lectura transformara miedo en una tarea posible. Los registros acertados le dieron autoridad y compradores que pedían una frase simple. Las probabilidades parecían obstáculo para esa confianza; empezó a guardar intervalos en anexos que pocas personas abrirían.

**Aprendizaje, decisiones y vínculos:**

Una tormenta demoró un envío y faltó agua reservada. La posibilidad estaba en sus datos, pero el lenguaje público sonaba seguro. Samira defendió el anexo y después se preguntó por qué había permitido que la parte útil para decidir no fuera la más fácil de encontrar. No hizo aparecer la tormenta y sí participó en cómo se prepararon.

**Lo que cambia y lo que todavía pesa:**

La misión publica intervalo, umbral y alternativa de ruta. No vende certeza de clima ni permite que todo riesgo tenga que resolverse como emergencia. Puede mantener talento y aceptar un reclamo legítimo. Caravanas siguen necesitando agua, además de una voz en la que confiar.

**Cuando no ofrece una misión:**

Le gusta escuchar viento sin interpretarlo durante descanso y cocinar platos que no viajan. Tras el arco incluye una recomendación visible con dudas. Puede jugar con predicciones ficticias entre amigos sin presentarlas como servicio.

**Ante Fuatia:**

Fuatia puede cambiar aire y agua, pero Samira no atribuye cada tormenta a su ira. Quiere distinguir intervención de fenómeno y anunciar cualquier compensación extraordinaria. Un desierto vuelto océano no es un simple pronóstico acertado: requiere pensar comunidades y vidas que ya existían allí.

**Conversaciones personales:**

##### VID_ambar_samira_1 · Antes del cambio

> **Samira:** El intervalo estaba en el anexo. Lo decía como si la caravana hubiera tenido otra mañana para descifrarme.
> **Baltasar:** La claridad que prometemos también necesita probarse con usuarios.
> **Samira:** No quiero simplificar hasta mentir otra vez.
> **Baltasar:** Podemos hacer visible la incertidumbre y la acción que recomiendas.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_ambar_samira_2 · Después del arco personal

> **Samira:** Hoy una ruta se aplazó con reserva, antes de que la tormenta decidiera por nosotros.
> **Zora:** ¿Te felicitaron por acertar?
> **Samira:** No especialmente. Me gustó saber que no necesitaron una gran hazaña para prepararse.
> **Zora:** Celebremos una tarde corriente con agua suficiente.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Leer pronóstico y reserva.

> **Samira:** El aviso fácil de leer se volvió fácil de creer de una sola manera.

**Acto 2:** Simular cierre de ruta.

> **Samira:** Severo me mostró cómo escribir no sabemos sin dejar a nadie sin instrucciones.

**Acto 3:** Publicar intervalo con alternativa de regreso.

> **Samira:** Aquí va el rango. Al lado, lo que haremos si se cumple el peor caso.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Boletín breve o mapa de refugios.

> **Samira · respuesta 1:** Breve: Mantendrá incertidumbre explícita.

> **Samira · respuesta 2:** Refugios: Tendrá capacidad y fecha de revisión de cada punto.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La arena entre dos cifras». Boletín de rutas de tres jornadas con refugios y alternativa de retorno, sin fecha real. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Kenzo · `ambar_kenzo`

**Pasado:** Kenzo, 35, arqueólogo, permitió que una expedición retirara piezas para estudiarlas y no dejó copias locales. Recuperó algunas, aprendió que una firma administrativa no siempre expresa consentimiento comunitario.

**Presente y personalidad:** Es curioso, disfruta dibujar herramientas comunes y se incomoda con la palabra tesoro. Quiere estudiar piezas que los grandes museos llaman corrientes; teme que el deseo de reconocimiento vuelva a dirigir qué se lleva y qué deja.

**Cambio:** Acuerda acceso con custodios, usa copia in situ y restituye sin imponer gratitud. Una copia local utilizada por aprendices le produce más orgullo que la vitrina lejana. No necesita desvalorizar todos los museos para elegirla.

**Vínculos:** Úrsula, Axel, Néstor. **Naturaleza:** persona_viva. **Hogar planificado:** `ambarina_vivienda_03`.

#### El plano que no se arranca · `V_ambar_kenzo`

**Primeros años y lo que aprendió a querer:**

Kenzo quiso arqueología para conocer vidas que no aparecían en las historias oficiales. Le gustaban objetos de uso que un museo no consideraba monumento. Un equipo externo ofreció instrumentos con capacidad que su comunidad no tenía. Permitir estudio parecía ampliar voz local y le alegró que lo buscaran como interlocutor.

**Aprendizaje, decisiones y vínculos:**

Firmó retiro de piezas sin dejar copias. La autorización administrativa era válida en una oficina y no había discutido todos los usos comunitarios. Al llegar reclamaciones respondió que la investigación haría conocidos los objetos. Esa fama no sustituía conservar acceso donde la memoria seguía siendo una práctica viva.

**Lo que cambia y lo que todavía pesa:**

La misión recupera piezas posibles, registra las que aún faltan y acuerda préstamos con retorno. No garantiza devolver todo por una escena. Kenzo mantiene oficio y colaboración externa si existe consentimiento real, copias autorizadas y custodia clara. El tratado principal respeta que un territorio no se vuelve propiedad de quien ayuda a recuperar una ruta.

**Cuando no ofrece una misión:**

Colecciona dibujos que sí le regalaron y disfruta una charla sobre objetos nuevos además de antiguos. Tras el arco admite que una investigación puede ser valiosa y todavía no recibir permiso. No llama enemigos de ciencia a quienes prefieren esperar.

**Ante Fuatia:**

La omnipresencia de Fuatia no equivale a representación política de Ambarina. Kenzo puede escuchar historia elemental y pedir que una comunidad también decida. Si un altar guarda una pieza, devolverla a su custodia original no declara odio a la diosa.

**Conversaciones personales:**

##### VID_ambar_kenzo_1 · Antes del cambio

> **Kenzo:** La firma estaba, y yo la usaba para no explicar quiénes no habían discutido la salida.
> **Calista:** A mí me pasó anunciar un acuerdo antes del voto. El resultado útil no volvió completo el permiso.
> **Kenzo:** Quiero seguir investigando con visitas.
> **Calista:** Entonces expliquemos retorno y quién puede decir que todavía no.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_ambar_kenzo_2 · Después del arco personal

> **Kenzo:** Volvió una pieza y otra sigue registrada como pendiente. No fingimos una recuperación entera.
> **Axel:** ¿La copia quedó accesible aquí?
> **Kenzo:** Sí, con el uso que se autorizó. Hoy puedo mirarla sin prometer otra expedición.
> **Axel:** Me gustaría escuchar la historia que no se había llevado el museo.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Consultar custodios de terraza.

> **Kenzo:** Podemos conocerlo sin llevárnoslo. Esa opción debería haber estado primero.

**Acto 2:** Copiar marcas sin retirar soporte.

> **Kenzo:** El permiso del despacho no incluía borrar el lugar de quienes vivían aquí.

**Acto 3:** Entregar versión local y registrar usos permitidos.

> **Kenzo:** Habrá una copia para ustedes y otra que se queda. El original seguirá teniendo suelo.

**Acceso narrativo:** después de `P18` y visita autorizada. **Decisión antes del acto 3:** Copia o préstamo limitado.

> **Kenzo · respuesta 1:** Copia: No dará objeto vendible.

> **Kenzo · respuesta 2:** Préstamo: Exige restitución antes de completar misión.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «El plano que no se arranca». Copia de plano de terraza con permisos de uso, sin extraer soporte ni objeto vendible. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

## iridalia

### Calista · `iris_calista`

**Pasado:** Calista, 41, fue elegida portavoz por escuchar sectores distintos. En un primer tratado anunció acuerdo antes de una votación; ganó comercio y perdió confianza. No es reina ni propietaria de su planeta.

**Presente y personalidad:** Es cálida, disfruta música de Orin y tiene la costumbre de resumir demasiado bien desacuerdos que siguen abiertos.

**Cambio:** Presenta alternativas, acepta perder y separa amistad del mandato político. Después de perder una votación sigue tomando té con Zora. La amistad puede permanecer donde el acuerdo político cambió.

**Vínculos:** Zora, Helena, Edda. **Naturaleza:** persona_viva. **Hogar planificado:** `iridalia_vivienda_01`.

#### La propuesta que puede perder · `V_iris_calista`

**Primeros años y lo que aprendió a querer:**

Calista fue elegida por escuchar sectores que discutían incluso qué debía ofrecer el planeta a visitantes. No heredó una corona ni administra propiedad personal. Le gustaba una asamblea donde nadie debía abandonar su oficio para tener voz. El primer tratado abría comercio que muchos esperaban y ella creyó que anunciarlo pronto protegería una oportunidad frágil.

**Aprendizaje, decisiones y vínculos:**

Lo anunció antes de votar. Parte del comercio funcionó y eso facilitaba defender el procedimiento como una decisión eficaz. Quienes no participaron podían apreciar un producto y seguir reclamando haber sido excluidos. Calista empezó a oír crítica como amenaza al acuerdo, no como una parte necesaria de representar.

**Lo que cambia y lo que todavía pesa:**

La misión conserva propuesta, disenso y votación, con la posibilidad de perder. En campaña los protagonistas llegan como invitados; no obtienen títulos sobre Iridalia por ayudar. Calista puede seguir como portavoz si la asamblea lo permite y dejar el cargo sin que el mundo se convierta en enemigo. La legitimidad requiere decisiones repetidas, no un gesto dramático único.

**Cuando no ofrece una misión:**

Le gusta tocar una pieza musical muy sencilla y después del arco tiene una tarde donde nadie la necesita como resumen del planeta. Puede decir qué prefiere a título propio, distinto de lo votado. No tiene que presentar todo desacuerdo como armonía cultural perfecta.

**Ante Fuatia:**

Fuatia puede proteger elementos de Iridalia y Calista no la declara portavoz automática de todos sus seres. Un acuerdo elemental tendrá condiciones que la comunidad comprenda. Respetar el poder y cuestionar un castigo pueden convivir en una alianza limitada.

**Conversaciones personales:**

##### VID_iris_calista_1 · Antes del cambio

> **Calista:** Lo dije como si ya hubiéramos escogido. Después el comercio funcionó y yo repetía ese resultado.
> **Kenzo:** Quien quedó fuera seguía teniendo una pregunta de permiso.
> **Calista:** Quiero defender la propuesta sin apropiarme de la voz que todavía no recibí.
> **Kenzo:** Presentémosla con la posibilidad de que la respuesta no sea la que esperamos.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_iris_calista_2 · Después del arco personal

> **Calista:** La votación rechazó una parte que yo quería. El acuerdo sigue y el disenso quedó público.
> **Orin:** ¿Podemos tocar música sin pedirle que lo celebre?
> **Calista:** Sí. Hoy quiero una canción que me guste a mí, no un himno del resultado.
> **Orin:** Tengo una bastante breve, incluso si le añades otra discusión.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Escuchar dos sectores con permiso.

> **Calista:** Puedo estar de acuerdo contigo y no tener permiso para hablar por todos.

**Acto 2:** Presentar dos posiciones de baliza seguras.

> **Calista:** La última vez anuncié una decisión como si la reunión fuera solo el aplauso.

**Acto 3:** Registrar votación y condiciones de revisión.

> **Calista:** La votación cambió mi propuesta. Eso demuestra que sirvió.

**Acceso narrativo:** después de `P19` y visita autorizada. **Decisión antes del acto 3:** Baliza junto al taller o junto al sendero.

> **Calista · respuesta 1:** Taller: Exige aislamiento sonoro y acceso público.

> **Calista · respuesta 2:** Sendero: Exige protección del hábitat y desvío accesible.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `acceso` y recuerdo «La propuesta que puede perder». Acuerdo de ubicación de baliza autorizado por asamblea, sin otorgar propiedad territorial. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Orin · `iris_orin`

**Pasado:** Orin, 33, músico de cristales, presentó resonancia como lenguaje infalible del planeta. Una interpretación suya justificó una extracción dañina; Indira mostró que el registro era presión, no aprobación moral.

**Presente y personalidad:** Es apasionado, disfruta sonidos imperfectos y teme perder la belleza de su oficio si deja de llamarlo profecía.

**Cambio:** Distingue ciencia, música y creencia. Puede seguir componiendo sin hacer declarar a una piedra quién tiene razón.

**Vínculos:** Indira, Pía, Sarai. **Naturaleza:** persona_viva. **Hogar planificado:** `iridalia_vivienda_01`.

#### La nota no es una sentencia · `V_iris_orin`

**Primeros años y lo que aprendió a querer:**

Orin aprendió música escuchando resonancias distintas de cristal bajo presión. Le gustaba que una piedra tuviera timbre sin convertirse en una voz humana. Quiso que visitantes reconocieran una cultura que a veces describían como un solo sonido. La fama posterior lo convirtió en intérprete del planeta y él empezó a recibir preguntas morales que ninguna nota podía responder.

**Aprendizaje, decisiones y vínculos:**

Una interpretación suya justificó extracción dañina como si hubiera aprobación natural. Indira mostró presión física y Orin defendió primero lenguaje simbólico. Había presentado símbolo como evidencia cuando convenía a un contrato. No necesitaba renunciar a metáfora, sino dejar de venderla como decisión que otros debían obedecer.

**Lo que cambia y lo que todavía pesa:**

La misión separa señal, interpretación y consentimiento de comunidad. Iridalia conserva músicas distintas y no se reduce a un instrumento del protagonista. Orin puede componer una respuesta a Fuatia sin fingir que oye cada intención elemental. Las resonancias útiles a bastones tendrán medición y límites, no autoridad moral inherente.

**Cuando no ofrece una misión:**

Le gusta una melodía terrestre torpe que aprendió de Rita y disfruta tocar para tres personas. Tras el arco explica cuándo está ofreciendo una obra, no un informe. Puede conservar prestigio musical sin una condición de sabio infalible.

**Ante Fuatia:**

El lenguaje de Fuatia le parece poderoso, pero no reclamará traducirlo sin escucharla. Una diosa que usa rojo no aprueba automáticamente una forja. Orin quiere una canción donde la protección y el resentimiento puedan convivir sin esconder el costo de ninguna.

**Conversaciones personales:**

##### VID_iris_orin_1 · Antes del cambio

> **Orin:** La llamé voz del planeta. Después usaron mi frase para abrir una extracción.
> **Indira:** La lectura era presión. El acuerdo era humano y necesitaba permiso por otra vía.
> **Orin:** Puedo conservar la música sin seguir dándole autoridad que no había medido.
> **Indira:** Sí. La metáfora no necesita convertirse en una licencia.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_iris_orin_2 · Después del arco personal

> **Orin:** Hoy dije que era una pieza nueva, no una respuesta infalible de cristal.
> **Calista:** ¿Le gustó al público?
> **Orin:** A algunos. Otros querían que les resolviera una disputa.
> **Calista:** Podemos seguir oyéndola aunque no cierre ninguna votación.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar resonancia y condición física.

> **Orin:** El cristal cambió de tono. No dijo que pudiéramos cortar más.

**Acto 2:** Afinar instrumento sin extraer más cristal.

> **Orin:** Indira no quitó música a mi trabajo. Quitó autoridad que yo le había prestado sin permiso.

**Acto 3:** Interpretar pieza y explicar límite del dato.

> **Orin:** Esta pieza cuenta lo que sentimos. El informe contará lo que medimos.

**Acceso narrativo:** después de `P19` y visita autorizada. **Decisión antes del acto 3:** Concierto o demostración técnica.

> **Orin · respuesta 1:** Concierto: No se usará como consentimiento de extracción.

> **Orin · respuesta 2:** Técnica: Mantendrá leyenda y medición accesible.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `trofeo` y recuerdo «La nota no es una sentencia». Recuerdo del concierto o demostración que separa composición de consentimiento del planeta. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Liora · `iris_liora`

**Pasado:** Liora, 29, agrónoma, adaptó una planta terrestre para comercio y perdió parte de una variedad local por sustituirla. La ganancia inicial ocultó menos diversidad.

**Presente y personalidad:** Es amable, disfruta cocinar colores y quiere que su región sea apreciada por visitantes. Busca que una visitante pruebe un plato local y quiera volver. Su deseo de hospitalidad la hizo privilegiar el gusto ajeno sobre diversidad propia.

**Cambio:** Mantiene banco local, ensaya intercambio y acepta límites ecológicos. Ninguna planta de otro mundo elimina requisitos de Celia.

**Vínculos:** Valentina, Elvira, Yuna. **Naturaleza:** persona_viva. **Hogar planificado:** `iridalia_vivienda_02`.

#### La variedad que casi no vimos · `V_iris_liora`

**Primeros años y lo que aprendió a querer:**

Liora trabajaba huertos donde variedades parecidas tenían sabores que una familia distinguía de inmediato. Le gustaba aprender esos nombres sin convertir cada diferencia en jerarquía. Una planta terrestre adaptada abrió ventas nuevas y permitió mejorar instalaciones. El éxito fue real y llegó antes de que comparara cuánto había retirado para darle espacio.

**Aprendizaje, decisiones y vínculos:**

Sustituyó parte de una variedad local y después registró ganancia sin anotar pérdida de diversidad. Yuna conservaba semillas que parecía rentable dejar atrás. Liora la consideró nostálgica en una reunión y usó innovación como sinónimo de mejora total. La crítica que necesitaba era concreta: qué se perdería si todos imitaran su decisión.

**Lo que cambia y lo que todavía pesa:**

La misión recupera diversidad posible y mantiene comercio con límites. No destruye una planta introducida por ser extranjera ni garantiza una variedad desaparecida mediante magia gratuita. Liora puede apreciar adaptación y conservar lo local sin reducir ambos a bandos. Las semillas regionales seguirán ofreciendo usos distintos, no una sola escalera de rendimiento.

**Cuando no ofrece una misión:**

Prueba platos de una mezcla voluntaria y camina huertos ajenos sin dar consejos antes de que se los pidan. Tras el arco usa dos columnas de seguimiento. Puede celebrar una venta y preguntar qué hizo posible conservar además otra parcela.

**Ante Fuatia:**

Fuatia protege tierra y Liora desea que escuche la diversidad de usos humanos sin priorizar solo el cultivo vistoso. Una bendición no decide qué variedad merece seguir. Si la diosa interviene para recuperar, el reparto de espacio seguirá necesitando consentimiento y agua.

**Conversaciones personales:**

##### VID_iris_liora_1 · Antes del cambio

> **Liora:** Llamé nostalgia a guardar una semilla porque la venta nueva parecía demostrar todo lo que yo defendía.
> **Yuna:** La venta mostraba un beneficio. No medía cada cosa que habíamos retirado.
> **Liora:** Quiero conservar lo que aprendí de adaptación sin borrar esa pérdida.
> **Yuna:** Podemos tener dos columnas que no compitan por ser la única historia.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_iris_liora_2 · Después del arco personal

> **Liora:** Vendimos una parte y conservamos otra variedad con su agua prevista.
> **Yuna:** ¿Quieres probar cómo sabe sin calcular inmediatamente otra receta comercial?
> **Liora:** Sí. Antes aprendía así y luego olvidé que una comida también puede ser la meta.
> **Yuna:** Entonces esta tarde no necesita un informe de productividad.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar banco de semillas.

> **Liora:** Vendimos más. Guardamos menos formas de volver a empezar.

**Acto 2:** Cultivar ensayo cerrado con insumos.

> **Liora:** Yuna encontró la variedad que yo llamaba poco productiva. Era la que resistía una condición que no había probado.

**Acto 3:** Restaurar lote local y publicar condiciones de intercambio.

> **Liora:** El banco conservará diversidad, no solo el cultivo que mejor sale en la foto.

**Acceso narrativo:** después de `P19` y visita autorizada. **Decisión antes del acto 3:** Banco local o intercambio pequeño.

> **Liora · respuesta 1:** Local: Mantendrá registros y acceso comunitario.

> **Liora · respuesta 2:** Intercambio: Será reversible y sin liberar especies fuera del recinto.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La variedad que casi no vimos». Ficha de banco local e intercambio reversible de semillas, sin productividad global añadida. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Edda · `iris_edda`

**Pasado:** Edda, 37, observadora de fauna, permitió una captura para investigación y la presentó como rescate. El animal estaba sano; el proyecto quería poseer lo que no podía estudiar quieto.

**Presente y personalidad:** Es franca, disfruta caminar sin equipo y tiene afecto por investigadores, no desprecio general por ciencia.

**Cambio:** Exige motivos verificables, favorece observación y no convierte toda especie útil en ganado disponible. Puede colaborar con Kiara en una prueba pequeña sin que eso contradiga sus límites. La observación también admite curiosidad y conversación.

**Vínculos:** Kiara, Calista, Mauro. **Naturaleza:** persona_viva. **Hogar planificado:** `iridalia_vivienda_02`.

#### Lo que no necesita dueño · `V_iris_edda`

**Primeros años y lo que aprendió a querer:**

Edda observaba fauna porque le gustaban conductas que no podía dirigir. Aprendió a quedarse quieta sin esperar una recompensa inmediata y disfrutaba una huella más que una captura. Un proyecto prometió estudiar una especie con instrumentos nuevos y ella imaginó todo lo que podría conocer. La institución llamaba rescate a retirar al ejemplar, palabra que daba a la salida una apariencia de cuidado.

**Aprendizaje, decisiones y vínculos:**

El animal estaba sano. Edda aceptó captura y después presentó seguridad como razón, aunque el propósito era tenerlo donde pudieran medirlo. En el recinto había alimento y menos decisión de espacio. Reconocerlo exigía cuestionar un proyecto con personas que también amaban investigar; no podía resolverlo llamándolos enemigos simples de naturaleza.

**Lo que cambia y lo que todavía pesa:**

La misión devuelve donde corresponde con seguimiento autorizado y propone observación sin posesión. No se libera algo en cualquier bioma por obtener un final feliz. Edda conserva ciencia y límite: una criatura útil no tiene obligación de hacerse doméstica. El jugador no recibe ese animal como premio de haberlo rescatado.

**Cuando no ofrece una misión:**

Dibuja comportamientos incompletos y disfruta un paseo donde no ve al animal buscado. Tras el arco admite ausencia de dato sin convertirla en necesidad de captura. Puede visitar a Mauro con una conversación que no revise cada paso de su antigua batida.

**Ante Fuatia:**

La amistad animal de Fuatia no le otorga propiedad automática sobre las criaturas. Edda desea escucharla y defender una negativa del animal incluso frente a una diosa poderosa. Un guardián elemental puede participar en combate por invocación pactada, no ser capturado del bioma y consumido como munición.

**Conversaciones personales:**

##### VID_iris_edda_1 · Antes del cambio

> **Edda:** Estaba sano. Yo usé rescate porque hacía más fácil aceptar que lo llevaríamos.
> **Mauro:** Yo también llamé amenaza a una marca que no sabía leer.
> **Edda:** Quiero investigar y no apropiarme de todo lo que no consigo observar quieto.
> **Mauro:** Empecemos por devolver con condiciones, no por otra palabra que vuelva la decisión bonita.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_iris_edda_2 · Después del arco personal

> **Edda:** No apareció hoy y registramos ausencia. Nadie preparó una captura para completar el informe.
> **Mauro:** ¿Seguimos caminando?
> **Edda:** Sí. Me gusta este lugar también cuando no me da un dato.
> **Mauro:** Voy a aprender a ofrecer esa visita sin llamarla decepcionante.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Observar conducta desde distancia.

> **Edda:** No estaba perdido. Éramos nosotros quienes queríamos que estuviera cerca.

**Acto 2:** Comparar riesgo real y propuesta de captura.

> **Edda:** Podemos aprender menos en una tarde y hacer menos daño para poder volver.

**Acto 3:** Diseñar ruta de observación sin mover nido.

> **Edda:** La ruta evita el nido. El animal no tendrá que pagar nuestra visita.

**Acceso narrativo:** después de `P19` y visita autorizada. **Decisión antes del acto 3:** Mirador lejano o registro por huellas.

> **Edda · respuesta 1:** Lejano: Tendrá distancia y horario claros.

> **Edda · respuesta 2:** Huellas: No exige localizar ni tocar al animal.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «Lo que no necesita dueño». Ruta de observación a distancia o por huellas, sin captura, nido apropiado ni domesticación forzada. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Mauro · `iris_mauro`

**Pasado:** Mauro, 45, guía, confundió marcas de fauna con amenaza y organizó una batida innecesaria. Edda la detuvo; él evitó admitir el error por miedo a perder clientes.

**Presente y personalidad:** Es afable, colecciona zapatos viejos de rutas y disfruta aprender palabras extranjeras. Quisiera conducir un paseo donde nadie sienta amenaza permanente. Había aprendido a vender atención asustando y ahora tiene que aprender otro ritmo.

**Cambio:** Contrasta indicios, retira alarmas falsas y distingue peligro de vida salvaje. Sus mapas no desbloquean caza indiscriminada.

**Vínculos:** Edda, Vera, Yuna. **Naturaleza:** persona_viva. **Hogar planificado:** `iridalia_vivienda_03`.

#### La huella que no perseguimos · `V_iris_mauro`

**Primeros años y lo que aprendió a querer:**

Mauro empezó guía con visitantes que querían entender una señal de fauna sin aproximarse. Le gustaba traducir precaución en una ruta cómoda. La reputación dependía de parecer preparado y cada marca desconocida lo inquietaba. En vez de decir falta comprobar, inventó una clasificación que otros repetían con respeto.

**Aprendizaje, decisiones y vínculos:**

Organizó una batida innecesaria. Edda la detuvo mostrando conducta que la marca no señalaba. Mauro quiso conservar la idea de peligro posible para no retirar todo el diagnóstico. Que pudiera existir otro riesgo no probaba el que había anunciado. La exageración había movilizado trabajo y miedo contra animales sanos.

**Lo que cambia y lo que todavía pesa:**

La misión revisa indicios, devuelve recursos no consumidos y publica corrección a clientes. No obliga a Mauro a exponerse a daño para demostrar confianza en fauna. Puede seguir siendo guía seguro con límites de conocimiento visibles. Sus rutas ofrecen variaciones reales sin vender una amenaza inventada cada vez.

**Cuando no ofrece una misión:**

Le gusta un trayecto que conoce por olores de comida y recuerda bromas de visitantes. Tras el arco pregunta a Edda sin llamarla siempre supervisora de sus fallos. Puede querer una jornada de buen ingreso y conservar la palabra desconocido donde corresponde.

**Ante Fuatia:**

Fuatia puede hablar con animales y Mauro quiere aprender sin tratar ese lenguaje como detector de maldad. Una criatura defensiva no es enemiga porque dificulte una ruta rentable. Si la diosa se vuelve cruel con un humano, él no necesita describir toda su presencia como buena para conservar alianza.

**Conversaciones personales:**

##### VID_iris_mauro_1 · Antes del cambio

> **Mauro:** Dije peligro porque desconocido sonaba demasiado débil para cobrar una visita.
> **Edda:** Después empezaron a preparar la batida como si la marca confirmara tu frase.
> **Mauro:** Intenté conservar otro riesgo posible para no retirar éste.
> **Edda:** Podemos seguir siendo cuidadosos sin fabricar la prueba que falta.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_iris_mauro_2 · Después del arco personal

> **Mauro:** Hoy describí la huella y el límite de lo que sabemos. Nadie pidió una historia más aterradora.
> **Edda:** ¿Te gustó la visita?
> **Mauro:** Sí. Me alegró que eligieran quedarse por el paisaje, no por un miedo que yo les vendí.
> **Edda:** Hay bastante mundo para mirar sin organizar otra persecución.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Comparar tres marcas en ruta segura.

> **Mauro:** La huella era real. La amenaza la puse yo.

**Acto 2:** Consultar registro de fauna.

> **Mauro:** Edda no me pidió no tener miedo. Me pidió no venderlo como información.

**Acto 3:** Corregir aviso y señalizar paso protegido.

> **Mauro:** Este aviso dice convive aquí, no elimínalo.

**Acceso narrativo:** después de `P19` y visita autorizada. **Decisión antes del acto 3:** Desvío o mirador controlado.

> **Mauro · respuesta 1:** Desvío: Tendrá costo y distancia explícitos.

> **Mauro · respuesta 2:** Mirador: Mantendrá límites de Edda y no permitirá captura.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `agenda` y recuerdo «La huella que no perseguimos». Mapa de convivencia con fauna, revisable y sin convertir indicios en permiso de caza. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.

### Yuna · `iris_yuna`

**Pasado:** Yuna, 32, estudió clima y conservó semillas que otros consideraban poco rentables. Al ganar reconocimiento empezó a decidir sola qué variedad debía preservarse, repitiendo la exclusión que combatía.

**Presente y personalidad:** Es curiosa, hace mapas de colores y aprecia plantas feas. Quiere diversidad, teme perder tiempo negociando.

**Cambio:** Comparte criterios con cultivadores, publica condiciones y conserva opciones de cambio. Permite una excepción propuesta por Liora y registra el criterio. Así protege diversidad sin convertir su propia lista en una forma fija.

**Vínculos:** Liora, Duna, Alina. **Naturaleza:** persona_viva. **Hogar planificado:** `iridalia_vivienda_03`.

#### La lista que dejó una semilla fuera · `V_iris_yuna`

**Primeros años y lo que aprendió a querer:**

Yuna guardaba semillas que no tenían mucha demanda y aprendía usos preguntando a hogares que no salían en informes comerciales. Le gustaba una diversidad que no necesitaba parecer exótica. El primer reconocimiento hizo visible años de trabajo poco celebrado. Quiso proteger esa oportunidad y empezó a hablar como si conservar la colección le concediera autoridad sobre todas las futuras selecciones.

**Aprendizaje, decisiones y vínculos:**

Decidió sola qué debía preservarse. Cuando otro sector pidió reservar una variedad diferente respondió con datos de rentabilidad insuficiente, el mismo lenguaje que antes había rechazado para la suya. Tener una causa valiosa no evitaba que excluyera a quienes sostenían otra memoria o necesidad. Liora podía señalarlo sin borrar su propia sustitución dañina.

**Lo que cambia y lo que todavía pesa:**

La misión abre prioridades, participación y suministro finito. No se conserva todo mediante espacio ilimitado ni se obliga a cultivar una especie para acreditar virtud. Yuna sigue aportando conocimiento y acepta que una votación no elija su propuesta completa. El tratado de Iridalia protege acceso comunitario y no entrega control al protagonista visitante.

**Cuando no ofrece una misión:**

Le gustan recetas de familia que puede adaptar por gusto y paseos donde no lleva muestras. Tras el arco ofrece una explicación y deja que otra persona escoja. Puede estar decepcionada por perder una decisión sin llamar destructores a todos los que priorizaron distinto.

**Ante Fuatia:**

Quiere que Fuatia premie cuidado sin escoger únicamente al interlocutor que conoce mejor. La diosa podría proteger un lote y aún necesitar revisar qué grupo recibió voz. Yuna defiende diversidad frente a poder enorme mientras recuerda que ella también debe dejar decidir.

**Conversaciones personales:**

##### VID_iris_yuna_1 · Antes del cambio

> **Yuna:** Defendí una semilla ignorada y después usé mi reconocimiento para ignorar otra propuesta.
> **Liora:** No necesito que desaparezca tu colección para que podamos revisar esa decisión.
> **Yuna:** Me cuesta perder una prioridad que ya siento como parte de mí.
> **Liora:** Podemos decirlo sin convertir la votación en un juicio sobre cuánto quieres el mundo.

Condición: `visita_autorizada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

##### VID_iris_yuna_2 · Después del arco personal

> **Yuna:** Hoy eligieron otra variedad para una parte del espacio. Yo expliqué la mía y acepté el resultado.
> **Calista:** ¿Vas a volver a la siguiente asamblea?
> **Yuna:** Sí. Seguir discrepando no significa que la institución ya no me pertenezca.
> **Calista:** Después podemos comer algo cuya receta nadie tenga que votar.

Condición: `mision_personal_completada`. Repetible; no entrega recursos, premios ni amistad por reproducción.

**Acto 1:** Revisar criterios y testimonios.

> **Yuna:** Defendí lo que no entraba en sus listas. Después hice una lista que nadie podía discutir.

**Acto 2:** Comparar dos variedades bajo condiciones registradas.

> **Yuna:** Liora no quiere borrar la diversidad. Quiere saber cómo participar en su cuidado.

**Acto 3:** Crear banco con revisión y cupos publicados.

> **Yuna:** El banco tendrá espacio reservado para lo que todavía no sabemos valorar.

**Acceso narrativo:** después de `P19` y visita autorizada. **Decisión antes del acto 3:** Cupos por comunidad o por condición climática.

> **Yuna · respuesta 1:** Comunidad: Revisaremos representación sin prometer capacidad infinita.

> **Yuna · respuesta 2:** Clima: Las pruebas y excepciones seguirán abiertas.

**Recuperación:** Puede suspenderse y retomarse sin reloj real; devolver reservas no consumidas. Lo ya confirmado conserva su recibo. Una negativa de otro personaje ofrece espera o documento autorizado equivalente; nunca falsificar consentimiento.

**Premio único:** `conocimiento` y recuerdo «La lista que dejó una semilla fuera». Comparador de variedades y criterios de banco con revisión, cupos y espacio para excepciones. Ver [límites](05-jugabilidad.md). Ambas ramas conservan utilidad equivalente.
