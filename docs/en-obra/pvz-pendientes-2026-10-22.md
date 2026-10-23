# La Semilla Madre · pendientes de motor, catálogo y producción

Actualizado el **23 de octubre de 2026**, después de que el jugador probara la base.
Auditoría inicial del código publicado en `568aa9a0`; las casillas cerradas tienen evidencia en el avance enlazado.
Seguimiento con casillas en [GitHub, issue #1](https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA/issues/1).

## Decisiones confirmadas y alcance

- Las zonas defendidas deben ser **partidas normales de PvZ tower defense**, con sus tableros, soles,
  siembra, recargas, zombis y oleadas. Se alterna entre ellas volviendo al mapa.
- **Un tipo completo de planta solo puede estar asignado a una zona.** Dentro de esa zona puede sembrarse
  según las reglas del tablero. No basta con limitar ejemplares ni permitir copias de ese tipo en otro frente.
- Los carriles dependen del escenario: por ejemplo, casa con cinco, carretera angosta con tres/cuatro y
  almacén gigante con seis/siete. Son mecánicas completas de PvZ en todos ellos; menos carriles no autoriza
  recortar habilidades. El número de carriles no queda limitado globalmente a cinco/seis.
- Los tableros siguen avanzando mientras se observa otra zona o el mapa. La pausa global los detiene.
- Llegar a zonas nuevas desbloquea plantas e introduce zombis nuevos de forma progresiva.
- Completar plantas y zombis de PvZ 1, PvZ 2 y PvZ Fusión: comportamiento real, arte y pruebas por unidad.
  Para Fusión la referencia solicitada es **la última versión publicada**; su número y catálogo deben verificarse.
- Las fusiones llegan al final de historia y están disponibles desde el comienzo en versus.
- La historia empieza únicamente con la casa y termina al purificar el 100%, con la huida del Dr. Zomboid.
- Conservar navegación mundo → país → ciudad → zona, pantalla despejada y controles redondos pequeños.
- Conservar PvZ base, patios clásicos, duelo y sus partidas. Fusión conserva su sección de minijuego independiente.
- La continuación de la idea se revisará con el jugador cuando estén completos los catálogos funcionales y dibujados.

**Fuera de esta lista:** nuevas tareas de granja, voces descartadas, escenas premium no realizadas,
contenido futuro descartado del sótano e instaladores. Las regresiones existentes siguen siendo necesarias
cuando se integre código. No reabrir ampliaciones por aparecer en documentos antiguos.

## Qué existe realmente

| Sistema | Estado comprobable en el código actual |
|---|---|
| PvZ base | Motor de 60 Hz, cuarenta niveles de día/noche/piscina/niebla; 32 plantas normales y Nuez explosiva de bolos. |
| Zombis registrados | 21 definiciones, incluidas variantes acuáticas con cono/cubo. No equivale a tener todo PvZ 1. |
| Carriles del motor PvZ | `tablero.filas` configura carriles físicos; comprobados 3/4/5/6/7/9, con activos y agua por datos. Anchos/accesos de B03 siguen pendientes. |
| Conquista | Prototipo distinto, de 30 Hz y tres carriles, con perfiles adaptados; no reutiliza todavía las partidas normales de PvZ. |
| Territorios | Historia de 12 áreas y versus de 36; mapas de tres países, ciudades y zonas. |
| Asignaciones | Hay grupos y formaciones por zona, pero el mismo tipo puede repetirse entre zonas. Falta el registro exclusivo global. |
| Progresión | No hay desbloqueo territorial progresivo completo del catálogo; sí existe el desbloqueo de las fusiones de muestra. |
| Fusiones | Cinco fichas precombinadas que reutilizan arte. No son un sistema completo de recetas ni el catálogo real de Fusión. |
| Presentación | Dieciocho recursos gráficos, portada, mapas, ropa y protecciones completas. No es el arte de todas las unidades futuras. |
| Guardado/red | El prototipo guarda historia y tiene salas con anfitrión autoritativo, pausas y recuperación de cortes. Falta adaptar contratos al motor nuevo. |
| Mundo final | Las 240 áreas del boceto no están construidas. La escala definitiva no debe confundirse con el prototipo de 12 áreas. |

[Avance del núcleo, 23 de octubre](pvz-instancias-2026-10-23.md): instantáneas restaurables del motor,
coordinador con seis partidas PvZ simultáneas y reservas canónicas, y controles Canvas para carriles variables.
El nuevo coordinador aún no sustituye el mapa ni la red V1. B03, C, E y la integración territorial siguen
abiertos; sus contratos básicos ya tienen implementación y pruebas. Se cierran J01, J02 y J10 con el alcance
del motor/coordinador descrito en ese avance: no equivalen a tener la migración o el guardado territorial de J04–J09.

Fuentes de esta auditoría: `juego/web/src/jardin/pvz/{datos,comportamiento,motor,arte}/` y
`juego/web/src/jardin/conquista/`. Las pruebas previas del prototipo son una referencia de regresión;
no certifican las funciones nuevas de esta lista.

## Orden de ejecución

| Prioridad | Resultado | Depende de |
|---|---|---|
| P0 | Contratos del motor, exclusividad y desbloqueos definidos sin ambigüedad. | A, B, C, D |
| P1 | Defensas PvZ normales integradas, varias zonas persistentes y conservación de partidas. | P0, E, J |
| P2 | Catálogo PvZ 1 completo y probado; inventarios verificables de PvZ 2/Fusión. | P0, F, G, H |
| P3 | Cada unidad de PvZ 2/Fusión funcional, dibujada e integrada a progresión y terrenos. | P1, P2, I |
| P4 | Campaña y versus completos sobre estos contratos, calidad de interfaz y validación final. | K, L, M, N |

La implementación de mecánicas y el arte pueden avanzar en trabajo independiente cuando sus contratos
estén fijados. La existencia de esta lista no autoriza agentes adicionales ni sobrescribir trabajo ajeno.
No introducir cambios adicionales de balance, costes o recompensas sin la aprobación vigente del jugador.

## A · Inventario y fuentes

- [ ] A01 Registrar el inventario canónico de todas las plantas y zombis de PvZ 1, con variantes separadas.
- [ ] A02 Verificar la versión internacional de PvZ 2 tomada como referencia, fecha y fuente del catálogo.
- [ ] A03 Verificar la última publicación real de PvZ Fusión en una fuente del autor y registrar versión/fecha/enlace.
- [ ] A04 Distinguir la publicación original de Fusión de traducciones, modificaciones y listas comunitarias.
- [ ] A05 Registrar todas las recetas y zombis de esa versión; no inventar recetas para rellenar huecos.
- [ ] A06 Crear un manifiesto por unidad: ID estable, nombre, edición/versión, familia, fuente, requisitos,
  comportamiento, parámetros, desbloqueo territorial, arte y pruebas.
- [ ] A07 Unificar identidades compartidas entre ediciones y registrar alias para evitar duplicados de catálogo.
- [ ] A08 Auditar los borradores anteriores antes de reutilizar datos. Una lista grande de nombres no acredita funciones ni dibujos.
- [ ] A09 Identificar unidades especiales, variantes, jefes y apariciones exclusivas; explicar qué cuenta como unidad distinta.
- [ ] A10 Generar automáticamente un informe de unidades pendientes de comportamiento, arte, integración o pruebas.

**Cierre de A:** se conoce el denominador real de cada catálogo y ninguna unidad aparece como terminada
solo por tener una ficha, una estadística genérica o una imagen prestada.

## B · Contrato del motor de defensa

- [ ] B01 Separar el estado estratégico del mundo y las instancias de partida PvZ de cada zona.
- [ ] B02 Reutilizar y ampliar el motor PvZ existente para las defensas, evitando un segundo combate simplificado con reglas incompatibles.
- [ ] B03 Parametrizar carriles por escenario, sin inferir siempre cinco/seis del tipo de área: carreteras
  de tres/cuatro, casas con cinco y almacenes de seis/siete o los que requiera el escenario. Registrar ancho,
  columnas, carriles activos, accesos y zonas de agua en la definición del tablero.
- [ ] B04 Mantener soles, recargas, cortacéspedes, plantas, zombis, proyectiles y oleadas propios de cada tablero,
  ajustando accesos y cortacéspedes a sus carriles reales.
- [ ] B05 Mantener daño, velocidades, habilidades y costes de las unidades conforme a sus fichas aprobadas.
- [ ] B06 Establecer cuándo empieza, termina y se repite una incursión; ganar una oleada no equivale a conquistar todo el mundo.
- [ ] B07 Definir qué conserva una zona entre ataques: formación, salud, soles, recargas, objetos y cortacéspedes.
- [ ] B08 Definir condiciones normales de victoria/derrota y su traducción a defensa, ocupación o pérdida del territorio.
- [ ] B09 Especificar cómo se conquista una zona ocupada sin convertir a las plantas en unidades que caminan ni sustituir la defensa solicitada.
- [ ] B10 Definir oleadas y eventos por datos, sin condiciones ocultas por nombres de nivel o coordenadas de la vista;
  seleccionar únicamente carriles y accesos válidos de cada escenario.
- [ ] B11 Definir retirada, reparación y reasignación sin reiniciar un combate para borrar daño o repetir recompensas.
- [ ] B12 Versionar los contratos nuevos y documentar diferencias respecto del prototipo publicado.

**Cierre de B:** las reglas de una defensa local se pueden ejecutar sin DOM y tienen el mismo resultado
con independencia del mapa abierto, la cámara y la velocidad del render.

## C · Plantas exclusivas por zona

- [ ] C01 Añadir un registro global de reserva por tipo canónico de planta, con zona propietaria o estado libre.
- [ ] C02 Hacer atómica la asignación: dos zonas, pestañas u órdenes de red no pueden adquirir el mismo tipo.
- [ ] C03 Consultar el registro al preparar un grupo, plantar, atacar, defender, fusionar y cargar una partida.
- [ ] C04 Mostrar dónde está asignado cada tipo desde el selector y permitir localizar esa zona en el mapa.
- [ ] C05 Definir traslado y liberación de tipos sin teletransportar plantas activas ni dejar copias en el tablero de origen.
- [ ] C06 Definir la reasignación durante combates y los límites que impiden retirar una defensa para duplicarla en otra.
- [ ] C07 Conservar la reserva aunque muera una planta individual; la reserva corresponde al tipo asignado.
- [ ] C08 Resolver qué sucede con las reservas al perder, abandonar o recuperar un territorio.
- [ ] C09 Hacer que las guarniciones automáticas y resistencias básicas de PvP respeten esta regla, sin crear copias gratuitas del catálogo del jugador.
- [ ] C10 Evitar duplicación mediante Imitadora, alias de otra edición, variantes cosméticas o importaciones.
- [ ] C11 Hacer compatibles los ingredientes y resultados de Fusión con las reservas exclusivas.
- [ ] C12 Guardar las reservas y restaurarlas junto con los tableros, de forma consistente y validada.
- [ ] C13 Revisar el abastecimiento de las otras zonas si Girasol queda reservado a una sola; no resolverlo duplicándolo en secreto.
- [ ] C14 Distinguir la exclusividad de plantas ya confirmada de las reglas de disponibilidad de zombis en PvP,
  que deben especificarse antes de imponerles una restricción equivalente.

**Cierre de C:** el mismo tipo no puede utilizarse simultáneamente en dos zonas, incluso con dos clientes,
dos órdenes recibidas juntas, una fusión o una carga de partida.

## D · Desbloqueos y aparición progresiva

- [ ] D01 Definir las plantas iniciales de la casa y una tabla de desbloqueos por primera llegada/captura de zona.
- [ ] D02 Especificar si cada desbloqueo se obtiene al descubrir, entrar o ganar la zona; aplicar un solo evento verificable.
- [ ] D03 Introducir los nuevos zombis por regiones, terreno y progreso, con presentación previa legible.
- [ ] D04 Evitar que las oleadas usen zombis todavía no introducidos en esa ruta o incompatibles con el terreno.
- [ ] D05 Verificar que las rutas alternativas no bloqueen una planta imprescindible para continuar.
- [ ] D06 Evitar exigir una planta cuyo tipo ya debe defender otro frente sin ofrecer una decisión viable al jugador.
- [ ] D07 Mantener desbloqueos obtenidos sin volver a entregarlos al perder y recuperar la misma zona.
- [ ] D08 Conectar los desbloqueos al selector, almanaque, guardado y catálogo real, sin conceder fichas pendientes de implementar.
- [ ] D09 Sustituir el umbral provisional de ocho áreas por el hito final de Fusión de la campaña definitiva.
- [ ] D10 Mantener acceso inicial a las fusiones terminadas en versus sin regalar progreso de historia.
- [ ] D11 Mostrar el primer encuentro con una unidad y el territorio que la habilita sin volver a llenar la pantalla de paneles.

## E · Varios frentes y director de incursiones

- [ ] E01 Ejecutar todos los tableros desde un reloj determinista coordinado, sin avanzar dos veces la zona visible.
- [ ] E02 Rotar entre defensas desde ciudad/país/mundo conservando exactamente el estado de cada partida.
- [ ] E03 Programar ataques solo en fronteras o rutas válidas y respetar descansos y territorios aislados.
- [ ] E04 Aumentar progresivamente la presión con el avance y probar cuántos frentes requieren intervención humana real.
- [ ] E05 Dar avisos y señales sobre el mapa para encontrar el frente peligroso sin restaurar barras de estadísticas.
- [ ] E06 Evitar que abrir mapas o selecciones pause únicamente al enemigo o conceda invulnerabilidad.
- [ ] E07 Definir preparación, oleadas, recuperación y ataques siguientes como estados explícitos de cada zona.
- [ ] E08 Mantener la pausa global y la pausa técnica de red; cerrar el juego no debe simular derrotas fuera de sesión.
- [ ] E09 Resolver capturas y defensas simultáneas sin depender del orden de las pestañas de vista.
- [ ] E10 Perfilar el coste de múltiples partidas y optimizar render/cachés sin eliminar la simulación de frentes ocultos.
- [ ] E11 Medir presión y duración con partidas completas; presentar cualquier ajuste adicional de balance antes de aplicarlo.

## F · Plantas y terrenos de PvZ 1

Las 32 plantas de día/noche/piscina/niebla ya tienen comportamiento en el **motor PvZ**. Sus perfiles
simplificados de Conquista no equivalen a conectar ese comportamiento. Nuez explosiva es una variante de bolos,
no una de las diecisiete plantas normales restantes.

- [ ] F01 Conectar y comprobar en las defensas territoriales las 32 plantas existentes con su comportamiento real.
- [ ] F02 Coltapulta / Cabbage-pult: parábola, daño y uso correcto en tejado.
- [ ] F03 Maceta / Flower Pot: capa de base y dependencia de las plantas que sostiene.
- [ ] F04 Lanzamaíz / Kernel-pult: maíz, mantequilla y estados del objetivo.
- [ ] F05 Grano de café / Coffee Bean: despertar hongos y capa temporal.
- [ ] F06 Ajo / Garlic: mordida, desvío de carril y comprobaciones de terreno.
- [ ] F07 Paraplanta / Umbrella Leaf: cobertura y defensas contra ataques correspondientes.
- [ ] F08 Margarita / Marigold: producción y recompensa sin duplicación de economía.
- [ ] F09 Melonpulta / Melon-pult: trayectoria, salpicadura y objetivos.
- [ ] F10 Guisantralladora / Gatling Pea: mejora, ráfaga y planta base requerida.
- [ ] F11 Birasol / Twin Sunflower: mejora y producción.
- [ ] F12 Gasoseta / Gloom-shroom: mejora, área y comportamiento nocturno.
- [ ] F13 Rabo de gato / Cattail: soporte acuático y selección de objetivos terrestres/aéreos.
- [ ] F14 Melonpulta congelada / Winter Melon: mejora, salpicadura y ralentización.
- [ ] F15 Magnetoseta dorada / Gold Magnet: mejora y recogida de objetos compatibles.
- [ ] F16 Pinchorroca / Spikerock: mejora y respuesta a vehículos.
- [ ] F17 Mazorcañón / Cob Cannon: ocupación doble, bases requeridas, apuntado y recarga.
- [ ] F18 Imitadora / Imitater: selección, transformación y restricciones de asignación por tipo.
- [ ] F19 Completar tejado inclinado y todas las dependencias necesarias de bases, proyectiles y protección.
- [ ] F20 Integrar las mejoras y los casos de abono que correspondan, sin afectar los cuarenta niveles existentes.
- [ ] F21 Verificar interacciones entre sueño/despertar, agua, hielo, niebla, capas y plantas mejoradas.
- [ ] F22 Dibujar las diecisiete plantas faltantes y sus estados; comprobar también el arte actual al incorporar capacidades nuevas.

Los nombres españoles finales se contrastarán con el inventario; se incluyen nombres ingleses para identificar
sin ambigüedad la unidad cuando hay diferencias regionales de traducción.

## G · Zombis, jefes y escenarios de PvZ 1

Las 21 definiciones existentes incluyen variantes acuáticas con cono/cubo. No debe calcularse el faltante
restando 21 a un número de entradas de almanaque que cuenta las variantes de otra forma.

- [ ] G01 Auditar los 21 registros actuales frente a las entradas canónicas y conservar sus comportamientos reales en Conquista.
- [ ] G02 Zombi Yeti: aparición, retirada y recompensa verificadas.
- [ ] G03 Zombi colgado / Bungee: llegada, selección de planta, robo y respuesta de Paraplanta.
- [ ] G04 Zombi escalador / Ladder: colocación de escalera, protección y retirada de metal.
- [ ] G05 Zombi catapulta / Catapult: vehículo, proyectiles, alcance y defensa correspondiente.
- [ ] G06 Zombistein / Gargantuar: resistencia, golpes, lanzamiento de acompañante y estados.
- [ ] G07 Zombidito / Imp: aparición independiente y lanzamiento desde Gargantuar.
- [ ] G08 Dr. Zomboid/Zomboss y su máquina: fases, ataques, objetivos y condición de derrota.
- [ ] G09 Añadir escaleras y objetos persistentes a terreno, guardado y render.
- [ ] G10 Verificar saltos, buceo, globos, excavación, vehículos, trineos e invocaciones sin degradarlos a una mordida genérica.
- [ ] G11 Completar arte de las unidades faltantes, vehículos, jefes y poses de acción.
- [ ] G12 Mantener cuerpo/ropa/conos/cubos/puertas como conjuntos coherentes al moverse y perder protección.
- [ ] G13 Verificar interacciones con cada defensa de PvZ 1 y la derrota normal por entrada a la casa.

## H · Todas las plantas y zombis de PvZ 2

- [ ] H01 Convertir el inventario verificado de A02 en tareas por unidad, incluyendo mundos, temporadas y plantas adicionales de esa edición.
- [ ] H02 Implementar cada habilidad real, con selección de objetivos, activación, recarga y condición de uso.
- [ ] H03 Implementar las respuestas de abono y estados especiales cuando correspondan.
- [ ] H04 Completar los terrenos y objetos necesarios: agua, huecos, tumbas, raíles, hielo y elementos específicos de los mundos incluidos.
- [ ] H05 Implementar familias de proyectiles, explosiones, cadenas, rebotes, daño continuo, empujes y control sin sustituir todas por un disparo genérico.
- [ ] H06 Implementar soportes, plantas de activación manual, áreas, transformaciones y dependencias entre unidades.
- [ ] H07 Completar enemigos con transporte, invocación, protecciones, inmunidades, ataques a distancia y objetivos especiales.
- [ ] H08 Completar los jefes y máquinas incluidos en el inventario, con sus fases propias.
- [ ] H09 Asignar descubrimiento de cada enemigo y desbloqueo de cada planta a territorios concretos.
- [ ] H10 Dibujar cada planta, zombi, objeto y estado necesario con la dirección artística aprobada.
- [ ] H11 Revisar traducciones, alias y duplicados entre PvZ 1 y PvZ 2 para que la exclusividad no tenga atajos.
- [ ] H12 Verificar que cada unidad funciona en una partida real y que su ficha describe lo que hace el motor.

**Cierre de H:** ninguna planta o zombi del manifiesto queda con motor genérico, imagen de otra unidad
o estado de prueba sin señalar; los casos de terreno y las habilidades se comprueban por unidad.

## I · Fusión real y su catálogo completo

- [ ] I01 Sustituir las cinco muestras por un registro contrastado con la última versión verificada de Fusión.
- [ ] I02 Implementar colocar un ingrediente sobre otro y resolver la receta válida sobre entidades reales del tablero.
- [ ] I03 Validar orden de ingredientes, compatibilidad de terreno, capas, ocupación y condiciones especiales de receta.
- [ ] I04 Consumir ingredientes y crear el resultado en una transacción, sin duplicaciones por doble toque o retransmisión.
- [ ] I05 Aplicar reservas por tipo, dependencias y reglas de exclusividad a ingredientes y resultados.
- [ ] I06 Definir qué vida, efectos, tiempos y posición conserva una fusión según la receta verificada.
- [ ] I07 Implementar todas las habilidades de los resultados y las fusiones sucesivas, no solo sumar estadísticas.
- [ ] I08 Completar todos los zombis fusionados del inventario y sus respuestas especiales.
- [ ] I09 Dibujar cada resultado e incorporar sus estados visuales; retirar las imágenes prestadas de las muestras.
- [ ] I10 Mostrar recetas descubiertas y requisitos desde el almanaque sin regalar acceso en historia.
- [ ] I11 Integrar desbloqueo tardío de historia y disponibilidad inicial en versus.
- [ ] I12 Completar la sección de minijuego Fusión independiente, preservando PvZ normal.
- [ ] I13 Probar recetas inválidas, ingredientes ausentes, fusiones simultáneas, muerte durante la fusión y carga posterior.
- [ ] I14 Registrar el número real de recetas terminadas respecto del manifiesto y actualizar la referencia si cambia la versión objetivo.

## J · Guardado, compatibilidad y recuperación

- [x] J01 Crear una instantánea restaurable del motor PvZ, distinta del estado reducido usado solo para dibujar.
- [x] J02 Guardar generador aleatorio, director, siguiente ID, relojes internos, apariciones pendientes y comportamiento de cada entidad.
- [ ] J03 Incluir terrenos, capas, cortacéspedes, soles, recargas y estados especiales de todos los tableros.
- [ ] J04 Guardar mundo, asignaciones exclusivas, desbloqueos, incursiones, recetas y objetivos de forma coherente.
- [ ] J05 Diseñar una migración de Conquista V1 que preserve el archivo original y resuelva explícitamente sus grupos repetidos.
- [ ] J06 No borrar, reiniciar ni recortar plantas de una partida antigua para hacerla encajar silenciosamente en la regla nueva.
- [ ] J07 Conservar las claves y progresos de PvZ base, patios clásicos, duelo y edición de amigos.
- [ ] J08 Versionar y validar archivos, rechazar datos desconocidos sin sobrescribirlos y mantener protección de escrituras entre pestañas.
- [ ] J09 Mantener recuperación tras cuota fallida, exportación y reintento; añadir importación validada si se habilita el respaldo restaurable.
- [x] J10 Comprobar carga en mitad de varias defensas y equivalencia exacta de los siguientes resultados.

## K · Campaña, territorios y economía

- [ ] K01 Convertir la estructura del mundo en datos de países, ciudades, zonas y rutas reales, sin depender de la cuadrícula de demostración.
- [ ] K02 Separar el mapa de prueba de la escala definitiva; el boceto de 240 áreas necesita contenido y validación propios.
- [ ] K03 Diseñar cada zona con terreno, defensa normal, catálogo local, enemigos, rutas y desbloqueos.
- [ ] K04 Hacer que perder/capturar/recuperar una zona actualice de forma coherente propiedad, defensa y disponibilidad de plantas.
- [ ] K05 Definir suministros y apoyos territoriales sin sustituir soles, recargas y reglas normales del tablero.
- [ ] K06 Evitar premios repetidos por perder y reconquistar la misma zona.
- [ ] K07 Conectar fortificación y reparación con el nuevo motor y documentar qué reparan realmente.
- [ ] K08 Conservar el inicio solo en casa, rutas alternativas y presión creciente sin bloqueos irrecuperables.
- [ ] K09 Hacer compatibles las resistencias básicas de PvP con formaciones editables y tipos exclusivos.
- [ ] K10 Mantener la victoria de historia al 100%, revisando contraataques y capturas simultáneas en el último frente.
- [ ] K11 Conectar el final del Dr. Zomboid con el estado de la campaña definitiva y conservar su huida en nave.
- [ ] K12 Presentar para aprobación cualquier cambio adicional necesario de dificultad, ingresos, costes, precios o recompensas.

## L · Mapas, interfaz, arte y sonido

- [ ] L01 Adaptar vista, escala, casillas y toques a tableros configurados por escenario, incluidos tres, cuatro,
  cinco, seis y siete carriles. Conservar proporciones y alineación al cambiar ancho, columnas o accesos.
- [ ] L02 Integrar recogida de soles, pala, activaciones y selección de objetivos conservando la pantalla despejada.
- [ ] L03 Mostrar asignación por zona, disponibilidad y desbloqueo en los sobres sin paneles permanentes de estadísticas.
- [ ] L04 Crear arte específico para cada país, ciudad y zona que lo necesite; las ilustraciones de país/ciudad actuales se reutilizan entre destinos.
- [ ] L05 Hacer que rutas, fronteras y marcadores correspondan con conexiones jugables y territorios reales.
- [ ] L06 Mostrar conquista, incursión y pérdida con cambios visuales y avisos legibles sobre los mapas.
- [ ] L07 Completar sprites, poses, ataques, estados, proyectiles e impactos del inventario; verificar siluetas en pantalla pequeña.
- [ ] L08 Conservar diversidad de ropa y protecciones unidas al cuerpo, incluidos los nuevos tipos compatibles.
- [ ] L09 Revisar inicio, sala, selectores, carga, pausa y final con el detalle ilustrado aprobado y controles redondos pequeños.
- [ ] L10 Actualizar las escenas animadas de espera con unidades y mapas terminados, sin usarlas como prueba de funcionalidad del catálogo.
- [ ] L11 Completar efectos sonoros necesarios y controles de sonido sin retomar la tarea descartada de voces nuevas.
- [ ] L12 Organizar atlas, carga por demanda y cachés para que todo el catálogo no impida entrar a una partida.
- [ ] L13 Inspeccionar capturas y transiciones en escritorio y móvil horizontal, y liberar recursos al salir.

## M · Versus y cooperativo por salas

- [ ] M01 Adaptar el protocolo al estado de múltiples partidas PvZ y versionar la compatibilidad entre clientes.
- [ ] M02 Mantener al anfitrión como autoridad sobre soles, daño, recetas, reservas exclusivas y resultados.
- [ ] M03 Validar órdenes por jugador, territorio, asignación, recursos, recarga y estado de partida.
- [ ] M04 Hacer que el jugador zombi elija y despliegue las unidades disponibles según las reglas definidas para la zona.
- [ ] M05 Conservar estrategias de expansión por varias rutas o concentración hacia el fuerte rival.
- [ ] M06 Mantener la resistencia base al capturar, sin violar exclusividad ni conceder plantas que no corresponden.
- [ ] M07 Sincronizar todos los frentes y dibujar con fluidez el que observe cada jugador, incluso si miran zonas distintas.
- [ ] M08 Mantener órdenes idempotentes, reconexión, pausa técnica y cierre sin victorias inventadas.
- [ ] M09 Resolver destrucción simultánea de bases y decisiones de varios frentes en un mismo paso.
- [ ] M10 Conservar dos personas en un dispositivo y revisar controles independientes por bando.
- [ ] M11 Comprobar salas reales y simuladas con pérdida, demora, desconexión y clientes de versiones distintas.

## N · Pruebas y criterio para declarar terminado el motor

- [ ] N01 Una prueba funcional significativa por cada planta, zombi, habilidad especial y receta del manifiesto.
- [ ] N02 Pruebas de interacciones: hielo/fuego, armaduras, vuelo, capas, agua, sueño, transportes, inmunidades y jefes,
  incluyendo ataques a carriles vecinos y límites del tablero en escenarios de tres/cuatro/cinco/seis/siete carriles.
- [ ] N03 Probar exclusividad frente a doble toque, alias, Imitadora, fusiones, pérdida de zona, dos pestañas y dos clientes.
- [ ] N04 Recorrer desbloqueos de principio a fin, rutas alternativas y llegada progresiva de enemigos sin conceder progreso artificial.
- [ ] N05 Completar defensas normales cambiando físicamente de zona mediante los mapas.
- [ ] N06 Demostrar que todos los tableros siguen avanzando y conservan resultados independientemente del frente visible.
- [ ] N07 Guardar/cargar en mitad de varias batallas y comprobar continuación determinista, cuota fallida y archivos antiguos/futuros.
- [ ] N08 Completar historia desde casa hasta el 100% con reservas exclusivas y sin duplicaciones ni recursos de prueba.
- [ ] N09 Completar partidas versus con victoria de cada bando y empate, incluyendo frentes simultáneos.
- [ ] N10 Inspeccionar visualmente todo el catálogo y sus estados; un manifiesto sin recurso o un sprite prestado no pasa por terminado.
- [ ] N11 Medir fluidez, memoria y carga con el catálogo final y varios frentes; distinguir resultados de navegador de pruebas físicas.
- [ ] N12 Mantener regresiones de PvZ base, patios, duelo y otros motores compartidos afectados.
- [ ] N13 Ejecutar las comprobaciones del repositorio, builds normal/amigos y filtro de contenido privado; granja solo como regresión existente.
- [ ] N14 Actualizar documentación, lista de GitHub y copia jugable después de cada avance comprobado; publicar en las dos ramas autorizadas.
- [ ] N15 Entregar una base con todo el inventario objetivo funcional y dibujado antes de dar por cerrado este encargo y retomar nuevas ideas.

## Cómo mantener este listado

Los identificadores A01…N15 son estables. Marcar una casilla solo cuando el código, arte, integración y
pruebas que exige estén disponibles, y enlazar el commit o evidencia correspondiente. Dividir en subtareas
por unidad a partir de los manifiestos; no inventar porcentajes mientras se desconozca el catálogo de referencia.

Esta actualización es una auditoría y planificación: **no cambia el motor publicado, no activa exclusividad,
no introduce desbloqueos nuevos y no completa los catálogos por el solo hecho de documentarlos**.
