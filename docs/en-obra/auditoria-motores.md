# Motor y partidas completas: seguimiento de verificación

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

## Correcciones comprobadas

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
  semillas. Incluye siete regresiones de guardado/calendario del Show, once de Cocina y doce comprobaciones de
  Escudo, cinco regresiones de Desaparecidos y seis de Carreras más sus cuatro carreras completas.
  Workflow: «Motores de los juegos».
  Incluye también los dieciocho combates y réplicas del Torneo y las doce regresiones del Retrete.

No se cambiaron precios, puntuaciones, temporizadores, recompensas ni dificultad.

## Cobertura y límites

| Juego o sistema | Evidencia obtenida en esta revisión | Lo que falta para cerrar su recorrido |
|---|---|---|
| Dados Party | Reglas e IA y recorrido de navegador inicio → resultado → menú (37 s) | Precisión física de controles, persistencia, pausa y red |
| Mancala | Reglas e IA sin perder semillas y recorrido de navegador completo (6 s) | Controles físicos y red |
| Puntos y Cajas | Reglas e IA y recorrido de navegador completo (6 s) | Controles físicos y red |
| Parchís | Reglas e IA y recorrido de navegador hasta meta y menú (93 s) | Controles físicos del dado, pausa y red |
| Parchís a dos colores | Reglas e IA y recorrido de navegador hasta meta y menú (340 s) | Controles físicos de dos dados y red |
| Clue / ¿Quién fue? | Reglas e IA hasta acusación legal y recorrido de navegador completo (11 s) | Recorrido táctil completo y cartas privadas en red |
| El Show de Nosotros | Tres episodios locales y uno en línea completo; pausa, pérdida de mensajes, dos fallos de guardado, conflictos resueltos, mismo resultado y un episodio en el libro; sin errores | Todas las escenas y controles en dispositivos |
| Granja / Astra | Las 48 suites pasan. Seis comprobaciones de navegador casa–granja, inventario, correo, retorno y recarga sin errores | Campaña por controles normales desde cero; cerrar capacidades pendientes de la auditoría vigente y probar dispositivos |
| Lavarse la cara | Doce partidas simuladas desde cero en «cara», con compras pagadas y varias victorias de 30 minutos | Final de la Ducha Helada, demás escenarios y capítulos, controles táctiles, pausa y red |
| Sangre y Ceniza | Expedición simulada de cinco etapas y victoria en cementerio, monarca, peligro 1; perfil preparado, sin experiencia/equipo previo | Perfil desbloqueado desde cero, demás biomas, jefe final, controles y red |
| Súper Manía | Primer día desde progreso nuevo hasta resultado en navegador: tres estrellas, nueve clientes atendidos, ganancia 98 y ningún error | Campaña desde cero; comprobar mejoras pagadas, días avanzados y recarga |
| Cien Puertas | Cien acertijos resueltos en orden por toques/sensores simulados; cero fallos de revisión de puerta/objetos/página; cien avances y estrellas conservados al recargar | Campaña narrativa, retorno a la casa, red, otras semillas y sensores físicos de teléfono |
| El Escudo de las Hermanas | Seis niveles desde cero en amigos y pareja, con presupuesto normal, pausa, guardado fallido recuperado y recarga por nivel; doce comprobaciones del motor, derrota e infinito hasta pérdida natural (41 oleadas en motor, 48 en el último recorrido de pareja). Derrota normal, reintento, cancelación y salida de pareja conservan las estrellas. Modo P23: victoria, recibo fallido recuperado y retorno a la granja sin errores | Controles físicos, escenas completas, cierre forzado mientras falla almacenamiento y recorrido de P23 desde su desbloqueo real en la campaña de la granja; derrota y salida de amigos en navegador |
| La Carrera de las Tres Lunas | Carrera normal, contrarreloj y Gran Premio de cuatro pistas desde cero en «Carrera»; tres vueltas por pista, pausa real, puntos conservados, copa ganada y dos fallos de escritura recuperados. Récord, muestras del fantasma y copa única conservados al recargar. Carrera, contrarreloj y retorno a casa en edición de pareja; sin errores | Precisión física, repetición visible del fantasma, otras criaturas/dificultades y verificación propia de la red |
| Desaparecidos de Astra | Ocho casos resueltos desde cero en amigos: 24 estrellas, PIN, palabras, patrones arrastrados, fotos con linterna, todas las pistas importantes y recarga por caso; primer cierre fallido recuperado. Primer caso y retorno a casa en compilación completa. Cinco regresiones de guardado y reinicio; sin errores | Reproducción completa de las voces y escenas, controles en Android, salida de amigos por controles y cierre forzado mientras falla el almacenamiento |
| El Torneo del Despertar Dorado | Arcade completo desde cero con Tarek: seis rivales a sus niveles originales, campeón, pausa y retorno al menú sin errores; dieciocho combates de motor con tres luchadores, derrota y réplicas por entradas serializadas | Otros luchadores y escenarios por controles físicos, dos jugadores en el aparato y verificación propia de la red; el arcade no tiene guardado de etapa implementado |
| Retrete espacial | Amigos: dos vuelos desde cero con piloto, choques normales, pausa, otra salida, escudo pagado con 120 rollitos ganados, fallos al aterrizar/comprar recuperados, recarga y retorno a la sala. Casa local: ruta nativa de Atrás simulada en navegador y dos vuelos normales con acceso preparado, rechazo de escritura y respuesta perdida después de pagar, reintentos sin repetir monedas, retorno y recarga. Doce regresiones de persistencia | Descubrimiento desde el baño, sensores/controles físicos, ciclos avanzados, Supabase real y cierre forzado mientras falla el almacenamiento |
| Cocina de chef: wafles, frappés y fresas | Dos días desde progreso nuevo por receta, con pedidos y estaciones normales, resultado, propinas, mejoras pagadas y recarga en día 3; dos fallos de escritura al terminar wafles y uno por compra recuperados; once regresiones de persistencia. Wafles en pareja: escenario preparado con pérdida del 8 % de mensajes, pausa, segundo plano, reconexión, mismo resultado y premio del anfitrión, sin errores | Fresas y frappés en pareja, rangos avanzados, cierre forzado mientras hay una escritura pendiente y precisión táctil |
| Casa / mascota virtual | Entrada, retorno y persistencia del recorrido de granja comprobados | Ciclo completo de cuidado, compras, habitaciones, trofeos y sincronización en dos perfiles |

Las compilaciones de pareja y amigos integradas con los cuatro juegos nuevos de Astra pasan. El filtro de amigos
revisó 546 archivos y no encontró contenido personal. Estas comprobaciones no certifican FPS, batería o memoria en Android real.
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
La APK sigue bloqueada al comprobar también ese SHA el 14 de octubre: no se creó una ejecución
automática para ese SHA y el intento de iniciar `apk.yml` devolvió **HTTP 422: Actions has been disabled for this
user**. El workflow figura activo, pero la cuenta no puede ejecutarlo. No se anuncia una APK nueva ni se confunden
los instaladores anteriores con estas correcciones. Requiere reactivar Actions en la cuenta y repetir la compilación.

## Criterio de cierre por juego

1. Empezar con progreso nuevo en un contexto aislado, sin tocar la partida de Javier.
2. Llegar al resultado final mediante acciones legales; en juegos abiertos, completar un ciclo normal y volver.
3. Comprobar que desbloqueos y recursos se obtienen jugando, sin preparación de partidas.
4. Guardar, cerrar, reabrir y continuar; un cobro o entrega no se repite.
5. Probar derrota/cancelación, pausa, reconexión y almacenamiento lleno cuando corresponda.
6. Repetir la versión de amigos y el modo en pareja cuando estén disponibles.
7. Registrar fallos funcionales, correcciones y resultados. Las propuestas de balance llevan aprobación explícita.

**Estado:** auditoría en curso. No está certificado que todos los juegos estén terminados o perfectos.

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
