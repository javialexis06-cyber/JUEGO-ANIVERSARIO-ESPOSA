# Campaña jugable y contrato de los puestos

La pestaña **Campaña** del menú lleva el diario nuevo. **Astra** conserva los accesos, biografías,
recuerdos y encargos de los pueblos. El diario anterior conserva los trabajos de la granja.
El estado `historia` se añade a V5; importar una partida anterior conserva el resto de sus bloques.
Los expedientes de `astra.expedientes` siguen existiendo, pero no completan objetivos del nuevo diario.

## Primer bloque: 36 contratos principales

P01–P24 y F01–F12 tienen 110 objetivos. La campaña registra siembra, riego y cosecha del mismo surco,
alimentación y compañía de animales distintos, jornadas dormidas, entregas reales, respuestas de cada
participante y pruebas interactivas. Las visitas y las puertas de Sangre se contrastan con sus registros.
No se sustituye una puerta de Sangre por una secuencia agrícola. El perfil consultado sigue siendo el del
personaje seleccionado; no se transfieren recursos ni victorias entre los dos juegos.

Las pruebas son de contraste de fuentes, secuencias de operación, circuitos de uniones giratorias y un
laberinto con colisiones. En la Casa Fija hay que conservar A y B, retirar autorización en R y salir por E.
El circuito exige un recorrido recíproco entre entrada y retorno sin conectar al núcleo protegido.
Los materiales se pagan en el paso de preparación; equivocarse, dejar la prueba, reiniciarla o cargar
la partida no vuelve a cobrarlos. Los avances, observaciones, permisos y posiciones del reto se guardan.

P19 conserva la elección de estudio: copia in situ con dos jornadas agrícolas de trabajo o préstamo
supervisado con devolución y una jornada. El cierre y la voz de rama corresponden a la vía realizada.
P23 tiene tres puestos de relevo separados. La negativa de Ofelia conserva la alternativa autorizada.
Íñigo hace una comisión temporal durante F03 y P12: es la misma persona, conserva su domicilio de Nox
y no requiere abrir la contención para consultarle. Su horario de comisión es de 08:00 a 17:00.

F07–F10 admiten solución técnica o desactivación de dos constructos de práctica del territorio.
La espada, el arco, el bastón y las invocaciones registran también las bajas producidas en pasos de
simulación, no solo al pulsar el ataque. Esta primera entrega conserva la ruta técnica de F12;
los jefes propios, sus ataques y la alternativa final de combate pertenecen al bloque regional posterior.
Los animales observados y los habitantes no son objetivos de estas pruebas.

## Producción visual y voces

`historia-datos.ts` se genera con `docs/narrativa/herramientas/compilar_jugabilidad.py` desde los contratos
explícitos, el canon y los planos de los pueblos. `docs/narrativa/jugabilidad/principales.json` contiene
los objetivos, puestos, costes y condiciones legibles para producción. No editar la salida TS a mano.

El puesto de cada objetivo está en `pasos[].region/punto`; los tres relevos conservan anclajes distintos.
La proximidad requerida es de tres metros: un mueble puede ocupar el anclaje siempre que quede un punto
alcanzable dentro de ese radio. No bloquear los pasos con decoración. Las preguntas usan la presencia
real del NPC; su domicilio y turno aparecen en el diario. Las comisiones se renderizan también en el
primer pueblo sin duplicar el terreno ni los residentes originales.

Las escenas `H:<mision>#inicio/giro/cierre/rama1/rama2` apuntan a las líneas originales del catálogo.
`astra-campana-datos.ts.guionesHistoria` conserva sus IDs y huellas; no renombra las voces que produjo
Claude. Terminar reproduce cierre y una sola rama. Dejar una escena no acredita escucharla hasta el final.
Los subtítulos permanecen disponibles aunque aún no exista una toma de audio.

Para Claude: integrar modelos, animaciones, gestos y sonido sobre estos anclajes y IDs. Conservar las
acciones del motor, el guardado, los materiales y los contratos. Para los retos basta vestir los controles
funcionales; conservar texto, posición, puertos y opciones para que no dependan exclusivamente del color.
Las decisiones de la campaña no conceden todavía los 217 efectos especializados de premios: ese es el
tercer bloque. No mostrar un plano o descuento como funcional hasta que esté conectado a su sistema.

## Alcance de las comprobaciones

`probar-historia.mjs` recorre los 36 contratos sin asignar `completadas` ni recibos. Usa recursos,
ubicaciones, visitas y pruebas externas preparados: certifica el contrato, sus acciones y sus recargas;
no certifica balance económico, descubrimiento de accesos ni una campaña humana desde cero.
También verifica migración, rechazo de bloques dañados, cultivo real y puestos alcanzables.
La revisión final desde una partida ordinaria y la medición en los teléfonos siguen en el séptimo bloque.

## Segundo bloque: historias personales y del mundo

El diario añade 181 contratos y 617 objetivos: 142 personales, 12 secretos originales, 19 encuentros
y ocho arcos elementales. El total es de 217 historias y 727 objetivos. Las personales exigen conocer
al participante y escuchar su primer recuerdo completo; terminarlas registra `astra.personales` y abre
`VID_<id>_2`. Las líneas y sus huellas no cambian. Los 42 encargos recientes de Claude se conservan
aparte en Astra y aceptan como requisito tanto la campaña real como los expedientes anteriores.

Las historias secretas, incluyendo T08, requieren dos pistas públicas. Los indicios conservan lugar,
proximidad y recibo; no se encuentran por leer una ficha ni entrando a una habitación cerrada.
Los permisos se piden a cada participante en su presencia. Los menores conservan acompañantes adultos.
Ofelia puede aplazar y la práctica autorizada mantiene el avance; ninguna negativa se convierte en un sí.
S12 admite una pregunta preescrita o una nota de hasta 500 caracteres guardada en la partida local;
ese texto no se incorpora al catálogo de voces, la wiki ni una publicación automática.

Los objetivos de oficio conservan producción posterior a aceptar, incluyendo lotes reales de horno y
cocina. Tener pan comprado o un contador anterior no completa una fabricación. Las misiones de pesca
registran capturas y exigen conservar el ejemplar para devolverlo al lago: devolver retira una unidad
real y no genera productos o monedas. El turno posterior de Mara exige alimentación y compañía en
la jornada nueva, sin acelerar cuidados de 48 horas. Los cultivos conservan parcela, contexto, riego
y cosecha; el comparador de dos especies no se resuelve con dos cosechas de la misma especie.

`autor_jugabilidad_secundaria.py` conserva el texto y las decisiones de la autoría, y genera las
prácticas de oficio, contrastes, reservas y procedimientos en `jugabilidad/secundarias.json`.
Los contratos de estas prácticas son funcionales; no convierten una secuencia de taller en fauna nueva,
una construcción regional ya desplegada, un jefe propio o un efecto especializado de premio.
Esas capacidades se conectan en los bloques siguientes. Las ramas conservan la misma utilidad base.

Para regenerar todo:

```sh
python3 docs/narrativa/herramientas/integrar_motor.py
python3 docs/narrativa/herramientas/autor_jugabilidad_secundaria.py
python3 docs/narrativa/herramientas/compilar_jugabilidad.py
```

El generador de medios reconecta solo archivos OGG existentes cuya firma coincide con texto, voz y
configuración del productor de Claude. Esta entrega asocia 998 tomas verificadas; conserva las
asociaciones manuales, modelos y música. No llama a ElevenLabs ni borra las 174 tomas restantes.
Las voces de protagonistas no se adivinan a partir de un nombre de archivo: siguen el contrato del productor.

`probar-secundarias.mjs` completa las 181 historias por acciones después de cerrar las 36 principales,
comprueba los 142 recuerdos posteriores, y verifica descubrimiento, fabricación, migración y datos dañados.
Usa recursos, ubicaciones y capacidad preparados, y no certifica balance ni descubrimiento ordinarios.
