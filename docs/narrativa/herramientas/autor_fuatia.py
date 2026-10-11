"""Expansión de Fuatia: conserva IDs anteriores y añade campaña y encargos propios."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
principales = []
secundarias = []


def f(n, titulo, zona, requiere, reparto, acciones, inicio, giro, cierre,
      decision, consecuencias, ramas, familia, efecto):
    principales.append(dict(id=f'F{n:02}', titulo=titulo, zona=zona,
        requiere=requiere.split(), reparto=reparto.split(), acciones=acciones,
        inicio=inicio, giro=giro, cierre=cierre, decision=decision,
        consecuencias=consecuencias, ramas_dialogo=ramas, premio=familia,
        efecto_premio=efecto, clase='principal_elemental', estado='diseno_no_integrado',
        recuperacion='Conservar pruebas y elección confirmadas, volver al último refugio y devolver reservas no consumidas. Ninguna escena avanza días, renueva depósitos o duplica un premio. Si falta un material, consultar su ruta autorizada; no hay plazo real ni penalización por suspender.'))


f(1, 'Lo que bebe un surco', 'pueblo_sol', 'P01', 'botanica agricultor figura_fuatia',
  'Comparar humedad de dos surcos ordinarios y el registro de un canal; visitar una orilla autorizada con Flora. Reunir prueba de suministro sin agotar cultivos. Una primera aparición de Fuatia reconoce la semilla sana y señala un intercambio detenido: la culpa no está en que alguien no haya rezado. Registrar su advertencia y una ruta de consulta.',
  'botanica: El surco no está pidiendo una promesa. Está pidiendo que miremos por dónde llegó el agua.\nfuatia: Me estás tocando con esa pala. No he venido a reprocharte el gesto.',
  'agricultor: ¿Si cuidas estos elementos, por qué una cosecha puede fallar?\nfuatia: Porque sentirlo todo no vuelve castigo cada cosa que ocurre. Y porque cuidar no significa impedir toda pérdida.\nella: Entonces no aceptaremos que se culpe a alguien por una semilla que no brotó.',
  'fuatia: Pueden llevarse una pregunta. ¿Quién recibe cuando esta agua parece desaparecer?\nel: La pondremos junto a las medidas, sin convertirte en explicación de lo que todavía no sabemos.',
  'Pedir una visita abierta de explicación o conservar por ahora la aparición como testimonio de trabajo.',
  'Ambas rutas conservan las medidas y abren P02. Visita abierta: Flora programa preguntas sin rito obligatorio. Testimonio de trabajo: el documento público conserva hechos sin publicar confidencias. Fuatia no concede ni retira clima por la opción.',
  ['fuatia: Hablaré ante quienes quieran venir. No fabricarás asistentes para que parezca una devoción.\nbotanica: También anotaremos las preguntas que no podamos resolver.',
   'fuatia: No necesito que anuncies cada vez que he escuchado.\nel: La medida quedará pública; la conversación íntima, donde se autorizó.'],
  'conocimiento', 'Comparador de humedad y procedencia del canal en el diario, basado en observaciones realizadas; no revela un terreno nunca visitado.')

f(2, 'El intercambio falseado', 'sangre/subsuelo', 'P06', 'minero brasa_idalia figura_fuatia',
  'Con el Subsuelo ya completado, contrastar dos fragmentos de registro de su conducto con una copia accesible de Darío. No extraer material de un juego para acreditar inventario del otro. Identificar retorno cerrado y punto de compensación. Fuatia contiene una fuga elemental mientras los protagonistas retiran la conexión autorizada; eso no mata al Conde ni sustituye la puerta de Corte.',
  'fuatia: Aquí el fuego sale, pero el retorno cuenta el mismo calor otra vez.\nminero: La pared continúa al otro lado. No significa que conozcamos la galería de allá.',
  'el: ¿Puedes apagarlo todo?\nfuatia: Puedo apagar todos los volcanes del planeta. Aquí haría que un circuito falso cobrara el intercambio donde ustedes no pueden verlo. Primero me mostrarán a quién está cargando el déficit.\nbrasa_idalia: El manuscrito del dragón decía reserva. No potencia desperdiciada.',
  'fuatia: Sostengo el tramo mientras desmontan esa unión. No confundan mi paciencia con debilidad.\nella: Y no llamaremos reparación a trasladar la pérdida a otro lugar.',
  'Documentar primero el retorno de agua o el retorno de aire; ambas pruebas ordinarias están disponibles.',
  'La secuencia de investigación cambia, no su costo ni el acceso a P07. La segunda lectura queda anotada antes del cierre; ninguna rama destruye un núcleo.',
  ['fuatia: Seguiremos el agua. Si falta, no completarás la cuenta con una ofrenda.\nminero: La muestra de registro basta; no necesita otro mineral del botín.',
   'fuatia: Seguiremos el aire. Escucha el aviso y mira también la marca.\nbrasa_idalia: Nadie tendrá que oír perfectamente para identificar el mismo retorno.'],
  'conocimiento', 'Ficha de retornos falsos que permite comparar documentos hallados de conductos sin sustituir una victoria de la Noche ni ofrecer energía de ataque.')

f(3, 'El hambre detrás del altar', 'vigilia', 'P10', 'posadera vigilia_noemi nox_inigo figura_fuatia',
  'Consultar el contrato público de un comedor de la Custodia y entrevistar voluntariamente a Íñigo en su relevo. Preparar una alternativa de provisiones con recetas y camas existentes. Fuatia propone cerrar el horno de quien contamina; registrar quién depende de esa mesa y garantizar traslado de atención antes de ejecutar un cierre material. No pedir testimonio a cambio de comida.',
  'fuatia: Ese horno derrama en mi agua lo que les promete limpiar del dolor.\nposadera: Puedo recibir personas. Tengo seis camas, no una respuesta ilimitada.',
  'nox_inigo: Primero daban comida. La deuda de obediencia venía después.\nfuatia: Si detengo al responsable, deja de dañar.\nvigilia_noemi: Sí. Y quienes comen allí todavía necesitarán cena esta noche.',
  'fuatia: El cierre permanece. La transición empezará antes, no en la mañana que alguien ya pasó con hambre.\nella: Cuidar a quienes dependían de él no lo vuelve inocente.',
  'Organizar cocina distribuida o alojamiento con turnos de comida; el presupuesto total es equivalente.',
  'Ambas alternativas mantienen atención y evidencias para P11. Cambian escenas posteriores de Rosa y Noemí. Ninguna obliga a todos los beneficiarios a declarar contra la secta.',
  ['posadera: Cada mesa tendrá cupo y un horario que podamos cumplir.\nfuatia: No pediré que me recen para recibir lo que prepararon ustedes.',
   'vigilia_noemi: Separaremos descanso y entrevista. Primero sabrán dónde dormir.\nfuatia: El responsable pierde su horno. Los demás no perderán el derecho a comer.'],
  'agenda', 'Plan de cupos de cocina y refugio consultable, con materiales reales y capacidad visible; no genera comidas ni camas automáticamente.')

f(4, 'Los que no celebraron el nacimiento', 'pueblo_sol', 'P12', 'archivero maestra figura_fuatia',
  'Contrastar el acta de AV 156 con dos relatos autorizados de descendientes, disponibles en copia. Las muertes precisas y la protección del origen no se desmienten: investigar cómo los protegidos vivieron después. Escuchar a Fuatia y registrar que duelo familiar no hereda culpa. No usar recuerdos reales de la pareja ni enviar niños a un desastre recreado.',
  'archivero: Dice que murieron quienes se aprovechaban y que quienes cuidaban fueron protegidos. Las dos copias coinciden.\nfuatia: También yo lo sentí. No vas a encontrar una víctima secreta que vuelva torpe mi nacimiento.',
  'maestra: Una mujer protegida lloró a alguien que sí había hecho daño.\nfuatia: No le cobré por llorarlo.\nella: El archivo la hizo agradecer en una frase. Su propio relato necesitó muchas páginas.',
  'fuatia: Puedes conservar esas páginas. No prometo gustarles en todas.\nel: No necesitamos que coincidan para reconocer lo que ocurrió.',
  'Exponer las fuentes juntas o organizar lectura voluntaria por separado.',
  'Las fuentes completas quedan disponibles en ambas rutas y P13 se abre. No hay bonus por hacer pública una identidad protegida; se conservan autorizaciones de copia.',
  ['maestra: La exposición distinguirá hecho y respuesta. Nadie tiene que visitar para demostrar respeto.\nfuatia: Déjenme también leer una pregunta que no esté diseñada para absolverme.',
   'archivero: Las versiones se consultarán completas, con sus límites.\nfuatia: No retiraré una protección porque alguien prefiera hablar de la pérdida.'],
  'acceso', 'Consulta de los expedientes autorizados del nacimiento y sus lecturas alternativas; no habilita memorias privadas ni establece una ley de castigo sobre la partida.')

f(5, 'Cuánto dura una sentencia', 'pueblo_sol', 'P16', 'agricultor carpintera figura_fuatia',
  'Consultar una reparación ya confirmada de agua y un cierre elemental que persiste sobre un depósito de explotación. La campaña tiene su propio caso archivado: V_agricultor no es obligatorio. Verificar obligaciones, beneficios y afectados actuales. Contrastar con la diosa qué pérdida sigue corrigiendo daño y cuál prolonga sufrimiento después de lo reparable. Mantener devolución pendiente sin exigir perdón.',
  'fuatia: Reconoce lo que tomó. No me pide que crea que el suelo debe olvidar.\nagricultor: Yo tampoco puedo decir que una devolución borra todo. ¿Cómo sabré cuándo puedo seguir?',
  'carpintera: El depósito sigue cerrado. Quienes reparan necesitan un lugar autorizado para guardar herramientas.\nfuatia: Quiere volver a usar lo que perdió.\nella: Podemos limitar ese uso sin hacer que cada jornada nueva sea la misma sentencia.',
  'fuatia: Habrá criterio de revisión. Mi rencor no cabe en esa cifra; el permiso sí tendrá que caber.\nel: No te estamos pidiendo que lo quieras. Estamos acordando qué podrá hacer.',
  'Mantener cierre con depósito alternativo o reapertura limitada tras verificación; capacidad y costos equivalentes.',
  'Ambas rutas responden al daño y permiten P17. Fuatia conserva reserva crítica; los vecinos discrepan. El depósito original no pasa al inventario ni se concede un multiplicador de producción.',
  ['fuatia: El cierre sigue. Las herramientas tendrán otra entrada que no cobre su castigo a todos.\ncarpintera: La alternativa tiene materiales y responsable, no solo una promesa.',
   'fuatia: Abriré el uso limitado que fue comprobado. No lo confundan con haber olvidado.\nagricultor: No lo haré. Tampoco pediré a otros que me perdonen para usarlo.'],
  'conocimiento', 'Registro de obligación, reparación y criterio de revisión de permisos; consulta narrativa que no cambia automáticamente afinidad divina ni clima.')

f(6, 'Una alianza sin adoración', 'estacion_celia', 'P20', 'orbita_helena iris_calista figura_fuatia',
  'Reunir registros de intercambio de los mundos ya visitados con copias principales accesibles. Presentar a Fuatia un acuerdo para entrar a Confluencia, la región de los cuatro elementos. Cada territorio conserva consentimiento y reserva. La alianza declara objetivos compatibles y salida posible; no obliga a elegir culto, donar animales o completar todo el reparto. Quedan abiertas las cuatro rutas F07–F10 en paralelo.',
  'fuatia: Puedo convertir un desierto en océano mientras terminas esa frase. No necesito un permiso para tener poder.\niris_calista: Nosotros sí necesitamos decidir qué vida continuaría en ese territorio después.',
  'orbita_helena: Queremos cerrar retornos de Vael, no pedirte cosechas infinitas.\nfuatia: Yo quiero que mis elementos dejen de alimentar su inmovilidad. Eso puede convenirnos a ambos.\nella: Una alianza, entonces. No un examen de si te creemos buena.',
  'fuatia: Entrarán en Confluencia con límites de retiro y retorno. Si me traen un altar bonito como prueba, perderán mi tiempo, no su vida.\nel: Traeremos lo que hizo cada intercambio y lo que todavía falta.',
  'Usar mesa abierta de seguimiento o informes de equipos locales con consulta común.',
  'La forma de coordinación cambia; la evidencia y el acceso a cuatro territorios son equivalentes. No es posible ceder soberanía de mundos como respuesta.',
  ['iris_calista: La mesa puede revisar el acuerdo y conservar disenso.\nfuatia: Yo también revisaré mis términos si el balance cambia.',
   'orbita_helena: Los informes dejan fuente y responsable local.\nfuatia: Que nadie me prometa el agua que otro territorio todavía no aceptó ceder.'],
  'acceso', 'Acceso diseñado a las cuatro rutas de Confluencia con condiciones de reserva y retorno; no concede teletransporte gratuito ni desbloquea economías antes de integración.')

f(7, 'El horno que sabe detenerse', 'confluencia_fuego', 'F06', 'brasa_sol brasa_idalia figura_fuatia',
  'Visitar Caldera del Rescoldo. Seguir prueba segura de calor y un horno de retorno falseado. Recuperar ferrascua de un depósito autorizado y madera de brasa caída, sin talar el núcleo ni alimentar hornos con animales. Procesar una junta de cierre con receta definida; detener la amplificación y enfrentar el patrón opcional de prueba o usar una solución técnica equivalente. El guardián no otorga una obligación de matar fauna.',
  'brasa_sol: Parece una pieza perfecta. La salida está en una junta que el plano trata como defecto.\nfuatia: La llama no tendría por qué quedarse aquí para siempre.',
  'brasa_idalia: Conservaremos reserva antes de cerrar. El dragón no gastó toda la suya por quedar heroico.\nfuatia: Puedo arrasar la máquina. Eso no me devuelve el retorno que envía su déficit a otro lugar.\nel: La abriremos por donde un humano puede mostrar lo que estaba escondido.',
  'fuatia: El calor circula. Vael perdió una forma de cobrarme dos veces.\nella: Y el territorio sigue ofreciendo trabajo después de que salgamos.',
  'Completar prueba de combate contra constructos o ajuste técnico con el mismo componente y tiempo activo aproximado.',
  'Ambas rutas entregan sello de retorno de fuego para F11. Armas de cualquier familia pueden completar combate; el ajuste técnico es alternativa de campaña sin exigir equipar espada.',
  ['brasa_sol: Tu golpe abrió el seguro, no una criatura que defendía su casa.\nfuatia: La fuerza tuvo un fin. No la convertirás en permiso de quemar después.',
   'brasa_idalia: El ajuste dejó la salida abierta y la reserva medida.\nfuatia: No confundiré trabajo silencioso con una victoria menor.'],
  'tecnica', 'Procedimiento de calibración térmica para una receta compatible, con el mismo material y rendimiento; reducción máxima del 20% del tiempo de operación, no acumulable.')

f(8, 'La orilla que devuelve', 'confluencia_agua', 'F06', 'lirios_maite pescadora figura_fuatia',
  'Visitar Mar de los Retornos, observar corriente con marcas accesibles y respetar refugio de juveniles. Obtener un lote autorizado de hidrita y juncovidrio después de comprobar recuperación. Desactivar una bomba que registra el mismo caudal como devolución; resolver defensas de constructos o revisar válvulas por ruta técnica equivalente. Registrar retorno real y reserva, no cantidad de peces capturados.',
  'lirios_maite: Hay más agua en el dibujo que en el canal. La cifra crece cada vez que vuelve a circular.\nfuatia: Me conoce por caudal y cree que puede fingirme con una cuenta.',
  'pescadora: La zona de crías queda fuera. No necesitamos pescarla para probar que está viva.\nella: ¿El cierre dejará agua a quienes están río abajo?\nfuatia: Si no vuelve a ellos, no es un retorno que pueda aceptar.',
  'lirios_maite: El registro mide circulación una vez, con destino visible.\nfuatia: Esta orilla no tendrá que desaparecer para resolver la próxima amenaza.',
  'Reparar ruta de válvulas o enfrentar constructos del muelle; mismas pruebas de caudal y costo de componente.',
  'Ambas rutas entregan sello de retorno de agua para F11 y dejan zona rejugable. No cambia clima mundial ni permite vender el mismo lote más de una vez.',
  ['lirios_maite: La válvula puede mantenerse sin pedir otra aparición.\nfuatia: La ayuda también puede dejar un trabajo que ustedes sepan continuar.',
   'pescadora: Los constructos se apagaron y la orilla de crías quedó fuera del combate.\nfuatia: Esa separación cuenta tanto como haber acertado el último golpe.'],
  'agenda', 'Plan de recuperación de depósitos de agua y juncos por noches dormidas, con reserva y cupo visibles; no recoge ni duplica recursos automáticamente.')

f(9, 'Lo que sostiene una raíz', 'confluencia_tierra', 'F06', 'bruma_silvana bruma_roque figura_fuatia',
  'Visitar Terraza de las Raíces y contrastar necesidad de soporte con permiso de extracción. Obtener terralita y madera de raigal en áreas autorizadas, con restitución definida. Reparar un paso sin abrir una veta del núcleo. Desmontar plataforma falsa de Vael mediante constructos o recorrido técnico con peso seguro; ambas rutas identifican por dónde estaba desviando retorno de suelo.',
  'bruma_silvana: Si prohíbo tocarlo todo, el paso se quedará roto. Si apruebo sin medir, llamaré cuidado a otra pérdida.\nbruma_roque: Esta vez podemos decir las dos cosas antes de cortar.',
  'fuatia: La raíz siente el apoyo que retiran. No acepta tus intenciones como sustituto del soporte.\nel: Tampoco necesita que una rampa sea enemiga de todo árbol.\nfuatia: Muestren carga y recuperación. Después discutiremos cuánto se puede retirar.',
  'bruma_roque: Queda una reparación que otro puede mantener con el mismo material.\nfuatia: No exige que yo sostenga eternamente la forma que ustedes fabricaron.',
  'Resolver el circuito por carga distribuida o combatir guardianes artificiales, conservando umbral y restitución.',
  'Ambas rutas entregan sello de retorno de tierra para F11. No obliga a perdonar el conflicto Gael/Roque ni concede crecimiento instantáneo de árboles.',
  ['bruma_silvana: La carga está repartida y mi firma deja criterio de revisión.\nfuatia: El suelo podrá responder distinto otra estación; el permiso no se volverá eterno.',
   'bruma_roque: La plataforma dejó de forzar el retorno. La madera usada tiene reposición prevista.\nfuatia: No confundas botín de constructo con propiedad de todas las raíces.'],
  'plano', 'Variante modular de soporte y reparación con las mismas entradas y rendimiento; no añade defensa global, tamaño de mochila ni capacidad gratis.')

f(10, 'El aire no firma obediencia', 'confluencia_aire', 'F06', 'piedra_hugo orbita_boris figura_fuatia',
  'Visitar Altura de las Corrientes con aire y ruta de retorno declarados. Seguir señales por texto, forma y sonido opcional. Recuperar aeralita y ramas caídas de velaria dentro del cupo. Identificar un ventilador de Forma Fija que envía presión como si fuera reserva; resolver constructos de carga anunciada o calibración técnica alternativa. Nadie debe adivinar la ruta por audio o color solamente.',
  'piedra_hugo: La señal suena, pero el texto dice otra vuelta. Podemos comparar sin pedir a nadie un oído perfecto.\nfuatia: El aire sigue pasando. La máquina registra que ya lo posee.',
  'orbita_boris: Reserva es una alternativa que puede usarse, no una cifra en movimiento perpetuo.\nella: ¿Puedes liberar la corriente sin vaciar otro lugar?\nfuatia: Cuando retiremos el retorno falso, sí. Antes nos estaría cobrando donde no miran.',
  'piedra_hugo: El aviso se entiende y el paso puede detenerse.\nfuatia: Respirar no firma tu lealtad. Tampoco la ayuda que recibiste hoy.',
  'Desactivar por señales de presión o combatir constructos con rutas de esquiva, con la misma calibración final.',
  'Ambas rutas entregan sello de retorno de aire para F11 y admiten todas las familias de arma. Se conserva oxígeno actual; no se obtiene una reserva infinita por escena.',
  ['piedra_hugo: La lectura tiene sustituto visual. Ya no depende de una sola forma de percibir.\nfuatia: También yo puedo hablar sin exigirte una respuesta que no recibiste.',
   'orbita_boris: Regresaremos con margen después de la prueba.\nfuatia: La maniobra no merece más respeto por terminar casi sin aire.'],
  'conocimiento', 'Guía de señales de viento y presión para circuitos descubiertos, con opciones de lectura redundante; no revela enemigos ni depósitos fuera de visita.')

f(11, 'Cuatro cuentas y ninguna deuda oculta', 'confluencia', 'F07 F08 F09 F10', 'orbita_rita esmeralda_indira figura_fuatia',
  'Reunir los cuatro sellos confirmados y verificar que cada compensación tiene destino distinto del retorno falseado. Los sellos son hitos, no consumibles vendibles. Construir una matriz con componentes obtenidos en las rutas autorizadas, comparar estados de reserva y bloquear activación incompleta. No vaciar hogares, granja ni otros mundos para completar una escena.',
  'orbita_rita: Cuatro cuentas no hacen un equilibrio si todas apuntan al mismo depósito inventado.\nesmeralda_indira: Conservaremos las señales originales. No las amplificaré para que parezcan de acuerdo.',
  'fuatia: Siento que la materia vuelve. Quiero saber por qué pensaste que faltaba una quinta devolución.\nel: Porque Vael puso una casilla donde nadie podría revisar. No hace falta llenarla; hace falta retirarla.\nella: El acuerdo debe poder detenerse antes de cobrar esa pérdida.',
  'fuatia: Puedo sostener esta operación. El poder que pedían estaba aquí; el balance que necesitábamos ahora también.\norbita_rita: Y nadie tendrá que fingir que apareció de la nada.',
  'Mostrar lectura por territorio o por tipo de retorno; ambas vistas conservan los mismos datos y parada.',
  'Se confirma matriz apta para F12. Las vistas son accesibilidad de consulta, no elecciones de afinidad. Ningún sello aumenta daño, minería, producción o amistad.',
  ['esmeralda_indira: Cada territorio ve su aporte y lo que recibe.\nfuatia: No borrarás una pérdida solo porque el total pueda escribirse como cero.',
   'orbita_rita: Cada retorno conserva origen, salida y reserva.\nfuatia: La balanza no necesita una historia más limpia que los movimientos que la sostienen.'],
  'agenda', 'Comparador de reservas e intercambios de los cuatro territorios que usa hitos reales; no genera materiales, repone aire ni mantiene operaciones sin autorización.')

f(12, 'Confluencia puede cambiar', 'confluencia', 'F11', 'brasa_sol iris_calista figura_fuatia',
  'Activar la matriz confirmada y desmontar el circuito de Forma Fija en la Cámara de los Núcleos. La prueba final admite espada, arco, bastón o invocación pactada sin requisito exclusivo de familia; alternativa técnica de campaña usa la misma matriz y registros. Fuatia redistribuye calor, humedad, soporte y presión con balance verificado. Cerrar la conexión, conservar territorios, permitir futuras visitas y preparar tratado P21.',
  'vaelthor: Puedo garantizar que nadie extraiga más de lo que te conviene. Solo debes mantener cada cosa donde la he colocado.\nfuatia: Incluidas la llama y la semilla, que dejarían de ser lo que protejo.',
  'brasa_sol: La junta abierta admite un cambio. No necesita que la pieza se deshaga.\nfuatia: Vael, me ofreciste obediencia. Ahora puedo darte una devolución exacta de lo que quitaste.\nella: La matriz permite parar. También a nosotros.',
  'fuatia: Los territorios siguen vivos. Puedo colaborar otra vez si nuestros intereses coinciden. No les prometo volverme mansa.\nel: Preferimos condiciones claras a una lealtad que exija callarnos.',
  'Dejar mesa de revisión comunitaria o custodia distribuida con consulta común.',
  'Ambas rutas mantienen Confluencia accesible, abren P21 y conservan materiales regionales útiles. Fuatia no se redime automáticamente, Vael conserva responsabilidad y no se reemplaza el final contra Nath.',
  ['iris_calista: La mesa puede revisar, incluso si la revisión nos incomoda.\nfuatia: Inclúyanme en la conversación. No me entreguen por eso la última palabra humana.',
   'brasa_sol: Cada territorio conserva una pieza mantenible y un registro común.\nfuatia: Un acuerdo distribuido no tendrá que vivir preso en una forma perfecta.'],
  'trofeo', 'Recuerdo exhibible de la Confluencia y una escena repetible sin premio adicional; cero estadísticas, clima manipulable o acceso a los núcleos para extracción.')


def t(n, titulo, zona, requiere, reparto, acciones, lineas, eleccion, ramas, familia, efecto, pistas=None):
    q = dict(id=f'T{n:02}', titulo=titulo, zona=zona, requiere=requiere.split(),
        reparto=reparto.split(), acciones=acciones, lineas=lineas, eleccion=eleccion,
        ramas=ramas, premio=familia, efecto_premio=efecto, clase='secundaria_elemental',
        estado='diseno_no_integrado', recuperacion='Conservar pruebas y reservas confirmadas; posponer sin reloj real y retomar por ruta autorizada. Las ramas ofrecen utilidad equivalente. No se altera clima, cuidado o producción por escuchar un diálogo.')
    if pistas:
        q['pistas'] = pistas
        q['secreta'] = True
    secundarias.append(q)


t(1, 'Un árbol también sostiene una casa', 'brumaverde', 'F01', 'guardabosques bruma_roque figura_fuatia',
  ['Consultar permiso de madera y necesidad de rampa', 'Comparar árbol protegido, pieza caída y materiales existentes sin retirar un núcleo', 'Acordar extracción o reutilización con costo y recuperación visibles'],
  'guardabosques: Usé protector del bosque para que nadie preguntara por la rampa.\nfuatia: Un corte deja una herida.\nbruma_roque: Un techo que no puede repararse deja gente fuera. Muestro la cantidad, no un derecho a tomarlo todo.\nfuatia: Puedo medir una solicitud. No me ofrezcas que jamás volverás a necesitar madera.\nella: El permiso dirá para qué alcanza.\nguardabosques: Y quién lo revisa sin tener que pedirle a un vecino que lo adore.',
  'Reutilizar pieza almacenada o retirar madera autorizada con reposición equivalente.',
  ['bruma_roque: La reutilización se paga y conserva límites del soporte.\nfuatia: No es una virtud invisible: quedó un recurso que no hubo que retirar.',
   'guardabosques: La extracción tiene umbral y reparación prevista.\nfuatia: Mi permiso no volverá ilimitado el siguiente corte.'],
  'plano', 'Diseño reparable de rampa con entradas equivalentes, sin bonificación de venta ni ampliación gratis de vivienda.')

t(2, 'El pez no es una ofrenda', 'puerto_lirios', 'F01', 'pescadora lirios_maite figura_fuatia',
  ['Observar altar público y reserva de juveniles', 'Ofrecer un gesto de limpieza con materiales reales en vez de capturar crías', 'Registrar cuota de acceso y devolución sin decidir devoción de otros'],
  'pescadora: Traían un pez pequeño porque lo llamaban la ofrenda más rara.\nfuatia: Quiero esta vida en el agua, no en mi altar.\nlirios_maite: La alternativa puede ser limpiar una orilla. Si siempre lo hace la misma familia, también habrá costo oculto.\nfuatia: Pongan turnos.\nella: Y dejar de asistir no convierte a nadie en destructor.\nfuatia: Cuidar sí tendrá que demostrarse por lo que hagan fuera de la ceremonia.',
  'Mantener altar con gesto no extractivo o retirar la práctica y conservar punto de observación.',
  ['pescadora: El altar queda sin pedir una captura.\nfuatia: Aceptaré gratitud sin hacerla una tarea de cada pez.',
   'lirios_maite: La observación sigue disponible para todos.\nfuatia: No necesito una mesa para sentir quién cuida la orilla.'],
  'conocimiento', 'Ficha de refugios de juveniles y prácticas de devolución observadas; no mejora probabilidades de pesca ni revela especies no vistas.')

t(3, 'La cría que no quiere hablar', 'pueblo_sol', 'F01', 'cuidadora veterinaria figura_fuatia',
  ['Observar descanso ordinario con Mara', 'Retirar visitantes y acordar una aparición discreta, sin comprar ni cruzar animales', 'Comparar bienestar por reglas existentes y dejar contacto voluntario'],
  'fuatia: Me oye. Está cansada de que ustedes esperen una respuesta.\ncuidadora: Yo esperaba que quisieras que la oyéramos también.\nfuatia: Hablar con ella no me convierte en dueña de su tarde.\nveterinaria: Dejaremos la observación sin volver diagnóstico cada palabra.\nella: Entonces el encuentro puede terminar aquí.\ncuidadora: Y nosotros iremos a merendar sin que la cría tenga que agradecérnoslo.',
  'Visita breve silenciosa o retirarse y consultar observación autorizada después.',
  ['fuatia: Pueden quedarse sin tocar. Ella puede continuar dormida.\ncuidadora: No traeré otra visita para demostrar que pasó.',
   'veterinaria: La observación estará en la ficha con sus límites.\nfuatia: Ninguna de sus líneas tendrá que pronunciarla el animal.'],
  'agenda', 'Lista de visitas y descansos anotados por cuidado real; no alimenta, cura, acelera crecimiento ni altera genomas automáticamente.')

t(4, 'Una marca no es una orden', 'confluencia_aire', 'F10', 'piedra_hugo nox_tamara figura_fuatia',
  ['Comparar tres señales de retorno por texto y forma', 'Ajustar aviso redundante con componentes autorizados', 'Probar lectura sin sonido y sin dependencia exclusiva de color'],
  'piedra_hugo: Los ojos rojos dicen que usa fuego, no que todos deben salir corriendo.\nfuatia: Una vez mostré ira y lo interpretaron como permiso para quemar una casa. Nunca lo di.\nnox_tamara: El aviso debe decir qué ocurre, qué falta y qué podemos hacer.\nella: Puede ser bonito además de legible.\nfuatia: Mientras no utilice belleza para esconder una amenaza.\npiedra_hugo: La prueba tendrá varias maneras de leer la misma condición.',
  'Priorizar símbolos de presión o texto de estado, manteniendo ambas lecturas disponibles.',
  ['piedra_hugo: Los símbolos no reemplazan la descripción.\nfuatia: No exigiré ojos perfectos para comprenderlos.',
   'nox_tamara: El texto tiene una lectura de forma alternativa.\nfuatia: El silencio del aviso no significa que el riesgo se haya ido.'],
  'conocimiento', 'Guía consultable de señales elementales con equivalencia por texto, forma y sonido opcional; no introduce una cura o sentido superior.')

t(5, 'La cuenta de los días castigados', 'brasaviva', 'F05', 'brasa_ramiro brasa_sol figura_fuatia',
  ['Consultar retirada segura de un lote y obligaciones confirmadas', 'Identificar qué pérdida protege todavía el entorno y cuál prolonga la sanción', 'Proponer revisión con responsable y derecho a mantener disenso'],
  'brasa_ramiro: Respondí por las facturas. Quedan restituciones y quiero que tengan medida.\nfuatia: Lo que hicieron con tus recipientes no cabe en una caja devuelta.\nbrasa_sol: La reparación no pretende borrar ese uso. Necesita saber qué puede completar hoy.\nella: Ninguna víctima tiene que perdonar para que exista un criterio.\nfuatia: Quiero que recuerde.\nbrasa_ramiro: Voy a recordar. No puedo vivir cada jornada inventando qué pérdida te parecería suficiente.',
  'Mantener restricción con transición laboral o revisar un uso limitado después de inspección.',
  ['brasa_sol: La restricción tiene alternativa y fecha agrícola de revisión acordada.\nfuatia: No usarán el plazo para declarar olvidado el daño.',
   'brasa_ramiro: El permiso limitado no retira mis obligaciones pendientes.\nfuatia: También mi sentencia dejará visible qué todavía está corrigiendo.'],
  'agenda', 'Registro de restituciones y revisiones del taller, sin cancelar deudas o crear ingresos por decisión de diálogo.')

t(6, 'La lluvia que no nos deben', 'ambarina', 'F06', 'ambar_zora ambar_alina figura_fuatia',
  ['Medir reserva de cultivo con una prueba local autorizada', 'Comparar intervención enorme de agua con ajuste viable y sus compensaciones', 'Acordar riego limitado o cultivo adaptado con necesidades reales'],
  'ambar_zora: Puedes hacer océano donde hay desierto. No quiero ofrecerte gratitud antes de preguntar qué desaparece de nuestra vida.\nfuatia: No estaba pidiendo que quieras el mar. Estaba mostrando que puedo hacerlo.\nambar_alina: Necesitamos agua, no un paisaje que borre toda adaptación.\nella: La decisión puede ser pequeña sin negar tu poder.\nfuatia: Si conserva balance, puede ser precisamente la decisión correcta.\nambar_zora: Y la comunidad podrá decirlo sin que yo hable por todos.',
  'Ajustar reserva de riego o priorizar variedad de consumo menor; costos y metas equivalentes.',
  ['ambar_alina: La reserva sigue medida y la semilla todavía necesita cuidado.\nfuatia: La ayuda no le quitará esa vida cotidiana.',
   'ambar_zora: La adaptación se decide con quienes la cultivarán.\nfuatia: Protegeré el intercambio, no exigiré que me prometan otra geografía.'],
  'conocimiento', 'Comparador de necesidad hídrica de variedades observadas, sin semillas inmunes a sequía ni cambios gratuitos de clima.')

t(7, 'Un calor que puede compartirse', 'confluencia_fuego', 'F07', 'brasa_rufina brasa_nadia figura_fuatia',
  ['Consultar usos de calor de baños, horno y refugio', 'Construir un intercambiador definido con componentes recuperables', 'Ensayar parada y turnos con una reserva que no use criaturas como combustible'],
  'brasa_rufina: El calor también sirve a una persona que no producirá nada después.\nbrasa_nadia: Lo dejé fuera cuando conté cosechas. Esta vez está en la primera fila.\nfuatia: Mi fuego puede durar. No sostendrá una promesa que exige secar el agua de otro territorio.\nella: El intercambiador tendrá parada.\nbrasa_rufina: Y un turno donde yo pueda entrar sin dirigirlo.\nfuatia: Eso lo decidirán ustedes, no mi altar.',
  'Dar prioridad horaria a descanso o a operación, manteniendo cupos y reserva mínima iguales.',
  ['brasa_rufina: El descanso tiene una franja real y otra persona responsable.\nfuatia: El calor no medirá cuánto merecía sentarse cada visitante.',
   'brasa_nadia: La operación usa una franja limitada y devuelve calor al circuito.\nfuatia: No convertirán esa prioridad en una licencia de consumir siempre primero.'],
  'plano', 'Intercambiador mantenible con las mismas entradas y producción base, sin energía infinita, animales-combustible ni multiplicador apilable.')

t(8, 'Quien guardó una piedra sin altar', 'pueblo_sol', 'F04', 'archivero bruma_benicio figura_fuatia',
  ['Reunir dos pistas públicas autorizadas de una tradición familiar', 'Contrastar nota completa sin invadir una vivienda', 'Escuchar una variante del relato con permiso o conservar privacidad con cierre equivalente'],
  'archivero: Guardaban la piedra porque les recordaba una protección. Nunca levantaron un altar.\nbruma_benicio: La copia resumida los hizo devotos perfectos. El relato completo decía agradecidos y asustados.\nfuatia: Pueden sentir ambas cosas.\nella: ¿También alguien que recibió un favor hoy?\nfuatia: Mientras el miedo no se convierta en otro daño que pretendan justificarme.\nel: Lo registraremos sin obligar a la familia a representar esa discusión para nosotros.',
  'Leer relato autorizado o respetar privacidad y documentar únicamente la práctica pública.',
  ['bruma_benicio: La versión conserva a quien cuenta y los límites que eligió.\nfuatia: No le pediré borrar el miedo para aceptar su agradecimiento.',
   'archivero: La ficha no promete un nombre que no nos autorizaron.\nfuatia: La piedra sigue siendo suya sin que la historia se vuelva tu hallazgo.'],
  'trofeo', 'Recuerdo de interpretación del altar, exhibible por ambas ramas sin identificar a una familia que reserve privacidad; no paga monedas por lectura.',
  ['Piedra de cuatro colores registrada como préstamo público, no objeto para llevar', 'Nota de catálogo que distingue gratitud de devoción obligatoria', 'Verso de Benicio que anuncia una variante sin nombres familiares'])

base = json.loads((ROOT / 'datos/campana.json').read_text())
assert {q['id'] for q in base if q['id'].startswith('P')} == {f'P{n:02}' for n in range(1,25)}
base = [q for q in base if q['id'].startswith('P')]
por_id = {q['id']: q for q in base}
for target, predecessor in [('P02','F01'), ('P07','F02'), ('P11','F03'), ('P13','F04'), ('P17','F05'), ('P21','F12')]:
    por_id[target]['requiere'] = [predecessor]
if 'fuatia: Esa perfección me estaba cobrando aire de un lugar que su plano no mostraba. La matriz ya sabe detener el cobro.' not in por_id['P22']['giro'].splitlines():
    por_id['P22']['giro'] += '\nfuatia: Esa perfección me estaba cobrando aire de un lugar que su plano no mostraba. La matriz ya sabe detener el cobro.'
if 'fuatia: Ahora sí. El fuego devuelve calor, el agua conserva curso, la tierra sostiene y el aire no paga una deuda inventada. No necesito arrasar este mundo para quitarte el intercambio.' not in por_id['P23']['giro'].splitlines():
    por_id['P23']['giro'] += '\nfuatia: Ahora sí. El fuego devuelve calor, el agua conserva curso, la tierra sostiene y el aire no paga una deuda inventada. No necesito arrasar este mundo para quitarte el intercambio.'
if 'fuatia: Seguiré sintiendo lo que hagan. También podré escuchar cuando discrepen de mí sin dejar de cuidar.' not in por_id['P24']['cierre'].splitlines():
    por_id['P24']['cierre'] += '\nfuatia: Seguiré sintiendo lo que hagan. También podré escuchar cuando discrepen de mí sin dejar de cuidar.'
(ROOT / 'datos/campana.json').write_text(json.dumps(base + principales, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'datos/elementales.json').write_text(json.dumps(secundarias, ensure_ascii=False, indent=2) + '\n')
