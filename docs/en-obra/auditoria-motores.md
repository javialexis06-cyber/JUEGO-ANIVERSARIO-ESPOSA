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
- **Pruebas de motores.** `npm run probar:motores` comprueba partidas completas de Dados, Mancala, Cajas,
  Parchís, Parchís a dos colores y Clue; los dos jugadores pueden empezar y se recorren los niveles de IA.
  Se completaron 36 partidas. Cada movimiento se valida, se replica en otro estado y se serializa entre pasos; Mancala conserva sus 48
  semillas. Incluye siete regresiones de guardado/calendario del Show, once de Cocina y doce comprobaciones de
  Escudo. Workflow: «Motores de los juegos».

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
| La Carrera de las Tres Lunas | Juego integrado desde la rama compartida (`f3475efa`, 14 de octubre) | Carrera completa y campeonato desde cero, controles, recarga, pausa y verificación propia de la red |
| Desaparecidos de Astra | Ocho casos incorporados desde la rama compartida (`0e0f074e`, 14 de octubre) | Resolver los ocho casos desde cero, candados, estrellas, voz, persistencia y retorno |
| El Torneo del Despertar Dorado | Juego integrado desde la rama compartida (`12c8bf29`, 14 de octubre), conservando sus reglas y valores | Combate y torneo completo desde cero, controles de ambos lados, derrota, pausa y verificación propia de la red |
| Retrete espacial | Dos vuelos desde cero con piloto, choques normales, pausa, volver a volar, escudo pagado con 120 rollitos ganados y progreso conservado tras recarga; sin errores | Sensores/controles físicos, ciclos avanzados, guardado fallido y premio de la casa |
| Cocina de chef: wafles, frappés y fresas | Dos días desde progreso nuevo por receta, con pedidos y estaciones normales, resultado, propinas, mejoras pagadas y recarga en día 3; dos fallos de escritura al terminar wafles y uno por compra recuperados; once regresiones de persistencia. Wafles en pareja: escenario preparado con pérdida del 8 % de mensajes, pausa, segundo plano, reconexión, mismo resultado y premio del anfitrión, sin errores | Fresas y frappés en pareja, rangos avanzados, cierre forzado mientras hay una escritura pendiente y precisión táctil |
| Casa / mascota virtual | Entrada, retorno y persistencia del recorrido de granja comprobados | Ciclo completo de cuidado, compras, habitaciones, trofeos y sincronización en dos perfiles |

Las compilaciones de pareja y amigos integradas con los cuatro juegos nuevos de Astra pasan. El filtro de amigos
revisó 546 archivos y no encontró contenido personal. Estas comprobaciones no certifican FPS, batería o memoria en Android real.

La primera tanda de mesa y Show se publicó en `78a034db`, y su registro adicional en `a3c4aa7e`, en `work` y
`claude/supermarket-mania-minigame-xn2it8`, con autorización explícita de Javier en este chat. Cocina, Cien Puertas y
la barra de la casa están publicadas en ambas ramas hasta `25445e2d`, incluyendo los cuatro juegos nuevos de Astra.
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
CHROME_PATH=/usr/bin/chromium AMIGO=0 FALLOS=1 node scripts/probar-escudo-recorrido.mjs http://127.0.0.1:4182/ /tmp/escudo-pareja
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-escudo-recorrido.mjs http://127.0.0.1:4184/ /tmp/escudo-amigos
CHROME_PATH=/usr/bin/chromium node scripts/probar-escudo-mision.mjs http://127.0.0.1:4182/ /tmp/escudo-p23
# La prueba en pareja requiere el servidor de desarrollo sin HMR y usa una red falsa:
CHROME_PATH=/usr/bin/chromium node scripts/probar-cocina-linea.mjs wafles http://127.0.0.1:4183/scripts/cocina-prueba.html /tmp/cocina-linea
```

Ejecutar los recorridos de navegador de a uno y terminar de compilar antes de abrirlos. Cada script utiliza
contextos nuevos; no se ejecuta contra la cuenta o las partidas reales de Javier.
