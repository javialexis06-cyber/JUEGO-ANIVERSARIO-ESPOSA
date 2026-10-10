# Correo de la granja

Integrado el 10 de octubre de 2026 sobre el mismo motor granja-v3 y guardado V5.

## Uso y entrega

El buzón aparece junto a la entrada de la cabaña inicial y acompaña su traslado y sus cuatro giros. La bandera se eleva cuando hay cartas sin leer o adjuntos pendientes. El clic en su modelo abre el panel; el Diario permite consultar el historial desde cualquier lugar. Abrir una carta nueva o recoger el adjunto exige estar en el exterior de la granja, a un máximo de 2,4 unidades del buzón. Las cartas ya leídas se consultan a distancia.

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

## API y persistencia

`correo.ts` concentra catálogo, entrega, ubicación, acciones y validación. `correo-ui.ts` muestra historial y adjuntos; `correo-render.ts` crea el buzón con geometría básica, sin texturas descargadas.

Acción: `{tipo:'correo',accion:{tipo:'leer'|'reclamar',id},xJugador,zJugador}`. El nuevo campo `correo` registra versión 1, cartas recibidas y jornadas de lectura/cobro. Una V5 anterior sin este campo recibe la bienvenida; sus hitos se evalúan al siguiente cierre de jornada. Un campo presente pero corrupto se rechaza. La validación comprueba IDs, duplicados, fechas y coherencia entre lectura y cobro; no certifica que el progreso importado se haya conseguido jugando.

El cobro comprueba espacio para todos los objetos y el límite del saldo antes de modificar inventario o monedas. Una mochila llena conserva todo el adjunto. Leer repetidamente no aumenta el contador; recoger nuevamente no concede objetos. La aplicación guarda inmediatamente lectura y cobro; si falla la escritura, revierte el estado anterior.

## Verificación y límites

Compilación completa correcta. `scripts/granja-v3/probar-correo.mjs`: 14 casos sobre entrega nocturna, 84 cierres hasta invierno, migración, validación, posición/giros, cercanía, inventario lleno, saldo, cobro único, recarga y consulta remota. Regresión de 27 suites sin fallos: `work/qa-motor/correo-regresion.json` desde la raíz de trabajo.

Seis recorridos de navegador: clic en buzón 3D y lectura, entrega tras dormir y cobro, recarga/historial remoto, reversión de lectura y de cobro ante almacenamiento lleno y viewport móvil 412 × 915 sin desbordamiento. Evidencia: `work/qa-motor/correo-navegador.json` y capturas en `work/qa-motor/renders/correo-*.png`. Son escenarios preparados; no certifican campaña completa desde cero ni rendimiento físico de S21 FE/S24 Ultra.

El buzón es seleccionable, sin obstáculo propio de tránsito ni animación de apertura. Faltan cartas ramificadas, suscripciones, recetas por correspondencia, misiones aceptadas desde cartas y entregas de otros mundos. No implementa festivales ni amplía por sí solo las doce misiones del pueblo.

Siguiente bloque previsto: calendario y participación en eventos comunitarios originales, conservando los días avanzados al dormir y los premios únicos.
