# Motor y partidas completas: seguimiento de verificación

> **Cierre de alcance · 16 de octubre:** Javier descartó los pendientes de generación de instaladores/Actions,
> SQL y Supabase real, dispositivos físicos, pruebas de recorridos parciales y ampliaciones de cobertura/desbloqueos
> enumerados después de esta revisión. Las limitaciones y los bloqueos descritos abajo conservan la evidencia
> histórica; no son una cola de tareas ni deben retomarse sin un nuevo pedido. Detalle en
> [pedidos vigentes](../pedidos.md).


## Encargo vigente · 13 de octubre de 2026

Javier encargó terminar lo que falte para que los motores funcionen correctamente y probar una partida de inicio
a fin de cada juego. Cualquier propuesta de dificultad, balance, precios, costes o recompensas se presenta con
su efecto concreto y espera aprobación antes de cambiar código. Las correcciones funcionales, conservación de
partidas y comprobaciones de reglas continúan. Esta instrucción también está registrada en `AGENTS.md`.

Javier autorizó publicar el registro `a3c4aa7e` y los siguientes avances de motor y pruebas en `work` y
`claude/supermarket-mania-minigame-xn2it8` de este mismo repositorio público. La autorización no elimina su
aprobación previa para ajustes de dificultad o balance y no permite push forzado.

La revisión parte de `9e290f6a`, integrado con la rama compartida. No se considera una campaña completa un
recorrido que habilita contenido, teletransporta personajes, entrega recursos o fuerza resultados mediante un
gancho de prueba. Esas pruebas sirven para la integración y se describen como escenarios preparados.

## Cierre de la revisión · 16 de octubre de 2026

La [verificación general del 15–16 de octubre](verificacion-general-2026-10-15.md) concentra la evidencia final,
las campañas, los modos probados y sus límites. Se corrigieron los fallos silenciosos de guardado de Súper y
Cien Puertas, y el resultado de sala que podía no llegar al invitado del Torneo. La granja permanece pausada;
se descartan ampliaciones no realizadas de escenas premium y contenido futuro del sótano. No hubo cambios de
balance en esta tanda. Las instrucciones y la cola antigua se limpiaron en `df687ed3`.

Pasan ambas compilaciones, el filtro de amigos (578 archivos), `probar:motores`, las 48 suites de granja y las
seis comprobaciones de integración. Una prueba automatizada no certifica teléfonos físicos ni todas las
combinaciones. Las cifras y alcances anteriores se conservan abajo como historial.

## Correcciones comprobadas

- **Carreras: circuitos, copas y desafíos (15 de octubre).** Dieciséis circuitos originales (cuatro clásicos sin
  regenerar y doce nuevos), cuatro copas, tres arenas y cuatro desafíos contra siete bots. Batalla de globos,
  monedas con pérdidas recuperables, aros por corredor/vuelta y trucos/miniturbos puntuados por eventos del motor.
  Las marcas se separan por escenario, dificultad y duración; las copas antiguas migran a la clásica sin borrar
  récords ni fantasmas. Ocho grupos de guardado cubren reintentos y separación de perfiles. La tabla y el podio
  comparten el ganador incluso al empatar en puntos. Las copas en línea conservan sus ocho inscritos entre pistas,
  en lugar de volver a sortear bots y perder parte de los puntos.
  El motor completa 96 carreras de tres vueltas (16 × 3 dificultades × 2 semillas) y 38 desafíos de dos minutos.
  Los cuatro tiempos clásicos de referencia coinciden exactamente. En el build de amigos completan las tres
  copas nuevas y ocho desafíos: 20 partidas por interfaz, pausa, un fallo de guardado de marca, podios, recarga y
  retorno; cero errores de página. Se inspeccionan las postales y capturas de las doce pistas y los cuatro modos.
  Una copa completa en dos pestañas conserva los mismos ocho inscritos y clasificaciones idénticas tras cada
  carrera, con el mismo podio y regreso a sala/salida para ambos. Transporte local real de salas y reloj ×4;
  no hay posiciones ni resultados forzados. No se reutilizan mapas de Nintendo.
  Los desafíos nuevos son locales contra la máquina; todavía no se sincronizan
  en salas. No se certifican controles, rendimiento ni internet real en Android. Registros locales en
  `juego/web/test-results/carreras-ampliacion-2026-10-15/`; instrucciones en [Carreras](../sistemas/carreras.md).

- **Desaparecidos: investigación manual (15 de octubre).** Por petición de Javier, se retiran pistas automáticas,
  contador de importantes, giros destacados, tutorial, ayudas de contraseña y sugerencias de linterna. La libreta
  guarda texto escrito por el jugador; presentar conclusiones no exige entradas concretas. Los historiales de los
  ocho teléfonos suman 6.111 mensajes (708–785 por aparato), tres años anteriores, nueve o diez chats por teléfono,
  archivo, búsqueda, fechas, citas, reacciones, ediciones, llamadas y notas cotidianas. Hay 96 audios adicionales,
  generados con voces de ficción, separados de las 56 voces de la trama. Se conservan soluciones, claves, candados,
  casos y estrellas anteriores. Seis regresiones de guardado cubren también notas y compatibilidad.
  Ocho casos completados por controles en amigos, con 24 estrellas, cero pistas automáticas y recarga por caso;
  primer cierre fallido recuperado. Las claves y respuestas proceden de los datos de prueba: no es una validación
  de deducción humana. La interfaz comprueba búsqueda, archivo, paginación y notas; el navegador decodifica los
  152 audios con señal sonora. Registro en `juego/web/test-results/astra-manual-2026-10-15/`.
  Pasan ambas compilaciones, filtro de amigos, motores, 48 suites de granja y las seis comprobaciones de
  integración. También pasa el primer caso y el retorno a casa sobre el build final, con guardado fallido.

- **Show: cierre y controles (15 de octubre).** Pausa manual y confirmación de salida detienen las preguntas
  y se comparten en línea. Opciones, textos y calificaciones rechazan entradas repetidas o durante pausa;
  cerrar resuelve las esperas del traspaso de teléfono. Resultado con reintento y recibo persistente: episodio,
  monedas y victorias se confirman juntos en la casa, sin repetir pagos al recuperar la respuesta de una escritura.
  Se conserva el premio de un libro suelto hasta abrir la casa, sin trasladar respuestas a otro hogar.
  Once grupos de regresión incluyen 180 planes válidos y calificaciones exactas, parciales y erróneas;
  las comprobaciones táctiles usan la interfaz real en 844×390 y estados preparados.
  Pasan tipos, compilación completa, compilación de amigos con filtro de privacidad, `probar:motores`, las 48
  suites de granja y las seis comprobaciones de integración sobre el build final. Registros locales en
  `juego/web/test-results/show-cierre-2026-10-15/` y scripts reproducibles en `juego/web/scripts/probar-show*.mjs`.

- **Lavado en sala (15 de octubre).** Posiciones visuales entre mensajes tanto para anfitrión como invitados,
  con reloj del emisor, mandos ordenados, frenada y recuperación acotada. Modelo, nombre, barra, sombra y auras
  comparten la vista; el control propio y las posiciones usadas por el combate se conservan. Doce grupos de
  regresión comprueban marcha, pérdidas y reordenación, estados, límites y ausencia de cambios en el motor.
  Siete comprobaciones con dos amigos y sus modelos 3D, y 36 con cuatro jugadores, incluyen cortes, rescate
  y retorno; todas pasan. Son escenarios preparados y red simulada. Alcance y mediciones en
  [movimiento en línea](lavado-movimiento-en-linea.md).
- **Lavado.** Los enemigos eliminados esperan a salir de la lista antes de reutilizar su casilla; desaparecen
  los impactos duplicados y los ciclos de la rejilla. Ocho regresiones cubren aretes, receta, reutilización, contadores,
  veinte fotos de red y horda real. Repetidas 58 partidas con 25 victorias; la distribución de ambos aretes por mapa está aprobada y aplicada, con
  guardianes, ranuras y receta originales. Catorce recorridos adicionales consiguen la evolución y derrotan la
  Muerte en los cuatro mapas con tienda y secretos disponibles preparados. Vida, daño, oleadas y premios conservados.
- **Sangre y Ceniza.** Aplicado el control aprobado: 1,5 s máximos y 1 s de resistencia para todas las fuentes.
  Sigilos cobran porcentajes de vida máxima y Astral 10 % (5 % con Sangre fría), con avisos y recargas correctos.
  Cinco regresiones, cuatro comprobaciones de botones, 21 expediciones completas y dos Infinito hasta resultado
  normal; no se declaró cerrado el balance de combinaciones, biomas y teléfonos.
- **Show: guardado fallido.** La ronda solo se marca guardada cuando se confirma la escritura. Final y salida
  esperan la escritura en curso y reintentan cuando falla. Un diario local conserva respuestas/calificaciones
  pendientes y las recupera al volver a abrir el Show, la cabina o el libro, únicamente en la casa de origen.
  No incluye monedas ni premios, por lo que reenviarlo no repite pagos. Una casa configurada no se sustituye por
  el libro suelto si falla la conexión. Si también falla el almacenamiento local, se avisa del error.
- **Pregunta diaria.** Las nuevas fechas tienen respuestas propias. Al agotarse las 229 candidatas, las respuestas
  de episodios anteriores no revelan la nueva pregunta ni habilitan su moneda. Las respuestas previas del libro
  y la pregunta en curso de partidas antiguas se conservan. Los días archivados guardan su copia; el libro
  distingue fechas aunque se repita el ID. El cobro comprueba fecha y respuestas actuales.
- **Cien Puertas.** Los estilos de los globos chico y del jugador vuelven a tener su tamaño propio. El narrador
  reserva espacio a ambos lados y no invade la puerta al esquivar botones. La revisión espera el registro de
  avance y estrellas, guarda su informe por nivel y comprueba la conservación al recargar. Se verificaron las
  cien puertas en orden, con semilla 0 y viewport 844×390: cero fallos y avance y estrellas de las cien puertas
  conservados tras recarga.
- **Cocina.** El día permanece pendiente hasta confirmar la escritura; los reintentos no vuelven a sumar puntos
  ni propinas. Empezar, continuar y salir esperan el guardado. Las compras conservan su copia pendiente y solo
  aplican coste y mejora al confirmar; un corte después de escribir no cobra otra vez. Días y compras se escriben
  en orden y se conservan los puntos del invitado si llega otro día mientras espera. La casa marca los premios
  por rol, restaurante y día para evitar pagos repetidos; se respeta el día pagado en partidas antiguas. Los
  errores de almacenamiento de amigos se propagan al motor. Once regresiones comprueban estos casos.
- **Cuarto de Juegos.** La barra tiene altura limitada y desplazamiento: añadir juegos ya no tapa la puerta de
  la granja. La comprobación verifica que los cuatro juegos de Astra siguen accesibles y que el toque de la puerta
  llega al lienzo. El modo opcional `DIBUJO_POR_CAPTURA=1` mantiene controles, movimiento y modelos activos y dibuja
  cada captura, sin dibujar entre ellas para evitar saturar una máquina sin GPU; no mide FPS.
- **Escudo.** Un error de escritura ya no permite abandonar el resultado como si estuviera guardado. Progreso y
  recibo P23 se conservan pendientes; continuar, niveles y salida reintentan antes de cambiar de pantalla. El recibo
  conserva su fecha y estrellas y no se vuelve a emitir cuando ya está confirmado. Atrás espera a que termine la
  transición de victoria/derrota. Doce comprobaciones del motor cubren la campaña de seis niveles con presupuesto
  normal, derrota, infinito hasta derrota natural y cuatro escenarios de guardado y separación de perfiles.
- **Desaparecidos de Astra.** Caso cerrado y pistas siguen pendientes si falla la escritura. Mesa, salida y atrás
  reintentan antes de abandonar la partida; el aviso permite recuperarla. Reiniciar sin espacio conserva el caso
  anterior y la referencia que utiliza el teléfono, sin borrar los otros casos. Cinco regresiones cubren estas
  situaciones. Los ocho casos se resuelven por sus botones, candados y pistas, sin habilitar contenido por ganchos.
- **Carreras.** La capa transparente del mando deja libre el botón de pausa. El `null` de un tiempo aún no logrado
  se lee como `Infinity`, conservando marcas válidas y permitiendo el primer contrarreloj después de una vuelta
  previa. La tarjeta muestra la mejor vuelta cuando todavía no hay marca completa. Récords, copas y ajustes
  fallidos quedan pendientes y se reintentan antes de avanzar, reiniciar o salir. El podio comprueba la escritura
  también al acabar su plazo automático; el aviso integrado en resultados no tapa el tiempo. Seis regresiones y
  cuatro carreras del motor comprueban estas condiciones, los puestos únicos y los puntos del Gran Premio.
- **Torneo.** Se completaron los seis rivales del arcade desde progreso nuevo con Tarek, utilizando entradas
  legales y los niveles originales. Se verificaron campeón, pausa y retorno al menú sin errores. Dieciocho
  combates y sus réplicas reciben entradas serializadas y conservan estado y resultado. No se cambiaron golpes,
  vida, daño, rondas ni dificultad; el piloto y el avance del director solo sirven para repetir estas pruebas.
- **Retrete.** La escritura confirma el vuelo y las monedas de la casa juntos. El recibo conserva el día y
  permite recuperar una respuesta perdida sin pagar otra vez. Vuelos, compras y cosméticos fallidos quedan
  pendientes; resultado y tienda esperan antes de avanzar, comprar o salir, con un botón de reintento. El
  adaptador de amigos devuelve el fallo al motor. «Atrás» en la casa usa los controles del Retrete y espera su
  guardado, en lugar de alcanzar la salida nativa de la app. Doce regresiones cubren rechazos, doble toque, copia estable,
  compras/misiones, pagos únicos, datos antiguos y el tope original por persona y día, incluso si se limpia el diario al cambiar de fecha.
- **Pruebas de motores.** `npm run probar:motores` comprueba partidas completas de Dados, Mancala, Cajas,
  Parchís, Parchís a dos colores y Clue; los dos jugadores pueden empezar y se recorren los niveles de IA.
  Se completaron 36 partidas. Cada movimiento se valida, se replica en otro estado y se serializa entre pasos; Mancala conserva sus 48
  semillas. Incluye once grupos de guardado/calendario/reglas del Show, once de Cocina y doce comprobaciones de
  Escudo, seis regresiones de Desaparecidos y ocho de Carreras, sus cuatro carreras clásicas, 96 carreras
  adicionales y 38 desafíos completos.
  Workflow: «Motores de los juegos».
  Incluye también los dieciocho combates y réplicas del Torneo y las doce regresiones del Retrete.

Las correcciones iniciales conservaron precios, puntuaciones, temporizadores, recompensas y dificultad. La retirada
de asistencia de Desaparecidos es un cambio solicitado expresamente por Javier el 15 de octubre. Los ajustes
aprobados de Sangre y Lavado se detallan por separado.

## Cobertura y límites

La comprobación específica de aturdimiento de Sangre y dificultad después del minuto 22 de Lavado está en
[pruebas de combate](pruebas-combate-lavado-sangre.md): 58 partidas de Lavado en cuatro escenarios normales,
series con mejoras pagadas y expediciones de Sangre con medición de golpes y control. En la revisión previa se reproduce
encadenamiento de aturdimiento de hasta 4,63 segundos en Caballero; Lavado conserva bajas y victorias después
del minuto 22. Javier aprobó y se aplica el límite de 1,5 s más 1 s de resistencia, y costes sobre vida máxima. Lavado corrige
la reutilización que duplicaba impactos: repetidas 58 partidas, 25 victorias. Javier aprobó y se aplicó el acceso a ambos aretes por mapa. Nuevas partidas consiguieron la evolución y
derrotaron a la Muerte en los cuatro, incluida Ducha. Las [builds al minuto 30](builds-lavado-minuto30.md) también
están registradas con rangos de tienda, cartas y patitos.

| Juego o sistema | Evidencia actual | Límites que permanecen |
|---|---|---|
| Dados, Mancala, Cajas, Parchís, Parchís a dos colores y Clue | Seis recorridos locales, 36 partidas de reglas/IA y seis partidas completas de sala con finales coincidentes; pausa/reconexión de Parchís y retorno | Controles físicos, red real y auditoría específica del aislamiento de manos privadas en Clue |
| Show | Tres episodios locales y uno en línea de 120 preguntas, premios únicos, libro/calendario, pérdida del 8 %, dos escrituras rechazadas recuperadas y estudio renderizado | Teléfonos físicos y cierre forzado mientras toda escritura falla |
| Granja | 48 suites y seis comprobaciones de integración correctas | Desarrollo pausado, incluidas campaña y capacidades planificadas |
| Lavado | Progresión nueva acumulada de 18 partidas: gana/desbloquea los cuatro mapas normales y paga 48 mejoras con gotas ganadas. Evolución y Muerte en los cuatro con perfiles preparados; bajas tras minuto 22, ocho regresiones de enemigos y doce de movimiento remoto, recorridos de sala | No todas las combinaciones/modos ni economía completa; la campaña nueva es simulación de motor, sin controles táctiles ni guardado de navegador |
| Sangre | Control aprobado 1,5 s + 1 s y sigilos sobre vida máxima. Se mantienen las expediciones e Infinito previos. Otras 21 expediciones con doce clases y cuatro biomas: 14 victorias de cinco etapas y siete derrotas; selección/arsenal preparados, compras pagadas | Adquisición ordinaria de todas las clases, combinaciones restantes, dispositivos y red real |
| Súper | 100 días desde cero, 80 compras por interfaz, recargas, guardado fallido recuperado y seis regresiones nuevas. Sala de tres con corte, retorno y cierre de escenario preparado | Victoria cooperativa ordinaria completa, teléfonos y cierre forzado cuando falla almacenamiento |
| Cien Puertas | 100 puertas con narrativa y recuerdos, álbum, estrellas, recarga y retorno; guardado fallido recuperado y cuatro regresiones nuevas. Sala con inventario, candados y reconexión en puertas seleccionadas | Otras semillas, campaña completa en pareja y sensores físicos |
| Escudo | Seis niveles desde cero en amigos y pareja; derrota, reintento, cancelación, salida, guardado y recarga. Amigos repite seis victorias de tres estrellas y 48 oleadas completas antes de derrota en Infinito. P23 conserva su resultado y retorno | Controles físicos, escenas completas, cierre forzado mientras falla almacenamiento; P23 desde desbloqueo real en granja pausada |
| Carreras | 16 pistas, cuatro copas, tres arenas, cuatro desafíos; 96 carreras y 38 desafíos de motor. Copas/desafíos en navegador y copa de cuatro carreras en dos pestañas con ocho inscritos constantes y podio idéntico | Teléfonos, internet real, demás criaturas. Desafíos nuevos locales; añadir salas sería ampliación |
| Desaparecidos | Ocho casos desde cero, 24 estrellas, 6.111 mensajes, 152 audios, apuntes manuales sin pistas automáticas, búsqueda/archivo y recarga; guardado fallido recuperado | Deducción humana sin conocer soluciones, Android y cierre forzado mientras falla almacenamiento |
| Torneo | Arcade completo con Tarek, 18 combates replicados y 400 cruces de los diez luchadores y cuatro dificultades. Dos jugadores locales en tres escenarios y sala con ambos resultados tras la corrección; cinco regresiones de red | Controles físicos e internet. Arcade de una sesión, sin guardado de etapa implementado |
| Retrete | Vuelos de amigos y casa, escudo pagado, pausas/salida, fallos recuperados sin repetir monedas, Atrás nativo simulado y recarga; descubrimiento desde casas nuevas con ambos personajes, comida pagada, baño, vuelo, retorno y recarga sin repetir premio | Sensores/controles físicos, ciclos avanzados, Supabase real y cierre forzado mientras falla almacenamiento |
| Cocina | Dos días locales desde cero y compra por receta. Fresas y Frappés añaden día 1 en pareja con ingredientes normales, medias 94/97, pérdida del 8 %, pausa, reconexión, premio único, guardado y retorno. Wafles conserva el escenario preparado anterior | Rangos avanzados, día ordinario completo de Wafles en pareja, precisión táctil y cierre forzado mientras falla almacenamiento |
| Casa | Cuidado, compras con sueldo ganado, habitaciones, mimos, decoración, regalos, trofeos y persistencia; energía preparada para dormir. Dos perfiles con compras/notas simultáneas, eventos recuperados una vez y álbum compartido | Teléfonos y Supabase real; la prueba de red usa servidor simulado |

Las compilaciones de pareja y amigos de la revisión final pasan. El filtro de amigos
revisó 578 archivos y no encontró contenido personal. Estas comprobaciones no certifican FPS, batería o memoria en Android real.
La integración de Escudo con la sala de cine remota (`fff42485`) conserva ambas compilaciones, las 48 suites de la
granja y las seis comprobaciones casa–granja sin errores. Los recorridos ya verificados de Escudo no se repiten
por esa integración, que no cambia sus archivos.

La primera tanda de mesa y Show se publicó en `78a034db`, y su registro adicional en `a3c4aa7e`, en `work` y
`claude/supermarket-mania-minigame-xn2it8`, con autorización explícita de Javier en este chat. Cocina, Cien Puertas y
la barra de la casa están publicadas en ambas ramas hasta `25445e2d`, incluyendo los cuatro juegos nuevos de Astra.
Escudo y su integración con la sala de cine están publicados en ambas ramas hasta `960e228f`.
Desaparecidos y sus ocho casos verificados están publicados en ambas ramas en `9d36ea65`.
Carreras, sus récords compatibles, pausa y resultados pendientes están publicados en ambas ramas en `a284dd0d`.
Torneo y su arcade completo están publicados en ambas ramas en `b05f942f`.
La tanda del Retrete del 14 de octubre conserva ambas compilaciones, el filtro de amigos (546 archivos), las
48 suites de granja y las seis comprobaciones casa–granja sin errores. Pasan las doce regresiones de guardado,
el recorrido de amigos con compra pagada y fallos recuperados, y los vuelos de la casa local con Atrás nativo
simulado, pago confirmado, retorno y recarga. No certifica un dispositivo Android ni Supabase real.
La tanda de Sangre/Lavado está publicada en ambas ramas en `76ac6b07741cd067bb010c52aefba0749a73c710`:
control y porcentajes aprobados, reciclaje corregido, partidas repetidas y propuesta de aretes aún sin aplicar
en aquella tanda. La continuación aprobada añade ambos aretes en los cuatro mapas y comprueba receta, guardianes,
ranuras y red. Catorce recorridos con tienda/secretos preparados consiguieron evolución y derrotaron a la Muerte
en los cuatro; cuatro replays registran las builds exactas solicitadas. Pasan ambas compilaciones, el filtro de
amigos, ocho regresiones de Lavado, 48 suites de granja y seis comprobaciones casa–granja. En amigos se verificaron
los ocho hallazgos dibujados y recogidos en cuatro contextos aislados, con acceso y posiciones preparados.
Ambas ramas se confirmaron con ese SHA y el árbol de trabajo quedó limpio.
La APK sigue bloqueada en las comprobaciones de esta revisión, repetidas el 15 de octubre con el cierre del Show
y los teléfonos de Astra: no se creó una ejecución
automática para ese SHA y el intento de iniciar `apk.yml` devolvió **HTTP 422: Actions has been disabled for this
user**. El workflow figura activo, pero la cuenta no puede ejecutarlo. No se anuncia una APK nueva ni se confunden
los instaladores anteriores con estas correcciones. Requiere reactivar Actions en la cuenta y repetir la compilación.

El cierre del 16 de octubre se publicó como `3b83c2d9cd91fa0bada12b09f002538856b4aefb` en ambas ramas.
Consulta de `apk.yml` para ese SHA: sin ejecuciones. Despacho manual de nuevo rechazado con **HTTP 422:
Actions has been disabled for this user**. El código está publicado, pero sigue sin generarse una APK con estas
correcciones. La cuenta debe recuperar Actions para repetir el workflow.

## Criterio de cierre por juego

1. Empezar con progreso nuevo en un contexto aislado, sin tocar la partida de Javier.
2. Llegar al resultado final mediante acciones legales; en juegos abiertos, completar un ciclo normal y volver.
3. Comprobar que desbloqueos y recursos se obtienen jugando, sin preparación de partidas.
4. Guardar, cerrar, reabrir y continuar; un cobro o entrega no se repite.
5. Probar derrota/cancelación, pausa, reconexión y almacenamiento lleno cuando corresponda.
6. Repetir la versión de amigos y el modo en pareja cuando estén disponibles.
7. Registrar fallos funcionales, correcciones y resultados. Las propuestas de balance llevan aprobación explícita.

**Estado:** revisión automatizada terminada con los alcances y límites registrados arriba y en la verificación general.
Las comprobaciones adicionales fueron descartadas por Javier. Se conservan los límites de lo probado; no se declara perfección ni cobertura de todas las combinaciones.

## Cómo repetir esta tanda

Desde `juego/web/`:

```sh
npm run probar:motores
npm run probar:granja
npm run build
npm run build:amigos
# Servir dist completo y usar un navegador instalado si no está el de Playwright:
CHROME_PATH=/usr/bin/chromium node scripts/probar-show.mjs http://127.0.0.1:4182/mesa.html /tmp/show-local
CHROME_PATH=/usr/bin/chromium FALLAR_GUARDADOS=2 node scripts/probar-show-linea.mjs http://127.0.0.1:4182/mesa.html /tmp/show-linea
CHROME_PATH=/usr/bin/chromium node scripts/probar-mesa-recorridos.mjs http://127.0.0.1:4182/ /tmp/mesa-recorridos
CHROME_PATH=/usr/bin/chromium PUERTO=4182 node scripts/revisar-puertas.mjs 1 100 --semillas=0 --carpeta=/tmp/puertas
CHROME_PATH=/usr/bin/chromium node scripts/probar-cocina-recorridos.mjs http://127.0.0.1:4182/ /tmp/cocina
CHROME_PATH=/usr/bin/chromium node scripts/probar-retrete-recorrido.mjs http://127.0.0.1:4182/ /tmp/retrete
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-retrete-recorrido.mjs http://127.0.0.1:4184/ /tmp/retrete-amigos
CHROME_PATH=/usr/bin/chromium node scripts/probar-retrete-casa.mjs http://127.0.0.1:4182/ /tmp/retrete-casa
CHROME_PATH=/usr/bin/chromium AMIGO=0 FALLOS=1 node scripts/probar-escudo-recorrido.mjs http://127.0.0.1:4182/ /tmp/escudo-pareja
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-escudo-recorrido.mjs http://127.0.0.1:4184/ /tmp/escudo-amigos
CHROME_PATH=/usr/bin/chromium node scripts/probar-escudo-mision.mjs http://127.0.0.1:4182/ /tmp/escudo-p23
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-celular-recorrido.mjs http://127.0.0.1:4184/ /tmp/celular-amigos
CHROME_PATH=/usr/bin/chromium AMIGO=0 HASTA=1 FALLOS=1 node scripts/probar-celular-recorrido.mjs http://127.0.0.1:4182/ /tmp/celular-casa
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-carreras-recorrido.mjs http://127.0.0.1:4184/ /tmp/carreras-amigos
CHROME_PATH=/usr/bin/chromium AMIGO=0 GRAN_PREMIO=0 FALLOS=1 node scripts/probar-carreras-recorrido.mjs http://127.0.0.1:4182/ /tmp/carreras-casa
CHROME_PATH=/usr/bin/chromium node scripts/probar-peleas-arcade.mjs http://127.0.0.1:4184/ /tmp/peleas-arcade
# La prueba en pareja requiere el servidor de desarrollo sin HMR y usa una red falsa:
CHROME_PATH=/usr/bin/chromium node scripts/probar-cocina-linea.mjs wafles http://127.0.0.1:4183/scripts/cocina-prueba.html /tmp/cocina-linea
```

Ejecutar los recorridos de navegador de a uno y terminar de compilar antes de abrirlos. Cada script utiliza
contextos nuevos; no se ejecuta contra la cuenta o las partidas reales de Javier.
