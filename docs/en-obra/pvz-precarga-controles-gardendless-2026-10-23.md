# Gardendless · precarga de campos y siembra

Pedido del 23 de octubre: conservar por ahora el arte, las animaciones y el audio originales de Gardendless;
preparar los campos en paralelo y permitir arrastrar/soltar además de seleccionar/colocar con dos clics o toques.
Continúa el [primer sector de historia nativa](pvz-historia-nativa.md). No cambia estadísticas, costes ni recompensas.

## Carga y conservación

Los dos campos del sector se preparan desde el tutorial de Dave y el mapa, en paralelo. Prepararlos no inicia
ataques, desbloquea semillas ni escribe progreso. Se precargan las seis plantas del sector y se presenta un
cuadro nativo fuera de vista para terminar la preparación gráfica antes de anunciar que el campo está listo.
Durante la preparación inicial el jugador conserva el tutorial/mapa; los botones de entrada se habilitan al
estar disponibles. Se elimina la pantalla que tapaba el juego para preparar una defensa.

Cada zona mantiene su iframe, sesión y motor. Cambiar de frente los reutiliza. Tras una victoria o un cambio
de formación, se prepara en segundo plano la siguiente defensa con su punto conservado, sin detener al otro
frente activo. El inicio actualiza la composición de oleadas del ataque y habilita el reloj del campo preparado.
Las operaciones de cada zona se ordenan para que abrirla no compita con su preparación; otras zonas
continúan en paralelo. Volver de la inspección de una defensa en descanso a un ataque tampoco exige reiniciar el motor.

Las superficies ocultas conservan su disposición gráfica, quedan transparentes e inertes y omiten dibujar
durante la simulación fuera de vista. Su preparación no se deja pendiente hasta el primer clic para entrar.
El audio permanece nativo: la preparación está silenciada y el campo observado reproduce sus sonidos.

La caché compartida reúne solicitudes simultáneas del mismo recurso público fijado: descarga una vez y
entrega una respuesta independiente a cada campo. Un fallo libera esa solicitud para permitir reintentar.
Las partidas, otros sitios y las solicitudes parciales de audio quedan fuera de esta caché.

**La primera descarga no es instantánea.** Depende de red, recursos almacenados y dispositivo. La mejora
elimina volver a arrancar el motor para cada ataque y prepara los campos antes de entrar; no descarga la
campaña completa de 1,3 GiB ni construye mundos posteriores al sector actual.

## Dos formas de plantar

Una misma entrada gestiona ratón y táctil: pulsar una semilla la selecciona; moverla y soltarla sobre una
casilla intenta plantarla. Soltar sin arrastrar conserva la selección para colocar con el siguiente clic/toque.
La mano, el resaltado, el coste, las recargas y la siembra los ejecutan las acciones originales de Gardendless.
La disponibilidad de una carta sigue siendo la nativa; un gesto no elimina su espera ni su coste.

Se evita procesar otra vez la entrada compatible de ratón/táctil que recibe Cocos. Soltar fuera del tablero
o sobre una casilla inválida cancela el arrastre; no quita la planta existente ni cobra una siembra inválida.
Interrumpir el puntero, cambiar de ventana o pulsar Escape durante el gesto lo cancela.
El mismo adaptador funciona en el minijuego original, conservando sus menús, pala y reglas.

## Comprobación

- `npm run probar:pvz:precarga-entrada`: navegador con Cocos real, dos campos simultáneos, entrada sin
  recrear escena/iframe, arrastre de ratón/táctil, dos clics/toques y sueltas inválidas. Registra costes cobrados
  por el propio motor y distingue los soles recogidos durante la prueba. Espera las recargas originales.
- `npm run probar:pvz:cache-nativa`: tres casos preparados de concurrencia de descargas, reintento tras
  fallo y exclusión de partidas/audio parcial. No es una prueba de campaña.
- `npm run probar:pvz:cola-nativa`: dos casos preparados de ordenación por zona, paralelismo entre campos y
  continuidad después de una operación rechazada.
- `npm run probar:pvz:reutilizacion`: dos reconstrucciones sobre un punto real conservado, con el mundo
  pausado; comprueba plantas, vida y sesión del motor sin errores de sombras.
- `npm run probar:pvz:coordinacion-precarga`: caso de navegador con el coordinador real y transporte
  preparado que retiene un inicio. Comprueba que el otro frente avanza y que la pausa también alcanza al
  campo que termina de iniciar después. No simula una victoria nativa.
- Los controles de historia revisan importación, daño conservado, bloqueo de pestañas y recuperación de
  ataques. Un ataque interrumpido sigue requiriendo repetirlo desde su inicio; esta precarga no es un guardado
  completo de una batalla activa.

Las medidas pertenecen a Chromium con dibujo por software y un viewport de 640 × 360. No certifican FPS,
tiempo de descarga ni latencia de un teléfono. Los resultados finales se registran al cerrar la comprobación.


## Evidencia de cierre

La pasada sobre compilaciones completas pasó **14 comprobaciones de entrada**: siete con ratón en pareja y
siete táctiles en amigos, sin errores de página ni recursos fallidos. Los dos campos iniciaron su preparación
en paralelo y conservaron iframe, sesión y escena al entrar y cambiar de vista. El tiempo desde el clic hasta
la entrada al campo preparado fue de **26,2 ms** y **29,4 ms** en esta máquina; la preparación inicial en frío
necesitó aproximadamente **65,2 s** y **58,2 s**. Son medidas de este entorno, no tiempos prometidos de móvil.

Pasaron **11 controles de guardado en pareja y 11 en amigos**, incluida la planta del caso preparado con
13 de vida, importación/cancelación, exportación, bloqueo de pestañas, cuota y recuperación explícita de un
ataque. Los minijuegos originales conservaron sus siete controles: PvZ 2 con siembra real; Portable con
arranque WASM y persistencia preparada, cuyo combate sigue pendiente de recursos compatibles.

El sector se comprobó continuando puntos ganados realmente: la expedición conquistó la estación mientras
la casa avanzaba fuera de vista. La defensa pendiente se recuperó expresamente y terminó con ambas zonas
propias y sin ataques pendientes. La recuperación pasó sus cuatro controles finales, conservó las sesiones
de ambos motores y recargó plantas/vida exactas, sin errores de página o recursos. No se presenta como una
partida ininterrumpida de toda la campaña.

El caso nativo de reutilización pasó tres controles con dos reconstrucciones del mismo campo. Se adoptó el
ciclo de reinicio de Gardendless, incluida la liberación de actores y animaciones de la escena anterior, para
resolver referencias a sombras destruidas. La caché compartida pasó tres casos preparados y la cola por zona,
dos. El coordinador pasó otros dos casos preparados tanto en desarrollo como sobre el build: un inicio lento
no detiene la expedición y la pausa global también alcanza al campo que termina de iniciar después.

Las regresiones generales de motores y las 48 suites existentes de granja pasan. Ambas compilaciones pasan;
el filtro de amigos revisó 662 archivos y los 52 archivos locales de motores/adaptadores coinciden con sus
hashes. La granja permanece congelada y el catálogo/mundos posteriores continúan fuera de este avance.

La integración final del build completo pasó sus seis controles, con un navegador aislado y sin otros
recorridos simultáneos: acceso, movimiento, buzón, inventario, ida/vuelta y recarga.
