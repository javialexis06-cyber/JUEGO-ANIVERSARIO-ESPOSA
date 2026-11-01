# Un ratito en el patio

Página `juego/web/mente.html`, código `src/mente/`. Se abre desde el patio de la mascota y desde la Sala de Juegos
de amigos. Son juegos de ocio que practican memoria, atención, lenguaje y lógica; sus marcas no evalúan salud ni
se anuncian como prevención de enfermedades. No dan recursos de la casa ni modifican su balance.

## Los veintidós juegos

Dieciséis desde el 16 de octubre y seis nuevos desde el 1 de noviembre de 2026, cuando Javier pidió más tipos de
juego y mucho más trabajo visual. Cada juego pertenece a una categoría con su color: Memoria, Atención, Lógica,
Números, Palabras y Espacio y planificación.

| Juego | Categoría | Mecánica |
|---|---|---|
| Parejas del jardín | Memoria | Ocho parejas en dieciséis cartas. |
| El coro de luces | Memoria | Cinco secuencias, de tres a siete luces; sonido opcional. |
| Ventanas de colores | Memoria | Tres cuadrículas que se muestran y luego se ocultan. |
| Dos patios | Atención | Cinco diferencias entre dos cuadrículas de figuras. |
| ¿Dónde está? | Atención | Diez búsquedas entre distractores. |
| Tinta traviesa | Atención | Doce turnos de Stroop: responder al color, no a la palabra. |
| Cuentas del puesto | Números | Doce operaciones de suma, resta y multiplicación. |
| Sudoku de bolsillo | Lógica | Cuadrícula 4×4 con bloques 2×2 y solución única. |
| Letras entre hojas | Palabras | Seis palabras en una sopa 8×8, por primera y última letra. |
| Palabras revueltas | Palabras | Seis anagramas con tema; las letras repetidas conservan sus fichas. |
| Las nueve baldosas | Espacio | Rompecabezas de ocho fichas generado con movimientos legales. |
| Siluetas de fieltro | Espacio | Tangram de siete piezas: selección, giro y colocación; acepta intercambiar piezas iguales. |
| Las torres del patio | Espacio | Hanói de cuatro discos, tres torres y movimientos legales. |
| El camino del perrito | Espacio | Laberinto conectado, con flechas, teclado o toques vecinos. |
| La lista del mercado | Memoria | Recordar ocho productos y escogerlos entre dieciséis. |
| Dos pasos atrás | Memoria | N-back de dos posiciones, dos presentaciones y veintidós respuestas. |
| **Tabla de luciérnagas** (nuevo) | Atención | Tocar del 1 al 25 en orden en una tabla 5×5 barajada; cada número acertado se vuelve una luciérnaga. |
| **Apaga los faroles** (nuevo) | Lógica | Cada toque cambia el farol y sus vecinos. Dos tableros, 4×4 y 5×5, armados con toques desde el tablero apagado: siempre tienen solución. |
| **El candado de colores** (nuevo) | Lógica | Cuatro colores de seis (pueden repetirse) en ocho intentos, con pistas de «en su sitio» y «buen color, otro sitio». Si se acaban los intentos la partida termina sin completar y enseña la clave. |
| **¿Qué número sigue?** (nuevo) | Números | Ocho series con siete reglas: sumar, restar o multiplicar lo mismo, saltos alternos, cuadrados, suma de los dos anteriores y salto creciente. La regla se dice después de responder. |
| **La pieza que falta** (nuevo) | Lógica | Seis cuadros 3×3: la forma va por fila, el color por columna y la cantidad es fija o sigue un cuadro latino. Cuatro opciones; cada distractor falla en un solo rasgo, así que la respuesta es única. |
| **El dibujo escondido** (nuevo) | Lógica | Nonograma 5×5 con doce dibujos, modos «Pintar» y «Marcar vacía». Se gana cuando lo pintado cumple todas las pistas, y al final se dice qué dibujo era. |

Cada uno tiene un motor determinista. No se puede contestar durante una presentación de memoria. Las respuestas,
la selección y el generador de azar se conservan al guardar y continuar una partida. La pausa y el segundo plano
paran el reloj. Los perfiles de amigos y los roles de pareja conservan claves independientes.

**Dificultad:** los dieciséis juegos anteriores conservan sus reglas, rondas y puntuación. Ajustarlos (niveles,
rondas o tiempos) es un cambio de dificultad que necesita propuesta y aprobación de Javier.

**Sonido (26 de octubre de 2026):** diez pistas CC0 variadas que rotan barajadas desde el primer toque y efectos
propios (`patio_*`: acierto, error, ronda, ganó, y el golpe de cada juego: carta, ficha, disco, pieza, letra, paso).
Botón 🔊/🔇 en el menú y en la partida. Los juegos nuevos usan los mismos efectos: faroles con el de mover, candado
con el de carta y dibujo escondido con el de pieza.

## Presentación (1 de noviembre de 2026)

- **Portada:** el reto del día es una tarjeta grande con su categoría y la cuenta regresiva hasta la medianoche de
  Colombia. Debajo, filtros por categoría (el dispositivo recuerda el último en `patio-mente-filtro`), el total de
  estrellas y una tarjeta por juego con icono, categoría, estrellas y la etiqueta «Nuevo».
- **Partida:** la cabecera tiene la categoría, el reloj, el sonido y la pausa. El panel lateral muestra las reglas,
  una barra de avance y los aciertos y errores, y el tablero toma el color de la categoría. Cada casilla que cambia
  late, un acierto brilla, un error sacude el tablero y una ronda nueva destella. Con «reducir movimiento» del
  sistema no hay animaciones.
- **Final:** confeti al completar; estrellas según los puntos (3 desde 9.000, 2 desde 7.000, 1 al completar y
  0 si no se completa); tiempo, aciertos y errores; «Jugar otra vez» y «Volver al patio». El candado enseña su
  clave si no se abrió y el dibujo escondido dice qué dibujo era.
- **Mejores marcas:** la mejor cantidad de estrellas por juego se guarda en `mejores`, campo opcional del mismo
  guardado v1; los guardados anteriores cargan sin él.
- **Desplazamiento:** al cambiar de vista la página sube al inicio, y al volver a la portada recupera el punto
  donde estaba. Antes, al entrar desde una tarjeta de abajo, la cabecera tapaba el principio del tablero.
- **Teléfono horizontal (844×390):** los 22 tableros caben sin desplazar. En el candado el historial queda a un lado
  y los colores y botones al otro; en el dibujo escondido los modos van a la derecha; sudoku, tabla, búsqueda, sopa
  y coro se reducen un poco.

## Reto diario y clasificación

El día se calcula en `America/Bogota`; cambia a medianoche de Colombia. La rotación recorre los dieciséis juegos
originales antes de repetir (`JUEGOS_RETO` en `src/mente/catalogo.ts`), en el mismo orden y módulo que valida
`patio_publicar`. Los seis juegos nuevos quedan para práctica libre: sumarlos al reto exige cambiar y volver a aplicar
el SQL de la clasificación, o el servidor rechazaría las marcas de los días que no coincidan. Todos reciben el mismo
juego y semilla ese día. La práctica libre permite jugar cualquiera y no publica marcas. El resultado combina
precisión y tiempo; los errores reducen puntos, con máximo 10.000.

Al terminar el reto se guarda la marca local. Publicar requiere escribir un seudónimo y tocar el botón; un fallo
de red conserva el envío para reintentar. La tabla muestra las cien mejores marcas del día. Cada perfil conserva
solo su mejor puntuación, con menor tiempo como desempate.

**Habilitación del servidor:** el agente debe aplicar [patio-clasificacion.sql](../../supabase/patio-clasificacion.sql)
en el proyecto Supabase configurado cuando Javier conecte su cuenta mediante el plugin ofrecido. No se le pide
escribir SQL. Añade `patio_perfiles`, `patio_marcas`, `patio_tabla` y `patio_publicar`. RLS impide
leer los hashes de perfiles o escribir marcas directamente. La función de publicación comprueba el token del
perfil, el día de Colombia, el juego esperado y los rangos. La tabla solo devuelve seudónimo, puntos y tiempo.
Es una competición amistosa con resultados comunicados por el cliente, sin premios económicos ni certificación
contra manipulación de una aplicación modificada.

La consulta al servidor real devolvió `PGRST202` durante esta ampliación: las funciones todavía no estaban
instaladas. El archivo se probó en PostgreSQL temporal; no presentar esa prueba como despliegue real.

## Comprobaciones

Desde `juego/web/`:

```sh
node scripts/probar-mente-motor.mjs
CHROME_PATH=/usr/bin/chromium node scripts/probar-mente-visual.mjs http://127.0.0.1:5176/
CHROME_PATH=/usr/bin/chromium node scripts/probar-mente-interfaz.mjs http://127.0.0.1:4182/ test-results/mente
```

- `probar-mente-motor.mjs` completa los 22 juegos con tres semillas y revisa reanudación, acciones ilegales y
  medianoche de Colombia. También comprueba que el reto de 64 días seguidos coincide con el juego que espera
  `patio_publicar` y las reglas nuevas: faroles resolubles, series y piezas con una sola respuesta, pistas del
  candado, tabla en orden y dibujo por pistas.
- `probar-mente-visual.mjs` juega los 22 por controles reales con el piloto. Revisa estrellas y mejores marcas en
  la portada, filtros, el efecto de error y, en teléfono horizontal, que cada tablero empiece arriba y quepa bajo
  la cabecera. Deja capturas en `test-results/mente-visual/`. No usa la red.
- `probar-mente-interfaz.mjs` necesita la base temporal `patio-sql-prueba` (PostgreSQL en Docker) con los roles
  `anon`/`authenticated` y la migración aplicada. Intercepta únicamente sus RPC y los envía a esa base; no publica
  datos en Supabase real. El 1 de noviembre no se pudo ejecutar porque el entorno de trabajo no permitía Docker; sus
  selectores siguen presentes en la interfaz nueva.

El piloto (`scripts/mente-piloto.mjs`) usa el estado para encontrar acciones legales; no demuestra deducción de una
persona ni beneficios médicos, y los relojes adelantados no miden la dificultad. El SQL reproducible de permisos
está en [probar_patio.sql](../../supabase/pruebas/probar_patio.sql).

`scripts/probar-patio-accesos.mjs` comprueba ambos accesos desde casa, su retorno al patio conservando el perfil
y las dos tarjetas de la compilación de amigos. Requiere servir las dos compilaciones; sus URLs son argumentos.
