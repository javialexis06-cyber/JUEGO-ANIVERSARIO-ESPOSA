# Encargos aceptables, entregas y plazos

Actualizado: 10 de octubre de 2026. Se amplía **granja-v3 / guardado V5**, sin sustituir el motor. Se conservan los doce encargos permanentes del pueblo. El diario integra además dos ofertas diarias, una semanal y un especial semanal, generados desde trece plantillas adicionales, además de las misiones de campaña existentes. El reparto futuro de 147 personajes sigue siendo planificación; sus ejemplos de encargos no se importan automáticamente.

## Flujo jugable

- Aceptar junto al solicitante o dentro de la Casa de los Oficios abierta. Consultar el diario desde cualquier lugar no permite aceptar remotamente.
- Hasta cinco encargos activos entre permanentes, renovables y proyectos por correspondencia. Plazo desde aceptación: tres jornadas para las diarias, diez para las semanales, veintiuna para los especiales y cuatro a catorce para los permanentes.
- Entregar junto al solicitante, escogiendo **casilla, cantidad y calidad**. Se admiten entregas parciales y varias calidades compatibles; los demás objetos no se consumen.
- Los objetivos de actividad guardan el contador al aceptar. Solo cuentan acciones posteriores; el jugador conserva los productos obtenidos.
- Cobrar junto al solicitante cuando todos los objetivos estén completos: monedas y amistad. El cierre queda persistido y no permite volver a cobrar o aceptar ese pedido completado.
- Cancelar devuelve todas las entregas con sus calidades originales. Si no caben, se rechaza íntegramente y el pedido conserva sus reservas. Los permanentes cancelados pueden volver a aceptarse; una edición renovable se acepta una sola vez, aunque se cancele.
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

V5 anterior sin `encargos` recibe `{version:2, semilla:1, registros:[]}` sin cambiar calendario o inventario. El subestado V1 íntegro migra a V2 conservando exactamente los registros, contadores y reservas; un V1 corrupto se rechaza. Las partidas nuevas fijan su semilla al crear el motor y la conservan en V5. Un campo presente corrupto se rechaza, no se reinicia. Validación de catálogo, IDs duplicados, fecha exacta, estado, contadores de aceptación, objetivos, cantidades y reservas por calidad. Los doce registros permanentes completados nunca se borran. El archivo de ediciones antiguas solo retira cierres que ya no podrían aceptarse por su fecha; no vuelve a habilitar premios.

## Rotación diaria y semanal

`ofertasEncargos(estado)` es una consulta sin mutaciones ni consumo de azar. Devuelve dos diarias, una semanal
y un especial. `encargoDef(id, estado.encargos)` resuelve también las ediciones aceptadas antiguas; la forma
sin segundo argumento conserva la API de los doce IDs originales. `ENCARGOS` sigue conteniendo esos doce.

- ID diario: `diario_<diasCompletados>_<0 o 1>`; semanal/especial: `semanal_<floor(dias/7)>_0` y `especial_<floor(dias/7)>_0`.
- La semilla persistida fija la posición inicial en cada catálogo y el periodo rota las plantillas. Dos diarias
  distintas recorren seis plantillas; las semanales recorren cuatro y los especiales tres. No dependen de la hora
  real, recargas, clics, materiales actuales ni revisiones del motor. El orden y tamaño de estos catálogos V2
  forman parte del contrato de guardado: ampliarlos exige mantener la resolución de ediciones antiguas o migrarla.
- La publicación diaria termina al dormir una vez; la semanal cambia cada lunes. Aceptar en el último día de
  publicación concede el plazo completo desde la aceptación. Rotar nunca sustituye pedidos activos o reservas.
- Las ofertas ordinarias piden madera, piedra, fibra, heno, cariño, alimentación o limpieza, sin cultivos de una
  estación concreta ni requisitos regionales. Sus monedas y amistad están en `PLANTILLAS_ENCARGOS`.
- Se conservan hasta 24 cierres antiguos en el historial. El registro renovable admite como máximo 64 entradas;
  no se eliminan activos ni vencidos con derecho a devolución. Cerca del límite, se archivan cierres antiguos
  adicionales para dejar aceptar; si todo está pendiente, se pide recuperar materiales antes de admitir otro.
  Los cierres de la publicación actual tampoco se borran. Un ID obsoleto se rechaza aunque ya esté archivado.

## Tres pedidos especiales

Cada especial dura 21 jornadas desde aceptar y tiene dos etapas. Los contadores de actividad se fijan una vez
al aceptar; los materiales antiguos no cumplen esa actividad. La entrega real se habilita solo en su etapa.
`avanzar` exige objetivos completos, solicitante disponible y el número exacto de etapa, sin reiniciar plazos
ni conceder premios. Un botón antiguo no puede saltarse otra etapa. La narración del cambio y el cierre queda
en el panel y el resultado de la acción; no sustituye las escenas sociales ramificadas aún pendientes.

| Pedido | Primera etapa | Segunda etapa | Premio al cerrar |
|---|---|---|---|
| Preparar el taller común · carpintera | Obtener 12 maderas al talar/retirar recursos después de aceptar | Entregar 24 maderas y 16 piedras | 360 monedas, 80 amistad, 1 aspersor básico |
| Preparar un corral de acogida · cuidadora | Alimentar 4 veces y dar cariño 4 veces después de aceptar | Entregar 12 henos y 8 fibras | 220 monedas, 60 amistad, 6 alimentos para mascotas |
| Una mesa para compartir · posadera | Fabricar 3 objetos después de aceptar | Entregar 6 panes | 300 monedas, 70 amistad, 2 guisos mineros |

La madera de la primera etapa usa el contador existente de botín obtenido al retirar recursos; la entrega
posterior sí consume objetos que están en la mochila. Fabricar cuenta unidades de salida, como el resto del
motor. Los objetivos de cuidado permiten cuidar varias veces al mismo animal. No se puede aceptar otra
edición del mismo especial mientras la anterior esté activa o vencida; se debe cerrar o recuperar primero.

Todas las entregas quedan reservadas hasta cobrar o cancelar, incluso después de cambiar de etapa/semana.
Los premios usan objetos existentes y sus funciones reales: riego, alimento de compañeros y comida de
expedición. Mochila llena o saldo al límite impiden el cierre íntegro, sin descontar reservas ni aumentar
amistad. Recarga conserva etapa y reservas; cualquier escritura fallida de la interfaz revierte también
el avance de etapa, el premio y la amistad. Dormir conserva la misma garantía para fechas y renovación.

## API para Claude

Módulos: `encargos-datos.ts`, `encargos.ts`, `encargos-ui.ts`; integración en `estado.ts`, `motor.ts` y `main.ts`.

```ts
{ tipo: 'encargo', accion: { tipo: 'aceptar', id: 'pedido_roble' }, xJugador, zJugador }
{ tipo: 'encargo', accion: { tipo: 'entregar', id: 'pedido_roble', objetivo: 0, casilla, cantidad }, xJugador, zJugador }
{ tipo: 'encargo', accion: { tipo: 'reclamar', id: 'pedido_roble' }, xJugador, zJugador }
{ tipo: 'encargo', accion: { tipo: 'cancelar', id: 'pedido_roble' }, xJugador, zJugador }
{ tipo: 'encargo', accion: { tipo: 'avanzar', id: 'especial_0_0', etapa: 0 }, xJugador, zJugador }
```

Registro persistente: ID, fase, día de aceptación, vencimiento, contadores iniciales, entregas por objetivo/calidad y etapa en los especiales. La semilla se guarda una vez en el subestado V2. No contiene timestamps de plazo. `estadisticas.encargos_completados` permite futuros requisitos; `amistad_<npcId>` refleja la relación actual. Los pedidos no modifican el orden de `misionesCompletadas` de la campaña, ni conceden tokens de casa por conversación o entrega parcial.

## Verificación y alcance

Verificación de la ampliación renovable (10 de octubre): 23 casos nuevos en
`scripts/granja-v3/probar-encargos-renovables.mjs`: migración con reservas reales, corrupción, variedad y semilla,
rotación al dormir/lunes, aceptación tardía, límite común, continuidad de pedidos, edición cancelada/completada,
actividad posterior a aceptar, transición y botón repetido, los tres premios, devolución por calidad, mochila
llena, saldo máximo, plazo de 21 noches, especial anterior sin cerrar, archivo/límite de 64, UI y cuidado real.
Regresión completa: **29 suites, cero fallos**. `npm run build` y `npm run build:amigos` correctos; el verificador
de amigos revisa 502 archivos contra 45 palabras y 132 frases sin contenido de pareja.

**17 recorridos de navegador correctos** en el build completo: 11 nuevos en
`scripts/granja-v3/verificar-encargos-renovables.mjs` y seis de casa/granja en `verificar-demo.mjs`.
Los nuevos recorren botones reales del tablón/Diario, aceptación y recarga, renovación nocturna, casilla/calidad
exactas y devolución, bloqueo de etapa futura, guardado/recarga de etapa, entregas, fallo de cuota al aceptar,
avanzar y cobrar, recompensa única e historial semanal. Evidencia local en
`/tmp/encargos-renovables-navegador/VERIFICACION-ENCARGOS-RENOVABLES.json` y
`/tmp/encargos-renovables-casa-granja/VERIFICACION-NAVEGADOR.json`; para regenerarla, ejecutar los scripts contra
el build servido y pasar una carpeta externa. Contextos aislados a 844 × 390 con semilla, servicios, actividad,
recursos y frontera semanal preparados; no certifican una campaña desde cero ni rendimiento físico.

Verificación histórica de los doce pedidos permanentes (10 de octubre): 21 casos específicos: migración, importación corrupta, aceptación, límite, proximidad, horario, calidades, cantidades, devolución, mochila llena, cobro único, recarga, actividades, tiempo real, frontera exacta del plazo y acciones reales de cuidado. Regresión de 23 suites: 512 comprobaciones en total contando la última ampliación de la suite de encargos; ningún fallo. Compilación TypeScript y Vite de todos los puntos de entrada correcta.

Ocho recorridos de navegador: diario, aceptación, entrega parcial, cobro, recarga, cancelación, almacenamiento lleno y pantalla de 412 × 915. Captura móvil revisada. Los recorridos preparan ubicaciones/servicios y materiales para aislar casos; no certifican adquisición desde una partida nueva, campaña completa o rendimiento en S21 FE/S24 Ultra físicos. Evidencia: `work/qa-motor/encargos-*` y la regresión consolidada en `work/qa-motor/encargos-regresion.json` desde la raíz del trabajo.

El 11 de octubre se añaden cuatro pedidos por correspondencia, agrupados en dos decisiones excluyentes. Usan las mismas reservas, plazos, etapas y límite de activos; su cierre concede una receta exclusiva y registra la fecha en la decisión. Solo pueden aceptarse tras elegir la rama en su carta; el buzón también permite retomar esa misma rama cancelada o vencida, devolviendo primero las reservas de forma atómica. Los pedidos y decisiones no se archivan con el historial de rotación. Consultar `CORREO-INTEGRACION.md`.

Pendientes: más variedad de pedidos y etapas, ramificaciones y escenas regionales, museo y campañas de otros mundos. No se declaran implementados todos los encargos del reparto ni terminada la equivalencia con Stardew/Expanded/Automate. El siguiente bloque previsto es colecciones y lotes (I09).
