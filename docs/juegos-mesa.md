# Juegos de Mesa

Página `mesa.html` (código en `juego/web/src/mesa/`). Él contra Ella en cuatro juegos al estilo de Plato,
con los dos muñequitos arriba reaccionando a cada jugada.

## Modos

| Modo | Quién juega | Cómo |
|---|---|---|
| Contra la IA (`ia`) | Tú contra el otro personaje, que juega el celular | Dificultad: Suave, Normal, Sin piedad |
| Los dos aquí (`local`) | Los dos en el mismo celular, por turnos | Tu lado va abajo; el otro juega desde arriba |
| En línea (`linea`) | Cada uno en su celular | Misma casa en línea (Supabase). Canal Realtime `mesa-<pareja>` con presencia; si el otro no está en la mesa, le llega la invitación a la casa (evento `juego`) |

Premios (monedas para la casa, por el sueldo pendiente como en el súper y Cien Puertas): contra la IA 8 / 15 / 25
según la dificultad si ganas (2 si pierdes, 4 empate); los dos aquí 10; en línea 12 al que gana y 6 al otro.

## Estado

Los cuatro juegos están completos y probados en los tres modos (contra la IA, los dos aquí y en línea).

| Juego | IA difícil contra la fácil | Detalles |
|---|---|---|
| Dados Party | gana 82 % (promedia 254 puntos, casi el óptimo) | Expectimax sobre todas las formas de guardar dados |
| Mancala | gana 99,8 % | Alfa-beta con turnos extra y final exacto |
| Puntos y Cajas | gana 99,8 % | Jugada maestra (regalar las dos últimas de una cadena) y final resuelto |
| Parchís | gana 95 % | Expectimax sobre el dado del otro (el parchís es mucha suerte) |

`node scripts/probar-mesa-linea.mjs <juego>` juega una partida completa entre dos celulares con un Supabase de
mentiras que pierde el 8 % de los mensajes: los cuatro terminan con el mismo estado en los dos.

## Pruebas

`mesa.html?juego=dados&modo=local&rol=el&empieza=el&semilla=7&rapido=4` entra directo a una partida.
`window.__mesa.estado` es el estado actual; `window.__mesa.partida` la partida.

## Contrato de un juego (`src/mesa/tipos.ts`)

- `reglas`: puras y deterministas (`inicial`, `turno`, `movimientos`, `aplicar`, `puntos`, `fin`). El azar
  (dados) viaja dentro del movimiento: lo tira quien juega, así los dos celulares llegan al mismo estado.
- `ia(e, nivel, azar)`: elige el movimiento del que tiene el turno.
- `crearVista(ctx)`: pinta el tablero en `ctx.raiz`, deja jugar al humano (`permitir(quien)`), manda el
  movimiento con `ctx.jugar(m)`, anima cada movimiento (`animar(antes, m, despues)`) y avisa los sucesos
  (`ctx.suceso(...)`) en el momento justo para que reaccionen los muñequitos.

## Reglas

### Dados Party (Dice Party)

Dos jugadores, 5 dados, 13 turnos cada uno; gana el de más puntos al final.

- En tu turno tiras los 5 dados. Hasta 3 tiradas en total; entre tiradas puedes «guardar» (bloquear) cualquier
  cantidad de dados tocándolos (se desbloquean tocándolos otra vez). «Tirar» vuelve a tirar los no guardados.
- Solo se anota una combinación por turno, también una que dé 0. Después de la primera tirada, en cualquier
  momento se elige la combinación tocando su puntuación posible y se confirma con «Jugar».
- Sección superior: Unos … Seises = suma de los dados de ese valor (6,6,1,3,6 en Seises = 18).
- Sección inferior:
  - Trío: al menos 3 iguales → suma de los 5 dados (1,4,4,4,5 = 18).
  - Póker: al menos 4 iguales → suma de los 5 dados (2,2,4,2,2 = 12).
  - Full: 3 iguales + 2 iguales de otro número → 25. Cinco iguales NO cuentan como Full (salvo comodín).
  - Escalera pequeña: 4 en secuencia → 30. Escalera grande: 5 en secuencia → 40.
  - 5 iguales → 50. Chance: suma de los 5 dados.
- Bonificación superior: más de 62 puntos en la sección superior → +35.
- Bonificación de 5 iguales: si sacas 5 iguales y ya anotaste 5 iguales con 50 → +100. Si lo anotaste con 0,
  no hay bonificación. Con un 5 iguales cuando la casilla de 5 iguales ya está usada (con 50 o con 0):
  - No se puede seguir tirando aunque queden tiradas: hay que anotar ya.
  - Si la casilla superior del número está libre, hay que usar esa.
  - Si ya se usó, hay que usar una de la sección inferior; el 5 iguales es comodín: Full, Escalera pequeña y
    Escalera grande valen 25, 30 y 40.
  - Si la superior del número y toda la inferior ya están usadas, se usa una superior libre, que vale 0.

### Mancala

- Dos filas de 6 hoyos y un almacén (granero) en cada extremo. Empieza con 4 semillas en cada hoyo.
- En tu turno eliges un hoyo de tu lado con semillas, tomas todas y siembras una por hoyo en sentido antihorario.
- Si pasas por tu almacén dejas una semilla; si pasas por el del otro, lo saltas.
- Si la última semilla cae en tu almacén, juegas otra vez.
- Si la última cae en un hoyo vacío de tu lado, te llevas esa semilla y las del hoyo de enfrente a tu almacén.
- La partida termina cuando los hoyos de un jugador quedan todos vacíos; el otro se lleva lo que quede en sus
  hoyos. Gana el de más semillas en su almacén.

### Puntos y Cajas

- Por turnos, cada uno une dos puntos vecinos (horizontal o vertical) con una línea.
- Quien pone la cuarta línea de una caja se la lleva (sin importar quién puso las otras) y vuelve a jugar.
- Termina cuando no quedan líneas por poner; gana el de más cajas.

### Parchís (para dos)

Parchís clásico adaptado a dos: cada uno juega un color (esquinas opuestas) con 4 fichas y un dado.

- Se sale de casa con un 5 (si hay fichas en casa y sale 5, es obligatorio sacar una si la salida lo permite).
- Seis: repite turno. Si ya no tiene fichas en casa, el 6 cuenta 7. Tres seises seguidos: la última ficha movida
  vuelve a casa (salvo si ya está en el pasillo de llegada).
- Comer: caer en una casilla normal donde hay una ficha del otro la manda a casa, y quien come cuenta 20 con
  una de sus fichas. En los seguros no se come (salvo la salida del otro, donde quien sale come).
- Llegar a la meta (con la cuenta exacta) da 10 para contar con otra ficha.
- Barrera: dos fichas del mismo color en una casilla no dejan pasar a nadie. Con un 6, hay que abrir la
  barrera propia si se puede.
- Gana quien meta primero sus 4 fichas.
- El dado se ve desde arriba y **el número que salió es la cara de arriba**, como en la mesa de verdad.

**Con dos colores cada uno** (al tocar Parchís se elige «1 color» o «2 colores»; en el código es el juego
`parchis2`, así viaja igual en línea y en las partidas guardadas):

- Él juega azul y amarillo, Ella rosado y verde: 8 fichas cada uno, las cuatro casas juegan. Gana quien meta las 8.
- Se tiran **dos dados que caen al centro del tablero** (desde el lado de quien tira) y quedan con su número
  arriba. Cada dado mueve una ficha (la misma o distintas, de cualquiera de los dos colores). Se toca un dado
  para elegir con cuál se mueve (arranca elegido el más alto; el usado se apaga).
- Se sale con un 5 en un dado (obligatorio con ese dado si la salida lo permite) o si los dos **suman 5** (se
  gastan los dos).
- **Par:** se vuelve a tirar; con tres pares seguidos la última ficha movida vuelve a casa. El 6 no cuenta 7 y
  no hay que abrir barreras.
- Comer da 20 y llegar a la meta 10, y se cuentan antes del dado que falte. Dos fichas del mismo jugador (aunque
  sean de sus dos colores) hacen barrera; cada color tiene su propio pasillo.
- IA: igual que con un color; «Sin piedad» juega como «Normal» (ya piensa la jugada de sus dos dados).
