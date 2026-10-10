# Encargos aceptables, entregas y plazos

Actualizado: 10 de octubre de 2026. Se amplía **granja-v3 / guardado V5**, sin sustituir el motor. Doce encargos del pueblo están integrados en el diario, además de las misiones de campaña existentes. El reparto futuro de 147 personajes sigue siendo planificación; sus ejemplos de encargos no se importan automáticamente.

## Flujo jugable

- Aceptar junto al solicitante o dentro de la Casa de los Oficios abierta. Consultar el diario desde cualquier lugar no permite aceptar remotamente.
- Hasta cinco encargos activos. Cada pedido tiene plazo propio de jornadas jugadas, entre cuatro y catorce en este catálogo.
- Entregar junto al solicitante, escogiendo **casilla, cantidad y calidad**. Se admiten entregas parciales y varias calidades compatibles; los demás objetos no se consumen.
- Los objetivos de actividad guardan el contador al aceptar. Solo cuentan acciones posteriores; el jugador conserva los productos obtenidos.
- Cobrar junto al solicitante cuando todos los objetivos estén completos: monedas y amistad. El cierre queda persistido y no permite volver a cobrar o aceptar ese pedido completado.
- Cancelar devuelve todas las entregas con sus calidades originales. Si no caben, se rechaza íntegramente y el pedido conserva sus reservas. Se puede volver a aceptar un pedido cancelado con nuevos contadores y plazo.
- Un vencimiento no cobra multa: los materiales entregados siguen reservados hasta recuperarlos desde el diario. No existe devolución silenciosa que pierda materiales con mochila llena.

El diario muestra primero los encargos de vecinos y después las historias de campaña. Cada tarjeta indica solicitante, progreso, última fecha, jornadas restantes y recompensa. La cantidad es explícita; el botón de entregar se bloquea si no hay una pila compatible o el solicitante no está cerca.

## Catálogo actual

| ID | Solicitante | Objetivo | Plazo | Monedas / amistad |
|---|---|---|---|---|
| pedido_roble | Carpintera | 12 maderas y 8 piedras | 7 jornadas | 120 / 35 |
| pedido_forja | Herrero | 4 cobres y 3 carbones | 7 | 100 / 35 |
| pedido_pan | Posadera | 3 panes | 4 | 70 / 30 |
| pedido_heno | Cuidadora | 6 henos | 5 | 65 / 30 |
| pedido_fibra | Artesana | 10 fibras | 6 | 80 / 30 |
| pedido_cuarzo | Astrónoma | 3 cuarzos | 8 | 90 / 35 |
| pedido_piedra | Archivero | 5 piedras y 5 maderas | 7 | 55 / 25 |
| pedido_pan_calidad | Cocinero | 2 panes de plata o superior | 7 | 120 / 40 |
| pedido_pesca | Pescadora | Capturar 3 peces tras aceptar | 7 | 85 / 30 |
| pedido_cuidado | Veterinaria | Alimentar 2 veces y dar cariño 2 veces tras aceptar | 4 | 60 / 30 |
| pedido_huerta | Agricultor | 3 cosechas tras aceptar | 14 | 100 / 35 |
| pedido_pasto | Guardabosques | Abastecer pasto 2 veces tras aceptar | 7 | 80 / 30 |

Los valores son balance inicial. Un mismo animal puede recibir las dos acciones de cuidado; el pedido de pasto cuenta abastecimientos, no exige dos corrales distintos. El pan de calidad puede provenir de la producción con ingredientes de calidad; no se cambia la regla de calidad para facilitar el pedido.

## Calendario y guardado

`aceptadoDia` es el número de noches completadas al aceptar. `venceDia = aceptadoDia + dias`. Se puede entregar durante los días `aceptadoDia` a `venceDia - 1`; al dormir y alcanzar `venceDia`, el pedido pasa a vencido. Tiempo real y recarga no adelantan este plazo. Se mantienen las reglas separadas de cuidado real de cultivos y animales.

El motor revierte cualquier fallo de acción. La interfaz exige escritura correcta del guardado antes de confirmar una aceptación, entrega, cancelación o recompensa. Si falta espacio en almacenamiento, revierte materiales, monedas, amistad y registro de encargo. Dormir conserva su rollback existente, incluido el vencimiento de pedidos si la noche no puede guardarse.

V5 anterior sin `encargos` recibe `{version:1, registros:[]}` sin cambiar calendario o inventario. Un campo presente corrupto se rechaza, no se reinicia. Validación de catálogo, IDs duplicados, fecha exacta, estado, contadores de aceptación, objetivos, cantidades y reservas por calidad. Los registros completados no se borran para liberar el derecho a cobrar otra vez.

## API para Claude

Módulos: `encargos.ts`, `encargos-ui.ts`; integración en `estado.ts`, `motor.ts` y `main.ts`.

```ts
{ tipo: 'encargo', accion: { tipo: 'aceptar', id: 'pedido_roble' }, xJugador, zJugador }
{ tipo: 'encargo', accion: { tipo: 'entregar', id: 'pedido_roble', objetivo: 0, casilla, cantidad }, xJugador, zJugador }
{ tipo: 'encargo', accion: { tipo: 'reclamar', id: 'pedido_roble' }, xJugador, zJugador }
{ tipo: 'encargo', accion: { tipo: 'cancelar', id: 'pedido_roble' }, xJugador, zJugador }
```

Registro persistente: ID, fase, día de aceptación, vencimiento, contadores iniciales y entregas por objetivo/calidad. No contiene timestamps de plazo. `estadisticas.encargos_completados` permite futuros requisitos; `amistad_<npcId>` refleja la relación actual. Los pedidos no modifican el orden de `misionesCompletadas` de la campaña, ni conceden tokens de casa por conversación o entrega parcial.

## Verificación y alcance

21 casos específicos: migración, importación corrupta, aceptación, límite, proximidad, horario, calidades, cantidades, devolución, mochila llena, cobro único, recarga, actividades, tiempo real, frontera exacta del plazo y acciones reales de cuidado. Regresión de 23 suites: 512 comprobaciones en total contando la última ampliación de la suite de encargos; ningún fallo. Compilación TypeScript y Vite de todos los puntos de entrada correcta.

Ocho recorridos de navegador: diario, aceptación, entrega parcial, cobro, recarga, cancelación, almacenamiento lleno y pantalla de 412 × 915. Captura móvil revisada. Los recorridos preparan ubicaciones/servicios y materiales para aislar casos; no certifican adquisición desde una partida nueva, campaña completa o rendimiento en S21 FE/S24 Ultra físicos. Evidencia: `work/qa-motor/encargos-*` y la regresión consolidada en `work/qa-motor/encargos-regresion.json` desde la raíz del trabajo.

Pendientes: ofertas diarias/semanales renovables, pedidos especiales de varias etapas, cartas, elecciones y consecuencias de historia, recompensas de recetas, museo y campañas regionales. No se declaran implementados todos los encargos del reparto ni terminada la equivalencia con Stardew/Expanded/Automate. El siguiente bloque previsto es vida del pueblo: viviendas, calendario social y escenas, conservando los IDs actuales.
