# Pedidos de Javier · estado vigente

Actualizado el 22 de octubre de 2026. Esta lista sustituye las prioridades contradictorias del
[historial archivado](archivo/pedidos-hasta-2026-10-15.md).

## Prioridad actual · motor completo y catálogo tras probar Conquista

Javier pidió defensas con mecánicas completas de PvZ y carriles configurados por escenario: carretera angosta
con tres/cuatro, casa con cinco, almacén grande con seis/siete o los que necesite el mapa. Se rota entre zonas
desde los mapas mientras los tableros continúan. **Cada tipo completo de planta solo puede estar reservado a
una zona**, no un límite de ejemplares. Plantas y nuevos zombis se introducen al avanzar por territorios.

Se reanuda el catálogo y su arte: todas las plantas y zombis de PvZ 1, PvZ 2 y la última versión publicada de
Fusión, cuyo inventario y recetas requieren verificación. Se retoman nuevas ideas después de tenerlos
funcionales y dibujados. Las fusiones siguen siendo tardías en historia y accesibles desde el inicio en versus.

**Seguimiento:** [180 tareas pendientes en 14 grupos](en-obra/pvz-pendientes-2026-10-22.md) ·
[Issue #1 en GitHub](https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA/issues/1). No marcar completado por crear fichas o reciclar arte.

Estado de partida: [base publicada](en-obra/pvz-conquista-base-2026-10-22.md), doce áreas de historia y 36 en
versus, 32 plantas normales, 21 definiciones de zombis y cinco fusiones de muestra. Su combate de tres carriles
es simplificado y todavía no cumple el nuevo requisito; tampoco existe exclusividad global de tipos ni
progresión territorial completa del catálogo. [Dirección del mundo](en-obra/pvz-conquista-propuesta-2026-10-22.md).

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
- El pedido gráfico del 22 de octubre aprobó ilustraciones generadas propias; la escena usa Canvas y sonido sintetizado.

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
