# El reparto de Astra

142 NPC, cada uno con biografía y un arco personal de tres actos. Los nombres se adoptan para autoría; sus IDs originales permanecen. Las cinco figuras divinas están en [Mundo](01-mundo.md) y Sangrevil y protagonistas en [Campaña](02-campana.md).

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
