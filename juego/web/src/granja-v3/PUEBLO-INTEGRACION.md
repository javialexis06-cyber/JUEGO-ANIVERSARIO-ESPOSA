# Habitantes del primer pueblo y relaciones

## Correo integrado

Actualización del 10 de octubre de 2026: buzón físico junto a la cabaña, historial en el Diario, 13 cartas por jornadas, actividades y estaciones, adjuntos únicos y persistencia con reversión si falla almacenamiento. Las cartas nuevas llegan exclusivamente al dormir. [CORREO-INTEGRACION.md](CORREO-INTEGRACION.md) documenta reglas, catálogo, API y límites. Los festivales jugables, cartas ramificadas y recetas por correspondencia siguen pendientes.


## Dormitorios privados integrados

Actualización del 10 de octubre de 2026: 24 dormitorios con puerta física desde la sala, entrada por 500 puntos de amistad, cercanía y horario; lectura de escritorio/biblioteca sin recompensas, presencia del NPC al final de la tarde, persistencia y retorno primero a la sala y luego al pueblo. [DORMITORIOS-INTEGRACION.md](DORMITORIOS-INTEGRACION.md) describe API, pruebas y límites. Los cuartos comparten distribución; faltan diseño específico, animaciones de puerta y eventos domésticos completos.


## Domicilios del primer pueblo integrados

El 10 de octubre de 2026 se conectan 17 viviendas para los 24 vecinos: siete interiores anexos a comercios y diez casas nuevas en barrios norte y sur. Entrada cercana a la puerta, horarios, teclado, conversación/regalos en casa, salida y persistencia; rutinas regresan al domicilio asignado. [VIVIENDAS-INTEGRACION.md](VIVIENDAS-INTEGRACION.md) documenta reparto, API, pruebas y límites. Las salas comunes conectan ahora dormitorios privados básicos; faltan restauración y viviendas de los demás pueblos.


## Vida social integrada el 10 de octubre de 2026

Calendario de 28 días y cumpleaños para los 24 habitantes, bonus anual de regalo y ocho encuentros originales con requisitos, dos respuestas, amistad y recuerdo persistidos. Guardado de cada paso, recarga del diálogo y rollback si falla almacenamiento. Se conserva el motor y la V5. [VIDA-SOCIAL-INTEGRACION.md](VIDA-SOCIAL-INTEGRACION.md) contiene requisitos, API, pruebas y límites. Los dormitorios privados básicos ya están integrados; los festivales jugables siguen pendientes; los 17 interiores residenciales básicos ya están conectados.


Actualizado: 10 de octubre de 2026. Se edita el motor `granja-v3`; el guardado sigue en V5. **24 habitantes en el primer pueblo no son el total del juego.** El [reparto completo propuesto](REPARTO-COMPLETO.md) registra 142 interlocutores y aliados más cinco figuras del lore, distribuidos en 19 núcleos. La [planeación de pueblos y mundos](PLAN-PUEBLOS-MUNDOS.md) define sus funciones, alojamiento, rutas y progresión. Los 118 interlocutores adicionales están planificados, no implementados; los nombres propios propuestos todavía no sustituyen los títulos actuales ni fijan parentescos o biografías definitivas.

## Reparto completo de esta etapa

Los nueve responsables de servicios mantienen sus funciones existentes. Todos tienen ahora horario, rutina, conversación, gustos y amistad guardada. Las ofrendas y revelaciones de los altares siguen pendientes.

| ID | Personaje | Lugar | Función actual |
|---|---|---|---|
| mercader | La mercader | Mercado de la Semilla | Semillas, provisiones, plantones, venta de cosechas y ampliación de mochila. |
| cuidadora | La cuidadora | Casa de los Animales | Compra de ganado, compañía y huevos fértiles según desbloqueos y hábitat. |
| carpintera | La carpintera | Taller del Roble | Contratos de edificios, ampliación de refugios, muebles y decoración. |
| herrero | El herrero | Forja del Arroyo | Encargos de mejora y retirada de herramientas. Los plazos de forja siguen siendo cortos para pruebas. |
| veterinaria | La veterinaria | Clínica del Jardín | Acceso a revisión de animales. Los tratamientos existentes se realizan junto al animal; faltan visitas veterinarias narrativas. |
| posadera | La posadera | Posada del Molino | Descanso para recuperar fuerzas. La carta de comida y los eventos de posada siguen pendientes. |
| archivero | El archivero | Casa de los Oficios | Acceso al diario de misiones. Museo físico, donaciones y manuscritos siguen pendientes. |
| canalizadora_aura | Santa de Aura | Altar del Despertar | Conversación y relación; lugar reservado para futuras ofrendas y misiones de Aura. |
| canalizadora_lara | Santa de Lara | Altar de la Calma | Conversación y relación; lugar reservado para futuras ofrendas y misiones de Lara. |

Los quince vecinos adicionales **ya aparecen, pasean, conversan y reciben regalos**. Su especialidad orienta diálogos y futuros encargos; no añade todavía un servicio económico nuevo. La siguiente tabla describe el papel preparado para conectar la historia.

| ID | Personaje | Papel preparado |
|---|---|---|
| pescadora | La pescadora | Pesca, aparejos y futuros encargos de peces. |
| minero | El minero | Expediciones, minerales y futuros encargos de la mina. |
| exploradora | La exploradora | Rutas, descubrimientos y futuras misiones de exploración. |
| cocinero | El cocinero | Cocina y futuros encargos de ingredientes y platos. |
| botanica | La botánica | Plantas, frutales y futuros estudios de cultivos. |
| agricultor | El agricultor | Temporadas, terreno y futuros pedidos de cosechas. |
| maestra | La maestra | Aprendizaje de oficios y futuras actividades del pueblo. |
| musica | La música | Música y futuras reuniones y actividades de bienestar. |
| guardabosques | El guardabosques | Bosques, recursos y futuras misiones de conservación. |
| artesana | La artesana | Tejidos, decoración y futuros encargos de fabricación. |
| astronoma | La astrónoma | Cielo y futuro enlace narrativo con la exploración espacial. |
| veterano | El vecino mayor | Memoria local y futura historia de restauración del valle. |
| nina | La joven aprendiz | Aprendizaje de agricultura y futuras actividades cotidianas. |
| nino | El joven aprendiz | Mapas, criaturas y futuras actividades de descubrimiento. |
| viajera | La viajera | Noticias de otras regiones y futuros encuentros regionales. |

Los vecinos nuevos se retiran a la posada o a la Casa de los Oficios como alojamiento provisional compartido. **Todavía no tienen viviendas privadas, habitaciones personales o vida familiar completa.** No se inventan parentescos o romances. Aura y Lara conservan representantes humanos de altar, sin convertirlos en encarnaciones de las diosas.

## Encargos integrados el 10 de octubre

Doce pedidos se aceptan junto al solicitante o en la Casa de los Oficios abierta. Entrega parcial y cobro junto al vecino, calidades exactas, máximo cinco activos y plazos solo al dormir. Cancelar o recuperar un pedido vencido devuelve sus reservas; almacenamiento lleno revierte la acción. El estado y API están documentados en [ENCARGOS-INTEGRACION.md](ENCARGOS-INTEGRACION.md). Son contenido jugable independiente de las escenas e historias futuras de este reparto.

## Horarios y movimiento

- Calendario semanal: lunes a domingo, derivado de `jornada.diasCompletados % 7`. Semana y estación avanzan únicamente al dormir.
- Horarios de los servicios: mercader 09–17, cuidadora 08–16, carpintera 09–17, herrero 09–16, veterinaria 08–18, posadera 10–22, archivo 10–18, altares 07–19.
- Descansos: mercader martes, cuidadora viernes, carpintera miércoles, herrero sábado y archivero domingo. Los demás servicios abren diariamente por ahora.
- Rutinas con paseo matinal, trabajo, descanso en plaza y regreso. En días libres hay paseo sin atención de tienda. Con lluvia/tormenta se omiten los paseos de ocio y se vuelve al local.
- Las rutas usan una malla de medio metro y las mismas colisiones de edificios, fuente, vallas, árboles, mobiliario y arroyo que el jugador. Los atajos se comprueban sobre todo el segmento. No hay cruce visual a través de edificios ni animación circular decorativa sobre un punto fijo.
- Posición, dirección y paso se calculan a partir de los minutos guardados: no se usan timestamps reales ni se avanza durante ausencia. Menús y conversación pausan reloj, posición y zancada. No se simula otra jornada al recargar.
- El clic/tap sobre el modelo del habitante abre conversación si está al alcance. El clic en la puerta visita el servicio; una puerta cerrada muestra su horario.
- Jugador, aldeanos y caballo usan la altura compartida de caminos, plaza y puentes; no quedan enterrados en el pavimento elevado.
- El modelo exterior se descarga al entrar al local. El dependiente interior representa a la misma relación persistida; no se crean dos personajes distintos.

## Relaciones y regalos

`estado.pueblo = {version: 1, relaciones: [...]}`. Cada relación contiene ID, conocido, amistad 0–2500, última jornada de conversación, semana/días de regalos y gustos descubiertos.

Conversar concede 20 puntos una vez por jornada; se puede seguir hablando sin repetir puntos. Un corazón corresponde a 250 puntos y hay un máximo de diez. No hay pérdida de amistad por no conectarse ni aumentos durante ausencia.

Un regalo por habitante y jornada; dos por semana de siete jornadas jugadas. El límite persiste al guardar. El regalo consume una unidad **de la casilla exacta elegida**, manteniendo las otras pilas y sus calidades. Gustos: encanta +80, gusta +45, neutral +15, desagrada −35; calidad multiplica solo los aumentos por 1 / 1,1 / 1,25 / 1,5. Se descubren los gustos al entregar, y se muestran en la conversación. La amistad se limita a 0–2500.

Se admiten recursos, minerales, lingotes, comida, peces y productos del catálogo. Se excluyen herramientas, equipo, semillas, máquinas, contenedores, estructuras, planos y huevos fértiles. Un fallo de proximidad, horario, casilla o límite no consume objetos ni altera la relación.

Los gustos y diálogos son contenido original provisional. No se han importado textos o personajes de Stardew Valley. La variedad de diálogo aún es básica: dos textos por habitante y respuestas a regalos.

## Integración con Claude

Archivos: `pueblo-datos.ts` (reparto, edificios y colisiones), `aldeanos.ts` (rutinas y relaciones), `aldeanos-ui.ts` (directorio y conversación), `pueblo.ts` (arte y animación), `motor.ts`, `estado.ts`, `vista.ts` y `main.ts`.

Acciones:

```ts
{tipo: 'hablar_aldeano', npcId, xJugador, zJugador}
{tipo: 'regalar_aldeano', npcId, casilla, xJugador, zJugador}
{tipo: 'entrar_servicio', servicio, xJugador, zJugador}
```

El resultado opcional `conversacion` devuelve ID, texto, puntos efectivos, gusto y si es el primer encuentro. En un local solo se conversa con su responsable; en exterior hace falta encontrarse a 2,4 metros y tener paso libre. La API antigua de `entrar_servicio` sin coordenadas se conserva para integración y fixtures; **la interfaz normal siempre comprueba proximidad**. Horarios también bloquean compras, ventas, adopciones, mejoras y contratos dentro de un guardado de local cerrado.

Para la campaña se pueden consultar las relaciones y los contadores `vecinos_conocidos`, `conversar_<id>`, `regalos_<id>` y `amistad_<id>`. Este último refleja puntos actuales y no concede recompensas por sí mismo. Las misiones/recompensas deberán usar el sistema de aceptación y entrega; no regalar tokens de casa únicamente por abrir un diálogo.

V5 anterior sin `pueblo` obtiene 24 relaciones nuevas sin cambiar edificios, inventario, calendario o cuidado. Una colección presente corrupta se rechaza; no se reemplazan relaciones dañadas silenciosamente. La colección transitoria de nueve personajes se amplía preservando sus vínculos.

## Validación y límites

26 casos nuevos en `scripts/granja-v3/probar-aldeanos.mjs`: migración, validación, horarios, proximidad, trayectos de 24 habitantes durante toda la semana con sol/lluvia, ausencia, límites diarios/semanales, calidad exacta del regalo y recarga. `work/qa-pueblo.cjs` verifica 16 recorridos de navegador con mouse y pantalla táctil de 412 × 915, sin errores de ejecución. Regresión conjunta: 491 comprobaciones en 22 suites y 51 recorridos de navegador (16 pueblo, 12 carpintería, 13 compañía, 10 ganado), sin errores. Compilación de todos los puntos de entrada confirmada. Informes en `work/qa-motor/pueblo-*`.

El conjunto del pueblo con 24 avatares pasa de 344.714 a 136.418 triángulos conservando 89 mallas. Se conservan volúmenes principales y relieves, y se reduce teselación de molduras finas y rasgos pequeños. No se añaden PNG, GLB o texturas externas de personajes. Esto **no certifica FPS ni consumo en un S21 FE/S24 Ultra físico**.

Pendientes: personalización de viviendas/dormitorios, trayectos entre regiones, oferta/stock/reposición de tiendas, cartas ramificadas, festivales, más escenas de amistad, vínculos familiares, romances aprobados, encargos por habitante, museo físico y diálogos extensos de historia. La base social está integrada; no se declara terminado el pueblo completo, la campaña o la equivalencia con Stardew/Expanded/Automate.
