# La Semilla Madre · estado y pendientes reales del jardín

Revisado el **31 de octubre de 2026**. Sustituye la lista de 180 tareas del 22 de octubre, escrita antes de pasar
la historia a Gardendless; se conserva sin cambios en el
[archivo](../archivo/pvz-pendientes-2026-10-22-original.md). La granja queda fuera: está pausada.

## Qué está terminado

| Parte | Estado | Evidencia |
|---|---|---|
| Historia nativa (Gardendless) | La casa, campaña de 240 áreas en 12 países, hasta 6 combates a la vez, reservas por tipo, puntos de descanso, final del Dr. Zomboid. | [Campaña de 240 áreas](pvz-campana-240-2026-10-29.md) |
| Catálogo PvZ 1 y PvZ 2 | 185 plantas, 235 zombis y 47 escenarios nativos, más Totora y Lanzamazorcas derivadas. Almanaque. | [Catálogo nativo](pvz-campana-240-2026-10-29.md#catálogo-nativo-pvz-1-y-pvz-2) |
| Fusión | 117 recetas de PvZ Fusión 4.0.x con piezas nativas: en la historia (Forjaria) y todas desde el inicio en el Versus. | [Fusión](pvz-campana-240-2026-10-29.md#fusión) |
| Tienda, cupo y tutorial | Plantas compradas con monedas de capturas y asedios, cupo de 4 a 8 semillas, Dave explica cada mecánica. | [Economía y tutorial](pvz-campana-economia-2026-10-30.md) |
| Balance | Corrida de las 239 áreas y asedios de muestra con un piloto en Gardendless real (148 victorias, 27 de 33 asedios). | [Resultados](pvz-campana-economia-2026-10-30.md#resultados-31-de-octubre-de-2026) |
| Versus de dos personas | En un dispositivo y por sala con código, catálogo completo y fusiones. | [Versus nativo](pvz-versus-nativo.md) |
| Minijuegos | Jardín clásico 1 (PvZ-Portable) y 2 (Gardendless), aventura propia de 50 niveles, patios y duelo, primera campaña V2 y versus clásico conservados. | [Motores originales](pvz-motores-originales-2026-10-23.md), [tejado](pvz-tejado-2026-10-26.md) |
| Guardado | Historia v7 validada, protección entre pestañas, migraciones sin regalar recursos. Cerrar en plena batalla repite ese ataque (decisión aceptada). | [Mapa nativo](pvz-mapa-nativo-2026-10-24.md) |

## Pendientes reales

Se pueden hacer sin nuevas decisiones:

1. **Fusión como minijuego propio.** El pedido del 17 de octubre pedía un modo Fusión aparte. Hoy las fusiones
   se juegan en el Versus y en la historia, pero no hay entrada propia.
2. **Aventura propia (motor Canvas, 50 niveles).** Faltan las mejoras de la tienda de PvZ 1 en ese motor
   (Guisantralladora, Birasol, Melancoseta, Totora, Melonpulta congelada, Imán dorado, Pinchorroca, Mazorcañón,
   Imitadora), su arte, el Yeti y los mundos siguientes del plan. En la historia nativa esas plantas ya existen.
3. **Jardín clásico 1 (PvZ-Portable).** Comprobado hasta el nivel 1-1 con los datos remotos; falta recorrerlo más allá.
4. **Probar a mano la campaña.** El balance lo midió un piloto más torpe que una persona; sus cifras son un piso.
5. **Versus por internet entre dos dispositivos.** Solo se probó entre dos pestañas del mismo navegador.
6. **Arte por ciudad y país.** Las 48 ciudades comparten un mismo dibujo, y los 12 países, otro.

Bloqueado:

7. **Clasificación compartida del patio en Supabase.** Está autorizada, pero esta sesión no tiene la conexión.

Pausado por decisión de Javier:

- Arte propio de plantas y zombis dentro de Gardendless (se usa el nativo; el zombi base tiene un esqueleto propio
  para revisar).
- Audio de ElevenLabs dentro de Gardendless (usa su audio original; V2 y la aventura conservan el integrado).
- La granja.

Por decidir (Javier):

- **Conquista y versus V1 (`modo=prototipo`):** adaptar sus salas al motor nuevo y convertir su progreso. La historia
  nativa ya lo reemplaza; recomendación: conservarlo tal cual como minijuego y no convertirlo.
- **Más recetas de Fusión:** hay 117 de las 552 de la versión 4.0.6, aproximadas con piezas nativas. Ampliarlas
  es posible, pero cada receta es una aproximación, no la mecánica exacta del juego cerrado.

Límites aceptados, no pendientes: rendimiento en teléfonos reales (las pruebas físicas se descartaron) y el
guardado a mitad de combate.

## Qué pasó con cada grupo de la lista original

| Grupo | Resultado |
|---|---|
| A · Inventario | Resuelto con el catálogo nativo de Gardendless 0.16.0 y la referencia de Fusión 4.0.x (receta exacta: ver «por decidir»). |
| B · Contrato del motor | Resuelto por Gardendless: carriles 3–7 por escenario, oleadas por datos, puntos de descanso, reparación por el motor. |
| C · Plantas exclusivas | Hecho en la historia nativa (reserva por tipo, traslado sin reembolso, bloqueo entre pestañas). El versus nativo es un duelo de un tablero: no aplica. |
| D · Desbloqueos | Sustituido el 30 de octubre por la tienda: cada país pone sus plantas a la venta; zombis y especiales llegan por país y área, con vista previa en la ficha. |
| E · Varios frentes | Hecho (hasta 6 combates, reloj coordinado, pausa global, asedios con refuerzo); presión medida por la prueba de balance. |
| F · Plantas PvZ 1 | En la historia, todas por Gardendless salvo Grano de café e Imán dorado. En la aventura propia faltan las mejoras (pendiente 2). |
| G · Zombis PvZ 1 | En la historia, por Gardendless. En la aventura propia falta el Yeti y el arte de las unidades nuevas (pendiente 2). |
| H · PvZ 2 | Resuelto por Gardendless: trece mundos con sus plantas, zombis, terrenos y jefes. |
| I · Fusión | 117 recetas nativas; falta el minijuego propio (pendiente 1). |
| J · Guardado | Hecho para la historia nativa; la conversión de V1 queda por decidir. |
| K · Campaña | Hecha: 240 áreas, economía, fortalezas, final y prueba de balance. |
| L · Interfaz, arte y sonido | Hecho con arte y sonido nativos; arte por ciudad pendiente (6); arte y audio propios en Gardendless, pausados. |
| M · Versus | Rehecho sobre Gardendless; falta probar entre dos dispositivos (5). El versus de territorios queda en V1. |
| N · Pruebas | Pruebas por sistema, corrida de balance completa y regresiones; falta el recorrido humano completo (4). |

El issue #1 de GitHub que acompañaba la lista original no está accesible desde esta sesión (responde «no
encontrado»); este documento es la referencia vigente.
