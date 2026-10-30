# Pedidos de Javier · estado vigente


**Hecho por Claude (29–30 de octubre) · catálogo completo, Fusión y campaña de 240 áreas:** catálogo nativo de 185 plantas,
2 derivadas de PvZ 1, 235 zombis y 117 fusiones (recetas nativas de evolución); campaña de 12 países × 4 ciudades × 5
áreas con mundos nativos, guardado v6 que migra el v5, y Almanaque. PvZ 1 jugable en su minijuego con datos remotos
(paquete anterior a GOTY adaptado; Zombatar y logros quedan incompletos). Pruebas finales hechas y fallos corregidos;
el balance de las 228 áreas nuevas sigue sin comprobar en partidas largas. Ver `en-obra/pvz-campana-240-2026-10-29.md`.

**Hecho por Claude el 28 de octubre · Versus con Gardendless:** **Versus** del menú del Jardín abre ahora un duelo de
dos personas sobre el motor de la historia: una siembra en el tablero nativo y la otra suelta zombis pagando
cerebros, en un dispositivo o por sala con código. Ganan las plantas si resisten 5 minutos; los zombis, si uno entra
a la casa. Javier dejó cerebros, costes, recargas y duración a criterio de Claude (29 de octubre). El versus de
36 territorios sigue en Minijuegos → Versus clásico. Ver `en-obra/pvz-versus-nativo.md`.

**Hecho por Claude el 26 de octubre · sonido:** el patio tiene música CC0 variada (10 pistas) y efectos propios;
Carreras tiene música propia y una **rocola** con todas las canciones de la app; siete canciones de amor nuevas
(letras inventadas con apodos y palabras del chat); el Show de Nosotros tiene canciones de verdad y el perro
«habla» con ladridos. Se gastó el saldo de ElevenLabs (quedan 606 créditos). Ver `sistemas/musica.md`.
**Hecho por Claude el 26 de octubre · casa y Jardín:** la sala de la casa tiene botón **Rocola** con toda la música
de la app (la misma lista de Carreras; lo que se ponga sigue sonando por la casa y «Apagar la rocola» devuelve la
música del cuarto). En la historia de Gardendless (`modo=historia`), con pedido expreso de Javier sobre el balance:
una zona propia sin vecinas zombis queda **despejada 🛡️** y ya no la atacan; cada defensa ganada en una zona de
frontera suma un **asedio ⚔️** y el tiempo también la endurece (+1 cada 3 min, tope 6). El refuerzo agrega hasta
~70 % más zombis y algunos con cono/cubeta, sin pasar los límites del motor (40 por oleada). Conquistar o perder
la zona reinicia sus asedios. Guardado v5 con migración desde v3/v4. Menú del Jardín limpio (Historia, Minijuegos,
Versus), textos sin jerga técnica, arte del Jardín en WebP (menú 47 → 9 MB) y motores que ya no se descargan dos
veces (historia 147 → 117 MB, 104 de ellos son los recursos de Gardendless, que quedan en caché). Ver `sistemas/jardin.md`.

**Hecho por Claude el 26 de octubre · mundo 5 del Jardín:** siguiendo el orden de pendientes (P2, completar PvZ 1),
la aventura llega a 50 niveles con el tejado: Coltapulta, Maceta, Lanzamaíz, Grano de café, Ajo, Paraplanta,
Margarita y Melonpulta; zombi colgado, zombi escalera, catapulta, gargantúa, diablillo y Dr. Zomboid; lluvia de
colgados (5-5) y jefe final (5-10), con valores originales de PC. Plantas con arte original (siete de Gardendless/PvZ2 y el Grano de café de
PvZ 1, pedido de Javier) escenarios originales de PvZ 1 de día y de noche, y zombis del tejado con sus animaciones originales de PvZ 1. El piloto automático gana
los ocho niveles normales al menos una vez pero no 5-5 ni 5-10. Ver `en-obra/pvz-tejado-2026-10-26.md`.

## Pedido vigente · ampliar la historia al mapa existente

El 24 de octubre Javier autorizó extender Gardendless a las doce zonas del mapa. Esto sustituye la pausa
anterior para ese recorrido; la campaña futura de 240 áreas sigue pendiente. Conservar la presentación y
balance nativos, reservas exclusivas por tipo, defensas persistentes, mapas y guardados existentes.
Aprobó Pirata espadachín, Cabezaladrillo, Breakdancer y Flor de hielo como sustituciones nativas concretas.
Ver [ampliación y límites](en-obra/pvz-mapa-nativo-2026-10-24.md). No anunciar una campaña ganada por pasar casos
preparados ni una instantánea a mitad de combate. No cambiar balance adicional sin aprobación.

## Pedido vigente · precarga y controles de Gardendless

Javier pidió conservar por ahora el arte, las animaciones, sonidos y reglas nativos de Gardendless.
La adaptación del arte propio y del banco ElevenLabs a este motor queda pausada; V2/aventura conservan lo integrado.
Preparar en paralelo los campos del sector mientras se muestran Dave y el mapa, conservar sus motores entre
ataques y al cambiar de zona, y evitar pantallas de carga al entrar a un campo preparado. La descarga inicial
sigue dependiendo de red/caché; no prometer que un dispositivo sin recursos pueda cargarlos instantáneamente.
Permitir arrastrar/soltar y seleccionar/colocar con dos clics o toques, usando costes, recargas y casillas nativos.
La ampliación posterior de las doce zonas se rige por el pedido vigente de arriba. No cambiar balance adicional.


Actualizado el 23 de octubre de 2026. Esta lista sustituye las prioridades contradictorias del
[historial archivado](archivo/pedidos-hasta-2026-10-15.md).

## Motores completos como minijuegos

Pedido posterior: incorporar PvZ-Portable como minijuego PvZ 1 y Gardendless como PvZ 2, con sus propios
combates, habilidades y animaciones. Adaptar el motor más adecuado a la historia territorial.
Ver [integración, versión y pendientes concretos](en-obra/pvz-motores-originales-2026-10-23.md).
Javier confirmó después que no tiene los archivos GOTY. La historia no debe depender de que los aporte:
La entrada **Historia** conecta ahora Gardendless con las doce zonas existentes, empezando por La casa. Javier
aprobó su balance original. Las reservas de tipos son exclusivas y los frentes vivos avanzan simultáneamente;
el guardado conserva puntos entre combates. Una interrupción exige repetir los ataques pendientes desde su
inicio, con aviso explícito. Ver [conexión nativa y límites](en-obra/pvz-historia-nativa.md). El tutorial aislado
sigue en `modo=prueba-frente`; V2 se conserva en **Minijuegos → Historia anterior · V2**. No se migra V2; los puntos nativos V3 sí se amplían a las doce zonas conservando sus defensas.
El minijuego PvZ 1 sigue encargado, pendiente de una solución de recursos compatible sin exigirlos
al usuario. Se conservan historia V2, aventura de 40 niveles, patios y partidas previas; la ampliación autorizada comprende el mapa de doce áreas.

## Base conservada · primer escenario y controles

Antes de la ampliación del 24 de octubre, Javier pausó nuevos mundos para cerrar el inicio, la interacción y la animación.
Ver [primer escenario y controles](en-obra/pvz-principios-2026-10-23.md) y
[fuentes de motores aportadas](en-obra/pvz-referencias-motores-2026-10-23.md).
Aprobó que las partidas nuevas defiendan primero La casa, conserven sus plantas y habiliten después
expediciones y contraataques. Conservar los V2 anteriores sin imponer ese prólogo ni cambiar sus reglas.
El primer sector nativo usa el balance original de Gardendless aprobado expresamente por Javier. Croquis sobre lugares dibujados, pala/semilla en mano y selección hacia una baraja.
El zombi base tiene un esqueleto de piezas propias para revisar; el resto del catálogo gráfico sigue pendiente.
El pedido del 24 de octubre autoriza ampliar el mapa existente con la presentación nativa.

## Prioridad nueva · producción de audio por Claude y presentación por Codex

[Guía ejecutable de ElevenLabs para Claude](en-obra/pvz-elevenlabs-guia-claude.md): 107 familias y 253
archivos previstos, prompts, guion de Dave, rutas, producción con control de saldo y validación. Javier
confirmó que Claude dispone de la clave y pidió dejarle esta parte preparada. **Hecho por Claude el 23 de octubre:
los 253 audios están producidos y publicados con su índice** ([entrega](en-obra/pvz-audio-entrega-2026-10-23.md));
**Reproducción integrada por Codex** en historia V2 y aventura; la primera conexión nativa conserva por ahora el audio de Gardendless; ver
[detalle de integración y presentación](en-obra/pvz-presentacion-audio-2026-10-23.md).
Efectos, música original y balbuceos no verbales están autorizados con el saldo existente; las voces
clonadas y los diálogos hablados del encargo antiguo siguen descartados. La anterior restricción de
usar solo síntesis en el Jardín queda sustituida por este pedido.

Implementados para los recursos actuales: regiones verdes/moradas y sus fronteras, animación de piernas/mano en ropa base y pérdida de partes,
protecciones que muestran daño, balanceo de plantas, proyectiles y estelas, cuadrícula natural alineada
con fondos de calidad y detalles ambientales vivos. El tutorial ilustrado de once pasos explica invasión, siembra, soles, reservas,
mapas, frentes simultáneos y objetivo. Las poses completas de unidades especiales, terrenos propios de cada región y el catálogo futuro siguen pendientes. No cambiar dificultad ni tocar la granja congelada.

## Prioridad actual · motor completo y catálogo tras probar Conquista

Javier pidió defensas con mecánicas completas de PvZ y carriles configurados por escenario: carretera angosta
con tres/cuatro, casa con cinco, almacén grande con seis/siete o los que necesite el mapa. Se rota entre zonas
desde los mapas mientras los tableros continúan. **Cada tipo completo de planta solo puede estar reservado a
una zona**, no un límite de ejemplares. Plantas y nuevos zombis se introducen al avanzar por territorios.

Se reanuda el catálogo y su arte: todas las plantas y zombis de PvZ 1, PvZ 2 y la última versión publicada de
Fusión, cuyo inventario y recetas requieren verificación. Se retoman nuevas ideas después de tenerlos
funcionales y dibujados. Las fusiones siguen siendo tardías en historia y accesibles desde el inicio en versus.

**Seguimiento:** [180 tareas en 14 grupos, con casillas de avance](en-obra/pvz-pendientes-2026-10-22.md) ·
[Issue #1 en GitHub](https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA/issues/1). No marcar completado por crear fichas o reciclar arte.

[Historia V2 conservada](en-obra/pvz-historia-integrada.md): usa partidas PvZ normales
por zona, carriles de tres a siete, reservas exclusivas, desbloqueos de las 32 plantas construidas y guardado
V2 completo con respaldo y protección de pestañas. Los doce escenarios se recorrieron con piloto legal
**sin incursiones estratégicas como fixture**; el balance normal con varios frentes sigue por validar.
[Reservas y presión](en-obra/pvz-reservas-y-presion-2026-10-23.md): localizar cada tipo en ciudad/país/mundo
conserva el equipo pendiente y los combates activos. Trece defensas normales repetidas conservaron la casa;
dos intentos prolongados de expansión con piloto terminaron en derrota, sin cambiar dificultad ni economía.

La historia/versus del prototipo se conserva en `modo=prototipo` con sus claves. Faltan adaptar las salas al
motor nuevo y diseñar la conversión explícita de V1; no se han recortado sus equipos repetidos. El catálogo,
recetas reales, arte futuro y campaña definitiva continúan pendientes. [Dirección del mundo](en-obra/pvz-conquista-propuesta-2026-10-22.md).

Se conservan historia desde casa hasta el 100% con huida del Dr. Zomboid, mapas mundo → país → ciudad → zona,
interfaz despejada, controles redondos y minijuegos existentes con sus partidas. La cifra de 240 áreas sigue
siendo el boceto del mundo final, no contenido construido ni una certificación de la escala definitiva.

## Apoyo activo al Jardín · 19 de octubre

Javier confirmó inicialmente que trabajan Claude y Codex. Codex desarrolló motor,
mecánicas, niveles y pruebas conforme al [plan de La Semilla Madre](en-obra/jardin-plan-2026-10-17.md).
La base de los mundos de día, noche, piscina y niebla incluye cuarenta niveles, abono del día y contrato de progreso/guardado.
El pedido gráfico del 22 de octubre encarga a Codex la integración visual con el estilo ilustrado aprobado,
incluida variedad de ropa para zombis. La aventura conecta esos cuarenta niveles y su guardado.
[Base del motor](en-obra/pvz-motor-2026-10-19.md) · [Abono y guardado](en-obra/pvz-abono-guardado-2026-10-19.md) ·
[Mundo nocturno](en-obra/pvz-noche-2026-10-20.md) · [Piscina](en-obra/pvz-piscina-2026-10-20.md) ·
[Niebla](en-obra/pvz-niebla-2026-10-22.md).
No integrar el borrador anterior del catálogo sobre el motor clásico. Granja congelada; voces descartadas.

## Encargo activo · Plantas contra Zombis en el Jardín

Javier revisó el primer plan y decidió:

- mismos nombres, diseño adaptado, interfaz y jugabilidad de Plants vs. Zombies, como una mezcla de PvZ 1 y 2;
- una historia propia de apocalipsis zombi, sin el lore de Astra;
- se pueden cambiar escenarios y algunas plantas;
- libertad total de diseño.

Por eso los valores de PvZ (costos, recargas, vidas, precios de la tienda) cuentan como aprobados.

[Plan vigente: «La Semilla Madre»](en-obra/jardin-plan-2026-10-17.md) · [arquitectura](en-obra/pvz-arquitectura.md).

- El plan contempla 88 niveles en 10 mundos, más el modo Fusión aparte, minijuegos, rompecabezas y supervivencia.
- Se conservan los 12 patios (como «Patios clásicos») y el duelo para dos.
- El pedido gráfico del 22 de octubre aprobó ilustraciones generadas propias; la escena usa Canvas y audio original de ElevenLabs, con síntesis de respaldo.

**Estado:** motor, datos de cuarenta niveles de los mundos 1–4, abono del día y guardado implementados.
La aventura Canvas, selección, almanaque, cuatro fondos, 32 plantas, 21 zombis y ocho vestuarios están
integrados. [Entrega visual y límites](en-obra/pvz-arte-2026-10-22.md). Los mundos 5–10 y demás modos siguen pendientes.

## Encargo activo · ampliación de juegos y patio

- Completado El Escudo: seis mapas añadidos con recorridos propios; doce en total y balance existente conservado.
- Completado Desaparecidos: cuatro casos añadidos con historial cotidiano e investigación manual; doce en total.
- Completados los 16 juegos mentales, práctica libre, reto diario y clasificación probada con PostgreSQL temporal.
- Completado Jardín de los Desvelados: doce patios con ocho plantas y cinco zombis originales.
- Completadas las pruebas, integración y documentación. Publicación en ambas ramas autorizadas al cerrar el avance.

**Completado el pedido adicional:** gráficos reales del Jardín y modo para dos: uno ataca con zombis y otro defiende
con plantas, con salas por código, opción en una pantalla y revancha intercambiando bandos. Conserva la campaña
y sus estadísticas. [Implementación y comprobaciones, incluida una sala real](en-obra/jardin-dos-jugadores-2026-10-16.md).

**Pendiente anterior:** habilitar en Supabase la clasificación compartida del patio. El plugin aparece instalado,
pero este chat aún no dispone de sus herramientas; no certificar ese despliegue ni pedirle escribir SQL.
La granja continúa pausada; las voces nuevas siguen descartadas.

[Contenido y verificaciones](en-obra/ampliacion-patio-2026-10-16.md). La clasificación pasa las pruebas en PostgreSQL
temporal; activarla en el proyecto real está autorizado y lo hará el agente cuando se conecte la cuenta de Supabase.
Javier pidió no ejecutar SQL por su cuenta. Esta excepción solo comprende `supabase/patio-clasificacion.sql`.

## Encargo completado · mejoras y limpieza

1. Torneo: poses de pelea propias producidas en Blender y predicción del personaje invitado, conservando reglas y autoridad del anfitrión.
2. Carreras: arte específico para el icono y salas para Globos, Monedas, Anillos y Trucos.
3. Revisar, ordenar y limpiar el repositorio; actualizar README, CLAUDE.md, AGENTS.md y documentación contradictoria.
4. Probar los cambios y publicar en ambas ramas autorizadas, sin retomar los descartes anteriores.

Los cuatro puntos están terminados. [Implementación y comprobaciones](en-obra/mejoras-y-limpieza-2026-10-16.md).
No quedan tareas activas de este encargo. Los puntos siguientes registran decisiones, no una cola de trabajo.

**Voces nuevas descartadas por Javier en este mismo encargo.** Conservar las grabaciones existentes.
La granja permanece pausada. Dificultad, balance, precios, costes y recompensas conservan la aprobación previa.
Las pruebas que necesitan las mejoras actuales sí están autorizadas; no reabrir por ello toda la auditoría cerrada.

## Revisión anterior terminada

Campaña de 100 días de Súper, 100 puertas con narrativa, progresión de los cuatro mapas normales de Lavado,
salas de los seis juegos de mesa, Casa con dos perfiles y revisión de Cocina, Sangre, Escudo, Torneo y Retrete.
Se corrigieron los guardados de Súper/Puertas y el resultado remoto del Torneo. La evidencia y sus límites están
[registrados](en-obra/verificacion-general-2026-10-15.md); no confundir escenarios preparados con progresión ordinaria.
El [historial](archivo/pedidos-hasta-2026-10-15.md) conserva la cola antigua sin reactivarla.

## Publicación vigente

La última compilación de instaladores registrada es **apk-223** (17 de octubre), desde `9f9630b8`, al
correr Javier el workflow a mano. No incluye avances posteriores. Actions sigue sin dispararse solo en cada push.

## Pausado y descartado

- Granja: **congelada por decisión de Javier (17 de octubre)**; no se seguirá avanzando (historia, arte, balance, guía de misiones ni rendimiento). Solo se conservan su regresión e integración existentes.
- Voces nuevas: descartadas expresamente en este encargo. Conservar las grabaciones anteriores.
- Escenas premium no realizadas y su tienda: descartadas. Conservar catálogo, IDs y propiedad ya implementados.
- Contenido futuro del sótano: descartado. Se conservan el sótano de Clue y Desaparecidos de Astra.
- Generación/seguimiento de instaladores y reactivación de Actions: descartados como continuación de esta revisión.
- Aplicación/confirmación del SQL antiguo de la casa, su revisión de Supabase real y pruebas con teléfonos físicos: descartadas.
  La clasificación nueva del patio sí está autorizada por el encargo activo.
- Ampliación general de recorridos parciales, todas las clases, modos y combinaciones de la auditoría anterior: descartada.

Los checks de futuros cambios autorizados sí son necesarios. No retomar el resto salvo un nuevo pedido de Javier. Conservar
scripts, SQL, workflows y evidencia; descartar una tarea no acredita haberla ejecutado.

## Reglas que permanecen

- Proponer dificultad, balance, precios, costes o recompensas y esperar aprobación antes de modificarlos.
- Conservar claves, partidas, compras y recursos implementados.
- Publicar avances probados en `work` y `claude/supermarket-mania-minigame-xn2it8`, sin push forzado ni PR no pedido.
- No retomar tareas por aparecer en propuestas históricas. No certificar todas las modalidades o teléfonos por una simulación.

Las mejoras de Sangre (1,5 s de aturdimiento + 1 s de resistencia y sigilos sobre vida máxima), los aretes de
Lavado y su movimiento remoto se conservan como ya aprobados e implementados. Berserk no forma parte de este encargo.
