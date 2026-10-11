# Cuadernos encontrados y aprendizajes

## Uso y primera serie

Abre **Explorar → Biblioteca de cuadernos**, o consúltala en la Casa de los Oficios. La lista indica
el origen y utilidad de cada cuaderno; verla no concede conocimiento. Durante una expedición,
acércate al campamento principal del piso indicado y toca **Recuperar cuaderno** en Explorar o
en el propio campamento. Exige suelo transitable, cercanía de 2,3 unidades y visión despejada.
El descanso del campamento conserva su beneficio independiente: haberlo usado no impide recuperar.
Las partidas existentes usan sus campamentos actuales, sin regenerar terreno ni colocar objetos nuevos.

Los cuadernos se registran aparte de la mochila, incluso si está llena. **Regresa de la expedición y
lee** el cuaderno para aprender; después puedes releer su texto. Cada recuperación y primera lectura
son únicas, sin premios de monedas ni recursos repetibles.

| Cuaderno técnico propuesto | Origen en Minas de Celia | Aprendizaje funcional |
| --- | --- | --- |
| Señales bajo las rocas | Campamento principal del piso 1 | Prospección: 3 antorchas y 8 de energía revelan una escalera cercana |
| Fundición por tandas pequeñas | Campamento principal del piso 5 | Horno: 5 minerales de cobre y 1 carbón → 1 lingote, en 20 segundos |
| Cuarzo y vidrio | Campamento principal del piso 9 | Horno: 3 cuarzos → 2 vidrios, en 20 segundos |

La prospección solo funciona en la mina, antes del último piso y si todavía no hay bajada visible.
Elige una celda transitable cercana, con visión directa y libre de vetas activas, criaturas, entradas y
situaciones. No rompe minerales, genera botín ni modifica la semilla. Si falta aprendizaje, energía,
antorchas o espacio, falla entera sin pagar. La escalera descubierta usa el descenso existente y persiste
en la instancia al recargar. El siguiente piso conserva las reglas normales de generación y minería.

Las dos recetas mantienen ingredientes, salida, estación y requisitos habituales; solo acortan la
producción desde 30 segundos (cobre) o 35 segundos (vidrio). Las originales siguen disponibles.
Necesitas un horno colocado y materiales reales; también sirven para la automatización existente.
La recuperación usa los mismos costes por unidad, sin ganancia adicional por fabricar y reciclar.
El catálogo queda en **149 recetas y 458 objetos**, sin objetos nuevos de inventario.

Los textos son **propuestas técnicas internas** (`propuesta:true`). Explican reglas actuales y pistas
de uso; no agregan personajes, acontecimientos ni canon de Astra. La presentación usa texto y botones
existentes; arte y gráficos finales continúan en el frente visual.

## API y persistencia

- `libros-datos.ts`: tres definiciones, fuentes y dos recetas alternativas; sin imports de ejecución.
- `libros.ts`: recuperación, lectura, prospección y validación. Acción general `libro`, con
  `recuperar`, `leer` o `prospectar`, y posición del jugador.
- `libros-ui.ts`: biblioteca y controles en Explorar/campamentos. `produccion-ui.ts` explica qué
  cuaderno habilita cada receta bloqueada.
- `aventura.ts`: comprobación física de situaciones y revelado de escalera cercana, sin nuevos imports.
- Subestado `libros.version:1`, `registros[{id,recuperadoDia,leidoDia,semillaInstancia}]`.
  `leidoDia:null` distingue encontrado de aprendido. Se conserva la semilla de la instancia de origen
  aunque una visita posterior regenere el piso.
- `libro_<id>` existe exactamente cuando ese cuaderno está leído. El validador rechaza IDs desconocidos,
  duplicados, fechas incoherentes/futuras, semillas fuera de uint32, pisos de origen no alcanzados,
  mina no descubierta y aprendizajes incompatibles. Esta coherencia no autentica un archivo editado
  externamente: las semillas de visitas antiguas no reconstruyen un historial completo.
- Partidas V5 sin el campo reciben registro vacío; un campo presente corrupto se rechaza entero.
  La versión general, claves, IDs previos y partidas existentes se conservan.
- Las tres acciones guardan inmediatamente. Fallo de almacenamiento restaura el estado completo,
  incluyendo cuaderno, aprendizaje, escalera, antorchas y energía. Conservan bloqueos de descanso,
  encuentros, festivales y montura. La lectura tiene además su bloqueo durante expediciones.
- Calendario agrícola, edad y jornadas solo avanzan al dormir; el tiempo de producción permanece separado.

## Alcance de aceptación

K07 pasa a **parcial con tres hallazgos y efectos útiles**. Faltan libros y pistas regionales, más
desbloqueos, variedad y vínculos de historia. K06 sigue parcial: esta biblioteca registra encontrado/leído,
pero todavía faltan todos los registros semánticos de captura, crianza, fabricación y venta. F11 sigue
pendiente: identificar geodas, tesoros y artefactos para equipo y museo es el próximo bloque previsto.
Esto no certifica campaña completa, balance prolongado ni rendimiento de teléfonos físicos.

`probar-libros.mjs` verifica fuentes conectadas en veinte semillas, migración V5, guardas físicas,
campamentos ya resueltos, mochila llena, lectura única, validación de importación, sondeo con pago
atómico, descenso/recarga y producción real. El recorrido de pisos 1 → 9 usa pico básico y minería
ordinaria; prepara posición junto a vetas y repone energía para aislar reglas, sin certificar campaña.
`verificar-libros.mjs` usa botones del build, cuota fallida en las tres acciones, recargas, lectura
bloqueada en mina y fórmulas pagadas/procesadas en horno. Prepara posiciones/provisiones y pisos
mediante prospección del motor; adelanta tiempo real de producción en contexto aislado.
También se ejecutan regresión general, builds completa/amigos y casa → granja → casa → granja.

Resultado local: **22 grupos nuevos de lógica, 32 suites y 17 comprobaciones de navegador**
(11 de cuadernos y seis de casa/granja), sin fallos. Ambas compilaciones pasan; amigos revisa
503 archivos contra 45 palabras y 132 frases. El recorrido de integración espera cuadros renderizados
tras preparar posiciones, actualiza la matriz de cámara antes de proyectar el clic y espera el panel:
la preparación anterior podía pulsar antes de sincronizar la cámara. El recorrido completo final
conserva posición, inventario, lectura y jornada, sin errores JavaScript ni recursos fallidos.
