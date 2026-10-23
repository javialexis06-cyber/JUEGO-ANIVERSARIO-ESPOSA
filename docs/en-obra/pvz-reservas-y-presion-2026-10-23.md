# La Semilla Madre · localizar reservas y comprobar contraataques

Avance del **23 de octubre de 2026** sobre la [historia PvZ integrada](pvz-historia-integrada.md).
No añade unidades, gráficos, costes, estadísticas ni ajustes de dificultad.

## Reservas en el mapa

La procedencia de cada sobre reservado es un botón independiente. Abre el mapa ilustrado de su ciudad,
resalta la zona y permite subir al país o al mundo y volver a centrar la reserva. También funciona si
la planta está ocupada en un combate y su sobre de selección está deshabilitado.

La consulta no explora territorios ni desbloquea semillas. Volver al equipo o pulsar Escape conserva
los tipos elegidos y la revisión de la reserva. Las oleadas y los demás frentes continúan. Si se inicia
un ataque durante la selección, el editor actualiza la disponibilidad y la confirmación vuelve a
validar el traslado: no retira plantas de una defensa activa. El diálogo impide accionar con el teclado
los controles del mapa que quedan detrás. La etiqueta de procedencia deja visible el precio del sobre.

Se comprobó en 1280×720 y 844×390, con toques, ciudad → país → mundo, regreso al borrador y una incursión
que empieza mientras se prepara el equipo. El recorrido completo de interfaz pasó trece comprobaciones,
incluidas las once de historia, guardado, importación, pestañas y perfiles anteriores.

## Pruebas normales y sus límites

El piloto antiguo podía llevarse las plantas de una frontera en descanso para conquistar otra zona.
El piloto de diagnóstico ahora conserva esos tipos, aprovecha los de zonas interiores y utiliza
equipos diurnos que pueden carecer de Lanzaguisantes. Solo envía controles legales; no entrega soles,
salud, semillas, pausas ni victorias. No cambia el motor que usa el jugador.

La regresión del motor añade un asedio normal de **1.600 segundos virtuales**: la casa ganó trece defensas
y comenzó catorce. Se verifican plantas y salud, recursos, recargas, cortacéspedes y relojes antes y
después de rearmar las oleadas, además de restauraciones exactas tras cada victoria. Otra prueba de
600 segundos con las semillas 23 y 41 mantiene defensas y expediciones concurrentes sin quitar tipos
fronterizos. La primera recuperó ambas salidas iniciales; la segunda perdió su primera expedición
nocturna y sí recuperó la estación. No se exige una victoria ficticia a ese intento fallido.

El diagnóstico prolongado produjo estos resultados con los contraataques habilitados:

| Semilla | Duración virtual | Máximo de frentes activos | Zonas recuperadas alguna vez | Resultado |
|---|---:|---:|---|---|
| 23 | 856,80 s | 3 | Casa, Paseo del farol, Estación vieja, Casas del roble | Derrota |
| 41 | 5.654,73 s | 3 | Casa, Estación vieja, Paseo del farol, Casas del roble | Derrota |

Se validaron 29 y 189 instantáneas, respectivamente. Los registros incluyen combates, avisos,
siembras y recogidas, sin transformar las derrotas en pruebas aprobadas de balance.
**No hay todavía un recorrido victorioso de la campaña normal ni una validación de la carga humana.**
Estos dos pilotos tampoco prueban que la campaña sea imposible. No se ha aplicado ningún ajuste
de presión, economía, recursos iniciales o recompensas; esos cambios requieren la aprobación vigente.

El recorrido de doce escenarios sin incursiones sigue siendo un fixture separado para verificar
combates e integración. Su victoria no se presenta como prueba de la dificultad normal.

## Revisión de la conversión V1

El archivo V1 permanece intacto y sigue jugable. Aunque ambas historias tienen doce coordenadas,
sus estados no son equivalentes: reservas globales frente a soles locales; integridad y puestos de
tres carriles frente a plantas con salud y capas; tipos repetidos frente a reservas exclusivas; frentes
de 30 Hz frente a tableros completos de 60 Hz. Tampoco son equivalentes las cinco fusiones de muestra
y un catálogo real de recetas.

La conversión sigue pendiente. Antes de habilitarla necesita un resumen revisable de las propiedades
transferibles, conflictos por tipo, formaciones, combates y recursos sin equivalencia. Debe conservar
el original y su respaldo y resolver cada conflicto de forma explícita. No se ha creado un conversor
que descarte equipos ni cambie monedas, curación o dificultad sin una regla aprobada.

## Reproducción

Desde `juego/web/`:

```sh
node scripts/probar-conquista-historia.mjs
npm run diagnosticar:conquista
CHROME_PATH=/usr/bin/chromium node scripts/probar-conquista-historia-interfaz.mjs http://127.0.0.1:4196/
```

La interfaz necesita Vite sin HMR. El diagnóstico escribe resultados tanto de victorias como de
derrotas; no es una certificación de balance ni un test que deba fingir una campaña ganada.
Evidencia local excluida de Git en `test-results/conquista/{historia-motor,historia-interfaz,presion-normal}/`.
No se certifican teléfonos físicos, el PvP nuevo ni los catálogos todavía pendientes.
