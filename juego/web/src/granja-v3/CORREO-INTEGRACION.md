# Correo de la granja

Integrado el 10 de octubre de 2026 sobre el mismo motor granja-v3 y guardado V5.

## Uso y entrega

El buzón aparece junto a la entrada de la cabaña inicial y acompaña su traslado y sus cuatro giros. La bandera se eleva cuando hay cartas sin leer, adjuntos pendientes o propuestas sin respuesta. El clic en su modelo abre el panel; el Diario permite consultar el historial desde cualquier lugar. Abrir una carta nueva, elegir/retomar un proyecto o recoger el adjunto exige estar en el exterior de la granja, a un máximo de 2,4 unidades del buzón. Las cartas ya leídas se consultan a distancia.

La bienvenida está disponible desde el inicio. Las otras cartas se entregan exclusivamente al dormir, después de aplicar cultivos, obras, envíos y cierre de jornada. El reloj real no entrega correo ni adelanta estaciones. Las cartas de estación llegan una sola vez, no cada año. Los adjuntos pendientes se conservan indefinidamente.

## Primera colección: 13 cartas

| Carta | Condición | Adjunto |
|---|---|---|
| Bienvenida | Inicio | Ninguno |
| Primera mañana | Primera noche | 3 heno |
| Una cosecha que cuidar | Cosechar y dormir | 25 monedas |
| Un oficio con práctica | Despejar recursos y completar dos jornadas | 2 carbón |
| Noticias de la orilla | Pescar y dormir | 1 pan |
| Alimento y compañía | Dar cariño y dormir | 2 heno |
| Gracias por el taller | Completar pedido_roble y dormir | 5 madera |
| Un momento compartido | Completar un encuentro social y dormir | Ninguno |
| Un nuevo rincón | Terminar una obra al dormir | 20 monedas |
| Tu primera venta nocturna | Obtener ingresos de la caja al dormir | Ninguno |
| Llega el verano | Verano desde jornada 28 | Ninguno |
| Los colores del otoño | Otoño desde jornada 56 | Ninguno |
| Un invierno para preparar | Invierno desde jornada 84 | Ninguno |

Son mensajes originales de orientación. No fijan nuevas relaciones familiares, tramas mitológicas ni recompensas finales de la casa de Claude.

## Proyectos con decisiones excluyentes

Actualización del 11 de octubre de 2026: se conservan las trece cartas originales y se añaden dos propuestas,
cuatro confirmaciones y cuatro cierres. Cada partida recibe únicamente la confirmación y el cierre de sus ramas
elegidas: hasta diecinueve cartas recibidas del catálogo de veintitrés. Ninguna carta nueva concede adjuntos.

| Propuesta | Requisito nocturno | Rama | Práctica posterior a elegir | Entrega en segunda etapa | Receta al completar |
|---|---|---|---|---|---|
| Un proyecto para tu granja | Despejar y completar tres jornadas | Riego | Labrar 6 parcelas | 12 madera, 8 piedra | 1 aspersor básico en banco: 8 madera, 1 lingote de cobre |
| La misma propuesta | El mismo requisito | Cuidados | Alimentar 4 veces y dar cariño 4 veces | 12 heno, 8 fibra | 2 alimentos para mascota a mano: 3 fibra, 2 heno |
| Preparar las próximas salidas | Una expedición y cinco jornadas | Pesca | Capturar 3 peces | 6 lombrices, 8 fibra | 2 cebos a mano: 2 lombrices, 1 fibra |
| La misma propuesta | El mismo requisito | Minería | Romper 3 nodos de expedición | 4 carbón, 12 piedra | 1 guiso minero en cocina: 1 pan, 2 zanahorias |

La carta debe estar leída. Elegir acepta el encargo y guarda la decisión en una sola acción; si ya hay cinco
activos, no guarda una elección parcial. Hay veintiuna jornadas desde la aceptación. La primera etapa requiere
revisión junto al solicitante; la segunda conserva casilla, calidad, cantidades y entregas parciales del sistema
de encargos. Se cobra junto al solicitante: 120 monedas, 45 amistad y el descubrimiento exclusivo de su receta.
La receta conserva requisitos de habilidad y herramienta: el aspersor pide agricultura 1 reconocida al dormir;
el guiso pide recolección 2 reconocida y herramienta 1, además de cocina. El desbloqueo no salta esos requisitos.

Los productos conservan sus IDs y precios. Como una pila no registra cuál receta la produjo, la recuperadora
usa los ingredientes compartidos y su coste mínimo por unidad para productos con estas alternativas.
Un aspersor devuelve cobre, sin hierro ni madera; un guiso devuelve zanahoria, sin leche, trufas ni pan.
Esto también se aplica a los ejemplares anteriores del mismo objeto y evita convertir la receta barata en
materiales caros al recuperar. Los demás objetos mantienen su cálculo anterior.

La elección es permanente. Cancelar/vencer no abre la otra rama y no concede el descubrimiento. Retomar desde
el buzón devuelve primero todas las reservas con sus calidades y acepta la misma rama con un plazo nuevo y
contadores desde hoy. Si falla la devolución, el máximo de activos o el guardado, revierte toda la operación.
También se puede recuperar en el Diario y aceptar de nuevo junto al solicitante o en el tablón abierto.
Las confirmaciones llegan al dormir después de elegir; los cierres, al dormir después de cobrar. Recarga y
tiempo real no los adelantan. Consultar historial no acepta remotamente, cambia la elección ni repite premios.

## API y persistencia

`correo.ts` conserva `CARTAS` con las trece definiciones originales y exporta `cartaDef` para resolver todo el
catálogo. `correspondencia-datos.ts` define proyectos, cuatro encargos y cuatro recetas alternativas de objetos
existentes. `buzon.ts` comparte la misma posición física entre acciones; `correo.ts` reexporta sus funciones
para conservar la API. `correo-ui.ts` muestra texto, decisiones, etapas y adjuntos con los paneles actuales.

Acción: `{tipo:'correo',accion:{tipo:'leer'|'reclamar'|'retomar',id},xJugador,zJugador}`;
elección: `{tipo:'correo',accion:{tipo:'elegir',id,eleccion:0|1},xJugador,zJugador}`. `id` identifica la carta.
El subestado `correo` versión 2 añade `decisiones: [{proyectoId,eleccion,elegidaDia,completadaDia}]` a las cartas
y fechas existentes. El guardado general permanece V5. Una V5 sin correo recibe la bienvenida; una subversión
1 íntegra conserva exactamente sus cartas, lecturas y cobros y añade decisiones vacías. Un formato presente
corrupto se rechaza. Validación cruzada rechaza ramas opuestas, encargos sin decisión, desbloqueos sin cierre,
cierres sin receta y cronología imposible; no certifica adquisición ordinaria de todos los hitos importados.

El cobro comprueba espacio para todos los objetos y el límite del saldo antes de modificar inventario o monedas. Una mochila llena conserva todo el adjunto. Leer repetidamente no aumenta el contador; recoger nuevamente no concede objetos. La aplicación guarda inmediatamente lectura y cobro; si falla la escritura, revierte el estado anterior.

## Verificación y límites

Verificación del bloque de correspondencia (11 de octubre): **21 grupos nuevos** en
`scripts/granja-v3/probar-correspondencia.mjs`, con ambas ramas de ambos proyectos, migración íntegra,
exclusión, cinco activos, cercanía, etapas, acciones reales de cuidado, calidades, devolución y recuperación
atómicas, plazo exacto, recetas fabricables, guardados corruptos y recuperación de materiales sin arbitraje.
Regresión completa: **30 suites sin fallos**. Compilaciones completa y de amigos correctas; tras integrar
las voces remotas, la comprobación de amigos revisó 503 archivos contra 45 palabras y 132 frases.

**11 recorridos de navegador** correctos en `scripts/granja-v3/verificar-correspondencia.mjs`: propuesta,
lectura, opciones/consecuencias, buzón físico, elección, cuota/recarga, etapas, entrega/cancelación iridio,
retomar, cierre/receta, cadenas nocturnas y fabricación con controles reales. Sin errores JavaScript,
recursos fallidos ni desbordamiento horizontal. Evidencia local:
`/tmp/correspondencia-navegador-final/VERIFICACION-CORRESPONDENCIA.json`.
Para regenerar, ejecutar el script contra el build completo servido y pasar una carpeta externa.
Además, **seis recorridos** de `verificar-demo.mjs` comprobaron casa → granja → casa → granja, teclado,
buzón, inventario, posición, jornada y recarga sobre el build que integra las voces remotas. Total: **17**.
Evidencia local: `/tmp/correspondencia-casa-granja-integrada/VERIFICACION-NAVEGADOR.json`.
Los escenarios preparan hitos, servicios, actividad y materiales en un contexto aislado a 844 × 390;
no certifican campaña completa desde cero ni teléfonos físicos.

Verificación histórica del correo básico (10 de octubre):

Compilación completa correcta. `scripts/granja-v3/probar-correo.mjs`: 14 casos sobre entrega nocturna, 84 cierres hasta invierno, migración, validación, posición/giros, cercanía, inventario lleno, saldo, cobro único, recarga y consulta remota. Regresión de 27 suites sin fallos: `work/qa-motor/correo-regresion.json` desde la raíz de trabajo.

Seis recorridos de navegador: clic en buzón 3D y lectura, entrega tras dormir y cobro, recarga/historial remoto, reversión de lectura y de cobro ante almacenamiento lleno y viewport móvil 412 × 915 sin desbordamiento. Evidencia: `work/qa-motor/correo-navegador.json` y capturas en `work/qa-motor/renders/correo-*.png`. Son escenarios preparados; no certifican campaña completa desde cero ni rendimiento físico de S21 FE/S24 Ultra.

El buzón es seleccionable, sin obstáculo propio de tránsito ni animación de apertura. I05 pasa a parcial con dos
proyectos originales, consecuencias de fabricación y cadenas nocturnas. Faltan ramificaciones de campañas
regionales, transformaciones físicas del mundo, escenas más amplias, suscripciones y entregas de otros mundos.
No se añaden gráficos ni se presentan las propuestas del reparto como NPC implementados.

Siguiente bloque del motor: colecciones y lotes con entregas, progreso y desbloqueos persistidos (I09).
