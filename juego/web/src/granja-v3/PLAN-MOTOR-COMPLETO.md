# Plan del motor completo: capacidades, variedad y aceptación

## Correo integrado

Actualización del 10 de octubre de 2026: buzón físico junto a la cabaña, historial en el Diario, 13 cartas por jornadas, actividades y estaciones, adjuntos únicos y persistencia con reversión si falla almacenamiento. Las cartas nuevas llegan exclusivamente al dormir. [CORREO-INTEGRACION.md](CORREO-INTEGRACION.md) documenta reglas, catálogo, API y límites. Los festivales jugables, cartas ramificadas y recetas por correspondencia siguen pendientes.


## Dormitorios privados integrados

Actualización del 10 de octubre de 2026: 24 dormitorios con puerta física desde la sala, entrada por 500 puntos de amistad, cercanía y horario; lectura de escritorio/biblioteca sin recompensas, presencia del NPC al final de la tarde, persistencia y retorno primero a la sala y luego al pueblo. [DORMITORIOS-INTEGRACION.md](DORMITORIOS-INTEGRACION.md) describe API, pruebas y límites. Los cuartos comparten distribución; faltan diseño específico, animaciones de puerta y eventos domésticos completos.


## Domicilios del primer pueblo integrados

El 10 de octubre de 2026 se conectan 17 viviendas para los 24 vecinos: siete interiores anexos a comercios y diez casas nuevas en barrios norte y sur. Entrada cercana a la puerta, horarios, teclado, conversación/regalos en casa, salida y persistencia; rutinas regresan al domicilio asignado. [VIVIENDAS-INTEGRACION.md](VIVIENDAS-INTEGRACION.md) documenta reparto, API, pruebas y límites. Las salas comunes conectan ahora dormitorios privados básicos; faltan restauración y viviendas de los demás pueblos.


## Vida social integrada el 10 de octubre de 2026

Calendario de 28 días y cumpleaños para los 24 habitantes, bonus anual de regalo y ocho encuentros originales con requisitos, dos respuestas, amistad y recuerdo persistidos. Guardado de cada paso, recarga del diálogo y rollback si falla almacenamiento. Se conserva el motor y la V5. [VIDA-SOCIAL-INTEGRACION.md](VIDA-SOCIAL-INTEGRACION.md) contiene requisitos, API, pruebas y límites. Los dormitorios privados básicos ya están integrados; los festivales jugables siguen pendientes; los 17 interiores residenciales básicos ya están conectados.


Consulta de referencias: **7 de octubre de 2026**. Línea base examinada: `src/granja-v3`, estado persistido versión 4, antes de las ampliaciones simultáneas de esta sesión. Este documento es un inventario de trabajo y una auditoría por lectura de código. **No certifica paridad, campaña completa ni funciones verificadas en ejecución.** Los cambios posteriores requieren actualizar cada estado con evidencia.

El objetivo recibido es continuar **el mismo motor 3D**, con la amplitud de actividades, interfaces y variedad de Stardew Valley más Expanded y Automate, fabricación y equipo inspirados en Minecraft, y los mundos propios Verdia, Senda, Nox y espacio. Una demostración de unas pocas mecánicas no satisface ese objetivo. Tampoco lo satisface aumentar catálogos sin conectar su adquisición, uso, consecuencias, presentación y guardado.

Se leyó el estudio anterior `outputs/GRANJA-ACTUAL/ESTUDIO-DE-JUGABILIDAD.md`. Se conservan sus reglas propias: identidad de Él y Ella, acceso a la casa existente, cuidado en tiempo real, deterioro de cultivos inmaduros después de 48 horas reales sin agua, y permanencia indefinida de los cultivos maduros como decoración. El calendario, dormir y las estaciones no deben anular estas reglas.

## Encargos del pueblo integrados el 10 de octubre de 2026

Sobre granja-v3 y guardado V5 se integran doce pedidos aceptables, hasta cinco activos, entregas parciales desde casilla/calidad exactas, actividades posteriores a aceptar, plazos que vencen solo al dormir, cancelación con devolución íntegra y cobro único de monedas/amistad. Diario y Casa de los Oficios conectados a los vecinos reales; la entrega y el cobro requieren proximidad. Una escritura fallida de almacenamiento revierte la acción; la noche conserva su rollback. Migración de V5 anterior y rechazo de registros corruptos.

[ENCARGOS-INTEGRACION.md](ENCARGOS-INTEGRACION.md) describe catálogo, API, fechas, reservas y límites. 21 casos específicos y regresión de 23 suites (512 comprobaciones contando la última ampliación), ocho recorridos de navegador y compilación completa correctos. La revisión móvil usa 412 × 915; los recorridos preparan escenarios y no certifican rendimiento físico ni una campaña desde cero.

El sistema de misiones sigue parcial: faltan rotación diaria/semanal, encargos especiales, cartas ramificadas, más elecciones y escenas, colecciones y campañas de nuevos mundos. Los doce pedidos no implementan los 142 ejemplos del reparto planificado ni alteran las misiones antiguas o sus tokens de casa. El calendario, ocho encuentros, viviendas, dormitorios y correo básico ya se integraron. El siguiente bloque previsto es la participación en eventos comunitarios.

## Reparto y pueblos planificados el 10 de octubre de 2026

Se documenta la totalidad del reparto propuesto de granja, Ceniza y Sangre, reinos y Astra: **147 identidades**, 142 interlocutores/aliados y cinco figuras del lore. Son **19 núcleos habitados, 76 alojamientos y 142 ejemplos de encargos**. Los 24 IDs del pueblo actual se conservan; los 118 interlocutores nuevos y las escenas de las figuras narrativas siguen pendientes de implementación. Esta fase no cambia el runtime, el guardado ni el estado de aceptación de las capacidades.

[REPARTO-COMPLETO.md](REPARTO-COMPLETO.md) contiene todos los nombres, funciones y encargos. [PLAN-PUEBLOS-MUNDOS.md](PLAN-PUEBLOS-MUNDOS.md) contiene distribución, acceso, servicios, restauración, eventos y viviendas. [REPARTO-MUNDOS.json](REPARTO-MUNDOS.json) registra IDs y conexiones para futura integración; no se importa automáticamente al motor. La planificación distingue canon recibido de propuestas, conserva los diez destinos de aventura y evita interpretar Nox como una ciudad de almas inocentes o Verdia como una mina de combate.

Comprobación de integridad: identidades y nombres únicos, población por núcleo/mundo, viviendas asignadas una vez, 24 IDs actuales preservados, 19 núcleos alcanzables en el grafo propuesto y diez destinos de aventura referenciados. Es evidencia de coherencia de contenido, no de jugabilidad implementada ni de rendimiento físico.

## Pueblo y reparto ampliados el 9 de octubre de 2026

Sobre el mismo motor V3/guardado V5: **24 habitantes en el primer pueblo**, nueve responsables de servicios y quince vecinos sociales. [PUEBLO-INTEGRACION.md](./PUEBLO-INTEGRACION.md) contiene el listado, función actual frente a papel narrativo pendiente, horarios y API. Se integran rutas por reloj de jornada con colisiones, días libres, cambios por lluvia, apertura/cierre de servicios, conversación con mouse/tap, amistad, regalos de casilla/calidad exactas y límites diarios/semanales persistidos. Ausencia y recarga no avanzan sus rutas o relaciones.

El bloque 7 y las capacidades de NPC/relaciones pasan a **parciales con fundamento jugable**. Las viviendas, dormitorios, ocho escenas, correo básico y cumpleaños ya se integraron; siguen pendientes festivales, más escenas, stock de tiendas, viajes entre regiones e historias personales. Los quince nuevos ya aparecen, conversan y reciben regalos; sus especialidades no equivalen todavía a quince servicios o cadenas de misiones nuevas. Los nombres propios/parentescos se definen con el lore. El siguiente bloque será **pedidos aceptables con entrega, plazos y recompensas únicas**, además de conectar escenas y progresión social.

Evidencia: 26 casos nuevos de lógica, 491 comprobaciones en 22 suites y 51 recorridos de navegador (16 pueblo, 12 carpintería, 13 compañía y 10 ganado), sin fallos. Compilación completa del proyecto confirmada. El pueblo con 24 avatares se optimiza de 344.714 a 136.418 triángulos; no se agregan imágenes o GLB. Los escenarios son fixtures de integración, sin certificar campaña completa o rendimiento físico de los teléfonos.

## Carpintería integrada el 9 de octubre de 2026

Sobre el mismo motor y guardado V5: contratos de construcción pagados con monedas/materiales, regreso a la granja para emplazar, reserva de huella/corral/acceso, una cuadrilla y hasta ocho encargos, plazo de tres noches para edificio nuevo y dos para ampliación. El tiempo real no avanza obras. Andamios propios, operario y martillo animados; entrega única con informe nocturno. Cancelación restituye materiales/calidades y monedas de forma atómica. La recarga conserva la cola; un fallo de almacenamiento revierte la noche y las colisiones visibles.

Refugios productivos con niveles 1/2/3 y cupos 6/8/12; mejoras conservan habitantes, genética, cuidados, productos, incubación, heno, clima e identidad. Interior, camas, nidos, espera y trufas admiten la manada ampliada. No se mueve un refugio durante la obra; terminado permanece movible y girable con su nivel. Documentación/API para Claude en [CARPINTERIA-INTEGRACION.md](./CARPINTERIA-INTEGRACION.md).

K03 sigue **parcial con encargos y ampliaciones productivas integrados**. Quedan casa/invernadero/establo, más edificios, restauraciones con plazos, obras comunitarias y horarios. Los planos guardados de versiones anteriores conservan su API de recolocación inmediata. No se ha cerrado la matriz, la campaña ni la variedad comparable a Expanded/Automate. La siguiente prioridad es **pueblo con horarios, rutinas de personajes, relaciones y diálogos**, además de los pendientes de producción, pesca y mundo.

Evidencia de esta fase: 30 casos de lógica, 43 de arte y 12 recorridos de navegador de carpintería; la regresión conjunta alcanza 465 comprobaciones en 21 suites y 35 recorridos de navegador sin fallos; los informes registran la compilación. El arte de obra usa como máximo 1.632 triángulos y 20 objetos de dibujo sin archivos gráficos adicionales. Los recorridos preparan escenarios; no son una campaña completa ni una medición física de teléfonos.

## Compañía y montura integradas el 9 de octubre de 2026

Se amplía el motor V3 y el guardado V5. [COMPANIA-INTEGRACION.md](./COMPANIA-INTEGRACION.md) describe la API y las reglas completas. Tres familias de mascotas y caballo, cuatro apariencias por familia, adopción por misiones/tienda, hogar individual, vínculo diario, cuenco, raciones, pasto del establo, veterinario y mayordomo avanzado. Las mascotas acompañan al jugador en la granja; el caballo permite montar, desmontar, caminar por senderos entre regiones, guardar montado y regresar al patio al dormir. El personaje usa postura sentada y controles de teclado/táctiles. Se conservan días y crecimiento únicamente al dormir.

E09 y E10 pasan de pendientes en la matriz histórica a **parciales con ciclo básico integrado**: aún faltan ampliación de apariencias, efectos/regalos de vínculo, llamada/equipo de montura, interiores de mascotas y monturas fantásticas. No se considera terminada la variedad global ni la campaña. Tampoco se confunde a los compañeros con más familias de ganado productivo.

Evidencia: 46 pruebas de compañía, 34 de modelos/animaciones, 312 del motor previo = **392 comprobaciones en 19 suites sin fallos**; trece flujos de navegador con teclado, clic, establo, cuidados, recarga y pantalla táctil. Arte original con máximo de 15.660 triángulos y 22 llamadas de dibujo por ejemplar; no hay medición de rendimiento en teléfonos físicos. La compilación valida también la integración con el proyecto principal. Se documenta la preparación de escenarios de prueba y el alcance real de cada comprobación.

Después de compañía se priorizó **construcciones y mejoras con encargos, materiales, ocupación y plazos por jornadas**; la fase posterior queda registrada al inicio, seguida de **pueblo con horarios de servicios, personajes, relaciones, diálogos y eventos**. La pesca avanzada, colecciones, gestación, colisiones de vallas/portones, más contenido regional y el balance siguen abiertos en la matriz. No se crea una nueva versión del motor ni un paquete final en esta fase.

## Avance integrado del 8 de octubre de 2026

La matriz histórica de este documento mantiene el estado observado en la línea base. El motor activo sigue siendo granja-v3, con guardado versión 5; este registro posterior describe avances comprobables sin dar por cerrada toda la matriz.

- **Barra, mochila y equipo:** doce ranuras por fila sobre las casillas reales; comida, herramientas, semillas y dispositivos manipulables. Calidades separadas, división, intercambio y transferencia a cofres. Reservas de recetas conservan la calidad de los ingredientes al cancelar lotes pendientes.
- **Producción:** 87 recetas y 351 objetos registrados; diez tipos de estación, almacenamiento, lotes, combustible, bloqueo de salida y red por adyacencia configurable. Se comprobó en navegador horno → cofre. Las cifras registradas no garantizan adquisición equilibrada de cada receta.
- **Agricultura:** 63 definiciones con temporadas y climas, fases, rebrote, enrejados, cosecha por guadaña y fertilizante. Los aspersores conservan humedad en horas reales y riegan cada jornada al dormir, sin dar crecimiento durante la ausencia. Las cosechas maduras permanecen decorativas; los cultivos inmaduros se deterioran sin riego a las 48 horas reales. Los días restantes se actualizan en el detalle y la etiqueta; el catálogo muestra duración inicial y rebrote. En el registro del 8 de octubre, la calidad todavía usaba una aproximación por cosechas; fue sustituida por habilidades el 9 de octubre, como se detalla más abajo.
- **Jornada y guardado al dormir:** hora activa de 06:00 a 02:00, con límite sin salto automático; 28 días por temporada. Dormir en la cabaña cierra exactamente una jornada, recupera al jugador, guarda el resumen y una copia nocturna, y abre la mañana. Cancelar, doble clic, recargar y un error de almacenamiento no consumen otro día. La cama de la casa principal usa el mismo cierre y un token de jornada.
- **Corrección de crecimiento solicitada:** cultivos y crías crecen únicamente al dormir. Ni el reloj activo ni el tiempo ausente les dan progreso. Cada cultivo necesita riego en esa jornada; si se salta, no avanza. El deterioro de cultivos inmaduros a las 48 horas reales sin agua y la enfermedad/depresión animal siguen siendo las reglas propias anteriores; no existe muerte animal. Los maduros siguen permanentes. El catálogo y el detalle indican días de juego. Se migra una sola vez el progreso proporcional y la edad del último guardado, sin sumar la ausencia posterior.
- **Clima y luz:** programa por partida, jornada y temporada con sol, brisa, lluvia, tormenta y nieve; pronóstico para hoy y mañana conservado al guardar. Los hábitats polares reciben nieve y los volcánicos ceniza, sin sustituir el riego. La lluvia riega plantas vivas una vez por jornada y no simula lluvia durante la ausencia ni revive cultivos dañados. Algunos peces requieren clima concreto, además de hora, zona, cebo y estación. Precipitación animada con una sola llamada de dibujo adicional y 256–512 partículas según detalle; interiores ocultan la lluvia. La luz cambia por hora guardada. No hay eventos meteorológicos de campaña todavía.
- **Envíos y economía nocturna:** caja inicial de 24 casillas, depósitos y recuperación de cantidades exactas con calidad; planos fabricables o comprables para cajas adicionales. Mover conserva la carga y guardar una caja ocupada se rechaza. Al dormir se liquidan todas las cajas una sola vez y se muestra producto, calidad, cantidad, valor unitario e ingresos. El cobro comparte la transacción y recuperación nocturna: una cuota fallida conserva carga, monedas y jornada. Las partidas anteriores reciben un plano en el almacén de recuperación sin alterar su distribución. Las cajas todavía no se integran con las redes automáticas de producción.
- **Terreno y navegación:** una sola parcela comprada; tres estanques, trece huecos rellenables, árboles gigantes huecos y mayor densidad de escombros fuera del inicio. El mapa guía; caminar hasta un acceso conecta granja, pueblo, bosque, lago, mina y bosque ancestral. El guardado restaura coordenadas exteriores. Las primeras partidas anteriores conservan su paisaje sin introducir obstáculos nuevos.
- **Aventura:** diez destinos y siete familias de monstruos; galerías conectadas, vetas finitas, entidades con ataques anticipados, botín, hallazgos, equipo y oxígeno en el espacio. Minería, movimiento, botín, guardado interior y regreso se comprobaron en navegador. Faltan jefes, cadenas narrativas y actividades regionales más amplias.
- **Interfaz móvil:** barra, catálogo, calendario, salud y energía visibles; revisión a 412 × 915. No hay todavía medición en los S21 FE y S24 Ultra físicos.

Evidencia del trabajo: scripts/granja-v3/probar-{agricultura,cuidados,jornada,clima,envios,produccion,barra,interaccion,progresion,aventura,mundo}.mjs y, desde la raíz del trabajo, work/qa-cultivos.cjs, work/qa-aventura-integracion.cjs, work/qa-senderos.cjs, work/qa-jornada.cjs, work/qa-clima.cjs y work/qa-envios.cjs. Los fixtures de las pruebas de navegador se describen en sus informes; comprobar rutas preparadas no certifica la progresión completa.

Siguen parciales o pendientes las filas de habilidades, eventos del calendario, frutales, invernadero, animales faltantes/incubación/montura, construcción con plazos, balance comercial y conexión de envíos a redes automáticas, relaciones/eventos/horarios, pedidos/ramas/plazos, pesca/tesoros/trampas, museo/festivales, conectores/redes globales y variedad regional comparable a Expanded. Se conserva la condición de entrega del apartado 7.

## Avance integrado del 9 de octubre: huerto e invernadero

Se amplió el mismo motor V3 y su guardado versión 5. Es la primera fase de este bloque; no cierra la equivalencia global con Stardew/Expanded ni la variedad regional pendiente.

- Ocho frutales productivos: manzano, cerezo, albaricoquero, duraznero, naranjo, granado, mango y banano. Sus plantones se compran en la tienda de semillas, ocupan terreno sin labrar y requieren espacio libre de 3 × 3. Los jóvenes necesitan riego y 28 noches de crecimiento; las horas reales no les dan progreso. La sequía real de 48 horas puede dañarlos. Los adultos permanecen, producen una fruta por jornada en su temporada y acumulan hasta tres. Recogida, tala por golpes, madera, fruta, inventario y envíos son transaccionales. Fruta de calidad normal por ahora; árboles regionales y calidad por edad/experiencia quedan pendientes.
- Invernadero construible como plano y restaurable sobre una ruina en terreno propio y despejado. Entrada por proximidad y un interior con 36 bancales independientes y anillo para frutales. Cultivar allí permite todas las temporadas con clima templado; conserva las restricciones de climas y descubrimientos especiales. Mover/girar conserva identidad, cultivos, árboles y riego; guardar un edificio ocupado en la mochila se rechaza. Es una capacidad inicial propia; ampliaciones de edificio y equipamiento interior se desarrollarán en el bloque de carpintería.
- Riego manual con la barra y el ratón, abono, etapas y rebrote dentro. La lluvia exterior no atraviesa el techo. Mejora de riego por 300 monedas, tres lingotes de hierro y seis vidrios: cuida humedad cada seis horas reales y al dormir; no acelera madurez. Aspersores exteriores también cuidan plantones. Se corrigió la continuidad del riego permanente después de ausencias superiores al límite de simulación de provisiones; se comprobó con 80 días reales sin crecimiento ni salto de temporadas.
- Modelos propios con cinco etapas, flores, fruta visible, hojas al viento, sacudida y caída al talar; el banano tiene hojas y racimos diferentes. Geometría agrupada por material y frutales conservados entre sincronizaciones sin reconstruirlos con cada golpe. Los árboles ornamentales existentes siguen siendo decoración. No se añadió contenido binario del ZIP de Stardew.
- Ocho conservas nuevas procesan las frutas en la prensa y usan el inventario y la producción existentes. El catálogo activo suma 95 recetas y 374 objetos; las cifras no acreditan balance o progresión completos. Migración de partidas anteriores crea huertos vacíos para invernaderos existentes, conserva sus posiciones y no convierte manzanos/limoneros decorativos en árboles productivos.

Validación: 22 pruebas del huerto, 114 comprobaciones de regresión en agricultura, interacción, cuidados, clima, jornada y producción; 11 recorridos de navegador con ratón/teclado, recarga y viewport 412 × 915. Compilación de producción correcta. Capturas revisadas de interior, plantón y catálogo móvil. Las pruebas preparan monedas, materiales, posiciones y árboles adultos para aislar casos; las 28 noches y adquisición/costes/rechazos también se prueban en el motor. No certifican una campaña completa ni rendimiento físico de S21 FE/S24 Ultra. Evidencia: `scripts/granja-v3/probar-huerto.mjs`, `work/qa-huerto.cjs` y `work/qa-motor/huerto-integracion.json` desde la raíz del trabajo.

Tras el huerto se integraron habilidades y desbloqueos, descritos a continuación. El siguiente bloque es ganadería; quedan pendientes los animales faltantes, obras con plazo, comunidad, misiones completas, pesca avanzada, automatización extensa y regiones indicadas abajo. No se generó una entrega final.

## Habilidades: estado integrado del 9 de octubre

El motor V3 incorpora cinco habilidades de diez niveles, treinta profesiones con efectos reales y reconocimiento de recetas al dormir. El cuaderno se abre con F o el menú; fabricación y automatización comprueban los mismos requisitos. La calidad agrícola usa habilidad y abono. La migración conserva recetas anteriores y reservas de máquinas, y el fallo de guardado nocturno revierte también los aprendizajes. Ver [contrato y reglas](HABILIDADES-INTEGRACION.md) para las acciones, fórmulas y límites.

Validación: 29 casos de habilidades y 178 de regresión; seis recorridos de navegador, incluidas elección, desbloqueo, fabricación, recarga, cuota y pantalla móvil. Los valores cercanos a umbrales y cultivos maduros del navegador son muestras preparadas. Quedan pendientes balance de campaña, dominio avanzado y variedad de recompensas. El siguiente bloque es ganadería, sin reiniciar el motor ni generar una entrega final.

## Ganadería: fase integrada del 9 de octubre

El motor V3 incorpora cabras, patos, avestruces y dinosaurios; doce especies productivas, dieciséis variantes naturales nuevas y los trece linajes fantásticos aprobados. Se conectaron leche/huevos/plumas, cuatro productos artesanales nuevos, seis recetas, herramientas de ordeño/esquila manipulables, incubación y trufas recogibles en el corral. El catálogo actual suma **101 recetas y 413 objetos** registrados.

Los huevos fértiles preservan genes y sexo al pasar por mochila, cofre, envío, cancelación y recarga. Cada incubación reserva capacidad y solo progresa al dormir; la noche de eclosión añade una cría de edad cero, XP y el nacimiento exigido por misiones. Las horas reales no adelantan edad ni incubación. El gallinero inicial incorpora una incubadora. Los trece linajes fueron recorridos nuevamente con sus requisitos reales de nacimiento.

El mouse selecciona animales, nidos, incubadora y trufas. La barra muestra cubo o tijeras en la mano; el motor valida herramienta seleccionada, cercanía, salud, adultez y energía. Mover/girar hogares conserva instalaciones y hallazgos por identidad. Las partidas anteriores preservan su stock, incluidos productos pendientes de machos bajo la regla anterior. Validación y mochila llena evitan pérdida o duplicación.

Evidencia: suite `probar-ganaderia.mjs` con 31 casos, regresión de progresión con trece linajes y nueve recorridos de navegador en `work/qa-motor/ganaderia-navegador.json`. Modelos y panel revisados en capturas; revisión de interfaz a 412 × 915, sin medición física en S21 FE/S24 Ultra. Contrato y límites: [GANADERIA-INTEGRACION.md](GANADERIA-INTEGRACION.md).

Tras esta primera fase seguían pendientes compañía, montura, comportamiento autónomo y puertas, gestación, balance prolongado y automatización específica de ganado. El registro siguiente describe la segunda fase sin dar por cerrada toda la ganadería. La implementación comprobada de esta fase no equivale a toda la ganadería de las referencias ni a una entrega final.

## Rutinas ganaderas: segunda fase integrada del 9 de octubre

Las doce especies ahora pasean por su corral, alternan pastoreo, entran por su puerta al refugio y descansan en plazas propias. Hora activa, clima, invierno templado y salud deciden cuándo salir o volver. Puerta manipulable por mouse/toque, espera exterior separada cuando está cerrada y protección del umbral mientras cruzan. Las rutas interiores usan el pasillo central; las vallas llegan a sus esquinas. Menús y otros modos pausan movimiento; la ausencia real no mueve ni envejece animales.

Nidos independientes permiten recoger huevos con las aves afuera. La posición visible de cada animal coincide con el alcance de ordeño/esquila/cuidados. Comedero con 64 henos y devolución exacta por calidad; suministro finito posterior al pasto bajo la regla previa de ocho horas reales. Mover/girar conserva ruta local, reservas y puerta; transferir a otro refugio conserva identidad y reinicia su ubicación interior. Guardado V5 anterior compatible y rechazo de campos corruptos. La tarjeta del refugio se puede cerrar permanentemente durante la visita, sin tapar de nuevo el interior móvil.

Verificación de esta fase: build correcto; **33 casos nuevos y 312 comprobaciones en 17 suites sin fallos**; diez recorridos de navegador con teclado, mouse y toque a 412 × 915. Evidencias en `work/qa-motor/rutinas-*.json` y `rutinas-*.png`; reglas y acciones en `GANADERIA-INTEGRACION.md`. Los recorridos preparados no certifican balance de campaña ni rendimiento en los teléfonos físicos.

E04 sigue parcial: falta beber, navegación libre, colisiones avanzadas entre animales y portones de vallas colocables. En este registro de rutinas E09/E10 estaban pendientes; la fase posterior de compañía está documentada al inicio. E12 sigue parcial: reserva de heno y ayudante funcionan, pero faltan silo/recogedor/redes animales especializadas. La fase posterior de compañía y montura está registrada al inicio. La siguiente fase prioritaria es obras con plazo y pueblo con horarios/relaciones. Este registro es un avance del motor existente; no es una entrega final ni una certificación de paridad.

## 1. Referencias y límites de la comparación

La [wiki en español solicitada](https://es.stardewvalleywiki.com/Stardew_Valley_Wiki) permite identificar familias de sistemas. Es documentación comunitaria enlazada por el sitio del juego; no debe confundirse con una especificación de nuestro motor. Los criterios de aceptación de este documento son decisiones de implementación propias, no valores copiados de esos juegos.

La portada solicitada de [Expanded](https://stardew-valley-expanded.fandom.com/wiki/Stardew_Valley_Expanded_Wiki) devolvió 402 y restricción de robots al abrirla directamente. Sí se recuperaron resultados indexados de sus páginas de cultivos, frutales, recolección, ubicaciones, misiones, Apples y Enchanted Grove. Se contrastó la amplitud con la [página de FlashShifter, autor de Expanded](https://www.nexusmods.com/stardewvalley/mods/3753). En la consulta, el autor anuncia **28 NPC nuevos, 58 ubicaciones, 278 eventos de personajes y 43 peces**, además de cultivos, objetos, festivales y cadenas de misiones. Son cifras publicadas por el autor en esa fecha, no un recuento auditado de nuestra implementación ni una promesa de igualdad.

La [página solicitada de Automate, publicada por Pathoschild](https://www.curseforge.com/stardewvalley/mods/automate), describe máquinas que toman insumos de cofres conectados y devuelven resultados, grupos por contacto —incluido diagonal— y una visualización de las redes. El [README del autor](https://github.com/Pathoschild/StardewMods/tree/develop/Automate) amplía conectores, prioridades, redes entre ubicaciones y ajustes de entrada/salida. Nuestra implementación necesita reglas explícitas y comprobables para estas capacidades.

La [guía de fabricación de Mojang](https://www.minecraft.net/en-us/article/how-craft) sirve para estudiar recetas, estaciones y lectura de materiales. La [descripción de mejora de equipo de Mojang](https://www.minecraft.net/en-us/article/taking-inventory--netherite-ingot) muestra el papel de una cadena de recursos en la mejora funcional del equipo. No se pretende trasladar bloques, pantallas, texturas, personajes, diálogo o mapas de esas obras.

## 2. Cómo leer los estados

| Estado | Significado en esta revisión |
|---|---|
| **Implementado** | Existe una base funcional identificable en el código leído. Aún requiere la prueba de aceptación indicada; este estudio no ejecutó el juego. |
| **Parcial** | Existe una parte, una simplificación, una interfaz o un dato, pero falta un comportamiento esencial. |
| **Pendiente** | No se encontró un sistema funcional en la línea base examinada. |

Un estado solo se cierra después de cubrir **motor + datos obtenibles jugando + interfaz + representación en el mundo + persistencia/migración + prueba de uso real**. No cerrar por número de líneas, recetas, mapas, tests unitarios o entradas en un atlas. Las cantidades de referencia ayudan a descubrir omisiones; no demuestran experiencia equivalente.

### Evidencia de la línea base

Todas las rutas siguientes son relativas a `juego/web/src/granja-v3`.

| Archivo / símbolo leído | Base observada | Límite que impide darlo por completo |
|---|---|---|
| `estado.ts`, `EstadoGranja`, `Accion` | Estado v4, parcelas, animales, edificios, drops, herramientas, zonas, estadísticas y misiones completadas | No tiene cofres, lotes de máquinas, equipo independiente, relaciones, clima diario, misiones activas ramificadas, museo o portales |
| `inventario.ts` | 24 casillas iniciales, ampliación a 36, pilas de hasta 999, intercambio y división, sobrante migrado recuperable | Pilas solo tienen artículo/cantidad; no instancias, calidad, durabilidad, equipo ni hotbar libre |
| `inventario-ui.ts` | Casillas, arrastrar, selección y división; venta diferenciada según tienda | La barra de herramientas sigue fuera de las ranuras; faltan cofres y equipo |
| `main.ts`, selección de herramientas | Ocho herramientas fijas con 1–8 y rueda | No permite poner semillas, comida, espada obtenida o material en cualquier ranura rápida |
| `motor.ts`, `actuar` | Clona estado y revierte operaciones fallidas; valida capacidad | Debe extenderse a todos los nuevos contenedores, recompensas y procesos |
| `motor.ts`, `actualizar` | Reconciliación de cuidados, productos, pasto, ayudante y regeneración | No contiene producción artesanal ni scheduler de clima, NPC o eventos |
| `catalogo.ts`, `CULTIVOS` | Nueve cultivos con clima, estación, horas, semilla y venta | No hay rebrote, calidad, fertilizante, invernadero funcional o árboles productivos |
| `catalogo.ts`, `ARTICULOS` | Edificios, refugios, decoración, caminos, vallas e insumos | Barril, molino e invernadero tienen categoría decoración; su modelo no acredita producción |
| `catalogo.ts`, `MISIONES` | Cadena lineal de hitos; desbloqueos y tokens de casa | La primera misión incompleta se completa por contadores globales; no hay aceptación, entrega ni ramas |
| `progresion.ts` | Cinco niveles de herramienta, golpes, requisitos de nodos y cinco pisos mineros | Tres clases principales de mineral; sin cadena mena–lingote–equipo |
| `motor.ts`, `combatir` | Energía, vida, daño, botín y rescate | Un valor `enemigo` sustituye entidades, alcance, movimiento, ataques y defensa |
| `motor.ts`, `pescar`; `main.ts`, `fish-game` | Dieciocho peces, cebo, hora/estación/zona y precisión temporal | No hay ciclo físico de lanzamiento, picada, lucha y tesoro; todos comparten el mismo gesto |
| `pueblo.ts`, `NPCS_PUEBLO`, `updatePueblo` | Nueve figuras de oficio y movimiento leve alrededor de un origen | No hay rutas, hogares, horarios, diálogos personales o relación persistida |
| `cuidados.ts`, `genetica.ts` | Cuidado real, enfermedad/recuperación, genomas, cruces, fenotipos | Mantener estas reglas al ampliar especies; no sustituirlas por producción diaria genérica |
| `hogar.ts` | Contrato de ida y retorno a la casa existente | Debe probarse tras migraciones, portales y nuevos interiores |

## 3. Matriz funcional de aceptación

### A. Movimiento, barra libre e inventario

Referencia: barra seleccionable, reparto y combinación de pilas en [Inventario](https://es.stardewvalleywiki.com/Inventario). La barra libre recibida del usuario prevalece sobre la simplificación previa de herramientas fijas.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| A01 | Caminar, apuntar y actuar | Implementado | WASD/flechas mantienen velocidad por segundo; diagonal normalizada; objetivo y alcance visibles; una acción distante no camina automáticamente en PC. |
| A02 | Colisiones y entradas | Parcial | Recorrer cada puerta, puente, escalerilla y esquina con ambos personajes; no entrar en sólidos ni quedar encerrado por construcción o NPC. |
| A03 | Hotbar libre | Pendiente | Cualquier objeto utilizable puede moverse a cualquier ranura rápida; 1–n/rueda/tacto seleccionan esa misma pila o instancia; la selección persiste al guardar. |
| A04 | Uso del objeto seleccionado | Parcial | Semilla planta, comida se consume, arma ataca, herramienta trabaja y colocable previsualiza; cambiar ranura actualiza mano, cursor y ayuda sin un segundo menú obligatorio. |
| A05 | Mover, dividir, apilar, intercambiar | Implementado | Probar movimientos entre mochila, barra y cofres con pilas llenas/parciales y toque/ratón; ninguna operación pierde o duplica unidades. |
| A06 | Calidad e instancias | Pendiente | Productos de distinta calidad no se mezclan; armas y herramientas con mejoras conservan identidad al transferir, equipar y recargar. |
| A07 | Capacidad y excedentes | Implementado | Compra, cosecha, fabricación y recompensa con mochila llena se cancelan íntegramente o dejan un excedente recuperable mostrado al jugador. |
| A08 | Filtros, ordenación y detalle | Parcial | Buscar por nombre y filtrar materiales/semillas/productos/equipo; ordenar no altera barra fijada; mostrar uso, calidad, valor, procedencia y requisitos. |
| A09 | Controles de paneles | Parcial | Escape cierra la capa superior; UI no actúa sobre terreno; escribir no mueve; pérdida de foco limpia teclas; no se atrapan clics fuera del panel. |
| A10 | Móvil y accesibilidad | Parcial | Barra reordenable sin hover; objetivos táctiles legibles, sin recorte en vertical/horizontal; reconfiguración, volumen y escala de UI; prueba física de teléfonos separada de emulación. |

### B. Fabricación, estaciones, cocina y equipo

Referencia: aprendizaje y materiales de recetas en [Fabricación](https://es.stardewvalleywiki.com/Fabricaci%C3%B3n), y estaciones/libro de recetas en [Mojang](https://www.minecraft.net/en-us/article/how-craft).

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| B01 | Catálogo fabricable | Parcial | Libro con recetas conocidas, bloqueadas y disponibles; mostrar tengo/necesito, resultado, estación y origen del desbloqueo; buscar por ingrediente o resultado. |
| B02 | Fabricar cantidad | Parcial | Fabricar una, varias o máximo con transacción completa; una salida sin espacio no cobra ingredientes; el resultado se usa en mundo/inventario. |
| B03 | Mesa y estaciones | Pendiente | La estación colocada se abre físicamente y determina recetas; alejamiento, traslado o falta de estación impiden iniciar según reglas visibles. |
| B04 | Fundición y combustible | Pendiente | Introducir mena y combustible adecuados, ver progreso, recoger lingotes; guardar durante proceso conserva tiempo e insumos; combustible insuficiente no produce gratis. |
| B05 | Herramientas obtenibles | Parcial | Receta o encargo produce herramienta real; mejora cambia fuerza/área/cadencia comprobable y no solo color; existe recuperación de herramientas esenciales. |
| B06 | Armas, armaduras y accesorios | Pendiente | Fabricar/encontrar/comprar, comparar y equipar en ranuras válidas; retirar cambia estadísticas; ítems inválidos no entran; aspecto visible cuando corresponda. |
| B07 | Reparación y mejora | Pendiente | Si se adopta durabilidad, desgaste y reparación son explícitos; mejorar consume componentes una vez y conserva identidad/bonificaciones; nunca bloquea de forma irreversible la partida. |
| B08 | Modificadores de equipo | Pendiente | Ataque, defensa, velocidad, resistencia y efectos tienen cálculo único con límites; comparar equipo antes/después produce diferencias medidas en combate. |
| B09 | Cocina y comida | Pendiente | Cocina usa ingredientes de mochila/refrigerador autorizado; plato restaura o aplica efecto temporal visible; expiración y recarga no acumulan efectos infinitamente. |
| B10 | Fuentes de recetas | Pendiente | Al menos los canales habilidad, compra, amistad, hallazgo y misión funcionan de extremo a extremo; el libro registra cada origen real. |

### C. Cofres, máquinas y automatización

Referencia: [Automate en CurseForge](https://www.curseforge.com/stardewvalley/mods/automate) y [documentación del autor](https://github.com/Pathoschild/StardewMods/tree/develop/Automate). Los criterios siguientes son el contrato de nuestra red; sus reglas deberán mostrarse al usuario.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| C01 | Cofre físico con contenido propio | Pendiente | Fabricar, colocar, abrir, nombrar, transferir y recargar; dos cofres conservan contenidos independientes y capacidad finita. |
| C02 | Movimiento de contenedores | Pendiente | Trasladar o retirar un cofre/máquina ocupada aplica una regla explícita sin borrar contenido o duplicar trabajo; una conexión se reconstruye al mover. |
| C03 | Máquina manual | Pendiente | Estados vacía, trabajando, lista, sin insumo, sin combustible y salida bloqueada se ven en modelo/panel; iniciar y recoger modifican inventarios una sola vez. |
| C04 | Producción artesanal | Pendiente | Cadenas concretas: leche–queso, huevo–preparado, lana–tela, grano–harina, fruta–conserva/bebida, resina–componente; no basta un barril decorativo. |
| C05 | Conexión por contacto | Pendiente | Dos máquinas y un cofre adyacentes forman una red; fijar si diagonal conecta y representarlo coherentemente; paredes y zonas se resuelven por una regla documentada. |
| C06 | Redes y conectores | Pendiente | Un conector físico une grupos; retirarlo los separa; no hay conexión global accidental por compartir tipo de objeto. |
| C07 | Entrada y salida automática | Pendiente | Añadir insumos al cofre inicia máquinas válidas; salidas vuelven a contenedor sin clics; no leen ingredientes de mochila remota. |
| C08 | Saturación y falta de materiales | Pendiente | Cofre lleno bloquea salida sin destruirla; al liberar espacio continúa; receta multingrediente nunca consume solo una parte. |
| C09 | Prioridad y filtros | Pendiente | Definir preferencia de cofre y máquina, reservar objetos, filtrar entrada/salida y pausar; dos recetas que compiten producen resultados previsibles. |
| C10 | Cadenas multietapa | Pendiente | Un resultado alimenta una segunda máquina; ciclos imposibles se detienen sin bucles ni producción infinita; ingredientes de misión reservados no desaparecen. |
| C11 | Inspección de red | Pendiente | Overlay muestra miembros, dirección y motivo de bloqueo; el jugador puede identificar por qué un horno no trabaja. |
| C12 | Tiempo, salida del mapa y recarga | Pendiente | Igual insumo y tiempo producen el mismo resultado en actualizaciones pequeñas o grandes; cruzar zona/portal/guardar no duplica lotes. |
| C13 | Redes entre mundos | Pendiente | Contenedor especial desbloqueado conecta ubicaciones con identidad persistida; la red local nunca obtiene esa capacidad gratuitamente. |
| C14 | Venta automatizada optativa | Pendiente | Exportación separada y explícita, con filtros; colocar un cofre junto al envío no vende por sorpresa herramientas, colección o misión. |

### D. Agricultura, plantas y recolección

Referencia: familias de crecimiento y cultivo de [Cultivos](https://es.stardewvalleywiki.com/Cultivos), [Árboles frutales](https://stardewvalleywiki.com/Fruit_Trees), [Árboles](https://stardewvalleywiki.com/Trees) y [Recolección](https://stardewvalleywiki.com/Foraging). El catálogo verificable figura en la sección 4.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| D01 | Suelo, siembra, riego, cosecha | Implementado | Completar el ciclo con cada familia de planta; surcos, humedad y fases legibles; consumo exacto y alcance válido. |
| D02 | Regla de 48 horas reales | Implementado | Cultivo inmaduro se deteriora según última agua real; maduro permanece decorativo; dormir muchos días no simula abandono real. |
| D03 | Estación y microclima | Parcial | Catálogo y tienda explican restricciones; cambios de estación respetan permanencia madura; no se confunde hábitat templado con clima meteorológico diario. |
| D04 | Rebrote, cosecha múltiple y semillas | Pendiente | Familias de fruto reiterado, lote múltiple y retorno de semillas operan distinto; cosechar no elimina indebidamente la planta reutilizable. |
| D05 | Calidad y fertilizantes | Pendiente | Calidad afecta uso/valor; fertilizante válido modifica una propiedad visible y conserva su estado en parcela; no duplica aplicación. |
| D06 | Riego automático | Pendiente | Aspersor consume/requiere lo definido, muestra cobertura y riega solo parcelas válidas; horario virtual no acorta los cuidados reales de forma oculta. |
| D07 | Espalderas y cultivos gigantes | Pendiente | Espalderas alteran recorrido; transformación de conjunto conserva parcelas y da cosecha coherente; no aparecer dentro de edificios ni romper acceso. |
| D08 | Invernadero y macetas | Pendiente | Interior cultivable con excepción estacional explícita, parcela e inventario propios; entrar/salir conserva plantas; modelo decorativo no cuenta. |
| D09 | Frutales | Pendiente | Plantón, crecimiento, espacio, fruta por temporada y recolección recurrente; tala y traslado tienen resultados definidos; manzano ornamental no cuenta como huerto. |
| D10 | Bosque productivo | Parcial | Árboles de varias familias tienen semillas, crecimiento, madera/resina/savia y herramientas apropiadas; árbol regenerado no duplica drop anterior. |
| D11 | Flores y apicultura | Pendiente | Flores tienen uso ornamental y productivo verificable; colmena detecta cobertura y produce según regla propia. |
| D12 | Recolectables y excavación | Parcial | Aparición por zona/estación, botín visible, semillas silvestres y puntos de excavación; guardar conserva recogido y no permite farmear recargando. |
| D13 | Variedad obtenible | Parcial | Cada entrada de la sección 4 tiene semilla/plantón/origen, aspecto reconocible, fases, producto y destino; variantes de color no sustituyen especies ausentes. |

### E. Animales, crianza y compañía

Referencia: la [documentación de animales](https://stardewvalleywiki.com/Animals) distingue ganado productivo, incubación, mascotas y montura. La genética y los cuidados del proyecto son requisitos propios que deben seguir operativos.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| E01 | Hogar, cupo y adopción | Implementado | Compra con refugio/especie/clima/cupo válido; rechazo sin cobro si falla; animales pueden reasignarse a hábitat compatible. |
| E02 | Cuidado y enfermedad | Implementado | Alimentar, acariciar, música, cuento, cepillado y medicina dan efectos distintos y persistidos; ausencia real se reconcilia sin pérdida injustificada. |
| E03 | Genética y crías | Implementado | Elegir progenitores compatibles, mostrar posibilidades, respetar edad/espera/hábitat/cupo; cría realmente hereda y aparece en mundo. |
| E04 | Comportamiento cotidiano | Parcial | Salir, pastar, beber, volver al refugio y descansar tienen rutas y estados; no atravesar muros; portón gobierna tránsito. |
| E05 | Recogida por especie | Parcial | Ordeño, esquila, huevos de suelo, búsqueda de trufas e incubación tienen interacciones diferenciadas; no todos producen con el mismo botón abstracto. |
| E06 | Productos y calidad | Parcial | Edad, cuidado y relación influyen conforme a reglas visibles; productos alimentan artesanía, cocina, pedidos y colección. |
| E07 | Incubación | Pendiente | Huevo apropiado inicia incubación en estación, reserva cupo, genera cría una sola vez y conserva tiempo al recargar. |
| E08 | Especies faltantes | Pendiente | Cabra, pato, avestruz y dinosaurio/equivalente propio tienen cuerpo, animación, producto, adquisición y hábitat funcional; una silueta de gallina ampliada no cierra la variedad visual. |
| E09 | Montura | Pendiente | Caballo/equivalente permite montar, desmontar, moverse y regresar a establo; respeta puertas, interiores y cambios de zona. |
| E10 | Perro, gato y tortuga | Pendiente | Mascotas con hogar, interacción y relación; se distinguen de ganado y no se usan como fábricas genéricas de productos. |
| E11 | Fantásticos | Parcial | Mantener unicornio, dragón, grifo y linajes ya aprobados; completar movimiento y cuidados por hábitat, sin convertir nombres provisionales en canon nuevo. |
| E12 | Automatización animal | Parcial | Silo/comedero/recogedor/ayudante usan suministros finitos, muestran alcance y turnos; automatizar conserva recompensas y restricciones del modo manual. |

### F. Habilidades, minería, equipo y combate

Referencia: [Habilidades](https://es.stardewvalleywiki.com/Habilidades), [Las minas](https://es.stardewvalleywiki.com/Las_Minas), y [mejora de equipo](https://www.minecraft.net/en-us/article/taking-inventory--netherite-ingot). Los minerales y nombres de niveles finales son propios.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| F01 | Experiencia y especialización | Pendiente | Agricultura, crianza, pesca, minería, recolección y combate registran experiencia por acciones; subir nivel desbloquea capacidades reales, recetas y elecciones persistidas. |
| F02 | Nodos y herramientas | Implementado | Golpes parciales, herramienta y nivel adecuado, impacto único, rotura, drop y recogida se sostienen en cada zona; resistencia visible. |
| F03 | Minerales con cadena de uso | Parcial | Piedra, mena, carbón/combustible, lingotes, gemas y materiales de mundos tienen fuentes y usos distintos; ningún piso entrega todos los escalones. |
| F04 | Exploración minera | Parcial | Pisos con distribución, obstáculos, recursos y objetivos diversos; escalera/salida/rescate accesibles; se conserva acceso a minerales de menor nivel. |
| F05 | Entidades enemigas | Pendiente | Cada enemigo tiene posición, vida, comportamiento, percepción y colisión; múltiples enemigos actúan independientemente. |
| F06 | Ataque físico | Parcial | Alcance/dirección/hitbox, anticipación, contacto, recuperación, invulnerabilidad breve y cadencia; no dañar enemigos fuera del rango desde un panel. |
| F07 | Patrones enemigos | Pendiente | Al menos familias con persecución, proyectil, carga y defensa exigen respuestas distintas; ataques anuncian peligro y tienen ventanas evitables. |
| F08 | Defensa y estados | Pendiente | Armadura/resistencia modifican daño recibido; comida y estados temporales tienen duración; UI informa causa de daño y efecto equipado. |
| F09 | Botín y derrota | Parcial | Tabla de botín contextual, drops persistentes y recuperación segura; derrotar no produce recompensas repetidas al volver a entrar. |
| F10 | Encuentros y jefes | Pendiente | Encuentro de cada región usa arena, fases, recompensa/desbloqueo y estado persistente; victoria no se reduce a pulsar hasta agotar un número. |
| F11 | Hallazgos mineros | Pendiente | Geodas/tesoros/artefactos se obtienen jugando, identifican/procesan y alimentan museo/equipo; precios y resultados no se regeneran por recarga. |

### G. Pesca y ecosistemas acuáticos

Referencia: [Pesca](https://es.stardewvalleywiki.com/Pesca) y amplitud de peces publicada por [Expanded](https://www.nexusmods.com/stardewvalley/mods/3753).

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| G01 | Lanzamiento y picada | Parcial | Elegir orilla/agua válida, lanzar, esperar señal, enganchar o fallar, cancelar y recoger; estados representados por caña, flotador y sonido. |
| G02 | Lucha diferenciada | Parcial | Distintos peces presentan patrones y dificultad; herramienta, habilidad, cebo y aparejo afectan valores concretos; feedback de progreso/escape continuo. |
| G03 | Disponibilidad | Implementado | Zonas, horas, estación y cebo restringen especies; añadir clima diario; el cuaderno explica pistas sin fingir capturas aún no obtenidas. |
| G04 | Captura y tesoro | Parcial | Peso/calidad/registro/capacidad de mochila, basura y tesoro con resultados persistidos; consumir cebo y otorgar pez es atómico. |
| G05 | Trampas y estanques | Pendiente | Colocación en agua, cebo, producción, recogida, crecimiento/pedidos del estanque y automatización; no compartir un inventario invisible global. |
| G06 | Variedad y colección | Parcial | Cubrir agua dulce, mar, subsuelo, estaciones, noche y mundos; cada pez requerido por pedido debe ser alcanzable durante su plazo. |

### H. NPC, rutinas y comunidad

Referencias: [Socializar](https://es.stardewvalleywiki.com/Amistades), [Expanded: Apples](https://stardew-valley-expanded.fandom.com/wiki/Apples) y los horarios/eventos descritos por [FlashShifter](https://www.nexusmods.com/stardewvalley/mods/3753). Expanded muestra que decisiones pueden cambiar hogar, acceso y rutina, no solo una línea de texto.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| H01 | NPC independientes | Parcial · 24 habitantes con apariencia, rutina y relación; alojamiento compartido provisional | Identidad, apariencia, hogar, oficio y estado propio; hablar con una persona abre diálogo, no siempre la tienda. |
| H02 | Horario y navegación | Parcial · rutas por hora, día y lluvia; pendientes estaciones/eventos y viajes entre regiones | Agenda por día, hora, estación, clima y evento; caminar entre nodos, entrar/salir, atender/descansar; sin teletransporte visible injustificado. |
| H03 | Horarios comerciales | Parcial · apertura, cierre y días libres integrados; pendientes cierres especiales y alternativas de entrega | Edificio y mostrador pueden tener disponibilidad distinta; cartel/UI anticipan cierres; no bloquear una entrega sin alternativa razonable. |
| H04 | Diálogo contextual | Parcial · diálogos propios por día/amistad y lluvia; pendientes misión, elecciones y escenas | Estado de misión, relación, lugar, evento y conversación previa eligen texto coherente; alternativas y condiciones persistidas. |
| H05 | Amistad | Parcial · conversación, regalos y corazones guardados; pendientes ayuda y eventos sociales | Hablar/regalar/ayudar cambia relación con límites diarios/semanales definidos; panel social indica progreso y gustos descubiertos. |
| H06 | Regalos y preferencias | Parcial · regalo de casilla/calidad exacta, gustos y límites persistidos; pendientes ocasiones especiales | Regalo consume objeto real, valida destinatario y aplica preferencia/calidad; rechazo no entrega a un NPC equivocado. |
| H07 | Escenas por relación | Pendiente | Evento con condiciones, puesta en escena, elección y efecto; saltarlo conserva consecuencias correctas; no se repite al recargar. |
| H08 | Correo e invitaciones | Pendiente | Buzón con mensajes, adjuntos reclamables una vez, invitaciones y recetas; fecha y condición visibles. |
| H09 | Vida comunitaria | Pendiente | Personajes se reúnen, asisten a eventos y cambian rutina tras una obra o decisión; el mundo refleja el progreso. |
| H10 | Relaciones del proyecto | Parcial | Mantener la identidad de pareja existente; el motor soporta vínculos y convivencia sin inventar romances, matrimonios o historias definitivas para NPC no aprobados. |

### I. Misiones, encargos y pedidos

Referencias: [Misiones base](https://es.stardewvalleywiki.com/Misiones) y [misiones de Expanded](https://stardew-valley-expanded.fandom.com/wiki/Quests). Distinguir historia, encargo temporal, entrega, colección y evento; no representar todo como estadísticas acumuladas.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| I01 | Diario y seguimiento | Parcial | Varias misiones activas, seleccionables; objetivo actual, lugar, persona, plazo y recompensa; el HUD sigue la elegida. |
| I02 | Máquina de estados | Pendiente | Disponible, aceptada, activa, lista para entregar, completada, fallida/cancelada; transición validada y persistida. |
| I03 | Objetivos semánticos | Parcial | Distinguir obtener después de aceptar, poseer, entregar, fabricar, visitar, conversar, descubrir, derrotar y elegir; vender antes no satisface poseer/entregar. |
| I04 | Entregas | Pendiente | NPC/buzón/cofre correctos reciben artículo, calidad y cantidad; descuenta lo entregado, admite avance parcial y nunca consume otra pila por error. |
| I05 | Ramificación | Pendiente | Elección A abre una cadena y cambia un estado del mundo; elección B produce otro resultado real; condiciones excluyentes y cierre sin doble recompensa. |
| I06 | Diarias y repetibles | Pendiente | Generación por día con semilla persistida, variedad de tipo y petición alcanzable; renovar no reinicia al recargar; repetible lleva identificador de instancia. |
| I07 | Pedidos especiales | Pendiente | Varias etapas, acumulación desde aceptación, entrega concreta, plazo más largo, escena/recompensa y cooldown si aplica. |
| I08 | Espacio de pedidos | Pendiente | Tablón/lugar físico con disponibles, aceptados y entregas; acceso directo al detalle; cajas o mostradores muestran pedido y contenido entregado. |
| I09 | Colecciones/lotes | Pendiente | Entregas de categorías o piezas concretas, cantidades y calidad; avance persistido, recompensa por lote y transformación/desbloqueo visible. |
| I10 | Recompensas | Parcial | Monedas, artículos, receta, relación, acceso, edificio o efecto; validar capacidad antes de cerrar; reclamar de nuevo no da nada. |
| I11 | Prerrequisitos y alcanzabilidad | Parcial | Grafo sin ciclos imposibles; recursos y NPC accesibles en el plazo; probar ambas ramas y recuperación tras vencer plazo. |
| I12 | Campaña completa | Pendiente | Recorrer inicio, ramas, progresión y cierre con medios ordinarios; ningún objetivo necesita consola, fixture o tiempo artificial para ocultar un bloqueo de diseño. |

### J. Día, clima, descanso y eventos

Referencias: [Ciclo diario](https://es.stardewvalleywiki.com/Ciclo_Diario), [Clima](https://es.stardewvalleywiki.com/Clima) y [Festivales](https://es.stardewvalleywiki.com/Festivales). El reloj real de cuidado se mantiene separado por requisito del proyecto.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| J01 | Dos relojes | Parcial | Estado explícito de calendario y tiempo real; avanzar o pausar día no reescribe sellos de alimentación/riego/enfermedad. |
| J02 | Dormir | Pendiente | Acercarse a cama/lugar válido, confirmar, cerrar jornada, resumen y mañana siguiente; efectos una sola vez; no equivale a rellenar barras en cualquier lugar. |
| J03 | Energía, salud y descanso | Parcial | Acciones consumen según reglas, comida/descanso recuperan; agotamiento, desmayo y rescate tienen consecuencias y vuelta segura. |
| J04 | Estaciones visibles | Parcial | Suelo, vegetación, iluminación, oferta y actividades reflejan estación sin reemplazar mecánica por un texto del calendario. |
| J05 | Meteorología | Pendiente | Día soleado/lluvioso/tormenta/nieve y estados propios, pronóstico persistido, efectos sobre pesca/rutinas/riego/visibilidad; recargar no vuelve a sortear. |
| J06 | Festivales | Pendiente | Calendario, invitación, área preparada, NPC, actividad jugable y recompensa propia; terminar devuelve al mundo con hora coherente. |
| J07 | Eventos de mundo | Pendiente | Disparadores por fecha/progreso/lugar/clima, cola y prioridad; escena que se salta o interrumpe puede recuperarse sin aplicar efectos dos veces. |
| J08 | Menús y pausa | Parcial | Definir qué pausa el calendario y combate; el cuidado real continúa; abrir mochila no permite un exploit de ataques invisibles. |
| J09 | Actualización ausente | Parcial | Ausencia corta/larga conserva cosechas maduras y calcula procesos con límites; mismas reglas online/offline sin bucles por cada milisegundo. |

### K. Economía, construcción, museo y desbloqueos

Referencias: [Productos artesanales](https://es.stardewvalleywiki.com/Productos_Artesanales), [Museo](https://es.stardewvalleywiki.com/Museo) y [Lotes](https://es.stardewvalleywiki.com/Lotes).

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| K01 | Tiendas y stock | Parcial | Oferta por estación/progreso, precios visibles, stock diario persistido y compra/venta diferenciada; servicios reconocibles al recorrer el pueblo. |
| K02 | Envíos y balance diario | Pendiente | Contenedor de venta con revisión de lo enviado, resolución al cierre y desglose; no vender automáticamente objetos reservados. |
| K03 | Obras y mejoras | Parcial | Plano, materiales, huella/acceso, encargo, plazo y entrega; durante obra no ofrece cupo/servicio; mejoras cambian interior y capacidades. |
| K04 | Decorar y reorganizar | Implementado | Mover/girar/retirar conserva estado de objetos funcionales y acceso; caminos, vallas y portones tienen conducta coherente. |
| K05 | Museo físico | Pendiente | Donar pieza obtenida realmente, consumir una unidad, situarla/mostrarla, registrar donación única y reclamar recompensa sin duplicar. |
| K06 | Colecciones y cuadernos | Parcial | Separar descubierto, capturado, criado, fabricado, vendido y donado; atlas de vista previa no se muestra como colección conseguida. |
| K07 | Libros y pistas | Pendiente | Hallazgos leíbles con registro y pistas útiles para sistemas/desbloqueos; textos provisionales etiquetados internamente, sin canon nuevo. |
| K08 | Obras comunitarias | Pendiente | Contribuir materiales/categorías, terminar obra, abrir ruta o servicio y ver NPC usarlo; no solo añadir un token. |
| K09 | Balance y vías alternativas | Parcial | Comprar/craftear/vender no crea dinero infinito; no hay dependencia circular entre herramienta, mineral y zona; el jugador puede recuperarse de falta de recursos. |

### L. Mundo ampliado, portales y espacio

Referencias: red de regiones de [Expanded](https://stardew-valley-expanded.fandom.com/wiki/Category%3ALocations), progreso del [Enchanted Grove](https://stardew-valley-expanded.fandom.com/wiki/Enchanted_Grove) y consecuencias espaciales de [Aurora Vineyard](https://stardew-valley-expanded.fandom.com/wiki/Aurora_Vineyard). Verdia/Senda/Nox/espacio son requisitos propios, no nombres de esas referencias.

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| L01 | Red de mapas | Parcial | Exteriores, interiores y transiciones definidos con acceso, salida, colisiones, recursos, NPC y estado persistente; mostrar mapa con rutas y restricciones. |
| L02 | Diversidad regional | Parcial | Costa, río, montaña, bosque, subsuelo, ruinas y regiones avanzadas difieren en silueta, recorrido, encuentro, recurso y actividad. |
| L03 | Desbloquear rutas | Parcial | Obra, equipo, misión, relación o colección abre acceso verificable; la barrera explica falta y no puede saltarse con UI de viaje. |
| L04 | Portales | Pendiente | Descubrir, activar, seleccionar destino y cruzar un portal físico; validar requisitos/coste; regreso seguro incluso con inventario lleno o derrota. |
| L05 | Verdia | Pendiente | Región propia con mapa recorrible, recursos/plantas, NPC o encuentro, cadena de actividad y recompensa que se use fuera de ella; contenido narrativo provisional. |
| L06 | Senda | Pendiente | Región distinta de Verdia por actividad, distribución y materiales; entrada/salida y desbloqueo funcionan; no es recolor del mismo plano. |
| L07 | Nox | Pendiente | Identidad mecánica, recursos, peligros/equipo apropiado, hallazgo y vuelta segura; no asignar doctrina o historia definitiva sin fuente del usuario. |
| L08 | Espacio | Pendiente | Acceso avanzado, mapa navegable, actividad propia, recursos usados en fabricación y pedidos, gestión de peligros y retorno; fondo estrellado no cuenta como sistema. |
| L09 | Mundo que recuerda | Parcial | Cofres, nodos, encuentros, obras, NPC y pedidos conservan estado por zona; entrar/salir no reinicia recompensas ni desbloquea rutas ajenas. |
| L10 | Casa y juegos existentes | Implementado | Viajar a casa y volver mantiene personaje, posición segura, inventario y sesión; nuevos sistemas no sustituyen ni rompen minijuegos existentes. |

### M. Robustez y comprobación de experiencia

| ID | Capacidad | Estado base | Criterio propio para cerrar |
|---|---|---|---|
| M01 | Migración de partidas | Parcial | Importar v4 conserva cantidades, edificios, animales, genomas, misiones y tokens; nuevos campos tienen valores válidos; copia recuperable ante error. |
| M02 | Guardado integral | Parcial | Guardar en combate, fabricación, entrega, cofre, viaje y evento; reabrir conserva o recupera un estado seguro definido. |
| M03 | Datos coherentes | Parcial | Todo artículo/receta/cultivo/animal/enemigo/zona referenciado existe; cada desbloqueo tiene origen y uso; IDs no dependen de etiquetas traducidas. |
| M04 | Interacción por proximidad | Parcial | Motor e interfaz validan las acciones sensibles; no operar tienda, entregar pedido, golpear o abrir cofre desde otra zona. |
| M05 | Rendimiento | Parcial | Medir tiempos y memoria con granja poblada, redes activas, región y combate; perfil ligero conserva reglas; separar datos medidos de estimaciones. |
| M06 | Pruebas manuales | Pendiente | Evidencia visual y recorrido con controles normales en escritorio y móvil; pruebas de motor solas no certifican que una función se pueda encontrar o usar. |

## 4. Inventario de variedad: contenido que aún debe cubrirse

### 4.1 Cultivos de la referencia base

La navegación de [Crops, revisión 193979 consultada](https://stardewvalleywiki.com/mediawiki/index.php?title=Crops&oldid=193979) contiene **46 nombres únicos** después de deduplicar entradas estacionales; la fibra aparece además como cultivo en el cuerpo de la página: **47 si se incluye ese cultivo de recurso**. Es un recuento de ese inventario y esa revisión, no una constante universal del juego. Las semillas mixtas, mixtas florales y silvestres deben registrarse como clases de semilla, no inflar artificialmente el número de especies.

| Grupo documental | Lista de referencia para cotejar equivalentes propios |
|---|---|
| Primavera | Jazz azul, zanahoria, coliflor, café, ajo, judía verde, col rizada, chirivía, patata, ruibarbo, fresa, tulipán, arroz sin moler |
| Verano | Arándano, café, maíz, lúpulo, chile, melón, amapola, rábano, col lombarda, carambola, lentejuela de verano, calabacín de verano, girasol, tomate, trigo |
| Otoño | Amaranto, alcachofa, remolacha, bok choy, brócoli, maíz, arándano rojo, berenjena, rosa hada, uva, calabaza, girasol, trigo, ñame |
| Invierno | Melón de invierno |
| Especiales | Fruta antigua, fruto de cactus, piña, fruto de encargo especial, baya preciosa, taro, té, fibra cultivable |

Los nombres genéricos de alimentos pueden mantenerse; los elementos ficticios requieren nombres, arte y contexto propios. La tabla no obliga a copiar descripciones, precios, fases exactas o costes. **Todos están pendientes de cotejo final individual**; la línea base solo contiene zanahoria, tomate, trigo, calabaza, fresa, maíz y tres variantes propias de clima. Esas variantes se conservan como adiciones propias y no sustituyen las entradas que faltan.

Para cada equivalente registrar: ID propio, referencia de comparación, estación/clima, forma de obtener semilla, planta visible por fases, duración propia, riego, cosecha simple/múltiple/rebrote, colisión, calidad, usos de artesanía/cocina/regalo/pedido y prueba. Completar una entrada exige que se pueda adquirir y cultivar por juego normal.

### 4.2 Expanded: cultivos y otras plantas

El [inventario indexado de Expanded](https://stardew-valley-expanded.fandom.com/wiki/Templates) enumera doce cultivos. La columna derecha propone identidades temporales para el catálogo propio; ninguna fija historia canónica.

| Entrada de referencia | Equivalente propio provisional | Diferencia de comportamiento que debe existir |
|---|---|---|
| Butternut Squash | Calabaza cacahuete | Cultivo alimenticio de cosecha única y transformación culinaria |
| Cucumber | Pepino | Verdura de fruto reiterado y conserva |
| Gold Carrot | Zanahoria áurea | Semilla especial con adquisición avanzada |
| Ancient Fiber | Helecho ancestral | Planta de recurso vinculada a exploración |
| Joja Berry | Baya de invernadero | Cultivo comercial avanzado con acceso propio, sin marca copiada |
| Joja Veggie | Hortaliza de selección | Otra decisión de inversión y fuente de semilla |
| Monster Fruit | Fruto de las cavernas | Semilla obtenida por aventura y ciclo agrícola posterior |
| Monster Mushroom | Hongo de umbría | Cultivo de ecosistema subterráneo |
| Salal Berry | Baya de salal | Arbusto productivo con adquisición diferenciada |
| Slime Berry | Baya gelatinosa | Recurso agrícola de un encuentro o criadero propio |
| Sweet Potato | Batata | Tubérculo estacional con receta propia |
| Void Root | Raíz de Nox | Planta de mundo avanzado, peligro/uso claramente comunicado |

No atribuir estas reglas propias a SVE; el detalle de cada entrada debe comprobarse en su página al implementarla. No usar doce colores de la misma planta como equivalentes funcionales.

Los [frutales base](https://stardewvalleywiki.com/Fruit_Trees) enumeran ocho tipos: manzano, albaricoquero, banano, cerezo, mango, naranjo, duraznero y granado. [Expanded añade cuatro](https://stardew-valley-expanded.fandom.com/wiki/Fruit_Trees): peral, nectarino, caqui y árbol monetario. Este último se puede adaptar como árbol de recurso avanzado con identidad propia. En la línea base el manzano y limonero son ornamentales: **cero frutales productivos verificados**.

Registrar aparte los árboles de madera/resina y sus excepciones: roble, arce, pino, caoba, palmera, árbol hongo, árbol especial y árboles de evento. El [inventario de árboles](https://stardewvalleywiki.com/Trees) sirve para comparar funciones de semilla, tala, tocón y extractor. Expanded exige además cotejar sus árboles y recursos, como savia/agua de abedul y cera de abeto, antes de afirmar cobertura.

La página de [recolectables de Expanded](https://stardew-valley-expanded.fandom.com/wiki/Forage) publica **19 elementos**, aclarando que su clasificación interna no es uniforme. Inventario de comparación: bearberry, conch, dewdrop berry, diamond flower, Ferngill primrose, four leaf clover, golden ocean flower, goldenrod, mushroom colony, poison mushroom, rafflesia, red baneberry, sand dollar, shark tooth, swamp flower, swirl stone, thistle, winter star rose y void soul. Crear equivalentes visuales y usos propios; cotejar además recolección base por primavera, verano, otoño, invierno, costa, desierto, mina e isla. **La lista completa de recolección base sigue pendiente de inventario**, por lo que no se puede declarar cobertura total de plantas todavía.

### 4.3 Animales y roles

Inventario basado en [Animals](https://stardewvalleywiki.com/Animals), consultado el 7 de octubre. No mezclar especies, variantes, monturas y mascotas en una sola cifra.

| Rol / categoría | Referencias que cubrir | Línea base | Aceptación de variedad |
|---|---|---|---|
| Ganado lácteo | Vaca, cabra | Vaca parcial; cabra ausente | Ordeño, producto y transformación propios; tamaños/animación distinguibles |
| Fibra | Oveja, conejo | Ambos presentes | Esquila/recogida diferenciada, ciclos, producto y usos |
| Huevos | Gallina, pato, avestruz, dinosaurio | Gallina presente; resto ausente | Adquisición/incubación, productos, hábitats y aspecto diferenciados |
| Búsqueda exterior | Cerdo | Presente como cerdito | Buscar trufa en terreno válido; no generarla solo como contador interior |
| Variantes especiales | Variantes de ganado y aves extraordinarias | Cuatro fenotipos naturales por especie y fantasías propias | Distinguir variación cosmética de variante con producto/adquisición propia |
| Montura | Caballo | Ausente | Movimiento montado, establo y recuperación |
| Mascotas | Gato, perro, tortuga | Ausentes | Compañía, cuenco/hogar, interacción y vínculo |
| Criadero especial | Criaturas tipo slime/equivalente | Ausente | Espacio controlado, producción/reproducción y manejo propio |
| Fantasía del proyecto | Unicornio, dragón, grifo y linajes aprobados | Presentes en datos/modelos | Conservar genética y hábitats; completar comportamiento sin sustituir faltantes base |

La lista de ganado productivo base contiene nueve familias si se agrupan variantes de gallina/vaca. Añadir mascotas y caballo no aumenta ese mismo subtotal: pertenecen a roles diferentes. Expanded no justifica inventar un número de ganado adicional; sus animales nuevos deben cotejarse con documentación específica si se exige también esa variedad.

### 4.4 Regiones, mapas e interiores

La [categoría indexada de ubicaciones de SVE](https://stardew-valley-expanded.fandom.com/wiki/Category%3ALocations) decía 26 nuevas ubicaciones y mostraba 42 entradas; la [página del autor](https://www.nexusmods.com/stardewvalley/mods/3753) decía 58. Esta diferencia impide sumar cifras como si compartieran revisión y definición. Un interior, una variante de granja y un mapa exclusivo de evento no equivalen a una región explorable. Llevar inventarios separados.

| Familia de recorrido | Referencias funcionales | Equivalencia propia pendiente |
|---|---|---|
| Hogar y producción | Granja, vivienda, graneros, gallineros, cobertizo, invernadero y bodega | Interiores útiles, producción, almacenamiento, ampliaciones |
| Comunidad | Pueblo, tiendas, casas, clínica, taberna, archivo/museo y centro de proyectos | Rutinas, servicios, pedidos y eventos; viviendas con habitantes reales |
| Recursos próximos | Bosque, lago/río, montaña, cantera y costa | Recolectables/peces/nodos particulares, rutas y horarios |
| Exploración | Mina, cavernas especiales, ruinas y bosque secreto | Progresión de equipo, tesoros, enemigos y atajos |
| Viaje avanzado | Desierto, isla, pantano, volcán, red de transporte | Condiciones de acceso, semillas/animales/materiales y vuelta segura |
| Expanded: economía rural | Viñedos, granjas vecinas, jardín comunitario, tierras ampliadas | Productores, cadenas, pedidos y decisiones de restauración propias |
| Expanded: magia/exploración | Bosque ampliado, arboleda de portales, manantial, tierras altas, arrecife y laberinto | Nuevos circuitos de exploración, recursos y puertas de progreso |
| Expanded: peligro avanzado | Yermos, canteras/cavernas avanzadas, tesorería y puesto remoto | Enemigos/equipo, hallazgos, rescate y comercio propios |
| Mapas de evento | Lugares solo accesibles durante escenas | Escena navegable o puesta en escena con retorno coherente; no contar como región permanente |
| Proyecto | Verdia, Senda, Nox, espacio | Cuatro identidades de juego distintas con subzonas, portales y destinos productivos |

La línea base tiene seis `Zona`: granja, pueblo, bosque, lago, mina y bosque ancestral; cinco pisos mineros son variantes de la mina, y treinta sectores comprables son parcelas dentro de granja. **No son 41 regiones.** Una zona nueva necesita propósito, contenido y conexiones, además de nombre y terreno.

### 4.5 Otros inventarios obligatorios antes del cierre

| Categoría | Trabajo requerido |
|---|---|
| Peces y fauna acuática | Lista base + añadidos de Expanded por lugar, hora, clima, temporada, equipo, dificultad, colección y uso; resolver discrepancia entre listas y cifra publicada antes de afirmar totalidad |
| Máquinas | Inventario por familia: fundición, grano, lácteo, huevos, fibra, conservas, bebidas, maduración, aceite, miel, resinas, reciclaje, semillas, geodas, energía, trampas y recolección automática |
| Recetas | Componentes, herramientas, armas, armaduras, máquinas, decoración, fertilizantes, cebos, cocina y mejoras; comprobar que todas sus entradas y salidas existen y se obtienen |
| Equipo | Familias de armas, armaduras, accesorios y herramientas por escalón material; fuentes, estadísticas, mejoras, reparaciones y usos regionales |
| NPC | Población con oficios, hogares, rutinas, vínculos y arcos; no contar estatuas o copias de vendedor como personajes completos |
| Misiones y eventos | Catálogo por tipo, etapa, rama, personaje, estación y región; recorrido realizable, efectos y desenlace |
| Hallazgos | Artefactos, minerales de museo, libros, notas, tesoros y colecciones; origen y premio, con interfaz y exposición física |

Estos inventarios están **pendientes de completar**. Documentarlos como pendientes es parte de la auditoría, no una reducción del objetivo solicitado.

## 5. Próximos pasos desde el estado integrado actual

Orden actualizado el **9 de octubre de 2026**, después de clima, envíos, huerto y habilidades. Se amplía granja-v3; no se reconstruye el motor ni se generan entregables finales por cada módulo. La matriz de línea base anterior sirve de referencia histórica; el avance integrado y las pruebas registran lo que existe actualmente.

Reglas que atraviesan cada bloque: días, estaciones, crecimiento de cultivos y edad de crías solo avanzan al dormir; el cuidado real permanece separado. Los cultivos maduros permanecen como decoración. Conservar partidas, inventario/calidades, genomas, edificios movibles, personaje y conexión con la casa/minijuegos de Claude. No trasladar el tiempo de producción automática al calendario agrícola. Cada ampliación debe tener adquisición normal, interacción visible, animación apropiada, persistencia y pruebas antes de pasar al siguiente bloque.

1. **Frutales e invernadero — primera fase integrada el 9 de octubre.** Añadir plantones obtenibles, etapas visibles, separación de árboles, información de crecimiento, frutos por temporada y recogida con límite de acumulación. Madurez y nuevos frutos se procesan por jornada, sin dar crecimiento durante ausencia. Mantener manzano y limonero ornamentales existentes para no convertir decoraciones de partidas anteriores sin consentimiento. Empezar por los ocho tipos de frutales base inventariados y después cubrir los añadidos/regionales. Restaurar y construir un invernadero con entrada, interior utilizable, parcelas, riego y reglas que permitan cultivo fuera de temporada, conservando requisitos especiales de hábitat. Aceptación: comprar, plantar, cuidar, dormir, cosechar, procesar/enviar, recargar y comprobar crecimiento detenido fuera de las jornadas; repetir dentro del invernadero.

2. **Habilidades y desbloqueos — primera fase integrada el 9 de octubre.** Experiencia independiente de agricultura, minería, recolección, pesca y combate; niveles visibles, recetas y mejoras útiles. Sustituir la aproximación de calidad por cosechas globales con un cálculo ligado a habilidad, abono y reglas documentadas. Preparar especializaciones persistentes con efectos reales. Aceptación: las actividades correctas conceden experiencia una vez, las mejoras cambian una acción y sobreviven recarga/migración.

3. **Ganadería completa y compañía — primera fase integrada el 9 de octubre.** Cabras, patos, avestruces y criaturas prehistóricas, con adquisición propia, hogares, productos, incubación y crecimiento por jornadas. Añadir ordeño, esquila y búsqueda de trufas en el terreno, además de recogida de huevos. Extender genética y hábitats sin sustituir el cuadro de Punnett. La fase actual incluye adquisición, genética, incubación, productos y cariño; la segunda fase añade paseo en corral, pastoreo animado, horarios, descanso y puerta funcional del refugio; quedan navegación libre, colisiones avanzadas, bebida y portones de vallas colocables. Separar ganado productivo de caballo montable y mascotas. Mantener enfermedad/depresión, veterinario y ayudante avanzado. Aceptación: cada especie es obtenible jugando, tiene acciones distintas y no pierde edad, cuidados, productos o genoma al trasladar su refugio.

4. **Carpintería, obras y mejoras — ciclo de encargos y ampliaciones productivas integrado el 9 de octubre.** Encargos con coste y materiales reservados, plazo por jornadas, obra visible y entrega única. Ampliar graneros/cobertizos/capacidad y espacios productivos sin perder habitantes o contenidos. Permitir reorganización con cuadrícula, giro, huella y acceso comprobados. Aceptación: encargar, cerrar juego, dormir, recibir y mejorar; cancelación o doble interacción no duplica materiales ni edificios.

5. **Producción y automatización extensa.** Completar familias de máquinas todavía ausentes: huevos/lácteos, aceite, conservas/bebidas, miel, extractores, semillas, reciclaje, geodas y maduración. Añadir conexiones explícitas, filtros, prioridad, vista de redes y envíos automáticos mediante salida configurable. Almacenamiento lleno debe detener la cadena sin perder ingredientes. Resolver redes entre ubicaciones después de estabilizar los conectores locales. Aceptación: recorrer cadenas con fuentes obtenibles, separar/reconectar redes, saturar salidas, recargar y verificar conservación de cantidades/calidades y un único cobro nocturno.

6. **Pesca completa.** Lanzamiento, espera, picada, lucha y captura; especies con patrones/dificultades distintos, cañas, cebos, accesorios, tesoros, trampas y estanques. Completar el inventario comparativo de peces y fuentes regionales antes de afirmar cobertura. Mostrar condiciones de lugar, hora, estación y clima. Aceptación: capturas con controles normales, condiciones incorrectas, cancelación, mochila llena y usos del pescado en recetas/pedidos/colección.

7. **Pueblo vivo.** Rutas de NPC entre hogar, trabajo y ocio, horarios y cambios por día/clima; tiendas con apertura, oferta, stock/reposición y encargos. Conversaciones, gustos, regalos, amistad, correo y escenas. Construir primero la infraestructura y probar una rutina completa, después extenderla a los vecinos. Los textos argumentales definitivos se integran con el lore aprobado. Aceptación: seguir un vecino durante una jornada, encontrarlo donde corresponde, comprobar tienda cerrada/abierta y guardar relaciones sin repetir regalos o recompensas.

8. **Misiones con aceptación, entrega y decisiones.** Diario de objetivos, pedidos diarios/especiales, entregas parciales, plazos por días jugados, recompensas únicas y ramas persistentes. Conectar restauración, profesiones, criaturas normales/fantásticas y recursos regionales. Hacer obligatoria la crianza de linajes para los desbloqueos previstos; mantener tokens/contratos para que Claude defina las recompensas de la casa. Aceptación: completar y dejar vencer pedidos, elegir ramas distintas, consumir productos entregados y comprobar que guardar/recargar no repite premios.

9. **Colecciones y calendario comunitario.** Museo físico, artefactos, minerales, peces y productos registrados; donaciones que consumen objetos y recompensas que transforman espacios o abren actividades. Festivales, calendario de eventos, correo y proyectos comunitarios con recorridos jugables. Aceptación: encontrar/donar, recargar, visitar exposición y recibir un premio una vez; participar en evento y volver a la misma granja.

10. **Mina y combate de mayor profundidad.** Ampliar patrones, ataques anticipados, defensa, armas/armaduras/accesorios, botín, tesoros, jefes y progresión de pisos/materiales. Conectar mejoras de equipo con nodos y puertas de progreso realmente accesibles. Revisar sensación del movimiento, impacto, alcance, invulnerabilidad breve, rescate y regreso. Aceptación: mineral → procesamiento → equipo → enemigo/zona nueva, con derrota, recuperación y persistencia.

11. **Regiones extensas, mundos y espacio.** Completar rutas y contenido propio de costa, montaña, desierto, isla y zonas regionales adicionales. Dar a cada mapa recursos, habitantes/encuentros, pesca/cultivos y motivo de visita, sin contar interiores o parcelas como regiones nuevas. Profundizar Verdia/Senda/Nox según el lore recibido: requisitos de portales, actividades, peligros y retorno. Expandir asteroides/planetas con recursos útiles, preparación y oxígeno donde corresponda. Aceptación: abrir el acceso jugando, completar un circuito propio de cada región, usar el recurso obtenido y volver conservando estado.

12. **Arte, animación y rendimiento durante todos los bloques.** Cada implementación incluye fases, gestos, efectos y lectura visual; revisar escalas, suelo labrado continuo, caminos, cercas, decoración, clima e iluminación. Dar a animales y NPC acciones y rutas visibles. Cargar mundo por cercanía, reutilizar geometría/materiales y limitar partículas y luces costosas. Medir granjas pobladas y redes activas; mantener perfil ligero y detalle alto. La revisión de viewport no certifica rendimiento físico de S21 FE/S24 Ultra: esos ensayos siguen pendientes de disponer de los dispositivos.

13. **Balance, auditoría y entrega final.** Completar inventarios funcionales de la sección 4 y cerrar omisiones de la matriz. Verificar que cada semilla, animal, receta, material y región tenga fuente, uso y camino de desbloqueo. Recorrer una partida desde cero por controles normales, incluyendo temporadas, restauración, ganadería, automatización, relaciones, pedidos y aventura. Revisar integración con la casa de Claude, exportación/importación, recuperación y migración. Entregar únicamente después de esa comprobación, con documentación de integración y límites reales; no declarar paridad por cantidades de catálogo o pruebas con fixtures.

Este orden expresa dependencias y prioridad actual. Los ajustes visuales y de rendimiento acompañan cada bloque, y los problemas de guardado, acceso o conservación de objetos se corrigen antes de seguir ampliando contenido. Las duraciones, costes y cifras todavía no implementadas requieren diseño y validación; esta lista no los presenta como hechos del motor.

## 6. Recorridos de aceptación de extremo a extremo

1. **Primera jornada:** salir de la casa existente; ordenar barra con hacha, pico, semilla y comida; cortar árbol, recoger, labrar, sembrar, regar, fabricar cofre y guardar sobrantes; reabrir partida y continuar.
2. **Producción manual:** conseguir mena/combustible, fabricar horno, fundir, producir herramienta, usarla sobre recurso antes inaccesible; comprobar que la mejora cambia el trabajo.
3. **Automatización:** montar dos cofres, horno y siguiente estación; poner insumos; bloquear salida llenando cofres; liberar espacio; mover conector; comprobar separación y recomposición de redes; recargar.
4. **Agricultura variada:** obtener cultivos simples, de rebrote, flor, espaldera, recurso y mundo avanzado; cultivar frutal; probar estación/clima, fertilizante, invernadero, aspersor y receta de cada familia.
5. **Cuidado propio:** dejar preparado un escenario de tiempo real verificable; demostrar maduro decorativo permanente, deterioro inmaduro y recuperación animal; dormir no altera las 48 horas reales.
6. **Ganadería extensa:** cabra, pato, avestruz y criatura prehistórica con hogar adecuado; ordeño/incubación/recogida; criar sin perder genética; perro/gato como compañía; montar caballo.
7. **Pueblo vivo:** localizar un NPC en casa, trabajo y evento; tienda cerrada con horario visible; conversación, regalo, encargo y cambio de relación; guardar y volver.
8. **Pedidos y ramas:** aceptar pedido con plazo, reunir después de aceptar, entregar parcialmente, completar; dejar vencer otro; elegir entre dos ramas que abren contenidos diferentes y persistentes.
9. **Aventura:** preparar armadura/comida; luchar contra varios patrones; encontrar tesoro, donar pieza, recibir desbloqueo y abrir ruta; probar derrota y recuperación.
10. **Mundos:** activar portal, visitar Verdia/Senda/Nox/espacio con equipo apropiado, realizar actividad característica, traer material, usarlo en receta/pedido y regresar a la misma granja.
11. **Pesca:** lanzar/enganchar/luchar/capturar con dos patrones; intentar en hora/clima incorrectos; usar trampa y estanque; completar colección y pedido real.
12. **Jornada y festival:** dormir, ver resumen, recibir correo/receta, cambiar rutina/clima, participar en actividad festiva y volver sin repetir premio.

Los fixtures sirven para comprobar casos raros y regresiones. Deben etiquetarse como tales. Una partida preparada no demuestra que el contenido sea accesible o esté equilibrado desde el inicio.

## 7. Condición de entrega y registro de cierre

No declarar «motor completo», «igual a Stardew» ni «todo implementado» mientras exista una capacidad solicitada parcial o pendiente. Se puede informar de avances concretos, pero este plan no es el resultado final solicitado.

Al cerrar cada ID registrar: commit/build o revisión del archivo, escenario probado, entradas del jugador, resultado observado, evidencia visual si procede y regresión de guardado. Reconciliar los estados de esta auditoría con cambios posteriores; no marcar todos como implementados porque un módulo nuevo exporta funciones con esos nombres.

Separar tres comprobaciones: **funciona la regla**, **se puede usar desde la interfaz normal**, **tiene suficiente variedad y calidad visual para el objetivo recibido**. Las tres son necesarias. Un test de motor no demuestra sensación de combate, una captura no demuestra automatización y un catálogo grande no demuestra campaña completa.

Los nombres e historias de Celia, Aura, Lara, Verdia, Senda, Nox y el espacio se mantienen como material recibido o etiquetas provisionales. La tecnología debe admitir contenido narrativo posterior sin que esta auditoría invente canon, diálogos definitivos o relaciones no autorizadas.
