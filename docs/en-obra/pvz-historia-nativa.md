# Historia · primer sector con Gardendless

> Estado posterior: el pedido del 24 de octubre extiende el motor a [las doce zonas del mapa](pvz-mapa-nativo-2026-10-24.md), con compatibilidad de los puntos V3. Este documento conserva la evidencia y límites del primer sector.

23 de octubre de 2026. Continúa la [integración de motores originales](pvz-motores-originales-2026-10-23.md).
Javier pidió conectar la historia para poder probarla antes de decidir cómo continuar. Aprobó expresamente
usar el balance original de Gardendless; [propuesta aprobada](pvz-historia-nativa-propuesta.md).

## Cómo probarlo

Entrar al Jardín y pulsar **Historia** (`jardin.html?modo=historia`). Dave presenta el inicio. Defender La casa,
volver al mapa, tocar Estación vieja y preparar su formación antes de iniciar la expedición. Al explorarla se
encuentran Repetidora y Patatapum. Las espadas permiten volver al frente atacado desde cualquier vista.

El tramo termina cuando casa y estación están a salvo y no quedan ataques activos. Los otros territorios y
los mapas de país/mundo siguen visibles, pero sus expediciones están cerradas para revisar primero esta base.
No se han añadido mundos ni se presenta este sector como la campaña completa.

**Minijuegos → Historia anterior · V2** (`modo=historia-v2`) conserva la historia anterior, sus doce escenarios,
reglas y guardados. Los minijuegos PvZ 1, PvZ 2, aventura, patios y versus se mantienen separados. La prueba
`modo=prueba-frente` sigue abriendo el tutorial nativo independiente.

## Combate y frentes

El combate real lo ejecuta Cocos/Gardendless 0.16.0: animaciones originales, siembra, soles, daño, proyectiles,
recargas, oleadas, cortacéspedes y habilidades. La adaptación no reemplaza estos sistemas por contadores ni
por un piloto. Usa `KeyListener.GoToGame` con una definición de nivel propia y los datos originales del motor.

- Casa: cinco carriles, 150 soles al empezar sin una defensa anterior, Lanzaguisantes/Girasol/Nuez/Petacereza,
  seis oleadas del escenario existente. El básico original tiene 190 de vida y el sol normal vale 50.
- Estación: cuatro carriles activos; el quinto está cerrado visual y mecánicamente. Ocho oleadas del escenario
  existente, con introducción del caracono. No equivale a soportar todavía tableros nativos de seis/siete carriles.
- Cada tipo completo solo puede reservarse a una zona. Su traslado en descanso retira los ejemplares del
  origen sin reembolso. Las reservas de una zona que combate no pueden modificarse.
- Ganar la casa habilita las expediciones y la presión estratégica. Se conserva el primer contraataque a los
  35 segundos y las comprobaciones posteriores cada 38 segundos del reloj estratégico existente.
- Casa y estación mantienen instancias nativas independientes. Al cambiar de vista no se cierran, no se
  reconstruyen ni se elimina el daño. El coordinador les entrega los mismos pasos de 1/60 s; el frente oculto
  simula y omite dibujar. Los dos campos se preparan en paralelo desde el tutorial/mapa, sin iniciar ataques.
  Cada zona conserva su motor entre combates; la preparación de una defensa en descanso no detiene los
  otros frentes. Entrar a una defensa preparada reutiliza su escena.
- La pausa, incluido el teclado nativo, detiene todos los frentes. Cambiar de pestaña activa esa pausa. El
  acelerador del minijuego no controla el reloj de la historia; el minijuego conserva su comportamiento propio.

El arranque espera los catálogos de unidades y terreno, además del menú nativo: la escena podía estar lista
antes que los datos, lo que hacía fallar la carga del jardín. La historia fija la frecuencia de paso en 60:
la preferencia nativa «sin límite» daba un delta cero al usar `game.step()`. No se altera el reloj del minijuego.

## Guardado: puntos entre combates

Claves nuevas: `conquista-historia-nativa-v3` y `amigo-conquista-historia-nativa-v3`. No se convierten ni se
sobrescriben los guardados V2. El perfil de cada instancia de combate vive en memoria y sus bases auxiliares
usan el prefijo temporal de su sesión; no consume las compras del minijuego PvZ 2.

Una victoria confirma su ataque una sola vez y guarda territorio, reservas, plantas con su vida restante,
soles depositados, recargas, temporizadores compatibles de las seis plantas y cortacéspedes disponibles.
La defensa reaparece al siguiente ataque sin regenerar la vida. El guardado compara el archivo anterior
antes de escribir y emplea un bloqueo de pestaña cuando está disponible. Un archivo incompatible se conserva.
Se puede exportar e importar una historia nativa entre combates; la importación valida y pide confirmar
antes de reemplazar el archivo del perfil actual. Cancelar no escribe.

**No hay instantánea completa de una batalla activa.** Los proyectiles, zombis y eventos intermedios no se
serializan. Cerrar durante una batalla avisa; al volver aparece «Una defensa quedó interrumpida» y el jugador
debe elegir repetir los ataques pendientes desde su inicio. Se conservan las zonas ya ganadas y sus últimos
puntos de descanso. No se otorga una victoria, se cura una planta ni se anuncia una reanudación exacta.
La salida voluntaria durante ataques remite al mapa; una derrota de la casa termina esta historia.

## Arte, audio y trabajo restante

Este avance conecta el motor y las formaciones con los mapas ilustrados y croquis del territorio, baraja de
selección y botones redondos. El combate usa por ahora los gráficos, animaciones y audio originales de
Gardendless. Javier pidió mantener esta presentación nativa por ahora; la adaptación del arte propio y ElevenLabs queda pausada; los 253
audios continúan funcionando en V2 y en la aventura anterior. El texto interno de Gardendless no está traducido
íntegramente al español.

Quedan la instantánea completa a mitad de combate, migración explícita de V2, carriles físicos de más de cinco,
terrenos regionales, catálogo territorial completo, arte propio sobre sus esqueletos y el versus adaptado. PvZ 1
sigue pendiente de recursos compatibles sin exigir archivos al jugador. No cerrar esas tareas por esta conexión.

## Comprobación reproducible

`npm run probar:pvz:historia-nativa` comprueba ocho casos estratégicos preparados: composiciones, exclusividad,
victoria idempotente, vida dañada, dos ataques, pausa, archivos inválidos y escritura concurrente. No es una
prueba de combate nativo.

`npm run probar:pvz:historia-nativa-navegador` juega por ratón sobre el motor real, con soles y recargas normales,
y escribe capturas y resultado en `test-results/historia-nativa/`. Comprueba casa → mapa → estación, avance del
frente oculto, pausa global, reservas, confirmación territorial y recuperación de una defensa terminada.
La prueba no concede recursos ni acelera el reloj y no certifica rendimiento en un teléfono.


### Evidencia del primer sector

El recorrido real de casa → estación se completó en varias sesiones de navegador, continuando sus propios
puntos ganados. No se concedieron soles, plantas ni victorias al motor:

- Primera casa ganada con ratón, soles y recargas originales: 17 plantas y los cinco cortacéspedes disponibles.
- Expedición nativa ganada en los cuatro carriles activos de la estación: cinco Repetidoras, cuatro Patatapum
  desarrolladas, 50 soles y cuatro cortacéspedes. La casa siguió avanzando mientras se veía la expedición.
- Tras continuar explícitamente el ataque que quedó pendiente, la defensa nativa de la casa alcanzó victoria
  en la sexta oleada a los 89,7067 s de combate. El sector quedó con ambas zonas propias y ningún ataque
  pendiente: 17 plantas y 200 soles en casa, nueve plantas y 50 soles en estación. Es la finalización de ese
  tramo mediante recuperación entre sesiones, no una prueba continua de toda la campaña.
- La repetición automatizada final pasó sus tres comprobaciones: abrió el frente activo, terminó el ataque
  y recargó las defensas con la misma vida. Su piloto recogió 1.050 soles en casa; la estación conservó 50.
  No hubo errores de página ni recursos fallidos.

La prueba de controles usa una copia del punto real ganado y reduce a 13 la vida de una planta para verificar
que la restauración nativa no la cura. Ese daño es un caso preparado de persistencia, no otra partida ganada.
El script también revisa importación, exportación, bloqueo de otra pestaña, escritura fallida, archivos futuros,
pausa global y el aviso obligatorio al recargar un ataque.

En este entorno Chromium usa dibujo por software. `DIBUJO_POR_CAPTURA=1` permite omitir dibujos entre capturas
en el recorrido de combate; conserva pasos, oleadas, recursos e interacción. Los tiempos de espera de entrada
incluyen la preparación gráfica de una vista que estaba oculta. Ninguna de estas pruebas certifica fluidez
ni tiempos de carga de un teléfono; los recursos nativos no almacenados siguen necesitando conexión.


Cierre de controles sobre los builds completos: **11 comprobaciones de pareja y 11 de amigos**, ambas sin
errores de página ni recursos fallidos. Incluyen volver al mismo frente en descanso sin avanzar su reloj ni
regenerar sus plantas. La revisión horizontal corrigió una etiqueta de frente oculto que desbordaba 12 píxeles.
Las dos compilaciones pasan; el filtro de amigos revisó 661 archivos sin encontrar contenido de la pareja.
La regresión general de motores y las 48 suites existentes de granja pasan; no se modificó la granja.

Los minijuegos originales pasaron siete controles (siembra real de PvZ 2; arranque y persistencia preparada de
Portable, cuyo combate sigue pendiente de recursos). V2 pasó ocho controles de inicio, pala, selección,
croquis y conservación de la derrota. Estas regresiones conservan las entradas anteriores mientras se revisa
el primer sector nativo.

La comprobación de integración del build completo pasó sus seis controles, en un contexto aislado y sin
otras pruebas de navegador simultáneas: acceso, movimiento, buzón, inventario, ida/vuelta y recarga.

La mejora posterior de [precarga y controles nativos](pvz-precarga-controles-gardendless-2026-10-23.md) conserva
los motores entre ataques y añade arrastre/táctil junto con los dos clics originales.
